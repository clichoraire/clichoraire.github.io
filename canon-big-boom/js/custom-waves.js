// Tableaux personnalisés reliés aux cases de la carte.
// Clé = id du monde + '-' + numéro du tableau (1 à 5), valeur = JSON sauvegardé depuis le mode Debug (voir tableaux/README.md).
// Exemple : CB.CUSTOM_WAVES['foret-2'] = { ...contenu du fichier tableau-foret-2.json... };
(function (CB) {
  CB.CUSTOM_WAVES = {};
  // Tableau 1-1 (tableaux/tableau-foret-1.json, version de Matthieu du 2026-10-31) : 100 à abattre, chauves-souris, hiboux et fantômes ;
  // coffres mystères à 25 s puis toutes les 35 s, coffre doré (portail vers le passé) à 45 s
  CB.CUSTOM_WAVES['foret-1'] = {"slot": "foret-1","world": "foret","name": "Niveau 1-1","text": "","type": "kill","goal": 100,"seconds": 300,"density": 1,"scene": "foret","sky": ["#0b1437","#243a6b","#5d7a9c"],"ground": "#1a3b2a","space": false,"random": {"enabled": false,"enemies": []},"spawns": [],"boss": null,"hpScale": 1,"speedScale": 1,"sequence": [{"kinds": [{"type": "bat","count": 8}],"every": 1.1,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 20}],"every": 1,"at": null,"elite": false,"rel": null,"left": null},{"kinds": [{"type": "bat","count": 18},{"type": "owl","count": 3,"elite": false}],"every": 0.8,"at": null,"elite": false},{"kinds": [{"type": "bat","count": 6}],"every": 0,"at": null,"elite": false,"rel": -2,"left": null},{"kinds": [{"type": "bat","count": 20},{"type": "owl","count": 6},{"type": "ghost","count": 5,"elite": false}],"every": 0.5,"at": null,"elite": false,"rel": -2,"left": null},{"kinds": [{"type": "bat","count": 60},{"type": "owl","count": 10}],"every": 0.3,"at": null,"elite": false}],"chestAt": 25,"chestEvery": 35,"portalAt": 45};
})(window.CB);
