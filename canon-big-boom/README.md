# Canon Big Boom

Jeu de tir en vagues où chaque membre de la famille défend son canon contre des bébittes volantes : chauves-souris,
fantômes, ballons méchants, abeilles, oiseaux de feu… jusqu'aux chasseurs spatiaux du dernier monde, où le canon est
fixé à un vaisseau. Interface façon *LEGO Star Wars* sur Switch, carte du monde façon *Donkey Kong Country*.

Aucun outil de build : ouvrir `index.html` (ou servir le dossier). Tout est en JavaScript et canvas.

## Comment ça marche

- **La Mer des pirates, monde caché** (`CB.WORLDS[6]`, `hidden: true`, `tier: 1.2` → `CB.tierOf` pour PV / vitesse / or / XP d'un monde 2 ;
  `S.worldUnlocked` le réserve à `profile.pirateWorld`, gagné en réussissant le bateau 1-9 (`reward: 'pirateWorld'`, `wave.pirateWorldWon`) ;
  sur la carte du monde 1, une passerelle (`M.GATE`, `gate` dans `M.draw`, `profile.pirateShown` anime le chemin) mène à l'île bleue ;
  il n'apparaît dans « Mondes » qu'une fois trouvé et ne compte pas dans `S.completion`). Même décor que la mer (`scene: 'mer'`,
  `boat`), `world.dodge` : ◀ ▶ (flèches, A/D, stick, boutons tactiles `#dodge-btns`) déplacent le canon (`wave.px`, `Wave.move`),
  le viseur ne bouge plus qu'en hauteur. Cinq tableaux (`waveDef` pour `w.id === 'pirates'`) : L'abordage (40 à abattre), Tempête
  de boulets (survivre 90 s), La flotte (`type: 'sink'` : couler 8 bateaux, `wave.shipsSunk`), Le vaisseau fantôme (survivre 120 s,
  `ramp`), Le Léviathan (boss). `def.ships { first, every: [début, fin], kinds, max }` fait arriver les **bateaux pirates**
  (`def.ship`, `swim`, `anchor` = ils jettent l'ancre à cette distance, `spit` avec `salvo`) : chaloupe (1 canon), brigantin (2,
  louvoie), galion noir (3, voiles noires), vaisseau fantôme (`ghostly`, boulets fantômes rapides) ; leurs boulets (`bouletCanon`,
  `bouletFantome`, `bombeNoire`, `shot`) visent la position du canon au départ (`e.tx`) : on les abat d'un tir ou on se tasse
  (« RATÉ ! », `wave.dodged`). Nouveaux monstres marins : murène, tortue géante, poisson volant. **Boss à deux étapes**
  (`def.bossFull` : un seul grand combat dès le niveau 5) : le Léviathan (`swim`, `sea`, pouvoirs `rayonMer` = `wave.beam`,
  charge 1,25 s visible (`R.beam`) puis frappe si le canon est resté dans la ligne, `vague`) plonge à 20 % de ses PV (`def.next`,
  `def.nextAt`, `e.diving`) et le Capitaine Crochet arrive en navire aux voiles rouges (`bordee` six boulets, `bombarde`,
  `abordage` chaloupes, `canonnade`). Le couler donne le **pouvoir pirate** (`reward: 'pirate'`), qui n'est plus donné par 1-9.
- **Canons dessinés** (`CB.CANNONS[k].look` → `LOOKS` dans render.js) : le canon de pirate (fonte noire à bandes, affût de bois,
  roues de bois, mèche allumée) et le canon confetti (canon de cirque bleu à bandes jaunes, bouche rayée, manivelle, pompon) ont
  leur propre dessin de dos (combat) et de profil (hangar), d'après les visuels de Matthieu. Le hangar montre le niveau et la barre d'XP.
- **Carte** : six mondes de cinq tableaux. Tableaux : abattre N ennemis, survivre, contre la montre, grande vague, boss.
  Trois étoiles si le canon finit avec 70 % de ses points de vie ou plus.
- **Or** : 1 pièce par ennemi au premier monde, +1 par monde. Les ennemis spéciaux donnent ×5, les boss ×40, et les
  combos (ennemis abattus à la suite) multiplient jusqu'à ×1,5 (paliers de couleur : or ×2 / ×4 / ×8, coffre ×2, casino de Jessica ×2, bonus de temps = secondes / 12, coût des améliorations doublé : base ×2 puis ×1,65 par niveau). L'or et l'XP restent acquis même quand on est détruit
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
- **Tableau 1-1 depuis le 2026-10-30** : le tableau relié `tableaux/tableau-foret-1.json` (« Niveau 1-1 », 100 à abattre, séquence de
  chauves-souris et hiboux) remplace la nuit sans fin ; ses secrets sont réglés dans le JSON (`chestAt` / `chestEvery` / `portalAt`),
  les 100 kills cumulés (`profile.nightKills`, comptés par `CB.claim` au 1-1 quel que soit le type, comme `discovered` et `portal`)
  révèlent toujours le tableau 2. L'écran de résultat n'a plus de bouton Hangar (Carte · Rejouer · Suivant).
