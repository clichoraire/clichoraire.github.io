// Goblin Malin — la cabane des deux vieilles sorcières. Quelque part dans le marais (le deuxième monde, jamais dans la forêt),
// une cabane toute de travers, à moitié effondrée. Deux très vieilles sorcières attendent devant : elles vendent les parchemins
// des sorts de niveau II et III (voir niveaux.js), très, très cher. On ne trouve ces parchemins nulle part dans la forêt.
// Rien ne l'annonce : on tombe dessus en explorant. Sa place est tirée une fois, puis gardée dans la sauvegarde (S.cabane).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, Mo = CG.Mondes, Nv = CG.Niveaux; if (!Mo || !Nv || !CG.Armee) return;
  const Ca = CG.Cabane = { LOIN: 24, PRES: 78, PRIX: { 2: [900, 3], 3: [2200, 5] }, NOM: 'Griselda et Morvène, vieilles sorcières' }; // PRIX : [de base, fois le prix du sort] pour le niveau II et le niveau III
  const ici = () => Mo.ici() === 1;
  const lieu = c => ({ x: (c.tx + 1.5) * T, y: (c.ty + 2) * T - 4 }); // le milieu du pied de la cabane (elle tient sur trois cases de large, deux de profond)
  let blocS = null;
  // ---------- où elle est ----------
  Ca.placer = function () {
    const S = CG.S; if (!S || !ici()) return null;
    if (!S.cabane) {
      const libre = (x, y) => { for (let dy = -1; dy <= 3; dy++) for (let dx = -1; dx <= 3; dx++) if (!W.inMap(x + dx, y + dy) || !W.walkTile(x + dx, y + dy)) return false; return true; };
      const ok = (x, y) => libre(x, y) && Math.hypot(x - W.CX, y - W.CY) > Ca.LOIN && !S.buildings.some(b => Math.abs(b.tx - x) < 8 && Math.abs(b.ty - y) < 8) && Object.values(W.POI).every(p => Math.hypot(x - p.x, y - p.y) > (p.r || 0) + 6) && (() => { try { return !W.reachable || W.reachable(x + 1, y + 2); } catch (e) { return true; } })();
      for (let k = 0; k < 6000 && !S.cabane; k++) { const x = 6 + Math.floor(Math.random() * (CG.MW - 14)), y = 6 + Math.floor(Math.random() * (CG.MH - 14)); if (ok(x, y)) S.cabane = { tx: x, ty: y }; }
      if (!S.cabane) return null;
    }
    if (blocS !== S || W.walkTile(S.cabane.tx + 1, S.cabane.ty)) { blocS = S; W.blockBuilding({ tx: S.cabane.tx, ty: S.cabane.ty, w: 3, h: 2 }); } // on ne marche pas à travers
    return S.cabane;
  };
  // ---------- ce qu'elles vendent : le niveau suivant de chaque sort que le chef connaît ----------
  Ca.prix = function (id) { const a = CG.SPELLS[id].amelio, q = Ca.PRIX[a.n] || Ca.PRIX[3], base = (CG.SPELLS[a.base] && CG.SPELLS[a.base].prix) || 100; return Math.round((q[0] + base * q[1]) / 50) * 50; };
  Ca.ouvrir = function () {
    const S = CG.S, c = S.cabane; if (!c) return; const l = Nv.dispo(), q = lieu(c);
    if (!l.length) return UI.dialog({ who: Ca.NOM, tag: '🕸️ une cabane délabrée', text: '« Hi hi hi... Tu ne connais rien qu\'on puisse rendre plus fort, petit chef. Reviens avec de nouveaux sorts. »', options: [{ label: 'Je reviendrai' }] });
    const v = Ca.v = { role: 'vieilles', look: 'sorciere', x: q.x, y: q.y, shop: l.map(id => ({ scroll: id, icon: '📖', label: 'Tome : ' + CG.SPELLS[id].nom, desc: 'Ton sort devient plus fort.', prix: Ca.prix(id), stock: 1 })) };
    UI.shop(v, { nom: Ca.NOM, hello: 'Hi hi hi ! Des sorts plus forts, petit chef ? Ça se paie. Très cher.' });
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), S = CG.S, R = CG.R; if (it || !S || !R || !ici() || !S.cabane || R.ko > 0 || R.cine || R.build) return it;
    const q = lieu(S.cabane), p = S.player; if (Math.hypot(p.x - q.x, p.y - (q.y + 18)) > Ca.PRES) return it;
    return { type: 'cabane', obj: { x: q.x, y: q.y - 40 }, label: 'Parler aux vieilles sorcières' };
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'cabane') return in0.apply(this, arguments); CG.sfx('uiOpen'); Ca.ouvrir(); };
  const up0 = G.update; let tic = 0; G.update = function (dt) { up0.apply(this, arguments); tic -= dt; if (tic > 0) return; tic = 1; try { Ca.placer(); } catch (e) { /* jamais bloquant */ } };

  // ---------- le dessin : la cabane, puis les deux sorcières devant (chacune à sa place dans l'ordre du décor) ----------
  const ell = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const box = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function cabane(g, o, t) {
    const x = o.x, y = o.y, lueur = 0.55 + Math.sin(t * 2.3) * 0.2 + Math.sin(t * 7.1) * 0.08;
    ell(g, x, y + 3, 74, 13, 'rgba(0,0,0,0.3)');
    [[-52, 0], [-18, 2], [20, 2], [47, 1]].forEach(q => box(g, x + q[0], y - 12 + q[1], 6, 14, '#2e2118')); // de petits pilotis, pour rester au sec
    poly(g, [x - 60, y - 10, x + 56, y - 8, x + 51, y - 64, x - 55, y - 70], '#5f4832'); // les murs, de travers
    g.strokeStyle = 'rgba(30,20,12,0.5)'; g.lineWidth = 1.2; for (let i = 0; i < 10; i++) { const px = x - 50 + i * 11; g.beginPath(); g.moveTo(px, y - 9); g.lineTo(px + 1.5, y - 68 + i * 0.5); g.stroke(); }
    poly(g, [x - 38, y - 9, x - 28, y - 9, x - 27, y - 40, x - 37, y - 44], '#3a2c1e'); poly(g, [x + 40, y - 30, x + 50, y - 29, x + 50, y - 62, x + 41, y - 63], '#75593c'); // une planche pourrie, une planche neuve
    poly(g, [x - 52, y - 30, x - 20, y - 22, x - 20, y - 16, x - 52, y - 24], '#7a5e40'); [-48, -24].forEach(dx => ell(g, x + dx, y - 24 + (dx + 48) * 0.25, 1.3, 1.3, '#2a1c10')); // une planche clouée en travers
    // la porte entrouverte : du noir, une lueur verte, le battant qui pend
    poly(g, [x - 14, y - 9, x + 10, y - 9, x + 10, y - 50, x - 13, y - 53], '#140d08');
    { const gr = g.createRadialGradient(x - 2, y - 26, 2, x - 2, y - 26, 22); gr.addColorStop(0, 'rgba(120,255,160,' + (0.5 * lueur).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(120,255,160,0)'); g.fillStyle = gr; g.fillRect(x - 14, y - 53, 24, 44); }
    poly(g, [x + 10, y - 9, x + 22, y - 5, x + 22, y - 43, x + 10, y - 50], '#4e3a26'); g.strokeStyle = 'rgba(20,12,6,0.5)'; g.beginPath(); g.moveTo(x + 14, y - 8); g.lineTo(x + 14, y - 47); g.moveTo(x + 18, y - 6); g.lineTo(x + 18, y - 45); g.stroke();
    // la petite fenêtre ronde
    ell(g, x + 34, y - 42, 9, 9, '#3a2c1e'); ell(g, x + 34, y - 42, 7, 7, '#140d08'); ell(g, x + 34, y - 42, 6, 6, 'rgba(140,255,170,' + (0.55 * lueur).toFixed(3) + ')'); box(g, x + 33.2, y - 49, 1.6, 14, '#3a2c1e'); box(g, x + 27, y - 42.8, 14, 1.6, '#3a2c1e');
    // le toit affaissé : des planches, un trou, de la mousse
    poly(g, [x - 70, y - 62, x + 64, y - 56, x + 42, y - 96, x - 4, y - 92, x - 32, y - 104], '#3e3024'); poly(g, [x - 70, y - 62, x + 64, y - 56, x + 62, y - 51, x - 68, y - 57], '#2a1f16');
    g.strokeStyle = 'rgba(110,86,58,0.6)'; g.lineWidth = 1.3; for (let i = 0; i < 9; i++) { const px = x - 60 + i * 14; g.beginPath(); g.moveTo(px, y - 61 + i * 0.6); g.lineTo(px + 22 - i * 3, y - 98 + Math.abs(i - 3) * 2.4); g.stroke(); }
    poly(g, [x - 16, y - 72, x - 2, y - 70, x - 4, y - 82, x - 14, y - 84], '#120c08'); // le trou
    ell(g, x - 44, y - 70, 11, 4, '#55783a', -0.25); ell(g, x + 30, y - 66, 13, 4, '#4c6e34', 0.1); ell(g, x + 6, y - 90, 8, 3, '#55783a');
    // la cheminée tordue et sa fumée verte
    poly(g, [x + 20, y - 88, x + 33, y - 86, x + 38, y - 120, x + 26, y - 123], '#55555a'); poly(g, [x + 24, y - 121, x + 40, y - 118, x + 40, y - 113, x + 24, y - 116], '#6a6a70');
    for (let i = 0; i < 4; i++) { const k = (t * 0.22 + i / 4) % 1; ell(g, x + 32 + Math.sin(k * 5 + i) * 7 + k * 10, y - 124 - k * 46, 4 + k * 9, 4 + k * 8, 'rgba(150,235,150,' + (0.34 * (1 - k)).toFixed(3) + ')'); }
    // un crâne au-dessus de la porte, une lanterne verte qui pend
    ell(g, x - 2, y - 58, 5.5, 5.5, '#e8e0cc'); box(g, x - 4.5, y - 55, 5, 3, '#e8e0cc'); ell(g, x - 4, y - 59, 1.4, 1.5, '#221'); ell(g, x, y - 59, 1.4, 1.5, '#221');
    g.strokeStyle = '#2a1c10'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 46, y - 58); g.lineTo(x - 46 + Math.sin(t * 1.3) * 1.5, y - 44); g.stroke(); const lx = x - 46 + Math.sin(t * 1.3) * 2;
    ell(g, lx, y - 40, 9, 9, 'rgba(140,255,170,' + (0.25 * lueur).toFixed(3) + ')'); box(g, lx - 3.5, y - 45, 7, 9, '#2a1c10'); box(g, lx - 2.3, y - 43.5, 4.6, 6, 'rgba(170,255,190,' + (0.6 + 0.4 * lueur).toFixed(3) + ')');
  }
  function sorciere(g, o, t) { Art.humanoid(g, Object.assign({ x: o.x, y: o.y, face: o.face, t: t + o.seed, moving: false, step: 0, hat: true, longHair: true, robe: true, weapon: 'baton', bigNose: true }, o.look)); }
  const LOOKS = [{ skin: '#b8cc98', tunic: '#3a2452', legs: '#221', hatCol: '#231532', hair: '#e8e8e8', glow: '#7dffea', s: 0.94 }, { skin: '#c8c890', tunic: '#263f33', legs: '#1c1c14', hatCol: '#18261f', hair: '#bcbcbc', glow: '#c9a0ff', s: 0.88 }];
  const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) {
    po0.apply(this, arguments); const S = CG.S; if (!S || !ici() || !S.cabane || !Art.humanoid) return; const q = lieu(S.cabane); if (!CG.onScreen(q.x, q.y - 40) && !CG.onScreen(q.x - 80, q.y) && !CG.onScreen(q.x + 80, q.y)) return;
    const p = S.player;
    push(q.y, 21, { x: q.x, y: q.y, draw: cabane }, null);
    push(q.y + 20, 21, { x: q.x - 40, y: q.y + 20, face: p.x >= q.x - 40 ? 1 : -1, seed: 1.7, look: LOOKS[0], draw: sorciere }, null);
    push(q.y + 24, 21, { x: q.x + 42, y: q.y + 24, face: p.x >= q.x + 42 ? 1 : -1, seed: 4.2, look: LOOKS[1], draw: sorciere }, null);
  };
})(window.CG);
