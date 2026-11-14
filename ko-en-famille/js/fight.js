// K.O. en Famille — moteur de combat : contrôles, IA des adversaires, coups, défenses, étoiles, chutes, rounds, rendu.
(function (root) {
  'use strict';
  const BX = root.BX, A = BX.art, AU = BX.audio;
  const F = BX.fight = {};
  const lerp = A.lerp, clamp = A.clamp;
  const rand = (a, b) => a + Math.random() * (b - a);
  const W = 1280, H = 720, OX = 640, OY = 612, OK = .86;
  const CLOCK_SPEED = 2;          // 3:00 de combat = 90 s réelles
  let S = null;
  const K = { up: false, down: false, left: false, right: false };

  // ---------- Statistiques → réglages du joueur ----------
  F.derive = function (st, mods) {
    const e = x => 2.5 + clamp(x || 1, 1, 20) * .75, f = e(st.force), v = e(st.vitesse), s = e(st.stamina), m = mods || {};
    return {
      dmg: (.6 + f * .09) * (1 + (m.dmg || 0)), pStart: .11 - v * .005, pDur: Math.max(.15, .42 - v * .02), dodge: .8 * (.62 - v * .018) * (1 - (m.dodge || 0)), upWind: Math.max(.18, .46 - v * .02),
      hearts: Math.round((12 + s * 2) * (1 + (m.hearts || 0))), hp: Math.round(100*(1+(m.hp||0))), def: (1.2 - (Math.min(s,10)+(Math.max(0,s-10)*.4)) * .05) * (1 - .05 * (clamp(st.defense || 1, 1, 10) - 1) - .02 * (clamp(st.defense || 1, 10, 20) - 10)) * (1 - (m.def || 0)), mash: Math.max(5, 13 - s * .6), heal: .12 + s * .025 + (m.heal || 0), regen: Math.max(.35, 1.9 - s * .1), breath: .6 + (st.souffle || 1) * .3,
    };
  };
  // Un buffer de commandes volontairement strict, indépendant des coups ordinaires.
  function commandInput(action){
    const p=S.p;if(!S.combos.length)return null;
    if(!['idle','block','punch','upper','dodge','duck'].includes(p.st)||p.tired){p.commands=[];return null;}
    const token=BX.commandToken(action,K.up),history=p.commands||(p.commands=[]);
    if(history.length&&S.time-history.at(-1).t>BX.COMMAND_GAP)history.length=0;
    history.push({token,t:S.time});if(history.length>8)history.shift();
    p.commandProgress=null;
    for(const cb of S.combos){if(cb.charge)continue;
      for(let n=Math.min(cb.seq.length,history.length);n>0;n--){
        const tail=history.slice(-n);if(S.time-tail[0].t>BX.COMMAND_TIME)continue;
        if(!tail.every((v,i)=>v.token===cb.seq[i]))continue;
        if(n===cb.seq.length){p.commands=[];p.commandProgress=null;return cb;}
        if(!p.commandProgress||n>p.commandProgress.count)p.commandProgress={name:cb.name,count:n,total:cb.seq.length};
        break;
      }
    }
    return null;
  }
  function startSpecial(cb){
    const p=S.p;
    const cost=BX.specialCost(p.maxHearts);
    if(p.hearts<cost){msg('FINISHER : '+cost+' STAMINA NÉCESSAIRES',{size:28,col:'#ffb28c',dur:1,y:580});return;}
    p.hearts-=cost;p.specialHits=0;p.combo=cb;p.comboVisual=cb.element;p.specialUpper=!!cb.upper;
    p.st='special';p.t=0;p.dur=BX.SPECIAL_DURATION;p.specialContact=p.dur*(BX.SPECIAL_LEAD+(1-BX.SPECIAL_LEAD)*.53);p.side=cb.seq.at(-1).endsWith('L')?'L':'R';p.high=true;
    p.upStars=0;p.buf=null;p.landed=false;p.hist=[];S.stats.thrown++;
    msg(cb.name.toUpperCase()+' !',{size:48,col:'#ffe29c',dur:1.2,y:180});AU.play('upper');
  }

  // ---------- Démarrage ----------
  F.start = function (cfg) {
    const b = cfg.boxer, P = F.derive(cfg.stats, cfg.mods);
    S = {
      cfg, b, P, time: 0, phase: 'intro', phT: 0, round: 1, clock: 180, slow: 0, hitStop: 0, lastHit: null, ended: false, firstFight: !!cfg.firstFight,
      p: { hist: [], combo: null, hp: P.hp, maxHp: P.hp, hearts: P.hearts, maxHearts: P.hearts, stars: Math.min(3, (cfg.mods && cfg.mods.stars) || 0), st: 'idle', t: 0, dur: 1, side: 'R', high: false, dir: 0, kd: 0, kdRound: 0, tired: false, tiredT: 0, mash: 0, need: 0, rise: 0, riseTarget: 0, hitSide: 1, landed: false, buf: null, lastDown: -9, dmgDealt: 0, tie: 0, upStars: 0, wind: .4 },
      o: { hp: b.hp, maxHp: b.hp, st: 'intro', t: 0, dur: 1, move: null, moveId: null, queue: [], nextIn: 1.2, guard: 'high', guardT: 2, kd: 0, kdRound: 0, combo: 0, blocks: 0, react: null, bubble: null, rage: false, phase2: false, resolved: false, moveCount: 0, dmgDealt: 0, lie: false, lieDone: false, lieRed: 0, glint: 0, glinted: false, fallSide: 1, noCape: false, counterReady: false, avoided: false, firstFree: true, blockFlash: 0, lastSpecial: null },
      fx: { dark: 0, blind: 0, snow: 0, fog: 0, aurora: 0, sticky: 0, flash: 0, shake: 0, red: 0, impact: 0 },
      msgs: [], parts: [], proj: null, count: null, crowdLine: null, nextCrowd: 6, crowdCooldown: 0, crowdLast: '', stats: { stars: 0, counters: 0, dodges: 0, landed: 0, thrown: 0, blocks: 0 }, result: null, help: cfg.firstFight ? 14 : 6,
    };
    S.arenaKey = null;
    S.combos = (cfg.combos || []).map(id => BX.COMBOS.find(c => c.id === id)).filter(c=>c&&!c.charge).sort((a, b) => b.seq.length - a.seq.length);
    AU.crowd(1);
    msg('ROUND 1', { size: 96, dur: 1.6, col: '#ffd54f' });
    AU.say('Round un !', { interrupt: true });
    return S;
  };
  F.state = () => S;
  F.stop = () => { S = null; AU.crowd(0); };
  F.paused = false;
  F.setPaused = v => { F.paused = !!v;if(F.paused)F.clearKeys(); AU.musicPaused(F.paused); };

  // Le sparring utilise le joueur du vrai moteur, dans une session isolée du match.
  function inPractice(session, action) {
    const previous=S, paused=F.paused, keys={...K};S=session;F.paused=false;Object.assign(K,session.practiceKeys||{});
    try{return action();}finally{session.practiceKeys={...K};S=previous;F.paused=paused;Object.assign(K,keys);}
  }
  F.practice={
    create(cfg){const previous=S;try{const session=F.start({...cfg,training:true});session.phase='fight';session.practiceKeys={up:false,down:false,left:false,right:false};session.o.hp=session.o.maxHp=1000000;return session;}finally{S=previous;}},
    key(session,e,down){return inPractice(session,()=>down?F.keydown(e):F.keyup(e));},
    defense(session){return inPractice(session,()=>defState());},
    clear(session){return inPractice(session,()=>F.clearKeys());},
    step(session,dt){return inPractice(session,()=>{S.time+=dt;updatePlayer(dt);S.msgs=S.msgs.filter(m=>(m.t+=dt)<m.dur);S.parts=[];});},
    attack(session,move){return inPractice(session,()=>{S.o.move=move;const hp=S.p.hp;resolveAttack();return S.p.hp===hp;});}
  };

  // ---------- Entrées ----------
  const KEYMAP = BX.BOXING_KEYS;
  F.keyAction = code => KEYMAP[code];
  F.keydown = function (e) {
    const a = KEYMAP[e.code]; if (!a) return false;
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') K[a] = true;
    if (!e.repeat) F.press(a);
    return true;
  };
  F.keyup = function (e) { const a = KEYMAP[e.code]; if(S?.p.st==='charge'&&S.p.chargeKey===a)releasePower(); if (a && a in K) K[a] = false; };
  F.setHeld = (a, v) => { K[a] = v; };
  F.clearKeys = () => { for (const k in K) K[k] = false;if(S){S.p.dodgeBuffer=null;S.p.commands=[];S.p.commandProgress=null;if(S.p.st==='charge'){S.p.st='idle';S.p.power=0;S.p.chargeKey=null;}} };

  // Manette (sondée à chaque image)
  const padPrev = {};
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && [...pads].find(p => p && p.connected); if (!gp) return;
    const bt = i => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes || [];
    const now = {
      left: bt(14) || ax[0] < -.55, right: bt(15) || ax[0] > .55, up: bt(12) || ax[1] < -.55, down: bt(13) || ax[1] > .55,
      pL: bt(2) || bt(4), pR: bt(0) || bt(5) || bt(1), upper: bt(3) || bt(7), pause: bt(9),
    };
    for (const k of ['left', 'right', 'up', 'down']) { if (now[k] !== padPrev[k]) K[k] = now[k]; }
    for (const k in now) { if(!now[k]&&padPrev[k]&&S?.p.st==='charge'&&S.p.chargeKey===k)releasePower(); if (now[k] && !padPrev[k]) { if (k === 'pause') F.onPause && F.onPause(); else F.press(k); } padPrev[k] = now[k]; }
  }

  F.press = function (a, buffered=false, aim=null) {
    if(S?.finisher)return;
    if (!S || F.paused) return;
    const p = S.p, P = S.P;
    if (S.phase === 'count' && S.count && S.count.who === 'p' && (a === 'pL' || a === 'pR' || a === 'upper')) {
      if (S.count.done || S.count.tko || p.st !== 'down') return;
      p.mash = Math.min(p.need, p.mash + 1); p.riseTarget = .88 * p.mash / Math.max(1, p.need);
      p.rise += (p.riseTarget - p.rise) * .35;
      p.recoverySide = a === 'pR' ? 'R' : 'L'; p.recoveryAt = S.time;
      AU.play('tick'); burst(640, 670 - p.rise * 135, '#ffeb3b', 3); return;
    }
    if (S.phase !== 'fight') return;
    // « ARRÊT ! » : le moindre geste et c’est la contravention, tout de suite.
    if (S.o.st === 'stop' && ['left', 'right', 'down', 'pL', 'pR', 'upper'].includes(a)) punishStop();
    if (p.tie > 0 && (a === 'pL' || a === 'pR' || a === 'upper')) { p.tie--; AU.play('tied'); if (p.tie <= 0) msg('Libéré !', { size: 46, col: '#f48fb1', dur: .8 }); return; }
    if(!buffered){const special=commandInput(a);if(special){startSpecial(special);return;}}
    const free = p.st === 'idle' || p.st === 'block';
    if (!free && (p.st === 'dodge' || p.st === 'duck') && p.t >= p.dur * .5 && ['pL','pR','upper'].includes(a)) {
      // Une frappe pendant le retour part à la fin du mouvement, avec la hauteur choisie.
      p.dodgeBuffer = { action: a, up: K.up, down: K.down }; return;
    }
    if (!free) { if ((p.st === 'punch' && p.t > p.dur * .5) && (a === 'pL' || a === 'pR')) p.buf = a; return; }
    if (a === 'left' || a === 'right') { p.st = 'dodge'; p.dir = a === 'left' ? -1 : 1; p.t = 0; p.dur = P.dodge * (S.fx.sticky > 0 ? 1.45 : 1); AU.play('whoosh'); return; }
    if (a === 'down') {
      if (S.time - p.lastDown < .3) { p.st = 'duck'; p.t = 0; p.dur = P.dodge * 1.05 * (S.fx.sticky > 0 ? 1.45 : 1); AU.play('whoosh'); p.lastDown = -9; }
      else { p.st = 'block'; p.t = 0; p.lastDown = S.time; }
      return;
    }
    if (a === 'pL' || a === 'pR') {
      if (p.tired) { msg('Épuisé ! Esquive pour reprendre ton souffle', { size: 30, col: '#f48fb1', dur: .9, y: 610 }); return; }
      const side = a === 'pL' ? 'L' : 'R', high = aim ? aim.up : K.up;
      p.combo = null; p.comboVisual = null; p.side = side; p.high = high; p.zone = high ? 'head' : (aim ? aim.down : K.down) ? 'low' : 'mid'; p.t = 0; p.landed = false; S.stats.thrown++;
      p.power=0;
      if(!buffered&&(S.cfg.combos||[]).includes('puissance')){p.st='charge';p.chargeKey=a;p.chargeT=0;return;}
      p.st = 'punch'; p.dur = P.pDur;
      prepareFinisher();return;
    }
    if (a === 'upper') {
      if (p.tired) return;
      if (p.stars <= 0) { msg('Pas d’étoile… fais des contres !', { size: 30, col: '#bbb', dur: .8, y: 610 }); return; }
      p.st = 'upper'; p.side = 'R'; p.high = true; p.t = 0; p.wind = P.upWind; p.dur = p.wind + .62; p.landed = false;
      p.combo = null; p.comboVisual = null; p.upStars = p.stars; p.stars = 0; AU.play('upper'); msg('★'.repeat(p.upStars) + ' UPPERCUT !', { size: 54, col: '#ffd54f', dur: .9, y: 600 });prepareFinisher();
    }
  };

  // ---------- Mise à jour ----------
  F.update = function (dt) {
    if (!S || F.paused) return;
    // Le coup décisif se déroule en temps réel : préparation ralentie, contact, chute.
    if(S.finisher){
      const f=S.finisher;f.elapsed+=dt;
      if(f.phase==='wind'){
        S.p.t=lerp(f.start,f.contact,A.ease(Math.min(1,f.elapsed/.62)));
        if(f.elapsed<.62)return;
        f.phase='impact';f.elapsed=0;S.p.t=f.contact;
        playerImpact(f.side,f.high,f.upper);
      }
      if(f.elapsed>=1.05){S.finisher=null;S.slow=0;}
      else dt*=.22;
    }
    // Une très brève suspension rend le contact lisible, avant le recul.
    if (S.hitStop > 0) { S.hitStop = Math.max(0, S.hitStop - dt); return; }
    pollPad();
    if (F.bot) F.bot(S, dt);
    if (S.slow > 0 && !S.finisher) { S.slow -= dt; dt *= .35; }
    S.time += dt; S.phT += dt;
    if(S.p.commands?.length&&S.time-S.p.commands.at(-1).t>BX.COMMAND_GAP){S.p.commands=[];S.p.commandProgress=null;}
    const fx = S.fx; for (const k in fx) if (fx[k] > 0) fx[k] = Math.max(0, fx[k] - dt);
    if (S.help > 0 && S.phase === 'fight') S.help -= dt;
    if(S.elementHit) {S.elementHit.t+=dt;if(S.elementHit.t>S.elementHit.dur)S.elementHit=null;}
    if(S.phase==='fight' && S.p.st!=='special'){
      for(const key of ['frost','burn','weaken','confused'])S.o[key]=Math.max(0,(S.o[key]||0)-dt);
      if(S.o.burn>0&&!['down','ko','getup'].includes(S.o.st)){
        const damage=Math.min(Math.max(0,S.o.hp-1),S.o.maxHp*.006*dt);
        S.o.hp-=damage;S.p.dmgDealt+=damage;
      }
    }
    updateParts(dt);
    S.crowdCooldown = Math.max(0, S.crowdCooldown - dt);
    if (S.crowdLine) { S.crowdLine.t += dt; if (S.crowdLine.t >= S.crowdLine.dur) S.crowdLine = null; }
    if (S.phase === 'fight') {
      S.nextCrowd -= dt;
      if (S.nextCrowd <= 0 && S.o.st === 'idle' && !S.o.bubble && !S.crowdLine && S.crowdCooldown <= 0 && S.clock > 10) {
        crowdReact(S.p.hp < S.p.maxHp * .3 ? 'support' : 'idle');
        S.nextCrowd = rand(7, 12);
      }
    }
    S.msgs.forEach(m => m.t += dt); S.msgs = S.msgs.filter(m => m.t < m.dur);
    AU.setEnergy((S.round - 1) * .2 + (1 - S.p.hp / S.p.maxHp) * .55 + (S.o.rage ? .3 : .15));
    const o = S.o; if (o.bubble) { o.bubble.t += dt; if (o.bubble.t > o.bubble.dur) o.bubble = null; }
    if (o.react) { o.react.k -= dt / .3; if (o.react.k <= 0) o.react = null; }
    o.glint = Math.max(0, o.glint - dt * 2.5); o.lieRed = Math.max(0, o.lieRed - dt); o.blockFlash = Math.max(0, o.blockFlash - dt);
    if (S.proj && S.p.st!=='special') S.proj.t += dt;
    switch (S.phase) {
      case 'intro':
        updatePlayer(dt);
        if (S.phT > 2.0) { S.phase = 'fight'; S.phT = 0; o.st = 'idle'; o.t = 0; o.nextIn = rand(.8, 1.4); AU.play('bell1'); msg('BOXE !', { size: 110, col: '#fff', dur: 1 }); AU.cheer(1.2); }
        break;
      case 'fight':
        const previousClock = S.clock;
        S.clock -= dt * CLOCK_SPEED;
        const crossed = [30, 10, 3, 2, 1].filter(n => previousClock > n && S.clock <= n);
        if (crossed.length) {
          const n = crossed[crossed.length - 1];
          msg(n <= 3 ? String(n) : n + ' SECONDES !', { size: n <= 3 ? 66 : 32, col: '#ffd580', dur: n <= 3 ? .45 : 1.2, y: 190 });
          AU.play(n > 3 ? (n === 30 ? 'time30' : 'time10') : 'countdown');
          if (n > 3) AU.say(n + ' secondes !', { interrupt: true, rate: 1.2 });
        }
        const specialActive=S.p.st==='special';updatePlayer(dt);if(!specialActive&&S.phase==='fight')updateOpp(dt);
        if (S.clock <= 0 && S.phase === 'fight') endRound();
        break;
      case 'robotReboot':
        updatePlayer(dt); o.t += dt;
        if (S.phT >= 1.8 && !o.rebootHeckled) {
          o.rebootHeckled = true;
          crowdComment('Maudite machine à laveuse !', true);
          AU.say('Maudite machine à laveuse !', { interrupt: true, pitch: 1.35, rate: 1.12 });
        }
        if (S.phT >= 3.2 && !o.rebootEyes) { o.rebootEyes = true; AU.play('beep'); S.fx.flash = .2; }
        if (S.phT >= 4 && o.st === 'ko') { o.st = 'getup'; o.t = 0; o.dur = 3; msg('REDÉMARRAGE…', { size: 42, col: '#80deea', dur: 2.6, y: 160 }); }
        if (o.st === 'getup' && o.t >= o.dur) {
          o.st = 'idle'; o.t = 0; o.hp = o.maxHp * .4; o.nextIn = 1.5; o.queue = []; o.kdRound = 0;
          S.phase = 'fight'; S.phT = 0; S.count = null; S.clock = Math.max(S.clock, 45);
          S.p.st = 'idle'; S.p.hearts = S.p.maxHearts; S.p.tired = false;
          msg('Encore une chute pour en finir !', { size: 36, col: '#ffd54f', dur: 2, y: 170 });
        }
        break;
      case 'count': updatePlayer(dt); updateCount(dt); updateOppDown(dt); break;
      case 'roundEnd':
        updatePlayer(dt);
        if (S.phT > 2.3) { if (S.round >= 3) decision(); else { S.phase = 'between'; S.phT = 0; S.cfg.onCorner && S.cfg.onCorner(cornerInfo()); } }
        break;
      case 'over':
        updatePlayer(dt); o.t += dt;
        if (S.result && S.result.win && Math.random() < .5) confetti();
        if (S.phT > 4.2 && !S.ended) { S.ended = true; AU.crowd(.4); S.cfg.onEnd && S.cfg.onEnd(S.result); }
        break;
    }
  };

  function releasePower(){
    const p=S.p;if(p.st!=='charge'||F.paused||S.phase!=='fight')return;
    const desired=clamp((p.chargeT-.18)/1.2,0,1);
    p.power=Math.min(desired,p.hearts/6);const cost=Math.ceil(p.power*6);
    p.hearts=Math.max(0,p.hearts-cost);p.st='punch';p.t=0;p.dur=S.P.pDur+.18*p.power;p.landed=false;p.chargeKey=null;
    if(p.power>.2)AU.play('whoosh');prepareFinisher();
  }
  function updatePlayer(dt) {
    const p = S.p, P = S.P;
    if (p.st !== 'dodge' && p.st !== 'duck') p.dodgeBuffer = null;
    p.t += dt;
    const backTarget = S.o.kd > 0 ? 55 : 0;
    p.backstep = lerp(p.backstep || 0, backTarget, 1 - Math.exp(-4 * dt));
    if (p.st === 'down') p.rise += (p.riseTarget - p.rise) * (1 - Math.exp(-14 * dt));
    switch (p.st) {
      case 'charge':
        p.chargeT+=dt;p.power=clamp((p.chargeT-.18)/1.2,0,1);
        if(p.chargeT>=1.5)releasePower();
        break;
      case 'special':
        while(p.specialHits<BX.SPECIAL_HITS && p.t>=p.dur*BX.SPECIAL_LEAD*(p.specialHits+.35)/BX.SPECIAL_HITS){
          const o=S.o,index=p.specialHits++,side=index%2?1:-1;
          if(!['down','ko','getup'].includes(o.st)){
            if(S.cfg.trainingTarget){const patterns={fire:[0,1,0,0,1],ice:[1,0,1,0,0],lightning:[0,0,1,0,1],wind:[1,0,1,1,0]};playerImpact(index%2?'R':'L',!!patterns[p.comboVisual][index],false);continue;}
            const patterns={fire:[0,1,0,0,1],ice:[1,0,1,0,0],lightning:[0,0,1,0,1],wind:[1,0,1,1,0]},high=!!patterns[p.comboVisual][index],guard=F.visibleGuard();
            const blocked=guard==='both'||guard===(high?'high':'low'),damage=blocked?0:Math.min(Math.max(0,o.hp-1),S.P.dmg*.7);
            o.hp-=damage;p.dmgDealt+=damage;
            o.react={kind:'head',side,k:.55};o.blockFlash=blocked?.15:0;
            burst(OX+side*35,OY-100,blocked?'#90a4ae':'#ffe6bb',7);
            AU.play(blocked?'block':'punch');S.fx.shake=.08;
          }
        }
        if(!p.landed&&p.t>=p.specialContact){p.landed=true;playerImpact(p.side,true,p.specialUpper);}
        if(p.t>=p.dur){p.st='idle';p.combo=null;p.comboVisual=null;if(p.hearts<=0&&!p.tired)tire();}
        break;
      case 'punch':
        if (!p.landed && p.t >= P.pStart) { p.landed = true; playerImpact(p.side, p.high, false); }
        if (p.t >= p.dur) { p.st = 'idle';p.power=0;if(p.hearts<=0&&!p.tired)tire(); if (p.buf) { const b = p.buf; p.buf = null; F.press(b,true); } }
        break;
      case 'upper':
        if (!p.landed && p.t >= p.wind) { p.landed = true; playerImpact(p.side || 'R', true, true); }
        if (p.t >= p.dur) p.st = 'idle';
        break;
      case 'dodge': case 'duck':
        if (p.t >= p.dur) {
          const pending = p.dodgeBuffer; p.dodgeBuffer = null;
          p.st = K.down ? 'block' : 'idle'; p.t = 0;
          if (pending) F.press(pending.action, true, pending);
        }
        break;
      case 'hit': case 'stun':
        if (p.t >= p.dur) { p.st = K.down ? 'block' : 'idle'; p.t = 0; }
        break;
      case 'block': if (!K.down) { p.st = 'idle'; p.t = 0; } break;
      case 'getup': if (p.t >= .9) { p.st = 'idle'; p.t = 0; if (S.phase === 'count') { S.phase = 'fight'; S.count = null; S.o.nextIn = 1.2; S.o.st = 'idle'; } } break;
    }
    if (p.tired && S.phase === 'fight') { p.tiredT += dt; if (p.tiredT >= P.regen) { p.tiredT = 0; p.hearts++; AU.play('heart'); if (p.hearts >= 3) { p.tired = false; msg('Deuxième souffle !', { size: 36, col: '#81c784', dur: .9, y: 610 }); } } }
  }

  // ---------- Coups du joueur ----------
  F.visibleGuard = function (o = S.o, b = S.b, time = S.time) {
    if (time < (o.surpriseUntil || 0) && o.st === 'hitstun') return 'open';
    if (o.st === 'cover') return 'both';
    if (o.st === 'idle' && o.guard === 'both') return 'both';
    const ph = { idle: 'idle', tell: 'tell', strike: 'strike', rec: 'rec', go: 'go', free: 'free', hitstun: 'hitstun', after: 'after', laugh: 'laugh', stop: 'stop' }[o.st] || 'idle';
    const pose = A.pose(b, { ph, t: o.t / (o.dur || 1), move: o.move, guard: o.guard, time, round:S.round });
    const guarding = pose.g.filter(g => Math.abs(g.x) <= 85 && g.s <= 1.25);
    if (guarding.length < 2) return 'open';
    if (guarding.every(g => g.y <= -295)) return 'high';
    if (guarding.every(g => g.y >= -285 && g.y <= -165)) return 'low';
    return 'open';
  };
  const canDrop = upper => !S.b.starFinish || (upper && !S.p.combo && S.p.upStars > 0);
  function playerDamage(upper,high,mult){
    const p=S.p,cb=p.combo;
    const armor=S.o.st==='free'&&S.o.move?.armor ? S.o.move.armor : S.b.tactic==='fortress'&&!['rec','go','hitstun'].includes(S.o.st)?.55:1;
    return (upper?(cb?5:[0,16,28,44][p.upStars]):high?5:4.2)*S.P.dmg*mult*(cb?cb.mult:1)*(!upper?1+(p.power||0)*2.2:1)*(S.o.rage?1.1:1)*armor*BX.roundPlan(S.b,S.round).exposed;
  }
  function prepareFinisher(){
    const p=S.p,o=S.o,upper=p.st==='upper',guard=F.visibleGuard(),blocked=guard==='both'||guard===(p.high?'high':'low');
    if(!canDrop(upper))return;
    if(!['idle','tell','strike','rec','go','free','hitstun','cover','after','laugh'].includes(o.st))return;
    if(!upper&&blocked&&!['rec','go'].includes(o.st))return;
    const mult=['rec','go'].includes(o.st)?1.5:o.st==='free'?1.25:(o.st==='idle'||(o.st==='hitstun'&&o.idleCombo)) ? .7 : 1;
    if(o.hp>playerDamage(upper,p.high,mult))return;
    const contact=upper?p.wind+.12:S.P.pStart;
    S.finisher={phase:'wind',elapsed:0,side:p.side,high:p.high,upper,contact,start:0};p.landed=true;AU.play('whoosh',.65);
  }
  function cbActive() { return !!S.p.combo; }
  function playerImpact(side, high, upper) {
    const o = S.o, m = o.move, p = S.p, P = S.P, sd = side === 'L' ? -1 : 1;
    if(S.cfg.trainingTarget){
      const damage=playerDamage(upper,high,1),result=S.cfg.trainingTarget({side,high,upper,zone:p.zone,damage,power:p.power||0})||{};
      if(result.success){S.stats.landed++;p.dmgDealt+=damage;if(result.star)p.stars=Math.min(3,p.stars+1);}
      else if(result.blocked){S.stats.blocks++;p.hearts=Math.max(0,p.hearts-1);if(!p.hearts&&!p.tired)tire();}
      return;
    }

    const hx = OX + sd * 30, hy = high ? 225 : p.zone === 'low' ? 405 : 350;
    let res = 'block', mult = 1, star = false, interrupt = false;
    const guard = F.visibleGuard(), blocked = guard === 'both' || guard === (high ? 'high' : 'low');
    switch (o.st) {
      case 'tell': {
        const frac = o.t / o.dur, early = m.early != null ? m.early : (m.pose === 'jab' || m.pose === 'throw' ? .3 : m.pose === 'hook' || m.pose === 'sweep' ? .22 : 0);
        if (upper) { res = 'land'; interrupt = true; }
        else if (!blocked) { res = 'land'; interrupt = frac < early; if (m.star === 'early' || m.pose === 'hook') star = frac < early * .7 && m.pose === 'hook'; }
        break;
      }
      case 'strike': if (upper || !blocked) { res = 'land'; interrupt = upper; } break;
      case 'rec': case 'go':
        res = 'land'; mult = 1.5;
        if (o.counterReady) { o.counterReady = false; S.stats.counters++; crowdReact('counter'); if (o.st === 'go' || (m && m.star === 'counter' && (!m.counterHigh || high))) star = true; msg('CONTRE !', { size: 44, col: '#4fc3f7', dur: .6, y: 140 }); }
        break;
      case 'free':
        if (!upper && blocked) { res = 'block'; break; }
        res = 'land'; interrupt = true; mult = 1.25;
        if (o.firstFree) { o.firstFree = false; if (m.star === 'early') star = true; }
        break;
      case 'stop': res = 'punish'; break;
      case 'hitstun': res = upper || !blocked ? 'land' : 'block'; if (o.idleCombo) mult = .7; break;
      case 'idle': {
        const g = guard;
        if (upper) res = 'land';
        else if (g === 'both') res = 'block';
        else if ((g === 'high' && high) || (g === 'low' && !high)) res = 'block';
        else { res = 'land'; mult = .7; o.idleCombo = true; }
        break;
      }
      case 'cover': case 'after': case 'laugh': if (upper || !blocked) res = 'land'; break;
      default: res = 'miss';
    }
    if ((S.b.league===2 || S.b.id==='caribou') && o.st==='tell' && !upper) interrupt=false;
    const charging = o.st === 'tell' && m && m.breakHits;
    if (charging && !high) { res = 'land'; interrupt = false; }
    if (S.b.tactic === 'reader' && !upper && !['down','ko','getup'].includes(o.st)) {
      o.sameHand = o.readHand === side ? (o.sameHand || 0) + 1 : 1; o.readHand = side;
      if (o.sameHand >= 3 && !o.readPending && o.moveId !== 'read') { o.sameHand=0; o.readPending=true; bubble('Trois fois la même main… je te lis !'); }
    }
    const mooseCounter = m?.bellyCounter && !upper && !high && p.st === 'punch' && !(p.power > .05) &&
      ((o.st === 'tell' && o.t >= o.dur - .2) || (o.st === 'strike' && !o.resolved && o.t < o.impactT));
    if (mooseCounter) { res = 'land'; interrupt = true; }
    const syrupBreak = o.st === 'free' && m?.maple && high;
    if (syrupBreak) { res = 'land'; interrupt = true; }
    if(S.cfg.training&&!S.cfg.canCounter())res='block';
    if (res === 'land') {
      const opportunity = (interrupt && o.st === 'tell' && !m.feint) || (star && high);
      const surprise = syrupBreak || (!mooseCounter && !upper && !cbActive() && S.time >= (o.surpriseCooldown || 0) &&
        opportunity && ((o.surpriseOpportunities = (o.surpriseOpportunities || 0) + 1) % 2 === 1));
      if (surprise) {
        interrupt = true;
        o.surpriseUntil = S.time + (syrupBreak ? 1.6 : 1.25); o.surpriseCooldown = S.time + 7; o.surpriseHits = 0;
        o.idleCombo = false; o.combo = 0;
        bubble(syrupBreak ? 'MON SIROP !' : 'HEIN ?!');
        if (syrupBreak) { o.syrupShatterAt=S.time; burst(OX+65,260,'#ffc46c',18,1.2); AU.play('pop');AU.play('ting'); }
      }
      const inSurprise = S.time < (o.surpriseUntil || 0);
      if (charging && !high) { o.breakCount=(o.breakCount||0)+1; if(o.breakCount>=m.breakHits){o.st='rec';o.t=0;o.dur=1.7;o.counterReady=true;o.queue=[];bubble('MOTEUR CALÉ !');} }
      const cb = p.combo;if(cb?.stun)interrupt=true;
      if(S.finisher?.phase==='impact')star=star||S.finisher.star;
      const starUpper=upper && p.upStars>0 && !cb;
      let dmg=mooseCounter ? o.hp : playerDamage(upper,high,mult)*(starUpper && star ? 2 : 1);
      if(!canDrop(upper)&&dmg>=o.hp){
        dmg=Math.max(0,o.hp-1);
        if(S.time>=(o.starHintAt||0)){o.starHintAt=S.time+3;bubble('MÊME PAS À TERRE ! IL TE FAUT ★ !');msg('★ UPPERCUT ÉTOILÉ POUR LE FAIRE TOMBER',{size:32,col:'#ffd54f',dur:2,y:180});}
      }
      if(o.hp<=dmg&&!mooseCounter&&!S.finisher&&p.st!=='special'){
        const contact=upper?p.wind+.12:P.pStart;
        S.finisher={phase:'wind',elapsed:0,side,high,upper,star,contact,start:contact*.15,pose:p.st};
        p.t=contact*.15;p.landed=true;AU.play('whoosh',.65);return;
      }
      p.hist.push({ side, high, t: S.time }); if (p.hist.length > 4) p.hist.shift();
      if (cb) { msg(cb.name.toUpperCase() + ' !', { size: 58, col: '#ff80ab', dur: .9, y: 190 }); AU.play('star'); AU.cheer(1.2); burst(hx, hy, '#ff80ab', 18, 1.3, 'star'); }
      if(cb?.element){S.elementHit={kind:cb.element,x:hx,y:hy,t:0,dur:.75};if(cb.element==='ice')o.frost=6;if(cb.element==='fire')o.burn=5;if(cb.element==='lightning')o.weaken=6;if(cb.element==='wind'){o.confused=5;o.queue=[];}AU.play(cb.element==='ice'?'chime':cb.element==='lightning'?'ting':'bigpunch');}
      o.hp -= dmg; p.dmgDealt += dmg; S.stats.landed++; o.combo++;
      o.react = { kind: upper ? 'upper' : high ? 'head' : 'body', side: -sd, k: 1 };
      if(!high&&!upper){S.bodyHit={x:hx,y:hy,at:S.time,power:p.power||0};burst(hx,hy,'#ffd16a',18,1.1);}
      if (upper) { AU.play('bigpunch'); S.fx.shake = .45; S.slow = .35; AU.cheer(2); crowdReact('big'); burst(OX, 220, '#ffd54f', 26, 1.6); }
      else { if(p.power>.2){AU.play('bigpunch');S.fx.shake=.15+p.power*.2;burst(hx,hy,'#ffd578',14,1+p.power);} AU.play(high ? 'punch' : 'body', 1 + Math.random() * .2); burst(hx, hy, mult > 1 ? '#4fc3f7' : '#fff', mult > 1 ? 12 : 7); if (mult > 1) AU.cheer(.8); }
      if (star && p.stars < 3) { p.stars++; S.stats.stars++; AU.play('star'); msg(starUpper ? '★ UPPERCUT ×2 !' : '★ ÉTOILE !', { size: 56, col: '#ffd54f', dur: .9, y: 150 }); AU.cheer(1.2); burst(hx, hy, '#ffd54f', 16, 1.3, 'star'); }
      if (interrupt || o.st === 'idle' || o.st === 'hitstun' || o.st === 'cover' || o.st === 'after' || o.st === 'laugh') {
        if (o.st === 'free' && !upper && o.move && o.move.heal) msg('Pas de collation !', { size: 34, col: '#fff', dur: .8, y: 180 });
        o.queue = interrupt ? [] : o.queue; if (interrupt) o.intervalActive = false;
        o.st = 'hitstun'; o.t = 0; o.dur = inSurprise ? Math.max(.01,o.surpriseUntil-S.time) : upper ? .7 : cb && cb.stun ? .95 : .32; S.proj = null;
      }
      // L’adversaire protège l’endroit touché
      if (!inSurprise && Math.random() < .55) { o.guard = high ? 'high' : 'low'; o.guardT = rand(.8, 1.6); }
      if (inSurprise && !surprise) o.surpriseHits = (o.surpriseHits || 0) + 1;
      if (inSurprise && o.surpriseHits >= 3) { o.surpriseUntil = 0; o.st='cover';o.t=0;o.dur=.55;o.guard='both';o.combo=0; }
      if (!inSurprise && !upper && o.st === 'hitstun' && o.combo >= (o.idleCombo ? 2 : S.b.maxCombo)) { o.st = 'cover'; o.t = 0; o.dur = .55; o.guard = 'both'; o.combo = 0; }
      if (!o.phase2 && o.hp < o.maxHp * .5) enterPhase2();
      if (o.hp <= 0) { if(mooseCounter)msg('ORIGNAL STOPPÉ !',{size:48,col:'#ffd54f',dur:1,y:180}); knockdownOpp(starUpper, sd); }
    } else if (res === 'block' || res === 'cover') {
      p.hist = [];
      AU.play('block'); o.blockFlash = .2; S.stats.blocks++; p.hearts = Math.max(0, p.hearts - 1);
      burst(hx, hy, '#90a4ae', 4);
      if (p.hearts <= 0 && !p.tired) tire();
      o.blocks++;
      if (S.b.tactic === 'fortress') { o.guard=high?'low':'high';o.guardT=1.5;bubble(high?'Je ferme le bas !':'Je ferme le haut !'); }
      if (res === 'cover') { o.st = 'cover'; o.t = 0; o.dur = .55; o.combo = 0; }
      else if (o.st === 'idle' && o.blocks >= 2 + (Math.random() * 2 | 0)) { o.blocks = 0; o.queue.unshift(quickJab()); o.nextIn = .08; bubble(pick(['Trop facile !', 'Pas si vite !', 'Hop !'])); }
    } else if (res === 'punish') punishStop(); else { AU.play('miss'); p.hist = []; }
    p.combo = null;
  }
  function punishStop() {
    const o = S.o, id = o.move && o.move.punish; if (!id) return;
    bubble('TU AS BRÛLÉ L’ARRÊT !'); AU.play('whistle'); o.queue = []; startMove(id, true);
  }
  function quickJab() { const ids = Object.keys(S.b.moves); const q = ids.filter(i => /^jabf?[LR]$/.test(i)); const f = q.filter(i => i.startsWith('jabf')); return pick(f.length ? f : q.length ? q : ['jabL']); }
  function tire() { const p = S.p; p.tired = true; p.tiredT = 0; AU.play('heart'); msg('ÉPUISÉ !', { size: 54, col: '#f48fb1', dur: 1, y: 600 }); }

  // ---------- IA de l’adversaire ----------
  function spd() { const o = S.o; return S.b.spd * (S.time < (o.syrupUntil || 0) ? .82 : 1) * (o.phase2 ? .88 : 1) * (o.rage ? .9 : 1) * (S.b.sprinter ? 1 : S.round === 3 ? .96 : 1) * BX.roundPlan(S.b,S.round).speed; }
  function enterPhase2() {
    const o = S.o; o.phase2 = true;
    if (S.b.phase2 && S.b.phase2.cape === 0 && !o.noCape) { o.noCape = true; bubble('Assez joué. Plus de cape.'); AU.cheer(1); }
    else bubble(pick(S.b.taunts));
  }
  function bubble(text, dur) { if(S.b.id==='minou'&&S.phase==='fight'){AU.say(text,{pitch:1.6,rate:1.27,interrupt:true});} S.o.bubble = { text, t: 0, dur: dur || Math.max(1.4, text.length * .065) }; }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function weighted(pool) {
    const o = S.o; const candidates = pool.filter(([id]) => !(id === o.lastSpecial && !/^jab/.test(id) && Math.random() < .7)); const list = candidates.length ? candidates : pool;
    const tot = list.reduce((s, [, w]) => s + w, 0); let r = Math.random() * tot;
    for (const [id, w] of list) { r -= w; if (r <= 0) return id; } return list[0][0];
  }
  function mirrorId(id) { if (/L$/.test(id) && S.b.moves[id.slice(0, -1) + 'R']) return id.slice(0, -1) + 'R'; if (/R$/.test(id) && S.b.moves[id.slice(0, -1) + 'L']) return id.slice(0, -1) + 'L'; return null; }

  function act() {
    const o = S.o, b = S.b;
    if (o.readPending) {o.readPending=false;startMove('read');return;}
    if (o.queue.length) { startMove(o.queue.shift()); return; }
    if (b.overheat && o.moveCount >= b.overheat && b.moves.overheat) { o.moveCount = 0; startMove('overheat'); return; }
    if(b.starFinish && S.time>=(o.nextStarTest||7)){o.nextStarTest=S.time+14;startMove('starTest');return;}
    if(b.power && S.time >= (o.nextPowerAt || 9)) {o.nextPowerAt=S.time+20;startMove(b.power.move);return;}
    if(b.sprinter){
      const plan=BX.roundPlan(b,S.round);o.pressureCount=(o.pressureCount||0)+1;
      if(plan.restEvery&&o.pressureCount%plan.restEvery===0){startMove('gasp');return;}
      const options=b.pressurePatterns.filter((_,i)=>i!==o.lastPressure),seq=pick(options);o.lastPressure=b.pressurePatterns.indexOf(seq);
      const chain=seq.slice(0,plan.length-1).concat('pressEnd');o.queue=chain.slice(1);startMove(chain[0]);return;
    }
    if(b.feints&&!o.lastWasFeint&&Math.random()<BX.feintChance(b,o.phase2)){o.lastWasFeint=true;startMove(pick(['fakeL','fakeR']));return;}
    o.lastWasFeint=false;
    const patterns = (o.phase2 && b.patterns2) || b.patterns;
    if (patterns && patterns.length) { const sequence=BX.nextPattern(b,o);o.queue=sequence.slice(1);startMove(sequence[0]);return; }
    if (Math.random() < .07) { bubble(pick(b.taunts)); o.nextIn = .7; return; }
    const pool=((o.phase2&&b.pool2)||b.pool).filter(([id])=>!b.feints||!b.moves[id].feint);
    const id=weighted(pool);
    startMove(id);
  }
  function startMove(id, urgent) {
    const o = S.o, b = S.b, m = b.moves[id]; if (!m) { o.st = 'idle'; o.nextIn = .5; return; }
    if (b.id === 'coach') {
      if (id === 'intervals') { o.intervalActive = true; o.intervalCount = 0; o.intervalTotal = m.chain.length; AU.say('Intervalles !', { interrupt: true, rate: 1.25 }); }
      else if (!/^jabf[LR]$/.test(id)) o.intervalActive = false;
    }
    if(m.guard){o.guard=m.guard;o.guardT=10;}
    o.breakCount=0; o.surpriseUntil=0; o.bootBeat=0;
    o.cue = m.cue || (m.pose === 'jab' || m.pose === 'cross' ? 'shoulder' : m.pose === 'upper' || m.pose === 'shovel' ? 'breath' : m.pose === 'charge' ? 'boots' : m.pose === 'overhead' ? 'eyes' : 'glove');
    o.move = m; o.moveId = id; o.t = 0; o.resolved = false; o.idleCombo = false; o.glinted = false; o.lieDone = false; o.lieRed = 0; o.combo = 0; o.blocks = 0; o.firstFree = true; o.avoided = false; o.counterReady = false;
    if (!/^jab/.test(id) && !m.free) o.lastSpecial = id;
    if (!m.free) o.moveCount++;
    if (id===b.power?.move) {msg('✦ '+b.power.name.toUpperCase(),{size:38,col:'#f6d481',dur:1.5,y:155});o.nextPowerAt=S.time+20;}
    if (m.say) bubble(m.say);
    if(b.id==='tibeuf'&&id==='stomp')AU.say('Timber !',{pitch:.7,rate:.9,interrupt:true});
    else if(b.id==='minou'&&S.time>=(o.nextYell||0)){o.nextYell=S.time+2.6;bubble(pick(b.taunts));}
    if (m.sfx) AU.play(m.sfx);
    if (m.chain) o.queue = m.chain.slice().concat(o.queue);
    if (m.free) { o.st = 'free'; o.dur = m.dur * (id==='gasp'?BX.roundPlan(b,S.round).recovery:1); return; }
    if (m.stop) { o.st = 'stop'; o.dur = m.dur * (o.phase2 ? .85 : 1); return; }
    o.st = 'tell'; o.dur = Math.max(m.avoid.includes('block') ? .26 : .42, m.tell * (urgent ? 1 : spd()));
    const lieP = m.lie || (o.phase2 && b.phase2 && b.phase2.lie) || 0;
    o.lie = !!(lieP && mirrorId(id) && Math.random() < lieP);
  }
  function startStrike() {
    const o = S.o, m = o.move;
    o.st = 'strike'; o.t = 0; o.dur = m.hit; o.resolved = false;
    if (S.b.id === 'coach' && o.intervalActive && /^jabf[LR]$/.test(o.moveId)) {
      o.intervalCount++; bubble(String(o.intervalCount) + ' !', .5);
      AU.say(['un', 'deux', 'trois', 'quatre', 'cinq', 'six'][o.intervalCount - 1], { interrupt: true, rate: 1.45, pitch: .9 });
      if (o.intervalCount >= o.intervalTotal) o.intervalActive = false;
    }
    o.impactT = m.projectile ? m.hit * .85 : m.pose === 'leap' ? m.hit * .5 : Math.min(m.hit * .5, .09);
    if(m.projectile==='cat')AU.play('cat');
    if (m.projectile) S.proj = { type: m.projectile, t: 0, dur: o.impactT, from: m.from, avoided: false };
    if (m.pose === 'stomp' || m.pose === 'charge' || m.pose === 'leap' || m.pose === 'overhead') S.fx.shake = Math.max(S.fx.shake, .25);
  }
  function nextOrIdle(gap) {
    const o = S.o;
    if (o.queue.length) { o.st = 'idle'; o.t = 0; o.nextIn = gap != null ? gap : S.b.id==='coach'?.055:S.b.sprinter?.045:S.b.id==='minou'?.045:.14; return; }
    o.st = 'idle'; o.t = 0; o.nextIn = rand(S.b.gap[0], S.b.gap[1]) * (o.phase2 ? .82 : 1) * (o.rage ? .85 : 1) * BX.roundPlan(S.b,S.round).gap;
  }
  function pickGuard() {
    const g = S.b.guard, r = Math.random();
    return r < (g.both || 0) ? 'both' : r < (g.both || 0) + g.high * (1 - (g.both || 0)) ? 'high' : 'low';
  }

  function updateOpp(dt) {
    const o = S.o, m = o.move;
    dt*=o.frost>0?.6:o.confused>0?.7:1;
    o.t += dt;
    switch (o.st) {
      case 'idle':
        o.guardT -= dt; if (o.guardT <= 0) { o.guard = pickGuard(); o.guardT = rand(S.b.guard.sw[0], S.b.guard.sw[1]); }
        o.nextIn -= dt; if (o.nextIn <= 0) act();
        break;
      case 'tell':
        if(m.bellyCounter){const beat=Math.min(3,Math.floor(o.t/o.dur*4));if(beat>(o.bootBeat||0)){o.bootBeat=beat;AU.play('stomp');}}
        if (m.glint && !o.glinted && o.t >= o.dur * .45) { o.glinted = true; o.glint = 1; AU.play(o.cue === 'breath' ? 'whoosh' : o.cue === 'boots' ? 'stomp' : 'glint'); }
        if (o.lie && !o.lieDone && o.t >= o.dur * .62) {
          o.lieDone = true; const mid = mirrorId(o.moveId); if (mid) { o.move = S.b.moves[mid]; o.moveId = mid; o.lieRed = .7; AU.play('pop'); }
        }
        if (o.t >= o.dur) {
          if (m.feint) {
            o.st=m.follow?'after':'laugh';o.t=0;o.dur=m.retract||.5;
            o.queue.unshift(m.follow?pick(m.follow):S.b.moves['olé']?'olé':quickJab());
            if(!m.follow)bubble(pick(['¡Olé!','Feinte !','Hé hé !']));
          }
          else startStrike();
        }
        break;
      case 'strike':
        if (!o.resolved && o.t >= o.impactT) { o.resolved = true; resolveAttack(); }
        if (o.t >= o.dur) {
          if (o.avoided && m.rec > .2) { o.idleCombo = false; o.st = 'rec'; o.t = 0; o.dur = m.rec * (o.phase2 ? .9 : 1) * BX.roundPlan(S.b,S.round).recovery; o.counterReady = true; o.combo = 0; }
          else { o.st = 'after'; o.t = 0; o.dur = m.after!=null?m.after:(S.b.id==='minou'&&/^pat/.test(o.moveId)?.045:.32); }
          if (m.pose === 'leap' && !o.avoided) { o.st = 'after'; o.dur = .5; }
        }
        break;
      case 'rec': if (o.t >= o.dur) { if (o.combo > 0) o.queue = []; nextOrIdle(); } break;
      case 'after': case 'laugh': if (o.t >= o.dur) nextOrIdle(); break;
      case 'hitstun':
        if (o.t >= o.dur) {
          if (o.combo >= (o.idleCombo ? 2 : S.b.maxCombo)) { o.st = 'cover'; o.t = 0; o.dur = .55; }
          else { o.st = 'idle'; o.t = 0; o.nextIn = (o.idleCombo ? rand(.2, .45) : rand(.35, .8)) * (o.phase2 ? .8 : 1); }
        }
        break;
      case 'cover': if (o.t >= o.dur) { o.combo = 0; o.idleCombo = false; o.queue = [quickJab()]; o.st = 'idle'; o.nextIn = .05; } break;
      case 'free':
        if (m.pose === 'blow' || m.prop) { }
        if (o.t >= o.dur) {
          if (m.heal) { const h = o.maxHp * m.heal; o.hp = Math.min(o.maxHp, o.hp + h); msg('+' + Math.round(h / o.maxHp * 100) + ' % d’énergie', { size: 34, col: '#81c784', dur: .9, y: 180 }); }
          if(m.boost){o.syrupUntil=S.time+m.boost;bubble('LE SUCRE ME DONNE DES AILES !');}
          if (m.rage && !o.rage) { o.rage = true; msg('IL EST FÂCHÉ !', { size: 46, col: '#ff5252', dur: 1, y: 180 }); }
          if (m.tellFx === 'fog') S.fx.fog = m.fxDur || 5;
          if (m.tellFx === 'aurora') { S.fx.aurora = m.fxDur || 7; AU.play('chime'); }
          nextOrIdle(.3);
        }
        break;
      case 'stop':
        if (o.t >= o.dur) { o.st = 'go'; o.t = 0; o.dur = m.go || 1.2; o.counterReady = true; bubble('Traversez !'); AU.play('chime'); }
        break;
      case 'go': if (o.t >= o.dur) nextOrIdle(); break;
    }
  }

  function defState() {
    const p = S.p;
    if (p.st === 'dodge' && p.t >= .03 && p.t <= p.dur * .86) return p.dir < 0 ? 'L' : 'R';
    if (p.st === 'duck' && p.t >= .04 && p.t <= p.dur * .88) return 'duck';
    if (p.st === 'block') return 'block';
    return null;
  }
  function resolveAttack() {
    const o = S.o, m = o.move, p = S.p;
    if (!m.dmg && !m.fx) return;                     // simple annonce avant un enchaînement
    const d = defState();
    if (d && m.avoid.includes(d) && (!m.lateDodge || !['L','R'].includes(d) || p.t <= m.lateDodge)) {
      if (d === 'block') { p.hearts = Math.max(0, p.hearts - (m.blockCost ?? 1)); if(o.moveId==='pressEnd')o.avoided=true; if(m.fx==='quake'){AU.play('block');burst(OX,470,'#cfd8dc',6);return;} p.st = 'idle'; p.t = 0; K.down = false; p.lastDown = -9; if (p.hearts <= 0 && !p.tired) tire(); AU.play('block'); burst(OX, 470, '#cfd8dc', 6); if (m.fx === 'snow') msg('Bloqué !', { size: 34, dur: .6, y: 610 }); }
      else { o.avoided = true; S.stats.dodges++; crowdReact('dodge'); AU.play('whoosh'); if (S.proj) S.proj.avoided = true; breathe(); }
      return;
    }
    hitPlayer(m);
  }
  // Souffle : chaque esquive réussie redonne de la stamina.
  function breathe() {
    const p = S.p, gain = S.P.breath; if (p.hearts >= p.maxHearts) return;
    p.hearts = Math.min(p.maxHearts, p.hearts + gain); p.breathFx = .5;
    if (p.tired && p.hearts >= 3) { p.tired = false; msg('Deuxième souffle !', { size: 36, col: '#81c784', dur: .9, y: 610 }); }
  }
  function hitPlayer(m) {
    const p = S.p, o = S.o, P = S.P;
    const stunRemaining = p.st === 'stun' ? Math.max(0,p.dur-p.t) : 0;
    let dmg = (o.weaken>0?.65:1) * m.dmg * S.b.dmg * P.def * (o.rage ? 1.15 : 1) * BX.roundPlan(S.b,S.round).damage;
    if (p.st === 'punch' || p.st === 'upper' || p.st==='charge') { dmg *= 1.25; msg('CONTRÉ !', { size: 40, col: '#ff8a80', dur: .6, y: 610 }); }
    p.chargeKey=null;p.power=0;p.hp -= dmg; o.dmgDealt += dmg; p.hist = [];p.commands=[];p.commandProgress=null;
    p.hearts = Math.max(0, p.hearts - (m.hearts != null ? m.hearts : m.dmg >= 12 ? 4 : m.dmg ? 3 : 1));
    if (p.stars > 0 && m.dmg) { p.stars--; msg('Étoile perdue…', { size: 28, col: '#bbb', dur: .7, y: 650 }); }
    p.st = 'hit'; p.t = 0; p.dur = .42; p.hitSide = m.from === 'L' ? 1 : m.from === 'R' ? -1 : (Math.random() < .5 ? -1 : 1); p.buf = null;
    switch (m.fx) {
      case 'stun': p.st = 'stun'; p.dur = 1.65; msg('SONNÉ !', { size: 44, col: '#ffeb3b', dur: .8, y: 600 }); break;
      case 'quake': p.st='stun';p.dur=1.3;S.fx.shake=.55;msg('DÉSÉQUILIBRÉ !',{size:38,col:'#ffeb3b',dur:1,y:600});break;
      case 'dark': S.fx.dark = 2.4; break;
      case 'blind': S.fx.blind = 1.7; break;
      case 'snow': S.fx.snow = 4.2; break;
      case 'tie': p.tie = 6; msg('Martèle les coups pour te libérer !', { size: 30, col: '#f48fb1', dur: 1.4, y: 610 }); break;
      case 'flash': S.fx.flash = .5; p.st = 'stun'; p.dur = 1.2; break;
      case 'sticky': S.fx.sticky = 4; break;
    }
    if(stunRemaining>p.dur){p.st='stun';p.dur=stunRemaining;}
    if (dmg > 0) {
      const power = clamp(.65 + dmg / 24, .75, 1.5);
      S.lastHit = { side: p.hitSide, power, damage: Math.round(dmg) };
      S.hitStop = m.dmg >= 12 ? .075 : .045;
      S.fx.impact = .48; S.fx.shake = Math.max(S.fx.shake, .42 + power * .1); S.fx.red = .58;
      burst(640, A.ringHeadY(S.cfg.ch), '#ffdf9c', 14, 1.2);
      msg(m.dmg >= 12 ? 'OUCH !' : 'TOUCHÉ !', { size: m.dmg >= 12 ? 68 : 54, col: '#ffb28c', dur: .65, y: 438 });
      AU.play('hurt'); if (m.dmg >= 12) AU.play('bigpunch'); AU.cheer(.6);
    }
    if (p.hp <= 0) { knockdownPlayer(); return; }
    if (p.hearts <= 0 && !p.tired) tire();
  }

  // ---------- Chutes et compte ----------
  F.koChance = (falls, grit, upper) => {
    const toughness = clamp(grit || 0, 0, 1);
    return falls === 1 ? (.06 + (upper ? .14 : 0)) * (1 - toughness * .6)
      : falls === 2 ? (.18 + (upper ? .2 : 0)) * (1 - toughness * .6) : Math.min(.95,(.7 + (upper ? .18 : 0)) * (1 - toughness * .55));
  };
  function knockdownOpp(upper, sd) {
    const o = S.o, b = S.b;
    o.surpriseUntil=0; o.hp = 0; o.st = 'down'; o.t = 0; o.dur = .8; o.kd++; o.kdRound++; o.queue = []; o.fallSide = -(sd || 1); o.react = null; S.proj = null;
    o.bubble = null; if(!S.finisher){S.p.st = 'idle'; S.p.t = 0;} S.fx.dark = S.fx.snow = S.fx.fog = S.fx.blind = S.fx.aurora = 0; S.p.tie = 0;
    S.phase = 'count'; S.phT = 0; S.slow = .9;
    const c = S.count = { who: 'o', heavyUpper: !!upper, n: 0, t: -1.1, done: false, tko: o.kdRound >= 3 };
    if (b.id === 'robot' && o.robotRevived) { c.tko = false; c.stay = true; }
    else if (!c.tko) {
      c.stay = Math.random() < F.koChance(o.kd, b.grit, upper);
      c.upAt = 2 + (Math.random() * (o.kd === 1 ? 4 : 6) | 0) + (o.kd > 1 ? 1 : 0);
      if(upper)c.upAt=Math.min(9,c.upAt+2);
      if (c.stay || Math.random() < (upper ? .45 : .2)) {
        c.fakeAt = 3 + (Math.random() * 2 | 0); c.fakeStarted = false; c.fakeRise = 0; c.attemptT = null;
        if (!c.stay) c.upAt = Math.max(c.upAt, c.fakeAt + 3);
      }
    }
    AU.play('down'); AU.cheer(2.5); msg(c.tko ? 'K.O. TECHNIQUE !' : 'À TERRE !', { size: 92, col: '#ffd54f', dur: 1.4 });
    burst(OX, 300, '#ffd54f', 30, 1.6, 'star');
  }
  function knockdownPlayer() {
    const p = S.p, o = S.o;
    p.hp = 0; p.st = 'down'; p.t = 0; p.kd++; p.kdRound++; p.mash = 0; p.rise = p.riseTarget = 0; p.recoveryAt = -99; p.tired = false; p.tie = 0; p.stars = 0;
    p.need = Math.round(S.P.mash) * Math.pow(2, p.kd - 1);
    o.st = 'idle'; o.queue = []; o.t = 0; S.proj = null;
    S.fx.dark = S.fx.snow = S.fx.fog = S.fx.blind = S.fx.aurora = 0;
    S.phase = 'count'; S.phT = 0;
    S.count = { who: 'p', n: 0, t: -1.1, done: false, tko: false };
    AU.play('down'); AU.cheer(2); msg(S.count.tko ? 'K.O. TECHNIQUE…' : 'TU ES À TERRE !', { size: 80, col: '#ff8a80', dur: 1.3 });
    bubble(pick(S.b.taunts));
  }
  function updateOppDown(dt) {
    const o = S.o; o.t += dt;
    const c = S.count;
    if (S.phase === 'count' && c && c.who === 'o' && !c.done && c.attemptT != null) {
      c.attemptT += dt; const t = c.attemptT;
      c.fakeRise = t < .65 ? .62 * A.eout(t / .65) : t < 1.15 ? .62 + Math.sin(t * 22) * .025 : .62 * (1 - A.ease(clamp((t - 1.15) / .55, 0, 1)));
      if (t >= 1.15 && !c.collapseSound) { c.collapseSound = true; AU.play('body'); msg('Il retombe !', { size: 34, col: '#ffe0ac', dur: .9, y: 160 }); }
      if (t >= 1.7) { c.attemptT = null; c.fakeRise = 0; }
    }
    if (o.st === 'getup' && o.t >= o.dur) {
      o.st = 'idle'; o.t = 0; o.nextIn = rand(.9, 1.4); o.hp = o.maxHp * Math.max(.3, .9 - .2 * (o.kd - 1));
      S.phase = 'fight'; S.count = null; S.p.hearts = S.p.maxHearts; S.p.tired = false;
      if (!o.phase2) enterPhase2(); else bubble(pick(S.b.taunts));
    }
  }
  function updateCount(dt) {
    const c = S.count; if (!c || c.done) return;
    const o = S.o, p = S.p;
    if (c.tko) {
      if (S.phT > 1.8) { c.done = true; finish(c.who === 'o', 'K.O. technique'); }
      return;
    }
    if (c.who === 'p' && c.n < 10 && p.mash >= p.need) {
      c.done = true; p.st = 'getup'; p.t = 0; p.hp = p.maxHp * Math.max(.25, .6 - .12 * (p.kd - 1)); p.hearts = p.maxHearts; AU.cheer(1.5);
      msg('DEBOUT !', { size: 70, col: '#81c784', dur: 1 }); return;
    }
    c.t += dt;
    if (c.t >= 1) {
      c.t -= 1; c.n++; AU.play('tick'); AU.say(['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'][c.n - 1] || '', { interrupt: true, rate: 1.2 });
      if (c.who === 'o') {
        // Bédaine au tapis… ça se relâche un peu.
        if (S.b.id === 'bobby' && c.n % 2 === 1) {
          AU.play('fart'); msg(pick(['Pfffrrt !', 'Prrrout !', 'Pfrrt-pfrrt !', 'Brrrap !']), { size: 40, col: '#aed581', dur: .9, y: 470 });
          for (let i = 0; i < 9; i++) S.parts.push({ x: OX + rand(-90, 90), y: rand(540, 600), vx: rand(-50, 50), vy: rand(-90, -30), life: 0, max: rand(1, 1.8), col: pick(['#9ccc65', '#c5e1a5', '#7cb342']), r: rand(10, 20), kind: 'gas' });
        }
        if (c.fakeAt != null && !c.fakeStarted && c.n >= c.fakeAt && c.n < 10) {
          c.fakeStarted = true; c.attemptT = 0; msg('Il essaie de se relever…', { size: 32, col: '#fff5d8', dur: 1.1, y: 160 });
        }
        if (c.n >= 10) { c.done = true; finish(true, 'K.O.'); }
        else if (!c.stay && c.attemptT == null && c.n >= c.upAt) { c.done = true; o.st = 'getup'; o.t = 0; o.dur = c.heavyUpper ? 1.35 : .9; msg('Il se relève…', { size: 42, col: '#fff', dur: 1, y: 150 }); }
      } else if (c.n >= 10) { c.done = true; finish(false, 'K.O.'); }
    }

  }

  // ---------- Rounds et fin ----------
  function endRound() {
    S.phase = 'roundEnd'; S.phT = 0; S.clock = 0; AU.play('bell'); msg('FIN DU ROUND ' + S.round, { size: 72, col: '#fff', dur: 2 });
    S.p.st = 'idle'; S.o.st = 'idle'; S.o.queue = []; S.proj = null; S.p.tie = 0;
  }
  function cornerInfo() {
    const p = S.p, o = S.o;
    const rival = S.cfg.rivalCoach || { name: 'René', lines: ['Lève tes gants ! On n’est pas venus admirer le plancher !'] };
    return { round: S.round, next: S.round + 1, pHp: p.hp / p.maxHp, oHp: o.hp / o.maxHp, kdP: p.kd, kdO: o.kd, stars: p.stars, tip: S.b.roundHints ? S.b.roundHints[Math.min(2,S.round)] : S.b.tips[(S.round - 1) % S.b.tips.length], rival: rival.name, rivalTip: rival.lines[(S.round - 1) % rival.lines.length], heal: S.P.heal };
  }
  F.nextRound = function () {
    if (!S || S.phase !== 'between') return;
    const p = S.p, o = S.o;
    S.round++; S.clock = 180; S.phase = 'intro'; S.phT = 0;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * S.P.heal); p.hearts = p.maxHearts; p.tired = false; p.kdRound = 0; p.st = 'idle';
    o.hp = Math.min(o.maxHp, o.hp + o.maxHp * .08); o.kdRound = 0; o.st = 'intro'; o.queue = []; o.pressureCount=0; o.frost=0;o.burn=0;o.weaken=0;o.confused=0; o.nextPowerAt=S.time+9; o.nextStarTest=S.time+7;
    p.commands=[];p.commandProgress=null;
    for (const k in S.fx) S.fx[k] = 0;
    if(S.b.roundHints)bubble(S.b.roundHints[S.round-1],4);
    msg('ROUND ' + S.round, { size: 96, col: '#ffd54f', dur: 1.6 }); AU.play('bell1'); AU.say('Round ' + (S.round === 2 ? 'deux' : 'trois') + ' !', { interrupt: true });
  };
  function decision() {
    const p = S.p, o = S.o;
    const pPts = 100 * p.dmgDealt / o.maxHp + o.kd * 30, oPts = 100 * o.dmgDealt / p.maxHp + p.kd * 30;
    const judges = [0, 1, 2].map(() => { const d = pPts - oPts + rand(-6, 6); return d; });
    const win = judges.filter(d => d > 0).length >= 2;
    S.decision = { judges: judges.map(d => d > 0 ? 'Z' : 'A'), pPts: Math.round(pPts), oPts: Math.round(oPts) };
    finish(win, 'Décision');
  }
  function finish(win, method) {
    const p = S.p, o = S.o;
    if (win && method !== 'Décision' && S.b.id === 'robot' && !o.robotRevived) {
      o.robotRevived = true; o.rebootEyes = false; o.rebootHeckled = false; o.st = 'ko'; o.t = 0;
      S.phase = 'robotReboot'; S.phT = 0; S.count = null; S.finisher = null; S.slow = 0;
      S.result = null; p.st = 'idle'; p.t = 0; p.buf = null; F.clearKeys();
      AU.play('down'); AU.cheer(2); AU.say('K.O. !', { interrupt: true });
      msg('K.O. !', { size: 130, col: '#ffd54f', dur: 1.8 });
      return;
    }
    S.phase = 'over'; S.phT = 0;
    S.result = { win, method, round: S.round, clock: S.clock, stats: Object.assign({}, S.stats), kdP: p.kd, kdO: o.kd, decision: S.decision || null, hpLeft: p.hp / p.maxHp };
    p.st = win ? 'win' : method === 'Décision' ? 'lose' : 'down'; p.t = !win && method !== 'Décision' ? .8 : 0;
    if (!win && method !== 'Décision') p.rise = p.riseTarget = 0;
    // Quelqu’un dans la foule a une idée pour Bédaine…
    if (win && method !== 'Décision' && S.b.id === 'bobby') { const me = S; setTimeout(() => { if (S !== me) return; crowdComment('Donnez-lui une poutine !'); AU.cheer(1.5); }, 1800); }
    if (win) { o.st = method === 'Décision' ? 'idle' : 'ko'; o.t = 0; AU.play('win'); AU.cheer(3); msg(method === 'Décision' ? 'VICTOIRE !' : method === 'K.O.' ? 'K.O. !' : 'K.O. TECHNIQUE !', { size: 130, col: '#ffd54f', dur: 4 }); AU.say(method === 'Décision' ? 'Victoire par décision !' : 'K.O. ! Victoire de ' + S.cfg.ch.name + ' !', { interrupt: true }); }
    else { o.st = 'win'; o.t = 0; AU.play('lose'); msg(method === 'Décision' ? 'DÉFAITE AUX POINTS' : 'K.O.…', { size: 96, col: '#ff8a80', dur: 4 }); AU.say(method === 'Décision' ? 'Victoire aux points de ' + S.b.nick : S.b.nick + ' gagne par K.O.', { interrupt: true }); }
  }

  // ---------- Particules et messages ----------
  function msg(text, o = {}) { S.msgs.push({ text, t: 0, dur: o.dur || 1, size: o.size || 60, col: o.col || '#fff', y: o.y || 330 }); if (S.msgs.length > 5) S.msgs.shift(); }
  function burst(x, y, col, n, sp = 1, kind) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = rand(150, 420) * sp; S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0, max: rand(.3, .6), col, r: rand(3, 7) * (kind === 'star' ? 1.6 : 1), kind }); } }
  function confetti() { const cols = ['#ffd54f', '#e91e63', '#4fc3f7', '#81c784', '#fff']; S.parts.push({ x: rand(0, W), y: -10, vx: rand(-60, 60), vy: rand(120, 260), life: 0, max: 3, col: pick(cols), r: rand(4, 8), kind: 'conf', rot: rand(0, 6) }); }
  function updateParts(dt) {
    const ps = S.parts;
    for (const p of ps) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'conf') p.rot += dt * 6; else if (p.kind === 'snow' || p.kind === 'gas') { } else p.vy += 600 * dt; }
    S.parts = ps.filter(p => p.life < p.max);
    if (S.parts.length > 400) S.parts.splice(0, S.parts.length - 400);
    // Neige de la souffleuse
    const o = S.o; if (o.st === 'strike' && o.move && o.move.pose === 'blow') for (let i = 0; i < 6; i++) S.parts.push({ x: OX + rand(-30, 30), y: 150, vx: rand(-500, 500), vy: rand(150, 520), life: 0, max: rand(.6, 1.1), col: '#fff', r: rand(4, 12), kind: 'snow' });
    if (o.st === 'free' && o.move && o.move.pose === 'overheat' && Math.random() < .4) S.parts.push({ x: OX + rand(-80, 80), y: 230, vx: rand(-30, 30), vy: rand(-160, -60), life: 0, max: 1.2, col: 'rgba(255,255,255,.6)', r: rand(10, 22), kind: 'steam' });
  }

  // ======================= RENDU =======================
  let arenaCv = null, arenaKey = '';
  F.render = function (ctx, q) {
    if (!S) return;
    const c = S.cfg, circ = c.circuit;
    const key = circ.id + '@' + q;
    if (key !== arenaKey) { arenaCv = A.arena(W, H, q, circ); arenaKey = key; }
    if (S.phase === 'between' || (S.phase === 'roundEnd' && S.phT > .55)) {
      drawCorners(ctx); drawHud(ctx); return;
    }
    ctx.save();
    if(S.p.st==='special'){const zoom=1+.08*Math.sin(Math.PI*S.p.t/S.p.dur);ctx.translate(640,450);ctx.scale(zoom,zoom);ctx.translate(-640,-450);}
    if(S.finisher){const f=S.finisher,z=f.phase==='wind'?1+.065*A.ease(Math.min(1,f.elapsed/.62)):1.065*(1-f.elapsed/1.05)+f.elapsed/1.05;ctx.translate(640,390);ctx.scale(z,z);ctx.translate(-640,-390);}
    const sh = S.fx.shake; if (sh > 0) ctx.translate(rand(-12, 12) * sh * 2, rand(-8, 8) * sh * 2);
    if (S.fx.impact > 0 && S.lastHit) {
      const e = S.fx.impact / .48;
      ctx.translate(640, 520); ctx.rotate(S.lastHit.side * .012 * e); ctx.scale(1 + .025 * e, 1 + .025 * e); ctx.translate(-640, -520);
    }
    ctx.drawImage(arenaCv, -20, -20, W + 40, H + 40);
    // Flashs de photographes
    const flashes = S.phase === 'count' || S.phase === 'over' ? 6 : 1;
    for (let i = 0; i < flashes; i++) if (Math.random() < .25) { const x = rand(20, W - 20), y = rand(120, 400); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x, y, rand(2, 4), 0, 7); ctx.fill(); A.sparkle(ctx, x, y, 12, 'rgba(255,255,255,.7)'); }
    if(S.finisher){
      ctx.save();const f=S.finisher;ctx.strokeStyle='rgba(255,216,119,.22)';ctx.lineWidth=3;
      for(let i=0;i<22;i++){const a=i*Math.PI*2/22;ctx.beginPath();ctx.moveTo(640+Math.cos(a)*390,370+Math.sin(a)*260);ctx.lineTo(640+Math.cos(a)*800,370+Math.sin(a)*650);ctx.stroke();}
      ctx.textAlign='center';ctx.font='24px Bungee, Impact';ctx.fillStyle='#ffe5a0';ctx.fillText(f.phase==='wind'?'LE COUP DÉCISIF…':'BOOOUM !',640,145);ctx.restore();
    }
    if(S.o.st==='tell'&&S.o.move?.breakHits){ctx.save();ctx.fillStyle='#ffe0a0';ctx.font='900 24px Nunito';ctx.textAlign='center';ctx.fillText('MOTEUR : '+(S.o.breakCount||0)+' / '+S.o.move.breakHits+' coups au corps',640,100);ctx.restore();}
    if(S.b.id==='minou'){A.cat(ctx,90+Math.sin(S.time)*10,590,.47,S.time,'#86938f',false);A.cat(ctx,1185,585,.5,S.time+1,'#d39d65',false);}
    // Adversaire
    const o = S.o, b = S.b, m = o.move;
    const ph = { intro: 'idle', idle: 'idle', tell: 'tell', strike: 'strike', rec: 'rec', after: 'after', hitstun: 'hitstun', cover: 'cover', free: 'free', stop: 'stop', go: 'go', laugh: 'laugh', down: 'down', getup: 'getup', ko: 'ko', win: 'win' }[o.st] || 'idle';
    const os = {
      ph, t: ph === 'down' || ph === 'getup' ? o.t / (o.dur || 1) : o.t / (o.dur || 1), move: m, guard: o.guard, react: o.react, time: S.time, glint: ['eyes','glove'].includes(o.cue) ? o.glint : 0, cue:o.cue, cueFlash:o.glint, surprised:S.time<(o.surpriseUntil||0)&&o.st==='hitstun', syrupBoost:S.time<(o.syrupUntil||0), syrupShatter:S.time-(o.syrupShatterAt??-100),
      glintG: o.cue === 'glove' && m ? (m.from === 'L' ? 0 : 1) : null,
      eyes: m && m.eyes && (o.st === 'tell' || o.st === 'strike') ? (m.from === 'L' ? -1 : 1) : 0, lieRed: o.lieRed > 0, aurora: S.fx.aurora > 0,
      rebootEyes: S.phase === 'robotReboot' && o.rebootEyes,
      noCape: o.noCape, shadowId: c.ch.id, fallSide: o.fallSide, tired: !!b.sprinter && S.round>1, round:S.round,
      fakeRise: S.phase === 'count' && S.count && S.count.who === 'o' ? S.count.fakeRise || 0 : 0,
    };
    if (o.st === 'ko' || (S.phase === 'over' && S.result && S.result.win && S.result.method !== 'Décision')) { os.ph = 'ko'; }
    const k = (b.look.h || 1) * OK;
    // L’adversaire descend réellement ses gants jusqu’au visage du petit boxeur.
    if (ph === 'strike' && m && !m.projectile && /^(jab|hook|upper|overhead|cross|stepJab|shovel|overhand|checkHook|axeWind|axeDown)$/.test(m.pose)) {
      const reach = A.eout(clamp(os.t * 3, 0, 1)), adjusted = A.pose(b, os);
      for (const i of m.pose === 'overhead' ? [0, 1] : [m.from === 'L' ? 0 : 1]) {
        adjusted.g[i].y = lerp(adjusted.g[i].y, (A.ringHeadY(c.ch)+(S.p.backstep||0)-OY) / k, reach);
        adjusted.g[i].x = lerp(adjusted.g[i].x, m.from === 'L' ? -12 : 12, reach);
      }
      os.R = adjusted;
    }
    ctx.save(); ctx.translate(OX, OY); ctx.scale(k, k);
    const R = A.boxer(ctx, b, {...os,burn:o.burn});
    ctx.restore();
    if (o.blockFlash > 0) { for (let i = 0; i < 2; i++) { const gw = gloveWorld(R, i, k); ctx.strokeStyle = 'rgba(255,255,255,' + o.blockFlash * 4 + ')'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(gw.x, gw.y, 40 * gw.s, 0, 7); ctx.stroke(); } }
    drawOpponentStatus(ctx);
    drawProjectile(ctx, R, k);
    // Particules
    for (const p of S.parts) {
      const a = 1 - p.life / p.max; ctx.globalAlpha = Math.max(0, a);
      if (p.kind === 'star') { ctx.fillStyle = p.col; A.star(ctx, p.x, p.y, p.r * 1.4); ctx.fill(); }
      else if (p.kind === 'gas') { ctx.globalAlpha = Math.max(0, a) * .55; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.life * 1.8), 0, 7); ctx.fill(); }
      else if (p.kind === 'conf') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
      else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // Effets qui cachent l’adversaire (le joueur reste visible par-dessus)
    drawFxBehind(ctx, R, k);
    // Bulle
    if (o.bubble) drawBubble(ctx, o.bubble, R, k);
    // Joueur
    const p = S.p;
    const pst = p.st === 'down' ? 'down' : p.st;
    const tt = (pst === 'down' || pst === 'getup') ? Math.min(1, p.t / .8) : p.t / (p.dur || 1);
    const aside = S.phase === 'robotReboot' ? 0 : (S.phase === 'count' && S.count && S.count.who === 'o') || (S.phase === 'over' && S.result && S.result.win && S.result.method !== 'Décision') ? Math.min(1, S.phT / .5) * (1 - A.ease(clamp((S.phT - 2.5) / .65, 0, 1))) : 0;
    const playerFrame = A.player(ctx, c.ch, { inRing: true, element: ['punch','upper','special'].includes(pst)?p.comboVisual:null, aside, backstep: p.backstep || 0, st: pst, rise: p.rise, recoverySide: p.recoverySide, recoveryT: (S.time - (p.recoveryAt ?? -99)) / .2, t: pst === 'upper' ? p.t : tt, wind: p.wind, dir: p.dir, side: p.side, high: p.high, zone: p.zone, power:p.power||0, time: S.time, tired: p.tired, tied: p.tie > 0, hitSide: p.hitSide, hitPower: S.lastHit ? S.lastHit.power : 1 });
    if(S.bodyHit)F.drawBodyImpact(ctx,S.bodyHit,S.time);
    drawElementImpact(ctx);
    drawReceivedImpact(ctx, playerFrame);
    drawFxFront(ctx);
    if (S.crowdLine) {
      const line = S.crowdLine, x = clamp(line.speaker.x - 150, 18, W - 318), y = Math.max(152, line.speaker.y - 111);
      A.comicBubble(ctx, line.text, x, y, 300, line.speaker, Math.min(1, line.t * 40 / line.text.length), 20);
    }
    ctx.restore();
    drawHud(ctx);
    drawMsgs(ctx);
    if (S.phase === 'count' && S.count) drawCount(ctx);
    if (S.help > 0 && (S.phase === 'fight' || S.phase === 'intro')) drawHelp(ctx, Math.min(1, S.help));
  };
  function gloveWorld(R, i, k) {
    const g = R.g[i]; let x = g.x * R.sx * R.spin, y = g.y * R.sy; const c = Math.cos(R.rot), s = Math.sin(R.rot);
    const rx = x * c - y * s, ry = x * s + y * c; return { x: OX + (R.bx + rx) * k, y: OY + (R.by + ry) * k, s: g.s * k * Math.abs(R.sx) };
  }
  function drawProjectile(ctx, R, k) {
    const pr = S.proj, o = S.o; if (!pr) return;
    if (o.st !== 'strike' && o.st !== 'rec' && o.st !== 'after') { S.proj = null; return; }
    const sd = pr.from === 'L' ? -1 : pr.from === 'R' ? 1 : 0;
    const sx = OX + sd * 120 * k, sy = OY - 480 * k;
    let p = pr.t / pr.dur, x, y, s;
    if (p <= 1) { const e = p * p; x = lerp(sx, OX, e); y = lerp(sy, 470, e); s = lerp(.8, 3.0, e); }
    else {
      if (!pr.avoided) { if (!pr.burst) { pr.burst = true; burst(OX, 470, pr.type === 'yarn' ? '#f06292' : '#fff', 14, 1.2); } return; }
      const e = (p - 1) * 2.5; if (e > 1.2) return; const d = S.p.dir || 1, ducked = S.p.st === 'duck';
      x = OX - (ducked ? 0 : d * e * 500); y = 470 + (ducked ? -e * 300 : e * 200); s = 3 + e * 2;
    }
    A.projectile(ctx, pr.type, x, y, s, S.time,pr.from);
  }
  function drawFxBehind(ctx, R, k) {
    const fx = S.fx;
    if (fx.fog > 0) {
      const a = Math.min(1, fx.fog) * .88; const t = S.time;
      ctx.fillStyle = 'rgba(200,205,215,' + a * .55 + ')'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) { const x = (i * 190 + t * 40 * (i % 2 ? 1 : -1)) % (W + 400) - 200, y = 120 + (i * 53) % 340; const gr = ctx.createRadialGradient(x, y, 10, x, y, 230); gr.addColorStop(0, 'rgba(225,230,238,' + a + ')'); gr.addColorStop(1, 'rgba(225,230,238,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 230, y - 230, 460, 460); }
    }
    if (fx.aurora > 0) {
      const a = Math.min(1, fx.aurora * 1.5); ctx.fillStyle = 'rgba(2,4,18,' + .9 * a + ')'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = i === 1 ? 'rgba(224,64,251,' + .22 * a + ')' : 'rgba(105,240,174,' + .25 * a + ')'; ctx.lineWidth = 40 - i * 8; ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 70 + i * 40 + Math.sin(x / 140 + S.time * (1 + i * .3)) * 30); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 2; i++) { const g = gloveWorld(R, i, k), col = i === 0 ? '#69f0ae' : '#e040fb'; const gr = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, 70 * g.s); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.x, g.y, 70 * g.s, 0, 7); ctx.fill(); A.glove(ctx, g.x, g.y, g.s, col, i === 0 ? -1 : 1, false, 0, false); }
      // les yeux du roi
      const hx = OX + R.hx * k, hy = OY + (R.by - 400 + R.hy) * k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx - 18, hy, 4, 0, 7); ctx.arc(hx + 18, hy, 4, 0, 7); ctx.fill();
    }
  }
  function drawCorners(ctx) {
    const e = S.phase === 'between' ? 1 : A.ease(clamp((S.phT - .55) / 1.5, 0, 1)), T = S.time;
    ctx.save(); ctx.drawImage(arenaCv, 0, 0, W, H);
    ctx.fillStyle = 'rgba(7,17,26,.2)'; ctx.fillRect(0, 0, W, H);
    for (const [x, color, name] of [[245, '#397d9b', 'TON COIN'], [1000, '#ac4c42', 'COIN ADVERSE']]) {
      ctx.globalAlpha = e;
      ctx.fillStyle = color; A.rr(ctx, x - 13, 355, 26, 235, 8); ctx.fill();
      ctx.fillStyle = '#ded4b8'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 16, 392 + i * 58, 32, 9);
      ctx.font = '13px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText(name, x, 682);
    }
    ctx.globalAlpha = 1;
    const childK = .52 * A.childScale(S.cfg.ch), oppK = .62 * (S.b.look.h || 1);
    const stool = (x, seatY, color) => {
      ctx.globalAlpha = e; ctx.strokeStyle = '#263943'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(x - 23, seatY + 3); ctx.lineTo(x - 31, 656); ctx.moveTo(x + 23, seatY + 3); ctx.lineTo(x + 31, 656); ctx.stroke();
      ctx.fillStyle = color; A.rr(ctx, x - 39, seatY - 5, 78, 14, 5); ctx.fill(); ctx.globalAlpha = 1;
    };
    stool(316, 650 - 105 * childK, '#3f819c'); stool(929, 650 - 100 * oppK, '#a84840');
    A.cornerCoach(ctx, S.cfg.coach || BX.charById('richard'), lerp(-120, 145, e), 660, .49, T, 1, false);
    A.cornerCoach(ctx, null, lerp(1400, 1135, e), 660, .49, T + 1, -1, true);
    A.playerFront(ctx, S.cfg.ch, lerp(640, 316, e), lerp(730, 650, e), lerp(.62, .52, e), T, { rest: e > .7 });
    ctx.save(); ctx.translate(lerp(640, 929, e), lerp(612, 650, e)); const k = lerp(OK * (S.b.look.h || 1), oppK, e); ctx.scale(k, k);
    A.boxer(ctx, S.b, { ph: e > .7 ? 'rest' : 'idle', time: T, shadowId: S.cfg.ch.id }); ctx.restore();
    ctx.fillStyle = '#f1dfb9'; ctx.textAlign = 'center'; ctx.font = '20px Bungee, Impact'; ctx.fillText('ROUND ' + S.round + ' TERMINÉ', 640, 135);
    ctx.restore();
  }
  function drawReceivedImpact(ctx, playerFrame) {
    if (S.fx.impact <= 0 || !S.lastHit || !Number.isFinite(playerFrame.headX)) return;
    const hit = S.lastHit, e = S.fx.impact / .48, age = .48 - S.fx.impact;
    const x = playerFrame.headX - hit.side * 18, y = playerFrame.headY - 4;
    ctx.save();
    if (age < .2) {
      ctx.globalAlpha = Math.min(1, e * 1.4); ctx.fillStyle = '#e88c54'; A.star(ctx, x, y, (34 + age * 210) * hit.power, 9, .4); ctx.fill();
      ctx.fillStyle = '#fff1c9'; A.star(ctx, x, y, (23 + age * 90) * hit.power, 7, .36); ctx.fill();
    }
    ctx.globalAlpha = e * .7; ctx.strokeStyle = '#ffe1b2'; ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5 + .1, r = 50 + age * 130;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * .65);
      ctx.lineTo(x + Math.cos(a) * (r + 24 * hit.power), y + Math.sin(a) * (r + 24 * hit.power) * .65); ctx.stroke();
    }
    ctx.restore();
  }
  function drawFxFront(ctx) {
    const fx = S.fx, t = S.time;
    if (fx.snow > 0) {
      const a = Math.min(1, fx.snow / 1.5);
      ctx.fillStyle = 'rgba(245,250,255,' + .55 * a + ')'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = (i * 61 + 40) % H; ctx.fillStyle = 'rgba(255,255,255,' + .9 * a + ')'; ctx.beginPath(); ctx.arc(x, y, 50 + (i % 5) * 18, 0, 7); ctx.fill(); }
    }
    if (fx.dark > 0) {
      const a = Math.min(1, fx.dark / .8); ctx.fillStyle = 'rgba(120,10,10,' + .97 * a + ')'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,' + .14 * a + ')'; ctx.fillRect(0, 300, W, 60); ctx.font = '300px Bungee, Impact'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('44', W / 2 + Math.sin(t * 3) * 20, 360);
      ctx.fillStyle = 'rgba(255,255,255,' + .8 * a + ')'; ctx.font = '900 34px Nunito'; ctx.fillText('Le chandail te cache la vue ! Écoute les coups…', W / 2, 560);
    }
    if (fx.blind > 0) { ctx.fillStyle = 'rgba(255,253,231,' + Math.min(1, fx.blind) * .95 + ')'; ctx.fillRect(0, 0, W, H); }
    if (fx.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + fx.flash * 1.6 + ')'; ctx.fillRect(0, 0, W, H); }
    if (fx.red > 0) { const gr = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 760); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, 'rgba(255,0,0,' + fx.red * 1.5 + ')'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  }
  const CROWD_LINES = {
  "idle": [
    "Vas-y, {name} !",
    "On est avec toi !",
    "Petits gants, grand courage !",
    "Il est petit, mais il est vite !",
    "Allez, champion !",
    "Z’ai mis mon plus beau chandail pour ça !",
    "C’est lui, notre futur champion !",
    "La famille est dans la place !",
    "Attache ta tuque, ça va brasser !",
    "J’ai apporté mes mitaines. Pas les bonnes !",
    "Mon hot-dog veut voir, lui aussi !",
    "Y’a plus d’action qu’au dépanneur à cinq heures !",
    "J’ai crié si fort, mon jus a fait des bulles !",
    "Qui a mis du sirop dans les gants ?",
    "Mon siège fait couic. Il encourage, lui aussi !",
    "On fait-tu la vague ? J’ai perdu mon voisin !",
    "J’ai amené ma tuque porte-bonheur. Elle a chaud !",
    "Le popcorn est prêt. Mes nerfs, moins !"
  ],
  "dodge": [
    "Où il est passé ?!",
    "Même pas touché !",
    "Des pieds rapides, ce petit-là !",
    "Il boxe avec un fantôme ou quoi ?",
    "Il a frappé dans le beurre !",
    "Y’a un courant d’air qui vient de gagner !",
    "Raté ! Même la mouche a pas eu peur !",
    "Coudonc, il essaie-tu de brasser de la soupe ?",
    "Ça glisse plus qu’une entrée en janvier !",
    "Son gant cherche encore l’adresse !",
    "Belle esquive ! Mon sandwich l’a même pas vue !",
    "Il vient de donner un coup à personne !"
  ],
  "counter": [
    "Ça, c’est du timing !",
    "Tu l’as pas vu venir, celui-là !",
    "Encore un comme ça, {name} !",
    "Le petit a compris ton truc !",
    "Retour à l’expéditeur ! Pas besoin de timbre !",
    "Tiens ! T’avais oublié ton coup !",
    "Livraison express, direct dans les mitaines !",
    "Ça, c’est une réponse pas mal vite !",
    "Même ma grand-mère répond moins vite au téléphone !",
    "Il a commandé un coup, il en reçoit deux !",
    "Le gant est revenu avant l’autobus !",
    "Ben voyons ! Il avait prévu le coup !"
  ],
  "big": [
    "OOOH ! Quel coup !",
    "Ça, ça réveille !",
    "Même mon popcorn a sauté !",
    "Quelqu’un a pris ça en photo ?!",
    "Ayoye ! Mes lacets se sont détachés !",
    "Mon hot-dog vient de changer de banc !",
    "La moutarde a fait un saut périlleux !",
    "Ça a brassé jusque dans ma boîte à lunch !",
    "Ma tuque est rendue trois rangées plus loin !",
    "Qui a mis un ressort dans ce gant-là ?",
    "Même le banc a dit : ouf !",
    "Mon jus est devenu un smoothie !"
  ],
  "support": [
    "Respire, {name} ! On lâche pas !",
    "Garde tes gants hauts, champion !",
    "T’es encore dans le combat !",
    "On croit en toi, {name} !",
    "Un coup à la fois, champion !",
    "Prends ton air, on garde ta place !",
    "On lâche pas la patate ! Ni les gants !",
    "Même les héros prennent une pause de jus !",
    "Mes deux mitaines applaudissent pour toi !",
    "T’es capable ! Toute la rangée est avec toi !",
    "Une bonne respiration, pis on repart !",
    "Même mon toutou croit en toi !"
  ]
};
  const CROWD_OPPONENTS = {
  "bobby": {
    "idle": [
      "Le dépanneur est fermé, mais les gants sont ouverts !",
      "Bob, y’a quelqu’un qui attend à la caisse !"
    ],
    "dodge": [
      "Bob vient de manquer sa livraison !"
    ],
    "big": [
      "Nettoyage demandé dans l’allée des gants !"
    ]
  },
  "ginette": {
    "idle": [
      "Ginette, même le popcorn attend ton feu vert !",
      "Sa pancarte a-tu payé son billet ?"
    ],
    "dodge": [
      "Il a traversé sans se faire pogner !"
    ],
    "big": [
      "Son arrêt-stop vient de faire un détour !"
    ]
  },
  "tibeuf": {
    "idle": [
      "Y’a pas d’arbre icitte, Ti-Bœuf !",
      "Il a oublié sa scie, il a pris ses mitaines !"
    ],
    "dodge": [
      "Il vient de bûcher un arbre invisible !"
    ],
    "big": [
      "On a entendu TIMBER jusque dans le stationnement !"
    ]
  },
  "coach": {
    "idle": [
      "Coach, on peut-tu avoir une récré ?",
      "Son sifflet a plus de souffle que moi !"
    ],
    "dodge": [
      "Le coach vient de manquer son propre cours !"
    ],
    "big": [
      "Le sifflet a avalé sa note !"
    ]
  },
  "lemur": {
    "idle": [
      "Ce mur-là a pas de sonnette !",
      "J’ai amené un cadre. On peut-tu l’accrocher ?"
    ],
    "dodge": [
      "Le mur a trouvé le moyen de manquer la porte !"
    ],
    "big": [
      "Quelqu’un a cogné ! Ouvre donc !"
    ]
  },
  "meteo": {
    "idle": [
      "Ils annoncent des gants avec risque de popcorn !",
      "J’ai mis mes bottes pour une tempête de mitaines !"
    ],
    "dodge": [
      "Zéro précipitation sur notre champion !"
    ],
    "big": [
      "Alerte météo : gros coup localisé !"
    ]
  },
  "minou": {
    "idle": [
      "Ses chats ont réservé toute la première rangée !",
      "Y’en a un qui essaie de manger mon billet !"
    ],
    "dodge": [
      "Même les chats ont perdu le petit de vue !"
    ],
    "big": [
      "Les chats viennent de faire miaou en stéréo !"
    ]
  },
  "robot": {
    "idle": [
      "Y’a-tu quelqu’un qui a les piles ?",
      "Il faut-tu peser sur dégivrage ?"
    ],
    "dodge": [
      "Erreur 404 : boxeur introuvable !"
    ],
    "big": [
      "La souffleuse vient d’avaler un banc de neige !"
    ]
  },
  "petardo": {
    "idle": [
      "Sa cape prend deux places dans l’autobus !",
      "Il a mis son pyjama de superhéros !"
    ],
    "dodge": [
      "Olé ! Le gant est parti tout seul !"
    ],
    "big": [
      "Son masque vient de faire des gros yeux !"
    ]
  },
  "rita": {
    "idle": [
      "Grand-maman, garde-moi une paire de bas !",
      "Elle tricote-tu entre deux crochets ?"
    ],
    "dodge": [
      "Elle a échappé une maille !"
    ],
    "big": [
      "Son tricot vient de gagner trois manches !"
    ]
  },
  "caribou": {
    "idle": [
      "Sa couronne rentre-tu dans son casier ?",
      "Le roi peut-tu signer ma boîte à lunch ?"
    ],
    "dodge": [
      "Sa couronne cherche encore le petit !"
    ],
    "big": [
      "La couronne a fait ding ! Comme mon grille-pain !"
    ]
  },
  "rempart": {
    "idle": [
      "Le gardien a oublié son filet !",
      "Ce rempart-là bloque même le Wi-Fi !"
    ],
    "dodge": [
      "Le petit a trouvé la porte de côté !"
    ],
    "big": [
      "Ça vient de sonner à toutes les portes !"
    ]
  },
  "enclume": {
    "idle": [
      "Il répare-tu les patins après le match ?",
      "On est au ring ou dans la boîte à outils ?"
    ],
    "dodge": [
      "Il vient de cogner sur un clou invisible !"
    ],
    "big": [
      "L’enclume a sonné comme la cloche du dîner !"
    ]
  },
  "rafale": {
    "idle": [
      "Y’a un ventilateur dans ses gants !",
      "La Rafale va sécher ma tuque !"
    ],
    "dodge": [
      "Toute cette rafale pour brasser de l’air !"
    ],
    "big": [
      "La rafale vient de changer de direction !"
    ]
  },
  "metronome": {
    "idle": [
      "Un, deux, trois… j’ai perdu mon popcorn !",
      "Il boxe ou il accorde ses mitaines ?"
    ],
    "dodge": [
      "Il a manqué une note ! Pouet !"
    ],
    "big": [
      "Ça, c’était un solo de gros gant !"
    ]
  },
  "pivot": {
    "idle": [
      "Ses souliers connaissent plus de pas que moi !",
      "On danse-tu la danse des canards après ?"
    ],
    "dodge": [
      "Un pas à gauche, un gant dans le vide !"
    ],
    "big": [
      "Ça, c’est un pas de danse qui fait BOUM !"
    ]
  },
  "vigie": {
    "idle": [
      "L’arbitre est dans le ring avec des gants !",
      "Il va-tu se donner une punition tout seul ?"
    ],
    "dodge": [
      "Même l’arbitre a pas vu passer le petit !"
    ],
    "big": [
      "Deux minutes pour avoir fait sauter mon jus !"
    ]
  },
  "briseglace": {
    "idle": [
      "J’ai amené ma tuque et mes patins !",
      "Il peut-tu déglacer mon entrée après ?"
    ],
    "dodge": [
      "Il a glissé sur son propre glaçon !"
    ],
    "big": [
      "La glace est cassée ! Qui veut une slush ?"
    ]
  },
  "tandem": {
    "idle": [
      "Cet ascenseur-là a pas de musique !",
      "Corps, visage… choisis donc ton étage !"
    ],
    "dodge": [
      "L’ascenseur est passé tout droit !"
    ],
    "big": [
      "Ding ! Prochain étage : les étoiles !"
    ]
  },
  "sirene": {
    "idle": [
      "C’est pas le feu, c’est mon hot-dog !",
      "Sa sirène a réveillé mon sandwich !"
    ],
    "dodge": [
      "Pin-pon ! Le gant cherche son chemin !"
    ],
    "big": [
      "Même la sirène a fait un petit couic !"
    ]
  },
  "granite": {
    "idle": [
      "Il doit gagner à roche-papier-ciseaux !",
      "J’ai apporté du papier. Ça bat la roche !"
    ],
    "dodge": [
      "La roche vient de manquer un caillou !"
    ],
    "big": [
      "Ça a fait du bruit jusque dans ma collection de roches !"
    ]
  },
  "spectre": {
    "idle": [
      "S’il disparaît, qui paie son stationnement ?",
      "Fais donc apparaître une autre poutine !"
    ],
    "dodge": [
      "Le magicien s’est fait faire un tour !"
    ],
    "big": [
      "Son tour de magie vient de faire pouf !"
    ]
  },
  "cyclone": {
    "idle": [
      "Il essore-tu les serviettes après le match ?",
      "J’ai perdu ma tuque dans son courant d’air !"
    ],
    "dodge": [
      "Il tourne, mais il trouve pas la sortie !"
    ],
    "big": [
      "La machine à tourner vient de faire ding !"
    ]
  },
  "contretemps": {
    "idle": [
      "Il lit les gants comme une bande dessinée !",
      "Il réfléchit tellement, mon hot-dog refroidit !"
    ],
    "dodge": [
      "Il avait pas prévu cette page-là !"
    ],
    "big": [
      "Son plan vient de faire un gros pli !"
    ]
  },
  "ombre": {
    "idle": [
      "Deux champions ? J’ai payé pour un seul !",
      "Le miroir a emprunté des gants !"
    ],
    "dodge": [
      "Même le reflet arrive pas à suivre !"
    ],
    "big": [
      "Ça, c’est une photo de famille qui bouge !"
    ]
  }
};
  // Keep jokes relevant to this opponent and event, with a six-line memory.
  F.crowdChoices = (kind, boxerId, name) => [...(CROWD_LINES[kind] || CROWD_LINES.idle), ...(CROWD_OPPONENTS[boxerId]?.[kind] || [])].map(text=>text.replaceAll('{name}',name));
  F.pickCrowdLine = (kind, boxerId, name, recent=[]) => {
    const all=F.crowdChoices(kind,boxerId,name),fresh=all.filter(text=>!recent.includes(text));
    const specific=(CROWD_OPPONENTS[boxerId]?.[kind]||[]).filter(text=>!recent.includes(text));
    return pick(specific.length&&Math.random()<.45?specific:fresh.length?fresh:all.filter(text=>text!==recent.at(-1)));
  };
  function crowdReact(kind) {
    if (!S || S.crowdLine || S.crowdCooldown > 0 || S.clock <= 10 || S.o.intervalActive) return;
    crowdComment(F.pickCrowdLine(kind,S.b.id,S.cfg.ch.name,S.crowdRecent||[]));
  }
  function crowdComment(text, silent = false) {
    const people = arenaCv && arenaCv.spectators && arenaCv.spectators.filter(p => p.y > 260 && p.x > 40 && p.x < 1240), p = people && people.length ? pick(people) : { x: 1130, y: 270 };
    S.crowdLine = { text, speaker: { x: -20 + p.x * (W + 40) / W, y: -20 + p.y * (H + 40) / H }, t: 0, dur: Math.max(3.5, text.length / 30 + 2) };
    S.crowdCooldown = 5; S.crowdLast = text;S.crowdRecent=[...(S.crowdRecent||[]),text].slice(-6);
  }
  function drawBubble(ctx, bb, R, k) {
    const a = Math.min(1, bb.t * 8, (bb.dur - bb.t) * 4);
    ctx.save(); ctx.globalAlpha = a;
    const intervalNumber = S.b.id === 'coach' && /^\d+ !$/.test(bb.text);
    A.comicBubble(ctx, bb.text, OX + 130, 152, intervalNumber ? 140 : 370, { x: OX + 80, y: 247 }, 1, intervalNumber ? 38 : 22);
    ctx.restore();
  }
  function bar(ctx, x, y, w, h, frac, col, back, flip) {
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, flip ? .35 : -.35, 1, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(-4, -4, w + 8, h + 8); ctx.fillStyle = back; ctx.fillRect(0, 0, w, h);
    const fw = w * clamp(frac, 0, 1); ctx.fillStyle = col; flip ? ctx.fillRect(w - fw, 0, fw, h) : ctx.fillRect(0, 0, fw, h);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; flip ? ctx.fillRect(w - fw, 0, fw, h * .35) : ctx.fillRect(0, 0, fw, h * .35);
    ctx.restore();
  }
  function hpCol(f) { return f > .5 ? '#ffca28' : f > .25 ? '#ff9800' : '#ef5350'; }
  F.drawPlayerHud = (ctx,p,ch,time=0,{health=true,stamina=true}={}) => {
    ctx.save();
    // Joueur (gauche)
    ctx.font = '22px Bungee, Impact, sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillStyle = '#000'; ctx.fillText(ch.name.toUpperCase(), 32, 42); ctx.fillStyle = '#fff'; ctx.fillText(ch.name.toUpperCase(), 30, 40);
    if(health)bar(ctx, 40, 52, 400, 26, p.hp / p.maxHp, hpCol(p.hp / p.maxHp), '#3a0d0d', false);
    if(stamina){
    // Barre de stamina (verte) et étoiles
    const sf = p.hearts / p.maxHearts, blink = p.tired && (time * 4 | 0) % 2;
    bar(ctx, 40, 90, 260, 14, sf, blink ? '#f48fb1' : p.tired ? '#ec407a' : p.breathFx > 0 ? '#b9f6ca' : '#43e05a', '#0d2a12', false);
    ctx.font = '900 13px Nunito, sans-serif'; ctx.fillStyle = p.tired ? '#f48fb1' : '#b9f6ca'; ctx.fillText(p.tired ? 'ÉPUISÉ' : 'STAMINA', 316, 103);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < p.stars ? '#ffd54f' : 'rgba(255,255,255,.18)'; A.star(ctx, 60 + i * 38, 134, 16); ctx.fill(); if (i < p.stars) { ctx.strokeStyle = '#ff8f00'; ctx.lineWidth = 2; ctx.stroke(); } }
    for (let i = 0; i < p.kd; i++) { ctx.fillStyle = '#ef5350'; ctx.beginPath(); ctx.arc(190 + i * 22, 134, 8, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  };
  function drawHud(ctx) {
    const p = S.p, o = S.o, c = S.cfg;
    ctx.save();
    if(p.breathFx>0)p.breathFx-=1/60;
    F.drawPlayerHud(ctx,p,c.ch,S.time);
    // Adversaire (droite)
    ctx.textAlign = 'right'; ctx.font = '22px Bungee, Impact, sans-serif';
    const on = S.b.nick.toUpperCase(); ctx.fillStyle = '#000'; ctx.fillText(on, W - 28, 42); ctx.fillStyle = o.rage ? '#ff5252' : '#fff'; ctx.fillText(on, W - 30, 40);
    bar(ctx, W - 440, 52, 400, 26, o.hp / o.maxHp, hpCol(o.hp / o.maxHp), '#3a0d0d', true);
    if(o.frost>0){ctx.font='900 14px Nunito';ctx.fillStyle='#95eaff';ctx.fillText('❄ RALENTI '+Math.ceil(o.frost)+' s',W-230,107);}
    for (let i = 0; i < o.kd; i++) { ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(W - 46 - i * 22, 107, 8, 0, 7); ctx.fill(); }
    ctx.font='900 14px Nunito';ctx.fillStyle='#f4d28c';
    if(S.b.starFinish)ctx.fillText('★ UPPERCUT ÉTOILÉ POUR LA CHUTE',W-40,132);
    if(S.b.sprinter)ctx.fillText(['PRESSION MAXIMALE','LE SOUFFLE BAISSE','ÉPUISÉ · À TOI D’ATTAQUER'][S.round-1],W-40,132);
    if(p.commandProgress?.count>=2){ctx.textAlign='left';ctx.font='900 14px Nunito';ctx.fillStyle='#e3c7ff';ctx.fillText(p.commandProgress.name+' · '+p.commandProgress.count+' / '+p.commandProgress.total,40,173);}
    // Horloge
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,.65)'; A.rr(ctx, W / 2 - 78, 14, 156, 82, 14); ctx.fill(); ctx.strokeStyle = S.cfg.circuit.color; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = S.cfg.circuit.color; ctx.font = '18px Bungee, Impact'; ctx.fillText('ROUND ' + S.round, W / 2, 40);
    const cl = Math.max(0, Math.ceil(S.clock)); ctx.fillStyle = cl <= 20 && S.phase === 'fight' ? '#ff8a80' : '#fff'; ctx.font = '38px Bungee, Impact'; ctx.fillText(Math.floor(cl / 60) + ':' + String(cl % 60).padStart(2, '0'), W / 2, 84);
    if (p.tie > 0) { ctx.fillStyle = '#f48fb1'; ctx.font = '900 26px Nunito'; ctx.fillText('🧶 Gants attachés : martèle Z / X ! (' + p.tie + ')', W / 2, 140); }
    if (F.paused) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
  function drawOpponentStatus(ctx){
    const o=S.o,T=S.time;if(['down','ko','getup'].includes(o.st))return;
    const effects=[['burn','#ff8a38','BRÛLURE'],['frost','#9aefff','RALENTI'],['weaken','#d6adff','FORCE −35 %'],['confused','#a6ffda','CONFUS']];
    let row=0;ctx.save();ctx.textAlign='center';
    for(const [key,color,label] of effects){if(!(o[key]>0))continue;
      ctx.strokeStyle=ctx.fillStyle=color;ctx.lineWidth=3;
      for(let i=0;i<(key==='burn'?0:7);i++){
        const a=T*3+i*Math.PI*2/7,x=OX+Math.cos(a)*125,y=OY-160+Math.sin(a)*30;
        ctx.beginPath();
        if(key==='confused'){ctx.font='bold 25px Nunito';ctx.fillText('?',x,y);}
        else if(key==='frost'){ctx.moveTo(x,OY+40);ctx.lineTo(x-10,OY+12);ctx.lineTo(x+10,OY+12);ctx.closePath();ctx.stroke();}
        else {ctx.moveTo(x,y+70);ctx.lineTo(x-9,y+86);ctx.lineTo(x+6,y+84);ctx.lineTo(x-4,y+104);ctx.stroke();}
      }
      ctx.font='bold 17px Nunito';ctx.fillText(label+' '+Math.ceil(o[key])+' s',OX,150+row++*22);
    }ctx.restore();
  }
  F.drawBodyImpact=(ctx,hit,time)=>{
    const age=time-hit.at,duration=.34;if(age<0||age>duration)return;
    const u=age/duration,r=(24+Math.sin(Math.min(1,u*2)*Math.PI/2)*38)*(1+(hit.power||0)*.25);
    ctx.save();ctx.translate(hit.x,hit.y);ctx.globalAlpha=(1-u)*.95;
    ctx.fillStyle='#fff2a0';ctx.strokeStyle='#ed922d';ctx.lineWidth=3;ctx.beginPath();
    for(let i=0;i<20;i++){const a=i*Math.PI/10,rr=i%2?r*.45:r;const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.7;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';A.ell(ctx,0,0,15*(1-u)+3,10*(1-u)+3);ctx.fill();
    ctx.strokeStyle='#ffe19b';ctx.lineWidth=4*(1-u)+1;ctx.beginPath();ctx.ellipse(0,0,30+u*80,18+u*48,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r+9),Math.sin(a)*(r+9)*.7);ctx.lineTo(Math.cos(a)*(r+28+u*30),Math.sin(a)*(r+28+u*30)*.7);ctx.stroke();}
    ctx.restore();
  };
  function drawElementImpact(ctx){
    const hit=S.elementHit;if(!hit)return;const e=hit.t/hit.dur,r=25+e*110;
    ctx.save();ctx.translate(hit.x,hit.y);ctx.globalAlpha=1-e;ctx.lineWidth=5;
    const colors={fire:'#ff9b38',ice:'#9aeeff',lightning:'#e5c4ff',wind:'#b5ffdc'};ctx.strokeStyle=ctx.fillStyle=colors[hit.kind];
    for(let i=0;i<10;i++){
      ctx.save();ctx.rotate(i*Math.PI/5+e*.4);
      if(hit.kind==='ice'){ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(r+24,-9);ctx.lineTo(r+49,0);ctx.lineTo(r+24,9);ctx.closePath();ctx.fill();}
      else if(hit.kind==='lightning'){ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(r*.55,-13);ctx.lineTo(r*.45,8);ctx.lineTo(r+36,0);ctx.stroke();}
      else if(hit.kind==='fire'){ctx.beginPath();ctx.moveTo(r*.5,-10);ctx.quadraticCurveTo(r+30,-30,r+45,0);ctx.quadraticCurveTo(r+10,22,r*.5,10);ctx.fill();}
      else {ctx.beginPath();ctx.ellipse(0,0,r+15,r*.4,i*.1,0,Math.PI*.8);ctx.stroke();}
      ctx.restore();
    }
    ctx.restore();
  }
  function drawMsgs(ctx) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const m of S.msgs) {
      const a = Math.min(1, (m.dur - m.t) * 4), pop = m.t < .15 ? .6 + m.t / .15 * .5 : m.t < .25 ? 1.1 - (m.t - .15) : 1;
      ctx.globalAlpha = a; ctx.save(); ctx.translate(W / 2, m.y); ctx.scale(pop, pop);
      ctx.font = m.size + 'px Bungee, Impact, sans-serif'; ctx.lineWidth = Math.max(4, m.size / 9); ctx.strokeStyle = '#140a26'; ctx.lineJoin = 'round';
      ctx.strokeText(m.text, 0, 0, W - 60); ctx.fillStyle = m.col; ctx.fillText(m.text, 0, 0, W - 60); ctx.restore();
    }
    ctx.restore();
  }
  function drawCount(ctx) {
    const c = S.count, p = S.p; if (c.tko) return;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (c.n > 0) { const pop = 1 + Math.max(0, .3 - c.t) * 1.5; ctx.translate(W / 2, 260); ctx.scale(pop, pop); ctx.font = '170px Bungee, Impact'; ctx.lineWidth = 14; ctx.strokeStyle = '#140a26'; ctx.strokeText(c.n, 0, 0); ctx.fillStyle = c.who === 'p' ? '#ff8a80' : '#ffd54f'; ctx.fillText(c.n, 0, 0); ctx.setTransform(ctx.getTransform()); }
    ctx.restore();
    if (c.who === 'p' && !c.done) {
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillStyle='rgba(0,0,0,.8)';A.rr(ctx,24,480,310,104,14);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='900 22px Nunito';ctx.textAlign='center';ctx.fillText('Z / X : relève-toi !',179,518);
      ctx.fillStyle='#30434a';A.rr(ctx,42,538,274,22,6);ctx.fill();ctx.fillStyle='#81c784';A.rr(ctx,42,538,274*Math.min(1,p.mash/p.need),22,6);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='900 15px Nunito';ctx.fillText(Math.floor(100*Math.min(1,p.mash/p.need))+' %',179,555);
      ctx.restore();
    }
  }
  function drawHelp(ctx, a) {
    ctx.save(); ctx.globalAlpha = a * .92;
    const x = W - 330, y = H - 205;
    ctx.fillStyle = 'rgba(10,6,30,.82)'; A.rr(ctx, x, y, 310, 190, 16); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffd54f'; ctx.font = '16px Bungee, Impact'; ctx.textAlign = 'left'; ctx.fillText('CONTRÔLES', x + 16, y + 28);
    ctx.font = '800 17px Nunito, sans-serif'; ctx.fillStyle = '#fff';
    ['← →   esquiver', '↓   garde (maintenir)   ↓↓   se pencher', 'Z / X   coup gauche / droit (au corps)', '↑ + Z / X   coup au visage', 'Espace   uppercut ★ (si tu as des étoiles)', 'Échap   pause'].forEach((l, i) => ctx.fillText(l, x + 16, y + 56 + i * 23));
    ctx.restore();
  }

  // Outils de test
  F.debug = {
    crowd: text => { if (S) crowdComment(text); },
    S: () => S, K,
    oppMove: id => { S.o.queue = []; startMove(id); },
    hpO: v => { S.o.hp = v; }, hpP: v => { S.p.hp = v; },
    stars: n => { S.p.stars = n; },
    phase: () => S.phase,
    end: win => finish(win, 'K.O.'),
    toCorner: () => { S.clock = .01; },
  };
})(window);
