// Goblin Malin — deux petites choses sur les gobelins :
//   le jour où chacun est arrivé au campement (g.jour), montré sur sa fiche ;
//   les bricoleurs gagnent eux aussi de l'expérience en bâtissant et en améliorant (comme les autres métiers en travaillant).
'use strict';
(function (CG) {
  const G = CG.G, Ar = CG.Arrivee = { XP_TOUS: 6, XP_MAX: 5 }; /* XP_TOUS : un point d'expérience toutes les 6 secondes de chantier ; XP_MAX : jusqu'à ce niveau-là, comme les artisans */
  // ---------- le jour d'arrivée ----------
  const ag0 = G.addGoblin; if (ag0) G.addGoblin = function () { const g = ag0.apply(this, arguments); if (g && g.jour === undefined) g.jour = CG.S.day || 1; return g; };
  // une partie d'avant : on ne sait pas quand ils sont arrivés, seulement que c'était avant aujourd'hui
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments), S = CG.S; if (S && S.goblins) S.goblins.forEach(g => { if (g.jour === undefined && g.jourAvant === undefined) { if ((S.day || 1) <= 1) g.jour = 1; else g.jourAvant = S.day; } }); return r; };
  let tic = 0; const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); tic -= dt; if (tic > 0 || !CG.S) return; tic = 2; const S = CG.S; for (const g of S.goblins) if (g.jour === undefined && g.jourAvant === undefined) g.jour = S.day || 1; }; /* ceux qui arrivent par un autre chemin (naissance, sort, autre monde) */
  Ar.texte = function (g) { const S = CG.S, d = S.day || 1; if (g.jour === undefined) return g.jourAvant ? 'avant le jour ' + g.jourAvant : 'le jour ' + d; const n = d - g.jour; return 'le jour ' + g.jour + (n <= 0 ? ' (aujourd\'hui)' : n === 1 ? ' (hier)' : ' (' + n + ' jours)'); };
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (!g) return; if (g.jour !== undefined) o.jour = g.jour; if (g.jourAvant !== undefined) o.jourAvant = g.jourAvant; }); return d; }; }
  // ---------- l'expérience des bricoleurs ----------
  Ar.bricole = function (g, travail) { if (!g || g.job === undefined || !G.gobXp) return; g.bricoXp = (g.bricoXp || 0) + travail; if (g.bricoXp < Ar.XP_TOUS) return; g.bricoXp = 0; G.gobXp(g, 1, Ar.XP_MAX); };
  const bw0 = G.buildWork; if (bw0) G.buildWork = function (b, amount, who) { if (who && CG.S && who !== CG.S.player) Ar.bricole(who, amount); return bw0.apply(this, arguments); };
})(window.CG);
