#!/bin/bash
# Met à jour le site avec la dernière version de chaque jeu, puis pousse sur GitHub Pages.
# Usage : ./deploy.sh ["message de commit"]
set -e
cd "$(dirname "$0")"
PROJETS="$(cd .. && pwd)"
MSG="${1:-Mise à jour des jeux}"

echo "▸ Bunker Zone (copie de ZoneControl/)"
rsync -a --delete --exclude .git --exclude .DS_Store --exclude '_extract.html' "$PROJETS/ZoneControl/" bunker-zone/

echo "▸ Sosaria Online (bundle + assets chargés à l'exécution)"
(cd "$PROJETS/sosaria" && node build.js >/dev/null)
cp "$PROJETS/sosaria/dist/sosaria.html" sosaria/index.html
for d in NPC battle donjon interface inventory misc music other portraits tool world; do
  rsync -a --delete --exclude .DS_Store "$PROJETS/sosaria/assets/$d/" "sosaria/assets/$d/"
done

echo "▸ Commit et envoi"
git add -A
git commit -q -m "$MSG" || echo "  (rien à commiter)"
git push
echo "✔ En ligne dans une minute ou deux : https://clichoraire.github.io/"
