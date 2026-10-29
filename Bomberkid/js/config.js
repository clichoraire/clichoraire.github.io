// Bomberkid — constantes, personnages, objets, ennemis et thèmes.
// Tout est dans l'espace de noms BK. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.BK = window.BK || {};
window.BK.VERSION = '0.31';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (BK) {
  'use strict';
  BK.MAX_ALLIES = 2;
  BK.W = 1280; BK.H = 720;            // canevas logique
  BK.CASTLE_DECOR = [{"deco": "castle_throne", "name": "Trône royal", "icon": "👑", "solid": 1, "wall": false}, {"deco": "castle_armor", "name": "Armure de chevalier", "icon": "🛡️", "solid": 1, "wall": false}, {"deco": "castle_weapons", "name": "Râtelier d’armes", "icon": "⚔️", "solid": 1, "wall": false}, {"deco": "castle_shieldstand", "name": "Bouclier sur pied", "icon": "🛡️", "solid": 1, "wall": false}, {"deco": "castle_bed", "name": "Lit à baldaquin", "icon": "🛏️", "solid": 1, "wall": false}, {"deco": "castle_carpet", "name": "Tapis royal", "icon": "🟥", "solid": 0, "wall": false}, {"deco": "castle_lectern", "name": "Lutrin enluminé", "icon": "📖", "solid": 1, "wall": false}, {"deco": "castle_scrolls", "name": "Parchemins", "icon": "📜", "solid": 1, "wall": false}, {"deco": "castle_treasure", "name": "Tas de trésors", "icon": "🪙", "solid": 1, "wall": false}, {"deco": "castle_arch", "name": "Arche de pierre", "icon": "🏰", "solid": 1, "wall": false}, {"deco": "castle_cauldron", "name": "Chaudron", "icon": "⚗️", "solid": 1, "wall": false}, {"deco": "castle_hourglass", "name": "Grand sablier", "icon": "⌛", "solid": 1, "wall": false}, {"deco": "castle_crown", "name": "Couronne sur coussin", "icon": "👑", "solid": 1, "wall": false}, {"deco": "castle_harp", "name": "Harpe dorée", "icon": "🎶", "solid": 1, "wall": false}, {"deco": "castle_mirror", "name": "Miroir royal", "icon": "🪞", "solid": 1, "wall": true}, {"deco": "castle_globe", "name": "Globe céleste", "icon": "🌐", "solid": 1, "wall": false}, {"deco": "castle_chains", "name": "Chaînes suspendues", "icon": "⛓️", "solid": 1, "wall": true}, {"deco": "castle_cage", "name": "Cage de fer", "icon": "🪺", "solid": 1, "wall": false}, {"deco": "castle_portcullis", "name": "Herse", "icon": "🏰", "solid": 1, "wall": false}, {"deco": "castle_tapestry", "name": "Tapisserie royale", "icon": "🧵", "solid": 1, "wall": true}, {"deco": "castle_glass", "name": "Vitrail", "icon": "🌈", "solid": 1, "wall": true}, {"deco": "castle_wallshield", "name": "Blason royal", "icon": "🛡️", "solid": 1, "wall": true}, {"deco": "castle_swordstone", "name": "Épée dans la pierre", "icon": "🗡️", "solid": 1, "wall": false}, {"deco": "castle_brazier", "name": "Brasero", "icon": "🔥", "solid": 1, "wall": false}, {"deco": "castle_pedestal", "name": "Piédestal de marbre", "icon": "🏛️", "solid": 1, "wall": false}, {"deco": "castle_egg", "name": "Œuf de dragon", "icon": "🥚", "solid": 1, "wall": false}, {"deco": "castle_chest", "name": "Coffre royal", "icon": "💰", "solid": 1, "wall": false}, {"deco": "castle_quill", "name": "Encrier et plume", "icon": "🪶", "solid": 1, "wall": false}, {"deco": "castle_books", "name": "Pile de grimoires", "icon": "📚", "solid": 1, "wall": false}, {"deco": "castle_chess", "name": "Échiquier", "icon": "♟️", "solid": 1, "wall": false}, {"deco": "castle_barrel", "name": "Tonneau de provisions", "icon": "🛢️", "solid": 1, "wall": false}, {"deco": "castle_food", "name": "Panier de provisions", "icon": "🧺", "solid": 1, "wall": false}, {"deco": "castle_hay", "name": "Botte de foin", "icon": "🌾", "solid": 1, "wall": false}, {"deco": "castle_bell", "name": "Cloche de château", "icon": "🔔", "solid": 1, "wall": false}, {"deco": "castle_gong", "name": "Gong cérémonial", "icon": "🥁", "solid": 1, "wall": false}];
  BK.TRAP_DECOR = [{"deco": "trap_dart", "name": "Flèches empoisonnées", "icon": "🏹", "solid": 1, "hint": "Détecte devant lui, puis tire une ou trois flèches empoisonnées."}, {"deco": "trap_zap", "name": "Sentinelle ZAP", "icon": "⚡", "solid": 1, "hint": "Détecte un personnage devant elle, charge puis lance un rayon électrique."}, {"deco": "trap_spikes", "name": "Piques rétractables", "icon": "🔺", "solid": 0, "hint": "Une tuile traversable quand les piques sont rentrées. Règle la pause et le temps de sortie."}, {"deco": "trap_flame", "name": "Souffleur de flammes", "icon": "🔥", "solid": 1, "hint": "Crache du feu par intermittence dans la direction choisie."}, {"deco": "trap_frost", "name": "Souffleur de givre", "icon": "❄️", "solid": 1, "hint": "Un souffle glacé qui blesse et immobilise brièvement."}, {"deco": "trap_saw", "name": "Scie sur rail", "icon": "⚙️", "solid": 1, "hint": "Une lame fait des allers-retours devant son socle."}, {"deco": "trap_crusher", "name": "Dalle écraseuse", "icon": "🪨", "solid": 0, "hint": "Une ombre annonce la chute de la dalle, puis le passage se libère."}, {"deco": "trap_gas", "name": "Bouche de gaz toxique", "icon": "☠️", "solid": 0, "hint": "Une grille libère périodiquement un nuage empoisonné."}];
  BK.STEP = 1 / 60;                   // pas de simulation
  BK.PLAYER_R = 0.32;                 // rayon de collision d'un personnage (en cases)
  BK.BOMB_FUSE = 2.6;                 // secondes avant l'explosion
  BK.FLAME_TIME = 0.55;               // durée des flammes
  BK.THROW_CELLS = 3;                 // portée d'un lancer de bombe
  BK.KICK_SPEED = 7;                  // vitesse d'une bombe poussée (cases/s)
  BK.BASE_SPEED = 2.7;                // vitesse de marche (cases/s) pour 3 étoiles (plus lente : on court pour aller vite)
  BK.RUN_MULT = 1.9;                  // la course multiplie la vitesse de marche
  BK.RUN_ACCEL = 6;                   // accélération vers la vitesse de course (cases/s²)
  BK.RUN_COST = 22;                   // stamina dépensée par seconde de course
  BK.DOUBLE_TAP = 0.3;                // délai max entre deux appuis pour partir à la course
  BK.STATS = { hpMax: { name: 'Vie max', icon: '❤️', step: 10, base: 40, unit: '' }, fireRegen: { name: 'Repos au feu', icon: '🔥', step: 1, base: 2, unit: ' vie / s' }, staminaMax: { name: 'Stamina max', icon: '💪', step: 20, base: 100, unit: '' }, regen: { name: 'Récupération', icon: '♻️', step: 2, base: 8, unit: ' % / s' } };
  BK.defaultStats = () => ({ hpMax: BK.STATS.hpMax.base, fireRegen: BK.STATS.fireRegen.base, staminaMax: BK.STATS.staminaMax.base, regen: BK.STATS.regen.base });
  // Cibles et portes : huit couleurs (clé interne A-H, portes a-h) ; une cible ouvre les portes de sa couleur.
  BK.TARGET_COLORS = [{ key: 'A', name: 'rouge', color: '#e53935' }, { key: 'B', name: 'bleue', color: '#1e88e5' }, { key: 'C', name: 'verte', color: '#43a047' }, { key: 'D', name: 'jaune', color: '#fdd835' }, { key: 'E', name: 'mauve', color: '#8e24aa' }, { key: 'F', name: 'orange', color: '#fb8c00' }, { key: 'G', name: 'cyan', color: '#00acc1' }, { key: 'H', name: 'rose', color: '#ec407a' }];
  BK.targetColor = L => { const t = BK.TARGET_COLORS.find(x => x.key === String(L || 'A').toUpperCase()); return t ? t.color : '#ffd54a'; };
  BK.targetName = L => { const t = BK.TARGET_COLORS.find(x => x.key === String(L || 'A').toUpperCase()); return t ? t.name : ''; };
  BK.DAY_CYCLE = 240;                 // durée du cycle jour-nuit en secondes (jour ~100 s, crépuscule 30 s, nuit 70 s, aube 30 s)
  BK.MAX_BOMBS = 6; BK.MAX_FIRE = 7; BK.MAX_SPEED_UP = 4;
  BK.INVULN = 2.0;                    // secondes d'invincibilité après un coup (aventure)
  BK.SUDDEN_DEATH = 120;              // secondes avant la pluie de blocs (match)

  // Personnages : la famille au complet. outfit = couleur de la combinaison, accent = gants/bottes, antenna = boule
  // de l'antenne. size : 1 = adulte. speed en étoiles (1 à 5). Les têtes viennent des portraits de famille partagés.
  BK.CHARACTERS = {
    zachary:  { name: 'Zachary',  size: 1.0,  speed: 4, outfit: '#d9342b', accent: '#1e5bd8', antenna: '#ffd54a', role: 'ado' },
    alexie:   { name: 'Alexie',   size: 0.86, speed: 4, outfit: '#9b3fd4', accent: '#ff5fc8', antenna: '#ff5fc8', role: 'enfant', girl: true },
    eliott:   { name: 'Eliott',   size: 0.84, speed: 4, outfit: '#2f9d3a', accent: '#1b1b1b', antenna: '#49e26a', role: 'enfant' },
    adam:     { name: 'Adam',     size: 0.74, speed: 5, outfit: '#ff8a1f', accent: '#b5541a', antenna: '#ff8a1f', role: 'enfant' },
    milo:     { name: 'Milo',     size: 0.62, speed: 3, outfit: '#3f9cff', accent: '#8d6e63', antenna: '#ff5fc8', role: 'toutpetit' },
    edison:   { name: 'Edison',   size: 0.66, speed: 3, outfit: '#f4c430', accent: '#8d6e63', antenna: '#49e26a', role: 'toutpetit' },
    matthieu: { name: 'Matthieu', size: 1.0,  speed: 3, outfit: '#1e5bd8', accent: '#ffffff', antenna: '#ffd54a', role: 'mononcle' },
    josee:    { name: 'Josée',    size: 0.94, speed: 2, outfit: '#b48cf0', accent: '#ffffff', antenna: '#ff5fc8', role: 'grandmaman', girl: true },
    richard:  { name: 'Richard',  size: 0.96, speed: 2, outfit: '#8d6e63', accent: '#3e2723', antenna: '#ffd54a', role: 'grandpapa', belly: true },
    mickael:  { name: 'Mickael',  size: 0.98, speed: 3, outfit: '#00897b', accent: '#1b1b1b', antenna: '#49e26a', role: 'papa' },
    marie:    { name: 'Marie',    size: 0.94, speed: 4, outfit: '#e91e63', accent: '#ffffff', antenna: '#ff5fc8', role: 'maman', girl: true },
    jeremie:  { name: 'Jérémie',  size: 1.0,  speed: 4, outfit: '#b71c1c', accent: '#1b1b1b', antenna: '#ff8a1f', role: 'papa' },
    jessica:  { name: 'Jessica',  size: 0.94, speed: 4, outfit: '#f9a825', accent: '#ffffff', antenna: '#ffd54a', role: 'maman', girl: true },
    josue:    { name: 'Josué',    size: 0.98, speed: 3, outfit: '#0f5a2a', accent: '#1b1b1b', antenna: '#49e26a', role: 'papa' },
    emily:    { name: 'Émily',    size: 0.94, speed: 3, outfit: '#26c6da', accent: '#ffffff', antenna: '#3f9cff', role: 'maman', girl: true },
  };
  Object.entries(BK.CHARACTERS).forEach(([id, d]) => { d.id = id; d.familyPortrait = id; });
  BK.ORDER = ['zachary', 'alexie', 'eliott', 'adam', 'milo', 'edison', 'matthieu', 'josee', 'richard', 'mickael', 'marie', 'jeremie', 'jessica', 'josue', 'emily'];
  BK.charById = id => BK.CHARACTERS[id];
  BK.speedOf = stars => BK.BASE_SPEED + (stars - 3) * 0.22;

  // Objets ramassés dans les blocs. chance : poids relatif. match/adventure : disponible dans ce mode.
  BK.ALLY_FOOD_HEAL = {pumpkinpiece:5,meatcooked:10,fishcooked:20,poultrycooked:15};
  BK.COOKABLE = {fish:'fishcooked',meatraw:'meatcooked',poultryraw:'poultrycooked'};
  BK.PET_FOODS = {chat:['fish','fishcooked'],chien:['meatraw','meatcooked','poultryraw','poultrycooked']};
  BK.ITEMS = {
    poultryraw:{name:'Volaille crue',icon:'🥩',color:'#e99da4',weight:0,adventureOnly:true,usable:true,desc:'À faire cuire au feu de camp. Peut aussi nourrir un chien.'},
    poultrycooked:{name:'Volaille rôtie',icon:'🍗',color:'#d89545',weight:0,adventureOnly:true,usable:true,desc:'Manger pour récupérer 15 points de vie. Peut aussi nourrir un chien.'},
    bomb:   { name: 'Bombe en plus',  icon: '💣', color: '#3f9cff', weight: 5, desc: 'Une bombe de plus à poser en même temps.' },
    fire:   { name: 'Grande flamme',  icon: '🔥', color: '#ff6a1f', weight: 5, desc: 'Les explosions vont plus loin.' },
    speed:  { name: 'Patins',         icon: '⚡', color: '#ffd54a', weight: 3, desc: 'Court plus vite.' },
    kick:   { name: 'Coup de pied',   icon: '🦵', color: '#49e26a', weight: 2, desc: 'Marche pour pousser une bombe, cours pour sauter dessus.' },
    antidote: {name:'Antidote',icon:'🧪',color:'#84d6e2',weight:2,usable:true,adventureOnly:true,desc:'Guérit le poison, la diarrhée de bombes et la mèche courte en une dose. Sur la ceinture : utilisé automatiquement en cas de poison.'},
    bombdiarrhea: { name: 'Diarrhée de bombes', icon: '💣', color: '#a6ba45', weight: 1, desc: 'Malus : pendant 15 secondes, pose automatiquement des bombes en avançant.', adventureOnly: true },
    shortfuse: { name: 'Mèche courte', icon: '⏱️', color: '#ef7155', weight: 1, desc: 'Malus : pendant 20 secondes, les nouvelles bombes explosent deux fois plus vite.', adventureOnly: true },
    inflate: { name: 'Gonflage', icon: '🎈', color: '#ff9f64', weight: 2, desc: 'Bombe en main : maintiens Espace pour la gonfler, relâche pour la lancer. Plus grosse, plus puissante.', adventureOnly: true },
    longthrow: { name: 'Lancer long', icon: '🏹', color: '#6cbbef', weight: 2, desc: 'Lance les bombes à cinq cases au lieu de trois.', adventureOnly: true },
    bomb2: { name: 'Bombes niveau 2', icon: '🔴', color: '#e94c52', weight: 2, desc: 'Tes bombes deviennent rouges et font deux fois plus de dégâts. Leurs flammes rouges durent deux fois plus longtemps.', adventureOnly: true },
    safeitems: { name: 'Objets protégés', icon: '🎁', color: '#79d9ac', weight: 2, desc: 'Tes bombes ne détruisent plus les objets à ramasser.', adventureOnly: true },
    dome: { name: 'Explosion en dôme', icon: '☄️', color: '#ffb74d', weight: 2, desc: 'Le feu couvre un cercle autour de la bombe, diagonales comprises. La portée indique le rayon : 4 cases de chaque côté pour une portée de 4. Les murs arrêtent le souffle.', adventureOnly: true },
    fusion: { name: 'Giga-fusion', icon: '💥', color: '#c58cff', weight: 1, desc: 'Nécessite le coup de pied. Botte une bombe contre une autre : explosion géante qui traverse les blocs destructibles.', adventureOnly: true },
    wood: { name: 'Bois', icon: '🪵', color: '#b88753', weight: 0, desc: 'Utiliser sur un sol dégagé : construit un feu de camp devant toi avec un morceau de bois. Il brûle pendant 15 secondes. Réutilise du bois face au feu pour ajouter 15 secondes.', adventureOnly: true, usable: true },
    shield: { name: 'Bouclier',       icon: '🛡️', color: '#b48cf0', weight: 2, desc: 'Protège d’une seule explosion, puis se brise en te repoussant légèrement.' },
    heart:  { name: 'Cœur',           icon: '❤️', color: '#ff4d6d', weight: 2, desc: 'Redonne 5, 10 ou 20 points de vie.', adventureOnly: true },
    coin:   { name: 'Pièce d’or',      icon: '🟡', color: '#ffd54a', weight: 0, desc: 'Des pièces pour le magasin.', adventureOnly: true },
    card:   { name: 'Carte d’or',      icon: '🃏', color: '#ffd54a', weight: 0, desc: 'Une carte d’or à collectionner.', adventureOnly: true },
    gloves: { name: 'Gants de force',  icon: '🧤', color: '#c98f4f', weight: 0, desc: 'Soulève les roches et les lance comme des bombes : deux fois plus de dégâts, et la roche rebondit une case de plus.', adventureOnly: true },
    rod:    { name: 'Canne à pêche',  icon: '🎣', color: '#4a86c8', weight: 0, desc: 'Q ou W au bord de l’eau : on pêche un poisson.', adventureOnly: true, usable: true, unique: true },
    fish:   { name: 'Poisson',        icon: '🐟', color: '#5e9ad8', weight: 0, desc: 'Q ou W : lancé deux cases plus loin (2-3 points aux monstres). Entrée près d’un feu de camp : on le fait cuire.', adventureOnly: true, usable: true },
    fishcooked: { name: 'Poisson grillé', icon: '🍖', color: '#ff8a1f', weight: 0, desc: 'Q ou W : on le mange, la vie max double pendant 3 minutes.', adventureOnly: true, usable: true },
    spore:  { name: 'Poudre de champignon', icon: '🧂', color: '#c62828', weight: 0, desc: 'Q ou W : on lance la poudre devant soi, un champignon géant pousse. Saute dessus depuis une bombe : il t’envoie 3 cases plus loin.', adventureOnly: true, usable: true },
    lantern: { name: 'Lanterne à fée', icon: '🏮', color: '#ffd54a', weight: 0, desc: 'Accrochée au pantalon : la fée s’allume toute seule le soir et éclaire tout autour. Le jour, elle dort.', adventureOnly: true },
    honey:  { name: 'Pot de miel',     icon: '🍯', color: '#f0a830', weight: 0, desc: 'Q ou W : verse une flaque de miel qui englue les monstres.', adventureOnly: true, usable: true },
    axe: { name: 'Hache', icon: '🪓', color: '#8da9ad', weight: 1, desc: 'Face à un arbre, utilise la hache pour l’abattre. Réutilisable.', adventureOnly: true, usable: true, unique: true },
    meatraw: { name: 'Viande crue', icon: '🥩', color: '#d86f77', weight: 0, desc: 'À cuire au feu de camp : approche-toi et utilise cet objet ou appuie sur Entrée.', adventureOnly: true, usable: true },
    meatcooked: { name: 'Viande cuite', icon: '🍗', color: '#bd773f', weight: 0, desc: 'Manger pour récupérer 10 points de vie.', adventureOnly: true, usable: true },
    pumpkinpiece: { name: 'Morceau de citrouille', icon: '🎃', color: '#ff8a1f', weight: 0, desc: 'Q ou W : manger pour récupérer 5 points de vie.', adventureOnly: true, usable: true },
    carrot: { name: 'Carotte',         icon: '🥕', color: '#ff8a1f', weight: 0, desc: 'Q ou W : lancée deux cases devant toi. Un lapin maléfique qui la voit court la manger… et devient tout doux.', adventureOnly: true, usable: true },
  };
  BK.SNAIL_COLORS = {
    default:{name:'Dorée',shell:'#e8b36c',dark:'#a56c3c',shine:'#ffdc9b'},
    black:{name:'Noire',shell:'#555966',dark:'#242632',shine:'#a6adbd'},
    blue:{name:'Bleue',shell:'#64b5f6',dark:'#2867b0',shine:'#bceaff'},
    red:{name:'Rouge',shell:'#ef7775',dark:'#ad353e',shine:'#ffd0b0'},
    green:{name:'Verte',shell:'#8bd774',dark:'#398853',shine:'#d4ffad'},
    purple:{name:'Mauve',shell:'#bd91ef',dark:'#7550aa',shine:'#efcdff'}
  };
  for(const [key,c] of Object.entries(BK.SNAIL_COLORS)) BK.ITEMS['snail_'+key]={name:'Escargot · coquille '+c.name.toLowerCase(),icon:'🐌',color:c.shell,weight:0,adventureOnly:true,usable:true,snailColor:key,desc:'Utilise-le pour déposer l’escargot sur un sol libre devant toi, même dans une maison. Éloigne-toi pour le laisser ressortir.'};
  for(const [key,c] of Object.entries(BK.SNAIL_COLORS)) BK.ITEMS['snail_baby_'+key]={...BK.ITEMS['snail_'+key],name:'Bébé escargot · coquille '+c.name.toLowerCase(),baby:true};
  for(const [key,c] of Object.entries(BK.SNAIL_COLORS)) for(let growth=1;growth<3;growth++) BK.ITEMS['snail_baby'+growth+'_'+key]={...BK.ITEMS['snail_baby_'+key],name:(growth===1?'Petit escargot':'Jeune escargot')+' · coquille '+c.name.toLowerCase(),growth};
  BK.snailItemType = s => 'snail_'+(s.baby?'baby'+(s.growth||'')+'_':'')+(s.color||s.shellColor||'default');
  BK.snailStack = slot => {
    const def=BK.ITEMS[slot.type];if(!def?.snailColor)return [];
    slot.snails=Array.from({length:slot.n},(_,i)=>slot.snails?.[i]||{color:def.snailColor,baby:!!def.baby,growth:def.growth||0,perm:i>=slot.n-(slot.perm||0)});return slot.snails;
  };
  BK.snailName = value => Array.from(String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim()).slice(0,24).join('');
  BK.settings = {friendlyFire:false};
  try { BK.settings.friendlyFire = JSON.parse(localStorage.getItem('bk.settings') || '{}').friendlyFire === true; } catch (_) {}
  BK.setFriendlyFire = value => { BK.settings.friendlyFire=!!value; try {localStorage.setItem('bk.settings',JSON.stringify(BK.settings));} catch (_) {} };
  // Ajoute un seuil extérieur aux anciennes pièces dont la sortie était dans le mur du bas.
  BK.roomMap = (grid, preserve) => { if(preserve)return grid.slice(); const rows=grid.slice(), last=rows.length-1, c=rows[last].indexOf('G'); if(c>=0 && grid.join('').split('G').length===2 && !/^ *G *$/.test(rows[last])) {rows[last]=rows[last].slice(0,c)+'y'+rows[last].slice(c+1);rows.push(' '.repeat(c)+'G'+' '.repeat(rows[0].length-c-1));} return rows; };
  BK.BOMB_POWERS = ['inflate', 'longthrow', 'bomb2', 'safeitems', 'fusion', 'dome'];
  BK.ITEM_SCORE = 50; BK.BLOCK_SCORE = 10;

  // Ennemis : speed en cases/s, hp = nombre de flammes à prendre, score à la mort. Comportements dans world.js.
  BK.ENEMIES = {
    escargot: { name: 'Escargot', hp: 1, speed: 0.12, score: 0, xp: 0, r: 0.12, color: '#dfa25b', behavior: 'peaceful', peaceful: true, dmg: 0 },
    cerf: { name: 'Cerf', hp: 2, speed: 1.05, score: 0, xp: 0, r: 0.34, color: '#bc8a56', behavior: 'peaceful', peaceful: true, huntable: true, meat: 2, dmg: 0 },
    lapin_gentil: { name: 'Lapin gentil', hp: 1, speed: 0.85, score: 0, xp: 0, r: 0.24, color: '#eee0ce', behavior: 'peaceful', peaceful: true, huntable: true, meat: 1, dmg: 0 },
    chien: { name: 'Chien', hp: 1, speed: 1.15, score: 0, xp: 0, r: 0.28, color: '#c58b52', behavior: 'peaceful', peaceful: true, dmg: 0 },
    chat: { name: 'Chat', hp: 1, speed: 0.85, score: 0, xp: 0, r: 0.25, color: '#edaa62', behavior: 'peaceful', peaceful: true, dmg: 0 },
    oiseau: { name: 'Oiseau', hp: 1, speed: 1.6, score: 0, xp: 0, r: 0.19, color: '#5daee0', behavior: 'peaceful', peaceful: true, huntable:true, meat:1, lootRaw:'poultryraw',lootCooked:'poultrycooked', dmg: 0 },
    ballon:    { name: 'Ballounet',        hp: 1, speed: 1.4, score: 100, xp: 10, r: 0.34, color: '#ff6b8a', behavior: 'wander' },
    gluant:    { name: 'Gluant',           hp: 1, speed: 1.9, score: 150, xp: 15, r: 0.34, color: '#49e26a', behavior: 'hunter' },
    fantome:   { name: 'Fantôme',          hp: 1, speed: 1.6, score: 200, xp: 20, r: 0.32, color: '#cfd8ff', behavior: 'ghost' },
    chevalier: { name: 'Chevalier de pierre', hp: 2, speed: 1.1, score: 300, xp: 30, r: 0.38, color: '#9e9e9e', behavior: 'charger', chargeSpeed: 5.5, range: 6, readyT: 0.8, stunT: 1.2 },
    chevalier_rouge: { name: 'Chevalier rouge', hp: 4, speed: 1.3, score: 500, xp: 50, r: 0.38, color: '#c62828', behavior: 'charger', chargeSpeed: 7.5, range: 7, readyT: 0.8, stunT: 1.0, dmg: 15 },   // charge plus vite et plus fort
    chevalier_bleu:  { name: 'Chevalier bleu',  hp: 4, speed: 1.3, score: 500, xp: 50, r: 0.38, color: '#1e63b3', behavior: 'charger', chargeSpeed: 5.5, range: 8, readyT: 0.25, stunT: 0.5, dmg: 10 },   // repart tout de suite, voit plus loin
    chevalier_dore:  { name: 'Chevalier doré',  hp: 9, speed: 1.6, score: 1200, xp: 120, r: 0.4, color: '#e6b422', behavior: 'charger', chargeSpeed: 8.5, range: 9, readyT: 0.25, stunT: 0.45, dmg: 20 },   // plus fort que le rouge et le bleu réunis
    crapaud:   { name: 'Crapaud géant',    hp: 6, speed: 0, score: 1500, xp: 150, r: 0.62, color: '#6a9c2f', behavior: 'toad', boss: 'mini', dmg: 15 },
    lanceur:   { name: 'Lance-fusées',     hp: 3, speed: 0, score: 400, xp: 40, r: 0.45, color: '#3b3f4a', behavior: 'launcher', solid: true },
    canon:     { name: 'Canon',            hp: 2, speed: 0, score: 300, xp: 30, r: 0.42, color: '#2a2a30', behavior: 'cannon', solid: true, ball: 'black', ballSpeed: 5, cool: 2.4 },
    canon_rouge: { name: 'Canon rouge',    hp: 4, speed: 0, score: 450, xp: 45, r: 0.42, color: '#b3261e', behavior: 'cannon', solid: true, ball: 'fire', ballSpeed: 5, cool: 2.4 },
    canon_bleu:  { name: 'Canon bleu',     hp: 4, speed: 0, score: 450, xp: 45, r: 0.42, color: '#1e63b3', behavior: 'cannon', solid: true, ball: 'blue', ballSpeed: 2.5, cool: 1.2 },
    marin:     { name: 'Monstre marin',    hp: 3, speed: 0, score: 400, xp: 40, r: 0.46, hitR: 0.68, color: '#2aa89a', behavior: 'sea', solid: true, dmg: 10 },
    cogneur:   { name: 'Cogneur',          hp: 2, speed: 1.0, score: 350, xp: 35, r: 0.4, color: '#8d6e63', behavior: 'hammer' },
    cracheur:  { name: 'Cracheur de feu',  hp: 2, speed: 0, score: 300, xp: 30, r: 0.38, color: '#e8552a', behavior: 'fire' },
    glaceur:   { name: 'Souffleur de glace', hp: 2, speed: 0, score: 300, xp: 30, r: 0.38, color: '#8fd8ff', behavior: 'ice' },
    magicien:  { name: 'Magicien',         hp: 2, speed: 0, score: 500, xp: 50, r: 0.36, color: '#7b3fb0', behavior: 'mage' },
    taupe:     { name: 'Taupe',            hp: 1, speed: 1.3, score: 250, xp: 25, r: 0.34, color: '#6d4c41', behavior: 'mole' },
    guepe:     { name: 'Guêpe',            hp: 1, speed: 2.2, score: 250, xp: 25, r: 0.3, color: '#ffc107', behavior: 'wasp' },
    abeille:   { name: 'Abeille',          hp: 1, speed: 2.4, score: 120, xp: 12, r: 0.15, color: '#ffc107', behavior: 'wasp', dmg: 5 },
    plante:    { name: 'Plante carnivore', hp: 2, speed: 0, score: 200, xp: 20, r: 0.4, color: '#d32f2f', behavior: 'plant' },
    squelette: { name: 'Squelette',        hp: 2, speed: 1.2, score: 300, xp: 30, r: 0.34, color: '#f4f0e6', behavior: 'skeleton', range: 3, boneSpeed: 4 },
    squelette_rouge: { name: 'Squelette rouge', hp: 3, speed: 1.2, score: 450, xp: 45, r: 0.34, color: '#d9342b', behavior: 'skeleton', range: 5, boneSpeed: 5.2 },
    squelette_noir:  { name: 'Squelette noir',  hp: 4, speed: 1.8, score: 600, xp: 60, r: 0.34, color: '#2a2a30', behavior: 'skeleton', range: 7, boneSpeed: 6 },
    golem:     { name: 'Roi Golem',        hp: 10, speed: 0.9, score: 5000, xp: 300, r: 0.44, hitR: 0.8, color: '#7b6b5a', behavior: 'golem', boss: 'boss', dmg: 20 },
    lapin:     { name: 'Lapin maléfique',  hp: 2, speed: 2.0, score: 350, xp: 35, r: 0.32, color: '#e8dcf4', behavior: 'rabbit', dmg: 10 },   // bondit, fonce dès qu'il te voit, puis souffle 7-8 s ; une carotte l'apprivoise
    serpent:   { name: 'Serpent venimeux', hp: 1, speed: 2.6, score: 300, xp: 30, r: 0.3, color: '#4caf50', behavior: 'snake', dmg: 5, poison: true },   // rapide ; sa morsure empoisonne
    orque:     { name: 'Orque',            hp: 4, speed: 1.7, score: 600, xp: 60, r: 0.42, color: '#5c8a3a', behavior: 'orc', dmg: 15 },   // armure, épée ; reste près de son shaman
    shaman:    { name: 'Shaman orque',     hp: 12, speed: 0, score: 1500, xp: 150, r: 0.4, color: '#3e6b2a', behavior: 'shaman', dmg: 15 },   // magie plus forte que le magicien, soigne les orques
  };

  // Niveaux : le niveau n demande 100 + 50 × (n − 1) XP pour passer au suivant.
  BK.levelFromXp = xp => { let rest = Math.max(0, Math.floor(xp || 0)), level = 1; while (rest >= 100 + 50 * (level - 1)) { rest -= 100 + 50 * (level - 1); level++; } return { level, current: rest, needed: 100 + 50 * (level - 1) }; };

  // Thèmes visuels des tableaux.
  BK.THEMES = {
    forest: { rock: '#8f98a3', rockTop: '#b8c0c9', rockDark: '#5f6771', name: 'Forêt verte', bush: '#3f9a3a', floor: '#6fbf5a', floor2: '#62b04e', soft: '#c8743a', softMortar: '#8a4a22', hard: '#9aa3ad', hardTop: '#c4ccd4', hardDark: '#6b747d', sky: ['#5b7fe0', '#a9d4ff'], mountain: '#5c6fb0', fog: '#2d6a3e' },
    castle: { rock: '#6c6c76', rockTop: '#9c9ca8', rockDark: '#44444c', name: 'Château', bush: '#4a7a9a', floor: '#8c8c96', floor2: '#7f7f8a', soft: '#5f7fbd', softMortar: '#3b5080', hard: '#6c6c76', hardTop: '#9c9ca8', hardDark: '#44444c', sky: ['#2b2f55', '#7a6aa6'], mountain: '#33355a', fog: '#1c1d33' },
    lava:   { rock: '#4a4340', rockTop: '#6b625e', rockDark: '#2a2523', name: 'Volcan', bush: '#7a4a3a', floor: '#5a4a44', floor2: '#4e403b', soft: '#c84b2b', softMortar: '#6b2412', hard: '#3e3835', hardTop: '#5b5350', hardDark: '#241f1d', sky: ['#3a1b1b', '#c95a2a'], mountain: '#4a2424', fog: '#2a1010' },
    garden: { rock: '#8f98a3', rockTop: '#b8c0c9', rockDark: '#5f6771', name: 'Jardin vert', floor: '#b9b4ac', floor2: '#aaa49b', grass: '#5fb84a', grass2: '#55a842', water: '#2f6fd6', water2: '#3f84ec', cliff: '#8a6a4a', cliffDark: '#5e4731', soft: '#3f9a3a', softMortar: '#2b6b28', hard: '#b34a2a', hardTop: '#d16a45', hardDark: '#7a2f18', sky: ['#4f8be8', '#bfe3ff'], mountain: '#6a7fb8', fog: '#2f6fd6' },
    winter: { rock: '#8a98a8', rockTop: '#e6eef6', rockDark: '#5f6c7a', name: 'Hiver', bush: '#9fc0dc', floor: '#dfe8f2', floor2: '#d1dce8', grass: '#f2f7fd', grass2: '#e4edf7', water: '#4a86c8', water2: '#5e9ad8', cliff: '#7d8794', cliffDark: '#55606c', soft: '#a8c4dc', softMortar: '#6b8aa6', hard: '#8a98a8', hardTop: '#e6eef6', hardDark: '#5f6c7a', sky: ['#8fb0d4', '#eaf3fc'], mountain: '#b9c8d8', fog: '#c9d8e6' },
    interior: { name: 'Intérieur', rock: '#6b4a2a', rockTop: '#8a6a4a', rockDark: '#4a3018', bush: '#3f9a3a', floor: '#b07a3e', floor2: '#a66f35', grass: '#5fb84a', grass2: '#55a842', water: '#2f6fd6', water2: '#3f84ec', cliff: '#6b4a2a', cliffDark: '#4a3018', soft: '#c8743a', softMortar: '#8a4a22', hard: '#7a4f24', hardTop: '#a0703a', hardDark: '#4a3018', sky: ['#2a1a10', '#3b2412'], mountain: '#2a1a10', fog: '#2a1a10' },
    arena:  { rock: '#a09a8c', rockTop: '#cbc4b4', rockDark: '#6c675b', name: 'Arène', floor: '#e0c98f', floor2: '#d3bb80', soft: '#4f8ad8', softMortar: '#2b5590', hard: '#a09a8c', hardTop: '#cbc4b4', hardDark: '#6c675b', sky: ['#4a86e8', '#bfe3ff'], mountain: '#6a7fb8', fog: '#4a6a90' },
  };

  // Poses d'animation disponibles (écran Debug).
  BK.POSES = ['idle', 'walk', 'pickup', 'carry', 'carrywalk', 'throw', 'place', 'hit', 'dead', 'win', 'lose'];
  BK.POSE_NAMES = { idle: 'Repos', walk: 'Marche', pickup: 'Ramasse', carry: 'Porte (immobile)', carrywalk: 'Porte (marche)', throw: 'Lance', place: 'Pose une bombe', hit: 'Touché', dead: 'K.-O.', win: 'Victoire', lose: 'Défaite' };
  BK.DIRS = [{ dx: 0, dy: 1, name: 'down' }, { dx: -1, dy: 0, name: 'left' }, { dx: 0, dy: -1, name: 'up' }, { dx: 1, dy: 0, name: 'right' }];
})(window.BK);

