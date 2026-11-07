# Duel de Sorciers

Duel de baguettes magiques à la première personne. On trace les sorts dans les airs, on pare ceux de l'adversaire.
Aucune installation : ouvrir `index.html` dans un navigateur.

## Comment jouer

- **Espace maintenu + souris** : la baguette laisse une traînée d'étincelles bleues. Relâcher Espace lance le sort tracé.
- **Clic** sur le sort ennemi quand l'anneau devient doré : bouclier. Cliquer au tout dernier instant renvoie le sort.
  Avec le talent Garde, garder le clic enfoncé fait tenir le bouclier un peu plus longtemps.
- **Ceinture** (en bas à gauche) : on ne peut lancer que les sorts qui s'y trouvent — 3 cases au départ, une de plus par point du talent Ceinture.
  **B** ou le bouton 📖 ouvre le tiroir de tous les sorts connus : on en glisse un sur la case voulue, même en plein duel (le combat continue).
- **G** (maintenu) : coup d'œil aux formes des sorts de la ceinture pendant le duel. **Échap** : pause.
- **Barres de vie et d'énergie** : tout en haut, sur toute la largeur, comme dans un jeu de combat. Ce qui reste de vie est du côté du centre ;
  la vie qu'on vient de perdre reste un instant en jaune clair. Notre barre jaunit sous la moitié, rougit et clignote sous le quart.
- **M** : couper ou remettre tout le son. Le bouton 🔊 (en bas à droite) et le menu Pause règlent le volume de la musique et celui des sons.
- **Rayons** (Radius, Infernus) : après le tracé, le rayon sort de la baguette quelques secondes ; on le promène sur l'adversaire, dont le
  petit bouclier court après. Quand c'est lui qui nous vise, il faut garder le clic enfoncé (ou le marteler) et suivre son rayon avec la baguette.
- **Désarmo** : la baguette part en l'air dans une direction au hasard. On la rattrape en passant la main dessus pendant qu'elle retombe ;
  sinon, il faut la ramasser par terre (garder la main dessus 0,7 s).
- Au doigt (tablette) : glisser pour tracer, tapoter pour parer.

