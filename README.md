# Les jeux de Matthieu — site vitrine

Page d'accueil qui présente les jeux et les héberge sur GitHub Pages : https://clichoraire.github.io/

```
index.html        page d'accueil (la liste des jeux est dans le tableau GAMES, en bas du fichier)
covers/           images de couverture (jpg, 1200 px de large)
bunker-zone/      copie du projet ZoneControl (tel quel, aucun build)
sosaria/          index.html = dist/sosaria.html du projet sosaria, + assets/ chargés à l'exécution
deploy.sh         recopie la dernière version des jeux, commit, push
.nojekyll         dit à GitHub Pages de servir les fichiers tels quels
```

## Mettre à jour les jeux en ligne

```bash
./deploy.sh "Bunker Zone : nouvelles missions"
```

Le script recopie `../ZoneControl/` dans `bunker-zone/`, rebâtit le bundle de `../sosaria/` dans `sosaria/`,
puis commit et pousse. GitHub Pages republie en une ou deux minutes.

## Ajouter un jeu

1. Copier le jeu dans un dossier à la racine (avec son `index.html`, chemins relatifs).
2. Mettre une capture dans `covers/`.
3. Ajouter une entrée dans `GAMES` au bas de `index.html` (titre, dossier, image, tags, description).
4. `./deploy.sh "Nouveau jeu : …"` (ou ajouter la copie dans le script si le jeu se rebâtit).

## Première mise en ligne

1. Sur github.com, créer un dépôt **public** et vide nommé `clichoraire.github.io` (ce nom précis donne l'adresse
   https://clichoraire.github.io/).
2. Dans ce dossier : `git push -u origin main`.
3. Sur GitHub : Settings → Pages → Source « Deploy from a branch », branche `main`, dossier `/ (root)`.
4. Attendre une minute ou deux, puis ouvrir https://clichoraire.github.io/.