// Compatibilité des anciens tableaux : un seul remède dans tous les catalogues.
(function(BK){
 BK.remedyId=id=>id==='antipoison'?'antidote':id;
 Object.defineProperty(BK.ITEMS,'antipoison',{value:BK.ITEMS.antidote,enumerable:false});
 BK.normalizeRemedyBag=p=>{
  for(const key of ['inv','found'])if(Array.isArray(p[key])){
   let dose=null;const out=[];
   for(const slot of p[key]){slot.type=BK.remedyId(slot.type);if(slot.type==='antidote'){if(dose){dose.n=(dose.n||0)+(slot.n||0);if('perm' in dose||'perm' in slot)dose.perm=(dose.perm||0)+(slot.perm||0);continue;}dose=slot;}out.push(slot);}
   p[key]=out;
  }
  for(const key of ['bagSlots','quickSlots'])if(Array.isArray(p[key])){let seen=false;p[key]=p[key].map(id=>{id=BK.remedyId(id);if(id!=='antidote')return id;if(seen)return null;seen=true;return id;});}
  return p;
 };
 BK.migrateRemedyData=data=>{
  if(!data||typeof data!=='object')return data;
  if(Array.isArray(data)){data.forEach(BK.migrateRemedyData);return data;}
  for(const [key,value] of Object.entries(data)){if(['type','item','pickup'].includes(key)&&value==='antipoison')data[key]='antidote';else if(value&&typeof value==='object')BK.migrateRemedyData(value);}
  return BK.normalizeRemedyBag(data);
 };
})(window.BK);
