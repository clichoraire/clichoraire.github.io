// Goblin Malin — des papillons bleus. Ils ne servent à rien : ils se promènent dans la forêt, se posent un instant, repartent,
// et s'écartent d'un coup d'aile si le chef passe trop près. (Le papillon doré, lui, est un secret : secrets.js.)
// Seulement de jour, dans la forêt. Ils ne sont pas sauvegardés : d'autres reviennent à chaque partie. Réglable dans CG.Papillons.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, TAU = Math.PI * 2; if (!W || !CG.Magie) return;
  const Pa = CG.Papillons = { NB: 16, PRES: 3, VOL: [60, 170], VITESSE: 46, POSE: [2, 6], PEUR: 38, JOUR: [6, 19.5] }; /* NB sur la carte, dont PRES autour du village */
  const rand = (a, b) => a + Math.random() * (b - a), monde = () => (CG.Mondes && CG.Mondes.ici ? CG.Mondes.ici() : 0);
  const bon = (x, y) => { if (x < 3 * T || y < 3 * T || x > (CG.MW - 3) * T || y > (CG.MH - 3) * T) return false; const t = W.tile[W.idx(Math.floor(x / T), Math.floor(y / T))]; return (t === W.GRASS || t === W.CLEAR || t === W.PATH) && W.walkPx(x, y); };
  function semer() { const l = [], f = G.firePos ? G.firePos() : { x: W.CX * T, y: W.CY * T };
    for (let i = 0, k = 0; i < Pa.NB && k < 2000; k++) { let x, y; if (i < Pa.PRES) { const a = Math.random() * TAU, r = rand(150, 330); x = f.x + Math.cos(a) * r; y = f.y + Math.sin(a) * r; } else { x = rand(4, CG.MW - 4) * T; y = rand(4, CG.MH - 4) * T; }
      if (!bon(x, y)) continue; l.push({ x, y, bx: x, by: y, pose: rand(0, Pa.POSE[1]), s: Math.random() * 10, teinte: i % 3, face: 1 }); i++; } return l; }
  function partir(b, loin) { for (let k = 0; k < 10; k++) { const a = loin !== undefined ? loin + (Math.random() - 0.5) * 1.4 : Math.random() * TAU, d = rand(Pa.VOL[0], Pa.VOL[1]), x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d; if (!bon(x, y)) continue; b.bx = x; b.by = y; b.pose = 0; b.vite = loin !== undefined ? 2.2 : 1; return true; } b.pose = 1; return false; }
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R) return r;
    if (monde() !== 0 || R.night || S.hour < Pa.JOUR[0] || S.hour > Pa.JOUR[1]) { R.papillons = null; return r; }
    if (!R.papillons) { try { R.papillons = semer(); } catch (e) { R.papillons = []; } }
    const p = S.player;
    for (const b of R.papillons) {
      if (b.pose > 0) { b.pose -= dt; if (Math.hypot(b.x - p.x, b.y - p.y) < Pa.PEUR) partir(b, Math.atan2(b.y - p.y, b.x - p.x)); else if (b.pose <= 0) partir(b); continue; }
      const dx = b.bx - b.x, dy = b.by - b.y, d = Math.hypot(dx, dy), v = Pa.VITESSE * (b.vite || 1) * dt; if (d <= v) { b.x = b.bx; b.y = b.by; b.pose = rand(Pa.POSE[0], Pa.POSE[1]); b.vite = 1; continue; }
      b.x += dx / d * v; b.y += dy / d * v; if (Math.abs(dx) > 2) b.face = dx > 0 ? 1 : -1; }
    return r;
  };
  const COUL = [['#4aa8ff', '#2a6ad8', '#c8ecff'], ['#6ac8ff', '#3a8ae0', '#e8f8ff'], ['#5a8cff', '#3050c8', '#c8d8ff']];
  const ell = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), ry, rot || 0, 0, TAU); g.fill(); };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const L = CG.R && CG.R.papillons; if (!L || !L.length) return;
    for (const b of L) { if (!CG.onScreen(b.x, b.y)) continue; const vole = !(b.pose > 0), C = COUL[b.teinte], bat = vole ? Math.abs(Math.sin(t * 22 + b.s)) : 0.35 + Math.abs(Math.sin(t * 2.4 + b.s)) * 0.65;
      const x = b.x + (vole ? Math.sin(t * 5 + b.s) * 4 : 0), y = b.y - (vole ? 20 + Math.sin(t * 7.3 + b.s * 2) * 5 : 4);
      ell(g, b.x, b.y + 1, 3, 1.1, vole ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.14)');
      for (const d of [-1, 1]) { ell(g, x + d * 3 * bat, y - 1, 3.2 * bat + 0.4, 3.4, C[0], d * 0.4); ell(g, x + d * 2.2 * bat, y + 2.2, 2 * bat + 0.3, 2, C[1], -d * 0.3); ell(g, x + d * 3.1 * bat, y - 1.3, 1.1 * bat, 1.1, C[2]); }
      ell(g, x, y + 0.4, 0.75, 2.8, '#1a2440'); } };
})(window.CG);
