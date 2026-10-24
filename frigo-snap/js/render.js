// Frigo Snap — rendu pseudo-3D (canevas 2D) : décor du frigo, accessoires, créatures, projectiles, effets et viseur.
(function (FS) {
  'use strict';
  const R = FS.Render = {};
  const { clamp, lerp } = FS;
  const TAU = Math.PI * 2;
  const W = FS.W, H = FS.H;

  // ---- couleurs
  const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; };
  const shade = (c, k) => { const A = hex(c); return `rgb(${clamp(Math.round(A[0] * k), 0, 255)},${clamp(Math.round(A[1] * k), 0, 255)},${clamp(Math.round(A[2] * k), 0, 255)})`; };
  const fogK = (pal, z) => clamp(z / pal.fogD, 0, 1) ** 1.4;

  // ---- transformation en espace caméra et découpe au plan proche
  function toCam(cam, p) { const dx = p[0] - cam.x, dy = p[1] - cam.y, dz = p[2] - cam.z; const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch); return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; }
  function clipNear(pts) { const out = [], n = FS.NEAR; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const ain = a[2] >= n, bin = b[2] >= n; if (ain) out.push(a); if (ain !== bin) { const t = (n - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, n]); } } return out; }
  function poly(ctx, cam, worldPts, fill, pal, stroke) {
    const cp = clipNear(worldPts.map(p => toCam(cam, p))); if (cp.length < 3) return false;
    let zs = 0; ctx.beginPath();
    cp.forEach((p, i) => { const k = cam.f / p[2]; const x = W / 2 + p[0] * k, y = H / 2 - p[1] * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); zs += p[2]; });
    ctx.closePath(); const z = zs / cp.length;
    ctx.fillStyle = pal ? mix(fill, pal.fog, fogK(pal, z)) : fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    return true;
  }

  // ------------------------------------------------------------------ accessoires (sprites en cache)
  const cache = {};
  const PX = 48; // pixels par unité dans les sprites d'accessoires
  function propSprite(p, pal) {
    const key = p.kind + '|' + p.s + '|' + (p.color || '') + '|' + (p.label || '') + '|' + (pal.dark ? 'd' : '');
    if (cache[key]) return cache[key];
    const dims = propDims(p); const cv = document.createElement('canvas'); cv.width = Math.ceil(dims.w * PX) + 8; cv.height = Math.ceil(dims.h * PX) + 8;
    const ctx = cv.getContext('2d'); ctx.translate(cv.width / 2, cv.height - 4); ctx.scale(PX, PX); ctx.lineJoin = 'round';
    PROPS[p.kind](ctx, p, pal); cache[key] = { cv, w: dims.w, h: dims.h }; return cache[key];
  }
  const OUT = '#26211f';
  const outline = (ctx, lw) => { ctx.lineWidth = lw || 0.06; ctx.strokeStyle = OUT; ctx.stroke(); };
  function propDims(p) { const s = p.s || 1; switch (p.kind) { case 'carrot': return { w: 4.6 * s, h: 1.4 * s }; case 'lettuce': return { w: 1.3 * s, h: 1.0 * s }; case 'tomato': return { w: 1.2 * s, h: 1.15 * s }; case 'pepper': return { w: 0.9 * s, h: 1.3 * s }; case 'jar': return { w: 1.1 * s, h: 1.25 * s }; case 'yogurt': return { w: 1.0 * s, h: 1.1 * s }; case 'milk': return { w: 0.6 * s, h: 1.3 * s }; case 'bread': return { w: 1.8 * s, h: 1.0 * s }; case 'butterdish': return { w: 1.5 * s, h: 0.7 * s }; case 'bottle': return { w: 0.45 * s, h: 1.3 * s }; case 'carton': return { w: 5.2 * s, h: 1.1 * s }; case 'foil': return { w: 1.4 * s, h: 1.0 * s }; case 'lasagna': return { w: 1.6 * s, h: 0.7 * s }; case 'cave': return { w: 1.6 * s, h: 1.1 * s }; case 'icecube': return { w: 1.1 * s, h: 1.0 * s }; case 'peabag': return { w: 1.1 * s, h: 1.2 * s }; case 'icewall': return { w: 1.8 * s, h: 0.7 * s }; case 'tub': return { w: 1.2 * s, h: 1.0 * s }; default: return { w: s, h: s }; } }
  const PROPS = {
    carrot(ctx, p) { const s = p.s; ctx.save(); ctx.rotate((p.rot || 0) * 0.3); ctx.beginPath(); ctx.moveTo(-2 * s, -0.5 * s); ctx.quadraticCurveTo(0, -0.9 * s, 2 * s, -0.55 * s); ctx.quadraticCurveTo(2.1 * s, -0.4 * s, 1.9 * s, -0.3 * s); ctx.quadraticCurveTo(0, 0, -2 * s, -0.5 * s); ctx.fillStyle = '#f57c00'; ctx.fill(); outline(ctx); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo((-1.5 + i * 0.6) * s, -0.75 * s); ctx.lineTo((-1.4 + i * 0.6) * s, -0.4 * s); ctx.strokeStyle = '#e65100'; ctx.lineWidth = 0.04; ctx.stroke(); } for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(1.9 * s, -0.5 * s); ctx.quadraticCurveTo((2.3 + i * 0.1) * s, (-0.9 - i * 0.15) * s, (2.1 + i * 0.25) * s, (-1.1 + i * 0.1) * s); ctx.strokeStyle = '#43a047'; ctx.lineWidth = 0.12; ctx.stroke(); } ctx.restore(); },
    lettuce(ctx, p) { const s = p.s; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 0.35 * s, -0.4 * s + Math.sin(a) * 0.2 * s, 0.4 * s, 0.35 * s, a, 0, TAU); ctx.fillStyle = i % 2 ? '#7cb342' : '#9ccc65'; ctx.fill(); outline(ctx, 0.04); } ctx.beginPath(); ctx.arc(0, -0.5 * s, 0.35 * s, 0, TAU); ctx.fillStyle = '#c5e1a5'; ctx.fill(); outline(ctx, 0.04); },
    tomato(ctx, p) { const s = p.s; ctx.beginPath(); ctx.ellipse(0, -0.5 * s, 0.58 * s, 0.5 * s, 0, 0, TAU); ctx.fillStyle = '#e53935'; ctx.fill(); outline(ctx); ctx.beginPath(); ctx.ellipse(-0.2 * s, -0.7 * s, 0.15 * s, 0.1 * s, -0.4, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.beginPath(); ctx.moveTo(0, -0.95 * s); ctx.lineTo(Math.cos(a) * 0.25 * s, -0.95 * s + Math.abs(Math.sin(a)) * 0.12 * s); ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 0.08; ctx.stroke(); } },
    pepper(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.4 * s, -0.2 * s); ctx.quadraticCurveTo(-0.5 * s, -1.1 * s, 0, -1.15 * s); ctx.quadraticCurveTo(0.5 * s, -1.1 * s, 0.4 * s, -0.2 * s); ctx.quadraticCurveTo(0, 0.02, -0.4 * s, -0.2 * s); ctx.fillStyle = '#43a047'; ctx.fill(); outline(ctx); ctx.beginPath(); ctx.moveTo(-0.15 * s, -1.0 * s); ctx.lineTo(-0.15 * s, -0.3 * s); ctx.moveTo(0.15 * s, -1.0 * s); ctx.lineTo(0.15 * s, -0.3 * s); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.05; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -1.1 * s); ctx.lineTo(0.1 * s, -1.3 * s); ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 0.1; ctx.stroke(); },
    jar(ctx, p) { const s = p.s; ctx.beginPath(); ctx.roundRect(-0.5 * s, -1.05 * s, 1.0 * s, 1.05 * s, 0.12 * s); ctx.fillStyle = p.color || '#8e3b46'; ctx.fill(); outline(ctx); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.roundRect(-0.4 * s, -0.95 * s, 0.14 * s, 0.75 * s, 0.05 * s); ctx.fill(); ctx.beginPath(); ctx.rect(-0.35 * s, -0.7 * s, 0.7 * s, 0.35 * s); ctx.fillStyle = '#fdf6e3'; ctx.fill(); outline(ctx, 0.03); ctx.fillStyle = '#333'; ctx.font = `bold ${0.16 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(p.label || '', 0, -0.47 * s); ctx.beginPath(); ctx.roundRect(-0.52 * s, -1.22 * s, 1.04 * s, 0.2 * s, 0.04 * s); ctx.fillStyle = '#b0bec5'; ctx.fill(); outline(ctx); },
    yogurt(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.45 * s, -1.0 * s); ctx.lineTo(-0.38 * s, 0); ctx.lineTo(0.38 * s, 0); ctx.lineTo(0.45 * s, -1.0 * s); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx); ctx.fillStyle = '#4fc3f7'; ctx.fillRect(-0.42 * s, -0.7 * s, 0.84 * s, 0.3 * s); ctx.beginPath(); ctx.rect(-0.5 * s, -1.1 * s, 1.0 * s, 0.12 * s); ctx.fillStyle = '#90a4ae'; ctx.fill(); outline(ctx, 0.04); },
    milk(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.3 * s, -1.0 * s); ctx.lineTo(-0.3 * s, 0); ctx.lineTo(0.3 * s, 0); ctx.lineTo(0.3 * s, -1.0 * s); ctx.lineTo(0, -1.25 * s); ctx.closePath(); ctx.fillStyle = '#e3f2fd'; ctx.fill(); outline(ctx); ctx.fillStyle = '#1e88e5'; ctx.fillRect(-0.3 * s, -0.75 * s, 0.6 * s, 0.3 * s); ctx.fillStyle = '#fff'; ctx.font = `bold ${0.14 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('LAIT', 0, -0.55 * s); },
    bread(ctx, p) { const s = p.s; ctx.beginPath(); ctx.roundRect(-0.9 * s, -0.75 * s, 1.8 * s, 0.75 * s, 0.25 * s); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); outline(ctx, 0.04); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect((-0.8 + i * 0.4) * s, -0.65 * s, 0.38 * s, 0.6 * s, 0.1 * s); ctx.fillStyle = '#d9a35a'; ctx.fill(); ctx.strokeStyle = '#a66b2a'; ctx.lineWidth = 0.04; ctx.stroke(); } ctx.beginPath(); ctx.moveTo(0.9 * s, -0.6 * s); ctx.lineTo(1.1 * s, -0.9 * s); ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 0.08; ctx.stroke(); },
    butterdish(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.75 * s, -0.4 * s); ctx.lineTo(-0.7 * s, 0); ctx.lineTo(0.7 * s, 0); ctx.lineTo(0.75 * s, -0.4 * s); ctx.closePath(); ctx.fillStyle = '#eceff1'; ctx.fill(); outline(ctx); ctx.beginPath(); ctx.roundRect(-0.5 * s, -0.65 * s, 1.0 * s, 0.3 * s, 0.05 * s); ctx.fillStyle = '#ffe082'; ctx.fill(); outline(ctx, 0.04); },
    bottle(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.22 * s, 0); ctx.lineTo(-0.22 * s, -0.8 * s); ctx.quadraticCurveTo(-0.22 * s, -1.0 * s, -0.08 * s, -1.05 * s); ctx.lineTo(-0.08 * s, -1.25 * s); ctx.lineTo(0.08 * s, -1.25 * s); ctx.lineTo(0.08 * s, -1.05 * s); ctx.quadraticCurveTo(0.22 * s, -1.0 * s, 0.22 * s, -0.8 * s); ctx.lineTo(0.22 * s, 0); ctx.closePath(); ctx.fillStyle = p.color || '#2e7d32'; ctx.fill(); outline(ctx); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-0.15 * s, -0.75 * s, 0.07 * s, 0.6 * s); ctx.fillStyle = '#fdf6e3'; ctx.fillRect(-0.18 * s, -0.55 * s, 0.36 * s, 0.25 * s); ctx.fillStyle = '#b0bec5'; ctx.fillRect(-0.1 * s, -1.3 * s, 0.2 * s, 0.1 * s); },
    carton(ctx, p) { const s = p.s; ctx.beginPath(); ctx.roundRect(-2.6 * s, -0.5 * s, 5.2 * s, 0.5 * s, 0.1 * s); ctx.fillStyle = '#bcaaa4'; ctx.fill(); outline(ctx); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse((-2.0 + i * 0.8) * s, -0.5 * s, 0.35 * s, 0.12 * s, 0, 0, TAU); ctx.fillStyle = '#a1887f'; ctx.fill(); } ctx.beginPath(); ctx.roundRect(-2.6 * s, -1.1 * s, 5.2 * s, 0.25 * s, 0.08 * s); ctx.fillStyle = '#a1887f'; ctx.fill(); outline(ctx, 0.04); ctx.fillStyle = '#5d4037'; ctx.font = `bold ${0.18 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('6 ŒUFS FRAIS', 0, -0.9 * s); },
    foil(ctx, p, pal) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.7 * s, 0); ctx.lineTo(-0.6 * s, -0.5 * s); ctx.lineTo(-0.3 * s, -0.9 * s); ctx.lineTo(0.1 * s, -1.0 * s); ctx.lineTo(0.5 * s, -0.7 * s); ctx.lineTo(0.7 * s, -0.3 * s); ctx.lineTo(0.65 * s, 0); ctx.closePath(); ctx.fillStyle = '#b0bec5'; ctx.fill(); outline(ctx); const fa = [[-0.6, -0.5, 0.1, -1.0], [-0.3, -0.9, 0.5, -0.7], [0.1, -1.0, 0.65, 0], [-0.6, -0.5, 0.5, -0.7]]; for (const f of fa) { ctx.beginPath(); ctx.moveTo(f[0] * s, f[1] * s); ctx.lineTo(f[2] * s, f[3] * s); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.04; ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-0.3 * s, -0.9 * s); ctx.lineTo(0.1 * s, -1.0 * s); ctx.lineTo(0.5 * s, -0.7 * s); ctx.lineTo(0, -0.5 * s); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); },
    lasagna(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.8 * s, -0.5 * s); ctx.lineTo(-0.7 * s, 0); ctx.lineTo(0.7 * s, 0); ctx.lineTo(0.8 * s, -0.5 * s); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); outline(ctx); ctx.fillStyle = '#c62828'; ctx.fillRect(-0.72 * s, -0.5 * s, 1.44 * s, 0.2 * s); ctx.fillStyle = '#ffb300'; ctx.fillRect(-0.72 * s, -0.6 * s, 1.44 * s, 0.12 * s); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((-0.55 + i * 0.28) * s, -0.62 * s, 0.1 * s, Math.PI, TAU); ctx.fillStyle = '#ffe082'; ctx.fill(); } },
    cave(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.8 * s, 0); ctx.quadraticCurveTo(-0.9 * s, -1.0 * s, 0, -1.1 * s); ctx.quadraticCurveTo(0.9 * s, -1.0 * s, 0.8 * s, 0); ctx.closePath(); ctx.fillStyle = '#9ea7ad'; ctx.fill(); outline(ctx); ctx.beginPath(); ctx.moveTo(-0.5 * s, 0); ctx.quadraticCurveTo(-0.5 * s, -0.7 * s, 0, -0.75 * s); ctx.quadraticCurveTo(0.5 * s, -0.7 * s, 0.5 * s, 0); ctx.closePath(); ctx.fillStyle = '#2f373b'; ctx.fill(); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo((-0.7 + i * 0.25) * s, (-0.2 - (i % 3) * 0.25) * s); ctx.lineTo((-0.55 + i * 0.25) * s, (-0.5 - (i % 2) * 0.3) * s); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.05; ctx.stroke(); } },
    icecube(ctx, p) { const s = p.s; ctx.beginPath(); ctx.roundRect(-0.5 * s, -0.9 * s, 1.0 * s, 0.9 * s, 0.1 * s); ctx.fillStyle = 'rgba(200,235,250,0.85)'; ctx.fill(); outline(ctx, 0.04); ctx.beginPath(); ctx.moveTo(-0.5 * s, -0.9 * s); ctx.lineTo(-0.3 * s, -1.05 * s); ctx.lineTo(0.7 * s, -1.05 * s); ctx.lineTo(0.5 * s, -0.9 * s); ctx.closePath(); ctx.fillStyle = 'rgba(230,248,255,0.9)'; ctx.fill(); outline(ctx, 0.04); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-0.4 * s, -0.8 * s, 0.1 * s, 0.5 * s); },
    peabag(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.5 * s, 0); ctx.lineTo(-0.55 * s, -1.0 * s); ctx.lineTo(0, -1.15 * s); ctx.lineTo(0.55 * s, -1.0 * s); ctx.lineTo(0.5 * s, 0); ctx.closePath(); ctx.fillStyle = '#2e7d32'; ctx.fill(); outline(ctx); ctx.fillStyle = '#fff'; ctx.font = `bold ${0.18 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('PETITS', 0, -0.6 * s); ctx.fillText('POIS', 0, -0.4 * s); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc((-0.3 + i * 0.2) * s, -0.85 * s, 0.07 * s, 0, TAU); ctx.fillStyle = '#9ccc65'; ctx.fill(); } },
    icewall(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.9 * s, 0); ctx.lineTo(-0.8 * s, -0.4 * s); ctx.lineTo(-0.4 * s, -0.55 * s); ctx.lineTo(0, -0.45 * s); ctx.lineTo(0.4 * s, -0.6 * s); ctx.lineTo(0.85 * s, -0.35 * s); ctx.lineTo(0.9 * s, 0); ctx.closePath(); ctx.fillStyle = 'rgba(205,236,250,0.9)'; ctx.fill(); outline(ctx, 0.04); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo((-0.6 + i * 0.3) * s, -0.1 * s); ctx.lineTo((-0.5 + i * 0.3) * s, -0.4 * s); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.04; ctx.stroke(); } },
    tub(ctx, p) { const s = p.s; ctx.beginPath(); ctx.moveTo(-0.55 * s, -0.9 * s); ctx.lineTo(-0.5 * s, 0); ctx.lineTo(0.5 * s, 0); ctx.lineTo(0.55 * s, -0.9 * s); ctx.closePath(); ctx.fillStyle = '#80deea'; ctx.fill(); outline(ctx); ctx.fillStyle = '#fff'; ctx.fillRect(-0.5 * s, -0.6 * s, 1.0 * s, 0.3 * s); ctx.fillStyle = '#006064'; ctx.font = `bold ${0.16 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('VANILLE', 0, -0.38 * s); ctx.beginPath(); ctx.roundRect(-0.58 * s, -1.0 * s, 1.16 * s, 0.12 * s, 0.04 * s); ctx.fillStyle = '#00acc1'; ctx.fill(); outline(ctx, 0.04); },
  };

  // ------------------------------------------------------------------ scène
  R.frame = function (ctx, run, t) {
    const cam = run.cam, pal = run.level.palette, lvl = run.level;
    // fond : intérieur du frigo (lumière en haut)
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal.light); g.addColorStop(0.45, pal.sky); g.addColorStop(1, pal.fog); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // murs (fond + côtés) : grandes faces verticales avec rainures
    const back = lvl.props.find(p => p.kind === 'wallback'), sides = lvl.props.filter(p => p.kind === 'wallside');
    const xl = sides.length ? Math.min(...sides.map(p => p.x)) : -16, xr = sides.length ? Math.max(...sides.map(p => p.x)) : 16, zb = back ? back.z : 190, WALL_H = 9;
    poly(ctx, cam, [[xl, 0, zb], [xr, 0, zb], [xr, WALL_H, zb], [xl, WALL_H, zb]], pal.wall, pal);
    poly(ctx, cam, [[xl, 0, -20], [xl, 0, zb], [xl, WALL_H, zb], [xl, WALL_H, -20]], shade(pal.wall, 0.92), pal);
    poly(ctx, cam, [[xr, 0, -20], [xr, 0, zb], [xr, WALL_H, zb], [xr, WALL_H, -20]], shade(pal.wall, 0.92), pal);
    // plafond : le dessous de l'étagère du dessus, avec la lampe du frigo
    poly(ctx, cam, [[xl, WALL_H, -20], [xr, WALL_H, -20], [xr, WALL_H, zb], [xl, WALL_H, zb]], shade(pal.wall, 0.85), pal);
    { const lp = FS.project(cam, 0, WALL_H - 0.3, cam.z + 18); if (lp) { const rg = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 160 * lp.k / 20 + 120); rg.addColorStop(0, 'rgba(255,250,210,0.9)'); rg.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); } }
    // rainures horizontales sur les murs (étagère du dessus)
    for (const x of [xl, xr]) for (const y of [4, 8]) poly(ctx, cam, [[x, y, -20], [x, y, zb], [x, y + 0.25, zb], [x, y + 0.25, -20]], shade(pal.wall, 0.8), pal);
    // sol : carreaux de 3 unités, jusqu'à 45 unités devant/autour
    const T = 3, cz0 = Math.floor((cam.z - 8) / T) * T, cz1 = Math.min(zb, cam.z + 48);
    for (let z = cz0; z < cz1; z += T) for (let x = Math.ceil(xl / T) * T - T; x < xr; x += T) {
      const even = ((x / T + z / T) & 1) === 0; const x0 = Math.max(x, xl), x1 = Math.min(x + T, xr);
      poly(ctx, cam, [[x0, 0, z], [x1, 0, z], [x1, 0, z + T], [x0, 0, z + T]], even ? pal.floor : pal.floor2, pal);
    }
    // bord de l'étagère (rebord) au fond
    poly(ctx, cam, [[xl, 0, zb - 0.6], [xr, 0, zb - 0.6], [xr, 0.5, zb - 0.6], [xl, 0.5, zb - 0.6]], shade(pal.floor2, 0.8), pal);
    // rail : deux traverses le long du chemin
    drawRail(ctx, run, pal);
    // objets triés par profondeur
    const items = [];
    for (const p of lvl.props) { if (p.kind.startsWith('wall')) continue; const q = FS.project(cam, p.x, 0, p.z); if (!q || q.z > FS.FAR) continue; items.push({ z: q.z, kind: 'prop', p, q }); }
    for (const c of run.creatures) { if (!c.visible) continue; const q = FS.project(cam, c.x, c.y, c.z); if (!q || q.z > FS.FAR) continue; items.push({ z: q.z, kind: 'creature', c, q }); }
    for (const b of run.baits) { const q = FS.project(cam, b.x, b.y, b.z); if (q) items.push({ z: q.z, kind: 'bait', b, q }); }
    for (const p of run.projectiles) { const q = FS.project(cam, p.x, p.y, p.z); if (q) items.push({ z: q.z, kind: 'proj', p, q }); }
    for (const f of run.fx) { const q = FS.project(cam, f.x, f.y, f.z); if (q) items.push({ z: q.z, kind: 'fx', f, q }); }
    items.sort((a, b) => b.z - a.z);
    for (const it of items) {
      const fk = fogK(pal, it.z); ctx.globalAlpha = 1 - fk * 0.85;
      if (it.kind === 'prop') { const sp = propSprite(it.p, pal); const hpx = sp.h * it.q.k, wpx = sp.w * it.q.k; ctx.drawImage(sp.cv, it.q.x - wpx / 2 - 4 * it.q.k / PX, it.q.y - hpx - 4 * it.q.k / PX, wpx + 8 * it.q.k / PX, hpx + 8 * it.q.k / PX); }
      else if (it.kind === 'creature') {
        const c = it.c;
        if (c.y > 0.05) { const sh = FS.project(cam, c.x, 0, c.z); if (sh) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, c.sp.r * sh.k * 0.9, c.sp.r * sh.k * 0.28, 0, 0, TAU); ctx.fill(); } }
        ctx.save(); ctx.translate(it.q.x, it.q.y); ctx.scale(it.q.k * c.scale, it.q.k * c.scale); ctx.lineJoin = 'round'; FS.Sprites.draw(ctx, c, cam, t + c.anim); ctx.restore();
      }
      else if (it.kind === 'bait') { ctx.save(); ctx.translate(it.q.x, it.q.y); ctx.scale(it.q.k, it.q.k); drawCrouton(ctx, 0.28, 0); ctx.restore(); }
      else if (it.kind === 'proj') { ctx.save(); ctx.translate(it.q.x, it.q.y); ctx.scale(it.q.k, it.q.k); if (it.p.kind === 'crouton') drawCrouton(ctx, 0.28, it.p.rot); else drawDrop(ctx); ctx.restore(); }
      else if (it.kind === 'fx') drawFx(ctx, it.f, it.q);
    }
    ctx.globalAlpha = 1;
    // lumière froide : léger voile et vignettage
    if (pal.dark) { ctx.fillStyle = 'rgba(10,20,30,0.18)'; ctx.fillRect(0, 0, W, H); }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,30,0.35)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (run.flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${run.flashT / 0.25 * 0.9})`; ctx.fillRect(0, 0, W, H); }
  };

  function drawRail(ctx, run, pal) {
    const cam = run.cam, rail = run.rail; const d0 = Math.max(0, run.dist - 6), d1 = Math.min(rail.length, run.dist + 50);
    ctx.strokeStyle = mix('#7a6a55', pal.fog, 0.3); let prev = null;
    for (let d = d0; d <= d1; d += 2) {
      const p = rail.at(d), nx = Math.cos(p.yaw), nz = -Math.sin(p.yaw);
      const L = FS.project(cam, p.x - nx * 0.45, 0.02, p.z - nz * 0.45), Rr = FS.project(cam, p.x + nx * 0.45, 0.02, p.z + nz * 0.45);
      if (L && Rr && prev && prev.L && prev.R) { const fk = fogK(pal, L.z); ctx.globalAlpha = 1 - fk; ctx.lineWidth = Math.max(1, 0.08 * L.k); ctx.beginPath(); ctx.moveTo(prev.L.x, prev.L.y); ctx.lineTo(L.x, L.y); ctx.moveTo(prev.R.x, prev.R.y); ctx.lineTo(Rr.x, Rr.y); ctx.stroke(); if (Math.floor(d / 2) % 2 === 0) { ctx.lineWidth = Math.max(1, 0.12 * L.k); ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(Rr.x, Rr.y); ctx.stroke(); } }
      prev = { L, R: Rr };
    }
    ctx.globalAlpha = 1;
  }
  function drawCrouton(ctx, s, rot) { ctx.save(); ctx.rotate(rot || 0); ctx.translate(0, -s * 0.6); ctx.beginPath(); ctx.roundRect(-s, -s * 0.8, s * 2, s * 1.6, s * 0.25); ctx.fillStyle = '#d9a35a'; ctx.fill(); ctx.lineWidth = 0.05; ctx.strokeStyle = OUT; ctx.stroke(); ctx.fillStyle = '#f3dcae'; ctx.fillRect(-s * 0.7, -s * 0.5, s * 1.4, s * 1.0); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-s * 0.4 + i * s * 0.3, -s * 0.1 + (i % 2) * s * 0.3, s * 0.08, 0, TAU); ctx.fillStyle = '#8bc34a'; ctx.fill(); } ctx.restore(); }
  function drawDrop(ctx) { ctx.beginPath(); ctx.moveTo(0, -0.5); ctx.quadraticCurveTo(0.22, -0.2, 0, 0); ctx.quadraticCurveTo(-0.22, -0.2, 0, -0.5); ctx.fillStyle = '#e53935'; ctx.fill(); ctx.lineWidth = 0.04; ctx.strokeStyle = OUT; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-0.06, -0.22, 0.05, 0, TAU); ctx.fill(); }
  function drawFx(ctx, f, q) {
    const p = f.t / f.dur, k = q.k;
    if (f.kind === 'splat') { ctx.globalAlpha *= 1 - p * 0.6; ctx.fillStyle = '#d32f2f'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(q.x + Math.cos(i * 0.9) * 0.4 * k * (0.5 + p), q.y + Math.sin(i * 0.9) * 0.12 * k * (0.5 + p), 0.16 * k, 0.07 * k, i, 0, TAU); ctx.fill(); } }
    else if (f.kind === 'ring') { ctx.strokeStyle = `rgba(79,195,247,${1 - p})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(q.x, q.y, p * FS.CLIC_R * k, p * FS.CLIC_R * k * 0.35, 0, 0, TAU); ctx.stroke(); }
    else if (f.kind === 'sparkle') { ctx.fillStyle = `rgba(255,241,118,${1 - p})`; ctx.beginPath(); ctx.arc(q.x, q.y - p * 0.5 * k, 0.08 * k, 0, TAU); ctx.fill(); }
  }

  // ------------------------------------------------------------------ viseur et interface
  R.hud = function (ctx, run, ui) {
    const pad = 46;
    // cadre de visée façon appareil photo
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; const L = 46;
    for (const [sx, sy] of [[pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]]) { const dx = sx < W / 2 ? 1 : -1, dy = sy < H / 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(sx, sy + dy * L); ctx.lineTo(sx, sy); ctx.lineTo(sx + dx * L, sy); ctx.stroke(); }
    // réticule central
    const cx = W / 2, cy = H / 2, aim = run.aimPoint();
    ctx.strokeStyle = aim.creature ? '#ffd600' : 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.stroke(); ctx.beginPath(); for (const [a, b] of [[-34, -12], [12, 34]]) { ctx.moveTo(cx + a, cy); ctx.lineTo(cx + b, cy); ctx.moveTo(cx, cy + a); ctx.lineTo(cx, cy + b); } ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, TAU); ctx.fill();
    if (aim.creature) { ctx.font = 'bold 15px Trebuchet MS, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd600'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.fillText(aim.creature.sp.name + ' · ' + aim.creature.poseInfo.label, cx, cy + 46); ctx.shadowBlur = 0; }
    // pellicule
    ctx.textAlign = 'right'; ctx.font = 'bold 22px Trebuchet MS, sans-serif'; ctx.fillStyle = run.film <= 5 ? '#ff5252' : '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
    ctx.fillText(`CLICHÉS ${run.film} / ${FS.FILM}`, W - pad - 10, pad + 32);
    // niveau et progression
    ctx.textAlign = 'left'; ctx.font = 'bold 18px Trebuchet MS, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(run.level.name.toUpperCase(), pad + 10, pad + 28);
    ctx.shadowBlur = 0; const pw = 240, px = pad + 10, py = pad + 40; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px, py, pw, 8); ctx.fillStyle = '#69f0ae'; ctx.fillRect(px, py, pw * run.dist / run.rail.length, 8);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + pw * run.dist / run.rail.length, py + 4, 6, 0, TAU); ctx.fill();
    // outils
    const tools = FS.TOOLS.filter(t => t.id !== 'dash'); let tx = pad + 10, ty = H - pad - 54;
    for (const tool of tools) {
      const have = run.hasTool(tool.id), sel = run.tool === tool.id, cd = run.cooldowns[tool.id] || 0;
      ctx.fillStyle = sel ? 'rgba(255,214,0,0.9)' : 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(tx, ty, 150, 50, 10); ctx.fill();
      if (!have) { ctx.fillStyle = 'rgba(120,120,120,0.5)'; ctx.beginPath(); ctx.roundRect(tx, ty, 150, 50, 10); ctx.fill(); }
      ctx.fillStyle = have ? tool.color : '#777'; ctx.beginPath(); ctx.arc(tx + 25, ty + 25, 14, 0, TAU); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
      if (cd > 0 && have) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(tx + 25, ty + 25); ctx.arc(tx + 25, ty + 25, 14, -Math.PI / 2, -Math.PI / 2 + TAU * cd / tool.cooldown); ctx.fill(); }
      ctx.fillStyle = sel ? '#000' : '#fff'; ctx.font = 'bold 14px Trebuchet MS, sans-serif'; ctx.fillText(have ? tool.short : 'Verrouillé', tx + 46, ty + 22);
      ctx.font = '12px Trebuchet MS, sans-serif'; ctx.fillStyle = sel ? '#333' : '#bbb'; ctx.fillText(have ? 'touche ' + tool.key : FS.fmt(tool.unlock) + ' pts', tx + 46, ty + 40);
      tx += 158;
    }
    if (run.hasTool('dash')) { ctx.fillStyle = run.dash ? '#69f0ae' : 'rgba(255,255,255,0.7)'; ctx.font = 'bold 14px Trebuchet MS, sans-serif'; ctx.fillText(run.dash ? '▶▶ PÉDALE' : 'Maj : pédale', tx + 6, ty + 30); }
    // aide
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '13px Trebuchet MS, sans-serif'; ctx.fillText('Souris : viser · Clic gauche / Espace : photo · Clic droit : outil · Molette : changer d\'outil', W - pad - 10, H - pad - 12);
    // dernier cliché (vignette)
    if (ui && ui.lastPhoto && ui.lastPhotoT > 0) {
      const a = Math.min(1, ui.lastPhotoT / 0.3); const tw = 240, th = 135, x = W - pad - 10 - tw, y = pad + 56;
      ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, y - 6, tw + 12, th + 34); ctx.drawImage(ui.lastPhoto.thumb, x, y, tw, th);
      ctx.fillStyle = '#222'; ctx.font = 'bold 14px Trebuchet MS, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(ui.lastPhoto.subject ? `${ui.lastPhoto.subject.name} · ${(FS.POSES[ui.lastPhoto.subject.pose] || FS.POSES.idle).label}` : 'Rien d\'intéressant…', x + 2, y + th + 20); ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  };

  // Fernand (rat-taupe nu en toque) pour les écrans de jugement : dessiné dans un petit canevas
  R.fernand = function (ctx, w, h, t, mood) {
    ctx.clearRect(0, 0, w, h); ctx.save(); ctx.translate(w / 2, h * 0.95); const s = h / 3.2; ctx.scale(s, s); ctx.lineJoin = 'round';
    const talk = mood === 'talk' ? Math.abs(Math.sin(t * 14)) : 0;
    // corps rose ridé avec tablier
    ctx.beginPath(); ctx.ellipse(0, -0.9, 0.75, 0.95, 0, 0, TAU); ctx.fillStyle = '#f3b8a0'; ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.moveTo(-0.5, -1.3); ctx.lineTo(0.5, -1.3); ctx.lineTo(0.6, -0.1); ctx.lineTo(-0.6, -0.1); ctx.closePath(); ctx.fillStyle = '#fafafa'; ctx.fill(); outline(ctx, 0.04);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-0.25 + i * 0.25, -0.6 + (i % 2) * 0.2, 0.09, 0.06, i, 0, TAU); ctx.fillStyle = '#f9c22e'; ctx.fill(); }
    // tête
    ctx.beginPath(); ctx.ellipse(0, -2.0, 0.62, 0.55, 0, 0, TAU); ctx.fillStyle = '#f3b8a0'; ctx.fill(); outline(ctx);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-0.5, -2.35 + i * 0.1); ctx.quadraticCurveTo(0, -2.45 + i * 0.1, 0.5, -2.35 + i * 0.1); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.03; ctx.stroke(); }
    // museau et dents
    ctx.beginPath(); ctx.ellipse(0.45, -1.85, 0.3, 0.22, 0, 0, TAU); ctx.fillStyle = '#f7cbb6'; ctx.fill(); outline(ctx, 0.04);
    ctx.fillStyle = '#fff'; ctx.fillRect(0.45, -1.72, 0.08, 0.2 + talk * 0.05); ctx.fillRect(0.55, -1.72, 0.08, 0.2 + talk * 0.05); ctx.strokeStyle = OUT; ctx.lineWidth = 0.03; ctx.strokeRect(0.45, -1.72, 0.08, 0.2 + talk * 0.05); ctx.strokeRect(0.55, -1.72, 0.08, 0.2 + talk * 0.05);
    ctx.beginPath(); ctx.arc(0.72, -1.9, 0.06, 0, TAU); ctx.fillStyle = '#c2185b'; ctx.fill();
    // yeux : un monocle en fond de bouteille
    ctx.beginPath(); ctx.arc(-0.15, -2.1, 0.07, 0, TAU); ctx.fillStyle = OUT; ctx.fill();
    ctx.beginPath(); ctx.arc(0.25, -2.1, 0.2, 0, TAU); ctx.fillStyle = 'rgba(200,230,160,0.6)'; ctx.fill(); ctx.lineWidth = 0.05; ctx.strokeStyle = '#8d6e00'; ctx.stroke(); ctx.beginPath(); ctx.arc(0.25 + (mood === 'angry' ? -0.05 : 0), -2.1, 0.09, 0, TAU); ctx.fillStyle = OUT; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.4, -1.95); ctx.quadraticCurveTo(0.7, -1.6, 0.6, -1.2); ctx.strokeStyle = '#8d6e00'; ctx.lineWidth = 0.03; ctx.stroke();
    if (mood === 'angry') { ctx.beginPath(); ctx.moveTo(-0.35, -2.3); ctx.lineTo(-0.05, -2.2); ctx.moveTo(0.5, -2.35); ctx.lineTo(0.1, -2.25); ctx.strokeStyle = OUT; ctx.lineWidth = 0.05; ctx.stroke(); }
    if (mood === 'happy') { ctx.beginPath(); ctx.arc(-0.15, -2.15, 0.1, Math.PI, TAU); ctx.strokeStyle = OUT; ctx.lineWidth = 0.05; ctx.stroke(); }
    // toque graisseuse
    ctx.beginPath(); ctx.rect(-0.5, -2.75, 1.0, 0.3); ctx.fillStyle = '#f5f5f5'; ctx.fill(); outline(ctx, 0.04);
    ctx.beginPath(); ctx.ellipse(0, -2.95, 0.62, 0.35, 0, 0, TAU); ctx.fillStyle = '#fafafa'; ctx.fill(); outline(ctx, 0.04);
    ctx.beginPath(); ctx.ellipse(-0.2, -2.9, 0.12, 0.07, 0.3, 0, TAU); ctx.fillStyle = '#d7ccc8'; ctx.fill();
    // bras tenant une loupe
    ctx.beginPath(); ctx.moveTo(-0.6, -1.0); ctx.lineTo(-1.2, -1.6 + Math.sin(t * 2) * 0.05); ctx.strokeStyle = '#f3b8a0'; ctx.lineWidth = 0.22; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.05; ctx.stroke();
    ctx.beginPath(); ctx.arc(-1.4, -2.0 + Math.sin(t * 2) * 0.05, 0.3, 0, TAU); ctx.fillStyle = 'rgba(180,220,255,0.5)'; ctx.fill(); ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 0.06; ctx.stroke();
    ctx.restore();
  };
})(window.FS);
