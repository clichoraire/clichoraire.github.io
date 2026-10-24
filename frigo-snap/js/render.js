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

  // API pour les boîtes 3D de props.js : projection d'un polygone monde → points écran (ou null si hors champ)
  R.toScreen = function (cam, worldPts) { const cp = clipNear(worldPts.map(p => toCam(cam, p))); if (cp.length < 3) return null; let zs = 0; const out = cp.map(p => { const k = cam.f / p[2]; zs += p[2]; return [W / 2 + p[0] * k, H / 2 - p[1] * k]; }); out.z = zs / cp.length; return out; };
  R.mix = mix; R.fogK = fogK;

  // ------------------------------------------------------------------ accessoires (sprites en cache)
  const cache = {};
  const PX = 72; // pixels par unité dans les sprites d'accessoires
  FS.PROP_SCALE = 2.6; // on est minuscule : le décor est à l'échelle d'un dinosaure
  const NO_SCALE = { carton: 1, cave: 1, icewall: 1, lasagna: 1.4, shards: 1.2, icicle: 2.0, shelfpiece: 1.3, cobweb: 1.6 }; // accessoires liés à des créatures : échelle propre
  const propScale = p => p.scale != null ? p.scale : (NO_SCALE[p.kind] || FS.PROP_SCALE);
  const FLAT = { puddle: 1, crumbs: 1, frost: 1 };
  function propSprite(p, pal) {
    const key = p.kind + '|' + p.s + '|' + (p.color || '') + '|' + (p.label || '') + '|' + (pal.dark ? 'd' : '') + (p.broken ? 'b' : '') + (p.flip ? 'f' : '') + '|' + (p.rot || 0);
    if (cache[key]) return cache[key];
    const dims = propDims(p); const cv = document.createElement('canvas'); cv.width = Math.ceil(dims.w * PX) + 16; cv.height = Math.ceil(dims.h * PX) + 16;
    const ctx = cv.getContext('2d'); ctx.translate(cv.width / 2, p.hang ? 8 : cv.height - 8); ctx.scale(PX, PX); ctx.lineJoin = 'round'; if (p.flip) ctx.scale(-1, 1); if (p.rot && !p.hang) ctx.rotate(p.rot * 0.5);
    PROPS[p.kind](ctx, p, pal); cache[key] = { cv, w: dims.w, h: dims.h }; return cache[key];
  }
  const OUT = '#26211f';
  function propDims(p) { return FS.Props.dims(p); }
  const PROPS = FS.Props.sprites;
  // décalques plats sur le sol (polygones projetés)
  function drawFlat(ctx, cam, p, pal) {
    const s = p.s * 0.8, pts = [], n = 10;
    if (p.kind === 'crumbs') { const rng = FS.rng(Math.round(p.x * 13 + p.z * 7)); for (let i = 0; i < 9; i++) { const a = rng() * TAU, r = rng() * s * 0.6, cx = p.x + Math.cos(a) * r, cz = p.z + Math.sin(a) * r, w = 0.15 + rng() * 0.2; poly(ctx, cam, [[cx - w, 0.01, cz - w], [cx + w, 0.01, cz - w], [cx + w, 0.01, cz + w], [cx - w, 0.01, cz + w]], '#c98a3e', pal); } return; }
    for (let i = 0; i < n; i++) { const a = i / n * TAU, r = s * (0.8 + 0.25 * Math.sin(i * 2.7 + p.x)); pts.push([p.x + Math.cos(a) * r, 0.01, p.z + Math.sin(a) * r * 0.7]); }
    const cp = clipNear(pts.map(q => toCam(cam, q))); if (cp.length < 3) return;
    ctx.beginPath(); cp.forEach((q, i) => { const k = cam.f / q[2]; const x = W / 2 + q[0] * k, y = H / 2 - q[1] * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath();
    ctx.fillStyle = p.kind === 'frost' ? 'rgba(255,255,255,0.45)' : (p.color || 'rgba(255,120,80,0.3)'); ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
  }
  // fissures sur les murs (niveau brisé) : lignes brisées générées une fois
  const crackCache = {};
  function cracks(level, xl, xr, zb, WALL_H) {
    if (crackCache[level.id]) return crackCache[level.id]; const out = [], rng = FS.rng(99); const n = level.cracks || 0;
    for (let i = 0; i < n; i++) {
      const wall = rng.int(3); let x = wall === 0 ? xl : wall === 1 ? xr : xl + 2 + rng() * (xr - xl - 4), z = wall === 2 ? zb : 4 + rng() * (zb - 8), y = 2 + rng() * (WALL_H - 3);
      const pts = [[x, y, z]];
      for (let k = 0; k < 9; k++) { const d = 0.25 + rng() * 0.7; if (wall === 2) x += (rng() - 0.5) * d * 1.5; else z += (rng() - 0.5) * d * 1.5; y += (rng() - 0.35) * d; pts.push([x, FS.clamp(y, 0.5, WALL_H - 0.2), z]); if (rng() < 0.3) { const bx = x, bz = z, by = y; pts.push([wall === 2 ? bx + (rng() - 0.5) * 0.6 : bx, by - rng() * 0.5, wall === 2 ? bz : bz + (rng() - 0.5) * 0.6]); pts.push([bx, by, bz]); } }
      out.push(pts);
    }
    return crackCache[level.id] = out;
  }

  // ------------------------------------------------------------------ scène
  R.frame = function (ctx, run, t) {
    const cam = run.cam, pal = run.level.palette, lvl = run.level, level = run.level;
    // fond : intérieur du frigo (lumière en haut)
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal.light); g.addColorStop(0.45, pal.sky); g.addColorStop(1, pal.fog); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // murs (fond + côtés) : grandes faces verticales avec rainures
    const back = lvl.props.find(p => p.kind === 'wallback'), sides = lvl.props.filter(p => p.kind === 'wallside');
    const xl = sides.length ? Math.min(...sides.map(p => p.x)) : -16, xr = sides.length ? Math.max(...sides.map(p => p.x)) : 16, zb = back ? back.z : 190, WALL_H = 24;
    poly(ctx, cam, [[xl, 0, zb], [xr, 0, zb], [xr, WALL_H, zb], [xl, WALL_H, zb]], pal.wall, pal);
    poly(ctx, cam, [[xl, 0, -20], [xl, 0, zb], [xl, WALL_H, zb], [xl, WALL_H, -20]], shade(pal.wall, 0.92), pal);
    poly(ctx, cam, [[xr, 0, -20], [xr, 0, zb], [xr, WALL_H, zb], [xr, WALL_H, -20]], shade(pal.wall, 0.92), pal);
    // plafond : le dessous de l'étagère du dessus, avec la lampe du frigo
    poly(ctx, cam, [[xl, WALL_H, -20], [xr, WALL_H, -20], [xr, WALL_H, zb], [xl, WALL_H, zb]], shade(pal.wall, 0.85), pal);
    // éclairage : niveau de base du tableau, clignotement de l'ampoule fatiguée dans les niveaux brisés
    let light = pal.lightLevel == null ? 1 : pal.lightLevel;
    if (pal.flicker) { const f = Math.sin(t * 13.1) * Math.sin(t * 7.3) * Math.sin(t * 2.9); light *= f > 0.45 ? 0.35 : f < -0.6 ? 0.7 : 1; if (Math.sin(t * 0.37) > 0.97) light *= 0.5; }
    R.light = light;
    { const lp = FS.project(cam, 0, WALL_H - 0.3, cam.z + 24); if (lp) { const rg = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 160 * lp.k / 20 + 160); rg.addColorStop(0, `rgba(255,250,210,${0.9 * light})`); rg.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); } }
    if (level.cracks) { ctx.strokeStyle = 'rgba(30,40,50,0.45)'; ctx.lineWidth = 1.5; for (const line of cracks(level, xl, xr, zb, WALL_H)) { const p0 = FS.project(cam, line[0][0], line[0][1], line[0][2]); if (!p0) continue; ctx.globalAlpha = 1 - fogK(pal, p0.z); ctx.beginPath(); let okp = 0; for (const q of line) { const pr = FS.project(cam, q[0], q[1], q[2]); if (!pr) { okp = 0; continue; } if (okp) ctx.lineTo(pr.x, pr.y); else ctx.moveTo(pr.x, pr.y); okp = 1; } ctx.stroke(); } ctx.globalAlpha = 1; }
    // rainures horizontales sur les murs (étagère du dessus)
    for (const x of [xl, xr]) for (const y of [8, 16]) poly(ctx, cam, [[x, y, -20], [x, y, zb], [x, y + 0.15, zb], [x, y + 0.15, -20]], shade(pal.wall, 0.9), pal);
    // sol : carreaux de 3 unités, jusqu'à 45 unités devant/autour
    const T = 3, cz0 = Math.floor((cam.z - 8) / T) * T, cz1 = Math.min(zb, cam.z + 48);
    for (let z = cz0; z < cz1; z += T) for (let x = Math.ceil(xl / T) * T - T; x < xr; x += T) {
      const even = ((x / T + z / T) & 1) === 0; const x0 = Math.max(x, xl), x1 = Math.min(x + T, xr);
      poly(ctx, cam, [[x0, 0, z], [x1, 0, z], [x1, 0, z + T], [x0, 0, z + T]], even ? pal.floor : pal.floor2, pal);
    }
    // bord de l'étagère (rebord) au fond
    poly(ctx, cam, [[xl, 0, zb - 0.6], [xr, 0, zb - 0.6], [xr, 0.5, zb - 0.6], [xl, 0.5, zb - 0.6]], shade(pal.floor2, 0.8), pal);
    // décalques plats (flaques, miettes, givre)
    for (const p of run.props) if (FLAT[p.kind]) { const q = FS.project(cam, p.x, 0, p.z); if (q && q.z < FS.FAR) drawFlat(ctx, cam, p, pal); }
    // rail : deux traverses le long du chemin
    drawRail(ctx, run, pal);
    // objets triés par profondeur
    const items = [];
    for (const p of run.props) { if (p.kind.startsWith('wall') || FLAT[p.kind]) continue; const q = FS.project(cam, p.x, p.hang ? WALL_H : 0, p.z); if (!q || q.z > FS.FAR) continue; items.push({ z: q.z, kind: 'prop', p, q }); }
    for (const c of run.creatures) { if (!c.visible) continue; const q = FS.project(cam, c.x, c.y, c.z); if (!q || q.z > FS.FAR) continue; items.push({ z: q.z, kind: 'creature', c, q }); }
    for (const b of run.baits) { const q = FS.project(cam, b.x, b.y, b.z); if (q) items.push({ z: q.z, kind: 'bait', b, q }); }
    for (const p of run.projectiles) { const q = FS.project(cam, p.x, p.y, p.z); if (q) items.push({ z: q.z, kind: 'proj', p, q }); }
    for (const f of run.fx) { const q = FS.project(cam, f.x, f.y, f.z); if (q) items.push({ z: q.z, kind: 'fx', f, q }); }
    items.sort((a, b) => b.z - a.z);
    for (const it of items) {
      const fk = fogK(pal, it.z); ctx.globalAlpha = 1 - fk * 0.85;
      if (it.kind === 'prop' && FS.Props.isBox(it.p)) { FS.Props.drawBox(ctx, R, cam, pal, it.p, propScale(it.p), ctx.globalAlpha); }
      else if (it.kind === 'prop') { const sp = propSprite(it.p, pal), ps = propScale(it.p) * it.q.k; const hpx = sp.h * ps, wpx = sp.w * ps, m = 8 * ps / PX; ctx.drawImage(sp.cv, it.q.x - wpx / 2 - m, it.p.hang ? it.q.y - m : it.q.y - hpx - m, wpx + 2 * m, hpx + 2 * m); }
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
    if (light < 1) { ctx.fillStyle = `rgba(4,10,24,${(1 - light) * 0.75})`; ctx.fillRect(0, 0, W, H); }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,30,0.35)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (run.flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${run.flashT / 0.25 * 0.9})`; ctx.fillRect(0, 0, W, H); }
  };

  function drawRail(ctx, run, pal) {
    const cam = run.cam, rail = run.rail; const d0 = Math.max(0, Math.floor((run.dist - 6) / 2) * 2), d1 = Math.min(rail.length, run.dist + 50); // échantillons fixes dans le monde (sinon les traverses glissent avec le chariot)
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
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '13px Trebuchet MS, sans-serif'; ctx.fillText(ui && ui.unlocked ? 'Clique dans l\'image pour capturer la souris (Échap : pause)' : 'Souris : tourner · Clic gauche / Espace : photo · Clic droit : outil · Molette : changer d\'outil', W - pad - 10, H - pad - 12);
    // dernier cliché (vignette)
    if (ui && ui.lastPhoto && ui.lastPhotoT > 0) {
      const a = Math.min(1, ui.lastPhotoT / 0.3); const tw = 240, th = 135, x = W - pad - 10 - tw, y = pad + 56;
      ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, y - 6, tw + 12, th + 34); ctx.drawImage(ui.lastPhoto.thumb, x, y, tw, th);
      ctx.fillStyle = '#222'; ctx.font = 'bold 14px Trebuchet MS, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(ui.lastPhoto.subject ? `${ui.lastPhoto.subject.name} · ${(FS.POSES[ui.lastPhoto.subject.pose] || FS.POSES.idle).label}` : 'Rien d\'intéressant…', x + 2, y + th + 20); ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  };

  // Chef Fernand « Le Fin Museau » : rat-taupe nu en toque, tablier taché de moutarde, monocle en fond de bouteille,
  // grosse loupe tendue vers la photo (à sa gauche). Dessiné dans le canevas de l'écran de jugement.
  R.fernand = function (ctx, w, h, t, mood) {
    ctx.clearRect(0, 0, w, h); ctx.save(); ctx.translate(w / 2 + 30, h * 0.985); const s = h / 4.45; ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const SKIN = '#f3b9a2', SKIN2 = '#e9a088', WRINKLE = 'rgba(120,50,40,0.28)', talk = mood === 'talk' ? Math.max(0, Math.sin(t * 13)) : 0, br = Math.sin(t * 2.2) * 0.02, bob = Math.sin(t * 2.2) * 0.04;
    const fill = (c, lw) => { ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = lw == null ? 0.05 : lw; ctx.strokeStyle = OUT; if (ctx.lineWidth > 0) ctx.stroke(); };
    const ell = (x, y, rx, ry, c, lw, rot) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); fill(c, lw); };
    const circ = (x, y, r, c, lw) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fill(c, lw); };
    const line = (pts, c, lw) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke(); };
    // ombre au sol et queue
    ell(0, 0, 1.0, 0.16, 'rgba(0,0,0,0.25)', 0);
    ctx.beginPath(); ctx.moveTo(0.55, -0.55); ctx.quadraticCurveTo(1.1, -0.7, 1.35, -0.25 + Math.sin(t * 3) * 0.05); ctx.strokeStyle = SKIN2; ctx.lineWidth = 0.14; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.05; ctx.stroke(); ctx.strokeStyle = SKIN; ctx.lineWidth = 0.06; ctx.stroke();
    // pattes arrière et pieds griffus
    for (const sx of [0.38, -0.38]) { ctx.beginPath(); ctx.roundRect(sx - 0.17, -0.6, 0.34, 0.6, 0.12); fill(SKIN); ell(sx - 0.05, -0.04, 0.34, 0.14, SKIN); for (let i = 0; i < 3; i++) line([[sx - 0.3 + i * 0.12, -0.06], [sx - 0.36 + i * 0.12, 0.04]], OUT, 0.035); }
    // corps en poire, rose et ridé
    ctx.save(); ctx.scale(1 + br, 1 - br);
    ctx.beginPath(); ctx.moveTo(-0.55, -2.05); ctx.bezierCurveTo(-1.05, -1.7, -1.05, -0.55, -0.6, -0.35); ctx.lineTo(0.6, -0.35); ctx.bezierCurveTo(1.05, -0.55, 1.05, -1.7, 0.55, -2.05); ctx.closePath(); fill(SKIN);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0.55, -1.0 - i * 0.25); ctx.quadraticCurveTo(0.85, -1.08 - i * 0.25, 0.95, -0.85 - i * 0.25); ctx.strokeStyle = WRINKLE; ctx.lineWidth = 0.04; ctx.stroke(); }
    // tablier blanc, bavette, taches de moutarde, poche avec cuillère en bois, cordon noué
    ctx.beginPath(); ctx.moveTo(-0.42, -1.95); ctx.lineTo(0.42, -1.95); ctx.lineTo(0.62, -0.45); ctx.lineTo(-0.62, -0.45); ctx.closePath(); fill('#fbfbf7', 0.045);
    line([[-0.42, -1.95], [-0.25, -2.25]], '#cfd8dc', 0.05); line([[0.42, -1.95], [0.25, -2.25]], '#cfd8dc', 0.05);
    line([[-0.5, -1.45], [-0.75, -1.5]], '#e0e0e0', 0.06); ctx.beginPath(); ctx.arc(-0.8, -1.5, 0.08, 0, TAU); ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 0.05; ctx.stroke();
    for (const q of [[-0.2, -1.5, 0.11, 0.07, 0.4], [0.18, -1.2, 0.13, 0.08, -0.5], [0.05, -0.8, 0.09, 0.06, 0.2], [-0.3, -0.95, 0.07, 0.05, 1.0]]) ell(q[0], q[1], q[2], q[3], '#f9c22e', 0, q[4]);
    ctx.beginPath(); ctx.roundRect(0.1, -1.05, 0.4, 0.4, 0.05); fill('#eeeeee', 0.04);
    line([[0.3, -1.05], [0.36, -1.5]], '#a1887f', 0.07); ell(0.38, -1.55, 0.09, 0.06, '#bcaaa4', 0.03, -0.3);
    ctx.restore();
    // bras arrière (poing sur la hanche)
    ctx.beginPath(); ctx.moveTo(0.6, -1.85); ctx.quadraticCurveTo(1.15, -1.75, 0.95, -1.2); ctx.strokeStyle = OUT; ctx.lineWidth = 0.3; ctx.stroke(); ctx.strokeStyle = SKIN; ctx.lineWidth = 0.2; ctx.stroke(); circ(0.92, -1.15, 0.15, SKIN);
    // tête : crâne, museau allongé vers la gauche, rides, oreille, œil, moustaches, dents
    ctx.save(); ctx.translate(0, bob);
    circ(0.32, -2.72, 0.12, SKIN2); circ(0.32, -2.72, 0.06, '#d98a74', 0);
    ell(-0.1, -2.62, 0.66, 0.54, SKIN);
    ell(-0.72, -2.5, 0.42, 0.3, '#f7c9b6', 0.05);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-0.45 + i * 0.15, -3.05 + i * 0.03); ctx.quadraticCurveTo(0.05, -3.15 + i * 0.03, 0.45 - i * 0.1, -3.02 + i * 0.03); ctx.strokeStyle = WRINKLE; ctx.lineWidth = 0.035; ctx.stroke(); }
    circ(-1.1, -2.53, 0.1, '#e8698a'); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-1.13, -2.57, 0.03, 0, TAU); ctx.fill();
    for (const sy of [-0.06, 0.02, 0.1]) { line([[-0.9, -2.45 + sy], [-1.45, -2.5 + sy * 2.5]], 'rgba(60,30,30,0.6)', 0.025); line([[-0.6, -2.42 + sy], [-0.45, -2.32 + sy * 2]], 'rgba(60,30,30,0.35)', 0.02); }
    // bouche et incisives
    const open = 0.03 + talk * 0.09;
    ctx.beginPath(); ctx.moveTo(-1.0, -2.3); ctx.quadraticCurveTo(-0.75, -2.2 + open * 1.5, -0.5, -2.28); ctx.strokeStyle = OUT; ctx.lineWidth = 0.04; ctx.stroke();
    if (talk > 0.4) { ell(-0.75, -2.2, 0.12, open, '#7a2a2a', 0.03); }
    for (const tx of [-0.86, -0.72]) { ctx.beginPath(); ctx.roundRect(tx, -2.3, 0.12, 0.26 + talk * 0.03, 0.03); fill('#fffdf5', 0.03); }
    // œil gauche (vers la photo) et monocle en fond de bouteille sur l'œil droit, chaînette vers le tablier
    const angry = mood === 'angry', happy = mood === 'happy';
    if (happy) { ctx.beginPath(); ctx.arc(-0.42, -2.66, 0.08, Math.PI, TAU); ctx.strokeStyle = OUT; ctx.lineWidth = 0.05; ctx.stroke(); }
    else { circ(-0.42, -2.68, 0.075, OUT, 0); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-0.45, -2.71, 0.025, 0, TAU); ctx.fill(); }
    circ(0.12, -2.66, 0.08, OUT, 0); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0.09, -2.69, 0.025, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0.12, -2.66, 0.23, 0, TAU); ctx.fillStyle = 'rgba(200,232,160,0.55)'; ctx.fill(); ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 0.06; ctx.stroke(); ctx.strokeStyle = '#ffe082'; ctx.lineWidth = 0.02; ctx.stroke();
    ctx.beginPath(); ctx.arc(0.04, -2.74, 0.1, Math.PI * 1.1, Math.PI * 1.6); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.035; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.33, -2.55); ctx.quadraticCurveTo(0.62, -2.3, 0.5, -1.95); ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 0.025; ctx.setLineDash([0.04, 0.03]); ctx.stroke(); ctx.setLineDash([]);
    if (angry) { line([[-0.6, -2.88], [-0.28, -2.8]], OUT, 0.06); line([[0.38, -2.9], [0.0, -2.82]], OUT, 0.06); }
    else if (happy) { line([[-0.6, -2.86], [-0.28, -2.9]], OUT, 0.04); line([[0.0, -2.92], [0.36, -2.88]], OUT, 0.04); }
    else { line([[-0.58, -2.84], [-0.3, -2.86]], OUT, 0.04); line([[0.0, -2.88], [0.34, -2.86]], OUT, 0.04); }
    // toque de chef : bandeau, plis, bouffant, taches de gras
    ctx.beginPath(); ctx.roundRect(-0.6, -3.22, 1.2, 0.3, 0.06); fill('#fafafa', 0.045);
    for (let i = 1; i < 5; i++) line([[-0.6 + i * 0.24, -3.2], [-0.6 + i * 0.24, -2.95]], 'rgba(0,0,0,0.12)', 0.03);
    ctx.beginPath(); ctx.moveTo(-0.62, -3.2); ctx.bezierCurveTo(-1.0, -3.5, -0.75, -4.0, -0.35, -3.85); ctx.bezierCurveTo(-0.3, -4.2, 0.3, -4.2, 0.35, -3.85); ctx.bezierCurveTo(0.75, -4.0, 1.0, -3.5, 0.62, -3.2); ctx.closePath(); fill('#ffffff', 0.045);
    ell(-0.25, -3.7, 0.12, 0.08, '#d7ccc8', 0, 0.4); ell(0.3, -3.55, 0.09, 0.06, '#d7ccc8', 0, -0.3); ell(0.12, -3.95, 0.07, 0.05, '#e0d6d0', 0);
    ctx.restore();
    // bras avant tenant la loupe vers la photo
    const hx = -1.32, hy = -1.5 + bob * 2;
    ctx.beginPath(); ctx.moveTo(-0.62, -1.85); ctx.quadraticCurveTo(-1.0, -1.95, hx, hy); ctx.strokeStyle = OUT; ctx.lineWidth = 0.3; ctx.stroke(); ctx.strokeStyle = SKIN; ctx.lineWidth = 0.2; ctx.stroke();
    line([[hx, hy], [hx - 0.35, hy - 0.5]], '#5d4037', 0.12); line([[hx, hy], [hx - 0.35, hy - 0.5]], '#8d6e63', 0.06);
    circ(hx, hy, 0.17, SKIN); line([[hx - 0.12, hy - 0.08], [hx + 0.02, hy - 0.14]], OUT, 0.03);
    const lx = hx - 0.55, ly = hy - 0.85;
    ctx.beginPath(); ctx.arc(lx, ly, 0.42, 0, TAU); ctx.fillStyle = 'rgba(190,228,255,0.45)'; ctx.fill(); ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 0.09; ctx.stroke(); ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 0.03; ctx.stroke();
    ctx.beginPath(); ctx.arc(lx - 0.1, ly - 0.1, 0.24, Math.PI * 1.05, Math.PI * 1.55); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.06; ctx.stroke();
    ctx.restore();
  };
})(window.FS);
