// Goblin Malin — ce qu'on trouve sous les Sables sans fin (sables.js) :
//   le repaire des voleurs du désert : une salle ronde pleine de butin, où mène la trappe qu'on trouve la nuit ;
//   les petits temples : un mini-donjon de quelques salles, avec des vases à casser ;
//   le grand temple, en haut de son immense escalier : un vrai donjon de six salles, des vases, des dalles piégées
//     (jets de flammes, blocs qui tombent du plafond, nuée de scarabées), et tout au fond un des quatre grands gardiens, au hasard.
// (Sous le capot : la salle ronde d'arene.js et le donjon à salles de grottenid.js, repeints en grès.) Tout se règle dans CG.SablesTemples.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Ar = CG.Arene, Gn = CG.GrotteNid, Sb = CG.SablesBetes, T = CG.TILE, MW = CG.MW, MH = CG.MH, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  if (!Ar || !Gn || !Sb) return;
  const St = CG.SablesTemples = { REPAIRE: 'repaireVoleurs', PETIT: 'templeSable', GRAND: 'grandTemple',
    DALLES: { PAR_SALLE: 2, PRES: 17, REPOS: 7, DMG: [14, 1.2] /* 14 + 1,2 par niveau du chef */ },
    OR: { repaireVoleurs: [420, 30], templeSable: [180, 16], grandTemple: [700, 40] }, XP: { repaireVoleurs: [160, 10], templeSable: [90, 8], grandTemple: [400, 20] } };
  const id = () => (Ar.dans() ? CG.S.arene.id : null), temple = () => id() === St.PETIT || id() === St.GRAND;
  St.dedans = () => temple() || id() === St.REPAIRE;
  if (Ar.TH) { Ar.TH.repaire = { fond: '#0c0906', h: 30, s: 30, l: 30, bord: 'roche' }; Ar.TH.temple = Ar.TH.temple || { fond: '#120c06', h: 40, s: 44, l: 44, bord: 'roche' }; }
  // ce qu'on gagne en ressortant : de l'or, de l'expérience, et parfois un objet (le même tirage que la crypte)
  function butin(A, titre, texte, objet, parchemin) {
    const S = CG.S, p = S.player, d = S.day, O = St.OR[A.id], X = St.XP[A.id], or = O[0] + O[1] * d, xp = X[0] + X[1] * d; G.gain('or', or, p.x, p.y - 50); G.addXp(xp); S.morale = Math.min(100, S.morale + 4); let plus = '';
    if (Math.random() < parchemin) { const s = G.newScroll(); if (s) { G.giveScroll(s, p.x, p.y); plus += ' Et un tome de sort !'; } }
    if (Math.random() < objet && CG.Crypte && CG.Crypte.tirerLot) { const L = CG.Crypte.tirerLot();
      if (L.k === 'sort') G.giveScroll(L.id, p.x, p.y); else if (L.k === 'objet') { if (CG.Inventaire) CG.Inventaire.ajouter(L.o, L.n, 'sac'); } else if (L.k === 'vie') { p.maxhp += CG.Crypte.VIE; p.hp += CG.Crypte.VIE; } else { p.maxmp += CG.Crypte.MANA; p.mp += CG.Crypte.MANA; }
      plus += ' Dans le butin : ' + L.ic + ' ' + L.nom + '.'; }
    (S.sablesFait = S.sablesFait || {})[A.cle || A.id] = S.day; G.banner(titre, texte + ' (+' + or + ' 🪙, +' + xp + ' XP, moral +4.)' + plus, '#ffe9a8'); CG.sfx('victory');
  }
  const V = 'voleurSable';
  Ar.Q[St.REPAIRE] = { mondes: [], qui: 'Le repaire des voleurs', lieu: 'Le repaire des voleurs du désert', titre: 'Le repaire des voleurs du désert', theme: 'repaire', chef: ['roiVoleurs', 'Le roi des voleurs'], chefSur: true,
    entree: 'Sous la trappe : des tapis, des coffres, des sacs d\'or... et ceux qui les ont volés. Ils disparaissent dans la fumée et frappent dans le dos. Dehors, le temps s\'est arrêté.',
    E: [[V, V, V], [V, V, V, V], [V, V, V, V, 'derviche']],
    recompense(A) { butin(A, 'Le roi des voleurs est tombé', 'Tu remontes par la trappe, les poches pleines.', 0.6, 0.3); } };
  Ar.Q[St.PETIT] = { mondes: [], qui: 'Un temple des sables', lieu: 'Le temple des sables', titre: 'Le temple des sables', theme: 'temple', donjon: true, vases: true, nbSalles: 4,
    entree: 'Un vieux temple à moitié enseveli. Quelques salles, des vases, et ce qui garde les morts. Dehors, le temps s\'est arrêté.',
    E: [['scarabeeVolant', 'momie', 'scarabeeVolant'], ['scarabeeVolant', 'momie', 'frelonAmbre', 'scarabeeVolant'], ['scarabeeVolant', 'momie', 'frelonAmbre', 'derviche', 'scarabeeVolant']],
    recompense(A) { butin(A, 'Le temple est vide', 'Plus rien ne bouge entre ses murs.', 0.25, 0.4); } };
  Ar.Q[St.GRAND] = { mondes: [], qui: 'Le grand temple', lieu: 'Le grand temple du soleil', titre: 'Le grand temple du soleil', theme: 'temple', donjon: true, vases: true, roi: true, nbSalles: 6, pieges: true,
    entree: 'Tout en haut des marches : six salles de grès, des vases, des dalles piégées, des bêtes qui volent. Et au fond, un gardien que personne n\'a jamais vaincu. Dehors, le temps s\'est arrêté.',
    E: [['scarabeeVolant', 'momie', 'frelonAmbre', 'derviche'], ['derviche', 'momie', 'scarabeeVolant', 'frelonAmbre', 'mageSoleil', 'scarabeeVolant'], ['derviche', 'momie', 'djinn', 'frelonAmbre', 'mageSoleil', 'scarabeeVolant', 'frelonAmbre']], /* le premier de la liste garde aussi les recoins et le trône */
    recompense(A) { butin(A, (Sb.NOMS[A.gardien] || 'Le gardien') + ' est tombé', 'Le grand temple se tait. Tu redescends les marches avec son trésor.', 1, 0.7); } };
  // le gardien du grand temple : tiré au hasard à l'entrée, et retenu (S.arene.gardien)
  Object.defineProperty(Ar.Q[St.GRAND], 'chef', { enumerable: true, get() { const A = CG.S && CG.S.arene, k = (A && A.id === St.GRAND && Sb.GARDIENS.includes(A.gardien) && A.gardien) || Sb.GARDIENS[0]; return [k, Sb.NOMS[k]]; } });
  { const pa0 = Ar.partir; Ar.partir = function (q, cle) { const r = pa0.apply(this, arguments); if (r && Ar.attente && St.OR[q]) { Ar.attente.cle = cle || q; if (q === St.GRAND) Ar.attente.gardien = pick(Sb.GARDIENS); } return r; }; }
  // le roi des voleurs ferme toujours la marche
  { const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments); if (!Ar.dans()) return r; const A = CG.S.arene, Q = Ar.Q[A.id]; if (Q && Q.chefSur && A.nv !== undefined) A.boss = true; if (temple()) dalles(); return r; }; }

  // ---------- les dalles piégées ----------
  function dalles() {
    const R = CG.R, A = CG.S.arene, Q = Ar.Q[A.id]; R.dalles = []; if (!Q.pieges || A.gagne || !Gn.plan) return; const P = Gn.plan(), rng = CG.makeRng(A.seed + 517);
    P.salles.forEach((s, i) => { if (!i) return; for (let n = 0, k = 0; n < St.DALLES.PAR_SALLE && k < 30; k++) { const x = (s.x0 + 1.5 + rng() * (s.w - 3)) * T, y = (s.y0 + 1.5 + rng() * (s.h - 3)) * T; if (!W.walkPx(x, y) || R.dalles.some(d => Math.hypot(d.x - x, d.y - y) < 90)) continue; R.dalles.push({ x, y, s, t: 0, sorte: Math.floor(rng() * 3) }); n++; } });
  }
  function declencher(d) {
    const R = CG.R, S = CG.S, Z = R.zones || (R.zones = []), dmg = St.DALLES.DMG[0] + St.DALLES.DMG[1] * S.player.lvl, s = d.s, x0 = s.x0 * T, x1 = (s.x0 + s.w) * T, y0 = s.y0 * T, y1 = (s.y0 + s.h) * T; d.t = St.DALLES.REPOS; CG.sfx('warning');
    if (d.sorte === 0) { G.text(d.x, d.y - 50, '⚠ Clic ! Des flammes !', '#ffb080', true); Z.push({ k: 'ligne', feu: true, col: '#ff8a1e', x: x0, y: d.y, x2: x1, y2: d.y, w: 52, t: 0.85, max: 0.85, dmg }); Z.push({ k: 'ligne', feu: true, mute: true, col: '#ff8a1e', x: d.x, y: y0, x2: d.x, y2: y1, w: 52, t: 0.85, max: 0.85, dmg }); }
    else if (d.sorte === 1) { G.text(d.x, d.y - 50, '⚠ Clic ! Le plafond !', '#ffd0a0', true); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.random(), r = i ? rand(50, 110) : 0, t = 0.9 + i * 0.25; Z.push({ k: 'cercle', col: '#d8b070', x: d.x + Math.cos(a) * r, y: d.y + Math.sin(a) * r * 0.8, r: 56, t, max: t, dmg: dmg * 1.2, roc: true }); } }
    else { G.text(d.x, d.y - 50, '⚠ Clic ! Ça grouille dans les murs !', '#b8ffb0', true); for (let i = 0; i < 2; i++) { const x = i ? x1 - 30 : x0 + 30, e = Sb.petit('scarabeeVolant', x, d.y, null); if (e) { e.arene = true; e.etage = 99; e.target = S.player; } } }
  }
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S || !R.dalles || !R.dalles.length || !temple()) return r; const p = S.player;
    for (const d of R.dalles) { if (d.t > 0) { d.t -= dt; continue; } if (!(R.ko > 0) && !(R.passe > 0) && Math.hypot(p.x - d.x, p.y - d.y) < St.DALLES.PRES) declencher(d); }
    return r;
  };
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R || !R.dalles || !R.dalles.length || !temple()) return;
    for (const d of R.dalles) { if (!CG.onScreen(d.x, d.y)) continue; const b = d.t > 0, y = d.y + (b ? 2 : 0);
      g.fillStyle = 'rgba(60,40,10,0.45)'; g.fillRect(d.x - 15, d.y - 11, 30, 24); g.fillStyle = b ? '#a88848' : '#d8b468'; g.fillRect(d.x - 14, y - 12, 28, 22); g.fillStyle = b ? 'rgba(255,240,190,0.12)' : 'rgba(255,240,190,0.4)'; g.fillRect(d.x - 14, y - 12, 28, 2.5);
      g.strokeStyle = b ? 'rgba(90,60,20,0.5)' : 'rgba(200,60,40,' + (0.55 + Math.sin(t * 3) * 0.2) + ')'; g.lineWidth = 1.6; g.beginPath(); g.arc(d.x, y - 1, 5, 0, TAU); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.moveTo(d.x + Math.cos(a) * 7, y - 1 + Math.sin(a) * 7); g.lineTo(d.x + Math.cos(a) * 9.5, y - 1 + Math.sin(a) * 9.5); } g.stroke(); } }; } /* une dalle un peu plus claire, gravée d'un soleil rouge : qui regarde où il marche la voit */

  // ---------- les décors ----------
  const el = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  function glyphe(g, x, y, k) { g.strokeStyle = 'rgba(70,45,10,0.55)'; g.lineWidth = 1.5; g.beginPath();
    if (k < 0.25) { g.arc(x, y, 4, 0, TAU); g.moveTo(x - 7, y + 7); g.lineTo(x + 7, y + 7); } /* le soleil */
    else if (k < 0.5) { g.moveTo(x - 6, y); g.quadraticCurveTo(x, y - 6, x + 6, y); g.quadraticCurveTo(x, y + 6, x - 6, y); g.moveTo(x + 1.5, y); g.arc(x, y, 1.5, 0, TAU); } /* l'œil */
    else if (k < 0.75) { g.moveTo(x - 6, y + 6); g.lineTo(x, y - 6); g.lineTo(x + 6, y + 6); g.closePath(); } /* la pyramide */
    else { g.moveTo(x - 6, y - 3); g.lineTo(x - 2, y + 3); g.lineTo(x + 2, y - 3); g.lineTo(x + 6, y + 3); g.moveTo(x - 6, y + 6); g.lineTo(x + 6, y + 6); } /* l'eau */
    g.stroke(); }
  const pa0 = W.paint; W.paint = function () {
    const r = pa0.apply(this, arguments); if (!St.dedans() || !W.terrain) return r;
    const c = W.terrain, g = c.getContext('2d'), I = W.idx, tile = W.tile, sol = (x, y) => W.inMap(x, y) && tile[I(x, y)] === W.FLOOR, A = CG.S.arene, rng = CG.makeRng(A.seed + 29);
    if (temple()) { // le vieux château, repeint en grès doré : du sable dans les coins, des signes gravés sur les murs
      g.save(); g.globalCompositeOperation = 'color-dodge'; g.fillStyle = '#868686'; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'color'; g.fillStyle = 'hsl(36,52%,52%)'; g.fillRect(0, 0, c.width, c.height); g.restore();
      for (let y = 2; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) { const px = x * T, py = y * T, k = W.hash(x * 5 + 2, y * 7 + 1), k2 = W.hash(y * 3 + 5, x * 13);
        if (sol(x, y)) { if (k < 0.22) { el(g, px + 6 + k2 * 28, py + 10 + k * 70, 11 + k2 * 8, 4.5 + k2 * 3, 'rgba(236,208,150,0.55)'); el(g, px + 4 + k2 * 28, py + 9 + k * 70, 5, 2, 'rgba(255,240,200,0.4)'); } else if (k > 0.94) glyphe(g, px + 20, py + 20, k2); continue; }
        if (!sol(x, y + 1) || sol(x, y - 1)) continue; // la face d'un mur, au-dessus d'une salle
        g.fillStyle = 'rgba(47,106,192,0.5)'; g.fillRect(px, py + 3, T, 3); g.fillStyle = 'rgba(232,200,74,0.6)'; g.fillRect(px, py + 7, T, 1.6); /* une frise bleue et or */
        if (x % 2) glyphe(g, px + 20, py + 22, k); }
    } else { // le repaire : des tapis, des tas d'or, des caisses, des lanternes
      const cx = (Ar.CX + 0.5) * T, cy = (Ar.CY + 0.5) * T;
      [[0, -30, 150, 70, '#8a2a3a', '#e8c84a'], [-190, 40, 90, 46, '#2f5a8a', '#e8e0c8'], [200, 20, 96, 48, '#3a6a4a', '#e8c84a']].forEach(q => { const x = cx + q[0], y = cy + q[1]; g.fillStyle = q[4]; g.fillRect(x - q[2] / 2, y - q[3] / 2, q[2], q[3]); g.strokeStyle = q[5]; g.lineWidth = 2.5; g.strokeRect(x - q[2] / 2 + 6, y - q[3] / 2 + 6, q[2] - 12, q[3] - 12); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - q[2] / 2 + 14, y); g.lineTo(x, y - q[3] / 2 + 14); g.lineTo(x + q[2] / 2 - 14, y); g.lineTo(x, y + q[3] / 2 - 14); g.closePath(); g.stroke(); });
      for (let i = 0; i < 16; i++) { const a = rng() * TAU, d = 0.72 + rng() * 0.2, x = cx + Math.cos(a) * Ar.RX * T * d, y = cy + Math.sin(a) * Ar.RY * T * d; if (!W.walkPx(x, y) || y > cy + (Ar.RY - 3) * T) continue; const q = rng();
        if (q < 0.5) { el(g, x, y, 17, 8, '#c89a20'); el(g, x - 2, y - 4, 12, 6, '#e8c040'); el(g, x - 1, y - 8, 7, 4, '#ffe36b'); for (let k = 0; k < 4; k++) el(g, x - 14 + rng() * 28, y + 2 + rng() * 6, 2.2, 1.4, '#ffe36b'); } /* un tas d'or */
        else if (q < 0.8) { g.fillStyle = '#6a4722'; g.fillRect(x - 13, y - 18, 26, 20); g.fillStyle = '#8e6638'; g.fillRect(x - 13, y - 18, 26, 4); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.5; g.strokeRect(x - 10, y - 12, 20, 12); } /* une caisse */
        else { el(g, x, y, 9, 11, '#9a6a3a'); el(g, x, y - 10, 5, 3, '#6b4a2a'); } } /* un sac */
    }
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0); return r;
  };
  St.essai = q => Ar.partir(q || St.GRAND); // pour les essais
})(window.CG);
