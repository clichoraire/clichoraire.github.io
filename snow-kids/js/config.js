// Snow Kids — constantes, personnages, planches, objets et pistes.
// Tout est dans l'espace de noms SK. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.SK = window.SK || {};
window.SK.VERSION = '1.4';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (SK) {
  'use strict';
  SK.W = 1280; SK.H = 720;          // canevas logique
  SK.STEP = 1 / 60;                 // pas de simulation
  SK.SEG = 5;                       // longueur d'un segment de piste (m)
  SK.GRAVITY = 14;
  SK.SLOPE = 0.07;                  // pente de base (m de dénivelé par m parcouru)
  SK.LIFT_INTERVAL = 2;             // une chaise de remontée part toutes les 2 s (une place par chaise)
  SK.LIFT_RIDE = 7;                 // durée de la remontée (s)
  SK.SHOT_COST = 1;                 // une boîte (rouge = tir, bleue = objet) coûte 1 pièce d'or si on en a une, sinon elle est gratuite
  SK.COIN_VALUE = 1;                // une pièce d'or ramassée = 1 G
  SK.BOX_RESPAWN = 6;
  SK.DIFFICULTIES = ['Facile', 'Normal', 'Difficile'];
  SK.PRIZES = [50, 30, 20, 10, 5];      // prime de fin de course selon la place
  SK.TROPHY_GOLD = 200;                 // bonus la première fois qu'on gagne une piste de l'aventure (trophée)
  SK.LAPS_CHOICES = [1, 2, 3, 5];
  SK.DEFAULT_LAPS = 3;

  // ------------------------------------------------------------------ personnages (vitesse / virage / figures sur 5)
  SK.CHARACTERS = [
    { id: 'slash', name: 'Slash', speed: 5, corner: 2, trick: 3, jump: 3, hairStyle: 'short', hat: 'cap', weight: 3, age: 10,
      colors: { jacket: '#e53935', pants: '#1e3a8a', hat: '#1565c0', hair: '#5d3a1a', skin: '#f3c9a3', board: '#ffb300' },
      desc: 'Le fonceur de la bande : la planche la plus rapide, mais il tourne large.' },
    { id: 'nancy', name: 'Nancy', speed: 3, corner: 4, trick: 3, jump: 3, hairStyle: 'long', hat: 'beanie', weight: 2, age: 10,
      colors: { jacket: '#ec407a', pants: '#8e24aa', hat: '#f8bbd0', hair: '#fdd835', skin: '#f6d2b5', board: '#ab47bc' },
      desc: 'Toujours de bonne humeur ; une planche équilibrée qui pardonne les erreurs.' },
    { id: 'jam', name: 'Jam', speed: 3, corner: 3, trick: 5, jump: 4, hairStyle: 'dreads', hat: 'cap', weight: 3, age: 11,
      colors: { jacket: '#43a047', pants: '#fdd835', hat: '#212121', hair: '#212121', skin: '#8d5a3b', board: '#00acc1' },
      desc: 'Le roi des figures : ses sauts rapportent beaucoup plus de pièces.' },
    { id: 'linda', name: 'Linda', speed: 4, corner: 4, trick: 2, jump: 2, hairStyle: 'long', hat: 'cap', weight: 2, age: 11,
      colors: { jacket: '#1e88e5', pants: '#ffffff', hat: '#ffffff', hair: '#f9e36b', skin: '#f6d2b5', board: '#e53935' },
      desc: 'Rapide et précise dans les virages, mais les figures ne sont pas son fort.' },
    { id: 'tommy', name: 'Tommy', speed: 4, corner: 1, trick: 2, jump: 2, hairStyle: 'short', hat: 'cap', weight: 5, age: 10,
      colors: { jacket: '#fb8c00', pants: '#3949ab', hat: '#6d4c41', hair: '#3e2723', skin: '#f3c9a3', board: '#2e7d32' },
      desc: 'Le costaud : lourd et stable, il se relève vite quand il tombe.' },
    { id: 'wendy', name: 'Wendy', speed: 2, corner: 5, trick: 4, jump: 4, hairStyle: 'pigtails', hat: 'band', weight: 2, age: 9,
      colors: { jacket: '#7e57c2', pants: '#26a69a', hat: '#7e57c2', hair: '#d84315', skin: '#f6d2b5', board: '#ffee58' },
      desc: 'La plus jeune, lunettes sur le nez : elle tourne sur une pièce de dix cents.' },
    { id: 'shinobin', name: 'Shinobin', speed: 5, corner: 5, trick: 5, jump: 5, hairStyle: 'short', hat: 'hood', weight: 3, age: '?', hidden: true,
      colors: { jacket: '#212121', pants: '#212121', hat: '#212121', hair: '#212121', skin: '#f3c9a3', board: '#b71c1c', scarf: '#d32f2f' },
      desc: 'Le ninja mystérieux qui hante le Pays des Ninjas. Parfait partout. Il faut le battre pour le débloquer.' },
  ];
  SK.charById = id => SK.CHARACTERS.find(c => c.id === id);

  // ------------------------------------------------------------------ planches (boutique)
  SK.BOARDS = [
    { id: 'freestyle', name: 'Freestyle', price: 0, speed: 0, corner: 0, trick: 0, jump: 0, color: '#4caf50', pattern: 'stripes', desc: 'La planche de départ, équilibrée.' },
    { id: 'fusee', name: 'Fusée', price: 400, speed: 2, corner: -1, trick: 0, jump: 0, color: '#e53935', pattern: 'flames', desc: 'Plus rapide, mais elle tourne moins bien.' },
    { id: 'virage', name: 'Virage', price: 400, speed: -1, corner: 2, trick: 0, jump: 0, color: '#1e88e5', pattern: 'zigzag', desc: 'Accroche dans les virages, un peu moins rapide.' },
    { id: 'acrobate', name: 'Acrobate', price: 400, speed: -1, corner: 0, trick: 2, jump: 0, color: '#fb8c00', pattern: 'stars', desc: 'Figures plus rapides et mieux payées.' },
    { id: 'kangourou', name: 'Kangourou', price: 400, speed: -1, corner: 0, trick: 0, jump: 2, color: '#8d6e63', pattern: 'dots', desc: 'Saute plus haut : plus de temps pour les figures.' },
    { id: 'glacier', name: 'Glacier', price: 700, speed: 1, corner: 1, trick: 0, jump: 0, color: '#80deea', pattern: 'ice', desc: 'Rapide et stable sur la glace.', unlock: { wins: 1 } },
    { id: 'comete', name: 'Comète', price: 800, speed: 2, corner: 0, trick: 0, jump: 1, color: '#5e35b1', pattern: 'galaxy', desc: 'Vite et haut.', unlock: { wins: 1 } },
    { id: 'tornade', name: 'Tornade', price: 800, speed: 0, corner: 1, trick: 2, jump: 0, color: '#26a69a', pattern: 'waves', desc: 'Pour enchaîner les vrilles.', unlock: { wins: 2 } },
    { id: 'eclair', name: 'Éclair', price: 900, speed: 3, corner: -1, trick: -1, jump: 0, color: '#fdd835', pattern: 'lightning', desc: 'Une flèche. Freine avant les virages !', unlock: { wins: 2 } },
    { id: 'cactus', name: 'Cactus', price: 850, speed: 0, corner: 2, trick: 0, jump: 1, color: '#7cb342', pattern: 'spikes', desc: 'Accroche et saute : parfaite dans le désert.', unlock: { wins: 2 } },
    { id: 'alpine', name: 'Alpine', price: 1200, speed: 3, corner: -2, trick: -1, jump: 0, color: '#546e7a', pattern: 'twotone', desc: 'Une fusée. Pour ceux qui savent freiner.', unlock: { wins: 3 } },
    { id: 'panda', name: 'Panda', price: 1100, speed: 1, corner: 1, trick: 1, jump: 1, color: '#eceff1', pattern: 'panda', desc: 'Un peu de tout, en noir et blanc.', unlock: { wins: 3 } },
    { id: 'lave', name: 'Lave', price: 1300, speed: 3, corner: 0, trick: 0, jump: 1, color: '#d84315', pattern: 'lava', desc: 'Brûlante en ligne droite.', unlock: { wins: 3 } },
    { id: 'ninja', name: 'Ninja', price: 1500, speed: 1, corner: 3, trick: 1, jump: 0, color: '#212121', pattern: 'shuriken', desc: 'Précise comme un shuriken.', unlock: { wins: 4 } },
    { id: 'arcenciel', name: 'Arc-en-ciel', price: 1600, speed: 0, corner: 0, trick: 3, jump: 2, color: '#ec407a', pattern: 'rainbow', desc: 'Faite pour voler et tourner.', unlock: { wins: 4 } },
    { id: 'requin', name: 'Requin', price: 1700, speed: 3, corner: 2, trick: -1, jump: 0, color: '#1565c0', pattern: 'teeth', desc: 'Rapide et mordante dans les virages.', unlock: { wins: 4 } },
    { id: 'pro', name: 'Pro', price: 2000, speed: 1, corner: 1, trick: 1, jump: 1, color: '#8e24aa', pattern: 'diagonal', desc: 'Meilleure que la Freestyle en tout.', unlock: { wins: 5 } },
    { id: 'fusee2', name: 'Fusée II', price: 2200, speed: 4, corner: -1, trick: 0, jump: 1, color: '#b71c1c', pattern: 'flames', desc: 'La Fusée, en plus fou.', unlock: { wins: 5 } },
    { id: 'phenix', name: 'Phénix', price: 2800, speed: 2, corner: 2, trick: 2, jump: 1, color: '#ff7043', pattern: 'feathers', desc: 'Renaît de ses cendres à chaque virage.', unlock: { wins: 6 } },
    { id: 'cristal', name: 'Cristal', price: 3200, speed: 2, corner: 3, trick: 1, jump: 2, color: '#b3e5fc', pattern: 'crystal', desc: 'Légère et tranchante.', unlock: { wins: 6 } },
    { id: 'dragon', name: 'Dragon', price: 4000, speed: 3, corner: 2, trick: 2, jump: 2, color: '#2e7d32', pattern: 'scales', desc: 'La planche des légendes.', unlock: { wins: 7 } },
    { id: 'doree', name: 'Dorée', price: 5000, speed: 3, corner: 3, trick: 3, jump: 3, color: '#ffd600', pattern: 'gold', desc: 'La planche des champions. Hors de prix.', unlock: { wins: 8 } },
  ];

  SK.boardById = id => SK.BOARDS.find(b => b.id === id) || SK.BOARDS[0];
  // Articles de la boutique autres que les planches (achat unique, effet permanent en course)
  SK.GEAR = [
    { id: 'casque', cat: 'equip', name: 'Casque', price: 300, desc: 'Tu te relèves 20 % plus vite après une chute.' },
    { id: 'gants', cat: 'equip', name: 'Gants de pro', price: 400, unlock: { wins: 1 }, desc: 'Les figures s\'exécutent 10 % plus vite : plus de pièces par saut.' },
    { id: 'bottes', cat: 'equip', name: 'Bottes à crampons', price: 500, unlock: { wins: 2 }, desc: 'Plus d\'accroche : +10 % en virage, même sur la glace.' },
    { id: 'lunettes', cat: 'equip', name: 'Lunettes anti-pluie', price: 350, unlock: { wins: 3 }, desc: 'Le nuage et le parachute durent moitié moins longtemps sur toi.' },
    { id: 'veste', cat: 'equip', name: 'Veste rembourrée', price: 300, unlock: { wins: 4 }, desc: 'Les murs te ralentissent beaucoup moins.' },
    { id: 'portemonnaie', cat: 'gadget', name: 'Porte-monnaie', price: 600, desc: 'Tu commences chaque course avec 5 pièces d\'or dans les poches.' },
    { id: 'aimant', cat: 'gadget', name: 'Aimant à pièces', price: 550, unlock: { wins: 2 }, desc: 'Les pièces viennent à toi de plus loin.' },
    { id: 'fusee', cat: 'gadget', name: 'Fusée de départ', price: 800, unlock: { wins: 4 }, desc: 'Un turbo automatique au GO.' },
    { id: 'sac', cat: 'gadget', name: 'Sac à objets', price: 700, unlock: { wins: 5 }, desc: 'Tu commences chaque course avec un objet au hasard.' },
    { id: 'vip', cat: 'other', name: 'Carte VIP du télésiège', price: 900, unlock: { wins: 3 }, desc: 'Ta chaise monte 1,5 seconde plus vite que les autres.' },
    { id: 'masque', cat: 'other', name: 'Masque de ninja', price: 5000, unlock: { course: 'ninja' }, desc: 'Débloque Shinobin comme personnage sans avoir à le battre.' },
  ];
  SK.gearById = id => SK.GEAR.find(g => g.id === id);
  // Garde-robe : vêtements et coiffure (achat unique, puis équipé par personnage dans save.look[charId])
  SK.WARDROBE = [];
  [['#e53935', 'rouge'], ['#1e88e5', 'bleu'], ['#43a047', 'vert'], ['#fb8c00', 'orange'], ['#8e24aa', 'violet'], ['#fdd835', 'jaune'], ['#ec407a', 'rose'], ['#212121', 'noir'], ['#ffffff', 'blanc'], ['#00acc1', 'turquoise']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'jacket-' + i, cat: 'linge', slot: 'jacket', name: 'Manteau ' + n, price: i < 3 ? 60 : 120, value: c, desc: 'Un manteau ' + n + ' bien chaud.' }));
  [['#1e3a8a', 'bleu marine'], ['#212121', 'noir'], ['#8d6e63', 'brun'], ['#e53935', 'rouge'], ['#ffffff', 'blanc'], ['#43a047', 'vert'], ['#7e57c2', 'violet'], ['#fdd835', 'jaune']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'pants-' + i, cat: 'linge', slot: 'pants', name: 'Pantalon ' + n, price: i < 2 ? 50 : 100, value: c, desc: 'Un pantalon de neige ' + n + '.' }));
  [['cap', 'Casquette'], ['beanie', 'Tuque'], ['band', 'Bandeau'], ['none', 'Tête nue']].forEach(([v, n], i) =>
    SK.WARDROBE.push({ id: 'hat-' + v, cat: 'linge', slot: 'hat', name: n, price: v === 'none' ? 0 : 90, value: v, desc: v === 'none' ? 'Cheveux au vent.' : n + ' : se combine avec la couleur de chapeau.' }));
  [['#1565c0', 'bleu'], ['#e53935', 'rouge'], ['#212121', 'noir'], ['#ffffff', 'blanc'], ['#43a047', 'vert'], ['#ff8f00', 'orange'], ['#f8bbd0', 'rose']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'hatColor-' + i, cat: 'linge', slot: 'hatColor', name: 'Chapeau ' + n, price: 40, value: c, desc: 'Couleur du chapeau : ' + n + '.' }));
  [['short', 'Cheveux courts'], ['long', 'Cheveux longs'], ['dreads', 'Dreadlocks'], ['pigtails', 'Couettes'], ['spiky', 'Pics'], ['bald', 'Crâne rasé']].forEach(([v, n]) =>
    SK.WARDROBE.push({ id: 'hair-' + v, cat: 'coiffure', slot: 'hair', name: n, price: 70, value: v, desc: 'Coupe : ' + n.toLowerCase() + '.' }));
  [['#5d3a1a', 'bruns'], ['#fdd835', 'blonds'], ['#212121', 'noirs'], ['#d84315', 'roux'], ['#9e9e9e', 'gris'], ['#1e88e5', 'bleus'], ['#ec407a', 'roses'], ['#43a047', 'verts']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'hairColor-' + i, cat: 'coiffure', slot: 'hairColor', name: 'Cheveux ' + n, price: i < 4 ? 40 : 80, value: c, desc: 'Teinture : cheveux ' + n + '.' }));
  [['#f6d2b5', 'très claire'], ['#f3c9a3', 'claire'], ['#d9a37a', 'dorée'], ['#b07a4a', 'mate'], ['#8d5a3b', 'foncée'], ['#5d3a1f', 'très foncée']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'skin-' + i, cat: 'coiffure', slot: 'skin', name: 'Peau ' + n, price: 0, value: c, desc: 'Gratuit : chacun sa peau.' }));
  SK.wardrobeById = id => SK.WARDROBE.find(w => w.id === id);
  // Apparence d'un personnage = ses couleurs d'origine + ce qui est équipé dans save.look[charId]
  SK.lookOf = function (def, save) {
    const base = { jacket: def.colors.jacket, pants: def.colors.pants, hat: def.hat || 'cap', hatColor: def.colors.hat, hair: def.hairStyle || 'short', hairColor: def.colors.hair, skin: def.colors.skin, scarf: def.colors.scarf };
    const l = save && save.look && save.look[def.id];
    return l ? Object.assign(base, l) : base;
  };
  // Pourquoi un article est encore verrouillé (null = disponible). unlock: { wins: n } ou { course: id }
  SK.lockReason = function (unlock, save) {
    if (!unlock) return null;
    const wins = Object.keys(save.won || {}).length;
    if (unlock.wins != null && wins < unlock.wins) return `Gagne ${unlock.wins} piste${unlock.wins > 1 ? 's' : ''} dans l'aventure (${wins} / ${unlock.wins})`;
    if (unlock.course && !(save.won || {})[unlock.course]) { const c = SK.courseById(unlock.course); return 'Gagne la course « ' + c.name + ' »' + (c.boss ? ' en battant Shinobin' : ''); }
    return null;
  };
  SK.UPGRADE_MAX = 2; SK.upgradeCost = lvl => 400 * (lvl + 1);
  // Planche avec ses améliorations achetées (save.upgrades[boardId] = { speed, corner, trick })
  SK.effectiveBoard = function (id, save) { const b = SK.boardById(id), u = (save && save.upgrades && save.upgrades[b.id]) || {}; return Object.assign({}, b, { speed: b.speed + (u.speed || 0), corner: b.corner + (u.corner || 0), trick: b.trick + (u.trick || 0), jump: (b.jump || 0) + (u.jump || 0), base: b }); };

  // ------------------------------------------------------------------ tirs (boîtes rouges) et objets (boîtes bleues)
  SK.SHOTS = {
    bombe:     { name: 'Bombe',       icon: '💣', desc: 'Vole vers le coureur devant toi et le fait tomber.' },
    parachute: { name: 'Parachute',   icon: '🪂', desc: 'Accroche un parachute au coureur devant : il est ralenti 5 secondes.' },
    gel:       { name: 'Rayon de gel', icon: '🧊', desc: 'Gèle le coureur devant dans un bloc de glace pendant 2 secondes.' },
    poele:     { name: 'Poêle',       icon: '🍳', desc: 'Un coup de poêle sur la tête de TOUS les autres coureurs.' },
    bonhomme:  { name: 'Bonhomme',    icon: '⛄', desc: 'Transforme le coureur devant en bonhomme de neige : lent et impossible à diriger.' },
  };
  SK.ITEMS = {
    rocher:    { name: 'Rocher',      icon: '🪨', desc: 'Dépose un rocher derrière toi. Celui qui le touche tombe.' },
    ventilo:   { name: 'Ventilateur', icon: '🌀', desc: 'Turbo : grosse accélération pendant 3 secondes.' },
    invisible: { name: 'Invisible',   icon: '👻', desc: 'Invisible 6 secondes : aucun tir ne peut t\'atteindre.' },
    fantome:   { name: 'Fantôme',     icon: '🎭', desc: 'Vole le tir ou l\'objet du coureur devant toi.' },
    nuage:     { name: 'Nuage',       icon: '🌧️', desc: 'Une averse ralentit tous les autres coureurs 4 secondes.' },
  };
  SK.SHOT_IDS = Object.keys(SK.SHOTS); SK.ITEM_IDS = Object.keys(SK.ITEMS);

  // ------------------------------------------------------------------ figures (en l'air) : durée de base et pièces
  SK.TRICKS = {
    // bouton C (figure) + direction
    grab:    { name: 'Grab',           dur: 0.35, coins: 1, dir: 'none',  btn: 'trick', anim: 'grab' },
    spinL:   { name: 'Vrille 360',     dur: 0.55, coins: 2, dir: 'left',  btn: 'trick', anim: 'spin', turns: 1, sign: -1 },
    spinR:   { name: 'Vrille 360',     dur: 0.55, coins: 2, dir: 'right', btn: 'trick', anim: 'spin', turns: 1, sign: 1 },
    back:    { name: 'Salto arrière',  dur: 0.85, coins: 4, dir: 'up',    btn: 'trick', anim: 'flip', sign: -1 },
    front:   { name: 'Salto avant',    dur: 0.85, coins: 4, dir: 'down',  btn: 'trick', anim: 'flip', sign: 1 },
    // bouton X (saut) + direction, en l'air
    method:  { name: 'Method',         dur: 0.45, coins: 2, dir: 'none',  btn: 'jump', anim: 'method' },
    spin2L:  { name: 'Vrille 720',     dur: 1.0,  coins: 5, dir: 'left',  btn: 'jump', anim: 'spin', turns: 2, sign: -1 },
    spin2R:  { name: 'Vrille 720',     dur: 1.0,  coins: 5, dir: 'right', btn: 'jump', anim: 'spin', turns: 2, sign: 1 },
    rodeo:   { name: 'Rodéo',          dur: 1.1,  coins: 7, dir: 'up',    btn: 'jump', anim: 'rodeo', sign: -1 },
    tornade: { name: 'Tornade',        dur: 1.1,  coins: 7, dir: 'down',  btn: 'jump', anim: 'rodeo', sign: 1 },
  };
  SK.trickFor = (btn, dir) => Object.keys(SK.TRICKS).find(id => SK.TRICKS[id].btn === btn && SK.TRICKS[id].dir === dir);

  // ------------------------------------------------------------------ surfaces
  SK.SURFACES = {
    snow:  { speed: 1,    grip: 1,    name: 'neige' },
    ice:   { speed: 1.06, grip: 0.45, name: 'glace' },
    sand:  { speed: 0.87, grip: 1,    name: 'sable' },
    quick: { speed: 0.5,  grip: 0.8,  name: 'sables mouvants' },
    road:  { speed: 1.04, grip: 1.1,  name: 'asphalte' },
    grass: { speed: 0.93, grip: 1,    name: 'herbe' },
    stone: { speed: 1,    grip: 1.05, name: 'pierre' },
    candy: { speed: 1,    grip: 1,    name: 'bonbon' },
  };

  // ------------------------------------------------------------------ thèmes visuels
  SK.THEMES = {
    rookie:  { sky: ['#5fb0ff', '#dff3ff'], ground: ['#eef4fb', '#e2ebf5'], road: { snow: ['#ffffff', '#f3f7fc'] }, rumble: ['#ff5252', '#ffffff'],
               bg: 'mountains', decor: ['pine', 'pine', 'pine', 'rock', 'snowman', 'fir'], obst: ['pine', 'rock'], sun: 'sun', fog: '#dff3ff' },
    snowman: { sky: ['#3f7fcf', '#cfe6ff'], ground: ['#e9f1fa', '#dce7f4'], road: { snow: ['#ffffff', '#f1f6fc'], ice: ['#cdeeff', '#bfe6fb'] }, rumble: ['#1e88e5', '#ffffff'],
               bg: 'bigsnowman', decor: ['pine', 'snowman', 'snowman', 'fir', 'rock', 'igloo'], obst: ['snowman', 'rock'], sun: 'sun', fog: '#cfe6ff' },
    sunset:  { sky: ['#ff6f2a', '#ffd48a'], ground: ['#b5633a', '#a5572f'], road: { stone: ['#d09463', '#c58958'], sand: ['#e8c07a', '#dfb66f'] }, rumble: ['#6d3b1e', '#ffcc80'],
               bg: 'mesas', decor: ['rock', 'rock', 'mesa', 'cactus', 'deadtree'], obst: ['rock', 'rock', 'cactus'], sun: 'bigsun', fog: '#ffd48a' },
    highway: { sky: ['#07091c', '#1c2a5e'], ground: ['#2b2e39', '#252833'], road: { road: ['#3b3e49', '#373a44'] }, rumble: ['#ffeb3b', '#555555'],
               bg: 'city', decor: ['lamp', 'building', 'building', 'sign', 'lamp'], obst: ['car', 'car', 'cone'], sun: 'moon', fog: '#1c2a5e', stars: true, centerLine: true },
    grass:   { sky: ['#4fa8ff', '#d9f1ff'], ground: ['#43a047', '#3d9442'], road: { grass: ['#86d472', '#7bcb67'], stone: ['#a9a9a0', '#9e9e95'] }, rumble: ['#ffffff', '#8d6e63'],
               bg: 'hills', decor: ['tree', 'tree', 'bush', 'flower', 'cow', 'house', 'flower'], obst: ['cow', 'tree', 'bush'], sun: 'sun', fog: '#d9f1ff' },
    sand:    { sky: ['#ffb74d', '#ffeccc'], ground: ['#dcb46a', '#d1aa5e'], road: { sand: ['#f0cd82', '#e8c478'], quick: ['#b08a44', '#a68039'] }, rumble: ['#8d6e63', '#ffe0b2'],
               bg: 'dunes', decor: ['cactus', 'palm', 'rock', 'pyramid', 'cactus', 'skull'], obst: ['cactus', 'rock', 'skull'], sun: 'bigsun', fog: '#ffeccc' },
    silver:  { sky: ['#8aa6cf', '#edf2f8'], ground: ['#dfe8f2', '#d3dde9'], road: { ice: ['#cdeeff', '#c0e6fb'], snow: ['#ffffff', '#f1f6fc'] }, rumble: ['#90a4ae', '#ffffff'],
               bg: 'peaks', decor: ['fir', 'rock', 'icicle', 'pine', 'rock'], obst: ['rock', 'icicle'], sun: 'none', fog: '#edf2f8', snowfall: true },
    ninja:   { sky: ['#2a1746', '#9b4f85'], ground: ['#3e6b3a', '#345e34'], road: { stone: ['#8f8a7c', '#847e71'], grass: ['#6fb75f', '#64ab55'] }, rumble: ['#c62828', '#fff3e0'],
               bg: 'castle', decor: ['torii', 'bamboo', 'bamboo', 'lantern', 'pagoda', 'cherry'], obst: ['lantern', 'statue', 'bamboo'], sun: 'moon', fog: '#9b4f85', stars: true },
    dizzy:   { sky: ['#ff8fd0', '#ffe9a6'], ground: ['#8fd86f', '#82cf62'], road: { candy: ['#ffd1e8', '#ffc3df'] }, rumble: ['#ff4081', '#ffffff'],
               bg: 'park', decor: ['balloon', 'tent', 'balloon', 'ferris', 'lollipop', 'tent'], obst: ['teacup', 'balloon', 'lollipop'], sun: 'sun', fog: '#ffe9a6' },
  };

  // ------------------------------------------------------------------ pistes (les 9 tableaux, dans l'ordre du championnat)
  // Sections : s = ligne droite, c = virage (c > 0 vers la droite), r = bosse-tremplin (montée de h m sur n segments puis redescente ; sauter au sommet pour décoller),
  // b = bosses, x = changement de surface, tunnel = marche/arrêt. w = demi-largeur (m). obst/boxes/coins = garnitures.
  SK.COURSES = [
    { id: 'rookie', name: 'Mont Débutant', original: 'Rookie Mountain', theme: 'rookie', surface: 'snow', laps: 3,
      desc: 'La piste des débutants : large, douce, deux petits tremplins.',
      sections: [
        { t: 's', n: 30, w: 14, coins: 5 }, { t: 'c', n: 40, c: 0.045, w: 14, boxes: 'rb' }, { t: 's', n: 20, w: 14, obst: 2 },
        { t: 'c', n: 40, c: -0.055, w: 13, coins: 6 }, { t: 'r', n: 5, h: 3.5 }, { t: 's', n: 30, w: 13, boxes: 'rb', obst: 2 },
        { t: 'c', n: 50, c: 0.06, w: 12, coins: 6 }, { t: 's', n: 25, w: 12, obst: 3 }, { t: 'c', n: 30, c: -0.045, w: 13, boxes: 'rb' },
        { t: 'r', n: 5, h: 4 }, { t: 's', n: 40, w: 14, coins: 8 },
      ] },
    { id: 'snowman', name: 'Grand Bonhomme', original: 'Big Snowman', theme: 'snowman', surface: 'snow', laps: 3,
      desc: 'Un bonhomme de neige géant veille sur cette piste pleine de ses petits frères.',
      sections: [
        { t: 's', n: 25, w: 13, coins: 5 }, { t: 'c', n: 45, c: 0.06, w: 13, boxes: 'rb' }, { t: 'c', n: 45, c: -0.06, w: 12, obst: 3 },
        { t: 'r', n: 5, h: 4 }, { t: 's', n: 25, w: 12, coins: 6 }, { t: 'tunnel', on: true }, { t: 's', n: 30, w: 9, obst: 2, boxes: 'b' }, { t: 'tunnel', on: false },
        { t: 'c', n: 50, c: 0.07, w: 12, coins: 6, obst: 2 }, { t: 'x', s: 'ice' }, { t: 's', n: 30, w: 13, boxes: 'rb' }, { t: 'x', s: 'snow' },
        { t: 'c', n: 40, c: -0.05, w: 13, obst: 3 }, { t: 'r', n: 5, h: 4.5 }, { t: 's', n: 20, w: 13, coins: 6 }, { t: 'c', n: 30, c: 0.04, w: 14, boxes: 'rb' }, { t: 's', n: 20, w: 14 },
      ] },
    { id: 'sunset', name: 'Rocher du Couchant', original: 'Sunset Rock', theme: 'sunset', surface: 'stone', laps: 3,
      desc: 'Canyons étroits et gros rochers sous un ciel orange.',
      sections: [
        { t: 's', n: 25, w: 12, coins: 5 }, { t: 'c', n: 40, c: 0.07, w: 11, boxes: 'rb' }, { t: 's', n: 30, w: 8, obst: 3 },
        { t: 'c', n: 40, c: -0.08, w: 9, coins: 6 }, { t: 'r', n: 5, h: 4 }, { t: 'x', s: 'sand' }, { t: 's', n: 30, w: 12, boxes: 'rb', obst: 2 }, { t: 'x', s: 'stone' },
        { t: 'c', n: 55, c: 0.075, w: 9, obst: 3 }, { t: 'tunnel', on: true }, { t: 's', n: 25, w: 7, coins: 6 }, { t: 'tunnel', on: false },
        { t: 'c', n: 40, c: -0.065, w: 11, boxes: 'rb' }, { t: 'b', n: 40, a: 1.2, w: 12, obst: 3 }, { t: 'r', n: 6, h: 5 }, { t: 's', n: 30, w: 12, coins: 8 },
      ] },
    { id: 'highway', name: 'Autoroute de nuit', original: 'Night Highway', theme: 'highway', surface: 'road', laps: 3,
      desc: 'Pleine vitesse sur l\'asphalte entre les voitures et les néons de la ville.',
      sections: [
        { t: 's', n: 35, w: 12, coins: 6, obst: 2 }, { t: 'c', n: 35, c: 0.05, w: 12, boxes: 'rb' }, { t: 's', n: 30, w: 12, obst: 4 },
        { t: 'c', n: 30, c: -0.1, w: 11, coins: 5 }, { t: 'c', n: 30, c: 0.1, w: 11, obst: 2 }, { t: 'r', n: 5, h: 3.5 }, { t: 's', n: 40, w: 13, boxes: 'rb', obst: 3 },
        { t: 'c', n: 50, c: 0.06, w: 11, coins: 7, obst: 2 }, { t: 's', n: 30, w: 9, obst: 4 }, { t: 'c', n: 45, c: -0.085, w: 11, boxes: 'rb' },
        { t: 'r', n: 5, h: 4 }, { t: 's', n: 30, w: 12, coins: 8, obst: 3 }, { t: 'c', n: 25, c: 0.05, w: 12, boxes: 'b' }, { t: 's', n: 15, w: 12 },
      ] },
    { id: 'grass', name: 'Vallée d\'herbe', original: 'Grass Valley', theme: 'grass', surface: 'grass', laps: 3,
      desc: 'Pas de neige ici : collines vertes, vaches et petits ponts de pierre.',
      sections: [
        { t: 'b', n: 40, a: 1.2, w: 13, coins: 6 }, { t: 'c', n: 45, c: 0.06, w: 12, boxes: 'rb' }, { t: 's', n: 30, w: 12, obst: 4 },
        { t: 'x', s: 'stone' }, { t: 's', n: 20, w: 6, coins: 4 }, { t: 'x', s: 'grass' }, { t: 'c', n: 45, c: -0.07, w: 12, obst: 3 },
        { t: 'r', n: 5, h: 4 }, { t: 'b', n: 50, a: 1.6, w: 13, boxes: 'rb', obst: 2 }, { t: 'c', n: 50, c: 0.08, w: 11, coins: 7 },
        { t: 'x', s: 'stone' }, { t: 's', n: 20, w: 6, obst: 1 }, { t: 'x', s: 'grass' }, { t: 'c', n: 40, c: -0.06, w: 12, boxes: 'rb' },
        { t: 'r', n: 6, h: 5 }, { t: 's', n: 30, w: 13, coins: 8 }, { t: 'c', n: 30, c: 0.04, w: 13, obst: 2 },
      ] },
    { id: 'sand', name: 'Vallée des sables', original: 'Quicksand Valley', theme: 'sand', surface: 'sand', laps: 3,
      desc: 'Le désert : le sable freine, les sables mouvants engluent, les dunes font décoller.',
      sections: [
        { t: 's', n: 30, w: 13, coins: 6 }, { t: 'c', n: 40, c: 0.055, w: 12, boxes: 'rb' }, { t: 'x', s: 'quick' }, { t: 's', n: 12, w: 12 }, { t: 'x', s: 'sand' },
        { t: 's', n: 25, w: 12, obst: 3 }, { t: 'r', n: 5, h: 4.5 }, { t: 'c', n: 45, c: -0.07, w: 12, coins: 6, obst: 2 }, { t: 'b', n: 40, a: 1.8, w: 13, boxes: 'rb' },
        { t: 'x', s: 'quick' }, { t: 'c', n: 15, c: 0.03, w: 12 }, { t: 'x', s: 'sand' }, { t: 'c', n: 45, c: 0.08, w: 10, obst: 4 },
        { t: 'r', n: 6, h: 5.5 }, { t: 's', n: 30, w: 12, coins: 7 }, { t: 'c', n: 40, c: -0.06, w: 12, boxes: 'rb', obst: 2 }, { t: 'x', s: 'quick' }, { t: 's', n: 10, w: 13 }, { t: 'x', s: 'sand' },
        { t: 's', n: 30, w: 13, coins: 6 },
      ] },
    { id: 'silver', name: 'Mont d\'Argent', original: 'Silver Mountain', theme: 'silver', surface: 'ice', laps: 3,
      desc: 'Haute montagne : glace vive, crêtes étroites, tempête de neige. Très rapide.',
      sections: [
        { t: 's', n: 35, w: 12, coins: 6 }, { t: 'c', n: 50, c: 0.045, w: 11, boxes: 'rb' }, { t: 'x', s: 'snow' }, { t: 's', n: 25, w: 7, obst: 2 }, { t: 'x', s: 'ice' },
        { t: 'c', n: 50, c: -0.05, w: 11, coins: 6 }, { t: 'r', n: 5, h: 4 }, { t: 's', n: 30, w: 12, boxes: 'rb', obst: 2 },
        { t: 'c', n: 45, c: 0.055, w: 10, obst: 3 }, { t: 'x', s: 'snow' }, { t: 'b', n: 40, a: 1.4, w: 7, coins: 6 }, { t: 'x', s: 'ice' },
        { t: 'c', n: 50, c: -0.045, w: 11, boxes: 'rb' }, { t: 'r', n: 6, h: 5 }, { t: 's', n: 30, w: 12, coins: 6, obst: 2 }, { t: 'c', n: 40, c: 0.04, w: 12, obst: 2 },
        { t: 'r', n: 5, h: 4.5 }, { t: 's', n: 25, w: 13, coins: 6 },
      ] },
    { id: 'ninja', name: 'Pays des Ninjas', original: 'Ninja Land', theme: 'ninja', surface: 'stone', laps: 3, boss: 'shinobin',
      desc: 'Un château japonais au crépuscule. Shinobin, le ninja mystérieux, s\'invite dans la course.',
      sections: [
        { t: 's', n: 25, w: 11, coins: 5 }, { t: 'c', n: 35, c: 0.085, w: 10, boxes: 'rb' }, { t: 'c', n: 35, c: -0.085, w: 10, obst: 3 },
        { t: 'x', s: 'grass' }, { t: 'b', n: 40, a: 1.5, w: 12, coins: 6, obst: 2 }, { t: 'x', s: 'stone' }, { t: 'r', n: 5, h: 4.5 },
        { t: 's', n: 25, w: 6, obst: 2 }, { t: 'c', n: 45, c: 0.07, w: 11, boxes: 'rb', obst: 2 }, { t: 'tunnel', on: true }, { t: 'c', n: 30, c: -0.06, w: 8, coins: 5 }, { t: 'tunnel', on: false },
        { t: 's', n: 25, w: 11, obst: 4 }, { t: 'c', n: 40, c: 0.09, w: 10, boxes: 'rb' }, { t: 'r', n: 6, h: 5.5 }, { t: 'x', s: 'grass' }, { t: 's', n: 30, w: 12, coins: 7 }, { t: 'x', s: 'stone' },
        { t: 'c', n: 40, c: -0.075, w: 10, obst: 3 }, { t: 's', n: 25, w: 6, boxes: 'b' }, { t: 'r', n: 5, h: 4 }, { t: 's', n: 30, w: 12, coins: 6 },
      ] },
    { id: 'dizzy', name: 'Pays Vertige', original: 'Dizzy Land', theme: 'dizzy', surface: 'candy', laps: 3, boss: 'shinobin', hidden: true,
      desc: 'Le parc d\'attractions : virages à n\'en plus finir, bosses, tasses tournantes. Le tableau caché.',
      sections: [
        { t: 's', n: 25, w: 12, coins: 6 }, { t: 'c', n: 30, c: 0.11, w: 11, boxes: 'rb' }, { t: 'c', n: 30, c: -0.11, w: 11, obst: 3 },
        { t: 'c', n: 30, c: 0.11, w: 11, coins: 5 }, { t: 'c', n: 30, c: -0.11, w: 11, obst: 3 }, { t: 'r', n: 5, h: 4.5 },
        { t: 'b', n: 40, a: 2, w: 13, boxes: 'rb', coins: 6 }, { t: 'c', n: 45, c: 0.06, w: 10, obst: 4 }, { t: 's', n: 15, w: 8, boxes: 'b' },
        { t: 'c', n: 35, c: -0.12, w: 11, coins: 6 }, { t: 'c', n: 35, c: 0.12, w: 11, obst: 3 }, { t: 'r', n: 6, h: 6 }, { t: 's', n: 25, w: 12, boxes: 'rb' },
        { t: 'b', n: 30, a: 1.6, w: 12, obst: 3, coins: 6 }, { t: 'c', n: 35, c: -0.09, w: 10, boxes: 'rb', obst: 2 }, { t: 'r', n: 5, h: 4.5 }, { t: 's', n: 25, w: 13, coins: 8 },
      ] },
  ];
  SK.courseById = id => SK.COURSES.find(c => c.id === id);

  // ------------------------------------------------------------------ École : missions de pratique (1 tour)
  SK.MISSIONS = [
    { id: 'slalom1', type: 'slalom', course: 'rookie', goal: 12, reward: 60, name: 'Slalom débutant', desc: 'Passe entre les drapeaux : gauche, droite, gauche, droite… Au moins 12 portes sur 16.' },
    { id: 'coins1', type: 'coins', course: 'grass', goal: 12, reward: 60, name: 'Chasse aux pièces', desc: 'Ramasse au moins 12 pièces d\'or en un tour de la Vallée d\'herbe.' },
    { id: 'tricks1', type: 'tricks', course: 'rookie', goal: 12, reward: 70, name: 'Première figures', desc: 'Gagne au moins 12 G en figures (saute au sommet des bosses avec X, puis C ou X + direction).' },
    { id: 'shots1', type: 'hits', course: 'highway', goal: 3, reward: 100, name: 'Stand de tir', desc: 'Trois coureurs lents roulent devant toi : touche-les 3 fois avec les tirs des boîtes rouges.' },
    { id: 'time1', type: 'time', course: 'rookie', goal: 60, reward: 80, name: 'Contre la montre', desc: 'Descends le Mont Débutant en moins de 1:00. Penche-toi (↑) dans les lignes droites !' },
    { id: 'nofall1', type: 'nofall', course: 'sunset', goal: 0, reward: 80, name: 'Pas une chute', desc: 'Un tour du Rocher du Couchant sans tomber : évite les rochers, saute par-dessus (X).' },
    { id: 'slalom2', type: 'slalom', course: 'silver', goal: 18, reward: 130, name: 'Slalom sur glace', desc: 'Même chose sur la glace du Mont d\'Argent : 18 portes sur 22. Anticipe, ça glisse.' },
    { id: 'tricks2', type: 'tricks', course: 'dizzy', goal: 35, reward: 160, name: 'Roi des airs', desc: 'Gagne 35 G en figures au Pays Vertige : enchaîne Rodéo, Tornade et vrilles 720.' },
    { id: 'shots2', type: 'hits', course: 'ninja', goal: 6, reward: 180, name: 'Tireur d\'élite', desc: 'Six touches en un tour du Pays des Ninjas. Le Fantôme vole les tirs des autres !' },
  ];
  SK.missionById = id => SK.MISSIONS.find(m => m.id === id);

  // ------------------------------------------------------------------ outils communs
  SK.rng = function (seed) {   // mulberry32
    let a = (seed >>> 0) || 1;
    const f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    f.int = n => Math.floor(f() * n); f.pick = arr => arr[Math.floor(f() * arr.length)]; f.range = (a, b) => a + f() * (b - a);
    return f;
  };
  SK.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  SK.fmtTime = function (t) { if (t == null || !isFinite(t)) return '--:--.--'; const m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t * 100) % 100); return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (c < 10 ? '0' : '') + c; };
  SK.ordinal = n => n === 1 ? '1er' : n + 'e';
})(window.SK);
