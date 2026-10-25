// Ballon Chasseur Boisjoli — constantes, personnages, équipes, lancers spéciaux et terrains.
// Tout est dans l'espace de noms BC. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.BC = window.BC || {};
window.BC.VERSION = '1.1';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (BC) {
  'use strict';
  BC.W = 1280; BC.H = 720;              // canevas logique
  BC.STEP = 1 / 60;                     // pas de simulation
  // Terrain vu de côté, légèrement du dessus (façon Super Dodge Ball) : x = largeur, y = profondeur au sol, z = hauteur.
  BC.COURT = { left: 150, right: 1130, top: 300, bottom: 600, mid: 640 };
  BC.LANE = 46;                          // distance des couloirs extérieurs par rapport au terrain
  BC.GRAVITY = 1500;
  BC.BALL_R = 11;
  BC.DIFFICULTIES = ['Facile', 'Normal', 'Difficile'];
  BC.INNER = 3;                          // joueurs intérieurs par équipe (ceux qu'on peut toucher)
  BC.OUTER = 3;                          // joueurs extérieurs (haut, bas, fond) : ils ne peuvent pas être touchés

  // Âge réel à partir de la date de naissance. 🎂 le jour de leur fête.
  BC.ageOf = function (birth, today) {
    const b = new Date(birth + 'T00:00:00'), t = today || new Date();
    let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  };
  BC.isBirthday = function (birth, today) { const b = new Date(birth + 'T00:00:00'), t = today || new Date(); return b.getMonth() === t.getMonth() && b.getDate() === t.getDate(); };

  BC.ROLES = {
    grandpapa: 'Grand-papa', grandmaman: 'Grand-maman', papa: 'Papa', maman: 'Maman',
    mononcle: 'Mononcle', enfant: 'Enfant', toutpetit: 'Tout-petit', ado: 'Ado',
  };

  // Lancers spéciaux (un par personnage). Déclenchés par un lancer au bon pas de la course, ou au sommet d'un saut en course.
  // dmg = dégâts, speed = vitesse de la balle (px/s), catch = difficulté à attraper (0 facile … 1 impossible).
  BC.SUPERS = {
    glitch:   { name: 'Code de triche',      icon: '🕹️', dmg: 15, speed: 820, catch: 0.75, desc: 'La balle disparaît en chemin et réapparaît juste devant la cible. C\'est lui qui a programmé le jeu…' },
    biscuit:  { name: 'Biscuit chaud',       icon: '🍪', dmg: 13, speed: 560, catch: 0.55, desc: 'Une balle qui dérive doucement comme une odeur de biscuit, puis fonce d\'un coup.' },
    boulet:   { name: 'Boulet du vétéran',   icon: '💥', dmg: 22, speed: 600, catch: 0.85, desc: 'Lente, lourde, légendaire : presque impossible à attraper et ça fait très mal.' },
    laser:    { name: 'Lunettes laser',      icon: '👓', dmg: 14, speed: 1250, catch: 0.7, desc: 'Un rayon tout droit, si vite qu\'on le voit à peine.' },
    bulle:    { name: 'Bulle de savon',      icon: '🫧', dmg: 13, speed: 520, catch: 0.6, desc: 'La balle monte, flotte au-dessus du terrain, puis retombe sur la cible.' },
    zigzag:   { name: 'Zoom-zoom',           icon: '⚡', dmg: 12, speed: 900, catch: 0.7, desc: 'La balle zigzague à toute vitesse d\'un bord à l\'autre.' },
    crise:    { name: 'Crise de bacon',      icon: '😱', dmg: 11, speed: 700, catch: 0.6, desc: 'La balle tremble, crie et devient énorme : difficile de l\'éviter.' },
    boomerang:{ name: 'Téléportation',       icon: '✨', dmg: 14, speed: 780, catch: 0.7, desc: 'La balle file derrière la cible, se téléporte, et revient la frapper dans le dos.' },
    aimant:   { name: 'Aimant à balle',      icon: '🧲', dmg: 13, speed: 760, catch: 0.65, desc: 'La balle suit la cible comme un aimant, inutile de bouger.' },
    rase:     { name: 'Glissade sur le ventre', icon: '🛝', dmg: 12, speed: 800, catch: 0.7, desc: 'La balle rase le sol en rebondissant : impossible de sauter par-dessus.' },
    canon:    { name: 'Cri du capitaine',    icon: '📣', dmg: 18, speed: 900, catch: 0.75, desc: 'Un boulet de canon qui projette la cible jusqu\'au fond du terrain.' },
    tornade:  { name: 'Blizzard',            icon: '❄️', dmg: 13, speed: 700, catch: 0.65, desc: 'La balle tourbillonne en spirale dans une tempête de neige.' },
    fantome:  { name: 'Fantôme',             icon: '👻', dmg: 13, speed: 820, catch: 0.75, desc: 'La balle devient invisible par moments. Bonne chance pour l\'attraper !' },
    flash:    { name: 'Flash de selfie',     icon: '📸', dmg: 12, speed: 1150, catch: 0.7, desc: 'Un flash aveugle tout le monde, puis la balle part comme un éclair.' },
    fusee:    { name: 'Fusée d\'ado',        icon: '🔥', dmg: 16, speed: 500, catch: 0.7, desc: 'Part tranquille… et accélère comme une fusée jusqu\'à la cible.' },
  };

  // Personnages : stats de 1 à 5 (speed = vitesse, power = force de lancer, catch = réflexes pour attraper, hp = endurance), taille (1 = adulte).
  BC.PLAYERS = {
    matthieu: { name: 'Matthieu', birth: '1990-01-15', role: 'mononcle', size: 1.0, superShot: 'glitch',
      stats: { speed: 3, power: 3, catch: 4, hp: 3 },
      look: { skin: '#f0c8a0', hair: '#4a2f1b', hairStyle: 'short', beard: '#3d2616' } },
    josee: { name: 'Josée', birth: '1960-06-29', role: 'grandmaman', size: 0.92, superShot: 'biscuit',
      stats: { speed: 2, power: 2, catch: 5, hp: 3 },
      look: { skin: '#f3d2b4', hair: '#d8d2c8', hairStyle: 'bun', lipstick: true, earrings: true, wrinkles: true } },
    richard: { name: 'Richard', birth: '1956-03-15', role: 'grandpapa', size: 1.0, superShot: 'boulet',
      stats: { speed: 1, power: 5, catch: 2, hp: 5 },
      look: { skin: '#edc39c', hair: '#f2f2f2', hairStyle: 'bald', mustache: '#f2f2f2', glasses: 'reading', eyebrows: 'bushy', belly: true, wrinkles: true } },

    mickael: { name: 'Mickael', birth: '1993-01-04', role: 'papa', size: 0.98, superShot: 'laser',
      stats: { speed: 3, power: 4, catch: 3, hp: 4 },
      look: { skin: '#f3d2b4', hair: '#3b2614', hairStyle: 'swept', glasses: 'round', beard: '#6b4a2b', grin: true } },
    marie: { name: 'Marie', birth: '1994-01-06', role: 'maman', size: 0.92, superShot: 'bulle',
      stats: { speed: 4, power: 3, catch: 4, hp: 3 },
      look: { skin: '#f6d6bd', hair: '#5a3a22', hairStyle: 'long', lipstick: true } },
    adam: { name: 'Adam', birth: '2021-09-11', role: 'enfant', size: 0.6, superShot: 'zigzag',
      stats: { speed: 5, power: 2, catch: 3, hp: 2 },
      look: { skin: '#f6d6bd', hair: '#4a2f1b', hairStyle: 'spiky', cheeks: true } },
    milo: { name: 'Milo', birth: '2024-03-12', role: 'toutpetit', size: 0.45, superShot: 'crise',
      stats: { speed: 2, power: 1, catch: 2, hp: 1 },
      look: { skin: '#f6d6bd', hair: '#6b4a2b', hairStyle: 'tuque', hat: '#ff6b6b', pacifier: true, cheeks: true } },

    jeremie: { name: 'Jérémie', birth: '1988-03-06', role: 'papa', size: 1.0, superShot: 'boomerang',
      stats: { speed: 4, power: 4, catch: 3, hp: 4 },
      look: { skin: '#f0c8a0', hair: '#8a6a3e', hairStyle: 'quiff', beard: '#7a5a35', eyes: '#4a7fb5' } },
    jessica: { name: 'Jessica', birth: '1991-07-01', role: 'maman', size: 0.92, superShot: 'aimant',
      stats: { speed: 4, power: 3, catch: 5, hp: 3 },
      look: { skin: '#f6d6bd', hair: '#e5c06b', hairStyle: 'ponytail', lipstick: true, earrings: true } },
    edison: { name: 'Edison', birth: '2023-02-08', role: 'toutpetit', size: 0.5, superShot: 'rase',
      stats: { speed: 4, power: 1, catch: 3, hp: 1 },
      look: { skin: '#eec49b', hair: '#2b1d12', hairStyle: 'curly', cheeks: true, pacifier: true } },

    josue: { name: 'Josué', birth: '1985-10-29', role: 'papa', size: 1.0, superShot: 'canon',
      stats: { speed: 3, power: 5, catch: 3, hp: 5 },
      look: { skin: '#e8b98f', hair: '#1b1b1b', hairStyle: 'buzz', beard: '#1b1b1b', broad: true, squint: true, grin: true } },
    emily: { name: 'Émily', birth: '1984-12-25', role: 'maman', size: 0.94, superShot: 'tornade',
      stats: { speed: 3, power: 3, catch: 4, hp: 3 },
      look: { skin: '#f6d6bd', hair: '#b5452a', hairStyle: 'long', lipstick: true, earrings: true } },
    eliott: { name: 'Eliott', birth: '2016-10-06', role: 'enfant', size: 0.78, superShot: 'fantome',
      stats: { speed: 4, power: 2, catch: 3, hp: 2 },
      look: { skin: '#f0c8a0', hair: '#3b2a1a', hairStyle: 'short', cheeks: true, freckles: true } },
    alexie: { name: 'Alexie', birth: '2014-11-01', role: 'enfant', size: 0.82, superShot: 'flash',
      stats: { speed: 4, power: 2, catch: 4, hp: 2 },
      look: { skin: '#f6d6bd', hair: '#5a3a22', hairStyle: 'ponytail', cheeks: true, freckles: true } },
    zachary: { name: 'Zachary', birth: '2007-08-02', role: 'ado', size: 1.05, superShot: 'fusee',
      stats: { speed: 5, power: 4, catch: 3, hp: 4 },
      look: { skin: '#f0c8a0', hair: '#1b1b1b', hairStyle: 'fringe', tall: true, earbuds: true } },
  };
  Object.entries(BC.PLAYERS).forEach(([id, def]) => { def.id = id; def.familyPortrait = id; if (def.birth) def.age = BC.ageOf(def.birth); });

  // Équipes : les trois premiers jouent à l'intérieur du terrain, les suivants à l'extérieur (haut, bas, fond).
  // Une équipe de moins de six personnes emprunte des cousins aux familles qui ne jouent pas ce match (BC.squad).
  BC.TEAMS = [
    { id: 'matt', name: 'Les Matt', short: 'MATT', color: '#1e5bd8', color2: '#ffffff', dark: '#0f2f73', players: ['matthieu', 'josee', 'richard'], court: 'gym' },
    { id: 'bibi', name: 'Les Bibi', short: 'BIBI', color: '#af1e2d', color2: '#ffffff', stripe: '#192168', dark: '#192168', players: ['mickael', 'marie', 'adam', 'milo'], court: 'parc' },
    { id: 'jay',  name: 'Les Jay',  short: 'JAY',  color: '#d9342b', color2: '#ffffff', stripe: '#1b1b1b', dark: '#1b1b1b', players: ['jeremie', 'jessica', 'edison'], court: 'ruelle' },
    { id: 'jo',   name: 'Les Jo',   short: 'JO',   color: '#1f9d4a', color2: '#ffffff', dark: '#0f5a2a', players: ['josue', 'zachary', 'emily', 'alexie', 'eliott'], court: 'plage' },
  ];
  BC.teamById = id => BC.TEAMS.find(t => t.id === id);

  // Les quatre terrains (un par famille) : le match se joue chez l'équipe de droite.
  BC.COURTS = {
    gym:    { name: 'Gymnase de l\'école', floor: '#c9924f', floor2: '#b87f3f', line: '#f3f3f3', sky: '#2b3140' },
    parc:   { name: 'Parc du quartier', floor: '#5fae4a', floor2: '#4f9a3d', line: '#f7f7f7', sky: '#79c4f2' },
    ruelle: { name: 'Ruelle de Montréal', floor: '#5f6168', floor2: '#55575e', line: '#f2e36b', sky: '#e8a75a' },
    plage:  { name: 'Plage', floor: '#e8d39a', floor2: '#dcc689', line: '#ffffff', sky: '#8fd6ff' },
  };

  // Composition d'un match : chaque équipe est complétée à six avec les membres des deux familles absentes,
  // sans jamais prêter la même personne aux deux camps (les plus grands d'abord).
  BC.squads = function (a, b) {
    const pool = BC.TEAMS.filter(t => t !== a && t !== b).flatMap(t => t.players).sort((x, y) => BC.PLAYERS[y].size - BC.PLAYERS[x].size);
    return [a, b].map(team => {
      const own = team.players.slice(0, BC.INNER + BC.OUTER), lent = [];
      while (own.length + lent.length < BC.INNER + BC.OUTER && pool.length) lent.push(pool.shift());
      return { inner: own.slice(0, BC.INNER), outer: own.slice(BC.INNER).concat(lent), lent };
    });
  };

  // Conversion des stats en valeurs physiques.
  BC.phys = function (d) {
    const s = d.stats;
    return {
      maxSpeed: 170 + 26 * s.speed,          // marche
      dashMul: 1.75,                         // course (double appui)
      throwSpeed: 560 + 60 * s.power,        // lancer normal
      dmg: 5 + 2 * s.power,                  // dégâts d'un lancer normal
      catchSkill: 0.12 + 0.09 * s.catch,     // probabilité de base pour l'ordi, fenêtre pour l'humain
      maxHp: Math.round(22 + 7 * s.hp),
      jump: 520 + 20 * s.speed,
    };
  };
})(window.BC);
