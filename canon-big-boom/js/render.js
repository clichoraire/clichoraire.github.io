// Rendu canvas d'une vague : décor du monde, ennemis, boss, canon du personnage, boulets, effets et réticule.
(function (CB) {
  'use strict';
  const R = CB.Render = {};
  const TAU = Math.PI * 2, P = CB.project;
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ellipse = (c, x, y, rx, ry, color, rot = 0) => { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const star = (c, x, y, r, color, points = 5) => { c.fillStyle = color; c.beginPath(); for (let i = 0; i < points * 2; i++) { const a = i * Math.PI / points - Math.PI / 2, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; r = Math.round(Math.min(255, r * k)); g = Math.round(Math.min(255, g * k)); b = Math.round(Math.min(255, b * k)); return 'rgb(' + r + ',' + g + ',' + b + ')'; };
  R.shade = shade;

  // ---------- Décors (pleine fenêtre, même esprit que le prototype Canon Boom Boom) ----------
  const poly = (c, pts, col) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = col; c.fill(); };
  const box = (c, x, y, w, h, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  function tree(c, x, y, s, col = '#315e59') {
    c.save(); c.translate(x, y); c.scale(s, s); box(c, -.08, -.2, .16, .25, .02, '#5b4b45');
    for (let i = 0; i < 3; i++) { poly(c, [[-.45 + i * .09, -.12 - i * .24], [0, -.9 - i * .17], [.45 - i * .09, -.12 - i * .24]], col); poly(c, [[0, -.9 - i * .17], [.45 - i * .09, -.12 - i * .24], [0, -.12 - i * .24]], '#ffffff0a'); }
    c.restore();
  }
  const MOUNTAINS = { prehistoire: ['#4f8fb0', '#3f8a5a', '#2f6b3a'], foret: ['#172f4b', '#214858', '#315c65'], manoir: ['#1a1233', '#2a1e4d', '#3c2d66'], foire: ['#2a4f8a', '#3f74b5', '#6aa3d6'], ruche: ['#b86a2a', '#d9913d', '#efb860'], volcan: ['#2a0b0b', '#4a1410', '#7a2a18'] };
  R.SCENE_KEYS = ['foret', 'manoir', 'foire', 'ruche', 'volcan', 'espace', 'prehistoire'];
  // Dessine le décor sur toute la zone w×h : ciel, étoiles, lune (ou soleil), montagnes, éléments du monde, sol en colline.
  // La mer : nuages, îles au loin, horizon, eau qui ondule avec des crêtes d'écume
  R.sea = (c, w, h, t) => {
    c.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 5; i++) { const x = ((i * 257 + t * 6) % (w + 200)) - 100, y = h * .12 + (i % 3) * h * .07; for (let k = 0; k < 4; k++) circle(c, x + k * 26, y + (k % 2) * 6, 16 + (k % 3) * 6, 'rgba(255,255,255,.8)'); }
    const hy = Math.min(h * .6, CB.VIEW.horizon + 4 * CB.VIEW.fy / 95); for (const [x, s] of [[w * .18, 1], [w * .78, .7]]) { poly(c, [[x - 90 * s, hy], [x - 30 * s, hy - 40 * s], [x + 20 * s, hy - 55 * s], [x + 95 * s, hy]], '#2f7a4a'); c.strokeStyle = '#6b4a2a'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x + 20 * s, hy - 55 * s); c.quadraticCurveTo(x + 26 * s, hy - 80 * s, x + 18 * s, hy - 92 * s); c.stroke(); for (let k = 0; k < 5; k++) { c.strokeStyle = '#3fae5a'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x + 18 * s, hy - 92 * s); c.quadraticCurveTo(x + 18 * s + Math.cos(k * 1.3) * 22 * s, hy - 100 * s, x + 18 * s + Math.cos(k * 1.3) * 34 * s, hy - 84 * s + Math.abs(Math.sin(k)) * 10 * s); c.stroke(); } }
    const g = c.createLinearGradient(0, hy, 0, h); g.addColorStop(0, '#2c7ec4'); g.addColorStop(.5, '#1f5f9e'); g.addColorStop(1, '#143f72'); c.fillStyle = g; c.fillRect(0, hy, w, h - hy);
    for (let l = 0; l < 9; l++) { const y = hy + 10 + l * (h - hy) * .105, amp = 2 + l * .9, sp = 1 + l * .15; c.strokeStyle = 'rgba(255,255,255,' + (.12 + l * .03) + ')'; c.lineWidth = 1.5 + l * .35; c.beginPath(); for (let x = -40; x <= w + 40; x += 18) { const yy = y + Math.sin(x / (42 + l * 8) + t * sp + l) * amp; x === -40 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
    for (let i = 0; i < 14; i++) { const x = (i * 193 + t * 25 * (i % 2 ? 1 : -1)) % (w + 60) - 30, y = hy + 30 + (i % 5) * (h - hy) * .17; ellipse(c, x, y, 14 + (i % 3) * 8, 2.5, 'rgba(255,255,255,.5)'); }
  };
  // Le bateau pirate : mât, voile et pavillon derrière le héros (avant les monstres), puis la coque devant (après les monstres)
  R.shipMast = (c, w, h, V, t) => {
    const x = V.cx - V.size * 1.55, top = Math.max(24, Math.min(h * .3, V.horizon - 236)), sh = Math.max(90, Math.min(180, V.horizon - 44 - top)), base = V.ground + V.size * .3; c.fillStyle = '#5a3a1e'; c.fillRect(x - 7, top, 14, base - top); c.fillRect(x - 90, top + 22, 180, 8);   // la voile s'arrête au-dessus de l'horizon : les monstres à la coque ne la cachent pas
    const sway = Math.sin(t * 1.4) * 8; c.fillStyle = '#f1e7d0'; c.beginPath(); c.moveTo(x - 86, top + 30); c.lineTo(x + 86, top + 30); c.quadraticCurveTo(x + 96 + sway, top + 30 + sh / 2, x + 84, top + 30 + sh); c.lineTo(x - 84, top + 30 + sh); c.quadraticCurveTo(x - 96 + sway, top + 30 + sh / 2, x - 86, top + 30); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 3; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x - 85, top + 30 + k * sh / 4); c.lineTo(x + 85, top + 30 + k * sh / 4); c.stroke(); }
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.moveTo(x, top - 2); c.lineTo(x + 70 + Math.sin(t * 5) * 6, top + 8 + Math.sin(t * 6) * 4); c.lineTo(x, top + 24); c.closePath(); c.fill(); c.font = '18px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☠️', x + 26, top + 11);
  };
  R.shipHull = (c, w, h, V, t) => {
    const ay = P({ x: 0, y: 1.8, z: 0 }).y - V.allyLift + 1.2 * V.allySize, top = Math.min(ay + V.allySize * .3, V.ground + V.size * .32) + Math.sin(t * 1.4) * 3;   // le pont passe sous les roues des coéquipiers ; le héros, plus bas, est dessiné par-dessus
    c.fillStyle = '#6b4a2a'; c.beginPath(); c.moveTo(-10, top - 70); c.quadraticCurveTo(w * .08, top - 10, w * .2, top); c.lineTo(w * .8, top); c.quadraticCurveTo(w * .92, top - 10, w + 10, top - 70); c.lineTo(w + 10, h + 10); c.lineTo(-10, h + 10); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 3; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(0, top + k * 26); c.lineTo(w, top + k * 26); c.stroke(); }
    c.fillStyle = '#8a5a2b'; c.fillRect(w * .18, top - 16, w * .64, 16); c.fillStyle = '#5a3a1e'; for (let x = w * .2; x < w * .8; x += 46) c.fillRect(x, top - 40, 10, 26);
    c.fillStyle = '#c9a227'; for (let x = w * .25; x < w * .78; x += 120) circle(c, x, top + 60, 11, '#1b2436'); 
    c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 9; i++) ellipse(c, (i * 131 + t * 40) % w, top - 4 + Math.sin(t * 3 + i) * 4, 22, 5, 'rgba(255,255,255,.5)');
  };
  R.background = (c, w, h, world, t) => {
    const scene = world.scene || world.id, sky = world.sky, day = scene === 'foire' || scene === 'ruche' || scene === 'prehistoire' || scene === 'mer';
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(.6, sky[1]); g.addColorStop(1, sky[2]); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (!day) { for (let i = 0; i < 65; i++) { c.globalAlpha = .3 + .25 * Math.sin(t * .6 + i); const big = i % 9 === 0; ellipse(c, (i * 173) % w, (i * 97) % (h * .58), big ? 2 : 1, big ? 2 : 1, '#f9e6bd'); } c.globalAlpha = 1; }
    const mx = w * .82, my = h * .2, moonCol = scene === 'espace' ? '#5e8fab' : day ? '#ffe36a' : '#ffedc2';
    const glow = c.createRadialGradient(mx, my, 8, mx, my, h * .17); glow.addColorStop(0, scene === 'espace' ? '#88b9d577' : day ? '#ffe36a66' : '#ffedb950'); glow.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = glow; c.fillRect(mx - h * .17, my - h * .17, h * .34, h * .34);
    circle(c, mx, my, h * .07, moonCol);
    if (scene === 'espace' || world.space) {
      for (let i = 0; i < 7; i++) { const x = (i * 263 + t * (i % 2 ? 2 : -2) * 10) % w, y = h * .2 + (i % 4) * h * .1; poly(c, [[x, y], [x + 35, y + 8], [x + 12, y + 13], [x - 20, y + 8]], '#7090ad66'); }
      poly(c, [[0, h], [w * .12, h * .77], [w * .88, h * .77], [w, h]], '#34475e');
      for (let i = 0; i < 8; i++) { const x = w * i / 7; c.strokeStyle = '#72cce24a'; c.lineWidth = 2; c.beginPath(); c.moveTo(w / 2 + (x - w / 2) * .55, h * .78); c.lineTo(x, h); c.stroke(); }
      for (let i = 0; i < 4; i++) { const y = h * .8 + i * h * .06; c.strokeStyle = '#607d96'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      box(c, 0, h * .81, w * .13, h * .08, 3, '#213751'); box(c, w * .87, h * .81, w * .13, h * .08, 3, '#213751');
      for (let i = 0; i < 6; i++) circle(c, w * .2 + i * w * .12, h * .86, 4, Math.sin(t * 3 + i) > 0 ? '#7fd4ff' : '#243040');
      return;
    }
    if (scene === 'mer') { R.sea(c, w, h, t); return; }
    const cols = MOUNTAINS[scene] || MOUNTAINS.foret;
    if (scene === 'prehistoire') { // la grande montagne enneigée et un volcan qui fume, derrière les collines
      poly(c, [[w * .18, h * .62], [w * .36, h * .2], [w * .42, h * .27], [w * .5, h * .18], [w * .72, h * .62]], '#5a7f9c'); poly(c, [[w * .33, h * .3], [w * .36, h * .2], [w * .42, h * .27], [w * .5, h * .18], [w * .55, h * .29], [w * .48, h * .27], [w * .44, h * .32], [w * .38, h * .29]], '#f3f7fb');
      poly(c, [[w * .76, h * .62], [w * .86, h * .36], [w * .9, h * .36], [w, h * .62]], '#6b4a44'); for (let i = 0; i < 4; i++) { const k = (t * .12 + i * .25) % 1; c.globalAlpha = .35 * (1 - k); circle(c, w * .88 + Math.sin(t + i) * 10 * k, h * .36 - k * h * .22, 10 + k * 26, '#d8d8e0'); } c.globalAlpha = 1;
    }
    for (let l = 0; l < 3; l++) { const p = [[0, h]]; for (let x = 0; x <= w + 60; x += 60) p.push([x, h * (.48 + l * .12) - Math.sin(x / w * 12 + l * 3) * h * .07]); p.push([w, h]); poly(c, p, cols[l]); }
    if (scene === 'foret') for (let i = 0; i < 28; i++) tree(c, i * w / 27, h * .82, 40 + i % 5 * 14, i % 2 ? '#245448' : '#1c433f');
    if (scene === 'prehistoire') { // forêt luxuriante : palmiers, fougères, grosses feuilles
      for (let i = 0; i < 16; i++) { const x = i * w / 15 + (i % 3) * 12, y = h * .83, hh = 55 + i % 4 * 22, sway = Math.sin(t * 1.2 + i) * 3; c.strokeStyle = '#6b4a2a'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - hh * .6, x + sway, y - hh); c.stroke(); for (let k = 0; k < 6; k++) { const a = -Math.PI + k * Math.PI / 5; c.strokeStyle = k % 2 ? '#2f8f3a' : '#3fae4a'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + sway, y - hh); c.quadraticCurveTo(x + sway + Math.cos(a) * 30, y - hh + Math.sin(a) * 30 - 8, x + sway + Math.cos(a) * 52, y - hh + Math.sin(a) * 20 + 14); c.stroke(); } }
      for (let i = 0; i < 22; i++) { const x = (i + .5) * w / 22, y = h * .9 + (i % 2) * h * .03; for (let k = -3; k <= 3; k++) { c.strokeStyle = k % 2 ? '#2a7a2f' : '#49b04f'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + k * 10, y - 26, x + k * 22, y - 14 + Math.abs(k) * 4); c.stroke(); } }
    }
    if (scene === 'manoir') for (let i = 0; i < 5; i++) { const x = (i + .3) * w / 5, y = h * .8, th = h * (.17 + i % 2 * .12); box(c, x - 33, y - th, 66, th, 2, '#282b4e'); poly(c, [[x - 48, y - th], [x, y - th - 55], [x + 48, y - th]], '#382c52'); for (let k = 0; k < 3; k++) box(c, x - 19 + k * 15, y - th + 23, 8, 18, 3, Math.sin(t * 2 + i + k) > .3 ? '#deb879' : '#6b5a3a'); }
    if (scene === 'foire') {
      const cx = w * .15, cy = h * .52, r = h * .23; c.strokeStyle = '#e9c5a366'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * .15; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); ellipse(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 9, 12, ['#f5bf66', '#9fd5bd', '#ed91bb'][i % 3]); }
      for (let i = 0; i < 5; i++) { const x = w * .2 + i * w * .18, y = h * .81; poly(c, [[x - 35, y], [x, y - 75], [x + 35, y]], i % 2 ? '#ca758a' : '#e6bd78'); }
    }
    if (scene === 'ruche') for (let i = 0; i < 9; i++) { const x = w * (i + .5) / 9, y = h * .82, hh = 50 + i % 3 * 18; c.strokeStyle = '#3f7a2f'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - hh); c.stroke(); for (let k = 0; k < 8; k++) ellipse(c, x + Math.cos(k * TAU / 8) * 14, y - hh + Math.sin(k * TAU / 8) * 14, 7, 5, '#ffd23f', k * TAU / 8); circle(c, x, y - hh, 8, '#7a4a1a'); }
    if (scene === 'volcan') { poly(c, [[w * .32, h * .73], [w * .47, h * .36], [w * .53, h * .36], [w * .68, h * .73]], '#3a1812'); const lg = c.createRadialGradient(w * .5, h * .36, 4, w * .5, h * .36, h * .18); lg.addColorStop(0, '#ff8c2acc'); lg.addColorStop(1, 'rgba(255,100,20,0)'); c.fillStyle = lg; c.fillRect(w * .3, h * .18, w * .4, h * .36); poly(c, [[w * .47, h * .37], [w * .53, h * .37], [w * .52, h * .5 + Math.sin(t * 2) * 6], [w * .49, h * .55]], '#ff6a1a'); }
    const floor = c.createLinearGradient(0, h * .75, 0, h); floor.addColorStop(0, shade(world.ground, 2.2)); floor.addColorStop(1, shade(world.ground, .7));
    poly(c, [[0, h * .88], [w * .5, h * .75], [w, h * .88], [w, h], [0, h]], floor);
  };

  // ---------- Ennemis ----------
  // Panneau de stand de tir : poteau + planche de bois, le personnage dessiné dessus ; le tout monte depuis le sol selon e.panel.up
  const panelBoard = (c, e, t, draw) => { const up = e.panel ? e.panel.up : 1; c.save(); c.translate(0, (1 - up) * 4.5); c.fillStyle = '#6b4a2a'; c.fillRect(-.14, 1, .28, 3); c.fillStyle = '#b9834a'; c.beginPath(); c.roundRect(-1.45, -1.9, 2.9, 3.1, .25); c.fill(); c.strokeStyle = '#7a5230'; c.lineWidth = .1; c.stroke(); c.strokeStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-1.4, -1.1 + i * .9); c.lineTo(1.4, -1.1 + i * .9); c.stroke(); } if (e.face && CB.ENEMIES[e.face]) R.enemyIcon(c, e.face, 0, -.3, .85 / Math.max(1, CB.ENEMIES[e.face].size * .75), t); else draw(c); c.restore(); };   // e.face : n'importe quel monstre sur la pancarte (éditeur)
  // Bateau pirate ennemi, de face dans l'eau (unités monstre) : mâts et voiles, pavillon noir, coque, sabords qui crachent (flash)
  const hullSprite = (c, t, o) => {
    const L = o.len || 3, h = o.hullCol || '#7a4a22', sway = Math.sin(t * 1.4 + (o.phase || 0)) * .2; c.save(); c.rotate(Math.sin(t * 1.2 + (o.phase || 0)) * .04);
    for (let i = 0; i < o.masts; i++) { const mx = -L * .5 + (i + .5) * L / o.masts; c.fillStyle = o.mastCol || '#4a2c12'; c.fillRect(mx - .12, -o.mastH, .24, o.mastH + .3); c.fillStyle = o.sailCol || '#f1e7d0'; c.beginPath(); c.moveTo(mx + .15, -o.mastH + .3); c.quadraticCurveTo(mx + L * .3 + sway, -o.mastH * .55, mx + .15, -.4); c.lineTo(mx - L * .25, -.4); c.quadraticCurveTo(mx - L * .25 + sway, -o.mastH * .55, mx - L * .25, -o.mastH + .3); c.closePath(); c.fill(); }
    if (o.flag) { const mx = -L * .5 + .5 * L / o.masts; c.fillStyle = '#1b1b1b'; c.beginPath(); c.moveTo(mx, -o.mastH - .1); c.lineTo(mx + .9 + Math.sin(t * 5) * .1, -o.mastH + .15); c.lineTo(mx, -o.mastH + .4); c.closePath(); c.fill(); }
    c.fillStyle = h; c.beginPath(); c.moveTo(-L, -.3); c.lineTo(L, -.3); c.quadraticCurveTo(L * .9, .9, L * .6, 1); c.lineTo(-L * .7, 1); c.quadraticCurveTo(-L * 1.05, .8, -L, -.3); c.closePath(); c.fill();
    c.fillStyle = shade(h, 1.3); c.fillRect(-L * .95, -.3, L * 1.9, .18); c.fillStyle = shade(h, .6); c.fillRect(-L * .9, .38, L * 1.75, .14);
    for (let i = 0; i < o.cannons; i++) { const x = -L * .6 + (i + .5) * L * 1.2 / o.cannons; box(c, x - .3, .02, .6, .36, .1, '#2a2a30'); circle(c, x, .2, .13, '#111'); if (o.flash > 0) { c.globalAlpha = Math.min(1, o.flash * 5); circle(c, x, .5, .35 + o.flash * 1.5, '#ffd23f'); circle(c, x, .5, .18 + o.flash, '#fff'); c.globalAlpha = 1; } }
    c.restore();
  };
  // Petit bateau pirate (unités monstre, proue à droite) : nuage porteur, coque, trois canons, deux mâts, voiles, pavillon noir. flash = éclair de bouche.
  const shipSprite = (c, t, flash = 0, dir = 1) => {
    c.save(); c.scale(dir, 1);
    c.globalAlpha = .92; for (const [x, r] of [[-2.4, 1.1], [-.8, 1.45], [.9, 1.35], [2.5, 1.05]]) circle(c, x, 2.3 + Math.sin(t * 2 + x) * .1, r, '#eaf4ff'); c.globalAlpha = 1;
    c.fillStyle = '#7a4a22'; c.beginPath(); c.moveTo(-3.7, .1); c.lineTo(3.9, .1); c.quadraticCurveTo(3.5, 1.9, 2.3, 2); c.lineTo(-2.7, 2); c.quadraticCurveTo(-3.9, 1.8, -3.7, .1); c.fill();
    c.fillStyle = '#5a3416'; c.fillRect(-3.6, .85, 7.3, .22); c.fillStyle = '#a06a36'; c.fillRect(-3.5, .1, 7.2, .18);
    for (let i = 0; i < 3; i++) { const x = -2.2 + i * 1.75; box(c, x - .4, 1.05, .8, .5, .15, '#2a2a30'); circle(c, x, 1.3, .17, '#111'); if (flash > 0) { c.globalAlpha = Math.min(1, flash * 6); circle(c, x, 1.75, .5 + flash * 2, '#ffd23f'); circle(c, x, 1.75, .25 + flash, '#fff'); c.globalAlpha = 1; } }
    const sway = Math.sin(t * 1.6) * .25; c.fillStyle = '#4a2c12'; c.fillRect(-1.3, -4.7, .32, 4.9); c.fillRect(1.4, -3.9, .3, 4.1);
    c.fillStyle = '#f1e7d0'; c.beginPath(); c.moveTo(-1.1, -4.3); c.quadraticCurveTo(.9 + sway, -2.6, -1.1, -.8); c.lineTo(-3.2, -.8); c.quadraticCurveTo(-2.5 + sway, -2.6, -3.2, -4.3); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(1.65, -3.6); c.quadraticCurveTo(3.4 + sway, -2.2, 1.65, -.8); c.lineTo(.1, -.8); c.quadraticCurveTo(.6 + sway, -2.2, .1, -3.6); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = .09; c.beginPath(); c.moveTo(-3.1, -2.6); c.lineTo(-1.1, -2.6); c.moveTo(.2, -2.2); c.lineTo(1.6, -2.2); c.stroke();
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(-1.05, -4.85); c.lineTo(.7 + sway * .5, -4.4); c.lineTo(-1.05, -3.95); c.closePath(); c.fill(); circle(c, -.55, -4.4, .15, '#fff'); c.fillStyle = '#fff'; c.fillRect(-.72, -4.22, .34, .07);
    c.restore();
  };
  // Monstre marin : le corps est coupé à la ligne d'eau (wl, en unités locales). Derrière : ondes qui s'élargissent ; devant : écume, gouttes et sillage.
  const waterBack = (c, e, t, wl, jump = 0) => { const w = (2.2 + (e.size || 1) * .4) * (1 + jump * .5); c.save(); c.lineWidth = .12; for (let i = 0; i < 3; i++) { const ph = (t * .7 + i / 3 + e.phase * .1) % 1; c.globalAlpha = (1 - ph) * .55; c.strokeStyle = '#eaf7ff'; c.beginPath(); c.ellipse(0, wl, w * (.8 + ph * 1.6), w * (.8 + ph * 1.6) * .28, 0, 0, TAU); c.stroke(); } c.globalAlpha = .35; ellipse(c, 0, wl + .1, w * 1.1, w * .3, '#0f3f78'); c.restore(); };
  const waterFront = (c, e, t, wl, jump = 0) => { const w = (2.2 + (e.size || 1) * .4) * (1 + jump * .5), k = Math.sin(t * 3 + e.phase); c.save();
    if (jump > 0) { c.globalAlpha = .9; for (let i = 0; i < 10; i++) { const a = (i / 10 - .5) * 2.6, d = jump * (1.2 + (i % 3) * .5); circle(c, Math.sin(a) * w * .9 * d, wl - Math.cos(a) * 2.2 * d + jump * jump * 1.5, .16 + (i % 2) * .08, '#eaf7ff'); } }   // gerbe d'eau du bond c.globalAlpha = .85; ellipse(c, 0, wl + .05, w, .4 + k * .05, '#dff3ff'); c.globalAlpha = .95; ellipse(c, -w * .45, wl - .08 + k * .08, w * .35, .17, '#fff'); ellipse(c, w * .4, wl - .05 - k * .08, w * .3, .15, '#fff');
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = .14; c.lineCap = 'round'; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * w * .9, wl + .05); c.quadraticCurveTo(sg * (w * 1.3), wl + .3 + k * .1, sg * (w * 1.8), wl + .25); c.stroke(); }
    for (let i = 0; i < 4; i++) { const h = Math.abs(Math.sin(t * 4 + i * 1.7 + e.phase)); c.globalAlpha = .9 * h; circle(c, (i - 1.5) * w * .5 + Math.sin(t * 5 + i) * .3, wl - h * (1.1 + (i % 2) * .5), .13 + (i % 2) * .05, '#eaf7ff'); } c.restore(); };
  const E = {
    bat(c, e, t) { const flap = Math.sin(t * 13 + e.phase) * 1.3, col = e.color; c.fillStyle = col; c.strokeStyle = shade(col, .45); c.lineWidth = .16; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * .5, 0); c.quadraticCurveTo(s * 2, -2.4 + flap, s * 3.2, -.6 + flap); c.lineTo(s * 2.5, .3); c.quadraticCurveTo(s * 1.9, -.25, s * 1.6, .7); c.quadraticCurveTo(s * .9, .25, s * .5, .7); c.closePath(); c.fill(); c.stroke(); } ellipse(c, 0, 0, .8, 1.1, shade(col, .6)); for (const s of [-1, 1]) { c.fillStyle = shade(col, .6); c.beginPath(); c.moveTo(s * .2, -.7); c.lineTo(s * .75, -1.65); c.lineTo(s * .8, -.3); c.fill(); ellipse(c, s * .3, -.2, .23, .14, e.elite ? '#fff' : '#ffbd55', -s * .3); } c.fillStyle = '#fff6db'; for (const x of [-.22, .22]) { c.beginPath(); c.moveTo(x - .1, .4); c.lineTo(x, .7); c.lineTo(x + .1, .4); c.fill(); } },
    owl(c, e, t) { const flap = Math.sin(t * 9 + e.phase) * .9, col = e.color; for (const s of [-1, 1]) { ellipse(c, s * 1.9, -.2 + flap * .5, 1.3, .6, shade(col, .8), s * (.6 - flap * .3)); } ellipse(c, 0, 0, 1.4, 1.7, col); ellipse(c, 0, .5, .9, 1, shade(col, 1.3)); for (const s of [-1, 1]) { c.fillStyle = col; c.beginPath(); c.moveTo(s * .6, -1.3); c.lineTo(s * 1.3, -2.4); c.lineTo(s * 1.4, -1); c.fill(); circle(c, s * .55, -.6, .5, '#fff'); circle(c, s * .55, -.6, .28, e.elite ? '#e23b3b' : '#222'); } c.fillStyle = '#ffb000'; c.beginPath(); c.moveTo(-.25, -.2); c.lineTo(.25, -.2); c.lineTo(0, .35); c.fill(); c.strokeStyle = shade(col, .5); c.lineWidth = .14; c.beginPath(); c.moveTo(-.9, -1.05); c.lineTo(-.3, -1.25); c.moveTo(.9, -1.05); c.lineTo(.3, -1.25); c.stroke(); },
    ghost(c, e, t) { c.globalAlpha *= .45 + .55 * Math.abs(Math.sin(e.age * 1.5 + e.phase)); c.fillStyle = e.color; c.beginPath(); c.arc(0, -.4, 1.4, Math.PI, 0); for (let i = 0; i <= 4; i++) c.lineTo(1.4 - i * .7, 1.6 + (i % 2 ? -.5 : 0) + Math.sin(t * 6 + i) * .15); c.closePath(); c.fill(); for (const s of [-1, 1]) { ellipse(c, s * .5, -.5, .3, .42, '#1b1030'); circle(c, s * .5 - .08, -.62, .1, '#fff'); } ellipse(c, 0, .35, .3, .2, '#1b1030'); },
    skull(c, e, t) { if (e.elite) for (let i = 0; i < 5; i++) ellipse(c, (i - 2) * .5, -1.6 - hash(i + t * 10 | 0) * .8, .3, .6, i % 2 ? '#ff8c2a' : '#ffd23f'); circle(c, 0, -.2, 1.3, e.color); c.fillStyle = e.color; c.fillRect(-.8, .6, 1.6, .9); for (const s of [-1, 1]) ellipse(c, s * .5, -.3, .4, .45, '#1b1030'); c.fillStyle = '#1b1030'; c.beginPath(); c.moveTo(-.15, .35); c.lineTo(.15, .35); c.lineTo(0, .6); c.fill(); for (let i = -1; i <= 1; i++) c.fillRect(i * .4 - .08, .9, .16, .5); },
    // ----- 16 nouveaux styles d'Halloween (unités : le monstre fait ~2 de large) + le coffre mystère -----
    pumpkin(c, e, t) { const col = e.color; c.fillStyle = '#3d7a2a'; c.fillRect(-.18, -1.9, .36, .7); for (const s of [-1, 1]) ellipse(c, s * .75, 0, .8, 1.25, shade(col, .85)); ellipse(c, 0, 0, .95, 1.3, col); c.fillStyle = '#2a1500'; c.beginPath(); c.moveTo(-.75, -.2); c.lineTo(-.25, -.55); c.lineTo(-.3, .05); c.fill(); c.beginPath(); c.moveTo(.75, -.2); c.lineTo(.25, -.55); c.lineTo(.3, .05); c.fill(); c.beginPath(); c.moveTo(-.7, .4); for (let i = 0; i <= 6; i++) c.lineTo(-.7 + i * .233, .4 + (i % 2 ? .35 : .1) + (i === 3 ? .25 : 0)); c.lineTo(.7, .4); c.fill(); c.globalAlpha *= .6 + .4 * Math.abs(Math.sin(t * 5 + e.phase)); circle(c, 0, .15, .35, 'rgba(255,230,120,.35)'); },
    spider(c, e, t) { const col = e.color; c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = .08; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, -1); c.stroke(); c.strokeStyle = col; c.lineWidth = .22; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const a = -.9 + i * .6, w = Math.sin(t * 10 + i + e.phase) * .15; c.beginPath(); c.moveTo(s * .4, a * .4); c.lineTo(s * 1.6, a - .5 + w); c.lineTo(s * 2.1, a + .4 + w); c.stroke(); } ellipse(c, 0, .4, 1.1, 1.3, col); circle(c, 0, -.9, .6, shade(col, 1.3)); for (const s of [-1, 1]) { circle(c, s * .25, -1, .18, '#ff3a3a'); circle(c, s * .5, -.75, .12, '#ff3a3a'); } ellipse(c, 0, .5, .35, .5, e.elite ? '#ffd23f' : '#ff3a3a'); },
    crow(c, e, t) { const flap = Math.sin(t * 11 + e.phase), col = e.color; for (const s of [-1, 1]) { c.fillStyle = col; c.beginPath(); c.moveTo(s * .4, -.1); c.quadraticCurveTo(s * 1.8, -1.6 * flap - .6, s * 3.1, -.9 * flap + .2); c.lineTo(s * 2.6, .5); c.quadraticCurveTo(s * 1.5, .1, s * .5, .6); c.fill(); } ellipse(c, 0, .1, .75, 1, col); circle(c, 0, -.9, .5, col); c.fillStyle = '#ffb000'; c.beginPath(); c.moveTo(.35, -1); c.lineTo(1.1, -.8); c.lineTo(.35, -.6); c.fill(); circle(c, .2, -1.05, .12, '#fff'); circle(c, .22, -1.05, .06, '#000'); },
    wisp(c, e, t) { const col = e.color; c.globalAlpha *= .7 + .3 * Math.sin(t * 8 + e.phase); for (let i = 0; i < 5; i++) { const a = t * 4 + i * 1.26; c.globalAlpha *= .9; circle(c, Math.cos(a) * .9, Math.sin(a) * .9 + .3, .35, col); } c.globalAlpha = Math.min(1, c.globalAlpha * 2); c.fillStyle = col; c.beginPath(); c.moveTo(0, -1.7); c.quadraticCurveTo(1.1, -.4, .8, .5); c.quadraticCurveTo(0, 1.4, -.8, .5); c.quadraticCurveTo(-1.1, -.4, 0, -1.7); c.fill(); ellipse(c, 0, 0, .45, .7, '#fff'); for (const s of [-1, 1]) ellipse(c, s * .2, -.1, .1, .2, '#1b1030'); },
    vampire(c, e, t) { const col = e.color, flap = Math.sin(t * 7 + e.phase) * .5; for (const s of [-1, 1]) { c.fillStyle = shade(col, .7); c.beginPath(); c.moveTo(s * .5, .2); c.quadraticCurveTo(s * 1.8, -.8 + flap, s * 2.6, .4 + flap); c.lineTo(s * 1.6, 1.5); c.lineTo(s * .5, 1.2); c.fill(); } c.fillStyle = col; c.beginPath(); c.moveTo(-.9, 1.7); c.lineTo(-.6, -.3); c.lineTo(.6, -.3); c.lineTo(.9, 1.7); c.fill(); c.fillStyle = '#fff'; c.fillRect(-.3, -.2, .6, .9); c.fillStyle = '#c2182b'; c.fillRect(-.08, -.1, .16, .6); circle(c, 0, -1, .75, '#e9e4f0'); c.fillStyle = '#111'; c.beginPath(); c.moveTo(-.8, -1.4); c.lineTo(0, -2); c.lineTo(.8, -1.4); c.lineTo(.4, -1.1); c.lineTo(-.4, -1.1); c.fill(); for (const s of [-1, 1]) { circle(c, s * .3, -1.05, .14, '#ff3a3a'); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(s * .25, -.5); c.lineTo(s * .4, -.5); c.lineTo(s * .32, -.2); c.fill(); } },
    witch(c, e, t) { const col = e.color, bob = Math.sin(t * 5 + e.phase) * .15; c.save(); c.translate(0, bob); c.strokeStyle = '#8a5a2b'; c.lineWidth = .22; c.beginPath(); c.moveTo(-2.4, 1); c.lineTo(1.2, .6); c.stroke(); c.fillStyle = '#d9b36a'; c.beginPath(); c.moveTo(-2.3, .6); c.lineTo(-3.3, .5); c.lineTo(-3.4, 1.6); c.lineTo(-2.2, 1.4); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(-.9, .6); c.lineTo(-.4, -.8); c.lineTo(.5, -.8); c.lineTo(.9, .6); c.fill(); circle(c, .05, -1.2, .55, '#a9d98f'); c.fillStyle = '#111'; c.beginPath(); c.moveTo(-.9, -1.4); c.lineTo(.9, -1.4); c.lineTo(.3, -1.5); c.lineTo(.1, -2.9); c.lineTo(-.4, -1.5); c.fill(); c.fillStyle = col; c.fillRect(-.35, -1.6, .7, .18); for (const s of [-1, 1]) circle(c, .05 + s * .2, -1.25, .1, '#1b1030'); c.restore(); },
    eyeball(c, e, t) { const col = e.color, look = Math.sin(t * 2 + e.phase) * .3; circle(c, 0, 0, 1.1, col); for (let i = 0; i < 5; i++) { const a = i * 1.3 + e.phase; c.strokeStyle = 'rgba(220,40,40,.7)'; c.lineWidth = .08; c.beginPath(); c.moveTo(Math.cos(a) * 1.05, Math.sin(a) * 1.05); c.quadraticCurveTo(Math.cos(a + .4) * .6, Math.sin(a + .4) * .6, Math.cos(a + .2) * .35, Math.sin(a + .2) * .35); c.stroke(); } circle(c, look, 0, .55, e.elite ? '#ff8c2a' : '#3b8ad6'); circle(c, look, 0, .28, '#000'); circle(c, look - .15, -.15, .1, '#fff'); for (const s of [-1, 1]) { c.strokeStyle = col; c.lineWidth = .18; c.beginPath(); c.moveTo(s * .9, .7); c.quadraticCurveTo(s * 1.4, 1.4 + Math.sin(t * 9 + s) * .3, s * .6, 1.9); c.stroke(); } },
    blackcat(c, e, t) { const col = e.color, tail = Math.sin(t * 6 + e.phase) * .6; c.strokeStyle = col; c.lineWidth = .3; c.beginPath(); c.moveTo(-1, .6); c.quadraticCurveTo(-2.2, .2 + tail, -2.4, -.9 + tail); c.stroke(); ellipse(c, -.2, .6, 1.4, .8, col); circle(c, .9, -.4, .75, col); for (const s of [-1, 1]) { c.fillStyle = col; c.beginPath(); c.moveTo(.9 + s * .3, -1); c.lineTo(.9 + s * .7, -1.6); c.lineTo(.9 + s * .7, -.8); c.fill(); ellipse(c, .9 + s * .3, -.45, .17, .11, e.elite ? '#ff3a3a' : '#c6ff4a'); circle(c, .9 + s * .3, -.45, .05, '#000'); } for (let i = 0; i < 2; i++) ellipse(c, -.6 + i * .9, 1.4, .28, .18, shade(col, 1.4)); },
    mummy(c, e, t) { const col = e.color; ellipse(c, 0, .3, 1, 1.5, shade(col, .75)); circle(c, 0, -1.1, .8, col); for (let i = 0; i < 7; i++) { c.strokeStyle = shade(col, 1.15); c.lineWidth = .14; c.beginPath(); c.moveTo(-1, -1.8 + i * .55); c.lineTo(1, -1.6 + i * .55 + (i % 2 ? .15 : -.1)); c.stroke(); } for (const s of [-1, 1]) { ellipse(c, s * .3, -1.15, .22, .16, '#1b1030'); circle(c, s * .3, -1.15, .07, e.elite ? '#ff3a3a' : '#ffd23f'); } for (const s of [-1, 1]) { c.strokeStyle = col; c.lineWidth = .3; c.beginPath(); c.moveTo(s * .8, -.3); c.lineTo(s * 1.9, -.5 + Math.sin(t * 3 + s) * .2); c.stroke(); } c.strokeStyle = shade(col, 1.2); c.lineWidth = .1; c.beginPath(); c.moveTo(1, .6); c.quadraticCurveTo(1.8, 1.4, 1.2, 2.2); c.stroke(); },
    candy(c, e, t) { const col = e.color; c.save(); c.rotate(Math.sin(t * 4 + e.phase) * .3); for (const s of [-1, 1]) { c.fillStyle = shade(col, .8); c.beginPath(); c.moveTo(s * .9, -.1); c.lineTo(s * 1.9, -.8); c.lineTo(s * 1.7, 0); c.lineTo(s * 1.9, .8); c.closePath(); c.fill(); } circle(c, 0, 0, 1, col); for (let i = -1; i <= 1; i++) { c.strokeStyle = '#fff'; c.lineWidth = .18; c.beginPath(); c.moveTo(i * .5 - .25, -.9); c.lineTo(i * .5 + .25, .9); c.stroke(); } for (const s of [-1, 1]) ellipse(c, s * .3, -.2, .16, .2, '#1b1030'); c.fillStyle = '#1b1030'; c.beginPath(); c.moveTo(-.4, .35); c.lineTo(.4, .35); c.lineTo(0, .7); c.fill(); for (const s of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(s * .25, .38); c.lineTo(s * .1, .38); c.lineTo(s * .18, .6); c.fill(); } c.restore(); },
    imp(c, e, t) { const col = e.color, flap = Math.sin(t * 12 + e.phase) * .6; for (const s of [-1, 1]) { c.fillStyle = shade(col, .6); c.beginPath(); c.moveTo(s * .5, -.2); c.lineTo(s * 1.8, -1.2 + flap); c.lineTo(s * 2, .2 + flap); c.lineTo(s * .7, .5); c.fill(); } ellipse(c, 0, .1, .9, 1.1, col); circle(c, 0, -1, .6, col); for (const s of [-1, 1]) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(s * .3, -1.4); c.lineTo(s * .6, -2.1); c.lineTo(s * .7, -1.3); c.fill(); ellipse(c, s * .25, -1.05, .14, .1, '#ffd23f'); } c.strokeStyle = col; c.lineWidth = .16; c.beginPath(); c.moveTo(.6, .9); c.quadraticCurveTo(1.6, 1.6, 1.2, 2.3); c.stroke(); c.fillStyle = col; c.beginPath(); c.moveTo(1, 2.1); c.lineTo(1.5, 2.6); c.lineTo(.9, 2.6); c.fill(); c.strokeStyle = '#1b1030'; c.lineWidth = .1; c.beginPath(); c.arc(0, -.75, .3, .2, Math.PI - .2); c.stroke(); },
    zombie(c, e, t) { const col = e.color; circle(c, 0, 0, 1.35, col); ellipse(c, 0, -1.2, 1.1, .45, shade(col, .7)); for (let i = 0; i < 4; i++) c.fillRect(-.9 + i * .5, -1.55, .12, .5); for (const s of [-1, 1]) { ellipse(c, s * .5, -.3, .33, .38, '#fff'); circle(c, s * .5 + (s < 0 ? .1 : -.05), -.3 + (s < 0 ? .08 : -.05), .15, '#1b1030'); } c.strokeStyle = '#1b1030'; c.lineWidth = .14; c.beginPath(); c.moveTo(-.8, .6); for (let i = 1; i <= 6; i++) c.lineTo(-.8 + i * .27, .6 + (i % 2 ? .25 : 0)); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-.4, .62, .2, .22); c.fillRect(.2, .62, .2, .22); c.strokeStyle = shade(col, .5); c.lineWidth = .1; c.beginPath(); c.moveTo(.4, -.9); c.lineTo(.9, -.4); c.lineTo(.6, .1); c.stroke(); },
    scarecrow(c, e, t) { const col = e.color, sway = Math.sin(t * 3 + e.phase) * .1; c.save(); c.rotate(sway); c.fillStyle = '#6b4a2a'; c.fillRect(-.12, -.5, .24, 3); c.fillRect(-2.1, -.3, 4.2, .22); c.fillStyle = col; c.beginPath(); c.moveTo(-1, .2); c.lineTo(1, .2); c.lineTo(1.2, 1.8); c.lineTo(-1.2, 1.8); c.fill(); for (const s of [-1, 1]) { c.fillStyle = '#e6c15a'; c.beginPath(); c.moveTo(s * 1.9, -.4); c.lineTo(s * 2.5, -.1 + s * .1); c.lineTo(s * 2.3, .3); c.fill(); } ellipse(c, 0, -1.2, .9, 1, '#e6c15a'); c.fillStyle = '#4a2f14'; c.beginPath(); c.moveTo(-1.5, -1.7); c.lineTo(1.5, -1.7); c.lineTo(.8, -1.9); c.lineTo(.5, -2.9); c.lineTo(-.5, -2.9); c.lineTo(-.8, -1.9); c.fill(); for (const s of [-1, 1]) { c.strokeStyle = '#1b1030'; c.lineWidth = .14; c.beginPath(); c.moveTo(s * .55, -1.45); c.lineTo(s * .2, -1.1); c.moveTo(s * .2, -1.45); c.lineTo(s * .55, -1.1); c.stroke(); } c.strokeStyle = '#1b1030'; c.lineWidth = .12; c.beginPath(); c.moveTo(-.5, -.75); c.lineTo(.5, -.75); c.stroke(); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * .3, -.9); c.lineTo(i * .3, -.6); c.stroke(); } c.restore(); },
    frankie(c, e, t) { const col = e.color; c.fillStyle = '#2d3140'; c.fillRect(-1.3, .4, 2.6, 1.7); c.fillStyle = col; c.fillRect(-1.1, -1.5, 2.2, 2); c.fillStyle = '#111'; c.fillRect(-1.15, -1.9, 2.3, .6); for (const s of [-1, 1]) { c.fillStyle = '#8a8f99'; c.fillRect(s * 1.25 - .15, -.4, .3, .35); c.fillRect(s * 1.5 - .1, -.5, .2, .55); ellipse(c, s * .5, -.7, .3, .25, '#fff'); circle(c, s * .5, -.7, .12, '#1b1030'); } c.strokeStyle = '#1b1030'; c.lineWidth = .12; c.beginPath(); c.moveTo(-.6, .05); c.lineTo(.6, .05); c.stroke(); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * .35, -.1); c.lineTo(i * .35, .2); c.stroke(); } c.beginPath(); c.moveTo(.3, -1.4); c.lineTo(.9, -1); c.stroke(); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(.45 + i * .15, -1.35 + i * .1); c.lineTo(.6 + i * .15, -1.5 + i * .1); c.stroke(); } if (e.elite) for (let i = 0; i < 3; i++) { c.strokeStyle = '#7fd4ff'; c.beginPath(); c.moveTo(-1.5, -.4); c.lineTo(-1.9 - Math.sin(t * 20 + i) * .3, -.3 + i * .2); c.stroke(); } },
    cauldron(c, e, t) { const col = e.color, boil = Math.sin(t * 8 + e.phase); c.fillStyle = '#7dff9a'; c.beginPath(); c.ellipse(0, -.7, 1.3, .45, 0, 0, TAU); c.fill(); for (let i = 0; i < 4; i++) circle(c, -.9 + i * .6, -1.1 - Math.abs(Math.sin(t * 5 + i + e.phase)) * .8, .22 + (i % 2) * .1, 'rgba(125,255,154,.8)'); c.fillStyle = col; c.beginPath(); c.moveTo(-1.5, -.6); c.quadraticCurveTo(-1.6, 1.6, 0, 1.7); c.quadraticCurveTo(1.6, 1.6, 1.5, -.6); c.fill(); c.fillStyle = shade(col, 1.5); c.fillRect(-1.6, -.85, 3.2, .35); for (const s of [-1, 1]) { ellipse(c, s * 1.5, -.4, .18, .3, shade(col, .8)); c.fillStyle = col; c.fillRect(s * .8 - .18, 1.5, .36, .5); } ellipse(c, -.4, .4 + boil * .05, .3, .35, '#fff'); circle(c, -.4, .4, .13, '#1b1030'); ellipse(c, .4, .4 - boil * .05, .3, .35, '#fff'); circle(c, .4, .4, .13, '#1b1030'); },
    reaper(c, e, t) { const col = e.color; c.globalAlpha *= .75 + .25 * Math.sin(e.age * 2 + e.phase); c.strokeStyle = '#6b4a2a'; c.lineWidth = .18; c.beginPath(); c.moveTo(1.3, 2.2); c.lineTo(1.6, -2.4); c.stroke(); c.fillStyle = '#cfd6e0'; c.beginPath(); c.moveTo(1.6, -2.4); c.quadraticCurveTo(.2, -3.2, -.6, -2.2); c.quadraticCurveTo(.3, -2.5, 1.55, -1.9); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(0, -2.2); c.lineTo(-1.4, 1.2); for (let i = 0; i <= 5; i++) c.lineTo(-1.4 + i * .56, 2 + (i % 2 ? -.5 : 0) + Math.sin(t * 5 + i) * .15); c.lineTo(1.4, 1.2); c.closePath(); c.fill(); ellipse(c, 0, -1.2, .5, .6, '#111'); for (const s of [-1, 1]) circle(c, s * .2, -1.25, .11, e.elite ? '#ffd23f' : '#ff3a3a'); c.strokeStyle = col; c.lineWidth = .25; c.beginPath(); c.moveTo(.6, -.2); c.lineTo(1.4, -.6); c.stroke(); },
    // Bombe magique : grosse bombe noire à gros yeux qui roulent, mèche allumée, posée dans un cercle magique violet
    // avec des runes qui tournent et le décompte au-dessus. Elle tremble de plus en plus quand la fin approche.
    rocher(c, e, t) { c.save(); c.rotate(t * 3 + e.phase); c.shadowColor = '#ff8c2a'; c.shadowBlur = 10; poly(c, [[-1.5, -.4], [-.9, -1.4], [.3, -1.6], [1.5, -.7], [1.3, .8], [.2, 1.5], [-1.1, 1.1]], e.color); poly(c, [[-.9, -.6], [-.3, -1.1], [.6, -.9], [.4, -.1]], shade(e.color, 1.35)); c.restore(); for (let i = 0; i < 3; i++) circle(c, Math.cos(t * 12 + i * 2) * 1.6, 1.2 + Math.sin(t * 9 + i) * .4, .25, i % 2 ? '#ff8c2a' : '#ffd23f'); },
    cristal(c, e, t) { const g = .75 + .25 * Math.sin(t * 5 + e.phase); c.shadowColor = '#7fd4ff'; c.shadowBlur = 18 * g; poly(c, [[0, -2.4], [1.1, -.6], [.7, 1.6], [-.7, 1.6], [-1.1, -.6]], '#3f9fe0'); poly(c, [[0, -2.4], [1.1, -.6], [.2, -.4]], '#bfefff'); poly(c, [[-1.1, -.6], [0, -2.4], [-.2, -.4]], '#7fd4ff'); poly(c, [[-.7, 1.6], [.7, 1.6], [.2, -.4], [-.2, -.4]], '#2a6fb8'); c.shadowBlur = 0; for (let i = 0; i < 4; i++) star(c, Math.cos(t * 2 + i * 1.6) * 1.9, -.4 + Math.sin(t * 3 + i) * 1.4, .22, '#fff', 4); c.globalAlpha *= .5; c.strokeStyle = '#dff4ff'; c.lineWidth = .1; c.beginPath(); c.arc(0, -.4, 2.2 + Math.sin(t * 4) * .2, 0, TAU); c.stroke(); },
    bouclier(c, e, t) { const k = e.hp / e.maxHp; c.save(); c.shadowColor = '#4fc3ff'; c.shadowBlur = 14; c.fillStyle = '#1e4fb8'; c.beginPath(); c.moveTo(-1.5, -1.4); c.lineTo(1.5, -1.4); c.lineTo(1.5, .3); c.quadraticCurveTo(1.5, 1.4, 0, 2); c.quadraticCurveTo(-1.5, 1.4, -1.5, .3); c.closePath(); c.fill(); c.shadowBlur = 0; c.strokeStyle = '#9fe0ff'; c.lineWidth = .22; c.stroke(); c.fillStyle = 'rgba(159,224,255,' + (.35 + .45 * k) + ')'; c.beginPath(); c.moveTo(-1.1, -1); c.lineTo(1.1, -1); c.lineTo(1.1, .3); c.quadraticCurveTo(1.1, 1.1, 0, 1.55); c.quadraticCurveTo(-1.1, 1.1, -1.1, .3); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = .18; c.beginPath(); c.moveTo(0, -.9); c.lineTo(0, 1.3); c.moveTo(-.9, -.2); c.lineTo(.9, -.2); c.stroke(); c.globalAlpha = .6; c.strokeStyle = '#fff'; c.lineWidth = .12; c.beginPath(); c.arc(0, .1, 2 + Math.sin(t * 5) * .2, 0, TAU); c.stroke(); c.restore(); },
    orbe(c, e, t) { const pul = 1 + Math.sin(t * 5 + e.phase) * .06, col = e.done ? '#7dff9a' : '#ffd23f'; c.save(); c.scale(pul, pul); c.shadowColor = col; c.shadowBlur = 18; circle(c, 0, 0, 1.4, col); c.shadowBlur = 0; circle(c, -.4, -.45, .35, 'rgba(255,255,255,.6)'); c.fillStyle = '#1b2436'; c.font = 'bold 1.6px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(e.num || '?'), 0, .1); if (e.done) { c.strokeStyle = '#1b2436'; c.lineWidth = .18; c.beginPath(); c.moveTo(-.9, 1); c.lineTo(.9, -1); c.stroke(); } c.restore(); },
    feu(c, e, t) { c.shadowColor = '#ff6a1a'; c.shadowBlur = 18; for (let i = 0; i < 4; i++) { const a = t * 12 + i * 1.6; ellipse(c, Math.cos(a) * .5, -.4 - i * .35 + Math.sin(a) * .3, .5, .9, i % 2 ? '#ffd23f' : '#ff6a1a'); } circle(c, 0, 0, 1, '#ff6a1a'); circle(c, 0, .1, .55, '#fff3a0'); c.shadowBlur = 0; },
    poison(c, e, t) { c.shadowColor = '#7dff3a'; c.shadowBlur = 12; ellipse(c, 0, 0, 1, .8 + Math.sin(t * 10) * .15, '#5fcc2a'); for (let i = 0; i < 3; i++) circle(c, Math.cos(t * 6 + i * 2) * .6, Math.sin(t * 7 + i * 2) * .4, .22, '#c6ff8a'); c.shadowBlur = 0; },
    magieNoire(c, e, t) { c.shadowColor = '#b14fff'; c.shadowBlur = 20; for (let i = 3; i >= 0; i--) { c.globalAlpha = .4 + i * .15; circle(c, 0, 0, 1.3 - i * .3, ['#1b0a2e', '#4a1f6e', '#8a3fd0', '#c47dff'][i]); } c.globalAlpha = 1; c.strokeStyle = '#c47dff'; c.lineWidth = .14; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 1.4 + i * .3, t * 4 + i, t * 4 + i + 2); c.stroke(); } c.shadowBlur = 0; },
    soigneur(c, e, t) { const col = e.color, bob = Math.sin(t * 4 + e.phase) * .12; c.save(); c.translate(0, bob); ellipse(c, 0, .4, 1.2, 1.3, '#f4f7ff'); c.fillStyle = col; c.fillRect(-.9, -.2, 1.8, .5); circle(c, 0, -1, .85, '#f6d3b5'); c.fillStyle = '#fff'; c.fillRect(-.9, -1.9, 1.8, .55); c.fillStyle = '#e23b3b'; c.fillRect(-.12, -1.85, .24, .45); c.fillRect(-.35, -1.75, .7, .22); circle(c, -.3, -1.05, .11, '#1b1030'); circle(c, .3, -1.05, .11, '#1b1030'); c.strokeStyle = '#c0392b'; c.lineWidth = .08; c.beginPath(); c.arc(0, -.8, .25, .3, Math.PI - .3); c.stroke(); c.fillStyle = col; c.fillRect(-.2, .1, .4, 1.1); c.fillRect(-.55, .45, 1.1, .4); c.globalAlpha = .5 + Math.sin(t * 6) * .3; c.strokeStyle = '#7dff9a'; c.lineWidth = .12; c.beginPath(); c.arc(0, 0, 2.1, 0, TAU); c.stroke(); c.restore(); },
    sorcier(c, e, t) { const col = e.color, bob = Math.sin(t * 3 + e.phase) * .15; c.save(); c.translate(0, bob); c.fillStyle = col; c.beginPath(); c.moveTo(-1.3, 1.8); c.lineTo(1.3, 1.8); c.lineTo(.8, -.4); c.lineTo(-.8, -.4); c.closePath(); c.fill(); circle(c, 0, -.8, .7, '#2b1a3e'); circle(c, -.25, -.85, .14, '#ff3a3a'); circle(c, .25, -.85, .14, '#ff3a3a'); c.fillStyle = col; c.beginPath(); c.moveTo(-1.1, -1.2); c.lineTo(1.1, -1.2); c.lineTo(.3, -3); c.closePath(); c.fill(); c.strokeStyle = '#8a5a2b'; c.lineWidth = .18; c.beginPath(); c.moveTo(1.1, 1.6); c.lineTo(1.5, -1.4); c.stroke(); c.shadowColor = '#c47dff'; c.shadowBlur = 10 + (e.spitFlash > 0 ? 14 : 0); circle(c, 1.5, -1.6, .35 + (e.spitFlash > 0 ? .2 : 0), '#c47dff'); c.restore(); },
    spectreGlace(c, e, t) { c.globalAlpha *= .55 + .45 * Math.abs(Math.sin(e.age * 1.5 + e.phase)); c.shadowColor = '#a9e9ff'; c.shadowBlur = 12; c.fillStyle = e.color; c.beginPath(); c.arc(0, -.4, 1.4, Math.PI, 0); for (let i = 0; i <= 4; i++) c.lineTo(1.4 - i * .7, 1.6 + (i % 2 ? -.5 : 0)); c.closePath(); c.fill(); c.shadowBlur = 0; for (const s of [-1, 1]) { ellipse(c, s * .5, -.5, .3, .42, '#1e4fb8'); } for (let i = 0; i < 5; i++) { const a = t * 3 + i * 1.26; star(c, Math.cos(a) * 1.9, Math.sin(a) * 1.3 - .3, .25, '#fff', 4); } },
    jongleur(c, e, t) { const col = e.color, bob = Math.sin(t * 5 + e.phase) * .12; c.save(); c.translate(0, bob); ellipse(c, 0, .7, 1.1, 1.1, '#ffd23f'); c.fillStyle = '#e23b3b'; for (let i = -1; i <= 1; i++) c.fillRect(i * .5 - .12, -.2, .24, 1.6); circle(c, 0, -.9, .75, '#f6d3b5'); c.fillStyle = col; c.beginPath(); c.moveTo(-.9, -1.3); c.lineTo(.9, -1.3); c.lineTo(0, -2.4); c.closePath(); c.fill(); circle(c, -.25, -.95, .1, '#1b1030'); circle(c, .25, -.95, .1, '#1b1030'); c.strokeStyle = '#c0392b'; c.lineWidth = .08; c.beginPath(); c.arc(0, -.7, .25, .2, Math.PI - .2); c.stroke(); c.shadowColor = '#ff6a1a'; c.shadowBlur = 12; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; circle(c, Math.cos(a) * 1.4, -1.2 + Math.sin(a) * .9, .32, i % 2 ? '#ffd23f' : '#ff6a1a'); } c.restore(); },
    clownChoc(c, e, t) { const bob = Math.sin(t * 6 + e.phase) * .15; c.save(); c.translate(0, bob); ellipse(c, 0, .8, 1.2, 1, '#4fc3ff'); c.fillStyle = '#fff'; for (const [x, y] of [[-.5, .5], [.5, .5], [0, 1.2]]) circle(c, x, y, .22, '#fff'); circle(c, 0, -.7, .85, '#fff'); for (const s of [-1, 1]) { circle(c, s * 1, -1, .45, e.color); circle(c, s * .32, -.85, .14, '#1b1030'); } circle(c, 0, -.5, .28, '#ff3a3a'); c.strokeStyle = '#ff3a3a'; c.lineWidth = .12; c.beginPath(); c.arc(0, -.5, .55, .25, Math.PI - .25); c.stroke(); c.strokeStyle = '#ffe76c'; c.lineWidth = .14; c.shadowColor = '#ffe76c'; c.shadowBlur = 10; for (let i = 0; i < 4; i++) { const a = t * 9 + i * 1.57; c.beginPath(); c.moveTo(Math.cos(a) * 1.3, Math.sin(a) * 1.2); c.lineTo(Math.cos(a + .4) * 2, Math.sin(a + .4) * 1.8); c.lineTo(Math.cos(a + .2) * 2.5, Math.sin(a + .2) * 2.3); c.stroke(); } c.restore(); },
    crapaud(c, e, t) { const col = e.color, puff = 1 + Math.sin(t * 2 + e.phase) * .08; c.save(); c.scale(puff, 1); ellipse(c, 0, .4, 1.6, 1.1, col); ellipse(c, 0, .6, 1, .6, shade(col, 1.3)); for (const s of [-1, 1]) { circle(c, s * .8, -.6, .5, col); circle(c, s * .8, -.6, .3, '#ffd23f'); circle(c, s * .8, -.6, .14, '#1b1030'); ellipse(c, s * 1.5, 1.2, .5, .25, shade(col, .8)); } c.fillStyle = '#1b1030'; c.beginPath(); c.moveTo(-.7, .1); c.quadraticCurveTo(0, .5 + (e.spitFlash > 0 ? .4 : 0), .7, .1); c.fill(); for (let i = 0; i < 4; i++) circle(c, -1 + i * .65, -.1, .12, shade(col, .7)); c.restore(); },
    dragonnet(c, e, t) { const col = e.color, flap = Math.sin(t * 10 + e.phase); c.save(); for (const s of [-1, 1]) { c.fillStyle = shade(col, .8); c.beginPath(); c.moveTo(s * .6, -.2); c.quadraticCurveTo(s * 2, -1.8 - flap * .8, s * 2.6, -.4 - flap * .6); c.quadraticCurveTo(s * 1.8, .4, s * .6, .5); c.fill(); } ellipse(c, 0, .3, 1.1, 1.2, col); ellipse(c, 0, .5, .6, .8, '#ffd27a'); circle(c, .3, -1, .8, col); for (const [x, y] of [[-.1, -1.6], [.4, -1.7]]) { c.fillStyle = '#ffd27a'; c.beginPath(); c.moveTo(x - .15, y + .3); c.lineTo(x, y - .4); c.lineTo(x + .15, y + .3); c.fill(); } circle(c, .55, -1.1, .14, '#1b1030'); c.fillStyle = col; c.beginPath(); c.moveTo(.9, -.9); c.lineTo(1.6, -.7); c.lineTo(.9, -.5); c.fill(); c.strokeStyle = col; c.lineWidth = .3; c.beginPath(); c.moveTo(-.8, 1); c.quadraticCurveTo(-1.8, 1.2, -2.2, .4 + Math.sin(t * 4) * .3); c.stroke(); if (e.spitFlash > 0) { c.shadowColor = '#ff6a1a'; c.shadowBlur = 16; circle(c, 1.7, -.7, .45, '#ff6a1a'); } c.restore(); },
    robotGlace(c, e, t) { const col = e.color; c.save(); c.fillStyle = col; c.strokeStyle = '#1e4fb8'; c.lineWidth = .14; c.beginPath(); c.roundRect(-1.1, -.4, 2.2, 1.9, .3); c.fill(); c.stroke(); c.beginPath(); c.roundRect(-.9, -1.9, 1.8, 1.3, .3); c.fill(); c.stroke(); for (const s of [-1, 1]) { circle(c, s * .4, -1.25, .28, '#1e4fb8'); circle(c, s * .4, -1.25, .12, '#fff'); c.fillStyle = '#1e4fb8'; c.fillRect(s * 1.1 - .15, -.1, .3, 1.2); } c.fillStyle = '#1e4fb8'; c.fillRect(-.5, .2, 1, .25); c.fillRect(-.1, -2.3, .2, .45); circle(c, 0, -2.4, .2, '#a9e9ff'); c.shadowColor = '#a9e9ff'; c.shadowBlur = 12; c.strokeStyle = '#fff'; c.lineWidth = .12; for (let i = 0; i < 6; i++) { const a = t * 2 + i * 1.05; c.beginPath(); c.moveTo(Math.cos(a) * 1.4, Math.sin(a) * 1.4); c.lineTo(Math.cos(a) * 2, Math.sin(a) * 2); c.stroke(); } c.restore(); },
    cible(c, e, t) { const bob = Math.sin(t * 3 + e.phase) * .2; c.save(); c.translate(0, bob); c.fillStyle = '#8a5a2b'; c.fillRect(-.15, 1.2, .3, 1.4); for (const [r, col] of [[1.7, '#ff3a3a'], [1.3, '#fff'], [.9, '#ff3a3a'], [.5, '#fff'], [.22, '#ffd23f']]) circle(c, 0, 0, r, col); c.globalAlpha = .5; circle(c, -.5, -.6, .35, '#fff'); c.restore(); },
    // Panneau de bois sur un poteau qui se lève (e.panel.up 0→1) : le brigand (masque, chapeau, sac d'or) ou un civil (dame au chapeau / enfant au ballon)
    brigand(c, e, t) { panelBoard(c, e, t, (c) => { c.fillStyle = '#e8b089'; circle(c, 0, -.55, .55, '#e8b089'); c.fillStyle = '#1b1b1b'; c.fillRect(-.6, -.75, 1.2, .32); c.fillStyle = '#fff'; for (const s of [-1, 1]) circle(c, s * .25, -.6, .1, '#fff'); c.fillStyle = '#3b2a1e'; c.fillRect(-.7, -1.25, 1.4, .25); c.fillRect(-.45, -1.65, .9, .45); c.fillStyle = '#c8322a'; c.fillRect(-.55, .05, 1.1, .9); c.fillStyle = '#1b1b1b'; for (let i = 0; i < 3; i++) c.fillRect(-.55, .15 + i * .3, 1.1, .12); c.fillStyle = '#8a5a2b'; circle(c, .95, .55, .42, '#8a5a2b'); c.fillStyle = '#ffd23f'; c.font = 'bold .5px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', .95, .58); c.fillStyle = '#e8b089'; c.fillRect(-1.05, .15, .35, .55); }); },
    civil(c, e, t) { panelBoard(c, e, t, (c) => { if (e.look) { c.fillStyle = '#f3c9a0'; circle(c, 0, -.55, .5, '#f3c9a0'); c.fillStyle = '#ff4f9a'; c.beginPath(); c.ellipse(0, -1.05, 1, .22, 0, 0, TAU); c.fill(); c.fillRect(-.5, -1.5, 1, .5); c.fillStyle = '#1b1b1b'; for (const s of [-1, 1]) circle(c, s * .2, -.6, .08, '#1b1b1b'); c.strokeStyle = '#c0392b'; c.lineWidth = .08; c.beginPath(); c.arc(0, -.35, .18, .2, Math.PI - .2); c.stroke(); c.fillStyle = '#5fb6ff'; c.beginPath(); c.moveTo(-.75, .95); c.lineTo(-.4, .05); c.lineTo(.4, .05); c.lineTo(.75, .95); c.closePath(); c.fill(); }
      else { c.fillStyle = '#ffd8a8'; circle(c, 0, -.5, .45, '#ffd8a8'); c.fillStyle = '#5a3a1e'; c.beginPath(); c.arc(0, -.6, .47, Math.PI, 0); c.fill(); c.fillStyle = '#1b1b1b'; for (const s of [-1, 1]) circle(c, s * .17, -.52, .07, '#1b1b1b'); c.strokeStyle = '#c0392b'; c.lineWidth = .07; c.beginPath(); c.arc(0, -.32, .14, .2, Math.PI - .2); c.stroke(); c.fillStyle = '#45b84a'; c.fillRect(-.42, 0, .84, .85); c.strokeStyle = '#fff'; c.lineWidth = .05; c.beginPath(); c.moveTo(.42, .3); c.quadraticCurveTo(.9, -.3, 1, -1); c.stroke(); circle(c, 1, -1.25, .32, '#ff3a3a'); circle(c, .9, -1.35, .1, 'rgba(255,255,255,.6)'); } }); },
    cibleAilee(c, e, t) { const flap = Math.sin(t * 16 + e.phase); c.save(); c.fillStyle = '#fff'; c.strokeStyle = '#d0d8e8'; c.lineWidth = .08; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * .9, -.2); c.quadraticCurveTo(sg * 2.2, -1.6 - flap * .9, sg * 2.9, -.3 - flap * .7); c.quadraticCurveTo(sg * 2, .5, sg * .9, .4); c.fill(); c.stroke(); }
      for (const [r, col] of [[1.3, '#ff3a3a'], [1, '#fff'], [.68, '#ff3a3a'], [.36, '#fff'], [.16, '#ffd23f']]) circle(c, 0, 0, r, col); c.globalAlpha = .5; circle(c, -.4, -.45, .25, '#fff'); c.restore(); },
    cadeau(c, e, t) { const bob = Math.sin(t * 4 + e.phase) * .15; c.save(); c.translate(0, bob); for (let i = 0; i < 8; i++) { const a = t * 2.5 + i * .785, rr = 2.2 + Math.sin(t * 5 + i) * .3; star(c, Math.cos(a) * rr, Math.sin(a) * rr * .8, .3 + .1 * Math.sin(t * 9 + i), i % 2 ? '#fff' : '#ffd23f'); } box(c, -1.3, -.6, 2.6, 1.8, .2, e.color); box(c, -1.4, -1.1, 2.8, .6, .2, shade(e.color, 1.2)); c.fillStyle = '#ffd23f'; c.fillRect(-.22, -1.1, .44, 2.3); c.fillRect(-1.4, -.95, 2.8, .36); for (const sgn of [-1, 1]) { ellipse(c, sgn * .5, -1.45, .5, .32, '#ffd23f', sgn * .5); } circle(c, 0, -1.3, .22, '#ffe36b'); c.restore(); },
    bombeMagique(c, e, t) {
      const fuse = e.fuse == null ? e.def.fuse : e.fuse, urgent = fuse < 1, tremble = (3 - fuse) * .06, heat = Math.pow(Math.max(0, Math.min(1, 1 - fuse / (e.def.fuse || 3))), 1.4), hot = (a, b) => Math.round(a + (b - a) * heat), body = 'rgb(' + hot(35, 240) + ',' + hot(32, 40) + ',' + hot(43, 30) + ')', shine = 'rgb(' + hot(74, 255) + ',' + hot(69, 120) + ',' + hot(86, 110) + ')'; c.save(); c.translate(Math.sin(t * 50) * tremble, Math.cos(t * 43) * tremble);
      c.save(); c.scale(1, .42); c.strokeStyle = urgent ? '#ff4fd8' : '#b14fff'; c.shadowColor = '#b14fff'; c.shadowBlur = 16; c.lineWidth = .18; for (const [rr, dir] of [[3.1, 1], [2.5, -1]]) { c.save(); c.rotate(t * 1.6 * dir); c.setLineDash(rr > 3 ? [.5, .3] : []); c.beginPath(); c.arc(0, 2.2, rr, 0, TAU); c.stroke(); c.setLineDash([]); c.restore(); }
      c.fillStyle = '#e5bfff'; for (let i = 0; i < 8; i++) { const a = t * 1.6 + i * TAU / 8; star(c, Math.cos(a) * 2.8, 2.2 + Math.sin(a) * 2.8, .28, i % 2 ? '#fff' : '#e5bfff', 4); } c.restore();
      c.strokeStyle = '#d9c9a0'; c.lineWidth = .16; c.beginPath(); c.moveTo(.5, -1.5); c.quadraticCurveTo(1.1, -2.4, .7, -2.9); c.stroke(); star(c, .7, -2.9, .35 + Math.sin(t * 25) * .12, Math.sin(t * 30) > 0 ? '#fff' : '#ff8c2a');
      if (heat > .35) { c.shadowColor = '#ff2a2a'; c.shadowBlur = (heat - .35) * (26 + Math.sin(t * (10 + heat * 30)) * 8); }   // elle chauffe : rouge de plus en plus vif et halo qui pulse de plus en plus vite
      circle(c, 0, 0, 1.6, body); c.shadowBlur = 0; circle(c, -.5, -.5, .55, shine); box(c, -.4, -1.75, .8, .4, .1, '#6a6a74');
      for (const sx of [-.55, .55]) { ellipse(c, sx, -.15, .5, .6, '#fff'); const look = Math.sin(t * 7 + sx) * .18; circle(c, sx + look, -.1 + Math.cos(t * 5) * .1, .24, '#111'); circle(c, sx + look + .08, -.2, .08, '#fff'); }
      c.strokeStyle = '#fff'; c.lineWidth = .12; c.beginPath(); if (urgent) c.arc(0, .95, .32, Math.PI, 0); else c.arc(0, .55, .4, .15, Math.PI - .15); c.stroke();
      c.fillStyle = urgent ? '#ff4fd8' : '#fff'; c.font = 'bold 1.3px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#000'; c.shadowBlur = 4; c.fillText(String(Math.max(1, Math.ceil(fuse))), 0, -3.2); c.restore();
    },
    bateauVolant(c, e, t) { c.save(); c.rotate(Math.sin(t * 1.6 + e.phase) * .05); shipSprite(c, t, e.flash > 0 ? .15 : 0, 1); for (let i = 0; i < e.def.hits; i++) { const left = i < e.hp; c.globalAlpha = left ? 1 : .35; heart(c, (i - 1) * 1.1, -5.9, .42, left ? '#ff4f6b' : '#555'); } c.globalAlpha = 1; c.restore(); },
    requin(c, e, t) { const col = e.color, bob = Math.sin(t * 2.2 + e.phase) * .2; c.save(); c.translate(0, bob); c.fillStyle = col; c.beginPath(); c.moveTo(-2.6, .3); c.lineTo(-3.4, -1.3); c.lineTo(-2.2, -.2); c.lineTo(-3.3, 1.1); c.closePath(); c.fill(); ellipse(c, 0, .2, 2.4, .95, col); ellipse(c, .3, .55, 2, .5, shade(col, 1.35)); c.fillStyle = col; c.beginPath(); c.moveTo(-.6, -.7); c.lineTo(.1, -2.4); c.lineTo(.9, -.7); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(.8, .55); for (let i = 0; i < 5; i++) { c.lineTo(1 + i * .28, i % 2 ? .55 : .95); } c.lineTo(2.3, .55); c.closePath(); c.fill(); circle(c, 1.5, -.25, .26, '#fff'); circle(c, 1.58, -.22, .13, '#111'); c.restore(); },
    piranha(c, e, t) { const col = e.color, bob = Math.sin(t * 3 + e.phase) * .18, bite = Math.sin(t * 9 + e.phase) > 0; c.save(); c.translate(0, bob); c.fillStyle = col; c.beginPath(); c.moveTo(-1, 0); c.lineTo(-1.9, -.8); c.lineTo(-1.7, 0); c.lineTo(-1.9, .8); c.closePath(); c.fill(); ellipse(c, 0, 0, 1.2, .95, col); ellipse(c, .1, .3, .9, .45, shade(col, 1.3)); c.fillStyle = '#5a1420'; c.beginPath(); c.moveTo(.3, .15); c.lineTo(1.3, bite ? -.35 : -.1); c.lineTo(1.3, bite ? .6 : .35); c.closePath(); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(.5 + i * .25, bite ? -.05 : .1); c.lineTo(.62 + i * .25, .25); c.lineTo(.74 + i * .25, bite ? -.05 : .1); c.fill(); } circle(c, .35, -.4, .3, '#fff'); circle(c, .42, -.38, .15, '#111'); c.restore(); },
    pieuvre(c, e, t) { const col = e.color, bob = Math.sin(t * 2 + e.phase) * .2; c.save(); c.translate(0, bob); c.strokeStyle = col; c.lineWidth = .42; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x = -1.5 + i * .6, w = Math.sin(t * 4 + i * 1.1 + e.phase) * .5; c.beginPath(); c.moveTo(x, .6); c.quadraticCurveTo(x + w, 1.6, x + w * 1.6, 2.2); c.stroke(); } ellipse(c, 0, -.4, 1.4, 1.5, col); ellipse(c, -.4, -.9, .5, .35, shade(col, 1.3)); for (const sx of [-.5, .5]) { ellipse(c, sx, -.2, .42, .5, '#fff'); circle(c, sx + .08, -.1, .2, '#111'); } c.strokeStyle = '#3a1a4a'; c.lineWidth = .12; c.beginPath(); c.arc(0, .55, .3, .2, Math.PI - .2); c.stroke(); c.restore(); },
    crabe(c, e, t) { const col = e.color, bob = Math.sin(t * 2.4 + e.phase) * .15, snap = Math.sin(t * 6 + e.phase) * .25; c.save(); c.translate(0, bob); c.strokeStyle = shade(col, .8); c.lineWidth = .3; c.lineCap = 'round'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * 1.4, -.1 + i * .4); c.lineTo(s * (2.3 + i * .1), .4 + i * .45 + Math.sin(t * 5 + i) * .1); c.stroke(); } ellipse(c, 0, 0, 1.9, 1.15, col); ellipse(c, 0, .35, 1.4, .55, shade(col, 1.25)); for (const s of [-1, 1]) { c.strokeStyle = shade(col, .8); c.lineWidth = .32; c.beginPath(); c.moveTo(s * 1.5, -.5); c.lineTo(s * 2.5, -1.4); c.stroke(); circle(c, s * 2.6, -1.6, .55, col); c.fillStyle = '#0b1a2a'; c.beginPath(); c.moveTo(s * 2.6, -1.6); c.lineTo(s * 3.3, -1.9 - snap * s * s); c.lineTo(s * 3.2, -1.3); c.closePath(); c.fill(); c.strokeStyle = '#111'; c.lineWidth = .14; c.beginPath(); c.moveTo(s * .6, -.9); c.lineTo(s * .7, -1.7); c.stroke(); circle(c, s * .7, -1.8, .3, '#fff'); circle(c, s * .72, -1.78, .15, '#111'); } c.restore(); },
    meduse(c, e, t) { const col = e.color, bob = Math.sin(t * 2.6 + e.phase) * .3, pulse = 1 + Math.sin(t * 4 + e.phase) * .08; c.save(); c.translate(0, bob); c.shadowColor = col; c.shadowBlur = 14; c.strokeStyle = col; c.lineWidth = .18; c.globalAlpha = .85; for (let i = 0; i < 5; i++) { const x = -1 + i * .5; c.beginPath(); c.moveTo(x, .4); c.quadraticCurveTo(x + Math.sin(t * 3 + i + e.phase) * .5, 1.5, x + Math.sin(t * 3 + i * 1.3) * .6, 2.6); c.stroke(); } c.globalAlpha = .92; c.fillStyle = col; c.beginPath(); c.scale(pulse, 1); c.arc(0, .2, 1.45, Math.PI, 0); c.quadraticCurveTo(0, .9, -1.45, .2); c.fill(); c.globalAlpha = .5; ellipse(c, -.4, -.5, .5, .3, '#fff'); c.globalAlpha = 1; for (const sx of [-.45, .45]) { circle(c, sx, -.1, .2, '#111'); circle(c, sx + .06, -.16, .07, '#fff'); } c.restore(); },
    murene(c, e, t) { c.save(); c.scale(.85, .6); E.serpentMer(c, e, t); c.restore(); circle(c, 2.1, -.55, .22, '#ffe36a'); circle(c, 2.16, -.55, .1, '#111'); },
    tortueGeante(c, e, t) { const col = e.color, bob = Math.sin(t * 1.8 + e.phase) * .15; c.save(); c.translate(0, bob); for (const sg of [-1, 1]) ellipse(c, sg * 2.2, .5 + Math.sin(t * 3 + sg) * .15, .9, .35, shade(col, .8), sg * .4); ellipse(c, 0, .3, 2.3, 1.5, shade(col, .75)); ellipse(c, 0, .1, 2, 1.25, col); c.strokeStyle = shade(col, .55); c.lineWidth = .14; for (const [x, y] of [[-.9, 0], [.9, 0], [0, -.6], [0, .6], [-.5, -.3], [.5, .3]]) { c.beginPath(); c.arc(x, y, .5, 0, TAU); c.stroke(); } circle(c, 2.6, -.4, .75, shade(col, 1.2)); circle(c, 2.85, -.55, .18, '#fff'); circle(c, 2.9, -.55, .09, '#111'); c.restore(); },
    poissonVolant(c, e, t) { const col = e.color, flap = Math.sin(t * 14 + e.phase) * .9; c.save(); c.fillStyle = shade(col, 1.3); for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(-.2, 0); c.quadraticCurveTo(sg * 1.2, -1.8 - flap * sg * 0 - flap, sg * 2.6, -.4 - flap * .6); c.quadraticCurveTo(sg * 1.4, .4, -.2, .4); c.fill(); } ellipse(c, 0, .2, 1.5, .6, col); ellipse(c, .2, .35, 1.1, .3, shade(col, 1.4)); c.fillStyle = col; c.beginPath(); c.moveTo(-1.4, .2); c.lineTo(-2.2, -.5); c.lineTo(-2.1, .9); c.closePath(); c.fill(); circle(c, 1, -.05, .22, '#fff'); circle(c, 1.07, -.05, .1, '#111'); c.restore(); },
    chaloupe(c, e, t) { hullSprite(c, t, { len: 1.8, masts: 1, mastH: 2.2, cannons: 1, flag: true, flash: e.spitFlash || 0, phase: e.phase }); },
    brigantin(c, e, t) { hullSprite(c, t, { len: 2.4, masts: 2, mastH: 2.8, cannons: 2, flag: true, flash: e.spitFlash || 0, phase: e.phase }); },
    galion(c, e, t) { hullSprite(c, t, { len: 3, masts: 3, mastH: 3.4, cannons: 3, flag: true, hullCol: '#2b2b2b', sailCol: '#3d3d44', flash: e.spitFlash || 0, phase: e.phase }); },
    vaisseauFantome(c, e, t) { c.save(); c.shadowColor = '#9fe0ff'; c.shadowBlur = 16; hullSprite(c, t, { len: 2.4, masts: 2, mastH: 3, cannons: 2, flag: true, hullCol: '#6b8aa0', sailCol: '#d8f1fb', mastCol: '#8fb0c4', flash: e.spitFlash || 0, phase: e.phase }); c.restore(); },
    bouletCanon(c, e, t) { for (let i = 1; i < 4; i++) { c.globalAlpha = .35 - i * .08; circle(c, -i * .5, -i * .35, .5 + i * .18, '#555'); } c.globalAlpha = 1; circle(c, 0, 0, 1, '#1b1b1b'); circle(c, -.3, -.3, .3, '#4a4a4a'); },
    bouletFantome(c, e, t) { c.shadowColor = '#9fe0ff'; c.shadowBlur = 18; c.globalAlpha = .75 + .25 * Math.sin(t * 12); circle(c, 0, 0, .95, '#cfeeff'); circle(c, 0, 0, .5, '#fff'); c.shadowBlur = 0; c.globalAlpha = 1; },
    bombeNoire(c, e, t) { c.save(); c.scale(1.2, 1.2); E.bombe(c, e, t); c.restore(); },
    serpentMer(c, e, t) { const col = e.color, k = t * 3 + e.phase; c.save(); c.strokeStyle = col; c.lineWidth = .9; c.lineCap = 'round'; for (let s = 0; s < 3; s++) { const x0 = -2.6 + s * 1.6, h = .9 + .4 * Math.sin(k + s); c.beginPath(); c.moveTo(x0, 1.1); c.quadraticCurveTo(x0 + .8, 1.1 - h * 2.2, x0 + 1.6, 1.1); c.stroke(); } c.strokeStyle = shade(col, .7); c.lineWidth = .3; for (let s = 0; s < 3; s++) { const x0 = -2.6 + s * 1.6, h = .9 + .4 * Math.sin(k + s); for (let i = 1; i < 4; i++) { const x = x0 + i * .4, y = 1.1 - h * 2.2 * (1 - Math.pow(Math.abs(i - 2) / 2, 2)) * .55; c.beginPath(); c.moveTo(x, y - .4); c.lineTo(x + .2, y - 1); c.stroke(); } } c.translate(2.4, -.6 + Math.sin(k) * .3); c.rotate(-.3); ellipse(c, 0, 0, 1.1, .8, col); ellipse(c, .3, .25, .8, .4, shade(col, 1.3)); c.fillStyle = shade(col, .7); c.beginPath(); c.moveTo(-.6, -.6); c.lineTo(-.4, -1.6); c.lineTo(.1, -.7); c.closePath(); c.fill(); circle(c, .4, -.3, .3, '#fff'); circle(c, .48, -.28, .15, '#111'); c.strokeStyle = '#ff4f6b'; c.lineWidth = .1; c.beginPath(); c.moveTo(1.1, .1); c.lineTo(1.6, .2); c.lineTo(1.4, .35); c.stroke(); c.restore(); },
    coffreOr(c, e, t) { const pulse = 1 + Math.sin(t * 5 + e.phase) * .08; c.save(); c.scale(pulse, pulse); c.shadowColor = '#ffe36b'; c.shadowBlur = 24; for (let i = 0; i < 8; i++) { const a = t * 1.5 + i * .785; c.globalAlpha = .35; poly(c, [[0, 0], [Math.cos(a) * 4, Math.sin(a) * 4 - .3], [Math.cos(a + .2) * 4, Math.sin(a + .2) * 4 - .3]], '#fff3a0'); } c.globalAlpha = 1; E.coffre(c, Object.assign({}, e, { color: '#fff3a0' }), t); c.shadowBlur = 0; for (let i = 0; i < 5; i++) star(c, Math.cos(t * 2 + i * 1.3) * 2.4, -1.6 + Math.sin(t * 3 + i) * .6, .3 + .15 * Math.sin(t * 8 + i), '#fff'); c.restore(); },
    coffre(c, e, t) { const bob = Math.sin(t * 4 + e.phase) * .15; c.save(); c.translate(0, bob); for (let i = 0; i < 6; i++) { const a = t * 3 + i * 1.05, r = 1.9 + Math.sin(t * 6 + i) * .3; star(c, Math.cos(a) * r, Math.sin(a) * r * .7, .22, i % 2 ? '#fff' : '#ffd23f'); } c.fillStyle = '#7a4a1a'; c.beginPath(); c.roundRect(-1.4, -.4, 2.8, 1.5, .2); c.fill(); c.fillStyle = '#a0652a'; c.beginPath(); c.roundRect(-1.4, -1.2, 2.8, .9, .35); c.fill(); c.fillStyle = e.color; for (const x of [-1, 0, 1]) c.fillRect(x * .9 - .12, -1.2, .24, 2.3); c.fillStyle = e.color; c.beginPath(); c.roundRect(-.35, -.5, .7, .6, .12); c.fill(); circle(c, 0, -.22, .12, '#3a2008'); c.restore(); },
    balloon(c, e, t) { c.strokeStyle = '#eee'; c.lineWidth = .1; c.beginPath(); c.moveTo(0, 1.7); c.quadraticCurveTo(.5, 2.6, 0, 3.4); c.stroke(); ellipse(c, 0, 0, 1.3, 1.65, e.color); ellipse(c, -.5, -.6, .35, .55, 'rgba(255,255,255,.5)', .5); c.fillStyle = shade(e.color, .8); c.beginPath(); c.moveTo(-.25, 1.6); c.lineTo(.25, 1.6); c.lineTo(0, 1.95); c.fill(); for (const s of [-1, 1]) { circle(c, s * .45, -.2, .3, '#fff'); circle(c, s * .45 + .05, -.15, .15, '#1b1030'); c.strokeStyle = '#1b1030'; c.lineWidth = .14; c.beginPath(); c.moveTo(s * .2, -.75); c.lineTo(s * .75, -.55); c.stroke(); } c.strokeStyle = '#1b1030'; c.beginPath(); c.arc(0, .7, .4, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); },
    pinata(c, e, t) { const sw = Math.sin(t * 4 + e.phase) * .15; c.save(); c.rotate(sw); c.fillStyle = e.color; c.beginPath(); c.roundRect(-1.6, -.9, 3.2, 1.8, .5); c.fill(); for (let i = 0; i < 5; i++) { c.fillStyle = ['#ffd23f', '#ff4f6b', '#9cff6b', '#c54fff', '#ff8c2a'][i]; c.fillRect(-1.6 + i * .64, -.9, .64, 1.8); } ellipse(c, 1.9, -.9, .7, .6, e.color); for (const s of [-1, 1]) c.fillRect(1.6 + s * .3 - .12, -1.9, .24, .6); circle(c, 2.1, -1, .12, '#1b1030'); for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 2; k++) c.fillRect(i * .9 - .15 - k * .5 * i, .9, .3, .6); c.restore(); },
    bee(c, e, t) { const flap = Math.abs(Math.sin(t * 30 + e.phase)); for (const s of [-1, 1]) ellipse(c, s * .7, -.8, .75, .35 + flap * .3, 'rgba(255,255,255,.75)', s * .4); ellipse(c, 0, 0, 1.3, .85, e.color); c.fillStyle = '#222'; for (const x of [-.5, .2]) c.fillRect(x, -.8, .35, 1.6); c.beginPath(); c.moveTo(1.2, 0); c.lineTo(1.8, .1); c.lineTo(1.2, .25); c.fill(); circle(c, -.9, -.2, .22, '#222'); circle(c, -.95, -.25, .08, '#fff'); c.strokeStyle = '#222'; c.lineWidth = .1; c.beginPath(); c.moveTo(-1, -.6); c.lineTo(-1.4, -1.2); c.moveTo(-.7, -.7); c.lineTo(-.9, -1.3); c.stroke(); },
    wasp(c, e, t) { const flap = Math.abs(Math.sin(t * 30 + e.phase)); for (const s of [-1, 1]) ellipse(c, s * .8, -.7, .9, .3 + flap * .3, 'rgba(255,255,255,.65)', s * .5); ellipse(c, .6, .1, 1.2, .55, e.color); ellipse(c, -.7, -.1, .7, .55, shade(e.color, .9)); c.fillStyle = '#222'; for (const x of [.1, .7]) c.fillRect(x, -.5, .3, 1.1); c.beginPath(); c.moveTo(1.6, .1); c.lineTo(2.3, .2); c.lineTo(1.6, .4); c.fill(); circle(c, -1, -.3, .22, '#222'); circle(c, -1.05, -.35, .08, '#fff'); },
    firebird(c, e, t) { const flap = Math.sin(t * 12 + e.phase); for (let i = 0; i < 4; i++) ellipse(c, 1.2 + i * .6, (i % 2 ? .2 : -.2), .5 - i * .08, .35, i % 2 ? '#ffd23f' : e.color); for (const s of [-1, 1]) { c.fillStyle = e.color; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 1.2, -2 * flap - .5, s * 2.6, -.4 - flap); c.lineTo(s * 1.2, .5); c.fill(); } ellipse(c, 0, 0, 1.1, .7, shade(e.color, 1.15)); circle(c, -.7, -.2, .45, shade(e.color, 1.3)); circle(c, -.85, -.3, .13, '#1b1030'); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(-1.1, -.2); c.lineTo(-1.6, 0); c.lineTo(-1.1, .1); c.fill(); for (let i = 0; i < 3; i++) ellipse(c, -.2 + i * .3, -.7 - i * .3, .25, .4, i % 2 ? '#ffd23f' : '#ff8c2a'); },
    meteor(c, e, t) { for (let i = 0; i < 6; i++) { c.globalAlpha = .7 - i * .1; ellipse(c, (i + 1) * .5 * (e.x > 0 ? 1 : -1), -(i + 1) * .8, 1 - i * .12, 1.1 - i * .12, i % 2 ? '#ff8c2a' : '#ffd23f'); } c.globalAlpha = 1; c.fillStyle = e.color; c.beginPath(); for (let i = 0; i < 9; i++) { const a = i * TAU / 9, r = 1.1 + hash(i + 3) * .4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); circle(c, -.3, -.2, .3, shade(e.color, .7)); circle(c, .4, .3, .22, shade(e.color, .7)); },
    tie(c, e, t) { c.fillStyle = e.color; c.strokeStyle = '#aab7cc'; c.lineWidth = .12; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 1.4, -1.9); c.lineTo(s * 2.1, -1); c.lineTo(s * 2.1, 1); c.lineTo(s * 1.4, 1.9); c.lineTo(s * 1.1, 1); c.lineTo(s * 1.1, -1); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(s * 1.1, 0); c.lineTo(s * .7, 0); c.stroke(); } circle(c, 0, 0, .85, e.color); c.stroke(); circle(c, 0, 0, .45, e.elite ? '#ff3a3a' : '#1b2436'); c.strokeStyle = '#aab7cc'; c.beginPath(); c.moveTo(-.45, 0); c.lineTo(.45, 0); c.moveTo(0, -.45); c.lineTo(0, .45); c.stroke(); },
    ufo(c, e, t) { ellipse(c, 0, .2, 2.2, .7, shade(e.color, .8)); ellipse(c, 0, -.1, 2, .55, e.color); for (let i = -2; i <= 2; i++) circle(c, i * .8, .35, .18, Math.sin(t * 8 + i) > 0 ? '#fff' : '#ff4f6b'); c.fillStyle = 'rgba(180,230,255,.85)'; c.beginPath(); c.arc(0, -.2, 1, Math.PI, 0); c.fill(); circle(c, -.1, -.5, .3, '#6fd0ff'); circle(c, -.2, -.6, .1, '#fff'); },
    bolt(c, e, t) { c.globalAlpha = .9; ellipse(c, 0, 0, .6, 1.2, '#ff3a3a'); ellipse(c, 0, 0, .3, .7, '#fff'); },
    boulet(c, e, t) { c.shadowColor = '#ff8c2a'; c.shadowBlur = 16; circle(c, 0, 0, 1.3, '#3a2a22'); circle(c, -.35, -.35, .45, '#6a5a52'); c.shadowBlur = 0; for (let i = 0; i < 5; i++) { const a = t * 9 + i * 1.26; ellipse(c, Math.cos(a) * 1.4, Math.sin(a) * 1.4, .3, .5, i % 2 ? '#ff8c2a' : '#ffd23f', a); } },
    bombe(c, e, t) { const blink = Math.sin(t * (e.fuse != null && e.fuse < 1 ? 40 : 12)) > 0; c.strokeStyle = '#d9c9a0'; c.lineWidth = .18; c.beginPath(); c.moveTo(.4, -1.3); c.quadraticCurveTo(.9, -2.2, .5, -2.6); c.stroke(); star(c, .5, -2.6, .4 + (blink ? .2 : 0), blink ? '#fff' : '#ff8c2a'); circle(c, 0, 0, 1.5, '#2a2a30'); circle(c, -.45, -.45, .5, '#55555f'); box(c, -.35, -1.55, .7, .4, .1, '#6a6a74'); if (blink) { c.fillStyle = '#ff3a3a'; c.font = 'bold 1.1px Arial'; c.textAlign = 'center'; c.fillText(Math.max(0, Math.ceil(e.fuse == null ? e.def.fuse : e.fuse)), 0, .4); } },
    rayon(c, e, t) { c.shadowColor = '#b14fff'; c.shadowBlur = 24; for (let i = 3; i >= 0; i--) { c.globalAlpha = .35 + i * .15; circle(c, 0, 0, 2.3 - i * .45, ['#ffffff', '#e5bfff', '#b14fff', '#6a1fb0'][3 - i]); } c.globalAlpha = 1; c.shadowBlur = 0; c.strokeStyle = '#fff'; c.lineWidth = .12; for (let i = 0; i < 6; i++) { const a = t * 6 + i; c.beginPath(); c.moveTo(Math.cos(a) * .6, Math.sin(a) * .6); c.lineTo(Math.cos(a + .4) * 2.6, Math.sin(a + .4) * 2.6); c.stroke(); } },
  };
  const BOSS = {
    // Le Léviathan : grand serpent de mer à nageoires et cornes, yeux qui brillent ; le Capitaine Crochet : grand navire aux voiles rouges, le capitaine à la proue
    leviathan(c, e, t) { c.save(); c.scale(1.6, 1.6); E.serpentMer(c, e, t); c.restore(); c.save(); c.translate(3.9, -1.3); c.fillStyle = shade(e.color, .6); for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * .4, -.6); c.lineTo(sg * 1.3, -2.4); c.lineTo(sg * .9, -.3); c.closePath(); c.fill(); } c.shadowColor = '#7fe9ff'; c.shadowBlur = 14; circle(c, .35, -.55, .34, '#7fe9ff'); circle(c, .42, -.55, .14, '#06202a'); c.restore(); for (let i = 0; i < 4; i++) { c.fillStyle = shade(e.color, .7); c.beginPath(); c.moveTo(-4 + i * 1.8, .8); c.lineTo(-3.4 + i * 1.8, -1.6 - Math.sin(t * 3 + i) * .4); c.lineTo(-2.6 + i * 1.8, .8); c.closePath(); c.fill(); } },
    crochet(c, e, t) { hullSprite(c, t, { len: 3.4, masts: 2, mastH: 3.8, cannons: 4, flag: true, hullCol: '#4a1a1a', sailCol: '#b02424', mastCol: '#2a1010', flash: e.spitFlash || 0, phase: e.phase }); c.save(); c.translate(2.6, -1.1); c.fillStyle = '#8a1c1c'; c.beginPath(); c.roundRect(-.45, -.3, .9, 1.1, .2); c.fill(); circle(c, 0, -.6, .42, '#f1bd92'); c.fillStyle = '#1b1b1b'; c.beginPath(); c.moveTo(-.8, -.9); c.lineTo(.8, -.9); c.lineTo(.5, -1.5); c.lineTo(-.5, -1.5); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.font = 'bold .45px Arial'; c.textAlign = 'center'; c.fillText('☠', 0, -1.05); c.strokeStyle = '#d9d9d9'; c.lineWidth = .12; c.lineCap = 'round'; c.beginPath(); c.moveTo(.5, .2); c.quadraticCurveTo(1.1, .1, .95, -.4); c.stroke(); circle(c, -.1, -.68, .07, '#111'); c.restore(); },
    batking(c, e, t) { c.save(); c.scale(1.6, 1.6); E.bat(c, e, t); c.restore(); crown(c, 0, -2.2, 1.2); },
    bigghost(c, e, t) { c.save(); c.scale(1.9, 1.9); c.globalAlpha = .9; E.ghost(c, Object.assign({}, e, { age: 2 }), t); c.restore(); crown(c, 0, -3.6, 1.4); },
    clown(c, e, t) { c.save(); c.scale(1.7, 1.7); E.balloon(c, e, t); c.restore(); circle(c, 0, .2, .5, '#ff2a2a'); for (const s of [-1, 1]) ellipse(c, s * 1.6, -.5, .5, .7, '#ff8c2a'); c.fillStyle = '#4fc3ff'; c.beginPath(); c.moveTo(-1.2, -2.6); c.lineTo(1.2, -2.6); c.lineTo(0, -4.2); c.fill(); circle(c, 0, -4.2, .35, '#ffd23f'); },
    queen(c, e, t) { c.save(); c.scale(1.9, 1.9); E.wasp(c, e, t); c.restore(); crown(c, -1.9, -1.4, .9); },
    dragon(c, e, t) { const flap = Math.sin(t * 6); for (const s of [-1, 1]) { c.fillStyle = shade(e.color, .8); c.beginPath(); c.moveTo(s * .8, 0); c.quadraticCurveTo(s * 3, -3 * flap - 1, s * 5, -1 - flap); c.lineTo(s * 4.2, .5); c.lineTo(s * 3, .2); c.lineTo(s * 1.5, 1); c.fill(); } ellipse(c, 0, .6, 1.9, 1.5, e.color); ellipse(c, 0, 1, 1.1, 1, '#ffd23f'); ellipse(c, 0, -1.6, 1.4, 1.1, e.color); for (const s of [-1, 1]) { c.fillStyle = '#f2f2f2'; c.beginPath(); c.moveTo(s * .7, -2.4); c.lineTo(s * 1.4, -3.8); c.lineTo(s * 1.2, -2.2); c.fill(); circle(c, s * .55, -1.8, .3, '#ffd23f'); circle(c, s * .55, -1.8, .14, '#1b1030'); } c.fillStyle = '#f2f2f2'; for (const x of [-.6, -.2, .2, .6]) { c.beginPath(); c.moveTo(x - .12, -.9); c.lineTo(x + .12, -.9); c.lineTo(x, -.5); c.fill(); } if (Math.sin(t * 2) > .4) for (let i = 0; i < 4; i++) ellipse(c, 0, -.3 + i * .6, .5 + i * .2, .4, i % 2 ? '#ff8c2a' : '#ffd23f'); },
    destroyer(c, e, t) { c.fillStyle = e.color; c.strokeStyle = '#aab7cc'; c.lineWidth = .12; c.beginPath(); c.moveTo(0, -2.6); c.lineTo(5.2, 2.2); c.lineTo(-5.2, 2.2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = shade(e.color, 1.2); c.beginPath(); c.moveTo(0, -1); c.lineTo(2.6, 1.6); c.lineTo(-2.6, 1.6); c.closePath(); c.fill(); c.fillStyle = shade(e.color, .7); c.fillRect(-1, 1.2, 2, 1.2); circle(c, 0, 1, .5, '#1b2436'); for (let i = -3; i <= 3; i++) circle(c, i * 1.2, 1.9, .14, Math.sin(t * 5 + i) > 0 ? '#7fd4ff' : '#2a3a55'); for (const s of [-1, 1]) circle(c, s * 3.8, 2.6, .5, '#7fd4ff'); },
  };
  // Le Mégaoiseau du temps : immense ptérosaure aux ailes à motif d'horloge ; au stade 2 il est rouge, les yeux furieux, et fume.
  BOSS.oiseauTemps = (c, e, t) => {
    const angry = e.stage === 2, col = e.color, dark = shade(col, .6), flap = Math.sin(t * 5 + e.phase) * .9;
    if (angry) for (let i = 0; i < 6; i++) { const k = (t * .5 + i * .17) % 1; c.globalAlpha = .45 * (1 - k); circle(c, (i - 2.5) * 1.1 + Math.sin(t * 2 + i) * .5, -1.5 - k * 5, .7 + k * 1.3, i % 2 ? '#3a1a1a' : '#6a2a2a'); } c.globalAlpha = 1;
    for (const s of [-1, 1]) { poly(c, [[s * .6, -.2], [s * 4.2, -2.6 + flap], [s * 7.4, -.6 + flap * 1.3], [s * 6.2, 1.2 + flap * .6], [s * 3.4, 1.8 + flap * .3], [s * .8, 1.2]], shade(col, .85)); c.strokeStyle = dark; c.lineWidth = .14; for (let i = 1; i <= 3; i++) { c.beginPath(); c.moveTo(s * .6, -.2); c.lineTo(s * (2.2 + i * 1.6), -2 + flap + i * .9); c.stroke(); }
      c.save(); c.translate(s * 4.4, -.3 + flap * .8); circle(c, 0, 0, 1.1, '#f3efe0'); c.strokeStyle = '#333'; c.lineWidth = .12; for (let h = 0; h < 12; h++) { const a = h * TAU / 12; c.beginPath(); c.moveTo(Math.cos(a) * .8, Math.sin(a) * .8); c.lineTo(Math.cos(a) * 1, Math.sin(a) * 1); c.stroke(); } c.lineWidth = .16; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 3) * .7, Math.sin(t * 3) * .7); c.moveTo(0, 0); c.lineTo(Math.cos(t * .25) * .5, Math.sin(t * .25) * .5); c.stroke(); c.restore(); }
    ellipse(c, 0, .4, 1.6, 2.2, col); ellipse(c, 0, 1, 1, 1.3, shade(col, 1.3));
    c.strokeStyle = col; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -1.2); c.quadraticCurveTo(.6, -2.6, .3, -3.6); c.stroke(); ellipse(c, .3, -3.9, 1.1, .8, col);
    poly(c, [[-.6, -4.2], [-2.6, -5.6], [.4, -4.9]], dark); poly(c, [[-.5, -3.5], [.9, -3.5], [.3, -1.9]], '#e0b060');
    for (const s of [-1, 1]) { circle(c, .3 + s * .5, -4.1, .3, '#fff'); circle(c, .3 + s * .5 + (angry ? s * .05 : 0), -4.1, .16, angry ? '#ff3a3a' : '#111'); if (angry) { c.strokeStyle = '#3a0a0a'; c.lineWidth = .14; c.beginPath(); c.moveTo(.3 + s * .9, -4.7); c.lineTo(.3 + s * .2, -4.4); c.stroke(); } }
    for (const s of [-1, 1]) { c.strokeStyle = dark; c.lineWidth = .3; c.beginPath(); c.moveTo(s * .6, 2.4); c.lineTo(s * .9, 3.6); c.lineTo(s * 1.4, 3.3); c.moveTo(s * .9, 3.6); c.lineTo(s * .5, 3.4); c.stroke(); }
    crown(c, .3, -5, .9);
  };
  function crown(c, x, y, s) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x - s, y + s * .5); c.lineTo(x - s, y - s * .4); c.lineTo(x - s * .5, y); c.lineTo(x, y - s * .7); c.lineTo(x + s * .5, y); c.lineTo(x + s, y - s * .4); c.lineTo(x + s, y + s * .5); c.closePath(); c.fill(); circle(c, x, y + s * .2, s * .18, '#e23b3b'); }
  // ----- Vingt dinosaures (tableau secret du passé), dessinés par un même traceur paramétré -----
  // kind : biped (sur deux pattes), quad (quatre pattes), neck (long cou), flyer (ailes). Options : teeth, arms, frill, horns, nose,
  // plates, spikes, sail, club, armor, crest (tube), dilo (double crête), dome, beak, feathers, tiny, bull, fin.
  const DINO = {
    trex: { kind: 'biped', w: 1.35, h: 1, headW: .95, headH: .75, teeth: true, arms: true, tailW: .6 },
    triceratops: { kind: 'quad', w: 1.5, h: 1, headW: .8, headH: .65, frill: true, horns: true, nose: true },
    stegosaure: { kind: 'quad', w: 1.5, h: .95, headW: .5, headH: .4, plates: true, spikes: true },
    velociraptor: { kind: 'biped', w: .95, h: .65, headW: .6, headH: .45, teeth: true, feathers: true, arms: true, tailW: .35, tailLen: .4 },
    brachiosaure: { kind: 'neck', w: 1.5, h: 1.05, headW: .5, headH: .4, tall: true, tailW: .55 },
    diplodocus: { kind: 'neck', w: 1.6, h: .9, headW: .45, headH: .35, tailW: .45, tailLen: 1 },
    ankylosaure: { kind: 'quad', w: 1.7, h: .85, headW: .6, headH: .45, armor: true, club: true, tailW: .55 },
    pteranodon: { kind: 'flyer', w: .7, h: .5, headW: .5, headH: .35, beak: true, crest: 'back' },
    spinosaure: { kind: 'biped', w: 1.4, h: 1, headW: .7, headH: .9, teeth: true, sail: true, arms: true, tailW: .6 },
    parasaurolophus: { kind: 'biped', w: 1.2, h: .9, headW: .6, headH: .55, crest: 'tube', beak: true },
    pachycephalosaure: { kind: 'biped', w: 1.1, h: .85, headW: .65, headH: .6, dome: true, bumps: true },
    iguanodon: { kind: 'biped', w: 1.3, h: .95, headW: .6, headH: .5, beak: true, thumbs: true },
    allosaure: { kind: 'biped', w: 1.3, h: .95, headW: .85, headH: .7, teeth: true, arms: true, bumps: true, tailW: .55 },
    dilophosaure: { kind: 'biped', w: 1.05, h: .75, headW: .65, headH: .55, teeth: true, dilo: true, arms: true, tailW: .4 },
    gallimimus: { kind: 'biped', w: .95, h: .6, headW: .45, headH: .35, beak: true, longNeck: true, tailW: .3, tailLen: .5 },
    compsognathus: { kind: 'biped', w: .7, h: .5, headW: .45, headH: .35, teeth: true, tiny: true, arms: true, tailW: .25, tailLen: .5 },
    carnotaure: { kind: 'biped', w: 1.3, h: .95, headW: .8, headH: .7, teeth: true, bull: true, tailW: .55 },
    apatosaure: { kind: 'neck', w: 1.6, h: 1, headW: .45, headH: .35, tailW: .55, tailLen: .8 },
    archeopteryx: { kind: 'flyer', w: .55, h: .4, headW: .4, headH: .3, feathers: true, teeth: true, featherWings: true },
    quetzalcoatlus: { kind: 'flyer', w: .8, h: .55, headW: .55, headH: .35, beak: true, longBeak: true, crest: 'back', huge: true },
  };
  function dinoDraw(c, e, t, k) {
    const col = e.color, dark = shade(col, .6), light = shade(col, 1.35), wob = Math.sin(t * 6 + e.phase), step = Math.sin(t * 9 + e.phase), eye = e.elite ? '#ff3a3a' : '#111';
    const w = k.w || 1.2, h = k.h || .9;
    if (k.kind === 'flyer') { // ailes membraneuses (ou à plumes) qui battent
      const flap = Math.sin(t * (k.huge ? 6 : 10) + e.phase) * (k.huge ? .9 : 1.2), span = k.huge ? 3.6 : 2.8;
      for (const s of [-1, 1]) { poly(c, [[s * .3, -.1], [s * span * .55, -1.1 + flap * .8], [s * span, -.2 + flap], [s * span * .7, .5 + flap * .4], [s * .4, .5]], k.featherWings ? dark : shade(col, .8)); if (!k.featherWings) { c.strokeStyle = dark; c.lineWidth = .08; for (let i = 1; i <= 2; i++) { c.beginPath(); c.moveTo(s * .3, -.1); c.lineTo(s * span * (.45 + i * .25), -.5 + flap * .9 + i * .3); c.stroke(); } } else for (let i = 0; i < 4; i++) ellipse(c, s * (.9 + i * .6), .2 + flap * .5 + i * .05, .35, .18, i % 2 ? col : light, s * .3); }
    } else {
      // queue derrière (elle balance), puis les pattes
      c.strokeStyle = col; c.lineWidth = k.tailW || .5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-.2, .3); c.quadraticCurveTo(-1.5 - (k.tailLen || 0) * .5, .1 + wob * .3, -2.2 - (k.tailLen || 0), .8 + wob * .45); c.stroke();
      const tx = -2.2 - (k.tailLen || 0), ty = .8 + wob * .45;
      if (k.club) circle(c, tx, ty, .5, dark);
      if (k.spikes) for (let i = 0; i < 4; i++) poly(c, [[tx + .2 + i * .3, ty - .15], [tx + .35 + i * .3, ty - .9], [tx + .5 + i * .3, ty - .15]], '#e8dcc0');
      const legH = .9 + (k.tall ? .4 : 0);
      for (const s of [-1, 1]) { box(c, s * w * .5 - .25 + s * step * .06, h * .55, .5, legH + step * s * .1, .15, dark); if (k.kind !== 'biped') box(c, s * w * .78 - .2 - s * step * .06, h * .5, .4, legH * .85 - step * s * .1, .14, dark); }
    }
    // corps + ventre clair
    ellipse(c, 0, 0, w, h, col); ellipse(c, 0, h * .3, w * .62, h * .5, light);
    if (k.sail) { const pts = [[-w * .8, -h * .3]]; for (let i = 0; i <= 6; i++) pts.push([-w * .8 + i * w * 1.6 / 6, -h * .3 - Math.sin(i / 6 * Math.PI) * 1.6]); pts.push([w * .8, -h * .3]); poly(c, pts, shade(col, .8)); c.strokeStyle = dark; c.lineWidth = .06; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(-w * .8 + i * w * 1.6 / 6, -h * .3); c.lineTo(-w * .8 + i * w * 1.6 / 6, -h * .3 - Math.sin(i / 6 * Math.PI) * 1.5); c.stroke(); } }
    if (k.plates) for (let i = 0; i < 5; i++) { const x = -w * .8 + i * w * .4; poly(c, [[x - .25, -h * .5], [x, -h * .5 - .9 - (i % 2) * .2], [x + .25, -h * .5]], i % 2 ? '#d97a3a' : '#e8a05a'); }
    if (k.armor) for (let i = 0; i < 9; i++) circle(c, -w * .8 + (i % 5) * w * .4 + (i > 4 ? w * .2 : 0), -h * .55 + (i > 4 ? .45 : 0), .17, dark);
    if (k.arms) for (const s of [-1, 1]) box(c, s * w * .55 - .12, -h * .1, .24, k.tiny ? .3 : .5, .08, dark);
    if (k.thumbs) for (const s of [-1, 1]) poly(c, [[s * w * .65, -h * .1], [s * (w * .65 + .25), -h * .1 - .35], [s * (w * .65 + .1), .1]], '#e8dcc0');
    // cou et tête
    const neck = k.kind === 'neck' || k.longNeck, ny = neck ? (k.tall ? -2.9 : -2.3) : -h - .35, hx = neck ? .25 : 0, hw = k.headW || .7, hh = k.headH || .55;
    if (neck) { c.strokeStyle = col; c.lineWidth = .55; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -h * .5); c.quadraticCurveTo(.35, (ny - h * .5) * .55, hx, ny + .2); c.stroke(); }
    if (k.frill) { ellipse(c, hx, ny - .25, hw * 1.7, hh * 1.5, dark); ellipse(c, hx, ny - .25, hw * 1.45, hh * 1.25, shade(col, .85)); for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; circle(c, hx + Math.cos(a) * hw * 1.6, ny - .25 + Math.sin(a) * hh * 1.4, .12, light); } }
    if (k.crest === 'tube') { c.strokeStyle = dark; c.lineWidth = .3; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx, ny - hh * .6); c.quadraticCurveTo(hx - .2, ny - hh - .9, hx - .7, ny - hh - 1.2); c.stroke(); }
    if (k.crest === 'back') poly(c, [[hx - hw * .5, ny - hh * .4], [hx - hw * .3 - 1.2, ny - hh - .5], [hx + hw * .2, ny - hh * .9]], dark);
    ellipse(c, hx, ny, hw, hh, col); ellipse(c, hx, ny + hh * .35, hw * .8, hh * .4, light);
    if (k.dome) { circle(c, hx, ny - hh * .55, hw * .7, shade(col, .75)); for (let i = 0; i < 6; i++) circle(c, hx + Math.cos(i * 1.05) * hw * .85, ny - hh * .55 + Math.sin(i * 1.05) * hw * .5, .09, '#e8dcc0'); }
    if (k.horns) for (const s of [-1, 1]) poly(c, [[hx + s * hw * .45, ny - hh * .4], [hx + s * hw * .55, ny - hh - .8], [hx + s * hw * .2, ny - hh * .55]], '#e8dcc0');
    if (k.nose) poly(c, [[hx - .12, ny + hh * .4], [hx, ny - .2], [hx + .12, ny + hh * .4]], '#e8dcc0');
    if (k.bull) for (const s of [-1, 1]) poly(c, [[hx + s * hw * .5, ny - hh * .3], [hx + s * (hw * .9), ny - hh - .45], [hx + s * hw * .3, ny - hh * .6]], shade(col, .55));
    if (k.bumps) for (const s of [-1, 1]) circle(c, hx + s * hw * .45, ny - hh * .55, .13, shade(col, .55));
    if (k.dilo) for (const s of [-1, 1]) { c.fillStyle = e.elite ? '#ff8c2a' : '#e05a3a'; c.beginPath(); c.arc(hx + s * hw * .45, ny - hh * .3, .5, Math.PI, 0); c.fill(); }
    if (k.feathers) for (let i = 0; i < 3; i++) poly(c, [[hx - hw * .3 + i * .2, ny - hh * .5], [hx - hw * .5 + i * .2, ny - hh - .55 - i * .1], [hx - hw * .05 + i * .2, ny - hh * .6]], i % 2 ? light : '#e8a05a');
    if (k.beak) poly(c, [[hx - hw * .45, ny + hh * .3], [hx + hw * .45, ny + hh * .3], [hx, ny + hh + (k.longBeak ? 1.1 : .45)]], k.longBeak ? '#d9b26a' : '#e8c070');
    if (k.teeth) for (let i = -2; i <= 2; i++) poly(c, [[hx + i * hw * .28 - .07, ny + hh * .55], [hx + i * hw * .28, ny + hh * .95], [hx + i * hw * .28 + .07, ny + hh * .55]], '#fff');
    for (const s of [-1, 1]) { circle(c, hx + s * hw * .42, ny - hh * .15, hw * .2, '#fff'); circle(c, hx + s * hw * .42 + s * .03, ny - hh * .15, hw * .1, eye); }
  }
  for (const [key, cfg] of Object.entries(DINO)) E[key] = (c, e, t) => dinoDraw(c, e, t, cfg);

  // Portail bleu façon Diablo : anneaux qui tournent, éclairs, puis l'écran s'engouffre dedans.
  R.portal = (c, portal, t, w, h) => {
    const p = P(portal), k = portal.t / CB.PORTAL_TIME, grow = Math.min(1, portal.t / .9), rush = Math.max(0, (k - .62) / .38);
    // le portail grossit vite jusqu'à un bon tiers de l'écran, glisse vers le centre, puis nous avale
    const r = Math.max(p.scale * 5, h * .3) * grow * (1 + rush * rush * 40), ease = grow * grow;
    c.save(); c.translate(p.x + (w * .5 - p.x) * ease, p.y + (h * .42 - p.y) * ease);
    const glow = c.createRadialGradient(0, 0, r * .1, 0, 0, r * 1.6); glow.addColorStop(0, 'rgba(160,220,255,.9)'); glow.addColorStop(.5, 'rgba(40,120,255,.45)'); glow.addColorStop(1, 'rgba(0,30,120,0)'); c.fillStyle = glow; c.beginPath(); c.arc(0, 0, r * 1.6, 0, TAU); c.fill();
    for (let i = 0; i < 4; i++) { c.save(); c.rotate(t * (i % 2 ? 2.4 : -1.7) + i); c.strokeStyle = ['#8fd6ff', '#3f8fff', '#ffffff', '#5fb6ff'][i]; c.lineWidth = r * .07 + 1; c.globalAlpha = .85; c.beginPath(); c.ellipse(0, 0, r * (1 - i * .15), r * (.78 - i * .12), 0, 0, TAU * .82); c.stroke(); c.restore(); }
    c.globalAlpha = 1; c.strokeStyle = '#dff4ff'; c.lineWidth = Math.max(1, r * .03);
    for (let i = 0; i < 7; i++) { const a = t * 3 + i * .9; c.beginPath(); c.moveTo(Math.cos(a) * r * .2, Math.sin(a) * r * .15); for (let j = 1; j <= 4; j++) c.lineTo(Math.cos(a + j * .25) * r * (.2 + j * .18), Math.sin(a + j * .25) * r * (.15 + j * .15) + Math.sin(t * 40 + j) * r * .03); c.stroke(); }
    const core = c.createRadialGradient(0, 0, 0, 0, 0, r * .55); core.addColorStop(0, '#ffffff'); core.addColorStop(.4, '#9fe0ff'); core.addColorStop(1, 'rgba(30,90,255,0)'); c.fillStyle = core; c.beginPath(); c.arc(0, 0, r * .55, 0, TAU); c.fill();
    for (let i = 0; i < 18; i++) { const a = i * TAU / 18 + t * 1.3, d = (1 - ((t * .7 + i * .13) % 1)) * r * 1.4; star(c, Math.cos(a) * d, Math.sin(a) * d * .8, 2 + grow * 3, i % 3 ? '#8fd6ff' : '#fff'); }
    c.restore();
    if (rush > 0) { c.fillStyle = 'rgba(190,235,255,' + Math.min(1, rush * 1.2) + ')'; c.fillRect(0, 0, w, h); }
  };

  // Effets visuels des attaques spéciales en cours (rayon laser, tornade, teintes d'écran).
  R.specialFx = (c, wave, t, w, h) => {
    const fx = wave.fx; if (!fx) return; const V = CB.VIEW;
    if (fx.laser > 0) { const x0 = V.cx, y0 = V.ground - 1.5 * V.size, a = wave.aim, g = wave.laserGrow, k = Math.pow(g, 1.6) * 2.2, blue = wave.laserLevel >= 3, LC = blue ? [[26, '#2a5bff', .3], [12, '#5fb6ff', .65], [4, '#fff', 1]] : [[26, '#ff3a3a', .25], [12, '#ff8c2a', .6], [4, '#fff', 1]]; c.save(); c.lineCap = 'round'; for (const [lw, col, al] of LC) { c.globalAlpha = al * (.8 + .2 * Math.sin(t * 40)); c.strokeStyle = col; c.lineWidth = Math.max(1, lw * k); c.shadowColor = blue ? '#5fb6ff' : '#ff3a3a'; c.shadowBlur = 20 + 30 * g; c.beginPath(); c.moveTo(x0, y0); c.lineTo(a.x, a.y); c.stroke(); } c.globalAlpha = 1; circle(c, a.x, a.y, (18 + Math.sin(t * 30) * 4) * k, '#fff'); if (g >= 1) { c.globalAlpha = .35 + .25 * Math.sin(t * 25); circle(c, a.x, a.y, 60 + Math.sin(t * 18) * 8, blue ? '#5fb6ff' : '#ff8c2a'); c.globalAlpha = 1; } circle(c, x0, y0, 10 + 16 * g, '#fff'); c.restore(); }
    if (fx.pika > 0) { c.save(); c.globalAlpha = .12 + .1 * Math.abs(Math.sin(t * 60)); c.fillStyle = '#ffe76c'; c.fillRect(0, 0, w, h); c.globalAlpha = .9; c.strokeStyle = '#fff'; c.lineWidth = 3; c.shadowColor = '#ffe76c'; c.shadowBlur = 16; for (let i = 0; i < 5; i++) { const seed = Math.floor(t * 12) + i * 7, x = (seed * 977) % w; R.lightning(c, x, 0, x + ((seed * 331) % 161) - 80, h * (.45 + ((seed * 113) % 30) / 100), '#ffe76c', 3, .8, seed); } c.restore(); }
    if (fx.tornado > 0 && wave.tornadoes) R.windStreaks(c, t, w, h, Math.min(1, fx.tornado), '#dfe9ff', 26);
    if (fx.blizzard > 0) R.blizzard(c, wave, t, w, h);
    if (wave.poison > 0) { c.save(); const k = Math.min(1, wave.poison); const g = c.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w * .7); g.addColorStop(0, 'rgba(125,255,58,0)'); g.addColorStop(1, 'rgba(60,160,20,' + (.55 * k) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const ph = (t * (.3 + (i % 3) * .1) + i * .41) % 1; c.globalAlpha = k * Math.sin(ph * Math.PI) * .6; circle(c, (i * 173) % w, h - ph * h, 4 + (i % 3) * 3, '#c6ff8a'); } c.restore(); }
    if (wave.dark > 0) { c.save(); const k = Math.min(1, wave.dark * 1.5), a = wave.aim; const g = c.createRadialGradient(a.x, a.y, 40, a.x, a.y, 180); g.addColorStop(0, 'rgba(5,2,12,0)'); g.addColorStop(1, 'rgba(5,2,12,' + (.93 * k) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore(); }
    if (fx.ghost > 0) R.ghostMode(c, wave, t, w, h);
    if (fx.magnet > 0) R.casino(c, wave, t, w, h);
    if (fx.rally > 0) { const x0 = V.cx, y0 = V.ground - 1.3 * V.size; c.save(); c.strokeStyle = '#ff6b6b'; c.shadowColor = '#ff6b6b'; c.shadowBlur = 10; for (let i = 0; i < 3; i++) { const k = (t * 1.1 + i / 3) % 1; c.globalAlpha = (1 - k) * .6; c.lineWidth = 6 * (1 - k) + 1; c.beginPath(); c.arc(x0, y0, 30 + k * V.size * 1.6, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); } c.restore(); }
    if (fx.teleport > 0) { c.save(); for (let i = 0; i < 30; i++) { const ph = (t * (.4 + (i % 4) * .15) + i * .37) % 1, x = ((i * 193) % w), y = h - ph * (h + 30); c.globalAlpha = Math.sin(ph * Math.PI) * .8; star(c, x + Math.sin(t * 3 + i) * 10, y, 3 + (i % 3) * 2, i % 2 ? '#c47dff' : '#7fd4ff', 4); } c.restore(); }
    const tint = fx.slowmo > 0 ? 'rgba(60,140,255,.18)' : fx.ghost > 0 ? 'rgba(220,240,255,.2)' : fx.rally > 0 ? 'rgba(255,60,60,.14)' : fx.magnet > 0 ? 'rgba(255,210,63,.14)' : fx.teleport > 0 ? 'rgba(160,80,255,.16)' : null;
    if (tint) { c.fillStyle = tint; c.fillRect(0, 0, w, h); }
    if (fx.cheat > 0) { c.save(); c.lineWidth = 10; c.strokeStyle = 'hsl(' + ((t * 300) % 360) + ',100%,60%)'; c.globalAlpha = .8; c.strokeRect(5, 5, w - 10, h - 10); c.restore(); }
  };
  R.enemy = (c, e, t) => {
    const p = P(e); c.save(); c.translate(p.x, p.y); const es = e.boss ? 1.3 * CB.BOSS_SCALE : e.size; c.scale(p.scale * es, p.scale * es);
    if (e.swept) c.rotate(e.swept.age * 11); if (e.warpScale != null && e.warpScale !== 1) c.scale(e.warpScale, e.warpScale); if (e.alpha != null) c.globalAlpha = e.alpha;
    if (e.frozen > 0) { c.globalAlpha *= .9; }
    if (e.elite) { c.shadowColor = e.color; c.shadowBlur = 18; }
    const drawer = e.boss ? BOSS[e.def === CB.BOSSES.batking ? 'batking' : Object.keys(CB.BOSSES).find(k => CB.BOSSES[k] === e.def)] : E[e.type] || E.bat;
    const swim = !!(e.def && e.def.swim), jump = swim ? (e.jump || 0) : 0; let wl = swim ? (P({ x: e.x, y: 0, z: e.z }).y - p.y) / (p.scale * es) : 0;   // nageur : ligne d'eau (y = 0 du monde) en unités locales
    if (swim) { waterBack(c, e, t, wl, jump); if (jump > 0) { const lift = jump * 2.4; c.translate(0, -lift); wl += lift; c.rotate((e.x < 0 ? 1 : -1) * jump * .3); c.scale(1 + jump * .12, 1 + jump * .12); }   // bond vers la coque : le corps sort de l'eau, penché, un peu plus gros
      c.save(); c.beginPath(); c.rect(-40, -40, 80, 40 + wl); c.clip(); }   // tout ce qui est sous la ligne d'eau est caché : le corps est immergé à moitié
    drawer(c, e, t);
    // Touché : on redessine la même silhouette en mode lighter pour l'éclaircir (jamais de carré autour de l'ennemi).
    if (e.flash > 0) { e.flash -= 1 / 60; c.shadowBlur = 0; c.globalCompositeOperation = 'lighter'; c.globalAlpha = .85 * (e.alpha == null ? 1 : e.alpha); drawer(c, e, t); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    if (e.frozen > 0) { c.globalAlpha = .55; circle(c, 0, 0, 1.6 * (e.boss ? 2 : 1), '#a9e9ff'); }
    if (swim) { c.restore(); waterFront(c, e, t, wl, jump); }
    c.restore();
    if (e.boss) { const w = Math.min(CB.VIEW.w * .62, 680), bh = 28, x = CB.VIEW.cx - w / 2, y = 92; c.fillStyle = 'rgba(8,20,45,.78)'; c.beginPath(); c.roundRect(x - 6, y - 6, w + 12, bh + 12, 12); c.fill(); c.fillStyle = '#5a1420'; c.beginPath(); c.roundRect(x, y, w, bh, 7); c.fill(); c.save(); c.beginPath(); c.roundRect(x, y, w, bh, 7); c.clip(); c.fillStyle = e.mini && e.stage === 2 ? '#ff6a6a' : '#e23b3b'; c.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), bh); c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), bh * .4); if (e.target != null) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, y, w * Math.max(0, e.target / e.maxHp), bh); } c.restore(); for (const k of [1 / 3, 2 / 3]) { c.fillStyle = '#fff'; c.fillRect(x + w * k - 1.5, y - 4, 3, bh + 8); } c.fillStyle = '#fff'; c.font = 'bold 17px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 4; c.fillText((e.act != null && !e.full ? 'ACTE ' + (e.act + 1) + ' · ' : e.mini ? 'MINI-BOSS' + (e.stage === 2 ? ' FÂCHÉ' : '') + ' · ' : '') + e.name.toUpperCase() + ' · ' + Math.max(0, Math.ceil(e.hp)) + ' PV', CB.VIEW.cx, y + bh / 2 + 6); c.shadowBlur = 0; }   // grande barre : large, épaisse, PV affichés
    else if ((e.elite || e.maxHp > 2.5) && !e.vanish) { const w = 2.6 * p.scale * e.size, x = p.x - w / 2, y = p.y - 2.6 * p.scale * e.size; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x, y, w, 3); c.fillStyle = e.elite ? '#ffd23f' : '#7dff9a'; c.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 3); }
  };

  // ---------- Éclair de bouche ----------
  R.fireFlash = (c, x, y, s, strength) => { if (strength <= 0) return; c.save(); c.globalAlpha = Math.min(1, strength); const g = c.createRadialGradient(x, y, 2, x, y, 40 * s); g.addColorStop(0, '#fff'); g.addColorStop(.3, '#ffd23f'); g.addColorStop(1, 'rgba(255,120,30,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 40 * s, 0, TAU); c.fill(); c.restore(); };

  // ---------- Boulets ----------
  const BALL = {
    fer(c, r) { const g = c.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, '#9aa3b2'); g.addColorStop(1, '#2a2f3a'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); },
    feu(c, r, t) { c.save(); c.shadowColor = '#ff6a1a'; c.shadowBlur = r * .9; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .55, h = r * (1.1 + .35 * Math.sin(t * 19 + i * 2.3)); ellipse(c, Math.cos(a) * r * .55, Math.sin(a) * r * .55 - h * .35, r * .28, h * .5, i % 2 ? '#ffd23f' : '#ff6a1a', a + Math.PI / 2); } const g = c.createRadialGradient(0, 0, r * .1, 0, 0, r * 1.3); g.addColorStop(0, '#fff6a0'); g.addColorStop(.5, '#ff8c2a'); g.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.3, 0, TAU); c.fill(); c.restore(); },
    etoile(c, r, t) { c.save(); c.rotate(t * 6); star(c, 0, 0, r * 1.5, '#fff3a0'); star(c, 0, 0, r * .8, '#ffd23f'); c.restore(); },
    bowling(c, r) { const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, '#6a4fd8'); g.addColorStop(1, '#1b1040'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); for (const [x, y] of [[-.25, -.3], [.1, -.4], [-.05, 0]]) circle(c, x * r, y * r, r * .13, '#0a0820'); },
    neige(c, r) { circle(c, 0, 0, r, '#f4fbff'); circle(c, -r * .3, -r * .3, r * .35, '#fff'); c.fillStyle = '#cfe6f5'; for (let i = 0; i < 5; i++) circle(c, Math.cos(i * 1.3) * r * .6, Math.sin(i * 1.3) * r * .6, r * .1, '#cfe6f5'); },
    soccer(c, r) { c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#d8dde6'); c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
      const pent = (x, y, rr, sq, rot) => { c.beginPath(); for (let k = 0; k < 5; k++) { const bb = rot + k * TAU / 5; c.lineTo(x + Math.cos(bb) * rr, y + Math.sin(bb) * rr * sq); } c.closePath(); c.fill(); };
      c.strokeStyle = '#5a6270'; c.lineWidth = r * .05; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; c.beginPath(); c.moveTo(Math.cos(a) * r * .26, Math.sin(a) * r * .26); c.lineTo(Math.cos(a) * r * .62, Math.sin(a) * r * .62); c.stroke(); }
      c.fillStyle = '#1b1b1b'; pent(0, 0, r * .26, 1, -Math.PI / 2); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + Math.PI / 5 + i * TAU / 5; c.save(); c.translate(Math.cos(a) * r * .72, Math.sin(a) * r * .72); c.rotate(a); c.scale(.72, 1); pent(0, 0, r * .2, 1, 0); c.restore(); } c.restore(); },
    disco(c, r, t) { c.save(); const hue = (t * 240) % 360; c.globalAlpha = .35; for (let i = 0; i < 8; i++) { const a = t * 2 + i * TAU / 8; c.fillStyle = 'hsl(' + ((hue + i * 45) % 360) + ',100%,65%)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * 2.6, a, a + .22); c.closePath(); c.fill(); } c.globalAlpha = 1;
      c.shadowColor = 'hsl(' + hue + ',100%,70%)'; c.shadowBlur = r * 1.2; const g = c.createRadialGradient(-r * .3, -r * .3, r * .05, 0, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#dfe4ff'); g.addColorStop(1, '#8e9bd8'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); const n = 5, s = r * 2 / n; for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const ph = (i * 3 + k * 5 + Math.floor(t * 10)) % 7; c.fillStyle = ph === 0 ? '#fff' : ph < 3 ? 'hsl(' + ((hue + (i + k) * 40) % 360) + ',100%,' + (70 + ph * 8) + '%)' : 'rgba(0,0,0,' + (.08 + ph * .03) + ')'; c.fillRect(-r + i * s + 1, -r + k * s + 1, s - 2, s - 2); } c.restore();
      c.globalAlpha = .9; circle(c, -r * .35, -r * .38, r * .18, '#fff'); c.restore(); },
    citrouille(c, r) { c.fillStyle = '#2a7a2a'; c.beginPath(); c.roundRect(-r * .12, -r * 1.25, r * .24, r * .4, r * .08); c.fill(); for (const [x, col] of [[-.62, '#e8761a'], [.62, '#e8761a'], [-.31, '#ff8c2a'], [.31, '#ff8c2a'], [0, '#ffa040']]) ellipse(c, x * r, 0, r * .42, r * .95, col); c.globalAlpha = .35; ellipse(c, -r * .2, -r * .45, r * .3, r * .18, '#fff'); c.globalAlpha = 1;
      c.fillStyle = '#1b1030'; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * r * .5, -r * .35); c.lineTo(sg * r * .18, -r * .12); c.lineTo(sg * r * .58, -r * .05); c.closePath(); c.fill(); } c.beginPath(); c.moveTo(-r * .55, r * .25); c.lineTo(r * .55, r * .25); c.lineTo(r * .35, r * .55); c.lineTo(r * .15, r * .4); c.lineTo(0, r * .6); c.lineTo(-r * .15, r * .4); c.lineTo(-r * .35, r * .55); c.closePath(); c.fill(); },
    // Galaxie : une planète (ou le Soleil) au hasard à chaque tir ; les anneaux passent derrière puis devant la planète
    galaxie(c, r, t, b) { const key = CB.GALAXY[(b && b.variant != null ? b.variant : 5) % CB.GALAXY.length]; PLANET[key](c, r, t); },
    planete(c, r, t, b) { BALL.galaxie(c, r, t, b); },
  };
  const ringed = (c, r, inner, outer, tilt, col, draw) => { c.save(); c.rotate(tilt); c.strokeStyle = col; c.lineWidth = r * .16; c.beginPath(); c.ellipse(0, 0, outer, outer * .3, 0, Math.PI, TAU); c.stroke(); c.rotate(-tilt); draw(); c.rotate(tilt); c.beginPath(); c.ellipse(0, 0, outer, outer * .3, 0, 0, Math.PI); c.stroke(); c.restore(); };
  const sphere = (c, r, light, dark) => { const g = c.createRadialGradient(-r * .35, -r * .35, r * .05, 0, 0, r); g.addColorStop(0, light); g.addColorStop(1, dark); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); };
  const bands = (c, r, cols) => { c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(-r, -r + i * r * 2 / cols.length, r * 2, r * 2 / cols.length + 1); }); c.restore(); };
  const PLANET = {
    mercure(c, r) { sphere(c, r, '#c9c2b8', '#6e665f'); for (const [x, y, k] of [[-.3, -.2, .18], [.25, .1, .12], [.05, .45, .1], [-.35, .35, .08]]) circle(c, x * r, y * r, k * r, 'rgba(0,0,0,.25)'); },
    venus(c, r) { sphere(c, r, '#ffe9b0', '#c99a4a'); c.globalAlpha = .4; for (let i = 0; i < 3; i++) ellipse(c, (i - 1) * r * .3, (i - 1) * r * .35, r * .7, r * .18, '#fff', .3); c.globalAlpha = 1; },
    terre(c, r) { sphere(c, r, '#7fd0ff', '#1e5fa8'); c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); ellipse(c, -r * .25, r * .05, r * .42, r * .3, '#4caf50'); ellipse(c, r * .4, -r * .35, r * .28, r * .22, '#4caf50'); ellipse(c, r * .2, r * .55, r * .2, r * .14, '#4caf50'); c.globalAlpha = .6; ellipse(c, r * .1, -r * .6, r * .5, r * .12, '#fff'); c.restore(); },
    mars(c, r) { sphere(c, r, '#ff9b6a', '#9c3a1e'); circle(c, 0, -r * .85, r * .2, '#fff'); circle(c, -r * .3, r * .2, r * .14, 'rgba(0,0,0,.2)'); },
    jupiter(c, r) { bands(c, r, ['#e8c9a0', '#c98a5a', '#f1dcc0', '#b8744a', '#e8c9a0', '#d19a6c']); ellipse(c, r * .3, r * .3, r * .28, r * .16, '#c0392b'); c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); c.globalAlpha = .25; sphere(c, r, '#fff', '#000'); c.restore(); },
    saturne(c, r, t) { ringed(c, r, r * 1.15, r * 1.75, -.35, '#ffe9a0', () => sphere(c, r, '#f5dfa0', '#b08a3c')); },
    uranus(c, r) { ringed(c, r, r * 1.1, r * 1.55, 1.2, '#cfeeff', () => sphere(c, r, '#bff3ff', '#3fa8c8')); },
    neptune(c, r) { sphere(c, r, '#6a8cff', '#1a2f9c'); ellipse(c, -r * .2, -r * .1, r * .25, r * .16, '#0f1f6b'); c.globalAlpha = .5; ellipse(c, r * .2, r * .4, r * .5, r * .08, '#fff'); c.globalAlpha = 1; },
    pluton(c, r) { sphere(c, r * .85, '#e0d0c0', '#8a7060'); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(-r * .3, r * .5); c.quadraticCurveTo(0, -r * .2, r * .3, r * .45); c.closePath(); c.fill(); },
    soleil(c, r, t) { c.save(); c.shadowColor = '#ffd23f'; c.shadowBlur = r * 1.5; c.globalAlpha = .4; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * .8, L = r * (1.6 + .25 * Math.sin(t * 6 + i)); c.fillStyle = '#ffb000'; c.beginPath(); c.moveTo(Math.cos(a - .12) * r, Math.sin(a - .12) * r); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.lineTo(Math.cos(a + .12) * r, Math.sin(a + .12) * r); c.closePath(); c.fill(); } c.globalAlpha = 1; const g = c.createRadialGradient(0, 0, r * .1, 0, 0, r); g.addColorStop(0, '#fff8c0'); g.addColorStop(.6, '#ffd23f'); g.addColorStop(1, '#ff8c2a'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore(); },
  };
  const heartB = (c, x, y, s, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.3, y - s * .1, x - s * .6, y - s * 1.1, x, y - s * .35); c.bezierCurveTo(x + s * .6, y - s * 1.1, x + s * 1.3, y - s * .1, x, y + s * .9); c.fill(); };
  Object.assign(BALL, {
    coeur(c, r, t) { c.save(); c.rotate(Math.sin(t * 6) * .25); c.shadowColor = '#ff4f9a'; c.shadowBlur = r * .8; heartB(c, 0, 0, r * 1.05, '#ff3b7a'); c.shadowBlur = 0; heartB(c, -r * .12, -r * .1, r * .55, '#ff7fb0'); c.globalAlpha = .8; circle(c, -r * .4, -r * .45, r * .15, '#fff'); c.restore(); },
    bonbon(c, r, t) { c.save(); c.rotate(t * 5); c.fillStyle = '#ff6ad5'; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * r * .75, 0); c.lineTo(sg * r * 1.45, -r * .45); c.lineTo(sg * r * 1.2, 0); c.lineTo(sg * r * 1.45, r * .45); c.closePath(); c.fill(); } const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, '#ffb3ea'); g.addColorStop(1, '#ff4fc0'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, r * .78, 0, 0, TAU); c.fill(); c.save(); c.beginPath(); c.ellipse(0, 0, r, r * .78, 0, 0, TAU); c.clip(); c.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * .5 - r * .1, -r); c.lineTo(i * r * .5 + r * .1, -r); c.lineTo(i * r * .5 + r * .35, r); c.lineTo(i * r * .5 + r * .15, r); c.closePath(); c.fill(); } c.restore(); c.restore(); },
    basket(c, r) { sphere(c, r, '#ffa64a', '#c25a12'); c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); c.strokeStyle = '#2a1a0e'; c.lineWidth = r * .09; c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, -r); c.lineTo(0, r); c.stroke(); c.beginPath(); c.arc(-r * 1.15, 0, r * .95, -1.2, 1.2); c.stroke(); c.beginPath(); c.arc(r * 1.15, 0, r * .95, Math.PI - 1.2, Math.PI + 1.2); c.stroke(); c.restore(); },
    chasseur(c, r) { sphere(c, r, '#ff7b7b', '#b01e1e'); c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = r * .14; c.beginPath(); c.ellipse(0, 0, r * 1.05, r * .55, .6, 0, TAU); c.stroke(); c.restore(); c.globalAlpha = .8; ellipse(c, -r * .35, -r * .4, r * .22, r * .14, '#fff', -.6); c.globalAlpha = 1; },
    pomme(c, r) { c.fillStyle = '#5a3a1e'; c.fillRect(-r * .06, -r * 1.15, r * .12, r * .4); ellipse(c, r * .25, -r * .95, r * .32, r * .14, '#45b84a', -.5); sphere(c, r, '#ff6a6a', '#a81818'); c.fillStyle = '#a81818'; c.beginPath(); c.ellipse(0, -r * .85, r * .35, r * .18, 0, 0, Math.PI); c.fill(); c.globalAlpha = .7; ellipse(c, -r * .4, -r * .35, r * .18, r * .3, '#fff', .4); c.globalAlpha = 1; },
    banane(c, r, t) { c.save(); c.rotate(t * 4); c.lineCap = 'round'; c.strokeStyle = '#c9a200'; c.lineWidth = r * .62; c.beginPath(); c.arc(0, r * .5, r * 1.1, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.strokeStyle = '#ffd23f'; c.lineWidth = r * .5; c.beginPath(); c.arc(0, r * .5, r * 1.1, Math.PI * 1.17, Math.PI * 1.83); c.stroke(); c.strokeStyle = '#5a3a1e'; c.lineWidth = r * .22; c.beginPath(); c.moveTo(Math.cos(Math.PI * 1.15) * r * 1.1, r * .5 + Math.sin(Math.PI * 1.15) * r * 1.1); c.lineTo(Math.cos(Math.PI * 1.1) * r * 1.3, r * .5 + Math.sin(Math.PI * 1.1) * r * 1.3); c.stroke(); c.restore(); },
    rondelle(c, r, t) {
      // Vraie rondelle : galette de caoutchouc noir vue de trois quarts, bord strié en losanges qui défile, dessus mat avec son logo
      const ry = r * .42, h = r * .5; c.save(); c.rotate(Math.sin(t * 2) * .12);
      c.beginPath(); c.moveTo(r, 0); c.ellipse(0, 0, r, ry, 0, 0, Math.PI); c.lineTo(-r, h); c.ellipse(0, h, r, ry, 0, Math.PI, 0, true); c.closePath();
      const g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, '#050505'); g.addColorStop(.42, '#3a3a3a'); g.addColorStop(.7, '#1c1c1c'); g.addColorStop(1, '#040404'); c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = r * .045; const sp = r * .22, off = (t * r * 1.6) % sp;
      for (let i = -1; i < 2 * r / sp + 1; i++) { const x = -r + i * sp + off; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(x, -ry); c.lineTo(x + sg * r * .3, h + ry); c.stroke(); } }
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = r * .08; c.beginPath(); c.moveTo(-r, h * .5); c.lineTo(r, h * .5); c.stroke(); c.restore();
      const gt = c.createRadialGradient(-r * .3, -ry * .5, r * .1, 0, 0, r); gt.addColorStop(0, '#555'); gt.addColorStop(.6, '#262626'); gt.addColorStop(1, '#101010'); c.fillStyle = gt; c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.fill();
      c.strokeStyle = '#4a4a4a'; c.lineWidth = r * .06; c.stroke();
      c.save(); c.beginPath(); c.ellipse(0, 0, r * .95, ry * .95, 0, 0, TAU); c.clip(); c.scale(1, ry / r); c.rotate(t * 1.5);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = r * .07; c.beginPath(); c.arc(0, 0, r * .62, 0, TAU); c.stroke();
      c.lineCap = 'round'; c.lineWidth = r * .09; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * r * .3, -r * .4); c.lineTo(-sg * r * .18, r * .3); c.lineTo(-sg * r * .4, r * .22); c.stroke(); }
      circle(c, 0, r * .42, r * .09, '#fff'); c.restore();
      c.globalAlpha = .35; ellipse(c, -r * .35, -ry * .45, r * .3, ry * .22, '#fff', -.2); c.restore();
    },
    etoiles(c, r, t) { c.save(); c.rotate(t * 3); c.shadowColor = '#ffd23f'; c.shadowBlur = r * .8; star(c, 0, 0, r * 1.15, '#fff3a0'); star(c, 0, 0, r * .6, '#ffd23f'); for (let i = 0; i < 3; i++) { const a = i * TAU / 3 - t * 5; star(c, Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5, r * .45, ['#4fc3ff', '#ff4f9a', '#9cff6b'][i]); } c.restore(); },
    pokeball(c, r, t) { c.save(); c.rotate(t * 5); c.beginPath(); c.arc(0, 0, r, Math.PI, TAU); c.closePath(); c.fillStyle = '#e23b3b'; c.fill(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI); c.closePath(); c.fillStyle = '#f4f4f4'; c.fill(); c.strokeStyle = '#1b1b1b'; c.lineWidth = r * .14; c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.stroke(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); circle(c, 0, 0, r * .34, '#1b1b1b'); circle(c, 0, 0, r * .24, '#fff'); circle(c, 0, 0, r * .12, '#e8e8e8'); c.globalAlpha = .6; ellipse(c, -r * .4, -r * .5, r * .2, r * .1, '#fff', -.5); c.restore(); },
    bloc(c, r, t) { c.save(); c.rotate(Math.sin(t * 3) * .15); const s = r * .92, px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }; px(-s, -s * .45, s * 2, s * 1.45, '#8a5a2b'); for (let i = 0; i < 12; i++) px(-s + (i * 37 % 7) * s * .285, -s * .3 + (i * 53 % 5) * s * .25, s * .25, s * .2, i % 2 ? '#6b4320' : '#a06a36'); px(-s, -s, s * 2, s * .55, '#45b84a'); for (let i = 0; i < 9; i++) px(-s + i * s * .222, -s, s * .222, s * .2 + (i % 3) * s * .1, i % 2 ? '#2f9a3a' : '#5ed05a'); for (let i = 0; i < 5; i++) px(-s + i * s * .4 + s * .1, -s * .5, s * .2, s * .12, '#2f9a3a'); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = r * .06; c.strokeRect(-s, -s, s * 2, s * 2); c.restore(); },
    mario(c, r, t) { c.save(); sphere(c, r, '#5a5a66', '#0d0d12'); c.fillStyle = '#1b1b1b'; for (const sg of [-1, 1]) { c.save(); c.translate(sg * r * .85, r * .15); c.scale(sg, 1); c.rotate(.5 + Math.sin(t * 8) * .3); c.fillStyle = '#1b1b1b'; c.beginPath(); c.roundRect(-r * .15, -r * .12, r * .6, r * .24, r * .1); c.fill(); circle(c, r * .5, 0, r * .2, '#f4f4f4'); c.restore(); } for (const sg of [-1, 1]) { ellipse(c, sg * r * .32, -r * .15, r * .22, r * .3, '#fff'); circle(c, sg * r * .36, -r * .1, r * .11, '#1b1b1b'); c.strokeStyle = '#000'; c.lineWidth = r * .09; c.beginPath(); c.moveTo(sg * r * .1, -r * .5); c.lineTo(sg * r * .55, -r * .35); c.stroke(); } c.strokeStyle = '#000'; c.lineWidth = r * .07; c.beginPath(); c.arc(0, r * .55, r * .3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.restore(); },
  });
  const TRAIL = {
    smoke(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .25 * i / pts.length; circle(c, p.x, p.y, r * (.5 + .5 * i / pts.length), '#c9d0dc'); }); },
    flames(c, pts, r, t = 0) {
      const n = pts.length; if (!n) return;
      // fumée au bout de la queue, puis trois couches de flamme (rouge, orange, jaune) qui grossissent vers le boulet et montent en tremblotant
      pts.slice(0, Math.ceil(n / 3)).forEach((p, i) => { c.globalAlpha = .16; circle(c, p.x + Math.sin(t * 5 + i) * r * .3, p.y - r * (1.1 + i * .25), r * (1 - i * .12), '#6b6b6b'); });
      c.lineCap = 'round';
      for (const [col, k, a] of [['#c81e0a', 1.2, .5], ['#ff6a1a', .9, .8], ['#ffe76c', .55, .95]]) {
        const q = pts.map((p, i) => { const f = (i + 1) / n; return { x: p.x + Math.sin(t * 27 + i * 2.1) * r * .3 * (1 - f), y: p.y - (1 - f) * r * .9 - Math.cos(t * 23 + i * 1.7) * r * .2 * (1 - f), f }; });
        c.strokeStyle = col;
        for (let i = 1; i < n; i++) { c.globalAlpha = a * q[i].f; c.lineWidth = 2 * r * k * (.15 + .95 * q[i].f); c.beginPath(); c.moveTo(q[i - 1].x, q[i - 1].y); c.lineTo(q[i].x, q[i].y); c.stroke(); }
        if (n === 1) { c.globalAlpha = a; circle(c, q[0].x, q[0].y, r * k, col); }
      }
      // braises qui s'envolent
      pts.forEach((p, i) => { if (i % 2) return; const e = (t * 2.5 + i * .37) % 1, f = (i + 1) / n; c.globalAlpha = .95 * (1 - e) * f; circle(c, p.x + Math.sin(i * 4 + t * 9) * r * 1.3, p.y - r * .6 - e * r * 2.8, r * .17, e < .5 ? '#fff3a0' : '#ff8c2a'); });
    },
    stars(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .9 * i / pts.length; star(c, p.x + Math.sin(i * 5) * r, p.y + Math.cos(i * 3) * r, r * .6, ['#ff4f6b', '#ffd23f', '#4fc3ff', '#9cff6b', '#c54fff'][i % 5]); }); },
    snow(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .7 * i / pts.length; for (let k = 0; k < 3; k++) circle(c, p.x + Math.sin(i * 7 + k * 2) * r, p.y + Math.cos(i * 4 + k) * r, r * .22, '#fff'); }); },
    sparkle(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .9 * i / pts.length; star(c, p.x + Math.sin(i * 9) * r * 1.2, p.y + Math.cos(i * 6) * r * 1.2, r * .45, i % 2 ? '#fff' : '#ffd23f', 4); }); },
    leaves(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .8 * i / pts.length; ellipse(c, p.x + Math.sin(i * 5) * r, p.y + Math.cos(i * 3) * r, r * .5, r * .25, i % 2 ? '#ff8c2a' : '#c0392b', i); }); },
    rainbow(c, pts, r) { if (pts.length < 2) return; const cols = ['#ff4f6b', '#ff8c2a', '#ffd23f', '#9cff6b', '#4fc3ff', '#c54fff']; cols.forEach((col, k) => { c.globalAlpha = .55; c.strokeStyle = col; c.lineWidth = r * .3; c.beginPath(); pts.forEach((p, i) => { const y = p.y + (k - 2.5) * r * .3; i ? c.lineTo(p.x, y) : c.moveTo(p.x, y); }); c.stroke(); }); },
    magic(c, pts, r) { TRAIL.rainbow(c, pts, r * 1.3); TRAIL.sparkle(c, pts, r * 1.2); },
    hearts(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .9 * i / pts.length; heartB(c, p.x + Math.sin(i * 5) * r * 1.1, p.y + Math.cos(i * 3) * r, r * (.3 + .25 * (i % 2)), i % 2 ? '#ff4f9a' : '#ff9ad5'); }); },
    confetti(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .9 * i / pts.length; for (let k = 0; k < 3; k++) { c.fillStyle = ['#ff4f6b', '#ffd23f', '#4fc3ff', '#9cff6b', '#c54fff'][(i + k) % 5]; c.save(); c.translate(p.x + Math.sin(i * 7 + k * 2) * r * 1.3, p.y + Math.cos(i * 4 + k) * r * 1.3); c.rotate(i + k); c.fillRect(-r * .18, -r * .1, r * .36, r * .2); c.restore(); } }); },
    ice(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .8 * i / pts.length; for (let k = 0; k < 2; k++) ellipse(c, p.x + Math.sin(i * 6 + k * 3) * r, p.y + Math.cos(i * 5 + k) * r * .6, r * .5, r * .12, '#e8f6ff', i * .7 + k); }); },
    pixels(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .85 * i / pts.length; for (let k = 0; k < 2; k++) { c.fillStyle = k ? '#8a5a2b' : '#45b84a'; const sz = r * .32; c.fillRect(p.x + Math.sin(i * 5 + k * 2) * r - sz / 2, p.y + Math.cos(i * 3 + k) * r - sz / 2, sz, sz); } }); },
    none() { },
  };
  // Bateau pirate volant du pouvoir : projeté comme un monstre, fait demi-tour en bout d'écran (dir), roule doucement
  R.pirateShip = (c, s, t) => { const p = P(s); c.save(); c.translate(p.x, p.y); c.scale(p.scale * 1.7, p.scale * 1.7); c.rotate(Math.sin(t * 1.8 + s.roll) * .05); shipSprite(c, t, s.flash, s.dir); c.restore(); };
  R.ball = (c, b, skin, t) => {
    // Une bille (size 1) fait environ 20 px à la sortie du canon ; les boulets géants grossissent sans limite.
    if (b.pirate) skin = 'fer'; const k = CB.BALLS[skin] || CB.BALLS.fer, p = P(b), r = Math.max(2.5, p.scale * .45 * b.size);
    const pts = b.trail.map(q => { const pp = P(q); return { x: pp.x, y: pp.y }; });
    if (b.lock) { c.save(); c.globalAlpha = .8; c.strokeStyle = '#ffe76c'; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.lineDashOffset = -t * 30; c.beginPath(); c.arc(p.x, p.y, r + 5, 0, TAU); c.stroke(); c.restore(); }
    c.save(); (TRAIL[b.disco ? 'magic' : b.effect === 'feu' ? 'flames' : b.effect === 'neige' ? 'snow' : b.effect === 'etoiles' ? 'stars' : k.trail] || TRAIL.none)(c, pts, r, t); c.globalAlpha = 1;
    c.translate(p.x, p.y);
    if (b.warp) { c.shadowColor = '#c47dff'; c.shadowBlur = 18; }
    if (b.ghost) { c.globalAlpha = .6; c.shadowColor = '#dfe9ff'; c.shadowBlur = 16; circle(c, 0, 0, r * 1.5, 'rgba(223,233,255,.5)'); E.ghost(c, { color: '#f4f7ff', phase: 0, age: t, x: 0 }, t); c.restore(); return; }
    if (b.disco && !b.rocket) { c.shadowColor = 'hsl(' + ((t * 400) % 360) + ',100%,70%)'; c.shadowBlur = 18; BALL.disco(c, r * 1.15, t); c.shadowBlur = 0; c.restore(); return; }
    if (b.rocket) { R.rocket(c, b, p, pts, r, t); c.restore(); return; }
    if (b.mega) { R.megaBall(c, b, p, pts, r, t); c.restore(); return; }
    if (b.effect === 'bowling') BALL.bowling(c, r); else if (b.effect === 'etoiles') BALL.etoile(c, r, t); else if (b.effect === 'neige') BALL.neige(c, r); else if (b.effect === 'feu') BALL.feu(c, r, t); else { if (b.variant == null) b.variant = Math.floor(Math.random() * 10); (BALL[skin] || BALL.fer)(c, r, t, b); }
    if (b.effect === 'eclair') { c.strokeStyle = '#7fd4ff'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 30 + i * 2) * r * 2.2, Math.sin(t * 30 + i * 2) * r * 2.2); c.stroke(); } }
    c.restore();
  };

  // La licorne volante d'Alexie : blanche, ailes qui battent, corne dorée, crinière et queue arc-en-ciel, étincelles.
  const RB = ['#ff4f6b', '#ff8c2a', '#ffd23f', '#9cff6b', '#4fc3ff', '#c54fff'];
  // Le méga dragon de fin de nuée : de profil, ailes immenses, souffle de feu devant lui, bourrasque derrière
  R.dragon = (c, o, t) => {
    const p = P(o), s = p.scale * 1.55, flap = Math.sin(t * 6), col = '#c0283a', dark = '#7d1322', belly = '#ffb347', wing = '#8e1b2b';
    c.save(); c.translate(p.x, p.y); c.scale(s * o.dir, s);
    c.lineCap = 'round'; c.lineJoin = 'round';
    // bourrasque derrière lui
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .18; for (let i = 0; i < 9; i++) { const y = -4 + i * 1.1 + Math.sin(t * 7 + i) * .4, x = -9 - (i % 3) * 2 - (t * 30 + i * 4) % 9; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3 - (i % 2), y); c.stroke(); }
    // queue
    c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-6, .2); c.quadraticCurveTo(-10, -1 + Math.sin(t * 4) * .8, -13.5, 1.5 + Math.sin(t * 3) * 1.2); c.stroke();
    c.fillStyle = dark; c.beginPath(); c.moveTo(-13.2, 1.3 + Math.sin(t * 3) * 1.2); c.lineTo(-15.5, -.2 + Math.sin(t * 3) * 1.2); c.lineTo(-15, 3 + Math.sin(t * 3) * 1.2); c.closePath(); c.fill();
    // aile arrière (plus sombre)
    c.fillStyle = dark; c.beginPath(); c.moveTo(-1, -1.5); c.quadraticCurveTo(-5, -7 - flap * 2.5, -10, -8 - flap * 3); c.lineTo(-8.5, -4 - flap * 1.5); c.lineTo(-7, -5.5 - flap * 2); c.lineTo(-5, -2.5 - flap); c.closePath(); c.fill();
    // corps + ventre
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 7.2, 2.7, 0, 0, TAU); c.fill();
    c.fillStyle = belly; c.beginPath(); c.ellipse(.5, 1, 6, 1.5, 0, 0, Math.PI); c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = dark; c.beginPath(); c.moveTo(-5 + i * 1.8, -2.4); c.lineTo(-4.2 + i * 1.8, -3.9); c.lineTo(-3.4 + i * 1.8, -2.4); c.fill(); }
    // pattes
    c.strokeStyle = col; c.lineWidth = .9; for (const x of [-2.5, 2.5]) { c.beginPath(); c.moveTo(x, 2); c.lineTo(x - .5, 3.6 + Math.sin(t * 5 + x) * .3); c.stroke(); }
    // cou + tête
    c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); c.moveTo(6, -.8); c.quadraticCurveTo(8.5, -2, 9.5, -5); c.stroke();
    c.fillStyle = col; c.beginPath(); c.ellipse(10.5, -5.6, 2.6, 1.7, .15, 0, TAU); c.fill();
    c.fillStyle = dark; for (const [x, y] of [[8.6, -7.2], [9.6, -7.6]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.3, y - 2.4); c.lineTo(x + .6, y - .4); c.fill(); }
    c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(11, -6.3, .55, .45, 0, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.ellipse(11.15, -6.3, .2, .4, 0, 0, TAU); c.fill();
    // mâchoire ouverte
    const jaw = .5 + Math.max(0, Math.sin(t * 5)) * .6; c.fillStyle = col; c.beginPath(); c.moveTo(11.5, -5); c.lineTo(14, -4.2 + jaw); c.lineTo(12, -3.4 + jaw); c.closePath(); c.fill();
    c.fillStyle = '#fff'; for (const x of [12.3, 13]) { c.beginPath(); c.moveTo(x, -4.6); c.lineTo(x + .3, -3.9); c.lineTo(x + .6, -4.6); c.fill(); }
    // souffle de feu
    const g = c.createLinearGradient(13, 0, 24, 0); g.addColorStop(0, 'rgba(255,240,120,.95)'); g.addColorStop(.5, 'rgba(255,140,42,.85)'); g.addColorStop(1, 'rgba(255,60,30,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(13, -4.6); for (let i = 0; i <= 6; i++) c.lineTo(13 + i * 1.9, -4.6 - (1 + i * .8) * (1 + Math.sin(t * 25 + i * 1.3) * .25)); for (let i = 6; i >= 0; i--) c.lineTo(13 + i * 1.9, -4.6 + (1 + i * .8) * (1 + Math.cos(t * 23 + i * 1.1) * .25)); c.closePath(); c.fill();
    // aile avant
    c.fillStyle = wing; c.beginPath(); c.moveTo(1, -2); c.quadraticCurveTo(-1, -8 - flap * 3, -5, -11 - flap * 3.5); c.lineTo(-3, -6.5 - flap * 2); c.lineTo(-1.5, -8 - flap * 2.5); c.lineTo(1, -5 - flap * 1.2); c.lineTo(2.5, -6 - flap * 1.5); c.lineTo(4, -2.6 - flap * .4); c.closePath(); c.fill();
    c.strokeStyle = dark; c.lineWidth = .3; c.beginPath(); c.moveTo(1, -2); c.lineTo(-5, -11 - flap * 3.5); c.moveTo(1, -2); c.lineTo(-1.5, -8 - flap * 2.5); c.moveTo(1, -2); c.lineTo(2.5, -6 - flap * 1.5); c.stroke();
    c.restore();
  };
  // Éclair dentelé entre deux points : halo coloré, cœur blanc, deux branches, étincelles à l'arrivée. seed change le tracé (scintillement).
  R.lightning = (c, x0, y0, x1, y1, color, width, alpha, seed) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, N = Math.max(5, Math.min(12, Math.round(len / 45)));
    const pts = [[x0, y0]]; for (let i = 1; i < N; i++) { const f = i / N, off = (hash(seed * 31 + i) - .5) * Math.min(60, len * .22) * Math.sin(f * Math.PI); pts.push([x0 + dx * f + nx * off, y0 + dy * f + ny * off]); } pts.push([x1, y1]);
    const path = (list) => { c.beginPath(); c.moveTo(list[0][0], list[0][1]); for (let i = 1; i < list.length; i++) c.lineTo(list[i][0], list[i][1]); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = color; c.shadowBlur = 18;
    // branches
    c.globalAlpha = alpha * .7; c.strokeStyle = color; c.lineWidth = Math.max(1, width * .45);
    for (let bI = 0; bI < 2; bI++) { const i = 1 + Math.floor(hash(seed * 7 + bI) * (pts.length - 3)), [bx, by] = pts[i], s = hash(seed * 13 + bI) > .5 ? 1 : -1, L = 18 + hash(seed * 17 + bI) * 30; path([[bx, by], [bx + dx / len * L * .5 + nx * s * L * .6, by + dy / len * L * .5 + ny * s * L * .6], [bx + dx / len * L + nx * s * L * .9, by + dy / len * L + ny * s * L * .9]]); c.stroke(); }
    // halo, cœur, filament blanc
    for (const [lw, col, a] of [[width * 3.2, color, .35], [width * 1.4, color, .9], [Math.max(1, width * .5), '#fff', 1]]) { c.globalAlpha = alpha * a; c.strokeStyle = col; c.lineWidth = Math.max(.8, lw); path(pts); c.stroke(); }
    // étincelles à l'impact
    c.shadowBlur = 0; c.globalAlpha = alpha; c.fillStyle = '#fff'; circle(c, x1, y1, Math.max(2, width * 1.2), '#fff'); c.strokeStyle = color; c.lineWidth = Math.max(1, width * .5);
    for (let i = 0; i < 6; i++) { const a = hash(seed * 3 + i) * TAU, L = 8 + hash(seed * 5 + i) * 14; c.beginPath(); c.moveTo(x1 + Math.cos(a) * 4, y1 + Math.sin(a) * 4); c.lineTo(x1 + Math.cos(a) * L, y1 + Math.sin(a) * L); c.stroke(); }
    c.restore();
  };
  R.unicorn = (c, u, t) => {
    const p = P(u), s = p.scale * 1.1, bob = Math.sin(t * 6) * .25, flap = Math.sin(t * 14);
    c.save(); c.translate(p.x, p.y + bob * s); c.scale(s * u.dir, s);
    c.globalAlpha = .9; for (let i = 0; i < 7; i++) star(c, Math.cos(i * 2.1 + t * 3) * 7, Math.sin(i * 1.7 + t * 4) * 4, .5 + Math.sin(t * 9 + i) * .2, RB[i % 6]); c.globalAlpha = 1;
    // queue et crinière arc-en-ciel (rubans)
    c.lineCap = 'round'; RB.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = .45; c.beginPath(); c.moveTo(-2.6, -.4 + i * .18); c.quadraticCurveTo(-4.5 + Math.sin(t * 5 + i) * .4, -1.2 + i * .35, -6 + Math.sin(t * 4 + i) * .5, .4 + i * .45); c.stroke(); });
    // aile arrière
    c.fillStyle = '#f3ecff'; c.beginPath(); c.moveTo(-.4, -1.2); c.quadraticCurveTo(-2.5, -3.6 - flap * 1.2, -4.6, -2.4 - flap * 1.6); c.quadraticCurveTo(-2.6, -1.4, -.6, -.6); c.fill();
    // pattes
    c.strokeStyle = '#fff'; c.lineWidth = .55; for (const [x, k] of [[-1.8, 0], [-1, 1], [.8, 2], [1.6, 3]]) { c.beginPath(); c.moveTo(x, .9); c.lineTo(x - .3 + Math.sin(t * 8 + k) * .35, 2.3); c.stroke(); }
    c.fillStyle = '#d9b8ff'; for (const [x, k] of [[-1.8, 0], [-1, 1], [.8, 2], [1.6, 3]]) circle(c, x - .3 + Math.sin(t * 8 + k) * .35, 2.4, .32, '#c9a8f5');
    // corps + cou + tête
    ellipse(c, 0, 0, 2.7, 1.4, '#fff'); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(1.6, -.8); c.quadraticCurveTo(2.6, -2.4, 3.1, -3.4); c.lineTo(4, -3); c.quadraticCurveTo(3.2, -1.4, 2.4, .4); c.fill();
    ellipse(c, 3.9, -3.3, 1.25, .85, '#fff'); ellipse(c, 4.9, -3, .55, .4, '#ffd6ea');
    // crinière
    RB.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = .35; c.beginPath(); c.moveTo(2.2 - i * .25, -1.6 - i * .35); c.quadraticCurveTo(1.4 - i * .3, -1.2 - i * .5 + Math.sin(t * 6 + i) * .2, 1.0 - i * .25, -.3 - i * .35); c.stroke(); });
    // corne dorée, oreille, œil, joue
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(3.4, -4.1); c.lineTo(3.8, -6.2); c.lineTo(4.2, -4.1); c.closePath(); c.fill(); c.strokeStyle = '#f0a500'; c.lineWidth = .12; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(3.5 + i * .1, -4.5 - i * .5); c.lineTo(4.1 - i * .1, -4.6 - i * .5); c.stroke(); }
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(2.9, -4); c.lineTo(2.8, -5); c.lineTo(3.3, -4.2); c.fill();
    circle(c, 4.1, -3.5, .3, '#2b1a5e'); circle(c, 4.2, -3.6, .1, '#fff'); c.globalAlpha = .6; circle(c, 4.3, -2.9, .35, '#ffb3d9'); c.globalAlpha = 1;
    // aile avant
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(.4, -1.2); c.quadraticCurveTo(-1.6, -3.9 - flap * 1.3, -3.8, -2.8 - flap * 1.8); c.quadraticCurveTo(-1.8, -1.2, .2, -.5); c.fill(); c.strokeStyle = '#e8d8ff'; c.lineWidth = .15; c.beginPath(); c.moveTo(.2, -1); c.quadraticCurveTo(-1.4, -2.8 - flap, -3.2, -2.6 - flap * 1.6); c.stroke();
    c.restore();
  };
  const heart = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + r * .9); c.bezierCurveTo(x - r * 1.5, y - r * .2, x - r * .8, y - r * 1.2, x, y - r * .4); c.bezierCurveTo(x + r * .8, y - r * 1.2, x + r * 1.5, y - r * .2, x, y + r * .9); c.fill(); };
  // Bulle d'amour de Marie : dôme rose autour du canon, cœurs qui tournent et pluie de petits cœurs.
  R.loveDome = (c, wave, t, w, h) => {
    const V = CB.VIEW, total = (wave.special && wave.special.id === 'marie' && wave.special.seconds) || 12, left = wave.fx.protect, k = Math.min(1, (total - left) * 2, left), x = V.cx, y = V.ground - V.size * .9, r = V.size * 1.7; if (k <= 0) return; c.save();
    c.globalAlpha = k * .28; const g = c.createRadialGradient(x, y, r * .3, x, y, r); g.addColorStop(0, 'rgba(255,170,210,.15)'); g.addColorStop(.85, 'rgba(255,110,180,.55)'); g.addColorStop(1, 'rgba(255,110,180,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.globalAlpha = k * .85; c.strokeStyle = '#ff8ac6'; c.lineWidth = 3; c.shadowColor = '#ff8ac6'; c.shadowBlur = 18; c.setLineDash([8, 12]); c.lineDashOffset = t * 30; c.beginPath(); c.arc(x, y, r * (1 + Math.sin(t * 3) * .02), 0, TAU); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 8; i++) { const a = t * 1.3 + i * TAU / 8; heart(c, x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .65, 9 + (i % 2) * 4, i % 2 ? '#fff' : '#ff6fb0'); }
    c.shadowBlur = 0; for (let i = 0; i < 40; i++) { const ph = (t * (.25 + (i % 4) * .08) + i * .29) % 1, px = ((i * 167) % w) + Math.sin(t * 2 + i) * 14, py = h - ph * (h + 30); c.globalAlpha = k * Math.sin(ph * Math.PI) * .7; heart(c, px, py, 4 + (i % 3) * 3, i % 3 ? '#ff8ac6' : '#fff'); }
    c.restore();
  };
  // Mode fantôme d'Eliott : brouillard au sol, feux follets, et les trois esprits.
  R.ghostMode = (c, wave, t, w, h) => {
    const total = (wave.special && wave.special.id === 'eliott' && wave.special.seconds) || 8, left = wave.fx.ghost, k = Math.min(1, (total - left) * 2, left); c.save();
    c.globalAlpha = k * .3; c.fillStyle = '#0a0f2a'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, h * .55, 0, h); g.addColorStop(0, 'rgba(220,230,255,0)'); g.addColorStop(1, 'rgba(220,230,255,.55)'); c.globalAlpha = k; c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const ph = (t * (.2 + (i % 3) * .1) + i * .37) % 1, x = ((i * 211) % w) + Math.sin(t * 1.4 + i) * 30, y = h * .9 - ph * h * .8; c.globalAlpha = k * Math.sin(ph * Math.PI) * .6; circle(c, x, y, 5 + (i % 3) * 3, i % 2 ? '#dfe9ff' : '#9beaff'); }
    c.restore();
  };
  R.spirit = (c, sp, t, i) => { const p = P(sp); c.save(); c.translate(p.x, p.y + Math.sin(t * 5 + i) * 4); c.scale(p.scale * 1.1, p.scale * 1.1); c.globalAlpha = .85; c.shadowColor = '#dfe9ff'; c.shadowBlur = 16; E.ghost(c, { color: '#f4f7ff', phase: 0, age: t + i, x: 0 }, t + i); c.restore(); };
  // Traînées de vent horizontales (tornades, blizzard).
  R.windStreaks = (c, t, w, h, k, col, n) => { c.save(); c.strokeStyle = col; c.lineCap = 'round'; for (let i = 0; i < n; i++) { const ph = (t * (1.2 + (i % 5) * .25) + i * .41) % 1, y = ((i * 131) % h), len = w * (.12 + (i % 3) * .08), x = -len + ph * (w + len * 2); c.globalAlpha = k * Math.sin(ph * Math.PI) * .5; c.lineWidth = 1.5 + (i % 3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y + len * .06); c.stroke(); } c.restore(); };
  // Blizzard d'Émily : voile blanc-bleu, grosse neige poussée par le vent, bourrasques et givre sur les bords.
  R.blizzard = (c, wave, t, w, h) => {
    const total = (wave.special && wave.special.id === 'emily' && wave.special.seconds) || 12, left = wave.fx.blizzard, k = Math.min(1, (total - left) * 2, left); c.save();
    c.globalAlpha = k * .22; c.fillStyle = '#dff3ff'; c.fillRect(0, 0, w, h);
    const g = c.createRadialGradient(w / 2, h / 2, w * .25, w / 2, h / 2, w * .72); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(235,248,255,' + (.6 * k) + ')'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, w, h);
    R.windStreaks(c, t, w, h, k, '#ffffff', 34);
    const gust = .6 + .4 * Math.sin(t * 1.3);
    for (let i = 0; i < 220; i++) { const sp = 1 + (i % 5) * .35, x = ((i * 97 + t * (420 + (i % 5) * 110) * gust) % (w + 240)) - 120, y = ((i * 53 + t * (150 + (i % 3) * 70) * sp) % (h + 40)) - 20, r = 1.5 + (i % 4) * 1.2; c.globalAlpha = k * (.5 + .5 * ((i * 7) % 10) / 10); circle(c, x, y, r, i % 7 ? '#fff' : '#cfeeff'); }
    c.restore();
  };
  // Casino de Jessica : ampoules clignotantes tout autour de l'écran et pluie de pièces qui tournent.
  R.casino = (c, wave, t, w, h) => {
    const total = (wave.special && wave.special.id === 'jessica' && wave.special.seconds) || 30, left = wave.fx.magnet, k = Math.min(1, (total - left) * 2, left); c.save();
    const step = 28, cols = ['#ffd23f', '#ff4f6b', '#fff', '#7dff9a'], phase = Math.floor(t * 8); c.shadowBlur = 10;
    const bulb = (x, y, i) => { const col = cols[(i + phase) % 4]; c.shadowColor = col; c.globalAlpha = k * ((i + phase) % 2 ? 1 : .35); circle(c, x, y, 5, col); };
    let i = 0; for (let x = 14; x < w; x += step) { bulb(x, 10, i++); bulb(x, h - 10, i++); } for (let y = 14 + step; y < h - step; y += step) { bulb(10, y, i++); bulb(w - 10, y, i++); }
    c.shadowBlur = 0; for (let j = 0; j < 80; j++) { const sp = 160 + (j % 4) * 70, x = (j * 131) % w, y = ((t * sp + j * 77) % (h + 60)) - 30, r = 7 + (j % 3) * 3, spin = Math.abs(Math.cos(t * 5 + j)); c.globalAlpha = k * .95; c.fillStyle = '#b8860b'; c.beginPath(); c.ellipse(x, y, Math.max(1.5, r * spin), r, 0, 0, TAU); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(x, y, Math.max(1, r * spin * .78), r * .78, 0, 0, TAU); c.fill(); if (spin > .5) { c.fillStyle = '#b8860b'; c.font = 'bold ' + Math.round(r * 1.1) + 'px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', x, y + 1); } }
    c.restore();
  };
  // Tornades d'Edison : entonnoirs géants qui grandissent du ciel au sol, rayures qui tournent, débris et nuage sombre au sommet.
  R.tornadoes = (c, wave, t) => {
    for (const T of wave.tornadoes) { if (!(T.grow > 0)) continue; const base = P({ x: T.x, y: 0, z: T.z }), top = P({ x: T.x, y: 46, z: T.z }), H = (base.y - top.y) * T.grow, u = base.scale, n = 18; c.save();
      c.globalAlpha = .75 * T.grow; for (let i = 0; i < 6; i++) ellipse(c, top.x + (i - 2.5) * u * 7, base.y - H - u * 2, u * (9 + (i % 2) * 4) * T.grow, u * 4 * T.grow, '#3b4458');
      for (let i = 0; i < n; i++) { const k = i / n, y = base.y - H * k, rx = u * (1.4 + 15 * k) * T.grow, ry = rx * .32, x = base.x + Math.sin(t * 5 + k * 6 + T.x) * u * 2.5 * k; c.globalAlpha = (.75 - .3 * k) * T.grow; c.fillStyle = i % 2 ? '#c9d0dc' : '#aab4c6'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(60,70,90,.55)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, rx, ry, 0, t * 9 + k * 4, t * 9 + k * 4 + 2.2); c.stroke(); }
      c.globalAlpha = .8 * T.grow; for (let i = 0; i < 14; i++) { const k = ((t * .6 + i * .13) % 1), a = t * 7 + i * 2, rx = u * (1.4 + 15 * k) * T.grow * 1.1, x = base.x + Math.cos(a) * rx, y = base.y - H * k + Math.sin(a) * rx * .32; circle(c, x, y, u * .5 + (i % 3) * u * .25, i % 3 ? '#6b7a2b' : '#8a5a2b'); }
      c.restore(); }
  };
  // Vortex de Jérémie : trou violet qui tourne dans le ciel, anneaux, éclairs et étincelles.
  R.vortex = (c, v, t, left) => {
    const p = P(v), R0 = p.scale * 13 * Math.min(1, v.age * 2.2, left * 2); if (R0 <= 0) return; c.save(); c.translate(p.x, p.y);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R0); g.addColorStop(0, '#000'); g.addColorStop(.55, '#1a0636'); g.addColorStop(.85, 'rgba(120,40,220,.7)'); g.addColorStop(1, 'rgba(120,40,220,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R0, 0, TAU); c.fill();
    c.lineCap = 'round'; c.shadowColor = '#c47dff'; c.shadowBlur = 18; for (let i = 0; i < 6; i++) { c.strokeStyle = i % 2 ? '#c47dff' : '#7fd4ff'; c.lineWidth = 4 - i * .4; c.globalAlpha = .9; c.beginPath(); for (let k = 0; k <= 30; k++) { const a = -t * 4 + i * TAU / 6 + k * .18, r = R0 * (.12 + k / 30 * .95); k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r * .85) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r * .85); } c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.globalAlpha = .9; for (let i = 0; i < 3; i++) { const seed = Math.floor(t * 14) + i * 5; let a = (seed * 1.7) % TAU, r = R0 * .4; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r * .85); for (let k = 0; k < 5; k++) { a += (((seed + k) * 0.37) % 1 - .5) * .6; r += R0 * .18; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * .85); } c.stroke(); }
    c.restore();
  };
  // Un ange de la Prière de Josée : auréole dorée, robe blanche, ailes qui battent, halo de lumière.
  R.angel = (c, a, t, i = 0) => {
    const p = P(a), s = p.scale * 1.05, flap = Math.sin(t * 9 + i * 2), glow = .6 + Math.sin(t * 5 + i) * .2;
    c.save(); c.translate(p.x, p.y); c.scale(s, s);
    c.globalAlpha = glow * .45; const g = c.createRadialGradient(0, 0, .5, 0, 0, 7); g.addColorStop(0, '#fff6c8'); g.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill(); c.globalAlpha = 1;
    // ailes
    for (const sgn of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(sgn * .8, -.6); c.quadraticCurveTo(sgn * 3.4, -3.2 - flap * .9, sgn * 5.2, -1.6 - flap * 1.4); c.quadraticCurveTo(sgn * 4.4, .6 - flap * .4, sgn * 3, 1.2); c.quadraticCurveTo(sgn * 1.6, 1.4, sgn * .8, .6); c.fill(); c.strokeStyle = '#ffe9a0'; c.lineWidth = .14; for (let k = 1; k <= 3; k++) { c.beginPath(); c.moveTo(sgn * .9, -.3 + k * .35); c.quadraticCurveTo(sgn * 2.8, -1.6 - flap * .5 + k * .5, sgn * (3.2 + k * .6), -.4 - flap * .9 + k * .4); c.stroke(); } }
    // robe
    c.fillStyle = '#fffdf5'; c.beginPath(); c.moveTo(-.9, -.8); c.lineTo(.9, -.8); c.lineTo(1.6, 3.2); c.quadraticCurveTo(0, 3.9, -1.6, 3.2); c.closePath(); c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = .18; c.beginPath(); c.moveTo(-1.5, 2.9); c.quadraticCurveTo(0, 3.5, 1.5, 2.9); c.stroke();
    // bras joints
    c.strokeStyle = '#f6d3b5'; c.lineWidth = .4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-.9, .2); c.lineTo(0, 1.1); c.lineTo(.9, .2); c.stroke();
    // tête, cheveux, auréole
    circle(c, 0, -1.6, .85, '#f6d3b5'); c.fillStyle = i ? '#5a3a1e' : '#f0c040'; c.beginPath(); c.arc(0, -1.75, .9, Math.PI, 0); c.fill(); circle(c, -.3, -1.6, .1, '#2b1a5e'); circle(c, .3, -1.6, .1, '#2b1a5e'); c.strokeStyle = '#c0392b'; c.lineWidth = .1; c.beginPath(); c.arc(0, -1.35, .25, .2, Math.PI - .2); c.stroke();
    c.strokeStyle = '#ffd23f'; c.lineWidth = .22; c.shadowColor = '#ffd23f'; c.shadowBlur = 8; c.beginPath(); c.ellipse(0, -2.9, 1.1, .32, 0, 0, TAU); c.stroke(); c.shadowBlur = 0;
    c.restore();
  };
  // La grande lumière de la Prière : rayons qui tournent depuis le ciel, pluie d'étincelles, et le bouclier à la croix autour du canon.
  R.prayerSky = (c, wave, t, w, h) => {
    const V = CB.VIEW, left = wave.fx.priere, a = Math.min(1, (15 - left) * 1.2, left * .8); if (a <= 0) return;
    const cx = V.cx, cy = V.horizon * .25; c.save();
    c.globalAlpha = a * .9; const g = c.createRadialGradient(cx, cy, 10, cx, cy, h * .7); g.addColorStop(0, 'rgba(255,255,235,.9)'); g.addColorStop(.25, 'rgba(255,230,150,.45)'); g.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.translate(cx, cy); for (let i = 0; i < 14; i++) { const ang = i * TAU / 14 + t * .25, wd = .09 + Math.sin(t * 3 + i) * .03; c.globalAlpha = a * (.08 + Math.sin(t * 4 + i * 1.7) * .04); c.fillStyle = '#fff6c8'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, h * 1.6, ang - wd, ang + wd); c.closePath(); c.fill(); } c.restore();
    c.save(); for (let i = 0; i < 36; i++) { const sp = .3 + (i % 4) * .15, x = (i * 173.3) % w, y = ((t * 50 * sp + i * 79) % (h + 40)) - 20; c.globalAlpha = a * (.4 + .5 * Math.sin(t * 6 + i)); star(c, x + Math.sin(t * 1.5 + i) * 6, y, 3 + (i % 3) * 2, i % 3 ? '#fff' : '#ffd23f', 4); } c.restore();
  };
  R.holyShield = (c, wave, t) => {
    const V = CB.VIEW, left = wave.fx.priere, a = Math.min(1, (15 - left) * 2, left), x = V.cx, y = V.ground - V.size * .9, r = V.size * 1.75; if (a <= 0) return;
    c.save(); c.globalAlpha = a * .22; const g = c.createRadialGradient(x, y, r * .2, x, y, r); g.addColorStop(0, 'rgba(255,245,200,.2)'); g.addColorStop(.85, 'rgba(255,210,63,.5)'); g.addColorStop(1, 'rgba(255,210,63,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.shadowColor = '#ffd23f'; c.shadowBlur = 24; for (let i = 0; i < 3; i++) { const k = ((t * .5 + i / 3) % 1); c.globalAlpha = a * (1 - k) * .8; c.strokeStyle = i % 2 ? '#fff3a0' : '#ffd23f'; c.lineWidth = 4 - k * 2; c.beginPath(); c.arc(x, y, r * (.55 + k * .5), 0, TAU); c.stroke(); }
    c.globalAlpha = a * .9; c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.setLineDash([14, 10]); c.lineDashOffset = -t * 40; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.setLineDash([]);
    // la croix, grande et lumineuse
    const cw = r * .14, ch = r * .62; c.globalAlpha = a * (.55 + Math.sin(t * 4) * .15); c.shadowBlur = 30; c.fillStyle = '#fffbe6'; c.fillRect(x - cw / 2, y - ch * .62, cw, ch); c.fillRect(x - ch * .33, y - ch * .28, ch * .66, cw); c.shadowBlur = 0;
    c.globalAlpha = a; for (let i = 0; i < 10; i++) { const ang = t * 1.6 + i * TAU / 10, rr = r * (.95 + Math.sin(t * 3 + i) * .06); star(c, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr * .7, 6 + (i % 2) * 3, i % 2 ? '#fff' : '#ffd23f', 4); }
    c.restore();
  };
  // Arc-en-ciel géant au loin pendant la licorne, avec nuages, étincelles qui montent et voile rose.
  R.rainbowSky = (c, wave, t, w, h) => {
    const V = CB.VIEW, left = wave.fx.licorne, total = (wave.special && wave.special.seconds) || 15, a = Math.min(1, (total - left) * 1.5, left * .8);
    if (a <= 0) return; c.save(); c.globalAlpha = a;
    const cx = V.cx, cy = V.horizon + 10, R0 = Math.max(w, h) * .42, band = Math.max(8, w * .012);
    c.lineCap = 'butt'; RB.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = band; c.globalAlpha = a * .75; c.beginPath(); c.arc(cx, cy, R0 - i * band, Math.PI, 0); c.stroke(); });
    c.globalAlpha = a * .95; for (const sgn of [-1, 1]) { const x = cx + sgn * R0 * .96, y = cy - 6; for (const [dx, dy, r] of [[0, 0, band * 2.2], [-band * 1.6, band * .4, band * 1.6], [band * 1.6, band * .5, band * 1.7], [band * .4, -band * 1.1, band * 1.5]]) circle(c, x + dx, y + dy, r, '#fff'); }
    for (let i = 0; i < 40; i++) { const sp = .25 + (i % 5) * .12, x = ((i * 137.5) % w), y = h - ((t * 60 * sp + i * 91) % (h + 40)) + 20, r = 2 + (i % 3) * 1.5; c.globalAlpha = a * (.5 + .5 * Math.sin(t * 7 + i)); star(c, x + Math.sin(t * 2 + i) * 8, y, r * 2, RB[i % 6], 4); }
    c.globalAlpha = a * .1; c.fillStyle = '#ff9ad5'; c.fillRect(0, 0, w, h); c.restore();
  };
  R.ballIcon = (c, skin, x, y, r, t = 0, variant = 5) => { c.save(); c.translate(x, y); (BALL[skin] || BALL.fer)(c, r, t, { variant }); c.restore(); };
  R.enemyIcon = (c, type, x, y, s, t = 0, color) => { if (String(type).startsWith('boss:')) { const key = type.slice(5), def = CB.BOSSES[key]; if (!def) return; c.save(); c.translate(x, y + s * .3); const k = s * 2.4 / def.size; c.scale(k, k); (BOSS[key] || E.bat)(c, { color: def.color, phase: 0, age: t, x: 0, def, stage: 1, act: 0, hp: 1, maxHp: 1 }, t); c.restore(); return; }
    const def = CB.ENEMIES[type] || CB.ENEMIES.bat; c.save(); c.translate(x, y); c.scale(s, s); (E[type] || E.bat)(c, { color: color || def.color, phase: 0, age: t, x: 0 }, t); c.restore(); };
  R.bossIcon = (c, key, x, y, s, t = 0) => { const def = CB.BOSSES[key]; if (!def) return; c.save(); c.translate(x, y); c.scale(s, s); BOSS[key](c, { color: def.color, phase: 0, age: t, x: 0, def }, t); c.restore(); };

  // Le méga boulet de Richard : boulet de fer incandescent, fissures de lave, onde de choc et traits de vitesse.
  R.megaBall = (c, b, p, pts, r, t) => {
    c.save(); c.translate(-p.x, -p.y); c.lineCap = 'round'; for (let i = 0; i < pts.length; i++) { const k = i / pts.length; c.globalAlpha = .15 + k * .3; circle(c, pts[i].x, pts[i].y, r * (.5 + k * .5), i % 2 ? '#ff8c2a' : '#ffd23f'); } c.restore();
    for (let i = 0; i < 3; i++) { const k = ((t * 1.4 + i / 3) % 1); c.globalAlpha = (1 - k) * .55; c.strokeStyle = i % 2 ? '#ffd23f' : '#fff'; c.lineWidth = 6 * (1 - k) + 1; c.beginPath(); c.arc(0, 0, r * (1 + k * .9), 0, TAU); c.stroke(); } c.globalAlpha = 1;
    c.shadowColor = '#ff6a1a'; c.shadowBlur = Math.min(60, r); const g = c.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, '#8a93a3'); g.addColorStop(.7, '#2a2f3a'); g.addColorStop(1, '#101318'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = '#ff8c2a'; c.lineWidth = Math.max(1.5, r * .06); c.globalAlpha = .7 + Math.sin(t * 20) * .3; for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + .4; c.beginPath(); c.moveTo(Math.cos(a) * r * .2, Math.sin(a) * r * .2); c.lineTo(Math.cos(a + .5) * r * .55, Math.sin(a + .5) * r * .55); c.lineTo(Math.cos(a + .3) * r * .9, Math.sin(a + .3) * r * .9); c.stroke(); } c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * 3; c.beginPath(); c.moveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15); c.lineTo(Math.cos(a) * r * (1.4 + (i % 3) * .15), Math.sin(a) * r * (1.4 + (i % 3) * .15)); c.stroke(); }
  };
  // ---------- Effets ----------
  // La fusée de Zachary : fuselage orienté dans le sens du vol, ailerons, flamme qui vacille et traînée de fumée.
  R.rocket = (c, b, p, pts, r, t) => {
    const last = pts.length ? pts[Math.max(0, pts.length - 3)] : { x: p.x, y: p.y + 30 }, a = Math.atan2(p.y - last.y, p.x - last.x) || -Math.PI / 2, L = r * 2.6;
    c.save(); c.translate(-p.x, -p.y); for (let i = 0; i < pts.length; i++) { const k = i / pts.length; c.globalAlpha = .18 + k * .25; circle(c, pts[i].x + Math.sin(t * 9 + i) * 3, pts[i].y, r * (.6 + (1 - k) * 1.1), '#cfd4dc'); } c.restore();
    c.save(); c.rotate(a);
    const fl = 1 + Math.sin(t * 60) * .25, fg = c.createLinearGradient(-L * .5, 0, -L * .5 - r * 3.2 * fl, 0); fg.addColorStop(0, '#fff'); fg.addColorStop(.25, '#ffd23f'); fg.addColorStop(.6, '#ff6a1a'); fg.addColorStop(1, 'rgba(255,60,20,0)');
    c.fillStyle = fg; c.beginPath(); c.moveTo(-L * .5, -r * .55); c.lineTo(-L * .5 - r * 3.2 * fl, 0); c.lineTo(-L * .5, r * .55); c.closePath(); c.fill();
    c.fillStyle = '#c62828'; for (const sgn of [-1, 1]) { c.beginPath(); c.moveTo(-L * .5, sgn * r * .5); c.lineTo(-L * .5 - r * .9, sgn * r * 1.5); c.lineTo(-L * .15, sgn * r * .5); c.closePath(); c.fill(); }
    c.fillStyle = '#eceff4'; c.beginPath(); c.roundRect(-L * .5, -r * .6, L * .8, r * 1.2, r * .4); c.fill();
    c.fillStyle = '#c62828'; c.beginPath(); c.moveTo(L * .3, -r * .6); c.lineTo(L * .75, 0); c.lineTo(L * .3, r * .6); c.closePath(); c.fill();
    circle(c, 0, 0, r * .3, '#5fb6ff'); c.strokeStyle = '#9aa3b0'; c.lineWidth = Math.max(1, r * .1); c.beginPath(); c.moveTo(-L * .35, -r * .6); c.lineTo(-L * .35, r * .6); c.stroke();
    c.restore();
  };
  R.burst = (c, b) => {
    const p = P(b), k = b.age / (b.life || .7); c.save(); c.translate(p.x, p.y);
    if (b.age < 0) { c.restore(); return; }
    if (b.kind === 'splash') { const s = p.scale * (b.size || 1), kk = Math.min(1, k * 1.15); c.globalAlpha = 1 - k * k;
      c.strokeStyle = '#eaf7ff'; c.lineWidth = Math.max(1, s * .22); c.beginPath(); c.ellipse(0, 0, s * (.8 + 4.5 * k), s * (.8 + 4.5 * k) * .28, 0, 0, TAU); c.stroke();
      c.globalAlpha = (1 - k) * .9; ellipse(c, 0, 0, s * (.8 + 2.2 * k), s * (.8 + 2.2 * k) * .3, '#dff3ff');
      const col = s * 3.4 * Math.sin(kk * Math.PI); c.globalAlpha = 1 - kk; ellipse(c, 0, -col / 2, s * .55 * (1 - kk * .4), col / 2, '#eaf7ff');
      for (let i = 0; i < 11; i++) { const a = (i / 11 - .5) * 2.4, d = s * (2.6 + (i % 3) * 1.2); circle(c, Math.sin(a) * d * kk * 1.4, -(Math.cos(a) * d * 1.6 * kk - d * 1.6 * kk * kk), s * (.32 - .18 * kk) * (1 + (i % 2) * .5), '#eaf7ff'); }
      c.restore(); return; }
    if (b.kind === 'heal') { c.globalAlpha = 1 - k; c.translate(0, -k * 26); c.fillStyle = '#7dff9a'; c.fillRect(-3, -10, 6, 20); c.fillRect(-10, -3, 20, 6); c.restore(); return; }
    if (b.kind === 'hearts') { c.globalAlpha = 1 - k; for (let i = 0; i < 7; i++) { const a = i * TAU / 7 + b.age * 2, d = p.scale * b.size * (0.3 + k); heart(c, Math.cos(a) * d, Math.sin(a) * d * .7 - k * 20, 6 + (i % 2) * 4, i % 2 ? '#fff' : '#ff6fb0'); } c.restore(); return; }
    if (b.kind === 'snap') { // claquement de doigts : rayons de lumière qui tombent du ciel, halo blanc et étoiles qui s'éloignent
      const w = CB.VIEW.w, h = CB.VIEW.h, L = Math.hypot(w, h) * 1.3; c.restore(); c.save(); c.translate(w / 2, -h * .15); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const a = Math.PI * .15 + (i / 17) * Math.PI * .7 + Math.sin(b.age * 1.5 + i) * .03, wd = .04 + (i % 3) * .02; c.globalAlpha = (1 - k) * (.2 + (i % 2) * .15); c.fillStyle = i % 2 ? '#fff3b0' : '#ffffff'; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a - wd) * L, Math.sin(a - wd) * L); c.lineTo(Math.cos(a + wd) * L, Math.sin(a + wd) * L); c.closePath(); c.fill(); }
      const g = c.createRadialGradient(0, 0, 0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,' + ((1 - k) * .9).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(0, 0, h, 0, TAU); c.fill();
      c.globalAlpha = 1 - k; for (let i = 0; i < 30; i++) { const a = i * 2.4 + b.age, d = (.3 + k) * h * (.4 + (i % 5) * .15); star(c, Math.cos(a) * d, Math.sin(a) * d * .8 + h * .25, 5 + (i % 3) * 4, i % 2 ? '#fff' : '#ffe76c', 4); }
      c.restore(); return; }
    if (b.kind === 'nova') { const R0 = Math.max(CB.VIEW.w, CB.VIEW.h) * 1.2 * k; c.globalAlpha = (1 - k) * .9; for (const [lw, col] of [[40, 'rgba(255,210,63,.35)'], [16, '#ffd23f'], [5, '#fff']]) { c.strokeStyle = col; c.lineWidth = lw * (1 - k) + 2; c.beginPath(); c.arc(0, 0, R0, 0, TAU); c.stroke(); } c.globalAlpha = (1 - k) * .5; for (let i = 0; i < 24; i++) { const a = i * TAU / 24 + k * 2; star(c, Math.cos(a) * R0 * .92, Math.sin(a) * R0 * .92, 14 * (1 - k) + 2, i % 2 ? '#fff' : '#ffd23f', 4); } c.restore(); return; }
    if (b.kind === 'kaboom') { // boule de feu + ondes de choc + débris
      const R0 = p.scale * b.size, ease = 1 - Math.pow(1 - k, 3), rr = R0 * (.25 + ease * 1.25);
      c.globalAlpha = Math.min(1, (1 - k) * 1.6); const fb = c.createRadialGradient(0, 0, 0, 0, 0, rr); fb.addColorStop(0, '#fff'); fb.addColorStop(.25, '#ffe36b'); fb.addColorStop(.55, '#ff6a1a'); fb.addColorStop(.85, 'rgba(120,20,0,.6)'); fb.addColorStop(1, 'rgba(60,10,0,0)'); c.fillStyle = fb; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill();
      for (let i = 0; i < 3; i++) { const kk = Math.max(0, k - i * .12); c.globalAlpha = Math.max(0, (1 - kk) * .9); c.strokeStyle = i ? '#ffd23f' : '#fff'; c.lineWidth = Math.max(2, R0 * .12 * (1 - kk)); c.beginPath(); c.ellipse(0, 0, R0 * 2.6 * kk, R0 * 1.4 * kk, 0, 0, TAU); c.stroke(); }
      c.globalAlpha = Math.max(0, 1 - k); for (let i = 0; i < 26; i++) { const a = hash(i) * TAU, sp = .6 + hash(i + 7) * 1.4, d = R0 * 2.2 * sp * ease, g = R0 * 1.6 * k * k; circle(c, Math.cos(a) * d, Math.sin(a) * d * .7 + g, Math.max(1.5, R0 * .09 * (1 - k)), i % 3 ? '#ff8c2a' : '#444'); }
      c.restore(); return;
    }
    if (b.kind === 'holy') { const q = P(b.to); c.translate(-p.x, -p.y); c.lineCap = 'round'; c.shadowColor = '#ffd23f'; c.shadowBlur = 16; for (const [lw, col] of [[9, 'rgba(255,210,63,.5)'], [4, '#fff3a0'], [1.5, '#fff']]) { c.globalAlpha = 1 - k; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); } c.shadowBlur = 0; c.globalAlpha = 1 - k; const rr = 10 + 26 * k; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(q.x, q.y, rr, 0, TAU); c.stroke(); star(c, q.x, q.y, 8 + 10 * k, '#fff3a0', 4); }
    else if (b.kind === 'rainbow') { const q = P(b.to); c.translate(-p.x, -p.y); c.lineCap = 'round'; ['#ff4f6b', '#ff8c2a', '#ffd23f', '#9cff6b', '#4fc3ff', '#c54fff'].forEach((col, i) => { c.globalAlpha = (1 - k) * .9; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y + (i - 2.5) * 3); c.lineTo(q.x, q.y + (i - 2.5) * 2); c.stroke(); }); c.globalAlpha = 1 - k; for (let i = 0; i < 6; i++) star(c, q.x + Math.cos(i + b.age * 20) * 16 * k, q.y + Math.sin(i * 2 + b.age * 20) * 16 * k, 5, i % 2 ? '#fff' : '#ff9ad5'); }
    else if (b.kind === 'bolt') { const q = P(b.to); c.translate(-p.x, -p.y); R.lightning(c, p.x, p.y, q.x, q.y, b.color || '#7fd4ff', (b.width || 3) * (1 - k), 1 - k, Math.floor(b.age * 40) + (b.seed || 0)); }
    else if (b.kind === 'fire' || b.kind === 'ice') { c.globalAlpha = 1 - k; c.strokeStyle = b.kind === 'fire' ? '#ff8c2a' : '#a9e9ff'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, p.scale * b.size * k, 0, TAU); c.stroke(); c.globalAlpha = (1 - k) * .4; circle(c, 0, 0, p.scale * b.size * k, b.kind === 'fire' ? '#ffd23f' : '#d6f4ff'); }
    else if (b.kind === 'hit' || b.kind === 'crit') { c.globalAlpha = 1 - k; const n = b.kind === 'crit' ? 8 : 5, col = b.kind === 'crit' ? '#ffd23f' : '#fff'; for (let i = 0; i < n; i++) { const a = i * TAU / n, d = p.scale * (b.kind === 'crit' ? 3 : 1.8) * k; circle(c, Math.cos(a) * d, Math.sin(a) * d, p.scale * .3 * (1 - k) + 1, col); } }
    else { c.globalAlpha = 1 - k; const n = b.kind === 'boom' ? 18 : 9, R0 = p.scale * (b.kind === 'boom' ? 9 : 3.4) * (b.size || 1); for (let i = 0; i < n; i++) { const a = i * TAU / n + hash(i) * .5, d = R0 * (.3 + .7 * k); const col = i % 3 === 0 ? '#ffd23f' : i % 3 === 1 ? '#fff' : b.color || '#fff'; circle(c, Math.cos(a) * d, Math.sin(a) * d, Math.max(1.5, p.scale * .5 * (1 - k)), col); } if (b.kind === 'boom') { c.globalAlpha = (1 - k) * .6; circle(c, 0, 0, R0 * k, '#ffd23f'); } }
    c.restore();
  };
  R.text = (c, tx) => { if (tx.age < 0) return; const p = P({ x: tx.x, y: tx.y + tx.age * 4, z: tx.z }); c.save(); if (tx.big) { const pop = 1 + Math.max(0, .25 - tx.age) * 6; c.translate(p.x, p.y); c.scale(pop, pop); c.translate(-p.x, -p.y); } c.globalAlpha = Math.max(0, 1 - tx.age); c.font = 'bold ' + Math.max(12, p.scale * 1.4) * (tx.big ? 2.6 : 1) + 'px "Arial Rounded MT Bold", "Arial Black", Arial'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(tx.text, p.x, p.y); c.fillStyle = tx.color || '#fff'; c.fillText(tx.text, p.x, p.y); c.restore(); };
  // Focus du Zoom-zoom (inspiré de Snow Kids) : vignette bleue, traînées de vitesse sur les côtés, anneaux qui se resserrent sur le viseur.
  R.zoomFocus = (c, wave, zf, t, w, h) => {
    const k = zf.k, a = wave.aim; c.save();
    const g = c.createRadialGradient(w / 2, h * .55, w * .18, w / 2, h * .55, w * .75); g.addColorStop(0, 'rgba(8,30,65,0)'); g.addColorStop(1, 'rgba(8,30,65,' + (.55 * k) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.beginPath(); c.rect(0, 0, w * .24, h); c.rect(w * .76, 0, w * .24, h); c.clip(); c.lineCap = 'round';
    for (const side of [-1, 1]) for (let i = 0; i < 22; i++) { const phase = (t * (1.7 + (i % 3) * .3) + i * .618) % 1, dx = side * w * (.29 + phase * .32), dy = ((i / 21) - .5) * h * 1.7, sx = w / 2 + dx, sy = h * .52 + dy * (.45 + phase * .55); c.globalAlpha = k * Math.sin(phase * Math.PI) * .85; c.strokeStyle = i % 3 ? '#fff' : '#9beaff'; c.lineWidth = Math.max(1.5, w * .002) * (1 + phase); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + dx * .25, sy + dy * .2); c.stroke(); }
    c.restore(); c.save(); c.translate(a.x, a.y); c.strokeStyle = '#9beaff'; c.shadowColor = '#9beaff'; c.shadowBlur = 12;
    for (let i = 0; i < 3; i++) { const ph = 1 - ((t * .9 + i / 3) % 1); c.globalAlpha = k * (1 - ph) * .9; c.lineWidth = 2 + 2 * (1 - ph); c.beginPath(); c.arc(0, 0, 34 + ph * 90 + zf.punch * 120, 0, TAU); c.stroke(); }
    c.globalAlpha = k * .9; c.fillStyle = '#9beaff'; c.font = 'bold 12px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.fillText('RALENTI ×2,5', 0, 52); c.restore();
  };
  // La sphère protectrice : bulle violette autour du canon, anneau de runes qui tourne, éclat quand elle brûle un monstre.
  R.sphere = (c, wave, t) => {
    const V = CB.VIEW, sp = wave.sphere, x = V.cx, y = V.ground - V.size * .9, r = V.size * 1.45 * (1 + sp.hit * .08); c.save();
    const g = c.createRadialGradient(x, y, r * .2, x, y, r); g.addColorStop(0, 'rgba(196,125,255,.05)'); g.addColorStop(.8, 'rgba(120,60,220,' + (.18 + sp.hit * .25) + ')'); g.addColorStop(1, 'rgba(120,60,220,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = sp.hit > .3 ? '#fff' : '#c47dff'; c.lineWidth = 2 + sp.hit * 3; c.shadowColor = '#c47dff'; c.shadowBlur = 14; c.globalAlpha = .7; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.globalAlpha = .85; c.fillStyle = '#e5bfff'; c.font = 'bold 12px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < 12; i++) { const a = t * .8 + i * TAU / 12; c.fillText(['✦', '✧', '◆', '●'][i % 4], x + Math.cos(a) * r * .98, y + Math.sin(a) * r * .72); }
    c.restore();
  };
  // Une tour de défense : tour de pierre crénelée avec un petit canon qui suit le viseur de la tour.
  R.tower = (c, x, y, s, tw, t) => {
    c.save(); c.translate(x, y); ellipse(c, 0, 4, s * .95, s * .22, 'rgba(4,19,33,.5)');
    c.fillStyle = '#6b7388'; c.strokeStyle = '#2a3140'; c.lineWidth = 2; c.beginPath(); c.roundRect(-s * .55, -s * 1.5, s * 1.1, s * 1.5, 6); c.fill(); c.stroke();
    c.fillStyle = '#8a93a8'; for (let i = -1; i <= 1; i++) c.fillRect(i * s * .36 - s * .14, -s * 1.78, s * .28, s * .3);
    c.fillStyle = '#4a5468'; for (let k = 0; k < 4; k++) c.fillRect(-s * .5 + (k % 2) * s * .5, -s * 1.3 + k * s * .3, s * .5, s * .06);
    c.fillStyle = '#2a3140'; c.beginPath(); c.roundRect(-s * .18, -s * .8, s * .36, s * .5, 4); c.fill();
    const ang = Math.atan2(tw.aim.y - (y - s * 1.6), tw.aim.x - x), rec = tw.recoil * s * .2; c.save(); c.translate(0, -s * 1.6); c.rotate(ang); c.fillStyle = '#1b2436'; c.beginPath(); c.roundRect(-rec, -s * .14, s * .7, s * .28, 4); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(s * .5 - rec, -s * .17, s * .1, s * .34); c.restore();
    circle(c, 0, -s * 1.6, s * .2, '#4a5468'); c.restore();
  };
  // Étourdi (choc électrique ou gelé) : arcs ou bloc de glace sur le héros, barre « tape vite » qui se remplit.
  R.stunFx = (c, wave, t) => {
    const V = CB.VIEW, st = wave.stun, x = V.cx, y = V.ground - V.size * .9, r = V.size * 1.1, k = st.taps / st.need; c.save();
    if (st.kind === 'shock') { c.strokeStyle = '#ffe76c'; c.shadowColor = '#ffe76c'; c.shadowBlur = 16; c.lineWidth = 3; for (let i = 0; i < 7; i++) { const seed = Math.floor(t * 20) + i * 3; let a = (seed * 1.3) % TAU, rr = r * .3; c.beginPath(); c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); for (let j = 0; j < 4; j++) { a += (((seed + j) * .37) % 1 - .5) * .9; rr += r * .25; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.stroke(); } c.globalAlpha = .18 + .12 * Math.abs(Math.sin(t * 40)); circle(c, x, y, r, '#ffe76c'); }
    else { c.globalAlpha = .75; c.fillStyle = '#bfe9ff'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - r, y + r * .9); c.lineTo(x - r * .9, y - r * .8); c.lineTo(x - r * .3, y - r * 1.1); c.lineTo(x + r * .6, y - r); c.lineTo(x + r, y - r * .2); c.lineTo(x + r * .9, y + r * .9); c.closePath(); c.fill(); c.stroke(); c.globalAlpha = .9; c.strokeStyle = '#fff'; c.lineWidth = 2; for (let i = 0; i < Math.ceil(k * 6); i++) { c.beginPath(); c.moveTo(x + (hash(i) - .5) * r * 1.6, y + (hash(i + 9) - .5) * r * 1.6); c.lineTo(x + (hash(i + 3) - .5) * r * 1.8, y + (hash(i + 12) - .5) * r * 1.8); c.stroke(); } }
    c.globalAlpha = 1; const bw = 220, bx = x - bw / 2, by = y - r - 46; c.fillStyle = 'rgba(8,20,45,.8)'; c.beginPath(); c.roundRect(bx - 6, by - 6, bw + 12, 30, 8); c.fill(); c.fillStyle = '#2a3140'; c.fillRect(bx, by, bw, 18); c.fillStyle = st.kind === 'shock' ? '#ffe76c' : '#a9e9ff'; c.fillRect(bx, by, bw * k, 18); c.fillStyle = '#fff'; c.font = 'bold 13px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAPE VITE ! ' + st.taps + ' / ' + st.need, x, by + 9);
    c.restore();
  };
  R.reticle = (c, aim, locked, t) => { c.save(); c.translate(aim.x, aim.y); c.strokeStyle = locked ? '#ffd23f' : 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 4; c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.stroke(); c.lineWidth = 2; for (const [a, b] of [[-40, -30], [30, 40]]) { c.beginPath(); c.moveTo(a, 0); c.lineTo(b, 0); c.stroke(); c.beginPath(); c.moveTo(0, a); c.lineTo(0, b); c.stroke(); } if (locked) { c.rotate(t * 2); c.strokeStyle = '#ffd23f'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(0, 0, 34, i * Math.PI / 2, i * Math.PI / 2 + .6); c.stroke(); } } c.restore(); };


  // ---------- Pictogrammes des cartes (un dessin et une couleur par pouvoir, lisibles d'un coup d'œil) ----------
  const CARD_BG = { double: '#3b8ad6', rapide: '#f5b800', rafale: '#ff8c2a', costaud: '#e8403c', bouclier: '#2fa84f', vampire: '#8b1e3f', tresor: '#c9a227', geant: '#b14fff', rebond: '#38c7e6', glace: '#5fb6ff', soin: '#ff5a5a', explosif: '#3a4152', chance: '#45b84a', aimant: '#d8323a', portee: '#5b6b80', renfort: '#2f6fd6', bombe: '#2a2f3a', jauge: '#c9a227', horloge: '#5fb6ff' };
  const arrow = (c, x1, y1, x2, y2, w, col) => { const a = Math.atan2(y2 - y1, x2 - x1); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * w * 1.5, y2 - Math.sin(a) * w * 1.5); c.stroke(); c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - Math.cos(a - .5) * w * 3, y2 - Math.sin(a - .5) * w * 3); c.lineTo(x2 - Math.cos(a + .5) * w * 3, y2 - Math.sin(a + .5) * w * 3); c.closePath(); c.fill(); };
  const marble = (c, x, y, r, col = '#c9d3e0') => { const g = c.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); g.addColorStop(0, '#fff'); g.addColorStop(.4, col); g.addColorStop(1, shade(col, .45)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const CARD = {
    double(c, r) { marble(c, -r * .32, 0, r * .3); marble(c, r * .32, 0, r * .3); for (const y of [-r * .45, 0, r * .45]) { c.strokeStyle = '#fff'; c.lineWidth = r * .07; c.beginPath(); c.moveTo(-r * .85, y + r * .4); c.lineTo(-r * .62, y + r * .4); c.stroke(); } },
    rapide(c, r) { poly(c, [[r * .15, -r * .8], [-r * .45, r * .1], [-r * .02, r * .1], [-r * .2, r * .8], [r * .5, -r * .15], [r * .05, -r * .15]], '#fff'); },
    rafale(c, r) { for (let i = 0; i < 3; i++) marble(c, -r * .5 + i * r * .5, r * .25, r * .2); c.strokeStyle = '#fff'; c.lineWidth = r * .1; c.lineCap = 'round'; c.beginPath(); c.arc(0, -r * .25, r * .45, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); arrow(c, r * .3, -r * .55, r * .42, -r * .35, r * .09, '#fff'); },
    costaud(c, r) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-r * .55, -r * .09, r * 1.1, r * .18, r * .05); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.roundRect(s * r * .55 - r * .16, -r * .42, r * .32, r * .84, r * .08); c.fill(); c.beginPath(); c.roundRect(s * r * .82 - r * .1, -r * .28, r * .2, r * .56, r * .06); c.fill(); } },
    bouclier(c, r) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -r * .8); c.lineTo(r * .65, -r * .55); c.quadraticCurveTo(r * .65, r * .4, 0, r * .8); c.quadraticCurveTo(-r * .65, r * .4, -r * .65, -r * .55); c.closePath(); c.fill(); c.strokeStyle = CARD_BG.bouclier; c.lineWidth = r * .14; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * .3, 0); c.lineTo(-r * .08, r * .25); c.lineTo(r * .32, -r * .25); c.stroke(); },
    vampire(c, r) { c.fillStyle = '#ff5a6b'; c.beginPath(); c.moveTo(0, r * .75); c.bezierCurveTo(-r * 1.1, r * .05, -r * .5, -r * .8, 0, -r * .3); c.bezierCurveTo(r * .5, -r * .8, r * 1.1, r * .05, 0, r * .75); c.fill(); for (const s of [-1, 1]) poly(c, [[s * r * .3, -r * .1], [s * r * .12, -r * .1], [s * r * .21, r * .35]], '#fff'); },
    tresor(c, r) { c.fillStyle = '#7a4a1a'; c.beginPath(); c.roundRect(-r * .7, -r * .15, r * 1.4, r * .75, r * .1); c.fill(); c.fillStyle = '#a0652a'; c.beginPath(); c.roundRect(-r * .7, -r * .5, r * 1.4, r * .42, r * .18); c.fill(); for (let i = -1; i <= 1; i++) circle(c, i * r * .36, -r * .55, r * .18, '#ffd23f'); for (let i = -1; i <= 1; i++) circle(c, i * r * .36, -r * .55, r * .09, '#f5b800'); circle(c, 0, -r * .05, r * .09, '#3a2008'); },
    geant(c, r) { marble(c, -r * .62, r * .1, r * .14, '#e0d8ff'); arrow(c, -r * .4, r * .1, -r * .05, r * .1, r * .07, '#fff'); marble(c, r * .42, 0, r * .48, '#e0d8ff'); },
    rebond(c, r) { c.fillStyle = '#fff'; c.fillRect(r * .55, -r * .7, r * .14, r * 1.4); c.strokeStyle = '#fff'; c.lineWidth = r * .09; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * .75, -r * .55); c.lineTo(r * .5, 0); c.stroke(); arrow(c, r * .5, 0, -r * .45, r * .62, r * .09, '#fff'); marble(c, -r * .75, -r * .55, r * .17); },
    glace(c, r) { c.strokeStyle = '#fff'; c.lineWidth = r * .09; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; c.beginPath(); c.moveTo(Math.cos(a) * r * .75, Math.sin(a) * r * .75); c.lineTo(-Math.cos(a) * r * .75, -Math.sin(a) * r * .75); c.stroke(); for (const d of [1, -1]) for (const k of [.45, .75]) { const bx = Math.cos(a) * r * k * d, by = Math.sin(a) * r * k * d; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - Math.cos(a - 1) * r * .2 * d, by - Math.sin(a - 1) * r * .2 * d); c.moveTo(bx, by); c.lineTo(bx - Math.cos(a + 1) * r * .2 * d, by - Math.sin(a + 1) * r * .2 * d); c.stroke(); } } },
    soin(c, r) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-r * .7, -r * .5, r * 1.4, r, r * .15); c.fill(); c.fillStyle = CARD_BG.soin; c.beginPath(); c.roundRect(-r * .25, -r * .72, r * .5, r * .22, r * .05); c.fill(); c.fillStyle = '#ff2d2d'; c.fillRect(-r * .12, -r * .36, r * .24, r * .72); c.fillRect(-r * .36, -r * .12, r * .72, r * .24); },
    explosif(c, r) { circle(c, -r * .05, r * .15, r * .55, '#1b1e28'); circle(c, -r * .22, -r * .02, r * .14, 'rgba(255,255,255,.25)'); c.fillStyle = '#8a8f99'; c.beginPath(); c.roundRect(r * .15, -r * .55, r * .28, r * .22, r * .05); c.fill(); c.strokeStyle = '#d9b36a'; c.lineWidth = r * .07; c.beginPath(); c.moveTo(r * .3, -r * .55); c.quadraticCurveTo(r * .45, -r * .85, r * .62, -r * .72); c.stroke(); star(c, r * .66, -r * .74, r * .18, '#ffd23f'); star(c, r * .66, -r * .74, r * .09, '#fff'); },
    chance(c, r) { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const x = Math.cos(a) * r * .32, y = Math.sin(a) * r * .32; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, r * .3, r * .24, a, 0, TAU); c.fill(); } circle(c, 0, 0, r * .1, CARD_BG.chance); c.strokeStyle = '#fff'; c.lineWidth = r * .07; c.beginPath(); c.moveTo(r * .1, r * .3); c.quadraticCurveTo(r * .25, r * .6, r * .2, r * .8); c.stroke(); },
    aimant(c, r) { c.strokeStyle = '#fff'; c.lineWidth = r * .3; c.lineCap = 'butt'; c.beginPath(); c.arc(0, -r * .1, r * .45, Math.PI, 0); c.stroke(); c.beginPath(); c.moveTo(-r * .45, -r * .1); c.lineTo(-r * .45, r * .35); c.moveTo(r * .45, -r * .1); c.lineTo(r * .45, r * .35); c.stroke(); c.fillStyle = '#9fdcff'; c.fillRect(-r * .6, r * .35, r * .3, r * .3); c.fillRect(r * .3, r * .35, r * .3, r * .3); circle(c, 0, r * .6, r * .12, '#ffd23f'); },
    portee(c, r) { marble(c, -r * .62, r * .15, r * .18); c.setLineDash([r * .1, r * .1]); c.strokeStyle = '#fff'; c.lineWidth = r * .07; c.beginPath(); c.moveTo(-r * .45, r * .05); c.quadraticCurveTo(0, -r * .75, r * .55, -r * .15); c.stroke(); c.setLineDash([]); for (let i = 0; i < 3; i++) { c.strokeStyle = i % 2 ? '#fff' : '#ff5a5a'; c.lineWidth = r * .09; c.beginPath(); c.arc(r * .55, -r * .15, r * (.38 - i * .12), 0, TAU); c.stroke(); } circle(c, r * .55, -r * .15, r * .07, '#fff'); },
    renfort(c, r) { for (const [x, col] of [[-r * .38, '#ffd8a8'], [r * .38, '#f3c9a0']]) { circle(c, x, -r * .3, r * .32, col); circle(c, x, -r * .5, r * .34, x < 0 ? '#5a3a1e' : '#2a1a0e'); c.fillStyle = col; c.beginPath(); c.arc(x, -r * .3, r * .32, 0, Math.PI); c.fill(); circle(c, x, r * .45, r * .4, x < 0 ? '#3b8ad6' : '#e8403c'); } c.strokeStyle = '#fff'; c.lineWidth = r * .14; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * .3, r * .35); c.lineTo(r * .3, r * .35); c.stroke(); star(c, 0, -r * .75, r * .2, '#ffd23f'); },
    bombe(c, r) { circle(c, 0, r * .15, r * .62, '#1b1b1b'); circle(c, -r * .2, -r * .05, r * .18, 'rgba(255,255,255,.35)'); c.fillStyle = '#6b7280'; c.fillRect(-r * .14, -r * .62, r * .28, r * .2); c.strokeStyle = '#ffd23f'; c.lineWidth = r * .08; c.beginPath(); c.moveTo(0, -r * .62); c.quadraticCurveTo(r * .25, -r * .95, r * .5, -r * .8); c.stroke(); star(c, r * .55, -r * .82, r * .22, '#ff8c2a', 8); star(c, r * .55, -r * .82, r * .1, '#fff', 8); },
    jauge(c, r) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-r * .3, -r * .8, r * .6, r * 1.55, r * .1); c.fill(); c.fillRect(-r * .12, -r * .9, r * .24, r * .14); c.fillStyle = '#45b84a'; for (let i = 0; i < 4; i++) c.fillRect(-r * .22, r * .55 - i * r * .35, r * .44, r * .26); c.fillStyle = '#ffd23f'; poly(c, [[r * .1, -r * .55], [-r * .25, r * .05], [r * .02, r * .05], [-r * .1, r * .55], [r * .3, -r * .1], [r * .04, -r * .1]]); },
    horloge(c, r) { circle(c, 0, 0, r * .8, '#fff'); circle(c, 0, 0, r * .68, '#eaf4ff'); c.strokeStyle = '#1b2436'; c.lineWidth = r * .1; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * .45); c.moveTo(0, 0); c.lineTo(r * .32, r * .15); c.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; circle(c, Math.cos(a) * r * .58, Math.sin(a) * r * .58, r * (i % 3 ? .03 : .06), '#1b2436'); } c.fillStyle = '#ff5a5a'; c.fillRect(-r * .12, -r * .95, r * .24, r * .12); }
  };
  // Dessine le pictogramme de la carte « key » centré en (x, y), dans une tuile arrondie de rayon r.
  R.cardIcon = (c, key, x, y, r) => {
    const def = CB.CARDS[key];
    if (def && def.combo) { // combo secret : tuile dorée avec les deux ingrédients et une étoile
      c.save(); c.translate(x, y); c.fillStyle = '#ffd23f'; c.beginPath(); c.roundRect(-r, -r, r * 2, r * 2, r * .3); c.fill(); c.fillStyle = '#1b1030'; c.beginPath(); c.roundRect(-r * .9, -r * .9, r * 1.8, r * 1.8, r * .24); c.fill();
      R.cardIcon(c, def.needs[0], -r * .45, -r * .2, r * .36); R.cardIcon(c, def.needs[1], r * .45, -r * .2, r * .36); c.fillStyle = '#fff'; c.font = 'bold ' + r * .5 + 'px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('+', 0, -r * .2); star(c, 0, r * .55, r * .26, '#ffd23f'); c.restore(); return;
    }
    c.save(); c.translate(x, y); c.fillStyle = CARD_BG[key] || '#3b8ad6'; c.beginPath(); c.roundRect(-r, -r, r * 2, r * 2, r * .3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.roundRect(-r, -r, r * 2, r * .5, [r * .3, r * .3, 0, 0]); c.fill();
    (CARD[key] || CARD.double)(c, r * .78); c.restore();
  };

  // ---------- Plein écran ----------
  // Carte : le canvas prend toute la fenêtre, la scène logique 960×640 reste entière et centrée (bandes remplies par le ciel).
  R.fitCanvas = canvas => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, r.width), h = Math.max(1, r.height);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr); if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    const s = Math.min(w / 960, h / 640), view = { dpr, s, lw: w / s, lh: h / s, ox: (w / s - 960) / 2, oy: (h / s - 640) / 2 };
    canvas.view = view; return view;
  };
  R.begin = (c, view) => { c.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, 0, 0); c.clearRect(0, 0, view.lw, view.lh); };
  R.toLogical = (canvas, clientX, clientY) => { const r = canvas.getBoundingClientRect(), v = canvas.view || R.fitCanvas(canvas); return { x: (clientX - r.left) / v.s - v.ox, y: (clientY - r.top) / v.s - v.oy }; };
  // Vague : la scène occupe toute la fenêtre en pixels CSS, et la projection 3D (CB.VIEW) suit la taille de l'écran.
  R.fitWave = canvas => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr); if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    CB.setView(w, h); canvas.view = { dpr, s: 1, lw: w, lh: h, ox: 0, oy: 0, w, h }; return canvas.view;
  };

  // ---------- Héros sur son chariot-canon ----------
  // side = 0 : vu de dos (le joueur, au centre). side = ±1 : vu de profil (coéquipier à gauche, miroir à droite).
  // Bonus famille : halo pulsant de la couleur de la famille sous chaque canon, étincelles qui montent et petit écusson au-dessus
  R.familyAura = (c, x, y, s, col, t) => {
    const k = .85 + .15 * Math.sin(t * 5); c.save(); const g = c.createRadialGradient(x, y - s * .5, s * .2, x, y - s * .5, s * 1.3 * k); g.addColorStop(0, col + 'aa'); g.addColorStop(.6, col + '55'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - s * .5, s * 1.3 * k, s * 1.05 * k, 0, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = Math.max(2, s * .04); c.globalAlpha = .5 + .3 * Math.sin(t * 5); c.beginPath(); c.ellipse(x, y + s * .15, s * 1.05, s * .32, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
    for (let i = 0; i < 8; i++) { const ph = (t * .5 + i * .137) % 1, a = i * .8 + Math.floor(t * .5 + i * .137) * 2.1; star(c, x + Math.cos(a) * s * (.6 + .5 * ph), y - s * .2 - ph * s * 1.9, Math.max(2, s * .05) * (1 - ph) + 1, i % 2 ? '#fff' : col); }
    const cx = x, cy = y - s * 2.05 + Math.sin(t * 3) * s * .04, w = s * .22, h = s * .26; c.beginPath(); c.moveTo(cx - w / 2, cy - h / 2); c.lineTo(cx + w / 2, cy - h / 2); c.lineTo(cx + w / 2, cy + h * .1); c.quadraticCurveTo(cx + w / 2, cy + h * .4, cx, cy + h / 2); c.quadraticCurveTo(cx - w / 2, cy + h * .4, cx - w / 2, cy + h * .1); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = Math.max(1.5, s * .025); c.stroke();
    c.restore();
  };
  // Mèche allumée : petit cordon et étincelle (unités du canon)
  const fuse = (c, x0, y0, x1, y1) => { c.strokeStyle = '#c9a66b'; c.lineWidth = .045; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + .08, y0 - .12, x1, y1); c.stroke(); star(c, x1, y1, .11, '#ff8c2a', 6); star(c, x1, y1, .06, '#ffe36a', 6); };
  // Canons à l'allure dessinée (d'après les visuels de Matthieu). side : vue de profil du hangar (proue à droite) ; rearBase / rearBarrel / rearExtras : vue de dos en partie.
  const LOOKS = {
    pirate: {
      side(c, recoil) {
        // affût de bois à gradins, ferrures, roues de bois, fonte noire à trois bandes, bouton de culasse, mèche
        poly(c, [[-.78, -.05], [-.78, -.42], [-.3, -.42], [-.3, -.72], [.52, -.72], [.98, -.4], [.98, -.05]], '#5a3a1e'); c.strokeStyle = '#2b1a0c'; c.lineWidth = .035; c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .02; for (const yy of [-.3, -.18]) { c.beginPath(); c.moveTo(-.7, yy); c.lineTo(.9, yy); c.stroke(); }
        box(c, .38, -.75, .09, .7, .02, '#3a3f4a'); box(c, -.12, -.45, .09, .4, .02, '#3a3f4a'); for (const [bx, by] of [[.425, -.6], [.425, -.2], [-.075, -.3]]) circle(c, bx, by, .025, '#9aa3b2');
        c.save(); c.translate(.95, -1.08); c.rotate(-.32); const r = recoil * .08;
        circle(c, -1.3 + r, 0, .12, '#151515'); circle(c, -1.46 + r, 0, .07, '#151515');
        poly(c, [[-1.2 + r, -.22], [.3, -.16], [.3, .16], [-1.2 + r, .22]], '#1a1a1a'); poly(c, [[-1.2 + r, -.2], [.3, -.14], [.3, -.08], [-1.2 + r, -.12]], '#3b4150');
        for (const bx of [-.88, -.48, -.08]) box(c, bx, -.24, .08, .48, .02, '#4d5868');
        box(c, .28, -.21, .16, .42, .04, '#0f0f0f'); ellipse(c, .42, 0, .045, .17, '#000');
        fuse(c, -1.02 + r, -.2, -1.18 + r, -.52); c.restore();
        ellipse(c, .3, -.74, .11, .1, '#4d5868'); circle(c, .3, -.75, .05, '#1a1a1a');
        for (const wx of [-.42, .74]) { circle(c, wx, -.08, .3, '#2b1a0c'); circle(c, wx, -.08, .25, '#b98a52'); c.strokeStyle = '#8a6238'; c.lineWidth = .03; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(wx + Math.cos(i * .785) * .22, -.08 + Math.sin(i * .785) * .22); c.lineTo(wx - Math.cos(i * .785) * .22, -.08 - Math.sin(i * .785) * .22); c.stroke(); } circle(c, wx, -.08, .08, '#1a1a1a'); circle(c, wx, -.08, .04, '#4d5868'); }
      },
      rearBase(c) { box(c, -.64, -.22, 1.28, .34, .06, '#5a3a1e'); box(c, -.64, -.22, 1.28, .08, .03, '#7a5230'); box(c, -.06, -.25, .12, .4, .02, '#3a3f4a'); for (const wx of [-.72, .72]) { box(c, wx - .11, -.32, .22, .52, .07, '#2b1a0c'); box(c, wx - .07, -.28, .14, .44, .05, '#b98a52'); box(c, wx - .03, -.1, .06, .08, .02, '#1a1a1a'); } },
      rearBarrel(c, recoil) {
        const r = recoil * .08; poly(c, [[-.36, .9 + r], [-.25, 0], [.25, 0], [.36, .9 + r]], '#1a1a1a'); poly(c, [[-.3, .9 + r], [-.21, 0], [-.14, 0], [-.2, .9 + r]], '#3b4150');
        for (const by of [.3, .6]) { const w = .25 + .11 * by / .9; box(c, -w - .02, by - .04, 2 * w + .04, .08, .02, '#4d5868'); }
        box(c, -.28, -.06, .56, .13, .04, '#0f0f0f'); ellipse(c, 0, -.02, .23, .07, '#000');
      },
      rearExtras(c) { fuse(c, -.3, -.88, -.5, -1.05); },
    },
    confetti: {
      side(c, recoil) {
        // affût rouge et jaune, canon bleu à bandes jaunes, pois et étoiles, bouche rayée façon cirque, roues rouges, manivelle
        poly(c, [[-.78, -.05], [-.78, -.5], [-.25, -.5], [-.25, -.72], [.55, -.72], [.98, -.42], [.98, -.05]], '#e8403c'); box(c, -.25, -.76, .8, .1, .04, '#ffd23f'); box(c, -.78, -.54, .53, .08, .03, '#ffd23f');
        circle(c, -.84, -.62, .09, '#e8403c'); circle(c, -.84, -.62, .04, '#ffd23f'); box(c, -.86, -.95, .05, .35, .02, '#ffd23f'); circle(c, -.84, -.97, .09, '#e8403c');
        c.save(); c.translate(.95, -1.08); c.rotate(-.32); const r = recoil * .08;
        box(c, -1.2 + r, -.24, 1.4, .48, .12, '#3a7bd5'); box(c, -1.2 + r, -.24, 1.4, .1, .05, '#6aa8ff');
        for (const bx of [-.95, -.4]) box(c, bx + r, -.27, .12, .54, .03, '#ffd23f');
        for (const [dx, dy, col] of [[-.75, .05, '#ff4f9a'], [-.6, -.1, '#7dff9a'], [-.2, .08, '#fff'], [-.05, -.1, '#ffe36a'], [-.3, -.02, '#ff8c2a']]) circle(c, dx + r, dy, .035, col); star(c, -.68 + r, .12, .06, '#ffe36a'); star(c, -.12 + r, -.05, .05, '#fff');
        box(c, .1, -.32, .22, .64, .06, '#e8403c'); box(c, .16, -.26, .1, .52, .04, '#ffd23f'); box(c, .22, -.2, .06, .4, .02, '#3fae5a'); ellipse(c, .32, 0, .06, .26, '#222'); c.restore();
        for (const wx of [-.42, .74]) { circle(c, wx, -.08, .3, '#b12c28'); circle(c, wx, -.08, .26, '#e8403c'); circle(c, wx, -.08, .17, '#ffd23f'); circle(c, wx, -.08, .07, '#3a7bd5'); }
      },
      rearBase(c) { box(c, -.64, -.22, 1.28, .34, .08, '#e8403c'); box(c, -.52, -.27, 1.04, .1, .04, '#ffd23f'); for (const wx of [-.72, .72]) { box(c, wx - .11, -.32, .22, .52, .08, '#b12c28'); box(c, wx - .07, -.28, .14, .44, .06, '#3a7bd5'); box(c, wx - .04, -.12, .08, .12, .03, '#ffd23f'); } },
      rearBarrel(c, recoil) {
        const r = recoil * .08; poly(c, [[-.42, .9 + r], [-.36, 0], [.36, 0], [.42, .9 + r]], '#3a7bd5'); poly(c, [[-.36, .9 + r], [-.3, 0], [-.2, 0], [-.24, .9 + r]], '#6aa8ff');
        for (const by of [.2, .78]) { const w = .36 + .06 * by / .9; box(c, -w, by - .04, 2 * w, .09, .02, '#ffd23f'); }
        for (const [dx, dy, col] of [[-.18, .4, '#ff4f9a'], [.12, .33, '#fff'], [.22, .55, '#7dff9a'], [-.05, .62, '#ff8c2a']]) circle(c, dx, dy + r * .5, .04, col); star(c, .02, .46 + r * .5, .07, '#ffe36a'); star(c, -.22, .58 + r * .5, .045, '#fff');
        ellipse(c, 0, .02, .44, .12, '#e8403c'); ellipse(c, 0, .02, .35, .095, '#ffd23f'); ellipse(c, 0, .02, .26, .07, '#3fae5a'); ellipse(c, 0, .02, .17, .045, '#3a7bd5'); ellipse(c, 0, .03, .1, .028, '#222');
      },
      rearExtras(c) { box(c, -.84, -1.02, .07, .34, .03, '#ffd23f'); circle(c, -.86, -.7, .09, '#e8403c'); circle(c, -.86, -.7, .04, '#ffd23f'); c.strokeStyle = '#e8403c'; c.lineWidth = .045; c.lineCap = 'round'; c.beginPath(); c.moveTo(.58, -.98); c.bezierCurveTo(.66, -1.12, .78, -.9, .86, -.86); c.stroke(); circle(c, .9, -.82, .11, '#e8403c'); for (let i = 0; i < 6; i++) circle(c, .9 + Math.cos(i * 1.05) * .08, -.82 + Math.sin(i * 1.05) * .08, .025, '#ff8c8c'); },
    },
  };
  R.battleCannon = (c, x, y, s, playerId, skin, side = 0, recoil = 0, rot = 0) => {
    const k = CB.CANNONS[skin] || CB.CANNONS.classique, L = LOOKS[k.look] || null, pl = CB.playerById(playerId), col = pl ? CB.FAMILIES[pl.family].color : '#f5a623';
    const face = (view, fx, fy, fw, fh) => { if (!(window.FamilyHeads && window.FamilyHeads.draw(c, playerId, view, fx, fy, fw, fh))) ellipse(c, fx + fw / 2, fy + fh / 2, fw * .35, fh * .4, '#f1bd92'); };
    c.save(); c.translate(x, y); c.scale(s * (side || 1), s); ellipse(c, 0, .06, side ? 1.12 : .83, .16, '#04132188');
    const metal = c.createLinearGradient(-.4, 0, .4, 0); metal.addColorStop(0, '#12374e'); metal.addColorStop(.35, k.body || '#39b6c8'); metal.addColorStop(.55, k.trim || '#b4edf2'); metal.addColorStop(1, '#246078');
    if (side) {
      if (L) L.side(c, recoil); else { box(c, -.65, -.12, 1.8, .18, .06, '#21394e'); poly(c, [[-.06, -.16], [.3, -.83], [.65, -.83], [.91, -.16]], '#527b92');
      c.save(); c.translate(1.05, -1.2); c.rotate(-.32); box(c, -1.15 + recoil * .08, -.18, 1.2, .36, .08, metal); box(c, -.15, -.22, .18, .44, .04, k.trim || '#b4e8ed'); ellipse(c, .04, 0, .06, .18, '#123145'); c.restore(); }
      box(c, -.67, -.72, .55, .18, .05, '#bd5962'); box(c, -.72, -1.08, .14, .49, .05, '#29475f');
      poly(c, [[-.42, -.74], [.12, -.73], [.27, -.39], [.12, -.26], [-.04, -.52], [-.45, -.53]], '#23476a'); box(c, .09, -.34, .4, .16, .04, '#152c42');
      box(c, -.58, -1.18, .46, .54, .09, col); poly(c, [[-.2, -1.08], [.06, -.85], [.36, -.92], [.4, -.79], [.02, -.67], [-.35, -.95]], col); ellipse(c, .36, -.85, .09, .1, '#edc19b');
      face('side', -.64, -1.96, .8, .83);
      if (!L) for (const wx of [-.4, .78]) { ellipse(c, wx, -.08, .28, .29, '#10253b'); ellipse(c, wx, -.08, .19, .2, '#608ba4'); ellipse(c, wx, -.08, .07, .08, '#b4e5ed'); }
    } else {
      if (L) L.rearBase(c); else { box(c, -.6, -.12, 1.2, .21, .06, '#345970'); for (const wx of [-.66, .66]) { box(c, wx - .12, -.19, .24, .39, .09, '#122a42'); box(c, wx - .07, -.15, .14, .29, .05, '#648da2'); } }
      c.save(); c.translate(0, -1.55); c.rotate(Math.max(-.22, Math.min(.22, rot)));
      const shafts = k.twin ? [-.18, .18] : [0], width = k.twin ? .16 : .29;
      if (L) L.rearBarrel(c, recoil); else for (const off of shafts) { poly(c, [[off - width, .88 + recoil * .08], [off - width * .62, 0], [off + width * .62, 0], [off + width, .88 + recoil * .08]], metal); box(c, off - width * .7, -.035, width * 1.4, .095, .025, k.trim || '#c2edf0'); box(c, off - width, .58, width * 2, .12, .03, k.base || '#e9bc68'); }
      if (k.glow && !L) { box(c, -.43, .19, .13, .57, .03, k.glow); box(c, .3, .19, .13, .57, .03, k.glow); }
      c.restore(); if (L && L.rearExtras) L.rearExtras(c);
      for (const dir of [-1, 1]) { box(c, dir * .42 - .045, -.69, .09, .28, .025, '#193047'); poly(c, [[dir * .28, -.67], [dir * .47, -.58], [dir * .48, -.32], [dir * .3, -.27]], col); ellipse(c, dir * .43, -.62, .08, .08, '#edc19b'); }
      box(c, -.33, -.7, .66, .6, .12, col); box(c, -.33, -.7, .66, .15, .05, '#294e65'); face('back', -.42, -1.35, .84, .86);
      box(c, -.39, -.38, .78, .39, .09, '#233d55'); box(c, -.32, -.32, .64, .24, .06, '#b95b67'); box(c, -.28, -.26, .56, .055, .02, '#e78a8b');
    }
    c.restore();
  };

  // Rayon du Léviathan : pendant la charge, un trait pointillé et un cercle au sol montrent où il va frapper ; puis un faisceau
  R.beam = (c, wave, t) => {
    const B = wave.beam; if (!B) return; const a = P(B.from), b = P({ x: B.x, y: 0, z: 3 }), k = Math.min(1, B.t / B.charge), firing = B.t >= B.charge; c.save();
    if (!firing) { c.globalAlpha = .35 + .35 * k; c.setLineDash([10, 10]); c.lineDashOffset = -t * 60; c.strokeStyle = '#7fe9ff'; c.lineWidth = 3 + k * 5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.setLineDash([]); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.ellipse(b.x, b.y, 60 + k * 20 + Math.sin(t * 20) * 6, 18 + k * 6, 0, 0, TAU); c.stroke(); c.globalAlpha = .25 * k; c.fillStyle = '#7fe9ff'; c.beginPath(); c.ellipse(b.x, b.y, 60 + k * 20, 18 + k * 6, 0, 0, TAU); c.fill(); }
    else { const f = 1 - (B.t - B.charge) / B.fire; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, f); c.shadowColor = '#7fe9ff'; c.shadowBlur = 40; c.strokeStyle = '#7fe9ff'; c.lineWidth = 44; c.lineCap = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 16; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.shadowBlur = 0; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(b.x, b.y, 80, 24, 0, 0, TAU); c.fill(); }
    c.restore();
  };
  // Petit canon de profil pour l'onglet « Canons » du hangar
  R.cannonGlyph = (c, x, y, s) => { c.save(); c.translate(x, y); c.scale(s, s); circle(c, -.5, 0, .55, '#9fdcff'); circle(c, -.5, 0, .22, '#0b2452'); box(c, -.9, -.55, 1.6, .45, .1, '#5fb6ff'); c.save(); c.translate(.1, -.55); c.rotate(-.45); box(c, -.6, -.22, 1.5, .44, .14, '#eaf4ff'); box(c, .7, -.26, .24, .52, .08, '#9fdcff'); c.restore(); star(c, -.85, -1.05, .2, '#ffd23f', 5); c.restore(); };
  // ---------- La scène complète ----------
  R.scene = (c, wave, { playerId, cannon, ball, t = 0, view } = {}) => {
    const V = CB.VIEW, w = view ? view.w : V.w, h = view ? view.h : V.h;
    c.save(); if (view) { c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); c.clearRect(0, 0, w, h); }
    if (wave.shake > 0) { const k = wave.shake * wave.shake * 22; c.translate((Math.sin(t * 97) * k), (Math.cos(t * 83) * k)); } // secousse du KABOOM
    const zf = wave.fx && wave.fx.slowmo > 0 ? wave.zoomFx : null; c.save();
    if (zf) { const z = 1 + .05 * zf.k + .09 * zf.punch, zx = V.cx, zy = V.horizon + (V.ground - V.horizon) * .35; c.translate(zx, zy); c.scale(z, z); c.translate(-zx, -zy); }   // zoom caméra du Zoom-zoom
    R.background(c, w, h, wave.scenery || wave.world, t);
    if (wave.fx && wave.fx.licorne > 0) R.rainbowSky(c, wave, t, w, h);
    if (wave.fx && wave.fx.priere > 0) R.prayerSky(c, wave, t, w, h);
    if (wave.def && wave.def.boat) R.shipMast(c, w, h, V, t);
    const list = wave.enemies.slice().sort((a, b) => b.z - a.z);
    const farBalls = wave.balls.filter(b => b.z > 60), nearBalls = wave.balls.filter(b => b.z <= 60);
    for (const b of farBalls) R.ball(c, b, ball, t);
    if (zf && list.length <= 18) for (const e of list) { c.save(); c.globalAlpha = .22 * zf.k; c.translate(0, -7 - 6 * zf.punch); R.enemy(c, e, t); c.restore(); }   // écho de mouvement (sans filtre blur : trop lourd, et seulement quand il y a peu de monstres)
    for (const e of list) R.enemy(c, e, t);
    if (wave.tornadoes) R.tornadoes(c, wave, t);
    if (wave.outro) R.dragon(c, wave.outro, t);
    if (wave.vortex) R.vortex(c, wave.vortex, t, wave.fx.teleport);
    if (wave.unicorn) R.unicorn(c, wave.unicorn, t);
    if (wave.spirits) wave.spirits.forEach((sp, i) => R.spirit(c, sp, t, i));
    if (wave.angels) wave.angels.forEach((a, i) => R.angel(c, a, t, i));
    if (wave.pirates) wave.pirates.forEach(s => R.pirateShip(c, s, t));
    for (const b of wave.bursts) R.burst(c, b);
    for (const b of nearBalls) R.ball(c, b, ball, t);
    for (const tx of wave.texts) R.text(c, tx);
    if (wave.portal) R.portal(c, wave.portal, t, w, h);
    R.specialFx(c, wave, t, w, h); R.beam(c, wave, t);
    // coéquipier de profil à gauche, héros de dos au centre
    const muzzle = P({ x: 0, y: 1.8, z: 0 });
    if (wave.def && wave.def.boat) R.shipHull(c, w, h, V, t);
    if (wave.familyBuff) { const col = (CB.FAMILIES[playerId && (CB.playerById(playerId) || {}).family] || {}).color || '#ffd23f', ay = muzzle.y - V.allyLift + 1.2 * V.allySize; R.familyAura(c, V.cx, V.ground, V.size, col, t); if (wave.ally) R.familyAura(c, V.allyOrigin, ay, V.allySize, col, t + 1); if (wave.ally2) R.familyAura(c, w - V.allyOrigin, ay, V.allySize, col, t + 2); }
    if (wave.ally) { const ax = V.allyOrigin, ay = muzzle.y - V.allyLift + 1.2 * V.allySize; R.battleCannon(c, ax, ay, V.allySize, wave.ally.id, cannon, 1, wave.ally.recoil); R.fireFlash(c, ax + V.allySize * 1.95, ay - V.allySize * 1.72, V.allySize / 90, wave.ally.recoil - .5); }
    if (wave.ally2) { const ax = w - V.allyOrigin, ay = muzzle.y - V.allyLift + 1.2 * V.allySize; R.battleCannon(c, ax, ay, V.allySize, wave.ally2.id, cannon, -1, wave.ally2.recoil); R.fireFlash(c, ax - V.allySize * 1.95, ay - V.allySize * 1.72, V.allySize / 90, wave.ally2.recoil - .5); }
    if (wave.guest) { const g = wave.guest, gs = V.allySize * (g.far ? .85 : 1), ax = g.side > 0 ? V.allyOrigin * (g.far ? .35 : 1) : w - V.allyOrigin, ay = muzzle.y - V.allyLift + 1.2 * V.allySize; R.battleCannon(c, ax, ay, gs, g.id, cannon, g.side, g.recoil); R.fireFlash(c, ax + g.side * gs * 1.95, ay - gs * 1.72, gs / 90, g.recoil - .5); c.save(); c.font = 'bold ' + Math.round(gs * .16) + 'px Arial'; c.textAlign = 'center'; c.fillStyle = '#9fdcff'; c.fillText('🤝 ' + Math.ceil(g.left) + ' s', ax, ay - gs * 1.9); c.restore(); }
    if (wave.towers) for (const tw of wave.towers) { const tx = V.cx + tw.side * V.size * 1.9, ts = V.size * .55; R.tower(c, tx, V.ground, ts, tw, t); R.fireFlash(c, tx, V.ground - ts * 1.6, ts / 70, tw.recoil - .5); }
    if (wave.sphere) R.sphere(c, wave, t);
    const hx = V.cx + (wave.px || 0) * V.f / 18;   // monde des pirates : ◀ ▶ déplacent le canon sur le pont
    const rot = Math.max(-.22, Math.min(.22, (wave.aim.x - hx) * 66 / V.f * .008));
    if (wave.fx && wave.fx.teleport > 0) for (const sg of [-1, 1]) { c.save(); c.globalAlpha = .22 + .14 * Math.sin(t * 20 + sg); c.filter = 'hue-rotate(70deg) saturate(1.6)'; R.battleCannon(c, hx + sg * (60 + Math.sin(t * 9) * 14), V.ground, V.size, playerId, cannon, 0, wave.recoil, rot); c.restore(); }
    if (wave.fx && wave.fx.ghost > 0) { c.save(); c.globalAlpha = .45 + .15 * Math.sin(t * 6); c.filter = 'saturate(.2) brightness(1.5)'; c.translate(0, Math.sin(t * 4) * 5); R.battleCannon(c, hx, V.ground, V.size, playerId, cannon, 0, wave.recoil, rot); c.restore(); }
    else R.battleCannon(c, hx, V.ground, V.size, playerId, cannon, 0, wave.recoil, rot);
    R.fireFlash(c, hx + Math.sin(rot) * 1.55 * V.size, V.ground - 1.55 * V.size * Math.cos(rot), V.size / 110, wave.recoil - .5);
    if (wave.fx && wave.fx.priere > 0) R.holyShield(c, wave, t);
    if (wave.fx && wave.fx.protect > 0) R.loveDome(c, wave, t, w, h);
    if (wave.stun) R.stunFx(c, wave, t);
    if (wave.puzzle) { c.save(); c.fillStyle = '#ffd23f'; c.font = 'bold 20px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.fillText('🧩 ' + Math.ceil(wave.puzzle.time) + ' s · prochain : ' + wave.puzzle.next, V.cx, 140); c.restore(); }
    if (wave.flash > 0) { c.fillStyle = 'rgba(255,255,240,' + Math.min(1, wave.flash) * .95 + ')'; c.fillRect(0, 0, w, h); }
    if (wave.hurt > 0) { c.fillStyle = 'rgba(230,40,40,' + (wave.hurt * .5) + ')'; c.fillRect(0, 0, w, h); }
    const locked = wave.enemies.some(e => { const p = P(e); return Math.hypot(p.x - wave.aim.x, p.y - wave.aim.y) < Math.max(28, p.scale * 2.3 * e.size); });
    c.restore();   // fin du zoom caméra : le viseur reste sous la souris
    if (zf) R.zoomFocus(c, wave, zf, t, w, h);
    if (!wave.over) R.reticle(c, wave.aim, locked, t);
    c.restore();
  };
})(window.CB);
