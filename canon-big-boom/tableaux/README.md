# Tableaux personnalisés

Dossier réservé aux tableaux créés avec le mode **Debug** du jeu (visible seulement avec le personnage Matthieu).

1. Sur la carte, choisis un tableau puis clique **🐞 Debug** (ou **🆕 Créer un tableau** pour partir de zéro).
2. Règle l'objectif (avec l'interrupteur « monstres aléatoires du monde »), les **monstres** (onglet Monstres : clique un monstre pour l'ajouter à la suite, « ➕ monstres » sur un groupe pour y mélanger plusieurs sortes, glisse les cartes pour l'ordre), le visuel, l'objectif.
3. Clique **💾 Sauvegarder JSON** : le fichier `tableau-<monde>-<n°>.json` est téléchargé. Dépose-le ici.
4. Pour relier un tableau à une case de la carte, copie son contenu dans `js/custom-waves.js` :
   `CB.CUSTOM_WAVES['foret-2'] = { ... };` (clé = `slot` du JSON). Le jeu l'utilise alors à la place du tableau d'origine
   (la carte montre son nom et son texte ; l'éditeur l'ouvre tel quel depuis sa case). Le 1-1 est `tableau-foret-1.json`.

`maxAlive` (onglet Objectif, « Max à l'écran ») : jamais plus de N monstres aléatoires vivants en même temps (0 = sans limite ; la mer
des monstres est à 4).

Secrets d'un tableau (onglet Objectif) : `"chestAt": 25, "chestEvery": 35` = coffres mystères (premier à 25 s, puis toutes
les 35 s ; 0 = jamais) ; `"portalAt": 45` = le coffre doré (portail vers la Vallée des dinosaures) passe une fois à 45 s
(0 = jamais ; en Debug il passe même si le portail est déjà trouvé).

Format (tous les champs sont optionnels sauf `type`) :

```json
{
  "slot": "foret-2", "world": "foret", "name": "Tenir bon", "text": "Survis 40 secondes !",
  "type": "kill | survive | killTimed | boss | sink | cibles | brigands", "goal": 10, "seconds": 40, "density": 1,
  "scene": "foret", "sky": ["#0b1437", "#243a6b", "#5d7a9c"], "ground": "#1a3b2a", "space": false,
  "random": { "enabled": true, "enemies": ["bat", "owl"] },
  "sequence": [
    { "kinds": [ { "type": "bat", "count": 3 }, { "type": "owl", "count": 2, "elite": true } ], "every": 0.6, "at": null },
    { "kinds": [ { "type": "ghost", "count": 4 } ], "every": 0.5, "at": 20 }
  ],
  "spawns": [],
  "boss": null, "hpScale": 1, "speedScale": 1
}
```

Mini-jeux (onglet Objectif, bloc sous le type ; tout est optionnel, les défauts sont ceux de `CB.MINIGAMES`) :

```json
  "cibles": { "count": 30, "every": [2.2, 1.1], "speed": [3, 4.6], "move": "vagues", "side": "deux", "kind": "cibleAilee",
              "height": [4, 12], "depth": [22, 58], "medals": [0.5, 0.75, 0.9, 1] },
  "brigands": { "rounds": 12, "panels": 3, "bads": 1, "bad": "brigand", "good": "civil", "show": [3.2, 1.7], "gap": 0.9,
                "rise": 0.35, "spacing": 11, "y": 3.2, "z": 28, "medals": [0.5, 0.75, 0.9, 1] }
```

Les paires `[début, fin]` évoluent de la première à la dernière cible (ou du premier au dernier round). `move` : vagues, droit,
zigzag, rebond, piquee, spirale ; `side` : deux, gauche, droite ; `kind`, `bad`, `good` : n'importe quelle clé de `CB.ENEMIES`
(une cible meurt en un tir ; sur les pancartes, le monstre est dessiné à la place du brigand ou du civil). `medals` : % réussi
pour bronze, argent, or, diamant.

`sequence` : les groupes arrivent dans l'ordre. Un boss se met dans une liste avec `"type": "boss:batking"` (clés de `CB.BOSSES`) :
un seul grand combat, tous ses pouvoirs, il ne s'enfuit pas. Chaque groupe mélange ses `kinds` (sortes × nombre, `elite: true` par sorte : bouton ⭐ dans l'éditeur ; l'ancien `elite` de groupe est
converti) et les fait sortir un
par un toutes les `every` secondes (0 = tous d'un coup). `rel` (± s) le fait partir par rapport à la fin des arrivées du
groupe d'avant (négatif = il commence avant que l'autre ait fini de sortir). Sans `at` ni `rel`, un groupe part 1,5 s après l'élimination du groupe d'avant (le premier à
1 s) ; avec `at`, il part à ce moment-là dès que son tour vient. L'ancien format `spawns` (paquets répétés) reste lu par le
jeu et est converti en `sequence` quand on l'ouvre dans l'éditeur.
