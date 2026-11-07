// Effets sonores et ambiances synthétisés (aucun fichier audio). La musique est dans js/music.js.
// Rien ne sonne avant le premier clic ou la première touche : les navigateurs l'interdisent.
// Chaîne : sons → bus « sfx », musique → bus « music », les deux → un peu de réverbération (grande salle de pierre) → limiteur → sortie.
(function () {
  'use strict';
  var DS = window.DS = window.DS || {};
  var ac = null, G = null, hum = null, unlocked = false, ready = [], nz = null;
  var KEY = 'duel-sorciers-son', vol = { music: 0.6, sfx: 0.8, mute: false }; // réglages gardés d'une partie à l'autre
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) for (var k in vol) if (typeof raw[k] === typeof vol[k]) vol[k] = raw[k]; } catch (e) { }

  // Écho d'une grande salle : du bruit qui s'éteint.
  function impulse(a, secs) {
    var n = Math.floor(a.sampleRate * secs), b = a.createBuffer(2, n, a.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.8); }
    return b;
  }
  function noiseBuf(a) {
    var n = a.sampleRate * 2, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  // Construit la chaîne sur un contexte audio (le vrai, ou un contexte hors ligne pour mesurer la musique).
  function build(a) {
    var g = { out: a.createDynamicsCompressor(), master: a.createGain(), rev: a.createConvolver(), sfx: a.createGain(), music: a.createGain(), noise: noiseBuf(a) };
    g.out.threshold.value = -6; g.out.knee.value = 6; g.out.ratio.value = 8; g.out.attack.value = 0.004; g.out.release.value = 0.2;
    g.out.connect(a.destination); g.master.connect(g.out);
    var back = a.createGain(), s1 = a.createGain(), s2 = a.createGain();
    g.rev.buffer = impulse(a, 2.4); back.gain.value = 0.8; g.rev.connect(back); back.connect(g.master);
    s1.gain.value = 0.12; g.sfx.connect(g.master); g.sfx.connect(s1); s1.connect(g.rev);
    s2.gain.value = 0.3; g.music.connect(g.master); g.music.connect(s2); s2.connect(g.rev);
    return g;
  }
  function levels() {
    if (!G) return;
    var t = ac.currentTime;
    G.sfx.gain.setTargetAtTime(vol.mute ? 0 : vol.sfx * 0.56, t, 0.03);
    G.music.gain.setTargetAtTime(vol.mute ? 0 : vol.music * MUSIC_GAIN, t, 0.05);
  }
  var MUSIC_GAIN = 0.65;
  function ctx() {
    if (!unlocked) return null;
    if (!ac) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        ac = new AC(); G = build(ac); nz = G.noise;
        G.sfx.gain.value = vol.mute ? 0 : vol.sfx * 0.56; G.music.gain.value = vol.mute ? 0 : vol.music * MUSIC_GAIN;
      } catch (e) { ac = null; G = null; }
    }
    if (ac && ac.state === 'suspended' && !document.hidden) ac.resume();
    return ac;
  }
  function unlock() {
    var first = !unlocked; unlocked = true;
    var a = ctx();
    if (first && a) { ready.forEach(function (fn) { fn(); }); if (wantAmb) { var n = wantAmb; wantAmb = null; ambience(n); } }
    return a;
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  // Onglet caché : tout se tait (et le processeur se repose).
  document.addEventListener('visibilitychange', function () { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });

  // dest : où envoyer le son (le bus des sons par défaut ; une ambiance a son propre volume).
  function tone(f0, f1, dur, type, v, delay, dest) {
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.2, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || G.sfx); o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(f0, f1, dur, v, delay, dest) {
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), s = a.createBufferSource(), flt = a.createBiquadFilter(), g = a.createGain();
    s.buffer = nz; flt.type = 'bandpass'; flt.Q.value = 1.2; flt.frequency.setValueAtTime(f0, t); flt.frequency.exponentialRampToValueAtTime(f1 || f0, t + dur);
    g.gain.setValueAtTime(v || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(flt); flt.connect(g); g.connect(dest || G.sfx); s.start(t, Math.random() * Math.max(0, 1.95 - dur), dur + 0.02);
  }
  function seq(list, dur, type, v, gap) { list.forEach(function (f, i) { tone(f, f, dur, type, v, i * gap); }); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ───────────────────────── Sorts ─────────────────────────
  var CAST = {
    scintilla: function (v) { tone(900, 1700, 0.16, 'triangle', 0.22 * v); },
    fulgur: function (v) { noise(3000, 500, 0.22, 0.3 * v); tone(240, 70, 0.25, 'sawtooth', 0.16 * v); },
    ignis: function (v) { noise(500, 120, 0.55, 0.35 * v); tone(160, 90, 0.5, 'triangle', 0.14 * v); },
    glacius: function (v) { tone(1400, 1400, 0.1, 'sine', 0.16 * v); tone(1860, 1860, 0.12, 'sine', 0.14 * v, 0.07); tone(2480, 2100, 0.2, 'sine', 0.12 * v, 0.14); },
    desarmo: function (v) { tone(420, 1250, 0.3, 'square', 0.08 * v); tone(630, 1700, 0.3, 'sine', 0.12 * v, 0.04); },
    lentus: function (v) { tone(700, 180, 0.55, 'sine', 0.2 * v); tone(350, 90, 0.6, 'triangle', 0.12 * v, 0.05); },
    aegis: function (v) { [392, 523, 659, 784].forEach(function (f, i) { tone(f, f, 0.5, 'sine', 0.13 * v, i * 0.04); }); },
    calor: function (v) { noise(700, 1800, 0.35, 0.18 * v); tone(330, 660, 0.35, 'triangle', 0.14 * v); },
    tenax: function (v) { tone(220, 220, 0.25, 'square', 0.08 * v); tone(330, 330, 0.3, 'triangle', 0.14 * v, 0.08); tone(440, 440, 0.35, 'triangle', 0.14 * v, 0.16); },
    aqua: function (v) { noise(1800, 350, 0.45, 0.32 * v); tone(520, 240, 0.3, 'sine', 0.12 * v); },
    tenebra: function (v) { tone(180, 55, 0.7, 'sawtooth', 0.12 * v); noise(300, 80, 0.6, 0.2 * v); },
    somnus: function (v) { [784, 659, 523, 392].forEach(function (f, i) { tone(f, f * 0.98, 0.45, 'sine', 0.13 * v, i * 0.14); }); },
    tonnero: function (v) { noise(3000, 500, 0.22, 0.3 * v); tone(240, 70, 0.25, 'sawtooth', 0.16 * v); },
    terra: function (v) { noise(260, 70, 0.35, 0.45 * v); tone(110, 50, 0.3, 'sine', 0.25 * v); },
    vespera: function (v) { tone(330, 110, 0.5, 'sine', 0.16 * v); noise(600, 150, 0.45, 0.14 * v); },
    sagitta: function (v) { noise(5000, 1500, 0.12, 0.25 * v); tone(1400, 2400, 0.1, 'triangle', 0.12 * v); },
    tornado: function (v) { noise(400, 1600, 0.7, 0.3 * v); noise(1600, 300, 0.5, 0.2 * v, 0.3); },
    toxicus: function (v) { [260, 300, 240, 330].forEach(function (f, i) { tone(f, f * 1.5, 0.1, 'sine', 0.12 * v, i * 0.07); }); },
    tremor: function (v) { tone(70, 45, 0.6, 'sawtooth', 0.2 * v); noise(160, 60, 0.5, 0.25 * v); },
    foudrus: function (v) { tone(900, 1300, 0.12, 'sine', 0.06 * v); },                                                                                  // presque rien : l'éclair viendra plus tard
    flammurus: function (v) { noise(300, 1100, 0.9, 0.4 * v); noise(900, 250, 1.1, 0.3 * v, 0.3); tone(100, 60, 1, 'sawtooth', 0.12 * v); },
    vortex: function (v) { noise(500, 2400, 0.5, 0.35 * v); noise(2400, 400, 0.7, 0.3 * v, 0.3); tone(260, 120, 0.8, 'sine', 0.14 * v); },
    // sorts sans son à eux : un carillon pour ce qu'on lance sur soi, une plainte descendante pour un maléfice, un soin tout doux
    self: function (v) { [523, 784, 1047].forEach(function (f, i) { tone(f, f, 0.35, 'sine', 0.12 * v, i * 0.05); }); },
    heal: function (v) { [392, 494, 587, 784, 988].forEach(function (f, i) { tone(f, f, 0.3, 'sine', 0.11 * v, i * 0.06); }); },
    hex: function (v) { tone(620, 210, 0.45, 'triangle', 0.16 * v); tone(930, 320, 0.4, 'sine', 0.08 * v, 0.04); }
  };
  function castSound(id) {
    if (CAST[id]) return CAST[id];
    var s = DS.byId ? DS.byId(DS.SPELLS, id) : null;
    return !s ? CAST.scintilla : s.heal || s.regen ? CAST.heal : s.self ? CAST.self : s.cat === 'effet' ? CAST.hex : CAST.scintilla;
  }

  // ───────────────────────── Ambiances ─────────────────────────
  // 'nuit' : le vent autour du château et une chouette de temps en temps · 'torches' : les torches de la salle qui crépitent · 'classe' : le feu, plus discret.
  var amb = null, wantAmb = null;
  function ambience(name) {
    if (!unlocked) { wantAmb = name; return; }
    if (amb && amb.name === name) return;
    var a = ctx(); if (!a) return;
    var t = a.currentTime;
    if (amb) { var old = amb; amb = null; clearInterval(old.timer); old.g.gain.setTargetAtTime(0, t, 0.25); setTimeout(function () { old.stop(); old.g.disconnect(); }, 1500); }
    if (!name) return;
    var g = a.createGain(), nodes = [], me;
    g.gain.value = 0; g.gain.setTargetAtTime(1, t, 0.6); g.connect(G.sfx);
    var bed = function (freq, q, level, lfoHz, depth) { // nappe de bruit filtré, qui enfle et retombe lentement
      var s = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain();
      s.buffer = nz; s.loop = true; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; v.gain.value = level;
      s.connect(f); f.connect(v); v.connect(g); s.start(); nodes.push(s);
      if (lfoHz) { var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = lfoHz; lg.gain.value = depth; l.connect(lg); lg.connect(v.gain); lg.connect(f.detune); l.start(); nodes.push(l); }
    };
    if (name === 'nuit') { bed(420, 0.8, 0.07, 0.11, 0.045); bed(900, 1.5, 0.02, 0.07, 0.015); }
    else bed(110, 0.7, name === 'classe' ? 0.05 : 0.09, 0.3, 0.03);
    me = amb = { name: name, g: g, stop: function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) { } }); } };
    amb.timer = setInterval(function () {
      if (amb !== me || !ac || ac.state !== 'running') return;
      if (name === 'nuit') { if (Math.random() < 0.012) { var f = rnd(350, 410); tone(f, f * 0.95, 0.32, 'sine', 0.05, 0, g); tone(f * 0.84, f * 0.78, 0.55, 'sine', 0.05, 0.42, g); } } // hou-houu
      else { var n = Math.random() < 0.45 ? 1 + (Math.random() < 0.25 ? 2 : 0) : 0, k = name === 'classe' ? 0.5 : 1; while (n--) noise(rnd(1200, 5200), rnd(700, 2400), rnd(0.012, 0.05), rnd(0.02, 0.07) * k, rnd(0, 0.16), g); } // crépitements
    }, 170);
  }

  var lastHover = 0;
  DS.audio = {
    unlock: unlock, ctx: ctx, build: build,
    onReady: function (fn) { if (unlocked && ac) fn(); else ready.push(fn); }, // appelé dès que le son a le droit de démarrer
    bus: function (name) { return G ? G[name] : null; },
    // Volume de la musique ou des sons (0 à 1) : vol('music') le lit, vol('music', 0.4) le règle. mute() coupe ou remet tout.
    vol: function (key, v) { if (v === undefined) return vol[key]; vol[key] = Math.max(0, Math.min(1, v)); levels(); try { localStorage.setItem(KEY, JSON.stringify(vol)); } catch (e) { } return vol[key]; },
    mute: function (v) { if (v === undefined) return vol.mute; vol.mute = !!v; levels(); try { localStorage.setItem(KEY, JSON.stringify(vol)); } catch (e) { } return vol.mute; },
    ambience: ambience,

    // ── Menus ──
    click: function () { tone(620, 880, 0.08, 'triangle', 0.15); },
    select: function () { tone(520, 780, 0.1, 'sine', 0.16); tone(1040, 1040, 0.12, 'sine', 0.08, 0.06); },
    hover: function () { var n = performance.now(); if (n - lastHover < 70) return; lastHover = n; tone(1900, 2350, 0.035, 'sine', 0.03); },   // la souris passe sur un bouton
    back: function () { tone(700, 470, 0.1, 'triangle', 0.13); },                                                                              // retour en arrière
    nope: function () { tone(196, 185, 0.12, 'square', 0.06); tone(147, 139, 0.18, 'square', 0.06, 0.11); },                                   // pas possible
    whoosh: function () { noise(500, 2600, 0.28, 0.1); },                                                                                      // on change d'endroit
    page: function () { noise(2600, 5200, 0.16, 0.16); noise(1500, 3800, 0.2, 0.1, 0.07); },                                                   // le grimoire s'ouvre
    bell: function () { [2093, 2637].forEach(function (f, i) { tone(f, f, 0.9, 'sine', 0.09, i * 0.17); tone(f * 2.76, f * 2.76, 0.25, 'sine', 0.035, i * 0.17); }); }, // la clochette de la porte du magasin
    chime: function () { seq([1319, 1568, 1976, 2637], 0.5, 'sine', 0.07, 0.07); },                                                            // la salle des talents
    horn: function () { seq([392, 523, 659], 0.16, 'sawtooth', 0.05, 0.09); tone(784, 784, 0.4, 'sawtooth', 0.06, 0.27); },                    // les tournois
    coin: function () { tone(1568, 1568, 0.09, 'square', 0.07); tone(2093, 2093, 0.22, 'square', 0.07, 0.08); for (var i = 0; i < 3; i++) tone(rnd(2300, 3100), 0, 0.06, 'triangle', 0.05, 0.2 + i * 0.07); },
    point: function (n) { var f = 523 * Math.pow(2, (n || 0) * 2 / 12); tone(f, f, 0.14, 'triangle', 0.14); tone(f * 1.5, f * 1.5, 0.3, 'sine', 0.1, 0.07); }, // un point de talent : de plus en plus aigu
    drawer: function (open) { noise(open ? 300 : 1500, open ? 1500 : 300, 0.2, 0.1); },                                                        // le tiroir des sorts
    pick: function () { tone(880, 1150, 0.06, 'sine', 0.12); },
    drop: function () { tone(660, 440, 0.08, 'triangle', 0.16); tone(1320, 1320, 0.14, 'sine', 0.08, 0.05); },
    pause: function (v) { tone(v ? 660 : 440, v ? 440 : 660, 0.14, 'sine', 0.12); },
    levelUp: function () { [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(f, f, 0.22, 'triangle', 0.15, i * 0.07); }); },
    medal: function (m) { seq([659, 784, 988, 1319, 1568].slice(0, 1 + (m || 1)), 0.3, 'triangle', 0.14, 0.1); noise(6000, 3000, 0.3, 0.08, 0.1 * (m || 1)); },

    // ── Tracé ──
    // Bourdonnement scintillant pendant qu'on trace.
    traceStart: function () {
      var a = ctx(); if (!a || hum) return;
      var o = a.createOscillator(), o2 = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = 660; o2.type = 'triangle'; o2.frequency.value = 993;
      lfo.frequency.value = 9; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.05, a.currentTime + 0.08);
      o.connect(g); o2.connect(g); g.connect(G.sfx); o.start(); o2.start(); lfo.start();
      hum = { o: o, o2: o2, lfo: lfo, g: g };
    },
    traceStop: function () {
      if (!hum || !ac) return;
      var h = hum, t = ac.currentTime; hum = null;
      h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(Math.max(0.0001, h.g.gain.value), t); h.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      h.o.stop(t + 0.15); h.o2.stop(t + 0.15); h.lfo.stop(t + 0.15);
    },
    cast: function (id, v) { castSound(id)(v || 1); },
    sparkle: function () { for (var i = 0; i < 6; i++) tone(rnd(2200, 4200), 0, 0.12, 'sine', 0.05, i * 0.045); },                              // tracé parfait
    fizzle: function () { noise(2400, 300, 0.25, 0.14); tone(300, 120, 0.2, 'sine', 0.08); },
    empty: function () { tone(330, 220, 0.18, 'sine', 0.12); tone(220, 150, 0.22, 'sine', 0.1, 0.13); },                                       // plus assez d'énergie

    // ── Duel ──
    hit: function () { noise(900, 150, 0.22, 0.4); tone(190, 60, 0.25, 'sine', 0.3); },
    hurt: function () { noise(400, 90, 0.35, 0.45); tone(130, 45, 0.4, 'sawtooth', 0.2); },
    block: function () { tone(1250, 1250, 0.18, 'sine', 0.2); tone(1880, 1880, 0.22, 'sine', 0.12, 0.02); noise(5000, 3000, 0.08, 0.12); },
    perfect: function () { [880, 1175, 1760, 2349].forEach(function (f, i) { tone(f, f, 0.2, 'triangle', 0.16, i * 0.055); }); noise(6000, 2500, 0.15, 0.12); },
    shield: function () { tone(500, 760, 0.1, 'sine', 0.1); },
    foeCast: function () { tone(260, 420, 0.3, 'sine', 0.07); },
    count: function () { tone(440, 440, 0.14, 'square', 0.1); tone(110, 70, 0.2, 'sine', 0.3); },
    go: function () { tone(880, 880, 0.35, 'square', 0.12); tone(1320, 1320, 0.35, 'triangle', 0.1); tone(130, 60, 0.5, 'sine', 0.4); noise(7000, 3000, 0.6, 0.12); },
    beam: function (fire) { if (fire) { noise(300, 900, 1.2, 0.4); noise(700, 200, 1.6, 0.3, 0.4); tone(90, 60, 1.6, 'sawtooth', 0.12); } else { tone(880, 660, 1.4, 'sawtooth', 0.09); tone(1320, 990, 1.4, 'square', 0.04); noise(4000, 2500, 0.5, 0.12); } },
    thunder: function () { noise(2500, 200, 0.35, 0.45); tone(120, 40, 0.6, 'sawtooth', 0.22); noise(200, 60, 0.9, 0.3, 0.1); },
    freeze: function () { [2100, 2600, 3100, 2400].forEach(function (f, i) { tone(f, f * 0.96, 0.12, 'sine', 0.1, i * 0.05); }); noise(6000, 3000, 0.25, 0.14); },
    crash: function (v) { noise(500, 60, 0.7, 0.5 * (v || 1)); tone(90, 35, 0.6, 'sine', 0.35 * (v || 1)); },
    thud: function () { tone(140, 50, 0.16, 'sine', 0.35); noise(300, 100, 0.08, 0.2); },
    pop: function () { tone(700, 1500, 0.09, 'sine', 0.16); noise(3000, 1200, 0.08, 0.12); },
    splash: function () { noise(2600, 300, 0.6, 0.4); noise(900, 200, 0.8, 0.25, 0.05); },
    heart: function () { tone(72, 46, 0.12, 'sine', 0.5); tone(64, 40, 0.15, 'sine', 0.38, 0.18); },                                             // le cœur qui bat quand il reste peu de vie
    sizzle: function () { noise(4500, 2200, 0.3, 0.07); },                                                                                     // on brûle
    bubble: function () { tone(300, 520, 0.08, 'sine', 0.09); tone(380, 640, 0.07, 'sine', 0.07, 0.11); },                                     // le poison
    sneeze: function () { tone(520, 700, 0.14, 'triangle', 0.1); tone(640, 880, 0.14, 'triangle', 0.1, 0.16); noise(3800, 900, 0.3, 0.4, 0.34); tone(300, 110, 0.25, 'sawtooth', 0.14, 0.34); }, // a… a… atchoum !
    mend: function () { tone(784, 988, 0.18, 'sine', 0.05); },                                                                                 // la vie qui remonte

    // ── Cours ──
    drum: function (accent) { tone(accent ? 170 : 130, 55, 0.22, 'sine', accent ? 0.6 : 0.42); noise(accent ? 900 : 500, 120, 0.09, accent ? 0.3 : 0.2); }, // tambour : accent sur le premier temps
    blip: function () { tone(520 + Math.random() * 140, 420, 0.035, 'triangle', 0.035); },                                                              // petite voix du professeur qui parle
    applause: function () { for (var i = 0; i < 46; i++) noise(1800 + Math.random() * 2600, 900, 0.05, 0.05 + Math.random() * 0.07, Math.random() * 1.9); },
    win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, f, 0.3, 'triangle', 0.2, i * 0.13); }); },
    lose: function () { [440, 370, 311, 220].forEach(function (f, i) { tone(f, f * 0.97, 0.4, 'sawtooth', 0.12, i * 0.2); }); }
  };
})();
