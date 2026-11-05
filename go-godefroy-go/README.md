# Go Godefroy Go!

Jeu navigateur autonome de la campagne de Sire Godefroy de l’Enclume.
Ouvrir `index.html` dans un navigateur, ou servir ce dossier avec `python3 -m http.server 8765`.
Aucune installation ni compilation. Le jeu Canon Big Boom n’est pas modifié.

## Jouer

- Régler l’angle puis cliquer sur **GO, GODEFROY !**.
- Flèche gauche / A / Q : lever le nez. Flèche droite / D : piquer.
- Espace maintenu : propulsion. P : pause. Commandes tactiles également disponibles.
- Après chaque vol : récompense en écus, améliorations à la forge et nouvel essai.
- Les quatre objectifs se valident dans l’ordre. Le dernier demande 10 000 m de distance,
  4 000 m d’altitude et une force d’impact suffisante.
- Sauvegardes par partie : `go-godefroy-go.profiles.v2`. En cas de stockage indisponible,
  le jeu continue et signale que la progression sera limitée à la session.

## Contenu de cette version

Cinq catégories de quatre niveaux, cape fragile, propulsion limitée, inertie, obstacles
terrestres, ricochets, courants ascendants, quatre objectifs et primes uniques.
Décor original en canvas et personnage original généré. La finale est résolue par
le franchissement des seuils de position et d’impact : ce n’est pas encore un combat de boss.
Les corbeaux, ballons gobelins et projectiles des catapultes restent à ajouter.

Le dessin reprend le langage des jeux Flash de lancement : profil 2D, formes simples,
contours épais, aplats et humour visuel. Aucun élément graphique de Learn to Fly 2
n’est réutilisé. Les polices Google Fonts sont facultatives, avec des alternatives locales.

## Vérification

`node test.cjs` : vols de base et améliorés, victoire atteignable, achats, bornes de
sauvegarde, rupture de cape, consommation de carburant et encaissement unique.
Vérification navigateur : scène, lancement, bilan, forge et persistance après rechargement.

## Fichiers

- `physics.js` : simulation indépendante du navigateur et économie.
- `game.js` : rendu canvas, sons, contrôles et interface.
- `style.css` / `index.html` : interface adaptative.
- `assets/godefroy.png` : sprite original transparent, généré avec l’outil intégré ImageGen.
- `assets/PROMPT.txt` : prompt de création du personnage.

## Refonte plein écran et vraies parties

Le jeu s’ouvre maintenant sur un écran titre avec **Nouvelle partie**, **Continuer**,
**Mes parties** et **Plein écran**. Chaque aventure a son nom, son argent et sa
progression. Jusqu’à douze emplacements sont disponibles. La première sauvegarde
est reprise comme « Mon premier serment » sans effacer l’ancienne clé.
Les parties sont enregistrées sous `go-godefroy-go.profiles.v2`.

La scène occupe toute la fenêtre sans défilement ; les menus et instruments sont
affichés par-dessus. Le bouton Plein écran utilise l’API du navigateur quand elle
est autorisée. La forge et le registre restent défilables sur petits écrans.

Le décollage raccorde désormais la rampe au vol sans téléportation. La caméra suit
progressivement le chevalier. La simulation utilise un pas fixe à 120 Hz ; incliner
l’armure fait tourner la vitesse, la portance diminue à basse vitesse, et les
courants dessinés correspondent aux courants de la simulation. Les obstacles
survolés ne sont plus affichés comme détruits et les obstacles détruits le restent.
Le choc final est montré avant le bilan. P / Échap ouvrent la pause, qui permet
également d’encaisser le vol et de quitter vers le menu.

Validation : création d’une partie, propulsion maintenue, inclinaison (35° → 51°),
pause/reprise, bilan, forge, sauvegarde et sélection des parties vérifiés dans le
navigateur. Les tests couvrent aussi les sauvegardes indépendantes, leur migration,
les erreurs de stockage, le pilotage et la stabilité de la simulation.

## Refonte artistique du tableau — 3 novembre 2026

`art.js` remplace l’ancien décor géométrique : vallée illustrée, village et château
lointains, rampe courbe en bois, herse maçonnée et sol herbeux. Le fond défile
plus lentement que le terrain et ses raccords sont réfléchis pour éviter les coupures.
Le cadrage adapte la taille de la scène aux fenêtres verticales.

Godefroy conserve son dessin initial au repos. Une nouvelle illustration originale
le montre allongé, casque en avant, en vol. Animations : respiration, préparation
avec transition de pose, glissade suivant la courbe de la rampe, inclinaison lissée,
cape au vent, roues du chariot, poussée, fumée, ombre au sol, poussière et tassement
à l’atterrissage. Les particules sont plafonnées et gelées pendant la pause. La
préférence système de réduction des mouvements supprime vibrations et secousses.

Les deux nouveaux PNG sont générés avec ImageGen intégré et conservés dans
`assets/vallee.png` et `assets/godefroy-vol.png`. Le dessin original est intact.
Les prompts de ces deux créations sont dans `assets/PROMPTS-v3.txt`.
Vérifié dans le navigateur : chargement, décor, lancement, pose en vol et pause.
La simulation et les sauvegardes conservent leurs tests de régression.

## Poids, vitesse et parcours continu

Le chevalier démarre allongé sur le ventre. `course.js` définit la surface de la
rampe, sa tangente, le point de contact du ventre et la position de sortie. Le
sprite et la simulation partagent ces coordonnées ; l’angle choisi règle aussi
la courbe du tremplin. La durée de glissade est calculée depuis la vitesse de sortie.

