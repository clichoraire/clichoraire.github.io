// Simulation d'un match de ballon chasseur façon Super Dodge Ball (NES) : joueurs intérieurs et extérieurs,
// balle vivante ou morte, lancers chargés, attrapés, interceptions, dégâts, K.-O. en ange, course (double appui),
// pouvoirs (js/powers.js) et expérience pour l'aventure.
(function (BC) {
  'use strict';
  const C = BC.COURT, G = BC.GRAVITY;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const HITTABLE = { idle: 1, windup: 1, throw: 1, catch: 1, jump: 1, pickup: 1, return: 1, stun: 1, bubble: 1, spin: 1 };
  const CHEST = 30;                     // hauteur d'un lancer (px)
  const CHARGE_TIME = 0.9;              // temps pour charger un lancer à fond (X tenu)
  BC.HITTABLE = HITTABLE; BC.CHEST = CHEST;

  BC.Game = class Game {
    // opts : { teams: [A, B], ctrl: ['p1'|'cpu', …], difficulty: 0..2, intro: bool, stats: { pid: stats } (aventure), mode: 'adventure' }
    constructor(opts) {
      this.teams = opts.teams; this.ctrl = opts.ctrl; this.difficulty = opts.difficulty || 0; this.mode = opts.mode || 'match';
      if(BC.monsterRoster&&this.mode!=='practice')this.teams=this.teams.map(t=>BC.monsterRoster(t,this.difficulty));
      this.controlMode=opts.controlMode==='fixed'?'fixed':'auto';
      this.statsOf = opts.stats || {};this.adventure=opts.adventure||null;
      this.court = BC.COURTS[this.teams[1].court] || BC.COURTS.gym; this.courtId = this.teams[1].court;
      this.time = 0; this.phase = opts.intro === false ? 'play' : 'ready'; this.phaseT = 0;
      this.events = []; this.fx = []; this.messages = []; this.projectiles = []; this.delayed = [];
      this.players = []; this.winner = null; this.endT = 0; this.stats = [{ throws: 0, supers: 0, catches: 0, hits: 0 }, { throws: 0, supers: 0, catches: 0, hits: 0 }];
      this.xp = {};                       // expérience gagnée par personnage pendant ce match
      this.flash = 0; this.shake = 0; this.prevIn = [{}, {}]; this.lock = [null, null];
      this.blizzard = [0, 0];             // temps de blizzard restant subi par chaque équipe
      this.squads = BC.squads(this.teams[0], this.teams[1]);
      for (let t = 0; t < 2; t++) {
        const sq = this.squads[t];
        const dir = t === 0 ? 1 : -1;
        const home = t === 0 ? [C.left + 150, C.left + 270, C.left + 150] : [C.right - 150, C.right - 270, C.right - 150];
        const ys = [(C.top + C.bottom) / 2 - 95, (C.top + C.bottom) / 2, (C.top + C.bottom) / 2 + 95];
        sq.inner.forEach((pid, i) => this.players.push(this.makePlayer(pid, t, 'in', null, home[i]??(t===0?C.left+170:C.right-170),sq.inner.length>3?C.top+40+(C.bottom-C.top-80)*i/(sq.inner.length-1):ys[i], dir)));
        const lanes = ['top', 'bottom', 'back'];
        sq.outer.forEach((pid, i) => {
          const lane = lanes[i], ox = t === 0 ? C.mid + (C.right - C.mid) / 2 : C.left + (C.mid - C.left) / 2;
          let x = ox, y = (C.top + C.bottom) / 2;
          if (lane === 'top') y = C.top - BC.LANE; else if (lane === 'bottom') y = C.bottom + BC.LANE; else x = t === 0 ? C.right + BC.LANE : C.left - BC.LANE;
          this.players.push(this.makePlayer(pid, t, 'out', lane, x, y, lane === 'back' ? -dir : dir));
        });
      }
      this.ball = { x: C.mid, y: (C.top + C.bottom) / 2, z: 230, vx: rnd(-1, 1) < 0 ? -35 : 35, vy: 0, vz: 0, holder: null, state: 'dead', team: -1, thrower: null, dmg: 0, power: null, t: 0, r: BC.BALL_R, trail: [], alpha: 1, visible: true, smash: false };
      this.ball.r0 = BC.BALL_R;
      if(this.controlMode==='fixed')for(let t=0;t<2;t++)this.lock[t]=this.inner(t)[0];
      this.ai = new BC.AI(this);
      if (this.phase === 'ready') this.say('PRÊTS ?', 1.3);
    }
    makePlayer(pid, t, zone, lane, x, y, dir) {
      const def = BC.PLAYERS[pid];
      let stats = def.monster&&BC.monsterStats&&this.mode!=='practice'?BC.monsterStats(pid,this.difficulty):(this.statsOf[pid] || def.stats);
      if(BC.Equipment?.effectiveStats&&BC.Equipment.allowed(this.difficulty))stats=BC.Equipment.effectiveStats(pid,stats);
      const ph = BC.phys(def, stats);if(def.boss)ph.maxHp=Math.round(ph.maxHp*BC.BOSS_HP_MULTIPLIERS[this.difficulty]);const P = BC.POWERS[def.power] || null;
      return { id: pid, def, level:def.monster&&BC.monsterLevel?BC.monsterLevel(pid,this.difficulty):null, stats, phys: ph, team: t, zone, lane, x, y, z: 0, vz: 0, vx: 0, vy: 0, hp: ph.maxHp, maxHp: ph.maxHp,
        state: 'idle', stateT: 0, facing: dir, frame: 0, moving: false, dash: { lastTap: -9, dir: 0, active: false, t: 0, fromJump: false, endedAt: -9 },
        hasBall: false, alive: true, knock: 0, knockDir: 1, ko: 0, aiT: rnd(0, 1), ai: {}, lent: this.squads[t].lent.includes(pid), home: { x, y }, mx: 0, my: 0, lastMove: null,
        charge: 0, charging: false, chargeGoal: null, pending: null,
        power: { id: def.power, kind: P ? P.kind : 'instant', charge: ph.chargeMax, max: ph.chargeMax, armed: false },
        fx: { stunT: 0, bubbleT: 0, fastT: 0, slowT: 0, rageT: 0, ghostT: 0, spinT: 0, horseT: 0, magnetT: 0, regenT: 0, revived: false }, tele: null };
    }
    get T() { return this.teams; }
    say(text, dur, sub) { this.messages.push({ text, sub, t: 0, dur: dur || 1.5 }); }
    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); }
    inner(t) { return this.players.filter(p => p.team === t && p.zone === 'in'); }
    aliveInner(t) { return this.inner(t).filter(p => p.alive); }
    outer(t) { return this.players.filter(p => p.team === t && p.zone === 'out'); }
    opponentsOf(p) { return this.aliveInner(1 - p.team); }
    isHuman(t) { return this.ctrl[t] !== 'cpu'; }
    isPlayerControlled(p) { return this.isHuman(p.team) && this.controlled(p.team)===p; }
    setControlMode(mode) {
      const selected=[this.controlled(0),this.controlled(1)];
      this.controlMode=mode==='fixed'?'fixed':'auto';
      if(this.controlMode==='fixed')this.lock=selected.map((p,t)=>p?.zone==='in'&&p.alive?p:this.aliveInner(t)[0]);else this.retargetAll();
    }
    sideOf(x) { return x < C.mid ? 0 : 1; }           // moitié du terrain : 0 = gauche
    heightOf(p) { return 50 * Math.max(0.55, p.def.size); }
    fwdOf(p) { const d = p.team === 0 ? 1 : -1; return p.tele ? -d : d; }   // téléporté derrière l'adversaire : on lance vers l'arrière
    rainbowBallRate(team) { return (this.rainbow?.[team]||0)>0 ? .6 : 1; }
    speedMul(p) { return (p.fx.horseT > 0 ? 1.35 : 1) * (p.fx.fastT > 0 ? 2 : 1) * (p.fx.slowT > 0 ? 0.5 : 1); }
    gainXp(p, n) { if (!p || n <= 0) return; this.xp[p.id] = (this.xp[p.id] || 0) + n; if (this.mode === 'adventure' && this.isHuman(p.team)) this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 70, text: '+' + n + ' XP', color: '#9fd3ff', t: 0, dur: 1 }); }

    // ---------- Contrôle : qui le joueur humain dirige ----------
    controlled(t) {
      if(this.controlMode==='fixed'){const holder=this.ball.holder;if(holder?.alive&&holder.team===t&&holder.zone==='out')return holder;return this.lock[t]?.alive?this.lock[t]:null;}
      const b = this.ball;
      if (b.holder && b.holder.team === t) return b.holder;
      const lock = this.lock[t]; if (lock && lock.alive && (lock.zone === 'in' || lock.zone === 'out')) return lock;
      return this.retarget(t);
    }
    // Choisit (et mémorise) le joueur contrôlé : le joueur visé par une balle adverse, sinon le plus proche d'une balle morte.
    // Appelé seulement aux événements (lancer, balle morte, possession), jamais à chaque image : le contrôle ne saute pas.
    retarget(t) {
      if(this.controlMode==='fixed')return this.lock[t]?.alive?this.lock[t]:null;
      const b = this.ball, mine = this.aliveInner(t); if (!mine.length) return null;
      let pick = null;
      if (b.state === 'live' && b.team !== t) pick = mine.slice().sort((a, c) => Math.abs(a.y - this.ballYAt(a.x)) - Math.abs(c.y - this.ballYAt(c.x)))[0];
      else if (b.state !== 'held') {
        if (this.sideOf(b.x) === t && b.y > C.top - 20 && b.y < C.bottom + 20 && b.x > C.left - 20 && b.x < C.right + 20) pick = mine.slice().sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0];
        else pick = this.outer(t).find(o => this.inLane(o, b)) || null;
      }
      if (!pick) { const cur = this.lock[t]; pick = cur && cur.alive && cur.zone === 'in' ? cur : mine.slice().sort((a, c) => Math.abs(a.y - b.y) - Math.abs(c.y - b.y))[0]; }
      this.lock[t] = pick; return pick;
    }
    retargetAll() { for (let t = 0; t < 2; t++) if (this.isHuman(t)) this.retarget(t); }
    // Profondeur (y) qu'aura la balle en vol quand elle arrivera à la largeur x (les lancers peuvent être en diagonale).
    ballYAt(x) { const b = this.ball; if (Math.abs(b.vx) < 1) return b.y; const t = (x - b.x) / b.vx; return t <= 0 ? b.y : b.y + b.vy * t; }
    // La balle est-elle dans le couloir de cet extérieur ?
    inLane(o, b) {
      const half = o.team === 0 ? [C.mid - 30, C.right + BC.LANE + 40] : [C.left - BC.LANE - 40, C.mid + 30];
      if (o.lane === 'top') return b.y < C.top + 30 && b.x > half[0] && b.x < half[1];
      if (o.lane === 'bottom') return b.y > C.bottom - 30 && b.x > half[0] && b.x < half[1];
      return o.team === 0 ? b.x > C.right - 30 : b.x < C.left + 30;
    }

    // ---------- Boucle ----------
    update(dt, inputs) {
      if(this.paused)return;
      if(this.rainbow)for(let t=0;t<2;t++)this.rainbow[t]=this.phase==='end'?0:Math.max(0,this.rainbow[t]-(this.phase==='play'?dt:0));
      if(this.phase==='end')for(const p of this.players)p.fx.horseT=0;
      this.time += dt; this.phaseT += dt;
      this.flash = Math.max(0, this.flash - dt * 3); this.shake = Math.max(0, this.shake - dt * 30);
      for (const m of this.messages) m.t += dt; this.messages = this.messages.filter(m => m.t < m.dur);
      for (const f of this.fx) f.t += dt; this.fx = this.fx.filter(f => f.t < f.dur);
      for (let t = 0; t < 2; t++) this.blizzard[t] = Math.max(0, this.blizzard[t] - dt);
      if (this.phase === 'ready') { if (this.phaseT > 1.3 && !this.went) { this.went = true; this.say('GO !', 0.8); this.emit('whistle'); } if (this.phaseT > 1.6) { this.phase = 'play'; this.phaseT = 0; } }
      if (this.phase === 'end') { this.endT += dt; this.updatePlayers(dt, [null, null]); this.updateBall(dt); return; }
      const ins = [null, null];
      for (let t = 0; t < 2; t++) {
        if (this.isHuman(t) && inputs && inputs[t] && this.phase === 'play') ins[t] = this.edges(t, inputs[t]);
      }
      this.ai.update(dt, ins);
      this.updatePlayers(dt, ins);
      this.updateBall(dt);
      this.updateProjectiles(dt);
      this.updateDelayed(dt);
      this.checkEnd();
    }
    edges(t, inp) {
      const prev = this.prevIn[t], e = { dx: inp.dx || 0, dy: inp.dy || 0, a: !!inp.a, b: !!inp.b, aDown: !!inp.a && !prev.a, aUp: !inp.a && !!prev.a, bDown: !!inp.b && !prev.b, pDown: !!inp.p && !prev.p, sel: inp.sel, cycle: inp.cycle && !prev.cycle };
      this.prevIn[t] = { a: !!inp.a, b: !!inp.b, p: !!inp.p, cycle: !!inp.cycle, left: e.dx < -0.5, right: e.dx > 0.5 };
      e.leftDown = e.dx < -0.5 && !prev.left; e.rightDown = e.dx > 0.5 && !prev.right;
      if (e.sel != null) { const mine = this.inner(t); if (mine[e.sel] && mine[e.sel].alive) this.lock[t] = mine[e.sel]; }
      if (e.cycle) { const mine = this.aliveInner(t), cur = this.controlled(t), i = mine.indexOf(cur); this.lock[t] = mine[(i + 1) % mine.length]; }
      return e;
    }

    updatePlayers(dt, ins) {
      this.updateGoblinEffects(dt);
      for (const p of this.players) {
        p.stateT += dt;
        if (!p.alive) { if (p.state === 'ko') { p.z += 55 * dt; p.ko += dt; if (p.ko > 2.6) p.state = 'gone'; } continue; }
        // Entrée : humain contrôlant ce joueur, sinon intention de l'IA (p.ai.move / p.ai.act)
        let move = { dx: 0, dy: 0 }, act = null;
        const human = this.isHuman(p.team) && this.controlled(p.team) === p && ins[p.team];
        if (human) {
          const e = ins[p.team]; move = { dx: e.dx, dy: e.dy };
          if (e.leftDown || e.rightDown) this.tap(p, e.leftDown ? -1 : 1);
          if (e.bDown && p.charging) act = 'b'; else if (e.aDown) act = 'a'; else if (e.bDown) act = 'b'; else if (e.pDown) act = 'p';
          if (e.aUp && p.charging && !e.bDown) { p.lastMove=move; this.release(p); }
        } else { move = p.ai.move || move; act = p.ai.act || null; p.ai.act = null; }
        this.stepPlayer(p, dt, move, act);
      }
    }
    tap(p, dir) {                       // double appui gauche/droite = course
      const d = p.dash;
      if (d.lastTap > this.time - 0.28 && d.dir === dir) { this.startDash(p, dir); }
      d.lastTap = this.time; d.dir = dir;
    }
    startDash(p, dir) { if (p.zone !== 'in' || p.state !== 'idle') return; p.dash.active = true; p.dash.t = 0; p.dash.dir = dir; p.facing = dir; this.emit('dash', { p }); }
    stopDash(p) { if (p.dash.active) { p.dash.active = false; p.dash.endedAt = this.time; } }
    recentDash(p) { return p.dash.active || this.time - p.dash.endedAt < 0.3; }   // vient de courir : C = saut en course

    stepPlayer(p, dt, move, act) {
      const ph = p.phys, s = p.state, F = p.fx;
      for (const k of ['fastT', 'slowT', 'rageT', 'ghostT', 'horseT', 'magnetT']) F[k] = Math.max(0, F[k] - dt);
      if (ph.regen && p.hp < p.maxHp) { F.regenT += dt; if (F.regenT > 4) { F.regenT = 0; p.hp = Math.min(p.maxHp, p.hp + (ph.regenAmount || 1)); } }
      // états à durée fixe
      if (s === 'windup') {
        if (p.charging) { p.charge = Math.min(1, p.charge + dt / CHARGE_TIME); if ((p.chargeGoal != null && p.charge >= p.chargeGoal) || (!this.isPlayerControlled(p) && p.stateT > CHARGE_TIME + 0.6)) this.release(p); }
        else if (p.stateT > 0.1) this.release(p);
      }
      if (s === 'throw' && p.stateT > 0.28) { this.setState(p, 'idle'); if (p.tele) this.teleReturn(p); }
      if (s === 'catch' && p.stateT > 0.34) this.setState(p, 'idle');
      if (s === 'pickup' && p.stateT > 0.18) this.setState(p, 'idle');
      if (s === 'spin') { F.spinT -= dt; if (F.spinT <= 0) this.release(p); }
      if (s === 'stun') { F.stunT -= dt; if (F.stunT <= 0) this.setState(p, 'idle'); }
      if (s === 'bubble') { F.bubbleT -= dt; p.z += (46 - p.z) * Math.min(1, dt * 4); if (F.bubbleT <= 0) { this.setState(p, 'idle'); p.vz = 0; this.fx.push({ kind: 'pop', x: p.x, y: p.y, z: p.z + 25, t: 0, dur: 0.3 }); } }
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
      // saut (pas pendant qu'on flotte dans une bulle)
      if (s !== 'bubble' && (p.z > 0 || p.vz > 0)) {
        // Montée inchangée ; descente plus douce pour charger en l’air.
        const floatDown = p.airborneJump && p.vz <= 0 && ['jump', 'windup', 'throw', 'idle'].includes(p.state);
        p.vz -= G * dt * (floatDown ? 0.45 : 1); p.z += p.vz * dt;
        if (p.z <= 0) {
          if(this.enemyJumpLanding)this.enemyJumpLanding(p);
          p.z = 0; p.vz = 0; p.dash.fromJump = false; p.airborneJump = false;
          const over = p.zone === 'in' && !p.tele && (p.team === 0 ? p.x > C.mid - 14 : p.x < C.mid + 14);
          if (s === 'jump') this.setState(p, over ? 'return' : 'idle'); else if (over && s !== 'return') { p.pending = null; p.charge = 0; this.setState(p, 'return'); }
        }
      }
      // déplacement
      const canMove = (s === 'idle' || s === 'jump' || s === 'windup' && p.charging && this.isPlayerControlled(p) || s === 'catch' && p.stateT > 0.2) && p.alive;
      const sm = this.speedMul(p);
      let mx = 0, my = 0;
      const inFlight = p.airborneJump && p.z > 0 && ['jump', 'windup', 'throw', 'idle'].includes(p.state);
      if (inFlight) { mx = p.vx; my = p.vy; }
      else if (canMove && !(s === 'jump')) {
        if (p.dash.active) {
          const held = move.dx * p.dash.dir > 0.3;
          if (!held) this.stopDash(p);
          else { p.dash.t += dt; mx = p.dash.dir * ph.maxSpeed * ph.dashMul * sm; my = clamp(move.dy, -1, 1) * ph.maxSpeed * 0.6 * sm; }
        }
        if (!p.dash.active) {
          const len = Math.hypot(move.dx, move.dy) || 1, k = Math.min(1, len);
          mx = move.dx / len * k * ph.maxSpeed * sm; my = move.dy / len * k * ph.maxSpeed * sm;
          if (Math.abs(move.dx) > 0.3) p.facing = move.dx > 0 ? 1 : -1;
        }
      } else if (s === 'jump') { mx = p.vx; my = p.vy; }
      const ice=this.iceAt(p);p.iceFallCooldown=Math.max(0,(p.iceFallCooldown||0)-dt);if(!ice)p.iceVisit=null;
      if(canMove&&!inFlight&&s!=='jump'&&!ice){
        const oldX=p.groundVX||0,oldY=p.groundVY||0,stopping=Math.hypot(mx,my)<.01;
        const reversing=oldX*mx+oldY*my<0;
        const seconds=stopping?.12:reversing?.18:p.dash.active?.18:.28;
        const limit=ph.maxSpeed*Math.max(.35,sm)*(p.dash.active?ph.dashMul:1)*dt/seconds;
        const dx=mx-oldX,dy=my-oldY,distance=Math.hypot(dx,dy),k=distance?Math.min(1,limit/distance):1;
        mx=oldX+dx*k;my=oldY+dy*k;p.groundVX=mx;p.groundVY=my;
      }else{p.groundVX=p.groundVY=0;}
      if(canMove&&!inFlight&&s!=='jump'&&ice){const k=Math.min(1,dt*2);p.iceVX=(p.iceVX??p.mx??0)+(mx*.48-(p.iceVX??p.mx??0))*k;p.iceVY=(p.iceVY??p.my??0)+(my*.48-(p.iceVY??p.my??0))*k;mx=p.iceVX;my=p.iceVY;if(Math.hypot(mx,my)>10&&p.iceVisit!==ice){p.iceVisit=ice;if(p.hasBall&&!p.iceFallCooldown&&Math.random()<.35){p.iceFallCooldown=4;this.iceDrop(p);mx=my=0;act=null;}}}else{p.iceVX=null;p.iceVY=null;}

      p.moving = Math.abs(mx) + Math.abs(my) > 10; p.mx = mx; p.my = my; p.lastMove = move;
      p.walkBlend=(p.walkBlend||0)+((p.moving?1:0)-(p.walkBlend||0))*Math.min(1,dt*9);
      if(p.walkBlend>.001)p.frame+=dt*Math.min(11,5+Math.hypot(mx,my)/Math.max(1,ph.maxSpeed)*3)*p.walkBlend;
      if (p.moving && F.fastT > 0 && Math.random() < 0.5) this.fx.push({ kind: 'speed', x: p.x - Math.sign(mx || p.facing) * 14, y: p.y + rnd(-8, 8), z: rnd(8, 40), t: 0, dur: 0.25 });
      p.x += mx * dt; p.y += my * dt;
      this.confine(p);
      if (p.zone === 'in' && !p.dash.active && s === 'idle' && !p.moving) p.facing = this.fwdOf(p);   // au repos on regarde l'adversaire
      // Stable visual orientation: small AI corrections must not flip the portrait every frame.
      const visualTarget=Math.abs(mx)>ph.maxSpeed*.18?Math.sign(mx):p.facing;
      p.visualFacing ??= p.facing;
      if(p.visualCandidate!==visualTarget){p.visualCandidate=visualTarget;p.visualTurnTime=0;}
      p.visualTurnTime=(p.visualTurnTime||0)+dt;
      if(p.visualTurnTime>=.18)p.visualFacing=visualTarget;
      p.visualView ??= 'front';
      if(p.walkBlend>.7)p.visualView='side';
      else if(p.walkBlend<.12)p.visualView='front';
      // actions
      if (act && p.alive && this.phase === 'play') this.action(p, act, move);
    }
    confine(p) {
      if (p.zone === 'in') {
        const pad = 14, air = p.z > 0 || p.state === 'return' || p.tele;   // en l'air (ou en train de revenir, ou téléporté) : la ligne du centre ne retient pas
        if (air) p.x = clamp(p.x, C.left + pad, C.right - pad);
        else if (p.team === 0) p.x = clamp(p.x, C.left + pad, C.mid + 50); else p.x = clamp(p.x, C.mid - 50, C.right - pad);
        if (!air && ((p.team === 0 && p.x >= C.mid + 50) || (p.team === 1 && p.x <= C.mid - 50))) this.stopDash(p);
        p.y = clamp(p.y, C.top + 8, C.bottom - 8);
      } else {
        // les couloirs se rejoignent dans les coins : aucune balle morte n'est hors de portée
        const half = p.team === 0 ? [C.mid + 20, C.right + BC.LANE] : [C.left - BC.LANE, C.mid - 20];
        if (p.lane === 'top') { p.y = C.top - BC.LANE; p.x = clamp(p.x, half[0], half[1]); }
        else if (p.lane === 'bottom') { p.y = C.bottom + BC.LANE; p.x = clamp(p.x, half[0], half[1]); }
        else { p.x = p.team === 0 ? C.right + BC.LANE : C.left - BC.LANE; p.y = clamp(p.y, C.top - BC.LANE, C.bottom + BC.LANE); }
      }
    }
    setState(p, s) { p.state = s; p.stateT = 0; if (s !== 'windup') { p.charging = false; } }

    action(p, act, move) {
      if (act === 'p') { this.usePower(p); return; }
      if (p.hasBall) {
        if (act === 'a') {                              // lancer : X tenu = charge (⬆ / ⬇ tenu = en diagonale)
          if (p.state === 'jump') { this.startCharge(p, move); return; }
          if (p.state !== 'idle') return;
          if (p.power.armed && this.powerThrowStart(p, move)) return;   // téléportation, tornade : séquence spéciale
          this.startCharge(p, move);
        } else if (act === 'b') {
          if(p.charging){this.pass(p,move);return;}
          if (p.z > 0 && (p.state === 'jump' || p.state === 'windup' && p.pending?.jump)) { this.pass(p, move); return; }
          if (p.state !== 'idle') return;
          if (p.zone === 'in' && this.recentDash(p)) { this.jump(p, move); p.dash.fromJump = true; this.stopDash(p); return; }   // saut en course avec la balle
          const noDir = Math.abs(move.dx) < 0.5 && Math.abs(move.dy) < 0.5;
          if (p.zone === 'in' && noDir) { this.jump(p, move); return; }   // saut sur place avec la balle : lancer en l'air = smash
          this.pass(p, move);
        }
      } else {
        if (act === 'a' && p.state === 'idle' && p.zone === 'in') { this.jump(p, move); }
        if (act === 'b' && (p.state === 'idle') && p.zone === 'in') { this.setState(p, 'catch'); this.stopDash(p); this.emit('catchTry', { p }); }
      }
    }
    jump(p, move) { if (p.z > 0) return; p.airborneJump = true; const sm = this.speedMul(p); p.vz = p.phys.jump; p.vx = p.dash.active ? p.dash.dir * p.phys.maxSpeed * 1.25 * sm : (move ? clamp(move.dx, -1, 1) * p.phys.maxSpeed * 0.8 * sm : 0); p.vy = move ? clamp(move.dy, -1, 1) * p.phys.maxSpeed * 0.5 * sm : 0; if (p.dash.active) p.facing = p.dash.dir; this.setState(p, 'jump'); this.emit('jump', { p }); }
    // X enfoncé : on arme le bras ; plus on tient, plus la balle partira vite et fort. L'ordi vise une charge (chargeGoal).
    startCharge(p, move, goal) {
      const run = p.dash.active, jump = p.z > 0; if (jump) p.airborneJump = true; this.stopDash(p);
      this.setState(p, 'windup'); p.charging = true; p.charge = 0; p.chargeGoal = goal == null ? ((this.isHuman(p.team) && (this.controlMode!=='fixed' || this.isPlayerControlled(p))) ? null : (p.ai.charge != null ? p.ai.charge : 0.4)) : goal;
      p.pending = { run, move, jump };
    }

    // Direction d'un lancer. Chaque lanceur a un axe avant (vers le camp adverse ; vers le terrain pour les extérieurs)
    // et un axe latéral. Latéral tenu (⬆/⬇, ou ⬅/➡ pour les extérieurs du haut et du bas) : la balle part en diagonale.
    // Sinon, visée assistée : la balle part vers l'adversaire le mieux placé devant, en anticipant un peu son déplacement.
    aimDir(p, move) {
      const dir = this.fwdOf(p); let f, l, lat;
      if (p.zone === 'in') { f = { x: dir, y: 0 }; l = { x: 0, y: 1 }; lat = move ? move.dy : 0; }
      else if (p.lane === 'back') { f = { x: -dir, y: 0 }; l = { x: 0, y: 1 }; lat = move ? move.dy : 0; }
      else { f = { x: 0, y: p.lane === 'top' ? 1 : -1 }; l = { x: 1, y: 0 }; lat = move ? move.dx : 0; }
      const norm = (x, y, extra) => { const L = Math.hypot(x, y) || 1; return Object.assign({ x: x / L, y: y / L }, extra); };
      let target = null, best = 1e9;
      for (const q of this.opponentsOf(p)) {
        const dx = q.x - p.x, dy = q.y - p.y, ahead = dx * f.x + dy * f.y, side = dx * l.x + dy * l.y;
        if (ahead < 40) continue;
        const k = Math.abs(side) / ahead; if (k < best) { best = k; target = q; }
      }
      if (Math.abs(lat || 0) > 0.5) { const k = Math.sign(lat) * 0.55; return norm(f.x + l.x * k, f.y + l.y * k, { target, manual: true }); }
      if (target && best <= 0.45) {
        const ahead = (target.x - p.x) * f.x + (target.y - p.y) * f.y, T = ahead / (p.phys.throwSpeed * 0.8);
        const dx = target.x + target.mx * T * 0.5 - p.x, dy = target.y + target.my * T * 0.5 - p.y;
        const k = clamp((dx * l.x + dy * l.y) / Math.max(1, dx * f.x + dy * f.y), -0.5, 0.5);
        return norm(f.x + l.x * k, f.y + l.y * k, { target, assisted: true });
      }
      return norm(f.x, f.y, { target, straight: true });
    }
    // Fin de la charge (X relâché, charge pleine, ou fin de la tornade) : la balle part.
    release(p) {
      const pend = p.pending || {}; p.pending = null; p.charging = false;
      this.throwBall(p, { run: pend.run, move: this.isPlayerControlled(p) ? (p.lastMove || pend.move) : pend.move, charge: p.charge, jump: !!pend.jump && p.z > 0, tornade: pend.tornade });
      p.charge = 0;
    }
    // Lancer : tout droit, en diagonale ou avec la visée assistée (aimDir), à hauteur de poitrine. La balle part lentement
    // et accélère en vol. En l'air (saut puis X) : smash, plus vite, plus fort, plus dur à attraper, et la balle plonge sur la cible.
    throwBall(p, o) {
      const b = this.ball; if (b.holder !== p) { this.setState(p, 'idle'); return; }
      const ph = p.phys, dir = this.fwdOf(p), foes = this.opponentsOf(p), ch = clamp(o.charge || 0, 0, 1);
      const aim = this.aimDir(p, o.move);
      // One error sample on release; aiming previews never consume randomness.
      {
        const error=(Math.random()*2-1)*(BC.Aiming?.spread(this,p)??ph.aimSpread), x=aim.x, y=aim.y;
        aim.x=x*Math.cos(error)-y*Math.sin(error);aim.y=x*Math.sin(error)+y*Math.cos(error);
      }
      const target = aim.target || foes.slice().sort((a, c) => Math.abs(a.y - p.y) - Math.abs(c.y - p.y))[0] || null;
      const apex = o.jump && Math.abs(p.vz) < 170;
      p.hasBall = false; b.holder = null; b.state = 'live'; b.team = p.team; b.thrower = p; b.t = 0; b.trail = []; b.alpha = 1; b.visible = true; b.r = b.r0;
      b.target = target; b.bounces = 0; b.power = null; b.smash = false; b.hitCd = new Map(); b.charge = ch;
      b.x = p.x + dir * 12; b.y = p.y; b.z = (p.z || 0) + CHEST + (o.jump ? 10 : 0);
      // La descente d'un smash suit la distance réellement parcourue, même si le ballon accélère.
      b.launchX = b.x; b.launchZ = b.z;
      b.impactX = target ? target.x : (p.team === 0 ? C.right : C.left);
      b.impactZ = target ? target.z + this.heightOf(target) * 0.55 : CHEST;
      b.airShot = !!o.jump;
      if (p.zone === 'in') {
        let speed = ph.throwSpeed * (0.85 + 0.45 * ch) * (o.run ? 1.12 : 1) * (o.jump ? (apex ? 1.3 : 1.2) : 1);
        let dmg = ph.dmg + Math.round(4 * ch) + (o.run ? 1 : 0) + (o.jump ? (apex ? 5 : 3) : 0);
        if (p.fx.rageT > 0) dmg = Math.round(dmg * 1.5);
        const start = ph.fullStart ? 0.9 : 0.6;        // la balle part à 60 % puis accélère
        b.vx = aim.x * speed * start; b.vy = aim.y * speed * start; b.vz = 0; b.dmg = dmg; b.speed = speed;
        if (o.jump) { b.smash = true; if (apex) { this.say('SMASH !', 0.9, p.def.name); this.emit('smash', { p }); } }
        if (p.power.armed && p.power.kind === 'throw') this.powerThrow(p, b, o);   // pouvoir armé : la balle devient spéciale
      } else {
        // extérieur : vise l'adversaire intérieur le mieux placé devant son couloir (ou en diagonale si une direction est tenue)
        const speed = ph.throwSpeed * 0.8 * (0.85 + 0.3 * ch);
        b.vx = aim.x * speed * 0.6; b.vy = aim.y * speed * 0.6; b.vz = 0; b.dmg = Math.max(3, Math.round(ph.dmg * 0.65) + Math.round(2 * ch)); b.speed = speed; b.target = target;
        if(['goblin','skeleton','lizard'].includes(p.def.monster)&&p.power.armed&&p.power.kind==='throw')this.powerThrow(p,b,o);
      }
      this.setState(p, 'throw'); this.stats[p.team].throws++;
      this.emit(b.power ? 'throwSuper' : 'throw', { p });
      this.retargetAll();
    }
    // Passe : vers l'extérieur du haut / du bas / du fond selon la direction, sinon au coéquipier intérieur le plus proche.
    pass(p, move) {
      const b = this.ball, mates = this.players.filter(q => q.team === p.team && q !== p && q.alive);
      const airborne = p.z > 0 && (p.state === 'jump' || p.state === 'windup' && p.pending?.jump);
      const combo = airborne && this.sideOf(p.x) !== p.team;
      let target = null;
      const fwd = p.team === 0 ? 1 : -1;
      if (move.dy < -0.5) target = mates.find(q => q.lane === 'top'); else if (move.dy > 0.5) target = mates.find(q => q.lane === 'bottom');
      else if (move.dx * fwd > 0.5) target = mates.find(q => q.lane === 'back');
      if (!target && combo && Math.abs(move.dx) < 0.5 && Math.abs(move.dy) < 0.5) target = mates.find(q => q.lane === 'back');
      if (!target) { const inner = mates.filter(q => q.zone === 'in'); target = inner.sort((a, c) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(c.x - p.x, c.y - p.y))[0] || mates[0]; }
      if (!target) return;
      p.hasBall = false; b.holder = null; b.state = 'pass'; b.team = p.team; b.thrower = p; b.target = target; b.t = 0; b.power = null; b.alpha = 1; b.visible = true; b.r = b.r0;
      b.quickReturn = combo && (target.zone === 'out' || this.sideOf(target.x) !== p.team);
      const dx = target.x - p.x, dy = target.y - p.y, L = Math.hypot(dx, dy), T = clamp(L / 620, 0.35, 0.9);
      b.x = p.x; b.y = p.y; b.z = (p.z || 0) + CHEST; b.landX = target.x; b.landY = target.y;
      b.vx = dx / T; b.vy = dy / T; b.vz = (CHEST - b.z) / T + 0.5 * G * T * 0.55; b.g = G * 0.55;
      p.pending = null; p.charging = false; p.charge = 0;p.chargeGoal=null;p.fullAt=null;
      this.setState(p, airborne ? 'jump' : 'throw');
      this.emit('pass', { p });
    }
    give(p) {                                        // le joueur prend la balle
      const b = this.ball; b.holder = p; b.state = 'held'; b.team = p.team; b.power = null; b.alpha = 1; b.visible = true; b.r = b.r0; b.vx = b.vy = b.vz = 0; b.magnetTo = null; b.quickReturn = false; p.hasBall = true;
      if(this.controlMode!=='fixed')this.lock[p.team] = null;
    }
    // Un attrapé (balle adverse ou passe interceptée) : statistiques, et toute l'équipe recharge un peu son pouvoir.
    caught(p, o) {
      this.give(p); this.stats[p.team].catches++;
      for (const q of this.players.filter(q=>q.team===p.team&&(q.zone==='in'||q.def.monster==='skeleton'))) if (q.alive) for(const power of q.powerStates?Object.values(q.powerStates):[q.power]) power.charge = Math.min(power.max, power.charge + 1);
      this.emit('catch', Object.assign({ p }, o || {}));
      this.say(o && o.intercept ? 'INTERCEPTÉ !' : 'ATTRAPÉ !', 0.8);
      this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 40, text: o && o.intercept ? 'INTERCEPTÉ' : 'ATTRAPÉ', color: '#7dffa0', t: 0, dur: 0.8 });
    }

    // ---------- Balle ----------
    updateBall(dt) {
      const b = this.ball; if(['live','pass'].includes(b.state))dt*=this.rainbowBallRate(b.team); b.t += dt;
      if (b.state === 'held') { const p = b.holder; if (!p || !p.alive) { b.state = 'dead'; b.holder = null; if (p) p.hasBall = false; return; } b.x = p.x + p.facing * 10; b.y = p.y; b.z = p.z + CHEST; return; }
      if (b.state === 'live') { this.updateLive(dt); return; }
      if (b.state === 'magnet') {                       // aimant de Jessica : la balle file vers elle
        const p = b.magnetTo; if (!p || !p.alive) { b.state = 'dead'; return; }
        const dx = p.x - b.x, dy = p.y - b.y, L = Math.hypot(dx, dy) || 1, sp = 900;
        b.x += dx / L * sp * dt; b.y += dy / L * sp * dt; b.z += (p.z + CHEST - b.z) * Math.min(1, dt * 6);
        if (Math.random() < 0.7) this.fx.push({ kind: 'spark', x: b.x + rnd(-10, 10), y: b.y + rnd(-6, 6), z: b.z, color: '#f8f', t: 0, dur: 0.25 });
        if (L < 22 || b.t > 2) { this.give(p); this.setState(p, 'pickup'); this.emit('pickup', { p }); }
        return;
      }
      if (b.state === 'pass') {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= (b.g || G) * dt; b.z += b.vz * dt;
        const tg = b.target;
        if (tg && tg.alive && Math.hypot(tg.x - b.x, tg.y - b.y) < 32 && b.z < 80 && HITTABLE[tg.state] && !tg.hasBall && (!b.quickReturn || ['idle', 'catch', 'jump'].includes(tg.state))) {
          const quickReturn = b.quickReturn;
          this.give(tg); this.emit('catch', { p: tg, pass: true });
          if (quickReturn) {
            tg.pending = null; tg.charging = false;
            this.throwBall(tg, { charge: 0.3, jump: tg.state === 'jump' && tg.z > 0, move: { dx: 0, dy: 0 } });
            this.fx.push({ kind: 'pow', x: tg.x, y: tg.y, z: tg.z + 55, text: 'ENCHAÎNEMENT !', color: '#ffd166', t: 0, dur: 0.8 });
          }
          return;
        }
        // interception par un adversaire intérieur qui attrape (C) ou qui saute sur la trajectoire
        for (const q of this.aliveInner(1 - b.team)) {
          const d = Math.hypot(q.x - b.x, q.y - b.y), top = q.z + this.heightOf(q) + 20;
          if ((q.state === 'catch' && q.stateT < 0.3 && d < 36 && b.z < top) || (q.state === 'jump' && d < 26 && b.z > q.z && b.z < top)) { this.caught(q, { intercept: true }); return; }
        }
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
      const b = this.ball, dir = Math.sign(b.vx) || 1;
      b.visible = true; b.alpha = 1; b.r = b.r0;
      if (this.powerLive(b, dt)) return;                // balle spéciale entièrement gérée par le pouvoir (tornade, triche…)
      // lancer normal : la balle accélère en vol (jusqu'à 1,4 × la vitesse de départ) et pique légèrement
      const sp = Math.hypot(b.vx, b.vy) || 1, want = b.power==='witchtempo'&&BC.witchBallSpeed?BC.witchBallSpeed(b):Math.min(b.speed * (b.power === 'fusee' ? 2 : 1.4), sp + b.speed * (b.power === 'fusee' ? 2.6 : 1.8) * dt);
      b.vx *= want / sp; b.vy *= want / sp; b.vz -= G * 0.03 * dt;
      b.z += b.vz * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.airShot) { const flight = clamp((b.x - b.launchX) / (b.impactX - b.launchX || dir), 0, 1); b.z = b.launchZ + (b.impactZ - b.launchZ) * flight; }
      if ((b.y < C.top - 6 && b.vy < 0) || (b.y > C.bottom + 6 && b.vy > 0)) { this.kill(b, 0.5); return; }   // sortie par le haut ou le bas : les extérieurs la ramassent
      if (b.power === 'fusee' || b.power === 'boulet') { b.trail.push({ x: b.x, y: b.y, z: b.z }); if (b.trail.length > 12) b.trail.shift(); }
      if (b.power === 'fusee' && Math.random() < 0.8) this.fx.push({ kind: 'fire', x: b.x - dir * 12, y: b.y, z: b.z, t: 0, dur: 0.35 });
      // contact avec un joueur intérieur adverse
      for (const p of this.aliveInner(1 - b.team)) {
        if (!HITTABLE[p.state] || p.fx.ghostT > 0) continue;   // un fantôme laisse passer la balle
        const h = this.heightOf(p), zOk = b.z + b.r > p.z && b.z - b.r < p.z + h;
        if (Math.abs(p.x - b.x) < (p.def.boss?48:p.orcStage===2?32:p.orcRole==='berserker'?22:15) + b.r && Math.abs(p.y - b.y) < (p.def.boss?40:p.orcStage===2?28:17) + b.r && zOk) { this.contact(p, b); return; }
      }
      if (b.z <= 0) { this.kill(b, 0.35); return; }     // au sol : la balle est morte
      // sortie par le fond du camp adverse, ou retour dans son propre camp (balle d'un extérieur du fond ou d'un téléporté)
      const fwd = b.team === 0 ? 1 : -1, beyondBack = fwd > 0 ? b.x > C.right + 10 : b.x < C.left - 10, backHome = fwd > 0 ? b.x < C.mid - 40 : b.x > C.mid + 40;
      if ((b.vx * fwd > 0 && beyondBack) || (b.vx * fwd < 0 && backHome && !(b.power==='witchloop'&&b.t<.36))) { this.kill(b, 0.25); b.vx *= 0.6; return; }
    }
    kill(b, k) { b.state = 'dead'; b.power = null; b.visible = true; b.alpha = 1; b.r = b.r0; b.vx *= k; b.vy *= k; b.vz = Math.max(b.vz, 120); this.emit('bounce'); this.retargetAll(); }
    spark(x, y, z, color) { this.fx.push({ kind: 'spark', x, y, z, color, t: 0, dur: 0.4 }); }

    // La balle arrive sur un joueur : attrapé (C au bon moment, en lui faisant face) ou touché.
    contact(p, b) {
      const P = b.power ? BC.POWERS[b.power] : null, dir = Math.sign(b.vx) || 1;
      if(b.power==='goblinbomb'){this.powerExplode(p,b);return;}
      if(b.power==='fireball')this.ignite(p,b.thrower);
      const uncatchable = b.power === 'triche';
      if (p.state === 'catch' && !uncatchable) {
        const facing = Math.abs(b.vx) < Math.abs(b.vy) || p.facing === -dir;   // balle venant du haut ou du bas : pas besoin de lui faire face
        const hard = b.power?.startsWith('boss') ? 0.65 : b.power === 'boulet' ? 0.85 : b.smash ? 0.3 : b.power ? 0.4 : 0;
        const win = 0.2 * (1 - hard) * (0.8 + p.phys.catchSkill * 0.4) * p.phys.catchWin;
        const ok = this.isHuman(p.team) && (this.controlMode!=='fixed' || this.isPlayerControlled(p)) ? facing && p.stateT <= win : p.ai.willCatch;
        if (ok) {
          if (b.power === 'fusee') { this.powerExplode(p, b); return; }   // la fusée explose dans les mains de celui qui l'attrape
          this.caught(p, { power: b.power }); return;
        }
      }
      const dmg = Math.max(1, Math.round(b.dmg * (p.state === 'catch' ? 0.7 : 1)));
      const absorbed = this.hurt(p, dmg, { from: b.thrower, dir, knock: (b.power === 'boulet' ? 700 : 300), power: b.power });
      if (absorbed) return;                             // fantôme : la balle continue comme si de rien n'était
      this.fx.push({ kind: 'burst', x: b.x, y: b.y, z: b.z, t: 0, dur: 0.35 });
      this.shake = b.power ? 10 : 5;
      if(b.power==='bossshadow')p.fx.slowT=2;
      this.powerAfterHit(p, b, dmg);
      if (this.powerKeepsBall(b, p)) return;            // la tornade continue de rebondir après un touché
      b.state = 'dead'; b.power = null; b.visible = true; b.alpha = 1; b.r = b.r0; b.vx = -dir * 180; b.vy = rnd(-60, 60); b.vz = 240;
      this.retargetAll();
    }
    // Dégâts à un joueur, d'où qu'ils viennent (balle, biscuits, éclair, explosion). Renvoie true si le coup a été absorbé.
    // o : { from: lanceur (expérience), dir, knock, power, text }
    hurt(p, dmg, o) {
      o = o || {}; if (!p.alive) return true;
      if (!o.penalty && this.powerGuard(p, dmg, o)) return true;      // Fantôme
      dmg = Math.max(1, Math.round(dmg));
      if(p.armor>0){const absorbed=Math.min(p.armor,dmg);p.armor-=absorbed;dmg-=absorbed;this.fx.push({kind:'pow',x:p.x,y:p.y,z:p.z+65,text:'−'+absorbed+' ARMURE',color:'#64d5ff',t:0,dur:1});if(dmg===0){this.emit('hit',{p,dmg:0,armor:absorbed,power:o.power});return false;}}

      if (p.hp - dmg <= 0 && p.phys.revive && !p.fx.revived) { p.fx.revived = true; dmg = p.hp - 1; this.say('INCREVABLE !', 1, p.def.name); }
      const lost = Math.min(p.hp, dmg); p.hp -= lost;
      if (o.from) { this.stats[o.from.team].hits++; this.gainXp(o.from, lost); }   // XP = points de vie réellement enlevés
      if(o.dot&&p.hp>0){this.fx.push({kind:'pow',x:p.x,y:p.y,z:p.z+45,text:'−'+lost,color:'#ffae46',t:0,dur:.6});this.emit('hit',{p,dmg:lost,power:o.power});return false;}
      p.knockDir = o.dir || (p.team === 0 ? -1 : 1); p.knock = (o.knock || 300) * (0.7 + 0.6 / Math.max(0.5, p.def.size));
      if (p.hasBall) { p.hasBall = false; if (this.ball.holder === p) { this.ball.holder = null; this.ball.state = 'dead'; this.ball.vz = 200; } }
      if (p.state === 'bubble') this.fx.push({ kind: 'pop', x: p.x, y: p.y, z: p.z + 25, t: 0, dur: 0.3 });
      if (p.tele) this.teleReturn(p);
      this.setState(p, 'hit'); this.stopDash(p); p.charging = false; p.vz = 160; p.z = Math.max(p.z, 1);
      this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 45, text: '-' + dmg, color: '#ff6b6b', t: 0, dur: 0.9 });
      this.emit('hit', { p, dmg, power: o.power, ko: p.hp <= 0 });
      this.retargetAll();
      if (p.hp <= 0) { p.alive = false; p.state = 'ko'; p.ko = 0; p.hasBall = false; this.say('K.-O. !', 1.2, p.def.name); this.emit('ko', { p }); if(this.controlMode!=='fixed')this.lock[p.team] = null; if (o.from) this.gainXp(o.from, BC.XP_KO); }
      return false;
    }
    // Effets à retardement (biscuits qui arrivent, retour de téléportation…)
    later(delay, fn) { this.delayed.push({ t: delay, fn }); }
    updateDelayed(dt) { for (const d of this.delayed) d.t -= dt; const due = this.delayed.filter(d => d.t <= 0); this.delayed = this.delayed.filter(d => d.t > 0); for (const d of due) d.fn(); }
    checkEnd() {
      for (let t = 0; t < 2; t++) if (!this.aliveInner(t).length) {
        this.phase = 'end'; this.winner = 1 - t; this.endT = 0; this.ball.state = 'dead'; this.ball.holder = null; for (const p of this.players) p.hasBall = false;
        this.say('VICTOIRE !', 3, this.teams[1 - t].name); this.emit('win', { team: 1 - t }); return;
      }
    }
  };
})(window.BC);
