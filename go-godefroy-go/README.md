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
