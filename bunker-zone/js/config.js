// ============================================================
//  config.js — Constantes, stats des unités, améliorations, difficultés
// ============================================================
window.ZC = window.ZC || {};
window.ZC.VERSION = '2.0';   // à augmenter à chaque mise en ligne (affichée sur l'écran titre)
(function (ZC) {
  'use strict';

  ZC.TILE = 32;              // 1 case SC1 = 32 px
  ZC.ZONE_TILES = 12;        // taille d'une zone en cases (modifiable dans le menu)
  ZC.ZONE_PX = ZC.TILE * ZC.ZONE_TILES;
  ZC.STEP = 1 / 60;          // pas de simulation fixe (s)

  // Couleurs des joueurs (palette StarCraft 1)
  ZC.PLAYER_COLORS = [
    { name: 'Rouge',     hex: '#f40404' },
    { name: 'Bleu',      hex: '#0c48cc' },
    { name: 'Turquoise', hex: '#2cb494' },
    { name: 'Violet',    hex: '#88409c' },
    { name: 'Orange',    hex: '#f88c14' },
    { name: 'Brun',      hex: '#703014' },
    { name: 'Blanc',     hex: '#cce0d0' },
    { name: 'Jaune',     hex: '#fcfc38' },
  ];

  ZC.AI_NAMES = ['Raynor', 'Kerrigan', 'Tassadar', 'Mengsk', 'Zeratul', 'Duran', 'Fenix', 'DuGalle', 'Stukov', 'Artanis'];

  // Multiplicateurs de dégâts SC1 : type de dégât x taille d'unité
  ZC.DAMAGE_MULT = {
    normal:     { small: 1,   medium: 1,    large: 1 },
    concussive: { small: 1,   medium: 0.5,  large: 0.25 },
    explosive:  { small: 0.5, medium: 0.75, large: 1 },
  };

  // range / sight en px (1 case = 32 px), speed en px/s, cooldown en secondes
  // spawn   = unités produites par bunker à chaque vague (mode évolution)
  // bounty  = minerais gagnés par l'adversaire qui tue l'unité
  // antiAir = peut tirer sur les unités volantes
  // Quatre races, deux niveaux chacune : l'unité de niveau 1 est produite par les bunkers, l'Évolution
  // (armes, armure et portée au niveau 3) transforme les soldats d'un bunker en unité de niveau 2.
  ZC.RACES = {
    human:  { name: 'Humains',               l1: 'marine',   l2: 'exomarine',  worker: 'workerHuman',  tower: 'towerHuman', addon: 'addonHuman',  extractor: 'Foreuse automatique', color: '#8ad88a', desc: 'Soldats à distance polyvalents, robustes une fois en exo-armure.' },
    insect: { name: 'Essaim insectoïde',     l1: 'runner',   l2: 'beast',      worker: 'workerInsect', tower: 'towerInsect', addon: 'addonInsect', extractor: 'Ventouse de chitine', color: '#ff8a6a', desc: 'Nuées rapides de coureurs au corps à corps, puis bêtes chitineuses massives.' },
    energy: { name: 'Guerriers d\'énergie',  l1: 'blade',    l2: 'archonmech', worker: 'workerEnergy', tower: 'towerEnergy', addon: 'addonEnergy', extractor: 'Prisme extracteur', color: '#7fd0ff', desc: 'Lames d\'énergie protégées par un bouclier, puis archontes mécaniques à frappes de zone.' },
    mecha:  { name: 'Mécas cybernétiques',   l1: 'scoutbot', l2: 'siegemech',  worker: 'workerMecha',  tower: 'towerMecha', addon: 'addonMecha',  extractor: 'Drille autonome', color: '#c8d4e8', desc: 'Robots éclaireurs véloces, puis mechs de siège à obus explosifs à longue portée.' },
  };
  ZC.UNITS = {
    // --- Humains
    marine:     { name: 'Soldat de reconnaissance', supply: 1,   race: 'human',  level: 1, evolvesTo: 'exomarine',  hp: 40,  shield: 0,   armor: 0, dmg: 6,  hits: 1, dtype: 'normal',    size: 'small',  range: 128, cooldown: 0.63, speed: 100, radius: 8,  sight: 224, spawn: 1, bounty: 10, antiAir: true,  bio: true, fx: 'tracer',    deathFx: 'explosion' },
    exomarine:  { name: 'Exo-marine lourd',         supply: 2,   race: 'human',  level: 2, hp: 130, shield: 0,   armor: 2, dmg: 14, hits: 1, dtype: 'normal',    size: 'medium', range: 160, cooldown: 0.7,  speed: 95,  radius: 11, sight: 256, spawn: 1, bounty: 30, antiAir: true,  bio: true, fx: 'tracer2',   deathFx: 'explosion' },
    // --- Essaim insectoïde
    runner:     { name: 'Coureur',                  supply: 0.5, race: 'insect', level: 1, evolvesTo: 'beast',      hp: 35,  shield: 0,   armor: 0, dmg: 5,  hits: 1, dtype: 'normal',    size: 'small',  range: 0,   cooldown: 0.5,  speed: 165, radius: 7,  sight: 224, spawn: 2, bounty: 5,  antiAir: false, fx: 'slash',     deathFx: 'blood' },
    beast:      { name: 'Bête chitineuse',          supply: 3,   race: 'insect', level: 2, hp: 320, shield: 0,   armor: 2, dmg: 24, hits: 1, dtype: 'normal',    size: 'large',  range: 0,   cooldown: 0.75, speed: 115, radius: 15, sight: 224, spawn: 1, bounty: 45, antiAir: false, fx: 'slash2',    deathFx: 'blood2' },
    // --- Guerriers d'énergie
    blade:      { name: 'Guerrier à lames',         supply: 1.5, race: 'energy', level: 1, evolvesTo: 'archonmech', hp: 80,  shield: 40,  armor: 1, dmg: 8,  hits: 2, dtype: 'normal',    size: 'small',  range: 0,   cooldown: 0.92, speed: 110, radius: 9,  sight: 224, spawn: 1, bounty: 18, antiAir: false, fx: 'psislash',  deathFx: 'psi' },
    archonmech: { name: 'Archonte mécanique',       supply: 3,   race: 'energy', level: 2, hp: 160, shield: 160, armor: 2, dmg: 30, hits: 1, dtype: 'normal',    size: 'large',  range: 64,  cooldown: 0.9,  speed: 100, radius: 14, sight: 256, spawn: 1, bounty: 55, antiAir: true,  splash: 32, fx: 'lightning', deathFx: 'psi2' },
    // --- Mécas cybernétiques
    scoutbot:   { name: 'Robot éclaireur',          supply: 1,   race: 'mecha',  level: 1, evolvesTo: 'siegemech',  hp: 60,  shield: 0,   armor: 1, dmg: 9,  hits: 1, dtype: 'normal',    size: 'small',  range: 128, cooldown: 0.7,  speed: 130, radius: 8,  sight: 240, spawn: 1, bounty: 12, antiAir: true,  fx: 'tracer',    deathFx: 'explosion' },
    siegemech:  { name: 'Mech de siège',            supply: 3,   race: 'mecha',  level: 2, hp: 220, shield: 0,   armor: 2, dmg: 32, hits: 1, dtype: 'explosive', size: 'large',  range: 192, cooldown: 1.4,  speed: 85,  radius: 15, sight: 288, spawn: 1, bounty: 55, antiAir: false, splash: 20, fx: 'shell',     deathFx: 'explosion' },
    // --- Structures et transport
    hq:        { name: 'Centre de commandement', supply: 0, race: 'any', hp: 6000, shield: 0, armor: 8, dmg: 0, hits: 0, dtype: 'normal', size: 'large', range: 0, cooldown: 1, speed: 0, radius: 34, sight: 0, spawn: 1, bounty: 250, antiAir: false, structure: true, hq: true, deathFx: 'bigExplosion' },
    bunker:    { name: 'Bunker',    supply: 0,   race: 'any',  hp: 3000, shield: 0,  armor: 5, dmg: 0,  hits: 0, dtype: 'normal',     size: 'large',  range: 0,   cooldown: 1,    speed: 0,   radius: 24, sight: 0,   spawn: 0, bounty: 100, antiAir: false, structure: true, deathFx: 'bigExplosion' },
    dropship:  { name: 'Dropship',  supply: 0,   race: 'any',  hp: 150, shield: 0,   armor: 1, dmg: 0,  hits: 0, dtype: 'normal',     size: 'large',  range: 0,   cooldown: 1,    speed: 68,  radius: 13, sight: 256, spawn: 0, bounty: 50,  antiAir: false, air: true, noAttack: true, deathFx: 'explosion' },
    // --- Travailleurs (produits au centre de commandement) : récoltent le minerai vert des gisements, réparent les bunkers
    workerHuman:  { name: 'Ouvrier',        supply: 1, race: 'human',  hp: 60, shield: 0,  armor: 0, dmg: 0, hits: 0, dtype: 'normal', size: 'small', range: 0, cooldown: 1, speed: 105, radius: 7, sight: 160, spawn: 0, bounty: 5, antiAir: false, worker: true, noAttack: true, bio: true, deathFx: 'explosion' },
    workerInsect: { name: 'Drone',          supply: 1, race: 'insect', hp: 50, shield: 0,  armor: 0, dmg: 0, hits: 0, dtype: 'normal', size: 'small', range: 0, cooldown: 1, speed: 120, radius: 7, sight: 160, spawn: 0, bounty: 5, antiAir: false, worker: true, noAttack: true, bio: true, deathFx: 'blood' },
    workerEnergy: { name: 'Sonde',          supply: 1, race: 'energy', hp: 30, shield: 30, armor: 0, dmg: 0, hits: 0, dtype: 'normal', size: 'small', range: 0, cooldown: 1, speed: 115, radius: 7, sight: 160, spawn: 0, bounty: 5, antiAir: false, worker: true, noAttack: true, deathFx: 'psi' },
    workerMecha:  { name: 'Foreur',         supply: 1, race: 'mecha',  hp: 70, shield: 0,  armor: 1, dmg: 0, hits: 0, dtype: 'normal', size: 'small', range: 0, cooldown: 1, speed: 100, radius: 7, sight: 160, spawn: 0, bounty: 5, antiAir: false, worker: true, noAttack: true, deathFx: 'explosion' },
    // --- Extracteur : construit par un travailleur sur un gisement (style Factorio), mine tout seul sans transport
    extractor:    { name: 'Extracteur',     supply: 0, race: 'any', hp: 600, shield: 0, armor: 2, dmg: 0, hits: 0, dtype: 'normal', size: 'large', range: 0, cooldown: 1, speed: 0, radius: 16, sight: 0, spawn: 0, bounty: 40, antiAir: false, structure: true, extractor: true, deathFx: 'explosion' },
    // --- Tours défensives, construites par un travailleur dans une zone à soi. Les humains n'ont pas de robots :
    //     leur tour de guet ne tire que si des soldats y montent (2 places, portée +2 cases). Les autres races ont des tourelles autonomes.
    towerHuman:   { name: 'Tour de guet',          supply: 0, race: 'human',  hp: 500, shield: 0,   armor: 1, dmg: 0,  hits: 0, dtype: 'normal', size: 'large', range: 0,   cooldown: 1,   speed: 0, radius: 14, sight: 0,   spawn: 0, bounty: 40, antiAir: false, structure: true, tower: true, manned: true, capacity: 2, rangeBonus: 2, deathFx: 'explosion' },
    towerInsect:  { name: 'Colonie d\'épines',     supply: 0, race: 'insect', hp: 450, shield: 0,   armor: 1, dmg: 11, hits: 1, dtype: 'normal', size: 'large', range: 192, cooldown: 1.1, speed: 0, radius: 14, sight: 224, spawn: 0, bounty: 40, antiAir: true,  structure: true, tower: true, fx: 'spine',   deathFx: 'blood2' },
    towerEnergy:  { name: 'Canon à photons',       supply: 0, race: 'energy', hp: 300, shield: 150, armor: 1, dmg: 18, hits: 1, dtype: 'normal', size: 'large', range: 224, cooldown: 1.4, speed: 0, radius: 14, sight: 256, spawn: 0, bounty: 40, antiAir: true,  structure: true, tower: true, fx: 'bolt',    deathFx: 'psi2' },
    towerMecha:   { name: 'Tourelle automatique',  supply: 0, race: 'mecha',  hp: 450, shield: 0,   armor: 2, dmg: 12, hits: 1, dtype: 'normal', size: 'large', range: 224, cooldown: 0.8, speed: 0, radius: 14, sight: 256, spawn: 0, bounty: 40, antiAir: true,  structure: true, tower: true, fx: 'tracer2', deathFx: 'explosion' },
    // --- Héros (mode aventure) : uniques, reviennent au QG après leur mort, montent de niveau
    // Annexes des centres de commandement (une par centre) : on y développe les deux pouvoirs du héros
    addonHuman:  { name: 'Laboratoire tactique',    supply: 0, race: 'human',  hp: 800, shield: 0,   armor: 2, dmg: 0, hits: 0, dtype: 'normal', size: 'large', range: 0, cooldown: 1, speed: 0, radius: 14, sight: 0, spawn: 0, bounty: 60, antiAir: false, structure: true, addon: true, capacity: 0, deathFx: 'explosion' },
    addonInsect: { name: 'Chambre d\'évolution',    supply: 0, race: 'insect', hp: 800, shield: 0,   armor: 2, dmg: 0, hits: 0, dtype: 'normal', size: 'large', range: 0, cooldown: 1, speed: 0, radius: 14, sight: 0, spawn: 0, bounty: 60, antiAir: false, structure: true, addon: true, capacity: 0, deathFx: 'blood2' },
    addonEnergy: { name: 'Sanctuaire des archives', supply: 0, race: 'energy', hp: 500, shield: 300, armor: 2, dmg: 0, hits: 0, dtype: 'normal', size: 'large', range: 0, cooldown: 1, speed: 0, radius: 14, sight: 0, spawn: 0, bounty: 60, antiAir: false, structure: true, addon: true, capacity: 0, deathFx: 'psi2' },
    addonMecha:  { name: 'Atelier de recherche',    supply: 0, race: 'mecha',  hp: 800, shield: 0,   armor: 3, dmg: 0, hits: 0, dtype: 'normal', size: 'large', range: 0, cooldown: 1, speed: 0, radius: 14, sight: 0, spawn: 0, bounty: 60, antiAir: false, structure: true, addon: true, capacity: 0, deathFx: 'explosion' },
    // Héros : trois par race (voir ZC.HEROES), sprite de leur unité de base
    heroKael:  { name: 'Sergent Kael',     supply: 0, race: 'human',  hp: 220, shield: 0,   armor: 2, dmg: 16, hits: 1, dtype: 'normal',    size: 'medium', range: 176, cooldown: 0.55, speed: 110, radius: 11, sight: 288, spawn: 0, bounty: 60, antiAir: true,  bio: true, hero: true, base: 'exomarine',  fx: 'tracer2',   deathFx: 'explosion' },
    heroVoss:  { name: 'Lieutenante Voss', supply: 0, race: 'energy', hp: 200, shield: 120, armor: 2, dmg: 26, hits: 1, dtype: 'normal',    size: 'large',  range: 72,  cooldown: 0.8,  speed: 105, radius: 13, sight: 256, spawn: 0, bounty: 60, antiAir: true,  hero: true, base: 'archonmech', splash: 36, fx: 'lightning', deathFx: 'psi2' },
    heroDax:   { name: 'Commandant Dax',   supply: 0, race: 'mecha',  hp: 360, shield: 0,   armor: 3, dmg: 44, hits: 1, dtype: 'explosive', size: 'large',  range: 224, cooldown: 1.5,  speed: 80,  radius: 15, sight: 320, spawn: 0, bounty: 80, antiAir: false, hero: true, base: 'siegemech', splash: 24, fx: 'shell',     deathFx: 'explosion' },
    heroSato:  { name: 'Médecin Sato',     supply: 0, race: 'human',  hp: 190, shield: 0,   armor: 1, dmg: 9,  hits: 1, dtype: 'normal',    size: 'small',  range: 128, cooldown: 0.5,  speed: 115, radius: 9,  sight: 256, spawn: 0, bounty: 60, antiAir: true,  bio: true, hero: true, base: 'marine',     fx: 'tracer',    deathFx: 'explosion' },
    heroBrax:  { name: 'Lieutenant Brax',  supply: 0, race: 'human',  hp: 300, shield: 0,   armor: 3, dmg: 20, hits: 1, dtype: 'explosive', size: 'medium', range: 144, cooldown: 0.8,  speed: 95,  radius: 11, sight: 288, spawn: 0, bounty: 70, antiAir: true,  bio: true, hero: true, base: 'exomarine',  fx: 'tracer2',   deathFx: 'explosion' },
    heroVhyss: { name: 'Reine Vhyss',      supply: 0, race: 'insect', hp: 420, shield: 0,   armor: 2, dmg: 26, hits: 1, dtype: 'normal',    size: 'large',  range: 0,   cooldown: 0.7,  speed: 115, radius: 15, sight: 256, spawn: 0, bounty: 70, antiAir: false, bio: true, hero: true, base: 'beast',      fx: 'slash2',    deathFx: 'blood2' },
    heroNex:   { name: 'Traqueur Nex',     supply: 0, race: 'insect', hp: 170, shield: 0,   armor: 1, dmg: 12, hits: 2, dtype: 'normal',    size: 'small',  range: 0,   cooldown: 0.45, speed: 185, radius: 8,  sight: 256, spawn: 0, bounty: 60, antiAir: false, bio: true, hero: true, base: 'runner',     fx: 'slash',     deathFx: 'blood' },
    heroKurg:  { name: 'Broyeur Kurg',     supply: 0, race: 'insect', hp: 540, shield: 0,   armor: 4, dmg: 34, hits: 1, dtype: 'normal',    size: 'large',  range: 0,   cooldown: 0.9,  speed: 100, radius: 15, sight: 240, spawn: 0, bounty: 80, antiAir: false, bio: true, hero: true, base: 'beast',      fx: 'slash2',    deathFx: 'blood2' },
    heroZar:   { name: 'Templier Zar',     supply: 0, race: 'energy', hp: 170, shield: 130, armor: 1, dmg: 14, hits: 2, dtype: 'normal',    size: 'small',  range: 0,   cooldown: 0.8,  speed: 120, radius: 9,  sight: 256, spawn: 0, bounty: 60, antiAir: false, hero: true, base: 'blade',      fx: 'psislash',  deathFx: 'psi' },
    heroLyra:  { name: 'Oracle Lyra',      supply: 0, race: 'energy', hp: 160, shield: 170, armor: 1, dmg: 18, hits: 1, dtype: 'normal',    size: 'large',  range: 96,  cooldown: 1.0,  speed: 100, radius: 13, sight: 288, spawn: 0, bounty: 70, antiAir: true,  hero: true, base: 'archonmech', splash: 24, fx: 'lightning', deathFx: 'psi2' },
    heroK7:    { name: 'Unité K-7',        supply: 0, race: 'mecha',  hp: 210, shield: 0,   armor: 2, dmg: 14, hits: 1, dtype: 'normal',    size: 'small',  range: 144, cooldown: 0.5,  speed: 150, radius: 8,  sight: 272, spawn: 0, bounty: 60, antiAir: true,  hero: true, base: 'scoutbot',   fx: 'tracer',    deathFx: 'explosion' },
    heroVoxx:  { name: 'Ingénieure Voxx',  supply: 0, race: 'mecha',  hp: 250, shield: 0,   armor: 2, dmg: 11, hits: 1, dtype: 'normal',    size: 'small',  range: 128, cooldown: 0.6,  speed: 120, radius: 8,  sight: 256, spawn: 0, bounty: 60, antiAir: true,  hero: true, base: 'scoutbot',   fx: 'tracer',    deathFx: 'explosion' },
  };
  for (const key in ZC.UNITS) {
    const d = ZC.UNITS[key];
    d.key = key;
    d.splash = d.splash || 0;
    d.dps = d.cooldown > 0 ? d.dmg * d.hits / d.cooldown : 0;
    // Force "Lanchester" : sqrt(vie x dps) — utilisée par l'IA pour comparer des armées
    d.strength = d.structure || d.noAttack ? 0 : Math.sqrt((d.hp + d.shield) * d.dps);
  }

  // Mode évolution : type d'unité produit à chaque round (le dernier round dure indéfiniment)
  ZC.ROUNDS = ['marine', 'runner', 'blade', 'scoutbot', 'exomarine', 'beast', 'archonmech', 'siegemech'];

  // Améliorations achetées avec les minerais (coût croissant par niveau)
  // Les améliorations sont propres à chaque bunker et ne concernent que les unités qu'il produit
  ZC.UPGRADES = {
    weapons: { name: 'Armes',     hotkey: 'W', max: 3, cost: (lvl) => 100 + lvl * 75,  time: (lvl) => 30 + lvl * 15, desc: '+1 dégâts par niveau' },
    armor:   { name: 'Armure',    hotkey: 'R', max: 3, cost: (lvl) => 100 + lvl * 75,  time: (lvl) => 30 + lvl * 15, desc: '+1 armure par niveau' },
    range:   { name: 'Portée',    hotkey: 'E', max: 3, cost: (lvl) => 125 + lvl * 75,  time: (lvl) => 35 + lvl * 15, desc: '+1 case de portée (unités à distance), +0,5 au corps à corps' },
    siege:   { name: 'Démolition', hotkey: 'X', max: 3, cost: (lvl) => 125 + lvl * 75, time: (lvl) => 35 + lvl * 15, desc: '+25 % de dégâts contre les bâtiments (bunkers, centres, tours, extracteurs) par niveau' },
    evolve:  { name: 'Évolution', hotkey: 'V', max: 1, cost: () => 350,                time: () => 60,              desc: 'Transforme les soldats de ce bunker (présents et futurs) en unité de niveau 2. Requiert armes, armure et portée au niveau 3', requires: 3 },
    fortify: { name: 'Centre de commandement', hotkey: 'Q', max: 1, cost: (lvl, n) => 800 + 400 * (n || 0), time: () => 75, desc: 'Transforme ce bunker en centre de commandement : 6 places en garnison, 6000 PV, armure 8, et il produit dropships, travailleurs et héros comme votre QG. Le premier coûte 800 minerais, puis 400 de plus à chaque centre' },
  };
  ZC.RESEARCH_QUEUE_MAX = 3;  // recherches en attente par bunker
  ZC.MISSION_DEFAULTS = { startUnits: 8, startWorkers: 2 }; // départ des missions de l'aventure (leur équilibrage date d'avant le départ à 0 soldat)
  ZC.SIEGE_BONUS = 0.25;      // bonus de dégâts contre les bâtiments par niveau de démolition
  ZC.BUNKER_CAPACITY = 4;     // unités en garnison par bunker ; un bunker vide ne tire pas
  ZC.HQ_CAPACITY = 6;         // le centre de commandement en accueille six
  ZC.capacity = (b) => !b || !b.def ? ZC.BUNKER_CAPACITY : b.def.hq ? ZC.HQ_CAPACITY : b.def.capacity !== undefined ? b.def.capacity : b.def.extractor ? 0 : ZC.BUNKER_CAPACITY;
  ZC.TOWER = { cost: 75, buildTime: 15, perZone: 3 };     // tours : coût, secondes de construction par un travailleur, maximum par zone
  ZC.SPEEDS = [1, 2, 3, 5];   // vitesses de lecture disponibles en partie (bouton du HUD, touches + / -)
  // Économie : gisements de minerai vert (style StarCraft) récoltés par les travailleurs
  ZC.MINERALS = {
    patch: 1500,        // minerai par gisement (x2 sur la zone centrale)
    crystals: 5,        // cristaux par gisement = travailleurs pouvant récolter en même temps
    carry: 5,           // minerai rapporté par voyage
    mineTime: 5,        // secondes de récolte par voyage (environ 45 minerais par minute et par travailleur)
    color: '#39ff14',   // vert fluo
  };
  ZC.WORKER = { cost: 50, time: 15, perBunker: 5, max: 20 }; // travailleurs : coût, temps de production au QG, maximum par bunker possédé (QG compris) et maximum absolu par joueur
  ZC.REPAIR = { hpPerSec: 40, costPerSec: 3 };
  ZC.EXTRACTOR = { cost: 100, buildTime: 20, rate: 1.2 };  // extracteur : coût, secondes de construction par un travailleur, minerai extrait par seconde (≈ 1,6 travailleur)          // réparation d'un bunker par un travailleur : PV par seconde, minerai par seconde
  ZC.BUNKER_RANGE_BONUS = 1;  // cases de portée en plus pour les unités en garnison
  ZC.BUNKER_REGEN = 2;       // PV récupérés par seconde par un bunker
  ZC.STIM = { duration: 10, hpCost: 10, speedMult: 1.5, cooldownMult: 0.667 };

  // Difficultés de l'IA
  //  think  : délai (s) entre deux réflexions
  //  margin : rapport de force exigé avant d'attaquer
  //  dumb   : probabilité d'une attaque imprudente
  //  rally  : regroupement des unités intérieures ('none' | 'nearest' | 'staging')
  //  truce  : secondes pendant lesquelles l'IA ne vise que les zones neutres
  //  maxOps : nombre maximal d'attaques lancées par réflexion
  //  spend  : probabilité d'acheter une amélioration quand c'est possible
  ZC.DIFFICULTY = {
    easy:   { label: 'Facile',    think: 2.0, margin: 1.7,  dumb: 0.3,  rally: 'none',    truce: 120, maxOps: 1, spend: 0.3 },
    normal: { label: 'Normal',    think: 1.2, margin: 1.25, dumb: 0.1,  rally: 'nearest', truce: 60,  maxOps: 2, spend: 0.7 },
    hard:   { label: 'Difficile', think: 0.6, margin: 1.0,  dumb: 0,    rally: 'staging', truce: 0,   maxOps: 3, spend: 1.0 },
  };

  ZC.TILESETS = ['jungle', 'badlands', 'space'];

  ZC.DEFAULTS = {
    mode: 'classic',      // 'classic' : marines + améliorations | 'evolution' : l'unité change avec le temps | 'rounds' : tournoi, un round par unité
    roundsToWin: 3,       // mode tournoi : rounds à remporter pour gagner la partie
    roundTimeLimit: 300,  // mode tournoi : secondes avant que le round soit attribué au joueur qui tient le plus de zones (0 = élimination seulement)
    aiCount: 3,
    difficulty: 'normal',
    mapZones: 7,          // largeur de la grille (zones)
    mapZonesY: 0,         // hauteur de la grille (0 = carrée). Ex. 1 pour un couloir 5x1
    playerRace: 'human',  // race du joueur humain ; les IA tirent la leur au hasard (ou aiRace)
    aiRace: null,         // race imposée aux IA (missions)
    teams: null,          // équipes : tableau d'identifiants par joueur (ex. [0, 0, 1, 1] pour un 2v2), null = chacun pour soi
    humanStart: 'corner', // 'center' : le joueur démarre sur la zone centrale
    extraZones: 0,        // zones supplémentaires (avec bunker et troupes) données au joueur au départ
    zoneTiles: 12,        // taille d'une zone en cases
    spawnInterval: 8,     // secondes entre deux vagues
    roundDuration: 100,   // secondes par round (mode évolution)
    landingTime: 6.0,     // secondes pour qu'un dropship construise un bunker (prise d'une zone)
    dropshipCost: 150,    // coût de base d'un dropship
    dropshipCostPerBunker: 30, // surcoût par bunker possédé
    dropshipBuildTime: 12,     // secondes de construction du premier dropship
    dropshipBuildGrowth: 0.4,  // +40 % de temps par dropship déjà commandé
    dropshipQueueMax: 5,       // file d'attente maximale par bunker
    startMinerals: 50,
    incomePerBunker: 3,   // minerais par bunker à chaque vague
    unitCap: 0,           // supply max absolue par joueur ; 0 = aucune limite : le plafond monte avec chaque bunker
    supplyBase: 30,       // supply de départ ; chaque bunker (QG compris) en ajoute supplyPerBunker (borné par unitCap s'il est > 0)
    supplyPerBunker: 20,
    startUnits: 0,        // soldats de départ (aucun : les vagues des bunkers font l'armée)
    startWorkers: 5,      // travailleurs de départ (récoltent le gisement du QG)
    hero: 'random',       // héros du joueur : 'random' (un des trois de sa race), 'none', ou l'identifiant d'un héros (voir ZC.HEROES)
    mineralZones: 0.4,    // part des zones (hors zones de départ, qui en ont toujours un) qui reçoivent un gisement de minerai
    superZoneMult: 2,     // la zone centrale produit x2
    selectionLimit: 0,    // 0 = illimité, 12 = comme SC1
    playerColor: 0,
    tileset: 'jungle',
    gameSpeed: 1.0,
    sound: true,
    music: true,          // musique de fond en partie (pistes de assets/)
    edgeScroll: true,
    humanPlayer: true,
    invasion: null,       // vagues d'envahisseurs sans base : { min, max, scale, name } (missions de survie) ; les vagues arrivent par les bords toutes les min..max s
    admin: false,         // mode admin (triche) pour le joueur humain : achats gratuits et instantanés, touches Alt+M/H/U/S/K
  };
  // ------------------------------------------------------------ Héros : trois par race, deux pouvoirs uniques chacun
  // Les pouvoirs se développent dans l'annexe d'un centre de commandement (A sur le centre), puis se lancent avec le héros (T, Y).
  ZC.HEROES = {
    kael:  { id: 'kael',  race: 'human',  unit: 'heroKael',  name: 'Sergent Kael',     title: 'Le Vétéran',    powers: ['stim', 'gas'],            desc: 'Exo-marine d\'élite au fusil gauss lourd. Se stimule et enfume les bunkers ennemis.' },
    sato:  { id: 'sato',  race: 'human',  unit: 'heroSato',  name: 'Médecin Sato',     title: 'La Toubib',     powers: ['heal', 'shieldwall'],     desc: 'Médecin de combat : soigne les troupes autour d\'elle et déploie un bouclier qui les blinde.' },
    brax:  { id: 'brax',  race: 'human',  unit: 'heroBrax',  name: 'Lieutenant Brax',  title: 'L\'Artilleur',  powers: ['barrage', 'charge'],      desc: 'Exo-marine lourd : appelle un barrage d\'artillerie et charge dans la mêlée.' },
    vhyss: { id: 'vhyss', race: 'insect', unit: 'heroVhyss', name: 'Reine Vhyss',      title: 'La Couveuse',   powers: ['swarm', 'roar'],          desc: 'Bête-reine : pond une nuée de coureurs et terrorise l\'ennemi d\'un rugissement.' },
    nex:   { id: 'nex',   race: 'insect', unit: 'heroNex',   name: 'Traqueur Nex',     title: 'Le Bondissant', powers: ['leap', 'venom'],          desc: 'Coureur alpha ultra-rapide : bondit sur sa proie et crache un venin qui ronge.' },
    kurg:  { id: 'kurg',  race: 'insect', unit: 'heroKurg',  name: 'Broyeur Kurg',     title: 'Le Colosse',    powers: ['carapace', 'quake'],      desc: 'Bête colossale : durcit sa carapace et fait trembler le sol pour assommer tout autour.' },
    voss:  { id: 'voss',  race: 'energy', unit: 'heroVoss',  name: 'Lieutenante Voss', title: 'L\'Archonte',   powers: ['nova', 'aegis'],          desc: 'Archonte mécanique : nova psionique dévastatrice et égide qui recharge les boucliers alliés.' },
    zar:   { id: 'zar',   race: 'energy', unit: 'heroZar',   name: 'Templier Zar',     title: 'La Lame',       powers: ['lightblades', 'blink'],   desc: 'Guerrier à lames : double ses dégâts et se téléporte au cœur du combat.' },
    lyra:  { id: 'lyra',  race: 'energy', unit: 'heroLyra',  name: 'Oracle Lyra',      title: 'La Voyante',    powers: ['stasis', 'regen'],        desc: 'Archonte de soutien : fige l\'ennemi dans une stase et régénère ses alliés.' },
    dax:   { id: 'dax',   race: 'mecha',  unit: 'heroDax',   name: 'Commandant Dax',   title: 'Le Blindé',     powers: ['siegemode', 'piercing'],  desc: 'Mech de siège : se déploie en mode siège et perce les bâtiments d\'un obus.' },
    k7:    { id: 'k7',    race: 'mecha',  unit: 'heroK7',    name: 'Unité K-7',        title: 'Le Prototype',  powers: ['overclock', 'emp'],       desc: 'Robot éclaireur prototype : se surcadence et émet une impulsion qui grille boucliers et circuits.' },
    voxx:  { id: 'voxx',  race: 'mecha',  unit: 'heroVoxx',  name: 'Ingénieure Voxx',  title: 'La Mécano',     powers: ['repairfield', 'turret'],  desc: 'Ingénieure de combat : répare bâtiments et machines, déploie une tourelle temporaire.' },
  };
  ZC.heroesOf = (race) => Object.values(ZC.HEROES).filter(h => h.race === race);
  // Pouvoirs : coût et durée de développement (dans l'annexe), temps de recharge, cible
  //  target : 'self' (immédiat), 'point' (clic sur le sol, à portée range), 'structure' (clic sur un bâtiment ennemi)
  ZC.POWERS = {
    stim:        { name: 'Stimpack',             hero: 'kael',  key: 'T', icon: 'stim',    cost: 150, time: 40, cd: 20, target: 'self',                  desc: '+50 % de vitesse et de cadence pendant 10 s, coûte 10 PV' },
    gas:         { name: 'Grenade lacrymogène',  hero: 'kael',  key: 'Y', icon: 'gas',     cost: 250, time: 60, cd: 30, target: 'structure', range: 160, desc: 'Fait sortir la garnison d\'un bunker ou d\'une tour ennemie ; personne n\'y rentre pendant 10 s' },
    heal:        { name: 'Soins de combat',      hero: 'sato',  key: 'T', icon: 'heal',    cost: 150, time: 40, cd: 18, target: 'self',                  desc: 'Soigne de 80 PV les alliés dans un rayon de 3 cases' },
    shieldwall:  { name: 'Bouclier déployable',  hero: 'sato',  key: 'Y', icon: 'shield',  cost: 250, time: 60, cd: 30, target: 'self',                  desc: 'Les alliés autour gagnent +4 d\'armure pendant 8 s' },
    barrage:     { name: 'Barrage d\'artillerie', hero: 'brax', key: 'T', icon: 'blast',   cost: 200, time: 50, cd: 25, target: 'point', range: 224,     desc: 'Trois obus explosifs tombent sur le point visé après une seconde (35 dégâts de zone chacun)' },
    charge:      { name: 'Charge',               hero: 'brax',  key: 'Y', icon: 'dash',    cost: 150, time: 40, cd: 15, target: 'point', range: 160,     desc: 'Fonce jusqu\'au point visé : 25 dégâts et 1 s d\'étourdissement aux ennemis à l\'arrivée' },
    swarm:       { name: 'Essaim',               hero: 'vhyss', key: 'T', icon: 'swarm',   cost: 200, time: 50, cd: 30, target: 'self',                  desc: 'Pond 4 coureurs qui combattent 15 s' },
    roar:        { name: 'Rugissement',          hero: 'vhyss', key: 'Y', icon: 'roar',    cost: 150, time: 40, cd: 20, target: 'self',                  desc: 'Les ennemis autour font moitié moins de dégâts et ralentissent pendant 6 s' },
    leap:        { name: 'Bond',                 hero: 'nex',   key: 'T', icon: 'dash',    cost: 150, time: 40, cd: 12, target: 'point', range: 192,     desc: 'Bondit sur le point visé : 30 dégâts aux ennemis à l\'arrivée' },
    venom:       { name: 'Venin',                hero: 'nex',   key: 'Y', icon: 'poison',  cost: 200, time: 50, cd: 20, target: 'self',                  desc: 'Les ennemis autour perdent 6 PV par seconde pendant 8 s, armure ignorée' },
    carapace:    { name: 'Carapace',             hero: 'kurg',  key: 'T', icon: 'shield',  cost: 150, time: 40, cd: 20, target: 'self',                  desc: '+5 d\'armure pendant 8 s' },
    quake:       { name: 'Séisme',               hero: 'kurg',  key: 'Y', icon: 'stun',    cost: 250, time: 60, cd: 25, target: 'self',                  desc: 'Assomme 3 s les ennemis au sol autour (et 15 dégâts)' },
    nova:        { name: 'Nova psionique',       hero: 'voss',  key: 'T', icon: 'nova',    cost: 200, time: 50, cd: 20, target: 'point', range: 160,     desc: '60 dégâts à tous les ennemis dans 2 cases autour du point visé' },
    aegis:       { name: 'Égide',                hero: 'voss',  key: 'Y', icon: 'shield',  cost: 200, time: 50, cd: 25, target: 'self',                  desc: 'Recharge les boucliers des alliés autour et leur donne +2 d\'armure pendant 6 s' },
    lightblades: { name: 'Lames de lumière',     hero: 'zar',   key: 'T', icon: 'blades',  cost: 200, time: 50, cd: 22, target: 'self',                  desc: 'Dégâts doublés pendant 8 s' },
    blink:       { name: 'Transfert',            hero: 'zar',   key: 'Y', icon: 'blink',   cost: 150, time: 40, cd: 12, target: 'point', range: 224,     desc: 'Se téléporte au point visé' },
    stasis:      { name: 'Stase',                hero: 'lyra',  key: 'T', icon: 'slow',    cost: 200, time: 50, cd: 22, target: 'point', range: 160,     desc: 'Les ennemis dans 2,5 cases du point sont ralentis de 60 % et tirent 60 % moins vite pendant 6 s' },
    regen:       { name: 'Régénération',         hero: 'lyra',  key: 'Y', icon: 'heal',    cost: 150, time: 40, cd: 18, target: 'self',                  desc: 'Soigne de 70 PV et recharge les boucliers des alliés autour' },
    siegemode:   { name: 'Mode siège',           hero: 'dax',   key: 'T', icon: 'siege',   cost: 200, time: 50, cd: 25, target: 'self',                  desc: 'Immobile 10 s : +3 cases de portée et dégâts x1,5' },
    piercing:    { name: 'Obus perforant',       hero: 'dax',   key: 'Y', icon: 'blast',   cost: 250, time: 60, cd: 20, target: 'structure', range: 224, desc: '400 dégâts à un bâtiment ennemi' },
    overclock:   { name: 'Surcadence',           hero: 'k7',    key: 'T', icon: 'gear',    cost: 150, time: 40, cd: 20, target: 'self',                  desc: 'Cadence de tir doublée pendant 8 s' },
    emp:         { name: 'Impulsion EM',         hero: 'k7',    key: 'Y', icon: 'emp',     cost: 250, time: 60, cd: 25, target: 'self',                  desc: 'Vide les boucliers et assomme 2 s les ennemis autour' },
    repairfield: { name: 'Réparation d\'urgence', hero: 'voxx', key: 'T', icon: 'wrench',  cost: 150, time: 40, cd: 25, target: 'self',                  desc: 'Répare de 600 PV les bâtiments alliés proches et de 60 PV les machines' },
    turret:      { name: 'Tourelle déployable',  hero: 'voxx',  key: 'Y', icon: 'tower',   cost: 250, time: 60, cd: 35, target: 'self',                  desc: 'Déploie une tourelle automatique qui tient 25 s' },
  };
  ZC.ADDON = { cost: 150, buildTime: 20 }; // annexe : coût et durée de construction (chantier)
  ZC.GAS_DURATION = 10;
  // Niveaux des héros : expérience par kill (prime de l'unité), vie et dégâts +8 % par niveau, armure +1 tous les 3 niveaux
  ZC.HERO_MAX_LEVEL = 10;
  ZC.HERO_RESPAWN = 20;                                 // secondes pour ressusciter le héros au centre de commandement
  ZC.heroReviveCost = (lvl) => 100 + 25 * lvl;           // coût de la résurrection selon le niveau
  ZC.heroXpFor = (lvl) => 50 * lvl * (lvl + 1);
  ZC.heroLevel = (xp) => { let l = 0; while (l < ZC.HERO_MAX_LEVEL && xp >= ZC.heroXpFor(l + 1)) l++; return l; };
  ZC.heroScale = (lvl) => ({ hp: 1 + 0.08 * lvl, dmg: 1 + 0.08 * lvl, armor: Math.floor(lvl / 3) });                     // secondes pendant lesquelles un bâtiment enfumé n'accueille personne
  ZC.MISSION_DEFAULTS.hero = 'random';
})(window.ZC);
