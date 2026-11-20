// Goblin Malin — évolutions : gobelin → hobgobelin (nom véritable) → chaman ou assassin ; le chef : hobgobelin puis Goblin Lord.
'use strict';
(function (CG) {
  const G = CG.G, Evo = CG.Evo = {};
  Evo.CLASS_LVL = 8;                    // niveau d'un hobgobelin pour choisir sa voie
  Evo.CHIEF = [10, 25];                  // niveaux du chef : hobgobelin, puis Goblin Lord
  Evo.COST = { food: 30, or: 40 };
  Evo.CLASSES = {
    chaman: { nom: 'Chaman', nomF: 'Chamane', icon: '🔮', desc: 'La voie de la magie : soigne ceux qui l\'entourent et lance des esprits sur les ennemis.' },
    assassin: { nom: 'Assassin', nomF: 'Assassine', icon: '🗡️', desc: 'La voie de l\'ombre : très rapide, frappe très fort, et les ennemis ne le remarquent presque jamais.' }
  };
  const fem = g => g.sex === 'f';
  Evo.nom = g => g.cls ? (fem(g) ? Evo.CLASSES[g.cls].nomF : Evo.CLASSES[g.cls].nom) : g.nomme ? 'Hobgobelin' + (fem(g) ? 'e' : '') : '';

  // ---------- le choix de la voie (dans la discussion, seulement quand le hobgobelin est prêt) ----------
  Evo.opt = function (g) {
    if (!g.nomme || g.cls || g.child) return [];
    if (g.classing) return [{ label: Evo.CLASSES[g.classing].icon + ' Sa voie : ' + Evo.CLASSES[g.classing].nom, sub: 'Le changement se fera pendant la nuit : tu verras demain matin', disabled: true }];
    if (g.lvl < Evo.CLASS_LVL) return [];
    return [{ label: '✨ Choisir sa voie', sub: g.name + ' est prêt' + (fem(g) ? 'e' : '') + ' à évoluer encore', fn: () => Evo.dialog(g) }];
  };
  Evo.dialog = function (g) {
    const S = CG.S, c = Evo.COST, why = S.res.food < c.food ? 'Il te manque de la nourriture.' : S.res.or < c.or ? 'Il te manque de l\'or.' : '';
    CG.UI.dialog({ goblin: g, who: g.name, tag: '✨ sa voie', text: 'Quelle voie pour ' + g.name + ' ? Ça coûte ' + c.food + ' 🍖 et ' + c.or + ' 🪙, et c\'est pour toujours. Le changement se fera pendant la nuit.' + (why ? ' ' + why : ''),
      options: Object.keys(Evo.CLASSES).map(k => { const C = Evo.CLASSES[k]; return { label: C.icon + ' ' + (fem(g) ? C.nomF : C.nom), sub: C.desc, disabled: !!why, fn: () => {
        S.res.food -= c.food; S.res.or -= c.or; g.classing = k; G.text(g.x, g.y - 50, '✨', '#fff', true); G.puff(g.x, g.y - 18, k === 'chaman' ? '#2dd4bf' : '#a855f7', 14, 80, 3); CG.sfx('spell');
        CG.UI.toast(C.icon + ' ' + g.name + ' a choisi sa voie. Rien ne change pour l\'instant...'); CG.UI.close();
      } }; }).concat([{ label: 'Pas maintenant' }]) });
  };
  // pendant la nuit, avec les noms
  const an = G.applyNames;
  G.applyNames = function (lines) {
    const nouveaux = CG.S.goblins.filter(g => g.naming && !g.child);
    an.apply(this, arguments); Evo.chiefNight(lines);
    if (Evo.hasMount()) nouveaux.forEach(g => { if (Math.random() < Evo.RIDER_CHANCE) Evo.makeRider(g, lines); });
    CG.S.goblins.forEach(g => { if (!g.classing) return; g.cls = g.classing; g.classing = null; g.hp = G.gobMaxHp(g); if (lines) lines.push(Evo.CLASSES[g.cls].icon + ' ' + g.name + ' s\'est réveillé' + (fem(g) ? 'e' : '') + ' transformé' + (fem(g) ? 'e' : '') + ' : c\'est maintenant ' + (fem(g) ? 'une ' + Evo.CLASSES[g.cls].nomF : 'un ' + Evo.CLASSES[g.cls].nom) + ' !'); });
  };

  // ---------- les bonus ----------
  G.evoSpd = g => g.cls === 'loup' ? 1.3 : g.cls === 'assassin' ? 1.4 : g.cls ? 1.15 : g.nomme ? 1.12 : 1;
  const mh = G.gobMaxHp; G.gobMaxHp = g => Math.round(mh(g) * (g.cls === 'loup' ? 1.7 : g.cls === 'assassin' ? 1.15 : g.cls ? 1.3 : 1));
  const gd = G.guardDmg; G.guardDmg = g => gd(g) * (g.cls === 'loup' ? 1.5 : g.cls === 'assassin' ? 1.9 : g.cls ? 1.15 : 1);
  const ws = G.workSpeed; G.workSpeed = g => ws(g) * (g.cls === 'assassin' ? 1.2 : 1);
  // chamans et assassins défendent le village comme des gardes
  const mi = G.militia; G.militia = g => (!!g.cls && !!CG.R.event && CG.R.event.type === 'attack' && g.job !== 'garde' && g.koNight !== CG.S.day && !g.child) || mi(g);

  // le chaman : un esprit sur l'ennemi le plus proche, un soin pour le plus blessé de ses voisins
  const up = G.update;
  G.update = function (dt) {
    up.apply(this, arguments);
    const S = CG.S, R = CG.R; if (!S || R.night) return;
    for (const g of S.goblins) {
      if (g.cls !== 'chaman' || g.hidden || g.ko === true) continue;
      g.chA = (g.chA || 0) - dt; g.chH = (g.chH || 2) - dt;
      if (g.chA <= 0) {
        g.chA = 0.4; let tg = null, bd = 270;
        for (const e of R.enemies) { if (e.dead || e.struct || e.calm || (e.wild && !e.target)) continue; const d = CG.dist(g, e); if (d < bd && CG.W.lineClear(g.x, g.y, e.x, e.y)) { bd = d; tg = e; } }
        if (tg) { g.chA = 1.7; g.atkAnim = 1; g.face = tg.x > g.x ? 1 : -1; G.shoot({ x: g.x, y: g.y - 10 }, tg, 'bolt', 5 + g.lvl * 1.6, 'g', g); if (CG.onScreen(g.x, g.y)) CG.sfx('zap'); }
      }
      if (g.chH <= 0) {
        g.chH = 4.5; let who = null, worst = 0.999; const p = S.player;
        const see = (o, hp, max) => { if (CG.dist(g, o) < 180 && hp / max < worst) { worst = hp / max; who = o; } };
        S.goblins.forEach(o => { if (!o.hidden && o.ko !== true) see(o, o.hp, G.gobMaxHp(o)); }); S.pets.forEach(a => { if (!a.ko) see(a, a.hp, CG.P.maxHp(a)); }); if (R.ko <= 0) see(p, p.hp, p.maxhp);
        if (who) { const n = 4 + g.lvl; who.hp = Math.min(who === p ? p.maxhp : who.pet ? CG.P.maxHp(who) : G.gobMaxHp(who), who.hp + n); G.text(who.x, who.y - 46, '+' + n, '#8dff9a'); G.puff(who.x, who.y - 18, '#2dd4bf', 6, 60, 3); }
      }
    }
  };

  // ---------- le chef : hobgobelin, puis Goblin Lord ----------
  Evo.chefStage = () => (CG.S && CG.S.chefEvo) || 0;
  Evo.chefCls = () => [null, 'hob', 'lord'][Evo.chefStage()];
  Evo.chefScale = () => [1, 1.1, 1.14][Evo.chefStage()];
  Evo.chefNom = () => ['Gobelin', 'Hobgobelin', 'Goblin Lord'][Evo.chefStage()];
  Evo.chief = function () { /* plus rien sur le coup : le corps du chef change pendant la nuit, comme pour les autres */ };
  Evo.chiefNight = function (lines) {
    const show = true, S = CG.S, R = CG.R, p = S.player, want = p.lvl >= Math.max(Evo.CHIEF[1], CG.seuilEvo(null) + 1) ? 2 : p.lvl >= CG.seuilEvo(null) ? 1 : 0; // la première évolution arrive à un niveau tiré au sort (evogob.js)
    while ((S.chefEvo || 0) < want) {
      S.chefEvo = (S.chefEvo || 0) + 1; const lord = S.chefEvo === 2;
      p.maxhp += lord ? 40 : 25; p.hp += lord ? 40 : 25; p.maxmp += lord ? 20 : 10; p.mp += lord ? 20 : 10;
      // même visage, mêmes réglages : la peau tourne à l'orangé, le corps grandit et s'épaissit. Pas de retour à la création du personnage.
      const A8 = CG.Art8, old = Object.assign({}, A8.chiefLook()), neu = Evo.bake(old, S.chefEvo); A8.setChiefLook(neu);
      S.morale = Math.min(100, S.morale + (lord ? 10 : 5)); R.evoShow = { stage: S.chefEvo, old: (R.evoShow && R.evoShow.old) || old, neu };
      if (lines) lines.push('✨ Pendant la nuit, ton corps a changé : tu te réveilles ' + (lord ? 'Goblin Lord' : 'Hobgobelin') + ' ! Plus grand, plus fort, et le clan est fier de toi.');
    }
  };
  // les réglages du chef changent avec son corps : le hobgobelin est plus massif, le Goblin Lord plus grand et plus élancé
  Evo.bake = function (old, stage) {
    const A8 = CG.Art8, R = A8.RANGES, F = A8.FORMS, cur = stage === 2 ? F.lord : F.hob, prev = stage === 2 && old.stage === 1 ? F.hob : {};
    const L = Object.assign({}, old), cl = (k, v) => Math.max(R[k][0], Math.min(R[k][1], v));
    L.base = old.base || Object.assign({}, old); delete L.base.base;
    for (const k in cur) L[k] = cl(k, (old[k] || A8.DEF[k]) * cur[k] / (prev[k] || 1));
    for (const k in prev) if (!(k in cur)) L[k] = cl(k, (old[k] || A8.DEF[k]) / prev[k]);
    if (!old.stage) L.hue = old.hue2 || A8.DEF.hue2; L.hue2 = L.hue; L.stage = stage;
    if (stage === 2) { L.teeth = L.teeth === 'crocs' ? 'deux' : L.teeth; }
    return L;
  };
  // au réveil : la grande scène de transformation d'abord, le résumé de la nuit ensuite
  // il n'y a plus de bilan au réveil : la scène de transformation se joue donc dès que le jour se lève
  { const nd0 = CG.D.nextDay; CG.D.nextDay = function () { const r = nd0.apply(this, arguments), R = CG.R, ev = R && R.evoShow; if (ev && CG.Accueil && CG.Accueil.evolve) { R.evoShow = null; if (CG.UI.modal) CG.UI.close(); CG.Accueil.evolve(ev.stage, ev.old, ev.neu, null); } return r; }; }
  const sum0 = CG.UI.summary; CG.UI.summary = function () { const R = CG.R, ev = R && R.evoShow, a = arguments; if (!ev || !(CG.Accueil && CG.Accueil.evolve)) return sum0.apply(this, a); R.evoShow = null; CG.Accueil.evolve(ev.stage, ev.old, ev.neu, () => sum0.apply(CG.UI, a)); };
  const pd = G.playerDmg; G.playerDmg = () => pd() * [1, 1.2, 1.45][Evo.chefStage()];
})(window.CG);
// le chef évolué marche aussi plus vite
(function (CG) { const G = CG.G, hm = G.heroMul; if (hm) G.heroMul = () => hm() * [1, 1.08, 1.15][CG.Evo.chefStage()]; })(window.CG);

