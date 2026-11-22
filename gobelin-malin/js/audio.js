// Goblin Malin — pistes locales et mixage des bruitages.
'use strict';
(function (CG) {
  const DIR = 'assets/audio/';
  const PREFS = 'clan-gobelin-son';
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(PREFS)) || {}; } catch (e) { /* réglages par défaut */ }
  const readVolume = (value, fallback) => Number.isFinite(value) ? CG.clamp(value, 0, 1) : fallback;
  const A = CG.audio = {
    musicOn: prefs.music !== false, sfxOn: prefs.sfx !== false, muted: false,
    musicVolume: readVolume(prefs.musicVolume, 0.56), sfxVolume: readVolume(prefs.sfxVolume, 0.78)
  };
  const TRACKS = { menu: 0.78, day: 0.70, night: 0.61, party: 0.82, party2: 0.82, fight: 0.87, boss: 0.90, defeat: 0.72, aide: 0.80, marais: 0.72 };
  // les fichiers ajoutés à la main, sous leur nom d'origine, rangés par usage : music/ (musiques), sfx/ (bruitages), sorts/ (un son par sort),
  // ambiance/ (scènes et lieux), village/ (ce qui arrive au clan)
  const PISTES = { aide: 'music/goblin-music-monde-allie-aide.mp3', party: 'music/firecamp-song-1.mp3', party2: 'music/firecamp-song-2.mp3', defeat: 'music/gameover.mp3', marais: 'music/marecage-music-1.mp3' };
  // les fonds sonores qui tournent en boucle : fichier, niveau. Le jeu dit à chaque image lesquels il veut entendre, et à quelle force (A.ambiance).
  // le monde de dehors (la forêt, pas le marais) : trois musiques, l'une après l'autre, puis on recommence
  const JOUR = ['music-world1-1.mp3', 'music-world1-2.mp3', 'music-world1-3.mp3']; let jourN = 0;
  const FONDS = { lave: ['ambiance/lava-ambiance.mp3', 0.6], feu: ['ambiance/firecamp-crackling-sound.mp3', 0.55], nuit: ['ambiance/night-ambiant-frogs-and-crickets.mp3', 0.4], ronfle: ['ambiance/snoring-animation-sleep.mp3', 0.5] };
  const LIBRES = {
    sortEtincelle: 'sorts/goblin-magic-etincelle.mp3', sortFeu: 'sorts/goblin-magic-fireball.mp3', sortTerre: 'sorts/goblin-magic-elemental-earth.mp3', sortGlace: 'sorts/goblin-magic-ice.mp3',
    sortInvisible: 'sorts/goblin-magic-invisibility.mp3', sortSoin: 'sorts/goblin-magic-heal.mp3', sortOeil: 'sorts/goblin-magic-oeil-faiblesse.mp3',
    nuitAnim: 'ambiance/goblin-sound-animation-night.mp3', marcheHumains: 'ambiance/goblin-sound-humans-walking-in-group.mp3', mauvaisEndroit: 'ambiance/wrong-place.mp3',
    gobNiveau: 'village/gobelin-lvl-up.mp3', visiteurs: 'village/we-have-visitors.mp3', achat: 'village/we-bought-something.mp3', poser: 'village/put-a-construction-on-the-floor.mp3',
    entreDonjon: 'ambiance/enter-dungeon.mp3', bouleFeu: 'sorts/fireball-1.mp3', bouleFeu2: 'sorts/fireball-2.mp3',
    coupChef: 'sfx/hero-swing-weapon.mp3', coffre: 'sfx/ouvre-coffre.mp3', lieuNettoye: 'sfx/on-nettoie-secteur-map-bonus-xp.mp3', feeDon: 'sfx/fee-upgrade.mp3'
  };
  const fichier = file => DIR + (LIBRES[file] || 'sfx/' + file + '.wav');
  // le son propre à chaque sort : il prend la place du son de sort ordinaire
  A.SORTS = { etincelle: 'sortEtincelle', feu: 'sortFeu', golem: 'sortTerre', glace: 'sortGlace', invisible: 'sortInvisible', soin: 'sortSoin', vision: 'sortOeil' };

  // Niveau, délai minimum entre deux déclenchements (ms), durée de priorité sur la musique (ms).
  const EFFECTS = {
    click: [0.26, 65], uiOpen: [0.35, 90], uiClose: [0.31, 90], uiWarn: [0.53, 300, 500],
    ok: [0.34, 100], no: [0.37, 200], page: [0.31, 120],
    hit: [0.48, 68], swing: [0.36, 82], hurt: [0.60, 135], die: [0.39, 230],
    spell: [0.52, 105], fire: [0.53, 120], zap: [0.51, 100], heal: [0.48, 230],
    coin: [0.39, 115], level: [0.56, 400, 950], discovery: [0.57, 650, 1400],
    victory: [0.65, 2000, 3200], chop: [0.36, 250], build: [0.50, 220],
    bell: [0.72, 3200, 2600], warning: [0.68, 475, 650],
    glas: [0.68, 3500, 3500], tombe: [0.65, 1800, 1800],
    drumLow: [0.31, 130], drumHigh: [0.24, 130],
    sortEtincelle: [0.5, 90], sortFeu: [0.55, 150], sortTerre: [0.6, 300], sortGlace: [0.55, 300], sortInvisible: [0.55, 300], sortSoin: [0.5, 400], sortOeil: [0.55, 300],
    nuitAnim: [0.6, 4000], marcheHumains: [0.5, 5800],
    mauvaisEndroit: [0.7, 20000, 5000], gobNiveau: [0.6, 500, 800], visiteurs: [0.65, 2500, 1500],
    achat: [0.6, 250], poser: [0.6, 150], entreDonjon: [0.7, 6000, 3000], bouleFeu: [0.45, 180], coupChef: [0.5, 82], coffre: [0.65, 200], lieuNettoye: [0.65, 1500, 1200], feeDon: [0.7, 2000, 2000], secret: [0.62, 3000, 2600]
  };
  const VARIANTS = { hit: ['hit', 'hit2'], swing: ['swing', 'swing2'], bouleFeu: ['bouleFeu', 'bouleFeu2'] };
  const WARM = ['click', 'uiOpen', 'uiClose', 'ok', 'no', 'hit', 'hit2', 'swing', 'swing2', 'hurt', 'bell', 'warning'];

  const decks = [], positions = new Map(), buffers = new Map(), voices = new Set(), lastEffect = new Map();
  const mediaOnly = location.protocol === 'file:';
  let ctx, limiter, effectsGain, unlocked = false, scene = 'menu', focus = 1, lastMix = performance.now();
  let fxLevel = 0, duckUntil = 0, duckGain = 1;
  const sfxLevel = () => A.muted || !A.sfxOn || document.hidden ? 0 : A.sfxVolume;
  const approach = (value, target, delta) => value < target ? Math.min(target, value + delta) : Math.max(target, value - delta);

  function syncEffects() {
    const level = sfxLevel();
    if (fxLevel === level) return;
    fxLevel = level;
    if (effectsGain) effectsGain.gain.setTargetAtTime(level, ctx.currentTime, 0.025);
    for (const voice of voices) {
      if (voice.media) voice.media.volume = voice.level * level;
    }
  }
  A.savePrefs = function () {
    try {
      localStorage.setItem(PREFS, JSON.stringify({
        music: A.musicOn, sfx: A.sfxOn, musicVolume: A.musicVolume, sfxVolume: A.sfxVolume
      }));
    } catch (e) { /* stockage indisponible */ }
    syncEffects();
  };

  function newDeck() {
    const media = new Audio();
    media.preload = 'auto';
    media.volume = 0;
    const deck = { media, mode: null, fade: 0, pending: false, blocked: false, activated: false };
    media.addEventListener('ended', () => { if (deck.mode !== 'day') return; jourN = (jourN + 1) % JOUR.length; positions.delete('day'); media.src = DIR + JOUR[jourN]; media.currentTime = 0; media.play().catch(() => {}); }); /* la suivante */
    return deck;
  }
  function getTrack(mode) {
    const current = decks.find(deck => deck.mode === mode);
    if (current) return current;
    const next = decks.filter(deck => !deck.pending).sort((a, b) => a.fade - b.fade)[0];
    if (!next || (next.fade > 0 && decks.some(deck => deck.pending))) return null;
    const { media } = next;
    if (next.mode && next.mode !== 'defeat') positions.set(next.mode, media.currentTime);
    media.pause();
    next.mode = mode;
    next.fade = 0;
    next.blocked = false;
    media.volume = 0;
    media.loop = mode !== 'defeat' && mode !== 'day';
    media.src = DIR + (mode === 'day' ? JOUR[jourN] : PISTES[mode] || 'music/' + mode + '.mp3');
    media.currentTime = positions.get(mode) || 0;
    return next;
  }
  function startTrack(track) {
    const { media } = track;
    if (!media.paused || media.ended || media.error || track.pending || track.blocked) return;
    track.pending = true;
    media.play().then(() => { track.activated = true; }).catch(error => {
      track.blocked = error.name !== 'AbortError';
    }).finally(() => { track.pending = false; });
  }
  // Safari autorise la lecture par élément. Les deux lecteurs servent ensuite à tous les fondus.
  function activateSpare(deck) {
    if (deck.mode || deck.activated || deck.pending) return;
    const { media } = deck;
    deck.pending = true;
    media.src = DIR + 'music/menu.mp3';
    media.play().then(() => {
      deck.activated = true;
      media.pause();
    }).catch(() => {}).finally(() => { deck.pending = false; });
  }
  function mixMusic() {
    const now = performance.now(), dt = Math.min(0.1, (now - lastMix) / 1000);
    lastMix = now;
    mixFonds(dt);
    const volume = !document.hidden && !A.muted && A.musicOn && unlocked ? A.musicVolume : 0;
    const wanted = volume && focus && TRACKS[scene];
    const target = wanted ? getTrack(scene) : null;
    if (target) startTrack(target);
    const waiting = wanted && (!target || (!target.media.error && !target.media.ended && (target.pending || target.media.paused)));
    duckGain = approach(duckGain, now < duckUntil ? 0.46 : 1, dt * (now < duckUntil ? 6 : 1.35));
    for (const track of decks) {
      const { media, mode } = track;
      if (!mode) continue;
      const next = focus * TRACKS[mode];
      if (track === target && !waiting) track.fade = approach(track.fade, next, dt * (mode === 'fight' || mode === 'boss' ? 2.6 : 1.45));
      if (track !== target && !waiting) track.fade = approach(track.fade, 0, dt * 1.6);
      media.volume = Math.sin(track.fade * Math.PI / 2) * volume * duckGain;
      if ((!volume || (track !== target && track.fade === 0 && !waiting)) && !media.paused) media.pause();
      if (mode === 'defeat' && scene !== mode && track.fade === 0 && media.currentTime) media.currentTime = 0;
    }
  }
  // ---------- les fonds en boucle (lave, feu de camp, grenouilles de la nuit, ronflements) ----------
  const fonds = {}; let veut = {};
  A.ambiance = function (niveaux) { veut = niveaux || {}; };
  function mixFonds(dt) {
    const base = unlocked ? sfxLevel() : 0;
    for (const k in FONDS) { let o = fonds[k]; const v = base ? CG.clamp(veut[k] || 0, 0, 1) : 0;
      if (!o) { if (!v) continue; const media = new Audio(DIR + FONDS[k][0]); media.loop = true; media.preload = 'auto'; media.volume = 0; o = fonds[k] = { media, fade: 0, attend: false }; }
      o.fade = approach(o.fade, v, dt * (v > o.fade ? 0.9 : 1.4)); const { media } = o; media.volume = CG.clamp(o.fade * FONDS[k][1] * base, 0, 1);
      if (o.fade > 0 && media.paused && !o.attend) { o.attend = true; media.play().catch(() => {}).finally(() => { o.attend = false; }); }
      if (o.fade === 0 && !media.paused && !o.attend) media.pause(); }
  }
  A.music = function (mode, intensity = 1) {
    scene = mode;
    focus = intensity;
    syncEffects();
    mixMusic();
  };

  function loadEffect(file) {
    if (!buffers.has(file)) {
      const buffer = fetch(fichier(file)).then(res => {
        if (!res.ok) throw new Error(file);
        return res.arrayBuffer();
      }).then(data => ctx.decodeAudioData(data)).catch(() => null);
      buffers.set(file, buffer);
    }
    return buffers.get(file);
  }
  A.unlock = function () {
    if (!unlocked) {
      unlocked = true;
      decks.push(newDeck(), newDeck());
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!mediaOnly && AudioContext) {
        try { ctx = new AudioContext(); } catch (e) { /* lecture directe */ }
      }
      if (ctx) {
        limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -15;
        limiter.ratio.value = 4;
        effectsGain = ctx.createGain();
        effectsGain.gain.value = sfxLevel();
        limiter.connect(effectsGain);
        effectsGain.connect(ctx.destination);
        if (A.sfxOn) WARM.forEach(loadEffect);
      }
    }
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    for (const track of decks) track.blocked = false;
    mixMusic();
    decks.forEach(activateSpare);
  };
  function activate(e) {
    if (e.isTrusted && !e.repeat) A.unlock();
  }
  window.addEventListener('keydown', activate, true);
  window.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') activate(e); }, true);
  window.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') activate(e); }, true);
  window.addEventListener('click', activate, true);
  document.addEventListener('visibilitychange', () => { syncEffects(); mixMusic(); });

  function playEffect(file, buffer, level, pitch, priority) {
    if (!sfxLevel()) return;
    if (voices.size >= 14) {
      const previous = priority && [...voices].find(v => !v.priority);
      if (!previous) return;
      previous.stop();
      voices.delete(previous);
    }
    const voice = { priority, level };
    voices.add(voice);
    const release = () => voices.delete(voice);
    if (buffer) {
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = buffer;
      source.playbackRate.value = pitch;
      gain.gain.value = level;
      source.connect(gain);
      gain.connect(limiter);
      source.onended = release;
      voice.stop = () => source.stop();
      source.start();
    } else {
      const media = voice.media = new Audio(fichier(file));
      media.volume = level * sfxLevel();
      media.playbackRate = pitch;
      media.onended = release;
      media.onerror = release;
      voice.stop = () => media.pause();
      media.play().catch(release);
    }
    if (priority) duckUntil = Math.max(duckUntil, performance.now() + priority);
  }
  CG.sfx = function (name) {
    if (A.swap && (name === 'spell' || name === 'heal')) { name = A.swap; A.swap = null; }
    if (name === 'horn') name = 'warning'; /* le vieux cor est parti : deux coups de marteau à la place */
    if (name === 'attaque') { CG.sfx('marcheHumains'); name = 'warning'; } /* une attaque : l'alerte, et le pas de la troupe qui approche */
    const effect = EFFECTS[name];
    if (!effect || !unlocked || !sfxLevel()) return;
    const [level, delay, priority] = effect, now = performance.now();
    if (now < (lastEffect.get(name) || 0)) return;
    lastEffect.set(name, now + delay);
    const variants = VARIANTS[name], file = variants ? CG.pick(variants) : name;
    const pitch = variants || name === 'chop' ? CG.rand(0.95, 1.06) : 1;
    if (!ctx) playEffect(file, null, level, pitch, priority);
    else loadEffect(file).then(buffer => {
      if (performance.now() - now < (LIBRES[file] ? 6000 : 320)) playEffect(file, buffer, level, pitch, priority); /* un long fichier met plus de temps à s'ouvrir la première fois */
    });
  };

  const PATTERN = [1, 0, 2, 0, 1, 1, 2, 0, 1, 0, 2, 2, 1, 1, 2, 0];
  let drumStep = 0, drumTimer = 0;
  A.drums = function (dt, audible) {
    drumTimer -= dt;
    if (drumTimer > 0) return false;
    drumTimer = 0.22;
    const beat = PATTERN[drumStep++ % PATTERN.length];
    if (audible && (!A.musicOn || A.musicVolume === 0) && beat) CG.sfx(beat === 1 ? 'drumLow' : 'drumHigh');
    return beat === 1;
  };
})(window.CG);
