// ============================================================
//  config.js — Constantes, stats des unités, améliorations, difficultés
// ============================================================
window.ZC = window.ZC || {};
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
    human:  { name: 'Humains',               l1: 'marine',   l2: 'exomarine',  worker: 'workerHuman',  extractor: 'Foreuse automatique', color: '#8ad88a', desc: 'Soldats à distance polyvalents, robustes une fois en exo-armure.' },
    insect: { name: 'Essaim insectoïde',     l1: 'runner',   l2: 'beast',      worker: 'workerInsect', extractor: 'Ventouse de chitine', color: '#ff8a6a', desc: 'Nuées rapides de coureurs au corps à corps, puis bêtes chitineuses massives.' },
    energy: { name: 'Guerriers d\'énergie',  l1: 'blade',    l2: 'archonmech', worker: 'workerEnergy', extractor: 'Prisme extracteur', color: '#7fd0ff', desc: 'Lames d\'énergie protégées par un bouclier, puis archontes mécaniques à frappes de zone.' },
    mecha:  { name: 'Mécas cybernétiques',   l1: 'scoutbot', l2: 'siegemech',  worker: 'workerMecha',  extractor: 'Drille autonome', color: '#c8d4e8', desc: 'Robots éclaireurs véloces, puis mechs de siège à obus explosifs à longue portée.' },
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
    // --- Héros (mode aventure) : uniques, reviennent au QG après leur mort, montent de niveau
    heroKael:  { name: 'Sergent Kael',     supply: 0, race: 'human',  hp: 220, shield: 0,   armor: 2, dmg: 16, hits: 1, dtype: 'normal',    size: 'medium', range: 176, cooldown: 0.55, speed: 110, radius: 11, sight: 288, spawn: 0, bounty: 60, antiAir: true,  bio: true, hero: true, base: 'exomarine',  fx: 'tracer2',   deathFx: 'explosion' },
    heroVoss:  { name: 'Lieutenante Voss', supply: 0, race: 'energy', hp: 200, shield: 120, armor: 2, dmg: 26, hits: 1, dtype: 'normal',    size: 'large',  range: 72,  cooldown: 0.8,  speed: 105, radius: 13, sight: 256, spawn: 0, bounty: 60, antiAir: true,  hero: true, base: 'archonmech', splash: 36, fx: 'lightning', deathFx: 'psi2' },
    heroDax:   { name: 'Commandant Dax',   supply: 0, race: 'mecha',  hp: 360, shield: 0,   armor: 3, dmg: 44, hits: 1, dtype: 'explosive', size: 'large',  range: 224, cooldown: 1.5,  speed: 80,  radius: 15, sight: 320, spawn: 0, bounty: 80, antiAir: false, hero: true, base: 'siegemech', splash: 24, fx: 'shell',     deathFx: 'explosion' },
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
    stim:    { name: 'Stimpack',  hotkey: 'T', max: 1, cost: () => 200,                time: () => 45,              desc: 'Recherche : les unités biologiques peuvent se stimuler (T)' },
    evolve:  { name: 'Évolution', hotkey: 'V', max: 1, cost: () => 350,                time: () => 60,              desc: 'Transforme les soldats de ce bunker (présents et futurs) en unité de niveau 2. Requiert armes, armure et portée au niveau 3', requires: 3 },
  };
  ZC.RESEARCH_QUEUE_MAX = 3;  // recherches en attente par bunker
  ZC.BUNKER_CAPACITY = 4;     // unités en garnison par bunker ; un bunker vide ne tire pas
  ZC.SPEEDS = [1, 2, 3, 5];   // vitesses de lecture disponibles en partie (bouton du HUD, touches + / -)
  // Économie : gisements de minerai vert (style StarCraft) récoltés par les travailleurs
  ZC.MINERALS = {
    patch: 1500,        // minerai par gisement (x2 sur la zone centrale)
    crystals: 5,        // cristaux par gisement = travailleurs pouvant récolter en même temps
    carry: 5,           // minerai rapporté par voyage
    mineTime: 5,        // secondes de récolte par voyage (environ 45 minerais par minute et par travailleur)
    color: '#39ff14',   // vert fluo
  };
  ZC.WORKER = { cost: 50, time: 15, max: 16 };          // travailleurs : coût, temps de production au QG, maximum par joueur
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
    landingTime: 3.0,     // secondes pour qu'un dropship construise un bunker
    dropshipCost: 150,    // coût de base d'un dropship
    dropshipCostPerBunker: 30, // surcoût par bunker possédé
    dropshipBuildTime: 12,     // secondes de construction du premier dropship
    dropshipBuildGrowth: 0.4,  // +40 % de temps par dropship déjà commandé
    dropshipQueueMax: 5,       // file d'attente maximale par bunker
    startMinerals: 50,
    incomePerBunker: 3,   // minerais par bunker à chaque vague
    unitCap: 100,         // supply max par joueur
    startUnits: 8,        // marines de départ
    startWorkers: 2,      // travailleurs de départ (récoltent le gisement du QG)
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
})(window.ZC);
