// Goblin Malin — l'embuscade au filet, et le repaire.
//   Rarement, quand le chef se promène loin du village, une bande lui tombe dessus et lance un grand filet de pêche. Une ombre
//   ronde montre où il va tomber : on a un instant pour s'écarter. Raté : il reste une embuscade ordinaire. Touché : l'écran se
//   referme en petits carrés qui gigotent, et le chef se réveille au fond du repaire de la bande, dans une cage.
//   Le repaire : une seule salle, très longue, où la bande s'est installée (tables, chopes, tonneaux, paillasses). Il faut casser
//   la cage à coups d'arme, puis traverser toute la salle jusqu'au portail de pierre, à l'autre bout. La bande crie selon ce
//   qu'elle est : des humains, des trolls ou des démons. Dehors, le temps s'est arrêté ; on revient là où on a été pris.
// (Sous le capot : la même porte que les demandes d'aide d'arene.js, avec sa propre carte.) Tout se règle dans CG.Filet.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Ar = CG.Arene, Py = CG.Pyramide, Mo = CG.Mondes, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  if (!Ar || !Py || !Mo) return;
  const Fi = CG.Filet = { JOUR: 4, PAR_JOUR: 0.12, ATTENTE: [30, 140], LOIN: 15, BANDE: 3, VOL: 1.15, VISE: 0.4, RAYON: 40, PRIS: 0.9, CAGE: 4, X0: 8, X1: 86, Y0: 33, Y1: 39, ENNEMIS: [14, 20], VUE: 250, REVEIL: 560, RIDEAU: 0.9, CASE: 54 };
  Fi.B = {
    humains: { jour: 0, nom: 'Le repaire des brigands', E: ['brigand', 'brigand', 'milicien', 'soldat', 'archer'], k: 1, col: '#ffe0b0', guet: ['Maintenant ! Le filet !', 'Lancez le filet !', 'Attrapez-moi ce gobelin !'], prise: ['On le tient ! Au repaire !', 'Ha ha ! Dans le sac, la grenouille !', 'Il vaut son poids en or, celui-là !'],
      alerte: ['Le prisonnier s\'échappe, aux armes !', 'Aaaaaaa l\'attaaaaaque !!'],
      cris: ['Le prisonnier s\'échappe, aux armes !', 'Aaaaaaa l\'attaaaaaque !!', 'Il a cassé la cage !', 'Rattrapez-le !', 'Qui devait garder la cage ?!', 'Lâchez vos chopes, les gars !', 'Mon verre ! Il a renversé mon verre !', 'Ne l\'abîmez pas trop, il vaut de l\'or !', 'Alerte ! Alerte !', 'Pas un pas de plus, la grenouille !', 'Sus au gobelin !', 'Il ne sortira pas d\'ici !', 'Par ici ! Il est par ici !', 'Je finis ma bière et je te règle ton compte !'] },
    trolls: { jour: 6, nom: 'La tanière des trolls', E: ['troll', 'troll', 'ogre'], k: 0.5, col: '#d8e8b0', guet: ['GRAAAH !', 'GROUMPF !'], prise: ['Hin hin hin… Miam.', 'GRRR ! Petit vert dans filet !'],
      alerte: ['GRRROOOAAAR !', 'Miam vert parti ! GRAAAH !'],
      cris: ['GRRROOOAAAR !', 'Grrr…', 'GRAAAH !', 'Hrrmpf !', 'Rrrrrr…', 'GROUMPF !', 'Miam vert ! GRAAA !', 'Ouuugh ?', 'Grooo… BAGARRE !', 'Hrrr hrrr hrrr…', 'RRRAAAH !', 'Gnnn… Écraser !'] },
    demons: { jour: 9, nom: 'L\'antre des démons', E: ['diablotin', 'diablotinLance', 'molosseCornu', 'demon', 'diablotin'], k: 0.9, col: '#ffb0a0', guet: ['Sssaisissez-le !', 'Par les sept fourches, le filet !'], prise: ['Une âme toute fraîche pour le chaudron !', 'Hin hin… Le Grand Cornu sera content.'],
      alerte: ['Il s\'évade ! Par l\'enfer, attrapez-le !', 'Aux feux de Belzébuth !!'],
      cris: ['Aux feux de Belzébuth !!', 'Par les sept fourches !', 'Que la braise t\'emporte !', 'Par les cornes du Grand Cornu !', 'Rôtissez-le !', 'Sssoufre et cendres !', 'Il s\'évade ! Par l\'enfer, attrapez-le !', 'Ton âme sentira le brûlé !', 'Au chaudron, le petit vert !', 'Par la barbe roussie de Lucifer !', 'Qu\'on le fasse griller !', 'Mille fourches ! Il a cassé la cage !', 'Tu vas rôtir, moucheron !'] }
  };
  const types = b => b.E.filter(t => CG.ENEMIES[t]);
  Object.keys(Fi.B).forEach(k => { const b = Fi.B[k]; Ar.Q['rep_' + k] = { mondes: [], qui: b.nom, lieu: b.nom, titre: b.nom, theme: 'grotte', E: [['brigand'], ['brigand'], ['brigand']],
    entree: 'Te voilà en cage, tout au fond. Frappe les barreaux pour sortir, puis traverse toute la salle : le portail de pierre est à l\'autre bout.',
    recompense(A) { const S = CG.S, p = S.player, or = 30 + 10 * S.day, xp = 25 + 5 * S.day; G.gain('or', or, p.x, p.y - 50); G.addXp(xp); G.banner('Évadé !', 'Tu leur as filé entre les doigts, avec leur caisse en prime. (+' + or + ' 🪙, +' + xp + ' XP.)', '#c8ffb0'); CG.sfx('victory'); } }; });
  const cle = () => { const S = CG.S; return S && S.arene && typeof S.arene.id === 'string' && S.arene.id.indexOf('rep_') === 0 && Ar.dans() ? S.arene.id.slice(4) : null; };
  const bande = () => { const k = cle(); return k ? Fi.B[k] : null; };
  Fi.dans = () => !!cle();
  const CY = () => (Fi.Y0 + Fi.Y1) / 2, cagePos = () => ({ x: (Fi.X1 - 1.5) * T, y: (CY() + 0.5) * T });
  const enCage = () => !!bande() && CG.S.arene.cage > 0;
  // ---------- le rideau de carrés ----------
  let rd = null;
  function rideau(sens) {
    if (!rd) { const cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;pointer-events:none;display:none'; document.body.appendChild(cv); rd = { cv, g: cv.getContext('2d'), k: 0, sens: 0, raf: 0, t0: 0, depuis: 0 }; }
    rd.sens = sens; rd.depuis = performance.now(); if (rd.raf) return; rd.cv.style.display = ''; rd.t0 = performance.now();
    const tic = now => { const dt = Math.min(0.05, (now - rd.t0) / 1000); rd.t0 = now; rd.k = CG.clamp(rd.k + rd.sens * dt / Fi.RIDEAU, 0, 1);
      if (rd.sens > 0 && rd.k >= 1 && now - rd.depuis > 6000) rd.sens = -1; /* jamais d'écran noir qui reste */
      const cv = rd.cv, w = window.innerWidth, h = window.innerHeight, g = rd.g; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } g.clearRect(0, 0, w, h); g.fillStyle = '#050406';
      const c = Fi.CASE, nx = Math.ceil(w / c), ny = Math.ceil(h / c), s = now / 1000;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const ret = (i + j) / (nx + ny) * 0.45, a = CG.clamp((rd.k - ret) / 0.55, 0, 1); if (a <= 0) continue; const e = a * a * (3 - 2 * a), cote = (c + 2) * e, vib = (1 - e) * 5;
        if (e >= 1) { g.fillRect(i * c - 1, j * c - 1, c + 2, c + 2); continue; }
        g.save(); g.translate(i * c + c / 2 + Math.sin(s * 31 + i * 7.3 + j * 3.1) * vib, j * c + c / 2 + Math.cos(s * 27 + i * 2.9 + j * 8.7) * vib); g.rotate(Math.sin(s * 19 + i + j * 2) * (1 - e) * 0.5); g.fillRect(-cote / 2, -cote / 2, cote, cote); g.restore(); }
      if (rd.k <= 0 && rd.sens <= 0) { cv.style.display = 'none'; rd.raf = 0; return; }
      rd.raf = requestAnimationFrame(tic); };
    rd.raf = requestAnimationFrame(tic);
  }
  Fi.rideau = rideau;
  // ---------- l'embuscade : la bande sort des fourrés, et le filet part ----------
  let prise = null; /* { phase: 'filet' | 'ferme' | 'voyage', t, k } : ce qui arrive au chef une fois pris */
  const dehors = () => { const S = CG.S, R = CG.R; return !S.arene && Mo.ici() !== 2 && !Mo.pending && !R.night && !R.fireLit && !(R.ko > 0) && !R.cine && !R.build && !R.louche && !prise; };
  const loinDuFeu = (x, y) => { let f; try { f = G.firePos(); } catch (e) { return true; } return Math.hypot(x - f.x, y - f.y) > Fi.LOIN * T; };
  function jour() { const S = CG.S, R = CG.R; if (!R.filetJ || R.filetJ.jour !== S.day) R.filetJ = { jour: S.day, vient: S.day >= Fi.JOUR && Math.random() < Fi.PAR_JOUR, dans: rand(Fi.ATTENTE[0], Fi.ATTENTE[1]) }; return R.filetJ; }
  Fi.choisir = () => { const S = CG.S, l = Object.keys(Fi.B).filter(k => S.day >= Fi.B[k].jour && types(Fi.B[k]).length); return l.length ? pick(l) : null; };
  Fi.lancer = function (k) {
    const S = CG.S, R = CG.R, p = S.player; k = Fi.B[k] && types(Fi.B[k]).length ? k : Fi.choisir(); if (!k || R.filet || prise) return false; const b = Fi.B[k], ts = types(b), l = [];
    for (let i = 0; i < Fi.BANDE; i++) { let x = 0, y = 0, ok = false; for (let q = 0; q < 16 && !ok; q++) { const a = (i / Fi.BANDE) * TAU + rand(-0.5, 0.5), d = rand(150, 195); x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d * 0.85; ok = W.walkPx(x, y); } if (!ok) continue;
      const e = G.spawnEnemy(ts[i % ts.length], x, y, {}); if (!e) continue; e.target = p; e.filetE = true; l.push(e); G.puff(x, y - 16, '#5a7a3a', 12, 120, 4); }
    if (!l.length) return false; const qui = l[0];
    G.text(qui.x, qui.y - 62, pick(b.guet), b.col, true); G.banner('⚠️ Embuscade !', 'Un filet ! Écarte-toi !', '#ffb0a0'); CG.sfx('warning'); R.playerCombatUntil = R.t + 5;
    R.filet = { x0: qui.x, y0: qui.y - 20, x: p.x, y: p.y, t: 0, k, rot: 0 }; return true;
  };
  function attraper(k) { const S = CG.S, R = CG.R, p = S.player, b = Fi.B[k]; prise = { phase: 'filet', t: Fi.PRIS, k }; R.invuln = Math.max(R.invuln || 0, 8); p.path = null; if (R.ruee) R.ruee = null;
    G.text(p.x, p.y - 74, 'Pris au filet !', '#f0ead8', true); R.rings.push({ x: p.x, y: p.y - 8, r: 44, life: 0.35, col: '#e8dcc0' }); CG.sfx('hit');
    const e = R.enemies.find(o => o.filetE && !o.dead); if (e) G.text(e.x, e.y - 62, pick(b.prise), b.col, true); }
  function lacher(pourquoi) { prise = null; rideau(-1); if (pourquoi && CG.S) G.text(CG.S.player.x, CG.S.player.y - 70, pourquoi, '#f0ead8', true); }
  // ---------- le repaire : la carte ----------
  const meubles = seed => { const rng = CG.makeRng(seed + 11), l = []; for (let x = Fi.X0 + 6; x < Fi.X1 - 8; x += 4 + Math.floor(rng() * 3)) { const haut = rng() < 0.5, q = rng(), k = q < 0.55 ? 'table' : q < 0.75 ? 'tonneaux' : q < 0.9 ? 'caisses' : 'lit'; l.push({ k, x, y: haut ? Fi.Y0 + 1 : Fi.Y1 - 1, w: k === 'table' ? 2 : 1, s: rng() }); } return l; };
  const ge0 = Py.generer; Py.generer = function () {
    ge0.apply(this, arguments); if (!bande()) return; const S = CG.S, tile = W.tile, I = W.idx;
    tile.fill(W.BUILD); for (let y = Fi.Y0; y <= Fi.Y1; y++) for (let x = Fi.X0; x <= Fi.X1; x++) tile[I(x, y)] = W.FLOOR;
    for (const m of meubles(S.arene.seed)) if (m.k !== 'lit') for (let i = 0; i < m.w; i++) tile[I(m.x + i, m.y)] = W.BUILD; /* pas W.ROCK : le jeu dessinerait un rocher par-dessus le meuble */
    Object.assign(W.POI.portail, { x: Fi.X0 + 2, y: Math.floor(CY()) + 2, r: 0 }); W.CX = Math.floor((Fi.X0 + Fi.X1) / 2); W.CY = Math.floor(CY()); W.fieldDirty = true; W.miniDirty = true;
  };
  const TH = {
    humains: { fond: '#0b0806', sol: [28, 32, 27], mur: '#4a4038', mur2: '#5c5046', table: '#7a5230', dessus: '#94683e', chope: '#c8ccd8', tissu: '#a8322a', paille: '#c9a94e' },
    trolls: { fond: '#07080a', sol: [95, 10, 24], mur: '#3c4038', mur2: '#4a4e44', table: '#6b6a62', dessus: '#84837a', chope: '#e8e0c8', tissu: '#6a5a3a', paille: '#8a8a5a' },
    demons: { fond: '#0a0406', sol: [350, 24, 17], mur: '#3a1418', mur2: '#4c1c20', table: '#2a1a20', dessus: '#3c242c', chope: '#e8c84a', tissu: '#7a1014', paille: '#5a2a1a' }
  };
  const pa0 = W.paint; W.paint = function () {
    const k = cle(); if (!k) return pa0.apply(this, arguments);
    const th = TH[k], S = CG.S, c = W.terrain = document.createElement('canvas'); c.width = CG.MW * T; c.height = CG.MH * T; const g = c.getContext('2d'), rng = CG.makeRng(S.arene.seed + 3), X0 = Fi.X0, X1 = Fi.X1, Y0 = Fi.Y0, Y1 = Fi.Y1;
    const ell = (x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
    g.fillStyle = th.fond; g.fillRect(0, 0, c.width, c.height);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { const h = W.hash(x, y); g.fillStyle = 'hsl(' + (th.sol[0] + h * 6) + ',' + th.sol[1] + '%,' + (th.sol[2] + h * 5) + '%)'; g.fillRect(x * T, y * T, T + 1, T + 1);
      if (k === 'humains') { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x * T, y * T + T / 2 - 1, T, 1.5); g.fillRect(x * T, y * T + T - 1, T, 1.5); g.fillRect(x * T + (h * 31 % 1) * T, y * T, 1.5, T / 2); }
      else if (h > 0.72) { g.strokeStyle = k === 'demons' ? 'rgba(255,90,40,0.35)' : 'rgba(0,0,0,0.25)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x * T + 6, y * T + 8 + h * 10); g.lineTo(x * T + 20, y * T + 18); g.lineTo(x * T + 32, y * T + 14 + h * 12); g.stroke(); } }
    for (let i = 0; i < 90; i++) { const x = (X0 + rng() * (X1 - X0 + 1)) * T, y = (Y0 + rng() * (Y1 - Y0 + 1)) * T; ell(x, y, 8 + rng() * 18, 4 + rng() * 8, rng() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.13)'); }
    // le mur du fond : deux cases de haut, avec des torches et des tentures
    g.fillStyle = th.mur; g.fillRect((X0 - 1) * T, (Y0 - 2) * T, (X1 - X0 + 3) * T, 2 * T); g.fillStyle = th.fond; g.fillRect((X0 - 1) * T, (Y0 - 2) * T - 6, (X1 - X0 + 3) * T, 8);
    for (let x = X0 - 1; x <= X1 + 1; x++) for (let r = 0; r < 4; r++) { const dx = r % 2 ? T / 2 : 0, h = W.hash(x * 3 + r, r); g.fillStyle = h > 0.5 ? th.mur2 : 'rgba(0,0,0,0.12)'; g.fillRect(x * T + dx + 1, (Y0 - 2) * T + r * 20 + 1, T - 2, 18); }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect((X0 - 1) * T, Y0 * T, (X1 - X0 + 3) * T, 7); g.fillStyle = th.mur; g.fillRect((X0 - 1) * T, Y0 * T, T, (Y1 - Y0 + 1) * T); g.fillRect((X1 + 1) * T, Y0 * T, T, (Y1 - Y0 + 1) * T); g.fillRect((X0 - 1) * T, (Y1 + 1) * T, (X1 - X0 + 3) * T, 14);
    for (let x = X0 + 2; x < X1; x += 5) { const px = x * T + T / 2, py = (Y0 - 1) * T + 6;
      if ((x - X0) % 10 === 2) { ell(px, py + 4, 46, 34, k === 'demons' ? 'rgba(255,70,30,0.13)' : 'rgba(255,190,90,0.13)'); g.fillStyle = '#3a2a1a'; g.fillRect(px - 2, py, 4, 16); g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(px - 5, py + 1); g.quadraticCurveTo(px - 6, py - 8, px, py - 15); g.quadraticCurveTo(px + 6, py - 8, px + 5, py + 1); g.closePath(); g.fill(); ell(px, py - 3, 2.4, 4.5, '#ffe36b'); }
      else { g.fillStyle = th.tissu; g.beginPath(); g.moveTo(px - 11, py - 22); g.lineTo(px + 11, py - 22); g.lineTo(px + 11, py + 16); g.lineTo(px, py + 8); g.lineTo(px - 11, py + 16); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(px - 11, py - 22, 22, 4); ell(px, py - 6, 4.5, 4.5, k === 'humains' ? '#e8c84a' : k === 'demons' ? '#1a0a0c' : '#d8d0b8'); } }
    // les meubles
    const chope = (x, y) => { g.fillStyle = th.chope; g.fillRect(x - 3, y - 7, 6, 7); ell(x, y, 3, 1.2, th.chope); ell(x, y - 7, 3, 1.3, k === 'humains' ? '#fff8e0' : k === 'demons' ? '#ff5a2a' : '#8a6a3a'); g.strokeStyle = th.chope; g.lineWidth = 1.3; g.beginPath(); g.arc(x + 4, y - 3.5, 2.2, -1.2, 1.2); g.stroke(); };
    const tabouret = (x, y) => { ell(x, y + 3, 7, 3, 'rgba(0,0,0,0.25)'); g.fillStyle = th.table; g.fillRect(x - 5, y - 4, 10, 6); ell(x, y - 4, 6.5, 3, th.dessus); };
    for (const m of meubles(S.arene.seed)) { const x = m.x * T, y = m.y * T;
      if (m.k === 'table') { const w = 2 * T; for (let i = 0; i < 3; i++) { tabouret(x + 14 + i * 26, y - 6); } ell(x + w / 2, y + T - 3, w / 2 - 2, 6, 'rgba(0,0,0,0.3)'); g.fillStyle = th.table; g.fillRect(x + 7, y + 20, 6, 14); g.fillRect(x + w - 13, y + 20, 6, 14); g.fillRect(x + 3, y + 8, w - 6, 16); g.fillStyle = th.dessus; g.fillRect(x + 3, y + 5, w - 6, 13); g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(x + 3, y + 11, w - 6, 1.2);
        chope(x + 16, y + 13); chope(x + 44 + m.s * 10, y + 11); if (m.s > 0.3) chope(x + 66, y + 14); ell(x + 30, y + 13, 6, 2.4, '#d8d0c0'); ell(x + 30, y + 12.4, 3.4, 1.4, k === 'trolls' ? '#b05a3a' : '#c88a3a'); if (m.s > 0.6) { g.fillStyle = '#2f6a3a'; g.fillRect(x + 55, y + 1, 4, 10); g.fillRect(x + 56, y - 3, 2, 5); }
        if (k === 'trolls') { g.strokeStyle = '#e8e0c8'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 8, y + 40); g.lineTo(x + 20, y + 44); g.stroke(); }
        for (let i = 0; i < 2; i++) tabouret(x + 24 + i * 30, y + T + 2); }
      else if (m.k === 'tonneaux') { for (const q of [[13, 22], [27, 26], [20, 10]]) { const bx = x + q[0], by = y + q[1]; ell(bx, by + 8, 9, 3.4, 'rgba(0,0,0,0.3)'); g.fillStyle = '#7a5230'; g.fillRect(bx - 8, by - 9, 16, 17); ell(bx, by + 8, 8, 3, '#6a4426'); ell(bx, by - 9, 8, 3, '#9c7244'); g.fillStyle = '#4a4a50'; g.fillRect(bx - 8, by - 4, 16, 2); g.fillRect(bx - 8, by + 3, 16, 2); } }
      else if (m.k === 'caisses') { for (const q of [[5, 12, 18], [20, 16, 16], [11, 0, 14]]) { const bx = x + q[0], by = y + q[1], s = q[2]; g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(bx + 2, by + 3, s, s); g.fillStyle = '#8a6a3c'; g.fillRect(bx, by, s, s); g.strokeStyle = '#5c4426'; g.lineWidth = 1.6; g.strokeRect(bx + 1, by + 1, s - 2, s - 2); g.beginPath(); g.moveTo(bx + 1, by + 1); g.lineTo(bx + s - 1, by + s - 1); g.stroke(); } }
      else { ell(x + 20, y + 22, 19, 10, 'rgba(0,0,0,0.22)'); g.fillStyle = th.paille; g.fillRect(x + 3, y + 12, 34, 17); g.fillStyle = th.tissu; g.fillRect(x + 14, y + 12, 23, 17); ell(x + 8, y + 20, 4.5, 6, '#e8e0d0'); } }
    const cg = cagePos(); ell(cg.x, cg.y + 4, 30, 14, th.paille); for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.beginPath(); const a = rng() * TAU, r = rng() * 24; g.moveTo(cg.x + Math.cos(a) * r, cg.y + 4 + Math.sin(a) * r * 0.45); g.lineTo(cg.x + Math.cos(a) * r + 7, cg.y + 5 + Math.sin(a) * r * 0.45); g.stroke(); }
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
  };
  // ---------- le repaire : la bande, la cage ----------
  const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments), b = bande(); if (!b) return r; const S = CG.S, R = CG.R, A = S.arene, ts = types(b), rng = Math.random;
    R.enemies.length = 0; if (A.cage === undefined) A.cage = Fi.CAGE; if (!ts.length) return r;
    const n = Math.max(4, Math.round((Fi.ENNEMIS[0] + Math.min(1, S.day / 20) * (Fi.ENNEMIS[1] - Fi.ENNEMIS[0])) * b.k)), xa = (Fi.X0 + 6) * T, xb = (Fi.X1 - 9) * T;
    for (let i = 0; i < n; i++) { let x = 0, y = 0, ok = false; for (let q = 0; q < 30 && !ok; q++) { x = xa + (xb - xa) * ((i + rng()) / n); y = (Fi.Y0 + 0.4 + rng() * (Fi.Y1 - Fi.Y0 + 0.2)) * T; ok = W.walkPx(x, y); } if (!ok) continue;
      const e = G.spawnEnemy(ts[Math.floor(rng() * ts.length)], x, y, { wild: true }); if (!e) continue; e.arene = true; e.etage = 99; e.leash = 3200; e.aggroR = A.cage > 0 ? 1 : Fi.VUE; e.rep = true; e.face = 1; }
    return r;
  };
  const pb0 = Py.basculer; Py.basculer = function () {
    const r = pb0.apply(this, arguments); if (!bande() || CG.S.arene.pose) return r; const S = CG.S, p = S.player, c = cagePos(); S.arene.pose = true; p.x = c.x; p.y = c.y; p.face = -1; if (CG.R.dir) CG.R.dir = { x: -1, y: 0 };
    S.pets.forEach(o => { if (o.follow) { o.x = c.x - 46 + rand(-10, 10); o.y = c.y + rand(-20, 20); o.path = null; } }); return r;
  };
  function liberer() {
    const S = CG.S, R = CG.R, p = S.player, b = bande(), c = cagePos(); S.arene.cage = 0; R.cageT = R.t;
    G.puff(c.x, c.y - 24, '#b8bcc8', 36, 220, 4); for (let i = 0; i < 2; i++) R.rings.push({ x: c.x, y: c.y - 10, r: 50 + i * 40, life: 0.45 + i * 0.15, col: '#d8dce8' }); G.text(c.x, c.y - 84, 'CRAC !', '#fff', true); CG.sfx('build'); if (R.shake !== undefined) R.shake = 0.3;
    const l = R.enemies.filter(e => e.rep && !e.dead).sort((u, v) => Math.hypot(u.x - p.x, u.y - p.y) - Math.hypot(v.x - p.x, v.y - p.y));
    l.forEach((e, i) => { e.aggroR = Math.hypot(e.x - p.x, e.y - p.y) < Fi.REVEIL ? 1200 : Fi.VUE; if (i < b.alerte.length) { e.crie = true; e.criA = { t: R.t + 0.35 + i * 0.9, txt: b.alerte[i] }; e.aggroR = 1600; } });
  }
  { const at0 = G.attack; G.attack = function () { if (!enCage()) return at0.apply(this, arguments); const R = CG.R, S = CG.S, pret = !(R.atkCd > 0) && !(R.ko > 0), r = at0.apply(this, arguments); if (!pret) return r;
      const c = cagePos(); S.arene.cage--; R.cageCoup = R.t; G.puff(c.x - 22, c.y - 22, '#d8dce8', 8, 120, 3); G.text(c.x - 20, c.y - 70, pick(['CLANG !', 'BONG !', 'CLONG !']), '#d8dce8'); CG.sfx('hit'); if (S.arene.cage <= 0) liberer(); return r; };
    const hm0 = G.heroMul; G.heroMul = function () { return prise || enCage() ? 0 : hm0.apply(this, arguments); }; }
  { const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it && it.type === 'pyramideSortie' && bande()) it.label = 'S\'évader par le portail'; return it; }; }
  // ---------- chaque instant ----------
  let criT = 0;
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !S.player || !R.enemies) return r; const p = S.player, b = bande();
    if (prise) { prise.t -= dt;
      if (prise.phase === 'filet') { R.invuln = Math.max(R.invuln || 0, 3); if (prise.t <= 0) { prise.phase = 'ferme'; prise.t = Fi.RIDEAU + 0.25; rideau(1); } }
      else if (prise.phase === 'ferme') { R.invuln = Math.max(R.invuln || 0, 3); if (prise.t <= 0) { if (Ar.partir('rep_' + prise.k) && Ar.attente) { Ar.attente.gagne = true; prise.phase = 'voyage'; prise.t = 5; } else lacher('Tu déchires le filet !'); } }
      else if (b) { prise = null; rideau(-1); } else if (prise.t <= 0) lacher(); }
    if (b) { const A = S.arene;
      if (A.cage > 0) { const c = cagePos(); p.x = c.x; p.y = c.y; p.path = null; }
      else for (const e of R.enemies) { if (!e.rep || e.dead) continue; if (e.criA) { if (R.t >= e.criA.t) { G.text(e.x, e.y - 60, e.criA.txt, b.col, true); e.criA = null; } continue; }
        if (e.crie) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (e.target !== p && d > Fi.VUE * 0.9) continue; e.crie = true; e.aggroR = 1200;
        for (const o of R.enemies) if (o.rep && !o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 190) o.aggroR = Math.max(o.aggroR || 0, 700); /* ses voisins lâchent leur chope aussi */
        if (R.t > criT && CG.onScreen(e.x, e.y)) { criT = R.t + 0.75; G.text(e.x, e.y - 60, pick(b.cris), b.col, true); } }
      return r; }
    const f = R.filet;
    if (f) { f.t += dt; f.rot += dt * 7; if (f.t < Fi.VISE) { f.x = p.x; f.y = p.y; }
      if (f.t >= Fi.VOL) { R.filet = null; const d = Math.hypot(p.x - f.x, (p.y - f.y) * 1.3); R.filetSol = { x: f.x, y: f.y, t: 7 }; G.puff(f.x, f.y - 6, '#d8ccb0', 14, 110, 3);
        if (d < Fi.RAYON && !(R.ko > 0) && !S.arene && !Mo.pending) attraper(f.k); else G.text(f.x, f.y - 40, 'Raté !', '#f0ead8', true); }
      return r; }
    if (R.filetSol) { R.filetSol.t -= dt; if (R.filetSol.t <= 0) R.filetSol = null; }
    const j = jour(); if (!j.vient || j.fait || !dehors() || !loinDuFeu(p.x, p.y) || R.playerCombatUntil > R.t || (UI.modal && UI.modal.name)) return r; j.dans -= dt; if (j.dans > 0) return r; if (Fi.lancer()) j.fait = true; else j.dans = 5;
    return r;
  };
  // ---------- les dessins ----------
  const maille = (g, x, y, rx, ry, rot, a) => { g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fillStyle = 'rgba(214,200,160,0.16)'; g.fill(); g.save(); g.clip(); g.strokeStyle = '#d8ccb0'; g.lineWidth = 1.1; g.beginPath(); for (let i = -6; i <= 6; i++) { g.moveTo(i * rx / 4 - rx, -ry); g.lineTo(i * rx / 4 + rx, ry); g.moveTo(i * rx / 4 + rx, -ry); g.lineTo(i * rx / 4 - rx, ry); } g.stroke(); g.restore(); g.strokeStyle = '#a89468'; g.lineWidth = 2.2; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.stroke(); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; g.fillStyle = '#6a6a70'; g.beginPath(); g.arc(Math.cos(an) * rx, Math.sin(an) * ry, 2.2, 0, TAU); g.fill(); } g.restore(); };
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    const f = R.filet; if (f) { const k = f.t / Fi.VOL; g.save(); g.globalAlpha = 0.25 + k * 0.4; g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(f.x, f.y, Fi.RAYON * (0.5 + k * 0.5), Fi.RAYON * 0.72 * (0.5 + k * 0.5), 0, 0, TAU); g.fill(); g.strokeStyle = '#ffe0a0'; g.lineWidth = 2; g.setLineDash([7, 6]); g.beginPath(); g.ellipse(f.x, f.y, Fi.RAYON, Fi.RAYON * 0.72, 0, 0, TAU); g.stroke(); g.restore(); }
    if (R.filetSol && CG.onScreen(R.filetSol.x, R.filetSol.y)) maille(g, R.filetSol.x, R.filetSol.y, Fi.RAYON, Fi.RAYON * 0.7, 0.3, Math.min(1, R.filetSol.t)); }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const R = CG.R, S = CG.S; if (!R || !S) return; const p = S.player;
    const f = R.filet; if (f) { const k = f.t / Fi.VOL, x = f.x0 + (f.x - f.x0) * k, y = f.y0 + (f.y - 12 - f.y0) * k - Math.sin(k * Math.PI) * 110, s = 0.3 + k * 0.7; maille(g, x, y, Fi.RAYON * s, Fi.RAYON * s * (0.55 + Math.abs(Math.sin(f.rot)) * 0.35), f.rot * 0.4, 1); }
    if (prise && prise.phase !== 'voyage') maille(g, p.x, p.y - 16, 26, 28, 0.2, 1); }; }
  // la cage : le fond derrière le chef, les barreaux devant ; cassée, il n'en reste que le socle et des barreaux tordus
  function cage(g, devant, t) { const R = CG.R, A = CG.S.arene, c = cagePos(), x = c.x, y = c.y + 8, w = 30, h = 62, secoue = R.cageCoup && R.t - R.cageCoup < 0.25 ? Math.sin((R.t - R.cageCoup) * 60) * 2.5 : 0;
    g.save(); g.translate(secoue, 0); g.lineCap = 'round';
    if (A.cage > 0) { g.strokeStyle = devant ? '#9a9ea8' : '#5c6068'; g.lineWidth = devant ? 3 : 2.4; const yy = devant ? y + 5 : y - 7; g.beginPath(); for (let i = 0; i <= 5; i++) { const bx = x - w + i * (w * 2 / 5) + (devant ? 0 : 6); g.moveTo(bx, yy); g.lineTo(bx, yy - h); } g.stroke();
      g.strokeStyle = devant ? '#7a7e88' : '#4c5058'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - w - 2 + (devant ? 0 : 6), yy - h); g.lineTo(x + w + 2 + (devant ? 0 : 6), yy - h); g.moveTo(x - w - 2 + (devant ? 0 : 6), yy); g.lineTo(x + w + 2 + (devant ? 0 : 6), yy); g.stroke();
      if (devant) { g.strokeStyle = '#6a6e78'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - w - 2, y + 5); g.lineTo(x - w + 4, y - 7); g.moveTo(x + w + 2, y + 5); g.lineTo(x + w + 8, y - 7); g.moveTo(x - w - 2, y + 5 - h); g.lineTo(x - w + 4, y - 7 - h); g.moveTo(x + w + 2, y + 5 - h); g.lineTo(x + w + 8, y - 7 - h); g.stroke();
        const fait = Fi.CAGE - A.cage; if (fait > 0) { g.strokeStyle = '#2a2c30'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < fait; i++) { const bx = x - w + (i + 1) * (w * 2 / 5), by = y - 20 - i * 9; g.moveTo(bx - 3, by); g.lineTo(bx + 2, by + 4); g.lineTo(bx - 1, by + 8); } g.stroke(); }
        g.fillStyle = '#c8a84a'; g.fillRect(x - w - 5, y - 30, 7, 9); } }
    else if (!devant) { g.strokeStyle = '#6a6e78'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - w - 2, y + 5); g.lineTo(x + w + 2, y + 5); g.moveTo(x + w - 2, y + 5); g.lineTo(x + w + 6, y - 40); g.moveTo(x + w - 14, y + 5); g.lineTo(x + w - 10, y - 26); g.moveTo(x - w - 16, y + 12); g.lineTo(x - w + 14, y + 16); g.moveTo(x - 8, y + 18); g.lineTo(x + 20, y + 13); g.stroke(); }
    g.restore(); }
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (!bande()) return; const c = cagePos(); if (!CG.onScreen(c.x, c.y)) return;
    push(c.y - 12, 21, { x: c.x, y: c.y, draw(g, o, t) { cage(g, false, t); } }, null); push(c.y + 12, 21, { x: c.x, y: c.y, draw(g, o, t) { cage(g, true, t); } }, null); }; }
})(window.CG);
