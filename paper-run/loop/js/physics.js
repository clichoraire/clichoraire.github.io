// Paper Loop — physique de plateforme, sans dépendance au navigateur (aussi utilisée par tools/test-levels.cjs).
// Carte ASCII : # bloc, - plateforme traversable, o pièce, * grosse pièce, ^ punaises, ~ encre (mortelle),
// S départ, F drapeau d'arrivée, c drapeau de passage, s ressort, m plateforme mobile (horizontale),
// n plateforme mobile (verticale), % mur de papier (déchirable avec les Ciseaux), e ennemi marcheur,
// f avion de papier, ? cube d'objet, T arbre et B buisson (décor), espace ou . : vide.
(function (root) {
  'use strict';
  const PL = root.PL = root.PL || {};
  const T = 48;
  const C = PL.PHYS = {
    T, W: 28, H: 56,
    GRAV: 2100, MAXFALL: 950,          // Paper Loop : chute plus douce que Paper Run (2500 / 1150)
    FLOAT_V: 150, FLOAT_MUL: 0.55,     // au sommet du saut (|vy| < FLOAT_V) la gravité est réduite : on flotte un instant
    RUN: 300, ACC: 2800, AIRACC: 2000, FRIC: 3200,
    JUMP: 825, JUMP_CUT: 0.45, COYOTE: 0.1, BUFFER: 0.12, DOUBLE: 0.9,   // saut 825 : 825²/(2·2100) ≈ 162 px, même hauteur qu'avant (900 avec 2500)
    SPRING: 1500, ENEMY_BOUNCE: 700,
    DASH_V: 660, DASH_T: 0.16, DASH_CD: [0.7, 0.45, 0.25],
    WALL_SLIDE: 170, WALL_COYOTE: 0.12, WALLJUMP_X: 380, WALLJUMP_Y: 820,
    GLIDE: 150,
    STEP: 1 / 60,
  };
  const EMPTY = 0, SOLID = 1, ONEWAY = 2, SPIKE = 3, INK = 4, SPRING = 5, PAPER = 6, SPIKE_D = 7, SPIKE_L = 8, SPIKE_R = 9;
  PL.TILE = { EMPTY, SOLID, ONEWAY, SPIKE, INK, SPRING, PAPER, SPIKE_D, SPIKE_L, SPIKE_R };   // SPIKE_D : pointes vers le bas (plafond) ; SPIKE_L / SPIKE_R : pointes vers la gauche / la droite (murs)

  // ---- lecture d'un tableau
  PL.parseLevel = function (def) {
    const rows = def.map.map(r => r.replace(/\./g, ' '));
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const grid = new Uint8Array(w * h);
    const lvl = { def, id: def.id, w, h, grid, start: null, finish: null, checkpoints: [], coins: [], items: [], movers: [], enemies: [], decor: [], breakIdx: new Map(), breakables: [] };
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? ' ' : (rows[y][x] || ' ');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = at(x, y), i = y * w + x, px = x * T, py = y * T;
      switch (ch) {
        case '#': grid[i] = SOLID; break;
        case '-': grid[i] = ONEWAY; break;
        case '^': grid[i] = SPIKE; break;
        case 'v': grid[i] = SPIKE_D; break;
        case '<': grid[i] = SPIKE_L; break;
        case '>': grid[i] = SPIKE_R; break;
        case '~': grid[i] = INK; break;
        case 's': grid[i] = SPRING; break;
        case '%': grid[i] = PAPER; lvl.breakIdx.set(i, lvl.breakables.length); lvl.breakables.push({ x, y }); break;
        case 'o': lvl.coins.push({ x: px + T / 2, y: py + T / 2, big: false }); break;
        case '*': lvl.coins.push({ x: px + T / 2, y: py + T / 2, big: true }); break;
        case 'S': lvl.start = { x: px + (T - C.W) / 2, y: py + T - C.H }; break;
        case 'F': lvl.finish = { x: px, y: py, tx: x, ty: y }; break;
        case 'c': lvl.checkpoints.push({ x: px + (T - C.W) / 2, y: py + T - C.H, tx: x, ty: y }); break;
        case 'e': lvl.enemies.push({ kind: 'walker', x: px + T / 2, y: py + T }); break;
        case 'f': lvl.enemies.push({ kind: 'plane', x: px + T / 2, y: py + T / 2 }); break;
        case 'T': lvl.decor.push({ kind: 'tree', x: px + T / 2, y: py + T }); break;
        case 'B': lvl.decor.push({ kind: 'bush', x: px + T / 2, y: py + T }); break;
        case '?': lvl.items.push({ x: px + T / 2, y: py + T / 2 }); break;
        case 'm': case 'n': {
          // La plateforme (2 cases de large) va jusqu'au premier bloc, au plus 5 cases.
          const vertical = ch === 'n'; let range = 0;
          for (let k = 1; k <= 5; k++) {
            const nx = vertical ? x : x + k, ny = vertical ? y - k : y;
            const blocked = vertical ? ('#%s'.includes(at(nx, ny)) || '#%s'.includes(at(nx + 1, ny))) : '#%s'.includes(at(nx + 1, ny));
            if (blocked) break; range = k;
          }
          const px0 = px, py0 = py + T * 0.5;
          const period = Math.max(1.6, 2 * (range * T) / (1.7 * T));
          lvl.movers.push({ x0: px0, y0: py0, w: 2 * T, h: T * 0.5, vertical, range: range * T, period });
          break;
        }
        default: break;
      }
    }
    if (!lvl.start) lvl.start = { x: T, y: (h - 2) * T - C.H };
    lvl.pw = w * T; lvl.ph = h * T;
    return lvl;
  };

  PL.moverPos = function (m, t) {
    const s = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / m.period);
    return m.vertical ? { x: m.x0, y: m.y0 - s * m.range } : { x: m.x0 + s * m.range, y: m.y0 };
  };

  // ---- état du joueur
  PL.newState = function (lvl) {
    return { x: lvl.start.x, y: lvl.start.y, w: C.W, h: C.H, vx: 0, vy: 0, face: 1, ground: false, coyote: 0, buf: 0, jumps: 0, held: false,
      dashT: 0, dashCd: 0, dashing: false, wallDir: 0, wallT: 0, carrier: -1, carrierX: 0, carrierY: 0, t: 0, broken: 0,
      cp: -1, deaths: 0, dead: 0, win: false, hurtT: 0, shield: 0, coins: 0, got: 0, jumpedFrom: 0, jumpAge: 0, bounce: 0, sliding: false, stun: 0, slow: 0, boost: 0 };
  };

  // cfg : { speed, jump, double, dashLevel (0 = aucun), wall, glide, ciseaux, dashMul }
  PL.defaultCfg = () => ({ speed: 1, jump: 1, double: false, dashLevel: 0, dashMul: 1, wall: false, glide: false, ciseaux: false });

  const cell = (lvl, st, cx, cy) => {
    if (cx < 0 || cx >= lvl.w) return SOLID;        // murs invisibles aux deux bouts
    if (cy < 0) return EMPTY; if (cy >= lvl.h) return EMPTY;
    const i = cy * lvl.w + cx, v = lvl.grid[i];
    if (v === PAPER) { const k = lvl.breakIdx.get(i); return (st.broken >> k) & 1 ? EMPTY : PAPER; }
    return v;
  };
  PL.cellAt = cell;

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  PL.overlap = overlap;

  function respawn(st, lvl) {
    const p = st.cp >= 0 ? lvl.checkpoints[st.cp] : lvl.start;
    st.x = p.x; st.y = p.y; st.vx = 0; st.vy = 0; st.ground = false; st.dashT = 0; st.dashing = false; st.carrier = -1; st.jumps = 0;
  }
  PL.respawn = respawn;

  // Blessure : bouclier, sinon retour au dernier drapeau.
  PL.hurt = function (st, lvl) {
    if (st.hurtT > 0) return false;
    if (st.shield > 0) { st.shield--; st.hurtT = 1.2; st.vy = -400; return 'shield'; }
    st.deaths++; st.dead = 0.6; st.hurtT = 0.8; respawn(st, lvl); return 'dead';
  };

  // Un pas de simulation (dt ≤ 1/60). inp : { dir: -1|0|1, jump (appui cette frame), jumpHeld, dash (appui) }
  PL.step = function (st, inp, dt, lvl, cfg) {
    st.t += dt;
    if (st.win) return;
    if (st.dead > 0) { st.dead -= dt; return; }
    if (st.hurtT > 0) st.hurtT -= dt;
    // Objets de course : étourdi (plus de commandes), colle (ralenti), fusée (plus vite).
    if (st.stun > 0) { st.stun -= dt; inp = { dir: 0, jump: false, jumpHeld: false, dash: false }; }
    if (st.slow > 0) st.slow -= dt; if (st.boost > 0) st.boost -= dt;
    const speedMul = (st.boost > 0 ? 1.5 : 1) * (st.slow > 0 ? 0.45 : 1);
    // plateforme porteuse : on suit son déplacement
    if (st.carrier >= 0) {
      const m = lvl.movers[st.carrier], p = PL.moverPos(m, st.t);
      st.x += p.x - st.carrierX; st.y += p.y - st.carrierY; st.carrierX = p.x; st.carrierY = p.y;
    }
    const run = C.RUN * cfg.speed * speedMul, jumpV = C.JUMP * cfg.jump;
    // --- horizontal
    if (st.dashT > 0) { st.dashT -= dt; if (st.dashT <= 0) { st.dashing = false; st.vx = st.face * run; } }
    else {
      const target = inp.dir * run;
      const acc = st.ground ? (inp.dir ? C.ACC : C.FRIC) : C.AIRACC;
      if (st.vx < target) st.vx = Math.min(target, st.vx + acc * dt); else if (st.vx > target) st.vx = Math.max(target, st.vx - acc * dt);
      if (inp.dir) st.face = inp.dir;
    }
    if (st.dashCd > 0) st.dashCd -= dt;
    if (inp.dash && cfg.dashLevel > 0 && st.dashCd <= 0 && st.dashT <= 0) {
      st.dashT = C.DASH_T * cfg.dashMul; st.dashCd = C.DASH_CD[Math.min(cfg.dashLevel, 3) - 1] + st.dashT; st.dashing = true;
      st.vx = st.face * C.DASH_V * (st.boost > 0 ? 1.3 : 1); st.vy = 0; st.carrier = -1;
    }
    // --- saut
    if (inp.jump) st.buf = C.BUFFER;
    if (st.coyote > 0) st.coyote -= dt; if (st.wallT > 0) st.wallT -= dt;
    if (st.buf > 0) {
      if (st.coyote > 0) { st.vy = -jumpV; st.ground = false; st.coyote = 0; st.buf = 0; st.held = true; st.jumpAge = 0; st.carrier = -1; st.jumps = 0; st.jumpedFrom = 1; }
      else if (cfg.wall && st.wallT > 0 && !st.ground) { st.vy = -C.WALLJUMP_Y * cfg.jump; st.vx = -st.wallDir * C.WALLJUMP_X; st.face = -st.wallDir; st.wallT = 0; st.buf = 0; st.held = true; st.jumpAge = 0; st.jumps = 0; st.jumpedFrom = 2; }
      else if (cfg.double && st.jumps < 1 && !st.ground) { st.vy = -jumpV * C.DOUBLE; st.jumps++; st.buf = 0; st.held = true; st.jumpAge = 0; st.dashT = 0; st.dashing = false; st.jumpedFrom = 3; }
    }
    if (st.buf > 0) st.buf -= dt;
    if (st.held) st.jumpAge += dt;
    // Relâcher coupe le saut, mais jamais avant 0,06 s : un appui très bref donne quand même un vrai petit saut.
    if (st.held && !inp.jumpHeld && st.jumpAge >= 0.06) { st.held = false; if (st.vy < 0) st.vy *= C.JUMP_CUT; }
    // --- gravité
    if (st.dashT <= 0) {
      const grav = (!st.ground && Math.abs(st.vy) < C.FLOAT_V) ? C.GRAV * C.FLOAT_MUL : C.GRAV;   // petit flottement au sommet
      st.vy = Math.min(C.MAXFALL, st.vy + grav * dt);
      if (cfg.glide && inp.jumpHeld && !st.held && st.vy > C.GLIDE && !st.ground) { st.vy = C.GLIDE; st.gliding = true; } else st.gliding = false;
      if (st.sliding && st.vy > C.WALL_SLIDE) st.vy = C.WALL_SLIDE;
    }
    // --- déplacement X
    st.sliding = false;
    let nx = st.x + st.vx * dt;
    if (st.vx !== 0) {
      const dir = st.vx > 0 ? 1 : -1, edge = dir > 0 ? nx + st.w : nx, cx = Math.floor(edge / T);
      const y0 = Math.floor(st.y / T), y1 = Math.floor((st.y + st.h - 1) / T);
      let hit = false;
      for (let cy = y0; cy <= y1; cy++) {
        const v = cell(lvl, st, cx, cy);
        if (v === SOLID) hit = true;                               // le ressort se traverse en courant : on ne l'active qu'en retombant dessus
        else if (v === PAPER) { if (cfg.ciseaux) st.broken |= 1 << lvl.breakIdx.get(cy * lvl.w + cx); else hit = true; }
      }
      if (hit) {
        nx = dir > 0 ? cx * T - st.w : (cx + 1) * T;
        if (!st.ground && cfg.wall && st.vy > 0 && inp.dir === dir) { st.sliding = true; st.jumps = 0; }
        if (!st.ground) { st.wallDir = dir; st.wallT = C.WALL_COYOTE; }
        st.vx = 0; st.dashT = 0; st.dashing = false;
      }
    }
    st.x = nx;
    // --- déplacement Y
    const prevBottom = st.y + st.h;
    let ny = st.y + st.vy * dt;
    const wasGround = st.ground; st.ground = false;
    if (st.vy !== 0 || true) {
      const down = st.vy >= 0, edge = down ? ny + st.h : ny, cy = Math.floor(edge / T);
      const x0 = Math.floor(st.x / T), x1 = Math.floor((st.x + st.w - 1) / T);
      let hit = false, spring = false;
      for (let cx = x0; cx <= x1; cx++) {
        const v = cell(lvl, st, cx, cy);
        if (v === SOLID || v === PAPER) hit = true;
        else if (v === SPRING && down && prevBottom <= cy * T + 1) { hit = true; spring = true; }
        else if (v === ONEWAY && down && prevBottom <= cy * T + 1) hit = true;
      }
      if (hit) {
        if (down) { ny = cy * T - st.h; st.ground = true; st.coyote = C.COYOTE; st.jumps = 0; st.carrier = -1; st.vy = 0; if (spring) { st.vy = -C.SPRING; st.ground = false; st.bounce = 0.3; st.held = false; } }
        else { ny = (cy + 1) * T; st.vy = 0; st.held = false; }
      }
      // plateformes mobiles : on n'y atterrit que par le dessus
      if (down && !hit) {
        for (let k = 0; k < lvl.movers.length; k++) {
          const m = lvl.movers[k], p = PL.moverPos(m, st.t);
          if (st.x + st.w > p.x && st.x < p.x + m.w && prevBottom <= p.y + 6 && ny + st.h >= p.y) {
            ny = p.y - st.h; st.ground = true; st.coyote = C.COYOTE; st.jumps = 0; st.vy = 0; st.carrier = k; st.carrierX = p.x; st.carrierY = p.y; break;
          }
        }
      }
    }
    st.y = ny;
    if (st.bounce > 0) st.bounce -= dt;
    // --- dangers
    if (st.y > lvl.ph + 2 * T) { PL.hurt(st, lvl); return; }
    const bx0 = Math.floor(st.x / T), bx1 = Math.floor((st.x + st.w - 1) / T), by0 = Math.floor(st.y / T), by1 = Math.floor((st.y + st.h - 1) / T);
    for (let cy = by0; cy <= by1; cy++) for (let cx = bx0; cx <= bx1; cx++) {
      const v = cell(lvl, st, cx, cy);
      // zone qui blesse : le côté de la base des pointes (on peut frôler le bout des pointes)
      const hb = v === SPIKE ? { x: cx * T + 8, y: cy * T + T * 0.45, w: T - 16, h: T * 0.55 } : v === SPIKE_D ? { x: cx * T + 8, y: cy * T, w: T - 16, h: T * 0.55 }
        : v === SPIKE_L ? { x: cx * T + T * 0.45, y: cy * T + 8, w: T * 0.55, h: T - 16 } : v === SPIKE_R ? { x: cx * T, y: cy * T + 8, w: T * 0.55, h: T - 16 } : null;
      if (hb && overlap(st, hb)) { PL.hurt(st, lvl); return; }
      if (v === INK && st.y + st.h > cy * T + T * 0.35) { PL.hurt(st, lvl); return; }
    }
    // --- drapeaux
    for (let k = 0; k < lvl.checkpoints.length; k++) {
      const c = lvl.checkpoints[k];
      if (k > st.cp && Math.abs((st.x + st.w / 2) - (c.tx * T + T / 2)) < T * 0.6 && st.y + st.h > (c.ty - 2) * T && st.y < (c.ty + 1) * T) st.cp = k;
    }
    const f = lvl.finish;
    if (f && st.x + st.w > f.x + 4 && st.x < f.x + T - 4 && st.y + st.h > (f.ty - 3) * T && st.y < (f.ty + 1) * T) st.win = true;
  };

  // Avance de dt quelconque en pas de 1/60 s au plus.
  PL.advance = function (st, inp, dt, lvl, cfg) {
    let n = Math.max(1, Math.ceil(dt / C.STEP - 1e-9)); const h = dt / n;
    for (let i = 0; i < n; i++) { PL.step(st, inp, h, lvl, cfg); inp = Object.assign({}, inp, { jump: false, dash: false }); }
  };

  // Mesures utiles pour le design : hauteur et portée de saut.
  // Configuration physique à partir des pouvoirs (niveaux par id) et des avantages d'un personnage.
  PL.buildCfg = function (powers, mods = {}) {
    const lv = id => powers[id] || 0;
    const cfg = PL.defaultCfg();
    cfg.speed = 1 + 0.08 * lv('course') + (mods.speed || 0);
    cfg.jump = 1 + 0.08 * lv('ressort') + (mods.jump || 0);
    cfg.double = lv('double') > 0; cfg.dashLevel = lv('elan'); cfg.dashMul = 1 + (mods.dash || 0);
    cfg.wall = lv('ruban') > 0; cfg.glide = lv('parachute') > 0; cfg.ciseaux = lv('ciseaux') > 0;
    cfg.magnet = Math.max(lv('aimant'), mods.magnet ? 1 : 0); cfg.shield = (lv('bouclier') > 0 ? 1 : 0) + (mods.shield || 0);
    cfg.slow = mods.slow || 0;
    return cfg;
  };
  PL.stun = function (st, secs) { if (st.stun > 0 && st.stun >= secs) return; st.stun = secs; st.vx *= 0.3; st.dashT = 0; st.dashing = false; st.boost = 0; };
  PL.jumpHeight = (cfg = PL.defaultCfg()) => (C.JUMP * cfg.jump) ** 2 / (2 * C.GRAV);
  PL.jumpRange = (cfg = PL.defaultCfg()) => 2 * (C.JUMP * cfg.jump) / C.GRAV * C.RUN * cfg.speed;

  if (typeof module !== 'undefined') module.exports = PL;
})(typeof window !== 'undefined' ? window : globalThis);
