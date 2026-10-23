# Hockey Boisjoli

Jeu de hockey façon *Ice Hockey* (NES) avec pouvoirs spéciaux, où les équipes sont les familles Boisjoli.
3 contre 3 sur la glace (plus un gardien automatique par équipe), au clavier ou à la manette, seul contre l'ordi,
à deux sur le même clavier, ou en Coupe Boisjoli (enchaîner les trois autres familles).

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
js/main.js        menus, sélection, boucle du match, résultats, coupe
tools/headless.js simulation ordi contre ordi dans Node, pour l'équilibrage
```

## Contrôles

| | Joueur 1 | Joueur 2 | Manette |
|---|---|---|---|
| Patiner | Flèches | W A S D | Stick / croix |
| Passe · changer de joueur | X | G | A |
| Lancer (tenir pour charger) · mise en échec | C | H | B |
| Pouvoir spécial | V | J | X |
| Pause · son | Échap ou P · M | | Start |

Le joueur contrôlé passe automatiquement au coéquipier le plus près de la rondelle (X pour forcer le changement).
Sans la rondelle, le bouton de lancer déclenche une mise en échec.

## Équipes et personnages

Quatre familles, dans `HK.TEAMS` : Les Matt (Matthieu, Josée, Richard), Les Bibi (Mickael, Marie, Mike, Adam),
Les Jay (Jérémie, Jessica, Diddy), Les Jo (Josué, Zachary, Émily, Elliot). Les trois premiers de la liste commencent
sur la glace ; le quatrième attend au banc et remplace le plus fatigué à une mise au jeu (barres d'énergie en bas).

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
Fantôme (Elliot). La description de chacun est dans `HK.POWERS` et s'affiche au survol dans l'écran de sélection.

## Règles

Trois périodes (1, 2, 3 ou 5 min au choix), prolongation en mort subite s'il y a égalité. Pas de hors-jeu ni de
dégagement. Le gardien dégage la rondelle s'il la couvre. Difficulté de l'ordi : facile, normal, difficile (réflexes,
précision des tirs, gardien).

## Équilibrage

```bash
node tools/headless.js --a=matt --b=bibi --games=10 --verbose
node tools/headless.js --all --games=10        # toutes les paires, classement
```
