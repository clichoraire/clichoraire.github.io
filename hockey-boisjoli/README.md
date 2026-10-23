# Hockey Boisjoli

Jeu de hockey façon *Ice Hockey* (NES) avec pouvoirs spéciaux, où les équipes sont les familles Boisjoli… et Les Boys.
3 contre 3 sur la glace (plus un gardien automatique par équipe), au clavier ou à la manette, seul contre l'ordi,
à deux sur le même clavier, en Coupe Boisjoli (enchaîner les quatre autres équipes) ou en Pratique (exercices).

Aucun outil de build : ouvrir `index.html` (ou servir le dossier). Tout est en JavaScript et canvas, les personnages
sont dessinés procéduralement (pas d'images).

## Fichiers

```
index.html        écrans (menu, sélection, match, résultat) et chargement des scripts
css/style.css
js/config.js      constantes, ÉQUIPES, PERSONNAGES (stats, apparence, pouvoir) et POUVOIRS
js/sprites.js     dessin des personnages (grand-papa, grand-maman, parents, enfants, ado), gardiens, logos
js/game.js        simulation : patineurs, rondelle, gardiens, mises en échec, règles, pouvoirs
js/ai.js          intelligence des joueurs non contrôlés (ordi et coéquipiers)
js/render.js      patinoire, entités, effets, tableau indicateur, bancs
js/audio.js       sons synthétisés (WebAudio)
js/input.js       clavier (2 joueurs) et manettes
js/practice.js    mode Pratique : liste des exercices (HK.DRILLS), sections, étoiles, classe HK.Practice
js/main.js        menus, sélection, boucle du match, résultats, coupe, panneau de pratique
tools/headless.js simulation ordi contre ordi dans Node, pour l'équilibrage
```

## Contrôles

| | Joueur 1 | Joueur 2 | Manette |
|---|---|---|---|
| Patiner | Flèches | W A S D | Stick / croix |
| Passe | X | G | A |
| Choisir son joueur | 1 · 2 · 3 | 8 · 9 · 0 | LB / RB |
| Lancer (tenir pour charger) · mise en échec | C | H | B |
| Pouvoir spécial | V | J | X |
| Pause · son | Échap ou P · M | | Start |

Le joueur contrôlé ne change jamais tout seul : 1, 2 ou 3 (le numéro est affiché devant le nom de chaque coéquipier).
Sans la rondelle, le bouton de lancer déclenche une mise en échec.

## Équipes et personnages

Cinq équipes, dans `HK.TEAMS` : Les Matt (bleu : Matthieu, Josée, Richard), Les Bibi (couleurs des Canadiens :
Mickael, Marie, Mike, Adam), Les Jay (rouge : Jérémie, Jessica, Diddy), Les Jo (vert : Josué, Zachary, Émily, Elliot)
et Les Boys (noir et or, les personnages des films : Bob n° 9, Ti-Guy n° 10, Julien n° 18, Méo n° 99, Mario n° 66,
Jean-Charles n° 11, Popol n° 30, François n° 15, Marcel n° 88, Stan le coach, Roger toujours au banc, et Fern n° 1
dans les buts — une équipe peut nommer son gardien avec `goalie`). Les trois premiers de la liste commencent
sur la glace ; les autres attendent au banc et remplacent les plus fatigués à une mise au jeu (barres d'énergie en bas).

Chaque personnage dans `HK.PLAYERS` a : `name`, `age` (c'est aussi son numéro de chandail), `role` (étiquette :
grand-papa, grand-maman, papa, maman, mononcle, enfant, tout-petit, ado), `size` (1 = adulte, les enfants sont
plus petits avec une plus grosse tête), `stats` (vitesse, tir, force, contrôle de 1 à 5), `look` (peau, cheveux,
style de cheveux, lunettes, barbe, moustache, suce, tuque, casquette, rides, bedaine…) et `power`.
Pour renommer quelqu'un ou changer son apparence, il suffit de modifier cette entrée.

Les enfants tombent souvent mais se relèvent tout de suite, volent facilement la rondelle et sont durs à
déposséder ; les grands-parents sont lents mais solides.

## Pouvoirs (touche V / J, recharge de 15 à 22 s)

Code de triche (Matthieu), Biscuits chauds (Josée), Charge du vétéran (Richard), Lunettes laser (Mickael),
Bulle de savon (Marie), Zoom-zoom (Mike), Crise de bacon (Adam), Téléportation (Jérémie), Aimant à rondelle (Jessica),
Glissade sur le ventre (Diddy), Cri du capitaine (Josué), Lancer frappé d'ado (Zachary), Blizzard (Émily),
Fantôme (Elliot). Les Boys : Temps d'arrêt (Stan), Charme de Bob, Deal du siècle (Ti-Guy), Objection ! (Jean-Charles,
banc des punitions), Trousse du docteur (François), Pétage de coche (Julien), Mur de Popol, Le 66 (Mario), Crise de
nerfs (Marcel), Boucane de Méo, Chaise musicale (Roger). La description de chacun est dans `HK.POWERS` et s'affiche
au survol dans l'écran de sélection.

## Pratique

Seul sur la glace contre le gardien adverse, avec un bouton « Pratiques » qui ouvre la liste des exercices, classés en
six sections (Attaque, Défense, Gardien, Pouvoirs magiques, Habiletés, Défis), chacun en trois difficultés avec une
étoile par difficulté réussie (sauvegardées dans le navigateur). Les exercices sont décrits dans `HK.DRILLS`
(`js/practice.js`) : objectif (`need`), chrono (`time`), robots à ajouter (`setup`), comptage (`onEvent`). Certains
mettent le joueur dans les buts (section Gardien), d'autres ajoutent des cônes et des portes, des cibles dans le
filet, ou toute la famille sur la glace.

## Son et musique

Les effets (rondelle, bande, sifflet, klaxon) sont synthétisés. Les fichiers mp3 de `assets/` servent à l'ambiance :
The Hey Song à l'entrée des joueurs (ils arrivent un à un et tournent dans leur moitié, ~28 s), l'hymne pendant
l'alignement (Entrée, Espace ou le bouton « Passer » saute chaque étape), les chansons de `assets/music/` pendant le
jeu (au complet, en pause pendant les arrêts, puis la suivante), l'orgue de `assets/organ/` pendant les arrêts, et la
chanson de but. Les chemins sont dans `HK.AUDIO` (`js/music.js`). M coupe tout.

## Règles

Trois périodes (1, 2, 3 ou 5 min au choix), prolongation en mort subite s'il y a égalité. Pas de hors-jeu ni de
dégagement. Le gardien dégage la rondelle s'il la couvre. Difficulté de l'ordi : facile, normal, difficile (réflexes,
précision des tirs, gardien).

## Équilibrage

```bash
node tools/headless.js --a=matt --b=bibi --games=10 --verbose
node tools/headless.js --all --games=10        # toutes les paires, classement
```
