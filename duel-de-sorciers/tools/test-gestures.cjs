#!/usr/bin/env node
// Vérifie la reconnaissance des tracés avec des dessins « à la main » simulés (tremblement, coins arrondis,
// inclinaison, étirement, point de départ au hasard) et des gribouillis qui ne doivent pas lancer de sort.
// Usage : node tools/test-gestures.cjs
'use strict';
const G = require('../js/gestures.js');

let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const rand = (a, b) => a + rnd() * (b - a);

function sloppy(name) {
  const gl = G.GLYPHS[name];
  let pts = G.resample(gl.pts, 60);
  if (gl.closed) { // point de départ au hasard, boucle un peu trop courte ou trop longue
    const loop = pts.slice(0, -1), k = Math.floor(rnd() * loop.length);
    pts = loop.slice(k).concat(loop.slice(0, k));
    const extra = Math.round(rand(-5, 5));
    if (extra > 0) pts = pts.concat(pts.slice(0, extra)); else { pts.push(pts[0]); if (extra < 0) pts = pts.slice(0, extra); }
  }
  if (rnd() < 0.5) pts.reverse();
  if (gl.mirror && rnd() < 0.5) pts = pts.map(p => ({ x: 1 - p.x, y: p.y }));
  // coins arrondis (moyenne glissante), comme une main qui ne s'arrête pas aux angles
  const k = Math.round(rand(0, 3));
  if (k) pts = pts.map((p, i) => { let x = 0, y = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(pts.length - 1, i + k); j++) { x += pts[j].x; y += pts[j].y; n++; } return { x: x / n, y: y / n }; });
  const size = rand(90, 420), sx = rand(0.75, 1.3), ang = rand(-0.28, 0.28) + (gl.turns ? rand(0, Math.PI * 2) : 0), jit = 0.025;
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map(p => {
    const x = (p.x - 0.5) * sx + rand(-jit, jit), y = (p.y - 0.5) + rand(-jit, jit);
    return { x: 600 + (x * c - y * s) * size, y: 400 + (x * s + y * c) * size };
  });
}

const poly = (pairs, size = 220) => G.resample(pairs.map(([x, y]) => ({ x: 500 + x * size, y: 300 + y * size })), 50);
const NEGATIVES = {
  'trait vertical': poly([[0, 0], [0, 1]]),
  'trait en biais raide': poly([[0, 0], [0.12, 1]]),
  'gribouillis': Array.from({ length: 50 }, () => ({ x: 500 + rand(0, 250), y: 300 + rand(0, 250) })),
  'point': poly([[0, 0], [0.05, 0.03]], 100)
};

let failed = 0;
const TRIES = 600;
for (const name of Object.keys(G.GLYPHS)) {
  let ok = 0, wrong = {}, q = { parfait: 0, bien: 0, passable: 0 };
  for (let i = 0; i < TRIES; i++) {
    const r = G.recognize(sloppy(name));
    if (r && r.id === name) { ok++; q[r.quality]++; } else { const k = r ? r.id : 'raté'; wrong[k] = (wrong[k] || 0) + 1; }
  }
  const pct = ok / TRIES * 100, pass = pct >= 92; // toutes les formes sont en lice ici ; en duel, seules celles de la ceinture le sont
  if (!pass) failed++;
  console.log((pass ? '✔' : '✖') + ' ' + name.padEnd(10) + pct.toFixed(1).padStart(6) + ' %  parfait ' + q.parfait + ' · bien ' + q.bien + ' · passable ' + q.passable + (Object.keys(wrong).length ? '  erreurs ' + JSON.stringify(wrong) : ''));
}
for (const [label, pts] of Object.entries(NEGATIVES)) {
  const r = G.recognize(pts), pass = !r;
  if (!pass) failed++;
  console.log((pass ? '✔' : '✖') + ' ' + label.padEnd(15) + (r ? 'reconnu à tort comme ' + r.id + ' (' + r.dist.toFixed(3) + ')' : 'rejeté'));
}
// Le trait (Scintilla) : n'importe quel angle sauf la verticale, et pas trop court.
const stroke = (deg, len = 220) => { const a = deg * Math.PI / 180; return G.resample([{ x: 500, y: 300 }, { x: 500 + Math.cos(a) * len * 0.5 + 3, y: 300 + Math.sin(a) * len * 0.5 - 2 }, { x: 500 + Math.cos(a) * len, y: 300 + Math.sin(a) * len }], 40); };
const LINES = [[0, 'line'], [30, 'line'], [-45, 'line'], [45, 'line'], [60, 'line'], [-60, 'line'], [135, 'line'], [80, null], [90, null], [-90, null]];
for (const [deg, want] of LINES) {
  const r = G.recognize(stroke(deg)), got = r ? r.id : null, pass = got === want && (!r || r.quality !== 'passable');
  if (!pass) failed++;
  console.log((pass ? '✔' : '✖') + ' trait à ' + String(deg).padStart(4) + '°  ' + (r ? r.id + ' (' + r.quality + ')' : 'rejeté : ' + G.why));
}
for (const [len, opts, want] of [[90, { min: 70, minLine: 110 }, null], [130, { min: 70, minLine: 110 }, 'line'], [90, {}, 'line']]) {
  const r = G.recognize(stroke(10, len), opts), got = r ? r.id : null, pass = got === want && (want || G.why === 'short');
  if (!pass) failed++;
  console.log((pass ? '✔' : '✖') + ' trait de ' + len + ' px, minimum ' + (opts.minLine || 45) + '  ' + (r ? r.id : 'rejeté : ' + G.why));
}
console.log(failed ? '\n✖ ' + failed + ' échec(s)' : '\n✔ reconnaissance des tracés : tout passe');
process.exit(failed ? 1 : 0);
