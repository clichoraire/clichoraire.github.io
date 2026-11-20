// Goblin Malin — murs et clôtures posés l'un sous l'autre : le raccord. Vu de haut, une rangée verticale laissait un trou d'herbe
// entre deux morceaux ; maintenant le mur (ou la file de piquets) descend sans coupure jusqu'au morceau d'en dessous.
'use strict';
(function (CG) {
  const Art = CG.Art, T = CG.TILE, X = Art.extra; if (!X) return;
  const PLEIN = { muret: 1, mur: 1, murMetal: 1, palissade: 1 }, FIN = { cloture: 1, clotureFer: 1 }, LIE = { muret: 1, mur: 1, murMetal: 1, palissade: 1, cloture: 1, clotureFer: 1, portail: 1, portailFer: 1 };
  const CAP = { muret: 25, mur: 16, murMetal: 17, palissade: 13 }; // hauteur du rebord, des créneaux ou des pointes dans le dessin
  const spr = {};
  function sprite(type) { let s = spr[type]; if (!s) { const d = X[type]; s = spr[type] = document.createElement('canvas'); s.width = d.w; s.height = d.h; d.draw(s.getContext('2d')); } return s; }
  let carte = null, cleN = -1, cleT = -9, cleS = null;
  function voisin(tx, ty) {
    const S = CG.S, R = CG.R;
    if (!carte || cleS !== S || cleN !== S.buildings.length || R.t - cleT > 1 || R.t < cleT) { carte = new Map(); cleS = S; cleN = S.buildings.length; cleT = R.t; for (const b of S.buildings) if (LIE[b.type] && !b.site) carte.set(b.tx + b.ty * 1000, b); }
    return carte.get(tx + ty * 1000);
  }
  // le portail suit sa clôture : dans une rangée verticale, il se tourne (un poteau au fond, un devant, la poutre au-dessus, on passe de gauche à droite)
  const PORTE = { portail: 1, portailFer: 1 }, sprV = {};
  function portailV(type) {
    let s = sprV[type]; if (s) return s; s = sprV[type] = document.createElement('canvas'); s.width = 64; s.height = 118; const c = s.getContext('2d'), fer = type === 'portailFer';
    const box = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); }, poly = (p, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); }, circ = (x, y, r, f) => { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); };
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(32, 90, 9, 24, 0, 0, 6.3); c.fill();
    box(28, 24, 8, 50, '#5a3d22'); /* le poteau du fond */
    poly([36, 46, 50, 52, 50, 76, 36, 74], '#7a5630'); poly([28, 46, 14, 52, 14, 76, 28, 74], '#8a6234'); /* ses deux battants, ouverts de chaque côté */
    poly([36, 82, 52, 90, 52, 112, 36, 110], '#8a6234'); poly([28, 82, 12, 90, 12, 112, 28, 110], '#9a7040'); /* ceux du poteau de devant */
    box(27, 18, 10, 46, '#7a5630'); box(27, 18, 3, 46, 'rgba(255,255,255,0.1)'); box(34, 18, 3, 46, 'rgba(0,0,0,0.22)'); /* la poutre, vue dans sa longueur */
    box(28, 60, 8, 50, '#6b4a2a'); box(28, 60, 2.5, 50, 'rgba(255,255,255,0.1)'); /* le poteau de devant */
    box(25, 56, 14, 8, '#7a5630'); box(25, 62, 14, 2, 'rgba(0,0,0,0.3)'); circ(32, 57, 6.5, '#eee6d0'); circ(29.8, 56, 1.7, '#221'); circ(34.2, 56, 1.7, '#221'); poly([26, 55, 21, 48, 29, 51], '#eee6d0'); poly([38, 55, 43, 48, 35, 51], '#eee6d0'); /* le crâne, au bout de la poutre */
    if (fer) { box(28, 76, 8, 4, '#9a9eaa'); box(28, 96, 8, 4, '#9a9eaa'); box(28, 36, 8, 3, '#8a8e98'); box(27, 18, 10, 3, '#9a9eaa'); [[44, 62], [44, 100], [20, 62], [20, 100]].forEach(([x, y]) => circ(x, y, 1.8, '#c8ccd8')); }
    return s;
  }
  const de0 = Art.drawExtra;
  Art.drawExtra = function (g, b, t, night) {
    if (PORTE[b.type] && !b.site && !b.upg && CG.S && CG.R && CG.S.buildings.includes(b) && (voisin(b.tx, b.ty - 1) || voisin(b.tx, b.ty + 1)) && !(voisin(b.tx - 1, b.ty) || voisin(b.tx + 1, b.ty))) { g.drawImage(portailV(b.type), Math.round((b.tx + 0.5) * T - 32), Math.round((b.ty + 1) * T - 112)); return; }
    if (b.site || !(PLEIN[b.type] || FIN[b.type]) || !CG.S || !CG.R) return de0.apply(this, arguments);
    const d = X[b.type], bas = voisin(b.tx, b.ty + 1), cx = (b.tx + 0.5) * T, by = (b.ty + 1) * T, x = Math.round(cx - d.w / 2), y = Math.round(by - d.h + 6);
    if (PLEIN[b.type]) { // face lisse : seul le morceau du haut garde son rebord (ou ses pointes) ; ceux d'en dessous ne montrent que leur face
      const dessus = voisin(b.tx, b.ty - 1), c = CAP[b.type], s = sprite(b.type);
      if (dessus && PLEIN[dessus.type] && !b.upg && !b.mech) g.drawImage(s, 0, c, d.w, d.h - c, x, y + c, d.w, d.h - c); else de0.apply(this, arguments);
      if (bas && d.h - c < T + 4) g.drawImage(s, 0, c, d.w, d.h - c, x, y + c + T / 2, d.w, d.h - c); /* le muret est bas : il faut combler jusqu'au suivant ; les murs hauts se touchent déjà */ return; }
    // clôtures : seules en colonne, une file de piquets ; sinon le morceau habituel, puis la file qui descend
    const cote = voisin(b.tx - 1, b.ty) || voisin(b.tx + 1, b.ty), haut = voisin(b.tx, b.ty - 1), s = sprite(b.type), w = Math.round(d.w * 0.36), sx = Math.round((d.w - w) / 2);
    const file = dy => g.drawImage(s, sx, 0, w, d.h, x + sx, y + dy, w, d.h);
    if (cote || !(haut || bas) || b.upg) de0.apply(this, arguments); else file(0);
    if (bas) { file(13); file(26); }
  };
})(window.CG);
