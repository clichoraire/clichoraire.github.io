# Illustrations des entraînements

## Archives : premières poses d’Edison

Créées avec le tool intégré imagegen à partir des références fournies par Matthieu. PNG transparents, copies embarquées dans js/illustrated-sprites.js pour fonctionner hors ligne.

- edison-tire.png : huit poses, grille 4 × 2. Ancienne animation d’Edison uniquement, remplacée par le squelette partagé décrit ci-dessous.
- edison-expressions.png : effort, impact, fatigue, trois colonnes.

Prompts utilisés (résumé fidèle) :
1. Sprite sheet transparent 4 colonnes × 2 rangées, Edison blond en t-shirt jaune, short anthracite, poussant un grand pneu de tracteur à crampons. Anatomie arrondie, doigts au contact du pneu, huit phases : accroupi, levée, poussée, effort maximal, bascule, lâcher, réception, célébration. Style des planches fournies, identité du visage de référence, sans texte ni décor.
2. Détourer les trois expressions d’Edison de la référence, conserver cheveux, identité, yeux bleus, effort dents serrées, cri yeux fermés et forte transpiration. Trois cellules égales sur fond transparent.

L’animation suit la puissance puis le temps du retournement. Les étoiles indiquent les tiers de l’objectif atteint. Les particules et la jauge sont dessinées en temps réel.

Correction de la séquence : 1 → 6 → 5 → 4 → 3 → 2 → 7 → 8. La pose 1 utilise désormais edison-tire-start.png, pneu couché. Prompt imagegen intégré : une seule pose transparente, Edison accroupi à gauche, les deux mains sous le bord du pneu horizontal identique aux poses 7 et 8 ; conserver identité, vêtements, anatomie dessinée et crampons.

## Squelette illustré partagé — six enfants

Mode : outil intégré `image_gen`, avec `edison-tire.png` comme référence de style. Générations transparentes copiées dans le projet, sans retouche raster externe :

- `family-training-parts.png` : atlas 4 × 3, six torses colorés et six pièces anatomiques. Portraits personnels issus de `FamilyHeads`. La découpe des cellules et le détourage par alpha sont réalisés au chargement dans le navigateur ; coordonnées entières, y compris lorsque la largeur de l’atlas n’est pas divisible par quatre.
- `training-tire.png` : pneu circulaire isolé. Projection et épaisseur animées par le moteur.
- `../../js/training-rig-assets.js` : copies embarquées des deux PNG pour le fonctionnement hors ligne.
- `../../js/training-rig.js` : articulations, longueurs fixes, points de prise, pose et rendu commun aux six enfants.

### Prompt final : pièces du squelette

Create a production game skeletal sprite parts atlas using the attached Edison artwork ONLY as illustrated shading/style reference. Transparent PNG square canvas, EXACT regular 4 columns x 3 rows, each cell same dimensions, ample transparent gaps, NO TEXT, no heads, no complete characters. All parts seen side-on facing right with rounded illustrated anatomy, soft painted shading and dark fine outlines matching reference. Each isolated piece centered in its own cell. Cell order left to right top to bottom: row1: red short-sleeve child shirt torso with attached charcoal shorts, purple same torso, green same torso, orange same torso. row2: blue same torso, yellow same torso, bare upper arm vertical shoulder at top elbow at bottom, bare forearm vertical elbow at top wrist at bottom. row3: bent gripping hand fingers facing RIGHT and thumb wrapped, bare child thigh vertical hip at top knee bottom, bare calf vertical knee top ankle bottom, black sneaker side profile toe facing RIGHT. Torso pieces all exactly same shape and scale, neck at top, hip bottom; no attached arms legs or heads. Limb pieces straight in neutral pose for skeletal rotation, round ends to overlap at joints; warm light peach skin. Uniform 4x3 grid; objects do not touch cell edges. Polished illustrated videogame parts, no backgrounds, no shadow cast outside pieces, no wheel included.

### Prompt final : pneu

Game sprite asset: one isolated large black tractor tire, matching the soft shaded detailed cartoon illustration style and chevron rubber tread of the reference. Orthographic straight-on FRONT view of the circular sidewall, perfectly circular outer silhouette, circular open transparent hole at center, chunky chevron tread visible around circumference, slight rounded beveled edges but NO perspective ellipse. Tire centered, fills 90% square canvas, transparent background and transparent center hole. No person, no floor, no shadow outside tire, no text. This face-on tire image will be transformed by game code during a continuous 3D flip, so it must be rotationally symmetric in geometry with clean outer edge.
