#!/bin/bash
# Met à jour le site avec la dernière version de chaque jeu, puis pousse sur GitHub Pages.
# Usage : ./deploy.sh ["message de commit"]
set -e
cd "$(dirname "$0")"
PROJETS="$(cd .. && pwd)"
MSG="${1:-Mise à jour des jeux}"

echo "▸ Bunker Zone (copie de ZoneControl/)"
rsync -a --delete --exclude .git --exclude .DS_Store --exclude '_extract.html' "$PROJETS/ZoneControl/" bunker-zone/

echo "▸ Hockey Boisjoli (copie de HockeyBoisjoli/)"
rsync -a --delete --exclude .git --exclude .DS_Store "$PROJETS/HockeyBoisjoli/" hockey-boisjoli/

echo "▸ Sosaria Online (bundle + assets chargés à l'exécution)"
(cd "$PROJETS/sosaria" && node build.js >/dev/null)
cp "$PROJETS/sosaria/dist/sosaria.html" sosaria/index.html
for d in NPC battle donjon interface inventory misc music other portraits tool world; do
  rsync -a --delete --exclude .DS_Store "$PROJETS/sosaria/assets/$d/" "sosaria/assets/$d/"
done

echo "▸ Relais Sosaria (LLM) : adresse lue dans config.js"
API=$(node -e "const w={};global.window=w;require('./config.js');process.stdout.write(w.SITE_CONFIG.sosariaApi||'')")
if [ -n "$API" ]; then
  # Le bundle appelle /api/... en relatif : on redirige ces appels vers le relais hébergé.
  python3 - "$API" <<'PY'
import sys; api=sys.argv[1]; p='sosaria/index.html'; s=open(p).read()
inj='<script>/* relais LLM hébergé */(function(){var B='+repr(api)+';var f=window.fetch;window.fetch=function(u,o){if(typeof u==="string"&&u.indexOf("/api/")===0)u=B+u;return f.call(this,u,o);};})();</script>'
s=s.replace('<head>','<head>'+inj,1); open(p,'w').write(s)
PY
  echo "  → $API"
else echo "  (aucun relais : les âmes resteront muettes en ligne)"; fi

echo "▸ Commit et envoi"
git add -A
git commit -q -m "$MSG" || echo "  (rien à commiter)"
git push
echo "✔ En ligne dans une minute ou deux : https://clichoraire.github.io/"
