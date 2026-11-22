// Goblin Malin — les ruines oubliées. Une construction en ruine que personne n'a commencé à rebâtir pendant une journée entière
// disparaît le matin suivant : les débris sont emportés. Les huttes, la hutte du chef, le feu et la réserve restent toujours.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Ru = CG.Ruines = { FIXES: ['hut', 'chief', 'fire', 'stock'] };
  const cle = b => (CG.Mondes && CG.Mondes.ici ? CG.Mondes.ici() : 0) + ':' + b.type + ':' + b.tx + ',' + b.ty;
  Ru.matin = function () {
    const S = CG.S; if (!S) return 0; const avant = S.ruines || {}, ici = (CG.Mondes && CG.Mondes.ici ? CG.Mondes.ici() : 0) + ':', apres = {}; let n = 0;
    Object.keys(avant).forEach(k => { if (k.indexOf(ici) !== 0) apres[k] = avant[k]; }); /* les ruines des autres mondes attendent qu'on y retourne */
    S.buildings.slice().forEach(b => { if (!b.ruin || !b.site || Ru.FIXES.includes(b.type)) return; const k = cle(b);
      if (k in avant && (b.prog || 0) <= avant[k] + 0.001) { S.goblins.forEach(g => { if (g.siteB === b) { g.siteB = null; if (g.state === 'build' || g.state === 'toSite') { g.state = 'idle'; g.pose = null; g.timer = 0.4; } } }); G.removeBuilding(b); n++; }
      else apres[k] = b.prog || 0; });
    S.ruines = apres; return n;
  };
  const sd0 = D.startDay; D.startDay = function () { const r = sd0.apply(this, arguments); let n = 0; try { n = Ru.matin(); } catch (e) { /* jamais de matin bloqué pour des débris */ }
    if (n) CG.UI.toast('🍂 ' + (n > 1 ? 'Des ruines oubliées ont disparu.' : 'Une ruine oubliée a disparu.')); return r; };
})(window.CG);
