// Goblin Malin — la qualité (les étoiles) des armes, armures et outils qu'on trouve ou qu'on achète : elle monte avec les jours.
// Les premiers jours, presque tout est à 1 étoile, parfois 2 ; les 3 étoiles n'arrivent que bien plus tard. Tout se règle dans CG.Qualite.PALIERS.
'use strict';
(function (CG) {
  const Q = CG.Qualite = {
    // [à partir du jour, chance d'une 1 étoile, d'une 2 étoiles, d'une 3 étoiles]
    PALIERS: [[1, 0.88, 0.12, 0], [6, 0.6, 0.36, 0.04], [13, 0.35, 0.47, 0.18], [21, 0.18, 0.45, 0.37], [31, 0.1, 0.4, 0.5]] };
  Q.palier = function (jour) { const d = jour || (CG.S && CG.S.day) || 1; let p = Q.PALIERS[0]; for (const q of Q.PALIERS) if (d >= q[0]) p = q; return p; };
  // une qualité tirée au hasard, selon le jour
  Q.tirer = function (jour) { const p = Q.palier(jour), k = Math.random(); return k < p[1] ? 1 : k < p[1] + p[2] ? 2 : 3; };
  // un marchand a-t-il aujourd'hui un objet de cette qualité sur son étal ? (gros : un comptoir mieux garni)
  Q.enVente = function (n, gros) { const p = Q.palier(), c = Math.min(0.9, p[n] * (n === 1 ? 0.8 : 1.6) * (gros ? 1.4 : 1)); return Math.random() < c; };
})(window.CG);
