#!/usr/bin/env node
// Simulation ordi contre ordi sans affichage, pour l'équilibrage et les tests.
// Usage : node tools/headless.js [--a=matt] [--b=jo] [--games=5] [--diff=1] [--all] [--verbose]
'use strict';
const path = require('path');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
global.window = {}; global.performance = { now: () => Date.now() };
for (const f of ['config', 'game', 'powers', 'ai']) require(path.join(__dirname, '..', 'js', f + '.js'));
const BC = window.BC;

function play(aId, bId, diff, verbose) {
  const g = new BC.Game({ teams: [BC.teamById(aId), BC.teamById(bId)], ctrl: ['cpu', 'cpu'], difficulty: diff, intro: false });
  let t = 0; const log = [];
  while (g.phase !== 'end' && t < 300) {
    g.update(BC.STEP); t += BC.STEP;
    for (const e of g.events) if (verbose && ['hit', 'ko', 'catch', 'super'].includes(e.type)) log.push(`${t.toFixed(1)}s ${e.type} ${e.p ? e.p.def.name : ''}${e.dmg ? ' -' + e.dmg : ''}${e.superId ? ' (' + e.superId + ')' : ''}`);
    g.events.length = 0;
  }
  return { winner: g.winner, time: t, stats: g.stats, log, hp: [0, 1].map(k => g.inner(k).map(p => p.def.name + ':' + p.hp).join(' ')) };
}

const diff = +(args.diff || 1), games = +(args.games || 5);
if (args.all) {
  const ids = BC.TEAMS.map(t => t.id), wins = Object.fromEntries(ids.map(i => [i, 0]));
  for (const a of ids) for (const b of ids) if (a !== b) for (let i = 0; i < games; i++) { const r = play(a, b, diff); if (r.winner === 0) wins[a]++; else if (r.winner === 1) wins[b]++; }
  console.log('Victoires par équipe (' + games + ' matchs par paire, ordi ' + BC.DIFFICULTIES[diff] + ') :');
  for (const id of ids.sort((x, y) => wins[y] - wins[x])) console.log(`  ${BC.teamById(id).name.padEnd(10)} ${wins[id]}`);
} else {
  const a = args.a || 'matt', b = args.b || 'jo'; let wa = 0, wb = 0, tt = 0;
  for (let i = 0; i < games; i++) {
    const r = play(a, b, diff, args.verbose);
    if (args.verbose) { console.log(r.log.join('\n')); console.log('  PV finaux :', r.hp.join(' | ')); }
    if (r.winner === 0) wa++; else if (r.winner === 1) wb++; tt += r.time;
    console.log(`Match ${i + 1} : ${r.winner === 0 ? BC.teamById(a).name : r.winner === 1 ? BC.teamById(b).name : 'aucun (limite de temps)'} en ${r.time.toFixed(0)} s · lancers ${r.stats[0].throws}/${r.stats[1].throws} · spéciaux ${r.stats[0].supers}/${r.stats[1].supers} · attrapés ${r.stats[0].catches}/${r.stats[1].catches}`);
  }
  console.log(`${BC.teamById(a).name} ${wa} – ${wb} ${BC.teamById(b).name} · durée moyenne ${(tt / games).toFixed(0)} s`);
}
