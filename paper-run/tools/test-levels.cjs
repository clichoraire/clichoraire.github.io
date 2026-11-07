#!/usr/bin/env node
// Vérifie chaque tableau : structure, puis une recherche A* sur la vraie physique pour chaque difficulté
// (les pouvoirs des adversaires), qui prouve que le drapeau est atteignable et donne le meilleur chemin.
// Usage : node tools/test-levels.cjs [id…]        (depuis le dossier PaperRun)
//         BUILD=1 node tools/test-levels.cjs       → écrit aussi les chemins des adversaires dans js/paths.js
//         JSON=1                                   → une ligne JSON de résultats à la fin
'use strict';
const path = require('path'), fs = require('fs');
const PR = require(path.join(__dirname, '..', 'js', 'physics.js'));
require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'levels.js'));
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const TICK = 1 / 20, MAX_T = 240, MAX_STATES = 6e6, WEIGHT = 2.5;

class Heap { constructor() { this.a = []; } push(f, v) { const a = this.a; a.push([f, v]); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; } get size() { return this.a.length; } }

// Drapeaux de pose enregistrés pour l'adversaire : sol, face droite, élan, monte, glisse mur, plane.
const flagsOf = s => (s.ground ? 1 : 0) | (s.face > 0 ? 2 : 0) | (s.dashing ? 4 : 0) | (s.vy < -50 ? 8 : 0) | (s.sliding ? 16 : 0) | (s.gliding ? 32 : 0) | (s.warpT > 0 ? 64 : 0);

// A* sur les états physiques : coût = temps, heuristique = temps minimal pour rejoindre le drapeau.
function search(lvl, cfg) {
  const actions = [{ dir: 1, held: true }, { dir: 1, held: false }, { dir: -1, held: true }, { dir: -1, held: false }, { dir: 0, held: false }];
  if (cfg.dashLevel > 0) actions.push({ dir: 1, held: false, dash: true }, { dir: -1, held: false, dash: true });
  if (Object.values(lvl.pipes).some(list => list.length > 1)) actions.push({ dir: 0, held: false, down: true });
  const period = lvl.movers.length ? lvl.movers.reduce((a, m) => a + m.period, 0) / lvl.movers.length : 0;
  const seen = new Set(); const f = lvl.finish; const fx = f.x + 24, fy = f.y;
  const h = s => Math.abs(s.x + 14 - fx) / (PR.PHYS.RUN * cfg.speed * 1.05 + (cfg.dashLevel ? 60 : 0)) + Math.max(0, (s.y + 56 - fy - 48)) / 1200;
  const key = s => {
    const phase = period ? Math.floor((s.t % period) / 0.2) : 0;
    return [Math.round(s.x / 12), Math.round(s.y / 12), Math.round(s.vx / 160), Math.round(s.vy / 300), s.held ? 1 : 0, s.prevHeld ? 1 : 0, s.ground ? 1 : 0, s.jumps, s.carrier, s.cp, s.broken, phase, cfg.dashLevel ? Math.round(Math.max(0, s.dashCd) * 4) : 0, s.warpT > 0 ? 1 : 0].join(',');
  };
  const nodes = [];                       // enregistrements compacts pour reconstruire le chemin
  const open = new Heap(); const s0 = Object.assign(PR.newState(lvl), { prevHeld: false, node: 0 });
  nodes.push({ p: -1, x: s0.x, y: s0.y, f: flagsOf(s0) }); open.push(h(s0), s0);
  let states = 0, far = 0;
  const finish = n => { const pts = []; for (let i = n.node; i >= 0; i = nodes[i].p) pts.push(nodes[i]); pts.reverse(); return { ok: true, time: n.t, states, far: lvl.pw, pts }; };
  while (open.size) {
    const [, s] = open.pop();
    if (s.t > MAX_T) return { ok: false, reason: 'temps écoulé', states, far };
    for (const a of actions) {
      const n = Object.assign({}, s);
      PR.advance(n, { dir: a.dir, jump: a.held && !s.prevHeld, jumpHeld: a.held, dash: !!a.dash, down: !!a.down }, TICK, lvl, cfg);
      n.prevHeld = a.held;
      if (n.deaths > s.deaths) continue;
      n.node = nodes.length; nodes.push({ p: s.node, x: n.x, y: n.y, f: flagsOf(n) });
      if (n.win) return finish(n);
      const k = key(n); if (seen.has(k)) { nodes.pop(); continue; } seen.add(k); states++;
      far = Math.max(far, n.x);
      open.push(n.t + WEIGHT * h(n), n);
    }
    if (states > MAX_STATES) return { ok: false, reason: 'trop d’états', states, far };
  }
  return { ok: false, reason: 'cul-de-sac', states, far };
}

