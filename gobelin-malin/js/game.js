// Clan Gobelin — état de la partie, gobelins, joueur, ennemis, combat, sorts.
'use strict';
(function (CG) {
  const T = CG.TILE, W = CG.W, G = CG.G = {};
  const dist = CG.dist, rand = CG.rand, pick = CG.pick;
  let S, R;

  // ---------- création ----------
  G.newState = function (name) {
    const seed = Math.floor(Math.random() * 1e9);
    S = CG.S = {
      v: 1, seed, name: name || 'Grizz', day: 1, hour: 6, morale: 70, nextId: 1,
      res: { food: 60, bois: 30, minerai: 8, cuir: 4, or: 25 },
      policy: { epee: 'equiper', arc: 'equiper', armure: 'equiper' },
      player: { hp: 60, maxhp: 60, mp: 30, maxmp: 30, lvl: 1, xp: 0, weapon: 0, armor: 0, spells: [], scrolls: {}, potions: 3 },
      goblins: [], pets: [], buildings: [], cuts: [], logs: [], young: [], tech: { points: 0, owned: {} }, chests: [], stats: { kills: 0, sold: 0 }
    };
    const B = (type, tx, ty, w, h, variant) => S.buildings.push({ type, tx, ty, w, h, variant: variant || 0 });
    B('fire', W.CX, W.CY, 1, 1); B('chief', 50, 30, 3, 2); B('stock', 43, 33, 2, 1);
    [[42, 31], [53, 38]].forEach(([x, y], i) => B('hut', x, y, 2, 2, i % 3));
    const jobs = ['cueilleur', 'chasseur', 'bucheron', 'garde', 'aucun']; // l'essentiel dès le départ : manger, du bois, un garde, un bricoleur pour bâtir
    const sexes = CG.shuffle(['f', 'm', 'f', 'm', Math.random() < 0.5 ? 'f' : 'm']);
    jobs.forEach((j, i) => { const g = G.addGoblin(sexes[i], j); g.talent = j; G.makeApt(g); g.hp = G.gobMaxHp(g); g.met = true; }); // tes compagnons de toujours : pas besoin de présentations // chacun fait déjà ce qu'il fait le mieux
    return S;
  };
  G.huts = () => S.buildings.filter(b => b.type === 'hut' && !b.site);
  G.capacity = () => G.huts().length * G.hutCap();
  G.count = type => S.buildings.filter(b => b.type === type && !b.site).length;
  G.door = b => b ? { x: (b.tx + b.w / 2) * T, y: (b.ty + b.h) * T + 16 } : (() => { const p = CG.S.player, q = p.x !== undefined ? { x: p.x, y: p.y } : CG.Mondes.devantPortail(); return { x: q.x, y: q.y - 10 }; })(); // pas encore de hutte (au marais, en arrivant) : on reste où l'on est
  G.find = type => S.buildings.find(b => b.type === type);
  G.firePos = () => W.center(W.CX, W.CY);
  G.addGoblin = function (sex, job) {
    const used = new Set(S.goblins.map(g => g.name)), pool = (sex === 'f' ? CG.NAMES_F : CG.NAMES_M).filter(n => !used.has(n));
    const huts = S.buildings.map((b, i) => b.type === 'hut' ? i : -1).filter(i => i >= 0);
    const load = i => S.goblins.filter(g => g.home === i).length;
    if (!huts.length) huts.push(S.buildings.findIndex(b => b.type === 'chief'));
    huts.sort((a, b) => load(a) - load(b));
    const g = { id: S.nextId++, name: pool.length ? pick(pool) : (sex === 'f' ? 'Gobette ' : 'Gob ') + S.nextId, sex, job, lvl: 1, xp: 0, hp: 1, home: huts[0], hue: 70 + Math.random() * 70, lum: 40 + Math.random() * 10, equip: {}, met: false, jobs: {} };
    G.makeBio(g);
    g.hp = G.gobMaxHp(g);
    const d = G.door(S.buildings[g.home]); g.x = d.x + rand(-20, 20); g.y = d.y + rand(0, 14);
    S.goblins.push(g); G.resetGoblin(g); return g;
  };
  G.copyCost = id => Math.round(CG.SPELLS[id].prix * 0.5);
  G.gobMaxHp = g => (g.job === 'garde' ? (42 + g.lvl * 9 + Math.min(2, G.count('caserne')) * 12) * (G.tech('d13') ? 1.25 : 1) : 20 + g.lvl * 3) + (g.equip.armure ? 15 : 0);
  G.resetGoblin = function (g) {
    if (R && g.tree !== undefined && g.tree !== null) R.reserved.delete(g.tree);
    if (g.log) { g.log.by = null; g.log = null; }
    g.siteB = null;
    g.state = 'idle'; g.timer = 0; g.path = null; g.carry = null; g.tree = null; g.node = null; g.hidden = false; g.pose = null; g.bubble = null;
    g.face = g.face || 1; g.step = g.step || 0; g.moving = false; g.atkCd = 0; g.atkAnim = 0; g.repath = 0; g.partyA = undefined;
  };

  G.initRuntime = function () {
    S = CG.S;
    R = CG.R = {
      t: 0, enemies: [], visitors: [], shots: [], parts: [], texts: [], bolts: [], delayed: [], rings: [],
      speech: [], chests: [], young: new Set(S.young || []), reserved: new Set(), alarm: false, event: null, schedule: [], spawnQ: [], fireLit: false, feast: false, eveningSaid: false,
      ko: 0, shield: 0, shieldT: 0, cri: 0, atkCd: 0, castCd: 0, swing: 0, build: null, banner: null, fade: 0, fadeDir: 0,
      dayStats: { food: 0, bois: 0, minerai: 0, cuir: 0, or: 0, kills: 0, morts: [] }, paused: false, dir: { x: 0, y: 1 }, cam: { x: 0, y: 0 }, chestsOpen: S.chests
    };
    S.pets = S.pets || []; S.pets.forEach(CG.P.reset);
    S.logs = S.logs || []; S.young = S.young || []; if (!S.tech) S.tech = { points: (S.player.lvl - 1) * 2, owned: {} };
    S.goblins.forEach(g => { if (!g.bio) { G.makeBio(g); g.met = true; } if (g.job === 'batisseur') g.job = 'aucun'; if (!g.apt || g.apt.aucun === undefined) { g.apt = null; G.makeApt(g); } g.jobs = g.jobs || {}; }); S.logs.forEach(l => { l.by = null; });
    W.generate(S.seed);
    S.cuts.forEach(i => { W.tile[i] = W.CLEAR; });
    S.terra = S.terra || {}; for (const k in S.terra) W.tile[k] = S.terra[k];
    S.buildings.forEach(b => {
      W.blockBuilding(b);
      if (['hut', 'chief', 'stock'].includes(b.type)) for (let x = -1; x <= b.w; x++) { const tx = b.tx + x, ty = b.ty + b.h; if (W.inMap(tx, ty) && W.tile[W.idx(tx, ty)] === W.TREE) W.tile[W.idx(tx, ty)] = W.GRASS; }
    });
    W.paint();
    S.goblins.forEach(g => { G.resetGoblin(g); });
    const p = S.player, d = G.door(G.find('chief')); if (p.x === undefined) { p.x = d.x; p.y = d.y + 10; } p.face = 1; p.step = 0;
  };

  // ---------- effets ----------
  // les couleurs des chiffres de dégâts : rouge pour ce que le chef subit, vert pour le poison, rouge vif pour le feu ; ce que le chef inflige garde sa couleur.
  // R.dmgCol est levé par celui qui applique un dégât de poison ou de feu, juste le temps de l'appel.
  CG.DMG = { subi: '#e63a3a', poison: '#6fe03a', feu: '#ff2800' };
  G.text = (x, y, txt, col, big) => R.texts.push({ x, y, txt, col: col || '#fff', life: 1.4, big });
  G.puff = function (x, y, col, n, spd, size) {
    for (let i = 0; i < (n || 6); i++) { const a = Math.random() * 6.283, v = rand(0.3, 1) * (spd || 70); R.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: rand(0.3, 0.7), max: 0.7, col, size: size || 3 }); }
  };
  G.banner = (txt, sub, col) => { R.banner = { txt, sub: sub || '', col: col || '#ffe9a8', t: 4.2 }; };
  G.gain = function (res, n, x, y) {
    S.res[res] = Math.max(0, S.res[res] + n);
    if (n > 0 && R.dayStats[res] !== undefined) R.dayStats[res] += n;
    if (x !== undefined) G.text(x, y, (n > 0 ? '+' : '') + n + ' ' + CG.RES[res].icon, n > 0 ? '#d8ffb0' : '#ff9a8a');
  };
  G.canPay = cost => Object.keys(cost).every(k => S.res[k] >= cost[k]);
  G.pay = cost => { Object.keys(cost).forEach(k => { S.res[k] -= cost[k]; }); };

  // ---------- déplacement ----------
  // Les gobelins marchent posément ; l'arbre des technologies leur donne des bonus permanents.
  const GOB = 0.55;
  G.evoSpd = e => 1; // remplacé dans evolution.js : hobgobelins et assassins marchent plus vite
  G.gobMul = () => 1 + (G.tech('b14') ? 0.15 : 0) + (G.tech('b15') ? 0.15 : 0) + (G.tech('b16') ? 0.2 : 0);
  G.heroMul = () => 1 + (G.tech('g3') ? 0.15 : 0) + (G.tech('g11') ? 0.15 : 0) + (G.tech('g12') ? 0.2 : 0);
  const onPath = e => W.tile[W.idx(CG.clamp(Math.floor(e.x / T), 0, CG.MW - 1), CG.clamp(Math.floor(e.y / T), 0, CG.MH - 1))] === W.PATH;
  function follow(e, spd, dt) { return follow0(e, e.job !== undefined ? spd * GOB * G.gobMul() * G.evoSpd(e) * (onPath(e) ? 1.2 * (G.cheminK ? G.cheminK(e) : 1) : 1) * (e.boost > 0 ? 1.7 : 1) : spd, dt); }
  function follow0(e, spd, dt) {
    if (!e.path || !e.path.length) { e.moving = false; return true; }
    const p = e.path[0], dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), st = spd * dt;
    if (d <= st) { e.x = p.x; e.y = p.y; e.path.shift(); }
    else if (d < 14 && e.path.length > 1) e.path.shift(); // point de passage : pas besoin d'y poser le pied
    else { e.x += dx / d * st; e.y += dy / d * st; if (Math.abs(dx) > 2) e.face = dx > 0 ? 1 : -1; }
    e.moving = true; e.step += dt * spd / 34;
    return e.path.length === 0;
  }
  function goTo(e, x, y) { e.path = W.path(e.x, e.y, x, y); return !!e.path; }
  const free = (x, y, r) => W.walkPx(x - r, y - r) && W.walkPx(x + r, y - r) && W.walkPx(x - r, y + r) && W.walkPx(x + r, y + r);
  function slide(e, mx, my, r) {
    r = r || 8; let moved = false;
    if (mx && free(e.x + mx, e.y, r)) { e.x += mx; moved = true; }
    if (my && free(e.x, e.y + my, r)) { e.y += my; moved = true; }
    return moved;
  }
  // Sort quelqu'un d'un mur : cherche en spirale le premier endroit où il tient en entier.
  G.unstick = function (e, r) {
    r = r || 9; if (free(e.x, e.y, r)) return false;
    for (let d = 6; d <= 200; d += 6) for (let a = 0; a < 16; a++) { const x = e.x + Math.cos(a * 0.3927) * d, y = e.y + Math.sin(a * 0.3927) * d; if (free(x, y, r)) { e.x = x; e.y = y; e.path = null; return true; } }
    return false;
  };
  // bulle de parole au-dessus de quelqu'un (delay : secondes avant qu'elle apparaisse)
  G.say = function (e, txt, dur, delay) { R.speech = R.speech.filter(s => s.e !== e || s.delay > 0); R.speech.push({ e, txt, t: dur || 3.5, delay: delay || 0 }); };
  G.slide = slide; G.follow = follow; G.follow0 = follow0; G.goTo = goTo; G.chase = (e, tx, ty, spd, dt) => chase(e, tx, ty, spd, dt);
  function chase(e, tx, ty, spd, dt) {
    e.repath -= dt; if (e.job !== undefined) spd *= GOB * G.gobMul() * G.evoSpd(e);
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
    if (d < 260 && W.lineClear(e.x, e.y, tx, ty)) {
      e.path = null; slide(e, dx / d * spd * dt, dy / d * spd * dt);
      e.moving = true; e.step += dt * spd / 34; if (Math.abs(dx) > 3) e.face = dx > 0 ? 1 : -1; return;
    }
    if (!e.path || !e.path.length || e.repath <= 0) { const ok = goTo(e, tx, ty); e.repath = 0.8 + Math.random() * 0.4; if (!ok && W.foe && e.event) e.siege = 1; }
    follow0(e, spd, dt);
  }

  // ---------- gobelins ----------
  const TOOLS = { cueilleur: 'panier', chasseur: 'arc', bucheron: 'hache', mineur: 'pioche', forgeron: 'marteau', arcier: 'couteau', tanneur: 'aiguille' };
  G.toolOf = function (g) {
    if (g.pose === 'drink') return 'chope';
    if (g.pose === 'dance' || g.pose === 'drum') return null;
    if (g.state === 'fight' && g.job !== 'garde') return TOOLS[g.job] || null;
    if (g.job === 'garde') return g.equip.arc && !g.melee ? 'arc' : g.equip.epee ? 'epee' : g.equip.baton ? 'lance' : null; /* sans arme : ses poings */
    if (g.state === 'build') return 'marteau';
    return g.state === 'work' || g.state === 'logWork' || g.job === 'chasseur' ? TOOLS[g.job] : null;
  };
  G.workSpeed = g => (g.boost > 0 ? 2 : g.pep > 0 ? 1.3 : 1) * (0.7 + S.morale / 100 * 0.6) * (1 + (g.lvl - 1) * 0.12) * (G.tech('b10') ? 1.25 : 1) * G.apt(g, g.job) * (CG.JOBS[g.job].craft && G.tech('b12') ? 1.3 : 1);
  G.partyTime = () => S.hour >= 19 && !R.alarm;
  function gobXp(g, n, cap) {
    if (g.nomme) cap += 3; // un hobgobelin peut monter plus haut
    if (g.lvl >= cap) return;
    if (G.xpGobMul) n *= G.xpGobMul(); // les cases « Bons élèves » de l'arbre (savoir.js)
    g.xp += n; const need = (g.job === 'garde' ? 36 : 12) * g.lvl; // deux fois plus long qu'avant
    if (g.xp >= need) { g.xp -= need; g.lvl++; if (R.dayStats) (R.dayStats.ups = R.dayStats.ups || []).push(g.name + ' (niv. ' + g.lvl + ')'); G.text(g.x, g.y - 44, g.name + ' niv. ' + g.lvl + ' !', '#ffe36b'); /* le chapeau ne se mérite plus au niveau 3 : il se coud à l'atelier */ }
  }
  G.gobXp = gobXp;
  function partyRole(g) { const r = (g.id * 37) % 20; return g.sex === 'f' ? (r < 15 ? 'dance' : 'drink') : (r < 3 ? 'drum' : r < 8 ? 'dance' : 'drink'); }
  function updateGoblin(g, dt) {
    g.atkCd -= dt; if (g.atkAnim > 0) g.atkAnim -= dt * 4;
    if (g.emoteT > 0) g.emoteT -= dt;
    if (g.boost > 0) { g.boost -= dt; if (!g.hidden && Math.random() < dt * 6) R.parts.push({ x: g.x - g.face * 8, y: g.y - 4, vx: rand(-10, 10), vy: rand(-26, -8), life: 0.4, max: 0.4, col: '#e8dcc0', size: 3, float: true }); }
    if (g.pep > 0) { g.pep -= dt; if (!g.hidden && Math.random() < dt * 2.5) R.parts.push({ x: g.x + rand(-8, 8), y: g.y - 30, vx: rand(-8, 8), vy: rand(-30, -14), life: 0.6, max: 0.6, col: '#b8ff8a', size: 2.5, float: true }); }
    if (g.exile) return G.exileStep(g, dt);
    const home = S.buildings[g.home], job = CG.JOBS[g.job], fire = G.firePos();
    if (R.talking === g && !R.alarm && CG.UI.modal && !CG.UI.modal.pauses) { g.moving = false; g.pose = null; g.face = S.player.x > g.x ? 1 : -1; return; }
    if (g.cine) { if (R.alarm) CG.Soc.endCine(); else { G.cineStep(g, dt); return; } }
    if (g.job === 'guerisseur' && G.healerStep(g, dt)) return; // à son poste, même pendant une attaque
    if (g.migre && CG.Mondes && CG.Mondes.step(g, dt)) return; // invité dans l'autre monde : il marche vers le portail
    if (g.demenage && CG.Demenager && CG.Demenager.step(g, dt)) return; // il suit le chef pour déménager dans l'autre monde (demenager.js)
    if (g.aide && CG.Aide && CG.Aide.step(g, dt)) return; // il est venu chercher le chef pour chasser un monstre (aide.js)
    if (g.job === 'chasseur' && CG.Gibier && CG.Gibier.defend(g, dt)) return; // un monstre approche : le chasseur lui tire dessus au lieu de se cacher (gibier.js)
    if (g.alerte > 0 && CG.Espion && CG.Espion.alerteStep(g, dt)) return; // il a vu un monstre de près : il lâche tout et rentre se cacher (espion.js)
    if ((g.chicane || g.crieur) && CG.Chicane && CG.Chicane.step(g, dt)) return; // il se bat avec un collègue, ou il court prévenir le chef (chicane.js)
    if (CG.Repli && CG.Repli.step(g, dt)) return; // presque mort : il quitte le combat, vers le guérisseur ou vers un abri (repli.js)
    // 1. alerte : les gardes se battent, les autres courent se cacher
    if (R.alarm && g.job !== 'garde' && !G.militia(g)) {
      if (g.hidden) return;
      if (g.state !== 'flee') { G.resetGoblin(g); g.state = 'flee'; g.refuge = G.shelter(g); const d = G.door(g.refuge); if (g.dehors) { const k = S.goblins.indexOf(g); d.x += ((k * 5) % 7 - 3) * 22; d.y += 8 + (k % 3) * 18; } /* pas de place : ils s'entassent devant la porte */ if (!goTo(g, d.x, d.y)) { const d0 = G.door(g.refuge); goTo(g, d0.x, d0.y); } g.bubble = '❗'; }
      if (follow(g, 130, dt)) { if (g.dehors) { g.moving = false; g.bubble = '😱'; if (Math.random() < dt * 0.4) g.state = 'idle'; /* plus de place nulle part : il attend devant la porte et retente sa chance */ } else { g.hidden = true; g.bubble = null; } }
      return;
    }
    if (G.sansFete && G.sansFete() && G.partyTime()) { // rien à manger ce soir : chacun rentre se coucher, la mine basse
      if (g.hidden) return;
      if (g.state !== 'dodo') { G.resetGoblin(g); g.state = 'dodo'; const d = G.door(home); goTo(g, d.x, d.y); g.bubble = '😞'; }
      if (follow(g, 80, dt)) { g.hidden = true; g.bubble = null; g.moving = false; }
      return;
    }
    if (g.hidden) { g.hidden = false; g.state = 'idle'; }
    if (g.state === 'flee') G.resetGoblin(g);
    if (g.perch && g.job !== 'garde' && !(g.job === 'eclaireur' && g.perch.type === 'affut')) G.unperch(g); /* l'éclaireur reste dans son affût (sinon il en sortait et y rentrait à chaque image, dans un nuage de feuilles) */
    if (g.job === 'garde' && G.towerStep(g, dt)) return; // sa priorité : monter dans une tour de guet libre
    if (g.job === 'garde' || G.militia(g)) {
      let tgt = null, bd = 1e9;
      for (const e of R.enemies) { if (e.dead || e.calm) continue; const d = dist(g, e), dv = dist(e, fire); if ((dv < 720 || d < 300) && d < bd) { bd = d; tgt = e; } }
      if (tgt) { guardFight(g, tgt, bd, dt); return; }
      if (g.state === 'fight') { g.state = 'idle'; g.path = null; g.melee = false; }
    }
    if (g.ask && G.askStep(g, dt)) return;
    // 2. la fête du soir
    if (G.partyTime()) {
      if (g.state !== 'party' && g.state !== 'toParty') {
        G.resetGoblin(g); g.state = 'toParty'; g.role = partyRole(g);
        const i = S.goblins.indexOf(g); g.partyA = i / S.goblins.length * 6.283; g.partyR = g.role === 'dance' ? 74 : 118 + (i % 3) * 16;
        goTo(g, fire.x + Math.cos(g.partyA) * g.partyR, fire.y + Math.sin(g.partyA) * g.partyR * 0.72);
      }
      if (g.state === 'toParty') { if (follow(g, 95, dt)) { g.state = 'party'; } return; }
      g.moving = false; g.pose = R.fireLit ? g.role : null; g.face = g.x < fire.x ? 1 : -1;
      if (g.role === 'dance' && R.fireLit) { // la ronde autour du feu
        g.partyA += dt * 0.35; const nx = fire.x + Math.cos(g.partyA) * g.partyR, ny = fire.y + Math.sin(g.partyA) * g.partyR * 0.72;
        if (W.walkPx(nx, ny)) { g.face = nx > g.x ? 1 : -1; g.x = nx; g.y = ny; }
      }
      return;
    }
    if (g.state === 'party' || g.state === 'toParty') G.resetGoblin(g);
    // 3. le travail
    if (CG.Paresse && CG.Paresse.step(g, dt)) return;
    if (CG.OutilsBase && CG.OutilsBase.step(g, dt)) return; // il va chercher (ou rendre) son outil à la réserve (outilsbase.js)
    g.pose = null;
    if (g.cls === 'loup' && CG.Evo.rider(g, dt)) return;
    if (g.job === 'eclaireur' && CG.Scout.step(g, dt)) return;
    if (g.job === 'alchimiste' && CG.Alchimie && CG.Alchimie.step(g, dt)) return; // au chaudron (alchimie.js)
    if (g.job === 'cueilleur' && CG.Potager && CG.Potager.step(g, dt)) return; // un potager plein passe avant les buissons (potager.js)
    if (g.job === 'chasseur' && CG.Gibier && CG.Gibier.step(g, dt)) return; // il traque le gibier à l'arc (gibier.js) ; sans gibier, le vieux terrain de chasse
    if (g.job === 'bucheron') { lumber(g, dt, job); return; }
    if (job.node || g.job === 'bucheron') {
      if (g.state === 'idle') {
        g.timer -= dt; if (g.timer > 0) return;
        if (g.job === 'bucheron') {
          const tr = W.findTree(R.reserved); if (!tr) { g.timer = 5; g.bubble = '❓'; return; }
          g.tree = W.idx(tr.x, tr.y); R.reserved.add(g.tree); g.node = tr;
          if (!goTo(g, tr.x * T + T / 2, tr.y * T + T / 2)) { g.timer = 2; return; }
        } else {
          const ns = W.nodes.filter(n => n.type === job.node && !n.gone); if (!ns.length) { g.timer = 5; g.bubble = '❓'; return; } g.node = pick(CG.Aide ? CG.Aide.ailleurs(g, ns) : ns);
          if (!goTo(g, g.node.x * T + T / 2 + rand(-14, 14), g.node.y * T + T / 2 + rand(4, 16))) { g.timer = 2; return; }
        }
        g.state = 'toNode'; g.bubble = null;
      } else if (g.state === 'toNode') {
        if (follow(g, 96, dt)) { g.state = 'work'; g.timer = job.work; g.face = g.node.x * T + T / 2 > g.x ? 1 : -1; }
      } else if (g.state === 'work') {
        g.moving = false; g.pose = 'work'; g.timer -= dt * G.workSpeed(g);
        if (g.job === 'bucheron' && Math.random() < dt * 2.5) { G.puff(g.x + g.face * 14, g.y - 16, '#c9a56b', 2, 50, 2.5); if (CG.onScreen(g.x, g.y)) CG.sfx('chop'); }
        if (g.timer <= 0) {
          if (g.job === 'bucheron') { W.cutTree(g.node.x, g.node.y); S.cuts.push(g.tree); R.reserved.delete(g.tree); g.tree = null; G.puff(g.node.x * T + T / 2, g.node.y * T, '#3a8a44', 14, 110, 5); }
          if (G.outilSuite && G.outilSuite(g)) return; /* un outil (outils.js) : il repart chercher sans rentrer */
          g.carry = g.job === 'bucheron' ? 'bois' : g.job === 'mineur' ? 'minerai' : g.job === 'chasseur' ? 'chasse' : 'baies';
          const st = G.dropPoint(g); goTo(g, st.x + rand(-24, 24), st.y + rand(-2, 8)); g.state = 'toStock'; g.pose = null;
        }
      } else if (g.state === 'toStock') {
        if (follow(g, 96, dt)) { let k = 0; const fois = G.outilVide ? G.outilVide(g) : 1; for (const r in job.gain) G.gain(r, (job.gain[r] + (CG.Allies && CG.Allies.bless('recolte') ? 1 : 0) + (r === 'food' && G.tech('b11') ? 1 : 0) + (r === 'minerai' && G.tech('b13') ? 1 : 0)) * fois, g.x, g.y - 30 - (k++) * 16); g.carry = null; gobXp(g, 1, 5); g.state = 'idle'; g.timer = 0.6; }
      }
      return;
    }
    if (job.craft) {
      if (g.state === 'idle') { const d = G.door((CG.Ateliers && CG.Ateliers.lieu(g)) || home); goTo(g, d.x + (g.id % 3 - 1) * 26, d.y + 6); g.state = 'toHome'; } // à son atelier s'il existe, sinon chez lui
      else if (g.state === 'toHome') { if (follow(g, 96, dt)) { g.state = 'wait'; g.timer = 0; } }
      else if (g.state === 'wait') {
        g.moving = false; g.timer -= dt; if (g.timer > 0) return;
        if (G.canPay(job.need)) { G.pay(job.need); g.state = 'work'; g.timer = job.work; g.bubble = null; }
        else { g.timer = 2; g.bubble = CG.RES[Object.keys(job.need).find(k => S.res[k] < job.need[k])].icon; }
      } else if (g.state === 'work') {
        g.pose = 'work'; g.timer -= dt * G.workSpeed(g);
        if (g.job === 'forgeron' && Math.random() < dt * 2) G.puff(g.x + g.face * 12, g.y - 12, '#ffb432', 2, 60, 2);
        if (g.timer <= 0) { G.crafted(g, job.craft); gobXp(g, 1, 5); g.state = 'wait'; g.timer = 0.8; g.pose = null; }
      }
      return;
    }
    if (g.job === 'aucun' && G.buildJob(g, dt)) return;
    // gardes en patrouille et gobelins sans métier
    if (g.state === 'idle') {
      g.moving = false; g.timer -= dt; if (g.timer > 0) return;
      const rr = g.job === 'garde' ? rand(180, 360) : rand(60, 200), a = Math.random() * 6.283;
      const x = fire.x + Math.cos(a) * rr, y = fire.y + Math.sin(a) * rr * 0.8;
      if (W.walkPx(x, y) && goTo(g, x, y)) g.state = 'walk'; else g.timer = 1;
    } else if (g.state === 'walk') { if (follow(g, g.job === 'garde' ? 70 : 50, dt)) { g.state = 'idle'; g.timer = rand(2, 6); } }
    else g.state = 'idle';
  }
  // Le bois se mérite : abattre l'arbre, le laisser tomber, fendre le tronc, rapporter une moitié, revenir chercher l'autre.
  function lumber(g, dt, job) {
    const chips = () => { if (Math.random() < dt * 2.5) { G.puff(g.x + g.face * 14, g.y - 12, '#c9a56b', 2, 50, 2.5); if (CG.onScreen(g.x, g.y)) CG.sfx('chop'); } };
    if (g.state === 'idle') {
      g.timer -= dt; if (g.timer > 0) return;
      // un tronc ou un arbre qu'on ne peut pas atteindre (clôture sans portail, repousse...) est mis de côté un moment : on passe au suivant au lieu de rester planté là
      let log = null, bd = 1e9;
      for (const l of S.logs) { if (l.by || l.ban > R.t) continue; const d = Math.hypot(l.tx * T - g.x, l.ty * T - g.y); if (d < bd) { bd = d; log = l; } }
      if (log) {
        if (!goTo(g, log.tx * T + T / 2 + rand(-8, 8), log.ty * T + T / 2 + 12) && !goTo(g, log.tx * T + T / 2, log.ty * T + T / 2)) { log.ban = R.t + 40; g.timer = 0.2; return; }
        log.by = g.id; g.log = log; g.state = 'toLog'; g.bubble = null; return;
      }
      if (R.treeBan) { R.treeBan = R.treeBan.filter(b => { if (b.t > R.t) return true; R.reserved.delete(b.i); return false; }); }
      const tr = W.findTree(R.reserved); if (!tr) { g.timer = 5; g.bubble = '❓'; return; }
      const ti = W.idx(tr.x, tr.y);
      if (!goTo(g, tr.x * T + T / 2, tr.y * T + T / 2)) { R.reserved.add(ti); (R.treeBan = R.treeBan || []).push({ i: ti, t: R.t + 40 }); g.timer = 0.3; return; }
      g.tree = ti; R.reserved.add(ti); g.node = tr;
      g.state = 'toNode'; g.bubble = null;
    } else if (g.state === 'toNode') {
      if (follow(g, 96, dt)) { g.state = 'work'; g.timer = job.work; g.face = g.node.x * T + T / 2 > g.x ? 1 : -1; }
    } else if (g.state === 'work') { // abattre
      g.moving = false; g.pose = 'work'; g.timer -= dt * G.workSpeed(g); chips();
      if (g.timer <= 0) {
        W.cutTree(g.node.x, g.node.y); S.cuts.push(g.tree); R.reserved.delete(g.tree); g.tree = null;
        const log = { tx: g.node.x, ty: g.node.y, halves: 2, cut: false, dir: g.face, fall: R.t, by: g.id }; S.logs.push(log); g.log = log;
        g.state = 'timber'; g.timer = 0.9; g.pose = null; if (CG.onScreen(g.x, g.y)) CG.sfx('swing');
      }
    } else if (g.state === 'timber') { // l'arbre tombe
      g.moving = false; g.timer -= dt;
      if (g.timer <= 0) { const l = g.log; G.puff((l.tx + 0.5 + l.dir * 0.7) * T, l.ty * T + T / 2, '#3a8a44', 14, 110, 5); if (CG.onScreen(g.x, g.y)) CG.sfx('hit'); g.state = 'logWork'; g.timer = 5; }
    } else if (g.state === 'toLog') {
      if (follow(g, 96, dt)) { g.state = 'logWork'; g.timer = g.log.cut ? 3 : 5; g.face = g.log.tx * T + T / 2 > g.x ? 1 : -1; }
    } else if (g.state === 'logWork') { // fendre le tronc, ou débiter la dernière moitié
      g.moving = false; g.pose = 'work'; g.timer -= dt * G.workSpeed(g); chips();
      if (g.timer <= 0) {
        const l = g.log; l.cut = true; l.halves--; l.by = null; g.log = null;
        if (l.halves <= 0) S.logs.splice(S.logs.indexOf(l), 1);
        if (G.outilSuite && G.outilSuite(g)) return;
        g.carry = 'bois'; g.pose = null; const st = G.dropPoint(g); goTo(g, st.x + rand(-24, 24), st.y + rand(-2, 8)); g.state = 'toStock';
      }
    } else if (g.state === 'toStock') {
      if (follow(g, 96, dt)) { G.gain('bois', (job.gain.bois + (G.count('scierie') ? 1 : 0)) * (G.outilVide ? G.outilVide(g) : 1), g.x, g.y - 30); g.carry = null; gobXp(g, 1, 5); g.state = 'idle'; g.timer = 0.4; }
    } else g.state = 'idle';
  }
  // la réserve ou le dépôt le plus proche
  G.dropPoint = function (g) {
    let best = null, bd = 1e9;
    for (const b of S.buildings) { if (b.type !== 'stock' && b.type !== 'depot') continue; const d = G.door(b), dd = Math.hypot(d.x - g.x, d.y - g.y); if (dd < bd) { bd = dd; best = d; } }
    return best;
  };
  G.crafted = function (g, item) {
    const c = CG.CRAFTS[item];
    if (S.policy[item] === 'equiper') {
      const order = S.goblins.filter(o => !o.equip[item]).sort((a, b) => (b.job === 'garde') - (a.job === 'garde') || b.lvl - a.lvl);
      const who = order.find(o => o.job === 'garde') || (item === 'armure' ? order[0] : null);
      if (who) { who.equip[item] = 1; if (item === 'armure') who.hp += 15; G.text(g.x, g.y - 34, c.icon + ' → ' + who.name, '#bfe8ff'); return; }
    }
    G.gain('or', Math.round(c.prix * (G.count('marche') ? 1.5 : 1) * (G.tech('b12') ? 1.25 : 1)), g.x, g.y - 34); S.stats.sold++; if (CG.onScreen(g.x, g.y)) CG.sfx('coin');
  };
  G.POINGS = 0.6; /* sans arme (ni épée, ni arc, ni bâton), un gobelin cogne avec ses poings : cette part des dégâts seulement */
  G.guardDmg = g => (4 + g.lvl * 1.5 + (g.equip.epee ? 4 : 0)) * (g.equip.epee || g.equip.arc || g.equip.baton ? 1 : G.POINGS) * (G.tech('d13') ? 1.25 : 1) * G.apt(g, 'garde') * (CG.totemPres ? (CG.totemPres(g) ? 1.2 : 1) : 1 + 0.2 * Math.min(1, G.count('totem'))) /* un seul totem compte, et seulement près de lui */ * (R.cri > 0 ? 1.5 : 1);
  G.guardFight = (g, e, d, dt) => guardFight(g, e, d, dt);
  function guardFight(g, e, d, dt) {
    g.state = 'fight'; g.pose = null;
    const spd = R.cri > 0 ? 125 : 98, reach = 26 + e.r;
    if (g.equip.arc && d > 60 && d < 230 && (!G.shotClear || G.shotClear(g, e))) { // par-dessus une clôture, oui ; à travers une palissade ou un mur, non
      g.melee = false; g.moving = false; g.face = e.x > g.x ? 1 : -1;
      if (g.atkCd <= 0) { g.atkCd = R.cri > 0 ? 0.9 : 1.4; g.atkAnim = 1; G.shoot(g, e, 'arrow', G.guardDmg(g) * 0.7, 'g', g); }
      return;
    }
    g.melee = true;
    if (d > reach) { chase(g, e.x, e.y, spd, dt); return; }
    g.moving = false; g.face = e.x > g.x ? 1 : -1;
    if (g.atkCd <= 0) { g.atkCd = R.cri > 0 ? 0.65 : 1; g.atkAnim = 1; G.hurtEnemy(e, G.guardDmg(g), g); }
  }
  G.guardFight = guardFight;
  G.hurtGoblin = function (g, dmg) {
    g.hp -= dmg; G.text(g.x, g.y - 40, '-' + Math.round(dmg), R.dmgCol || (R.feuSrc ? CG.DMG.feu : '#ff9a8a')); G.puff(g.x, g.y - 16, '#7ab850', 4);
    if (g.hp > 0 && CG.onScreen(g.x, g.y)) CG.sfx('hit');
    if (g.hp <= 0 && G.count('chaman') && Math.random() < 0.5) { // le chaman le rattrape de justesse
      G.resetGoblin(g); g.hp = 1; const d = G.door(S.buildings[g.home]); g.x = d.x; g.y = d.y; g.hidden = R.alarm && g.job !== 'garde'; if (g.job === 'garde') g.hp = G.gobMaxHp(g) * 0.3;
      G.text(d.x, d.y - 50, '💀 ' + g.name + ' est sauvé par le chaman', '#b8ffb0'); return;
    }
    if (g.hp <= 0 && (G.militia(g) || g.cls === 'loup')) { // un villageois sorti se battre la nuit n'en meurt pas : il est assommé et rentre
      G.resetGoblin(g); g.hp = 1; const d = G.door(S.buildings[g.home]); G.text(g.x, g.y - 70, g.name + ' est assommé', '#ffb0a0', true); (R.etoilesKO = R.etoilesKO || []).push({ x: g.x, y: g.y, fin: R.t + 2.6, g: { sex: g.sex, hue: g.hue, lum: g.lum, job: g.job, look: g.look, equip: g.equip, cls: g.cls || (g.nomme ? 'hob' : null), noHat: !g.hat, hatJob: g.hat } }); /* on le voit un instant par terre, des étoiles autour de la tête, avant qu'on le rentre chez lui */ G.puff(g.x, g.y - 14, '#ddd', 12, 90, 4); g.x = d.x; g.y = d.y; g.koNight = S.day; return;
    }
    if (g.hp <= 0) {
      G.resetGoblin(g); S.goblins.splice(S.goblins.indexOf(g), 1); g.dead = true;
      G.text(g.x, g.y - 50, '☠ ' + g.name, '#ffb0a0', true); G.puff(g.x, g.y - 14, '#ddd', 16, 90, 4);
      R.dayStats.morts.push(g.name); S.morale = Math.max(0, S.morale - 4); CG.sfx('die');
      if (!S.goblins.length) CG.UI.gameOver();
    }
  };

  // ---------- ennemis ----------
  G.spawnEnemy = function (type, x, y, opts) {
    const d = CG.ENEMIES[type], day = S.day, o = opts || {};
    const hm = (1 + 0.1 * (day - 1)) * (o.mul || 1) * (d.struct ? 1 : 1.45), dm = (1 + 0.05 * (day - 1)) * (o.mul || 1);
    const e = { id: S.nextId++, type, x, y, hp: Math.round(d.hp * hm), dmg: d.dmg * dm, spd: d.spd * 0.6, r: d.r || 12, range: d.range || 0, face: 1, step: 0, moving: false, atkCd: rand(0.3, 1), atkAnim: 0, repath: 0, seek: 0, slow: 0, rooted: 0, seed: Math.random() * 100, wild: o.wild ? { x, y } : null, exit: o.exit || null, event: !o.wild, hunt: !!o.hunt, plunder: 0 };
    e.maxhp = e.hp; if (d.struct) { e.struct = true; e.spd = 0; } R.enemies.push(e); return e;
  };
  function pickTarget(e) {
    const p = S.player, wild = e.wild, aggro = wild ? (e.aggroR || 200) : 540; let best = null, bd = aggro;
    if (wild && dist(e, wild) > (e.leash || 380)) return null;
    if (R.ko <= 0 && !(R.invis > 0)) { const d = dist(e, p); if (d < bd) { bd = d; best = p; } }
    for (const a of S.pets) { if (a.ko || a.ridden || a.evoT > 0 || !W.walkPx(a.x, a.y)) continue; const d = dist(e, a) * 1.05; if (d < bd && (!wild || d < 150)) { bd = d; best = a; } }
    { const s = R.golem; if (s && !s.dead) { const d = dist(e, s) * 0.85; if (d < bd && (!wild || d < 150)) { bd = d; best = s; } } }
    if (wild) { // les bêtes des alentours s'en prennent aussi à un gobelin qui passe trop près ; elles lâchent prise dès qu'elles s'éloignent trop de chez elles (voir plus haut)
      for (const g of S.goblins) { if (g.hidden || g.perch || g.cls === 'assassin' || g.ko === true) continue; const d = dist(e, g) * 1.15; if (d < bd && d < 150) { bd = d; best = g; } }
      return best;
    }
    for (const g of S.goblins) { if (g.hidden || g.perch || g.cls === 'assassin') continue; /* l'assassin est furtif */ const d = dist(e, g) * (g.job === 'garde' ? 0.9 : 1.1); if (d < bd) { bd = d; best = g; } }
    return best;
  }
  function updateEnemy(e, dt) {
    e.atkCd -= dt; if (e.atkAnim > 0) e.atkAnim -= dt * 3.5; if (e.slow > 0) e.slow -= dt; if (e.rooted > 0) e.rooted -= dt;
    if (e.struct) { CG.Camps.step(e, dt); return; }
    e.seek -= dt; e.moving = false;
    if (e.sleepT > 0 && CG.Magie.sleepStep(e, dt)) return; // endormi par la berceuse
    if (e.charm > 0 && CG.Magie.charmStep(e, dt)) return; // charmé : il se bat pour nous
    if (e.kb && CG.Magie.kbStep(e, dt)) return; // repoussé par l'onde de choc
    if (e.fear > 0 || e.daze > 0) { G.fearStep(e, dt); return; }
    if (e.retreat) { // le pillard repart avec son butin
      const ex = e.exit || W.center(W.EXITS.nord.x, W.EXITS.nord.y);
      if (!e.path || !e.path.length) { if (Math.hypot(ex.x - e.x, ex.y - e.y) < 60 || !goTo(e, ex.x, ex.y)) { e.dead = true; return; } }
      if (e.rooted <= 0 && follow(e, e.spd * (e.slow > 0 ? 0.45 : 1), dt)) e.dead = true;
      return;
    }
    if (e.voleur && CG.Ombre && CG.Ombre.vole(e, dt)) return; // un voleur : il pille puis file (voir ombre.js)
    if (e.event && !e.hunt) {
      const a = e.aggro;
      if (a) { e.aggroT -= dt; if (a.dead || a.hidden || a.ko === true || (a === S.player && (R.ko > 0 || R.invis > 0)) || e.aggroT <= 0 || dist(e, a) > 440 || (!e.provoked && dist(a, G.firePos()) > 760)) { e.aggro = null; e.path = null; e.blase = true; e.provoked = false; } }
      // en chemin vers le village, s'il aperçoit le chef en premier, il donne l'alerte : toute la bande lui tombe dessus
      else if (!e.blase && e.seek <= 0) {
        e.seek = 0.4; const p = S.player;
        if (R.ko <= 0 && !(R.invis > 0) && dist(e, p) < 250 && dist(p, G.firePos()) < 760 && W.lineClear(e.x, e.y, p.x, p.y)) {
          G.text(e.x, e.y - 56, '❗', '#ffe36b', true); if (CG.onScreen(e.x, e.y)) CG.sfx('warning');
          for (const o of R.enemies) if (o.event && !o.hunt && !o.dead && !o.struct && !o.retreat && !o.blase && !o.aggro && dist(o, e) < 420) { o.aggro = p; o.aggroT = 9; o.path = null; }
        }
      }
      e.target = e.aggro || null;
    } else if (e.seek <= 0 || (e.target && (e.target.dead || e.target.hidden || e.target.ko === true))) { e.target = pickTarget(e); e.seek = 0.5; }
    const spd = e.rooted > 0 ? 0 : e.spd * (e.slow > 0 ? 0.45 : 1) * (e.verglas > 0 ? CG.Sorts2.GLACE.lent : 1) * (CG.Nid && e.type !== 'araignee' && e.type !== 'cracheuse' && CG.Nid.dansToile(e.x, e.y) ? CG.Nid.LENT : 1) /* les toiles collent, sauf pour les araignées */ * (W.tile[W.idx(CG.clamp(Math.floor(e.x / T), 0, CG.MW - 1), CG.clamp(Math.floor(e.y / T), 0, CG.MH - 1))] === W.MOAT ? 0.3 : 1), tg = e.target;
    if (e.siege) { G.siege(e, dt, spd); return; }
    if (tg && tg === S.player && (R.ko > 0 || R.invis > 0)) { e.target = null; return; }
    if (!tg) {
      if (e.wild) { if (dist(e, e.wild) > 30 && spd) chase(e, e.wild.x, e.wild.y, spd * 0.6, dt); return; }
      if (!e.hunt && G.raidStep(e, dt, spd)) return; // il s'en prend à une hutte ou à une construction
      const f = G.stockSpot(e), d = dist(e, f);
      if (d > 46) { if (spd) chase(e, f.x, f.y, spd, dt); }
      else { // pillage : il se sert à même la réserve (ou un dépôt, un grenier)
        e.moving = false; e.face = f.bx > e.x ? 1 : -1; e.plunder += dt;
        if (e.plunder > 2.6) { e.plunder = 0; const r = S.res.food > 0 && Math.random() < 0.65 ? 'food' : S.res.or > 0 ? 'or' : 'bois'; if (S.res[r] > 0) { G.gain(r, -Math.min(S.res[r], G.count('grenier') ? 1 : 2), e.x, e.y - 40); } e.loot = (e.loot || 0) + 1; } // il ne repart plus : seuls les voleurs filent avec leur butin
      }
      return;
    }
    const d = dist(e, tg);
    if (e.range && d < e.range) {
      e.face = tg.x > e.x ? 1 : -1;
      if (e.atkCd <= 0) { e.atkCd = 1.9; e.atkAnim = 1; G.shoot(e, tg, CG.ENEMIES[e.type].magic ? 'fireE' : 'arrow', e.dmg, 'e'); }
      if (d < 90 && spd) { const dx = e.x - tg.x, dy = e.y - tg.y; if (slide(e, dx / d * spd * 0.6 * dt, dy / d * spd * 0.6 * dt)) { e.moving = true; e.step += dt * 2; } }
      return;
    }
    if (d > e.r + 22) { if (spd) chase(e, tg.x, tg.y, spd, dt); return; }
    e.face = tg.x > e.x ? 1 : -1;
    if (e.atkCd <= 0) { e.atkCd = 1.15; e.atkAnim = 1; if (tg === S.player) G.hurtPlayer(e.dmg); else if (tg.type && CG.ENEMIES[tg.type]) G.hurtEnemy(tg, e.dmg, e); else if (tg.summon) CG.Magie.hurt(tg, e.dmg); else if (tg.pet) CG.P.hurt(tg, e.dmg); else G.hurtGoblin(tg, e.dmg); }
  }
  G.hurtEnemy = function (e, dmg, src, playerAttack = src === S.player) {
    if (e.dead) return;
    if (e.charm > 0 && !(src && src.type && CG.ENEMIES[src.type])) return; // tant qu'il est charmé, on ne peut pas le frapper : seuls ses anciens amis le peuvent
    if (e.sleepT > 0) { e.sleepT = 0; dmg *= 2; G.text(e.x, e.y - 62, 'Réveil brutal !', '#ffd0a0'); }
    dmg = Math.max(1, Math.round(dmg)); e.hp -= dmg; e.calm = false;
    if (playerAttack && dist(e, S.player) <= 550) R.playerCombatUntil = R.t + 5;
    const onScreen = CG.onScreen(e.x, e.y);
    G.text(e.x + rand(-8, 8), e.y - 44, '' + dmg, R.dmgCol || '#fff'); G.puff(e.x, e.y - 18, CG.ENEMIES[e.type].race === 'mort' ? '#eee' : '#c8281e', 5); if (onScreen) CG.sfx('hit');
    // il se retourne contre celui qui le frappe (le plus proche, si plusieurs s'y mettent), et ses compagnons tout près viennent l'aider
    const who = src && src.hp !== undefined && !src.dead && !src.ko && !(src === S.player && R.ko > 0) && !(src.cls === 'assassin' && Math.random() < 0.65) ? src : null;
    if (who && !e.struct) {
      const turn = o => {
        if (o.event && !o.hunt) { if (!o.aggro || o.aggro === who || o.aggro.dead || dist(o, who) < dist(o, o.aggro) + 16) { if (o.aggro !== who) o.path = null; o.aggro = who; o.aggroT = 9; o.provoked = true; o.blase = false; o.obj = o.obj === 'stock' ? null : o.obj; } }
        else if (!o.target || o.target.dead || dist(o, who) < dist(o, o.target) + 16) { o.target = who; o.seek = 1.5; }
      };
      turn(e);
      for (const o of R.enemies) if (o !== e && !o.dead && !o.struct && !o.retreat && !o.calm && !!o.wild === !!e.wild && dist(o, e) < 240 && dist(o, who) < 300 && (o.event ? !o.aggro : !o.target)) turn(o);
    }
    if (e.hp <= 0) {
      e.dead = true; const d = CG.ENEMIES[e.type], p = S.player;
      G.puff(e.x, e.y - 16, '#ddd', 14, 100, 4); if (onScreen) CG.sfx(d.boss && !e.event ? 'victory' : 'die'); S.stats.kills++; R.dayStats.kills++;
      if (e.struct) CG.Camps.destroyed(e);
      if (CG.ENEMIES[e.type].boss) { S.tech.points++; CG.UI.toast('🌳 Chef ennemi vaincu : +1 point de technologie !'); }
      const byPlayer = !src || src === p;
      G.addXp(Math.round(d.xp * (1 + 0.05 * (S.day - 1)) * (byPlayer ? 1 : 0.5)));
      if (src && src !== p && src.job) gobXp(src, d.xp, 10);
      if (src && src.pet) CG.P.xp(src, d.xp);
      // le butin tombe par terre autour de lui : il faut passer dessus pour le ramasser
      if (d.or) G.dropRes(e.x, e.y, 'or', d.or + Math.floor(S.day / 3));
      if (d.food) G.dropRes(e.x, e.y, 'food', d.food);
      if (d.boss) CG.Boss.loot(e); // les parchemins ne tombent plus que des chefs
    }
  };
  G.giveScroll = function (id, x, y) {
    const p = S.player, sp = CG.SPELLS[id];
    if (p.spells.includes(id) || p.scrolls[id]) { G.gain('or', 15, x, y - 30); G.text(x, y - 60, 'Parchemin en double : vendu', '#ffe36b'); return; }
    p.scrolls[id] = 1; G.text(x === undefined ? p.x : x, (y === undefined ? p.y : y) - 60, '📜 ' + sp.nom + ' !', '#ffe36b', true); CG.sfx('page');
    CG.UI.toast('📜 Parchemin trouvé : ' + sp.nom + '. Ouvre ton grimoire (G) pour le copier.');
  };

  G.retreatAll = function () { for (const e of R.enemies) if (e.event && !e.dead) { e.retreat = true; e.path = null; } if (R.event) R.event.fled = true; };

  // ---------- joueur ----------
  G.xpNeed = l => Math.floor(110 * Math.pow(l, 1.9)); // 110, 410, 887, 1532... (avant : 40 × niveau^1,8, on était niveau 6 ou 7 dès le premier jour)
  // les points de technologie d'un niveau : au hasard, de 1 à 5 (4 est rare, 5 très rare)
  G.POINTS = [[1, 0.30], [2, 0.40], [3, 0.22], [4, 0.07], [5, 0.01]];
  G.POINTS_SURS = 3; // jusqu'à ce niveau inclus, toujours 2 points ; le hasard commence au niveau suivant
  G.pointsNiveau = lvl => { if (lvl <= G.POINTS_SURS) return 2; let r = Math.random(); for (const q of G.POINTS) { r -= q[1]; if (r < 0) return q[0]; } return 2; };
  G.addXp = function (n) {
    const p = S.player; p.xp += n;
    while (p.xp >= G.xpNeed(p.lvl)) {
      p.xp -= G.xpNeed(p.lvl); p.lvl++; p.maxhp += 12; p.maxmp += 6; p.hp += 12; p.mp += 6; if (CG.Evo) CG.Evo.chief(true); /* plus de guérison complète : seulement la vie et le mana gagnés */
      const pts = G.pointsNiveau(p.lvl); S.tech.points += pts; CG.UI.toast((pts >= 4 ? '🌟 ' : '🌳 ') + 'Niveau ' + p.lvl + ' : +' + pts + ' point' + (pts > 1 ? 's' : '') + ' de technologie' + (pts === 5 ? ' — le gros lot !' : pts === 4 ? ' — quelle chance !' : '.') + ' Ouvre l\'arbre avec T.');
      G.text(p.x, p.y - 70, 'NIVEAU ' + p.lvl + ' !', '#ffe36b', true); G.puff(p.x, p.y - 20, '#ffe36b', 24, 140, 4); CG.sfx('level');
    }
  };
  G.playerDmg = () => 4 + S.player.lvl * 1.5 + S.player.weapon * 3 + (G.tech('g2') ? 3 : 0);
  G.hurtPlayer = function (dmg) {
    const p = S.player; if (R.ko > 0 || R.invuln > 0) return;
    if (R.shield > 0) { const a = Math.min(R.shield, dmg); R.shield -= a; dmg -= a; G.puff(p.x, p.y - 20, '#9ab6ff', 5); if (dmg <= 0) return; }
    R.playerCombatUntil = R.t + 5;
    dmg = Math.max(1, Math.round(dmg * (1 - Math.min(0.6, p.armor * 0.08)) * (G.tech('s10') ? 0.85 : 1)));
    p.hp -= dmg; R.hurtFlash = 0.25; G.text(p.x, p.y - 50, '-' + dmg, R.dmgCol || (R.feuSrc ? CG.DMG.feu : CG.DMG.subi)); CG.sfx('hurt');
    if (p.hp <= 0 && G.tech('g10') && !R.secondUsed) { R.secondUsed = true; p.hp = Math.round(p.maxhp * 0.5); R.invuln = 2.5; G.text(p.x, p.y - 70, 'Seconde chance !', '#b8ffb0', true); G.puff(p.x, p.y - 20, '#fff', 24, 150, 4); CG.sfx('heal'); return; }
    if (p.hp <= 0) {
      p.hp = 0; R.ko = 1e9; G.puff(p.x, p.y - 16, '#ddd', 20, 120, 4); G.die(); return;
      const ev = R.event;
      if (ev && ev.type === 'attack') { ev.kos = (ev.kos || 0) + 1; if (ev.kos >= 2) { const f = Math.floor(S.res.food * 0.15); S.res.food -= f; G.retreatAll(); G.banner('Tu es de nouveau assommé !', 'Les pillards te laissent pour mort et repartent avec leur butin' + (f ? ' (-' + f + ' 🍖).' : '.'), '#ff9a8a'); } }
    }
  };
  function nearestEnemy(x, y, range) { let b = null, bd = range; for (const e of R.enemies) { if (e.dead || e.calm) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; b = e; } } return b; }
  G.nearestEnemy = nearestEnemy;
  G.attack = function () {
    const p = S.player; if (R.atkCd > 0 || R.ko > 0) return;
    if (R.invis > 0) CG.Magie.reveal(); // frapper fait réapparaître
    R.atkCd = 0.4; R.swing = 1; CG.sfx('coupChef'); const spin = G.tech('g4'), reach = spin ? 60 : 44; R.spin = spin;
    let touched = false;
    const near = nearestEnemy(p.x, p.y, 74); if (near) { R.dir = { x: (near.x - p.x) / (dist(near, p) || 1), y: (near.y - p.y) / (dist(near, p) || 1) }; if (Math.abs(near.x - p.x) > 4) p.face = near.x > p.x ? 1 : -1; }
    for (const e of R.enemies) {
      if (e.dead) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d < reach + e.r && (spin || d < 26 || (dx * R.dir.x + dy * R.dir.y) / d > 0.2)) { touched = true; const crit = G.tech('g7') && Math.random() < 0.2; if (crit) G.text(e.x, e.y - 62, 'CRITIQUE !', '#ffe36b'); G.hurtEnemy(e, G.playerDmg() * rand(0.85, 1.15) * (crit ? 2 : 1), p); if (G.tech('g9')) p.hp = Math.min(p.maxhp, p.hp + 1.5 + p.lvl * 0.25); if (!e.dead && e.rooted <= 0 && !e.struct) slide(e, dx / d * 10, dy / d * 10); }
    }
    if (!touched) G.strikeBuilding(); // aucun ennemi touché : le coup porte sur la construction juste devant
  };
  G.shoot = function (from, to, kind, dmg, team, owner, aoe) {
    const sp = kind === 'arrow' ? 380 : kind === 'carreau' ? 520 : kind === 'feu' ? 320 : 400, dx = to.x - from.x, dy = (to.y - 14) - (from.y - 18), d = Math.hypot(dx, dy) || 1;
    R.shots.push({ x: from.x, y: from.y - 18, vx: dx / d * sp, vy: dy / d * sp, dmg, team, kind, life: 1.5, owner, aoe: aoe || 0 });
    if ((kind === 'arrow' || kind === 'carreau') && CG.onScreen(from.x, from.y)) CG.sfx('swing'); else if (kind === 'fireE' && CG.onScreen(from.x, from.y)) CG.sfx('bouleFeu');
  };
  G.blast = function (x, y, r, dmg, col, playerAttack = true) {
    R.rings.push({ x, y, r, life: 0.4, col }); G.puff(x, y, col, 22, 190, 5); if (CG.onScreen(x, y)) CG.sfx('fire');
    for (const e of R.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - 14 - y) < r + e.r) G.hurtEnemy(e, dmg, S.player, playerAttack);
  };
  G.cast = function (id) {
    const p = S.player, sp = CG.SPELLS[id]; if (!sp || R.castCd > 0 || R.ko > 0) return;
    const cost = G.spellCost(id);
    if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; const el = G.tech('s9');
    const m = (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1), tg = nearestEnemy(p.x, p.y, 400);
    const aim = tg || { x: p.x + R.dir.x * 240, y: p.y + R.dir.y * 240 + 14 };
    if (tg && Math.abs(tg.x - p.x) > 4) p.face = tg.x > p.x ? 1 : -1;
    CG.sfx(id === 'eclair' ? 'zap' : id === 'soin' ? 'heal' : id === 'cri' ? 'horn' : 'spell');
    if (id === 'vision') { R.vision = 30; R.rings.push({ x: p.x, y: p.y - 10, r: 260, life: 0.5, col: '#7dffea' }); }
    else if (id === 'etincelle') { G.shoot(p, aim, 'bolt', 9 * m, 'p'); if (G.tech('s3')) { const dx = aim.x - p.x, dy = aim.y - p.y; [-0.3, 0.3].forEach(a => G.shoot(p, { x: p.x + dx * Math.cos(a) - dy * Math.sin(a), y: p.y + dx * Math.sin(a) + dy * Math.cos(a) }, 'bolt', 9 * m, 'p')); } }
    else if (id === 'feu') G.shoot(p, aim, 'feu', 20 * m, 'p', null, el ? 102 : 72);
    else if (id === 'glace') { R.rings.push({ x: p.x, y: p.y - 10, r: 135, life: 0.5, col: '#8fe1ff' }); G.puff(p.x, p.y - 14, '#c8f4ff', 26, 220, 4); for (const e of R.enemies) if (!e.dead && dist(e, p) < 135 + e.r) { e.slow = el ? 7.5 : 4.5; G.hurtEnemy(e, 7 * m, p); } }
    else if (id === 'soin') { const h = Math.round(35 * m); p.hp = Math.min(p.maxhp, p.hp + h); G.text(p.x, p.y - 56, '+' + h, '#7dff8a'); G.puff(p.x, p.y - 20, '#7dff8a', 18, 90, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 170, life: 0.5, col: '#7dff8a' }); for (const g of S.goblins) if (!g.hidden && dist(g, p) < 170) { g.hp = Math.min(G.gobMaxHp(g), g.hp + 25 * m); G.puff(g.x, g.y - 20, '#7dff8a', 6, 60, 3); } }
    else if (id === 'racines') { const c = tg || p; R.rings.push({ x: c.x, y: c.y - 6, r: 150, life: 0.5, col: '#6fbf4a' }); for (const e of R.enemies) if (!e.dead && dist(e, c) < 150 + e.r) { e.rooted = 3.8; G.hurtEnemy(e, 4 * m, p); } }
    else if (id === 'eclair') { let cur = nearestEnemy(p.x, p.y, 320), from = { x: p.x, y: p.y - 26 }; const hit = new Set(); for (let i = 0; i < (el ? 6 : 4) && cur; i++) { hit.add(cur); R.bolts.push({ x1: from.x, y1: from.y, x2: cur.x, y2: cur.y - 18, life: 0.25 }); G.hurtEnemy(cur, 15 * m * (1 - i * 0.12), p); from = { x: cur.x, y: cur.y - 18 }; let nb = null, nd = 180; for (const e of R.enemies) { if (e.dead || hit.has(e)) continue; const d = dist(e, cur); if (d < nd) { nd = d; nb = e; } } cur = nb; } if (!hit.size) R.bolts.push({ x1: from.x, y1: from.y, x2: aim.x, y2: aim.y - 18, life: 0.25 }); }
    else if (id === 'bouclier') { R.shield = Math.round(30 * m); R.shieldT = 12; }
    else if (id === 'cri') { R.cri = 12; for (const g of S.goblins) if (g.job === 'garde') { G.text(g.x, g.y - 44, '💢', '#fff'); G.puff(g.x, g.y - 20, '#ffb05a', 6); } }
    else if (id === 'meteore') R.delayed.push({ t: 0.9, max: 0.9, x: aim.x, y: aim.y - 14, r: 108, dmg: 48 * m });
  };
  G.manaRegen = () => 0.5 + (G.tech('s2') ? 0.5 : 0) + (G.tech('s14') ? 0.8 : 0) + Math.min(3, G.count('cristal')) * 0.4;
  G.spellCost = id => Math.ceil(CG.SPELLS[id].mp * (G.tech('s8') ? 0.8 : 1));
  G.drinkPotion = function () {
    const p = S.player; if (p.potions <= 0 || p.hp >= p.maxhp || R.ko > 0) { CG.sfx('no'); return; }
    const soin = CG.fiole ? CG.fiole() : 45; p.potions--; p.hp = Math.min(p.maxhp, p.hp + soin); G.text(p.x, p.y - 56, '+' + soin + ' ❤️', '#ff8a8a'); CG.sfx('heal');
  };
  function updatePlayer(dt) {
    const p = S.player, K = CG.keys;
    if (R.cine) { R.atkCd -= dt; if (R.swing > 0) R.swing -= dt * 5; return; }
    if (R.ko <= 0 && !(R.passe > 0)) { W.surEau = R.surEau > 0; W.chef = true; G.unstick(p, 9); W.surEau = false; W.chef = false; } // jamais coincé dans un mur (chantier terminé, arbre repoussé...)
    R.atkCd -= dt; R.castCd -= dt; if (R.swing > 0) R.swing -= dt * 5; if (R.castAnim > 0) R.castAnim -= dt * 3; if (R.hurtFlash > 0) R.hurtFlash -= dt;
    if (R.shieldT > 0) { R.shieldT -= dt; if (R.shieldT <= 0) R.shield = 0; }
    if (R.cri > 0) R.cri -= dt; if (R.invuln > 0) R.invuln -= dt;
    if (R.ko > 0) {
      R.ko -= dt;
      if (R.ko <= 0) { const d = G.door(G.find('chief')); p.x = d.x; p.y = d.y + 10; p.hp = Math.round(p.maxhp * 0.5); R.invuln = 4; G.banner('Tu reprends connaissance', 'Tes gobelins t\'ont traîné jusqu\'à ta hutte.'); }
      return;
    }
    let mx = 0, my = 0;
    if (K.has('a') || K.has('ArrowLeft')) mx -= 1; if (K.has('d') || K.has('ArrowRight')) mx += 1;
    if (K.has('w') || K.has('ArrowUp')) my -= 1; if (K.has('s') || K.has('ArrowDown')) my += 1;
    if (mx || my) {
      { const v = CG.Tactile && CG.Tactile.vec; if (v) { mx = v.x; my = v.y; } } // manette tactile : la direction exacte du pouce, pas seulement les huit du clavier
      const l = Math.hypot(mx, my), run = G.tech('g13') && K.has('Shift'), spd = 80 * G.heroMul() * (run ? 1.7 : 1) * (onPath(p) ? 1.2 * (G.cheminK ? G.cheminK(p) : 1) : 1); R.running = run; R.dir = { x: mx / l, y: my / l };
      if (R.passe > 0) { p.x += mx / l * spd * dt; p.y += my / l * spd * dt; } /* Passe-muraille : rien ne l'arrête */ else { W.surEau = R.surEau > 0; /* potion de nénuphar : l'eau porte le chef, et lui seul */ W.chef = true; const ex = p.x, ey = p.y; slide(p, mx / l * spd * dt, my / l * spd * dt, 9); W.surEau = false; W.chef = false; if (CG.Enclos && CG.Enclos.cloture) CG.Enclos.cloture(p, ex, ey); /* enclos.js : la clôture l'arrête, sauf à la porte */ }
      p.x = CG.clamp(p.x, 12, CG.MW * T - 12); p.y = CG.clamp(p.y, 12, CG.MH * T - 12);
      if (Math.abs(mx) > 0.2) p.face = mx > 0 ? 1 : -1; p.step += dt * 2.6 * G.heroMul() * (run ? 1.6 : 1); p.moving = true; if (run && Math.random() < dt * 14) R.parts.push({ x: p.x - R.dir.x * 8, y: p.y - 2, vx: rand(-12, 12), vy: rand(-22, -6), life: 0.4, max: 0.4, col: '#d8c8a0', size: 3, float: true });
    } else p.moving = false;
    // le mana ne remonte plus tout seul, comme la vie : une nuit de sommeil, ou des pouvoirs de l'arbre et des cristaux qui en redonnent un peu
    if (p.mp < p.maxmp) { const rg = G.manaRegen(); if (rg) p.mp = Math.min(p.maxmp, p.mp + rg * dt); }
    if (R.vision > 0) R.vision -= dt;
    if (R.pcd) for (const k in R.pcd) if (R.pcd[k] > 0) R.pcd[k] -= dt;
    // la vie ne remonte plus toute seule : guérisseur, potions, sorts, ou une nuit de sommeil. L'arbre en redonne un tout petit peu.
    if (p.hp < p.maxhp) { const rg = (G.tech('g6') ? 0.3 : 0) + (G.tech('g14') ? 0.4 : 0); if (rg) p.hp = Math.min(p.maxhp, p.hp + rg * dt); }
  }

  // ---------- projectiles, tours, effets ----------
  function updateShots(dt) {
    const p = S.player;
    for (const s of R.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (s.kind !== 'arrow' && s.kind !== 'carreau' && Math.random() < dt * (s.etin === 1 ? 12 : 40)) R.parts.push({ x: s.x, y: s.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, col: s.kind === 'bolt' ? (s.etin === 3 ? '#bfe8ff' : '#ffe36b') : '#ff8a1e', size: s.etin === 1 ? 1.6 : 3 });
      if (s.team === 'e') {
        // les tirs ennemis se plantent dans les constructions au lieu de les traverser
        const fy = s.y + 16; for (const b of S.buildings) { if (b.site) continue; const d = CG.BUILDS[b.type]; if (!d || d.flat || (d.barrier && !d.tall) || d.terrain) continue; if (s.x > b.tx * T + 5 && s.x < (b.tx + b.w) * T - 5 && fy > b.ty * T + 4 && fy < (b.ty + b.h) * T - 2) { s.life = 0; G.puff(s.x, s.y, s.kind === 'arrow' ? '#c9a56b' : '#ff8a1e', 5, 70, 3); break; } }
        if (s.life <= 0) continue;
        R.feuSrc = s.kind === 'fireE'; // boule de feu
        if (R.ko <= 0 && Math.hypot(p.x - s.x, p.y - 18 - s.y) < 15) { G.hurtPlayer(s.dmg); R.feuSrc = false; s.life = 0; continue; }
        for (const g of S.goblins) if (!g.hidden && !g.perch && Math.hypot(g.x - s.x, g.y - 16 - s.y) < 13) { G.hurtGoblin(g, s.dmg); s.life = 0; break; }
        R.feuSrc = false;
        if (s.life > 0 && R.golem && !R.golem.dead && Math.hypot(R.golem.x - s.x, R.golem.y - 22 - s.y) < 18) { CG.Magie.hurt(R.golem, s.dmg); s.life = 0; }
        if (s.life > 0) for (const a of S.pets) if (!a.ko && !a.ridden && Math.hypot(a.x - s.x, a.y - 16 - s.y) < 14) { CG.P.hurt(a, s.dmg); s.life = 0; break; }
      } else {
        for (const e of R.enemies) if (!e.dead && Math.hypot(e.x - s.x, e.y - 16 - s.y) < e.r + 8) {
          R.tirK = s.kind; /* chevalieros.js : une flèche entame un bouclier, pas un sort */ try { if (s.aoe) G.blast(s.x, s.y, s.aoe, s.dmg, '#ff8a1e', s.team === 'p'); else G.hurtEnemy(e, s.dmg, s.owner || p, s.team === 'p'); } finally { R.tirK = null; }
          s.life = 0; break;
        }
      }
      if (s.life <= 0 && s.aoe && s.team === 'p' && !s.done) { s.done = true; }
    }
    R.shots = R.shots.filter(s => s.life > 0);
    G.updateBuildings(dt);
    for (const d of R.delayed) { d.t -= dt; if (d.t <= 0) G.blast(d.x, d.y, d.r, d.dmg, '#ff4a2a'); }
    R.delayed = R.delayed.filter(d => d.t > 0);
    for (const q of R.parts) { q.x += q.vx * dt; q.y += q.vy * dt; if (!q.float) q.vy += 120 * dt; q.life -= dt; }
    R.parts = R.parts.filter(q => q.life > 0);
    for (const q of R.texts) { q.y -= 26 * dt; q.life -= dt; }
    R.texts = R.texts.filter(q => q.life > 0);
    for (const q of R.bolts) q.life -= dt; R.bolts = R.bolts.filter(q => q.life > 0);
    for (const q of R.rings) q.life -= dt; R.rings = R.rings.filter(q => q.life > 0);
  }

  G.update = function (dt) {
    S = CG.S; R = CG.R; R.t += dt;
    updatePlayer(dt);
    for (const g of S.goblins.slice()) updateGoblin(g, dt);
    CG.P.update(dt);
    W.foe = true;
    for (const e of R.enemies) if (!e.dead) updateEnemy(e, dt);
    // les ennemis ne s'empilent pas
    const en = R.enemies;
    for (let i = 0; i < en.length; i++) for (let j = i + 1; j < en.length; j++) {
      const a = en[i], b = en[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.8;
      if (d < min && d > 0.01 && !a.struct && !b.struct) { const k = Math.min(1.4, (min - d) * 0.5) / d; slide(a, -dx * k, -dy * k); slide(b, dx * k, dy * k); }
    }
    W.foe = false;
    R.enemies = en.filter(e => !e.dead);
    updateShots(dt);
    for (const s of R.speech) { if (s.delay > 0) { s.delay -= dt; if (s.delay <= 0 && s.e.job !== undefined) { s.e.emoteT = s.laugh ? 1.6 : 0; s.e.face = S.player.x > s.e.x ? 1 : -1; } } else s.t -= dt; }
    R.speech = R.speech.filter(s => s.t > 0 && (s.e === S.player || S.goblins.includes(s.e) || R.visitors.includes(s.e) || S.pets.includes(s.e))); // les animaux et les monstres alliés ont aussi droit à la parole
    if (R.banner) { R.banner.t -= dt; if (R.banner.t <= 0) R.banner = null; }
  };
})(window.CG);
