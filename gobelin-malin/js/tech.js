// Clan Gobelin — arbre des technologies : pouvoirs du chef, constructions à débloquer, améliorations.
'use strict';
(function (CG) {
  const G = CG.G;
  CG.TECH_BRANCHES = [
    { id: 'def', nom: '🛡️ Défense du village' }, { id: 'clan', nom: '🏘️ Bâtisseurs et vie du clan' },
    { id: 'guer', nom: '⚔️ Pouvoirs du guerrier' }, { id: 'sorc', nom: '✨ Pouvoirs du sorcier' }
  ];
  // t = colonne (1 à 5), r = rangée dans la branche, req = technologies requises, unlock = constructions révélées
  const N = (id, br, t, r, cout, icon, nom, desc, extra) => Object.assign({ id, br, t, r, cout, icon, nom, desc }, extra || {});
  CG.TECH = [
    // ---- défense
    N('d1', 'def', 1, 2, 1, '📌', 'Piège à pointes', 'Révèle le Piège à pointes.', { unlock: ['piege'] }),
    N('d18', 'def', 4, 0, 2, '🕸️', 'Filets', 'Révèle le Piège à filet.', { req: ['d10'], unlock: ['filet'] }),
    N('d19', 'def', 5, 0, 2, '🕳️', 'Fosses', 'Révèle la Fosse à pieux.', { req: ['d18'], unlock: ['fosse'] }),
    N('d15', 'def', 5, 1, 2, '💥', 'Poudre noire', 'Révèle le Baril explosif.', { req: ['d18'], unlock: ['baril'] }),
    N('b17', 'clan', 2, 1, 1, '🎠', 'Aire de jeux', 'Révèle les Balançoires.', { req: ['b1'], unlock: ['balancoire'] }),
    N('b19', 'clan', 4, 1, 2, '🌿', 'Herboristerie', 'Tes guérisseurs soignent deux fois plus vite, et de plus loin autour de leur hutte.', { req: ['b9'] }),
    N('b20', 'clan', 5, 4, 2, '📦', 'Entrepôts', 'Révèle le Dépôt : un second endroit où tes gobelins déposent bois, nourriture et minerai, pour raccourcir leurs trajets.', { req: ['b13'], unlock: ['depot'] }),
    N('b24', 'clan', 5, 5, 2, '🎓', 'École des animaux', 'Révèle l\'École des animaux : un animal y passe une journée, puis il sait t\'obéir.', { req: ['b18'], unlock: ['ecoleAnimaux'] }),
    N('b18', 'clan', 2, 4, 1, '🥣', 'Dressage', 'Révèle la Mangeoire pour tes animaux.', { req: ['b1'], unlock: ['mangeoire'] }),
    N('d8', 'def', 4, 5, 2, '🚧', 'Clôtures de métal', 'Troisième palier : un muret de pierre peut devenir une clôture en métal, et un portail de pierre un portail en métal. Va à côté (E).', { req: ['d11'] }),
    N('d10', 'def', 2, 1, 2, '☠️', 'Pointes empoisonnées', 'Les pièges font double dégâts et ralentissent.', { req: ['d1'] }),
    N('d25', 'def', 2, 5, 1, '🪵', 'Palissades', 'Révèle la Palissade : un mur de rondins, bien plus solide qu\'une clôture.', { unlock: ['palissade'] }),
    N('d23', 'def', 2, 4, 1, '🔔', 'Appel aux armes', 'Révèle la Cloche d\'alarme : pendant une attaque, sonne-la : tes gardes et tes gobelins armés sortent se battre jusqu\'à ce que le village soit sauf.', { req: ['d1'], unlock: ['cloche'] }),
    N('d20', 'def', 5, 2, 2, '⚙️', 'Mécanismes', 'Révèle le Lance-pieux : un mécanisme qui se fixe sur une clôture et tire d\'un côté.', { req: ['d6'], unlock: ['mecaPieux'] }),
    N('d21', 'def', 5, 3, 2, '🔥', 'Lance-flammes', 'Révèle le Lance-flammes, à fixer sur une clôture.', { req: ['d20'], unlock: ['mecaFlamme'] }),
    N('d22', 'def', 5, 5, 2, '🧪', 'Rune gluante', 'Révèle la Rune gluante, à fixer sur une clôture : sa magie rend le sol collant.', { req: ['d8'], unlock: ['mecaGlu'] }),
    N('d3', 'def', 2, 2, 1, '🧱', 'Maçonnerie', 'Tes bricoleurs savent tailler la pierre : une clôture peut devenir un muret, un portail un portail de pierre, une palissade un mur de pierre, une hutte (la tienne aussi) une maison de pierre. Va à côté (E) : ça prend du temps.', { req: ['d1'] }),
    N('d4', 'def', 3, 1, 1, '💧', 'Douves', 'Révèle la Douve.', { req: ['d3'], unlock: ['douve'] }),
    N('d17', 'def', 4, 1, 1, '🌉', 'Ponts', 'Révèle le Pont.', { req: ['d4'], unlock: ['pont'] }),
    N('d9', 'def', 3, 2, 2, '🏰', 'Murs de métal', 'Troisième palier : un mur de pierre ou une maison de pierre peuvent être plaqués de métal, le plus solide de tous. Va à côté (E).', { req: ['d3'] }),
    N('d5', 'def', 3, 3, 2, '🎯', 'Tour fortifiée', 'Tu peux fortifier tes tours de guet, une à la fois : va à côté (E). Socle de pierre, +50 % de dégâts, portée accrue.', { req: ['d3'] }),
    N('d11', 'def', 3, 4, 1, '🗿', 'Totem de guerre', 'Révèle le Totem de guerre.', { req: ['d1'], unlock: ['totem'] }),
    N('d6', 'def', 4, 2, 2, '🏹', 'Baliste', 'Révèle la Baliste.', { req: ['d5'], unlock: ['baliste'] }),
    N('d7', 'def', 4, 3, 3, '👑', 'Donjon d\'archers', 'Tu peux changer une tour fortifiée en donjon : va à côté (E). Dégâts doublés, tir bien plus rapide.', { req: ['d5'] }),
    N('d12', 'def', 4, 4, 2, '⚔️', 'Caserne', 'Révèle la Caserne.', { req: ['d11'], unlock: ['caserne'] }),
    N('d13', 'def', 5, 4, 3, '🥇', 'Gardes d\'élite', 'Gardes : +25 % de vie et de dégâts, casques dorés.', { req: ['d12'] }),
    // ---- clan
    N('b25', 'clan', 1, 4, 1, '🌿', 'Hutte du guérisseur', 'Débloque la Hutte du guérisseur (menu Construire) et le métier de Guérisseur qui va avec : il soigne gobelins, animaux et chef près de sa hutte.', { unlock: ['guerisseur'] }),
    N('b1', 'clan', 1, 2, 1, '🍄', 'Agriculture', 'Révèle le Potager à champignons.', { unlock: ['potager'] }),
    N('b21', 'clan', 2, 6, 1, '🪣', 'Puisatier', 'Révèle le Puits.', { req: ['b1'], unlock: ['puits'] }),
    N('b22', 'clan', 3, 6, 1, '🐟', 'Pisciculture', 'Révèle l\'Étang à poissons.', { req: ['b21'], unlock: ['etang'] }),
    N('b23', 'clan', 4, 6, 2, '🏚️', 'Greniers', 'Révèle le Grenier.', { req: ['b22'], unlock: ['grenier'] }),
    N('b6', 'clan', 2, 0, 1, '🍲', 'Cuisine', 'Révèle la Grande marmite.', { req: ['b1'], unlock: ['marmite'] }),
    N('b2', 'clan', 2, 2, 1, '🐗', 'Élevage', 'Révèle l\'Enclos à sangliers.', { req: ['b1'], unlock: ['enclos'] }),
    N('b3', 'clan', 2, 3, 1, '🪚', 'Charpenterie', 'Révèle la Scierie.', { req: ['b1'], unlock: ['scierie'] }),
    N('b7', 'clan', 3, 0, 2, '🍺', 'Taverne', 'Révèle la Taverne.', { req: ['b6'], unlock: ['taverne'] }),
    N('b9', 'clan', 3, 1, 2, '💀', 'Chamanisme', 'Révèle la Hutte du chaman.', { req: ['b6'], unlock: ['chaman'] }),
    N('b11', 'clan', 3, 2, 2, '🧺', 'Grands paniers', 'Cueilleurs et chasseurs rapportent +1 nourriture par voyage.', { req: ['b2'] }),
    N('b4', 'clan', 3, 3, 2, '🏠', 'Huttes en planches', 'On se serre mieux dans les huttes : 4 places au lieu de 3.', { req: ['b3'] }),
    N('b10', 'clan', 3, 4, 2, '⛏️', 'Outils de fer', 'Tous les travailleurs vont 25 % plus vite.', { req: ['b3'] }),
    N('b8', 'clan', 4, 2, 2, '⚖️', 'Commerce', 'Révèle le Marché.', { req: ['b3'], unlock: ['marche'] }),
    N('b5', 'clan', 4, 3, 3, '🏡', 'Maisons de pierre', 'Des lits superposés dans chaque hutte : 5 places chacune.', { req: ['b4'] }),
    N('b13', 'clan', 4, 4, 2, '💎', 'Filons profonds', 'Les mineurs rapportent +1 minerai par voyage.', { req: ['b10'] }),
    N('b12', 'clan', 5, 2, 2, '⚒️', 'Maîtres artisans', 'Artisans 30 % plus rapides, objets vendus 25 % plus cher.', { req: ['b8'] }),
    N('b14', 'clan', 2, 5, 1, '🩴', 'Bonnes sandales', 'Tous tes gobelins marchent 15 % plus vite, pour toujours.', { req: ['b1'] }),
    N('b15', 'clan', 3, 5, 2, '🛤️', 'Sentiers battus', 'Tes gobelins marchent encore 15 % plus vite.', { req: ['b14'] }),
    N('b16', 'clan', 4, 5, 3, '🐇', 'Jarrets de lièvre', 'Tes gobelins marchent encore 20 % plus vite.', { req: ['b15'] }),
    // ---- guerrier
    N('g2', 'guer', 1, 2, 1, '💪', 'Bras puissant', '+3 dégâts à chaque coup.'),
    N('g13', 'guer', 4, 1, 2, '🏃', 'Courir', 'Nouveau pouvoir permanent : maintiens Maj (Shift) pour courir 70 % plus vite.', { req: ['g5'], power: 'run' }),
    N('g6', 'guer', 2, 0, 2, '💗', 'Régénération', 'Ta vie remonte toute seule, tout doucement : +0,3 par seconde.'),
    N('g3', 'guer', 2, 1, 1, '🥾', 'Pieds agiles', 'Tu cours 15 % plus vite, pour toujours.'),
    N('g4', 'guer', 2, 2, 2, '🌀', 'Coup tournoyant', 'Tes coups frappent tout autour de toi, et plus loin.', { req: ['g2'] }),
    N('g14', 'guer', 4, 0, 3, '🧌', 'Sang de troll', 'Ta vie remonte encore un peu plus : +0,4 par seconde de plus.', { req: ['g10'] }),
    N('g10', 'guer', 3, 0, 3, '🕊️', 'Seconde chance', 'Une fois par jour, au lieu de tomber pour de bon, tu te relèves à mi-vie.', { req: ['g6'] }),
    N('g5', 'guer', 3, 1, 2, '💨', 'Ruée', 'Nouveau pouvoir (touche F) : tu fonces droit devant en blessant tout sur ton passage.', { req: ['g3'], power: 'dash' }),
    N('g7', 'guer', 3, 2, 2, '💥', 'Coup critique', 'Un coup sur cinq fait double dégâts.', { req: ['g4'] }),
    N('g8', 'guer', 3, 3, 3, '🌋', 'Fracas', 'Nouveau pouvoir (touche R) : tu frappes le sol, les ennemis autour sont blessés et étourdis.', { req: ['g4'], power: 'slam' }),
    N('g15', 'guer', 4, 3, 2, '🗡️', 'Coup dans le dos', 'Nouveau pouvoir permanent : quand tu es invisible et juste derrière un ennemi, appuie sur E pour le poignarder. Il tombe d\'un coup (un chef perd un gros morceau de vie). Coûte 25 % de ton mana.', { req: ['g7'] }),
    N('g9', 'guer', 4, 2, 2, '🩸', 'Vol de vie', 'Chaque coup te rend un peu de vie.', { req: ['g7'] }),
    N('g11', 'guer', 3, 4, 2, '🐺', 'Jambes de loup', 'Tu cours encore 15 % plus vite, pour toujours.', { req: ['g3'] }),
    N('g12', 'guer', 4, 4, 3, '🌬️', 'Vent dans les oreilles', 'Tu cours encore 20 % plus vite.', { req: ['g11'] }),
    // ---- sorcier
    N('s6', 'sorc', 2, 0, 1, '💎', 'Cristaux', 'Révèle le Cristal de mana.', { unlock: ['cristal'] }),
    N('s12', 'sorc', 2, 3, 2, '👁️', 'Regard perçant', 'Tu vois en permanence les forces et les faiblesses de chaque gobelin, sans lancer le sort.'),
    N('s2', 'sorc', 2, 1, 1, '🌊', 'Source de mana', 'Ton mana remonte de 0,5 par seconde au départ. Avec ce pouvoir : +0,5 par seconde de plus.'),
    N('s3', 'sorc', 2, 2, 2, '✨', 'Étincelles jumelles', 'Étincelle lance trois traits en éventail.'),
    N('s10', 'sorc', 3, 0, 2, '🔮', 'Aura protectrice', 'Tu reçois 15 % de dégâts en moins.', { req: ['s6'] }),
    N('s5', 'sorc', 3, 1, 2, '🗼', 'Tour de magie', 'Révèle la Tour de magie.', { req: ['s2'], unlock: ['tourMagie'] }),
    N('s4', 'sorc', 3, 2, 2, '🔥', 'Sorts puissants', 'Tous tes sorts : +25 % de puissance.', { req: ['s2'] }),
    N('s14', 'sorc', 4, 0, 3, '🌀', 'Marée de mana', 'Ton mana remonte encore plus : +0,8 mana par seconde de plus.', { req: ['s10'] }),
    N('s7', 'sorc', 4, 1, 3, '🌟', 'Tour d\'archimage', 'Tu peux dorer tes tours de magie, une à la fois : va à côté (E). Explosions plus larges, plus fortes, plus fréquentes.', { req: ['s5'] }),
    N('s8', 'sorc', 4, 2, 2, '📘', 'Magie économe', 'Tes sorts coûtent 20 % de mana en moins.', { req: ['s4'] }),
    N('s9', 'sorc', 4, 3, 3, '🌪️', 'Maître des éléments', 'Boule de feu plus large, givre plus long, éclair qui saute deux fois de plus.', { req: ['s4'] }),
    N('s11', 'sorc', 5, 2, 2, '🏠', 'Rappel', 'Nouveau pouvoir (touche X) : tu te téléportes devant ta hutte.', { req: ['s8'], power: 'tele' })
  ];
  CG.POWERS = { run: { key: 'Maj', icon: '🏃', nom: 'Courir (maintenir Maj)', cd: 0 }, dash: { key: 'f', icon: '💨', nom: 'Ruée', cd: 4 }, slam: { key: 'r', icon: '🌋', nom: 'Fracas', cd: 10 }, tele: { key: 'x', icon: '🏠', nom: 'Rappel', cd: 45 } };
  CG.START_BUILDS = ['hut', 'torche', 'chemin', 'gazon', 'cloture', 'portail', 'tower']; // clôture et portail de bois : connus dès le début
  const byId = {}; CG.TECH.forEach(n => { byId[n.id] = n; (n.unlock || []).forEach(b => { if (CG.BUILDS[b]) CG.BUILDS[b].tech = n.id; }); });
  CG.TECH_BY_ID = byId;
  function scaleHp(types) { CG.S.buildings.forEach(b => { if (types.includes(b.type) && b.hp) b.hp *= 2; }); }

  G.tech = id => !!(CG.S && CG.S.tech && CG.S.tech.owned[id]);
  G.buildUnlocked = type => CG.START_BUILDS.includes(type) || G.tech(CG.BUILDS[type].tech);
  G.techAvail = n => !G.tech(n.id) && (n.req || []).every(G.tech);
  G.buyTech = function (id) {
    const n = byId[id], t = CG.S.tech; if (!n || !G.techAvail(n) || t.points < n.cout) return false;
    const sousPlan = !!(t.plans && t.plans[id]); if (sousPlan) delete t.plans[id]; // déjà débloquée par un plan : on l'apprend pour de bon, sans rejouer son effet d'achat
    t.points -= n.cout; t.owned[id] = true; if (n.onBuy && !sousPlan) n.onBuy(); return true;
  };
  G.hutCap = () => 3 + (G.tech('b4') ? 1 : 0) + (G.tech('b5') ? 1 : 0);
  G.hutLvl = () => G.tech('b5') ? 2 : G.tech('b4') ? 1 : 0;
  G.towerLvl = () => G.tech('d7') ? 2 : G.tech('d5') ? 1 : 0;
  // barrières : leur propre solidité ; huttes et autres constructions : elles encaissent aussi, puis tombent en ruine
  G.buildMaxHp = b => {
    const d = CG.BUILDS[b.type]; if (!d || b.site) return 0;
    if (d.hp) return d.hp;
    if (d.flat || d.terrain || d.tile || b.type === 'fire' || b.type === 'stock') return 0;
    if (b.type === 'hut' || b.type === 'chief') return [150, 300, 480][Math.min(2, b.up || 0)] * (b.type === 'chief' ? 1.3 : 1);
    return d.shoot ? 200 : b.w * b.h >= 4 ? 150 : 70;
  };

  // ---------- pouvoirs du chef ----------
  G.power = function (id) {
    const S = CG.S, R = CG.R, p = S.player, P = CG.POWERS[id], n = CG.TECH.find(t => t.power === id);
    if (!n || !G.tech(n.id) || R.ko > 0 || id === 'run') return;
    R.pcd = R.pcd || {}; if (R.pcd[id] > 0) { CG.sfx('no'); return; }
    R.pcd[id] = P.cd;
    if (id === 'dash') {
      const hit = new Set(); CG.sfx('swing'); R.swing = 1;
      for (let i = 0; i < 16; i++) {
        if (!G.slide(p, R.dir.x * 11, R.dir.y * 11, 9)) break;
        R.parts.push({ x: p.x, y: p.y - 14, vx: 0, vy: 0, life: 0.35, max: 0.35, col: '#c8ffb0', size: 6, float: true });
        for (const e of R.enemies) if (!e.dead && !hit.has(e) && Math.hypot(e.x - p.x, e.y - p.y) < 30 + e.r) { hit.add(e); G.hurtEnemy(e, G.playerDmg() * 1.6, p); }
      }
      R.invuln = Math.max(R.invuln || 0, 0.35);
    } else if (id === 'slam') {
      CG.sfx('fire'); R.rings.push({ x: p.x, y: p.y - 4, r: 120, life: 0.5, col: '#ffb05a' }); G.puff(p.x, p.y - 6, '#c9a56b', 26, 200, 5);
      for (const e of R.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 120 + e.r) { e.rooted = Math.max(e.rooted, 1.8); G.hurtEnemy(e, G.playerDmg() * 2, p); }
    } else if (id === 'tele') {
      G.puff(p.x, p.y - 16, '#b070ff', 22, 130, 4); const d = G.door(G.find('chief')); p.x = d.x; p.y = d.y + 10; G.puff(p.x, p.y - 16, '#b070ff', 22, 130, 4); CG.sfx('spell');
    }
  };

  // ---------- qui sont les gobelins ? (présentation à la première rencontre) ----------
  const ORIG = ['Je suis né dans une souche creuse, pas loin d\'ici.', 'Avant, je vivais dans les marais. Ça sentait meilleur qu\'on le dit.', 'Mon ancien clan s\'est fait chasser par les humains. J\'ai couru trois jours.', 'J\'ai grandi dans une grotte pleine de chauves-souris. Elles me manquent.', 'On m\'a trouvé dans un panier de champignons. Personne ne sait d\'où je viens.', 'Je viens de la montagne. Là-haut, il fait froid et les trolls ronflent fort.', 'J\'étais marmiton chez un ogre. Je me suis sauvé avant de finir dans la soupe.', 'J\'ai toujours vécu ici. Je connais chaque caillou du village.'];
  const LIKE = ['J\'adore les baies bien mûres et les siestes au soleil.', 'Je collectionne les cailloux brillants. J\'en ai déjà douze.', 'Ce que j\'aime le plus, c\'est danser autour du feu.', 'Je raffole du ragoût de sanglier. Avec beaucoup d\'ail.', 'J\'aime bricoler : donne-moi un bout de bois et je te fais une cuillère.', 'J\'aime le bruit de la pluie sur le toit de la hutte.', 'Je parle aux grenouilles. Des fois, elles répondent.', 'J\'ai peur du noir, mais ne le répète pas.'];
  const DREAM = ['Un jour, j\'aimerais voir la mer.', 'Mon rêve : un village si grand qu\'on s\'y perd.', 'Je voudrais qu\'on arrête d\'avoir peur des humains.', 'Je rêve d\'avoir une hutte rien qu\'à moi, avec une porte qui ferme.', 'J\'aimerais apprendre un tour de magie, juste un petit.', 'Je veux devenir le gobelin le plus fort du clan.', 'Je voudrais qu\'on chante mon nom à la fête du soir.', 'Mon rêve, c\'est de manger à ma faim tous les jours.'];
  const TALENT = { cueilleur: 'J\'ai l\'œil pour trouver les baies, même cachées sous les feuilles.', chasseur: 'Je vise juste : je touche un lapin à vingt pas.', bucheron: 'J\'ai des bras solides. Les arbres n\'ont qu\'à bien se tenir.', mineur: 'Je n\'ai pas peur du noir des galeries, et je sens le minerai.', forgeron: 'Le feu et le métal, ça me connaît.', arcier: 'J\'ai les doigts fins : je taille le bois comme personne.', tanneur: 'Je sais coudre le cuir sans me piquer. Presque.', garde: 'Je n\'ai peur de rien. Enfin, de presque rien.', aucun: 'Donne-moi un marteau et trois planches, je te monte une hutte.' };
  const DISLIKE = { cueilleur: 'Par contre, les buissons me griffent et je confonds toutes les baies.', chasseur: 'Par contre, je fais trop de bruit en forêt : le gibier m\'entend venir de loin.', bucheron: 'Par contre, la hache est trop lourde pour moi, j\'ai mal au dos rien qu\'à la regarder.', mineur: 'Par contre, les galeries sombres, très peu pour moi : j\'étouffe là-dedans.', forgeron: 'Par contre, le feu de la forge me fait peur, je me brûle tout le temps.', arcier: 'Par contre, j\'ai de gros doigts : les travaux fins, je casse tout.', tanneur: 'Par contre, l\'odeur du cuir me donne mal au cœur.', garde: 'Par contre, me battre... je tremble dès que je vois une épée.', aucun: 'Par contre, je me tape toujours sur les doigts avec un marteau.' };
  // aptitudes cachées : deux forces, deux faiblesses, le reste dans la moyenne
  G.makeApt = function (g) {
    const jobs = CG.shuffle(Object.keys(TALENT)); if (g.talent) { jobs.splice(jobs.indexOf(g.talent), 1); jobs.unshift(g.talent); }
    g.apt = {}; jobs.forEach(j => { g.apt[j] = 1; });
    g.apt[jobs[0]] = 1.4; g.apt[jobs[1]] = 1.2; g.apt[jobs[2]] = 0.6; g.apt[jobs[3]] = 0.75; g.talent = jobs[0]; g.weak = jobs[2];
  };
  G.apt = (g, job) => (g.apt && g.apt[job]) || 1;
  G.seeApt = () => (CG.R && CG.R.vision > 0) || G.tech('s12');
  G.makeBio = function (g) {
    g.bio = [CG.pick(ORIG), CG.pick(LIKE), CG.pick(DREAM)];
    g.talent = null; G.makeApt(g);
  };
  // la première rencontre, en petits morceaux : c'est le chef qui pose les questions (ui.js)
  G.introParts = function (g) {
    const f = t => g.sex === 'f' ? t.replace('suis né ', 'suis née ').replace('m\'a trouvé ', 'm\'a trouvée ').replace('suis sauvé ', 'suis sauvée ').replace('marmiton ', 'marmitonne ').replace('le gobelin le plus fort', 'la gobeline la plus forte') : t;
    return { salut: (g.child ? 'Bonjour papa ! Moi, c\'est ' : 'Bonjour chef ! Moi, c\'est ') + g.name + '.', origine: f(g.child ? 'Je suis né cette nuit dans ta hutte, et j\'ai déjà grandi !' : g.bio[0]), aime: f(g.bio[1]), talent: f(TALENT[g.talent] + ' ' + DISLIKE[g.weak]), reve: f(g.bio[2]) };
  };
  G.GOURMAND = 1.2; G.gourmand = g => !!(g && g.look && g.look.belly >= G.GOURMAND); /* un gobelin bien rond mange pour deux à la fête du soir */
  G.introText = function (g) {
    let t = (g.child ? 'Bonjour papa ! Moi, c\'est ' : 'Bonjour chef ! Moi, c\'est ') + g.name + '. ' + (g.child ? 'Je suis né cette nuit dans ta hutte, et j\'ai déjà grandi !' : g.bio[0]) + ' ' + g.bio[1] + ' ' + TALENT[g.talent] + ' ' + DISLIKE[g.weak] + ' ' + g.bio[2];
    if (g.sex === 'f') t = t.replace('suis né ', 'suis née ').replace('m\'a trouvé ', 'm\'a trouvée ').replace('suis sauvé ', 'suis sauvée ').replace('marmiton ', 'marmitonne ').replace('le gobelin le plus fort', 'la gobeline la plus forte');
    return t;
  };
})(window.CG);
