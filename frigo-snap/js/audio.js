// Frigo Snap — sons synthétisés (WebAudio), sans fichiers.
(function (FS) {
  'use strict';
  const A = FS.Audio = {};
  let ctx = null, enabled = true, master = null;
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { enabled = false; } } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
  A.setEnabled = v => { enabled = v; };
  A.unlock = () => { if (enabled) ac(); };
  function tone(f0, f1, dur, type, vol, delay) {
    if (!enabled || !ac()) return; const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, hp, delay) {
    if (!enabled || !ac()) return; const t0 = ctx.currentTime + (delay || 0); const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = buf; const f = ctx.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 1200; const g = ctx.createGain(); g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  const SFX = {
    click: () => tone(600, 900, 0.06, 'square', 0.08),
    shutter: () => { noise(0.05, 0.35, 2000); tone(1800, 600, 0.08, 'square', 0.12, 0.03); noise(0.04, 0.2, 3000, 0.09); },
    empty: () => tone(200, 150, 0.15, 'square', 0.1),
    throw: () => { noise(0.15, 0.12, 800); tone(300, 600, 0.15, 'sine', 0.1); },
    land: () => tone(220, 120, 0.12, 'triangle', 0.18),
    splat: () => { noise(0.12, 0.25, 500); tone(180, 80, 0.15, 'sawtooth', 0.12); },
    clic: () => { tone(3000, 2000, 0.03, 'square', 0.25); noise(0.03, 0.3, 4000); tone(900, 1200, 0.25, 'sine', 0.06, 0.05); },
    flash: () => { tone(200, 2500, 0.18, 'sine', 0.15); noise(0.1, 0.15, 3000); },
    react: () => { tone(400, 700, 0.1, 'square', 0.1); tone(700, 500, 0.12, 'square', 0.1, 0.1); },
    eat: () => { tone(300, 250, 0.06, 'square', 0.08); tone(320, 260, 0.06, 'square', 0.08, 0.1); },
    special: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.16, i * 0.09)); tone(1046, 1568, 0.4, 'triangle', 0.14, 0.4); },
    end: () => { [392, 523, 659].forEach((f, i) => tone(f, f, 0.25, 'triangle', 0.14, i * 0.15)); },
    voice: () => tone(500 + Math.random() * 400, 400 + Math.random() * 300, 0.05, 'sawtooth', 0.05),
    stamp: () => { noise(0.08, 0.3, 300); tone(120, 60, 0.2, 'sine', 0.3); },
    tick: () => tone(1200, 1400, 0.03, 'square', 0.04),
    unlock: () => { [659, 784, 988, 1318].forEach((f, i) => tone(f, f, 0.2, 'square', 0.1, i * 0.1)); },
    bad: () => tone(300, 120, 0.4, 'sawtooth', 0.12),
    great: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, f * 1.01, 0.3, 'triangle', 0.14, i * 0.08)); },
  };
  A.sfx = name => { const f = SFX[name]; if (f) try { f(); } catch (e) { /* audio indisponible */ } };
})(window.FS);
