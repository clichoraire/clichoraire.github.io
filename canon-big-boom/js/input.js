// Clavier et manette : état des touches, et manette traduite en touches (flèches, Entrée, Échap) pour les menus.
(function (CB) {
  'use strict';
  const I = CB.Input = { keys: new Set(), pressed: new Set(), gamepad: { ax: 0, ay: 0, fire: false, firePressed: false, special: false, specialPressed: false, pause: false, connected: false }, onButton: null };
  window.addEventListener('keydown', e => { if (e.target && e.target.matches && e.target.matches('input, textarea, select')) return; if (!I.keys.has(e.code)) I.pressed.add(e.code); I.keys.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && document.body.classList.contains('playing')) e.preventDefault(); });
  window.addEventListener('keyup', e => I.keys.delete(e.code));
  window.addEventListener('blur', () => { I.keys.clear(); I.pressed.clear(); });
  I.consume = code => { const had = I.pressed.has(code); I.pressed.delete(code); return had; };
  I.endFrame = () => I.pressed.clear();
  const prev = {};
  const dead = v => (Math.abs(v) < .18 ? 0 : v);
  I.poll = () => {
    const g = I.gamepad, was = g.connected; g.connected = false; g.firePressed = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue; g.connected = true;
      const ax = dead(p.axes[0] || 0) || dead(p.axes[2] || 0), ay = dead(p.axes[1] || 0) || dead(p.axes[3] || 0);
      g.ax = ax; g.ay = ay;
      if (!was && document.body) document.body.classList.add('pad');   // les pastilles A / B / L / R n'apparaissent qu'avec une manette
      const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
      g.fire = b(7) || b(5) || b(0); g.firePressed = g.fire && !prev.fire; prev.fire = g.fire; g.pause = b(9);
      g.special = b(2) || b(6); g.specialPressed = g.special && !prev.special; prev.special = g.special; // X / ZL : attaque spéciale
      g.special2 = b(3); g.special2Pressed = g.special2 && !prev.special2; prev.special2 = g.special2; // Y : deuxième pouvoir (case vierge)
      const map = { 0: 'Enter', 1: 'Escape', 9: 'Escape', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 4: 'PageUp', 5: 'PageDown' };
      for (const [i, code] of Object.entries(map)) { const now = b(+i); if (now && !prev[i]) { I.pressed.add(code); I.onButton?.(code); } prev[i] = now; }
      const dpad = { up: ay < -.6, down: ay > .6, left: ax < -.6, right: ax > .6 };
      for (const [k, now] of Object.entries(dpad)) { const code = 'Arrow' + k[0].toUpperCase() + k.slice(1); if (now && !prev['s' + k] && !document.body.classList.contains('playing')) { I.pressed.add(code); I.onButton?.(code); } prev['s' + k] = now; }
      break;
    }
  };
})(window.CB);
