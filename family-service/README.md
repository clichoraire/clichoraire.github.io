# Atelier des familles

Le bouton « Ajouter ou retirer des personnages » de l’accueil ouvre `/families/`. Avec son code, l’administrateur peut :

- **créer un personnage avec l’IA** : 1 à 4 photos d’une même personne, un prénom, un gabarit, une famille existante ou nouvelle. Gemini produit les trois têtes (face, profil, dos) sur un fond vert uni ;
- **fournir une image déjà générée** (par exemple faite dans l’application Gemini) : trois têtes côte à côte sur fond transparent ou uni, sans appel IA ni quota ;
- **retirer un personnage** du catalogue (bouton « Retirer » sous chaque personnage ajouté). Son portrait est supprimé ; une famille créée dans l’atelier disparaît quand elle n’a plus de membre.

Dans les deux cas de création, le fond est détouré **dans le navigateur** (`families/sheet.js`), l’administrateur vérifie les trois vues, ajuste au besoin le curseur de détourage, puis publie. La planche finale est un PNG transparent de 1536 × 1024 (trois cases de 512 × 1024), le format que lisent les jeux. L’aperçu reste privé jusqu’au clic « Publier dans les jeux ».

## Fournisseurs d’IA

`FAMILY_PROVIDER` choisit le fournisseur :

- `gemini` (défaut) : API Gemini, point d’entrée `/v1beta/interactions`, modèle `GEMINI_IMAGE_MODEL` (défaut `gemini-nano-banana-2.1`), clé `GEMINI_API_KEY`. Options : `GEMINI_ASPECT_RATIO` (défaut `21:9`), `GEMINI_IMAGE_SIZE` (`1K` par défaut, `2K` possible, plus cher). Gemini ne produit que du JPEG, sans transparence : le service demande un fond vert pur, retiré ensuite dans l’atelier. Les requêtes sont envoyées avec `store: false`.
- `openai` : `gpt-image-1.5` avec fond transparent natif, clé `OPENAI_API_KEY`, modèle `OPENAI_IMAGE_MODEL`.
- `mock` : aucun appel payant, renvoie la référence de style. Pratique pour essayer l’atelier en local.

## Activer sur Render

1. Publier ces fichiers dans le dépôt du site. Créer un Blueprint Render utilisant le `render.yaml` à la racine du dépôt.
2. Renseigner `GEMINI_API_KEY` dans Render (clé créée dans Google AI Studio, avec facturation activée pour les modèles image).
3. Render génère `FAMILY_ADMIN_CODE` : le copier depuis les variables d’environnement et le garder dans un gestionnaire de mots de passe. Ne pas le mettre dans GitHub ni dans `config.js`.
4. Copier l’URL HTTPS attribuée au service dans `SITE_CONFIG.familyApi` du `config.js` de l’accueil, puis publier ce fichier.
5. Ouvrir `/families/`, entrer le code et essayer une vraie photo. Vérifier les trois vues avant publication et lancer les trois jeux.

Le service utilise un **plan payant avec disque persistant**. Vérifier le coût indiqué par Render avant de le créer. Ne pas supprimer ce disque : il contient le catalogue et les portraits. La génération est aussi facturée par le fournisseur IA. La limite par défaut de 10 demandes par jour (UTC) est configurable dans `FAMILY_DAILY_LIMIT`; ce n’est pas un plafond monétaire. Une demande échouée consomme aussi une place pour éviter les répétitions coûteuses. Une seule génération à la fois. Les planches fournies directement ne comptent pas.

Les photos originales restent en mémoire le temps de l’appel au fournisseur IA; elles ne sont ni écrites sur le disque du service ni publiées. Leur traitement reste soumis aux conditions du fournisseur. Les images générées (`drafts/`) puis les planches publiées (`portraits/`) et le catalogue sont conservés sur disque. Les brouillons non publiés de plus de sept jours sont nettoyés au redémarrage. Les brouillons sont accessibles uniquement avec le code; seuls les portraits publiés ont une URL publique. Les données publiées comprennent le prénom, la famille, le gabarit et le portrait. Les statistiques de départ sont équilibrées.

La publication et le retrait ne modifient pas le dépôt : les jeux téléchargent le catalogue au démarrage. Les anciennes identités et sauvegardes sont conservées. Les métadonnées publiques sont mises en cache localement en cas de panne; les portraits utilisent le cache HTTP. Un portrait manquant reprend provisoirement l’apparence du gabarit de base. Les personnages supplémentaires se choisissent dans Snow Kids via le filtre famille et les flèches. Au hockey et au ballon chasseur, ils rejoignent leur équipe; des invités complètent les nouvelles familles. Les autres jeux ne sont pas intégrés.

## API (code d’accès requis sauf mention)

- `GET /health` (public) : état et fournisseur.
- `GET /api/catalog` (public) : familles et personnages publiés.
- `GET /portraits/<id>.png` (public) : planche d’un personnage publié.
- `GET /api/session` : vérifie le code, indique si la clé IA est configurée.
- `POST /api/jobs` : `{requestId, name, body, ageGroup, familyId | familyName, consent, photos:[dataURL]}` lance une génération (202), ou `{…, sheet: dataURL}` enregistre une image fournie (200, prête).
- `GET /api/jobs/<id>` : état et aperçu brut (`preview`, data URL).
- `POST /api/jobs/<id>/publish` : `{sheet: dataURL}` PNG 1536 × 1024 détouré → publie.
- `DELETE /api/people/<id>` : retire un personnage et son portrait; renvoie le catalogue mis à jour.

## Développement et vérification

Node 22+, aucune dépendance npm. `npm test` exercise le service avec un fournisseur simulé et le détourage sur la référence de style composée sur fond vert : aucun appel payant. Pour lancer localement :

```bash
cd family-service
FAMILY_PROVIDER=mock FAMILY_ADMIN_CODE=code-local-0123456789 FAMILY_DATA_DIR=./data FAMILY_ORIGINS=http://localhost:8080 node server.mjs
```

Servir le site en HTTP depuis sa racine (`python3 -m http.server 8080`), mettre temporairement `familyApi: 'http://localhost:8787'` dans `config.js`, ouvrir `http://localhost:8080/families/`. Remplacer `mock` par `gemini` avec `GEMINI_API_KEY=…` pour une vraie génération. Ne jamais versionner une clé ni le dossier `data`.

Documents : [Génération d’images Gemini](https://ai.google.dev/gemini-api/docs/image-generation), [Image edits OpenAI](https://developers.openai.com/api/reference/resources/images/methods/edit), [Blueprint Render](https://render.com/docs/blueprint-spec).
