#!/usr/bin/env node
// Vérifie la musique écrite dans js/music.js, sans la jouer : chaque mesure a le bon nombre de temps, toutes les parties d'un air
// ont la même longueur, les notes restent dans un registre raisonnable, et liste les frottements (deux parties à un demi-ton
// l'une de l'autre pendant au moins un temps) pour qu'on les relise.
// Usage : node tools/test-music.cjs [-v]
'use strict';
const path = require('path');
global.window = { DS: { audio: { onReady() { }, ctx() { return null; } } } };
require(path.join(__dirname, '..', 'js', 'music.js'));
const T = global.window.DS.music.TRACKS, verbose = process.argv.includes('-v');
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const nn = n => NAMES[n % 12] + (Math.floor(n / 12) - 1);
let bad = 0;
for (const name in T) {
  const tr = T[name], rubs = [];
  tr.parts.forEach((p, k) => {
    const tag = name + ' · partie ' + k + ' (' + p.inst + ')';
    if (Math.abs(p.ev.len - tr.len) > 1e-6) { bad++; console.log('✖ ' + tag + ' : ' + p.ev.len + ' temps au lieu de ' + tr.len); }
    (p.ev.bars || []).forEach((b, i) => { if (Math.abs(b - tr.meter) > 1e-6 && !(i === p.ev.bars.length - 1 && !tr.loop)) { bad++; console.log('✖ ' + tag + ' : mesure ' + (i + 1) + ' = ' + b + ' temps au lieu de ' + tr.meter); } });
    p.ev.forEach(e => e.n.forEach(n => { if (p.inst !== 'snare' && (n < 33 || n > 100)) { bad++; console.log('✖ ' + tag + ' : note hors registre ' + nn(n) + ' au temps ' + e.t); } }));
  });
  // frottements entre parties (hors percussions)
  const tuned = tr.flat.filter(e => !/snare|timp/.test(tr.parts[e.p].inst));
  for (let i = 0; i < tuned.length; i++) for (let j = i + 1; j < tuned.length; j++) {
    const a = tuned[i], b = tuned[j]; if (b.t >= a.t + a.d) break; if (a.p === b.p) continue;
    const over = Math.min(a.t + a.d, b.t + b.d) - Math.max(a.t, b.t); if (over < 1) continue;
    a.n.forEach(x => b.n.forEach(y => { const iv = Math.abs(x - y) % 12; if (iv === 1 || iv === 11) rubs.push('mesure ' + (Math.floor(Math.max(a.t, b.t) / tr.meter) + 1) + ' : ' + nn(x) + ' (' + tr.parts[a.p].inst + ') contre ' + nn(y) + ' (' + tr.parts[b.p].inst + '), ' + over + ' temps'); }));
  }
  const secs = Math.round(tr.len * 60 / tr.bpm);
  console.log((tr.loop ? '♪ ' : '♩ ') + name + ' : ' + tr.len / tr.meter + ' mesures, ' + secs + ' s, ' + tr.flat.length + ' notes, ' + rubs.length + ' frottement(s)');
  if (verbose || rubs.length) [...new Set(rubs)].forEach(r => console.log('    ' + r));
}
console.log(bad ? '✖ musique : ' + bad + ' erreur(s)' : '✔ musique : mesures et longueurs justes');
process.exit(bad ? 1 : 0);
