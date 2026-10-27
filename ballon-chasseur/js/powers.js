// Les quinze pouvoirs (BC.POWERS) : bouton V. Pouvoir instantané : effet immédiat. Pouvoir de lancer : s'arme (l'icône
// scintille) et transforme le prochain lancer. Pouvoir passif (Fantôme) : se déclenche tout seul. Après usage, il faut
// des attrapés de l'équipe pour recharger (p.power.charge / p.power.max). Méthodes ajoutées à BC.Game.
(function (BC) {
  'use strict';
  const C = BC.COURT, G = BC.GRAVITY, CHEST = BC.CHEST, HITTABLE = BC.HITTABLE;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const P = BC.Game.prototype;

  P.powerReady = function (p) { return p.alive && (p.zone === 'in'||['goblin','skeleton','lizard'].includes(p.def.monster)) && !!p.power.id && p.power.kind !== 'passive' && p.power.charge >= p.power.max && !p.power.armed; };
  P.consumePower = function (p) {
    const def = BC.POWERS[p.power.id]; p.power.armed = false; p.power.charge = 0; this.stats[p.team].supers++;
    this.say(def.icon + ' ' + def.name + ' !', 1.1, p.def.name); this.emit('power', { p, power: p.power.id });
  };

  // ---------- Bouton V ----------
  P.usePower = function (p) {
    const pw = p.power, def = BC.POWERS[pw.id];
    if (!def || (p.zone !== 'in'&&!['goblin','skeleton','lizard'].includes(p.def.monster)) || !p.alive || def.kind === 'passive' || pw.armed) return false;
    if (!(p.state === 'idle' || p.state === 'jump')) return false;
    if (pw.charge < pw.max) { this.emit('bad', { p }); this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 60, text: 'PAS PRÊT', color: '#ff8a7a', t: 0, dur: 0.6 }); return false; }
    if (def.kind === 'throw') {
      pw.armed = true; this.emit('arm', { p });
      this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 60, text: def.icon + ' ARMÉ', color: def.color, t: 0, dur: 0.8 });
      if (p.hasBall && p.state === 'idle' && (pw.id === 'teleport' || pw.id === 'tornade')) this.powerThrowStart(p, p.lastMove);
      return true;
    }
    if (!this.powerInstant(p, pw.id)) { this.emit('bad', { p }); this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 60, text: 'PAS MAINTENANT', color: '#ff8a7a', t: 0, dur: 0.6 }); return false; }
    this.consumePower(p);
    return true;
  };
  // Pouvoirs instantanés. Renvoie false si le pouvoir n'a aucun sens à ce moment (il n'est alors pas dépensé).
  P.powerInstant = function (p, id) {
    const foes = this.opponentsOf(p), fwd = p.team === 0 ? 1 : -1, b = this.ball;
    switch (id) {
      case 'priere': {
        const allies=this.players.filter(q=>q.team===p.team&&q.alive&&q.hp<q.maxHp);
        if(!allies.length)return false;
        for(const q of allies){const gain=Math.min(q.maxHp-q.hp,Math.ceil(q.maxHp*.5));q.hp+=gain;
          this.fx.push({kind:'pow',x:q.x,y:q.y,z:q.z+55,text:'♥ +'+gain,color:'#b8ffb1',t:0,dur:1.8});
          this.fx.push({kind:'spark',x:q.x,y:q.y,z:q.z+25,color:'#fff1a8',t:0,dur:1.2});}
        this.fx.push({kind:'pow',x:p.x,y:p.y,z:p.z+80,text:'🙏 PRIÈRE',color:'#fff0b0',t:0,dur:1.8});
        return true;
      }
      case 'icepatch': {
        this.icePatches=this.icePatches||[];const left=p.team===0?C.mid:C.left;
        for(let i=0;i<6;i++){let patch;for(let attempt=0;attempt<30;attempt++){patch={team:1-p.team,x:left+rnd(65,C.mid-C.left-65),y:rnd(C.top+48,C.bottom-48),rx:rnd(43,64),ry:rnd(28,40),left:15};if(!this.icePatches.some(q=>q.team===patch.team&&Math.hypot(q.x-patch.x,(q.y-patch.y)*1.4)<95))break;}this.icePatches.push(patch);}
        return true;
      }
      case 'laser': {                                   // Mickael : tout le monde en face est figé par l'électricité
        if (!foes.length) return false;
        const foeBack = p.team === 0 ? C.right + 60 : C.left - 60;
        this.fx.push({ kind: 'laser', x: p.x + fwd * 16, x2: foeBack, lines: foes.map(f => f.y), y: p.y, z: p.z + 42, t: 0, dur: 0.7 });
        for (const f of foes) this.stunPlayer(f, 2.5);
        this.flash = 0.5; this.shake = 6; return true;
      }
      case 'pikachu': {                                 // Adam : un éclair électrise tous les adversaires
        if (!foes.length) return false;
        for (const f of foes) { this.fx.push({ kind: 'bolt', x: f.x, y: f.y, z: f.z, t: 0, dur: 0.5 }); this.hurt(f, 5, { from: p, dir: fwd, knock: 150, power: 'pikachu' }); }
        this.flash = 0.7; this.shake = 8; return true;
      }
      case 'bulles': {                                  // Marie : une nuée de bulles traverse le terrain
        for (let i = 0; i < 9; i++) this.projectiles.push({ kind: 'bubble', team: p.team, x: p.x + fwd * (10 + i * 6), y: clamp(p.y + rnd(-120, 120), C.top + 10, C.bottom - 10), z: rnd(14, 40), vx: fwd * rnd(230, 380), vy: rnd(-120, 120), t: 0, dur: 3.4, r: 15 + rnd(0, 6), ph: rnd(0, 6) });
        return true;
      }
      case 'hex':
        for (const f of foes) { f.fx.slowT = Math.max(f.fx.slowT, 6); this.fx.push({kind:'pow',x:f.x,y:f.y,z:f.z+50,text:'MAUDIT !',color:'#cb95fa',t:0,dur:.8}); }
        return foes.length > 0;
      case 'venom':
        for (const f of foes) { f.fx.slowT = Math.max(f.fx.slowT, 3); this.hurt(f,3,{from:p,dir:fwd,knock:70,power:'venom'}); this.spark(f.x,f.y,f.z+20,'#a5e34c'); }
        return foes.length > 0;
      case 'screech': case 'rootcry':
        for (const f of foes) { this.stunPlayer(f,id==='rootcry'?1.8:.9); this.fx.push({kind:'pow',x:f.x,y:f.y,z:f.z+50,text:'ÉTOURDI !',color:'#d3e77b',t:0,dur:.8}); }
        this.shake=5; return foes.length > 0;
      case 'zoom': p.fx.fastT = 10; return true;        // Milo : court super vite 10 s
      case 'aimant': {                                  // Jessica : la balle vient toute seule vers elle
        if (b.state === 'magnet' || (b.holder && b.holder.team === p.team) || (b.state === 'live' && b.team === p.team) || (b.state === 'pass' && b.team === p.team)) return false;
        if (b.holder) { b.holder.hasBall = false; this.fx.push({ kind: 'pow', x: b.holder.x, y: b.holder.y, z: b.holder.z + 50, text: 'VOLÉE !', color: '#f8f', t: 0, dur: 0.8 }); }
        b.holder = null; b.state = 'magnet'; b.magnetTo = p; b.t = 0; b.power = null; b.vx = b.vy = b.vz = 0; p.fx.magnetT = 1.8;
        return true;
      }
      case 'cri': {                                     // Josué : toute l'équipe frappe plus fort 30 s
        for (const q of this.players) if (q.team === p.team && q.alive) q.fx.rageT = 30;
        this.shake = 6; return true;
      }
      case 'blizzard': {                                // Émily : l'équipe adverse est ralentie 15 s
        for (const q of this.players) if (q.team !== p.team) q.fx.slowT = 15;
        this.blizzard[1 - p.team] = 15; return true;
      }
    }
    return false;
  };
  P.stunPlayer = function (p, dur) {
    if (!p.alive || p.state === 'ko' || p.state === 'bubble') return;
    if (p.tele) this.teleReturn(p);
    this.setState(p, 'stun'); p.fx.stunT = dur; this.stopDash(p); p.charging = false; p.pending = null;
  };

  // ---------- Pouvoirs de lancer ----------
  // X avec un pouvoir armé et la balle : certains pouvoirs ont leur propre séquence avant le lancer.
  P.powerThrowStart = function (p, move) {
    const id = p.power.id, dir = p.team === 0 ? 1 : -1;
    if (id === 'teleport') {                            // Jérémie : derrière l'équipe adverse, lance dans leur dos, revient
      const foes = this.opponentsOf(p), far = foes.slice().sort((a, c) => (c.x - a.x) * dir)[0];
      p.tele = { x: p.x, y: p.y }; this.spark(p.x, p.y, p.z + 30, '#fff');
      p.x = p.team === 0 ? C.right - 50 : C.left + 50; p.y = far ? clamp(far.y + rnd(-10, 10), C.top + 10, C.bottom - 10) : (C.top + C.bottom) / 2; p.z = 0; p.vz = 0; p.facing = -dir;
      this.spark(p.x, p.y, p.z + 30, '#fff'); this.emit('teleport');
      this.startCharge(p, move, 0.45);
      return true;
    }
    if (id === 'tornade') {                             // Edison : tourne sur lui-même puis lance
      this.stopDash(p); this.setState(p, 'spin'); p.fx.spinT = 0.6; p.pending = { move, tornade: true }; p.charge = 0.5;
      return true;
    }
    return false;
  };
  // La balle part avec un pouvoir armé : on la transforme.
  P.powerThrow = function (p, b, o) {
    const id = p.power.id, dir = Math.sign(b.vx) || this.fwdOf(p);
    this.consumePower(p); b.power = id;
    switch (id) {
      case 'locusts':
        for(let i=0;i<20;i++)this.projectiles.push({kind:'locust',team:p.team,from:p,x:b.x-dir*(i%5)*24,y:b.y,laneY:C.top+18+(i*73%(C.bottom-C.top-36)),z:4,vx:dir*(170+i%4*22),t:0,dur:8,hit:new Set()});
        break;
      case 'blindness': this.blindness=this.blindness||[0,0];this.blindness[1-p.team]=10;break;
      case 'bossmeteor': b.dmg+=8;b.speed*=1.25;b.r=b.r0;break;
      case 'bossstorm': b.speed*=1.5;b.vx*=1.25;b.vy*=1.25;b.dmg+=3;break;
      case 'bossshadow': b.speed*=1.15;b.dmg+=4;break;
      case 'triche': b.dmg = Math.max(2, Math.round(b.dmg * 0.6)); b.speed *= 1.1; b.vx = dir * b.speed * 0.8; b.vy = 0; b.airShot = false; break;
      case 'biscuit': b.speed *= 1.05; break;
      case 'boulet': b.speed *= 0.8; b.vx *= 0.8; b.vy *= 0.8; b.dmg = Math.round(b.dmg * 1.8) + 4; break;
      case 'teleport': b.dmg += 2; b.speed *= 1.15; break;
      case 'tornade': b.z = CHEST; b.vz = 420; b.vx = dir * 300; b.vy = rnd(-120, 120); b.bounces = 0; b.dmg = Math.max(3, Math.round(b.dmg * 0.8)); b.airShot = false; break;
      case 'fusee': b.speed *= 1.1; b.vx = dir * b.speed * 0.5; b.vy *= 0.5; b.dmg += 2; break;
      case 'licorne': b.speed *= 1.6; b.vx = dir * b.speed * 0.9; b.vy = 0; b.dmg += 2; b.airShot = false; b.z = CHEST + (p.z || 0); p.fx.horseT = 1.6; break;
    }
  };
  // Balle spéciale gérée image par image. Renvoie true si tout est fait ici (déplacement, contact, fin).
  P.powerLive = function (b, dt) {
    const dir = Math.sign(b.vx) || 1, foes = this.aliveInner(1 - b.team);
    if(b.power==='bossmeteor')b.r=b.r0;
    if(b.power==='bossshadow')b.vy+=Math.cos(b.t*16)*280*dt;
    if (b.power === 'boulet') b.r = b.r0;
    if (b.power === 'triche') {                         // Matthieu : la balle suit sa cible, personne ne peut l'attraper ni sauter par-dessus
      let tg = b.target && b.target.alive ? b.target : foes.slice().sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0];
      if (!tg || b.t > 4) { this.kill(b, 0.3); return true; }
      b.target = tg;
      const dT = Math.sign(tg.x - b.x) || dir;
      b.vx = dT * Math.min(b.speed * 1.25, Math.abs(b.vx) + b.speed * 1.5 * dt);
      b.vy = clamp((tg.y - b.y) * 10, -700, 700);
      b.z += (tg.z + this.heightOf(tg) * 0.5 - b.z) * Math.min(1, dt * 8);
      b.x += b.vx * dt; b.y += b.vy * dt; b.y = clamp(b.y, C.top + 4, C.bottom - 4);
      b.trail.push({ x: b.x, y: b.y, z: b.z }); if (b.trail.length > 10) b.trail.shift();
      if (Math.random() < 0.5) this.fx.push({ kind: 'glitch', x: b.x + rnd(-14, 14), y: b.y + rnd(-6, 6), z: b.z + rnd(-10, 10), t: 0, dur: 0.3 });
      if (HITTABLE[tg.state] && tg.fx.ghostT <= 0 && Math.abs(tg.x - b.x) < 16 + b.r && Math.abs(tg.y - b.y) < 18 + b.r) { b.z = tg.z + this.heightOf(tg) * 0.5; this.contact(tg, b); }
      return true;
    }
    if (b.power === 'tornade') {                        // Edison : rebondit cinq fois dans le camp adverse en frappant tout ce qu'elle touche
      b.vz -= G * dt; b.z += b.vz * dt;
      if (b.z <= 0) {
        b.z = 0; b.bounces++; this.emit('bounce'); this.fx.push({ kind: 'dust', x: b.x, y: b.y, z: 0, t: 0, dur: 0.4 });
        if (b.bounces >= 5) { this.kill(b, 0.3); return true; }
        b.vz = 420; b.vy = rnd(-240, 240);
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.y = clamp(b.y, C.top + 6, C.bottom - 6);
      const lo = b.team === 0 ? C.mid + 20 : C.left + 20, hi = b.team === 0 ? C.right - 20 : C.mid - 20;
      if (b.x < lo) { b.x = lo; b.vx = Math.abs(b.vx); } if (b.x > hi) { b.x = hi; b.vx = -Math.abs(b.vx); }
      if (Math.random() < 0.6) this.fx.push({ kind: 'wind', x: b.x + rnd(-16, 16), y: b.y + rnd(-6, 6), z: b.z + rnd(0, 30), t: 0, dur: 0.4 });
      for (const q of foes) {
        if (!HITTABLE[q.state] || q.fx.ghostT > 0 || (b.hitCd.get(q) || -1) > b.t) continue;
        const h = this.heightOf(q);
        if (Math.abs(q.x - b.x) < 16 + b.r && Math.abs(q.y - b.y) < 18 + b.r && b.z + b.r > q.z && b.z - b.r < q.z + h) { this.contact(q, b); if (b.state !== 'live') return true; }
      }
      return true;
    }
    return false;
  };
  // Après un touché par une balle spéciale.
  P.powerAfterHit = function (p, b, dmg) {
    const from = b.thrower, foes = this.aliveInner(1 - b.team).filter(q => q !== p);
    if (b.power === 'biscuit') {                        // Josée : des biscuits partent dans tous les sens et frappent tout le monde
      this.say('BISCUITS !', 0.9);
      for (let i = 0; i < 10; i++) this.fx.push({ kind: 'crumb', x: b.x, y: b.y, z: b.z, vx: rnd(-260, 260), vy: rnd(-120, 120), vz: rnd(120, 360), t: 0, dur: 0.9 });
      for (const q of foes) this.projectiles.push({ kind: 'cookie', team: b.team, x0: b.x, y0: b.y, z0: b.z, x: b.x, y: b.y, z: b.z, target: q, from, dmg: Math.ceil(dmg / 2), t: 0, dur: 0.45 });
    }
    if (b.power === 'fusee') {                          // Zachary : petite explosion autour de l'impact
      this.fx.push({ kind: 'explosion', x: b.x, y: b.y, z: b.z, r: 90, t: 0, dur: 0.5 }); this.shake = 12;
      for (const q of foes) if (Math.hypot(q.x - p.x, q.y - p.y) < 100) this.hurt(q, Math.ceil(dmg / 2), { from, dir: Math.sign(q.x - p.x) || 1, knock: 250, power: 'fusee' });
    }
  };
  // La fusée attrapée explose dans les mains.
  P.powerExplode = function (p, b) {
    const from = b.thrower, dmg = Math.round(b.dmg * 1.5);
    this.say('BOUM !', 1); this.fx.push({ kind: 'explosion', x: p.x, y: p.y, z: p.z + 30, r: 140, t: 0, dur: 0.6 }); this.shake = 16; this.flash = 0.6;
    this.emit('explode', { p });
    b.state = 'dead'; b.power = null; b.vx = rnd(-200, 200); b.vy = rnd(-100, 100); b.vz = 300;
    this.hurt(p, dmg, { from, dir: Math.sign(b.vx) || 1, knock: 600, power: 'fusee' });
    for (const q of this.aliveInner(p.team)) if (q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 140) this.hurt(q, Math.ceil(dmg / 2), { from, dir: Math.sign(q.x - p.x) || 1, knock: 300, power: 'fusee' });
    this.retargetAll();
  };
  P.powerKeepsBall = function (b, p) { if (b.power === 'tornade' && b.state === 'live' && b.bounces < 5) { b.hitCd.set(p, b.t + 0.6); return true; } return false; };
  // Fantôme (Eliott) : pouvoir passif, absorbe un coup quand il est chargé.
  P.powerGuard = function (p, dmg, o) {
    if (p.power.id !== 'fantome' || p.power.charge < p.power.max || p.state === 'bubble') return false;
    p.power.charge = 0; p.fx.ghostT = 1.4; this.stats[p.team].supers++;
    this.say('👻 FANTÔME !', 1, p.def.name); this.emit('ghost', { p });
    this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 50, text: 'RATÉ', color: '#ccf', t: 0, dur: 0.8 });
    return true;
  };
  P.teleReturn = function (p) {
    if (!p.tele) return;
    this.spark(p.x, p.y, p.z + 30, '#fff'); p.x = p.tele.x; p.y = p.tele.y; p.tele = null; p.facing = p.team === 0 ? 1 : -1; p.z = 0; p.vz = 0;
    this.spark(p.x, p.y, 30, '#fff'); this.emit('teleport');
  };

  // La bulle déloge le ballon vers l'adversaire extérieur au fond du camp.
  P.bubbleDrop = function (p) {
    const b = this.ball;
    if (b.holder !== p) return;
    const back = this.outer(1 - p.team).find(q => q.lane === 'back' && q.alive);
    const x = back ? back.x : (p.team === 0 ? C.left - BC.LANE : C.right + BC.LANE);
    const y = back ? back.y : p.y;
    const T = clamp(Math.hypot(x - p.x, y - p.y) / 480, 0.5, 1.1);
    p.hasBall = false;
    Object.assign(b, { holder: null, state: 'dead', team: -1, thrower: null, target: null, magnetTo: null,
      power: null, dmg: 0, smash: false, airShot: false, t: 0, trail: [], alpha: 1, visible: true, r: b.r0,
      x: p.x, y: p.y, z: p.z + CHEST, vx: (x - p.x) / T, vy: (y - p.y) / T });
    b.vz = 0.5 * G * T - b.z / T;
    this.fx.push({ kind: 'pow', x: p.x, y: p.y, z: p.z + 35, text: 'BALLON LÂCHÉ !', color: '#ffd166', t: 0, dur: 0.8 });
    this.retargetAll();
  };

  P.ignite=function(p,from){p.burn={left:4,tick:1,from};};
  P.updateGoblinEffects=function(dt){
    this.icePatches=(this.icePatches||[]).filter(q=>(q.left-=dt)>0);
    if(this.blindness)this.blindness=this.blindness.map(t=>Math.max(0,t-dt));
    for(const p of this.players){if(!p.alive){p.burn=null;continue;}if(p.burn){const burn=p.burn;burn.left-=dt;burn.tick-=dt;if(burn.tick<=.000001){burn.tick+=1;this.hurt(p,1,{from:burn.from,power:'fireball',dot:true});}if(burn.left<=.000001)p.burn=null;}}
  };
  P.iceAt=function(p){return p.z<2&&(this.icePatches||[]).find(q=>q.team===p.team&&((p.x-q.x)/q.rx)**2+((p.y-q.y)/q.ry)**2<1);};
  P.onIce=function(p){return !!this.iceAt(p);};
  P.iceDrop=function(p){const b=this.ball;if(b.holder!==p)return;p.hasBall=false;p.pending=null;p.charging=false;p.charge=0;this.stopDash(p);this.setState(p,'down');Object.assign(b,{holder:null,state:'dead',x:p.x,y:p.y,z:18,vx:(p.mx||p.facing*100)*1.3,vy:p.my||60,vz:180,power:null,combo:0,perfect:false});this.say('ÇA GLISSE !',.8,p.def.name);this.retargetAll();};
  // ---------- Projectiles : bulles de Marie, biscuits de Josée ----------
  P.updateProjectiles = function (dt) {
    const keep = [];
    for (const q of this.projectiles) {
      q.t += dt;
      if(q.kind==='locust'){
        q.x+=q.vx*dt;if(q.laneY!=null)q.y+=(q.laneY-q.y)*Math.min(1,dt*4);q.z=4+Math.abs(Math.sin(q.t*13))*5;
        for(const f of this.aliveInner(1-q.team))if(!q.hit.has(f)&&f.z<16&&Math.abs(f.x-q.x)<22&&Math.abs(f.y-q.y)<18){q.hit.add(f);this.hurt(f,1,{from:q.from,power:'locusts',dot:true});}
        if(q.t<q.dur&&q.x>C.left-90&&q.x<C.right+90)keep.push(q);
      }else if (q.kind === 'bubble') {
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += Math.sin(q.t * 5 + q.ph) * 14 * dt;
        const fwd = q.team === 0 ? 1 : -1, out = fwd > 0 ? q.x > C.right - 10 : q.x < C.left + 10;
        if (q.t > q.dur || out || q.y < C.top - 20 || q.y > C.bottom + 20) { this.fx.push({ kind: 'pop', x: q.x, y: q.y, z: q.z, t: 0, dur: 0.3 }); continue; }
        let hit = null;
        for (const f of this.aliveInner(1 - q.team)) {
          if (!(f.state === 'idle' || f.state === 'jump' || f.state === 'catch' || f.state === 'windup' || f.state === 'throw' || f.state === 'pickup' || f.state === 'stun')) continue;
          if (Math.abs(f.x - q.x) < 16 + q.r && Math.abs(f.y - q.y) < 16 + q.r && q.z < f.z + this.heightOf(f) + 10) { hit = f; break; }
        }
        if (hit) {
          if (hit.tele) this.teleReturn(hit);
          this.setState(hit, 'bubble'); hit.fx.bubbleT = 3; hit.fx.stunT = 0; this.stopDash(hit); hit.charging = false; hit.pending = null; hit.vz = 0;
          this.bubbleDrop(hit);
          this.fx.push({ kind: 'pow', x: hit.x, y: hit.y, z: hit.z + 55, text: 'DANS LA BULLE', color: '#8cf', t: 0, dur: 0.8 }); this.emit('bubble', { p: hit });
          continue;
        }
        keep.push(q);
      } else if (q.kind === 'cookie') {
        const tg = q.target, k = Math.min(1, q.t / q.dur);
        if (!tg.alive) continue;
        q.x = q.x0 + (tg.x - q.x0) * k; q.y = q.y0 + (tg.y - q.y0) * k; q.z = q.z0 + (tg.z + 30 - q.z0) * k + Math.sin(k * Math.PI) * 90;
        if (k >= 1) { this.hurt(tg, q.dmg, { from: q.from, dir: Math.sign(tg.x - q.x0) || 1, knock: 200, power: 'biscuit' }); this.fx.push({ kind: 'burst', x: tg.x, y: tg.y, z: tg.z + 30, t: 0, dur: 0.3 }); continue; }
        keep.push(q);
      }
    }
    this.projectiles = keep;
  };
})(window.BC);
