// Goblin Malin — murs et clôtures posés l'un sous l'autre : le raccord. Vu de haut, une rangée verticale laissait un trou d'herbe
// entre deux morceaux ; maintenant le mur (ou la file de piquets) descend sans coupure jusqu'au morceau d'en dessous.
'use strict';
(function (CG) {
  const Art = CG.Art, T = CG.TILE, X = Art.extra; if (!X) return;
  const PLEIN = { muret: 1, mur: 1, murMetal: 1, palissade: 1 }, FIN = { cloture: 1, clotureFer: 1 }, LIE = { muret: 1, mur: 1, murMetal: 1, palissade: 1, cloture: 1, clotureFer: 1, portail: 1, portailPierre: 1, portailFer: 1 };
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
  const PORTE = { portail: 1, portailPierre: 1, portailFer: 1 }, sprV = {};
  function moitie(type, devant) {
    const cle = type + (devant ? 'D' : 'F'); let s = sprV[cle]; if (s) return s; s = sprV[cle] = document.createElement('canvas'); s.width = 64; s.height = 90; const c = s.getContext('2d'), fer = type === 'portailFer', pierre = type === 'portailPierre';
    const box = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); }, poly = (p, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); }, ell = (x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.3); c.fill(); };
    // battant, traverses, poteau, dessus du poteau (le fond est un peu plus sombre) — en bois, en pierre (piliers de pierre, battants de bois) ou tout en métal
    const m = fer ? (devant ? ['#9aa0ae', '#6c7280', '#8a909e', '#b4bac8', '#8a909e'] : ['#8a909e', '#606674', '#7c8290', '#a4aab8', '#7c8290'])
      : pierre ? (devant ? ['#9a7040', '#7a5630', '#8d8981', '#a9a59c', '#74706a'] : ['#8a6234', '#6a4826', '#7d7972', '#99958c', '#68645e'])
        : (devant ? ['#9a7040', '#7a5630', '#7a5630', '#b08a58', '#8a6638'] : ['#8a6234', '#6a4826', '#6b4a2a', '#b08a58', '#8a6638']);
    ell(40, 80, 19, 4.5, 'rgba(0,0,0,0.2)');
    // le battant, ouvert vers la droite : quatre planches (ou barreaux), deux traverses, un coin coupé en haut
    poly([37, 57, 54, 57, 57, 60, 57, 79, 37, 79], m[0]); [42, 47, 52].forEach(x => box(x, 58, 1, 21, fer ? 'rgba(20,24,34,0.35)' : 'rgba(0,0,0,0.2)')); box(37, 57, 17, 1.5, 'rgba(255,255,255,0.16)');
    box(37, 61, 20, 3, m[1]); box(37, 72, 20, 3, m[1]); box(37, 64, 20, 1, 'rgba(0,0,0,0.18)'); box(37, 75, 20, 1, 'rgba(0,0,0,0.18)');
    if (fer) [[40, 62.5], [54, 62.5], [40, 73.5], [54, 73.5]].forEach(q => ell(q[0], q[1], 1.2, 1.2, '#d0d4de')); else ell(54, 68, 1.5, 1.5, '#3a2814'); /* le loquet */
    // le gros poteau (rondin, pilier de pierre ou colonne de métal), avec son dessus
    box(26, 52, 12, 28, m[2]); box(26, 52, 3, 28, 'rgba(255,255,255,0.12)'); box(34.5, 52, 3.5, 28, 'rgba(0,0,0,0.22)'); ell(32, 80, 6, 2.2, m[2]);
    if (pierre) { [59, 66, 73].forEach((y, i) => { box(26, y, 12, 1, 'rgba(30,30,28,0.45)'); box(i % 2 ? 30 : 34, y - 7, 1, 7, 'rgba(30,30,28,0.35)'); }); }
    if (fer) { box(26, 58, 12, 2, '#b4bac8'); box(26, 71, 12, 2, '#b4bac8'); [[29, 65], [35, 65], [29, 77], [35, 77]].forEach(q => ell(q[0], q[1], 1, 1, '#d0d4de')); }
    ell(32, 52, 6, 2.8, m[3]); ell(32, 52, 3.4, 1.5, m[4]);
    if (devant) { ell(32, 43, 6.5, 6.5, '#eee6d0'); box(29, 47, 6, 3.5, '#eee6d0'); ell(29.8, 42, 1.7, 1.7, '#221'); ell(34.2, 42, 1.7, 1.7, '#221'); poly([26, 41, 21, 34, 29, 37], '#eee6d0'); poly([38, 41, 43, 34, 35, 37], '#eee6d0'); } /* le crâne, planté sur le poteau de devant (celui du fond est à moitié caché par la clôture) */
    return s;
  }
  const debout = b => PORTE[b.type] && !b.site && CG.S && CG.R && (CG.S.buildings.includes(b) || CG.S.buildings.includes(Object.getPrototypeOf(b))) && (voisin(b.tx, b.ty - 1) || voisin(b.tx, b.ty + 1)) && !(voisin(b.tx - 1, b.ty) || voisin(b.tx + 1, b.ty));
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const S = CG.S; if (!S || !CG.R) return;
      for (const b of S.buildings) { if (!PORTE[b.type] || !debout(b)) continue; const cx = (b.tx + 0.5) * T, by = (b.ty + 1) * T; if (!CG.onScreen(cx, by)) continue;
        g.fillStyle = 'rgba(96,70,36,0.4)'; g.beginPath(); g.ellipse(cx, by - 20, 17, 10, 0, 0, 6.3); g.fill(); g.fillStyle = 'rgba(70,50,24,0.3)'; g.beginPath(); g.ellipse(cx, by - 20, 11, 6, 0, 0, 6.3); g.fill(); // le seuil, usé par les pas
        g.drawImage(moitie(b.type, false), Math.round(cx - 32), Math.round(by - 36 - 80)); } }; }
  // le muret de pierre dans une rangée verticale, vu de côté : un mur mince qui file vers le bas (son dessus clair, avec ses
  // pierres ; sa tranche de face seulement au bout de la rangée), au lieu du gros bloc vu de face
  function muretV(g, b, bas) {
    const cx = Math.round((b.tx + 0.5) * T), by = (b.ty + 1) * T, L = 9, HT = 17, suite = bas && !PORTE[bas.type], bout = suite ? 0 : 6, y0 = by - T - HT, y1 = by - HT - bout; // HT : la hauteur du muret
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(cx - L - 2, by - T + 2, L * 2 + 7, T - bout);
    g.fillStyle = '#6e6e68'; g.fillRect(cx + L - 3, y0 + 3, 4, y1 - y0 + HT - 3); // le flanc droit, dans l'ombre
    g.fillStyle = '#b4b4ac'; g.fillRect(cx - L, y0, L * 2, y1 - y0); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(cx - L, y0, 3, y1 - y0);
    g.fillStyle = 'rgba(60,60,56,0.5)'; for (let i = 0; i < 4; i++) { const y = y0 + 5 + i * 10; if (y > y1 - 2) break; g.fillRect(cx - L, y, L * 2, 1); g.fillRect(cx + (i % 2 ? -3 : 3), y - (i ? 10 : 5), 1, i ? 10 : 5); } // les joints des pierres du dessus
    if (!suite) { g.fillStyle = '#8c8c86'; g.fillRect(cx - L, y1, L * 2, HT); g.fillStyle = 'rgba(60,60,56,0.5)'; g.fillRect(cx - L, y1 + 8, L * 2, 1); g.fillRect(cx - 2, y1, 1, 8); g.fillRect(cx + 4, y1 + 9, 1, HT - 9); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx - L, y1, L * 2, 1.5); } // la tranche, au bout
  }
  const de0 = Art.drawExtra;
  // en travaux (amélioration sur place) : avant, le morceau repassait à son dessin de face, même dans une rangée verticale.
  // Maintenant l'ancien garde sa forme (rangée ou colonne), et le nouveau matériau monte par-dessus dans la même forme.
  function travaux(g, b, t, night) {
    const Am = CG.Ameliorer, n = Am.UP && Am.UP[b.type] && Am.UP[b.type][b.upg.i], pr = Math.min(1, b.upg.prog / b.upg.need), base = Object.create(b); base.upg = null;
    Art.drawExtra.call(this, g, base, t, night);
    if (n && n.to && pr > 0.01) { const f = Object.create(b); f.upg = null; f.type = n.to; const H = (CG.siteH ? CG.siteH(f) : 110) + 30, by = (b.ty + b.h) * T + 14;
      g.save(); g.beginPath(); g.rect(b.tx * T - 70, by - H * pr, b.w * T + 140, H * pr); g.clip(); Art.drawExtra.call(this, g, f, t, night); g.restore(); }
    const cx = (b.tx + b.w / 2) * T, y = (b.ty + b.h) * T - 74; Art.bar(g, cx, y, 36, pr, '#7ad0ff'); g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.textAlign = 'center'; g.fillText('🔨', cx, y - 6);
  }
  Art.drawExtra = function (g, b, t, night) {
    if (b.upg && LIE[b.type] && !b.site && CG.Ameliorer && CG.S && CG.R) return travaux.call(this, g, b, t, night);
    if (debout(b)) { g.drawImage(moitie(b.type, true), Math.round((b.tx + 0.5) * T - 32), Math.round((b.ty + 1) * T - 2 - 80)); return; }
    if (b.site || !(PLEIN[b.type] || FIN[b.type]) || !CG.S || !CG.R) return de0.apply(this, arguments);
    const d = X[b.type], bas = voisin(b.tx, b.ty + 1), cx = (b.tx + 0.5) * T, by = (b.ty + 1) * T, x = Math.round(cx - d.w / 2), y = Math.round(by - d.h + 6);
    if (b.type === 'muret' && !(voisin(b.tx - 1, b.ty) || voisin(b.tx + 1, b.ty)) && (bas || voisin(b.tx, b.ty - 1))) return muretV(g, b, bas); // le muret suit sa rangée : vu de côté, il est mince comme la clôture
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
