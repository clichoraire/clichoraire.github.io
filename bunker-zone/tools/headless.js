// Simulation sans affichage pour tester l'équilibrage (Node.js).
// Usage : node tools/headless.js [ia=4] [carte=7] [difficulté=normal] [secondes=900] [--passive] [--mode=rounds] [--limit=300] [--wins=3] [--my=1] [--teams=0,0,1,1] [--race=human] [--airace=insect] [--invasion=1] [--minerals=0.4] [--workers=2]
//   --invasion=k : pas d'IA installée, des vagues d'envahisseurs (échelle k) arrivent par les bords toutes les 15 à 35 s (avec --passive : mesure la survie)
//   --passive : ajoute un joueur humain qui ne fait rien, et mesure sa survie.
//   --mode=   : classic (défaut), evolution ou rounds (tournoi) ; --limit et --wins règlent le tournoi.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
globalThis.window = globalThis;
for (const f of ['config', 'utils', 'items', 'map', 'units', 'ai', 'game']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
}
const ZC = globalThis.ZC;
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const passive = process.argv.includes('--passive');
const ai = +args[0] || 4, map = +args[1] || 7, diff = args[2] || 'normal', maxT = +args[3] || 900;
const flag = (n, d) => { const f = process.argv.find(a => a.startsWith('--' + n + '=')); return f ? f.slice(n.length + 3) : d; };
const mode = flag('mode', 'classic');
const teams = flag('teams', '') ? flag('teams', '').split(',').map(Number) : null;
const inv = +flag('invasion', 0);
const g = new ZC.Game({ humanPlayer: passive, aiCount: inv ? 0 : ai, difficulty: diff, mapZones: map, mapZonesY: +flag('my', 0), mode, roundTimeLimit: +flag('limit', 300), roundsToWin: +flag('wins', 3), teams, playerRace: flag('race', 'human'), aiRace: flag('airace', null), invasion: inv ? { min: 15, max: 35, scale: inv } : null, mineralZones: +flag('minerals', ZC.DEFAULTS.mineralZones), startWorkers: +flag('workers', ZC.DEFAULTS.startWorkers) });
const dt = 1 / 30;
let simT = 0, next = 0, maxUnits = 0, defeat = -1;
g.on((t, d) => {
  if (t === 'eliminated') console.log(`  ${simT.toFixed(0)}s : ${d.player.name} éliminé`);
  if (t === 'defeat') defeat = simT;
  if (t === 'roundEnd') console.log(`  ${simT.toFixed(0)}s : round ${d.index + 1} (${d.unit.name}) remporté par ${d.winner >= 0 ? g.players[d.winner].name : 'personne'} [${d.reason}] — score ${g.standings().map(p => p.name + ' ' + p.roundsWon).join(' / ')}`);
  if (t === 'round') console.log(`  ${simT.toFixed(0)}s : round ${d.index + 1} (${d.unit.name}) commence`);
  if (t === 'invasion') console.log(`  ${simT.toFixed(0)}s : vague ${d.wave} — ${d.count} envahisseurs par le ${d.side}`);
});
const t0 = Date.now();
while (simT < maxT && g.state !== 'over') {
  g.update(dt); simT += dt;
  if (g.units.length > maxUnits) maxUnits = g.units.length;
  if (simT >= next) {
    next += 60;
    console.log(`t=${simT.toFixed(0)}s round=${g.roundIndex + 1} unités=${g.units.length} zones=${g.players.map(p => p.zones).join('/')}`);
  }
}
console.log(`\nFin : état=${g.state} à ${simT.toFixed(0)}s, max unités=${maxUnits}, calcul ${Date.now() - t0} ms` + (passive ? `, humain passif vaincu à ${defeat < 0 ? 'jamais' : defeat.toFixed(0) + 's'}` : ''));
console.log(g.players.map(p => `${p.name}: ${p.alive ? 'en vie' : 'éliminé'} zones=${p.zones} unités=${p.unitCount} supply=${Math.round(p.supply)}/${g.supplyCap(p.id)} kills=${p.kills} travailleurs=${g.workers(p.id).length} extracteurs=${g.extractors(p.id).length} minerai récolté=${p.mined | 0}` + (mode === 'rounds' ? ` rounds=${p.roundsWon}` : '')).join('\n'));
