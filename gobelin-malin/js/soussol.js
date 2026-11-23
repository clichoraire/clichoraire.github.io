// Goblin Malin — sous une maison, une clôture ou une torche, il y a toujours de la terre : on peut y tracer un chemin ou y semer
//   du gazon comme partout ailleurs. Le sol choisi est gardé (S.terra) : il reste dessous, et il réapparaît si on démolit.
//   (Pas sous un pont ni une douve : là, c'est de l'eau.)
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Ss = CG.SousSol = {};
  const bati = (tx, ty) => { if (!W.inMap(tx, ty) || !G.buildingAt) return null; const b = G.buildingAt(tx, ty); if (!b) return null; const d = CG.BUILDS[b.type] || {}, t = W.tile[W.idx(tx, ty)]; return d.on === 'water' || d.tile === 'moat' || d.tile === 'bridge' || t === W.WATER || t === W.MOAT || t === W.BRIDGE ? null : b; };
  const dessous = i => { const S = CG.S, v = S && S.terra ? S.terra[i] : undefined; return v === W.PATH || v === W.CLEAR ? v : W.GRASS; };
  Ss.dessous = (tx, ty) => dessous(W.idx(tx, ty));
  // le temps d'un appel, la case montre le sol qu'elle cache
  function decouvrir(cases, fn) { const vieux = cases.map(i => W.tile[i]); cases.forEach(i => { W.tile[i] = dessous(i); }); try { return fn(); } finally { cases.forEach((i, k) => { W.tile[i] = vieux[k]; }); } }
  const ok0 = W.terrainOk; W.terrainOk = function (tx, ty) { const a = arguments; if (!bati(tx, ty)) return ok0.apply(this, a); return decouvrir([W.idx(tx, ty)], () => ok0.apply(this, a)); };
  const st0 = W.setTerrain; W.setTerrain = function (tx, ty) {
    const a = arguments; W.sous = null; if (!bati(tx, ty)) return st0.apply(this, a); const i = W.idx(tx, ty), vieux = W.tile[i]; W.tile[i] = dessous(i);
    try { const r = st0.apply(this, a); W.sous = { i, v: W.tile[i] }; if (CG.S && CG.S.terra) CG.S.terra[i] = W.tile[i]; return r; } finally { W.tile[i] = vieux; if (W.terrain && W.repaintArea) W.repaintArea(tx, ty); }
  };
  // peindre le terrain : les chemins cachés sous les bâtiments sont peints aussi
  const caches = (x0, y0, x1, y1) => { const S = CG.S, l = []; if (!S || !S.terra || !S.buildings) return l; for (const b of S.buildings) { if (b.tx + b.w <= x0 || b.tx > x1 || b.ty + b.h <= y0 || b.ty > y1) continue; for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { const tx = b.tx + x, ty = b.ty + y, i = W.idx(tx, ty); if (S.terra[i] === W.PATH && W.tile[i] !== W.PATH && bati(tx, ty)) l.push(i); } } return l; };
  const ra0 = W.repaintArea; W.repaintArea = function (tx, ty) { const a = arguments, l = caches(tx - 2, ty - 2, tx + 2, ty + 2); return l.length ? decouvrir(l, () => ra0.apply(this, a)) : ra0.apply(this, a); };
  const pa0 = W.paint; W.paint = function () { const a = arguments, l = CG.Mondes && CG.Mondes.ici && CG.Mondes.ici() === 2 ? [] : caches(0, 0, CG.MW, CG.MH); return l.length ? decouvrir(l, () => pa0.apply(this, a)) : pa0.apply(this, a); };
  // on démolit : chaque case retrouve le sol qu'on lui avait donné
  const ub0 = W.unblock; W.unblock = function (b) { const r = ub0.apply(this, arguments), S = CG.S; if (S && S.terra) for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { const i = W.idx(b.tx + x, b.ty + y), v = S.terra[i]; if (v === W.PATH || v === W.GRASS) W.tile[i] = v; } return r; };
  if (CG.BUILDS.chemin) CG.BUILDS.chemin.desc = 'Trace un sentier de terre, même sous une maison ou une clôture. On y marche 20 % plus vite, et la forêt n\'y repousse pas.';
})(window.CG);
