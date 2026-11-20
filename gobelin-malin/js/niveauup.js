// Goblin Malin — quand un gobelin gagne un niveau : un cercle magique doré se trace sous ses pieds et tourne, une colonne de
// lumière monte, des étincelles tournent autour de lui, puis tout éclate en anneaux. Environ trois secondes et demie.
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2, rand = CG.rand; if (!G || !G.gobXp || !CG.Magie) return;
  const Nu = CG.NiveauUp = { DUREE: 3.4, ECLAT: 2.6, R: 36, SQ: 0.6, TEXTE: 24 };
  const clamp01 = v => Math.max(0, Math.min(1, v)), doux = k => k * k * (3 - 2 * k);
  Nu.lancer = function (g) { const R = CG.R; if (!R) return; const l = R.ups || (R.ups = []); if (l.some(u => u.g === g)) return; l.push({ g, t: 0, eclat: false, seed: Math.random() * 10, niv: g.lvl }); if (CG.onScreen(g.x, g.y)) CG.sfx('gobNiveau'); };
  const gx0 = G.gobXp; G.gobXp = function (g) { const n = g && g.lvl, r = gx0.apply(this, arguments); if (g && g.lvl > n) Nu.lancer(g); return r; };
  const vu = u => !u.g.hidden && !u.g.dead && CG.onScreen(u.g.x, u.g.y);
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, l = R && R.ups; if (!l || !l.length) return;
    for (const u of l) { u.t += dt; const g = u.g; if (!vu(u)) continue;
      if (u.t < Nu.ECLAT && Math.random() < dt * 22) { const a = Math.random() * TAU, d = rand(6, Nu.R); R.parts.push({ x: g.x + Math.cos(a) * d, y: g.y + Math.sin(a) * d * Nu.SQ, vx: 0, vy: -rand(40, 90), life: rand(0.6, 1), max: 1, col: Math.random() < 0.3 ? '#ffffff' : '#ffe36b', size: rand(1.6, 3), float: true }); } // des paillettes qui montent du cercle
      if (!u.eclat && u.t >= Nu.ECLAT) { u.eclat = true; // l'éclat final
        for (let i = 0; i < 3; i++) R.rings.push({ x: g.x, y: g.y - 6, r: 50 + i * 38, life: 0.4 + i * 0.14, col: i === 1 ? '#ffffff' : '#ffe36b' });
        for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, v = rand(90, 170); R.parts.push({ x: g.x, y: g.y - 22, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - 30, life: rand(0.5, 0.8), max: 0.8, col: i % 3 ? '#ffe36b' : '#fff8d8', size: rand(2.5, 4.5), float: true }); }
        CG.sfx('ok'); } }
    R.ups = l.filter(u => u.t < Nu.DUREE && !u.g.dead);
  };
  // l'enveloppe du temps : le cercle se trace, tient, puis s'efface après l'éclat
  const force = t => t < 0.5 ? doux(t / 0.5) : t < Nu.ECLAT ? 1 : clamp01(1 - (t - Nu.ECLAT) / (Nu.DUREE - Nu.ECLAT));
  // ---------- au sol : le cercle magique ----------
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (c, t) {
    gr0.apply(this, arguments); const R = CG.R, l = R && R.ups; if (!l || !l.length) return;
    for (const u of l) { if (!vu(u)) continue; const g = u.g, k = force(u.t), r = Nu.R * (0.35 + 0.65 * doux(clamp01(u.t / 0.6))) * (u.t > Nu.ECLAT ? 1 + (u.t - Nu.ECLAT) * 0.5 : 1), rot = u.t * 1.5 + u.seed, trace = clamp01(u.t / 0.7);
      c.save(); c.translate(g.x, g.y + 2); c.scale(1, Nu.SQ); c.globalCompositeOperation = 'lighter';
      const h = c.createRadialGradient(0, 0, 0, 0, 0, r * 1.5); h.addColorStop(0, 'rgba(255,236,150,' + 0.38 * k + ')'); h.addColorStop(0.6, 'rgba(255,200,80,' + 0.16 * k + ')'); h.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = h; c.beginPath(); c.arc(0, 0, r * 1.5, 0, TAU); c.fill();
      c.globalAlpha = k; c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = '#ffe9a0'; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, r, rot, rot + TAU * trace); c.stroke(); // l'anneau du dehors, qui se trace
      c.strokeStyle = '#fff6d0'; c.lineWidth = 1.3; c.beginPath(); c.arc(0, 0, r * 0.78, -rot, -rot + TAU * trace); c.stroke();
      if (trace >= 1) { const a = clamp01((u.t - 0.7) / 0.4); c.globalAlpha = k * a;
        c.strokeStyle = '#ffd84a'; c.lineWidth = 1.6; for (let j = 0; j < 2; j++) { c.beginPath(); for (let i = 0; i <= 3; i++) { const an = rot + j * Math.PI / 3 + i / 3 * TAU, x = Math.cos(an) * r * 0.78, y = Math.sin(an) * r * 0.78; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); } // l'étoile à six branches
        c.strokeStyle = '#fff6d0'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, r * 0.36, 0, TAU); c.stroke();
        c.fillStyle = '#fff3b8'; for (let i = 0; i < 8; i++) { const an = -rot * 1.4 + i / 8 * TAU, x = Math.cos(an) * r * 0.89, y = Math.sin(an) * r * 0.89; c.save(); c.translate(x, y); c.rotate(an); c.fillRect(-1.2, -3.2, 2.4, 6.4); if (i % 2) { c.fillRect(-3, -1, 6, 2); } c.restore(); } // les petites runes entre les deux anneaux
        const p = 0.5 + Math.sin(u.t * 9) * 0.5; c.globalAlpha = k * a * (0.25 + p * 0.3); c.strokeStyle = '#ffffff'; c.lineWidth = 3.5; c.beginPath(); c.arc(0, 0, r * (1.04 + p * 0.05), 0, TAU); c.stroke(); }
      c.restore(); }
  };
  // ---------- par-dessus : la colonne de lumière et les étincelles qui tournent ----------
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (c, t) {
    mk0.apply(this, arguments); const R = CG.R, l = R && R.ups; if (!l || !l.length) return;
    for (const u of l) { if (!vu(u)) continue; const g = u.g, k = force(u.t), monte = doux(clamp01((u.t - 0.4) / 0.9)), H = 150 * monte, flash = u.t >= Nu.ECLAT ? clamp01(1 - (u.t - Nu.ECLAT) / 0.35) : 0;
      c.save(); c.globalCompositeOperation = 'lighter';
      if (H > 2) { const w = 15 + Math.sin(u.t * 7) * 1.5 + flash * 10, col = c.createLinearGradient(0, g.y, 0, g.y - H); col.addColorStop(0, 'rgba(255,232,140,' + (0.34 + flash * 0.3) * k + ')'); col.addColorStop(0.6, 'rgba(255,240,180,' + 0.16 * k + ')'); col.addColorStop(1, 'rgba(255,240,180,0)');
        c.fillStyle = col; c.beginPath(); c.moveTo(g.x - w, g.y); c.lineTo(g.x - w * 0.55, g.y - H); c.lineTo(g.x + w * 0.55, g.y - H); c.lineTo(g.x + w, g.y); c.closePath(); c.fill();
        const cur = c.createLinearGradient(0, g.y, 0, g.y - H * 0.8); cur.addColorStop(0, 'rgba(255,255,240,' + (0.3 + flash * 0.4) * k + ')'); cur.addColorStop(1, 'rgba(255,255,240,0)'); c.fillStyle = cur; c.fillRect(g.x - w * 0.3, g.y - H * 0.8, w * 0.6, H * 0.8); }
      if (u.t > 0.5 && u.t < Nu.ECLAT + 0.2) for (let i = 0; i < 7; i++) { const q = (u.t * 0.55 + i / 7) % 1, an = u.t * 5 + i * 1.9, x = g.x + Math.cos(an) * (22 - q * 8), y = g.y - 4 - q * 74 + Math.sin(an) * 5; c.globalAlpha = k * Math.sin(q * Math.PI); c.fillStyle = i % 2 ? '#ffffff' : '#ffe36b'; c.beginPath(); c.arc(x, y, 2.2 - q, 0, TAU); c.fill(); } // la spirale d'étincelles
      if (flash > 0) { c.globalAlpha = flash * 0.7; const f = c.createRadialGradient(g.x, g.y - 22, 0, g.x, g.y - 22, 70); f.addColorStop(0, 'rgba(255,255,235,1)'); f.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = f; c.beginPath(); c.arc(g.x, g.y - 22, 70, 0, TAU); c.fill(); }
      c.restore();
      /* en gros au-dessus de sa tête : « Niveau N ». Il surgit en rebondissant, tient, grossit un peu à l'éclat, puis s'efface en montant */
      { const a = clamp01((u.t - 0.35) / 0.3), fin = u.t > Nu.ECLAT + 0.25 ? clamp01(1 - (u.t - Nu.ECLAT - 0.25) / (Nu.DUREE - Nu.ECLAT - 0.25)) : 1; if (a > 0 && fin > 0) {
        const pop = a < 1 ? 0.4 + 0.6 * a + Math.sin(a * Math.PI) * 0.35 : 1 + flash * 0.18, y = g.y - 84 - doux(clamp01(u.t / Nu.DUREE)) * 12 - (1 - fin) * 10, txt = 'Niveau ' + (u.niv || g.lvl);
        c.save(); c.translate(g.x, y); c.scale(pop, pop); c.globalAlpha = Math.min(1, a * 1.5) * fin; c.font = '900 ' + Nu.TEXTE + 'px "Trebuchet MS", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
        c.strokeStyle = 'rgba(60,34,6,0.92)'; c.lineWidth = 5; c.strokeText(txt, 0, 0); const gd = c.createLinearGradient(0, -Nu.TEXTE / 2, 0, Nu.TEXTE / 2); gd.addColorStop(0, '#fffbe0'); gd.addColorStop(0.55, '#ffe36b'); gd.addColorStop(1, '#f0a82a'); c.fillStyle = gd; c.fillText(txt, 0, 0);
        c.restore(); } } }
  };
})(window.CG);
