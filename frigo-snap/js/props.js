// Frigo Snap — accessoires du décor en volume : boîtes en vraie 3D (faces projetées et ombrées) et objets ronds ou
// cylindriques en sprites à dégradés (fruits, bocaux, canettes, bouteilles). Tout est dessiné sans image.
(function (FS) {
  'use strict';
  const P = FS.Props = {};
  const TAU = Math.PI * 2, OUT = '#26211f';
  const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgb = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
  const shade = (c, k) => c[0] !== '#' ? c : rgb(hex(c).map(v => Math.min(255, v * k)));
  const lighten = (c, t) => c[0] !== '#' ? c : rgb(hex(c).map(v => v + (255 - v) * t));
  P.shade = shade; P.lighten = lighten;
  const outline = (ctx, lw) => { ctx.lineWidth = lw == null ? 0.05 : lw; ctx.strokeStyle = OUT; ctx.stroke(); };

  // ---- dégradés de volume
  function sphereFill(ctx, cx, cy, rx, ry, color) { const g = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.42, Math.min(rx, ry) * 0.08, cx, cy, Math.max(rx, ry) * 1.18); g.addColorStop(0, lighten(color, 0.55)); g.addColorStop(0.35, lighten(color, 0.12)); g.addColorStop(0.75, color); g.addColorStop(1, shade(color, 0.5)); return g; }
  function sphere(ctx, cx, cy, rx, ry, color, lw) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fillStyle = sphereFill(ctx, cx, cy, rx, ry, color); ctx.fill(); if (lw !== 0) outline(ctx, lw); }
  function cylFill(ctx, x0, x1, color, glass) { const g = ctx.createLinearGradient(x0, 0, x1, 0); if (glass) { g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.12, 'rgba(255,255,255,0.1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.5)'); g.addColorStop(0.45, 'rgba(255,255,255,0.08)'); g.addColorStop(0.85, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(120,140,150,0.45)'); return g; } g.addColorStop(0, shade(color, 0.5)); g.addColorStop(0.2, color); g.addColorStop(0.34, lighten(color, 0.45)); g.addColorStop(0.5, lighten(color, 0.1)); g.addColorStop(0.8, color); g.addColorStop(1, shade(color, 0.42)); return g; }
  function contact(ctx, rx) { ctx.beginPath(); ctx.ellipse(0, 0, rx, rx * 0.22, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill(); }
  // ellipse de dessus (pour les objets vus un peu de haut) et bandeau sombre en bas
  function cylinder(ctx, x0, x1, y0, y1, color, r) { // r : rayon des coins
    ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r || 0.02); ctx.fillStyle = cylFill(ctx, x0, x1, color); ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, y1, (x1 - x0) / 2, (x1 - x0) * 0.09, 0, 0, Math.PI); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
  }

  // ------------------------------------------------------------------ sprites (objets ronds et cylindriques)
  const DIMS = { carrot: [4.6, 1.4], lettuce: [1.3, 1.0], tomato: [1.2, 1.15], pepper: [0.9, 1.3], jar: [1.1, 1.25], yogurt: [1.0, 1.1], bread: [1.8, 1.0], bottle: [0.45, 1.3], foil: [1.4, 1.0], cave: [1.6, 1.1], peabag: [1.1, 1.2], icewall: [1.8, 0.7], tub: [1.2, 1.0],
    can: [0.7, 1.1], grapes: [1.0, 1.1], lemon: [1.0, 0.7], onion: [0.9, 1.1], broccoli: [1.2, 1.3], apple: [0.9, 1.0], cupcake: [0.8, 1.0], mug: [1.1, 0.9], spoon: [1.6, 0.4], brokenjar: [1.4, 0.9], shelfpiece: [1.8, 1.1], shards: [1.5, 0.4], icicle: [0.5, 1.3], bulb: [0.6, 1.6], cobweb: [1.2, 1.0] };
  P.dims = p => { const d = DIMS[p.kind] || [1, 1]; return { w: d[0] * (p.s || 1), h: d[1] * (p.s || 1) }; };
  const S = P.sprites = {
    carrot(ctx, p) { const s = p.s; ctx.save(); ctx.rotate((p.rot || 0) * 0.3); ctx.beginPath(); ctx.moveTo(-2 * s, -0.5 * s); ctx.quadraticCurveTo(0, -0.95 * s, 2 * s, -0.55 * s); ctx.quadraticCurveTo(2.1 * s, -0.4 * s, 1.9 * s, -0.3 * s); ctx.quadraticCurveTo(0, 0, -2 * s, -0.5 * s); const g = ctx.createLinearGradient(0, -0.95 * s, 0, 0); g.addColorStop(0, '#ffb74d'); g.addColorStop(0.45, '#f57c00'); g.addColorStop(1, '#b84a00'); ctx.fillStyle = g; ctx.fill(); outline(ctx); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo((-1.6 + i * 0.55) * s, -0.78 * s); ctx.quadraticCurveTo((-1.5 + i * 0.55) * s, -0.5 * s, (-1.45 + i * 0.55) * s, -0.3 * s); ctx.strokeStyle = 'rgba(120,40,0,0.45)'; ctx.lineWidth = 0.035 * s; ctx.stroke(); } for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(1.9 * s, -0.5 * s); ctx.quadraticCurveTo((2.3 + i * 0.1) * s, (-0.9 - i * 0.15) * s, (2.1 + i * 0.25) * s, (-1.1 + i * 0.1) * s); ctx.strokeStyle = i ? '#43a047' : '#2e7d32'; ctx.lineWidth = 0.12; ctx.stroke(); } ctx.restore(); },
    lettuce(ctx, p) { const s = p.s; contact(ctx, 0.6 * s); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 0.35 * s, -0.4 * s + Math.sin(a) * 0.2 * s, 0.4 * s, 0.35 * s, a, 0, TAU); ctx.fillStyle = sphereFill(ctx, Math.cos(a) * 0.35 * s, -0.4 * s + Math.sin(a) * 0.2 * s, 0.4 * s, 0.35 * s, i % 2 ? '#7cb342' : '#9ccc65'); ctx.fill(); outline(ctx, 0.04); } sphere(ctx, 0, -0.5 * s, 0.35 * s, 0.33 * s, '#c5e1a5', 0.04); },
    tomato(ctx, p) { const s = p.s; contact(ctx, 0.55 * s); sphere(ctx, 0, -0.5 * s, 0.58 * s, 0.5 * s, '#e53935'); ctx.beginPath(); ctx.ellipse(-0.2 * s, -0.72 * s, 0.14 * s, 0.08 * s, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.beginPath(); ctx.moveTo(0, -0.95 * s); ctx.lineTo(Math.cos(a) * 0.25 * s, -0.95 * s + Math.abs(Math.sin(a)) * 0.12 * s); ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 0.08; ctx.stroke(); } },
    pepper(ctx, p) { const s = p.s; contact(ctx, 0.4 * s); ctx.beginPath(); ctx.moveTo(-0.4 * s, -0.2 * s); ctx.quadraticCurveTo(-0.5 * s, -1.1 * s, 0, -1.15 * s); ctx.quadraticCurveTo(0.5 * s, -1.1 * s, 0.4 * s, -0.2 * s); ctx.quadraticCurveTo(0, 0.02, -0.4 * s, -0.2 * s); ctx.fillStyle = cylFill(ctx, -0.4 * s, 0.4 * s, '#43a047'); ctx.fill(); outline(ctx); ctx.beginPath(); ctx.moveTo(-0.15 * s, -1.0 * s); ctx.lineTo(-0.15 * s, -0.3 * s); ctx.moveTo(0.15 * s, -1.0 * s); ctx.lineTo(0.15 * s, -0.3 * s); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.05; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -1.1 * s); ctx.lineTo(0.1 * s, -1.3 * s); ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 0.1; ctx.stroke(); },
    jar(ctx, p) { const s = p.s, c = p.color || '#8e3b46'; contact(ctx, 0.5 * s); cylinder(ctx, -0.5 * s, 0.5 * s, -1.05 * s, 0, c, 0.12 * s); ctx.beginPath(); ctx.roundRect(-0.5 * s, -1.05 * s, 1.0 * s, 1.05 * s, 0.12 * s); ctx.fillStyle = cylFill(ctx, -0.5 * s, 0.5 * s, c, true); ctx.fill(); ctx.beginPath(); ctx.rect(-0.35 * s, -0.7 * s, 0.7 * s, 0.35 * s); ctx.fillStyle = cylFill(ctx, -0.35 * s, 0.35 * s, '#fdf6e3'); ctx.fill(); outline(ctx, 0.03); ctx.fillStyle = '#333'; ctx.font = `bold ${0.16 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(p.label || '', 0, -0.47 * s); cylinder(ctx, -0.52 * s, 0.52 * s, -1.22 * s, -1.02 * s, '#b0bec5', 0.04 * s); },
    yogurt(ctx, p) { const s = p.s; contact(ctx, 0.4 * s); ctx.beginPath(); ctx.moveTo(-0.45 * s, -1.0 * s); ctx.lineTo(-0.38 * s, 0); ctx.lineTo(0.38 * s, 0); ctx.lineTo(0.45 * s, -1.0 * s); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.45 * s, 0.45 * s, '#ffffff'); ctx.fill(); outline(ctx); ctx.beginPath(); ctx.moveTo(-0.43 * s, -0.7 * s); ctx.lineTo(-0.41 * s, -0.4 * s); ctx.lineTo(0.41 * s, -0.4 * s); ctx.lineTo(0.43 * s, -0.7 * s); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.43 * s, 0.43 * s, '#4fc3f7'); ctx.fill(); cylinder(ctx, -0.5 * s, 0.5 * s, -1.1 * s, -0.98 * s, '#90a4ae', 0.02); },
    bread(ctx, p) { const s = p.s; contact(ctx, 0.9 * s); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect((-0.8 + i * 0.4) * s, -0.65 * s, 0.38 * s, 0.6 * s, 0.1 * s); ctx.fillStyle = cylFill(ctx, (-0.8 + i * 0.4) * s, (-0.42 + i * 0.4) * s, '#d9a35a'); ctx.fill(); ctx.strokeStyle = '#a66b2a'; ctx.lineWidth = 0.04; ctx.stroke(); } ctx.beginPath(); ctx.roundRect(-0.9 * s, -0.75 * s, 1.8 * s, 0.75 * s, 0.25 * s); ctx.fillStyle = cylFill(ctx, -0.9 * s, 0.9 * s, '#fff', true); ctx.fill(); outline(ctx, 0.04); ctx.beginPath(); ctx.moveTo(0.9 * s, -0.6 * s); ctx.lineTo(1.1 * s, -0.9 * s); ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 0.08; ctx.stroke(); },
    bottle(ctx, p) { const s = p.s, c = p.color || '#2e7d32'; contact(ctx, 0.22 * s); ctx.beginPath(); ctx.moveTo(-0.22 * s, 0); ctx.lineTo(-0.22 * s, -0.8 * s); ctx.quadraticCurveTo(-0.22 * s, -1.0 * s, -0.08 * s, -1.05 * s); ctx.lineTo(-0.08 * s, -1.25 * s); ctx.lineTo(0.08 * s, -1.25 * s); ctx.lineTo(0.08 * s, -1.05 * s); ctx.quadraticCurveTo(0.22 * s, -1.0 * s, 0.22 * s, -0.8 * s); ctx.lineTo(0.22 * s, 0); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.22 * s, 0.22 * s, c); ctx.fill(); outline(ctx); ctx.beginPath(); ctx.rect(-0.18 * s, -0.55 * s, 0.36 * s, 0.25 * s); ctx.fillStyle = cylFill(ctx, -0.18 * s, 0.18 * s, '#fdf6e3'); ctx.fill(); cylinder(ctx, -0.1 * s, 0.1 * s, -1.32 * s, -1.2 * s, '#b0bec5', 0.01); },
    foil(ctx, p) { const s = p.s; contact(ctx, 0.65 * s); const F = [[[-0.7, 0], [-0.6, -0.5], [0, -0.5], [-0.1, 0]], [[-0.6, -0.5], [-0.3, -0.9], [0.1, -1.0], [0, -0.5]], [[0, -0.5], [0.1, -1.0], [0.5, -0.7], [0.4, -0.3]], [[-0.1, 0], [0, -0.5], [0.4, -0.3], [0.65, 0]], [[0.4, -0.3], [0.5, -0.7], [0.7, -0.3], [0.65, 0]]]; const L = ['#8fa0a8', '#dfe8ec', '#b9c6cc', '#a4b2b9', '#6f7f87']; F.forEach((f, i) => { ctx.beginPath(); f.forEach((q, j) => j ? ctx.lineTo(q[0] * s, q[1] * s) : ctx.moveTo(q[0] * s, q[1] * s)); ctx.closePath(); const g = ctx.createLinearGradient(f[0][0] * s, f[0][1] * s, f[2][0] * s, f[2][1] * s); g.addColorStop(0, lighten(L[i], 0.35)); g.addColorStop(1, shade(L[i], 0.8)); ctx.fillStyle = g; ctx.fill(); outline(ctx, 0.035); }); },
    cave(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.8 * s, 0); ctx.quadraticCurveTo(-0.9 * s, -1.0 * s, 0, -1.1 * s); ctx.quadraticCurveTo(0.9 * s, -1.0 * s, 0.8 * s, 0); ctx.closePath(); ctx.fillStyle = sphereFill(ctx, 0, -0.5 * s, 0.9 * s, 1.0 * s, '#aab4ba'); ctx.fill(); outline(ctx); ctx.beginPath(); ctx.moveTo(-0.5 * s, 0); ctx.quadraticCurveTo(-0.5 * s, -0.7 * s, 0, -0.75 * s); ctx.quadraticCurveTo(0.5 * s, -0.7 * s, 0.5 * s, 0); ctx.closePath(); const g = ctx.createLinearGradient(0, -0.75 * s, 0, 0); g.addColorStop(0, '#1c2327'); g.addColorStop(1, '#3d474c'); ctx.fillStyle = g; ctx.fill(); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo((-0.7 + i * 0.25) * s, (-0.2 - (i % 3) * 0.25) * s); ctx.lineTo((-0.55 + i * 0.25) * s, (-0.5 - (i % 2) * 0.3) * s); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.05; ctx.stroke(); } },
    peabag(ctx, p) { const s = p.s; contact(ctx, 0.5 * s); ctx.beginPath(); ctx.moveTo(-0.5 * s, 0); ctx.lineTo(-0.55 * s, -1.0 * s); ctx.lineTo(0, -1.15 * s); ctx.lineTo(0.55 * s, -1.0 * s); ctx.lineTo(0.5 * s, 0); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.55 * s, 0.55 * s, '#2e7d32'); ctx.fill(); outline(ctx); ctx.fillStyle = '#fff'; ctx.font = `bold ${0.18 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('PETITS', 0, -0.6 * s); ctx.fillText('POIS', 0, -0.4 * s); for (let i = 0; i < 4; i++) sphere(ctx, (-0.3 + i * 0.2) * s, -0.85 * s, 0.07 * s, 0.07 * s, '#9ccc65', 0); },
    icewall(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.9 * s, 0); ctx.lineTo(-0.8 * s, -0.4 * s); ctx.lineTo(-0.4 * s, -0.55 * s); ctx.lineTo(0, -0.45 * s); ctx.lineTo(0.4 * s, -0.6 * s); ctx.lineTo(0.85 * s, -0.35 * s); ctx.lineTo(0.9 * s, 0); ctx.closePath(); const g = ctx.createLinearGradient(0, -0.6 * s, 0, 0); g.addColorStop(0, 'rgba(230,246,255,0.95)'); g.addColorStop(1, 'rgba(140,195,230,0.95)'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 0.05; ctx.strokeStyle = '#6fa8c8'; ctx.stroke(); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo((-0.6 + i * 0.3) * s, -0.1 * s); ctx.lineTo((-0.5 + i * 0.3) * s, -0.4 * s); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.04; ctx.stroke(); } },
    tub(ctx, p) { const s = p.s; contact(ctx, 0.5 * s); ctx.beginPath(); ctx.moveTo(-0.55 * s, -0.9 * s); ctx.lineTo(-0.5 * s, 0); ctx.lineTo(0.5 * s, 0); ctx.lineTo(0.55 * s, -0.9 * s); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.55 * s, 0.55 * s, '#80deea'); ctx.fill(); outline(ctx); ctx.beginPath(); ctx.rect(-0.5 * s, -0.6 * s, 1.0 * s, 0.3 * s); ctx.fillStyle = cylFill(ctx, -0.5 * s, 0.5 * s, '#ffffff'); ctx.fill(); ctx.fillStyle = '#006064'; ctx.font = `bold ${0.16 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('VANILLE', 0, -0.38 * s); cylinder(ctx, -0.58 * s, 0.58 * s, -1.0 * s, -0.88 * s, '#00acc1', 0.04 * s); },
    can(ctx, p) { const s = p.s, c = p.color || '#d32f2f'; contact(ctx, 0.33 * s); cylinder(ctx, -0.33 * s, 0.33 * s, -1.0 * s, 0, c, 0.05 * s); ctx.beginPath(); ctx.ellipse(0, -1.0 * s, 0.33 * s, 0.09 * s, 0, 0, TAU); ctx.fillStyle = cylFill(ctx, -0.33 * s, 0.33 * s, '#cfd8dc'); ctx.fill(); outline(ctx, 0.04); ctx.fillStyle = '#fff'; ctx.font = `bold ${0.22 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('SODA', 0, -0.45 * s); },
    grapes(ctx, p) { const s = p.s; contact(ctx, 0.45 * s); ctx.beginPath(); ctx.moveTo(0, -1.0 * s); ctx.lineTo(0.1 * s, -1.12 * s); ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 0.06 * s; ctx.stroke(); const g = [[0, -0.9], [-0.22, -0.75], [0.22, -0.75], [-0.4, -0.55], [0, -0.55], [0.4, -0.55], [-0.25, -0.35], [0.25, -0.35], [0, -0.15]]; for (const q of g) sphere(ctx, q[0] * s, q[1] * s, 0.17 * s, 0.17 * s, '#7b1fa2', 0.03); },
    lemon(ctx, p) { const s = p.s; contact(ctx, 0.45 * s); sphere(ctx, 0, -0.33 * s, 0.5 * s, 0.33 * s, '#fdd835'); sphere(ctx, 0.5 * s, -0.33 * s, 0.07 * s, 0.07 * s, '#c0ca33', 0.02); },
    onion(ctx, p) { const s = p.s; contact(ctx, 0.4 * s); sphere(ctx, 0, -0.45 * s, 0.42 * s, 0.45 * s, '#d7a86e'); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 0.15 * s, -0.05 * s); ctx.quadraticCurveTo(i * 0.3 * s, -0.5 * s, i * 0.12 * s, -0.85 * s); ctx.strokeStyle = 'rgba(120,70,20,0.5)'; ctx.lineWidth = 0.03 * s; ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-0.08 * s, -0.88 * s); ctx.lineTo(0, -1.08 * s); ctx.lineTo(0.08 * s, -0.88 * s); ctx.fillStyle = '#8d6e63'; ctx.fill(); },
    broccoli(ctx, p) { const s = p.s; contact(ctx, 0.3 * s); ctx.beginPath(); ctx.moveTo(-0.15 * s, 0); ctx.lineTo(-0.12 * s, -0.6 * s); ctx.lineTo(0.12 * s, -0.6 * s); ctx.lineTo(0.15 * s, 0); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.15 * s, 0.15 * s, '#9ccc65'); ctx.fill(); outline(ctx); for (const q of [[-0.35, -0.8, 0.28], [0.35, -0.8, 0.28], [-0.15, -0.65, 0.22], [0.18, -0.62, 0.22], [0, -1.0, 0.35]]) sphere(ctx, q[0] * s, q[1] * s, q[2] * s, q[2] * s, '#2e7d32', 0.04); for (let i = 0; i < 14; i++) sphere(ctx, (Math.sin(i * 2.4) * 0.45) * s, (-0.85 + Math.cos(i * 1.7) * 0.3) * s, 0.05 * s, 0.05 * s, '#43a047', 0); },
    apple(ctx, p) { const s = p.s; contact(ctx, 0.42 * s); sphere(ctx, 0, -0.45 * s, 0.45 * s, 0.45 * s, '#c62828'); ctx.beginPath(); ctx.moveTo(0, -0.85 * s); ctx.lineTo(0.05 * s, -1.05 * s); ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 0.05 * s; ctx.stroke(); sphere(ctx, 0.15 * s, -0.95 * s, 0.14 * s, 0.07 * s, '#43a047', 0); },
    cupcake(ctx, p) { const s = p.s; contact(ctx, 0.35 * s); ctx.beginPath(); ctx.moveTo(-0.4 * s, -0.45 * s); ctx.lineTo(-0.3 * s, 0); ctx.lineTo(0.3 * s, 0); ctx.lineTo(0.4 * s, -0.45 * s); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.4 * s, 0.4 * s, '#f48fb1'); ctx.fill(); outline(ctx); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo((-0.3 + i * 0.2) * s, -0.45 * s); ctx.lineTo((-0.25 + i * 0.2) * s, 0); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.03 * s; ctx.stroke(); } for (let i = 0; i < 3; i++) sphere(ctx, 0, (-0.55 - i * 0.14) * s, (0.4 - i * 0.1) * s, (0.4 - i * 0.1) * s, '#fff3e0', 0.04); sphere(ctx, 0, -0.95 * s, 0.08 * s, 0.08 * s, '#d32f2f', 0); },
    mug(ctx, p) { const s = p.s, c = p.color || '#ef9a9a'; contact(ctx, 0.4 * s); ctx.beginPath(); ctx.arc(0.45 * s, -0.5 * s, 0.22 * s, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = 0.1 * s; ctx.strokeStyle = shade(c, 0.8); ctx.stroke(); ctx.lineWidth = 0.04; ctx.strokeStyle = OUT; ctx.stroke(); cylinder(ctx, -0.4 * s, 0.4 * s, -0.85 * s, 0, c, 0.08 * s); ctx.beginPath(); ctx.ellipse(0, -0.85 * s, 0.4 * s, 0.1 * s, 0, 0, TAU); ctx.fillStyle = '#5d4037'; ctx.fill(); outline(ctx, 0.04); for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo((-0.1 + i * 0.2) * s, -0.95 * s); ctx.quadraticCurveTo((0 + i * 0.2) * s, -1.1 * s, (-0.1 + i * 0.2) * s, -1.25 * s); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.04 * s; ctx.stroke(); } },
    spoon(ctx, p) { const s = p.s; ctx.save(); ctx.rotate(-0.15); ctx.beginPath(); ctx.moveTo(-0.8 * s, -0.12 * s); ctx.lineTo(0.2 * s, -0.17 * s); ctx.lineWidth = 0.1 * s; ctx.strokeStyle = '#cfd8dc'; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 0.04; ctx.strokeStyle = OUT; ctx.stroke(); sphere(ctx, 0.5 * s, -0.18 * s, 0.32 * s, 0.2 * s, '#eceff1', 0.04); ctx.beginPath(); ctx.ellipse(0.5 * s, -0.16 * s, 0.2 * s, 0.1 * s, 0, 0, TAU); ctx.fillStyle = 'rgba(80,90,100,0.35)'; ctx.fill(); ctx.restore(); },
    brokenjar(ctx, p) { const s = p.s, c = p.color || '#8e3b46'; ctx.beginPath(); ctx.ellipse(0, -0.05 * s, 0.7 * s, 0.14 * s, 0, 0, TAU); ctx.fillStyle = c; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(-0.45 * s, 0); ctx.lineTo(-0.5 * s, -0.55 * s); ctx.lineTo(-0.3 * s, -0.4 * s); ctx.lineTo(-0.15 * s, -0.75 * s); ctx.lineTo(0.05 * s, -0.35 * s); ctx.lineTo(0.25 * s, -0.6 * s); ctx.lineTo(0.42 * s, -0.3 * s); ctx.lineTo(0.45 * s, 0); ctx.closePath(); ctx.fillStyle = cylFill(ctx, -0.5 * s, 0.45 * s, c); ctx.fill(); ctx.fillStyle = cylFill(ctx, -0.5 * s, 0.45 * s, c, true); ctx.fill(); outline(ctx); for (const q of [[-0.65, -0.15, 0.2], [0.6, -0.1, 0.15], [0.3, -0.85, 0.12]]) { ctx.beginPath(); ctx.moveTo(q[0] * s, q[1] * s); ctx.lineTo((q[0] + q[2]) * s, (q[1] - q[2] * 1.5) * s); ctx.lineTo((q[0] + q[2] * 1.4) * s, q[1] * s); ctx.closePath(); ctx.fillStyle = 'rgba(200,235,220,0.8)'; ctx.fill(); outline(ctx, 0.03); } ctx.save(); ctx.translate(0.4 * s, -0.2 * s); ctx.rotate(0.9); ctx.beginPath(); ctx.roundRect(-0.5 * s, -0.95 * s, 1.0 * s, 0.18 * s, 0.04 * s); ctx.fillStyle = cylFill(ctx, -0.5 * s, 0.5 * s, '#b0bec5'); ctx.fill(); outline(ctx, 0.04); ctx.restore(); },
    shelfpiece(ctx, p) { const s = p.s; ctx.save(); ctx.rotate(-0.35); ctx.beginPath(); ctx.rect(-0.9 * s, -0.4 * s, 1.8 * s, 0.16 * s); const g = ctx.createLinearGradient(0, -0.4 * s, 0, -0.24 * s); g.addColorStop(0, 'rgba(235,248,255,0.95)'); g.addColorStop(0.5, 'rgba(160,205,235,0.9)'); g.addColorStop(1, 'rgba(110,160,200,0.95)'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 0.035; ctx.strokeStyle = '#5b90b4'; ctx.stroke(); ctx.restore(); ctx.beginPath(); ctx.moveTo(0.6 * s, 0); ctx.lineTo(0.7 * s, -0.9 * s); ctx.lineTo(0.8 * s, 0); ctx.closePath(); ctx.fillStyle = cylFill(ctx, 0.6 * s, 0.8 * s, '#b0bec5'); ctx.fill(); outline(ctx, 0.04); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo((-0.7 + i * 0.4) * s, -0.15 * s); ctx.lineTo((-0.6 + i * 0.4) * s, -0.3 * s); ctx.lineTo((-0.5 + i * 0.4) * s, -0.1 * s); ctx.closePath(); ctx.fillStyle = 'rgba(220,240,250,0.9)'; ctx.fill(); ctx.lineWidth = 0.02; ctx.strokeStyle = 'rgba(120,170,200,0.8)'; ctx.stroke(); } },
    shards(ctx, p) { const s = p.s; for (let i = 0; i < 7; i++) { const x = (-0.6 + i * 0.2) * s, h = (0.15 + (i % 3) * 0.1) * s; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 0.08 * s, -h); ctx.lineTo(x + 0.2 * s, 0); ctx.closePath(); ctx.fillStyle = 'rgba(210,240,250,0.85)'; ctx.fill(); ctx.lineWidth = 0.02; ctx.strokeStyle = 'rgba(120,170,200,0.8)'; ctx.stroke(); } },
    icicle(ctx, p) { const s = p.s; for (const q of [[-0.15, 0.7], [0.05, 1.3], [0.2, 0.9]]) { ctx.beginPath(); ctx.moveTo((q[0] - 0.12) * s, 0); ctx.lineTo(q[0] * s, q[1] * s); ctx.lineTo((q[0] + 0.12) * s, 0); ctx.closePath(); ctx.fillStyle = cylFill(ctx, (q[0] - 0.12) * s, (q[0] + 0.12) * s, '#d7f0fc'); ctx.fill(); ctx.lineWidth = 0.02; ctx.strokeStyle = 'rgba(120,170,200,0.8)'; ctx.stroke(); } },
    bulb(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0.08 * s, 0.5 * s, 0, 1.0 * s); ctx.strokeStyle = '#37474f'; ctx.lineWidth = 0.04 * s; ctx.stroke(); ctx.beginPath(); ctx.rect(-0.1 * s, 1.0 * s, 0.2 * s, 0.18 * s); ctx.fillStyle = cylFill(ctx, -0.1 * s, 0.1 * s, '#90a4ae'); ctx.fill(); outline(ctx, 0.03); if (!p.broken) { ctx.beginPath(); ctx.arc(0, 1.4 * s, 0.45 * s, 0, TAU); ctx.fillStyle = 'rgba(255,240,150,0.25)'; ctx.fill(); } sphere(ctx, 0, 1.4 * s, 0.25 * s, 0.25 * s, p.broken ? '#c8c8bd' : '#fff4b0', 0.03); if (p.broken) { ctx.beginPath(); ctx.moveTo(-0.2 * s, 1.5 * s); ctx.lineTo(-0.05 * s, 1.35 * s); ctx.lineTo(0.08 * s, 1.55 * s); ctx.lineTo(0.22 * s, 1.3 * s); ctx.strokeStyle = OUT; ctx.lineWidth = 0.025 * s; ctx.stroke(); } },
    cobweb(ctx, p) { const s = p.s; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.02 * s; for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; ctx.beginPath(); ctx.moveTo(-0.6 * s, 0); ctx.lineTo((-0.6 + Math.cos(a) * 1.2) * s, Math.sin(a) * 1.0 * s); ctx.stroke(); } for (let r = 0.25; r <= 1.0; r += 0.25) { ctx.beginPath(); for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; const x = (-0.6 + Math.cos(a) * 1.2 * r) * s, y = Math.sin(a) * 1.0 * r * s; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); } },
  };

  // ------------------------------------------------------------------ boîtes en vraie 3D
  // spec : w (largeur x), d (profondeur z), h (hauteur), color, alpha, deco(face) ; les faces sont projetées et ombrées
  const BOXES = {
    milk: p => ({ w: 0.62, d: 0.62, h: 1.0, color: '#e3f2fd', roof: 0.3, deco: 'milk' }),
    pizzabox: p => ({ w: 1.8, d: 1.7, h: 0.42, color: '#c8a46a', deco: 'pizza' }),
    tupperware: p => ({ w: 1.5, d: 1.1, h: 0.7, color: 'rgba(235,245,250,0.55)', lid: p.color || '#80cbc4', inner: 'rgba(200,120,60,0.5)' }),
    carton: p => ({ w: 5.2, d: 2.1, h: 0.45, color: '#bcaaa4', deco: 'eggs' }),
    icecube: p => ({ w: 1.0, d: 1.0, h: 0.95, color: 'rgba(200,236,252,0.8)', glass: true }),
    butterdish: p => ({ w: 1.5, d: 0.9, h: 0.6, color: 'rgba(240,244,246,0.7)', lid: '#eceff1', inner: '#ffe082' }),
    lasagna: p => ({ w: 1.6, d: 1.2, h: 0.55, color: '#f5f5f5', band: '#c62828', top: '#ffb300' }),
    cheese: p => ({ w: 1.3, d: 1.3, h: 0.7, color: '#ffca28', wedge: true }),
  };
  P.isBox = p => !!BOXES[p.kind];
  function rot(x, z, yaw) { const c = Math.cos(yaw), s = Math.sin(yaw); return [x * c - z * s, x * s + z * c]; }
  // dessine une face (polygone monde) avec une teinte ; renvoie les points écran pour la déco
  function face(ctx, R, cam, pal, pts, color, k, alpha) {
    const cp = R.toScreen(cam, pts); if (!cp) return null;
    ctx.beginPath(); cp.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
    if (color[0] === '#') { const a = hex(color).map(v => Math.min(255, v * k)), f = hex(pal.fog), t = R.fogK(pal, cp.z); ctx.fillStyle = rgb(a.map((v, i) => v + (f[i] - v) * t)); } else ctx.fillStyle = color;
    ctx.globalAlpha = alpha; ctx.fill(); ctx.globalAlpha = alpha; ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(30,25,22,0.75)'; ctx.stroke();
    return cp;
  }
  P.drawBox = function (ctx, R, cam, pal, p, scale, alpha) {
    const sp = BOXES[p.kind](p), s = (p.s || 1) * scale, yaw = (p.rot || 0) * 2.5 + (p.yaw || 0);
    const w = sp.w * s / 2, d = sp.d * s / 2, h = sp.h * s; const X = p.x, Z = p.z;
    const c = (x, y, z) => { const r = rot(x, z, yaw); return [X + r[0], y, Z + r[1]]; };
    // faces latérales : normale, 4 coins (ordre direct vu de l'extérieur)
    let faces = [
      { n: [0, 0, -1], pts: [c(-w, 0, -d), c(w, 0, -d), c(w, h, -d), c(-w, h, -d)], k: 0.95, deco: true },
      { n: [0, 0, 1], pts: [c(w, 0, d), c(-w, 0, d), c(-w, h, d), c(w, h, d)], k: 0.95, deco: true },
      { n: [-1, 0, 0], pts: [c(-w, 0, d), c(-w, 0, -d), c(-w, h, -d), c(-w, h, d)], k: 0.78 },
      { n: [1, 0, 0], pts: [c(w, 0, -d), c(w, 0, d), c(w, h, d), c(w, h, -d)], k: 0.78 },
      { n: [0, 1, 0], pts: [c(-w, h, -d), c(w, h, -d), c(w, h, d), c(-w, h, d)], k: 1.12, top: true },
    ];
    if (sp.wedge) { // coin de fromage : prisme triangulaire (pointe vers -z)
      faces = [
        { n: [0, 0, 1], pts: [c(w, 0, d), c(-w, 0, d), c(-w, h, d), c(w, h, d)], k: 0.95, holes: true },
        { n: [-0.7, 0, -0.7], pts: [c(-w, 0, d), c(0, 0, -d), c(0, h, -d), c(-w, h, d)], k: 0.8, holes: true },
        { n: [0.7, 0, -0.7], pts: [c(0, 0, -d), c(w, 0, d), c(w, h, d), c(0, h, -d)], k: 0.88, holes: true },
        { n: [0, 1, 0], pts: [c(-w, h, d), c(w, h, d), c(0, h, -d)], k: 1.12, top: true },
      ];
    }
    const vis = []; for (const f of faces) { const nr = rot(f.n[0], f.n[2], yaw); const cx = f.pts.reduce((a, q) => a + q[0], 0) / f.pts.length, cy = f.pts.reduce((a, q) => a + q[1], 0) / f.pts.length, cz = f.pts.reduce((a, q) => a + q[2], 0) / f.pts.length; const dot = nr[0] * (cam.x - cx) + f.n[1] * (cam.y - cy) + nr[1] * (cam.z - cz); if (dot > 0) { f.dist = Math.hypot(cam.x - cx, cam.y - cy, cam.z - cz); f.cx = cx; f.cz = cz; vis.push(f); } }
    vis.sort((a, b) => b.dist - a.dist);
    // ombre de contact
    const sh = R.toScreen(cam, [c(-w * 1.1, 0.005, -d * 1.1), c(w * 1.1, 0.005, -d * 1.1), c(w * 1.1, 0.005, d * 1.1), c(-w * 1.1, 0.005, d * 1.1)]);
    if (sh) { ctx.beginPath(); sh.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.globalAlpha = alpha; ctx.fill(); }
    const lw = w * 0.9, ld = d * 0.9;
    for (const f of vis) {
      if (sp.inner && !f.top) { // contenu visible à travers la boîte translucide
        const hh = h * 0.6; const inner = f.pts.map(q => [q[0], Math.min(q[1], hh), q[2]]); face(ctx, R, cam, pal, inner, sp.inner, f.k, alpha);
      }
      const cp = face(ctx, R, cam, pal, f.pts, sp.color, f.k, alpha); if (!cp) continue;
      if (sp.glass && !f.top) { ctx.beginPath(); ctx.moveTo(cp[3][0] + (cp[2][0] - cp[3][0]) * 0.1, cp[3][1] + (cp[0][1] - cp[3][1]) * 0.1); ctx.lineTo(cp[3][0] + (cp[2][0] - cp[3][0]) * 0.18, cp[3][1] + (cp[0][1] - cp[3][1]) * 0.1); ctx.lineTo(cp[0][0] + (cp[1][0] - cp[0][0]) * 0.18, cp[0][1] - (cp[0][1] - cp[3][1]) * 0.15); ctx.lineTo(cp[0][0] + (cp[1][0] - cp[0][0]) * 0.1, cp[0][1] - (cp[0][1] - cp[3][1]) * 0.15); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); }
      if (sp.band && !f.top) { const b = f.pts.map((q, i) => [q[0], i < 2 ? h * 0.72 : h * 0.98, q[2]]); face(ctx, R, cam, pal, b, sp.band, f.k, alpha); }
      if (f.holes && cp.length === 4) { for (const hq of [[0.3, 0.35, 0.09], [0.65, 0.6, 0.12], [0.5, 0.2, 0.06]]) { const px = cp[0][0] + (cp[1][0] - cp[0][0]) * hq[0] + (cp[3][0] - cp[0][0]) * hq[1], py = cp[0][1] + (cp[1][1] - cp[0][1]) * hq[0] + (cp[3][1] - cp[0][1]) * hq[1]; const rr = Math.hypot(cp[1][0] - cp[0][0], cp[1][1] - cp[0][1]) * hq[2]; ctx.beginPath(); ctx.ellipse(px, py, rr, rr * 0.75, 0, 0, TAU); ctx.fillStyle = shade('#f9a825', f.k * 0.95); ctx.fill(); } }
      if (f.deco && sp.deco && cp.length === 4) decoOnFace(ctx, cp, sp.deco, f.k, alpha);
    }
    if (sp.lid) { // couvercle coloré légèrement plus large
      const lh = h * 0.16, lp = [[-w * 1.06, -d * 1.06], [w * 1.06, -d * 1.06], [w * 1.06, d * 1.06], [-w * 1.06, d * 1.06]].map(q => [q[0], q[1]]);
      const lidFaces = [
        { pts: [c(lp[0][0], h, lp[0][1]), c(lp[1][0], h, lp[1][1]), c(lp[1][0], h + lh, lp[1][1]), c(lp[0][0], h + lh, lp[0][1])], n: [0, 0, -1], k: 0.95 },
        { pts: [c(lp[2][0], h, lp[2][1]), c(lp[3][0], h, lp[3][1]), c(lp[3][0], h + lh, lp[3][1]), c(lp[2][0], h + lh, lp[2][1])], n: [0, 0, 1], k: 0.95 },
        { pts: [c(lp[3][0], h, lp[3][1]), c(lp[0][0], h, lp[0][1]), c(lp[0][0], h + lh, lp[0][1]), c(lp[3][0], h + lh, lp[3][1])], n: [-1, 0, 0], k: 0.78 },
        { pts: [c(lp[1][0], h, lp[1][1]), c(lp[2][0], h, lp[2][1]), c(lp[2][0], h + lh, lp[2][1]), c(lp[1][0], h + lh, lp[1][1])], n: [1, 0, 0], k: 0.78 },
        { pts: [c(lp[0][0], h + lh, lp[0][1]), c(lp[1][0], h + lh, lp[1][1]), c(lp[2][0], h + lh, lp[2][1]), c(lp[3][0], h + lh, lp[3][1])], n: [0, 1, 0], k: 1.12 },
      ];
      for (const f of lidFaces) { const nr = rot(f.n[0], f.n[2], yaw); const cx = f.pts[0][0], cz = f.pts[0][2]; if (nr[0] * (cam.x - cx) + f.n[1] * (cam.y - h) + nr[1] * (cam.z - cz) > 0) face(ctx, R, cam, pal, f.pts, sp.lid, f.k, alpha); }
    }
    if (sp.roof) { // toit de brique de lait (deux pans)
      const rh = sp.roof * s; const pans = [
        { pts: [c(-w, h, -d), c(w, h, -d), c(w, h + rh, 0), c(-w, h + rh, 0)], n: [0, 0.7, -0.7], k: 1.05 },
        { pts: [c(w, h, d), c(-w, h, d), c(-w, h + rh, 0), c(w, h + rh, 0)], n: [0, 0.7, 0.7], k: 0.9 },
        { pts: [c(-w, h, -d), c(-w, h + rh, 0), c(-w, h, d)], n: [-1, 0, 0], k: 0.78 },
        { pts: [c(w, h, d), c(w, h + rh, 0), c(w, h, -d)], n: [1, 0, 0], k: 0.78 },
      ];
      for (const f of pans) { const nr = rot(f.n[0], f.n[2], yaw); if (nr[0] * (cam.x - X) + f.n[1] * (cam.y - h) + nr[1] * (cam.z - Z) > 0) face(ctx, R, cam, pal, f.pts, sp.color, f.k, alpha); }
    }
    ctx.globalAlpha = 1;
  };
  // déco plaquée sur une face (transformation affine approximative : parfaite de face, un peu biaisée de côté)
  function decoOnFace(ctx, cp, kind, k, alpha) {
    // origine en haut à gauche (cp[3]), u vers la droite (cp[2]), v vers le bas (cp[0])
    const ax = cp[2][0] - cp[3][0], ay = cp[2][1] - cp[3][1], bx = cp[0][0] - cp[3][0], by = cp[0][1] - cp[3][1];
    if (Math.abs(ax * by - ay * bx) < 400) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.transform(ax, ay, bx, by, cp[3][0], cp[3][1]); // (u,v) ∈ [0,1]²
    ctx.beginPath(); ctx.rect(0, 0, 1, 1); ctx.clip();
    if (kind === 'milk') { ctx.fillStyle = shade('#1e88e5', k); ctx.fillRect(0, 0.3, 1, 0.3); ctx.fillStyle = '#fff'; drawText(ctx, 'LAIT', 0.5, 0.45, 0.2); }
    else if (kind === 'pizza') { ctx.fillStyle = shade('#b71c1c', k); drawText(ctx, 'PIZZA', 0.5, 0.5, 0.5, true); ctx.fillStyle = 'rgba(120,80,20,0.3)'; ctx.beginPath(); ctx.ellipse(0.85, 0.5, 0.08, 0.3, 0, 0, TAU); ctx.fill(); }
    else if (kind === 'eggs') { ctx.fillStyle = shade('#5d4037', k); drawText(ctx, '6 ŒUFS FRAIS', 0.5, 0.5, 0.5, true); }
    ctx.restore();
  }
  function drawText(ctx, txt, u, v, hgt, wide) { ctx.save(); ctx.translate(u, v); ctx.scale(wide ? 0.09 : 0.2, hgt); ctx.font = 'bold 1px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 0); ctx.restore(); }
})(window.FS);
