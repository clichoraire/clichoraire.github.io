// Goblin Malin — les scarabées d'or. Certains jours, un ou deux scarabées dorés sont accrochés à des troncs d'arbre, quelque part
// dans la forêt. On les attrape en passant tout près. Au troisième (pas forcément le même jour : on n'en trouve jamais plus de
// deux par jour), la Grande Fée apparaît. C'est une façon de la rencontrer sans hache, au début de la partie.
// Tout est réglable dans CG.Scarabees.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Se = CG.Secrets, T = CG.TILE, TAU = Math.PI * 2; if (!Se) return;
  const Sc = CG.Scarabees = { CHANCE: 0.6, DEUX: 0.45, IL_EN_FAUT: 3, LOIN: 10, ECART: 16, PRES: 30 }; /* CHANCE : par jour, d'en avoir ; DEUX : chance d'en avoir deux plutôt qu'un */
  const monde = () => (CG.Mondes ? CG.Mondes.ici() : 0);
  const pos = q => ({ x: q.x * T + T / 2 + (W.hash(q.y, q.x) - 0.5) * 10, y: q.y * T + T / 2 + 10 }); // le pied du tronc
  Sc.tirer = function () {
    const S = CG.S; let f; try { f = G.firePos(); } catch (e) { return; } const fx = f.x / T, fy = f.y / T, C = [], l = [];
    S.scarab = { day: S.day, n: (S.scarab && S.scarab.n) || 0, l }; if (monde() !== 0 || Math.random() > Sc.CHANCE) return;
    const secrets = (S.secrets && S.secrets.l) || [];
    for (let y = 3; y < CG.MH - 3; y++) for (let x = 3; x < CG.MW - 3; x++) { if (W.tile[W.idx(x, y)] !== W.TREE || !W.walkTile(x, y + 1) || Math.hypot(x - fx, y - fy) < Sc.LOIN) continue;
      let cache = false; for (let dy = 1; dy <= 3 && !cache; dy++) for (let dx = -1; dx <= 1; dx++) if (W.tile[W.idx(x + dx, y + dy)] === W.TREE) { cache = true; break; } if (cache) continue; /* un arbre devant le cacherait */
      try { if (W.reachable && !W.reachable(x, y + 1)) continue; } catch (e) { /* tant pis */ } if (secrets.some(s => s.x === x && s.y === y)) continue; C.push({ x, y }); }
    const n = Math.random() < Sc.DEUX ? 2 : 1;
    for (let i = 0; i < n && C.length; i++) { for (let k = 0; k < 60; k++) { const c = C[Math.floor(Math.random() * C.length)]; if (l.some(o => Math.hypot(o.x - c.x, o.y - c.y) < Sc.ECART) && k < 50) continue; l.push({ x: c.x, y: c.y, pris: false }); break; } }
  };
  Sc.liste = function () { const S = CG.S; if (!S || monde() !== 0) return []; if (!S.scarab || S.scarab.day !== S.day) Sc.tirer(); return S.scarab.l.filter(q => !q.pris && W.tile[W.idx(q.x, q.y)] === W.TREE); };
  const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments); try { if (CG.S && monde() === 0 && (!CG.S.scarab || CG.S.scarab.day !== CG.S.day)) Sc.tirer(); } catch (e) { /* jamais bloquant */ } return r; };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.chambre || R.ko > 0 || R.night || R.cine || CG.UI.modal || monde() !== 0) return; const p = S.player;
    if (R.scarabFee !== undefined) { R.scarabFee -= dt; if (R.scarabFee <= 0) { R.scarabFee = undefined; Se.entrer({ k: 'scarabee', x: Math.floor(p.x / T), y: Math.floor(p.y / T), fait: false }); } return; }
    for (const q of Sc.liste()) { const o = pos(q); if (Math.hypot(o.x - p.x, o.y - p.y) > Sc.PRES) continue;
      q.pris = true; S.scarab.n = (S.scarab.n || 0) + 1; const n = S.scarab.n; G.puff(o.x, o.y - 18, '#ffe36b', 14, 100, 3); CG.sfx(n >= Sc.IL_EN_FAUT ? 'discovery' : 'ok'); G.text(o.x, o.y - 46, '🪲 ' + n + ' / ' + Sc.IL_EN_FAUT, '#ffe36b', true); R.rings.push({ x: o.x, y: o.y - 16, r: 44, life: 0.45, col: '#ffe36b' });
      if (n >= Sc.IL_EN_FAUT) { S.scarab.n = 0; R.scarabFee = 1.1; for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 60 + i * 40, life: 0.5 + i * 0.15, col: '#ffe36b' }); } break; }
  };
  // le scarabée, accroché au tronc : une carapace dorée qui brille de temps en temps, et qui grimpe un tout petit peu
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); if (!CG.S || !CG.R) return;
    for (const q of Sc.liste()) { const o = pos(q); if (!CG.onScreen(o.x, o.y)) continue; const x = o.x + Math.sin(t * 0.7 + q.x) * 1.5, y = o.y - 19 + Math.sin(t * 0.5 + q.y) * 3, tw = Math.pow(Math.max(0, Math.sin(t * 1.6 + q.x * 1.3 + q.y)), 10);
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 0.7 + q.x) * 0.25);
      g.strokeStyle = '#3a2808'; g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); [-1, 1].forEach(s => { for (let i = -1; i <= 1; i++) { g.moveTo(s * 3, i * 2.6); g.lineTo(s * (6.4 + Math.sin(t * 9 + i) * 0.5), i * 3.4 - 0.6); } }); g.moveTo(-1.2, -5); g.lineTo(-2.6, -7.6); g.moveTo(1.2, -5); g.lineTo(2.6, -7.6); g.stroke(); /* les pattes, les antennes */
      g.fillStyle = '#8a5a10'; g.beginPath(); g.ellipse(0, -4.2, 2.6, 2, 0, 0, TAU); g.fill(); /* la tête */
      const gr = g.createLinearGradient(-4, -4, 4, 5); gr.addColorStop(0, '#fff0a0'); gr.addColorStop(0.45, '#f2c030'); gr.addColorStop(1, '#b87a10'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0.6, 4.4, 5.4, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(90,50,0,0.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -4.4); g.lineTo(0, 5.8); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(-1.6, -1.4, 1, 1.8, -0.3, 0, TAU); g.fill();
      if (tw > 0.02) { g.globalAlpha = tw; g.strokeStyle = '#fffbe0'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-7, -1); g.lineTo(7, -1); g.moveTo(0, -8); g.lineTo(0, 6); g.stroke(); g.fillStyle = 'rgba(255,240,150,0.5)'; g.beginPath(); g.arc(0, -1, 7, 0, TAU); g.fill(); }
      g.restore(); }
  };
  // un scarabée d'or trouvé ailleurs que sur un tronc (sous un rocher qu'on casse, rochemine.js) : il compte comme les autres
  Sc.ROCHER = 0.05;
  Sc.trouver = function (x, y) { const S = CG.S, R = CG.R, p = S.player; if (monde() !== 0) return false; Sc.liste(); if (!S.scarab) return false;
    S.scarab.n = (S.scarab.n || 0) + 1; const n = S.scarab.n; G.puff(x, y - 18, '#ffe36b', 14, 100, 3); CG.sfx(n >= Sc.IL_EN_FAUT ? 'discovery' : 'ok'); G.text(x, y - 46, '🪲 Un scarabée d\'or ! ' + n + ' / ' + Sc.IL_EN_FAUT, '#ffe36b', true); R.rings.push({ x, y: y - 16, r: 44, life: 0.45, col: '#ffe36b' });
    if (n >= Sc.IL_EN_FAUT) { S.scarab.n = 0; R.scarabFee = 1.1; for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 60 + i * 40, life: 0.5 + i * 0.15, col: '#ffe36b' }); } return true; };
  Sc.essai = function (n) { const S = CG.S, p = S.player; Sc.liste(); S.scarab.l = []; for (let d = 1; d < 30 && S.scarab.l.length < (n || 1); d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { const x = Math.floor(p.x / T) + dx, y = Math.floor(p.y / T) + dy; if (S.scarab.l.length < (n || 1) && W.inMap(x, y) && W.tile[W.idx(x, y)] === W.TREE && W.walkTile(x, y + 1) && !S.scarab.l.some(o => o.x === x && o.y === y)) S.scarab.l.push({ x, y, pris: false }); } return S.scarab.l; }; // pour les essais
})(window.CG);
