// Snow Kids — sons et musique synthétisés (WebAudio, aucun fichier). SK.Audio.sfx('coin'), SK.Audio.music('rookie').
(function (SK) {
  'use strict';
  const A = SK.Audio = { enabled: true, ctx: null, musicOn: true, cur: null, timer: null };
  A.init = function () { if (A.ctx) return A.ctx; try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); A.master = A.ctx.createGain(); A.master.gain.value = 0.5; A.master.connect(A.ctx.destination); A.mgain = A.ctx.createGain(); A.mgain.gain.value = 0.35; A.mgain.connect(A.master); } catch (e) { A.enabled = false; } return A.ctx; };
  const tone = (f0, f1, dur, type, vol, when) => {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + (when || 0);
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(A.master); o.start(t0); o.stop(t0 + dur + 0.02);
  };
  const noise = (dur, vol, when) => {
    const c = A.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = vol || 0.3; s.connect(g); g.connect(A.master); s.start(c.currentTime + (when || 0));
  };
  A.sfx = function (name) {
    if (!A.enabled || !A.ctx) return;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    switch (name) {
      case 'coin': tone(1200, 1800, 0.08, 'square', 0.12); tone(1800, 2400, 0.12, 'square', 0.1, 0.07); break;
      case 'box': tone(500, 900, 0.12, 'triangle', 0.2); tone(900, 1300, 0.15, 'triangle', 0.15, 0.1); break;
      case 'jump': tone(300, 700, 0.18, 'sine', 0.2); break;
      case 'land': noise(0.08, 0.15); break;
      case 'trick': [660, 880, 1100, 1320].forEach((f, i) => tone(f, f, 0.1, 'square', 0.12, i * 0.07)); break;
      case 'fall': noise(0.25, 0.35); tone(300, 80, 0.4, 'sawtooth', 0.2); break;
      case 'shoot': tone(200, 900, 0.2, 'sawtooth', 0.18); break;
      case 'explode': noise(0.4, 0.5); tone(120, 40, 0.5, 'square', 0.25); break;
      case 'freeze': tone(1500, 400, 0.4, 'triangle', 0.2); break;
      case 'pan': tone(900, 300, 0.3, 'square', 0.25); noise(0.15, 0.3); break;
      case 'steal': tone(400, 1200, 0.25, 'sine', 0.2); tone(1200, 400, 0.25, 'sine', 0.15, 0.25); break;
      case 'fan': tone(200, 1400, 0.6, 'sawtooth', 0.15); break;
      case 'invisible': tone(800, 1600, 0.4, 'sine', 0.12); break;
      case 'rain': noise(0.6, 0.15); break;
      case 'rock': tone(150, 60, 0.2, 'square', 0.2); break;
      case 'lift': tone(440, 660, 0.3, 'triangle', 0.15); tone(660, 880, 0.3, 'triangle', 0.15, 0.3); break;
      case 'count': tone(660, 660, 0.15, 'square', 0.2); break;
      case 'go': tone(880, 880, 0.4, 'square', 0.25); tone(1320, 1320, 0.4, 'square', 0.15, 0.05); break;
      case 'wall': noise(0.1, 0.2); break;
      case 'finish': [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.25, 'square', 0.18, i * 0.15)); break;
      case 'win': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.2, i * 0.18)); break;
      case 'buy': tone(700, 1400, 0.2, 'square', 0.18); tone(1400, 1400, 0.2, 'square', 0.15, 0.2); break;
      case 'click': tone(900, 900, 0.05, 'square', 0.1); break;
      case 'nope': tone(200, 150, 0.2, 'square', 0.15); break;
      case 'unlock': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f, 0.35, 'triangle', 0.2, i * 0.12)); break;
    }
  };
  // ---- musique : petit séquenceur (mélodie + basse) par thème. Notes en demi-tons depuis A4 ; 0 = silence (null).
  const SONGS = {
    menu:    { bpm: 112, mel: [0, 4, 7, 12, 7, 4, 0, null, 2, 5, 9, 14, 9, 5, 2, null], bass: [-24, -24, -17, -17, -22, -22, -15, -15] },
    rookie:  { bpm: 128, mel: [0, 4, 7, 4, 9, 7, 4, 2, 0, 4, 7, 12, 11, 9, 7, null], bass: [-24, -24, -19, -19, -22, -22, -17, -17] },
    snowman: { bpm: 120, mel: [7, 7, 4, 0, 2, 4, 5, 4, 7, 9, 7, 4, 2, 0, 2, null], bass: [-24, -20, -17, -20, -22, -19, -15, -19] },
    sunset:  { bpm: 116, mel: [0, 3, 7, 10, 7, 3, 0, null, -2, 2, 5, 10, 5, 2, -2, null], bass: [-24, -24, -21, -21, -26, -26, -22, -22] },
    highway: { bpm: 140, mel: [0, 0, 7, 7, 5, 5, 3, 3, 0, 3, 5, 7, 10, 7, 5, 3], bass: [-24, -12, -24, -12, -21, -9, -22, -10] },
    grass:   { bpm: 124, mel: [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2], bass: [-24, -24, -20, -20, -17, -17, -19, -19] },
    sand:    { bpm: 118, mel: [0, 1, 4, 5, 7, 5, 4, 1, 0, -1, 0, 4, 7, 8, 7, null], bass: [-24, -24, -23, -23, -20, -20, -17, -17] },
    silver:  { bpm: 136, mel: [12, 7, 4, 7, 12, 14, 12, 7, 9, 4, 0, 4, 9, 11, 9, 4], bass: [-24, -24, -20, -20, -15, -15, -17, -17] },
    ninja:   { bpm: 126, mel: [0, 1, 5, 7, 5, 1, 0, null, 7, 8, 12, 7, 5, 1, 0, null], bass: [-24, -24, -24, -22, -19, -19, -19, -17] },
    dizzy:   { bpm: 150, mel: [0, 4, 7, 12, 16, 12, 7, 4, 2, 5, 9, 14, 17, 14, 9, 5], bass: [-24, -12, -20, -8, -17, -5, -19, -7] },
  };
  const freq = n => 440 * Math.pow(2, n / 12);
  A.music = function (name) {
    if (A.timer) { clearInterval(A.timer); A.timer = null; }
    A.cur = name;
    if (!A.enabled || !A.ctx || !A.musicOn || !name || !SONGS[name]) return;
    const song = SONGS[name], step = 60 / song.bpm / 2; let i = 0, next = A.ctx.currentTime + 0.05;
    const play = (f, t0, dur, type, vol) => { const o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur); o.connect(g); g.connect(A.mgain); o.start(t0); o.stop(t0 + dur + 0.02); };
    A.timer = setInterval(() => {
      while (next < A.ctx.currentTime + 0.4) {
        const m = song.mel[i % song.mel.length], b = song.bass[Math.floor(i / 2) % song.bass.length];
        if (m != null) play(freq(m), next, step * 0.9, 'square', 0.08);
        if (i % 2 === 0) play(freq(b), next, step * 1.6, 'triangle', 0.12);
        if (i % 4 === 0) { play(80, next, 0.08, 'sine', 0.25); }
        next += step; i++;
      }
    }, 100);
  };
  A.stopMusic = function () { if (A.timer) clearInterval(A.timer); A.timer = null; A.cur = null; };
  A.setEnabled = function (on) { A.enabled = on; if (!on) A.stopMusic(); else if (A.cur) A.music(A.cur); };
  A.setMusic = function (on) { A.musicOn = on; if (!on) { const c = A.cur; A.stopMusic(); A.cur = c; } else if (A.cur) A.music(A.cur); };
})(window.SK);
