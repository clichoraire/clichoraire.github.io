// Goblin Malin — le son propre à certains sorts (fichiers dans assets/audio/) : il remplace le son de sort ordinaire au moment du lancer.
'use strict';
(function (CG) {
  const G = CG.G, A = CG.audio, c0 = G.cast;
  G.cast = function (id) { A.swap = A.SORTS[id] || null; try { return c0.apply(this, arguments); } finally { A.swap = null; } };
})(window.CG);
