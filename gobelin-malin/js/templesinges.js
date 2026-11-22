// Goblin Malin — le temple des singes. Dans la jungle, en bas à gauche de la carte, une vieille pyramide à étages sort
// certains jours d'entre les arbres. Sa porte mène à un donjon : des salles de pierre dorée couvertes de mousse et de signes
// gravés, pleines de singes, et tout au fond le roi des singes sur son trône.
// (Sous le capot : le même donjon que le vieux château de grottenid.js, repeint.) Tout est réglable dans CG.TempleSinges.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, Ar = CG.Arene, Gn = CG.GrotteNid, Mo = CG.Mondes, Si = CG.Singes, T = CG.TILE, MW = CG.MW, MH = CG.MH, TAU = Math.PI * 2;
  if (!Ar || !Gn || !Mo || !Si) return;
  const Ts = CG.TempleSinges = { ID: 'templeSinges', CHANCE: 0.35, JOUR: 3, BANANES: 30, TAILLE: 1.7 }; /* CHANCE : chaque jour, à partir du jour JOUR, la pyramide a cette chance d'être là */
  const dedans = () => Ar.dans() && CG.S.arene.id === Ts.ID; Ts.dedans = dedans;
  Ar.Q[Ts.ID] = { mondes: [], qui: 'Le temple des singes', lieu: 'Le temple des singes', titre: 'Le temple des singes', theme: 'temple', donjon: true, roi: true, chef: ['gorille3', 'Le roi des singes'],
    entree: 'Une vieille pyramide pleine de singes. Avance de salle en salle : leur roi attend tout au fond. Dehors, le temps s\'est arrêté.',
    E: [['chimpanze1', 'macaque1', 'gibbon1', 'babouin1'], ['chimpanze1', 'bonobo1', 'babouin2', 'orangOutan1', 'macaque2'], ['gorille1', 'orangOutan2', 'siamang2', 'babouin2', 'chimpanze2', 'gibbon2']],
    recompense(A) { const S = CG.S, p = S.player, d = S.day, or = 100 + 16 * d + (A.palier || 0) * 45, xp = 45 + 8 * d, miam = Ts.BANANES + 3 * d; if (S.templeSinges) S.templeSinges.fait = true;
      G.gain('or', or, p.x - 16, p.y - 50); G.gain('food', miam, p.x + 16, p.y - 62); G.addXp(xp); S.morale = Math.min(100, S.morale + 4); let plus = ''; const id = Math.random() < 0.55 ? G.newScroll() : null; if (id) { G.giveScroll(id, p.x, p.y); plus = ' Et un parchemin, caché sous le trône !'; }
      G.banner('Le roi des singes est tombé', 'La porte de la pyramide se referme. (+' + or + ' 🪙, +' + miam + ' 🍖 de bananes, +' + xp + ' XP, moral +4.)' + plus, '#ffe9a8'); CG.sfx('victory'); } };
  // ---------- où se dresse la pyramide : dans la jungle, adossée aux arbres, pas collée au passage du bois des loups ----------
  let posC = null, posCle = null;
  Ts.pos = function () {
    const J = Si.lieu(); if (!J) return null; const cle = (CG.S.seed || 0) + ':' + J.x + ':' + J.y; if (posCle === cle && posC && W.walkTile(posC.tx, posC.ty)) return posC;
    const arbre = (x, y) => W.inMap(x, y) && W.tile[W.idx(x, y)] === W.TREE, bl = CG.BoisLoups && CG.BoisLoups.pos ? CG.BoisLoups.pos() : null; let best = null, bd = 1e9;
    for (let dy = -J.r; dy <= J.r; dy++) for (let dx = -J.r; dx <= J.r; dx++) { const x = J.x + dx, y = J.y + dy; if (x < 3 || y < 4 || !W.inMap(x, y) || !W.walkTile(x, y) || !W.walkTile(x, y + 1) || !W.walkTile(x - 1, y + 1) || !W.walkTile(x + 1, y + 1)) continue; if (bl && Math.hypot(x - bl.tx, y - bl.ty) < 5) continue;
      const n = (arbre(x, y - 1) ? 2 : 0) + (arbre(x - 1, y - 1) ? 1 : 0) + (arbre(x + 1, y - 1) ? 1 : 0) + (arbre(x - 1, y) ? 1 : 0) + (arbre(x + 1, y) ? 1 : 0), d = Math.hypot(dx, dy) * 0.6 - n * 1.6 + W.hash(x, y); if (d < bd) { bd = d; best = { tx: x, ty: y }; } }
    if (!best) return null; posCle = cle; posC = { tx: best.tx, ty: best.ty, x: best.tx * T + T / 2, y: best.ty * T + 10 }; return posC;
  };
  Ts.ouvert = function () { const S = CG.S; if (!S || Mo.ici() !== 0) return false; if (!S.templeSinges || S.templeSinges.day !== S.day) S.templeSinges = { day: S.day, la: S.day >= Ts.JOUR && Math.random() < Ts.CHANCE, fait: false }; return S.templeSinges.la && !S.templeSinges.fait; };
  Ts.forcer = () => { const S = CG.S; S.templeSinges = { day: S.day, la: true, fait: false }; }; // pour les essais
  // ---------- la pyramide : quatre étages de pierre dorée, un escalier au milieu, une porte noire en bas, de la mousse ----------
  const el = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  function tete(g, x, y, s, c1, c2) { // une tête de singe gravée
    el(g, x - 5.2 * s, y, 2.2 * s, 2.6 * s, c1); el(g, x + 5.2 * s, y, 2.2 * s, 2.6 * s, c1); el(g, x, y, 5 * s, 5 * s, c1); el(g, x, y + 1.6 * s, 3.4 * s, 2.8 * s, c2);
    g.fillStyle = c2; g.fillRect(x - 2.6 * s, y - 2 * s, 1.6 * s, 1.5 * s); g.fillRect(x + 1 * s, y - 2 * s, 1.6 * s, 1.5 * s); g.fillStyle = c1; g.fillRect(x - 1.8 * s, y + 2 * s, 3.6 * s, 0.9 * s); }
  const pyramide = { draw(g, o, t) { g.save(); g.translate(o.x, o.y); g.scale(Ts.TAILLE, Ts.TAILLE); g.translate(-o.x, -o.y); try { dessin(g, o, t); } finally { g.restore(); } } };
  function dessin(g, o, t) { const x = o.x, y = o.y; t = t || 0;
    el(g, x, y + 6, 66, 13, 'rgba(0,0,0,0.3)');
    const E = [[58, 20], [45, 18], [33, 17], [22, 16]]; let top = y + 6;
    E.forEach((q, i) => { const w = q[0], h = q[1], y1 = top, y0 = top - h; top = y0;
      g.fillStyle = ['#b89858', '#c2a260', '#ccac68', '#d4b470'][i]; g.fillRect(x - w, y0, w * 2, h); g.fillStyle = 'rgba(255,240,190,0.35)'; g.fillRect(x - w, y0, w * 2, 2.5); g.fillStyle = 'rgba(60,40,10,0.28)'; g.fillRect(x - w, y1 - 4, w * 2, 4); g.fillStyle = 'rgba(60,40,10,0.18)'; g.fillRect(x + w * 0.45, y0, w * 0.55, h);
      g.strokeStyle = 'rgba(70,50,20,0.35)'; g.lineWidth = 1; g.beginPath(); for (let bx = -w + 10 + (i % 2) * 5; bx < w; bx += 12) { g.moveTo(x + bx, y0 + 3); g.lineTo(x + bx, y1 - 4); } g.stroke();
      if (i < 3) { g.strokeStyle = '#7a5a1e'; g.lineWidth = 1.3; g.beginPath(); [-1, 1].forEach(s => { for (let k = 0; k < 2; k++) { const gx = x + s * (w - 9 - k * 11), gy = y0 + h / 2; g.moveTo(gx - 3, gy - 3); g.lineTo(gx + 3, gy - 3); g.lineTo(gx + 3, gy + 3); g.lineTo(gx - 3, gy + 3); g.lineTo(gx - 3, gy); g.lineTo(gx, gy); } }); g.stroke(); } /* des signes gravés */
    });
    g.fillStyle = '#e0c480'; g.fillRect(x - 14, top - 14, 28, 14); g.fillStyle = 'rgba(255,240,190,0.4)'; g.fillRect(x - 14, top - 14, 28, 2.5); g.fillStyle = '#1a1208'; g.fillRect(x - 5, top - 10, 10, 10); /* le petit temple, tout en haut */
    tete(g, x, top - 21, 1.15, '#d4a83a', '#6a4a12'); /* une tête de singe dorée au sommet */
    g.fillStyle = '#a88848'; g.beginPath(); g.moveTo(x - 9, top); g.lineTo(x + 9, top); g.lineTo(x + 15, y - 26); g.lineTo(x - 15, y - 26); g.closePath(); g.fill(); g.strokeStyle = 'rgba(60,40,10,0.45)'; g.lineWidth = 1; g.beginPath(); for (let yy = top + 5; yy < y - 26; yy += 5) { const k = (yy - top) / (y - 26 - top), w = 9 + k * 6; g.moveTo(x - w, yy); g.lineTo(x + w, yy); } g.stroke(); /* l'escalier */
    g.fillStyle = '#8a6c34'; g.fillRect(x - 19, y - 30, 38, 36); g.fillStyle = '#c8a860'; g.fillRect(x - 19, y - 32, 38, 5); g.fillStyle = '#0a0806'; g.beginPath(); g.moveTo(x - 12, y + 6); g.lineTo(x - 12, y - 18); g.lineTo(x - 7, y - 24); g.lineTo(x + 7, y - 24); g.lineTo(x + 12, y - 18); g.lineTo(x + 12, y + 6); g.closePath(); g.fill(); /* la porte */
    g.fillStyle = 'rgba(255,170,60,' + (0.14 + Math.sin(t * 2.1) * 0.05) + ')'; g.beginPath(); g.ellipse(x, y - 6, 8, 12, 0, 0, TAU); g.fill();
    [[-50, -8, 9], [-38, -24, 7], [41, -12, 8], [28, -44, 6], [-24, -42, 6], [52, 0, 7], [-10, -58, 5]].forEach(q => { el(g, x + q[0], y + q[1], q[2], q[2] * 0.55, '#3f7a34'); el(g, x + q[0] - 1.5, y + q[1] - 1, q[2] * 0.5, q[2] * 0.28, 'rgba(170,220,120,0.5)'); }); /* la mousse */
    g.strokeStyle = '#2c6a30'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); [[-46, -14, -47, 2], [-36, -32, -35, -20], [44, -18, 45, -4], [30, -50, 31, -38]].forEach(q => { g.moveTo(x + q[0], y + q[1]); g.lineTo(x + q[2], y + q[3]); }); g.stroke(); /* des lianes */
  }
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (!Ts.ouvert()) return; const q = Ts.pos(); if (q && CG.onScreen(q.x, q.y)) push(q.y - 2, 21, Object.assign({ x: q.x, y: q.y }, pyramide), null); }; }
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R; if (!R || R.ko > 0 || R.cine || R.build || !Ts.ouvert()) return it; const q = Ts.pos(), p = CG.S.player; if (!q) return it;
    if (Math.hypot(p.x - q.x, p.y - (q.y + 22)) < 56 && (!it || it.type !== 'visitor')) return { type: 'templeSinges', obj: { x: q.x, y: q.y - 30 }, label: 'Entrer dans le temple des singes' }; return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'templeSinges') return in0.apply(this, arguments);
    if (CG.R.enemies.some(e => !e.dead && e.target === CG.S.player && Math.hypot(e.x - CG.S.player.x, e.y - CG.S.player.y) < 200)) { CG.sfx('no'); return UI.toast('Pas avec des singes sur le dos !'); } Ar.partir(Ts.ID); };
  // ---------- dedans : le vieux château, repeint en pierre dorée, avec de la mousse, des lianes et des signes gravés ----------
  const pa0 = W.paint; W.paint = function () {
    const r = pa0.apply(this, arguments); if (!dedans() || !W.terrain) return r;
    const c = W.terrain, g = c.getContext('2d'), I = W.idx, tile = W.tile, sol = (x, y) => W.inMap(x, y) && tile[I(x, y)] === W.FLOOR;
    g.save(); g.globalCompositeOperation = 'color-dodge'; g.fillStyle = '#7c7c7c'; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'color'; g.fillStyle = 'hsl(41,46%,50%)'; g.fillRect(0, 0, c.width, c.height); g.restore();
    for (let y = 2; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) { const px = x * T, py = y * T, k = W.hash(x * 7 + 1, y * 3 + 2), k2 = W.hash(y * 5 + 3, x * 11);
      if (sol(x, y)) { // le sol : de la mousse entre les dalles, parfois une dalle gravée, quelques feuilles
        if (k < 0.3) { el(g, px + 6 + k2 * 28, py + 8 + k * 60, 9 + k2 * 7, 4 + k2 * 3, 'rgba(70,130,50,0.5)'); el(g, px + 4 + k2 * 28, py + 7 + k * 60, 4, 2, 'rgba(150,210,110,0.4)'); }
        else if (k > 0.93) { g.strokeStyle = 'rgba(70,45,10,0.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(px + 10, py + 10); g.lineTo(px + 30, py + 10); g.lineTo(px + 30, py + 30); g.lineTo(px + 10, py + 30); g.lineTo(px + 10, py + 17); g.lineTo(px + 23, py + 17); g.lineTo(px + 23, py + 24); g.lineTo(px + 16, py + 24); g.stroke(); }
        else if (k > 0.86) { g.save(); g.translate(px + 20, py + 20); g.rotate(k2 * 6); g.fillStyle = 'rgba(60,120,50,0.75)'; g.beginPath(); g.ellipse(0, 0, 6, 2.4, 0, 0, TAU); g.fill(); g.restore(); }
        continue; }
      if (!sol(x, y + 1) || sol(x, y - 1)) continue; // la face d'un mur, au-dessus d'une salle
      el(g, px + 8 + k * 24, py - 2, 10 + k2 * 6, 3.4, 'rgba(60,125,50,0.85)'); el(g, px + 6 + k * 24, py - 3, 5, 1.6, 'rgba(160,215,115,0.5)'); /* la mousse sur la corniche */
      if (k2 > 0.5) { g.strokeStyle = 'rgba(44,106,48,0.9)'; g.lineWidth = 1.7; g.lineCap = 'round'; const lx = px + 5 + k * 30, ll = 12 + k2 * 20; g.beginPath(); g.moveTo(lx, py - 1); g.quadraticCurveTo(lx + 3, py + ll * 0.5, lx - 1, py + ll); g.stroke(); el(g, lx - 1, py + ll, 2.6, 1.6, 'rgba(70,140,60,0.9)'); el(g, lx + 2, py + ll * 0.5, 2.4, 1.4, 'rgba(70,140,60,0.9)'); } /* une liane */
      if (x % 3 === 1 && k > 0.35) tete(g, px + 20, py + 19, 1.5, 'rgba(60,38,8,0.6)', 'rgba(255,225,150,0.5)'); /* une tête de singe gravée, entre deux torches */
      else if (x % 3 === 2) { g.strokeStyle = 'rgba(255,215,110,0.5)'; g.lineWidth = 1.5; g.beginPath(); for (let j = 0; j < 3; j++) { const gx = px + 4 + j * 12; g.moveTo(gx, py + 34); g.lineTo(gx, py + 28); g.lineTo(gx + 6, py + 28); g.lineTo(gx + 6, py + 31); g.lineTo(gx + 3, py + 31); } g.stroke(); } /* une frise à la grecque, en bas du mur */
    }
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0); return r;
  };
  // ---------- le roi des singes : un énorme gorille, une couronne d'or et de plumes ----------
  const ae = Art.enemy; Art.enemy = function (g, e, t) {
    if (!e.grosArene || !Si.info(e.type)) return ae.apply(this, arguments);
    const I = Si.info(e.type), k = 1.45; g.save(); g.translate(e.x, e.y); g.scale(k, k); g.translate(-e.x, -e.y);
    try { ae.apply(this, arguments); } finally { g.restore(); }
    const s = I.taille * k, x = e.x, y = e.y - 38 * s - (e.sg && e.sg.ph === 'vol' ? e.sg.h * k : 0);
    [[-9, '#d8264a'], [-4.5, '#2f9a5a'], [0, '#ffd83a'], [4.5, '#2f9a5a'], [9, '#d8264a']].forEach((q, i) => { g.fillStyle = q[1]; g.beginPath(); g.ellipse(x + q[0] * s * 0.55, y - (7 + (2 - Math.abs(i - 2)) * 3) * s * 0.5, 2 * s * 0.5, 7 * s * 0.5, q[0] * 0.035, 0, TAU); g.fill(); });
    g.fillStyle = '#e8b830'; g.fillRect(x - 8 * s * 0.6, y - 2.4 * s * 0.6, 16 * s * 0.6, 5 * s * 0.6); g.fillStyle = '#fff0a0'; g.fillRect(x - 8 * s * 0.6, y - 2.4 * s * 0.6, 16 * s * 0.6, 1.4); el(g, x, y, 1.8 * s * 0.6, 1.8 * s * 0.6, '#d8264a');
  };
})(window.CG);
