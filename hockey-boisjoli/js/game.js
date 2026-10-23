// Simulation du match : patineurs, gardiens, rondelle, règles et pouvoirs. Aucun affichage ici.
(function (HK) {
  'use strict';
  const R = HK.RINK, G = HK.GOAL, PR = HK.PUCK_R;
  const CX = R.x + R.w / 2, CY = R.y + R.h / 2;
  HK.CX = CX; HK.CY = CY;
  HK.goalX = side => side < 0 ? R.x + G.line : R.x + R.w - G.line;   // side -1 = filet de gauche
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  HK.dist = dist; HK.clamp = clamp;

  // Générateur pseudo-aléatoire reproductible (mulberry32).
  HK.makeRand = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };

  // Distance signée à la bande (patinoire = rectangle à coins arrondis), pour un objet de rayon `inset`.
  // d > 0 : l'objet dépasse de d px ; (nx, ny) = normale vers l'extérieur.
  HK.rinkBound = function (x, y, inset) {
    const cr = Math.max(1, R.r - inset);
    const cx = clamp(x, R.x + R.r, R.x + R.w - R.r), cy = clamp(y, R.y + R.r, R.y + R.h - R.r);
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d === 0) return { d: -cr, nx: 0, ny: 0 };
    return { d: d - cr, nx: dx / d, ny: dy / d };
  };
  // Boîte du filet du côté `side` (derrière la ligne de but).
  HK.netBox = function (side) {
    const gx = HK.goalX(side), hm = G.mouth / 2;
    return { x0: side < 0 ? gx - G.depth : gx, x1: side < 0 ? gx : gx + G.depth, y0: CY - hm, y1: CY + hm, gx };
  };

  class Game {
    constructor(o) {
      this.o = o;
      this.rand = HK.makeRand(o.seed || (Date.now() & 0xffffffff));
      this.periodLen = o.periodLen || 120;
      this.difficulty = o.difficulty == null ? 1 : o.difficulty;
      this.ctrl = o.ctrl || ['p1', 'cpu'];           // 'p1' | 'p2' | 'cpu' pour chaque équipe
      this.teams = [this.makeTeam(o.teams[0], 0), this.makeTeam(o.teams[1], 1)];
      this.puck = { x: CX, y: CY, vx: 0, vy: 0, owner: null, lastOwner: null, prevOwner: null, noPick: null, noPickT: 0, protect: 0, hard: false, inNet: false, trail: [] };
      this.period = 1; this.clock = this.periodLen; this.ot = false; this.t = 0;
      this.phase = 'faceoff'; this.phaseT = 0;
      this.events = []; this.fx = []; this.scorers = [];
      this.controlled = [null, null]; this.switchLock = [0, 0]; this.human = [null, null]; this.hPrev = [{}, {}];
      this.lastGoal = null; this.winner = -1;
      this.setupFaceoff(true);
    }
    ev(e) { this.events.push(e); }
    takeEvents() { const e = this.events; this.events = []; return e; }

    makeTeam(def, i) {
      const T = { i, def, side: i === 0 ? -1 : 1, score: 0, shots: 0, hits: 0, skaters: [], bench: [], goalie: null, all: [] };
      def.players.forEach((pid, k) => {
        const s = this.makeSkater(pid, i); T.all.push(s);
        if (k < HK.ON_ICE) { s.onIce = true; T.skaters.push(s); } else T.bench.push(s);
      });
      T.goalie = { team: i, x: 0, y: 0, vy: 0, w: 26, h: 40, down: 0, slowT: 0, slowM: 1, err: 0, errT: 0, reactT: 0, coverT: 0, saves: 0, anim: 0, skill: 0.75, dir: 1 };
      return T;
    }
    makeSkater(pid, team) {
      const d = HK.PLAYERS[pid], ph = HK.phys(d);
      return Object.assign({
        id: pid, def: d, team, x: 0, y: 0, vx: 0, vy: 0, face: 0, dir: 1, r: 7 + 7 * d.size, onIce: false,
        down: 0, stun: 0, stunKind: '', shield: 0, ghost: 0, boostT: 0, boostM: 1, slowT: 0, slowM: 1, slowKind: '', buff: 0, slap: 0, magnet: 0, slide: 0,
        immune: 0, cd: 0, charge: -1, lunge: 0, lungeCd: 0, stamina: 1, anim: 0, input: {}, prev: {},
        ai: { t: 0, tx: 0, ty: 0, shootT: 0, act: null, want: 0 },
        stats: { goals: 0, assists: 0, shots: 0, hits: 0, powers: 0, passes: 0 },
      }, ph);
    }
    skatersOnIce() { return this.teams[0].skaters.concat(this.teams[1].skaters); }
    clearStatus(s) {
      s.down = 0; s.stun = 0; s.shield = 0; s.ghost = 0; s.boostT = 0; s.slowT = 0; s.buff = 0; s.magnet = 0; s.slide = 0;
      s.lunge = 0; s.charge = -1; s.immune = 0; s.input = {}; s.prev = {}; s.ai.shootT = 0; s.ai.act = null; s.ai.t = 0;
    }

    // ----- Mise au jeu, périodes -----
    setupFaceoff(first) {
      this.lineChanges();
      const p = this.puck;
      p.x = CX; p.y = CY; p.vx = p.vy = 0; p.owner = null; p.noPick = null; p.noPickT = 0; p.protect = 0; p.hard = false; p.inNet = false; p.lastOwner = p.prevOwner = null; p.trail = [];
      const spots = [[-26, 0], [-120, -120], [-250, 70]];
      for (const T of this.teams) {
        const dir = -T.side;
        T.skaters.forEach((s, k) => {
          const sp = spots[k] || [-200, 0];
          s.x = CX + dir * sp[0]; s.y = CY + sp[1]; s.vx = s.vy = 0; s.face = dir > 0 ? 0 : Math.PI; s.dir = dir;
          this.clearStatus(s);
        });
        const g = T.goalie; g.x = HK.goalX(T.side) - T.side * 12; g.y = CY; g.vy = 0; g.down = 0; g.slowT = 0; g.coverT = 0; g.dir = -T.side;
      }
      this.phase = 'faceoff'; this.phaseT = first ? 2.2 : 1.6;
      this.controlled = [null, null]; this.switchLock = [0, 0];
      this.ev({ type: 'faceoff' });
    }
    lineChanges() {
      for (const T of this.teams) {
        if (!T.bench.length) continue;
        const tired = T.skaters.reduce((a, s) => s.stamina < a.stamina ? s : a);
        const fresh = T.bench.reduce((a, s) => s.stamina > a.stamina ? s : a);
        if (fresh.stamina > tired.stamina + 0.3) {
          T.skaters[T.skaters.indexOf(tired)] = fresh; T.bench[T.bench.indexOf(fresh)] = tired;
          fresh.onIce = true; tired.onIce = false; this.clearStatus(tired);
          if (this.puck.owner === tired) this.puck.owner = null;
          this.ev({ type: 'change', team: T.i, inn: fresh, out: tired });
        }
      }
    }
    endPeriod() {
      this.phase = 'periodEnd'; this.phaseT = 3; this.ev({ type: 'periodEnd', period: this.period });
    }
    nextPeriod() {
      this.period++;
      for (const T of this.teams) { T.side = -T.side; for (const s of T.all) s.stamina = Math.min(1, s.stamina + 0.35); }
      if (this.period > HK.PERIODS) {
        if (this.teams[0].score === this.teams[1].score) { this.ot = true; this.clock = 0; }
        else { this.gameOver(); return; }
      } else this.clock = this.periodLen;
      this.setupFaceoff();
    }
    gameOver() {
      this.phase = 'over';
      this.winner = this.teams[0].score > this.teams[1].score ? 0 : this.teams[1].score > this.teams[0].score ? 1 : -1;
      this.ev({ type: 'over', winner: this.winner });
    }
    clockText() {
      const t = Math.max(0, this.ot ? this.clock : Math.ceil(this.clock));
      const m = Math.floor(t / 60), s = Math.floor(t % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }
    periodText() {
      if (this.ot) return 'PROLONGATION';
      return ['', '1re', '2e', '3e'][this.period] + ' PÉRIODE';
    }

    // ----- Boucle -----
    update(dt) {
      this.t += dt;
      for (const T of this.teams) { for (const s of T.all) this.tickStatus(s, dt); const g = T.goalie; g.down -= dt; g.slowT -= dt; g.anim += dt; }
      for (let i = this.fx.length - 1; i >= 0; i--) { this.fx[i].t -= dt; if (this.fx[i].t <= 0) this.fx.splice(i, 1); }
      this.switchLock[0] -= dt; this.switchLock[1] -= dt;
      if (this.phase === 'faceoff') {
        this.phaseT -= dt;
        if (this.phaseT <= 0) { this.phase = 'play'; this.puck.vx = (this.rand() - 0.5) * 90; this.puck.vy = (this.rand() - 0.5) * 90; this.ev({ type: 'whistle' }); }
        return;
      }
      if (this.phase === 'play') { this.playStep(dt); return; }
      if (this.phase === 'goal' || this.phase === 'periodEnd') {
        this.phaseT -= dt; this.glide(dt);
        if (this.phaseT <= 0) {
          if (this.phase === 'goal') { if (this.ot) this.gameOver(); else this.setupFaceoff(); }
          else this.nextPeriod();
        }
      }
    }
    tickStatus(s, dt) {
      if (s.down > 0) { s.down -= dt; if (s.down <= 0) s.immune = 0.5; }
      if (s.stun > 0) { s.stun -= dt; if (s.stun <= 0) s.immune = 0.3; }
      s.shield -= dt; s.ghost -= dt; s.boostT -= dt; s.slowT -= dt; s.buff -= dt; s.slap -= dt; s.magnet -= dt; s.slide -= dt;
      s.immune -= dt; s.cd -= dt; s.lunge -= dt; s.lungeCd -= dt;
      if (this.phase === 'play') {
        if (s.onIce) s.stamina = Math.max(0.15, s.stamina - dt / 100);
        else s.stamina = Math.min(1, s.stamina + dt / 25);
      }
    }
    speedMult(s) {
      return (s.boostT > 0 ? s.boostM : 1) * (s.slowT > 0 ? s.slowM : 1) * (s.buff > 0 ? 1.25 : 1) * (0.85 + 0.15 * s.stamina) * (this.puck.owner === s ? 0.94 : 1);
    }

    // Entrée d'un joueur humain pour l'équipe i : {dx, dy, a, b, p}.
    setHuman(i, inp) { this.human[i] = inp; }

    updateControlled(i, h) {
      const T = this.teams[i], p = this.puck; let c = this.controlled[i];
      if (c && !c.onIce) c = null;
      if (p.owner && p.owner.team === i) c = p.owner;
      else {
        const aEdge = h.a && !this.hPrev[i].a;
        if (aEdge && c) {
          const list = T.skaters.filter(s => s.down <= 0); const k = list.indexOf(c); c = list[(k + 1) % list.length] || c; this.switchLock[i] = 1.2;
          this.ev({ type: 'switch', team: i, s: c });
        } else if (this.switchLock[i] <= 0 || !c || c.down > 0) {
          const px = p.x + p.vx * 0.25, py = p.y + p.vy * 0.25;
          let best = c && c.down <= 0 ? c : null, bd = best ? Math.hypot(best.x - px, best.y - py) - 50 : 1e9;
          for (const s of T.skaters) { if (s.down > 0 || s.stun > 0) continue; const d = Math.hypot(s.x - px, s.y - py); if (d < bd) { bd = d; best = s; } }
          c = best || c;
        }
      }
      if (c !== this.controlled[i]) { if (c) c.prev = Object.assign({}, h); this.controlled[i] = c; }
      this.hPrev[i] = Object.assign({}, h);
      return c;
    }

    playStep(dt) {
      if (!this.ot) { this.clock -= dt; if (this.clock <= 0) { this.clock = 0; this.endPeriod(); return; } }
      else this.clock += dt;
      for (let i = 0; i < 2; i++) {
        const T = this.teams[i], h = this.human[i];
        const c = h ? this.updateControlled(i, h) : null;
        for (const s of T.skaters) {
          if (s === c) s.input = { dx: h.dx, dy: h.dy, a: h.a, b: h.b, p: h.p };
          else HK.ai.think(this, s, dt);
        }
      }
      for (const s of this.skatersOnIce()) this.act(s, dt);
      this.moveSkaters(dt);
      this.collide();
      for (const T of this.teams) this.updateGoalie(T, dt);
      this.updatePuck(dt);
      for (const s of this.skatersOnIce()) s.prev = s.input;
    }
    glide(dt) {
      for (const s of this.skatersOnIce()) { const f = Math.max(0, 1 - 2.5 * dt); s.vx *= f; s.vy *= f; s.x += s.vx * dt; s.y += s.vy * dt; this.keepIn(s); }
      const p = this.puck;
      if (!p.owner) { p.x += p.vx * dt; p.y += p.vy * dt; const f = Math.max(0, 1 - (p.inNet ? 5 : 0.3) * dt); p.vx *= f; p.vy *= f; this.puckWalls(p); }
      else { p.x = p.owner.x + p.owner.dir * (p.owner.r + 10); p.y = p.owner.y + 3; }
    }

    act(s, dt) {
      const inp = s.input || {}, prev = s.prev || {};
      const canAct = s.down <= 0 && s.stun <= 0 && s.slide <= 0;
      if (!canAct) {
        const f = Math.max(0, 1 - (s.slide > 0 ? 0.5 : 3) * dt); s.vx *= f; s.vy *= f;
        if (s.slide > 0) s.anim += dt * 8;
        return;
      }
      let dx = inp.dx || 0, dy = inp.dy || 0; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      const m = this.speedMult(s); const max = s.maxSpeed * m + (s.lunge > 0 ? 170 : 0);
      if (l > 0.1) {
        s.vx += dx * s.accel * m * dt; s.vy += dy * s.accel * m * dt;
        const v = Math.hypot(s.vx, s.vy); if (v > max) { s.vx *= max / v; s.vy *= max / v; }
        s.anim += dt * (4 + v / 60);
      } else { const f = Math.max(0, 1 - 2.2 * dt); s.vx *= f; s.vy *= f; s.anim += dt * 1.5; }
      const v = Math.hypot(s.vx, s.vy);
      if (v > 15) { s.face = Math.atan2(s.vy, s.vx); if (Math.abs(s.vx) > 12) s.dir = s.vx > 0 ? 1 : -1; }
      const aEdge = inp.a && !prev.a, bEdge = inp.b && !prev.b, bUp = !inp.b && prev.b, pEdge = inp.p && !prev.p;
      if (this.puck.owner === s) {
        if (aEdge) this.pass(s);
        else {
          if (bEdge) s.charge = 0;
          if (inp.b && s.charge >= 0) s.charge = Math.min(1, s.charge + dt / 0.6);
          if (bUp && s.charge >= 0) this.shoot(s, s.charge);
        }
      } else {
        s.charge = -1;
        if (bEdge && s.lunge <= 0 && s.lungeCd <= 0) {
          s.lunge = 0.26; s.lungeCd = 1.1;
          const a = l > 0.1 ? Math.atan2(dy, dx) : s.face;
          s.vx = Math.cos(a) * (max + 170); s.vy = Math.sin(a) * (max + 170); s.face = a; if (Math.abs(s.vx) > 12) s.dir = s.vx > 0 ? 1 : -1;
          this.ev({ type: 'lunge', s });
        }
      }
      if (pEdge && s.cd <= 0) this.usePower(s);
    }

    moveSkaters(dt) {
      for (const s of this.skatersOnIce()) {
        s.x += s.vx * dt; s.y += s.vy * dt;
        this.keepIn(s);
      }
    }
    keepIn(s) {
      const b = HK.rinkBound(s.x, s.y, s.r);
      if (b.d > 0) {
        s.x -= b.nx * b.d; s.y -= b.ny * b.d;
        const vn = s.vx * b.nx + s.vy * b.ny;
        if (vn > 0) { s.vx -= 1.3 * vn * b.nx; s.vy -= 1.3 * vn * b.ny; if (vn > 220) this.ev({ type: 'boards', x: s.x, y: s.y, s }); }
      }
      for (const side of [-1, 1]) {
        const n = HK.netBox(side);
        if (s.x + s.r > n.x0 && s.x - s.r < n.x1 && s.y + s.r > n.y0 && s.y - s.r < n.y1) {
          const px = side < 0 ? (n.x1 + s.r) - s.x : s.x - (n.x0 - s.r);   // pénétration côté embouchure
          const py = Math.min(s.y + s.r - n.y0, n.y1 - (s.y - s.r));
          if (px < py) { s.x += side < 0 ? px : -px; s.vx *= -0.3; }
          else { s.y += (s.y < CY ? -1 : 1) * py; s.vy *= -0.3; }
        }
      }
      for (const T of this.teams) {
        const g = T.goalie, d = Math.hypot(s.x - g.x, s.y - g.y), min = s.r + 14;
        if (d < min && d > 0) { s.x += (s.x - g.x) / d * (min - d); s.y += (s.y - g.y) / d * (min - d); }
      }
    }

    collide() {
      const all = this.skatersOnIce();
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        if (a.ghost > 0 || b.ghost > 0) continue;
        const d = dist(a, b), min = a.r + b.r;
        if (d >= min || d === 0) continue;
        const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, pen = min - d;
        const wa = a.force * 0.5 + a.def.size * 1.5, wb = b.force * 0.5 + b.def.size * 1.5;
        a.x -= nx * pen * wb / (wa + wb); a.y -= ny * pen * wb / (wa + wb);
        b.x += nx * pen * wa / (wa + wb); b.y += ny * pen * wa / (wa + wb);
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) {
          const jj = -rv * 0.9 * (wa * wb / (wa + wb));
          a.vx -= jj / wa * nx; a.vy -= jj / wa * ny; b.vx += jj / wb * nx; b.vy += jj / wb * ny;
        }
        if (a.team !== b.team) { this.checkHit(a, b, nx, ny); this.checkHit(b, a, -nx, -ny); }
        else if (a.slide > 0 || b.slide > 0) { /* on pousse seulement ses coéquipiers */ }
      }
    }
    checkHit(att, vic, nx, ny) {
      if (att.lunge <= 0 && att.slide <= 0) return;
      if (vic.down > 0 || vic.immune > 0 || vic.shield > 0 || vic.ghost > 0) return;
      const toward = att.vx * nx + att.vy * ny;
      if (toward < 60 && att.slide <= 0) return;
      const kidA = att.def.size < 0.75, kidV = vic.def.size < 0.75;
      const fa = att.force + (att.slide > 0 ? 3 : 0), fv = vic.force;
      let chance = Math.min(0.75, 0.35 + (fa - fv) * 0.1);
      if (kidV) chance = 0.7; else if (kidA && att.slide <= 0) chance = 0.15;
      if (this.rand() < chance) {
        // les enfants rebondissent : ils se relèvent tout de suite
        this.knock(vic, kidV ? 0.35 : 0.65 + 0.1 * Math.min(fa, 5), att.vx * 0.5, att.vy * 0.5, att);
        if (att.slide <= 0) { att.lunge = 0; att.vx *= 0.5; att.vy *= 0.5; }
      } else {
        att.lunge = 0;
        if (fv - fa >= 2) this.knock(att, 0.7, -att.vx * 0.4, -att.vy * 0.4, null);
        else { att.vx *= -0.3; att.vy *= -0.3; }
      }
    }
    knock(vic, time, pvx, pvy, by) {
      vic.down = Math.max(vic.down, time); vic.vx = vic.vx * 0.3 + pvx; vic.vy = vic.vy * 0.3 + pvy; vic.charge = -1; vic.lunge = 0; vic.stun = 0;
      if (this.puck.owner === vic) this.dropPuck(vic, 140);
      if (by) { by.stats.hits++; this.teams[by.team].hits++; }
      this.ev({ type: 'hit', x: vic.x, y: vic.y, s: vic, by });
    }
    stunSkater(vic, time, kind) {
      if (vic.shield > 0 || vic.ghost > 0 || vic.immune > 0) return false;
      vic.stun = Math.max(vic.stun, time); vic.stunKind = kind; vic.charge = -1; vic.lunge = 0;
      if (this.puck.owner === vic) this.dropPuck(vic, 60);
      return true;
    }
    dropPuck(s, speed) {
      const p = this.puck; p.owner = null; p.lastOwner = s;
      p.vx = s.vx * 0.6 + (this.rand() - 0.5) * speed; p.vy = s.vy * 0.6 + (this.rand() - 0.5) * speed;
      p.noPick = s; p.noPickT = 0.45;
    }
    takePuck(s, stolen) {
      const p = this.puck, prevOwner = p.owner;
      p.prevOwner = p.lastOwner; p.lastOwner = s; p.owner = s; p.protect = 0.5; p.hard = false; p.inNet = false;
      p.noPick = prevOwner || null; p.noPickT = prevOwner ? 0.4 : 0;
      s.charge = -1;
      this.ev({ type: stolen ? 'steal' : 'pickup', s, x: p.x, y: p.y });
    }

    // ----- Passes et tirs -----
    pass(s) {
      const p = this.puck, T = this.teams[s.team];
      let best = null, bs = 0.1;
      for (const m of T.skaters) {
        if (m === s || m.down > 0) continue;
        const dx = m.x - s.x, dy = m.y - s.y, d = Math.hypot(dx, dy) || 1;
        const sc = (dx * Math.cos(s.face) + dy * Math.sin(s.face)) / d - d / 2500;
        if (sc > bs) { bs = sc; best = m; }
      }
      const speed = 500 + 35 * s.def.stats.control;
      let ang;
      if (best) {
        const d = dist(s, best), tt = d / speed;
        ang = Math.atan2(best.y + best.vy * tt * 0.8 - s.y, best.x + best.vx * tt * 0.8 - s.x);
      } else ang = s.face;
      ang += (this.rand() - 0.5) * s.passErr;
      this.release(s, ang, speed);
      s.stats.passes++;
      this.ev({ type: 'pass', s, to: best });
    }
    shoot(s, charge) {
      const p = this.puck, T = this.teams[s.team], side = -T.side, gx = HK.goalX(side);
      const O = this.teams[1 - s.team], gl = O.goalie;
      const hm = G.mouth / 2 - 11;
      // On vise le côté opposé au gardien, avec plus de précision si bon contrôle.
      const ctrl = s.def.stats.control;
      let aimY = gl.y > CY ? CY - hm : CY + hm;
      aimY += (this.rand() - 0.5) * (56 - ctrl * 9);
      const toNet = Math.atan2(aimY - s.y, gx - s.x);
      let ang = toNet;
      let da = Math.atan2(Math.sin(s.face - toNet), Math.cos(s.face - toNet));
      if (Math.abs(da) > 1.1) ang = s.face + (this.rand() - 0.5) * 0.3;   // tir dans le mauvais sens : part là où il regarde
      else ang = toNet + da * 0.15;
      let speed = s.shotSpeed * (0.62 + 0.38 * charge) * (s.buff > 0 ? 1.2 : 1);
      if (s.slap > 0) { speed *= 1.45; s.slap = 0; this.release(s, ang, speed); p.hard = true; this.ev({ type: 'slapshot', s }); }
      else this.release(s, ang, speed);
      s.stats.shots++;
      gl.reactT = 0.34 - 0.22 * gl.skill;
      this.ev({ type: 'shot', s, charge });
    }
    release(s, ang, speed) {
      const p = this.puck; p.owner = null; p.lastOwner = s; p.prevOwner = p.prevOwner === s ? p.prevOwner : p.prevOwner;
      p.vx = Math.cos(ang) * speed; p.vy = Math.sin(ang) * speed; p.noPick = s; p.noPickT = 0.3; p.protect = 0; s.charge = -1;
      p.x = s.x + Math.cos(ang) * (s.r + 6); p.y = s.y + Math.sin(ang) * (s.r + 6);
    }

    // ----- Gardiens -----
    updateGoalie(T, dt) {
      const g = T.goalie, p = this.puck, side = T.side, gx = HK.goalX(side), home = gx - side * 12, hm = G.mouth / 2;
      g.skill = this.ctrl[T.i] === 'cpu' ? [0.5, 0.72, 0.92][this.difficulty] : 0.72;
      g.x = home; g.dir = -side; g.reactT -= dt;
      if (g.down > 0) return;
      let ty;
      const toward = side < 0 ? p.vx < -40 : p.vx > 40;
      const dxl = home - p.x;
      if (!p.owner && toward && Math.abs(dxl) < 560 && g.reactT <= 0) {
        const tt = dxl / p.vx; ty = p.y + p.vy * tt;
        g.errT -= dt; if (g.errT <= 0) { g.errT = 0.3; g.err = (this.rand() - 0.5) * 2 * (1.15 - g.skill) * 110; }
        ty += g.err;
      } else if (g.reactT > 0) ty = g.y;   // temps de réaction : il reste où il est
      else {
        const k = clamp(1 - Math.abs(p.x - gx) / 420, 0.15, 0.6);
        ty = CY + (p.y - CY) * k;
      }
      ty = clamp(ty, CY - hm - 4, CY + hm + 4);
      const sp = (170 + 150 * g.skill) * (g.slowT > 0 ? g.slowM : 1);
      const step = clamp(ty - g.y, -sp * dt, sp * dt); g.y += step; g.vy = step / dt;
      if (!p.owner) {
        const hw = g.w / 2 + PR, hh = g.h / 2 + PR;
        if (Math.abs(p.x - g.x) < hw && Math.abs(p.y - g.y) < hh) {
          const towardNet = side < 0 ? p.vx < 0 : p.vx > 0;
          if (towardNet && p.vx * p.vx + p.vy * p.vy > 100 * 100) {
            this.teams[1 - T.i].shots++;
            if (p.hard && this.rand() < 0.5) { p.hard = false; p.through = 0.2; this.ev({ type: 'through', x: p.x, y: p.y }); }
            else {
              g.saves++;
              const sp2 = Math.hypot(p.vx, p.vy), ang = (side < 0 ? 0 : Math.PI) + (this.rand() - 0.5) * 1.6;
              const s2 = Math.min(280, sp2 * 0.35 + 50);
              p.vx = Math.cos(ang) * s2; p.vy = Math.sin(ang) * s2; p.x = g.x - side * (hw + 1); p.hard = false;
              this.ev({ type: 'save', x: p.x, y: p.y, team: T.i });
            }
          } else if (!(p.through > 0)) {
            const sx = Math.sign(p.x - g.x) || -side; p.x = g.x + sx * hw;
            if (Math.sign(p.vx) !== sx) p.vx *= -0.4;
          }
        }
        if (Math.hypot(p.x - g.x, p.y - g.y) < 44 && Math.hypot(p.vx, p.vy) < 60 && !p.inNet) {
          g.coverT += dt; if (g.coverT > 0.6) { g.coverT = 0; this.goalieClear(T); }
        } else g.coverT = 0;
      }
    }
    goalieClear(T) {
      const g = T.goalie, p = this.puck, O = this.teams[1 - T.i];
      let best = null, bs = -1e9;
      for (const s of T.skaters) {
        if (s.down > 0) continue;
        let sc = -dist(s, g) * 0.3;
        for (const o of O.skaters) sc -= 4000 / (dist(s, o) + 30);
        if (sc > bs) { bs = sc; best = s; }
      }
      if (!best) return;
      const ang = Math.atan2(best.y - g.y, best.x - g.x) + (this.rand() - 0.5) * 0.2;
      p.x = g.x - T.side * (g.w / 2 + 10); p.y = g.y; p.vx = Math.cos(ang) * 430; p.vy = Math.sin(ang) * 430;
      p.noPick = null; p.lastOwner = null; p.prevOwner = null;
      this.ev({ type: 'clear', team: T.i });
    }

    // ----- Rondelle -----
    puckWalls(p) {
      const b = HK.rinkBound(p.x, p.y, PR);
      if (b.d > 0) {
        p.x -= b.nx * b.d; p.y -= b.ny * b.d;
        const vn = p.vx * b.nx + p.vy * b.ny;
        if (vn > 0) { p.vx -= 1.75 * vn * b.nx; p.vy -= 1.75 * vn * b.ny; if (vn > 120) this.ev({ type: 'board', x: p.x, y: p.y }); }
      }
    }
    netCollide(p, side, prev) {
      const n = HK.netBox(side), gx = n.gx, hm = G.mouth / 2;
      for (const py of [n.y0, n.y1]) {   // poteaux
        const dx = p.x - gx, dy = p.y - py, d = Math.hypot(dx, dy), min = 4 + PR;
        if (d < min && d > 0) {
          p.x = gx + dx / d * min; p.y = py + dy / d * min;
          const vn = (p.vx * dx + p.vy * dy) / d; if (vn < 0) { p.vx -= 1.6 * vn * dx / d; p.vy -= 1.6 * vn * dy / d; this.ev({ type: 'post', x: p.x, y: p.y }); }
          return null;
        }
      }
      const crossed = side < 0 ? (prev.x >= gx && p.x < gx) : (prev.x <= gx && p.x > gx);
      const wasIn = prev.x > n.x0 && prev.x < n.x1 && Math.abs(prev.y - CY) < hm;
      if (crossed && Math.abs(p.y - CY) < hm - 2 && !wasIn) return 'goal';
      const inX = p.x > n.x0 - PR && p.x < n.x1 + PR, inY = Math.abs(p.y - CY) < hm + PR;
      if (!inX || !inY) return null;
      if (p.inNet || wasIn) {   // confinée dans le filet
        p.inNet = true;
        if (side < 0 && p.x < n.x0 + PR) { p.x = n.x0 + PR; p.vx *= -0.3; }
        if (side > 0 && p.x > n.x1 - PR) { p.x = n.x1 - PR; p.vx *= -0.3; }
        if (p.y < n.y0 + PR) { p.y = n.y0 + PR; p.vy *= -0.3; }
        if (p.y > n.y1 - PR) { p.y = n.y1 - PR; p.vy *= -0.3; }
        return null;
      }
      // vient de l'extérieur par le côté ou l'arrière : on la repousse
      const penX = side < 0 ? (n.x1 + PR) - p.x : p.x - (n.x0 - PR);   // depuis l'embouchure (ne devrait pas arriver sans 'crossed')
      const penBack = side < 0 ? p.x - (n.x0 - PR) : (n.x1 + PR) - p.x;
      const penY = Math.min(p.y - (n.y0 - PR), (n.y1 + PR) - p.y);
      if (penY <= penBack) { p.y += (p.y < CY ? -1 : 1) * penY; p.vy *= -0.6; }
      else { p.x += side < 0 ? -penBack : penBack; p.vx *= -0.6; }
      this.ev({ type: 'board', x: p.x, y: p.y });
      return null;
    }
    updatePuck(dt) {
      const p = this.puck;
      p.protect -= dt; p.noPickT -= dt; if (p.noPickT <= 0) p.noPick = null; if (p.through > 0) p.through -= dt;
      if (p.owner) {
        const o = p.owner;
        if (!o.onIce || o.down > 0 || o.stun > 0) { this.dropPuck(o, 60); return; }
        p.x = o.x + o.dir * (o.r + 10); p.y = o.y + 3; p.vx = o.vx; p.vy = o.vy;
        if (o.shield <= 0 && p.protect <= 0) {
          for (const s of this.skatersOnIce()) {
            if (s.team === o.team || s.down > 0 || s.stun > 0 || (s === p.noPick)) continue;
            if (Math.hypot(s.x - p.x, s.y - p.y) < s.reach * 0.8) {
              // vol : chance par seconde selon le contrôle de chacun (plus facile si le porteur est lent)
              const slow = Math.hypot(o.vx, o.vy) < 60 ? 1.5 : 1;
              // petites mains rapides : les enfants volent plus facilement et sont durs à déposséder (trop bas)
              const kid = (s.def.size < 0.75 ? 1.6 : 1) * (o.def.size < 0.75 ? 0.6 : 1);
              const rate = Math.max(0.3, 1.6 + 0.45 * (s.def.stats.control - o.def.stats.control)) * slow * kid;
              if (this.rand() < rate * dt) { this.takePuck(s, true); break; }
            }
          }
        }
        return;
      }
      const prev = { x: p.x, y: p.y };
      for (const s of this.skatersOnIce()) if (s.magnet > 0) {
        const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy) || 1;
        p.vx += dx / d * 1600 * dt; p.vy += dy / d * 1600 * dt;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const v = Math.hypot(p.vx, p.vy);
      const f = Math.max(0, 1 - (p.inNet ? 5 : 0.22) * dt); p.vx *= f; p.vy *= f;
      if (v < 6) { p.vx = p.vy = 0; }
      if (v > 350) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 8) p.trail.shift(); } else p.trail.length = 0;
      this.puckWalls(p);
      for (const side of [-1, 1]) { const r = this.netCollide(p, side, prev); if (r === 'goal') { this.goal(side); return; } }
      // ramassage
      let best = null, bd = 1e9;
      for (const s of this.skatersOnIce()) {
        if (s.down > 0 || s.stun > 0 || s === p.noPick) continue;
        const d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d < s.reach && d < bd) { bd = d; best = s; }
      }
      if (best) {
        const v2 = Math.hypot(p.vx, p.vy);
        const sameTeam = p.lastOwner && p.lastOwner.team === best.team;
        if (v2 < 320 + best.def.stats.control * 110 || sameTeam || best.magnet > 0) this.takePuck(best, p.lastOwner && p.lastOwner.team !== best.team);
        else {
          p.vx *= -0.3; p.vy = p.vy * 0.3 + (this.rand() - 0.5) * 150; p.noPick = best; p.noPickT = 0.3;
          this.ev({ type: 'deflect', x: p.x, y: p.y, s: best });
        }
      }
    }
    goal(side) {
      const T = this.teams.find(t => t.side !== side), p = this.puck;
      T.score++; T.shots++;
      const scorer = p.lastOwner; let assist = null, own = false;
      if (scorer && scorer.team === T.i) {
        scorer.stats.goals++;
        if (p.prevOwner && p.prevOwner.team === T.i && p.prevOwner !== scorer) { assist = p.prevOwner; assist.stats.assists++; }
      } else own = true;
      this.lastGoal = { team: T.i, scorer, assist, own, period: this.period, time: this.clockText(), ot: this.ot };
      this.scorers.push(this.lastGoal);
      p.inNet = true; p.vx *= 0.2; p.vy *= 0.2; p.hard = false;
      this.phase = 'goal'; this.phaseT = 3.4;
      this.ev({ type: 'goal', team: T.i, scorer, assist, own, x: p.x, y: p.y });
    }

    // ----- Pouvoirs -----
    opponentsOf(s) { return this.teams[1 - s.team].skaters; }
    usePower(s) {
      const P = s.def.power, p = this.puck, T = this.teams[s.team], O = this.teams[1 - s.team];
      s.cd = HK.POWERS[P].cd; s.stats.powers++;
      const near = (o, d) => Math.hypot(o.x - s.x, o.y - s.y) < d;
      const fx = (kind, extra) => this.fx.push(Object.assign({ kind, x: s.x, y: s.y, t: 1, t0: 1, s }, extra));
      switch (P) {
        case 'cheat':
          for (const o of O.skaters) { o.slowT = 3; o.slowM = 0.45; o.slowKind = 'cheat'; }
          O.goalie.slowT = 3; O.goalie.slowM = 0.6; fx('cheat', { t: 3, t0: 3 }); break;
        case 'biscuits':
          for (const o of O.skaters) if (near(o, 120)) this.stunSkater(o, 2.2, 'eat');
          fx('biscuits', { t: 2.2, t0: 2.2, r: 120 }); break;
        case 'charge':
          for (const o of O.skaters) if (near(o, 95)) { const d = dist(s, o) || 1; this.knock(o, 1.1, (o.x - s.x) / d * 260, (o.y - s.y) / d * 260, s); }
          if (near(O.goalie, 95)) O.goalie.down = 1.5;
          s.vx *= 0.3; s.vy *= 0.3; fx('charge', { t: 0.6, t0: 0.6, r: 95 }); break;
        case 'laser': {
          const cx = Math.cos(s.face), cy = Math.sin(s.face), len = 340;
          for (const o of O.skaters) {
            const dx = o.x - s.x, dy = o.y - s.y, along = dx * cx + dy * cy, across = Math.abs(-dx * cy + dy * cx);
            if (along > 0 && along < len && across < 26 + o.r) this.stunSkater(o, 2.5, 'frozen');
          }
          fx('laser', { t: 0.5, t0: 0.5, ang: s.face, len }); break;
        }
        case 'bulle': s.shield = 5; fx('bulle', { t: 0.4, t0: 0.4 }); break;
        case 'crise':
          for (const o of this.skatersOnIce()) if (o !== s && near(o, 135)) {
            const d = dist(s, o) || 1; o.vx += (o.x - s.x) / d * 420; o.vy += (o.y - s.y) / d * 420;
            if (o.team !== s.team) this.stunSkater(o, 1.3, 'dizzy'); else if (p.owner === o) this.dropPuck(o, 80);
          }
          for (const T2 of this.teams) if (near(T2.goalie, 135)) T2.goalie.down = Math.max(T2.goalie.down, 0.8);
          fx('crise', { t: 1.2, t0: 1.2, r: 135 }); break;
        case 'zoom': s.boostT = 4; s.boostM = 1.8; fx('zoom', { t: 4, t0: 4 }); break;
        case 'teleport': {
          const from = { x: s.x, y: s.y }; let tx, ty;
          if (p.owner === s) { const gx = HK.goalX(-T.side); tx = gx + T.side * 150; ty = CY + (this.rand() - 0.5) * 60; }
          else if (p.owner) { const o = p.owner; tx = o.x + o.dir * (o.r + 12); ty = o.y; }
          else { tx = p.x - s.dir * 8; ty = p.y - 3; }
          const b = HK.rinkBound(tx, ty, s.r + 4); if (b.d > 0) { tx -= b.nx * b.d; ty -= b.ny * b.d; }
          s.x = tx; s.y = ty; s.vx = s.vy = 0; s.immune = 0.4;
          fx('teleport', { t: 0.6, t0: 0.6, from }); fx('teleport', { t: 0.6, t0: 0.6, x: tx, y: ty, from: null }); break;
        }
        case 'aimant':
          s.magnet = 3;
          if (p.owner && p.owner.team !== s.team && near(p.owner, 130) && p.owner.shield <= 0) this.takePuck(s, true);
          fx('aimant', { t: 3, t0: 3 }); break;
        case 'glissade': {
          const a = s.face; s.slide = 0.75; s.vx = Math.cos(a) * 560; s.vy = Math.sin(a) * 560; s.immune = 0.9;
          fx('glissade', { t: 0.8, t0: 0.8 }); break;
        }
        case 'capitaine': for (const m of T.skaters) m.buff = 5; fx('capitaine', { t: 1.2, t0: 1.2 }); break;
        case 'blizzard':
          for (const o of O.skaters) { o.slowT = 4; o.slowM = 0.5; o.slowKind = 'blizzard'; }
          O.goalie.slowT = 4; O.goalie.slowM = 0.5; fx('blizzard', { t: 4, t0: 4, side: O.side }); break;
        case 'fantome': s.ghost = 4; fx('fantome', { t: 0.5, t0: 0.5 }); break;
        case 'slap': s.slap = 6; fx('slap', { t: 0.8, t0: 0.8 }); break;
      }
      this.ev({ type: 'power', s, power: P, x: s.x, y: s.y });
    }
  }
  HK.Game = Game;
})(window.HK);
