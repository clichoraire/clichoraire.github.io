// Goblin Malin — récolter, c'est comme bâtir : un coup à chaque fois qu'on appuie (E, clic ou bouton).
//   Buisson, gisement, arbre, tronc : rien n'avance tout seul. Les coups déjà donnés restent si on s'éloigne un moment.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, T = CG.TILE, rand = CG.rand;
  const Cp = CG.Coups = { NB: { bush: 3, ore: 5, arbreChef: 5, troncChef: 3 }, REPOS: 0.26, POSE: 0.42 };
  const ENCORE = { bush: 'Cueillir encore', ore: 'Encore un coup de pioche', arbreChef: 'Encore un coup de hache', troncChef: 'Encore un coup de hache' };
  const COL = { bush: '#3a8a44', ore: '#9aa0a8', arbreChef: '#c9a56b', troncChef: '#c9a56b' };
  const cle = it => it.type === 'troncChef' ? 'l' + it.obj.tx + ',' + it.obj.ty + ',' + it.obj.halves : it.type[0] + it.obj.x + ',' + it.obj.y;
  const faits = () => { const R = CG.R; return R.coupsFaits || (R.coupsFaits = {}); };
  const centre = it => it.type === 'troncChef' ? { x: (it.obj.tx + 0.5 + (it.obj.dir || 1) * 0.35) * T, y: it.obj.ty * T + T / 2 } : { x: it.obj.x * T + T / 2, y: it.obj.y * T + T / 2 };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments); if (!it || !Cp.NB[it.type] || !CG.R) return it;
    const n = faits()[cle(it)] || 0; if (/ne bouge pas/.test(it.label) || n > 0) it.label = ENCORE[it.type] + ' (' + n + '/' + Cp.NB[it.type] + ')'; return it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || !Cp.NB[it.type]) return in0.apply(this, arguments);
    const R = CG.R; if (R.coupT > 0) return; const c = cle(it), M = faits(), n = Cp.NB[it.type];
    let k = R.picking || R.coupe; if (k && k.cle !== c) return; if (!k) { in0.apply(this, arguments); k = R.picking || R.coupe; if (!k) return; k.cle = c; }
    R.coupT = Cp.REPOS; const nb = (M[c] || 0) + 1; if (nb >= n) { delete M[c]; k.gele = k.max; } else { M[c] = nb; k.gele = k.max * nb / n; } k.t = k.gele; k.frappe = R.t + Cp.POSE;
    const o = centre(it); CG.sfx('chop'); G.puff(o.x + rand(-8, 8), o.y - 12 - rand(0, 10), COL[it.type], 6, 100, 3); if (it.type === 'arbreChef') G.puff(o.x + rand(-14, 14), o.y - 40, '#3a8a44', 3, 60, 3);
  };
  const up0 = G.update; G.update = function (dt) {
    const R0 = CG.R, k = R0 ? (R0.picking || R0.coupe) : null; if (R0 && R0.coupT > 0) R0.coupT -= dt;
    up0.apply(this, arguments); const R = CG.R; if (!R || R !== R0 || !k || k.gele === undefined || (R.picking || R.coupe) !== k) return;
    k.t = k.gele; /* le temps ne fait rien avancer : seulement les coups */
    if (!(k.frappe > R.t) && R.chefPose && ['chop', 'mine', 'gather'].includes(R.chefPose.k) && R.chefPose.fin <= R.t + 0.2) R.chefPose = null;
  };
  // la petite barre au-dessus de l'arbre ou du tronc (le buisson et le gisement ont déjà la leur)
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R, k = R && R.coupe; if (!k || !CG.Art.bar) return;
    const x = k.l ? (k.l.tx + 0.5 + (k.l.dir || 1) * 0.35) * T : k.a.x * T + T / 2, y = k.l ? k.l.ty * T - 4 : k.a.y * T - 30; CG.Art.bar(g, x, y, 34, k.t / k.max, '#e8c88a');
  };
})(window.CG);
