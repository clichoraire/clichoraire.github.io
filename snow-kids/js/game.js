// Snow Kids — simulation d'une course (sans affichage) : coureurs, physique de descente, figures, remontée mécanique,
// tirs et objets, classement. Déterministe pour une graine donnée (utilisé aussi par tools/headless.js).
(function (SK) {
  'use strict';
  const SEG = SK.SEG;
  const EMPTY = { steer: 0, up: false, down: false, jump: false, trick: false, shoot: false, item: false };

  function Racer(race, opts, idx) {
    this.race = race; this.idx = idx; this.def = SK.charById(opts.charId) || SK.CHARACTERS[0]; this.board = opts.board || SK.boardById(opts.boardId);
    this.ctrl = opts.ctrl || 'cpu'; this.player = opts.player == null ? -1 : opts.player; this.boss = !!opts.boss; this.look = opts.look || null;
    const d = this.def, b = this.board;
    this.maxSpeed = 27 + 0.8 * d.speed + 0.8 * b.speed;
    this.steerRate = 6 + 1.6 * d.corner + 1.2 * b.corner;
    this.trickSpeed = 1 + 0.12 * (d.trick - 3) + 0.1 * b.trick;
    this.trickPay = 1 + 0.15 * (d.trick - 3) + 0.12 * b.trick;
    this.jumpPower = 3.7 + 0.32 * ((d.jump || 3) + (b.jump || 0)); // vitesse verticale d'un saut au bouton
    this.stunFactor = 1 - 0.08 * (d.weight - 3);
    this.gear = opts.gear || {};
    if (this.gear.casque) this.stunFactor *= 0.8;
    if (this.gear.gants) this.trickSpeed *= 1.1;
    if (this.gear.bottes) this.steerRate *= 1.1;
    this.x = 0; this.z = 0; this.lap = 0; this.yAbs = 0; this.h = 0; this.vy = 0; this.lastVy = 0; this.speed = 0; this.steer = 0;
    this.state = 'ride'; this.stun = 0; this.flat = 0; this.wallT = 0;
    this.shot = null; this.item = null; this.coins = 0; this.coinsTotal = 0; this.tricksCoins = 0; this.tricksCount = 0;
    this.curTrick = null; this.tricksDone = []; this.airT = 0; this.pending = null;
    this.fx = { parachute: 0, fan: 0, invisible: 0, slow: 0, snowman: 0 };
    this.rank = idx; this.finishTime = null; this.lift = null; this.lapTimes = []; this.lapStart = 0;
    this.input = Object.assign({}, EMPTY); this.prev = Object.assign({}, EMPTY); this.ai = null;
    this.stats = { shots: 0, items: 0, hits: 0, falls: 0 };
  }
  Racer.prototype.progress = function () { return this.lap * this.race.L + Math.min(this.z, this.race.L); };
  Racer.prototype.immune = function () { return this.state === 'lift' || this.state === 'drop' || this.state === 'done' || this.fx.invisible > 0; };

  SK.Race = function (opts) {
    this.course = opts.course; this.seed = opts.seed || 1; this.mission = opts.mission || null; this.track = SK.buildTrack(this.course, this.seed, { slalom: this.mission && this.mission.type === 'slalom' });
    this.gatesPassed = 0; this.gatesTotal = this.track.gates.length;
    this.L = this.track.L; this.gateX = this.track.gateX; this.gateW = this.track.gateW; this.gateZ = this.track.gateZ; this.laps = opts.laps || this.course.laps || SK.DEFAULT_LAPS; this.mode = opts.mode || 'race';
    this.difficulty = opts.difficulty == null ? 1 : opts.difficulty; this.rng = SK.rng(this.seed * 31 + 7);
    this.time = -3.4; this.phase = 'count'; this.countShown = -4; this.events = []; this.rocks = []; this.shots = []; this.nextChair = 0; this.lastFinish = 0;
    this.racers = opts.racers.map((r, i) => new Racer(this, r, i));
    const w0 = this.track.segs[0].w, n = this.racers.length;
    this.racers.forEach((r, i) => { r.x = n === 1 ? 0 : (-0.6 + 1.2 * i / (n - 1)) * w0; r.startX = r.x; r.z = 2 + i * 0.5; r.yAbs = this.track.groundY(r.z);
      if (r.gear.portemonnaie && this.mode !== 'time') { r.coins = 5; r.coinsTotal = 5; }
      if (r.gear.sac && this.mode !== 'time') r.item = this.rng.pick(SK.ITEM_IDS); });
    this.humans = this.racers.filter(r => r.ctrl === 'human');
  };
  const P = SK.Race.prototype;
  P.emit = function (e) { this.events.push(e); };
  P.takeEvents = function () { const e = this.events; this.events = []; return e; };
  P.setInput = function (player, inp) { const r = this.racers.find(x => x.player === player); if (r) r.input = Object.assign({}, EMPTY, inp); };
  P.racerAhead = function (r) { return this.racers.find(o => o.rank === r.rank - 1) || null; };
  P.racerBehind = function (r) { return this.racers.find(o => o.rank === r.rank + 1) || null; };

  P.update = function (dt) {
    if (this.phase === 'over') return;
    this.time += dt;
    if (this.phase === 'count') {
      const c = Math.min(3, Math.ceil(-this.time));
      if (c !== this.countShown && c <= 3) { this.countShown = c; this.emit({ type: 'count', n: c }); }
      if (this.time >= 0) { this.phase = 'race'; this.emit({ type: 'go' }); for (const r of this.racers) if (r.gear.fusee) r.fx.fan = 1.5; } else { this.rankAll(); return; }
    }
    for (const r of this.racers) if (r.ctrl === 'cpu' && SK.AI) SK.AI.drive(this, r, dt);
    for (const r of this.racers) this.updateRacer(r, dt);
    this.collideRacers();
    this.updateShots(dt);
    this.rocks = this.rocks.filter(k => k.until > this.time);
    this.rankAll();
    if (this.racers.every(r => r.state === 'done')) this.finish();
    else if (this.humans.length && this.humans.every(r => r.state === 'done') && this.time > this.lastFinish + 6) {
      for (const r of this.racers) if (r.state !== 'done') {
        const remaining = this.laps * this.L - r.progress(), liftsLeft = this.laps - 1 - r.lap - (r.state === 'lift' ? 0 : 0);
        r.finishTime = this.time + remaining / (r.maxSpeed * 0.85) + Math.max(0, liftsLeft) * (SK.LIFT_RIDE + 1) + (r.state === 'lift' ? r.lift.end - this.time : 0);
        r.state = 'done'; r.estimated = true;
      }
      this.finish();
    }
  };
  P.finish = function () { this.phase = 'over'; this.rankAll(); this.emit({ type: 'over' }); };

  P.rankAll = function () {
    const arr = this.racers.slice().sort((a, b) => {
      if (a.state === 'done' && b.state === 'done') return a.finishTime - b.finishTime;
      if (a.state === 'done') return -1; if (b.state === 'done') return 1;
      const d = b.progress() - a.progress(); if (Math.abs(d) > 0.01) return d;
      if (a.lift && b.lift) return a.lift.board - b.lift.board;
      return a.idx - b.idx;
    });
    arr.forEach((r, i) => { r.rank = i; });
  };

  // ------------------------------------------------------------------ un coureur
  P.updateRacer = function (r, dt) {
    const inp = r.input, prev = r.prev, T = this.track;
    const edge = k => inp[k] && !prev[k];
    for (const k in r.fx) if (r.fx[k] > 0) r.fx[k] = Math.max(0, r.fx[k] - dt);
    if (r.flat > 0) r.flat -= dt;
    if (r.state === 'done') { r.prev = Object.assign({}, inp); return; }
    if (r.state === 'lift') {
      if (this.time >= r.lift.end) { // la chaise arrive en haut : on voit le coureur descendre du siège sur la piste
        r.lap++; r.z = 2; r.x = r.startX; r.yAbs = T.groundY(r.z) + 4; r.h = 4; r.speed = 5; r.state = 'drop'; r.lift = null; r.lapStart = this.time; r.steer = 0;
      }
      r.prev = Object.assign({}, inp); return;
    }
    if (r.state === 'drop') { // suspendu à la chaise, on descend doucement jusqu'à la neige
      r.h = Math.max(0, r.h - 3.4 * dt); r.z += r.speed * dt; r.yAbs = T.groundY(r.z) + r.h;
      if (r.h <= 0) { r.state = 'ride'; r.speed = 8; this.emit({ type: 'lapstart', r }); }
      r.prev = Object.assign({}, inp); return;
    }
    const s = T.segAt(r.z), surf = SK.SURFACES[s.surface] || SK.SURFACES.snow;
    const stunned = r.state === 'fall' || r.state === 'frozen';
    if (stunned) {
      r.stun -= dt; r.speed = Math.max(0, r.speed - 20 * dt);
      if (r.state === 'frozen') r.speed = 0;
      if (r.stun <= 0) { r.state = 'ride'; }
    }
    // ---- vitesse
    let target = 0;
    if (!stunned) {
      let f = surf.speed * (r.fx.fan > 0 ? 1.45 : 1) * (r.fx.parachute > 0 ? 0.55 : 1) * (r.fx.slow > 0 ? 0.7 : 1) * (r.fx.snowman > 0 ? 0.5 : 1) * (r.aiSpeed || 1);
      if (inp.down && r.state === 'ride') f *= 0.8;
      else if (inp.up && r.state === 'ride') f *= 1.08; // penché vers l'avant : un peu plus de vitesse
      target = r.maxSpeed * f;
    }
    if (r.state === 'air') { /* en l'air : la vitesse se conserve (légère perte) */ r.speed = Math.max(0, r.speed - 0.6 * dt); }
    else if (!stunned) {
      const accel = r.speed < target ? (r.fx.fan > 0 ? 16 : 9) : 10;
      r.speed += SK.clamp(target - r.speed, -accel * dt, accel * dt);
    }
    // ---- latéral : direction, force centrifuge, murs
    const kappa = s.curve / (SEG * SEG), centrifugal = kappa * r.speed * r.speed * 4.2;
    r.steer += SK.clamp(inp.steer - r.steer, -7 * dt, 7 * dt); // la direction se prend progressivement (inclinaison)
    r.crouch = (r.crouch || 0) + SK.clamp((inp.up && r.state === 'ride' && !stunned ? 1 : 0) - (r.crouch || 0), -5 * dt, 5 * dt); // penché en avant, genoux fléchis
    const station = r.z >= this.L; // zone de la gare au bas de la piste
    if (!stunned && r.fx.snowman <= 0) {
      const grip = (r.state === 'air' ? 0.35 : 1) * surf.grip;
      r.x += r.steer * r.steerRate * (station ? 0.9 : Math.min(1, r.speed / 12)) * grip * dt;
    }
    if (station && r.lap + 1 < this.laps) { r.speed = Math.max(6, Math.min(r.speed, 14) - 10 * dt); target = 0; }
    r.x -= centrifugal * (r.state === 'air' ? 0.6 : 1) * (SK.SURFACES[s.surface] && s.surface === 'ice' ? 1.25 : 1) * dt;
    const lim = s.w - 0.9;
    if (r.x > lim || r.x < -lim) {
      r.x = SK.clamp(r.x, -lim, lim);
      if (r.wallT <= 0 && r.speed > 12 && !stunned) { this.emit({ type: 'wall', r }); r.wallT = 0.5; }
      if (r.gear.veste) { r.speed *= (1 - 0.7 * dt); if (r.speed > 24) r.speed = Math.max(24, r.speed - 10 * dt); }
      else { r.speed *= (1 - 1.8 * dt); if (r.speed > 18) r.speed = Math.max(18, r.speed - 25 * dt); }
    }
    if (r.wallT > 0) r.wallT -= dt;
    // ---- avance
    const zPrev = r.z; r.z += r.speed * dt;
    // ---- relief, sauts, figures
    const gy = T.groundY(r.z);
    if (r.state === 'ride' || (stunned && r.h <= 0)) {
      if (gy < r.yAbs - 1.0 && r.speed > 5 && !stunned) { // le sol se dérobe d'un coup (falaise) : envol
        r.state = 'air'; r.vy = Math.max(0.5, r.lastVy) + (inp.jump ? r.jumpPower * 0.6 : 0) + 1; r.airT = 0; r.tricksDone = []; r.h = r.yAbs - gy; this.emit({ type: 'jump', r, big: true });
      } else {
        r.lastVy = dt > 0 ? (gy - r.yAbs) / dt : 0; r.yAbs = gy; r.h = 0;
        if (!stunned && edge('jump') && r.speed > 3) { r.state = 'air'; r.vy = r.jumpPower + Math.max(0, r.lastVy); r.airT = 0; r.tricksDone = []; this.emit({ type: 'jump', r, big: false }); }
      }
    }
    if (r.state === 'air') {
      r.airT += dt; r.vy -= SK.GRAVITY * dt; r.yAbs += r.vy * dt; r.h = Math.max(0, r.yAbs - gy);
      if (r.curTrick) { r.curTrick.t += dt * r.trickSpeed; if (r.curTrick.t >= r.curTrick.def.dur) { r.tricksDone.push(r.curTrick.def); r.curTrick = null; } }
      else if (edge('trick') || (edge('jump') && r.airT > 0.08)) { // C ou X en l'air + direction = une des huit figures
        const dir = inp.up ? 'up' : inp.down ? 'down' : inp.steer < -0.3 ? 'left' : inp.steer > 0.3 ? 'right' : 'none';
        const id = SK.trickFor(edge('trick') ? 'trick' : 'jump', dir);
        if (id) { r.curTrick = { id, def: SK.TRICKS[id], t: 0 }; this.emit({ type: 'trickstart', r, id }); }
      }
      if (r.yAbs <= gy) { // atterrissage
        r.yAbs = gy; r.h = 0; r.vy = 0; r.lastVy = 0; r.state = 'ride';
        if (r.curTrick || r.pending) { const why = r.pending; r.pending = null; r.curTrick = null; r.tricksDone = []; this.fall(r, why === 'gel' ? 0 : 1.4, why === 'poele'); if (why === 'gel') this.freeze(r, 2); }
        else if (r.tricksDone.length) {
          let total = 0; r.tricksDone.forEach((t, i) => { total += t.coins * (1 + 0.5 * i); });
          total = Math.max(1, Math.round(total * r.trickPay));
          r.coins += total; r.coinsTotal += total; r.tricksCoins += total; r.tricksCount += r.tricksDone.length;
          this.emit({ type: 'trick', r, coins: total, names: r.tricksDone.map(t => t.name) });
          r.tricksDone = [];
        } else this.emit({ type: 'land', r });
      }
    }
    // ---- collisions sur les segments traversés
    const i0 = SK.clamp(Math.floor(zPrev / SEG), 0, T.segs.length - 1), i1 = SK.clamp(Math.floor(r.z / SEG), 0, T.segs.length - 1);
    for (let i = i0; i <= i1; i++) {
      const sg = T.segs[i];
      for (const p of sg.props) {
        if (p.decor) continue;
        const pz = sg.z + (p.dz == null ? SEG / 2 : p.dz);
        if (pz >= zPrev && pz < r.z && Math.abs(r.x - p.x) < p.r + 0.7 && r.h < 1.1 && r.state !== 'fall') { this.fall(r, 1.3, false); this.emit({ type: 'obstacle', r, kind: p.type }); }
      }
      if (sg.gate && r.ctrl === 'human') { const gz = sg.z + SEG / 2; if (gz >= zPrev && gz < r.z) { if (Math.abs(r.x - sg.gate.x) <= sg.gate.w) { this.gatesPassed++; this.emit({ type: 'gate', r, ok: true, n: sg.gate.n }); } else this.emit({ type: 'gate', r, ok: false, n: sg.gate.n }); } }
      for (const b of sg.boxes) {
        const bz = sg.z + SEG / 2;
        if (b.taken <= this.time && bz >= zPrev && bz < r.z && Math.abs(r.x - b.x) < 1.6 && r.h < 1.6) this.takeBox(r, b);
      }
      for (const c of sg.coins) {
        const cz = sg.z + SEG / 2;
        if (c.taken <= this.time && cz >= zPrev && cz < r.z && Math.abs(r.x - c.x) < (r.gear.aimant ? 2.8 : 1.5) && r.h < 2) { c.taken = this.time + SK.BOX_RESPAWN * 3; r.coins += SK.COIN_VALUE; r.coinsTotal += SK.COIN_VALUE; this.emit({ type: 'coin', r }); }
      }
    }
    for (const k of this.rocks) {
      if (this.time >= (k.landed || 0) && k.z >= zPrev && k.z < r.z && Math.abs(r.x - k.x) < 1.7 && r.h < 1.2 && !(k.owner === r && this.time - k.t0 < 1.5) && r.state !== 'fall') {
        k.until = 0; this.fall(r, 1.4, false); this.emit({ type: 'rockhit', r, by: k.owner }); if (k.owner && k.owner !== r) k.owner.stats.hits++;
      }
    }
    // ---- tirs et objets
    if (edge('shoot') && r.shot && !stunned) this.fire(r);
    if (edge('item') && r.item && !stunned) this.useItem(r);
    // ---- fin de tour : remontée mécanique ou arrivée
    if (r.z >= this.L && r.lap + 1 >= this.laps) {
      r.lapTimes.push(this.time - r.lapStart);
      r.state = 'done'; r.finishTime = this.time; r.z = this.L; this.lastFinish = this.time; this.emit({ type: 'finish', r });
    } else if (r.z >= this.gateZ) {
      if (Math.abs(r.x - this.gateX) > this.gateW) { // barrière : il faut rejoindre le portail
        r.z = this.gateZ - 0.1; r.speed = 6; if (r.wallT <= 0) { this.emit({ type: 'barrier', r }); r.wallT = 1.5; }
      } else {
        r.lapTimes.push(this.time - r.lapStart);
        const board = Math.max(this.nextChair, this.time); this.nextChair = board + SK.LIFT_INTERVAL;
        r.state = 'lift'; r.lift = { board, end: board + SK.LIFT_RIDE - (r.gear.vip ? 1.5 : 0), lapDone: r.lap + 1 }; r.z = this.L; r.speed = 0; r.h = 0; r.curTrick = null; r.tricksDone = []; r.pending = null;
        r.fx.parachute = 0; r.fx.snowman = 0; r.fx.slow = 0;
        this.emit({ type: 'lift', r, wait: board - this.time });
      }
    }
    r.prev = Object.assign({}, inp);
  };

  P.collideRacers = function () {
    const rs = this.racers;
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      if (a.state === 'lift' || a.state === 'done' || b.state === 'lift' || b.state === 'done' || a.lap !== b.lap) continue;
      const dz = a.z - b.z, dx = a.x - b.x;
      if (Math.abs(dz) < 1.6 && Math.abs(dx) < 1.4 && Math.abs(a.h - b.h) < 1.2) {
        const push = (1.4 - Math.abs(dx)) * 0.5 * (dx >= 0 ? 1 : -1) || 0.3;
        const wa = a.def.weight, wb = b.def.weight;
        a.x += push * wb / (wa + wb) * 2; b.x -= push * wa / (wa + wb) * 2;
        const lim = this.track.segAt(a.z).w - 0.9; a.x = SK.clamp(a.x, -lim, lim); b.x = SK.clamp(b.x, -lim, lim);
      }
    }
  };

  // ------------------------------------------------------------------ effets
  P.fall = function (r, dur, flat) {
    if (r.state === 'air') { r.pending = flat ? 'poele' : 'bombe'; return; }
    r.state = 'fall'; r.stun = Math.max(r.stun, dur * r.stunFactor); r.speed *= 0.25; r.curTrick = null; r.tricksDone = []; if (flat) r.flat = dur;
    r.stats.falls++; this.emit({ type: 'fall', r });
  };
  P.freeze = function (r, dur) {
    if (r.state === 'air') { r.pending = 'gel'; return; }
    r.state = 'frozen'; r.stun = Math.max(r.stun, dur); r.speed = 0; r.curTrick = null; r.tricksDone = []; this.emit({ type: 'frozen', r });
  };
  P.takeBox = function (r, b) {
    if (this.mode === 'time') return;
    if (b.kind === 'red') {
      if (r.shot) { this.emit({ type: 'boxfull', r, kind: 'red' }); return; }
      r.coins = Math.max(0, r.coins - SK.SHOT_COST); r.shot = this.rng.pick(SK.SHOT_IDS); b.taken = this.time + SK.BOX_RESPAWN; this.emit({ type: 'box', r, kind: 'red', got: r.shot });
    } else {
      if (r.item) { this.emit({ type: 'boxfull', r, kind: 'blue' }); return; }
      r.coins = Math.max(0, r.coins - SK.SHOT_COST); r.item = this.rng.pick(SK.ITEM_IDS); b.taken = this.time + SK.BOX_RESPAWN; this.emit({ type: 'box', r, kind: 'blue', got: r.item });
    }
  };
  P.fire = function (r) {
    const kind = r.shot; r.shot = null; r.stats.shots++;
    this.emit({ type: 'shoot', r, kind });
    if (kind === 'poele') {
      for (const o of this.racers) if (o !== r && !o.immune()) this.shots.push({ kind, from: r, target: o, drop: 0.7, h: 12 });
      return;
    }
    const target = this.racerAhead(r);
    if (!target || target.state === 'done' || target.state === 'lift') {
      if (kind === 'bombe') this.shots.push({ kind, from: r, target: null, prog: r.progress(), x: r.x, lap: r.lap, life: 2.5, h: 1 });
      return;
    }
    this.shots.push({ kind, from: r, target, prog: r.progress(), x: r.x, lap: r.lap, life: 6, h: 1.2 });
  };
  P.useItem = function (r) {
    const kind = r.item; r.item = null; r.stats.items++;
    this.emit({ type: 'item', r, kind });
    if (kind === 'rocher') { this.rocks.push({ z: r.z - 2.5, x: r.x, lap: r.lap, until: this.time + 30, owner: r, t0: this.time, landed: this.time + 0.7 }); r.rockAnim = this.time; }
    else if (kind === 'ventilo') r.fx.fan = 3;
    else if (kind === 'invisible') r.fx.invisible = 6;
    else if (kind === 'nuage') { for (const o of this.racers) if (o !== r && !o.immune()) o.fx.slow = o.gear.lunettes ? 2 : 4; }
    else if (kind === 'fantome') {
      const t = this.racerAhead(r);
      if (t && !t.immune() && (t.shot || t.item)) { if (t.shot) { r.shot = t.shot; t.shot = null; } else { r.item = t.item; t.item = null; } this.emit({ type: 'steal', r, from: t }); r.stats.hits++; }
    }
  };
  P.applyHit = function (r, kind, from) {
    if (r.immune()) return false;
    if (from) from.stats.hits++;
    if (kind === 'bombe') this.fall(r, 1.6, false);
    else if (kind === 'parachute') r.fx.parachute = r.gear.lunettes ? 2.5 : 5;
    else if (kind === 'gel') this.freeze(r, 2);
    else if (kind === 'poele') this.fall(r, 1.3, true);
    else if (kind === 'bonhomme') { r.fx.snowman = 3; r.curTrick = null; }
    this.emit({ type: 'hit', r, kind, from });
    return true;
  };
  P.updateShots = function (dt) {
    const keep = [];
    for (const s of this.shots) {
      if (s.drop != null) { s.drop -= dt; s.h = Math.max(0, s.drop * 14); if (s.drop <= 0) { this.applyHit(s.target, s.kind, s.from); continue; } keep.push(s); continue; }
      s.life -= dt; if (s.life <= 0) { this.emit({ type: 'fizzle', s }); continue; }
      const spd = 95 + (s.target ? s.target.speed : 0);
      s.prog += spd * dt;
      if (s.target) {
        if (s.target.state === 'lift' || s.target.state === 'done') { this.emit({ type: 'fizzle', s }); continue; }
        s.x += (s.target.x - s.x) * Math.min(1, 6 * dt);
        if (s.prog >= s.target.progress() - 0.5) { this.applyHit(s.target, s.kind, s.from); this.emit({ type: 'explode', s }); continue; }
      }
      s.lap = Math.floor(s.prog / this.L); s.z = s.prog - s.lap * this.L;
      if (s.z > this.L - 1) { this.emit({ type: 'fizzle', s }); continue; }
      keep.push(s);
    }
    this.shots = keep;
  };

  // Résultats de fin de course, dans l'ordre du classement.
  P.results = function () {
    return this.racers.slice().sort((a, b) => a.rank - b.rank).map(r => ({
      r, rank: r.rank, name: r.def.name, time: r.finishTime, estimated: !!r.estimated, coins: r.coinsTotal, tricks: r.tricksCount, tricksCoins: r.tricksCoins,
      prize: this.mode === 'time' ? 0 : (SK.PRIZES[r.rank] || 0), stats: r.stats, lapTimes: r.lapTimes,
    }));
  };
})(window.SK);
