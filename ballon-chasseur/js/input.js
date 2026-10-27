// Clavier et manette. Flèches + X (lancer, tenu = charge / sauter) + C (sauter avec la balle, passer / attraper) + V (pouvoir).
// Manette : stick/croix, A = lancer ou sauter, B = sauter avec la balle, passer ou attraper, X ou Y = pouvoir, LB/RB = changer de joueur.
(function (BC) {
  'use strict';
  const I = BC.input = { keys: {}, pressed: {}, pads: [] };
  const MAPS = [
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], a: ['KeyX', 'Enter'], b: ['KeyC', 'Space'], p: ['KeyV', 'KeyB', 'ShiftLeft', 'ShiftRight'], sel: [['Digit1', 'Numpad1'], ['Digit2', 'Numpad2'], ['Digit3', 'Numpad3']] },
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
  function pad(i) { const pads = navigator.getGamepads ? navigator.getGamepads() : []; return pads && pads[i] ? pads[i] : null; }
  // Entrée du joueur (n = 1 ; la manette n − 1 lui est associée) : {dx, dy, a, b, p, sel, cycle}
  I.get = function (n) {
    const m = MAPS[n - 1] || MAPS[0], k = I.keys, any = arr => arr.some(c => k[c]);
    let dx = (any(m.right) ? 1 : 0) - (any(m.left) ? 1 : 0), dy = (any(m.down) ? 1 : 0) - (any(m.up) ? 1 : 0);
    let a = any(m.a), b = any(m.b), p = any(m.p), sel = null, cycle = false;
    m.sel.forEach((codes, i) => { if (any(codes)) sel = i; });
    const g = pad(n - 1);
    if (g) {
      const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
      if (Math.abs(ax) > 0.4) dx = Math.sign(ax); if (Math.abs(ay) > 0.4) dy = Math.sign(ay);
      const bt = i => g.buttons[i] && g.buttons[i].pressed;
      if (bt(12)) dy = -1; if (bt(13)) dy = 1; if (bt(14)) dx = -1; if (bt(15)) dx = 1;
      a = a || bt(0); b = b || bt(1); p = p || bt(2) || bt(3); cycle = bt(4) || bt(5);
      if (bt(9) && !I.padStart) { I.padStart = true; I.pressed.Escape = true; } else if (!bt(9)) I.padStart = false;
    }
    return { dx, dy, a, b, p, sel, cycle, targetCycle: !!k.KeyT || !!g?.buttons[11]?.pressed };
  };
})(window.BC);
