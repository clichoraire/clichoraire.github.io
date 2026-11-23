// Goblin Malin — les coffres cachés. Un coffre qui tombait par-dessus un buisson est maintenant caché DESSOUS : on ne le voit pas.
// Quand le buisson est cueilli (ou le rocher pioché), il disparaît et le coffre apparaît juste en dessous.
// En plus, chaque jour, un ou deux coffres au plus sont cachés sous un rocher à minerai. Tout se règle dans CG.CoffreCache.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, pick = CG.pick;
  const Cc = CG.CoffreCache = { PRES: 44, ROCHES: [0, 2], LOIN: 12 }; /* PRES : à cette distance d'un buisson, le coffre se cache dessous ; ROCHES : entre combien et combien de coffres sous un rocher, par jour ; LOIN : pas à moins de tant de cases du feu */
  const centre = n => ({ x: n.x * T + T / 2, y: n.y * T + T / 2 });
  function cacher(R, c, n) { const q = centre(n), i = R.chests.indexOf(c); if (i >= 0) R.chests.splice(i, 1); c.x = q.x; c.y = q.y + 6; (R.coffresCaches = R.coffresCaches || []).push({ c, n }); }
  const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments), R = CG.R; if (!R || !R.chests) return r; R.coffresCaches = []; if ((CG.Mondes && CG.Mondes.ici() === 2) || !W.nodes) return r;
    const pris = new Set(), libres = t => W.nodes.filter(n => n.type === t && !n.gone && !pris.has(n));
    // 1) un coffre posé sur un buisson (ou un rocher) : dessous
    for (const c of R.chests.slice()) { if (c.open) continue; let best = null, bd = Cc.PRES; for (const n of W.nodes) { if ((n.type !== 'bush' && n.type !== 'ore') || n.gone || pris.has(n)) continue; const q = centre(n), d = Math.hypot(q.x - c.x, q.y - c.y); if (d < bd) { bd = d; best = n; } } if (best) { pris.add(best); cacher(R, c, best); } }
    // 2) un ou deux, pas plus, sous un rocher loin du village
    let f = null; try { f = G.firePos(); } catch (e) { f = null; }
    const nb = Cc.ROCHES[0] + Math.floor(Math.random() * (Cc.ROCHES[1] - Cc.ROCHES[0] + 1)) - R.coffresCaches.filter(o => o.n.type === 'ore').length;
    for (let k = 0; k < nb; k++) { const l = libres('ore').filter(n => !f || Math.hypot(centre(n).x - f.x, centre(n).y - f.y) > Cc.LOIN * T), cs = R.chests.filter(c => !c.open && !c.mimic && !c.tk); if (!l.length || cs.length < 3) break; const n = pick(l); pris.add(n); cacher(R, pick(cs), n); }
    return r;
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, L = R && R.coffresCaches; if (!L || !L.length) return;
    for (let i = L.length - 1; i >= 0; i--) { const o = L[i]; if (!o.n.gone && W.nodes.includes(o.n)) continue; L.splice(i, 1); const c = o.c; c.vu = true; R.chests.push(c); // le buisson est cueilli, le rocher pioché : le coffre était dessous
      G.puff(c.x, c.y - 6, '#ffe36b', 16, 110, 3); R.rings.push({ x: c.x, y: c.y - 4, r: 50, life: 0.5, col: '#ffe36b' }); G.text(c.x, c.y - 46, 'Un coffre caché !', '#ffe9a8', true); if (CG.onScreen(c.x, c.y)) CG.sfx('discovery'); }
  };
})(window.CG);
