// Clan Gobelin — le fil des jours : horloge, fête du soir, attaques, visiteurs, interactions.
'use strict';
(function (CG) {
  const T = CG.TILE, W = CG.W, G = CG.G, D = CG.D = {};
  const rand = CG.rand, pick = CG.pick, dist = CG.dist;
  D.HOUR = 28; // secondes réelles par heure de jeu
  const DIRS = { ouest: 'l\'ouest', est: 'l\'est', sud: 'le sud', nord: 'le nord' };
  let S, R;

  // ---------- planification ----------
  D.plan = function () {
    S = CG.S; R = CG.R; const day = S.day, ev = [];
    if (day === 1) ev.push({ h: 11.5, type: 'attack', kind: 'betes' });
    else {
      let kind;
      if (day % 5 === 0) kind = ['humains', 'betes', 'demons'][(day / 5 - 1) % 3];
      else { const r = Math.random(); kind = day >= 4 && r < 0.18 ? 'demons' : r < 0.6 ? 'humains' : 'betes'; }
      const h1 = rand(9.5, 16.5); ev.push({ h: h1, type: 'attack', kind, boss: day % 5 === 0 });
      if (day >= 4 && Math.random() < (day >= 8 ? 0.7 : 0.4)) ev.push({ h: h1 > 13 ? h1 - rand(3.5, 5) : h1 + rand(3.5, 5), type: 'attack', kind: Math.random() < 0.5 ? 'humains' : 'betes' });
      if (day >= 6 && Math.random() < 0.3) ev.push({ h: 20.7, type: 'attack', kind: 'humains', night: true });
      if (day === 2) ev.push({ h: 7.5, type: 'visit', role: 'nomade' });
      else if (day === 3) ev.push({ h: 8, type: 'demande' });
      else if (Math.random() < (G.count('marche') ? 0.92 : 0.7)) {
        const r = Math.random();
        if (r < 0.3) ev.push({ h: rand(7, 15), type: 'demande' });
        else ev.push({ h: rand(7, 14), type: 'visit', role: S.goblins.length < 12 && r < 0.62 ? 'nomade' : r < 0.5 ? 'nain' : r < 0.64 ? 'elfe' : r < 0.76 ? 'sorciere' : r < 0.88 ? 'demonMarchand' : 'nomade' });
      }
    }
    if (S.pets.length < CG.P.MAX && (day === 1 || Math.random() < 0.3)) ev.push({ h: day === 1 ? 8 : rand(7, 16), type: 'visit', role: 'animal' });
    ev.sort((a, b) => a.h - b.h); R.schedule = ev;
  };
  function compose(kind, day, boss) {
    let budget = 2 + day * 1.5 + day * day * 0.1; const out = [];
    const pools = {
      humains: [['milicien', 1], ['soldat', 2], ['archer', 3], ['mage', 5], ['chevalier', 6]],
      betes: [['loup', 1], ['araignee', 2], ['sanglier', 2], ['ours', 5]],
      demons: [['diablotin', 1], ['demon', 5]]
    }[kind].filter(p => day >= p[1]).map(p => p[0]);
    if (boss) { out.push({ humains: 'capitaine', betes: 'troll', demons: 'seigneur' }[kind]); budget *= 0.6; }
    while (budget > 0.9 && out.length < 30) {
      const ok = pools.filter(t => CG.ENEMIES[t].cost <= budget + 0.6); if (!ok.length) break;
      const t = pick(ok); out.push(t); budget -= CG.ENEMIES[t].cost;
    }
    return out;
  }
  D.startAttack = function (ev) {
    const exit = ev.kind === 'demons' ? 'nord' : pick(['ouest', 'est', 'sud']), e = W.EXITS[exit], list = compose(ev.kind, S.day, ev.boss);
    list.forEach((type, i) => R.spawnQ.push({ t: 0.4 + i * 0.6, type, x: e.x * T + T / 2 + rand(-34, 34), y: e.y * T + T / 2 + rand(-34, 34) }));
    R.event = { type: 'attack', kind: ev.kind, exit, quiet: true };
    const titles = { humains: ev.night ? 'Raid de nuit des humains !' : 'Des humains attaquent le village !', betes: 'Des bêtes sauvages attaquent !', demons: 'Des démons surgissent du portail !' };
    R.event.msg = [ev.boss ? '⚠ ' + titles[ev.kind] : titles[ev.kind], (ev.boss ? 'Un chef redoutable les mène. ' : '') + 'Ils arrivent par ' + DIRS[exit] + '. Aux armes !'];
  };
  // l'alerte n'est donnée que lorsque les assaillants sont tout près du village (du feu ou d'une construction)
  D.nearVillage = function (e) {
    if (CG.dist(e, G.firePos()) < 520) return true;
    return S.buildings.some(b => b.type !== 'chemin' && b.type !== 'gazon' && Math.abs((b.tx + b.w / 2) * T - e.x) < 250 && Math.abs((b.ty + b.h / 2) * T - e.y) < 250);
  };
  D.RENONCE = 15; // secondes sans avancer, loin du village et loin du chef, avant qu'un assaillant abandonne
  D.soundAlarm = function () {
    const ev = R.event; if (!ev || ev.type !== 'attack' || R.alarm) return;
    ev.quiet = false; ev.heard = true; ev.time = Math.min(ev.time || 0, 60); R.alarm = true;
    let m = ev.msg || ['Le village est attaqué !', 'Des ennemis sont aux portes. Aux armes !'];
    { // on annonce ceux qui sont vraiment là : un raid de gnomes arrivé avant les humains attendus ne s'appelle pas « des humains »
      const n = {}; for (const e of R.enemies) { if (!e.event || e.dead || e.retreat || e.struct || !D.nearVillage(e)) continue; const r = (CG.ENEMIES[e.type] || {}).race; if (r) n[r] = (n[r] || 0) + 1; }
      const top = Object.keys(n).sort((a, b) => n[b] - n[a])[0], attendu = { humains: 'humain', betes: 'bete', demons: 'demon', lezards: 'lezard' }[ev.kind];
      const TITRE = { gnome: 'Des gnomes attaquent le village !', humain: 'Des humains attaquent le village !', bete: 'Des bêtes sauvages attaquent !', demon: 'Des démons attaquent le village !', lezard: 'Les hommes-lézards attaquent !', mort: 'Des morts-vivants attaquent le village !' };
      if (top && TITRE[top] && !ev.demonLord && !ev.nightRaid && (attendu ? top !== attendu : ev.kind === 'camp' && false)) m = [TITRE[top], 'Ils sont tout près. Aux armes !']; }
    G.banner(m[0], m[1], '#ff9a8a'); CG.sfx('attaque');
  };
  function endAttack() {
    const ev = R.event; R.alarm = false; R.event = null; if (ev.nightRaid) R.backToBed = 4;
    if (ev.quiet && ev.fled) return; // ils ont rebroussé chemin avant même d'être vus du village
    if (ev.fled) { S.morale = Math.max(0, S.morale - 6); G.banner('Les pillards sont repartis', 'Ils emportent une partie de tes réserves. Il faudra plus de gardes...', '#ff9a8a'); CG.sfx('no'); return; }
    const bonus = 4 + S.day * 2; S.morale = Math.min(100, S.morale + 3);
    const p = S.player; G.gain('or', bonus, p.x, p.y - 60);
    G.banner('Victoire !', 'Le village est sauf. Les gobelins sortent de leurs huttes. (+' + bonus + ' or)', '#b8ffb0'); CG.sfx('victory');
    if (ev.lord && R.visitors.includes(ev.lord)) { CG.UI.toast('Le seigneur démon : « Bien combattu, petite peau verte. Prends ceci. »'); G.giveScroll(pick(CG.SCROLL_POOL), ev.lord.x, ev.lord.y); leave(ev.lord); }
  }

  // ---------- visiteurs ----------
  const VIS = {
    nain: { nom: 'Borin, marchand nain', look: 'nain', hello: 'Ho, peau verte ! J\'ai des lames, des potions et de la bonne camelote.' },
    elfe: { nom: 'Élowyn, elfe voyageuse', look: 'elfe', hello: 'Paix, chef gobelin. La forêt m\'a parlé de toi. Veux-tu apprendre ma magie ?' },
    sorciere: { nom: 'Mémé Crapaude, sorcière', look: 'sorciere', hello: 'Hi hi hi ! Des parchemins pas chers, un peu mâchouillés par mon crapaud.' },
    demonMarchand: { nom: 'Azgoth, colporteur démon', look: 'demonMarchand', hello: 'Pas de bagarre aujourd\'hui. Que du commerce. De la magie... brûlante.' },
    nomade: { nom: 'Gobelins errants', look: 'gobelin', hello: 'Chef ! Notre clan a été chassé par les humains. On peut rester chez vous ?' }
  };
  function mkVisitor(role, look, x, y, dest, exit) {
    const v = { id: S.nextId++, role, look, x, y, face: 1, step: 0, moving: false, state: 'arrive', dest, exit, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 4.5) };
    G.goTo(v, dest.x, dest.y); R.visitors.push(v); return v;
  }
  function scrollItem(id, mul) { const sp = CG.SPELLS[id]; return { scroll: id, icon: '📜', label: 'Parchemin : ' + sp.nom, desc: 'Cercle de magie ' + CG.cercle(id), prix: Math.round(sp.prix * mul), stock: 1 }; }
  function stockFor(role) { const l = stockFor0(role), i = l.findIndex(q => q.label === 'Fiole de vie'); /* à côté de la fiole de vie : la fiole de mana */
    if (i >= 0) l.splice(i + 1, 0, { icon: CG.Alchimie && CG.Alchimie.svg ? CG.Alchimie.svg('mana') : '💧', label: 'Fiole de mana', desc: 'Te redonne du mana.', prix: l[i].prix + 2, stock: 2, buy: () => { const p = S.player; p.fioles = p.fioles || {}; p.fioles.mana1 = (p.fioles.mana1 || 0) + 1; } });
    if (!S.chefHatOwned && CG.Mode && CG.Mode.CHEF) l.push({ icon: '🪶', label: 'Coiffe de chef', desc: '+' + Math.round(CG.Mode.CHEF.dmg * 100) + ' % de dégâts · +' + String(CG.Mode.CHEF.mana).replace('.', ',') + ' mana par seconde · se porte sur ta tête', prix: CG.Mode.CHEF.marchand || 450, stock: 1, buy: () => { S.chefHatOwned = true; CG.UI.toast('🪶 Coiffe de chef : dans ton sac. Mets-la dans la case « Chapeau » de ton inventaire.'); } }); /* elle va dans le sac : on la met soi-même */ /* dès le début, tout marchand peut vendre la coiffe à plumes */
    return l.concat(CG.Outils ? CG.Outils.stock(role) : []); } /* et les objets spéciaux des gobelins (outils.js) */
  function stockFor0(role) {
    const p = S.player, potion = (prix, n) => ({ icon: CG.Alchimie && CG.Alchimie.svg ? CG.Alchimie.svg('vie') : '🧪', label: 'Fiole de vie', desc: 'Te redonne de la vie.', prix, stock: n, buy: () => { p.potions++; } });
    // un marchand n'a des parchemins que parfois (ch = chance par parchemin), et de préférence des sorts que tu n'as pas
    const sc = (ids, n, mul, ch) => CG.shuffle(ids.slice()).sort((a, b) => (!!(p.spells.includes(a) || p.scrolls[a])) - (!!(p.spells.includes(b) || p.scrolls[b]))).slice(0, n).filter(() => Math.random() < ch / (CG.SortsRares ? CG.SortsRares.RARE : 1)).map(id => scrollItem(id, mul)); /* deux fois plus rares sur les étals (sortsrares.js) */
    if (role === 'nain') return [potion(12, 3),
      { icon: '🗡️', label: 'Lame naine', desc: 'Ton arme frappe plus fort.', prix: 40 + 35 * p.weapon, stock: 1, buy: () => { p.weapon++; } },
      { icon: '🛡️', label: 'Cotte renforcée', desc: 'Ton armure te protège mieux.', prix: 40 + 35 * p.armor, stock: 1, buy: () => { p.armor++; } },
      { icon: '🪨', label: '10 minerais', desc: 'Pour ton forgeron.', prix: 22, stock: 2, buy: () => { S.res.minerai += 10; } }].concat(sc(['feu', 'bouclier', 'cri', 'retour', 'murfeu', 'golem'], 1, 1, 0.35));
    if (role === 'elfe') return sc(['etincelle', 'soin', 'racines', 'glace', 'bouclier', 'eclair', 'illusion', 'retour', 'hate'], 2, 1, 0.5).concat([potion(10, 3)]);
    if (role === 'sorciere') return sc(CG.SCROLL_POOL.filter(i => i !== 'meteore'), 2, 0.75, 0.55).concat([potion(9, 3), { icon: '🦴', label: '5 os', desc: 'Pour les potions de tes alchimistes.', prix: 30, stock: 3, buy: () => { S.res.os = (S.res.os || 0) + 5; } }]).concat(CG.Feu ? CG.Feu.stock() : []); // des os pour les potions, et ses poudres pour le feu de camp
    return sc(['feu', 'meteore', 'cri', 'eclair', 'murfeu'], 2, 1, 0.45).concat([{ icon: '❤️', label: 'Pacte de vigueur', desc: 'Plus de vie, pour toujours.', prix: 80, stock: 1, buy: () => { p.maxhp += 10; p.hp += 10; } }]);
  }
  // ce que disent les gobelins errants en arrivant : une histoire différente à chaque groupe
  const ERRANTS = [
    'Chef ! Notre clan a été chassé par les humains. On peut rester chez vous ?',
    'Bonjour, chef. Notre village a brûlé cette nuit. On a marché jusqu\'à voir la fumée de ton feu. Tu as une petite place pour nous ?',
    'On nous a dit qu\'ici, on mange tous les soirs. C\'est vrai ? Parce que nous, ça fait trois jours qu\'on suce des cailloux.',
    'Chef, notre ancien chef s\'est fait manger par un troll. On en cherche un nouveau. Un qui court plus vite, si possible.',
    'Pardon de déranger... On s\'est perdus en cueillant des champignons, et quand on est revenus, le clan était parti sans nous. On peut rester ?',
    'On vient du nord. Là-bas, les démons ont tout pris. On sait travailler, on ne ronfle presque pas. Tu nous prends ?',
    'Psst, chef ! On s\'est sauvés d\'une mine des humains. Ils nous faisaient creuser jour et nuit. Cache-nous, et on creusera pour toi... mais avec des pauses.',
    'Salut, chef ! On a entendu vos tambours de l\'autre côté de la colline. Un clan qui fait la fête, c\'est un clan pour nous.',
    'Chef, on était le plus petit clan de la forêt : rien que nous. On en a assez d\'être tout seuls. On peut se joindre au tien ?',
    'Notre chef nous a mis dehors parce qu\'on mangeait trop. C\'est très exagéré. Enfin, un peu exagéré. Tu as de la soupe ?',
    'Les loups nous suivent depuis ce matin, chef. On aimerait beaucoup être de l\'autre côté de tes clôtures. Genre, maintenant.',
    'On a tiré au sort entre ton clan et celui des marais. Le caillou est tombé de ton côté. Alors nous voilà !'
  ];
  // parfois, ce sont des jumeaux : ils arrivent à deux, se ressemblent trait pour trait, et ne se séparent jamais
  D.JUMEAUX = 0.25;
  const JUMEAUX = [
    { sx: 'mm', hello: 'Chef ! On est jumeaux. Les humains nous ont séparés tout petits, et on a mis dix hivers à se retrouver. Maintenant, on ne se quitte plus : c\'est nous deux, ou personne.', orig: 'Les humains m\'ont séparé de {o} quand on était tout petits. On a mis dix hivers à se retrouver.' },
    { sx: 'ff', hello: 'Chef, on est — jumelles. On finit — les phrases — de l\'autre. On cherche — un clan — pour deux. Tu veux — bien de nous ?', orig: '{o} et moi, on est jumelles : on finit les phrases l\'une de l\'autre. C\'est pratique, sauf pour les secrets.' },
    { sx: 'mf', hello: 'On est nés la même nuit, sous le même champignon géant. Notre mère disait qu\'on portait bonheur. L\'ancien clan disait malheur, et il nous a chassés. Tu veux bien tenter ta chance ?', orig: '{o} et moi, on est nés la même nuit sous le même champignon géant. Il paraît qu\'on porte bonheur. Ou malheur. Les avis sont partagés.' },
    { sx: 'mm', hello: 'Mesdames et messieurs... euh, chef ! Voici les Jumeaux Culbute, acrobates ! Notre cirque a brûlé. On sait jongler, tomber et se relever. Tu nous prends dans ta troupe ?', orig: 'Avec {o}, on était acrobates dans un cirque : les Jumeaux Culbute. Le cirque a brûlé, mais on sait encore tomber avec élégance.' },
    { sx: 'ff', hello: 'C\'est moi l\'aînée ! — Non, c\'est moi ! — Chef, tranche : qui est sortie la première ? ... Bon. En attendant ta réponse, on peut rester ?', orig: 'Je suis la jumelle de {o}. C\'est moi l\'aînée, quoi qu\'elle en dise.' },
    { sx: 'mf', hello: 'Chef, on a fait une promesse à notre grand-mère : ne jamais dormir dans deux huttes différentes. Alors c\'est simple : tu nous prends tous les deux, ou on repart tous les deux.', orig: 'J\'ai promis à ma grand-mère de ne jamais dormir loin de {o}. Une promesse de jumeaux, ça ne se casse pas.' }
  ];
  const PAIRES = { mm: [['Zig', 'Zag'], ['Tic', 'Tac'], ['Bim', 'Bam'], ['Pif', 'Paf'], ['Clic', 'Clac']], ff: [['Mimi', 'Momo'], ['Zaza', 'Zizi'], ['Nini', 'Nana'], ['Lili', 'Lola']], mf: [['Tok', 'Tika'], ['Rok', 'Roka'], ['Bulo', 'Bula'], ['Krok', 'Kroka']] };
  // les deux jumeaux viennent d'entrer dans le clan : même peau, des noms qui vont ensemble, et leur histoire commune
  function jumeler(a, b, J) {
    const pris = new Set(S.goblins.filter(g => g !== a && g !== b).map(g => g.name)), l = PAIRES[J.sx].filter(q => !pris.has(q[0]) && !pris.has(q[1]));
    if (l.length) { const q = pick(l); a.name = q[0]; b.name = q[1]; }
    b.hue = a.hue; b.lum = a.lum; a.jumeau = b.id; b.jumeau = a.id;
    const dit = (g, o) => { let t = J.orig.replace('{o}', o.name); if (g.sex === 'f') t = t.replace('m\'ont séparé ', 'm\'ont séparée ').replace('on est nés', 'on est nés'); return t; };
    a.bio[0] = dit(a, b); b.bio[0] = dit(b, a);
  }
  D.startVisit = function (ev) {
    if (ev.role === 'animal') return CG.P.startVisit();
    const exitName = pick(['ouest', 'est', 'sud']), e = W.EXITS[exitName], f = G.firePos(), def = VIS[ev.role];
    const ex = { x: e.x * T + T / 2, y: e.y * T + T / 2 };
    if (ev.role === 'nomade') {
      const J = Math.random() < D.JUMEAUX ? pick(JUMEAUX) : null, n = J ? 2 : CG.irand(2, 3), group = [], teinte = rand(78, 128); group.jumeaux = J; group.hello = J ? J.hello : pick(ERRANTS);
      for (let i = 0; i < n; i++) { const v = mkVisitor('nomade', 'gobelin', ex.x + rand(-20, 20), ex.y + rand(-20, 20), { x: f.x - 30 + i * 34, y: f.y + 96 + (i % 2) * 14 }, ex); v.sex = J ? J.sx[i] : Math.random() < 0.5 ? 'f' : 'm'; v.hue = J ? teinte : rand(78, 128); v.group = group; group.push(v); }
      group[0].annonce = J ? ['Des jumeaux errants', 'Deux gobelins qui se ressemblent comme deux gouttes d\'eau attendent près de ton feu. Va leur parler (E).', '#bfe8ff'] : [def.nom, 'Des visiteurs attendent près de ton feu. Va leur parler (E).', '#bfe8ff']; return; /* l'annonce se fait quand ils sont rendus au village (updateVisitors) */
    } else { const v = mkVisitor(ev.role, def.look, ex.x, ex.y, { x: f.x - 96, y: f.y + 74 }, ex); v.shop = stockFor(ev.role); v.sells = ev.role === 'nain' || ev.role === 'demonMarchand'; v.annonce = [def.nom, 'Un visiteur attend près de ton feu. Va lui parler (E).', '#bfe8ff']; }
  };
  D.TRIBUT = { or: [12, 5, 0.7], food: [10, 4, 0.6], bois: [14, 4, 0.6] }; /* [base, par jour, par jour au carré] */
  D.startDemand = function () {
    const e = W.EXITS.nord, f = G.firePos(), ex = { x: e.x * T + T / 2, y: e.y * T + T / 2 }, day = S.day;
    const kinds = ['or', 'food', 'bois', 'duel'], kind = day === 3 ? 'food' : pick(kinds);
    /* le tribut grossit de plus en plus vite avec les jours : base + par jour + un supplément qui monte au carré (D.TRIBUT) */
    const TR = D.TRIBUT[kind] || D.TRIBUT.bois, n = Math.max(5, Math.round((TR[0] + day * TR[1] + day * day * TR[2]) / 5) * 5);
    const lord = mkVisitor('seigneur', 'seigneur', ex.x, ex.y, { x: f.x + 6, y: f.y - 104 }, ex); lord.leaveAt = 99;
    const group = [lord], ne = Math.min(5, 2 + Math.floor(day / 4));
    for (let i = 0; i < ne; i++) { const v = mkVisitor('escorte', 'demon', ex.x + rand(-30, 30), ex.y + rand(-30, 30), { x: f.x + 6 + (i - (ne - 1) / 2) * 44, y: f.y - 150 - (i % 2) * 16 }, ex); v.leaveAt = 99; group.push(v); }
    R.event = { type: 'demande', demand: { kind, n }, timer: 80, lord, group };
    lord.annonce = ['Un seigneur démon veut te parler', 'Il est descendu du portail du nord avec son escorte. Ne le fais pas attendre : il perd vite patience.', '#e0a8ff', 'horn'];
  };
  function leave(v) { v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); }
  D.demandHostile = function (why) {
    const ev = R.event; if (!ev || ev.type !== 'demande') return;
    ev.group.forEach(v => { const i = R.visitors.indexOf(v); if (i >= 0) R.visitors.splice(i, 1); G.spawnEnemy(v.role === 'seigneur' ? 'seigneur' : S.day < 5 ? 'diablotin' : 'demon', v.x, v.y); });
    R.event = { type: 'attack', kind: 'demons' }; R.alarm = true;
    G.banner('Les démons attaquent !', why, '#ff9a8a'); CG.sfx('attaque');
  };
  function demandPay() {
    const ev = R.event, d = ev.demand; if (!ev || S.res[d.kind] < d.n) { CG.sfx('no'); CG.UI.toast('Tu n\'as plus de quoi payer !'); return; }
    G.pay({ [d.kind]: d.n }); ev.group.forEach(leave); R.event = null;
    if (Math.random() < 0.4) { CG.UI.toast('Le seigneur démon : « Sage décision. Voici pour ta peine. »'); G.giveScroll(pick(CG.SCROLL_POOL), ev.lord.x, ev.lord.y); }
    else CG.UI.toast('Les démons repartent vers leur portail, satisfaits.');
  }
  function demandDuel() {
    const ev = R.event, lord = ev.lord;
    ev.group.forEach(v => { if (v === lord) return; R.visitors.splice(R.visitors.indexOf(v), 1); G.spawnEnemy(S.day < 5 ? 'diablotin' : 'demon', v.x, v.y, { mul: 1.25, hunt: true }); });
    R.event = { type: 'attack', kind: 'duel', lord }; R.alarm = true; G.banner('Le défi des démons !', 'Bats les champions du seigneur.', '#ff9a8a'); CG.sfx('attaque');
  }
  D.talk = function (v) {
    const UI = CG.UI, ev = R.event;
    if (v.role === 'animal') return CG.P.talk(v);
    if (v.role === 'escorte') return UI.dialog({ visitor: v, who: 'Démon d\'escorte', text: 'Grrr. Parle au maître, vermine verte.', options: [{ label: 'D\'accord...' }] });
    if (v.role === 'seigneur') {
      if (!ev || ev.type !== 'demande') return UI.dialog({ visitor: v, who: 'Seigneur démon', text: 'Montre-moi ce que valent les gobelins.', options: [{ label: 'Tu vas voir !' }] });
      const d = ev.demand;
      if (d.kind === 'duel') return UI.dialog({ visitor: v, who: 'Seigneur démon', text: 'On dit que ton clan sait se battre. Prouve-le : affronte mes champions ! Si tu gagnes, je te récompense. Si tu refuses, je brûle tout.',
        options: [{ label: '⚔️ J\'accepte le défi', fn: demandDuel }, { label: '🔥 Hors de mon village !', sub: 'Tous les démons attaquent', fn: () => D.demandHostile('Tu as insulté le seigneur démon.') }] });
      const r = CG.RES[d.kind], can = S.res[d.kind] >= d.n;
      return UI.dialog({ visitor: v, who: 'Seigneur démon', text: 'Écoute bien, petit chef. Je veux ' + d.n + ' ' + r.icon + ' ' + r.nom.toLowerCase() + '. Donne-les-moi, et ton village restera debout.',
        options: [{ label: '🤝 Payer ' + d.n + ' ' + r.icon, sub: can ? 'Les démons repartent' : 'Tu n\'en as pas assez (' + Math.floor(S.res[d.kind]) + ')', disabled: !can, fn: demandPay },
          { label: '⚔️ Refuser', sub: 'Les démons attaquent', fn: () => D.demandHostile('Tu as refusé de payer le tribut.') }, { label: '🤔 Je réfléchis...', sub: 'Il ne patientera pas longtemps' }] });
    }
    if (v.role === 'nomade') {
      const n = v.group.filter(o => R.visitors.includes(o)).length, room = G.capacity() - S.goblins.length, wt = v.group.wait;
      const J = v.group.jumeaux, seuls = J && (n < 2 || room < 2);
      v.group.forEach(o => { if (o.gros === undefined) o.gros = Math.random() < 0.18; }); const gros = v.group.filter(o => R.visitors.includes(o) && o.gros).length; /* certains sont bien ronds : on le dit avant de les accueillir */
      const hello = !wt ? (v.group.hello || VIS.nomade.hello) : wt.t > wt.max * 0.45 ? 'On attend sagement, chef. Tu nous as trouvé une place ?' : wt.t > wt.max * 0.2 ? 'Ça commence à être long, chef... On a faim et on a mal aux pieds. Alors ?' : 'Grrr ! On poireaute depuis des heures ! C\'est oui ou c\'est non ?!';
      return UI.dialog({ visitor: v, who: J ? 'Les jumeaux errants' : VIS.nomade.nom, tag: wt ? (wt.t > wt.max * 0.45 ? '⏳ ils attendent' : wt.t > wt.max * 0.2 ? '😒 ils s\'impatientent' : '😡 ils sont en colère') : J ? '👯 jumeaux' : '', text: hello + (gros ? (gros > 1 ? ' ' + gros + ' d\'entre eux ont un gros appétit : ils mangeront pour deux.' : n > 1 ? ' L\'un d\'eux a un gros appétit : il mangera pour deux.' : ' Il a un gros appétit : il mangera pour deux.') : ''),
        options: [{ label: '🛖 Bienvenue au clan !', sub: seuls ? 'Les jumeaux ne se séparent pas : il leur faut 2 places' : room > 0 ? Math.min(n, room) + ' gobelin(s) rejoignent le village' : 'Aucune place : bâtis d\'abord une hutte', disabled: room <= 0 || !!seuls, fn: () => { const neufs = []; v.group.filter(o => R.visitors.includes(o)).forEach((o, i) => { if (i < room) { const g = G.addGoblin(o.sex, 'aucun'); g.x = o.x; g.y = o.y; g.hue = o.hue; if (CG.Art8 && CG.Art8.randomLook) { g.look = g.look || CG.Art8.randomLook(g); g.look.belly = o.gros ? rand(1.3, 1.5) : Math.min(g.look.belly || 1, 1.15); } neufs.push(g); R.visitors.splice(R.visitors.indexOf(o), 1); } else leave(o); }); if (J && neufs.length === 2) jumeler(neufs[0], neufs[1], J); S.morale = Math.min(100, S.morale + 4); UI.toast('De nouveaux gobelins rejoignent le clan. Donne-leur un métier !'); } },
          { label: '⏳ Attendez un peu, je vous prépare une place.', sub: wt ? 'Ils attendent déjà... mais pas pour toujours' : 'Ils patientent près du feu, le temps de bâtir une hutte. Ne les fais pas trop attendre !', disabled: !!wt, fn: () => { v.group.wait = { t: 150, max: 150, stage: 0 }; v.group.forEach(o => { o.leaveAt = 99; }); G.say(v, pick(['D\'accord, chef. On attend ici.', 'Merci, chef ! On ne bouge pas.', 'On va se réchauffer près du feu en attendant.']), 4); CG.UI.toast('⏳ Les gobelins errants attendent ta réponse. Bâtis-leur une hutte avant qu\'ils perdent patience.'); } },
          { label: '👋 Désolé, passez votre chemin', fn: () => v.group.forEach(o => { if (R.visitors.includes(o)) leave(o); }) }] });
    }
    UI.shop(v, VIS[v.role]);
  };
  D.sellList = [{ res: 'bois', n: 10, or: 6 }, { res: 'cuir', n: 5, or: 8 }, { res: 'food', n: 10, or: 5 }, { res: 'minerai', n: 10, or: 10 }];
  // les gobelins errants à qui on a dit d'attendre : ils patientent, s'impatientent, se fâchent, puis s'en vont
  function waitStep(grp, dt) {
    const w = grp.wait, here = grp.filter(o => R.visitors.includes(o) && o.state === 'wait'); if (!here.length) { grp.wait = null; return; }
    if (CG.UI.modal && R.talking && here.includes(R.talking)) return; // pas pendant qu'on leur parle
    if (R.alarm) return; // ni pendant une attaque
    w.t -= dt; const k = w.t / w.max, who = pick(here);
    if (w.stage === 0 && k < 0.45) { w.stage = 1; G.say(who, pick(['Chef ? On attend toujours...', 'C\'est long... Tu nous as oubliés ?', 'On a faim, chef. Et mal aux pieds.']), 4.5); CG.UI.toast('😒 Les gobelins errants s\'impatientent.'); CG.sfx('no'); }
    else if (w.stage === 1 && k < 0.2) { w.stage = 2; here.forEach((o, i) => G.say(o, pick(['Grrr ! Ça suffit, l\'attente !', 'Il se moque de nous, ce chef !', 'Encore un peu et on s\'en va !', '😡']), 4.5, i * 0.5)); CG.UI.toast('😡 Les gobelins errants sont en colère : réponds-leur vite, ou ils partiront.'); CG.sfx('no'); }
    else if (w.t <= 0) {
      grp.wait = null; here.forEach((o, i) => { G.say(o, pick(['Tant pis ! On s\'en va !', 'On trouvera un meilleur clan !', 'Quel chef impoli. Adieu !', 'Pfff. Venez, on part.']), 4, i * 0.4); leave(o); o.rattrape = true; });
      S.morale = Math.max(0, S.morale - 3); G.banner('Les gobelins errants repartent, furieux', 'Tu les as fait trop attendre. (moral -3)', '#ff9a8a'); CG.sfx('no');
    }
    if (w.stage === 2 && Math.random() < dt * 1.5) G.text(who.x + rand(-6, 6), who.y - 58, '💢', '#fff');
  }
  function updateVisitors(dt) {
    const seen = new Set(); for (const v of R.visitors) if (v.group && v.group.wait && !seen.has(v.group)) { seen.add(v.group); waitStep(v.group, dt); }
    for (const v of R.visitors.slice()) {
      if (R.talking === v && CG.UI.modal && !CG.UI.modal.pauses) { v.moving = false; v.face = S.player.x > v.x ? 1 : -1; continue; }
      if (v.state === 'arrive') { if (G.follow(v, 47, dt)) { v.state = 'wait'; v.moving = false; if (v.annonce) { const a = v.annonce; v.annonce = null; G.banner(a[0], a[1], a[2]); CG.sfx('visiteurs'); } } } /* la nouvelle n'est donnée qu'une fois le visiteur rendu au village */
      else if (v.state === 'wait') { v.moving = false; v.face = S.player.x > v.x ? 1 : -1; if (S.hour >= v.leaveAt) { leave(v); v.rattrape = true; } } /* parti de lui-même : on peut encore le rattraper et lui parler */
      else if (G.follow(v, 50, dt)) R.visitors.splice(R.visitors.indexOf(v), 1);
    }
  }

  // ---------- la journée ----------
  D.feast = function () {
    const pop = S.goblins.length + S.goblins.filter(g => G.gourmand && G.gourmand(g)).length /* les gros mangeurs comptent pour deux */, need = Math.ceil(pop * 3 * (G.count('marmite') ? 0.75 : 1)) + CG.P.food();
    R.feast = true; R.fireLit = true; S.feastDay = S.day; R.dayStats.eaten = Math.min(need, Math.floor(S.res.food));
    if (S.res.food >= need) { S.res.food -= need; S.morale = Math.min(100, S.morale + 8 + (G.count('taverne') ? 4 : 0)); R.feastOk = true; G.addXp((8 + 2 * S.day) * (G.count('taverne') ? 2 : 1)); G.banner('La fête commence !', 'Le feu est allumé. On boit, on danse, on chante.', '#ffcf7a'); }
    else { // pas assez à manger : pas de feu, pas de fête. Tout le monde va se coucher, mécontent (la nourriture qui reste n'est pas touchée)
      const perte = 12 + Math.round(10 * (1 - S.res.food / need)); S.morale = Math.max(0, S.morale - perte); R.feastOk = false; R.fireLit = false; S.sansFeteDay = S.day; R.dayStats.eaten = 0;
      G.banner('Pas de fête ce soir', 'Il faut ' + need + ' 🍖 pour allumer le feu, et tu en as ' + Math.floor(S.res.food) + '. Le clan va se coucher le ventre creux. (moral -' + perte + ')', '#ff9a8a'); CG.sfx('no'); }
  };
  G.sansFete = () => !!S && S.sansFeteDay === S.day; // ce soir, il n'y avait pas de quoi manger
  D.canSleep = () => S.hour >= 19 && !R.alarm && !R.cine && !(R.event && R.event.type === 'demande');
  D.sleep = function () { if (D.canSleep() && !R.fadeDir) D.startNight(); };
  D.compose = (kind, day, boss) => compose(kind, day, boss);
  D.nextDay = function () {
    if (!R.feast) D.feast();
    const st = R.dayStats, lines = [];
    if (st.partis && st.partis.length) lines.push('🚪 Renvoyés du clan : ' + st.partis.join(', '));
    if (st.ruines) lines.push('🏚 ' + st.ruines + ' construction' + (st.ruines > 1 ? 's' : '') + ' en ruine : tes bricoleurs (ou toi, avec E) peuvent les rebâtir sans rien payer.');
    if (st.morts.length) lines.push('☠ Tombés au combat : ' + st.morts.join(', '));
    if (!R.feastOk) lines.push('😟 Le clan a eu faim hier soir. Le moral est à ' + Math.round(S.morale) + ' %.');
    if (S.morale <= 12 && S.goblins.length > 3) { const g = pick(S.goblins); G.resetGoblin(g); S.goblins.splice(S.goblins.indexOf(g), 1); lines.push('🚶 ' + g.name + ' a quitté le village, le ventre vide.'); }
    if (CG.Abri) CG.Abri.matin(lines);
    CG.Soc.endDay(lines); CG.P.morning(lines, R.feastOk);
    const babies = R.cine ? R.cine.shown : 0, mother = R.cine ? R.cine.g.name : ''; CG.Soc.endCine();
    S.goblins.forEach(g => { if (g.bebe) delete g.bebe; }); // les nouveau-nés d'hier ont grandi pendant la nuit
    if (babies) { const names = []; for (let i = 0; i < babies && S.goblins.length < G.capacity(); i++) { const g = G.addGoblin(Math.random() < 0.5 ? 'f' : 'm', 'aucun'); g.child = true; g.bebe = CG.irand(15, 20); g.hp = g.bebe; /* son premier jour : tout petit, lent, et 15 à 20 points de vie */ names.push(g.name); } if (names.length) lines.unshift('👶 ' + names.length + ' enfant' + (names.length > 1 ? 's sont nés' : ' est né') + ' de toi et de ' + mother + ' : ' + names.join(', ') + '. Va faire leur connaissance !'); R.lastBabies = names.length; } else R.lastBabies = 0;
    const hasM = S.goblins.some(g => g.sex === 'm'), hasF = S.goblins.some(g => g.sex === 'f');
    if (!babies && hasM && hasF && S.goblins.length < G.capacity() && S.morale >= 50 && R.feastOk && Math.random() < (S.goblins.length < 12 ? 0.9 : 0.65)) { const g = G.addGoblin(Math.random() < 0.5 ? 'f' : 'm', 'aucun'); lines.push('🌱 ' + g.name + ' est maintenant en âge de travailler. Donne-lui un métier !'); }
    else if (S.goblins.length >= G.capacity()) lines.push('🛖 Les huttes sont pleines : bâtis-en une nouvelle pour agrandir le clan.');
    if (G.count('puits')) { S.morale = Math.min(100, S.morale + 3); lines.push('🪣 L\'eau fraîche du puits fait du bien : +3 de moral.'); }
    if (G.count('caserne')) { S.goblins.forEach(g => { if (g.job === 'garde') G.gobXp(g, 5, 10); }); lines.push('⚔️ Les gardes se sont entraînés à la caserne.'); }
    const grown = D.regrow(); if (grown) lines.push('🌲 ' + grown + ' jeune' + (grown > 1 ? 's arbres ont repoussé' : ' arbre a repoussé') + ' en lisière. Bâtis sur le terrain dégagé pour le garder.');
    G.applyNames(lines);
    const nb = R.lastBabies, vie0 = Math.max(1, S.player.hp); S.day++; D.startDay(); R.lastBabies = nb;
    { const q = S.player; q.hp = Math.min(q.maxhp, vie0 + q.maxhp * (G.reposTaux ? G.reposTaux() : 1)); } // une nuit ne rend que la moitié de la vie (plus avec les « Bon sommeil » de l'arbre)
    if (st.ups && st.ups.length) lines.unshift('⭐ ' + (st.ups.length > 1 ? st.ups.length + ' gobelins ont monté de niveau : ' : 'Un gobelin a monté de niveau : ') + st.ups.join(', ') + '.');
    if (st.petUps && st.petUps.length) lines.unshift('🐾 ' + (st.petUps.length > 1 ? 'Tes animaux ont grandi : ' : 'Un animal a grandi : ') + st.petUps.join(', ') + '.');
    const best = S.goblins.filter(g => g.job !== 'aucun').sort((a, b) => b.lvl - a.lvl || b.xp - a.xp)[0];
    CG.save();
    // plus de bilan ni de nouvelles au réveil : la nuit s'enchaîne sur la journée

  };
  // Chaque nuit, la forêt regagne un peu de terrain : en lisière seulement, jamais à moins de 3 cases d'une construction.
  D.regrow = function () {
    const MW = CG.MW, logs = new Set(S.logs.map(l => W.idx(l.tx, l.ty)));
    S.young = [];
    for (const i of S.cuts.slice()) {
      if (W.tile[i] !== W.CLEAR || logs.has(i) || Math.random() > 0.22) continue;
      const x = i % MW, y = (i - x) / MW; let edge = false;
      for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) if (W.inMap(x + dx, y + dy) && W.tile[W.idx(x + dx, y + dy)] === W.TREE) { edge = true; break; }
      if (!edge || S.buildings.some(b => x >= b.tx - 3 && x < b.tx + b.w + 3 && y >= b.ty - 3 && y < b.ty + b.h + 3)) continue;
      W.tile[i] = W.TREE; S.cuts.splice(S.cuts.indexOf(i), 1); S.young.push(i); W.paintRegrow(x, y);
    }
    W.fieldDirty = true; W.miniDirty = true; return S.young.length;
  };
  D.startDay = function () {
    S = CG.S; R = CG.R; R.young = new Set(S.young);
    S.hour = 6; R.secondUsed = false; R.fireLit = false; R.feast = false; R.eveningSaid = false; R.alarm = false; R.event = null; R.spawnQ = []; R.visitors = []; R.shots = []; R.playerCombatUntil = 0;
    R.dayStats = { food: 0, bois: 0, minerai: 0, cuir: 0, or: 0, kills: 0, morts: [], xp0: { lvl: S.player.lvl, xp: S.player.xp }, morale0: Math.round(S.morale) };
    R.enemies = [];
    D.rollWild();
    S.goblins.forEach((g, i) => { G.resetGoblin(g); g.hp = G.gobMaxHp(g); const d = G.door(S.buildings[g.home]); g.x = d.x + ((i * 7) % 5 - 2) * 9; g.y = d.y + (i % 3) * 6; });
    const p = S.player, d = G.door(G.find('chief')); p.x = d.x; p.y = d.y + 10; p.hp = p.maxhp; p.mp = p.maxmp; R.ko = 0;
    D.plan();
  };
  // Chaque matin : de nouvelles meutes et de nouveaux coffres, ailleurs dans les alentours.
  const WILD = [['loup', 1], ['sanglier', 1], ['gelee', 1], ['champi', 1], ['araignee', 2], ['brigand', 2], ['follet', 3], ['squelette', 3], ['ours', 4], ['ogre', 5], ['diablotin', 6], ['troll', 9]];
  const CHEST_NAMES = { commun: 'Coffre', vivres: 'Caisse de vivres', precieux: 'Coffre précieux', magique: 'Coffre magique', piege: 'Coffre', savoir: 'Idole ancienne', butin: 'Malle de butin' };
  D.rollWild = function () {
    const f = W.field(), day = S.day, spots = [], nPacks = 7 + Math.min(6, Math.floor(day / 2)), nSpots = nPacks + 11;
    for (let k = 0; k < 900 && spots.length < nSpots; k++) {
      const tx = CG.irand(3, CG.MW - 4), ty = CG.irand(3, CG.MH - 4);
      if (f[W.idx(tx, ty)] < 0 || W.tile[W.idx(tx, ty)] === W.FLAT || Math.hypot(tx - W.CX, ty - W.CY) < 15 || Math.hypot(tx - W.GRAVE.x, ty - W.GRAVE.y) < 9 || (S.camps || []).some(c => Math.hypot(c.x - tx, c.y - ty) < 9) || (W.sites || []).some(s => Math.hypot(s.x - tx, s.y - ty) < s.r + 5)) continue; // ni meute ni repaire dans le cimetière, ni sur un repaire déjà installé
      if (spots.some(s => Math.hypot(s.x - tx, s.y - ty) < 8) || S.buildings.some(b => Math.hypot(b.tx - tx, b.ty - ty) < 6)) continue;
      spots.push({ x: tx, y: ty });
    }
    const taken = new Set(W.nodes.map(n => W.idx(n.x, n.y)));
    const types = WILD.filter(w => day >= w[1]).map(w => w[0]);
    R.chests = []; R.siteDone = {}; R.siteN = {}; R.siteCoffre = {};
    // les lieux connus (ruines, cimetière, nid...) restent là : chaque jour un peu plus peuplés, avec des monstres plus coriaces, et un coffre caché ailleurs dans le lieu
    (W.sites || []).forEach(s => {
      const free = [];
      for (let dy = -s.r; dy <= s.r; dy++) for (let dx = -s.r - 1; dx <= s.r + 1; dx++) { const x = s.x + dx, y = s.y + dy; if (W.inMap(x, y) && f[W.idx(x, y)] >= 0 && W.walkTile(x, y) && !taken.has(W.idx(x, y))) free.push({ x, y }); }
      if (!free.length) return;
      CG.shuffle(free);
      const av = s.mobs.filter(m => day >= m[1]).map(m => m[0]), n = s.k === 'nid' && CG.Nid && CG.Nid.age ? Math.min(s.base + 7, s.base - 1 + Math.round(CG.Nid.age() * 1.2)) : Math.min(s.base + 6, s.base + Math.floor((day - 1) * 0.7)), /* le nid : peu d'araignées quand on le nettoie souvent, de plus en plus si on le laisse */ k = Math.min(1.5, 1 + (day - 1) * 0.04);
      let gros = 0;
      for (let i = 0; i < n; i++) {
        let type = av[Math.floor(Math.pow(Math.random(), 0.7) * av.length)]; // les plus récents (les plus forts) un peu plus rarement
        if (CG.ENEMIES[type].cost >= 5) { if (gros >= 1 + Math.floor(day / 6)) type = av[0]; else gros++; }
        const t = free[(i + 1) % free.length], e = G.spawnEnemy(type, t.x * T + T / 2 + rand(-8, 8), t.y * T + T / 2 + rand(-8, 8), { wild: true });
        if (e) e.site = s.k;
        if (e && k > 1) { e.hp = e.maxhp = Math.round(e.maxhp * k); e.dmg *= 1 + (k - 1) * 0.6; }
      }
      const c = W.center(free[0].x, free[0].y), r = Math.random();
      const coffre = { x: c.x, y: c.y, kind: r < 0.4 ? 'precieux' : r < 0.6 ? 'butin' : r < 0.8 ? 'savoir' : 'magique', open: false };
      if (s.k === 'cimetiere' || s.k === 'nid') (R.siteCoffre || (R.siteCoffre = {}))[s.k] = coffre; /* au cimetière et au nid d'araignées, le coffre ne sort de terre qu'une fois tous les monstres tombés (camps.js) */ else R.chests.push(coffre);
    });
    // les repaires prennent les endroits les plus éloignés du village
    spots.sort((a, b) => Math.hypot(a.x - W.CX, a.y - W.CY) - Math.hypot(b.x - W.CX, b.y - W.CY)); const far = spots.splice(Math.max(0, spots.length - 4)); CG.shuffle(far); CG.shuffle(spots);
    spots.forEach((s, i) => {
      const c = W.center(s.x, s.y), guarded = i < nPacks;
      if (guarded) {
        const type = pick(types), cost = CG.ENEMIES[type].cost; let budget = 2.2 + day * 0.45, n = 0;
        while ((budget >= cost || n === 0) && n < 5) {
          budget -= cost; n++; let x = c.x + rand(-46, 46), y = c.y + rand(-40, 40); if (!W.walkPx(x, y)) { x = c.x; y = c.y; }
          G.spawnEnemy(type, x, y, { wild: true });
        }
      }
      if (!guarded || Math.random() < 0.6) {
        const r = Math.random(), kind = r < 0.26 ? 'commun' : r < 0.42 ? 'vivres' : r < 0.55 ? 'savoir' : r < 0.69 ? 'butin' : r < 0.81 ? 'precieux' : r < 0.89 ? 'magique' : 'piege';
        R.chests.push({ x: c.x, y: c.y, kind, open: false });
      }
    });
    CG.Camps.roll(far);
  };
  D.openChest = function (c) {
    const day = S.day, p = S.player; c.open = true; CG.sfx(c.kind === 'piege' ? 'warning' : 'coffre'); G.puff(c.x, c.y - 10, '#ffe36b', 16, 110, 3); G.addXp(5 + day);
    // le butin jaillit et retombe autour du coffre : il suffit de marcher dessus
    const res = (r, n) => G.dropRes(c.x, c.y, r, n);
    if (c.kind === 'commun') res('or', 8 + day * 2 + CG.irand(0, 8));
    else if (c.kind === 'vivres') { res('food', 8 + day); const r = pick(['bois', 'minerai', 'cuir']); res(r, r === 'bois' ? 8 : 4); }
    else if (c.kind === 'precieux') { res('or', 25 + day * 4); G.drop(c.x, c.y, { kind: 'potion', n: 1 }); }
    else if (c.kind === 'magique') { G.drop(c.x, c.y, { kind: 'potion', n: 1 }); for (let i = 0; i < 3; i++) G.drop(c.x, c.y, { kind: 'xp', n: 4 + day * 2 }); } // plus de parchemin dans les coffres
    else if (c.kind === 'savoir') { const n = 14 + day * 6; for (let i = 0; i < 4; i++) G.drop(c.x, c.y, { kind: 'xp', n: Math.round(n / 4) }); }
    else if (c.kind === 'butin') { res('bois', 10 + day); res('minerai', 5 + Math.floor(day / 2)); res('cuir', 3 + Math.floor(day / 3)); }
    else { // piégé !
      G.text(c.x, c.y - 50, 'C\'était un piège !', '#ff9a8a', true);
      const type = day >= 2 ? pick(['gelee', 'araignee', 'champi']) : 'gelee';
      for (let i = 0; i < 2 + Math.min(3, Math.floor(day / 3)); i++) { const a = i * 2.1; let x = c.x + Math.cos(a) * 44, y = c.y + Math.sin(a) * 40; if (!W.walkPx(x, y)) { x = c.x; y = c.y; } const e = G.spawnEnemy(type, x, y, { wild: true }); e.target = p; e.seek = 2; G.puff(x, y - 10, '#a070d0', 8); }
      G.dropRes(c.x, c.y, 'or', 5 + day);
    }
  };
  D.update = function (dt) {
    S = CG.S; R = CG.R;
    const attack = R.event && R.event.type === 'attack';
    S.hour = Math.min(attack ? (S.hour > 24 ? 29.98 : 23.98) : 30, S.hour + dt / D.HOUR); /* après minuit, le chef peut rester debout jusqu'à 6 h (30 au compteur) : fatigue.js */
    for (const q of R.spawnQ) { q.t -= dt; if (q.t <= 0) { G.spawnEnemy(q.type, q.x, q.y, { exit: { x: q.x, y: q.y } }); } }
    R.spawnQ = R.spawnQ.filter(q => q.t > 0);
    if (!R.event) { const ev = R.schedule.find(e => !e.done && S.hour >= e.h); if (ev) { ev.done = true; if (ev.type === 'attack') D.startAttack(ev); else if (ev.type === 'visit') D.startVisit(ev); else D.startDemand(); } }
    if (attack && R.event.quiet && !R.alarm && (R.watchT = (R.watchT || 0) - dt) <= 0) { R.watchT = 0.4; if (R.enemies.some(e => e.event && !e.dead && !e.retreat && D.nearVillage(e))) D.soundAlarm(); }
    if (attack) R.event.time = (R.event.time || 0) + dt; // l'attaque dure tant qu'il reste un ennemi debout
    // un assaillant resté en plan loin du village (coincé en route, ou jamais parti de son repaire) finit par renoncer : sinon l'alerte ne s'arrêterait jamais
    if (attack && (R.planT = (R.planT || 0) - dt) <= 0) { R.planT = 1;
      for (const e of R.enemies) { if (!e.event || e.dead || e.struct || e.hunt) continue;
        if (!e.plan || Math.hypot(e.x - e.plan.x, e.y - e.plan.y) > 40 || D.nearVillage(e) || CG.dist(e, S.player) < 320) { e.plan = { x: e.x, y: e.y, t: 0 }; continue; }
        if (++e.plan.t < D.RENONCE) continue;
        if (e.campId) { e.event = false; e.wild = { x: e.x, y: e.y }; e.target = null; e.aggro = null; e.path = null; e.plan = null; } else e.dead = true; } }
    if (attack && !R.spawnQ.length && !R.enemies.some(e => e.event && !e.dead && !e.struct)) endAttack();
    if (R.event && R.event.type === 'demande' && R.event.lord.state === 'wait' && !CG.UI.modal) { R.event.timer -= dt; if (R.event.timer <= 0) D.demandHostile('« Tu oses m\'ignorer ?! »'); }
    updateVisitors(dt); CG.Soc.update(dt);
    if (S.hour >= 19 && !R.eveningSaid && !R.alarm) { R.eveningSaid = true; G.banner('Le soir tombe', 'Les gobelins rentrent pour la fête. Va à ta hutte (E) quand tu veux dormir.', '#ffcf7a'); }
    if (S.hour >= 20 && !R.feast && !R.alarm) D.feast();
    if (S.hour >= 30 && !R.fadeDir) { if (CG.Fatigue) CG.Fatigue.matin(); else D.startNight(); }
    if (R.fadeDir) { R.fade = CG.clamp(R.fade + R.fadeDir * dt * 1.4, 0, 1); if (R.fade >= 1 && R.fadeDir > 0) { R.fadeDir = -1; D.nextDay(); } else if (R.fade <= 0) R.fadeDir = 0; }
  };

  // ---------- interactions (touche E) ----------
  D.BUSH_FOOD = 4;
  D.findInteract = function () {
    const p = S.player; if (R.ko > 0 || R.cine) return null;
    if (R.build) return { type: 'build', label: 'Bâtir ici' };
    let best = null, bd = 70;
    for (const v of R.visitors) { if (v.state === 'leave' && !v.rattrape) continue; const d = dist(p, v); if (d < bd) { bd = d; best = { type: 'visitor', obj: v, label: 'Parler' }; } }
    if (best) return best;
    for (let i = 0; i < W.chestDefs.length; i++) { if (S.chests.includes(i)) continue; const c = W.center(W.chestDefs[i].x, W.chestDefs[i].y); if (dist(p, c) < 54) return { type: 'chest', obj: i, label: 'Ouvrir le coffre' }; }
    for (const n of W.nodes) if (n.type === 'bush' && !n.gone && Math.hypot(n.x * T + T / 2 - p.x, n.y * T + T / 2 - p.y) < 46) return { type: 'bush', obj: n, label: R.picking && R.picking.n === n ? 'Cueillette en cours... (ne bouge pas)' : 'Cueillir ' + (CG.Art.baie ? CG.Art.baie(n).nom : 'le buisson') + ' (+' + D.BUSH_FOOD * (CG.Art.baie && CG.Art.baie(n) === CG.Art.BAIES[3] ? CG.Art.DOREE_FOIS : 1) + ' 🍖)' };
    for (const c of R.chests) if (!c.open && dist(p, c) < 54) return { type: 'chestDay', obj: c, label: 'Ouvrir : ' + CHEST_NAMES[c.kind] };
    for (const b of S.buildings) if (b.site) { const d = G.door(b); if (Math.hypot(d.x - p.x, d.y - 20 - p.y) < 46 + b.w * 12) return { type: 'site', obj: b, label: 'Donner un coup de marteau' }; }
    for (const a of S.pets) if (!a.ko && dist(p, a) < 44) return { type: 'pet', obj: a, label: 'Voir ' + a.name };
    const door = G.door(G.find('chief')), nearDoor = dist(p, door) < 58;
    if (nearDoor && D.canSleep()) return { type: 'sleep', label: 'Dormir jusqu\'au matin' };
    bd = 56;
    for (const g of S.goblins) { if (g.hidden) continue; const d = dist(p, g); if (d < bd) { bd = d; best = { type: 'goblin', obj: g, label: !g.met ? 'Faire connaissance' : CG.Soc.taskFor(g) ? 'Parler à ' + g.name + ' 📌 (ta promesse)' : R.fireLit && g.state === 'party' && CG.Soc.courtable(g) ? 'Parler à ' + g.name + ' 💕' : 'Parler à ' + g.name }; } }
    if (best) return best;
    for (const b of S.buildings) if (b.type === 'hut' && !b.site && dist(p, G.door(b)) < 50) return { type: 'hut', obj: b, label: 'Voir qui habite ici' };
    if (nearDoor) return { type: 'home', label: R.alarm ? 'Ta hutte' : 'Faire une sieste dans ta hutte' };
    return null;
  };
  D.interact = function () {
    const it = D.findInteract(); if (!it) return;
    if (it.type === 'build') return D.placeBuild();
    if (it.type === 'visitor') return D.talk(it.obj);
    if (it.type === 'goblin') return CG.Soc.talk(it.obj);
    if (it.type === 'site') { if (R.atkCd > 0) return; R.atkCd = 0.4; R.chefPose = { k: 'build', fin: R.t + 0.62 }; /* un marteau en main */ G.buildWork(it.obj, 1.3, S.player); return; }
    if (it.type === 'sleep') return D.sleep();
    if (it.type === 'hut') return CG.UI.hut(it.obj);
    if (it.type === 'pet') return CG.P.talkPet(it.obj);
    if (it.type === 'home') return R.alarm ? CG.UI.toast('Pas question de dormir pendant une attaque !') : CG.Sieste ? CG.Sieste.debut() : CG.UI.toast('Tu pourras dormir ici à la tombée du soir (19 h).');
    if (it.type === 'chestDay') return D.openChest(it.obj);
    if (it.type === 'bush') { // le chef arrache le buisson et garde les baies ; il repoussera demain
      if (!R.picking) { R.picking = { n: it.obj, t: 0, max: 2.2, px: S.player.x, py: S.player.y }; CG.sfx('chop'); } return;
    }
    if (it.type === 'chest') {
      const i = it.obj, c = W.chestDefs[i], pos = W.center(c.x, c.y), l = c.loot; S.chests.push(i); CG.sfx('coffre'); G.puff(pos.x, pos.y - 10, '#ffe36b', 16, 110, 3);
      ['or', 'minerai'].forEach(r => { if (l[r]) G.dropRes(pos.x, pos.y, r, l[r]); });
      for (let k = 0; k < (l.potion || 0); k++) G.drop(pos.x, pos.y, { kind: 'potion', n: 1 });
      if (l.scroll) { G.dropRes(pos.x, pos.y, 'or', 30); G.drop(pos.x, pos.y, { kind: 'potion', n: 1 }); } // les parchemins ne se trouvent plus dans les coffres
      G.addXp(15);
    }
  };
  D.buildSpot = function () {
    const p = S.player, type = R.build.type, dem = type === 'demolir', b = dem ? { w: 1, h: 1, cout: {} } : CG.BUILDS[type];
    const px = Math.floor(p.x / T), py = Math.floor(p.y / T), reach = b.w === 1 && b.h === 1 ? 1 : 2;
    const cx = px + Math.round(R.dir.x * reach), cy = py + Math.round(R.dir.y * reach);
    const tx = cx - (b.w > 1 && R.dir.x < -0.3 ? b.w - 1 : 0), ty = cy - (b.h > 1 && R.dir.y < -0.3 ? b.h - 1 : 0);
    if (dem) { const t = G.buildingAt(tx, ty); return G.canDemolish(t) ? { tx: t.tx, ty: t.ty, w: t.w, h: t.h, ok: true, target: t } : { tx, ty, w: 1, h: 1, ok: false }; }
    if (b.terrain) return { tx, ty, w: 1, h: 1, ok: W.terrainOk(tx, ty, b.terrain) && G.canPay(b.cout) };
    let ok = W.canBuild(tx, ty, b.w, b.h, b.on) && G.canPay(b.cout);
    if (ok && px >= tx && px < tx + b.w && py >= ty && py < ty + b.h) ok = false;
    return { tx, ty, w: b.w, h: b.h, ok };
  };
  function repathGoblins() { S.goblins.forEach(g => { if (g.path && g.path.length) { const d = g.path[g.path.length - 1]; if (!G.goTo(g, d.x, d.y)) G.resetGoblin(g); } }); }
  D.placeBuild = function () {
    const sp = D.buildSpot(), type = R.build.type;
    if (type === 'demolir') {
      if (!sp.ok) { CG.sfx('no'); CG.UI.toast('Rien à démolir ici (les huttes, la réserve et le feu restent en place).'); return; }
      G.removeBuilding(sp.target, true); CG.sfx('fire'); repathGoblins(); return;
    }
    const b = CG.BUILDS[type];
    if (b.terrain) {
      if (!sp.ok) { CG.sfx('no'); CG.UI.toast(!G.canPay(b.cout) ? 'Il te manque des ressources.' : b.terrain === 'path' ? 'Un chemin se trace sur de l\'herbe libre.' : 'Le gazon se sème sur un sentier ou une clairière.'); return; }
      G.pay(b.cout); W.setTerrain(sp.tx, sp.ty, b.terrain); S.terra[W.idx(sp.tx, sp.ty)] = W.sous && W.sous.i === W.idx(sp.tx, sp.ty) ? W.sous.v : W.tile[W.idx(sp.tx, sp.ty)]; /* sous un bâtiment : soussol.js */ CG.sfx('ok'); G.puff((sp.tx + 0.5) * T, (sp.ty + 0.5) * T, b.terrain === 'path' ? '#a58a5c' : '#6ab04a', 8, 70, 3);
      if (!G.canPay(b.cout)) R.build = null; return;
    }
    if (!sp.ok) { CG.sfx('no'); CG.UI.toast(!G.canPay(b.cout) ? 'Il te manque des ressources.' : b.on === 'water' ? 'Un pont se pose sur l\'eau : une douve ou un étang.' : (b.on === 'road' ? 'Impossible ici : la case doit être libre (herbe ou sentier).' : 'Impossible ici : il faut de l\'herbe dégagée (ni arbre, ni sentier).')); return; }
    G.pay(b.cout); const nb = { type, tx: sp.tx, ty: sp.ty, w: b.w, h: b.h, variant: S.buildings.length % 3 }; nb.site = true; nb.prog = 0; nb.need = G.siteNeed(type); if (b.barrier) nb.hp = b.hp * 0.5;
    S.buildings.push(nb); W.blockBuilding(nb); CG.sfx('poser');
    if (!S.goblins.some(g => g.job === 'aucun') && !R.warnedBuilder) { R.warnedBuilder = true; CG.UI.toast('🔨 Aucun bricoleur pour bâtir ! Garde un gobelin comme bricoleur, ou frappe toi-même le chantier (E).'); }
    if (!b.repeat || !G.canPay(b.cout)) R.build = null;
    const c = { x: (nb.tx + nb.w / 2) * T, y: (nb.ty + nb.h / 2) * T }; G.puff(c.x, c.y, '#c9a56b', b.repeat ? 8 : 24, 120, 5); if (!b.repeat) G.text(c.x, c.y - 50, 'Chantier : ' + b.nom, '#ffe9a8');
    repathGoblins();
  };
})(window.CG);
