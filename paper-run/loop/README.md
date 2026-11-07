# Paper Loop

Plateformer « en boucle » façon papier découpé (même style que Paper Run : contours épais, bord blanc, ombres
portées, têtes de la famille). On court jusqu'à la tirelire pour gagner des pièces, on enregistre son parcours, et des
clones de papier le refont en boucle pour gagner des pièces à notre place pendant qu'on achète des pouvoirs qui
ouvrent la suite du tableau.

Paper Loop vit dans `PaperRun/loop/` : il fait partie du même jeu que Paper Run, on choisit l'un ou l'autre sur
l'écran d'accueil de `PaperRun/index.html` (ou on ouvre `loop/index.html` directement). Aucun outil de build. Tout est en
JavaScript et canvas. Les têtes viennent des portraits de famille partagés avec Paper Run (`../js/family-heads.js` +
`../js/family-head-sources.js`). La physique, les entrées et l'audio sont des copies de ceux de Paper Run (namespace `PL`).

## Ce qu'il y a pour l'instant (v0.2)

- **Salle de départ** : affiche des commandes (flèches ou A / D pour courir, Espace ou ↑ pour sauter, sauter sous une
  boîte pour acheter).
- **Boutique** : trois machines (écran avec le prix, nom, compteur) qui flottent trois cases au-dessus du plancher, façon
  blocs de Mario : on saute dessous pour acheter (la machine sursaute, pièces qui giclent ; elle tremble s'il manque des
  pièces). Seul le bas de la carte (2 × 1 cases) est solide. Les machines « Clone » et « Récompense » portent le nom de
  leur course.
  - *Saut mural* (700 pièces, une fois) : glisser le long des murs et sauter d'un mur à l'autre.
  - *Clone* (table de Matthieu : 8, 11, 14, 17, 20, 24, 28, 33, 39, 46, 54, 63, 74, 86, 100, 116, 135, 157, 183, 213, puis
    × 1,165 par cran) : un clone de plus qui rejoue ton meilleur parcours en boucle.
  - *Récompense de base* : le k-ième achat coûte k pièces et la récompense suit la table `rewards` de la course (1, 2, 3 …
    11, 13, 15, 17, 19, 21, 24, 27, 30, 33, 37, 41, 46, 51, 57, 63, 70, 77, 85, 94, 104, 115, 127, 140, puis × 1,1 par cran).
    La carte annonce la prochaine récompense. La course DEUX garde la formule base × (achats + 1) avec ses prix × 1,7 / × 2,1.
- **Course UN** : on franchit la ligne à damier à droite du panneau, le chrono part, on grimpe les trois plateformes
  (en sautant par-dessus le trou de deux cases dans la corniche) et on touche la tirelire. Récompense de base 1.
  **Médailles** : un record à 3,29 s ou moins donne la médaille d'argent (100 pièces une seule fois, étoile d'argent sur le
  panneau, médaille dans les stats, tirelire argentée et brillante) ; à 1,80 s ou moins, la médaille d'or (500 pièces,
  étoile et tirelire dorées). Réglages dans `medals` de la définition de la course. Récompense = 1 × (achats « Récompense de base » + 1). **La boucle** : à
  gauche de la tirelire, un trou (flèche vers le bas) tombe directement dans le couloir du hub, cinq cases à gauche de
  la ligne de départ ; pas besoin de refaire le chemin à l'envers. Tomber sur les punaises ramène au pas de départ et annule la course ; revenir à gauche
  de la ligne l'annule aussi.
- **Clones** : à chaque record (meilleur temps), le parcours (position à chaque 1/60 s) est enregistré et remplace le
  précédent : les clones rejouent toujours ta course la plus rapide, pas la dernière.
  Chaque clone le rejoue, encaisse la récompense × le multiplicateur des clones (0,1 au départ, `PL.ECON.cloneMult`,
  affiché sur le panneau sous la récompense), au moins 1 pièce, en arrivant à la tirelire, attend 0,6 s et recommence.
  L'or est toujours un entier (`PL.addGold`, `PL.fmtGold`). Tant qu'aucune
  course n'est finie, les clones attendent au pas de départ. Le HUD affiche le revenu estimé (`+x / s`).
- **Le raccourci (dessin de Matthieu)** : un mur descend de la corniche jusqu'au niveau de la première plateforme,
  au-dessus du pas de départ, avec un passage de deux cases dans la corniche juste à sa droite. La plateforme du haut
  a une punaise au milieu, à sauter. Avec le saut mural, on saute du pas de départ dans la cheminée et on
  monte en zigzag jusqu'au passage dans la corniche : environ 1,6 s au lieu de 3,4 s, donc des clones deux fois plus
  rentables. Sans saut mural, la cheminée finit sur les punaises. Une flèche vers le haut y apparaît une fois le pouvoir
  acheté.
