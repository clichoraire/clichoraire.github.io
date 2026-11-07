// Paper Run — une course : le joueur (physique) contre trois adversaires (chemins enregistrés), cubes et objets,
// ennemis, pièces, caméra, effets, HUD de course.
(function (root) {
  'use strict';
  const PR = root.PR = root.PR || {};
  const R = PR.render, C = PR.PHYS, T = C.T, G = PR.TILE;
  const VW = 960, VH = 540;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u;
  const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW', 'KeyZ'], TAU = Math.PI * 2, INK = '#2b1f1a';

  PR.Race = class {
    // o : { canvas, char, level, cfg, diff, rivals: [personnages], onFinish(result), onPause(bool) }
    constructor(o) {
      this.canvas = o.canvas; this.ctx = this.canvas.getContext('2d');
      this.char = o.char; this.def = o.level; this.cfg = o.cfg; this.diff = o.diff; this.world = PR.worldById(this.def.world);
      this.rivalChars = o.rivals || []; this.onFinish = o.onFinish || (() => { }); this.onPause = o.onPause || (() => { });
      this.lvl = PR.parseLevel(this.def);
      this.terrain = R.terrain(this.lvl, this.world);
      this.bg = R.makeBackground(this.world, this.lvl.w * 7 + this.lvl.h);
      this.paths = (PR.PATHS && PR.PATHS[this.def.id]) || {};
      this.running = false; this.last = 0; this.acc = 0; this.raf = 0; this.pending = { jump: false, dash: false, item: false };
      this.reset();
    }
    reset() {
      const lvl = this.lvl;
      this.st = PR.newState(lvl); this.st.shield = this.cfg.shield || 0;
      this.vis = { face: 1, flipT: 0, pose: 'idle', walk: 0, sx: 1, sy: 1 };
      this.coins = lvl.coins.map(c => ({ x: c.x, y: c.y, big: c.big, taken: false }));
      this.enemies = lvl.enemies.map(e => this.makeEnemy(e));
      this.cubes = lvl.items.map(c => ({ x: c.x, y: c.y, gone: 0 }));
      this.cannons = lvl.cannons.map(c => ({ x: c.x * T + T / 2, y: c.y * T + T / 2, dir: 1, t: 1 + Math.random() * 2, fire: 0 })); this.balls = [];
      this.ambient = []; for (let i = 0; i < 9; i++) this.ambient.push(this.makeAmbient(true));
      this.particles = []; this.pops = []; this.scraps = []; this.shots = []; this.glues = [];
      this.time = 0; this.phase = 'ready'; this.readyT = 3.4; this.elapsed = 0; this.paused = false; this.winT = 0; this.lastCount = 4; this.orageT = 0;
      this.stats = { coins: 0, big: 0, deaths: 0, enemies: 0, hits: 0 };
      this.cam = { x: 0, y: 0 }; this.flash = 0; this.shake = 0; this.springAnim = new Map(); this.titleT = 2.6; this.dj = false;
      // coureurs : le joueur + les adversaires
      this.player = { id: this.char.id, ch: this.char, isPlayer: true, item: null, roll: 0, rollIcon: '', shield: 0, finished: false, finishTime: 0, remaining: 999, pos: 1, x: lvl.start.x + 14, y: lvl.start.y + C.H };
      this.racers = [this.player];
      const fallback = this.paths[this.diff.id] || this.paths.feuille || null;
      this.rivalChars.forEach((ch, k) => {
        const p = this.paths[this.diff.id] || fallback; if (!p) return;
        this.racers.push({ id: ch.id, ch, isPlayer: false, path: p, t: 0, rate: this.diff.rate * [1.0, 0.975, 0.95][k % 3], delay: 0.15 + k * 0.18 + Math.random() * 0.25, x: lvl.start.x + 14 - 14 * (k + 1), y: lvl.start.y + C.H, face: 1, flags: 1, flipT: 0,
          stun: 0, slow: 0, boost: 0, shield: 0, item: null, roll: 0, rollIcon: '', itemWait: 0, finished: false, finishTime: 0, remaining: 999, pos: k + 2, rubber: 1, spin: 0 });
      });
      this.order = this.racers.slice();
      this.snapCamera();
    }
    makeAmbient(anywhere) {
      const k = this.world.id, cam = this.cam || { x: 0, y: 0 };
      const kind = k === 'foret' ? 'leaf' : k === 'ciseaux' ? 'snow' : k === 'chateau' ? 'bat' : k === 'ciel' ? 'bird' : 'butterfly';
      return { kind, x: cam.x + (anywhere ? Math.random() * VW : VW + 60 + Math.random() * 500), y: cam.y + (kind === 'snow' || kind === 'leaf' ? -Math.random() * 300 : Math.random() * VH * 0.6), t: Math.random() * 6, vx: -(kind === 'bat' || kind === 'bird' ? 60 : 20) - Math.random() * 50, vy: (kind === 'snow' ? 40 : 25) + Math.random() * 25, s: 0.7 + Math.random() * 0.6, hue: Math.random() };
    }
    makeEnemy(e) {
      const slow = 1 - (this.cfg.slow || 0);
      if (e.kind === 'walker') return { kind: 'walker', x: e.x, y: e.y, ox: e.x, vx: -70 * slow, w: 34, h: 38, dead: 0, alive: true, face: -1, flipT: 0 };
      if (e.kind === 'plane') return { kind: 'plane', x: e.x, y: e.y, ox: e.x, vx: 150 * slow, w: 50, h: 22, dead: 0, alive: true, face: 1, flipT: 0, t: Math.random() * 6 };
      if (e.kind === 'jumper') return { kind: 'jumper', x: e.x, y: e.y, oy: e.y, vx: 0, vy: 0, w: 36, h: 34, dead: 0, alive: true, face: -1, flipT: 0, t: 0.5 + Math.random() * 1.5, air: false, squash: 0, slow };
      if (e.kind === 'spiky') return { kind: 'spiky', x: e.x, y: e.y, ox: e.x, vx: -45 * slow, w: 44, h: 44, dead: 0, alive: true, face: -1, flipT: 0, t: 0, noStomp: true };
      if (e.kind === 'eraser') return { kind: 'eraser', x: e.x, y: e.y, ox: e.x, vx: 0, w: 46, h: 34, dead: 0, alive: true, face: -1, flipT: 0, t: 0, charging: false, rest: 0, slow };
      if (e.kind === 'spider') return { kind: 'spider', x: e.x, y: e.y + 30, anchorY: e.y, vx: 0, w: 34, h: 30, dead: 0, alive: true, face: 1, flipT: 0, t: Math.random() * 6, range: 4 * T, slow };
      return { kind: 'plant', x: e.x, y: e.y, w: 36, h: 60, dead: 0, alive: true, face: 1, flipT: 0, t: Math.random() * 3, u: 0, noStomp: true, slow };
    }
    // ---- boucle
    start() { this.running = true; this.last = performance.now(); const loop = now => { if (!this.running) return; this.frame(now); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
    setPaused(p) { this.paused = p; this.onPause(p); if (!p) this.last = performance.now(); }
    restart() { this.reset(); PR.input.clear(); this.pending = { jump: false, dash: false, item: false }; }
    frame(now) {
      const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
      const inp = PR.input.take();
      if (inp.mute) { const m = PR.audio.toggle(); this.pop(this.st.x + 14, this.st.y - 30, m ? 'Son coupé' : 'Son !', '#fff', 18); }
      if (inp.pause && this.phase !== 'done') { this.setPaused(!this.paused); return; }
      if (this.paused || this.freeze) { this.render(); return; }
      if (inp.restart && this.allowRestart) { this.restart(); return; }
      this.elapsed += dt;
      // Les appuis sont gardés jusqu'au prochain pas de physique (une image peut passer sans pas).
      if (inp.jump) this.pending.jump = true; if (inp.dash) this.pending.dash = true; if (inp.item) this.pending.item = true;
      this.acc += dt;
      while (this.acc >= C.STEP) {
        const stepInp = Object.assign({}, inp, { jump: this.pending.jump, dash: this.pending.dash, item: this.pending.item, jumpHeld: inp.jumpHeld || this.pending.jump });
        this.pending.jump = false; this.pending.dash = false; this.pending.item = false;
        this.update(C.STEP, stepInp); this.acc -= C.STEP;
      }
      this.render();
    }
    // ---------------------------------------------------------------- mise à jour
    update(dt, inp) {
      const st = this.st, lvl = this.lvl, cfg = this.cfg;
      if (this.titleT > 0) this.titleT -= dt;
      if (this.phase === 'ready') {
        this.readyT -= dt; const n = Math.ceil(this.readyT - 0.4);
        if (n < this.lastCount && n >= 1) { this.lastCount = n; PR.audio.play('ready'); }
        if (this.readyT <= 0) { this.phase = 'run'; PR.audio.play('go'); this.pops.push({ x: st.x + 14, y: st.y - 40, text: 'GO !', color: '#7fd45a', life: 0.8, max: 0.8, size: 36 }); }
        inp = { dir: 0, jump: false, jumpHeld: false, dash: false, item: false };
      }
      if (this.phase === 'run') this.time += dt;
      if (this.phase === 'win') { this.winT += dt; if (this.winT > 2.2) { this.phase = 'done'; this.onFinish(this.result()); } }
      const prev = { x: st.x, y: st.y, vy: st.vy, ground: st.ground, face: st.face, cp: st.cp, deaths: st.deaths, broken: st.broken, dashing: st.dashing, shield: st.shield, bounce: st.bounce, warpT: st.warpT };
      const locked = this.phase === 'win' || this.phase === 'done';
      PR.step(st, locked ? { dir: 0, jump: false, jumpHeld: false, dash: false, down: false } : inp, dt, lvl, cfg);
      // --- événements de la physique du joueur
      if (st.win && this.phase === 'run') this.playerFinished();
      if (st.face !== prev.face) this.vis.flipT = 0.14;
      if (st.ground && !prev.ground && st.vy === 0) { PR.audio.play('land'); this.vis.sx = 1.25; this.vis.sy = 0.78; this.puffs(st.x + 14, st.y + st.h, 3); }
      if (!st.ground && prev.ground && st.vy < -100) { PR.audio.play('jump'); this.vis.sx = 0.85; this.vis.sy = 1.18; this.puffs(st.x + 14, st.y + st.h, 2); }
      if (st.jumpedFrom === 3 && st.vy < 0 && !prev.ground && !st.ground && st.jumps === 1 && !this.dj) { this.dj = true; PR.audio.play('double'); this.ring(st.x + 14, st.y + st.h - 6); }
      if (st.ground) this.dj = false;
      if (st.bounce > 0 && prev.bounce <= 0) { PR.audio.play('spring'); this.springAnim.set(Math.floor((st.x + 14) / T) + ',' + Math.floor((st.y + st.h + 4) / T), 0.3); }
      if (st.dashing && !prev.dashing) { PR.audio.play('dash'); this.vis.sx = 1.3; this.vis.sy = 0.8; }
      if (st.warpT > 0 && !(prev.warpT > 0)) { PR.audio.play('paper'); this.puffs(st.x + 14, st.y + st.h, 4); }
      if (st.ice && st.ground && Math.abs(st.vx) > 120 && Math.random() < 0.3) this.particles.push({ x: st.x + 14 - st.face * 12, y: st.y + st.h - 2, vx: -st.face * 30, vy: -20, r: 2.5, life: 0.35, max: 0.35, color: '#eefbff' });
      if (st.dashing || st.boost > 0) this.scraps.push({ x: st.x + 14 - st.face * 10, y: st.y + st.h - 10 - Math.random() * 30, vx: -st.face * 60, vy: 0, r: 5 + Math.random() * 4, rot: Math.random() * 6, color: st.boost > 0 ? '#ff8f5e' : 'rgba(255,255,255,0.8)', life: 0.3, max: 0.3 });
      if (st.broken !== prev.broken) { PR.audio.play('paper'); for (let k = 0; k < lvl.breakables.length; k++) if (((st.broken >> k) & 1) && !((prev.broken >> k) & 1)) { const b = lvl.breakables[k]; this.burst(b.x * T + T / 2, b.y * T + T / 2, 10, ['#fff3d6', '#ff8f5e']); } }
      if (st.cp !== prev.cp) { PR.audio.play('flag'); const c = lvl.checkpoints[st.cp]; this.pop(c.tx * T + T / 2, c.ty * T - 60, 'Drapeau !', this.char.outfit, 22); }
      if (st.deaths !== prev.deaths) { this.stats.deaths++; PR.audio.play('hurt'); this.burst(prev.x + 14, prev.y + 28, 14, ['#fff6e4', this.char.outfit]); this.flash = 0.35; this.shake = 0.3; this.deathAt = { x: prev.x + 14, y: prev.y + 28, t: 0.6 }; }
      else if (st.shield < prev.shield) { PR.audio.play('shield'); this.pop(st.x + 14, st.y - 30, 'Bouclier !', '#5ab8ff', 20); this.ring(st.x + 14, st.y + 28); }
      if (st.ground && Math.abs(st.vx) > 200 && Math.random() < 0.25) this.particles.push({ x: st.x + 14 - st.face * 12, y: st.y + st.h - 2, vx: -st.face * 50, vy: -30, r: 3, life: 0.3, max: 0.3, color: '#fff6e4' });
      // --- pièces
      const magnetR = cfg.magnet ? (cfg.magnet >= 2 ? 190 : 110) : 0, pcx = st.x + st.w / 2, pcy = st.y + st.h / 2;
      for (const c of this.coins) {
        if (c.taken) continue;
        const dx = pcx - c.x, dy = pcy - c.y, d = Math.hypot(dx, dy);
        if (magnetR && d < magnetR && this.phase === 'run') { const s = 520 * dt / Math.max(d, 1); c.x += dx * s; c.y += dy * s; }
        const r = c.big ? 22 : 16;
        if (Math.abs(dx) < st.w / 2 + r && Math.abs(dy) < st.h / 2 + r) {
          c.taken = true; const v = c.big ? PR.ECON.bigCoin : PR.ECON.coin; this.stats.coins += v; if (c.big) this.stats.big++;
          PR.audio.play(c.big ? 'bigcoin' : 'coin'); this.pop(c.x, c.y - 10, '+' + v, c.big ? '#ffb43a' : '#ffd84a', c.big ? 24 : 18); this.burst(c.x, c.y, c.big ? 10 : 5, ['#ffd84a', '#fff']);
        }
      }
      // --- cubes et objet du joueur
      this.player.x = pcx; this.player.y = st.y + st.h; this.player.shield = st.shield;
      this.updateCubes(dt);
      if (this.player.roll > 0) { this.player.roll -= dt; if (Math.floor(this.elapsed * 15) % 2 === 0) this.player.rollIcon = PR.ITEMS[Math.floor(Math.random() * PR.ITEMS.length)].icon; if (this.player.roll <= 0) PR.audio.play('click'); }
      if (inp.item && this.phase === 'run' && this.player.item && this.player.roll <= 0) this.useItem(this.player);
      // --- adversaires, projectiles, colle
      for (const r of this.racers) if (!r.isPlayer) this.updateGhost(r, dt);
      this.updateShots(dt);
      for (let i = this.glues.length - 1; i >= 0; i--) {
        const g = this.glues[i]; g.life -= dt; if (g.life <= 0) { this.glues.splice(i, 1); continue; }
        for (const r of this.racers) { if ((r === g.owner && g.life > 19) || r.finished) continue; if (Math.abs(r.x - g.x) < 26 && Math.abs(r.y - g.y) < 18) { this.slowRacer(r); this.glues.splice(i, 1); break; } }
      }
      // --- ennemis
      for (const e of this.enemies) this.updateEnemy(e, dt, prev);
      this.updateCannons(dt);
      // ambiance (feuilles, flocons, papillons…) : toujours dans le champ de la caméra
      for (let i = 0; i < this.ambient.length; i++) { const a = this.ambient[i]; a.t += dt; a.x += a.vx * dt; a.y += (a.kind === 'butterfly' || a.kind === 'bird' ? Math.sin(a.t * 3) * 30 : a.vy) * dt; if (a.x < this.cam.x - 60 || a.y > this.cam.y + VH + 40 || a.x > this.cam.x + VW + 200 || a.y < this.cam.y - 100) this.ambient[i] = this.makeAmbient(false); }
      // --- classement
      this.rankT = (this.rankT || 0) - dt; if (this.rankT <= 0) { this.rankT = 0.12; this.rank(); }
      // --- particules
      for (const list of [this.particles, this.scraps]) for (let i = list.length - 1; i >= 0; i--) { const p = list[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g == null ? 300 : p.g) * dt; if (p.rot != null) p.rot += p.vr || 3 * dt; if (p.life <= 0) list.splice(i, 1); }
      for (let i = this.pops.length - 1; i >= 0; i--) { const p = this.pops[i]; p.life -= dt; if (p.life <= 0) this.pops.splice(i, 1); }
      for (const [k, v] of this.springAnim) { if (v - dt <= 0) this.springAnim.delete(k); else this.springAnim.set(k, v - dt); }
      if (this.flash > 0) this.flash -= dt; if (this.shake > 0) this.shake -= dt; if (this.orageT > 0) this.orageT -= dt; if (this.deathAt) { this.deathAt.t -= dt; if (this.deathAt.t <= 0) this.deathAt = null; }
      // --- visuel du héros
      const v = this.vis; v.face = st.face; if (v.flipT > 0) v.flipT -= dt;
      v.sx = lerp(v.sx, 1, Math.min(1, dt * 12)); v.sy = lerp(v.sy, 1, Math.min(1, dt * 12));
      if (locked) v.pose = this.player.pos === 1 ? 'win' : 'idle';
      else if (st.dead > 0) v.pose = 'dead';
      else if (st.stun > 0) v.pose = 'stun';
      else if (st.dashing) v.pose = 'dash';
      else if (st.sliding) v.pose = 'slide';
      else if (st.gliding) v.pose = 'glide';
      else if (!st.ground) v.pose = st.vy < 0 ? 'jump' : 'fall';
      else if (Math.abs(st.vx) > 30) { v.pose = 'run'; v.walk += dt * (10 + Math.abs(st.vx) / 25); }
      else v.pose = 'idle';
      this.updateCamera(dt);
    }
    // ---- cubes d'objets : chaque coureur qui passe dessus reçoit un objet (tiré selon sa position)
    updateCubes(dt) {
      for (const c of this.cubes) {
        if (c.gone > 0) { c.gone -= dt; continue; }
        for (const r of this.racers) {
          if (r.finished || r.item || r.roll > 0) continue;
          if (!r.isPlayer && (r.t <= 0 || r.stun > 0)) continue;
          if (Math.abs(r.x - c.x) < 34 && Math.abs(r.y - 28 - c.y) < 44) {
            c.gone = 4; r.roll = 1.0; r.rollIcon = '?'; r.item = PR.rollItem(r.pos);
            if (!r.isPlayer) r.itemWait = 1 + Math.random() * 2;
            if (r.isPlayer || this.onScreen(c.x)) { this.burst(c.x, c.y, 8, ['#ffd54a', '#ff5fc8', '#5ab8ff', '#7fd45a']); if (r.isPlayer) PR.audio.play('bigcoin'); }
            break;
          }
        }
      }
    }
    // ---- objets
    useItem(r) {
      const id = r.item; if (!id) return; r.item = null; const item = PR.itemById(id);
      const ahead = this.racers.filter(o => o !== r && !o.finished && o.remaining < r.remaining).sort((a, b) => b.remaining - a.remaining)[0];
      if (r.isPlayer || this.onScreen(r.x)) PR.audio.play(id === 'fusee' ? 'dash' : id === 'orage' ? 'hurt' : id === 'bouclier' ? 'shield' : 'jump');
      if (r.isPlayer) this.pop(r.x, r.y - 90, item.icon + ' ' + item.name, '#fffaf0', 18);
      switch (id) {
        case 'boule': { const face = this.faceOf(r); this.shots.push({ kind: 'ball', x: r.x + face * 24, y: r.y - 50, vx: face * 540 + (r.isPlayer ? this.st.vx * 0.5 : 0), vy: -260, owner: r, life: 2.4, rot: 0 }); break; }
        case 'avion': { const tgt = ahead || this.racers.filter(o => o !== r && !o.finished)[0]; if (tgt) this.shots.push({ kind: 'plane', x: r.x, y: r.y - 70, vx: 0, vy: -200, owner: r, target: tgt, life: 8, ang: 0, color: r.ch.outfit }); break; }
        case 'colle': this.glues.push({ x: r.x - this.faceOf(r) * 30, y: r.y, owner: r, life: 20 }); break;
        case 'fusee': if (r.isPlayer) this.st.boost = PR.ITEM_T.boost; else r.boost = PR.ITEM_T.boost; break;
        case 'orage': this.orageT = 0.5; this.flash = 0.3; this.shake = 0.4; for (const o of this.racers) if (o !== r && !o.finished) this.hitRacer(o, PR.ITEM_T.orage, r); break;
        case 'bouclier': if (r.isPlayer) this.st.shield++; else r.shield++; break;
      }
    }
    faceOf(r) { return r.isPlayer ? this.st.face : r.face; }
    onScreen(x) { return x > this.cam.x - 100 && x < this.cam.x + VW + 100; }
    hitRacer(r, secs, by) {
      if (r.finished) return false;
      if (r.isPlayer) {
        if (this.st.shield > 0) { this.st.shield--; PR.audio.play('shield'); this.pop(r.x, r.y - 80, 'Bouclier !', '#5ab8ff', 20); this.ring(r.x, r.y - 28); return false; }
        PR.stun(this.st, secs); this.stats.hits++; PR.audio.play('hurt'); this.shake = 0.3; this.pop(r.x, r.y - 80, 'Aïe !', '#ff5f7a', 22); this.burst(r.x, r.y - 30, 10, ['#fff6e4', this.char.outfit]);
      } else {
        if (r.shield > 0) { r.shield--; if (this.onScreen(r.x)) { this.ring(r.x, r.y - 28); PR.audio.play('shield'); } return false; }
        r.stun = Math.max(r.stun, secs); r.boost = 0; r.spin = 0;
        if (this.onScreen(r.x)) { this.burst(r.x, r.y - 30, 8, ['#fff6e4', r.ch.outfit]); PR.audio.play('stomp'); }
        if (by && by.isPlayer) this.pop(r.x, r.y - 80, 'Touché !', '#ffd54a', 20);
      }
      return true;
    }
    slowRacer(r) {
      if (r.isPlayer) { if (this.st.shield > 0) { this.st.shield--; PR.audio.play('shield'); return; } this.st.slow = PR.ITEM_T.glue; PR.audio.play('slide'); this.pop(r.x, r.y - 80, 'Collé !', '#5ab8ff', 20); }
      else { if (r.shield > 0) { r.shield--; return; } r.slow = PR.ITEM_T.glue; }
    }
    updateShots(dt) {
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const s = this.shots[i]; s.life -= dt;
        if (s.kind === 'ball') {
          s.vy += 1400 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += 10 * dt;
          const v = PR.cellAt(this.lvl, this.st, Math.floor(s.x / T), Math.floor(s.y / T));
          if (v === G.SOLID || v === G.PAPER || s.y > this.lvl.ph) { s.life = 0; this.burst(s.x, s.y, 6, ['#fff6e4']); }
        } else {
          const tg = s.target; if (!tg || tg.finished) s.life = 0;
          else { const dx = tg.x - s.x, dy = tg.y - 30 - s.y, d = Math.hypot(dx, dy) || 1, sp = 470; s.vx = lerp(s.vx, dx / d * sp, Math.min(1, dt * 4)); s.vy = lerp(s.vy, dy / d * sp, Math.min(1, dt * 4)); s.x += s.vx * dt; s.y += s.vy * dt; s.ang = Math.atan2(s.vy, s.vx); }
          if (Math.random() < 0.3) this.particles.push({ x: s.x, y: s.y, vx: -s.vx * 0.1, vy: 0, r: 2.5, life: 0.3, max: 0.3, color: '#fff', g: 0 });
        }
        if (s.life > 0) for (const r of this.racers) {
          if ((r === s.owner && s.life > (s.kind === 'ball' ? 2.2 : 7.6)) || r.finished) continue;
          if (Math.abs(r.x - s.x) < 30 && s.y > r.y - 85 && s.y < r.y + 10) { this.hitRacer(r, PR.ITEM_T.stun, s.owner); s.life = 0; break; }
        }
        if (s.life <= 0) this.shots.splice(i, 1);
      }
    }
    // ---- adversaires : rejouent un chemin enregistré à leur vitesse
    updateGhost(r, dt) {
      if (r.finished) return;
      if (r.stun > 0) { r.stun -= dt; r.spin += dt * 12; }
      if (r.slow > 0) r.slow -= dt; if (r.boost > 0) r.boost -= dt; if (r.flipT > 0) r.flipT -= dt;
      if (r.roll > 0) { r.roll -= dt; if (Math.floor(this.elapsed * 15) % 2 === 0) r.rollIcon = PR.ITEMS[Math.floor(Math.random() * PR.ITEMS.length)].icon; }
      if (this.phase === 'ready' || this.time < r.delay) return;
      const eff = r.rate * r.rubber * (r.boost > 0 ? 1.5 : 1) * (r.slow > 0 ? 0.45 : 1) * (r.stun > 0 ? 0 : 1);
      r.t += dt * eff;
      const p = r.path, n = p.pts.length, fi = r.t / p.dt, i = Math.min(n - 1, Math.floor(fi)), j = Math.min(n - 1, i + 1), u = fi - i;
      const a = p.pts[i], b = p.pts[j];
      const jump = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) > 200;
      r.x = (jump ? a[0] : a[0] + (b[0] - a[0]) * u) + 14; r.y = (jump ? a[1] : a[1] + (b[1] - a[1]) * u) + C.H; const face = (a[2] & 2) ? 1 : -1; if (face !== r.face) r.flipT = 0.14; r.face = face; r.flags = a[2];
      if (r.t >= p.time) { r.finished = true; r.finishTime = this.time; r.t = p.time; if (this.onScreen(r.x)) { PR.audio.play('flag'); this.burst(r.x, r.y - 40, 20, [r.ch.outfit, '#ffd54a', '#fff']); } }
      if (r.boost > 0 || (r.flags & 4)) this.scraps.push({ x: r.x - r.face * 10, y: r.y - 10 - Math.random() * 30, vx: -r.face * 60, vy: 0, r: 5, rot: Math.random() * 6, color: r.boost > 0 ? '#ff8f5e' : 'rgba(255,255,255,0.8)', life: 0.3, max: 0.3 });
      // décision d'objet
      if (r.item && r.roll <= 0 && r.stun <= 0) {
        r.itemWait -= dt;
        const ahead = this.racers.some(o => o !== r && !o.finished && o.remaining < r.remaining);
        const near = this.racers.some(o => o !== r && !o.finished && o.remaining < r.remaining && r.remaining - o.remaining < 2.5 && Math.abs(o.y - r.y) < 120);
        const use = r.itemWait <= 0 && ((r.item === 'boule' && (near || r.itemWait < -4)) || (r.item === 'avion' && ahead) || r.item === 'colle' || (r.item === 'fusee' && (r.flags & 1)) || (r.item === 'orage' && (ahead || r.itemWait < -3)) || r.item === 'bouclier');
        if (use) this.useItem(r);
      }
    }
    // ---- classement : temps restant estimé (joueur : point le plus proche sur les chemins connus)
    rank() {
      const pl = this.player;
      if (!pl.finished) {
        let best = null;
        // Le temps restant du joueur est mesuré sur le chemin des adversaires (même échelle) ; les autres chemins
        // servent quand le joueur est sur un raccourci, ramenés à cette échelle.
        const ref = this.paths[this.diff.id] || this.paths[Object.keys(this.paths)[0]];
        for (const d of Object.keys(this.paths)) { const p = this.paths[d], pts = p.pts, scale = ref.time / p.time / Math.max(0.3, this.diff.rate); for (let i = 0; i < pts.length; i++) { const dx = pts[i][0] + 14 - pl.x, dy = pts[i][1] + C.H - pl.y, dd = dx * dx + dy * dy; if (dd < 150 * 150) { const rem = (p.time - i * p.dt) * scale; if (!best || dd < best.dd - 400 || (dd < best.dd + 400 && rem < best.rem)) best = { dd, rem }; } } }
        if (best) pl.remaining = best.rem; else pl.remaining = Math.max(0, (pl.remaining || 60) - 0.12);
      } else pl.remaining = 0;
      for (const r of this.racers) if (!r.isPlayer) {
        r.remaining = r.finished ? 0 : (r.path.time - r.t) / Math.max(0.3, r.rate);
        const gap = r.remaining - pl.remaining; r.rubber = pl.finished ? 1 : 1 + clamp(gap * 0.025, -0.07, 0.09);
      }
      const order = this.racers.slice().sort((a, b) => (a.finished && b.finished) ? a.finishTime - b.finishTime : a.finished ? -1 : b.finished ? 1 : a.remaining - b.remaining);
      order.forEach((r, i) => r.pos = i + 1);
      this.order = order;
    }
    playerFinished() {
      const pl = this.player; pl.finished = true; pl.finishTime = this.time; this.rank();
      for (const r of this.racers) if (!r.isPlayer && !r.finished) { r.finished = true; r.finishTime = this.time + r.remaining + (r.stun > 0 ? r.stun : 0); r.projected = true; }
      this.rank(); this.phase = 'win';
      PR.audio.play(pl.pos === 1 ? 'win' : 'flag'); this.burst(this.st.x + 14, this.st.y + 10, pl.pos === 1 ? 50 : 20, ['#ffd54a', '#ff8f5e', '#7fd45a', '#5ab8ff', '#ff5fc8']);
    }
    result() {
      return { levelId: this.def.id, time: this.time, pos: this.player.pos, order: this.order.map(r => ({ id: r.id, pos: r.pos, time: r.finishTime, isPlayer: !!r.isPlayer })), coins: this.stats.coins, deaths: this.stats.deaths, hits: this.stats.hits, enemies: this.stats.enemies };
    }
    updateCannons(dt) {
      const st = this.st, px = st.x + st.w / 2;
      for (const c of this.cannons) {
        if (!this.onScreen(c.x)) continue;
        c.dir = px >= c.x ? 1 : -1; if (c.fire > 0) c.fire -= dt * 3;
        c.t -= dt; if (c.t <= 0 && this.phase === 'run' && Math.abs(px - c.x) > 60) { c.t = 2.6; c.fire = 1; this.balls.push({ x: c.x + c.dir * 40, y: c.y - 2, vx: c.dir * 230, life: 6 }); if (this.onScreen(c.x)) PR.audio.play('stomp'); this.puffs(c.x + c.dir * 44, c.y, 3); }
      }
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const b = this.balls[i]; b.x += b.vx * dt; b.life -= dt;
        const v = PR.cellAt(this.lvl, st, Math.floor((b.x + Math.sign(b.vx) * 13) / T), Math.floor(b.y / T));
        if (PR.isSolid(v) || v === G.PAPER || b.life <= 0) { this.burst(b.x, b.y, 6, ['#55585f', '#fff6e4']); this.balls.splice(i, 1); continue; }
        if (this.phase === 'run' && st.dead <= 0 && st.hurtT <= 0 && st.stun <= 0 && PR.overlap(st, { x: b.x - 13, y: b.y - 13, w: 26, h: 26 })) { this.hitRacer(this.player, PR.ITEM_T.stun, null); this.balls.splice(i, 1); }
      }
    }
    updateEnemy(e, dt, prev) {
      const st = this.st, lvl = this.lvl;
      if (!e.alive) { e.dead += dt; return; }
      if (e.flipT > 0) e.flipT -= dt;
      const px = st.x + st.w / 2, py = st.y + st.h;
      if (e.kind === 'jumper') {
        if (e.squash > 0) e.squash -= dt * 4;
        if (!e.air) { e.t -= dt; if (e.t <= 0) { e.air = true; e.vy = -820 * e.slow; e.face = px < e.x ? -1 : 1; e.vx = e.face * (90 + Math.random() * 60) * e.slow; e.flipT = 0.14; } }
        else { e.vy += 2200 * dt; const nx = e.x + e.vx * dt; const wv = PR.cellAt(lvl, st, Math.floor((nx + e.face * 20) / T), Math.floor((e.y - 20) / T)); if (!PR.isSolid(wv)) e.x = nx; else e.vx = 0; e.y += e.vy * dt;
          if (e.vy > 0) { const fv = PR.cellAt(lvl, st, Math.floor(e.x / T), Math.floor(e.y / T)); if (PR.isSolid(fv) || fv === G.ONEWAY || fv === G.PAPER) { e.y = Math.floor(e.y / T) * T; e.air = false; e.t = 1.2 + Math.random() * 1.2; e.squash = 1; e.vx = 0; } else if (e.y > e.oy + 3 * T) { e.y = e.oy; e.air = false; e.t = 1; } } }
      } else if (e.kind === 'spiky' || e.kind === 'walker') {
        const dir = e.vx > 0 ? 1 : -1, nx = e.x + e.vx * dt, aheadCx = Math.floor((nx + dir * (e.w / 2 + 2)) / T), footCy = Math.floor((e.y + 2) / T), headCy = Math.floor((e.y - 10) / T);
        const wv = PR.cellAt(lvl, st, aheadCx, headCy), wall = PR.isSolid(wv) || wv === G.PAPER;
        const floor = PR.cellAt(lvl, st, aheadCx, footCy), hasFloor = PR.isSolid(floor) || floor === G.ONEWAY || floor === G.PAPER || floor === G.SPRING;
        if (wall || !hasFloor) { e.vx = -e.vx; e.face = -e.face; e.flipT = 0.14; } else e.x = nx;
        if (e.kind === 'spiky') e.t += dt;
      } else if (e.kind === 'eraser') {
        if (e.rest > 0) { e.rest -= dt; e.charging = false; }
        else if (!e.charging) { if (Math.abs(px - e.x) < 7 * T && Math.abs(py - e.y) < 2 * T && this.phase === 'run') { e.charging = true; e.face = px < e.x ? -1 : 1; e.flipT = 0.14; e.vx = e.face * 270 * e.slow; } else if (Math.abs(e.x - e.ox) > 2) e.x += Math.sign(e.ox - e.x) * Math.min(Math.abs(e.ox - e.x), 60 * dt); }
        if (e.charging) { const nx = e.x + e.vx * dt, aheadCx = Math.floor((nx + e.face * (e.w / 2 + 2)) / T), wv = PR.cellAt(lvl, st, aheadCx, Math.floor((e.y - 10) / T)), fv = PR.cellAt(lvl, st, aheadCx, Math.floor((e.y + 2) / T));
          if (PR.isSolid(wv) || wv === G.PAPER || !(PR.isSolid(fv) || fv === G.ONEWAY || fv === G.PAPER)) { e.charging = false; e.rest = 1.4; e.vx = 0; this.puffs(e.x, e.y, 3); } else e.x = nx; }
      } else if (e.kind === 'spider') {
        e.t += dt * e.slow; e.y = e.anchorY + 30 + (0.5 - 0.5 * Math.cos(e.t * 1.6)) * e.range;
      } else if (e.kind === 'plant') {
        e.t += dt * e.slow; const c = e.t % 4; e.u = c < 0.6 ? c / 0.6 : c < 2.2 ? 1 : c < 2.8 ? (2.8 - c) / 0.6 : 0;
        if (e.u > 0.3 && Math.abs(px - e.x) < 56 && Math.abs(py - e.y) < 24) e.u = Math.min(e.u, 0.35); // ne sort pas si on est dessus
      } else {
        e.t += dt; const dir = e.vx > 0 ? 1 : -1, nx = e.x + e.vx * dt, aheadCx = Math.floor((nx + dir * (e.w / 2 + 2)) / T), cy = Math.floor(e.y / T);
        if (PR.cellAt(lvl, st, aheadCx, cy) === G.SOLID || Math.abs(nx - e.ox) > 7 * T) { e.vx = -e.vx; e.face = -e.face; e.flipT = 0.14; } else e.x = nx;
      }
      if (this.phase !== 'run' || st.dead > 0 || st.hurtT > 0 || st.stun > 0 || st.warpT > 0) return;
      const box = e.kind === 'plane' ? { x: e.x - e.w / 2, y: e.y - e.h / 2 + Math.sin(e.t * 5) * 4, w: e.w, h: e.h } : e.kind === 'spider' ? { x: e.x - e.w / 2, y: e.y - 14, w: e.w, h: e.h } : e.kind === 'plant' ? { x: e.x - e.w / 2, y: e.y - 70 * e.u, w: e.w, h: 70 * e.u } : { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };
      if (e.kind === 'plant' && e.u < 0.25) return;
      if (!PR.overlap(st, box)) return;
      const prevBottom = prev.y + st.h;
      if (!e.noStomp && ((st.vy > 0 && prevBottom <= box.y + 14) || st.dashing || st.boost > 0)) {
        e.alive = false; e.dead = 0; this.stats.enemies++;
        st.vy = -([...PR.input.keys].some(k => JUMP_KEYS.includes(k)) ? 980 : C.ENEMY_BOUNCE); st.jumps = 0; st.held = true; st.jumpAge = 0;
        PR.audio.play('stomp'); this.stats.coins += PR.ECON.enemy; this.pop(e.x, box.y - 10, '+' + PR.ECON.enemy, '#ffd84a', 18); this.burst(e.x, box.y + 10, 10, ['#efe6d6', '#fff']);
        this.vis.sx = 0.85; this.vis.sy = 1.2;
      } else if ((st.dashing || st.boost > 0) && e.noStomp && e.kind !== 'plant') { e.alive = false; e.dead = 0; this.stats.enemies++; PR.audio.play('stomp'); this.burst(e.x, box.y + 10, 10, ['#efe6d6', '#fff']); }
      else this.hitRacer(this.player, PR.ITEM_T.stun, null);
    }
    snapCamera() { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; }
    camTarget() { const st = this.st, lvl = this.lvl, under = lvl.under && st.y + st.h / 2 > lvl.under * T; const maxY = (under ? lvl.ph : (lvl.under ? lvl.under * T : lvl.ph)) - VH; return { x: clamp(st.x + st.w / 2 + st.face * 110 - VW / 2, 0, Math.max(0, lvl.pw - VW)), y: clamp(st.y + st.h / 2 - VH * 0.58, 0, Math.max(0, maxY)) }; }
    updateCamera(dt) { const t = this.camTarget(); if (this.st.warpT > 0 && this.st.warpT <= 0.35 && !this.st.warpTo) { this.cam.x = t.x; this.cam.y = t.y; return; } this.cam.x = lerp(this.cam.x, t.x, Math.min(1, dt * 5)); this.cam.y = lerp(this.cam.y, t.y, Math.min(1, dt * (this.st.ground ? 7 : 3.2))); }
    // ---- effets
    puffs(x, y, n) { for (let i = 0; i < n; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 40, r: 4 + Math.random() * 4, life: 0.35, max: 0.35, color: '#fff6e4', g: -40 }); }
    burst(x, y, n, colors) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * 220; this.scraps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, color: colors[i % colors.length], life: 0.7 + Math.random() * 0.4, max: 1, g: 500 }); } }
    ring(x, y) { this.particles.push({ x, y, vx: 0, vy: 0, r: 10, life: 0.3, max: 0.3, color: 'rgba(255,255,255,0.9)', g: 0, ring: true }); }
    pop(x, y, text, color, size) { this.pops.push({ x, y, text, color, size, life: 0.9, max: 0.9 }); }
    // ---------------------------------------------------------------- rendu
    render() {
      const ctx = this.ctx, st = this.st, lvl = this.lvl, cam = this.cam, t = this.elapsed;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, VW, VH);
      R.drawBackground(ctx, this.bg, cam, VW, VH, t);
      ctx.save();
      const shx = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0, shy = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0;
      ctx.translate(Math.round(-cam.x + shx), Math.round(-cam.y + shy));
      this.terrain.draw(ctx, cam.x, cam.y, VW, VH);
      R.drawInk(ctx, lvl, cam, VW, VH, t);
      const x0 = Math.max(0, Math.floor(cam.x / T) - 1), x1 = Math.min(lvl.w - 1, Math.ceil((cam.x + VW) / T) + 1), y0 = Math.max(0, Math.floor(cam.y / T) - 2), y1 = Math.min(lvl.h - 1, Math.ceil((cam.y + VH) / T) + 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = PR.cellAt(lvl, st, x, y); if (v === G.PAPER) R.drawPaperWall(ctx, x * T, y * T); else if (v === G.SPRING) R.drawSpring(ctx, x * T, y * T, this.springAnim.get(x + ',' + y) || 0); }
      for (const m of lvl.movers) { const p = PR.moverPos(m, st.t); if (p.x + m.w < cam.x - 50 || p.x > cam.x + VW + 50) continue; R.drawMover(ctx, p.x, p.y, m.w, m.h, m.vertical, t); }
      for (let k = 0; k < lvl.checkpoints.length; k++) { const c = lvl.checkpoints[k]; if (!this.onScreen(c.tx * T)) continue; R.drawFlag(ctx, c.tx * T, c.ty * T, t, k <= st.cp, this.char.outfit, false); }
      if (lvl.finish) R.drawFlag(ctx, lvl.finish.x, lvl.finish.y, t, true, '#ff5f7a', true);
      for (const g of this.glues) if (this.onScreen(g.x)) R.drawGlue(ctx, g.x, g.y, t);
      for (const c of this.coins) { if (c.taken || !this.onScreen(c.x)) continue; R.drawCoin(ctx, c.x, c.y, c.big, t); }
      for (const c of this.cubes) if (this.onScreen(c.x) && c.gone < 3.7) R.drawItemCube(ctx, c.x, c.y, t, c.gone > 0 ? Math.max(0, 4 - c.gone) : 0);
      for (const c of this.cannons) if (this.onScreen(c.x)) R.drawCannonBarrel(ctx, c.x, c.y, c.dir, Math.max(0, c.fire));
      for (const b of this.balls) R.drawCannonball(ctx, b.x, b.y);
      for (const e of this.enemies) {
        if (!this.onScreen(e.x)) continue;
        if (!e.alive) { if (e.dead < 0.35) { const u = e.dead / 0.35; ctx.save(); ctx.globalAlpha = 1 - u; ctx.translate(e.x, e.y + u * 60); ctx.rotate(u * 3); ctx.scale(1 - u * 0.5, 1 - u * 0.5); this.drawEnemy(ctx, Object.assign({}, e, { x: 0, y: 0, anchorY: e.anchorY - e.y }), t, u); ctx.restore(); } continue; }
        const fs = e.flipT > 0 ? -Math.cos(Math.PI * (1 - e.flipT / 0.14)) : 1;
        ctx.save(); ctx.translate(e.x, 0); ctx.scale(fs, 1); ctx.translate(-e.x, 0);
        this.drawEnemy(ctx, e, t, 0);
        ctx.restore();
      }
      // ambiance
      for (const a of this.ambient) this.drawAmbient(ctx, a, t);
      for (const r of this.racers) if (!r.isPlayer && this.onScreen(r.x)) this.drawGhost(ctx, r, t);
      this.drawHero(ctx, t);
      for (const s of this.shots) { if (s.kind === 'ball') R.drawBall(ctx, s.x, s.y, s.rot); else R.drawHomingPlane(ctx, s.x, s.y, s.ang, s.color); }
      for (const p of this.particles) { if (p.ring) { ctx.save(); ctx.globalAlpha = p.life / p.max; ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (1 - p.life / p.max) * 40, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } else R.drawPuff(ctx, p); }
      for (const p of this.scraps) R.drawConfetti(ctx, p);
      for (const p of this.pops) R.drawPop(ctx, p);
      ctx.restore();
      if (this.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (this.flash * 1.5).toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }
      if (this.orageT > 0) { ctx.fillStyle = 'rgba(80,60,160,' + (this.orageT * 0.6).toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }
      this.drawHud(ctx, t);
    }
    drawEnemy(ctx, e, t, u) {
      switch (e.kind) {
        case 'walker': R.drawWalker(ctx, e.x, e.y, e.face, t, u); break;
        case 'plane': R.drawPlane(ctx, e.x, e.y, e.face, e.t); break;
        case 'jumper': R.drawJumper(ctx, e.x, e.y, e.face, t, e.air, Math.max(0, e.squash)); break;
        case 'spiky': R.drawSpiky(ctx, e.x, e.y, e.face, e.t); break;
        case 'eraser': R.drawEraser(ctx, e.x, e.y, e.face, t, e.charging); break;
        case 'spider': R.drawSpider(ctx, e.x, e.y, e.anchorY, t); break;
        case 'plant': R.drawPlant(ctx, e.x, e.y, e.u, t, this.world.id === 'chateau' ? '#b48cf0' : '#ff5f5f'); break;
      }
    }
    drawAmbient(ctx, a, t) {
      const x = a.x, y = a.y; ctx.save(); ctx.translate(x, y);
      if (a.kind === 'butterfly') { const f = Math.sin(a.t * 14) * 0.8; ctx.scale(a.s, a.s); for (const sgn of [-1, 1]) { ctx.save(); ctx.scale(sgn, 1); ctx.rotate(f * 0.6); R.cut(ctx, c => { c.beginPath(); c.moveTo(0, 0); c.lineTo(12, -9); c.lineTo(12, 6); c.closePath(); }, a.hue < 0.5 ? '#ffd54a' : '#ff8fd0', { line: 2, edge: 0, shadow: false }); ctx.restore(); } }
      else if (a.kind === 'leaf') { ctx.rotate(a.t * 2); ctx.scale(a.s, a.s); R.cut(ctx, c => { c.beginPath(); c.ellipse(0, 0, 9, 5, 0.6, 0, TAU); }, a.hue < 0.5 ? '#ff8f5e' : '#ffcc4d', { line: 2, edge: 0, shadow: false }); }
      else if (a.kind === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; R.circle(ctx, 0, 0, 3 * a.s); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); }
      else if (a.kind === 'bat') { const f = Math.sin(a.t * 12) * 6; ctx.scale(a.s, a.s); R.cut(ctx, c => { c.beginPath(); c.moveTo(-18, -f); c.quadraticCurveTo(-9, 4, 0, 0); c.quadraticCurveTo(9, 4, 18, -f); c.quadraticCurveTo(10, 8, 0, 6); c.quadraticCurveTo(-10, 8, -18, -f); c.closePath(); }, '#3a2a4a', { line: 2, edge: 0, shadow: false }); }
      else { const f = Math.sin(a.t * 8) * 5; ctx.scale(a.s, a.s); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, -f); ctx.quadraticCurveTo(-6, 2, 0, 0); ctx.quadraticCurveTo(6, 2, 12, -f); ctx.stroke(); }
      ctx.restore();
    }
    drawGhost(ctx, r, t) {
      const f = r.flags, ground = f & 1;
      const pose = r.stun > 0 ? 'fall' : (f & 4) ? 'dash' : (f & 16) ? 'slide' : (f & 32) ? 'glide' : !ground ? ((f & 8) ? 'jump' : 'fall') : (r.finished ? 'win' : (r.t > 0 ? 'run' : 'idle'));
      const flipScale = r.flipT > 0 ? -Math.cos(Math.PI * (1 - r.flipT / 0.14)) : 1;
      ctx.save(); ctx.globalAlpha = 0.92;
      if (f & 64) { ctx.beginPath(); ctx.rect(r.x - 60, r.y - 160, 120, 160 - 2); ctx.clip(); ctx.translate(0, 40); }
      R.drawHero(ctx, r.ch, r.x, r.y, { face: r.face, flipScale, pose, walk: r.t * 14, rot: pose === 'dash' ? -0.25 * r.face : (r.stun > 0 ? Math.sin(r.spin) * 0.5 : 0) }, t);
      ctx.restore();
      if (r.stun > 0) R.drawStars(ctx, r.x, r.y - 88, t);
      if (r.shield > 0) R.drawShieldRing(ctx, r.x, r.y - 34, t, r.ch.outfit);
      R.text(ctx, r.ch.name, r.x, r.y - 104, 14, '#fffaf0', 'center', true);
      if (r.item && r.roll <= 0) R.text(ctx, PR.itemById(r.item).icon, r.x + 34, r.y - 102, 16, '#fff', 'center');
    }
    drawHero(ctx, t) {
      const st = this.st, v = this.vis;
      if (st.dead > 0 && this.deathAt) {
        const u = 1 - st.dead / 0.6; ctx.save(); ctx.translate(this.deathAt.x, this.deathAt.y + u * u * 120); ctx.rotate(u * 7); ctx.scale(1 - u * 0.5, 1 - u * 0.5);
        R.cut(ctx, c => { c.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 18 + (i % 2) * 6; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }, this.char.outfit, { line: 3, edge: 2 });
        ctx.restore(); return;
      }
      if (st.hurtT > 0 && st.dead <= 0 && Math.floor(t * 14) % 2) return;
      if (st.warpT > 0) { const u = st.warpT > 0.35 ? (0.7 - st.warpT) / 0.35 : st.warpT / 0.35; ctx.save(); ctx.beginPath(); ctx.rect(st.x - 60, st.y - 120, 148, 120 + st.h - 2); ctx.clip(); R.drawHero(ctx, this.char, st.x + st.w / 2, st.y + st.h + u * 70, { face: v.face, pose: 'idle' }, t); ctx.restore(); return; }
      const flipScale = v.flipT > 0 ? -Math.cos(Math.PI * (1 - v.flipT / 0.14)) : 1;
      const rot = v.pose === 'dash' ? -0.25 * st.face * flipScale : (v.pose === 'glide' ? 0.08 * st.face : (v.pose === 'stun' ? Math.sin(t * 14) * 0.45 : 0));
      R.drawHero(ctx, this.char, st.x + st.w / 2, st.y + st.h, { face: v.face, flipScale, pose: v.pose === 'stun' ? 'fall' : v.pose, walk: v.walk, scaleX: v.sx, scaleY: v.sy, rot, headTilt: v.pose === 'run' ? Math.sin(v.walk) * 0.05 : 0 }, t);
      if (v.pose === 'stun') R.drawStars(ctx, st.x + st.w / 2, st.y - 32, t);
      if (st.shield > 0) R.drawShieldRing(ctx, st.x + st.w / 2, st.y + st.h / 2 - 6, t, '#5ab8ff');
    }
    drawHud(ctx, t) {
      const st = this.st, pl = this.player;
      R.drawPosition(ctx, 62, 52, pl.pos, t);
      R.label(ctx, 116, 22, 118, 40, '#fffaf0'); R.text(ctx, PR.fmtTime(this.time), 175, 43, 22, '#2b1f1a', 'center');
      R.drawItemBox(ctx, VW / 2, 50, pl.roll > 0 ? pl.rollIcon : (pl.item ? PR.itemById(pl.item).icon : ''), pl.roll > 0, t);
      if (pl.item && pl.roll <= 0 && this.titleT <= 0) R.text(ctx, PR.input.touch ? 'Bouton objet' : 'E ou Ctrl : utiliser', VW / 2, 100, 13, '#fffaf0', 'center', true);
      R.label(ctx, VW - 130, 14, 114, 40, '#fffaf0'); R.drawCoin(ctx, VW - 106, 34, false, 0.4); R.text(ctx, String(this.stats.coins), VW - 86, 35, 22, '#2b1f1a');
      // classement à droite
      const F = root.FamilyHeads;
      this.order.forEach((r, i) => {
        const y = 74 + i * 44, me = r.isPlayer;
        R.label(ctx, VW - 184, y, 168, 38, me ? '#fff1b8' : 'rgba(255,250,240,0.85)');
        R.text(ctx, PR.POS_NAMES[i], VW - 172, y + 19, 15, '#2b1f1a');
        if (F && F.has(r.id)) F.draw(ctx, r.id, 'front', VW - 138, y + 3, 30, 32);
        R.text(ctx, r.ch.name, VW - 102, y + 19, 15, '#2b1f1a');
        if (!me) { const g = r.remaining - pl.remaining; R.text(ctx, r.finished ? '🏁' : (g >= 0 ? '+' : '') + g.toFixed(1), VW - 24, y + 19, 12, '#8a7a6a', 'right'); if (r.item && r.roll <= 0) R.text(ctx, PR.itemById(r.item).icon, VW - 64, y + 19, 13, '#000', 'center'); }
      });
      let y = VH - 44;
      if (this.cfg.dashLevel > 0) {
        const cd = C.DASH_CD[Math.min(this.cfg.dashLevel, 3) - 1] + C.DASH_T * this.cfg.dashMul, u = st.dashCd > 0 ? 1 - st.dashCd / cd : 1;
        R.label(ctx, 16, y, 150, 30, '#fffaf0'); ctx.fillStyle = u >= 1 ? '#7fd45a' : '#ffcc4d'; R.rr(ctx, 24, y + 8, 134 * Math.max(0, Math.min(1, u)), 14, 6); ctx.fill(); R.text(ctx, '💨 Élan', 92, y + 15, 13, '#2b1f1a', 'center'); y -= 36;
      }
      if (st.boost > 0) { R.label(ctx, 16, y, 150, 30, '#ffe3d6'); R.text(ctx, '🚀 Fusée ' + st.boost.toFixed(1) + ' s', 92, y + 15, 13, '#2b1f1a', 'center'); y -= 36; }
      if (st.slow > 0) { R.label(ctx, 16, y, 150, 30, '#dff0ff'); R.text(ctx, '🫧 Collé !', 92, y + 15, 13, '#2b1f1a', 'center'); y -= 36; }
      if (st.shield > 0) { R.label(ctx, 16, y, 150, 30, '#dff0ff'); R.text(ctx, '🛡️ Bouclier ×' + st.shield, 92, y + 15, 13, '#2b1f1a', 'center'); y -= 36; }
      if (this.titleT > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, this.titleT * 2);
        R.label(ctx, VW / 2 - 210, 120, 420, 64, '#fffaf0'); R.text(ctx, this.def.id + '  ·  ' + this.def.name, VW / 2, 143, 22, '#2b1f1a', 'center'); R.text(ctx, this.world.name + '  ·  ' + this.diff.name, VW / 2, 169, 14, '#8a7a6a', 'center'); ctx.restore();
      }
      if (this.phase === 'ready') { const n = Math.ceil(this.readyT - 0.4); R.text(ctx, n >= 1 ? String(Math.min(3, n)) : 'GO !', VW / 2, VH / 2 - 40, n >= 1 ? 90 : 70, n >= 1 ? '#fffaf0' : '#7fd45a', 'center', true); }
      if (this.phase === 'win' || this.phase === 'done') { const p = pl.pos; R.text(ctx, p === 1 ? '1er !' : PR.POS_NAMES[p - 1] + ' place', VW / 2, VH / 2 - 60, 60, ['#ffd54a', '#e6eaf0', '#e0a070', '#fffaf0'][p - 1], 'center', true); R.text(ctx, p === 1 ? 'Champion de papier !' : p === 4 ? 'Ça ira mieux la prochaine fois !' : 'Bien couru !', VW / 2, VH / 2 - 8, 24, '#fffaf0', 'center', true); }
      if (this.paused && !this.freeze) { ctx.fillStyle = 'rgba(40,30,20,0.45)'; ctx.fillRect(0, 0, VW, VH); R.text(ctx, 'PAUSE', VW / 2, VH / 2 - 120, 54, '#fffaf0', 'center', true); }
    }
  };
})(window);