let fail = 0;
const results = [], paths = {};
for (const def of PR.LEVELS) {
  if (only.length && !only.includes(def.id)) continue;
  const problems = [];
  const flat = def.map.join('');
  if (flat.split('S').length !== 2) problems.push('départ : ' + (flat.split('S').length - 1));
  if (flat.split('F').length !== 2) problems.push('arrivée : ' + (flat.split('F').length - 1));
  const bad = flat.replace(/[#\-o*^~SFcsmn%ef?TBI|Cjkgap Z0-9.]/g, ''); if (bad) problems.push('caractères inconnus : ' + bad);
  const lvl = PR.parseLevel(def);
  if (!lvl.finish) problems.push('pas de drapeau');
  const coins = lvl.coins.reduce((a, c) => a + (c.big ? 5 : 1), 0);
  let line = `${def.id.padEnd(4)} ${def.name.padEnd(24)} ${lvl.w}×${lvl.h}  pièces ${String(coins).padStart(3)}  cubes ${lvl.items.length}  ennemis ${String(lvl.enemies.length).padStart(2)}  drapeaux ${lvl.checkpoints.length} `;
  if (problems.length) { console.log(line + ' ✖ ' + problems.join(', ')); fail++; continue; }
  const times = {}; let bad1 = false;
  for (const d of PR.DIFFICULTIES) {
    const t0 = Date.now(); const r = search(lvl, PR.buildCfg(d.powers)); const ms = Date.now() - t0;
    if (r.ok) { times[d.id] = r.time; line += ` ${d.name} ${r.time.toFixed(1)} s`; paths[def.id] = paths[def.id] || {}; paths[def.id][d.id] = { dt: TICK, time: +r.time.toFixed(3), pts: r.pts.map(p => [Math.round(p.x), Math.round(p.y), p.f]) }; }
    else { line += ` ${d.name} ✖ ${r.reason} (x=${Math.round((r.far || 0) / 48)})`; bad1 = true; }
    line += ` [${ms} ms]`;
  }
  if (times.feuille && times.carton && times.origami) {
    const gainC = times.feuille - times.carton, gainO = times.feuille - times.origami;
    line += `  → raccourcis : Carton −${gainC.toFixed(1)} s, Origami −${gainO.toFixed(1)} s`;
    if (gainC < 1 && gainO < 1) line += '  ⚠ aucun raccourci utile';
  }
  console.log((bad1 ? '✖ ' : '✔ ') + line);
  if (bad1) fail++; else results.push({ id: def.id, times });
}
if (process.env.JSON) console.log(JSON.stringify(results));
if (process.env.BUILD && !fail && !only.length) {
  const out = '// Paper Run — chemins des adversaires, GÉNÉRÉ par `BUILD=1 node tools/test-levels.cjs` (A* sur la physique, par difficulté).\n' +
    '// Format : PR.PATHS[tableau][difficulté] = { dt, time, pts: [[x, y, drapeaux]…] } ; drapeaux : 1 sol, 2 face droite, 4 élan, 8 monte, 16 glisse, 32 plane.\n' +
    '(function (root) { const PR = root.PR = root.PR || {}; PR.PATHS = ' + JSON.stringify(paths) + '; if (typeof module !== "undefined") module.exports = PR; })(typeof window !== "undefined" ? window : globalThis);\n';
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'paths.js'), out);
  console.log('✔ js/paths.js écrit (' + (out.length / 1024).toFixed(0) + ' Ko)');
}
console.log(fail ? `✖ ${fail} tableau(x) à corriger` : '✔ tous les tableaux sont finissables');
process.exit(fail ? 1 : 0);
