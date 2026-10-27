// Ballon chasseur — constantes, personnages, équipes, lancers spéciaux et terrains.
// Tout est dans l'espace de noms BC. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.BC = window.BC || {};
window.BC.VERSION = '2.5';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (BC) {
  'use strict';
  BC.W = 1280; BC.H = 720;              // canevas logique
  BC.STEP = 1 / 60;                     // pas de simulation
  // Terrain vu de côté, légèrement du dessus (façon Super Dodge Ball) : x = largeur, y = profondeur au sol, z = hauteur.
  BC.COURT = { left: 150, right: 1130, top: 300, bottom: 600, mid: 640 };
  BC.LANE = 46;                          // distance des couloirs extérieurs par rapport au terrain
  BC.GRAVITY = 1500;
  BC.BALL_R = 11;
  BC.DIFFICULTIES = ['Facile', 'Moyen', 'Difficile', 'Dangereux', 'Impossible'];
  BC.BOSS_HP_MULTIPLIERS=[1,1.15,1.35,1.65,2];
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

  // Pouvoirs (un par personnage). kind : 'instant' = s'active tout de suite (bouton V), 'throw' = s'arme avec V puis
  // s'applique au prochain lancer (l'icône scintille), 'passive' = se déclenche tout seul. Après usage, il faut
  // BC.CHARGE_MAX attrapés de l'équipe pour le recharger.
  BC.CHARGE_MAX = 3;
  BC.POWERS = {
    triche:   { name: 'Code de triche',      icon: '🕹️', kind: 'throw',   color: '#8f8', desc: 'La balle suit sa cible où qu\'elle aille et personne ne peut l\'attraper. Elle fait un peu moins mal… c\'est lui qui a programmé le jeu !' },
    priere: { name: 'Prière de Josée', icon: '🙏', kind: 'instant', color: '#ffe8a0', desc: 'Josée fait une prière : chaque coéquipier encore en jeu récupère 50 % de sa vie maximale, sans dépasser son maximum.' },
    biscuit:  { name: 'Biscuit chaud',       icon: '🍪', kind: 'throw',   color: '#fc8', desc: 'Si la balle touche quelqu\'un, des biscuits partent dans tous les sens et frappent toute l\'équipe adverse pour la moitié des dégâts. Impossible d\'y échapper !' },
    boulet:   { name: 'Boulet du vétéran',   icon: '💥', kind: 'throw',   color: '#aaa', desc: 'Lente, lourde, légendaire : presque impossible à attraper et ça fait très, très mal.' },
    laser:    { name: 'Lunettes laser',      icon: '👓', kind: 'instant', color: '#8ff', desc: 'Un laser traverse toute l\'équipe adverse : tout le monde est figé par l\'électricité. À lui de lancer !' },
    bulles:   { name: 'Bulles de savon',     icon: '🫧', kind: 'instant', color: '#8cf', desc: 'Une nuée de bulles traverse le terrain. Celui qui en touche une flotte dans sa bulle sans pouvoir bouger.' },
    pikachu:  { name: 'Pika-choc',           icon: '⚡', kind: 'instant', color: '#ff8', desc: 'Un éclair électrise tous les adversaires d\'un coup !' },
    zoom:     { name: 'Zoom-zoom',           icon: '🏎️', kind: 'instant', color: '#f66', desc: 'Court super vite pendant 10 secondes.' },
    teleport: { name: 'Téléportation',       icon: '✨', kind: 'throw',   color: '#fff', desc: 'Se téléporte derrière l\'équipe adverse, lance la balle dans leur dos et revient à sa place.' },
    aimant:   { name: 'Aimant à balle',      icon: '🧲', kind: 'instant', color: '#f8f', desc: 'Sort son aimant : la balle, même dans les mains de l\'adversaire, vient toute seule vers elle.' },
    tornade:  { name: 'Tornade',             icon: '🌪️', kind: 'throw',   color: '#cfc', desc: 'Tourne super vite sur lui-même et lance une balle qui rebondit 5 fois dans le camp adverse en frappant tout ce qu\'elle touche.' },
    cri:      { name: 'Cri du capitaine',    icon: '📣', kind: 'instant', color: '#f44', desc: 'Toute l\'équipe frappe 50 % plus fort pendant 30 secondes.' },
    fusee:    { name: 'Fusée',               icon: '🚀', kind: 'throw',   color: '#f80', desc: 'La balle part sur une fusée et accélère. Si on l\'attrape, elle explose ! Il faut l\'éviter.' },
    blizzard: { name: 'Blizzard',            icon: '❄️', kind: 'instant', color: '#cef', desc: 'Une tempête de neige ralentit toute l\'équipe adverse pendant 15 secondes.' },
    licorne:  { name: 'Licorne',             icon: '🦄', kind: 'throw',   color: '#f9c', desc: 'Monte sur son cheval et lance avec sa licorne : tout droit seulement, mais ultra rapide et impossible à attraper.' },
    fantome:  { name: 'Fantôme',             icon: '👻', kind: 'passive', color: '#ccf', desc: 'Pouvoir passif : quand la balle devrait le toucher, il devient transparent et ne perd rien. Se recharge avec 3 attrapés.' },
  };
  BC.SUPERS = BC.POWERS;   // ancien nom

  // Stats de 0 à 18 : 1–10 normales, 11–15 dorées, 16–18 rouges. Les effets spéciaux 11/12 sont conservés.
  BC.MAX_STAT = 18;
  BC.STAT_KEYS = ['speed', 'power', 'catch', 'hp', 'precision'];
  BC.STAT_NAMES = { speed: 'Vitesse', power: 'Lancer', catch: 'Attrapé', hp: 'Endurance', precision: 'Précision' };
  BC.PERKS = {
    precision: {},
    speed: { 11: { name: 'Turbo', desc: 'Court encore plus vite.' }, 12: { name: 'Fusée', desc: 'Saute beaucoup plus haut.' } },
    power: { 11: { name: 'Bras canon', desc: '+3 dégâts à chaque lancer.' }, 12: { name: 'Boulet', desc: 'La balle part déjà à pleine vitesse.' } },
    catch: { 11: { name: 'Mains collantes', desc: 'La fenêtre pour attraper est bien plus grande.' }, 12: { name: 'Réflexes', desc: 'Le pouvoir se recharge avec 2 attrapés au lieu de 3.' } },
    hp:    { 11: { name: 'Coriace', desc: 'Regagne 1 point de vie toutes les 4 secondes.' }, 12: { name: 'Increvable', desc: 'Survit une fois par match à un coup fatal.' } },
  };

  // Personnages : stats de 0 à 18 (speed = vitesse, power = force de lancer, catch = réflexes pour attraper, hp = endurance), taille (1 = adulte), pouvoir (BC.POWERS).
  BC.PLAYERS = {
    matthieu: { name: 'Matthieu', birth: '1990-01-15', role: 'mononcle', size: 1.0, power: 'triche',
      stats: { speed: 6, power: 6, catch: 8, hp: 6 },
      look: { skin: '#f0c8a0', hair: '#4a2f1b', hairStyle: 'short', beard: '#3d2616' } },
    josee: { bodyType:'female', name: 'Josée', birth: '1960-06-29', role: 'grandmaman', size: 0.92, power: 'priere',
      stats: { speed: 4, power: 4, catch: 10, hp: 6 },
      look: { skin: '#f3d2b4', hair: '#d8d2c8', hairStyle: 'bun', lipstick: true, earrings: true, wrinkles: true } },
    richard: { name: 'Richard', birth: '1956-03-15', role: 'grandpapa', size: 0.92, power: 'boulet',
      stats: { speed: 2, power: 10, catch: 4, hp: 10 },
      look: { skin: '#edc39c', hair: '#f2f2f2', hairStyle: 'bald', mustache: '#f2f2f2', glasses: 'reading', eyebrows: 'bushy', belly: true, wrinkles: true } },

    mickael: { name: 'Mickael', birth: '1993-01-04', role: 'papa', size: 0.98, power: 'laser',
      stats: { speed: 6, power: 8, catch: 6, hp: 8 },
      look: { skin: '#f3d2b4', hair: '#3b2614', hairStyle: 'swept', glasses: 'round', beard: '#6b4a2b', grin: true } },
    marie: { bodyType:'female', name: 'Marie', birth: '1994-01-06', role: 'maman', size: 0.92, power: 'bulles',
      stats: { speed: 8, power: 6, catch: 8, hp: 6 },
      look: { skin: '#f6d6bd', hair: '#5a3a22', hairStyle: 'long', lipstick: true } },
    adam: { name: 'Adam', birth: '2021-09-11', role: 'enfant', size: 0.6, power: 'pikachu',
      stats: { speed: 10, power: 4, catch: 6, hp: 4 },
      look: { skin: '#f6d6bd', hair: '#4a2f1b', hairStyle: 'spiky', cheeks: true } },
    milo: { name: 'Milo', birth: '2024-03-12', role: 'toutpetit', size: 0.45, power: 'zoom',
      stats: { speed: 4, power: 2, catch: 4, hp: 2 },
      look: { skin: '#f6d6bd', hair: '#6b4a2b', hairStyle: 'tuque', hat: '#ff6b6b', pacifier: true, cheeks: true } },

    jeremie: { name: 'Jérémie', birth: '1988-03-06', role: 'papa', size: 1.0, power: 'teleport',
      stats: { speed: 8, power: 8, catch: 6, hp: 8 },
      look: { skin: '#f0c8a0', hair: '#8a6a3e', hairStyle: 'quiff', beard: '#7a5a35', eyes: '#4a7fb5' } },
    jessica: { bodyType:'female', name: 'Jessica', birth: '1991-07-01', role: 'maman', size: 0.92, power: 'aimant',
      stats: { speed: 8, power: 6, catch: 10, hp: 6 },
      look: { skin: '#f6d6bd', hair: '#e5c06b', hairStyle: 'ponytail', lipstick: true, earrings: true } },
    edison: { name: 'Edison', birth: '2023-02-08', role: 'toutpetit', size: 0.5, power: 'tornade',
      stats: { speed: 8, power: 2, catch: 6, hp: 2 },
      look: { skin: '#eec49b', hair: '#2b1d12', hairStyle: 'curly', cheeks: true, pacifier: true } },

    josue: { name: 'Josué', birth: '1985-10-29', role: 'papa', size: 0.98, power: 'cri',
      stats: { speed: 6, power: 10, catch: 6, hp: 10 },
      look: { skin: '#e8b98f', hair: '#1b1b1b', hairStyle: 'buzz', beard: '#1b1b1b', squint: true, grin: true } },
    emily: { bodyType:'female', name: 'Émily', birth: '1984-12-25', role: 'maman', size: 0.94, power: 'blizzard',
      stats: { speed: 6, power: 6, catch: 8, hp: 6 },
      look: { skin: '#f6d6bd', hair: '#b5452a', hairStyle: 'long', lipstick: true, earrings: true } },
    eliott: { name: 'Eliott', birth: '2016-10-06', role: 'enfant', size: 0.78, power: 'fantome',
      stats: { speed: 8, power: 4, catch: 6, hp: 4 },
      look: { skin: '#f0c8a0', hair: '#3b2a1a', hairStyle: 'short', cheeks: true, freckles: true } },
    alexie: { bodyType:'female', name: 'Alexie', birth: '2014-11-01', role: 'enfant', size: 0.82, power: 'licorne',
      stats: { speed: 8, power: 4, catch: 8, hp: 4 },
      look: { skin: '#f6d6bd', hair: '#5a3a22', hairStyle: 'ponytail', cheeks: true, freckles: true } },
    zachary: { name: 'Zachary', birth: '2007-08-02', role: 'ado', size: 1.05, power: 'fusee',
      stats: { speed: 10, power: 8, catch: 6, hp: 8 },
      look: { skin: '#f0c8a0', hair: '#1b1b1b', hairStyle: 'fringe', tall: true, earbuds: true } },
  };
  Object.entries(BC.PLAYERS).forEach(([id, def]) => { def.id = id; def.familyPortrait = id; if (def.birth) def.age = BC.ageOf(def.birth); });

  // Équipes : les trois premiers jouent à l'intérieur du terrain, les suivants à l'extérieur (haut, bas, fond).
  // Une équipe de moins de six personnes emprunte des cousins aux familles qui ne jouent pas ce match (BC.squad).
  BC.TEAMS = [
    { id: 'matt', name: 'Les Matt', short: 'MATT', color: '#1e5bd8', color2: '#ffffff', dark: '#0f2f73', players: ['matthieu', 'josee', 'richard'], court: 'gym' },
    { id: 'bibi', name: 'Les Bibi', short: 'BIBI', color: '#f4c430', color2: '#192168', stripe: '#ffffff', dark: '#192168', players: ['mickael', 'marie', 'adam', 'milo'], court: 'parc' },
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
      if(team.boss)return {inner:team.players.slice(0,1),outer:[],lent:[]};
      const own = team.players.slice(0, BC.INNER + BC.OUTER), lent = [];
      while (own.length + lent.length < BC.INNER + BC.OUTER && pool.length) lent.push(pool.shift());
      return { inner: own.slice(0, BC.INNER), outer: own.slice(BC.INNER).concat(lent), lent };
    });
  };

  for (const d of Object.values(BC.PLAYERS)) d.stats.precision ??= 6;
  BC.aimSpread = value => 16 * Math.PI / 180 * (1 - Math.max(0, Math.min(18, value ?? 6)) / 18) ** 2;

  // Conversion des stats (0 à 18) en valeurs physiques. stats : celles du personnage, ou celles de l'aventure.
  BC.phys = function (d, stats) {
    const s = stats || d.stats;
    return {
      aimSpread: BC.aimSpread(s.precision ?? d.stats.precision),
      maxSpeed: 160 + 13 * s.speed,          // marche
      dashMul: s.speed >= 11 ? 2.05 : 1.75,  // course (double appui) ; Turbo
      throwSpeed: 540 + 32 * s.power,        // lancer normal
      dmg: 5 + s.power + (s.power >= 11 ? 3 : 0),   // dégâts d'un lancer normal ; Bras canon
      fullStart: s.power >= 12,              // Boulet : la balle part à pleine vitesse
      catchSkill: 0.12 + 0.045 * s.catch,    // probabilité de base pour l'ordi, fenêtre pour l'humain
      catchWin: s.catch >= 11 ? 1.6 : 1,     // Mains collantes
      chargeMax: s.catch >= 12 ? 2 : BC.CHARGE_MAX,   // Réflexes
      maxHp: d.boss ? d.bossHp : Math.round(22 + 3.5 * s.hp),
      regen: s.hp >= 11 || d.monster === 'troll',
      regenAmount: d.monster === 'troll' ? 3 : 1,                     // Coriace
      revive: s.hp >= 12,                    // Increvable
      jump: 520 + 10 * s.speed + (s.speed >= 12 ? 120 : 0),   // Fusée
    };
  };
  // Expérience de l'aventure : un point de stat à chaque palier, de plus en plus haut.
  BC.xpForPoint = n => 40 + 20 * n;            // coût du (n+1)-ième point
  BC.XP_KO = 20;                                // bonus quand on met K.-O.
})(window.BC);
