// Goblin Malin — les squelettes lancent des os. Chaque squelette en lance 1 ou 2 à la fois, décidé à sa naissance.
//   Celui qui en lance 2 est un peu plus fort (plus de vie, tape plus fort, un poil plus grand) et porte deux os croisés dans le dos.
//   Pareil pour les autres squelettes : rouge, chevalier, et le noir (dont l'os spécial part en double).
// Tout est réglable dans CG.OsDouble.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, Mt = CG.Morts, rand = CG.rand, dist = CG.dist; if (!Mt) return;
  const Od = CG.OsDouble = { TYPES: { squelette: 1, squeletteRouge: 1, squeletteChevalier: 1, squeletteNoir: 1 }, DEUX: 0.3, DEUX_JOUR: 0.02, DEUX_MAX: 0.55, VIE: 1.25, DMG: 1.15, TAILLE: 1.1,
    CD: [4.5, 7.5], PORTEE: [70, 250], ELAN: 0.45, FORCE: 0.75, ECART: 0.16 }; /* DEUX : chance de lancer 2 os (monte un peu chaque jour) ; FORCE : dégâts d'un os, par rapport à son coup normal */
  const sp0 = G.spawnEnemy; G.spawnEnemy = function () {
    const e = sp0.apply(this, arguments); if (!e || !Od.TYPES[e.type] || e.osNb) return e;
    const d = CG.S ? CG.S.day : 1; e.osNb = Math.random() < Math.min(Od.DEUX_MAX, Od.DEUX + (d - 1) * Od.DEUX_JOUR) ? 2 : 1;
    if (e.osNb === 2) { e.hp = e.maxhp = Math.round(e.hp * Od.VIE); e.dmg *= Od.DMG; } return e;
  };
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.rooted > 0.5 || e.retreat || e.kb;
  function os(e, ux, uy, dmg) { const R = CG.R; (R.osMorts = R.osMorts || []).push({ x: e.x, y: e.y - 20, ux, uy, t: 0, dmg, vus: new Set() }); }
  function gerbe(e, ux, uy, dmg) { if (e.osNb === 2) { const a = Math.atan2(uy, ux); [-Od.ECART, Od.ECART].forEach(k => os(e, Math.cos(a + k), Math.sin(a + k), dmg)); } else os(e, ux, uy, dmg); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
  function pas(e, dt) {
    const q = e.osL;
    if (q) { if (pris(e)) { e.osL = null; return; } e.moving = false; e.path = null; e.atkCd = Math.max(e.atkCd, 0.4); e.x = q.x; e.y = q.y; q.t -= dt; if (q.t > 0) return; e.osL = null; e.atkAnim = 1; gerbe(e, q.ux, q.uy, e.dmg * Od.FORCE); e.osCd = rand(Od.CD[0], Od.CD[1]); return; }
    e.osCd = (e.osCd === undefined ? rand(2, 5) : e.osCd) - dt; if (e.osCd > 0 || pris(e) || e.calm) return; const tg = e.target; if (!tg || tg.dead || tg.ko === true || tg.hidden) return;
    const d = dist(e, tg); if (d < Od.PORTEE[0] || d > Od.PORTEE[1] || !W.lineClear(e.x, e.y, tg.x, tg.y)) { e.osCd = 0.4; return; }
    const dx = tg.x - e.x, dy = tg.y - e.y; e.osL = { t: Od.ELAN, x: e.x, y: e.y, ux: dx / d, uy: dy / d }; e.face = dx > 0 ? 1 : -1;
  }
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R, noirs = [];
    if (S && R && R.enemies) for (const e of R.enemies) if (e.osNb === 2 && e.type === 'squeletteNoir' && !e.dead && e.spe && e.spe.k === 'os' && !e.spe.parti) noirs.push([e, e.spe]);
    up0.apply(this, arguments); if (CG.S !== S || CG.R !== R || !S || !R || R.night || R.cine) return;
    for (const q of noirs) { const e = q[0], s = q[1]; if (e.dead || e.spe === s || !(s.t <= 0)) continue; const a = Math.atan2(s.uy, s.ux) + Od.ECART * 1.6; os(e, Math.cos(a), Math.sin(a), e.dmg * 1.3); } /* l'os du squelette noir : un deuxième, juste à côté */
    for (const e of R.enemies) if (e.osNb && !e.dead && e.type !== 'squeletteNoir' && Od.TYPES[e.type]) pas(e, dt);
  };
  // celui qui en lance deux : un peu plus grand, deux os croisés dans le dos ; pendant l'élan, un os levé au-dessus de la tête
  const TAU = Math.PI * 2;
  function unOs(g, x, y, a, l) { g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = '#4a4454'; g.lineWidth = 4.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-l, 0); g.lineTo(l, 0); g.stroke(); g.strokeStyle = '#ece6d6'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-l, 0); g.lineTo(l, 0); g.stroke(); g.fillStyle = '#ece6d6'; [[-l, -1.8], [-l, 1.8], [l, -1.8], [l, 1.8]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 2, 0, TAU); g.fill(); }); g.restore(); }
  const ae = Art.enemy; Art.enemy = function (g, e, t) {
    if (!e.osNb || !Od.TYPES[e.type]) return ae.apply(this, arguments);
    const deux = e.osNb === 2, f = e.face < 0 ? -1 : 1;
    if (deux) { g.save(); g.translate(e.x, e.y); g.scale(Od.TAILLE, Od.TAILLE); g.translate(-e.x, -e.y); unOs(g, e.x - f * 7, e.y - 31, 0.9, 9); unOs(g, e.x - f * 7, e.y - 31, -0.9, 9); }
    try { ae.apply(this, arguments); } finally { if (deux) g.restore(); }
    if (e.osL) { const k = 1 - e.osL.t / Od.ELAN, s = deux ? Od.TAILLE : 1; unOs(g, e.x + f * 9 * s, e.y - (52 + k * 6) * s, -f * (0.5 + k), 7); if (deux) unOs(g, e.x - f * 3 * s, e.y - (55 + k * 6) * s, -f * (0.2 + k), 7); }
  };
})(window.CG);
