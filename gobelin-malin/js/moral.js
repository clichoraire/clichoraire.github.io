// Goblin Malin — un village malheureux n'attire personne : sous 50 % de moral, ni gobelins nomades ni monstres ne viennent demander à s'installer.
'use strict';
(function (CG) {
  const D = CG.D, Mr = CG.Moral = { SEUIL: 50, ROLES: ['nomade', 'monstre'] };
  Mr.triste = () => !!CG.S && CG.S.morale < Mr.SEUIL;
  const sv = D.startVisit; D.startVisit = function (ev) {
    if (ev && Mr.ROLES.includes(ev.role) && Mr.triste()) { const R = CG.R; if (R && !R.moralDit) { R.moralDit = true; CG.UI.toast('😟 Des voyageurs ont aperçu ton village de loin, puis ont fait demi-tour : personne ne veut s\'installer dans un clan malheureux (moral sous ' + Mr.SEUIL + ' %).'); } return null; }
    return sv.apply(this, arguments);
  };
})(window.CG);
