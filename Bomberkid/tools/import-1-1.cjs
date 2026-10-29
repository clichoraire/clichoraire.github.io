// Régénère js/stage-1-1.js à partir d'un export de l'éditeur : node tools/import-1-1.cjs ~/Downloads/Niveau_1-1-REAL.json
const fs = require('fs'), path = require('path');
const src = process.argv[2]; if (!src) { console.error('usage : node tools/import-1-1.cjs <export.json>'); process.exit(1); }
const m = JSON.parse(fs.readFileSync(src, 'utf8'));
if (!m.grid || !m.grid.some(l => l.includes('1'))) throw Error('pas de départ (1) dans la carte');
const stage = { name: m.name || 'Les premiers pas', theme: m.theme || 'garden', cols: m.cols, rows: m.rows, music: m.music || '', enemies: m.enemies || [], npcs: m.npcs || [], shop: m.shop || [], houses: m.houses || {}, props: m.props || {} };
const out = "// Tableau 1-1 : carte de Matthieu importée depuis un export de l’éditeur. Chargé avant adventure.js.\n// Pour la mettre à jour : exporter la carte depuis l'éditeur (📤 Fichier) et relancer `node tools/import-1-1.cjs <fichier.json>`.\nwindow.BK.STAGE_1_1 = {\n  grid: [\n    " + m.grid.map(r => JSON.stringify(r)).join(',\n    ') + "\n  ],\n" + Object.entries(stage).map(([k, v]) => '  ' + k + ': ' + JSON.stringify(v) + ',\n').join('') + '};\n';
fs.writeFileSync(path.join(__dirname, '..', 'js', 'stage-1-1.js'), out); console.log('✔ js/stage-1-1.js (' + out.length + ' octets, ' + stage.enemies.length + ' monstres)');
