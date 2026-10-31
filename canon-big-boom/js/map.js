// Carte du monde façon Donkey Kong Country : une île par monde, un chemin, cinq tableaux, le personnage qui marche.
(function (CB) {
  const star = (c, x, y, r, color, points = 5) => { c.fillStyle = color; c.beginPath(); for (let i = 0; i < points * 2; i++) { const a = i * Math.PI / points - Math.PI / 2, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };
  'use strict';
  const M = CB.Map = {}, TAU = Math.PI * 2;
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const NODES = [
    [[130, 470], [300, 400], [470, 460], [650, 380], [830, 290], [250, 215], [500, 290], [700, 250], [370, 285]], // le neuvième : le bateau pirate ; le sixième : la Vallée des dinosaures, au bout du portail ; le septième : le mini-jeu des cibles ; le huitième : le brigand
    [[120, 440], [290, 480], [460, 390], [640, 450], [830, 320], [620, 190]],   // le sixième : le tableau secret (le puits), au bout du portail du tableau 3
    [[140, 480], [320, 420], [500, 470], [690, 400], [840, 300], [640, 190]],   // le chapiteau
    [[120, 460], [290, 380], [470, 440], [650, 360], [830, 280]],
    [[130, 480], [310, 430], [480, 370], [660, 430], [830, 300], [620, 190]],   // la grotte
    [[110, 470], [300, 400], [500, 450], [680, 350], [850, 270], [640, 190]],   // le trou noir
    [[120, 460], [300, 395], [480, 455], [660, 370], [830, 290]],   // la Mer des pirates (monde caché)
    [[130, 470], [310, 410], [490, 465], [670, 385], [840, 295]],   // les Abysses
    [[120, 450], [300, 490], [470, 400], [650, 455], [830, 310]],   // le Cirque des ballons
    [[110, 475], [290, 420], [480, 370], [660, 440], [850, 300]],   // la Grotte sans fin
    [[130, 455], [310, 395], [500, 450], [680, 360], [840, 280]],   // Au-delà des étoiles
  ];
  // Passerelles vers les mondes cachés : monde 1 en haut à gauche (au bout du bateau 1-9), les autres en haut à droite (au bout du tableau secret N-6)
  M.GATES = { foret: [120, 118], manoir: [840, 120], foire: [840, 120], volcan: [840, 120], espace: [840, 120] };
  M.GATE = M.GATES.foret;
  M.gateAt = (wi, x, y) => { const g = M.GATES[(CB.WORLDS[wi] || {}).id]; return !!g && Math.abs(x - g[0]) < 70 && Math.abs(y - g[1]) < 50; };
  M.nodes = wi => NODES[wi] || NODES[0];
  // Points spéciaux du chemin : 'exit' (après le boss, vers le monde suivant), 'entry' (avant le tableau 1, depuis le monde d'avant ou le monde parent), 'gate' (la passerelle du monde caché)
  M.EXIT = [935, 250]; M.ENTRY = [22, 470];
  M.pos = (wi, key) => key === 'exit' ? M.EXIT : key === 'entry' ? M.ENTRY : key === 'gate' ? (M.GATES[(CB.WORLDS[wi] || {}).id] || M.EXIT) : M.nodes(wi)[key];
  // Une case est visible (dessinée, atteignable) : monde 1 selon ce qui a été révélé ; ailleurs le tableau secret N-6 après le portail
  M.visible = (wi, profile, vi) => { const w = CB.WORLDS[wi] || {}, sec = w.secret, ext = w.extra, ex2 = w.extra2, ex3 = w.extra3, shown = wi === 0 ? Math.min(CB.WAVES_PER_WORLD - 1, (profile.shown || 0)) : CB.WAVES_PER_WORLD - 1;
    return sec && vi === sec.vi ? CB.Save.portalShown(profile, w.id) : ext && vi === ext.vi ? !!profile.targetsShown : ex2 && vi === ex2.vi ? !!profile.brigandsShown : ex3 && vi === ex3.vi ? !!profile.boatShown : vi <= shown; };
  // Voisins d'une case sur le chemin (numéro de tableau, ou 'gate' / 'exit' / 'entry') : le chemin principal, les embranchements, la passerelle, la sortie et l'entrée du monde
  M.neighbors = (wi, cur, gateOn) => { const w = CB.WORLDS[wi] || {}, out = [], add = (a, b) => { if (a === cur) out.push(b); else if (b === cur) out.push(a); };
    for (let i = 1; i < CB.WAVES_PER_WORLD; i++) add(i - 1, i); for (const k of ['secret', 'extra', 'extra2', 'extra3']) if (w[k]) add(w[k].from, w[k].vi);
    if (gateOn && w.gate != null) add(w.gate, 'gate'); if (!w.hidden) add(CB.WAVES_PER_WORLD - 1, 'exit'); if (wi > 0) add(0, 'entry'); return out; };
  // Le tableau secret part du tableau 1 (world.secret.from) et non du précédent.
  M.prev = (wi, vi) => { const w = CB.WORLDS[wi] || {}, sec = w.secret, ext = w.extra, ex2 = w.extra2, ex3 = w.extra3; return sec && sec.vi === vi ? sec.from : ext && ext.vi === vi ? ext.from : ex2 && ex2.vi === vi ? ex2.from : ex3 && ex3.vi === vi ? ex3.from : vi - 1; };
  M.HANGAR = [770, 485];   // le hangar dessiné sur l'île : cliquer dessus ouvre la boutique
  M.hangarAt = (x, y) => Math.abs(x - M.HANGAR[0]) < 60 && Math.abs(y - M.HANGAR[1]) < 46;
  M.nodeAt = (wi, x, y) => M.nodes(wi).findIndex(([nx, ny]) => Math.hypot(nx - x, ny - y) < 34);
  // Point sur le chemin entre deux tableaux (0 ≤ k ≤ 1), même courbe que le tracé.
  M.pathPoint = (wi, from, to, k) => { const a = M.pos(wi, from), b = M.pos(wi, to), mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 40; const u = 1 - k; return [u * u * a[0] + 2 * u * k * mx + k * k * b[0], u * u * a[1] + 2 * u * k * my + k * k * b[1]]; };
  const DECOR = {
    foret(c, x, y, i) { c.fillStyle = i % 2 ? '#1f6b3a' : '#17552d'; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(x, y - 34); c.fill(); c.fillStyle = '#5a3a21'; c.fillRect(x - 3, y, 6, 8); },
    manoir(c, x, y, i) { if (i % 3 === 0) { c.fillStyle = '#5a4a7a'; c.beginPath(); c.roundRect(x - 9, y - 22, 18, 24, 7); c.fill(); c.fillStyle = '#3a2a55'; c.fillRect(x - 5, y - 14, 10, 3); } else { c.fillStyle = '#2a1f45'; c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.lineTo(x + 6, y - 26); c.lineTo(x, y - 14); c.lineTo(x - 6, y - 30); c.fill(); } },
    foire(c, x, y, i, t = 0) {
      const col = ['#e8403c', '#4fc3ff', '#ffd23f', '#c54fff', '#3fae5a'][i % 5];
      if (i % 5 === 4) { c.fillStyle = '#b98a52'; c.fillRect(x - 14, y - 12, 28, 12); c.fillStyle = col; c.beginPath(); c.moveTo(x - 18, y - 12); c.lineTo(x - 10, y - 22); c.lineTo(x + 10, y - 22); c.lineTo(x + 18, y - 12); c.closePath(); c.fill(); c.fillStyle = '#fff'; for (let k = 0; k < 4; k++) c.fillRect(x - 16 + k * 9, y - 12, 4, 3); for (let k = 0; k < 3; k++) circle(c, x - 8 + k * 8, y - 6, 2.5, ['#ff4f6b', '#9cff6b', '#4fc3ff'][k]); return; }   // stand de tir avec ses ballons
      const big = i % 3 === 0, hw = big ? 24 : 15, hh = big ? 34 : 22, stripes = big ? 6 : 4;   // chapiteau rayé, petite tente, grande tente ronde
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 2, hw + 4, 5, 0, 0, TAU); c.fill();
      if (i % 3 === 1) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y - hh * .45, hw, hh * .5, 0, Math.PI, TAU); c.fill(); c.fillStyle = '#fff3e0'; c.fillRect(x - hw, y - hh * .45, hw * 2, hh * .45); c.fillStyle = col; for (let k = -1; k <= 1; k += 2) c.fillRect(x + k * hw * .55 - 2, y - hh * .45, 4, hh * .45); c.fillStyle = '#3a2a1e'; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.lineTo(x, y - 10); c.closePath(); c.fill(); }   // tente ronde à toit bombé
      else { for (let k = 0; k < stripes; k++) { c.fillStyle = k % 2 ? '#fff3e0' : col; c.beginPath(); c.moveTo(x, y - hh); c.lineTo(x - hw + k * 2 * hw / stripes, y); c.lineTo(x - hw + (k + 1) * 2 * hw / stripes, y); c.closePath(); c.fill(); } c.fillStyle = '#3a2a1e'; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x, y - 9); c.closePath(); c.fill(); if (big) { c.fillStyle = col; c.beginPath(); c.moveTo(x - hw - 4, y); c.lineTo(x + hw + 4, y); c.lineTo(x + hw, y + 4); c.lineTo(x - hw, y + 4); c.closePath(); c.fill(); } }
      c.fillStyle = '#fff'; c.fillRect(x - 1, y - hh - 10, 2, 10); c.fillStyle = ['#ffd23f', '#ff4f6b', '#4fc3ff'][i % 3]; c.beginPath(); c.moveTo(x + 1, y - hh - 10); c.lineTo(x + 9 + Math.sin(t * 5 + i) * 2, y - hh - 7); c.lineTo(x + 1, y - hh - 4); c.closePath(); c.fill();   // fanion qui flotte
    },
    ruche(c, x, y, i) { c.strokeStyle = '#5a8f2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 14); c.stroke(); for (let k = 0; k < 5; k++) circle(c, x + Math.cos(k * TAU / 5) * 5, y - 14 + Math.sin(k * TAU / 5) * 5, 3.5, ['#ff4f6b', '#fff', '#c54fff'][i % 3]); circle(c, x, y - 14, 2.5, '#ffb000'); },
    volcan(c, x, y, i) { c.fillStyle = i % 2 ? '#4a2a22' : '#3a1a16'; c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x - 4, y - 22); c.lineTo(x + 6, y - 12); c.lineTo(x + 16, y); c.fill(); if (i % 2) circle(c, x - 4, y - 22, 3, '#ff8c2a'); },
    pirates(c, x, y, i) { if (i % 4 === 0) { c.fillStyle = '#5a3416'; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(x + 9, y + 8); c.lineTo(x - 9, y + 8); c.closePath(); c.fill(); c.fillRect(x - 1, y - 18, 2, 18); c.fillStyle = '#f1e7d0'; c.beginPath(); c.moveTo(x + 1, y - 17); c.quadraticCurveTo(x + 13, y - 10, x + 1, y - 2); c.closePath(); c.fill(); } else { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x - 6, y - 6, x, y); c.quadraticCurveTo(x + 6, y + 6, x + 12, y); c.stroke(); } },
    abysses(c, x, y, i) { if (i % 3 === 0) { c.strokeStyle = '#2f8f6a'; c.lineWidth = 3; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 5, y); c.quadraticCurveTo(x + k * 12, y - 14, x + k * 6, y - 28); c.stroke(); } } else for (let k = 0; k < 3; k++) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x + (k % 2) * 6, y - k * 9, 3 + k, 0, TAU); c.stroke(); } },
    cirque(c, x, y, i) { if (i % 2) { c.fillStyle = i % 4 === 1 ? '#e8403c' : '#ffd23f'; c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x, y - 24); c.lineTo(x + 16, y); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - 3, y - 14, 6, 14); circle(c, x, y - 24, 3, '#fff'); } else { circle(c, x, y - 14, 7, ['#ff4f6b', '#4fc3ff', '#9cff6b'][i % 3]); c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 2, y); c.stroke(); } },
    grotte(c, x, y, i) { c.fillStyle = i % 2 ? '#4a3a36' : '#3a2a28'; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 6, y - 26); c.lineTo(x + 2, y - 10); c.lineTo(x + 8, y - 22); c.lineTo(x + 14, y); c.fill(); if (i % 3 === 0) circle(c, x + 2, y - 8, 3, '#ff8c2a'); },
    galaxie(c, x, y, i) { if (i % 4 === 0) { circle(c, x, y - 10, 9, ['#c47dff', '#4fc3ff', '#ff8c2a'][i % 3]); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 10, 15, 4, -.3, 0, TAU); c.stroke(); } else { c.fillStyle = i % 3 ? '#dfe9ff' : '#ffd23f'; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * TAU / 8, r = k % 2 ? 2 : 6; c.lineTo(x + Math.cos(a) * r, y - 8 + Math.sin(a) * r); } c.fill(); } },
    espace(c, x, y, i) { c.fillStyle = i % 3 ? '#8aa0c0' : '#ffd23f'; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * TAU / 8, r = k % 2 ? 2 : 7; c.lineTo(x + Math.cos(a) * r, y - 8 + Math.sin(a) * r); } c.fill(); },
  };
  const RIDES = { foire: [[180, 330], [560, 548], [400, 300]], cirque: [[200, 330]] };   // emplacements des manèges (map-life.js) : pas de tente dessus
  const GATE_COLORS = { pirates: '#9fe0ff', abysses: '#5fd3ff', cirque: '#ffd23f', grotte: '#ff8c2a', galaxie: '#c47dff' };
  // Petite île de chaque monde caché, dessinée au bout de la passerelle (origine au centre) : navire pirate, tourbillon et périscope, chapiteau, bouche de grotte, trou noir
  const GATE_ICONS = {
    pirates(c, t) { circle(c, 0, 10, 40, 'rgba(0,0,0,.3)'); c.fillStyle = '#1b4f8a'; c.beginPath(); c.ellipse(0, 8, 56, 26, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-40 + i * 28, 14 + Math.sin(t * 3 + i) * 2); c.quadraticCurveTo(-33 + i * 28, 8, -26 + i * 28, 14); c.stroke(); } c.fillStyle = '#6b4a2a'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(26, 0); c.lineTo(18, 14); c.lineTo(-18, 14); c.closePath(); c.fill(); c.fillRect(-2, -34, 4, 36); c.fillStyle = '#f1e7d0'; c.beginPath(); c.moveTo(2, -32); c.quadraticCurveTo(28 + Math.sin(t * 2) * 3, -18, 2, -4); c.closePath(); c.fill(); c.fillStyle = '#1b1b1b'; c.fillRect(-16, -36, 14, 9); c.fillStyle = '#fff'; c.font = '8px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☠', -9, -31); },
    abysses(c, t) { circle(c, 0, 10, 40, 'rgba(0,0,0,.3)'); c.fillStyle = '#0b2a4a'; c.beginPath(); c.ellipse(0, 8, 56, 26, 0, 0, TAU); c.fill(); for (let i = 0; i < 3; i++) { c.save(); c.translate(0, 8); c.scale(1, .45); c.rotate(t * (1.5 + i * .4)); c.strokeStyle = ['#5fd3ff', '#9fe0ff', '#fff'][i]; c.lineWidth = 3 - i * .6; c.beginPath(); c.arc(0, 0, 34 - i * 9, 0, TAU * .75); c.stroke(); c.restore(); } c.fillStyle = '#e8c23a'; c.beginPath(); c.roundRect(-18, -12, 36, 16, 8); c.fill(); c.fillRect(-4, -26, 6, 16); c.fillRect(-4, -28, 14, 5); circle(c, 4, -4, 4, '#4fc3ff'); for (let i = 0; i < 3; i++) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(12 + i * 6, -30 - ((t * 20 + i * 9) % 26), 2 + i, 0, TAU); c.stroke(); } },
    cirque(c, t) { circle(c, 0, 14, 44, 'rgba(0,0,0,.3)'); c.fillStyle = '#3f8f3a'; c.beginPath(); c.ellipse(0, 12, 58, 24, 0, 0, TAU); c.fill(); for (let i = -3; i <= 3; i++) { c.fillStyle = i % 2 ? '#e8403c' : '#fff3e0'; c.beginPath(); c.moveTo(i * 10, -34); c.lineTo(i * 10 - 10, 8); c.lineTo(i * 10 + 10, 8); c.closePath(); c.fill(); } c.fillStyle = '#e8403c'; c.beginPath(); c.moveTo(-42, 8); c.lineTo(42, 8); c.lineTo(36, 16); c.lineTo(-36, 16); c.closePath(); c.fill(); c.fillStyle = '#5a1a10'; c.beginPath(); c.moveTo(-8, 16); c.lineTo(8, 16); c.lineTo(0, 2); c.closePath(); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(-1, -46, 2, 14); c.beginPath(); c.moveTo(1, -46); c.lineTo(14 + Math.sin(t * 6) * 2, -42); c.lineTo(1, -38); c.closePath(); c.fill(); for (let i = 0; i < 3; i++) circle(c, -34 + i * 8, -14 + Math.sin(t * 2 + i) * 3, 5, ['#4fc3ff', '#ffd23f', '#ff4f6b'][i]); },
    grotte(c, t) { circle(c, 0, 14, 44, 'rgba(0,0,0,.3)'); c.fillStyle = '#4a2a22'; c.beginPath(); c.moveTo(-50, 16); c.lineTo(-34, -22); c.lineTo(-10, -40); c.lineTo(16, -36); c.lineTo(38, -14); c.lineTo(50, 16); c.closePath(); c.fill(); c.fillStyle = '#120806'; c.beginPath(); c.moveTo(-22, 16); c.quadraticCurveTo(-22, -16, 0, -18); c.quadraticCurveTo(22, -16, 22, 16); c.closePath(); c.fill(); const g = .6 + .4 * Math.sin(t * 3); c.fillStyle = 'rgba(255,140,42,' + (.35 * g) + ')'; c.beginPath(); c.moveTo(-14, 16); c.quadraticCurveTo(-14, -6, 0, -8); c.quadraticCurveTo(14, -6, 14, 16); c.closePath(); c.fill(); for (let i = 0; i < 4; i++) { c.fillStyle = '#9aa3b2'; c.beginPath(); c.moveTo(-16 + i * 10, -17); c.lineTo(-13 + i * 10, -17); c.lineTo(-14.5 + i * 10, -8 + (i % 2) * 3); c.closePath(); c.fill(); } },
    galaxie(c, t) { circle(c, 0, 10, 42, 'rgba(0,0,0,.35)'); for (let i = 0; i < 3; i++) { c.save(); c.translate(0, 4); c.rotate(t * (.8 + i * .5) + i); c.strokeStyle = ['#c47dff', '#7fd4ff', '#fff'][i]; c.lineWidth = 4 - i; c.shadowColor = '#c47dff'; c.shadowBlur = 10; c.beginPath(); c.ellipse(0, 0, 40 - i * 8, 16 - i * 3, 0, 0, TAU * .8); c.stroke(); c.restore(); } circle(c, 0, 4, 16, '#050310'); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(0, 4, 17, 0, TAU); c.stroke(); for (let i = 0; i < 6; i++) star(c, Math.cos(t + i) * 44, 4 + Math.sin(t * 1.3 + i * 2) * 18, 3, i % 2 ? '#ffd23f' : '#fff'); },
  };
  // Le hangar sur l'île : toit arrondi de tôle, grande porte, enseigne « HANGAR » avec une clé, lumière qui clignote
  M.hangar = (c, x, y, t) => {
    c.save(); circle(c, x, y + 22, 52, 'rgba(0,0,0,.3)');
    c.fillStyle = '#5b6b80'; c.beginPath(); c.moveTo(x - 50, y + 24); c.lineTo(x - 50, y - 6); c.quadraticCurveTo(x, y - 54, x + 50, y - 6); c.lineTo(x + 50, y + 24); c.closePath(); c.fill();
    c.strokeStyle = '#3f4c5e'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - 50 + k * 1, y - 6 + k * 7); c.quadraticCurveTo(x, y - 54 + k * 7, x + 50 - k * 1, y - 6 + k * 7); c.stroke(); }
    c.fillStyle = '#243040'; c.fillRect(x - 24, y - 8, 48, 32); c.fillStyle = '#ffd23f'; c.fillRect(x - 24, y - 8, 48, 4); c.fillStyle = '#9fb4cc'; for (let k = 0; k < 3; k++) c.fillRect(x - 22, y + k * 10, 44, 2);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 34, y - 26, 68, 16, 4); c.fill(); c.fillStyle = '#0b2452'; c.font = 'bold 11px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔧 HANGAR', x, y - 18);
    circle(c, x + 42, y - 2, 4, Math.sin(t * 4) > 0 ? '#ff5a5a' : '#5a1a1a'); c.restore();
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
  // Monde 1 : seuls les tableaux révélés (profile.shown) sont dessinés ; reveal = { vi, k } anime le chemin (k 0→1) puis la case (k 1→1.5).
  M.draw = (c, { wi, profile, selected, t = 0, playerId, marker, view, reveal, cheer, gate, exit, entry }) => {
    const sec = (CB.WORLDS[wi] || {}).secret, ext = (CB.WORLDS[wi] || {}).extra, ex2 = (CB.WORLDS[wi] || {}).extra2, ex3 = (CB.WORLDS[wi] || {}).extra3;
    const visible = vi => (reveal && vi === reveal.vi) || M.visible(wi, profile, vi);
    const w = CB.WORLDS[wi], S = CB.Save, n = M.nodes(wi), R = CB.Render, lw = view ? view.lw : 960, lh = view ? view.lh : 640;
    c.save();
    const g = c.createLinearGradient(0, 0, 0, lh); g.addColorStop(0, w.sky[0]); g.addColorStop(1, w.sky[2]); c.fillStyle = g; c.fillRect(0, 0, lw, lh);
    if (w.space || wi < 2) for (let i = 0; i < 80; i++) { c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t + i)); c.fillStyle = '#fff'; c.fillRect(hash(i) * lw, hash(i + 50) * lh, 2, 2); } c.globalAlpha = 1;
    if (!w.space) { c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(lw * (i + .5) / 4 + Math.sin(t * .2 + i) * 20, 80 + i * 20, 70, 22, 0, 0, TAU); c.fill(); } }
    if (M.sky) M.sky(c, w, wi, lw, lh, t);   // pleine lune des mondes 1 et 2 (map-life.js)
    if (view) c.translate(view.ox, view.oy);
    island(c, w, wi);
    for (let i = 0; i < 26; i++) { const x = 60 + hash(i + wi * 7) * 840, y = 250 + hash(i + 99 + wi) * 330; if (n.some(([nx, ny]) => Math.hypot(nx - x, ny - y) < 60) || Math.hypot(M.HANGAR[0] - x, M.HANGAR[1] - y) < 90 || (RIDES[w.id] || []).some(([rx, ry]) => Math.hypot(rx - x, ry - y) < 80)) continue; (DECOR[w.id] || DECOR.foret)(c, x, y, i, t); }
    if (M.life) M.life(c, w, wi, n, t);   // monstres du monde qui se promènent, manèges, lucioles… (map-life.js)
    // sortie après le boss vers le monde suivant, et entrée depuis le monde d'avant (ou le monde parent d'un monde caché) : on peut traverser les mondes à pied
    const sign = (x, y, text, open) => { c.save(); c.setLineDash([]); c.font = 'bold 12px "Arial Rounded MT Bold", Arial'; const tw = c.measureText(text).width + 18; c.fillStyle = open ? 'rgba(8,20,45,.78)' : 'rgba(40,40,50,.7)'; c.beginPath(); c.roundRect(x - tw / 2, y - 12, tw, 24, 8); c.fill(); c.fillStyle = open ? '#fff' : '#9db9dd'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 1); c.restore(); };
    const road = (a, b, open) => { const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 40; c.save(); c.setLineDash([10, 12]); c.lineDashOffset = -t * 30; c.strokeStyle = open ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.22)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(mx, my, b[0], b[1]); c.stroke(); c.restore(); };
    if (exit && visible(CB.WAVES_PER_WORLD - 1)) { road(n[CB.WAVES_PER_WORLD - 1], M.EXIT, exit.open); sign(M.EXIT[0] - 30, M.EXIT[1] - 34, (exit.open ? '▶ ' : '🔒 ') + exit.name, exit.open); }
    if (entry) { road(M.ENTRY, n[0], true); sign(M.ENTRY[0] + 48, M.ENTRY[1] - 36, '◀ ' + entry.name, true); }
    // chemin
    c.setLineDash([10, 12]); c.lineDashOffset = -t * 30; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(n[0][0], n[0][1]);
    for (let i = 1; i < CB.WAVES_PER_WORLD; i++) { if (!visible(i)) break; const a = n[i - 1], b = n[i]; if (reveal && i === reveal.vi) { const k = Math.min(1, reveal.k); for (let j = 1; j <= 24; j++) { const [px, py] = M.pathPoint(wi, i - 1, i, k * j / 24); c.lineTo(px, py); } break; } c.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 40, b[0], b[1]); } c.stroke(); c.setLineDash([]);
    // chemin du portail (bleu, tourbillonnant) vers le tableau secret
    if (sec && visible(sec.vi)) { const k = reveal && reveal.vi === sec.vi ? Math.min(1, reveal.k) : 1; c.setLineDash([6, 10]); c.lineDashOffset = -t * 50; c.strokeStyle = '#8fd6ff'; c.lineWidth = 6; c.shadowColor = '#3f8fff'; c.shadowBlur = 14; c.beginPath(); c.moveTo(n[sec.from][0], n[sec.from][1]); for (let j = 1; j <= 24; j++) { const [px, py] = M.pathPoint(wi, sec.from, sec.vi, k * j / 24); c.lineTo(px, py); } c.stroke(); c.shadowBlur = 0; c.setLineDash([]); }
    // chemin doré en pointillé vers le mini-jeu des cibles
    if (ext && visible(ext.vi)) { const k = reveal && reveal.vi === ext.vi ? Math.min(1, reveal.k) : 1; c.setLineDash([4, 10]); c.lineDashOffset = -t * 40; c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.shadowColor = '#ffd23f'; c.shadowBlur = 12; c.beginPath(); c.moveTo(n[ext.from][0], n[ext.from][1]); for (let j = 1; j <= 24; j++) { const [px, py] = M.pathPoint(wi, ext.from, ext.vi, k * j / 24); c.lineTo(px, py); } c.stroke(); c.shadowBlur = 0; c.setLineDash([]); }
    // chemin bleu-écume vers le bateau pirate
    if (ex3 && visible(ex3.vi)) { const k = reveal && reveal.vi === ex3.vi ? Math.min(1, reveal.k) : 1; c.setLineDash([4, 10]); c.lineDashOffset = -t * 40; c.strokeStyle = '#9fe0ff'; c.lineWidth = 5; c.shadowColor = '#4fc3ff'; c.shadowBlur = 12; c.beginPath(); c.moveTo(n[ex3.from][0], n[ex3.from][1]); for (let j = 1; j <= 24; j++) { const [px, py] = M.pathPoint(wi, ex3.from, ex3.vi, k * j / 24); c.lineTo(px, py); } c.stroke(); c.shadowBlur = 0; c.setLineDash([]); }
    // passerelle vers le monde caché : chemin lumineux depuis le tableau secret (1-9 pour les pirates, N-6 ailleurs), petite île dessinée selon le monde (GATE_ICONS)
    if (gate && gate.on && gate.from != null && n[gate.from] && M.GATES[w.id]) { const k = Math.min(1, gate.k), from = n[gate.from], [gx, gy] = M.GATES[w.id], mx = (from[0] + gx) / 2, my = Math.min(from[1], gy) - 50, col = GATE_COLORS[gate.id] || '#9fe0ff'; c.setLineDash([4, 10]); c.lineDashOffset = -t * 40; c.strokeStyle = col; c.lineWidth = 5; c.shadowColor = col; c.shadowBlur = 12; c.beginPath(); c.moveTo(from[0], from[1]); for (let j = 1; j <= 24; j++) { const q = k * j / 24, u = 1 - q; c.lineTo(u * u * from[0] + 2 * u * q * mx + q * q * gx, u * u * from[1] + 2 * u * q * my + q * q * gy); } c.stroke(); c.shadowBlur = 0; c.setLineDash([]);
      if (gate.k >= 1) { const pop = gate.k < 1.4 ? 1 + (gate.k - 1) * .8 : 1.32 - Math.min(.32, (gate.k - 1.4) * 1.6); c.save(); c.translate(gx, gy); c.scale(pop, pop); (GATE_ICONS[gate.id] || GATE_ICONS.pirates)(c, t); c.fillStyle = '#fff'; c.font = 'bold 11px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(((CB.worldById(gate.id) || {}).icon || '') + ' MONDE CACHÉ', 0, 44); c.restore(); } }
    M.hangar(c, M.HANGAR[0], M.HANGAR[1], t);
    // chemin brun en pointillé vers le mini-jeu du brigand
    if (ex2 && visible(ex2.vi)) { const k = reveal && reveal.vi === ex2.vi ? Math.min(1, reveal.k) : 1; c.setLineDash([4, 10]); c.lineDashOffset = -t * 40; c.strokeStyle = '#d9a066'; c.lineWidth = 5; c.shadowColor = '#ffb347'; c.shadowBlur = 12; c.beginPath(); c.moveTo(n[ex2.from][0], n[ex2.from][1]); for (let j = 1; j <= 24; j++) { const [px, py] = M.pathPoint(wi, ex2.from, ex2.vi, k * j / 24); c.lineTo(px, py); } c.stroke(); c.shadowBlur = 0; c.setLineDash([]); }
    if (reveal && reveal.k < 1) { const [px, py] = M.pathPoint(wi, M.prev(wi, reveal.vi), reveal.vi, reveal.k), portal = sec && reveal.vi === sec.vi; circle(c, px, py, 10 + Math.sin(t * 20) * 3, portal ? '#8fd6ff' : '#fff'); for (let i = 0; i < 6; i++) star(c, px + Math.cos(t * 7 + i) * 26, py + Math.sin(t * 9 + i * 2) * 18, 5, i % 2 ? (portal ? '#3f8fff' : '#ffd23f') : '#fff'); }
    // tableaux
    n.forEach(([x, y], vi) => {
      if (!visible(vi)) return;
      const stars = S.stars(profile, w.id, vi), open = S.waveUnlocked(profile, wi, vi), boss = vi === CB.WAVES_PER_WORLD - 1, secret = sec && vi === sec.vi, extra = ext && vi === ext.vi, extra2 = ex2 && vi === ex2.vi, extra3 = ex3 && vi === ex3.vi;
      c.save();
      if (reveal && vi === reveal.vi) { const k = Math.max(0, Math.min(1, (reveal.k - 1) * 2)); if (k <= 0) { c.restore(); return; } const pop = k < .7 ? k / .7 * 1.35 : 1.35 - (k - .7) / .3 * .35; c.translate(x, y); c.scale(pop, pop); c.translate(-x, -y); for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + t * 2, r = 40 + k * 30; star(c, x + Math.cos(a) * r, y + Math.sin(a) * r, 6, i % 2 ? '#ffd23f' : '#fff'); } }
      circle(c, x, y + 6, 26, 'rgba(0,0,0,.35)');
      if (selected === vi) { c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.globalAlpha = .6 + .4 * Math.sin(t * 6); c.beginPath(); c.arc(x, y, 34 + Math.sin(t * 6) * 3, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      if (secret) { // portail bleu qui tourne
        for (let i = 0; i < 3; i++) { c.save(); c.translate(x, y); c.rotate(t * (i % 2 ? 2 : -1.4) + i); c.strokeStyle = ['#8fd6ff', '#3f8fff', '#fff'][i]; c.lineWidth = 4 - i; c.beginPath(); c.ellipse(0, 0, 30 - i * 5, 22 - i * 4, 0, 0, TAU * .8); c.stroke(); c.restore(); }
        circle(c, x, y, 17, stars ? '#2fa84f' : '#1e4fb8'); circle(c, x, y, 12, stars ? '#7dff9a' : '#9fe0ff');
      } else if (extra) { // cible ailée : anneaux rouge et blanc, deux petites ailes qui battent
        const flap = Math.sin(t * 10) * 6; c.fillStyle = '#fff'; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(x + sg * 18, y - 4); c.quadraticCurveTo(x + sg * 36, y - 22 - flap, x + sg * 44, y - 6 - flap); c.quadraticCurveTo(x + sg * 32, y + 4, x + sg * 18, y + 6); c.fill(); }
        for (const [rr, col] of [[24, '#ff3a3a'], [18, '#fff'], [12, '#ff3a3a'], [6, '#ffd23f']]) circle(c, x, y, rr, open ? col : '#6b768a'); if (stars) circle(c, x, y, 6, '#7dff9a');
      } else if (extra3) { // bateau pirate : coque, mât, voile, pavillon
        const col = open ? '#6b4a2a' : '#4a5468', sail = open ? '#f1e7d0' : '#8a93a3'; c.fillStyle = col; c.beginPath(); c.moveTo(x - 32, y + 2); c.lineTo(x + 32, y + 2); c.lineTo(x + 22, y + 20); c.lineTo(x - 22, y + 20); c.closePath(); c.fill(); c.fillRect(x - 2, y - 30, 4, 32); c.fillStyle = sail; c.beginPath(); c.moveTo(x + 2, y - 28); c.quadraticCurveTo(x + 30, y - 16, x + 2, y - 2); c.closePath(); c.fill(); c.fillStyle = '#1b1b1b'; c.fillRect(x - 16, y - 32, 14, 9); if (open) { c.font = '8px Arial'; c.fillStyle = '#fff'; c.fillText('☠', x - 9, y - 27); } if (stars) circle(c, x + 24, y + 12, 6, '#7dff9a');
      } else if (extra2) { // panneau de bois du stand de tir, avec le brigand masqué
        c.fillStyle = '#6b4a2a'; c.fillRect(x - 3, y + 10, 6, 22); c.fillStyle = open ? '#b9834a' : '#6b768a'; c.beginPath(); c.roundRect(x - 28, y - 24, 56, 44, 6); c.fill(); c.strokeStyle = open ? '#7a5230' : '#4a5468'; c.lineWidth = 2; c.stroke(); if (open) { circle(c, x, y - 6, 10, '#e8b089'); c.fillStyle = '#1b1b1b'; c.fillRect(x - 11, y - 10, 22, 6); c.fillStyle = '#3b2a1e'; c.fillRect(x - 13, y - 19, 26, 4); c.fillRect(x - 8, y - 26, 16, 8); c.fillStyle = '#c8322a'; c.fillRect(x - 9, y + 4, 18, 12); if (stars) circle(c, x + 20, y + 12, 6, '#7dff9a'); }
      } else { circle(c, x, y, 26, open ? (stars ? '#2fa84f' : '#ffd23f') : '#4a5468'); circle(c, x, y, 20, open ? (stars ? '#7dff9a' : '#fff3a0') : '#6b768a'); }
      c.fillStyle = open ? '#1b2436' : '#2a3140'; c.font = 'bold 18px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (secret) { c.font = '16px Arial'; c.fillText(wi === 0 ? '🦖' : (CB.WORLDS[CB.hiddenFrom(wi)] || {}).icon || '🌀', x, y + 1); } else if (extra || extra2 || extra3) { if (!open) { c.font = '18px Arial'; c.fillText('🔒', x, y + 1); } } else if (boss) { c.font = '22px Arial'; c.fillText(open ? '💀' : '🔒', x, y + 1); } else c.fillText(open ? String(vi + 1) : '🔒', x, y + 1);
      if (stars) { const ns = Math.max(3, stars); for (let s = 0; s < ns; s++) { c.font = '14px Arial'; c.fillStyle = s < stars ? (stars >= 4 ? '#9fe8ff' : '#ffd23f') : 'rgba(255,255,255,.35)'; c.fillText(stars >= 4 ? '✦' : '★', x - 16 - (ns - 3) * 8 + s * 16, y + 38); } }   // 4 : diamant
      if (secret && wi !== 0) { c.font = 'bold 11px "Arial Rounded MT Bold", Arial'; c.fillStyle = '#fff'; c.fillText('🌀 SECRET', x, y - 44); }
      if (wi === 0 && (vi === 0 || secret || extra || extra2 || extra3)) { c.font = 'bold 11px "Arial Rounded MT Bold", Arial'; c.fillStyle = '#fff'; c.fillText(secret ? '∞ · LE PASSÉ' : extra ? '🎯 MINI-JEU' : extra2 ? '🤠 MINI-JEU' : extra3 ? '🏴‍☠️ BATEAU' : '∞', x, secret || extra || extra2 || extra3 ? y - 44 : y - 36); } // au-dessus du portail : les étoiles sont en dessous
      c.restore();
    });
    // fête sur le tableau qu'on vient de réussir : ondes, étoiles qui s'envolent, « RÉUSSI ! »
    if (cheer && n[cheer.vi]) { const [x, y] = n[cheer.vi], k = Math.min(1, cheer.k), e = 1 - Math.pow(1 - k, 3); c.save(); for (let i = 0; i < 3; i++) { const kk = Math.max(0, Math.min(1, k * 1.6 - i * .2)); c.globalAlpha = (1 - kk) * .9; c.strokeStyle = i % 2 ? '#fff' : '#ffd23f'; c.lineWidth = 6 * (1 - kk) + 1; c.beginPath(); c.arc(x, y, 30 + kk * 120, 0, TAU); c.stroke(); } c.globalAlpha = 1 - Math.max(0, (k - .7) / .3); for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + k * 3, d = 40 + e * 90; star(c, x + Math.cos(a) * d, y + Math.sin(a) * d * .7 - e * 20, 6 + (i % 3) * 3, i % 2 ? '#ffd23f' : '#fff'); } const pop = k < .25 ? k / .25 * 1.3 : 1.3 - Math.min(.3, (k - .25) * .6); c.translate(x, y - 70 - e * 20); c.scale(pop, pop); c.font = 'bold 24px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 6; c.strokeStyle = '#8a5a00'; c.strokeText('RÉUSSI !', 0, 0); c.fillStyle = '#ffd23f'; c.fillText('RÉUSSI !', 0, 0); c.restore(); }
    if (typeof selected === 'string') { const [sx, sy] = M.pos(wi, selected); c.save(); c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.globalAlpha = .6 + .4 * Math.sin(t * 6); c.beginPath(); c.arc(sx, sy, 40 + Math.sin(t * 6) * 3, 0, TAU); c.stroke(); c.restore(); }   // on est sur la passerelle, la sortie ou l'entrée
    // personnage
    if (marker) {
      let x, y; if (marker.from != null && marker.k < 1) [x, y] = M.pathPoint(wi, marker.from, marker.vi, marker.k); else [x, y] = M.pos(wi, marker.vi);
      const bob = Math.sin(t * 8) * (marker.k < 1 ? 3 : 1), dir = marker.k < 1 && M.pos(wi, marker.from)[0] > M.pos(wi, marker.vi)[0] ? -1 : 1;
      R.battleCannon(c, x, y - 30 + bob, 22, playerId, profile.cannon || 'classique', dir, 0);
    }
    c.restore();
  };
})(window.CB);
