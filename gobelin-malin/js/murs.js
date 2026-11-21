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
  // le portail suit sa clôture : dans une rangée verticale, il se tourne. Vu de côté, on le reconnaît à ses deux gros poteaux
  // (un au fond, un devant), au seuil de terre battue entre les deux, et à ses deux battants ouverts vers la droite, vus de face.
  // Il est dessiné en deux moitiés : celle du fond sous les personnages, celle de devant par-dessus, pour qu'on passe vraiment entre.
  const PORTE = { portail: 1, portailFer: 1 }, sprV = {};
  function moitie(type, devant) {
    const cle = type + (devant ? 'D' : 'F'); let s = sprV[cle]; if (s) return s; s = sprV[cle] = document.createElement('canvas'); s.width = 64; s.height = 90; const c = s.getContext('2d'), fer = type === 'portailFer';
    const box = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); }, poly = (p, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); }, ell = (x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.3); c.fill(); };
    const bois = devant ? ['#9a7040', '#7a5630', '#7a5630'] : ['#8a6234', '#6a4826', '#6b4a2a']; // battant, traverses, poteau (le fond est un peu plus sombre)
    ell(40, 80, 19, 4.5, 'rgba(0,0,0,0.2)');
    // le battant, ouvert vers la droite : quatre planches, deux traverses, un bout arrondi en haut
    poly([37, 57, 54, 57, 57, 60, 57, 79, 37, 79], bois[0]); [42, 47, 52].forEach(x => box(x, 58, 1, 21, 'rgba(0,0,0,0.2)')); box(37, 57, 17, 1.5, 'rgba(255,255,255,0.16)');
    box(37, 61, 20, 3, fer ? '#8a8e98' : bois[1]); box(37, 72, 20, 3, fer ? '#8a8e98' : bois[1]); box(37, 64, 20, 1, 'rgba(0,0,0,0.18)'); box(37, 75, 20, 1, 'rgba(0,0,0,0.18)');
    if (fer) [[40, 62.5], [54, 62.5], [40, 73.5], [54, 73.5]].forEach(q => ell(q[0], q[1], 1.2, 1.2, '#d0d4de')); else ell(54, 68, 1.5, 1.5, '#3a2814'); /* le loquet */
    // le gros poteau rond, avec son dessus de rondin
    box(26, 52, 12, 28, bois[2]); box(26, 52, 3, 28, 'rgba(255,255,255,0.12)'); box(34.5, 52, 3.5, 28, 'rgba(0,0,0,0.22)'); ell(32, 80, 6, 2.2, bois[2]);
    if (fer) { box(26, 58, 12, 3, '#9a9eaa'); box(26, 71, 12, 3, '#9a9eaa'); box(26, 61, 12, 1, 'rgba(0,0,0,0.25)'); box(26, 74, 12, 1, 'rgba(0,0,0,0.25)'); }
    ell(32, 52, 6, 2.8, '#b08a58'); ell(32, 52, 3.4, 1.5, '#8a6638');
    if (devant) { ell(32, 43, 6.5, 6.5, '#eee6d0'); box(29, 47, 6, 3.5, '#eee6d0'); ell(29.8, 42, 1.7, 1.7, '#221'); ell(34.2, 42, 1.7, 1.7, '#221'); poly([26, 41, 21, 34, 29, 37], '#eee6d0'); poly([38, 41, 43, 34, 35, 37], '#eee6d0'); } /* le crâne, planté sur le poteau de devant (celui du fond est à moitié caché par la clôture) */
    return s;
  }
  const debout = b => PORTE[b.type] && !b.site && !b.upg && CG.S && CG.R && CG.S.buildings.includes(b) && (voisin(b.tx, b.ty - 1) || voisin(b.tx, b.ty + 1)) && !(voisin(b.tx - 1, b.ty) || voisin(b.tx + 1, b.ty));
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const S = CG.S; if (!S || !CG.R) return;
      for (const b of S.buildings) { if (!PORTE[b.type] || !debout(b)) continue; const cx = (b.tx + 0.5) * T, by = (b.ty + 1) * T; if (!CG.onScreen(cx, by)) continue;
        g.fillStyle = 'rgba(96,70,36,0.4)'; g.beginPath(); g.ellipse(cx, by - 20, 17, 10, 0, 0, 6.3); g.fill(); g.fillStyle = 'rgba(70,50,24,0.3)'; g.beginPath(); g.ellipse(cx, by - 20, 11, 6, 0, 0, 6.3); g.fill(); // le seuil, usé par les pas
        g.drawImage(moitie(b.type, false), Math.round(cx - 32), Math.round(by - 36 - 80)); } }; }
  const de0 = Art.drawExtra;
  Art.drawExtra = function (g, b, t, night) {
    if (debout(b)) { g.drawImage(moitie(b.type, true), Math.round((b.tx + 0.5) * T - 32), Math.round((b.ty + 1) * T - 2 - 80)); return; }
    if (b.site || !(PLEIN[b.type] || FIN[b.type]) || !CG.S || !CG.R) return de0.apply(this, arguments);
    const d = X[b.type], bas = voisin(b.tx, b.ty + 1), cx = (b.tx + 0.5) * T, by = (b.ty + 1) * T, x = Math.round(cx - d.w / 2), y = Math.round(by - d.h + 6);
    if (PLEIN[b.type]) { // face lisse : seul le morceau du haut garde son rebord (ou ses pointes) ; ceux d'en dessous ne montrent que leur face
      const dessus = voisin(b.tx, b.ty - 1), c = CAP[b.type], s = sprite(b.type);
      if (dessus && PLEIN[dessus.type] && !b.upg && !b.mech) g.drawImage(s, 0, c, d.w, d.h - c, x, y + c, d.w, d.h - c); else de0.apply(this, arguments);
      if (bas && d.h - c < T + 4) g.drawImage(s, 0, c, d.w, d.h - c, x, y + c + T / 2, d.w, d.h - c); /* le muret est bas : il faut combler jusqu'au suivant ; les murs hauts se touchent déjà */ return; }
    // clôtures : seules en colonne, une file de piquets ; sinon le morceau habituel, puis la file qui descend
    const cote = voisin(b.tx - 1, b.ty) || voisin(b.tx + 1, b.ty), haut = voisin(b.tx, b.ty - 1), s = sprite(b.type), w = Math.round(d.w * 0.36), sx = Math.round((d.w - w) / 2);
    const file = dy => g.drawImage(s, sx, 0, w, d.h, x + sx, y + dy, w, d.h);
    const surPorte = bas && PORTE[bas.type] && debout(bas); // juste au-dessus d'un portail tourné : le dernier piquet recule, pour ne pas cacher le poteau du fond et son crâne
    if (cote || !(haut || bas) || b.upg) de0.apply(this, arguments); else if (surPorte) { if (!haut) file(-14); } else file(0);
    if (bas && !PORTE[bas.type]) { file(13); file(26); } // (au-dessus d'un portail, on s'arrête : son poteau du fond prend le relais)
  };
})(window.CG);
