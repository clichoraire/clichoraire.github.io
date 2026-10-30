// Caméra en perspective : vue de haut et de derrière, façon Bomberman 64. Le monde est en cases : x vers la droite,
// y vers le bas de l'écran (vers la caméra), z vers le haut. Les cubes sont dessinés du plus loin au plus proche.
(function (BK) {
  'use strict';
  const RAD = Math.PI / 180;
  class Camera {
    constructor(W, H) {
      this.W = W; this.H = H; this.pitch = 48 * RAD; this.fl = 1400; this.dist = 16;
      this.target = { x: 7.5, y: 6.5 }; this.ox = 0; this.oy = 0;   // ox/oy : décalage écran (HUD)
    }
    get pos() { const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch); return { x: this.target.x, y: this.target.y + cp * this.dist, z: sp * this.dist }; }
    project(x, y, z) {
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch), C = this.pos;
      const dx = x - C.x, dy = y - C.y, dz = (z || 0) - C.z;
      const depth = -dy * cp - dz * sp;             // vers l'avant (f = (0,-cos,-sin))
      const up = -dy * sp + dz * cp;                 // vers le haut de la caméra (u = (0,-sin,cos))
      const k = this.fl / Math.max(0.1, depth);
      return { x: this.W / 2 + this.ox + dx * k, y: this.H / 2 + this.oy - up * k, k, depth };
    }
    // Inverse : le point du plan z qui se projette en (sx, sy) à l'écran.
    unproject(sx, sy, z) {
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch), C = this.pos;
      const a = (sx - this.W / 2 - this.ox) / this.fl, b = -(sy - this.H / 2 - this.oy) / this.fl, dz = (z || 0) - C.z;
      const dy = -dz * (b * sp + cp) / (b * cp - sp), depth = -dy * cp - dz * sp;
      return { x: C.x + a * depth, y: C.y + dy };
    }
    // Échelle à l'endroit (x,y,0) : pixels par case, horizontalement.
    scaleAt(x, y, z) { return this.project(x, y, z || 0).k; }
    // Cadre tout le plateau (cols × rows cases, hauteur 1) dans l'écran moins les marges.
    fit(cols, rows, margin) {
      margin = margin || { top: 70, bottom: 30, left: 30, right: 30 };
      this.target = { x: cols / 2, y: rows / 2 + 0.3 };
      this.ox = Math.round((margin.left + (this.W - margin.right)) / 2 - this.W / 2);
      let lo = 3, hi = 80;
      const fits = d => {
        this.dist = d;
        const pts = [[0, 0, 1], [cols, 0, 1], [0, rows, 0], [cols, rows, 0], [0, 0, 0], [cols, 0, 0], [0, rows, 1], [cols, rows, 1]].map(p => this.project(p[0], p[1], p[2]));
        return pts.every(p => p.x >= margin.left && p.x <= this.W - margin.right && p.y >= margin.top && p.y <= this.H - margin.bottom);
      };
      for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (fits(m)) hi = m; else lo = m; }
      this.dist = hi;
      // Centre verticalement : on mesure l'étendue réelle et on ajuste la cible.
      const top = this.project(cols / 2, 0, 1).y, bottom = this.project(cols / 2, rows, 0).y;
      const want = (margin.top + (this.H - margin.bottom)) / 2, have = (top + bottom) / 2;
      this.oy = Math.round(want - have);
      return this.dist;
    }
  }
  BK.Camera = Camera;

  // ---------------------------------------------------------------- primitives 3D
  const D = BK.draw3d = {};
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + [f(n >> 16), f(n >> 8 & 255), f(n & 255)].map(c => c.toString(16).padStart(2, '0')).join(''); };
  D.shade = shade;
  D.quad = function (ctx, p, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  // Point d'un quadrilatère projeté (bilinéaire) : u le long de p0→p1, v le long de p0→p3.
  D.onQuad = (p, u, v) => { const a = lerp(p[0], p[1], u), b = lerp(p[3], p[2], u); return lerp(a, b, v); };

  // Cube de (x0,y0) à (x1,y1), hauteur h, posé au sol (z0). faces : top, front (vers la caméra), side.
  D.cube = function (ctx, cam, x0, y0, x1, y1, h, col, o) {
    o = o || {}; const z0 = o.z || 0;
    const P = (x, y, z) => cam.project(x, y, z);
    const t0 = P(x0, y0, z0 + h), t1 = P(x1, y0, z0 + h), t2 = P(x1, y1, z0 + h), t3 = P(x0, y1, z0 + h);
    const b0 = P(x0, y0, z0), b1 = P(x1, y0, z0), b2 = P(x1, y1, z0), b3 = P(x0, y1, z0);
    const camX = cam.pos.x, cx = (x0 + x1) / 2;
    // faces : o.faces = { front, east, west } (true par défaut) pour ne pas dessiner un côté collé à un voisin de même hauteur
    const F = o.faces || {};
    let side = null;
    if (cx < camX - 0.01 && F.east !== false) side = [t1, t2, b2, b1];        // face droite visible
    else if (cx > camX + 0.01 && F.west !== false) side = [t0, t3, b3, b0];   // face gauche visible
    if (side) D.quad(ctx, side, col.side || shade(col.front, 0.78));
    const front = [t3, t2, b2, b3];
    if (F.front !== false) D.quad(ctx, front, col.front);
    if (o.bricks) D.bricks(ctx, front, o.bricks, o.rows || 3, o.cols || 2);
    if (side && o.bricks) D.bricks(ctx, side, o.bricks, o.rows || 3, o.cols || 2);
    const top = [t0, t1, t2, t3];
    D.quad(ctx, top, col.top);
    if (o.topInset) { const q = [D.onQuad(top, 0.15, 0.15), D.onQuad(top, 0.85, 0.15), D.onQuad(top, 0.85, 0.85), D.onQuad(top, 0.15, 0.85)]; D.quad(ctx, q, o.topInset); }
    if (o.outline) { ctx.lineWidth = 1; ctx.strokeStyle = o.outline; D.quad(ctx, top, null, o.outline); if (F.front !== false) D.quad(ctx, front, null, o.outline); if (side) D.quad(ctx, side, null, o.outline); }
    return { top, front, side };
  };
  // Joints de briques sur une face projetée.
  D.bricks = function (ctx, q, color, rows, cols) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let r = 1; r < rows; r++) { const a = D.onQuad(q, 0, r / rows), b = D.onQuad(q, 1, r / rows); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const u = (c + (r % 2 ? 0.5 : 1)) / cols; if (u >= 1) continue;
      const a = D.onQuad(q, u, r / rows), b = D.onQuad(q, u, (r + 1) / rows); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  };
  // Ombre au sol (ellipse projetée).
  D.shadow = function (ctx, cam, x, y, r, alpha, z) {
    z = z || 0; const c = cam.project(x, y, z), a = cam.project(x + r, y, z), b = cam.project(x, y + r, z);
    ctx.fillStyle = 'rgba(0,0,0,' + (alpha == null ? 0.28 : alpha) + ')';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, Math.abs(a.x - c.x), Math.max(1, Math.abs(b.y - c.y)), 0, 0, Math.PI * 2); ctx.fill();
  };
  // Tuile de sol.
  D.tile = function (ctx, cam, x, y, fill, inset, z) {
    z = z || 0; const p = [cam.project(x, y, z), cam.project(x + 1, y, z), cam.project(x + 1, y + 1, z), cam.project(x, y + 1, z)];
    D.quad(ctx, p, fill);
    if (inset) { const q = [D.onQuad(p, 0.08, 0.08), D.onQuad(p, 0.92, 0.08), D.onQuad(p, 0.92, 0.92), D.onQuad(p, 0.08, 0.92)]; D.quad(ctx, q, inset); }
    return p;
  };
})(window.BK);
