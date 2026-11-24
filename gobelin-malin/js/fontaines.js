// Goblin Malin — de petites merveilles posées dans le monde, certains jours seulement (un nouveau tirage chaque matin, par monde) :
//   la fontaine de mana et la fontaine de vie : on y boit une seule fois (E), elle rend tout le mana ou toute la vie, puis elle
//     reste vide (plus d'eau, plus de jet, plus de lueur) ;
//   l'oasis : une mare de deux cases sur deux, des palmiers et des fleurs autour. Le chef peut y entrer : l'eau lui monte à la
//     bedaine, et il regagne OASIS.DON de vie et de mana toutes les OASIS.MINUTES minutes du jeu tant qu'il y reste.
// D'autres fichiers ajoutent leurs propres merveilles (gloutonne.js) : CG.Decors.SORTES[k] = { chance, marge, sol, draw, label, agir }.
// Rien ne les annonce. Tout se règle dans CG.Decors.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  const De = CG.Decors = { LOIN: 14, ECART: 10, PRES: 58, SORTES: {}, OASIS: { DON: 5, MINUTES: 5, RX: 44, RY: 30, FOND: 3 }, TAILLE: 1.3, VIDE: 0.9 };
  De.liste = () => { const S = CG.S; return S && !S.arene && S.decors && S.decors.jour === S.day ? S.decors.l : []; };
  De.pos = d => (d.k === 'oasis' ? { x: (d.x + 1) * T, y: (d.y + 1) * T } : { x: d.x * T + T / 2, y: d.y * T + T / 2 });
  // ---------- où les poser : de l'herbe libre, loin du village, où le chef peut aller à pied ----------
  function libre(x, y, m, l) {
    const S = CG.S; if (x - m < 3 || y - m < 3 || x + m > CG.MW - 4 || y + m > CG.MH - 4) return false; if (Math.hypot(x - W.CX, y - W.CY) < De.LOIN) return false;
    for (let dy = -m; dy <= m; dy++) for (let dx = -m; dx <= m; dx++) { const t = W.tile[W.idx(x + dx, y + dy)]; if ((t !== W.GRASS && t !== W.CLEAR) || !W.walkTile(x + dx, y + dy)) return false; }
    if ((W.nodes || []).some(n => !n.gone && Math.abs(n.x - x) <= m + 1 && Math.abs(n.y - y) <= m + 1)) return false;
    if (S.buildings.some(b => x + m >= b.tx - 2 && x - m <= b.tx + b.w + 1 && y + m >= b.ty - 2 && y - m <= b.ty + b.h + 1)) return false;
    if ((W.sites || []).some(s => Math.hypot(s.x - x, s.y - y) < (s.r || 3) + m + 3) || (S.camps || []).some(c => Math.hypot(c.x - x, c.y - y) < 7 + m)) return false;
    if (l.some(d => Math.hypot(d.x - x, d.y - y) < De.ECART)) return false;
    if (CG.R && (CG.R.chests || []).some(c => Math.hypot(c.x / T - x, c.y / T - y) < m + 4)) return false;
    try { if (W.reachable && !W.reachable(x, y)) return false; } catch (e) { /* rien */ } return true;
  }
  De.trouver = function (m, l) { for (let i = 0; i < 500; i++) { const x = CG.irand(4, CG.MW - 5), y = CG.irand(4, CG.MH - 5); if (libre(x, y, m, l)) return { x, y }; } return null; };
  De.tirer = function (force) { const S = CG.S, l = []; S.decors = { jour: S.day, l };
    Object.keys(De.SORTES).forEach(k => { const s = De.SORTES[k]; if (!(force && force.includes(k)) && Math.random() >= s.chance) return; const q = De.trouver(s.marge || 1, l); if (q) l.push({ k, x: q.x, y: q.y, seed: Math.random() * 100 }); }); return l; };
  De.ici = function (k) { const S = CG.S, p = S.player, tx = Math.floor(p.x / T), ty = Math.floor(p.y / T); if (!S.decors || S.decors.jour !== S.day) S.decors = { jour: S.day, l: [] }; for (let r = 2; r < 12; r++) for (let i = 0; i < 40; i++) { const x = tx + CG.irand(-r, r), y = ty + CG.irand(-r, r), m = De.SORTES[k].marge || 1; if (x - m < 2 || y - m < 2 || x + m > CG.MW - 3 || y + m > CG.MH - 3) continue; let ok = Math.hypot(x - tx, y - ty) > m + 1.5; for (let dy = -m; dy <= m && ok; dy++) for (let dx = -m; dx <= m; dx++) if (!W.walkTile(x + dx, y + dy)) { ok = false; break; } if (ok) { const d = { k, x, y, seed: Math.random() * 100 }; S.decors.l.push(d); return d; } } return null; }; /* pour les essais : en pose une tout près du chef */
  // ---------- les fontaines ----------
  const F = { fMana: { nom: 'fontaine de mana', eau: ['#3f9bff', '#9ad6ff', '#e4f5ff'], ic: '💧', lueur: 'rgba(90,170,255,' }, fVie: { nom: 'fontaine de vie', eau: ['#f0486c', '#ff9ab0', '#ffe6ec'], ic: '❤', lueur: 'rgba(255,90,120,' } };
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  function fontaine(g, d, t) {
    const c = De.pos(d), x = c.x, y = c.y + 6, f = F[d.k], R = CG.R, niv = d.vide ? (d.videT && R.t - d.videT < De.VIDE ? 1 - (R.t - d.videT) / De.VIDE : 0) : 1, vide = niv <= 0;
    ell(g, x, y + 5, 27, 9, 'rgba(0,0,0,0.25)');
    if (!vide) { const a = (0.16 + Math.sin(t * 2.4 + d.seed) * 0.05) * niv; ell(g, x, y - 12, 44, 30, f.lueur + a + ')'); }
    g.fillStyle = vide ? '#6d6a64' : '#8f8c86'; g.beginPath(); g.moveTo(x - 24, y - 6); g.quadraticCurveTo(x - 22, y + 7, x - 12, y + 8); g.lineTo(x + 12, y + 8); g.quadraticCurveTo(x + 22, y + 7, x + 24, y - 6); g.closePath(); g.fill(); /* la vasque */
    g.fillStyle = 'rgba(0,0,0,0.14)'; g.beginPath(); g.moveTo(x + 4, y - 6); g.lineTo(x + 24, y - 6); g.quadraticCurveTo(x + 22, y + 7, x + 12, y + 8); g.lineTo(x + 6, y + 8); g.closePath(); g.fill();
    ell(g, x, y - 6, 24, 8, vide ? '#7d7a74' : '#a9a69f'); ell(g, x, y - 6, 20, 6.2, vide ? '#3d3b38' : '#55524d');
    if (niv > 0) { ell(g, x, y - 6 + (1 - niv) * 3, 20 * (0.55 + niv * 0.45), 6.2 * (0.55 + niv * 0.45), f.eau[0]); g.globalAlpha = niv; ell(g, x - 5 + Math.sin(t * 1.6 + d.seed) * 3, y - 7, 8, 2, f.eau[1]); g.globalAlpha = 1; }
    else { g.strokeStyle = 'rgba(20,18,16,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 9, y - 8); g.lineTo(x - 4, y - 5); g.lineTo(x - 7, y - 3); g.moveTo(x + 6, y - 9); g.lineTo(x + 10, y - 5); g.stroke(); ell(g, x + 3, y - 4.5, 3.2, 1.3, '#8a6a34'); /* une fissure, une feuille morte */ }
    g.fillStyle = vide ? '#77746e' : '#9a9790'; g.fillRect(x - 3.5, y - 27, 7, 22); ell(g, x, y - 27, 8.5, 3.2, vide ? '#85827c' : '#b3b0a9'); ell(g, x, y - 27.5, 6, 2, vide ? '#3d3b38' : f.eau[0]); /* la colonne et sa coupe */
    if (niv > 0) { g.globalAlpha = niv; g.strokeStyle = f.eau[1]; g.lineWidth = 2.2; g.lineCap = 'round';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, y - 29); g.quadraticCurveTo(x + s * 9, y - 40 - niv * 3, x + s * 14, y - 8); g.stroke(); }
      g.strokeStyle = f.eau[2]; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y - 29); g.lineTo(x, y - 37 - Math.sin(t * 9 + d.seed) * 1.5); g.stroke();
      for (let i = 0; i < 4; i++) { const k = (t * 0.7 + i / 4 + d.seed) % 1; g.globalAlpha = (1 - k) * niv; ell(g, x + Math.sin(i * 2.3 + d.seed) * 17, y - 12 - k * 30, 1.6, 1.6, f.eau[2]); }
      g.globalAlpha = 1; }
  }
  function boire(d) {
    const S = CG.S, R = CG.R, p = S.player, f = F[d.k], vie = d.k === 'fVie'; if (d.vide) return;
    if (vie ? p.hp >= p.maxhp : p.mp >= p.maxmp) { CG.sfx('no'); G.text(p.x, p.y - 60, vie ? 'Ta vie est déjà pleine' : 'Ton mana est déjà plein', '#e8e0d0'); return; }
    const n = Math.ceil(vie ? p.maxhp - p.hp : p.maxmp - p.mp); if (vie) p.hp = p.maxhp; else p.mp = p.maxmp; d.vide = true; d.videT = R.t; const c = De.pos(d);
    G.text(p.x, p.y - 74, '+' + n + ' ' + f.ic, f.eau[1], true); G.puff(c.x, c.y - 14, f.eau[1], 26, 170, 4); G.puff(p.x, p.y - 22, f.eau[2], 16, 120, 3); for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 40 + i * 30, life: 0.45 + i * 0.15, col: f.eau[1] });
    G.banner(vie ? '❤ Fontaine de vie' : '💧 Fontaine de mana', vie ? 'Toute ta vie est revenue.' : 'Tout ton mana est revenu.', f.eau[2]); CG.sfx('heal');
  }
  ['fMana', 'fVie'].forEach(k => { De.SORTES[k] = { chance: 0.3, marge: 1, solide: 25, draw: (g, d, t) => { const c = De.pos(d); g.save(); g.translate(c.x, c.y + 14); g.scale(De.TAILLE, De.TAILLE); g.translate(-c.x, -c.y - 14); try { fontaine(g, d, t); } finally { g.restore(); } }, label: d => (d.vide ? null : 'Boire à la ' + F[k].nom + ' ' + F[k].ic), agir: boire }; });
  // ---------- l'oasis ----------
  const O = De.OASIS; let palmes = null;
  function palmier(v) { const K = 2, c = document.createElement('canvas'); c.width = 130 * K; c.height = 150 * K; const g = c.getContext('2d'); g.scale(K, K); const bx = 65, by = 144, dev = v ? 14 : -12, tx = bx + dev, ty = 52;
    g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const k = i / 9, k2 = (i + 1) / 9, x1 = bx + dev * k * k, x2 = bx + dev * k2 * k2, y1 = by - (by - ty) * k, y2 = by - (by - ty) * k2; g.strokeStyle = i % 2 ? '#8a6238' : '#9c7244'; g.lineWidth = 11 - k * 4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    const feuille = (an, L, col) => { const ex = tx + Math.cos(an) * L, ey = ty + Math.sin(an) * L * 0.75 + L * 0.34, mx = tx + Math.cos(an) * L * 0.55, my = ty + Math.sin(an) * L * 0.5 - L * 0.26; g.fillStyle = col; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my - 7, ex, ey); g.quadraticCurveTo(mx, my + 9, tx, ty); g.closePath(); g.fill(); };
    [[-2.9, 52, '#2f7a34'], [-0.25, 52, '#2f7a34'], [-2.3, 56, '#3c9440'], [-0.85, 56, '#3c9440'], [3.5, 46, '#368a3a'], [-0.05 + 0.5, 44, '#368a3a'], [-1.9, 50, '#4fae4c'], [-1.25, 50, '#4fae4c'], [-1.57, 40, '#66c25a']].forEach(q => feuille(q[0], q[1], q[2]));
    for (const q of [[-4, 3], [4, 4], [0, 6]]) { g.fillStyle = '#6a4424'; g.beginPath(); g.arc(tx + q[0], ty + q[1], 3.6, 0, TAU); g.fill(); } return c; }
  const ARBRES = [[-1.5, -1.05, 0], [1.45, -0.9, 1], [-1.85, 0.35, 1], [1.9, 0.5, 0], [0.1, -1.4, 0]]; /* en cases, autour de la mare */
  const dansEau = (d, x, y) => { const c = De.pos(d), dx = (x - c.x) / O.RX, dy = (y - c.y) / O.RY; return 1 - Math.sqrt(dx * dx + dy * dy); };
  De.bain = function () { const p = CG.S.player; let best = 0; for (const d of De.liste()) if (d.k === 'oasis') best = Math.max(best, dansEau(d, p.x, p.y - 2)); return CG.clamp(best / 0.3, 0, 1); }; /* 0 : au sec ; 1 : de l'eau jusqu'à la bedaine */
  function mare(g, d, t) { const c = De.pos(d), FL = ['#ff7ab0', '#ffe36b', '#ffffff', '#c89aff', '#ff9a5a'];
    ell(g, c.x, c.y + 2, O.RX + 26, O.RY + 20, 'rgba(96,170,72,0.5)'); ell(g, c.x, c.y + 2, O.RX + 9, O.RY + 8, '#d9c88a'); ell(g, c.x, c.y + 2, O.RX + 3, O.RY + 4, '#c8b474');
    ell(g, c.x, c.y, O.RX, O.RY, '#2f8fd0'); ell(g, c.x, c.y + 3, O.RX - 7, O.RY - 7, '#3fa6e0'); ell(g, c.x - 2, c.y + 5, O.RX - 18, O.RY - 15, '#58bdf0');
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.2; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const k = (t * 0.22 + i / 4 + d.seed) % 1, x = c.x + Math.sin(i * 2.7 + d.seed) * (O.RX - 16), y = c.y + Math.cos(i * 1.9 + d.seed) * (O.RY - 12); g.globalAlpha = Math.sin(k * Math.PI) * 0.7; g.beginPath(); g.moveTo(x - 6, y); g.quadraticCurveTo(x, y - 2, x + 6, y); g.stroke(); } g.globalAlpha = 1;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + W.hash(d.x + i, d.y) * 0.5, r = 1.2 + W.hash(d.y, d.x + i) * 0.34, x = c.x + Math.cos(a) * (O.RX + 4) * r, y = c.y + 2 + Math.sin(a) * (O.RY + 6) * r, col = FL[i % FL.length], bal = Math.sin(t * 2 + i) * 0.6;
      g.strokeStyle = '#3f8a3a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y + 5); g.lineTo(x + bal, y); g.stroke(); for (let q = 0; q < 5; q++) ell(g, x + bal + Math.cos(q * 1.257) * 2.3, y + Math.sin(q * 1.257) * 2.3, 1.7, 1.7, col); ell(g, x + bal, y, 1.2, 1.2, '#ffd23a'); }
    for (let i = 0; i < 3; i++) { const a = 2.2 + i * 0.45, x = c.x + Math.cos(a) * (O.RX - 3), y = c.y + Math.sin(a) * (O.RY - 2); ell(g, x, y, 6, 3, '#3f9a4a'); ell(g, x + 1, y - 0.5, 2, 1, '#2f8fd0'); } /* des nénuphars */
  }
  De.SORTES.oasis = { chance: 0.22, marge: 2, sol: mare, draw: null, label: () => null };
  let bainT = 0, eclT = 0;
  // ---------- chaque instant ----------
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !S.player || S.arene) return r; const p = S.player;
    if ((!S.decors || S.decors.jour !== S.day) && !R.night && !R.cine) { try { De.tirer(); } catch (e) { S.decors = { jour: S.day, l: [] }; } }
    for (const d of De.liste()) { const s = De.SORTES[d.k]; if (!s || !s.solide) continue; const c = De.pos(d), dx = p.x - c.x, dy = p.y - (c.y + 6), q = Math.hypot(dx, dy * 1.5); if (q < s.solide && q > 0.01) { const nx = c.x + dx / q * s.solide, ny = c.y + 6 + dy * 1.5 / q * s.solide / 1.5; if (W.walkPx(nx, ny)) { p.x = nx; p.y = ny; } } } /* on ne traverse pas une fontaine */
    const b = De.bain(); if (b <= 0 || R.ko > 0) { bainT = 0; return r; }
    bainT += dt / (D.HOUR || 28) * 60; if (p.moving) { eclT -= dt; if (eclT <= 0) { eclT = 0.16; R.parts.push({ x: p.x + rand(-9, 9), y: p.y - 4 - b * O.FOND, vx: rand(-26, 26), vy: rand(-46, -20), life: 0.35, max: 0.35, col: '#d8f2ff', size: 2 }); } }
    if (bainT >= O.MINUTES) { bainT -= O.MINUTES; const v = p.hp < p.maxhp, m = p.mp < p.maxmp; p.hp = Math.min(p.maxhp, p.hp + O.DON); p.mp = Math.min(p.maxmp, p.mp + O.DON); if (v || m) { G.text(p.x, p.y - 62, (v ? '+' + O.DON + ' ❤ ' : '') + (m ? '+' + O.DON + ' 💧' : ''), '#bff0ff'); R.rings.push({ x: p.x, y: p.y - 6, r: 30, life: 0.4, col: '#9ad6ff' }); } }
    return r;
  };
  // ---------- parler, boire (touche E) ----------
  const pres = () => { const R = CG.R; if (!R || R.ko > 0 || R.cine || R.build) return null; const p = CG.S.player; let best = null, bd = De.PRES; for (const d of De.liste()) { const s = De.SORTES[d.k]; if (!s || !s.label) continue; const c = De.pos(d), q = Math.hypot(p.x - c.x, p.y - c.y); if (q < bd) { const l = s.label(d); if (l) { bd = q; best = { d, l, c }; } } } return best; };
  { const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it || CG.S.arene) return it; const q = pres(); return q ? { type: 'decor', obj: { x: q.c.x, y: q.c.y - 46 }, decor: q.d, label: q.l } : it; };
    const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'decor') { const s = De.SORTES[it.decor.k]; if (s && s.agir) s.agir(it.decor); return; } return in0.apply(this, arguments); }; }
  // ---------- les dessins ----------
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); for (const d of De.liste()) { const s = De.SORTES[d.k], c = De.pos(d); if (s && s.sol && CG.onScreen(c.x, c.y)) s.sol(g, d, t); } }; }
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments);
    for (const d of De.liste()) { const s = De.SORTES[d.k], c = De.pos(d); if (!s || !CG.onScreen(c.x, c.y)) continue;
      if (s.draw) push(c.y + 8, 21, { x: c.x, y: c.y, d, draw(g, o, t) { De.SORTES[o.d.k].draw(g, o.d, t); } }, null);
      if (d.k === 'oasis') { if (!palmes) palmes = [palmier(0), palmier(1)]; ARBRES.forEach((a, i) => { const x = c.x + a[0] * T, y = c.y + a[1] * T; push(y, 21, { x, y, i, v: a[2], seed: d.seed, draw(g, o, t) { const s2 = 0.92 + W.hash(o.i, Math.floor(o.seed)) * 0.22; ell(g, o.x, o.y + 1, 15, 5, 'rgba(0,0,0,0.24)'); g.save(); g.translate(o.x, o.y); g.rotate(Math.sin(t * 0.9 + o.i * 1.7) * 0.018); g.drawImage(palmes[o.v], -65 * s2, -144 * s2, 130 * s2, 150 * s2); g.restore(); } }, null); }); } } }; }
  // le chef dans l'eau : il s'enfonce, on ne voit plus ses jambes, et l'eau fait des ronds autour de lui
  { const ag0 = Art.goblin; Art.goblin = function (g, o) { const S = CG.S; if (!o || !o.chief || !S || !CG.R || o.x !== S.player.x || S.arene) return ag0.apply(this, arguments); const b = De.bain(); if (b <= 0) return ag0.apply(this, arguments);
      const a = Array.prototype.slice.call(arguments), fond = b * O.FOND, wl = o.y - 1; a[1] = Object.assign({}, o, { y: o.y + fond }); g.save(); g.beginPath(); g.rect(o.x - 70, o.y - 160, 140, 160 + (wl - o.y)); g.clip(); try { ag0.apply(this, a); } finally { g.restore(); }
      const t = o.t || 0; ell(g, o.x, wl + 0.6, 11, 2.6, 'rgba(88,189,240,0.9)'); g.strokeStyle = '#e4f5ff'; g.lineWidth = 1.3; for (let i = 0; i < 2; i++) { const k = (t * 0.9 + i / 2) % 1; g.globalAlpha = (1 - k) * 0.75; g.beginPath(); g.ellipse(o.x, wl, 11 + k * 11, 3.4 + k * 3.6, 0, 0, TAU); g.stroke(); } g.globalAlpha = 1; }; }
})(window.CG);
