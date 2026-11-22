// Goblin Malin — le soir, autour du feu, on fait la fête : personne ne vient déranger le chef avec une demande (une question,
// une envie de construction, une pierre tombale), et on ne lui propose pas de mettre un gobelin au travail sur les murs.
// Les demandes reprennent le lendemain.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI;
  const up0 = G.update; G.update = function () {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !R.fireLit) return r;
    for (const g of S.goblins) if (g.ask) { g.ask = null; g.envieDem = null; g.tombeDem = null; if (G.resetGoblin) G.resetGoblin(g); }
    return r;
  };
  // dans « Discuter », près du feu allumé : pas de demande de travaux
  window.addEventListener('load', () => { const dl0 = UI.dialog; UI.dialog = function (o) { const R = CG.R; if (R && R.fireLit && o && o.goblin && Array.isArray(o.options) && o.options.some(x => x && /^🧱/.test(x.label || ''))) o = Object.assign({}, o, { options: o.options.filter(x => !(x && /^🧱/.test(x.label || ''))) }); return dl0.call(this, o); }; });
})(window.CG);
