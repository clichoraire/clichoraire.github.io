// Sons synthétisés (WebAudio) : aucun fichier audio à charger.
(function (CB) {
  'use strict';
  const A = CB.Audio = { enabled: true, ctx: null, master: null, volume: 1 };
  A.init = () => { if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; } try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); A.master = A.ctx.createGain(); A.master.gain.value = A.volume; A.master.connect(A.ctx.destination); } catch (e) { A.ctx = null; } };
  A.setVolume = v => { A.volume = Math.max(0, Math.min(1, v)); if (A.master) A.master.gain.value = A.volume; };
  const out = () => A.master || A.ctx.destination;
  function tone(f0, f1, dur, type = 'square', vol = .2, delay = 0) {
    const c = A.ctx; if (!c) return; const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(out()); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol = .2, delay = 0, lp = 1200) {
    const c = A.ctx; if (!c) return; const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; s.buffer = buf; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(out()); s.start(c.currentTime + delay);
  }
  const SFX = {
    shoot: () => { noise(.12, .25, 0, 900); tone(160, 50, .18, 'triangle', .3); },
    hit: () => tone(700, 300, .07, 'square', .08),
    kill: () => { tone(500, 900, .08, 'square', .12); noise(.08, .12, 0, 2500); },
    crit: () => { tone(900, 1500, .12, 'square', .14); tone(1200, 1900, .12, 'square', .1, .06); },
    elite: () => { for (let i = 0; i < 4; i++) tone(500 + i * 200, 700 + i * 200, .12, 'square', .12, i * .07); },
    hurt: () => { tone(220, 60, .3, 'sawtooth', .25); noise(.25, .3, 0, 600); },
    shield: () => tone(600, 1200, .15, 'sine', .15),
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .22, 'square', .14, i * .13)); },
    lose: () => { [392, 349, 311, 262].forEach((f, i) => tone(f, f * .95, .3, 'sawtooth', .14, i * .22)); },
    click: () => tone(900, 700, .05, 'square', .06),
    back: () => tone(500, 350, .07, 'square', .06),
    buy: () => { tone(880, 1320, .1, 'square', .12); tone(1320, 1760, .12, 'square', .12, .08); },
    nope: () => tone(200, 150, .15, 'square', .1),
    card: () => { tone(660, 990, .1, 'triangle', .14); tone(990, 1320, .15, 'triangle', .12, .1); },
    levelup: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, .18, 'triangle', .14, i * .09)); },
    boss: () => { tone(80, 40, .8, 'sawtooth', .3); noise(.6, .25, 0, 300); },
    snap: () => { noise(.05, .6, 0, 7000); tone(2800, 900, .06, 'square', .2); [1568, 2093, 2637, 3136, 3951].forEach((f, i) => tone(f, f * 1.01, .55, 'sine', .13, .07 + i * .06)); noise(1.3, .14, .1, 9000); },
    splash: () => { noise(.28, .32, 0, 1600); tone(760, 180, .2, 'sine', .1); tone(300, 90, .25, 'triangle', .08, .05); },
    bite: () => { noise(.08, .35, 0, 3000); tone(420, 120, .16, 'square', .14); },
    cannon: () => { noise(.3, .55, 0, 900); tone(95, 38, .32, 'triangle', .35); noise(.1, .3, 0, 3500); },
    boom: () => { noise(.5, .4, 0, 500); tone(120, 30, .5, 'triangle', .3); },
    kaboom: () => { noise(1.2, .6, 0, 380); noise(.5, .5, 0, 3000); tone(70, 18, 1.3, 'sawtooth', .45); tone(180, 40, .6, 'square', .2, .05); noise(.8, .3, .35, 200); },
    rocket: () => { noise(.6, .3, 0, 1500); tone(300, 900, .5, 'sawtooth', .12); },
    freeze: () => tone(1500, 400, .3, 'sine', .12),
    blizzard: () => { noise(2.5, .25, 0, 900); noise(1.5, .2, 1.2, 1600); tone(900, 300, 1.8, 'sine', .06); },
    roar: () => { tone(90, 40, 1.4, 'sawtooth', .3); tone(140, 60, 1.2, 'square', .14, .05); noise(1.6, .45, 0, 300); noise(.8, .3, .3, 1200); },
    tornado: () => { noise(2.8, .35, 0, 400); noise(2, .2, .6, 900); tone(60, 40, 2.5, 'sawtooth', .18); },
    jackpot: () => { [880, 1175, 1319, 1760, 2093].forEach((f, i) => tone(f, f, .25, 'square', .1, i * .09)); for (let i = 0; i < 8; i++) tone(2400 + (i % 3) * 300, 3000, .08, 'sine', .08, .5 + i * .1); },
    warp: () => { tone(200, 2400, .7, 'sawtooth', .12); tone(2400, 300, .6, 'sine', .12, .7); noise(.5, .15, .6, 4000); },
    rally: () => { tone(300, 600, .35, 'sawtooth', .16); tone(600, 500, .4, 'sawtooth', .16, .35); tone(500, 900, .5, 'sawtooth', .18, .75); },
    protect: () => { [659, 784, 988, 1319].forEach((f, i) => tone(f, f * 1.01, .5, 'sine', .12, i * .12)); tone(330, 330, 1.2, 'triangle', .06, .1); },
    ghost: () => { tone(260, 140, 1.4, 'sine', .14); tone(390, 200, 1.2, 'sine', .08, .2); noise(1.2, .08, 0, 700); },
    shock: () => { for (let i = 0; i < 6; i++) tone(1800 + (i % 2) * 900, 300, .08, 'square', .1, i * .09); noise(.5, .15, 0, 6000); },
    poison: () => { tone(300, 120, .5, 'sine', .14); for (let i = 0; i < 4; i++) tone(500 + i * 60, 420, .08, 'sine', .08, .3 + i * .12); },
    dark: () => { tone(160, 50, 1.2, 'sawtooth', .14); noise(.8, .1, 0, 500); },
    zoom: () => { noise(.5, .3, 0, 2500); tone(1400, 140, .7, 'sine', .18); tone(700, 90, .9, 'triangle', .12, .1); },
    pikachu: () => {
      const c = A.ctx; if (!c) return; const t0 = c.currentTime;
      // une « voix » : triangle + sinus à l'octave, vibrato, filtre passe-bas qui s'ouvre
      const voice = (f0, f1, dur, at, vol, vib = 0, open = 2200) => { const g = c.createGain(), f = c.createBiquadFilter(), t = t0 + at; f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(open, t + dur * .6); f.Q.value = 6;
        g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(vol, t + .03); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.001, t + dur); f.connect(g); g.connect(out());
        for (const [type, mul, v] of [['triangle', 1, 1], ['sine', 2, .35], ['sawtooth', .5, .18]]) { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0 * mul, t); o.frequency.exponentialRampToValueAtTime(f1 * mul, t + dur); og.gain.value = v; o.connect(og); og.connect(f); if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 7; lg.gain.value = vib * mul; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur); } o.start(t); o.stop(t + dur + .02); } };
      voice(880, 1050, .14, 0, .22);            // pi
      voice(760, 620, .18, .36, .22);           // ka
      voice(620, 940, 1.5, .8, .3, 26, 3400);   // CHUUUU, qui monte et vibre
      tone(2200, 90, .9, 'square', .05, .8);    // zap descendant
      const buzz = c.createOscillator(), bg = c.createGain(); buzz.type = 'square'; buzz.frequency.value = 55; bg.gain.setValueAtTime(.001, t0 + .8); bg.gain.exponentialRampToValueAtTime(.09, t0 + .95); bg.gain.exponentialRampToValueAtTime(.001, t0 + 2.3); buzz.connect(bg); bg.connect(out()); buzz.start(t0 + .8); buzz.stop(t0 + 2.35);
      for (let i = 0; i < 18; i++) noise(.03, .1, .85 + i * .08 + Math.random() * .03, 7000);   // crépitements
    },
    prayer: () => { noise(.5, .25, 0, 7000); [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 1.4, 'sine', .12, i * .06)); [392, 494].forEach((f, i) => tone(f, f, 1.6, 'triangle', .08, .1 + i * .05)); },
    holy: () => { tone(1568, 2093, .12, 'sine', .08); tone(2093, 2637, .14, 'sine', .06, .06); },
    unicorn: () => { [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => tone(f, f * 1.01, .3, 'sine', .14, i * .08)); noise(.6, .08, .3, 6000); },
    sparkle: () => { tone(1800, 2600, .08, 'sine', .08); tone(2400, 3200, .08, 'sine', .06, .05); },
    bolt: () => { noise(.15, .2, 0, 4000); tone(2000, 400, .12, 'square', .1); },
    walk: () => tone(300, 400, .05, 'triangle', .06),
  };
  A.sfx = name => { if (!A.enabled || !A.ctx || !SFX[name]) return; try { SFX[name](); } catch (e) { } };
})(window.CB);
