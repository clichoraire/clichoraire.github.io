// Sons synthétisés (WebAudio) : aucun fichier audio à charger.
(function (CB) {
  'use strict';
  const A = CB.Audio = { enabled: true, ctx: null };
  A.init = () => { if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; } try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { A.ctx = null; } };
  function tone(f0, f1, dur, type = 'square', vol = .2, delay = 0) {
    const c = A.ctx; if (!c) return; const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol = .2, delay = 0, lp = 1200) {
    const c = A.ctx; if (!c) return; const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; s.buffer = buf; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + delay);
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
    boom: () => { noise(.5, .4, 0, 500); tone(120, 30, .5, 'triangle', .3); },
    freeze: () => tone(1500, 400, .3, 'sine', .12),
    bolt: () => { noise(.15, .2, 0, 4000); tone(2000, 400, .12, 'square', .1); },
    walk: () => tone(300, 400, .05, 'triangle', .06),
  };
  A.sfx = name => { if (!A.enabled || !A.ctx || !SFX[name]) return; try { SFX[name](); } catch (e) { } };
})(window.CB);
