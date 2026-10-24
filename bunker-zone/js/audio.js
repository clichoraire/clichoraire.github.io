// ============================================================
//  audio.js — Effets sonores : échantillons wav (interface, alertes) + sons synthétisés (WebAudio)
// ============================================================
(function (ZC) {
  'use strict';

  // Échantillons wav de assets/ (interface, alertes). Décodés dans le contexte WebAudio pour passer par le volume
  // général ; si le fichier ne peut pas être lu par fetch (page ouverte en file://), repli sur un élément <audio>.
  const SAMPLES = {
    tick:     'assets/misc_menu_3.wav',   // survol d'un bouton (très court)
    click:    'assets/misc_menu_2.wav',   // clic sur un bouton de menu
    nav:      'assets/misc_menu_4.wav',   // changement d'écran (Jouer, Aventure, Options...)
    load:     'assets/load.wav',          // lancement d'une partie
    deny:     'assets/negative_2.wav',    // action refusée
    negative: 'assets/negative.wav',      // perte (bunker détruit)
    echo:     'assets/sharp_echo.wav',    // alerte : on nous attaque
  };

  const A = {
    ctx: null, master: null, enabled: true, last: {}, volume: 0.35, buf: {}, els: {},

    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? this.volume : 0;
        this.master.connect(this.ctx.destination);
        this.noiseBuf = this._makeNoise();
        this._loadSamples();
      } catch (e) { this.ctx = null; }
    },
    setEnabled(v) {
      this.enabled = v;
      if (this.master) this.master.gain.value = v ? this.volume : 0;
      for (const k in this.els) this.els[k].volume = v ? this.volume : 0;
    },

    _loadSamples() {
      for (const name in SAMPLES) {
        const url = SAMPLES[name];
        const fallback = () => {
          if (typeof Audio === 'undefined') return;
          try { const el = new Audio(url); el.preload = 'auto'; el.volume = this.enabled ? this.volume : 0; this.els[name] = el; } catch (e) { /* pas de son */ }
        };
        if (typeof fetch !== 'function' || location.protocol === 'file:') { fallback(); continue; }
        fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
          .then(ab => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej)))
          .then(buf => { this.buf[name] = buf; })
          .catch(fallback);
      }
    },
    // Joue un échantillon ; renvoie false s'il n'est pas (encore) disponible, pour laisser jouer le son synthétisé
    _sample(name, gain, rate) {
      const buf = this.buf[name];
      if (buf) {
        const c = this.ctx, s = c.createBufferSource(), g = c.createGain();
        s.buffer = buf; if (rate) s.playbackRate.value = rate;
        g.gain.value = gain === undefined ? 1 : gain;
        s.connect(g); g.connect(this.master); s.start();
        return true;
      }
      const el = this.els[name];
      if (el) {
        try { const e = el.cloneNode(); e.volume = this.enabled ? this.volume * (gain === undefined ? 1 : Math.min(1, gain)) : 0; if (rate) e.playbackRate = rate; const p = e.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* lecture bloquée */ }
        return true;
      }
      return false;
    },
    // Un de ces sons a-t-il été joué dans les `ms` dernières millisecondes ? (évite d'empiler clic + navigation)
    recent(names, ms) { const now = performance.now(); return names.some(n => this.last[n] && now - this.last[n] < ms); },

    _makeNoise() {
      const len = this.ctx.sampleRate * 1.0;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    },

    _tone(freq, type, dur, gain, freqEnd, delay) {
      const c = this.ctx, t0 = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },
    _noise(dur, filterType, freq, gain, q, delay) {
      const c = this.ctx, t0 = c.currentTime + (delay || 0);
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
      const g = c.createGain();
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(this.master);
      s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
    },

    play(name, throttleMs) {
      if (!this.enabled || !this.ctx) return;
      const now = performance.now();
      const th = throttleMs === undefined ? 60 : throttleMs;
      if (this.last[name] && now - this.last[name] < th) return;
      this.last[name] = now;
      const f = SOUNDS[name];
      if (f) f.call(this);
    },
  };

  const SOUNDS = {
    gun()      { this._noise(0.09, 'bandpass', 1800, 0.5, 2); this._tone(220, 'square', 0.05, 0.12, 80); },
    gun2()     { this._noise(0.12, 'bandpass', 1200, 0.6, 2); this._tone(160, 'square', 0.08, 0.15, 60); },
    flame()    { this._noise(0.35, 'lowpass', 700, 0.35, 1); },
    spit()     { this._tone(900, 'sawtooth', 0.15, 0.15, 300); this._noise(0.1, 'highpass', 3000, 0.1, 1); },
    slash()    { this._noise(0.08, 'highpass', 2500, 0.25, 1); this._tone(180, 'triangle', 0.08, 0.2, 90); },
    slash2()   { this._noise(0.15, 'highpass', 1500, 0.4, 1); this._tone(120, 'triangle', 0.15, 0.3, 50); },
    psi()      { this._tone(600, 'sine', 0.18, 0.18, 1400); this._noise(0.1, 'highpass', 4000, 0.08, 1); },
    bolt()     { this._tone(500, 'sine', 0.2, 0.2, 150); this._noise(0.12, 'bandpass', 900, 0.2, 3); },
    lightning(){ this._noise(0.25, 'highpass', 1800, 0.45, 1); this._tone(80, 'sawtooth', 0.25, 0.25, 40); },
    deathZerg(){ this._noise(0.3, 'lowpass', 500, 0.35, 1); this._tone(200, 'sawtooth', 0.3, 0.18, 50); },
    deathTerran(){ this._noise(0.45, 'lowpass', 350, 0.7, 1); this._tone(90, 'square', 0.3, 0.2, 30); },
    deathProtoss(){ this._tone(900, 'sine', 0.4, 0.2, 180); this._noise(0.25, 'bandpass', 2000, 0.15, 2); },
    select()   { this._tone(880, 'square', 0.04, 0.06); this._tone(1320, 'square', 0.05, 0.05, null, 0.045); },
    order()    { this._tone(660, 'square', 0.05, 0.06); this._tone(990, 'square', 0.04, 0.05, null, 0.05); },
    error()    { if (!this._sample('deny', 0.7)) this._tone(200, 'square', 0.15, 0.08, 150); },
    // Interface des menus (échantillons ; repli synthétique tant qu'ils ne sont pas chargés)
    tick()     { if (!this._sample('tick', 0.35)) this._tone(1200, 'square', 0.03, 0.03); },
    click()    { if (!this._sample('click', 0.6)) { this._tone(660, 'square', 0.05, 0.06); this._tone(990, 'square', 0.04, 0.05, null, 0.05); } },
    nav()      { if (!this._sample('nav', 0.6)) { this._tone(880, 'triangle', 0.08, 0.06); this._tone(1320, 'triangle', 0.1, 0.05, null, 0.07); } },
    load()     { if (!this._sample('load', 0.7)) [330, 440, 660].forEach((f, i) => this._tone(f, 'square', 0.1, 0.08, null, i * 0.08)); },
    spawn()    { this._tone(523, 'triangle', 0.1, 0.08); this._tone(784, 'triangle', 0.15, 0.08, null, 0.1); },
    capture()  { this._tone(523, 'square', 0.08, 0.1); this._tone(659, 'square', 0.08, 0.1, null, 0.09); this._tone(784, 'square', 0.18, 0.1, null, 0.18); },
    lost()     { if (!this._sample('negative', 0.8)) { this._tone(500, 'square', 0.12, 0.1, 400); this._tone(300, 'square', 0.25, 0.1, 150, 0.13); } },
    round()    { [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 'triangle', 0.22, 0.14, null, i * 0.13)); },
    alert()    { if (!this._sample('echo', 0.8)) { this._tone(440, 'square', 0.1, 0.1); this._tone(440, 'square', 0.1, 0.1, null, 0.18); } },
    build()    { [330, 440, 660].forEach((f, i) => this._tone(f, 'square', 0.1, 0.08, null, i * 0.08)); this._noise(0.3, 'lowpass', 400, 0.15, 1); },
    upgrade()  { this._tone(700, 'triangle', 0.12, 0.1, 1400); this._tone(1400, 'triangle', 0.2, 0.08, null, 0.1); },
    stim()     { this._tone(300, 'sawtooth', 0.15, 0.1, 900); },
    bigExplosion() { this._noise(1.0, 'lowpass', 220, 1.0, 1); this._tone(60, 'square', 0.6, 0.3, 25); this._noise(0.4, 'bandpass', 1200, 0.3, 2, 0.05); },
    landing()  { this._noise(0.6, 'lowpass', 900, 0.2, 1); this._tone(200, 'sawtooth', 0.6, 0.06, 90); },
    victory()  { [523, 659, 784, 1046, 1318].forEach((f, i) => this._tone(f, 'triangle', 0.4, 0.15, null, i * 0.18)); },
    defeat()   { [600, 500, 400, 250].forEach((f, i) => this._tone(f, 'sawtooth', 0.5, 0.12, f * 0.8, i * 0.3)); },
  };

  ZC.Audio = A;

  // ------------------------------------------------------------ Musique de fond (pistes mp3 de assets/, jouées en partie)
  const M = {
    tracks: [
      'assets/dopestuff-neon-gaming-128925.mp3',
      'assets/michitheonlyone-foxeaglion-orion-fast-retrosynth-synthwave-music-194434.mp3',
      'assets/redproductions-wave-synth-electronica-game-future-80s-music-187824.mp3',
    ],
    el: null, enabled: true, volume: 0.3, order: [], idx: 0, playing: false,
    _ensure() {
      if (this.el || typeof Audio === 'undefined') return;
      this.el = new Audio();
      this.el.volume = this.volume;
      this.el.addEventListener('ended', () => { if (this.playing) this.next(); });
      this.el.addEventListener('error', () => { if (this.playing && this.order.length > 1) this.next(); });
    },
    // Démarre la musique (ordre mélangé, enchaînement automatique). Appelé après un clic, pour respecter les navigateurs.
    start() {
      this._ensure(); if (!this.el) return;
      if (this.playing) return;
      this.order = ZC.shuffle(this.tracks.slice()); this.idx = 0;
      this.playing = true;
      this._play();
    },
    _play() {
      if (!this.el || !this.enabled) return;
      this.el.src = this.order[this.idx % this.order.length];
      const p = this.el.play(); if (p && p.catch) p.catch(() => { /* lecture bloquée par le navigateur : réessayée au prochain clic */ });
    },
    next() { this.idx = (this.idx + 1) % this.order.length; this._play(); },
    stop() { this.playing = false; if (this.el) { this.el.pause(); this.el.removeAttribute('src'); this.el.load(); } },
    setEnabled(v) {
      this.enabled = v;
      if (!this.el) return;
      if (!v) this.el.pause();
      else if (this.playing) { if (!this.el.src || this.el.src === '' ) this._play(); else { const p = this.el.play(); if (p && p.catch) p.catch(() => {}); } }
    },
    // Baisse le volume pendant la pause
    duck(v) { if (this.el) this.el.volume = v ? this.volume * 0.4 : this.volume; },
  };
  ZC.Music = M;
})(window.ZC);
