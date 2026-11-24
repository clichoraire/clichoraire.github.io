// Goblin Malin — la dague simple : l'arme de base d'un garde, comme l'arc simple du chasseur. Aucune étoile, aucun bonus :
//   elle lui évite seulement de se battre à coups de poing (qui ne font que G.POINGS des dégâts). Tout garde sans arme
//   en a une. On la voit, grisée, dans sa case « Épée » ; on ne peut pas la prendre. Une vraie arme la remplace.
'use strict';
(function (CG) {
  const G = CG.G, Bq = CG.Banque, Dg = CG.Dague = { NOM: 'Dague simple' };
  Dg.a = g => !!g && g.job === 'garde' && !g.child && !g.bebe && !(g.equip && (g.equip.epee || g.equip.arc || g.equip.baton));
  if (Bq && Bq.NOMS.epee) Bq.NOMS.epee[0] = Dg.NOM;
  if (Bq && Bq.effet) { const e0 = Bq.effet; Bq.effet = function (k, n) { return k === 'epee' && !n ? 'Arme de base : aucun bonus, mais mieux que les poings' : e0.apply(this, arguments); }; }
  const gd0 = G.guardDmg; G.guardDmg = function (g) { const d = gd0.apply(this, arguments); return Dg.a(g) && G.POINGS ? d / G.POINGS : d; };
  const to0 = G.toolOf; G.toolOf = function (g) { const t = to0.apply(this, arguments); return !t && Dg.a(g) && g.pose !== 'dance' && g.pose !== 'drum' ? 'couteau' : t; };
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (g && g.dague) o.dague = true; }); return d; }; }
})(window.CG);
