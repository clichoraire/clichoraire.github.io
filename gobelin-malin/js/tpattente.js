// Goblin Malin — après un voyage par portail (retour au village, autre monde), les portails magiques se reposent :
//   pas moyen d'en reprendre un avant CG.TpAttente.S secondes. Fini le portail qu'on reprend sans le vouloir en arrivant.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Ef = CG.Effets, Mo = CG.Mondes;
  const Tp = CG.TpAttente = { S: 10, reste: 0, TYPES: ['portailBleu', 'portailViolet', 'portailDemon', 'crypte'] };
  let dit = 0, monde = null;
  const non = () => { const p = CG.S.player; if (dit > 0) return; dit = 1; CG.sfx('no'); G.text(p.x, p.y - 64, '⏳ Le portail se repose : ' + Math.ceil(Tp.reste) + ' s', '#bfe4ff', true); };
  if (Ef && Ef.traverser) { const t0 = Ef.traverser; Ef.traverser = function () {
    if (Tp.reste > 0) { if (CG.R.portail && !(CG.R.portail.saut > 0) && !(CG.R.portail.ferme > 0)) non(); return; }
    const p = CG.S.player, x = p.x, y = p.y, r = t0.apply(this, arguments); if (Math.hypot(p.x - x, p.y - y) > 40) Tp.reste = Tp.S; return r; }; }
  if (Mo && Mo.partir) { const p0 = Mo.partir; Mo.partir = function (par) { if (Tp.reste > 0 && (par === 'sort' || par === 'portail')) { non(); return false; } return p0.apply(this, arguments); }; }
  const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it && Tp.reste > 0 && Tp.TYPES.includes(it.type)) it.label = '⏳ Le portail se repose (' + Math.ceil(Tp.reste) + ' s)'; return it; };
  const in0 = D.interact; D.interact = function () { if (Tp.reste > 0) { const it = D.findInteract(); if (it && Tp.TYPES.includes(it.type)) return non(); } return in0.apply(this, arguments); };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); if (!CG.S || !CG.R) return; if (Tp.reste > 0) Tp.reste -= dt; if (dit > 0) dit -= dt;
    const m = Mo && Mo.ici ? Mo.ici() : 0; if (monde !== null && m !== monde && m !== 2 && monde !== 2) Tp.reste = Tp.S; /* arrivé dans l'autre monde */ monde = m;
  };
})(window.CG);
