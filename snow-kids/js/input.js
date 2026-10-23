// Snow Kids — clavier et manettes → entrées des joueurs { steer, up, down, jump, trick, shoot, item }.
// J1 : flèches, X saut, C figure, V tir, B objet.  J2 : WASD, G saut, H figure, J tir, K objet.  Manettes : stick/croix, A saut, B figure, X tir, Y objet.
(function (SK) {
  'use strict';
  const I = SK.Input = { keys: {}, pressed: {} };
  const MAPS = [
    { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], jump: ['KeyX', 'Space'], trick: ['KeyC'], shoot: ['KeyV'], item: ['KeyB'] },
    { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], jump: ['KeyG'], trick: ['KeyH'], shoot: ['KeyJ'], item: ['KeyK'] },
  ];
  I.init = function () {
    window.addEventListener('keydown', e => { if (e.repeat) return; I.keys[e.code] = true; I.pressed[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && document.activeElement.tagName !== 'SELECT') e.preventDefault(); });
    window.addEventListener('keyup', e => { I.keys[e.code] = false; });
    window.addEventListener('blur', () => { I.keys = {}; });
  };
  I.consume = function (code) { const p = !!I.pressed[code]; I.pressed[code] = false; return p; };
  I.endFrame = function () { I.pressed = {}; };
  const down = codes => codes.some(c => I.keys[c]);
  I.pads = function () { try { return navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []; } catch (e) { return []; } };
  I.read = function (player) {
    const m = MAPS[player] || MAPS[0];
    const o = { steer: (down(m.right) ? 1 : 0) - (down(m.left) ? 1 : 0), up: down(m.up), down: down(m.down), jump: down(m.jump), trick: down(m.trick), shoot: down(m.shoot), item: down(m.item) };
    const pad = I.pads()[player];
    if (pad) {
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0, b = i => !!(pad.buttons[i] && pad.buttons[i].pressed);
      if (Math.abs(ax) > 0.2) o.steer = SK.clamp(ax, -1, 1); if (b(14)) o.steer = -1; if (b(15)) o.steer = 1;
      if (ay < -0.5 || b(12)) o.up = true; if (ay > 0.5 || b(13)) o.down = true;
      if (b(0)) o.jump = true; if (b(1)) o.trick = true; if (b(2) || b(5) || b(7)) o.shoot = true; if (b(3) || b(4) || b(6)) o.item = true;
    }
    return o;
  };
  I.anyPause = function () { return I.consume('Escape') || I.consume('KeyP') || I.pads().some(p => p.buttons[9] && p.buttons[9].pressed && !(p._p9 || (p._p9 = true))); };
})(window.SK);
