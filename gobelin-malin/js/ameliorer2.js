// Goblin Malin — toutes les huttes de métier s'améliorent comme les maisons : en pierre, puis en métal (E à côté).
// Chaque palier les rend plus solides ; la hutte du guérisseur soigne aussi plus vite et plus loin. Chargé après toutes les constructions.
'use strict';
(function (CG) {
  const G = CG.G, Am = CG.Ameliorer, Art = CG.Art; if (!Am || !Art || !Art.extra) return;
  const A2 = CG.Ameliorer2 = { SOLIDE: [1, 2, 3], SOIN: 0.4, RAYON: 35 }; /* SOIN, RAYON : ce que chaque palier de la hutte du guérisseur ajoute (vitesse de soin, portée) */
  A2.TYPES = ['guerisseur', 'forge', 'archerie', 'tannerie', 'couture', 'chaman', 'taverne', 'marche', 'caserne', 'scierie', 'grenier', 'depot', 'enclos'].filter(k => CG.BUILDS[k] && Art.extra[k] && !Am.UP[k]);
  const le = d => (/^(Hutte|Forge|Tannerie|Taverne|Caserne|Scierie)/.test(d.nom) ? ' de ' : ' en ');
  A2.TYPES.forEach(k => { const d = CG.BUILDS[k], gros = d.w * d.h >= 4 ? 1.2 : 0.8, soin = k === 'guerisseur';
    Am.UP[k] = [
      { tech: 'd3', nom: d.nom + ' en pierre', cout: { minerai: Math.round(12 * gros) }, sec: 22, effet: 'murs de pierre, deux fois plus solide' + (soin ? ' ; le guérisseur soigne plus vite et plus loin' : '') },
      { tech: 'd9', nom: d.nom + ' en métal', cout: { minerai: Math.round(25 * gros), or: Math.round(20 * gros) }, sec: 30, effet: 'plaquée de métal, trois fois plus solide qu\'au départ' + (soin ? ' ; le guérisseur soigne encore plus vite et plus loin' : '') }];
    const X = Art.extra[k]; X.lvl = b => Math.min(2, (b && b.up) || 0); X.up = materiau; void le; });
  { const mh = G.buildMaxHp; G.buildMaxHp = function (b) { const v = mh.apply(this, arguments); return v && b && A2.TYPES.includes(b.type) ? v * A2.SOLIDE[Math.min(2, b.up || 0)] : v; }; }
  // le nouveau matériau, peint une seule fois par-dessus le dessin du bâtiment : la teinte d'abord (les détails restent), puis les joints ou les rivets
  function materiau(c, lv) {
    const cv = c.canvas, w = cv.width, h = cv.height, y0 = Math.round(h * 0.5), metal = lv >= 2, t = document.createElement('canvas'); t.width = w; t.height = h; const g = t.getContext('2d');
    g.fillStyle = metal ? '#7f93ad' : '#98948c'; g.fillRect(0, y0, w, h - y0); if (metal) { g.globalAlpha = 0.55; g.fillRect(0, 0, w, y0); g.globalAlpha = 1; }
    g.globalCompositeOperation = 'destination-in'; g.drawImage(cv, 0, 0);
    c.save(); c.globalCompositeOperation = 'color'; c.drawImage(t, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = metal ? 'rgba(170,190,215,0.22)' : 'rgba(200,196,186,0.2)'; c.fillRect(0, y0, w, h - y0);
    if (!metal) { c.strokeStyle = 'rgba(50,48,44,0.42)'; c.lineWidth = 1; c.beginPath(); let r = 0; for (let y = y0 + 4; y < h; y += 9, r++) { c.moveTo(0, y); c.lineTo(w, y); for (let x = r % 2 ? 9 : 0; x < w; x += 18) { c.moveTo(x, y); c.lineTo(x, y + 9); } } c.stroke(); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(0, y0, w, 2); }
    else { c.strokeStyle = 'rgba(30,40,56,0.45)'; c.lineWidth = 1; c.beginPath(); for (let x = 7; x < w; x += 16) { c.moveTo(x, y0); c.lineTo(x, h); } c.moveTo(0, y0 + 1); c.lineTo(w, y0 + 1); c.stroke();
      c.fillStyle = 'rgba(235,242,255,0.75)'; for (let x = 7; x < w; x += 16) for (let y = y0 + 6; y < h - 2; y += 14) { c.beginPath(); c.arc(x + 3.5, y, 1.1, 0, 6.3); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(0, y0 + 3, w, 3); c.fillStyle = 'rgba(224,176,64,0.8)'; c.fillRect(0, y0 - 1, w, 2); }
    c.restore();
  }
  A2.materiau = materiau;
})(window.CG);
