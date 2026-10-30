# Canon Big Boom

Jeu de tir en vagues où chaque membre de la famille défend son canon contre des bébittes volantes : chauves-souris,
fantômes, ballons méchants, abeilles, oiseaux de feu… jusqu'aux chasseurs spatiaux du dernier monde, où le canon est
fixé à un vaisseau. Interface façon *LEGO Star Wars* sur Switch, carte du monde façon *Donkey Kong Country*.

Aucun outil de build : ouvrir `index.html` (ou servir le dossier). Tout est en JavaScript et canvas.

## Comment ça marche

- **Carte** : six mondes de cinq tableaux. Tableaux : abattre N ennemis, survivre, contre la montre, grande vague, boss.
  Trois étoiles si le canon finit avec 70 % de ses points de vie ou plus.
- **Or** : 1 pièce par ennemi au premier monde, +1 par monde. Les ennemis spéciaux donnent ×5, les boss ×40, et les
  combos (ennemis abattus à la suite) multiplient jusqu'à ×2. L'or et l'XP restent acquis même quand on est détruit
  (« tu meurs, tu recommences plus fort »).
- **Tir** : on tire en continu tant qu'on maintient le clic, le doigt ou Espace, mais la cadence de base est lente
  (`CB.BASE_COOLDOWN` = 0,8 s) : l'amélioration « Cadence » du hangar, la carte « Gâchette rapide » et la carte unique
  « Gâchette folle » (cadence ×2 pour la vague) l'accélèrent.
- **Plein écran** : la carte et les vagues remplissent toute la fenêtre (ordinateur, tablette, téléphone) ; la scène
  960×640 reste entière et centrée, le décor s'étire dans les bandes restantes (`Render.fitCanvas`).
- **Visuel des tableaux** : décor pleine fenêtre en couches (ciel, étoiles, lune ou soleil, trois montagnes, sapins, sol en
  colline, pont de vaisseau dans l'Espace), héros vu de dos sur son chariot-canon au centre, coéquipier de profil à gauche
  (même esprit que le prototype `SnowKids/canon-boom-boom`). La projection 3D suit la taille de l'écran (`CB.layout`).
- **Niveaux** : chaque niveau gagné donne un point d'évolution que le joueur dépense lui-même (vie, dégâts, cadence,
  portée, critique, butin) dans la fiche du personnage (bouton 📊 Fiche / ⭐ Évolution sur la carte) : héros sur son canon à gauche, niveau et
  barre d'XP, puis six stats à barres obliques façon Ballon chasseur avec un bouton « + » par stat (plafond `CB.TALENT_MAX` = 20).
- **Équipe** : au hangar, un coéquipier (autre membre de la famille) se recrute une fois pour toutes ; il vise et tire
  tout seul depuis un canon à gauche, avec des dégâts divisés par deux (`CB.HELPER`).
- **Mode Debug (Matthieu seulement)** : sur la carte, « 🐞 Debug » lance le tableau choisi avec un panneau latéral
  (pause, vitesse ¼× à 4×, objectif, visuel, monstres aléatoires, arrivées planifiées en paquets, boss, PV/vitesse ×),
  « 🆕 Créer un tableau » part d'un tableau vide. « 💾 Sauvegarder JSON » télécharge le tableau ; voir `tableaux/README.md`
  pour le relier à une case de la carte via `js/custom-waves.js` (`CB.CUSTOM_WAVES`).
- **Progression des mondes** : il faut réussir `CB.WORLD_NEED` = 3 tableaux (une étoile ou plus) d'un monde pour ouvrir le
  suivant, pas forcément les cinq ; le canon d'un monde s'achète une fois son boss battu. Le bouton 🌍 Mondes de la carte
  montre les six mondes (décor, étoiles, tableaux réussis, verrous).