- **Secrets de la nuit sans fin (ancien 1-1, toujours dans le code)** : rien n'est annoncé au joueur. Cent monstres abattus (cumulés, `profile.nightKills`)
  révèlent le tableau 2 ; depuis le 2026-10-30 chaque étoile ouvre le tableau suivant (2 → 3 → 4 → 5, `S.revealed`) et les coffres
  mystères ne donnent plus que de l'or ; après 2 minutes dans une partie passe
  une seule fois un **coffre doré** : le toucher ouvre un portail bleu façon Diablo (`Wave.openPortal`, `Render.portal`,
  `CB.PORTAL_TIME`) qui nous transporte tout de suite, sans finir le tableau, dans le passé.
- **La Vallée des dinosaures (1-6)** : tableau secret relié au tableau 1 par un chemin bleu sur la carte (`world.secret`,
  `CB.wavesOf`), sans fin lui aussi (`CB.ENDLESS_DINOS`, décor `prehistoire` : montagne enneigée, volcan, palmiers), vingt
  vrais dinosaures (`CB.DINOS`, traceur paramétré `dinoDraw` dans render.js). On y arrive avec ses cartes, son niveau de
  partie et sa vie (`carry` du constructeur de `CB.Wave`).
- **Événements loufoques** (`CB.EVENTS`, `Wave.triggerEvent`, tableaux normaux seulement : ni nuit sans fin, ni nuée, ni boss, ni mini-jeu ; premier entre 25 et 40 s puis
  toutes les 40 à 60 s) : *boucliers magiques* (`bouclier`, `shieldAll` : tant qu'un bouclier tient, aucun monstre ne
  prend de dégât, « CASSE LES BOUCLIERS ! »), *bombe surprise* (bombe magique à z 9, mèche 2,5 s), *puzzle 1-2-3*
  (`orbe`, `wave.puzzle`, le temps s'arrête, tirer dans l'ordre en 14 s = or + XP, mauvais ordre = on recommence).
