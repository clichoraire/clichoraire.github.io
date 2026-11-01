// Range des tableaux de défis exportés de l'éditeur (📤 Exporter) dans js/challenge-maps.js :
//   node tools/import-defis.cjs ~/Downloads/Canons_de_feu.bomberkid.json ~/Downloads/Le_potager.bomberkid.json …
// Le défi est retrouvé par stageId (« defi-<id> ») ou par son nom ; les tableaux déjà rangés sont gardés.
const fs = require('fs'), path = require('path'), BK = require('./headless');
const files = process.argv.slice(2); if (!files.length) { console.error('usage : node tools/import-defis.cjs <export.json> …'); process.exit(1); }
const out = path.join(__dirname, '..', 'js', 'challenge-maps.js'), maps = { ...BK.CHALLENGE_MAPS };
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
for (const f of files) {
  const m = JSON.parse(fs.readFileSync(f, 'utf8'));
  const ch = BK.CHALLENGES.find(c => m.stageId === 'defi-' + c.id) || BK.CHALLENGES.find(c => c.kind === 'arena' && norm(m.name).endsWith(norm(c.name)));
  if (!ch) { console.error('✖ ' + path.basename(f) + ' : aucun défi nommé « ' + m.name + ' »'); process.exitCode = 1; continue; }
  const grid = m.grid.map(l => l.replace(/[G|]/g, m.base || '.'));   // pas de portail ni de diamant : on gagne en éliminant tous les monstres
  maps[ch.id] = { name: ch.name, cols: m.cols, rows: m.rows, theme: m.theme, base: m.base, music: m.music || '', grid, enemies: m.enemies || [], props: m.props || {}, houses: m.houses || {}, npcs: m.npcs || [], shop: m.shop || [] };
  console.log('✔ ' + ch.name + ' (' + ch.id + ') : ' + m.cols + ' × ' + m.rows + ', ' + (m.enemies || []).length + ' monstres');
}
fs.writeFileSync(out, '// Tableaux de défis faits à la main dans l\'éditeur (remplacent l\'arène générée du défi du même id).\n// Fichier régénéré par : node tools/import-defis.cjs ~/Downloads/*.bomberkid.json\n(function (BK) {\n  \'use strict\';\n  BK.CHALLENGE_MAPS = ' + JSON.stringify(maps, null, 1) + ';\n})(window.BK);\n');