La vitesse initiale passe à 90 / 130 / 180 / 240 m/s selon le lanceur. Le temps du
vol avance à ×1,75, avec sous-pas fixes : le premier équipement déplace le terrain
d’environ 110 pixels logiques par seconde au départ (angle 35°). Les poteaux tous
les 100 m donnent des repères proches, en complément du fond en parallaxe.

Cinq tableaux reliés sans écran de chargement : vallée (0 m), Siégeurs (500 m),
falaises (2 000 m), mer de nuages (5 000 m), territoire du Dragon (10 000 m).
Les frontières sont visibles dans le monde, annoncées à leur franchissement et
suivies dans le HUD. Elles changent les éléments de décor et la palette. Ce sont
les régions du parcours, distinctes des quatre objectifs donnant des primes.

À l’écrasement : bref arrêt de caméra, secousse, onde au sol, cratère, poussière,
compression de l’armure et choc grave/métallique si le son est activé. Le bilan
attend 2,2 secondes. Victoire, fin de temps et abandon sont distingués d’un choc.
Tests : contact ventral sur toute la rampe, continuité de tangente, position et
angle de sortie, vitesse minimale, seuils exacts, transitions uniques et campagne.
Vérification navigateur : glissade, vol, franchissement des 500 m, piqué et bilan.

## Bilan, boutique et campagne longue

Le bilan reprend le principe des lignes de performance de la référence fournie :
distance, altitude maximale, durée réelle du vol (hors rampe et pause), vitesse
maximale et destructions. Chaque ligne montre sa règle et son gain entier :
0,08 écu/m de distance, 0,12 écu/m d’altitude, 2 écus/seconde, 0,06 écu/km/h de
vitesse maximale, 40 écus par destruction. Les arrondis s’appliquent par ligne.
Le complément éventuel jusqu’à 70 écus et les primes uniques sont des lignes
séparées. Le total affiche ancien solde + gains = nouveau solde. `earnings()`
produit le décompte utilisé directement par `settle()` et par le bilan ; aucune
seconde formule côté interface. L’encaissement reste idempotent.

La forge devient une échoppe illustrée (`assets/boutique.png`, ImageGen intégré),
avec comptoir, four, outils et fioles. Les fiches indiquent l’objet équipé, le
prochain achat, le prix, les écus manquants et huit paliers par catégorie. Les
quinze premiers équipements sont conservés ; vingt-cinq perfectionnements de
maîtrise prolongent les cinq catégories, pour quarante achats au total.

Le parcours se poursuit jusqu’à **100 km** : neuf régions, huit objectifs et
vingt relais de 5 km. Les quatre objectifs historiques sont conservés et ne
terminent plus la campagne ; le dragon ancestral à 100 km / 8 000 m la termine.
Les relais rapportent une prime uniquement au premier passage pour la sauvegarde.
Des obstacles poursuivent le parcours jusqu’à 100 km. Limite de sécurité : 300 s
de simulation, soit environ 171 s de vol réel. Les anciens écus, niveaux et
objectifs sont conservés ; les quatre nouveaux objectifs restent à accomplir.

Validation : total des lignes, règles d’arrondi, vitesse maximale, versement
unique, migration et victoire finale atteignable testés avec `node test.cjs`.
Vérification navigateur : bilan de 153 écus (83 + 31 + 11 + 28 + 0), passage de
1 581 à 1 734 écus, présentation de la boutique et sauvegarde existante.

## Équipement visible et murs de passage

La boutique montre deux illustrations par fiche (équipé / prochain achat), leurs
stats comparées et un aperçu de Godefroy équipé. `equipment.js` est la source
unique des dessins : 45 SVG dans `assets/equipment/` pour la boutique, et les
mêmes tracés via Canvas en vol. Quatre silhouettes par catégorie, puis insignes
de maîtrise. Les pavois, ailes en fer et ailes de mithril sont distincts. Les
cruches, fusées naines et flacons magiques restent attachés au corps même sans
poussée. Le rendu suit l’inclinaison du chevalier et la cape déchirée disparaît.

`physics.parameters()` alimente la simulation et les caractéristiques affichées :
vitesse initiale, poussée, réserve, portance, maniabilité, traînée et impact.
Les achats restent immédiatement équipés et sauvegardés. Les perfectionnements
d’armure continuent à réduire la traînée après le troisième palier.

Chaque passage possède un rempart composé de pierres destructibles. La résistance
augmente avec les régions. Chaque pierre rencontrée consomme de l’énergie cinétique :
Godefroy continue son trajet tant qu’il a assez de vitesse, puis reste bloqué dans
la brèche. L’inertie et le Coup de bélier réduisent ce coût. Les pierres déjà brisées
ne freinent plus et ne rapportent pas de récompense supplémentaire. Le bilan ajoute
une ligne de 2 écus par pierre effectivement brisée pendant le vol.

Le premier achat d’Inertie débloque **X / Coup de bélier** : 1,5 s de simulation
(~0,86 s réelle), recharge 10 s (~5,7 s réelles), bouton tactile et halo en vol.