**Début d'un duel** : plus d'échauffement. L'adversaire nous lance une pique dans une bulle, selon son âge (`DS.TAUNTS` dans data.js : enfants, ados, adultes ;
`DS.QUIPS` : la réplique fétiche de chaque rival adulte), avec le gros bouton dessous. On clique « Commencer le duel » (ou Entrée) : **Yum… Kaï…** (deux mots d'une langue magique ancienne qui veulent dire « 5… 4… » ; les
duellistes les gardent pour marquer l'avant-duel des protections, `WORDS` dans duel.js), puis **3… 2… 1…** — dès le 3, et pendant ces trois secondes
(`WARD_T`), chacun ne peut lancer que des protections et des renforts (pas Conjura : l'animal attaquerait). Ensuite **GO !** : tout est permis.
Sous Silencio, notre tracé devient rouge : les attaques ne partiront pas (les protections et les maléfices, eux, partent toujours).

**L'adversaire** a lui aussi une barre d'énergie, sous sa barre de vie. Il attaque par enchaînements (`foeCombo()`) : parfois une protection ou un
maléfice pour ouvrir, puis une à quatre étincelles selon son niveau, puis un gros sort. Chaque sort lui coûte son prix en énergie, payé dès qu'il
commence à tracer (l'interrompre la lui fait donc perdre). À sec, il est « à bout d'énergie » : il ne lance plus rien et pare mal jusqu'à ce que sa
barre remonte à 85 % — c'est le moment de répliquer. Réglages par niveau dans `start()` : `ai.mana`, `ai.gap` (écart entre deux sorts), `ai.rest`.

**Attaque**

| Sort | Forme | Effet | Énergie | Prix |
| --- | --- | --- | --- | --- |
| ✨ Scintilla | un trait | Petite, rapide, pas chère. (8 dégâts) | 8 | départ |
| 💠 Fulgur | un Z | Un éclat d’énergie si rapide qu’il est dur à parer. (16 dégâts) | 18 | départ |
| 🔥 Ignis | un triangle | Lente mais brûlante. (22 dégâts, brûlure 3 s) | 28 | départ |
| 🏹 Sagitta | une flèche vers le haut | Très rapide, dégâts modérés. (11 dégâts) | 14 | 80 |
| 🪨 Terra | un carré | Lourd et rapide. Démolit les murs : chaque cube de terre compte pour 4 coups. (14 dégâts) | 15 | 90 |
| ⚡ Tonnero | un U carré | La foudre frappe, puis saute sur tout ce qui est collé à la cible : les copies n’y résistent pas. (15 dégâts) | 20 | 120 |
| 🌙 Vespera | un C | La moitié des dégâts traverse les boucliers. (15 dégâts) | 20 | 130 |
| ☠️ Toxicus | un 8 couché | Empoisonne : la vie fond petit à petit. (4 dégâts, poison 6 s) | 22 | 140 |
| 💢 Tremor | un M | D’abord, rien. Puis la cible tremble de plus en plus et perd de la vie 3 fois. Une protection lancée à temps l’annule. (3 × 6 dégâts) | 18 | 150 |
| 🌪️ Tornado | un S | Blesse, interrompt le sort en cours et chasse la brume. (16 dégâts) | 26 | 160 |
| 🔴 Radius | un Σ | Un rayon sort de ta baguette pendant 3,5 s : promène-le sur l’adversaire, là où son bouclier n’est pas. (7 × 4 dégâts) | 30 | 220 |
| 🐉 Infernus | une étoile | Tu craches un torrent de feu que tu diriges. Énorme, et ça brûle encore après. (8 × 5 dégâts, brûlure 3 s) | 40 | 400 |
| 🌩️ Foudrus | un éclair | Rien pendant 2 secondes… puis un éclair tombe du ciel. Il se pare : l’anneau apparaît toujours en haut. (24 dégâts, après 2 s) | 24 | 240 |
| 🌋 Flammurus | trois flammes | Un mur de flammes balaie la salle. Le bouclier ne l’arrête pas : seul un sort de protection le peut. Il brûle toutes les copies d’un coup. (20 dégâts, brûlure 3 s) | 34 | 360 |
| 🌊 Vortex | un trèfle à trois feuilles | Long à tracer, mais il fonce. Un immense tourbillon enferme la cible : elle perd de la vie à chaque seconde et voit tout comme sous l’eau. (8 dégâts, 5 dégâts par seconde pendant 5 s) | 38 | 420 |

**Protection**

| Sort | Forme | Effet | Énergie | Prix |
| --- | --- | --- | --- | --- |
| 🛡️ Aegis | un toit | Absorbe le prochain sort qui te touche. (dure 10 s) | 24 | 80 |
| ☀️ Calor | un V barré | Les sorts de glace ne te font plus rien. (dure 15 s) | 12 | 50 |
| ✊ Tenax | un cercle barré | Désarmo ne t’arrache plus ta baguette. (dure 15 s) | 12 | 50 |
| 🌀 Absorbo | un > | Avale la prochaine attaque et change tous ses dégâts en énergie. (dure 12 s) | 14 | 120 |
| 🌫️ Vapor | une boucle | Un sort sur deux te passe à côté. Le vent (Tornado) chasse la brume. (dure 12 s) | 20 | 150 |
| 👥 Copius | un 3 | Tu te dédoubles en trois. Un seul est le vrai : les sorts des copies ne font rien. (dure 15 s) | 26 | 240 |
| 🫧 Puritas | trois boucles | Efface d’un coup tous tes maléfices, brûlure et poison compris. | 30 | 260 |
| 🧘 Stabilis | un H | Les 2 prochains sorts qui t’atteignent (touché ou paré) ne peuvent pas interrompre ton tracé ni ton rayon. (2 sorts) | 12 | 150 |

**Renfort**

| Sort | Forme | Effet | Énergie | Prix |
| --- | --- | --- | --- | --- |
| 💚 Cura | un cœur | Rend un peu de vie. (+15 vie) | 14 | 70 |
| 🧪 Antidotum | une racine √ | Chasse le poison et t’en protège un moment. (dure 10 s) | 10 | 60 |
| ⭕ Magnus | un cercle à queue | Le cercle de ton bouclier grossit : parer devient plus facile. (dure 15 s) | 14 | 110 |
| ⏫ Amplio | un escalier | Tes 3 prochaines attaques frappent 50 % plus fort. (3 attaques) | 18 | 130 |
| 💖 Sana | un battement de cœur | Rend beaucoup de vie. (+40 vie) | 32 | 200 |
| 💪 Fortis | un P | Tes attaques frappent 2 fois plus fort. (dure 8 s) | 26 | 220 |
| 🪞 Speculum | une arche | Le prochain sort qui te touche repart tout seul vers l’envoyeur. (dure 12 s) | 26 | 240 |
| 🌿 Vigor | deux Z empilés | Ta vie remonte toute seule, seconde après seconde. (+32 vie en 8 s) | 34 | 280 |
| 🏰 Bastion | une couronne | Les attaques te font 2 fois moins mal. (dure 10 s) | 34 | 320 |
| 🔮 Preparus | un T | Ta prochaine attaque ne part pas : elle flotte à côté de toi. Clique dessus pour la lancer quand tu veux… avant qu’elle s’éteigne. | 6 | 200 |
| 🎩 Conjura | un chapeau | Puis trace vite ton animal : un V pour le hibou 🦉, un W pour le dragonnet 🐲, un rond pour le crapaud 🐸. Il attaque à tes côtés pendant 7 secondes. | 30 | 320 |

**Effet**

| Sort | Forme | Effet | Énergie | Prix |
| --- | --- | --- | --- | --- |
| ❄️ Glacius | un V | Enferme la cible dans un cube de glace : 2 secondes sans rien pouvoir faire. (10 dégâts, effet 2 s) | 18 | départ |
| 🪄 Désarmo | un cercle | Fait voler la baguette adverse : il faut la rattraper pendant qu’elle retombe. (5 dégâts, effet 3 s) | 22 | départ |
| 🐌 Lentus | un L | L’adversaire bouge au ralenti. (dure 6 s) | 16 | 60 |
| 💦 Aqua | un W | En pleine figure : il voit trouble et vise mal. (10 dégâts, effet 5 s) | 20 | 100 |
| 🐇 Vitus | un L à l’envers | Ses gestes partent beaucoup trop vite : bonne chance pour tracer une forme compliquée ! (dure 6 s) | 16 | 110 |
| 🔨 Fractura | un coin | Plus aucun bouclier pendant 5 à 6 secondes. (dure 5,5 s) | 18 | 120 |
| ⚓ Gravitas | une flèche vers le bas | Sa baguette pèse une tonne et descend toute seule. (dure 6 s) | 18 | 130 |
| 🌑 Tenebra | un N | Noir complet : il ne voit plus rien venir. (dure 4 s) | 24 | 140 |
| 🌟 Lumina | un crochet ] | Un éclair blanc : sa vue ne revient que tout doucement. (dure 4,5 s) | 22 | 140 |
| 🧱 Murus | des créneaux | Dresse un mur entre vous deux. Il faut 5 coups d’attaque, de l’un ou de l’autre, pour l’abattre. (5 coups) | 22 | 150 |
| 🧲 Siphon | un J | Vole de l’énergie magique à l’adversaire pour remplir la tienne. (15 d’énergie) | 6 | 150 |
| 🤫 Silencio | un poisson | Il ne peut plus lancer de sorts d’attaque. (dure 6 s) | 20 | 160 |
| 🔄 Inversium | des dents de scie | La gauche devient la droite, le haut devient le bas. (dure 6 s) | 20 | 170 |
| 💤 Somnus | une spirale | Ses paupières tombent, ses gestes ralentissent. (dure 5 s) | 28 | 180 |
| ⏳ Ritardo | un sablier | Pendant 10 s, chaque dégât reçu est noté… puis reçu une seconde fois, d’un seul coup. (pendant 10 s) | 24 | 260 |
| 🤧 Atchoum | un A | Quatre gros éternuements : la tête plonge, la baguette part de travers. (dure 6 s) | 16 | 150 |
| 👓 Myopia | un X | Tout devient flou, comme si on avait perdu ses lunettes. (dure 6 s) | 18 | 170 |

Les maléfices (gelé, désarmé, ralenti, trempé, aveuglé, endormi, ébloui, emballé, alourdi, inversé, silence, sans bouclier) ne se cumulent pas :
un seul à la fois, puis la cible y résiste 3,5 s (`RESIST` dans duel.js). Sans cette règle, on peut enchaîner l'adversaire sans qu'il lance un seul sort.
Brûlure, poison, Tremor et Ritardo ne sont pas des maléfices : ils s'ajoutent. Maléfices (rouge) et renforts (vert) en cours s'affichent
sous la barre de vie de chacun, avec les secondes restantes.

Quand un sort arrive sur quelqu'un, dans l'ordre : mur (Murus), copie (Copius), brume (Vapor, une chance sur deux), parade,
miroir (Speculum), Absorbo, Aegis, immunités (Calor, Tenax, Antidotum), puis dégâts (÷ 2 sous Bastion) et effets — voir `resolve()` dans duel.js.

Ritardo : pendant 10 s, les dégâts reçus sont subis normalement **et** notés ; à la fin, la cible les reçoit une seconde fois.

Mécaniques à part (voir « Sorts en réserve, animaux, éclairs à retardement, éternuements » dans duel.js) :

- **Preparus** : la prochaine attaque (pas un rayon) ne part pas, elle flotte à côté de nous — 3 au plus, 14 s chacune, elle clignote les 5 dernières
  secondes puis s'éteint. Un clic dessus la lance ; un clic ailleurs pare, comme d'habitude. L'adversaire s'en sert aussi : son sort attend près de lui, puis part.
- **Conjura** : après le chapeau, on a 6 s pour tracer un animal (`DS.ALLIES` dans data.js) — V = hibou (une étincelle par seconde), W = dragonnet
  (boules de feu), rond = crapaud (bulles de poison). Pendant ces 6 s, ces trois signes ne veulent plus dire Glacius, Aqua et Désarmo. L'animal tire tout seul pendant 7 s.
- **Foudrus** : rien pendant 2 s, puis l'éclair tombe. Sur nous, l'anneau de parade apparaît toujours dans le haut de l'écran.
- **Flammurus** : le bouclier (le clic, ou celui de l'adversaire) ne l'arrête pas ; Aegis, Absorbo, Speculum et le mur, oui. Il balaie toutes les copies de Copius.
- **Vortex** : 5 s de tourbillon — de la vie perdue à chaque seconde et la vue « sous l'eau » ; ce n'est pas un maléfice, il s'ajoute aux autres effets.
- **Stabilis** : 2 charges. Chaque sort qui nous atteint (touché ou paré, pas les salves de rayon) en use une et ne peut pas nous interrompre.
  Pour nous, seul Tornado interrompt un tracé ; l'adversaire, lui, est interrompu par le premier sort reçu en plein tracé.
- **Atchoum** : 4 éternuements en 6 s. Nous : la vue plonge et la baguette part de travers. Lui : il rate son tracé et lâche son bouclier.
- **Myopia** : toute la scène devient floue (filtre sur le canvas ; les barres et la ceinture restent nettes). Lui : il vise mal et pare moins bien.

Un tracé soigné (« Parfait ! ») frappe 20 % plus fort ; un brouillon, 20 % moins.
Toucher l'adversaire pendant qu'il trace interrompt son sort (pas deux fois de suite) ; en plein enchaînement, il passe aussitôt au sort suivant.

La réserve d'énergie est de 50 (`MANA_BASE` dans duel.js, avant sorcier et talents) : la barre est pleine au début du duel,
et elle remonte de 4,5 par seconde (`MANA_REGEN`, avant baguette et talents).

## La carte de l'école

Après le titre, on arrive sur la carte (`img/carte.jpg`, animée par `js/map.js`). Chaque bulle mène à un lieu :

| Lieu | Ce qu'on y fait |
| --- | --- |
| Cours d'attaque, de protection, d'effet | leçons avec un professeur, puis défis qui rapportent de l'expérience (voir « Les cours ») |
| Magasin de magie | une boutique **à fouiller** : l'image `img/magasin.jpg` (1376 × 768) est couverte de zones invisibles (`DS.SHOP_SPOTS` dans data.js : piles de parchemins, coffre, note, lanternes, bocaux, serpent…). On clique partout. À chaque arrivage (`newStock()` dans main.js, après chaque duel), la moitié des cachettes (parchemins, coffre, note) reçoivent un sort pas encore appris, les autres un parchemin qui ne sert à rien (`DS.SHOP_JUNK`), et un objet cache quelques pièces oubliées. Ce qui ne sert à rien rapporte parfois (deux fois sur cinq) 1 à 3 pièces (le gros bouton jaune « Récolter » dans la fiche, une fois par arrivage ; `save.shop.taken`). Les objets déjà fouillés portent une marque (🪙 pièces à récolter, ✕ rien, ✦ un sort trouvé, ✓ acheté). Un vrai parchemin se déroule dans la fiche et son signe s'y grave en brillant (`.unroll` : `pathLength="1"` sur les tracés de `glyphSvg`, animés en `stroke-dashoffset`). Les cinq potions sont toujours au comptoir. La fiche s'ouvre du côté opposé à l'objet, avec « Acheter » pour un sort ou une potion |
| Magasin de baguettes | changer de baguette, en acheter : sureau, ébène, et la **baguette de Josué** (300 🪙, mêmes chiffres que le saule). Son pouvoir unique (`swipe` dans `DS.WANDS`, `swipeParry()` dans duel.js) : sans cliquer, un revers rapide de la baguette à travers l'anneau doré d'un sort ennemi le dévie du côté où l'on frappe ; pas de temps de recharge, mais ça ne marche pas pendant qu'on trace un sort, et ça ne renvoie pas le sort à l'adversaire |
| Mon grimoire | un vrai livre : le sommaire sur la première double page (chapitres et liste des sorts, cliquables), puis **une page par sort** (et par potion) : son signe, son niveau et ⬆ pour le faire monter, le bouton « À ma ceinture » (`DS.BELT_BASE` = 3 cases, plus le talent Ceinture ; les autres restent dans le tiroir). Le panneau de niveau met côte à côte les chiffres du niveau actuel et du suivant (`DS.spellStats`, `lvBox()`) avec le bouton « Monter au niveau n ». Sous le livre, **la ceinture** comme en duel : on y glisse le signe d'une page (ou une case sur une autre pour échanger, hors de la ceinture pour vider ; `renderBelt()` et le glisser-déposer au pointeur dans main.js). On tourne les pages par les coins repliés, les onglets des chapitres, les flèches du clavier ou le sommaire ; le livre garde toujours la même taille (`grid-template-rows: minmax(0, 1fr)`) ; la page pivote vraiment (`#flip` : deux faces, `goPage()` dans main.js, `.flip` dans le CSS, sans `filter` qui aplatirait la 3D) |
| Miroir magique (fiche) | les talents : on se voit dans le miroir, et on lui demande de nous rendre plus fort (grandes cartes, un point par clic). Fond peint par `DS.art.makeMirrorBg` ; `img/miroir.jpg` le remplace s'il existe |
| Salle d'entraînement | deux choix : **le mannequin** (tous les sorts achetés, rien ne compte : mannequin simple, à abattre, trois de suite, qui bouge, au bouclier ; « Il riposte » pour essayer la parade et les protections) ou **le duel** contre un adversaire dont le niveau monte à chaque victoire (le grimoire s'ouvre avant) |
| Tournois | les coupes |

La pastille du sorcier, en haut à gauche, sert à changer de personnage.

Le fond vient d'une image fournie par Matthieu, dont les étiquettes, les boutons et les chandelles dessinés ont été effacés
(reconstruits à partir des pixels voisins) pour être remplacés par de vrais éléments animés. Les positions des lieux,
des chandelles et des torches sont dans `js/map.js`, en pixels de l'image d'origine (1376 × 768).

## Le cours d'attaque : leçons en classe

Le cours d'attaque se passe dans la salle de classe (`img/classe.jpg`, animée et menée par `js/classe.js`). Les leçons se suivent
l'une après l'autre (`LESSONS`) : **12 leçons**, de Scintilla à Infernus (Foudrus, Flammurus et Vortex, ajoutés ensuite, n'ont pas encore la leur). Les leçons 1 et 2 sont dans `js/classe.js`,
les leçons 3 à 12 dans `js/lecons.js`.

- Le professeur parle dans des bulles (le texte s'écrit pendant qu'il parle ; Entrée, → ou un clic sur la bulle pour continuer).
- Il montre les gestes : une lumière trace les traits à l'écran. Puis l'élève essaie, de sa place.
- Chaque leçon est découpée en 5 parties et une vingtaine d'étapes.
  Scintilla : le sort, le trait (en biais, à la verticale), les rafales (rafale droite, technique du griffon, rythme au tambour),
  le bon geste (trop court, bonne longueur), la démonstration (toucher le mannequin 5 fois).
  Fulgur : le sort (deux fois plus fort, très rapide, mais cher), le Z (d'un seul geste ; relâché en route, il tombe en trois étincelles ;
  à l'envers, c'est un S), un beau Z (net plutôt que brouillon, petit plutôt que grand), en duel (l'enchaînement Scintilla, Scintilla, Fulgur ;
  trois Fulgur en 8 secondes), la démonstration (l'enchaînement deux fois de suite sur le mannequin).
- À partir de la leçon 3, chaque sort a aussi son **exercice à lui**, devant un mannequin préparé pour l'occasion :

  | Leçon | Signe et piège | Exercice propre au sort | Démonstration |
  |---|---|---|---|
  | 3 Ignis | triangle (pas refermé : rien) | faire fondre un mannequin de glace : la brûlure finit le travail | vider les 70 points de vie d'un mannequin |
  | 4 Sagitta | flèche (vers le bas : Gravitas) | éteindre la mèche du mannequin pétard avant qu'il explose, 3 fois, temps affiché | 5 flèches sur un mannequin qui se promène |
  | 5 Terra | carré (coins ronds : Désarmo) | casser un mur avec Scintilla (5 coups), puis avec Terra (3 coups) | un mur, puis le mannequin derrière |
  | 6 Tonnero | U carré (arrêté en route : Lentus) | 3 mannequins enchaînés : un par un avec Scintilla, tous d'un coup avec Tonnero ; mannequin de fer | 9 mannequins |
  | 7 Vespera | C (refermé : Désarmo) | mannequin au bouclier magique : Fulgur est bloqué, Vespera passe à moitié | il lève et baisse son bouclier |
  | 8 Toxicus | 8 couché (debout : rien) | un seul Toxicus et on regarde la vie fondre ; puis empoisonner d'abord, attaquer ensuite | mannequin de caoutchouc : rien ne lui fait mal s'il n'est pas empoisonné |
  | 9 Tremor | M (sans la dernière jambe : Tenebra) | la bombe à retardement ; placer 2 Scintilla avant la première secousse | mannequin dur comme le roc, à fissurer d'abord |
  | 10 Tornado | S (le Z : Fulgur) | interrompre le mannequin farceur avant qu'il nous lance son seau d'eau ; chasser la brume | farceur qui se soigne chaque fois qu'il nous arrose |
  | 11 Radius | Σ | tenir le rayon sur le mannequin, qui se promène, puis dont le petit bouclier court après le rayon | les deux à la fois, au rayon seulement |
  | 12 Infernus | étoile | faire fondre un mannequin de glace, puis trois d'un seul souffle | l'examen : un mur, trois mannequins enchaînés, le grand mannequin de glace |

  Chaque leçon donne aussi un enchaînement à essayer en duel (coup du dragon, de l'archer, du maçon, de l'orage, de l'éclipse, du serpent, de la taupe, du phare).
- **Le mannequin** est celui de l'image de la classe : pied en croix, poteau, bras en rondin, tête de bois, écu blanc et or (`drawDummy` dans duel.js).
  Il se balance quand on le touche, affiche les dégâts, grimace, brûle, verdit, tombe (la glace fond). Ses variantes et ce qu'il sait faire
  (barre de vie, rangée de trois, bouclier, brume, seau d'eau, mèche, promenade) sont décrits en tête de « Cibles des cours » dans duel.js.
- À la fin, le professeur appelle l'élève devant la classe : on se retrouve face au mannequin (décor `corner`).
- Leçon réussie : 30 XP la première fois. Le professeur propose alors la leçon suivante, de pratiquer sur le mannequin
  (les défis ci-dessous, dans ce même décor) ou de revoir une leçon déjà réussie. Une leçon apprend à lancer le sort en classe ;
  pour s'en servir en duel, il faut encore l'acheter au magasin de magie (le professeur le rappelle).
- Pendant une leçon, seules les formes utiles sont reconnues (`only` : pour Fulgur, le trait, le Z et le S), pour qu'un tracé maladroit
  ne lance pas un sort que l'élève ne connaît pas.

Ajouter une leçon : une liste d'étapes et `DS.classe.add({ id, name, color, only, parts, steps })` (voir lecons.js). Une étape a un texte (`say`, les mots importants en `<b>`),
et au choix une démonstration (`demo` : des traits, ou `show` : une forme entière) ou un exercice (`strokes` ou `guide` pour le modèle,
`check` qui reçoit le sort reconnu, la qualité, l'angle, la longueur et la taille du tracé). Devant le mannequin (`corner`), un exercice peut choisir
sa cible (`target`), dresser un mur (`wall`), refuser certains sorts (`allow`), compter ce qui arrive à la cible (`hit`, `wallHit`) ou se jouer dans le temps (`tick`) :
la liste complète est en tête des étapes dans classe.js. `lecons.js` fournit des raccourcis (`shape` pour apprendre un signe, `dummy`, `row`, `seq`…).

Scintilla se trace dans n'importe quel sens sauf (presque) à la verticale (`LINE_MAX_ANGLE` dans gestures.js), et un trait doit
mesurer au moins 15 % de la hauteur de l'écran (9 % pour les autres formes) : voir `endTrace()` dans duel.js.

## Les cours de protection et d'effet, et la pratique d'attaque

**Cours de protection : les leçons en classe.** Comme le cours d'attaque, il commence par des leçons menées par `js/classe.js` (liste `PROT`), dans la même
salle (img/classe.jpg), retouchée par `makeProtImage()` : le professeur Brasier et le rayon qu'il tient pointé sur le mannequin sont effacés avec des morceaux
voisins de l'image (et un dessin à la craie de la parade sur le tableau). La professeure Égide est dessinée debout devant le pupitre (`EGIDE`, `drawRoom`),
elle ne vise pas le mannequin, et ses sorts partent de sa baguette (`anchor().gc`). Le schéma animé de la parade s'affiche dans sa bulle (`#bulle-fig`).
Leçon 1, « Vous n'êtes pas prêts » (`ISTEPS`, obligatoire comme toutes : les leçons se suivent dans l'ordre) : Égide provoque la classe, appelle l'élève et lui
demande de lui lancer trois Scintilla. Pendant cet exercice (`riposte: 0.5`), `anchor()` fait viser la professeure (`aimProf`) et la cible est
`{ kind: 'baked', riposte }` : dès que le sort part (`decideBlock`, à 12 % du vol), elle lève son bouclier de maître (bulle de lumière dessinée dans `drawRoom`,
`D.f.shield`), et à l'arrivée `hitTarget` le renvoie vers nous en la moitié de son temps de vol (tir `riposte`, inoffensif, « Touché ! »). C'est le retour
qui compte (`parry` + `said`), bloqué ou reçu. Leçon 2, « Bloquer et renvoyer » : théorie, schéma animé de la parade,
démonstration devant la classe (bloquer 3 sorts lents, en renvoyer 2), puis l'invention de la professeure, le **Scintillateur** — un mannequin de laiton qui tire
des étincelles inoffensives : tir régulier, tir irrégulier, puis deux machines. Étapes propres à ce cours : `cast`, `machine`, `parry`, `figure`, `riposte`, `said`.
Une fois la leçon réussie, l'**atelier** laisse régler le Scintillateur (rythme régulier ou non, cadence lente, moyenne ou rapide, une ou deux machines) et compte
les étincelles bloquées, renvoyées et reçues. Le bouton « Les sorts de protection : leçons et défis » mène ensuite à ce qui suit.

**Cours d'analyse des tirs magiques (professeur Oculus).** Dans la même salle (bouton « 🔍 Cours d'analyse… » chez Égide, et retour chez elle depuis
Oculus : `sister` dans `COURSES`), un cours qui ne porte pas sur un sort mais sur la **lecture** du tir qui arrive et le choix de la bonne défense,
surtout contre ce que le bouclier n'arrête pas. Leçon 1, « Lire un tir, et le mur de feu » (`ANALYSE`, `ASTEPS1`) : regarder la baguette de
l'adversaire (le signe = le nom du sort), boules d'énergie → bouclier, trois flammes (Flammurus) → Aegis, Absorbo ou Speculum ; exercices : 3 murs
de feu avec Aegis, 6 défenses justes dans un mélange de boules et de murs, 2 murs avec Absorbo. Étapes propres : `cast.ids` (plusieurs sorts, dans
l'ordre puis au hasard) et `parry` en fonction `(e, S) → true | message`. Les suites (une par famille de sorts dangereux) sont à écrire par Matthieu.
Après la leçon, **« 🎯 S'exercer contre un sort… »** (`drills` de la leçon, `drill()`) : le professeur lance en boucle le sort choisi (ou le mélange),
à trois cadences, et on compte bonnes défenses, coups reçus et série.

Dans ces cours (`js/school.js`), un professeur remplace l'adversaire (ou un mannequin, en attaque). Rien n'y fait mal, et on n'y gagne jamais d'or.
Devant le mannequin du cours d'attaque, on ne voit et on ne peut lancer que les sorts dont la leçon en classe est réussie.
Le mannequin de la salle d'entraînement est mené par le même fichier (`trainMenu()`), avec tous les sorts achetés.

1. On choisit un sort : le professeur explique ce qu'il fait (textes dans `TEXT`), et la forme s'affiche.
2. **Leçon** : on suit le tracé modèle à l'écran (point de départ vert, flèches, petite lumière qui montre le chemin).
   Puis « 3 fois de suite », pendant que le modèle s'efface ; une erreur remet la série à zéro et réaffiche le modèle.
   Une leçon réussie rapporte 20 XP la première fois. On peut suivre la leçon d'un sort pas encore acheté.
3. **Défis**, avec une médaille (bronze, argent, or, diamant) ; l'expérience n'est donnée que lorsqu'on améliore sa médaille (10, 25, 45 puis 70 XP au total) :

| Défi | Cours | Principe |
| --- | --- | --- |
| Cadence | tous, un par sort | lancer le sort le plus de fois possible en 20 s ; un tracé parfait vaut 3 points, un bon 2, un brouillon 1 (`startCadence`, seuils calculés d'après la longueur du tracé) |
| De mémoire | tous | le professeur dit un nom, on trace sans modèle (8 s par sort, un seul essai) |
| Attaque de rapidité | attaque | toucher le mannequin 20 fois le plus vite possible (bronze 12 s, argent 9 s, or 7 s, diamant 5 s : seuils fixés par Matthieu) |
| Au rythme du tambour | attaque | 4 coups pour écouter, puis 3 manches de 8 coups de plus en plus rapides : un sort d'attaque pile sur chaque coup (3, 2 ou 1 point ; réglages dans `DRUM`) |
| Casse-caisses | attaque | détruire 5 caisses de plus en plus solides, avec n'importe quel sort d'attaque |
| Points faibles | attaque | chaque mannequin ne craint qu'un sort : glace → Ignis, fer → Tonnero, pétard → Scintilla |
| La bonne protection | protection | le professeur lance 6 sorts : Glacius → Calor, Désarmo → Tenax, le reste → Aegis |
| Le bon maléfice | effet | le professeur dit quoi lui faire (« Endors-le ! »), on trouve le sort |

Les seuils des médailles sont dans chaque fonction `start…` de school.js. Ceux de Cadence et de Casse-caisses sont calculés
d'après `pace(sort)` (secondes par sort au rythme d'un bon duelliste : 0,15 + 0,9 × la durée du tracé) et les sorts d'attaque dont la leçon est réussie ;
or = ce rythme, diamant = 22 % plus vite. Ils n'ont pas encore été réglés avec de vrais joueurs.

## Musique et sons

Aucun fichier audio : tout est fabriqué par le navigateur (Web Audio). Rien ne sonne avant le premier clic ou la première touche (les navigateurs
l'interdisent). Les volumes sont gardés dans `localStorage` (clé `duel-sorciers-son`).

- **Musique** (`js/music.js`) : un petit orchestre synthétisé (célesta, harpe, cordes, cuivres, flûte, basson, timbales) joue des airs **originaux**,
  dans l'esprit des musiques d'école de sorciers — ce ne sont pas les thèmes des films. Un air par endroit : `theme` (titre, choix du sorcier),
  `carte` (carte, grimoire, talents), `boutique` (magasins), `tournoi`, `classe` (cours), `prep` (avant le duel), `duel`. En tournoi, l'air du duel
  monte d'un demi-ton et accélère à chaque tour. Quand un des deux sorciers est presque à terre, une couche de cordes aiguës et de timbales s'ajoute.
  Ritournelles : `victoire`, `defaite`, `bravo` (leçon ou médaille réussie). En classe, la musique se tait pendant les exercices au tambour.
- **Écrire un air** : `'E5 G5:2 r:.5 C4+E4+G4:3 |'` — note et octave, durée en temps après « : », `r` = silence, `+` = accord, `|` = barre de mesure.
  L'accompagnement (basse, arpèges de harpe, accords tenus) se déduit d'une suite d'accords (`'Em'`, `'B7'`…). Voir le haut de `js/music.js`.
- **Sons et ambiances** (`js/audio.js`) : sorts, parades, menus (survol, clic, retour, achat, page du grimoire, clochette du magasin…), cœur qui bat
  quand il reste peu de vie, et trois ambiances — vent et chouette sur la carte, torches qui crépitent dans la salle de duel, feu en classe.
- Les volumes ont été équilibrés par des mesures (`DS.music.render`), pas à l'oreille : à ajuster dans `js/music.js` (`vol` de chaque partie ou de chaque air).

## Âge des sorciers

Un sorcier a l'âge de son niveau (`DS.ageOf`, `DS.AGES` dans data.js) : **enfant** jusqu'au niveau 7, **ado** de 8 à 15, **vrai magicien** à partir de 16
(taille adulte, chapeau pointu, barbe pour certains). L'adversaire a l'âge du niveau du duel ; notre sorcier, celui de son propre niveau (portraits).
Les professeurs sont toujours adultes. Un petit adversaire n'est pas plus difficile à toucher avec un rayon.

### Sorciers farfelus

Certains rivaux ont une allure bien à eux : barbe jusqu'aux genoux, moustache plus large que la tête, favoris, sourcils en broussaille,
chevelure bouffante, haut-de-forme, turban, bonnet de nuit, robe à étoiles, à pois, à losanges ou rapiécée, fraise, nœud papillon, poulaines.
Tout se règle par des champs facultatifs sur le sorcier, dans `DS.RIVALS` (data.js) ou `DS.PROFS` (school.js), dessinés par `drawWizard` (art.js) :

| Champ | Valeurs |
|---|---|
| `beard` | `true` (courte), `'long'` (jusqu'à la ceinture), `'huge'` (jusqu'aux genoux), `'fork'` (deux pointes) — adultes seulement |
| `stache` | `'giant'`, `'curl'` (en guidon), `'walrus'` — adultes seulement |
| `whiskers`, `bald` | favoris, crâne chauve — adultes seulement |
| `brows: 'bushy'` | sourcils en broussaille — adultes seulement |
| `nose`, `tufts` | gros nez, touffes de cheveux sur les côtés |
| `glasses` | `true` (lunettes rondes), `'mono'` (monocle) |
| `hairStyle` | `'short'`, `'long'`, `'curly'`, `'braids'`, `'poof'` (énorme chevelure) |
| `hat` | `'tall'`, `'bent'`, `'top'`, `'floppy'`, `'cap'`, `'turban'`, `'none'` ; sans ce champ, chapeau pointu à l'âge adulte seulement. Un chapeau spécial se porte à tout âge. `hatCol` : sa couleur |
| `pattern` | `'stars'`, `'moons'`, `'stripes'`, `'dots'`, `'checks'`, `'patches'` (`pat` : couleur du motif, sinon celle du liseré) |
| `collar` | `'ruff'` (fraise), `'bow'` (nœud papillon), `'high'` (grand col dressé) |
| `shoes: 'curl'`, `accent` | poulaines à grelot ; couleur du nœud, des souliers et du joyau |

## Potions

`DS.POTIONS` (data.js) : vie (+40 PV), énergie (+30), élixir pur (efface maléfices, poison et brûlures), force (3 attaques ×1,5), bouclier (un dôme, 10 s).
On les achète au comptoir du magasin (`save.potions = { id: nombre }`), on les met à sa ceinture comme un sort (une case chacune ; identifiant `potion-<id>`,
`DS.item(id)` retrouve sort ou potion), depuis le grimoire ou le tiroir du duel. En duel, un clic sur la fiole la boit (`drink()` dans duel.js) :
effet immédiat, une fiole de moins, et la case reste grisée quand il n'en reste plus.

## Progression

Tout est sauvegardé dans le navigateur (`localStorage`, clé `duel-sorciers-v1`). Le bouton « Effacer ma sauvegarde », sur l'écran titre,
remet tout à zéro après confirmation.

- **Tournois** : 5 coupes, de plus en plus dures ; gagner une coupe ouvre la suivante. Perdre ou abandonner un duel, c'est être éliminé.
  Chaque coupe se termine par un tableau de 8 sorciers (quart, demi, finale) ; les plus longues commencent par des duels de qualification (`pre` dans `DS.CUPS`) :
  Apprentis niveaux 10 à 14 (3 duels), Bronze 13 à 17 (3), Argent 17 à 22 (4), Or 20 à 25 (5), Archimages 20 à 30 (6).
  À chaque participation, tout est tiré au hasard : les adversaires, leur place dans le tableau et le niveau de chaque duel (`cupLevels()` : ça monte de duel
  en duel, le premier n'est jamais dans la moitié haute de la plage, la finale est au niveau le plus haut ou juste en dessous).
  Chaque adversaire a aussi ses goûts, tirés au hasard à chaque duel (`D.ai.taste`) : des sorts qu'il ne lance jamais, d'autres qu'il adore.
- **Or** : gagné à chaque duel (`DS.reward`), plus le prix des coupes. Il sert à acheter des sorts et des baguettes.
- **Sorts** : quatre catégories (`DS.CATS`) : attaque, protection, renfort, effet (les sorts de renfort s'enseignent au cours de protection).
  Un sort absent de la ceinture ne part pas, même bien tracé — et seules les formes de la ceinture sont comparées au tracé, ce qui évite les confusions.
  L'adversaire, lui, connaît tous les sorts : les plus vicieux n'arrivent qu'avec le niveau (2 à 7), et il se soigne ou se protège selon ce qui lui arrive (`pickFoeSpell()`).
- **Niveau des sorts** (1 à 5) : c'est le joueur qui les fait monter, dans le grimoire, avec ses **points de sort** — un par niveau de sorcier gagné
  (`save.spts`). Un niveau coûte 1 point, 2 pour les sorts de 150 🪙 et plus, 3 pour ceux de 300 🪙 et plus (`DS.spellUpCost`). On peut reprendre tous ses points.
  Par niveau : +35 % de dégâts, projectile 12 % plus rapide et 16 % plus gros, effets 25 % plus longs et 30 % plus forts (`DS.spellMul`) ;
  au niveau 5 : dégâts ×2,4, durée ×2. Une sauvegarde d'avant ce système repart du niveau 1 partout, avec un point par niveau de sorcier déjà gagné.
- **Niveau du sorcier** : l'expérience vient des duels ; chaque niveau donne un point de sort et un point de **talent** (`DS.STATS`) :
  vie, énergie max, vitesse de recharge, coût des sorts, or gagné, garde (bouclier tenu en gardant le clic enfoncé), ceinture (une case de plus par point, 5 au plus).

## Fichiers

- `js/data.js` : sorciers, rivaux, baguettes, catégories, sorts (chiffres, prix, effets), niveaux de sorts, talents, coupes, récompenses.
- `js/gestures.js` : reconnaissance des tracés. Une nouvelle forme s'ajoute dans `GLYPHS`.
- `js/duel.js` : le duel (tracé, ceinture et tiroir, projectiles, rayons, parade, maléfices et renforts, mur, copies, adversaire, rendu). Difficulté par niveau dans `start()`.
- `js/map.js` : la carte (lieux, bulles, chandelles et torches animées).
- `js/classe.js` : la salle de classe et le déroulement des leçons du cours d'attaque (bulles du professeur, démonstrations, exercices), leçons 1 et 2.
- `js/lecons.js` : les leçons 3 à 12 du cours d'attaque.
- `js/school.js` : la pratique et les défis (professeurs, leçons guidées, médailles).
- `js/main.js` : menus, sauvegarde, progression (or, expérience, talents, maîtrise des sorts, tournois, magasins, grimoire).
- `js/art.js` : dessins (salle, sorciers, baguettes, flammes). `js/audio.js` : sons et ambiances synthétisés. `js/music.js` : la musique.

Ajouter un sort : une forme dans `GLYPHS` (gestures.js), une entrée dans `DS.SPELLS` avec sa catégorie `cat`, son `icon` et ses effets (data.js — la liste
des effets possibles est en commentaire au-dessus de `DS.SPELLS`), son temps de tracé dans `TRACE_TIME` et son poids dans `pickFoeSpell()` pour que
l'adversaire s'en serve (duel.js), ce qu'en dit le professeur dans `TEXT` (school.js). Lancer ensuite `node tools/test-gestures.cjs` : deux formes trop
proches se confondent.

## Tests

- `node tools/test-music.cjs` : vérifie la musique écrite (mesures complètes, parties de même longueur) et liste les frottements entre parties.
  Dans une capture, `await DS.music.render('duel', 26)` mesure le niveau d'un air (moyenne et crête, en dB).
- `node tools/test-gestures.cjs` : 600 dessins tremblés par forme (les 43 formes en lice à la fois, plus dur qu'en duel), plus des gribouillis qui ne doivent rien lancer.
- `node tools/capture.cjs "file://$PWD/index.html" sortie.png 800 1400 800 "<script>"` : capture dans Chrome headless.
  La capture s'arrête d'elle-même au bout de 60 s (`CAPTURE_MAX=120` pour allonger) et ferme toujours Chrome.
  Raccourcis utiles dans le script : `DS.app.save.setup = true` (saute le choix du sorcier), `DS.app.show('map')`,
  `DS.app.openBook('view')`, `DS.app.startClass('effet')`, `DS.app.startDuel()`, `DS.duel.engage()`, `DS.duel.state`,
  `DS.duel.debug.trace('zigzag'); DS.duel.debug.endTrace()`, `DS.duel.debug.parry()`, `DS.duel.debug.place('tonnero', 0)` (range un sort dans une case
  de la ceinture), `DS.duel.debug.foeCast('radius')` (fait lancer un sort à l'adversaire).
- Dans la console du navigateur : `DS.app.give(500)` donne de l'or, `DS.app.unlockAll()` débloque tous les sorts, `DS.app.points(5)` donne des points de talent.

Après une modification de JS ou de CSS, augmenter les `?v=` dans `index.html`.


La pièce d'or du jeu est `<i class="coin"></i>` (`.coin` dans le CSS, `DS`-libre) : l'émoji 🪙 est une pièce d'argent sur Mac, Matthieu veut de l'or partout.

Miroir magique (2026-11-06) : plus de grosses cartes, une **fiche de personnage façon Diablo** (`renderTalents` → `.sheet`) : une ligne par attribut
avec icône, nom, gain par point, valeur totale (PV, PM, %, s, cases), pastilles et bouton « + » doré quand il reste des points ; en bas, baguette,
sorts connus, victoires, coupes, points de sort.

Leçon 4 d'attaque (Sagitta), le mannequin pétard : quand la mèche arrive au bout, il explose en **12 morceaux** (`t.debris` dans duel.js, qui
retombent et rebondissent) et un neuf arrive en grandissant (`t.pop`) ; la leçon reçoit `boom: true` et l'exercice **repart de zéro** (`K.restart`).
Tirer avant la mèche ou autre chose qu'une flèche = une pénalité (jugée au tracé : `onCast` dans l'étape, le sort ne part pas) ; la deuxième remet
tout à zéro. Les exercices « cible à toucher » (`hit`, `hits`, `tick`, `wallHit`) ne se sautent plus d'un clic sur la bulle.

## Enchaînements, examens et mur magique (2026-11-06)

- **Enchaînements** (`DS.COMBOS`, `DS.COMBO_GAP` = 3,5 s) : les coups du cours d'attaque (un-deux-trois, dragon, archer, maçon, orage, éclipse,
  serpent, taupe, phare). Lancés dans l'ordre sans traîner, le **dernier sort a un niveau de plus** (`comboOf()` dans duel.js, `DS.spellMul(lv, raw)`
  sans plafond) ; « ✦ Le coup de … ! ✦ » s'affiche. Brasier l'explique à la leçon 2 et le rappelle aux leçons 5, 8 et 11 ; le grimoire a une page
  « ✦ Enchaînements ».
- **Le coup de l'archer doré** (leçon 4, secret) : Ignis puis Sagitta, mais la flèche doit toucher **avant** la boule de feu. Le professeur propose
  d'essayer (étape `ask` : des boutons, `skip` saute des étapes) ; après deux ratés, il demande si on continue le cours (`K.ask`, `K.again`, `K.skip`).
- **Examens** (`exam()` dans lecons.js) : après la leçon 5 et après la leçon 10. Les enchaînements des leçons passées, chacun en temps limité
  (`within` : trop lent, on le recommence), puis une épreuve finale chronométrée (mur de 8, mannequin ; brume à l'examen 2). Les examens ne comptent
  pas dans la numérotation des leçons (`num`, `tag` dans classe.js ; `exam: n`).
- **Terra** : un cube de terre brune (`drawShot`), et `wallDmg: 4` : les murs des leçons font 8 coups (deux cubes). Murus reste à 5.
- **Le mur** (`drawWall`) : pierres biseautées, liseré de magie entre les pierres, runes qui luisent, halo et voile de lumière, étincelles ; il se
  fissure et noircit à mesure, et la magie suinte des fissures.

## Quinze sorts de plus, l'arrière-boutique (2026-11-06)

Signes nouveaux dans gestures.js (why, asterisk, meteor, cross, lt, psi, step, two, four, kay, stairsup, perp, check, arrowright, arrowleft ; les
formes fermées et courbes testées — losange, œil, maison, 8, oméga, goutte… — se confondaient avec les signes existants et ont été écartées).
Attaque : **Nocturna** (`volley: 3`, trois boules noires au feu mauve, l'une derrière l'autre via `D.pending`), **Bombus** (`bomb` : explose dans le
bouclier de qui le bloque — 60 % des dégâts — ; renvoi parfait ou déviation seulement), **Meteorus** (`sky` + `meteors: 6`, des rochers en flammes
tombent l'un après l'autre), **Blizzardus** (`blizzard {dps, dur}` : l'écran de la victime disparaît sous la neige, `blizzardView`), **Stiria**
(pique : `pierce` + `freeze`), **Stalagma** (`needles` : brise tous les sorts en vol vers le lanceur et pique l'autre), **Orbis** (`quake` + `orb` :
la sphère d'orage, `drawStormOrb`), **Acidus** (`noShield`), **Saxum** (`dazzle`), **Spina** (poison + `heavy`), **Vampyra** (`leech`).
Protection : **Arcanum** (`shieldHp` : encaisse 30 dégâts puis se brise, pastille avec le reste). Effet : **Fumus** (`smoke` : l'adversaire ne
pare plus rien, `smokeView` devant nous), **Evanesco** (`invis` : les boules nous traversent, pas le mur de feu ; lancer un sort nous fait
réapparaître), **Deviatus** (`swipe` : le revers de la baguette de Josué pendant 10 s, pointe dorée et liseré doré). **Inversium** met maintenant
la tête en bas : toute la vue pivote d'un demi-tour (`render`), et l'adversaire touché s'envole et se retourne (`drawFoe`). **Amplio** et
**Fortis** enflamment la baguette (la nôtre sur toute sa longueur, la sienne à la pointe).
Le magasin a une deuxième salle, l'arrière-boutique (`DS.SHOP_ROOMS`, `DS.SHOP_SPOTS2`, bouton en bas à droite) ; l'arrivage se répartit sur
les deux salles.

## Tour des Épreuves, laboratoire, volière, garde-robe (2026-11-06)
Quatre lieux de plus sur la carte (`js/extras.js`, données dans `js/data.js`, écrans dans `index.html`) :
- **Tour des Épreuves** (le donjon au fond, refaite le 2026-11-07 à la Mortal Kombat) : une échelle de **100 étages** (`DS.TOWER_FLOORS`), affichée comme
  une tour de pierre (l'étage à jouer en or en bas, les cinq suivants, le prochain maître, le sommet ; `renderTower`, donjon dessiné une fois par `drawTowerBg`,
  torches animées en CSS). On monte d'un étage à chaque victoire, on **redescend d'un** à chaque défaite ou abandon ; quitter le jeu ne fait rien perdre
  (`save.tower = { floor, best, seed, crowned }`). Chaque étage est tiré **une fois pour toutes** par la graine de la sauvegarde (`DS.towerFloor(seed, n)`,
  déterministe) : ses monstres, leurs variantes, ses règles. Niveau des monstres : `DS.towerLevel(n)` (1 + 0,3 par étage, 31 au sommet).
  - **22 bêtes** (`DS.TOWER_BEASTS`, 13 silhouettes de `drawMonster` : slime, bat, ghost, skeleton, golem, spider, wisp, dragon, yeti, et les nouvelles goblin, knight,
    eye, imp), chacune avec son premier étage (`from`), ses sorts criés, sa vie et sa force (`hp`, `dmg` × celles d'un sorcier du niveau).
  - **Variantes** (`DS.TOWER_TIERS`) : la même bête d'une autre couleur (`tint` appliquée à tout le dessin), avec un signe (`mark` : horns, aura, spikes, crown, mask)
    et un sort de plus — sombre, givrée, ardente, venimeuse, spectrale, et les rares **dorée** (vie ×2) et **noire** (vie et force ×1,9). De plus en plus fréquentes en montant.
  - **Plusieurs contre un** : 2 monstres possibles dès l'étage 8, 3 dès le 30e (horde d'une seule vague, `cfg.horde` avec `hpK` = vie de chacun, `label` dans le HUD ;
    le monstre qui lance frappe avec sa propre force, `D.ai.dmg0 × ch.dmg` dans `setActive`).
  - **Maîtres** tous les 10 étages (une bête `boss`, couronne, ×1,3 de taille, ×1,8 de vie, une épithète `DS.TOWER_EPITHETS`) : leur coffre donne un point de sort et deux ingrédients.
  - **Règles de l'étage** (`DS.TOWER_MODS`, lues par duel.js dans `D.mod`) : une dès le 12e, deux dès le 40e.
  - **Le sommet** : Pyrrhax, le Dragon Ancestral (`DS.TOWER_DRAGON`, taille 1,5 ancré plus bas par `sink`, vie ×2,4), qui crie Infernus, Flammurus, Meteorus, Nocturna, Vortex,
    pendant que la tour s'en mêle (`DS.TOWER_DRAGON_EVENTS` : pluie de feu, souffle, secousses…). Il reste « ? ? ? » tant qu'on n'a pas atteint l'étage 90.
    Le vaincre : `crowned`, 3 points de sort, le titre « Tombeur du Dragon » (et « Seigneur des Cimes » à l'étage 50). On peut le défier encore (prix divisé par 4).
  - Prix d'un étage : `towerReward` (or et XP du niveau × hauteur × variantes × nombre de monstres × règles) ; une défaite rapporte le quart.
    Non mesuré en vrai : la difficulté des étages hauts (niveau 31 + variantes + 3 contre 1) n'a pas encore été jouée.
- **Laboratoire d'alchimie** (tour de gauche) : huit ingrédients (`DS.INGREDIENTS`), à trouver au magasin de magie (un objet inutile sur cinq) et après un duel gagné
  (quatre fois sur cinq). Deux ingrédients, parfois un sort connu comme base, et on mélange : `DS.RECIPES` (18 : 6 potions, 12 sorts appris pour toujours sans les acheter).
  Un raté ne consomme rien et donne un indice (ingrédient qui « réagit », base manquante) ; le codex garde les recettes trouvées. `save.ingr`, `save.recipes`, `save.hints`.
- **La volière** (tour de droite) : cinq familiers (`DS.FAMILIARS`), à adopter puis nourrir en or (3 niveaux, nom qui change). Un seul vient au duel (`save.fam.active`) ;
  son pouvoir est lu par duel.js dans `D.fam` : chouette = énergie qui revient plus vite, dragonneau = boule de feu toute seule (`famPos`, `allyFire` avec origine),
  golem = dégâts reçus réduits (dans `hurt`), fée = soin sous la moitié de la vie, chat = bouclier qui se recharge plus vite et anneau plus grand.
- **Miroir magique 2.0** : quatre onglets (talents, chapeaux, baguette, titres). `DS.HATS` (chapeau + aura d'étincelles, visible dans le miroir et sur le portrait de la carte),
  `DS.WAND_LOOKS` (couleur du tracé `D.look.trail/trailHi`, manche, cœur de la baguette : `DS.extras.styledWand`), `DS.TITLES` (après le prénom, au féminin si `f`).
  Tout se débloque par un exploit (`unlock(save)`) ; une pastille « nouveautés » apparaît sur la carte (`save.seen`). `DS.extras.styled(me)` donne le sorcier habillé (carte, miroir, duel).
Console : `DS.app.ingredients(n)` donne des ingrédients ; `DS.app.startTower(DS.extras.towerCfg())` lance l'étage (`DS.app.save.tower.floor = n` pour en choisir un ; `DS.extras.towerFloor(n)` le décrit).

## L'aventure : biomes, monstres et hordes (2026-11-06)
Par le tapis, en bas de la carte (`js/aventure.js`, données `DS.BIOMES` / `DS.MONSTERS` dans `js/data.js`, monstres dessinés par `drawMonster` dans `js/art.js`).
- Six biomes à la suite (forêt, marais, désert de cendres, montagne de givre, volcan, royaume des ombres), chacun une grille 14 × 8 tirée au sort (mais fixe pour la partie :
  `save.adv.seed`), avec un chemin garanti, trois monstres sur le chemin et le gardien 👑 devant la sortie. On avance case par case avec les flèches (clavier ou boutons).
  Sortie franchie : biome suivant ; après le dernier, on recommence au premier avec des monstres de `DS.ADV_LOOP` niveaux de plus. `save.adv = { biome, loop, x, y, key, cleared, seed }`.
- Marcher sur un monstre lance un **combat de horde** (duel.js, `cfg.horde = { waves, events }`, état `D.pack`) : des monstres peu résistants (un tiers de la vie d'un sorcier du
  même niveau, le gardien 80 %), parfois plusieurs à la fois côte à côte (`packDx`), qui lancent chacun leurs sorts à tour de rôle (`setActive`, `f.offX` suit le lanceur, nos sorts
  visent le plus proche de la baguette : `packSlot`). Une vague vaincue, la suivante surgit (« ⚠ 2 autres arrivent ! ») ; `finish()` ne termine qu'à la dernière. Toutes les 9 à 16 s,
  le biome s'en mêle (`fireEvent`) : sort tombé du ciel (mur de feu, blizzard, éboulement, météores…) ou séisme (une protection l'annule). Les monstres n'ont pas de baguette,
  ne portent pas de coup physique, et ne lancent que leurs sorts (`ch.spells`, quel que soit leur niveau). Gagné : le monstre disparaît de la grille ; perdu (ou abandon) : retour
  à l'entrée du biome. L'or et l'expérience montent avec le nombre de monstres fauchés (`r.kills`), doublés pour un gardien.
Tests : `DS.app.startAdventureDuel({ foe, level, horde: { waves: [[…]], events: […] }, m })` ; `DS.aventure.move(dx, dy)` ; `DS.aventure.world`.

## Signes des sorts dans les bulles (2026-11-06)
`A.spellRefs(html)` (js/art.js) transforme chaque nom de sort d'une bulle de professeur (classe.js `say`, school.js `say`) en pastille : petit signe à côté du nom,
et au survol, le signe en grand avec la façon de le tracer (`.spref .tip`, vers le bas si la pastille est près du haut de l'écran : `A.spellTips`). Seul le texte est
touché, jamais l'intérieur des balises. Le cours d'analyse (ASTEPS1) montre et fait tracer le toit d'Aegis (2 fois) avant les murs de feu, et le > d'Absorbo avant la dernière partie.

## Aventure : rencontres cachées, cris de monstres (2026-11-06)
- Les monstres ne se voient plus sur la grille (façon Pokémon) : en marchant, surtout dans les hautes herbes (case 4, dessinées par `grass()`), un combat surgit (28 % par pas
  dans les herbes, 5 % ailleurs, jamais deux pas de suite). L'écran tremble, des bandes noires le balaient (`wipe`), et le combat démarre tout seul (`DS.duel.engage()` dès le lancement,
  pas de bouton). Restent visibles : le gardien 👑 de la sortie et, s'il y a un passage obligé (colonne à une seule case libre), le monstre 🛡️ qui le garde.
- Un monstre ne trace rien : il **crie le nom de son sort** (« SCINTILLA ! ») et une lueur monte en lui pendant le temps de charge (×0,8), puis le sort part. Pas de tracé fantôme,
  pas de raté. Chaque monstre a son propre jeu de sorts, 5 au plus (`DS.MONSTERS`).
- Corrigés : un sort en vol visant un monstre d'une vague précédente (`s.slot` périmé) plantait `arriveAtFoe` ; la fin d'une rencontre au hasard (`advFight.m` null) plantait `onDuelEnd` ;
  le repère de la horde (`f.offX`) saute maintenant d'un monstre à l'autre sans faire glisser le groupe.
