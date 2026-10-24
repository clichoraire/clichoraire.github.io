// Frigo Snap — constantes, outils, espèces, niveaux et répliques du Chef Fernand.
// Tout vit dans l'espace de noms FS. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.FS = window.FS || {};
window.FS.VERSION = '1.0';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (FS) {
  'use strict';
  FS.W = 1280; FS.H = 720;          // canevas logique
  FS.STEP = 1 / 60;                 // pas de simulation
  FS.HFOV = 72 * Math.PI / 180;     // champ de vision horizontal
  FS.CAM_H = 1.15;                  // hauteur de l'objectif au-dessus de l'étagère
  FS.RAIL_SPEED = 1.7;              // vitesse du chariot (unités / s)
  FS.DASH_MULT = 2.2;               // accélérateur (outil « Pédale »)
  FS.FILM = 60;                     // nombre de clichés par virée
  FS.MAX_YAW = 80 * Math.PI / 180;  // on peut tourner la tête à ±80°
  FS.MAX_PITCH = 38 * Math.PI / 180;
  FS.BAIT_LIFE = 30;                // un croûton reste 30 s au sol
  FS.ATTRACT_R = 9;                 // rayon d'attraction d'un croûton
  FS.CLIC_R = 13;                   // portée du clic piézoélectrique
  FS.FLASH_R = 15;                  // portée du flash
  FS.NEAR = 0.3; FS.FAR = 70;

  // ------------------------------------------------------------------ outils (débloqués avec les points Fernand cumulés)
  FS.TOOLS = [
    { id: 'crouton', key: '1', name: 'Croûton à l\'ail', short: 'Croûton', unlock: 0, color: '#d9a35a', cooldown: 0.6,
      desc: 'L\'appât : il attire les gourmands qui viennent le grignoter (pose « Repas »). Lancé sur le bon objet, il déclenche des réactions.' },
    { id: 'tabasco', key: '2', name: 'Goutte de Tabasco', short: 'Tabasco', unlock: 5000, color: '#e53935', cooldown: 0.5,
      desc: 'L\'agitateur : réveille les dormeurs, fait éternuer, fondre ou cracher. Deux gouttes dans les narines d\'un Yéti…' },
    { id: 'clic', key: '3', name: 'Clic du briquet piézo', short: 'Clic', unlock: 20000, color: '#4fc3f7', cooldown: 2.5,
      desc: 'Le bruit : une étincelle et un claquement qui résonne dans le métal. Déclenche des danses et fissure le givre.' },
    { id: 'flash', key: '4', name: 'Flash stroboscopique', short: 'Flash', unlock: 42000, color: '#fff176', cooldown: 2.2,
      desc: 'Le révélateur : éblouit les créatures des recoins sombres et fait apparaître leurs motifs fluorescents.' },
    { id: 'dash', key: 'Maj', name: 'Pédale d\'accélérateur', short: 'Pédale', unlock: 70000, color: '#69f0ae', cooldown: 0,
      desc: 'Maintiens Maj pour faire filer le demi-avocat plus vite sur les rails.' },
  ];
  FS.toolById = id => FS.TOOLS.find(t => t.id === id);

  // ------------------------------------------------------------------ catégories du Guide
  FS.CATS = [
    { stars: 1, name: 'Le Cru', desc: 'La créature passive ou endormie.' },
    { stars: 2, name: 'Le Saisi', desc: 'En mouvement ou en train de grignoter.' },
    { stars: 3, name: 'Le Mijoté', desc: 'Réaction directe à un outil.' },
    { stars: 4, name: 'Le Chef-d\'Œuvre', desc: 'L\'action secrète, rarissime.' },
  ];
  FS.STAMPS = [ // sceau au beurre selon le total du cliché
    { min: 0, name: 'Rance', color: '#8d6e63' },
    { min: 1500, name: 'Comestible', color: '#9e9d24' },
    { min: 3000, name: 'Délicieux', color: '#f57f17' },
    { min: 4500, name: 'Grand Cru Réserve', color: '#c62828' },
  ];
  FS.stampFor = total => { let s = FS.STAMPS[0]; for (const x of FS.STAMPS) if (total >= x.min) s = x; return s; };

  // Valeur de la pose (barème « Pose & Dynamisme ») et catégorie d'étoiles associée
  FS.POSES = {
    sleep: { score: 200, cat: 1, label: 'endormi' }, idle: { score: 400, cat: 1, label: 'immobile' }, hidden: { score: 150, cat: 1, label: 'caché' },
    walk: { score: 650, cat: 2, label: 'en mouvement' }, eat: { score: 950, cat: 2, label: 'au repas' }, peek: { score: 550, cat: 2, label: 'aux aguets' },
    react: { score: 1500, cat: 3, label: 'en réaction' },
    special: { score: 2500, cat: 4, label: 'COMPORTEMENT SECRET' },
  };

  // ------------------------------------------------------------------ espèces
  // h : hauteur (unités), r : rayon de collision, speed : vitesse de marche, gourmand : attiré par les croûtons
  FS.SPECIES = [
    { id: 'cornichon', name: 'Cornichon Ninja', h: 1.1, r: 0.6, speed: 2.6, gourmand: true,
      home: 'Tiroir à légumes humide', desc: 'Petits, verts et furtifs : ils se cachent derrière les carottes et n\'apparaissent qu\'un instant.',
      secret: 'Lance un croûton sur le couvercle du Bocal Hermétique : trois cornichons bondissent dessus et forment une pyramide acrobatique avec salut martial.' },
    { id: 'bocal', name: 'Bocal Hermétique', h: 2.4, r: 1.2, speed: 0.6, gourmand: false,
      home: 'Tiroir à légumes humide', desc: 'Un gros bocal de saumure qui se dandine. Son couvercle en métal résonne comme un gong.',
      secret: 'Fais sonner le couvercle avec un croûton, puis déclenche le clic piézo : le couvercle s\'envole en tournoyant et la saumure jaillit en fontaine.' },
    { id: 'moisissurex', name: 'Moisissurex', h: 1.3, r: 0.8, speed: 0, gourmand: false,
      home: 'Sur un vieux pot de confiture', desc: 'Une colonie de moisissure bleu-vert qui vit sur un pot de confiture oublié. Elle adore la musique.',
      secret: 'Un clic piézo la fait danser ; un flash pendant la danse révèle ses motifs fluorescents et déclenche une disco en règle.' },
    { id: 'ketchup', name: 'Ketchup-Rex', h: 2.3, r: 0.9, speed: 1.6, gourmand: true,
      home: 'Plateau des condiments', desc: 'Une bouteille rouge aux petites pattes de tyrannosaure. Territoriale, surtout face à la moutarde.',
      secret: 'Lance un croûton exactement à mi-chemin entre le Rex et le Raptor : duel western, jets croisés et arc-en-ciel de sauce au-dessus du rail.' },
    { id: 'moutarde', name: 'Moutarde-Raptor', h: 2.0, r: 0.85, speed: 2.1, gourmand: true,
      home: 'Plateau des condiments', desc: 'Nerveuse, jaune, vive. Une goutte de Tabasco la fait éternuer violemment.',
      secret: 'Même duel que le Ketchup-Rex : un croûton pile entre les deux. Le Tabasco la fait éternuer, ce qui réveille le Rongeur de Mie.' },
    { id: 'miette', name: 'Rongeur de Mie', h: 0.8, r: 0.5, speed: 3.8, gourmand: true, eatT: 2.0,
      home: 'Dans le sac de pain', desc: 'Une souris faite entièrement de mie de pain. Elle sort du sac pour grignoter, puis file se cacher.',
      secret: 'Fais-lui manger trois croûtons de suite : elle gonfle comme une brioche et s\'envole en flottant.' },
    { id: 'oeuf', name: 'Œuf-Ninja', h: 0.9, r: 0.55, speed: 0, gourmand: false,
      home: 'Porte latérale', desc: 'Six œufs immobiles dans leur carton alvéolé. Terrifiés par le moindre bruit… en apparence.',
      secret: 'Croûton sur le troisième œuf (il se fissure), Tabasco dans la fissure (il vibre), puis clic piézo : les six s\'assemblent en Omelette Suprême ailée qui s\'envole en spirale.' },
    { id: 'beurre', name: 'Limace de Beurre', h: 1.0, r: 0.8, speed: 1.0, gourmand: true,
      home: 'Beurrier de la porte', desc: 'Un bloc de beurre qui glisse lentement sur l\'étagère givrée en laissant une traînée grasse.',
      secret: 'Une goutte de Tabasco la fait fondre ; un flash pendant qu\'elle fond la fait grésiller en flammes dorées.' },
    { id: 'olive', name: 'Olive-Cyclope', h: 1.6, r: 0.9, speed: 1.4, gourmand: true,
      home: 'Bocal d\'olives', desc: 'Des olives à l\'œil unique qui sortent de leur bocal pour épier. Larmoyantes au Tabasco.',
      secret: 'Un clic piézo : toutes les olives sortent et dansent un cancan synchronisé sur le bord du bocal.' },
    { id: 'yeti', name: 'Yéti-Roquefort', h: 2.8, r: 1.3, speed: 1.0, gourmand: true,
      home: 'Grotte d\'aluminium', desc: 'Un vieux roquefort poilu roulé en boule au fond de sa grotte en papier d\'alu. Il ronfle.',
      secret: 'Deux gouttes de Tabasco dans ses narines moisies : il éternue un nuage de spores bleues luminescentes qui révèle son cœur crémeux.' },
    { id: 'meduse', name: 'Spaghetti-Méduse', h: 1.6, r: 0.9, speed: 0.9, gourmand: true, flying: true,
      home: 'Plat de lasagnes', desc: 'Des restes de spaghetti qui flottent dans l\'air de la grotte, tentacules de pâtes ondulant doucement.',
      secret: 'Un flash : elle s\'illumine de l\'intérieur et tourne en spirale, bioluminescente.' },
    { id: 'leviathan', name: 'Léviathan-Surgelé', h: 3.2, r: 2.2, speed: 0, gourmand: false,
      home: 'Fond du congélateur', desc: 'Un poisson pané fossilisé sous la banquise. On ne voit qu\'une nageoire dépasser du givre.',
      secret: 'Déclenche le clic piézo près du givre : le choc thermique fissure la banquise et le Léviathan la brise d\'un coup de queue.' },
    { id: 'celeri', name: 'Céleri-Girafe', h: 2.6, r: 0.8, speed: 1.2, gourmand: true,
      home: 'Bac à glaçons', desc: 'De longues branches de céleri au cou interminable qui broutent les glaçons du compartiment.',
      secret: 'Attire deux Céleris-Girafes sur le même croûton : ils croisent le cou et se font un bisou givré.' },
    { id: 'pois', name: 'Petit-Pois Pingouin', h: 0.7, r: 0.4, speed: 1.8, gourmand: true,
      home: 'Sac de petits pois', desc: 'Une colonie de petits pois qui se dandinent comme des manchots et glissent sur le ventre.',
      secret: 'Quand le Léviathan brise la glace, les pois terrifiés s\'empilent en une tour tremblante.' },
    { id: 'sorbet', name: 'Sorbet-Volcan', h: 2.0, r: 1.1, speed: 0, gourmand: false,
      home: 'Pot de crème glacée', desc: 'Un pot de crème glacée dont le couvercle respire. Ça gronde là-dedans.',
      secret: 'Tabasco : éruption de lave rose. Clic piézo pendant l\'éruption : fontaine de cerises et feu d\'artifice de confettis.' },
  ];
  FS.speciesById = id => FS.SPECIES.find(s => s.id === id);

  // ------------------------------------------------------------------ niveaux
  // rail : points [x, z] (spline Catmull-Rom) ; props : décor ; creatures : [espèce, x, z, options]
  FS.LEVELS = [
    {
      id: 'etage', name: 'L\'Étage du Bas', sub: 'Tiroir à légumes et plateau des condiments', unlock: 0,
      desc: 'La première virée : le demi-avocat roule du bac à légumes jusqu\'au plateau des condiments. Cornichons furtifs, bocal qui résonne, duel de sauces.',
      palette: { floor: '#d6ead8', floor2: '#c5dcc8', wall: '#e8f3f7', fog: '#dfeef2', fogD: 55, sky: '#f3f8fa', light: '#fff9d6' },
      rail: [[0, -8], [0, 10], [2, 30], [8, 52], [3, 72], [-5, 88], [-3, 108], [0, 128], [-4, 142], [-6, 156], [0, 170], [0, 182]],
      props: [
        { kind: 'lettuce', x: -9, z: 20, s: 4 }, { kind: 'carrot', x: 11, z: 36, s: 1, rot: 0.3 }, { kind: 'carrot', x: 12.5, z: 40, s: 1, rot: -0.2 }, { kind: 'carrot', x: 13, z: 44, s: 1, rot: 0.1 },
        { kind: 'tomato', x: -8, z: 48, s: 1.6 }, { kind: 'tomato', x: -10.5, z: 50, s: 1.4 }, { kind: 'pepper', x: 14, z: 60, s: 2.2 },
        { kind: 'jar', x: -8, z: 78, s: 2.2, label: 'Confiture', color: '#8e3b46' }, // le Moisissurex est dessus
        { kind: 'yogurt', x: 8, z: 92, s: 2 }, { kind: 'yogurt', x: 11, z: 94, s: 2 }, { kind: 'milk', x: -12, z: 100, s: 3.5 },
        { kind: 'bread', x: 6, z: 150, s: 3 }, { kind: 'jar', x: -13, z: 164, s: 2.6, label: 'Mayo', color: '#f1e6b3' },
        { kind: 'wallback', z: 194 }, { kind: 'wallside', x: -17 }, { kind: 'wallside', x: 17 },
      ],
      creatures: [
        ['bocal', 7.5, 44], ['cornichon', 10, 38, { hideAt: [11, 36] }], ['cornichon', 11.5, 42, { hideAt: [12.5, 40] }], ['cornichon', 12, 46, { hideAt: [13, 44] }],
        ['moisissurex', -8, 78, { y: 2.3 }],
        ['ketchup', -6, 118], ['moutarde', 6, 118],
        ['miette', 6, 150, { hideAt: [6, 150] }],
      ],
    },
    {
      id: 'porte', name: 'La Porte Latérale', sub: 'Beurrier, boîte d\'œufs et bocaux', unlock: 10000,
      desc: 'Les étagères de la porte : un bloc de beurre qui glisse, six œufs qui font semblant de dormir, des olives qui épient. Trois outils pour une omelette.',
      palette: { floor: '#e9eef2', floor2: '#dde4ea', wall: '#f4f6f8', fog: '#eef2f5', fogD: 60, sky: '#f7f9fb', light: '#fffbe0' },
      rail: [[0, -8], [0, 14], [-2, 34], [3, 56], [0, 76], [-4, 96], [0, 116], [2, 136], [0, 156], [0, 176]],
      props: [
        { kind: 'butterdish', x: 8, z: 26, s: 3 }, { kind: 'bottle', x: -10, z: 30, s: 3.2, color: '#2e7d32' }, { kind: 'bottle', x: -12, z: 36, s: 3.6, color: '#6d4c41' },
        { kind: 'carton', x: -7.5, z: 66, s: 1 }, // boîte d'œufs (les œufs sont des créatures)
        { kind: 'jar', x: 7.5, z: 94, s: 2.4, label: 'Olives', color: '#7cb342' }, { kind: 'jar', x: -9, z: 122, s: 2.2, label: 'Moutarde', color: '#f9a825' },
        { kind: 'jar', x: -7.5, z: 128, s: 2.4, label: 'Confiture', color: '#8e3b46' },
        { kind: 'bottle', x: 10, z: 150, s: 3.4, color: '#b71c1c' }, { kind: 'carrot', x: 11, z: 140, s: 1, rot: 0.5 },
        { kind: 'wallback', z: 188 }, { kind: 'wallside', x: -15 }, { kind: 'wallside', x: 15 },
      ],
      creatures: [
        ['beurre', 7, 36, { patrol: [[7, 20], [7, 50]] }],
        ['oeuf', -9, 65, { idx: 0 }], ['oeuf', -7.5, 65, { idx: 1 }], ['oeuf', -6, 65, { idx: 2 }], ['oeuf', -9, 67, { idx: 3 }], ['oeuf', -7.5, 67, { idx: 4 }], ['oeuf', -6, 67, { idx: 5 }],
        ['olive', 7.5, 94, { jar: [7.5, 94] }], ['olive', 8.1, 94.6, { jar: [7.5, 94] }], ['olive', 6.9, 94.6, { jar: [7.5, 94] }],
        ['moisissurex', -7.5, 128, { y: 2.5 }],
        ['bocal', 9, 150], ['cornichon', 12, 144, { hideAt: [11, 140] }], ['cornichon', 11, 154, { hideAt: [11, 140] }], ['cornichon', 12.5, 150, { hideAt: [11, 140] }],
      ],
    },
    {
      id: 'grotte', name: 'La Grotte d\'Aluminium', sub: 'Restes emballés et plat de lasagnes', unlock: 30000,
      desc: 'Un tunnel de papier d\'aluminium froissé, sombre et brillant. Le Yéti-Roquefort y ronfle, des spaghetti flottent dans l\'air.',
      palette: { floor: '#8f979c', floor2: '#7c858a', wall: '#aab3b8', fog: '#5f6a70', fogD: 42, sky: '#4c565c', light: '#c9d6dc', dark: true },
      rail: [[0, -8], [0, 12], [-3, 30], [2, 48], [6, 66], [0, 84], [-5, 102], [-2, 122], [2, 142], [0, 160], [0, 180]],
      props: [
        { kind: 'foil', x: -10, z: 20, s: 5 }, { kind: 'foil', x: 11, z: 28, s: 4 }, { kind: 'lasagna', x: 9, z: 50, s: 4 }, { kind: 'foil', x: -12, z: 58, s: 6 },
        { kind: 'cave', x: -9, z: 70, s: 6 }, { kind: 'foil', x: 12, z: 86, s: 4.5 }, { kind: 'bread', x: -9, z: 112, s: 3 }, { kind: 'foil', x: 11, z: 118, s: 5 },
        { kind: 'yogurt', x: 10, z: 138, s: 2 }, { kind: 'foil', x: -11, z: 150, s: 5 },
        { kind: 'wallback', z: 192 }, { kind: 'wallside', x: -16 }, { kind: 'wallside', x: 16 },
      ],
      creatures: [
        ['meduse', 7, 40, { y: 2.2, patrol: [[7, 34], [4, 48]] }], ['meduse', -6, 96, { y: 2.6, patrol: [[-6, 90], [-8, 104]] }],
        ['yeti', -8, 70, { facing: 1.2 }],
        ['miette', -9, 112, { hideAt: [-9, 112] }], ['miette', 9, 118, { hideAt: [9, 118] }],
        ['ketchup', -6, 148], ['moutarde', 7, 150],
      ],
    },
    {
      id: 'congelo', name: 'Le Fond du Congélateur', sub: 'Banquise, petits pois et glaçons', unlock: 55000,
      desc: 'Brume glacée et givre partout. Des pingouins-petits-pois, des girafes de céleri, un pot de crème glacée qui gronde, et quelque chose sous la banquise.',
      palette: { floor: '#dff2fb', floor2: '#cbe6f4', wall: '#e9f6fc', fog: '#d3e9f4', fogD: 38, sky: '#eaf6fb', light: '#ffffff', ice: true },
      rail: [[0, -8], [0, 12], [3, 32], [-2, 52], [-6, 72], [-2, 92], [4, 112], [0, 132], [0, 152], [0, 172]],
      props: [
        { kind: 'icecube', x: -9, z: 18, s: 2.2 }, { kind: 'icecube', x: 11, z: 24, s: 1.8 }, { kind: 'peabag', x: 12, z: 84, s: 4 },
        { kind: 'icewall', x: -11, z: 74, s: 7 }, // le Léviathan dort dessous
        { kind: 'icecube', x: 11, z: 70, s: 2.5 }, { kind: 'icecube', x: 10, z: 104, s: 2 }, { kind: 'icecube', x: 12, z: 108, s: 1.6 }, { kind: 'icecube', x: 9, z: 112, s: 2.2 },
        { kind: 'tub', x: -9, z: 130, s: 3 }, { kind: 'icecube', x: 8, z: 148, s: 2 }, { kind: 'peabag', x: -10, z: 152, s: 3.5 },
        { kind: 'wallback', z: 184 }, { kind: 'wallside', x: -16 }, { kind: 'wallside', x: 16 },
      ],
      creatures: [
        ['pois', 7, 80], ['pois', 8.5, 82], ['pois', 6, 84], ['pois', 9, 86], ['pois', 7.5, 88], ['pois', 5.5, 81],
        ['leviathan', -9, 74, { facing: 1.3 }],
        ['celeri', 8, 100, { patrol: [[8, 96], [7, 108]] }], ['celeri', 10, 110, { patrol: [[10, 104], [11, 114]] }], ['celeri', 6, 114, { patrol: [[6, 110], [5, 118]] }],
        ['sorbet', -9, 130, { facing: 1.0 }],
        ['pois', -7, 152], ['pois', -8.5, 154], ['pois', -6, 156],
      ],
    },
  ];
  FS.levelById = id => FS.LEVELS.find(l => l.id === id);

  // ------------------------------------------------------------------ Chef Fernand « Le Fin Museau »
  FS.FERNAND = {
    intro: ['Alors, qu\'est-ce qu\'on m\'apporte dans l\'assiette aujourd\'hui ?', 'Posez ça sous ma loupe. Et pas de bouillie floue, j\'ai déjà mangé.', 'Montrez-moi vos clichés. Je juge l\'appétence, pas la nature, mon petit.'],
    bad: ['C\'est quoi cette bouillie floue ? Même la moisissure du fond refuserait de s\'y coller ! {pts} points, et je suis généreux sur l\'assaisonnement !', 'On voit à peine le sujet. Tu photographies le frigo ou son contenu ? {pts} points.', 'Trop loin, trop fade. Un bouillon sans os. {pts} points.'],
    meh: ['Mouais... Un aliment de face, sans sel, sans poivre. Ça manque cruellement de texture, mon garçon. {pts} points.', 'Correct. Comestible. Comme un sandwich de gare. {pts} points.', 'Le cadrage est honnête, mais la bête ne FAIT rien. Elle attend le bus ? {pts} points.'],
    good: ['Ah ! Voilà de la texture ! Ça croustille, ça vit ! {pts} points.', 'Pas mal du tout. Un plat du jour que je resservirais. {pts} points.', 'Le sujet bouge, la lumière accroche, ça se mange ! {pts} points.'],
    great: ['OH ! LE DRAPÉ DU FROMAGE ! CETTE GOUTTE DE GRAS QUI SCINTILLE ! C\'est pas une photo, c\'est un trois étoiles Michelin ! {pts} points !', 'MAGNIFIQUE ! Je sens l\'ail d\'ici ! {pts} points, et je double la portion de compliments !', 'Je… j\'ai une larme de beurre fondu à l\'œil. {pts} points. Encadrez-moi ça au-dessus du grille-pain !'],
    back: 'Tu me montres le mauvais côté du gigot !', cut: 'Il manque un bout ! Qui a coupé la garniture ?', far: 'Une miette à l\'horizon. Approche-toi, bon sang.',
    close: 'Trop collé à l\'assiette, ça déborde partout.', others: 'Et quelle garniture autour ! J\'adore une assiette bien remplie.',
    special: 'Un COMPORTEMENT SECRET ! Le plat signature ! Ça, c\'est de la haute cuisine !',
    none: 'Rien ? Pas une seule photo de cette espèce ? Mon grille-pain est plus productif que toi.',
  };

  // ------------------------------------------------------------------ utilitaires
  FS.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  FS.lerp = (a, b, t) => a + (b - a) * t;
  FS.fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  FS.rng = seed => { let s = (seed >>> 0) || 1; const f = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; f.int = n => Math.floor(f() * n); f.range = (a, b) => a + f() * (b - a); f.pick = arr => arr[f.int(arr.length)]; return f; };
  FS.catmull = (pts, t) => { // t ∈ [0, pts.length-1]
    const n = pts.length; const i = FS.clamp(Math.floor(t), 0, n - 2), u = t - i;
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n - 1)];
    const f = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
    return [f(0), f(1)];
  };
})(window.FS);
