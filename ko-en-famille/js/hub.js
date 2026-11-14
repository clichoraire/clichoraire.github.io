// K.O. en Famille — le gym (aventure) : on s’y promène avec ← →, Entrée pour entrer dans un endroit.
//   Salle d’entraînement · Tableau des combats · Coin du coach (combos) · Boutique · Porte (dormir)
(function (root) {
  'use strict';
  const BX = root.BX, A = BX.art, AU = BX.audio;
  const HB = BX.hub = {};
  const W = 1280, H = 720, FLOOR = 640;
  HB.SPOTS = [
    { id: 'train', x: 200, w: 260, name: 'Salle d’entraînement', verb: 'S’entraîner' },
    { id: 'board', x: 480, w: 200, name: 'Tableau des combats', verb: 'Voir mes combats' },
    { id: 'coach', x: 735, w: 230, name: 'Coin du coach', verb: 'Apprendre des coups' },
    { id: 'shop', x: 1010, w: 240, name: 'Boutique à Gilles', verb: 'Magasiner' },
    { id: 'door', x: 1215, w: 110, name: 'Sortie', verb: 'Rentrer dormir' },
  ];
  let S = null, bg = null, bgQ = 0;

  // info() → { day, moments, gold, matchDay, daysLeft, next (boxeur), title, coach, stats, locked:{train,door} }
  HB.enter = function (ch, info, onSpot) {
    const keepX = S && S.ch === ch ? S.x : 640;
    S = { ch, info, onSpot, x: keepX, vx: 0, t: 0, near: null, banner: null, keys: { l: false, r: false } };
  };
  HB.state = () => S;
  HB.banner = (text, sub, col) => { if (S && typeof text === 'string' && text.trim()) S.banner = { text, sub, col: col || '#ffd54f', t: 0 }; };
  HB.keydown = function (e) {
    if (!S) return false;
    if(e.code==='KeyV'&&!e.repeat){AU.play('select');S.onSpot('stats');return true;}
    if (e.code === 'KeyC' && !e.repeat) { AU.play('select'); S.onSpot('calendar'); return true; }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { S.keys.l = true; return true; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { S.keys.r = true; return true; }
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) { if (S.near) { AU.play('select'); S.onSpot(S.near.id); } return true; }
    return false;
  };
  HB.keyup = function (e) { if (!S) return; if (e.code === 'ArrowLeft' || e.code === 'KeyA') S.keys.l = false; if (e.code === 'ArrowRight' || e.code === 'KeyD') S.keys.r = false; };
  HB.clearKeys = () => { if (S) S.keys.l = S.keys.r = false; };
  HB.click = function (x, y) { // clic dans la scène (coordonnées 1280×720)
    if (!S) return;
    if(x>=10&&x<=326&&y>=10&&y<=134){AU.play('select');S.onSpot('stats');return;}
    if (x >= 393 && x <= 570 && y >= 255 && y <= 403) { AU.play('select'); S.onSpot('calendar'); return; }
    const sp = HB.SPOTS.find(s => Math.abs(s.x - x) < s.w / 2 && y > 120 && y < 700);
    if (sp) { S.target = sp.x; S.clickSpot = sp; }
  };

  HB.update = function (dt) {
    if (!S) return;
    S.t += dt; if (S.banner) { S.banner.t += dt; if (S.banner.t > 3) S.banner = null; }
    let dir = (S.keys.r ? 1 : 0) - (S.keys.l ? 1 : 0);
    if (!dir && S.target != null) { const d = S.target - S.x; if (Math.abs(d) < 8) { S.target = null; if (S.clickSpot) { const sp = S.clickSpot; S.clickSpot = null; AU.play('select'); S.onSpot(sp.id); } } else dir = Math.sign(d); }
    if (dir) S.target = dir && (S.keys.l || S.keys.r) ? null : S.target;
    if (dir && Math.floor(S.t * 3.5) !== Math.floor((S.t - dt) * 3.5)) AU.play('step');
    S.vx = dir * 400; S.x = Math.max(60, Math.min(W - 50, S.x + S.vx * dt));
    let near = null, best = 1e9;
    for (const sp of HB.SPOTS) { const d = Math.abs(sp.x - S.x); if (d < sp.w / 2 && d < best) { best = d; near = sp; } }
    S.near = near;
  };

  // ---------- Décor fixe (pré-rendu) ----------
  // Petits éléments partagés : métal peint, panneaux et tracés en perspective.
  function panel(g, x, y, w, h, color, radius = 4) {
    g.fillStyle = color; A.rr(g, x, y, w, h, radius); g.fill();
  }
  function line(g, points, color, width = 2) {
    g.strokeStyle = color; g.lineWidth = width; g.beginPath();
    points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  }
  function label(g, text, x, y, size = 13, color = '#e9d8b7') {
    g.font = size + 'px Bungee, Impact'; g.textAlign = 'center'; g.fillStyle = color; g.fillText(text, x, y);
  }
  function bgCanvas(q) {
    const c = document.createElement('canvas'); c.width = W * q; c.height = H * q; const g = c.getContext('2d'); g.scale(q, q);
    // Ancien entrepôt reconverti : briques, poutres, soubassement peint.
    g.fillStyle = '#312a29'; g.fillRect(0, 0, W, 510);
    const bricks = ['#785348', '#80584b', '#6d4b43', '#855d4e', '#735047'];
    for (let row = 0; row < 17; row++) for (let col = -1; col < 22; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 30;
      g.fillStyle = bricks[((col + 22) * 13 + row * 7) % bricks.length]; g.fillRect(x + 2, y + 2, 60, 26);
      g.fillStyle = 'rgba(255,226,183,.06)'; g.fillRect(x + 3, y + 3, 58, 2);
    }
    let gr = g.createLinearGradient(0, 120, 0, 510); gr.addColorStop(0, 'rgba(14,22,28,.5)'); gr.addColorStop(.55, 'rgba(14,22,28,.06)'); gr.addColorStop(1, 'rgba(14,22,28,.5)'); g.fillStyle = gr; g.fillRect(0, 0, W, 510);
    panel(g, 0, 408, W, 102, '#273d40', 0); panel(g, 0, 408, W, 7, '#b7a57f', 0);
    for (const x of [16, 355, 895, 1148]) {
      panel(g, x, 0, 15, 510, '#263136', 0); panel(g, x + 2, 0, 3, 510, '#526064', 0);
      for (const y of [142, 390, 482]) { g.fillStyle = '#89918b'; g.beginPath(); g.arc(x + 8, y, 2, 0, 7); g.fill(); }
    }
    panel(g, 0, 134, W, 16, '#202a2f', 0); panel(g, 0, 136, W, 3, '#66706b', 0);
    // Conduits et luminaires suspendus.
    panel(g, 0, 111, W, 5, '#85908b', 0);
    for (const x of [160, 735, 1020]) {
      line(g, [[x, 145], [x, 165]], '#111c22', 4);
      gr = g.createLinearGradient(0, 174, 0, 535); gr.addColorStop(0, 'rgba(255,222,158,.1)'); gr.addColorStop(1, 'rgba(255,222,158,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 44, 174); g.lineTo(x + 44, 174); g.lineTo(x + 170, 535); g.lineTo(x - 170, 535); g.fill();
      panel(g, x - 60, 165, 120, 12, '#17252b'); panel(g, x - 53, 176, 106, 4, '#ffe7ad', 2);
    }
    // Enseigne émaillée et devise du club.
    panel(g, 358, 23, 544, 79, '#101e25', 7);
    g.strokeStyle = '#bca16b'; g.lineWidth = 2; A.rr(g, 365, 30, 530, 65, 4); g.stroke();
    label(g, 'K.O. EN FAMILLE', 630, 66, 33, '#f2dfb7');
    label(g, 'CLUB DE BOXE  •  PETITS GANTS, GRAND COURAGE', 630, 86, 10, '#c79f6c');
    // Sol en caoutchouc : joints fuyants et allée de circulation au premier plan.
    gr = g.createLinearGradient(0, 500, 0, H); gr.addColorStop(0, '#263438'); gr.addColorStop(1, '#465153'); g.fillStyle = gr; g.fillRect(0, 500, W, 220);
    for (let x = -640; x <= 1920; x += 128) line(g, [[640 + (x - 640) * .55, 500], [x, 720]], '#1f2c30', 2);
    for (const y of [520, 553, 596, 653, 717]) line(g, [[0, y], [W, y]], 'rgba(12,23,27,.4)', 2);
    for (let i = 0; i < 950; i++) {
      g.fillStyle = i % 2 ? 'rgba(238,228,194,.035)' : 'rgba(0,0,0,.06)'; g.fillRect((i * 137) % W, 505 + (i * 53) % 215, 2, 1);
    }
    line(g, [[0, 605], [1280, 605]], '#b09a67', 3);
    // Zone des sacs : tapis, miroir et rack de poids.
    panel(g, 48, 498, 285, 65, '#18262c', 3);
    line(g, [[58, 507], [324, 507], [324, 553], [58, 553], [58, 507]], '#7c6550', 2);
    panel(g, 48, 198, 281, 190, '#18282e');
    gr = g.createLinearGradient(48, 198, 329, 388); gr.addColorStop(0, '#52696c'); gr.addColorStop(.45, '#8ba09b'); gr.addColorStop(1, '#465b60'); g.fillStyle = gr; g.fillRect(55, 205, 267, 176);
    line(g, [[72, 376], [170, 210], [200, 210], [102, 376]], 'rgba(221,238,226,.13)', 13);
    line(g, [[188, 205], [188, 381]], '#344b50', 3);
    label(g, 'TRAVAIL • DISCIPLINE • RESPECT', 188, 398, 9, '#b6c3b9');
    for (const x of [63, 213]) { panel(g, x, 465, 9, 45, '#111d23'); }
    panel(g, 55, 466, 180, 7, '#8a9693');
    for (let i = 0; i < 5; i++) {
      const x = 76 + i * 32; line(g, [[x - 12, 452], [x + 12, 452]], '#adb7ae', 5);
      panel(g, x - 15, 443, 8, 18, '#17242b', 2); panel(g, x + 7, 443, 8, 18, '#17242b', 2);
    }
    // Tableau de liège, fixé au mur (contenu variable ajouté au rendu).
    panel(g, 377, 147, 206, 256, '#17262b'); panel(g, 383, 153, 194, 244, '#937149');
    panel(g, 390, 160, 180, 230, '#b89560', 0);
    for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(75,47,26,.16)'; g.fillRect(392 + i * 37 % 176, 162 + i * 53 % 226, 2, 2); }
    panel(g, 402, 128, 155, 24, '#19282c'); label(g, 'LES COMBATS', 480, 145, 12);
    // Banc de vestiaire sous le tableau, casiers et serviette.
    for (let i = 0; i < 3; i++) {
      const x = 380 + i * 64; panel(g, x, 424, 58, 102, '#435b5d', 3);
      line(g, [[x + 3, 426], [x + 55, 426], [x + 55, 523]], '#6f8280', 1);
      for (let k = 0; k < 3; k++) panel(g, x + 15, 434 + k * 5, 27, 2, '#233d42', 0);
      panel(g, x + 44, 471, 4, 13, '#b4b4a1', 1); label(g, '0' + (i + 1), x + 28, 495, 10, '#b7c5ba');
    }
    panel(g, 366, 523, 220, 11, '#9e704b', 2); panel(g, 372, 534, 208, 7, '#5e4433', 1);
    for (const x of [383, 557]) panel(g, x, 541, 8, 25, '#17272d', 1);
    panel(g, 512, 515, 39, 25, '#d4c7a6', 2); line(g, [[518, 517], [518, 540]], '#b1463a', 3);
    // Ring d’entraînement surélevé, avec coins, tendeurs et trois cordes.
    g.fillStyle = 'rgba(0,0,0,.24)'; A.ell(g, 745, 538, 156, 23); g.fill();
    g.fillStyle = '#86958d'; g.beginPath(); g.moveTo(635, 424); g.lineTo(845, 424); g.lineTo(887, 488); g.lineTo(595, 488); g.closePath(); g.fill();
    panel(g, 595, 488, 292, 38, '#233c4b', 1); panel(g, 595, 488, 292, 6, '#e0c99d', 0);
    label(g, 'LE COIN DES CHAMPIONS', 741, 514, 12, '#d7c5a1');
    for (const [x, y, col] of [[635, 424, '#a83c33'], [845, 424, '#376985'], [595, 488, '#a83c33'], [887, 488, '#376985']]) {
      panel(g, x - 4, y - 112, 8, 122, '#a5aaa0', 2); panel(g, x - 8, y - 105, 16, 65, col, 5);
      for (let k = 0; k < 3; k++) panel(g, x - 9, y - 99 + k * 25, 18, 4, '#d1cbbb', 1);
    }
    for (let i = 0; i < 3; i++) {
      const col = ['#b74c3e', '#d6d5bf', '#437b93'][i], dy = -94 + i * 25;
      line(g, [[635, 424 + dy], [845, 424 + dy], [887, 488 + dy]], col, 4);
      line(g, [[635, 424 + dy], [595, 488 + dy], [887, 488 + dy]], 'rgba(0,0,0,.28)', 7);
      line(g, [[635, 423 + dy], [595, 487 + dy], [887, 487 + dy]], col, 4);
    }
    for (let i = 0; i < 3; i++) { panel(g, 607 - i * 8, 526 + i * 10, 45 + i * 8, 10, '#596562', 1); }
    // Horloge analogique et tableau du coach au-dessus du ring.
    g.fillStyle = '#18282e'; g.beginPath(); g.arc(862, 202, 25, 0, 7); g.fill();
    g.fillStyle = '#e5d7b9'; g.beginPath(); g.arc(862, 202, 21, 0, 7); g.fill();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; line(g, [[862 + Math.sin(a) * 16, 202 - Math.cos(a) * 16], [862 + Math.sin(a) * 19, 202 - Math.cos(a) * 19]], '#344345', 2); }
    line(g, [[862, 187], [862, 202], [872, 209]], '#9f4836', 2);
    panel(g, 642, 300, 181, 27, '#172b30'); label(g, 'ÉCOUTE TON COACH', 732, 318, 11);
    // Comptoir de la boutique, étagères, fournitures et caisse.
    panel(g, 922, 201, 206, 232, '#1b2e32');
    for (const y of [277, 355, 428]) { panel(g, 916, y, 218, 9, '#a77d50', 2); panel(g, 920, y + 9, 210, 5, '#332b25', 1); }
    for (let i = 0; i < 4; i++) A.glove(g, 944 + i * 52, 253, .56, ['#a53831', '#336b8c', '#242b2a', '#ba9243'][i], 1, false, 0);
    for (let i = 0; i < 5; i++) {
      const x = 938 + i * 39; panel(g, x, 314, 21, 38, ['#6c9b9c', '#d5b66b', '#c77958'][i % 3], 4); panel(g, x + 6, 309, 9, 6, '#d9d6bb', 1); panel(g, x + 3, 329, 15, 12, '#e9dcbc', 1);
      panel(g, x - 2, 393, 27, 30, '#bbad8b', 2); label(g, '+', x + 11, 415, 16, '#9e453b');
    }
    panel(g, 932, 163, 188, 29, '#b29660'); label(g, 'CHEZ GILLES', 1026, 183, 17, '#182b30');
    g.fillStyle = 'rgba(0,0,0,.25)'; A.ell(g, 1020, 552, 119, 16); g.fill();
    panel(g, 918, 470, 218, 78, '#70543d', 2);
    for (let x = 924; x < 1136; x += 28) line(g, [[x, 477], [x, 544]], '#59432f', 2);
    panel(g, 910, 459, 233, 13, '#b49468', 3); panel(g, 916, 472, 221, 4, '#3f3429', 1);
    panel(g, 1062, 438, 49, 21, '#263a3d', 3); panel(g, 1071, 418, 31, 22, '#1b2d33', 3); panel(g, 1075, 422, 23, 12, '#a6b391', 1);
    panel(g, 948, 486, 113, 41, '#23383c'); label(g, 'ÉQUIPEMENT', 1005, 504, 10); label(g, '& CONSEILS', 1005, 519, 10);
    // Porte de sortie et tapis brosse.
    panel(g, 1161, 285, 109, 261, '#17272c', 2); panel(g, 1170, 294, 91, 246, '#4a6261', 1);
    panel(g, 1179, 307, 73, 106, '#21383e', 2); panel(g, 1185, 313, 61, 94, '#879e98', 1);
    line(g, [[1188, 399], [1238, 318]], 'rgba(240,234,201,.12)', 9);
    panel(g, 1179, 432, 73, 92, '#3d5656', 1); panel(g, 1237, 427, 5, 24, '#d0b479', 1);
    panel(g, 1177, 254, 80, 23, '#406b52', 3); label(g, 'SORTIE', 1217, 271, 12, '#e2ead1');
    panel(g, 1158, 547, 115, 29, '#1b2c30', 2);
    for (let y = 553; y < 572; y += 5) line(g, [[1163, y], [1267, y]], '#425250', 2);
    // Repères des cinq destinations, alignés sur les zones de déplacement.
    for (const [x, text] of [[200, '01 / ENTRAÎNEMENT'], [480, '02 / COMBATS'], [735, '03 / COACH'], [1010, '04 / BOUTIQUE'], [1215, '05 / SORTIE']]) {
      label(g, text, x, 592, x === 1215 ? 9 : 10, '#bcb89d');
    }
    // Vignette légère : le centre du gym reste chaleureux.
    gr = g.createRadialGradient(640, 340, 270, 640, 340, 800); gr.addColorStop(0, 'rgba(5,14,20,0)'); gr.addColorStop(1, 'rgba(5,14,20,.36)'); g.fillStyle = gr; g.fillRect(0, 110, W, 610);
    return c;
  }
  function drawEquipment(ctx, T) {
    // Les chaînes restent attachées à la poutre pendant le balancement du sac.
    ctx.save(); ctx.translate(126, 157); ctx.rotate(Math.sin(T * .8) * .025);
    for (const sd of [-1, 1]) line(ctx, [[0, 0], [sd * 25, 78]], '#a8ada2', 2);
    let gr = ctx.createLinearGradient(-38, 0, 38, 0); gr.addColorStop(0, '#632c2a'); gr.addColorStop(.35, '#b54a3b'); gr.addColorStop(.7, '#8e352f'); gr.addColorStop(1, '#512925');
    panel(ctx, -39, 76, 78, 226, gr, 22);
    panel(ctx, -39, 100, 78, 11, '#302a29', 1); panel(ctx, -39, 263, 78, 11, '#302a29', 1);
    line(ctx, [[25, 116], [25, 255]], 'rgba(228,152,113,.24)', 2);
    label(ctx, 'K.O.', 0, 177, 20, '#ead7b3'); label(ctx, 'CLUB', 0, 194, 10, '#d7b697');
    ctx.restore();
    // Poire sur sa plateforme et corde à sauter accrochée au mur.
    panel(ctx, 222, 235, 94, 11, '#ab8259', 3); panel(ctx, 301, 201, 8, 34, '#1e3035', 1);
    line(ctx, [[269, 246], [269, 265]], '#b2b8ac', 2);
    ctx.save(); ctx.translate(269, 270); ctx.rotate(Math.sin(T * 1.5) * .055);
    ctx.fillStyle = '#9f4034'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.bezierCurveTo(17, 5, 23, 23, 0, 30); ctx.bezierCurveTo(-23, 23, -17, 5, 0, -7); ctx.fill();
    line(ctx, [[0, -2], [0, 25]], '#cb8565', 1); ctx.restore();
    ctx.strokeStyle = '#c6ab6c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(283, 334); ctx.bezierCurveTo(254, 440, 325, 440, 302, 334); ctx.stroke();
    panel(ctx, 278, 329, 7, 28, '#1e3035', 2); panel(ctx, 300, 329, 7, 28, '#1e3035', 2);
  }
  HB.background = function (q) { if (!bg || bgQ !== q) { bg = bgCanvas(q); bgQ = q; } return bg; };

  HB.render = function (ctx, q) {
    if (!S) return;
    const inf = S.info(), T = S.t;
    ctx.drawImage(HB.background(q), 0, 0, W, H);
    // Fenêtres : la couleur du ciel suit le moment de la journée
    const sky = inf.matchDay ? ['#ffb74d', '#ff7043'] : [['#0d1b3e', '#283593'], ['#ff8a65', '#ffb74d'], ['#4fc3f7', '#b3e5fc'], ['#81d4fa', '#e1f5fe']][Math.max(0, Math.min(3, inf.moments))];
    const wx = 642, wy = 203, ww = 178, wh = 83;
    const glass = ctx.createLinearGradient(0, wy, 0, wy + wh); glass.addColorStop(0, sky[0]); glass.addColorStop(1, sky[1]);
    panel(ctx, wx - 6, wy - 6, ww + 12, wh + 12, '#1b2d33', 2);
    panel(ctx, wx, wy, ww, wh, glass, 0);
    // Silhouettes de la ville à travers la verrière.
    for (let i = 0; i < 9; i++) { const h = 12 + i * 17 % 36; panel(ctx, wx + i * 20, wy + wh - h, 18, h, 'rgba(33,64,76,.25)', 0); }
    for (let i = 1; i < 4; i++) line(ctx, [[wx + i * ww / 4, wy], [wx + i * ww / 4, wy + wh]], '#263d43', 4);
    line(ctx, [[wx, wy + 39], [wx + ww, wy + 39]], '#263d43', 4);
    drawEquipment(ctx, T);
    // Un repère discret indique la station à portée du joueur.
    if (S.near) {
      ctx.save(); ctx.globalAlpha = .12 + Math.sin(T * 3) * .03;
      ctx.fillStyle = '#eac37b'; A.ell(ctx, S.near.x, FLOOR + 19, S.near.w * .4, 14); ctx.fill(); ctx.restore();
    }
    // Tableau des combats : affiche du prochain adversaire + calendrier
    if (inf.next) {
      const pc = A.portrait(inf.next, 192, S.ch.id);
      ctx.fillStyle = '#fafafa'; ctx.save(); ctx.translate(430, 209); ctx.rotate(-.05); ctx.fillRect(-36, -44, 86, 88); ctx.drawImage(pc, -30, -40, 72, 64); ctx.fillStyle = '#c62828'; ctx.font = '11px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText(inf.next.nick.toUpperCase().slice(0, 14), 7, 37); ctx.restore();
    }
    drawCalendar(ctx, inf);
    if (inf.matchDay) { ctx.save(); ctx.globalAlpha = .5 + Math.sin(T * 6) * .4; ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 6; ctx.strokeRect(374, 144, 212, 262); ctx.restore(); }
    // Coach
    if (inf.coach) {
      ctx.fillStyle = 'rgba(0,0,0,.23)'; A.ell(ctx, 780, FLOOR + 7, 43, 9); ctx.fill();
      A.playerFront(ctx, inf.coach, 780, FLOOR + 8, .5, T * .6);
    }
    // Zones barrées le jour du combat
    if (inf.locked.train) tape(ctx, 200, 'JOUR DE COMBAT');
    if (inf.locked.door) tape(ctx, 1215, 'PAS AUJOURD’HUI', .45);
    // Boxeur
    const bob = S.vx ? Math.abs(Math.sin(T * 12)) * 8 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; A.ell(ctx, S.x, FLOOR + 22, 60 * A.childScale(S.ch), 10 * A.childScale(S.ch)); ctx.fill();
    A.playerFront(ctx, S.ch, S.x, FLOOR + 20 - bob, .62, T);
    // Invitation
    if (S.near) {
      const sp = S.near, lock = inf.locked[sp.id];
      const txt = lock ? (sp.id === 'train' ? 'Fermé : c’est jour de combat !' : 'Ton combat est aujourd’hui !') : '⏎ Entrée : ' + sp.verb;
      ctx.save(); ctx.font = '900 24px Nunito'; const w = ctx.measureText(txt).width + 40, x = Math.max(w / 2 + 10, Math.min(W - w / 2 - 10, S.x)), y = H - 34;
      ctx.fillStyle = lock ? 'rgba(198,40,40,.95)' : 'rgba(10,6,30,.9)'; A.rr(ctx, x - w / 2, y - 26, w, 52, 16); ctx.fill(); ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 1);
      ctx.font = '900 18px Nunito'; ctx.fillStyle = '#ffd54f'; ctx.lineWidth = 4; ctx.strokeStyle = '#140a26'; ctx.strokeText(sp.name, x, y - 40); ctx.fillText(sp.name, x, y - 40);
      ctx.restore();
    }
    drawHud(ctx, inf, T);
    if (S.banner) {
      const b = S.banner, a = Math.min(1, b.t * 4, (3 - b.t) * 2);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(5,3,15,.75)'; ctx.fillRect(0, 250, W, 170);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '76px Bungee, Impact'; ctx.lineWidth = 10; ctx.strokeStyle = '#140a26'; ctx.strokeText(b.text, 640, 315); ctx.fillStyle = b.col; ctx.fillText(b.text, 640, 315);
      if (b.sub) { ctx.fillStyle = '#fff'; ctx.font = '900 28px Nunito'; ctx.fillText(b.sub, 640, 382, 1200); }
      ctx.restore();
    }
  };
  function drawCalendar(ctx, inf) {
    const page = Math.floor((inf.day - 1) / 30), first = page * 30 + 1, offset = page * 30 % 7;
    const x = 396, y = 257, cw = 24, rh = 17, rows = Math.ceil((30 + offset) / 7);
    ctx.save();
    panel(ctx, 491, 174, 72, 70, '#f7eedb', 1); panel(ctx, 491, 174, 72, 19, '#9e4036', 1);
    label(ctx, 'JOUR', 527, 188, 11, '#fff9eb'); label(ctx, String(inf.day), 527, 223, 25, '#24353a');
    label(ctx, inf.matchDay ? 'COMBAT !' : 'AUJOURD’HUI', 527, 238, 7, inf.matchDay ? '#a33c31' : '#56615d');
    panel(ctx, x - 3, y - 2, 174, 25 + rows * rh + 13, '#faf3de', 1);
    panel(ctx, x - 3, y - 2, 174, 19, '#2c4b51', 1); label(ctx, 'MOIS ' + (page + 1), x + 81, y + 12, 10, '#f3e2bc');
    for (let col = 0; col < 7; col++) label(ctx, ['L', 'M', 'M', 'Z', 'V', 'S', 'D'][col], x + col * cw + 10, y + 27, 8, '#57605b');
    const fightDays = new Set(inf.fightDays || [inf.fightDay]);
    for (let d = 0; d < 30; d++) {
      const day = first + d, cell = d + offset, xx = x + cell % 7 * cw, yy = y + 32 + Math.floor(cell / 7) * rh;
      const isFight = fightDays.has(day), today = day === inf.day;
      panel(ctx, xx, yy, cw - 3, rh - 2, isFight ? '#b4493a' : day < inf.day ? '#e0d8c3' : '#efe6cf', 2);
      label(ctx, String(d + 1), xx + 10, yy + 10, 8, isFight ? '#fff5d8' : '#3e4b47');
      if (isFight) { ctx.fillStyle = '#ffe4a0'; A.star(ctx, xx + 17, yy + 4, 3.2); ctx.fill(); }
      if (day < inf.day) { line(ctx, [[xx + 4, yy + 2], [xx + 17, yy + 12]], '#994537', 1.5); line(ctx, [[xx + 17, yy + 2], [xx + 4, yy + 12]], '#994537', 1.5); }
      if (today) { ctx.strokeStyle = '#e7b34e'; ctx.lineWidth = 2; A.rr(ctx, xx - 1, yy - 1, cw - 1, rh, 2); ctx.stroke(); }
    }
    label(ctx, 'X TERMINÉ  •  ★ COMBAT', x + 82, y + 40 + rows * rh, 7, '#664c3b');
    ctx.restore();
  }
  function tape(ctx, x, txt, k = 1) {
    ctx.save(); ctx.translate(x, 400); ctx.scale(k, k);
    for (const r of [-.35, .35]) { ctx.save(); ctx.rotate(r); ctx.fillStyle = '#ffd600'; ctx.fillRect(-170, -16, 340, 32); ctx.fillStyle = '#212121'; for (let i = -170; i < 170; i += 40) { ctx.beginPath(); ctx.moveTo(i, -16); ctx.lineTo(i + 20, -16); ctx.lineTo(i + 4, 16); ctx.lineTo(i - 16, 16); ctx.fill(); } ctx.restore(); }
    ctx.fillStyle = '#c62828'; A.rr(ctx, -130, -26, 260, 52, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '22px Bungee, Impact'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 1);
    ctx.restore();
  }
  function coin(ctx, x, y, r) { ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe082'; ctx.beginPath(); ctx.arc(x, y, r * .7, 0, 7); ctx.fill(); ctx.fillStyle = '#ff8f00'; ctx.font = '900 ' + r + 'px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x, y + 1); }
  HB.coin = coin;
  function drawHud(ctx, inf, T) {
    ctx.save();
    ctx.translate(0, -86); ctx.fillStyle = 'rgba(10,6,30,.82)'; A.rr(ctx, 10, 96, 316, 124, 16); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff'; ctx.font = '24px Bungee, Impact'; ctx.fillText('JOUR ' + inf.day, 30, 130);
    // Moments de la journée
    for (let i = 0; i < BX.MOMENTS; i++) { const on = inf.debug || (i < inf.moments && !inf.matchDay); ctx.fillStyle = on ? '#ffd54f' : 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.arc(150 + i * 26, 121, 10, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#d1c4e9'; ctx.font = '800 14px Nunito'; ctx.fillText(inf.debug ? '∞ debug' : inf.matchDay ? 'combat !' : 'moments', 228, 126);
    coin(ctx, 40, 165, 14); ctx.fillStyle = '#ffe082'; ctx.font = '900 24px Nunito'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(inf.gold + ' or', 62, 174);
    ctx.fillStyle = '#fff'; ctx.font = '900 13px Nunito'; ctx.fillText('💪' + inf.stats.force + ' ⚡' + inf.stats.vitesse + ' ❤️' + inf.stats.stamina + ' 🛡️' + inf.stats.defense + ' 🌬️' + inf.stats.souffle, 150, 172);
    ctx.fillStyle='#f1d18a';ctx.font='900 13px Nunito';ctx.textAlign='left';ctx.fillText('NIV. '+inf.level+' · '+inf.exp+' XP · ★ '+inf.statPoints+' points  [V]',28,207);
    // Prochain combat
    ctx.fillStyle = 'rgba(10,6,30,.82)'; A.rr(ctx, W - 326, 96, 316, 96, 16); ctx.fill();
    ctx.textAlign = 'right'; ctx.fillStyle = '#d1c4e9'; ctx.font = '800 16px Nunito'; ctx.fillText(inf.pending ? 'Ligue des Titans terminée' : inf.title ? 'Défense du titre contre' : 'Prochain combat', W - 30, 124);
    ctx.fillStyle = '#fff'; ctx.font = '22px Bungee, Impact'; ctx.fillText(inf.next ? inf.next.nick.toUpperCase() : '—', W - 30, 152);
    const blink = inf.matchDay && (T * 3 | 0) % 2;
    ctx.fillStyle = inf.matchDay ? (blink ? '#ffd54f' : '#ff5252') : '#81c784'; ctx.font = '900 20px Nunito'; ctx.fillText(inf.pending ? 'Champion · repos mérité' : inf.debug ? 'Combat facultatif · debug' : inf.matchDay ? '🔔 AUJOURD’HUI ! (tableau)' : 'dans ' + inf.daysLeft + ' jour' + (inf.daysLeft > 1 ? 's' : ''), W - 30, 180);
    ctx.translate(0, 86); if (!S.near) { ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 16px Nunito'; ctx.fillText('← → marcher · Entrée : entrer · C : calendrier · V : statistiques · Échap : changer de boxeur', 640, H - 14); }
    ctx.restore();
  }
})(window);
