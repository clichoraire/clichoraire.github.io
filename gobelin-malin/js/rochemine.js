// Goblin Malin — deux réglages.
//   1) Toutes les roches se minent : les gros rochers gris de la forêt et du marais (ceux qui barraient le passage) se cassent
//      à coups de pioche, comme un arbre s'abat. Un appui sur E = un coup. La roche disparaît et laisse du minerai.
//      (Pas dans les donjons : là-bas, la roche, ce sont les murs.)
//   2) Les sorts coûtent le double : parchemins chez les marchands, et copie dans le grimoire.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, rand = CG.rand;
  const Pi = CG.RocheMine = { COUPS: 14, GAIN: 3, PRES: 50, REPOS: 0.4, TOUCHE: 0.17, SORTS: 1 } /* SORTS : les prix des sorts sont maintenant fixés par cercle (cerclesprix.js) */;
  const dehors = () => !CG.Mondes || CG.Mondes.ici() !== 2;
  const faits = () => { const R = CG.R; return R.rocFaits || (R.rocFaits = {}); };
  Pi.nb = function () { const q = CG.S.player.porte, o = q && q.pioche, n = o && o.n > 0 ? Math.min(3, o.n) : 1, K = CG.Coups ? CG.Coups.OUTIL[n] : 1; return Math.max(3, Math.round(Pi.COUPS * K)); };
  function rochePres() {
    const R = CG.R, p = CG.S.player, px = Math.floor(p.x / T), py = Math.floor(p.y / T); let best = null, bd = Pi.PRES;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = px + dx, y = py + dy; if (x < 2 || y < 2 || x > CG.MW - 3 || y > CG.MH - 3 || W.tile[W.idx(x, y)] !== W.ROCK) continue; const cx = x * T + T / 2, cy = y * T + T / 2, d = Math.hypot(cx - p.x, cy - p.y) - (R.dir && (R.dir.x * (cx - p.x) + R.dir.y * (cy - p.y)) > 0 ? 8 : 0); if (d < bd) { bd = d; best = { x, y }; } }
    return best;
  }
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments); if (it) return it; const R = CG.R; if (!R || R.ko > 0 || R.cine || R.build || !dehors()) return it;
    const a = rochePres(); if (!a) return it; const n = faits()[a.x + ',' + a.y] || 0;
    return { type: 'rocheChef', obj: a, label: n ? 'Encore un coup de pioche (' + n + '/' + Pi.nb() + ')' : 'Casser la roche ⛏️' };
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'rocheChef') return in0.apply(this, arguments);
    const R = CG.R, p = CG.S.player; if (R.rocT > 0 || R.rocImp) return; const a = it.obj, cx = a.x * T + T / 2;
    p.face = cx > p.x ? 1 : -1; R.rocT = Pi.REPOS; R.coupPose = R.chefPose = { k: 'mine', fin: R.t + 0.5, d: R.t, dur: 0.5 }; R.rocImp = { t: R.t + Pi.TOUCHE, a };
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, S = CG.S; if (!R || !S) return; if (R.rocT > 0) R.rocT -= dt;
    const m = R.rocImp; if (!m || R.t < m.t) return; R.rocImp = null;
    const a = m.a, i = W.idx(a.x, a.y); if (W.tile[i] !== W.ROCK) return; const x = a.x * T + T / 2, y = a.y * T + T / 2, c = a.x + ',' + a.y, M = faits(), n = (M[c] || 0) + 1;
    CG.sfx('chop'); G.puff(x + rand(-8, 8), y - 12, '#9aa0a8', 5, 100, 3);
    for (let k = 0; k < 4; k++) R.parts.push({ x, y: y - 14, vx: rand(-150, 150), vy: -rand(40, 170), life: 0.28, max: 0.28, col: k % 2 ? '#fff6c8' : '#ffd060', size: 1.8 });
    if (n < Pi.nb()) { M[c] = n; return; }
    delete M[c]; W.tile[i] = W.GRASS; (S.terra || (S.terra = {}))[i] = W.GRASS; W.fieldDirty = true; W.miniDirty = true; if (W.terrain && W.repaintArea) W.repaintArea(a.x, a.y);
    G.puff(x, y - 10, '#9aa0a8', 18, 140, 5); R.shake = Math.max(R.shake || 0, 0.12); if (CG.onScreen(x, y)) CG.sfx('hit');
    if (CG.Equipement) CG.Equipement.ctx = 'pioche'; try { G.gain('minerai', Pi.GAIN, x, y - 30); } finally { if (CG.Equipement) CG.Equipement.ctx = null; }
  };
  // ---------- les sorts : le double ----------
  Object.keys(CG.SPELLS).forEach(id => { const sp = CG.SPELLS[id]; if (typeof sp.prix === 'number') sp.prix = Math.round(sp.prix * Pi.SORTS); });
  { const cc0 = G.copyCost; G.copyCost = function (id) { return Math.max(200 * Pi.SORTS, cc0.apply(this, arguments)); }; }
})(window.CG);
