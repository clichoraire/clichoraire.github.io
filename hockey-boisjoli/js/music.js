// Musique d'aréna (fichiers mp3 dans assets/) : hymne, chansons pendant le jeu, orgue pendant les arrêts, chanson de but.
(function (HK) {
  'use strict';
  HK.AUDIO = {
    anthem: 'assets/anthem/canada-national.mp3',
    goal: 'assets/hockey-arena-goal-song-zombie-nation.mp3',
    hey: 'assets/the-hey-song.mp3',
    music: ['assets/music/stompin-tom-connors-the-hockey-song.mp3', 'assets/music/eric-lapointe-les-boys.mp3', 'assets/music/eric-lapointe-le-boys-blues-band.mp3'],
    organ: ['assets/organ/organ-5.mp3', 'assets/organ/organ-8.mp3', 'assets/organ/organ-9.mp3', 'assets/organ/organ-10.mp3'],
  };
  const VOL = { anthem: 0.8, goal: 0.7, music: 0.45, organ: 0.55, hey: 0.6 };
  const M = HK.music = { muted: false, cur: {}, musicIdx: Math.floor(Math.random() * 3), musicEl: null, fades: [] };
  function el(src, vol, loop) { const a = new Audio(src); a.volume = M.muted ? 0 : vol; a.loop = !!loop; a.preload = 'auto'; return a; }
  function stop(name, fade) {
    const a = M.cur[name]; if (!a) return; delete M.cur[name];
    if (!fade) { a.pause(); return; }
    const v0 = a.volume, t0 = performance.now();
    const tick = () => { const k = 1 - (performance.now() - t0) / fade; if (k <= 0 || M.muted) { a.pause(); return; } a.volume = v0 * k; requestAnimationFrame(tick); };
    tick();
  }
  M.setMuted = function (m) { M.muted = m; for (const k in M.cur) M.cur[k].volume = m ? 0 : VOL[k.replace(/\d/g, '')] || 0.5; };
  // Hymne (pendant l'alignement), avec rappel quand il se termine.
  // Chanson d'entrée des joueurs (The Hey Song), coupée en fondu quand l'hymne commence.
  M.hey = function () { stop('organ'); const a = M.cur.hey = el(HK.AUDIO.hey, VOL.hey); a.play().catch(() => { }); };
  M.anthem = function (onEnd) { stop('organ', 300); stop('hey', 900); stop('music'); const a = M.cur.anthem = el(HK.AUDIO.anthem, VOL.anthem); a.onended = () => { delete M.cur.anthem; if (onEnd) onEnd(); }; a.play().catch(() => { }); };
  M.stopAnthem = function () { stop('anthem', 600); stop('hey', 600); };
  // Orgue pendant les arrêts de jeu : un extrait au hasard, en boucle sur la liste tant que l'arrêt dure.
  M.organ = function () {
    if (M.cur.organ) return;
    const list = HK.AUDIO.organ, src = list[Math.floor(Math.random() * list.length)];
    const a = M.cur.organ = el(src, VOL.organ); a.onended = () => { if (M.cur.organ === a) { delete M.cur.organ; M.organ(); } }; a.play().catch(() => { });
  };
  M.stopOrgan = function () { stop('organ', 400); };
  // Musique pendant le jeu : la chanson joue au complet (en pause pendant les arrêts), puis la suivante.
  M.music = function () {
    stop('organ', 300);
    if (!M.musicEl) { const src = HK.AUDIO.music[M.musicIdx % HK.AUDIO.music.length]; M.musicEl = el(src, VOL.music); M.musicEl.onended = () => { M.musicIdx++; M.musicEl = null; if (M.playing) M.music(); }; }
    M.cur.music = M.musicEl; M.playing = true; M.musicEl.volume = M.muted ? 0 : VOL.music; M.musicEl.play().catch(() => { });
  };
  M.pauseMusic = function () { M.playing = false; if (M.musicEl) M.musicEl.pause(); delete M.cur.music; };
  // Chanson de but (quelques secondes), puis l'orgue reprend.
  M.goalSong = function (dur) {
    stop('organ'); M.pauseMusic();
    const a = M.cur.goal = el(HK.AUDIO.goal, VOL.goal); a.currentTime = 0; a.play().catch(() => { });
    setTimeout(() => { if (M.cur.goal === a) stop('goal', 800); }, (dur || 6) * 1000);
  };
  M.stopAll = function () { for (const k in M.cur) stop(k); M.pauseMusic(); M.musicEl = null; };
  M.pauseAll = function () { M.pausedList = []; for (const k in M.cur) { const a = M.cur[k]; if (!a.paused) { a.pause(); M.pausedList.push(a); } } };
  M.resumeAll = function () { for (const a of M.pausedList || []) a.play().catch(() => { }); M.pausedList = []; };
})(window.HK);
