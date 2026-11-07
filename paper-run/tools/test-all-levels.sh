#!/bin/sh
# Lance test-levels.cjs sur chaque tableau en parallèle (un processus par tableau) et rassemble les résultats.
cd "$(dirname "$0")/.." || exit 1
ids=$(node -e "require('./js/physics.js');const PR=require('./js/levels.js');console.log(PR.LEVELS.map(l=>l.id).join(' '))")
out=$(mktemp -d)
for id in $ids; do node tools/test-levels.cjs "$id" > "$out/$id.txt" 2>&1 & done
wait
fail=0
for id in $ids; do head -n -1 "$out/$id.txt" 2>/dev/null || sed '$d' "$out/$id.txt"; grep -q '✖' "$out/$id.txt" && fail=1; done
rm -rf "$out"
[ $fail = 0 ] && echo "✔ tous les tableaux sont finissables" || { echo "✖ des tableaux sont à corriger"; exit 1; }