### Remparts persistants et échelle du parcours
- Échelle horizontale : 5 pixels logiques/mètre, altitude inchangée ; repères tous les 250 m.
- Pente fixe à 35°, sans réglage dans le menu. Élan initial : 120 m/s.
- Premier rempart à 6 km (la simulation de départ sans pilotage atteint environ 2,8 km).
- Autres remparts à 12, 20, 30, 45, 60, 80 et 100 km ; épaisseur de 300 à 636 m, soit environ 2,5 fois la version précédente.
- Cellules de pierre de 12 m × 40 m, collisions balayées sur le trajet pour ne pas sauter de pierres à haute vitesse. Silhouette du passage formée par les pierres disparues, bords ébréchés et fissurés, éclats animés.
- Les dégâts sont stockés par pierre et par partie dès l’impact. Les anciens tunnels sont convertis en pierres détruites ; écus, achats et objectifs accomplis sont conservés.
- Le tableau suivant ne commence qu’après la sortie effective du corps du chevalier.
- Tests : `node go-godefroy-go/test.cjs` depuis la racine. Vérifie les vols de départ, les tunnels sauvegardés, les impacts successifs selon la vitesse, le Bélier, les différentes hauteurs, la migration et la victoire avec équipement maximal sur des remparts intacts.

### Sensation d’impact
Chaque collision émet sa position, sa perte d’énergie et sa vitesse avant/après.
Le rendu produit de gros fragments rotatifs, des éclats, de la poussière et une
onde locale. Les secousses s’accumulent et retombent rapidement ; le chevalier
se tasse brièvement sous le choc. Un ralenti local de 0,24–0,36 s rend chaque
perte de vitesse lisible. Le temps réel du vol reste utilisé au bilan. Les effets
de secousse, de déformation et de ralenti respectent la préférence de mouvement
réduit. La file d’impacts et le nombre de particules sont bornés.

### Sons de matière
`sound.js` crée des sons originaux en PCM local : éclats/grains filtrés pour la
pierre, modes inharmoniques amortis pour les plaques d’acier, percussion grave et
retombées pour l’arrêt final. Ce sont des bruitages synthétisés, pas des prises de
son téléchargées. Quatre variantes par famille sont préparées au premier clic sur
le bouton Son ; aucun chargement réseau pendant un impact. L’énergie du contact
module le volume. L’arrêt possède sa propre couche et remplace l’ancien bip de choc.
Bus commun avec compression, 18 voix maximum, espacement des impacts rapprochés et
sourdine immédiate (y compris les résonances en cours). Le son reste activable via ♫.

Validation : `node go-godefroy-go/sound-test.cjs` vérifie les échantillons, les
variations, la fin des enveloppes, la sourdine, le nombre de voix et le déclenchement
unique de l’arrêt. `apercu-sons-impact.wav` présente deux impacts et un arrêt avec
les mêmes sources PCM que le jeu. Séquence jouée dans le navigateur sans erreur JS.

### Rampe, vent et propulsion
Trois textures PCM locales bouclées complètent les impacts : raclement métallique
modulé par l’avancement sur la rampe, souffle du vent modulé par la vitesse réelle,
et grondement du booster tant que la poussée consomme du carburant. Le volume,
la hauteur et l’ouverture du filtre évoluent progressivement. Le vent s’atténue
quand Godefroy ralentit ; les couches continues s’effacent à l’arrêt, laissant
les impacts résonner. Pause, arrière-plan, menu et sourdine arrêtent les sources.
Trois sources continues au maximum, réutilisées sans création à chaque image.
Les tests audio couvrent ces transitions et la reprise. Démonstration locale :
`apercu-rampe-vent-booster.wav` (rampe, vent croissant, booster, retour au vent).

### Musique et mixage séparé
Deux compositions originales dans `music.js` : thème modal de vol à 124 BPM
(flûte, cordes pincées, tambour) et thème de boutique à 76 BPM (arpèges et flûte
discrète). Boucles de 16 mesures mises en cache, transition progressive entre
les scènes ; musique atténuée en pause et arrêtée en arrière-plan.
Le bouton « Réglages audio » ouvre deux curseurs 0–100 %, Musique et Effets sonores.
Chaque bus peut être coupé indépendamment ; le bouton ♪ reste la sourdine générale.
Les volumes sont enregistrés sous `go-godefroy-go.audio`, indépendamment des parties.
Les touches des curseurs ne pilotent pas le chevalier. Tests : indépendance des
bus, choix du thème, absence de boucles dupliquées et arrêt en arrière-plan.
Sauvegarde des curseurs après rechargement également vérifiée dans le navigateur.

### Approche des remparts et fanfare
À moins de 1 200 m du prochain rempart, une piste de tambours et cuivres monte
progressivement (courbe douce), puis reste intense dans le mur. Elle partage le
même tempo, la même durée et le même démarrage que le thème de vol. Après la sortie,
la cible devient le rempart suivant et la tension retombe. Le passage effectif de
tableau déclenche une fanfare originale de 3,4 s avec roulement et accord final ;
le thème de fond s’efface temporairement. La fanfare ne se déclenche ni à l’impact,
ni deux fois pour le même passage. Le suivi est réinitialisé à chaque vol.
Ces couches passent toutes par le bus Musique et respectent sa sourdine et son volume.
Tests : proximité, pause/fin de vol, synchronisation, déclenchement unique et nouveau
vol. Passage au tableau 2 vérifié en navigateur sans erreur. Démonstration :
`apercu-approche-fanfare.wav` (montée de tension, puis fanfare).

### Grande pente par défaut
Rampe de 960 unités de largeur au lieu de 352, sommet à 340 unités au-dessus
du sol au lieu de 151. Glissade de 800 unités (environ 1,9 s au premier niveau),
avec accélération, supports plus hauts et tremplin continu à 35°. La caméra
suit le ventre sur la descente puis garde le même ancrage au décollage.
L’altitude initiale du vol vient du nouveau tremplin. HUD de glissade synchronisé
avec la position et l’élan. Tests : contact, continuité, départ et premier mur
toujours hors de portée du premier équipement.

