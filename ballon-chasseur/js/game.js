// Simulation d'un match de ballon chasseur façon Super Dodge Ball (NES) : joueurs intérieurs et extérieurs,
// balle vivante ou morte, lancers, attrapés, dégâts, K.-O. en ange, course (double appui) et lancers spéciaux.
(function (BC) {
  'use strict';
  const C = BC.COURT, G = BC.GRAVITY;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const HITTABLE = { idle: 1, windup: 1, throw: 1, catch: 1, jump: 1, pickup: 1, return: 1 };
  const STEP_PERIOD = 0.2;              // durée d'un pas en course
  const CHEST = 30;                     // hauteur d'un lancer (px)

  BC.Game = class Game {
    // opts : { teams: [A, B], ctrl: ['p1'|'p2'|'cpu', …], difficulty: 0..2, intro: bool }
    constructor(opts) {
      this.teams = opts.teams; this.ctrl = opts.ctrl; this.difficulty = opts.difficulty || 0;
      this.court = BC.COURTS[this.teams[1].court] || BC.COURTS.gym; this.courtId = this.teams[1].court;
      this.time = 0; this.phase = opts.intro === false ? 'play' : 'ready'; this.phaseT = 0;
      this.events = []; this.fx = []; this.messages = [];
      this.players = []; this.winner = null; this.endT = 0; this.stats = [{ throws: 0, supers: 0, catches: 0, hits: 0 }, { throws: 0, supers: 0, catches: 0, hits: 0 }];
      this.flash = 0; this.shake = 0; this.prevIn = [{}, {}]; this.lock = [null, null];
      this.squads = BC.squads(this.teams[0], this.teams[1]);
      for (let t = 0; t < 2; t++) {
        const team = this.teams[t], sq = this.squads[t];
        const dir = t === 0 ? 1 : -1;
        const home = t === 0 ? [C.left + 150, C.left + 270, C.left + 150] : [C.right - 150, C.right - 270, C.right - 150];
        const ys = [(C.top + C.bottom) / 2 - 95, (C.top + C.bottom) / 2, (C.top + C.bottom) / 2 + 95];
        sq.inner.forEach((pid, i) => this.players.push(this.makePlayer(pid, t, 'in', null, home[i], ys[i], dir)));
        const lanes = ['top', 'bottom', 'back'];
        sq.outer.forEach((pid, i) => {
          const lane = lanes[i], ox = t === 0 ? C.mid + (C.right - C.mid) / 2 : C.left + (C.mid - C.left) / 2;
          let x = ox, y = (C.top + C.bottom) / 2;
          if (lane === 'top') y = C.top - BC.LANE; else if (lane === 'bottom') y = C.bottom + BC.LANE; else x = t === 0 ? C.right + BC.LANE : C.left - BC.LANE;
          this.players.push(this.makePlayer(pid, t, 'out', lane, x, y, lane === 'back' ? -dir : dir));
        });
      }
      this.ball = { x: C.mid, y: (C.top + C.bottom) / 2, z: 230, vx: rnd(-1, 1) < 0 ? -35 : 35, vy: 0, vz: 0, holder: null, state: 'dead', team: -1, thrower: null, dmg: 0, superId: null, t: 0, r: BC.BALL_R, trail: [], alpha: 1, visible: true };
      this.ball.r0 = BC.BALL_R;
      this.ai = new BC.AI(this);
      if (this.phase === 'ready') this.say('PRÊTS ?', 1.3);
    }
    makePlayer(pid, t, zone, lane, x, y, dir) {
      const def = BC.PLAYERS[pid], ph = BC.phys(def);
      return { id: pid, def, phys: ph, team: t, zone, lane, x, y, z: 0, vz: 0, vx: 0, vy: 0, hp: ph.maxHp, maxHp: ph.maxHp,
        state: 'idle', stateT: 0, facing: dir, frame: 0, moving: false, dash: { taps: 0, lastTap: -9, dir: 0, active: false, t: 0, fromJump: false },
        hasBall: false, alive: true, knock: 0, knockDir: 1, ko: 0, aiT: rnd(0, 1), ai: {}, lent: this.squads[t].lent.includes(pid), home: { x, y }, catchT: 0 };
    }
    get T() { return this.teams; }
    say(text, dur, sub) { this.messages.push({ text, sub, t: 0, dur: dur || 1.5 }); }
    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); }
    inner(t) { return this.players.filter(p => p.team === t && p.zone === 'in'); }
    aliveInner(t) { return this.inner(t).filter(p => p.alive); }
    outer(t) { return this.players.filter(p => p.team === t && p.zone === 'out'); }
    opponentsOf(p) { return this.aliveInner(1 - p.team); }
    isHuman(t) { return this.ctrl[t] !== 'cpu'; }
    sideOf(x) { return x < C.mid ? 0 : 1; }           // moitié du terrain : 0 = gauche
    heightOf(p) { return 50 * Math.max(0.55, p.def.size); }

    // ---------- Contrôle : qui le joueur humain dirige ----------
    controlled(t) {
      const b = this.ball;
      if (b.holder && b.holder.team === t) return b.holder;
      const lock = this.lock[t]; if (lock && lock.alive && (lock.zone === 'in' || lock.zone === 'out')) return lock;
      return this.retarget(t);
    }
    // Choisit (et mémorise) le joueur contrôlé : le joueur visé par une balle adverse, sinon le plus proche d'une balle morte.
    // Appelé seulement aux événements (lancer, balle morte, possession), jamais à chaque image : le contrôle ne saute pas.
    retarget(t) {
      const b = this.ball, mine = this.aliveInner(t); if (!mine.length) return null;
      let pick = null;
      if (b.state === 'live' && b.team !== t) pick = mine.slice().sort((a, c) => Math.abs(a.y - b.y) - Math.abs(c.y - b.y))[0];
      else if (b.state !== 'held') {
        if (this.sideOf(b.x) === t && b.y > C.top - 20 && b.y < C.bottom + 20 && b.x > C.left - 20 && b.x < C.right + 20) pick = mine.slice().sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0];
        else pick = this.outer(t).find(o => this.inLane(o, b)) || null;
      }
      if (!pick) { const cur = this.lock[t]; pick = cur && cur.alive && cur.zone === 'in' ? cur : mine.slice().sort((a, c) => Math.abs(a.y - b.y) - Math.abs(c.y - b.y))[0]; }
      this.lock[t] = pick; return pick;
    }
    retargetAll() { for (let t = 0; t < 2; t++) if (this.isHuman(t)) this.retarget(t); }
    // La balle est-elle dans le couloir de cet extérieur ?
    inLane(o, b) {
      const half = o.team === 0 ? [C.mid - 30, C.right + BC.LANE + 40] : [C.left - BC.LANE - 40, C.mid + 30];
      if (o.lane === 'top') return b.y < C.top + 30 && b.x > half[0] && b.x < half[1];
      if (o.lane === 'bottom') return b.y > C.bottom - 30 && b.x > half[0] && b.x < half[1];
      return o.team === 0 ? b.x > C.right - 30 : b.x < C.left + 30;
    }

    // ---------- Boucle ----------
    update(dt, inputs) {
      this.time += dt; this.phaseT += dt;
      this.flash = Math.max(0, this.flash - dt * 3); this.shake = Math.max(0, this.shake - dt * 30);
      for (const m of this.messages) m.t += dt; this.messages = this.messages.filter(m => m.t < m.dur);
      for (const f of this.fx) f.t += dt; this.fx = this.fx.filter(f => f.t < f.dur);
      if (this.phase === 'ready') { if (this.phaseT > 1.3 && !this.went) { this.went = true; this.say('GO !', 0.8); this.emit('whistle'); } if (this.phaseT > 1.6) { this.phase = 'play'; this.phaseT = 0; } }
      if (this.phase === 'end') { this.endT += dt; this.updatePlayers(dt, [null, null]); this.updateBall(dt); return; }
      const ins = [null, null];
      for (let t = 0; t < 2; t++) {
        if (this.isHuman(t) && inputs && inputs[t] && this.phase === 'play') ins[t] = this.edges(t, inputs[t]);
      }
      this.ai.update(dt, ins);
      this.updatePlayers(dt, ins);
      this.updateBall(dt);
      this.checkEnd();
    }
    edges(t, inp) {
      const prev = this.prevIn[t], e = { dx: inp.dx || 0, dy: inp.dy || 0, a: !!inp.a, b: !!inp.b, aDown: !!inp.a && !prev.a, bDown: !!inp.b && !prev.b, sel: inp.sel, cycle: inp.cycle && !prev.cycle };
      this.prevIn[t] = { a: !!inp.a, b: !!inp.b, cycle: !!inp.cycle, left: e.dx < -0.5, right: e.dx > 0.5 };
      e.leftDown = e.dx < -0.5 && !prev.left; e.rightDown = e.dx > 0.5 && !prev.right;
      if (e.sel != null) { const mine = this.inner(t); if (mine[e.sel] && mine[e.sel].alive) this.lock[t] = mine[e.sel]; }
      if (e.cycle) { const mine = this.aliveInner(t), cur = this.controlled(t), i = mine.indexOf(cur); this.lock[t] = mine[(i + 1) % mine.length]; }
      return e;
    }

    updatePlayers(dt, ins) {
      for (const p of this.players) {
        p.stateT += dt;
        if (!p.alive) { if (p.state === 'ko') { p.z += 55 * dt; p.ko += dt; if (p.ko > 2.6) p.state = 'gone'; } continue; }
        // Entrée : humain contrôlant ce joueur, sinon intention de l'IA (p.ai.move / p.ai.act)
        let move = { dx: 0, dy: 0 }, act = null;
        const human = this.isHuman(p.team) && this.controlled(p.team) === p && ins[p.team];
        if (human) {
          const e = ins[p.team]; move = { dx: e.dx, dy: e.dy };
          if (e.leftDown || e.rightDown) this.tap(p, e.leftDown ? -1 : 1);
          if (e.aDown) act = 'a'; else if (e.bDown) act = 'b';
        } else { move = p.ai.move || move; act = p.ai.act || null; p.ai.act = null; }
        this.stepPlayer(p, dt, move, act);
      }
    }
    tap(p, dir) {                       // double appui gauche/droite = course
      const d = p.dash;
      if (d.lastTap > this.time - 0.28 && d.dir === dir) { this.startDash(p, dir); }
      d.lastTap = this.time; d.dir = dir;
    }
    startDash(p, dir) { if (p.zone !== 'in' || !HITTABLE[p.state] || p.state === 'jump') return; p.dash.active = true; p.dash.t = 0; p.dash.dir = dir; p.facing = dir; this.emit('dash', { p }); }
    stepPhase(p) { return (p.dash.t % STEP_PERIOD) / STEP_PERIOD; }
    superWindow(p) { const ph = this.stepPhase(p); return p.dash.t >= STEP_PERIOD * 2.6 && (ph > 0.62 || ph < 0.12); }

    stepPlayer(p, dt, move, act) {
      const ph = p.phys, s = p.state;
      // états à durée fixe
      if (s === 'windup' && p.stateT > 0.1) { this.release(p); }
      if (s === 'throw' && p.stateT > 0.28) this.setState(p, 'idle');
      if (s === 'catch' && p.stateT > 0.34) this.setState(p, 'idle');
      if (s === 'pickup' && p.stateT > 0.18) this.setState(p, 'idle');
      if (s === 'hit') {
        p.x += p.knock * p.knockDir * dt; p.knock = Math.max(0, p.knock - 900 * dt);
        if (p.stateT > 0.32) { this.setState(p, 'down'); p.knock = 0; }
      }
      if (s === 'down' && p.stateT > 0.85) this.setState(p, 'getup');
      if (s === 'getup' && p.stateT > 0.3) this.setState(p, 'idle');
      if (s === 'return') {                          // retombé dans le camp adverse : on recule derrière la ligne
        const home = p.team === 0 ? C.mid - 40 : C.mid + 40; p.x += (home - p.x) * Math.min(1, dt * 9); p.facing = p.team === 0 ? 1 : -1;
        if (Math.abs(home - p.x) < 2 || p.stateT > 0.5) this.setState(p, 'idle');
      }
      // saut
      if (p.z > 0 || p.vz > 0) {
        p.vz -= G * dt; p.z += p.vz * dt;
        if (p.z <= 0) {
          p.z = 0; p.vz = 0; p.dash.fromJump = false;
          const over = p.zone === 'in' && (p.team === 0 ? p.x > C.mid - 14 : p.x < C.mid + 14);
          if (s === 'jump') this.setState(p, over ? 'return' : 'idle'); else if (over) this.setState(p, 'return');
        }
      }
      // déplacement
      const canMove = (s === 'idle' || s === 'jump' || s === 'catch' && p.stateT > 0.2) && p.alive;
      let mx = 0, my = 0;
      if (canMove && !(s === 'jump')) {
        if (p.dash.active) {
          const held = move.dx * p.dash.dir > 0.3;
          if (!held) p.dash.active = false;
          else { p.dash.t += dt; mx = p.dash.dir * ph.maxSpeed * ph.dashMul; my = clamp(move.dy, -1, 1) * ph.maxSpeed * 0.6; }
        }
        if (!p.dash.active) {
          const len = Math.hypot(move.dx, move.dy) || 1, k = Math.min(1, len);
          mx = move.dx / len * k * ph.maxSpeed; my = move.dy / len * k * ph.maxSpeed;
          if (Math.abs(move.dx) > 0.3) p.facing = move.dx > 0 ? 1 : -1;
        }
      } else if (s === 'jump') { mx = p.vx; my = p.vy; }
      p.moving = Math.abs(mx) + Math.abs(my) > 10;
      if (p.moving) p.frame += dt * (p.dash.active ? 22 : 14);
      p.x += mx * dt; p.y += my * dt;
      this.confine(p);
      if (p.zone === 'in' && !p.dash.active && s === 'idle' && !p.moving) p.facing = p.team === 0 ? 1 : -1;   // au repos on regarde l'adversaire
      // actions
      if (act && p.alive && this.phase === 'play') this.action(p, act, move);
    }
    confine(p) {
      if (p.zone === 'in') {
        const pad = 14, air = p.z > 0 || p.state === 'return';   // en l'air (ou en train de revenir) : la ligne du centre ne retient pas
        if (air) p.x = clamp(p.x, C.left + pad, C.right - pad);
        else if (p.team === 0) p.x = clamp(p.x, C.left + pad, C.mid - pad); else p.x = clamp(p.x, C.mid + pad, C.right - pad);
        if (!air && ((p.team === 0 && p.x >= C.mid - pad) || (p.team === 1 && p.x <= C.mid + pad))) p.dash.active = false;
        p.y = clamp(p.y, C.top + 8, C.bottom - 8);
      } else {
        // les couloirs se rejoignent dans les coins : aucune balle morte n'est hors de portée
        const half = p.team === 0 ? [C.mid + 20, C.right + BC.LANE] : [C.left - BC.LANE, C.mid - 20];
        if (p.lane === 'top') { p.y = C.top - BC.LANE; p.x = clamp(p.x, half[0], half[1]); }
        else if (p.lane === 'bottom') { p.y = C.bottom + BC.LANE; p.x = clamp(p.x, half[0], half[1]); }
        else { p.x = p.team === 0 ? C.right + BC.LANE : C.left - BC.LANE; p.y = clamp(p.y, C.top - BC.LANE, C.bottom + BC.LANE); }
      }
    }
    setState(p, s) { p.state = s; p.stateT = 0; }

    action(p, act, move) {
      const b = this.ball;
      if (p.hasBall) {
        if (act === 'a') {                              // lancer
          if (p.state === 'jump') { this.throwBall(p, { jump: true }); return; }
          if (p.state !== 'idle') return;
          if (p.dash.active) { const sup = this.superWindow(p); this.setState(p, 'windup'); p.pending = { run: true, sup }; p.dash.active = false; return; }
          this.setState(p, 'windup'); p.pending = {};
        } else if (act === 'b') {
          if (p.dash.active && p.state === 'idle') { this.jump(p, move); p.dash.fromJump = true; p.dash.active = false; return; }   // saut en course avec la balle
          if (p.state === 'idle') this.pass(p, move);
        }
      } else {
        if (act === 'a' && p.state === 'idle' && p.zone === 'in') { this.jump(p, move); }
        if (act === 'b' && (p.state === 'idle') && p.zone === 'in') { this.setState(p, 'catch'); p.dash.active = false; this.emit('catchTry', { p }); }
      }
    }
    jump(p, move) { if (p.z > 0) return; p.vz = p.phys.jump; p.vx = p.dash.active ? p.dash.dir * p.phys.maxSpeed * 1.25 : (move ? clamp(move.dx, -1, 1) * p.phys.maxSpeed * 0.8 : 0); p.vy = move ? clamp(move.dy, -1, 1) * p.phys.maxSpeed * 0.5 : 0; if (p.dash.active) p.facing = p.dash.dir; this.setState(p, 'jump'); this.emit('jump', { p }); }

    // Lancer : la balle part horizontalement à la profondeur du lanceur (il faut être aligné avec sa cible).
    release(p) {
      const pend = p.pending || {}; p.pending = null;
      this.throwBall(p, { run: pend.run, sup: pend.sup });
    }
    throwBall(p, o) {
      const b = this.ball; if (b.holder !== p) { this.setState(p, 'idle'); return; }
      const ph = p.phys, dir = p.team === 0 ? 1 : -1, foes = this.opponentsOf(p);
      const target = foes.slice().sort((a, c) => Math.abs(a.y - p.y) - Math.abs(c.y - p.y))[0] || null;
      let superId = null;
      if (p.zone === 'in' && (o.sup || (o.jump && p.dash.fromJump && Math.abs(p.vz) < 170))) superId = p.def.superShot;
      p.hasBall = false; b.holder = null; b.state = 'live'; b.team = p.team; b.thrower = p; b.t = 0; b.trail = []; b.alpha = 1; b.visible = true; b.r = b.r0;
      b.target = target; b.bounces = 0; b.phaseDone = false; b.superId = superId; b.z0 = CHEST;
      b.x = p.x + dir * 12; b.y = p.y; b.z = (p.z || 0) + CHEST + (o.jump ? 10 : 0);
      if (p.zone === 'in') {
        let speed = ph.throwSpeed * (o.run ? 1.12 : 1) * (o.jump ? 1.05 : 1), dmg = ph.dmg + (o.run || o.jump ? 1 : 0);
        if (superId) { const S = BC.SUPERS[superId]; speed = S.speed; dmg = S.dmg + Math.round(ph.dmg * 0.25); this.say(S.name + ' !', 1.1, p.def.name); this.emit('super', { p, superId }); this.stats[p.team].supers++; if (superId === 'flash') this.flash = 1; }
        b.vx = dir * speed * (superId ? 1 : 0.6); b.vy = 0; b.vz = o.jump ? -60 : 0; b.dmg = dmg; b.speed = speed;
        if (superId === 'bulle') { b.vz = 420; } if (superId === 'boomerang') b.z0 = 115; if (superId === 'fusee') b.vx = dir * 420;
      } else {
        // extérieur : vise l'adversaire intérieur le plus proche de son couloir
        const tgt = foes.slice().sort((a, c) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(c.x - p.x, c.y - p.y))[0];
        const tx = tgt ? tgt.x : (p.team === 0 ? C.right - 150 : C.left + 150), ty = tgt ? tgt.y : (C.top + C.bottom) / 2;
        const dx = tx - p.x, dy = ty - p.y, L = Math.hypot(dx, dy) || 1, speed = ph.throwSpeed * 0.8;
        b.vx = dx / L * speed * 0.6; b.vy = dy / L * speed * 0.6; b.vz = 0; b.dmg = Math.max(3, Math.round(ph.dmg * 0.65)); b.speed = speed; b.target = tgt; b.accel = true;
      }
      this.setState(p, 'throw'); this.stats[p.team].throws++;
      this.emit(superId ? 'throwSuper' : 'throw', { p });
      this.retargetAll();
    }
    // Passe : vers l'extérieur du haut / du bas / du fond selon la direction, sinon au coéquipier intérieur le plus proche.
    pass(p, move) {
      const b = this.ball, mates = this.players.filter(q => q.team === p.team && q !== p && q.alive);
      let target = null;
      const fwd = p.team === 0 ? 1 : -1;
      if (move.dy < -0.5) target = mates.find(q => q.lane === 'top'); else if (move.dy > 0.5) target = mates.find(q => q.lane === 'bottom');
      else if (move.dx * fwd > 0.5) target = mates.find(q => q.lane === 'back');
      if (!target) { const inner = mates.filter(q => q.zone === 'in'); target = inner.sort((a, c) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(c.x - p.x, c.y - p.y))[0] || mates[0]; }
      if (!target) return;
      p.hasBall = false; b.holder = null; b.state = 'pass'; b.team = p.team; b.thrower = p; b.target = target; b.t = 0; b.superId = null; b.alpha = 1; b.visible = true; b.r = b.r0;
      const dx = target.x - p.x, dy = target.y - p.y, L = Math.hypot(dx, dy), T = clamp(L / 620, 0.35, 0.9);
      b.x = p.x; b.y = p.y; b.z = (p.z || 0) + CHEST; b.landX = target.x; b.landY = target.y;
      b.vx = dx / T; b.vy = dy / T; b.vz = (CHEST - b.z) / T + 0.5 * G * T * 0.55; b.g = G * 0.55;
      this.setState(p, 'throw'); this.emit('pass', { p });
    }
    give(p) {                                        // le joueur prend la balle
      const b = this.ball; b.holder = p; b.state = 'held'; b.team = p.team; b.superId = null; b.alpha = 1; b.visible = true; b.r = b.r0; b.vx = b.vy = b.vz = 0; p.hasBall = true;
      this.lock[p.team] = null;
    }

    // ---------- Balle ----------
    updateBall(dt) {
      const b = this.ball; b.t += dt;
      if (b.state === 'held') { const p = b.holder; if (!p || !p.alive) { b.state = 'dead'; b.holder = null; if (p) p.hasBall = false; return; } b.x = p.x + p.facing * 10; b.y = p.y; b.z = p.z + CHEST; return; }
      if (b.state === 'live') { this.updateLive(dt); return; }
      if (b.state === 'pass') {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= (b.g || G) * dt; b.z += b.vz * dt;
        const tg = b.target;
        if (tg && tg.alive && Math.hypot(tg.x - b.x, tg.y - b.y) < 32 && b.z < 80 && HITTABLE[tg.state] && !tg.hasBall) { this.give(tg); this.emit('catch', { p: tg, pass: true }); return; }
        // interception par un adversaire qui attrape
        for (const q of this.aliveInner(1 - b.team)) if (q.state === 'catch' && q.stateT < 0.22 && Math.hypot(q.x - b.x, q.y - b.y) < 24 && b.z < 70) { this.give(q); this.stats[q.team].catches++; this.emit('catch', { p: q }); return; }
        if (b.z <= 0) { b.z = 0; b.vz = 0; b.state = 'dead'; b.vx *= 0.4; b.vy *= 0.4; this.emit('bounce'); this.retargetAll(); }
        this.walls(b); return;
      }
      // morte : roule, rebondit, s'arrête ; quelqu'un la ramasse
      b.vz -= G * dt; b.z += b.vz * dt;
      if (b.z <= 0) { b.z = 0; if (b.vz < -60) { b.vz = -b.vz * 0.45; this.emit('bounce'); } else b.vz = 0; }
      const fr = b.z > 0 ? 0 : 320 * dt, sp = Math.hypot(b.vx, b.vy);
      if (sp > 0) { const ns = Math.max(0, sp - fr); b.vx *= ns / sp; b.vy *= ns / sp; }
      const sideBefore = this.sideOf(b.x);
      b.x += b.vx * dt; b.y += b.vy * dt; this.walls(b);
      if (this.sideOf(b.x) !== sideBefore) this.retargetAll();
      if (this.phase !== 'play') return;
      let best = null, bd = 1e9;
      for (const p of this.players) {
        if (!p.alive || p.hasBall || !(p.state === 'idle' || p.state === 'catch')) continue;
        const r = p.zone === 'out' ? 40 : 24, d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < r && b.z < 40 && d < bd) { best = p; bd = d; }
      }
      if (best) { this.give(best); this.setState(best, 'pickup'); this.emit('pickup', { p: best }); }
    }
    walls(b) {
      const L = C.left - BC.LANE - 22, R = C.right + BC.LANE + 22, T = C.top - BC.LANE - 16, B = C.bottom + BC.LANE + 16;
      if (b.x < L) { b.x = L; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > R) { b.x = R; b.vx = -Math.abs(b.vx) * 0.5; }
      if (b.y < T) { b.y = T; b.vy = Math.abs(b.vy) * 0.5; } if (b.y > B) { b.y = B; b.vy = -Math.abs(b.vy) * 0.5; }
    }
    updateLive(dt) {
      const b = this.ball, S = b.superId, dir = Math.sign(b.vx) || 1, tg = b.target;
      const foeBack = b.team === 0 ? C.right : C.left;         // ligne de fond adverse
      const progress = clamp((b.x - (b.team === 0 ? C.mid - 450 : C.mid + 450)) / ((foeBack - (b.team === 0 ? C.mid - 450 : C.mid + 450))), 0, 1);
      b.visible = true; b.alpha = 1; b.r = b.r0; let ghost = false;
      switch (S) {
        case 'glitch': if (progress > 0.38 && progress < 0.62) { b.visible = false; ghost = true; } if (progress >= 0.62 && !b.phaseDone) { b.phaseDone = true; b.x += dir * 70; this.spark(b.x, b.y, b.z, '#9bf'); } break;
        case 'biscuit': if (progress < 0.6) { b.vy = Math.sin(b.t * 6) * 150; b.vx = dir * b.speed * 0.75; } else { b.vy *= 0.8; b.vx = dir * b.speed * 1.8; } break;
        case 'bulle': if (progress < 0.5) { b.vz = Math.max(0, b.vz - G * 0.5 * dt); b.vx = dir * b.speed * 0.8; } else { if (tg) b.vy = clamp((tg.y - b.y) * 6, -300, 300); const want = CHEST + (tg ? tg.z : 0); b.vz = clamp((want - b.z) * 7, -700, 100); b.vx = dir * b.speed * 1.3; } break;
        case 'zigzag': b.vy = Math.cos(b.t * 14) * 520; break;
        case 'crise': b.r = b.r0 * 1.8; b.y += Math.sin(b.t * 60) * 1.5; break;
        case 'boomerang':
          if (!b.phaseDone) { b.z = Math.max(b.z, 100); if ((dir > 0 && b.x > foeBack - 40) || (dir < 0 && b.x < foeBack + 40)) { b.phaseDone = true; b.vx = -b.vx; if (tg) { b.y = tg.y; b.x = tg.x + Math.sign(b.vx) * -90; } b.z = CHEST; this.spark(b.x, b.y, b.z, '#fff'); this.emit('teleport'); } }
          else if ((b.team === 0 && b.x < C.mid) || (b.team === 1 && b.x > C.mid)) { this.kill(b, 0.3); }
          break;
        case 'aimant': if (tg && tg.alive) b.vy = clamp((tg.y - b.y) * 8, -260, 260); else b.vy *= 0.9; break;
        case 'rase': b.z = Math.abs(Math.sin(b.t * 12)) * 26; break;
        case 'tornade': b.y += Math.cos(b.t * 11) * 5; b.z = CHEST + 12 + Math.sin(b.t * 11) * 22; if (Math.random() < 0.6) this.fx.push({ kind: 'snow', x: b.x + rnd(-20, 20), y: b.y + rnd(-10, 10), z: b.z + rnd(-10, 30), t: 0, dur: 0.6 }); break;
        case 'fantome': b.visible = (Math.floor(b.t * 4) % 2) === 0; b.alpha = b.visible ? 1 : 0; break;
        case 'flash': if (b.t < 0.3) { b.vx = dir * 1; b.x = (b.thrower ? b.thrower.x : b.x) + dir * 14; } else b.vx = dir * b.speed; break;
        case 'fusee': b.vx = dir * Math.min(1500, Math.abs(b.vx) + 1100 * dt); if (Math.random() < 0.8) this.fx.push({ kind: 'fire', x: b.x - dir * 12, y: b.y, z: b.z, t: 0, dur: 0.35 }); break;
        default: {                          // lancer normal : la balle accélère en vol (jusqu'à 1,35 × la vitesse de départ) et pique légèrement
          const sp = Math.hypot(b.vx, b.vy) || 1, want = Math.min(b.speed * 1.35, sp + b.speed * 1.6 * dt);
          b.vx *= want / sp; b.vy *= want / sp; b.vz -= G * 0.03 * dt;
        }
      }
      if (S !== 'rase' && S !== 'bulle' && S !== 'tornade' && S !== 'boomerang') b.z += b.vz * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.y = clamp(b.y, C.top + 4, C.bottom - 4);
      if (S === 'laser' || S === 'fusee' || S === 'flash' || S === 'canon') { b.trail.push({ x: b.x, y: b.y, z: b.z }); if (b.trail.length > 10) b.trail.shift(); }
      // contact avec un joueur intérieur adverse
      if (!ghost) for (const p of this.aliveInner(1 - b.team)) {
        if (!HITTABLE[p.state]) continue;
        const h = this.heightOf(p), zOk = S === 'rase' || (b.z + b.r > p.z && b.z - b.r < p.z + h);
        if (Math.abs(p.x - b.x) < 15 + b.r && Math.abs(p.y - b.y) < 17 + b.r && zOk) { this.contact(p, b); return; }
      }
      // au sol ou au fond : la balle est morte
      if (b.z <= 0) { if (S === 'rase') { } else { this.kill(b, 0.35); return; } }
      if ((b.team === 0 && b.x > C.right + 10) || (b.team === 1 && b.x < C.left - 10)) { this.kill(b, 0.25); b.vx *= 0.6; return; }
    }
    kill(b, k) { b.state = 'dead'; b.superId = null; b.visible = true; b.alpha = 1; b.r = b.r0; b.vx *= k; b.vy *= k; b.vz = Math.max(b.vz, 120); this.emit('bounce'); this.retargetAll(); }
    spark(x, y, z, color) { this.fx.push({ kind: 'spark', x, y, z, color, t: 0, dur: 0.4 }); }

    contact(p, b) {
      const S = b.superId ? BC.SUPERS[b.superId] : null, dir = Math.sign(b.vx) || 1;
      // tentative d'attrapé : humain = fenêtre de temps, ordi = probabilité décidée par l'IA (p.ai.willCatch)
      if (p.state === 'catch') {
        const facing = p.facing === -dir;
        const win = 0.2 * (1 - (S ? S.catch * 0.7 : 0)) * (0.8 + p.phys.catchSkill * 0.4);
        const ok = this.isHuman(p.team) ? facing && p.stateT <= win : p.ai.willCatch;
        if (ok) { this.give(p); this.stats[p.team].catches++; this.emit('catch', { p, superId: b.superId }); this.say('ATTRAPÉ !', 0.8); this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 40, text: 'ATTRAPÉ', color: '#7dffa0', t: 0, dur: 0.8 }); return; }
      }
      // touché
      const dmg = Math.max(1, Math.round(b.dmg * (p.state === 'catch' ? 0.7 : 1)));
      p.hp = Math.max(0, p.hp - dmg); this.stats[b.team].hits++;
      p.knockDir = dir; p.knock = (b.superId === 'canon' ? 900 : b.superId === 'boulet' ? 600 : 300) * (0.7 + 0.6 / Math.max(0.5, p.def.size));
      if (p.hasBall) { p.hasBall = false; }
      this.setState(p, 'hit'); p.dash.active = false; p.vz = 160; p.z = Math.max(p.z, 1);
      this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 45, text: '-' + dmg, color: '#ff6b6b', t: 0, dur: 0.9 });
      this.fx.push({ kind: 'burst', x: b.x, y: b.y, z: b.z, t: 0, dur: 0.35 });
      this.shake = b.superId ? 10 : 5;
      this.emit('hit', { p, dmg, superId: b.superId, ko: p.hp <= 0 });
      b.state = 'dead'; b.superId = null; b.visible = true; b.alpha = 1; b.r = b.r0; b.vx = -dir * 180; b.vy = rnd(-60, 60); b.vz = 240;
      this.retargetAll();
      if (p.hp <= 0) { p.alive = false; p.state = 'ko'; p.ko = 0; p.hasBall = false; this.say('K.-O. !', 1.2, p.def.name); this.emit('ko', { p }); this.lock[p.team] = null; }
    }
    checkEnd() {
      for (let t = 0; t < 2; t++) if (!this.aliveInner(t).length) {
        this.phase = 'end'; this.winner = 1 - t; this.endT = 0; this.ball.state = 'dead'; this.ball.holder = null; for (const p of this.players) p.hasBall = false;
        this.say('VICTOIRE !', 3, this.teams[1 - t].name); this.emit('win', { team: 1 - t }); return;
      }
    }
  };
})(window.BC);