- **Étourdissements et états** (`CB.STUN`, `wave.stun`, `Wave.stunBy/mash/freeStun`, `Render.stunFx`) : les monstres
  à `touch` (clown électrique, spectre et robot de glace) n'enlèvent pas de vie au contact mais étourdissent : impossible
  de tirer, il faut taper vite sur tirer (8 ou 10 fois, souris, touche, bouton ou manette) ou attendre 6-7 s. Les tirs à
  `status` empoisonnent (`wave.poison`, 1,5 PV/s pendant 5 s, jamais sous 1 PV) ou aveuglent (`wave.dark`, 4 s, on ne voit
  qu'autour du viseur). Les boucliers (talent de Marie, Prière, fantôme, bulle) protègent.
- **Nouveaux monstres des mondes 2 à 6** (`Wave.pickWorldEnemy` : les trois premiers du roster tout le temps, les
  spéciaux à partir du deuxième tableau du monde, après 25 s et une fois sur quatre) : cracheurs (`spit` : jongleur et dragonnet → `feu`, qu'on peut faire exploser
  (`explode`, ×2,5 autour) ; crapaud → `poison` ; sorcier noir → `magieNoire`), soigneurs (`heal` : +1 PV aux monstres
  proches toutes les 1,6 s, rayon vert, à abattre en premier), clown électrique, spectre et robot de glace (`touch`).
- **Tableau 1-3 « Les deux cents » et le mini-jeu 1-7** : le 3 s'ouvre avec une étoile au 2 (`S.revealed` séquentiel : 100 monstres → 2,
  puis une étoile ouvre le suivant) ; 200 à abattre, première vague de 16 chauves-souris (`def.sequence`, même mécanique
  que l'éditeur), monstres de la nuit de plus en plus forts (`def.ramp` : +30 % de PV et +5 % de vitesse toutes les 40 s) ; trois
  cibles 🎯 (`def.targets.at`, ennemi `cible`, flag `target`) passent à 12, 30 et 48 s. Les détruire se cumule dans
  `profile.targetsHit` ; à 3, le nœud 7 (`world.extra`, chemin doré) se révèle (`profile.targetsShown`). Le 1-7 « Tir aux
  cibles volantes » (`type: 'cibles'`, `def.cibles`) : 30 cibles ailées (`cibleAilee`, `flyer`, `Wave.spawnFlyer`)
  traversent le ciel, un tir suffit, aucun monstre ; médailles `CB.MEDALS` par % détruit (50 / 75 / 90 / 100 % = bronze,
  argent, or, diamant = 1 à 4 étoiles, `CB.medalStars`, `wave.medalMax`). Tous les réglages des deux mini-jeux ont des défauts
  dans `CB.MINIGAMES` (`CB.minigame(type, o)` complète un objet partiel et garde tel quel un objet complet, donc l'éditeur
  Debug les modifie en direct ; dans les groupes de la séquence, `elite` se règle par sorte avec le bouton ⭐, l'ancien drapeau de
  groupe est converti) : cibles = `count`, `every` / `speed` / `height` / `depth` = [début, fin], `move`
  (`CB.MOVES` : vagues, droit, zigzag, rebond, piquee, spirale → `Wave.flyStep`), `side` (`CB.SIDES`), `kind` (n'importe quel
  monstre devient une cible à un coup : `e.target`, `e.flyer`), `medals` ; brigands = `rounds`, `panels`, `bads`, `bad` / `good`
  (monstre dessiné sur la pancarte : `e.face` → `R.enemyIcon` dans `panelBoard`), `show` = [début, fin], `gap`, `rise`,
  `spacing`, `y`, `z`, `medals`. Triche : sur la carte, taper « boom » ou toucher 7 fois le nom du monde → `S.cheatUnlock`.
- **Réglages** (⚙️ sur le titre et dans la pause, dialogue `#settings`) : deux barres de volume, effets sonores
  (`CB.Audio.setVolume`, gain maître WebAudio) et musique (`CB.Music.setVolume`), chacune avec un bouton qui coupe d'un
  coup ; mémorisées dans `settings.soundVolume` / `settings.musicVolume`. En bas, la zone « Données du jeu » avec le
  bouton rouge **Tout effacer** : dialogue de confirmation (`#confirm-wipe`) dont le bouton rouge ne s'active qu'après un
  compte à rebours de 3 s, puis `CB.Save.wipe` vide `localStorage` et la page se recharge.
- **Musique de fond** (`js/music.js`, `CB.MUSIC`) : 21 pistes MP3 de Kevin MacLeod (incompetech.com, CC BY 4.0, crédits
  dans `assets/music/LICENSE.txt` et dans l'aide du jeu), organisées en listes de lecture par contexte (menus, chaque
  monde, la vallée des dinosaures, le boss) : le thème du contexte d'abord, puis les morceaux s'enchaînent avec fondu
  sans boucler, et chaque contexte reprend où il en était. Volume et coupure dans ⚙️ Réglages (`settings.music*`).
- **Mère protectrice de Marie** (`fx.protect` 12 s, `Render.loveDome`) : 4 boucliers, +20 PV, soin de 2 PV/s, dôme rose
  avec cœurs qui tournent et pluie de cœurs ; tout monstre qui passe sous z 13 est repoussé de 30, figé 0,8 s et blessé ×3
  (« PAS TOUCHE ! », burst `hearts`).
- **Fantôme d'Eliott** (`fx.ghost` 8 s, `wave.spirits`, `updateSpirits`, `Render.ghostMode/spirit`) : héros translucide
  qui flotte, boulets fantômes (`ball.ghost`) perforants +50 %, invulnérable, brouillard et feux follets ; trois esprits
  foncent sur un monstre à la fois, le font reculer de 18 (« BOUH ! ») et le blessent ×1,5.
- **Blizzard d'Émily** (`fx.blizzard` 12 s, `Render.blizzard`) : gel de 3 s, puis ennemis à 45 % de vitesse et dégâts de
  froid toutes les 0,25 s ; grosse neige poussée par le vent, bourrasques, givre sur les bords.
- **Cri du capitaine de Josué** : 30 s de dégâts doublés, ondes sonores rouges devant le canon.
- **Tornades d'Edison** (`fx.tornado` 10 s, `wave.tornadoes`, `updateTornadoes/sweepStep`, `Render.tornadoes`) : trois
  entonnoirs géants qui grandissent en 1,5 s, vent qui tire les monstres vers eux, puis `e.swept` : ils tournoient en
  montant, s'estompent (`e.alpha`) et meurent (`killedBy` tornade, or et XP donnés) ; les boss prennent des dégâts.
- **Aimant à or de Jessica** : 30 s d'or triplé avec `Render.casino` (ampoules clignotantes tout autour de l'écran, pluie
  de pièces qui tournent, texte JACKPOT).
- **Téléportation de Jérémie** (`fx.teleport` 6 s, `wave.vortex`, `warpStep`, `Render.vortex`) : vortex violet dans le ciel,
  les monstres spiralent dedans en rétrécissant (`e.warp/warpScale`) et réapparaissent 70 unités plus loin, figés 2,5 s ;
  invulnérable, images rémanentes violettes du héros, boulets à halo violet, étincelles.
- **Zoom-zoom de Milo** : 8 s au ralenti (ennemis à 40 %), cadence ×2,5, focus façon Snow Kids (`wave.zoomFx`,
  `Render.zoomFocus`) : zoom caméra de 5 % avec punch au départ, vignette bleue, traînées de vitesse sur les côtés,
  écho flou des monstres, anneaux qui se resserrent sur le viseur (dessiné hors zoom, donc toujours sous la souris).
- **Laser de Mickaël** : 10 s (`fx.laser`), `wave.laserGrow` passe de 0,2 à 1 en 2,5 s (largeur, lueur, rayon de
  touche et dégâts par tick grandissent avec).
- **Pika-choc d'Adam** : jauge de 10 monstres seulement ; `fx.pika` 2,5 s : textes « PI… KA… CHUUUUUU !!! », flash,
  tout le monde figé, foudre en chaîne toutes les 0,2 s (×4 dégâts au total), voile jaune qui clignote et éclairs dans
  le ciel ; cri synthétisé `pikachu` dans audio.js.
