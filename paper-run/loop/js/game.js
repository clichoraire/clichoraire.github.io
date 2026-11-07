// Paper Loop — le tableau vivant : le joueur (physique), les courses (entrée → tirelire), l'enregistrement du parcours,
// les clones qui le rejouent en boucle, les machines des boutiques, la caméra, les effets et le HUD.
(function (root) {
  'use strict';
  const PL = root.PL = root.PL || {};
  const R = PL.render, C = PL.PHYS, T = C.T;
  const VW = 960, VH = 540;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u;
  const POSES = ['idle', 'run', 'jump', 'fall', 'slide'];

  PL.Game = class {
    // o : { canvas, char, profile, onChange() (sauvegarde), onPause(bool) }
    constructor(o) {
      this.canvas = o.canvas; this.ctx = this.canvas.getContext('2d');
      this.char = o.char; this.p = o.profile; this.onChange = o.onChange || (() => { }); this.onPause = o.onPause || (() => { });
      this.world = PL.WORLD; this.lvl = PL.parseLevel({ id: this.world.id, map: this.world.map });
      this.terrain = R.renderTerrain(this.lvl);
      this.wall = R.makeWall(this.lvl, 11);
      // les courses : définition, données du profil, pas de départ, tirelire, parcours enregistré, clones
      this.courses = this.world.courses.map(def => {
        const d = PL.courseData(this.p, def.id);
        const c = { def, d, start: { x: def.start.tx * T + (T - C.W) / 2 - 8, y: def.start.ty * T - C.H },
          goal: { x: def.goal.tx * T, y: def.goal.ty * T, w: def.goal.w * T, h: def.goal.h * T }, rec: d.rec || null, clones: [] };
        for (let i = 0; i < (d.clones || 0); i++) this.addClone(c, i);
        return c;
      });
      this.courseById = id => this.courses.find(c => c.def.id === id);
      // les hubs : point d'apparition et machines (chaque machine connaît son hub, donc sa course)
      this.hubs = this.world.hubs.map(h => {
        const hub = { def: h, course: this.courseById(h.course), spawn: { x: h.spawn.tx * T + (T - C.W) / 2, y: h.spawn.ty * T - C.H } };
        hub.machines = h.machines.map(m => ({ def: PL.machineById(m.id), hub, tx: m.tx, ty: h.spawn.ty - 4, x: m.tx * T, y: (h.spawn.ty - 4) * T, w: 2 * T, h: T, cx: m.tx * T + T, bump: 0, shake: 0, cd: 0 }));
        return hub;
      });
      this.hubById = id => this.hubs.find(h => h.def.id === id);
      this.machines = this.hubs.flatMap(h => h.machines);
      // les blocs sont solides (on s'y cogne la tête, on marche dessus) mais dessinés par drawBlock, pas par le terrain
      for (const m of this.machines) { this.lvl.grid[m.ty * this.lvl.w + m.tx] = PL.TILE.SOLID; this.lvl.grid[m.ty * this.lvl.w + m.tx + 1] = PL.TILE.SOLID; }
      this.cfg = this.buildCfg();
      this.st = PL.newState(this.lvl); this.st.x = this.hubs[0].spawn.x; this.st.y = this.hubs[0].spawn.y;
      this.vis = { face: 1, flipT: 0, pose: 'idle', walk: 0, sx: 1, sy: 1 };
      this.run = null;
      this.particles = []; this.pops = []; this.confetti = [];
      this.cam = { x: 0, y: 0 }; this.t = 0; this.happy = 0; this.flash = 0; this.stats = false; this.paused = false; this.freeze = false;
      this.running = false; this.last = 0; this.acc = 0; this.raf = 0; this.pending = { jump: false, item: false, dash: false };
      this.welcome = PL.totalRuns(this.p) ? 0 : 7;
      this.onKey = e => { if (e.code === 'Tab') { e.preventDefault(); if (!e.repeat) this.stats = !this.stats; } };
      window.addEventListener('keydown', this.onKey);
      this.snapCamera();
    }
    buildCfg() { return PL.buildCfg({ ruban: this.p.wall ? 1 : 0, elan: this.p.dash ? 1 : 0, double: this.p.double ? 1 : 0 }); }
    addClone(c, i) { const d = c.rec ? c.rec.dur + PL.ECON.clonePause : 1; c.clones.push({ t: c.rec ? (i * 0.37 * d) % d : 0, walk: Math.random() * 6 }); }
    // point de retour hors course : le pas de la course dont on est dans le coin, sinon l'apparition du hub
    startFor() {
      const st = this.st, r = this.world.startFor(Math.floor((st.x + st.w / 2) / T), Math.floor((st.y + st.h - 1) / T));
      return r.course ? this.courseById(r.course).start : r.hub ? this.hubById(r.hub).spawn : { x: r.tx * T + (T - C.W) / 2, y: r.ty * T - C.H };
    }

    // ---- boucle
    start() { this.running = true; if (!R.warmClones(this.char)) root.FamilyHeads.ready.then(() => R.warmClones(this.char)); this.last = performance.now(); const loop = now => { if (!this.running) return; this.frame(now); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
    stop() { this.running = false; cancelAnimationFrame(this.raf); window.removeEventListener('keydown', this.onKey); }
    setPaused(p) { this.paused = p; this.onPause(p); if (!p) this.last = performance.now(); }
    frame(now) {
      const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
      const inp = PL.input.take();
      if (inp.mute) { const m = PL.audio.toggle(); this.pop(this.st.x + 14, this.st.y - 30, m ? 'Son coupé' : 'Son !', '#fff', 18); }
      if (inp.pause) { this.setPaused(!this.paused); return; }
      if (this.paused || this.freeze) { this.render(); return; }
      if (inp.jump) this.pending.jump = true; if (inp.item) this.pending.item = true; if (inp.dash) this.pending.dash = true;
      this.acc += dt;
      while (this.acc >= C.STEP) {
        const stepInp = Object.assign({}, inp, { jump: this.pending.jump, item: this.pending.item, dash: this.pending.dash, jumpHeld: inp.jumpHeld || this.pending.jump });
        this.pending.jump = false; this.pending.item = false; this.pending.dash = false;
        this.update(C.STEP, stepInp); this.acc -= C.STEP;
      }
      this.render();
    }

    // ---------------------------------------------------------------- mise à jour
    update(dt, inp) {
      const st = this.st, lvl = this.lvl;
      this.t += dt; if (this.welcome > 0) this.welcome -= dt;
      lvl.start = this.run ? this.run.course.start : this.startFor();
      const prev = { x: st.x, y: st.y, vy: st.vy, ground: st.ground, face: st.face, deaths: st.deaths, sliding: st.sliding, dashing: st.dashing, cx: st.x + st.w / 2, feet: st.y + st.h };
      PL.step(st, inp, dt, lvl, this.cfg);
      const cx = st.x + st.w / 2, feet = st.y + st.h;
      // --- sons et effets du héros
      if (st.face !== prev.face) this.vis.flipT = 0.14;
      if (st.ground && !prev.ground && st.vy === 0) { PL.audio.play('land'); this.vis.sx = 1.25; this.vis.sy = 0.78; this.puffs(cx, feet, 3); }
      if (!st.ground && prev.ground && st.vy < -100) { PL.audio.play('jump'); this.vis.sx = 0.85; this.vis.sy = 1.18; this.puffs(cx, feet, 2); }
      if (st.jumpedFrom === 2 && st.held && st.jumpAge <= dt + 1e-6) { PL.audio.play('double'); this.puffs(cx - st.face * 14, feet - 20, 3); }
      if (st.dashing && !prev.dashing) { PL.audio.play('dash'); this.vis.sx = 1.3; this.vis.sy = 0.8; this.puffs(cx - st.face * 16, feet - 16, 4); }
      if (st.sliding && Math.random() < 0.3) this.particles.push({ x: cx + st.face * 12, y: feet - 20 - Math.random() * 20, vx: 0, vy: 40, r: 3, life: 0.3, max: 0.3, color: '#fff6e4' });
      if (st.deaths !== prev.deaths) {
        PL.audio.play('hurt'); this.burst(prev.cx, prev.y + 28, 14, ['#fff6e4', this.char.outfit]); this.flash = 0.35;
        if (this.run) { this.run = null; this.pop(prev.cx, prev.y - 20, 'Aïe ! On recommence.', '#ff5f5f', 20); }
      }
      // --- courses : départ, enregistrement, abandon, arrivée
      if (!this.run) for (const c of this.courses) if (this.entered(c, prev, cx, feet)) {
        this.run = { course: c, t: 0, frames: [] }; PL.audio.play('go'); this.pop(cx, st.y - 40, 'GO !', '#7fd45a', 34); break;
      }
      if (this.run) {
        const r = this.run, c = r.course; r.t += dt;
        r.frames.push(Math.round(st.x), Math.round(st.y), st.face, POSES.indexOf(this.poseOf(st)));
        if (this.leftCourse(c, cx, feet)) { this.run = null; this.pop(cx, st.y - 30, 'Course annulée', '#8a7a6a', 18); }
        else if (c.def.cancelAbove != null && feet < c.def.cancelAbove) { this.run = null; this.pop(cx, st.y - 30, 'On explore !', '#8a7a6a', 18); }   // monté dans le puits : ce n'est plus la course
        else if (PL.overlap(st, c.goal)) this.finishRun();
      }
      // --- blocs à acheter : un coup de tête par en dessous (la physique a arrêté la montée pile sous le bloc)
      for (const m of this.machines) {
        if (m.bump > 0) m.bump -= dt; if (m.shake > 0) m.shake -= dt; if (m.cd > 0) m.cd -= dt;
        if (m.cd <= 0 && prev.vy < 0 && st.vy === 0 && !st.ground && Math.abs(st.y - (m.y + m.h)) < 1 && st.x + st.w > m.x && st.x < m.x + m.w) { m.cd = 0.35; this.buy(m); }
      }
      // --- clones (de toutes les courses)
      for (const c of this.courses) if (c.rec) for (const cl of c.clones) {
        const before = cl.t; cl.t += dt * (cl.fast ? PL.ECON.fastMul : 1); cl.walk += dt * 14 * (cl.fast ? PL.ECON.fastMul : 1);
        if (before < c.rec.dur && cl.t >= c.rec.dur) { const g = PL.cloneReward(this.p, c.def); PL.addGold(this.p, g); this.happy = 0.5; this.pop(c.goal.x + 40, c.goal.y - 10, '+' + PL.fmtGold(g), '#ffd84a', 18); this.changed = true; }
        if (cl.t >= c.rec.dur + PL.ECON.clonePause) { cl.t = 0; cl.fast = Math.random() < PL.fastChance(this.p); }   // nouveau tour : parfois un tour rapide
      }
      if (this.changed && Math.floor(this.t) !== Math.floor(this.t - dt)) { this.changed = false; this.onChange(); }
      // --- particules, caméra, visuel
      for (const list of [this.particles, this.confetti]) for (let i = list.length - 1; i >= 0; i--) { const p = list[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g == null ? 300 : p.g) * dt; if (p.rot != null) p.rot += 3 * dt; if (p.life <= 0) list.splice(i, 1); }
      for (let i = this.pops.length - 1; i >= 0; i--) { const p = this.pops[i]; p.life -= dt; if (p.life <= 0) this.pops.splice(i, 1); }
      if (this.flash > 0) this.flash -= dt; if (this.happy > 0) this.happy -= dt;
      const v = this.vis; v.face = st.face; if (v.flipT > 0) v.flipT -= dt;
      v.sx = lerp(v.sx, 1, Math.min(1, dt * 12)); v.sy = lerp(v.sy, 1, Math.min(1, dt * 12));
      v.pose = this.poseOf(st); if (v.pose === 'run') v.walk += dt * (10 + Math.abs(st.vx) / 25);
      this.updateCamera(dt);
    }
    poseOf(st) { return st.sliding ? 'slide' : !st.ground ? (st.vy < 0 ? 'jump' : 'fall') : Math.abs(st.vx) > 30 ? 'run' : 'idle'; }
    // on vient d'entrer dans la course (voir world.js : entry)
    entered(c, prev, cx, feet) {
      const e = c.def.entry;
      if (e.kind === 'x') return prev.cx < e.x && cx >= e.x && feet > e.y0 && feet <= e.y1;
      return prev.feet <= e.y && feet > e.y && cx >= e.x0 && cx < e.x1;
    }
    // on est ressorti par l'entrée : la course est annulée
    leftCourse(c, cx, feet) {
      const e = c.def.entry;
      if (e.kind === 'x') return cx < e.x - 20 && feet > e.y0 && feet <= e.y1;
      return feet < e.y - 4 && cx >= e.x0 && cx < e.x1;
    }

    finishRun() {
      const r = this.run, c = r.course, d = c.d, st = this.st, p = this.p; this.run = null;
      const g = PL.reward(p, c.def); PL.addGold(p, g); d.runs = (d.runs || 0) + 1;
      // les clones rejouent toujours le MEILLEUR parcours : on ne remplace l'enregistrement que sur un record
      const record = d.best == null || r.t < d.best || !d.rec;
      if (record) { d.best = r.t; c.rec = d.rec = { dur: r.t, step: C.STEP, f: r.frames }; for (const cl of c.clones) cl.t = Math.min(cl.t, c.rec.dur); }
      PL.audio.play(record ? 'win' : 'bigcoin'); this.happy = 0.8;
      this.pop(st.x + 14, st.y - 44, '+' + PL.fmtGold(g), '#ffd84a', 30);
      this.pop(st.x + 14, st.y - 80, PL.fmtTime(r.t) + (record ? '  Record !' : ''), record ? '#ff5fc8' : '#fffaf0', 20);
      if (d.runs === 1 && c.def.tip) this.pop(st.x - 60, st.y - 116, c.def.tip, '#fffaf0', 15);
      // médailles : record sous le temps demandé (une seule fois chacune) → bonus, étoile sur le panneau, tirelire argentée / dorée
      let dy = 150;
      for (const md of c.def.medals || []) if (!d.medals[md.id] && r.t <= md.time) {
        d.medals[md.id] = true; PL.addGold(p, md.bonus); PL.audio.play('win');
        const gold = md.id === 'gold';
        this.pop(st.x + 14, st.y - dy, (gold ? 'Médaille d’or ! +' : 'Médaille d’argent ! +') + md.bonus, gold ? '#ffd84a' : '#dfe5ec', 26); dy += 34;
        for (let i = 0; i < 30; i++) this.confetti.push({ x: c.goal.x + 40, y: c.goal.y + 20, vx: (Math.random() - 0.5) * 420, vy: -200 - Math.random() * 300, r: 3 + Math.random() * 4, rot: Math.random() * 6, color: gold ? ['#ffd84a', '#ffe9a8', '#e0a800'][i % 3] : ['#ffffff', '#dfe5ec', '#b9c3cf'][i % 3], life: 1.6, max: 1.6 });
      }
      for (let i = 0; i < 18; i++) this.confetti.push({ x: c.goal.x + 40, y: c.goal.y + 20, vx: (Math.random() - 0.5) * 300, vy: -150 - Math.random() * 250, r: 4 + Math.random() * 4, rot: Math.random() * 6, color: ['#ff5fc8', '#ffd54a', '#5ab8ff', '#7fd45a'][i % 4], life: 1.2, max: 1.2 });
      if (c.clones.length && record && d.runs > 1) this.pop(c.goal.x + 40, c.goal.y - 150, 'Tes clones prennent ce nouveau parcours !', '#fffaf0', 16);
      else if (c.clones.length && d.runs === 1) this.pop(c.goal.x + 40, c.goal.y - 150, 'Tes clones connaissent le chemin !', '#fffaf0', 16);
      this.onChange();
    }
    countOf(m) {
      const d = m.def, p = this.p;
      if (d.scope === 'course') return m.hub.course.d[d.id === 'clone' ? 'clones' : 'mult'] || 0;
      return typeof p[d.id] === 'boolean' ? (p[d.id] ? 1 : 0) : (p[d.id] || 0);
    }
    priceOf(m) { return m.def.price(this.countOf(m), m.hub.course.def); }
    buy(m) {
      const d = m.def, p = this.p, n = this.countOf(m), price = this.priceOf(m), c = m.hub.course;
      if (n >= d.max) { PL.audio.play('nope'); m.shake = 0.25; return; }
      if (p.gold < price) { PL.audio.play('nope'); m.shake = 0.3; this.pop(m.cx, m.y - 44, 'Il manque ' + PL.fmtGold(price - p.gold) + ' pièce' + (price - p.gold > 1 ? 's' : ''), '#ff5f5f', 17); return; }
      PL.addGold(p, -price); p.total = Math.round(((p.total || 0) + price) * 10) / 10; PL.audio.play('buy'); m.bump = 0.4; this.burst(m.cx, m.y - 10, 12, ['#ffd84a', '#fff']);
      this.vis.sx = 1.2; this.vis.sy = 0.85;
      if (d.id === 'wall' || d.id === 'dash' || d.id === 'double') { p[d.id] = true; this.cfg = this.buildCfg(); }
      else if (d.id === 'watts2') { p.watts2 = (p.watts2 || 0) + 1; p.watts = (p.watts || 0) + 1; }   // même bonus global, compteur de prix à part
      else if (d.id === 'watts' || d.id === 'cmult' || d.id === 'speed') p[d.id] = (p[d.id] || 0) + 1;
      else if (d.id === 'clone') { c.d.clones = (c.d.clones || 0) + 1; this.addClone(c, c.d.clones - 1); }
      else if (d.id === 'mult') c.d.mult = (c.d.mult || 0) + 1;
      const msg = d.bought(p, c.def);
      this.pop(m.cx, m.y - 50, msg[0], '#7fd45a', 20); if (msg[1]) this.pop(m.cx, m.y - 80, msg[1], '#fffaf0', 14);
      if (d.id === 'clone' && !c.rec) this.pop(m.cx, m.y - 80, 'Il attend que tu finisses la course ' + c.def.name + ' une fois.', '#fffaf0', 14);
      this.onChange();
    }
    income() { const f = PL.fastChance(this.p), speed = 1 + f * (PL.ECON.fastMul - 1); let s = 0; for (const c of this.courses) if (c.rec && c.clones.length) s += c.clones.length * PL.cloneReward(this.p, c.def) * speed / (c.rec.dur + PL.ECON.clonePause); return s; }

    // ---- caméra et effets
    snapCamera() { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; }
    camTarget() { const st = this.st, lvl = this.lvl; return { x: clamp(st.x + st.w / 2 + st.face * 70 - VW / 2, 0, lvl.pw - VW), y: clamp(st.y + st.h / 2 - VH * 0.74, 0, lvl.ph - VH) }; }
    updateCamera(dt) { const t = this.camTarget(); this.cam.x = lerp(this.cam.x, t.x, Math.min(1, dt * 5)); this.cam.y = lerp(this.cam.y, t.y, Math.min(1, dt * (this.st.ground ? 7 : 3.2))); }
    puffs(x, y, n) { for (let i = 0; i < n; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 40, r: 4 + Math.random() * 4, life: 0.35, max: 0.35, color: '#fff6e4', g: -40 }); }
    burst(x, y, n, colors) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 200; this.confetti.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, r: 3 + Math.random() * 4, rot: Math.random() * 6, color: colors[i % colors.length], life: 0.8, max: 0.8 }); } }
    pop(x, y, text, color, size) { this.pops.push({ x, y, text, color, size, life: 1.4, max: 1.4 }); }

    // ---------------------------------------------------------------- rendu
    render() {
      const ctx = this.ctx, cam = this.cam, st = this.st, t = this.t, lvl = this.lvl, w = this.world, p = this.p;
      const inView = (x, y, mx, my) => x > cam.x - mx && x < cam.x + VW + mx && y > cam.y - my && y < cam.y + VH + my;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      R.drawWall(ctx, this.wall, cam, VW, VH);
      ctx.save(); ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
      // décor collé au mur (derrière tout)
      R.drawPoster(ctx, w.poster.tx * T, w.poster.ty * T, w.poster.w * T, w.poster.h * T, PL.input.touch);
      for (const d of w.decor || []) if (d.kind === 'wheel' && inView(d.tx * T, d.ty * T, d.r + 60, d.r + 60)) R.drawWheel(ctx, d.tx * T, d.ty * T, d.r, t);
      for (const c of this.courses) {
        const d = c.def; if (!inView(d.signTx * T, d.signTy * T, 300, 300)) continue;
        R.drawBanner(ctx, d.bannerTx * T, d.bannerTy * T + 10, 236, 'COURSE ' + d.name);
        R.drawSign(ctx, d.signTx * T, d.signTy * T, { reward: PL.reward(p, d), cloneMult: PL.cloneMult(p), best: c.d.best, clones: c.clones.length, medal: PL.bestMedal(c.d), active: !!(this.run && this.run.course === c), t });
      }
      // terrain
      const sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y)), sw = Math.min(lvl.pw - sx, VW + 2), sh = Math.min(lvl.ph - sy, VH + 2);
      for (const ch of this.terrain.chunks) { const x0 = Math.max(sx, ch.x0), x1 = Math.min(sx + sw, ch.x0 + ch.cv.width); if (x1 > x0) ctx.drawImage(ch.cv, x0 - ch.x0, sy, x1 - x0, sh, x0, sy, x1 - x0, sh); }
      // flèches et rappels
      for (const m of w.markers) {
        const ax = (m.tx + (m.w || 1) / 2) * T, ay = (m.ty + 0.5) * T; if (!inView(ax, ay, 120, 120)) continue;
        if (!m.need || p[m.need]) R.drawArrow(ctx, ax, ay, t, m.dir);
        if (m.label && (m.labelHide ? !p[m.labelHide] : m.need ? !p[m.need] : true)) { R.label(ctx, ax - 68, ay + 44, 136, 30, '#fffaf0'); R.text(ctx, m.label, ax, ay + 59, 13, R.INK, 'center'); }
      }
      // pas de départ : bande à damier sur la case du pas (et, pour les courses qui commencent par une chute, la corniche
      // d'arrivée du puits est marquée d'un damier sur toute sa largeur et d'un drapeau DÉPART)
      const checker = (lx, ly, w) => { ctx.fillStyle = '#fffaf0'; ctx.fillRect(lx, ly, w, 10); ctx.fillStyle = R.INK; for (let k = 0; k < w / 12; k++) ctx.fillRect(lx + k * 12, ly + (k % 2 ? 5 : 0), 12, 5); ctx.strokeStyle = R.INK; ctx.lineWidth = 2; ctx.strokeRect(lx, ly, w, 10); };
      for (const c of this.courses) {
        const lx = c.def.start.tx * T, ly = c.def.start.ty * T - 2; if (inView(lx, ly, 100, 100)) checker(lx, ly, T);
        const pd = c.def.pad; if (pd && inView(pd.tx * T, pd.ty * T, 200, 200)) { checker(pd.tx * T, pd.ty * T - 2, pd.w * T); R.drawFlag(ctx, pd.tx * T + 10, pd.ty * T, 'DÉPART', t); }
      }
      // blocs à acheter (saut du bloc à l'achat, tremblement si on n'a pas assez)
      for (const m of this.machines) {
        if (!inView(m.cx, m.y, 120, 120)) continue;
        const n = this.countOf(m), price = this.priceOf(m), state = n >= m.def.max ? 'done' : p.gold >= price ? 'can' : 'poor';
        const off = m.bump > 0 ? -Math.sin((1 - m.bump / 0.4) * Math.PI) * 14 : 0, sh = m.shake > 0 ? Math.sin(m.shake * 70) * 3 : 0;
        const title = m.def.block.map(l => l.replace('{C}', m.hub.course.def.name));
        const sub = m.def.id === 'mult' ? '→ ' + PL.fmtGold(PL.rewardAt(p, m.hub.course.def, n + 1)) + ' / course' : m.def.sub;
        R.drawMachine(ctx, m.cx + sh, m.y + m.h + off, { title, sub, price, state, done: m.def.max > 1 ? 'Plafond' : 'Acheté', count: m.def.max > 1 ? n : 0, near: false }, t);   // la carte, le bas posé sur le bloc solide
      }
      for (const c of this.courses) if (inView(c.goal.x, c.goal.y, 150, 150)) R.drawPiggy(ctx, c.goal.x + 40, c.goal.y + c.goal.h, t, this.happy, PL.bestMedal(c.d));
      // clones (seulement ceux qui sont à l'écran) : invisibles à moins d'un personnage du héros (pour ne pas le cacher), de
      // plus en plus opaques en s'éloignant (0 % à 60 px → 100 % à 520 px)
      const hx = st.x + st.w / 2, hy = st.y + st.h / 2;
      const alphaAt = (x, y) => { const d = Math.hypot(x - hx, y - 28 - hy); return d < 60 ? 0 : d > 520 ? 1 : (d - 60) / 460; };
      for (const c of this.courses) {
        if (c.rec) for (const cl of c.clones) {
          const f = c.rec.f, i = Math.min(f.length / 4 - 1, Math.floor(cl.t / c.rec.step)) * 4;
          const cx0 = f[i] + C.W / 2, cy0 = f[i + 1] + C.H; if (!inView(cx0, cy0, 80, 140)) continue;
          const pose = cl.t >= c.rec.dur ? 'win' : POSES[f[i + 3]] || 'idle';
          const a = alphaAt(cx0, cy0); if (a > 0.01) R.drawClone(ctx, this.char, cx0, cy0, { face: f[i + 2], pose, walk: cl.walk, alpha: a }, t + cl.walk);
        } else c.clones.forEach((cl, k) => { const x0 = c.start.x + C.W / 2 - 40 - k * 22, y0 = c.start.y + C.H; if (inView(x0, y0, 80, 140)) R.drawClone(ctx, this.char, x0, y0, { face: 1, pose: 'idle', alpha: alphaAt(x0, y0) }, t + cl.walk); });
      }
      // héros
      const v = this.vis, flipScale = v.flipT > 0 ? Math.cos((1 - v.flipT / 0.14) * Math.PI) * -1 : 1;
      R.drawHero(ctx, this.char, st.x + st.w / 2, st.y + st.h, { face: v.face, flipScale, pose: st.dashing ? 'dash' : v.pose, walk: v.walk, scaleX: v.sx, scaleY: v.sy, headTilt: v.pose === 'run' ? Math.sin(v.walk) * 0.05 : 0 }, t);
      for (const q of this.particles) R.drawPuff(ctx, q);
      for (const q of this.confetti) R.drawConfetti(ctx, q);
      for (const q of this.pops) R.drawPop(ctx, q);
      ctx.restore();
      this.renderHUD(ctx);
    }
    renderHUD(ctx) {
      const p = this.p;
      if (this.flash > 0) { ctx.fillStyle = 'rgba(255,80,80,' + (this.flash * 0.6) + ')'; ctx.fillRect(0, 0, VW, VH); }
      // porte-monnaie
      const gold = PL.fmtGold(p.gold), w = 110 + gold.length * 16;
      R.label(ctx, VW / 2 - w / 2, 12, w, 50, '#fffaf0'); R.coinIcon(ctx, VW / 2 - w / 2 + 28, 37, 13); R.text(ctx, gold, VW / 2 - w / 2 + 50, 38, 28, R.INK);
      const inc = this.income(); if (inc > 0) { R.label(ctx, VW / 2 - 46, 64, 92, 26, 'rgba(255,250,240,0.85)'); R.text(ctx, '+' + (inc >= 10 ? Math.round(inc) : inc.toFixed(1).replace('.', ',')) + ' / s', VW / 2, 77, 14, '#2f6d2a', 'center'); }
      // course en cours
      if (this.run) { R.label(ctx, 16, 14, 150, 40, '#fff1b8'); R.text(ctx, '⏱ ' + PL.fmtTime(this.run.t), 91, 35, 20, R.INK, 'center'); }
      // aide
      R.label(ctx, VW - 196, 16, 180, 28, 'rgba(255,250,240,0.85)'); R.text(ctx, 'Tab : stats · Échap : menu', VW - 106, 30, 13, '#5a4a3a', 'center');
      if (this.welcome > 0 && !this.run) { ctx.save(); ctx.globalAlpha = Math.min(1, this.welcome); R.label(ctx, VW / 2 - 230, VH - 70, 460, 44, '#fffaf0'); R.text(ctx, 'Va à droite : la boutique, puis la course UN. Chaque course donne des pièces !', VW / 2, VH - 48, 14, R.INK, 'center'); ctx.restore(); }
      if (this.stats) {
        const lines = [['Pièces gagnées', PL.fmtGold(p.total || 0)]];
        const medals = [];
        for (const c of this.courses) { const d = c.d; if (PL.bestMedal(d)) medals.push([lines.length, PL.bestMedal(d)]); lines.push(['Course ' + c.def.name, (d.runs || 0) + ' finie' + (d.runs > 1 ? 's' : '')], ['   récompense · clones', PL.fmtGold(PL.reward(p, c.def)) + ' · ' + c.clones.length], ['   meilleur temps', d.best == null ? '--' : PL.fmtTime(d.best)]); }
        lines.push(['Part des clones', PL.fmtMult(PL.cloneMult(p))], ['Pièces en plus', '+' + Math.round(PL.ECON.wattsStep * (p.watts || 0) * 100) + ' %'], ['Clones rapides', Math.round(PL.fastChance(p) * 100) + ' %'], ['Mural · Élan · Air', (p.wall ? 'oui' : 'non') + ' · ' + (p.dash ? 'oui' : 'non') + ' · ' + (p.double ? 'oui' : 'non')]);
        R.label(ctx, VW - 286, 50, 270, 26 + lines.length * 25, '#fffaf0');
        lines.forEach(([k, v], i) => { R.text(ctx, k, VW - 270, 76 + i * 25, 15, '#5a4a3a'); R.text(ctx, String(v), VW - 32, 76 + i * 25, 16, R.INK, 'right'); });
        for (const [i, kind] of medals) R.drawMedal(ctx, VW - 150, 66 + i * 25, 7, this.t, kind);   // médaille à côté du nom de la course
      }
      if (this.paused && !this.freeze) { ctx.fillStyle = 'rgba(40,30,20,0.45)'; ctx.fillRect(0, 0, VW, VH); }
    }
  };
})(window);
