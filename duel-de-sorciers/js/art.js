// Dessins procéduraux : salle de duel, sorciers, baguettes, icônes des sorts.
(function () {
  'use strict';
  var DS = window.DS = window.DS || {};
  var TAU = Math.PI * 2;

  // Accepte '#rrggbb' ou 'rgb(r,g,b)' (les couleurs déjà mélangées repassent ici quand on teinte un sorcier).
  function rgb(h) {
    if (h.charAt(0) !== '#') return h.slice(h.indexOf('(') + 1).split(',').map(function (v) { return parseInt(v, 10); });
    var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')'; }
  function shade(h, t) { return t < 0 ? mix(h, '#000000', -t) : mix(h, '#ffffff', t); }
  function rgba(h, a) { var c = rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  function star(g, x, y, r) { g.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }
  function ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); }
  function seeded(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  // ───────────────────────── Salle de duel ─────────────────────────
  // Perspective à un point de fuite : un point du mur du fond (x, y) avancé vers nous d'un facteur s
  // se retrouve à VP + (point − VP) × s.
  function hallGeom(W, H) {
    var g = { W: W, H: H, vpx: W / 2, vpy: H * 0.44, bx0: W * 0.27, bx1: W * 0.73, by1: H * 0.62, S: 4.4 };
    g.topDy = (g.by1 - g.vpy) * 0.93; // la piste de duel est un peu surélevée
    g.hw = W * 0.085;                  // demi-largeur de la piste au mur du fond
    var sf = 1.18;
    g.foe = { x: g.vpx, y: g.vpy + g.topDy * sf, h: H * 0.39 };
    g.torches = [];
    [1.42, 2.15].forEach(function (s) {
      [g.bx0, g.bx1].forEach(function (bx) { g.torches.push({ x: g.vpx + (bx - g.vpx) * s, y: g.vpy + (H * 0.345 - g.vpy) * s, r: H * 0.022 * s }); });
    });
    var r = seeded(77); g.candles = [];
    for (var i = 0; i < 11; i++) g.candles.push({ x: W * (0.08 + r() * 0.84), y: H * (0.035 + r() * 0.17), s: 0.6 + r() * 0.8, ph: r() * TAU });
    return g;
  }

  // variant 'classe' : le coin de la classe où l'on fait sa démonstration (tableau noir au mur, élèves qui regardent).
  function makeHall(W, H, dpr, variant) {
    var c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    var g = c.getContext('2d'); g.scale(dpr, dpr);
    var geo = hallGeom(W, H), vpx = geo.vpx, vpy = geo.vpy, bx0 = geo.bx0, bx1 = geo.bx1, by1 = geo.by1, S = geo.S, bw = bx1 - bx0;
    var P = function (x, y, s) { return [vpx + (x - vpx) * s, vpy + (y - vpy) * s]; };
    var gr, i, s;

    g.fillStyle = '#0c0a18'; g.fillRect(0, 0, W, H);

    // Murs latéraux
    [[bx0, -1], [bx1, 1]].forEach(function (side) {
      var bx = side[0], far = P(bx, by1, S), farTop = P(bx, -H * 0.4, S);
      gr = g.createLinearGradient(bx, 0, bx + side[1] * W * 0.3, 0);
      gr.addColorStop(0, '#2b2742'); gr.addColorStop(1, '#16132a');
      g.fillStyle = gr; poly(g, [[bx, -H * 0.4], [bx, by1], far, farTop]); g.fill();
      // assises de pierre qui fuient vers le point de fuite
      g.strokeStyle = 'rgba(8,6,18,0.45)'; g.lineWidth = 1.2;
      for (var y = -H * 0.36; y < by1; y += H * 0.062) { var a = P(bx, y, 1), b = P(bx, y, S); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      for (var z = 0.96, k = 0; z > 0.24; z -= 0.045, k++) {
        s = 1 / z;
        for (var yy = -H * 0.36, row = 0; yy < by1; yy += H * 0.062, row++) {
          if ((row + k) % 2) continue;
          var t0 = P(bx, yy, s), t1 = P(bx, yy + H * 0.062, s); g.beginPath(); g.moveTo(t0[0], t0[1]); g.lineTo(t1[0], t1[1]); g.stroke();
        }
      }
      // halos chauds des torches
      geo.torches.forEach(function (t) {
        if ((t.x < vpx) !== (side[1] < 0)) return;
        gr = g.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * 9);
        gr.addColorStop(0, 'rgba(255,170,80,0.42)'); gr.addColorStop(0.4, 'rgba(255,120,50,0.14)'); gr.addColorStop(1, 'rgba(255,120,50,0)');
        g.save(); poly(g, [[bx, -H * 0.4], [bx, by1], far, farTop]); g.clip(); g.fillStyle = gr; g.fillRect(t.x - t.r * 9, t.y - t.r * 9, t.r * 18, t.r * 18); g.restore();
      });
      // colonnes
      [1.2, 1.75, 2.75].forEach(function (cs) {
        var cx = vpx + (bx - vpx) * cs, fy = vpy + (by1 - vpy) * cs, cw = W * 0.021 * cs;
        gr = g.createLinearGradient(cx - cw, 0, cx + cw, 0);
        gr.addColorStop(0, '#1b1830'); gr.addColorStop(0.45, '#4a4468'); gr.addColorStop(1, '#221e3a');
        g.fillStyle = gr; g.fillRect(cx - cw, -10, cw * 2, fy + 10);
        g.fillStyle = '#353052'; g.fillRect(cx - cw * 1.35, fy - cw * 0.9, cw * 2.7, cw * 0.9);
        g.fillStyle = '#2a2644'; g.fillRect(cx - cw * 1.2, fy - cw * 1.5, cw * 2.4, cw * 0.6);
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(cx - cw * 1.35, fy - 2, cw * 2.7, 4);
      });
      // supports de torches
      geo.torches.forEach(function (t) {
        if ((t.x < vpx) !== (side[1] < 0)) return;
        g.fillStyle = '#17131f'; g.fillRect(t.x - t.r * 0.22, t.y, t.r * 0.44, t.r * 2.3);
        poly(g, [[t.x - t.r * 0.75, t.y], [t.x + t.r * 0.75, t.y], [t.x + t.r * 0.35, t.y + t.r * 0.8], [t.x - t.r * 0.35, t.y + t.r * 0.8]]); g.fill();
      });
    });

    // Mur du fond
    gr = g.createLinearGradient(0, 0, 0, by1);
    gr.addColorStop(0, '#1a1730'); gr.addColorStop(0.6, '#2c2846'); gr.addColorStop(1, '#201c36');
    g.fillStyle = gr; g.fillRect(bx0, 0, bw, by1);
    g.strokeStyle = 'rgba(8,6,18,0.4)'; g.lineWidth = 1;
    for (var ry = 0, row2 = 0; ry < by1; ry += H * 0.062, row2++) {
      g.beginPath(); g.moveTo(bx0, ry); g.lineTo(bx1, ry); g.stroke();
      for (var rx = bx0 + (row2 % 2 ? bw * 0.045 : 0); rx < bx1; rx += bw * 0.09) { g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx, ry + H * 0.062); g.stroke(); }
    }
    // fenêtres gothiques, ciel de nuit
    var r = seeded(5);
    [0.17, 0.83].forEach(function (fx, wi) {
      var wx = bx0 + bw * fx, ww = bw * 0.085, wy0 = H * 0.2, wy1 = H * 0.5, top = H * 0.07;
      var path = function () { g.beginPath(); g.moveTo(wx - ww, wy1); g.lineTo(wx - ww, wy0); g.quadraticCurveTo(wx - ww, top + (wy0 - top) * 0.3, wx, top); g.quadraticCurveTo(wx + ww, top + (wy0 - top) * 0.3, wx + ww, wy0); g.lineTo(wx + ww, wy1); g.closePath(); };
      gr = g.createLinearGradient(0, top, 0, wy1); gr.addColorStop(0, '#0b1440'); gr.addColorStop(1, '#3b63b8');
      g.fillStyle = gr; path(); g.fill();
      g.save(); path(); g.clip();
      g.fillStyle = '#fff'; for (var st = 0; st < 26; st++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillRect(wx - ww + r() * ww * 2, top + r() * (wy1 - top) * 0.75, 1.3, 1.3); }
      g.globalAlpha = 1;
      if (wi === 1) { // lune
        gr = g.createRadialGradient(wx + ww * 0.2, H * 0.2, 0, wx + ww * 0.2, H * 0.2, ww * 1.6); gr.addColorStop(0, 'rgba(230,240,255,0.55)'); gr.addColorStop(1, 'rgba(230,240,255,0)');
        g.fillStyle = gr; g.fillRect(wx - ww * 2, top, ww * 4, wy1); g.fillStyle = '#f2f5ff'; ell(g, wx + ww * 0.2, H * 0.2, ww * 0.42, ww * 0.42); g.fill();
      }
      g.restore();
      g.strokeStyle = '#141126'; g.lineWidth = Math.max(2, ww * 0.1);
      g.beginPath(); g.moveTo(wx, top); g.lineTo(wx, wy1); g.moveTo(wx - ww, wy0); g.lineTo(wx + ww, wy0); g.moveTo(wx - ww, (wy0 + wy1) / 2); g.lineTo(wx + ww, (wy0 + wy1) / 2); g.stroke();
      g.strokeStyle = '#4d4770'; g.lineWidth = Math.max(2, ww * 0.14); path(); g.stroke();
    });
    if (variant === 'classe') { // tableau noir, avec le trait de Scintilla et les griffes du griffon à la craie
      var kx = bw * 0.3, k0 = H * 0.1, k1 = H * 0.42, kh = k1 - k0, fr = Math.max(5, H * 0.012);
      g.fillStyle = '#5a3a1c'; g.fillRect(vpx - kx - fr, k0 - fr, kx * 2 + fr * 2, kh + fr * 2);
      gr = g.createLinearGradient(0, k0, 0, k1); gr.addColorStop(0, '#22413a'); gr.addColorStop(1, '#162b2c');
      g.fillStyle = gr; g.fillRect(vpx - kx, k0, kx * 2, kh);
      g.strokeStyle = 'rgba(235,240,228,0.7)'; g.lineWidth = Math.max(2, H * 0.004); g.lineCap = 'round'; g.beginPath();
      g.moveTo(vpx - kx * 0.82, k0 + kh * 0.3); g.lineTo(vpx - kx * 0.3, k0 + kh * 0.3);
      g.moveTo(vpx + kx * 0.4, k0 + kh * 0.14); g.lineTo(vpx + kx * 0.8, k0 + kh * 0.46); g.moveTo(vpx + kx * 0.8, k0 + kh * 0.14); g.lineTo(vpx + kx * 0.4, k0 + kh * 0.46);
      g.stroke();
      g.fillStyle = '#6c4a2b'; g.fillRect(vpx - kx * 0.6, k1 + fr, kx * 1.2, fr * 0.7);
    } else {
    // bannière centrale
    var bcx = vpx, bwd = bw * 0.13, bt = H * 0.03, bb = H * 0.47;
    gr = g.createLinearGradient(bcx - bwd, 0, bcx + bwd, 0); gr.addColorStop(0, '#2c1447'); gr.addColorStop(0.5, '#4a2374'); gr.addColorStop(1, '#2c1447');
    g.fillStyle = gr; poly(g, [[bcx - bwd, bt], [bcx + bwd, bt], [bcx + bwd, bb], [bcx, bb - bwd * 0.55], [bcx - bwd, bb]]); g.fill();
    g.strokeStyle = '#c9a24a'; g.lineWidth = Math.max(1.5, bwd * 0.05);
    poly(g, [[bcx - bwd * 0.86, bt + bwd * 0.14], [bcx + bwd * 0.86, bt + bwd * 0.14], [bcx + bwd * 0.86, bb - bwd * 0.32], [bcx, bb - bwd * 0.8], [bcx - bwd * 0.86, bb - bwd * 0.32]]); g.stroke();
    // écusson : étoile et baguettes croisées
    var ey = H * 0.14, er = bwd * 0.42;
    g.strokeStyle = '#d8b45c'; g.lineWidth = Math.max(1.5, bwd * 0.06); g.lineCap = 'round';
    g.beginPath(); g.moveTo(bcx - er, ey + er); g.lineTo(bcx + er, ey - er); g.moveTo(bcx + er, ey + er); g.lineTo(bcx - er, ey - er); g.stroke();
    g.fillStyle = '#f0d27a'; g.beginPath();
    for (i = 0; i < 10; i++) { var ang = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? er * 0.27 : er * 0.62; g[i ? 'lineTo' : 'moveTo'](bcx + Math.cos(ang) * rr, ey + Math.sin(ang) * rr); }
    g.closePath(); g.fill();
    }
    g.fillStyle = '#17142a'; g.fillRect(bx0, by1 - H * 0.05, bw, H * 0.05);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(bx0, by1 - H * 0.05, bw, 2);

    // Sol
    var fl = [[bx0, by1], [bx1, by1], P(bx1, by1, S), P(bx0, by1, S)];
    gr = g.createLinearGradient(0, by1, 0, H); gr.addColorStop(0, '#181528'); gr.addColorStop(0.35, '#262240'); gr.addColorStop(1, '#100e1c');
    g.fillStyle = gr; poly(g, fl); g.fill();
    g.save(); poly(g, fl); g.clip();
    g.strokeStyle = 'rgba(6,5,14,0.5)'; g.lineWidth = 1.2;
    for (var tx = vpx - W * 2.4; tx < vpx + W * 2.4; tx += W * 0.075) { var q = P(tx, by1, S); g.beginPath(); g.moveTo(tx, by1); g.lineTo(q[0], q[1]); g.stroke(); }
    for (var tz = 1; tz > 0.22; tz -= 0.085) { var ty = vpy + (by1 - vpy) / tz; g.beginPath(); g.moveTo(0, ty); g.lineTo(W, ty); g.stroke(); }
    // clair de lune au sol
    gr = g.createRadialGradient(vpx, H * 0.78, 0, vpx, H * 0.78, W * 0.5); gr.addColorStop(0, 'rgba(120,150,255,0.13)'); gr.addColorStop(1, 'rgba(120,150,255,0)');
    g.fillStyle = gr; g.fillRect(0, by1, W, H - by1);
    g.restore();

    // Piste de duel surélevée et son tapis
    var hw = geo.hw, td = geo.topDy, fd = by1 - vpy;
    var T = function (k, s2) { return [vpx + hw * k * s2, vpy + td * s2]; };
    var Fp = function (k, s2) { return [vpx + hw * k * s2, vpy + fd * s2]; };
    g.fillStyle = '#0d0b18'; poly(g, [T(-1, 1), T(-1, S), Fp(-1, S), Fp(-1, 1)]); g.fill(); poly(g, [T(1, 1), T(1, S), Fp(1, S), Fp(1, 1)]); g.fill();
    gr = g.createLinearGradient(0, vpy + td, 0, H); gr.addColorStop(0, '#2a2644'); gr.addColorStop(0.5, '#3c3760'); gr.addColorStop(1, '#262240');
    g.fillStyle = gr; poly(g, [T(-1, 1), T(1, 1), T(1, S), T(-1, S)]); g.fill();
    gr = g.createLinearGradient(0, vpy + td, 0, H); gr.addColorStop(0, '#4a1526'); gr.addColorStop(0.45, '#7a2338'); gr.addColorStop(1, '#4f1628');
    g.fillStyle = gr; poly(g, [T(-0.78, 1.02), T(0.78, 1.02), T(0.78, S), T(-0.78, S)]); g.fill();
    g.strokeStyle = '#c9a24a'; g.lineWidth = 2;
    [0.7, -0.7].forEach(function (k) { var a = T(k, 1.04), b = T(k, S); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
    g.strokeStyle = 'rgba(201,162,74,0.55)'; g.lineWidth = 1;
    [0.62, -0.62].forEach(function (k) { var a = T(k, 1.04), b = T(k, S); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
    // losanges dorés au centre du tapis
    g.fillStyle = 'rgba(214,176,92,0.5)';
    for (var dz = 0.8; dz > 0.24; dz -= 0.13) {
      var s0 = 1 / dz, s1 = 1 / (dz - 0.05), sm = 1 / (dz - 0.025);
      poly(g, [T(0, s0), T(0.2, sm), T(0, s1), T(-0.2, sm)]); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.5;
    [1, -1].forEach(function (k) { var a = T(k, 1), b = T(k, S); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });

    // Rayons de lune qui tombent des fenêtres
    g.save(); g.globalCompositeOperation = 'lighter';
    [0.17, 0.83].forEach(function (fx) {
      var wx = bx0 + bw * fx, ww = bw * 0.085, dir = fx < 0.5 ? 1 : -1;
      gr = g.createLinearGradient(wx, H * 0.15, wx + dir * W * 0.16, H * 0.95); gr.addColorStop(0, 'rgba(130,160,255,0.16)'); gr.addColorStop(1, 'rgba(130,160,255,0)');
      g.fillStyle = gr; poly(g, [[wx - ww, H * 0.12], [wx + ww, H * 0.12], [wx + dir * W * 0.2 + ww * 3, H], [wx + dir * W * 0.2 - ww * 3, H]]); g.fill();
    });
    g.restore();

    // Vignette
    gr = g.createRadialGradient(vpx, H * 0.5, H * 0.3, vpx, H * 0.5, Math.max(W, H) * 0.75);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (variant === 'classe') { // les élèves, vus de dos, dans les coins du bas
      var HAIR = ['#6b3a1e', '#1c1b26', '#c9a04a', '#8a2a1a', '#3b2a1d', '#d9b36a'];
      [[0.07, 0.82, 1], [0.19, 0.93, 1.3], [-0.01, 1.0, 1.6], [0.93, 0.82, 1], [0.81, 0.93, 1.3], [1.01, 1.0, 1.6]].forEach(function (st, n) {
        var x = W * st[0], y = H * st[1], r = H * 0.05 * st[2];
        g.fillStyle = '#1a1730'; ell(g, x, y + r * 2.5, r * 2.3, r * 2); g.fill();
        g.fillStyle = '#26224a'; ell(g, x, y + r * 1.25, r * 1.25, r * 0.8); g.fill();
        g.fillStyle = HAIR[n]; ell(g, x, y, r, r * 1.08); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.08)'; ell(g, x - r * 0.3, y - r * 0.4, r * 0.45, r * 0.3); g.fill();
      });
    }
    return { canvas: c, geo: geo };
  }

  function flame(g, x, y, r, t, ph) {
    var fl = 0.85 + 0.15 * Math.sin(t * 11 + ph) + 0.08 * Math.sin(t * 23 + ph * 2), sw = Math.sin(t * 5 + ph) * r * 0.18;
    g.save(); g.globalCompositeOperation = 'lighter';
    var gr = g.createRadialGradient(x, y - r * 0.6, 0, x, y - r * 0.6, r * 5 * fl);
    gr.addColorStop(0, 'rgba(255,190,90,0.5)'); gr.addColorStop(0.35, 'rgba(255,130,50,0.16)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.fillRect(x - r * 5, y - r * 6, r * 10, r * 10);
    g.restore();
    g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(x - r * 0.6, y); g.quadraticCurveTo(x - r * 0.75, y - r * 1.1, x + sw, y - r * 2.3 * fl); g.quadraticCurveTo(x + r * 0.75, y - r * 1.1, x + r * 0.6, y); g.closePath(); g.fill();
    g.fillStyle = '#fff2b0'; g.beginPath(); g.moveTo(x - r * 0.3, y); g.quadraticCurveTo(x - r * 0.38, y - r * 0.6, x + sw * 0.5, y - r * 1.3 * fl); g.quadraticCurveTo(x + r * 0.38, y - r * 0.6, x + r * 0.3, y); g.closePath(); g.fill();
  }

  // Éléments animés de la salle : flammes des torches et chandelles flottantes.
  function drawHallLive(g, geo, t) {
    geo.torches.forEach(function (tc, i) { flame(g, tc.x, tc.y, tc.r, t, i * 1.7); });
    geo.candles.forEach(function (c) {
      var u = geo.H * 0.012 * c.s, x = c.x + Math.sin(t * 0.4 + c.ph) * u * 0.8, y = c.y + Math.sin(t * 0.7 + c.ph * 1.3) * u * 1.2;
      g.fillStyle = '#e9dfc4'; g.fillRect(x - u * 0.38, y, u * 0.76, u * 3);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + u * 0.1, y, u * 0.28, u * 3);
      flame(g, x, y, u * 0.55, t, c.ph);
    });
  }

  // ───────────────────────── Sorcier (vu de face) ─────────────────────────
  // h : hauteur totale. pose : { tip:{x,y} cible de la pointe de la baguette, tint:[couleur, force],
  // face:'hit'|'cast'|'happy'|'sleep', talk:temps (il parle : bouche et bras animés), noWand, glow:couleur, portrait, age:'kid'|'teen'|'adult' }. Retourne les points utiles.
  // age : un enfant ou un ado a la tête plus grosse et de plus grands yeux (c'est à l'appelant de le dessiner plus petit : DS.AGES[age].h) ;
  // un adulte porte le chapeau pointu, et la barbe s'il en a une (ch.beard). Sans age : comme avant, tête nue.
  // Allure farfelue, champs facultatifs du sorcier (data.js) :
  //   beard true|'long'|'huge'|'fork' · stache 'giant'|'curl'|'walrus' · whiskers (favoris) · brows 'bushy' · bald — adultes seulement
  //   nose · glasses true|'mono'
  //   hat 'point'|'tall'|'bent'|'top'|'floppy'|'cap'|'turban'|'none' (un chapeau spécial se porte à tout âge), hatCol
  //   hairStyle 'poof' · tufts · pattern 'stars'|'moons'|'stripes'|'dots'|'checks'|'patches' (pat : couleur) · collar 'ruff'|'bow'|'high' · shoes 'curl' · accent
  function drawWizard(g, ch, x, fy, h, pose) {
    pose = pose || {};
    var u = h / 100, tint = pose.tint;
    var C = function (col) { return tint ? mix(col, tint[0], tint[1]) : col; };
    var X = function (dx) { return x + dx * u; }, Y = function (dy) { return fy - dy * u; };
    var young = pose.age === 'kid' || pose.age === 'teen';
    var robe = ch.robe, robeD = shade(robe, -0.42), robeL = shade(robe, 0.14), hair = young && ch.young ? ch.young : ch.hair, skin = ch.skin;
    var hx = X(0), hy = Y(89), hr = 9 * u, gr, i;
    var age = DS.AGES[pose.age] || DS.AGES.adult, hk = age.head, nx = X(0), ny = Y(82); // la tête grossit autour du cou
    var hm = age.hem, wb = 23 - (hm - 4) * 0.3;                                          // bas de la robe : hauteur et demi-largeur
    var headIn = function () { g.save(); g.translate(nx, ny); g.scale(hk, hk); g.translate(-nx, -ny); };
    var adult = pose.age === 'adult', fk = adult ? 1 : 0; // barbe, moustache, favoris, gros sourcils : adultes seulement
    var hat = adult ? ch.hat || 'point' : pose.age && ch.hat && ch.hat !== 'point' ? ch.hat : 'none';
    var bald = ch.bald && adult, accent = ch.accent || '#d94a4a';
    // tracés repérés depuis le centre de la tête, en rayons de tête
    var mv = function (a, b) { g.moveTo(hx + a * hr, hy + b * hr); }, ln = function (a, b) { g.lineTo(hx + a * hr, hy + b * hr); };
    var qd = function (a, b, c, d) { g.quadraticCurveTo(hx + a * hr, hy + b * hr, hx + c * hr, hy + d * hr); };
    var bz = function (a, b, c, d, e, f) { g.bezierCurveTo(hx + a * hr, hy + b * hr, hx + c * hr, hy + d * hr, hx + e * hr, hy + f * hr); };
    var dot = function (a, b, r) { ell(g, hx + a * hr, hy + b * hr, r * hr, r * hr); g.fill(); };
    var robePath = function () {
      g.beginPath(); g.moveTo(X(-13), Y(79)); g.quadraticCurveTo(X(-17), Y(48), X(-wb), Y(hm)); g.quadraticCurveTo(X(-wb / 2), Y(hm - 5.5), X(0), Y(hm - 1.5)); g.quadraticCurveTo(X(wb / 2), Y(hm - 5.5), X(wb), Y(hm));
      g.quadraticCurveTo(X(17), Y(48), X(13), Y(79)); g.quadraticCurveTo(X(0), Y(84), X(-13), Y(79)); g.closePath();
    };
    var pattern = function () { // motif du tissu, découpé dans la robe
      var k = ch.pattern, j;
      g.fillStyle = C(ch.pat || ch.trim);
      if (k === 'stars' || k === 'moons') {
        g.globalAlpha = 0.9;
        [[-8, 71, 1.6], [7, 66, 2.1], [-3, 59, 1.4], [11, 76, 1.3], [-11, 57, 1.9], [12, 56, 1.5], [-12, 40, 2.1], [4, 37, 1.6], [13, 31, 2], [-5, 27, 1.7], [-16, 17, 1.8], [6, 15, 2.1], [17, 13, 1.5], [-6, 9, 1.4], [-18, 30, 1.3], [19, 22, 1.4]].forEach(function (st, n) {
          var r = st[2] * 1.25 * u, cx = X(st[0]), cy = Y(st[1]);
          if (k === 'moons' && n % 2 === 0) { g.beginPath(); g.arc(cx, cy, r, 0.3 * Math.PI, 1.7 * Math.PI); g.arc(cx + r * 0.45, cy, r * 0.82, 1.554 * Math.PI, 0.446 * Math.PI, true); g.closePath(); g.fill(); }
          else { star(g, cx, cy, st[2] * u); g.fill(); }
        });
      } else if (k === 'stripes') {
        g.globalAlpha = 0.5;
        for (i = -4; i <= 4; i++) { poly(g, [[X(i * 3.3 - 0.75), Y(84)], [X(i * 3.3 + 0.75), Y(84)], [X(i * 5.9 + 1.35), Y(-3)], [X(i * 5.9 - 1.35), Y(-3)]]); g.fill(); }
      } else if (k === 'dots') {
        g.globalAlpha = 0.85;
        for (j = 0; j < 10; j++) for (i = -3; i <= 3; i++) { ell(g, X(i * 8 + (j % 2) * 4 - 2), Y(77 - j * 8), 2.3 * u, 2.3 * u); g.fill(); }
      } else if (k === 'checks') { // losanges d'arlequin
        g.globalAlpha = 0.8;
        for (j = 0; j < 9; j++) for (i = -3; i <= 3; i++) { var qx = X(i * 8), qy = Y(84 - j * 11); poly(g, [[qx, qy - 5.5 * u], [qx + 4 * u, qy], [qx, qy + 5.5 * u], [qx - 4 * u, qy]]); g.fill(); }
      } else if (k === 'patches') { // pièces cousues à gros points
        [[-12, 70, 9, 8, '#c9682a', -0.15], [4, 63, 8, 9, '#3d8a6a', 0.1], [-9, 37, 10, 9, '#c2477f', 0.12], [7, 29, 9, 10, '#d8b45c', -0.1], [-17, 17, 9, 9, '#6a78c9', 0.2], [10, 11, 10, 8, '#c9682a', -0.2], [-3, 15, 8, 8, '#3d8a6a', 0.05]].forEach(function (pc) {
          g.save(); g.translate(X(pc[0] + pc[2] / 2), Y(pc[1] - pc[3] / 2)); g.rotate(pc[5]); g.fillStyle = C(pc[4]); g.fillRect(-pc[2] / 2 * u, -pc[3] / 2 * u, pc[2] * u, pc[3] * u);
          g.strokeStyle = C('#f3ead0'); g.lineWidth = 0.5 * u; g.setLineDash([1.2 * u, 1.1 * u]); g.strokeRect((-pc[2] / 2 + 0.9) * u, (-pc[3] / 2 + 0.9) * u, (pc[2] - 1.8) * u, (pc[3] - 1.8) * u); g.restore();
        });
      }
      g.globalAlpha = 1; // les côtés restent dans l'ombre, comme la robe
      var sh = g.createLinearGradient(X(-23), 0, X(23), 0); sh.addColorStop(0, 'rgba(0,0,0,0.4)'); sh.addColorStop(0.32, 'rgba(0,0,0,0)'); sh.addColorStop(0.68, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.4)');
      g.fillStyle = sh; g.fillRect(X(-24), Y(86), 48 * u, 92 * u);
    };
    var beard = function (len, wid, fork) { // des joues jusqu'à la pointe, juste sous la bouche ; fork : deux pointes
      g.fillStyle = C(shade(hair, -0.08)); g.beginPath(); mv(-0.9, 0.15);
      bz(-wid * 1.15, len * 0.3, -wid, len * 0.75, fork ? -wid * 0.45 : 0, len);
      if (fork) { qd(-wid * 0.08, len * 0.82, 0, len * 0.7); qd(wid * 0.08, len * 0.82, wid * 0.45, len); }
      bz(wid, len * 0.75, wid * 1.15, len * 0.3, 0.9, 0.15); qd(0, 1.22, -0.9, 0.15); g.closePath(); g.fill();
      if (len < 2.5) return;
      g.save(); g.clip(); g.strokeStyle = C(shade(hair, -0.34)); g.globalAlpha = 0.5; g.lineWidth = 0.45 * u; g.lineCap = 'round'; // mèches
      for (var k = -3; k <= 3; k++) { g.beginPath(); mv(k * 0.24, 0.9 + Math.abs(k) * 0.06); bz(k * wid * 0.42 + 0.2, len * 0.35, k * wid * 0.3 - 0.2, len * 0.65, k * wid * (fork ? 0.2 : 0.07), len * 0.97); g.stroke(); }
      g.restore();
    };

    if (!pose.portrait) { g.fillStyle = 'rgba(0,0,0,0.4)'; ell(g, X(0), fy + u, 25 * u, 4.5 * u); g.fill(); }

    // cheveux derrière la tête
    headIn();
    g.fillStyle = C(shade(hair, -0.18));
    if (ch.hairStyle === 'long') { g.beginPath(); g.moveTo(X(-10.5), Y(93)); g.quadraticCurveTo(X(-15), Y(80), X(-13.5), Y(66)); g.lineTo(X(13.5), Y(66)); g.quadraticCurveTo(X(15), Y(80), X(10.5), Y(93)); g.closePath(); g.fill(); }
    if (ch.hairStyle === 'curly') { for (i = 0; i < 9; i++) { var ca = Math.PI * (0.92 + i * 0.145); ell(g, hx + Math.cos(ca) * hr * 1.02, hy + Math.sin(ca) * hr * 1.02, 4.1 * u, 4.1 * u); g.fill(); } }
    if (ch.hairStyle === 'poof') { // une énorme chevelure bouffante, la raie au milieu
      g.fillStyle = C(hair); g.beginPath();
      [[-1.3, -0.75, 1.35], [1.3, -0.75, 1.35], [0, -1.25, 1.2], [-1.8, 0.3, 1.0], [1.8, 0.3, 1.0], [-1.25, 1.0, 0.7], [1.25, 1.0, 0.7]].forEach(function (c) { mv(c[0] + c[2], c[1]); g.arc(hx + c[0] * hr, hy + c[1] * hr, c[2] * hr, 0, TAU); });
      g.fill(); g.save(); g.clip(); g.strokeStyle = C(shade(hair, 0.24)); g.lineWidth = 0.5 * u; g.globalAlpha = 0.7;
      for (i = 0; i < 4; i++) { g.beginPath(); g.arc(hx, hy - hr * 0.9, hr * (1.0 + i * 0.47), -0.42 * Math.PI, 0.14 * Math.PI); g.stroke(); g.beginPath(); g.arc(hx, hy - hr * 0.9, hr * (1.0 + i * 0.47), 0.86 * Math.PI, 1.42 * Math.PI); g.stroke(); }
      g.restore();
    }
    if (ch.tufts) { g.fillStyle = C(hair); [-1, 1].forEach(function (sd) { dot(sd * 1.12, -0.25, 0.42); dot(sd * 1.32, 0.12, 0.36); dot(sd * 1.1, 0.45, 0.3); }); } // touffes sur les côtés
    if (ch.collar === 'high') [-1, 1].forEach(function (sd) { // grand col dressé derrière la tête
      g.fillStyle = C(shade(robe, -0.5)); g.beginPath(); mv(sd * 0.5, 0.95); ln(sd * 1.5, 1.2); ln(sd * 2.0, -1.1); ln(sd * 1.05, -0.2); g.closePath(); g.fill();
      g.fillStyle = C(shade(ch.trim, -0.3)); g.beginPath(); mv(sd * 0.7, 0.9); ln(sd * 1.42, 1.05); ln(sd * 1.82, -0.62); ln(sd * 1.1, 0.0); g.closePath(); g.fill();
    });
    g.restore();

    // souliers (shoes 'curl' : des poulaines, dont la pointe en volute est dessinée après la robe)
    var toe = Math.max(14, wb - 5);
    if (ch.shoes === 'curl') { g.fillStyle = C(shade(accent, -0.15)); ell(g, X(-toe + 5), Y(1.4), 7 * u, 2.7 * u); g.fill(); ell(g, X(toe - 5), Y(1.4), 7 * u, 2.7 * u); g.fill(); }
    else { g.fillStyle = C('#15121c'); ell(g, X(-8), Y(1.2), 6 * u, 2.6 * u); g.fill(); ell(g, X(8), Y(1.2), 6 * u, 2.6 * u); g.fill(); }

    // jambes (robe courte des enfants et des ados) : bas sombres, chaussettes aux couleurs de la maison
    if (hm > 6) {
      [-1, 1].forEach(function (sd) {
        g.fillStyle = C('#2b2536'); g.fillRect(X(sd * 7.5 - 2.7), Y(hm + 3), 5.4 * u, (hm + 1) * u);
        if (hm > 16) { g.fillStyle = C(ch.trim); g.fillRect(X(sd * 7.5 - 2.7), Y(9.5), 5.4 * u, 2 * u); g.fillStyle = C(robe); g.fillRect(X(sd * 7.5 - 2.7), Y(7.5), 5.4 * u, 1.4 * u); }
      });
    }

    // bras libre (à droite pour nous)
    g.lineCap = 'round'; g.strokeStyle = C(robeD); g.lineWidth = 8.5 * u;
    g.beginPath(); g.moveTo(X(12.5), Y(76)); g.lineTo(X(19), Y(52)); g.stroke();
    g.strokeStyle = C(ch.trim); g.lineWidth = 8.8 * u; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(X(18.4), Y(54.4)); g.lineTo(X(19.3), Y(51)); g.stroke();
    g.fillStyle = C(skin); ell(g, X(19.6), Y(47.5), 2.8 * u, 3 * u); g.fill();

    // robe
    gr = g.createLinearGradient(X(-23), 0, X(23), 0);
    gr.addColorStop(0, C(robeD)); gr.addColorStop(0.3, C(robe)); gr.addColorStop(0.5, C(robeL)); gr.addColorStop(0.7, C(robe)); gr.addColorStop(1, C(robeD));
    g.fillStyle = gr; robePath(); g.fill();
    if (ch.pattern) { g.save(); g.clip(); pattern(); g.restore(); }
    if (ch.shoes === 'curl') [-1, 1].forEach(function (sd) { // la pointe des poulaines et son grelot
      g.strokeStyle = C(shade(accent, -0.15)); g.lineWidth = 2.1 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(X(sd * toe), Y(1.6)); g.quadraticCurveTo(X(sd * (toe + 7.5)), Y(1), X(sd * (toe + 5.5)), Y(6.5)); g.stroke();
      g.fillStyle = C('#f2c14e'); ell(g, X(sd * (toe + 5.3)), Y(7.6), 1.5 * u, 1.5 * u); g.fill();
    });
    // ourlet et ligne centrale
    g.strokeStyle = C(ch.trim); g.lineWidth = 1.5 * u; g.lineCap = 'round';
    g.beginPath(); g.moveTo(X(-wb + 0.7), Y(hm + 2.5)); g.quadraticCurveTo(X(-wb / 2), Y(hm - 3), X(0), Y(hm + 1)); g.quadraticCurveTo(X(wb / 2), Y(hm - 3), X(wb - 0.7), Y(hm + 2.5)); g.stroke();
    g.globalAlpha = 0.75; g.lineWidth = 1.1 * u; g.beginPath(); g.moveTo(X(0), Y(72)); g.lineTo(X(0), Y(hm + 1)); g.stroke(); g.globalAlpha = 1;
    // ceinture
    g.fillStyle = C(shade(robe, -0.55)); g.beginPath(); g.moveTo(X(-15.6), Y(52)); g.quadraticCurveTo(X(0), Y(49), X(15.6), Y(52)); g.lineTo(X(16), Y(48.4)); g.quadraticCurveTo(X(0), Y(45.4), X(-16), Y(48.4)); g.closePath(); g.fill();
    g.fillStyle = C('#d8b45c'); g.fillRect(X(-2.2), Y(50.7), 4.4 * u, 4.4 * u);

    // cou, foulard
    g.fillStyle = C(shade(skin, -0.14)); g.fillRect(X(-2.8), Y(83), 5.6 * u, 6 * u);
    g.fillStyle = C(ch.trim); poly(g, [[X(-7.5), Y(81.2)], [X(7.5), Y(81.2)], [X(0), Y(70.5)]]); g.fill();
    g.fillStyle = C(shade(robe, -0.2)); poly(g, [[X(-3.4), Y(81.2)], [X(3.4), Y(81.2)], [X(0), Y(76)]]); g.fill();

    // tête
    headIn();
    if (ch.collar === 'ruff') { // fraise : une rangée de plis ronds sous le menton
      g.fillStyle = C('#f6f2e8'); g.strokeStyle = C('#b3ab99'); g.lineWidth = 0.4 * u;
      for (i = 0; i < 9; i++) { var rx = -1.4 + i * 0.35; ell(g, hx + rx * hr, hy + (1.0 + 0.3 * (1 - rx * rx / 1.96)) * hr, hr * 0.34, hr * 0.34); g.fill(); g.stroke(); }
    }
    if (ch.collar === 'bow') { // gros nœud papillon
      g.fillStyle = C(accent); [-1, 1].forEach(function (sd) { g.beginPath(); mv(0, 1.42); ln(sd * 1.0, 1.0); ln(sd * 1.0, 1.84); g.closePath(); g.fill(); });
      g.fillStyle = C(shade(accent, -0.3)); dot(0, 1.42, 0.2);
    }
    gr = g.createRadialGradient(hx - hr * 0.3, hy - hr * 0.3, hr * 0.2, hx, hy, hr * 1.1);
    gr.addColorStop(0, C(shade(skin, 0.1))); gr.addColorStop(1, C(shade(skin, -0.12)));
    g.fillStyle = gr; ell(g, hx, hy, hr, hr * 1.04); g.fill();
    g.fillStyle = C(skin); ell(g, hx - hr * 0.98, hy + hr * 0.1, hr * 0.2, hr * 0.28); g.fill(); ell(g, hx + hr * 0.98, hy + hr * 0.1, hr * 0.2, hr * 0.28); g.fill();
    // visage
    g.fillStyle = pose.age === 'kid' ? 'rgba(235,90,90,0.38)' : 'rgba(230,90,90,0.22)'; ell(g, hx - hr * 0.55, hy + hr * 0.38, hr * 0.22, hr * 0.15); g.fill(); ell(g, hx + hr * 0.55, hy + hr * 0.38, hr * 0.22, hr * 0.15); g.fill();
    g.strokeStyle = C('#241a22'); g.fillStyle = C('#241a22'); g.lineWidth = 0.75 * u; g.lineCap = 'round';
    var ex = hr * 0.38, ey = hy + hr * 0.08;
    if (pose.face === 'hit') {
      [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(hx + sd * (ex - hr * 0.14), ey - hr * 0.13); g.lineTo(hx + sd * (ex + hr * 0.12), ey); g.lineTo(hx + sd * (ex - hr * 0.14), ey + hr * 0.13); g.stroke(); });
      ell(g, hx, hy + hr * 0.58, hr * 0.16, hr * 0.2); g.fill();
    } else if (pose.face === 'sleep') { // paupières closes, petite bouche ronde
      [-1, 1].forEach(function (sd) { g.beginPath(); g.arc(hx + sd * ex, ey - hr * 0.04, hr * 0.15, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); });
      ell(g, hx, hy + hr * 0.52, hr * 0.09, hr * 0.11); g.fill();
    } else {
      ell(g, hx - ex, ey, hr * 0.115 * age.eye, hr * 0.15 * age.eye); g.fill(); ell(g, hx + ex, ey, hr * 0.115 * age.eye, hr * 0.15 * age.eye); g.fill();
      g.fillStyle = '#fff'; ell(g, hx - ex + hr * 0.04, ey - hr * 0.05, hr * 0.04, hr * 0.04); g.fill(); ell(g, hx + ex + hr * 0.04, ey - hr * 0.05, hr * 0.04, hr * 0.04); g.fill();
      g.strokeStyle = C(shade(hair, -0.3)); g.lineWidth = 0.8 * u;
      var br = pose.face === 'cast' ? -0.1 : 0.04; // sourcils froncés quand il lance un sort
      [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(hx + sd * (ex + hr * 0.2), ey - hr * (0.33 + br)); g.lineTo(hx + sd * (ex - hr * 0.18), ey - hr * (0.3 - br)); g.stroke(); });
      g.strokeStyle = C('#5a2a2a'); g.lineWidth = 0.7 * u; g.beginPath();
      if (pose.face === 'cast') { g.fillStyle = C('#5a2a2a'); ell(g, hx, hy + hr * 0.56, hr * 0.14, hr * 0.1); g.fill(); }
      else if (pose.talk != null) { // il parle : la bouche s'ouvre et se ferme au rythme des mots
        var op = Math.max(0, 0.55 * Math.sin(pose.talk * 13) + 0.45 * Math.sin(pose.talk * 7.3) + 0.15), my0 = hy + hr * 0.44;
        g.lineWidth = 0.9 * u; g.arc(hx, my0 - hr * 0.1, hr * 0.26, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); // le sourire, toujours là
        if (op > 0.12) {
          g.fillStyle = C('#5a2a2a'); ell(g, hx, my0, hr * (0.12 + 0.1 * op), hr * (0.04 + 0.17 * op)); g.fill();
          if (op > 0.45) { g.fillStyle = C('#f3e6e0'); g.beginPath(); g.rect(hx - hr * 0.11, my0 - hr * (0.04 + 0.17 * op) + hr * 0.02, hr * 0.22, hr * 0.05); g.fill(); } // les dents du haut
        }
      }
      else if (pose.face === 'happy') { g.arc(hx, hy + hr * 0.36, hr * 0.3, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
      else { g.arc(hx, hy + hr * 0.3, hr * 0.3, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke(); }
    }
    if (ch.nose) { g.fillStyle = C(shade(skin, -0.17)); ell(g, hx, hy + hr * 0.27, hr * 0.21, hr * 0.18); g.fill(); } // un gros nez rond
    if (ch.brows === 'bushy' && adult) { // sourcils en broussaille : ils dépassent largement de la tête
      var bl = 2.0; g.fillStyle = C(shade(hair, -0.1));
      [-1, 1].forEach(function (sd) { g.beginPath(); mv(sd * 0.1, -0.24); qd(sd * bl * 0.5, -0.52, sd * bl, -0.3); qd(sd * bl * 0.55, -0.13, sd * 0.12, -0.07); g.closePath(); g.fill(); });
    }
    if (ch.whiskers && adult) [-1, 1].forEach(function (sd) { // favoris : deux longues mèches qui tombent des joues, menton nu
      g.fillStyle = C(shade(hair, -0.08)); g.beginPath(); mv(sd * 0.8, -0.05); bz(sd * 1.35, 0.35, sd * 2.45, 2.3, sd * 1.75, 4.0); bz(sd * 1.3, 2.9, sd * 0.55, 1.6, sd * 0.5, 0.5); g.closePath(); g.fill();
      g.save(); g.clip(); g.strokeStyle = C(shade(hair, -0.34)); g.globalAlpha = 0.5; g.lineWidth = 0.45 * u;
      for (i = 0; i < 3; i++) { g.beginPath(); mv(sd * (0.66 + i * 0.12), 0.3); bz(sd * (1.0 + i * 0.3), 1.2, sd * (1.3 + i * 0.35), 2.5, sd * 1.72, 3.9); g.stroke(); }
      g.restore();
    });
    if (ch.beard && adult) { if (ch.beard === 'huge') beard(7.2, 2.0); else if (ch.beard === 'long') beard(4.4, 1.25); else if (ch.beard === 'fork') beard(3.3, 1.15, true); else beard(1.9, 0.85); }
    if (ch.stache && fk) { // moustache : par-dessus la barbe
      var my = 0.38, ms = 0.45 + 0.55 * fk; g.fillStyle = g.strokeStyle = C(shade(hair, -0.14));
      if (ch.stache === 'giant') [-1, 1].forEach(function (sd) { var ml = 2.9 * fk; g.beginPath(); mv(0, my - 0.14); qd(sd * ml * 0.45, my - 0.34, sd * ml, my - 0.16); qd(sd * ml * 0.4, my + 0.36, 0, my + 0.16); g.closePath(); g.fill(); });
      else if (ch.stache === 'walrus') [-1, 1].forEach(function (sd) { g.beginPath(); mv(0, my - 0.16); qd(sd * 0.9 * ms, my - 0.1, sd * 0.72 * ms, my + 0.95 * ms); qd(sd * 0.35 * ms, my + 0.5 * ms, 0, my + 0.3); g.closePath(); g.fill(); });
      else { // en guidon : les pointes remontent en volute
        g.lineWidth = hr * 0.17; g.lineCap = 'round';
        [-1, 1].forEach(function (sd) { g.beginPath(); mv(0, my + 0.04); qd(sd * 0.42 * ms, my + 0.32, sd * 0.82 * ms, my + 0.08); g.arc(hx + sd * 0.82 * ms * hr, hy + (my + 0.08 - 0.21 * ms) * hr, 0.21 * ms * hr, Math.PI / 2, Math.PI / 2 - sd * 1.45 * Math.PI, sd > 0); g.stroke(); });
        ell(g, hx, hy + (my + 0.07) * hr, hr * 0.32 * ms, hr * 0.14); g.fill();
      }
    }
    if (ch.glasses === 'mono') { // monocle et sa chaînette
      g.strokeStyle = C('#d8b45c'); g.lineWidth = 0.6 * u; ell(g, hx + ex, ey, hr * 0.3, hr * 0.3); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fill(); g.stroke();
      g.lineWidth = 0.3 * u; g.beginPath(); g.moveTo(hx + ex + hr * 0.24, ey + hr * 0.18); g.quadraticCurveTo(hx + hr * 1.2, hy + hr * 0.95, hx + hr * 0.7, hy + hr * 1.45); g.stroke();
    } else if (ch.glasses) {
      g.strokeStyle = C('#1d1a26'); g.lineWidth = 0.6 * u;
      ell(g, hx - ex, ey, hr * 0.27, hr * 0.27); g.stroke(); ell(g, hx + ex, ey, hr * 0.27, hr * 0.27); g.stroke();
      g.beginPath(); g.moveTo(hx - ex + hr * 0.27, ey); g.lineTo(hx + ex - hr * 0.27, ey); g.stroke();
    }
    // cheveux devant
    g.fillStyle = C(hair);
    if (bald) { g.fillStyle = 'rgba(255,255,255,0.32)'; ell(g, hx - hr * 0.32, hy - hr * 0.62, hr * 0.3, hr * 0.13); g.fill(); } // crâne chauve : un reflet
    else if (ch.hairStyle === 'curly') {
      for (i = 0; i < 7; i++) { var a2 = Math.PI * (1.08 + i * 0.14); ell(g, hx + Math.cos(a2) * hr * 0.8, hy + Math.sin(a2) * hr * 0.8, 3.5 * u, 3.5 * u); g.fill(); }
      ell(g, hx, hy - hr * 0.72, 5 * u, 3.4 * u); g.fill();
    } else {
      g.beginPath(); g.arc(hx, hy, hr * 1.08, Math.PI * 1.03, Math.PI * 1.97);
      g.quadraticCurveTo(hx + hr * 0.75, hy - hr * 0.3, hx + hr * 0.1, hy - hr * 0.42);
      g.quadraticCurveTo(hx - hr * 0.6, hy - hr * 0.62, hx - hr * 1.07, hy - hr * 0.08); g.closePath(); g.fill();
    }
    if (ch.hairStyle === 'braids') {
      [-1, 1].forEach(function (sd) {
        for (i = 0; i < 6; i++) { g.fillStyle = C(i % 2 ? shade(hair, 0.12) : hair); ell(g, X(sd * (9.8 + i * 0.35)), Y(86 - i * 4.1), 2.5 * u, 2.7 * u); g.fill(); }
        g.fillStyle = C(ch.trim); ell(g, X(sd * 11.9), Y(62), 1.7 * u, 1.3 * u); g.fill();
      });
    }

    if (hat !== 'none') { // un vrai magicien porte le chapeau pointu, aux couleurs de sa robe ; les farfelus ont le leur
      var B = -0.62, by = hy + B * hr, hb = ch.hatCol || robe;
      g.fillStyle = C(hat === 'turban' ? hb : shade(hb, -0.3)); g.beginPath();
      if (hat === 'tall') { mv(-1, B); qd(-0.3, B - 2.3, 0.3, B - 4.4); qd(0.45, B - 2.0, 1, B); }                                                       // interminable
      else if (hat === 'bent') { mv(-1, B); qd(-0.8, B - 1.6, -0.15, B - 2.25); qd(0.7, B - 2.8, 1.8, B - 1.5); qd(0.95, B - 1.9, 0.6, B - 1.3); qd(0.9, B - 0.7, 1, B); } // la pointe retombe
      else if (hat === 'top') { mv(-0.84, B); ln(-0.98, B - 1.95); qd(0, B - 2.15, 0.98, B - 1.95); ln(0.84, B); }                                         // haut-de-forme
      else if (hat === 'floppy') { mv(-0.95, B); qd(-0.85, B - 1.3, -0.15, B - 1.55); qd(0.55, B - 1.75, 1.25, B - 1.05); qd(0.8, B - 1.0, 0.95, B); }    // tout mou
      else if (hat === 'cap') { mv(-0.98, B); qd(-0.65, B - 1.75, 0.5, B - 1.8); qd(1.75, B - 1.75, 1.95, B - 0.2); qd(1.45, B - 1.05, 0.98, B - 0.95); ln(0.98, B); } // bonnet de nuit
      else if (hat === 'turban') g.ellipse(hx, hy + (B - 0.5) * hr, 1.3 * hr, 0.98 * hr, 0, 0, TAU);
      else { mv(-1, B); qd(-0.35, B - 1.25, 0.55, B - 2.35); qd(0.5, B - 1.05, 1, B); }
      g.closePath(); g.fill();
      if (hat === 'turban') { // plis du tissu, joyau et plume
        g.save(); g.clip(); g.strokeStyle = C(shade(hb, -0.28)); g.lineWidth = 0.5 * u;
        for (i = 0; i < 4; i++) { g.beginPath(); mv(-1.35, B + 0.25 - i * 0.42); qd(0, B + 0.1 - i * 0.5, 1.35, B - 0.55 - i * 0.36); g.stroke(); }
        g.restore();
        g.save(); g.translate(hx, hy + (B - 0.75) * hr); g.rotate(0.18); g.fillStyle = C('#fbf7ee'); ell(g, 0, -hr * 0.75, hr * 0.17, hr * 0.7); g.fill(); g.restore();
        g.fillStyle = C('#d8b45c'); dot(0, B - 0.55, 0.27); g.fillStyle = C(accent); dot(0, B - 0.55, 0.17);
      } else if (hat === 'cap') { g.fillStyle = C('#f3efe6'); ell(g, hx, by, hr * 1.1, hr * 0.27); g.fill(); dot(1.95, B - 0.12, 0.3); }
      else {
        g.strokeStyle = C(ch.trim); g.lineWidth = hr * 0.24; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(hx - hr * 0.9, by - hr * 0.2); g.quadraticCurveTo(hx, by - hr * 0.42, hx + hr * 0.9, by - hr * 0.2); g.stroke();
        g.fillStyle = C(shade(hb, -0.45));
        if (hat === 'floppy') { g.beginPath(); mv(-2.5, B + 0.4); qd(-1.3, B - 0.5, 0, B - 0.28); qd(1.3, B - 0.5, 2.5, B + 0.4); qd(1.3, B + 0.22, 0, B + 0.2); qd(-1.3, B + 0.22, -2.5, B + 0.4); g.closePath(); g.fill(); }
        else { ell(g, hx, by, hr * (hat === 'top' ? 1.5 : 1.8), hr * 0.3); g.fill(); }
        g.fillStyle = C(shade(hb, -0.2)); ell(g, hx, by - hr * 0.07, hr * 1.02, hr * 0.17); g.fill();
        g.fillStyle = C(ch.trim);
        if (hat === 'bent') { star(g, hx + hr * 1.82, hy + (B - 1.42) * hr, hr * 0.3); g.fill(); }
        if (hat === 'tall') [[-0.25, -0.95, 0.2], [0.22, -1.8, 0.17], [0.05, -2.75, 0.14]].forEach(function (st) { star(g, hx + st[0] * hr, hy + (B + st[1]) * hr, st[2] * hr); g.fill(); });
        if (hat === 'floppy') { g.fillStyle = C(accent); g.fillRect(hx + hr * 0.15, hy + (B - 1.3) * hr, hr * 0.5, hr * 0.45); }
      }
    }
    g.restore();

    // bras de la baguette (à gauche pour nous)
    var sx = X(-12.5), sy = Y(76), tk = pose.talk;
    var tip = pose.tip || (tk != null // en parlant, la main de la baguette se lève et s'agite un peu, et l'autre bras fait des gestes
      ? { x: X(-31 - 3 * Math.sin(tk * 2.3) + 4 * Math.sin(tk * 0.9)), y: Y(66 - 9 * Math.max(0, Math.sin(tk * 1.7)) - 3 * Math.sin(tk * 4.1)) }
      : { x: X(-31), y: Y(66) });
    if (tk != null && !pose.tip && !pose.portrait) { // l'autre bras (à droite pour nous) : la main qui ponctue les phrases
      var lift = Math.max(0, Math.sin(tk * 1.3 + 1.2)), ox = X(12.5), oy = Y(76), ohx = X(22 + 5 * lift + 2 * Math.sin(tk * 3.7)), ohy = Y(68 - 16 * lift - 2 * Math.sin(tk * 5.3));
      var odx = ohx - ox, ody = ohy - oy, od = Math.hypot(odx, ody) || 1; odx /= od; ody /= od;
      g.lineCap = 'round'; g.strokeStyle = C(shade(robe, -0.1)); g.lineWidth = 8.5 * u;
      g.beginPath(); g.moveTo(ox, oy); g.lineTo(ohx - odx * 2 * u, ohy - ody * 2 * u); g.stroke();
      g.strokeStyle = C(ch.trim); g.lineCap = 'butt'; g.lineWidth = 8.8 * u;
      g.beginPath(); g.moveTo(ohx - odx * 4.5 * u, ohy - ody * 4.5 * u); g.lineTo(ohx - odx * 1.2 * u, ohy - ody * 1.2 * u); g.stroke();
      g.fillStyle = C(skin); ell(g, ohx, ohy, 2.9 * u, 2.9 * u); g.fill();
    }
    var dx = tip.x - sx, dy = tip.y - sy, d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    var reach = Math.max(8 * u, Math.min(29 * u, d - 21 * u));
    var hdx = sx + dx * reach, hdy = sy + dy * reach;
    if (pose.noWand) { hdx = X(-19.5); hdy = Y(50); dx = (hdx - sx); dy = (hdy - sy); d = Math.hypot(dx, dy); dx /= d; dy /= d; }
    g.lineCap = 'round'; g.strokeStyle = C(shade(robe, -0.1)); g.lineWidth = 8.5 * u;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(hdx - dx * 2 * u, hdy - dy * 2 * u); g.stroke();
    g.strokeStyle = C(ch.trim); g.lineCap = 'butt'; g.lineWidth = 8.8 * u;
    g.beginPath(); g.moveTo(hdx - dx * 4.5 * u, hdy - dy * 4.5 * u); g.lineTo(hdx - dx * 1.2 * u, hdy - dy * 1.2 * u); g.stroke();
    if (!pose.noWand) {
      drawWand(g, hdx - dx * 2 * u, hdy - dy * 2 * u, tip.x, tip.y, 1.5 * u, 0.6 * u, pose.wand || { wood: '#a98a62', handle: '#5a3f28' }, tint);
      if (pose.glow) glowDot(g, tip.x, tip.y, 5 * u, pose.glow, 0.9);
    } else tip = { x: hdx, y: hdy };
    g.fillStyle = C(skin); ell(g, hdx, hdy, 2.9 * u, 2.9 * u); g.fill();

    return { chest: { x: X(0), y: Y(58) }, head: { x: hx, y: ny + (hy - ny) * hk }, tip: tip, hand: { x: hdx, y: hdy }, u: u };
  }

  function glowDot(g, x, y, r, color, alpha) {
    g.save(); g.globalCompositeOperation = 'lighter';
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,' + alpha + ')'); gr.addColorStop(0.25, rgba(color, alpha * 0.8)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
  }

  // Baguette effilée du manche (x0,y0) à la pointe (x1,y1).
  function drawWand(g, x0, y0, x1, y1, w0, w1, wd, tint) {
    var C = function (col) { return tint ? mix(col, tint[0], tint[1]) : col; };
    var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    var at = function (t, side) { var w = (w0 + (w1 - w0) * t) * side; return [x0 + dx * t + nx * w, y0 + dy * t + ny * w]; };
    var gr = g.createLinearGradient(x0 + nx * w0, y0 + ny * w0, x0 - nx * w0, y0 - ny * w0);
    gr.addColorStop(0, C(shade(wd.wood, -0.35))); gr.addColorStop(0.55, C(shade(wd.wood, 0.18))); gr.addColorStop(1, C(shade(wd.wood, -0.2)));
    g.fillStyle = gr; poly(g, [at(0, 1), at(1, 1), at(1, -1), at(0, -1)]); g.fill();
    ell(g, x1, y1, w1, w1); g.fill();
    gr = g.createLinearGradient(x0 + nx * w0, y0 + ny * w0, x0 - nx * w0, y0 - ny * w0);
    gr.addColorStop(0, C(shade(wd.handle, -0.3))); gr.addColorStop(0.55, C(shade(wd.handle, 0.2))); gr.addColorStop(1, C(shade(wd.handle, -0.15)));
    g.fillStyle = gr; poly(g, [at(0, 1.25), at(0.24, 1.2), at(0.24, -1.2), at(0, -1.25)]); g.fill();
    g.fillStyle = C(shade(wd.handle, 0.42));
    [0.02, 0.215, 0.25].forEach(function (t) { poly(g, [at(t, 1.42), at(t + 0.016, 1.42), at(t + 0.016, -1.42), at(t, -1.42)]); g.fill(); });
  }

  // ───────────────────────── Vue à la première personne ─────────────────────────
  // Bras et baguette du joueur : la pointe suit le curseur. o : { hidden, glow (0..1), color }
  function drawPlayerWand(g, W, H, tip, ch, wd, o) {
    o = o || {};
    var bx = W * 0.67 + (tip.x - W * 0.5) * 0.3, by = H * 1.18;
    var dx = tip.x - bx, dy = tip.y - by, d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    var nx = -dy, ny = dx, wl = Math.min(d * 0.7, H * 0.4);
    var gx = tip.x - dx * wl, gy = tip.y - dy * wl;           // poing
    var wx = gx - dx * H * 0.045, wy = gy - dy * H * 0.045;   // poignet
    var w0 = H * 0.15, w1 = H * 0.058, gr;
    // manche
    gr = g.createLinearGradient(wx + nx * w1, wy + ny * w1, wx - nx * w1, wy - ny * w1);
    gr.addColorStop(0, shade(ch.robe, -0.5)); gr.addColorStop(0.5, shade(ch.robe, 0.05)); gr.addColorStop(1, shade(ch.robe, -0.35));
    g.fillStyle = gr; poly(g, [[bx + nx * w0, by + ny * w0], [wx + nx * w1, wy + ny * w1], [wx - nx * w1, wy - ny * w1], [bx - nx * w0, by - ny * w0]]); g.fill();
    var cx = wx - dx * H * 0.05, cy = wy - dy * H * 0.05, cw = w1 * 1.16;
    g.fillStyle = ch.trim; poly(g, [[cx + nx * cw * 1.08, cy + ny * cw * 1.08], [wx + nx * cw, wy + ny * cw], [wx - nx * cw, wy - ny * cw], [cx - nx * cw * 1.08, cy - ny * cw * 1.08]]); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)'; poly(g, [[cx - nx * cw * 0.2, cy - ny * cw * 0.2], [wx - nx * cw * 0.2, wy - ny * cw * 0.2], [wx - nx * cw, wy - ny * cw], [cx - nx * cw * 1.08, cy - ny * cw * 1.08]]); g.fill();
    // main
    var hr = H * 0.047, ang = Math.atan2(dy, dx);
    gr = g.createRadialGradient(gx + nx * hr * 0.3, gy + ny * hr * 0.3, hr * 0.2, gx, gy, hr * 1.2);
    gr.addColorStop(0, shade(ch.skin, 0.08)); gr.addColorStop(1, shade(ch.skin, -0.22));
    g.fillStyle = gr; g.beginPath(); g.ellipse(gx - dx * hr * 0.2, gy - dy * hr * 0.2, hr * 1.15, hr * 0.92, ang, 0, TAU); g.fill();
    if (!o.hidden) {
      drawWand(g, gx - dx * hr * 0.9, gy - dy * hr * 0.9, tip.x, tip.y, H * 0.0125, H * 0.0042, wd);
      // doigts refermés sur le manche
      for (var i = 0; i < 4; i++) {
        var t = -0.55 + i * 0.42, fx = gx + dx * hr * t, fy = gy + dy * hr * t;
        g.fillStyle = shade(ch.skin, i % 2 ? -0.06 : 0.02);
        g.beginPath(); g.ellipse(fx - nx * hr * 0.12, fy - ny * hr * 0.12, hr * 0.56, hr * 0.23, ang + Math.PI / 2 + 0.25, 0, TAU); g.fill();
        g.strokeStyle = shade(ch.skin, -0.32); g.lineWidth = 1; g.stroke();
      }
      g.fillStyle = shade(ch.skin, 0.04); g.beginPath(); g.ellipse(gx + dx * hr * 0.55 + nx * hr * 0.52, gy + dy * hr * 0.55 + ny * hr * 0.52, hr * 0.5, hr * 0.24, ang - 0.35, 0, TAU); g.fill();
      glowDot(g, tip.x, tip.y, H * (0.02 + 0.05 * (o.glow || 0)), o.color || wd.glow, 0.45 + 0.55 * (o.glow || 0));
    }
  }

  // ───────────────────────── Icônes ─────────────────────────
  // Dessin SVG d'une forme de sort, avec un point au départ du tracé.
  function glyphSvg(name, color) {
    var pts = DS.gestures.template(name, 40), d = '';
    pts.forEach(function (p, i) { d += (i ? 'L' : 'M') + (50 + p.x * 64).toFixed(1) + ' ' + (50 + p.y * 64).toFixed(1); });
    var s = pts[0];
    return '<svg viewBox="0 0 100 100" class="glyph" aria-hidden="true"><path d="' + d + '" pathLength="1" fill="none" stroke="' + color + '" stroke-opacity=".35" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" pathLength="1" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + (50 + s.x * 64).toFixed(1) + '" cy="' + (50 + s.y * 64).toFixed(1) + '" r="6.5" fill="' + color + '" stroke="#fff" stroke-width="2"/></svg>';
  }

  // Dans la bulle d'un professeur, chaque nom de sort devient une pastille : son petit signe à côté du nom, et au survol, le signe en grand avec la façon de le tracer.
  // On ne touche qu'au texte (jamais à l'intérieur des balises) ; un nom déjà entre <b> le reste.
  var spellRx = null;
  function spellRefs(html) {
    if (!spellRx) { var names = DS.SPELLS.map(function (s) { return s.name; }).sort(function (a, b) { return b.length - a.length; }).map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }); spellRx = new RegExp('(^|[^\\p{L}])(' + names.join('|') + ')(?![\\p{L}])', 'gu'); }
    return html.split(/(<[^>]+>)/).map(function (part, k) {
      if (k % 2) return part; // une balise
      return part.replace(spellRx, function (m, pre, name) {
        var s = DS.SPELLS.filter(function (x) { return x.name === name; })[0]; if (!s) return m;
        return pre + '<b class="spref" data-id="' + s.id + '" style="--c:' + s.color + '"><i class="mini">' + glyphSvg(s.glyph, s.color) + '</i>' + name + '<span class="tip">' + glyphSvg(s.glyph, s.color) + '<b>' + s.name + '</b><small>' + s.how + '</small></span></b>';
      });
    }).join('');
  }

  // Les pastilles trop près du haut de l'écran ouvrent leur signe vers le bas (sinon il sortirait de l'écran).
  function spellTips(root) { if (!root) return; root.querySelectorAll('.spref').forEach(function (el) { el.classList.toggle('below', el.getBoundingClientRect().top < 230); }); }

  // ───────────────────────── Décors peints des boutiques ─────────────────────────
  // Le magasin de magie : un mur de planches, des étagères pleines de fioles qui luisent, un chaudron, des lanternes, un comptoir.
  // Rendu une fois à la taille de l'écran, puis posé en fond d'écran (js/main.js). Si img/magasin.jpg existe un jour, il prendra la place.
  function makeShopBg(W, H, empty) { // empty : les étagères restent vides, le magasin y pose ses objets
    var c = document.createElement('canvas'), g = c.getContext('2d'), i, j, gr, rnd = seeded(7);
    c.width = W; c.height = H;
    gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1a10'); gr.addColorStop(1, '#120a08'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (i = 0; i < H; i += 46) { g.fillStyle = i / 46 % 2 ? '#3a2515' : '#33200f'; g.fillRect(0, i, W, 46); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, i + 43, W, 3); } // planches
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (i = 0; i < 40; i++) { var kx = rnd() * W, ky = rnd() * H; g.beginPath(); g.ellipse(kx, ky, 3 + rnd() * 5, 2 + rnd() * 3, 0, 0, TAU); g.fill(); } // nœuds du bois
    var shelves = [H * 0.2, H * 0.4, H * 0.6], COLS = ['#7fd4ff', '#b8f27a', '#ff8ad0', '#ffd978', '#c58bff', '#5fd35f', '#ff8a3a', '#9fe8c0'];
    if (empty) shelves = [H * 0.3, H * 0.52, H * 0.74];
    shelves.forEach(function (sy, si) {
      var x = 30 + (si % 2) * 20;
      while (!empty && x < W - 60) { // fioles, bocaux, livres
        var kind = rnd(), w = 22 + rnd() * 26, h = 40 + rnd() * 50, col = COLS[Math.floor(rnd() * COLS.length)];
        if (kind < 0.55) { // une fiole qui luit
          glowDot(g, x + w / 2, sy - h * 0.55, h * 0.9, col, 0.35);
          gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, shade(col, -0.3)); gr.addColorStop(0.4, col); gr.addColorStop(1, shade(col, -0.45)); g.fillStyle = gr;
          g.beginPath(); g.moveTo(x + w * 0.35, sy - h); g.lineTo(x + w * 0.65, sy - h); g.lineTo(x + w * 0.65, sy - h * 0.72); g.quadraticCurveTo(x + w * 1.05, sy - h * 0.5, x + w, sy - 2); g.lineTo(x, sy - 2); g.quadraticCurveTo(x - w * 0.05, sy - h * 0.5, x + w * 0.35, sy - h * 0.72); g.closePath(); g.fill();
          g.fillStyle = '#8a6a3e'; g.fillRect(x + w * 0.33, sy - h - 8, w * 0.34, 10); // le bouchon
          g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(x + w * 0.3, sy - h * 0.4, w * 0.08, h * 0.22, 0, 0, TAU); g.fill();
        } else if (kind < 0.8) { // une pile de livres
          var n = 2 + Math.floor(rnd() * 3), y = sy - 2;
          for (j = 0; j < n; j++) { var bh = 9 + rnd() * 6, bw = w + 12 + rnd() * 10; g.fillStyle = COLS[Math.floor(rnd() * COLS.length)]; g.fillStyle = shade(g.fillStyle, -0.35); g.fillRect(x + (w + 12 - bw) / 2 + rnd() * 4, y - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 4, y - bh + 3, bw - 10, 1.5); y -= bh; }
          w += 14;
        } else { // un bocal avec quelque chose dedans
          g.fillStyle = 'rgba(190,220,240,0.22)'; g.fillRect(x, sy - h * 0.75, w + 8, h * 0.75 - 2); g.fillStyle = col; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(x + (w + 8) / 2, sy - h * 0.3, (w + 8) * 0.32, h * 0.2, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
          g.fillStyle = '#6b4a2a'; g.fillRect(x - 2, sy - h * 0.75 - 7, w + 12, 8); w += 8;
        }
        x += w + 14 + rnd() * 30;
      }
      g.fillStyle = '#5a3a1e'; g.fillRect(0, sy, W, 10); g.fillStyle = '#2a170a'; g.fillRect(0, sy + 10, W, 6); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, sy + 16, W, 14); // la planche et son ombre
    });
    // le chaudron, en bas à gauche, et sa vapeur verte
    var cx = empty ? W * 0.07 : W * 0.14, cy = empty ? H * 0.96 : H * 0.86;
    glowDot(g, cx, cy - 60, 140, '#5fd35f', 0.35);
    g.fillStyle = '#1a1a22'; g.beginPath(); g.ellipse(cx, cy, 80, 58, 0, 0, TAU); g.fill();
    g.fillStyle = '#2b2b36'; g.beginPath(); g.ellipse(cx, cy - 40, 86, 18, 0, 0, TAU); g.fill();
    g.fillStyle = '#6fe87a'; g.beginPath(); g.ellipse(cx, cy - 40, 72, 12, 0, 0, TAU); g.fill();
    for (i = 0; i < 6; i++) { g.fillStyle = 'rgba(160,255,170,' + (0.5 - i * 0.07) + ')'; g.beginPath(); g.arc(cx + Math.sin(i * 1.9) * 26, cy - 60 - i * 22, 10 + i * 3, 0, TAU); g.fill(); }
    // le comptoir, en bas, avec des pièces d'or
    var cy0 = empty ? H * 0.9 : H * 0.8, cx0 = empty ? 0 : W * 0.3;
    gr = g.createLinearGradient(0, cy0, 0, H); gr.addColorStop(0, '#6b4524'); gr.addColorStop(0.08, '#4a2d14'); gr.addColorStop(1, '#2a170a'); g.fillStyle = gr; g.fillRect(cx0, cy0, W - cx0, H - cy0);
    g.fillStyle = '#8a5a2e'; g.fillRect(cx0, cy0, W - cx0, 10);
    for (i = 0; i < 9; i++) { var px = W * 0.62 + rnd() * W * 0.3, py = cy0 - 6 - rnd() * 6; g.fillStyle = '#e2b44c'; g.beginPath(); g.ellipse(px, py, 11, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#fff1a8'; g.beginPath(); g.ellipse(px, py - 1.5, 7, 2.5, 0, 0, TAU); g.fill(); }
    // lanternes suspendues
    [[W * 0.22, 34], [W * 0.5, 22], [W * 0.78, 40]].forEach(function (l) {
      g.strokeStyle = '#2a1a0c'; g.lineWidth = 2; g.beginPath(); g.moveTo(l[0], 0); g.lineTo(l[0], l[1]); g.stroke();
      glowDot(g, l[0], l[1] + 26, 150, '#ffb347', 0.55);
      g.fillStyle = '#3a2a12'; g.fillRect(l[0] - 14, l[1], 28, 44); g.fillStyle = '#ffd36b'; g.fillRect(l[0] - 9, l[1] + 6, 18, 32); g.fillStyle = '#fff4c2'; g.fillRect(l[0] - 4, l[1] + 14, 8, 18);
    });
    // la poussière magique et une toile d'araignée dans le coin
    for (i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,230,170,' + (0.15 + rnd() * 0.4) + ')'; g.beginPath(); g.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 1.6, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
    for (i = 0; i < 6; i++) { g.beginPath(); g.moveTo(W, 0); g.lineTo(W - Math.cos(i * 0.26) * 150, Math.sin(i * 0.26) * 150); g.stroke(); }
    for (i = 1; i < 5; i++) { g.beginPath(); for (j = 0; j <= 6; j++) { var a = j * 0.26, r = i * 32; g.lineTo(W - Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,' + (empty ? 0.12 : 0.25) + ')'; g.fillRect(0, 0, W, H); // un peu d'ombre : ce qui est posé devant doit rester lisible
    return c;
  }
  // La chambre du miroir magique : velours sombre, rideaux, une fenêtre sur la nuit, des chandelles qui flottent.
  function makeMirrorBg(W, H) {
    var c = document.createElement('canvas'), g = c.getContext('2d'), i, gr, rnd = seeded(3);
    c.width = W; c.height = H;
    gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1b1030'); gr.addColorStop(1, '#0a0716'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (i = 0; i < W; i += 34) { g.fillStyle = i / 34 % 2 ? 'rgba(90,40,120,0.18)' : 'rgba(40,20,70,0.18)'; g.fillRect(i, 0, 34, H); } // le velours rayé
    // la fenêtre en ogive, la lune et les étoiles
    var wx = W * 0.5, wy = H * 0.06, ww = W * 0.16, wh = H * 0.42;
    g.save(); g.beginPath(); g.moveTo(wx - ww / 2, wy + wh); g.lineTo(wx - ww / 2, wy + ww / 2); g.quadraticCurveTo(wx, wy - ww * 0.3, wx + ww / 2, wy + ww / 2); g.lineTo(wx + ww / 2, wy + wh); g.closePath(); g.clip();
    gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#182a52'); gr.addColorStop(1, '#2d3f6e'); g.fillStyle = gr; g.fillRect(wx - ww, wy - ww, ww * 2, wh + ww * 2);
    for (i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd() * 0.7) + ')'; g.beginPath(); g.arc(wx - ww / 2 + rnd() * ww, wy + rnd() * wh, 0.6 + rnd() * 1.2, 0, TAU); g.fill(); }
    glowDot(g, wx + ww * 0.2, wy + wh * 0.3, ww * 0.5, '#fff6d0', 0.9); g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(wx + ww * 0.2, wy + wh * 0.3, ww * 0.12, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = '#6a5a8c'; g.lineWidth = 8; g.beginPath(); g.moveTo(wx - ww / 2, wy + wh); g.lineTo(wx - ww / 2, wy + ww / 2); g.quadraticCurveTo(wx, wy - ww * 0.3, wx + ww / 2, wy + ww / 2); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
    // les rideaux de chaque côté
    [[0, 1], [W, -1]].forEach(function (s) {
      gr = g.createLinearGradient(s[0], 0, s[0] + s[1] * W * 0.16, 0); gr.addColorStop(0, '#4a1a3a'); gr.addColorStop(0.5, '#7a2a5a'); gr.addColorStop(1, '#3a1230');
      g.fillStyle = gr; g.beginPath(); g.moveTo(s[0], 0); g.lineTo(s[0] + s[1] * W * 0.16, 0); g.quadraticCurveTo(s[0] + s[1] * W * 0.05, H * 0.5, s[0] + s[1] * W * 0.12, H); g.lineTo(s[0], H); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; for (i = 1; i < 6; i++) { g.beginPath(); g.moveTo(s[0] + s[1] * W * 0.16 * i / 6, 0); g.quadraticCurveTo(s[0] + s[1] * W * 0.05 * i / 6, H * 0.5, s[0] + s[1] * W * 0.12 * i / 6, H); g.stroke(); }
      g.fillStyle = '#e2b44c'; g.beginPath(); g.ellipse(s[0] + s[1] * W * 0.1, H * 0.5, W * 0.05, 9, 0, 0, TAU); g.fill(); // l'embrasse dorée
    });
    // le tapis et des chandelles qui flottent
    gr = g.createLinearGradient(0, H * 0.78, 0, H); gr.addColorStop(0, '#5a1a2a'); gr.addColorStop(1, '#2a0a12'); g.fillStyle = gr; g.fillRect(0, H * 0.78, W, H * 0.22);
    g.strokeStyle = '#c9a25e'; g.lineWidth = 3; g.strokeRect(W * 0.08, H * 0.82, W * 0.84, H * 0.14);
    for (i = 0; i < 12; i++) { var cx = W * 0.2 + rnd() * W * 0.6, cy = H * 0.08 + rnd() * H * 0.5; if (Math.abs(cx - wx) < ww * 0.7 && cy < wy + wh) continue; glowDot(g, cx, cy - 6, 40, '#ffd36b', 0.7); g.fillStyle = '#e9dfc4'; g.fillRect(cx - 3, cy, 6, 22); }
    for (i = 0; i < 60; i++) { g.fillStyle = 'rgba(200,180,255,' + (0.15 + rnd() * 0.4) + ')'; g.beginPath(); g.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 1.5, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, 0, W, H);
    return c;
  }
  // ───────────────────────── Les monstres de l'aventure ─────────────────────────
  // m : une fiche de DS.MONSTERS (kind, color, eye) · x, fy : les pieds · h : hauteur · pose : { tint, face ('hit'|'sleep'|'cast'|'happy'), glow, tip, t }
  // Même contrat que drawWizard pour la salle de duel (js/duel.js drawFoeBody) : un monstre lance ses sorts sans baguette, la lueur sort de lui.
  function drawMonster(g, m, x, fy, h, pose) {
    pose = pose || {};
    var u = h / 100, t = pose.t !== undefined ? pose.t : performance.now() / 1000, C = function (c) { return pose.tint ? mix(c, pose.tint[0], pose.tint[1]) : c; };
    var col = m.color, dark = shade(col, -0.38), light = shade(col, 0.28), eye = m.eye || '#1b1b26', k = m.kind, face = pose.face, i;
    var fly = k === 'bat' || k === 'ghost' || k === 'wisp', bob = fly ? Math.sin(t * 2.4) * 4 * u : Math.sin(t * 3) * 1.2 * u;
    g.save(); g.translate(x, fy);
    g.fillStyle = 'rgba(0,0,0,0.28)'; ell(g, 0, 0, (fly ? 20 : 30) * u, 6 * u); g.fill(); // l'ombre au sol
    g.translate(0, bob - (fly ? 14 * u : 0));
    // les yeux : ronds et vifs ; en croix quand il est touché, fermés quand il dort, froncés quand il lance un sort
    function eyes(ex, ey, r, ec, n) {
      var xs = n === 1 ? [0] : n === 3 ? [-ex, 0, ex] : [-ex, ex], white = m.eyeWhite !== false;
      xs.forEach(function (dx, j) {
        if (face === 'hit') { g.strokeStyle = C('#1b1b26'); g.lineWidth = Math.max(1.5, r * 0.4); g.beginPath(); g.moveTo(dx - r, ey - r); g.lineTo(dx + r, ey + r); g.moveTo(dx + r, ey - r); g.lineTo(dx - r, ey + r); g.stroke(); return; }
        if (face === 'sleep') { g.strokeStyle = C('#1b1b26'); g.lineWidth = Math.max(1.5, r * 0.35); g.beginPath(); g.arc(dx, ey, r, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); return; }
        if (white) { g.fillStyle = C('#ffffff'); ell(g, dx, ey, r, r * 1.1); g.fill(); }
        g.fillStyle = C(ec || eye); ell(g, dx + (white ? r * 0.15 : 0), ey + r * 0.1, r * (white ? 0.55 : 1), r * (white ? 0.6 : 1)); g.fill();
        if (!white) { g.fillStyle = 'rgba(255,255,255,0.7)'; ell(g, dx - r * 0.3, ey - r * 0.3, r * 0.25, r * 0.25); g.fill(); }
        if (face === 'cast' || face === 'angry' || m.angry) { g.strokeStyle = C(dark); g.lineWidth = Math.max(1.5, r * 0.35); g.beginPath(); g.moveTo(dx - r * 1.2, ey - r * 1.5 + (j === 0 ? 0 : r * 0.5)); g.lineTo(dx + r * 1.2, ey - r * 1.5 + (j === 0 ? r * 0.5 : 0)); g.stroke(); }
      });
    }
    function mouth(mx, my, w, happy) { g.strokeStyle = C(dark); g.lineWidth = Math.max(1.5, 1.6 * u); g.beginPath(); if (face === 'hit') { ell(g, mx, my, w * 0.4, w * 0.5); g.stroke(); } else { g.arc(mx, my - (happy ? 0 : w * 0.6), w, happy ? 0.15 * Math.PI : 1.2 * Math.PI, happy ? 0.85 * Math.PI : 1.8 * Math.PI); g.stroke(); } }
    function fangs(mx, my, w) { g.fillStyle = C('#ffffff'); [-1, 1].forEach(function (s) { poly(g, [[mx + s * w * 0.6, my], [mx + s * w * 0.9, my], [mx + s * w * 0.72, my + w * 0.6]]); g.fill(); }); }
    g.lineJoin = 'round';
    if (k === 'slime') { // une goutte gélatineuse qui tremblote, avec un reflet et des gouttes
      var wob = Math.sin(t * 4) * 0.05, rx = 32 * u * (1 - wob), ry = 27 * u * (1 + wob);
      g.fillStyle = C(dark); ell(g, 0, -ry + 2 * u, rx * 1.02, ry); g.fill();
      var gr = g.createRadialGradient(-rx * 0.3, -ry * 1.2, 2 * u, 0, -ry, rx * 1.3); gr.addColorStop(0, C(light)); gr.addColorStop(1, C(col)); g.fillStyle = gr; ell(g, 0, -ry, rx, ry); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; ell(g, -rx * 0.4, -ry * 1.35, rx * 0.22, ry * 0.14); g.fill();
      g.fillStyle = C(col); for (i = 0; i < 3; i++) { ell(g, (i - 1) * rx * 0.7 + Math.sin(t * 2 + i) * 3 * u, -2 * u + (i % 2) * 2 * u, 4 * u, 3 * u); g.fill(); }
      eyes(10 * u, -ry * 1.2, 5.5 * u); mouth(0, -ry * 0.7, 7 * u, face === 'happy');
    } else if (k === 'bat') { // un corps rond, deux grandes ailes qui battent, des oreilles pointues et des crocs
      var fl = Math.sin(t * 11) * 0.5, cy = -48 * u;
      g.fillStyle = C(dark);
      [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(s * 10 * u, cy); g.quadraticCurveTo(s * 34 * u, cy - 40 * u * (0.6 + fl), s * 60 * u, cy - 18 * u * (0.4 + fl)); g.quadraticCurveTo(s * 50 * u, cy + 6 * u, s * 42 * u, cy + 2 * u); g.quadraticCurveTo(s * 34 * u, cy + 14 * u, s * 26 * u, cy + 6 * u); g.quadraticCurveTo(s * 18 * u, cy + 18 * u, s * 10 * u, cy + 8 * u); g.closePath(); g.fill(); });
      g.fillStyle = C(col); ell(g, 0, cy, 17 * u, 19 * u); g.fill();
      [-1, 1].forEach(function (s) { poly(g, [[s * 6 * u, cy - 14 * u], [s * 14 * u, cy - 34 * u], [s * 17 * u, cy - 10 * u]]); g.fill(); });
      g.fillStyle = C(light); ell(g, 0, cy + 6 * u, 9 * u, 9 * u); g.fill();
      eyes(6 * u, cy - 4 * u, 3.5 * u); mouth(0, cy + 9 * u, 4 * u, face === 'happy'); fangs(0, cy + 9 * u, 4 * u);
    } else if (k === 'ghost') { // un drap qui flotte, le bas en vagues, des yeux creux
      var gy = -95 * u, by = -12 * u;
      g.globalAlpha *= 0.92; g.fillStyle = C(col); g.beginPath(); g.moveTo(-30 * u, by);
      g.lineTo(-30 * u, gy + 30 * u); g.quadraticCurveTo(-30 * u, gy, 0, gy); g.quadraticCurveTo(30 * u, gy, 30 * u, gy + 30 * u); g.lineTo(30 * u, by);
      for (i = 0; i < 5; i++) { var wx = 30 * u - (i + 0.5) * 12 * u, wy = by + Math.sin(t * 5 + i) * 3 * u; g.quadraticCurveTo(wx + 6 * u, wy + 9 * u, wx, wy - (i % 2 ? 0 : 2 * u)); g.lineTo(wx - 6 * u, wy + (i % 2 ? 6 * u : 0)); }
      g.closePath(); g.fill();
      g.fillStyle = C(light); g.globalAlpha *= 0.5; ell(g, -10 * u, gy + 22 * u, 10 * u, 16 * u); g.fill(); g.globalAlpha /= 0.5;
      [-1, 1].forEach(function (s) { g.fillStyle = C(col); ell(g, s * 26 * u, -58 * u + Math.sin(t * 3 + s) * 3 * u, 11 * u, 7 * u); g.fill(); }); // des mains qui flottent
      eyes(10 * u, gy + 30 * u, 6 * u, eye); g.fillStyle = C(eye); ell(g, 0, gy + 47 * u, 4 * u, 6 * u * (face === 'hit' ? 1.3 : 0.8 + 0.2 * Math.sin(t * 3))); g.fill();
    } else if (k === 'skeleton') { // crâne, côtes, bras d'os, et une cape en lambeaux de sa couleur
      var bone = '#ece6d6';
      g.fillStyle = C(col); g.beginPath(); g.moveTo(-22 * u, -78 * u); g.lineTo(22 * u, -78 * u); for (i = 0; i < 6; i++) g.lineTo(22 * u - i * 8.8 * u, -2 * u - (i % 2) * 10 * u); g.closePath(); g.fill();
      g.strokeStyle = C(bone); g.lineWidth = 3 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -70 * u); g.lineTo(0, -30 * u); g.stroke();
      for (i = 0; i < 4; i++) { g.beginPath(); g.ellipse(0, -62 * u + i * 9 * u, 16 * u - i * 2 * u, 5 * u, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.ellipse(0, -62 * u + i * 9 * u, 16 * u - i * 2 * u, 5 * u, 0, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
      [-1, 1].forEach(function (s) { var sw = Math.sin(t * 2 + s) * 3 * u; g.beginPath(); g.moveTo(s * 14 * u, -66 * u); g.lineTo(s * 30 * u + sw, -48 * u); g.lineTo(s * 26 * u + sw, -26 * u); g.stroke(); g.beginPath(); g.moveTo(s * 7 * u, -30 * u); g.lineTo(s * 9 * u, -4 * u); g.stroke(); });
      g.fillStyle = C(bone); ell(g, 0, -88 * u, 14 * u, 13 * u); g.fill(); g.fillRect(-9 * u, -80 * u, 18 * u, 8 * u);
      g.fillStyle = C('#1b1b26'); ell(g, -5.5 * u, -90 * u, 4.5 * u, 5 * u); g.fill(); ell(g, 5.5 * u, -90 * u, 4.5 * u, 5 * u); g.fill(); poly(g, [[0, -84 * u], [-2.5 * u, -80 * u], [2.5 * u, -80 * u]]); g.fill();
      g.fillStyle = C(eye); ell(g, -5.5 * u, -90 * u, 2 * u, 2 * u); g.fill(); ell(g, 5.5 * u, -90 * u, 2 * u, 2 * u); g.fill();
      g.strokeStyle = C('#1b1b26'); g.lineWidth = u; for (i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 3.5 * u, -79 * u); g.lineTo(i * 3.5 * u, -73 * u); g.stroke(); }
      if (face === 'hit') { g.strokeStyle = C(eye); g.lineWidth = 1.5 * u; g.beginPath(); g.moveTo(-9 * u, -94 * u); g.lineTo(-2 * u, -86 * u); g.moveTo(-2 * u, -94 * u); g.lineTo(-9 * u, -86 * u); g.moveTo(2 * u, -94 * u); g.lineTo(9 * u, -86 * u); g.moveTo(9 * u, -94 * u); g.lineTo(2 * u, -86 * u); g.stroke(); }
    } else if (k === 'golem') { // des blocs de pierre empilés, des fissures, un œil qui luit
      var blk = function (bx, by2, bw, bh, c) { g.fillStyle = C(c); g.beginPath(); g.roundRect ? g.roundRect(bx - bw / 2, by2 - bh, bw, bh, 5 * u) : g.rect(bx - bw / 2, by2 - bh, bw, bh); g.fill(); };
      var sw2 = Math.sin(t * 1.5) * 2 * u;
      blk(-19 * u, 0, 16 * u, 18 * u, dark); blk(19 * u, 0, 16 * u, 18 * u, dark);
      blk(0, -16 * u, 52 * u, 48 * u, col); blk(0, -22 * u, 40 * u, 30 * u, light);
      blk(-36 * u, -22 * u + sw2, 16 * u, 40 * u, dark); blk(36 * u, -22 * u - sw2, 16 * u, 40 * u, dark);
      blk(0, -62 * u, 30 * u, 24 * u, col);
      g.strokeStyle = C(shade(col, -0.55)); g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(-14 * u, -40 * u); g.lineTo(-8 * u, -50 * u); g.lineTo(-10 * u, -58 * u); g.moveTo(12 * u, -30 * u); g.lineTo(18 * u, -42 * u); g.stroke();
      if (face === 'hit') eyes(7 * u, -74 * u, 3.5 * u); else { glowDot(g, 0, -74 * u, 9 * u, eye, 0.9); g.fillStyle = C(eye); ell(g, 0, -74 * u, 9 * u, 3.5 * u); g.fill(); g.fillStyle = '#fff'; ell(g, 0, -74 * u, 3 * u, 2.5 * u); g.fill(); }
      g.fillStyle = C(shade(col, -0.55)); for (i = -2; i <= 2; i++) g.fillRect(i * 5 * u - 1.5 * u, -66 * u, 3 * u, 3 * u);
    } else if (k === 'spider') { // un gros abdomen, huit pattes qui s'agitent, six yeux
      g.strokeStyle = C(dark); g.lineWidth = 3 * u; g.lineCap = 'round';
      for (i = 0; i < 4; i++) [-1, 1].forEach(function (s) { var a = -0.9 + i * 0.6 + Math.sin(t * 6 + i * 1.3 + s) * 0.12, lx = s * 14 * u, ly = -34 * u + i * 4 * u; var kx = lx + s * Math.cos(a) * 30 * u, ky = ly - Math.abs(Math.sin(a)) * 26 * u - 10 * u; g.beginPath(); g.moveTo(lx, ly); g.lineTo(kx, ky); g.lineTo(kx + s * 12 * u, 0); g.stroke(); });
      g.fillStyle = C(col); ell(g, 0, -30 * u, 27 * u, 21 * u); g.fill(); g.fillStyle = C(light); ell(g, -6 * u, -38 * u, 8 * u, 5 * u); g.fill();
      g.fillStyle = C(dark); ell(g, 0, -46 * u, 13 * u, 12 * u); g.fill();
      g.fillStyle = C(col); for (i = 0; i < 3; i++) ell(g, 0, -22 * u + i * 6 * u, 4 * u - i * u, 2 * u), g.fill();
      eyes(5 * u, -50 * u, 3 * u, eye, 3); eyes(8 * u, -43 * u, 2 * u, eye, 3); fangs(0, -37 * u, 4 * u);
    } else if (k === 'wisp') { // une boule de lumière, une traîne de flammes, deux yeux dans la lueur
      var wy2 = -56 * u;
      for (i = 0; i < 3; i++) flame(g, (i - 1) * 9 * u, wy2 + 14 * u, 11 * u, t, i * 1.7);
      g.save(); g.globalCompositeOperation = 'lighter'; glowDot(g, 0, wy2, 36 * u, col, 0.9); g.restore();
      var gr2 = g.createRadialGradient(-4 * u, wy2 - 4 * u, u, 0, wy2, 16 * u); gr2.addColorStop(0, '#ffffff'); gr2.addColorStop(0.5, C(light)); gr2.addColorStop(1, C(col)); g.fillStyle = gr2; ell(g, 0, wy2, 16 * u, 16 * u); g.fill();
      eyes(5.5 * u, wy2 - 2 * u, 3.5 * u, m.eye || dark); mouth(0, wy2 + 7 * u, 4 * u, face === 'happy');
    } else if (k === 'dragon') { // un corps trapu, un long cou, une tête cornue, des ailes et une queue
      var fl2 = Math.sin(t * 5) * 0.3;
      g.fillStyle = C(dark); [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(s * 6 * u, -56 * u); g.quadraticCurveTo(s * 40 * u, -100 * u - fl2 * 20 * u, s * 62 * u, -64 * u); g.quadraticCurveTo(s * 50 * u, -62 * u, s * 42 * u, -48 * u); g.quadraticCurveTo(s * 30 * u, -56 * u, s * 20 * u, -40 * u); g.closePath(); g.fill(); });
      g.strokeStyle = C(col); g.lineWidth = 9 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(-26 * u, -24 * u); g.quadraticCurveTo(-56 * u, -20 * u + Math.sin(t * 2) * 6 * u, -62 * u, -40 * u); g.stroke(); // la queue
      g.fillStyle = C(col); ell(g, 0, -34 * u, 36 * u, 26 * u); g.fill(); g.fillStyle = C(light); ell(g, 4 * u, -26 * u, 22 * u, 14 * u); g.fill();
      g.fillStyle = C(dark); [[-20, 0], [-6, 0], [10, 0], [24, 0]].forEach(function (q) { ell(g, q[0] * u, -4 * u, 8 * u, 6 * u); g.fill(); });
      g.strokeStyle = C(col); g.lineWidth = 14 * u; g.beginPath(); g.moveTo(16 * u, -44 * u); g.quadraticCurveTo(30 * u, -70 * u, 26 * u, -84 * u); g.stroke(); // le cou
      g.fillStyle = C(col); ell(g, 28 * u, -90 * u, 15 * u, 12 * u); g.fill(); ell(g, 40 * u, -86 * u, 11 * u, 7 * u); g.fill(); // tête et museau
      g.fillStyle = C(dark); [-1, 1].forEach(function (s) { poly(g, [[(22 + s * 5) * u, -98 * u], [(24 + s * 7) * u, -116 * u], [(27 + s * 8) * u, -97 * u]]); g.fill(); });
      g.fillStyle = C(dark); for (i = 0; i < 5; i++) { poly(g, [[(-18 + i * 9) * u, -58 * u], [(-14 + i * 9) * u, -68 * u], [(-10 + i * 9) * u, -58 * u]]); g.fill(); }
      g.fillStyle = '#ffffff'; ell(g, 46 * u, -84 * u, 2 * u, 1.3 * u); g.fill();
      eyes(0, -92 * u, 3.5 * u, eye, 1); g.translate(30 * u, 0); g.translate(-30 * u, 0);
      if (face !== 'hit' && face !== 'sleep') { g.fillStyle = C(eye); ell(g, 30 * u, -92 * u, 3.5 * u, 3.8 * u); g.fill(); g.fillStyle = '#1b1b26'; ell(g, 31 * u, -92 * u, 1.2 * u, 3 * u); g.fill(); }
      if (pose.glow || face === 'cast') { g.save(); g.globalCompositeOperation = 'lighter'; glowDot(g, 50 * u, -84 * u, 10 * u, pose.glow || '#ff7a3a', 0.8); g.restore(); }
    } else if (k === 'yeti') { // une grosse boule de fourrure hirsute, un visage, de longs bras
      var fur = function (cx, cy2, rx2, ry2, c) { g.fillStyle = C(c); g.beginPath(); for (i = 0; i < 24; i++) { var a = i / 24 * TAU, r = i % 2 ? 1 : 0.88; g.lineTo(cx + Math.cos(a) * rx2 * r, cy2 + Math.sin(a) * ry2 * r); } g.closePath(); g.fill(); };
      fur(-36 * u, -40 * u + Math.sin(t * 2) * 3 * u, 12 * u, 30 * u, dark); fur(36 * u, -40 * u - Math.sin(t * 2) * 3 * u, 12 * u, 30 * u, dark);
      fur(0, -50 * u, 40 * u, 48 * u, col); fur(0, -36 * u, 24 * u, 22 * u, light);
      g.fillStyle = C(shade(col, -0.15)); ell(g, 0, -70 * u, 18 * u, 15 * u); g.fill();
      g.fillStyle = C(dark); ell(g, -22 * u, 0, 10 * u, 6 * u); g.fill(); ell(g, 22 * u, 0, 10 * u, 6 * u); g.fill();
      eyes(7 * u, -73 * u, 3.5 * u); g.fillStyle = C('#3a2a3a'); ell(g, 0, -66 * u, 3.5 * u, 2.5 * u); g.fill();
      g.strokeStyle = C('#3a2a3a'); g.lineWidth = 1.5 * u; g.beginPath(); g.arc(0, -62 * u, 7 * u, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
      g.fillStyle = C('#ffffff'); for (i = -1; i <= 1; i++) { poly(g, [[i * 4 * u - 1.5 * u, -60 * u], [i * 4 * u + 1.5 * u, -60 * u], [i * 4 * u, -56 * u]]); g.fill(); }
    }
    if (pose.glow && k !== 'dragon') { var tp = pose.tip || { x: 0, y: -60 * u }; g.save(); g.globalCompositeOperation = 'lighter'; glowDot(g, tp.x, tp.y, 12 * u, pose.glow, 0.85); g.restore(); } // il lance un sort : la lueur sort de lui
    g.restore();
  }
  function seeded(n) { var s = n * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; } // du hasard toujours pareil : le décor ne change pas d'une fois à l'autre
  // Notre reflet dans le miroir magique : le sorcier à l'envers (comme dans un miroir), sur un verre sombre qui scintille.
  function drawMirror(g, W, H, ch, age, t) {
    var gr = g.createRadialGradient(W * 0.5, H * 0.35, 10, W * 0.5, H * 0.5, H * 0.7);
    gr.addColorStop(0, '#3a3560'); gr.addColorStop(1, '#0d0b1c'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W, 0); g.scale(-1, 1);
    drawWizard(g, ch, W / 2, H * 0.93, H * 0.72, { portrait: true, face: 'happy', age: age });
    g.restore();
    if (ch.aura) { // un chapeau à effet (miroir magique) : des étincelles de sa couleur montent autour de notre reflet
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var k = 0; k < 18; k++) { var ph = k * 2.39, life = (t * 0.35 + k * 0.137) % 1, ax = W * 0.5 + Math.sin(ph + t * 0.6) * W * (0.22 + 0.1 * Math.sin(k)), ay = H * (0.95 - life * 0.8), ar = (2 + 3 * Math.sin(Math.PI * life)) * (0.7 + 0.3 * Math.sin(t * 5 + k)); glowDot(g, ax, ay, ar * 3, ch.aura, 0.5 * Math.sin(Math.PI * life)); g.fillStyle = ch.aura; g.beginPath(); g.arc(ax, ay, ar, 0, TAU); g.fill(); }
      g.restore();
    }
    gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,0.14)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.1)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); // les reflets du verre
    for (var i = 0; i < 7; i++) { var tw = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 1.7), x = W * (0.12 + (i * 0.37) % 0.8), y = H * (0.1 + (i * 0.53) % 0.8), r = (3 + tw * 5); g.fillStyle = 'rgba(255,240,200,' + (0.3 + 0.6 * tw) + ')'; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.closePath(); g.fill(); }
  }

  DS.art = { makeShopBg: makeShopBg, makeMirrorBg: makeMirrorBg, drawMirror: drawMirror, drawMonster: drawMonster, flame: flame, mix: mix, shade: shade, rgba: rgba, makeHall: makeHall, drawHallLive: drawHallLive, drawWizard: drawWizard, drawWand: drawWand, drawPlayerWand: drawPlayerWand, glowDot: glowDot, glyphSvg: glyphSvg, spellRefs: spellRefs, spellTips: spellTips };
})();
