// Clan Gobelin — dessin : décor mis en cache, personnages dessinés par code.
'use strict';
(function (CG) {
  const Art = CG.Art = {}, T = CG.TILE, TAU = Math.PI * 2;
  const cache = {};
  function sprite(key, w, h, draw) {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h); cache[key] = c; return c;
  }
  const ell = (g, x, y, rx, ry, fill) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, fill) => { g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const line = (g, x1, y1, x2, y2, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const poly = (g, pts, fill) => { g.fillStyle = fill; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  function rrect(g, x, y, w, h, r, fill) { g.fillStyle = fill; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); }
  Art.shadow = (g, x, y, r) => ell(g, x, y, r, r * 0.42, 'rgba(0,0,0,0.22)');

  // ---------- décor ----------
  Art.tree = function (g, tx, ty, rot, sc, nu) { // nu : sans l'ombre au sol (un arbre qui tombe ne doit pas faire tourner son ombre avec lui)
    const h = CG.W.hash(tx, ty), v = Math.floor(h * 4), ox = (CG.W.hash(ty, tx) - 0.5) * 12, oy = (h * 7 % 1 - 0.5) * 8;
    const s = sprite('tree' + v + (nu ? 'n' : ''), 96, 146, (c) => {
      c.translate(0, 16); // marge en haut : la pointe du sapin dépassait
      const rng = CG.makeRng(v * 31 + 5);
      if (!nu) ell(c, 48, 118, 26, 9, 'rgba(0,0,0,0.25)');
      c.fillStyle = '#5a3d22'; c.fillRect(42, 78, 12, 40); c.fillStyle = '#463018'; c.fillRect(42, 78, 4, 40);
      if (v < 2) { // feuillu
        const base = v ? [108, 46, 27] : [122, 50, 30];
        [[48, 62, 34], [30, 54, 22], [66, 52, 23], [48, 36, 26]].forEach(([x, y, r], i) => circ(c, x, y, r, `hsl(${base[0]},${base[1]}%,${base[2] - 7 + i * 2}%)`));
        for (let i = 0; i < 16; i++) circ(c, 22 + rng() * 52, 16 + rng() * 54, 5 + rng() * 6, `hsla(${base[0] - 12},${base[1] + 6}%,${base[2] + 9 + rng() * 6}%,0.55)`);
        for (let i = 0; i < 8; i++) circ(c, 26 + rng() * 46, 44 + rng() * 40, 5 + rng() * 5, 'rgba(14,44,20,0.28)');
      } else { // sapin
        const hue = v === 2 ? 150 : 138;
        for (let i = 0; i < 4; i++) { const y = 96 - i * 22, w = 34 - i * 6; poly(c, [48 - w, y, 48 + w, y, 48, y - 40], `hsl(${hue},42%,${19 + i * 3}%)`); poly(c, [48, y, 48 + w, y, 48, y - 40], 'rgba(0,0,0,0.14)'); poly(c, [48 - w + 4, y - 2, 48 - 4, y - 2, 48 - 2, y - 30], `hsla(${hue - 20},45%,38%,0.35)`); }
      }
    });
    const bx = tx * T + T / 2 + ox, by = ty * T + T / 2 + oy + 14;
    if (rot || sc) { g.save(); g.translate(bx, by); if (rot) g.rotate(rot); if (sc) g.scale(sc, sc); g.drawImage(s, -48, -134); g.restore(); } else g.drawImage(s, bx - 48, by - 134);
  };
  // tronc à terre : entier, coupé en deux, ou la dernière moitié
  Art.log = function (g, l) {
    const x = l.tx * T + T / 2, y = l.ty * T + T / 2 + 8, d = l.dir < 0 ? -1 : 1;
    const piece = (a, b) => { const x0 = x + Math.min(a, b) * d * 1, w = Math.abs(b - a); const lx = d > 0 ? x + a : x - b; ell(g, lx + w / 2, y + 6, w / 2 + 2, 4, 'rgba(0,0,0,0.2)'); rrect(g, lx, y - 7, w, 13, 6, '#6b4a2a'); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(lx + 4, y + 1, w - 8, 4); ell(g, lx + w - 2, y - 0.5, 3.5, 6.5, '#c9a56b'); ell(g, lx + w - 2, y - 0.5, 1.6, 3.2, '#a8854e'); ell(g, lx + 2, y - 0.5, 3.5, 6.5, '#5a3d22'); };
    if (!l.cut) piece(-4, 54); else { piece(-4, 22); if (l.halves > 1) piece(28, 54); }
    [[-12, -9], [8, 9], [30, -10]].forEach(([dx, dy]) => ell(g, x + dx * d, y + dy, 5, 3, 'rgba(60,140,70,0.75)'));
  };
  Art.rock = function (g, tx, ty, ore) {
    const v = Math.floor(CG.W.hash(tx, ty) * 2);
    const s = sprite('rock' + v + (ore ? 'o' : ''), 60, 56, c => {
      ell(c, 30, 46, 26, 8, 'rgba(0,0,0,0.25)');
      const pts = v ? [6, 44, 10, 20, 26, 6, 46, 14, 54, 44] : [8, 44, 6, 26, 20, 10, 40, 8, 52, 24, 54, 44];
      poly(c, pts, '#7d7a72'); poly(c, v ? [26, 6, 46, 14, 54, 44, 30, 44] : [40, 8, 52, 24, 54, 44, 34, 44], '#63605a');
      poly(c, v ? [10, 20, 26, 6, 28, 16, 16, 24] : [6, 26, 20, 10, 26, 16, 12, 28], '#a19d92');
      if (ore) [[18, 30], [34, 22], [42, 36], [26, 38]].forEach(([x, y]) => { poly(c, [x, y - 4, x + 4, y, x, y + 4, x - 4, y], '#f0b84a'); circ(c, x - 1, y - 1, 1.2, '#fff6c0'); });
    });
    g.drawImage(s, tx * T + T / 2 - 30, ty * T + T / 2 - 34);
  };
  Art.wall = function (g, tx, ty) {
    const v = Math.floor(CG.W.hash(tx, ty) * 3);
    const s = sprite('wall' + v, 44, 70, c => {
      ell(c, 22, 62, 22, 7, 'rgba(0,0,0,0.25)');
      const top = [14, 22, 8][v];
      c.fillStyle = '#84807a'; c.fillRect(2, top, 40, 62 - top); c.fillStyle = '#6a6660'; c.fillRect(2, top + (62 - top) * 0.55, 40, (62 - top) * 0.45);
      c.strokeStyle = 'rgba(30,30,28,0.45)'; c.lineWidth = 1.5;
      for (let y = top + 10; y < 60; y += 12) { c.beginPath(); c.moveTo(2, y); c.lineTo(42, y); c.stroke(); for (let x = ((y / 12) | 0) % 2 ? 12 : 22; x < 42; x += 20) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 12); c.stroke(); } }
      poly(c, [2, top, 10, top - 6, 20, top, 30, top - 4, 42, top, 42, top + 3, 2, top + 3], '#9a968e');
      circ(c, 8, top + 6, 5, 'rgba(70,110,50,0.7)'); circ(c, 36, 52, 6, 'rgba(70,110,50,0.6)');
    });
    g.drawImage(s, tx * T - 2, ty * T + T - 64);
  };
  // les baies : chaque bosquet de buissons a sa sorte (tous les buissons d'un même coin portent les mêmes fruits)
  const PTS = [[12, 24], [22, 30], [30, 20], [38, 28], [24, 12], [34, 12], [16, 16]], PTS2 = PTS.concat([[30, 30], [18, 22], [40, 20], [28, 25]]);
  Art.BAIES = [
    { nom: 'les framboises', col: '#d8264a', lum: '#ffb0c0', r: 3.2, pts: PTS, f: ['#2f7a3a', '#2a6e34', '#3a8a44'] },
    { nom: 'les bleuets', col: '#3f5fd0', lum: '#b8c8ff', r: 2.6, pts: PTS2, f: ['#3a7a4a', '#33704a', '#4a8a58'] },
    { nom: 'les mûres', col: '#3a1a4a', c2: '#5a2a6a', lum: '#b890d0', r: 3.3, pts: PTS, grappe: true, f: ['#2a6a30', '#255e2c', '#347a3a'] },
    { nom: 'les groseilles dorées', col: '#f0b820', lum: '#fff2b0', r: 2.9, pts: PTS2, f: ['#4a8a34', '#427e2e', '#5a9a3e'] }
  ];
  Art.DOREE = 0.2; Art.DOREE_FOIS = 2; /* part des bosquets qui cachent un buisson de groseilles dorées (un seul), et ce qu'il rapporte de plus */
  Art.baie = function (n) {
    if (n.v === undefined || !Art.BAIES[n.v]) { const l = (CG.W.nodes || []).filter(o => o.type === 'bush'); l.forEach(o => { o._g = null; });
      for (const a of l) { if (a._g) continue; const grp = [a], pile = [a]; a._g = grp; while (pile.length) { const q = pile.pop(); for (const o of l) if (!o._g && Math.abs(o.x - q.x) <= 4 && Math.abs(o.y - q.y) <= 4) { o._g = grp; grp.push(o); pile.push(o); } }
        const c = grp.reduce((m, o) => (o.y < m.y || (o.y === m.y && o.x < m.x) ? o : m), a), h = CG.W.hash(c.x * 3 + 1, c.y * 7 + 2), v = h < 0.4 ? 0 : h < 0.72 ? 1 : 2; grp.forEach(o => { o.v = v; }); /* framboises, bleuets ou mûres, par bosquet */
        if (CG.W.hash(c.x * 11 + 5, c.y * 13 + 3) < Art.DOREE) grp[Math.floor(CG.W.hash(c.x * 5 + 9, c.y * 3 + 4) * grp.length) % grp.length].v = 3; } /* rarement, un seul buisson doré dans le bosquet : il donne le double */
      l.forEach(o => { delete o._g; }); }
    return Art.BAIES[n.v] || Art.BAIES[0];
  };
  Art.node = function (g, n, t) {
    const x = n.x * T + T / 2, y = n.y * T + T / 2;
    if (n.type === 'ore') return Art.rock(g, n.x, n.y, false); // le gisement de minerai : un simple rocher (les pépites, c'est pour les filons d'or, filons.js)
    if (n.type === 'bush') {
      const B = Art.baie(n), s = sprite('bush' + n.v, 52, 44, c => {
        ell(c, 26, 38, 22, 6, 'rgba(0,0,0,0.22)');
        circ(c, 16, 26, 13, B.f[0]); circ(c, 34, 26, 14, B.f[1]); circ(c, 25, 18, 14, B.f[2]);
        circ(c, 20, 14, 6, 'rgba(120,200,110,0.45)');
        B.pts.forEach(([bx, by]) => { if (B.grappe) { circ(c, bx - 1.7, by + 1, B.r * 0.72, B.c2); circ(c, bx + 1.7, by + 1, B.r * 0.72, B.c2); circ(c, bx, by - 1.4, B.r * 0.72, B.col); } else circ(c, bx, by, B.r, B.col); circ(c, bx - B.r * 0.3, by - B.r * 0.4, B.r * 0.3, B.lum); });
      });
      g.drawImage(s, x - 26, y - 30);
    } else if (n.type === 'game') {
      const s = sprite('game', 60, 44, c => {
        ell(c, 30, 38, 24, 6, 'rgba(0,0,0,0.18)');
        c.strokeStyle = '#c9b45a'; c.lineWidth = 2.5; c.lineCap = 'round';
        for (let i = 0; i < 14; i++) { const bx = 8 + i * 3.4; c.strokeStyle = i % 2 ? '#c9b45a' : '#8aa040'; c.beginPath(); c.moveTo(bx, 38); c.quadraticCurveTo(bx + (i % 3 - 1) * 4, 22, bx + (i % 3 - 1) * 7, 10 + (i % 4) * 3); c.stroke(); }
      });
      g.drawImage(s, x - 30, y - 30);
      // un lapin qui pointe le museau
      const b = Math.max(0, Math.sin(t * 1.3 + n.x)) * 5;
      ell(g, x + 14, y + 2 - b, 5, 4, '#b89a78'); ell(g, x + 12, y - 5 - b, 1.6, 4.5, '#b89a78'); ell(g, x + 16, y - 5 - b, 1.6, 4.5, '#a88a68'); circ(g, x + 16, y + 1 - b, 0.9, '#221');
    }
  };
  const CHEST_COL = { savoir: ['#3a6aa8', '#28508a', '#5a8ac8', '#9ad0ff'], butin: ['#6a4a2a', '#4a321a', '#86603a', '#b8bcc8'], vivres: ['#6f8a3a', '#566c2a', '#87a548', '#f4ead0'], precieux: ['#b8bcc8', '#8a8e9a', '#d4d8e4', '#e8c84a'], magique: ['#6a3fa8', '#4c2a80', '#8556c8', '#7dffea'] };
  Art.chest = function (g, x, y, open, kind) {
    const C = CHEST_COL[kind] || ['#8a5a2a', '#6a421c', '#a06a30', '#e8c84a'];
    Art.shadow(g, x, y + 8, 16);
    rrect(g, x - 14, y - 8, 28, 16, 2, C[0]); g.fillStyle = C[1]; g.fillRect(x - 14, y + 2, 28, 6);
    if (open) { poly(g, [x - 14, y - 8, x + 14, y - 8, x + 12, y - 20, x - 12, y - 20], '#5a3818'); ell(g, x, y - 8, 10, 3, '#f0c040'); }
    else { rrect(g, x - 15, y - 16, 30, 10, 4, C[2]); }
    g.fillStyle = C[3]; g.fillRect(x - 2, y - 9, 4, 6); g.fillRect(x - 15, y - 9, 3, 17); g.fillRect(x + 12, y - 9, 3, 17);
  };
  Art.portal = function (g, x, y, t, active) {
    Art.shadow(g, x, y + 6, 30);
    poly(g, [x - 30, y + 6, x - 26, y - 46, x - 14, y - 52, x - 14, y + 6], '#4a4652'); poly(g, [x + 30, y + 6, x + 26, y - 46, x + 14, y - 52, x + 14, y + 6], '#3c3844');
    poly(g, [x - 26, y - 46, x, y - 64, x + 26, y - 46, x + 14, y - 44, x, y - 54, x - 14, y - 44], '#55505e');
    const a = 0.35 + Math.sin(t * 2) * 0.12 + (active ? 0.4 : 0);
    ell(g, x, y - 22, 13, 26, `rgba(170,60,220,${a})`); ell(g, x, y - 22, 7, 17, `rgba(255,140,255,${a * 0.8})`);
    g.fillStyle = '#c070ff'; [[-22, -30], [22, -18], [-21, -8]].forEach(([dx, dy]) => g.fillRect(x + dx - 1.5, y + dy, 3, 5));
  };

  // ---------- bâtiments ----------
  Art.building = function (g, b, t, lit) {
    const x = b.tx * T, y = b.ty * T, w = b.w * T, h = b.h * T, cx = x + w / 2, by = y + h;
    if (b.type === 'hut' || b.type === 'chief') {
      const big = b.type === 'chief', lv = [0, 2, 3][Math.min(2, b.up || 0)], key = b.type + (b.variant || 0) + '-' + lv;
      const sw = big ? 150 : 110, sh = big ? 150 : 118;
      const s = sprite(key, sw, sh, c => {
        const m = sw / 2, base = sh - 10, wr = big ? 52 : 36, wh = big ? 40 : 30;
        ell(c, m, base, wr + 12, 12, 'rgba(0,0,0,0.25)');
        rrect(c, m - wr, base - wh, wr * 2, wh, lv ? 4 : 8, ['#9a7a4c', '#a8703a', '#8d8981', '#8a909e'][lv]); c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(m, base - wh, wr - 2, wh - 2);
        c.strokeStyle = 'rgba(70,48,24,0.5)'; c.lineWidth = 2; for (let i = -wr + 8; i < wr; i += 11) { c.beginPath(); c.moveTo(m + i, base - wh + 4); c.lineTo(m + i + 2, base - 3); c.stroke(); }
        // porte tordue
        poly(c, [m - 10, base, m - 9, base - (big ? 28 : 22), m + 8, base - (big ? 26 : 23), m + 10, base], '#3a2412');
        // toit de chaume
        const rt = base - wh - (big ? 62 : 50); let cols = big ? ['#c9a040', '#a8802c', '#e0b850'] : [['#b8964a', '#967430', '#d0ae5c'], ['#a89850', '#867634', '#c4b060'], ['#b88a52', '#946a34', '#d2a468']][(b.variant || 0) % 3];
        if (lv === 3) cols = ['#7c8698', '#5a6474', '#b4bece']; else if (lv === 2) cols = ['#5d6878', '#48525f', '#8a96a8']; else if (lv === 1) cols = ['#8a5a34', '#6e4526', '#a87448'];
        if (lv) { c.strokeStyle = lv >= 2 ? 'rgba(30,30,28,0.5)' : 'rgba(60,36,14,0.6)'; c.lineWidth = 1.5; for (let y = base - wh + 8; y < base - 2; y += 8) { c.beginPath(); c.moveTo(m - wr + 2, y); c.lineTo(m + wr - 2, y); c.stroke(); if (lv >= 2) for (let x = m - wr + (((y / 8) | 0) % 2 ? 8 : 16); x < m + wr - 4; x += 16) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 8); c.stroke(); } } c.fillStyle = lv >= 2 ? '#6a665e' : '#7a4a2a'; c.fillRect(m + wr - 16, base - wh - 34, 10, 30); c.fillStyle = '#3a3a3a'; c.fillRect(m + wr - 18, base - wh - 37, 14, 5); }
        poly(c, [m - wr - 12, base - wh + 6, m + wr + 12, base - wh + 6, m + 6, rt, m - 6, rt], cols[0]);
        poly(c, [m, base - wh + 6, m + wr + 12, base - wh + 6, m + 6, rt, m, rt], cols[1]);
        c.strokeStyle = cols[2]; c.lineWidth = 2; for (let i = 0; i < 9; i++) { const fx = m - wr - 6 + i * (wr * 2 + 12) / 8; c.beginPath(); c.moveTo(fx, base - wh + 5); c.lineTo(m + (fx - m) * 0.15, rt + 6); c.stroke(); }
        c.fillStyle = '#5a3d22'; c.fillRect(m - 3, rt - 10, 3, 14); c.fillRect(m + 2, rt - 8, 3, 12);
        if (big) { // crâne à cornes et bannière
          circ(c, m, base - wh - 8, 9, '#eee6d0'); circ(c, m - 3, base - wh - 9, 2, '#221'); circ(c, m + 3, base - wh - 9, 2, '#221');
          c.strokeStyle = '#eee6d0'; c.lineWidth = 3; c.beginPath(); c.moveTo(m - 8, base - wh - 12); c.quadraticCurveTo(m - 20, base - wh - 14, m - 20, base - wh - 26); c.moveTo(m + 8, base - wh - 12); c.quadraticCurveTo(m + 20, base - wh - 14, m + 20, base - wh - 26); c.stroke();
          c.fillStyle = '#5a3d22'; c.fillRect(m + wr + 2, base - wh - 40, 3, wh + 40); poly(c, [m + wr + 5, base - wh - 40, m + wr + 22, base - wh - 34, m + wr + 5, base - wh - 22], '#b8322a');
        } else if (lv) { c.fillStyle = '#ffd86b'; c.fillRect(m + wr - 22, base - wh + 8, 13, 11); c.strokeStyle = '#3a2412'; c.lineWidth = 2; c.strokeRect(m + wr - 22, base - wh + 8, 13, 11); c.beginPath(); c.moveTo(m + wr - 15.5, base - wh + 8); c.lineTo(m + wr - 15.5, base - wh + 19); c.stroke(); if (lv >= 2) { c.fillStyle = '#ffd86b'; c.fillRect(m - wr + 8, base - wh + 8, 11, 11); c.strokeRect(m - wr + 8, base - wh + 8, 11, 11); } }
        else { c.fillStyle = '#3a2412'; c.fillRect(m + wr - 18, base - wh + 8, 9, 8); }
      });
      g.drawImage(s, cx - sw / 2, by - sh + 14);
      if (lit) { ell(g, cx, by - 6, 9, 12, 'rgba(255,190,90,0.5)'); }
    } else if (b.type === 'stock' || b.type === 'depot') {
      const s = sprite('stock', 110, 70, c => {
        ell(c, 55, 60, 50, 9, 'rgba(0,0,0,0.25)');
        for (let i = 0; i < 3; i++) { ell(c, 22 + i * 4, 52 - i * 9, 18, 6, '#6b4a2a'); circ(c, 6 + i * 4, 52 - i * 9, 5.5, '#c9a56b'); }
        rrect(c, 44, 30, 26, 26, 3, '#a87a40'); c.strokeStyle = '#6a4a20'; c.lineWidth = 2; c.strokeRect(46, 32, 22, 22); c.beginPath(); c.moveTo(46, 32); c.lineTo(68, 54); c.stroke();
        rrect(c, 76, 26, 22, 32, 8, '#8a5a2a'); c.fillStyle = '#b8bcc8'; c.fillRect(76, 34, 22, 3); c.fillRect(76, 48, 22, 3);
        ell(c, 58, 28, 10, 5, '#d8264a'); circ(c, 54, 26, 3, '#f04a6a'); circ(c, 61, 25, 3, '#c01a3a');
      });
      g.drawImage(s, cx - 55, by - 62);
    } else if (b.type === 'tower') {
      const tl = Math.min(2, b.up || 0), s = sprite('tower' + tl, 90, 150, c => {
        ell(c, 45, 138, 34, 9, 'rgba(0,0,0,0.25)');
        c.strokeStyle = '#5a3d22'; c.lineWidth = 6; c.lineCap = 'round';
        [[20, 136, 28, 50], [70, 136, 62, 50], [20, 136, 62, 92], [70, 136, 28, 92]].forEach(([a, b2, d, e], i) => { c.lineWidth = i < 2 ? 6 : 3; c.beginPath(); c.moveTo(a, b2); c.lineTo(d, e); c.stroke(); });
        rrect(c, 16, 34, 58, 22, 3, '#8a6234'); c.fillStyle = '#6b4a2a'; for (let i = 0; i < 5; i++) c.fillRect(18 + i * 12, 26, 7, 10);
        poly(c, [10, 22, 80, 22, 45, 0], tl ? '#b8322a' : '#a8802c'); poly(c, [45, 22, 80, 22, 45, 0], tl ? '#8a2218' : '#8a6820');
        if (tl) { poly(c, [18, 138, 24, 74, 66, 74, 72, 138], '#8d8981'); poly(c, [45, 138, 45, 74, 66, 74, 72, 138], '#74706a'); c.strokeStyle = 'rgba(30,30,28,0.45)'; c.lineWidth = 1.5; for (let y = 86; y < 136; y += 12) { c.beginPath(); c.moveTo(21, y); c.lineTo(69, y); c.stroke(); } rrect(c, 38, 112, 14, 26, 6, '#2a1c12'); }
        if (tl > 1) { c.fillStyle = '#e8c84a'; c.fillRect(14, 52, 62, 4); c.fillRect(14, 34, 62, 3); c.fillStyle = '#5a3d22'; c.fillRect(44, -2, 3, 12); poly(c, [47, 0, 62, 5, 47, 10], '#e8c84a'); [[12, 60], [72, 60]].forEach(([x, y]) => poly(c, [x - 4, y, x, y - 12, x + 4, y], '#b8bcc8')); }
      });
      g.drawImage(s, cx - 45, by - 138);
    } else if (b.type === 'totem') {
      const s = sprite('totem', 50, 100, c => {
        ell(c, 25, 92, 16, 5, 'rgba(0,0,0,0.25)');
        rrect(c, 15, 14, 20, 78, 5, '#7a4a26'); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(26, 14, 9, 78);
        [[24, '#d8402a'], [50, '#e8c84a'], [74, '#4aa8d8']].forEach(([yy, col]) => { c.fillStyle = col; c.fillRect(15, yy - 9, 20, 4); circ(c, 20, yy, 3, '#fff'); circ(c, 30, yy, 3, '#fff'); circ(c, 20, yy, 1.4, '#111'); circ(c, 30, yy, 1.4, '#111'); c.fillStyle = '#221'; c.fillRect(19, yy + 6, 12, 3); });
        poly(c, [15, 18, 2, 8, 15, 28], '#e8e0c8'); poly(c, [35, 18, 48, 8, 35, 28], '#e8e0c8');
      });
      g.drawImage(s, cx - 25, by - 96);
    } else if (b.type === 'marmite') {
      const s = sprite('marmite', 60, 60, c => {
        ell(c, 30, 52, 22, 6, 'rgba(0,0,0,0.25)');
        c.strokeStyle = '#5a3d22'; c.lineWidth = 4; c.beginPath(); c.moveTo(8, 54); c.lineTo(30, 4); c.lineTo(52, 54); c.stroke();
        ell(c, 30, 38, 18, 14, '#2e2e34'); ell(c, 30, 28, 17, 5, '#4a4a52'); ell(c, 30, 28, 14, 3.5, '#8ab040');
      });
      g.drawImage(s, cx - 30, by - 56);
      for (let i = 0; i < 3; i++) { const p = (t * 0.5 + i / 3) % 1; circ(g, cx - 6 + i * 6 + Math.sin(t * 2 + i) * 3, by - 30 - p * 22, 3 + p * 4, `rgba(230,240,220,${0.4 * (1 - p)})`); }
    } else if (b.type === 'fire') {
      const fx = cx, fy = by - T / 2;
      Art.shadow(g, fx, fy + 6, 26);
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; ell(g, fx + Math.cos(a) * 22, fy + 4 + Math.sin(a) * 10, 5, 4, i % 2 ? '#8a867c' : '#74706a'); }
      line(g, fx - 16, fy + 4, fx + 12, fy - 6, '#5a3d22', 6); line(g, fx + 16, fy + 4, fx - 12, fy - 6, '#4a3018', 6); line(g, fx, fy + 6, fx, fy - 10, '#5a3d22', 5);
      if (lit) {
        for (let i = 0; i < 5; i++) {
          const ph = t * 7 + i * 1.7, hh = 30 + Math.sin(ph) * 8 + (i === 2 ? 16 : 0), xx = fx + (i - 2) * 6 + Math.sin(ph * 0.7) * 2;
          g.fillStyle = i % 2 ? '#ff8a1e' : '#ffb432'; g.beginPath(); g.moveTo(xx - 8, fy); g.quadraticCurveTo(xx - 9, fy - hh * 0.5, xx + Math.sin(ph) * 4, fy - hh); g.quadraticCurveTo(xx + 9, fy - hh * 0.5, xx + 8, fy); g.fill();
        }
        g.fillStyle = '#fff2a0'; g.beginPath(); g.moveTo(fx - 6, fy); g.quadraticCurveTo(fx - 5, fy - 14, fx + Math.sin(t * 9) * 2, fy - 24 - Math.sin(t * 6) * 4); g.quadraticCurveTo(fx + 5, fy - 14, fx + 6, fy); g.fill();
      }
    }
  };

  // ---------- gobelins ----------
  const JOBCOL = { aucun: '#8a7a5a', cueilleur: '#c85a7a', chasseur: '#6a8a3a', bucheron: '#b8622a', mineur: '#6a7a8a', forgeron: '#4a4a52', arcier: '#3f7a6a', tanneur: '#9a6a3a', guerisseur: '#d8d4be', garde: '#a8322a', chef: '#6a3fa8' };
  Art.JOBCOL = JOBCOL;
  // o : {x,y,face,t,moving,step,sex,hue,job,pose,chief,equip,atk,alpha}
  Art.goblin = function (g, o) {
    const t = o.t, face = o.face < 0 ? -1 : 1, sw = o.moving ? Math.sin(o.step * TAU) : 0;
    let bob = o.moving ? Math.abs(sw) * 1.6 : Math.sin(t * 2.6 + o.hue) * 0.7, lean = 0, armA = 0.5 + sw * 0.7, armB = 0.5 - sw * 0.7, hop = 0;
    const pose = o.pose;
    if (pose === 'dance') { hop = Math.abs(Math.sin(t * 6 + o.hue)) * 6; lean = Math.sin(t * 6 + o.hue) * 0.22; armA = -2.4 + Math.sin(t * 12) * 0.4; armB = -2.4 - Math.sin(t * 12) * 0.4; }
    else if (pose === 'drink') { armA = -1.9 + Math.sin(t * 1.6 + o.hue) * 0.5; lean = Math.sin(t * 1.6 + o.hue) * 0.08; }
    else if (pose === 'drum') { armA = -0.4 + Math.sin(t * 14) * 0.9; armB = -0.4 - Math.sin(t * 14) * 0.9; }
    else if (pose === 'work') { armA = 1.75 - Math.cos(t * 8) * 0.9; bob += Math.max(0, -Math.cos(t * 8)) * 1.5; } // le bras monte devant, puis s'abat vers l'avant
    else if (pose === 'heal') { armA = 2.1 + Math.sin(t * 3 + o.hue) * 0.12; armB = 2.3 - Math.sin(t * 3 + o.hue) * 0.12; hop = 1 + Math.sin(t * 2.2) * 1; }
    else if (pose === 'cheer') { hop = Math.abs(Math.sin(t * 8)) * 5; armA = -2.5; armB = -2.5; }
    if (o.atk > 0) armA = -2.2 + (1 - o.atk) * 3.0;
    g.save(); g.translate(o.x, o.y);
    if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    Art.shadow(g, 0, 1, 11);
    g.translate(0, -hop); g.rotate(lean); g.scale(face * (o.s || 1), o.s || 1);
    const skin = `hsl(${o.hue},${o.sat || 46}%,${(o.lum || 44) + 6}%)`, skinD = `hsl(${o.hue},${o.sat || 46}%,${(o.lum || 44) - 5}%)`; // un vert plus doux
    const cloth = o.chief ? JOBCOL.chef : JOBCOL[o.job] || JOBCOL.aucun, by = -8 - bob;
    if (o.chief) poly(g, [-7, by - 12, 5, by - 12, 9, by + 6 + sw, -11, by + 7 - sw], '#b8322a');
    // jambes
    line(g, -3.5, by, -3.5 + sw * 3.5, 0, skinD, 4); line(g, 3.5, by, 3.5 - sw * 3.5, 0, skinD, 4);
    // bras arrière
    const sh = by - 10; line(g, -5, sh, -5 + Math.sin(armB) * 9, sh + Math.cos(armB) * 9, skinD, 3.5);
    // corps
    if (o.sex === 'f') { poly(g, [-6, by - 13, 6, by - 13, 9.5, by + 3, -9.5, by + 3], cloth); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-8, by, 16.5, 2); }
    else { rrect(g, -7, by - 13, 14, 15, 4, cloth); g.fillStyle = '#3a2412'; g.fillRect(-7, by - 3, 14, 2.5); }
    if (o.equip && o.equip.armure) { rrect(g, -7.5, by - 13, 15, 10, 3, '#8a5a2a'); g.fillStyle = '#c9a56b'; g.fillRect(-1, by - 12, 2, 8); }
    // tête : bien ronde, contour foncé, grandes oreilles à l'horizontale avec l'intérieur rose
    const hy = by - 20, lum = (o.lum || 44) + 6, sat = o.sat || 46, skinL = `hsl(${o.hue},${sat}%,${lum + 9}%)`, skinDD = `hsl(${o.hue},${sat - 6}%,${lum - 30}%)`, skinD2 = `hsl(${o.hue},${sat}%,${lum - 14}%)`;
    const job = o.chief ? 'chef' : o.job, lively = o.moving || pose === 'dance', OW = 1.5;
    const ear = (dir, w) => {
      const bx = dir * 8; g.beginPath(); g.moveTo(bx, hy - 4.6); g.quadraticCurveTo(bx + dir * 5.5, hy - 9.5, bx + dir * 11, hy - 5.6 + w); g.quadraticCurveTo(bx + dir * 7, hy + 4, bx - dir, hy + 3.8); g.closePath();
      const eg = g.createLinearGradient(bx + dir * 1.6, 0, bx + dir * 7, 0); eg.addColorStop(0, `hsl(${o.hue},${sat}%,${lum - 24}%)`); eg.addColorStop(0.3, `hsl(${o.hue},${sat}%,${lum - 15}%)`); eg.addColorStop(1, skin); g.fillStyle = eg; g.fill();
      g.fillStyle = '#d98f8f'; g.beginPath(); g.moveTo(bx + dir * 3.6, hy - 3.4); g.quadraticCurveTo(bx + dir * 6.2, hy - 6.4, bx + dir * 8.8, hy - 4.6 + w); g.quadraticCurveTo(bx + dir * 6.2, hy + 1.2, bx + dir * 3.6, hy + 1.6); g.closePath(); g.fill();
    };
    const hc = ['#2a1a3a', '#7a2a1a', '#1a1a1a', '#e8e0c8'][Math.floor(o.hue * 7) % 4];
    if (o.sex === 'f' && !o.chief) ell(g, -10, hy + Math.sin(t * 5 + o.hue) * (lively ? 2 : 0.5), 3.8, 7.5, hc); // queue de cheval, derrière la tête
    ear(-1, Math.sin(t * 3 + o.hue) * 0.8); ear(1, Math.sin(t * 3 + o.hue + 1) * 0.8);
    g.beginPath(); g.ellipse(0, hy, 9.8, 9, 0, 0, TAU); g.fillStyle = skin; g.fill();
    if (o.sex === 'f' && !o.chief) { ell(g, -1, hy - 6.6, 8.4, 4.2, hc); circ(g, 10.4, hy + 5.4, 1.5, '#e8c84a'); }
    g.save(); g.translate(0, hy); g.scale(1.1, 1.06); g.translate(0, -hy + 0.4);
    // --- couvre-chef ---
    const dome = (col, r, dy) => { g.fillStyle = col; g.beginPath(); g.arc(0, hy + (dy || -2.6), r || 9.2, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.14)'; g.beginPath(); g.arc(0, hy + (dy || -2.6), r || 9.2, Math.PI * 1.5, 0); g.lineTo(0, hy + (dy || -2.6)); g.closePath(); g.fill(); };
    const feather = (x, y, rot, len, col, tip) => { g.save(); g.translate(x, y); g.rotate(rot); ell(g, 0, -len * 0.55, len * 0.19, len * 0.52, col); g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(0, -len * 0.55, len * 0.19, len * 0.52, 0, -Math.PI / 2, Math.PI / 2); g.fill(); if (tip) ell(g, 0, -len * 0.92, len * 0.13, len * 0.16, tip); line(g, 0, 1, 0, -len * 1.02, 'rgba(255,255,255,0.75)', 0.7); g.restore(); };
    if (job === 'chef') {
      const swy = Math.sin(t * 2.2) * 0.05;
      feather(-5.2, hy - 7.5, -0.42 + swy, 13.5, '#e8c84a', '#b8622a'); feather(5.2, hy - 7.5, 0.42 + swy, 13.5, '#e8c84a', '#b8622a'); feather(0, hy - 8, swy, 18, '#d8402a', '#2a1a12');
      rrect(g, -9, hy - 9.6, 18, 4, 1.6, '#6b4424'); g.fillStyle = '#e8c84a'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 2.5 - 1.1, hy - 6.1); g.lineTo(i * 2.5, hy - 8.8); g.lineTo(i * 2.5 + 1.1, hy - 6.1); g.fill(); }
      circ(g, 0, hy - 7.6, 1.9, '#2a1a12'); circ(g, 0, hy - 7.6, 1.3, '#7dffea');
    } else if (job === 'garde') {
      const m = o.elite ? '#e8c84a' : '#b8bcc8', md = o.elite ? '#b8922a' : '#8a8e98';
      if (o.elite) { g.fillStyle = '#d8402a'; g.beginPath(); g.moveTo(0, hy - 12); g.quadraticCurveTo(-3, hy - 24, -11, hy - 17 + Math.sin(t * 4) * 1.2); g.quadraticCurveTo(-5, hy - 16, -1, hy - 11); g.fill(); }
      dome(m, 9.6, -2.4); poly(g, [-1.7, hy - 11.5, 0, hy - 17, 1.7, hy - 11.5], m); rrect(g, -10.4, hy - 4, 20.8, 2.8, 1.3, md); rrect(g, 5.2, hy - 2.4, 1.9, 5, 0.9, md);
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.3; g.beginPath(); g.arc(0, hy - 2.4, 7.2, Math.PI * 1.15, Math.PI * 1.42); g.stroke(); [-6, 0, 6].forEach(x => circ(g, x, hy - 2.6, 0.7, '#5a5e68'));
    } else if (job === 'bucheron') { // tuque à pompon
      g.fillStyle = '#c8322a'; g.beginPath(); g.moveTo(-9, hy - 4.5); g.quadraticCurveTo(-9, hy - 15, 0, hy - 15.5); g.quadraticCurveTo(9, hy - 14, 9, hy - 4.5); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-3, hy - 15); g.quadraticCurveTo(-9, hy - 18, -11.5, hy - 12); g.lineTo(-7, hy - 10.5); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(-7, hy - 11.5, 14, 1.4); circ(g, -11.5, hy - 10.5, 2.9, '#f4ead0'); rrect(g, -9.6, hy - 7.4, 19.2, 3.8, 1.8, '#f4ead0'); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = -7; x < 9; x += 3) g.fillRect(x, hy - 7.2, 0.9, 3.4);
    } else if (job === 'mineur') { // casque à lanterne
      dome('#8a7648', 9.3, -2.8); rrect(g, -10, hy - 4.4, 20, 2.4, 1.2, '#6a5a36'); circ(g, 5.6, hy - 9, 4.6, 'rgba(255,227,107,' + (0.2 + Math.sin(t * 7 + o.hue) * 0.06) + ')'); rrect(g, 3.4, hy - 11.4, 4.6, 4.8, 1.2, '#5a5e68'); circ(g, 5.7, hy - 9, 1.6, '#ffe36b');
    } else if (job === 'chasseur') { // chapeau pointu à plume
      feather(-4.5, hy - 10, -1.0, 11, '#d8402a', '#f4ead0');
      poly(g, [-9.5, hy - 5, 10, hy - 6.4, 4, hy - 14.5, -5.5, hy - 11.5], '#4f8230'); poly(g, [0, hy - 5.6, 10, hy - 6.4, 4, hy - 14.5], 'rgba(0,0,0,0.14)'); poly(g, [-10, hy - 5.2, 13.5, hy - 7, 9, hy - 3.8, -9.5, hy - 3.4], '#3a6220');
    } else if (job === 'cueilleur') { // chapeau de paille
      rrect(g, -6.2, hy - 12.6, 12.4, 8, 3.4, '#e8c870'); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(0, hy - 12, 6, 7); g.fillStyle = '#c85a7a'; g.fillRect(-6.2, hy - 7.8, 12.4, 2); ell(g, 0, hy - 5.2, 13.5, 3, '#d8b458'); ell(g, 0, hy - 5.8, 12.5, 2, '#eccf80'); circ(g, -4, hy - 7.2, 1.7, '#fff'); circ(g, -4, hy - 7.2, 0.7, '#e8b030');
    } else if (job === 'forgeron') { // bandana et lunettes sur le front
      dome('#3c3c46', 9, -3.2); poly(g, [-8.5, hy - 5, -13.5, hy - 7.5, -10.5, hy - 3.5], '#3c3c46'); poly(g, [-8.5, hy - 4.5, -13, hy - 2, -9.5, hy - 2.4], '#2c2c34');
      line(g, -8.6, hy - 6, 8.6, hy - 6, '#6b4424', 1.6); circ(g, 1.6, hy - 6.4, 2.5, '#5a5e68'); circ(g, 6.4, hy - 6.2, 2.4, '#5a5e68'); circ(g, 1.6, hy - 6.4, 1.6, '#9adcf0'); circ(g, 6.4, hy - 6.2, 1.5, '#9adcf0'); circ(g, 1.1, hy - 6.9, 0.5, '#fff');
    } else if (job === 'arcier') { // bandeau à plume
      feather(-5.5, hy - 7.5, -0.5, 12, '#f4ead0', '#3f7a6a'); rrect(g, -9, hy - 9, 18, 3, 1.3, '#3f7a6a'); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-8, hy - 8.2, 16, 0.9);
    } else if (job === 'tanneur') { // béret de cuir
      ell(g, -1.2, hy - 8.2, 10, 4.4, '#7a5230'); ell(g, -2.4, hy - 9.4, 7, 2.5, '#96683c'); line(g, -1.5, hy - 12.2, -1, hy - 14, '#5a3d22', 1.5); g.fillStyle = '#5a3d22'; g.fillRect(-8.6, hy - 6, 17.2, 1.5);
    } else if (job === 'guerisseur') { // coiffe blanche à croix verte
      dome('#f2eee2', 9.2, -2.8); rrect(g, -9.6, hy - 4.6, 19.2, 2.4, 1.2, '#d8d2c0'); g.fillStyle = '#3aa84a'; g.fillRect(2.4, hy - 11, 1.9, 5.4); g.fillRect(0.6, hy - 9.3, 5.5, 1.9);
    } else if (job === 'aucun') { // casquette de toile
      dome('#9a8a66', 9, -3.2); poly(g, [3.5, hy - 4, 13.5, hy - 3, 12.5, hy - 1.4, 3.5, hy - 1.8], '#6e6044'); circ(g, 0, hy - 12.2, 1.2, '#6e6044'); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(-8.8, hy - 4.2, 12.5, 1.2);
    }
    g.restore();
    // --- visage, de face : gros yeux ronds à iris orange, petit nez, joues roses, sourire à une canine ---
    const angry = o.atk > 0 || pose === 'work', happy = pose === 'dance' || pose === 'drink' || pose === 'cheer';
    const fx = 1.3, ey = hy - 0.4, blink = pose === 'heal' || (t * 0.7 + o.hue) % 3 < 0.09;
    ell(g, fx - 6.4, hy + 4.2, 2.5, 1.6, 'rgba(214,128,118,0.5)'); ell(g, fx + 6.4, hy + 4.2, 2.5, 1.6, 'rgba(214,128,118,0.5)');
    [-4.1, 4.1].forEach(dx => {
      const cx = fx + dx;
      if (blink) { g.strokeStyle = skinDD; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.arc(cx, ey - 0.6, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); return; }
      circ(g, cx, ey, 3.15, skinD2); circ(g, cx, ey, 2.85, '#fffdf4'); circ(g, cx + 0.2, ey + 0.1, 2.15, '#e8962a'); circ(g, cx + 0.2, ey + 0.1, 1.3, '#1c1008'); circ(g, cx - 0.6, ey - 0.8, 0.62, '#fff');
    });
    g.lineCap = 'round';
    if (angry) { line(g, fx - 6.8, hy - 5.8, fx - 1.8, hy - 4.2, skinDD, 1.6); line(g, fx + 6.8, hy - 5.8, fx + 1.8, hy - 4.2, skinDD, 1.6); }
    else if (happy) { line(g, fx - 6.4, hy - 6, fx - 2, hy - 6.4, skinDD, 1.5); line(g, fx + 6.4, hy - 6, fx + 2, hy - 6.4, skinDD, 1.5); }
    else { line(g, fx - 6.6, hy - 5.4, fx - 1.8, hy - 5, skinDD, 1.6); line(g, fx + 6.6, hy - 5.4, fx + 1.8, hy - 5, skinDD, 1.6); }
    g.beginPath(); g.ellipse(fx, hy + 3.5, 2.2, 1.5, 0, 0, TAU); g.fillStyle = skinL; g.fill();
    if (happy) { ell(g, fx, hy + 6.6, 3.2, 2, '#4a1420'); ell(g, fx + 0.3, hy + 7.4, 1.8, 0.9, '#e8687a'); poly(g, [fx + 1, hy + 5.2, fx + 1.9, hy + 7, fx + 2.8, hy + 5.4], '#fff2c8'); }
    else {
      g.strokeStyle = skinDD; g.lineWidth = 1.4; g.beginPath(); g.moveTo(fx - 3.3, hy + 5.9); if (angry) g.quadraticCurveTo(fx, hy + 5.4, fx + 3.3, hy + 6.3); else g.quadraticCurveTo(fx, hy + 7.9, fx + 3.3, hy + 5.9); g.stroke();
      poly(g, [fx + 1.1, hy + 6.9, fx + 1.9, hy + 4.9, fx + 2.8, hy + 6.5], '#fff2c8');
    }
    // bras avant + outil
    const hx = 5 + Math.sin(armA) * 9, hyy = sh + Math.cos(armA) * 9;
    line(g, 5, sh, hx, hyy, skin, 3.5);
    g.save(); g.translate(hx, hyy); g.rotate(pose === 'work' ? 2.3 - armA * 1.05 : armA - 0.5);
    const tool = o.tool;
    if (tool === 'hache') { line(g, 0, 4, 0, -12, '#6b4a2a', 2.5); poly(g, [0, -13, 8, -15, 9, -8, 0, -8], '#b8bcc8'); }
    else if (tool === 'pioche') { line(g, 0, 4, 0, -13, '#6b4a2a', 2.5); g.strokeStyle = '#8a8e98'; g.lineWidth = 3; g.beginPath(); g.moveTo(-8, -9); g.quadraticCurveTo(0, -16, 8, -9); g.stroke(); }
    else if (tool === 'marteau') { line(g, 0, 4, 0, -10, '#6b4a2a', 2.5); rrect(g, -5, -15, 10, 6, 1, '#5a5e68'); }
    else if (tool === 'epee') { line(g, 0, 2, 0, -17, '#d8dce8', 3); line(g, -4, -2, 4, -2, '#8a6234', 2.5); }
    else if (tool === 'lance') { line(g, 0, 10, 0, -22, '#6b4a2a', 2.2); poly(g, [-3, -21, 0, -29, 3, -21], '#b8bcc8'); }
    else if (tool === 'arc') { g.strokeStyle = '#8a5a2a'; g.lineWidth = 2.5; g.beginPath(); g.arc(-2, -3, 11, -1.2, 1.2); g.stroke(); line(g, 2, -13, 2, 7, '#eee', 0.8); }
    else if (tool === 'panier') { ell(g, 0, 5, 6, 4.5, '#c9a56b'); circ(g, -2, 3, 2, '#d8264a'); circ(g, 2, 3.5, 2, '#d8264a'); }
    else if (tool === 'chope') { rrect(g, -3.5, -6, 7, 8, 1.5, '#8a5a2a'); g.fillStyle = '#fff6d8'; g.fillRect(-3.5, -7.5, 7, 2.5); }
    else if (tool === 'baton') { line(g, 0, 10, 0, -20, '#6b4a2a', 2.5); circ(g, 0, -23, 4.5, o.glow || '#b070ff'); circ(g, -1, -24, 1.6, '#fff'); }
    else if (tool === 'aiguille') { line(g, 0, 2, 0, -8, '#d8dce8', 1.2); rrect(g, -6, 2, 12, 7, 2, '#9a6a3a'); }
    else if (tool === 'couteau') { line(g, 0, 2, 0, -7, '#6b4a2a', 2.5); poly(g, [-1.5, -7, 1.5, -7, 0, -15], '#d8dce8'); }
    g.restore();
    if (pose === 'drum') { ell(g, 9, by - 2, 7, 4, '#eee6d0'); rrect(g, 2, by - 2, 14, 9, 2, '#8a5a2a'); }
    if (o.carry) { if (o.carry === 'bois') { ell(g, -7, by - 13, 9, 3.5, '#6b4a2a'); circ(g, -15, by - 13, 3.2, '#c9a56b'); } else rrect(g, -12, by - 14, 9, 10, 3, o.carry === 'minerai' ? '#7d7a72' : o.carry === 'cuir' || o.carry === 'chasse' ? '#9a6a3a' : '#c9a56b'); }
    g.restore();
  };

  // ---------- humanoïdes (humains, démons, squelettes, visiteurs) ----------
  // o : {x,y,face,t,moving,step,s,skin,tunic,hair,weapon,helmet,hat,hood,armor,cape,horns,beard,ears,wings,legs,atk}
  Art.humanoid = function (g, o) {
    const face = o.face < 0 ? -1 : 1, sw = o.moving ? Math.sin(o.step * TAU) : 0, s = o.s || 1, t = o.t;
    const bob = o.moving ? Math.abs(sw) * 1.5 : Math.sin(t * 2.4) * 0.6;
    g.save(); g.translate(o.x, o.y); Art.shadow(g, 0, 1, 12 * s); g.scale(face * s, s);
    const by = -13 - bob, hy = by - 24;
    if (o.wings) { const f = Math.sin(t * 10) * 0.3; poly(g, [-4, by - 14, -20, by - 26 - f * 20, -16, by - 6], o.wings); poly(g, [-2, by - 14, 10, by - 30 - f * 20, 2, by - 8], o.wings); }
    if (o.cape) poly(g, [-7, by - 17, 5, by - 17, 8, by + 8 + sw, -12, by + 9 - sw], o.cape);
    line(g, -3.5, by, -3.5 + sw * 4.5, 0, o.legs || '#3a3026', 4.5); line(g, 3.5, by, 3.5 - sw * 4.5, 0, o.legs || '#3a3026', 4.5);
    const sh = by - 14; line(g, -6, sh, -6 - sw * 4, sh + 11, o.sleeve || o.tunic, 4);
    if (o.robe) poly(g, [-7, by - 18, 7, by - 18, 10, by + 8, -10, by + 8], o.tunic); else rrect(g, -8, by - 18, 16, 20, 4, o.tunic);
    if (o.armor) { rrect(g, -8.5, by - 18, 17, 12, 3, '#c8ccd8'); g.fillStyle = '#8a8e98'; g.fillRect(-8.5, by - 8, 17, 2); }
    else { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-8, by - 4, 16, 2.5); }
    // tête : vraies oreilles, yeux expressifs, nez, bouche, crocs ou défenses, et des coiffes travaillées
    const dk = 'rgba(0,0,0,0.16)', ink = '#2a1a14';
    const earP = dir => {
      const bx = dir * 5; g.fillStyle = o.skin; g.beginPath(); g.moveTo(bx, hy - 3.4); g.quadraticCurveTo(bx + dir * 6.5, hy - 9.5, bx + dir * 13, hy - 9.5 + Math.sin(t * 3 + dir) * 0.8); g.quadraticCurveTo(bx + dir * 8, hy - 1, bx + dir, hy + 4); g.closePath(); g.fill();
      g.fillStyle = 'rgba(110,20,40,0.24)'; g.beginPath(); g.moveTo(bx + dir * 2.4, hy - 2); g.quadraticCurveTo(bx + dir * 6.2, hy - 6.6, bx + dir * 10, hy - 7.8); g.quadraticCurveTo(bx + dir * 6.5, hy - 1.6, bx + dir * 2.4, hy + 1.6); g.closePath(); g.fill();
    };
    const horn = dir => { g.fillStyle = o.horns; g.beginPath(); g.moveTo(dir * 3.2, hy - 6.6); g.quadraticCurveTo(dir * 12.5, hy - 8, dir * 9.2, hy - 19); g.quadraticCurveTo(dir * 7.4, hy - 11, dir * 6.6, hy - 5); g.closePath(); g.fill(); g.strokeStyle = dk; g.lineWidth = 1; g.beginPath(); g.moveTo(dir * 6, hy - 8.4); g.lineTo(dir * 8.8, hy - 9.4); g.moveTo(dir * 7.6, hy - 11.6); g.lineTo(dir * 9.8, hy - 12.6); g.stroke(); };
    const dome = (col, r, dy) => { g.fillStyle = col; g.beginPath(); g.arc(0, hy + dy, r, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = dk; g.beginPath(); g.arc(0, hy + dy, r, Math.PI * 1.5, 0); g.lineTo(0, hy + dy); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, hy + dy, r - 2.2, Math.PI * 1.15, Math.PI * 1.4); g.stroke(); };
    if (o.hair && o.longHair) { rrect(g, -9.6, hy - 6, 10, 23, 4.5, o.hair); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(-7.6, hy - 2, 1.4, 16); }
    if (o.horns && !o.hat) horn(-1);
    if (o.ears) { earP(-1); earP(1); }
    ell(g, 0, hy, 7.8, 7.6, o.skin); ell(g, -3.6, hy + 0.5, 3.6, 5.8, 'rgba(0,0,0,0.08)');
    if (!o.ears && !o.skull && !o.helmet && !o.hood && !o.dwarfHelm) { circ(g, -6.4, hy + 0.8, 2.3, o.skin); circ(g, -6.2, hy + 0.9, 1.1, dk); }
    if (o.skull) {
      ell(g, 1.2, hy + 4.6, 5, 3.6, o.skin); ell(g, 3.7, hy - 1, 2.5, 2.8, '#221'); ell(g, -1.9, hy - 1, 2.2, 2.6, '#221'); circ(g, 4.1, hy - 0.8, 0.9, '#ff5a3a'); circ(g, -1.6, hy - 0.8, 0.8, '#ff5a3a');
      poly(g, [1, hy + 1.6, 2.2, hy + 3.6, -0.2, hy + 3.6], '#221'); g.fillStyle = '#221'; g.fillRect(-2.6, hy + 5, 8.4, 0.9); for (let i = 0; i < 4; i++) g.fillRect(-1.6 + i * 2, hy + 4.2, 0.8, 3); line(g, -3, hy - 6.5, -1, hy - 4, 'rgba(0,0,0,0.3)', 0.9);
    } else {
      const lit = o.eye && o.eye !== '#221';
      ell(g, 3.9, hy - 0.8, 2.3, 2.6, lit ? o.eye : '#fffdf2'); ell(g, -1.3, hy - 0.8, 2, 2.4, lit ? o.eye : '#fffdf2');
      if (lit) { ell(g, 4.4, hy - 0.7, 0.75, 1.7, '#1c1410'); ell(g, -0.9, hy - 0.7, 0.7, 1.6, '#1c1410'); } else { circ(g, 4.5, hy - 0.6, 1.2, '#1c1410'); circ(g, -0.9, hy - 0.6, 1.05, '#1c1410'); circ(g, 4.9, hy - 1.1, 0.42, '#fff'); circ(g, -0.6, hy - 1.1, 0.38, '#fff'); }
      if (o.angry) { line(g, 1.6, hy - 3.4, 6.4, hy - 5, ink, 1.4); line(g, -3.6, hy - 4.8, 0.2, hy - 3.4, ink, 1.4); } else { line(g, 1.8, hy - 4.6, 6.2, hy - 4.3, ink, 1.1); line(g, -3.4, hy - 4.3, 0, hy - 4.6, ink, 1.1); }
      // nez
      if (o.bigNose) { circ(g, 7.6, hy + 2, 2.9, o.skin); circ(g, 7.8, hy + 2.2, 2.9, dk); circ(g, 8.4, hy + 1.2, 0.9, 'rgba(255,255,255,0.3)'); }
      else { g.fillStyle = o.skin; g.beginPath(); g.moveTo(5.2, hy - 0.2); g.quadraticCurveTo(10, hy + 1.8, 5.6, hy + 3.2); g.closePath(); g.fill(); g.fillStyle = dk; g.beginPath(); g.moveTo(5.2, hy - 0.2); g.quadraticCurveTo(10, hy + 1.8, 5.6, hy + 3.2); g.closePath(); g.fill(); }
      // bouche
      if (!o.beard) {
        g.strokeStyle = ink; g.lineWidth = 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.6, hy + 4.9); if (o.angry) g.quadraticCurveTo(3.2, hy + 4.2, 5.8, hy + 5.2); else g.quadraticCurveTo(3.2, hy + 6.4, 5.8, hy + 4.8); g.stroke();
        if (o.fangs) { poly(g, [1.4, hy + 4.6, 2.1, hy + 6.8, 2.8, hy + 4.6], '#fffbe8'); poly(g, [3.8, hy + 4.6, 4.5, hy + 6.8, 5.2, hy + 4.7], '#fffbe8'); }
        if (o.tusks) { poly(g, [0.2, hy + 5.6, 1.2, hy + 2.2, 2.4, hy + 5.6], '#f4ecd0'); poly(g, [4.4, hy + 5.6, 5.5, hy + 2.4, 6.4, hy + 5.4], '#f4ecd0'); }
      }
    }
    if (o.hair && !o.helmet && !o.hat && !o.hood && !o.dwarfHelm) { g.fillStyle = o.hair; g.beginPath(); g.arc(-1, hy - 1.5, 8.2, Math.PI * 0.92, Math.PI * 1.95); g.fill(); poly(g, [2, hy - 8.5, 6.5, hy - 5.4, 1, hy - 5.8], o.hair); }
    if (o.beard) { g.fillStyle = o.beard; g.beginPath(); g.moveTo(-6.4, hy + 1.6); g.quadraticCurveTo(-5, hy + 13, 1.6, hy + 17); g.quadraticCurveTo(7.4, hy + 12, 8, hy + 2.6); g.quadraticCurveTo(2, hy + 5.4, -6.4, hy + 1.6); g.fill(); g.fillStyle = dk; g.beginPath(); g.moveTo(1.6, hy + 17); g.quadraticCurveTo(7.4, hy + 12, 8, hy + 2.6); g.quadraticCurveTo(4, hy + 9, 1.6, hy + 17); g.fill(); ell(g, 5.2, hy + 3.9, 3.4, 1.5, o.beard); ell(g, 0.2, hy + 4.1, 3, 1.4, o.beard); }
    if (o.helmet) {
      const m = '#b4b8c4', md = '#8a8e98';
      if (o.armor) { // heaume fermé avec fente et plumet
        g.fillStyle = o.cape || '#c8322a'; g.beginPath(); g.moveTo(-0.5, hy - 9); g.quadraticCurveTo(-3, hy - 20, -11, hy - 13 + Math.sin(t * 4) * 1.2); g.quadraticCurveTo(-5, hy - 12.5, -1.5, hy - 8); g.fill();
        rrect(g, -8.6, hy - 2, 17.2, 10, 3.4, m); g.fillStyle = dk; g.fillRect(0, hy - 2, 8.6, 9.6); dome(m, 8.8, -1.4); rrect(g, -9.6, hy - 2.6, 19.2, 2.6, 1.2, md);
        g.fillStyle = '#1c1410'; g.fillRect(-0.5, hy + 0.9, 8.4, 1.8); [2, 4.4, 6.8].forEach(x => g.fillRect(x, hy + 4.4, 0.9, 2.2)); rrect(g, 3.2, hy - 1.6, 1.7, 9, 0.8, md);
      } else { dome(m, 8.7, -1.4); rrect(g, -9.6, hy - 2.6, 19.2, 2.6, 1.2, md); rrect(g, 4.6, hy - 1.4, 1.8, 5, 0.8, md); circ(g, -6, hy - 1.3, 0.7, '#5a5e68'); circ(g, 0, hy - 1.3, 0.7, '#5a5e68'); }
    }
    if (o.dwarfHelm) { poly(g, [-7.5, hy - 5, -13, hy - 11, -9.5, hy - 2.6], '#f4ecd0'); poly(g, [7.5, hy - 5, 13, hy - 11, 9.5, hy - 2.6], '#f4ecd0'); dome('#b88a3a', 8.7, -1.6); rrect(g, -9.6, hy - 2.8, 19.2, 2.8, 1.2, '#8a6424'); [-6, 0, 6].forEach(x => circ(g, x, hy - 1.4, 0.8, '#e8c84a')); rrect(g, 4.6, hy - 1.4, 1.8, 4.4, 0.8, '#8a6424'); }
    if (o.hood) { rrect(g, -9.6, hy - 4, 5.6, 11.5, 2.6, o.tunic); poly(g, [-8.5, hy - 6, -13.5, hy - 10, -5.5, hy - 10.5], o.tunic); g.fillStyle = o.tunic; g.beginPath(); g.arc(-0.4, hy - 3.2, 9.3, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = dk; g.beginPath(); g.arc(-0.4, hy - 3.2, 9.3, Math.PI * 1.5, 0); g.lineTo(-0.4, hy - 3.2); g.closePath(); g.fill(); ell(g, 2.4, hy - 3.6, 6, 1.3, 'rgba(0,0,0,0.3)'); }
    if (o.hat) {
      const hc = o.hatCol || o.tunic, tip = Math.sin(t * 2.4) * 1.2;
      g.fillStyle = hc; g.beginPath(); g.moveTo(-7, hy - 5.5); g.quadraticCurveTo(-3.5, hy - 17, -7 + tip, hy - 26); g.quadraticCurveTo(2, hy - 17, 7, hy - 5.5); g.closePath(); g.fill();
      g.fillStyle = dk; g.beginPath(); g.moveTo(0, hy - 5.5); g.quadraticCurveTo(0, hy - 17, -7 + tip, hy - 26); g.quadraticCurveTo(2, hy - 17, 7, hy - 5.5); g.closePath(); g.fill();
      ell(g, 0, hy - 5.2, 12.5, 3.1, hc); ell(g, 0, hy - 5.9, 11.5, 2, 'rgba(255,255,255,0.12)'); g.fillStyle = '#e8c84a'; g.fillRect(-6.4, hy - 9, 12.8, 2); g.fillStyle = '#2a1a12'; g.fillRect(1, hy - 9.4, 3, 2.8); g.fillStyle = '#e8c84a'; g.fillRect(1.8, hy - 8.7, 1.4, 1.4);
    }
    if (o.horns) horn(1);
    // bras avant + arme
    let a = 0.4 + sw * 0.6; if (o.atk > 0) a = -2.3 + (1 - o.atk) * 3.1;
    const hx = 6 + Math.sin(a) * 11, hyy = sh + Math.cos(a) * 11; line(g, 6, sh, hx, hyy, o.sleeve || o.tunic, 4); circ(g, hx, hyy, 2.4, o.skin);
    g.save(); g.translate(hx, hyy); g.rotate(a - 0.4);
    const w = o.weapon;
    if (w === 'epee') { line(g, 0, 2, 0, -22, '#e0e4f0', 3.2); line(g, -5, -2, 5, -2, '#8a6234', 3); }
    else if (w === 'fourche') { line(g, 0, 12, 0, -22, '#8a6234', 2.4); g.strokeStyle = '#a8acb8'; g.lineWidth = 2; g.beginPath(); g.moveTo(-5, -30); g.lineTo(-5, -22); g.lineTo(5, -22); g.lineTo(5, -30); g.moveTo(0, -30); g.lineTo(0, -22); g.stroke(); }
    else if (w === 'arc') { g.strokeStyle = '#8a5a2a'; g.lineWidth = 2.6; g.beginPath(); g.arc(-3, -4, 14, -1.2, 1.2); g.stroke(); line(g, 2, -17, 2, 9, '#eee', 0.8); }
    else if (w === 'baton') { line(g, 0, 14, 0, -24, '#5a3d22', 2.6); circ(g, 0, -27, 5, o.glow || '#ff7a2a'); circ(g, -1, -28, 1.8, '#fff'); }
    else if (w === 'massue') { line(g, 0, 6, 0, -18, '#5a3d22', 4); ell(g, 0, -24, 7, 10, '#6b4a2a'); circ(g, -4, -26, 1.5, '#d8dce8'); circ(g, 4, -22, 1.5, '#d8dce8'); }
    else if (w === 'fouet') { g.strokeStyle = '#ff5a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, -14 + Math.sin(t * 8) * 4, 4, -24); g.stroke(); }
    else if (w === 'sac') { ell(g, -2, 6, 8, 9, '#9a6a3a'); g.fillStyle = '#6b4a2a'; g.fillRect(-5, -3, 6, 3); }
    g.restore(); g.restore();
  };
  const HUMAN_SKIN = ['#f0c8a0', '#e0b088', '#c89068', '#f4d4b4'];
  Art.enemy = function (g, e, t) {
    if (e.struct) return Art.camp(g, e, t);
    const d = CG.ENEMIES[e.type], base = { x: e.x, y: e.y, face: e.face, t: t + e.seed, moving: e.moving, step: e.step, atk: e.atkAnim, angry: !e.calm };
    // (les racines sont dessinées dans effets.js)
    if (d.race === 'humain' && Art.humain) { if (e.atkAnim > (e._aP || 0) + 0.3) e._aT = t; e._aP = e.atkAnim; base.atk = e._aT !== undefined ? Math.max(0, 1 - (t - e._aT) / CG.Humains.DUREE) : 0; } /* le geste dure un peu plus que le coup lui-même, pour qu'on le voie */
    if (d.race === 'humain') (Art.humain || Art.humanoid)(g, Object.assign(base, d.look, { skin: HUMAN_SKIN[Math.floor(e.seed) % 4], s: d.boss ? 1.3 : d.r > 14 ? 1.12 : 1 }));
    else if (d.race === 'mort') Art.humanoid(g, Object.assign(base, { skin: '#eee8d8', tunic: '#cfc8b4', legs: '#d8d2c0', sleeve: '#e0dac8', skull: true, weapon: 'epee' }));
    else if (e.type === 'diablotin') Art.humanoid(g, Object.assign(base, { skin: '#e8503a', tunic: '#b8322a', legs: '#8a2218', horns: '#3a2412', wings: 'rgba(120,30,30,0.85)', s: 0.72, eye: '#ffe36b', ears: true, fangs: true }));
    else if (e.type === 'demon') Art.humanoid(g, Object.assign(base, { skin: '#c8322a', tunic: '#3a2a3a', legs: '#2a1a2a', sleeve: '#c8322a', horns: '#eee6d0', s: 1.2, eye: '#ffe36b', weapon: 'fouet', ears: true, fangs: true }));
    else if (e.type === 'seigneur') Art.humanoid(g, Object.assign(base, { skin: '#8a2a6a', tunic: '#2a1a3a', legs: '#1a1024', sleeve: '#8a2a6a', horns: '#e8c84a', s: 1.42, eye: '#7dffea', weapon: 'baton', glow: '#c070ff', cape: '#5a1a2a', ears: true, fangs: true, wings: 'rgba(60,20,70,0.9)' }));
    else if (e.type === 'troll') Art.humanoid(g, Object.assign(base, { skin: '#7a9a8a', tunic: '#6a5a3a', legs: '#5a7a6a', sleeve: '#7a9a8a', s: 1.9, weapon: 'massue', ears: true, eye: '#ffe36b', tusks: true, bigNose: true }));
    else if (e.type === 'gnome') Art.humanoid(g, Object.assign(base, { skin: '#f0c8a0', tunic: '#3f7a4a', legs: '#4a3a2a', s: 0.66, hat: true, hatCol: '#c8322a', beard: '#eee', weapon: 'arc', bigNose: true }));
    else if (e.type === 'ogre') Art.humanoid(g, Object.assign(base, { skin: '#c8a85a', tunic: '#5a4030', legs: '#a88a44', sleeve: '#c8a85a', s: 1.6, weapon: 'massue', ears: true, eye: '#221', tusks: true, bigNose: true }));
    else if (e.type === 'gelee' || e.type === 'champi' || e.type === 'follet') Art.critter(g, e, t + e.seed);
    else Art.beast(g, e, t + e.seed);
    if (e.slow > 0) { g.fillStyle = 'rgba(160,230,255,0.35)'; g.beginPath(); g.ellipse(e.x, e.y - 14, 14, 20, 0, 0, TAU); g.fill(); }
  };
  Art.critter = function (g, e, t) {
    const face = e.face < 0 ? -1 : 1, x = e.x, y = e.y, lunge = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) * 5 * face : 0, mad = !e.calm, bite = e.atkAnim > 0;
    const eye = (ex, ey, r) => { circ(g, ex, ey, r, '#fffdf2'); circ(g, ex + face * r * 0.3, ey + 0.2, r * 0.55, '#16202a'); circ(g, ex + face * r * 0.5, ey - r * 0.35, r * 0.22, '#fff'); };
    if (e.type === 'gelee') {
      const sq = Math.sin(t * (e.moving ? 9 : 4)) * 0.14, cx = x + lunge, cy = y - 9 * (1 - sq), rx = 13 * (1 + sq), ry = 11 * (1 - sq); Art.shadow(g, x, y + 1, 13);
      ell(g, cx, cy, rx, ry, 'rgba(60,170,100,0.9)'); ell(g, cx, cy - 1.5, rx * 0.86, ry * 0.8, 'rgba(110,215,135,0.9)'); ell(g, cx - rx * 0.1, y - 1.5, rx * 0.9, 2.6, 'rgba(40,130,80,0.5)');
      [[-5, 2, 1.6], [4, 4, 1.2], [1, -5, 1]].forEach(([dx, dy, r], i) => circ(g, cx + dx, cy + dy + Math.sin(t * 2 + i * 2) * 1.2, r, 'rgba(220,255,225,0.45)')); // bulles
      ell(g, cx - rx * 0.36, cy - ry * 0.5, rx * 0.3, ry * 0.2, 'rgba(240,255,240,0.75)');
      const ex = cx + face * 3, ey = cy - 1; eye(ex - 3.6, ey, 2.7); eye(ex + 3.6, ey, 2.7);
      if (mad) { line(g, ex - 6.4, ey - 4.2, ex - 1.6, ey - 2.8, '#1c5a36', 1.3); line(g, ex + 6.4, ey - 4.2, ex + 1.6, ey - 2.8, '#1c5a36', 1.3); }
      if (bite) { ell(g, ex, ey + 5, 3.4, 2.4, '#1c4a30'); g.fillStyle = '#fff'; g.fillRect(ex - 2.4, ey + 3.2, 1.3, 1.6); g.fillRect(ex + 1.1, ey + 3.2, 1.3, 1.6); } else { g.strokeStyle = '#1c5a36'; g.lineWidth = 1.2; g.beginPath(); g.arc(ex, ey + 3.4, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    } else if (e.type === 'champi') {
      const sw = e.moving ? Math.sin(e.step * TAU) : 0, b = Math.abs(sw) * 1.5, cx = x + lunge, top = y - 18 - b; Art.shadow(g, x, y + 1, 12);
      line(g, x - 4, y - 6, x - 4 + sw * 3, y, '#d8cfb4', 3.5); line(g, x + 4, y - 6, x + 4 - sw * 3, y, '#d8cfb4', 3.5); ell(g, x - 4 + sw * 3, y, 3, 1.6, '#b8ae90'); ell(g, x + 4 - sw * 3, y, 3, 1.6, '#b8ae90');
      line(g, cx - 7, top + 8, cx - 11, top + 12 + sw * 2, '#e8dfc4', 2.6); line(g, cx + 7, top + 8, cx + 11, top + 12 - sw * 2 - (bite ? 5 : 0), '#e8dfc4', 2.6);
      rrect(g, cx - 7, top, 14, 14, 5, '#f4ecd6'); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(cx - 7 + (face > 0 ? 0 : 9), top + 2, 5, 11);
      const ex = cx + face * 2, ey = top + 6; eye(ex - 2.8, ey, 2); eye(ex + 2.8, ey, 2); circ(g, ex - 5, ey + 3, 1.3, 'rgba(232,104,122,0.45)'); circ(g, ex + 5, ey + 3, 1.3, 'rgba(232,104,122,0.45)');
      if (mad) { line(g, ex - 5, ey - 3.6, ex - 1.2, ey - 2.2, '#5a3020', 1.2); line(g, ex + 5, ey - 3.6, ex + 1.2, ey - 2.2, '#5a3020', 1.2); }
      if (bite) ell(g, ex, ey + 4.6, 2.2, 1.8, '#822'); else line(g, ex - 2, ey + 4.4, ex + 2, ey + 4.4, '#822', 1.3);
      ell(g, cx, top + 1, 14.5, 3, '#e8dcc0'); g.fillStyle = '#c8322a'; g.beginPath(); g.ellipse(cx, top, 15.5, 12.5, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(cx, top, 15.5, 12.5, 0, Math.PI * 1.5, 0); g.lineTo(cx, top); g.fill();
      [[-7, -5, 2.6], [3.5, -8.5, 2.2], [9.5, -3.5, 1.7], [-1.5, -3, 1.4], [-11.5, -1.6, 1.2]].forEach(([dx, dy, r]) => { circ(g, cx + dx, top + dy, r, '#fff8ec'); circ(g, cx + dx + 0.5, top + dy + 0.5, r * 0.55, 'rgba(0,0,0,0.07)'); });
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(cx, top, 12.5, 10, 0, Math.PI * 1.12, Math.PI * 1.4); g.stroke();
    } else {
      const fy = y - 24 + Math.sin(t * 4) * 4, fl = Math.sin(t * 9) * 3; ell(g, x, y + 1, 8, 3, 'rgba(0,0,0,0.15)'); circ(g, x, fy, 19 + Math.sin(t * 5) * 2, 'rgba(110,210,255,0.16)'); circ(g, x, fy, 12, 'rgba(150,225,255,0.18)');
      const flame = (w, h, col, dx) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - w, fy + 6); g.quadraticCurveTo(x - w * 1.35, fy - h * 0.35, x + dx, fy - h); g.quadraticCurveTo(x + w * 1.35, fy - h * 0.35, x + w, fy + 6); g.quadraticCurveTo(x, fy + 6 + w * 0.7, x - w, fy + 6); g.fill(); };
      flame(8.5, 19, '#3aa8f0', fl); flame(6.2, 14, '#6ad0ff', fl * 0.7); flame(4, 9, '#d8f6ff', fl * 0.4);
      [[-9, -6], [9, -10], [-5, -18]].forEach(([dx, dy], i) => { const ph = (t * 1.3 + i * 0.37) % 1; circ(g, x + dx + Math.sin(t * 3 + i) * 2, fy + dy - ph * 10, 1.4 * (1 - ph), 'rgba(200,240,255,' + (1 - ph) + ')'); });
      const ex = x + face * 1.2; ell(g, ex - 2.3, fy + 0.6, 1.3, 1.9, '#0e3a5a'); ell(g, ex + 2.3, fy + 0.6, 1.3, 1.9, '#0e3a5a'); circ(g, ex - 2, fy - 0.1, 0.5, '#fff'); circ(g, ex + 2.6, fy - 0.1, 0.5, '#fff');
      if (mad) { line(g, ex - 4, fy - 2.6, ex - 1, fy - 1.6, '#0e3a5a', 1); line(g, ex + 4, fy - 2.6, ex + 1, fy - 1.6, '#0e3a5a', 1); } ell(g, ex, fy + 4, bite ? 1.6 : 1.1, bite ? 1.8 : 0.7, '#0e3a5a');
    }
  };
  Art.beast = function (g, e, t) {
    const face = e.face < 0 ? -1 : 1, sw = e.moving ? Math.sin(e.step * TAU) : 0, bob = e.moving ? Math.abs(sw) * 1.5 : Math.sin(t * 2.5) * 0.5;
    const lunge = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) * 6 : 0, mad = !e.calm, bite = e.atkAnim > 0;
    g.save(); g.translate(e.x, e.y);
    if (e.type === 'araignee') {
      Art.shadow(g, 0, 2, 15); g.scale(face, 1); g.lineCap = 'round'; g.lineJoin = 'round';
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const ph = Math.sin(e.step * TAU + i * 1.6) * (e.moving ? 4 : 0) * sd, wd = sd < 0 ? 1.45 : 1, kx = sd * (12 + i * 1.5) * wd, ky = -17 + i * 3 + ph * 0.3, fx = sd * (17 + i * 1.5) * wd + ph, fyy = 2 + (i - 1.5) * 3; g.strokeStyle = '#1a1420'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(sd * 3 + 2, -8); g.lineTo(kx + 2, ky); g.lineTo(fx + 2, fyy); g.stroke(); circ(g, kx + 2, ky, 1.5, '#3a2c44'); }
      ell(g, -6, -10 - bob, 10.5, 9, '#2a2030'); ell(g, -7.5, -12.5 - bob, 6, 4, 'rgba(255,255,255,0.1)'); poly(g, [-9, -13 - bob, -3, -13 - bob, -5.2, -10 - bob, -3, -7 - bob, -9, -7 - bob, -6.8, -10 - bob], '#c8322a'); // sablier rouge
      for (let i = 0; i < 5; i++) line(g, -13 + i * 3.4, -17.5 - bob + Math.abs(i - 2) * 1.2, -13.6 + i * 3.4, -20 - bob + Math.abs(i - 2) * 1.2, '#3a2c44', 1);
      ell(g, 6, -8 - bob, 7, 6.2, '#3a2c44'); ell(g, 5, -10 - bob, 4, 2.4, 'rgba(255,255,255,0.1)');
      [[7.5, -10.5, 1.5], [10.6, -9.4, 1.5], [5.4, -12.4, 0.9], [9.2, -12, 0.9]].forEach(([ex, ey, r]) => { circ(g, ex, ey - bob, r, '#ff4a4a'); circ(g, ex + 0.3, ey - bob - 0.3, r * 0.35, '#fff'); });
      const op = bite ? 2.4 : 0.6; g.strokeStyle = '#eee6d0'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(9.5, -5.5 - bob); g.quadraticCurveTo(12.5 + lunge * 0.3, -3 - bob, 10.5, -0.5 - bob + op); g.moveTo(12, -6.5 - bob); g.quadraticCurveTo(15.5 + lunge * 0.3, -4.5 - bob, 13.5, -1.5 - bob + op); g.stroke();
      g.restore(); return;
    }
    const big = e.type === 'ours', boar = e.type === 'sanglier', s = big ? 1.5 : boar ? 1.1 : 1;
    Art.shadow(g, 0, 2, 16 * s); g.scale(face * s, s); g.translate(lunge, 0);
    const col = big ? '#6a4628' : boar ? '#5a4030' : '#7a7e88', dark = big ? '#523418' : boar ? '#42281c' : '#5c606a', lite = big ? '#9a7248' : boar ? '#8a6a5a' : '#c8ccd4';
    [-9, -4, 5, 10].forEach((lx, i) => { const fx = lx + (i % 2 ? sw : -sw) * 4; line(g, lx, -8, fx, 0, dark, 3.8); ell(g, fx + 1, 0.2, 2.9, 1.5, boar ? '#2a1a12' : dark); });
    if (!boar && !big) { line(g, -13, -13 - bob, -21, -19 - bob + sw * 2, col, 5); circ(g, -22, -20 - bob + sw * 2, 2.8, lite); } // queue touffue
    else if (boar) { g.strokeStyle = dark; g.lineWidth = 1.6; g.beginPath(); g.arc(-15.5, -15 - bob, 2.6, 0.2, Math.PI * 1.6); g.stroke(); } else circ(g, -13.5, -14 - bob, 3, dark);
    ell(g, 0, -12 - bob, 14, boar || big ? 9 : 7, col); ell(g, 1, -8.6 - bob, 10, boar || big ? 4.6 : 3.4, lite); ell(g, -6, -14 - bob, 6, 3, 'rgba(0,0,0,0.1)');
    const backY = -12 - bob - (boar || big ? 9 : 7); for (let i = 0; i < (boar ? 7 : 4); i++) { const fx = -8 + i * (boar ? 2.8 : 4.2); poly(g, [fx - 1.6, backY + 2.2, fx + 0.4, backY - (boar ? 3.6 : 1.8), fx + 2, backY + 2.2], dark); } // poils du dos
    const hx = 13, hy = -15 - bob, hr = big ? 7 : 6;
    // oreilles
    if (big) { circ(g, hx - 4.5, hy - 5.5, 3, dark); circ(g, hx - 4.5, hy - 5.5, 1.5, '#c89a88'); circ(g, hx + 2.5, hy - 6.5, 3, col); circ(g, hx + 2.5, hy - 6.5, 1.5, '#c89a88'); }
    else { poly(g, [hx - 5, hy - 3.5, hx - 4.4, hy - 11.5, hx - 0.5, hy - 5], dark); poly(g, [hx - 0.2, hy - 5, hx + 1.8, hy - 12, hx + 4.4, hy - 4], col); poly(g, [hx + 0.8, hy - 5.4, hx + 1.9, hy - 9.8, hx + 3.3, hy - 4.8], '#c89a88'); }
    circ(g, hx, hy, hr, col);
    // museau
    if (boar) { ell(g, hx + 6.5, hy + 2, 5.2, 3.8, lite); ell(g, hx + 10.6, hy + 2, 2.2, 3, '#c89a8a'); circ(g, hx + 10.8, hy + 1, 0.6, '#3a1a12'); circ(g, hx + 10.8, hy + 3, 0.6, '#3a1a12'); g.strokeStyle = '#fff8e8'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + 5.4, hy + 4.4); g.quadraticCurveTo(hx + 8, hy + 3, hx + 8.4, hy - 1.6); g.stroke(); }
    else { ell(g, hx + 5.6, hy + 2, big ? 5 : 5.4, big ? 3.6 : 3, lite); circ(g, hx + (big ? 9.8 : 10.4), hy + 0.8, 1.5, '#1c1410'); circ(g, hx + (big ? 9.4 : 10), hy + 0.4, 0.45, '#fff'); }
    // gueule
    if (bite && !boar) { poly(g, [hx + 2.4, hy + 3.4, hx + 9.6, hy + 3, hx + 6, hy + 7.4], '#5a1420'); poly(g, [hx + 3.4, hy + 3.4, hx + 4.3, hy + 5.6, hx + 5.2, hy + 3.3], '#fff'); poly(g, [hx + 7, hy + 3.2, hx + 7.8, hy + 5.4, hx + 8.6, hy + 3.1], '#fff'); }
    else if (!boar) { line(g, hx + 3, hy + 4.2, hx + 9.4, hy + 3.8, '#2a1a14', 1); if (!big) poly(g, [hx + 6.6, hy + 3.8, hx + 7.3, hy + 5.8, hx + 8, hy + 3.8], '#fff'); }
    // œil
    const wolf = !boar && !big; ell(g, hx + 2.4, hy - 1.5, 2, 2.1, wolf ? '#ffe36b' : '#fffdf2'); if (wolf) ell(g, hx + 2.8, hy - 1.4, 0.7, 1.5, '#1c1410'); else circ(g, hx + 2.8, hy - 1.3, 1.1, '#1c1410'); circ(g, hx + 3.2, hy - 2, 0.4, '#fff');
    if (mad) line(g, hx + 0.2, hy - 4.6, hx + 4.8, hy - 3, '#1c1410', 1.3);
    g.restore();
  };

  // visiteurs pacifiques
  Art.visitor = function (g, v, t) {
    const base = { x: v.x, y: v.y, face: v.face, t: t + v.seed, moving: v.moving, step: v.step };
    const k = v.look;
    if (k === 'animal') return Art.pet(g, { kind: v.kind, evo: v.evo || 0, x: v.x, y: v.y, face: v.face, step: v.step, moving: v.moving, seed: v.seed }, t);
    if (k === 'nain') Art.humanoid(g, Object.assign(base, { skin: '#e8b890', tunic: '#b8622a', legs: '#4a3a2a', s: 0.82, beard: '#d87a2a', dwarfHelm: true, bigNose: true, weapon: 'sac' }));
    else if (k === 'elfe') Art.humanoid(g, Object.assign(base, { skin: '#f4dcc0', tunic: '#3f8a5a', legs: '#2a4a3a', s: 1.12, hair: '#f0e090', longHair: true, ears: true, weapon: 'baton', glow: '#7dff8a', robe: true }));
    else if (k === 'sorciere') Art.humanoid(g, Object.assign(base, { skin: '#c8d8a0', tunic: '#4a2a6a', legs: '#221', hat: true, hatCol: '#2a1a3a', hair: '#888', longHair: true, robe: true, weapon: 'baton', glow: '#7dffea', bigNose: true }));
    else if (k === 'demonMarchand') Art.humanoid(g, Object.assign(base, { skin: '#d86a3a', tunic: '#e8c84a', legs: '#4a2a1a', sleeve: '#d86a3a', horns: '#eee6d0', s: 1.1, eye: '#221', weapon: 'sac', ears: true, robe: true, fangs: true }));
    else if (k === 'seigneur') Art.humanoid(g, Object.assign(base, { skin: '#8a2a6a', tunic: '#2a1a3a', legs: '#1a1024', sleeve: '#8a2a6a', horns: '#e8c84a', s: 1.42, eye: '#7dffea', weapon: 'baton', glow: '#c070ff', cape: '#5a1a2a', ears: true, fangs: true, wings: 'rgba(60,20,70,0.9)' }));
    else if (k === 'demon') Art.humanoid(g, Object.assign(base, { skin: '#c8322a', tunic: '#3a2a3a', legs: '#2a1a2a', sleeve: '#c8322a', horns: '#eee6d0', s: 1.2, eye: '#ffe36b', weapon: 'fouet', ears: true, fangs: true }));
    else Art.goblin(g, Object.assign(base, { sex: v.sex || 'm', hue: v.hue || 95, job: 'aucun', tool: 'sac' }));
  };

  // ---------- divers ----------
  Art.bar = function (g, x, y, w, frac, col) {
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
    g.fillStyle = col; g.fillRect(x - w / 2, y, Math.max(0, w * frac), 4);
  };
  Art.bubble = function (g, x, y, txt) {
    g.font = '15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    rrect(g, x - 13, y - 13, 26, 24, 8, 'rgba(255,255,255,0.92)'); poly(g, [x - 4, y + 10, x + 4, y + 10, x, y + 16], 'rgba(255,255,255,0.92)');
    g.fillStyle = '#222'; g.fillText(txt, x, y);
  };
  Art.light = function () { return sprite('light', 256, 256, c => { const gr = c.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); }); };
  Art.glow = function () { return sprite('glow', 256, 256, c => { const gr = c.createRadialGradient(128, 128, 6, 128, 128, 128); gr.addColorStop(0, 'rgba(255,170,70,0.5)'); gr.addColorStop(0.5, 'rgba(255,130,40,0.16)'); gr.addColorStop(1, 'rgba(255,120,30,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); }); };
})(window.CG);
