# Bunker Zone

Jeu de stratégie en JavaScript (HTML5 Canvas, aucune dépendance), inspiré de la carte personnalisée
**Zone Control** de StarCraft 1, jouable dans le navigateur contre des IA. L'écran d'accueil
(logo Bunker Zone, boutons Jouer / Multijoueur / Options / Quitter) se joue par-dessus une
bataille de démonstration entre IA ; Multijoueur n'est pas encore disponible.

## Lancer le jeu

Ouvrir `index.html` directement dans un navigateur (Chrome, Firefox, Safari) suffit.
Pour un serveur local : `python3 -m http.server 8000` puis http://localhost:8000/

## Règles (fidèles à la carte Zone Control de StarCraft 1)

- La carte est une grille de zones. Chaque zone a un emplacement de **bunker** en son centre :
  **qui possède le bunker possède la zone**.
- Chaque joueur commence avec un **centre de commandement** (6000 PV, armure 8), 8 marines, un dropship
  et 50 minerais. Seul le centre de commandement produit des dropships ; s'il est détruit, plus
  d'expansion possible (sauf si le joueur perd tout : son prochain bunker devient le nouveau QG).
- **Chaque bunker a ses propres améliorations** (armes, armure, portée, stimpack), recherchées en le
  sélectionnant (30 à 45 s, plus long à chaque niveau, une recherche à la fois), et qui ne
  s'appliquent qu'aux marines qu'il a produits. Détruire un bunker rapporte 100 minerais, un centre
  de commandement 250. Les niveaux se lisent sur les unités : **chaque niveau d'armes change la forme
  de l'arme** (canon allongé, double canon, lunette, canon lourd, canon doré ; lames et épines plus
  longues, doublées, dentelées, luminescentes pour les zergs et protoss) et **chaque niveau d'armure
  ajoute un élément** (épaulettes, plastron, plaque dorsale, rivets, liseré doré ; chevrons de carapace
  et pointes chez les zergs ; liseré, plaques, cristaux, anneau chez les protoss).
- À chaque **vague** (8 s par défaut), chaque bunker produit un marine (le bunker central en produit 2)
  et rapporte quelques minerais. Les marines apparaissent devant le bunker et rejoignent son point de ralliement.
- **Quatre races**, chacune avec une unité de niveau 1 produite par les bunkers et une unité de
  niveau 2 : Humains (soldat de reconnaissance → exo-marine lourd), Essaim insectoïde (coureur →
  bête chitineuse), Guerriers d'énergie (guerrier à lames → archonte mécanique), Mécas cybernétiques
  (robot éclaireur → mech de siège). Le joueur choisit sa race dans les options ; les IA tirent la
  leur au hasard.
- **Améliorations** : armes, armure et portée vont jusqu'au niveau 3. Quand les trois sont au niveau 3
  sur un bunker, l'**Évolution** (V, 350 minerais, 60 s) transforme ses soldats présents et futurs
  en unité de niveau 2.
- **Garnison** : un bunker (ou le QG) accueille jusqu'à 4 unités au sol à distance : clic droit sur son propre bunker avec des unités sélectionnées. Les
  occupants tirent depuis le bunker avec leur propre arme, à +1 case de portée, et sont protégés.
  **Un bunker vide ne tire pas.** Touche U pour décharger ; si le bunker est détruit, les occupants
  en sortent vivants. Les IA garnissent aussi leurs bunkers.
