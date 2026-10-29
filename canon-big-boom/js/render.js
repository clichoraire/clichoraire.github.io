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
  const MOUNTAINS = { foret: ['#172f4b', '#214858', '#315c65'], manoir: ['#1a1233', '#2a1e4d', '#3c2d66'], foire: ['#2a4f8a', '#3f74b5', '#6aa3d6'], ruche: ['#b86a2a', '#d9913d', '#efb860'], volcan: ['#2a0b0b', '#4a1410', '#7a2a18'] };
  R.SCENE_KEYS = ['foret', 'manoir', 'foire', 'ruche', 'volcan', 'espace'];
  // Dessine le décor sur toute la zone w×h : ciel, étoiles, lune (ou soleil), montagnes, éléments du monde, sol en colline.
  R.background = (c, w, h, world, t) => {
    const scene = world.scene || world.id, sky = world.sky, day = scene === 'foire' || scene === 'ruche';
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
    const cols = MOUNTAINS[scene] || MOUNTAINS.foret;
    for (let l = 0; l < 3; l++) { const p = [[0, h]]; for (let x = 0; x <= w + 60; x += 60) p.push([x, h * (.48 + l * .12) - Math.sin(x / w * 12 + l * 3) * h * .07]); p.push([w, h]); poly(c, p, cols[l]); }
    if (scene === 'foret') for (let i = 0; i < 28; i++) tree(c, i * w / 27, h * .82, 40 + i % 5 * 14, i % 2 ? '#245448' : '#1c433f');
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
  const E = {
    bat(c, e, t) { const flap = Math.sin(t * 13 + e.phase) * 1.3, col = e.color; c.fillStyle = col; c.strokeStyle = shade(col, .45); c.lineWidth = .16; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * .5, 0); c.quadraticCurveTo(s * 2, -2.4 + flap, s * 3.2, -.6 + flap); c.lineTo(s * 2.5, .3); c.quadraticCurveTo(s * 1.9, -.25, s * 1.6, .7); c.quadraticCurveTo(s * .9, .25, s * .5, .7); c.closePath(); c.fill(); c.stroke(); } ellipse(c, 0, 0, .8, 1.1, shade(col, .6)); for (const s of [-1, 1]) { c.fillStyle = shade(col, .6); c.beginPath(); c.moveTo(s * .2, -.7); c.lineTo(s * .75, -1.65); c.lineTo(s * .8, -.3); c.fill(); ellipse(c, s * .3, -.2, .23, .14, e.elite ? '#fff' : '#ffbd55', -s * .3); } c.fillStyle = '#fff6db'; for (const x of [-.22, .22]) { c.beginPath(); c.moveTo(x - .1, .4); c.lineTo(x, .7); c.lineTo(x + .1, .4); c.fill(); } },
    owl(c, e, t) { const flap = Math.sin(t * 9 + e.phase) * .9, col = e.color; for (const s of [-1, 1]) { ellipse(c, s * 1.9, -.2 + flap * .5, 1.3, .6, shade(col, .8), s * (.6 - flap * .3)); } ellipse(c, 0, 0, 1.4, 1.7, col); ellipse(c, 0, .5, .9, 1, shade(col, 1.3)); for (const s of [-1, 1]) { c.fillStyle = col; c.beginPath(); c.moveTo(s * .6, -1.3); c.lineTo(s * 1.3, -2.4); c.lineTo(s * 1.4, -1); c.fill(); circle(c, s * .55, -.6, .5, '#fff'); circle(c, s * .55, -.6, .28, e.elite ? '#e23b3b' : '#222'); } c.fillStyle = '#ffb000'; c.beginPath(); c.moveTo(-.25, -.2); c.lineTo(.25, -.2); c.lineTo(0, .35); c.fill(); c.strokeStyle = shade(col, .5); c.lineWidth = .14; c.beginPath(); c.moveTo(-.9, -1.05); c.lineTo(-.3, -1.25); c.moveTo(.9, -1.05); c.lineTo(.3, -1.25); c.stroke(); },
    ghost(c, e, t) { c.globalAlpha *= .45 + .55 * Math.abs(Math.sin(e.age * 1.5 + e.phase)); c.fillStyle = e.color; c.beginPath(); c.arc(0, -.4, 1.4, Math.PI, 0); for (let i = 0; i <= 4; i++) c.lineTo(1.4 - i * .7, 1.6 + (i % 2 ? -.5 : 0) + Math.sin(t * 6 + i) * .15); c.closePath(); c.fill(); for (const s of [-1, 1]) { ellipse(c, s * .5, -.5, .3, .42, '#1b1030'); circle(c, s * .5 - .08, -.62, .1, '#fff'); } ellipse(c, 0, .35, .3, .2, '#1b1030'); },
    skull(c, e, t) { if (e.elite) for (let i = 0; i < 5; i++) ellipse(c, (i - 2) * .5, -1.6 - hash(i + t * 10 | 0) * .8, .3, .6, i % 2 ? '#ff8c2a' : '#ffd23f'); circle(c, 0, -.2, 1.3, e.color); c.fillStyle = e.color; c.fillRect(-.8, .6, 1.6, .9); for (const s of [-1, 1]) ellipse(c, s * .5, -.3, .4, .45, '#1b1030'); c.fillStyle = '#1b1030'; c.beginPath(); c.moveTo(-.15, .35); c.lineTo(.15, .35); c.lineTo(0, .6); c.fill(); for (let i = -1; i <= 1; i++) c.fillRect(i * .4 - .08, .9, .16, .5); },
    balloon(c, e, t) { c.strokeStyle = '#eee'; c.lineWidth = .1; c.beginPath(); c.moveTo(0, 1.7); c.quadraticCurveTo(.5, 2.6, 0, 3.4); c.stroke(); ellipse(c, 0, 0, 1.3, 1.65, e.color); ellipse(c, -.5, -.6, .35, .55, 'rgba(255,255,255,.5)', .5); c.fillStyle = shade(e.color, .8); c.beginPath(); c.moveTo(-.25, 1.6); c.lineTo(.25, 1.6); c.lineTo(0, 1.95); c.fill(); for (const s of [-1, 1]) { circle(c, s * .45, -.2, .3, '#fff'); circle(c, s * .45 + .05, -.15, .15, '#1b1030'); c.strokeStyle = '#1b1030'; c.lineWidth = .14; c.beginPath(); c.moveTo(s * .2, -.75); c.lineTo(s * .75, -.55); c.stroke(); } c.strokeStyle = '#1b1030'; c.beginPath(); c.arc(0, .7, .4, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); },
    pinata(c, e, t) { const sw = Math.sin(t * 4 + e.phase) * .15; c.save(); c.rotate(sw); c.fillStyle = e.color; c.beginPath(); c.roundRect(-1.6, -.9, 3.2, 1.8, .5); c.fill(); for (let i = 0; i < 5; i++) { c.fillStyle = ['#ffd23f', '#ff4f6b', '#9cff6b', '#c54fff', '#ff8c2a'][i]; c.fillRect(-1.6 + i * .64, -.9, .64, 1.8); } ellipse(c, 1.9, -.9, .7, .6, e.color); for (const s of [-1, 1]) c.fillRect(1.6 + s * .3 - .12, -1.9, .24, .6); circle(c, 2.1, -1, .12, '#1b1030'); for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 2; k++) c.fillRect(i * .9 - .15 - k * .5 * i, .9, .3, .6); c.restore(); },
    bee(c, e, t) { const flap = Math.abs(Math.sin(t * 30 + e.phase)); for (const s of [-1, 1]) ellipse(c, s * .7, -.8, .75, .35 + flap * .3, 'rgba(255,255,255,.75)', s * .4); ellipse(c, 0, 0, 1.3, .85, e.color); c.fillStyle = '#222'; for (const x of [-.5, .2]) c.fillRect(x, -.8, .35, 1.6); c.beginPath(); c.moveTo(1.2, 0); c.lineTo(1.8, .1); c.lineTo(1.2, .25); c.fill(); circle(c, -.9, -.2, .22, '#222'); circle(c, -.95, -.25, .08, '#fff'); c.strokeStyle = '#222'; c.lineWidth = .1; c.beginPath(); c.moveTo(-1, -.6); c.lineTo(-1.4, -1.2); c.moveTo(-.7, -.7); c.lineTo(-.9, -1.3); c.stroke(); },
    wasp(c, e, t) { const flap = Math.abs(Math.sin(t * 30 + e.phase)); for (const s of [-1, 1]) ellipse(c, s * .8, -.7, .9, .3 + flap * .3, 'rgba(255,255,255,.65)', s * .5); ellipse(c, .6, .1, 1.2, .55, e.color); ellipse(c, -.7, -.1, .7, .55, shade(e.color, .9)); c.fillStyle = '#222'; for (const x of [.1, .7]) c.fillRect(x, -.5, .3, 1.1); c.beginPath(); c.moveTo(1.6, .1); c.lineTo(2.3, .2); c.lineTo(1.6, .4); c.fill(); circle(c, -1, -.3, .22, '#222'); circle(c, -1.05, -.35, .08, '#fff'); },
    firebird(c, e, t) { const flap = Math.sin(t * 12 + e.phase); for (let i = 0; i < 4; i++) ellipse(c, 1.2 + i * .6, (i % 2 ? .2 : -.2), .5 - i * .08, .35, i % 2 ? '#ffd23f' : e.color); for (const s of [-1, 1]) { c.fillStyle = e.color; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 1.2, -2 * flap - .5, s * 2.6, -.4 - flap); c.lineTo(s * 1.2, .5); c.fill(); } ellipse(c, 0, 0, 1.1, .7, shade(e.color, 1.15)); circle(c, -.7, -.2, .45, shade(e.color, 1.3)); circle(c, -.85, -.3, .13, '#1b1030'); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(-1.1, -.2); c.lineTo(-1.6, 0); c.lineTo(-1.1, .1); c.fill(); for (let i = 0; i < 3; i++) ellipse(c, -.2 + i * .3, -.7 - i * .3, .25, .4, i % 2 ? '#ffd23f' : '#ff8c2a'); },
    meteor(c, e, t) { for (let i = 0; i < 6; i++) { c.globalAlpha = .7 - i * .1; ellipse(c, (i + 1) * .5 * (e.x > 0 ? 1 : -1), -(i + 1) * .8, 1 - i * .12, 1.1 - i * .12, i % 2 ? '#ff8c2a' : '#ffd23f'); } c.globalAlpha = 1; c.fillStyle = e.color; c.beginPath(); for (let i = 0; i < 9; i++) { const a = i * TAU / 9, r = 1.1 + hash(i + 3) * .4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); circle(c, -.3, -.2, .3, shade(e.color, .7)); circle(c, .4, .3, .22, shade(e.color, .7)); },
    tie(c, e, t) { c.fillStyle = e.color; c.strokeStyle = '#aab7cc'; c.lineWidth = .12; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 1.4, -1.9); c.lineTo(s * 2.1, -1); c.lineTo(s * 2.1, 1); c.lineTo(s * 1.4, 1.9); c.lineTo(s * 1.1, 1); c.lineTo(s * 1.1, -1); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(s * 1.1, 0); c.lineTo(s * .7, 0); c.stroke(); } circle(c, 0, 0, .85, e.color); c.stroke(); circle(c, 0, 0, .45, e.elite ? '#ff3a3a' : '#1b2436'); c.strokeStyle = '#aab7cc'; c.beginPath(); c.moveTo(-.45, 0); c.lineTo(.45, 0); c.moveTo(0, -.45); c.lineTo(0, .45); c.stroke(); },
    ufo(c, e, t) { ellipse(c, 0, .2, 2.2, .7, shade(e.color, .8)); ellipse(c, 0, -.1, 2, .55, e.color); for (let i = -2; i <= 2; i++) circle(c, i * .8, .35, .18, Math.sin(t * 8 + i) > 0 ? '#fff' : '#ff4f6b'); c.fillStyle = 'rgba(180,230,255,.85)'; c.beginPath(); c.arc(0, -.2, 1, Math.PI, 0); c.fill(); circle(c, -.1, -.5, .3, '#6fd0ff'); circle(c, -.2, -.6, .1, '#fff'); },
    bolt(c, e, t) { c.globalAlpha = .9; ellipse(c, 0, 0, .6, 1.2, '#ff3a3a'); ellipse(c, 0, 0, .3, .7, '#fff'); },
  };
  const BOSS = {
    batking(c, e, t) { c.save(); c.scale(1.6, 1.6); E.bat(c, e, t); c.restore(); crown(c, 0, -2.2, 1.2); },
    bigghost(c, e, t) { c.save(); c.scale(1.9, 1.9); c.globalAlpha = .9; E.ghost(c, Object.assign({}, e, { age: 2 }), t); c.restore(); crown(c, 0, -3.6, 1.4); },
    clown(c, e, t) { c.save(); c.scale(1.7, 1.7); E.balloon(c, e, t); c.restore(); circle(c, 0, .2, .5, '#ff2a2a'); for (const s of [-1, 1]) ellipse(c, s * 1.6, -.5, .5, .7, '#ff8c2a'); c.fillStyle = '#4fc3ff'; c.beginPath(); c.moveTo(-1.2, -2.6); c.lineTo(1.2, -2.6); c.lineTo(0, -4.2); c.fill(); circle(c, 0, -4.2, .35, '#ffd23f'); },
    queen(c, e, t) { c.save(); c.scale(1.9, 1.9); E.wasp(c, e, t); c.restore(); crown(c, -1.9, -1.4, .9); },
    dragon(c, e, t) { const flap = Math.sin(t * 6); for (const s of [-1, 1]) { c.fillStyle = shade(e.color, .8); c.beginPath(); c.moveTo(s * .8, 0); c.quadraticCurveTo(s * 3, -3 * flap - 1, s * 5, -1 - flap); c.lineTo(s * 4.2, .5); c.lineTo(s * 3, .2); c.lineTo(s * 1.5, 1); c.fill(); } ellipse(c, 0, .6, 1.9, 1.5, e.color); ellipse(c, 0, 1, 1.1, 1, '#ffd23f'); ellipse(c, 0, -1.6, 1.4, 1.1, e.color); for (const s of [-1, 1]) { c.fillStyle = '#f2f2f2'; c.beginPath(); c.moveTo(s * .7, -2.4); c.lineTo(s * 1.4, -3.8); c.lineTo(s * 1.2, -2.2); c.fill(); circle(c, s * .55, -1.8, .3, '#ffd23f'); circle(c, s * .55, -1.8, .14, '#1b1030'); } c.fillStyle = '#f2f2f2'; for (const x of [-.6, -.2, .2, .6]) { c.beginPath(); c.moveTo(x - .12, -.9); c.lineTo(x + .12, -.9); c.lineTo(x, -.5); c.fill(); } if (Math.sin(t * 2) > .4) for (let i = 0; i < 4; i++) ellipse(c, 0, -.3 + i * .6, .5 + i * .2, .4, i % 2 ? '#ff8c2a' : '#ffd23f'); },
    destroyer(c, e, t) { c.fillStyle = e.color; c.strokeStyle = '#aab7cc'; c.lineWidth = .12; c.beginPath(); c.moveTo(0, -2.6); c.lineTo(5.2, 2.2); c.lineTo(-5.2, 2.2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = shade(e.color, 1.2); c.beginPath(); c.moveTo(0, -1); c.lineTo(2.6, 1.6); c.lineTo(-2.6, 1.6); c.closePath(); c.fill(); c.fillStyle = shade(e.color, .7); c.fillRect(-1, 1.2, 2, 1.2); circle(c, 0, 1, .5, '#1b2436'); for (let i = -3; i <= 3; i++) circle(c, i * 1.2, 1.9, .14, Math.sin(t * 5 + i) > 0 ? '#7fd4ff' : '#2a3a55'); for (const s of [-1, 1]) circle(c, s * 3.8, 2.6, .5, '#7fd4ff'); },
  };
  function crown(c, x, y, s) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x - s, y + s * .5); c.lineTo(x - s, y - s * .4); c.lineTo(x - s * .5, y); c.lineTo(x, y - s * .7); c.lineTo(x + s * .5, y); c.lineTo(x + s, y - s * .4); c.lineTo(x + s, y + s * .5); c.closePath(); c.fill(); circle(c, x, y + s * .2, s * .18, '#e23b3b'); }
  R.enemy = (c, e, t) => {
    const p = P(e); c.save(); c.translate(p.x, p.y); const es = e.boss ? 1.3 : e.size; c.scale(p.scale * es, p.scale * es);
    if (e.frozen > 0) { c.globalAlpha = .9; }
    if (e.elite) { c.shadowColor = e.color; c.shadowBlur = 18; }
    const drawer = e.boss ? BOSS[e.def === CB.BOSSES.batking ? 'batking' : Object.keys(CB.BOSSES).find(k => CB.BOSSES[k] === e.def)] : E[e.type] || E.bat; drawer(c, e, t);
    // Touché : on redessine la même silhouette en mode lighter pour l'éclaircir (jamais de carré autour de l'ennemi).
    if (e.flash > 0) { e.flash -= 1 / 60; c.shadowBlur = 0; c.globalCompositeOperation = 'lighter'; c.globalAlpha = .85; drawer(c, e, t); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    if (e.frozen > 0) { c.globalAlpha = .55; circle(c, 0, 0, 1.6 * (e.boss ? 2 : 1), '#a9e9ff'); }
    c.restore();
    if (e.boss) { const w = 300, x = CB.VIEW.cx - w / 2, y = 66; c.fillStyle = 'rgba(8,20,45,.75)'; c.beginPath(); c.roundRect(x - 4, y - 4, w + 8, 26, 8); c.fill(); c.fillStyle = '#5a1420'; c.fillRect(x, y, w, 18); c.fillStyle = '#e23b3b'; c.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 18); c.fillStyle = '#fff'; c.font = 'bold 13px "Arial Rounded MT Bold", Arial'; c.textAlign = 'center'; c.fillText(e.name.toUpperCase(), 480, y + 14); }
    else if (e.elite || e.maxHp > 2.5) { const w = 2.6 * p.scale * e.size, x = p.x - w / 2, y = p.y - 2.6 * p.scale * e.size; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x, y, w, 3); c.fillStyle = e.elite ? '#ffd23f' : '#7dff9a'; c.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 3); }
    if (e.elite) { c.fillStyle = '#ffd23f'; c.font = 'bold ' + Math.max(9, p.scale * 1.1) + 'px Arial'; c.textAlign = 'center'; c.fillText('★ ' + e.name.toUpperCase() + ' ★', p.x, p.y - 3 * p.scale * e.size); }
  };

  // ---------- Canon et personnage ----------
  R.cannon = (c, x, y, s, skin, angle = 0, recoil = 0, playerId = null, t = 0) => {
    const k = CB.CANNONS[skin] || CB.CANNONS.classique;
    c.save(); c.translate(x, y); c.scale(s, s);
    ellipse(c, 0, 8, 70, 15, 'rgba(0,0,0,.35)');
    c.fillStyle = k.base; c.fillRect(-38, -16, 76, 16); c.fillStyle = shade(k.base, 1.25); c.fillRect(-45, -18, 90, 8); c.fillStyle = shade(k.base, .8); c.fillRect(-40, -4, 80, 4);
    for (const side of [-1, 1]) { circle(c, side * 44, -5, 16, shade(k.body, .8)); c.strokeStyle = k.trim; c.lineWidth = 4; c.stroke(); circle(c, side * 44, -5, 5, k.trim); }
    if (k.flag) { c.strokeStyle = '#5c3a21'; c.lineWidth = 3; c.beginPath(); c.moveTo(-52, -18); c.lineTo(-52, -90); c.stroke(); c.fillStyle = '#111'; c.beginPath(); c.moveTo(-52, -90); c.lineTo(-20 + Math.sin(t * 4) * 3, -82); c.lineTo(-52, -66); c.fill(); circle(c, -42, -79, 4, '#fff'); }
    // personnage debout à côté du canon, bien visible (le fût est au centre)
    if (playerId) { c.save(); c.translate(-46, -30); const fam = CB.FAMILIES[CB.playerById(playerId).family].color; c.fillStyle = fam; c.beginPath(); c.roundRect(-15, -4, 30, 30, 8); c.fill(); c.fillStyle = shade(fam, .75); c.beginPath(); c.roundRect(-24, -2, 9, 22, 4); c.fill(); c.beginPath(); c.roundRect(12, -14 - Math.sin(t * 6) * 3, 9, 22, 4); c.fill(); c.fillStyle = '#2b2b2b'; c.fillRect(-11, 24, 9, 8); c.fillRect(2, 24, 9, 8); if (!window.FamilyHeads?.draw(c, playerId, 'front', -26, -58, 52, 56)) { circle(c, 0, -30, 20, '#f3d2b4'); } c.restore(); }
    c.fillStyle = k.body; c.beginPath(); c.roundRect(-27, -40, 54, 32, 9); c.fill(); c.strokeStyle = k.trim; c.lineWidth = 3; c.stroke();
    if (k.stripes) { c.fillStyle = k.trim; for (let i = -2; i <= 2; i += 2) c.fillRect(i * 9 - 3, -40, 6, 32); }
    const barrels = k.twin ? [-11, 11] : [0];
    for (const bx of barrels) {
      c.save(); c.translate(bx, -28 + recoil * 7); c.rotate(angle); const bw = k.twin ? 14 : 22;
      const g = c.createLinearGradient(-bw, 0, bw, 0); g.addColorStop(0, shade(k.body, .7)); g.addColorStop(.5, shade(k.body, 1.5)); g.addColorStop(1, shade(k.body, .65)); c.fillStyle = g; c.beginPath(); c.roundRect(-bw, -72, bw * 2, 78, bw * .6); c.fill();
      c.fillStyle = k.trim; c.fillRect(-bw - 3, -58, bw * 2 + 6, 8); c.fillRect(-bw - 2, -20, bw * 2 + 4, 5);
      if (k.glow) { c.shadowColor = k.glow; c.shadowBlur = 16; }
      ellipse(c, 0, -72, bw + 1, bw * .5, '#0b1e32'); c.strokeStyle = k.glow || k.trim; c.lineWidth = 4; c.stroke(); c.restore();
    }
    c.restore();
  };
  R.cannonAngle = (aim, cx = 480) => Math.atan2(aim.x - cx, 420 - aim.y + 300) * .7;
  R.fireFlash = (c, x, y, s, strength) => { if (strength <= 0) return; c.save(); c.globalAlpha = Math.min(1, strength); const g = c.createRadialGradient(x, y, 2, x, y, 40 * s); g.addColorStop(0, '#fff'); g.addColorStop(.3, '#ffd23f'); g.addColorStop(1, 'rgba(255,120,30,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 40 * s, 0, TAU); c.fill(); c.restore(); };

  // ---------- Boulets ----------
  const BALL = {
    fer(c, r) { const g = c.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, '#9aa3b2'); g.addColorStop(1, '#2a2f3a'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); },
    feu(c, r, t) { const g = c.createRadialGradient(0, 0, r * .1, 0, 0, r * 1.3); g.addColorStop(0, '#fff6a0'); g.addColorStop(.5, '#ff8c2a'); g.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.3, 0, TAU); c.fill(); },
    etoile(c, r, t) { c.save(); c.rotate(t * 6); star(c, 0, 0, r * 1.5, '#fff3a0'); star(c, 0, 0, r * .8, '#ffd23f'); c.restore(); },
    bowling(c, r) { const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, '#6a4fd8'); g.addColorStop(1, '#1b1040'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); for (const [x, y] of [[-.25, -.3], [.1, -.4], [-.05, 0]]) circle(c, x * r, y * r, r * .13, '#0a0820'); },
    neige(c, r) { circle(c, 0, 0, r, '#f4fbff'); circle(c, -r * .3, -r * .3, r * .35, '#fff'); c.fillStyle = '#cfe6f5'; for (let i = 0; i < 5; i++) circle(c, Math.cos(i * 1.3) * r * .6, Math.sin(i * 1.3) * r * .6, r * .1, '#cfe6f5'); },
    soccer(c, r) { circle(c, 0, 0, r, '#fff'); c.fillStyle = '#1b1b1b'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); for (let k = 0; k < 5; k++) { const b = k * TAU / 5; c.lineTo(Math.cos(a) * r * .55 + Math.cos(b) * r * .22, Math.sin(a) * r * .55 + Math.sin(b) * r * .22); } c.fill(); } c.beginPath(); for (let k = 0; k < 5; k++) { const b = k * TAU / 5; c.lineTo(Math.cos(b) * r * .22, Math.sin(b) * r * .22); } c.fill(); },
    disco(c, r, t) { circle(c, 0, 0, r, '#c0c8ff'); c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = -2; i <= 2; i++) for (let k = -2; k <= 2; k++) if (i * i + k * k < 6 && (i + k + Math.floor(t * 8)) % 2) c.fillRect(i * r * .38 - r * .15, k * r * .38 - r * .15, r * .3, r * .3); },
    citrouille(c, r) { ellipse(c, 0, 0, r * 1.1, r, '#ff8c2a'); c.strokeStyle = '#d96a10'; c.lineWidth = r * .1; for (const x of [-.5, 0, .5]) { c.beginPath(); c.ellipse(x * r, 0, r * .35, r, 0, 0, TAU); c.stroke(); } c.fillStyle = '#2a7a2a'; c.fillRect(-r * .12, -r * 1.2, r * .24, r * .35); c.fillStyle = '#1b1030'; c.beginPath(); c.moveTo(-r * .5, -r * .3); c.lineTo(-r * .2, -r * .1); c.lineTo(-r * .55, -r * .05); c.fill(); c.beginPath(); c.moveTo(r * .5, -r * .3); c.lineTo(r * .2, -r * .1); c.lineTo(r * .55, -r * .05); c.fill(); c.beginPath(); c.moveTo(-r * .5, r * .3); c.lineTo(r * .5, r * .3); c.lineTo(0, r * .6); c.fill(); },
    planete(c, r, t) { circle(c, 0, 0, r, '#6fd0ff'); ellipse(c, -r * .2, r * .1, r * .4, r * .25, '#4caf50'); ellipse(c, r * .35, -r * .3, r * .25, r * .2, '#4caf50'); c.strokeStyle = '#ffe9a0'; c.lineWidth = r * .18; c.beginPath(); c.ellipse(0, 0, r * 1.7, r * .45, -.4, 0, TAU); c.stroke(); },
  };
  const TRAIL = {
    smoke(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .25 * i / pts.length; circle(c, p.x, p.y, r * (.5 + .5 * i / pts.length), '#c9d0dc'); }); },
    flames(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .8 * i / pts.length; circle(c, p.x, p.y, r * (.3 + .9 * i / pts.length), i % 2 ? '#ff8c2a' : '#ffd23f'); }); },
    stars(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .9 * i / pts.length; star(c, p.x + Math.sin(i * 5) * r, p.y + Math.cos(i * 3) * r, r * .6, ['#ff4f6b', '#ffd23f', '#4fc3ff', '#9cff6b', '#c54fff'][i % 5]); }); },
    snow(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .7 * i / pts.length; for (let k = 0; k < 3; k++) circle(c, p.x + Math.sin(i * 7 + k * 2) * r, p.y + Math.cos(i * 4 + k) * r, r * .22, '#fff'); }); },
    sparkle(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .9 * i / pts.length; star(c, p.x + Math.sin(i * 9) * r * 1.2, p.y + Math.cos(i * 6) * r * 1.2, r * .45, i % 2 ? '#fff' : '#ffd23f', 4); }); },
    leaves(c, pts, r) { pts.forEach((p, i) => { c.globalAlpha = .8 * i / pts.length; ellipse(c, p.x + Math.sin(i * 5) * r, p.y + Math.cos(i * 3) * r, r * .5, r * .25, i % 2 ? '#ff8c2a' : '#c0392b', i); }); },
    rainbow(c, pts, r) { if (pts.length < 2) return; const cols = ['#ff4f6b', '#ff8c2a', '#ffd23f', '#9cff6b', '#4fc3ff', '#c54fff']; cols.forEach((col, k) => { c.globalAlpha = .55; c.strokeStyle = col; c.lineWidth = r * .3; c.beginPath(); pts.forEach((p, i) => { const y = p.y + (k - 2.5) * r * .3; i ? c.lineTo(p.x, y) : c.moveTo(p.x, y); }); c.stroke(); }); },
    none() { },
  };
  R.ball = (c, b, skin, t) => {
    const k = CB.BALLS[skin] || CB.BALLS.fer, p = P(b), r = Math.max(3, p.scale * 1.2 * b.size);
    const pts = b.trail.map(q => { const pp = P(q); return { x: pp.x, y: pp.y }; });
    c.save(); (TRAIL[b.effect === 'feu' ? 'flames' : b.effect === 'neige' ? 'snow' : b.effect === 'etoiles' ? 'stars' : k.trail] || TRAIL.none)(c, pts, r); c.globalAlpha = 1;
    c.translate(p.x, p.y);
    if (b.effect === 'bowling') BALL.bowling(c, r); else if (b.effect === 'etoiles') BALL.etoile(c, r, t); else if (b.effect === 'neige') BALL.neige(c, r); else if (b.effect === 'feu') BALL.feu(c, r, t); else (BALL[skin] || BALL.fer)(c, r, t);
    if (b.effect === 'eclair') { c.strokeStyle = '#7fd4ff'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 30 + i * 2) * r * 2.2, Math.sin(t * 30 + i * 2) * r * 2.2); c.stroke(); } }
    c.restore();
  };

  R.ballIcon = (c, skin, x, y, r, t = 0) => { c.save(); c.translate(x, y); (BALL[skin] || BALL.fer)(c, r, t); c.restore(); };
  R.enemyIcon = (c, type, x, y, s, t = 0, color) => { const def = CB.ENEMIES[type] || CB.ENEMIES.bat; c.save(); c.translate(x, y); c.scale(s, s); (E[type] || E.bat)(c, { color: color || def.color, phase: 0, age: t, x: 0 }, t); c.restore(); };
  R.bossIcon = (c, key, x, y, s, t = 0) => { const def = CB.BOSSES[key]; if (!def) return; c.save(); c.translate(x, y); c.scale(s, s); BOSS[key](c, { color: def.color, phase: 0, age: t, x: 0, def }, t); c.restore(); };

  // ---------- Effets ----------
  R.burst = (c, b) => {
    const p = P(b), k = b.age / .7; c.save(); c.translate(p.x, p.y);
    if (b.kind === 'bolt') { const q = P(b.to); c.translate(-p.x, -p.y); c.strokeStyle = '#7fd4ff'; c.lineWidth = 3 * (1 - k); c.globalAlpha = 1 - k; c.beginPath(); c.moveTo(p.x, p.y); const mx = (p.x + q.x) / 2 + Math.sin(b.age * 60) * 12, my = (p.y + q.y) / 2 + Math.cos(b.age * 50) * 12; c.lineTo(mx, my); c.lineTo(q.x, q.y); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke(); }
    else if (b.kind === 'fire' || b.kind === 'ice') { c.globalAlpha = 1 - k; c.strokeStyle = b.kind === 'fire' ? '#ff8c2a' : '#a9e9ff'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, p.scale * b.size * k, 0, TAU); c.stroke(); c.globalAlpha = (1 - k) * .4; circle(c, 0, 0, p.scale * b.size * k, b.kind === 'fire' ? '#ffd23f' : '#d6f4ff'); }
    else if (b.kind === 'hit' || b.kind === 'crit') { c.globalAlpha = 1 - k; const n = b.kind === 'crit' ? 8 : 5, col = b.kind === 'crit' ? '#ffd23f' : '#fff'; for (let i = 0; i < n; i++) { const a = i * TAU / n, d = p.scale * (b.kind === 'crit' ? 3 : 1.8) * k; circle(c, Math.cos(a) * d, Math.sin(a) * d, p.scale * .3 * (1 - k) + 1, col); } }
    else { c.globalAlpha = 1 - k; const n = b.kind === 'boom' ? 18 : 9, R0 = p.scale * (b.kind === 'boom' ? 9 : 3.4) * (b.size || 1); for (let i = 0; i < n; i++) { const a = i * TAU / n + hash(i) * .5, d = R0 * (.3 + .7 * k); const col = i % 3 === 0 ? '#ffd23f' : i % 3 === 1 ? '#fff' : b.color || '#fff'; circle(c, Math.cos(a) * d, Math.sin(a) * d, Math.max(1.5, p.scale * .5 * (1 - k)), col); } if (b.kind === 'boom') { c.globalAlpha = (1 - k) * .6; circle(c, 0, 0, R0 * k, '#ffd23f'); } }
    c.restore();
  };
  R.text = (c, tx) => { const p = P({ x: tx.x, y: tx.y + tx.age * 4, z: tx.z }); c.save(); c.globalAlpha = Math.max(0, 1 - tx.age); c.font = 'bold ' + Math.max(12, p.scale * 1.4) + 'px "Arial Rounded MT Bold", "Arial Black", Arial'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(tx.text, p.x, p.y); c.fillStyle = tx.color || '#fff'; c.fillText(tx.text, p.x, p.y); c.restore(); };
  R.reticle = (c, aim, locked, t) => { c.save(); c.translate(aim.x, aim.y); c.strokeStyle = locked ? '#ffd23f' : 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 4; c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.stroke(); c.lineWidth = 2; for (const [a, b] of [[-40, -30], [30, 40]]) { c.beginPath(); c.moveTo(a, 0); c.lineTo(b, 0); c.stroke(); c.beginPath(); c.moveTo(0, a); c.lineTo(0, b); c.stroke(); } if (locked) { c.rotate(t * 2); c.strokeStyle = '#ffd23f'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(0, 0, 34, i * Math.PI / 2, i * Math.PI / 2 + .6); c.stroke(); } } c.restore(); };

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
  R.battleCannon = (c, x, y, s, playerId, skin, side = 0, recoil = 0, rot = 0) => {
    const k = CB.CANNONS[skin] || CB.CANNONS.classique, pl = CB.playerById(playerId), col = pl ? CB.FAMILIES[pl.family].color : '#f5a623';
    const face = (view, fx, fy, fw, fh) => { if (!(window.FamilyHeads && window.FamilyHeads.draw(c, playerId, view, fx, fy, fw, fh))) ellipse(c, fx + fw / 2, fy + fh / 2, fw * .35, fh * .4, '#f1bd92'); };
    c.save(); c.translate(x, y); c.scale(s * (side || 1), s); ellipse(c, 0, .06, side ? 1.12 : .83, .16, '#04132188');
    const metal = c.createLinearGradient(-.4, 0, .4, 0); metal.addColorStop(0, '#12374e'); metal.addColorStop(.35, k.body || '#39b6c8'); metal.addColorStop(.55, k.trim || '#b4edf2'); metal.addColorStop(1, '#246078');
    if (side) {
      box(c, -.65, -.12, 1.8, .18, .06, '#21394e'); poly(c, [[-.06, -.16], [.3, -.83], [.65, -.83], [.91, -.16]], '#527b92');
      c.save(); c.translate(1.05, -1.2); c.rotate(-.32); box(c, -1.15 + recoil * .08, -.18, 1.2, .36, .08, metal); box(c, -.15, -.22, .18, .44, .04, k.trim || '#b4e8ed'); ellipse(c, .04, 0, .06, .18, '#123145'); c.restore();
      box(c, -.67, -.72, .55, .18, .05, '#bd5962'); box(c, -.72, -1.08, .14, .49, .05, '#29475f');
      poly(c, [[-.42, -.74], [.12, -.73], [.27, -.39], [.12, -.26], [-.04, -.52], [-.45, -.53]], '#23476a'); box(c, .09, -.34, .4, .16, .04, '#152c42');
      box(c, -.58, -1.18, .46, .54, .09, col); poly(c, [[-.2, -1.08], [.06, -.85], [.36, -.92], [.4, -.79], [.02, -.67], [-.35, -.95]], col); ellipse(c, .36, -.85, .09, .1, '#edc19b');
      face('side', -.64, -1.96, .8, .83);
      for (const wx of [-.4, .78]) { ellipse(c, wx, -.08, .28, .29, '#10253b'); ellipse(c, wx, -.08, .19, .2, '#608ba4'); ellipse(c, wx, -.08, .07, .08, '#b4e5ed'); }
    } else {
      box(c, -.6, -.12, 1.2, .21, .06, '#345970'); for (const wx of [-.66, .66]) { box(c, wx - .12, -.19, .24, .39, .09, '#122a42'); box(c, wx - .07, -.15, .14, .29, .05, '#648da2'); }
      c.save(); c.translate(0, -1.55); c.rotate(Math.max(-.22, Math.min(.22, rot)));
      const shafts = k.twin ? [-.18, .18] : [0], width = k.twin ? .16 : .29;
      for (const off of shafts) { poly(c, [[off - width, .88 + recoil * .08], [off - width * .62, 0], [off + width * .62, 0], [off + width, .88 + recoil * .08]], metal); box(c, off - width * .7, -.035, width * 1.4, .095, .025, k.trim || '#c2edf0'); box(c, off - width, .58, width * 2, .12, .03, k.base || '#e9bc68'); }
      if (k.glow) { box(c, -.43, .19, .13, .57, .03, k.glow); box(c, .3, .19, .13, .57, .03, k.glow); }
      c.restore();
      for (const dir of [-1, 1]) { box(c, dir * .42 - .045, -.69, .09, .28, .025, '#193047'); poly(c, [[dir * .28, -.67], [dir * .47, -.58], [dir * .48, -.32], [dir * .3, -.27]], col); ellipse(c, dir * .43, -.62, .08, .08, '#edc19b'); }
      box(c, -.33, -.7, .66, .6, .12, col); box(c, -.33, -.7, .66, .15, .05, '#294e65'); face('back', -.42, -1.35, .84, .86);
      box(c, -.39, -.38, .78, .39, .09, '#233d55'); box(c, -.32, -.32, .64, .24, .06, '#b95b67'); box(c, -.28, -.26, .56, .055, .02, '#e78a8b');
    }
    c.restore();
  };

  // ---------- La scène complète ----------
  R.scene = (c, wave, { playerId, cannon, ball, t = 0, view } = {}) => {
    const V = CB.VIEW, w = view ? view.w : V.w, h = view ? view.h : V.h;
    c.save(); if (view) { c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); c.clearRect(0, 0, w, h); }
    R.background(c, w, h, wave.world, t);
    const list = wave.enemies.slice().sort((a, b) => b.z - a.z);
    const farBalls = wave.balls.filter(b => b.z > 60), nearBalls = wave.balls.filter(b => b.z <= 60);
    for (const b of farBalls) R.ball(c, b, ball, t);
    for (const e of list) R.enemy(c, e, t);
    for (const b of wave.bursts) R.burst(c, b);
    for (const b of nearBalls) R.ball(c, b, ball, t);
    for (const tx of wave.texts) R.text(c, tx);
    // coéquipier de profil à gauche, héros de dos au centre
    const muzzle = P({ x: 0, y: 1.8, z: 0 });
    if (wave.ally) { const ax = V.allyOrigin, ay = muzzle.y - V.allyLift + 1.2 * V.allySize; R.battleCannon(c, ax, ay, V.allySize, wave.ally.id, cannon, 1, wave.ally.recoil); R.fireFlash(c, ax + V.allySize * 1.95, ay - V.allySize * 1.72, V.allySize / 90, wave.ally.recoil - .5); }
    const rot = Math.max(-.22, Math.min(.22, (wave.aim.x - V.cx) * 66 / V.f * .008));
    R.battleCannon(c, V.cx, V.ground, V.size, playerId, cannon, 0, wave.recoil, rot);
    R.fireFlash(c, V.cx + Math.sin(rot) * 1.55 * V.size, V.ground - 1.55 * V.size * Math.cos(rot), V.size / 110, wave.recoil - .5);
    if (wave.hurt > 0) { c.fillStyle = 'rgba(230,40,40,' + (wave.hurt * .5) + ')'; c.fillRect(0, 0, w, h); }
    const locked = wave.enemies.some(e => { const p = P(e); return Math.hypot(p.x - wave.aim.x, p.y - wave.aim.y) < Math.max(28, p.scale * 2.3 * e.size); });
    if (!wave.over) R.reticle(c, wave.aim, locked, t);
    c.restore();
  };
})(window.CB);