- **Le puits** : au-dessus du bout droit de la corniche (à l'écart de la tirelire, pour ne pas déclencher le retour au
  départ), un puits de 3 cases de large avec une flèche. Sans saut mural, impossible ; avec, on grimpe jusqu'à la salle
  du haut, qui s'ouvre à droite sur le tableau 2. Monter dans le puits annule la course en cours.
- **Tableau 2 (d'après les captures de la démo)** : le couloir du hub 2 (en haut à droite, une marche plus bas que la
  salle du haut) avec cinq machines aux nombres de la démo : *Élan* (3 M, une fois, Maj ou X), *Pièces +50 %* (55 k puis
  275 k, plafond à 100 %), *Part des clones* (3,8 k · 9,6 k · 21,2 k · 44,4 k … = 5800 × 2ⁿ − 2000, +0,1 par achat), tous
  globaux, puis *Clone DEUX* (800 × 1,21ⁿ) et *Récompense DEUX* (400 × 1,14ⁿ, plafond à 46 ×). Puis le panneau DEUX et le
  puits de départ (3 cases, flèche vers le bas) : y tomber lance la course ; on peut aussi le remonter en saut mural.
  - *Salle 1 (la course)* : corniche d'arrivée marquée DÉPART (damier et drapeau), punaises sur tout le sol et sur le mur de
    gauche, pilier à punaises d'une case (saut mural sur sa face gauche, puis par-dessus), plateforme, pilier étroit à punaises, plateforme
    d'élan, **fossé de 7 cases** (élan ; sinon deux marches au fond pour remonter), grande roue en décor, dalle
    traversable, punaises sur le mur de droite, puis la cheminée à droite qui monte dans la salle 2.
  - *Salle 2 (la suite de la course)* : au-dessus de la salle 1, traversée de droite à gauche : pilier d'entrée, punaises
    au plafond et au sol, longue plateforme avec des punaises au milieu, bloc à punaises suspendu, marches, et **la
    tirelire tout au bout** (récompense de base 400 × niveau). Au-dessus de la tirelire, une cheminée étroite (2 cases,
    entre deux murs) remonte en saut mural jusqu'au couloir du hub 2, juste à côté du puits : on y retombe, la course
    repart. La plateforme traversable en haut empêche d'y sauter depuis le hub.
  - Punaises orientées dans la carte : `v` plafond, `<` / `>` murs (zone qui blesse du côté de la base des pointes).
