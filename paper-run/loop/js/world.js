// Paper Loop — le monde : tableau 1 (salle de départ, boutique, course UN, puits à saut mural) et, à droite du haut du
// puits, tableau 2 (hub 2 avec cinq machines, puits de départ, salle 1 = la course DEUX, salle 2 = le retour piégé), puis à
// droite du hub 2, des couloirs à élan obligatoire vers le tableau 3 (hub 3 avec six machines, course TROIS sur deux salles).
// La carte est construite par rectangles (en cases de 48 px) : # bloc, - plateforme traversable, ^ punaises (pointes en
// haut), v punaises au plafond, < et > punaises sur un mur (pointes vers la gauche / la droite).
(function (root) {
  'use strict';
  const PL = root.PL = root.PL || {};
  const W = 224, H = 36;
  const g = Array.from({ length: H }, () => Array(W).fill(' '));
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };

  // ------------------------------------------------------------------ tableau 1
  fill(0, 0, W - 1, 0, '#');        // plafond du monde
  fill(0, 31, W - 1, H - 1, '#');   // sol profond
  fill(0, 30, 39, 30, '#');         // plancher du hub (salle de départ, boutique, entrée de la course)
  fill(0, 1, 35, 21, '#');          // masse de carton au-dessus du couloir du hub (couloir : rangées 22 à 29)
  fill(53, 1, W - 1, H - 1, '#');   // toute la masse de droite (le tableau 2 y est creusé plus bas)
  fill(36, 6, 39, 15, '#');         // bloc au-dessus de la tirelire = mur gauche du puits à saut mural (le puits : colonnes 40-42, rangées 6 à 18)
  fill(43, 6, 52, 10, '#');         // plafond de la course = plancher de la salle du haut (rangées 1 à 5)
  fill(43, 11, 43, 16, '#');        // mur droit du puits à saut mural
  fill(36, 19, 42, 20, '#');        // corniche d'arrivée (la tirelire est dessus)
  fill(34, 16, 35, 21, ' ');        // le trou à gauche de la tirelire : chute directe dans le couloir du hub, à côté de la ligne de départ
  // Le raccourci de la course UN (dessin de Matthieu) : une cheminée de 2 cases (colonnes 40-41) qui descend de la corniche
  // jusqu'au niveau de la première plateforme, le long d'un seul mur (Matthieu a retiré le mur droit). Avec le saut mural on
  // monte tout droit du pas de départ à la corniche ; sans, le trou dans la corniche se saute (2 cases).
  fill(40, 19, 41, 20, ' ');        // passage dans la corniche (sortie de la cheminée)
  fill(39, 21, 39, 26, '#');        // le mur qui descend de la corniche : on s'y accroche en sautant du pas de départ
  fill(40, 30, 52, 30, '^');        // punaises au fond de la course
  fill(43, 27, 46, 27, '-');        // plateforme 1 (décalée à droite pour laisser la place à la cheminée)
  fill(48, 24, 52, 24, '-');        // plateforme 2 (contre le mur droit)
  fill(43, 21, 46, 21, '-');        // plateforme 3
  fill(45, 20, 45, 20, '^');        // une punaise au milieu de la plateforme 3 : on la saute

  // ------------------------------------------------------------------ tableau 2 (d'après les quatre captures de la démo)
  // Hub 2 : couloir en haut (rangées 1-6, plancher rangée 7), machines, panneau, puis le puits de départ (colonnes 75-77).
  fill(53, 1, 136, 6, ' ');         // couloir du hub 2, une marche plus bas que la salle du haut
  fill(75, 7, 77, 19, ' ');         // puits de départ (3 cases : on peut le remonter en saut mural pour revenir au hub)
  // Salle 1 (rangées 20-33, colonnes 73-134, plancher rangée 34) : la course DEUX, de gauche à droite.
  fill(73, 20, 134, 33, ' ');
  fill(73, 32, 78, 33, '#');        // corniche d'arrivée du puits (le pas de la course)
  fill(79, 33, 134, 33, '^');       // punaises sur tout le sol…
  fill(105, 33, 111, 33, ' ');      // …sauf le fond du fossé (rater l'élan n'est pas mortel)
  fill(73, 24, 73, 27, '>');        // punaises sur le mur gauche, au-dessus de la corniche
  fill(85, 28, 85, 33, '#'); fill(85, 27, 85, 27, '^');   // pilier à punaises (1 case de large, Matthieu n'arrivait pas à passer le large) : saut mural sur sa face gauche, puis par-dessus
  fill(89, 29, 92, 29, '-');        // plateforme après le grand pilier
  fill(97, 26, 97, 33, '#'); fill(97, 25, 97, 25, '^');   // pilier étroit à punaises, un peu plus haut
  fill(101, 26, 104, 26, '-');      // plateforme d'élan (bord gauche du fossé)
  fill(106, 30, 107, 30, '-'); fill(109, 29, 110, 29, '-');   // la voie basse : deux marches pour remonter du fond du fossé
  fill(112, 26, 134, 26, '-');      // la dalle d'arrivée est une plateforme traversable (rien à agripper dessous) ; fossé de 7 cases = élan
  fill(134, 29, 134, 32, '<');      // punaises sur le mur droit, sous la dalle
  // Cheminée de retour (colonnes 133-134) : de la dalle jusqu'à la salle 2, ouverte sur la salle 2 en haut (rangées 9-14).
  fill(133, 9, 134, 25, ' ');
  fill(132, 15, 132, 23, '#');      // mur gauche de la cheminée (on passe dessous pour y entrer depuis la dalle)
  // Salle 2 (rangées 9-18, colonnes 78-131, plancher rangée 19 = plafond de la salle 1) : le retour, de droite à gauche.
  fill(82, 9, 131, 14, ' '); fill(79, 15, 131, 18, ' ');   // la salle (la tirelire est à son bout gauche, colonnes 79-80)
  // Retour au départ : une cheminée étroite (colonnes 79-80, entre les murs 78 et 81) monte de la tirelire jusqu'au couloir du
  // hub 2, juste à droite du puits ; en haut, une plateforme traversable : on en sort, on ne peut pas y retomber.
  fill(79, 8, 80, 14, ' '); fill(79, 7, 80, 7, '-');
  fill(132, 9, 132, 14, ' ');       // ouverture de la cheminée vers la salle 2
  fill(128, 15, 131, 18, '#');      // pilier d'entrée (on y atterrit en sortant de la cheminée)
  fill(83, 18, 127, 18, '^');       // punaises au sol (le bout gauche, colonnes 79-82, est sûr : c'est l'arrivée)
  fill(98, 9, 127, 9, 'v');         // punaises au plafond
  fill(112, 16, 123, 16, '#'); fill(116, 15, 118, 15, '^');   // longue plateforme avec des punaises au milieu
  fill(106, 15, 108, 15, '-');      // marche
  fill(100, 10, 101, 11, '#'); fill(100, 12, 101, 12, 'v'); fill(102, 10, 102, 11, '>');   // bloc à punaises suspendu
  fill(99, 15, 101, 15, '-');       // marche sous le bloc
  fill(92, 15, 94, 15, '-'); fill(85, 16, 87, 16, '-');       // marches vers la sortie

  // ------------------------------------------------------------------ vers le tableau 3 : couloirs à élan obligatoire
  // Le couloir du hub 2 continue à droite (rangées 1-6, plancher rangée 7) avec deux fossés de 7 cases : sans élan on tombe
  // dans les punaises ; les parois des fossés sont aussi à punaises (impossible de s'y accrocher pour remonter).
  fill(137, 1, 170, 6, ' ');
  // (les punaises des parois commencent dès la rangée du plancher : impossible de s'accrocher au rebord pour sauter plus loin)
  for (const x0 of [146, 159]) { fill(x0, 7, x0 + 6, 12, ' '); fill(x0, 12, x0 + 6, 12, '^'); fill(x0, 7, x0, 11, '>'); fill(x0 + 6, 7, x0 + 6, 11, '<'); }
  // Hub 3 : couloir (rangées 1-6), six machines, panneau, puits de départ (colonnes 196-198) jusqu'à la salle A.
  fill(171, 1, 222, 6, ' ');
  fill(196, 7, 198, 19, ' ');
  // Salle A (rangées 20-33, colonnes 171-222, plancher rangée 34) : d'après la 1re salle de la démo, parcourue vers la gauche.
  fill(171, 20, 222, 33, ' ');
  fill(171, 33, 222, 33, '^');      // punaises partout au sol…
  fill(193, 32, 200, 33, '#');      // …sauf la corniche d'arrivée du puits (le pas de la course)
  fill(177, 33, 182, 33, ' ');      // …et le pied de la cheminée
  fill(190, 28, 190, 33, '#'); fill(190, 27, 190, 27, '^');   // pilier étroit à punaises : on grimpe sa face droite et on saute par-dessus
  fill(186, 20, 189, 22, '#'); fill(186, 23, 189, 23, 'v');   // bloc suspendu à punaises : pas trop haut !
  fill(183, 29, 185, 29, '-');      // plateforme après le pilier
  fill(180, 20, 180, 30, '#'); fill(180, 15, 180, 16, '#');   // mur suspendu = paroi droite de la cheminée (on passe dessous)
  fill(176, 9, 176, 33, '#');       // paroi gauche de la cheminée
  fill(177, 24, 177, 26, '>');      // punaises sur la paroi gauche de la cheminée, à mi-hauteur
  fill(177, 9, 179, 32, ' ');       // la cheminée (colonnes 177-179) monte jusqu'à la salle B
  fill(210, 26, 210, 33, '#'); fill(210, 25, 210, 25, '^'); fill(222, 28, 222, 31, '<');   // décor-pièges à droite du pas (comme la démo)
  // Salle B (rangées 9-18, colonnes 181-194) : d'après la 2e salle de la démo. On entre par le haut de la cheminée, on passe
  // par-dessus le long bloc à punaises en sautant de bloc en bloc, la tirelire est à droite, puis la sortie tombe dans le puits.
  fill(181, 9, 194, 18, ' ');
  fill(180, 9, 180, 14, ' ');       // ouverture de la cheminée vers la salle B
  fill(181, 14, 182, 14, '-');      // plateforme d'entrée
  fill(183, 15, 192, 15, '#'); fill(183, 14, 192, 14, '^');   // long bloc à punaises (on passe au-dessus)
  fill(184, 18, 191, 18, '^');      // et des punaises dans le couloir en dessous (un piège, pas un chemin)
  fill(184, 9, 192, 9, 'v');        // punaises au plafond
  fill(185, 12, 186, 13, '#'); fill(189, 12, 190, 13, '#');   // les deux blocs flottants
  fill(193, 14, 194, 18, '#');      // la corniche de la tirelire
  // Retour au départ : cheminée (colonnes 193-194) au-dessus de la corniche, entre le mur du puits (195) et un bout de mur qui
  // pend du plafond (192, rangées 8-9) ; plateforme traversable en haut, dans le couloir du hub 3.
  fill(193, 8, 194, 8, ' '); fill(193, 7, 194, 7, '-'); fill(192, 8, 192, 9, '#');

  PL.WORLD = {
    id: 'usine', name: 'L’Usine de papier',
    map: g.map(r => r.join('')),
    // Courses. entry : où la course commence (kind 'x' : on franchit la ligne vers la droite avec les pieds entre y0 et
    // y1 ; kind 'y' : on tombe sous y entre x0 et x1). start : pas de départ (point de retour pendant la course).
    courses: [
      // Course UN : tables de Matthieu. rewards[k] = récompense après k achats « Récompense de base » (le k+1e achat coûte k+1
      // pièces) ; clonePrices[n] = prix du n+1e clone. Au-delà des tables : × 1,1 (récompense) et × 1,165 (clones) par cran.
      { id: 'un', name: 'UN', base: 1, medals: [{ id: 'silver', time: 3.29, bonus: 100 }, { id: 'gold', time: 1.8, bonus: 500 }],   // records (≤ temps) : étoile, bonus, tirelire argentée / dorée
        rewards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 21, 24, 27, 30, 33, 37, 41, 46, 51, 57, 63, 70, 77, 85, 94, 104, 115, 127, 140],
        clonePrices: [8, 11, 14, 17, 20, 24, 28, 33, 39, 46, 54, 63, 74, 86, 100, 116, 135, 157, 183, 213],
        start: { tx: 39, ty: 30 }, entry: { kind: 'x', x: 40 * 48, y0: 22 * 48, y1: 31 * 48 }, cancelAbove: 16 * 48,
        goal: { tx: 36, ty: 17, w: 2, h: 2 }, signTx: 29, signTy: 24, bannerTx: 29, bannerTy: 22,
        tip: 'Saute dans le trou à gauche pour revenir au départ !' },
      // Course DEUX : les nombres de la démo. Récompense = 400 × (achats + 1) ; clone 800 × 1,21ⁿ ; récompense 400 × 1,14ⁿ.
      { id: 'deux', name: 'DEUX', base: 400, clonePrice: 800, cloneRate: 1.21, multPrice: 400, multRate: 1.14,
        start: { tx: 74, ty: 7 }, entry: { kind: 'y', y: 19 * 48, x0: 75 * 48, x1: 78 * 48 },
        goal: { tx: 79, ty: 17, w: 2, h: 2 }, signTx: 69, signTy: 3, bannerTx: 69, bannerTy: 1.5, pad: { tx: 73, ty: 32, w: 6 },   // pad : la corniche d'arrivée du puits, marquée DÉPART
        tip: 'Remonte la cheminée au-dessus de la tirelire : le puits est juste à côté !' },
      // Course TROIS : les nombres de la démo (récompense 2,22 M × niveau, clone 3,96 M × 1,21ⁿ, récompense 1,58 M × 1,14ⁿ).
      { id: 'trois', name: 'TROIS', base: 2220000, clonePrice: 3960000, cloneRate: 1.21, multPrice: 1580000, multRate: 1.14,
        start: { tx: 195, ty: 7 }, entry: { kind: 'y', y: 19 * 48, x0: 196 * 48, x1: 199 * 48 },
        goal: { tx: 193, ty: 12, w: 2, h: 2 }, signTx: 190, signTy: 3, bannerTx: 190, bannerTy: 1.5, pad: { tx: 193, ty: 32, w: 8 },
        tip: 'Remonte la cheminée au-dessus de la tirelire : le puits est juste à côté !' },
    ],
    // Hubs : plancher avec les machines ; chaque hub vend les clones et la récompense de SA course.
    // Les machines sont des blocs (2 cases de large, 1 de haut, le bas de la carte) qui flottent 3 cases au-dessus du plancher :
    // on saute dessous pour acheter (coup de tête, comme les blocs de Mario). tx : case de gauche du bloc.
    hubs: [
      { id: 'un', course: 'un', spawn: { tx: 3, ty: 30 }, machines: [{ id: 'wall', tx: 17 }, { id: 'clone', tx: 20 }, { id: 'mult', tx: 23 }] },
      { id: 'deux', course: 'deux', spawn: { tx: 53, ty: 7 }, machines: [{ id: 'dash', tx: 54 }, { id: 'watts', tx: 57 }, { id: 'cmult', tx: 60 }, { id: 'clone', tx: 63 }, { id: 'mult', tx: 66 }] },
      { id: 'trois', course: 'trois', spawn: { tx: 171, ty: 7 }, machines: [{ id: 'double', tx: 172 }, { id: 'watts2', tx: 175 }, { id: 'cmult', tx: 178 }, { id: 'speed', tx: 181 }, { id: 'clone', tx: 184 }, { id: 'mult', tx: 187 }] },
    ],
    poster: { tx: 4, ty: 23, w: 6, h: 6 },
    decor: [{ kind: 'wheel', tx: 108.5, ty: 32.2, r: 62 }],   // la grande roue de la salle 1 (décor, dans le fond du fossé)
    // Flèches et rappels. need : flèche visible seulement une fois le pouvoir acheté (et l'étiquette tant qu'il manque) ;
    // labelHide : étiquette cachée une fois le pouvoir acheté.
    markers: [
      { tx: 40, ty: 11.5, w: 3, dir: 'up', label: 'Saut mural requis', labelHide: 'wall' },   // le puits au-dessus de la course UN
      { tx: 34, ty: 16.5, w: 2, dir: 'down' },                                               // le trou de retour, à gauche de la tirelire
      { tx: 40, ty: 23.5, w: 2, dir: 'up', need: 'wall' },                                   // le raccourci (cheminée) de la course UN
      { tx: 75, ty: 1.5, w: 3, dir: 'down' },                                                // le puits de départ de la course DEUX
      { tx: 105, ty: 23, w: 7, dir: 'right', need: 'dash', label: 'Élan requis' },           // le fossé (raccourci à l'élan)
      { tx: 133, ty: 20, w: 2, dir: 'up' },                                                  // la cheminée de retour vers la salle 2
      { tx: 124, ty: 11, w: 3, dir: 'left' },                                                // dans la salle 2 : la tirelire est à gauche
      { tx: 79, ty: 10, w: 2, dir: 'up' },                                                   // la cheminée de retour de la DEUX
      { tx: 193, ty: 9.5, w: 2, dir: 'up' },                                                 // la cheminée de retour de la TROIS
      { tx: 139, ty: 3, w: 3, dir: 'right', need: 'dash', label: 'Élan requis' },             // les couloirs vers le tableau 3
      { tx: 196, ty: 1.5, w: 3, dir: 'down' },                                               // le puits de départ de la course TROIS
      { tx: 177, ty: 30, w: 3, dir: 'up' },                                                  // la cheminée de la salle A vers la salle B
    ],
    // Point de retour après une mort hors course, selon la case des pieds : { hub }, { course } ou une case { tx, ty }.
    startFor: (tx, ty) => tx >= 171 ? (ty <= 7 ? { hub: 'trois' } : { course: 'trois' })
      : tx >= 137 ? { tx: 139, ty: 7 }   // les couloirs à élan : on revient au début du premier fossé
      : tx >= 53 ? (ty <= 7 ? { hub: 'deux' } : { course: 'deux' }) : (tx > 34 && ty >= 6 ? { course: 'un' } : { hub: 'un' }),
  };
})(typeof window !== 'undefined' ? window : globalThis);
