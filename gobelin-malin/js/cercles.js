// Goblin Malin — les parchemins suivent le niveau du chef. Les sorts des petits cercles viennent d'abord ; un sort d'un cercle
// bien au-dessus de ce que le chef devrait connaître reste possible, mais très rare. (Les marchands vendent ce qu'ils veulent.)
'use strict';
(function (CG) {
  const G = CG.G, Ce = CG.Cercles = { PAR: 3, POIDS: [1, 0.25, 0.05, 0.01] }; /* PAR : un cercle de plus tous les PAR niveaux ; POIDS : chance d'un sort à son cercle ou dessous, puis 1, 2, 3 cercles (et plus) au-dessus */
  Ce.attendu = () => Math.min(9, 1 + Math.floor(((CG.S && CG.S.player.lvl) || 1) / Ce.PAR));
  Ce.poids = id => { const c = CG.cercle ? CG.cercle(id) : 1, d = Math.max(0, c - Ce.attendu()); return Ce.POIDS[Math.min(d, Ce.POIDS.length - 1)]; };
  const ns0 = G.newScroll; G.newScroll = function () {
    const r = ns0.apply(this, arguments); if (!r || !CG.SPELLS[r] || CG.SPELLS[r].amelio) return r; /* rien à donner, ou un sort qui monte de niveau : on n'y touche pas */
    const p = CG.S.player, l = CG.SCROLL_POOL.filter(i => CG.SPELLS[i] && !CG.SPELLS[i].amelio && !p.spells.includes(i) && !p.scrolls[i]); if (!l.length) return r;
    let tot = 0; const w = l.map(i => (tot += Ce.poids(i))); let x = Math.random() * tot; for (let i = 0; i < l.length; i++) if (x < w[i]) return l[i]; return r;
  };
})(window.CG);
