// Canon Big Boom — constantes, famille, mondes, ennemis, canons, boutique, cartes.
// Tout vit dans l'espace de noms CB. Fonctionne dans le navigateur et dans Node (tools/test-*.cjs).
window.CB = window.CB || {};
window.CB.VERSION = '1.1';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (CB) {
  'use strict';
  CB.W = 960; CB.H = 640;

  CB.FAMILIES = {
    matt: { name: 'Les Matt', color: '#1e5bd8', dark: '#0f2f73' },
    bibi: { name: 'Les Bibi', color: '#f4c430', dark: '#8a6a00' },
    jay:  { name: 'Les Jay',  color: '#d9342b', dark: '#6b1511' },
    jo:   { name: 'Les Jo',   color: '#1f9d4a', dark: '#0f5a2a' },
  };
  CB.ROLES = { grandpapa: 'Grand-papa', grandmaman: 'Grand-maman', papa: 'Papa', maman: 'Maman', mononcle: 'Mononcle', enfant: 'Enfant', toutpetit: 'Tout-petit', ado: 'Ado' };

  // Chaque membre a un petit talent permanent (mods = bonus appliqués aux stats de tir).
  CB.PLAYERS = [
    { id: 'matthieu', name: 'Matthieu', family: 'matt', role: 'mononcle', birth: '1990-01-15', perk: { name: 'Code de triche', icon: '🕹️', desc: '+6 % de chance de coup critique.', mods: { crit: .06 } } },
    { id: 'josee', name: 'Josée', family: 'matt', role: 'grandmaman', birth: '1960-06-29', perk: { name: 'Prière', icon: '🙏', desc: '+15 points de vie.', mods: { hp: 15 } } },
    { id: 'richard', name: 'Richard', family: 'matt', role: 'grandpapa', birth: '1956-03-15', perk: { name: 'Boulet du vétéran', icon: '💥', desc: '+12 % de dégâts.', mods: { damage: .12 } } },
    { id: 'mickael', name: 'Mickael', family: 'bibi', role: 'papa', birth: '1993-01-04', perk: { name: 'Lunettes laser', icon: '👓', desc: '+12 % de portée.', mods: { range: .12 } } },
    { id: 'marie', name: 'Marie', family: 'bibi', role: 'maman', birth: '1994-01-06', perk: { name: 'Mère protectrice', icon: '🛡️', desc: 'Commence chaque vague avec un bouclier.', mods: { shield: 1 } } },
    { id: 'adam', name: 'Adam', family: 'bibi', role: 'enfant', birth: '2021-09-11', perk: { name: 'Pika-choc', icon: '⚡', desc: '+10 % de cadence de tir.', mods: { rate: .10 } } },
    { id: 'milo', name: 'Milo', family: 'bibi', role: 'toutpetit', birth: '2024-03-12', perk: { name: 'Zoom-zoom', icon: '🏎️', desc: '+12 % d’or.', mods: { gold: .12 } } },
    { id: 'jeremie', name: 'Jérémie', family: 'jay', role: 'papa', birth: '1988-03-06', perk: { name: 'Téléportation', icon: '✨', desc: '10 % de chance d’esquiver un coup.', mods: { dodge: .10 } } },
    { id: 'jessica', name: 'Jessica', family: 'jay', role: 'maman', birth: '1991-07-01', perk: { name: 'Aimant à or', icon: '🧲', desc: '+18 % d’or.', mods: { gold: .18 } } },
    { id: 'edison', name: 'Edison', family: 'jay', role: 'toutpetit', birth: '2023-02-08', perk: { name: 'Tornade', icon: '🌪️', desc: '+8 % de cadence et +5 % de portée.', mods: { rate: .08, range: .05 } } },
    { id: 'josue', name: 'Josué', family: 'jo', role: 'papa', birth: '1985-10-29', perk: { name: 'Cri du capitaine', icon: '📣', desc: '+10 % de dégâts.', mods: { damage: .10 } } },
    { id: 'emily', name: 'Émily', family: 'jo', role: 'maman', birth: '1984-12-25', perk: { name: 'Blizzard', icon: '❄️', desc: 'Les ennemis sont 8 % plus lents.', mods: { slow: .08 } } },
    { id: 'eliott', name: 'Eliott', family: 'jo', role: 'enfant', birth: '2016-10-06', perk: { name: 'Fantôme', icon: '👻', desc: '15 % de chance d’esquiver un coup.', mods: { dodge: .15 } } },
    { id: 'alexie', name: 'Alexie', family: 'jo', role: 'enfant', birth: '2014-11-01', perk: { name: 'Licorne', icon: '🦄', desc: '+10 points de vie et +6 % d’or.', mods: { hp: 10, gold: .06 } } },
    { id: 'zachary', name: 'Zachary', family: 'jo', role: 'ado', birth: '2007-08-02', perk: { name: 'Fusée', icon: '🚀', desc: '+15 % de portée.', mods: { range: .15 } } },
  ];
  CB.playerById = id => CB.PLAYERS.find(p => p.id === id) || CB.PLAYERS[0];
  CB.ageOf = (birth, today) => { const b = new Date(birth + 'T00:00:00'), t = today || new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a; };

  // Ennemis : hp et speed de base (multipliés selon le monde), size = rayon visuel, damage = dégâts quand ils nous atteignent,
  // gold = or en plus de l'or du monde. variant = la version spéciale (couleur) qui donne 3 cartes quand on l'abat.
  CB.ENEMIES = {
    bat:      { name: 'Chauve-souris', hp: 1, speed: 7, size: 1, damage: 6, gold: 0, color: '#684a91', variant: { name: 'Chauve-souris rouge', color: '#e23b3b' } },
    owl:      { name: 'Hibou grognon', hp: 3, speed: 5.5, size: 1.4, damage: 10, gold: 1, color: '#8c5a2b', variant: { name: 'Hibou doré', color: '#e9b23a' } },
    ghost:    { name: 'Fantôme', hp: 2, speed: 6.5, size: 1.2, damage: 8, gold: 0, color: '#dfe9ff', fade: true, variant: { name: 'Fantôme vert', color: '#7dff9a' } },
    skull:    { name: 'Crâne volant', hp: 4, speed: 5, size: 1.1, damage: 12, gold: 1, color: '#f3efe0', variant: { name: 'Crâne de feu', color: '#ff8c2a' } },
    balloon:  { name: 'Ballon méchant', hp: 2, speed: 7.5, size: 1.3, damage: 7, gold: 0, color: '#ff4f6b', zigzag: true, variant: { name: 'Ballon doré', color: '#ffd23f' } },
    pinata:   { name: 'Piñata', hp: 7, speed: 4, size: 1.6, damage: 12, gold: 4, color: '#38c7e6', variant: { name: 'Piñata royale', color: '#c54fff' } },
    bee:      { name: 'Abeille', hp: 2, speed: 9, size: .9, damage: 6, gold: 0, color: '#ffc531', variant: { name: 'Abeille bleue', color: '#53b7ff' } },
    wasp:     { name: 'Guêpe', hp: 4, speed: 8, size: 1.1, damage: 11, gold: 1, color: '#f08a1d', zigzag: true, variant: { name: 'Frelon noir', color: '#333' } },
    firebird: { name: 'Oiseau de feu', hp: 4, speed: 8, size: 1.3, damage: 10, gold: 1, color: '#ff6a1a', variant: { name: 'Oiseau bleu', color: '#4fd3ff' } },
    meteor:   { name: 'Météorite', hp: 6, speed: 11, size: 1.2, damage: 15, gold: 1, color: '#7a4a3a', straight: true, variant: { name: 'Météorite de glace', color: '#a9e9ff' } },
    tie:      { name: 'Chasseur sombre', hp: 5, speed: 9, size: 1.3, damage: 12, gold: 1, color: '#4b5566', strafe: true, variant: { name: 'Chasseur rouge', color: '#d8323a' } },
    ufo:      { name: 'Soucoupe', hp: 8, speed: 6, size: 1.5, damage: 14, gold: 2, color: '#8ee6a0', zigzag: true, variant: { name: 'Soucoupe dorée', color: '#ffd23f' } },
    bolt:     { name: 'Tir ennemi', hp: 1, speed: 20, size: .7, damage: 10, gold: 0, color: '#ff3a3a', straight: true, noElite: true },
  };
  // Boss : un par monde, dernière vague. Ils s'arrêtent à distance, tirent des boulets (qu'on peut détruire) et appellent des sbires.
  CB.BOSSES = {
    batking:  { name: 'Le Roi des chauves-souris', hp: 60, size: 3.6, color: '#3b2a63', minion: 'bat', every: 3.2, boltEvery: 2.6 },
    bigghost: { name: 'Le Grand Spectre', hp: 90, size: 4, color: '#c9d8ff', minion: 'ghost', every: 3, boltEvery: 2.4 },
    clown:    { name: 'Le Clown gonflable', hp: 130, size: 4.2, color: '#ff4f6b', minion: 'balloon', every: 2.6, boltEvery: 2.2 },
    queen:    { name: 'La Reine des guêpes', hp: 180, size: 3.8, color: '#f08a1d', minion: 'bee', every: 2.2, boltEvery: 2 },
    dragon:   { name: 'Le Dragon de lave', hp: 260, size: 4.6, color: '#c8321e', minion: 'firebird', every: 2.4, boltEvery: 1.8 },
    destroyer:{ name: 'Le Destructeur stellaire', hp: 380, size: 5.2, color: '#5b6b80', minion: 'tie', every: 2, boltEvery: 1.6 },
  };

  // Mondes : enemies = ce qui vole vers nous (pondéré par l'ordre : le premier est le plus fréquent),
  // cannon = le canon qui se débloque à l'achat une fois le monde terminé.
  CB.WORLDS = [
    { id: 'foret',  name: 'La Forêt des chauves-souris', short: 'Forêt', enemies: ['bat', 'bat', 'bat', 'owl'], boss: 'batking', cannon: 'pirate', sky: ['#0b1437', '#243a6b', '#5d7a9c'], ground: '#1a3b2a', accent: '#8fd3a8', icon: '🦇' },
    { id: 'manoir', name: 'Le Manoir hanté', short: 'Manoir', enemies: ['ghost', 'ghost', 'skull'], boss: 'bigghost', cannon: 'confetti', sky: ['#120a2a', '#3a2061', '#6a3a8a'], ground: '#241838', accent: '#c9a4ff', icon: '👻' },
    { id: 'foire',  name: 'La Foire aux ballons', short: 'Foire', enemies: ['balloon', 'balloon', 'pinata'], boss: 'clown', cannon: 'turbo', sky: ['#1b6fd6', '#59b0ff', '#bfe8ff'], ground: '#4caf50', accent: '#ffd23f', icon: '🎈' },
    { id: 'ruche',  name: 'Le Ciel des abeilles', short: 'Ruche', enemies: ['bee', 'bee', 'wasp'], boss: 'queen', cannon: 'lave', sky: ['#f6a23a', '#ffd27a', '#fff2c2'], ground: '#b57b2a', accent: '#ffd23f', icon: '🐝' },
    { id: 'volcan', name: 'Le Volcan', short: 'Volcan', enemies: ['firebird', 'firebird', 'meteor'], boss: 'dragon', cannon: 'laser', sky: ['#1a0606', '#5a1410', '#b8401e'], ground: '#2b1a16', accent: '#ff8c2a', icon: '🌋' },
    { id: 'espace', name: 'L’Espace', short: 'Espace', enemies: ['tie', 'tie', 'ufo'], boss: 'destroyer', cannon: 'jumeau', sky: ['#02030c', '#0a1130', '#1b2a5a'], ground: '#3b4a60', accent: '#7fd4ff', icon: '🚀', space: true },
  ];
  CB.worldById = id => CB.WORLDS.find(w => w.id === id);
  CB.WAVES_PER_WORLD = 5;

  // Vagues : 1 abattre N, 2 survivre, 3 abattre N avant la fin du chrono, 4 grande survie, 5 boss.
  CB.waveDef = (wi, vi) => {
    const w = CB.WORLDS[wi];
    const defs = [
      { type: 'kill', goal: 10 + wi * 4, density: 1, name: 'Première patrouille', text: () => 'Abats ' + (10 + wi * 4) + ' ennemis !' },
      { type: 'survive', seconds: 40 + wi * 5, density: 1.15, name: 'Tenir bon', text: () => 'Survis ' + (40 + wi * 5) + ' secondes !' },
      { type: 'killTimed', goal: 18 + wi * 5, seconds: 50 + wi * 5, density: 1.3, name: 'Contre la montre', text: () => 'Abats ' + (18 + wi * 5) + ' ennemis avant la fin du chrono !' },
      { type: 'survive', seconds: 60 + wi * 6, density: 1.55, name: 'La grande vague', text: () => 'Survis ' + (60 + wi * 6) + ' secondes à la grande vague !' },
      { type: 'boss', density: .7, name: CB.BOSSES[w.boss].name, text: () => 'Détruis ' + CB.BOSSES[w.boss].name.toLowerCase() + ' !' },
    ];
    const d = Object.assign({ world: wi, index: vi }, defs[vi]);
    d.text = d.text();
    return d;
  };
  CB.hpScale = wi => 1 + wi * .75;                 // points de vie des ennemis selon le monde
  CB.speedScale = wi => 1 + wi * .08;
  CB.goldBase = wi => 1 + wi;                       // 1 pièce par ennemi au premier monde, 6 au dernier
  CB.xpPerKill = wi => 2 + wi;
  CB.xpForLevel = level => Math.round(60 * Math.pow(level, 1.45));   // XP nécessaire pour passer du niveau `level` au suivant
  CB.MAX_LEVEL = 50;

  // Améliorations permanentes (achetées avec l'or, niveau 0 à max).
  CB.UPGRADES = {
    auto:     { name: 'Tir automatique', icon: '🔁', max: 1, base: 60, desc: 'Au départ, chaque tir demande un clic. Avec ce pouvoir, maintiens le bouton enfoncé pour tirer sans arrêt.', per: 'Tir en continu' },
    cadence:  { name: 'Cadence de tir', icon: '⚡', max: 10, base: 25, desc: 'Le canon tire plus vite.', per: '-6 % de temps entre les tirs' },
    portee:   { name: 'Portée', icon: '🎯', max: 10, base: 25, desc: 'Le boulet vole plus vite et plus loin.', per: '+7 % de vitesse du boulet' },
    degats:   { name: 'Dégâts', icon: '💥', max: 10, base: 30, desc: 'Chaque boulet fait plus mal.', per: '+15 % de dégâts' },
    vie:      { name: 'Points de vie', icon: '❤️', max: 10, base: 30, desc: 'Ton canon encaisse plus de coups.', per: '+10 points de vie' },
    butin:    { name: 'Butin', icon: '🪙', max: 10, base: 40, desc: 'Les ennemis laissent plus d’or.', per: '+12 % d’or par ennemi' },
    critique: { name: 'Coup critique', icon: '✨', max: 10, base: 35, desc: 'Chance de faire le double de dégâts.', per: '+3 % de chance' },
    reparation: { name: 'Réparation', icon: '🔧', max: 5, base: 80, desc: 'Le canon se répare tout seul pendant la vague.', per: '+1 PV toutes les 5 secondes' },
  };
  // Évolutions choisies à chaque niveau gagné (un point par niveau).
  CB.TALENTS = {
    vie:      { name: 'Points de vie', icon: '❤️', per: '+10 PV' },
    degats:   { name: 'Dégâts', icon: '💥', per: '+6 % de dégâts' },
    cadence:  { name: 'Cadence', icon: '⚡', per: '+4 % de cadence de tir' },
    portee:   { name: 'Portée', icon: '🎯', per: '+4 % de vitesse du boulet' },
    critique: { name: 'Critique', icon: '✨', per: '+2 % de chance de critique' },
    butin:    { name: 'Butin', icon: '🪙', per: '+5 % d’or' },
  };
  // Coéquipier : un deuxième membre de la famille tire tout seul depuis un petit canon à gauche, avec des dégâts divisés par deux.
  CB.HELPER = { name: 'Coéquipier', price: 350, damage: .5, x: -5, desc: 'Un deuxième membre de la famille t’accompagne dans toutes les vagues. Il vise et tire tout seul, mais ses boulets font deux fois moins mal.' };
  CB.upgradeCost = (key, level) => Math.round(CB.UPGRADES[key].base * Math.pow(1.55, level));

  // Canons : mods = bonus relatifs (rate, damage, range, gold), shots = boulets supplémentaires par tir.
  // world = le monde à terminer avant de pouvoir l'acheter (null = disponible dès le départ).
  CB.CANNONS = {
    classique: { name: 'Canon classique', price: 0, world: null, desc: 'Le bon vieux canon du village.', mods: {}, body: '#2d5a86', trim: '#9bd3ea', base: '#9b633e' },
    pirate:    { name: 'Canon de pirate', price: 150, world: 'foret', desc: 'Lourd, noir et puissant. Arrr !', mods: { damage: .2 }, body: '#2b2b2b', trim: '#d9b25a', base: '#5c3a21', flag: true },
    confetti:  { name: 'Canon confetti', price: 400, world: 'manoir', desc: 'Il tire vite et fait pleuvoir l’or.', mods: { rate: .15, gold: .15 }, body: '#ff4f9a', trim: '#ffe36a', base: '#4fc3ff', stripes: true },
    turbo:     { name: 'Mitraille turbo', price: 900, world: 'foire', desc: 'Une cadence folle, un peu moins de dégâts.', mods: { rate: .45, damage: -.1 }, body: '#1f9d4a', trim: '#d4ff8a', base: '#2f3a2b', twin: true },
    lave:      { name: 'Canon de lave', price: 1800, world: 'ruche', desc: 'Chauffé à blanc : gros dégâts et portée.', mods: { damage: .35, range: .15 }, body: '#7a1d10', trim: '#ff8c2a', base: '#3a1a16', glow: '#ff5a1a' },
    laser:     { name: 'Canon laser', price: 3500, world: 'volcan', desc: 'Technologie spatiale : rapide et précis.', mods: { range: .4, rate: .25, crit: .05 }, body: '#dfe9ff', trim: '#53b7ff', base: '#2a3a55', glow: '#7fd4ff' },
    jumeau:    { name: 'Canon jumeau', price: 6000, world: 'espace', desc: 'Deux fûts : deux boulets à chaque tir !', mods: { damage: .2 }, shots: 1, body: '#ffd23f', trim: '#1e5bd8', base: '#2a3a55', twin: true },
  };

  // Apparence du boulet (cosmétique) : trail = traînée dessinée derrière.
  CB.BALLS = {
    fer:       { name: 'Boulet de fer', price: 0, desc: 'Un boulet, un vrai.', color: '#444a55', trail: 'smoke' },
    feu:       { name: 'Boule de feu', price: 120, desc: 'Des flammes derrière, comme une comète.', color: '#ff6a1a', trail: 'flames' },
    etoile:    { name: 'Étoile filante', price: 200, desc: 'Une traînée d’étoiles de toutes les couleurs.', color: '#fff3a0', trail: 'stars' },
    bowling:   { name: 'Boule de bowling', price: 250, desc: 'Strike ! Lourde et brillante.', color: '#2b1a5e', trail: 'none' },
    neige:     { name: 'Boule de neige', price: 180, desc: 'Fraîche et poudreuse.', color: '#f4fbff', trail: 'snow' },
    soccer:    { name: 'Ballon de soccer', price: 160, desc: 'Et c’est le but !', color: '#ffffff', trail: 'none' },
    disco:     { name: 'Boule disco', price: 300, desc: 'Elle fait briller toute la nuit.', color: '#c0c8ff', trail: 'sparkle' },
    citrouille:{ name: 'Citrouille', price: 220, desc: 'Boo ! Parfaite pour le manoir.', color: '#ff8c2a', trail: 'leaves' },
    planete:   { name: 'Petite planète', price: 500, desc: 'Un monde entier avec ses anneaux.', color: '#6fd0ff', trail: 'rainbow' },
  };

  // Effets spéciaux : se déclenchent parfois au tir (chance = 5 % par niveau, max 5).
  CB.EFFECTS = {
    feu:     { name: 'Boule de feu', icon: '🔥', max: 5, base: 100, desc: 'Explose à l’impact et brûle les ennemis autour.' },
    etoiles: { name: 'Pluie d’étoiles', icon: '🌟', max: 5, base: 120, desc: 'Le tir se divise en trois étoiles.' },
    bowling: { name: 'Boule de bowling', icon: '🎳', max: 5, base: 140, desc: 'Un énorme boulet qui traverse tous les ennemis.' },
    eclair:  { name: 'Éclair en chaîne', icon: '⚡', max: 5, base: 160, desc: 'La foudre saute sur deux ennemis voisins.' },
    neige:   { name: 'Boule de neige', icon: '❄️', max: 5, base: 110, desc: 'Gèle et ralentit les ennemis autour de l’impact.' },
  };
  CB.effectCost = (key, level) => Math.round(CB.EFFECTS[key].base * Math.pow(1.8, level));
  CB.EFFECT_CHANCE = .05;

  // Cartes : bonus temporaires offerts (3 au choix) quand on abat un ennemi spécial. Perdus à la fin de la vague.
  CB.CARDS = {
    double:   { name: 'Tir double', icon: '🔫', desc: '+1 boulet à chaque tir.', apply: s => { s.shots += 1; } },
    rapide:   { name: 'Gâchette rapide', icon: '⚡', desc: 'Cadence de tir +35 %.', apply: s => { s.rate *= 1.35; } },
    rafale:   { name: 'Gâchette folle', icon: '🔁', desc: 'Tir automatique pour cette vague : maintiens pour tirer.', skip: s => s.auto, apply: s => { s.auto = true; } },
    costaud:  { name: 'Gros bras', icon: '💪', desc: 'Dégâts +50 %.', apply: s => { s.damage *= 1.5; } },
    bouclier: { name: 'Bouclier', icon: '🛡️', desc: 'Absorbe les 3 prochains coups.', apply: (s, g) => { g.shield += 3; } },
    vampire:  { name: 'Vampire', icon: '🧛', desc: '+2 PV par ennemi abattu.', apply: s => { s.lifesteal += 2; } },
    tresor:   { name: 'Trésor', icon: '💰', desc: 'Or doublé pour cette vague.', apply: s => { s.gold *= 2; } },
    geant:    { name: 'Boulets géants', icon: '🟣', desc: 'Les boulets sont 60 % plus gros.', apply: s => { s.size *= 1.6; } },
    rebond:   { name: 'Ricochet', icon: '🏓', desc: 'Le boulet rebondit vers un deuxième ennemi.', apply: s => { s.ricochet = true; } },
    glace:    { name: 'Gel', icon: '🧊', desc: 'Les ennemis sont 25 % plus lents.', apply: s => { s.slow += .25; } },
    soin:     { name: 'Trousse de soins', icon: '🩹', desc: 'Récupère 40 points de vie tout de suite.', apply: (s, g) => { g.hp = Math.min(g.maxHp, g.hp + 40); } },
    explosif: { name: 'Explosif', icon: '💣', desc: 'Chaque boulet explose à l’impact.', apply: s => { s.splash = Math.max(s.splash, 5); } },
    chance:   { name: 'Trèfle', icon: '🍀', desc: '+20 % de chance de coup critique.', apply: s => { s.crit += .2; } },
    aimant:   { name: 'Aimant', icon: '🧲', desc: '+2 pièces d’or par ennemi.', apply: s => { s.goldFlat += 2; } },
    portee:   { name: 'Longue vue', icon: '🔭', desc: 'Portée +40 %.', apply: s => { s.range *= 1.4; } },
  };
})(window.CB);