- **Pouvoirs débloqués en avançant** : la *Sphère protectrice* (`CB.ITEMS.sphere`, `unlockWorld` 0 = monde 1 réussi,
  600 pièces, `wave.sphere`, `updateSphere` : tout monstre sous z 11 est brûlé ×0,6 toutes les 0,35 s et repoussé ;
  `Render.sphere`) et les *Tours de défense* (`CB.TOWER`, monde 2 réussi, 700 puis 1200 pièces, max 2, gauche puis droite,
  `wave.towers`, `updateTowers`, dégâts ÷ 2, `Render.tower`). Tant qu'ils sont verrouillés, le hangar les montre en « ??? »
  avec un indice. Il reste une tuile « ??? » pour la suite.
- **Deuxième coéquipier** (`profile.ally2`, `ally2Bought`, `S.buyAlly2/setAlly2`, 700 pièces) : à droite du canon, en
  miroir (`wave.ally2`, `makeAlly(id, side)`), avec sa propre attaque spéciale décalée. L'onglet Équipe offre « ← Gauche » /
  « Droite → ».
- **Niveaux de l'attaque spéciale** (`CB.SPECIAL_LEVELS`, `profile.specialLevel`, `S.buySpecialLevel`, tuile dorée du
  hangar) : niv. 2 au niveau 9 du personnage (300 pièces : durée ×1,25, force ×1,3, jauge −15 %), niv. 3 au niveau 20
  (800 pièces : ×1,5, ×1,6, −30 %). `wave.spPower` multiplie les dégâts des attaques. Mickaël a ses propres paliers
  (`levels`) : laser petit et court (6 s, taille 60 %), gros et long (10 s), bleu et plus fort (12 s, 115 %, `laserLevel` 3).
- **Objets uniques du hangar** (`CB.ITEMS`, `profile.items`, `S.buyItem`, tuile dorée dans l'onglet Améliorations) : achetés
  une fois, permanents. Premier objet « Jauge pleine » (450 pièces) : `stats.fullCharge` fait démarrer chaque tableau avec
  la jauge d'attaque spéciale pleine. Deux tuiles « ??? » restent pour la suite.
- **Le Code de triche de Matthieu** : jauge de 40 monstres (le double des autres), puis un claquement de doigts : flash
  blanc, rayons de lumière qui tombent du ciel (burst `snap`), chaque monstre se fige, blanchit et s'évapore à son tour
  (`e.vanish`, sans explosion ni « pop », `e.quiet`), les boss perdent ×10 dégâts et la vie revient au maximum. Son `snap`.
- **Écran « Choisis ton évolution »** (`showLevelUp`, `.talent-grid`) : six grosses tuiles carrées arrondies (icône + nom),
  gros nombre du niveau (ou MAX), gros « + » ; la tuile et le « + » dépensent un point, animations survol / clic / pop.
  Aucune statistique affichée. Les bombes magiques du tableau 1-2 rougissent et pulsent de plus en plus vite avant
  d'exploser (`heat` dans `E.bombeMagique`). Le « Texte affiché » d'un tableau de l'éditeur apparaît dans un encadré
  sous l'étiquette en haut à gauche (`#wave-text`, seulement pour les tableaux personnalisés).
- **Le méga boulet de Richard** (`ball.mega`, `Render.megaBall`) : Richard part avec `size` 2 (perk `mods.size`) ; son attaque
  lance un seul boulet de fer incandescent (taille ≥ 18, dégâts ×12, perforant, ×1,7 en vitesse) en ligne droite à
  travers tout le ciel, avec secousse d'écran continue et un coup à chaque monstre touché.
- **La Prière de Josée** (`fx.priere`, `wave.angels`, `Wave.updateAngels`, `Render.angel/prayerSky/holyShield`) : flash blanc
  (`wave.flash`), grande lumière à rayons tournants dans le ciel, deux anges qui descendent et lancent des rayons de lumière
  (dégâts ×1,2) pendant 15 s, bouclier sacré à la croix autour du canon (aucun dégât, texte « PROTÉGÉ ! ») et +40 % de PV.
- **Attaque spéciale du coéquipier** : `wave.ally.special` est celle du membre recruté, lancée par `Wave.castSpecial` depuis
  la gauche à `CB.HELPER.specialFirst` (25 s) puis toutes les `specialEvery` (45 s) secondes ; les attaques à durée
  (`CB.SPECIAL_FX`) bloquent la jauge du joueur tant qu'elles sont actives (`specialBusy`, `specialLeft`).
- **La licorne d'Alexie** (`fx.licorne`, `wave.unicorn`, `Wave.updateUnicorn`, `Render.unicorn`, `Render.rainbowSky`) : pendant
  15 s une licorne ailée vole en huit devant la scène et lance un rayon arc-en-ciel toutes les 0,8 s sur un monstre au
  hasard (dégâts ×1,5), nos boulets font ×2 et deviennent des boules disco à traînée magique (`ball.disco`), un
  arc-en-ciel géant, des nuages et des étincelles couvrent le ciel, et la jauge (rose) ne se recharge pas tant qu'elle est là.
- **Attaque spéciale par personnage** (`CB.SPECIALS`, `Wave.useSpecial`) : la jauge en bas à gauche se remplit avec
  les monstres abattus (15 à 20 selon le personnage, un boss en donne la moitié), puis Maj / X / bouton X de la manette
  ou toucher la jauge la déclenche. Chaque membre de la famille a la sienne, du même nom que son talent passif : code de
  triche (tirs critiques + boulet de plus), prière (soin + boucliers), boulet du vétéran (géant perforant ×12), lunettes
  laser (rayon 3 s sous le viseur), mère protectrice (boucliers), pika-choc (foudre sur tous), zoom-zoom (ralenti +
  cadence ×2), téléportation (ennemis renvoyés + invulnérable), aimant à or, tornade, cri du capitaine (gel + dégâts ×2),
  blizzard, fantôme (invulnérable + perforant), licorne (salve de 7 explosifs), fusée (grosse explosion). Les effets
  temporaires vivent dans `wave.fx` et se dessinent dans `Render.specialFx`.
- **Tableau 1-2 « La nuée de chauves-souris »** (type `swarm`) : que des chauves-souris pendant 5 minutes, de plus en
  plus éparpillées dans l'écran et de plus en plus dures (`swarm.ramp` : vitesse +55 %, chauves-souris rouges dès 100 s,
  dorées dès 200 s, violettes dès 255 s, par paires après 80 s, grosses chauves-souris `def.big` 2× plus grosses et
  résistantes). À 300 s, `startOutro` fait passer un méga dragon de profil (`R.dragon`, sfx `roar`) qui chasse tout ce
  qui reste hors de l'écran (`e.flee`) ; le tableau se termine quand tout le monde est sorti, et des bombes magiques (`bombeMagique`, `def.hazard`) posées dans un cercle magique
  avec un décompte de 3 s : tirer dedans la fait disparaître, sinon elle explose et enlève des vies. Pas de compte à
  rebours : on tient le plus longtemps possible, étoiles à 1, 3 et 5 minutes, bouton « Terminer » pour arrêter.
