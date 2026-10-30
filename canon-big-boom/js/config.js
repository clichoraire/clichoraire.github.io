// Canon Big Boom — constantes, famille, mondes, ennemis, canons, boutique, cartes.
// Tout vit dans l'espace de noms CB. Fonctionne dans le navigateur et dans Node (tools/test-*.cjs).
window.CB = window.CB || {};
window.CB.VERSION = '1.2';   // à augmenter à chaque mise en ligne (affichée dans le menu)
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
  // 20 styles de monstres d'Halloween pour le premier monde (dans l'ordre d'apparition de la nuit sans fin),
  // puis les monstres des autres mondes. Chaque style existe en 4 paliers de couleur (CB.TIERS) : 80 variantes.
  CB.ENEMIES = {
    bat:       { name: 'Chauve-souris', hp: 1, speed: 7, size: 1, damage: 6, gold: 0, color: '#684a91', variant: { name: 'Chauve-souris rouge', color: '#e23b3b' } },
    owl:       { name: 'Hibou grognon', hp: 3, speed: 5.5, size: 1.4, damage: 10, gold: 1, color: '#8c5a2b', variant: { name: 'Hibou doré', color: '#e9b23a' } },
    ghost:     { name: 'Fantôme', hp: 2, speed: 6.5, size: 1.2, damage: 8, gold: 0, color: '#dfe9ff', fade: true, variant: { name: 'Fantôme vert', color: '#7dff9a' } },
    pumpkin:   { name: 'Citrouille', hp: 4, speed: 5, size: 1.4, damage: 10, gold: 1, color: '#ff8c2a', variant: { name: 'Citrouille bleue', color: '#4fd3ff' } },
    skull:     { name: 'Crâne volant', hp: 4, speed: 5, size: 1.1, damage: 12, gold: 1, color: '#f3efe0', variant: { name: 'Crâne de feu', color: '#ff8c2a' } },
    spider:    { name: 'Araignée', hp: 5, speed: 6, size: 1.2, damage: 11, gold: 1, color: '#2b2b3a', zigzag: true, variant: { name: 'Veuve noire', color: '#c2182b' } },
    crow:      { name: 'Corbeau', hp: 4, speed: 8.5, size: 1.1, damage: 9, gold: 1, color: '#1f2230', strafe: true, variant: { name: 'Corbeau blanc', color: '#e8ecf5' } },
    wisp:      { name: 'Feu follet', hp: 3, speed: 9, size: .9, damage: 8, gold: 1, color: '#7dffd6', zigzag: true, variant: { name: 'Feu follet violet', color: '#c47dff' } },
    vampire:   { name: 'Vampire', hp: 8, speed: 6, size: 1.4, damage: 14, gold: 2, color: '#3b1f4e', variant: { name: 'Comte écarlate', color: '#a4132a' } },
    witch:     { name: 'Sorcière', hp: 7, speed: 7.5, size: 1.5, damage: 13, gold: 2, color: '#2f8f5b', strafe: true, variant: { name: 'Sorcière de minuit', color: '#5b3fa8' } },
    eyeball:   { name: 'Œil volant', hp: 6, speed: 7, size: 1, damage: 12, gold: 2, color: '#f6f1ff', zigzag: true, variant: { name: 'Œil de braise', color: '#ff5a2a' } },
    blackcat:  { name: 'Chat noir', hp: 9, speed: 8, size: 1.3, damage: 14, gold: 2, color: '#24212b', variant: { name: 'Chat fantôme', color: '#b8c7ff' } },
    mummy:     { name: 'Momie', hp: 12, speed: 4.5, size: 1.5, damage: 16, gold: 3, color: '#d9c9a0', variant: { name: 'Momie dorée', color: '#ffd23f' } },
    candy:     { name: 'Bonbon maléfique', hp: 8, speed: 9, size: 1, damage: 12, gold: 3, color: '#ff5fa8', zigzag: true, variant: { name: 'Bonbon pourri', color: '#8bc34a' } },
    imp:       { name: 'Diablotin', hp: 10, speed: 8.5, size: 1.2, damage: 15, gold: 3, color: '#d8323a', strafe: true, variant: { name: 'Diablotin de glace', color: '#8fe3ff' } },
    zombie:    { name: 'Tête de zombie', hp: 15, speed: 4, size: 1.5, damage: 18, gold: 3, color: '#7faa5a', variant: { name: 'Zombie radioactif', color: '#c6ff4a' } },
    scarecrow: { name: 'Épouvantail', hp: 16, speed: 5, size: 1.7, damage: 18, gold: 4, color: '#b8862b', variant: { name: 'Épouvantail hanté', color: '#6b4fd6' } },
    frankie:   { name: 'Frankenstein', hp: 20, speed: 4.5, size: 1.7, damage: 20, gold: 4, color: '#5fae7a', variant: { name: 'Frankenstein électrique', color: '#7fd4ff' } },
    cauldron:  { name: 'Chaudron fou', hp: 18, speed: 5.5, size: 1.5, damage: 18, gold: 5, color: '#303a4a', variant: { name: 'Chaudron en or', color: '#ffd23f' } },
    reaper:    { name: 'Faucheuse', hp: 26, speed: 6, size: 1.8, damage: 24, gold: 6, color: '#2a2438', fade: true, variant: { name: 'Faucheuse écarlate', color: '#c2182b' } },
    coffre:    { name: 'Coffre mystère', hp: 3, speed: 3.5, size: 1.4, damage: 0, gold: 10, color: '#ffd23f', straight: true, noElite: true, chest: true },
    // Le coffre doré, unique : le toucher ouvre un portail bleu vers le passé (la Vallée des dinosaures).
    coffreOr:  { name: 'Coffre doré', hp: 6, speed: 2.8, size: 1.8, damage: 0, gold: 0, color: '#ffe36b', straight: true, noElite: true, chest: true, portal: true },
    // ----- Le passé : vingt vrais dinosaures (tableau secret du monde 1) -----
    trex:         { name: 'T. rex', hp: 18, speed: 5, size: 1.9, damage: 22, gold: 5, color: '#6b8f3a', variant: { name: 'T. rex albinos', color: '#e8e4d0' } },
    triceratops:  { name: 'Tricératops', hp: 14, speed: 4.5, size: 1.8, damage: 18, gold: 4, color: '#8a7a5a', variant: { name: 'Tricératops bleu', color: '#4f7fbf' } },
    stegosaure:   { name: 'Stégosaure', hp: 12, speed: 4, size: 1.8, damage: 16, gold: 4, color: '#7a9a4a', variant: { name: 'Stégosaure rouge', color: '#c24a3a' } },
    velociraptor: { name: 'Vélociraptor', hp: 3, speed: 8, size: 1.1, damage: 12, gold: 2, color: '#b07a3a', zigzag: true, variant: { name: 'Raptor de jungle', color: '#3f8f4a' } },
    brachiosaure: { name: 'Brachiosaure', hp: 26, speed: 3.5, size: 2.1, damage: 24, gold: 6, color: '#6a9a8a', variant: { name: 'Brachiosaure doré', color: '#d9b23a' } },
    diplodocus:   { name: 'Diplodocus', hp: 22, speed: 3.8, size: 2, damage: 22, gold: 5, color: '#8a8a6a', variant: { name: 'Diplodocus violet', color: '#8a5ab0' } },
    ankylosaure:  { name: 'Ankylosaure', hp: 18, speed: 3.6, size: 1.7, damage: 20, gold: 5, color: '#6a6a4a', variant: { name: 'Ankylosaure de bronze', color: '#b8862b' } },
    pteranodon:   { name: 'Ptéranodon', hp: 4, speed: 8.5, size: 1.4, damage: 10, gold: 2, color: '#c08a5a', strafe: true, variant: { name: 'Ptéranodon de nuit', color: '#3a3a5a' } },
    spinosaure:   { name: 'Spinosaure', hp: 20, speed: 4.8, size: 2, damage: 22, gold: 6, color: '#5a8a6a', variant: { name: 'Spinosaure de feu', color: '#e06a2a' } },
    parasaurolophus: { name: 'Parasaurolophus', hp: 7, speed: 6, size: 1.5, damage: 14, gold: 3, color: '#8aa05a', variant: { name: 'Parasaurolophus rose', color: '#e07aa0' } },
    pachycephalosaure: { name: 'Pachycéphalosaure', hp: 8, speed: 6.5, size: 1.4, damage: 16, gold: 3, color: '#9a7a6a', straight: true, variant: { name: 'Pachy de cristal', color: '#8fd6ff' } },
    iguanodon:    { name: 'Iguanodon', hp: 9, speed: 5.5, size: 1.6, damage: 15, gold: 3, color: '#7a9a6a', variant: { name: 'Iguanodon des sables', color: '#d9b26a' } },
    allosaure:    { name: 'Allosaure', hp: 11, speed: 6, size: 1.7, damage: 18, gold: 4, color: '#9a5a4a', variant: { name: 'Allosaure noir', color: '#2a2a30' } },
    dilophosaure: { name: 'Dilophosaure', hp: 5, speed: 7.5, size: 1.3, damage: 13, gold: 3, color: '#5a7a9a', zigzag: true, variant: { name: 'Dilophosaure vert', color: '#5ab04a' } },
    gallimimus:   { name: 'Gallimimus', hp: 3, speed: 8.5, size: 1.2, damage: 9, gold: 2, color: '#c0a060', strafe: true, variant: { name: 'Gallimimus blanc', color: '#f0ece0' } },
    compsognathus:{ name: 'Compsognathus', hp: 1, speed: 9, size: .8, damage: 6, gold: 1, color: '#8ab060', zigzag: true, variant: { name: 'Compy turquoise', color: '#3fc9b0' } },
    carnotaure:   { name: 'Carnotaure', hp: 13, speed: 7, size: 1.7, damage: 19, gold: 4, color: '#a05a3a', straight: true, variant: { name: 'Carnotaure de lave', color: '#ff5a1a' } },
    apatosaure:   { name: 'Apatosaure', hp: 24, speed: 3.6, size: 2, damage: 23, gold: 6, color: '#7a7a8a', variant: { name: 'Apatosaure de mousse', color: '#4a8a4a' } },
    archeopteryx: { name: 'Archéoptéryx', hp: 2, speed: 8, size: .9, damage: 7, gold: 1, color: '#4a6aa0', zigzag: true, variant: { name: 'Archéoptéryx d’or', color: '#e0b030' } },
    quetzalcoatlus: { name: 'Quetzalcoatlus', hp: 15, speed: 6, size: 2.2, damage: 20, gold: 5, color: '#b09a7a', strafe: true, variant: { name: 'Quetzalcoatlus royal', color: '#7a4ab0' } },
    balloon:   { name: 'Ballon méchant', hp: 2, speed: 7.5, size: 1.3, damage: 7, gold: 0, color: '#ff4f6b', zigzag: true, variant: { name: 'Ballon doré', color: '#ffd23f' } },
    pinata:    { name: 'Piñata', hp: 7, speed: 4, size: 1.6, damage: 12, gold: 4, color: '#38c7e6', variant: { name: 'Piñata royale', color: '#c54fff' } },
    bee:       { name: 'Abeille', hp: 2, speed: 9, size: .9, damage: 6, gold: 0, color: '#ffc531', variant: { name: 'Abeille bleue', color: '#53b7ff' } },
    wasp:      { name: 'Guêpe', hp: 4, speed: 8, size: 1.1, damage: 11, gold: 1, color: '#f08a1d', zigzag: true, variant: { name: 'Frelon noir', color: '#333' } },
    firebird:  { name: 'Oiseau de feu', hp: 4, speed: 8, size: 1.3, damage: 10, gold: 1, color: '#ff6a1a', variant: { name: 'Oiseau bleu', color: '#4fd3ff' } },
    meteor:    { name: 'Météorite', hp: 6, speed: 11, size: 1.2, damage: 15, gold: 1, color: '#7a4a3a', straight: true, variant: { name: 'Météorite de glace', color: '#a9e9ff' } },
    tie:       { name: 'Chasseur sombre', hp: 5, speed: 9, size: 1.3, damage: 12, gold: 1, color: '#4b5566', strafe: true, variant: { name: 'Chasseur rouge', color: '#d8323a' } },
    ufo:       { name: 'Soucoupe', hp: 8, speed: 6, size: 1.5, damage: 14, gold: 2, color: '#8ee6a0', zigzag: true, variant: { name: 'Soucoupe dorée', color: '#ffd23f' } },
    bolt:      { name: 'Tir ennemi', hp: 1, speed: 20, size: .7, damage: 10, gold: 0, color: '#ff3a3a', straight: true, noElite: true, shot: true },
    // Attaques spéciales des boss (shot = projectile qui fonce sur nous ; on peut le faire exploser avant qu'il nous touche)
    boulet:    { name: 'Boulet lourd', hp: 3, speed: 11, size: 1.5, damage: 20, gold: 0, color: '#ff8c2a', straight: true, noElite: true, shot: true },
    bombe:     { name: 'Bombe à retardement', hp: 4, speed: 10, size: 1.6, damage: 25, gold: 0, color: '#2a2a30', straight: true, noElite: true, shot: true, hold: 28, fuse: 2.6 },
    rayon:     { name: 'Rayon chargé', hp: 10, speed: 6.5, size: 2.2, damage: 40, gold: 0, color: '#b14fff', straight: true, noElite: true, shot: true },
  };
  // Paliers de couleur : même style de monstre, plus fort. Le palier 0 garde la couleur d'origine.
  CB.TIERS = [
    { key: '', name: '', color: null, hp: 1, speed: 1, gold: 1 },
    { key: 'rouge', name: 'rouge', color: '#e23b3b', hp: 2.5, speed: 1.1, gold: 3 },
    { key: 'dore', name: 'doré', color: '#ffd23f', hp: 6, speed: 1.2, gold: 8 },
    { key: 'violet', name: 'violet', color: '#b14fff', hp: 14, speed: 1.3, gold: 20 },
  ];
  CB.HALLOWEEN = ['bat', 'owl', 'ghost', 'pumpkin', 'skull', 'spider', 'crow', 'wisp', 'vampire', 'witch', 'eyeball', 'blackcat', 'mummy', 'candy', 'imp', 'zombie', 'scarecrow', 'frankie', 'cauldron', 'reaper'];
  // La nuit sans fin (monde 1, tableau 1) : façon Vampire Survivors. Un nouveau style de monstre apparaît à chaque
  // instant de « firstAt » (secondes), les paliers de couleur arrivent avec le temps, et des coffres mystères passent
  // régulièrement : les toucher ou les abattre révèle un nouveau tableau sur la carte.
  CB.DINOS = ['compsognathus', 'velociraptor', 'gallimimus', 'archeopteryx', 'pteranodon', 'dilophosaure', 'parasaurolophus', 'pachycephalosaure', 'iguanodon', 'allosaure', 'stegosaure', 'carnotaure', 'triceratops', 'quetzalcoatlus', 'trex', 'ankylosaure', 'spinosaure', 'diplodocus', 'apatosaure', 'brachiosaure'];
  CB.ENDLESS = {
    roster: CB.HALLOWEEN,
    firstAt: [0, 20, 45, 75, 110, 150, 195, 245, 300, 360, 425, 495, 570, 650, 735, 825, 920, 1020, 1125, 1235],
    tierFrom: [0, 90, 240, 480], tierMax: [1, .45, .35, .3], tierRamp: [1, 300, 600, 900],
    hpRamp: 90, hpPerRamp: .4,                      // +40 % de PV toutes les 90 s
    chest: { firstAt: 35, every: 50 },
    maxDiscoveries: 3,                              // tableaux 3 à 5 du premier monde (le tableau 2, lui, se mérite en secret)
    unlockKills: 100,                               // secret : 100 monstres abattus dans la nuit sans fin révèlent le tableau 2
    portalAt: 120,                                  // secret : après 2 minutes, le coffre doré passe une seule fois (portail vers le passé)
    stars: [90, 180, 300],                           // secondes survécues pour 1, 2, 3 étoiles
  };
  // La Vallée des dinosaures (tableau secret 1-6, atteint par le portail) : même principe, roster préhistorique, pas de coffre.
  CB.ENDLESS_DINOS = {
    roster: CB.DINOS,
    firstAt: [0, 20, 45, 75, 110, 150, 195, 245, 300, 360, 425, 495, 570, 650, 735, 825, 920, 1020, 1125, 1235],
    tierFrom: [0, 80, 220, 450], tierMax: [1, .45, .35, .3], tierRamp: [1, 300, 600, 900],
    hpRamp: 90, hpPerRamp: .4, chest: null, maxDiscoveries: 0, stars: [90, 180, 300],
  };
  // Décor du passé : grande montagne, forêt luxuriante, volcan qui fume.
  CB.SCENERY = { prehistoire: { id: 'prehistoire', scene: 'prehistoire', sky: ['#1d6fb8', '#7fc4ee', '#f3e6b0'], ground: '#2f6b2a', accent: '#9be36a' } };
  // Il faut réussir WORLD_NEED tableaux d'un monde (une étoile ou plus) pour ouvrir le suivant, pas forcément tous.
  CB.WORLD_NEED = 3;
  CB.PORTAL_TIME = 3.4; // secondes d'animation du portail avant le voyage
  // Boss : un par monde, dernière vague. Ils s'arrêtent à distance, tirent des boulets (qu'on peut détruire) et appellent des sbires.
  CB.BOSSES = {
    batking:  { name: 'Le Roi des chauves-souris', hp: 60, size: 3.6, color: '#3b2a63', minion: 'bat', every: 3.2, boltEvery: 2.6 },
    bigghost: { name: 'Le Grand Spectre', hp: 90, size: 4, color: '#c9d8ff', minion: 'ghost', every: 3, boltEvery: 2.4 },
    clown:    { name: 'Le Clown gonflable', hp: 130, size: 4.2, color: '#ff4f6b', minion: 'balloon', every: 2.6, boltEvery: 2.2 },
    queen:    { name: 'La Reine des guêpes', hp: 180, size: 3.8, color: '#f08a1d', minion: 'bee', every: 2.2, boltEvery: 2 },
    dragon:   { name: 'Le Dragon de lave', hp: 260, size: 4.6, color: '#c8321e', minion: 'firebird', every: 2.4, boltEvery: 1.8 },
    destroyer:{ name: 'Le Destructeur stellaire', hp: 380, size: 5.2, color: '#5b6b80', minion: 'tie', every: 2, boltEvery: 1.6 },
  };

  // Le boss en trois actes : il sort quand on atteint ces niveaux de partie, perd un tiers de ses PV par acte et gagne des pouvoirs.
  CB.BOSS_LEVELS = [5, 10, 15];
  CB.BOSS_XP = 6;                                   // l'XP par monstre est multipliée dans les tableaux de boss pour monter vite
  CB.BOSS_POWERS = [['bolt', 'boulet'], ['bolt', 'eventail', 'bombe', 'boulet'], ['rayon', 'eventail', 'bombe', 'boulet', 'bolt']];
  CB.BOSS_POWER_NAMES = { bolt: 'Tir rapide', boulet: 'Boulet lourd', eventail: 'Éventail de tirs', bombe: 'Bombe à retardement', rayon: 'Rayon chargé' };
  // Mondes : enemies = ce qui vole vers nous (pondéré par l'ordre : le premier est le plus fréquent),
  // cannon = le canon qui se débloque à l'achat une fois le monde terminé.
  CB.WORLDS = [
    { id: 'foret',  name: 'La Forêt des chauves-souris', short: 'Forêt', enemies: ['bat', 'owl', 'ghost', 'pumpkin', 'skull', 'spider', 'crow', 'wisp', 'vampire', 'witch', 'eyeball', 'blackcat', 'mummy', 'candy', 'imp', 'zombie', 'scarecrow', 'frankie', 'cauldron', 'reaper'], boss: 'batking', cannon: 'pirate', sky: ['#0b1437', '#243a6b', '#5d7a9c'], ground: '#1a3b2a', accent: '#8fd3a8', icon: '🦇', secret: { vi: 5, from: 0 } },
    { id: 'manoir', name: 'Le Manoir hanté', short: 'Manoir', enemies: ['ghost', 'ghost', 'skull'], boss: 'bigghost', cannon: 'confetti', sky: ['#120a2a', '#3a2061', '#6a3a8a'], ground: '#241838', accent: '#c9a4ff', icon: '👻' },
    { id: 'foire',  name: 'La Foire aux ballons', short: 'Foire', enemies: ['balloon', 'balloon', 'pinata'], boss: 'clown', cannon: 'turbo', sky: ['#1b6fd6', '#59b0ff', '#bfe8ff'], ground: '#4caf50', accent: '#ffd23f', icon: '🎈' },
    { id: 'ruche',  name: 'Le Ciel des abeilles', short: 'Ruche', enemies: ['bee', 'bee', 'wasp'], boss: 'queen', cannon: 'lave', sky: ['#f6a23a', '#ffd27a', '#fff2c2'], ground: '#b57b2a', accent: '#ffd23f', icon: '🐝' },
    { id: 'volcan', name: 'Le Volcan', short: 'Volcan', enemies: ['firebird', 'firebird', 'meteor'], boss: 'dragon', cannon: 'laser', sky: ['#1a0606', '#5a1410', '#b8401e'], ground: '#2b1a16', accent: '#ff8c2a', icon: '🌋' },
    { id: 'espace', name: 'L’Espace', short: 'Espace', enemies: ['tie', 'tie', 'ufo'], boss: 'destroyer', cannon: 'jumeau', sky: ['#02030c', '#0a1130', '#1b2a5a'], ground: '#3b4a60', accent: '#7fd4ff', icon: '🚀', space: true },
  ];
  CB.worldById = id => CB.WORLDS.find(w => w.id === id);
  CB.WAVES_PER_WORLD = 5;
  CB.wavesOf = wi => CB.WAVES_PER_WORLD + ((CB.WORLDS[wi] || {}).secret ? 1 : 0); // tableaux dessinés sur la carte (le monde 1 cache un sixième tableau)

  // Vagues : 1 abattre N, 2 survivre, 3 abattre N avant la fin du chrono, 4 grande survie, 5 boss.
  CB.waveDef = (wi, vi) => {
    const w = CB.WORLDS[wi];
    const defs = [
      { type: 'kill', goal: 10 + wi * 4, density: 1, name: 'Première patrouille', text: () => 'Abats ' + (10 + wi * 4) + ' ennemis !' },
      { type: 'survive', seconds: 40 + wi * 5, density: 1.15, name: 'Tenir bon', text: () => 'Survis ' + (40 + wi * 5) + ' secondes !' },
      { type: 'killTimed', goal: 18 + wi * 5, seconds: 50 + wi * 5, density: 1.3, name: 'Contre la montre', text: () => 'Abats ' + (18 + wi * 5) + ' ennemis avant la fin du chrono !' },
      { type: 'survive', seconds: 60 + wi * 6, density: 1.55, name: 'La grande vague', text: () => 'Survis ' + (60 + wi * 6) + ' secondes à la grande vague !' },
      { type: 'boss', density: 1.3, name: CB.BOSSES[w.boss].name, text: () => 'Monte au niveau ' + CB.BOSS_LEVELS[0] + ' pour faire sortir ' + CB.BOSSES[w.boss].name.toLowerCase() + ', puis affaiblis-le en trois actes !' },
    ];
    if (wi === 0 && vi === 0) defs[0] = { type: 'endless', density: 1, name: 'La nuit sans fin', text: () => 'Survis le plus longtemps possible\u00a0! Des secrets se cachent dans la nuit…' };
    // tableau secret 1-6 : la Vallée des dinosaures, dans le passé
    if (wi === 0 && vi === 5) defs[5] = { type: 'endless', density: 1, name: 'La Vallée des dinosaures', text: () => 'Tu as voyagé dans le passé\u00a0! Survis parmi les dinosaures.', endless: 'dinos', scene: 'prehistoire', secret: true };
    const d = Object.assign({ world: wi, index: vi }, defs[vi]);
    d.text = d.text();
    return d;
  };
  CB.hpScale = wi => 1 + wi * .75;                 // points de vie des ennemis selon le monde
  CB.speedScale = wi => 1 + wi * .08;
  CB.goldBase = wi => 1 + wi;                       // 1 pièce par ennemi au premier monde, 6 au dernier
  CB.xpPerKill = wi => 2 + wi;
  CB.runXpFor = l => Math.round(16 * Math.pow(l, 1.25));   // XP pour passer le niveau l pendant une vague (façon Vampire Survivors)
  CB.xpForLevel = level => Math.round(60 * Math.pow(level, 1.45));   // XP nécessaire pour passer du niveau `level` au suivant
  CB.MAX_LEVEL = 50;

  // Améliorations permanentes (achetées avec l'or, niveau 0 à max).
  CB.UPGRADES = {
    cadence:  { name: 'Cadence de tir', icon: '⚡', max: 10, base: 25, desc: 'Le canon tire plus vite.', per: '-6 % de temps entre les tirs' },
    portee:   { name: 'Portée', icon: '🎯', max: 10, base: 25, desc: 'Le boulet vole plus vite et plus loin.', per: '+7 % de vitesse du boulet' },
    degats:   { name: 'Dégâts', icon: '💥', max: 10, base: 30, desc: 'Chaque boulet fait plus mal.', per: '+15 % de dégâts' },
    vie:      { name: 'Points de vie', icon: '❤️', max: 10, base: 30, desc: 'Ton canon encaisse plus de coups.', per: '+10 points de vie' },
    butin:    { name: 'Butin', icon: 'coin', max: 10, base: 40, desc: 'Les ennemis laissent plus d’or.', per: '+12 % d’or par ennemi' },
    critique: { name: 'Coup critique', icon: '✨', max: 10, base: 35, desc: 'Chance de faire le double de dégâts.', per: '+3 % de chance' },
    reparation: { name: 'Réparation', icon: '🔧', max: 5, base: 80, desc: 'Le canon se répare tout seul pendant la vague.', per: '+1 PV toutes les 5 secondes' },
  };
  // Évolutions choisies à chaque niveau gagné (un point par niveau).
  // La pièce d'or est dessinée en CSS (classe .coin) plutôt qu'avec l'emoji 🪙 qui ressemble à un cent d'argent.
  CB.COIN = '<i class="coin"></i>';
  CB.icon = i => i === 'coin' ? CB.COIN : i;
  // Ce que rapporte un point de talent (personnage) ou un niveau d'amélioration du hangar (canon), par stat.
  CB.STAT_PER = {
    cadence: { talent: .04, upgrade: .065 }, portee: { talent: .04, upgrade: .07 }, degats: { talent: .06, upgrade: .15 },
    vie: { talent: 10, upgrade: 10 }, butin: { talent: .05, upgrade: .12 }, critique: { talent: .02, upgrade: .03 }, reparation: { talent: 0, upgrade: 1 },
  };
  // Chaque stat a un plafond (TALENT_MAX) et une couleur de barre pour la fiche du personnage.
  CB.TALENT_MAX = 20;
  CB.TALENTS = {
    vie:      { name: 'Points de vie', icon: '❤️', per: '+10 PV', bar: ['#e62652', '#ff7b87'] },
    degats:   { name: 'Dégâts', icon: '💥', per: '+6 % de dégâts', bar: ['#ff3c49', '#ffcf42'] },
    cadence:  { name: 'Cadence', icon: '⚡', per: '+4 % de cadence de tir', bar: ['#e8a317', '#ffe76c'] },
    portee:   { name: 'Portée', icon: '🎯', per: '+4 % de vitesse du boulet', bar: ['#008de4', '#4bffff'] },
    critique: { name: 'Critique', icon: '✨', per: '+2 % de chance de critique', bar: ['#9346f2', '#ed9dfd'] },
    butin:    { name: 'Butin', icon: 'coin', per: '+5 % d’or', bar: ['#39c817', '#d4f42c'] },
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
  // Cartes : chaque prise monte le pouvoir d'un niveau (max 3, sauf les boulets géants). apply(stats, vague, niveau atteint).
  CB.CARDS = {
    double:   { name: 'Tir double', icon: '🔫', desc: '+1 boulet à chaque tir.', apply: s => { s.shots += 1; } },
    rapide:   { name: 'Gâchette rapide', icon: '⚡', desc: 'Cadence de tir +35 %.', apply: s => { s.rate *= 1.35; } },
    rafale:   { name: 'Gâchette folle', icon: '🔁', desc: 'Cadence de tir doublée pour cette vague (une seule fois).', max: 1, apply: s => { s.rate *= 2; s.rafale = 1; } },
    costaud:  { name: 'Gros bras', icon: '💪', desc: 'Dégâts +50 %.', apply: s => { s.damage *= 1.5; } },
    bouclier: { name: 'Bouclier', icon: '🛡️', desc: 'Absorbe les 3 prochains coups.', apply: (s, g) => { g.shield += 3; } },
    vampire:  { name: 'Vampire', icon: '🧛', desc: '+2 PV par ennemi abattu.', apply: s => { s.lifesteal += 2; } },
    tresor:   { name: 'Trésor', icon: '💰', desc: 'Or doublé, puis triplé, puis quadruplé.', apply: (s, g, lvl) => { s.gold *= (lvl + 1) / lvl; } },
    geant:    { name: 'Boulets géants', icon: '🟣', desc: 'Tes billes grossissent de 75 % (se cumule à l’infini !).', max: Infinity, apply: s => { s.size *= 1.75; } },
    rebond:   { name: 'Ricochet', icon: '🏓', desc: 'Le boulet rebondit vers un ennemi de plus.', apply: s => { s.bounces += 1; } },
    glace:    { name: 'Gel', icon: '🧊', desc: 'Les ennemis sont 25 % plus lents.', apply: s => { s.slow += .25; } },
    soin:     { name: 'Trousse de soins', icon: '🩹', desc: 'Récupère 40 points de vie tout de suite.', apply: (s, g) => { g.hp = Math.min(g.maxHp, g.hp + 40); if (s.anesthesie) g.freezeAll(4 + 1.5 * (s.anesthesie - 1)); } },
    explosif: { name: 'Explosif', icon: '💣', desc: 'Chaque boulet explose à l’impact (plus large à chaque niveau).', apply: (s, g, lvl) => { s.splash = Math.max(s.splash, 5 + 1.5 * (lvl - 1)); } },
    chance:   { name: 'Trèfle', icon: '🍀', desc: '+20 % de chance de coup critique.', apply: s => { s.crit += .2; } },
    aimant:   { name: 'Aimant', icon: '🧲', desc: '+2 pièces d’or par ennemi.', apply: s => { s.goldFlat += 2; } },
    portee:   { name: 'Longue vue', icon: '🔭', desc: 'Portée +40 %.', apply: s => { s.range *= 1.4; } },
    // ----- Combos secrets : apparaissent quand les deux ingrédients sont au niveau 3, montent jusqu'au niveau 3 -----
    deluge:       { combo: true, needs: ['double', 'rapide'], name: 'Déluge de plomb', desc: 'Tir en éventail et boulets 25 % plus rapides. Niveaux : +1 boulet et +15 % de cadence.', apply: (s, g, lvl) => { if (lvl === 1) { s.fan = true; s.range *= 1.25; } else { s.shots += 1; s.rate *= 1.15; } } },
    siphon:       { combo: true, needs: ['vampire', 'explosif'], name: 'Siphon de sang', desc: 'Chaque explosion te soigne de 1 PV par ennemi touché. Niveaux : +1 PV et explosion +20 %.', apply: (s, g, lvl) => { s.siphon = lvl; if (lvl > 1) s.splash *= 1.2; } },
    mitrailleuse: { combo: true, needs: ['rafale', 'geant'], name: 'Mitrailleuse tournoyante', desc: 'Salve continue de boulets massifs qui repoussent les ennemis. Niveaux : +25 % de taille et de recul.', apply: (s, g, lvl) => { s.size *= 1.25; s.knock = lvl; } },
    givre:        { combo: true, needs: ['rebond', 'glace'], name: 'Tempête de givre', desc: 'Chaque rebond gèle les ennemis proches 1,5 s. Niveaux : +1 rebond et +0,5 s de gel.', apply: (s, g, lvl) => { s.frostBounce = 1.5 + .5 * (lvl - 1); if (lvl > 1) s.bounces += 1; } },
    comete:       { combo: true, needs: ['costaud', 'portee'], name: 'Comète dévastatrice', desc: 'Plus le boulet voyage loin, plus il fait mal (jusqu’à +150 %). Niveaux : +50 %.', apply: (s, g, lvl) => { s.cometCap = 1.5 + .5 * (lvl - 1); } },
    odin:         { combo: true, needs: ['bouclier', 'chance'], name: 'Pacte d’Odin', desc: 'Tant que ton bouclier tient, tous tes tirs sont critiques. Niveau 2+ : quand il se brise, une onde critique frappe tout l’écran.', apply: (s, g, lvl) => { s.odin = lvl; g.shield += 3; } },
    midas:        { combo: true, needs: ['tresor', 'explosif'], name: 'Midas explosif', desc: 'Les ennemis tués par une explosion crachent des pièces qui blessent leurs voisins. Niveaux : plus de pièces et de dégâts.', apply: (s, g, lvl) => { s.midas = lvl; } },
    trounoir:     { combo: true, needs: ['aimant', 'geant'], name: 'Trou noir monétaire', desc: 'Tes boulets géants aspirent les ennemis vers eux. Niveaux : attraction plus forte et plus large.', apply: (s, g, lvl) => { s.blackhole = lvl; } },
    anesthesie:   { combo: true, needs: ['soin', 'glace'], name: 'Anesthésie totale', desc: 'Chaque trousse de soins gèle tous les ennemis 4 s (tout de suite aussi). Niveaux : +1,5 s.', apply: (s, g, lvl) => { s.anesthesie = lvl; g.freezeAll(4 + 1.5 * (lvl - 1)); } },
    moissonneuse: { combo: true, needs: ['aimant', 'tresor'], name: 'Moissonneuse royale', desc: 'L’or ramassé donne +1 % de dégâts par pièce pendant 5 s. Niveaux : +1 % par pièce et plus longtemps.', apply: (s, g, lvl) => { s.harvest = lvl; } },
  };
  for (const c of Object.values(CB.CARDS)) if (c.max == null) c.max = 3;
  CB.COMBOS = Object.keys(CB.CARDS).filter(k => CB.CARDS[k].combo);
  // Niveau d'ingrédient exigé par un combo : 3, ou le maximum de la carte s'il est plus bas (Gâchette folle = 1).
  CB.comboNeed = k => Math.min(3, CB.CARDS[k].max);
})(window.CB);
