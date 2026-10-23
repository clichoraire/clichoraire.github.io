// Simulation sans affichage : ordinateur contre ordinateur, pour vérifier l'équilibre des équipes et des pouvoirs.
// Usage : node tools/headless.js [--a=matt] [--b=bibi] [--games=10] [--period=120] [--diff=1] [--seed=1] [--all] [--verbose]
//   --all : fait jouer toutes les paires d'équipes (round robin) et affiche le classement.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
globalThis.window = globalThis;
for (const f of ['config', 'game', 'ai']) vm.runInThisContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
const HK = globalThis.HK;
const flag = (n, d) => { const f = process.argv.find(a => a.startsWith('--' + n + '=')); return f ? f.slice(n.length + 3) : d; };
const games = +flag('games', 10), period = +flag('period', 120), diff = +flag('diff', 1), seed0 = +flag('seed', 1);
const verbose = process.argv.includes('--verbose');

function play(aId, bId, seed) {
  const g = new HK.Game({ teams: [HK.teamById(aId), HK.teamById(bId)], ctrl: ['cpu', 'cpu'], periodLen: period, difficulty: diff, seed });
  const dt = HK.STEP; let steps = 0; const powers = {};
  while (g.phase !== 'over' && steps < 60 * 60 * 40) {
    g.update(dt); steps++;
    for (const e of g.takeEvents()) {
      if (e.type === 'power') powers[e.s.id] = (powers[e.s.id] || 0) + 1;
      if (verbose && e.type === 'goal') console.log(`  ${g.period}P ${g.clockText()} BUT ${g.teams[e.team].def.name} — ${e.scorer ? e.scorer.def.name : '?'}${e.assist ? ' (passe ' + e.assist.def.name + ')' : ''}${e.own ? ' [contre son camp]' : ''}`);
      if (verbose && e.type === 'change') console.log(`  changement ${g.teams[e.team].def.name} : ${e.inn.def.name} remplace ${e.out.def.name}`);
    }
  }
  return { g, powers, steps };
}
function summary(aId, bId) {
  let wa = 0, wb = 0, ties = 0, ga = 0, gb = 0, sa = 0, sb = 0, ha = 0, hb = 0, ot = 0; const pw = {}; const t0 = Date.now();
  for (let i = 0; i < games; i++) {
    const { g, powers } = play(aId, bId, seed0 + i * 7919);
    const [A, B] = g.teams;
    if (g.winner === 0) wa++; else if (g.winner === 1) wb++; else ties++;
    if (g.ot) ot++;
    ga += A.score; gb += B.score; sa += A.shots; sb += B.shots; ha += A.hits; hb += B.hits;
    for (const k in powers) pw[k] = (pw[k] || 0) + powers[k];
    if (verbose) console.log(`partie ${i + 1} : ${A.def.name} ${A.score} - ${B.score} ${B.def.name}${g.ot ? ' (prol.)' : ''} tirs ${A.shots}/${B.shots} mises en échec ${A.hits}/${B.hits}`);
  }
  console.log(`${aId} vs ${bId} (${games} parties, ${period}s/période, diff ${diff}) : ${wa}-${wb}-${ties}, buts ${(ga / games).toFixed(1)} / ${(gb / games).toFixed(1)}, tirs ${(sa / games).toFixed(0)} / ${(sb / games).toFixed(0)}, échecs ${(ha / games).toFixed(0)} / ${(hb / games).toFixed(0)}, prol. ${ot}, ${Date.now() - t0} ms`);
  console.log('  pouvoirs/partie : ' + Object.keys(pw).map(k => `${k} ${(pw[k] / games).toFixed(1)}`).join(', '));
  return { wa, wb, ties, ga, gb };
}
if (process.argv.includes('--all')) {
  const ids = HK.TEAMS.map(t => t.id); const pts = {}; const gf = {}, gaT = {};
  for (const id of ids) { pts[id] = 0; gf[id] = 0; gaT[id] = 0; }
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const r = summary(ids[i], ids[j]);
    pts[ids[i]] += r.wa * 2 + r.ties; pts[ids[j]] += r.wb * 2 + r.ties; gf[ids[i]] += r.ga; gaT[ids[i]] += r.gb; gf[ids[j]] += r.gb; gaT[ids[j]] += r.ga;
  }
  console.log('\nClassement : ' + ids.sort((a, b) => pts[b] - pts[a]).map(id => `${id} ${pts[id]} pts (${gf[id]}-${gaT[id]})`).join(' | '));
} else summary(flag('a', 'matt'), flag('b', 'bibi'));
