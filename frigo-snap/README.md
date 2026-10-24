# Frigo Snap

Jeu de photo sur rails en JavaScript (HTML5 Canvas, aucune dépendance), inspiré de **Pokémon Snap** sur Nintendo 64 :
un demi-avocat à roulettes suit les rails à travers un frigo, et le joueur photographie les créatures nées des restes
oubliés. À la fin de chaque virée, le **Chef Fernand « Le Fin Museau »** (un rat-taupe nu en toque, bureau dans un
grille-pain) juge un cliché par espèce.

## Lancer le jeu

Ouvrir `index.html` dans un navigateur suffit. Pour un serveur local : `python3 -m http.server 8000`.

## Règles

- **Virée** : le chariot avance tout seul (~110 s). On est minuscule : le décor (bocaux, canettes, brocolis…) est à l'échelle
  d'un dinosaure, et les derniers tableaux sont sombres, fissurés, avec une ampoule qui clignote. Souris (capturée au clic)
  pour tourner la tête librement à 360°, clic gauche / Espace pour la photo
  (60 clichés), clic droit / E pour l'outil visé, 1-4 ou molette pour changer d'outil, Échap pour la pause.
- **Outils** (débloqués avec les points cumulés) : Croûton à l'ail (appât, 0), Goutte de Tabasco (agitateur, 5 000),
  Clic du briquet piézo (bruit, 20 000), Flash stroboscopique (révélateur, 42 000), Pédale d'accélérateur (70 000).
- **Barème de Fernand** par cliché : cadrage et taille (0-1 000), pose et dynamisme (200-1 500, ou 2 500 fixes pour
  un comportement secret), angle d'attaque (100-1 000), garniture (+200 par autre créature, max +800). Sceaux au
  beurre : Rance, Comestible, Délicieux, Grand Cru Réserve.
- **Guide des Restes Oubliés** : pour chacune des 15 espèces, quatre clichés à décrocher — Le Cru (passive), Le Saisi
  (en mouvement ou au repas), Le Mijoté (réaction à un outil), Le Chef-d'Œuvre (comportement secret, réaction en
  chaîne). Le Guide affiche les rumeurs de Fernand une fois l'espèce vue.
- **Virées** : L'Étage du Bas (0), La Porte Latérale (10 000), La Grotte d'Aluminium (30 000), Le Fond du Congélateur
  (55 000).

## Comportements secrets

Cornichons Ninjas (croûton sur le couvercle du Bocal → pyramide), Bocal Hermétique (croûton puis clic → couvercle
qui s'envole), Moisissurex (clic puis flash → disco), Ketchup-Rex et Moutarde-Raptor (croûton pile entre les deux →
duel western), Rongeur de Mie (trois croûtons → brioche volante), Œufs-Ninjas (croûton sur le 3e œuf, Tabasco, clic →
Omelette Suprême ailée), Limace de Beurre (Tabasco puis flash → grésillement), Olives-Cyclopes (clic → cancan),
Yéti-Roquefort (deux Tabasco → éternuement de spores), Spaghetti-Méduse (flash → bioluminescence), Léviathan-Surgelé
(clic → brise la banquise), Céleris-Girafes (deux sur le même croûton → bisou), Petits-Pois Pingouins (tour quand le
Léviathan surgit), Sorbet-Volcan (Tabasco puis clic → fontaine de cerises).

## Fichiers

`js/config.js` (constantes, espèces, niveaux, répliques), `js/game.js` (rail, caméra, outils, clichés, barème),
`js/creatures.js` (comportements), `js/sprites.js` (dessin des créatures), `js/props.js` (décor : boîtes en vraie 3D et
objets ronds à dégradés), `js/render.js` (scène, viseur, Fernand),
`js/audio.js`, `js/main.js` (écrans et sauvegarde `localStorage` clé `frigosnap.save`).
`tools/headless.js --all` : photographe automatique qui vérifie que chaque secret est atteignable et calibre les points.
