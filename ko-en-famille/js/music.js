// K.O. en Famille — morceaux enregistrés, embarqués pour la lecture hors ligne.
// Sources et crédits : assets/music/CREDITS.html.
(function (root) {
  'use strict';
  const A = root.BX.audio;
  const SCENES = {
    title: ['rocket', .38], gym: ['funkorama', .38],
    training: ['hitman', .38], rhythm: ['cipher', .10],
    intro: ['rocket', .42], fight: ['eye-of-the-tiger', .46], boss: ['going-the-distance', .52],
    corner: ['funkorama', .25], win: ['winner-winner', .48],
    lose: ['funkorama', .22], run: ['rocket', .42],
  };
  const TITLES = { funkorama: 'Funkorama', cipher: 'Cipher', rocket: 'Rocket', hitman: 'Hitman', 'winner-winner': 'Winner Winner!' };
  const ROCKY = {
    "eye-of-the-tiger": "rocky/Survivor - Eye Of The Tiger (Official HD Video).mp3",
    "burning-heart": "rocky/Survivor - Burning heart (Lyrics).mp3",
    "going-the-distance": "rocky/Bill Conti - Going The Distance (Rocky).mp3",
    "gonna-fly-now": "rocky/Gonna Fly Now (Theme From Rocky).mp3"
};
  Object.assign(TITLES, {"eye-of-the-tiger": "Eye of the Tiger", "burning-heart": "Burning Heart", "going-the-distance": "Going the Distance", "gonna-fly-now": "Gonna Fly Now"});
  const base = new URL('../assets/music/', document.currentScript.src);
  let wanted = 'title', options = {}, current = null, paused = false, timer = null, error = null;
  const fading = new Set();
  let fightBag = [], fightTrack = null, lastFightTrack = null;
  function nextFightTrack() {
    if (!fightBag.length) {
      fightBag = Object.keys(ROCKY);
      for (let i = fightBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fightBag[i], fightBag[j]] = [fightBag[j], fightBag[i]];
      }
      if (fightBag.at(-1) === lastFightTrack) [fightBag[0], fightBag[fightBag.length - 1]] = [fightBag.at(-1), fightBag[0]];
    }
    return lastFightTrack = fightBag.pop();
  }
  const allowed = () => A.pref.sound && A.pref.music && !document.hidden && !!A.debug.context();
  function dispose(track) {
    track.audio.pause(); track.audio.removeAttribute('src'); track.audio.load();
    fading.delete(track);
  }
  function tick() {
    const volume = allowed() ? A.pref.volume * (paused ? .25 : 1) : 0;
    if (current) {
      const target = current.level * volume;
      current.audio.volume += (target - current.audio.volume) * .12;
    }
    for (const track of fading) {
      track.audio.volume *= .80;
      if (track.audio.volume < .002 || !allowed()) dispose(track);
    }
    if (!current && !fading.size) { clearInterval(timer); timer = null; }
  }
  function startTimer() { if (!timer) timer = setInterval(tick, 30); }
  function play(track) {
    if (!allowed() || !track.audio.paused || track.pending) return;
    track.pending = true;
    track.audio.play().then(() => {
      track.pending = false;
      // A play promise can resolve after a mute, scene change or tab switch.
      if (!allowed() || (track !== current && !fading.has(track))) track.audio.pause();
    }).catch(e => {
      track.pending = false;
      if (track === current && e.name !== 'AbortError') error = e.name;
    });
  }
  A.scene = (name, nextOptions = {}) => {
    if (wanted !== name) { paused = false; if (name === 'fight') fightTrack = null; }
    wanted = name; options = nextOptions;
    const boss = name === 'fight' && ['titre', 'titan_titre', 'secret'].includes(options.circuit);
    const scene = boss ? 'boss' : name !== 'boss' && SCENES[name] ? name : 'gym';
    // No Rocky crossfade may spill into training, menus, the corner or results.
    if (name !== 'fight') {
      if (current && ROCKY[current.id]) { dispose(current); current = null; }
      for (const track of fading) if (ROCKY[track.id]) dispose(track);
    }
    A.currentScene = scene;
    if (!allowed()) return;
    const [defaultId, level] = SCENES[scene];
    const id = name === 'fight' ? (fightTrack ||= nextFightTrack()) : defaultId;
    if (current && current.id === id) { current.level = level; play(current); return; }
    if (current) fading.add(current);
    const audio = new Audio(new URL(ROCKY[id] || id + '.mp3', base).href);
    audio.loop = name !== 'fight'; audio.preload = 'auto'; audio.volume = 0;
    const track = current = { audio, id, level, pending: false };
    error = null;
    audio.addEventListener('ended', () => {
      if (track !== current || wanted !== 'fight') return;
      fightTrack = null; A.scene(wanted, options);
    });
    audio.addEventListener('error', () => { if (current === track) error = 'Fichier musical indisponible'; });
    play(track); startTimer();
  };
  A.resumeMusic = () => A.scene(wanted, options);
  A.musicStop = () => {
    if (current) { dispose(current); current = null; }
    for (const track of fading) dispose(track);
    clearInterval(timer); timer = null;
  };
  A.musicPaused = on => { paused = !!on; };
  A.setEnergy = () => {}; // Les arrangements enregistrés gardent leur tempo original.
  document.addEventListener('visibilitychange', () => {
    for (const track of fading) dispose(track);
    if (document.hidden) { if (current) current.audio.pause(); }
    else A.resumeMusic();
  });
  // Réessaie si le navigateur a refusé une première lecture automatique.
  for (const event of ['pointerdown', 'keydown']) document.addEventListener(event, () => {
    if (A.pref.sound && A.pref.music) A.resumeMusic();
  });
  const audioStatus = A.debug.status;
  A.debug.status = () => ({ ...audioStatus(), playing: !!current && !current.audio.paused,
    track: current && TITLES[current.id], musicError: error,
    position: current ? current.audio.currentTime : 0, musicVolume: current ? current.audio.volume : 0,
    fadingTracks: fading.size });
  A.debug.scenes = () => Object.keys(SCENES);
})(window);
