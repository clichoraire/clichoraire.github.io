// Snow Kids — simulation d'une course (sans affichage) : coureurs, physique de descente, figures, remontée mécanique,
// tirs et objets, classement. Déterministe pour une graine donnée (utilisé aussi par tools/headless.js).
(function (SK) {
  'use strict';
  SK.itemDuration ||= (r,seconds)=>seconds;
  const SEG = SK.SEG;
  const EMPTY = { steer: 0, up: false, down: false, jump: false, trick: false, shoot: false, push: false, item: false };

  // Shared with the test cabin: cornering improves edge hold, not lateral speed.
  SK.applyHandlingStats=function(r,corner,acceleration){
    r.steerRate=10.8;
    r.cornerHold=SK.clamp(corner/16,0,1)*.82;
    r.accelerationSeconds=15-7*SK.clamp(acceleration/16,0,1);
  };
  SK.coinSpeedBonus=r=>Math.max(0,Math.min(r.coinCapacity||20,r.coins||0));
  SK.raceTopSpeed=r=>r.maxSpeed+SK.coinSpeedBonus(r)/3.6;
  SK.accelerationStep=function(speed,target,seconds,dt){
    // 90 % en `seconds`, 99 % en deux fois ce temps : la fin demande de l’élan.
    if(dt<=0||speed>=target)return speed;
    const k=Math.log(10)/Math.max(.1,seconds);
    return target-(target-speed)*Math.exp(-k*dt);
  };
  // Une flexion complète puis un relâchement : une poussée, jamais un turbo continu.
  SK.pumpKick=function(r){
    if(r.state!=='ride'||(r.jumpCharge||0)<.95||r.speed>=70/3.6)return false;
    r.speed=Math.min(70/3.6,r.speed+2.5);r.fx.pump=.35;return true;
  };
  function Racer(race, opts, idx) {
    this.race = race; this.idx = idx; this.def = opts.def || SK.charById(opts.charId) || SK.CHARACTERS[0]; this.board = opts.board || SK.boardById(opts.boardId);
    this.ctrl = opts.ctrl || 'cpu'; this.player = opts.player == null ? -1 : opts.player; this.boss = !!opts.boss; this.look = opts.look || null;
    const d = this.def, b = this.board;
    this.maxSpeed = 27 + 0.8 * d.speed + 0.8 * b.speed;
    SK.applyHandlingStats(this,d.corner+(b.corner||0),(d.acceleration??3)+(b.acceleration||0));
    this.trickSpeed = 1;
    this.trickPay = 1;
    this.jumpPower = 3.7 + 0.32 * ((d.jump || 3) + (b.jump || 0)); // vitesse verticale d'un saut au bouton
    this.strength = Math.min(10,(d.strength||3)+(opts.strengthLevel||0)); this.pushCooldown=0; this.pushVelocity=0;
    this.stunFactor = 1 - 0.08 * (d.weight - 3);
    this.gear = opts.gear || {}; this.powerLevels=opts.powerLevels||{};
    if (this.gear.casque) this.stunFactor *= 0.8;
    if (this.gear.gants) this.trickSpeed *= 1.1;
    SK.GearEffects?.init(this);
    this.x = 0; this.z = 0; this.lap = 0; this.yAbs = 0; this.h = 0; this.vy = 0; this.lastVy = 0; this.speed = 0; this.steer = 0;
    this.state = 'ride'; this.stun = 0; this.flat = 0; this.wallT = 0;
    this.shot = null; this.item = null; this.coins = 0; this.coinsTotal = 0; this.trackCoins = 0; this.tricksCoins = 0; this.tricksCount = 0;
    this.curTrick = null; this.tricksDone = []; this.airT = 0; this.pending = null;
    this.fx = { parachute: 0, fan: 0, invisible: 0, slow: 0, snowman: 0 };
    this.rank = idx; this.finishTime = null; this.lift = null; this.lapTimes = []; this.lapStart = 0;
    this.input = Object.assign({}, EMPTY); this.prev = Object.assign({}, EMPTY); this.ai = null;
    this.stats = { shots: 0, items: 0, hits: 0, falls: 0, edges: 0, pushes: 0 };
  }
  Racer.prototype.progress = function () { return this.lap * this.race.L + Math.min(this.z, this.race.L); };
  Racer.prototype.immune = function () { return this.state === 'lift' || this.state === 'drop' || this.state === 'done' || this.fx.invisible > 0; };

  // Shared deterministic weather: the warning cloud and lateral force use the same clock.
  SK.stormAt=function(course,time,seed=1){
    if(!course.blizzard||time<6)return {strength:0,force:0,direction:0,warning:false};
    const elapsed=time-6,cycle=Math.floor(elapsed/12),phase=elapsed%12,direction=(cycle+(seed%2))%2?1:-1;
    const warning=phase<1.4,strength=phase>=1.4&&phase<5.2?Math.sin((phase-1.4)/3.8*Math.PI):0;
    return {strength,force:direction*2.7*strength,direction,warning};
  };
  SK.Race = function (opts) {
    this.course = opts.course; this.seed = opts.seed || 1; this.mission = opts.mission || null; this.track = SK.buildTrack(this.course, this.seed, { slalom: this.mission && this.mission.type === 'slalom', rockBarriers: this.mission && this.mission.type === 'nofall' ? this.mission.level||1 : 0, edgeLesson: this.mission?.type === 'edges' ? this.mission.level || 1 : 0 });
    this.boostOnly = !!this.mission && this.mission.type !== 'hits';
    if(this.boostOnly)for(const segment of this.track.segs)for(const box of segment.boxes)box.kind='blue';
    this.gatesPassed = 0; this.gatesTotal = this.track.gates.length;
    this.L = this.track.L; this.gateX = this.track.gateX; this.gateW = this.track.gateW; this.gateZ = this.track.gateZ; this.laps = opts.laps || this.course.laps || SK.DEFAULT_LAPS; this.mode = opts.mode || 'race';
    this.difficulty = opts.difficulty == null ? 1 : opts.difficulty; this.rng = SK.rng(this.seed * 31 + 7);
    this.time = -3.4; this.phase = 'count'; this.countShown = -4; this.events = []; this.rocks = []; this.shots = []; this.explosions=[]; this.nextChair = 0; this.lastFinish = 0;
    this.racers = opts.racers.map((r, i) => new Racer(this, r, i));
    const w0 = this.track.segs[0].w, n = this.racers.length;
    this.racers.forEach((r, i) => { r.x = n === 1 ? 0 : (-0.6 + 1.2 * i / (n - 1)) * w0; r.startX = r.x; r.z = 2 + i * 0.5; r.yAbs = this.track.groundY(r.z);

    });
    this.rankAll();
    for(const r of this.racers)if(r.gear.sac&&this.mode!=='time')r.item=this.rollPower(r,'blue');
    this.humans = this.racers.filter(r => r.ctrl === 'human');
  };
  const P = SK.Race.prototype;
  SK.missionOutcome = function(race,r){
    const m=race.mission;if(!m)return null;
    const value=m.type==='slalom'?race.gatesPassed:m.type==='coins'?r.trackCoins:m.type==='tricks'?r.tricksCoins:m.type==='hits'?r.stats.hits:m.type==='pushes'?r.stats.pushes:m.type==='time'?r.finishTime:m.type==='edges'?r.stats.edges:r.stats.falls;
    return {value,ok:m.type==='time'?value!=null&&value<=m.goal:['nofall','edges'].includes(m.type)?value===0:value>=m.goal};
  };
  P.emit = function (e) { this.events.push(e); };
  P.takeEvents = function () { const e = this.events; this.events = []; return e; };
  P.setInput = function (player, inp) { const r = this.racers.find(x => x.player === player); if (r) r.input = Object.assign({}, EMPTY, inp); };
  P.racerAhead = function (r) { return this.racers.find(o => o.rank === r.rank - 1) || null; };
  P.racerBehind = function (r) { return this.racers.find(o => o.rank === r.rank + 1) || null; };

  P.update = function (dt) {
    if (this.phase === 'over') return;
    if(this.phase==='race'&&SK.GearEffects)dt*=SK.GearEffects.timeScale(this,dt);
    this.time += dt;
    if (this.phase === 'count') {
      const c = Math.min(3, Math.ceil(-this.time));
      if (c !== this.countShown && c <= 3) { this.countShown = c; this.emit({ type: 'count', n: c }); }
      if (this.time >= 0) { this.phase = 'race'; this.emit({ type: 'go' }); for (const r of this.racers) if (r.gear.fusee) SK.GearEffects?SK.GearEffects.boost(r,3):r.fx.fan=3; } else { this.rankAll(); return; }
    }
    for(const cow of this.track.walkers||[]){
      const a=this.time*cow.walk.rate+cow.walk.phase;
      cow.x=Math.sin(a)*cow.walk.range;cow.facing=Math.cos(a)>=0?1:-1;
      cow.walkTime=this.time;
    }
    for (const r of this.racers) if (r.ctrl === 'cpu' && SK.AI) SK.AI.drive(this, r, dt);
    for (const r of this.racers){r.snowPrevious={x:r.x,z:r.z};this.updateRacer(r, dt);}
    this.updateSnowGuards(dt);
    this.updatePolarBears(dt);
    SK.LensSnow.update(this,dt);
    this.collideRacers();
    this.updateShots(dt);
    this.explosions=this.explosions.filter(e=>this.time-e.at<1.2);
    this.rocks = this.rocks.filter(k => k.until > this.time);
    this.rankAll();
    if (this.racers.every(r => r.state === 'done')) this.finish();
    else if (this.humans.length && this.humans.every(r => r.state === 'done') && this.time > this.lastFinish + 6) {
      for (const r of this.racers) if (r.state !== 'done') {
        const remaining = this.laps * this.L - r.progress(), liftsLeft = this.laps - 1 - r.lap - (r.state === 'lift' ? 0 : 0);
        r.finishTime = this.time + remaining / (SK.raceTopSpeed(r) * 0.85) + Math.max(0, liftsLeft) * (SK.LIFT_RIDE + 1) + (r.state === 'lift' ? r.lift.end - this.time : 0);
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
    r.pushCooldown=Math.max(0,(r.pushCooldown||0)-dt);
    const edge = k => inp[k] && !prev[k];
    for (const k in r.fx) if (r.fx[k] > 0) r.fx[k] = Math.max(0, r.fx[k] - dt);
    r.pumpPose=Math.max(0,(r.pumpPose||0)-dt*4);
    if (r.flat > 0) r.flat -= dt;
    if (r.state === 'done') { r.prev = Object.assign({}, inp); return; }
    if (r.state === 'lift') {
      if (this.time >= r.lift.end) { // la chaise arrive en haut : on voit le coureur descendre du siège sur la piste
        r.lap++; if(r.gear.sac&&this.mode!=='time'&&!r.item)r.item=this.rollPower(r,'blue'); r.z = 2; r.x = r.startX; r.yAbs = T.groundY(r.z) + 4; r.h = 4; r.speed = 5; r.state = 'drop'; r.lift = null; r.lapStart = this.time; r.steer = 0;
      }
      r.prev = Object.assign({}, inp); return;
    }
    if (r.state === 'drop') { // suspendu à la chaise, on descend doucement jusqu'à la neige
      r.h = Math.max(0, r.h - 3.4 * dt); r.z += r.speed * dt; r.yAbs = T.groundY(r.z) + r.h;
      if (r.h <= 0) { r.state = 'ride'; r.speed = 8; this.emit({ type: 'lapstart', r }); }
      r.prev = Object.assign({}, inp); return;
    }
    const s = T.segAt(r.z), surf = SK.SURFACES[s.surface] || SK.SURFACES.snow;
    if(r.speed>=70/3.6)r.recovering=false;
    if(r.recovering && edge('up')) {
      if(r.state==='fall'){r.stun=Math.max(0,r.stun-.22);r.flat=Math.min(r.flat,r.stun);}
      else if(r.state==='ride'){r.speed=Math.min(70/3.6, r.speed+8/3.6);r.fx.pump=.25;}
    }
    if(r.speed>=70/3.6)r.recovering=false;
    const stunned = r.state === 'fall' || r.state === 'frozen' || r.state === 'stunned';
    if (stunned) {
      r.stun -= dt; r.speed = Math.max(0, r.speed - 20 * dt);
      if (r.state === 'frozen') r.speed = 0;
      if (r.stun <= 0) { r.state = 'ride'; }
    }
    // ---- vitesse
    let target = 0;
    if (!stunned) {
      let f = surf.speed * Math.max(r.fx.fan > 0 ? 1.45 : 1, r.fx.comboBoost > 0 ? 1.2 + .1 * r.boostCombo : 1) * (r.fx.parachute > 0 ? 0.55 : 1) * (r.fx.slow > 0 ? 0.7 : 1) * (r.fx.snowman > 0 ? 0.5 : 1) * (r.aiSpeed || 1);
      if (inp.down && r.state === 'ride') f *= 0.35;
      else if (inp.up && r.state === 'ride') f *= 1.08; // penché vers l'avant : un peu plus de vitesse
      // Le laboratoire isole l’effet de la pente, sans modifier les courses normales.
      if(this.debugLab){const angle=Math.atan2(s.y1-s.y2,SEG);f*=Math.max(0,1+Math.sin(angle)-Math.sin(Math.atan(SK.SLOPE)));}
      if(r.state==='ride')f*=1-.12*Math.pow(Math.abs(r.visualTurn||0),1.4);
      if(r.gear.casqueAero&&Math.abs(r.steer)<.15&&Math.abs(s.curve)<.3)f*=1.1;
      if(r.gear.fart&&s.surface==='snow'&&!inp.up&&!inp.down)f*=1.02;
      target = SK.raceTopSpeed(r) * f;
    }
    if (r.state === 'air') { /* en l'air : la vitesse se conserve (légère perte) */ r.speed = Math.max(0, r.speed - 0.6 * dt); }
    else if (!stunned) {
      if(r.speed<target){
        const seconds=(r.fx.fan>0||r.fx.comboBoost>0)?2.5:(r.accelerationSeconds||10)*(inp.up?1:1.18);
        r.speed=SK.accelerationStep(r.speed,target,seconds,dt);
      }else r.speed=Math.max(target,r.speed-(inp.down?12:1.5)*dt);
    }
    // ---- latéral : direction, force centrifuge, murs
    const kappa = s.curve / (SEG * SEG), centrifugal = kappa * r.speed * r.speed * 4.2;
    r.steer += SK.clamp(inp.steer - r.steer, -7/1.3 * dt, 7/1.3 * dt); // la direction se prend progressivement (inclinaison)
    // L'inclinaison visuelle suit la direction sans changement instantané de pose.
    r.turnCharge = (r.turnCharge || 0) + SK.clamp(inp.steer - (r.turnCharge || 0), -1.8/1.3 * dt, 1.8/1.3 * dt);
    r.visualTurn = (r.visualTurn || 0) + (r.turnCharge - (r.visualTurn || 0)) * (1 - Math.exp(-10/1.3 * dt));
    r.crouch = (r.crouch || 0) + SK.clamp((inp.up && !inp.down && r.state === 'ride' && !stunned ? 1 : 0) - (r.crouch || 0), -5 * dt, 5 * dt); // penché en avant, genoux fléchis
    r.brake = (r.brake || 0) + SK.clamp((inp.down && r.state === 'ride' && !stunned ? 1 : 0) - (r.brake || 0), -5 * dt, 5 * dt);
    const station = r.z >= this.L; // zone de la gare au bas de la piste
    if (!stunned && r.fx.snowman <= 0) {
      const grip = (r.state === 'air' ? 0.35 : 1.25 * (1 - .48 * r.crouch)) * surf.grip;
      r.x += r.steer * r.steerRate * (station ? 0.9 : Math.min(1, r.speed / 12)) * grip * dt;
    }
    if (station && r.lap + 1 < this.laps) { r.speed = Math.max(6, Math.min(r.speed, 14) - 10 * dt); target = 0; }
    r.x -= centrifugal * (r.state === 'air' ? 0.6 : 1-(r.cornerHold||0)) * (SK.SURFACES[s.surface] && s.surface === 'ice' ? 1.25 : 1) * dt;
    if(this.course.blizzard&&!station&&(r.state==='ride'||r.state==='air')&&r.speed>1){const gust=SK.stormAt(this.course,this.time,this.seed);r.x+=gust.force*(r.state==='air'?1.15:1)*dt;}
    r.x += (r.pushVelocity||0)*dt;
    r.pushVelocity *= Math.exp(-3*dt);
    if(r.fx.wobble>0)r.speed=Math.max(0,r.speed-2*dt);
    const lim = s.w - 0.9;
    if (r.x > lim || r.x < -lim) {
      if(r.pushImpactUntil>this.time&&Math.abs(r.pushVelocity)>2){this.daze(r,1.8);r.pushImpactUntil=0;r.pushVelocity=0;}
      if(!r.touchingEdge)r.stats.edges++;r.touchingEdge=true;
      r.x = SK.clamp(r.x, -lim, lim);
      if (r.wallT <= 0 && r.speed > 12 && !stunned) { this.emit({ type: 'wall', r }); r.wallT = 0.5; }
      if (r.gear.veste) { r.speed *= (1 - 0.7 * dt); if (r.speed > 24) r.speed = Math.max(24, r.speed - 10 * dt); }
      else { r.speed *= (1 - 1.8 * dt); if (r.speed > 18) r.speed = Math.max(18, r.speed - 25 * dt); }
    }
    if(Math.abs(r.x)<lim-.05)r.touchingEdge=false;
    if (r.wallT > 0) r.wallT -= dt;
    // ---- avance
    const zPrev = r.z; r.z += r.speed * dt;
    // X plie les genoux ; seul le relâchement déclenche le saut chargé.
    const releasedJump=prev.jump&&!inp.jump;
    if(r.state==='ride'&&!stunned&&inp.jump){r.jumpCharge=Math.min(1,(r.jumpCharge||0)+dt/.9);r.pumpPose=r.jumpCharge;}
    else if(r.state!=='ride'||stunned)r.jumpCharge=0;
    if(releasedJump&&!stunned&&SK.pumpKick(r))this.emit({type:'pump',r});

    // ---- relief, sauts, figures
    const gy = T.groundY(r.z);
    if (r.state === 'ride' || (stunned && r.h <= 0)) {
      if (gy < r.yAbs - 1.0 && r.speed > 5 && !stunned) { // le sol se dérobe d'un coup (falaise) : envol
        r.state = 'air'; r.vy = Math.max(0.5, r.lastVy) + (inp.jump ? r.jumpPower * .6 * (r.jumpCharge||0) : 0) + 1; r.airT = 0; r.tricksDone = []; r.h = r.yAbs - gy; this.emit({ type: 'jump', r, big: true });
      } else {
        r.lastVy = dt > 0 ? (gy - r.yAbs) / dt : 0; r.yAbs = gy; r.h = 0;
        if (!stunned && releasedJump && (r.jumpCharge||0)>0) { r.state = 'air'; r.vy = r.jumpPower * (.4+.6*r.jumpCharge) + Math.max(0, r.lastVy); r.jumpCharge=0; r.airT = 0; r.tricksDone = []; this.emit({ type: 'jump', r, big: false }); }
      }
    }
    if(releasedJump||r.state!=='ride')r.jumpCharge=0;
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
        if(r.gear.gants&&r.curTrick&&!r.pending&&r.curTrick.t>=r.curTrick.def.dur*.75){r.tricksDone.push(r.curTrick.def);r.curTrick=null;}
        if(!r.curTrick&&!r.pending)SK.GearEffects?.land(r);
        if (r.curTrick || r.pending) { const why = r.pending; r.pending = null; r.curTrick = null; r.tricksDone = []; this.fall(r, why === 'gel' ? 0 : 1.4, why === 'poele'); if (why === 'gel') this.freeze(r, 2); }
        else if (r.tricksDone.length) {
          let total = 0; r.tricksDone.forEach((t, i) => { total += t.coins * (1 + 0.5 * i); });
          total = Math.max(1, Math.round(total * r.trickPay));
          const awarded=SK.collectGold?SK.collectGold(r,total):total;if(!SK.collectGold){r.coins+=total;r.coinsTotal+=total;} r.tricksCoins += total; r.tricksCount += r.tricksDone.length;
          r.boostCombo = Math.min(5, r.tricksDone.length);
          r.fx.comboBoost = 2;
          this.emit({ type: 'trick', r, combo: r.tricksDone.length, coins: awarded, names: r.tricksDone.map(t => t.name) });
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
        if (pz >= zPrev && pz < r.z && Math.abs(r.x - p.x) < p.r + 0.7 && (p.type==='lowarch'||r.h < (p.clearance ?? 1.1)) && r.state !== 'fall') { // Les deux commandes plient les genoux : accélérer ou préparer le saut.
          if(p.type==='lowarch'&&r.state==='ride'&&(inp.up||inp.jump))continue;
          if(!p.trainingBarrier&&!p.mandatory&&SK.GearEffects?.protect(r,p))continue;
          if(p.type==='lowarch'){this.daze(r,1.8);continue;}
          if(p.type==='snowman'){r.speed*=.55;r.fx.slow=Math.max(r.fx.slow,1.4);SK.LensSnow.splash(r,24,true);this.emit({type:'snowimpact',r});continue;}
          this.fall(r, 1.3, false); this.emit({ type: 'obstacle', r, kind: p.type }); }
      }
      if (sg.gate && r.ctrl === 'human') { const gz = sg.z + SEG / 2; if (gz >= zPrev && gz < r.z) { if (Math.abs(r.x - sg.gate.x) <= sg.gate.w) { this.gatesPassed++; this.emit({ type: 'gate', r, ok: true, n: sg.gate.n }); } else this.emit({ type: 'gate', r, ok: false, n: sg.gate.n }); } }
      for (const b of sg.boxes) {
        const bz = sg.z + SEG / 2;
        if (b.taken <= this.time && bz >= zPrev && bz < r.z && Math.abs(r.x - b.x) < 1.6 && r.h < 1.6) this.takeBox(r, b);
      }
      if(sg.puzzle&&!sg.puzzle.taken&&r.ctrl==='human'&&sg.z+SEG/2>=zPrev&&sg.z+SEG/2<r.z&&Math.abs(r.x-sg.puzzle.x)<1.8&&r.h<2.5){sg.puzzle.taken=true;this.emit({type:'puzzle',r,id:sg.puzzle.id});}
      for (const c of sg.coins) {
        const cz = sg.z + SEG / 2;
        if (c.taken <= this.time && cz >= zPrev && cz < r.z && Math.abs(r.x - c.x) < (r.gear.aimant ? 2.8 : 1.5) && r.h < 2) { c.taken = this.time + SK.BOX_RESPAWN * 3; r.trackCoins++; if(SK.collectGold)SK.collectGold(r,SK.COIN_VALUE);else{r.coins+=SK.COIN_VALUE;r.coinsTotal+=SK.COIN_VALUE;} this.emit({ type: 'coin', r }); }
      }
    }
    for (const k of this.rocks) {
      if (k.until>this.time && k.lap===r.lap && !r.immune() && this.time >= (k.landed || 0) && k.z >= zPrev && k.z < r.z && Math.abs(r.x - k.x) < 1.7 && r.h < 1.2 && !(k.owner === r && this.time - k.t0 < 1.5) && r.state !== 'fall') {
        k.until = 0; this.fall(r, 1.4, false); if(k.type==='banana'){r.fx.slip=1.4;r.pushVelocity=(r.input.steer<0?-1:1)*6;} this.emit({ type: 'rockhit', r, by: k.owner, trapType:k.type||'rock' }); if (k.owner && k.owner !== r) k.owner.stats.hits++;
      }
    }
    // ---- tirs et objets
    if(edge('push')&&!stunned)this.pushRacer(r);
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
  P.pushRacer = function(r){
    if(r.state!=='ride'||r.pushCooldown>0)return false;
    r.pushCooldown=.55;r.fx.pushPose=.55;
    const aim=Math.abs(r.input.steer)>.15?Math.sign(r.input.steer):0;
    r.pushDirection=aim||r.pushDirection||1;
    const targets=this.racers.filter(o=>o!==r&&o.state==='ride'&&o.lap===r.lap&&Math.abs(o.z-r.z)<4.5&&Math.abs(o.x-r.x)<3.2&&(!aim||(o.x-r.x)*aim>0)&&!o.immune());
    targets.sort((a,b)=>Math.hypot(a.z-r.z,a.x-r.x)-Math.hypot(b.z-r.z,b.x-r.x));
    const o=targets[0];if(!o)return false;
    const difference=r.strength-o.strength,dir=aim||Math.sign(o.x-r.x)||r.pushDirection;
    // Déplacement net même contre un personnage plus fort, puis retour au contrôle.
    o.pushVelocity=dir*SK.clamp(10+difference*2.8,7,22);o.fx.wobble=1.1;
    o.fx.pushHit=.65;o.pushHitDirection=dir;
    r.speed*=.92;o.speed*=.90;r.pushCooldown=3;
    o.pushImpactUntil=difference>=2?this.time+1.2:0;r.pushDirection=dir;
    r.stats.pushes++;this.emit({type:'push',r,target:o});return true;
  };
  P.daze=function(r,duration){
    r.state='stunned';r.stun=Math.max(r.stun,duration*r.stunFactor);r.speed*=.3;
    r.curTrick=null;r.pending=null;r.tricksDone=[];r.jumpCharge=0;
    this.emit({type:'dazed',r});
  };

  P.fall = function (r, dur, flat) {
    if (r.state === 'air') { r.pending = flat ? 'poele' : 'bombe'; return; }
    r.recovering=true;
    r.state = 'fall'; r.stun = Math.max(r.stun, dur * r.stunFactor); r.speed *= 0.25; r.curTrick = null; r.tricksDone = []; if (flat) r.flat = dur;
    r.stats.falls++; this.emit({ type: 'fall', r });
  };
  P.freeze = function (r, dur) {
    if (r.state === 'air') { r.pending = 'gel'; return; }
    r.state = 'frozen'; r.stun = Math.max(r.stun, dur); r.speed = 0; r.curTrick = null; r.tricksDone = []; this.emit({ type: 'frozen', r });
  };
  P.rollPower = function(r,kind){
    if(this.boostOnly)return 'ventilo';
    this.rankAll();
    if(r.rank===0)return kind==='red'?'rocher':this.rng.pick(['rocher','rocher','ventilo','invisible']);
    return this.rng.pick(kind==='red'?SK.SHOT_IDS:SK.ITEM_IDS);
  };
  P.dropTrap = function(r){
    const type=this.rng.pick(SK.TRAP_IDS);
    this.rocks.push({type,z:Math.max(0,r.z-2.5),x:r.x,lap:r.lap,until:this.time+SK.itemDuration(r,30),owner:r,t0:this.time,landed:this.time+.7});
    r.rockAnim=this.time;r.trapType=type;
  };
  P.takeBox = function (r, b) {
    if (this.mode === 'time') return;
    if (b.kind === 'red') {
      if (r.shot) { this.emit({ type: 'boxfull', r, kind: 'red' }); return; }
      r.coins = Math.max(0, r.coins - SK.SHOT_COST); r.shot = this.rollPower(r,'red'); b.taken = this.time + SK.BOX_RESPAWN; r.boxBurst={at:this.time,kind:b.kind}; this.emit({ type: 'box', r, kind: 'red', got: r.shot });
    } else {
      if (r.item) { this.emit({ type: 'boxfull', r, kind: 'blue' }); return; }
      r.coins = Math.max(0, r.coins - SK.SHOT_COST); r.item = this.rollPower(r,'blue'); b.taken = this.time + SK.BOX_RESPAWN; r.boxBurst={at:this.time,kind:b.kind}; this.emit({ type: 'box', r, kind: 'blue', got: r.item });
    }
  };
  P.fire = function (r) {
    const kind = r.shot; r.shot = null; r.stats.shots++;
    this.emit({ type: 'shoot', r, kind });
    if(kind==='rocher'){this.dropTrap(r);return;}
    if (kind === 'poele') {
      for (const o of this.racers) if (o !== r && o.progress()>r.progress() && !o.immune()) this.shots.push({ kind, from: r, target: o, drop: 1.5, h: 12 });
      return;
    }
    const target = this.racerAhead(r);
    if (!target || target.state === 'done' || target.state === 'lift') {
      if (kind === 'bombe') this.shots.push({ kind, from: r, target: null, prog: r.progress(), x: r.x, lap: r.lap, life: 2.5, h: 1 });
      return;
    }
    this.shots.push({ kind, from: r, target, prog: r.progress(), x: r.x, lap: r.lap, life: 8, h: 1.2, armedAt:this.time+1.5 });
  };
  P.useItem = function (r) {
    const kind = r.item; r.item = null; r.stats.items++;
    this.emit({ type: 'item', r, kind });
    if (kind === 'rocher') this.dropTrap(r);
    else if (kind === 'ventilo') {if(SK.GearEffects)SK.GearEffects.boost(r,3);else r.fx.fan=3;}
    else if (kind === 'invisible') r.fx.invisible = SK.itemDuration(r,6);
    else if (kind === 'nuage') { for (const o of this.racers) if (o !== r && o.progress()>r.progress() && !o.immune()) o.fx.slow = SK.itemDuration(r,o.gear.lunettes ? 2 : 4); }
    else if (kind === 'fantome') {
      const t = this.racerAhead(r);
      if (t && !t.immune() && (t.shot || t.item)) { if (t.shot) { r.shot = t.shot; t.shot = null; } else { r.item = t.item; t.item = null; } this.emit({ type: 'steal', r, from: t }); r.stats.hits++; }
    }
  };
  P.applyHit = function (r, kind, from) {
    if (r.immune()) return false;
    if (from) from.stats.hits++;
    const strength=1+.1*(from?.powerLevels?.shot||0);
    if (kind === 'bombe') {this.explosions.push({z:r.z,x:r.x,lap:r.lap,at:this.time});this.fall(r, 1.6*strength, false);}
    else if (kind === 'parachute') r.fx.parachute = (r.gear.lunettes ? 2.5 : 5)*strength;
    else if (kind === 'gel') this.freeze(r, 2*strength);
    else if (kind === 'poele') this.fall(r, 1.3*strength, true);
    else if (kind === 'bonhomme') { r.fx.snowman = 3*strength; r.curTrick = null; }
    this.emit({ type: 'hit', r, kind, from });
    return true;
  };
  P.updatePolarBears=function(dt){
    for(const b of this.track.polarBears||[]){
      const oldX=b.x;b.timer=Math.max(0,b.timer-dt);
      if(b.phase==='patrol'){
        b.x+=b.dir*2.2*dt;if(Math.abs(b.x)>b.limit){b.x=SK.clamp(b.x,-b.limit,b.limit);b.dir*=-1;}
        const r=this.racers.find(r=>r.state==='ride'&&!r.immune()&&b.z-r.z>12&&b.z-r.z<60);
        if(r){b.phase='warning';b.timer=.9;b.targetX=r.x;b.lap=r.lap;}
      }else if(b.phase==='warning'&&b.timer===0){b.phase='charge';b.timer=.8;b.dir=Math.sign(b.targetX-b.x)||b.dir;}
      else if(b.phase==='charge'){b.x=SK.clamp(b.x+b.dir*11*dt,-b.limit,b.limit);if(b.timer===0){b.phase='rest';b.timer=2.5;}}
      else if(b.phase==='rest'&&b.timer===0)b.phase='patrol';
      for(const r of this.racers){if(r.immune()||!['ride','air'].includes(r.state)||r.h>2.2||r.fx.bearSafe>0)continue;
        const prev=r.snowPrevious||r,ax=prev.x-oldX,az=prev.z-b.z,dx=(r.x-b.x)-ax,dz=r.z-prev.z;
        const q=SK.clamp(-(ax*dx+az*dz)/(dx*dx+dz*dz||1),0,1);
        if(Math.hypot(ax+q*dx,az+q*dz)<2.1){this.fall(r,1.1,false);r.fx.bearSafe=2.5;this.emit({type:'bearhit',r});}
      }
    }
  };
  P.updateSnowGuards=function(dt){
    for(const g of this.track.snowGuards||[]){
      g.cooldown=Math.max(0,g.cooldown-dt);
      if(g.windup>0){g.windup=Math.max(0,g.windup-dt);if(g.windup===0){
        const dx=g.aimX-g.x,dz=g.aimZ-g.z,length=Math.hypot(dx,dz)||1;
        this.shots.push({kind:'wildsnow',x:g.x,z:g.z,vx:dx/length*26,vz:dz/length*26,h:1,lap:g.lap,life:4});g.cooldown=3.5;
      }continue;}
      if(g.cooldown>0)continue;
      const r=this.racers.filter(r=>r.state==='ride'&&!r.immune()&&g.z-r.z>15&&g.z-r.z<85).sort((a,b)=>b.z-a.z)[0];
      if(r){g.windup=1;g.aimX=r.x;g.aimZ=Math.min(g.z-5,r.z+r.speed*1.4);g.lap=r.lap;}
    }
  };
  P.updateShots = function (dt) {
    const keep = [];
    for (const s of this.shots) {
      if(s.kind==='wildsnow'){
        const ox=s.x,oz=s.z;s.x+=s.vx*dt;s.z+=s.vz*dt;s.life-=dt;
        let hit=false;
        for(const r of this.racers){if(r.lap!==s.lap||r.immune()||!['ride','air'].includes(r.state)||r.h>1.8)continue;
          const prev=r.snowPrevious||r,ax=ox-prev.x,az=oz-prev.z,dx=(s.x-r.x)-ax,dz=(s.z-r.z)-az;
          const q=SK.clamp(-(ax*dx+az*dz)/(dx*dx+dz*dz||1),0,1);
          if(Math.hypot(ax+q*dx,az+q*dz)<1.25){r.speed*=.72;r.fx.wobble=.8;this.emit({type:'snowimpact',r});hit=true;break;}
        }
        if(!hit&&s.life>0&&s.z>0&&s.z<this.L&&Math.abs(s.x)<this.track.widthAt(s.z)+5)keep.push(s);
        continue;
      }
      if (s.drop != null) { s.drop -= dt; s.h = Math.max(0, s.drop * 14); if (s.drop <= 0) { if(s.target.progress()>s.from.progress())this.applyHit(s.target, s.kind, s.from); continue; } keep.push(s); continue; }
      s.life -= dt; if (s.life <= 0) { this.emit({ type: 'fizzle', s }); continue; }
      const spd = 95 + (s.target ? s.target.speed : 0);
      const previous=s.prog;s.prog += spd * dt;
      const rock=this.rocks.find(k=>k.until>this.time&&k.owner!==s.from&&k.lap===Math.floor(previous/this.L)&&Math.abs(k.x-s.x)<2.5&&k.lap*this.L+k.z>=previous-1&&k.lap*this.L+k.z<=s.prog+1);
      if(rock){rock.until=0;this.explosions.push({z:rock.z,x:rock.x,lap:rock.lap,at:this.time});this.emit({type:'explode',s});continue;}

      if (s.target) {
        if (s.target.state === 'lift' || s.target.state === 'done') { this.emit({ type: 'fizzle', s }); continue; }
        s.x += (s.target.x - s.x) * Math.min(1, 6 * dt);
        if(this.time<(s.armedAt||0))s.prog=Math.min(s.prog,s.target.progress()-3);
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
      r, rank: r.rank, name: r.def.name, time: r.finishTime, estimated: !!r.estimated, coins: SK.raceGold?SK.raceGold(r,0).coins:r.coinsTotal, tricks: r.tricksCount, tricksCoins: r.tricksCoins,
      prize: SK.raceGold?SK.raceGold(r,this.mode==='time'?0:(SK.PRIZES[r.rank]||0)).prize:this.mode === 'time' ? 0 : (SK.PRIZES[r.rank] || 0), stats: r.stats, lapTimes: r.lapTimes,
    }));
  };
})(window.SK);
