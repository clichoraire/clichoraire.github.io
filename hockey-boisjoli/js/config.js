// Hockey Boisjoli — constantes, équipes, personnages et pouvoirs.
// Tout est dans l'espace de noms HK. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.HK = window.HK || {};
(function (HK) {
  'use strict';
  HK.W = 1280; HK.H = 720;              // canevas logique
  HK.STEP = 1 / 60;                     // pas de simulation
  HK.RINK = { x: 40, y: 140, w: 1200, h: 540, r: 140 };   // patinoire (coins arrondis de rayon r)
  HK.GOAL = { line: 96, mouth: 80, depth: 30, crease: 54 }; // ligne de but à `line` px du bout, filet de `mouth` px de large
  HK.PUCK_R = 5;
  HK.PERIODS = 3;
  HK.PERIOD_LENGTHS = [60, 120, 180, 300];
  HK.DIFFICULTIES = ['Facile', 'Normal', 'Difficile'];
  HK.ON_ICE = 3;                        // joueurs par équipe sur la glace (plus le gardien)

  HK.ROLES = {
    grandpapa: 'Grand-papa', grandmaman: 'Grand-maman', papa: 'Papa', maman: 'Maman',
    mononcle: 'Mononcle', enfant: 'Enfant', toutpetit: 'Tout-petit', ado: 'Ado',
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
    slap:      { name: 'Lancer frappé d\'ado', icon: '🔥', cd: 16, desc: 'Son prochain tir est une fusée : une chance sur deux de passer à travers le gardien.' },
  };

  // Personnages : stats de 1 à 5, taille (1 = adulte), apparence.
  // Le numéro de chandail est l'âge. Pour renommer quelqu'un, il suffit de changer `name`.
  HK.PLAYERS = {
    matthieu: { name: 'Matthieu', age: 36, role: 'mononcle', size: 1.0, power: 'cheat',
      stats: { speed: 3, shot: 3, force: 2, control: 4 },
      look: { skin: '#f0c8a0', hair: '#4a2f1b', hairStyle: 'short', beard: '#3d2616' } },
    josee: { name: 'Josée', age: 63, role: 'grandmaman', size: 0.92, power: 'biscuits',
      stats: { speed: 2, shot: 2, force: 2, control: 5 },
      look: { skin: '#f3d2b4', hair: '#d8d2c8', hairStyle: 'bun', lipstick: true, earrings: true, wrinkles: true } },
    richard: { name: 'Richard', age: 69, role: 'grandpapa', size: 1.0, power: 'charge',
      stats: { speed: 1, shot: 5, force: 4, control: 2 },
      look: { skin: '#edc39c', hair: '#f2f2f2', hairStyle: 'bald', mustache: '#f2f2f2', glasses: 'reading', eyebrows: 'bushy', belly: true, wrinkles: true } },

    mickael: { name: 'Mickael', age: 33, role: 'papa', size: 0.98, power: 'laser',
      stats: { speed: 3, shot: 3, force: 4, control: 4 },
      look: { skin: '#f0c8a0', hair: '#2b1d12', hairStyle: 'short', glasses: 'round', stubble: true } },
    marie: { name: 'Marie', age: 32, role: 'maman', size: 0.92, power: 'bulle',
      stats: { speed: 4, shot: 3, force: 2, control: 4 },
      look: { skin: '#f6d6bd', hair: '#5a3a22', hairStyle: 'long', lipstick: true } },
    mike: { name: 'Mike', age: 5, role: 'enfant', size: 0.6, power: 'zoom',
      stats: { speed: 5, shot: 1, force: 1, control: 3 },
      look: { skin: '#f6d6bd', hair: '#4a2f1b', hairStyle: 'spiky', cheeks: true } },
    adam: { name: 'Adam', age: 3, role: 'toutpetit', size: 0.5, power: 'crise',
      stats: { speed: 2, shot: 1, force: 1, control: 2 },
      look: { skin: '#f6d6bd', hair: '#6b4a2b', hairStyle: 'tuque', hat: '#ff6b6b', pacifier: true, cheeks: true } },

    jeremie: { name: 'Jérémie', age: 35, role: 'papa', size: 1.0, power: 'teleport',
      stats: { speed: 4, shot: 4, force: 3, control: 3 },
      look: { skin: '#eec49b', hair: '#2b1d12', hairStyle: 'buzz', goatee: '#2b1d12' } },
    jessica: { name: 'Jessica', age: 33, role: 'maman', size: 0.92, power: 'aimant',
      stats: { speed: 4, shot: 4, force: 2, control: 5 },
      look: { skin: '#f6d6bd', hair: '#e5c06b', hairStyle: 'ponytail', lipstick: true, earrings: true } },
    diddy: { name: 'Diddy', age: 5, role: 'enfant', size: 0.6, power: 'glissade',
      stats: { speed: 5, shot: 2, force: 1, control: 4 },
      look: { skin: '#eec49b', hair: '#2b1d12', hairStyle: 'curly', cheeks: true } },

    josue: { name: 'Josué', age: 37, role: 'papa', size: 1.0, power: 'capitaine',
      stats: { speed: 3, shot: 4, force: 4, control: 3 },
      look: { skin: '#f0c8a0', hair: '#3b2a1a', hairStyle: 'cap', hat: '#1b1b1b', stubble: true } },
    emily: { name: 'Émily', age: 34, role: 'maman', size: 0.94, power: 'blizzard',
      stats: { speed: 3, shot: 2, force: 2, control: 4 },
      look: { skin: '#f6d6bd', hair: '#b5452a', hairStyle: 'long', lipstick: true, earrings: true } },
    elliot: { name: 'Elliot', age: 8, role: 'enfant', size: 0.7, power: 'fantome',
      stats: { speed: 4, shot: 2, force: 1, control: 3 },
      look: { skin: '#f0c8a0', hair: '#3b2a1a', hairStyle: 'short', cheeks: true, freckles: true } },
    zachary: { name: 'Zachary', age: 19, role: 'ado', size: 1.05, power: 'slap',
      stats: { speed: 5, shot: 4, force: 2, control: 3 },
      look: { skin: '#f0c8a0', hair: '#1b1b1b', hairStyle: 'fringe', tall: true, earbuds: true } },
  };

  // Équipes : les 3 premiers joueurs commencent sur la glace, les autres au banc (changements aux mises au jeu).
  HK.TEAMS = [
    { id: 'matt', name: 'Les Matt', short: 'MATT', color: '#d9342b', color2: '#ffd166', dark: '#7f1c15', players: ['matthieu', 'josee', 'richard'] },
    { id: 'bibi', name: 'Les Bibi', short: 'BIBI', color: '#2f6fe0', color2: '#ffffff', dark: '#163a85', players: ['mickael', 'marie', 'mike', 'adam'] },
    { id: 'jay',  name: 'Les Jay',  short: 'JAY',  color: '#2aa84a', color2: '#f5f5f5', dark: '#145c28', players: ['jeremie', 'jessica', 'diddy'] },
    { id: 'jo',   name: 'Les Jo',   short: 'JO',   color: '#f2a900', color2: '#1b1b1b', dark: '#8a5f00', players: ['josue', 'zachary', 'emily', 'elliot'] },
  ];
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
