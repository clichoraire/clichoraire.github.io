// Musique du jeu : un petit orchestre synthétisé (célesta, harpe, cordes, cuivres, flûte, timbales…), sans aucun fichier audio.
// Les airs sont écrits ici, note à note, puis joués en boucle par un séquenceur. Ce sont des compositions originales,
// dans l'esprit des musiques d'école de sorciers : valse en mineur au célesta, harpe, accords « magiques » (mi mineur → mi bémol → si).
//
// Écrire un air : 'E5 G5:2 r:.5 C4+E4+G4:3 |' — une note (do = C … si = B, puis l'octave), sa durée en temps après « : » (1 par défaut),
// r = silence, + = accord, | = barre de mesure (vérifiée par tools/test-music.cjs). L'accompagnement se déduit d'une suite d'accords ('Em', 'B7'…).
(function () {
  'use strict';
  var DS = window.DS, AU = DS.audio;
  var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function acc(s) { return s === '#' ? 1 : s === 'b' ? -1 : 0; }
  function midi(s) { var m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) throw new Error('note inconnue : ' + s); return 12 * (+m[3] + 1) + PC[m[1]] + acc(m[2]); }
  function hz(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  // ───────────────────────── Écriture ─────────────────────────
  // Un air écrit → liste d'événements { t, d, n: [notes midi] } (t et d en temps), avec sa longueur (len) et celle de chaque mesure (bars).
  function parse(str) {
    var ev = [], t = 0, bars = [], b0 = 0;
    str.trim().split(/\s+/).forEach(function (tok) {
      if (tok === '|') { bars.push(t - b0); b0 = t; return; }
      var p = tok.split(':'), d = p[1] === undefined ? 1 : +p[1];
      if (!(d > 0)) throw new Error('durée inconnue : ' + tok);
      if (p[0] !== 'r') ev.push({ t: t, d: d, n: p[0].split('+').map(midi) });
      t += d;
    });
    if (t > b0) bars.push(t - b0);
    ev.len = t; ev.bars = bars;
    return ev;
  }
  function seqOf(x) { return typeof x === 'string' ? parse(x) : x; }
  function rest(beats) { var ev = []; ev.len = beats; return ev; }
  function cat() { // met des passages bout à bout
    var out = [], t = 0;
    Array.prototype.forEach.call(arguments, function (x) { var ev = seqOf(x); ev.forEach(function (e) { out.push({ t: e.t + t, d: e.d, n: e.n }); }); t += ev.len; });
    out.len = t;
    return out;
  }
  function shift(x, semis) { var ev = seqOf(x), out = ev.map(function (e) { return { t: e.t, d: e.d, n: e.n.map(function (n) { return n + semis; }) }; }); out.len = ev.len; return out; }
  function twice(a) { return a.concat(a); }
  function none(n) { var a = []; while (n--) a.push(null); return a; }

  // Accords : 'Em', 'B7', 'CM7', 'F#dim'… → note de base et intervalles.
  function chord(name) {
    var m = /^([A-G])([#b]?)(m|dim)?(7|M7)?$/.exec(name); if (!m) throw new Error('accord inconnu : ' + name);
    var ints = m[3] === 'm' ? [0, 3, 7] : m[3] === 'dim' ? [0, 3, 6] : [0, 4, 7];
    if (m[4] === '7') ints.push(10); if (m[4] === 'M7') ints.push(11);
    return { r: (PC[m[1]] + acc(m[2]) + 12) % 12, i: ints };
  }
  function up(pc, lo) { return lo + ((pc - lo) % 12 + 12) % 12; }                                             // la note pc la plus grave à partir de lo
  function stack(c, lo, k) { var n = c.i.length; return up(c.r, lo) + c.i[k % n] + 12 * Math.floor(k / n); }  // k-ième note de l'accord en montant depuis sa basse
  function voiced(c, lo) { return c.i.map(function (x) { return up(c.r + x, lo); }).sort(function (a, b) { return a - b; }); } // l'accord serré dans une octave : les voix bougent peu d'un accord à l'autre
  // Accompagnements : chords = un accord par mesure (null = mesure de silence), meter = temps par mesure.
  // line : rhythm = [[temps, durée, k]] joué à chaque mesure sur la k-ième note de l'accord (basse, arpèges, timbales).
  function line(chords, meter, lo, rhythm) {
    var ev = [];
    chords.forEach(function (name, b) { if (!name) return; var c = chord(name); rhythm.forEach(function (r) { if (r[2] !== null) ev.push({ t: b * meter + r[0], d: r[1], n: [stack(c, lo, r[2])] }); }); });
    ev.len = chords.length * meter;
    return ev;
  }
  function steps(idx, step) { return idx.map(function (k, j) { return [j * step, step, k]; }); }               // arpège régulier
  function stabs(chords, meter, lo, times, d) {                                                                // accords plaqués
    var ev = [];
    chords.forEach(function (name, b) { if (!name) return; var n = voiced(chord(name), lo); times.forEach(function (t) { ev.push({ t: b * meter + t, d: d, n: n }); }); });
    ev.len = chords.length * meter;
    return ev;
  }
  function pad(chords, meter, lo) {                                                                            // accords tenus (deux mesures du même accord : une seule tenue)
    var ev = [], last = null, prev = null;
    chords.forEach(function (name, b) {
      if (name && name === prev) last.d += meter; else if (name) { last = { t: b * meter, d: meter, n: voiced(chord(name), lo) }; ev.push(last); }
      prev = name;
    });
    ev.len = chords.length * meter;
    return ev;
  }

  // ───────────────────────── Instruments ─────────────────────────
  // Chacun : (contexte, sortie, instant, fréquence, durée en secondes, volume, bruit).
  function osc(a, type, f, t, end, dest, cents) { var o = a.createOscillator(); o.type = type; o.frequency.value = f; if (cents) o.detune.value = cents; o.connect(dest); o.start(t); o.stop(end); return o; }
  function pluck(a, out, t, v, dec, att) { var g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); g.connect(out); return g; }
  function swell(a, out, t, v, att, d, rel) { var g = a.createGain(), hold = Math.max(att, d); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.setValueAtTime(v, t + hold); g.gain.linearRampToValueAtTime(0.0001, t + hold + rel); g.connect(out); return g; }
  function lowpass(a, f0, dest, q) { var fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = q || 0.7; fl.frequency.value = Math.min(16000, f0); fl.connect(dest); return fl; }
  function vibrato(a, t, end, oscs, cents, delay) { var l = a.createOscillator(), g = a.createGain(); l.frequency.value = 5.6; g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(cents, t + delay + 0.25); l.connect(g); oscs.forEach(function (o) { g.connect(o.detune); }); l.start(t); l.stop(end); }
  function hiss(a, nz, t, dur, dest) { var s = a.createBufferSource(); s.buffer = nz; s.connect(dest); s.start(t, Math.random(), dur); }
  var INST = {
    celesta: function (a, out, t, f, d, v) { // petite cloche : une sinusoïde dont l'attaque est « froissée » par une autre, quatre fois plus aiguë
      var dec = Math.min(2.2, Math.max(0.6, 900 / f + 0.6)), end = t + dec + 0.05, g = pluck(a, out, t, v, dec), c = osc(a, 'sine', f, t, end, g), mg = a.createGain();
      osc(a, 'sine', f * 4, t, end, mg); mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.04, t + 0.3); mg.connect(c.frequency);
    },
    glock: function (a, out, t, f, d, v) {
      var g = pluck(a, out, t, v * 2, 1.1), g2 = pluck(a, out, t, v * 0.6, 0.3);
      osc(a, 'sine', f, t, t + 1.15, g); osc(a, 'sine', f * 2.76, t, t + 0.35, g2);
    },
    harp: function (a, out, t, f, d, v) {
      var dec = Math.min(2.4, Math.max(0.7, 700 / f + 0.7)), end = t + dec + 0.05, g = pluck(a, out, t, v, dec), fl = lowpass(a, f * 7, g), sg = a.createGain();
      fl.frequency.setValueAtTime(Math.min(9000, f * 7), t); fl.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.4);
      osc(a, 'triangle', f, t, end, fl); sg.gain.value = 0.3; sg.connect(fl); osc(a, 'sawtooth', f, t, end, sg);
    },
    pizz: function (a, out, t, f, d, v) {
      var g = pluck(a, out, t, v * 2.2, 0.3), fl = lowpass(a, f * 5, g);
      fl.frequency.setValueAtTime(Math.min(8000, f * 5), t); fl.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.12);
      osc(a, 'sawtooth', f, t, t + 0.35, fl);
    },
    spicc: function (a, out, t, f, d, v) { // cordes jouées très court : l'ostinato des duels
      var g = pluck(a, out, t, v * 2, 0.17, 0.008), fl = lowpass(a, Math.min(5000, f * 6), g);
      osc(a, 'sawtooth', f, t, t + 0.2, fl, -6); osc(a, 'sawtooth', f, t, t + 0.2, fl, 7);
    },
    strings: function (a, out, t, f, d, v) {
      var end = t + Math.max(0.14, d) + 0.35, g = swell(a, out, t, v * 0.75, 0.14, d, 0.3), fl = lowpass(a, Math.min(3200, f * 5), g, 0.5);
      osc(a, 'sawtooth', f, t, end, fl, -7); osc(a, 'sawtooth', f, t, end, fl, 7);
    },
    violin: function (a, out, t, f, d, v) {
      var end = t + Math.max(0.08, d) + 0.3, g = swell(a, out, t, v * 0.6, 0.08, d, 0.25), fl = lowpass(a, Math.min(4200, f * 5), g, 0.5);
      vibrato(a, t, end, [osc(a, 'sawtooth', f, t, end, fl, -5), osc(a, 'sawtooth', f, t, end, fl, 5)], 9, 0.12);
    },
    brass: function (a, out, t, f, d, v) { // le son s'éclaircit pendant l'attaque, comme un cor
      var end = t + Math.max(0.04, d) + 0.15, g = swell(a, out, t, v * 0.6, 0.04, d, 0.11), fl = lowpass(a, f * 1.5, g, 1);
      fl.frequency.setValueAtTime(f * 1.5, t); fl.frequency.exponentialRampToValueAtTime(Math.min(6000, f * 5), t + 0.09); fl.frequency.exponentialRampToValueAtTime(Math.min(4000, f * 3), t + 0.3);
      osc(a, 'sawtooth', f, t, end, fl); osc(a, 'sawtooth', f, t, end, fl, 6);
    },
    flute: function (a, out, t, f, d, v) {
      var end = t + Math.max(0.06, d) + 0.2, g = swell(a, out, t, v * 0.5, 0.06, d, 0.14), tg = a.createGain();
      tg.gain.value = 0.22; tg.connect(g);
      vibrato(a, t, end, [osc(a, 'sine', f, t, end, g), osc(a, 'triangle', f, t, end, tg)], 8, 0.15);
    },
    reed: function (a, out, t, f, d, v) { // clarinette ou basson : un son carré adouci
      var end = t + Math.max(0.02, d) + 0.1, g = swell(a, out, t, v * 0.5, 0.015, d, 0.06), fl = lowpass(a, f * 4.5, g);
      osc(a, 'square', f, t, end, fl);
    },
    bass: function (a, out, t, f, d, v) {
      var end = t + Math.max(0.02, d) + 0.16, g = swell(a, out, t, v * 0.5, 0.012, d, 0.12), fl = lowpass(a, 520, g), sg = a.createGain();
      osc(a, 'triangle', f, t, end, fl); sg.gain.value = 0.35; sg.connect(fl); osc(a, 'sawtooth', f, t, end, sg);
    },
    timp: function (a, out, t, f, d, v, nz) {
      var g = pluck(a, out, t, v * 1.5, 0.8), o = osc(a, 'sine', f, t, t + 0.85, g), ng = pluck(a, out, t, v * 0.8, 0.07);
      o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      hiss(a, nz, t, 0.09, lowpass(a, 500, ng));
    },
    snare: function (a, out, t, f, d, v, nz) {
      var g = pluck(a, out, t, v * 4, 0.11), bp = a.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.7; bp.connect(g); hiss(a, nz, t, 0.13, bp);
      var o = osc(a, 'sine', 190, t, t + 0.1, pluck(a, out, t, v * 1.5, 0.08)); o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    }
  };

  // ───────────────────────── Les airs ─────────────────────────
  // part : { inst, vol, seq (air écrit ou accompagnement), gate (part de la durée réellement tenue), layer ('hot' : ne joue que quand le duel chauffe) }
  var T = {};
  function track(name, bpm, meter, loop, vol, parts) {
    var len = 0, flat = [];
    parts.forEach(function (p, k) { p.ev = seqOf(p.seq); len = Math.max(len, p.ev.len); p.ev.forEach(function (e) { flat.push({ t: e.t, d: e.d, n: e.n, p: k }); }); });
    flat.sort(function (a, b) { return a.t - b.t; });
    T[name] = { name: name, bpm: bpm, meter: meter, loop: loop, vol: vol, parts: parts, len: len, flat: flat };
  }

  // ── Le thème de l'école (titre) : valse en mi mineur au célesta ──
  var thA = 'E5 G5 B5 | C6:2 B5 | A5 F#5 A5 | G5:2 E5 | E5 G5 B5 | D6:2 B5 | Bb5 G5 Eb5 | F#5:3 | E5 G5 B5 | E6:1.5 D6:.5 C6 | B5 G5 E5 | F5:2 A5 | G5 F#5 E5 | D#5 F#5 B5 | E6:3 | r:3 |';
  var thB = 'G5:2 B5 | D6:2 B5 | C6 B5 A5 | B5:3 | G5:2 B5 | E6:2 C6 | B5 A5 F#5 | A5 F#5 D#5 |';
  var cA = ['Em', 'C', 'B7', 'Em', 'Em', 'G', 'Eb', 'B', 'Em', 'Am', 'Em', 'F', 'Am', 'B7', 'Em', 'Em'], cB = ['G', 'Bm', 'Am', 'Em', 'C', 'C', 'B7', 'B7'], cTh = cA.concat(cB, cA);
  var fill3 = 'E6:.5 G6:.5 B6:.5 E7:1.5 |';
  track('theme', 152, 3, true, 1, [
    { inst: 'celesta', vol: 0.5, seq: cat(thA, rest(24), thA) },
    { inst: 'flute', vol: 0.3, seq: cat(rest(48), thB, rest(48)) },
    { inst: 'violin', vol: 0.2, seq: cat(rest(72), shift(thA, -12)) },
    { inst: 'harp', vol: 0.15, seq: line(cTh, 3, 45, steps([0, 2, 3, 4, 3, 2], 0.5)) },
    { inst: 'bass', vol: 0.24, seq: line(cTh, 3, 40, [[0, 3, 0]]) },
    { inst: 'strings', vol: 0.1, seq: pad(none(16).concat(cB, cA), 3, 55) },
    { inst: 'glock', vol: 0.1, seq: cat(rest(45), fill3, rest(69), fill3) }
  ]);

  // ── La carte de l'école, le grimoire, les talents : promenade tranquille en sol majeur, qui finit sur mi bémol → fa → sol ──
  var caM = 'D5:2 G5 B5 | B5:1.5 A5:.5 G5:2 | E5:2 G5 C6 | B5 A5:3 | D5:2 G5 B5 | D6:1.5 B5:.5 F#5:2 | G5 E5 G5 C6 | A5:2 F#5:2 | G5:2 B5 E6 | E6:1.5 D6:.5 C6:2 | B5 D6 B5 G5 | A5:4 | Bb5:2 G5 Eb5 | C6:2 A5:2 | B5 D6:3 | r:4 |';
  var cCa = ['G', 'Em', 'C', 'D', 'G', 'Bm', 'C', 'D7', 'Em', 'C', 'G', 'D', 'Eb', 'F', 'G', 'G'];
  var fill4 = 'r:2 D6:.5 G6:.5 B6:.5 D7:.5 |';
  track('carte', 88, 4, true, 1.15, [
    { inst: 'flute', vol: 0.3, seq: cat(caM, rest(64)) },
    { inst: 'celesta', vol: 0.5, seq: cat(rest(64), caM) },
    { inst: 'harp', vol: 0.17, seq: line(twice(cCa), 4, 43, steps([0, 2, 3, 4, 5, 4, 3, 2], 0.5)) },
    { inst: 'bass', vol: 0.2, seq: line(none(16).concat(cCa), 4, 38, [[0, 4, 0]]) },
    { inst: 'strings', vol: 0.09, seq: pad(none(16).concat(cCa), 4, 55) },
    { inst: 'glock', vol: 0.08, seq: cat(rest(60), fill4, rest(60), fill4) }
  ]);

  // ── Les magasins : un air espiègle, basson et cordes pincées ──
  var boA = 'C5:.5 Eb5:.5 G5:.5 Eb5:.5 C5:.5 Eb5:.5 G5 | Ab5:.5 G5:.5 F#5:.5 G5:.5 Eb5 C5 | B4:.5 D5:.5 F5:.5 D5:.5 B4:.5 D5:.5 G5 | Ab5:.5 G5:.5 F5:.5 Eb5:.5 D5:.5 Eb5:.5 C5 | C5:.5 Eb5:.5 Ab5:.5 Eb5:.5 C6 Ab5 | Bb5:.5 G5:.5 Eb5:.5 G5:.5 Bb5 G5 | A5:.5 F#5:.5 D5:.5 F#5:.5 A5:.5 C6:.5 A5 | G5 r:.5 G5:.5 F5:.5 D5:.5 B4 |';
  var boB = 'C5:.5 Eb5:.5 G5:.5 Eb5:.5 C5:.5 Eb5:.5 G5 | Ab5:.5 G5:.5 F#5:.5 G5:.5 Eb5 C5 | F5:.5 Ab5:.5 C6:.5 Ab5:.5 F5:.5 Ab5:.5 C6 | Eb6:.5 D6:.5 C6:.5 G5:.5 Eb5 C5 | Ab5:.5 C6:.5 Eb6 C6:.5 Ab5:.5 Eb5 | D5:.5 F5:.5 G5:.5 B5:.5 D6 B5 | C6:.5 G5:.5 Eb5:.5 G5:.5 C5 r | r:2 G4:.5 A4:.5 B4 |';
  var boM = cat(boA, boB), cBo = ['Cm', 'Cm', 'G7', 'Cm', 'Ab', 'Eb', 'D7', 'G7', 'Cm', 'Cm', 'Fm', 'Cm', 'Ab', 'G7', 'Cm', 'G7'];
  track('boutique', 126, 4, true, 1.2, [
    { inst: 'reed', vol: 0.3, gate: 0.7, seq: cat(shift(boM, -12), boM) },
    { inst: 'glock', vol: 0.09, seq: cat(rest(64), shift(boM, 12)) },
    { inst: 'pizz', vol: 0.34, seq: line(twice(cBo), 4, 36, [[0, 1, 0], [2, 1, 2]]) },
    { inst: 'pizz', vol: 0.15, seq: stabs(twice(cBo), 4, 55, [1, 3], 0.5) }
  ]);

  // ── En classe : presque rien, pour laisser parler le professeur ──
  var clM = 'r:4 | E5 G5 B5:2 | r:4 | A5:2 F#5:2 | r:4 | G5 E5 C6:2 | r:4 | F#5:2 D#5:2 | r:4 | E5 G5 C6:2 | B5:2 D6:2 | A5:4 | r:4 | A5:2 F#5:2 | G5 B5 E6:2 | r:4 |';
  var cCl = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B7', 'Em', 'C', 'G', 'D', 'C', 'D', 'Em', 'Em'];
  track('classe', 66, 4, true, 1, [
    { inst: 'celesta', vol: 0.34, seq: clM },
    { inst: 'harp', vol: 0.2, seq: line(cCl, 4, 45, steps([0, 2, 3, 4], 1)) },
    { inst: 'strings', vol: 0.08, seq: pad(cCl, 4, 52) }
  ]);

  // ── L'échauffement avant le duel : on retient son souffle ──
  var prM = 'E5 G5 B5:2 | r:4 | E5 G5 C6:2 | r:4 | E5 A5 C6:2 | r:4 | D#5 F#5 B5:2 | r:2 B5:.5 A5:.5 F#5:.5 D#5:.5 |';
  var cPr = ['Em', 'Em', 'C', 'C', 'Am', 'Am', 'B7', 'B7'];
  track('prep', 96, 4, true, 1, [
    { inst: 'celesta', vol: 0.36, seq: prM },
    { inst: 'strings', vol: 0.13, seq: pad(cPr, 4, 48) },
    { inst: 'bass', vol: 0.22, seq: line(cPr, 4, 40, [[0, 4, 0]]) },
    { inst: 'pizz', vol: 0.16, seq: line(cPr, 4, 45, steps([0, 2, 0, 2, 0, 2, 0, 2], 0.5)) },
    { inst: 'timp', vol: 0.3, seq: line(cPr, 4, 40, [[0, 1, 0]]) }
  ]);

  // ── Le duel : le thème de l'école, au galop. La couche 'hot' (cordes aiguës, timbales) s'ajoute quand un des deux sorciers est presque à terre ──
  var duM = 'E4:1.5 G4:.5 B4:2 | B4 A4:.5 G4:.5 E4:2 | C5:1.5 B4:.5 G4:2 | A4:2 F#4 A4 | E4:1.5 G4:.5 B4:2 | E5:1.5 D5:.5 B4:2 | C5 E5 G5:2 | F#5:1.5 D#5:.5 B4:2 | A4 C5 E5:1.5 C5:.5 | B4:3 G4 | A4 C5 F5:1.5 C5:.5 | D#5:2 F#5 B4 | E5:1.5 B4:.5 G4 B4 | E5:1.5 C5:.5 G4 C5 | B4 D#5 F#5 A5 | G5 E5:3 |';
  var cDu = ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B7', 'Am', 'Em', 'F', 'B7', 'Em', 'C', 'B7', 'Em'];
  track('duel', 150, 4, true, 0.9, [
    { inst: 'brass', vol: 0.3, gate: 0.92, seq: duM },
    { inst: 'spicc', vol: 0.2, seq: line(cDu, 4, 47, steps([0, 2, 1, 2, 0, 2, 1, 2], 0.5)) },
    { inst: 'bass', vol: 0.3, gate: 0.8, seq: line(cDu, 4, 35, [[0, 1.5, 0], [1.5, 1.5, 0], [3, 1, 0]]) },
    { inst: 'strings', vol: 0.08, seq: pad(cDu, 4, 55) },
    { inst: 'timp', vol: 0.22, seq: line(cDu, 4, 40, [[0, 1, 0], [3, 0.5, 2], [3.5, 0.5, 2]]) },
    { inst: 'snare', vol: 0.13, seq: line(cDu, 4, 60, [[1, 0.25, 0], [3, 0.25, 0]]) },
    { inst: 'spicc', vol: 0.12, layer: 'hot', seq: line(cDu, 4, 59, steps([3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4], 0.25)) },
    { inst: 'timp', vol: 0.18, layer: 'hot', seq: line(cDu, 4, 40, [[1, 1, 0], [2, 1, 0]]) },
    { inst: 'snare', vol: 0.1, layer: 'hot', seq: line(cDu, 4, 60, [[0.5, 0.25, 0], [1.5, 0.25, 0], [2.5, 0.25, 0], [3.5, 0.25, 0]]) }
  ]);

  // ── Les tournois : fanfare ──
  var toM = 'G4:.75 G4:.25 C5 E5 G5 | D5:1.5 B4:.5 G4 B4:.5 D5:.5 | E5:.75 E5:.25 A5 E5 C5 | F5:1.5 E5:.5 D5 C5 | G4:.75 G4:.25 C5 E5 G5 | B5:1.5 A5:.5 G5 D5 | A5 F5 C5 F5 | G5:3 r |';
  var cTo = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'];
  track('tournoi', 108, 4, true, 1, [
    { inst: 'brass', vol: 0.28, gate: 0.9, seq: cat(toM, rest(32)) },
    { inst: 'flute', vol: 0.26, seq: cat(rest(32), toM) },
    { inst: 'glock', vol: 0.08, seq: cat(rest(32), shift(toM, 12)) },
    { inst: 'strings', vol: 0.1, seq: pad(twice(cTo), 4, 55) },
    { inst: 'bass', vol: 0.28, gate: 0.85, seq: line(twice(cTo), 4, 36, [[0, 2, 0], [2, 2, 2]]) },
    { inst: 'timp', vol: 0.26, seq: line(twice(cTo), 4, 40, [[0, 1, 0], [2.5, 0.5, 0], [3, 1, 2]]) },
    { inst: 'snare', vol: 0.08, seq: line(twice(cTo), 4, 60, [[1, 0.25, 0], [1.5, 0.25, 0], [1.75, 0.25, 0], [3, 0.25, 0], [3.5, 0.25, 0]]) }
  ]);

  // ── Ritournelles : jouées une seule fois ──
  track('victoire', 126, 4, false, 1, [
    { inst: 'brass', vol: 0.3, seq: 'G4:.5 C5:.5 E5:.5 G5:2.5 | C6:2 D6:2 | E6:4 | r:2 |' },
    { inst: 'strings', vol: 0.16, seq: 'C3+G3+E4:4 | Ab3+Eb4+C5:2 Bb3+F4+D5:2 | C4+G4+E5:4 | r:2 |' },
    { inst: 'bass', vol: 0.3, seq: 'C2:4 | Ab2:2 Bb2:2 | C3:4 | r:2 |' },
    { inst: 'timp', vol: 0.34, seq: 'C3 r:3 | C3:.5 C3:.5 C3:.5 C3:.5 C3:.5 C3:.5 C3:.5 C3:.5 | C3:4 | r:2 |' },
    { inst: 'glock', vol: 0.12, seq: 'r:4 | r:4 | E6:.5 G6:.5 C7:3 | r:2 |' }
  ]);
  track('defaite', 76, 4, false, 1, [
    { inst: 'violin', vol: 0.3, seq: 'B4 A4 G4 F#4 | E4:4 | r:2 |' },
    { inst: 'strings', vol: 0.16, seq: 'E3+B3+G4:2 B2+A3+D#4:2 | E3+B3+E4:4 | r:2 |' },
    { inst: 'bass', vol: 0.3, seq: 'E2:2 B1:2 | E2:4 | r:2 |' },
    { inst: 'timp', vol: 0.3, seq: 'E2 r:3 | E2:4 | r:2 |' }
  ]);
  track('bravo', 132, 4, false, 1, [
    { inst: 'harp', vol: 0.3, seq: 'C4:.25 E4:.25 G4:.25 C5:.25 E5:.25 G5:.25 C6:.25 E6:.25 G6:2 | r:2 |' },
    { inst: 'celesta', vol: 0.3, seq: 'r:2 C6+E6+G6:2 | r:2 |' },
    { inst: 'strings', vol: 0.12, seq: 'C4+E4+G4:4 | r:2 |' }
  ]);

  // ───────────────────────── Séquenceur ─────────────────────────
  // Un lecteur joue un air sur un contexte audio : on lui demande régulièrement de programmer les notes des prochains dixièmes de seconde.
  function player(a, dest, tr, o, at) {
    var p = { tr: tr, spb: 60 / (o.bpm || tr.bpm), tp: o.transpose || 0, i: 0, t0: at, done: false, endAt: 0, out: a.createGain(), layers: {}, key: tr.name + '/' + (o.transpose || 0) + '/' + (o.bpm || 0) };
    p.out.gain.value = 0; p.out.connect(dest);
    tr.parts.forEach(function (part) { if (part.layer && !p.layers[part.layer]) { var g = a.createGain(); g.gain.value = 0; g.connect(p.out); p.layers[part.layer] = g; } });
    return p;
  }
  function pump(a, p, until, nz) {
    var tr = p.tr;
    while (!p.done) {
      var e = tr.flat[p.i], when = p.t0 + e.t * p.spb;
      if (when > until) break;
      var part = tr.parts[e.p], dest = part.layer ? p.layers[part.layer] : p.out, d = e.d * p.spb * (part.gate || 1), v = part.vol * tr.vol * (e.n.length > 1 ? 0.75 : 1) * (0.9 + Math.random() * 0.2), t = Math.max(when, a.currentTime + 0.005);
      for (var k = 0; k < e.n.length; k++) INST[part.inst](a, dest, t, hz(e.n[k] + p.tp), d, v, nz);
      if (++p.i >= tr.flat.length) { p.i = 0; p.t0 += tr.len * p.spb; if (!tr.loop) { p.done = true; p.endAt = p.t0; } }
    }
  }

  var cur = null, st = null, want = null, duckG = null, timer = 0, heatOn = false, duckV = 1, AHEAD = 0.4;
  function bus() { var a = AU.ctx(); if (!a) return null; if (!duckG) { duckG = a.createGain(); duckG.gain.value = duckV; duckG.connect(AU.bus('music')); } return a; }
  function fade(p, to, secs) { var a = AU.ctx(); p.out.gain.cancelScheduledValues(a.currentTime); p.out.gain.setTargetAtTime(to, a.currentTime, secs / 3); }
  function drop(p, secs) { if (!p) return; p.done = true; fade(p, 0, secs); setTimeout(function () { try { p.out.disconnect(); } catch (e) { } }, secs * 1000 + 3000); }
  function tick() {
    var a = AU.ctx(); if (!a || a.state !== 'running') return;
    var until = a.currentTime + AHEAD, nz = AU.bus('noise');
    if (cur) pump(a, cur, until, nz);
    if (st) {
      pump(a, st.p, until, nz);
      if (st.p.done && a.currentTime > st.p.endAt) { var s = st; st = null; drop(s.p, 1.5); if (s.then) play(s.then, s.thenOpts); else if (cur) fade(cur, 1, 1.2); }
    }
  }
  function begin(name, o, fadeIn) {
    var a = bus(); if (!a) return null;
    var p = player(a, duckG, T[name], o || {}, a.currentTime + 0.12);
    p.out.gain.setTargetAtTime(1, a.currentTime, fadeIn / 3);
    if (p.layers.hot) p.layers.hot.gain.value = heatOn ? 1 : 0;
    if (!timer) timer = setInterval(tick, 70);
    return p;
  }
  // Joue un air en boucle (fondu avec le précédent). o : { transpose (demi-tons), bpm }. Le même air déjà en cours continue sans reprendre du début.
  function play(name, o) {
    if (!T[name]) return;
    want = { name: name, o: o };
    if (st) { st.then = null; if (!st.keep) { drop(st.p, 0.4); st = null; } }
    var key = name + '/' + ((o && o.transpose) || 0) + '/' + ((o && o.bpm) || 0);
    if (cur && cur.key === key) { fade(cur, 1, 0.6); return; }
    if (!AU.ctx()) return; // pas encore le droit de sonner : on s'en souvient (want), on commencera au premier clic
    drop(cur, 0.9);
    cur = begin(name, o, 0.9);
  }
  function stop(secs) { want = null; if (st) { drop(st.p, secs || 0.6); st = null; } drop(cur, secs || 0.6); cur = null; }
  // Joue une ritournelle une seule fois. o.keep : la musique en cours continue tout bas dessous ; sinon elle s'arrête, et o.then (un air) prend la suite.
  function sting(name, o) {
    o = o || {};
    var a = AU.ctx(); if (!a || !T[name]) { if (o.then) play(o.then, o.thenOpts); return; }
    if (st) drop(st.p, 0.3);
    if (o.keep) { if (cur) fade(cur, 0.25, 0.4); } else { drop(cur, 0.5); cur = null; want = null; }
    st = { p: begin(name, o, 0.03), then: o.then, thenOpts: o.thenOpts, keep: !!o.keep };
  }
  AU.onReady(function () { if (want && !cur) play(want.name, want.o); });

  // Mesure un air hors ligne (pour équilibrer les volumes) : niveau moyen et crête, en décibels. only : numéro d'une seule partie.
  function render(name, secs, only) {
    var tr = T[name], OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, a = new OC(2, Math.floor(44100 * secs), 44100), g = AU.build(a);
    g.sfx.gain.value = 0; g.music.gain.value = 1; g.out.threshold.value = 0; g.out.ratio.value = 1; // sans limiteur : on veut le niveau brut
    var p = player(a, g.music, only === undefined ? tr : { name: tr.name, bpm: tr.bpm, loop: tr.loop, vol: tr.vol, len: tr.len, parts: tr.parts, flat: tr.flat.filter(function (e) { return e.p === only; }) }, {}, 0.05);
    p.out.gain.value = 1; if (p.layers.hot) p.layers.hot.gain.value = 1;
    pump(a, p, secs - 0.5, g.noise);
    return a.startRendering().then(function (buf) {
      var d = buf.getChannelData(0), peak = 0, sum = 0;
      for (var i = 0; i < d.length; i++) { var x = Math.abs(d[i]); if (x > peak) peak = x; sum += x * x; }
      var db = function (x) { return Math.round(200 * Math.log(Math.max(1e-9, x)) / Math.LN10) / 10; };
      return { rms: db(Math.sqrt(sum / d.length)), peak: db(peak) };
    });
  }

  DS.music = {
    TRACKS: T, play: play, stop: stop, sting: sting, render: render, parse: parse,
    // Le duel chauffe (un sorcier presque à terre) : la couche 'hot' entre ou sort.
    heat: function (v) { heatOn = !!v; var a = AU.ctx(); if (a && cur && cur.layers.hot) cur.layers.hot.gain.setTargetAtTime(v ? 1 : 0, a.currentTime, 0.5); },
    // Baisse la musique (pause, exercice au tambour…) : 1 = normal, 0 = silence.
    duck: function (v) { duckV = v; var a = AU.ctx(); if (a && duckG) duckG.gain.setTargetAtTime(v, a.currentTime, 0.15); },
    get now() { return cur ? cur.tr.name : null; }
  };
})();
