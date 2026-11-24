// Goblin Malin — la grotte du nid. Certains jours (pas souvent), une gueule de pierre s'ouvre au milieu du nid d'araignées.
// Dedans : un petit donjon de roche, cinq salles reliées par des couloirs, des araignées partout, des trésors dans les recoins,
// et tout au fond la reine des araignées. Même porte que la crypte : dehors, le temps s'arrête ; on ressort où l'on était.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, Ar = CG.Arene, Py = CG.Pyramide, Mo = CG.Mondes, T = CG.TILE, MW = CG.MW, MH = CG.MH, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  if (!Ar || !Py || !Mo) return;
  const Gn = CG.GrotteNid = { CHANCE: 0.15, JOUR: 3, SALLES: 5, REINE_VIE: 6, REINE_DMG: 1.5, VOIT: 250, ID: 'grotteNid', BOIS: 'boisLoups', TRONE: 0.25, NOIR: 0.8, LAVE_DMG: 4, LAVE_JOUR: 0.4, LAVE_TIC: 0.5, GLISSE: 2.5 }; /* GLISSE : la glace du château. Plus le chiffre est petit, plus ça glisse */ /* la lave brûle le chef qui marche dedans : LAVE_DMG + LAVE_JOUR par jour, à chaque LAVE_TIC seconde */ /* TRONE : chance de la grande salle au tapis rouge, avec son chef ; NOIR : force de l'obscurité autour du chef */
  // deux sortes de donjon : 'nid' (la grotte des araignées) et 'chateau' (là où mènent les demandes d'aide : un vieux château sombre, éclairé aux torches)
  const mode = () => { if (!Ar.dans()) return null; const id = CG.S.arene.id; return id === Gn.ID || id === Gn.BOIS ? 'nid' : Ar.Q[id] && Ar.Q[id].donjon ? (Ar.Q[id].theme === 'lave' ? 'lave' : Ar.Q[id].theme === 'glace' ? 'glace' : Ar.Q[id].theme === 'eau' ? 'eau' : 'chateau') : null; };
  const ici = () => mode() === 'nid', dedans = () => !!mode();
  Gn.mode = mode;
  // le bois des loups (boisloups.js) : le même donjon que la grotte du nid, mais dehors, entre les arbres, et plein de loups
  const bois = () => Ar.dans() && CG.S.arene.id === Gn.BOIS; Gn.bois = bois;
  // la montagne de feu : une autre demande d'aide. Un donjon de roche noire au milieu de la lave ; au fond, l'apprenti du forgeron dans sa cage.
  Ar.Q.forge = { mondes: [0, 1], qui: 'Borik, forgeron nain', role: 'nomade', look: 'nainQ', lieu: 'La montagne de feu', titre: 'La montagne de feu', theme: 'lave', chef: ['demon', 'Le maître des braises'], sauve: { qui: 'L\'apprenti de Borik', look: 'nainQ' },
    texte: '« Ma forge est au cœur de la montagne de feu, peau verte. Des diablotins sont entrés par les coulées de lave, et ils ont enfermé mon apprenti dans une cage, tout au fond. Moi, j\'ai les genoux qui tremblent. Tu irais le chercher ? »',
    merci: '« Mon apprenti ! Entier, et même pas roussi. Tiens : de l\'or fondu de la montagne. »',
    sub: 'Un portail t\'emmène dans « La montagne de feu » : de la roche noire au milieu de la lave, pleine de monstres. Brise la cage à coups de bâton, puis ramène l\'apprenti jusqu\'à l\'entrée. Tu reviendras ici même après.',
    entree: 'Le cœur d\'une montagne, avec de la lave partout. L\'apprenti est dans une cage, tout au fond : brise-la à coups de bâton, puis ramène-le ici, à l\'entrée. Dehors, le temps s\'est arrêté.',
    E: [['diablotin', 'diablotin', 'diablotinLance', 'molosseCornu'], ['diablotin', 'diablotinLance', 'diablotinLance', 'molosseCornu', 'cerbere'], ['demon', 'cerbere', 'diablotin', 'diablotinLance', 'cerbere3']] };
  // le château de glace : les elfes demandent de l'aide contre les elfes noirs, qui vivent dans la neige. Mêmes oreilles pointues, peau très sombre, parfois bleutée.
  CG.ENEMIES.elfeNoir = { nom: 'Elfe noir', race: 'elfeNoir', hp: 30, dmg: 6, spd: 92, xp: 14, or: 7, cost: 3, look: { tunic: '#2a2440', legs: '#1a1830', weapon: 'epee' } };
  CG.ENEMIES.elfeNoirArcher = { nom: 'Archère elfe noire', race: 'elfeNoir', hp: 22, dmg: 5, spd: 80, xp: 14, or: 7, cost: 3, range: 240, look: { tunic: '#1e3450', legs: '#16223a', weapon: 'arc', hood: true } };
  CG.ENEMIES.elfeNoirGarde = { nom: 'Garde elfe noir', race: 'elfeNoir', hp: 60, dmg: 9, spd: 74, xp: 30, or: 14, cost: 5, r: 15, look: { tunic: '#3a3a5a', legs: '#20203a', weapon: 'epee', armor: true, cape: '#22388a' } };
  Gn.PEAUX = ['#4a3c56', '#3a3046', '#56465e', '#3e5a8e', '#4a6aa6']; /* trois peaux très sombres, deux bleutées */
  { const ae = Art.enemy; Art.enemy = function (g, e, t) { const d = CG.ENEMIES[e.type]; if (!d || d.race !== 'elfeNoir' || e.struct) return ae.apply(this, arguments);
    const n = Math.floor((e.seed || 0) * 7) % Gn.PEAUX.length, skin = Gn.PEAUX[n]; Art.humanoid(g, Object.assign({ x: e.x, y: e.y, face: e.face, t: t + e.seed, moving: e.moving, step: e.step, atk: e.atkAnim, angry: !e.calm }, d.look, { skin, sleeve: skin, hair: n % 2 ? '#e8ecf6' : '#c8d0e8', longHair: true, ears: true, eye: '#ff5a7a', s: d.r > 14 ? 1.18 : 1.08 })); }; }
  Ar.Q.elfesNoirs = { mondes: [0], qui: 'Aëlis, éclaireuse elfe', role: 'nomade', look: 'elfeQ', lieu: 'Le château de glace', titre: 'Le château de glace', theme: 'glace', chef: ['elfeNoirGarde', 'Le seigneur des glaces'],
    texte: '« Chef gobelin, les elfes noirs sont descendus de leur château de glace. Ils ont pris trois des nôtres, et le froid de là-haut nous engourdit les doigts sur la corde de l\'arc. Toi, le froid ne te fait rien, dit-on. Irais-tu les déloger ? »',
    merci: '« Leur château est vide, et les nôtres sont rentrés. Les elfes n\'oublient pas, chef. »',
    sub: 'Un portail t\'emmène au « Château de glace » : des salles gelées, dans la neige, pleines d\'elfes noirs. Tu reviendras ici même après le combat.',
    entree: 'Un château taillé dans la glace, au milieu de la neige. Les elfes noirs y vivent. Avance de salle en salle et bats-les tous. Dehors, le temps s\'est arrêté.',
    E: [['elfeNoir', 'elfeNoir', 'elfeNoirArcher', 'elfeNoirArcher'], ['elfeNoir', 'elfeNoir', 'elfeNoirArcher', 'elfeNoirArcher', 'elfeNoirGarde'], ['elfeNoir', 'elfeNoirArcher', 'elfeNoirArcher', 'elfeNoirGarde', 'elfeNoirGarde', 'elfeNoir']] };
  Object.keys(Ar.Q).forEach(k => { const q = Ar.Q[k]; if (q.vagues || k === Gn.ID) return; q.donjon = true; if (q.entree) return; q.titre = 'Le vieux château'; q.entree = 'Un vieux château abandonné, froid et noir. Avance de salle en salle, d\'une torche à l\'autre. Dehors, le temps s\'est arrêté.'; });
  // ---------- l'entrée, au nid ----------
  Gn.pos = function () { const P = W.POI && W.POI.nid; if (!P) return null; for (let r = 0; r < 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = P.x + dx, y = P.y + dy; if (W.walkTile(x, y) && W.walkTile(x, y + 1)) return { x: x * T + T / 2, y: y * T + T / 2 }; } return null; };
  Gn.ouvert = function () { const S = CG.S; if (!S || Mo.ici() !== 0 || !(W.POI && W.POI.nid)) return false; if (!S.grotteNid || S.grotteNid.day !== S.day) S.grotteNid = { day: S.day, la: S.day >= Gn.JOUR && Math.random() < Gn.CHANCE, fait: false }; return S.grotteNid.la && !S.grotteNid.fait; };
  Ar.Q[Gn.ID] = { mondes: [], qui: 'La grotte du nid', lieu: 'La grotte des araignées', theme: 'grotte', vagues: true, E: [[], [], []],
    entree: 'Une grotte sombre, pleine de toiles et de cocons. La reine des araignées attend tout au fond. Dehors, le temps s\'est arrêté.',
    recompense(A) { const S = CG.S, p = S.player, d = S.day, or = 90 + 16 * d + (A.palier || 0) * 40, xp = 45 + 8 * d; if (S.grotteNid) S.grotteNid.fait = true;
      G.gain('or', or, p.x, p.y - 50); G.addXp(xp); S.morale = Math.min(100, S.morale + 4); let plus = ''; const id = Math.random() < 0.6 ? G.newScroll() : null; if (id) { G.giveScroll(id, p.x, p.y); plus = ' Et un parchemin, pris dans sa toile !'; }
      G.banner('La reine des araignées est tombée', 'La grotte se referme derrière toi. (+' + or + ' 🪙, +' + xp + ' XP, moral +4.)' + plus, '#e0d0ff'); CG.sfx('victory'); } };
  const gueule = { draw(g, o, t) { const x = o.x, y = o.y; t = t || 0;
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(x, y + 4, 40, 10, 0, 0, TAU); g.fill();
    const roc = (px, py, r, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(px - r, py); g.lineTo(px - r * 0.7, py - r * 1.1); g.lineTo(px + r * 0.2, py - r * 1.35); g.lineTo(px + r * 0.9, py - r * 0.8); g.lineTo(px + r, py); g.closePath(); g.fill(); };
    roc(x - 26, y + 4, 17, '#5c5a62'); roc(x + 27, y + 4, 18, '#55535b'); roc(x - 14, y - 22, 20, '#6a6870'); roc(x + 13, y - 24, 21, '#62606a'); roc(x, y - 36, 17, '#74727c'); roc(x - 31, y - 12, 13, '#4e4c54'); roc(x + 32, y - 12, 13, '#4a4850');
    g.fillStyle = '#0a0810'; g.beginPath(); g.moveTo(x - 17, y + 5); g.lineTo(x - 17, y - 16); g.quadraticCurveTo(x, y - 40, x + 17, y - 16); g.lineTo(x + 17, y + 5); g.closePath(); g.fill();
    g.fillStyle = 'rgba(150,90,220,' + (0.1 + Math.sin(t * 2) * 0.05) + ')'; g.beginPath(); g.ellipse(x, y - 10, 12, 16, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(240,244,255,0.6)'; g.lineWidth = 0.9; g.beginPath(); [[-17, -16, 6, -30], [-17, -16, -4, -4], [-17, -16, 2, -18], [17, -14, -6, -29], [17, -14, 5, -2], [17, -14, 0, -15]].forEach(q => { g.moveTo(x + q[0], y + q[1]); g.lineTo(x + q[2], y + q[3]); }); g.moveTo(x - 9, y - 26); g.quadraticCurveTo(x - 6, y - 16, x - 13, y - 8); g.moveTo(x + 8, y - 26); g.quadraticCurveTo(x + 5, y - 15, x + 12, y - 7); g.stroke();
    for (let i = 0; i < 2; i++) { const b = 0.5 + Math.sin(t * 1.3 + i * 2.6) * 0.5; if (b < 0.25) continue; g.fillStyle = 'rgba(255,60,60,' + b * 0.9 + ')'; const ex = x - 5 + i * 9, ey = y - 9 - i * 5; g.beginPath(); g.arc(ex, ey, 1.2, 0, TAU); g.arc(ex + 3.4, ey, 1.2, 0, TAU); g.fill(); } /* des yeux, au fond */
  } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (!Gn.ouvert()) return; const q = Gn.pos(); if (q && CG.onScreen(q.x, q.y)) push(q.y - 2, 21, Object.assign({ x: q.x, y: q.y }, gueule), null); }; }
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R; if (!R || R.ko > 0 || R.cine || R.build || !Gn.ouvert()) return it; const q = Gn.pos(), p = CG.S.player; if (!q) return it;
    if (Math.hypot(p.x - q.x, p.y - (q.y + 12)) < 48 && (!it || it.type !== 'visitor')) return { type: 'grotteNid', obj: { x: q.x, y: q.y - 20 }, label: 'Entrer dans la grotte des araignées' }; return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'grotteNid') return in0.apply(this, arguments);
    if (CG.R.enemies.some(e => !e.dead && e.target === CG.S.player && Math.hypot(e.x - CG.S.player.x, e.y - CG.S.player.y) < 240)) { CG.sfx('no'); return UI.toast('Pas avec des monstres sur le dos !'); } Ar.partir(Gn.ID); };
  // ---------- le plan du donjon : toujours le même pour une même graine ----------
  let planC = null, planS = null;
  function plan() {
    const seed = CG.S.arene.seed, cle = seed + '|' + CG.S.arene.id; if (planC && planS === cle) return planC; const rng = CG.makeRng(seed + 71), r0 = CG.makeRng(seed + 1), salles = [{ x0: Ar.CX - 5, y0: Ar.CY, w: 11, h: Ar.RY + 1 }], couloirs = [], recoins = [];
    const lave = mode() === 'lave', glace = mode() === 'glace', eau = mode() === 'eau', ch = mode() === 'chateau' || lave || glace || eau, Q = Ar.Q[CG.S.arene.id] || {}, tire = r0(), trone = ch && !!Q.chef && !!CG.ENEMIES[Q.chef[0]] && (r0() < Gn.TRONE || eau || !!Q.roi), NB = ch ? (trone ? 4 + Math.floor(tire * 2) : 4 + Math.floor(tire * 3)) : Gn.SALLES; /* le château : de quatre à six salles, jamais deux fois le même */
    for (let i = 1; i < NB; i++) { const p = salles[i - 1], fin = i === NB - 1, grand = fin && (!ch || trone), w = grand ? (ch ? 22 : 14) : (ch ? 7 : 8) + Math.floor(rng() * (ch ? 3 : 4)), h = grand ? (ch ? 9 : 11) : 6 + Math.floor(rng() * 4), gap = (ch ? 3 : 4) + Math.floor(rng() * (ch ? 2 : 3)), pcy = p.y0 + Math.floor(p.h / 2);
      const cy = CG.clamp(pcy + Math.round((rng() - 0.5) * 16), 13, MH - 14), s = { x0: p.x0 + p.w + gap, y0: cy - Math.floor(h / 2), w, h }; salles.push(s);
      couloirs.push({ x1: p.x0 + p.w - 1, y1: pcy, mx: p.x0 + p.w + Math.floor(gap / 2), x2: s.x0, y2: cy });
      if (!grand && rng() < 0.75) { const haut = rng() < 0.5, rx = s.x0 + 1 + Math.floor(rng() * (w - 5)), ry = haut ? s.y0 - 7 : s.y0 + h + 3; if (ry > 5 && ry + 4 < MH - 5) recoins.push({ x0: rx, y0: ry, w: 4, h: 4, cx: rx + 1, cy1: haut ? ry + 3 : s.y0 + h - 1, cy2: haut ? s.y0 : ry }); } }
    planC = { salles, couloirs, recoins, trone, chateau: ch && !lave, lave, glace, eau }; planS = cle; return planC;
  }
  Gn.plan = plan;
  const ge0 = Py.generer; Py.generer = function () {
    ge0.apply(this, arguments); const S = CG.S; if (!S || !S.arene || !(S.arene.id === Gn.ID || S.arene.id === Gn.BOIS || (Ar.Q[S.arene.id] && Ar.Q[S.arene.id].donjon))) return; const tile = W.tile, I = W.idx, P = plan(), rng = CG.makeRng(S.arene.seed + 5), sol = (x, y) => { if (x > 1 && y > 1 && x < MW - 2 && y < MH - 2) tile[I(x, y)] = W.FLOOR; };
    tile.fill(W.BUILD); cols = new Map();
    P.salles.concat(P.recoins).forEach(s => { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) sol(s.x0 + x, s.y0 + y); });
    P.couloirs.forEach(c => { for (let x = c.x1; x <= c.mx + 1; x++) { sol(x, c.y1); sol(x, c.y1 + 1); } for (let y = Math.min(c.y1, c.y2); y <= Math.max(c.y1, c.y2) + 1; y++) { sol(c.mx, y); sol(c.mx + 1, y); } for (let x = c.mx; x <= c.x2; x++) { sol(x, c.y2); sol(x, c.y2 + 1); } });
    P.recoins.forEach(r => { for (let y = Math.min(r.cy1, r.cy2); y <= Math.max(r.cy1, r.cy2); y++) { sol(r.cx, y); sol(r.cx + 1, y); } });
    if (P.lave) mares(P, rng); else if (P.chateau) P.salles.forEach((s, i) => { const cy = s.y0 + Math.floor(s.h / 2), der = i === P.salles.length - 1, col = (x, y, k) => { if ((k || (y !== cy && y !== cy + 1)) && tile[I(x, y)] === W.FLOOR) { tile[I(x, y)] = W.BUILD; cols.set(x + y * 1000, k || 'c'); } }; /* un mur, pas un rocher : le jeu ne dessine rien par-dessus */ /* des colonnes : aux quatre coins des salles, en deux rangées le long du tapis */
      if (der && P.trone) { for (let x = s.x0 + 3; x < s.x0 + s.w - 3; x += 3) { col(x, s.y0 + 1); col(x, s.y0 + s.h - 2); } if (!P.eau) { col(s.x0 + s.w - 2, cy, 't'); col(s.x0 + s.w - 2, cy + 1, 'u'); } return; }
      if (i && s.w >= 8 && s.h >= 7) { col(s.x0 + 2, s.y0 + 1); col(s.x0 + s.w - 3, s.y0 + 1); col(s.x0 + 2, s.y0 + s.h - 2); col(s.x0 + s.w - 3, s.y0 + s.h - 2); } });
    else { /* la grotte du nid : des salles aux bords arrondis et irréguliers, des boyaux qui s'élargissent par endroits, quelques stalagmites */
      const sd = S.arene.seed % 97, roche = (x, y) => { if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1) tile[I(x, y)] = W.BUILD; };
      P.salles.concat(P.recoins).forEach((s, i) => { const cx = s.x0 + (s.w - 1) / 2, cy = s.y0 + (s.h - 1) / 2, a = s.w / 2, b = s.h / 2, n = i === 0 ? 6 : s.w <= 4 ? 3 : 2.4; /* la salle d'entrée garde presque sa forme : on y arrive et on en repart */
        for (let y = s.y0; y < s.y0 + s.h; y++) for (let x = s.x0; x < s.x0 + s.w; x++) { const v = Math.pow(Math.abs((x - cx) / a), n) + Math.pow(Math.abs((y - cy) / b), n); if (v + (W.hash(x * 7 + sd, y * 13 + sd) - 0.5) * 0.36 > 1.02) roche(x, y); } });
      const gonfle = (x, y) => { sol(x, y); const q = rng(); if (q < 0.22) sol(x, y - 1); else if (q < 0.44) sol(x, y + 1); else if (q < 0.55) sol(x + 1, y); };
      P.couloirs.forEach(c => { for (let x = c.x1 - 1; x <= c.mx + 1; x++) { gonfle(x, c.y1); gonfle(x, c.y1 + 1); } for (let y = Math.min(c.y1, c.y2); y <= Math.max(c.y1, c.y2) + 1; y++) { gonfle(c.mx, y); gonfle(c.mx + 1, y); } for (let x = c.mx; x <= c.x2 + 1; x++) { gonfle(x, c.y2); gonfle(x, c.y2 + 1); } });
      P.recoins.forEach(r => { const haut = r.cy2 !== r.y0, ya = haut ? r.cy1 - 1 : r.cy1 - 4, yb = haut ? r.cy2 + 4 : r.cy2 + 1; for (let y = ya; y <= yb; y++) { sol(r.cx, y); sol(r.cx + 1, y); } }); /* le boyau du recoin entre jusqu'au milieu de la salle arrondie */
      P.salles.forEach((s, i) => { if (!i) return; const cy = s.y0 + Math.floor(s.h / 2), n = i === P.salles.length - 1 ? 4 : 2; for (let k = 0; k < n; k++) { const x = s.x0 + 2 + Math.floor(rng() * (s.w - 4)), y = s.y0 + 1 + Math.floor(rng() * (s.h - 2)); if (y === cy || y === cy + 1 || Math.abs(x - (s.x0 + s.w / 2)) < 1.5 || tile[I(x, y)] !== W.FLOOR) continue; tile[I(x, y)] = W.ROCK; } }); }
    if (S.arene.id === Gn.BOIS) { /* les parois deviennent de vrais arbres, sur trois rangs : le jeu les dessine comme ceux de la forêt, et le chef passe derrière */
      const pres = new Uint8Array(tile.length); for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { const t = tile[I(x, y)]; if (t !== W.FLOOR && t !== W.ROCK) continue; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = x + dx, Y = y + dy; if (X > 0 && Y > 0 && X < MW - 1 && Y < MH - 1) pres[I(X, Y)] = 1; } }
      const solI = i => tile[i] === W.FLOOR || tile[i] === W.ROCK; for (let i = 0; i < tile.length; i++) if (pres[i] && tile[i] === W.BUILD && !(i >= 2 * MW && (solI(i - MW) || solI(i - 2 * MW)))) tile[i] = W.TREE; } /* pas d'arbre juste au sud d'un sentier : sa cime le cacherait. Là, ce sont des buissons (peints au sol) */
    W.fieldDirty = true; W.miniDirty = true;
  };
  // ---------- la pierre : dalles au sol, murs de blocs, toiles dans les coins ----------
  const pa0 = W.paint; W.paint = function () {
    if (!dedans()) return pa0.apply(this, arguments);
    if (bois()) return peindreBois();
    if (mode() === 'lave') return peindreLave();
    if (mode() === 'eau' && CG.TempleEau) { torches = []; return CG.TempleEau.peindre(plan(), cols); }
    const P = plan(), ch = P.chateau, gl = !!P.glace, cv = mode() === 'nid', lueurs = [], c = W.terrain = document.createElement('canvas'); c.width = MW * T; c.height = MH * T; const g = c.getContext('2d'), I = W.idx, tile = W.tile, rng = CG.makeRng(CG.S.arene.seed + 9);
    g.fillStyle = gl ? '#d4e4f0' : ch ? '#030206' : cv ? 'hsl(22,13%,8%)' : '#06050a'; g.fillRect(0, 0, c.width, c.height); torches = [];
    const FL = gl ? ['rgba(150,225,255,0.55)', 'rgba(120,200,255,0)', '#8fdcff', '#eefbff', '#5a7a98', 'rgba(150,215,255,'] : ['rgba(255,190,90,0.5)', 'rgba(255,150,60,0)', '#ffb040', '#fff0b0', '#3a2a14', 'rgba(255,170,80,'];
    const tous = P.salles.concat(P.recoins), x0 = Math.max(1, Math.min.apply(null, tous.map(s => s.x0)) - 3), x1 = Math.min(MW - 2, Math.max.apply(null, tous.map(s => s.x0 + s.w)) + 3), y0 = Math.max(1, Math.min.apply(null, tous.map(s => s.y0)) - 3), y1 = Math.min(MH - 2, Math.max.apply(null, tous.map(s => s.y0 + s.h)) + 3);
    const F = (x, y) => { const t = tile[I(x, y)]; return t === W.FLOOR || t === W.ROCK || cols.has(x + y * 1000); };
    if (gl) { const r2 = CG.makeRng(CG.S.arene.seed + 13); for (let i = 0; i < (x1 - x0 + 8) * (y1 - y0 + 8) * 0.5; i++) { const x = (x0 - 4 + r2() * (x1 - x0 + 8)) * T, y = (y0 - 4 + r2() * (y1 - y0 + 8)) * T, q = r2(); g.fillStyle = q < 0.5 ? 'rgba(255,255,255,0.55)' : q < 0.85 ? 'rgba(150,185,215,0.3)' : 'rgba(120,160,200,0.35)'; g.beginPath(); g.ellipse(x, y, 14 + r2() * 40, 6 + r2() * 14, 0, 0, TAU); g.fill(); } } /* la neige, dehors : des congères et des creux bleutés */
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; const k = W.hash(x, y), px = x * T, py = y * T; /* les dalles */
      if (cv) { /* la grotte : de la terre et de la roche, sans dalles */
        g.fillStyle = 'hsl(' + (26 + k * 8) + ',15%,' + (20 + k * 2.5) + '%)'; g.fillRect(px, py, T, T); const k2 = W.hash(y * 3 + 1, x * 5 + 2);
        g.fillStyle = 'rgba(0,0,0,0.13)'; g.beginPath(); g.ellipse(px + k * T, py + k2 * T, 16 + k2 * 12, 8 + k * 7, k * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,225,180,0.045)'; g.beginPath(); g.ellipse(px + k2 * T, py + (1 - k) * T, 14 + k * 12, 7 + k2 * 6, k2 * 3, 0, TAU); g.fill();
        if (k < 0.22) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(px + 8 + k * 90, py + 12 + k2 * 18, 4.5, 2.2, 0, 0, TAU); g.fill(); g.fillStyle = 'hsl(26,10%,' + (30 + k2 * 8) + '%)'; g.beginPath(); g.ellipse(px + 8 + k * 90, py + 10.5 + k2 * 18, 4, 2.8, 0, 0, TAU); g.fill(); } /* un caillou */
        if (k > 0.9) { g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + 5, py + 8 + k2 * 10); g.lineTo(px + 16, py + 16 + k2 * 8); g.lineTo(px + 24, py + 13 + k2 * 10); g.lineTo(px + 35, py + 24); g.stroke(); } continue; }
      g.fillStyle = gl ? 'hsl(' + (198 + k * 8) + ',40%,' + (64 + k * 5 + ((x + y) % 2) * 3.5) + '%)' : ch ? 'hsl(' + (238 + k * 8) + ',7%,' + (13 + k * 4 + ((x + y) % 2) * 2.5) + '%)' : 'hsl(' + (252 + k * 10) + ',7%,' + (25 + k * 7) + '%)'; g.fillRect(px, py, T, T); g.strokeStyle = gl ? 'rgba(40,90,130,0.3)' : 'rgba(8,6,12,0.5)'; g.lineWidth = 1.2; g.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
      if (k > 0.55) { g.beginPath(); g.moveTo(px + (k > 0.78 ? T / 2 : 0), py + T / 2); g.lineTo(px + (k > 0.78 ? T / 2 : T), py + T / 2 + (k > 0.78 ? T / 2 : 0)); g.stroke(); }
      if (k < 0.16) { g.strokeStyle = gl ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + 6 + k * 90, py + 5); g.lineTo(px + 14 + k * 60, py + 17); g.lineTo(px + 9 + k * 80, py + 30); g.stroke(); }
      g.fillStyle = gl ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.035)'; g.fillRect(px + 1, py + 1, T - 2, 2); if (gl && k > 0.3 && k < 0.42) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(px + 6, py + 30); g.lineTo(px + 20, py + 8); g.lineTo(px + 26, py + 10); g.lineTo(px + 12, py + 32); g.closePath(); g.fill(); } }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (F(x, y)) { if (!F(x, y - 1)) { const gr = g.createLinearGradient(0, y * T, 0, y * T + 18); gr.addColorStop(0, gl ? 'rgba(20,50,90,0.35)' : 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x * T, y * T, T, 18); } continue; }
      let pres = false; for (let dy = -1; dy <= 1 && !pres; dy++) for (let dx = -1; dx <= 1; dx++) if (F(x + dx, y + dy)) { pres = true; break; } if (!pres) continue; const px = x * T, py = y * T, k = W.hash(x * 3, y * 5);
      if (F(x, y + 1)) { /* un mur dont on voit la face : des blocs de pierre taillée */
        if (cv) { /* la grotte : de la roche brute, des stalactites, parfois des champignons qui luisent */
          g.fillStyle = '#0c0907'; g.fillRect(px, py - 14, T, 14); const fg = g.createLinearGradient(0, py, 0, py + T); fg.addColorStop(0, 'hsl(24,14%,' + (29 + k * 4) + '%)'); fg.addColorStop(1, 'hsl(22,16%,15%)'); g.fillStyle = fg; g.fillRect(px, py, T, T);
          const h1 = W.hash(x * 11 + 3, y * 7), h2 = W.hash(y * 9 + 5, x * 3);
          g.fillStyle = 'rgba(255,220,180,0.07)'; g.beginPath(); g.moveTo(px + 3 + h1 * 8, py + 6); g.lineTo(px + 15 + h1 * 6, py + 3 + h2 * 5); g.lineTo(px + 19 + h2 * 6, py + 17); g.lineTo(px + 7 + h2 * 5, py + 22 + h1 * 6); g.closePath(); g.fill(); g.beginPath(); g.moveTo(px + 24, py + 12 + h2 * 8); g.lineTo(px + 36, py + 9 + h1 * 6); g.lineTo(px + 38, py + 27); g.lineTo(px + 27, py + 31); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.34)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(px + 20 + h1 * 6, py + 2); g.lineTo(px + 22 + h2 * 5, py + 15); g.lineTo(px + 18 + h1 * 8, py + 27); g.lineTo(px + 22, py + T); g.stroke();
          g.fillStyle = 'hsl(24,12%,' + (36 + k * 5) + '%)'; for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(px + 5 + j * 10 + h1 * 3, py - 1 + ((x + j) % 2) * 2, 7.5, 4, 0, 0, TAU); g.fill(); } /* le rebord, tout bosselé */
          for (let j = 0; j < 3; j++) { const hj = W.hash(x * 5 + j * 17, y * 3 + j); if (hj < 0.4) continue; const ix = px + 6 + j * 13 + hj * 4, len = 7 + hj * 14; g.fillStyle = 'hsl(24,12%,33%)'; g.beginPath(); g.moveTo(ix - 3.5, py + 2); g.lineTo(ix + 3.5, py + 2); g.lineTo(ix + 0.5, py + 2 + len); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(ix + 0.5, py + 2); g.lineTo(ix + 3.5, py + 2); g.lineTo(ix + 0.5, py + 2 + len); g.closePath(); g.fill(); } /* des stalactites */
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(px, py + T - 7, T, 7);
          if (k > 0.8) { lueurs.push({ x: px + 20, y: py + T - 4 }); [[-8, 0, 4.5], [0, -3, 6], [8, 1, 4]].forEach(q => { g.fillStyle = '#cfe8d8'; g.fillRect(px + 19 + q[0], py + T - 9 + q[1], 2, 7); g.fillStyle = '#6fe0c0'; g.beginPath(); g.ellipse(px + 20 + q[0], py + T - 9 + q[1], q[2], q[2] * 0.6, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(px + 19 + q[0], py + T - 11 + q[1], 1, 0, TAU); g.fill(); }); } /* des champignons qui luisent, à la place des torches */
          continue; }
        g.fillStyle = gl ? '#eaf4fb' : ch ? '#0e0c14' : '#1a1820'; g.fillRect(px, py - 14, T, 14); g.fillStyle = gl ? 'hsl(205,48%,' + (56 + k * 6) + '%)' : 'hsl(255,8%,' + ((ch ? 19 : 30) + k * 5) + '%)'; g.fillRect(px, py, T, T); g.fillStyle = gl ? 'rgba(20,60,110,0.2)' : 'rgba(0,0,0,0.22)'; g.fillRect(px, py + T * 0.55, T, T * 0.45);
        g.strokeStyle = gl ? 'rgba(30,70,120,0.4)' : 'rgba(8,6,12,0.6)'; g.lineWidth = 1.2; g.beginPath(); for (let r = 0; r < 3; r++) { const yy = py + 13 * r; g.moveTo(px, yy + 13); g.lineTo(px + T, yy + 13); const off = (r + y) % 2 ? 10 : 30; g.moveTo(px + off, yy); g.lineTo(px + off, yy + 13); } g.stroke();
        g.fillStyle = gl ? '#f6fbff' : 'hsl(255,9%,' + ((ch ? 29 : 44) + k * 6) + '%)'; g.fillRect(px, py - 3, T, 5); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(px, py - 3, T, 1.5); if (gl) { g.fillStyle = '#f6fbff'; for (let j = 0; j < 3; j++) { const ix = px + 5 + j * 13 + k * 5, ih = 5 + ((x * 7 + j * 5 + y) % 4) * 3; g.beginPath(); g.moveTo(ix - 3, py + 2); g.lineTo(ix + 3, py + 2); g.lineTo(ix, py + 2 + ih); g.closePath(); g.fill(); } } /* des glaçons sous la corniche de neige */
        if (ch && x % 3 !== 0 && k > 0.4 && k < 0.6) { g.fillStyle = gl ? '#1a2452' : '#5a0e16'; g.beginPath(); g.moveTo(px + 11, py + 2); g.lineTo(px + 29, py + 2); g.lineTo(px + 29, py + 28); g.lineTo(px + 20, py + 34); g.lineTo(px + 11, py + 28); g.closePath(); g.fill(); g.fillStyle = gl ? '#d8e6f4' : '#c9a040'; g.fillRect(px + 11, py + 2, 18, 2.5); g.beginPath(); g.arc(px + 20, py + 16, 3.4, 0, TAU); g.fill(); } /* une vieille bannière */
        if (ch ? x % 3 === 0 : k > 0.82) { torches.push({ x: px + 20, y: py + 8 }); g.fillStyle = FL[4]; g.fillRect(px + 18, py + 12, 4, 12); const fl = g.createRadialGradient(px + 20, py + 8, 1, px + 20, py + 8, 34); fl.addColorStop(0, FL[0]); fl.addColorStop(1, FL[1]); g.fillStyle = fl; g.fillRect(px - 16, py - 28, 72, 72); g.fillStyle = FL[2]; g.beginPath(); g.ellipse(px + 20, py + 8, 3.4, 5.5, 0, 0, TAU); g.fill(); g.fillStyle = FL[3]; g.beginPath(); g.ellipse(px + 20, py + 9.5, 1.6, 2.8, 0, 0, TAU); g.fill(); } /* une torche, de temps en temps */
      } else if (cv) { /* la roche pleine : la même couleur que le fond, juste quelques bosses, pour ne pas voir de carrés */ g.fillStyle = 'rgba(255,220,180,0.035)'; g.beginPath(); g.ellipse(px + 8 + k * 22, py + 10 + k * 16, 12, 7, k * 3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(px + 30 - k * 14, py + 30 - k * 8, 9, 6, 0, 0, TAU); g.fill();
      } else { g.fillStyle = gl ? 'hsl(204,40%,' + (86 + k * 5) + '%)' : 'hsl(258,9%,' + ((ch ? 6 : 12) + k * 4) + '%)'; g.fillRect(px, py, T, T); g.fillStyle = gl ? 'rgba(140,180,215,0.3)' : 'rgba(255,255,255,0.05)'; g.fillRect(px + 3 + k * 10, py + 4 + k * 12, 14, 9); g.fillRect(px + 20 - k * 8, py + 22, 12, 10); } }
    if (cv) { /* les bords de la grotte : de la roche qui déborde sur le sol, pour casser les lignes droites ; puis ce que les araignées ont laissé */
      const sombre = '#14100c', R2 = CG.makeRng(CG.S.arene.seed + 21), sol2 = (x, y) => tile[I(x, y)] === W.FLOOR || tile[I(x, y)] === W.ROCK;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!sol2(x, y)) continue; const px = x * T, py = y * T;
        for (let j = 0; j < 3; j++) { const h = W.hash(x * 3 + j * 7, y * 5 + j * 11), yy = py + 5 + j * 13 + h * 5;
          if (!sol2(x - 1, y)) { g.fillStyle = sombre; g.beginPath(); g.arc(px - 2 + h * 3, yy, 5 + h * 5, 0, TAU); g.fill(); } if (!sol2(x + 1, y)) { g.fillStyle = sombre; g.beginPath(); g.arc(px + T + 2 - h * 3, yy, 5 + h * 5, 0, TAU); g.fill(); }
          if (!sol2(x, y + 1)) { g.fillStyle = '#0e0b08'; g.beginPath(); g.arc(px + 5 + j * 13 + h * 5, py + T + 2 - h * 3, 6 + h * 5, 0, TAU); g.fill(); }
          if (!sol2(x, y - 1) && h > 0.45) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(px + 6 + j * 13, py + 4, 5, 2, 0, 0, TAU); g.fill(); g.fillStyle = 'hsl(24,12%,' + (24 + h * 8) + '%)'; g.beginPath(); g.ellipse(px + 6 + j * 13, py + 2.5, 4 + h * 2, 3, 0, 0, TAU); g.fill(); } } } /* des éboulis au pied des parois */
      for (const q of lueurs) { const fl = g.createRadialGradient(q.x, q.y + 10, 3, q.x, q.y + 10, 78); fl.addColorStop(0, 'rgba(110,235,200,0.2)'); fl.addColorStop(1, 'rgba(110,235,200,0)'); g.fillStyle = fl; g.fillRect(q.x - 80, q.y - 70, 160, 160); }
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (sol2(x, y) || !sol2(x, y + 1)) continue; const h = W.hash(x * 13 + 1, y * 17 + 2), px = x * T, py = y * T, cx = px + 10 + h * 20;
        if (h > 0.3 && h < 0.46) { g.strokeStyle = 'rgba(235,240,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, py - 2); g.lineTo(cx, py + 9); g.stroke(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx + 2, py + 21, 6.5, 11, 0, 0, TAU); g.fill(); g.fillStyle = '#dedad0'; g.beginPath(); g.ellipse(cx, py + 20, 6, 11, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(cx - 2, py + 15, 2, 5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(110,104,92,0.55)'; g.lineWidth = 0.9; g.beginPath(); for (let j = 0; j < 4; j++) { g.moveTo(cx - 5.5, py + 12 + j * 5); g.lineTo(cx + 5.5, py + 15 + j * 5); } g.stroke(); } /* un cocon pendu à la paroi */
        else if (h > 0.55 && h < 0.7) { g.strokeStyle = 'rgba(235,240,255,0.42)'; g.lineWidth = 0.9; g.beginPath(); for (let j = 0; j < 5; j++) { g.moveTo(px + j * 10, py - 2); g.quadraticCurveTo(px + j * 10 + 5, py + 12 + ((j + x) % 3) * 5, px + j * 10 + 10, py - 2); } g.moveTo(px, py + 6); g.quadraticCurveTo(px + 20, py + 14, px + T, py + 6); g.stroke(); } /* des toiles en guirlande sous le rebord */
        else if (h > 0.9) { const sy = py + 14 + h * 8; g.strokeStyle = '#0a0808'; g.lineWidth = 1; g.beginPath(); for (let j = -1; j <= 1; j += 2) for (let m = 0; m < 4; m++) { g.moveTo(cx, sy); g.lineTo(cx + j * (5 + m), sy - 4 + m * 2.6); } g.stroke(); g.fillStyle = '#0a0808'; g.beginPath(); g.ellipse(cx, sy, 2.6, 3.4, 0, 0, TAU); g.fill(); g.fillStyle = '#ff4040'; g.fillRect(cx - 1.4, sy - 1.6, 1, 1); g.fillRect(cx + 0.4, sy - 1.6, 1, 1); } } /* une petite araignée sur la roche */
      P.salles.forEach(s => { for (let i = 0; i < Math.max(1, Math.round(s.w * s.h / 34)); i++) { const wx = (s.x0 + 1 + R2() * (s.w - 2)) * T, wy = (s.y0 + 1 + R2() * (s.h - 2)) * T, Rr = 22 + R2() * 20, n = 8, a0 = R2() * TAU; if (!W.walkPx(wx, wy)) continue; /* de grandes toiles posées à plat sur le sol */
          g.save(); g.translate(wx, wy); g.scale(1, 0.62); g.strokeStyle = 'rgba(235,240,255,0.3)'; g.lineWidth = 1; g.beginPath(); for (let j = 0; j < n; j++) { const a = a0 + j / n * TAU; g.moveTo(0, 0); g.lineTo(Math.cos(a) * Rr, Math.sin(a) * Rr); } for (let k = 1; k <= 3; k++) { const r = Rr * k / 3.3; for (let j = 0; j <= n; j++) { const a = a0 + j / n * TAU; if (!j) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); else g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } } g.stroke(); g.restore(); } });
      P.couloirs.forEach(c => { [[c.x1 + 1, c.y1], [c.mx, Math.round((c.y1 + c.y2) / 2)], [c.x2 - 1, c.y2]].forEach(q => { const px = q[0] * T, py = q[1] * T; g.strokeStyle = 'rgba(235,240,255,0.38)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(px + 4, py - 4); g.quadraticCurveTo(px + 22, py + 30, px + 36, py + 2 * T + 4); g.moveTo(px + 30, py - 4); g.quadraticCurveTo(px + 16, py + 34, px + 8, py + 2 * T + 4); g.moveTo(px + 12, py + 20); g.lineTo(px + 28, py + 26); g.moveTo(px + 10, py + 44); g.lineTo(px + 30, py + 50); g.stroke(); }); }); } /* des fils tendus en travers des boyaux */
    if (ch && P.trone) { const s = P.salles[P.salles.length - 1], cy = s.y0 + Math.floor(s.h / 2), X0 = (s.x0 - 1) * T, X1 = (s.x0 + s.w - 3) * T + 20, Y0 = cy * T + 5, H = 2 * T - 10; /* le tapis rouge, de la porte jusqu'au trône */
      g.fillStyle = gl ? '#16245c' : '#5c0f16'; g.fillRect(X0, Y0, X1 - X0, H); g.fillStyle = gl ? '#22388a' : '#7a1620'; g.fillRect(X0, Y0 + 9, X1 - X0, H - 18); g.fillStyle = gl ? '#d8e6f4' : '#b8902e'; g.fillRect(X0, Y0 + 4, X1 - X0, 2.5); g.fillRect(X0, Y0 + H - 6.5, X1 - X0, 2.5);
      g.fillStyle = gl ? 'rgba(200,228,255,0.55)' : 'rgba(200,150,50,0.5)'; for (let x = X0 + 30; x < X1 - 20; x += 60) { g.beginPath(); g.moveTo(x, Y0 + H / 2 - 8); g.lineTo(x + 8, Y0 + H / 2); g.lineTo(x, Y0 + H / 2 + 8); g.lineTo(x - 8, Y0 + H / 2); g.closePath(); g.fill(); }
      const tg = g.createLinearGradient(X0, 0, X0 + 90, 0); tg.addColorStop(0, gl ? 'rgba(10,30,70,0.35)' : 'rgba(0,0,0,0.5)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = tg; g.fillRect(X0, Y0, 90, H); }
    for (const q of torches) { const fl = g.createRadialGradient(q.x, q.y + 44, 4, q.x, q.y + 44, ch ? 120 : 70); fl.addColorStop(0, FL[5] + (ch ? 0.3 : 0.12) + ')'); fl.addColorStop(1, FL[1]); g.fillStyle = fl; g.fillRect(q.x - 130, q.y - 80, 260, 260); } /* la flaque de lumière au pied de chaque torche */
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const quoi = cols.get(x + y * 1000); if (tile[I(x, y)] === W.ROCK && !ch) { Art.rock(g, x, y); continue; } if (!quoi || quoi === 'u') continue; const px = x * T, py = y * T;
      if (quoi === 't') { const tx = px + 20, ty = py + T; /* le trône */
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(tx, ty + 26, 30, 9, 0, 0, TAU); g.fill(); g.fillStyle = gl ? '#7a9ab8' : '#3a3642'; g.fillRect(tx - 28, ty + 8, 56, 20); g.fillStyle = gl ? '#a8c8e0' : '#4a4654'; g.fillRect(tx - 28, ty + 8, 56, 4);
        g.fillStyle = gl ? '#6a9ac4' : '#2a2018'; g.fillRect(tx - 17, ty - 58, 34, 70); g.fillStyle = gl ? '#22388a' : '#7a1620'; g.fillRect(tx - 13, ty - 52, 26, 40); g.fillStyle = gl ? '#eaf6ff' : '#c9a040'; g.fillRect(tx - 17, ty - 60, 34, 4); g.beginPath(); g.moveTo(tx - 17, ty - 60); g.lineTo(tx - 12, ty - 74); g.lineTo(tx - 6, ty - 62); g.lineTo(tx, ty - 78); g.lineTo(tx + 6, ty - 62); g.lineTo(tx + 12, ty - 74); g.lineTo(tx + 17, ty - 60); g.closePath(); g.fill();
        g.fillStyle = gl ? '#8ab4d8' : '#3a2c20'; g.fillRect(tx - 22, ty - 14, 8, 26); g.fillRect(tx + 14, ty - 14, 8, 26); g.fillStyle = gl ? '#2a44a0' : '#8a1a24'; g.fillRect(tx - 14, ty - 12, 28, 10); continue; }
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(px + 20, py + 33, 17, 6, 0, 0, TAU); g.fill(); colonne(g, px, py, gl); } /* une colonne : son ombre ici, et elle-même aussi parmi les personnages (plus bas), pour qu'on passe derrière */
    // les toiles : dans les coins des salles, et des fils en travers des couloirs
    const toile = (px, py, sx, sy, R) => { g.strokeStyle = 'rgba(235,240,255,' + (gl ? 0.75 : ch ? 0.28 : 0.5) + ')'; g.lineWidth = 0.9; g.beginPath(); for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; g.moveTo(px, py); g.lineTo(px + Math.cos(a) * R * sx, py + Math.sin(a) * R * sy); } for (let k = 1; k <= 3; k++) { const r = R * k / 3.4; g.moveTo(px + r * sx, py); for (let i = 1; i <= 4; i++) { const a = i / 4 * Math.PI / 2, a0 = (i - 0.5) / 4 * Math.PI / 2; g.quadraticCurveTo(px + Math.cos(a0) * r * 0.8 * sx, py + Math.sin(a0) * r * 0.8 * sy, px + Math.cos(a) * r * sx, py + Math.sin(a) * r * sy); } } g.stroke(); };
    tous.forEach(s => { const X0 = s.x0 * T, Y0 = s.y0 * T, X1 = (s.x0 + s.w) * T, Y1 = (s.y0 + s.h) * T; toile(X0, Y0, 1, 1, 46 + rng() * 26); toile(X1, Y0, -1, 1, 46 + rng() * 26); if (rng() < 0.7) toile(X0, Y1, 1, -1, 34 + rng() * 22); if (rng() < 0.7) toile(X1, Y1, -1, -1, 34 + rng() * 22);
      for (let i = 0; i < Math.round(s.w * s.h / 22); i++) { const px = X0 + 14 + rng() * (s.w * T - 28), py = Y0 + 22 + rng() * (s.h * T - 36), q = rng(); if (!W.walkPx(px, py)) continue;
        if (ch && q < 0.4) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(px, py + 3, 12, 4, 0, 0, TAU); g.fill(); for (let j = 0; j < 4; j++) { g.fillStyle = gl ? (j % 2 ? '#f2faff' : '#b8dcf4') : j % 2 ? '#3a3742' : '#2c2a34'; g.fillRect(px - 9 + j * 5, py - 3 + (j % 2) * 3, 6, 5); } } /* des gravats (ou des éclats de glace) */
        else if (q < 0.4) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(px, py + 5, 11, 4, 0, 0, TAU); g.fill(); for (let j = 0; j < 3; j++) { g.fillStyle = j % 2 ? '#e8e2d0' : '#d8d0bc'; g.beginPath(); g.ellipse(px - 6 + j * 6, py + (j % 2) * 2, 4.6, 5.6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(px - 7 + j * 6, py - 2 + (j % 2) * 2, 1.4, 1.9, 0, 0, TAU); g.fill(); } } /* des œufs */
        else if (q < 0.7) { g.strokeStyle = '#cfc8b4'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 7, py - 2); g.lineTo(px + 7, py + 3); g.moveTo(px - 5, py + 4); g.lineTo(px + 6, py - 4); g.stroke(); g.fillStyle = '#ddd6c2'; g.beginPath(); g.arc(px + 10, py - 5, 4, 0, TAU); g.fill(); g.fillStyle = '#1a1620'; g.fillRect(px + 8.4, py - 6, 1.4, 1.6); g.fillRect(px + 10.8, py - 6, 1.4, 1.6); } /* des os */
        else { g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(px, py, 8 + rng() * 14, 4 + rng() * 6, 0, 0, TAU); g.fill(); } } });
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
  };
  // ---------- les araignées, la reine, la fin ----------
  const SORTES = () => bois() ? (CG.Loups ? CG.Loups.meute() : ['loup']) : ['araignee', 'araignee', 'araignee'].concat(CG.ENEMIES.cracheuse ? ['cracheuse'] : []);
  const dansLave = (x, y) => cols.get(Math.floor(x / T) + Math.floor(y / T) * 1000) === 'l';
  function poser(type, x, y) { for (let k = 0; k < 40 && (!W.walkPx(x, y) || dansLave(x, y)); k++) { x += rand(-20, 20); y += rand(-20, 20); } if (!W.walkPx(x, y)) return null; const e = G.spawnEnemy(type, x, y, { wild: true, exact: true }); if (!e) return null; e.arene = true; e.etage = 99; e.leash = 1400; e.aggroR = Gn.VOIT; e.calm = false; e.grotte = true; return e; }
  // certains monstres reviennent : tué, il reparaît à sa place quand le chef s'est éloigné un moment (toujours au moins un, dans la première salle)
  Gn.REVIENT = { PART: 0.3, DELAI: 22, LOIN: 520 };
  function revient(e, force) { const R = CG.R; if (!e || !R.grotte || (!force && Math.random() > Gn.REVIENT.PART)) return; (R.grotte.reviens = R.grotte.reviens || []).push({ type: e.type, x: e.x, y: e.y, e, t: 0, aggro: e.aggroR }); }
  { const ur = G.update; G.update = function (dt) { ur.apply(this, arguments); if (!mode()) return; const S = CG.S, R = CG.R, L = R && R.grotte && R.grotte.reviens, p = S.player; if (!L || Mo.pending || (S.arene.gagne && !R.grotte.arrive)) return; if (R.grotte.arrive) return;
      for (const s of L) { if (s.e && !s.e.dead && R.enemies.includes(s.e)) continue; if (Math.hypot(p.x - s.x, p.y - s.y) < Gn.REVIENT.LOIN) continue; s.t += dt; if (s.t < Gn.REVIENT.DELAI) continue; s.t = 0; const e = poser(s.type, s.x, s.y); if (e) { e.revenu = true; e.aggroR = s.aggro; s.e = e; } } }; }
  function peupler() {
    const S = CG.S, R = CG.R, A = S.arene, P = plan(), pal = A.palier || 0, d = S.day; R.grotte = { reine: null };
    P.salles.forEach((s, i) => { if (!i) return; const cx = (s.x0 + s.w / 2) * T, cy = (s.y0 + s.h / 2) * T, fin = i === P.salles.length - 1;
      const bete = bois() ? 'loup' : 'araignee';
      if (fin) { const e = poser(bois() && CG.Loups ? CG.Loups.chef() : bete, cx + T * 2, cy); if (e) { e.hp = e.maxhp = Math.round(e.hp * Gn.REINE_VIE * (1 + pal * 0.6)); e.dmg *= Gn.REINE_DMG; e.r = Math.round(e.r * 1.35); e.grosArene = true; e.nomArene = bois() ? 'Le chef de meute' : 'La reine des araignées'; e.aggroR = 330; R.grotte.reine = e; } for (let k = 0; k < 2 + pal; k++) poser(pick(SORTES()), cx + rand(-70, 30), cy + rand(-90, 90)); return; }
      for (let k = 0; k < 3 + pal + Math.floor(i / 2) + (bois() ? 2 : 0); k++) revient(poser(pick(SORTES()), cx + rand(-s.w * T * 0.36, s.w * T * 0.36), cy + rand(-s.h * T * 0.34, s.h * T * 0.34)), i === 1 && !k); });
    P.couloirs.forEach((c, i) => { if (i) poser(bois() ? 'loup' : 'araignee', (c.mx + 1) * T, ((c.y1 + c.y2) / 2 + 1) * T); });
    P.recoins.forEach(r => { const cx = (r.x0 + 2) * T, cy = (r.y0 + 2) * T; poser(pick(SORTES()), cx - 20, cy); poser(bois() ? 'loup' : 'araignee', cx + 24, cy + 14); G.dropRes(cx, cy - 10, 'or', 25 + d * 4 + pal * 15); if (Math.random() < 0.5) G.drop(cx, cy - 10, { kind: 'potion', n: 1 }); }); /* un recoin : deux gardiennes et un petit trésor */
  }
  function peuplerChateau() {
    const S = CG.S, R = CG.R, A = S.arene, P = plan(), Q = Ar.Q[A.id], pal = A.palier || 0, L = (Q.E[pal] || []).filter(t => CG.ENEMIES[t]), d = S.day; R.grotte = { reine: null, chateau: true, vu: false }; if (!L.length) return;
    const n = P.salles.length, libres = P.salles.slice(1, P.trone ? n - 1 : n), total = L.length * (Math.random() < 0.4 ? 3 : 2);
    for (let i = 0; i < total; i++) { const s = libres[i % libres.length]; const e = poser(L[i % L.length], (s.x0 + s.w / 2) * T + rand(-s.w * T * 0.34, s.w * T * 0.34), (s.y0 + s.h / 2) * T + rand(-s.h * T * 0.32, s.h * T * 0.32)); if (e) e.aggroR = 270; revient(e, !i); }
    P.recoins.forEach(r => { const cx = (r.x0 + 2) * T, cy = (r.y0 + 2) * T; poser(L[0], cx - 18, cy + 6); G.dropRes(cx, cy - 10, 'or', 20 + d * 3 + pal * 12); if (Math.random() < 0.4) G.drop(cx, cy - 10, { kind: 'potion', n: 1 }); });
    if (P.trone) { const s = P.salles[n - 1], cy = (s.y0 + Math.floor(s.h / 2) + 1) * T, e = poser(Q.chef[0], (s.x0 + s.w - 4) * T, cy); /* le chef, devant son trône, au bout du tapis */
      if (e) { e.hp = e.maxhp = Math.round(e.hp * Ar.BOSS_VIE * (1 + pal * 0.5)); e.dmg *= Ar.BOSS_DMG; e.r = Math.round(e.r * 1.35); e.grosArene = true; e.nomArene = Q.chef[1]; e.aggroR = 300; R.grotte.reine = e; }
      [-1, 1].forEach(k => { const o = poser(L[0], (s.x0 + s.w - 7) * T, cy + k * 70); if (o) o.aggroR = 300; }); }
  }
  // ---------- la montagne de feu : des mares de lave dans les salles, la cage au fond ----------
  function mares(P, rng) {
    const tile = W.tile, I = W.idx, sx = Ar.CX, sy = Ar.CY + 2;
    const relie = () => { let tot = 0; for (let i = 0; i < tile.length; i++) if (tile[i] === W.FLOOR) tot++; const vu = new Uint8Array(tile.length), q = [I(sx, sy)]; vu[q[0]] = 1; let n = 0; while (q.length) { const i = q.pop(), x = i % MW, y = (i - x) / MW; n++; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const j = I(x + d[0], y + d[1]); if (!vu[j] && tile[j] === W.FLOOR) { vu[j] = 1; q.push(j); } }); } return n === tot; };
    P.salles.forEach((s, i) => { if (!i) return; const cy = s.y0 + Math.floor(s.h / 2), der = i === P.salles.length - 1;
      if (der) { const gx = s.x0 + s.w - 2; tile[I(gx, cy)] = W.BUILD; cols.set(gx + cy * 1000, 'g'); P.cage = { x: (gx + 0.5) * T, y: (cy + 1) * T - 4 }; } /* la cage de l'apprenti */
      for (let k = 0, n = 1 + Math.floor(s.w * s.h / 26); k < n; k++) { const w = 2 + Math.floor(rng() * 2), h = 1 + Math.floor(rng() * 2), x = s.x0 + 1 + Math.floor(rng() * (s.w - w - 1)), y = rng() < 0.5 ? s.y0 + Math.floor(rng() * Math.max(1, cy - s.y0 - h)) : cy + 2 + Math.floor(rng() * Math.max(1, s.y0 + s.h - cy - 2 - h)), pris = [];
        for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) { const X = x + a, Y = y + b; if (Y === cy || Y === cy + 1 || Y < s.y0 || Y >= s.y0 + s.h || tile[I(X, Y)] !== W.FLOOR) continue; tile[I(X, Y)] = W.BUILD; pris.push([X, Y]); }
        const ok = relie(); pris.forEach(q => { tile[I(q[0], q[1])] = W.FLOOR; if (ok) cols.set(q[0] + q[1] * 1000, 'l'); }); } }); /* on peut marcher dans la lave (ça brûle) ; malgré tout, il reste toujours un chemin sans y toucher */ /* une mare ne coupe jamais le chemin */
  }
  let mareL = [];
  // ---------- le bois des loups : une clairière qui serpente entre les arbres ----------
  function peindreBois() {
    const P = plan(), c = W.terrain = document.createElement('canvas'); c.width = MW * T; c.height = MH * T; const g = c.getContext('2d'), I = W.idx, tile = W.tile, rng = CG.makeRng(CG.S.arene.seed + 9); torches = [];
    g.fillStyle = '#0f2a17'; g.fillRect(0, 0, c.width, c.height);
    const tous = P.salles.concat(P.recoins), M = 9, x0 = Math.max(1, Math.min.apply(null, tous.map(s => s.x0)) - M), x1 = Math.min(MW - 2, Math.max.apply(null, tous.map(s => s.x0 + s.w)) + M), y0 = Math.max(1, Math.min.apply(null, tous.map(s => s.y0)) - M), y1 = Math.min(MH - 2, Math.max.apply(null, tous.map(s => s.y0 + s.h)) + M);
    const F = (x, y) => { const t = tile[I(x, y)]; return t === W.FLOOR || t === W.ROCK; }, el = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
    // au loin : le bois épais, vu d'en haut (des houppiers sombres serrés les uns contre les autres)
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (F(x, y) || tile[I(x, y)] === W.TREE) continue; const k = W.hash(x, y), k2 = W.hash(y + 3, x + 7), px = x * T + 20, py = y * T + 20;
      el(px + (k - 0.5) * 18, py + (k2 - 0.5) * 14, 25 + k * 8, 21 + k2 * 6, ['#143520', '#183d24', '#11301b', '#1b4428'][Math.floor(k * 4)]); el(px + (k - 0.5) * 18 - 6, py + (k2 - 0.5) * 14 - 7, 11 + k * 5, 7 + k2 * 3, 'rgba(90,150,80,0.13)'); }
    // juste au sud de l'herbe : des buissons bas, plus clairs, pour que le bord du sentier se lise bien
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (tile[I(x, y)] !== W.BUILD || !(F(x, y - 1) || F(x, y - 2))) continue; const k = W.hash(x + 5, y + 9), px = x * T + 20, py = y * T + 20; el(px, py + 4, 27, 22, '#1d4a26'); el(px - 8 + k * 6, py - 2, 15, 12, '#2a6a32'); el(px + 9 - k * 5, py + 3, 13, 10, '#256030'); el(px - 9 + k * 6, py - 6, 7, 4, 'rgba(150,215,120,0.22)'); if (k > 0.7) { el(px + 6, py - 3, 1.8, 1.8, '#e04a4a'); el(px - 3, py + 5, 1.8, 1.8, '#e04a4a'); } }
    // sous les arbres du bord : un sol d'ombre et de mousse
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (tile[I(x, y)] !== W.TREE) continue; const k = W.hash(x, y); el(x * T + 20, y * T + 20, 31, 29, k < 0.5 ? '#1c4424' : '#1f4a27'); }
    // la clairière : de l'herbe, posée en grosses taches rondes pour que le bord ne soit jamais droit
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; el(x * T + 20, y * T + 20, 30, 29, '#2c6a30'); }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; const k = W.hash(x, y), k2 = W.hash(x + 11, y + 5); el(x * T + 20 + (k - 0.5) * 8, y * T + 20 + (k2 - 0.5) * 8, 25, 23, ['#3a8038', '#3f873b', '#377a36', '#438c3e'][Math.floor(k * 4)]); }
    // le passage des bêtes : de la terre battue le long des boyaux et au milieu des salles
    const terre = (x, y, r) => { el(x, y, r, r * 0.62, 'rgba(122,94,56,0.34)'); el(x + 3, y - 2, r * 0.6, r * 0.34, 'rgba(150,118,74,0.22)'); };
    P.couloirs.forEach(q => { for (let x = q.x1; x <= q.mx + 1; x++) terre(x * T + 20, (q.y1 + 1) * T, 26 + rng() * 8); for (let y = Math.min(q.y1, q.y2); y <= Math.max(q.y1, q.y2) + 1; y++) terre((q.mx + 1) * T, y * T + 20, 26 + rng() * 8); for (let x = q.mx; x <= q.x2; x++) terre(x * T + 20, (q.y2 + 1) * T, 26 + rng() * 8); });
    P.salles.forEach((s, i) => { const cx = (s.x0 + s.w / 2) * T, cy = (s.y0 + s.h / 2) * T; for (let k = 0; k < 5; k++) terre(cx + (rng() - 0.5) * s.w * T * 0.5, cy + (rng() - 0.5) * s.h * T * 0.4, 34 + rng() * 26);
      if (i === P.salles.length - 1) { el(cx + T * 2, cy + 6, 70, 40, 'rgba(96,72,42,0.5)'); el(cx + T * 2, cy + 4, 46, 25, 'rgba(70,52,30,0.45)'); } }); /* la tanière du chef de meute : un grand creux de terre nue */
    // l'ombre des arbres sur le bord de l'herbe
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; const px = x * T, py = y * T; g.fillStyle = 'rgba(8,30,14,0.3)'; if (!F(x, y - 1)) el(px + 20, py + 2, 24, 12, 'rgba(8,30,14,0.34)'); if (!F(x - 1, y)) el(px + 1, py + 20, 9, 22, 'rgba(8,30,14,0.22)'); if (!F(x + 1, y)) el(px + T - 1, py + 20, 9, 22, 'rgba(8,30,14,0.22)'); }
    // les petites choses par terre : touffes d'herbe, fleurs, champignons, feuilles mortes, os rongés, traces de pattes
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (tile[I(x, y)] !== W.FLOOR) continue; const px = x * T + 6 + rng() * 28, py = y * T + 8 + rng() * 26, q = rng();
      if (q < 0.34) { g.strokeStyle = rng() < 0.5 ? '#5aa84a' : '#2f6e30'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); for (let j = -1; j <= 1; j++) { g.moveTo(px + j * 3, py); g.lineTo(px + j * 5, py - 6 - rng() * 3); } g.stroke(); }
      else if (q < 0.42) { const col = ['#ffe36b', '#ffffff', '#ffb3d1', '#b8a8ff'][Math.floor(rng() * 4)]; for (let j = 0; j < 4; j++) el(px + Math.cos(j * 1.57) * 2.6, py + Math.sin(j * 1.57) * 2.6, 1.8, 1.8, col); el(px, py, 1.4, 1.4, '#e8a020'); }
      else if (q < 0.48) { g.fillStyle = '#f0e6cc'; g.fillRect(px - 1.2, py - 5, 2.4, 5); g.fillStyle = rng() < 0.5 ? '#c8402a' : '#b07a3a'; g.beginPath(); g.ellipse(px, py - 5, 5, 3.6, 0, Math.PI, 0); g.fill(); }
      else if (q < 0.6) { for (let j = 0; j < 3; j++) { g.save(); g.translate(px + (rng() - 0.5) * 16, py + (rng() - 0.5) * 12); g.rotate(rng() * 3); el(0, 0, 4, 2, ['#b8742c', '#c89a3a', '#8e5a22'][j]); g.restore(); } }
      else if (q < 0.65) { g.strokeStyle = '#ddd6c2'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 6, py - 2); g.lineTo(px + 6, py + 2); g.stroke(); [[-7, -3], [-7, -0.6], [7, 1], [7, 3.4]].forEach(o => el(px + o[0], py + o[1], 1.9, 1.9, '#ddd6c2')); }
      else if (q < 0.7) { g.save(); g.translate(px, py); g.rotate(rng() * TAU); for (let j = 0; j < 2; j++) { const ox = j * 9 - 4, oy = j * 12 - 6; el(ox, oy, 3, 2.4, 'rgba(50,36,18,0.4)'); [[-3, -3.4], [0, -4.6], [3, -3.4]].forEach(o => el(ox + o[0], oy + o[1], 1.2, 1.2, 'rgba(50,36,18,0.4)')); } g.restore(); } }
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
  }
  function peindreLave() {
    const P = plan(), c = W.terrain = document.createElement('canvas'); c.width = MW * T; c.height = MH * T; const g = c.getContext('2d'), I = W.idx, tile = W.tile, rng = CG.makeRng(CG.S.arene.seed + 9); torches = []; mareL = [];
    g.fillStyle = '#5a1206'; g.fillRect(0, 0, c.width, c.height);
    const tous = P.salles.concat(P.recoins), M = 11, x0 = Math.max(1, Math.min.apply(null, tous.map(s => s.x0)) - M), x1 = Math.min(MW - 2, Math.max.apply(null, tous.map(s => s.x0 + s.w)) + M), y0 = Math.max(1, Math.min.apply(null, tous.map(s => s.y0)) - M), y1 = Math.min(MH - 2, Math.max.apply(null, tous.map(s => s.y0 + s.h)) + M);
    const Lm = (x, y) => cols.get(x + y * 1000) === 'l', F = (x, y) => tile[I(x, y)] === W.FLOOR && !Lm(x, y), salle = (x, y) => tous.some(s => x >= s.x0 - 1 && x <= s.x0 + s.w && y >= s.y0 - 1 && y <= s.y0 + s.h);
    // la mer de lave : une nappe en fusion toute lisse (zones sombres, zones brûlantes, cœurs presque blancs), quelques plaques de croûte noire au bord rougeoyant, des bulles
    const LX = x0 * T, LY = y0 * T, LW = (x1 - x0 + 1) * T, LH = (y1 - y0 + 1) * T, nb = Math.round(LW * LH / 9000), ou = () => [LX + rng() * LW, LY + rng() * LH];
    const halo = (x, y, r, c0, c1) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    const plaque = (x, y, R) => { const n = 6 + Math.floor(rng() * 3), a0 = rng() * TAU, pts = []; for (let j = 0; j < n; j++) { const a = a0 + j / n * TAU, r = R * (0.7 + rng() * 0.45); pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.72]); }
      const trace = (k, dx, dy) => { g.beginPath(); pts.forEach((q, j) => { if (j) g.lineTo(x + q[0] * k + dx, y + q[1] * k + dy); else g.moveTo(x + q[0] * k + dx, y + q[1] * k + dy); }); g.closePath(); };
      g.lineJoin = 'round'; trace(1, 0, 0); g.strokeStyle = 'rgba(255,200,80,0.55)'; g.lineWidth = 5; g.stroke(); g.strokeStyle = 'rgba(255,240,170,0.9)'; g.lineWidth = 1.6; g.stroke(); g.fillStyle = '#34130a'; g.fill(); trace(0.72, -1, -1.5); g.fillStyle = '#4e1e10'; g.fill(); };
    g.fillStyle = '#e24a0e'; g.fillRect(LX, LY, LW + 1, LH + 1);
    for (let i = 0; i < nb; i++) { const q = ou(); halo(q[0], q[1], 80 + rng() * 120, 'rgba(160,30,4,0.5)', 'rgba(160,30,4,0)'); }
    for (let i = 0; i < nb * 1.3; i++) { const q = ou(); halo(q[0], q[1], 55 + rng() * 95, 'rgba(255,165,40,0.5)', 'rgba(255,165,40,0)'); }
    for (let i = 0; i < nb * 0.5; i++) { const q = ou(); halo(q[0], q[1], 16 + rng() * 26, 'rgba(255,238,150,0.6)', 'rgba(255,220,100,0)'); }
    for (let i = 0; i < nb * 0.7; i++) { const q = ou(); plaque(q[0], q[1], 9 + rng() * 15); }
    for (let i = 0; i < nb * 0.6; i++) { const q = ou(), r = 2.5 + rng() * 3; g.fillStyle = 'rgba(255,150,40,0.6)'; g.beginPath(); g.arc(q[0], q[1], r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,238,160,0.85)'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = 'rgba(255,255,230,0.9)'; g.beginPath(); g.arc(q[0] - r * 0.3, q[1] - r * 0.35, r * 0.28, 0, TAU); g.fill(); }
    [[x0 * T, y0 * T, (x1 - x0 + 1) * T, 3 * T, 0, 1], [x0 * T, (y1 - 2) * T, (x1 - x0 + 1) * T, 3 * T, 0, -1], [x0 * T, y0 * T, 3 * T, (y1 - y0 + 1) * T, 1, 0], [(x1 - 2) * T, y0 * T, 3 * T, (y1 - y0 + 1) * T, -1, 0]].forEach(r => { const gr = g.createLinearGradient(r[4] > 0 ? r[0] : r[4] < 0 ? r[0] + r[2] : 0, r[5] > 0 ? r[1] : r[5] < 0 ? r[1] + r[3] : 0, r[4] > 0 ? r[0] + r[2] : r[4] < 0 ? r[0] : 0, r[5] > 0 ? r[1] + r[3] : r[5] < 0 ? r[1] : 0); gr.addColorStop(0, '#5a1206'); gr.addColorStop(1, 'rgba(90,18,6,0)'); g.fillStyle = gr; g.fillRect(r[0], r[1], r[2] + 1, r[3] + 1); });
    // le sol où l'on marche : de grandes dalles de pierre volcanique posées sur de la terre battue ; par endroits les dalles manquent et on marche sur la terre
    const terre = (x, y) => W.hash(Math.floor(x / 3) * 11 + 5, Math.floor(y / 3) * 13 + 2) + (W.hash(x * 3 + 1, y * 7 + 4) - 0.5) * 0.55 < 0.36;
    const dalle = (x, y, w, h, k) => { const L = 31 + k * 9; g.fillStyle = 'hsl(' + (16 + k * 10) + ',9%,' + L + '%)'; g.beginPath(); if (g.roundRect) g.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 4); else g.rect(x + 1.5, y + 1.5, w - 3, h - 3); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(x + 4, y + 2.5, w - 8, 1.6); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + 4, y + h - 4.5, w - 8, 2.2);
      if (k > 0.78) { g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(x + w * 0.6, y + h * 0.55, w * 0.16, h * 0.1, k * 4, 0, TAU); g.fill(); } };
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; const k = W.hash(x, y), px = x * T, py = y * T;
      g.fillStyle = 'hsl(' + (22 + k * 6) + ',27%,' + (20 + k * 4) + '%)'; g.fillRect(px - 1, py - 1, T + 2, T + 2); }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; const k = W.hash(x, y), px = x * T, py = y * T, H = (a, b) => W.hash(x * 5 + a, y * 9 + b);
      if (terre(x, y)) { /* la terre battue : quelques cailloux, des creux plus sombres */
        for (let j = 0; j < 3; j++) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(px + 5 + H(j, 1) * 30, py + 5 + H(j, 2) * 30, 3 + H(j, 3) * 5, 1.5 + H(j, 4) * 2, 0, 0, TAU); g.fill(); }
        for (let j = 0; j < 3; j++) { const cx = px + 5 + H(j, 5) * 30, cy = py + 6 + H(j, 6) * 28, r = 1.6 + H(j, 7) * 2.2; g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx + 0.6, cy + 1, r, r * 0.7, 0, 0, TAU); g.fill(); g.fillStyle = 'hsl(20,10%,' + (38 + H(j, 8) * 12) + '%)'; g.beginPath(); g.ellipse(cx, cy, r, r * 0.7, 0, 0, TAU); g.fill(); }
        continue; }
      const q = W.hash(x * 13 + 7, y * 17 + 3), m = T / 2;
      if (q < 0.42) dalle(px, py, T, T, k); else if (q < 0.7) { dalle(px, py, T, m, k); dalle(px, py + m, T, m, H(1, 9)); } else if (q < 0.9) { dalle(px, py, m, T, k); dalle(px + m, py, m, T, H(2, 9)); } else { dalle(px, py, m, m, k); dalle(px + m, py, m, m, H(3, 9)); dalle(px, py + m, m, m, H(4, 9)); dalle(px + m, py + m, m, m, H(5, 9)); } }
    // le bord de la roche : chauffé au rouge du côté de la lave (les ponts n'ont pas de mur, on voit la lave tout contre)
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; const px = x * T, py = y * T; [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(d => { const X = x + d[0], Y = y + d[1]; if (F(X, Y) || (salle(X, Y) && !Lm(X, Y))) return; const gr = g.createLinearGradient(px + (d[0] > 0 ? T : d[0] < 0 ? 0 : 0), py + (d[1] > 0 ? T : 0), px + (d[0] > 0 ? T - 13 : d[0] < 0 ? 13 : 0), py + (d[1] > 0 ? T - 13 : d[1] < 0 ? 13 : 0)); gr.addColorStop(0, 'rgba(255,130,40,0.6)'); gr.addColorStop(1, 'rgba(255,110,30,0)'); g.fillStyle = gr; g.fillRect(px, py, T, T); g.fillStyle = '#1a0c08'; if (d[1]) g.fillRect(px, d[1] > 0 ? py + T - 3 : py, T, 3); else g.fillRect(d[0] > 0 ? px + T - 3 : px, py, 3, T); }); }
    // les parois des salles : de gros blocs de basalte
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (F(x, y) || cols.has(x + y * 1000) || !salle(x, y)) continue; let pres = false; for (let dy = -1; dy <= 1 && !pres; dy++) for (let dx = -1; dx <= 1; dx++) if (F(x + dx, y + dy) || cols.has(x + dx + (y + dy) * 1000)) { pres = true; break; } if (!pres) continue; const px = x * T, py = y * T, k = W.hash(x * 3, y * 5);
      if (F(x, y + 1) || cols.has(x + (y + 1) * 1000)) { g.fillStyle = '#120a08'; g.fillRect(px, py - 14, T, 14); g.fillStyle = 'hsl(14,16%,' + (20 + k * 6) + '%)'; g.fillRect(px, py, T, T); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(px, py + T * 0.5, T, T * 0.5);
        g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(px + 8 + k * 14, py); g.lineTo(px + 14 + k * 8, py + 20); g.lineTo(px + 6 + k * 20, py + T); g.moveTo(px + 26, py + 6); g.lineTo(px + 32 - k * 8, py + T); g.stroke();
        g.fillStyle = 'hsl(14,16%,' + (30 + k * 6) + '%)'; g.fillRect(px, py - 3, T, 5); if (k > 0.7) { g.fillStyle = 'rgba(255,120,30,0.55)'; g.fillRect(px + 10 + k * 10, py + 8, 2.5, 22); g.fillStyle = 'rgba(255,220,120,0.6)'; g.fillRect(px + 10.7 + k * 10, py + 12, 1.1, 14); } /* un filet de lave qui coule dans la paroi */
        const lu = g.createLinearGradient(0, py + T - 12, 0, py + T); lu.addColorStop(0, 'rgba(255,110,30,0)'); lu.addColorStop(1, 'rgba(255,110,30,0.22)'); g.fillStyle = lu; g.fillRect(px, py + T - 12, T, 12);
      } else { g.fillStyle = 'hsl(14,14%,' + (9 + k * 4) + '%)'; g.fillRect(px, py, T, T); g.fillStyle = 'rgba(255,255,255,0.045)'; g.fillRect(px + 3 + k * 10, py + 4 + k * 12, 14, 9); g.fillRect(px + 20 - k * 8, py + 22, 12, 10); } }
    // les mares de lave dans les salles
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!Lm(x, y)) continue; const px = x * T, py = y * T, k = W.hash(x * 5, y * 9); g.fillStyle = '#1a0c08'; g.fillRect(px - 2, py - 2, T + 4, T + 4); }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!Lm(x, y)) continue; const px = x * T, py = y * T, k = W.hash(x * 5, y * 9), a = Lm(x - 1, y) ? 0 : 3, b = Lm(x + 1, y) ? 0 : 3, h = Lm(x, y - 1) ? 0 : 5, d = Lm(x, y + 1) ? 0 : 2;
      g.fillStyle = 'hsl(' + (25 + k * 4) + ',98%,' + (51 + k * 3) + '%)'; g.fillRect(px + a, py + h, T - a - b, T - h - d); mareL.push({ x: px + T / 2, y: py + T / 2, a, b, h, d }); }
    if (mareL.length) { g.save(); g.beginPath(); mareL.forEach(m => g.rect(m.x - T / 2 + m.a, m.y - T / 2 + m.h, T - m.a - m.b, T - m.h - m.d)); g.clip(); /* la même lave lisse, sans déborder sur la pierre */
      mareL.forEach(m => { halo(m.x - 14 + rng() * 28, m.y - 14 + rng() * 28, 20 + rng() * 16, 'rgba(255,225,110,0.5)', 'rgba(255,200,80,0)'); if (rng() < 0.3) halo(m.x - 14 + rng() * 28, m.y - 14 + rng() * 28, 22 + rng() * 14, 'rgba(160,30,4,0.4)', 'rgba(160,30,4,0)'); });
      mareL.forEach(m => { const q = rng(); if (q < 0.14) plaque(m.x - 6 + rng() * 12, m.y - 4 + rng() * 10, 6 + rng() * 5); else if (q < 0.4) { const bx = m.x - 12 + rng() * 24, by = m.y - 10 + rng() * 20, r = 2 + rng() * 2.4; g.fillStyle = 'rgba(255,150,40,0.6)'; g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,238,160,0.85)'; g.lineWidth = 1.1; g.stroke(); } });
      g.restore(); mareL.forEach(m => { if (m.h) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(m.x - T / 2 + m.a, m.y - T / 2 + m.h, T - m.a - m.b, 4); } }); }
    tous.forEach(s => { for (let i = 0; i < Math.round(s.w * s.h / 20); i++) { const px = s.x0 * T + 14 + rng() * (s.w * T - 28), py = s.y0 * T + 22 + rng() * (s.h * T - 36), q = rng(); if (!W.walkPx(px, py) || Lm(Math.floor(px / T), Math.floor(py / T)) || Lm(Math.floor((px - 12) / T), Math.floor(py / T)) || Lm(Math.floor((px + 12) / T), Math.floor(py / T))) continue;
      if (q < 0.45) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(px, py + 3, 12, 4, 0, 0, TAU); g.fill(); for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#3a2a24' : '#2a1c18'; g.fillRect(px - 9 + j * 5, py - 3 + (j % 2) * 3, 6, 5); } }
      else if (q < 0.65) { g.strokeStyle = '#cfc8b4'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 7, py - 2); g.lineTo(px + 7, py + 3); g.moveTo(px - 5, py + 4); g.lineTo(px + 6, py - 4); g.stroke(); }
      else { g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(px, py, 8 + rng() * 14, 4 + rng() * 6, 0, 0, TAU); g.fill(); } } });
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
  }
  // la lave vit : les mares battent doucement, des braises montent
  let halo = null;
  { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); if (mode() !== 'lave' || !CG.R) return;
    if (!halo) { halo = document.createElement('canvas'); halo.width = halo.height = 128; const c = halo.getContext('2d'), gr = c.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, 'rgba(255,190,80,0.5)'); gr.addColorStop(0.4, 'rgba(255,120,30,0.2)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); }
    g.save(); g.globalCompositeOperation = 'lighter'; for (const q of mareL) { if (!CG.onScreen(q.x, q.y)) continue; const k = 0.55 + Math.sin(t * 1.7 + q.x * 0.013 + q.y * 0.021) * 0.3; g.globalAlpha = k; g.drawImage(halo, q.x - 46, q.y - 40, 92, 80); } g.restore();
  }; }
  { const u0 = G.update; G.update = function (dt) { u0.apply(this, arguments); if (mode() !== 'lave') return; const R = CG.R, p = CG.S.player; if (!R || !R.parts) return;
    if (dansLave(p.x, p.y) && !(R.ko > 0) && !R.cine) { R.laveT = (R.laveT || 0) - dt; if (R.laveT <= 0) { R.laveT = Gn.LAVE_TIC; G.hurtPlayer(Gn.LAVE_DMG + Gn.LAVE_JOUR * CG.S.day); G.puff(p.x, p.y - 8, '#ff8a1e', 10, 90, 3); CG.sfx('fire'); } } else R.laveT = 0; /* le premier pas brûle tout de suite */
    if (CG.P && CG.P.hurt) for (const a of CG.S.pets || []) { if (a.ko || a.dead || a.hidden || (CG.P.KINDS[a.kind] || {}).fly || !dansLave(a.x, a.y)) { a.laveT = 0; continue; } a.laveT = (a.laveT || 0) - dt; if (a.laveT <= 0) { a.laveT = Gn.LAVE_TIC; CG.P.hurt(a, Gn.LAVE_DMG + Gn.LAVE_JOUR * CG.S.day); if (CG.onScreen(a.x, a.y)) G.puff(a.x, a.y - 6, '#ff8a1e', 8, 80, 3); } } /* les animaux aussi, sauf ceux qui volent */
    if (Math.random() < dt * 14) { const x = p.x + rand(-560, 560), y = p.y + rand(-340, 340); if (!W.walkPx(x, y)) R.parts.push({ x, y, vx: rand(-10, 10), vy: -rand(25, 70), life: rand(0.6, 1.3), max: 1.3, col: Math.random() < 0.5 ? '#ffb432' : '#ff6a1e', size: rand(2, 4), float: true }); } }; }
  // les animaux contournent la lave : pendant qu'ils bougent, une mare compte comme un mur pour eux (sauf si l'un d'eux est déjà dedans : il doit pouvoir en sortir)
  { let evite = false; const wt0 = W.walkTile; W.walkTile = function (x, y) { if (evite && cols.get(x + y * 1000) === 'l') return false; return wt0(x, y); };
    if (CG.P && CG.P.update) { const pu0 = CG.P.update; CG.P.update = function () { if (mode() !== 'lave') return pu0.apply(this, arguments);
      evite = !(CG.S.pets || []).some(a => !a.ko && !(CG.P.KINDS[a.kind] || {}).fly && dansLave(a.x, a.y)); try { return pu0.apply(this, arguments); } finally { evite = false; } }; } }
  { const u1 = G.update; G.update = function (dt) { const p0 = CG.S && CG.S.player, x0 = p0 && p0.x, y0 = p0 && p0.y; u1.apply(this, arguments); if (mode() !== 'glace') return; const R = CG.R, p = CG.S.player; if (!R || !R.parts) return; /* il neige dans le château de glace */
    if (dt > 0) { const gs = R.glisse || (R.glisse = { vx: 0, vy: 0 }), vx = (p.x - x0) / dt, vy = (p.y - y0) / dt; /* la glace : le chef met un instant à partir, et glisse un peu avant de s'arrêter */
      if (p !== p0 || R.cine || R.ko > 0 || R.passe > 0 || Math.hypot(vx, vy) > 900) { gs.vx = gs.vy = 0; } /* un bond, un portail : on ne s'en mêle pas */
      else { const k = 1 - Math.exp(-dt * Gn.GLISSE); gs.vx += (vx - gs.vx) * k; gs.vy += (vy - gs.vy) * k; if (Math.hypot(vx, vy) < 1 && Math.hypot(gs.vx, gs.vy) < 5) gs.vx = gs.vy = 0; /* on ne s'arrête net que si le chef ne pousse plus : sinon, à 60 images par seconde, l'élan repartait de zéro à chaque image et il restait sur place */ p.x = x0; p.y = y0; G.slide(p, gs.vx * dt, gs.vy * dt, 9); if (p.x === x0) gs.vx = 0; if (p.y === y0) gs.vy = 0; } }
    if (Math.random() < dt * 26) R.parts.push({ x: p.x + rand(-720, 720), y: p.y + rand(-460, 300), vx: rand(-26, -6), vy: rand(30, 60), life: rand(1.2, 2.4), max: 2.4, col: '#ffffff', size: rand(2, 4), float: true }); }; }
  // la cage : fermée tant qu'il reste un monstre, ouverte ensuite
  const cage = { draw(g, o, t) { const Gr = (CG.R && CG.R.grotte) || {}, libre = !!Gr.libre || !!(CG.S.arene && CG.S.arene.gagne), coups = libre ? Gn.CAGE.COUPS : (Gr.cage || 0), sec = Gr.cageT > 0 ? Math.sin(Gr.cageT * 70) * 3.5 * Math.min(1, Gr.cageT * 5) : 0, x = o.x + sec, y = o.y; t = t || 0;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x, y + 3, 24, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#2a2420'; g.fillRect(x - 21, y - 4, 42, 8);
    g.strokeStyle = '#4a443e'; g.lineWidth = 3; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(x + i * 9, y - 4); g.lineTo(x + i * 9, y - 52); } g.stroke(); /* les barreaux du fond */
    const bx = x, by = y - 4; /* l'apprenti : un petit nain en tablier (une fois libre, il marche : nain() plus bas) */
    if (!libre) nain(g, bx, by, 0, false);
    { /* les barreaux de devant : à chaque coup, un de plus se tord puis casse */ const ORD = [0, 2, 4, 1, 3]; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = -2; i <= 2; i++) { const rang = ORD.indexOf(i + 2), X = x + i * 9 + 4, casse = coups * 5 / Gn.CAGE.COUPS; g.strokeStyle = '#6a645c'; g.beginPath();
        if (rang < Math.floor(casse)) { g.moveTo(X, y + 2); g.lineTo(X + (i % 2 ? 3 : -3), y - 9); g.moveTo(X, y - 50); g.lineTo(X + (i % 2 ? -2 : 3), y - 41); } /* cassé : deux moignons */
        else if (rang < casse + 0.99 && coups > 0) { g.moveTo(X, y + 2); g.quadraticCurveTo(X + (i % 2 ? 7 : -7), y - 24, X, y - 50); } /* tordu */
        else { g.moveTo(X, y + 2); g.lineTo(X, y - 50); } g.stroke(); }
      if (!libre && Math.sin(t * 2.2) > 0.3) { g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.fillText('À l\'aide !', x, y - 66); } }
    g.fillStyle = '#3a342e'; g.fillRect(x - 23, y - 58, 46, 7); g.fillStyle = '#5a544c'; g.fillRect(x - 23, y - 58, 46, 2);
  } };
  Gn.CAGE = { COUPS: 5, PRES: 74, SUIT: 52, VITESSE: 135, ARRIVE: 120 };
  // l'apprenti : un petit nain en tablier ; il marche quand on l'escorte
  function nain(g, bx, by, pas, joie) {
    const hop = joie ? Math.abs(Math.sin(pas * 6)) * 5 : Math.abs(Math.sin(pas * 9)) * 2; by -= hop;
    g.fillStyle = '#6a4a2a'; g.fillRect(bx - 7, by - 20, 14, 16); g.fillStyle = '#8a6a44'; g.fillRect(bx - 5, by - 18, 10, 12); g.fillStyle = '#e8b890'; g.beginPath(); g.arc(bx, by - 26, 7, 0, TAU); g.fill(); g.fillStyle = '#c8642a'; g.beginPath(); g.moveTo(bx - 7, by - 25); g.quadraticCurveTo(bx, by - 8, bx + 7, by - 25); g.closePath(); g.fill(); g.fillStyle = '#7a8088'; g.beginPath(); g.arc(bx, by - 30, 7.4, Math.PI, TAU); g.fill(); g.fillStyle = '#1a1410'; g.fillRect(bx - 3.4, by - 28, 1.8, 2); g.fillRect(bx + 1.6, by - 28, 1.8, 2);
    const k = Math.sin(pas * 9) * 2.5; g.fillStyle = '#3a2a1a'; g.fillRect(bx - 6, by - 4 + hop + Math.max(0, -k), 5, 4); g.fillRect(bx + 1, by - 4 + hop + Math.max(0, k), 5, 4);
    if (joie) { g.strokeStyle = '#e8b890'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - 7, by - 18); g.lineTo(bx - 12, by - 30); g.moveTo(bx + 7, by - 18); g.lineTo(bx + 12, by - 30); g.stroke(); }
  }
  const nainO = { draw(g, o, t) { const Gr = CG.R.grotte || {}, n = Gr.nain; if (!n) return; g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(n.x, n.y + 2, 10, 4, 0, 0, TAU); g.fill(); nain(g, n.x, n.y, n.moving ? n.step : (Gr.arrive ? t : 0), !!Gr.arrive);
    if (!Gr.arrive && !n.moving && Math.sin(t * 2) > 0.5) { g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('Je te suis !', n.x, n.y - 46); } } };
  // un coup de bâton sur la cage (aucun ennemi touché, le chef tout près et tourné vers elle)
  { const sb0 = G.strikeBuilding; G.strikeBuilding = function () {
      if (mode() !== 'lave') return sb0.apply(this, arguments); const R = CG.R, Gr = R.grotte, q = plan().cage, p = CG.S.player; if (!Gr || !q || Gr.libre || CG.S.arene.gagne) return sb0.apply(this, arguments);
      const dx = q.x - p.x, dy = q.y - 20 - p.y, d = Math.hypot(dx, dy) || 1; if (d > Gn.CAGE.PRES || (dx * R.dir.x + dy * R.dir.y) / d < 0.1) return sb0.apply(this, arguments);
      Gr.cage = (Gr.cage || 0) + 1; Gr.cageT = 0.3; CG.sfx('chop'); R.shake = Math.max(R.shake || 0, 0.18); G.puff(q.x, q.y - 28, '#b8b0a4', 9, 120, 3); G.puff(q.x, q.y - 28, '#ffe36b', 5, 90, 2);
      if (Gr.cage < Gn.CAGE.COUPS) { G.text(q.x, q.y - 76, Gr.cage >= Gn.CAGE.COUPS - 1 ? 'Encore un coup !' : 'CLANG !', '#ffe9a8', true); return; }
      Gr.libre = true; Gr.nain = { x: q.x - 40, y: q.y + 6, step: 0, face: -1, moving: false, path: null, rp: 0 }; CG.sfx('coffre'); G.puff(q.x, q.y - 28, '#b8b0a4', 26, 190, 5); R.rings.push({ x: q.x, y: q.y - 20, r: 80, life: 0.5, col: '#ffe9a8' });
      G.banner('La cage est brisée !', 'L\'apprenti te suit. Ramène-le jusqu\'à l\'entrée, là où tu es arrivé.', '#ffe9a8');
    };
    // l'escorte : il suit le chef pas à pas ; arrivé à l'entrée, c'est gagné
    const ue = G.update; G.update = function (dt) {
      ue.apply(this, arguments); if (mode() !== 'lave') return; const S = CG.S, R = CG.R, Gr = R && R.grotte, p = S.player; if (!Gr || Mo.pending) return;
      if (!Gr.entree) Gr.entree = { x: p.x, y: p.y }; if (Gr.cageT > 0) Gr.cageT -= dt; const n = Gr.nain; if (!n || Gr.arrive) return;
      const d = Math.hypot(p.x - n.x, p.y - n.y); n.rp -= dt;
      if (d > Gn.CAGE.SUIT) { if (n.rp <= 0 || !n.path || !n.path.length) { n.rp = 0.45; n.path = W.path(n.x, n.y, p.x, p.y); } if (n.path && n.path.length) G.follow0(n, Gn.CAGE.VITESSE * (d > 260 ? 1.6 : 1), dt); else n.moving = false; } else { n.moving = false; n.path = null; }
      if (Math.hypot(n.x - Gr.entree.x, n.y - Gr.entree.y) < Gn.CAGE.ARRIVE) { Gr.arrive = true; n.moving = false; Ar.gagner(); sortie(Gr.entree.x + 46, Gr.entree.y + 10); G.banner('L\'apprenti est sauvé !', 'Un passage s\'ouvre à côté de toi : prends-le (E) pour ressortir.', '#ffe9a8'); }
    }; }
  if (CG.Armee && CG.Armee.pousser) { const po1 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po1.apply(this, arguments); if (mode() !== 'lave') return; const q = plan().cage; if (q && CG.onScreen(q.x, q.y)) push(q.y, 21, Object.assign({ x: q.x, y: q.y }, cage), null); const n = CG.R.grotte && CG.R.grotte.nain; if (n && CG.onScreen(n.x, n.y)) push(n.y, 21, Object.assign({ x: n.x, y: n.y }, nainO), null); }; }
  const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments), m = mode(); if (!m || CG.S.arene.gagne) return r; if (m === 'nid') peupler(); else peuplerChateau(); coffres(m); barils(bois() ? 'bois' : m); return r; };
  Gn.plan = () => plan();
  // ---------- des barils (ou des jarres, selon l'endroit) : un coup de bâton les casse, et il en tombe parfois quelque chose ----------
  Gn.BARIL = { PAR_SALLE: [0, 2], RIEN: 0.4, PRES: 52, CORPS: 15, LARGE: 14 }; /* LARGE : le baril est gros, le coup le touche avant d'arriver à son milieu */
  function barils(m) {
    const R = CG.R, P = plan(), p = CG.S.player, B = R.barils = [], pris = (x, y) => B.some(b => Math.hypot(b.x - x, b.y - y) < 30) || R.chests.some(c => Math.hypot(c.x - x, c.y - y) < 44) || Math.hypot(p.x - x, p.y - y) < 90 || (P.cage && Math.hypot(P.cage.x - x, P.cage.y - y) < 90);
    const libre = (x, y) => W.walkPx(x, y) && W.walkPx(x - 12, y) && W.walkPx(x + 12, y) && W.walkPx(x, y - 10) && ![[0, 0], [-12, 0], [12, 0], [0, 10]].some(q => cols.has(Math.floor((x + q[0]) / T) + Math.floor((y + q[1]) / T) * 1000));
    P.salles.concat(P.recoins).forEach(s => { const n = CG.irand(Gn.BARIL.PAR_SALLE[0], Gn.BARIL.PAR_SALLE[1]); for (let i = 0, k = 0; i < n && k < 30; k++) { const bord = Math.floor(Math.random() * 4), u = Math.random();
        const x = bord < 2 ? s.x0 * T + 18 + u * (s.w * T - 36) : bord === 2 ? s.x0 * T + 18 : (s.x0 + s.w) * T - 18, y = bord === 0 ? s.y0 * T + 24 : bord === 1 ? (s.y0 + s.h) * T - 12 : s.y0 * T + 24 + u * (s.h * T - 40);
        if (!libre(x, y) || pris(x, y)) continue; B.push({ x, y, biome: m, v: Math.random() }); i++; if (Math.random() < 0.4 && libre(x + 24, y + 4) && !pris(x + 24, y + 4)) { B.push({ x: x + 24, y: y + 4, biome: m, v: Math.random() }); i++; } } });
  }
  function casser(b) {
    const R = CG.R, S = CG.S, i = R.barils.indexOf(b); if (i < 0) return; R.barils.splice(i, 1); const col = { lave: '#5a4a44', glace: '#bfe6ff', eau: '#b06a48' }[b.biome] || '#8a5a2a';
    G.puff(b.x, b.y - 12, col, 16, 150, 4); G.puff(b.x, b.y - 12, '#e8dcc0', 6, 90, 3); if (CG.onScreen(b.x, b.y)) CG.sfx('chop');
    const q = Math.random(); if (q < Gn.BARIL.RIEN) return;
    if (q < 0.76) G.dropRes(b.x, b.y, 'or', CG.irand(4, 9) + S.day); else if (q < 0.88) for (let k = 0; k < 2; k++) G.drop(b.x, b.y, { kind: 'xp', n: 3 + S.day }); else if (q < 0.96) G.drop(b.x, b.y, { kind: 'potion', n: 1 }); else { G.dropRes(b.x, b.y, 'or', 30 + S.day * 4); G.text(b.x, b.y - 40, 'Un magot !', '#ffe36b', true); }
  }
  { const sb1 = G.strikeBuilding; G.strikeBuilding = function () { const R = CG.R, B = mode() && R.barils, p = CG.S.player; if (B && B.length) { let best = null, bd = Gn.BARIL.PRES; for (const b of B) { const dx = b.x - p.x, dy = b.y - 10 - p.y, d = Math.hypot(dx, dy) || 1; if (d < bd && (d < 22 || (dx * R.dir.x + dy * R.dir.y) / d > 0.1)) { bd = d; best = b; } } if (best) return casser(best); } return sb1.apply(this, arguments); };
    // un coup d'arme casse les barils qu'il atteint, même si un ennemi est touché en même temps ; le coup tournoyant casse tout autour
    const at1 = G.attack; G.attack = function () { const R = CG.R, cd = R ? R.atkCd : 0, r = at1.apply(this, arguments), B = CG.R && mode() && CG.R.barils; if (!B || !B.length || !(CG.R.atkCd > cd) || !(CG.R.swing >= 0.9)) return r;
      const p = CG.S.player, d0 = CG.R.dir || { x: 1, y: 0 }, tour = G.tech('g4'), portee = (tour ? 60 : 44) + Gn.BARIL.LARGE;
      B.filter(b => { const dx = b.x - p.x, dy = b.y - 10 - p.y, d = Math.hypot(dx, dy) || 1; return d < portee && (tour || d < 28 || (dx * d0.x + dy * d0.y) / d > 0); }).forEach(casser); return r; };
    const bl1 = G.blast; G.blast = function (x, y, r) { const res = bl1.apply(this, arguments), B = mode() && CG.R.barils; if (B) B.filter(b => Math.hypot(b.x - x, b.y - 12 - y) < r).forEach(casser); return res; };
    const ub = G.update; G.update = function (dt) { ub.apply(this, arguments); const R = CG.R, B = R && mode() && R.barils; if (!B || !B.length || R.passe > 0 || R.ko > 0) return; const p = CG.S.player; for (const b of B) { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy); if (d < Gn.BARIL.CORPS) { const m = Gn.BARIL.CORPS - d; G.slide(p, (d ? dx / d : 1) * m, (d ? dy / d : 0) * m, 8); } } };
    const PB = { bois: ['#8e6638', '#6a4722', '#4a4a50'], nid: ['#8e6638', '#6a4722', '#4a4a50'], chateau: ['#6a4a3a', '#4a3226', '#3a3a42'], glace: ['#9cc8e8', '#6ea4d0', '#e8f4ff'], lave: ['#4a3a38', '#2e2224', '#ff8a1e'], eau: ['#b8704a', '#8a4e32', '#58b05a'] };
    const barilO = { draw(g, o) { const b = o.b, C = PB[b.biome] || PB.chateau, x = b.x, y = b.y, jarre = b.biome === 'lave' || b.biome === 'eau';
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, y + 1, 12, 4.5, 0, 0, TAU); g.fill();
      if (jarre) { g.fillStyle = C[1]; g.beginPath(); g.ellipse(x, y - 11, 10.5, 12.5, 0, 0, TAU); g.fill(); g.fillStyle = C[0]; g.beginPath(); g.ellipse(x - 1.5, y - 12, 8.5, 11, 0, 0, TAU); g.fill(); g.fillStyle = C[1]; g.fillRect(x - 5.5, y - 27, 11, 5); g.fillStyle = C[0]; g.fillRect(x - 7, y - 29, 14, 3.4); g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.ellipse(x - 5, y - 15, 2.2, 5.5, 0.3, 0, TAU); g.fill();
        if (b.biome === 'lave') { g.strokeStyle = C[2]; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x - 4, y - 20); g.lineTo(x, y - 13); g.lineTo(x - 3, y - 6); g.moveTo(x + 4, y - 16); g.lineTo(x + 6, y - 9); g.stroke(); }
        else { g.fillStyle = C[2]; g.beginPath(); g.ellipse(x + 3, y - 4, 6, 2.4, -0.2, 0, TAU); g.ellipse(x - 6, y - 21, 3.4, 1.8, 0.4, 0, TAU); g.fill(); g.strokeStyle = '#e8d8c0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 8, y - 13); g.lineTo(x + 8, y - 13); g.stroke(); }
        return; }
      g.fillStyle = C[1]; g.beginPath(); if (g.roundRect) g.roundRect(x - 10.5, y - 26, 21, 27, 5); else g.rect(x - 10.5, y - 26, 21, 27); g.fill(); g.fillStyle = C[0]; g.beginPath(); if (g.roundRect) g.roundRect(x - 10.5, y - 26, 17, 27, 5); else g.rect(x - 10.5, y - 26, 17, 27); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.beginPath(); [-5, 0, 5].forEach(k => { g.moveTo(x + k, y - 25); g.lineTo(x + k, y); }); g.stroke();
      g.fillStyle = C[2]; g.fillRect(x - 11.5, y - 21, 23, 3); g.fillRect(x - 11.5, y - 7, 23, 3); g.fillStyle = b.biome === 'glace' ? '#ffffff' : C[1]; g.beginPath(); g.ellipse(x, y - 26, 10.5, 3.2, 0, 0, TAU); g.fill();
      if (b.biome === 'glace') { g.fillStyle = 'rgba(255,255,255,0.8)'; [[-8, 0], [-2, 2], [6, 0]].forEach(q => { g.beginPath(); g.moveTo(x + q[0] - 2, y - 18); g.lineTo(x + q[0] + 2, y - 18); g.lineTo(x + q[0], y - 13 + q[1]); g.closePath(); g.fill(); }); }
      else if (b.biome === 'nid') { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x - 11, y - 26); g.lineTo(x + 6, y - 8); g.moveTo(x + 11, y - 24); g.lineTo(x - 4, y - 12); g.moveTo(x - 11, y - 14); g.lineTo(x + 2, y - 27); g.stroke(); } } };
    if (CG.Armee && CG.Armee.pousser) { const po2 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po2.apply(this, arguments); const B = CG.R && mode() && CG.R.barils; if (B) for (const b of B) if (CG.onScreen(b.x, b.y)) push(b.y, 21, Object.assign({ x: b.x, y: b.y, b }, barilO), null); }; } }
  // ---------- des coffres, parfois : dans un recoin ou au coin d'une salle, habillés selon l'endroit ----------
  Gn.COFFRE = { RECOIN: 0.45, SALLE: 0.35, OR: 12 };
  Gn.COFFRES = { nid: 'Coffre pris dans les toiles', chateau: 'Coffre aux ossements', lave: 'Coffre de braise', glace: 'Coffre de glace', eau: 'Coffre englouti' };
  function coffres(m) {
    const R = CG.R, P = plan(), libre = (x, y) => W.walkPx(x, y) && W.walkPx(x - 14, y) && W.walkPx(x + 14, y) && !cols.has(Math.floor(x / T) + Math.floor(y / T) * 1000);
    const mets = (x, y) => { if (!libre(x, y)) return false; R.chests.push({ x, y, kind: Math.random() < 0.35 ? 'magique' : 'precieux', open: false, biome: m }); return true; };
    P.recoins.forEach(r => { if (Math.random() < Gn.COFFRE.RECOIN) mets((r.x0 + 2) * T + 4, (r.y0 + 1) * T + 6); });
    if (Math.random() < Gn.COFFRE.SALLE && P.salles.length > 2) { const s = P.salles[1 + Math.floor(Math.random() * (P.salles.length - 2))], coins = [[s.x0 + 1.5, s.y0 + 1.5], [s.x0 + s.w - 1.5, s.y0 + 1.5], [s.x0 + 1.5, s.y0 + s.h - 1.5], [s.x0 + s.w - 1.5, s.y0 + s.h - 1.5]].sort(() => Math.random() - 0.5); for (const c of coins) if (mets(c[0] * T, c[1] * T)) break; }
  }
  { const oc0 = D.openChest; D.openChest = function (c) { const r = oc0.apply(this, arguments); if (c && c.biome) G.dropRes(c.x, c.y, 'or', Gn.COFFRE.OR * (1 + ((CG.S.arene || {}).palier || 0)) + CG.S.day * 2); return r; };
    const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it && it.type === 'chestDay' && it.obj && it.obj.biome && Gn.COFFRES[it.obj.biome]) it.label = 'Ouvrir : ' + Gn.COFFRES[it.obj.biome]; return it; };
    // leur allure : braise et basalte, glace, bronze verdi et coquillages, bois noir et crâne, bois pris dans les toiles
    const PAL = { lave: ['#2e2226', '#1c1416', '#3a2a2e', '#ff8a1e'], glace: ['#a8d8f4', '#7ab4e0', '#d4f0ff', '#eef6ff'], eau: ['#2f7a6e', '#1f5a52', '#3f9484', '#c8b060'], chateau: ['#2a2030', '#1a1420', '#3a2c44', '#8a8694'], nid: ['#7a5630', '#5a3c1e', '#8e6638', '#b8a070'] };
    const ch0 = Art.chest; Art.chest = function (g, x, y, open, kind) {
      const R = CG.R, c = R && R.chests && R.chests.find(q => q.biome && q.x === x && q.y === y); if (!c || !PAL[c.biome]) return ch0.apply(this, arguments);
      const C = PAL[c.biome], b = c.biome, TAU = Math.PI * 2, box = (bx, by, w, h, col) => { g.fillStyle = col; g.beginPath(); if (g.roundRect) g.roundRect(bx, by, w, h, 3); else g.rect(bx, by, w, h); g.fill(); };
      if (b === 'lave') { g.fillStyle = 'rgba(255,120,30,0.22)'; g.beginPath(); g.ellipse(x, y + 4, 24, 12, 0, 0, TAU); g.fill(); }
      Art.shadow(g, x, y + 8, 16);
      box(x - 14, y - 8, 28, 16, C[0]); g.fillStyle = C[1]; g.fillRect(x - 14, y + 2, 28, 6);
      if (open) { g.fillStyle = C[1]; g.beginPath(); g.moveTo(x - 14, y - 8); g.lineTo(x + 14, y - 8); g.lineTo(x + 12, y - 20); g.lineTo(x - 12, y - 20); g.closePath(); g.fill(); g.fillStyle = b === 'lave' ? '#ffb432' : b === 'glace' ? '#e8fbff' : '#f0c040'; g.beginPath(); g.ellipse(x, y - 8, 10, 3, 0, 0, TAU); g.fill(); }
      else box(x - 15, y - 16, 30, 10, C[2]);
      g.fillStyle = C[3]; g.fillRect(x - 2, y - 9, 4, 6); g.fillRect(x - 15, y - 9, 3, 17); g.fillRect(x + 12, y - 9, 3, 17);
      if (b === 'lave') { g.strokeStyle = '#ffb432'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x - 9, y - 6); g.lineTo(x - 6, y); g.lineTo(x - 9, y + 6); g.moveTo(x + 6, y - 5); g.lineTo(x + 9, y + 1); g.lineTo(x + 5, y + 6); g.stroke(); if (!open) { g.fillStyle = 'rgba(255,200,90,0.9)'; g.fillRect(x - 11, y - 8.6, 22, 1.4); } }
      else if (b === 'glace') { g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(x - 10, y - (open ? 6 : 14), 8, 2); g.fillRect(x + 3, y - 4, 6, 1.6); g.fillStyle = '#e8fbff'; [[-10, 0], [-3, 2], [5, 0], [10, 1]].forEach(q => { g.beginPath(); g.moveTo(x + q[0] - 2, y + 8); g.lineTo(x + q[0] + 2, y + 8); g.lineTo(x + q[0], y + 13 + q[1]); g.closePath(); g.fill(); }); if (!open) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y - 16, 13, 2.6, 0, 0, TAU); g.fill(); } }
      else if (b === 'eau') { g.fillStyle = '#58b05a'; g.beginPath(); g.ellipse(x - 9, y + 5, 5, 2.4, 0.3, 0, TAU); g.ellipse(x + 8, y - (open ? 2 : 13), 5, 2, -0.3, 0, TAU); g.fill(); g.fillStyle = '#f2d8c8'; g.beginPath(); g.arc(x + 7, y + 4, 2.6, Math.PI, TAU); g.fill(); g.fillStyle = 'rgba(200,240,255,0.7)'; g.beginPath(); g.arc(x - 6, y - 2, 1.3, 0, TAU); g.arc(x + 2, y + 5, 1, 0, TAU); g.fill(); }
      else if (b === 'chateau') { g.fillStyle = '#e8e2d2'; g.beginPath(); g.arc(x, y - 1, 4, 0, TAU); g.fill(); g.fillRect(x - 2.4, y + 1.5, 4.8, 3); g.fillStyle = '#1a1420'; g.fillRect(x - 2.4, y - 2, 1.6, 1.8); g.fillRect(x + 0.8, y - 2, 1.6, 1.8); g.fillRect(x - 0.4, y + 2.4, 0.8, 2); }
      else { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.9; g.beginPath(); [[-15, -16, 6, 8], [-15, -6, -2, -16], [15, -16, -4, 8], [15, -4, 2, -16], [-15, 8, 15, -10]].forEach(q => { g.moveTo(x + q[0], y + q[1]); g.lineTo(x + q[2], y + q[3]); }); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(x - 12, y - 14, 5, 3, 0, 0, TAU); g.fill(); }
    }; }
  { const pb = Py.basculer; Py.basculer = function (par) { const entre = par === 'pyramide' && !!Ar.attente, r = pb.apply(this, arguments); const va = par === 'pyramide'; if (entre && mode() === 'chateau') CG.sfx('mauvaisEndroit'); else if (va && Py.dedans()) CG.sfx('entreDonjon'); return r; }; } /* en entrant au château : « wrong place » */
  function sortie(x, y) { CG.R.sortiePy = { x, y, draw(g, o, t) { const a = 0.6 + Math.sin(t * 3) * 0.15; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(o.x, o.y + 4, 24, 7, 0, 0, TAU); g.fill(); [['rgba(120,60,200,' + a + ')', 1], ['rgba(190,130,255,' + a + ')', 0.7], ['rgba(240,225,255,' + a + ')', 0.35]].forEach(c => { g.fillStyle = c[0]; g.beginPath(); g.ellipse(o.x, o.y - 34, 22 * c[1], 40 * c[1], 0, 0, TAU); g.fill(); }); } }; }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const md = mode(); if (!md) return; const S = CG.S, R = CG.R, A = S.arene; if (!R || A.gagne || Mo.pending || !R.grotte) return;
    R.grT = (R.grT || 0) - dt; if (R.grT > 0) return; R.grT = 0.4; const q = R.grotte.reine;
    if (md !== 'nid') { const P = plan(), p = S.player, lv = md === 'lave'; /* le château : il faut tout nettoyer ; le chef s'annonce quand on entre dans sa salle */
      if (P.trone && !R.grotte.vu && q && !q.dead && p.x > (P.salles[P.salles.length - 1].x0 + 1) * T) { R.grotte.vu = true; G.banner(q.nomArene, lv ? 'Il garde la cage, au fond de la caverne.' : md === 'eau' ? 'Une tête énorme se tourne vers toi, au fond du temple.' : md === 'glace' ? 'Il t\'attendait sur son trône de glace.' : 'Il t\'attendait, au bout du tapis rouge.', '#ff9a8a'); CG.sfx('warning'); }
      if (R.enemies.some(e => !e.dead && e.arene && !e.revenu)) { R.grotte.vide = false; return; } if (!R.grotte.vide) { R.grotte.vide = true; R.grT = 1.2; return; }
      if (lv) { if (!R.grotte.dit && !R.grotte.libre) { R.grotte.dit = true; G.banner('Plus un monstre !', 'Brise la cage à coups de bâton, puis ramène l\'apprenti à l\'entrée.', '#ffe9a8'); } return; }
      Ar.gagner(); sortie(p.x, p.y + 6); { const cp = CG.Compteur && CG.Compteur.texte ? CG.Compteur.texte() : ''; G.banner(cp ? '💀 ' + cp + ' !' : 'Victoire !', 'Un passage s\'ouvre à côté de toi (E).', md === 'eau' ? '#bfe6ff' : '#ffe9a8'); } return; }
    if (q && !q.dead && R.enemies.includes(q)) return;
    const x = q ? q.x : S.player.x, y = q ? q.y : S.player.y; R.enemies.forEach(e => { if (e.grotte && !e.dead && e !== q) { e.fear = 6; } }); /* la reine tombée, les autres se sauvent */
    Ar.gagner(); sortie(x, y + 10); if (bois()) G.banner('Le chef de meute est tombé !', 'Les autres loups se sauvent. Un passage s\'ouvre là où il est tombé : prends-le (E) pour ressortir.', '#d8f0c0'); else G.banner('La reine des araignées est tombée !', 'Un passage s\'ouvre là où elle est tombée : prends-le (E) pour ressortir.', '#e0d0ff');
  };
  // ---------- le noir du château : l'ombre se referme autour du chef, et seules les torches percent ----------
  let torches = [], lueur = null, cols = new Map();
  function colonne(g, px, py, gl) { const cg = g.createLinearGradient(px + 9, 0, px + 31, 0); cg.addColorStop(0, gl ? '#8ab4d8' : '#4a4654'); cg.addColorStop(0.45, gl ? '#e0f4ff' : '#6a6674'); cg.addColorStop(1, gl ? '#5a86b0' : '#2a2832');
    g.fillStyle = gl ? '#6a92b8' : '#34313c'; g.fillRect(px + 5, py + 24, 30, 9); g.fillStyle = cg; g.fillRect(px + 9, py - 30, 22, 56); g.fillStyle = gl ? '#f6fbff' : '#56525e'; g.fillRect(px + 5, py - 36, 30, 8); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(px + 5, py - 36, 30, 2); g.strokeStyle = 'rgba(10,8,14,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + 9, py - 8); g.lineTo(px + 31, py - 8); g.moveTo(px + 9, py + 10); g.lineTo(px + 31, py + 10); g.stroke(); }
  // les colonnes sont aussi triées avec les personnages : quelqu'un qui passe derrière est caché par la colonne, au lieu de marcher dessus
  const colSprite = { draw(g, o) { colonne(g, o.px, o.py, o.gl); } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (!mode() || !cols.size) return; let P; try { P = plan(); } catch (e) { return; } if (!P || !P.chateau) return; const gl = !!P.glace;
    cols.forEach((quoi, cle) => { if (quoi !== 'c') return; const x = cle % 1000, y = (cle - x) / 1000, px = x * T, py = y * T; if (CG.onScreen(px + 20, py)) push(py + 30, 21, Object.assign({ x: px + 20, y: py + 30, px, py, gl }, colSprite), null); }); }; }
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); if (mode() !== 'chateau' || !CG.R) return; const p = CG.S.player;
    if (!lueur) { lueur = document.createElement('canvas'); lueur.width = lueur.height = 200; const c = lueur.getContext('2d'), gr = c.createRadialGradient(100, 100, 2, 100, 100, 100); gr.addColorStop(0, 'rgba(255,200,110,0.55)'); gr.addColorStop(0.35, 'rgba(255,150,60,0.22)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = gr; c.fillRect(0, 0, 200, 200); }
    g.save(); const om = g.createRadialGradient(p.x, p.y - 20, 110, p.x, p.y - 20, 470); om.addColorStop(0, 'rgba(2,1,5,0)'); om.addColorStop(1, 'rgba(2,1,5,' + Gn.NOIR + ')'); g.fillStyle = om; g.fillRect(p.x - 1500, p.y - 1100, 3000, 2200);
    g.globalCompositeOperation = 'lighter'; for (const q of torches) { if (!CG.onScreen(q.x, q.y)) continue; const k = 0.82 + Math.sin(t * 9 + q.x * 0.7) * 0.1 + Math.sin(t * 23 + q.y) * 0.05, r = 96 * k; g.globalAlpha = k; g.drawImage(lueur, q.x - r, q.y + 6 - r, r * 2, r * 2); }
    g.restore();
  };
  Gn.essai = function () { const S = CG.S; S.grotteNid = { day: S.day, la: true, fait: false }; return Gn.pos(); };
})(window.CG);
