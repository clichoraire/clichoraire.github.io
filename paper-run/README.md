# Paper Run

Jeu de course de plateforme façon *Paper Mario* (papier découpé, contours épais, décor sur bâtonnets) où quatre membres
de la famille courent en même temps jusqu'au drapeau. Cubes d'objets façon Mario Kart, tournois par coupe et par
difficulté, Papeterie pour acheter les pouvoirs qui ouvrent les raccourcis. Le but : un trophée d'or dans toutes les
coupes, à toutes les difficultés.

**Deux jeux dans un** : l'écran d'accueil de `index.html` propose Paper Run ou Paper Loop (le plateformer en boucle à
clones, dans `loop/`, avec son propre README). Les deux partagent les portraits de famille (`js/family-heads.js`) et le
style, chacun garde sa sauvegarde. Depuis l'un on revient à l'autre par le bouton du titre ou du menu de pause.

Aucun outil de build : ouvrir `index.html` (ou servir le dossier). Tout est en JavaScript et canvas. Les têtes viennent
des portraits de famille partagés (`js/family-heads.js` + `js/family-head-sources.js`, les mêmes que Canon Big Boom et
Bomberkid).

## Comment ça marche

- **Boucle** : personnage → menu (Tournoi, Course libre, Papeterie, Trophées). Tournoi : choisir une difficulté puis une
  coupe de 4 courses ; après chaque course, un tableau des points (9 / 6 / 3 / 1), après la 4e le podium et le trophée
  (or / argent / bronze selon le classement final, sauvegardé seulement s'il est meilleur que l'ancien).
- **Commandes** : flèches ou A / D courir, Espace (W, flèche haut) sauter (relâcher tôt = petit saut), E ou Ctrl
  (S, flèche bas, Entrée) utiliser l'objet, Maj / X élan, Échap pause, M son. Boutons tactiles ; manette : A saut,
  B objet, X / RB élan, Start pause.
- **Les adversaires** (`PR.Race`, game.js) rejouent le meilleur chemin trouvé par la recherche A* de
  `tools/test-levels.cjs` pour les pouvoirs de la difficulté (`PR.DIFFICULTIES`, `js/paths.js`), à une vitesse `rate`
  (Feuille 0,78 · Carton 0,88 · Origami 0,95) avec de petites variations, un léger élastique (±7–9 % selon l'écart
  avec le joueur) et un départ décalé. Ils ramassent les cubes et utilisent les objets. Ils ne subissent pas les ennemis.
  En Carton ils ont Double saut + Ciseaux + Souliers 1 ; en Origami presque tout : **sans les pouvoirs de la Papeterie,
  l'or est hors de portée** parce qu'ils prennent les raccourcis.
- **Raccourcis** (portes dans `tools/design-levels.py`) : mur de papier 7 de haut (Ciseaux, sinon détour par deux
  plateformes), falaise de 5 (Double saut, sinon escalier), fosse de 6 cases (Élan, sinon descendre, sauter les
  punaises, remonter), puits à saut mural (Ruban) dans 2-5 et 4-2, plané depuis la falaise de départ de 3-2.
- **Objets** (`PR.ITEMS`, tirés selon la position comme dans Mario Kart) : Boule de papier (projectile, étourdit),
  Avion chercheur (vise le coureur devant), Flaque de colle (ralentit celui qui marche dedans), Fusée (×1,5 pendant
  4 s), Orage (étourdit tous les autres), Bouclier. Étourdi = plus de commandes 1,3 s. Un bouclier bloque un objet ou
  un ennemi.
- **Or** (`PR.ECON`) : 30 / 20 / 12 / 6 par course selon la position × multiplicateur de difficulté (1 / 1,5 / 2),
  +20 la première fois sur une course, +1 par pièce, prime de trophée 100 / 50 / 25 × difficulté, le tout × bonus du
  personnage et de la Tirelire.
- **Sauvegarde** `localStorage` `paperrun.save` (v2), un profil par personnage : `gold`, `powers`,
  `trophies[coupe][difficulté]`, `races[id] = { runs, wins, best }`.

## Coupes (`PR.CUPS`) et tableaux (`js/levels.js`)

