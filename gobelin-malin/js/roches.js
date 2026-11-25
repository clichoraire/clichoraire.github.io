// Goblin Malin — des rochers à miner un peu partout. En plus du gisement de la mine, des rochers isolés (parfois deux côte à
// côte) sont semés dans tout le monde : toujours aux mêmes endroits pour une même carte, loin les uns des autres.
// Le chef les pioche comme les autres (E). Les mineurs, eux, ne vont qu'à ceux qui sont près du village : ils ne traversent
// pas la forêt pour un caillou. Chargé après filons.js : les nouveaux rochers s'ajoutent au bout de la liste.
'use strict';
(function (CG) {
  const W = CG.W, G = CG.G, T = CG.TILE; if (!W || !W.generate) return;
  const Ro = CG.Roches = { PAR_CASES: 480, ECART: 9, DEPART: 9, MINE: 9, PAIRE: 0.3, MINEURS: 18 }; // PAR_CASES : un rocher pour tant de cases de carte ; MINEURS : jusqu'où (en cases du feu) un mineur accepte d'aller
  const monde = () => (CG.Mondes ? CG.Mondes.ici() : 0);
  const gen0 = W.generate; W.generate = function (seed) {
    const r = gen0.apply(this, arguments); if (monde() === 2 || !W.nodes || !W.tile) return r;
    const rng = CG.makeRng((W.seed || seed || 1) + 5531 + monde() * 29), voulu = Math.round(CG.MW * CG.MH / Ro.PAR_CASES), mine = W.POI && W.POI.mine, mis = [];
    const sol = (x, y) => { if (x < 4 || y < 4 || x > CG.MW - 5 || y > CG.MH - 5) return false; const t = W.tile[W.idx(x, y)]; return (t === W.GRASS || t === W.CLEAR) && W.walkTile(x, y); };
    const libre = (x, y) => sol(x, y) && sol(x, y + 1) && !W.nodes.some(o => Math.abs(o.x - x) <= 2 && Math.abs(o.y - y) <= 2)
      && Math.hypot(x - W.CX, y - W.CY) > Ro.DEPART && !(mine && Math.hypot(x - mine.x, y - mine.y) < Ro.MINE) && Object.values(W.POI || {}).every(p => Math.hypot(x - p.x, y - p.y) > (p.r || 0) + 2) && !(W.GRAVE && Math.hypot(x - W.GRAVE.x, y - W.GRAVE.y) < 7);
    for (let i = 0; i < 9000 && mis.length < voulu; i++) { const x = 4 + Math.floor(rng() * (CG.MW - 8)), y = 4 + Math.floor(rng() * (CG.MH - 8));
      if (!libre(x, y) || mis.some(o => Math.hypot(o.x - x, o.y - y) < Ro.ECART)) continue;
      W.nodes.push({ type: 'ore', x, y, epars: true }); mis.push({ x, y });
      if (rng() < Ro.PAIRE) { const dx = rng() < 0.5 ? -2 : 2; if (libre(x + dx, y)) W.nodes.push({ type: 'ore', x: x + dx, y, epars: true }); } }
    return r;
  };
  Ro.liste = () => (W.nodes || []).filter(n => n.epars);
  // les mineurs : seulement les rochers semés qui sont près du feu
  if (CG.Aide && CG.Aide.ailleurs) { const ai0 = CG.Aide.ailleurs; CG.Aide.ailleurs = function (g, ns) {
    let l = ns; if (ns && ns.some(n => n.epars)) { let f = null; try { f = G.firePos(); } catch (e) { f = null; } const ok = ns.filter(n => !n.epars || (f && Math.hypot(n.x * T + T / 2 - f.x, n.y * T + T / 2 - f.y) < Ro.MINEURS * T)); if (ok.length) l = ok; }
    return ai0.call(this, g, l);
  }; }
  // ---------- les rochers qu'on mine sont durs : le chef ne passe plus à travers, il les contourne (DUR : demi-largeur et demi-hauteur du caillou, en pixels) ----------
  // Seulement le chef : les mineurs se placent tout contre la roche pour piocher, on ne les repousse pas.
  Ro.DUR = [17, 11];
  { const upD = CG.G.update; CG.G.update = function () {
    const r = upD.apply(this, arguments), S = CG.S, R = CG.R, T = CG.TILE; if (!S || !R || !W.nodes || R.cine || R.monte) return r; const p = S.player, rx = Ro.DUR[0], ry = Ro.DUR[1];
    for (const n of W.nodes) { if (n.type !== 'ore' || n.gone) continue; const cx = n.x * T + T / 2, cy = n.y * T + T / 2 + 2, dx = p.x - cx, dy = p.y - cy; if (Math.abs(dx) > rx || Math.abs(dy) > ry) continue;
      const k = Math.hypot(dx / rx, dy / ry); if (k >= 1) continue; const a = k < 0.01 ? Math.PI / 2 : Math.atan2(dy / ry, dx / rx), nx = cx + Math.cos(a) * rx, ny = cy + Math.sin(a) * ry;
      if (W.walkPx(nx, ny)) { p.x = nx; p.y = ny; } }
    return r; }; }
})(window.CG);
