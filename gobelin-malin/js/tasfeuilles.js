// Goblin Malin — les tas de feuilles mortes. Chaque jour, quelques tas traînent dans la forêt. Le feu les fait disparaître
// (étincelle, boule de feu, mur de feu, manteau de braises, explosion de feu). Dessous : le plus souvent rien, parfois un
// objet oublié, et très rarement un trou qui mène chez la Grande Fée (secrets.js).
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  const Ta = CG.Tas = { NB: [2, 6], LOIN: 8, ECART: 6, OBJET: 0.35, TROU: 0.012, JOUR_TROU: 2, BRULE: 1.1, TIR: 20, MUR: 30, MANTEAU: 26, SOUFFLE: 14 };
  const ici = () => (CG.Mondes ? CG.Mondes.ici() : 0);
  const foret = () => { const m = ici(); return m === 0 || (m >= 3 && m <= 5); }; /* la forêt de départ et les trois forêts voisines ; chaque monde garde ses propres tas */
  const feuPos = () => { try { const f = G.firePos(); if (f && isFinite(f.x) && isFinite(f.y)) return f; } catch (e) { /* rien */ } return { x: W.CX * T, y: W.CY * T }; };
  const pos = (x, y) => ({ x: x * T + T / 2 + (W.hash(x, y) - 0.5) * 14, y: y * T + T / 2 + (W.hash(y, x) - 0.5) * 10 }); /* le même point que le trou de secrets.js : il apparaît pile dessous */
  // ---------- le tirage du jour ----------
  Ta.tirer = function () {
    const S = CG.S, f = feuPos(), fx = f.x / T, fy = f.y / T, n = CG.irand(Ta.NB[0], Ta.NB[1]), l = []; let trou = false;
    for (let i = 0; i < 6000 && l.length < n; i++) { const x = 3 + Math.floor(Math.random() * (CG.MW - 6)), y = 3 + Math.floor(Math.random() * (CG.MH - 6)), t = W.tile[W.idx(x, y)];
      if ((t !== W.GRASS && t !== W.CLEAR) || !W.walkTile(x, y) || Math.hypot(x - fx, y - fy) < Ta.LOIN || l.some(o => Math.hypot(o.tx - x, o.ty - y) < Ta.ECART)) continue;
      if (S.buildings.some(b => x >= b.tx - 2 && x <= b.tx + b.w + 1 && y >= b.ty - 2 && y <= b.ty + b.h + 1)) continue;
      try { if (W.reachable && !W.reachable(x, y)) continue; } catch (e) { /* rien */ }
      const q = pos(x, y), k = Math.random(); let c = null;
      if (!trou && S.day >= Ta.JOUR_TROU && k < Ta.TROU && (!CG.Secrets || !CG.Secrets.bonTrou || CG.Secrets.bonTrou(x, y)) && !(CG.Secrets && CG.Secrets.repos && CG.Secrets.repos('trouFeuilles'))) { c = 'trou'; trou = true; } else if (k < Ta.TROU + Ta.OBJET) c = 'objet';
      l.push({ tx: x, ty: y, x: q.x, y: q.y, c, v: Math.floor(Math.random() * 3), f: 0, fini: false }); }
    S.tas = { day: S.day, l }; return l;
  };
  Ta.liste = function () { const S = CG.S; if (!S || !foret()) return []; if (!S.tas || S.tas.day !== S.day) Ta.tirer(); return S.tas.l; };
  // ---------- ce qu'il y avait dessous ----------
  function decouvrir(s) {
    const S = CG.S, d = S.day;
    if (s.c === 'trou' && CG.Secrets) { CG.Secrets.liste(); if (S.secrets && S.secrets.l && !S.secrets.l.some(o => o.k === 'trou' && o.x === s.tx && o.y === s.ty)) S.secrets.l.push({ x: s.tx, y: s.ty, k: 'trou', tas: true, fait: false }); return; }
    if (s.c !== 'objet') return; const k = Math.random();
    if (k < 0.4) G.dropRes(s.x, s.y, 'or', CG.irand(8, 16) + d * 2); else if (k < 0.58) G.dropRes(s.x, s.y, 'food', CG.irand(4, 8)); else if (k < 0.72) G.dropRes(s.x, s.y, 'minerai', CG.irand(3, 6));
    else if (k < 0.87) G.drop(s.x, s.y, { kind: 'potion', n: 1 }); else for (let i = 0; i < 3; i++) G.drop(s.x, s.y, { kind: 'xp', n: 3 + d });
    if (CG.onScreen(s.x, s.y)) CG.sfx('ok');
  }
  Ta.allumer = function (s) { if (s.fini || s.f > 0) return false; s.f = 0.001; if (CG.onScreen(s.x, s.y)) { CG.sfx('fire'); G.puff(s.x, s.y - 6, '#ffb432', 10, 90, 3); } return true; };
  const feuTir = s => s.kind === 'feu' || s.kind === 'fireE' || s.kind === 'fire' || s.etin || (s.kind === 'bolt' && s.team === 'p'); /* l'étincelle du chef compte aussi */
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, S = CG.S; if (!R || !S || R.night || R.cine || !foret()) return; const l = Ta.liste(); if (!l.length) return;
    const p = S.player, a = CG.Elements && CG.Elements.manteau ? CG.Elements.manteau() : null, braise = a && a.id === 'armFeu';
    for (const s of l) { if (s.fini) continue;
      if (s.f > 0) { s.f += dt; /* il flambe : flammes et braises, puis plus rien qu'un peu de cendre */
        if (CG.onScreen(s.x, s.y) && Math.random() < dt * 34) R.parts.push({ x: s.x + rand(-13, 13), y: s.y + rand(-5, 4), vx: rand(-12, 12), vy: -rand(30, 80), life: rand(0.3, 0.6), max: 0.6, col: Math.random() < 0.5 ? '#ff8a1e' : Math.random() < 0.5 ? '#ffe36b' : '#ff4a2a', size: rand(3, 6), float: true });
        if (s.f >= Ta.BRULE) { s.fini = true; G.puff(s.x, s.y - 6, '#8a8078', 12, 70, 4); decouvrir(s); } continue; }
      if (braise && Math.hypot(p.x - s.x, p.y - s.y) < Ta.MANTEAU) { Ta.allumer(s); continue; }
      let pris = false;
      for (const q of R.shots || []) { if (q.life <= 0 || !feuTir(q) || Math.hypot(q.x - s.x, q.y + 16 - s.y) > Ta.TIR) continue; pris = true; q.life = 0; if (q.aoe) G.blast(q.x, q.y, q.aoe, q.dmg, '#ff8a1e', q.team === 'p'); break; }
      if (!pris) for (const w of R.walls || []) { const vx = w.x2 - w.x1, vy = w.y2 - w.y1, L2 = vx * vx + vy * vy || 1, k = CG.clamp(((s.x - w.x1) * vx + (s.y - w.y1) * vy) / L2, 0, 1); if (Math.hypot(s.x - (w.x1 + vx * k), s.y - (w.y1 + vy * k)) < Ta.MUR) { pris = true; break; } }
      if (pris) Ta.allumer(s); }
  };
  // toute explosion de feu enflamme les tas qu'elle touche
  const bl0 = G.blast; G.blast = function (x, y, r, dmg, col) {
    const res = bl0.apply(this, arguments);
    if (CG.S && CG.S.tas && foret() && CG.Elements && CG.Elements.FEUX[col]) for (const s of CG.S.tas.l) if (!s.fini && Math.hypot(s.x - x, s.y - y) < r + Ta.SOUFFLE) Ta.allumer(s);
    return res;
  };
  // ---------- dessin : trois tas différents, peints une seule fois ----------
  const COL = ['#c8641e', '#e08a2a', '#b8401c', '#e8b03a', '#8a4a1e', '#d8742a', '#a83a1a', '#f0c44a'];
  let IMG = null;
  function peindre() {
    IMG = [0, 1, 2].map(v => { const c = document.createElement('canvas'); c.width = 96; c.height = 64; const g = c.getContext('2d'), rng = CG.makeRng(771 + v * 53);
      g.translate(48, 40); g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(0, 6, 28, 8, 0, 0, TAU); g.fill();
      const feuille = (x, y, a, k, col) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(k, k); g.fillStyle = col; g.beginPath(); g.moveTo(-6, 0); g.quadraticCurveTo(0, -5.5, 7, 0); g.quadraticCurveTo(0, 5.5, -6, 0); g.fill(); g.strokeStyle = 'rgba(70,30,10,0.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-5, 0); g.lineTo(6, 0); g.stroke(); g.restore(); };
      for (let i = 0; i < 7; i++) { const a = rng() * TAU, r = 24 + rng() * 14; feuille(Math.cos(a) * r, 4 + Math.sin(a) * r * 0.32, rng() * TAU, 0.75 + rng() * 0.3, COL[Math.floor(rng() * COL.length)]); } /* quelques feuilles éparpillées autour */
      g.fillStyle = '#7a3e18'; g.beginPath(); g.ellipse(0, 2, 23, 9.5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-2 + v * 2, -4, 16, 9, 0, 0, TAU); g.fill();
      for (let i = 0; i < 46; i++) { const u = rng(), a = rng() * TAU, h = (1 - u) * 13, r = 3 + u * 19; feuille(Math.cos(a) * r, 3 - h + Math.sin(a) * r * 0.36, rng() * TAU, 0.8 + rng() * 0.45, COL[Math.floor(rng() * COL.length)]); }
      return c; });
  }
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); if (!CG.S || !CG.R || !foret()) return; const l = Ta.liste(); if (!l.length) return; if (!IMG) peindre();
    for (const s of l) { if (!CG.onScreen(s.x, s.y)) continue;
      if (s.fini) { if (s.c === 'trou') continue; g.fillStyle = 'rgba(40,34,30,0.32)'; g.beginPath(); g.ellipse(s.x, s.y + 2, 17, 6.5, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(20,16,14,0.3)'; g.beginPath(); g.ellipse(s.x - 2, s.y + 1, 9, 3.6, 0, 0, TAU); g.fill(); continue; }
      const k = s.f > 0 ? Math.min(1, s.f / Ta.BRULE) : 0;
      if (k > 0) { g.fillStyle = 'rgba(30,24,20,' + 0.35 * k + ')'; g.beginPath(); g.ellipse(s.x, s.y + 2, 20, 7.5, 0, 0, TAU); g.fill(); g.globalAlpha = 1 - k * k; const e = 1 - k * 0.45; g.drawImage(IMG[s.v], s.x - 48 * e, s.y - 40 * e + k * 4, 96 * e, 64 * e); g.globalAlpha = 1;
        for (let i = 0; i < 4; i++) { const fx = s.x + (i - 1.5) * 8 * (1 - k * 0.4), h = (13 + Math.sin(t * 17 + i * 2.3) * 5) * Math.sin(Math.min(1, k * 1.25) * Math.PI); g.fillStyle = i % 2 ? '#ff8a1e' : '#ffb432'; g.beginPath(); g.moveTo(fx - 5, s.y); g.quadraticCurveTo(fx - 4, s.y - h * 0.6, fx + Math.sin(t * 11 + i) * 2.5, s.y - h); g.quadraticCurveTo(fx + 4, s.y - h * 0.6, fx + 5, s.y); g.closePath(); g.fill(); }
      } else g.drawImage(IMG[s.v], s.x - 48, s.y - 40); }
  };
  Ta.essai = function (c) { const S = CG.S, p = S.player, s = { tx: Math.floor(p.x / T), ty: Math.floor(p.y / T) + 2, c: c || null, v: 0, f: 0, fini: false }, q = pos(s.tx, s.ty); s.x = q.x; s.y = q.y; Ta.liste().push(s); return s; };
})(window.CG);
