// Musique de fond : des pistes MP3 (Kevin MacLeod, incompetech.com, CC BY 4.0) selon l'écran et le monde, avec fondu enchaîné.
// La lecture automatique est bloquée tant que le joueur n'a pas touché la page : on réessaie au premier geste.
(function (CB) {
  'use strict';
  const VOLUME = .38, FADE = 1.1;
  const M = CB.Music = { enabled: true, key: null, file: null, volume: VOLUME };
  const els = {}; let cur = null, fading = [];
  const el = f => {
    if (els[f]) return els[f];
    if (typeof Audio === 'undefined') return (els[f] = { paused: true, volume: VOLUME, currentTime: 0, play() { this.paused = false; }, pause() { this.paused = true; } });
    const a = new Audio('assets/music/' + f + '.mp3'); a.loop = false; a.preload = 'auto'; a.volume = 0; a.addEventListener('ended', () => { if (cur === a) M.next(); }); return (els[f] = a);
  };
  const tryPlay = a => { try { const p = a.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { } };
  // Fondu : la nouvelle piste monte pendant que l'ancienne descend, puis l'ancienne se met en pause.
  let timer = null;
  const tick = () => {
    let busy = false;
    if (cur && cur.volume < M.volume) { cur.volume = Math.min(M.volume, cur.volume + M.volume / (FADE * 20)); busy = true; }
    for (const a of fading) { a.volume = Math.max(0, a.volume - M.volume / (FADE * 20)); if (a.volume <= 0) { a.pause(); try { a.currentTime = 0; } catch (e) { } } else busy = true; }
    fading = fading.filter(a => a.volume > 0);
    if (!busy) { clearInterval(timer); timer = null; }
  };
  const animate = () => { if (!timer) timer = setInterval(tick, 50); };
  // key = clé de CB.MUSIC (menu, boss, foret…) ou nom de fichier. Chaque clé garde sa position dans sa liste :
  // on reprend au morceau suivant quand on revient dans le contexte, et à la fin d'un morceau on enchaîne le prochain.
  const pos = {};
  const listOf = key => { const v = CB.MUSIC[key]; return Array.isArray(v) ? v : v ? [v] : [key]; };
  const playFile = (key, f) => {
    if (M.file === f) { M.key = key; if (M.enabled && cur && cur.paused) tryPlay(cur); return; }
    if (cur) { fading = fading.filter(a => a !== cur); fading.push(cur); }
    M.key = key; M.file = f; cur = el(f); fading = fading.filter(a => a !== cur); try { cur.currentTime = 0; } catch (e) { }
    if (M.enabled) { cur.volume = Math.min(cur.volume, M.volume); tryPlay(cur); }
    animate();
  };
  M.play = key => { if (M.key === key && cur) { if (M.enabled && cur.paused) tryPlay(cur); return; } const list = listOf(key); pos[key] = pos[key] || 0; playFile(key, list[pos[key] % list.length]); };
  M.next = () => { if (!M.key) return; const key = M.key, list = listOf(key); pos[key] = ((pos[key] || 0) + 1) % list.length; playFile(key, list[pos[key]]); };
  M.state = () => ({ key: M.key, file: M.file, paused: cur ? cur.paused : null, time: cur ? cur.currentTime : 0, ready: cur ? cur.readyState : 0, volume: cur ? cur.volume : 0 });
  M.stop = () => { if (cur) { fading.push(cur); animate(); } cur = null; M.key = null; M.file = null; };
  M.resume = () => { if (M.enabled && cur && cur.paused) { tryPlay(cur); animate(); } };
  M.setVolume = v => { M.volume = Math.max(0, Math.min(1, v)); if (cur && !cur.paused) cur.volume = M.volume; };
  M.setEnabled = on => { M.enabled = !!on; if (!cur) return; if (M.enabled) { tryPlay(cur); animate(); } else { cur.pause(); } };
  if (typeof window !== 'undefined' && window.addEventListener) { const kick = () => M.resume(); window.addEventListener('pointerdown', kick); window.addEventListener('keydown', kick); }
})(window.CB);
