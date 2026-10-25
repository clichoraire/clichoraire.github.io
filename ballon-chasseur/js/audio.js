// Sons synthétisés (WebAudio), aucun fichier audio.
(function (BC) {
  'use strict';
  const A = BC.audio = { ctx: null, muted: false, crowdGain: null };
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = A.ctx;
    A.master = c.createGain(); A.master.gain.value = A.muted ? 0 : 0.5; A.master.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.6;
    A.crowdGain = c.createGain(); A.crowdGain.gain.value = 0.12;
    src.connect(f); f.connect(A.crowdGain); A.crowdGain.connect(A.master); src.start();
  };
  A.setMuted = function (m) { A.muted = m; if (A.master) A.master.gain.value = m ? 0 : 0.5; };
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
      case 'throw': noise(0.12, 0.7, 1200); tone(300, 'sine', 0.1, 0.15, 0.5); break;
      case 'super': for (let i = 0; i < 6; i++) tone(300 + i * 160, 'sawtooth', 0.1, 0.2, 1.3, i * 0.04); noise(0.3, 0.6, 2000, 0.2); break;
      case 'pass': noise(0.06, 0.4, 2200); break;
      case 'catch': noise(0.08, 0.9, 700); tone(160, 'square', 0.08, 0.2, 0.7); break;
      case 'hit': noise(0.18, 1, 350); tone(90, 'sine', 0.22, 0.6, 0.5); tone(700, 'square', 0.05, 0.15, 0.3); break;
      case 'bounce': tone(220, 'sine', 0.1, 0.25, 0.6); break;
      case 'jump': tone(400, 'triangle', 0.15, 0.15, 1.8); break;
      case 'dash': noise(0.05, 0.3, 900); break;
      case 'ko': for (let i = 0; i < 6; i++) tone([523, 659, 784, 988, 1175, 1568][i], 'triangle', 0.5, 0.18, 1, i * 0.1); break;
      case 'whistle': tone(2600, 'square', 0.18, 0.12); tone(2650, 'square', 0.18, 0.12, 1, 0.22); break;
      case 'teleport': tone(900, 'sine', 0.25, 0.2, 2.2); break;
      case 'ui': tone(700, 'triangle', 0.08, 0.2); break;
      case 'bad': tone(200, 'square', 0.2, 0.2, 0.6); break;
      case 'win': for (let i = 0; i < 8; i++) tone([523, 659, 784, 1047][i % 4], 'triangle', 0.25, 0.25, 1, i * 0.13); noise(1.5, 0.5, 800, 0.1); break;
    }
  };
})(window.BC);
