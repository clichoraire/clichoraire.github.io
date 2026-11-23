// Goblin Malin — la fée noire. Quand le chef lance le sort qui montre ce qui se cache dans l'ombre, loin du village, il arrive
// qu'une petite fée noire se trouve là : on ne la voit que tant que le sort dure. Elle se sauve quand on approche ; si on la
// rattrape, elle mène tout droit chez la Grande Fée (secrets.js), qui offre son cadeau. Tout se règle dans CG.FeeNoire.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, Se = CG.Secrets; if (!Se || !Se.entrer || !CG.Magie) return;
  const Fn = CG.FeeNoire = { CHANCE: 0.3, LOIN: 14, PAR_JOUR: 1, PRES: [150, 260], PEUR: 70, SAUT: 130, FUITES: 3, PRISE: 26 }; /* LOIN : à combien de cases du feu il faut être ; FUITES : combien de fois elle s'échappe avant de se laisser prendre */
  { const ps0 = Se.pos; Se.pos = function (s) { return s && s.k === 'feeNoire' ? { x: s.px, y: s.py } : ps0.apply(this, arguments); }; }
  const dehors = () => !CG.Mondes || CG.Mondes.ici() !== 2;
  function apparaitre() {
    const S = CG.S, R = CG.R, p = S.player, f = G.firePos(); if (R.feeNoire || !dehors() || Math.hypot(p.x - f.x, p.y - f.y) < Fn.LOIN * T) return;
    if (S.feeNoireJour === S.day && (S.feeNoireN || 0) >= Fn.PAR_JOUR) return; if (Math.random() > Fn.CHANCE) return;
    for (let i = 0; i < 20; i++) { const a = Math.random() * TAU, d = Fn.PRES[0] + Math.random() * (Fn.PRES[1] - Fn.PRES[0]), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; if (x < 3 * T || y < 3 * T || x > (CG.MW - 3) * T || y > (CG.MH - 3) * T || !W.walkPx(x, y)) continue;
      R.feeNoire = { k: 'feeNoire', px: x, py: y, fx: x, fy: y, vol: 0, fuites: 0, seed: Math.random() * 10 }; if (S.feeNoireJour !== S.day) { S.feeNoireJour = S.day; S.feeNoireN = 0; } S.feeNoireN++; return; }
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, S = CG.S; if (!R || !S) return;
    const oeil = R.oeilOmbre > 0, avant = !!R.feeOeil; R.feeOeil = oeil; if (oeil && !avant) apparaitre(); // le sort vient d'être lancé
    const s = R.feeNoire; if (!s) return; if (!oeil) { R.feeNoire = null; return; } // le sort s'éteint : elle retourne à l'ombre
    if (R.chambre || R.ko > 0) return; const p = S.player;
    if (s.vol > 0) { s.vol -= dt * 1.6; if (Math.random() < dt * 20) R.parts.push({ x: s.px + (s.fx - s.px) * Math.max(0, s.vol), y: s.py + (s.fy - s.py) * Math.max(0, s.vol) - 26, vx: 0, vy: 14, life: 0.5, max: 0.5, col: '#b48cff', size: 2, float: true }); return; }
    const d = Math.hypot(s.px - p.x, s.py - p.y);
    if (d < Fn.PRISE) { R.feeNoire = null; G.text(p.x, p.y - 70, '🧚 Attrapée !', '#d8c0ff', true); Se.entrer(s); return; }
    if (d > Fn.PEUR || s.fuites >= Fn.FUITES) return;
    const a0 = Math.atan2(s.py - p.y, s.px - p.x);
    for (let i = 0; i < 14; i++) { const a = a0 + (i ? (Math.random() - 0.5) * 2.4 : 0), q = Fn.SAUT * (0.8 + Math.random() * 0.5), x = s.px + Math.cos(a) * q, y = s.py + Math.sin(a) * q; if (x < 3 * T || y < 3 * T || x > (CG.MW - 3) * T || y > (CG.MH - 3) * T || !W.walkPx(x, y)) continue;
      s.fx = s.px; s.fy = s.py; s.px = x; s.py = y; s.vol = 1; s.fuites++; if (CG.onScreen(x, y)) CG.sfx('spell'); return; }
    s.fuites = Fn.FUITES; // nulle part où aller : elle se laisse prendre
  };
  // le dessin : une petite silhouette noire aux ailes violettes, qui volette (par-dessus le monde, comme les silhouettes de l'ombre)
  const el = (g, x, y, rx, ry, c, r) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R, s = R && R.feeNoire; if (!s || !(R.oeilOmbre > 0)) return;
    const k = Math.max(0, s.vol), x = s.px + (s.fx - s.px) * k, y = s.py + (s.fy - s.py) * k - 26 - Math.sin(k * Math.PI) * 18 + Math.sin(t * 3 + s.seed) * 3; if (!CG.onScreen(x, y)) return;
    const bat = Math.sin(t * 22 + s.seed) * 0.5, a = Math.min(1, R.oeilOmbre / 1.5);
    g.save(); g.globalAlpha = a; el(g, s.px, s.py + 1, 7, 2.4, 'rgba(0,0,0,0.25)'); g.translate(x, y);
    g.globalAlpha = a * 0.35; el(g, 0, 0, 15, 15, '#7a4ad0'); g.globalAlpha = a * 0.8;
    el(g, -6, -3, 7, 4 + bat * 2, '#8a5ae0', -0.5 - bat * 0.4); el(g, 6, -3, 7, 4 + bat * 2, '#8a5ae0', 0.5 + bat * 0.4); el(g, -4.5, 3, 4.5, 2.6, '#6a3ac0', 0.5); el(g, 4.5, 3, 4.5, 2.6, '#6a3ac0', -0.5);
    g.globalAlpha = a; el(g, 0, 1, 2.6, 5.5, '#17101f'); el(g, 0, -6, 3.4, 3.4, '#17101f'); el(g, -1.2, -6.4, 0.8, 0.9, '#d8b8ff'); el(g, 1.2, -6.4, 0.8, 0.9, '#d8b8ff');
    g.restore();
  };
})(window.CG);
