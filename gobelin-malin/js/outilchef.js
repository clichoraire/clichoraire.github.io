// Goblin Malin — le chef (lui seulement) ne récolte rien sans le bon outil sur lui : des gants pour cueillir un buisson,
// une pioche pour un rocher ou un filon d'or. (La hache pour abattre un arbre ou débiter un tronc : c'était déjà comme ça,
// abattre.js.) « Sur lui » : l'outil est dans sa case d'équipement, dans l'inventaire (I). Les gobelins, eux, travaillent comme avant.
'use strict';
(function (CG) {
  const D = CG.D, Oc = CG.OutilChef = { BESOIN: { bush: 'gant', ore: 'pioche' }, DIT: { gant: ['🧤', 'Il te faut des gants pour cueillir'], pioche: ['⛏️', 'Il te faut une pioche pour piocher'] } };
  Oc.a = k => { const q = CG.S && CG.S.player.porte; return !!(q && q[k]); };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), k = it && Oc.BESOIN[it.type]; if (!k || Oc.a(k)) return it;
    if (it.type !== 'bush') return null; /* sans l'outil : aucun indice à l'écran, et E ne fait rien */
    // sans gants, le buisson ne compte pas : on regarde ce qu'il y a d'autre ici (un coffre, un animal, un gobelin...) au lieu de ne rien proposer
    Oc.saute = true; let autre = null; try { autre = fi0.apply(this, arguments); } finally { Oc.saute = false; }
    return autre && Oc.BESOIN[autre.type] && !Oc.a(Oc.BESOIN[autre.type]) ? null : autre;
  };
})(window.CG);
