# Portraits des monstres — version 2

Créés avec l’outil intégré ImageGen. Atlas original : portraits-v2.png. Fond transparent conservé ; cadrages définis dans js/monster-heads.js. La copie embarquée dans js/monster-head-source.js permet le jeu hors ligne.

Référence de style : portraits des personnages de la famille, capture de travail bc-poses.png.

## Prompt final

Create ONE production game sprite atlas: exactly twelve separate illustrated MONSTER HEADS on a genuinely transparent background, regular 4 columns x 3 rows grid, equal square cells. Head only, no torso, no shoulders, no hands, no ball, no scenery, no text or labels or grid lines. Every head front-facing with bottom chin centered in cell, generous transparent gutter, no overlap, include complete ears/horns/hats. This is a single atlas asset to slice in game.
Style: premium charming family-friendly cartoon portrait sprites, expressive large eyes with iris highlights, detailed eyebrows and facial anatomy, clean softly shaded hand-painted digital illustration, beautiful volumetric light and shadow, tactile fur/scales/bone/bark, readable silhouette. Match the illustrated detailed faces of the human family game characters in the reference, not their simple bodies. Not flat vector shapes, not geometric icons, not photorealistic, no gore. Polished warm character design, adventurous opponents with personality.
Exact row-major order:
ROW 1: (1) mischievous olive-green goblin, huge pointed ears, crooked grin and a tiny tooth, unruly dark hair and bronze ear ring; (2) teal lizard-man with intricate scales, golden reptile eyes, small amber crest and broad snout; (3) expressive pretty purple-haired witch with violet pointed hat, gold buckle, warm lavender skin, sly confident smile; (4) animated ivory skeleton warrior skull with weathered iron brow helmet, large expressive dark eye sockets, toothy grin, hairline bone cracks.
ROW 2: (5) muscular moss-green orc face, powerful jaw, two ivory tusks, dark topknot and thick brows; (6) elegant pink/lilac harpy face, golden birdlike eyes, layered feathery plumage hair and a small golden beak; (7) brown-gray wolf beast-man face, detailed fur tufts, upright wolf ears, amber eyes, broad muzzle and fangs; (8) lime-green venom slime round gelatinous face, bright mischievous eyes, translucent jelly with bubbles and glossy reflections, no neck.
ROW 3: (9) ethereal blue-violet shadow specter face enclosed in a deep purple hood, luminous cyan eyes, wispy soft edges, expressive not horror; (10) blue-gray cave troll face, broad lumpy nose, heavy brow, small ivory horns, moss patches, warm grumpy expression; (11) ochre spotted hyena gnoll face with round ears, dark scruffy mane, amber eyes, toothy asymmetrical grin, distinct from wolf; (12) mandrake plant face formed of golden-brown textured root wood with expressive amber eyes, small open round mouth and a rich crown of layered green leaves.
Keep overall character face area and rendering quality consistent across all twelve. Landscape atlas 4:3. Transparent empty space between heads.

## Corps, bras et mains — version 3

Les atlas `bodies-v3.png` et `arms-v3.png` complètent les portraits. Rendu articulé dans `js/monster-body-art.js`, poses dans `js/monster-sprites.js`, copies embarquées pour le mode hors ligne. Voir [les prompts et la provenance](body-art-v3.md). Aperçus intégrés : `bestiary-v3.png` et `poses-v3.png`.
