# Tableaux personnalisés

Dossier réservé aux tableaux créés avec le mode **Debug** du jeu (visible seulement avec le personnage Matthieu).

1. Sur la carte, choisis un tableau puis clique **🐞 Debug** (ou **🆕 Créer un tableau** pour partir de zéro).
2. Règle les monstres, leurs arrivées (paquets de X toutes les N secondes), le visuel, l'objectif.
3. Clique **💾 Sauvegarder JSON** : le fichier `tableau-<monde>-<n°>.json` est téléchargé. Dépose-le ici.
4. Pour relier un tableau à une case de la carte, copie son contenu dans `js/custom-waves.js` :
   `CB.CUSTOM_WAVES['foret-2'] = { ... };` (clé = `slot` du JSON). Le jeu l'utilise alors à la place du tableau d'origine.

Format (tous les champs sont optionnels sauf `type`) :

```json
{
  "slot": "foret-2", "world": "foret", "name": "Tenir bon", "text": "Survis 40 secondes !",
  "type": "kill | survive | killTimed | boss", "goal": 10, "seconds": 40, "density": 1,
  "scene": "foret", "sky": ["#0b1437", "#243a6b", "#5d7a9c"], "ground": "#1a3b2a", "space": false,
  "random": { "enabled": true, "enemies": ["bat", "owl"] },
  "spawns": [ { "at": 2, "type": "bat", "count": 3, "every": 0.4, "packs": 2, "interval": 6, "elite": false } ],
  "boss": null, "hpScale": 1, "speedScale": 1
}
```
