// Goblin Malin — une armure protège vraiment : celui qui la porte reçoit moins de dégâts des monstres, et de moins en moins
// avec une meilleure armure (★, ★★, ★★★). Ça vaut pour le chef comme pour les gobelins, en plus de la vie qu'elle donne déjà.
'use strict';
(function (CG) {
  const G = CG.G, Ar = CG.Armures = { MOINS: [0, 0.08, 0.15, 0.22] }; /* la part des dégâts qu'elle arrête, selon ses étoiles */
  const niv = v => { const n = v && typeof v === 'object' ? v.n : v === true ? 1 : +v || 0; return Math.max(0, Math.min(4, n || (v ? 1 : 0))); };
  Ar.chef = () => { const p = CG.S && CG.S.player, q = p && p.porte; return Ar.MOINS[niv(q && q.armure)]; };
  Ar.gobelin = g => Ar.MOINS[niv(g && g.equip && g.equip.armure)];
  const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { const k = Ar.chef(); return hp0.call(this, k ? dmg * (1 - k) : dmg); };
  const hg0 = G.hurtGoblin; G.hurtGoblin = function (g, dmg) { const k = Ar.gobelin(g); if (!k) return hg0.apply(this, arguments); const a = Array.prototype.slice.call(arguments); a[1] = dmg >= 9999 ? dmg : dmg * (1 - k); return hg0.apply(this, a); };
  if (CG.Objets && CG.Objets.PHRASE) CG.Objets.PHRASE.armure = 'Elle protège celui qui la porte : les coups font moins mal.';
})(window.CG);
