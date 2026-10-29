// Carte du monde façon Donkey Kong Country : une île par monde, un chemin, cinq tableaux, le personnage qui marche.
(function (CB) {
  'use strict';
  const M = CB.Map = {}, TAU = Math.PI * 2;
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const NODES = [
    [[130, 470], [300, 400], [470, 460], [650, 380], [830, 290]],
    [[120, 440], [290, 480], [460, 390], [640, 450], [830, 320]],
    [[140, 480], [320, 420], [500, 470], [690, 400], [840, 300]],
    [[120, 460], [290, 380], [470, 440], [650, 360], [830, 280]],
    [[130, 480], [310, 430], [480, 370], [660, 430], [830, 300]],
    [[110, 470], [300, 400], [500, 450], [680, 350], [850, 270]],
  ];
  M.nodes = wi => NODES[wi] || NODES[0];
  M.nodeAt = (wi, x, y) => M.nodes(wi).findIndex(([nx, ny]) => Math.hypot(nx - x, ny - y) < 34);
  // Point sur le chemin entre deux tableaux (0 ≤ k ≤ 1), même courbe que le tracé.
  M.pathPoint = (wi, from, to, k) => { const n = M.nodes(wi), a = n[from], b = n[to], mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 40; const u = 1 - k; return [u * u * a[0] + 2 * u * k * mx + k * k * b[0], u * u * a[1] + 2 * u * k * my + k * k * b[1]]; };
  const DECOR = {
    foret(c, x, y, i) { c.fillStyle = i % 2 ? '#1f6b3a' : '#17552d'; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(x, y - 34); c.fill(); c.fillStyle = '#5a3a21'; c.fillRect(x - 3, y, 6, 8); },
    manoir(c, x, y, i) { if (i % 3 === 0) { c.fillStyle = '#5a4a7a'; c.beginPath(); c.roundRect(x - 9, y - 22, 18, 24, 7); c.fill(); c.fillStyle = '#3a2a55'; c.fillRect(x - 5, y - 14, 10, 3); } else { c.fillStyle = '#2a1f45'; c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.lineTo(x + 6, y - 26); c.lineTo(x, y - 14); c.lineTo(x - 6, y - 30); c.fill(); } },
    foire(c, x, y, i) { c.fillStyle = ['#ff4f6b', '#4fc3ff', '#ffd23f'][i % 3]; c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x, y - 24); c.lineTo(x + 16, y); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - 3, y - 14, 6, 14); circle(c, x, y - 24, 3, '#fff'); },
    ruche(c, x, y, i) { c.strokeStyle = '#5a8f2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 14); c.stroke(); for (let k = 0; k < 5; k++) circle(c, x + Math.cos(k * TAU / 5) * 5, y - 14 + Math.sin(k * TAU / 5) * 5, 3.5, ['#ff4f6b', '#fff', '#c54fff'][i % 3]); circle(c, x, y - 14, 2.5, '#ffb000'); },
    volcan(c, x, y, i) { c.fillStyle = i % 2 ? '#4a2a22' : '#3a1a16'; c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x - 4, y - 22); c.lineTo(x + 6, y - 12); c.lineTo(x + 16, y); c.fill(); if (i % 2) circle(c, x - 4, y - 22, 3, '#ff8c2a'); },
    espace(c, x, y, i) { c.fillStyle = i % 3 ? '#8aa0c0' : '#ffd23f'; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * TAU / 8, r = k % 2 ? 2 : 7; c.lineTo(x + Math.cos(a) * r, y - 8 + Math.sin(a) * r); } c.fill(); },
  };
  function island(c, w, wi) {
    c.fillStyle = CB.Render.shade(w.ground, 1.35); c.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i * TAU / 40, r = 1 + Math.sin(a * 3 + wi) * .08 + Math.cos(a * 5 + wi * 2) * .05; const x = 480 + Math.cos(a) * 430 * r, y = 420 + Math.sin(a) * 200 * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); c.fill();
    c.fillStyle = w.space ? 'rgba(127,212,255,.12)' : 'rgba(255,255,255,.12)'; c.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i * TAU / 40, r = .85 + Math.sin(a * 4 + wi) * .06; const x = 480 + Math.cos(a) * 430 * r, y = 410 + Math.sin(a) * 190 * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); c.fill();
  }
  // marker = { vi, from, k } : personnage sur le tableau vi (ou en chemin de from vers vi, avancement k).
  // view (optionnel, voir Render.fitCanvas) : le ciel remplit toute la fenêtre, l'île reste centrée en 960×640.
  M.draw = (c, { wi, profile, selected, t = 0, playerId, marker, view }) => {
    const w = CB.WORLDS[wi], S = CB.Save, n = M.nodes(wi), R = CB.Render, lw = view ? view.lw : 960, lh = view ? view.lh : 640;
    c.save();
    const g = c.createLinearGradient(0, 0, 0, lh); g.addColorStop(0, w.sky[0]); g.addColorStop(1, w.sky[2]); c.fillStyle = g; c.fillRect(0, 0, lw, lh);
    if (w.space || wi < 2) for (let i = 0; i < 80; i++) { c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t + i)); c.fillStyle = '#fff'; c.fillRect(hash(i) * lw, hash(i + 50) * lh, 2, 2); } c.globalAlpha = 1;
    if (!w.space) { c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(lw * (i + .5) / 4 + Math.sin(t * .2 + i) * 20, 80 + i * 20, 70, 22, 0, 0, TAU); c.fill(); } }
    if (view) c.translate(view.ox, view.oy);
    island(c, w, wi);
    for (let i = 0; i < 26; i++) { const x = 60 + hash(i + wi * 7) * 840, y = 250 + hash(i + 99 + wi) * 330; if (n.some(([nx, ny]) => Math.hypot(nx - x, ny - y) < 60)) continue; (DECOR[w.id] || DECOR.foret)(c, x, y, i); }
    // chemin
    c.setLineDash([10, 12]); c.lineDashOffset = -t * 30; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(n[0][0], n[0][1]);
    for (let i = 1; i < n.length; i++) { const a = n[i - 1], b = n[i]; c.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 40, b[0], b[1]); } c.stroke(); c.setLineDash([]);
    // tableaux
    n.forEach(([x, y], vi) => {
      const stars = S.stars(profile, w.id, vi), open = S.waveUnlocked(profile, wi, vi), boss = vi === CB.WAVES_PER_WORLD - 1;
      circle(c, x, y + 6, 26, 'rgba(0,0,0,.35)');
      if (selected === vi) { c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.globalAlpha = .6 + .4 * Math.sin(t * 6); c.beginPath(); c.arc(x, y, 34 + Math.sin(t * 6) * 3, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      circle(c, x, y, 26, open ? (stars ? '#2fa84f' : '#ffd23f') : '#4a5468'); circle(c, x, y, 20, open ? (stars ? '#7dff9a' : '#fff3a0') : '#6b768a');
      c.fillStyle = open ? '#1b2436' : '#2a3140'; c.font = 'bold 18px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (boss) { c.font = '22px Arial'; c.fillText(open ? '💀' : '🔒', x, y + 1); } else c.fillText(open ? String(vi + 1) : '🔒', x, y + 1);
      if (stars) for (let s = 0; s < 3; s++) { c.font = '14px Arial'; c.fillStyle = s < stars ? '#ffd23f' : 'rgba(255,255,255,.35)'; c.fillText('★', x - 16 + s * 16, y + 38); }
    });
    // personnage
    if (marker) {
      let x, y; if (marker.from != null && marker.k < 1) [x, y] = M.pathPoint(wi, marker.from, marker.vi, marker.k); else [x, y] = n[marker.vi];
      const bob = Math.sin(t * 8) * (marker.k < 1 ? 5 : 2); c.save(); c.translate(x, y - 46 + bob);
      circle(c, 0, 50 - bob, 14, 'rgba(0,0,0,.3)');
      const fam = CB.FAMILIES[CB.playerById(playerId).family].color; c.fillStyle = fam; c.beginPath(); c.roundRect(-12, 6, 24, 22, 6); c.fill();
      if (!window.FamilyHeads?.draw(c, playerId, marker.k < 1 && marker.from < marker.vi ? 'side' : 'front', -20, -32, 40, 42)) circle(c, 0, -10, 16, '#f3d2b4');
      c.restore();
    }
    c.restore();
  };
})(window.CB);
