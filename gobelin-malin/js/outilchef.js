// Goblin Malin — le chef (lui seulement) ne récolte rien sans le bon outil sur lui : des gants pour cueillir un buisson,
// une pioche pour un rocher ou un filon d'or. (La hache pour abattre un arbre ou débiter un tronc : c'était déjà comme ça,
// abattre.js.) « Sur lui » : l'outil est dans sa case d'équipement, dans l'inventaire (I). Les gobelins, eux, travaillent comme avant.
'use strict';
(function (CG) {
  const D = CG.D, Oc = CG.OutilChef = { BESOIN: { bush: 'gant', ore: 'pioche' }, DIT: { gant: ['🧤', 'Il te faut des gants pour cueillir'], pioche: ['⛏️', 'Il te faut une pioche pour piocher'] } };
  Oc.a = k => { const q = CG.S && CG.S.player.porte; return !!(q && q[k]); };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), k = it && Oc.BESOIN[it.type]; if (!k || Oc.a(k)) return it;
    return { type: 'sansOutil', outil: k, obj: it.obj && it.obj.x !== undefined && it.obj.x > 200 ? it.obj : null, label: Oc.DIT[k][1] + ' ' + Oc.DIT[k][0] };
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'sansOutil') return in0.apply(this, arguments);
    CG.sfx('no'); CG.UI.toast(Oc.DIT[it.outil][0] + ' ' + Oc.DIT[it.outil][1] + '. Mets-en sur toi, dans ton inventaire (I).');
  };
})(window.CG);
