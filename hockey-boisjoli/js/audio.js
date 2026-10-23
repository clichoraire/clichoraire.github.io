// Sons synthétisés (WebAudio), aucun fichier audio.
(function (HK) {
  'use strict';
  const A = HK.audio = { ctx: null, muted: false, crowdGain: null, crowdLevel: 0.25 };
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = A.ctx;
    A.master = c.createGain(); A.master.gain.value = A.muted ? 0 : 0.5; A.master.connect(c.destination);
    // foule : bruit filtré en boucle
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.6;
    A.crowdGain = c.createGain(); A.crowdGain.gain.value = 0.25;
    src.connect(f); f.connect(A.crowdGain); A.crowdGain.connect(A.master); src.start();
  };
  A.toggle = function () { A.muted = !A.muted; if (A.master) A.master.gain.value = A.muted ? 0 : 0.5; return A.muted; };
  A.crowd = function (level, t) { if (!A.crowdGain) return; const g = A.crowdGain.gain; g.cancelScheduledValues(A.ctx.currentTime); g.setTargetAtTime(level, A.ctx.currentTime, t || 0.3); };
  function tone(freq, type, dur, vol, slide, when) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + (when || 0);
    o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(A.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, freq, when) {
    const c = A.ctx, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1500; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(A.master); s.start(c.currentTime + (when || 0));
  }
  A.play = function (name) {
    if (!A.ctx || A.muted) return;
    switch (name) {
      case 'pass': noise(0.05, 0.5, 2500); break;
      case 'shot': noise(0.08, 0.9, 1800); tone(180, 'square', 0.06, 0.15, 0.5); break;
      case 'board': noise(0.12, 0.8, 500); tone(90, 'sine', 0.15, 0.4, 0.6); break;
      case 'post': tone(1800, 'sine', 0.35, 0.5, 0.9); tone(2400, 'sine', 0.3, 0.2, 0.9); break;
      case 'hit': noise(0.15, 1, 300); tone(70, 'sine', 0.2, 0.6, 0.5); break;
      case 'save': noise(0.1, 0.7, 900); break;
      case 'whistle': tone(2600, 'square', 0.18, 0.12); tone(2650, 'square', 0.18, 0.12, 1, 0.22); break;
      case 'goal':
        for (let i = 0; i < 3; i++) { tone(220, 'sawtooth', 1.2, 0.25, 1.0, i * 0.02); tone(330, 'sawtooth', 1.2, 0.2, 1.0, i * 0.02); }
        noise(1.5, 0.6, 800, 0.1); break;
      case 'period': tone(880, 'square', 0.5, 0.2); tone(660, 'square', 0.5, 0.2, 1, 0.5); break;
      case 'power': for (let i = 0; i < 5; i++) tone(500 + i * 180, 'triangle', 0.12, 0.25, 1, i * 0.05); break;
      case 'bad': tone(200, 'square', 0.2, 0.2, 0.6); break;
      case 'steal': noise(0.06, 0.5, 3000); break;
      case 'ui': tone(700, 'triangle', 0.08, 0.2); break;
      case 'win': for (let i = 0; i < 8; i++) tone([523, 659, 784, 1047][i % 4], 'triangle', 0.25, 0.25, 1, i * 0.13); break;
      case 'scream': tone(900, 'sawtooth', 0.6, 0.3, 0.7); break;
      case 'laser': tone(1500, 'sawtooth', 0.3, 0.2, 0.2); break;
      case 'slap': noise(0.2, 1, 1200); tone(120, 'square', 0.2, 0.3, 0.4); break;
    }
  };
})(window.HK);