### Élan transmis par la grande pente
Le dénivelé utile ajoute une énergie gravitationnelle au lancement (gravité arcade
×3). Le niveau initial passe de 120 à environ 166,4 m/s, soit 599 km/h à la sortie.
Une table temporelle commune au rendu, à la caméra et au HUD suit la vitesse le
long de la pente : départ lent, forte accélération en descente, légère perte dans
le tremplin, puis conservation de la vitesse au décollage. Les caractéristiques
à la forge utilisent la même formule. La masse ne donne pas une accélération
artificiellement proportionnelle au poids ; son ressenti vient de l’élan conservé,
des traces de glissade et de l’impulsion visuelle au départ. Vol standard de niveau 0
avec propulsion : environ 5,3 km, avant le rempart de 6 km. Vérifications : contact,
continuité de vitesse pour plusieurs niveaux et portée accrue.

### Collection et économie de ressources

La progression de lancement comporte 25 objets définis dans `launch-gear.js`. Les niveaux du catalogue sont stockés de 0 à 24, affichés de 1 à 25. `levels` désigne les objets équipés, `owned` le plus haut achat par catégorie. Rééquiper un ancien objet ne coûte rien et ne réduit pas les achats débloqués. Les sauvegardes v1 sont migrées une seule fois vers v2 (savon → niveau 6, skateboard → niveau 9).

Les objets debout possèdent une animation articulée d’équilibre, flexion des genoux, impulsion et passage en Superman ; le saut démarre avant le bout de la rampe.

La perte de focus, le masquage de l’onglet et la minimisation suspendent le rendu et l’AudioContext. Le retour ne rattrape pas le temps écoulé ; un vol reste en pause jusqu’à sa reprise volontaire. Les animations CSS sont aussi suspendues.

Vérification : `node go-godefroy-go/test.cjs`, `node go-godefroy-go/sound-test.cjs`, `node go-godefroy-go/catalog-test.cjs` depuis le dossier parent.

La forge utilise maintenant cinq onglets de catégories, un aperçu central comparant les statistiques à l’équipement porté et un carrousel horizontal de toutes les évolutions. Les flèches parcourent les objets ; les achats suivent la progression et les objets possédés se rééquipent gratuitement.

Animation debout : six poses bitmap issues de l’illustration originale dans `assets/godefroy-poses.png` remplacent le personnage articulé vectoriel. Le prompt du générateur intégré est conservé dans `assets/PROMPT-godefroy-poses.txt`.

Objets de lancement illustrés : `assets/launch-illustrations.png` contient les 25 illustrations raster partagées par le carrousel et le rendu en jeu. Les limites alpha sont mesurées une seule fois au chargement. Les patins se fixent séparément sur les semelles des six poses et restent portés après le saut. Le prompt du générateur intégré est dans `assets/PROMPT-launch-illustrations.txt`. `equipment-preview.html` permet de contrôler les proportions sans boucle de jeu ni audio.

Le bouclier en bois usé utilise désormais `assets/godefroy-shield-poses.png` : six poses intégrées du chevalier et du bouclier, basées sur la composition approuvée par l’utilisateur. La boucle d’équilibre précède une flexion et une impulsion, puis rejoint les poses de vol existantes. L’illustration complète remplace les deux éléments séparés pendant la glissade. Prompt : `assets/PROMPT-shield-rider.txt` (image_gen intégré).

Frottement du bouclier : poussière, éclats de bois et étincelles sont émis au contact de la rampe, en fonction de la vitesse. La liste est limitée à 100 particules et cesse d’émettre au décollage ; pause et mouvement réduit sont respectés. Les objets debout parcourent désormais toute la rampe avant de recevoir une impulsion verticale de 10 m/s. La préparation du saut se déroule en fin de pente, sans déplacement vertical artificiel pendant la descente.

La pancarte de forge porte son titre et sa description ; l’or reste dans la barre supérieure. L’aperçu animé montre l’objet de lancement équipé, avec poses debout ou ventrales selon sa famille, et utilise l’horloge du jeu suspendue en arrière-plan.


### Atelier de test et aperçu (3 novembre)
Le menu « ATELIER DE TEST · 25 OBJETS » et « TESTER CET OBJET » à la forge ouvrent une session temporaire. Tous les objets de lancement sont disponibles dans la liste en bas. Recommencer, retourner à la forge ou quitter le test ne dépense aucun écu et ne sauvegarde aucun gain, achat ou dégât de mur. La sélection du carrousel affiche immédiatement l’objet sur Godefroy à gauche, même avant achat.

Contrôle supplémentaire : `node atelier-test.cjs` depuis ce dossier.


### Illustrations intégrées — 25 objets
Six atlas transparents `assets/riders-*-v2.png` générés avec l’outil imagegen intégré. Chaque ligne contient trois poses du chevalier sur son objet et une illustration de l’objet seul. Le bouclier initial conserve ses poses approuvées ; son objet lâché reprend désormais la sangle et la même finition. La forge et la rampe partagent les images ; le décollage réutilise le même objet, à la même échelle.
Les prompts complets et références sont dans `assets/PROMPTS-riders-v2.json`. `riders.js` contient les coordonnées des cellules précalculées, sans lecture de pixels dans le navigateur (compatible avec ouverture locale). Le lancement attend le chargement des atlas. Vérification : `node riders-test.cjs`.

