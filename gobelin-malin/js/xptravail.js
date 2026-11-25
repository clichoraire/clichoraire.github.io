// Goblin Malin — le travail du chef lui apprend quelque chose : cueillir, piocher, abattre un arbre, débiter un tronc ou
//   chasser du gibier lui donne de l'expérience (avant : rien du tout). Un petit « +N XP » monte à l'endroit du travail.
//   Seul le travail du chef compte, pas celui des gobelins. Tout se règle dans CG.XpTravail.
'use strict';
(function (CG) {
  const G = CG.G; if (!G || !G.addXp) return;
  const Xt = CG.XpTravail = { CUEILLIR: 6, PIOCHER: 9, ARBRE: 5, TRONC: 4, /* un tronc se débite en deux fois : TRONC à chaque moitié */ GIBIER: { faisan: 6, biche: 10, cerf: 15 }, COL: '#c8a0ff' };
  Xt.donner = function (n, x, y) { if (!(n > 0)) return; const p = CG.S.player; G.addXp(n); G.text(x === undefined ? p.x : x, (y === undefined ? p.y : y) - 74, '+' + n + ' XP', Xt.COL); };
  // cueillir un buisson, piocher un gisement : la récolte vient de finir (le buisson ou le filon a disparu)
  if (G.pickStep) { const ps0 = G.pickStep; G.pickStep = function () { const R = CG.R, k = R && R.picking, avant = !!(k && k.n && k.n.gone), r = ps0.apply(this, arguments);
    if (k && k.n && !avant && k.n.gone && CG.R === R && !R.picking) Xt.donner(k.n.type === 'ore' ? Xt.PIOCHER : Xt.CUEILLIR, k.n.x * CG.TILE + CG.TILE / 2, k.n.y * CG.TILE); return r; }; }
  // chasser : le gibier que le chef abat lui-même (pas celui de ses chasseurs)
  const Gi = CG.Gibier; if (Gi && Gi.touche) { const t0 = Gi.touche; Gi.touche = function (a, dmg, par) { const vivant = a && !a.mort, r = t0.apply(this, arguments);
    if (vivant && a.mort && (!par || par === CG.S.player)) Xt.donner(Xt.GIBIER[a.k] || Xt.GIBIER[a.sorte] || Xt.GIBIER[a.type] || Xt.GIBIER.faisan, a.x, a.y); return r; }; }
})(window.CG);
