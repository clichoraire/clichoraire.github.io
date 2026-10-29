# Bomberkid

Jeu inspiré de Bomberman 64 (1997) : vue en perspective, bombes à poser, ramasser et lancer, tableaux avec énigmes,
mini-boss et boss. Les personnages sont les membres de la famille (portraits partagés avec les autres jeux).

Deux modes :

- **Aventure** — choix du monde sur des îles flottantes (façon Bomberman 64), puis des tableaux : exploration (1-1, le Jardin
  vert : plateaux, eau, cibles rayées de couleur (huit couleurs) à atteindre en lançant une bombe pour ouvrir grilles et ponts-levis de la même couleur, cartes d'or),
  arènes à monstres ou à interrupteurs, mini-boss, boss. Trois cœurs par vie, trois vies. Progression sauvegardée par
  personnage (`bk.adventure.<id>` dans localStorage), temps de jeu dans `bk.playtime`.
- **Chez les grands-parents** — première île de l'Aventure : Josée et Richard, et le magasin de grand-maman, une pièce où
  l'on se promène entre trois comptoirs (Josée, Richard, Matthieu) ; on avance sur un article exposé et on appuie sur Espace
  pour le payer en pièces d'or ramassées dans les tableaux (bombes, flammes, patins, coup de pied, cœurs, vies).
  Vie numérique : 40 points au départ (stat « Vie max », +10 par point ; chaque cœur acheté au magasin +10). Près d'un feu de
  camp (à moins de 1,7 case), la vie remonte chaque seconde de la stat « Repos au feu » (2 au départ, +1 par point). Les coups
  enlèvent 10 (flammes, monstres, projectiles, chutes), 15 (crapaud), 20 (golem) ou 5 (lave) ; « −10 » flotte au-dessus de la
  tête. Les cœurs trouvés redonnent 5, 10 ou 20 points (leur taille et leur chiffre le disent). HUD : cœur et barre dégradée
  rouge → jaune, puis « 💣 ×1/1 » (bombes disponibles / maximum) et les flammes.
  Or et achats dans la sauvegarde du personnage (`gold`, `upgrades`), expérience et niveau (`xp` ; chaque monstre vaincu
  affiche « +XP » au-dessus de la tête, un niveau = vie complète, +1 cœur max tous les 5 niveaux, +1 point de stat).
  Stats (`stats`, `points`, fiche avec Tab) : stamina max et récupération. La marche est lente ; deux appuis rapides sur une
  direction font courir (accélération, poussière), la course use la stamina qui se recharge au repos.
  Étages : chaque case peut être montée jusqu'à l'étage 4 (outils « Étage +1 / −1 » de l'onglet Décor, `props["c,r"].lv`) ;
  les falaises montrent un joint par étage. Une rampe `/` relie deux étages voisins. Le héros peut sauter en bas d'un rebord
  (petite chute), jamais remonter sans rampe ; depuis une bombe, le bond atterrit au plus un étage plus haut (escalier à marche
  manquante : bombe dans le trou, on saute dessus, on bondit de l'autre côté). Les monstres ne descendent pas des rebords.
  Bloc-piston `}` : une bombe qui explose dessus est étouffée (pas de flammes) et fait monter le bloc d'un étage, pour de bon,
  avec ce qui est dessus. Ascenseur `{` : plateau de métal sur un poteau, au repos 0,35 au-dessus de son sol (le héros y monte
  d'un petit pas, une bombe posée dessus se glisse dessous) ; l'explosion étouffée le fait monter lentement (2,6 s) de deux
  étages, il attend 3,5 s, puis redescend. Sols : lave `[` (−5 points de vie à chaque contact, les monstres l'évitent, une
  bombe lancée dedans explose, le feu n'y meurt pas) et glace `]` (on glisse : les commandes répondent lentement et on continue
  sur sa lancée). Le crapaud ne saute plus par-dessus l'eau, les murs ni d'un étage à l'autre ; le golem cherche un
  chemin sans eau ni changement d'étage.
  Deux fins de tableau : `G` est un portail bleu tourbillonnant (le héros s'y fait aspirer, puis « TABLEAU RÉUSSI ! »
  en gros titre doré) et `|` un gros diamant qui flotte et tourne lentement ; l'attraper le fait s'envoler et éclater,
  confettis, fanfare et « BRAVO ! » façon N64, +1000 points. Une seule fin par tableau. Dans les maisons et chez les
  grands-parents, `G` reste une simple porte (`exitKind: 'door'`).
  Sept monstres de plus : le Cogneur (marche, puis frappe le sol du marteau : séisme sur les 8 cases voisines, casse les blocs
  mous), le Cracheur de feu (boules de feu qui rebondissent en ligne droite, éteintes par l'eau), le Souffleur de glace (éclats qui
  gèlent le héros 1,6 s sans le blesser), le Magicien (se téléporte ; sa magie, trois formes qui tournent, avance 6-7 cases,
  s'arrête, repart vers le héros, trois passes puis disparaît ; elle passe par-dessus tout, une flamme la détruit), la Taupe
  (avance sous terre, hors d'atteinte, surgit près du héros 3,5 s et lance des mottes de terre en cloche, une toutes les 2,1 s), la Guêpe (vole par-dessus l'eau et les blocs, insensible
  aux flammes en vol, pique en plongeant : c'est là qu'on peut la toucher) et la Plante carnivore (sort du sol régulièrement). Trois squelettes lancent leur os en boomerang (il tourne, va
  jusqu'à 3 cases ou au premier bloc, reste 1 s au bout, revient ; le squelette ne bouge pas tant que l'os est dehors ; une flamme
  détruit l'os) : blanc (3 cases), rouge (5 cases, os 1,3 × plus rapide), noir (7 cases, marche et os 1,5 × plus rapides).
  Deux ennemis fixes et solides (ils bloquent leur case, les flammes s'y arrêtent) : le lance-fusées (3 coups) tire toutes
  les 3,5 s une fusée qui suit le héros et explose au contact (joueur, bloc, bombe) ; une flamme la détruit (+50 points).
  Trois canons pivotent vers le héros, se gonflent 0,6 s (indice visuel, lueur au bout du fût), puis tirent un boulet en
  ligne droite qui s'arrête au premier bloc ou à une falaise : le noir (2 coups), le rouge (4 coups, boulets de feu) et
  le bleu (4 coups, tire deux fois plus souvent, boulets deux fois plus lents).
  Le monstre marin (3 coups, bleu-vert, vit dans l'eau ou sur terre, solide) tourne la tête vers le héros, ouvre la gueule
  et y fait grossir une boule de poison pendant 0,9 s, puis la crache en ligne droite (10 points de dégâts) ; la gueule se
  referme ensuite et il attend ~3 s. Les flammes traversent l'eau : une bombe sur la rive peut l'atteindre.
  Rail de plateforme (`(`, onglet Décor) : des cases de rail qui se touchent forment un chemin (droit, en L, en serpent) ;
  une plateforme y glisse en faisant l'aller-retour (pause d'une seconde aux bouts) et emporte le héros et les bombes
  posées dessus. Elle monte au niveau des cases d'embarquement voisines des bouts du rail (un étage au-dessus du rail
  par défaut ; deux si les couloirs sont à l'étage 2, et alors un bond de bombe depuis la fosse ne l'atteint pas) ; en
  descendre au-dessus de la fosse fait tomber chez les monstres, et une rampe (ou un escalier : rampe, palier d'étage 1,
  rampe) permet de remonter recommencer. Les monstres ne prennent pas les rampes (seuls le héros, les PNJ et les
  fantômes). Au pied d'un rebord dont on vient de sauter, on peut repartir dans tous les sens sauf remonter.
  Le tableau 1-1 est la carte « Niveau 1-1 » de Matthieu (js/stage-1-1.js, 20 × 92, village, maisons dont une boutique,
  feux de camp, 31 monstres) ; `node tools/import-1-1.cjs ~/Downloads/Niveau_1-1-REAL.json` la régénère après une
  modification dans l'éditeur. L'ancien Jardin vert reste jouable avec `#stage=jardin`.
  Tableaux exportés : `#map=maps/x.bomberkid.json` ouvre un tableau exporté par l’éditeur (il faut un serveur http) et y joue
  (`skip`, `tele`, `ff`… s’appliquent) ; avec `editor` en plus, il s’ouvre dans l’éditeur. `tools/improve-1-1.cjs` fabrique
  « Niveau 1-1 · version Claude » (maps/niveau-1-1-claude.bomberkid.json) à partir de l’export de la carte de Matthieu.
  « Niveau 1-2 · version Claude » (tools/make-1-2.cjs → maps/niveau-1-2-claude.bomberkid.json) : château dans le ciel, cour
  de départ (étage 1) puis trois salles à fosse traversées sur des plateformes mobiles (pont glissant horizontal, tour
  verticale, grand serpent en L) ; les couloirs et les plateformes sont à l'étage 2, deux au-dessus des fosses, pour
  qu'on ne puisse pas les rejoindre d'un bond de bombe ; tomber dans la fosse = monstres et un escalier (deux rampes et
  un palier) pour remonter recommencer ; arène finale (étage 2) où un ascenseur monte au diamant (étage 4), gardé par
  un canon rouge et deux chevaliers.
  Coffre : une flamme le fait éclater ; 3 à 5 pièces d'or volent en cloche sur les cases libres autour (et parfois un
  objet en plus).
  Objets trouvés et achats : sous les barres (vie, niveau, stamina), chaque objet ramassé dans le tableau s'affiche avec
  son nombre (💣 ×2, 🔥 ×1, 🍯…) ; ces objets ne durent que le tableau (le suivant repart des achats). Ce qui est acheté
  est pour toujours : bombe, flamme, patins, coup de pied et gants de force passent dans les améliorations (save.upgrades,
  comme chez grand-maman, avec « Déjà au maximum ! » quand c'est plein) ; les pots de miel et la canne achetés restent dans
  l'inventaire d'un tableau à l'autre (save.inv ; on verse d'abord les pots trouvés). Dans le magasin, les articles sont
  posés sur le comptoir s'il y en a un, sinon simplement à terre (plus de petit socle).
  Gants de force (🧤, 70 pièces chez Richard, ou en vente dans un tableau) : devant une roche (« Roche », onglet Déco),
  Espace la soulève ; on la porte et on la lance exactement comme une bombe (3 cases). En retombant, elle fait 2 points
  à tout monstre dessous (deux flammes), rebondit une case de plus dans la même direction, puis reste là, fêlée : on peut
  la reprendre. Au deuxième lancer, elle se brise. Posée, elle bloque tout le monde ; une flamme s'y arrête sans la faire
  sauter ; on ne saute pas dessus et on ne la pousse pas du pied.
  Hiver : thème « Hiver », sol « Neige » (`)`, blanc, les pas du héros y crissent doucement) et dix décorations
  (bonhomme de neige, sapin enneigé, arbre nu, rocher de glace, cristaux de glace, igloo, traîneau, skis, tas de neige
  qu'on traverse, boules de neige).
  Musique d'une pièce : onglet Magasin → « 🎵 Musique » (quatre pistes). Elle ne joue dans la pièce que s'il y a un
  instrument (piano, juke-box, guitare, tambour, onglet Déco) ; pour le joueur, l'instrument n'est qu'une décoration.
  Champ « 🔍 Chercher… » dans la barre des onglets : filtre les objets de tous les onglets (nom, aide, nom d'onglet, sans
  accents) ; vide ou Échap, on revient à l'onglet courant. En tapant dans un champ, le jeu n'écoute plus le clavier.
  Onglet Maisons : une carte par maison posée, à droite de « Poser une maison » ; un clic ouvre son intérieur.
  Canne à pêche (🎣, en vente dans un tableau, objet d'inventaire unique) : Q ou W au bord de l'eau lance la ligne (sinon
  « Il faut être au bord de l'eau ») ; le bouchon flotte, des rides, ça mord (!), le poisson saute dans les mains avec des
  étincelles (2,8 s, immobile). Le poisson (🐟) va dans l'inventaire ; Q ou W le lance deux cases plus loin : sur un
  monstre, 2 ou 3 points ; sinon il retombe au sol et frétille, on le ramasse. Près d'un feu de camp avec un poisson :
  « ⏎ Cuire le poisson », il grille sur le feu avec une barre de 5 s, puis le poisson grillé (🍖) apparaît à côté ;
  Q ou W le mange : vie max et vie doublées pendant 3 minutes (compteur à côté de la barre de vie).
  Poudre de champignon (🧂, en vente dans un tableau, objet d'inventaire qui s'empile) : Q ou W lance la poudre devant soi ;
  sur une case libre du même étage, un champignon géant sort de terre en grandissant (0,6 s, nuage de terre, « pop »)
  et devient un vrai gros champignon-trampoline (solide ; depuis une bombe, il renvoie 3 cases plus loin). Case occupée
  ou d'un autre étage : « Il faut une case libre devant toi ».
  Cycle jour-nuit (tableaux d'aventure, pas dans les maisons) : 4 minutes par cycle (BK.DAY_CYCLE) — jour ~100 s,
  crépuscule 30 s, nuit 70 s, aube 30 s ; icône ☀️ / 🌇 / 🌙 à côté du nom du tableau. La nuit est un voile bleu sombre
  percé autour des lumières (lampadaires, feux de camp, volcans, flammes, lanterne), avec un halo chaud. Les étoiles sont
  dessinées dans le ciel, derrière les montagnes et le terrain (jamais par-dessus), et elles se reflètent dans l'eau :
  petits points qui scintillent sur les cases d'eau dégagées.
  Or partagé : la cagnotte de pièces d'or (`bk.gold`) est commune à toute la famille — l'accueil l'affiche, et chaque
  personnage garde ses niveaux, ses stats, ses achats et sa progression. (La première fois, l'or que chaque personnage
  avait est additionné.)
  Blocs cubiques aux coins ronds (onglet Blocs, style Minecraft, se cassent avec une bombe) : melon d'eau, bloc de fromage,
  cadeau, bloc de terre à dessus de gazon (`props.deco` melon / cheese / gift / dirtblock). Le mur de briques `W` se casse
  aussi maintenant.
  Nouveaux monstres : le Lapin maléfique (bondit de case en case ; dès qu'il voit le héros à 7 cases il fonce en ligne
  droite très vite, puis reste essoufflé 7,5 s, oreilles tombantes et langue sortie ; 2 bombes). Les carottes : plantées
  dans le tableau (Déco « Carotte à cueillir », on marche dessus) ou achetées (objet d'inventaire « Carotte », Q ou W la lance
  deux cases devant) ; un lapin qui voit une carotte au sol court la manger et devient gentil (rose, cœurs, il ne compte
  plus comme monstre). Le Serpent venimeux (rapide, 1 bombe) : sa morsure enlève 5 et empoisonne 6 s — 2 points de vie
  par seconde, bulles vertes, chip « ☠️ poison » près de la barre de vie. L'Orque (armure, épée ; 4 bombes) garde son
  shaman à 2 cases ; s'il voit le héros à 6 cases il grogne et fonce en frappant de l'épée sans arrêt, mais dès qu'il
  s'éloigne de 4 à 6 cases de son shaman il grogne et revient se placer à côté (sans shaman, il garde son poste). Le Shaman
  orque (12 bombes) : magie plus rapide et plus forte que le magicien (8 cases, 4 passes, 15 points, verte et noire), se
  téléporte à 3 cases au plus, et soigne un orque blessé à 6 cases (+1 toutes les 4 s). Chevaliers redessinés (bottes,
  plastron, épaulières, bouclier à emblème, épée, heaume à plumet ; en charge : penché, visière rouge, traînées) avec les
  variantes rouge (charge plus vite, 15 points, 4 bombes), bleu (repart presque tout de suite, voit à 8 cases, 4 bombes)
  et doré (aura et étincelles ; plus fort que les deux réunis : 9 bombes, charge à 8,5 cases/s, 20 points).
  Pancarte jaune « ⏎ Acheter · 🪙 prix » au-dessus du héros à côté d'un article (dans un tableau ou chez grand-maman) :
  Entrée achète, et sur iPad ou cellulaire on peut aussi toucher la pancarte (comme « Entrer » devant une porte et
  « Cuire le poisson ») ; le bouton ✋ marche toujours. De profil, seul le bras avant passe devant le corps (le bras
  arrière est dessiné derrière).
  Lanterne à fée (🏮, 90 pièces chez Matthieu, ou en vente dans un tableau ; pour toujours) : accrochée au pantalon du
  héros ; elle s'allume toute seule au crépuscule (la fée bat des ailes, halo, lumière de 3 cases autour) et s'éteint à
  l'aube : la fée dort en boule avec des « z » qui montent. Raccourcis : `lantern`, `hour=140` (seconde du cycle).
  Volcan (onglet Déco, 3 × 3 cases autour de la case cliquée) : cône arrondi, coulées de lave, cratère incandescent, fumée
  continue et une éruption toutes les 6 à 10 s (blocs de lave, grondement, secousse ; décor seulement). Montagne : largeur
  1-7, profondeur 1-5, hauteur 2-8 étages, type neige / terre / roche / herbe (crête dentelée, chapeau de neige ou de roc) ;
  la case cliquée est au milieu de sa rangée du bas. Repeindre sur une case d'un gros décor l'enlève en entier.
  Musique : quatre pistes MP3 de Kevin MacLeod (incompetech.com, CC BY 4.0, voir assets/music/LICENSE.txt) selon
  l'écran (menu et choix du monde : Pixelland ; tableaux : Bit Quest ; boss : 8bit Dungeon Boss ; maison, magasin et
  éditeur : Fluffing a Duck). Bouton « Musique » du menu ou touche M pour couper ; la lecture démarre au premier geste.
  Magasin dans l'éditeur (onglet Magasin, dans un tableau ou l'intérieur d'une maison) : « Commerçant » pose un membre
  de la famille (choix du personnage et de sa phrase ; Shift à côté pour lui parler) ; « Article à vendre » pose un objet
  (bombe, flamme, patins, coup de pied, bouclier, cœur, pot de miel) avec son prix et le mode de vente : une seule fois
  (l'article disparaît, mémorisé dans la sauvegarde) ou autant qu'on veut (∞ sur l'étiquette). Le héros achète avec
  Shift sur l'article ou à côté ; l'effet s'applique tout de suite et les pièces d'or de la sauvegarde servent à payer.
  Pot de miel et inventaire : une flamme casse la ruche, qui laisse un pot de miel (3 doses par défaut, props.honey).
  Le ramasser le met dans l'inventaire (24 piles au maximum, huit raccourcis en bas de l'écran, compteur de doses en bas
  à droite ; les pots s'empilent). Q ou W (ou 1 / 2, ou un clic sur l'icône) l'utilise : une flaque de miel apparaît sous
  le héros pendant 14 s et les monstres qui y marchent sont englués (vitesse ÷ 8). Quand il ne reste plus de dose, le pot
  disparaît et un message le dit.
  Abeilles de ruche : elles vivent 10 s puis disparaissent, et attaquent le plus proche, héros ou monstre (une piqûre
  blesse le monstre d'un point).
  Fontaine : à côté (Entrée), le héros boit 1,5 s (glou glou glou) et sa stamina remonte à fond.
  Boîte aux lettres : une flamme la renverse (elle bascule, bois brisé au sol, puis tout s'efface) et laisse toujours une
  pièce d'or.
  Choix du monde : chaque île-monde porte un château à deux tours et un donjon, coiffé d'un gros diamant qui tourne.
  Entrer dans un monde zoome sur son île : elle grossit et devient la grande île du bas, les autres s'écartent, puis les
  tableaux apparaissent au-dessus, chacun sur sa petite île (marqueur au centre : portail, boss, monstres ou interrupteur ;
  cadenas si verrouillé, étoile si réussi). Flèches ou clic pour choisir, Entrée ou clic sur l'île choisie pour jouer,
  Échap ou « Retour » pour dézoomer. « Mes tableaux » garde sa liste (suppression, ouverture de l'éditeur).
  Raccourci : `#worlds,zoom=0,choose=1,ff=1` (monde 0 ouvert, tableau 1 choisi).
  Près d'un feu de camp qui soigne, un halo rouge flashe autour du héros et de petits cœurs montent en s'effaçant.
  La ruche : dès que le héros est sur une case collée à elle (même en diagonale), une abeille en sort (petite guêpe
  deux fois plus petite, 5 points de dégâts), au plus trois à la fois, une toutes les 4 s.
  Le gros champignon est un trampoline : on y saute depuis une bombe (bond), il s'écrase et nous renvoie 3 cases plus
  loin dans la même direction (2 ou 1 si c'est bloqué, sinon on retombe d'où l'on vient) ; en vol, on peut se déplacer
  très légèrement. Atterrir sur un autre champignon fait rebondir encore.
  Les statues (décor) se brisent sous un boulet de canon ou une fusée chercheuse et laissent toujours un objet.
  Sol sous les objets : une case entourée seulement d'objets (bloc parmi des blocs) prend le sol des alentours
  (plus de case de pierre qui apparaît au milieu du gazon après une explosion).
  Un monstre ne prend qu'un coup par bombe (son invincibilité dure plus longtemps que la flamme).
  Sauter sur une bombe (style Bomberman 64) : marcher dans une bombe posée fait sauter dessus ; perché, on rebondit sur place
  et les monstres ne nous atteignent pas (mais la mèche brûle !). Relâcher puis appuyer une direction = grand bond de deux cases
  (un gros champignon juste à côté compte aussi) ; si la case est bloquée (mur, bloc, monstre solide, trop haut), on continue
  jusqu'à la première case libre (cinq au plus), assez haut pour atterrir sur un plateau sans rampe, sur une autre bombe, ou
  dans l'eau.
  Avec le coup de pied, marcher dans la bombe la pousse ; courir dedans permet de sauter dessus (double appui sur une direction).
  L'eau et le vide ne bloquent plus le joueur : il y tombe (plouf et il coule / il rapetisse en tournoyant), perd un cœur
  et réapparaît sur la dernière case sûre (sans cœur restant, il meurt ; chez les grands-parents, aucun dégât).
- **Défis** (remplace le bouton Match) — douze épreuves sur cinq niveaux (Facile → Légende, `js/challenges.js`) : arènes
  générées (bordure, piliers, buissons et blocs cubiques, monstres loin du départ, carottes) avec chrono et deux vies —
  ballounets, gluants, lapins, serpents, chevaliers, orques et shaman, chevalier doré, la horde — et des matchs classiques
  contre les bots (1 à 3 adversaires, facile à difficile). Un défi réussi donne sa récompense en or à toute la famille
  (première réussite : tout ; les suivantes : le quart), la progression est partagée (`bk.challenges`). Raccourcis :
  `#challenges`, `#challenge=lapins,skip`. Le match classique reste accessible par `#pick=match` ou `#match`.

Le bouton **Éditeur** ouvre un éditeur de tableaux : on choisit la taille, le décor et le fond, puis on peint la carte à la souris
avec un tiroir d'outils par onglets (Décor, Blocs, Objets, Maisons, Déco, Ennemis, Tableau, Outils) sur une seule rangée qui
défile (flèches ‹ › et molette). Tester (bouton « Arrêter le test » en haut à droite pour revenir à l'éditeur), sauvegarder (`bk.maps` dans localStorage),
exporter / importer en JSON. Les tableaux sauvegardés se jouent depuis l'île « Mes tableaux » de l'Aventure.

Dans l'éditeur, la carte grandit case par case en cliquant sur la bordure en pointillé (même à gauche ou en haut : tout glisse),
et « Rogner les bords vides » enlève les rangées de fond. Les maisons ont une largeur, une profondeur, une couleur de toit
et une pièce intérieure modifiable (onglet Maisons : liste des maisons posées et « Modifier l'intérieur » ; `houses["c,r"].interior`).
En jeu, la porte bloque : devant elle, une pancarte « Entrer » apparaît et Entrée fait entrer ; la porte `G` du bas ramène dehors.

Un autre bouton, **Debug**, montre un personnage en gros plan avec toutes ses animations (repos, marche, ramasse, porte,
lance, pose, touché, K.-O., victoire, défaite) et à l'échelle du jeu dans une petite scène 3D.

```
index.html          écrans (menu, sélection, aventure, jeu, debug)
css/style.css
assets/title.jpg    illustration du menu
js/config.js        BK.VERSION, constantes, personnages, objets, ennemis, thèmes
js/camera.js        caméra en perspective et primitives 3D (cubes, tuiles, ombres)
js/sprites.js       dessin des personnages (corps procédural + tête de famille), bombes, ennemis, objets, flammes
js/world.js         simulation (déplacements, bombes, flammes, objets, ennemis, boss) et rendu du plateau
js/input.js         clavier (deux joueurs) et tactile
js/audio.js         sons synthétisés
js/ai.js            adversaires du mode Match
js/stage-1-1.js     le tableau 1-1 : la carte de Matthieu importée de l'éditeur (`node tools/import-1-1.cjs <export.json>` la régénère)
js/adventure.js     mondes, tableaux (dont l'ancien Jardin vert, BK.GARDEN_STAGE) et déroulement de l'aventure
js/worldselect.js   écran des îles (sélection du monde)
js/hub.js           île des grands-parents et magasin
js/editor.js        éditeur de tableaux
js/match.js         déroulement d'un match (option onResult pour les défis)
js/challenges.js    les défis : liste, arènes générées, récompenses partagées, écran
js/debug.js         visionneuse des personnages
js/main.js          écrans, menu, boucle de jeu
js/family-heads.js, js/family-head-sources.js   portraits de famille (copiés de Ballon chasseur)
tools/headless.js   charge le jeu dans Node pour les tests (node tools/test-*.cjs)
```

Commandes : flèches pour bouger, Espace pose une bombe (ou la lance si on en porte une), Shift ramasse la bombe sous
nos pieds (ou devant nous) et la lance. Joueur 2 : WASD, F et R. Échap met en pause.

Cartes des arènes (`js/adventure.js`) : `#` bloc dur, `x` bloc mou, `?` bloc mou au hasard, `1` départ, `E` porte,
`e` porte cachée sous un bloc, `S` interrupteur, `b g f k t o` ennemis (ballounet, gluant, fantôme, chevalier, crapaud, golem).

Cartes d'exploration (`explore: true`, construites avec `buildMap`) : `~` eau, `.` pierre, `,` gazon, `:` `;` pierre et gazon
en hauteur, `/` rampe, `=` pont, `#` roc, `W` mur de brique, `x` `X` buisson, `T` arbre, `A`-`F` cibles rayées, `a`-`f` grilles ou
ponts-levis ouverts par la cible de même lettre (pont-levis si entouré d'eau), `1` départ, `G` portail de sortie, `|` diamant, `h` cœur, `k` carte d'or, `$` pièce d'or, `H` porte d'une maison-magasin (3 cases de large), `P` baril dormant, `p` traînée de poudre, `Q` porte scellée
(une flamme allume le baril, l'étincelle suit la traînée et détone au bout : seule cette détonation ouvre la porte scellée),
`< > ^ v` bloc de métal indestructible sauf par sa face en bois (à l'ouest, à l'est, au nord, au sud), `r` roche, `*` fleurs, décorations `l` lampadaire `n` banc `o` pierre tombale `s` statue `u` puits `w` barrière `m` champignons
`2` pancarte `3` tonneau `4` botte de foin `5` épouvantail `6` pot de fleurs `7` boîte aux lettres `8` souche `9` cactus `0` charrette `J` fontaine
`M` table `R` chaise `S` lit `U` bibliothèque `Y` foyer `Z` chaudron `t` plante en pot `@` piano `+` chandelier `?` enclume (toutes bloquent le passage)
`"` + `props["c,r"].deco` : wheel (roue de charrette), trough (abreuvoir), banner (bannière), market (étal), beehive (ruche), mossrock (rocher moussu), logpile (tas de bûches), bigmushroom (gros champignon), bones (ossements, on marche dessus), skullpile (pile de crânes)
`g` hautes herbes `K` caisse (se casse) `i` feu de camp `j` citrouille `O` coffre `L` bûche `I` pilier `N` comptoir `V` étagère ;
sols `-` terre `_` rue `%` place pavée `&` trottoir `!` bordure `y` plancher de bois `z` carrelage `q` tapis.
Le sol et le niveau sous un objet sont déduits de ses voisines quand `props` ne les donne pas.
`props` du tableau : options par case (`letter` d'une cible ou d'une porte, `style`/`size` d'un arbre, `colors` des fleurs,
`h`/`floor` = niveau et sol sous un objet). Sans `h`, le niveau d'un objet est déduit de ses voisines.
Les ennemis sont listés dans `enemies`.

Raccourcis d'adresse pour tester : `#debug,pose=walk,view=side,char=adam`, `#match,skip,ff=5,bots`, `#stage=1-1,skip,tele=16-17`,
`#worlds`, `#hub`, `#shop,gold=75`, `gloves`, `rod,use,ff=2.3` (pêche), `fish=2,use`, `cooked,use`, `cook`, `spore=2,use`, `erupt`, `#stage=1-1,skip,tele=20-16,metal=18-16-0` (bloc de métal, bois au sud), `#pick=match`, `#select`, `#editor,cols=20,rows=16,tab=maisons,tool=Poser une maison,paint=5-4`, `#stage=1-1,skip,tele=20-19,bomb=20-18,onbomb,leap=2,ff=0.2` (perché sur une bombe puis bond vers le nord), `#stage=1-1,skip,tele=20-18,enemy=lanceur-24-15.canon-16-15,ff=2.1` (ennemis ajoutés, fusée et boulet en vol ; types : ballon gluant fantome chevalier lanceur canon canon_rouge canon_bleu marin cogneur cracheur glaceur magicien taupe guepe plante crapaud golem), `#stage=1-1,skip,tele=20-19,diamond=20-16,celebrate=diamond,ff=2.2` (célébration du diamant), `#stage=1-1,skip,tele=3-29,celebrate=portal,ff=1.9` (portail), `#stage=1-1,skip,tele=20-18,lift=20-18,bomb=20-18,boom,ff=1.4` (plateforme montée), `#editor,cols=6,rows=4,set=2-1-},lv=4-1-1_0-1-2` (éditeur : `set` pose des caractères, `lv` des étages, `test` lance le tableau et saute l'intro, puis `tele`, `bomb`, `boom`, `ff` s'appliquent).

Animaux pacifiques (éditeur → Animaux) : chien, chat et oiseau. Ils restent dans un rayon de trois cases
autour de leur placement, alternent promenade et repos, et évitent les obstacles, l’eau et le vide.
Le chien renifle et remue la queue, le chat s’assoit, l’oiseau fait de petits vols.
Ils ne blessent pas le héros, ne bloquent pas son passage, résistent aux dégâts et ne comptent pas
parmi les monstres à éliminer. Ils sont conservés dans les sauvegardes et exports des tableaux.

Chien et chat : à moins de 2,3 cases, ils suivent le héros pendant huit secondes en gardant
un peu de distance. Entrée, Shift ou la pancarte « Caresser » permet de les caresser (petits cœurs).
Les pièces et magasins ont une seule case « SORTIE ↓ » : marcher dessus ramène dehors,
sans devoir viser le centre. Les anciens intérieurs sans sortie accessible en reçoivent une au chargement.
Échap permet aussi de quitter une pièce.

Sac d’aventure : gros bouton sac ou I. 24 piles, grille 3 × 8, personnage, statistiques
de base/actuelles et récoltes du tableau. Huit raccourcis : touches 1–8 (Q/W restent disponibles
pour les deux premiers), ou clic. Glisser-déposer à la souris, au stylet ou au doigt ;
on peut aussi sélectionner un objet puis une case. Le jeu est en pause pendant le rangement.
Les affectations de raccourcis restent stables quand une pile est consommée et sont conservées
dans les pièces. Le sac permet d’utiliser un objet ou d’ouvrir la fiche de statistiques.
Cerf et lapin gentil : animaux pacifiques mais chassables dans l’onglet Animaux. Le cerf donne
deux morceaux, le lapin un. Une bombe qui porte le coup fatal donne de la viande cuite ;
un objet lancé ou autre coup donne de la viande crue. La viande crue cuit au feu en cinq secondes.
La viande cuite rend 10 points de vie, sans dépasser le maximum. Chien, chat et oiseau restent protégés.

Hache : outil réutilisable, trouvable dans le butin, plaçable dans Objets de l’éditeur et vendable
dans les magasins personnalisés. Elle occupe une pile unique dans le sac. Utiliser face à un arbre
au même étage le fait tomber et laisse une souche traversable ; les sapins enneigés et arbres nus
se coupent aussi. Les murs et autres décors restent intacts.

Arbres : chaque arbre abattu donne deux bois à ramasser. Utiliser un bois du sac ou d’un raccourci
construit un feu de camp sur la case libre devant soi (un bois consommé). Le feu soigne et cuit les aliments.

Pouvoirs de bombes trouvables et plaçables dans l’éditeur : gonflage (bombe en main, maintenir Espace
ou le bouton bombe tactile, relâcher pour lancer ; +2 portée et +2 dégâts à pleine charge sans arrêter
la mèche), lancer long (5 cases), niveau 2 (rouge, dégâts ×2), protection des objets ramassables.
La giga-fusion n’apparaît dans le butin qu’après le coup de pied : botter une bombe contre une autre
crée une grosse bombe violette dont l’explosion traverse plusieurs couches de blocs destructibles.
Les murs indestructibles arrêtent toujours la propagation. Le bouclier absorbe une seule explosion,
se brise et repousse légèrement le héros ; il ne protège plus du contact des monstres.

Deux malus trouvables et plaçables : Diarrhée de bombes (15 s de pose automatique en avançant,
dans la limite de bombes disponibles), Mèche courte (20 s pendant lesquelles les nouvelles bombes
ont une mèche deux fois plus rapide). Les compteurs restent visibles ; les deux effets se cumulent.

Remèdes : l’antidote se range dans le sac et annule les deux malus de bombes en une dose.
L’anti-poison se consomme automatiquement dès l’empoisonnement s’il figure dans les huit
raccourcis de la ceinture ; dans le sac, il s’utilise à la main. Aucun remède n’est consommé sans effet à soigner.
Ils sont trouvables, plaçables et vendables dans les magasins personnalisés.

Intérieurs : l’onglet Maisons liste les maisons extérieures et permet de passer de l’une à l’autre
en conservant les modifications. Poser une maison y est masqué et interdit. La sortie est un seuil
de bois qui dépasse le mur du bas, sans portail, dans l’aperçu comme dans le jeu.

Magasin → Allié : choisir le personnage, le prix et 1 à 9 vies (3 par défaut). Le joueur recrute
avec Entrée, Shift ou la pancarte tactile. L’allié suit, frappe les monstres proches, garde 30 PV par vie
et revient après deux secondes jusqu’à épuisement de ses vies. Il accompagne le héros à travers
les maisons, ne prend pas le butin et reste pour le tableau courant. Un recrutement n’est payé
qu’une fois par tentative. Les options du menu et de pause permettent d’activer le tir allié,
désactivé par défaut et mémorisé. Les bombes du héros restent dangereuses pour lui-même.

Les alliés peuvent maintenant poser des bombes pour combattre et ouvrir les blocs destructibles,
ou préparer leur propre bombe puis la lancer vers les monstres. Ils vérifient un chemin de fuite
avant de poser et évitent les zones d’explosion, y compris les bombes en vol, poussées et giga-bombes.
Le score des monstres et blocs détruits par leurs bombes revient au héros.

Décor → Barque : placer sur une case d’eau près d’une rive. Entrée, Shift ou la pancarte tactile
permet d’embarquer. Les flèches et le joystick font ramer librement ; les rives bloquent la coque.
À l’arrêt près d’un sol libre au niveau de l’eau, « Débarquer » apparaît au-dessus du héros :
cliquer/toucher la pancarte ou appuyer sur Entrée/Shift. La barque reste sur l’eau et peut être reprise.

Barque en équipe : les alliés recrutés embarquent automatiquement avec leur héros. Ils restent
passagers pendant la traversée, sans piloter ni lancer de bombes. Au débarquement, ils retrouvent
une case accessible de la même rive, conservent leur vie et reprennent leur suivi. Une petite rive
d’une seule case permet quand même de débarquer tout le groupe.

### Mécanismes du château

Dans le premier onglet de l’éditeur :

- **Demi-étage +½ / −½** : change la hauteur du sol. Une rampe relie les paliers.
- **Ascenseur automatique** : monte et redescend sans bombe ; régler la hauteur, la durée et la pause. Le sol sous la case détermine le palier bas.
- **Plateforme mobile** : un clic trace le trajet vers la droite ou vers le bas. Choisir longueur, étage des quais, vitesse et pause. Construire des quais au même étage aux deux bouts ; le rail est suspendu au-dessus du vide.
- **Mur fissuré · pièce secrète** : construire la pièce, poser le mur à son entrée, choisir le côté, la largeur et la profondeur à cacher. La zone violette de l’éditeur indique la surface masquée en jeu. Les entrées d’une même pièce partagent la même lettre. Une bombe ouvre le mur et révèle la pièce avec des éclats et un jingle.

Le 2-3 contient un parcours obligatoire avec deux ascenseurs et deux plateformes, séparés par une descente. Le 2-2 possède un demi-étage et une salle au trésor secrète ; le portail du 2-4 se cache derrière des pierres fissurées. Les alliés proches voyagent avec le héros sur les transports.

Vérification : `node tools/test-castle-mechanisms.cjs` simule le parcours complet, avec un allié, les chutes et la révélation des pièces ; `node tools/test-castle-world.cjs` vérifie les accès et les objectifs.

### Duels et mécanismes à bombes

- **Magasin → Duelliste** : quatre personnages, difficulté Débutant / Normal / Difficile / Expert et orientation du regard. Passer devant déclenche un duel. Le premier attend près du départ de 2-1. Le combat reprend le biome du tableau et prête le coup de pied aux deux combattants. Victoire par K.-O. ou chute hors du ring, récompenses uniques (or, XP, antidote), retour au tableau avec son équipe et son sac. Une défaite ne retire pas les vies de l’aventure.
- Dans les options du duelliste, sélectionner le personnage placé puis **Dessiner son ring**. Placer le départ du héros et **Objets → Départ adverse · duel**. Deux départs reliés, à au moins trois cases de distance ; taille entre 7 et 25 cases par côté. **Tester le duel** ne donne aucune récompense ; **Retour au duelliste** enregistre le ring dans le tableau exporté.
- Une bombe bottée qui heurte un personnage le repousse et l’étourdit une seconde (étoiles animées). Les murs bloquent le recul et le réglage de tir allié reste respecté.
- **Décor → Ascenseur** : botter une bombe depuis le sol voisin pour la glisser sous le plateau. Une bombe posée sur le plateau reste dessus et explose normalement. Les ascenseurs automatiques gardent leur fonctionnement.
- **Décor → Pont-levis à bombe** : poser la base sur la première case du fossé, choisir direction et longueur (2 à 6 cases). Une explosion contre la base déclenche la rotation ; le pont devient franchissable au bout de 1,2 seconde.
- **Décor → Pont sur colonnes**, puis **Grosse colonne du pont** sur ses cases : chaque lettre identifie une section. Une bombe gonflée à au moins 65 % casse une colonne ; une bombe rouge ordinaire ne suffit pas. Quand la dernière colonne de la section casse, le tablier tremble puis s’écroule après 0,8 seconde.
- **Objets → Explosion en dôme** : souffle circulaire, diagonales comprises, et bulle de feu animée. La portée est le rayon (4 = quatre cases de chaque côté du centre). Le souffle s’arrête à la première couche de blocs et aux murs ; la giga-fusion conserve la traversée des blocs destructibles. Le dôme se combine avec gonflage, bombes rouges et protection des objets. Les alliés anticipent son rayon.

### Monstres supplémentaires (éditeur → Ennemis)

- **Dragon à trois têtes** : 3 PV par tête et trois barres distinctes. Les coups atteignent d’abord la tête vivante du côté de l’attaquant ; les dégâts ne débordent pas sur une autre tête. Chaque tête vivante crache sa boule de feu ; le feu à l’arrivée brûle 6 secondes. Les alliés évitent ces zones.
- **Ninja bombardier** : annonce puis lance des bombes ordinaires.
- **Clown artificier** : alterne cadeaux lancés et bottés. Même mèche, dégâts et interactions qu’une bombe ; l’emballage reste visible quand on le ramasse et le renvoie.
- **Bombe coureuse** : s’allume à moins de 3,5 cases, avec une ligne de vue dégagée. Poursuit le joueur visible et explose après 7 secondes même si celui-ci s’est caché. Le clignotement accélère ; on peut la vaincre avant l’explosion.
- **Guimauve** : petit marcheur, errance limitée à deux cases du départ.
- **Loup-garou** : rôde à une case de sa tanière ; repère un joueur visible à quatre cases puis sprinte avec ses griffes.

Les marcheurs ordinaires errent localement quand ils ne voient personne. Les fantômes restent à 1,5 case de leur point de départ hors poursuite et repèrent le joueur à 3,5 cases. La perception ennemie est bloquée par les murs ; les canons peuvent toujours viser au-dessus de l’eau et tirer sur les statues.
