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
js/arcade-ui.js            écrans arcade partagés : sélection, tableau d'aventure (cartes), affrontement (difficulté), magasin
js/difficulty-badges.js    les cinq écussons de difficulté (SVG) affichés sur l'écran d'affrontement
css/adventure-fit.css      écrans d'aventure sans défilement : barre latérale compacte, encadré Mon équipe, affrontement
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
La difficulté se choisit sur l'écran d'affrontement (« Voir l'affrontement »), parmi cinq écussons, avec des récompenses XP croissantes ; le tableau d'aventure ne montre que les quatre cartes et l'équipe.
Les rencontres déjà gagnées peuvent être rejouées sans avancer la campagne. Une défaite permet de retenter la même rencontre.
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

## Règles arcade et boss

- Possession : 10 secondes pour toute l’équipe, passes comprises. Un tir remet le chrono à zéro. À l’expiration : −5 PV à chaque intérieur vivant et remise directe du ballon à l’adversaire, sans tir.
- Passe éclair : les passes aux extérieurs accumulent jusqu’à trois crans. Après réception, passer ou tirer en moins d’une seconde conserve le combo. Chaque cran accélère passes et tir; une interception ou une attente trop longue le casse. Le joueur humain contrôle la relance.
- Tir parfait : relâcher X dans les 180 ms après la pleine charge déclenche un tir accéléré avec flammes. Compatible avec le combo, au sol et en l’air, pour tous les personnages.
- Chaque horde a six pouvoirs distincts. Après trois victoires ordinaires, un boss solitaire interrompt la campagne; il faut le battre avant de poursuivre. Quatre boss géants (450 à 750 PV), trois tirs spéciaux et une onde de choc annoncée. Les adversaires restent masqués avant le match.
- Les anciennes sauvegardes conservent leur progression; les boss des groupes de trois déjà dépassés ne sont pas imposés rétroactivement.

`js/match-rules.js` rassemble ces règles. Vérification : `node tools/test-match-rules.cjs` (chronos, combos, tirs parfaits, migration et quatre simulations de boss).

## Rejouer et choisir sa difficulté

Les rencontres déjà gagnées (y compris les boss) sont accessibles depuis les cases cochées du parcours. Chaque match se prépare avec une difficulté indépendante : Facile, Moyen, Difficile, Dangereux ou Impossible. Elles donnent respectivement des multiplicateurs d’XP ×1, ×1,5, ×2, ×3 et ×4, renforcent l’IA et ajoutent +0/+2/+4/+6/+8 aux statistiques adverses (plafond 18). Les boss gagnent également de la vie selon la difficulté.

Chaque héros participant reçoit `(XP du match + prime) × multiplicateur`, arrondi à l’entier : prime de 8 XP en victoire ou 2 en défaite. Les statistiques brutes de la partie restent inchangées. Les cinq difficultés réussies sont enregistrées par adversaire et par aventure; les anciennes rencontres restent débloquées sans inventer leur difficulté passée. Un replay ne fait avancer ni la campagne ni le compteur des boss.

Les jauges de résultats s’animent depuis l’XP précédente, remplissent chaque palier et passent au suivant. Le titre de victoire rebondit; les préférences de réduction des animations sont respectées. Vérification : `node tools/test-replays.cjs`.

### Derniers ajustements
- Chrono de 10 s dès l’arrivée du tir adverse dans le demi-terrain, conservé à la récupération ; transfert sans tir et pénalité de 5 PV par joueur intérieur à l’expiration.
- Ballon de même rayon pour tous, boss compris ; tirs des boss ralentis d’environ 15 %.
- Anciens adversaires consultables dans de petites cartes avant de choisir la difficulté du replay.
- Équipe de six séparée des autres héros ; célébration étoilée successive pour chaque héros ayant gagné des niveaux.
- Six portraits différents par espèce, issus des atlas documentés dans assets/monsters/VARIANTES.md.

### Pouvoirs des goblins
1. Bombe impossible à attraper : explosion au contact, esquive ou saut requis.
2. Ballon normal accompagné de 20 sauterelles : elles se dispersent depuis le lancer, traversent le terrain et partent ; 1 PV par sauterelle, une seule fois par joueur. Le saut les évite.
3. Ballon en feu : attrapable, mais applique une brûlure de 4 PV sur 4 secondes, sans faire lâcher un attrapé réussi.
4. Six plaques de glace dans le camp adverse pendant 15 s : déplacement lent avec inertie ; courir avec le ballon fait tomber et lâcher la balle.
5. Cri du capitaine conservé.
6. Nuit gobline au lancer : voile sombre pendant 10 s, HUD conservé lisible.
Les goblins extérieurs peuvent utiliser leurs pouvoirs. Le premier boss a désormais 150 PV de base (les multiplicateurs de difficulté restent actifs).
Validation ciblée : `node tools/test-goblins.cjs`.

### Progression, milieu du terrain et enclumes
- Plafond de stats : 10 au niveau 1, 11 au niveau 5, puis +1 tous les 5 niveaux jusqu’à 18 au niveau 40 ; les stats de base restent préservées. Les anciens points dépassant le plafond sont remboursés une seule fois à la lecture de la sauvegarde.
- Niveau, XP et cœur remontés en haut de la fiche ; points à placer en grand à côté du nom.
- Retomber après avoir traversé le milieu en saut avec le ballon sans lancer/passer rend la balle à l’adversaire, sans lancer automatique.
- Traversée au sol autorisée jusqu’à 50 pixels au-delà du milieu ; après 2 secondes, perte de 2 PV par seconde jusqu’au retour.
- Boss : pluie d’enclumes de 10 secondes, impact annoncé au sol (8 dégâts), tirs du boss toujours actifs.
- Glace : positions et tailles aléatoires ; une seule tentative de chute (35 %) par entrée sur une plaque en mouvement avec le ballon, protection de 4 secondes après une chute. Le ralentissement et l’inertie restent actifs.
- Validation : `node tools/test-territory.cjs`.

La fiche propose aussi une barre rouge de vies avec un bouton + : ce bouton dépense un point d’endurance et respecte le plafond du niveau.

### Présentation des personnages
Badge de vies arcade avec cœur rouge et chiffre doré, sans « PV » ; barre améliorable conservée en aventure. Raccord cou-menton corrigé pour les portraits de famille. Silhouettes sportives féminines pour Josée, Marie, Jessica, Émily et Alexie. Une infobulle explique l’endurance : vies maximales, régénération à 11 et survie à un coup fatal à 12.

### Préparation simplifiée et lisibilité des combats
- L’équipe se gère depuis l’aventure avec « Gérer mon équipe ». La préparation choisit la difficulté puis ouvre directement l’affrontement.
- Récompenses illustrées avec multiplicateur XP et gros bonus, cartes adverses mystérieuses aux dimensions des portraits alliés.
- Animation des bras adoucie, fréquence plafonnée indépendamment des bonus de vitesse.
- Barre de vie sous chaque monstre intérieur vivant, boss compris : vies restantes / maximum, verte, jaune puis rouge. Les adversaires extérieurs invulnérables n’affichent pas de barre.

### Précision et contrôle
- Précision est une cinquième statistique améliorable jusqu’à 18, avec les mêmes plafonds de niveau. Les anciennes sauvegardes reçoivent 6 sans dépenser de points. Le cône de dispersion rétrécit progressivement et disparaît à 18. La direction du lancer humain correspond à la direction affichée au relâchement.
- Options du menu et de la pause : Équipe automatique (fonctionnement existant) ou Personnage fixe (sélection manuelle, coéquipiers autonomes, aucun changement automatique après un K.-O.). Choix conservé dans les paramètres.

### Arènes de boss vivantes
Chaque boss commence par sa signature : eau montante (Brise-Montagne), foudre (Reine), lave (Gorak), vent (Roi du néant), puis alterne son propre cycle. Événement de 12 s dont 2 s d’annonce, avec 6 s de répit. La possession, les tirs et les enclumes continuent.
- Eau : monte depuis les deux bords, laisse le centre sûr, ralentit et inflige 1 dégât/s ; sauter évite le contact.
- Foudre : position figée, cercle annoncé pendant 1,15 s puis 6 dégâts, esquivable en sortant du cercle.
- Lave : fissures annoncées, flaques temporaires, 3 dégâts/s au contact au sol.
- Vent : rafales qui poussent joueurs et ballons. Les coéquipiers IA cherchent à sortir des zones dangereuses.
- Tornade : entonnoir cartoon animé, poussière, débris et yeux tournoyants, également autour du ballon spécial.
Validation : `node tools/test-boss-arena.cjs`.

### Or, équipement individuel et éléments
- Magasin accessible au menu, dans l’aventure et après un résultat. 32 objets : quatre éléments × quatre emplacements × deux niveaux. Prix : 60 / 160 pièces. Achat propre au personnage sélectionné, équipement automatique, retrait et rééquipement gratuits. Un seul objet par emplacement.
- Portefeuille commun et inventaires des héros sauvegardés localement dans `bc.equipment`, indépendamment des aventures. Équipement copié au début du match.
- Chaque match terminé par un humain donne 40 pièces en victoire, 20 en défaite, multipliées par 1 + 0,25 × difficulté ; victoire contre un boss : +40. Rejouer rapporte aussi ; quitter un match ne rapporte rien. Attribution unique par résultat.
- Les monstres ajoutent un tir élémentaire à un lancer normal sur deux, sans remplacer leurs pouvoirs spéciaux. Feu : brûlure ; glace : ralentissement ; terre : ralentissement ; électricité : étourdissement. Zones au sol temporaires après impact ou chute du ballon.
- Gants : attrapé sans effet élémentaire ; bottes : protection des zones de cet élément ; armure : réduction des dégâts ; amulette : durée réduite ou immunité aux effets des ballons. Deux étoiles sur gants/bottes ajoutent une réduction de dégâts. Les réductions cumulées sont plafonnées à 80 %.
- Vraies silhouettes des monstres assombries sur les écrans mystère. Textes de conseils des récompenses supprimés.
Validation : `node tools/test-equipment.cjs` ; achat, séparation des inventaires et affichage testés dans Chrome.

### 64 objets, magie et vies permanentes
Le magasin présente les 64 objets illustrés sur des étagères, triés par prix sans catégories élémentaires. Cliquer ouvre une fiche avec effets et achat/équipement. Les pièces sont dessinées en or, indépendamment des emojis du système.
32 objets supplémentaires : vitalité, force, résistance, précision, bouclier, soin, zéphyr et nova, chacun en quatre versions (90 / 170 / 280 / 420 pièces). Les bonus sont appliqués au début du match, sans modifier les statistiques de base.
16 de ces objets ont un pouvoir activable dans les petits boutons du héros actuellement contrôlé : bouclier 5/6/8/10 s (recharge 30 s), soin 12/18/24/32 (25 s), vitesse pendant 6 s (20 s), nova autour du héros (22 s). Les recharges suivent le temps du match et s’arrêtent pendant la pause. La pénalité de possession traverse le bouclier.
L’achat de +1 vie maximale coûte 50 pièces, est permanent, propre à chaque héros et cumulable. Sauvegardé dans son inventaire, il reste indépendant du changement d’équipement.
Validation : `node tools/test-magic-items.cjs` et vérification dans Chrome des étagères, du tri, de la fiche d’achat, de l’achat de vie et de l’activation cliquée du bouclier.

### Audio, bras et écran unique
- Musiques CC0 de Juhani Junkala (menu, match, boss, résultats) et huit bruitages Kenney téléchargés dans `assets/audio`. Sources et licences conservées dans ce dossier. Volume musical indépendant, silence global, arrêt en pause et lorsque l’onglet est masqué ; démarrage après interaction du joueur.
- Bras dessinés avec manches aux couleurs des équipes, contours et mains ouvertes ou fermées selon la pose, inspirés de la référence fournie.
- Menus ajustés à la fenêtre par `viewport.js`, magasin paginé (8 objets/page, 5 héros/page).
- Mode fixe : le joueur intérieur reste mémorisé. Un extérieur avec le ballon prend temporairement le contrôle humain ; le contrôle revient au joueur intérieur après la passe ou le tir.

### Butin de victoire et roulette
Chaque victoire contre une horde ou un boss accorde un équipement exclusif, y compris en rejouant. Les cinq difficultés ont un budget de bonus croissant (3–4, 6–7, 9–10, 12–13, 15–16 points, répartis entre deux stats). Les valeurs finales restent plafonnées à 18 par le système d’équipement. À partir de Difficile, un objet peut aussi porter Sanctuaire, Élan du tonnerre ou Étoile dévorante, avec une recharge de 28 s.

Le tirage est sauvegardé dans `bc.equipment` avant la roulette. Après les gains de niveaux, le défilement ralentit jusqu’à l’objet gagné ; Révéler maintenant permet de passer l’animation. On choisit ensuite le destinataire et on équipe ou conserve l’objet. Les objets gagnés se retrouvent dans Voir mes objets, jamais dans les articles en vente. Le bouton Mon butin rouvre la récompense sans nouveau tirage.

Vérification : `node tools/test-victory-loot.cjs` (80 rencontres/difficultés, progression du butin, sauvegarde, attribution unique, transfert, exclusion des achats et pouvoirs).

### Tablettes et téléphones
Les petits écrans utilisent `css/mobile.css` au lieu de réduire le menu de bureau. Les actions principales restent dans un pied de page fixe ; le contenu long défile dans sa propre zone. Sur téléphone portrait, l’aventure sépare Adversaires et Mon héros, et les portraits remplacent les grandes illustrations secondaires. La composition fonctionne par appui, avec une croix pour retirer les coéquipiers.

Les commandes tactiles acceptent déplacement et action simultanés. Le bouton plein écran apparaît si le navigateur le permet ; le paysage est recommandé pour agrandir le terrain. Vérifications en émulation Chrome : 320×568, 390×844, 844×390 et 768×1024 ; menus, aventure, équipement, composition, boss, résultats et options. Un essai sur de vrais appareils iOS/Android reste utile, notamment pour le plein écran propre à chaque navigateur.

### Version 2.2 — pratique dans l’aventure

La pratique s’ouvre depuis l’aventure et utilise son héros principal. Les récompenses et les exercices réussis sont sauvegardés dans cette aventure. Le retour recharge sa progression à jour. Le magasin compare les bonus avec l’objet équipé, et la visée automatique ou manuelle se choisit dans les options ou la pause.
