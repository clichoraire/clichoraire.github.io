// Paper Run — sons synthétisés (WebAudio) : effets et petite musique bondissante par monde.
(function (root) {
  'use strict';
  const PR = root.PR = root.PR || {};
  const A = PR.audio = { ctx: null, muted: false, musicOn: true };
  let master, sfxBus, musicBus;
  try { A.muted = localStorage.getItem('paperrun.mute') === '1'; } catch (e) { }

  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const Ctx = root.AudioContext || root.webkitAudioContext; if (!Ctx) return;
    A.ctx = new Ctx(); master = A.ctx.createGain(); master.gain.value = A.muted ? 0 : 1; master.connect(A.ctx.destination);
    sfxBus = A.ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
    musicBus = A.ctx.createGain(); musicBus.gain.value = 0.28; musicBus.connect(master);
  };
  A.mute = function (m) { A.muted = m; try { localStorage.setItem('paperrun.mute', m ? '1' : '0'); } catch (e) { } if (master) master.gain.setTargetAtTime(m ? 0 : 1, A.ctx.currentTime, 0.02); };
  A.toggle = () => { A.mute(!A.muted); return A.muted; };

  // Note simple : type d'onde, fréquence (ou glissando), durée, volume.
  function tone(type, f0, f1, dur, vol, when = 0, bus = sfxBus) {
    if (!A.ctx) return; const t = A.ctx.currentTime + when;
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, when = 0, hp = 800) {
    if (!A.ctx) return; const t = A.ctx.currentTime + when, n = Math.floor(A.ctx.sampleRate * dur), buf = A.ctx.createBuffer(1, n, A.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = A.ctx.createBufferSource(), g = A.ctx.createGain(), f = A.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    s.buffer = buf; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
  }

  const SFX = {
    jump: () => { tone('square', 300, 620, 0.14, 0.18); noise(0.05, 0.08, 0, 2000); },
    double: () => { tone('square', 420, 880, 0.14, 0.16); tone('triangle', 600, 1200, 0.12, 0.1, 0.03); },
    land: () => { noise(0.06, 0.12, 0, 300); tone('sine', 140, 80, 0.08, 0.15); },
    coin: () => { tone('square', 1046, 1046, 0.06, 0.14); tone('square', 1568, 1568, 0.16, 0.14, 0.06); },
    bigcoin: () => { [784, 988, 1175, 1568].forEach((f, i) => tone('square', f, f, 0.12, 0.14, i * 0.06)); },
    stomp: () => { noise(0.08, 0.2, 0, 500); tone('square', 220, 90, 0.16, 0.2); tone('square', 500, 900, 0.1, 0.1, 0.1); },
    hurt: () => { tone('sawtooth', 400, 60, 0.4, 0.25); noise(0.2, 0.15, 0, 400); },
    shield: () => { tone('triangle', 900, 300, 0.25, 0.2); tone('sine', 1300, 1300, 0.1, 0.1); },
    spring: () => { tone('square', 200, 1000, 0.25, 0.2); tone('triangle', 400, 1600, 0.2, 0.12, 0.05); },
    dash: () => { noise(0.18, 0.2, 0, 1200); tone('sawtooth', 200, 700, 0.12, 0.08); },
    flag: () => { [660, 880].forEach((f, i) => tone('triangle', f, f, 0.14, 0.18, i * 0.1)); },
    paper: () => { noise(0.25, 0.3, 0, 600); noise(0.15, 0.2, 0.08, 1500); },
    go: () => { tone('square', 880, 880, 0.3, 0.2); },
    ready: () => { tone('square', 440, 440, 0.12, 0.15); },
    win: () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone('square', f, f, i === 6 ? 0.6 : 0.14, 0.18, i * 0.11)); },
    medal: () => { [1046, 1318, 1568, 2093].forEach((f, i) => tone('triangle', f, f, 0.2, 0.18, i * 0.08)); },
    buy: () => { [660, 880, 1320].forEach((f, i) => tone('square', f, f, 0.1, 0.15, i * 0.07)); noise(0.1, 0.1, 0.2, 1000); },
    nope: () => { tone('square', 220, 180, 0.18, 0.15); tone('square', 180, 150, 0.2, 0.15, 0.15); },
    click: () => { tone('triangle', 700, 500, 0.06, 0.12); },
    slide: () => { noise(0.1, 0.05, 0, 2500); },
    glide: () => { tone('sine', 300, 320, 0.3, 0.05); },
  };
  A.play = function (name) { if (!A.ctx || A.muted) return; const f = SFX[name]; if (f) try { f(); } catch (e) { } };

  // ---- musique : une boucle de 8 mesures par monde, basse + mélodie + petit tambour de papier.
  const SCALES = {
    prairie: { bpm: 132, bass: [0, 0, 5, 5, 7, 7, 5, 4], melody: [12, 14, 16, 19, 16, 14, 12, 7, 9, 12, 14, 12, 9, 7, 5, 7, 12, 16, 19, 21, 19, 16, 14, 12, 14, 16, 14, 12, 9, 7, 9, 12], root: 262 },
    foret: { bpm: 124, bass: [0, 0, 3, 3, 5, 5, 3, 2], melody: [7, 10, 12, 15, 12, 10, 7, 5, 7, 10, 12, 10, 7, 5, 3, 5, 7, 12, 15, 17, 15, 12, 10, 7, 10, 12, 10, 7, 5, 3, 5, 7], root: 220 },
    ciseaux: { bpm: 140, bass: [0, 0, 7, 7, 5, 5, 3, 3], melody: [12, 12, 15, 17, 19, 17, 15, 12, 10, 12, 10, 7, 5, 7, 10, 12, 12, 15, 17, 19, 22, 19, 17, 15, 12, 10, 12, 15, 17, 15, 12, 10], root: 247 },
    chateau: { bpm: 128, bass: [0, 0, 8, 8, 7, 7, 5, 5], melody: [12, 15, 19, 15, 12, 15, 19, 20, 19, 15, 12, 8, 7, 8, 12, 15, 12, 15, 19, 15, 12, 15, 19, 20, 22, 20, 19, 15, 12, 15, 19, 24], root: 208 },
  };
  const music = { timer: null, world: null, step: 0, next: 0 };
  A.music = function (worldId) {
    A.stopMusic(); if (!A.ctx || !A.musicOn) return;
    const sc = SCALES[worldId] || SCALES.prairie; music.world = sc; music.step = 0; music.next = A.ctx.currentTime + 0.1;
    const beat = 60 / sc.bpm / 2;
    const tick = () => {
      if (!music.world) return;
      while (music.next < A.ctx.currentTime + 0.25) {
        const i = music.step % 32, t = music.next - A.ctx.currentTime;
        const semi = n => sc.root * Math.pow(2, n / 12);
        if (i % 4 === 0) tone('triangle', semi(sc.bass[Math.floor(i / 4)] - 12), semi(sc.bass[Math.floor(i / 4)] - 12), beat * 1.8, 0.25, t, musicBus);
        if (i % 2 === 0) noise(0.03, i % 8 === 4 ? 0.12 : 0.05, t, i % 8 === 4 ? 1200 : 3000);
        const m = sc.melody[i]; if (m != null) tone('square', semi(m), semi(m), beat * 0.9, 0.08, t, musicBus);
        music.next += beat; music.step++;
      }
    };
    music.timer = setInterval(tick, 80); tick();
  };
  A.stopMusic = function () { if (music.timer) clearInterval(music.timer); music.timer = null; music.world = null; };
  A.duck = function (on) { if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.1 : 0.28, A.ctx.currentTime, 0.1); };
})(window);
