// Goblin Malin — le bois des loups. En bas à gauche de la carte, près de la cachette, un passage s'ouvre certains jours entre
// les arbres. Derrière : un donjon de forêt (le même plan que la grotte des araignées, voir grottenid.js), des clairières reliées
// par des sentiers, des loups partout, et tout au fond le chef de meute. Le battre nettoie la cachette pour la journée.
// Tout est réglable dans CG.BoisLoups.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Ar = CG.Arene, Gn = CG.GrotteNid, Mo = CG.Mondes, T = CG.TILE, TAU = Math.PI * 2;
  if (!Ar || !Gn || !Mo || !Gn.BOIS) return;
  const Bl = CG.BoisLoups = { CHANCE: 0.3, JOUR: 3, LIEU: 'cache', ID: Gn.BOIS }; /* CHANCE : chaque jour, à partir du jour JOUR, le passage a cette chance d'être là */
  Ar.Q[Bl.ID] = { mondes: [], qui: 'Le bois des loups', lieu: 'Le bois des loups', theme: 'grotte', vagues: true, E: [[], [], []],
    entree: 'Un bois épais, plein de loups. Le chef de meute rôde tout au fond. Dehors, le temps s\'est arrêté.',
    recompense(A) { const S = CG.S, p = S.player, d = S.day, or = 80 + 15 * d + (A.palier || 0) * 40, xp = 40 + 8 * d; if (S.boisLoups) { S.boisLoups.fait = true; S.boisLoups.fuite = true; }
      G.gain('or', or, p.x, p.y - 50); G.addXp(xp); S.morale = Math.min(100, S.morale + 4); let plus = ''; const id = Math.random() < 0.5 ? G.newScroll() : null; if (id) { G.giveScroll(id, p.x, p.y); plus = ' Et un tome de sort, caché dans sa tanière !'; }
      G.banner('Le chef de meute est tombé', 'Le passage se referme entre les arbres. (+' + or + ' 🪙, +' + xp + ' XP, moral +4.)' + plus, '#d8f0c0'); CG.sfx('victory'); } };
  // ---------- où s'ouvre le passage : un coin d'herbe collé à des arbres, tout près de la cachette ----------
  let posC = null, posCle = null;
  Bl.pos = function () {
    const P = W.POI && W.POI[Bl.LIEU]; if (!P) return null; const cle = (CG.S.seed || 0) + ':' + P.x + ':' + P.y; if (posCle === cle && posC && W.walkTile(posC.tx, posC.ty)) return posC;
    const arbre = (x, y) => W.inMap(x, y) && W.tile[W.idx(x, y)] === W.TREE; let best = null, bd = 1e9;
    for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) { const x = P.x + dx, y = P.y + dy; if (!W.inMap(x, y) || !W.walkTile(x, y) || !W.walkTile(x, y + 1)) continue; const n = (arbre(x, y - 1) ? 3 : 0) + (arbre(x - 1, y - 1) ? 1 : 0) + (arbre(x + 1, y - 1) ? 1 : 0); const d = Math.hypot(dx, dy) - n * 1.5 + (Math.hypot(dx, dy) < 2.5 ? 6 : 0); if (d < bd) { bd = d; best = { tx: x, ty: y }; } }
    if (!best) return null; posCle = cle; posC = { tx: best.tx, ty: best.ty, x: best.tx * T + T / 2, y: best.ty * T + 6 }; return posC;
  };
  Bl.ouvert = function () { const S = CG.S; if (!S || Mo.ici() !== 0 || !(W.POI && W.POI[Bl.LIEU])) return false; if (!S.boisLoups || S.boisLoups.day !== S.day) S.boisLoups = { day: S.day, la: S.day >= Bl.JOUR && Math.random() < Bl.CHANCE, fait: false }; return S.boisLoups.la && !S.boisLoups.fait; };
  // ---------- le passage : deux gros troncs penchés l'un vers l'autre, un trou noir entre les deux, un sentier de terre battue ----------
  const passage = { draw(g, o, t) { const x = o.x, y = o.y; t = t || 0;
    const el = (px, py, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill(); };
    el(x, y + 22, 26, 12, 'rgba(122,94,56,0.55)'); el(x + 2, y + 40, 20, 9, 'rgba(122,94,56,0.4)'); el(x - 3, y + 54, 14, 6, 'rgba(122,94,56,0.25)'); // le sentier
    [[-7, 34], [5, 44], [-4, 56]].forEach(q => { el(x + q[0], y + q[1], 2.6, 2, 'rgba(50,36,18,0.45)'); [[-2.6, -3], [0, -4], [2.6, -3]].forEach(d => el(x + q[0] + d[0], y + q[1] + d[1], 1, 1, 'rgba(50,36,18,0.45)')); }); // des traces de pattes
    g.fillStyle = '#06100a'; g.beginPath(); g.moveTo(x - 19, y + 8); g.lineTo(x - 17, y - 26); g.quadraticCurveTo(x, y - 56, x + 17, y - 26); g.lineTo(x + 19, y + 8); g.closePath(); g.fill(); // le noir du sous-bois
    g.fillStyle = 'rgba(60,120,70,' + (0.1 + Math.sin(t * 1.7) * 0.04) + ')'; g.beginPath(); g.ellipse(x, y - 14, 11, 18, 0, 0, TAU); g.fill();
    const tronc = s => { g.fillStyle = s < 0 ? '#5a3d22' : '#4e3520'; g.beginPath(); g.moveTo(x + s * 30, y + 10); g.quadraticCurveTo(x + s * 26, y - 26, x + s * 7, y - 58); g.lineTo(x + s * 1, y - 52); g.quadraticCurveTo(x + s * 16, y - 26, x + s * 17, y + 10); g.closePath(); g.fill();
      g.fillStyle = s < 0 ? '#74502c' : '#644424'; g.beginPath(); g.moveTo(x + s * 28, y + 8); g.quadraticCurveTo(x + s * 25, y - 22, x + s * 9, y - 50); g.lineTo(x + s * 7, y - 48); g.quadraticCurveTo(x + s * 22, y - 22, x + s * 24, y + 8); g.closePath(); g.fill(); el(x + s * 24, y + 10, 9, 4, s < 0 ? '#5a3d22' : '#4e3520'); };
    tronc(-1); tronc(1);
    [[-20, -58, 20, '#1f5a2a'], [18, -60, 21, '#1a4f25'], [0, -70, 22, '#236632'], [-34, -42, 15, '#184822'], [34, -44, 15, '#17431f'], [-8, -80, 13, '#2c7a3a'], [12, -78, 12, '#27703a']].forEach(q => el(x + q[0], y + q[1], q[2], q[2] * 0.86, q[3])); // le feuillage, par-dessus
    el(x - 8, y - 78, 8, 4, 'rgba(160,220,140,0.2)'); el(x - 22, y - 62, 9, 4, 'rgba(160,220,140,0.15)');
    g.strokeStyle = '#2c6a30'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); [[-12, -38, -10, -24], [-5, -46, -6, -30], [9, -42, 8, -27], [14, -34, 13, -22]].forEach(q => { g.moveTo(x + q[0], y + q[1]); g.lineTo(x + q[2], y + q[3]); }); g.stroke(); // des lianes qui pendent
    for (let i = 0; i < 2; i++) { const b = 0.5 + Math.sin(t * 1.1 + i * 2.4) * 0.5; if (b < 0.3) continue; g.fillStyle = 'rgba(255,214,90,' + b * 0.95 + ')'; const ex = x - 7 + i * 9, ey = y - 12 - i * 9; g.beginPath(); g.ellipse(ex, ey, 1.5, 1.1, 0, 0, TAU); g.ellipse(ex + 4.4, ey, 1.5, 1.1, 0, 0, TAU); g.fill(); } /* des yeux jaunes, au fond */
  } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (!Bl.ouvert()) return; const q = Bl.pos(); if (q && CG.onScreen(q.x, q.y)) push(q.y - 2, 21, Object.assign({ x: q.x, y: q.y }, passage), null); }; }
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R; if (!R || R.ko > 0 || R.cine || R.build || !Bl.ouvert()) return it; const q = Bl.pos(), p = CG.S.player; if (!q) return it;
    if (Math.hypot(p.x - q.x, p.y - (q.y + 16)) < 50 && (!it || it.type !== 'visitor')) return { type: 'boisLoups', obj: { x: q.x, y: q.y - 30 }, label: 'Entrer dans le bois des loups' }; return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'boisLoups') return in0.apply(this, arguments);
    if (CG.R.enemies.some(e => !e.dead && e.target === CG.S.player && Math.hypot(e.x - CG.S.player.x, e.y - CG.S.player.y) < 240)) { CG.sfx('no'); return UI.toast('Pas avec des bêtes sur le dos !'); } Ar.partir(Bl.ID); };
  // ---------- le chef de meute est tombé : les loups de la cachette se sauvent, et le lieu est nettoyé pour la journée ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !S.boisLoups || !S.boisLoups.fuite || Mo.ici() !== 0) return; S.boisLoups.fuite = false;
    for (const e of R.enemies) if (e.site === Bl.LIEU && !e.dead) { e.dead = true; G.puff(e.x, e.y - 12, '#d8d0c0', 8, 70, 3); }
  };
  // la mini-carte et la grande carte : rien de plus (pas d'annonce). On tombe dessus en explorant.
  Bl.forcer = () => { const S = CG.S; S.boisLoups = { day: S.day, la: true, fait: false }; }; // pour les essais
})(window.CG);
