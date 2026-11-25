// Goblin Malin — les fraises des bois : de tout petits plants au ras du sol, à l'orée du village et un peu partout dans la forêt.
// Un plant ne porte que quelques fraises : un cueilleur le vide en une fois (BAIES de nourriture) et il ne repousse que le
// lendemain. Le chef, lui, en tire moins que d'un vrai buisson (CHEF). Tout est réglable dans CG.Fraises.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2; if (!W || !Art) return;
  const Fr = CG.Fraises = { BAIES: 3, CHEF: 2, OREE: 10, FORET: 34, LOIN: 12 }; /* OREE : plants autour du village (les cueilleurs y vont) ; FORET : plants ailleurs sur la carte, à plus de LOIN cases du feu (pour le chef seulement : on n'envoie pas un cueilleur au fond des bois pour trois fraises) */
  const NOM = { nom: 'les fraises des bois', col: '#e0283a', lum: '#ffd0c8' };
  { const b0 = Art.baie; if (b0) Art.baie = function (n) { return n && n.type === 'fraise' ? NOM : b0.apply(this, arguments); }; }
  const foret = () => !(CG.Mondes && CG.Mondes.ici()) && !(CG.Terres && CG.Terres.ici && CG.Terres.ici()) && W.POI && W.POI.baies && W.nodes && W.nodes.some(n => n.type === 'bush');
  // ---------- où ils poussent : toujours aux mêmes endroits pour la même carte ----------
  Fr.planter = function () {
    const S = CG.S, N = W.nodes; if (!S || !N || N.fraises) return; N.fraises = true; if (!foret()) return;
    const rng = CG.makeRng((W.seed || 1) + 4242), f = W.field ? W.field() : null, pris = new Set(N.map(n => n.x + ',' + n.y));
    (W.chestDefs || []).concat(W.wildDefs || []).forEach(c => pris.add(c.x + ',' + c.y));
    const bati = (x, y) => S.buildings.some(b => x >= b.tx - 1 && x <= b.tx + (b.w || 1) && y >= b.ty - 1 && y <= b.ty + (b.h || 1));
    const libre = (x, y) => { if (!W.inMap(x, y) || x < 3 || y < 3 || x > CG.MW - 4 || y > CG.MH - 4) return false; const i = W.idx(x, y); if ((W.tile[i] !== W.GRASS && W.tile[i] !== W.CLEAR) || !W.walkTile(x, y) || (f && f[i] < 0)) return false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (pris.has((x + dx) + ',' + (y + dy))) return false; return !(W.sites || []).some(s => Math.hypot(s.x - x, s.y - y) < s.r + 2); };
    const pose = (x, y, pres) => { pris.add(x + ',' + y); if (!bati(x, y)) N.push({ type: 'fraise', x, y, pres, v9: Math.floor(rng() * 3) }); else rng(); };
    for (let i = 0, k = 0; i < Fr.OREE && k < 400; k++) { const a = rng() * TAU, r = 6 + rng() * 3.4, x = Math.round(W.CX + Math.cos(a) * r / 0.9), y = Math.round(W.CY + Math.sin(a) * r / 1.12); if (libre(x, y)) { pose(x, y, true); i++; } } /* à l'orée : juste avant les premiers arbres */
    for (let i = 0, k = 0; i < Fr.FORET && k < 3000; k++) { const x = 3 + Math.floor(rng() * (CG.MW - 6)), y = 3 + Math.floor(rng() * (CG.MH - 6)); if (Math.hypot(x - W.CX, y - W.CY) < Fr.LOIN || !libre(x, y)) continue; pose(x, y, false); i++; }
  };
  const up0 = G.update; G.update = function () { const r = up0.apply(this, arguments); try { if (W.nodes && !W.nodes.fraises) Fr.planter(); } catch (e) { if (W.nodes) W.nodes.fraises = true; } return r; };
  // un bâtiment posé dessus : le plant disparaît pour de bon
  if (D && D.startDay) { const sd = D.startDay; D.startDay = function () { const r = sd.apply(this, arguments), S = CG.S; try { if (S && W.nodes) for (let i = W.nodes.length - 1; i >= 0; i--) { const n = W.nodes[i]; if (n.type === 'fraise' && S.buildings.some(b => n.x >= b.tx && n.x < b.tx + (b.w || 1) && n.y >= b.ty && n.y < b.ty + (b.h || 1))) W.nodes.splice(i, 1); } } catch (e) { /* jamais bloquant */ } return r; }; }
  // ---------- un cueilleur le vide d'un coup : BAIES de nourriture en tout, et le plant attend demain ----------
  if (G.outilSuite) { const os0 = G.outilSuite; G.outilSuite = function (g) {
    const n = g && g.node; if (n && n.type === 'fraise' && !n.gone) { n.gone = true; const plus = Fr.BAIES - ((CG.JOBS.cueilleur.gain || {}).food || 2); if (plus > 0) G.gain('food', plus, n.x * T + T / 2, n.y * T + T / 2 - 20); G.puff(n.x * T + T / 2, n.y * T + T / 2 - 4, '#3a8a44', 6, 60, 3); }
    return os0.apply(this, arguments); }; }
  // ---------- le dessin : trois touffes de feuilles dentelées, des fraises rouges, une ou deux fleurs blanches ----------
  const cache = {};
  function image(v) { if (cache[v]) return cache[v]; const c = document.createElement('canvas'); c.width = 40; c.height = 30; const g = c.getContext('2d');
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
    ell(20, 24, 15, 4, 'rgba(0,0,0,0.18)');
    const touffes = [[11, 19], [20, 16], [29, 19], [16, 22], [25, 22]];
    touffes.forEach(([x, y], i) => { const col = ['#3f8f3a', '#4a9c40', '#367f34'][(i + v) % 3]; for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * 0.95; ell(x + Math.cos(a) * 4, y + Math.sin(a) * 3.2, 4.6, 3, col, a); } ell(x, y - 1, 1.6, 1.2, 'rgba(160,220,130,0.5)'); });
    const fruits = [[[9, 22], [22, 21], [30, 23]], [[13, 23], [19, 20], [27, 22], [32, 21]], [[10, 21], [24, 23]]][v % 3];
    fruits.forEach(([x, y]) => { g.fillStyle = '#e0283a'; g.beginPath(); g.moveTo(x - 2.6, y - 1.6); g.quadraticCurveTo(x, y - 3.2, x + 2.6, y - 1.6); g.quadraticCurveTo(x + 2.2, y + 2.2, x, y + 3.6); g.quadraticCurveTo(x - 2.2, y + 2.2, x - 2.6, y - 1.6); g.fill();
      ell(x - 0.9, y - 0.6, 0.9, 0.7, '#ff9a8a'); g.fillStyle = '#ffe9a0'; [[-0.8, 1.2], [0.9, 0.6], [0.1, 2.2]].forEach(q => g.fillRect(x + q[0], y + q[1], 0.7, 0.7)); ell(x, y - 2.2, 1.9, 0.9, '#2f7a30'); });
    const fleurs = [[[17, 13]], [[24, 14]], [[15, 14], [26, 15]]][v % 3];
    fleurs.forEach(([x, y]) => { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; ell(x + Math.cos(a) * 1.7, y + Math.sin(a) * 1.7, 1.25, 1.25, '#ffffff'); } ell(x, y, 1, 1, '#ffd23a'); });
    return (cache[v] = c); }
  const nd0 = Art.node; Art.node = function (g, n) { if (!n || n.type !== 'fraise') return nd0.apply(this, arguments); g.drawImage(image(n.v9 || 0), n.x * T + T / 2 - 20, n.y * T + T / 2 - 16); };
})(window.CG);
