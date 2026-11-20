// Clan Gobelin — plus personne ne reste planté devant un obstacle : quand on bâtit sur le chemin d'un gobelin (une clôture, un mur),
// il recalcule sa route tout de suite ; et s'il piétine quand même sur place, il s'en rend compte au bout d'une seconde et demie.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Co = CG.Coince = { DELAI: 1.5 };
  function reroute(g) { // même destination, nouveau chemin ; s'il n'y en a pas, il repart de zéro et sa routine choisit autre chose
    const e = g.path && g.path.length ? g.path[g.path.length - 1] : null; G.unstick(g, 8); g._st = 0;
    if (!e || !G.goTo(g, e.x, e.y)) { const cr = g.crieur, ch = g.chicane, rp = g.repli; G.resetGoblin(g); g.crieur = cr; g.chicane = ch; g.repli = rp; }
  }
  Co.tous = function () { const S = CG.S; if (!S) return; S.goblins.forEach(g => { if (!g.hidden && g.path && g.path.length) reroute(g); }); (S.pets || []).forEach(p => { p.path = null; }); (CG.R.visitors || []).forEach(v => { if (v.path && v.path.length) { const e = v.path[v.path.length - 1]; v.path = W.path(v.x, v.y, e.x, e.y) || v.path; } }); };
  // dès qu'une case se bloque (un chantier posé, une ruine, une construction finie), tous ceux qui marchent refont leur chemin
  const bb0 = W.blockBuilding; let dirty = false; W.blockBuilding = function () { const r = bb0.apply(this, arguments); dirty = true; return r; };
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S; if (!S) return;
    if (dirty) { dirty = false; if (CG.running !== false) Co.tous(); }
    tic -= dt; if (tic > 0) return; tic = 0.5;
    for (const g of S.goblins) {
      if (g.hidden || g.pose || g.nap || !g.path || !g.path.length || (CG.R.talking === g)) { g._st = 0; g._sx = g.x; g._sy = g.y; continue; }
      if (Math.hypot(g.x - (g._sx || 0), g.y - (g._sy || 0)) > 3) { g._st = 0; g._sx = g.x; g._sy = g.y; continue; }
      g._st = (g._st || 0) + 0.5; if (g._st >= Co.DELAI) reroute(g);
    }
  };
})(window.CG);
