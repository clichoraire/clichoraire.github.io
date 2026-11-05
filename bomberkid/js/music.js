// Musique de fond : des pistes MP3 selon l'écran et le décor.
// La lecture automatique est bloquée tant que le joueur n'a pas touché la page : on réessaie au premier geste.
// M ou le bouton du menu coupe ou remet la musique (mémorisé dans bk.music).
(function (BK) {
  'use strict';
  const TRACKS = { menu: 'pixelland', worlds: 'pixelland', stage: 'bitquest', boss: 'dungeonboss', hub: 'fluffing', editor: 'fluffing' };
  const LIST = [{ id: 'pixelland', name: 'Pixelland' }, { id: 'bitquest', name: 'Bit Quest' }, { id: 'dungeonboss', name: '8bit Dungeon Boss' }, { id: 'fluffing', name: 'Fluffing a Duck' }, { id: 'grass-world', name: 'Grass World' }];   // pistes qu'on peut choisir pour une pièce
  const grassTheme = theme => theme === 'garden' || theme === 'forest';
  const VOLUME = 0.4;
  let cur = null, curName = null, enabled = true;
  try { enabled = localStorage.getItem('bk.music') !== 'off'; } catch (e) { }
  const els = {};
  const el = f => {
    if (els[f]) return els[f];
    if (typeof Audio === 'undefined') return (els[f] = { paused: true, play() { this.paused = false; }, pause() { this.paused = true; }, currentTime: 0 });
    const a = new Audio('assets/music/' + f + '.mp3'); a.loop = true; a.volume = VOLUME * (BK.settings?.musicVolume ?? 100) / 100; a.preload = 'auto'; return (els[f] = a);
  };
  const report=(a,blocked)=>{if(a===cur&&M.onPlayback)M.onPlayback(blocked&&enabled);};
  const tryPlay = a => { try { const p = a.play(); if (p && p.then) p.then(()=>report(a,false)).catch(()=>report(a,true));else report(a,false); } catch (e) { report(a,true); } };
  const M = BK.music = {
    TRACKS, LIST, grassTheme,
    get enabled() { return enabled; },
    get current() { return curName; },
    play(name) {
      const f = TRACKS[name] || name; if (!f) return;
      if (curName === f) { if (enabled && cur && cur.paused) tryPlay(cur); return; }
      if (cur) { cur.pause(); try { cur.currentTime = 0; } catch (e) { } }
      curName = f; cur = el(f); if (enabled) tryPlay(cur);
    },
    applyVolume() { for (const a of Object.values(els)) if ('volume' in a) a.volume = VOLUME * (BK.settings?.musicVolume ?? 100) / 100; },
    stop() { if (cur) cur.pause(); cur = null; curName = null; },
    resume() { if (enabled && cur && cur.paused) tryPlay(cur); },
    toggle() {
      enabled = !enabled; try { localStorage.setItem('bk.music', enabled ? 'on' : 'off'); } catch (e) { }
      if (cur) { if (enabled) tryPlay(cur); else cur.pause(); }
      if(!enabled&&M.onPlayback)M.onPlayback(false);
      if (M.onChange) M.onChange(enabled); return enabled;
    },
  };
  if (typeof window !== 'undefined' && window.addEventListener) {
    const kick = () => M.resume();
    window.addEventListener('pointerdown', kick); window.addEventListener('keydown', kick);
    window.addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat && !(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))) M.toggle(); });
  }
})(window.BK);
