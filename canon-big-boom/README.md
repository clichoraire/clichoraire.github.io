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
- **Tir** : au départ, un clic (ou une pression) = un boulet. Le **tir automatique** (maintenir pour tirer en continu)
  s'achète au hangar, ou s'obtient le temps d'une vague avec la carte « Gâchette folle ».
- **Plein écran** : la carte et les vagues remplissent toute la fenêtre (ordinateur, tablette, téléphone) ; la scène
  960×640 reste entière et centrée, le décor s'étire dans les bandes restantes (`Render.fitCanvas`).
- **Visuel des tableaux** : décor pleine fenêtre en couches (ciel, étoiles, lune ou soleil, trois montagnes, sapins, sol en
  colline, pont de vaisseau dans l'Espace), héros vu de dos sur son chariot-canon au centre, coéquipier de profil à gauche
  (même esprit que le prototype `SnowKids/canon-boom-boom`). La projection 3D suit la taille de l'écran (`CB.layout`).
- **Niveaux** : chaque niveau gagné donne un point d'évolution que le joueur dépense lui-même (vie, dégâts, cadence,
  portée, critique, butin) dans le dialogue « Choisis ton évolution » (ou via le bouton ⭐ Évolution sur la carte).
- **Équipe** : au hangar, un coéquipier (autre membre de la famille) se recrute une fois pour toutes ; il vise et tire
  tout seul depuis un canon à gauche, avec des dégâts divisés par deux (`CB.HELPER`).
- **Mode Debug (Matthieu seulement)** : sur la carte, « 🐞 Debug » lance le tableau choisi avec un panneau latéral
  (pause, vitesse ¼× à 4×, objectif, visuel, monstres aléatoires, arrivées planifiées en paquets, boss, PV/vitesse ×),
  « 🆕 Créer un tableau » part d'un tableau vide. « 💾 Sauvegarder JSON » télécharge le tableau ; voir `tableaux/README.md`
  pour le relier à une case de la carte via `js/custom-waves.js` (`CB.CUSTOM_WAVES`).
- **Hangar** : améliorations permanentes (tir automatique, cadence, portée, dégâts, vie, butin, critique, réparation), canons débloqués
  monde par monde, apparences de boulets (traînées de flammes, d'étoiles, boule de bowling…), effets spéciaux qui se
  déclenchent parfois au tir (boule de feu, pluie d'étoiles, bowling, éclair en chaîne, boule de neige).
- **Niveaux** : l'XP monte le niveau du personnage (+5 PV et +2 % de dégâts par niveau).
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
