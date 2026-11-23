// Goblin Malin — les sorts sont deux fois plus rares. Un seul réglage : CG.SortsRares.RARE (2 = deux fois plus rares, 1 = comme avant).
//   Butin des chefs et des monstres, récompenses des donjons, cadeaux : une fois sur deux, pas de parchemin (de l'or à la place, comme
//   quand on les connaît déjà tous). Les marchands en ont deux fois moins souvent sur leur étal. Les piédestaux à sphère mauve donnent
//   toujours le leur (on l'a gagné contre la horde), mais mettent deux fois plus de jours à se recharger.
// Chargé en dernier : il passe par-dessus toutes les autres règles de G.newScroll.
'use strict';
(function (CG) {
  const G = CG.G, Sr = CG.SortsRares = { RARE: 2 };
  // G.newScroll(true) : un parchemin promis (piédestal, troc) n'est jamais retiré
  const ns0 = G.newScroll; G.newScroll = function (promis) { if (promis !== true && Sr.RARE > 1 && Math.random() > 1 / Sr.RARE) return null; return ns0.call(this); };
  if (CG.Autels && CG.Autels.RECHARGE) CG.Autels.RECHARGE = Math.round(CG.Autels.RECHARGE * Sr.RARE);
  if (CG.Niveaux && CG.Niveaux.MARCHAND) CG.Niveaux.MARCHAND /= Sr.RARE;
})(window.CG);
