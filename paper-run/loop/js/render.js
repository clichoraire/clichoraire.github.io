// Paper Loop — rendu façon papier découpé (repris de Paper Run) : contours épais, bord blanc, ombres portées.
// Nouveautés : mur de carton de l'usine, machines de la boutique, panneau de course, tirelire, affiche des commandes, clones.
(function (root) {
  'use strict';
  const PL = root.PL = root.PL || {};
  const T = 48, TAU = Math.PI * 2;
  const INK = '#2b1f1a';            // couleur des contours
  const R = PL.render = {};
  R.FONT = '"Fredoka", "Chalkboard SE", "Marker Felt", "Comic Sans MS", sans-serif';
  R.INK = INK;
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
  // Punaises : deux par case, tête ronde colorée et pointe vers le haut.
  R.drawTacks = function (ctx, px, py, rnd) {
    const cols = ['#ff5f5f', '#4f9dff', '#ffd54a', '#6cdc6c'];
    for (let i = 0; i < 2; i++) {
      const cx = px + 12 + i * 24, base = py + T, col = cols[Math.floor(rnd() * cols.length)];
      ctx.beginPath(); ctx.moveTo(cx - 2, base - 16); ctx.lineTo(cx, base - 36); ctx.lineTo(cx + 2, base - 16); ctx.closePath(); ctx.fillStyle = '#c9ced6'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      R.cut(ctx, c => { c.beginPath(); c.moveTo(cx - 9, base - 18); c.lineTo(cx + 9, base - 18); c.lineTo(cx + 5, base - 10); c.lineTo(cx + 9, base - 2); c.lineTo(cx - 9, base - 2); c.lineTo(cx - 5, base - 10); c.closePath(); }, col, { line: 2.5, edge: 0, sx: 2, sy: 2 });
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
  // Étiquette de papier (HUD).
  R.label = function (ctx, x, y, w, h, fill) { R.cut(ctx, c => rr(c, x, y, w, h, 12), fill || '#fffaf0', { line: 3, edge: 0, sx: 3, sy: 4 }); };
  R.text = function (ctx, txt, x, y, size, color, align, stroke) {
    ctx.font = 'bold ' + size + 'px ' + R.FONT; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = INK; ctx.strokeText(txt, x, y); }
    ctx.fillStyle = color || INK; ctx.fillText(txt, x, y);
  };

  // ---------------------------------------------------------------- l'usine : mur de carton (fond) et terrain
  // Fond : grand mur kraft avec des panneaux de carton rivetés (attaches parisiennes) et quelques bouts de ruban.
  R.makeWall = function (lvl, seed) {
    const rnd = rng(seed || 11), panels = [], tapes = [];
    for (let i = 0; i < 70; i++) panels.push({ x: rnd() * lvl.pw, y: rnd() * lvl.ph, w: 180 + rnd() * 360, h: 120 + rnd() * 260, tone: Math.floor(rnd() * 3) });
    for (let i = 0; i < 40; i++) tapes.push({ x: rnd() * lvl.pw, y: rnd() * lvl.ph, rot: (rnd() - 0.5) * 0.8, w: 40 + rnd() * 50 });
    return { panels, tapes };
  };
  R.drawWall = function (ctx, wall, cam, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e6d3ae'); g.addColorStop(1, '#d9c29a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const tones = ['#e9d8b6', '#e2cea6', '#ecdcbd'];
    for (const p of wall.panels) {
      const x = p.x - cam.x * 0.9, y = p.y - cam.y * 0.9; if (x + p.w < -20 || x > W + 20 || y + p.h < -20 || y > H + 20) continue;
      ctx.fillStyle = 'rgba(40,25,10,0.08)'; rr(ctx, x + 4, y + 5, p.w, p.h, 10); ctx.fill();
      ctx.fillStyle = tones[p.tone]; rr(ctx, x, y, p.w, p.h, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,20,0.18)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(60,40,20,0.22)';
      for (const [bx, by] of [[x + 12, y + 12], [x + p.w - 12, y + 12], [x + 12, y + p.h - 12], [x + p.w - 12, y + p.h - 12]]) { circle(ctx, bx, by, 4); ctx.fill(); }
    }
    for (const t of wall.tapes) {
      const x = t.x - cam.x * 0.9, y = t.y - cam.y * 0.9; if (x < -80 || x > W + 80 || y < -40 || y > H + 40) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t.rot); ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff1c2'; ctx.fillRect(-t.w / 2, -7, t.w, 14); ctx.restore();
    }
  };

  // Terrain pré-rendu : blocs de carton ondulé avec un bord de papier clair sur les faces exposées, punaises, plateformes.
  // Le terrain est pré-dessiné en morceaux de 2048 px de large (un seul canvas de 10 000 px dépasse la limite de Safari).
  R.renderTerrain = function (lvl) {
    const CHUNK = 2048, chunks = [];
    for (let x0 = 0; x0 < lvl.pw; x0 += CHUNK) { const cv = document.createElement('canvas'); cv.width = Math.min(CHUNK, lvl.pw - x0); cv.height = lvl.ph; const c = cv.getContext('2d'); c.translate(-x0, 0); drawTerrain(c, lvl, x0, x0 + cv.width); chunks.push({ cv, x0 }); }
    return { chunks, w: lvl.pw, h: lvl.ph };
  };
  function drawTerrain(ctx, lvl, px0, px1) {
    const tx0 = Math.max(0, Math.floor(px0 / T) - 2), tx1 = Math.min(lvl.w - 1, Math.ceil(px1 / T) + 2);   // seules les cases du morceau (et leurs voisines)
    const G = PL.TILE, grid = lvl.grid, w = lvl.w, h = lvl.h;
    const at = (x, y) => (x < 0 || x >= w) ? G.SOLID : (y < 0 || y >= h) ? G.SOLID : grid[y * w + x];
    const solid = v => v === G.SOLID;
    const rnd = rng(lvl.w * 31 + lvl.h);
    ctx.save(); ctx.translate(5, 7); ctx.fillStyle = 'rgba(40,25,10,0.22)';
    for (let y = 0; y < h; y++) for (let x = tx0; x <= tx1; x++) if (solid(grid[y * w + x])) ctx.fillRect(x * T, y * T, T, T);
    ctx.restore();
    for (let y = 0; y < h; y++) for (let x = tx0; x <= tx1; x++) {
      const v = grid[y * w + x], px = x * T, py = y * T;
      if (!solid(v)) continue;
      ctx.fillStyle = '#d4a976'; ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 10; k < T; k += 12) { ctx.moveTo(px + 6, py + k); ctx.lineTo(px + T - 6, py + k); }
      ctx.stroke();
      if (!solid(at(x, y - 1))) { ctx.fillStyle = '#f3e4c6'; ctx.fillRect(px, py, T, 12); ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(px, py + 12, T, 3); }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath();
    for (let y = 0; y < h; y++) for (let x = tx0; x <= tx1; x++) {
      if (!solid(grid[y * w + x])) continue;
      const px = x * T, py = y * T;
      if (!solid(at(x, y - 1))) { ctx.moveTo(px, py); ctx.lineTo(px + T, py); }
      if (!solid(at(x, y + 1))) { ctx.moveTo(px, py + T); ctx.lineTo(px + T, py + T); }
      if (!solid(at(x - 1, y))) { ctx.moveTo(px, py); ctx.lineTo(px, py + T); }
      if (!solid(at(x + 1, y))) { ctx.moveTo(px + T, py); ctx.lineTo(px + T, py + T); }
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,235,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let y = 0; y < h; y++) for (let x = tx0; x <= tx1; x++) {
      if (!solid(grid[y * w + x])) continue;
      const px = x * T, py = y * T;
      if (!solid(at(x - 1, y))) { ctx.moveTo(px + 4, py); ctx.lineTo(px + 4, py + T); }
      if (!solid(at(x, y + 1))) { ctx.moveTo(px, py + T - 4); ctx.lineTo(px + T, py + T - 4); }
    }
    ctx.stroke();
    for (let y = 0; y < h; y++) for (let x = tx0; x <= tx1; x++) {
      const v = grid[y * w + x], px = x * T, py = y * T;
      if (v === G.ONEWAY) {
        const left = at(x - 1, y) !== G.ONEWAY, right = at(x + 1, y) !== G.ONEWAY;
        R.cut(ctx, c => { c.beginPath(); c.rect(px - (left ? 0 : 6), py + 2, T + (left ? 0 : 6) + (right ? 0 : 6), 16); }, '#8fb7d9', { line: 3, edge: 0, sx: 3, sy: 5 });
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(px + 2, py + 5, T - 4, 3);
        ctx.fillStyle = 'rgba(40,25,10,0.25)'; circle(ctx, px + 10, py + 13, 2.2); ctx.fill(); circle(ctx, px + T - 10, py + 13, 2.2); ctx.fill();
      } else if (v === G.SPIKE) R.drawTacks(ctx, px, py, rnd);
      else if (v === G.SPIKE_D || v === G.SPIKE_L || v === G.SPIKE_R) { ctx.save(); ctx.translate(px + T / 2, py + T / 2); ctx.rotate(v === G.SPIKE_D ? Math.PI : v === G.SPIKE_L ? -Math.PI / 2 : Math.PI / 2); R.drawTacks(ctx, -T / 2, -T / 2, rnd); ctx.restore(); }
    }
  }

  // ---------------------------------------------------------------- objets de l'usine
  // Pièce d'or (icône) : utilisée dans le HUD et sur les machines.
  R.coinIcon = function (ctx, x, y, r) {
    R.cut(ctx, c => circle(c, x, y, r), '#ffd84a', { line: 2.5, edge: 0, sx: 2, sy: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, b = a + TAU / 10; ctx.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); ctx.lineTo(x + Math.cos(b) * r * 0.25, y + Math.sin(b) * r * 0.25); } ctx.closePath(); ctx.fill();
  };

  // Machine distributrice : boîte de carton, écran avec le prix, nom, bande orange. x = centre, base = y du plancher.
  // m : { title: [lignes], sub, price, state: 'can' | 'poor' | 'done', count, near }
  R.drawMachine = function (ctx, x, base, m, t) {
    const w = 92, h = 150, left = x - w / 2, top = base - h;
    const bump = m.near ? Math.sin(t * 6) * 2 : 0;
    ctx.save(); ctx.translate(0, bump);
    R.cut(ctx, c => rr(c, left, top, w, h, 10), '#efe3c8', { line: 3, edge: 3, sx: 4, sy: 5 });
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; rr(ctx, left + 4, top + 4, w - 8, 10, 4); ctx.fill();
    // écran
    R.cut(ctx, c => rr(c, left + 8, top + 12, w - 16, 34, 7), '#3a3330', { line: 2.5, edge: 0, shadow: false });
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; rr(ctx, left + 11, top + 15, w - 22, 10, 4); ctx.fill();
    if (m.state === 'done') R.text(ctx, m.done || 'Acheté', x, top + 30, 15, '#7fd45a', 'center');
    else { const ps = PL.fmtGold(m.price); R.coinIcon(ctx, left + 22, top + 29, 8); R.text(ctx, ps, left + 34, top + 30, ps.length > 4 ? 14 : 17, m.state === 'can' ? '#9be46b' : '#ff9e5e', 'left'); }
    // nom
    let y = top + 64; for (const line of m.title) { R.text(ctx, line, x, y, line.length > 9 ? 14 : 17, INK, 'center'); y += 18; }
    R.text(ctx, m.sub, x, top + 112, 11, '#8a7a6a', 'center');
    // compteur
    if (m.count) { R.cut(ctx, c => rr(c, x - 24, top + 122, 48, 14, 6), '#fff1b8', { line: 2, edge: 0, shadow: false }); R.text(ctx, '×' + m.count, x, top + 129, 11, INK, 'center'); }
    // bande du bas
    R.cut(ctx, c => rr(c, left + 2, base - 16, w - 4, 16, 6), '#ff8f5e', { line: 2.5, edge: 0, shadow: false });
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = left + 10; k < left + w - 10; k += 8) ctx.fillRect(k, base - 12, 4, 8);
    ctx.restore();
  };

  // Bulle au-dessus d'une machine : « E · Acheter ».
  R.drawPrompt = function (ctx, x, y, txt, color) {
    ctx.save(); ctx.font = 'bold 15px ' + R.FONT; const w = ctx.measureText(txt).width + 26;
    R.cut(ctx, c => { rr(c, x - w / 2, y - 30, w, 30, 10); c.moveTo(x - 6, y); c.lineTo(x, y + 8); c.lineTo(x + 6, y); c.closePath(); }, color || '#fffaf0', { line: 2.5, edge: 0, sx: 2, sy: 3 });
    R.text(ctx, txt, x, y - 15, 15, INK, 'center'); ctx.restore();
  };

  // Panneau de course (sombre, chiffres en vert/orange) et bannière avec le nom.
  R.drawSign = function (ctx, x, y, s) {
    const w = 236, h = 140;
    R.cut(ctx, c => rr(c, x, y, w, h, 12), '#3a3330', { line: 3, edge: 3, sx: 4, sy: 5 });
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; rr(ctx, x + 6, y + 6, w - 12, 20, 6); ctx.fill();
    const rs = PL.fmtGold(s.reward); R.text(ctx, 'Récompense', x + 14, y + 26, 18, '#9be46b'); R.coinIcon(ctx, x + w - 52 - (rs.length > 3 ? 14 : 0), y + 26, 9); R.text(ctx, rs, x + w - 38 - (rs.length > 3 ? 14 : 0), y + 27, rs.length > 5 ? 16 : 20, '#9be46b');
    R.text(ctx, 'Multiplicateur des clones', x + 14, y + 48, 13, '#9be46b'); R.text(ctx, PL.fmtMult(s.cloneMult == null ? 0.1 : s.cloneMult), x + w - 14, y + 49, 14, '#9be46b', 'right');
    R.text(ctx, 'Meilleur temps', x + 14, y + 80, 16, '#ff9e5e'); R.text(ctx, s.best == null ? '-- . --' : PL.fmtTime(s.best), x + w - 14, y + 81, 18, '#ff9e5e', 'right');
    if (s.medal) R.star(ctx, x + w - 78, y + 80, 9, s.medal === 'gold' ? '#ffd84a' : '#dfe5ec', 1.5);   // étoile d'argent ou d'or : record sous le temps de la médaille
    R.text(ctx, s.clones + (s.clones > 1 ? ' clones' : ' clone'), x + w / 2, y + 116, 20, '#ff9e5e', 'center');
    if (s.active) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(s.t * 8) * 0.3; R.text(ctx, '●', x + w - 16, y + 116, 14, '#9be46b', 'center'); ctx.restore(); }
  };
  R.drawBanner = function (ctx, x, y, w, txt) {
    R.cut(ctx, c => rr(c, x, y, w, 44, 6), '#ffb067', { line: 3, edge: 2, sx: 3, sy: 4 });
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let k = x + 8; k < x + w - 8; k += 14) ctx.fillRect(k, y + 6, 6, 32);
    R.text(ctx, txt, x + w / 2, y + 23, 30, '#fffaf0', 'center', true);
  };

  // Tirelire (le but de la course) : cochon rose avec une fente ; sautille quand une pièce entre.
  // Étoile à cinq branches (pleine) centrée en x, y.
  R.star = function (ctx, x, y, r, color, line) {
    R.cut(ctx, c => { c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, b = a + TAU / 10; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45); } c.closePath(); }, color, { line: line == null ? 2 : line, edge: 0, sx: 1, sy: 1 });
  };
  // Médaille d'argent (ruban + disque + étoile), accrochée au point x, y (haut du ruban).
  R.drawMedal = function (ctx, x, y, r, t, kind) {
    const gold = kind === 'gold';
    ctx.save(); ctx.translate(x, y);
    R.cut(ctx, c => { c.beginPath(); c.moveTo(-r * 0.55, 0); c.lineTo(r * 0.55, 0); c.lineTo(r * 0.3, r * 1.3); c.lineTo(-r * 0.3, r * 1.3); c.closePath(); }, gold ? '#d9342b' : '#5a9bd8', { line: 2, edge: 0, sx: 1, sy: 1 });
    R.cut(ctx, c => circle(c, 0, r * 1.9, r), gold ? '#ffd84a' : '#d9dfe6', { line: 2.5, edge: 0, sx: 2, sy: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; circle(ctx, -r * 0.3, r * 1.6, r * 0.35); ctx.fill();
    R.star(ctx, 0, r * 1.9, r * 0.55, '#f4f7fa', 1.5);
    ctx.restore();
  };
  // Tirelire. medal : 'silver' ou 'gold' → tirelire argentée ou dorée, brillante (médailles de la course).
  R.drawPiggy = function (ctx, x, base, t, happy, medal) {
    const hop = happy > 0 ? Math.abs(Math.sin(happy * 20)) * 8 : 0, silver = !!medal, gold = medal === 'gold';
    const body = gold ? '#ffd84a' : silver ? '#dfe5ec' : '#ff9ec4', dark = gold ? '#e0a800' : silver ? '#c3ccd6' : '#f58fb6', snout = gold ? '#f2c230' : silver ? '#cfd7e0' : '#ff7fb0';
    ctx.save(); ctx.translate(x, base - hop);
    for (const lx of [-16, -4, 8, 20]) R.cut(ctx, c => rr(c, lx, -12, 10, 12, 4), dark, { line: 2.5, edge: 0, sx: 2, sy: 2 });
    R.blob(ctx, [{ x: 0, y: -34, r: 30 }, { x: 24, y: -28, r: 18 }, { x: -30, y: -20, w: 20, h: 10 }], body, { line: 3, edge: 3 });
    if (silver) { ctx.save(); ctx.globalAlpha = 0.7; const g = ctx.createLinearGradient(-30, -64, 30, -4); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.9)'); g.addColorStop(0.55, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -34, 26, 22, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    R.cut(ctx, c => { c.beginPath(); c.moveTo(8, -58); c.lineTo(16, -74); c.lineTo(26, -56); c.closePath(); }, body, { line: 2.5, edge: 2, shadow: false });
    R.cut(ctx, c => { c.beginPath(); c.ellipse(36, -28, 10, 8, 0, 0, TAU); }, snout, { line: 2.5, edge: 0, shadow: false });
    ctx.fillStyle = INK; circle(ctx, 33, -29, 1.8); ctx.fill(); circle(ctx, 39, -29, 1.8); ctx.fill();
    ctx.fillStyle = '#fff'; circle(ctx, 18, -40, 5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; circle(ctx, 18, -40, 5); ctx.stroke(); ctx.fillStyle = INK; circle(ctx, 20, -40, 2.2); ctx.fill();
    ctx.fillStyle = INK; rr(ctx, -12, -64, 22, 5, 2); ctx.fill();
    if (silver) for (let i = 0; i < 4; i++) {   // petites étoiles qui scintillent
      const ph = t * 2.2 + i * 1.7, s = Math.max(0, Math.sin(ph)); if (s < 0.05) continue;
      const sx = [-34, 30, -8, 40][i], sy = [-66, -70, -84, -48][i];
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(ph * 0.5); ctx.scale(s, s); R.star(ctx, 0, 0, 7, '#ffffff', 1.5); ctx.restore();
    }
    ctx.restore();
  };

  // Affiche des commandes dans la salle de départ (feuille de papier épinglée au mur).
  R.drawPoster = function (ctx, x, y, w, h, touch) {
    R.cut(ctx, c => rr(c, x, y, w, h, 8), '#fffaf0', { line: 3, edge: 0, sx: 4, sy: 5 });
    ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffe9a8'; ctx.translate(x + w / 2, y + 2); ctx.rotate(-0.08); ctx.fillRect(-30, -8, 60, 16); ctx.restore();
    R.text(ctx, 'COMMANDES', x + w / 2, y + 30, 22, INK, 'center');
    const key = (kx, ky, s, label, size) => { R.cut(ctx, c => rr(c, kx - s / 2, ky - s / 2, s, s, 7), '#f3e4c6', { line: 2.5, edge: 0, sx: 2, sy: 3 }); R.text(ctx, label, kx, ky + 1, size || 16, INK, 'center'); };
    const cx = x + w / 2;
    key(cx, y + 70, 34, 'W'); key(cx - 40, y + 108, 34, 'A'); key(cx, y + 108, 34, 'S'); key(cx + 40, y + 108, 34, 'D');
    R.text(ctx, '← →   courir', x + 18, y + 146, 15, '#5a4a3a');
    R.cut(ctx, c => rr(c, cx - 70, y + 164, 140, 30, 8), '#f3e4c6', { line: 2.5, edge: 0, sx: 2, sy: 3 }); R.text(ctx, 'Espace', cx, y + 179, 15, INK, 'center');
    R.text(ctx, '↑ ou Espace : sauter', x + 18, y + 214, 15, '#5a4a3a');
    key(x + 34, y + 246, 30, '⤒', 15); R.text(ctx, 'sous une boîte : acheter', x + 56, y + 247, 15, '#5a4a3a');
    if (touch) R.text(ctx, '(ou les boutons à l’écran)', cx, y + h - 16, 12, '#8a7a6a', 'center');
  };

  // Flèche orange (« par ici ») qui pulse.
  // Plateforme mobile (repris de Paper Run).
  R.drawMover = function (ctx, x, y, w, h, vertical, t) {
    R.cut(ctx, c => rr(c, x, y, w, h, 6), '#d8b57a', { line: 3, edge: 0, sx: 3, sy: 5 });
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 6, y + 4, w - 12, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 10; k < w - 6; k += 14) ctx.fillRect(x + k, y + 10, 6, h - 14);
    ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#ffe9a8'; ctx.translate(x + w / 2, y + 2); ctx.rotate(-0.1); ctx.fillRect(-14, -5, 28, 10); ctx.restore();
  };

  R.drawArrow = function (ctx, x, y, t, dir) {
    const bob = Math.sin(t * 4) * 6;
    ctx.save(); ctx.translate(x, y + (dir === 'up' ? bob : dir === 'down' ? -bob : 0)); if (dir === 'up') ctx.rotate(-Math.PI / 2); else if (dir === 'down') ctx.rotate(Math.PI / 2); else if (dir === 'left') { ctx.translate(-bob, 0); ctx.rotate(Math.PI); } else ctx.translate(bob, 0);
    R.cut(ctx, c => { c.beginPath(); c.moveTo(-30, -12); c.lineTo(8, -12); c.lineTo(8, -26); c.lineTo(34, 0); c.lineTo(8, 26); c.lineTo(8, 12); c.lineTo(-30, 12); c.closePath(); }, '#ffb067', { line: 3, edge: 2 });
    ctx.restore();
  };

  // Grande roue de papier (décor de la salle 1 du tableau 2) : anneau, rayons qui tournent, moyeu et une manivelle.
  R.drawWheel = function (ctx, cx, cy, r, t) {
    ctx.save(); ctx.translate(cx, cy);
    R.cut(ctx, c => { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.moveTo(r - 14, 0); c.arc(0, 0, r - 14, 0, TAU, true); }, '#c9b48c', { line: 3, edge: 2, sx: 4, sy: 5 });
    ctx.save(); ctx.rotate(t * 1.6);   // tourne bien visiblement : un rayon est rouge pour qu'on voie le mouvement
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); R.cut(ctx, c => rr(c, -r + 10, -5, 2 * r - 20, 10, 4), '#e4c28f', { line: 2.5, edge: 0, shadow: false }); ctx.restore(); }
    R.cut(ctx, c => rr(c, 0, -5, r - 10, 10, 4), '#ff5f5f', { line: 2.5, edge: 0, shadow: false });
    ctx.restore();
    R.cut(ctx, c => circle(c, 0, 0, 12), '#8d6e63', { line: 2.5, edge: 0, sx: 2, sy: 2 });
    ctx.save(); ctx.rotate(-0.5); R.cut(ctx, c => rr(c, 0, -4, r + 40, 8, 4), '#5a4a3a', { line: 2.5, edge: 0, sx: 2, sy: 2 }); ctx.restore();
    ctx.restore();
  };

  // Drapeau de départ planté au sol : mât et fanion de papier avec le mot.
  R.drawFlag = function (ctx, x, base, txt, t) {
    rr(ctx, x - 3, base - 96, 6, 96, 3); ctx.fillStyle = '#e4c28f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.translate(x + 3, base - 94); const wave = Math.sin(t * 5) * 3;
    R.cut(ctx, c => { c.beginPath(); c.moveTo(0, 0); c.lineTo(84, 10 + wave); c.lineTo(0, 30); c.closePath(); }, '#7fd45a', { line: 2.5, edge: 2, sx: 2, sy: 3 });
    R.text(ctx, txt, 30, 16, 12, '#fffaf0', 'center', true); ctx.restore();
  };

  // Panneau « À suivre » planté au sol.
  R.drawTodo = function (ctx, x, base, t) {
    rr(ctx, x - 5, base - 110, 10, 110, 4); ctx.fillStyle = '#e4c28f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); ctx.translate(x, base - 120); ctx.rotate(Math.sin(t * 1.5) * 0.03);
    R.cut(ctx, c => rr(c, -110, -60, 220, 76, 10), '#fffaf0', { line: 3, edge: 0, sx: 4, sy: 5 });
    R.text(ctx, 'À suivre…', 0, -32, 26, INK, 'center'); R.text(ctx, 'Le tableau 2 arrive bientôt !', 0, -4, 14, '#5a4a3a', 'center');
    ctx.restore();
  };

  // Clone de papier : le héros en gris, un peu transparent.
  // Les clones sont des sprites mis en cache : dessiner un héros coûte une trentaine de formes découpées, et le filtre
  // ctx.filter = 'grayscale' (l'ancienne méthode) multipliait ce coût par ~1000. On dessine donc le héros une seule fois par
  // personnage, pose et phase d'animation, on le passe en gris pixel par pixel (sans filtre), et chaque clone n'est plus
  // qu'un drawImage.
  const cloneCache = new Map(), CLONE_PHASES = 12, CLONE_SS = 2, CW = 120, CH = 140, CFEET = 16;
  const CLONE_POSES = ['idle', 'run', 'jump', 'fall', 'slide', 'win'];
  let scratch = null;
  R.clonePhase = function (pose, walk, t) {   // phase 0..1 de l'animation selon la pose (voir drawHero)
    const p = pose === 'run' ? walk / TAU : pose === 'win' ? t * 8 / TAU : pose === 'fall' ? t * 20 / TAU : pose === 'idle' ? t * 2 / TAU : 0;
    return p - Math.floor(p);
  };
  function cloneSprite(ch, pose, k) {
    const key = ch.id + '|' + pose + '|' + k; let cv = cloneCache.get(key); if (cv) return cv;
    const F = root.FamilyHeads; if (F && F.has(ch.id) && !F.frame(ch.id, 'front')) return null;   // portrait pas encore chargé : on attend
    const W = CW * CLONE_SS, H = CH * CLONE_SS;
    if (!scratch) { scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H; }
    const sc = scratch.getContext('2d', { willReadFrequently: true }); sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, W, H); sc.scale(CLONE_SS, CLONE_SS);
    const ph = (k / CLONE_PHASES) * TAU;   // on choisit walk et t pour retomber sur cette phase
    R.drawHero(sc, ch, CW / 2, CH - CFEET, { face: 1, pose, walk: ph }, pose === 'win' ? ph / 8 : pose === 'fall' ? ph / 20 : ph / 2);
    const im = sc.getImageData(0, 0, W, H), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8; d[i] = d[i + 1] = d[i + 2] = l; }
    cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').putImageData(im, 0, 0);
    cloneCache.set(key, cv); return cv;
  }
  // Prépare d'avance tous les sprites d'un personnage (évite les petits à-coups à la première apparition de chaque pose).
  R.warmClones = function (ch) { for (const pose of CLONE_POSES) for (let k = 0; k < CLONE_PHASES; k++) if (!cloneSprite(ch, pose, k)) return false; return true; };
  R.cloneCacheSize = () => cloneCache.size;
  R.drawClone = function (ctx, ch, x, y, v, t) {
    const pose = v.pose || 'idle', k = Math.round(R.clonePhase(pose, v.walk || 0, t) * CLONE_PHASES) % CLONE_PHASES;
    const cv = cloneSprite(ch, pose, k);
    ctx.save(); ctx.globalAlpha = v.alpha == null ? 0.6 : v.alpha;   // opacité : pleine près du héros, effacée au loin (voir game.js)
    if (cv) { ctx.translate(x, y); ctx.scale(v.face || 1, 1); ctx.drawImage(cv, -CW / 2, -(CH - CFEET), CW, CH); }
    else { try { ctx.filter = 'grayscale(100%)'; } catch (e) { } R.drawHero(ctx, ch, x, y, v, t); }
    ctx.restore();
  };
})(window);