### Lot du 4 novembre 2026 — son, forge, château, nuages et sorts
Audio : musique dès l’écran titre (`in-game-1`, démarrée au premier clic ou touche, exigence des navigateurs) ; tous les boutons jouent uniquement « app click » ; le jingle du bilan s’estompe en 0,45 s quand on clique « À la forge » ou « Encore un essai » (`soundEngine.fade('results')`).
Forge : le texte « Aperçu · … » sous le héros est retiré ; les poses sur poêle, poêle culottée et plateau utilisent les illustrations intégrées des atlas (pieds vraiment dans la poêle) et s’animent dans la boutique (l’horloge de la forge est maintenant utilisée, et les index de poses tolèrent une horloge négative). Onglet Magie : sorcière animée sur canvas (louche qui tourne, liquide vert fluo, bulles qui éclatent, vapeur), bombes illustrées avec mèche, onglet de famille unique supprimé, quatre boosters redessinés (amphore, fusée-tonneau naine, bonbonne de tempête, bonbonnes jumelles) et SVG régénérés dans `assets/equipment/boost-*.svg` par `GGEquipment.svg`. Le booster est sanglé sur le dos du chevalier ; la flamme (`boostFlameArt`) s’allonge, s’élargit, gagne des étincelles et devient bleue à partir de l’Essence de Tempête ; la fumée augmente avec le niveau.
Prix : lancement `300 × 1,26^n`, aérien `400 × 1,15^n + 150 n` (chaque objet doit se mériter). Altitude : 0,08 écu/m jusqu’à 1 000 m puis 0,012 écu/m (30 000 m ≈ 430 écus au lieu de 3 600).
Monde : château du tableau 1 redessiné à pleine échelle avec contours fins (tours rondes, toits coniques, fanions animés, herse, lanternes, blason, lierre) ; détruit, il se brise en deux moitiés avec débris puis laisse des ruines (`castleBreakArt`, `castleRubbleArt`). Boîte de collision rectangulaire pour tours et château (casque à 6 m devant) : on s’arrête contre la façade, plus à 100 px devant. Fissure dessinée (crevasse sombre, bord éclairé, éclats) au lieu d’une ligne noire. Le gobelin de la tour gigote, vise avec un arc quand Godefroy arrive à moins de 650 m et tire une grosse flèche toutes les 2,6 s (parade avec X au bon moment, sinon −38 % de vitesse). Ballons, ballon rouge et montgolfière ondulent par tranches comme la cape (`swayingSprite`).
Altitudes : objets de la vallée jusqu’à ~2 500 m, monde des nuages de 2 500 à 7 000 m (ciel pastel, plancher de cumulus, tours de guet sur nuages dans `GGCourse.cloudTowers`, qui arrêtent ou se brisent comme au sol, avec archer), espace à partir de ~6 800 m avec étoiles filantes seulement. Trois nuages rebondissants : blanc (POUF), gros nuage de pluie (kind 10) et deux nuages reliés par un arc-en-ciel (kind 11), chacun avec animation POUF (bouffées, gouttes ou étincelles, texte) et un surcroît de vitesse.
Coffres des remparts : portée élargie (12 × 80 m, ×1,6 à l’arrêt dans la brèche) et animation d’ouverture (couvercle, pièces, éclat). Bombes : vraie explosion (flash, boule de feu, fumée, 44 briques qui volent et rebondissent au sol, BOUM). Skateboards : roues rotatives (pierre, acier, or, rouge) superposées aux illustrations. Premier franchissement d’un tableau : chorale de cinq chanteuses en robe pendant ~10 s avec la fanfare.
Sorts (`GG.spells`) vendus par la sorcière : « Sablier du temps » (650 écus) ralentit le monde ×2 pendant ~3 s réelles, Godefroy garde une maniabilité ×1,9 ; coût 30 % de l’essence magique, recharge 5 s ; touches 1–4 configurables dans la boutique, barre de sorts en bas de l’écran (icônes parchemin, recharge, manque d’essence), voile bleu et sabliers pendant l’effet. Don passif « Œil de faucon » (900/2 400/5 200 écus, 3 degrés) : la caméra recule en vol (facteur 0,88/0,76/0,64), affiché chez la sorcière sans emplacement. Missions : à partir du palier 5, « Garder X km/h sous Y m pendant Z s » (vol rapide près du sol).
Sauvegardes : `spells {owned, slots}` et `passives {hawkEye}` ajoutés et assainis. Tests mis à jour : `sound-test` (piste titre), `specials-test` (bandes d’altitude, kinds 10/11), `test.cjs` (barème d’altitude), `atelier-test` (bac à sable avec `GG`). Vérification navigateur par captures headless (`setBackground(false)` nécessaire sans focus).

## Lot « enfants » du 4 novembre 2026 — filets de pêche, sorcière, missions, déblocages

- **Touche X supprimée.** Tous les rebonds sur les monstres sont parfaits, sans texte « PARFAIT ». Le coup de bélier n'existe plus. Les flèches des tours font « CLANG » sur l'armure (vitesse ×0,8), plus de parade chronométrée.
- **Bandes d'aide retirées** en bas de l'écran (aide des touches en vol et sous la rampe).
- **Barre de sorts** : contenu des cases centré verticalement.
- **Canon et bombe en volume** : fût cylindrique dégradé, bouche ouverte, anneaux, roues avec moyeu et roues arrière pour la profondeur.
- **Canons pêcheurs.** Les canons au sol (objet 9) ne propulsent plus : quand Godefroy vole **entre 1 000 et 3 000 m** et passe devant, le fût le suit et tire toutes les 4,2 s un **filet de pêche** (balle de corde qui se déploie en ~3× la taille du chevalier, plombs sur le pourtour). Touché : `f.netted`, plus de portance ni de commande, chute immédiate (~2,5 s depuis 2 000 m), fin de vol « net ». Sauter sur un canon (contact) le fait **exploser** (débris bois/fer) et le brise pour le reste du vol, avec une petite impulsion. Mission « Briser X canons ».
- **Biome des nuages 3× plus haut** : nuages de 7 560 m à 21 000 m (`CLOUD_ROW=18`, `SPACE_ROW=50`), tours sur nuages entre 9 000 et 16 500 m, espace et étoiles filantes au-dessus de 20 500 m, nouvelle couche de cumulus vers 9 600–13 500 m.
- **Sorcière redessinée** sur son canevas : nuit, lune, chat noir, chapeau rapiécé qui oscille, clignement des yeux, bras qui touille, chaudron sur ses pattes au-dessus du feu.
- **Missions rigolotes** : icône par type (🗺️ 🦘 ⚡ 💰 🔥 🎈 🪂 💣 🎁 🧱 ⏱️ 🛩️), cartes avec barre de progression, « BRAVO ! ✓ » animé.
- **Déblocage d'une famille d'objets** (La glisse / Dans les airs) : grande carte « NOUVEAUTÉ À LA FORGE ! » avec confettis, visible 6 s ou jusqu'au clic (`announceUnlocks`).

