// Frigo Snap — comportements des créatures : vie quotidienne, appâts, réactions aux outils et comportements secrets.
(function (FS) {
  'use strict';
  const TAU = Math.PI * 2;
  const EAT_T = 4.5;

  // ---- base : promenade autour du chez-soi, gourmandise, réactions génériques
  const Base = {
    init(c, run) { c.vars.wait = 1 + run.rng() * 4; c.wander = c.wander == null ? 3.5 : c.wander; if (c.opts.patrol) { c.vars.patrolI = 0; } },
    rest(c, run) { c.setPose('idle'); c.vars.wait = 2 + run.rng() * 4; c.target = null; },
    // la créature a terminé son repas
    eatDone(c, bait, run) { c.eaten++; },
    update(c, dt, run) {
      // repas en cours ou en route vers un croûton
      if (c.bait) {
        if (c.bait.dead) { c.bait = null; this.rest(c, run); return; }
        if (c.pose === 'eat') { if (c.poseT >= (c.sp.eatT || EAT_T)) { const b = c.bait; b.eaters = b.eaters.filter(e => e !== c); if (!b.eaters.length) b.dead = true; c.bait = null; this.eatDone(c, b, run); if (c.pose === 'eat') this.rest(c, run); } return; }
        if (c.pose === 'walk' || c.pose === 'peek' || c.pose === 'idle' || c.pose === 'hidden' || c.pose === 'sleep') {
          const b = c.bait, dx = b.x - c.x, dz = b.z - c.z, d = Math.hypot(dx, dz);
          if (c.sp.flying) c.y += (Math.max(0.6, b.y + 0.3) - c.y) * Math.min(1, dt * 1.5);
          if (d > c.sp.r * 0.8 + 0.6) { c.pose = 'walk'; c.walkTo(b.x - dx / d * (c.sp.r * 0.6 + 0.5), b.z - dz / d * (c.sp.r * 0.6 + 0.5), dt); }
          else { c.faceTo(b.x, b.z); c.setPose('eat'); if (!b.eaters.includes(c)) b.eaters.push(c); run.emit({ type: 'eat', creature: c }); }
        }
        return;
      }
      if (c.pose !== 'idle' && c.pose !== 'walk') return;
      if (c.pose === 'idle') { c.vars.wait -= dt; if (c.vars.wait <= 0) this.pickTarget(c, run); if (!c.target) return; c.pose = 'walk'; }
      if (c.target && c.walkTo(c.target.x, c.target.z, dt)) { c.target = null; this.rest(c, run); }
    },
    pickTarget(c, run) {
      if (c.sp.speed <= 0) { c.vars.wait = 3 + run.rng() * 3; return; }
      if (c.opts.patrol) { c.vars.patrolI = (c.vars.patrolI + 1) % c.opts.patrol.length; const p = c.opts.patrol[c.vars.patrolI]; c.target = { x: p[0], z: p[1] }; return; }
      const a = run.rng() * TAU, r = run.rng() * c.wander; c.target = { x: c.home.x + Math.sin(a) * r, z: c.home.z + Math.cos(a) * r };
    },
    onBaitNear(c, b, run) { if (!c.sp.gourmand || c.pose === 'special' || c.pose === 'react' || c.bait) return; if (b.eaters.length >= 2 && c.spId !== 'pois') return; c.bait = b; c.target = null; },
    onBaitHit(c, b, run) { this.onBaitNear(c, b, run); },
    onTabasco(c, run) { if (c.pose === 'special') return; c.bait = null; c.setPose('react', 2.2); run.emit({ type: 'react', creature: c, kind: 'startled' }); },
    onClic(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.faceTo(run.cam.x, run.cam.z); c.setPose('react', 2.5); run.emit({ type: 'react', creature: c, kind: 'alert' }); },
    onFlash(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'dazzled' }); },
  };
  const ext = (o) => Object.assign(Object.create(Base), o);
  const B = FS.Behaviours = { default: Base };

  // ---- Cornichon Ninja : se cache derrière une carotte, sort furtivement ; pyramide sur le bocal qui sonne
  B.cornichon = ext({
    init(c, run) { Base.init.call(this, c, run); c.vars.hide = c.opts.hideAt ? { x: c.opts.hideAt[0], z: c.opts.hideAt[1] } : { x: c.home.x, z: c.home.z }; c.x = c.vars.hide.x; c.z = c.vars.hide.z; c.setPose('hidden'); c.vars.wait = 2 + run.rng() * 3; },
    rest(c, run) { c.target = null; c.setPose('hidden'); c.vars.wait = 3 + run.rng() * 4; },
    update(c, dt, run) {
      if (c.pose === 'hidden') { if (c.bait) { c.pose = 'walk'; } else { c.vars.wait -= dt; if (c.vars.wait <= 0) { c.setPose('peek', 1.8, (c) => { c.pose = 'walk'; const a = run.rng() * TAU; c.target = { x: c.home.x + Math.sin(a) * 3, z: c.home.z + Math.cos(a) * 3 }; c.vars.steps = 0; }); c.faceTo(run.cam.x, run.cam.z); } return; } }
      if (c.pose === 'walk' && !c.bait) {
        if (!c.target) { c.target = c.vars.hide; c.vars.back = true; }
        if (c.walkTo(c.target.x, c.target.z, dt)) { if (c.vars.back) { c.vars.back = false; c.target = null; this.rest(c, run); } else { c.target = c.vars.hide; c.vars.back = true; } }
        return;
      }
      if (c.pose === 'special') { // pyramide sur le couvercle
        const b = c.vars.pyr; if (!b) return; const P = b.pos; c.x += (P.x - c.x) * Math.min(1, dt * 6); c.z += (P.z - c.z) * Math.min(1, dt * 6); c.y += (P.y - c.y) * Math.min(1, dt * 6); c.faceTo(run.cam.x, run.cam.z); return;
      }
      Base.update.call(this, c, dt, run);
    },
    onRing(c, bocal, run) { // appelé par le bocal
      if (c.dist(bocal) > 14) return;
      const mates = run.byId('cornichon').filter(o => o.dist(bocal) <= 14).sort((a, b) => a.id - b.id); const i = mates.indexOf(c); if (i > 2) return;
      const top = bocal.sp.h * bocal.scale, ox = [-0.55, 0.55, 0][i], oy = [0, 0, 0.95][i];
      c.bait = null; c.target = null; c.visible = true;
      c.vars.pyr = { pos: { x: bocal.x + ox, z: bocal.z - 0.2, y: top + oy } };
      c.setPose('special', 7.5, (c) => { c.y = 0; c.vars.pyr = null; c.pose = 'walk'; c.target = c.vars.hide; c.vars.back = true; });
      run.emit({ type: 'special', creature: c, kind: 'pyramid' });
    },
    onTabasco(c, run) { if (c.pose === 'hidden') { c.pose = 'walk'; c.target = null; } Base.onTabasco.call(this, c, run); c.next = (c) => { c.pose = 'walk'; c.target = c.vars.hide; c.vars.back = true; }; },
  });

  // ---- Bocal Hermétique : se dandine ; sonne quand un croûton frappe son couvercle ; le couvercle s'envole au clic
  B.bocal = ext({
    init(c, run) { Base.init.call(this, c, run); c.sp = Object.assign({}, c.sp, { noFace: true }); c.wander = 1.2; },
    onBaitHit(c, b, run) { b.dead = true; if (c.pose === 'special') return; c.vars.rung = 12; c.setPose('react', 4); run.emit({ type: 'react', creature: c, kind: 'ring' }); for (const k of run.byId('cornichon')) B.cornichon.onRing(k, c, run); },
    update(c, dt, run) { if (c.vars.rung > 0) c.vars.rung -= dt; Base.update.call(this, c, dt, run); },
    onClic(c, run) { if (c.pose === 'special') return; if (c.vars.rung > 0) { c.vars.rung = 0; c.setPose('special', 7); run.emit({ type: 'special', creature: c, kind: 'fountain' }); } else { c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'wobble' }); } },
    onTabasco(c, run) { if (c.pose === 'special') return; c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'wobble' }); },
    onFlash() {},
  });

  // ---- Moisissurex : vit sur un pot ; danse au clic ; disco au flash pendant la danse
  B.moisissurex = ext({
    init(c, run) { Base.init.call(this, c, run); c.sp = Object.assign({}, c.sp, { noFace: true }); },
    pickTarget(c, run) { c.setPose('peek', 2.2); c.vars.wait = 5 + run.rng() * 4; },
    onClic(c, run) { if (c.pose === 'special') return; c.vars.dancing = true; c.setPose('react', 6, (c) => { c.vars.dancing = false; c.setPose('idle'); c.vars.wait = 4; }); run.emit({ type: 'react', creature: c, kind: 'dance' }); },
    onFlash(c, run) { if (c.pose === 'special') return; if (c.vars.dancing) { c.vars.dancing = false; c.setPose('special', 7); run.emit({ type: 'special', creature: c, kind: 'disco' }); } else { c.setPose('react', 3); run.emit({ type: 'react', creature: c, kind: 'glow' }); } },
    onTabasco(c, run) { if (c.pose === 'special') return; c.setPose('react', 2.5); run.emit({ type: 'react', creature: c, kind: 'shiver' }); },
  });

  // ---- Ketchup-Rex et Moutarde-Raptor : duel western si le croûton tombe pile entre les deux
  const duel = (c, b, run) => {
    const other = c.spId === 'ketchup' ? 'moutarde' : 'ketchup';
    for (const o of run.byId(other)) {
      if (o.pose === 'special' || c.dist(o) > 16) continue;
      const mx = (c.x + o.x) / 2, mz = (c.z + o.z) / 2;
      if (Math.hypot(b.x - mx, b.z - mz) <= 3.5) {
        b.dead = true;
        for (const k of [c, o]) { k.bait = null; k.target = null; k.vars.duel = { x: mx, z: mz, other: k === c ? o : c }; k.setPose('special', 7.5, (k) => { k.vars.duel = null; B.default.rest(k, run); }); }
        run.emit({ type: 'special', creature: c, kind: 'duel', other: o });
        return true;
      }
    }
    return false;
  };
  const sauceUpdate = function (c, dt, run) {
    if (c.pose === 'special' && c.vars.duel) { const d = c.vars.duel, o = d.other; const dx = o.x - c.x, dz = o.z - c.z, dist = Math.hypot(dx, dz); if (dist > 7) { c.walkTo(c.x + dx / dist * 1, c.z + dz / dist * 1, dt); } c.faceTo(o.x, o.z); return; }
    Base.update.call(this, c, dt, run);
  };
  B.ketchup = ext({
    update: sauceUpdate,
    onBaitNear(c, b, run) { if (c.pose === 'special') return; if (!duel(c, b, run)) Base.onBaitNear.call(this, c, b, run); },
    onTabasco(c, run) { if (c.pose === 'special') return; c.bait = null; c.setPose('react', 3); run.emit({ type: 'react', creature: c, kind: 'spit' }); },
  });
  B.moutarde = ext({
    update: sauceUpdate,
    onBaitNear(c, b, run) { if (c.pose === 'special') return; if (!duel(c, b, run)) Base.onBaitNear.call(this, c, b, run); },
    onTabasco(c, run) { if (c.pose === 'special') return; c.bait = null; c.setPose('react', 3); run.emit({ type: 'react', creature: c, kind: 'sneeze' }); for (const m of run.byId('miette')) if (m.dist(c) < 18) B.miette.scare(m, run); },
  });

  // ---- Rongeur de Mie : caché dans le sac de pain, sort grignoter ; trois croûtons = brioche volante
  B.miette = ext({
    init(c, run) { Base.init.call(this, c, run); c.vars.hide = { x: c.opts.hideAt[0], z: c.opts.hideAt[1] }; this.hide(c, run); },
    hide(c, run) { c.visible = false; c.x = c.vars.hide.x; c.z = c.vars.hide.z; c.y = 0; c.setPose('hidden'); c.vars.wait = 6 + run.rng() * 5; c.target = null; },
    emerge(c, run) { c.visible = true; c.y = 0; c.setPose('walk'); const a = run.rng() * TAU; c.target = { x: c.home.x + Math.sin(a) * 5, z: c.home.z + Math.cos(a) * 5 }; c.vars.out = 6; },
    rest(c, run) { if (c.visible && c.vars.out > 0) { c.setPose('peek', 1.6, (c) => { c.pose = 'walk'; const a = run.rng() * TAU; c.target = { x: c.home.x + Math.sin(a) * 5, z: c.home.z + Math.cos(a) * 5 }; }); } else { c.pose = 'walk'; c.target = c.vars.hide; c.vars.back = true; } },
    update(c, dt, run) {
      if (c.pose === 'hidden') { c.vars.wait -= dt; if (c.vars.wait <= 0 || c.bait) this.emerge(c, run); return; }
      if (c.pose === 'special') { c.y = Math.min(3.5, c.y + dt * 0.6); c.x += Math.sin(c.anim * 2) * dt * 0.4; return; }
      if (!c.bait) c.vars.out -= dt;
      if (c.pose === 'walk' && c.vars.back && !c.bait) { if (c.walkTo(c.target.x, c.target.z, dt)) { c.vars.back = false; this.hide(c, run); } return; }
      Base.update.call(this, c, dt, run);
    },
    eatDone(c, b, run) { c.eaten++; if (c.eaten % 3 === 0) { c.setPose('special', 8, (c) => { c.scale = 1; c.y = 0; this.hide(c, run); }); c.scale = 1.6; run.emit({ type: 'special', creature: c, kind: 'bloat' }); } else c.vars.out = 6; },
    scare(c, run) { if (c.pose === 'hidden') { this.emerge(c, run); } if (c.pose !== 'special') { c.setPose('react', 2, (c) => { c.pose = 'walk'; c.vars.out = 5; }); run.emit({ type: 'react', creature: c, kind: 'startled' }); } },
    onTabasco(c, run) { this.scare(c, run); },
    onFlash(c, run) { if (c.visible) this.scare(c, run); },
    onClic(c, run) { if (c.visible) Base.onClic.call(this, c, run); },
  });

  // ---- Œuf-Ninja : six œufs endormis ; chaîne croûton (3e œuf) → Tabasco → clic = Omelette Suprême ailée
  B.oeuf = ext({
    init(c, run) { Base.init.call(this, c, run); c.sp = Object.assign({}, c.sp); c.setPose('sleep'); c.vars.wait = 3 + run.rng() * 6; c.vars.stage = 0; },
    rest(c, run) { if (c.vars.stage === 1) c.setPose('react'); else if (c.vars.stage === 2) c.setPose('react'); else { c.setPose('sleep'); c.vars.wait = 4 + run.rng() * 6; } },
    update(c, dt, run) {
      if (c.pose === 'special') { // l'omelette (œuf 0) monte en spirale, les autres sont absorbés
        const o = c.vars.om; if (!o) return; const t = c.poseT; if (c.opts.idx === 0) { c.scale = 2.4; c.x = o.x + Math.sin(t * 2.2) * 1.4; c.z = o.z + Math.cos(t * 2.2) * 1.4; c.y = Math.min(4.5, 0.5 + t * 0.55); c.yaw = Math.atan2(run.cam.x - c.x, run.cam.z - c.z); } else { c.visible = false; }
        return;
      }
      if (c.vars.stage > 0) { c.vars.stageT -= dt; if (c.vars.stageT <= 0) { c.vars.stage = 0; this.rest(c, run); } return; }
      if (c.pose === 'sleep') { c.vars.wait -= dt; if (c.vars.wait <= 0) { c.setPose('peek', 2); c.faceTo(run.cam.x, run.cam.z); } }
    },
    onBaitHit(c, b, run) { b.dead = true; if (c.opts.idx === 2 && c.vars.stage === 0 && c.pose !== 'special') { c.vars.stage = 1; c.vars.stageT = 25; c.setPose('react'); run.emit({ type: 'react', creature: c, kind: 'crack' }); } else if (c.pose !== 'special') { c.setPose('react', 1.5); run.emit({ type: 'react', creature: c, kind: 'wobble' }); } },
    onBaitNear() {},
    onTabasco(c, run) { if (c.pose === 'special') return; if (c.opts.idx === 2 && c.vars.stage === 1) { c.vars.stage = 2; c.vars.stageT = 25; c.setPose('react'); run.emit({ type: 'react', creature: c, kind: 'steam' }); } else { c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'wobble' }); } },
    onClic(c, run) {
      if (c.pose === 'special') return;
      if (c.opts.idx === 2 && c.vars.stage === 2) {
        const eggs = run.byId('oeuf'); const cx = eggs.reduce((s, e) => s + e.home.x, 0) / eggs.length, cz = eggs.reduce((s, e) => s + e.home.z, 0) / eggs.length;
        for (const e of eggs) { e.vars.stage = 0; e.vars.om = { x: cx, z: cz }; e.setPose('special', 10, (e) => { e.vars.om = null; e.visible = true; e.scale = 1; e.x = e.home.x; e.z = e.home.z; e.y = 0; e.setPose('sleep'); e.vars.wait = 5; }); }
        run.emit({ type: 'special', creature: eggs[0], kind: 'omelette' });
      } else if (c.vars.stage === 0) { c.setPose('react', 1.8); c.faceTo(run.cam.x, run.cam.z); run.emit({ type: 'react', creature: c, kind: 'startled' }); }
    },
    onFlash(c, run) { if (c.pose === 'special' || c.vars.stage) return; c.setPose('react', 1.5); run.emit({ type: 'react', creature: c, kind: 'startled' }); },
  });

  // ---- Limace de Beurre : glisse ; fond au Tabasco ; grésille au flash pendant la fonte
  B.beurre = ext({
    rest(c, run) { c.setPose('idle'); c.vars.wait = 0.8 + run.rng() * 1.5; c.target = null; },
    onTabasco(c, run) { if (c.pose === 'special') return; c.bait = null; c.vars.melting = true; c.setPose('react', 7, (c) => { c.vars.melting = false; B.default.rest(c, run); }); run.emit({ type: 'react', creature: c, kind: 'melt' }); },
    onFlash(c, run) { if (c.pose === 'special') return; if (c.vars.melting) { c.vars.melting = false; c.setPose('special', 7); run.emit({ type: 'special', creature: c, kind: 'sizzle' }); } else Base.onFlash.call(this, c, run); },
    onClic(c, run) { if (c.pose === 'special' || c.vars.melting) return; c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'shiver' }); },
  });

  // ---- Olive-Cyclope : épie depuis le bocal, sort grignoter ; cancan synchronisé au clic
  B.olive = ext({
    init(c, run) { Base.init.call(this, c, run); c.vars.jar = { x: c.opts.jar[0], z: c.opts.jar[1] }; this.inJar(c, run); },
    inJar(c, run) { c.y = 2.2; c.x = c.vars.jar.x + (c.home.x - c.vars.jar.x) * 0.8; c.z = c.vars.jar.z + (c.home.z - c.vars.jar.z) * 0.8; c.setPose('hidden'); c.vars.wait = 2 + run.rng() * 5; c.target = null; c.faceTo(run.cam.x, run.cam.z); },
    rest(c, run) { if (c.y > 1) this.inJar(c, run); else { c.pose = 'walk'; c.target = { x: c.vars.jar.x + 1.6, z: c.vars.jar.z + 0.8 }; c.vars.back = true; } },
    update(c, dt, run) {
      if (c.pose === 'hidden') { if (c.bait) { c.y = 0; c.x = c.vars.jar.x + 1.6; c.z = c.vars.jar.z + 0.8; c.pose = 'walk'; return; } c.vars.wait -= dt; c.faceTo(run.cam.x, run.cam.z); if (c.vars.wait <= 0) c.setPose('peek', 2.2); return; }
      if (c.pose === 'special') { c.y = 2.6; c.faceTo(run.cam.x, run.cam.z); return; }
      if (c.pose === 'walk' && c.vars.back && !c.bait) { if (c.walkTo(c.target.x, c.target.z, dt)) { c.vars.back = false; this.inJar(c, run); } return; }
      Base.update.call(this, c, dt, run);
    },
    onClic(c, run) { if (c.pose === 'special') return; c.bait = null; c.target = null; const i = run.byId('olive').filter(o => o.vars.jar.x === c.vars.jar.x).indexOf(c); c.x = c.vars.jar.x + (i - 1) * 0.9; c.z = c.vars.jar.z - 0.9; c.setPose('special', 7, (c) => this.inJar(c, run)); if (i === 0) run.emit({ type: 'special', creature: c, kind: 'cancan' }); },
    onTabasco(c, run) { if (c.pose === 'special') return; c.setPose('react', 3, (c) => this.rest(c, run)); run.emit({ type: 'react', creature: c, kind: 'tears' }); },
    onFlash(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.setPose('react', 2, (c) => this.rest(c, run)); run.emit({ type: 'react', creature: c, kind: 'blink' }); },
  });

  // ---- Yéti-Roquefort : dort en boule ; deux Tabasco dans les narines = éternuement de spores
  B.yeti = ext({
    init(c, run) { Base.init.call(this, c, run); c.setPose('sleep'); c.vars.hits = 0; c.vars.hitT = 0; c.wander = 2.5; },
    rest(c, run) { c.target = null; if (c.vars.awake > 0) { c.setPose('idle'); c.vars.wait = 2 + run.rng() * 2; } else { c.walkTo(c.home.x, c.home.z, 0); c.setPose('sleep'); } },
    update(c, dt, run) {
      if (c.vars.hitT > 0) { c.vars.hitT -= dt; if (c.vars.hitT <= 0) c.vars.hits = 0; }
      if (c.vars.awake > 0) { c.vars.awake -= dt; if (c.vars.awake <= 0 && (c.pose === 'idle' || c.pose === 'walk') && !c.bait) { c.pose = 'walk'; c.target = { x: c.home.x, z: c.home.z }; c.vars.goHome = true; } }
      if (c.pose === 'sleep') { if (c.bait) { c.vars.awake = 12; c.pose = 'walk'; } else return; }
      if (c.vars.goHome && c.pose === 'walk' && !c.bait) { if (c.walkTo(c.target.x, c.target.z, dt)) { c.vars.goHome = false; c.target = null; c.yaw = c.opts.facing || 0; c.setPose('sleep'); } return; }
      Base.update.call(this, c, dt, run);
    },
    eatDone(c, b, run) { c.eaten++; c.vars.awake = 10; },
    onTabasco(c, run) {
      if (c.pose === 'special') return; c.bait = null; c.vars.awake = 12; c.vars.hits++; c.vars.hitT = 10;
      if (c.vars.hits >= 2) { c.vars.hits = 0; c.faceTo(run.cam.x, run.cam.z); c.setPose('special', 7.5, (c) => { c.setPose('idle'); c.vars.wait = 2; }); run.emit({ type: 'special', creature: c, kind: 'sneeze' }); }
      else { c.faceTo(run.cam.x, run.cam.z); c.setPose('react', 3.5, (c) => { c.setPose('idle'); c.vars.wait = 2; }); run.emit({ type: 'react', creature: c, kind: 'grumpy' }); }
    },
    onClic(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.vars.awake = Math.max(c.vars.awake || 0, 8); c.faceTo(run.cam.x, run.cam.z); c.setPose('react', 3, (c) => { c.setPose('idle'); c.vars.wait = 2; }); run.emit({ type: 'react', creature: c, kind: 'yawn' }); },
    onFlash(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.vars.awake = Math.max(c.vars.awake || 0, 6); c.setPose('react', 2.5, (c) => { c.setPose('idle'); c.vars.wait = 2; }); run.emit({ type: 'react', creature: c, kind: 'dazzled' }); },
  });

  // ---- Spaghetti-Méduse : flotte ; s'illumine en spirale au flash
  B.meduse = ext({
    init(c, run) { Base.init.call(this, c, run); c.sp = Object.assign({}, c.sp, { noFace: true }); },
    update(c, dt, run) {
      if (c.pose === 'special') { c.y = c.baseY + 0.8 + Math.sin(c.poseT * 3) * 0.5; c.x = c.vars.sx + Math.sin(c.poseT * 2.5) * 1.2; c.z = c.vars.sz + Math.cos(c.poseT * 2.5) * 1.2; return; }
      if (!c.bait && c.pose !== 'react') c.y += (c.baseY + Math.sin(c.anim * 1.3) * 0.35 - c.y) * Math.min(1, dt * 2);
      Base.update.call(this, c, dt, run);
    },
    onFlash(c, run) { if (c.pose === 'special') return; c.bait = null; c.vars.sx = c.x; c.vars.sz = c.z; c.setPose('special', 7, (c) => { c.x = c.vars.sx; c.z = c.vars.sz; B.default.rest(c, run); }); run.emit({ type: 'special', creature: c, kind: 'glow' }); },
    onTabasco(c, run) { if (c.pose === 'special') return; c.bait = null; c.setPose('react', 3); run.emit({ type: 'react', creature: c, kind: 'inflame' }); },
    onClic(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'jiggle' }); },
  });

  // ---- Léviathan-Surgelé : une nageoire dans le givre ; brise la banquise au clic
  B.leviathan = ext({
    init(c, run) { Base.init.call(this, c, run); c.setPose('hidden'); c.vars.wait = 4; c.vars.cool = 0; },
    rest(c, run) { c.setPose('hidden'); c.vars.wait = 6 + run.rng() * 6; },
    update(c, dt, run) { if (c.vars.cool > 0) c.vars.cool -= dt; if (c.pose === 'hidden') { c.vars.wait -= dt; if (c.vars.wait <= 0) c.setPose('peek', 2.5); } },
    onClic(c, run) {
      if (c.pose === 'special' || c.vars.cool > 0) { return; }
      c.vars.cool = 25; c.faceTo(run.cam.x, run.cam.z); c.setPose('special', 7, (c) => this.rest(c, run)); run.emit({ type: 'special', creature: c, kind: 'breach' });
      for (const p of run.byId('pois')) if (p.dist(c) < 24) B.pois.panic(p, c, run);
    },
    onTabasco(c, run) { if (c.pose === 'special') return; c.setPose('react', 3); run.emit({ type: 'react', creature: c, kind: 'ripple' }); },
    onFlash(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.setPose('react', 2.5); run.emit({ type: 'react', creature: c, kind: 'eye' }); },
    onBaitNear() {},
  });

  // ---- Céleri-Girafe : broute les glaçons ; deux sur le même croûton = bisou givré
  B.celeri = ext({
    rest(c, run) { c.target = null; if (run.rng() < 0.5) { c.setPose('eat', 3 + run.rng() * 2); } else { c.setPose('idle'); c.vars.wait = 1 + run.rng() * 2; } },
    update(c, dt, run) {
      if (c.pose === 'special') { const o = c.vars.kiss; if (o) c.faceTo(o.x, o.z); return; }
      if (c.pose === 'eat' && c.bait) { for (const o of c.bait.eaters) if (o !== c && o.spId === 'celeri' && o.pose === 'eat' && o.poseT > 1 && c.poseT > 1) { c.bait.dead = true; for (const k of [c, o]) { k.bait = null; k.vars.kiss = k === c ? o : c; k.setPose('special', 6.5, (k) => { k.vars.kiss = null; this.rest(k, run); }); } run.emit({ type: 'special', creature: c, kind: 'kiss', other: o }); return; } }
      Base.update.call(this, c, dt, run);
    },
    onBaitNear(c, b, run) { if (c.pose === 'special' || c.pose === 'react' || c.bait) return; if (b.eaters.length >= 2) return; c.bait = b; c.target = null; c.pose = 'walk'; },
    onTabasco(c, run) { if (c.pose === 'special') return; c.bait = null; c.setPose('react', 3); run.emit({ type: 'react', creature: c, kind: 'sneeze' }); },
    onClic(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.bait = null; c.faceTo(run.cam.x, run.cam.z); c.setPose('react', 3); run.emit({ type: 'react', creature: c, kind: 'alert' }); },
  });

  // ---- Petit-Pois Pingouin : colonie qui se dandine ; glissade au clic ; tour tremblante quand le Léviathan surgit
  B.pois = ext({
    init(c, run) { Base.init.call(this, c, run); c.wander = 3; },
    update(c, dt, run) {
      if (c.pose === 'special') { const T = c.vars.tower; if (T) { c.x += (T.x - c.x) * Math.min(1, dt * 5); c.z += (T.z - c.z) * Math.min(1, dt * 5); c.y += (T.y - c.y) * Math.min(1, dt * 4); c.faceTo(run.cam.x, run.cam.z); } return; }
      if (c.pose === 'react' && c.vars.slide) { c.x += Math.sin(c.yaw) * dt * 4; c.z += Math.cos(c.yaw) * dt * 4; return; }
      Base.update.call(this, c, dt, run);
    },
    panic(c, lev, run) {
      const herd = run.byId('pois').filter(p => p.dist(lev) < 24).sort((a, b) => a.id - b.id); const i = herd.indexOf(c); if (i < 0) return;
      const cx = herd.reduce((s, p) => s + p.home.x, 0) / herd.length, cz = herd.reduce((s, p) => s + p.home.z, 0) / herd.length;
      c.bait = null; c.target = null; c.vars.tower = { x: cx + (i % 2 ? 0.15 : -0.15) * (i > 0 ? 1 : 0), z: cz, y: i * 0.62 };
      c.setPose('special', 8, (c) => { c.vars.tower = null; c.y = 0; B.default.rest(c, run); }); if (i === 0) run.emit({ type: 'special', creature: c, kind: 'tower' });
    },
    onClic(c, run) { if (c.pose === 'special') return; c.bait = null; c.vars.slide = true; c.setPose('react', 2.5, (c) => { c.vars.slide = false; B.default.rest(c, run); }); run.emit({ type: 'react', creature: c, kind: 'slide' }); },
    onTabasco(c, run) { if (c.pose === 'special') return; c.bait = null; c.vars.slide = true; c.yaw = run.rng() * TAU; c.setPose('react', 2, (c) => { c.vars.slide = false; B.default.rest(c, run); }); run.emit({ type: 'react', creature: c, kind: 'scatter' }); },
  });

  // ---- Sorbet-Volcan : couvercle qui respire ; éruption au Tabasco ; fontaine de cerises au clic pendant l'éruption
  B.sorbet = ext({
    init(c, run) { Base.init.call(this, c, run); c.sp = Object.assign({}, c.sp, { noFace: true }); },
    pickTarget(c, run) { c.setPose('peek', 2.5); c.vars.wait = 4 + run.rng() * 4; },
    onTabasco(c, run) { if (c.pose === 'special') return; c.vars.erupt = true; c.setPose('react', 7, (c) => { c.vars.erupt = false; B.default.rest(c, run); }); run.emit({ type: 'react', creature: c, kind: 'erupt' }); },
    onClic(c, run) { if (c.pose === 'special') return; if (c.vars.erupt) { c.vars.erupt = false; c.setPose('special', 7.5); run.emit({ type: 'special', creature: c, kind: 'fountain' }); } else { c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'rumble' }); } },
    onFlash(c, run) { if (c.pose === 'special' || c.pose === 'react') return; c.setPose('react', 2); run.emit({ type: 'react', creature: c, kind: 'dazzled' }); },
    onBaitNear() {},
  });
})(window.FS);
