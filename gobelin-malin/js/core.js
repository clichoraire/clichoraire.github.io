// Clan Gobelin — socle : espace de noms, hasard, clavier.
'use strict';
window.CG = { VERSION: '0.333.0', TILE: 40, MW: 96, MH: 72, MW0: 96, MH0: 72, MW1: 136, MH1: 102 }; // MW0 × MH0 : la forêt (et les salles) ; MW1 × MH1 : le marais, deux fois plus vaste
(function (CG) {
  // ---------- hasard ----------
  CG.makeRng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  CG.rand = (a, b) => a + Math.random() * (b - a);
  CG.irand = (a, b) => Math.floor(CG.rand(a, b + 1));
  CG.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  CG.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  CG.lerp = (a, b, t) => a + (b - a) * t;
  CG.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  CG.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  };

  // ---------- clavier ----------
  const down = new Set();
  const pressed = [];
  CG.keys = down;
  CG.takePresses = function () { const p = pressed.slice(); pressed.length = 0; return p; };
  const norm = e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    return k === ' ' ? 'Space' : k;
  };
  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    const k = norm(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(k)) e.preventDefault();
    if (!e.repeat) pressed.push(k);
    down.add(k);
  });
  window.addEventListener('keyup', e => down.delete(norm(e)));
  window.addEventListener('blur', () => down.clear());

})(window.CG);
