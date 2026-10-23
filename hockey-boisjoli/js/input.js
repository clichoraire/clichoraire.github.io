// Clavier et manettes. Joueur 1 : flèches + X (passe/changer) + C (lancer/mise en échec) + V (pouvoir).
// Joueur 2 : WASD + G + H + J. Manettes : stick/croix, A = passe, B = lancer, X = pouvoir.
(function (HK) {
  'use strict';
  const I = HK.input = { keys: {}, pressed: {}, pads: [] };
  const MAPS = [
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], a: ['KeyX', 'Enter'], b: ['KeyC', 'Space'], p: ['KeyV', 'ShiftRight'], sel: [['Digit1', 'Numpad1'], ['Digit2', 'Numpad2'], ['Digit3', 'Numpad3']] },
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], a: ['KeyG'], b: ['KeyH'], p: ['KeyJ'], sel: [['Digit8'], ['Digit9'], ['Digit0']] },
  ];
  I.MAPS = MAPS;
  I.init = function () {
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      I.keys[e.code] = true; I.pressed[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && I.capture && !I.typing()) e.preventDefault();
    });
    window.addEventListener('keyup', e => { I.keys[e.code] = false; });
    window.addEventListener('blur', () => { I.keys = {}; });
  };
  I.typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA'); };
  I.consume = function (code) { const v = !!I.pressed[code]; I.pressed[code] = false; return v; };
  I.flush = function () { I.pressed = {}; };
  function pad(i) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return pads && pads[i] ? pads[i] : null;
  }
  // Entrée du joueur n (1 ou 2) : {dx, dy, a, b, p}
  I.get = function (n) {
    const m = MAPS[n - 1], k = I.keys, any = arr => arr.some(c => k[c]);
    let dx = (any(m.right) ? 1 : 0) - (any(m.left) ? 1 : 0), dy = (any(m.down) ? 1 : 0) - (any(m.up) ? 1 : 0);
    let a = any(m.a), b = any(m.b), p = any(m.p), sel = null, cycle = false;
    m.sel.forEach((codes, i) => { if (any(codes)) sel = i; });
    const g = pad(n - 1);
    if (g) {
      const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
      if (Math.abs(ax) > 0.25) dx = ax; if (Math.abs(ay) > 0.25) dy = ay;
      const bt = i => g.buttons[i] && g.buttons[i].pressed;
      if (bt(12)) dy = -1; if (bt(13)) dy = 1; if (bt(14)) dx = -1; if (bt(15)) dx = 1;
      a = a || bt(0); b = b || bt(1) || bt(7); p = p || bt(2) || bt(3); cycle = bt(4) || bt(5);
      if (bt(9) && !I.padStart) { I.padStart = true; I.pressed.Escape = true; } else if (!bt(9)) I.padStart = false;
    }
    return { dx, dy, a, b, p, sel, cycle };
  };
  I.anyPadButton = function () {
    for (let i = 0; i < 2; i++) { const g = pad(i); if (g && g.buttons.some(b => b.pressed)) return true; }
    return false;
  };
})(window.HK);