Coupe Prairie 1-1…1-4 · Coupe Forêt 2-1…2-4 · Coupe Montagne 3-1…3-4 · Coupe Château 4-1…4-4 · Coupe Spéciale
(1-5, 2-5, 3-5, 5-1 Le ciel de papier), ouverte après un trophée dans chacune des quatre autres. 20 tableaux de 310 à
420 cases de large (48 px par case, 30 rangées : le monde d'en haut sur les rangées 0-14, le souterrain sur 15-29),
soit 50 à 68 s au meilleur temps : une course dure une à une minute et demie.

Chaque tableau est une **suite de segments** (`tools/design-levels.py`) : départ, plat, trou, colline, escalier,
plateformes, ressort, punaises, encre + plateforme mobile, glace, patinoire, canon, araignées, sauterelles, gomme,
trombone sur sa corniche, tuyaux à plantes, tour à pièces, plateforme verticale, cimes au-dessus de l'encre, drapeau
de passage, les quatre portes (ciseaux, double saut, élan, puits à ruban) et le **tuyau** : un tuyau vert au sol mène
à un couloir souterrain (glace, pièces, cube, araignée, trombone, lanternes) qui ressort par un autre tuyau 40 cases
plus loin pendant que le chemin d'en haut est encombré. Flèche bas (ou S) sur un tuyau pour y entrer.

Légende : `#` bloc, `-` plateforme traversable, `o` pièce, `*` grosse pièce, `^` punaises, `~` encre, `I` glace
(on glisse : accélération et freinage très réduits), `S` départ, `F` arrivée, `c` drapeau de passage, `s` ressort,
`m` / `n` plateforme mobile, `%` mur de papier, `?` cube d'objet, `0`-`9` rebord de tuyau (même chiffre = reliés),
`|` corps de tuyau, `C` canon (tire vers le joueur toutes les 2,6 s), `T` arbre, `B` buisson, `Z` panneau de sortie.
Ennemis : `e` Chiffonné, `f` avion, `j` Sauterelle (bondit vers toi), `k` Trombone (hérissé : ne s'écrase pas, saute
par-dessus ; l'élan ou la fusée le détruisent), `g` Gomme (fonce quand tu approches, se repose après), `a` Araignée (au
bout de son fil, monte et descend), `p` Plante dans un tuyau (sort toutes les 4 s, pas quand tu es dessus).
Les adversaires ne subissent pas les ennemis ni les canons.

`js/levels.js` et `js/paths.js` sont **générés** : modifier `tools/design-levels.py`, puis
`python3 tools/design-levels.py && BUILD=1 node tools/test-levels.cjs`. Règles de design qui passent sans pouvoir :
trou ≤ 4 cases, marche ≤ 3, rangée de punaises ≤ 4, plateforme mobile à 1 case du rebord, ressort au bord puis trou ≤ 6.
Un trou au-dessus d'un souterrain reçoit de l'encre au fond (sinon on resterait pris sur le plafond).

## Personnages et pouvoirs

15 membres de la famille (`PR.CHARACTERS`), avantages aux noms de Canon Big Boom ; même boîte de collision pour tous.
Papeterie (`PR.POWERS`) : Bottes à ressort (3), Souliers de course (3), Double saut, Élan (3), Ruban collant, Ciseaux,
Avion de papier (planer), Aimant (2), Bouclier, Tirelire (2). Traduits en physique par `PR.buildCfg` (physics.js).

## Outils

- `node tools/test-physics.cjs` — 39 vérifications (physique, glace, tuyaux, objets, coupes).
- `node tools/test-levels.cjs [id…]` — structure + A* par difficulté : prouve que chaque tableau se finit, mesure le
  gain des raccourcis ; `BUILD=1` écrit `js/paths.js`. `./tools/test-all-levels.sh` en parallèle (sans BUILD).
- `node tools/capture.cjs "file://$PWD/index.html" sortie.png 2500 1400 800 "<script>"` — capture headless
  (viewport utile ≈ 1400 × 657). Raccourcis : `document.getElementById('btn-play').click()`,
  `document.querySelector('.char-card[data-id=eliott]').click()`, `PR.app.setDiff('carton')`,
  `document.getElementById('btn-cups').click(); document.querySelectorAll('.cup-card')[0].click()`,
  `PR.app.startRace(PR.levelById('1-4'), [], 'free')`, `PR.app.give(n)`, `PR.app.unlockAll()`, `PR.app.winAll('silver')`,
  puis `PR.app.game.st.x / .y`, `.snapCamera()`, `.freeze = true`, `.player.item = 'boule'`. Le compte à rebours dure
  3,4 s avant que la physique réponde. `PR.app.reset()` efface la sauvegarde.

## Rendu (`js/render.js`)

Fond différent par monde (collines et arbres sur bâtonnets, grands arbres de la forêt, pics enneigés, château de nuit
avec lune, chauves-souris et étoiles, bancs de nuages et arc-en-ciel), texture de sol par monde (carton, racines,
pierre fissurée, briques moussues, nuage), accessoires semés sur le sol (fleurs, touffes, roches, panneaux,
champignons, fougères, bûches, cristaux, neige, os, torches, bannières, crânes, chaînes, étoiles, moulinets), grotte
avec stalactites et lanternes derrière le souterrain, particules d'ambiance (papillons, feuilles, flocons,
chauves-souris, oiseaux). Le terrain est pré-rendu par tranches de 1024 px mises en cache (`R.terrain`), un tableau de
400 cases ne tenant pas dans un seul canvas.

## Idées pour la suite

- Deux joueurs humains sur le même clavier (le moteur accepte déjà plusieurs coureurs).
- Plus d'objets (ressort portatif, encre qui aveugle), des coupes miroir, des courses à plusieurs tours.
- Carte dessinée pour choisir les coupes, musique plus riche.
