// Goblin Malin — la surprise du puits magique.
'use strict';
(function (CG) {
  const Pu = CG.Puits; if (!Pu || !Pu.reponse) return;
  // ---------- la surprise : le puits ne dit plus ce qu'il donne. Il crache une boule de cristal marquée d'un « ? », qui retombe dans l'herbe.
  // On ne sait ce qu'on a reçu qu'en la ramassant. (Laissée par terre, elle est ramassée avec le reste à la fin de la journée.)
  const rep0 = Pu.reponse;
  Pu.reponse = function (n, repond, ouvert) {
    if (!repond) return rep0.apply(this, arguments); const R = CG.R, G = CG.G, q = Pu.ici(), c = Pu.pos(); if (!q || !c) return rep0.apply(this, arguments);
    q.parle = true; G.drop(c.x, c.y - 20, { kind: 'mystere', n, jour: CG.S.day }); G.puff(c.x, c.y - 30, '#b0a0ff', 26, 190, 5); for (let i = 0; i < 3; i++) R.rings.push({ x: c.x, y: c.y - 10, r: 50 + i * 44, life: 0.45 + i * 0.12, col: '#b0a0ff' }); CG.sfx('discovery'); R.shake = Math.max(R.shake || 0, 0.15);
    const quoi = '🔮 Quelque chose jaillit du puits !', detail = 'Une boule de cristal retombe dans l\'herbe, juste à côté. Ramasse-la pour voir ce que le puits t\'a donné.';
    if (!ouvert) G.banner(quoi, detail, '#b0a0ff'); return { voix: '« ... »', quoi, detail, col: '#b0a0ff' };
  };
  Pu.ouvrirBoule = function (d) { const G = CG.G, p = CG.S.player; G.puff(d.x, d.y - 8, '#e0d0ff', 26, 170, 4); CG.R.rings.push({ x: d.x, y: d.y - 4, r: 70, life: 0.5, col: '#e0d0ff' });
    const r = rep0(d.n, true, false); if (!r) { const or = 20 * d.n; G.gain('or', or, p.x, p.y - 50); G.banner('La boule se brise', 'Le puits est déjà loin : il ne reste dedans que quelques pièces. (+' + or + ' 🪙)', '#b0a0ff'); } }; /* le puits a changé de place entre-temps : un lot de consolation */
  CG.Art.bouleMystere = function (g, t) { const gr = g.createRadialGradient(-3, -9, 1, 0, -5, 12); gr.addColorStop(0, '#f4ecff'); gr.addColorStop(0.45, '#a88cff'); gr.addColorStop(1, '#4a2f9a');
    g.fillStyle = '#6a5a3a'; g.beginPath(); g.ellipse(0, 6, 8, 3, 0, 0, 6.283); g.fill(); g.fillStyle = gr; g.beginPath(); g.arc(0, -5, 11, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,' + (0.75 + Math.sin(t * 4) * 0.25) + ')'; g.font = 'bold 15px Georgia, serif'; g.textAlign = 'center'; g.fillText('?', 0, 0.5); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(-4.5, -10, 2.6, 1.5, -0.6, 0, 6.283); g.fill(); };
})(window.CG);
