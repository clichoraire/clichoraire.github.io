// Éditeur de tableaux : une grille de caractères (légende des cartes d'exploration) peinte à la souris sur la carte 3D,
// un tiroir d'outils par onglets, test dans l'Aventure, sauvegarde dans le navigateur, export / import JSON.
(function (BK) {
  'use strict';
  const TABS = [
    { id: 'decor', name: 'Décor', items: [
      {opts:'supportedBridge',name:'Pont sur colonnes',icon:'🪵',hint:'Peins les cases du pont surélevé avec une même lettre, puis ajoute ses colonnes.'},{opts:'bridgeColumn',name:'Grosse colonne du pont',icon:'🏛️',hint:'À poser sur une case du pont : la colonne apparaît dessous. Seule une bombe bien gonflée la casse. Quand la dernière colonne tombe, cette section du pont s’écroule.'},
      {opts:'blastDrawbridge',name:'Pont-levis à bombe',icon:'🌉',hint:'Clique au bord du fossé : le pont commence relevé. Une explosion contre sa base le fait tomber pour traverser. Choisis sa direction et sa longueur.'},
      {boat:true,name:'Barque',icon:'🛶',hint:'À poser sur l’eau près d’une rive. Embarquer avec Entrée ou la pancarte, puis ramer avec les directions.'},
      {ch:'"',deco:'crackedstone',opts:'secretWall',name:'Mur fissuré · pièce secrète',icon:'🪨',hint:'Une bombe le brise. Construis la pièce derrière, puis choisis la direction, la largeur et la profondeur à cacher. Une même lettre relie plusieurs entrées.'},
      { ch: '~', name: 'Eau', icon: '🌊' }, { ch: ' ', name: 'Vide (ciel)', icon: '☁️' }, { ch: '.', name: 'Pierre', icon: '⬜' }, { ch: ',', name: 'Gazon', icon: '🟩' },
      { ch: ':', name: 'Pierre haute', icon: '🔼' }, { ch: ';', name: 'Gazon haut', icon: '🟢' }, { ch: '/', name: 'Rampe', icon: '📐' }, { ch: '=', name: 'Pont de bois', icon: '🪵' },
      { ch: '-', name: 'Chemin de terre', icon: '🟫' }, { ch: '_', name: 'Rue', icon: '🛣️' }, { ch: '%', name: 'Place pavée', icon: '🧩' }, { ch: '&', name: 'Trottoir', icon: '⬜' }, { ch: '!', name: 'Bordure', icon: '🧱' },
      { ch: 'y', name: 'Plancher de bois', icon: '🪵' }, { ch: 'z', name: 'Carrelage', icon: '🏁' }, { ch: 'q', name: 'Tapis', icon: '🟥' },
      {tool:'raiseHalf',name:'Demi-étage +½',icon:'↗️',hint:'Monte le sol d’un demi-étage. Relie les hauteurs avec une rampe ou un ascenseur.'},{tool:'lowerHalf',name:'Demi-étage −½',icon:'↘️'},
      { tool: 'raise', name: 'Étage +1', icon: '⬆️', hint: 'Monte la case d’un étage (jusqu’à 4). Une rampe relie deux étages voisins ; le héros peut sauter en bas d’un rebord, pas y remonter.' }, { tool: 'lower', name: 'Étage −1', icon: '⬇️', hint: 'Descend la case d’un étage' },
      { ch: '[', name: 'Lave', icon: '🌋', hint: 'Ça brûle : 5 points de vie à chaque fois qu’on y met le pied. Les monstres n’y vont pas, une bombe lancée dedans explose.' }, { ch: ']', name: 'Glace', icon: '🧊', hint: 'On glisse : les commandes répondent lentement et on continue sur sa lancée' }, { ch: ')', name: 'Neige', icon: '❄️', hint: 'Sol tout blanc ; les pas du héros y crissent doucement' },
      {ch:'{',opts:'autoLift',name:'Ascenseur automatique',icon:'↕️',hint:'Monte et redescend tout seul. Choisis la hauteur, la durée du trajet et la pause aux deux paliers.'},{ch:'(',opts:'movingPlatform',name:'Plateforme mobile',icon:'🟨',hint:'Un clic trace un trajet horizontal ou vertical au-dessus du vide. Prévois un quai au même étage à chaque extrémité.'},
      { ch: '{', name: 'Ascenseur', icon: '🛗', hint: 'Plateau surélevé sur un poteau. Botte une bombe depuis le sol voisin pour la glisser sous le plateau. Son explosion soulève le plateau de deux étages, puis il redescend. Une bombe posée dessus reste dessus.' }, { ch: '(', name: 'Rail de plateforme', icon: '🛤️', hint: 'Peins une ligne de rails (droite, en L ou en serpent) au fond d’une fosse : une plateforme y glisse à l’étage 1 et fait l’aller-retour. On monte dessus depuis une case d’étage 1 à côté ; si on en descend au-dessus de la fosse, on tombe en bas.' }, { ch: '}', name: 'Bloc-piston', icon: '⏫', hint: 'Une bombe qui explose dessus le fait monter d’un étage, pour de bon (jusqu’à 4).' } ] },
    { id: 'blocs', name: 'Blocs', items: [
      { ch: 'r', name: 'Roc', icon: '🪨' }, { ch: '#', name: 'Bloc de ciment', icon: '⬛' }, { ch: 'W', name: 'Mur de brique', icon: '🧱', hint: 'Se casse avec une bombe' }, { ch: 'x', name: 'Buisson', icon: '🌿' }, { ch: 'X', name: 'Buisson haut', icon: '🌳' },
      { ch: '"', deco: 'melon', name: 'Melon d’eau', icon: '🍉', hint: 'Bloc cubique aux coins ronds : se casse avec une bombe' }, { ch: '"', deco: 'cheese', name: 'Bloc de fromage', icon: '🧀', hint: 'Bloc cubique : se casse avec une bombe' }, { ch: '"', deco: 'gift', name: 'Cadeau', icon: '🎁', hint: 'Bloc cubique : se casse avec une bombe' }, { ch: '"', deco: 'dirtblock', name: 'Bloc de terre', icon: '🟫', hint: 'Bloc cubique à dessus de gazon : se casse avec une bombe' },
      { ch: 'T', name: 'Arbre', icon: '🌲', opts: 'tree' }, { ch: '*', name: 'Fleurs', icon: '🌼', opts: 'flowers', hint: 'Décoration : on marche dessus' },
      { ch: 'P', name: 'Baril dormant', icon: '🛢️', hint: 'Une flamme l’allume : l’étincelle suit la traînée de poudre et détone au bout' }, { ch: 'p', name: 'Traînée de poudre', icon: '✨', hint: 'Relie le baril à la porte scellée, case par case' }, { ch: 'Q', name: 'Porte scellée', icon: '🔮', hint: 'Seule la détonation magique l’ouvre' },
      { ch: 'v', name: 'Métal, bois devant', icon: '🔩', hint: 'Indestructible sauf par sa face en bois (au sud, vers la caméra)' }, { ch: '^', name: 'Métal, bois derrière', icon: '🔩', hint: 'Face en bois au nord' }, { ch: '<', name: 'Métal, bois à gauche', icon: '🔩', hint: 'Face en bois à l’ouest' }, { ch: '>', name: 'Métal, bois à droite', icon: '🔩', hint: 'Face en bois à l’est' } ] },
    { id: 'objets', name: 'Objets', items: [
      ...['antidote', 'wood', 'bombdiarrhea', 'shortfuse', ...BK.BOMB_POWERS].map(id => ({ch:'"',pickup:id,name:BK.ITEMS[id].name,icon:BK.ITEMS[id].icon,hint:BK.ITEMS[id].desc})),
      { ch: '"', pickup: 'axe', name: 'Hache', icon: '🪓', hint: 'À ramasser dans le sac. Utiliser face à un arbre pour l’abattre ; la hache se garde.' },
      { ch: '1', name: 'Départ', icon: '🚩' }, { ch: 'G', name: 'Portail de sortie', icon: '🌀', hint: 'Fin du tableau : on est téléporté vers la suite' }, { ch: '|', name: 'Diamant', icon: '💎', hint: 'Fin du tableau : grande célébration quand on l’attrape (+1000 points)' }, { ch: 'h', name: 'Cœur', icon: '❤️' }, { ch: 'k', name: 'Carte d’or', icon: '🃏' }, { ch: '$', name: 'Pièce d’or', icon: '<i class="goldcoin"></i>' },
      { ch: 'A', name: 'Cible', icon: '🎯', opts: 'target', hint: 'Choisis sa couleur (huit) : elle ouvre les portes de la même couleur' }, { ch: 'a', name: 'Porte', icon: '🚧', opts: 'gate', hint: 'Grille, ou pont-levis sur l’eau ; s’ouvre avec la cible de la même couleur' } ] },
    { id:'piece', name:'Pièce', roomOnly:true, items:[
      {ch:'y',name:'Plancher de bois',icon:'🪵',hint:'Le même plancher que dans la maison. Clique ou glisse pour agrandir la pièce.'},
      {ch:'#',name:'Mur intérieur',icon:'🧱',hint:'Le même mur solide que le contour de la pièce.'},
      {ch:'G',name:'Sortie de la pièce',icon:'🚪',hint:'Place une ou plusieurs sorties où tu veux. Chaque sortie ramène dehors.'},
      {ch:' ',name:'Vide autour de la pièce',icon:'☁️'},
      {ch:'"',deco:'lamp',name:'Lumière',icon:'💡',opts:'light',hint:'Choisis le modèle, la couleur et l’orientation.'}, {ch:'"',deco:'chair',name:'Siège',icon:'🪑',opts:'seat',hint:'Choisis une chaise ou un tabouret, puis son orientation.'}
    ] },
    { id: 'maisons', name: 'Maisons', items: [ { ch: 'H', name: 'Poser une maison', icon: '🏠', opts: 'house', hint: 'La porte se place sur la case cliquée ; les murs suivent la taille choisie' } ] },
    { id: 'deco', name: 'Déco', items: [
      {ch:'"',deco:'greenpipe',opts:'pipe',name:'Tuyau vert · passage',icon:'🟢',hint:'Place deux tuyaux dans ce tableau (ou cette pièce), puis choisis la même liaison A–H pour les relier. On voyage dans les deux sens.'},
      {ch:'"',deco:'waterjet',name:'Jet d’eau',icon:'💦',hint:'Repousse très fort sans dégâts. Choisis son orientation.'},
      {ch:'"',deco:'firebar',opts:'firebar',name:'Barre de feu tournante',icon:'🔥',hint:'Une rangée de flammes tourne autour du pivot. Évite les flammes !'},
      {ch:'"',deco:'terrarium',name:'Terrarium à escargots',icon:'🐌',hint:'Petit jardin vitré : approche-toi pour y installer les escargots de ton sac ou les reprendre.'},
      {ch:'"',deco:'aquarium',name:'Aquarium animé',icon:'🐠',hint:'Petits poissons colorés, plantes aquatiques et bulles animées.'},
      {ch:'"',deco:'fishing_basket',name:'Panier de pêche en osier',icon:'🧺'},
      {ch:'"',deco:'fish_trout',name:'Poisson sur bois flotté',icon:'🐟',opts:'fishMount',hint:'Choisis truite mouchetée, achigan ou brochet avant de poser le montage.'},
      {ch:'"',deco:'antlers_moose',name:'Panache sur écusson',icon:'🦌',opts:'antlers'},
      {ch:'"',deco:'fly_frame',name:'Cadre de mouches à pêche',icon:'🪶',opts:'wallArt'},
      {ch:'"',deco:'lumber_saw',name:'Scie de bûcheron décorée',icon:'🪚',opts:'wallArt'},
      {ch:'"',deco:'trophy_cup',name:'Trophée',icon:'🏆',opts:'trophy',hint:'Un seul outil, trois modèles : coupe dorée, étoile argentée ou écusson de bronze.'},
 {ch:'"',deco:'lamp',name:'Lumière',icon:'💡',opts:'light',hint:'Choisis le modèle, la couleur et l’orientation.'}, {ch:'"',deco:'chair',name:'Siège',icon:'🪑',opts:'seat',hint:'Choisis une chaise ou un tabouret, puis son orientation.'},
      { ch: 'n', name: 'Banc', icon: '🪑' }, { ch: 'u', name: 'Puits', icon: '⛲' }, { ch: 'w', name: 'Barrière', icon: '🚧', hint: 'Se relie aux barrières voisines' }, { ch: 's', name: 'Statue', icon: '🗿', opts:'statue' }, { ch: 'I', name: 'Pilier', icon: '🏛️' },
      { ch: 'o', name: 'Pierre tombale', icon: '🪦' }, { ch: 'j', name: 'Citrouille', icon: '🎃', hint: 'Une bombe la casse en trois morceaux comestibles : +5 points de vie chacun (Q ou W).' }, { ch: 'O', name: 'Coffre', icon: '🧰' }, { ch: 'L', name: 'Bûche', icon: '🪵' }, { ch: 'K', name: 'Caisse de bois', icon: '📦', hint: 'Se casse avec une bombe' },
      { ch: 'm', name: 'Champignons', icon: '🍄', hint: 'On marche dessus' }, { ch: 'g', name: 'Hautes herbes', icon: '🌾', hint: 'On marche dessus' }, { ch: '"', deco: 'carrot', name: 'Carotte à cueillir', icon: '🥕', hint: 'Le héros marche dessus pour la cueillir. Q ou W : il la lance ; un lapin maléfique court la manger et devient gentil.' },
      { ch: '2', name: 'Pancarte', icon: '🪧' }, { ch: '3', name: 'Tonneau', icon: '🛢️' }, { ch: '4', name: 'Botte de foin', icon: '🌾' }, { ch: '5', name: 'Épouvantail', icon: '🧑‍🌾' }, { ch: '6', name: 'Pot de fleurs', icon: '🌷' }, { ch: '7', name: 'Boîte aux lettres', icon: '📫' }, { ch: '8', name: 'Souche', icon: '🪵' }, { ch: '9', name: 'Cactus', icon: '🌵' }, { ch: '0', name: 'Charrette', icon: '🛒' }, { ch: 'J', name: 'Fontaine', icon: '⛲' },
      { ch: '"', deco: 'wheel', name: 'Roue de charrette', icon: '🛞' }, { ch: '"', deco: 'trough', name: 'Abreuvoir', icon: '🪣' }, { ch: '"', deco: 'banner', name: 'Bannière', icon: '🚩' }, { ch: '"', deco: 'market', name: 'Étal de marché', icon: '🏪' }, { ch: '"', deco: 'beehive', name: 'Ruche', icon: '🍯', hint: 'Une abeille (petite guêpe) en sort dès que le héros est sur une case collée à la ruche' },
      { ch: '"', deco: 'volcano', name: 'Volcan', icon: '🌋', hint: '3 × 3 cases autour de la case cliquée : il fume, la lave coule, et il crache des blocs de lave toutes les 6 à 10 s' }, { ch: '"', deco: 'mountain', name: 'Montagne', icon: '⛰️', opts: 'mountain', hint: 'Choisis largeur, profondeur, hauteur et type ; la case cliquée est au milieu de sa rangée du bas' }, { ch: '"', deco: 'rock', name: 'Roche', icon: '🪨', hint: 'Avec les gants de force (au magasin), le héros la soulève (Espace devant) et la lance comme une bombe : 2 points de dégâts aux monstres, et elle rebondit une case de plus. Elle casse après deux lancers.' }, { ch: '"', deco: 'mossrock', name: 'Rocher moussu', icon: '🪨' }, { ch: '"', deco: 'logpile', name: 'Tas de bûches', icon: '🪵' }, { ch: '"', deco: 'bigmushroom', name: 'Gros champignon', icon: '🍄', hint: 'Trampoline : saute dessus depuis une bombe, il te renvoie 3 cases plus loin' }, { ch: '"', deco: 'bones', name: 'Ossements', icon: '🦴', hint: 'On marche dessus' }, { ch: '"', deco: 'skullpile', name: 'Pile de crânes', icon: '💀' },
      { ch: '"', deco: 'snowman', name: 'Bonhomme de neige', icon: '⛄' }, { ch: '"', deco: 'snowpine', name: 'Sapin enneigé', icon: '🌲' }, { ch: '"', deco: 'baretree', name: 'Arbre nu', icon: '🌳' }, { ch: '"', deco: 'icerock', name: 'Rocher de glace', icon: '🧊' }, { ch: '"', deco: 'icecrystal', name: 'Cristaux de glace', icon: '💎' }, { ch: '"', deco: 'igloo', name: 'Igloo', icon: '🏔️' }, { ch: '"', deco: 'sled', name: 'Traîneau', icon: '🛷' }, { ch: '"', deco: 'skis', name: 'Skis', icon: '🎿' }, { ch: '"', deco: 'snowpile', name: 'Tas de neige', icon: '❄️', hint: 'On marche dessus' }, { ch: '"', deco: 'snowballs', name: 'Boules de neige', icon: '⚪' },
      { ch:'M',name:'Table',icon:'🍽️',opts:'table' }, { ch: 'S', name: 'Lit', icon: '🛏️' }, { ch: 'U', name: 'Bibliothèque', icon: '📚' }, { ch: 'Z', name: 'Chaudron', icon: '🫕' }, { ch: 't', name: 'Plante en pot', icon: '🪴' }, { ch: '@', name: 'Piano', icon: '🎹', hint: 'Instrument : la musique choisie dans l’onglet Magasin joue dans la pièce' }, { ch: '"', deco: 'jukebox', name: 'Juke-box', icon: '📻', hint: 'Instrument : la musique choisie dans l’onglet Magasin joue dans la pièce' }, { ch: '"', deco: 'guitar', name: 'Guitare', icon: '🎸', hint: 'Instrument : fait jouer la musique de la pièce' }, { ch: '"', deco: 'drum', name: 'Tambour', icon: '🥁', hint: 'Instrument : fait jouer la musique de la pièce' }, { ch: '?', name: 'Enclume', icon: '⚒️' },
      { ch: 'N', name: 'Comptoir', icon: '🛒', hint: 'Se raccorde aux comptoirs voisins' }, { ch: 'V', name: 'Étagère', icon: '🗄️' } ] },
    { id: 'animaux', name: 'Animaux', items: [
      { enemy: 'escargot', opts:'snail', name: 'Escargot', icon: '🐌', hint: 'Tout petit et pacifique : rampe très lentement, se cache dans sa coquille à ton approche et ressort doucement quand tu t’éloignes.' },
      { enemy: 'cerf', name: 'Cerf', icon: '🦌', hint: 'Paisible. Donne deux morceaux de viande : cuits si une bombe le tue, crus avec un autre coup.' },
      { enemy: 'lapin_gentil', name: 'Lapin gentil', icon: '🐇', hint: 'Paisible. Donne un morceau de viande : cuit si une bombe le tue, cru autrement.' },
      { enemy: 'chien', name: 'Chien', icon: '🐶', hint: 'Pacifique : renifle et remue la queue. Approche-toi : il te suit un peu. Entrée ou Shift pour le caresser.' },
      { enemy: 'chat', opts:'cat', name: 'Chat', icon: '🐱', hint: 'Pacifique : marche et se repose assis. Il te suit un peu quand tu approches. Entrée ou Shift pour le caresser.' },
      { enemy: 'oiseau', name: 'Oiseau', icon: '🐦', hint: 'Pacifique : petits vols près du sol, puis se pose. Ces animaux restent près de leur point de départ et ne comptent pas comme monstres.' },
    ] },
    { id: 'ennemis', name: 'Ennemis', items: [
      { enemy: 'bombtower', name: 'Tour de bombardier', icon: '🏰', hint: 'Lance une bombe par la fenêtre pour la détruire. Tu peux aussi renvoyer celles du bombardier !' }, { enemy: 'ballon', name: 'Ballounet', icon: '🎈' }, { enemy: 'gluant', name: 'Gluant', icon: '🟢' }, { enemy: 'fantome', name: 'Fantôme', icon: '👻' }, { enemy: 'chevalier', name: 'Chevalier', icon: '🛡️' }, { enemy: 'lanceur', name: 'Lance-fusées', icon: '🚀', hint: 'Bloc solide qui lance des fusées à tes trousses ; elles explosent au contact, une flamme les détruit. 3 bombes pour le casser.' }, { enemy: 'canon', name: 'Canon', icon: '⚫', hint: 'Vise le héros, se gonfle, puis tire un boulet en ligne droite qui s’arrête au premier bloc. 2 bombes.' }, { enemy: 'canon_rouge', name: 'Canon rouge', icon: '🔴', hint: 'Boulets de feu ; 4 bombes pour le casser.' }, { enemy: 'canon_bleu', name: 'Canon bleu', icon: '🔵', hint: 'Tire deux fois plus souvent, mais ses boulets bleus vont deux fois moins vite ; 4 bombes.' }, { enemy: 'marin', name: 'Monstre marin', icon: '🐉', hint: 'Dans l’eau ou sur terre : ouvre la gueule, y fait grossir une boule de poison et la crache vers le héros. 3 bombes.' }, { enemy: 'cogneur', name: 'Cogneur', icon: '🔨', hint: 'Frappe le sol avec son marteau : séisme sur les cases voisines' }, { enemy: 'cracheur', name: 'Cracheur de feu', icon: '🔥', hint: 'Crache des boules de feu qui rebondissent ; l’eau les éteint' }, { enemy: 'glaceur', name: 'Souffleur de glace', icon: '❄️', hint: 'Ses éclats gèlent le héros sur place un instant' }, { enemy: 'magicien', name: 'Magicien', icon: '🧙', hint: 'Se téléporte ; sa magie avance, s’arrête, revient vers toi, trois fois' }, { enemy: 'taupe', name: 'Taupe', icon: '🕳️', hint: 'Avance sous terre, surgit près de toi et lance des mottes de terre en cloche' }, { enemy: 'guepe', name: 'Guêpe', icon: '🐝', hint: 'Attaque seulement à moins de 3 cases. Vole par-dessus l’eau et les blocs ; les explosions la touchent aussi en vol' }, { enemy: 'abeille', name: 'Abeille', icon: '🐝', hint: 'Petite abeille (5 de dégâts) : placée dans le tableau, attaque seulement à moins de 3 cases. Les abeilles des ruches défendent leur ruche' }, { enemy: 'plante', name: 'Plante carnivore', icon: '🌺', hint: 'Sort du sol régulièrement pour claquer des dents' },
      { enemy: 'squelette', name: 'Squelette', icon: '💀', hint: 'Lance son os en boomerang jusqu’à 3 cases ; il reste figé tant que l’os n’est pas revenu' }, { enemy: 'squelette_rouge', name: 'Squelette rouge', icon: '☠️', hint: 'Os jusqu’à 5 cases, 1,3 × plus rapide' }, { enemy: 'squelette_noir', name: 'Squelette noir', icon: '🦴', hint: 'Marche 1,5 × plus vite, os jusqu’à 7 cases, 1,5 × plus rapide' },
      { enemy: 'chevalier_rouge', name: 'Chevalier rouge', icon: '🔴', hint: 'Charge plus vite et plus fort (15 points) ; 4 bombes' }, { enemy: 'chevalier_bleu', name: 'Chevalier bleu', icon: '🔵', hint: 'Repart presque tout de suite après une charge et voit plus loin ; 4 bombes' }, { enemy: 'chevalier_dore', name: 'Chevalier doré', icon: '👑', hint: 'Plus fort que le rouge et le bleu réunis : charge très vite, 20 points, 8 bombes' },
      { enemy: 'lapin', name: 'Lapin maléfique', icon: '🐰', hint: 'Bondit, fonce dès qu’il te voit (7 cases), puis souffle 7-8 s. 2 bombes. Une carotte lancée : il la mange et devient gentil.' }, { enemy: 'serpent', name: 'Serpent venimeux', icon: '🐍', hint: 'Rapide ; sa morsure empoisonne (2 points de vie par seconde pendant 6 s). 1 bombe.' },
      { enemy: 'orque', name: 'Orque', icon: '⚔️', hint: 'Armure, épée : fonce sur toi à 6 cases, frappe sans arrêt, mais retourne auprès de son shaman (2 cases) s’il s’éloigne de 4 à 6 cases. 4 bombes.' }, { enemy: 'shaman', name: 'Shaman orque', icon: '🪄', hint: 'Magie plus forte que le magicien (8 cases, 15 points), se téléporte, soigne ses orques. 12 bombes.' },
      { enemy: 'crapaud', name: 'Crapaud géant', icon: '🐸' }, { enemy: 'golem', name: 'Roi Golem', icon: '🗿' } ] },
    { id: 'magasin', name: 'Magasin', items: [
      { ally: true, name: 'Allié', icon:'🤝', opts:'ally', hint:'Personnage à recruter contre de l’or pour le tableau. Sur une chaise ou un tabouret, reste assis jusqu’au recrutement. Ensuite, suit le héros et attaque les monstres.' },
      { npc: true, name: 'Commerçant', icon: '🧑‍🍳', opts: 'npc', hint: 'Un membre de la famille qui tient boutique ; choisis qui, et sa phrase d’accueil. Reste assis si placé sur une chaise ou un tabouret ; les achats restent possibles. Shift à côté de lui pour lui parler.' },
      { shop: true, name: 'Article à vendre', icon: '🏷️', opts: 'shop', hint: 'Pose-le sur le comptoir ou devant. Choisis l’objet, le prix, et s’il se vend une seule fois ou sans limite. Le héros achète avec Shift à côté.' },
    ] },
    { id: 'tableau', name: 'Tableau', form: true, items: [] },
    { id: 'outils', name: 'Outils', items: [ { tool:'rotate',name:'Tourner ↻',icon:'↻',hint:'Clique un meuble ou une décoration pour tourner d’un quart de tour.' }, { tool: 'erase', name: 'Gomme', icon: '🧽' }, { tool: 'fill', name: 'Remplir tout', icon: '🪣', hint: 'Avec le décor choisi' }, { tool: 'undo', name: 'Annuler', icon: '↩️' } ] },
  ];
  const CABIN_VARIANTS = {
    light:[['lamp','Lampadaire'],['candelabra','Chandelier'],['fireplace','Âtre'],['campfire','Feu de camp']],
    seat:[['chair','Chaise'],['stool','Tabouret']],
    table:[['table','Rustique'],['table_round','Ronde'],['table_dining','Table de repas'],['table_low','Table basse']],
    statue:[['statue','Classique'],['statue_mermaid','Sirène'],['statue_thinker','Penseur assis'],['statue_dancer','Danseuse'],['statue_guardian','Gardien à genou']],
    fishMount:[['fish_trout','Truite mouchetée'],['fish_bass','Achigan'],['fish_pike','Brochet']],
    antlers:[['antlers_moose','Orignal'],['antlers_deer','Chevreuil']],
    trophy:[['trophy_cup','Coupe dorée'],['trophy_star','Étoile argentée'],['trophy_shield','Écusson de bronze']]
  };
  TABS.find(t=>t.id==='deco').items.push(...BK.CASTLE_DECOR.map(it=>({ch:'"',deco:it.deco,name:it.name,icon:it.icon})));
  TABS.find(t=>t.id==='deco').items.push(...BK.TRAP_DECOR.map(it=>({ch:'"',...it,opts:'mechanism'})));
  TABS.find(t=>t.id==='deco').items.push(...BK.BIOME_DECOR.map(it=>({ch:'\"',deco:it.deco,name:it.name,icon:it.icon})));
  TABS.find(t=>t.id==='decor').items.push(...BK.DESERT_FLOORS.map(({ch,name,icon})=>({ch,name,icon})));
  TABS.push({id:'bestiary',name:'Bestiaire',items:BK.BESTIARY.map(b=>({enemy:b.id,name:b.name,icon:'👾',category:b.group,hint:b.hint}))});
  for(const a of BK.WILDLIFE){TABS.find(t=>t.id==='animaux').items.push({enemy:a.id,name:a.name,icon:a.icon,hint:'Pacifique : caresse-le deux fois et nourris-le pour qu’il devienne ton ami et aide à combattre. Nourriture dans le sac ou la bulle au-dessus de lui.'});if(a.evil)TABS.find(t=>t.id==='ennemis').items.push({enemy:a.id+'_evil',name:a.name+' maléfique',icon:a.icon,hint:'Hostile : poursuit les héros et attaque au contact.'});}
  const objectItems=TABS.find(t=>t.id==='objets').items;
  for(const [id,def] of Object.entries(BK.ITEMS))if(!def.snailColor&&!objectItems.some(it=>it.pickup===id||({h:'heart',k:'card','$':'coin'})[it.ch]===id))objectItems.push({ch:'\"',pickup:id,name:def.name,icon:def.icon,hint:def.desc});
  const DECO_CATEGORIES = [
    ...BK.BIOME_CATEGORIES.map(cat=>({...cat,keys:BK.BIOME_DECOR.filter(it=>it.category===cat.id).map(it=>it.deco)})),
    {id:'castle',name:'🏰 Château',keys:BK.CASTLE_DECOR.map(it=>it.deco)},
    {id:'pieges',name:'🔥 Pièges',keys:['greenpipe','firebar','waterjet',...BK.TRAP_DECOR.map(it=>it.deco)]},
    {id:'chalet',name:'🐟 Pêche et chalet',keys:['terrarium','aquarium','fishing_basket','fish_trout','antlers_moose','fly_frame','lumber_saw','trophy_cup']},
    {id:'meubles',name:'🪑 Meubles',keys:['lamp','fireplace','chair','stool','table_round','table_dining','table_low','M','S','U','Z','t','+','N','V']},
    {id:'nature',name:'🌿 Nature',keys:['L','m','g','carrot','8','9','volcano','mountain','rock','mossrock','logpile','bigmushroom']},
    {id:'jardin',name:'🌷 Jardin',keys:['l','n','u','w','i','j','4','5','6','7','J','trough','beehive']},
    {id:'statues',name:'🗿 Statues',keys:['s','I','o','statue_mermaid','statue_thinker','statue_dancer','statue_guardian','bones','skullpile']},
    {id:'hiver',name:'❄️ Hiver',keys:['snowman','snowpine','baretree','icerock','icecrystal','igloo','sled','skis','snowpile','snowballs']},
    {id:'musique',name:'🎵 Musique',keys:['@','jukebox','guitar','drum']},
    {id:'village',name:'🏘️ Village',keys:['O','K','2','3','0','wheel','banner','market','?']}
  ];
  for (const it of TABS.find(t=>t.id==='deco').items) it.category=DECO_CATEGORIES.find(c=>c.keys.includes(it.deco||it.ch))?.id || 'village';
  const KEY = 'bk.maps';
  BK.loadMaps = () => { try { return BK.migrateRemedyData(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return []; } };
  BK.saveMaps = maps => { try { localStorage.setItem(KEY, JSON.stringify(maps)); } catch (e) { } };
  BK.deleteMap = id => { BK.saveMaps(BK.loadMaps().filter(m => m.id !== id)); };
  BK.mapToStage = m => ({ id: 'Perso', mapId: m.id, roomExit:!!m.roomExit, music: m.music || '', npcs: m.npcs || [], shop: m.shop || [], houses: m.houses || {}, props: m.props || {}, name: m.name || 'Mon tableau', objective: m.grid.some(l => l.includes('G') || l.includes('|')) ? 'goal' : 'enemies', explore: true, theme: m.theme || 'garden', items: 0.25, map: m.grid, enemies: m.enemies || [],
    hint: m.grid.some(l => l.includes('G') || l.includes('|')) ? 'Un tableau créé dans l’éditeur. Trouve le but !' : 'Un tableau créé dans l’éditeur. Élimine tous les monstres !', world: { name: 'Mes tableaux', theme: m.theme || 'garden' }, custom: true });

  // Pièce intérieure par défaut d'une maison : plancher de bois, départ devant la porte du bas (G = sortie).
  BK.defaultInterior = () => ({ cols: 11, rows: 8, theme: 'interior', base: 'y', grid: ['###########', '#yyyyyyyyy#', '#yyyyyyyyy#', '#yyyyyyyyy#', '#yyyyyyyyy#', '#yyyyyyyyy#', '#yyyy1yyyy#', '#####G#####'], enemies: [], props: {} });
  class Editor {
    // m : { name, cols, rows, theme, base, grid?, enemies? } ; o.parent = { editor, key } quand on édite l'intérieur d'une maison
    constructor(m, o) {
      BK.migrateRemedyData(m);
      this.parent = (o && o.parent) || null;
      this.map = { id: m.id || ('m' + Date.now().toString(36)), name: m.name || 'Mon tableau', cols: m.cols, rows: m.rows, theme: m.theme || 'garden', base: m.base || '~', music: m.music || '' };
      this.grid = m.grid ? (this.parent && this.parent.kind!=='duel' ? BK.roomMap(m.grid,m.roomExit) : m.grid).map(l => l.split('')) : Array.from({ length: m.rows }, () => Array(m.cols).fill(this.map.base));
      this.map.rows=this.grid.length; this.map.roomExit=!!(this.parent && this.parent.kind!=='duel' || m.roomExit);
      this.enemies = (m.enemies || []).map(e => ({ ...e })); this.npcs = (m.npcs || []).map(e => ({ ...e })); this.shop = (m.shop || []).map(e => ({ ...e })); this.houses = Object.assign({}, m.houses || {}); this.props = Object.assign({}, m.props || {}); this.house = { w: 3, d: 2, roof: '#b5452a' }; this.lightColor='default'; this.opts = { light:'lamp', seat:'chair', table:'table', statue:'statue', fishMount:'fish_trout',antlers:'antlers_moose',trophy:'trophy_cup', ally:{id:'richard',price:50,lives:3}, tree: { style: 'feuillu', size: 1 }, flowers: { colors: ['#ff5fc8', '#ffd54a', '#ffffff'] }, target: { letter: 'A' }, gate: { letter: 'A' }, npc: { id: 'richard', line: 'Bienvenue dans ma boutique !' }, shop: { item: 'bomb', price: 30, once: true }, mountain: { w: 3, d: 2, h: 3, type: 'neige' } };
      this.orientation=0; this.undoStack = []; this.tab = 'decor'; this.item = this.map.roomExit ? TABS.find(t=>t.id==='piece').items[0] : TABS[0].items.find(it=>it.ch==='.'); this.hover = null; this.painting = false; this.t = 0; this.msg = ''; this.msgT = 0;
      this.cam = new BK.Camera(BK.W, BK.H); this.cam.fit(17, 14, { top: 60, bottom: 24, left: 24, right: 24 });
      this.view = { x: m.cols / 2, y: m.rows / 2 }; this.updateCamera();
      this.rebuild(); if (typeof document !== 'undefined') this.buildPanel();
    }
    rows() { return this.grid.map(r => r.join('')); }
    markDirty() { this.dirty = true; if (this.saveBtn) this.saveBtn.classList.add('attention'); }
    rebuild() {
      const prev = this.world, W = this.world = new BK.World({ map: this.rows(), theme: this.map.theme, mode: 'adventure', hearts: true, explore: true, itemChance: 0, exitKind:this.map.roomExit?'door':'portal', houses: this.houses, props: this.props }); W.frozen = true;W.editorPreview=true; if(this.map.roomExit) W.ensureRoomExit(false);
      if (prev) { W.clouds = prev.clouds; W.time = prev.time; }   // le ciel ne change pas à chaque coup de pinceau
      for (const e of this.enemies) W.addEnemy(e.type, e.c, e.r, {shellColor:e.shellColor, catColor:e.catColor});
      for (const n of this.npcs) { const npc = W.addNpc(BK.charById(n.id) || BK.charById('richard'), n.c, n.r, n.lines || []);  if(n.ally){npc.recruit=true;npc.say='🤝 '+(n.price||0)+' pièces · '+(n.lives||3)+' vies';npc.sayT=999;} }
      W.displays = this.shop.map(s => ({ c: s.c, r: s.r, id: s.item, icon: (BK.ITEMS[s.item] || BK.ITEMS.bomb).icon, price: s.price, once: s.once, affordable: true }));
      if (W.starts[0]) { const p = W.addPlayer(BK.charById(BK.selectedChar || 'zachary'), W.starts[0].c, W.starts[0].r); p.pose = 'idle'; }
    }
    snapshot() { this.undoStack.push({ grid: this.grid.map(r => r.slice()), enemies: this.enemies.map(e => ({ ...e })), npcs: this.npcs.map(e => ({ ...e })), shop: this.shop.map(e => ({ ...e })), houses: JSON.parse(JSON.stringify(this.houses)), props: JSON.parse(JSON.stringify(this.props)), cols: this.map.cols, rows: this.map.rows }); if (this.undoStack.length > 60) this.undoStack.shift(); }
    undo() { const s = this.undoStack.pop(); if (!s) return; this.grid = s.grid; this.enemies = s.enemies; this.npcs = s.npcs || []; this.shop = s.shop || []; this.houses = s.houses; this.props = s.props || {}; this.map.cols = s.cols; this.map.rows = s.rows; this.rebuild(); this.markDirty(); this.toast('Annulé'); }
    toast(t) { this.msg = t; this.msgT = 2; }
    inside(c, r) { return c >= 0 && r >= 0 && c < this.map.cols && r < this.map.rows; }
    paint(c, r, first) {
      if (!this.inside(c, r)) return; const it = this.item; if (!it || this.parent && it.ch==='H') return; if (it.tool !== 'undo') this.markDirty();
      if (it.tool === 'undo') { if (first) this.undo(); return; }
      if (first) this.snapshot();
      if (it.tool === 'fill') { if (!first) return; const ch = this.lastTerrain || '.'; for (const row of this.grid) row.fill(ch); this.enemies = []; this.rebuild(); return; }
      if(it.opts==='supportedBridge'){
        const key=c+','+r;this.grid[r][c]='=';this.props[key]={raisedBridge:this.bridgeGroup||'A',lv:this.bridgeLevel||2};this.enemies=this.enemies.filter(e=>e.c!==c||e.r!==r);this.rebuild();return;
      }
      if(it.opts==='bridgeColumn'){
        const key=c+','+r;if(!this.props[key]?.raisedBridge){this.toast('Place d’abord une case de pont sur colonnes.');return;}this.props[key].bridgeColumn=true;this.rebuild();return;
      }
      if(it.opts==='blastDrawbridge'){
        if(!first)return;const dir=this.bridgeDirection??2,len=this.bridgeLength||3,D=BK.DIRS[dir];
        if(!this.inside(c+D.dx*(len-1),r+D.dy*(len-1))){this.toast('Le pont dépasse la carte.');return;}
        const cells=Array.from({length:len},(_,n)=>({c:c+D.dx*n,r:r+D.dy*n}));
        if(cells.some(q=>this.world.cell(q.c,q.r)||this.world.special.has(q.c+','+q.r)||this.props[q.c+','+q.r]?.blastDrawbridge||this.houses[q.c+','+q.r])){this.toast('Choisis un passage libre, sans mur ni autre mécanisme.');return;}
        this.props[c+','+r]={...(this.props[c+','+r]||{}),blastDrawbridge:{direction:dir,length:len}};this.rebuild();return;
      }
      if(it.boat){if(this.grid[r][c]!=='~'){this.toast('Pose la barque sur l’eau, près d’une rive.');return;}this.props[c+','+r]={boat:true};this.rebuild();return;}
      if(it.tool==='rotate') {
        const key=c+','+r,pr=this.props[key]||{};
        if(pr.wallDeco||this.world.deco[this.world.idx(c,r)]){this.props[key]={...pr,orientation:((pr.orientation||0)+1)%4};this.rebuild();}return;
      }
      const big = this.props[c + ',' + r]; if (big && (big.of || big.deco === 'mountain' || big.deco === 'volcano')) this.removeBig(big.of || (c + ',' + r));   // on repeint par-dessus un gros décor : il s'en va en entier
      if (it.deco === 'volcano' || it.deco === 'mountain') { if (first) this.paintBig(c, r, it); return; }
      const wallKey=c+','+r,wallKind=CABIN_VARIANTS[it.opts]?this.opts[it.opts]:it.deco;
      if(this.map.roomExit && ['#','W'].includes(this.grid[r][c]) && BK.WALL_DECOR.has(wallKind)) {
        this.props[wallKey]={...(this.props[wallKey]||{}),wallDeco:wallKind,orientation:this.orientation};this.rebuild();return;
      }
      if(it.tool==='erase' && this.props[wallKey]?.wallDeco){delete this.props[wallKey].wallDeco;this.rebuild();return;}
      if (it.tool === 'erase') { this.grid[r][c] = this.map.base; this.enemies = this.enemies.filter(e => e.c !== c || e.r !== r); this.npcs = this.npcs.filter(e => e.c !== c || e.r !== r); this.shop = this.shop.filter(e => e.c !== c || e.r !== r); delete this.houses[c + ',' + r]; delete this.props[c + ',' + r]; this.rebuild(); return; }
      if (['raise','lower','raiseHalf','lowerHalf'].includes(it.tool)) {
        const key = c + ',' + r; if (!first && this.lastLevelKey === key) return; this.lastLevelKey = key;
        const pr = this.props[key] || {}, cur = this.grid[r][c]; let lv = pr.lv != null ? pr.lv : pr.h ? 1 : ':;X'.includes(cur) ? 1 : 0;
        lv = Math.max(0, Math.min(4, lv + ({raise:1,lower:-1,raiseHalf:.5,lowerHalf:-.5}[it.tool])));
        if (cur === '~' || cur === ' ') this.grid[r][c] = '.'; else if (cur === ':') this.grid[r][c] = '.'; else if (cur === ';') this.grid[r][c] = ','; else if (cur === 'X') this.grid[r][c] = 'x';
        this.props[key] = Object.assign({}, pr, { lv }); delete this.props[key].h; this.rebuild(); this.toast('Étage ' + lv); return;
      }
      if(it.opts==='movingPlatform'){
        if(!first)return;const axis=this.platformAxis||'horizontal',length=this.platformLength||4,dc=axis==='horizontal'?1:0,dr=axis==='vertical'?1:0;
        if(!this.inside(c+dc*(length-1),r+dr*(length-1))){this.toast('Le trajet dépasse la carte.');return;}
        for(let k=0;k<length;k++){const cc=c+dc*k,rr=r+dr*k;this.grid[rr][cc]='(';this.props[cc+','+rr]={lv:0,platformLevel:this.platformLevel??1,platformSpeed:this.platformSpeed||1.3,platformPause:this.platformPause||1.8,platformPit:true};this.enemies=this.enemies.filter(e=>e.c!==cc||e.r!==rr);}
        this.rebuild();return;
      }
      if(it.ally) {if(!first)return;this.npcs=this.npcs.filter(n=>n.c!==c||n.r!==r);this.npcs.push({c,r,ally:true,id:this.opts.ally.id,price:Math.max(0,Math.round(this.opts.ally.price)),lives:Math.max(1,Math.min(9,Math.round(this.opts.ally.lives)))});if('~ '.includes(this.grid[r][c]))this.grid[r][c]=this.map.base;this.rebuild();return;}
      if (it.npc) { if (!first) return; this.npcs = this.npcs.filter(e => e.c !== c || e.r !== r); this.npcs.push({ c, r, id: this.opts.npc.id, lines: [this.opts.npc.line || 'Bienvenue !'] }); if ('~ '.includes(this.grid[r][c])) this.grid[r][c] = this.map.base; this.rebuild(); return; }
      if (it.shop) { if (!first) return; this.shop = this.shop.filter(e => e.c !== c || e.r !== r); this.shop.push({ c, r, item: this.opts.shop.item, price: Math.max(0, Math.round(+this.opts.shop.price || 0)), once: !!this.opts.shop.once }); if ('~ '.includes(this.grid[r][c])) this.grid[r][c] = this.map.base; this.rebuild(); return; }
      if (it.enemy) { if (!first) return; this.enemies = this.enemies.filter(e => e.c !== c || e.r !== r); this.enemies.push({ type: it.enemy, c, r, ...(it.enemy==='escargot'?{shellColor:this.snailColor||'default'}:{}), ...(it.enemy==='chat'?{catColor:this.catColor||'roux'}:{}) }); if (this.grid[r][c] === ' ' || (this.grid[r][c] === '~' && it.enemy !== 'marin')) this.grid[r][c] = '.'; this.rebuild(); return; }
      const key = c + ',' + r, same = this.grid[r][c] === it.ch && (!it.deco || (this.props[key] || {}).deco === it.deco) && (!it.pickup || (this.props[key] || {}).item === it.pickup), TERRAIN = '~ .,:;/=-_%&!yzq}{[])¡¢£¥€';
      if (same && !it.opts && !it.deco && !BK.DECO[it.ch]) return;
      // niveau du plancher sous l'objet : on le mémorise pour qu'il reste sur le plateau (ou au sol)
      let lvl = null, floor = null;
      if (!TERRAIN.includes(it.ch)) { const cur = this.grid[r][c], pr = this.props[key] || {}; if ((pr.lv != null || pr.h != null) && !TERRAIN.includes(cur)) { lvl = pr.lv != null ? pr.lv : pr.h; floor = pr.floor; } else if (pr.lv != null && TERRAIN.includes(cur)) { lvl = pr.lv; floor = cur === ':' || cur === '.' ? 'stone' : cur === ';' || cur === ',' ? 'grass' : cur; } else if (cur === ':' || cur === ';' || cur === 'X') { lvl = 1; floor = cur === ':' ? 'stone' : 'grass'; } else if (cur === '.' || cur === ',') { lvl = 0; floor = cur === '.' ? 'stone' : 'grass'; } else if (TERRAIN.includes(cur) && cur !== '~' && cur !== ' ') { lvl = 0; floor = cur; } }
      if (it.ch === '1' || !this.map.roomExit && (it.ch === 'G' || it.ch === '|')) for (const row of this.grid) for (let i = 0; i < row.length; i++) if (row[i] === it.ch || (it.ch !== '1' && (row[i] === 'G' || row[i] === '|'))) row[i] = '.';   // uniques (une seule fin)
      if (it.opts === 'target') { const L = this.opts.target.letter; for (let rr = 0; rr < this.map.rows; rr++) for (let cc = 0; cc < this.map.cols; cc++) { const k2 = cc + ',' + rr; if (k2 !== key && 'ABCDEF'.includes(this.grid[rr][cc]) && ((this.props[k2] || {}).letter || this.grid[rr][cc]) === L) { this.grid[rr][cc] = '.'; delete this.props[k2]; } } }   // une cible par lettre
      const keepLv = (this.props[key] || {}).lv ?? (':;'.includes(this.grid[r][c])?1:undefined); if (!same) delete this.props[key];
      if (keepLv != null && TERRAIN.includes(it.ch) && !'~ '.includes(it.ch)) this.props[key] = { lv: keepLv };   // l'étage reste quand on change le sol
      if (it.opts === 'tree') this.props[key] = { ...this.opts.tree }; else if (it.opts === 'flowers') this.props[key] = { colors: this.opts.flowers.colors.slice() }; else if (it.opts === 'target') this.props[key] = { letter: this.opts.target.letter }; else if (it.opts === 'gate') this.props[key] = { letter: this.opts.gate.letter.toLowerCase() };
      if (it.pickup) this.props[key] = Object.assign(this.props[key] || {}, { item: it.pickup });
      if (it.deco) this.props[key] = Object.assign(this.props[key] || {}, { deco: CABIN_VARIANTS[it.opts] ? this.opts[it.opts] : it.deco });
      if(it.deco==='castle_treasure')this.props[key]={...(this.props[key]||{}),treasureSeed:Math.floor(Math.random()*2147483647)};
      if(it.opts==='autoLift')this.props[key]={...(this.props[key]||{}),autoLift:true,liftHeight:this.liftHeight||1,travelTime:this.travelTime||2.6,platformPause:this.platformPause||1.8};
      if(it.opts==='secretWall')this.props[key]={...(this.props[key]||{}),secretGroup:this.secretGroup||'A',secretWidth:this.secretWidth||3,secretDepth:this.secretDepth||3,secretDirection:this.secretDirection??2};
      if(it.opts==='pipe')this.props[key]={...(this.props[key]||{}),pipeLink:this.pipeLink||'A'};
      if(it.opts==='mechanism')this.props[key]={...(this.props[key]||{}),trapRest:this.trapRest??2,trapActive:this.trapActive??1,trapDelay:this.trapDelay??0,trapRange:this.trapRange??4,trapBurst:this.trapBurst??1};
      if(it.opts==='firebar')this.props[key]={...(this.props[key]||{}),length:this.firebarLength||3,direction:this.firebarDirection||1,speed:this.firebarSpeed||'normal',arms:this.firebarArms===2?2:1};
      if(it.opts==='statue'||it.opts==='table') this.props[key]={...(this.props[key]||{}),deco:this.opts[it.opts]};
      if(BK.LIGHT_KINDS.includes(it.deco||BK.DECO[it.ch]?.[0])) this.props[key]={...(this.props[key]||{}),lightColor:this.lightColor};
      if(it.deco||BK.DECO[it.ch]) this.props[key]={...(this.props[key]||{}),orientation:this.orientation};
      if (lvl != null) this.props[key] = Object.assign(this.props[key] || {}, { lv: lvl, floor });
      if (it.ch && TABS[0].items.some(x => x.ch === it.ch)) this.lastTerrain = it.ch;
      this.grid[r][c] = (it.opts==='statue'||it.opts==='table')&&this.opts[it.opts]!==it.opts?'"':it.ch; this.enemies = this.enemies.filter(e => e.c !== c || e.r !== r);
      if (this.grid[r][c] !== 'H' && this.houses[c + ',' + r]) { delete this.houses[c + ',' + r]; if (typeof document !== 'undefined' && this.tab === 'maisons' && this.showTab) this.showTab('maisons'); }
      if (it.ch === 'H') {   // les murs de la maison selon sa taille, la porte reste libre
        const prevHouse = this.houses[c + ',' + r]; const hp = this.houses[c + ',' + r] = { ...this.house, interior: prevHouse && prevHouse.interior }; const hw = (hp.w - 1) / 2; this.lastHouse = c + ',' + r; if (typeof document !== 'undefined') { this.renderOptions(); if (this.tab === 'maisons' && this.showTab) this.showTab('maisons'); }
        for (let dr = -(hp.d - 1); dr <= 0; dr++) for (let dc = -hw; dc <= hw; dc++) if ((dc || dr) && this.inside(c + dc, r + dr)) this.grid[r + dr][c + dc] = '#';
      }
      this.rebuild();
      if(it.opts==='pipe'&&typeof document!=='undefined')this.renderOptions();
    }
    // Agrandit la carte d'une rangée du côté demandé ; à gauche ou en haut, tout le contenu glisse d'une case.
    expand(side) {
      this.snapshot(); const base = this.map.base;
      if (side === 'right') { for (const row of this.grid) row.push(base); this.map.cols++; }
      else if (side === 'bottom') { this.grid.push(Array(this.map.cols).fill(base)); this.map.rows++; }
      else if (side === 'left') { for (const row of this.grid) row.unshift(base); this.map.cols++; for (const e of this.enemies) e.c++; this.shiftProps(1, 0); this.view.x++; }
      else if (side === 'top') { this.grid.unshift(Array(this.map.cols).fill(base)); this.map.rows++; for (const e of this.enemies) e.r++; this.shiftProps(0, 1); this.view.y++; }
      this.updateCamera(); this.markDirty(); this.rebuild(); this.toast('Carte agrandie : ' + this.map.cols + ' × ' + this.map.rows);
    }
    // Décale (et rogne hors cadre) les options par case : maisons et props.
    shiftProps(dc, dr) {
      const move = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => { const [c, r] = k.split(',').map(Number); return [(c + dc) + ',' + (r + dr), v]; }).filter(([k]) => { const [c, r] = k.split(',').map(Number); return c >= 0 && r >= 0 && c < this.map.cols && r < this.map.rows; }));
      this.houses = move(this.houses); this.props = move(this.props);
    }
    // Enlève les rangées et colonnes du bord qui ne contiennent que du fond.
    trim() {
      const isBase = row => row.every(ch => ch === this.map.base);
      let top = 0, bottom = this.map.rows - 1, left = 0, right = this.map.cols - 1;
      while (top < bottom - 6 && isBase(this.grid[top])) top++; while (bottom > top + 6 && isBase(this.grid[bottom])) bottom--;
      const col = c => this.grid.map(row => row[c]);
      while (left < right - 8 && isBase(col(left))) left++; while (right > left + 8 && isBase(col(right))) right--;
      if (!top && !left && bottom === this.map.rows - 1 && right === this.map.cols - 1) { this.toast('Rien à rogner'); return; }
      this.snapshot(); this.grid = this.grid.slice(top, bottom + 1).map(row => row.slice(left, right + 1)); this.map.cols = right - left + 1; this.map.rows = bottom - top + 1;
      this.enemies = this.enemies.map(e => ({ ...e, c: e.c - left, r: e.r - top })).filter(e => e.c >= 0 && e.r >= 0 && e.c < this.map.cols && e.r < this.map.rows);
      this.shiftProps(-left, -top);
      this.view = { x: this.map.cols / 2, y: this.map.rows / 2 }; this.updateCamera(); this.settingsChanged('Bords rognés : ' + this.map.cols + ' × ' + this.map.rows);
    }
    // Case sous le curseur, y compris la bordure fantôme (une case au-delà de chaque bord).
    ghostAt(sx, sy) {
      const u = this.cam.unproject(sx, sy, 0), c = Math.floor(u.x), r = Math.floor(u.y);
      if (c >= -1 && r >= -1 && c <= this.map.cols && r <= this.map.rows && !this.inside(c, r)) return { c, r, ghost: true };
      return null;
    }
    cellAt(sx, sy) {
      // Tester les vrais étages, du plus haut au plus bas, y compris les pentes.
      for(let step=27;step>=0;step--){const z=step*.1,u=this.cam.unproject(sx,sy,z),c=Math.floor(u.x),r=Math.floor(u.y);if(this.inside(c,r)&&Math.abs(this.world.groundZ(u.x,u.y)-z)<.051)return {c,r};}
      return null;
    }
    updateCamera() { const cam = this.cam; this.view.x = Math.max(0, Math.min(this.map.cols, this.view.x)); this.view.y = Math.max(0, Math.min(this.map.rows, this.view.y)); cam.target.x = this.view.x; cam.target.y = this.view.y + 0.3; }   // la vue elle-même reste dans le tableau : pas de « dérive » invisible
    onPointer(type, sx, sy, buttons) {
      let cell = this.cellAt(sx, sy); const ghost = cell ? null : this.ghostAt(sx, sy); this.hover = cell || ghost;
      const it = this.item, canCreate = it && !it.tool && !it.enemy;
      if (ghost && (type === 'down' || (type === 'move' && this.painting && buttons)) && canCreate) {
        // on crée la case : la carte s'agrandit de ce côté, puis on peint
        let { c, r } = ghost; if (c < 0) { this.expand('left'); c = 0; } else if (c >= this.map.cols) this.expand('right');
        if (r < 0) { this.expand('top'); r = 0; } else if (r >= this.map.rows) this.expand('bottom');
        if (r > this.map.rows - 1 || c > this.map.cols - 1) return; this.painting = true; this.paint(c, r, true); this.hover = { c, r }; return;
      }
      if (type === 'down') { this.painting = true; if (cell) this.paint(cell.c, cell.r, true); }
      else if (type === 'move') { if (this.painting && cell && buttons) this.paint(cell.c, cell.r, false); }
      else if (type === 'up') this.painting = false;
    }
    onWheel(dy) { this.cam.dist = Math.max(8, Math.min(60, this.cam.dist * (dy > 0 ? 1.1 : 0.9))); }
    update(dt) {
      const K = BK.input; this.t += dt; if (this.msgT > 0) this.msgT -= dt; this.world.time += dt; for (const e of this.world.enemies) e.t += dt; for (const it of this.world.items) it.t += dt; for (const p of this.world.players) p.animT += dt;
      const typing = typeof document !== 'undefined' && document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);   // un champ ou une liste a le focus : les flèches lui appartiennent
      const v = 9 * dt; let dx = typing ? 0 : (K.any(['ArrowRight', 'KeyD']) ? 1 : 0) - (K.any(['ArrowLeft', 'KeyA']) ? 1 : 0), dy = typing ? 0 : (K.any(['ArrowDown', 'KeyS']) ? 1 : 0) - (K.any(['ArrowUp', 'KeyW']) ? 1 : 0);
      if (dx || dy) { this.view.x += dx * v; this.view.y += dy * v; this.updateCamera(); }
      if (K.hit(['KeyZ']) && K.any(['MetaLeft', 'MetaRight', 'ControlLeft', 'ControlRight'])) this.undo();
      if (K.hit(['Escape'])) this.quit();
    }
    render(ctx) {
      const W = this.world, cam = this.cam;
      W.render(ctx, cam, { noShake: true });
      // grille et case survolée
      const cmin = Math.max(0, Math.floor(cam.target.x - 11)), cmax = Math.min(W.cols - 1, Math.ceil(cam.target.x + 11)), rmin = Math.max(0, Math.floor(cam.target.y - 10)), rmax = Math.min(W.rows - 1, Math.ceil(cam.target.y + 9));
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      for (let r = rmin; r <= rmax; r++) for (let c = cmin; c <= cmax; c++) { const z = W.groundZ(c+.5,r+.5); const p = [cam.project(c, r, z), cam.project(c + 1, r, z), cam.project(c + 1, r + 1, z), cam.project(c, r + 1, z)]; BK.draw3d.quad(ctx, p, null, 'rgba(255,255,255,0.18)'); }
      ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
      for (let r = -1; r <= W.rows; r++) for (let c = -1; c <= W.cols; c++) { if (this.inside(c, r)) continue; if (c < cmin - 1 || c > cmax + 1 || r < rmin - 1 || r > rmax + 1) continue; BK.draw3d.quad(ctx, [cam.project(c, r, 0), cam.project(c + 1, r, 0), cam.project(c + 1, r + 1, 0), cam.project(c, r + 1, 0)], 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.35)'); }
      ctx.restore();
      if (this.hover && this.hover.ghost) { const { c, r } = this.hover; BK.draw3d.quad(ctx, [cam.project(c, r, 0), cam.project(c + 1, r, 0), cam.project(c + 1, r + 1, 0), cam.project(c, r + 1, 0)], 'rgba(73,226,106,0.3)', '#49e26a'); const p = cam.project(c + 0.5, r + 0.5, 0); ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(p.k * 0.5) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', p.x, p.y); }
      if (this.hover && !this.hover.ghost) { const { c, r } = this.hover, z = W.groundZ(c+.5,r+.5); const p = [cam.project(c, r, z), cam.project(c + 1, r, z), cam.project(c + 1, r + 1, z), cam.project(c, r + 1, z)]; ctx.lineWidth = 3; BK.draw3d.quad(ctx, p, 'rgba(255,213,74,0.25)', '#ffd54a'); }
      // bandeau
      ctx.save(); ctx.font = 'bold 18px Nunito, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; BK.sprites.rr(ctx, 14, 10, 700, 40, 12); ctx.fill(); ctx.fillStyle = '#fff';
      const it = this.item; ctx.fillText((it ? it.icon + ' ' + it.name : '') + '   ·   ' + this.map.name + ' (' + this.map.cols + '×' + this.map.rows + ')' + (this.dirty ? '  ●  non sauvegardé' : '') + (this.hover ? (this.hover.ghost ? '   ·   clic : créer la case' : '   ·   case ' + this.hover.c + ', ' + this.hover.r + (this.world.hAt(this.hover.c, this.hover.r) > 0.3 ? ' · étage ' + (Math.round(this.world.hAt(this.hover.c, this.hover.r) / 0.3)/2) : '')) : ''), 30, 30);
      if (this.msgT > 0) { ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,0.55)'; BK.sprites.rr(ctx, 440, BK.H - 60, 400, 40, 12); ctx.fill(); ctx.fillStyle = '#ffd54a'; ctx.fillText(this.msg, 640, BK.H - 40); }
      ctx.restore();
    }
    // ---------------------------------------------------------------- tiroir
    buildPanel() {
      const P = document.getElementById('editor-panel'); P.innerHTML = '';
      const tabs = document.createElement('div'); tabs.className = 'tabs'; P.appendChild(tabs);
      const acts = document.createElement('div'); acts.className = 'acts'; tabs.appendChild(acts);
      const categories = document.createElement('div'); categories.className='deco-categories'; categories.setAttribute('aria-label','Catégories de décorations'); categories.hidden=true; P.appendChild(categories);
      const strip = document.createElement('div'); strip.className = 'strip'; P.appendChild(strip);
      const items = document.createElement('div'); items.className = 'items';
      const arrow = (txt, dir) => { const b = document.createElement('button'); b.className = 'arrow'; b.textContent = txt; b.addEventListener('click', () => items.scrollBy({ left: dir * items.clientWidth * 0.7, behavior: 'smooth' })); return b; };
      const left = arrow('‹', -1), right = arrow('›', 1); strip.appendChild(left); strip.appendChild(items); strip.appendChild(right);
      const updateArrows = () => { const over = items.scrollWidth > items.clientWidth + 2; strip.classList.toggle('over', over); left.disabled = items.scrollLeft < 4; right.disabled = items.scrollLeft + items.clientWidth > items.scrollWidth - 4; };
      items.addEventListener('scroll', updateArrows); items.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && items.scrollWidth > items.clientWidth) { e.preventDefault(); items.scrollLeft += e.deltaY; } }, { passive: false });
      window.addEventListener('resize', updateArrows); this.updateArrows = updateArrows;
      const showTab = id => {
        this.tab = id; tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id)); items.innerHTML = ''; items.className='items'; items.scrollLeft=0;
        categories.setAttribute('aria-label',id==='bestiary'?'Familles du bestiaire':'Catégories de décorations');categories.hidden=id!=='deco'&&id!=='bestiary'; categories.innerHTML='';
        if(id==='deco') for(const cat of [{id:'all',name:'Tout'},...DECO_CATEGORIES]) {
          const count=TABS.find(t=>t.id==='deco').items.filter(it=>cat.id==='all'||it.category===cat.id).length;
          const b=document.createElement('button'); const active=(this.decoCategory||'all')===cat.id; b.textContent=cat.name+' · '+count; b.classList.toggle('on',active); b.setAttribute('aria-pressed',String(active));
          b.addEventListener('click',()=>{this.decoCategory=cat.id;showTab('deco');}); categories.appendChild(b);
        }
        if(id==='bestiary')for(const [key,name] of [['all','Tout'],...BK.BESTIARY_GROUPS]){const button=document.createElement('button');button.textContent=name;button.classList.toggle('on',(this.bestiaryCategory||'all')===key);button.addEventListener('click',()=>{this.bestiaryCategory=key;showTab('bestiary');});categories.appendChild(button);}
        const tabDef = TABS.find(t => t.id === id);
        if (tabDef.form) { this.buildForm(items); requestAnimationFrame(updateArrows); return; }
        if (id === 'magasin') this.musicCard(items);
        for (const it of tabDef.items) if(!(this.parent && it.ch==='H') && (id!=='deco'||!this.decoCategory||this.decoCategory==='all'||it.category===this.decoCategory)) if(id!=='bestiary'||!this.bestiaryCategory||this.bestiaryCategory==='all'||it.category===this.bestiaryCategory)items.appendChild(card(it));
        if (id === 'maisons') this.houseCards(items);
        requestAnimationFrame(updateArrows);
      };
      const card = (it, tabName) => {
        const roomDoor=this.map.roomExit && it.ch==='G', icon=roomDoor?'🚪':it.icon, name=roomDoor?'Sortie de la pièce':it.name;
        const b = document.createElement('button'); b.className = 'item' + (it === this.item ? ' on' : ''); b.innerHTML = '<span class="ic">' + icon + '</span><span>' + name + '</span>' + (tabName ? '<span class="small">' + tabName + '</span>' : ''); if (it.hint) b.title = roomDoor?'Une case de plancher pour retourner dehors.':it.hint;
        if(it.enemy&&BK.ENEMIES[it.enemy]?.bestiary){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;canvas.style.width='64px';canvas.style.height='64px';canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');ctx.translate(48,88);BK.sprites.drawEnemy(ctx,it.enemy,{s:BK.ENEMIES[it.enemy].boss?47:75,t:0});b.querySelector('.ic').replaceChildren(canvas);}
        b.addEventListener('click', () => { if (it.tool === 'undo') { this.undo(); return; } if (it.tool === 'fill') { BK.confirmDialog({ title: '🪣 Tout remplir ?', text: 'Remplir tout le tableau avec « ' + (TABS[0].items.find(x => x.ch === (this.lastTerrain || '.')) || {}).name + ' » ? Les ennemis seront retirés.', confirmLabel: 'Remplir', onConfirm: () => { this.snapshot(); this.paint(0, 0, true); } }); return; } this.item = it; items.querySelectorAll('.item').forEach(x => x.classList.toggle('on', x === b)); this.renderOptions(); });
        return b;
      };
      this.showTab = showTab;
      // recherche : filtre les objets de tous les onglets ; vide = retour à l'onglet courant
      const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const search = document.createElement('input'); search.type = 'search'; search.className = 'search'; search.placeholder = '🔍 Chercher…'; search.title = 'Filtre les objets de tous les onglets';
      search.addEventListener('input', () => {
        const q = norm(search.value.trim()); if (!q) { showTab(this.tab); return; }
        tabs.querySelectorAll('button').forEach(b => b.classList.remove('on')); items.innerHTML = ''; items.className='items'; categories.hidden=true; let n = 0;
        for (const t of TABS.filter(t=>!t.roomOnly||this.map.roomExit)) for (const it of t.items || []) if (!(this.parent && it.ch==='H') && (norm(it.name).includes(q) || norm(it.hint).includes(q) || norm(t.name).includes(q))) { items.appendChild(card(it, t.name)); n++; }
        if (!n) { const e = document.createElement('span'); e.className = 'hint'; e.textContent = 'Rien ne correspond à « ' + search.value.trim() + ' »'; items.appendChild(e); }
        requestAnimationFrame(updateArrows);
      });
      search.addEventListener('keydown', e => { if (e.key === 'Escape') { search.value = ''; showTab(this.tab); search.blur(); } e.stopPropagation(); });
      this.searchBox = search;
      for (const t of TABS.filter(t=>!t.roomOnly||this.map.roomExit)) { const b = document.createElement('button'); b.textContent = t.name; b.dataset.id = t.id; b.addEventListener('click', () => { if (this.searchBox) this.searchBox.value = ''; showTab(t.id); }); tabs.insertBefore(b, acts); }
      tabs.insertBefore(search, acts);
      this.optBox = document.createElement('div'); this.optBox.className = 'sub'; P.appendChild(this.optBox);
      showTab(this.map.roomExit?'piece':'decor'); this.renderOptions();
      const act = (label, fn, cls) => { const b = document.createElement('button'); b.textContent = label; if (cls) b.className = cls; b.addEventListener('click', () => { BK.audio.click(); fn(); }); acts.appendChild(b); return b; };
      if (this.parent) { act(this.parent.kind==='duel'?'▶ Tester le duel':'▶ Tester la pièce', () => this.test(), 'primary'); this.saveBtn = act(this.parent.kind==='duel'?'⬅ Retour au duelliste':'⬅ Retour à l’extérieur', () => this.returnToParent()); }
      else { act('▶ Tester', () => this.test(), 'primary'); this.saveBtn = act('💾 Sauvegarder', () => this.save()); act('📋 Copier le code', () => this.copyCode()); act('📤 Fichier', () => this.exportJson()); act('📂 Ouvrir', () => this.importJson()); act('← Menu', () => this.quit(), 'ghost'); }
      const help = document.createElement('p'); help.className = 'hint'; help.textContent = this.map.roomExit ? 'Pièce : plancher, murs et meubles · Plusieurs sorties possibles · Repeins une sortie avec du plancher pour l’enlever · Clique sur une case en pointillés pour agrandir.' : 'Clique ou glisse sur la carte pour peindre · Flèches ou WASD : déplacer la vue · Molette : zoom · Ctrl+Z : annuler · Le départ, le but et chaque cible sont uniques.'; P.appendChild(help);
    }
    // Modifications du tableau en cours de construction : le contenu existant est conservé.
    resize(cols, rows) {
      cols = Math.max(9, Math.min(48, cols | 0)); rows = Math.max(7, Math.min(48, rows | 0)); if (cols === this.map.cols && rows === this.map.rows) return;
      this.snapshot(); const g = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (this.grid[r] && this.grid[r][c] != null) ? this.grid[r][c] : this.map.base));
      this.grid = g; this.map.cols = cols; this.map.rows = rows; this.enemies = this.enemies.filter(e => e.c < cols && e.r < rows); this.map.cols = cols; this.map.rows = rows; this.shiftProps(0, 0); this.view = { x: cols / 2, y: rows / 2 }; this.updateCamera(); this.rebuild(); this.settingsChanged('Tableau ' + cols + ' × ' + rows);
    }
    setBase(ch) { if (ch === this.map.base) return; this.snapshot(); for (const row of this.grid) for (let i = 0; i < row.length; i++) if (row[i] === this.map.base) row[i] = ch; this.map.base = ch; this.rebuild(); this.settingsChanged('Fond changé'); }
    setTheme(id) { if (!BK.THEMES[id]) return; this.map.theme = id; this.rebuild(); this.settingsChanged('Décor : ' + BK.THEMES[id].name); }
    // Un réglage du tableau (taille, fond, décor, nom) : sauvegardé tout de suite si le tableau est déjà enregistré.
    settingsChanged(msg) { this.markDirty(); if (BK.loadMaps().some(m => m.id === this.map.id)) { this.save(); this.toast(msg + ' · sauvegardé'); } else this.toast(msg); }
    code() { return JSON.stringify(this.data()); }
    copyCode() {
      const txt = this.code(), done = () => this.toast('Code copié ! Colle-le dans la conversation.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => prompt('Copie ce code :', txt));
      else prompt('Copie ce code :', txt);
    }
    pasteCode() {
      const txt = prompt('Colle ici le code d’un tableau :'); if (!txt) return;
      try { const m = JSON.parse(txt); if (!m || !Array.isArray(m.grid)) throw Error('format'); m.id = 'm' + Date.now().toString(36); BK.openEditor(m); } catch (e) { alert('Code non reconnu.'); }
    }
    // Options de l'outil choisi (arbre, fleurs, maison, cible, porte), sous les icônes.
    renderOptions() {
      const box = this.optBox; if (!box) return; box.innerHTML = ''; box.hidden = true; const it = this.item; if (!it || (!it.opts && !it.deco && !BK.DECO[it.ch])) return; box.hidden = false;
      const sel = (label, opts, val, on) => { const l = document.createElement('label'); l.textContent = label + ' '; const s = document.createElement('select'); for (const [v, n] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = n; if (String(v) === String(val)) o.selected = true; s.appendChild(o); } s.addEventListener('change', () => on(s.value)); l.appendChild(s); box.appendChild(l); };
      const title = document.createElement('b'); title.textContent = it.icon + ' ' + it.name + ' :'; box.appendChild(title);
      if(it.opts==='supportedBridge'){
        sel('section',['A','B','C','D','E','F','G','H'].map(v=>[v,v]),this.bridgeGroup||'A',v=>this.bridgeGroup=v);
        sel('étage',[1,1.5,2,2.5,3,4].map(v=>[v,v]),this.bridgeLevel||2,v=>this.bridgeLevel=+v);
      }
      if(it.opts==='blastDrawbridge'){
        sel('direction',[[2,'Vers le haut ↑'],[0,'Vers le bas ↓'],[1,'Vers la gauche ←'],[3,'Vers la droite →']],this.bridgeDirection??2,v=>this.bridgeDirection=+v);
        sel('longueur',[2,3,4,5,6].map(n=>[n,n+' cases']),this.bridgeLength||3,v=>this.bridgeLength=+v);
      }
      if(it.opts==='movingPlatform'){
        sel('direction',[['horizontal','Horizontale ↔'],['vertical','Verticale ↕']],this.platformAxis||'horizontal',v=>this.platformAxis=v);
        sel('longueur',[2,3,4,5,6,7,8].map(n=>[n,n+' cases']),this.platformLength||4,v=>this.platformLength=+v);
        sel('étage des quais',[0,.5,1,1.5,2,2.5,3,4].map(n=>[n,'Étage '+n]),this.platformLevel??1,v=>this.platformLevel=+v);
        sel('vitesse',[[.7,'Lente'],[1.3,'Normale'],[2,'Rapide']],this.platformSpeed||1.3,v=>this.platformSpeed=+v);
      }
      if(it.opts==='autoLift'){
        sel('montée',[.5,1,1.5,2,3,4].map(n=>[n,n+' étage(s)']),this.liftHeight||1,v=>this.liftHeight=+v);
        sel('durée du trajet',[[1.8,'1,8 s'],[2.6,'2,6 s'],[4,'4 s']],this.travelTime||2.6,v=>this.travelTime=+v);
      }
      if(['movingPlatform','autoLift'].includes(it.opts))sel('pause à chaque bout',[[1,'1 s'],[1.8,'1,8 s'],[3,'3 s']],this.platformPause||1.8,v=>this.platformPause=+v);
      if(it.opts==='secretWall'){
        sel('pièce',['A','B','C','D','E','F','G','H'].map(v=>[v,v]),this.secretGroup||'A',v=>this.secretGroup=v);
        sel('pièce derrière le mur',[[2,'Vers le haut ↑'],[0,'Vers le bas ↓'],[1,'À gauche ←'],[3,'À droite →']],this.secretDirection??2,v=>this.secretDirection=+v);
        sel('largeur',[1,3,5,7,9].map(n=>[n,n+' cases']),this.secretWidth||3,v=>this.secretWidth=+v);
        sel('profondeur',[1,2,3,4,5,6,7,8,9].map(n=>[n,n+' cases']),this.secretDepth||3,v=>this.secretDepth=+v);
      }
      if(it.opts==='mechanism'){
        sel('pause (piques rentrées)',[[1,'1 seconde'],[2,'2 secondes'],[3,'3 secondes'],[5,'5 secondes']],this.trapRest??2,v=>this.trapRest=Number(v));
        sel('durée active',[[.5,'0,5 seconde'],[1,'1 seconde'],[2,'2 secondes'],[3,'3 secondes']],this.trapActive??1,v=>this.trapActive=Number(v));
        sel('décalage du départ',[[0,'Immédiat'],[1,'1 seconde'],[2,'2 secondes'],[3,'3 secondes']],this.trapDelay??0,v=>this.trapDelay=Number(v));
        if(!['trap_spikes','trap_crusher','trap_gas'].includes(it.deco))sel('portée',[[2,'2 cases'],[3,'3 cases'],[4,'4 cases'],[6,'6 cases']],this.trapRange??4,v=>this.trapRange=Number(v));
        if(it.deco==='trap_dart')sel('salve',[[1,'Une flèche'],[3,'Trois flèches']],this.trapBurst??1,v=>this.trapBurst=Number(v));
      }
      if(it.opts==='firebar'){sel('barres',[[1,'Une barre'],[2,'Deux barres opposées']],this.firebarArms||1,v=>this.firebarArms=Number(v));sel('longueur',[[2,'2 cases'],[3,'3 cases'],[4,'4 cases']],this.firebarLength||3,v=>this.firebarLength=Number(v));sel('rotation',[[1,'Sens horaire'],[-1,'Sens antihoraire']],this.firebarDirection||1,v=>this.firebarDirection=Number(v));sel('vitesse',[['slow','Lente'],['normal','Normale'],['fast','Rapide']],this.firebarSpeed||'normal',v=>this.firebarSpeed=v);}
      if(it.opts==='pipe'){
        sel('liaison (les 2 extrémités)',BK.PIPE_LINKS.map(v=>[v,'Tuyau '+v]),this.pipeLink||'A',v=>{this.pipeLink=v;this.renderOptions();});
        const note=document.createElement('span'),ends=Object.entries(this.props).filter(([key,pr])=>pr.deco==='greenpipe'&&(pr.pipeLink||'A')===(this.pipeLink||'A'));
        note.textContent=ends.length===2?'Reliés : '+ends.map(([key])=>key.replace(',', ' / ')).join(' ↔ '):ends.length<2?'Pose '+(2-ends.length)+' extrémité(s) avec cette lettre.':'Trop de tuyaux : donne une autre lettre à une paire.';
        box.appendChild(note);
      }
      if(it.opts==='snail') sel('couleur de coquille',Object.entries(BK.SNAIL_COLORS).map(([k,v])=>[k,v.name]),this.snailColor||'default',v=>this.snailColor=v);
      if(it.opts==='cat') sel('couleur du chat',Object.entries(BK.CAT_COLORS).map(([k,v])=>[k,v.name]),this.catColor||'roux',v=>this.catColor=v);
      if(it.opts!=='secretWall'&&(it.deco||BK.DECO[it.ch])) sel('orientation',[[0,'↓ Sud (devant)'],[1,'← Ouest (gauche)'],[2,'↑ Nord (derrière)'],[3,'→ Est (droite)']],this.orientation,v=>this.orientation=Number(v));
      if(BK.LIGHT_KINDS.includes(it.deco||BK.DECO[it.ch]?.[0])) sel('couleur de lumière',Object.entries(BK.LIGHT_COLORS).map(([id,v])=>[id,v.name]),this.lightColor,v=>this.lightColor=v);
      if(BK.WALL_DECOR.has(it.deco)){const hint=document.createElement('span');hint.textContent='Dans une pièce, clique un mur pour accrocher le décor. Gomme : décrocher sans enlever le mur.';box.appendChild(hint);}
      if(CABIN_VARIANTS[it.opts]) sel('modèle',CABIN_VARIANTS[it.opts],this.opts[it.opts],v=>this.opts[it.opts]=v);
      if (it.opts === 'house') this.buildHouseOptions(box);
      if(it.opts==='ally') {sel('qui',Object.keys(BK.CHARACTERS).map(id=>[id,BK.CHARACTERS[id].name]),this.opts.ally.id,v=>this.opts.ally.id=v);for(const [key,label,min,max] of [['price','prix 🪙',0,999],['lives','vies',1,9]]){const l=document.createElement('label'),inp=document.createElement('input');l.textContent=label+' ';inp.type='number';inp.min=min;inp.max=max;inp.value=this.opts.ally[key];inp.style.width='70px';inp.oninput=()=>this.opts.ally[key]=Math.max(min,Math.min(max,+inp.value||min));l.appendChild(inp);box.appendChild(l);}}
      if (it.opts === 'npc') { sel('qui', Object.keys(BK.CHARACTERS).map(id => [id, BK.CHARACTERS[id].name]), this.opts.npc.id, v => this.opts.npc.id = v); const l = document.createElement('label'); l.textContent = 'phrase '; const inp = document.createElement('input'); inp.type = 'text'; inp.value = this.opts.npc.line; inp.size = 28; inp.addEventListener('input', () => this.opts.npc.line = inp.value); l.appendChild(inp); box.appendChild(l); }
      else if (it.opts === 'shop') {
        sel('objet', Object.keys(BK.ITEMS).filter(k=>!BK.ITEMS[k].snailColor).map(k => [k, BK.ITEMS[k].icon + ' ' + BK.ITEMS[k].name]), this.opts.shop.item, v => this.opts.shop.item = v);
        const l = document.createElement('label'); l.textContent = 'prix (pièces d’or) '; const inp = document.createElement('input'); inp.type = 'number'; inp.min = 0; inp.max = 999; inp.value = this.opts.shop.price; inp.style.width = '70px'; inp.addEventListener('input', () => this.opts.shop.price = +inp.value); l.appendChild(inp); box.appendChild(l);
        sel('vente', [['once', 'Une seule fois (disparaît)'], ['many', 'Autant qu’on veut']], this.opts.shop.once ? 'once' : 'many', v => this.opts.shop.once = v === 'once');
      }
      if (it.opts === 'mountain') { const M = this.opts.mountain; sel('largeur', [1, 2, 3, 4, 5, 6, 7].map(n => [n, n + (n > 1 ? ' cases' : ' case')]), M.w, v => M.w = +v); sel('profondeur', [1, 2, 3, 4, 5].map(n => [n, n + (n > 1 ? ' cases' : ' case')]), M.d, v => M.d = +v); sel('hauteur', [2, 3, 4, 5, 6, 7, 8].map(n => [n, n + ' étages']), M.h, v => M.h = +v); sel('type', [['neige', 'Montagne de neige'], ['terre', 'Montagne de terre'], ['roche', 'Montagne de roche'], ['herbe', 'Montagne d’herbe']], M.type, v => M.type = v); }
      if (it.opts === 'tree') { sel('style', [['feuillu', 'Feuillu'], ['automne', 'Feuilles d’automne'], ['sapin', 'Sapin'], ['mort', 'Sans feuilles']], this.opts.tree.style, v => this.opts.tree.style = v); sel('taille', [[0.7, 'Petit'], [1, 'Moyen'], [1.4, 'Grand']], this.opts.tree.size, v => this.opts.tree.size = +v); }
      else if (it.opts === 'flowers') { const l = document.createElement('label'); l.textContent = 'couleurs '; box.appendChild(l); this.opts.flowers.colors.forEach((col, i) => { const inp = document.createElement('input'); inp.type = 'color'; inp.value = col; inp.title = 'Couleur ' + (i + 1); inp.addEventListener('input', () => this.opts.flowers.colors[i] = inp.value); l.appendChild(inp); }); const hint = document.createElement('span'); hint.className = 'hint'; hint.textContent = 'Trois couleurs mélangées dans la même touffe.'; box.appendChild(hint); }
      else if (it.opts === 'target' || it.opts === 'gate') {   // pastilles de couleur (huit)
        const cur = (it.opts === 'target' ? this.opts.target.letter : this.opts.gate.letter).toUpperCase(), l = document.createElement('label'); l.textContent = (it.opts === 'target' ? 'couleur' : 'ouverte par la cible') + ' '; const sw = document.createElement('span'); sw.className = 'roofs';
        for (const tc of BK.TARGET_COLORS) { const b = document.createElement('button'); b.className = 'roof' + (tc.key === cur ? ' on' : ''); b.style.background = tc.color; b.title = 'Cible ' + tc.name; b.addEventListener('click', () => { if (it.opts === 'target') this.opts.target.letter = tc.key; else this.opts.gate.letter = tc.key.toLowerCase(); sw.querySelectorAll('.roof').forEach(x => x.classList.toggle('on', x === b)); }); sw.appendChild(b); }
        l.appendChild(sw); box.appendChild(l);
      }
      const hint = document.createElement('span'); hint.className = 'hint'; hint.textContent = 'Recliquer une case déjà posée lui applique ces réglages.'; box.appendChild(hint);
      if (it.opts === 'house') {
        const keys = Object.keys(this.houses); if (!keys.length) { const h2 = document.createElement('span'); h2.className = 'hint'; h2.textContent = 'Pose d’abord une maison sur la carte ; ensuite le bouton « Modifier l’intérieur » apparaît ici.'; box.appendChild(h2); }
        else { if (!this.lastHouse || !this.houses[this.lastHouse]) this.lastHouse = keys[keys.length - 1];
          const l = document.createElement('label'); l.textContent = '🏠 intérieur de la maison '; const sel = document.createElement('select'); for (const k of keys) { const o = document.createElement('option'); o.value = k; const hp = this.houses[k]; o.textContent = 'en ' + k.replace(',', ', ') + ' · ' + hp.w + '×' + hp.d + (hp.interior ? ' · intérieur fait' : ''); if (k === this.lastHouse) o.selected = true; sel.appendChild(o); } sel.addEventListener('change', () => { this.lastHouse = sel.value; }); l.appendChild(sel); box.appendChild(l);
          const b = document.createElement('button'); b.className = 'primary'; b.textContent = '🚪 Modifier l’intérieur'; b.addEventListener('click', () => { BK.audio.click(); this.editInterior(this.lastHouse); }); box.appendChild(b); }
      }
    }
    // Gros décors sur plusieurs cases (volcan 3 × 3, montagne w × d) : une case d'ancrage avec les réglages, les autres marquées « part ».
    bigCells(c, r, it) {
      const M = this.opts.mountain, w = it.deco === 'volcano' ? 3 : M.w, d = it.deco === 'volcano' ? 3 : M.d, x0 = it.deco === 'volcano' ? c - 1 : c - Math.floor((w - 1) / 2), y0 = it.deco === 'volcano' ? r - 1 : r - (d - 1);
      const cells = []; for (let rr = y0; rr < y0 + d; rr++) for (let cc = x0; cc < x0 + w; cc++) cells.push({ c: cc, r: rr }); return cells;
    }
    paintBig(c, r, it) {
      const cells = this.bigCells(c, r, it);
      if (!cells.every(q => q.c > 0 && q.r > 0 && q.c < this.map.cols - 1 && q.r < this.map.rows - 1)) { this.toast('Pas assez de place ici pour ce décor'); return; }
      const key = c + ',' + r;
      for (const q of cells) { const k2 = q.c + ',' + q.r, pr = this.props[k2]; if (pr && (pr.of || pr.deco === 'mountain' || pr.deco === 'volcano')) this.removeBig(pr.of || k2); }
      for (const q of cells) { const k2 = q.c + ',' + q.r; this.grid[q.r][q.c] = '"'; this.enemies = this.enemies.filter(e => e.c !== q.c || e.r !== q.r); delete this.houses[k2]; this.props[k2] = { deco: it.deco + 'part', of: key }; }
      this.props[key] = it.deco === 'volcano' ? { deco: 'volcano' } : { deco: 'mountain', mw: this.opts.mountain.w, md: this.opts.mountain.d, mh: this.opts.mountain.h, mtype: this.opts.mountain.type };
      this.rebuild();
    }
    removeBig(anchor) {
      const fill = '~ '.includes(this.map.base) ? '.' : this.map.base;
      for (const [k2, pr] of Object.entries(this.props)) if (k2 === anchor || pr.of === anchor) { const [cc, rr] = k2.split(',').map(Number); delete this.props[k2]; if (this.inside(cc, rr)) this.grid[rr][cc] = fill; }
    }
    // Onglet Maisons : une carte par maison posée, à droite ; un clic ouvre tout de suite son intérieur.
    houseCards(items) {
      const source=this.parent ? this.parent.editor : this; const keys = Object.keys(source.houses); if (!keys.length) return;
      const sep = document.createElement('span'); sep.className = 'sep'; items.appendChild(sep);
      for (const k of keys) {
        const hp = source.houses[k], b = document.createElement('button'); b.className = 'item house'; b.title = 'Ouvrir l’intérieur de cette maison';
        b.innerHTML = '<span class="ic">' + (hp.interior ? '🚪' : '🏠') + '</span><span>Maison en ' + k.replace(',', ', ') + '</span><span class="small">' + hp.w + '×' + hp.d + (hp.interior ? ' · intérieur fait' : ' · à meubler') + '</span>';
        if(this.parent && this.parent.key===k)b.classList.add('on'); b.addEventListener('click', () => { BK.audio.click(); if(this.parent){this.returnToParent();source.editInterior(k);}else{this.lastHouse=k;this.editInterior(k);} }); items.appendChild(b);
      }
    }
    // Onglet Magasin : la musique de la pièce (elle ne joue que si un instrument y est posé : piano, juke-box, guitare, tambour).
    musicCard(items) {
      const box = document.createElement('div'); box.className = 'item music'; const l = document.createElement('label'); l.textContent = '🎵 Musique';
      const sel = document.createElement('select'); for (const o of [{ id: '', name: 'Aucune' }].concat((BK.music && BK.music.LIST) || [])) { const op = document.createElement('option'); op.value = o.id; op.textContent = o.name; if ((this.map.music || '') === o.id) op.selected = true; sel.appendChild(op); }
      sel.addEventListener('change', () => { this.map.music = sel.value; this.markDirty(); this.toast(sel.value ? 'Musique : elle jouera s’il y a un instrument dans la pièce' : 'Plus de musique'); });
      box.title = 'La musique joue dans la pièce seulement s’il y a un instrument (piano, juke-box, guitare, tambour, onglet Déco). Pour le joueur, l’instrument n’est qu’une décoration.';
      box.appendChild(l); box.appendChild(sel); items.appendChild(box);
    }
    // Ouvre un sous-éditeur sur la pièce intérieure d'une maison ; « Retour à l'extérieur » la range dans la maison.
    editInterior(key) {
      const hp = this.houses[key]; if (!hp) return; if (!hp.interior) hp.interior = BK.defaultInterior();
      const it = hp.interior; BK.openEditor({ id: this.map.id + ':' + key, name: 'Intérieur de ' + this.map.name, roomExit:!!it.roomExit, cols: it.cols || it.grid[0].length, rows: it.rows || it.grid.length, theme: it.theme || 'interior', base: it.base || 'y', grid: it.grid, enemies: it.enemies, npcs: it.npcs, shop: it.shop, props: it.props, music: it.music || '' }, { parent: { editor: this, key } });
    }
    returnToParent() {
      const P = this.parent, hp = P.editor.houses[P.key]; if (hp) hp.interior = { roomExit:true, cols: this.map.cols, rows: this.map.rows, theme: this.map.theme, base: this.map.base, grid: this.rows(), enemies: this.enemies, npcs: this.npcs, shop: this.shop, props: this.props, music: this.map.music || '' };
      P.editor.markDirty(); P.editor.rebuild(); BK.editor = P.editor; BK.current = P.editor; BK.show('editor'); P.editor.buildPanel(); P.editor.toast('Intérieur enregistré dans la maison');
    }
    buildHouseOptions(box) {
      const sub = box;
      const sel = (label, opts, val, on) => { const l = document.createElement('label'); l.textContent = label + ' '; const s = document.createElement('select'); for (const v of opts) { const o = document.createElement('option'); o.value = v; o.textContent = v; if (v === val) o.selected = true; s.appendChild(o); } s.addEventListener('change', () => on(+s.value)); l.appendChild(s); sub.appendChild(l); };
      sel('largeur', [1, 3, 5, 7], this.house.w, v => this.house.w = v); sel('profondeur', [1, 2, 3, 4], this.house.d, v => this.house.d = v);
      const roofs = document.createElement('span'); roofs.className = 'roofs'; sub.appendChild(roofs);
      for (const col of ['#b5452a', '#2f8a3a', '#1e5bd8', '#7b3fb0', '#f4c430', '#6c6c76', '#e91e63', '#26c6da']) { const b = document.createElement('button'); b.className = 'roof' + (col === this.house.roof ? ' on' : ''); b.style.background = col; b.title = 'Toit ' + col; b.addEventListener('click', () => { this.house.roof = col; roofs.querySelectorAll('.roof').forEach(x => x.classList.toggle('on', x === b)); pick.value = col; }); roofs.appendChild(b); }
      const pick = document.createElement('input'); pick.type = 'color'; pick.value = this.house.roof; pick.title = 'Autre couleur de toit'; pick.addEventListener('input', () => { this.house.roof = pick.value; roofs.querySelectorAll('.roof').forEach(x => x.classList.remove('on')); }); roofs.appendChild(pick);
    }
    buildForm(box) {
      box.className = 'items form';
      const row = (label, el) => { const l = document.createElement('label'); l.innerHTML = '<span>' + label + '</span>'; l.appendChild(el); box.appendChild(l); return el; };
      const input = (type, val, on, attrs) => { const i = document.createElement('input'); i.type = type; i.value = val; Object.assign(i, attrs || {}); i.addEventListener('change', () => on(i)); return i; };
      row('Nom', input('text', this.map.name, i => { this.map.name = i.value.slice(0, 40) || 'Mon tableau'; this.settingsChanged('Renommé'); }, { maxLength: 40 }));
      const cols = row('Largeur', input('number', this.map.cols, i => this.resize(+i.value, this.map.rows), { min: 9, max: 48 }));
      const rows = row('Hauteur', input('number', this.map.rows, i => this.resize(this.map.cols, +i.value), { min: 7, max: 48 }));
      const sel = (opts, val, on) => { const s = document.createElement('select'); for (const [v, n] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = n; if (v === val) o.selected = true; s.appendChild(o); } s.addEventListener('change', () => on(s.value)); return s; };
      row('Décor', sel(Object.entries(BK.THEMES).map(([k, t]) => [k, t.name]), this.map.theme, v => this.setTheme(v)));
      row('Fond', sel([['~', 'Eau'], [' ', 'Vide (ciel)'], ['.', 'Pierre'], [',', 'Gazon']], this.map.base, v => this.setBase(v)));
      const trimBtn = document.createElement('button'); trimBtn.textContent = '✂️ Rogner les bords vides'; trimBtn.addEventListener('click', () => { BK.audio.click(); this.trim(); }); box.appendChild(trimBtn);
      const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'Astuce : clique sur les cases en pointillé autour de la carte pour la faire grandir case par case.'; box.appendChild(p);
      const share = document.createElement('div'); share.className = 'share'; box.appendChild(share);
      const btn = (label, fn, cls) => { const b = document.createElement('button'); b.textContent = label; if (cls) b.className = cls; b.addEventListener('click', () => { BK.audio.click(); fn(); }); share.appendChild(b); };
      btn('📋 Copier le code', () => this.copyCode(), 'primary'); btn('📥 Coller un code', () => this.pasteCode()); btn('🗑️ Supprimer ce tableau', () => this.remove(), 'danger');
      void cols; void rows;
    }
    data() { return { ...this.map, grid: this.rows(), enemies: this.enemies, npcs: this.npcs, shop: this.shop, houses: this.houses, props: this.props, updated: Date.now() }; }
    save() { if (this.parent) { this.returnToParent(); return; } const maps = BK.loadMaps().filter(m => m.id !== this.map.id); maps.unshift(this.data()); BK.saveMaps(maps.slice(0, 40)); this.dirty = false; if (this.saveBtn) this.saveBtn.classList.remove('attention'); this.toast('Tableau sauvegardé'); }
    test() {
      if (!this.world.starts[0]) { alert('Place d’abord un départ (onglet Objets).'); return; }
      if (!this.parent) this.save(); BK.editor = this; BK.show('game'); BK.current = new BK.Adventure(BK.selectedChar || 'zachary', 0, { custom: BK.mapToStage(this.data()) });
    }
    exportJson() { const blob = new Blob([JSON.stringify(this.data(), null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (this.map.name || 'tableau').replace(/[^\w\-]+/g, '_') + '.bomberkid.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
    importJson() { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.addEventListener('change', () => { const f = inp.files[0]; if (!f) return; f.text().then(txt => { const m = JSON.parse(txt); if (!m || !Array.isArray(m.grid)) throw Error('format'); BK.openEditor(m); }).catch(() => alert('Fichier non reconnu.')); }); inp.click(); }
    remove() { BK.confirmDialog({ title: '🗑️ Supprimer le tableau ?', text: '« ' + this.map.name + ' » disparaîtra de « Mes tableaux ».', confirmLabel: 'Supprimer', onConfirm: () => { BK.deleteMap(this.map.id); BK.editor = null; BK.current = null; BK.toMenu(); } }); }
    quit() { if (this.parent) { this.returnToParent(); return; } const leave = () => { BK.current = null; BK.toMenu(); }; if (this.dirty) BK.confirmDialog({ title: '✏️ Changements non sauvegardés', text: 'Des changements ne sont pas sauvegardés. Quitter quand même ?', cancelLabel: 'Rester', confirmLabel: 'Quitter sans sauvegarder', onConfirm: leave }); else leave(); }
  }
  BK.Editor = Editor; BK.EDITOR_TABS = TABS;
})(window.BK);
