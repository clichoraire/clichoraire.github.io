#!/bin/bash
# Met à jour le site avec la dernière version de chaque jeu, puis pousse sur GitHub Pages.
# Usage : ./deploy.sh ["message de commit"]
set -e
cd "$(dirname "$0")"
PROJETS="${GAME_PROJECTS_ROOT:?Use deploy.sh to prepare the temporary publication folder}"
MSG="${1:-Mise à jour des jeux}"; [ "$MSG" = "--force" ] && MSG="Mise à jour des jeux"

# Versions : chaque jeu affiche sa version (ZC.VERSION, HK.VERSION). Si le code d'un jeu a changé depuis la dernière
# mise en ligne mais pas sa version, on refuse (sauf --force), pour ne jamais republier un « 1.0 » périmé.
ver_of() { node -e "const w={};global.window=w;require('$1');process.stdout.write((w.ZC||w.HK||w.SK||w.FS||w.BC||w.CB||w.BK).VERSION)"; }
VER_ZC=$(ver_of "$PROJETS/ZoneControl/js/config.js"); VER_HK=$(ver_of "$PROJETS/HockeyBoisjoli/js/config.js"); VER_SK=$(ver_of "$PROJETS/SnowKids/js/config.js"); VER_FS=$(ver_of "$PROJETS/FrigoSnap/js/config.js"); VER_BC=$(ver_of "$PROJETS/BallonChasseur/js/config.js"); VER_CB=$(ver_of "$PROJETS/CanonBigBoom/js/config.js"); VER_BK=$(ver_of "$PROJETS/Bomberkid/js/config.js")
HEAD_ZC=$(git -C "$PROJETS/ZoneControl" rev-parse HEAD); HEAD_HK=$(git -C "$PROJETS/HockeyBoisjoli" rev-parse HEAD); HEAD_SK=$(git -C "$PROJETS/SnowKids" rev-parse HEAD); HEAD_FS=$(git -C "$PROJETS/FrigoSnap" rev-parse HEAD); HEAD_BC=$(git -C "$PROJETS/BallonChasseur" rev-parse HEAD); HEAD_CB=$(git -C "$PROJETS/CanonBigBoom" rev-parse HEAD); HEAD_BK=$(git -C "$PROJETS/Bomberkid" rev-parse HEAD)
if [ -f versions.json ] && [[ " $* " != *" --force "* ]]; then
  for j in "bunker $VER_ZC $HEAD_ZC" "hockey $VER_HK $HEAD_HK" "snow $VER_SK $HEAD_SK" "frigo $VER_FS $HEAD_FS" "ballon $VER_BC $HEAD_BC" "canon $VER_CB $HEAD_CB" "bomber $VER_BK $HEAD_BK"; do set -- $j
    OLDV=$(node -e "const v=require('./versions.json');process.stdout.write(v['$1']?v['$1'].version:'')")
    OLDC=$(node -e "const v=require('./versions.json');process.stdout.write(v['$1']?v['$1'].commit:'')")
    if [ "$OLDC" != "$3" ] && [ "$OLDV" = "$2" ]; then echo "✖ $1 : le code a changé mais la version est encore $2. Augmente VERSION dans js/config.js (ou ./deploy.sh --force)."; exit 1; fi
  done
fi
echo "{ \"bunker\": { \"version\": \"$VER_ZC\", \"commit\": \"$HEAD_ZC\" }, \"hockey\": { \"version\": \"$VER_HK\", \"commit\": \"$HEAD_HK\" }, \"snow\": { \"version\": \"$VER_SK\", \"commit\": \"$HEAD_SK\" }, \"frigo\": { \"version\": \"$VER_FS\", \"commit\": \"$HEAD_FS\" }, \"ballon\": { \"version\": \"$VER_BC\", \"commit\": \"$HEAD_BC\" }, \"canon\": { \"version\": \"$VER_CB\", \"commit\": \"$HEAD_CB\" }, \"bomber\": { \"version\": \"$VER_BK\", \"commit\": \"$HEAD_BK\" } }" > versions.json
echo "window.GAME_VERSIONS = { 'bunker-zone/': '$VER_ZC', 'hockey-boisjoli/': '$VER_HK', 'snow-kids/': '$VER_SK', 'frigo-snap/': '$VER_FS', 'ballon-chasseur/': '$VER_BC', 'canon-big-boom/': '$VER_CB', 'bomberkid/': '$VER_BK' };" > versions.js
echo "▸ Versions : Bunker Zone $VER_ZC · Hockey Boisjoli $VER_HK · Snow Kids $VER_SK · Frigo Snap $VER_FS · Ballon Chasseur $VER_BC · Canon Big Boom $VER_CB · Bomberkid $VER_BK"

echo "▸ Bunker Zone (copie de ZoneControl/)"
rsync -a --delete --exclude .git --exclude .DS_Store --exclude '_extract.html' "$PROJETS/ZoneControl/" bunker-zone/

echo "▸ Hockey Boisjoli (copie de HockeyBoisjoli/)"
rsync -a --delete --exclude .git --exclude .DS_Store "$PROJETS/HockeyBoisjoli/" hockey-boisjoli/

echo "▸ Snow Kids (copie de SnowKids/)"
python3 "$PROJETS/SnowKids/tools/export-public.py" "$PWD/snow-kids"

echo "▸ Frigo Snap (copie de FrigoSnap/)"
rsync -a --delete --exclude .git --exclude .DS_Store "$PROJETS/FrigoSnap/" frigo-snap/

echo "▸ Ballon Chasseur Boisjoli (copie de BallonChasseur/)"
rsync -a --delete --exclude .git --exclude .DS_Store "$PROJETS/BallonChasseur/" ballon-chasseur/

echo "▸ Canon Big Boom (copie de CanonBigBoom/)"
rsync -a --delete --exclude .git --exclude .DS_Store "$PROJETS/CanonBigBoom/" canon-big-boom/

echo "▸ Bomberkid (copie de Bomberkid/)"
# L'ancienne copie « Bomberkid/ » (majuscule) doit disparaître de Git avant d'écrire « bomberkid/ » : sur macOS, le disque
# ne distingue pas la casse mais GitHub Pages, oui.
if git ls-files --error-unmatch -- Bomberkid >/dev/null 2>&1; then git rm -r -q --cached -- Bomberkid; rm -rf Bomberkid; fi
rsync -a --delete --exclude .git --exclude .DS_Store "$PROJETS/Bomberkid/" bomberkid/

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

if [ "${GAME_PREPARE_ONLY:-0}" = 1 ]; then echo "✔ Préparation vérifiée, aucune publication."; exit 0; fi

echo "▸ Commit et envoi"
git add -A
# The local shortcut is ignored; force-add the sanitized public export here.
git add -f -- snow-kids
git commit -q -m "$MSG" || echo "  (rien à commiter)"
git push origin "HEAD:${GAME_PUBLISH_BRANCH:?Missing publication branch}"
echo "✔ En ligne dans une minute ou deux : https://clichoraire.github.io/"