- **Tableau 1-4 « Cent secondes »** : survivre 100 s, dense (`density` 1,9, `ramp` toutes les 25 s) ; son étoile ouvre le boss.
- **Monde 1, tableaux 3 à 5** (`def.night`) : les monstres de la nuit sans fin reviennent dans le même ordre, sans
  paliers de couleur, avec le temps de la nuit compressé (`timeScale`) pour que seuls les premiers styles arrivent,
  mais plus rapides (`speed`).
- **Boss en trois actes** (dernier tableau de chaque monde ; le Roi des chauves-souris a 600 PV, 200 par acte ; grande barre
  de vie en haut avec les PV affichés) : on abat des monstres jusqu'au niveau de partie 5
  (`CB.BOSS_LEVELS`, XP ×`CB.BOSS_XP`), le boss sort seul et il faut lui enlever un tiers de ses PV ; il s'enfuit, on
  remonte au niveau 10, il revient avec de nouveaux pouvoirs (`CB.BOSS_POWERS` : tir rapide, boulet lourd, éventail,
  bombe à retardement qui s'arrête et explose si on ne la détruit pas, rayon chargé), puis l'acte final au niveau 15.
  Toutes ses attaques sont des projectiles (`def.shot`) qu'on peut faire exploser avant qu'ils nous touchent.
- **Fiche du canon bicolore** : dans le hangar, chaque barre montre la part du personnage (talents + talent de famille,
  jaune) et la part du canon (améliorations + canon équipé, bleu), d'après `CB.STAT_PER`.
- **La Vallée des dinosaures, suite** : des cadeaux étoilés passent régulièrement (`cadeau`, `def.gift`) : les tirer ouvre
  un choix de trois cartes. Après 10 minutes (`CB.ENDLESS_DINOS.miniBossAt`), le mini-boss « Le Mégaoiseau du temps »
  (`CB.BOSSES.oiseauTemps`, `Wave.spawnMiniBoss`) arrive : il pose des cristaux du temps (`cristal`, `def.crystal`) qui le
  rendent intouchable tant qu'on ne les a pas tous cassés, et lance des rochers (`rocher`, projectiles à faire exploser).
  À la moitié de ses PV, stade 2 : rouge de colère, fumant, avec la pluie de rochers et le rugissement (étourdit le
  canon, secoue l'écran, lâche des compys). Le vaincre ne termine pas la vallée.
- **Barre de vie** : bleue, jaune sous 55 %, rouge clignotante sous 25 %.
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
  (`CB.HALLOWEEN`) arrivent un à un selon `CB.ENDLESS.firstAt` (un nouveau toutes les 45 s), chacun en 4 paliers de couleur (`CB.TIERS` : normal, rouge,
  doré, violet = 80 variantes), avec des PV qui montent avec le temps. Des coffres mystères passent régulièrement : les
  toucher ou les abattre révèle un nouveau tableau (2 à 5) sur la carte, dessiné avec une animation de chemin et d'étoiles
  (`profile.discovered` / `profile.shown`). La nuit se termine à la mort ou via « Terminer la nuit » : étoiles selon le
  temps survécu (90 s, 180 s, 300 s).
- **Zone d'apparition responsive** : la demi-largeur et la hauteur où les monstres peuvent se trouver (`CB.VIEW.spread`,
  `spreadY`) sont calculées d'après l'écran, à la profondeur où ils nous atteignent. Tous les appareils voient donc tous
  les monstres ; 35 % des arrivées sont « larges » (jusqu'au bord), les autres plus groupées au centre.
- **Billes** : au départ, le canon tire de petites billes. La carte « Boulets géants » les grossit de 30 % à chaque prise
  et se cumule sans limite (130 %, 169 %, 220 %, 286 %…).
- **Bestiaire** : le panneau d'objectif de la carte ne montre que les monstres déjà vus et abattus au moins une fois
  (`profile.seenBy` / `profile.killsBy`), sinon un « ? ».
- **Pictogrammes des cartes** : chaque pouvoir a sa tuile colorée dessinée au canvas (`Render.cardIcon`), reprise dans
  la rangée des cartes acquises. Le héros sur son chariot (`Render.battleCannon`) sert partout : titre, carte, hangar, vague.
- **Niveaux dans la vague** : l'XP des ennemis remplit une jauge (`CB.runXpFor`) ; chaque niveau gagné pendant la
  vague offre un tirage de trois cartes, les niveaux en attente s'enchaînent. Les variantes spéciales ne donnent plus de
  cartes : XP ×5 et or ×2.
- **Boulets** (`CB.BALLS`, traceurs `BALL` et traînées `TRAIL` dans render.js) : onze nouveaux (Cœurs, Bonbons, Ballon de
  basketball, Ballon chasseur, Pommes, Bananes, Rondelle de hockey (vraie galette de caoutchouc vue de trois quarts, bord strié qui défile, logo bâtons croisés), Étoiles, Pokéball, Bloc de terre façon Minecraft, Bill
  Boulet à la Mario) ; Boule disco refaite (rayons tournants, halo, miroirs qui scintillent), Citrouille sans traits,
  Ballon de soccer avec vrais pentagones ; « Petite planète » devient **Galaxie** (`CB.GALAXY`, `PLANET` : une des neuf
  planètes ou le Soleil tirée au hasard par boulet via `b.variant`, anneaux derrière puis devant). La Boule de feu traîne
  une vraie comète de feu (`TRAIL.flames` : corps continu rouge/orange/jaune qui monte et tremblote, braises, fumée ; les
  traînées gardent 12 points au lieu de 8) et porte des flammes qui lèchent son sommet. Les vieilles sauvegardes
  avec `planete` passent à `galaxie` au chargement.
- **Performance** : jamais de `c.filter` (blur, etc.) par monstre et par image : l'écho de mouvement du Zoom-zoom le
  faisait et figeait le jeu dans une nuée (dizaines de monstres). L'écho se dessine maintenant sans filtre, en
  transparence, et seulement s'il y a 18 monstres ou moins.
- **Bateau volant secret (1-2)** : à 40 s (puis toutes les 75 s tant qu'il n'est pas brisé), un bateau pirate volant
  (`bateauVolant`, `cross`, `hits: 3`, `secretBoat`) traverse la nuée de gauche à droite ; chaque boulet compte pour un coup
  (`applyDamage`), au troisième il se brise (« UN NOUVEAU SECRET S'EST OUVERT SUR LA CARTE ») et `profile.boatSecret`
  ouvre le tableau 1-9 (`S.waveUnlocked`, `nextReveal`), même si la nuée est perdue. Il ne repasse plus une fois trouvé.
- **La mer des monstres (1-9)** : `type: 'survive'` 300 s, roster de monstres marins (`swim: true` : requin, piranha,
  pieuvre, crabe géant, méduse, serpent de mer) : leur corps est à y ≈ 0 et `R.enemy` coupe tout ce qui est sous la ligne
  d'eau projetée (`waterBack` : ondes derrière ; `waterFront` : écume, gouttes, sillage devant), donc à moitié immergés et quelques
  chauves-souris dans les airs. Les nageurs ne « nous atteignent » jamais : arrivés à la coque (`CB.SEA_BITE.z`, `Wave.sea`),
  ils restent là tant qu'on ne les tue pas et attaquent le bateau (`biteStep`, `e.bite`, `e.jump`) : bond hors de l'eau vers la
  coque toutes les ~2,6 s (le corps sort de l'eau, penché, avec gerbe de gouttes), « CROC ! », dégâts × 0,5, éclaboussure
  (`burst 'splash'`, sfx `splash` / `bite`, compteurs `wave.splashes` / `wave.bites`). Un boulet qui tombe dans l'eau (y ≤ 0 sur
  la mer) coule avec la même éclaboussure (anneau, écume, colonne d'eau, gouttes). La voile s'arrête au-dessus de l'horizon
  (`R.shipMast`) pour que les monstres à la coque ne passent pas devant elle ni devant le pavillon.
  Jamais plus de 4 monstres vivants en même temps (`def.maxAlive`, aussi `custom.maxAlive` dans l'éditeur).
  Réussir donne le **pouvoir pirate** (`def.reward`, `wave.pirateWon`, `profile.pirate`).
- **Bateau pirate volant** (`CB.SPECIALS.pirate`, `CB.PIRATE`, `S.togglePirate`, `S.buyPirateLevel`) : au hangar, onglet
  Pouvoirs, tuile « Bateau pirate volant » : « Utiliser à la place » remplace le pouvoir du personnage
  (`profile.usePirate`, `wave.special.id === 'pirate'`), cinq niveaux = cinq bateaux (`special.ships`). En jeu : 15 s
  (`fx.pirate`, `wave.pirates`, `updatePirates`), chaque bateau traverse le ciel, fait demi-tour aux bords et canonne le
  monstre le plus proche avec ses trois canons (boulets `pirate`, `straight`, visée anticipée) ; rendu `shipSprite` /
  `R.pirateShip`, son `cannon`.
- **Arrivées de l'éditeur en séquence** (`custom.sequence`, lu dans `Wave` via `this.seq`, `CB.SEQUENCE_GAP`) : liste
  ordonnée de groupes ; un groupe = plusieurs sortes × nombre, mélangées au hasard, sorties une par une toutes les
  `every` s ; sans « À (s) » le groupe part 1,5 s après l'élimination du précédent (le premier à 1 s), avec « À (s) » il
  part à ce moment dès que son tour vient. Onglet Arrivées : clic sur un monstre = nouveau groupe, « ➕ monstres » cible un
  groupe pour y mélanger d'autres sortes (re-clic = +1), glisser-déposer ou ▲▼ pour l'ordre, élite par groupe. L'ancien
  format `spawns` reste lu par le jeu et est converti à l'ouverture (`D.normalize`). Les champs de l'onglet Objectif
  (à abattre, secondes, nom, texte) s'appliquent en direct à la vague en cours (`live()`, `app.refreshWaveTag`).
- **Panneau Debug** (`js/debug.js`, joueur matthieu) réorganisé : en-tête fixe (pause, recommencer, vitesse en segments,
  quatre tuiles d'état), quatre onglets (Objectif, Visuel, Monstres = la séquence d'arrivées, Fichier) ; l'interrupteur « monstres
  aléatoires du monde » et la densité sont dans Objectif ; un écart de 0 s fait sortir tout le groupe d'un coup ; départ d'un groupe au choix : après l'élimination du
  groupe d'avant, à un temps absolu (`at`) ou relatif ± s à la fin des arrivées du groupe d'avant (`rel`, plusieurs groupes
  peuvent être actifs en même temps, `seq.active`) ; « ➕ Ajouter un monstre » ouvre un menu dans la carte (icône, nom,
  difficulté en nombre, chauve-souris = 2, sans plafond : PV × (1 + dégâts/20) × (0,5 + vitesse/8), `D.power`) ; bandeau « Groupe k / n » et cartes colorées pendant le
  test (`Wave.seqStatus`) ; bouton « ⟩ Cacher » et bouton flottant 🐞 pour ramener le panneau (`D.hide`) ; réglage
  « Largeur du cône d'apparition » 20–100 % (`custom.spread`, jamais plus large que la zone visible) ; la liste des monstres finit par les boss (`boss:clé`,
  `spawnBoss(key, full)` : un seul combat, tous les pouvoirs, pas de fuite ; le Mégaoiseau garde ses deux stades) ; pied fixe « Appliquer » ; poignée jaune sur le bord gauche
  pour étirer le panneau (`--dbg-w`, largeur gardée dans `localStorage`, double-clic = 360 px).
- **Tableau 1-9 « Les géants de la mer »** (`world.extra3 { vi: 8, from: 1 }`, ouvert en réussissant le tableau 2,
  `profile.boatShown`) : tableau d'abattage (20) sur la mer (`scene: 'mer'`, `CB.SCENERY.mer`, `R.sea` : nuages, îles,
  vagues) depuis un bateau pirate (`def.boat` : `R.shipMast` derrière les monstres, `R.shipHull` devant, sous les canons).
  `def.roster` remplace les monstres du monde (dix dinosaures), `def.giant` les grossit (×1,6 taille et PV) ; sur la mer,
  les volants (strafe, archéoptéryx) arrivent à 9-15 de haut, les autres nagent à 2,5-5. Étiquette « 🏴‍☠️ BATEAU PIRATE ».
- **Hangar sur la carte** (`M.HANGAR`, `M.hangar`, `M.hangarAt`) : un bâtiment à toit arrondi avec l'enseigne « 🔧 HANGAR »
  dessiné sur l'île de chaque monde ; cliquer dessus ouvre la boutique (le bouton Hangar reste aussi).
- **Bonus famille** (`CB.FAMILY_BUFF`, `wave.familyBuff`) : héros + ses deux coéquipiers de la même famille = +10 % de cadence
  pour les trois (les alliés rechargent avec `stats.rate`), texte au départ et `R.familyAura` (halo de la couleur de la
  famille, étincelles, petit écusson) sous chaque canon.
- **Écrans** : plus de slogan sur le titre ; « Comment jouer » est un dialogue style réglages (cinq étapes numérotées, un
  bouton « C'est parti ! », crédit musique en petit) ; l'écran Personnages a des écussons de familles (SVG, comme Ballon
  chasseur), un titre dégagé des onglets, une fiche avec `CB.PERK_SHORT` (bonus en trois mots) et `CB.SPECIAL_FUN` (pouvoir
  en une phrase rigolote), de gros chiffres et sans canon ni ennemis abattus. Les pastilles A / B / L / R des boutons
  n'apparaissent que lorsqu'une manette est branchée (`body.pad`, posé par `Input.poll`).
- **Mini-jeu 1-8 « Le brigand et les civils »** (`type: 'brigands'`, `world.extra2 { vi: 7, from: 3 }`, ouvert en réussissant
  le tableau 4, `profile.brigandsShown` pour la révélation sur la carte) : 12 rounds ; à chaque round trois panneaux de bois
  se lèvent à gauche, au milieu et à droite (`spawnRound`, ennemis `brigand` / `civil` avec `def.panel`, `e.panel.up` anime
  la montée/descente, visibles 3,2 s → 1,7 s). Tirer le brigand = +1 et les autres panneaux redescendent ; tirer un civil
  = « OUPS ! » et −1. Score = brigands − civils sur rounds × méchants ; médailles à 50 / 75 / 90 / 100 % (diamant). Les cibles ailées du mini-jeu 1-7
  volent deux fois moins vite qu'avant.
- **Cartes uniques** (`CB.UNIQUE_CARDS`, `max: 1`, `instant: true`, proposées dès le début, jamais reproposées une fois
  prises, pas rejouées au portail) : Renfort (`callGuest` : un membre de la famille au hasard tire 30 s à côté de nous,
  `wave.guest`, à droite si la gauche est prise, plus loin à gauche si les deux le sont), Grosse bombe (`blastAll`),
  Coup spécial (`fillCharge`), Horloge (`freezeAll(8)`). Titre sans chiffre romain, étiquette « Carte unique ».
- **Case vierge / deuxième pouvoir** (onglet « Pouvoirs » du hangar, `CB.SLOT2` : case 2500, pouvoir 3000, `S.buySlot2`,
  `S.buyPower2`) : n'importe quel pouvoir de la famille sauf le sien ; racheter un autre remplace celui de la case. En jeu,
  `wave.special2` a sa propre jauge `charge2` (bouton rond plus petit, touche C ou Y de la manette, `useSpecial2`), et le
  niveau d'attaque spéciale du hangar vaut pour les deux.
- **Jauge spéciale** : remplie par l'XP brute des monstres (élite ×5, palier de couleur, boss ×40 plafonné à la moitié) via
  `spNeed(sp, uses)` = `kills × xpPerKill(monde)`, et chaque lancer du tableau rend le suivant 35 % plus long
  (`CB.SPECIAL_RAMP`, plafond ×4) : Adam n'a plus son Pikachu en continu quand il y a foule.
- **Tête chercheuse** (`CB.HOMING`, débloquée en réussissant le monde 3, 5 niveaux de 500 à 2800 pièces) : `homeBall` tourne
  chaque boulet vers le monstre le plus proche, seulement s'il est à moins de `range` unités (12 → 24) et avec un virage
  limité (`turn` 1,4 → 3,8 rad/s), donc jamais parfait ; anneau jaune pointillé sur un boulet verrouillé.
- **Coffre doré** (portail, tableau 1-1) : 6 s pour le toucher (`def.life`), puis il s'efface avec « ENVOLÉ… ».
- **Pikachu** : son refait avec de vraies voix WebAudio (pi, ka, CHUUU vibré) et éclairs dentelés `R.lightning`.
- **Les boss sont gigantesques** (`CB.BOSS_SCALE` 2,6 : dessin, zone de visée et de collision multipliés ; ils planent
  plus loin, à z 34, et plus bas pour tenir à l'écran).
- **Les boss résistent aux attaques spéciales** (`CB.BOSS_SPECIAL`) : laser, licorne, anges, fusée, Pikachu, tornades,
  blizzard, triche et méga boulet ne font que 35 % de leurs dégâts sur un boss, et au plus 12 % de ses PV par lancer
  (`wave.spBossDealt`, remis à zéro à chaque `useSpecial`) ; au-delà, « IL RÉSISTE ! ».
- **Niveaux de cartes et combos secrets** : chaque carte monte jusqu'au niveau 3 (les boulets géants sans limite) ; le
  niveau s'écrit en chiffres romains dans le titre de la carte (`CB.roman` : « Gel II », « Nova I ») et sous l'icône du HUD.
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
js/custom-waves.js         registre des tableaux personnalisés reliés à la carte (CB.CUSTOM_WAVES) : le 1-1 y est (tableaux/tableau-foret-1.json)
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
