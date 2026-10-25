# Atelier des familles

Le bouton de l’accueil ouvre `/families/`. L’administrateur fournit son code, 1 à 4 photos **d’une même personne**, un prénom, un gabarit et une famille existante ou nouvelle. Une génération produit trois vues transparentes. L’aperçu est privé jusqu’au clic « Publier dans les jeux ».

## Activer sur Render

1. Publier ces fichiers dans le dépôt du site. Créer un Blueprint Render utilisant le `render.yaml` à la racine du dépôt.
2. Renseigner `OPENAI_API_KEY` dans Render. Le compte API doit avoir accès au modèle `gpt-image-1.5` et du crédit disponible.
3. Render génère `FAMILY_ADMIN_CODE` : le copier depuis les variables d’environnement et le garder dans un gestionnaire de mots de passe. Ne pas le mettre dans GitHub ni dans `config.js`.
4. Copier l’URL HTTPS attribuée au service dans `SITE_CONFIG.familyApi` du `config.js` de l’accueil, puis publier ce fichier.
5. Ouvrir `/families/`, entrer le code et essayer une vraie photo. Vérifier les trois vues avant publication et lancer les trois jeux.

Le service utilise un **plan payant avec disque persistant**. Vérifier le coût indiqué par Render avant de le créer. Ne pas supprimer ce disque : il contient le catalogue et les portraits. La génération est aussi facturée par le fournisseur IA. La limite par défaut de 10 demandes par jour (UTC) est configurable dans `FAMILY_DAILY_LIMIT`; ce n’est pas un plafond monétaire. Une demande échouée consomme aussi une place pour éviter les répétitions coûteuses. Une seule génération à la fois.

Les photos originales restent en mémoire le temps de l’appel à OpenAI; elles ne sont ni écrites sur le disque du service ni publiées. Leur traitement par OpenAI reste soumis aux conditions de l’API. Les PNG générés et le catalogue sont conservés sur disque. Les brouillons non publiés de plus de sept jours sont nettoyés au redémarrage du service. Les brouillons sont accessibles uniquement avec le code; seuls les portraits validés ont une URL publique. Les données publiées comprennent le prénom, la famille, le gabarit et le portrait. Les statistiques de départ sont équilibrées.

La publication ne modifie pas le dépôt : les jeux téléchargent le catalogue au démarrage. Les anciennes identités et sauvegardes sont conservées. Les métadonnées publiques sont mises en cache localement en cas de panne; les portraits utilisent le cache HTTP. Un portrait manquant reprend provisoirement l’apparence du gabarit de base. Les personnages supplémentaires se choisissent dans Snow Kids via le filtre famille et les flèches. Au hockey et au ballon chasseur, ils rejoignent leur équipe; des invités complètent les nouvelles familles. Les autres jeux ne sont pas intégrés.

## Développement et vérification

Node 22+, aucune dépendance npm. `npm test` teste avec un fournisseur simulé : aucun appel payant. Pour lancer localement : définir `FAMILY_ADMIN_CODE` (16 caractères ou plus), `OPENAI_API_KEY`, `FAMILY_DATA_DIR` et `FAMILY_ORIGINS`, puis `npm start`. Servir le site en HTTP (par exemple `python3 -m http.server 8080` depuis sa racine), et définir temporairement `familyApi` vers l’API locale. Ne jamais versionner une clé ou le dossier `data`.

Documents : [Image edits OpenAI](https://developers.openai.com/api/reference/resources/images/methods/edit), [Blueprint Render](https://render.com/docs/blueprint-spec).