// ---------- les chevaucheurs de loup : une meute à part ----------
(function (CG) {
  const G = CG.G, W = CG.W, Evo = CG.Evo, T = CG.TILE, dist = CG.dist, rand = CG.rand;
  Evo.PACK_CHESTS = 3;                  // la meute n'ouvre pas plus de trois coffres par jour
  Evo.RIDER_CHANCE = 0.4;               // une fois le nom reçu, si le clan a apprivoisé un loup (ou une bête du même genre)
  Evo.MOUNTS = ['loup', 'felin', 'ours'];
  Evo.hasMount = () => CG.S.pets.some(p => Evo.MOUNTS.includes(p.kind));
  CG.JOBS.chevaucheur = { nom: 'Chevaucheur de loup', nomF: 'Chevaucheuse de loup', icon: '🐺', desc: 'Parcourt le monde avec sa meute : explore, ouvre les coffres, attaque les ennemis qu\'il croise et défend le village.' };
  if (CG.LINES) CG.LINES.chevaucheur = ['Mon loup et moi, on ne fait qu\'un.', 'La meute a flairé quelque chose à l\'est.', 'Un coffre ? On y va, on revient. Tu ne nous verras même pas partir.', 'Si le village est attaqué, on arrive au galop.'];
  if (CG.Art.JOBCOL) CG.Art.JOBCOL.chevaucheur = '#7a5230';
  Evo.CLASSES.loup = { nom: 'Chevaucheur de loup', nomF: 'Chevaucheuse de loup', icon: '🐺', desc: '' };
  Evo.makeRider = function (g, lines) {
    g.jobs = g.jobs || {}; g.jobs[g.job] = { lvl: g.lvl, xp: g.xp }; g.cls = 'loup'; g.job = 'chevaucheur'; G.resetGoblin(g); g.hp = G.gobMaxHp(g);
    if (lines) lines.push('🐺 Pendant la nuit, un loup est venu se coucher près de ' + g.name + '. Au matin, ' + (g.sex === 'f' ? 'elle' : 'il') + ' est monté' + (g.sex === 'f' ? 'e' : '') + ' dessus : le clan a ' + (g.sex === 'f' ? 'une Chevaucheuse' : 'un Chevaucheur') + ' de loup !');
  };
  const opts0 = Evo.opt; Evo.opt = g => g.cls === 'loup' ? [] : opts0(g);

  // ce que la meute trouve dans un coffre va droit dans les réserves du clan
  function loot(g, goal) {
    const S = CG.S, p = S.player, got = [], gain = (r, n) => { G.gain(r, n, g.x, g.y - 30 - got.length * 16); got.push(n + ' ' + CG.RES[r].icon); };
    if (goal.i !== undefined) {
      if (S.chests.includes(goal.i)) return; S.chests.push(goal.i); const l = W.chestDefs[goal.i].loot || {};
      if (l.or) gain('or', l.or); if (l.minerai) gain('minerai', l.minerai);
      if (l.potion) { p.potions += l.potion; got.push(l.potion + ' 🧪'); }
      if (l.scroll) { S.res.or += 30; got.push('30 🪙'); }
    } else {
      const c = goal.c; if (c.open) return; c.open = true; const d = S.day;
      gain('or', Math.round((8 + d * 2) * (c.kind === 'precieux' || c.kind === 'butin' ? 2 : 1)));
      if (c.kind === 'vivres') gain('food', 10 + d); else if (c.kind === 'magique') { p.potions += 1; got.push('1 🧪'); } else gain('bois', 6 + d);
    }
    CG.sfx('coin'); G.puff(g.x, g.y - 20, '#ffe36b', 16, 110, 3); G.gobXp(g, 3, 12);
    CG.UI.toast('🐺 La meute de ' + g.name + ' a ouvert un coffre : ' + got.join(', ') + '.');
  }
  const pack = () => CG.S.goblins.filter(o => o.cls === 'loup' && !o.hidden && o.koNight !== CG.S.day);
  function look(g) { if (!CG.Scout) return; const F = CG.S.found || (CG.S.found = {}); let n = 0; for (const t of CG.Scout.targets()) if (!F[t.key] && dist(g, t) < 200 && CG.Scout.reveal(t, g.name, n * 2)) n++; }
  Evo.rider = function (g, dt) {
    const S = CG.S, R = CG.R, fire = G.firePos(), max = G.gobMaxHp(g);
    if (g.koNight === S.day) { if (g.hp < max) g.hp = Math.min(max, g.hp + dt * 0.8); return false; } // assommé aujourd'hui : il se repose au village
    // un ennemi tout près : toute la meute lui tombe dessus
    if (g.hp > max * 0.3) {
      let tg = null, bd = 240; for (const e of R.enemies) { if (e.dead || e.calm) continue; const d = dist(g, e); if (d < bd) { bd = d; tg = e; } }
      if (tg) { G.guardFight(g, tg, bd, dt); return true; }
    }
    if (g.state === 'fight') { g.state = 'idle'; g.path = null; g.melee = false; g.timer = 0.5; }
    if (!['idle', 'rGo', 'rOpen', 'rHome', 'rFollow'].includes(g.state)) { g.state = 'idle'; g.timer = 0.5; }
    g.scanT = (g.scanT || 0) - dt; if (g.scanT <= 0) { g.scanT = 0.6; look(g); }
    // le soir, ou trop blessé : retour au village
    if (S.hour >= 17.5 || g.hp < max * 0.35 || (g.state === 'rHome' && g.hp < max * 0.8)) {
      if (dist(g, fire) > 230) { if (g.state !== 'rHome' || !g.path) { if (!G.goTo(g, fire.x + rand(-70, 70), fire.y + rand(60, 110))) return false; g.state = 'rHome'; } G.follow(g, 100, dt); return true; }
      g.state = 'rHome'; g.moving = false; if (g.hp < max) g.hp = Math.min(max, g.hp + dt * 1.5); return S.hour < 17.5;
    }
    const P = pack(), lead = P[0];
    if (lead && g !== lead) { // les autres suivent le premier de la meute
      const i = P.indexOf(g), d = dist(g, lead); g.rT = (g.rT || 0) - dt;
      if (d > 80) { if (g.rT <= 0 || !g.path) { g.rT = 0.7; G.goTo(g, lead.x + (i % 2 ? 1 : -1) * 34 * Math.ceil(i / 2), lead.y + 22 * Math.ceil(i / 2)); } g.state = 'rFollow'; if (g.path) G.follow(g, 104, dt); }
      else { g.state = 'idle'; g.moving = false; g.face = lead.face; }
      return true;
    }
    if (g.state === 'rHome') { g.state = 'idle'; g.timer = 1; }
    if (g.state === 'idle') {
      g.moving = false; g.timer -= dt; if (g.timer > 0) return true;
      const goals = [], M = S.meute && S.meute.d === S.day ? S.meute : (S.meute = { d: S.day, n: 0 });
      if (M.n < Evo.PACK_CHESTS) W.chestDefs.forEach((c, i) => { if (!S.chests.includes(i)) { const p = W.center(c.x, c.y); goals.push({ i, x: p.x, y: p.y }); } });
      if (M.n < Evo.PACK_CHESTS) for (const c of R.chests) if (!c.open) goals.push({ c, x: c.x, y: c.y });
      goals.sort((a, b) => dist(g, a) - dist(g, b));
      for (const go of goals.slice(0, 4)) { if (g.skip && g.skip[go.x + ':' + go.y] > R.t) continue; for (const o of [[0, 30], [30, 0], [-30, 0], [0, -30]]) if (W.walkPx(go.x + o[0], go.y + o[1]) && G.goTo(g, go.x + o[0], go.y + o[1])) { g.goal = go; g.state = 'rGo'; return true; } (g.skip || (g.skip = {}))[go.x + ':' + go.y] = R.t + 120; }
      for (let k = 0; k < 8; k++) { const x = rand(4, CG.MW - 4) * T, y = rand(4, CG.MH - 4) * T; if (Math.hypot(x - fire.x, y - fire.y) > 420 && W.walkPx(x, y) && G.goTo(g, x, y)) { g.goal = null; g.state = 'rGo'; return true; } }
      g.timer = 2; return true;
    }
    if (g.state === 'rGo') { if (G.follow(g, 100, dt)) { g.state = g.goal ? 'rOpen' : 'idle'; g.timer = g.goal ? 5 : rand(6, 12); } return true; }
    if (g.state === 'rOpen') { g.moving = false; g.pose = 'work'; g.timer -= dt; if (g.timer <= 0) { loot(g, g.goal); if (S.meute) S.meute.n++; g.goal = null; g.pose = null; g.state = 'idle'; g.timer = rand(8, 14); } return true; }
    return true;
  };
})(window.CG);
