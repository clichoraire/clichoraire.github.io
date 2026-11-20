// Goblin Malin — trois retouches. 1) Chaque parchemin reçu a droit à la grande scène (le chef le brandit, colonne de
// lumière), d'où qu'il vienne : démon, marchand, butin, récompense... 2) Chez un gobelin, on ne montre plus les choix
// qu'on ne peut pas faire. 3) Copier un sort coûte au moins 200 pièces d'or.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Tv = CG.Trouve;
  // ---------- la scène, pour tout parchemin nouveau dans le sac ----------
  if (Tv) { const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const sc = S.player.scrolls || {};
    if (!R.parchVus || R.parchS !== S) { R.parchVus = new Set(Object.keys(sc)); R.parchS = S; return; } // partie chargée, monde changé : ceux qu'on a déjà ne comptent pas
    let neufs = null; for (const id in sc) if (sc[id] && !R.parchVus.has(id)) (neufs = neufs || []).push(id); if (!neufs) return;
    if (R.trouve || document.getElementById('butin')) { neufs.forEach(id => R.parchVus.add(id)); return; } // il vient d'une scène : elle a déjà fait la fête
    if (UI.modal || R.ko > 0 || R.night || R.cine || R.rayon || R.chambre || (CG.Mondes && CG.Mondes.pending)) return; // on attend que la boutique soit fermée, que le combat de scène finisse...
    neufs.forEach(id => R.parchVus.add(id)); const p = S.player, nom = neufs.length === 1 ? CG.SPELLS[neufs[0]].nom : neufs.length + ' parchemins';
    Tv.play('📜', () => { G.text(p.x, p.y - 120, '📜 ' + nom + ' !', '#ffe36b', true); }, neufs);
  }; }
  // ---------- chez un gobelin : seulement ce qu'on peut vraiment choisir ----------
  const dl0 = UI.dialog; UI.dialog = function (o) {
    if (o && o.goblin && Array.isArray(o.options)) { const ok = o.options.filter(x => x && !x.disabled); if (ok.length && ok.length < o.options.length) o = Object.assign({}, o, { options: ok }); }
    return dl0.call(this, o);
  };
  // ---------- le prix des sorts : les premiers ne se copient plus pour trois sous ----------
  const P = { etincelle: 400, fleche: 400, vision: 420, soin: 460, glace: 460, racines: 460, feu: 500, bouclier: 500, retour: 500, cri: 540, illusion: 540, eclair: 560, murfeu: 580, meteore: 800 };
  Object.keys(P).forEach(id => { if (CG.SPELLS[id]) CG.SPELLS[id].prix = P[id]; });
  Object.keys(CG.SPELLS).forEach(id => { const sp = CG.SPELLS[id], am = sp.amelio; if (am && P[am.base]) sp.prix = Math.round(P[am.base] * (am.n === 2 ? 1.8 : 3)); }); // les niveaux II et III suivent
  const cc0 = G.copyCost; G.copyCost = function (id) { return Math.max(200, cc0.apply(this, arguments)); };
})(window.CG);