- **Secrets de la nuit sans fin (1-1)** : rien n'est annoncé au joueur. Cent monstres abattus (cumulés, `profile.nightKills`)
  révèlent le tableau 2 ; ensuite les coffres mystères révèlent les tableaux 3 à 5 ; après 2 minutes dans une partie passe
  une seule fois un **coffre doré** : le toucher ouvre un portail bleu façon Diablo (`Wave.openPortal`, `Render.portal`,
  `CB.PORTAL_TIME`) qui nous transporte tout de suite, sans finir le tableau, dans le passé.
- **La Vallée des dinosaures (1-6)** : tableau secret relié au tableau 1 par un chemin bleu sur la carte (`world.secret`,
  `CB.wavesOf`), sans fin lui aussi (`CB.ENDLESS_DINOS`, décor `prehistoire` : montagne enneigée, volcan, palmiers), vingt
  vrais dinosaures (`CB.DINOS`, traceur paramétré `dinoDraw` dans render.js). On y arrive avec ses cartes, son niveau de
  partie et sa vie (`carry` du constructeur de `CB.Wave`).
- **Boss en trois actes** (dernier tableau de chaque monde) : on abat des monstres jusqu'au niveau de partie 5
  (`CB.BOSS_LEVELS`, XP ×`CB.BOSS_XP`), le boss sort seul et il faut lui enlever un tiers de ses PV ; il s'enfuit, on
  remonte au niveau 10, il revient avec de nouveaux pouvoirs (`CB.BOSS_POWERS` : tir rapide, boulet lourd, éventail,
  bombe à retardement qui s'arrête et explose si on ne la détruit pas, rayon chargé), puis l'acte final au niveau 15.
  Toutes ses attaques sont des projectiles (`def.shot`) qu'on peut faire exploser avant qu'ils nous touchent.
- **Fiche du canon bicolore** : dans le hangar, chaque barre montre la part du personnage (talents + talent de famille,
  jaune) et la part du canon (améliorations + canon équipé, bleu), d'après `CB.STAT_PER`.
- **Encyclopédie** : bouton 📖 sur la carte ; onglets Pouvoirs, Combos secrets (avec la recette) et Monstres par monde
  (silhouette noire « ??? » tant qu'un monstre n'a pas été vu et abattu). La bannière « Nouveau monstre » ne revient plus
  pour un monstre déjà rencontré dans une partie précédente.
- **Hangar** : à gauche la fiche du canon (héros assis sur son canon vu de profil, sept stats à barres obliques avec la
  valeur effective), à droite des tuiles à gros icône (description en info-bulle). La pièce d'or est partout l'élément
  CSS `.coin` (`CB.COIN`, `CB.icon()`), jamais l'emoji 🪙. En mode sans fin, le HUD n'affiche ni barre ni compteur.
- **Hangar (contenu)** : améliorations permanentes (cadence, portée, dégâts, vie, butin, critique, réparation), canons débloqués
  monde par monde, apparences de boulets (traînées de flammes, d'étoiles, boule de bowling…), effets spéciaux qui se
  déclenchent parfois au tir (boule de feu, pluie d'étoiles, bowling, éclair en chaîne, boule de neige).
- **Niveaux** : l'XP monte le niveau du personnage (+5 PV et +2 % de dégâts par niveau).
- **La nuit sans fin (monde 1, tableau 1)** : pas de mission, façon Vampire Survivors. 20 styles de monstres d'Halloween
  (`CB.HALLOWEEN`) arrivent un à un selon `CB.ENDLESS.firstAt`, chacun en 4 paliers de couleur (`CB.TIERS` : normal, rouge,
  doré, violet = 80 variantes), avec des PV qui montent avec le temps. Des coffres mystères passent régulièrement : les
  toucher ou les abattre révèle un nouveau tableau (2 à 5) sur la carte, dessiné avec une animation de chemin et d'étoiles
  (`profile.discovered` / `profile.shown`). La nuit se termine à la mort ou via « Terminer la nuit » : étoiles selon le
  temps survécu (90 s, 180 s, 300 s).
- **Zone d'apparition responsive** : la demi-largeur et la hauteur où les monstres peuvent se trouver (`CB.VIEW.spread`,
  `spreadY`) sont calculées d'après l'écran, à la profondeur où ils nous atteignent. Tous les appareils voient donc tous
  les monstres ; 35 % des arrivées sont « larges » (jusqu'au bord), les autres plus groupées au centre.
- **Billes** : au départ, le canon tire de petites billes. La carte « Boulets géants » les grossit de 75 % à chaque prise
  et se cumule sans limite (175 %, 306 %, 536 %, 938 %…).
- **Bestiaire** : le panneau d'objectif de la carte ne montre que les monstres déjà vus et abattus au moins une fois
  (`profile.seenBy` / `profile.killsBy`), sinon un « ? ».
- **Pictogrammes des cartes** : chaque pouvoir a sa tuile colorée dessinée au canvas (`Render.cardIcon`), reprise dans
  la rangée des cartes acquises. Le héros sur son chariot (`Render.battleCannon`) sert partout : titre, carte, hangar, vague.
- **Niveaux dans la vague** : l'XP des ennemis remplit une jauge (`CB.runXpFor`) ; chaque niveau gagné pendant la
  vague offre un tirage de trois cartes, les niveaux en attente s'enchaînent. Les variantes spéciales ne donnent plus de
  cartes : XP ×5 et or ×2.
- **Niveaux de cartes et combos secrets** : chaque carte monte jusqu'au niveau 3 (les boulets géants sans limite).
  Quand deux ingrédients sont au niveau 3, leur combo secret (`CB.COMBOS`, 10 au total : Déluge de plomb, Siphon de sang,
  Mitrailleuse tournoyante, Tempête de givre, Comète dévastatrice, Pacte d'Odin, Midas explosif, Trou noir monétaire,
  Anesthésie totale, Moissonneuse royale) entre dans le tirage, toujours proposé tant qu'il est disponible, et monte lui
  aussi jusqu'au niveau 3. Tuile dorée montrant les deux ingrédients.
- **Cartes** : abattre la variante spéciale d'un monstre (chauve-souris rouge, fantôme vert…) offre trois cartes ;
  celle choisie dure jusqu'à la fin du tableau.

## Fichiers

```
index.html                 écrans (titre, personnages, carte, hangar, vague) et chargement des scripts
css/style.css              interface façon LEGO Star Wars (panneaux bleu nuit, onglets, HUD)
js/config.js               VERSION, famille (talents), ennemis, boss, mondes, vagues, améliorations, canons, boulets, effets, cartes
js/family-head-sources.js  portraits de famille (les mêmes que les autres jeux)
js/family-heads.js         découpe des portraits en trois vues
js/save.js                 sauvegarde par personnage (localStorage « cb.save »), déblocages, achats, niveaux
js/game.js                 simulation d'une vague : tirs, ennemis, boss, dégâts, cartes, récompenses (sans DOM)
js/custom-waves.js         registre des tableaux personnalisés reliés à la carte (CB.CUSTOM_WAVES)
js/debug.js                mode Debug / éditeur de tableaux (Matthieu), export JSON dans tableaux/
js/render.js               décors des six mondes, ennemis, boss, canons, boulets, traînées, effets, réticule
js/map.js                  carte du monde (îles, chemin, tableaux, personnage qui marche)
js/audio.js                sons synthétisés (WebAudio)
js/input.js                clavier et manette
js/main.js                 écrans, titre animé, hangar, HUD, cartes, pause, résultats
tools/test-game.cjs        vérifications de la simulation (node tools/test-game.cjs)
```

## Mise en ligne

Augmenter `CB.VERSION` dans `js/config.js`, puis `../jeux-site/deploy.sh "Canon Big Boom : …"`.
