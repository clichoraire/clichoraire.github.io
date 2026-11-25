// Goblin Malin — le chevalier se bat à l'estoc. En plus de ses coups ordinaires, il a deux bottes, qu'il alterne :
//   la fente   : de loin (jusqu'à PORTEE), il se fend d'un bond et pique tout droit, la pointe en avant ;
//   la rafale  : de près, trois piqûres très rapides coup sur coup.
// Les deux se voient venir un court instant (un trait pâle au sol) : un pas de côté suffit. Tout est réglable dans CG.Estoc.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, rand = CG.rand, dist = CG.dist, TAU = Math.PI * 2;
  const Et = CG.Estoc = { TYPES: ['chevalier'], REPOS: [1.6, 2.8], PORTEE: [70, 160], BOND: 90, ALLONGE: 70, LARGE: 17, VISE: 0.38, DMG: 1.25,
    RAFALE_PRES: 95, RAFALE_N: 3, RAFALE_ENTRE: 0.2, RAFALE_VISE: 0.3, RAFALE_ALLONGE: 74, RAFALE_DMG: 0.55 };
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.retreat || e.rooted > 0 || e.calm;
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && !g.dead && g.ko !== true) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); return l; };
  const frappe = (o, dmg) => { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); };
  // la pointe part de (x, y) dans la direction (ux, uy) sur « l » pixels : tout ce qui est sur le trait est piqué
  function pique(e, x, y, ux, uy, l, dmg) {
    const R = CG.R; for (const o of nous()) { const dx = o.x - x, dy = o.y - y, u = dx * ux + dy * uy, v = Math.abs(dx * uy - dy * ux); if (u > -6 && u < l + 8 && v < Et.LARGE) frappe(o, dmg); }
    (R.estocs = R.estocs || []).push({ x, y: y - 22, ux, uy, l, t: 0.16, max: 0.16 }); e.atkAnim = 1; e.face = ux > 0 ? 1 : -1; if (CG.onScreen(x, y)) CG.sfx('swing');
  }
  function viser(e, s) { const tg = e.target; if (tg && !tg.dead) { const dx = tg.x - e.x, dy = tg.y - e.y, l = Math.hypot(dx, dy) || 1; s.ux = dx / l; s.uy = dy / l; e.face = dx > 0 ? 1 : -1; } }
  function pas(e, dt) {
    if (pris(e)) { e.estoc = null; return; }
    const s = e.estoc;
    if (!s) {
      e.estocCd = (e.estocCd === undefined ? rand(1, 2.2) : e.estocCd) - dt; const tg = e.target; if (e.estocCd > 0 || !tg || tg.dead || tg.hidden || !nous().includes(tg)) return; const d = dist(e, tg); /* jamais contre un mur ou une hutte : seulement contre le chef, un gobelin ou un animal */
      if (!W.lineClear(e.x, e.y, tg.x, tg.y)) return;
      if (d < Et.RAFALE_PRES && (e.estocAlt = !e.estocAlt)) e.estoc = { k: 'rafale', t: Et.RAFALE_VISE, max: Et.RAFALE_VISE, n: Et.RAFALE_N };
      else if (d >= Et.PORTEE[0] && d <= Et.PORTEE[1]) e.estoc = { k: 'fente', t: Et.VISE, max: Et.VISE };
      else if (d < Et.PORTEE[0]) e.estoc = { k: 'rafale', t: Et.RAFALE_VISE, max: Et.RAFALE_VISE, n: Et.RAFALE_N };
      else return;
      const n = e.estoc; n.x = e.x; n.y = e.y; viser(e, n); if (n.ux === undefined) { e.estoc = null; return; } e.path = null; return;
    }
    e.x = s.x; e.y = s.y; e.moving = false; e.atkCd = Math.max(e.atkCd || 0, 0.45); s.t -= dt; if (s.t > 0) return;
    if (s.k === 'fente') { // il se fend : un bond tout droit, puis la pointe
      const pasN = 7; for (let i = 0; i < pasN; i++) if (!G.slide(e, s.ux * Et.BOND / pasN, s.uy * Et.BOND / pasN, 9)) break;
      CG.R.parts.push({ x: s.x, y: s.y - 6, vx: -s.ux * 40, vy: -20, life: 0.3, max: 0.3, col: '#d8d0c0', size: 4, float: true });
      pique(e, s.x, s.y, s.ux, s.uy, Math.hypot(e.x - s.x, e.y - s.y) + Et.ALLONGE, e.dmg * Et.DMG); e.estoc = null; e.estocCd = rand(Et.REPOS[0], Et.REPOS[1]); return;
    }
    pique(e, e.x, e.y, s.ux, s.uy, Et.RAFALE_ALLONGE, e.dmg * Et.RAFALE_DMG); s.n--; /* la rafale : il suit sa cible entre deux piqûres */
    if (s.n > 0) { s.t = Et.RAFALE_ENTRE; s.max = Et.RAFALE_ENTRE; s.suite = true; viser(e, s); return; }
    e.estoc = null; e.estocCd = rand(Et.REPOS[0], Et.REPOS[1]);
  }
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S || !R.enemies) return r;
    for (const e of R.enemies) if (!e.dead && Et.TYPES.includes(e.type)) pas(e, dt);
    if (R.estocs && R.estocs.length) { for (const q of R.estocs) q.t -= dt; R.estocs = R.estocs.filter(q => q.t > 0); }
    return r;
  };
  // les alliés qui savent esquiver les charges s'écartent du trait
  if (CG.Esquive && CG.Esquive.SOURCES) CG.Esquive.SOURCES.push(R => R.enemies.filter(e => !e.dead && e.estoc && !e.estoc.suite && !(e.charm > 0)).map(e => { const s = e.estoc, l = s.k === 'fente' ? Et.BOND + Et.ALLONGE : Et.RAFALE_ALLONGE; return { x: s.x, y: s.y, x2: s.x + s.ux * l, y2: s.y + s.uy * l, w: Et.LARGE * 2, ty: 'charge', cle: s }; }));
  // ---------- ce qu'on voit : le trait au sol pendant qu'il vise, puis l'éclair de la lame ----------
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const R = CG.R; if (!R || !R.enemies) return;
    for (const e of R.enemies) { const s = e.estoc; if (!s || e.dead || s.suite || !CG.onScreen(e.x, e.y)) continue; const k = 1 - Math.max(0, s.t) / s.max, l = s.k === 'fente' ? Et.BOND + Et.ALLONGE : Et.RAFALE_ALLONGE;
      g.save(); g.globalAlpha = 0.18 + k * 0.42; g.strokeStyle = '#e8ecf8'; g.lineWidth = 3 + k * 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(e.x + s.ux * 12, e.y + s.uy * 12); g.lineTo(e.x + s.ux * l * (0.35 + k * 0.65), e.y + s.uy * l * (0.35 + k * 0.65)); g.stroke(); g.restore(); } }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const L = CG.R && CG.R.estocs; if (!L || !L.length) return;
    for (const q of L) { const k = q.t / q.max, x2 = q.x + q.ux * q.l, y2 = q.y + q.uy * q.l, nx = -q.uy, ny = q.ux; g.save(); g.globalAlpha = Math.min(1, k * 1.4);
      g.fillStyle = 'rgba(200,220,255,0.55)'; g.beginPath(); g.moveTo(q.x + nx * 5, q.y + ny * 5); g.lineTo(x2, y2); g.lineTo(q.x - nx * 5, q.y - ny * 5); g.closePath(); g.fill(); /* le sillage, en fuseau */
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(q.x + nx * 1.8, q.y + ny * 1.8); g.lineTo(x2 + q.ux * 6, y2 + q.uy * 6); g.lineTo(q.x - nx * 1.8, q.y - ny * 1.8); g.closePath(); g.fill(); /* la lame */
      g.beginPath(); g.arc(x2, y2, 3 + (1 - k) * 5, 0, TAU); g.fillStyle = 'rgba(255,255,255,' + (0.7 * k).toFixed(2) + ')'; g.fill(); g.restore(); } }; }
})(window.CG);