## Lot « sorcière » du 4 novembre 2026 — cabane, onglet Magie à débloquer, forge sur un écran

- **Cabane de la sorcière** (`GGCourse.witchHut`, x = 1 500 m, altitude 1 000 m, 22 m × 400 m de zone de contact) dessinée avec `assets/witch-hut.png` sur un nuage. Un simple contact, même lent, la fait voler en éclats (`f.witchFound`, événement `witch`). Le jeu se met en pause et affiche la sorcière en grand (`#witch-intro`, `showWitchIntro`). `save.witchFound` est enregistré tout de suite.
- **Onglet Magie verrouillé** (cadenas) tant que la cabane n'est pas détruite. Atelier de test : toujours ouvert.
- **Sorcière** : planche `assets/witch-sheet.png` (12 poses, 4 × 3) animée en CSS (`.witch-sprite`), affichée en grand en bas à gauche de la forge dans l'onglet Magie. L'ancien canevas dessiné n'est plus utilisé.
- Les deux images ont été détourées avec `chroma.cjs` (Chrome headless, remplissage depuis les bords) à partir des JPEG fournis.
- **Forge sur un écran** : les améliorations sont des cartes à un seul bouton (7 par rangée, achat direct), sans panneau de détail. Onglets d'équipement compactés, bande d'évolution masquée, Godefroy ancré en bas. Défilement de secours seulement si la fenêtre est très basse.
- **Cadrans de vol** (vitesse + altitude en bas à droite) : achat unique de 350 écus dans Améliorations, bouton ⏱ sous la pause pour les montrer ou les cacher (`save.instrumentsShown`). Quand ils sont affichés, le bandeau du haut ne garde que distance et essence.
- **Filet** : maillage en losanges clair cerclé de blanc, plus grand (rayon 120 px), vol de 2,4 s au lieu de 1,35 s, visée moins précise, message « UN FILET ! ÉVITE-LE ! ».
- **Goéland** : zone d'accroche élargie à la taille de l'image (±11 m, ±120 m d'altitude), durée de portage réduite de 2 s.
- **Coffres du rempart** : l'animation utilisait l'horloge du vol, figée à l'arrêt dans le mur. Elle suit maintenant le temps d'atterrissage. Portée élargie à l'arrêt.
- **Murs moins solides** : coût par pierre 2 500 → 140, vitesse minimale de casse 126 → 86 km/h. Mur 1 traversé à 200 km/h avec Force 3/10 ou plus ; Force 0 demande plusieurs passages.

### Départ sans booster (suite du lot « sorcière »)

- Une nouvelle partie n'a **aucun booster** : réservoir à 0 (`create()` teste `save.witchFound`), pas de booster dessiné, pas de jauge d'essence ni de bouton FEU (`body.no-boost`), fioles d'essence invisibles, mission « Activer le booster » sautée, cartes « Plein gaz ! » et « Le plein, svp ! » masquées.
- Détruire la cabane offre le **premier booster**, plein et utilisable tout de suite dans le même vol.
- L'onglet **Magie n'existe pas** dans la forge tant que la sorcière n'est pas trouvée (plus de cadenas).
- Migration : une sauvegarde qui possède déjà un booster acheté, un sort ou une bombe est considérée comme ayant trouvé la sorcière.
- **Aperçu du héros** : dans « Dans les airs », l'équipement est dessiné à l'échelle du vol ×1,7, comme dans « La glisse ». Le canevas s'agrandit autour des grandes ailes avec des marges négatives, sans déplacer la mise en page (`GGWingArt.bounds`).
- **Bourse** en haut à droite : trois pièces d'or puis le nombre, sans le mot « écus ».
- **Navigation entre objets** : deux grosses flèches rouges (`.gear-arrow`, `data-step`) de chaque côté du panneau d'équipement, centrées verticalement, dans La glisse, Dans les airs et Magie. Elles remplacent la bande d'évolution, qui reste masquée.

### Tunnel du château, super saut et poêle au gras

- **Tunnel sous le château** (`GGCourse.castleTunnel`, `tunnelProfile`) : entrée à 455 m, sortie à 545 m, 150 m sous terre. Un chevalier qui arrive sous le linteau (moins de 105 m d'altitude) ou qui touche le sol dans les 32 m avant l'entrée glisse dedans (`f.tunnel`, `enterTunnel`, `tunnelStep`), passe sous les murs et ressort avec un petit bond. Vue en coupe avec étais, torches et portails de pierre (`tunnelArt`). La caméra descend pendant la traversée. Au-dessus du linteau, le château arrête toujours le vol.
- **Super saut** (amélioration `jump`, 10 niveaux) : chaque niveau ajoute 1,6 m/s de vitesse verticale au bout de la rampe.
- **Poêle culottée au gras** (objet 3) : graisse dorée qui déborde du rebord avant, gouttes qui tombent, petites éclaboussures (`panGreaseArt`), et gouttelettes de graisse sur la rampe.
- Flèches de la forge : centrage sans `transform`, donc plus de saut vertical au survol. Héros de la forge remonté juste sous l'enseigne.

## Combo, saut manuel, pet de Godefroy et tunnel en vol libre

- **Combo de destructions** : chaque monstre écrasé, tour brisée, canon explosé, cabane de sorcière ou rempart franchi paie plus que le précédent (10, 15, 25, 35… soit `GGMonsters.comboGold(n)`). Un « COMBO ×n » suit le chevalier, une pastille s'ajoute à l'or récolté, et le bilan reçoit une ligne dédiée. Les slimes et les ballons ne comptent pas.
- **Bilan du vol** : la liste des gains défile dans une boîte à hauteur fixe (`.earnings-scroll`), l'en-tête reste collé, le total reste visible et la ligne en cours de comptage est gardée à l'écran. Les lignes à 0 écu ne sont plus affichées.
- **Saut manuel** : il faut appuyer sur ESPACE (ou toucher l'écran) au bout de la rampe. `GG.create(save, angle, true)` ne donne plus d'élan vertical ; `GG.jump(flight, qualité)` l'ajoute. Parfait dans les 0,16 s avant le bout, plus faible si trop tôt, encore possible 0,3 s après le bout, et aucun élan sans appui. Une barre de timing (`#jump-bar`) guide le joueur. L'amélioration « Super saut » renforce chaque saut.
- **Pet de Godefroy** : avant la sorcière, le boost est un pet (`flight.fartMode`). Trois réserves de gaz, une poussée vers l'avant et surtout vers le haut par appui (assez pour soulever la première armure d'environ deux hauteurs de chevalier), et le ventre se recharge lentement (`GG.FART`). La jauge s'appelle « GAZ ». La cabane de la sorcière remplace le pet par le premier vrai booster.
- **Tunnel du château** : plus large (400 m de haut, de 350 m à 650 m), avec une tranchée ouverte à chaque bout. On y vole soi-même : un courant d'air porte le chevalier le long de la galerie et donne une légère poussée plafonnée, les flèches montent et descendent, et frotter le sol ou le plafond ralentit. Une vitesse minimale garantit la sortie. Tomber dans une tranchée mène aussi au tunnel. Le tunnel est dessiné dès qu'il entre dans l'écran, avec des traînées de vent.
- **Goéland** : foncer dans une tour ou un château avec le goéland dans les mains donne le même bonus spécial que dans un rempart.
- **Flèches rouges de la forge** : états de survol et de clic nets, sans déplacement.

## Filet visible à toute vitesse et saut divin

- **Filet des canons** : le filet monte d'abord très vite du canon jusqu'à un point fixe devant et sous le chevalier (`NET_AHEAD`, `NET_BELOW`), annoncé par une flèche « ⚠ FILET ! » au bord de l'écran. Il s'ouvre ensuite et glisse pendant une durée fixe (`NET_GLIDE`) vers l'endroit où le chevalier sera. L'approche a donc la même allure et laisse le même temps de réaction à toutes les vitesses. Un rond rouge pointillé marque la cible. Monter ou piquer suffit pour l'éviter.
- **Saut divin** : une fine ligne dorée dans la zone verte de la barre de saut. La toucher donne un saut plus fort que le saut parfait (`GG.JUMP_GOD`), avec le message « SAUT DIVIN ! DIGNE D'UN DIEU ! ».

## Sorcière redécoupée, filet de corde, grosse cabane et barre de saut

- **Sorcière** : `assets/witch-sheet.png` est régénérée depuis l'image d'origine. Le liseré blanc et les poches blanches sous les bras sont retirés, et les 12 images sont recalées sur le bord du chaudron (la troisième rangée était 32 px trop haute, d'où le saut). La bulle de rencontre est raccourcie : le booster offert est dessiné, et elle dit seulement « Viens me voir dans la forge, j'y serai ! ».
- **Filet** : pendant sa glissade, le filet utilise `assets/net-open.png`, un filet de corde vu de côté, l'ouverture vers le chevalier. La zone de capture suit l'image, haute et étroite.
- **Cabane de la sorcière** : environ trois fois plus grosse (`GGCourse.witchHut.size`), posée sur un banc de nuages, avec une zone de contact agrandie de 450 m à 1 450 m d'altitude et plusieurs explosions quand elle éclate.
- **Barre de saut** : un appui beaucoup trop tôt, avant la zone rayée, ne compte plus comme un saut. La barre affiche « TROP TÔT ! ATTENDS… » et on peut encore sauter. Le pion ne s'arrête plus : un trait marque l'endroit de l'appui.

## Chorale sans musique, rampe bien visible, filets à éviter, boosters ×5, trésors doublés et bombes volantes

- **Chorale d’un nouveau tableau** : pendant que la chorale chante, la musique principale s’efface en douceur, reste muette, puis revient à la fin du chant (`holdMusic` et `hushLevel` dans `sound.js`). Une pause ou un nouveau vol libère la musique tout de suite.
- **Rampe** : chaque niveau ajoute 110 unités de hauteur et 170 de longueur (au lieu de 55 et 80). La longueur allonge la descente (60 %) et le plat de sortie (40 %) ; la hauteur repousse un peu le pied pour ne jamais devenir une falaise. La vitesse de décollage garde son ancien barème par niveau (`SPEED_STEP` dans `course.js`). Sur l’aire de départ, la caméra reste proche du chevalier (zoom 100 %), comme avant.
- **Mission « Éviter N filets »** : un filet qui a fini son approche sans rien attraper est compté (`netsDodged`) et ne peut plus attraper. Les missions sont ajoutées à la fin de la liste pour ne pas décaler les identifiants des sauvegardes ; `missionOrder` les fait apparaître à partir du palier 5.
- **Boosters** : prix multipliés par 5 (base 900 au lieu de 180).
- **Trésors doublés** : achat unique de 1 500 écus dans l’onglet Améliorations. Pièces, bourses et coffres des remparts valent le double (`treasureFactor`). L’or des ennemis ne change pas.
- **Bombes volantes** : champ indépendant et très rare (`BOMB` dans `specials.js`). En attraper une donne une grosse poussée vers l’avant (jusqu’à 125 % de la vitesse maximale), un coup de hauteur moyen, un combo et un gros « KABOOOOM !!! » (`airBombArt`, `kaboomArt`).

## Vol long sans coupure et nouveau dragon

- **Fin de vol** : l'ancienne limite fixe de 300 secondes simulées coupait les longs vols en plein ciel, vers 38 km pour un chevalier rapide. Elle est remplacée par un garde-fou : le vol ne s'arrête que si le chevalier n'a pas avancé de 150 m en deux minutes simulées (`progressX`, `progressAt` dans `physics.js`).
- **Dragon** : `dragon()` dans `game.js` est redessiné (ailes qui battent, tête à cornes, ventre crème, flamme qui vacille). Il sert au décor du territoire du Dragon, où il est plus gros et dérive lentement, et aux deux dragons des objectifs à 30 km et 100 km.

## Boss dragon, portail, monde magique, Grand Sorcier, montée difficile et filets lisibles

- **Dragon (44 km)** : il remplace le rempart des 45 km (`stages[5].boss`). À 170 m, il se met à voler juste devant le chevalier et se laisse rattraper à la moitié de sa vitesse : le combat a la même allure à toute vitesse, joué au ralenti pour un chevalier très rapide (`duelSlow`), caméra reculée. Chaque coup à 144 km/h ou plus lui retire un des trois cœurs affichés au-dessus de sa tête et le repousse de 110 m. Trop lent : il ne bronche pas. Les cœurs perdus sont sauvegardés (`dragonHearts`).
- **Portail** : au dernier cœur, le dragon tombe, un portail s'ouvre 200 m plus loin et le chevalier y vole tout seul, doucement (`cruise`). Il ressort au début du monde magique avec sa vitesse d'avant le combat. Une fois le dragon battu (`dragonDefeated`), le portail reste ouvert à tous les vols.
- **Monde magique (45 à 100 km)** : nouveau décor (`magicBackdropArt`), plafond à 3 200 m, murs de briques bleutées, tours magiques plus hautes, arbres flottants cassables qui coûtent 45 % de la vitesse, fées qui donnent 10 secondes d'armure magique (boost constant, sorts déviés, arbres traversés), sorciers au sol qui lancent des sorts, hommes-oiseaux qui lancent des lances, enclumes qui tombent. Règles dans `magic.js`, dessins dans `magic-art.js`.
- **Tirs** : comme les filets, chaque tir est annoncé, puis une zone rouge clignotante montre où il va tomber. Elle suit lentement le chevalier, puis se fige à la fin : un vrai changement de trajectoire l'esquive, ne rien faire non.
- **Grand Sorcier (99,5 km)** : un géant sur son bâton magique, même approche que le dragon. Il suffit de le toucher une fois : explosions, écran de fin avec feux d'artifice (`showEnding`), puis le bilan. Cette victoire ne dépend plus des serments d'altitude.
- **Montée** : libre près du sol, de plus en plus coûteuse en altitude (`CLIMB` dans `physics.js`). À fond, la première armure plafonne vers 950 m, le milieu de partie vers 2 600 m, le meilleur équipement vers 7 000 m. Un objet bonus qui projette vers le haut garde tout son élan pendant un instant (`kickUntil`).
- **Filets** : approche plus longue (3,6 s simulées au lieu de 2,3) et zone rouge clignotante « DANGER » épinglée au bord droit de l'écran tant que l'endroit réel est hors champ.

## Interface mobile : en-tête, menu, missions, cadran et forge compacte

- **En-tête** : hors vol, il ne reste que MENU, le jour et la bourse. MENU ouvre une superposition (`#menu-panel`) : son et musique, comment jouer, plein écran, retour à l'accueil. En vol : la note (qui ouvre le mixage, où se trouve maintenant l'interrupteur du son) et le point d'interrogation. Plus de bouton plein écran dans l'en-tête.
- **En vol** : l'indicateur « Assiette » est retiré. Pause, cadrans et missions sont dans une colonne (`#flight-buttons`). Sur téléphone (`phone-ui` : 700 px de large ou moins, ou 520 px de haut ou moins), la liste des missions est cachée derrière le bouton ⭐.
- **Tablette et téléphone** (`touch-ui` : pointeur tactile ou 900 px de large ou moins) : la bande du bas appartient aux trois boutons de commande. La bourse, les sorts et le cadran sont rangés juste au-dessus et ne passent jamais dessus ni dessous.
- **Forge sur téléphone** : plus de bandeau « L'Échoppe de l'Enclume » ni de grand aperçu, quatre onglets sur une ligne. Les améliorations s'affichent une carte à la fois avec deux grosses flèches (`kid-carousel`, `upgradeIndex`). La glisse et les airs sont compactés ; la boutique de la sorcière passe en une colonne, y compris sur tablette en portrait.
