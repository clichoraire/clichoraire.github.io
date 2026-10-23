// Snow Kids — constantes, personnages, planches, objets et pistes.
// Tout est dans l'espace de noms SK. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.SK = window.SK || {};
window.SK.VERSION = '1.0';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (SK) {
  'use strict';
  SK.W = 1280; SK.H = 720;          // canevas logique
  SK.STEP = 1 / 60;                 // pas de simulation
  SK.SEG = 5;                       // longueur d'un segment de piste (m)
  SK.GRAVITY = 14;
  SK.SLOPE = 0.07;                  // pente de base (m de dénivelé par m parcouru)
  SK.LIFT_INTERVAL = 2;             // une chaise de remontée part toutes les 2 s (une place par chaise)
  SK.LIFT_RIDE = 7;                 // durée de la remontée (s)
  SK.SHOT_COST = 100;               // une boîte rouge (tir) coûte 100 pièces ; les bleues (objets) sont gratuites
  SK.COIN_VALUE = 10;
  SK.BOX_RESPAWN = 6;
  SK.DIFFICULTIES = ['Facile', 'Normal', 'Difficile'];
  SK.PRIZES = [500, 300, 200, 100, 50];   // prime de fin de course selon la place
  SK.LAPS_CHOICES = [1, 2, 3, 5];
  SK.DEFAULT_LAPS = 3;

  // ------------------------------------------------------------------ personnages (vitesse / virage / figures sur 5)
  SK.CHARACTERS = [
    { id: 'slash', name: 'Slash', speed: 5, corner: 2, trick: 3, weight: 3, age: 10,
      colors: { jacket: '#e53935', pants: '#1e3a8a', hat: '#1565c0', hair: '#5d3a1a', skin: '#f3c9a3', board: '#ffb300' },
      desc: 'Le fonceur de la bande : la planche la plus rapide, mais il tourne large.' },
    { id: 'nancy', name: 'Nancy', speed: 3, corner: 4, trick: 3, weight: 2, age: 10,
      colors: { jacket: '#ec407a', pants: '#8e24aa', hat: '#f8bbd0', hair: '#fdd835', skin: '#f6d2b5', board: '#ab47bc' },
      desc: 'Toujours de bonne humeur ; une planche équilibrée qui pardonne les erreurs.' },
    { id: 'jam', name: 'Jam', speed: 3, corner: 3, trick: 5, weight: 3, age: 11,
      colors: { jacket: '#43a047', pants: '#fdd835', hat: '#212121', hair: '#212121', skin: '#8d5a3b', board: '#00acc1' },
      desc: 'Le roi des figures : ses sauts rapportent beaucoup plus de pièces.' },
    { id: 'linda', name: 'Linda', speed: 4, corner: 4, trick: 2, weight: 2, age: 11,
      colors: { jacket: '#1e88e5', pants: '#ffffff', hat: '#ffffff', hair: '#f9e36b', skin: '#f6d2b5', board: '#e53935' },
      desc: 'Rapide et précise dans les virages, mais les figures ne sont pas son fort.' },
    { id: 'tommy', name: 'Tommy', speed: 4, corner: 1, trick: 2, weight: 5, age: 10,
      colors: { jacket: '#fb8c00', pants: '#3949ab', hat: '#6d4c41', hair: '#3e2723', skin: '#f3c9a3', board: '#2e7d32' },
      desc: 'Le costaud : lourd et stable, il se relève vite quand il tombe.' },
    { id: 'wendy', name: 'Wendy', speed: 2, corner: 5, trick: 4, weight: 2, age: 9,
      colors: { jacket: '#7e57c2', pants: '#26a69a', hat: '#7e57c2', hair: '#d84315', skin: '#f6d2b5', board: '#ffee58' },
      desc: 'La plus jeune, lunettes sur le nez : elle tourne sur une pièce de dix cents.' },
    { id: 'shinobin', name: 'Shinobin', speed: 5, corner: 5, trick: 5, weight: 3, age: '?', hidden: true,
      colors: { jacket: '#212121', pants: '#212121', hat: '#212121', hair: '#212121', skin: '#f3c9a3', board: '#b71c1c', scarf: '#d32f2f' },
      desc: 'Le ninja mystérieux qui hante le Pays des Ninjas. Parfait partout. Il faut le battre pour le débloquer.' },
  ];
  SK.charById = id => SK.CHARACTERS.find(c => c.id === id);

  // ------------------------------------------------------------------ planches (boutique)
  SK.BOARDS = [
    { id: 'freestyle', name: 'Freestyle', price: 0, speed: 0, corner: 0, trick: 0, color: '#4caf50', desc: 'La planche de départ, équilibrée.' },
    { id: 'fusee', name: 'Fusée', price: 1500, speed: 2, corner: -1, trick: 0, color: '#e53935', desc: 'Plus rapide, mais elle tourne moins bien.' },
    { id: 'virage', name: 'Virage', price: 1500, speed: -1, corner: 2, trick: 0, color: '#1e88e5', desc: 'Accroche dans les virages, un peu moins rapide.' },
    { id: 'acrobate', name: 'Acrobate', price: 1500, speed: -1, corner: 0, trick: 2, color: '#fb8c00', desc: 'Figures plus rapides et mieux payées.' },
    { id: 'alpine', name: 'Alpine', price: 3500, speed: 3, corner: -2, trick: -1, color: '#546e7a', desc: 'Une fusée. Pour ceux qui savent freiner.' },
    { id: 'pro', name: 'Pro', price: 6000, speed: 1, corner: 1, trick: 1, color: '#8e24aa', desc: 'Meilleure que la Freestyle en tout.' },
    { id: 'doree', name: 'Dorée', price: 15000, speed: 2, corner: 2, trick: 2, color: '#ffd600', desc: 'La planche des champions. Hors de prix.' },
  ];
  SK.boardById = id => SK.BOARDS.find(b => b.id === id) || SK.BOARDS[0];

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
    grab:  { name: 'Grab',          dur: 0.35, coins: 10, dir: 'none' },
    spinL: { name: 'Vrille 360',    dur: 0.55, coins: 20, dir: 'left' },
    spinR: { name: 'Vrille 360',    dur: 0.55, coins: 20, dir: 'right' },
    back:  { name: 'Salto arrière', dur: 0.85, coins: 40, dir: 'up' },
    front: { name: 'Salto avant',   dur: 0.85, coins: 40, dir: 'down' },
  };

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
  // Sections : s = ligne droite, c = virage (c > 0 vers la droite), r = tremplin (montée de h m puis à-pic),
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