- **Tableau 3 (d'après les captures de la démo)** : à droite du hub 2, un couloir avec deux **fossés de 7 cases aux
  parois à punaises** : sans élan on tombe dans les punaises (et on réapparaît avant le premier fossé). Puis le hub 3 et
  ses six machines aux nombres de la démo : *Saut en l'air* (554,71 G, un deuxième saut en vol), *Pièces +50 %* (316,98 M
  puis × 5, deux crans de plus sur le bonus global), *Part des clones* (la même machine globale), *Clones rapides*
  (6,34 M puis × 2 : chaque tour de clone a 5 % × n de chance d'aller deux fois plus vite), *Clone TROIS* (3,96 M × 1,21ⁿ)
  et *Récompense TROIS* (1,58 M × 1,14ⁿ ; récompense 2,22 M × niveau). Le puits de départ tombe dans la **salle A**
  (parcourue vers la gauche : pilier étroit à punaises, bloc suspendu à punaises, plateforme, cheminée à punaises
  murales) puis la **salle B** (plateforme d'entrée, on saute de bloc flottant en bloc flottant par-dessus un long bloc
  à punaises, sous un plafond à punaises, jusqu'à la tirelire sur sa corniche). Au-dessus de la tirelire, une cheminée
  étroite remonte au couloir du hub 3, juste à côté du puits : la boucle.
- **Économie à deux courses** : chaque course a sa récompense de base, ses clones, son multiplicateur « Récompense de
  base », son meilleur temps et son parcours enregistré (`p.courses.un` / `p.courses.deux`). Récompense = base × (achats
  + 1) × (1 + 50 % × « Pièces en plus »). Le saut mural, l'élan, « Pièces en plus » et « Part des clones » sont globaux.
  L'or s'affiche comme dans la démo : 999, puis « 2,52 k », puis « 3,00 M ».
- **Sauvegarde** : `localStorage` `paperloop.save`, un profil par personnage (`gold`, `mult`, `clones`, `wall`, `best`,
  `runs`, `total`, `rec` = le parcours enregistré ; depuis v0.2 ces champs par course sont dans `courses`, les vieilles
  sauvegardes sont migrées par `PL.migrateProfile`). Tab affiche les stats, Échap le menu (son, changer de personnage,
  recommencer à zéro).

## Fichiers

- `js/data.js` — personnages, machines (`PL.MACHINES`, prix par `price(n)`), économie (`PL.reward`).
- `js/world.js` — le monde : carte construite par rectangles (128 × 36 cases de 48 px), les courses (`entry` : ligne
  franchie vers la droite pour UN, chute dans le puits pour DEUX ; tirelire, panneau, bannière), les hubs (apparition,
  machines), l'affiche, les flèches et rappels (`markers`), et `startFor` (où réapparaître après une mort hors course).
- `js/physics.js` — copie de la physique de Paper Run (namespace `PL`) ; le saut mural vient de `cfg.wall`
  (`PL.buildCfg({ ruban: 1 })`). Réglages propres à Paper Loop : gravité 2100 et chute max 950 (Paper Run : 2500 / 1150),
  saut 825 pour garder la même hauteur (≈ 162 px), et gravité réduite à 55 % quand |vy| < 150 : on flotte un instant au
  sommet du saut.
- `js/render.js` — rendu papier (repris de Paper Run) + mur de carton riveté, terrain (pré-dessiné en morceaux de 2048 px :
  un seul canvas de 10 000 px dépasse la limite de Safari), machines, panneau, bannière,
  tirelire, affiche, flèche, clones gris (`R.drawClone`).
- `js/game.js` — `PL.Game` : boucle, course et enregistrement, clones, achats, caméra, HUD. Les clones hors écran ne sont
  pas dessinés, et ceux à moins d'un personnage du héros sont invisibles (opacité croissante avec la distance).
- **Performance des clones** : `R.drawClone` dessine des sprites gris mis en cache (par personnage, pose et phase
  d'animation, 72 par personnage, préparés au lancement par `R.warmClones`). Ne jamais revenir à `ctx.filter =
  'grayscale'` sur le dessin direct : mesuré à ~1000 × plus lent (le laptop chauffait avec 20 clones).
- `js/main.js` — écrans (titre, personnages, jeu), sauvegarde, menu de pause. `PL.app.give(n)` donne des pièces,
  `PL.app.reset()` efface tout.

## Outils

- `node tools/test-course.cjs` — A* sur la vraie physique : la course UN est faisable sans pouvoir, le puits est
  impossible sans saut mural et possible avec, le trou ramène au pas de départ, la cheminée (plateforme 1 retirée)
  est impossible sans saut mural et possible avec ; course DEUX faisable en saut mural, le fossé (voie basse fermée)
  impossible sans élan et possible avec, course DEUX plus rapide avec l'élan, retour par la cheminée et la salle 2
  (par points de passage, tirelire au bout de la salle 2), retour par la cheminée étroite jusqu'au hub 2, impossible de
  sauter du hub dans cette cheminée ; couloirs du tableau 3 impossibles sans élan et possibles avec, course TROIS, retour
  par la cheminée jusqu'au hub 3.
  `OUT=/tmp/acts.json node tools/test-course.cjs` écrit aussi les suites d'actions trouvées (fusionnées avec le fichier
  existant ; `ONLY=regex` ne lance que les tests dont le nom correspond). Les longs parcours qui partent « dans le mauvais
  sens » pour l'heuristique sont coupés en points de passage (`via`), chaque segment repartant de l'état exact rejoué.
- `node tools/test-play.cjs /tmp/acts.json [capture.png]` — rejoue ces actions dans Chrome headless et vérifie toute
  la boucle (course → pièce + enregistrement, achats, clones qui rapportent, saut mural → salle du haut). Le résultat
  est le JSON dans le titre de la page (`r1.looped` : le trou ramène bien au pas de départ, `r5.shortcut` : la cheminée bat le meilleur temps, `r6`-`r10` :
  tableau 2 : course DEUX, achats du hub 2, course plus rapide avec l'élan, revenu des clones de la DEUX, retour au hub 2).
- `node tools/capture.cjs "file://$PWD/index.html" sortie.png 2500 1400 800 "<script>"` — capture d'écran headless.
  Dans le script : `document.getElementById('btn-play').click(); document.querySelector('.char-card[data-id=eliott]').click()`,
  attendre ≈ 1,2 s, puis `g = PL.app.game; g.freeze = true; g.st.x = …; g.update(1/60, inp)…; g.snapCamera()`.

## Idées pour la suite

- Tableau 3, et des décors/hazards plus variés dans la grande salle de la DEUX (roues, blocs à punaises mobiles).
- Autres pouvoirs (élan, double saut), hors-ligne (pièces gagnées pendant l'absence), prix à équilibrer en jouant.
