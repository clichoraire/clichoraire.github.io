// Goblin Malin — les tomes suivent le niveau du chef ET le jour de la partie. Les sorts des petits cercles viennent d'abord ; un sort
// un ou deux cercles au-dessus de ce que le chef devrait connaître reste possible, mais rare, puis très rare. Plus haut que ça : jamais
// (s'il ne reste rien de permis, pas de tome : de l'or à la place). Le cercle attendu est le plus petit des deux : celui du niveau
// (un de plus tous les PAR niveaux) et celui du jour (un de plus tous les JOURS jours). Avec JOURS = 3 : jours 1 à 3 = 1er cercle,
// 4 à 6 = 2e, 7 à 9 = 3e, 10 à 12 = 4e... Un tome du 6e cercle (Météore) ne peut donc plus tomber avant le jour 10, et il y reste très rare.
// Les marchands suivent la même règle : un tome trop fort pour le jour est retiré de leur étal (ui.js, UI.shop).
'use strict';
(function (CG) {
  const G = CG.G, Ce = CG.Cercles = { PAR: 3, JOURS: 3, POIDS: [1, 0.2, 0.03] }; /* PAR : un cercle de plus tous les PAR niveaux ; JOURS : un cercle de plus tous les JOURS jours ; POIDS : chance d'un sort à son cercle ou dessous, puis 1 et 2 cercles au-dessus. Au-delà de la liste : impossible */
  Ce.attendu = () => Math.max(1, Math.min(9, 1 + Math.floor(((CG.S && CG.S.player.lvl) || 1) / Ce.PAR), 1 + Math.floor((((CG.S && CG.S.day) || 1) - 1) / Ce.JOURS)));
  Ce.poids = id => { const c = CG.cercle ? CG.cercle(id) : 1, d = Math.max(0, c - Ce.attendu()); return d < Ce.POIDS.length ? Ce.POIDS[d] : 0; };
  Ce.permis = id => Ce.poids(id) > 0; /* ce sort peut-il déjà tomber ? */
  const ns0 = G.newScroll; G.newScroll = function () {
    const r = ns0.apply(this, arguments); if (!r || !CG.SPELLS[r] || CG.SPELLS[r].amelio) return r; /* rien à donner, ou un sort qui monte de niveau : on n'y touche pas */
    const p = CG.S.player, l = CG.SCROLL_POOL.filter(i => CG.SPELLS[i] && !CG.SPELLS[i].amelio && !p.spells.includes(i) && !p.scrolls[i]); if (!l.length) return r;
    let tot = 0; const w = l.map(i => (tot += Ce.poids(i))); if (!(tot > 0)) return null; /* il ne reste que des sorts trop forts pour l'instant */ let x = Math.random() * tot; for (let i = 0; i < l.length; i++) if (x < w[i]) return l[i]; return null;
  };
})(window.CG);
