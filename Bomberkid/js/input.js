// Clavier (deux joueurs) et contrôles tactiles (manette virtuelle + bouton).
(function (BK) {
  'use strict';
  const keys = new Set(), pressed = new Set();
  const K = BK.input = { keys, pressed, touch: { dx: 0, dy: 0, bomb: false, bombHeld: false, action: false, active: false } };
  K.MAPS = [
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], bomb: ['Space', 'KeyX'], action: ['ShiftLeft', 'ShiftRight', 'KeyC'] },
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], bomb: ['KeyF', 'KeyG'], action: ['KeyR', 'KeyT'] },
  ];
  K.NAMES = ['Flèches · Espace = bombe · Shift = ramasser/lancer', 'WASD · F = bombe · R = ramasser/lancer'];
  window.addEventListener('keydown', e => {
    if (e.repeat) return; if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.code !== 'Escape') { keys.delete(e.code); return; }   // on tape dans un champ ou une liste : le jeu n'écoute pas (et une liste déroulante avale le relâchement de la touche)
    keys.add(e.code); pressed.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code) && !(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))) e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => {keys.clear();K.touch.bombHeld=false;});
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { keys.clear(); K.touch.bombHeld=false; });
  if (typeof document !== 'undefined') document.addEventListener('focusin', e => { if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) keys.clear(); });   // une liste qui prend le focus : on oublie les touches tenues, sinon elles resteraient « enfoncées »
  K.any = codes => codes.some(c => keys.has(c));
  K.hit = codes => codes.some(c => pressed.has(c));
  // Remplit p.input pour un joueur humain (index 0 ou 1) ; les touches « pressées » sont consommées à la fin du tick.
  K.read = (p, map) => {
    const m = K.MAPS[map || 0], inp = p.input;
    let dx = (K.any(m.right) ? 1 : 0) - (K.any(m.left) ? 1 : 0), dy = (K.any(m.down) ? 1 : 0) - (K.any(m.up) ? 1 : 0);
    if (K.hit(m.bomb)) inp.bomb = true; if (K.hit(m.action)) inp.action = true;
    if (!map && K.touch.active) { dx = dx || K.touch.dx; dy = dy || K.touch.dy; if (K.touch.bomb) { inp.bomb = true; K.touch.bomb = false; } if (K.touch.action) { inp.action = true; K.touch.action = false; } }
    inp.bombHeld = K.any(m.bomb) || (!map && K.touch.active && K.touch.bombHeld);
    inp.dx = dx; inp.dy = dy;
  };
  K.flush = () => pressed.clear();
  K.hitAny = () => pressed.size > 0;
  // ---- tactile : manette virtuelle à gauche, boutons à droite
  K.setupTouch = (zone) => {
    if (!zone) return; let stickId = null, sx = 0, sy = 0;
    const stick = zone.querySelector('.stick'), knob = zone.querySelector('.knob');
    const move = (x, y) => { let dx = (x - sx) / 40, dy = (y - sy) / 40; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } K.touch.dx = Math.abs(dx) < 0.25 ? 0 : dx; K.touch.dy = Math.abs(dy) < 0.25 ? 0 : dy; knob.style.transform = 'translate(' + dx * 34 + 'px,' + dy * 34 + 'px)'; };
    stick.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; stickId = t.identifier; const r = stick.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; K.touch.active = true; move(t.clientX, t.clientY); }, { passive: false });
    stick.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === stickId) move(t.clientX, t.clientY); }, { passive: false });
    const end = e => { for (const t of e.changedTouches) if (t.identifier === stickId) { stickId = null; K.touch.dx = K.touch.dy = 0; knob.style.transform = ''; } };
    stick.addEventListener('touchend', end); stick.addEventListener('touchcancel', end);
    for (const [sel, key] of [['.btn-bomb', 'bomb'], ['.btn-action', 'action']]) { const b = zone.querySelector(sel); if (!b) continue; b.addEventListener('touchstart', e => { e.preventDefault(); K.touch.active = true; K.touch[key] = true; if(key==='bomb') K.touch.bombHeld=true; b.classList.add('on'); }, { passive: false }); const release=()=>{if(key==='bomb')K.touch.bombHeld=false;b.classList.remove('on');}; b.addEventListener('touchend',release);b.addEventListener('touchcancel',release); }
  };
})(window.BK);
