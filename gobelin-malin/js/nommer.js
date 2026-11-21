// Clan Gobelin — le nom officiel : nommer un gobelin ou un animal le fait évoluer (le lendemain matin), mais ça coûte au chef.
'use strict';
(function (CG) {
  const G = CG.G, P = CG.P;
  // Plus de technologie ni de prix : le nom officiel se donne le matin où il est prêt à se transformer (officiel.js pour les
  // gobelins, compagnons.js pour les animaux). Dans la discussion, on voit seulement où il en est.
  G.nameOpt = function (o) { // (les gobelins : officiel.js) un animal prêt reçoit le même choix, sans un mot sur ce que ça fait
    const C = CG.Compagnons; return o.pet && C && C.pret(o) ? [{ label: '🏷️ Le renommer officiellement', fn: () => C.demander(o) }] : [];
  };
  // une vieille partie qui avait payé la case « Nom officiel » récupère ses points
  const up0 = G.update; G.update = function () { const t = CG.S && CG.S.tech; if (t && t.owned && t.owned.s13) { delete t.owned.s13; if (!(t.dons && t.dons.s13)) t.points = (t.points || 0) + 2; } return up0.apply(this, arguments); };
  // pendant la nuit : le nom prend, et celui qui le porte évolue
  G.applyNames = function (lines) {
    const S = CG.S;
    S.goblins.concat(S.pets).forEach(o => {
      if (!o.naming) return;
      const old = o.name; o.name = o.naming; o.naming = null; o.nomme = true;
      if (lines) lines.push('🏷️ ' + old + ' s\'est réveillé' + (o.sex === 'f' ? 'e' : '') + ' changé' + (o.sex === 'f' ? 'e' : '') + ' : on l\'appelle désormais ' + o.name + '. Plus grand' + (o.sex === 'f' ? 'e' : '') + ', plus fort' + (o.sex === 'f' ? 'e' : '') + ', plus vaillant' + (o.sex === 'f' ? 'e' : '') + '.');
    });
  };
  // les nommés : plus de vie, plus de force, plus de cœur à l'ouvrage
  const mh = G.gobMaxHp; G.gobMaxHp = g => Math.round(mh(g) * (g.nomme ? 1.4 : 1));
  const ws = G.workSpeed; G.workSpeed = g => ws(g) * (g.nomme ? 1.25 : 1);
  const gd = G.guardDmg; G.guardDmg = g => gd(g) * (g.nomme ? 1.3 : 1);
  const pm = P.maxHp; P.maxHp = p => Math.round(pm(p) * (p.nomme ? 1.4 : 1));
  const pd = P.dmg; P.dmg = p => pd(p) * (p.nomme ? 1.3 : 1);
})(window.CG);
