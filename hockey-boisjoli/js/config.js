// Hockey Slapshot — constantes, équipes, personnages et pouvoirs.
// Tout est dans l'espace de noms HK. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.HK = window.HK || {};
window.HK.VERSION = '1.7';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (HK) {
  'use strict';
  HK.W = 1280; HK.H = 720;              // canevas logique
  HK.STEP = 1 / 60;                     // pas de simulation
  HK.RINK = { x: 40, y: 140, w: 1200, h: 540, r: 140 };   // patinoire (coins arrondis de rayon r)
  HK.GOAL = { line: 96, mouth: 80, depth: 30, crease: 54 }; // ligne de but à `line` px du bout, filet de `mouth` px de large
  // Constant-speed rounded route: outer lane passes behind the net, inner lane returns at centre ice.
  HK.warmupPoint = function(side, distance) {
    const r = 105, left = HK.RINK.x + 28, right = HK.W / 2 - 42;
    const top = HK.RINK.y + 32, bottom = HK.RINK.y + HK.RINK.h - 32;
    const h = right - left - 2*r, v = bottom - top - 2*r, arc = Math.PI*r/2;
    const lengths = [h,arc,v,arc,h,arc,v,arc];
    const total = lengths.reduce((a,b)=>a+b,0);
    let d = ((distance % total)+total)%total, i=0;
    while (d > lengths[i] && i < 7) d -= lengths[i++];
    let x,y,a;
    if(i===0){x=right-r-d;y=top;}
    if(i===1){a=-Math.PI/2-d/r;x=left+r+Math.cos(a)*r;y=top+r+Math.sin(a)*r;}
    if(i===2){x=left;y=top+r+d;}
    if(i===3){a=Math.PI-d/r;x=left+r+Math.cos(a)*r;y=bottom-r+Math.sin(a)*r;}
    if(i===4){x=left+r+d;y=bottom;}
    if(i===5){a=Math.PI/2-d/r;x=right-r+Math.cos(a)*r;y=bottom-r+Math.sin(a)*r;}
    if(i===6){x=right;y=bottom-r-d;}
    if(i===7){a=-d/r;x=right-r+Math.cos(a)*r;y=top+r+Math.sin(a)*r;}
    return {x:side<0?x:HK.W-x,y};
  };
  HK.PUCK_R = 5;
  HK.PERIODS = 3;
  HK.PERIOD_LENGTHS = [60, 120, 180, 300];
  HK.DIFFICULTIES = ['Facile', 'Normal', 'Difficile'];
  HK.ON_ICE = 3;                        // joueurs par équipe sur la glace (plus le gardien)

  // Âge réel à partir de la date de naissance (le numéro de chandail des Boisjoli est leur âge). 🎂 le jour de leur fête.
  HK.ageOf = function (birth, today) {
    const b = new Date(birth + 'T00:00:00'), t = today || new Date();
    let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  };
  HK.isBirthday = function (birth, today) { const b = new Date(birth + 'T00:00:00'), t = today || new Date(); return b.getMonth() === t.getMonth() && b.getDate() === t.getDate(); };

  HK.ROLES = {
    grandpapa: 'Grand-papa', grandmaman: 'Grand-maman', papa: 'Papa', maman: 'Maman',
    mononcle: 'Mononcle', enfant: 'Enfant', toutpetit: 'Tout-petit', ado: 'Ado',
    coach: 'Coach', ailier: 'Ailier', centre: 'Centre', defenseur: 'Défenseur', gardien: 'Gardien', banc: 'Toujours au banc',
  };

  // Pouvoirs spéciaux (un par personnage). cd = recharge en secondes.
  HK.POWERS = {
    cheat:     { name: 'Code de triche',   icon: '🕹️', cd: 22, desc: 'Le temps ralentit pour les adversaires pendant 3 s (c\'est lui qui a programmé le jeu…).' },
    biscuits:  { name: 'Biscuits chauds',  icon: '🍪', cd: 18, desc: 'Lance des biscuits : les adversaires proches s\'arrêtent pour les manger (2,5 s).' },
    charge:    { name: 'Charge du vétéran', icon: '💥', cd: 26, desc: 'Un coup d\'épaule légendaire : tout le monde autour (même le gardien) tombe.' },
    laser:     { name: 'Lunettes laser',   icon: '👓', cd: 18, desc: 'Un rayon part de ses lunettes et fige les adversaires touchés (2,5 s).' },
    bulle:     { name: 'Bulle de savon',   icon: '🫧', cd: 18, desc: 'Une bulle la protège 5 s : impossible de la plaquer ou de lui voler la rondelle.' },
    crise:     { name: 'Crise de bacon',   icon: '😱', cd: 20, desc: 'Un cri terrible : tout le monde autour est projeté et étourdi.' },
    zoom:      { name: 'Zoom-zoom',        icon: '⚡', cd: 15, desc: 'Vitesse supersonique pendant 4 s.' },
    teleport:  { name: 'Téléportation',    icon: '✨', cd: 20, desc: 'Apparaît à côté de la rondelle (ou devant le filet adverse s\'il l\'a déjà).' },
    aimant:    { name: 'Aimant à rondelle', icon: '🧲', cd: 18, desc: 'Pendant 3 s, la rondelle est attirée vers elle, même des mains d\'un adversaire.' },
    glissade:  { name: 'Glissade sur le ventre', icon: '🛝', cd: 15, desc: 'Fonce en glissant sur le ventre et fait tomber tout le monde sur son passage.' },
    capitaine: { name: 'Cri du capitaine', icon: '📣', cd: 22, desc: 'Toute son équipe est plus rapide et tire plus fort pendant 5 s.' },
    blizzard:  { name: 'Blizzard',         icon: '❄️', cd: 20, desc: 'Une tempête ralentit tous les adversaires (et leur gardien) pendant 4 s.' },
    fantome:   { name: 'Fantôme',          icon: '👻', cd: 18, desc: 'Passe à travers tout le monde pendant 4 s, impossible à plaquer.' },
    flash:     { name: 'Flash de selfie',  icon: '📸', cd: 18, desc: 'Un flash aveuglant : les adversaires autour (et leur gardien) sont étourdis 1,5 s.' },
    slap:      { name: 'Lancer frappé d\'ado', icon: '🔥', cd: 16, desc: 'Son prochain tir est une fusée : une chance sur deux de passer à travers le gardien.' },
    // Les Boys
    tempsmort: { name: 'Temps d\'arrêt',     icon: '📋', cd: 28, desc: 'Stan siffle : tous les adversaires s\'arrêtent 2 s pour écouter le coach.' },
    charme:    { name: 'Charme de Bob',     icon: '😎', cd: 18, desc: 'Son sourire fait fondre les adversaires autour : ils restent figés et lui laissent la rondelle.' },
    deal:      { name: 'Deal du siècle',    icon: '🤝', cd: 20, desc: 'Ti-Guy échange sa place avec le porteur adverse… et garde la rondelle. Belle vente !' },
    objection: { name: 'Objection !',       icon: '⚖️', cd: 26, desc: 'Maître Taillefer plaide : le porteur adverse écope de 6 s au banc des punitions.' },
    docteur:   { name: 'Trousse du docteur', icon: '🩺', cd: 24, desc: 'Le chirurgien remet toute son équipe sur pied : énergie à fond et invulnérables 3 s.' },
    rage:      { name: 'Pétage de coche',   icon: '🤬', cd: 26, desc: 'Julien perd la carte : 3,5 s plus vite, incassable, et tout adversaire qu\'il frappe tombe.' },
    mur:       { name: 'Mur de Popol',      icon: '🧱', cd: 20, desc: 'Popol devient un mur de 5 s : impossible à bouger, les rondelles rebondissent dessus.' },
    lemieux:   { name: 'Le 66',             icon: '🏒', cd: 30, desc: 'Comme Mario Lemieux : son prochain tir est imparable.' },
    nerfs:     { name: 'Crise de nerfs',    icon: '😰', cd: 15, desc: 'Marcel panique : 3 s de vitesse nerveuse, impossible à plaquer.' },
    boucane:   { name: 'Boucane de Méo',    icon: '🚬', cd: 20, desc: 'Un nuage de fumée de 4 s : les adversaires dedans sont ralentis et ne voient plus rien.' },
    chaise:    { name: 'Chaise musicale',   icon: '🪑', cd: 24, desc: 'Roger se lève enfin du banc : les adversaires échangent leurs places, tout étourdis.' },
  };

  // Personnages : stats de 1 à 5, taille (1 = adulte), apparence.
  // Le numéro de chandail est l'âge. Pour renommer quelqu'un, il suffit de changer `name`.
  HK.PLAYERS = {
    matthieu: { name: 'Matthieu', birth: '1990-01-15', role: 'mononcle', size: 1.0, power: 'cheat',
      stats: { speed: 3, shot: 3, force: 2, control: 4 },
      look: { skin: '#f0c8a0', hair: '#4a2f1b', hairStyle: 'short', beard: '#3d2616' } },
    josee: { name: 'Josée', birth: '1960-06-29', role: 'grandmaman', size: 0.92, power: 'biscuits',
      stats: { speed: 2, shot: 2, force: 2, control: 5 },
      look: { skin: '#f3d2b4', hair: '#d8d2c8', hairStyle: 'bun', lipstick: true, earrings: true, wrinkles: true } },
    richard: { name: 'Richard', birth: '1956-03-15', role: 'grandpapa', size: 1.0, power: 'charge',
      stats: { speed: 1, shot: 5, force: 4, control: 2 },
      look: { skin: '#edc39c', hair: '#f2f2f2', hairStyle: 'bald', mustache: '#f2f2f2', glasses: 'reading', eyebrows: 'bushy', belly: true, wrinkles: true } },

    mickael: { name: 'Mickael', birth: '1993-01-04', role: 'papa', size: 0.98, power: 'laser',
      stats: { speed: 3, shot: 3, force: 4, control: 4 },
      look: { skin: '#f3d2b4', hair: '#3b2614', hairStyle: 'swept', glasses: 'round', beard: '#6b4a2b', grin: true } },
    marie: { name: 'Marie', birth: '1994-01-06', role: 'maman', size: 0.92, power: 'bulle',
      stats: { speed: 4, shot: 3, force: 3, control: 4 },
      look: { skin: '#f6d6bd', hair: '#5a3a22', hairStyle: 'long', lipstick: true } },
    adam: { name: 'Adam', birth: '2021-09-11', role: 'enfant', size: 0.6, power: 'zoom',
      stats: { speed: 5, shot: 2, force: 1, control: 4 },
      look: { skin: '#f6d6bd', hair: '#4a2f1b', hairStyle: 'spiky', cheeks: true } },
    milo: { name: 'Milo', birth: '2024-03-12', role: 'toutpetit', size: 0.45, power: 'crise',
      stats: { speed: 2, shot: 1, force: 1, control: 2 },
      look: { skin: '#f6d6bd', hair: '#6b4a2b', hairStyle: 'tuque', hat: '#ff6b6b', pacifier: true, cheeks: true } },

    jeremie: { name: 'Jérémie', birth: '1988-03-06', role: 'papa', size: 1.0, power: 'teleport',
      stats: { speed: 4, shot: 4, force: 3, control: 3 },
      look: { skin: '#f0c8a0', hair: '#8a6a3e', hairStyle: 'quiff', beard: '#7a5a35', eyes: '#4a7fb5' } },
    jessica: { name: 'Jessica', birth: '1991-07-01', role: 'maman', size: 0.92, power: 'aimant',
      stats: { speed: 4, shot: 4, force: 2, control: 5 },
      look: { skin: '#f6d6bd', hair: '#e5c06b', hairStyle: 'ponytail', lipstick: true, earrings: true } },
    edison: { name: 'Edison', birth: '2023-02-08', role: 'toutpetit', size: 0.5, power: 'glissade',
      stats: { speed: 4, shot: 1, force: 1, control: 4 },
      look: { skin: '#eec49b', hair: '#2b1d12', hairStyle: 'curly', cheeks: true, pacifier: true } },

    josue: { name: 'Josué', birth: '1985-10-29', role: 'papa', size: 1.0, power: 'capitaine',
      stats: { speed: 3, shot: 4, force: 4, control: 3 },
      look: { skin: '#e8b98f', hair: '#1b1b1b', hairStyle: 'buzz', beard: '#1b1b1b', broad: true, squint: true, grin: true } },
    emily: { name: 'Émily', birth: '1984-12-25', role: 'maman', size: 0.94, power: 'blizzard',
      stats: { speed: 3, shot: 2, force: 2, control: 4 },
      look: { skin: '#f6d6bd', hair: '#b5452a', hairStyle: 'long', lipstick: true, earrings: true } },
    eliott: { name: 'Eliott', birth: '2016-10-06', role: 'enfant', size: 0.78, power: 'fantome',
      stats: { speed: 4, shot: 2, force: 1, control: 3 },
      look: { skin: '#f0c8a0', hair: '#3b2a1a', hairStyle: 'short', cheeks: true, freckles: true } },
    alexie: { name: 'Alexie', birth: '2014-11-01', role: 'enfant', size: 0.82, power: 'flash',
      stats: { speed: 4, shot: 2, force: 1, control: 4 },
      look: { skin: '#f6d6bd', hair: '#5a3a22', hairStyle: 'ponytail', cheeks: true, freckles: true } },
    zachary: { name: 'Zachary', birth: '2007-08-02', role: 'ado', size: 1.05, power: 'slap',
      stats: { speed: 5, shot: 4, force: 2, control: 3 },
      look: { skin: '#f0c8a0', hair: '#1b1b1b', hairStyle: 'fringe', tall: true, earbuds: true } },

    // Les Boys (films de Louis Saia, 1997-2005). Numéros de chandail des films.
    stan: { name: 'Stan', age: 58, role: 'coach', number: 0, size: 1.0, power: 'tempsmort',
      stats: { speed: 2, shot: 3, force: 3, control: 3 },
      look: { skin: '#eec49b', hair: '#8a8a8a', hairStyle: 'cap', hat: '#2a2a2a', mustache: '#6a6a6a', glasses: 'round', belly: true, wrinkles: true } },
    bob: { name: 'Bob', age: 46, role: 'ailier', number: 9, size: 1.0, power: 'charme',
      stats: { speed: 3, shot: 3, force: 3, control: 4 },
      look: { skin: '#f0c8a0', hair: '#4a2f1b', hairStyle: 'wavy', mustache: '#4a2f1b', chain: true, chest: true } },
    tiguy: { name: 'Ti-Guy', age: 31, role: 'centre', number: 10, size: 0.98, power: 'deal',
      stats: { speed: 5, shot: 3, force: 2, control: 4 },
      look: { skin: '#f0c8a0', hair: '#1b1b1b', hairStyle: 'slick', stubble: true, earrings: 'one' } },
    jeancharles: { name: 'Jean-Charles', age: 52, role: 'defenseur', number: 11, size: 1.04, power: 'objection',
      stats: { speed: 2, shot: 3, force: 4, control: 3 },
      look: { skin: '#f3d2b4', hair: '#9a9a9a', hairStyle: 'short', eyebrows: 'bushy', tie: true, tall: true } },
    francois: { name: 'François', age: 49, role: 'centre', number: 15, size: 0.96, power: 'docteur',
      stats: { speed: 2, shot: 2, force: 2, control: 4 },
      look: { skin: '#f3d2b4', hair: '#5a3a22', hairStyle: 'toupee', mustache: '#6b4a2b', lipstick: false } },
    julien: { name: 'Julien', age: 41, role: 'defenseur', number: 18, size: 1.0, power: 'rage',
      stats: { speed: 4, shot: 3, force: 4, control: 2 },
      look: { skin: '#eec49b', hair: '#1b1b1b', hairStyle: 'wild', bandana: '#c0392b', stubble: true, crazyEyes: true } },
    popol: { name: 'Popol', age: 36, role: 'defenseur', number: 30, size: 1.12, power: 'mur',
      stats: { speed: 1, shot: 2, force: 5, control: 2 },
      look: { skin: '#f6d6bd', hair: '#4a2f1b', hairStyle: 'buzz', belly: true, cheeks: true } },
    mario: { name: 'Mario', age: 39, role: 'centre', number: 66, size: 1.0, power: 'lemieux',
      stats: { speed: 3, shot: 5, force: 2, control: 3 },
      look: { skin: '#f0c8a0', hair: '#2b1d12', hairStyle: 'mullet', stubble: true } },
    marcel: { name: 'Marcel', age: 47, role: 'defenseur', number: 88, size: 0.94, power: 'nerfs',
      stats: { speed: 3, shot: 2, force: 1, control: 4 },
      look: { skin: '#f3d2b4', hair: '#6b4a2b', hairStyle: 'bald', glasses: 'round', sweat: true } },
    meo: { name: 'Méo', age: 56, role: 'ailier', number: 99, size: 1.08, power: 'boucane',
      stats: { speed: 2, shot: 4, force: 4, control: 2 },
      look: { skin: '#e8b98f', hair: '#333333', hairStyle: 'slick', sunglasses: true, cigarette: true, belly: true, stubble: true } },
    roger: { name: 'Roger', age: 50, role: 'banc', number: 7, size: 1.0, power: 'chaise',
      stats: { speed: 1, shot: 2, force: 2, control: 2 },
      look: { skin: '#f0c8a0', hair: '#4a2f1b', hairStyle: 'bald', mustache: '#4a2f1b', scarf: '#f2c230' } },
    fern: { name: 'Fern', age: 51, role: 'gardien', number: 1, size: 1.0, power: 'none',
      stats: { speed: 2, shot: 1, force: 3, control: 3 },
      look: { skin: '#f0c8a0', hair: '#6b4a2b', hairStyle: 'curly', glasses: 'round', mustache: '#6b4a2b' } },
  };

  Object.entries(HK.PLAYERS).forEach(([id,def]) => { def.familyPortrait = id; });

  // Équipes : les 3 premiers joueurs commencent sur la glace, les autres au banc (changements aux mises au jeu).
  HK.TEAMS = [
    { id: 'matt', name: 'Les Matt', short: 'MATT', color: '#1e5bd8', color2: '#ffffff', dark: '#0f2f73', players: ['matthieu', 'josee', 'richard'] },
    { id: 'bibi', name: 'Les Bibi', short: 'BIBI', color: '#af1e2d', color2: '#ffffff', stripe: '#192168', dark: '#192168', players: ['mickael', 'marie', 'adam', 'milo'] },
    { id: 'jay',  name: 'Les Jay',  short: 'JAY',  color: '#d9342b', color2: '#ffffff', stripe: '#1b1b1b', dark: '#1b1b1b', players: ['jeremie', 'jessica', 'edison'] },
    { id: 'jo',   name: 'Les Jo',   short: 'JO',   color: '#1f9d4a', color2: '#ffffff', dark: '#0f5a2a', players: ['josue', 'zachary', 'emily', 'alexie', 'eliott'] },
    { id: 'boys', name: 'Les Boys', short: 'BOYS', initial: 'LB', color: '#161616', color2: '#f2c230', accent: '#f2c230', dark: '#2e2e2e', goalie: 'fern',
      players: ['bob', 'tiguy', 'julien', 'meo', 'mario', 'jeancharles', 'popol', 'francois', 'marcel', 'stan', 'roger'] },
  ];
  for (const id in HK.PLAYERS) { const d = HK.PLAYERS[id]; if (d.birth) d.age = HK.ageOf(d.birth); }
  HK.teamById = id => HK.TEAMS.find(t => t.id === id);

  // Conversion des stats en valeurs physiques.
  HK.phys = function (d) {
    const s = d.stats;
    return {
      maxSpeed: 205 + 24 * s.speed,
      accel: 650 + 110 * s.speed,
      shotSpeed: 640 + 55 * s.shot,
      force: s.force,
      reach: 13 + 2.2 * s.control + 7 * d.size,
      passErr: 0.26 - 0.04 * s.control,
    };
  };
})(window.HK);
