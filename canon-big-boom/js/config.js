// Canon Big Boom — constantes, famille, mondes, ennemis, canons, boutique, cartes.
// Tout vit dans l'espace de noms CB. Fonctionne dans le navigateur et dans Node (tools/test-*.cjs).
window.CB = window.CB || {};
window.CB.VERSION = '1.3';   // à augmenter à chaque mise en ligne (affichée dans le menu)
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
    { id: 'richard', name: 'Richard', family: 'matt', role: 'grandpapa', birth: '1956-03-15', perk: { name: 'Boulet du vétéran', icon: '💥', desc: '+12 % de dégâts et des boulets deux fois plus gros dès le départ.', mods: { damage: .12, size: 1 } } },
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
  // Musique de fond (assets/music/*.mp3, Kevin MacLeod, CC BY 4.0, voir assets/music/LICENSE.txt) : une piste par contexte.
  // Chaque contexte a une liste de lecture : les morceaux s'enchaînent (fondu) sans se répéter avant la fin de la liste,
  // pour qu'une partie de dix minutes n'entende pas la même boucle. Le premier morceau est le thème du contexte.
  CB.MUSIC = {
    menu: ['monkeys-spinning-monkeys', 'pixelland', 'fluffing-a-duck'],
    foret: ['ghost-dance', 'investigations', 'mechanolith', 'night-of-chaos'],
    manoir: ['investigations', 'night-of-chaos', 'ghost-dance', 'mechanolith'],
    foire: ['carefree', 'pamgaea', 'electrodoodle', 'arcadia'],
    ruche: ['run-amok', 'bit-quest', 'arcadia', 'electrodoodle'],
    volcan: ['volatile-reaction', 'rhinoceros', 'killers', 'movement-proposition'],
    espace: ['space-jazz', 'wallpaper', 'movement-proposition', 'pixelland'],
    prehistoire: ['adventure-meme', 'bit-quest', 'run-amok', 'pamgaea'],
    boss: ['exhilarate', 'volatile-reaction', 'night-of-chaos', 'killers'],
    mer: ['pamgaea', 'adventure-meme', 'carefree', 'arcadia'],
    pirates: ['pamgaea', 'adventure-meme', 'run-amok', 'arcadia'],
  };
  CB.MUSIC_NAMES = { 'monkeys-spinning-monkeys': 'Monkeys Spinning Monkeys', pixelland: 'Pixelland', 'fluffing-a-duck': 'Fluffing a Duck', exhilarate: 'Exhilarate', 'ghost-dance': 'Ghost Dance', investigations: 'Investigations', mechanolith: 'Mechanolith', 'night-of-chaos': 'Night of Chaos', carefree: 'Carefree', pamgaea: 'Pamgaea', electrodoodle: 'Electrodoodle', arcadia: 'Arcadia', 'run-amok': 'Run Amok', 'bit-quest': 'Bit Quest', 'volatile-reaction': 'Volatile Reaction', rhinoceros: 'Rhinoceros', killers: 'Killers', 'movement-proposition': 'Movement Proposition', 'space-jazz': 'Space Jazz', wallpaper: 'Wallpaper', 'adventure-meme': 'Adventure Meme' };
  // Attaque spéciale de chaque personnage (même nom que son talent) : la jauge se remplit en abattant `kills` monstres,
  // puis Maj / X / bouton ✨ la déclenche. La logique est dans Wave.useSpecial (js/game.js).
  CB.SPECIALS = {
    matthieu: { kills: 40, desc: 'Un claquement de doigts : TOUS les monstres à l’écran disparaissent dans un flash de lumière et la vie revient au maximum. La jauge est deux fois plus longue.' },
    josee:    { kills: 18, seconds: 15, desc: 'Une grande lumière : deux anges descendent t’aider pendant 15 s, bouclier sacré et soins.' },
    richard:  { kills: 15, desc: 'Un MÉGA boulet ultra rapide qui traverse tout le ciel et écrase tout le monde (dégâts ×12).' },
    mickael:  { kills: 20, seconds: 6, desc: 'Un laser qui grossit et brûle tout ce qui passe sous le viseur. Niv. 2 : plus gros et plus long. Niv. 3 : laser bleu encore plus fort.', levels: { seconds: [6, 10, 12], grow: [.6, 1, 1.15] } },
    marie:    { kills: 18, seconds: 12, desc: 'Maman veille ! 4 boucliers, 20 PV, et pendant 12 s une bulle d’amour repousse tout monstre qui s’approche et te soigne.' },
    adam:     { kills: 10, seconds: 2.5, desc: 'PI… KA… CHUUU ! Tout le monde est électrocuté et figé pendant 2,5 s (4 fois les dégâts). Jauge rapide !' },
    milo:     { kills: 18, seconds: 8, desc: 'ZOOM ! Pendant 8 s, tout est au ralenti sauf toi : ton canon tire 2,5 fois plus vite.' },
    jeremie:  { kills: 18, seconds: 6, desc: 'Un vortex s’ouvre dans le ciel et aspire tous les monstres pour les téléporter loin derrière. Invulnérable 6 s !' },
    jessica:  { kills: 20, seconds: 30, desc: 'JACKPOT ! Chaque ennemi lâche ses pièces tout de suite, puis c’est le casino : or triplé pendant 30 s.' },
    edison:   { kills: 20, seconds: 10, desc: 'Trois tornades géantes se forment dans le ciel et emportent tous les monstres à l’autre bout du monde pendant 10 s.' },
    josue:    { kills: 20, seconds: 30, desc: 'Tous les ennemis figent 1,5 s, puis tes dégâts (et ceux du coéquipier) doublent pendant 30 s.' },
    emily:    { kills: 18, seconds: 12, desc: 'Une vraie tempête de neige de 12 s : tout gèle, puis le vent et le froid ralentissent et blessent tout le monde.' },
    eliott:   { kills: 18, seconds: 8, desc: 'BOUH ! Tu deviens un fantôme 8 s : intouchable, boulets fantômes qui traversent tout, et trois esprits qui font fuir les monstres.' },
    alexie:   { kills: 18, seconds: 15, desc: 'Une licorne volante attaque avec toi pendant 15 s : dégâts ×2 et boulets disco !' },
    zachary:  { kills: 15, desc: 'Une vraie fusée à réaction qui file droit au viseur et explose en malade : KABOOM, 8 fois les dégâts dans un énorme rayon.' },
    pirate:   { kills: 22, seconds: 15, desc: 'À l’abordage ! Un bateau pirate volant traverse le ciel pendant 15 s et canonne les monstres avec ses trois canons. Un bateau de plus à chaque niveau.' },
  };
  // Pouvoir pirate : gagné en survivant 300 s sur la mer des monstres (1-9) ; remplace (ou non) le pouvoir du personnage au hangar ; un bateau par niveau.
  CB.PIRATE = { name: 'Bateau pirate volant', icon: '🏴‍☠️', max: 5, prices: [0, 1200, 2200, 3500, 5000], hint: 'Bats le boss de la Mer des pirates (le monde caché, ouvert par le bateau 1-9).', per: 'un bateau de plus par niveau · 15 s', desc: 'Un pouvoir unique : des bateaux pirates volants canonnent les monstres pendant 15 s. Choisis au hangar de l’utiliser à la place de ton pouvoir, ou non.' };
  CB.ageOf = (birth, today) => { const b = new Date(birth + 'T00:00:00'), t = today || new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a; };

  // Ennemis : hp et speed de base (multipliés selon le monde), size = rayon visuel, damage = dégâts quand ils nous atteignent,
  // gold = or en plus de l'or du monde. variant = la version spéciale (couleur) qui donne 3 cartes quand on l'abat.
  // 20 styles de monstres d'Halloween pour le premier monde (dans l'ordre d'apparition de la nuit sans fin),
  // puis les monstres des autres mondes. Chaque style existe en 4 paliers de couleur (CB.TIERS) : 80 variantes.
  CB.ENEMIES = {
    bat:       { name: 'Chauve-souris', hp: 1, speed: 7, size: 1, damage: 6, gold: 0, color: '#684a91', variant: { name: 'Chauve-souris rouge', color: '#e23b3b' }, big: { chance: .1, size: 2, hp: 2, name: 'Grosse chauve-souris' } },
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
    coffreOr:  { name: 'Coffre doré', hp: 6, speed: 2.8, size: 1.8, damage: 0, gold: 0, color: '#ffe36b', straight: true, noElite: true, chest: true, portal: true, life: 6 },   // 6 s pour l'attraper, sinon il s'envole
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
    // Bombe magique (tableau 1-2) : un monstre-bombe aux grands yeux posé dans un cercle magique, avec un décompte de 3 s.
    // On la tire pour la faire disparaître ; sinon elle explose et on perd des vies.
    // Vallée des dinosaures : rochers du Mégaoiseau (à faire exploser), cristaux du temps (à casser pour le rendre vulnérable),
    // cadeaux étoilés (à tirer pour ouvrir : trois cartes au choix).
    rocher:    { name: 'Rocher', hp: 4, speed: 9, size: 1.7, damage: 18, gold: 0, color: '#7a6a5a', straight: true, noElite: true, shot: true },
    cristal:   { name: 'Cristal du temps', hp: 6, speed: 0, size: 1.6, damage: 0, gold: 1, color: '#7fd4ff', straight: true, noElite: true, crystal: true },
    // Événements loufoques et nouveaux monstres : boucliers à casser, orbes du puzzle, tirs élémentaires (feu explosif,
    // poison, magie noire), soigneurs à abattre en premier, monstres qui électrocutent ou gèlent au contact (touch).
    bouclier:  { name: 'Bouclier magique', hp: 4, speed: 0, size: 1.7, damage: 0, gold: 2, color: '#4fc3ff', straight: true, noElite: true, shieldAll: true },
    orbe:      { name: 'Orbe du puzzle', hp: 1, speed: 0, size: 1.5, damage: 0, gold: 0, color: '#ffd23f', straight: true, noElite: true, orb: true },
    // Monstres marins (tableau 1-9 : ils nagent, le bas du corps dans l'eau) et le bateau volant secret de la nuée (3 coups pour le briser)
    requin:     { name: 'Requin', hp: 7, speed: 5, size: 1.6, damage: 14, gold: 2, color: '#6d8aa8', swim: true, variant: { name: 'Requin blanc', color: '#dfe9f2' } },
    piranha:    { name: 'Piranha', hp: 3, speed: 7.5, size: 1, damage: 8, gold: 1, color: '#c94a3a', swim: true, variant: { name: 'Piranha doré', color: '#ffd23f' } },
    pieuvre:    { name: 'Pieuvre', hp: 9, speed: 3.6, size: 1.7, damage: 16, gold: 3, color: '#b04fd8', swim: true, variant: { name: 'Pieuvre rouge', color: '#ff4f4f' } },
    crabe:      { name: 'Crabe géant', hp: 10, speed: 3.2, size: 1.5, damage: 14, gold: 3, color: '#ff7a3a', swim: true, variant: { name: 'Crabe bleu', color: '#4fa3ff' } },
    meduse:     { name: 'Méduse', hp: 4, speed: 4.2, size: 1.3, damage: 10, gold: 2, color: '#ff9ad5', swim: true, variant: { name: 'Méduse électrique', color: '#7fd4ff' } },
    murene:     { name: 'Murène', hp: 5, speed: 7, size: 1.5, damage: 12, gold: 2, color: '#4f8a3a', swim: true, zigzag: true, variant: { name: 'Murène électrique', color: '#9fe0ff' } },
    tortueGeante: { name: 'Tortue géante', hp: 22, speed: 2.6, size: 1.9, damage: 16, gold: 4, color: '#3f7a4a', swim: true, variant: { name: 'Tortue de fer', color: '#8a95a8' } },
    poissonVolant: { name: 'Poisson volant', hp: 3, speed: 6.5, size: 1.1, damage: 8, gold: 2, color: '#4fa3ff', strafe: true, variant: { name: 'Poisson d’argent', color: '#dfe9f2' } },
    // Bateaux pirates (monde caché) : ils s'ancrent à distance (anchor) et canonnent ; leurs boulets (shot) se détruisent d'un tir, ou s'esquivent avec ◀ ▶
    chaloupe:   { name: 'Chaloupe pirate', hp: 8, speed: 4, size: 1.8, damage: 0, gold: 4, color: '#8a5a2b', swim: true, ship: true, anchor: 36, spit: { type: 'bouletCanon', first: 2.5, every: 4 }, noElite: true },
    brigantin:  { name: 'Brigantin', hp: 16, speed: 3.6, size: 2.3, damage: 0, gold: 6, color: '#6b4a2a', swim: true, ship: true, anchor: 44, strafe: true, spit: { type: 'bouletCanon', first: 2, every: 3.2, salvo: 2 }, noElite: true },
    galion:     { name: 'Galion noir', hp: 30, speed: 3, size: 3, damage: 0, gold: 10, color: '#2b2b2b', swim: true, ship: true, anchor: 54, spit: { type: 'bouletCanon', first: 2.5, every: 2.8, salvo: 3 }, noElite: true },
    vaisseauFantome: { name: 'Vaisseau fantôme', hp: 18, speed: 5, size: 2.4, damage: 0, gold: 8, color: '#9fe0ff', swim: true, ship: true, anchor: 40, strafe: true, ghostly: true, spit: { type: 'bouletFantome', first: 1.5, every: 2.2 }, noElite: true },
    bouletCanon: { name: 'Boulet de pirate', hp: 2, speed: 10, size: 1.2, damage: 14, gold: 0, color: '#222', straight: true, noElite: true, shot: true },
    bouletFantome: { name: 'Boulet fantôme', hp: 1, speed: 14, size: 1.1, damage: 10, gold: 0, color: '#9fe0ff', straight: true, noElite: true, shot: true },
    bombeNoire: { name: 'Bombe noire', hp: 6, speed: 7, size: 1.9, damage: 30, gold: 0, color: '#111', straight: true, noElite: true, shot: true },
    serpentMer: { name: 'Serpent de mer', hp: 12, speed: 4.5, size: 2, damage: 18, gold: 4, color: '#3fae5a', swim: true, variant: { name: 'Serpent d’or', color: '#ffd23f' } },
    bateauVolant: { name: 'Bateau volant', hp: 3, speed: 0, size: 2.6, damage: 0, gold: 0, color: '#8a5a2b', straight: true, noElite: true, cross: true, hits: 3, secretBoat: true },
    feu:       { name: 'Boule de feu', hp: 2, speed: 12, size: 1.1, damage: 12, gold: 0, color: '#ff6a1a', straight: true, noElite: true, shot: true, explode: 9 },
    poison:    { name: 'Crachat de poison', hp: 2, speed: 10, size: 1, damage: 0, gold: 0, color: '#7dff3a', straight: true, noElite: true, shot: true, status: 'poison' },
    magieNoire:{ name: 'Magie noire', hp: 3, speed: 9, size: 1.2, damage: 0, gold: 0, color: '#4a1f6e', straight: true, noElite: true, shot: true, status: 'dark' },
    soigneur:  { name: 'Soigneur', hp: 5, speed: 4.5, size: 1.3, damage: 8, gold: 3, color: '#7dff9a', heal: { every: 1.6, amount: 1, radius: 16 }, variant: { name: 'Grand soigneur', color: '#ffd23f' } },
    sorcier:   { name: 'Sorcier noir', hp: 6, speed: 5, size: 1.4, damage: 12, gold: 2, color: '#5b2d8e', spit: { type: 'magieNoire', first: 2.5, every: 6 }, variant: { name: 'Archimage', color: '#c54fff' } },
    spectreGlace: { name: 'Spectre de glace', hp: 5, speed: 6, size: 1.3, damage: 0, gold: 2, color: '#a9e9ff', fade: true, touch: 'ice', variant: { name: 'Spectre polaire', color: '#ffffff' } },
    jongleur:  { name: 'Jongleur de feu', hp: 6, speed: 5, size: 1.4, damage: 10, gold: 2, color: '#ff8c2a', spit: { type: 'feu', first: 2, every: 4.5 }, variant: { name: 'Cracheur de feu', color: '#ff3a3a' } },
    clownChoc: { name: 'Clown électrique', hp: 5, speed: 6.5, size: 1.3, damage: 0, gold: 2, color: '#ffe76c', zigzag: true, touch: 'shock', variant: { name: 'Clown foudroyant', color: '#4fc3ff' } },
    crapaud:   { name: 'Crapaud venimeux', hp: 7, speed: 4, size: 1.4, damage: 10, gold: 2, color: '#6bbf3a', spit: { type: 'poison', first: 3, every: 5.5 }, variant: { name: 'Crapaud royal', color: '#c54fff' } },
    dragonnet: { name: 'Dragonnet', hp: 8, speed: 5.5, size: 1.5, damage: 12, gold: 3, color: '#d8323a', spit: { type: 'feu', first: 2, every: 3.8 }, variant: { name: 'Dragonnet d’or', color: '#ffd23f' } },
    robotGlace:{ name: 'Robot de glace', hp: 7, speed: 6, size: 1.4, damage: 0, gold: 2, color: '#9ad8ff', strafe: true, touch: 'ice', variant: { name: 'Robot cryo', color: '#c54fff' } },
    cible:     { name: 'Cible', hp: 2, speed: 2.6, size: 1.6, damage: 0, gold: 5, color: '#ff3a3a', straight: true, noElite: true, target: true },
    brigand:   { name: 'Brigand', hp: 1, speed: 0, size: 2.8, damage: 0, gold: 3, color: '#3b2a1e', noElite: true, panel: true, bad: true },
    civil:     { name: 'Civil', hp: 1, speed: 0, size: 2.8, damage: 0, gold: 0, color: '#4fa3ff', noElite: true, panel: true },
    cibleAilee:{ name: 'Cible ailée', hp: 1, speed: 0, size: 1.3, damage: 0, gold: 1, color: '#ff3a3a', noElite: true, target: true, flyer: true },
    cadeau:    { name: 'Cadeau étoilé', hp: 3, speed: 3, size: 1.5, damage: 0, gold: 0, color: '#ff4f9a', straight: true, noElite: true, gift: true },
    bombeMagique: { name: 'Bombe magique', hp: 2, speed: 0, size: 1.7, damage: 20, gold: 0, color: '#b14fff', straight: true, noElite: true, hazard: true, fuse: 3 },
  };
  // Paliers de couleur : même style de monstre, plus fort. Le palier 0 garde la couleur d'origine.
  CB.TIERS = [
    { key: '', name: '', color: null, hp: 1, speed: 1, gold: 1 },
    { key: 'rouge', name: 'rouge', color: '#e23b3b', hp: 2.5, speed: 1.1, gold: 2 },
    { key: 'dore', name: 'doré', color: '#ffd23f', hp: 6, speed: 1.2, gold: 4 },
    { key: 'violet', name: 'violet', color: '#b14fff', hp: 14, speed: 1.3, gold: 8 },
  ];
  CB.HALLOWEEN = ['bat', 'owl', 'ghost', 'pumpkin', 'skull', 'spider', 'crow', 'wisp', 'vampire', 'witch', 'eyeball', 'blackcat', 'mummy', 'candy', 'imp', 'zombie', 'scarecrow', 'frankie', 'cauldron', 'reaper'];
  // La nuit sans fin (monde 1, tableau 1) : façon Vampire Survivors. Un nouveau style de monstre apparaît à chaque
  // instant de « firstAt » (secondes), les paliers de couleur arrivent avec le temps, et des coffres mystères passent
  // régulièrement : les toucher ou les abattre révèle un nouveau tableau sur la carte.
  CB.DINOS = ['compsognathus', 'velociraptor', 'gallimimus', 'archeopteryx', 'pteranodon', 'dilophosaure', 'parasaurolophus', 'pachycephalosaure', 'iguanodon', 'allosaure', 'stegosaure', 'carnotaure', 'triceratops', 'quetzalcoatlus', 'trex', 'ankylosaure', 'spinosaure', 'diplodocus', 'apatosaure', 'brachiosaure'];
  CB.SEA_BITE = { z: 15, every: 2.6, dur: .9, lunge: 4, dmg: .5 };   // mer : les nageurs s'arrêtent à la coque (z), bondissent toutes les « every » s (bond de « dur » s, avance de « lunge »), dégâts × dmg
  CB.SEQUENCE_GAP = 1.5;   // éditeur : pause (s) entre l'élimination d'un groupe et l'arrivée du suivant
  CB.ENDLESS = {
    roster: CB.HALLOWEEN,
    firstAt: CB.HALLOWEEN.map((_, i) => i * 45),   // un nouveau monstre toutes les 45 s
    tierFrom: [0, 90, 240, 480], tierMax: [1, .45, .35, .3], tierRamp: [1, 300, 600, 900],
    hpRamp: 90, hpPerRamp: .4,                      // +40 % de PV toutes les 90 s
    chest: { firstAt: 35, every: 50 },
    maxDiscoveries: 2,                              // tableaux 4 et 5 du premier monde (le 2 se mérite en secret, le 3 en réussissant le 2)
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
    miniBoss: 'oiseauTemps', miniBossAt: 600,              // le Mégaoiseau du temps sort après 10 minutes
    gift: { firstAt: 40, every: 50 },                     // cadeaux étoilés : tirer dessus ouvre un choix de trois cartes
  };
  // Décor du passé : grande montagne, forêt luxuriante, volcan qui fume.
  CB.SCENERY = { prehistoire: { id: 'prehistoire', scene: 'prehistoire', sky: ['#1d6fb8', '#7fc4ee', '#f3e6b0'], ground: '#2f6b2a', accent: '#9be36a' }, mer: { id: 'mer', scene: 'mer', sky: ['#1a63b5', '#67b6ea', '#ffe9b8'], ground: '#1b4f8a', accent: '#7fd4ff' } };
  // Il faut réussir WORLD_NEED tableaux d'un monde (une étoile ou plus) pour ouvrir le suivant, pas forcément tous.
  CB.WORLD_NEED = 3;
  CB.PORTAL_TIME = 3.4; // secondes d'animation du portail avant le voyage
  // Boss : un par monde, dernière vague. Ils s'arrêtent à distance, tirent des boulets (qu'on peut détruire) et appellent des sbires.
  CB.BOSSES = {
    batking:  { name: 'Le Roi des chauves-souris', hp: 600, size: 3.6, color: '#3b2a63', minion: 'bat', every: 3.2, boltEvery: 2.6 },
    bigghost: { name: 'Le Grand Spectre', hp: 90, size: 4, color: '#c9d8ff', minion: 'ghost', every: 3, boltEvery: 2.4 },
    clown:    { name: 'Le Clown gonflable', hp: 130, size: 4.2, color: '#ff4f6b', minion: 'balloon', every: 2.6, boltEvery: 2.2 },
    queen:    { name: 'La Reine des guêpes', hp: 180, size: 3.8, color: '#f08a1d', minion: 'bee', every: 2.2, boltEvery: 2 },
    dragon:   { name: 'Le Dragon de lave', hp: 260, size: 4.6, color: '#c8321e', minion: 'firebird', every: 2.4, boltEvery: 1.8 },
    destroyer:{ name: 'Le Destructeur stellaire', hp: 380, size: 5.2, color: '#5b6b80', minion: 'tie', every: 2, boltEvery: 1.6 },
    // Monde caché des pirates : le Léviathan (rayon à esquiver avec ◀ ▶) plonge à 20 % de ses PV, et le VRAI boss arrive : le Capitaine Crochet et ses bordées de boulets
    leviathan: { name: 'Le Léviathan', hp: 1100, size: 5, color: '#2f8f7a', minion: 'piranha', every: 5, boltEvery: 3, swim: true, sea: true, hover: 40, powers: [['rayonMer', 'vague', 'rayonMer', 'bolt']], next: 'crochet', nextAt: .2 },
    crochet:   { name: 'Le Capitaine Crochet', hp: 800, size: 4.2, color: '#8a1c1c', minion: 'chaloupe', every: 12, boltEvery: 2.3, swim: true, sea: true, hover: 46, shipBoss: true, powers: [['bordee', 'bombarde', 'bordee', 'abordage', 'canonnade']] },
    // Mini-boss de la Vallée des dinosaures (après 10 minutes) : deux stades, le second rouge de colère avec deux attaques de plus.
    oiseauTemps: { name: 'Le Mégaoiseau du temps', hp: 320, size: 4.6, color: '#4a6aa0', angry: '#d0302a', minion: null, every: 0, boltEvery: 2.4, mini: true, powers: [['rocher', 'cristaux', 'rocher'], ['rocher', 'meteores', 'cristaux', 'rugissement', 'rocher']] },
  };

  // Le boss en trois actes : il sort quand on atteint ces niveaux de partie, perd un tiers de ses PV par acte et gagne des pouvoirs.
  CB.BOSS_LEVELS = [5, 10, 15];
  CB.SLOT2 = { price: 2500, powerPrice: 3000, name: 'Case vierge', icon: '🧿', desc: 'Une deuxième case pour un deuxième pouvoir : n’importe lequel de la famille, avec sa propre jauge.' };   // deuxième attaque spéciale (boutique « Pouvoirs »)
  CB.BOSS_SCALE = 2.6;                             // les boss sont gigantesques : dessin et zone de collision multipliés
  CB.BOSS_SPECIAL = { resist: .35, budget: .12, sources: ['laser', 'licorne', 'priere', 'fusee', 'eclair', 'tornade', 'neige', 'triche', 'mega'] };   // les boss résistent aux attaques spéciales : dégâts ×0,35 et au plus 12 % de leurs PV par lancer
  CB.BOSS_XP = 6;                                   // l'XP par monstre est multipliée dans les tableaux de boss pour monter vite
  CB.BOSS_POWERS = [['bolt', 'boulet'], ['bolt', 'eventail', 'bombe', 'boulet'], ['rayon', 'eventail', 'bombe', 'boulet', 'bolt']];
  CB.BOSS_POWER_NAMES = { bolt: 'Tir rapide', boulet: 'Boulet lourd', eventail: 'Éventail de tirs', bombe: 'Bombe à retardement', rayon: 'Rayon chargé', rocher: 'Rocher', cristaux: 'Cristaux du temps', meteores: 'Pluie de rochers', rugissement: 'Rugissement', rayonMer: 'Rayon du Léviathan', vague: 'Vague de boulets', bordee: 'Bordée', bombarde: 'Bombarde', abordage: 'Abordage', canonnade: 'Canonnade' };
  // Mondes : enemies = ce qui vole vers nous (pondéré par l'ordre : le premier est le plus fréquent),
  // cannon = le canon qui se débloque à l'achat une fois le monde terminé.
  CB.WORLDS = [
    { id: 'foret',  name: 'La Forêt des chauves-souris', short: 'Forêt', enemies: ['bat', 'owl', 'ghost', 'pumpkin', 'skull', 'spider', 'crow', 'wisp', 'vampire', 'witch', 'eyeball', 'blackcat', 'mummy', 'candy', 'imp', 'zombie', 'scarecrow', 'frankie', 'cauldron', 'reaper'], boss: 'batking', cannon: 'pirate', sky: ['#0b1437', '#243a6b', '#5d7a9c'], ground: '#1a3b2a', accent: '#8fd3a8', icon: '🦇', secret: { vi: 5, from: 0 }, extra: { vi: 6, from: 2 }, extra2: { vi: 7, from: 3 }, extra3: { vi: 8, from: 1 } },
    { id: 'manoir', name: 'Le Manoir hanté', short: 'Manoir', enemies: ['ghost', 'ghost', 'skull', 'sorcier', 'soigneur', 'spectreGlace'], boss: 'bigghost', cannon: 'confetti', sky: ['#120a2a', '#3a2061', '#6a3a8a'], ground: '#241838', accent: '#c9a4ff', icon: '👻' },
    { id: 'foire',  name: 'La Foire aux ballons', short: 'Foire', enemies: ['balloon', 'balloon', 'pinata', 'jongleur', 'clownChoc', 'crapaud'], boss: 'clown', cannon: 'turbo', sky: ['#1b6fd6', '#59b0ff', '#bfe8ff'], ground: '#4caf50', accent: '#ffd23f', icon: '🎈' },
    { id: 'ruche',  name: 'Le Ciel des abeilles', short: 'Ruche', enemies: ['bee', 'bee', 'wasp', 'crapaud', 'soigneur', 'clownChoc'], boss: 'queen', cannon: 'lave', sky: ['#f6a23a', '#ffd27a', '#fff2c2'], ground: '#b57b2a', accent: '#ffd23f', icon: '🐝' },
    { id: 'volcan', name: 'Le Volcan', short: 'Volcan', enemies: ['firebird', 'firebird', 'meteor', 'dragonnet', 'sorcier', 'soigneur'], boss: 'dragon', cannon: 'laser', sky: ['#1a0606', '#5a1410', '#b8401e'], ground: '#2b1a16', accent: '#ff8c2a', icon: '🌋' },
    { id: 'espace', name: 'L’Espace', short: 'Espace', enemies: ['tie', 'tie', 'ufo', 'robotGlace', 'sorcier', 'soigneur'], boss: 'destroyer', cannon: 'jumeau', sky: ['#02030c', '#0a1130', '#1b2a5a'], ground: '#3b4a60', accent: '#7fd4ff', icon: '🚀', space: true },
    // Monde caché (ouvert en réussissant le bateau pirate 1-9) : même décor que la mer, de plus en plus de volants, de monstres marins et de bateaux pirates ;
    // on s'y déplace avec ◀ ▶ pour esquiver boulets et rayons. tier = difficulté (PV / vitesse / or) d'un monde 2, pas d'un monde 7.
    { id: 'pirates', name: 'La Mer des pirates', short: 'Pirates', hidden: true, tier: 1.2, scene: 'mer', boat: true, dodge: true, enemies: ['piranha', 'requin', 'poissonVolant', 'bat', 'murene', 'meduse', 'tortueGeante', 'serpentMer', 'pieuvre', 'crabe', 'chaloupe', 'brigantin', 'galion', 'vaisseauFantome'], boss: 'leviathan', cannon: null, sky: ['#1a63b5', '#67b6ea', '#ffe9b8'], ground: '#1b4f8a', accent: '#7fd4ff', icon: '🏴‍☠️' },
  ];
  CB.tierOf = wi => { const w = CB.WORLDS[wi]; return w && w.tier != null ? w.tier : wi; };   // difficulté d'un monde (le monde caché n'est pas un monde 7)
  CB.worldById = id => CB.WORLDS.find(w => w.id === id);
  CB.WAVES_PER_WORLD = 5;
  CB.wavesOf = wi => { const w = CB.WORLDS[wi] || {}; return CB.WAVES_PER_WORLD + (w.secret ? 1 : 0) + (w.extra ? 1 : 0) + (w.extra2 ? 1 : 0) + (w.extra3 ? 1 : 0); }; // tableaux dessinés sur la carte (le monde 1 cache un sixième et un septième tableau)
  // Événements loufoques (tableaux normaux seulement) : boucliers magiques, bombe surprise, puzzle 1-2-3. Étourdissements à marteler.
  CB.EVENTS = { first: [25, 40], every: [40, 60], kinds: ['boucliers', 'bombeSurprise', 'puzzle'] };
  CB.STUN = { shock: { need: 8, seconds: 6, name: 'CHOC ÉLECTRIQUE !', color: '#ffe76c' }, ice: { need: 10, seconds: 7, name: 'GELÉ !', color: '#a9e9ff' } };
  CB.MEDALS = [['Bronze', '🥉'], ['Argent', '🥈'], ['Or', '🥇'], ['Diamant', '💎']];   // médailles des mini-jeux (par % réussi : 4 paliers, le diamant = parfait)
  CB.medalStars = (pct, m) => (m || []).reduce((n, th) => pct >= th ? n + 1 : n, 0);
  // Réglages par défaut des mini-jeux ; l'éditeur (Debug) peut tout changer : « every / speed / height / depth / show » = [début, fin]
  CB.MINIGAMES = {
    cibles: { count: 30, every: [2.2, 1.1], speed: [3, 4.6], move: 'vagues', side: 'deux', kind: 'cibleAilee', height: [4, 12], depth: [22, 58], medals: [.5, .75, .9, 1] },
    brigands: { rounds: 12, show: [3.2, 1.7], gap: .9, rise: .35, panels: 3, bads: 1, spacing: 11, y: 3.2, z: 28, bad: 'brigand', good: 'civil', medals: [.5, .75, .9, 1] } };
  CB.MOVES = { vagues: 'Vagues', droit: 'Tout droit', zigzag: 'Zigzag', rebond: 'Rebonds', piquee: 'Piqués', spirale: 'Spirale' };   // déplacements des cibles
  CB.SIDES = { deux: 'Les deux côtés', gauche: 'La gauche', droite: 'La droite' };
  CB.minigame = (type, o) => { const D = CB.MINIGAMES[type]; if (!D) return o || null; if (o && Object.keys(D).every(k => o[k] != null)) return o; const m = Object.assign({}, D, o || {}); for (const k in D) if (Array.isArray(D[k])) m[k] = (Array.isArray(m[k]) ? m[k] : D[k]).slice(); return m; };   // garde l'objet tel quel s'il est complet (l'éditeur le modifie en direct)

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
    // Monde 1, tableaux 2 à 5 : les monstres de la nuit sans fin reviennent dans le même ordre (le temps de la nuit est
    // compressé par timeScale, donc seuls les premiers styles arrivent : ~5 au tableau 2, ~7 au 3, ~9 au 4, ~11 au boss),
    // sans paliers de couleur, mais plus rapides. Fini les faucheuses et Frankenstein au tableau 2.
    if (wi === 0) { const NIGHT = [null, null, { speed: 1.25, timeScale: 5 }, { speed: 1.35, timeScale: 8 }, { speed: 1.15, timeScale: 7 }]; if (NIGHT[vi]) defs[vi].night = NIGHT[vi]; }
    // tableau 1-3 : plus dur (monstres plus rapides, plus nombreux) et trois cibles 🎯 passent pendant le tableau ; les trois
    // détruites (cumulées d'une partie à l'autre, profile.targetsHit) ouvrent le mini-jeu 1-7.
    if (wi === 0 && vi === 2) defs[2] = { type: 'kill', goal: 200, density: 1.6, name: 'Les deux cents', text: () => 'Abats 200 ennemis, de plus en plus forts ! Et vise les cibles 🎯 qui passent…', targets: { at: [12, 30, 48] }, ramp: { every: 40, hp: .3, speed: .05 }, sequence: [{ kinds: [{ type: 'bat', count: 16 }], every: .3 }] };   // première vague : 16 chauves-souris d'un coup, puis les monstres de la nuit, +30 % de PV toutes les 40 s
    if (wi === 0 && vi === 3) defs[3] = { type: 'survive', seconds: 100, density: 1.9, name: 'Cent secondes', text: () => 'Survis 100 secondes ! Ça va chauffer…', ramp: { every: 25, hp: .25, speed: .05 } };   // dur : ça arrive vite et ça durcit toutes les 25 s
    // tableau 1-2 : la nuée. Que des chauves-souris pendant 5 minutes, de plus en plus éparpillées, et des bombes magiques
    // à désamorcer. On tient le plus longtemps possible (étoiles au temps) et on peut arrêter quand on veut.
    if (wi === 0 && vi === 1) defs[1] = { type: 'swarm', seconds: 300, density: 1, name: 'La nuée de chauves-souris', text: () => 'Que des chauves-souris, de plus en plus partout\u00a0! Tire dans les cercles magiques avant la fin du décompte.', swarm: { roster: ['bat'], stars: [60, 180, 300], bombFrom: 15, bombEvery: [12, 7], boatAt: 40, boatEvery: 75, ramp: { speed: .55, tiers: [[100, .45], [200, .22], [255, .12]], pairFrom: 80, pairMax: .7, outro: { speed: 21, flee: 27 } } } };
    // ramp : vitesse +55 % à la fin ; chauves-souris rouges dès 100 s (jusqu'à 45 %), dorées dès 200 s (22 %), violettes dès 255 s (12 %) ; par paires de plus en plus souvent après 80 s
    // tableau secret 1-6 : la Vallée des dinosaures, dans le passé
    if (wi === 0 && vi === 5) defs[5] = { type: 'endless', density: 1, name: 'La Vallée des dinosaures', text: () => 'Tu as voyagé dans le passé\u00a0! Survis parmi les dinosaures.', endless: 'dinos', scene: 'prehistoire', secret: true };
    // tableau 1-9 : le bateau pirate (ouvert en réussissant le tableau 2). Sur la mer, depuis le pont d'un bateau pirate, on abat des
    // la mer des monstres : monstres marins qui nagent vers le bateau et quelques chauves-souris ; survivre 300 s donne le pouvoir pirate (reward).
    if (wi === 0 && vi === 8) defs[8] = { type: 'survive', seconds: 300, density: 1.1, name: 'La mer des monstres', text: () => 'À l’abordage ! Depuis le bateau pirate, survis 300 s aux monstres marins et aux chauves-souris.', scene: 'mer', boat: true, tag: '🏴‍☠️ BATEAU PIRATE', maxAlive: 4, roster: ['requin', 'piranha', 'pieuvre', 'crabe', 'meduse', 'serpentMer', 'bat'], reward: 'pirateWorld' };   // ouvre le chemin vers le monde caché des pirates
    // tableau 1-8 : le mini-jeu du brigand (ouvert en réussissant le tableau 4). Trois panneaux se lèvent (gauche, milieu, droite) :
    // un brigand à tirer, deux civils à épargner. Score = brigands attrapés − civils touchés ; médaille selon le % des rounds.
    if (wi === 0 && vi === 7) defs[7] = { type: 'brigands', density: 1, name: 'Le brigand et les civils', text: () => 'Mini-jeu ! Trois panneaux se lèvent : tire sur le brigand, jamais sur les civils !', brigands: { rounds: 12, show: [3.2, 1.7], gap: .9, medals: [.5, .75, .9, 1] }, minigame: true };
    // tableau 1-7 : le mini-jeu des cibles volantes. Une cible ailée = un tir. Médaille selon le % de cibles détruites.
    if (wi === 0 && vi === 6) defs[6] = { type: 'cibles', density: 1, name: 'Tir aux cibles volantes', text: () => 'Mini-jeu ! Des cibles ailées traversent le ciel, un seul tir suffit. Détruis-en le plus possible pour la médaille d’or.', cibles: { count: 30, every: [2.2, 1.1], medals: [.5, .75, .9, 1] }, minigame: true };
    if (w.id === 'pirates') { const P = { scene: 'mer', boat: true, maxAlive: 5 };
      defs[0] = Object.assign({ type: 'kill', goal: 40, density: 1.2, name: 'L’abordage', text: () => 'Abats 40 monstres ! Des chaloupes pirates arrivent : détruis leurs boulets, ou tasse-toi avec ◀ ▶.', roster: ['piranha', 'requin', 'poissonVolant', 'bat'], ships: { first: 6, every: [16, 11], kinds: ['chaloupe'], max: 1 } }, P);
      defs[1] = Object.assign({ type: 'survive', seconds: 90, density: 1.35, name: 'Tempête de boulets', text: () => 'Survis 90 s aux chaloupes et aux brigantins !', roster: ['piranha', 'requin', 'murene', 'poissonVolant', 'bat', 'meduse'], ships: { first: 4, every: [12, 7], kinds: ['chaloupe', 'brigantin'], max: 2 } }, P);
      defs[2] = Object.assign({ type: 'sink', goal: 8, density: 1.2, name: 'La flotte', text: () => 'Coule 8 bateaux pirates ! Le galion noir a trois canons…', roster: ['piranha', 'murene', 'poissonVolant', 'bat', 'crabe'], ships: { first: 2, every: [9, 5], kinds: ['chaloupe', 'brigantin', 'galion'], max: 3 } }, P);
      defs[3] = Object.assign({ type: 'survive', seconds: 120, density: 1.6, name: 'Le vaisseau fantôme', text: () => 'Survis 120 s : le vaisseau fantôme tire des boulets fantômes, vite et de partout !', roster: ['requin', 'murene', 'tortueGeante', 'serpentMer', 'poissonVolant', 'bat', 'pieuvre'], ships: { first: 3, every: [10, 5], kinds: ['brigantin', 'vaisseauFantome', 'galion'], max: 3 }, ramp: { every: 30, hp: .2, speed: .04 } }, P);
      defs[4] = Object.assign({ type: 'boss', density: 1.3, name: 'Le Léviathan', text: () => 'Monte au niveau ' + CB.BOSS_LEVELS[0] + ' pour réveiller le Léviathan. Tasse-toi avec ◀ ▶ pour esquiver ses rayons… et méfie-toi du vrai boss !', roster: ['piranha', 'requin', 'poissonVolant', 'bat'], ships: { first: 20, every: [25, 18], kinds: ['chaloupe'], max: 1 }, bossFull: true, reward: 'pirate' }, P); }
    const d = Object.assign({ world: wi, index: vi }, defs[vi]);
    d.text = d.text();
    const cw = (CB.CUSTOM_WAVES || {})[w.id + '-' + (vi + 1)]; if (cw) { d.custom = true; if (cw.name) d.name = cw.name; if (cw.text != null) d.text = cw.text; if (cw.type) d.type = cw.type; if (cw.goal) d.goal = cw.goal; if (cw.seconds) d.seconds = cw.seconds; }   // tableau relié (custom-waves.js) : la carte et le HUD montrent ses infos
    return d;
  };
  CB.hpScale = wi => 1 + CB.tierOf(wi) * .75;      // points de vie des ennemis selon le monde (tier)
  CB.speedScale = wi => 1 + CB.tierOf(wi) * .08;
  CB.goldBase = wi => 1 + Math.round(CB.tierOf(wi));                       // 1 pièce par ennemi au premier monde, 6 au dernier
  CB.xpPerKill = wi => 2 + Math.round(CB.tierOf(wi));
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
  // Objets uniques du hangar : achetés une fois, permanents (profile.items[key] = true).
  CB.ITEMS = {
    jaugePleine: { name: 'Jauge pleine', icon: '🔋', price: 450, desc: 'Tu commences chaque tableau avec ton attaque spéciale déjà prête !', per: 'attaque spéciale prête dès le départ' },
    sphere: { name: 'Sphère protectrice', icon: '🔮', price: 600, unlockWorld: 0, desc: 'Une sphère magique t’entoure : les monstres qui s’approchent trop s’y brûlent et reculent.', per: 'blesse et repousse les monstres trop proches', hint: 'Réussis le monde 1' },
  };
  // Tours de défense (pouvoir débloqué en réussissant le monde 2) : jusqu'à deux tours, une à gauche, une à droite du canon.
  // Tête chercheuse (après le monde 3) : les boulets se tournent vers le monstre le plus proche, mais seulement s'il est à moins de « range » unités
  // et avec un virage limité (« turn », radians par seconde) : un monstre loin ou très de côté est raté, même au dernier niveau.
  CB.HOMING = { name: 'Tête chercheuse', icon: '🛰️', prices: [500, 900, 1400, 2000, 2800], max: 5, turn: [1.4, 2, 2.6, 3.2, 3.8], range: [12, 15, 18, 21, 24], unlockWorld: 2, hint: 'Réussis le monde 3', desc: 'Tes boulets se tournent vers le monstre le plus proche. Pas parfait : trop loin ou trop de côté, ils le ratent.', per: 'boulets guidés · portée et virage limités' };
  CB.TOWER = { name: 'Tour de défense', icon: '🏰', prices: [700, 1200], max: 2, damage: .45, cooldown: 1.4, unlockWorld: 1, hint: 'Réussis le monde 2', desc: 'Une tour qui tire toute seule à côté de toi. La deuxième se place de l’autre côté.', per: 'tire toute seule · dégâts ÷ 2' };
  // Niveaux de l'attaque spéciale (hangar) : niv. 2 dès le niveau 9 du personnage, niv. 3 dès le niveau 20. Plus longue, plus forte, jauge plus courte.
  CB.SPECIAL_LEVELS = [{ dur: 1, power: 1, kills: 1 }, { minLevel: 9, price: 300, dur: 1.25, power: 1.3, kills: .85 }, { minLevel: 20, price: 800, dur: 1.5, power: 1.6, kills: .7 }];
  // Fiche du personnage : le bonus permanent en trois mots, et le pouvoir en une phrase rigolote (la description complète reste au hangar)
  CB.PERK_SHORT = { matthieu: '+6 % coup critique', josee: '+15 points de vie', richard: '+12 % dégâts · boulets 2× plus gros', mickael: '+12 % portée', marie: 'Un bouclier à chaque vague', adam: '+10 % cadence', milo: '+12 % d’or', jeremie: '10 % d’esquive', jessica: '+18 % d’or', edison: '+8 % cadence · +5 % portée', josue: '+10 % dégâts', emily: 'Ennemis 8 % plus lents', eliott: '15 % d’esquive', alexie: '+10 PV · +6 % d’or', zachary: '+15 % portée' };
  CB.SPECIAL_FUN = { matthieu: 'Clac ! Et tout le monde disparaît.', josee: 'Deux anges descendent du ciel !', richard: 'Un boulet GROS comme une maison !', mickael: 'Le laser de Superman !', marie: 'Maman veille : personne ne passe !', adam: 'Pi… ka… CHUUU !', milo: 'Tout le monde au ralenti… sauf Milo !', jeremie: 'Un vortex avale tous les monstres !', jessica: 'JACKPOT ! Il pleut des pièces d’or !', edison: 'Trois tornades géantes : bye bye !', josue: 'Un cri qui donne des super muscles !', emily: 'Une tempête de neige qui gèle tout !', eliott: 'BOUH ! Un fantôme qui traverse tout !', alexie: 'Une licorne volante et des boules disco !', zachary: 'KABOOM ! Une fusée en malade !' };
  CB.FAMILY_BUFF = { rate: .1 };                     // héros + ses deux coéquipiers de la même famille : +10 % de cadence pour les trois (aura de la famille en jeu)
  CB.SPECIAL_RAMP = 1.35;                           // chaque lancer dans un même tableau rend le suivant 35 % plus long à charger (plafond ×4) : fini le pouvoir en continu quand il y a foule
  CB.SPECIAL_FX = { alexie: 'licorne', josee: 'priere', mickael: 'laser', adam: 'pika', milo: 'slowmo', emily: 'blizzard', josue: 'rally', edison: 'tornado', jessica: 'magnet', jeremie: 'teleport', marie: 'protect', eliott: 'ghost', pirate: 'pirate' };   // attaques spéciales à durée : la jauge reste bloquée tant qu'elles sont actives
  CB.HELPER = { name: 'Coéquipier', price: 350, price2: 700, damage: .5, x: -5, specialFirst: 25, specialEvery: 45, desc: 'Un deuxième membre de la famille t’accompagne dans toutes les vagues. Il vise et tire tout seul (boulets deux fois moins forts) et lance son attaque spéciale de temps en temps.' };
  CB.upgradeCost = (key, level) => Math.round(CB.UPGRADES[key].base * 2 * Math.pow(1.65, level));   // ×2 demandé par Matthieu : 50 à 160 pièces au départ, puis ×1,65 par niveau

  // Canons : mods = bonus relatifs (rate, damage, range, gold), shots = boulets supplémentaires par tir.
  // world = le monde à terminer avant de pouvoir l'acheter (null = disponible dès le départ).
  CB.CANNONS = {
    classique: { name: 'Canon classique', price: 0, world: null, desc: 'Le bon vieux canon du village.', mods: {}, body: '#2d5a86', trim: '#9bd3ea', base: '#9b633e' },
    pirate:    { name: 'Canon de pirate', price: 150, world: 'foret', desc: 'Lourd, noir et puissant. Arrr !', mods: { damage: .2 }, body: '#2b2b2b', trim: '#d9b25a', base: '#5c3a21', flag: true, look: 'pirate' },
    confetti:  { name: 'Canon confetti', price: 400, world: 'manoir', desc: 'Il tire vite et fait pleuvoir l’or.', mods: { rate: .15, gold: .15 }, body: '#ff4f9a', trim: '#ffe36a', base: '#4fc3ff', stripes: true, look: 'confetti' },
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
    coeur:     { name: 'Cœurs', price: 150, desc: 'De l’amour plein le ciel.', color: '#ff4f9a', trail: 'hearts' },
    bonbon:    { name: 'Bonbons', price: 170, desc: 'Des bonbons enveloppés, avec des confettis.', color: '#ff6ad5', trail: 'confetti' },
    basket:    { name: 'Ballon de basketball', price: 190, desc: 'Swish ! Trois points.', color: '#ff8c2a', trail: 'none' },
    chasseur:  { name: 'Ballon chasseur', price: 160, desc: 'Le gros ballon rouge du gymnase.', color: '#e23b3b', trail: 'none' },
    pomme:     { name: 'Pommes', price: 140, desc: 'Croquantes, avec une feuille.', color: '#e23b3b', trail: 'leaves' },
    banane:    { name: 'Bananes', price: 140, desc: 'Elles tournent en volant. Attention aux pelures !', color: '#ffd23f', trail: 'none' },
    rondelle:  { name: 'Rondelle de hockey', price: 210, desc: 'Lancer frappé ! Avec des copeaux de glace.', color: '#1b1b1b', trail: 'ice' },
    etoiles:   { name: 'Étoiles', price: 240, desc: 'Un bouquet d’étoiles qui tourne.', color: '#fff3a0', trail: 'stars' },
    pokeball:  { name: 'Pokéball', price: 350, desc: 'Attrape-les tous !', color: '#e23b3b', trail: 'sparkle' },
    bloc:      { name: 'Bloc de terre', price: 400, desc: 'Un bloc de terre avec du gazon, en cubes.', color: '#5aa83a', trail: 'pixels' },
    mario:     { name: 'Bill Boulet', price: 450, desc: 'Un boulet noir fâché, avec des yeux et des bras.', color: '#1b1b1b', trail: 'smoke' },
    galaxie:   { name: 'Galaxie', price: 500, desc: 'À chaque tir, une des neuf planètes… ou le Soleil !', color: '#6fd0ff', trail: 'stars' },
  };
  CB.GALAXY = ['mercure', 'venus', 'terre', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune', 'pluton', 'soleil'];

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
    geant:    { name: 'Boulets géants', icon: '🟣', desc: 'Tes billes grossissent de 30 % (se cumule à l’infini !).', max: Infinity, apply: s => { s.size *= 1.3; } },
    rebond:   { name: 'Ricochet', icon: '🏓', desc: 'Le boulet rebondit vers un ennemi de plus.', apply: s => { s.bounces += 1; } },
    glace:    { name: 'Gel', icon: '🧊', desc: 'Les ennemis sont 25 % plus lents.', apply: s => { s.slow += .25; } },
    soin:     { name: 'Trousse de soins', icon: '🩹', desc: 'Récupère 40 points de vie tout de suite.', apply: (s, g) => { g.hp = Math.min(g.maxHp, g.hp + 40); if (s.anesthesie) g.freezeAll(4 + 1.5 * (s.anesthesie - 1)); } },
    potion:   { name: 'Potion de vie', icon: '🧪', max: 3, desc: '+20 % de vie tout de suite.', apply: (s, g) => { g.hp = Math.min(g.maxHp, g.hp + g.maxHp * .2); } },
    explosif: { name: 'Explosif', icon: '💣', desc: 'Chaque boulet explose à l’impact (plus large à chaque niveau).', apply: (s, g, lvl) => { s.splash = Math.max(s.splash, 5 + 1.5 * (lvl - 1)); } },
    chance:   { name: 'Trèfle', icon: '🍀', desc: '+20 % de chance de coup critique.', apply: s => { s.crit += .2; } },
    aimant:   { name: 'Aimant', icon: '🧲', desc: '+2 pièces d’or par ennemi.', apply: s => { s.goldFlat += 2; } },
    portee:   { name: 'Longue vue', icon: '🔭', desc: 'Portée +40 %.', apply: s => { s.range *= 1.4; } },
    // ----- Cartes uniques : une seule fois par partie, effet immédiat, sans niveau (instant : pas rejouées quand on passe le portail) -----
    renfort:  { name: 'Renfort', icon: '🤝', max: 1, instant: true, desc: 'Un membre de la famille (au hasard) vient t’aider pendant 30 s.', apply: (s, g) => { g.callGuest(30); } },
    bombe:    { name: 'Grosse bombe', icon: '💥', max: 1, instant: true, desc: 'Tous les monstres à l’écran explosent (sauf le boss).', apply: (s, g) => { g.blastAll(); } },
    jauge:    { name: 'Coup spécial', icon: '⚡', max: 1, instant: true, desc: 'Ta jauge d’attaque spéciale se remplit tout de suite.', apply: (s, g) => { g.fillCharge(); } },
    horloge:  { name: 'Horloge', icon: '⏱️', max: 1, instant: true, desc: 'Tout le monde est figé pendant 8 s.', apply: (s, g) => { g.freezeAll(8); } },
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
  CB.UNIQUE_CARDS = Object.keys(CB.CARDS).filter(k => CB.CARDS[k].instant);   // cartes à effet immédiat, une seule fois par partie
  // Niveau d'ingrédient exigé par un combo : 3, ou le maximum de la carte s'il est plus bas (Gâchette folle = 1).
  CB.roman = n => { n = Math.max(1, Math.round(n)); let out = ''; for (const [v, r] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { out += r; n -= v; } return out; }; // Gel II, Nova I…
  CB.comboNeed = k => Math.min(3, CB.CARDS[k].max);
})(window.CB);
