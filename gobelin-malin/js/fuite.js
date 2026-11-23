// Goblin Malin — la fuite des blessés : un gobelin qui n'est pas garde et qui se bat (un travailleur armé, un chasseur à qui on a
//   demandé de tirer sur les monstres, un villageois sorti la nuit, celui qui suit le chef après un « à l'aide ! ») lâche tout
//   dès qu'il tombe à la moitié de sa vie ou moins, et court se mettre à l'abri. Les gardes, eux, tiennent leur poste (repli.js).
//   Celui qui suivait le chef rentre se cacher ; si le chef finit le travail, il ressort le remercier comme d'habitude.
'use strict';
(function (CG) {
  const G = CG.G, pick = CG.pick, Fu = CG.Fuite = { PV: 0.5, VITE: 150 };
  Fu.CRI = ['Aïe ! Je me sauve !', 'J\'ai trop mal, je rentre !', 'Ouille ouille ouille ! À l\'abri !', 'Continue sans moi, chef !', 'Je saigne ! Je file !'];
  Fu.blesse = g => !!g && g.job !== 'garde' && g.hp > 0 && g.hp <= G.gobMaxHp(g) * Fu.PV;
  const crier = g => { const R = CG.R; if (!R || (g.fuiteDit || 0) > R.t) return; g.fuiteDit = R.t + 8; G.say(g, pick(Fu.CRI), 2.6); };
  const Es = CG.Espion, Gi = CG.Gibier, Ai = CG.Aide;
  if (Es && Es.defend) { const d0 = Es.defend; Es.defend = function (g) { if (Fu.blesse(g)) { if (g.state === 'fight') { crier(g); G.resetGoblin(g); } return false; } return d0.apply(this, arguments); }; }
  if (Gi && Gi.brave) { const b0 = Gi.brave; Gi.brave = function (g) { if (Fu.blesse(g)) { if (g.state === 'gDef') crier(g); return false; } return b0.apply(this, arguments); }; }
  if (Ai && Ai.step) { const s0 = Ai.step; Ai.step = function (g, dt) {
    const R = CG.R, S = CG.S, a = g.aide; if (!a || a.ph === 'va' || a.ph === 'parle') return s0.apply(this, arguments);
    if (!a.fuit) { if (!Fu.blesse(g)) return s0.apply(this, arguments); a.fuit = true; crier(g); g.path = null; const d = G.door(G.shelter(g)); if (!G.goTo(g, d.x, d.y)) { const f = G.firePos(); G.goTo(g, f.x, f.y + 40); } }
    const reste = a.es.some(e => !e.dead && R.enemies.includes(e));
    if (!reste || a.t <= 0 || R.aide !== a || R.alarm || R.night) { if (g.hidden) { g.hidden = false; if (G.unstick) G.unstick(g, 8); } return s0.apply(this, arguments); } /* fini (gagné, trop tard ou annulé) : la suite habituelle */
    a.t -= dt; g.state = 'aide'; g.pose = null; g.bubble = null; g.alerte = 0; if (g.hidden) { g.moving = false; return true; }
    g.panic = Math.max(g.panic || 0, 0.5); if (G.follow(g, Fu.VITE, dt)) { if (g.dehors) g.moving = false; else g.hidden = true; }
    return true;
  }; }
})(window.CG);
