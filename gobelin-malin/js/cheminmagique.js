// Goblin Malin — le Chemin magique : un chemin comme le Chemin ordinaire, gravé de runes, où le chef et ses gobelins vont
// encore 20 % plus vite (en plus de l'élan d'un chemin). Il se pose sur l'herbe, une clairière ou un chemin déjà tracé.
// Il se gagne dans l'arbre (branche du sorcier). Tout est réglable dans CG.CheminMagique.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, Cm = CG.CheminMagique = { VITESSE: 1.2, TECH: 's20' };
  CG.BUILDS.cheminMagique = { nom: 'Chemin magique', icon: '🟪', w: 1, h: 1, cat: 'terrain', cout: { bois: 1, or: 3 }, terrain: 'magie', repeat: true, tech: Cm.TECH, desc: 'Un chemin gravé de runes : tes gobelins y vont encore 20 % plus vite que sur un chemin.' };
  { const n = { id: Cm.TECH, br: 'sorc', rang: 0.45, cout: 2, t: 5, r: 0, icon: '🟪', nom: 'Chemin magique', desc: 'Révèle le Chemin magique : un chemin gravé de runes, où tes gobelins vont encore 20 % plus vite.', unlock: ['cheminMagique'] }; CG.TECH.push(n); if (CG.TECH_BY_ID) CG.TECH_BY_ID[n.id] = n; }
  const cases = () => { const S = CG.S; return S ? (S.cheminM || (S.cheminM = {})) : {}; };
  Cm.sur = (x, y) => !!cases()[W.idx(CG.clamp(Math.floor(x / T), 0, CG.MW - 1), CG.clamp(Math.floor(y / T), 0, CG.MH - 1))];
  G.cheminK = e => (Cm.sur(e.x, e.y) ? Cm.VITESSE : 1); // lu par game.js, pour le chef et les gobelins
  // poser : sur l'herbe, une clairière ou un chemin (pas deux fois au même endroit)
  const ok0 = W.terrainOk; W.terrainOk = function (tx, ty, kind) { if (kind !== 'magie') return ok0.apply(this, arguments); if (!W.inMap(tx, ty) || cases()[W.idx(tx, ty)]) return false; return W.tile[W.idx(tx, ty)] === W.PATH || ok0.call(this, tx, ty, 'path'); };
  const st0 = W.setTerrain; W.setTerrain = function (tx, ty, kind) {
    const i = W.idx(tx, ty); if (kind !== 'magie') { delete cases()[i]; return st0.apply(this, arguments); } // du gazon par-dessus : les runes s'effacent
    if (W.tile[i] !== W.PATH) st0.call(this, tx, ty, 'path'); cases()[i] = 1;
  };
  const pb0 = D.placeBuild; D.placeBuild = function () {
    const R = CG.R; if (R && R.build && R.build.type === 'cheminMagique') { const sp = D.buildSpot(); if (!sp.ok) { CG.sfx('no'); CG.UI.toast(!G.canPay(CG.BUILDS.cheminMagique.cout) ? 'Il te manque des ressources.' : 'Le chemin magique se trace sur de l\'herbe libre ou sur un chemin.'); return; } }
    return pb0.apply(this, arguments);
  };
  // une case qui n'est plus un chemin (un arbre a repoussé, une construction...) perd ses runes
  let tic = 0; const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); if ((tic -= dt) > 0 || !CG.S) return; tic = 3; const c = cases(); for (const k in c) if (W.tile[k] !== W.PATH) delete c[k]; };
  // ---------- le dessin : une lueur mauve sur la terre, et de petites runes qui s'allument l'une après l'autre ----------
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const S = CG.S; if (!S || !S.cheminM) return; const c = S.cheminM, MW = CG.MW;
    for (const k in c) { const i = +k, tx = i % MW, ty = (i - tx) / MW, x = tx * T, y = ty * T; if (!CG.onScreen(x + T / 2, y + T / 2)) continue;
      g.fillStyle = 'rgba(150,110,255,0.20)'; g.fillRect(x + 2, y + 2, T - 4, T - 4);
      const a = 0.35 + 0.45 * Math.max(0, Math.sin(t * 2.2 - (tx + ty) * 0.9)); g.strokeStyle = 'rgba(210,180,255,' + a.toFixed(3) + ')'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath();
      const cx = x + T / 2, cy = y + T / 2, s = (tx * 7 + ty * 13) % 3;
      if (s === 0) { g.moveTo(cx - 6, cy + 6); g.lineTo(cx, cy - 7); g.lineTo(cx + 6, cy + 6); g.moveTo(cx - 3, cy + 1); g.lineTo(cx + 3, cy + 1); }
      else if (s === 1) { g.moveTo(cx - 6, cy - 6); g.lineTo(cx + 6, cy); g.lineTo(cx - 6, cy + 6); g.moveTo(cx + 2, cy - 7); g.lineTo(cx + 2, cy + 7); }
      else { g.arc(cx, cy, 6, 0, TAU); g.moveTo(cx, cy - 9); g.lineTo(cx, cy + 9); }
      g.stroke(); }
  };
})(window.CG);