- **Prendre une zone libre** : envoyer un dropship au centre de la zone (clic droit) ; il atterrit
  en 3 s et construit un bunker. Le dropship est lent (nettement moins rapide qu'un marine) : il
  faut l'escorter.
- **Prendre une zone ennemie** : détruire son bunker (3000 PV, armure 5 : un marine de base ne fait
  que 1 dégât par tir, d'où l'intérêt des améliorations d'armes) libère la zone, mais ne la donne pas :
  il faut ensuite y poser un dropship comme pour une zone libre.
- **Minerais** : gagnés par les zones tenues et les kills (10 par marine, 150 par bunker). Ils achètent
  des dropships (produits par un bunker en 12 s, puis de plus en plus longs à chaque commande ; coût croissant avec le nombre de bunkers) et des améliorations : armes, armure, portée,
  stimpack (touche T sur les marines : +50 % de vitesse et de cadence pendant 10 s, coûte 10 PV).
- Un joueur qui perd son dernier bunker reçoit de quoi racheter un dropship.
- Un joueur sans bunker ni unité est éliminé. Le dernier survivant gagne.
- Les stats des unités (vie, armure, dégâts, portée, supply, dégâts normaux / concussifs / explosifs
  selon la taille) suivent StarCraft 1.
- **Mode évolution** (option) : le type d'unité produit change toutes les 1 min 40 :
  les quatre unités de niveau 1 puis les quatre de niveau 2.
- **Mode tournoi** (option) : la partie se joue en rounds, un type d'unité par round (même ordre que
  l'évolution, en boucle).
- **Équipes** (missions 2v2 et 3v3 de l'aventure, ou réglage `teams`) : les alliés ne se tirent pas
  dessus, leurs unités sont entourées de jaune, et la partie est gagnée quand il ne reste qu'une équipe.
- **Cartes** : largeur et hauteur réglables séparément (couloir 5x1, bande 3x9...). Les missions
  peuvent aussi faire démarrer le joueur au centre, avec des zones d'avance. Un round est remporté par le dernier joueur en vie ou, à la limite de temps
  (5 min par défaut, réglable ou désactivable), par celui qui tient le plus de zones (puis le plus
  d'unités). Chaque round repart d'une carte vierge : nouveau QG, unités de départ, minerais et
  améliorations à zéro ; seuls le score et les statistiques sont conservés. Un joueur éliminé d'un
  round observe la fin du round et revient au suivant. Le premier à remporter le nombre de rounds
  choisi (3 par défaut, de 1 à 5) gagne la partie.

## Mode Aventure

Depuis Jouer, choisissez **Partie simple** (vos réglages actuels) ou **Aventure**. L'aventure se
joue avec la race humaine (les autres races sont verrouillées pour l'aventure, mais jouables en
partie simple) et traverse **quatre mondes**, un par race ennemie : Terra Prime (renégats humains de
Varek), Nidus (essaim de la matriarche Szeth), Lumen (Conclave du hiérarque Aelon) et Forge-Oméga
(mécas du Noyau-Directeur 7). Chaque monde propose **13 missions** de plus en plus dures, débloquées
une à une ; un monde se débloque quand les 13 missions du précédent sont réussies.

- **Des missions variées** : avant-poste, couloir 5x1, survie sans minerai, départ au centre avec
  deux zones d'avance, 2v2 avec un allié, bande 3x9, mode évolution, rush à vagues rapides, tournoi,
  siège de 8 minutes, prise en tenaille sur 7x3, 3v3, forteresse finale 9x9.
- **Trois difficultés par mission** (Facile, Moyen, Difficile : IA agressives et une IA ennemie de
  plus). Chaque difficulté réussie rapporte ses propres points, une seule fois : refaire une mission
  dans une difficulté plus élevée est conseillé. Les points augmentent avec la mission et le monde.
- **Dialogues** avant chaque mission : briefing du Général Orsk ou de l'opératrice Lin, provocation
  du chef du monde, réplique de votre héros ; épilogue à la fin de chaque monde.
- **Boutique** : les points s'échangent hors combat contre des améliorations passives permanentes
  (armure, dégâts, vie, coût et temps des dropships, minerais de départ, revenu, réparation des
  bunkers, unités de départ, expérience des héros), chacune sur plusieurs niveaux au coût croissant.
- **Héros** : trois héros (Sergent Kael, exo-marine ; Lieutenante Voss, archonte ; Commandant Dax,
  mech de siège). Un seul vous accompagne par mission : il apparaît au QG, revient 30 s après sa mort,
  gagne de l'expérience à chaque kill et monte de niveau (+8 % PV et dégâts par niveau, +1 armure
  tous les 3 niveaux, niveau 10 max). Niveaux et expérience sont conservés sur votre compte.
- La progression est sauvegardée dans le navigateur (`localStorage`, clé `bz-campaign`).

Mondes, scénarios, dialogues, héros et boutique sont décrits dans `js/campaign.js`.

## Commandes (type StarCraft)

| Action | Commande |
|---|---|
| Sélectionner / cadre | clic gauche / glisser |
| Déplacer / attaquer | clic droit |
| Dropship : construire un bunker | clic droit sur une zone libre, ou B puis clic |
| Bunker sélectionné | clic droit : point de ralliement ; G envoyer toutes ses troupes vers un point ; D dropship ; W armes ; R armure ; E portée ; T stimpack ; V évolution |
| Stimpack sur les marines sélectionnés | T |
| Acheter un dropship / bunker suivant | D / N |
| Évolution (bunker sélectionné, armes, armure et portée au niveau 3) | V |
| Garnison | clic droit sur un bunker allié avec des unités sélectionnées (4 max, 6 dans le centre de commandement) ; U (bunker sélectionné) décharger |
| Même type à l'écran | double-clic ou Ctrl+clic |
| Ajouter à la sélection | Maj+clic |
| Attaque-déplacement, Déplacer, Stop, Tenir, Patrouille | A, M, S, H, P |
| Groupes de contrôle | Ctrl+1..9 créer avec les unités sélectionnées ou le bunker sélectionné (le numéro s'affiche alors sur le bunker), 1..9 sélectionner (2x : centrer), Maj+1..9 ajouter |
| Toute l'armée / centrer / dernière alerte | Z / C / Espace |
| Caméra | flèches, bord de l'écran, minimap (clic droit sur la minimap : déplacer les unités) ; un bunker attaqué clignote en rouge sur la minimap |
| Scores / menu | Tab / Échap ou F10 |
| Centre de commandement : carte « Unités » | F, puis W travailleur, H ressusciter le héros (aventure), X ou Échap retour |
| Files d'attente | affichées en icônes dans le panneau du bunker (barre de progression sur l'élément en cours) ; un clic sur une icône annule l'élément et rembourse son coût |
| Carte de commandes | icônes dessinées ; pastilles de niveau sur chaque amélioration (vert acquis, jaune en file, « MAX ») ; le bouton s'enfonce quand l'ordre passe et tremble en rouge s'il est refusé |
| Travailleurs | clic droit sur un gisement vert : récolter (G) ; clic droit sur un bunker allié abîmé : réparer (R) ; B : construire un extracteur sur un gisement ; les travailleurs ne font pas partie de « toute l'armée » (Z) |
| Vitesse de lecture x1, x2, x3, x5 | boutons dans la barre du haut, ou + / − (la vitesse revient à x1 à chaque nouvelle partie) |
| Musique | 3 pistes de `assets/` jouées en boucle (ordre mélangé) pendant les parties, atténuées en pause ; réglable dans Options et le menu pause |
| Mode admin (option du menu, triche) | dropships et améliorations gratuits et instantanés ; Alt+M +1000 minerais ; Alt+H soigner toutes vos unités et structures ; Alt+U toutes les améliorations au maximum sur le bunker sélectionné (ou tous) ; Alt+S vague immédiate ; Alt+K détruire les unités sélectionnées, même ennemies |

## Économie : minerai vert, travailleurs, extracteurs

- **Le minerai vert fluo est la monnaie.** En plus du revenu des bunkers à chaque vague, des **gisements** (cinq
  cristaux verts) sont posés sur la carte : un dans chaque zone de départ, puis sur une part des autres zones
  (option « Gisements de minerai » : aucun, rares, normaux, abondants ; la zone centrale a un gisement double).
  Sur les cartes étroites (couloir 5x1, bandes 3x9 ou 7x3) chaque zone a son gisement ; ailleurs, aucune zone n'est à plus
  d'une zone d'un gisement. Un gisement s'épuise ; les cristaux rapetissent avec le minerai restant. Survolez un gisement
  pour lire son contenu.
- **Travailleurs** (un par race : Ouvrier, Drone, Sonde, Foreur) : produits au centre de commandement (carte
  « Unités », F puis W, 50 minerais, 15 s, 16 maximum). Ils récoltent 5 minerais par voyage (environ 45 par minute
  chacun), cinq travailleurs au plus par gisement en même temps, et rapportent le minerai au bunker ou au QG le plus
  proche. Un travailleur neuf part de lui-même récolter le gisement le plus proche. On commence avec 2 travailleurs
  (option). Ils ne combattent pas, n'entrent pas en garnison et sont exclus de « toute l'armée ».
- **Réparation** : un travailleur répare un bunker ou un QG allié (clic droit dessus, ou R) à 40 PV par seconde,
  contre 3 minerais par seconde, puis retourne récolter.
- **Extracteur** (construction « à la Factorio », une par race : Foreuse automatique, Ventouse de chitine, Prisme
  extracteur, Drille autonome) : un travailleur le bâtit sur un gisement (B puis clic, 100 minerais, 20 s). Il mine
  ensuite tout seul 1,2 minerai par seconde, directement dans votre banque, sans transport, en plus des travailleurs
  qui récoltent à côté. Un seul par gisement ; 600 PV, destructible. D'autres constructions suivront.
- **Héros (aventure)** : il ne revient plus tout seul. Mort, il se ressuscite au centre de commandement (F puis H,
  100 minerais + 25 par niveau, 20 s). Si le QG est détruit, il faut en rebâtir un.
- Les IA produisent des travailleurs, construisent des extracteurs et réparent leurs bunkers.

## Missions de survie : vagues d'envahisseurs

« Tenir la ligne » et « Le siège » n'ont plus d'ennemi installé sur la carte : un joueur **envahisseur** sans base
envoie des vagues par les bords de la carte toutes les 15 à 35 secondes (12 à 28 en difficile), vers la structure du
joueur la plus proche. Les vagues grossissent avec le temps, passent aux unités de niveau 2 après 2 min 30 et gagnent
des améliorations. Le bord d'arrivée est tiré au hasard mais annoncé à l'avance : balise rouge animée sur le bord de la carte (anneaux,
chevrons, compte à rebours, qui s'emballe dans les 5 dernières secondes), flèche au bord de l'écran si la balise est hors
champ, losange clignotant sur la minimap, direction dans la barre du haut. Espace centre la caméra sur la dernière alerte. Facile / moyen / difficile règlent la taille des vagues (x0,7 / x1 / x1,5).
Test : `node tools/headless.js 0 5 normal 300 --passive --invasion=1`.

## Options du menu

Mode (classique, évolution ou tournoi), rounds à gagner et limite de temps d'un round (tournoi), race, nombre d'IA (1 à 7), difficulté, largeur et hauteur de la carte (3 à 11 zones, hauteur 1 pour un couloir),
taille des zones, terrain (jungle, badlands, plateforme spatiale), couleur, intervalle des vagues,
unités de départ, supply max, revenu par bunker, coût des dropships, temps d'atterrissage,
durée des rounds, vitesse, limite de sélection à 12 comme SC1, son, mode admin (triche), défilement au bord.

## Sprites

Les huit unités des quatre races sont dessinées depuis `assets/units.png`, extraite des planches
concept `tools/sprites/planche-races.png` et `planche-unites.jpg` (portraits, explosion) par
`node tools/sprites/extract.js` : découpe des cellules, fond gris rendu transparent par remplissage
depuis les bords, mesure de la boîte réelle de chaque sprite pour normaliser les tailles (Chrome
headless). Vue 3/4 : les unités tournées vers la gauche sont dessinées en miroir ; marche et tir sont
animés. Un disque aux couleurs du joueur et des pastilles (armes en jaune, armure en bleu) indiquent
le propriétaire et les niveaux d'amélioration. Les structures, le dropship et les ruines restent
dessinés procéduralement.

## Technique

- Simulation à pas fixe (60 Hz) avec interpolation du rendu : le mouvement reste fluide quelle que
  soit la fréquence d'affichage.
- Aucune dépendance, aucun build : tout est en JavaScript classique chargé par `index.html`.

## Structure

```
index.html        page du jeu
css/style.css     console et menus façon SC1
js/config.js      constantes, stats des unités, rounds, difficultés
js/utils.js       utilitaires, grille spatiale
js/audio.js       sons synthétisés (WebAudio)
js/map.js         grille de zones
js/units.js       unités : ordres, déplacement, ciblage
js/ai.js          IA des adversaires
js/campaign.js    mode aventure : missions, dialogues, boutique, héros, sauvegarde
js/game.js        état de la partie, vagues, captures, combat
js/spritesheet.js cadres de assets/units.png (généré par tools/sprites/extract.js)
js/sprites.js     dessin des unités : les 8 unités depuis la feuille de sprites, structures et dropship procéduraux
assets/units.png  feuille de sprites (8 unités des 4 races, portraits, explosion)
assets/*.mp3      musiques de fond (Neon Gaming — dopestuff ; Orion fast retrosynth synthwave — michitheonlyone ; Wave synth electronica game future 80s — redproductions)
tools/sprites/    planches concept (jpg) et outil d'extraction des sprites
js/render.js      terrain, zones, effets, minimap
js/input.js       souris, clavier, minimap
js/ui.js          HUD, console, menus
js/main.js        boucle de jeu et événements
tools/headless.js simulation sans affichage pour l'équilibrage (Node.js)
```

Paramètres d'URL utiles en développement : `index.html?autostart&ff=60&ai=3&diff=hard&mode=evolution|rounds&admin&sel=all|1|bunker`
(démarre directement, avance la simulation de 60 s, sélectionne vos unités).

Équilibrage : `node tools/headless.js 4 7 normal 900` ou `node tools/headless.js 3 7 normal 900 --passive`.
