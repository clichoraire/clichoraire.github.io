# Ballon Chasseur Boisjoli

Jeu de ballon chasseur façon *Super Dodge Ball* (NES), où les équipes sont les familles Boisjoli : les mêmes visages que
dans Hockey Boisjoli et Snow Kids. Trois joueurs à l'intérieur du terrain (ceux qu'on peut toucher) et trois à l'extérieur
(en haut, en bas et au fond du camp adverse, qui relancent la balle). Seul contre l'ordi, à deux sur le même clavier ou à
la manette, ou en Coupe Boisjoli (battre les trois autres familles, chacune chez elle).

Aucun outil de build : ouvrir `index.html` (ou servir le dossier). Tout est en JavaScript et canvas.

## Fichiers

```
index.html                 écrans (menu, sélection, match, résultat) et chargement des scripts
css/style.css
js/config.js               constantes, terrain, PERSONNAGES (stats, apparence, lancer spécial), SUPERS, ÉQUIPES, TERRAINS, BC.squads
js/family-head-sources.js  les portraits de famille (les mêmes fichiers que Hockey Boisjoli et Snow Kids)
js/family-heads.js         découpe des portraits en trois vues (face, côté, dos)
js/sprites.js              personnages en tenue de ballon chasseur (poses : lancer, attraper, touché, au sol, saut, ange), balle, logos
js/game.js                 simulation : déplacements, course, saut, lancers, passes, attrapés, dégâts, K.-O., lancers spéciaux
js/ai.js                   intelligence des joueurs non contrôlés (porteur, défenseurs, extérieurs)
js/render.js               quatre décors (gymnase, parc, ruelle, plage), joueurs triés par profondeur, effets, points de vie, accueil
js/audio.js                sons synthétisés (WebAudio)
js/input.js                clavier (2 joueurs) et manettes
js/main.js                 menus, sélection, boucle du match, résultats, coupe
tools/headless.js          simulation ordi contre ordi dans Node, pour l'équilibrage
```

## Contrôles

| | Joueur 1 | Joueur 2 | Manette |
|---|---|---|---|
| Bouger | Flèches | W A S D | Stick / croix |
| Courir | deux fois ➡ (ou ⬅) | deux fois D (ou A) | deux fois la direction |
| Lancer (avec la balle) · sauter (sans) | X | G | A |
| Passer (avec la balle) · attraper (sans) · sauter en course (avec) | C | H | B |
| Choisir son joueur | 1 · 2 · 3 | 8 · 9 · 0 | LB / RB |
| Pause · son | Échap ou P · M | | Start |

On contrôle celui qui tient la balle ; sinon le joueur change seulement à un événement (lancer adverse : celui que la balle
vise ; balle morte : le plus proche), jamais au fil des déplacements. Les coéquipiers patrouillent toujours un peu.

## Règles

- La balle part **tout droit** devant le lanceur, à sa profondeur : il faut se placer à la même hauteur que la cible.
- Un joueur touché perd des points de vie (en bas de l'écran), tombe, se relève. À zéro, il monte au ciel en petit ange.
  L'équipe qui perd ses trois joueurs intérieurs a perdu.
- **Attraper** (C juste quand la balle arrive, en lui faisant face) : aucun dégât et la balle est à vous. Les lancers spéciaux
  sont plus durs à attraper. **Sauter** (X sans la balle) fait passer la balle sous les pieds.
- La balle d'un lancer normal part à 60 % de sa vitesse et **accélère** en vol.
- **Sauter en course par-dessus la ligne** du centre est permis : on lance depuis le camp adverse, puis on est ramené
  derrière la ligne à l'atterrissage (état `return`, touchable).
- **Course** : deux appuis rapides vers l'avant. Lancer pendant la course au bon pas (à partir du troisième) déclenche le
  **lancer spécial** du personnage ; courir, sauter avec C et lancer au sommet du saut aussi.
- **Passes** : ⬆ + C vers l'extérieur du haut, ⬇ + C vers le bas, ➡ + C vers le fond, C seul vers un coéquipier intérieur.
  Les extérieurs relancent sur l'adversaire (moins fort) ou repassent à l'intérieur.
- La balle au sol appartient à celui qui marche dessus ; les extérieurs ramassent celles qui sortent du terrain.
- Le match se joue **chez l'équipe de droite** : gymnase des Matt, parc des Bibi, ruelle des Jay, plage des Jo.

## Équipes et personnages

Quatre familles dans `BC.TEAMS` : Les Matt (Matthieu, Josée, Richard), Les Bibi (Mickael, Marie, Adam, Milo), Les Jay
(Jérémie, Jessica, Edison), Les Jo (Josué, Zachary, Émily, Alexie, Eliott). Les trois premiers jouent à l'intérieur ; les
autres à l'extérieur. Une famille de moins de six se fait **prêter des cousins** des deux familles qui ne jouent pas ce
match (`BC.squads`, les plus grands d'abord, jamais la même personne dans les deux camps) : ils portent son chandail à l'extérieur.

Chaque personnage dans `BC.PLAYERS` a : `name`, `birth` (l'âge est le numéro de chandail, 🎂 le jour de la fête), `role`,
`size`, `stats` (vitesse, lancer, attrapé, endurance de 1 à 5 ; les points de vie viennent de l'endurance), `look`
(visage de secours si le portrait manque) et `superShot`, un des lancers de `BC.SUPERS` : Code de triche (Matthieu, la
balle disparaît puis réapparaît devant la cible), Biscuit chaud (Josée, dérive puis fonce), Boulet du vétéran (Richard,
lent et très lourd), Lunettes laser (Mickael), Bulle de savon (Marie, monte puis retombe sur la cible), Zoom-zoom (Adam,
zigzag), Crise de bacon (Milo, balle énorme qui tremble), Téléportation (Jérémie, revient frapper dans le dos), Aimant
(Jessica, suit la cible), Glissade sur le ventre (Edison, rase le sol, insautable), Cri du capitaine (Josué, projette au
fond), Blizzard (Émily, spirale), Fantôme (Eliott, invisible par moments), Flash de selfie (Alexie, flash puis éclair),
Fusée d'ado (Zachary, accélère).

## Équilibrage

```bash
node tools/headless.js --a=matt --b=jo --games=5 --verbose
node tools/headless.js --all --games=4 --diff=2      # toutes les paires, classement
```

Paramètres d'adresse pour tester : `?match=matt,jo&diff=2` lance un match directement (`&cpu=2` : ordi contre ordi).

Voir ../SnowKids/ORGANISATION-DES-JEUX.md pour les sources et le dépôt de publication commun (`../jeux-site/deploy.sh`).
