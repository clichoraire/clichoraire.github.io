# Ballon chasseur

Jeu de ballon chasseur façon *Super Dodge Ball* (NES), où les équipes sont les familles Boisjoli : les mêmes visages que
dans Hockey Slapshot et Snow Kids. Trois joueurs à l'intérieur du terrain (ceux qu'on peut toucher) et trois à l'extérieur
(en haut, en bas et au fond du camp adverse, qui relancent la balle). Contre l'ordi, au clavier ou à la manette : en
Aventure (un chef, une équipe à monter, de l'expérience et des stats à faire grandir), en match simple ou en Coupe des
familles (battre les trois autres familles, chacune chez elle).

Aucun outil de build : ouvrir `index.html` (ou servir le dossier). Tout est en JavaScript et canvas.

## Fichiers

```
index.html                 écrans (menu, sélection, aventure, famille, match, résultat) et chargement des scripts
css/style.css
js/config.js               constantes, terrain, PERSONNAGES (stats 0-12, apparence, pouvoir), POWERS, PERKS, ÉQUIPES, TERRAINS, BC.squads, BC.phys
js/family-head-sources.js  les portraits de famille (les mêmes fichiers que Hockey Slapshot et Snow Kids), Zachary inclus
js/family-heads.js         découpe des portraits en trois vues (face, côté, dos)
js/sprites.js              personnages en tenue de ballon chasseur (poses : lancer, attraper, touché, au sol, saut, ange), balle, logos
js/game.js                 simulation : déplacements, course, saut, lancers chargés, passes, attrapés, interceptions, dégâts, K.-O., XP
js/powers.js               les quinze pouvoirs (bouton V), projectiles (bulles, biscuits), fantôme
js/ai.js                   intelligence des joueurs non contrôlés (porteur, défenseurs, extérieurs, pouvoirs)
js/render.js               quatre décors, joueurs triés par profondeur, effets des pouvoirs, HUD (points de vie, pouvoirs), accueil, galerie
js/adventure.js            mode Aventure : sauvegarde, chef, équipe, expérience, points de stat, écrans
js/audio.js                sons synthétisés (WebAudio)
js/input.js                clavier et manette
js/main.js                 menus, sélection, boucle du match, résultats, coupe, galerie de la famille
tools/headless.js          simulation ordi contre ordi dans Node, pour l'équilibrage
tools/test-powers.cjs      vérifications des pouvoirs, du lancer chargé, des interceptions et de l'XP (node tools/test-powers.cjs)
```

## Contrôles

| | Clavier | Manette |
|---|---|---|
| Bouger | Flèches | Stick / croix |
| Courir | deux fois ➡ (ou ⬅) | deux fois la direction |
| Lancer (avec la balle, **tenu = charge**) · sauter (sans) | X (⬆ ou ⬇ + X : en diagonale) | A |
| Sauter (avec la balle, sur place ou en course) · passer (direction + C) · attraper ou intercepter (sans la balle) | C | B |
| Pouvoir | V | X ou Y |
| Choisir son joueur | 1 · 2 · 3 | LB / RB |
| Pause · son | Échap ou P · M | Start |

On contrôle celui qui tient la balle ; sinon le joueur change seulement à un événement (lancer adverse : celui que la balle
vise ; balle morte : le plus proche), jamais au fil des déplacements. Les coéquipiers patrouillent toujours un peu.

## Règles

- **Lancer chargé** : X enfoncé arme le bras (barre au-dessus de la tête, pleine en 0,9 s) ; relâcher lance. Vitesse de
  85 % à 130 % du lancer du personnage, dégâts +0 à +4. La balle part à 60 % de sa vitesse et **accélère** en vol (jusqu'à
  1,4 ×). En l'air (C puis X) : smash, +20 % de vitesse, +3 dégâts, plus dur à attraper ; au sommet du saut, « SMASH ! ».
- **Visée** (`Game.aimDir`) : sans direction, la balle part vers l'adversaire le mieux placé devant le lanceur (ligne
  verte, qui anticipe à moitié son déplacement) ; personne dans le cône : tout droit (ligne blanche). ⬆ ou ⬇ tenu : en
  diagonale (ligne jaune). Les extérieurs visent de la même façon. Une balle qui sort par le haut ou le bas est morte.
