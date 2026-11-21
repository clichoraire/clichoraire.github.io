// Goblin Malin — la Statue du Savoir : elle prête un sort qu'on ne connaît pas, pendant deux minutes, sur la prochaine touche libre.
// Si les dix touches sont prises (ou s'il ne reste aucun sort à prêter), elle monte d'un niveau un des sorts de la barre, le temps de la bénédiction.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, St = CG.Statues, pick = CG.pick; if (!St) return;
  const Nv = () => CG.Niveaux, touche = i => (i + 1) % 10;
  St.preter = function () {
    const p = CG.S.player, N = Nv(); if (p.pret) return false; p.scrolls = p.scrolls || {};
    if (p.spells.length < 10) { const c = CG.SCROLL_POOL.filter(id => CG.SPELLS[id] && !CG.SPELLS[id].amelio && !p.spells.includes(id) && !p.scrolls[id]);
      if (c.length) { const id = pick(c); p.spells.push(id); p.pret = { id }; return true; } }
    if (!N) return false; const c = p.spells.slice(0, 10).filter(b => N.T[b] && N.niv(b) < 3 && !p.scrolls[b + '_' + (N.niv(b) + 1)]); if (!c.length) return false;
    const b = pick(c); p.sortNiv = p.sortNiv || {}; p.sortNiv[b] = N.niv(b) + 1; p.pret = { niv: b }; N.rafraichir(); return true;
  };
  St.pretTxt = function () {
    const p = CG.S.player, pr = p.pret; if (!pr) return '';
    if (pr.id) { const i = p.spells.lastIndexOf(pr.id), sp = CG.SPELLS[pr.id]; return 'La statue te prête le sort ' + sp.icon + ' ' + sp.nom + ' !'; }
    const sp = CG.SPELLS[pr.niv]; return 'Ton sort ' + sp.icon + ' ' + sp.nom + ' devient plus fort !';
  };
  St.finPret = function () {
    const p = CG.S.player, pr = p.pret, N = Nv(); if (!pr) return; delete p.pret;
    if (pr.id) { const i = p.spells.lastIndexOf(pr.id), sp = CG.SPELLS[pr.id]; if (i >= 0) p.spells.splice(i, 1); UI.toast('📜 Le sort ' + (sp ? sp.nom : '') + ' s\'efface de ta mémoire.'); }
    else if (N) { const n = Math.max(1, N.niv(pr.niv) - 1); if (n > 1) p.sortNiv[pr.niv] = n; else delete p.sortNiv[pr.niv]; N.rafraichir(); UI.toast('📜 Ton sort ' + CG.SPELLS[pr.niv].nom + ' retrouve son niveau.'); }
    if (UI.modal && UI.modal.name === 'grimoire') UI.grimoire();
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S; if (!S || !CG.R) return; const p = S.player;
    if (p.pret && !St.actif('sort')) St.finPret();
  };
})(window.CG);
