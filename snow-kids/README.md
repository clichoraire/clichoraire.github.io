# Snow Kids

Jeu de course de planche à neige en JavaScript (HTML5 Canvas, aucune dépendance), inspiré de **Snowboard Kids**
sur Nintendo 64 : les mêmes neuf tableaux, la remontée mécanique au bas de chaque tour, les boîtes rouges (tirs) et
bleues (objets), les figures qui rapportent des pièces, la boutique de planches, et le personnage caché à débloquer.

## Lancer le jeu

Ouvrir `index.html` dans un navigateur suffit. Pour un serveur local : `python3 -m http.server 8000`.

## Règles

- **Descente** : quatre coureurs dévalent la piste (cinq au Pays des Ninjas et au Pays Vertige, où Shinobin s'invite).
  Au bas de la piste, la **remontée mécanique** ramène au sommet pour le tour suivant : une chaise part toutes les
  2 s, une place par chaise, la remontée dure 7 s. Au dernier tour, la ligne d'arrivée remplace la remontée.
- **Pièces** 🪙 : 10 chacune, posées sur la piste. Les **figures** en l'air (Grab, vrille, saltos) en rapportent
  beaucoup plus, multipliées quand on les enchaîne dans un même saut ; une figure non terminée à l'atterrissage = chute.
- **Boîtes rouges** (100 pièces) : un tir, visant en général le coureur juste devant — Bombe, Parachute, Rayon de gel,
  Poêle (tout le monde), Bonhomme de neige. **Boîtes bleues** (gratuites) : un objet — Rocher, Ventilateur (turbo),
  Invisible, Fantôme (vol), Nuage (averse sur les autres). Un seul tir et un seul objet à la fois.
- **Surfaces** : neige, glace (glisse, force centrifuge accrue), sable et herbe (ralentissent), sables mouvants
  (engluent), asphalte, pierre, bonbon. On peut sauter par-dessus les obstacles et les rochers.
- **Personnages** (vitesse / virage / figures) : Slash 5/2/3, Nancy 3/4/3, Jam 3/3/5, Linda 4/4/2, Tommy 4/1/2
  (lourd, se relève vite), Wendy 2/5/4, et **Shinobin** 5/5/5, caché.
- **Aventure** (façon Snowboard Kids 2) : on choisit son Kid parmi les personnages alignés sur la neige, puis on arrive
  au **village** : ← → pour se promener, Entrée pour entrer dans une maison. Le **télésiège** mène au choix des pistes,
  la **boutique** vend, équipe et améliore les planches (vitesse, virage, figures, jusqu'à +2 chacun, 1000 puis 2000
  pièces), la **maison des Kids** permet de changer de personnage, le **chalet des records** affiche la progression.
  Finir 1er sur une piste débloque la suivante. Au Pays des Ninjas, Shinobin participe ; le battre débloque le Pays
  Vertige (tableau caché) ; le battre là aussi rend Shinobin jouable. Les pièces ramassées et la prime
  (500 / 300 / 200 / 100) remplissent la tirelire.
- **Course libre** (1 à 5 tours), **Contre-la-montre** (seul, sans objets, record par piste) et **2 joueurs** en écran
  partagé (même clavier ou manettes). Trois difficultés pour l'ordinateur, avec un léger élastique.

## Pistes (dans l'ordre du championnat)

Mont Débutant (Rookie Mountain), Grand Bonhomme (Big Snowman), Rocher du Couchant (Sunset Rock), Autoroute de nuit
(Night Highway), Vallée d'herbe (Grass Valley), Vallée des sables (Quicksand Valley), Mont d'Argent (Silver Mountain),
Pays des Ninjas (Ninja Land), Pays Vertige (Dizzy Land, caché).

## Commandes

- Joueur 1 : flèches (↑ se pencher en avant pour un peu plus de vitesse, ↓ freiner), `X` saut (au sommet d'une bosse-tremplin, l'élan de la montée donne un grand saut), `C` figure (+ ↑ ↓ ← →), `V` tir, `B` objet.
- Joueur 2 : `WASD`, `G` saut, `H` figure, `J` tir, `K` objet. `Échap` pause.
- Manette : stick/croix, A saut, B figure, X tir, Y objet.

## Fichiers

- `js/config.js` : constantes, personnages, planches, tirs, objets, figures, surfaces, thèmes et définition des 9 pistes (`SK.VERSION`).
- `js/track.js` : construction d'une piste (segments, relief, décors, boîtes, pièces, clôtures).
- `js/game.js` : simulation d'une course (physique, sauts, figures, remontée, tirs, objets, classement).
- `js/ai.js` : pilotage des coureurs de l'ordinateur.
- `js/render.js` : rendu pseudo-3D, coureurs et décors vectoriels, HUD, vue de la remontée.
- `js/town.js` : écran de choix du Kid et village de l'aventure (maisons, rotation, clic).
- `js/audio.js`, `js/input.js`, `js/main.js` : sons et musiques synthétisés, clavier/manettes, écrans et sauvegarde (`localStorage`).
- `tools/headless.js` : simulation sans affichage (`node tools/headless.js --all --races=4 [--boards] [--diff=2]`).

Paramètres d'adresse utiles pour tester : `?demo=silver&cpu=1&t=40` lance une course sur une piste à un instant donné,
`?screen=town|adv|shop|records|course&unlock=9&shinobin=1` ouvre un écran de menu.