- **Course** : deux appuis rapides vers l'avant. C pendant la course (ou dans les 0,3 s qui suivent, si la ligne du centre
  l'a arrêtée) = saut en course par-dessus la ligne ; on lance depuis le camp adverse puis on est ramené derrière la ligne.
- **Attraper** (C juste quand la balle arrive, en lui faisant face) : aucun dégât, la balle est à vous et **toute l'équipe
  recharge un cran de pouvoir**. Une **passe adverse** s'intercepte avec C (dans un rayon de 36 px) ou en sautant dessus.
- Un joueur touché perd des points de vie, tombe, se relève. À zéro, il monte au ciel en petit ange. L'équipe qui perd
  ses trois joueurs intérieurs a perdu.
- **Passes** : ⬆ + C vers l'extérieur du haut, ⬇ + C vers le bas, ➡ + C vers le fond, ⬅ + C vers un coéquipier intérieur.
- La balle au sol appartient à celui qui marche dessus. Le match se joue **chez l'équipe de droite**.

## Pouvoirs (bouton V)

Chaque joueur intérieur a le pouvoir de son personnage (`BC.POWERS`), prêt au début du match. Après usage, il faut
**3 attrapés de l'équipe** (2 avec la case bonus Réflexes) pour le recharger : les cases sous le nom, dans le HUD.
Trois sortes : *instantané* (effet immédiat), *au lancer* (V arme le pouvoir, l'icône scintille, le prochain lancer est
spécial ; Téléportation et Tornade partent dès qu'on lance), *passif* (Fantôme).

| Personnage | Pouvoir | Effet |
|---|---|---|
| Matthieu | Code de triche (lancer) | La balle suit sa cible, impossible à attraper ni à sauter, dégâts × 0,6 |
| Josée | Biscuit chaud (lancer) | Si elle touche, des biscuits frappent tous les autres adversaires pour la moitié des dégâts |
| Richard | Boulet du vétéran (lancer) | Lente, dégâts × 1,8 + 4, presque impossible à attraper, grosse projection |
| Mickael | Lunettes laser (instantané) | Laser sur toute l'équipe adverse : figée 2,5 s |
| Marie | Bulles de savon (instantané) | Neuf bulles traversent le terrain ; touché = 3 s à flotter sans bouger (un coup fait éclater) |
| Adam | Pika-choc (instantané) | 5 dégâts à chaque adversaire |
| Milo | Zoom-zoom (instantané) | Vitesse × 2 pendant 10 s |
| Jérémie | Téléportation (lancer) | Se téléporte derrière l'équipe adverse, lance vite dans leur dos, revient |
| Jessica | Aimant à balle (instantané) | La balle (même tenue par l'adversaire) vient à elle, aimant en main |
| Edison | Tornade (lancer) | Toupie, puis la balle rebondit 5 fois dans le camp adverse en frappant tout ce qu'elle touche |
| Josué | Cri du capitaine (instantané) | Dégâts de l'équipe × 1,5 pendant 30 s |
| Zachary | Fusée (lancer) | Balle-fusée qui accélère ; attrapée, elle explose (× 1,5, et la moitié autour) |
| Émily | Blizzard (instantané) | Équipe adverse à vitesse × 0,5 pendant 15 s, neige sur sa moitié |
| Alexie | Licorne (lancer) | À cheval, licorne à côté : tout droit seulement, vitesse × 1,6, impossible à attraper |
| Eliott | Fantôme (passif) | Quand il est chargé, le coup qui devait le toucher passe au travers |

L'ordi utilise aussi ses pouvoirs (fréquence selon la difficulté, `ai.js` → `AI.power`).

## Aventure

Choisis un chef parmi toutes les familles, puis réunis six personnages de ton choix : le chef et deux intérieurs,
plus trois extérieurs. Chaque chef possède sa propre aventure, accessible depuis « Choisis ton aventure ».
Les héros affrontent uniquement des monstres : aucun cousin n’est prêté au camp ennemi.

La campagne suit douze rencontres : Goblins, Lézards-hommes, Sorcières, Squelettes guerriers, Orques berserkers,
Harpies, Hommes-bêtes, Slimes venimeux, Spectres des ombres, Trolls des cavernes, Gnolls et Mandragores hurlantes.
Chaque espèce possède six joueurs, une silhouette et un terrain dédiés (`js/monsters.js`, `js/monster-sprites.js`).
Les portraits illustrés transparents sont dans `assets/monsters/portraits-v2.png` ; leur copie embarquée permet le jeu hors ligne. `js/monster-heads.js` définit les cadrages, et `js/monster-sprites.js` anime les corps détaillés. Le prompt et la provenance sont dans `assets/monsters/README.md`.
La difficulté augmente toutes les quatre rencontres. Après la douzième, un nouveau chapitre recommence la liste
avec +2 aux stats par chapitre, jusqu’à +8 et sans dépasser 18. Une défaite permet de retenter la même rencontre.
Les malédictions ralentissent, le venin inflige des dégâts, les cris étourdissent ; les trolls régénèrent 3 PV toutes
les quatre secondes. La fragmentation des slimes est une animation de réaction aux coups, sans ajouter de joueurs.

**Expérience** : chaque point de vie enlevé = 1 XP pour le lanceur, +20 pour un K.-O. (biscuits, éclair, explosion
comptent aussi). Le n-ième point de stat coûte `40 + 20 n` XP (`BC.xpForPoint`). Les points se placent dans
l'écran d'aventure (bouton +). Stats de **0 à 18** : 1–10 aux couleurs de l’équipe, 11–15 jaunes, 16–18 rouges. Les effets des niveaux 11 et 12 (`BC.PERKS`) restent actifs :

| Stat | 11 | 12 |
|---|---|---|
| Vitesse | Turbo : course plus rapide | Fusée : saute beaucoup plus haut |
| Lancer | Bras canon : +3 dégâts | Boulet : la balle part déjà à 90 % |
| Attrapé | Mains collantes : fenêtre × 1,6 | Réflexes : pouvoir rechargé en 2 attrapés |
| Endurance | Coriace : +1 PV toutes les 4 s | Increvable : survit une fois par match à un coup fatal |

Sauvegardes par chef dans `localStorage` (`bc.adventure.<identifiant>`), et aventure active dans `bc.adventure`. L’ancienne sauvegarde unique est conservée lors du changement de chef. `BC.phys(def, stats)` convertit les stats en valeurs physiques.

## Équipes et personnages

Quatre familles dans `BC.TEAMS` : Les Matt (Matthieu, Josée, Richard), Les Bibi (Mickael, Marie, Adam, Milo), Les Jay
(Jérémie, Jessica, Edison), Les Jo (Josué, Zachary, Émily, Alexie, Eliott). Les trois premiers jouent à l'intérieur ; les
autres à l'extérieur. Une famille de moins de six se fait **prêter des cousins** des deux familles qui ne jouent pas ce
match (`BC.squads`, les plus grands d'abord, jamais la même personne dans les deux camps).

Chaque personnage dans `BC.PLAYERS` a : `name`, `birth` (l'âge est le numéro de chandail, 🎂 le jour de la fête), `role`,
`size`, `stats` (vitesse, lancer, attrapé, endurance de 0 à 12), `look` (visage de secours si le portrait manque) et
`power`. Le menu « Voir la famille » dessine tout le monde côte à côte (par famille ou tous ensemble, pose, décor ou
fond transparent, téléchargement PNG) pour fabriquer des images.

## Équilibrage et tests

```bash
node tools/headless.js --a=matt --b=jo --games=5 --verbose
node tools/headless.js --all --games=4 --diff=2      # toutes les paires, classement
node tools/test-powers.cjs                           # pouvoirs, charge, interceptions, XP, matchs complets
```

Paramètres d'adresse pour tester : `?match=matt,jo&diff=2` lance un match directement (`&cpu=2` : ordi contre ordi),
`?screen=adventure` ou `?screen=family` ouvre un écran.

Voir ../SnowKids/ORGANISATION-DES-JEUX.md pour les sources et le dépôt de publication commun (`../jeux-site/deploy.sh`).
