// Tableaux personnalisés reliés aux cases de la carte.
// Clé = id du monde + '-' + numéro du tableau (1 à 5), valeur = JSON sauvegardé depuis le mode Debug (voir tableaux/README.md).
// Exemple : CB.CUSTOM_WAVES['foret-2'] = { ...contenu du fichier tableau-foret-2.json... };
(function (CB) {
  CB.CUSTOM_WAVES = {};
  // Tableau 1-1 (tableaux/tableau-foret-1.json) : séquence de chauves-souris et hiboux, 100 à abattre ; coffres mystères à 25 s puis toutes les 35 s, coffre doré (portail) à 45 s
  CB.CUSTOM_WAVES['foret-1'] = {"slot": "foret-1","world": "foret","name": "Niveau 1-1","text": "Abats 100 ennemis !","type": "kill","goal": 100,"seconds": 300,"density": 1,"scene": "foret","sky": ["#0b1437","#243a6b","#5d7a9c"],"ground": "#1a3b2a","space": false,"random": {"enabled": false,"enemies": []},"spawns": [],"boss": null,"hpScale": 1,"speedScale": 1,"sequence": [{"kinds": [{"type": "bat","count": 3}],"every": 2,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 12}],"every": 0.8,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 15}],"every": 0.5,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 6}],"every": 0,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 15},{"type": "owl","count": 3}],"every": 0.5,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 60},{"type": "owl","count": 10}],"every": 0.5,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 120}],"every": 0.3,"at": null,"elite": false}],"chestAt": 25,"chestEvery": 35,"portalAt": 45};
})(window.CB);
