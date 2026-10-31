// La vie sur les cartes des mondes : pleine lune, monstres du monde qui se promènent en tout petit, et une animation
// propre à chaque monde (lucioles, brume, grande roue et carrousel, pollen, braises, étoiles filantes, bulles…). Chargé après map.js.
(function (CB) {
  'use strict';
  const M = CB.Map, TAU = Math.PI * 2;
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  // Les monstres qui volent se promènent dans le ciel au-dessus de l'île ; les autres marchent sur l'herbe.
  const FLY = new Set(['bat', 'owl', 'ghost', 'crow', 'wisp', 'witch', 'eyeball', 'balloon', 'bee', 'wasp', 'firebird', 'meteor', 'dragonnet', 'tie', 'ufo', 'spectreGlace', 'poissonVolant', 'meduse', 'chienBallon', 'lapinBallon', 'girafeBallon', 'singeBallon', 'elephantBallon', 'cygneBallon', 'alienVert', 'alienViolet', 'alienBleu', 'robotGlace', 'raieManta', 'cibleAilee']);
  const MOON = { foret: true, manoir: true };

  // Ciel (avant le recadrage de l'île) : la pleine lune des mondes 1 et 2, comme sur la grande carte des mondes.
  M.sky = (c, w, wi, lw, lh, t) => {
    if (!MOON[w.id]) return;
    const mx = lw * .84, my = 96, r = 40; c.save();
    const glow = c.createRadialGradient(mx, my, r * .6, mx, my, r * 3.2); glow.addColorStop(0, 'rgba(255,237,185,.45)'); glow.addColorStop(.5, 'rgba(255,237,185,.12)'); glow.addColorStop(1, 'rgba(255,237,185,0)'); c.fillStyle = glow; c.fillRect(mx - r * 3.2, my - r * 3.2, r * 6.4, r * 6.4);
    circle(c, mx, my, r, w.id === 'manoir' ? '#ffe8c8' : '#fff3c4');
    c.globalAlpha = .18; for (const [dx, dy, rr] of [[-.3, -.25, .22], [.28, .1, .16], [-.05, .38, .12], [.1, -.45, .09]]) circle(c, mx + dx * r, my + dy * r, rr * r, '#b58c4a'); c.globalAlpha = 1;
    if (w.id === 'manoir') { c.globalAlpha = .55; for (let i = 0; i < 3; i++) { const x = mx + Math.sin(t * .15 + i * 2) * 80 - 40 + i * 30; c.fillStyle = '#2a1a45'; c.beginPath(); c.ellipse(x, my + 10 + i * 12, 46, 9, 0, 0, TAU); c.fill(); } c.globalAlpha = 1; }   // nuages d'encre qui passent devant la lune
    c.restore();
  };

  // Un monstre minuscule qui se promène : les ailés volent au-dessus de l'île, les autres marchent en se dandinant.
  const critter = (c, w, wi, n, i, t) => {
    const types = w.enemies.filter(k => CB.ENEMIES[k]); if (!types.length) return; const type = types[i % types.length], fly = FLY.has(type), seed = i * 3.7 + wi * 11, R = CB.Render;
    let x, y, dir, s;
    if (fly) { const sp = 12 + hash(seed) * 14, lane = 120 + hash(seed + 1) * 130, span = 1120; const u = ((t * sp + hash(seed + 2) * span) % span) - 80; dir = hash(seed + 3) > .5 ? 1 : -1; x = dir > 0 ? u : 960 - u; y = lane + Math.sin(t * 1.6 + seed) * 14; s = 3 + hash(seed + 4) * 1.4; }
    else { const cx = 110 + hash(seed) * 740, cy = 300 + hash(seed + 1) * 270, amp = 35 + hash(seed + 2) * 70, sp = .25 + hash(seed + 3) * .3, ph = t * sp + seed; x = cx + Math.sin(ph) * amp; y = cy + Math.sin(ph * 2) * 5; dir = Math.cos(ph) >= 0 ? 1 : -1; s = 2.8 + hash(seed + 4) * 1.2;
      for (const [nx, ny] of n) if (Math.hypot(nx - x, ny - y) < 46) return;   // jamais sous une case du chemin
      if (Math.hypot(M.HANGAR[0] - x, M.HANGAR[1] - y) < 80) return; }
    c.save(); c.translate(x, y); if (!fly) { circle(c, 0, s * 3.2, s * 2.6, 'rgba(0,0,0,.18)'); const sq = 1 + Math.sin(t * 9 + seed) * .06; c.scale(dir * (2 - sq), sq); } else c.scale(dir, 1);
    R.enemyIcon(c, type, 0, 0, s, t + seed); c.restore();
  };

  // Petites particules d'ambiance : lucioles, pollen, braises, bulles, confettis… style par monde.
  const PART = {
    foret: { n: 16, col: ['#d9ff6b', '#fff3a0'], glow: true, up: .4 },
    manoir: { n: 0 }, foire: { n: 10, col: ['#ff4f6b', '#4fc3ff', '#ffd23f', '#9cff6b'], balloon: true, up: 1.2 },
    ruche: { n: 18, col: ['#fff3a0', '#ffd23f', '#ffffff'], up: .3, sway: true },
    volcan: { n: 18, col: ['#ff8c2a', '#ffd23f', '#ff4f2a'], glow: true, up: 1.6 },
    espace: { n: 0 }, pirates: { n: 10, col: ['#ffffff'], ring: true, up: .5 }, abysses: { n: 16, col: ['#9fe0ff'], ring: true, up: 1.3 },
    cirque: { n: 16, col: ['#ff4f6b', '#ffd23f', '#4fc3ff', '#c54fff'], rect: true, up: -1 }, grotte: { n: 14, col: ['#ff8c2a', '#ffd23f'], glow: true, up: 1.2 }, galaxie: { n: 14, col: ['#c47dff', '#7fd4ff', '#fff'], star: true, up: .4 },
  };
  const particles = (c, w, wi, t) => {
    const P = PART[w.id]; if (!P || !P.n) return; c.save();
    for (let i = 0; i < P.n; i++) { const seed = i * 2.3 + wi, cx = 90 + hash(seed) * 780, life = 5 + hash(seed + 1) * 5, k = ((t * (1 + hash(seed + 2)) + hash(seed + 3) * life) % life) / life, x = cx + Math.sin(t * (.6 + hash(seed + 4)) + seed) * (P.sway ? 30 : 12), y = P.up < 0 ? 180 + k * 420 : 600 - k * 330 * P.up - hash(seed + 5) * 60, col = P.col[i % P.col.length], a = Math.sin(k * Math.PI);
      c.globalAlpha = a * (P.glow ? .9 : .7);
      if (P.balloon) { circle(c, x, y, 7, col); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 7); c.quadraticCurveTo(x + 3, y + 14, x - 2, y + 22); c.stroke(); }
      else if (P.ring) { c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 2 + hash(seed + 6) * 4, 0, TAU); c.stroke(); }
      else if (P.rect) { c.save(); c.translate(x, y); c.rotate(t * 3 + seed); c.fillStyle = col; c.fillRect(-3, -2, 6, 4); c.restore(); }
      else if (P.star) { c.fillStyle = col; c.beginPath(); for (let k2 = 0; k2 < 8; k2++) { const an = k2 * TAU / 8 + t, r = k2 % 2 ? 1.2 : 3.5; c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } c.fill(); }
      else { if (P.glow) { c.shadowColor = col; c.shadowBlur = 8; } circle(c, x, y, P.glow ? 2.2 : 2.6, col); c.shadowBlur = 0; }
    }
    c.restore();
  };

  // Animations propres à chaque monde, posées sur l'île (loin des cases du chemin et du hangar).
  const SCENE = {
    foret(c, t) { for (let i = 0; i < 3; i++) { const x = 100 + i * 330 + Math.sin(t * .3 + i) * 10, y = 560 - (i % 2) * 90; c.save(); c.globalAlpha = .35; circle(c, x, y, 26 + Math.sin(t * 2 + i) * 3, 'rgba(255,230,120,.35)'); c.restore(); } },   // halos de lucioles dans l'herbe
    manoir(c, t) { c.save(); for (let i = 0; i < 4; i++) { const x = ((t * (14 + i * 5) + i * 260) % 1180) - 110, y = 330 + i * 80; c.globalAlpha = .13 + .05 * Math.sin(t + i); c.fillStyle = '#d9c7ff'; c.beginPath(); c.ellipse(x, y, 150, 16, 0, 0, TAU); c.fill(); } c.restore();   // bancs de brume qui glissent sur l'île
      const fl = Math.sin(t * .9) > .985; if (fl) { c.save(); c.globalAlpha = .18; c.fillStyle = '#fff'; c.fillRect(-200, -200, 1400, 1100); c.restore(); } },   // éclair lointain
    foire(c, t) {
      // grande roue qui tourne, carrousel, balançoire volante, guirlandes de fanions
      ferris(c, 180, 330, 46, t); carousel(c, 560, 548, t); swing(c, 400, 300, t);
      for (let i = 0; i < 3; i++) { const x0 = 230 + i * 190, x1 = x0 + 150, y0 = 236 + i * 8; c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 + 18, x1, y0 + 4); c.stroke(); for (let k = 0; k < 7; k++) { const u = (k + .5) / 7, x = x0 + (x1 - x0) * u, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (y0 + 18) + u * u * (y0 + 4); c.fillStyle = ['#ff4f6b', '#ffd23f', '#4fc3ff', '#9cff6b'][(k + i) % 4]; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.lineTo(x + Math.sin(t * 6 + k) * 2, y + 9); c.closePath(); c.fill(); } }
    },
    ruche(c, t) { for (let i = 0; i < 5; i++) { const x = 150 + i * 170, y = 590 - (i % 2) * 30, sway = Math.sin(t * 1.4 + i) * 4; c.strokeStyle = '#5a8f2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway, y - 16, x + sway * 2, y - 30); c.stroke(); for (let k = 0; k < 6; k++) circle(c, x + sway * 2 + Math.cos(k * TAU / 6) * 7, y - 30 + Math.sin(k * TAU / 6) * 7, 4.5, ['#ffffff', '#ffd6e8', '#ffe8a0'][i % 3]); circle(c, x + sway * 2, y - 30, 3.5, '#ffb000'); } },   // grandes fleurs qui se balancent
    volcan(c, t) { for (let i = 0; i < 4; i++) { const x = 140 + i * 230, y = 560 - (i % 2) * 40; for (let k = 0; k < 4; k++) { const u = ((t * .35 + k * .25 + i * .1) % 1); c.save(); c.globalAlpha = (1 - u) * .35; circle(c, x + Math.sin(u * 6 + i) * 10, y - 30 - u * 70, 8 + u * 16, '#5a4a48'); c.restore(); } circle(c, x, y - 26, 4 + Math.sin(t * 7 + i) * 1.5, '#ffd23f'); } },   // fumée des cratères, lave qui palpite
    espace(c, t) { for (let i = 0; i < 2; i++) { const k = ((t * .45 + i * .5) % 1), x = 60 + k * 900, y = 150 + i * 60 + k * 120; c.save(); c.globalAlpha = Math.sin(k * Math.PI); const g = c.createLinearGradient(x - 70, y - 40, x, y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#fff'); c.strokeStyle = g; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 70, y - 40); c.lineTo(x, y); c.stroke(); circle(c, x, y, 3, '#fff'); c.restore(); }
      const sx = 480 + Math.cos(t * .5) * 300, sy = 420 + Math.sin(t * .5) * 120; c.save(); c.translate(sx, sy); c.rotate(t); c.fillStyle = '#c9d6e8'; c.fillRect(-4, -4, 8, 8); c.fillStyle = '#4fc3ff'; c.fillRect(-18, -2, 12, 4); c.fillRect(6, -2, 12, 4); c.restore(); },   // étoiles filantes, satellite en orbite
    pirates(c, t) { for (let i = 0; i < 6; i++) { const x = 80 + i * 150 + Math.sin(t * .5 + i) * 20, y = 300 + hash(i + 3) * 300; c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 14, y); c.quadraticCurveTo(x - 7, y - 7 - Math.sin(t * 3 + i) * 3, x, y); c.quadraticCurveTo(x + 7, y + 7, x + 14, y); c.stroke(); } },
    abysses(c, t) { for (let i = 0; i < 4; i++) { const x = 160 + i * 220, sway = Math.sin(t * 1.2 + i) * 8; c.strokeStyle = '#2f8f6a'; c.lineWidth = 3; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 7, 600); c.quadraticCurveTo(x + k * 16 + sway, 560, x + k * 8 + sway * 2, 520); c.stroke(); } } },   // algues qui ondulent
    cirque(c, t) { ferris(c, 200, 330, 40, t); for (let i = 0; i < 3; i++) { const x = 520 + i * 110, y = 560; circle(c, x, y - 40 + Math.sin(t * 2 + i) * 6, 12, ['#ff4f6b', '#4fc3ff', '#ffd23f'][i]); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 28 + Math.sin(t * 2 + i) * 6); c.lineTo(x, y); c.stroke(); } },   // grande roue et ballons attachés
    grotte(c, t) { for (let i = 0; i < 5; i++) { const x = 130 + i * 180, y = 300 + hash(i + 7) * 280, g = .6 + .4 * Math.sin(t * 3 + i); c.save(); c.globalAlpha = .35 * g; circle(c, x, y, 22, '#ff8c2a'); c.restore(); } },   // flaques de lave qui palpitent
    galaxie(c, t) { for (let i = 0; i < 3; i++) { c.save(); c.translate(480, 420); c.rotate(t * (.25 + i * .1) + i * 2); c.strokeStyle = ['#c47dff', '#7fd4ff', '#fff'][i]; c.lineWidth = 2; c.globalAlpha = .35; c.beginPath(); c.ellipse(0, 0, 380 - i * 60, 150 - i * 30, 0, 0, TAU * .7); c.stroke(); c.restore(); } },   // anneaux de poussière d'étoiles
  };
  // Grande roue : rayons, nacelles colorées qui restent droites, tout tourne doucement
  function ferris(c, x, y, r, t) {
    c.strokeStyle = '#7a4a1e'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - r * .9, y + r + 14); c.lineTo(x, y); c.lineTo(x + r * .9, y + r + 14); c.stroke();
    c.save(); c.translate(x, y); c.rotate(t * .4); c.strokeStyle = '#e8d2a0'; c.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = i * TAU / 10; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); } c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, r * .55, 0, TAU); c.stroke(); c.restore();
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + t * .4, gx = x + Math.cos(a) * r, gy = y + Math.sin(a) * r; c.fillStyle = ['#ff4f6b', '#ffd23f', '#4fc3ff', '#9cff6b', '#c54fff'][i % 5]; c.beginPath(); c.roundRect(gx - 6, gy - 2, 12, 10, 3); c.fill(); }
    circle(c, x, y, 5, '#ffd23f');
  }
  // Carrousel : toit conique rayé, plateau, chevaux (petits points) qui montent et descendent en tournant
  function carousel(c, x, y, t) {
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 6, 40, 12, 0, 0, TAU); c.fill(); c.fillStyle = '#c0392b'; c.beginPath(); c.ellipse(x, y, 38, 11, 0, 0, TAU); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(x, y - 2, 34, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#e8d2a0'; c.fillRect(x - 2, y - 44, 4, 44); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + t * 1.2, hx = x + Math.cos(a) * 28, hy = y - 8 + Math.sin(a) * 7 + Math.sin(t * 4 + i) * 3; c.fillStyle = '#fff'; c.fillRect(hx - .7, hy - 14, 1.4, 14); circle(c, hx, hy, 4, ['#ff4f6b', '#4fc3ff', '#9cff6b', '#c54fff', '#ff8c2a', '#fff'][i]); }
    for (let i = -4; i < 4; i++) { c.fillStyle = i % 2 ? '#e8403c' : '#fff3e0'; c.beginPath(); c.moveTo(x, y - 60); c.lineTo(x + i * 10, y - 34); c.lineTo(x + (i + 1) * 10, y - 34); c.closePath(); c.fill(); } c.fillStyle = '#e8403c'; c.beginPath(); c.ellipse(x, y - 34, 40, 8, 0, 0, TAU); c.fill(); circle(c, x, y - 62, 3, '#ffd23f');
  }
  // Balançoire volante : un mât, des sièges au bout de chaînes qui tournent et s'écartent
  function swing(c, x, y, t) {
    c.fillStyle = '#7a4a1e'; c.fillRect(x - 3, y - 50, 6, 70); c.fillStyle = '#4fc3ff'; c.beginPath(); c.ellipse(x, y - 50, 26, 7, 0, 0, TAU); c.fill(); circle(c, x, y - 56, 4, '#ffd23f');
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + t * 1.5, sx = x + Math.cos(a) * 34, sy = y - 20 + Math.sin(a) * 9; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + Math.cos(a) * 22, y - 50 + Math.sin(a) * 5); c.lineTo(sx, sy); c.stroke(); c.fillStyle = ['#ff4f6b', '#ffd23f', '#9cff6b'][i % 3]; c.beginPath(); c.roundRect(sx - 4, sy - 2, 8, 6, 2); c.fill(); }
  }

  // Appelé par M.draw juste après le décor de l'île (origine : coin de l'île 960×640).
  M.life = (c, w, wi, n, t) => {
    c.save(); if (SCENE[w.id]) SCENE[w.id](c, t); particles(c, w, wi, t); c.restore();
    c.save(); for (let i = 0; i < 10; i++) critter(c, w, wi, n, i, t); c.restore();
  };
})(window.CB);
