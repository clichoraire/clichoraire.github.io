// Paper Run — rendu façon papier découpé (Paper Mario) : contours épais, bord blanc, ombres portées, décor sur bâtonnets.
(function (root) {
  'use strict';
  const PR = root.PR = root.PR || {};
  const T = 48, TAU = Math.PI * 2;
  const INK = '#2b1f1a';            // couleur des contours
  const R = PR.render = {};
  R.FONT = '"Fredoka", "Chalkboard SE", "Marker Felt", "Comic Sans MS", sans-serif';

  // Petit générateur pseudo-aléatoire déterministe (décor stable d'une partie à l'autre).
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  R.rng = rng;

  const rr = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  R.rr = rr;
  const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.closePath(); };
  R.circle = circle;

  // Dessine un tracé (déjà construit par pathFn) comme une pièce de papier : ombre, bord blanc, couleur, contour.
  R.cut = function (ctx, pathFn, fill, o = {}) {
    const lw = o.line == null ? 3 : o.line, edge = o.edge == null ? 4 : o.edge;
    if (o.shadow !== false) { ctx.save(); ctx.translate(o.sx == null ? 3 : o.sx, o.sy == null ? 4 : o.sy); pathFn(ctx); ctx.fillStyle = o.shadowColor || 'rgba(40,25,10,0.22)'; ctx.fill(); ctx.restore(); }
    if (edge > 0) { pathFn(ctx); ctx.lineJoin = 'round'; ctx.strokeStyle = o.edgeColor || '#fffaf0'; ctx.lineWidth = lw * 2 + edge * 2; ctx.stroke(); }
    pathFn(ctx); ctx.fillStyle = fill; ctx.fill();
    if (lw > 0) { pathFn(ctx); ctx.lineJoin = 'round'; ctx.strokeStyle = o.ink || INK; ctx.lineWidth = lw; ctx.stroke(); }
  };

  // Union de formes (cercles / rectangles) avec un seul contour : on peint d'abord les formes élargies en encre,
  // puis les formes à leur taille par-dessus. shapes : [{x, y, r}] ou [{x, y, w, h}].
  R.blob = function (ctx, shapes, fill, o = {}) {
    const lw = o.line == null ? 3 : o.line, edge = o.edge == null ? 0 : o.edge;
    const pass = (grow, color) => { ctx.fillStyle = color; for (const sh of shapes) { ctx.beginPath(); if (sh.r != null) ctx.arc(sh.x, sh.y, sh.r + grow, 0, TAU); else ctx.rect(sh.x - grow, sh.y - grow, sh.w + 2 * grow, sh.h + 2 * grow); ctx.fill(); } };
    if (o.shadow !== false) { ctx.save(); ctx.translate(o.sx == null ? 3 : o.sx, o.sy == null ? 4 : o.sy); pass(lw / 2, o.shadowColor || 'rgba(40,25,10,0.22)'); ctx.restore(); }
    if (edge > 0) pass(lw + edge, o.edgeColor || '#fffaf0');
    pass(lw, o.ink || INK);
    pass(0, fill);
  };

  // ---------------------------------------------------------------- décor de fond (parallaxe)
  // ---------------------------------------------------------------- décor de fond (parallaxe), différent par monde
  // Chaque couche : kind = hill | tree | peak | tower | cloudbank, items placés sur une bande qui se répète.
  R.makeBackground = function (world, seed) {
    const rnd = rng(seed || 7), layers = [], id = world.id, h = world.hill;
    const mk = (kind, count, baseY, amp, spread, color, par, extra) => {
      const items = [];
      for (let i = 0; i < count; i++) items.push(Object.assign({ x: i * spread + rnd() * spread * 0.6, w: spread * (0.9 + rnd() * 0.8), h: amp * (0.6 + rnd() * 0.8), r1: rnd(), r2: rnd(), r3: rnd() }, extra ? extra(rnd) : {}));
      layers.push({ kind, items, baseY, color, par, spread: spread * count });
    };
    if (id === 'foret') { mk('hill', 12, 0.84, 110, 460, h[0], 0.14); mk('tree', 18, 0.97, 420, 240, h[1], 0.3); mk('tree', 16, 1.02, 330, 300, h[2], 0.5); }
    else if (id === 'ciseaux') { mk('peak', 10, 0.86, 330, 520, h[0], 0.12); mk('peak', 12, 0.94, 260, 420, h[1], 0.26); mk('hill', 14, 1.0, 90, 300, h[2], 0.48); }
    else if (id === 'chateau') { mk('hill', 12, 0.86, 110, 460, h[0], 0.14); mk('tower', 10, 0.98, 300, 520, h[1], 0.28); mk('tower', 12, 1.03, 220, 380, h[2], 0.46); }
    else if (id === 'ciel') { mk('cloudbank', 12, 0.86, 70, 420, h[0], 0.12); mk('cloudbank', 14, 0.96, 60, 330, h[1], 0.26); mk('cloudbank', 14, 1.04, 50, 280, h[2], 0.44); }
    else { mk('hill', 14, 0.78, 150, 420, h[0], 0.18); mk('hill', 14, 0.86, 120, 330, h[1], 0.32); mk('hill', 16, 0.96, 90, 280, h[2], 0.5, r => ({ tree: r() < 0.7 ? { dx: (r() - 0.5) * 0.5, s: 0.7 + r() * 0.6, kind: r() < 0.5 ? 'round' : 'pine' } : null })); }
    const clouds = []; for (let i = 0; i < 16; i++) clouds.push({ x: i * 380 + rnd() * 300, y: 40 + rnd() * 200, s: 0.7 + rnd() * 0.8, par: 0.08 + rnd() * 0.08 });
    const stars = []; for (let i = 0; i < 60; i++) stars.push({ x: rnd() * 2000, y: rnd() * 320, s: 1 + rnd() * 2, tw: rnd() * 6 });
    return { world, layers, clouds, stars, sun: { x: 0.8, y: 0.18 }, night: id === 'chateau' };
  };

  R.drawBackground = function (ctx, bg, cam, W, H, t) {
    const id = bg.world.id;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, bg.world.sky[0]); g.addColorStop(1, bg.world.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sx = W * bg.sun.x - cam.x * 0.03, sy = H * bg.sun.y - cam.y * 0.03;
    if (bg.night) {
      ctx.fillStyle = '#fff7d6'; for (const st of bg.stars) { const x = ((st.x - cam.x * 0.02) % 2000 + 2000) % 2000 - 300, y = st.y - cam.y * 0.02; if (x < -10 || x > W + 10) continue; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + st.tw); circle(ctx, x, y, st.s); ctx.fill(); } ctx.globalAlpha = 1;
      R.cut(ctx, c => circle(c, sx, sy, 44), '#fff2b0', { line: 3, edge: 3, sx: 4, sy: 5 }); ctx.fillStyle = bg.world.sky[0]; circle(ctx, sx + 16, sy - 10, 34); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, 44, 0, TAU); ctx.stroke();
    } else {
      R.cut(ctx, c => { c.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 0.1, r = 58 + (i % 2) * 10; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } c.closePath(); }, '#ffe08a', { line: 3, edge: 3, sx: 4, sy: 5 });
      circle(ctx, sx, sy, 40); ctx.fillStyle = '#ffd04a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      if (id === 'ciel') { ctx.save(); ctx.globalAlpha = 0.45; const cols = ['#ff5f5f', '#ffb347', '#ffe36b', '#7fd45a', '#5ab8ff', '#9b3fd4']; const rx = W * 0.3 - cam.x * 0.06, ry = H * 0.95 - cam.y * 0.05; cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(rx, ry, 420 - i * 14, Math.PI, TAU); ctx.stroke(); }); ctx.restore(); }
    }
    for (const cl of bg.clouds) {
      const span = 16 * 380, x = ((cl.x - cam.x * cl.par) % span + span) % span - 200, y = cl.y - cam.y * cl.par * 0.5;
      if (x < -200 || x > W + 200) continue;
      R.blob(ctx, [{ x, y, r: 28 * cl.s }, { x: x + 32 * cl.s, y: y - 12 * cl.s, r: 34 * cl.s }, { x: x + 70 * cl.s, y, r: 26 * cl.s }, { x: x - 6 * cl.s, y: y + 4 * cl.s, w: 100 * cl.s, h: 22 * cl.s }], bg.night ? '#8e78b5' : '#ffffff', { line: 3, shadowColor: 'rgba(60,70,120,0.15)' });
    }
    for (const L of bg.layers) {
      const off = -cam.x * L.par, baseY = H * L.baseY - cam.y * L.par * 0.6;
      for (const it of L.items) {
        let x = ((it.x + off) % L.spread + L.spread) % L.spread - it.w; if (x > W + 60) continue;
        if (L.kind === 'hill') {
          R.cut(ctx, c => { c.beginPath(); c.moveTo(x, baseY + 300); c.lineTo(x, baseY); c.bezierCurveTo(x + it.w * 0.25, baseY - it.h * 1.3, x + it.w * 0.75, baseY - it.h * 1.3, x + it.w, baseY); c.lineTo(x + it.w, baseY + 300); c.closePath(); }, L.color, { line: 3, edge: 0, sx: 0, sy: 6, shadowColor: 'rgba(30,40,30,0.18)' });
          if (it.tree) R.drawStickTree(ctx, x + it.w * (0.5 + it.tree.dx), baseY - it.h * 0.9, it.tree.s, it.tree.kind);
        } else if (L.kind === 'tree') {
          const cx = x + it.w / 2, top = baseY - it.h, tw = 18 + it.r1 * 14;
          R.cut(ctx, c => { c.beginPath(); c.moveTo(cx - tw, baseY + 300); c.lineTo(cx - tw * 0.6, top + 60); c.lineTo(cx + tw * 0.6, top + 60); c.lineTo(cx + tw, baseY + 300); c.closePath(); }, L.color, { line: 3, edge: 0, sx: 0, sy: 0, shadow: false });
          R.blob(ctx, [{ x: cx, y: top + 10, r: 60 + it.r2 * 30 }, { x: cx - 55, y: top + 60, r: 50 + it.r3 * 20 }, { x: cx + 55, y: top + 55, r: 50 + it.r1 * 20 }, { x: cx, y: top + 90, r: 55 }], L.color, { line: 3, edge: 0, sx: 0, sy: 4, shadowColor: 'rgba(20,40,30,0.2)' });
        } else if (L.kind === 'peak') {
          const cx = x + it.w / 2, top = baseY - it.h;
          R.cut(ctx, c => { c.beginPath(); c.moveTo(x, baseY + 300); c.lineTo(x, baseY); c.lineTo(cx - it.w * 0.2, top + it.h * 0.35); c.lineTo(cx, top); c.lineTo(cx + it.w * 0.15, top + it.h * 0.25); c.lineTo(x + it.w, baseY); c.lineTo(x + it.w, baseY + 300); c.closePath(); }, L.color, { line: 3, edge: 0, sx: 0, sy: 6, shadowColor: 'rgba(30,30,60,0.18)' });
          R.cut(ctx, c => { c.beginPath(); c.moveTo(cx - it.w * 0.12, top + it.h * 0.22); c.lineTo(cx, top); c.lineTo(cx + it.w * 0.1, top + it.h * 0.17); c.lineTo(cx + it.w * 0.04, top + it.h * 0.24); c.lineTo(cx - it.w * 0.04, top + it.h * 0.19); c.closePath(); }, '#ffffff', { line: 3, edge: 0, shadow: false });
        } else if (L.kind === 'tower') {
          const tw = 50 + it.r1 * 40, cx = x + it.w / 2, top = baseY - it.h;
          R.cut(ctx, c => { c.beginPath(); c.moveTo(cx - tw, baseY + 300); c.lineTo(cx - tw, top); for (let k = 0; k < 5; k++) { const bx = cx - tw + k * tw * 2 / 5; c.lineTo(bx, top); c.lineTo(bx, top - 14); c.lineTo(bx + tw * 0.2, top - 14); c.lineTo(bx + tw * 0.2, top); } c.lineTo(cx + tw, top); c.lineTo(cx + tw, baseY + 300); c.closePath(); }, L.color, { line: 3, edge: 0, sx: 0, sy: 6, shadowColor: 'rgba(20,10,40,0.25)' });
          ctx.fillStyle = '#ffe9a8'; for (let k = 0; k < 3; k++) { if (((it.r2 * 10 + k) | 0) % 2) continue; rr(ctx, cx - 8 + (k - 1) * 22, top + 40 + k * 30, 12, 18, 5); ctx.fill(); }
        } else if (L.kind === 'cloudbank') {
          R.blob(ctx, [{ x: x + it.w * 0.2, y: baseY, r: it.h }, { x: x + it.w * 0.5, y: baseY - it.h * 0.3, r: it.h * 1.3 }, { x: x + it.w * 0.8, y: baseY, r: it.h }, { x, y: baseY, w: it.w, h: 300 }], L.color, { line: 3, edge: 0, sx: 0, sy: 5, shadowColor: 'rgba(120,60,90,0.15)' });
        }
      }
    }
  };

  // Arbre de théâtre de papier, planté sur un bâtonnet de bois.
  R.drawStickTree = function (ctx, x, y, s, kind, ground) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rr(ctx, -5, -8, 10, 46, 4); ctx.fillStyle = '#e4c28f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    if (kind === 'pine') R.cut(ctx, c => { c.beginPath(); c.moveTo(0, -120); c.lineTo(34, -70); c.lineTo(18, -70); c.lineTo(44, -30); c.lineTo(24, -30); c.lineTo(50, 4); c.lineTo(-50, 4); c.lineTo(-24, -30); c.lineTo(-44, -30); c.lineTo(-18, -70); c.lineTo(-34, -70); c.closePath(); }, '#3d8f5a', { line: 3, edge: 3 });
    else { R.cut(ctx, c => { c.beginPath(); c.moveTo(-8, 4); c.lineTo(8, 4); c.lineTo(5, -30); c.lineTo(-5, -30); c.closePath(); }, '#8b5a2b', { line: 3, edge: 2 }); R.blob(ctx, [{ x: 0, y: -70, r: 40 }, { x: -30, y: -48, r: 28 }, { x: 30, y: -48, r: 28 }, { x: 0, y: -40, r: 30 }], '#5fb860', { line: 3, edge: 3 }); ctx.fillStyle = 'rgba(255,255,255,0.25)'; circle(ctx, -14, -84, 10); ctx.fill(); }
    ctx.restore();
  };

  // ---------------------------------------------------------------- petits accessoires semés sur le sol
  const PROPS = {
    prairie: ['flower', 'flower', 'tuft', 'tuft', 'rock', 'sign'],
    foret: ['mushroom', 'fern', 'tuft', 'log', 'mushroom'],
    ciseaux: ['rock', 'crystal', 'snow', 'rock', 'bone'],
    chateau: ['torch', 'banner', 'skull', 'chain', 'torch'],
    ciel: ['star', 'windmill', 'tuft', 'flower'],
    under: ['bone', 'crystal', 'mushroom', 'rock'],
  };
  R.drawProp = function (ctx, kind, x, y, rnd) {
    const hue = ['#ff5f7a', '#ffd54a', '#5ab8ff', '#ff8fd0', '#b48cf0'][Math.floor(rnd() * 5)];
    switch (kind) {
      case 'flower': for (let i = 0; i < 2; i++) { const fx = x + (i - 0.5) * 16 + rnd() * 6, fh = 16 + rnd() * 12; ctx.strokeStyle = '#3d8f5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, y - fh); ctx.stroke(); R.cut(ctx, c => { c.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; c.moveTo(fx, y - fh); c.arc(fx + Math.cos(a) * 5, y - fh + Math.sin(a) * 5, 5, 0, TAU); } }, hue, { line: 2, edge: 0, shadow: false }); ctx.fillStyle = '#ffe36b'; circle(ctx, fx, y - fh, 3.5); ctx.fill(); } break;
      case 'tuft': ctx.strokeStyle = '#3d8f5a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5, y); ctx.quadraticCurveTo(x + i * 9, y - 12, x + i * 13, y - 18 - rnd() * 6); ctx.stroke(); } break;
      case 'rock': R.cut(ctx, c => { c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x - 10, y - 14); c.lineTo(x + 4, y - 18); c.lineTo(x + 16, y - 8); c.lineTo(x + 14, y); c.closePath(); }, '#b9b4ad', { line: 2.5, edge: 2 }); break;
      case 'sign': rr(ctx, x - 3, y - 36, 6, 36, 2); ctx.fillStyle = '#c9975a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); R.cut(ctx, c => { c.beginPath(); c.moveTo(x - 20, y - 50); c.lineTo(x + 18, y - 50); c.lineTo(x + 28, y - 40); c.lineTo(x + 18, y - 30); c.lineTo(x - 20, y - 30); c.closePath(); }, '#e4c28f', { line: 2.5, edge: 0 }); ctx.fillStyle = INK; ctx.fillRect(x - 14, y - 42, 24, 3); break;
      case 'mushroom': { const mh = 14 + rnd() * 10, mw = 12 + rnd() * 8; rr(ctx, x - 4, y - mh, 8, mh, 3); ctx.fillStyle = '#fff3d6'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); R.cut(ctx, c => { c.beginPath(); c.arc(x, y - mh, mw, Math.PI, TAU); c.closePath(); }, rnd() < 0.5 ? '#ff5f5f' : '#ffb347', { line: 2.5, edge: 0 }); ctx.fillStyle = '#fff'; circle(ctx, x - mw * 0.4, y - mh - 5, 2.5); ctx.fill(); circle(ctx, x + mw * 0.3, y - mh - 7, 2); ctx.fill(); break; }
      case 'fern': ctx.strokeStyle = '#2f7d4a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + i * 18, y - 18, x + i * 26, y - 30); ctx.stroke(); for (let k = 1; k < 4; k++) { const px = x + i * 26 * k / 4, py = y - 30 * k / 4 - 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 6, py - 6); ctx.moveTo(px, py); ctx.lineTo(px + 6, py - 6); ctx.stroke(); } } break;
      case 'log': R.cut(ctx, c => rr(c, x - 24, y - 16, 48, 16, 8), '#8b5a2b', { line: 2.5, edge: 2 }); ctx.fillStyle = '#e4c28f'; ctx.beginPath(); ctx.ellipse(x + 24, y - 8, 5, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); break;
      case 'crystal': R.cut(ctx, c => { c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x - 8, y - 22); c.lineTo(x - 2, y - 30); c.lineTo(x + 6, y - 16); c.lineTo(x + 12, y - 24); c.lineTo(x + 14, y); c.closePath(); }, hue, { line: 2.5, edge: 2 }); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x - 4, y - 22); ctx.lineTo(x - 1, y - 6); ctx.closePath(); ctx.fill(); break;
      case 'snow': R.blob(ctx, [{ x: x - 10, y: y - 4, r: 10 }, { x: x + 6, y: y - 6, r: 12 }, { x: x - 2, y: y - 2, r: 9 }], '#ffffff', { line: 2.5, shadow: false }); break;
      case 'bone': ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.ellipse(x, y - 6, 16, 4, -0.2, 0, TAU); ctx.fill(); ctx.stroke(); for (const k of [-1, 1]) { circle(ctx, x + k * 16, y - 6 - k * 3, 4.5); ctx.fill(); ctx.stroke(); } break;
      case 'torch': rr(ctx, x - 3, y - 34, 6, 34, 2); ctx.fillStyle = '#8b5a2b'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); R.cut(ctx, c => { c.beginPath(); c.moveTo(x - 8, y - 34); c.quadraticCurveTo(x - 10, y - 50, x, y - 58); c.quadraticCurveTo(x + 10, y - 50, x + 8, y - 34); c.closePath(); }, '#ff8f3a', { line: 2.5, edge: 0, shadow: false }); ctx.fillStyle = '#ffe36b'; circle(ctx, x, y - 42, 4); ctx.fill(); break;
      case 'banner': rr(ctx, x - 2, y - 60, 4, 60, 2); ctx.fillStyle = '#c9975a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); R.cut(ctx, c => { c.beginPath(); c.moveTo(x + 2, y - 58); c.lineTo(x + 26, y - 58); c.lineTo(x + 26, y - 30); c.lineTo(x + 14, y - 22); c.lineTo(x + 2, y - 30); c.closePath(); }, hue, { line: 2.5, edge: 0 }); break;
      case 'skull': R.cut(ctx, c => { c.beginPath(); c.arc(x, y - 12, 11, Math.PI, TAU); c.lineTo(x + 11, y - 4); c.lineTo(x + 6, y); c.lineTo(x - 6, y); c.lineTo(x - 11, y - 4); c.closePath(); }, '#fff3d6', { line: 2.5, edge: 0 }); ctx.fillStyle = INK; circle(ctx, x - 4, y - 11, 2.5); ctx.fill(); circle(ctx, x + 4, y - 11, 2.5); ctx.fill(); break;
      case 'chain': ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x, y - 8 - k * 12, 4, 7, 0, 0, TAU); ctx.stroke(); } break;
      case 'star': R.cut(ctx, c => { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 5 : 11, a = k / 10 * TAU - Math.PI / 2; c.lineTo(x + Math.cos(a) * r, y - 12 + Math.sin(a) * r); } c.closePath(); }, '#ffe36b', { line: 2.5, edge: 0 }); break;
      case 'windmill': rr(ctx, x - 2, y - 36, 4, 36, 2); ctx.fillStyle = '#c9975a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; R.cut(ctx, c => { c.beginPath(); c.moveTo(x, y - 36); c.lineTo(x + Math.cos(a) * 14 - Math.sin(a) * 5, y - 36 + Math.sin(a) * 14 + Math.cos(a) * 5); c.lineTo(x + Math.cos(a) * 14 + Math.sin(a) * 5, y - 36 + Math.sin(a) * 14 - Math.cos(a) * 5); c.closePath(); }, k % 2 ? hue : '#fff', { line: 2, edge: 0, shadow: false }); } break;
    }
  };

  // ---------------------------------------------------------------- terrain : tranches pré-rendues à la demande
  const SLAB = 1024;
  R.terrain = function (lvl, world) {
    const slabs = new Map(), order = [];
    const get = k => {
      if (slabs.has(k)) return slabs.get(k);
      const cv = renderSlab(lvl, world, k * SLAB, SLAB); slabs.set(k, cv); order.push(k);
      if (order.length > 8) slabs.delete(order.shift());
      return cv;
    };
    return { draw(ctx, camX, camY, W, H) { const k0 = Math.max(0, Math.floor(camX / SLAB)), k1 = Math.min(Math.ceil(lvl.pw / SLAB) - 1, Math.floor((camX + W) / SLAB)); for (let k = k0; k <= k1; k++) { const cv = get(k); const sx = Math.max(0, camX - k * SLAB), sw = Math.min(cv.width - sx, camX + W - (k * SLAB + sx)); if (sw <= 0) continue; const sy = Math.max(0, camY), sh = Math.min(cv.height - sy, H + 1); if (sh <= 0) continue; ctx.drawImage(cv, sx, sy, sw, sh, k * SLAB + sx, sy, sw, sh); } } };
  };

  function renderSlab(lvl, world, x0px, wpx) {
    const G = PR.TILE, grid = lvl.grid, w = lvl.w, h = lvl.h, under = lvl.under || h;
    const cx0 = Math.floor(x0px / T), cx1 = Math.min(w - 1, Math.ceil((x0px + wpx) / T));
    // hauteur utile : jusqu'au souterrain s'il y a quelque chose dedans dans cette tranche
    let deep = false; for (let y = under; y < h && !deep; y++) for (let x = cx0; x <= cx1; x++) if (grid[y * w + x]) { deep = true; break; }
    const cv = document.createElement('canvas'); cv.width = wpx; cv.height = deep ? h * T : Math.min(h, under + 1) * T;
    const ctx = cv.getContext('2d'); ctx.translate(-x0px, 0);
    const at = (x, y) => (x < 0 || x >= w) ? G.SOLID : (y < 0 || y >= h) ? G.EMPTY : grid[y * w + x];
    const solidish = v => v === G.SOLID || v === G.ICE || v === G.CANNON;
    const rows = Math.ceil(cv.height / T);
    const seedRnd = (x, y) => rng(x * 7919 + y * 104729 + 13);
    const id = world.id;
    // fond de la grotte derrière le souterrain
    if (deep) {
      ctx.fillStyle = '#2a1f33'; ctx.fillRect(x0px, under * T, wpx, (h - under) * T);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
      for (let y = under; y < h; y++) for (let x = cx0 - 1; x <= cx1; x++) { const off = (y % 2) * T / 2; ctx.strokeRect(x * T + off + 3, y * T + 3, T - 6, T - 6); }
      // stalactites et lanternes sous le plafond
      for (let x = cx0; x <= cx1; x++) {
        if (at(x, under) && !at(x, under + 1)) { const r = seedRnd(x, 1); if (r() < 0.45) { const px = x * T + 10 + r() * 20, len = 18 + r() * 26; R.cut(ctx, c => { c.beginPath(); c.moveTo(px - 9, (under + 1) * T); c.lineTo(px, (under + 1) * T + len); c.lineTo(px + 9, (under + 1) * T); c.closePath(); }, '#4a3a55', { line: 2.5, edge: 0, shadow: false }); }
          if (x % 11 === 5) { const px = x * T + T / 2, py = (under + 1) * T; ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 22); ctx.stroke(); R.cut(ctx, c => rr(c, px - 9, py + 22, 18, 24, 5), '#ffd54a', { line: 2.5, edge: 0 }); ctx.fillStyle = 'rgba(255,230,120,0.18)'; circle(ctx, px, py + 34, 70); ctx.fill(); } }
      }
    }
    // ombre portée
    ctx.save(); ctx.translate(5, 7); ctx.fillStyle = 'rgba(40,25,10,0.22)';
    for (let y = 0; y < rows; y++) for (let x = cx0; x <= cx1; x++) { const v = at(x, y); if (solidish(v) || v === G.PIPE || v === G.PIPEBODY) ctx.fillRect(x * T, y * T, T, T); }
    ctx.restore();
    // remplissage avec texture du monde
    for (let y = 0; y < rows; y++) for (let x = cx0; x <= cx1; x++) {
      const v = at(x, y), px = x * T, py = y * T, rnd = seedRnd(x, y), isUnder = y >= under;
      if (v === G.SOLID || v === G.CANNON) {
        const ground = isUnder ? '#5a4a62' : world.ground;
        ctx.fillStyle = ground; ctx.fillRect(px, py, T, T);
        if (isUnder || id === 'ciseaux') { ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 2; ctx.beginPath(); const n = 1 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) { let cx = px + 8 + rnd() * 30, cy = py + 6 + rnd() * 30; ctx.moveTo(cx, cy); for (let s = 0; s < 3; s++) { cx += (rnd() - 0.5) * 18; cy += 6 + rnd() * 8; ctx.lineTo(cx, cy); } } ctx.stroke(); }
        else if (id === 'chateau') { ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const off = (k % 2) * T / 2; ctx.strokeRect(px + off - T / 2 + 2, py + k * 16 + 2, T / 2 - 4, 12); ctx.strokeRect(px + off + 2, py + k * 16 + 2, T / 2 - 4, 12); } if (rnd() < 0.2) { ctx.fillStyle = 'rgba(80,160,90,0.45)'; circle(ctx, px + 10 + rnd() * 28, py + 10 + rnd() * 28, 5); ctx.fill(); } }
        else if (id === 'ciel') { ctx.fillStyle = 'rgba(180,200,235,0.35)'; for (let k = 0; k < 3; k++) { circle(ctx, px + 8 + rnd() * 32, py + 10 + rnd() * 30, 6 + rnd() * 6); ctx.fill(); } }
        else { ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 10; k < T; k += 12) { ctx.moveTo(px + 6, py + k); ctx.lineTo(px + T - 6, py + k); } ctx.stroke(); if (rnd() < 0.35) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; circle(ctx, px + 8 + rnd() * 32, py + 10 + rnd() * 30, 3 + rnd() * 3); ctx.fill(); } if (id === 'foret' && rnd() < 0.3) { ctx.strokeStyle = 'rgba(60,30,10,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + rnd() * T, py); ctx.quadraticCurveTo(px + rnd() * T, py + 24, px + rnd() * T, py + T); ctx.stroke(); } }
        if (!solidish(at(x, y - 1)) && at(x, y - 1) !== G.PIPEBODY) {
          // frange d'herbe (ou de mousse / neige / nuage) en papier
          ctx.fillStyle = isUnder ? '#7a6a85' : world.grass; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + T, py); ctx.lineTo(px + T, py + 12);
          for (let k = T; k > 0; k -= 8) { ctx.lineTo(px + k - 4, py + 18 + (k % 16 ? 4 : -2)); ctx.lineTo(px + k - 8, py + 12); }
          ctx.closePath(); ctx.fill();
        }
        if (v === G.CANNON) { R.cut(ctx, c => rr(c, px + 4, py + 4, T - 8, T - 8, 8), '#55585f', { line: 3, edge: 0, shadow: false }); ctx.fillStyle = '#2b2b30'; circle(ctx, px + T / 2, py + T / 2, 10); ctx.fill(); }
      } else if (v === G.ICE) {
        ctx.fillStyle = '#bfe9ff'; ctx.fillRect(px, py, T, T);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 6, py + 14); ctx.lineTo(px + 20, py + 6); ctx.moveTo(px + 26, py + 30); ctx.lineTo(px + 40, py + 20); ctx.stroke();
        ctx.fillStyle = 'rgba(90,170,220,0.35)'; ctx.fillRect(px, py + T - 10, T, 10);
        if (!solidish(at(x, y - 1))) { ctx.fillStyle = '#eefbff'; ctx.fillRect(px, py, T, 7); }
      } else if (v === G.INK) {
        ctx.fillStyle = '#2d1e4f'; ctx.fillRect(px, py + (at(x, y - 1) === G.INK ? 0 : 14), T, T);
      } else if (v === G.PIPEBODY) {
        const col = id === 'chateau' ? '#6c7a92' : '#3fae5a';
        ctx.fillStyle = col; ctx.fillRect(px + 3, py, T - 6, T); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px + 9, py, 8, T); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(px + T - 14, py, 6, T);
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); if (at(x - 1, y) !== G.PIPEBODY) { ctx.moveTo(px + 3, py); ctx.lineTo(px + 3, py + T); } if (at(x + 1, y) !== G.PIPEBODY) { ctx.moveTo(px + T - 3, py); ctx.lineTo(px + T - 3, py + T); } ctx.stroke();
      }
    }
    // rebords de tuyaux (cases adjacentes fusionnées)
    for (let y = 0; y < rows; y++) for (let x = cx0; x <= cx1; x++) {
      if (at(x, y) !== G.PIPE || at(x - 1, y) === G.PIPE) continue;
      let n = 1; while (at(x + n, y) === G.PIPE) n++;
      const col = id === 'chateau' ? '#6c7a92' : '#3fae5a', px = x * T, py = y * T;
      R.cut(ctx, c => rr(c, px - 4, py + 2, n * T + 8, T - 4, 8), col, { line: 3, edge: 0, sx: 3, sy: 4 });
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px + 6, py + 6, 10, T - 12); ctx.fillStyle = 'rgba(0,0,0,0.25)'; rr(ctx, px + 10, py + 8, n * T - 20, 10, 5); ctx.fill();
    }
    // contours des bords exposés
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath();
    for (let y = 0; y < rows; y++) for (let x = cx0; x <= cx1; x++) {
      if (!solidish(at(x, y))) continue;
      const px = x * T, py = y * T;
      if (!solidish(at(x, y - 1))) { ctx.moveTo(px, py); ctx.lineTo(px + T, py); }
      if (!solidish(at(x, y + 1))) { ctx.moveTo(px, py + T); ctx.lineTo(px + T, py + T); }
      if (!solidish(at(x - 1, y))) { ctx.moveTo(px, py); ctx.lineTo(px, py + T); }
      if (!solidish(at(x + 1, y))) { ctx.moveTo(px + T, py); ctx.lineTo(px + T, py + T); }
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,235,0.55)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let y = 0; y < rows; y++) for (let x = cx0; x <= cx1; x++) {
      if (!solidish(at(x, y))) continue;
      const px = x * T, py = y * T;
      if (!solidish(at(x, y - 1))) { ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); }
      if (!solidish(at(x - 1, y))) { ctx.moveTo(px + 4, py); ctx.lineTo(px + 4, py + T); }
    }
    ctx.stroke();
    // plateformes fines, punaises, accessoires
    for (let y = 0; y < rows; y++) for (let x = cx0; x <= cx1; x++) {
      const v = at(x, y), px = x * T, py = y * T;
      if (v === G.ONEWAY) {
        const left = at(x - 1, y) !== G.ONEWAY, right = at(x + 1, y) !== G.ONEWAY;
        R.cut(ctx, c => { c.beginPath(); c.rect(px - (left ? 0 : 6), py + 2, T + (left ? 0 : 6) + (right ? 0 : 6), 14); }, world.accent, { line: 3, edge: 0, sx: 3, sy: 5 });
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(px + 2, py + 5, T - 4, 3);
      } else if (v === G.SPIKE) R.drawTacks(ctx, px, py, seedRnd(x, y));
      else if (v === G.EMPTY && y > 0 && (at(x, y + 1) === G.SOLID || at(x, y + 1) === G.ICE) && at(x, y) === G.EMPTY) {
        // un accessoire sur certaines cases de sol libres (jamais sous le départ / l'arrivée)
        const rnd = seedRnd(x, y); const list = PROPS[y >= under ? 'under' : id] || PROPS.prairie;
        if (rnd() < (y >= under ? 0.14 : 0.22)) R.drawProp(ctx, list[Math.floor(rnd() * list.length)], px + 10 + rnd() * 28, py + T, rnd);
      }
    }
    // décor planté dans le sol (T, B, Z)
    for (const d of lvl.decor) {
      if (d.x < x0px - 100 || d.x > x0px + wpx + 100) continue; const rnd = seedRnd(Math.round(d.x), Math.round(d.y));
      if (d.kind === 'tree') R.drawStickTree(ctx, d.x, d.y, 0.9 + rnd() * 0.3, rnd() < 0.5 ? 'round' : 'pine');
      else if (d.kind === 'bush') R.blob(ctx, [{ x: d.x - 16, y: d.y - 10, r: 16 }, { x: d.x + 14, y: d.y - 12, r: 18 }, { x: d.x, y: d.y - 20, r: 18 }, { x: d.x - 28, y: d.y - 14, w: 56, h: 14 }], id === 'ciseaux' ? '#9fb5c9' : '#6cc25a', { line: 3, edge: 2 });
      else if (d.kind === 'exit') { rr(ctx, d.x - 3, d.y - 60, 6, 60, 2); ctx.fillStyle = '#c9975a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); R.cut(ctx, c => { c.beginPath(); c.moveTo(d.x - 30, d.y - 70); c.lineTo(d.x + 18, d.y - 70); c.lineTo(d.x + 30, d.y - 58); c.lineTo(d.x + 18, d.y - 46); c.lineTo(d.x - 30, d.y - 46); c.closePath(); }, '#ffd54a', { line: 2.5, edge: 0 }); R.text(ctx, 'SORTIE', d.x - 4, d.y - 58, 12, INK, 'center'); }
    }
    return cv;
  }

  // Punaises : deux par case, tête ronde colorée et pointe vers le haut.
  R.drawTacks = function (ctx, px, py, rnd) {
    const cols = ['#ff5f5f', '#4f9dff', '#ffd54a', '#6cdc6c'];
    for (let i = 0; i < 2; i++) {
      const cx = px + 12 + i * 24, base = py + T, col = cols[Math.floor(rnd() * cols.length)];
      ctx.beginPath(); ctx.moveTo(cx - 2, base - 16); ctx.lineTo(cx, base - 36); ctx.lineTo(cx + 2, base - 16); ctx.closePath(); ctx.fillStyle = '#c9ced6'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      R.cut(ctx, c => { c.beginPath(); c.moveTo(cx - 9, base - 18); c.lineTo(cx + 9, base - 18); c.lineTo(cx + 5, base - 10); c.lineTo(cx + 9, base - 2); c.lineTo(cx - 9, base - 2); c.lineTo(cx - 5, base - 10); c.closePath(); }, col, { line: 2.5, edge: 0, sx: 2, sy: 2 });
    }
  };

  // Encre animée (surface) par-dessus le fond pré-rendu.
  R.drawInk = function (ctx, lvl, cam, W, H, t) {
    const G = PR.TILE, x0 = Math.max(0, Math.floor(cam.x / T)), x1 = Math.min(lvl.w - 1, Math.ceil((cam.x + W) / T));
    const y0 = Math.max(0, Math.floor(cam.y / T)), y1 = Math.min(lvl.h - 1, Math.ceil((cam.y + H) / T));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (lvl.grid[y * lvl.w + x] !== G.INK || (y > 0 && lvl.grid[(y - 1) * lvl.w + x] === G.INK)) continue;
      const px = x * T, py = y * T + 14;
      ctx.fillStyle = '#4a2f85'; ctx.beginPath(); ctx.moveTo(px, py + 10);
      for (let k = 0; k <= T; k += 8) ctx.lineTo(px + k, py + Math.sin((px + k) / 18 + t * 3) * 3);
      ctx.lineTo(px + T, py + 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k <= T; k += 8) { const yy = py + Math.sin((px + k) / 18 + t * 3) * 3; k ? ctx.lineTo(px + k, yy) : ctx.moveTo(px + k, yy); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; rr(ctx, px + 8 + Math.sin(t * 2 + x) * 4, py + 8, 14, 4, 2); ctx.fill();
    }
  };

  // ---------------------------------------------------------------- objets
  R.drawCoin = function (ctx, x, y, big, t) {
    const r = big ? 17 : 11, sx = Math.max(0.15, Math.abs(Math.cos(t * 4 + x * 0.05)));
    ctx.save(); ctx.translate(x, y + Math.sin(t * 3 + x * 0.1) * 3); ctx.scale(sx, 1);
    R.cut(ctx, c => circle(c, 0, 0, r), big ? '#ffb43a' : '#ffd84a', { line: 3, edge: 2, sx: 2, sy: 3 });
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, b = a + TAU / 10; ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); ctx.lineTo(Math.cos(b) * r * 0.25, Math.sin(b) * r * 0.25); } ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  R.drawSpring = function (ctx, px, py, squash) {
    const base = py + T, k = 1 - squash * 0.5;
    ctx.save(); ctx.translate(px + T / 2, base);
    R.cut(ctx, c => { c.beginPath(); c.rect(-20, -8, 40, 8); }, '#8d6e63', { line: 3, edge: 0 });
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i <= 6; i++) ctx.lineTo(i % 2 ? 12 : -12, -8 - i * 5 * k); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(i % 2 ? 12 : -12, -8 - i * 5 * k); ctx.stroke();
    R.cut(ctx, c => { c.beginPath(); c.rect(-20, -8 - 30 * k - 8, 40, 8); }, '#ff6b6b', { line: 3, edge: 0 });
    ctx.restore();
  };

  R.drawMover = function (ctx, x, y, w, h, vertical, t) {
    R.cut(ctx, c => rr(c, x, y, w, h, 6), '#d8b57a', { line: 3, edge: 0, sx: 3, sy: 5 });
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 6, y + 4, w - 12, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 10; k < w - 6; k += 14) ctx.fillRect(x + k, y + 10, 6, h - 14);
    // ruban adhésif
    ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#ffe9a8'; ctx.translate(x + w / 2, y + 2); ctx.rotate(-0.1); ctx.fillRect(-14, -5, 28, 10); ctx.restore();
  };

  R.drawPaperWall = function (ctx, px, py) {
    R.cut(ctx, c => { c.beginPath(); c.rect(px + 2, py + 2, T - 4, T - 4); }, '#fff3d6', { line: 3, edge: 0, sx: 2, sy: 3 });
    ctx.save(); ctx.beginPath(); ctx.rect(px + 2, py + 2, T - 4, T - 4); ctx.clip(); ctx.strokeStyle = '#ff8f5e'; ctx.lineWidth = 6;
    for (let k = -T; k < T * 2; k += 16) { ctx.beginPath(); ctx.moveTo(px + k, py + T); ctx.lineTo(px + k + T, py); ctx.stroke(); }
    ctx.restore();
    ctx.font = '22px ' + R.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText('✂', px + T / 2, py + T / 2 + 1);
  };

  R.drawFlag = function (ctx, px, py, t, active, color, big) {
    const base = py + T, hgt = big ? 150 : 96, x = px + 12;
    rr(ctx, px - 2, base - 10, T + 4, 10, 4); ctx.fillStyle = '#8d6e63'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    rr(ctx, x - 4, base - hgt, 8, hgt - 8, 3); ctx.fillStyle = '#e4c28f'; ctx.fill(); ctx.stroke();
    circle(ctx, x, base - hgt, 7); ctx.fillStyle = '#ffd54a'; ctx.fill(); ctx.stroke();
    const fw = big ? 64 : 42, fh = big ? 44 : 30, fy = base - hgt + 10, wave = Math.sin(t * 6) * 4;
    R.cut(ctx, c => { c.beginPath(); c.moveTo(x + 4, fy); c.quadraticCurveTo(x + fw * 0.6, fy - 6 + wave, x + fw, fy + wave * 0.5); c.lineTo(x + fw - 12, fy + fh / 2); c.lineTo(x + fw, fy + fh - wave * 0.5); c.quadraticCurveTo(x + fw * 0.6, fy + fh + 6 - wave, x + 4, fy + fh); c.closePath(); }, active ? color : '#cfc8bd', { line: 3, edge: 2, sx: 3, sy: 4 });
    if (big) { ctx.font = 'bold 26px ' + R.FONT; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x + fw * 0.45, fy + fh / 2 + 1); }
  };

  // ---------------------------------------------------------------- ennemis
  // Chiffonné : boule de papier froissé avec des yeux fâchés et deux petits pieds.
  R.drawWalker = function (ctx, x, y, face, t, squash) {
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    const r = 20, bob = Math.abs(Math.sin(t * 10)) * 3;
    ctx.scale(1 + squash * 0.6, 1 - squash * 0.6); ctx.translate(0, -bob);
    // pieds
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 9 + Math.sin(t * 10 + (s > 0 ? 0 : Math.PI)) * 5, -2); R.cut(ctx, c => { c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, TAU); }, '#5a4636', { line: 2.5, edge: 0, shadow: false }); ctx.restore(); }
    R.cut(ctx, c => { c.beginPath(); for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, rad = r + ((i * 7) % 3) * 3; c.lineTo(Math.cos(a) * rad, -r - 4 + Math.sin(a) * rad); } c.closePath(); }, '#efe6d6', { line: 3, edge: 2 });
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -r - 12); ctx.lineTo(2, -r); ctx.lineTo(-6, -r + 10); ctx.moveTo(8, -r - 16); ctx.lineTo(12, -r + 2); ctx.stroke();
    // yeux fâchés
    ctx.fillStyle = '#fff'; circle(ctx, 2, -r - 2, 6); ctx.fill(); circle(ctx, 13, -r - 2, 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; circle(ctx, 2, -r - 2, 6); ctx.stroke(); circle(ctx, 13, -r - 2, 6); ctx.stroke();
    ctx.fillStyle = INK; circle(ctx, 4, -r - 2, 2.5); ctx.fill(); circle(ctx, 15, -r - 2, 2.5); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -r - 12); ctx.lineTo(7, -r - 8); ctx.moveTo(20, -r - 12); ctx.lineTo(9, -r - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -r + 8); ctx.quadraticCurveTo(8, -r + 4, 14, -r + 8); ctx.stroke();
    ctx.restore();
  };

  // Avion de papier.
  R.drawPlane = function (ctx, x, y, face, t) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 5) * 4); ctx.scale(face, 1); ctx.rotate(Math.sin(t * 5) * 0.08);
    R.cut(ctx, c => { c.beginPath(); c.moveTo(30, 0); c.lineTo(-26, -16); c.lineTo(-14, 0); c.lineTo(-26, 14); c.closePath(); }, '#f6f1ff', { line: 3, edge: 2 });
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-14, 0); ctx.stroke();
    ctx.fillStyle = '#fff'; circle(ctx, 8, -3, 5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; circle(ctx, 8, -3, 5); ctx.stroke(); ctx.fillStyle = INK; circle(ctx, 10, -3, 2); ctx.fill();
    ctx.restore();
  };

  // Sauterelle de papier : saute par bonds.
  R.drawJumper = function (ctx, x, y, face, t, air, squash) {
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.scale(1 + squash * 0.4, 1 - squash * 0.4);
    const legA = air ? -0.9 : 0.6;
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(-8 + s * 4, -10); ctx.rotate(legA + s * 0.1); R.cut(ctx, c => { c.beginPath(); c.moveTo(0, 0); c.lineTo(-10, 12); c.lineTo(-4, 24); c.lineTo(-7, 24); c.lineTo(-15, 12); c.lineTo(-4, -3); c.closePath(); }, '#5fb860', { line: 2.5, edge: 0, shadow: false }); ctx.restore(); }
    R.cut(ctx, c => { c.beginPath(); c.ellipse(0, -18, 22, 12, -0.15, 0, TAU); }, '#7fd45a', { line: 3, edge: 2 });
    R.cut(ctx, c => circle(c, 16, -24, 9), '#7fd45a', { line: 3, edge: 2 });
    ctx.fillStyle = '#fff'; circle(ctx, 18, -26, 4); ctx.fill(); ctx.fillStyle = INK; circle(ctx, 19, -26, 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, -32); ctx.lineTo(28, -44); ctx.moveTo(16, -33); ctx.lineTo(20, -46); ctx.stroke();
    ctx.restore();
  };
  // Trombone : pince à papier hérissée, ne s'écrase pas.
  R.drawSpiky = function (ctx, x, y, face, t) {
    ctx.save(); ctx.translate(x, y - 20); ctx.rotate(Math.sin(t * 6) * 0.08);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillStyle = '#c9ced6';
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 1.5, r1 = 20, r2 = 30; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.15) * r1, Math.sin(a - 0.15) * r1); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); ctx.lineTo(Math.cos(a + 0.15) * r1, Math.sin(a + 0.15) * r1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    R.cut(ctx, c => circle(c, 0, 0, 20), '#dfe3ea', { line: 3, edge: 0 });
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(-9, -8); ctx.arc(-3, -8, 6, Math.PI, 0); ctx.lineTo(3, 6); ctx.arc(-1, 6, 4, 0, Math.PI, true); ctx.stroke();
    ctx.fillStyle = '#fff'; circle(ctx, 6 * face, -5, 5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; circle(ctx, 6 * face, -5, 5); ctx.stroke(); ctx.fillStyle = INK; circle(ctx, 7 * face, -5, 2.2); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10 * face, -9); ctx.stroke();
    ctx.restore();
  };
  // Gomme : efface tout sur son passage.
  R.drawEraser = function (ctx, x, y, face, t, charging) {
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    if (charging) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-30, -10 - k * 10); ctx.lineTo(-50 - k * 6, -10 - k * 10); ctx.stroke(); } }
    const lean = charging ? -0.18 : 0; ctx.rotate(lean);
    R.cut(ctx, c => rr(c, -24, -34, 48, 34, 6), '#ff8fb0', { line: 3, edge: 2 });
    ctx.fillStyle = '#5ab8ff'; ctx.fillRect(-21, -34, 14, 31); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-7, -34); ctx.lineTo(-7, -3); ctx.stroke();
    ctx.fillStyle = '#fff'; circle(ctx, 6, -22, 5.5); ctx.fill(); circle(ctx, 16, -22, 5.5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; circle(ctx, 6, -22, 5.5); ctx.stroke(); circle(ctx, 16, -22, 5.5); ctx.stroke();
    ctx.fillStyle = INK; circle(ctx, 8 + (charging ? 1 : 0), -22, 2.3); ctx.fill(); circle(ctx, 18 + (charging ? 1 : 0), -22, 2.3); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1, -30); ctx.lineTo(10, -27); ctx.moveTo(21, -30); ctx.lineTo(12, -27); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -11); ctx.lineTo(17, -11); ctx.stroke();
    ctx.restore();
  };
  // Araignée de papier au bout de son fil.
  R.drawSpider = function (ctx, x, y, anchorY, t) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, anchorY); ctx.lineTo(x, y - 14); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, anchorY); ctx.lineTo(x, y - 14); ctx.stroke();
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const a = (i - 1.5) * 0.45, wig = Math.sin(t * 10 + i) * 3; ctx.beginPath(); ctx.moveTo(s * 8, -2 + i * 3); ctx.lineTo(s * (20 + Math.abs(a) * 10), -6 + i * 6 + wig); ctx.lineTo(s * (26 + Math.abs(a) * 10), 6 + i * 5 + wig); ctx.stroke(); }
    R.cut(ctx, c => circle(c, 0, 0, 14), '#5a3a6a', { line: 3, edge: 2 }); R.cut(ctx, c => circle(c, 0, 12, 9), '#5a3a6a', { line: 3, edge: 2 });
    ctx.fillStyle = '#ff5f7a'; for (const [ex, ey, r] of [[-5, -3, 3.5], [5, -3, 3.5], [-2, 3, 2], [2, 3, 2]]) { circle(ctx, ex, ey, r); ctx.fill(); }
    ctx.restore();
  };
  // Plante grignoteuse qui sort d'un tuyau (u : 0 rentrée … 1 sortie).
  R.drawPlant = function (ctx, x, baseY, u, t, color) {
    const hgt = 70 * u; if (hgt < 2) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 40, baseY - 200, 80, 200 - 4); ctx.clip();
    ctx.strokeStyle = '#3d8f5a'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - hgt + 20); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 4, baseY); ctx.lineTo(x - 4, baseY - hgt + 20); ctx.moveTo(x + 4, baseY); ctx.lineTo(x + 4, baseY - hgt + 20); ctx.stroke();
    const hy = baseY - hgt, open = 0.5 + 0.5 * Math.sin(t * 6);
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(x, hy + 6); ctx.rotate(s * open * 0.5); R.cut(ctx, c => { c.beginPath(); c.ellipse(0, s * -14, 22, 15, 0, 0, TAU); }, color || '#ff5f5f', { line: 3, edge: 2 }); ctx.fillStyle = '#fff'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 8 - 4, s * -2); ctx.lineTo(k * 8, s * -10); ctx.lineTo(k * 8 + 4, s * -2); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    ctx.fillStyle = '#fff'; for (const s of [-1, 1]) { circle(ctx, x + s * 8, hy - 6, 5); ctx.fill(); } ctx.strokeStyle = INK; ctx.lineWidth = 2; for (const s of [-1, 1]) { circle(ctx, x + s * 8, hy - 6, 5); ctx.stroke(); } ctx.fillStyle = INK; for (const s of [-1, 1]) { circle(ctx, x + s * 8, hy - 6, 2); ctx.fill(); }
    ctx.restore();
  };
  // Fût du canon (tourné vers le joueur) et boulet.
  R.drawCannonBarrel = function (ctx, x, y, dir, fire) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    R.cut(ctx, c => rr(c, 0, -12, 34 + fire * 6, 24, 10), '#55585f', { line: 3, edge: 0 }); ctx.fillStyle = '#2b2b30'; circle(ctx, 32 + fire * 6, 0, 8); ctx.fill();
    if (fire > 0) { ctx.globalAlpha = fire; R.blob(ctx, [{ x: 46, y: -6, r: 10 }, { x: 58, y: 2, r: 12 }, { x: 48, y: 10, r: 8 }], '#fff6e4', { line: 2.5, shadow: false }); }
    ctx.restore();
  };
  R.drawCannonball = function (ctx, x, y) { R.cut(ctx, c => circle(c, x, y, 13), '#2b2b30', { line: 2.5, edge: 2 }); ctx.fillStyle = 'rgba(255,255,255,0.35)'; circle(ctx, x - 4, y - 4, 4); ctx.fill(); };

  // ---------------------------------------------------------------- le héros
  // x, y : milieu des pieds. v : état visuel { face, flip (0..1), pose, walk, scaleX, scaleY }.
  R.drawHero = function (ctx, ch, x, y, v, t) {
    const F = root.FamilyHeads, size = ch.size || 1;
    // Proportions façon papier : grosse tête, petit corps. Les petits ont une tête encore plus grosse et un corps plus court.
    const hd = 32 + (1 - size) * 8, legH = 10 + 8 * size, torsoH = 12 + 16 * size;
    const sx = v.scaleX == null ? 1 : v.scaleX, sy = v.scaleY == null ? 1 : v.scaleY;
    ctx.save(); ctx.translate(x, y); ctx.scale(sx * (v.flipScale == null ? 1 : v.flipScale) * v.face, sy); ctx.rotate(v.rot || 0);
    const walk = v.walk || 0, pose = v.pose || 'idle';
    let legA = 0, legB = 0, armA = 0.3, armB = -0.3, bob = 0;
    if (pose === 'run') { legA = Math.sin(walk) * 0.9; legB = -legA; armA = -legA * 0.8 + 0.2; armB = legA * 0.8 - 0.2; bob = Math.abs(Math.cos(walk)) * 2; }
    else if (pose === 'jump') { legA = -0.9; legB = 0.3; armA = -2.4; armB = -2.2; }
    else if (pose === 'fall') { legA = 0.4; legB = -0.3; armA = -2.6 + Math.sin(t * 20) * 0.2; armB = -2.4 - Math.sin(t * 20) * 0.2; }
    else if (pose === 'dash') { legA = 1.2; legB = -1.0; armA = 2.6; armB = 2.4; }
    else if (pose === 'slide') { legA = 0.6; legB = 0.4; armA = -2.8; armB = 0.8; }
    else if (pose === 'win') { legA = -0.5; legB = 0.5; armA = -2.9; armB = -2.9; bob = Math.abs(Math.sin(t * 8)) * 6; }
    else if (pose === 'glide') { legA = 0.3; legB = -0.3; armA = -3; armB = -3; }
    else { bob = Math.sin(t * 2) * 1; }
    ctx.translate(0, -bob);
    const hipY = -legH, shoulderY = -legH - torsoH + 4;
    const limb = (ox, oy, ang, len, w, col) => { ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang); R.cut(ctx, c => rr(c, -w / 2, 0, w, len, w / 2), col, { line: 2.5, edge: 2, sx: 2, sy: 2 }); ctx.restore(); };
    // jambes et souliers
    limb(-6, hipY, legA, legH + 2, 10, ch.pants);
    limb(6, hipY, legB, legH + 2, 10, ch.pants);
    for (const [ox, a] of [[-6, legA], [6, legB]]) { ctx.save(); ctx.translate(ox, hipY); ctx.rotate(a); R.cut(ctx, c => { c.beginPath(); c.ellipse(3, legH + 2, 10, 5, 0, 0, TAU); }, '#5a3a2a', { line: 2.5, edge: 2, sx: 2, sy: 2 }); ctx.restore(); }
    // torse : trapèze
    R.cut(ctx, c => { c.beginPath(); c.moveTo(-12, shoulderY); c.lineTo(12, shoulderY); c.lineTo(15, hipY + 3); c.lineTo(-15, hipY + 3); c.closePath(); }, ch.outfit, { line: 3, edge: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-9, shoulderY + 4, 5, torsoH - 8);
    // bras
    const armLen = torsoH * 0.75;
    limb(11, shoulderY + 3, armB, armLen, 8, ch.outfit); limb(-11, shoulderY + 3, armA, armLen, 8, ch.outfit);
    for (const [ox, a] of [[11, armB], [-11, armA]]) { ctx.save(); ctx.translate(ox, shoulderY + 3); ctx.rotate(a); R.cut(ctx, c => circle(c, 0, armLen + 2, 5.5), '#f6d3b3', { line: 2.5, edge: 2, sx: 2, sy: 2 }); ctx.restore(); }
    if (pose === 'glide') { ctx.save(); ctx.translate(0, shoulderY - hd - 10); R.cut(ctx, c => { c.beginPath(); c.moveTo(34, 0); c.lineTo(-30, -14); c.lineTo(-18, 0); c.lineTo(-30, 12); c.closePath(); }, '#f6f1ff', { line: 3, edge: 2 }); ctx.restore(); }
    // tête (portrait)
    const headW = hd * 1.15, headH = hd * 1.3, hx = -headW / 2, hy = shoulderY - headH + 6;
    const view = v.view || (pose === 'idle' || pose === 'win' ? 'front' : 'side');
    ctx.save(); ctx.translate(0, hy + headH); ctx.rotate(v.headTilt || 0); ctx.translate(0, -(hy + headH));
    if (F && F.has(ch.id)) {
      // bord blanc + ombre autour du portrait pour le même effet découpé
      const img = F.frame(ch.id, view); if (img) { const ratio = Math.min(headW / img.width, headH / img.height), dw = img.width * ratio, dh = img.height * ratio, dx = hx + (headW - dw) / 2, dy = hy + headH - dh;
        ctx.save(); ctx.shadowColor = '#fffaf0'; ctx.shadowBlur = 0; for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, 2], [-2, 2], [2, -2]]) { ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy; ctx.drawImage(img, dx, dy, dw, dh); } ctx.restore();
        ctx.save(); ctx.shadowColor = 'rgba(40,25,10,0.25)'; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4; ctx.drawImage(img, dx, dy, dw, dh); ctx.restore(); }
    } else { R.cut(ctx, c => circle(c, 0, hy + headH / 2, hd / 2), '#f6d3b3', { line: 3, edge: 2 }); ctx.fillStyle = INK; circle(ctx, 5, hy + headH / 2 - 2, 2.5); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  };

  // ---------------------------------------------------------------- effets
  R.drawPuff = function (ctx, p) { const a = p.life / p.max; ctx.save(); ctx.globalAlpha = a; R.cut(ctx, c => circle(c, p.x, p.y, p.r * (1.6 - a * 0.6)), p.color || '#fff6e4', { line: 2.5, edge: 0, shadow: false }); ctx.restore(); };
  R.drawConfetti = function (ctx, p) { ctx.save(); ctx.globalAlpha = Math.min(1, p.life / p.max * 2); ctx.translate(p.x, p.y); ctx.rotate(p.rot); R.cut(ctx, c => { c.beginPath(); c.rect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2); }, p.color, { line: 2, edge: 0, shadow: false }); ctx.restore(); };
  R.drawPop = function (ctx, p) { const a = p.life / p.max; ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y - (1 - a) * 40); ctx.font = 'bold ' + (p.size || 22) + 'px ' + R.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText(p.text, 0, 0); ctx.fillStyle = p.color || '#ffd84a'; ctx.fillText(p.text, 0, 0); ctx.restore(); };

  // ---------------------------------------------------------------- course : cubes, objets, coureurs
  R.drawItemCube = function (ctx, x, y, t, gone) {
    const bob = Math.sin(t * 3 + x * 0.02) * 4, s = gone > 0 ? Math.max(0, 1 - gone / 0.3) : 1; if (s <= 0) return;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(Math.sin(t * 2 + x) * 0.15); ctx.scale(s, s);
    const hue = (t * 80 + x) % 360;
    R.cut(ctx, c => rr(c, -20, -20, 40, 40, 8), 'hsl(' + hue + ', 90%, 70%)', { line: 3, edge: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; rr(ctx, -14, -14, 12, 28, 4); ctx.fill();
    R.text(ctx, '?', 0, 1, 28, '#fffaf0', 'center', true);
    ctx.restore();
  };
  R.drawBall = function (ctx, x, y, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); R.cut(ctx, c => { c.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 13 + (i % 2) * 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }, '#fff6e4', { line: 2.5, edge: 2 }); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(2, 2); ctx.lineTo(-3, 7); ctx.stroke(); ctx.restore(); };
  R.drawHomingPlane = function (ctx, x, y, ang, color) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); R.cut(ctx, c => { c.beginPath(); c.moveTo(26, 0); c.lineTo(-20, -13); c.lineTo(-10, 0); c.lineTo(-20, 13); c.closePath(); }, color || '#ffd54a', { line: 3, edge: 2 }); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-10, 0); ctx.stroke(); ctx.restore(); };
  R.drawGlue = function (ctx, x, y, t) { ctx.save(); ctx.translate(x, y); R.cut(ctx, c => { c.beginPath(); c.ellipse(0, 0, 30, 9, 0, 0, TAU); c.ellipse(-14, -4, 12, 6, 0, 0, TAU); c.ellipse(16, -3, 10, 6, 0, 0, TAU); }, '#c9f0ff', { line: 2.5, edge: 0, sx: 2, sy: 2 }); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-8 + Math.sin(t * 3) * 3, -3, 8, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); };
  // Étoiles qui tournent autour d'un coureur étourdi
  R.drawStars = function (ctx, x, y, t) { ctx.fillStyle = '#ffe36b'; ctx.strokeStyle = INK; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.1, sx = x + Math.cos(a) * 26, sy = y + Math.sin(a) * 8; ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 3 : 7, ang = k / 10 * TAU - Math.PI / 2; ctx.lineTo(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); } };
  R.drawShieldRing = function (ctx, x, y, t, color) { ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(t * 6) * 0.1; ctx.strokeStyle = color || '#5ab8ff'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.ellipse(x, y, 34, 46, 0, 0, TAU); ctx.stroke(); ctx.restore(); };
  // Position (1er, 2e…) en gros, façon course
  R.drawPosition = function (ctx, x, y, pos, t) {
    const colors = ['#ffd54a', '#dfe3ea', '#e0a070', '#c9c2b8'];
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06);
    R.cut(ctx, c => rr(c, -44, -34, 88, 68, 16), colors[pos - 1] || '#fff', { line: 3.5, edge: 0 });
    R.text(ctx, String(pos), -6, 2, 48, INK, 'center'); R.text(ctx, pos === 1 ? 'er' : 'e', 22, -8, 20, INK, 'center');
    ctx.restore();
  };
  R.drawItemBox = function (ctx, x, y, icon, rolling, t) {
    R.cut(ctx, c => rr(c, x - 36, y - 36, 72, 72, 14), '#fffaf0', { line: 3.5, edge: 0 });
    if (icon) { ctx.save(); if (rolling) { ctx.translate(x, y); ctx.scale(1 + Math.sin(t * 30) * 0.1, 1); ctx.translate(-x, -y); } ctx.font = '40px ' + R.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, x, y + 2); ctx.restore(); }
    else { ctx.save(); ctx.globalAlpha = 0.25; R.text(ctx, '?', x, y + 2, 40, INK, 'center'); ctx.restore(); }
  };
  R.drawTrophy = function (ctx, x, y, kind, size) {
    const col = { gold: '#ffd54a', silver: '#dfe3ea', bronze: '#e0a070' }[kind] || '#cfc8bd'; const s = size / 60;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    R.cut(ctx, c => { c.beginPath(); c.moveTo(-22, -30); c.lineTo(22, -30); c.quadraticCurveTo(22, 8, 0, 12); c.quadraticCurveTo(-22, 8, -22, -30); c.closePath(); }, col, { line: 3, edge: 2 });
    R.cut(ctx, c => { c.beginPath(); c.rect(-5, 12, 10, 10); c.rect(-16, 22, 32, 8); }, col, { line: 3, edge: 2 });
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-26, -14, 10, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(26, -14, 10, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
    ctx.restore();
  };

  // Étiquette de papier (HUD).
  R.label = function (ctx, x, y, w, h, fill) { R.cut(ctx, c => rr(c, x, y, w, h, 12), fill || '#fffaf0', { line: 3, edge: 0, sx: 3, sy: 4 }); };
  R.text = function (ctx, txt, x, y, size, color, align, stroke) {
    ctx.font = 'bold ' + size + 'px ' + R.FONT; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = INK; ctx.strokeText(txt, x, y); }
    ctx.fillStyle = color || INK; ctx.fillText(txt, x, y);
  };
})(window);
