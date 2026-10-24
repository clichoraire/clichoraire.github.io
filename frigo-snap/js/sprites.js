// Frigo Snap — dessin procédural des créatures (style cartoon, contours épais). Repère local : pieds en (0,0),
// 1 unité = 1 (le contexte est mis à l'échelle avant l'appel), y négatif vers le haut.
(function (FS) {
  'use strict';
  const S = FS.Sprites = {};
  const OUT = '#26211f';
  const TAU = Math.PI * 2;
  const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

  // ---- petits utilitaires de dessin
  function path(ctx, fill, lw) { ctx.fillStyle = fill; ctx.fill(); if (lw !== 0) { ctx.lineWidth = lw || 0.06; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke(); } }
  function circle(ctx, x, y, r, fill, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); path(ctx, fill, lw); }
  function ellipse(ctx, x, y, rx, ry, fill, lw, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); path(ctx, fill, lw); }
  function rrect(ctx, x, y, w, h, r, fill, lw) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); path(ctx, fill, lw); }
  // yeux : v = vue (0 face), closed = fermés, k = écartement
  function eyes(ctx, x, y, r, v, o) {
    o = o || {}; const dx = Math.sin(v) * r * 1.4; const k = o.gap == null ? r * 1.6 : o.gap;
    for (const s of (o.one ? [0] : [-1, 1])) {
      const ex = x + s * k + dx;
      if (o.closed) { ctx.beginPath(); ctx.moveTo(ex - r * 0.7, y); ctx.quadraticCurveTo(ex, y + r * 0.6, ex + r * 0.7, y); ctx.lineWidth = 0.05; ctx.strokeStyle = OUT; ctx.stroke(); continue; }
      circle(ctx, ex, y, r, '#fff', 0.04);
      circle(ctx, ex + Math.sin(v) * r * 0.45 + (o.look || 0) * r * 0.3, y + (o.lookY || 0) * r * 0.3, r * (o.wide ? 0.62 : 0.5), OUT, 0);
      circle(ctx, ex + Math.sin(v) * r * 0.45 - r * 0.18, y - r * 0.2, r * 0.16, '#fff', 0);
    }
  }
  function mouth(ctx, x, y, w, open, smile) {
    ctx.beginPath();
    if (open > 0.05) { ctx.ellipse(x, y, w, open, 0, 0, TAU); path(ctx, '#5a1e1e', 0.04); }
    else { ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + (smile == null ? 0.12 : smile), x + w, y); ctx.lineWidth = 0.05; ctx.strokeStyle = OUT; ctx.stroke(); }
  }
  function zzz(ctx, x, y, t) { ctx.fillStyle = '#5c6bc0'; ctx.font = 'bold 0.35px sans-serif'; for (let i = 0; i < 3; i++) { const p = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = 1 - p; ctx.fillText('z', x + p * 0.5 + i * 0.1, y - p * 0.9 - i * 0.1); } ctx.globalAlpha = 1; }
  function sweat(ctx, x, y, t) { for (let i = 0; i < 3; i++) { const p = (t * 1.5 + i / 3) % 1; ctx.globalAlpha = 1 - p; circle(ctx, x + (i - 1) * 0.3 + Math.sin(i) * 0.1, y - p * 0.6, 0.06, '#64b5f6', 0); } ctx.globalAlpha = 1; }
  function sparkles(ctx, x, y, r, t, color, n) { for (let i = 0; i < (n || 8); i++) { const a = t * 1.5 + i / (n || 8) * TAU, p = ((t * 0.8 + i * 0.37) % 1); const px = x + Math.cos(a) * r * (0.5 + p * 0.8), py = y + Math.sin(a) * r * (0.5 + p * 0.8) * 0.6; ctx.globalAlpha = 1 - p; star(ctx, px, py, 0.1 + 0.08 * (1 - p), color); } ctx.globalAlpha = 1; }
  function star(ctx, x, y, r, color) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? r * 0.4 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
  function musicNotes(ctx, x, y, t) { ctx.fillStyle = '#7e57c2'; ctx.font = 'bold 0.4px sans-serif'; for (let i = 0; i < 3; i++) { const p = (t * 0.7 + i / 3) % 1; ctx.globalAlpha = 1 - p; ctx.fillText(i % 2 ? '♪' : '♫', x + Math.sin(p * 6 + i) * 0.3 + i * 0.25 - 0.3, y - p * 1.2); } ctx.globalAlpha = 1; }
  function shadow(ctx, w) { ctx.beginPath(); ctx.ellipse(0, 0, w, w * 0.3, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill(); }
  function heart(ctx, x, y, r, color) { ctx.beginPath(); ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.3, x - r * 0.6, y - r * 1.4, x, y - r * 0.5); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.3, x, y + r); path(ctx, color, 0.04); }

  // vue relative : 0 = face, ±π = dos ; renvoie {v, flip, back}
  function viewOf(c, cam) { const v = wrap(Math.atan2(cam.x - c.x, cam.z - c.z) - c.yaw); return { v, back: Math.abs(v) > 2.1, side: Math.abs(v) > 1.1, flip: v < 0 ? -1 : 1 }; }
  const bob = (t, a, f) => Math.sin(t * (f || 6)) * (a || 0.05);

  // ================================================================== créatures
  // Chaque fonction : (ctx, c, t, view) ; dessine la créature debout sur (0,0).
  S.cornichon = function (ctx, c, t, V) {
    const walk = c.pose === 'walk' || c.pose === 'special' && false; const hop = c.pose === 'special' ? Math.abs(Math.sin(t * 8)) * 0.1 : walk ? Math.abs(Math.sin(t * 12)) * 0.12 : 0;
    shadow(ctx, 0.35);
    ctx.save(); ctx.translate(0, -hop); if (c.pose === 'hidden') { ctx.globalAlpha = 0.75; ctx.translate(0, 0.35); }
    // corps de cornichon bosselé
    ctx.beginPath(); ctx.moveTo(-0.28, -0.1); ctx.quadraticCurveTo(-0.38, -0.6, -0.2, -1.05); ctx.quadraticCurveTo(0, -1.2, 0.2, -1.05); ctx.quadraticCurveTo(0.38, -0.6, 0.28, -0.1); ctx.quadraticCurveTo(0, 0.02, -0.28, -0.1); path(ctx, '#5c9a3a');
    for (let i = 0; i < 5; i++) circle(ctx, -0.15 + (i * 0.37) % 0.3, -0.3 - i * 0.16, 0.035, '#3f7a28', 0);
    // bandeau de ninja et yeux
    ctx.beginPath(); ctx.rect(-0.33, -0.86, 0.66, 0.16); path(ctx, '#2e2e2e', 0.03);
    ctx.beginPath(); ctx.moveTo(0.3, -0.8); ctx.lineTo(0.55, -0.9 + bob(t, 0.05, 5)); ctx.lineTo(0.5, -0.7); ctx.lineWidth = 0.05; ctx.strokeStyle = '#2e2e2e'; ctx.stroke();
    if (!V.back) eyes(ctx, 0, -0.78, 0.06, V.v, { gap: 0.11, wide: c.pose === 'peek' });
    if (c.pose === 'special') { // salut martial : bras levés, bandeau au vent
      ctx.beginPath(); ctx.moveTo(-0.25, -0.6); ctx.lineTo(-0.5, -0.95); ctx.moveTo(0.25, -0.6); ctx.lineTo(0.5, -0.95); ctx.lineWidth = 0.08; ctx.strokeStyle = '#3f7a28'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 0.3px sans-serif'; ctx.fillText('HAÏ !', -0.3, -1.4 + bob(t, 0.05, 9));
    } else if (c.pose === 'eat') { mouth(ctx, 0, -0.55, 0.08, Math.abs(Math.sin(t * 10)) * 0.06); }
    else if (c.pose === 'react') { sweat(ctx, 0.3, -1.1, t); }
    // petites jambes
    ctx.beginPath(); ctx.moveTo(-0.12, -0.05); ctx.lineTo(-0.15 - Math.sin(t * 12) * (walk ? 0.08 : 0), 0.0); ctx.moveTo(0.12, -0.05); ctx.lineTo(0.15 + Math.sin(t * 12) * (walk ? 0.08 : 0), 0); ctx.lineWidth = 0.07; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.restore();
  };

  S.bocal = function (ctx, c, t, V) {
    const wob = c.pose === 'walk' ? Math.sin(t * 5) * 0.06 : c.pose === 'react' ? Math.sin(t * 40) * 0.03 : 0;
    shadow(ctx, 1.0);
    ctx.save(); ctx.rotate(wob);
    // verre
    ctx.beginPath(); ctx.roundRect(-0.9, -2.1, 1.8, 2.1, 0.25); path(ctx, 'rgba(190,225,200,0.75)');
    // saumure et cornichons dedans
    ctx.save(); ctx.beginPath(); ctx.roundRect(-0.84, -1.75, 1.68, 1.7, 0.2); ctx.clip(); ctx.fillStyle = 'rgba(150,190,80,0.6)'; ctx.fillRect(-1, -1.75, 2, 2);
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(-0.5 + i * 0.33, -0.85 + Math.sin(t * 2 + i) * 0.05); ctx.rotate(0.3 * (i % 2 ? 1 : -1)); ellipse(ctx, 0, 0, 0.14, 0.55, '#6aa843', 0.03); ctx.restore(); }
    ctx.restore();
    // reflet
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.roundRect(-0.7, -1.9, 0.22, 1.5, 0.1); ctx.fill();
    // couvercle (s'envole au secret)
    const lidY = c.pose === 'special' ? -2.1 - Math.min(2.5, c.poseT * 2.5) : -2.1, lidRot = c.pose === 'special' ? c.poseT * 9 : 0;
    ctx.save(); ctx.translate(0, lidY); ctx.rotate(lidRot); ctx.beginPath(); ctx.roundRect(-0.95, -0.3, 1.9, 0.32, 0.08); path(ctx, '#b0bec5'); ctx.fillStyle = '#90a4ae'; ctx.fillRect(-0.95, -0.12, 1.9, 0.06); ctx.restore();
    if (c.pose === 'special') { // fontaine de saumure
      for (let i = 0; i < 14; i++) { const p = (t * 1.3 + i / 14) % 1; const a = (i / 14 - 0.5) * 1.8; ctx.globalAlpha = 1 - p; circle(ctx, Math.sin(a) * p * 1.6, -2.1 - p * 2.2 + p * p * 1.6, 0.1, '#9ccc65', 0); } ctx.globalAlpha = 1;
    }
    if (c.pose === 'react') { // onde sonore
      for (let i = 0; i < 3; i++) { const p = (t * 1.2 + i / 3) % 1; ctx.beginPath(); ctx.arc(0, -2.1, 0.4 + p * 1.2, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = `rgba(255,214,0,${1 - p})`; ctx.lineWidth = 0.06; ctx.stroke(); }
    }
    // visage sur l'étiquette
    ctx.beginPath(); ctx.rect(-0.6, -1.45, 1.2, 0.7); path(ctx, '#fdf6e3', 0.04);
    if (!V.back) { eyes(ctx, 0, -1.2, 0.08, V.v, { gap: 0.25 }); mouth(ctx, Math.sin(V.v) * 0.1, -0.95, 0.15, c.pose === 'special' ? 0.1 : 0, 0.12); }
    ctx.restore();
  };

  S.moisissurex = function (ctx, c, t, V) {
    const dance = c.pose === 'react' && c.vars.dancing, disco = c.pose === 'special', glow = c.pose === 'react' && !c.vars.dancing;
    const sq = dance || disco ? Math.sin(t * 9) * 0.12 : Math.sin(t * 2) * 0.03;
    ctx.save(); ctx.translate(0, 0); ctx.scale(1 + sq, 1 - sq);
    // amas de moisissure : plusieurs cercles
    const cols = ['#5e8f6e', '#7fae8a', '#4d7a5a', '#9bc4a4'];
    const blobs = [[0, -0.5, 0.55], [-0.4, -0.35, 0.35], [0.42, -0.4, 0.38], [-0.2, -0.95, 0.3], [0.25, -1.0, 0.28], [0, -0.2, 0.45]];
    blobs.forEach((b, i) => circle(ctx, b[0] + (dance || disco ? Math.sin(t * 7 + i) * 0.05 : 0), b[1], b[2], disco ? `hsl(${(t * 200 + i * 60) % 360},70%,60%)` : cols[i % 4], 0.05));
    for (let i = 0; i < 9; i++) circle(ctx, Math.sin(i * 2.1) * 0.5, -0.5 + Math.cos(i * 1.7) * 0.4, 0.05, glow || disco ? `hsl(${(t * 300 + i * 40) % 360},90%,70%)` : '#c8e6c9', 0);
    if (!V.back) { eyes(ctx, 0, -0.6, 0.11, V.v, { gap: 0.22, wide: dance || disco }); mouth(ctx, Math.sin(V.v) * 0.1, -0.35, 0.18, dance || disco ? 0.1 : 0, 0.14); }
    if (c.pose === 'peek') { ctx.beginPath(); ctx.moveTo(0.5, -0.5); ctx.quadraticCurveTo(1.0, -0.6, 1.1 + Math.sin(t * 3) * 0.1, -0.3); ctx.lineWidth = 0.16; ctx.strokeStyle = '#5e8f6e'; ctx.lineCap = 'round'; ctx.stroke(); }
    ctx.restore();
    if (dance) musicNotes(ctx, 0.4, -1.3, t);
    if (disco) { sparkles(ctx, 0, -0.6, 1.3, t, '#fff', 12); musicNotes(ctx, -0.6, -1.3, t); }
    if (glow) sparkles(ctx, 0, -0.6, 0.9, t, '#b2ff59', 8);
    if (c.pose === 'react' && !dance && !glow) sweat(ctx, 0.4, -1.2, t);
  };

  function sauceBottle(ctx, c, t, V, col, dark, label, isRex) {
    const walk = c.pose === 'walk', step = walk ? Math.sin(t * 10) : 0, duel = c.pose === 'special';
    shadow(ctx, 0.6);
    ctx.save(); ctx.translate(0, -Math.abs(step) * 0.06);
    // pattes
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 0.25, -0.3); ctx.lineTo(s * 0.3 + s * step * 0.12, 0); ctx.lineTo(s * 0.5 + s * step * 0.12, 0); ctx.lineWidth = 0.12; ctx.strokeStyle = dark; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
    // queue
    ctx.beginPath(); ctx.moveTo(-0.45 * V.flip, -0.6); ctx.quadraticCurveTo(-1.0 * V.flip, -0.5 + Math.sin(t * 4) * 0.1, -1.2 * V.flip, -0.9); ctx.lineWidth = 0.2; ctx.strokeStyle = col; ctx.stroke(); ctx.lineWidth = 0.06; ctx.strokeStyle = OUT; ctx.stroke();
    // bouteille (corps)
    const H = isRex ? 1.9 : 1.6;
    ctx.beginPath(); ctx.roundRect(-0.5, -H, 1.0, H - 0.2, 0.25); path(ctx, col);
    ctx.beginPath(); ctx.rect(-0.42, -H + 0.5, 0.84, 0.6); path(ctx, '#fff8e1', 0.04);
    ctx.fillStyle = dark; ctx.font = 'bold 0.26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, 0, -H + 0.9); ctx.textAlign = 'left';
    // goulot = tête
    ctx.beginPath(); ctx.roundRect(-0.26, -H - 0.45, 0.52, 0.5, 0.1); path(ctx, dark);
    if (!V.back) { eyes(ctx, 0, -H + 0.2, 0.1, V.v, { gap: 0.2, wide: duel }); if (isRex) { ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-0.3 + i * 0.2, -H + 0.42); ctx.lineTo(-0.2 + i * 0.2, -H + 0.42); ctx.lineTo(-0.25 + i * 0.2, -H + 0.55); ctx.fill(); } } }
    // petits bras
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 0.5, -H + 0.9); ctx.lineTo(s * 0.7, -H + 1.1 + (duel ? -0.5 : Math.sin(t * 6 + s) * 0.05)); ctx.lineWidth = 0.1; ctx.strokeStyle = dark; ctx.stroke(); }
    // réactions : jet de sauce
    if (c.pose === 'react' || duel) {
      const dir = duel ? V.flip * -1 : 0; const n = 12;
      for (let i = 0; i < n; i++) { const p = (t * 1.6 + i / n) % 1; ctx.globalAlpha = 1 - p * 0.7; circle(ctx, dir * p * 3 + Math.sin(i) * 0.1, -H - 0.45 - (duel ? p * 1.4 - p * p * 1.2 : p * 1.5) , 0.09 + 0.05 * Math.sin(i), col, 0); }
      ctx.globalAlpha = 1;
      if (!duel && !isRex) { ctx.fillStyle = OUT; ctx.font = 'bold 0.35px sans-serif'; ctx.fillText('ATCHOUM !', -0.4, -H - 0.8); }
    }
    ctx.restore();
  }
  S.ketchup = (ctx, c, t, V) => sauceBottle(ctx, c, t, V, '#d32f2f', '#7f0000', 'KETCHUP', true);
  S.moutarde = (ctx, c, t, V) => sauceBottle(ctx, c, t, V, '#f9c22e', '#8d6e00', 'MOUTARDE', false);

  S.miette = function (ctx, c, t, V) {
    const walk = c.pose === 'walk', bloat = c.pose === 'special';
    shadow(ctx, 0.4);
    ctx.save(); if (walk) ctx.translate(0, -Math.abs(Math.sin(t * 14)) * 0.05);
    const sc = bloat ? 1 + Math.sin(t * 6) * 0.04 : 1; ctx.scale(sc, sc);
    // corps en mie de pain (couleur crème, croûte dorée dessus)
    ellipse(ctx, 0, -0.35, 0.42, 0.32, '#f3e0b5');
    ctx.beginPath(); ctx.ellipse(0, -0.5, 0.4, 0.18, 0, Math.PI, TAU); path(ctx, '#c98a3e', 0.04);
    // tête
    circle(ctx, 0.3 * V.flip, -0.55, 0.22, '#f3e0b5');
    circle(ctx, 0.2 * V.flip, -0.78, 0.1, '#e4c48e'); circle(ctx, 0.42 * V.flip, -0.78, 0.1, '#e4c48e');
    if (!V.back) { eyes(ctx, 0.3 * V.flip, -0.58, 0.05, V.v, { gap: 0.08 }); circle(ctx, 0.5 * V.flip, -0.5, 0.04, '#b71c1c', 0); }
    // queue en ficelle
    ctx.beginPath(); ctx.moveTo(-0.4 * V.flip, -0.3); ctx.quadraticCurveTo(-0.7 * V.flip, -0.6 + Math.sin(t * 5) * 0.1, -0.9 * V.flip, -0.3); ctx.lineWidth = 0.05; ctx.strokeStyle = '#c98a3e'; ctx.stroke();
    if (c.pose === 'eat') { for (let i = 0; i < 4; i++) circle(ctx, 0.5 * V.flip + Math.sin(t * 20 + i) * 0.15, -0.2 + ((t * 2 + i / 4) % 1) * 0.2, 0.03, '#d9a35a', 0); }
    if (bloat) { ctx.fillStyle = '#fff'; ctx.font = 'bold 0.25px sans-serif'; ctx.fillText('~ brioche ~', -0.45, -1.1); sparkles(ctx, 0, -0.4, 0.8, t, '#ffe082', 6); }
    if (c.pose === 'react') sweat(ctx, 0.3, -0.95, t);
    ctx.restore();
  };

  S.oeuf = function (ctx, c, t, V) {
    if (c.pose === 'special') { // Omelette Suprême ailée (seul l'œuf 0 est visible)
      const flap = Math.sin(t * 10) * 0.5;
      ctx.save(); ctx.translate(0, -0.5);
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 0.35, -0.1); ctx.rotate(s * flap * 0.6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.5, -0.5, s * 0.9, -0.1); ctx.quadraticCurveTo(s * 0.5, 0.1, 0, 0.1); path(ctx, '#fffde7'); ctx.restore(); }
      ellipse(ctx, 0, 0, 0.55, 0.3, '#ffca28'); ellipse(ctx, 0, -0.05, 0.42, 0.18, '#ffe082', 0);
      for (let i = 0; i < 5; i++) circle(ctx, -0.3 + i * 0.15, -0.02 + Math.sin(i) * 0.08, 0.04, '#43a047', 0);
      eyes(ctx, 0, -0.08, 0.07, V.v, { gap: 0.15, wide: true }); mouth(ctx, 0, 0.1, 0.1, 0.05);
      sparkles(ctx, 0, 0, 1.0, t, '#fff59d', 8);
      ctx.restore(); return;
    }
    const stage = c.vars.stage || 0, wob = c.pose === 'react' && !stage ? Math.sin(t * 30) * 0.08 : stage === 2 ? Math.sin(t * 50) * 0.04 : 0;
    ctx.save(); ctx.rotate(wob);
    // alvéole
    ctx.beginPath(); ctx.ellipse(0, -0.1, 0.5, 0.2, 0, 0, Math.PI); path(ctx, '#bcaaa4', 0.04);
    ellipse(ctx, 0, -0.5, 0.36, 0.45, '#fbf2dc');
    if (stage >= 1) { ctx.beginPath(); ctx.moveTo(-0.2, -0.6); ctx.lineTo(-0.05, -0.5); ctx.lineTo(0.05, -0.65); ctx.lineTo(0.18, -0.5); ctx.lineWidth = 0.04; ctx.strokeStyle = OUT; ctx.stroke(); eyes(ctx, 0, -0.56, 0.05, V.v, { gap: 0.08, wide: true }); }
    else if (c.pose === 'peek' || c.pose === 'react') { eyes(ctx, 0, -0.6, 0.06, V.v, { gap: 0.11, wide: c.pose === 'react' }); if (c.pose === 'react') mouth(ctx, 0, -0.4, 0.06, 0.05); }
    else if (c.pose === 'sleep') { eyes(ctx, 0, -0.6, 0.06, V.v, { gap: 0.11, closed: true }); if (c.opts.idx % 2 === 0) zzz(ctx, 0.3, -0.9, t + c.opts.idx); }
    if (stage === 2) { for (let i = 0; i < 4; i++) { const p = (t * 1.2 + i / 4) % 1; ctx.globalAlpha = 0.7 * (1 - p); circle(ctx, -0.1 + i * 0.08 + Math.sin(p * 5) * 0.08, -0.95 - p * 0.6, 0.08 + p * 0.1, '#eceff1', 0); } ctx.globalAlpha = 1; }
    ctx.restore();
  };

  S.beurre = function (ctx, c, t, V) {
    const melt = c.vars.melting || c.pose === 'react' && c.vars.melting, sizzle = c.pose === 'special';
    const squash = melt || sizzle ? Math.min(0.45, c.poseT * 0.1) : 0;
    shadow(ctx, 0.8);
    // traînée grasse
    ctx.fillStyle = 'rgba(255,224,130,0.35)'; ctx.beginPath(); ctx.ellipse(-0.9 * V.flip, 0, 0.7, 0.12, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.scale(1 + squash * 0.8, 1 - squash);
    // bloc
    ctx.beginPath(); ctx.roundRect(-0.7, -0.75, 1.4, 0.75, 0.12); path(ctx, '#ffe082');
    ctx.fillStyle = '#fff3c4'; ctx.fillRect(-0.6, -0.68, 1.2, 0.12);
    // antennes de limace
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0.35 * V.flip + s * 0.1, -0.75); ctx.lineTo(0.4 * V.flip + s * 0.18, -1.05 + Math.sin(t * 4 + s) * 0.05); ctx.lineWidth = 0.06; ctx.strokeStyle = '#f9a825'; ctx.stroke(); circle(ctx, 0.4 * V.flip + s * 0.18, -1.05 + Math.sin(t * 4 + s) * 0.05, 0.06, '#fff', 0.03); circle(ctx, 0.4 * V.flip + s * 0.18 + Math.sin(V.v) * 0.02, -1.05 + Math.sin(t * 4 + s) * 0.05, 0.03, OUT, 0); }
    if (!V.back) mouth(ctx, 0.4 * V.flip, -0.3, 0.12, c.pose === 'eat' ? Math.abs(Math.sin(t * 10)) * 0.06 : 0, melt ? -0.1 : 0.1);
    ctx.restore();
    if (melt) { for (let i = 0; i < 6; i++) circle(ctx, -0.7 + i * 0.28, -0.02 + Math.sin(t * 3 + i) * 0.03, 0.08, '#ffd54f', 0); sweat(ctx, 0, -1.1, t); }
    if (sizzle) { for (let i = 0; i < 10; i++) { const p = (t * 2 + i / 10) % 1; ctx.globalAlpha = 1 - p; ellipse(ctx, -0.6 + i * 0.13, -0.6 - p * 0.9, 0.08, 0.2 * (1 - p) + 0.05, i % 2 ? '#ff8f00' : '#ffd600', 0); } ctx.globalAlpha = 1; ctx.fillStyle = OUT; ctx.font = 'bold 0.3px sans-serif'; ctx.fillText('ssssss…', -0.5, -1.4); }
    if (c.pose === 'react' && !melt) sweat(ctx, 0, -1.1, t);
  };

  S.olive = function (ctx, c, t, V) {
    const inJar = c.pose === 'hidden' || c.pose === 'peek', cancan = c.pose === 'special', walk = c.pose === 'walk';
    const hop = walk ? Math.abs(Math.sin(t * 10)) * 0.15 : cancan ? Math.abs(Math.sin(t * 8)) * 0.1 : 0;
    if (!inJar) shadow(ctx, 0.4);
    ctx.save(); ctx.translate(0, -hop);
    if (inJar) ctx.translate(0, c.pose === 'peek' ? 0.1 : 0.45);
    if (cancan) { const k = Math.sin(t * 8) > 0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(0.1 * k, -0.2); ctx.lineTo(0.6 * k, -0.9); ctx.lineWidth = 0.1; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-0.1 * k, -0.2); ctx.lineTo(-0.15 * k, 0); ctx.stroke(); }
    ellipse(ctx, 0, -0.65, 0.42, 0.52, '#6d8d2c');
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-0.15, -0.9, 0.12, 0.2, -0.3, 0, TAU); ctx.fill();
    // œil unique (farci au poivron rouge = pupille)
    if (!V.back) { circle(ctx, Math.sin(V.v) * 0.1, -0.7, 0.2, '#fff', 0.04); circle(ctx, Math.sin(V.v) * 0.17, -0.7, 0.11, '#d32f2f', 0); circle(ctx, Math.sin(V.v) * 0.17, -0.7, 0.05, OUT, 0); if (c.pose === 'react') { ctx.fillStyle = '#64b5f6'; for (let i = 0; i < 2; i++) { const p = (t * 1.5 + i / 2) % 1; ctx.globalAlpha = 1 - p; ellipse(ctx, 0.08 + i * 0.1, -0.5 + p * 0.5, 0.05, 0.08, '#64b5f6', 0); } ctx.globalAlpha = 1; } }
    if (c.pose === 'eat') mouth(ctx, 0, -0.35, 0.1, Math.abs(Math.sin(t * 10)) * 0.06);
    if (cancan) { ctx.beginPath(); ctx.moveTo(-0.42, -0.7); ctx.lineTo(-0.8, -0.95); ctx.moveTo(0.42, -0.7); ctx.lineTo(0.8, -0.95); ctx.lineWidth = 0.08; ctx.strokeStyle = OUT; ctx.stroke(); musicNotes(ctx, 0.2, -1.3, t); }
    ctx.restore();
  };

  S.yeti = function (ctx, c, t, V) {
    const sleep = c.pose === 'sleep', sneeze = c.pose === 'special', grumpy = c.pose === 'react' && c.poseT < 10 && !c.vars.yawn;
    shadow(ctx, 1.1);
    if (sleep) { // roulé en boule
      ctx.save(); ctx.scale(1, 0.8); circle(ctx, 0, -1.0, 1.1, '#e8e2c8'); for (let i = 0; i < 12; i++) circle(ctx, Math.sin(i * 1.9) * 0.7, -1.0 + Math.cos(i * 2.3) * 0.6, 0.12 + (i % 3) * 0.04, '#5c8a9a', 0); ctx.restore();
      // poils
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 1.05, -0.8 + Math.sin(a) * 0.85); ctx.lineTo(Math.cos(a) * 1.25, -0.8 + Math.sin(a) * 1.05 + Math.sin(t * 2 + i) * 0.03); ctx.lineWidth = 0.06; ctx.strokeStyle = '#d6cfae'; ctx.stroke(); }
      eyes(ctx, 0, -1.0, 0.1, V.v, { gap: 0.3, closed: true }); zzz(ctx, 0.6, -1.7, t);
      return;
    }
    const walk = c.pose === 'walk', step = walk ? Math.sin(t * 7) : 0, lean = sneeze ? (c.poseT < 1.2 ? -0.25 * c.poseT : 0.3) : 0;
    ctx.save(); ctx.rotate(lean * 0.5); ctx.translate(0, -Math.abs(step) * 0.08);
    // jambes et corps massif de roquefort
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * 0.45 - 0.25, -0.7, 0.5, 0.7, 0.15); path(ctx, '#d6cfae'); }
    ctx.beginPath(); ctx.roundRect(-1.1, -2.5, 2.2, 1.9, 0.5); path(ctx, '#ece6cf');
    for (let i = 0; i < 14; i++) circle(ctx, -0.8 + (i * 0.47) % 1.6, -2.2 + Math.floor(i / 4) * 0.45 + (i % 2) * 0.2, 0.13 + (i % 3) * 0.04, '#5c8a9a', 0);
    // bras
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 1.0, -2.0); ctx.lineTo(s * 1.5, -1.3 + (grumpy ? -0.9 : Math.sin(t * 3 + s) * 0.08)); ctx.lineWidth = 0.35; ctx.strokeStyle = '#ece6cf'; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 0.06; ctx.strokeStyle = OUT; ctx.stroke(); }
    // tête
    ctx.beginPath(); ctx.roundRect(-0.8, -3.0, 1.6, 0.9, 0.4); path(ctx, '#ece6cf');
    for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(-0.7 + i * 0.15, -3.0); ctx.lineTo(-0.75 + i * 0.15, -3.25 + Math.sin(i) * 0.05); ctx.lineWidth = 0.08; ctx.strokeStyle = '#d6cfae'; ctx.stroke(); }
    if (!V.back) {
      eyes(ctx, 0, -2.7, 0.12, V.v, { gap: 0.32, wide: sneeze || grumpy, closed: sneeze && c.poseT > 1.2 && c.poseT < 1.8 });
      // narines moisies
      for (const s of [-1, 1]) circle(ctx, s * 0.14 + Math.sin(V.v) * 0.1, -2.4, 0.07, '#3b6b7a', 0);
      mouth(ctx, Math.sin(V.v) * 0.1, -2.25, grumpy ? 0.2 : 0.25, sneeze && c.poseT > 1.2 ? 0.18 : c.pose === 'eat' ? Math.abs(Math.sin(t * 8)) * 0.1 : c.pose === 'react' && !grumpy ? 0.16 : 0, grumpy ? -0.12 : 0.12);
      if (grumpy) { ctx.beginPath(); ctx.moveTo(-0.5, -2.95); ctx.lineTo(-0.15, -2.85); ctx.moveTo(0.5, -2.95); ctx.lineTo(0.15, -2.85); ctx.lineWidth = 0.06; ctx.strokeStyle = OUT; ctx.stroke(); }
    }
    ctx.restore();
    if (sneeze && c.poseT > 1.2) { // nuage de spores bleues luminescentes et cœur crémeux
      const p = Math.min(1, (c.poseT - 1.2) / 1.2);
      for (let i = 0; i < 26; i++) { const a = (i / 26 - 0.5) * 1.6 + Math.sin(t * 3 + i) * 0.1, d = p * (1.5 + (i % 5) * 0.6) * (1 + Math.sin(t * 2 + i) * 0.1); ctx.globalAlpha = 0.85 - p * 0.3; circle(ctx, Math.sin(a) * d * 1.3, -2.4 - Math.cos(a) * d * 0.4 - p * 0.5 - (i % 3) * 0.2, 0.12 + (i % 4) * 0.05, `hsl(${195 + i * 3},90%,${60 + (i % 3) * 10}%)`, 0); }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.ellipse(0, -1.5, 0.5 * p, 0.45 * p, 0, 0, TAU); ctx.fillStyle = '#fff3c4'; ctx.fill(); heart(ctx, 0, -1.5, 0.22 * p, '#ffcc80');
      ctx.fillStyle = OUT; ctx.font = 'bold 0.5px sans-serif'; ctx.fillText('ATCHAAA !', -1.2, -3.6 + Math.sin(t * 10) * 0.05);
    } else if (c.pose === 'react' && !grumpy) { ctx.fillStyle = OUT; ctx.font = 'bold 0.4px sans-serif'; ctx.fillText('ouaaah…', -0.6, -3.5); }
  };

  S.meduse = function (ctx, c, t, V) {
    const glow = c.pose === 'special', inflame = c.pose === 'react' && c.poseT < 10 && c.vars.inflame !== false;
    // tentacules de spaghetti
    const col = glow ? `hsl(${(t * 120) % 360},80%,70%)` : c.pose === 'react' ? '#ff7043' : '#f2d28a';
    for (let i = 0; i < 9; i++) { const x0 = -0.55 + i * 0.14; ctx.beginPath(); ctx.moveTo(x0, -0.9); for (let k = 1; k <= 4; k++) ctx.lineTo(x0 + Math.sin(t * 3 + i + k) * 0.12 * k, -0.9 + k * 0.28); ctx.lineWidth = 0.09; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 0.03; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke(); }
    // chapeau = boule de spaghetti et sauce
    ctx.beginPath(); ctx.arc(0, -0.9, 0.75, Math.PI, TAU); ctx.closePath(); path(ctx, col);
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-0.4 + i * 0.13, -1.1 - (i % 2) * 0.15, 0.2, 0, Math.PI * 1.4); ctx.lineWidth = 0.06; ctx.strokeStyle = glow ? '#fff' : '#e0b86a'; ctx.stroke(); }
    circle(ctx, 0.2, -1.3, 0.14, '#c62828', 0.03); circle(ctx, -0.3, -1.15, 0.11, '#c62828', 0.03);
    if (!V.back) { eyes(ctx, 0, -1.0, 0.08, V.v, { gap: 0.22, closed: c.pose === 'idle' && Math.sin(t) > 0.9 }); mouth(ctx, 0, -0.85, 0.1, c.pose === 'eat' ? 0.05 : 0, 0.08); }
    if (glow) { ctx.globalAlpha = 0.35; circle(ctx, 0, -0.9, 1.2 + Math.sin(t * 5) * 0.1, '#fff', 0); ctx.globalAlpha = 1; sparkles(ctx, 0, -0.8, 1.4, t, '#fff', 10); }
    if (c.pose === 'react') { for (let i = 0; i < 6; i++) { const p = (t * 2 + i / 6) % 1; ctx.globalAlpha = 1 - p; circle(ctx, -0.5 + i * 0.2, -1.6 - p * 0.6, 0.08, '#ff9800', 0); } ctx.globalAlpha = 1; }
  };

  S.leviathan = function (ctx, c, t, V) {
    if (c.pose === 'special') { // brise la banquise
      const p = Math.min(1, c.poseT / 0.8), up = c.poseT < 3.5 ? Math.sin(Math.min(1, c.poseT / 3.5) * Math.PI) * 3.2 : 0;
      // éclats de glace
      for (let i = 0; i < 16; i++) { const q = Math.min(1, c.poseT / 2.5); ctx.globalAlpha = 1 - q; ctx.save(); ctx.translate((i - 8) * 0.5 * q * 1.5, -q * 3 + q * q * 3 - (i % 3) * 0.5); ctx.rotate(i + t * 3); ctx.beginPath(); ctx.moveTo(-0.3, 0); ctx.lineTo(0.1, -0.4); ctx.lineTo(0.35, 0.1); ctx.closePath(); path(ctx, '#e1f5fe', 0.04); ctx.restore(); }
      ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(0, -up); ctx.rotate(Math.sin(c.poseT * 2) * 0.15 * V.flip);
      // poisson pané géant
      ctx.beginPath(); ctx.ellipse(0, -1.5, 2.0, 1.1, 0, 0, TAU); path(ctx, '#e0a85a');
      for (let i = 0; i < 40; i++) circle(ctx, -1.7 + (i * 0.37) % 3.4, -2.2 + ((i * 0.53) % 1.5), 0.08, i % 2 ? '#c98a3e' : '#f0c27a', 0);
      // queue
      ctx.beginPath(); ctx.moveTo(-1.9 * V.flip, -1.5); ctx.lineTo(-3.0 * V.flip, -2.4 + Math.sin(t * 8) * 0.3); ctx.lineTo(-3.0 * V.flip, -0.6 - Math.sin(t * 8) * 0.3); ctx.closePath(); path(ctx, '#d99a4a');
      // œil et dents
      if (!V.back) { eyes(ctx, 1.1 * V.flip, -1.8, 0.2, V.v, { one: true, wide: true }); ctx.beginPath(); ctx.moveTo(0.4 * V.flip, -1.1); ctx.lineTo(1.9 * V.flip, -1.3); ctx.lineWidth = 0.06; ctx.strokeStyle = OUT; ctx.stroke(); ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo((0.5 + i * 0.3) * V.flip, -1.12 + i * 0.03); ctx.lineTo((0.65 + i * 0.3) * V.flip, -1.14 + i * 0.03); ctx.lineTo((0.57 + i * 0.3) * V.flip, -0.9 + i * 0.03); ctx.fill(); } }
      ctx.restore();
      if (c.poseT > 3.5) { // replonge dans les petits pois
        for (let i = 0; i < 10; i++) { const q = (t * 2 + i / 10) % 1; ctx.globalAlpha = 1 - q; circle(ctx, (i - 5) * 0.4, -q * 1.2, 0.14, '#7cb342', 0.03); } ctx.globalAlpha = 1;
      }
      return;
    }
    // sous la banquise : nageoire qui dépasse du givre
    const fin = c.pose === 'peek' ? Math.sin(t * 4) * 0.2 : 0, shake = c.pose === 'react' ? Math.sin(t * 30) * 0.05 : 0;
    ctx.save(); ctx.translate(shake, 0);
    ctx.beginPath(); ctx.moveTo(-0.5, 0); ctx.quadraticCurveTo(-0.2 + fin, -1.1, 0.6 + fin, -1.3); ctx.quadraticCurveTo(0.5, -0.5, 0.6, 0); ctx.closePath(); path(ctx, '#d99a4a');
    for (let i = 0; i < 6; i++) circle(ctx, -0.2 + i * 0.12, -0.3 - i * 0.12, 0.06, '#c98a3e', 0);
    ctx.restore();
    if (c.pose === 'react' && c.vars && c.pose === 'react') { // œil qui luit sous la glace / ondes
      ctx.globalAlpha = 0.6; circle(ctx, -1.2, -0.3, 0.35, '#fff176', 0); circle(ctx, -1.2, -0.3, 0.15, OUT, 0); ctx.globalAlpha = 1;
    }
  };

  S.celeri = function (ctx, c, t, V) {
    const walk = c.pose === 'walk', step = walk ? Math.sin(t * 6) : 0, graze = c.pose === 'eat', kiss = c.pose === 'special', alert = c.pose === 'react';
    shadow(ctx, 0.6);
    // pattes (bâtonnets de céleri)
    for (let i = 0; i < 4; i++) { const s = i < 2 ? -1 : 1, sw = step * (i % 2 ? 1 : -1) * 0.12; ctx.beginPath(); ctx.moveTo(s * 0.3, -0.9); ctx.lineTo(s * 0.35 + sw, 0); ctx.lineWidth = 0.14; ctx.strokeStyle = '#9ccc65'; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 0.04; ctx.strokeStyle = OUT; ctx.stroke(); }
    // corps
    ctx.beginPath(); ctx.roundRect(-0.6, -1.4, 1.2, 0.6, 0.2); path(ctx, '#aed581');
    ctx.strokeStyle = '#7cb342'; ctx.lineWidth = 0.05; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-0.5, -1.3 + i * 0.18); ctx.lineTo(0.5, -1.3 + i * 0.18); ctx.stroke(); }
    // cou : vers le bas pour brouter, droit en alerte, penché vers l'autre pour le bisou
    const nx = V.flip * (graze ? 0.9 : kiss ? 0.7 : 0.35), ny = graze ? -0.5 : alert ? -2.7 : kiss ? -2.1 : -2.4;
    ctx.beginPath(); ctx.moveTo(0.3 * V.flip, -1.3); ctx.quadraticCurveTo(V.flip * 0.5, -2.0, nx, ny); ctx.lineWidth = 0.3; ctx.strokeStyle = '#aed581'; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 0.05; ctx.strokeStyle = OUT; ctx.stroke();
    // tête : feuilles
    ctx.save(); ctx.translate(nx, ny);
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate((i - 2) * 0.5 + Math.sin(t * 2 + i) * 0.08); ellipse(ctx, 0, -0.3, 0.12, 0.3, '#66bb6a', 0.03); ctx.restore(); }
    circle(ctx, 0, 0, 0.26, '#aed581');
    if (!V.back) { eyes(ctx, 0, -0.03, 0.06, V.v, { gap: 0.1, wide: alert, closed: kiss }); mouth(ctx, Math.sin(V.v) * 0.05, 0.12, 0.08, graze ? Math.abs(Math.sin(t * 8)) * 0.05 : 0, kiss ? -0.05 : 0.06); }
    ctx.restore();
    if (graze) { for (let i = 0; i < 3; i++) circle(ctx, nx + Math.sin(t * 9 + i) * 0.2, ny + 0.25 + ((t * 2 + i / 3) % 1) * 0.2, 0.04, '#e1f5fe', 0); }
    if (kiss) { heart(ctx, nx + V.flip * 0.4, ny - 0.5 - Math.abs(Math.sin(t * 3)) * 0.2, 0.18, '#f06292'); sparkles(ctx, nx, ny, 0.6, t, '#e1f5fe', 6); }
    if (alert) { ctx.fillStyle = OUT; ctx.font = 'bold 0.4px sans-serif'; ctx.fillText('!', nx + 0.3, ny - 0.5); }
  };

  S.pois = function (ctx, c, t, V) {
    const walk = c.pose === 'walk', slide = c.pose === 'react' && c.vars.slide, tower = c.pose === 'special';
    const wad = walk ? Math.sin(t * 12) * 0.12 : 0;
    if (!tower) shadow(ctx, 0.3);
    ctx.save(); ctx.rotate(wad); if (slide) { ctx.rotate(V.flip * 1.3); ctx.translate(0, -0.2); }
    if (tower) ctx.translate(Math.sin(t * 10 + c.id) * 0.03, 0);
    circle(ctx, 0, -0.35, 0.34, '#7cb342');
    ellipse(ctx, 0.05 * V.flip, -0.3, 0.2, 0.25, '#dcedc8', 0);
    // ailerons
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 0.3, -0.45); ctx.lineTo(s * 0.5, -0.2 + (walk ? Math.sin(t * 12 + s) * 0.05 : 0)); ctx.lineWidth = 0.1; ctx.strokeStyle = '#558b2f'; ctx.lineCap = 'round'; ctx.stroke(); }
    // bec et yeux
    if (!V.back) { eyes(ctx, 0, -0.45, 0.05, V.v, { gap: 0.1, wide: tower }); ctx.beginPath(); ctx.moveTo(Math.sin(V.v) * 0.1 - 0.06, -0.33); ctx.lineTo(Math.sin(V.v) * 0.1 + 0.06, -0.33); ctx.lineTo(Math.sin(V.v) * 0.1, -0.24); ctx.closePath(); path(ctx, '#ffb300', 0.02); }
    // pieds
    for (const s of [-1, 1]) ellipse(ctx, s * 0.12, -0.02, 0.1, 0.04, '#ffb300', 0.02);
    ctx.restore();
    if (tower && c.vars.tower && c.vars.tower.y === 0) sweat(ctx, 0.3, -0.7, t);
    if (c.pose === 'react' && !slide) sweat(ctx, 0.2, -0.7, t);
  };

  S.sorbet = function (ctx, c, t, V) {
    const erupt = c.vars.erupt || c.pose === 'special', fountain = c.pose === 'special', breathe = c.pose === 'peek' ? Math.abs(Math.sin(t * 3)) * 0.25 : 0, shake = c.pose === 'react' && !erupt ? Math.sin(t * 40) * 0.03 : 0;
    shadow(ctx, 0.9);
    ctx.save(); ctx.translate(shake, 0);
    // pot
    ctx.beginPath(); ctx.moveTo(-0.85, -1.6); ctx.lineTo(-0.75, 0); ctx.lineTo(0.75, 0); ctx.lineTo(0.85, -1.6); ctx.closePath(); path(ctx, '#f8bbd0');
    ctx.beginPath(); ctx.rect(-0.8, -1.1, 1.6, 0.5); path(ctx, '#fff', 0.03);
    ctx.fillStyle = '#ad1457'; ctx.font = 'bold 0.28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SORBET', 0, -0.75); ctx.textAlign = 'left';
    // couvercle soulevé
    const lid = erupt ? 0.7 : breathe;
    ctx.save(); ctx.translate(-0.85, -1.6); ctx.rotate(-lid); ctx.beginPath(); ctx.roundRect(0, -0.22, 1.7, 0.24, 0.06); path(ctx, '#e91e63'); ctx.restore();
    if (!V.back) { eyes(ctx, 0, -1.35, 0.09, V.v, { gap: 0.3, wide: erupt }); mouth(ctx, 0, -1.2, 0.2, erupt ? 0.08 : 0, 0.08); }
    ctx.restore();
    if (erupt) { // lave rose
      for (let i = 0; i < 18; i++) { const p = (t * 1.4 + i / 18) % 1, a = (i / 18 - 0.5) * 2.2; ctx.globalAlpha = 1 - p * 0.6; circle(ctx, Math.sin(a) * p * 1.3, -1.7 - p * 2.2 + p * p * 1.6, 0.16 - p * 0.05, i % 3 ? '#f48fb1' : '#f06292', 0); }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 5; i++) ellipse(ctx, -0.6 + i * 0.3, -0.05 + Math.sin(t * 2 + i) * 0.03, 0.2, 0.08, '#f48fb1', 0);
    }
    if (fountain) { // cerises et confettis
      for (let i = 0; i < 12; i++) { const p = (t * 1.1 + i / 12) % 1, a = (i / 12 - 0.5) * 2.6; ctx.globalAlpha = 1 - p * 0.3; circle(ctx, Math.sin(a) * p * 2.2, -2.0 - p * 3.0 + p * p * 2.4, 0.13, '#b71c1c', 0.03); ctx.fillStyle = '#4caf50'; ctx.fillRect(Math.sin(a) * p * 2.2, -2.13 - p * 3.0 + p * p * 2.4, 0.03, 0.15); }
      ctx.globalAlpha = 1; sparkles(ctx, 0, -2.5, 2.2, t, `hsl(${(t * 200) % 360},90%,65%)`, 14);
    }
  };

  // ---- dispatch
  S.draw = function (ctx, c, cam, t) { const V = viewOf(c, cam); (S[c.spId] || S.cornichon)(ctx, c, t, V); };
})(window.FS);
