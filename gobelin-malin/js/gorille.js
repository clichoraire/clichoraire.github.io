// Goblin Malin — les gorilles (les gros singes noirs) ne font plus que cogner :
//   dès qu'il voit quelqu'un, il se dresse et se tape le torse ; puis il fonce, bien plus vite, pendant quelques secondes ;
//   de loin, il lance des bananes par poignées ; de temps en temps, il lève un baril au-dessus de sa tête et le fait rouler droit devant ;
//   et il marche comme un vrai gorille, penché en avant, sur les poings (dessin dans singes.js).
// Tout est réglable dans CG.Gorille.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Si = CG.Singes, TAU = Math.PI * 2, rand = CG.rand, dist = CG.dist; if (!Si || !Si.info || !Si.lancer) return;
  const Go = CG.Gorille = { TORSE: 1.1, RAGE: [5, 1.6], ENCORE: [11, 16], CD: [2.6, 4], L: [85, 330], RAFALE: [3, 5], ENTRE: 0.17, EPARS: 30, BARIL: 0.3, LEVE: 0.6, BARIL_V: 215, BARIL_T: 2.6, BARIL_DMG: 1.3 };
  /* TORSE : durée du tambour ; RAGE : [secondes, fois plus vite] ; CD : entre deux lancers ; RAFALE : bananes par poignée ; BARIL : chance que ce soit un baril */
  const gorille = e => { const I = Si.info(e.type); return !!I && I.esp === 'gorille'; };
  const libre = e => !(e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.kb || e.retreat);
  function torse(e) { e.gor = { ph: 'torse', t: Go.TORSE, tic: 0 }; e.torseCd = rand(Go.ENCORE[0], Go.ENCORE[1]); e.path = null; G.text(e.x, e.y - 64, 'HOU ! HOU ! HOU !', '#ffd0a0', true); }
  function pas(e, dt) {
    const R = CG.R, S = CG.S; if (e.perche) return; if (e.spd0 === undefined) { e.spd0 = e.spd; e.gorCd = rand(0.6, 1.6); e.torseCd = 0; }
    if (e.gorRage > 0) { e.gorRage -= dt; if (Math.random() < dt * 14) R.parts.push({ x: e.x - (e.face || 1) * 8, y: e.y - 2, vx: rand(-20, 20), vy: rand(-30, -8), life: 0.3, max: 0.3, col: '#b8a888', size: 3 }); } e.spd = e.spd0 * (e.gorRage > 0 ? Go.RAGE[1] : 1);
    const tg = e.target && !e.target.dead && !e.target.hidden && e.target.ko !== true && !(e.target.type && CG.ENEMIES[e.target.type]) && !(e.target === S.player && (R.ko > 0 || R.invis > 0)) ? e.target : null, q = e.gor;
    if (q) { if (!libre(e)) { e.gor = null; return; } e.rooted = Math.max(e.rooted || 0, 0.15); e.atkCd = Math.max(e.atkCd || 0, 0.4); e.moving = false; e.path = null; q.t -= dt; if (tg) e.face = tg.x > e.x ? 1 : -1;
      if (q.ph === 'torse') { q.tic -= dt; if (q.tic <= 0) { q.tic = 0.14; G.puff(e.x + (e.face || 1) * 2, e.y - 22, '#ddd', 2, 50, 2); if (CG.onScreen(e.x, e.y)) CG.sfx('chop'); } if (q.t <= 0) { e.gor = null; e.gorRage = Go.RAGE[0]; } }
      else if (q.ph === 'rafale') { q.tic -= dt; if (q.tic <= 0 && q.n > 0) { q.n--; q.tic = Go.ENTRE; const c = tg || q.tg; if (c) Si.lancer(e, { x: c.x + rand(-Go.EPARS, Go.EPARS), y: c.y + rand(-Go.EPARS, Go.EPARS) }, false); } if (q.n <= 0 && q.tic <= 0) e.gor = null; }
      else if (q.ph === 'baril' && q.t <= 0) { e.gor = null; const c = tg || q.tg, d = c ? dist(e, c) || 1 : 1, ux = c ? (c.x - e.x) / d : (e.face || 1), uy = c ? (c.y - e.y) / d : 0; e.atkAnim = 1;
        (R.gorBarils = R.gorBarils || []).push({ x: e.x + ux * 18, y: e.y + uy * 18, vx: ux * Go.BARIL_V, vy: uy * Go.BARIL_V, t: Go.BARIL_T, a: 0, dmg: e.dmg * Go.BARIL_DMG, vus: new Set() }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
      return; }
    if (!tg || !libre(e)) return;
    if (!e.gorVu) { e.gorVu = true; return torse(e); }
    e.torseCd -= dt; if (e.torseCd <= 0 && !(e.gorRage > 0)) return torse(e);
    e.gorCd -= dt; if (e.gorCd > 0) return; const d = dist(e, tg); if (d < Go.L[0] || d > Go.L[1] || !W.lineClear(e.x, e.y, tg.x, tg.y)) return;
    e.gorCd = rand(Go.CD[0], Go.CD[1]); e.face = tg.x > e.x ? 1 : -1;
    if (Math.random() < Go.BARIL) e.gor = { ph: 'baril', t: Go.LEVE, tg }; else e.gor = { ph: 'rafale', n: CG.irand ? CG.irand(Go.RAFALE[0], Go.RAFALE[1]) : 4, tic: 0.1, t: 0, tg };
  }
  function casse(b) { b.t = 0; G.puff(b.x, b.y - 10, '#8a5a2a', 16, 150, 4); G.puff(b.x, b.y - 10, '#e8dcc0', 6, 90, 3); if (CG.onScreen(b.x, b.y)) CG.sfx('chop'); }
  function barils(R, dt) {
    const S = CG.S, p = S.player, L = R.gorBarils; if (!L || !L.length) return;
    for (const b of L) { b.x += b.vx * dt; b.y += b.vy * dt; b.a += dt * 11 * (b.vx >= 0 ? 1 : -1); b.t -= dt; if (b.t <= 0) { casse(b); continue; }
      if (!W.walkPx(b.x, b.y)) { casse(b); continue; }
      if (!(R.ko > 0) && Math.hypot(p.x - b.x, p.y - b.y) < 21) { G.hurtPlayer(b.dmg); const l = Math.hypot(b.vx, b.vy) || 1; for (let i = 0; i < 5; i++) G.slide(p, b.vx / l * 9, b.vy / l * 9); G.text(p.x, p.y - 74, '💥 Un baril !', '#ff9a8a', true); casse(b); continue; }
      for (const o of S.goblins.concat(S.pets)) { if (o.hidden || o.ko || o.dead || b.vus.has(o) || Math.hypot(o.x - b.x, o.y - b.y) > 19) continue; b.vus.add(o); if (S.pets.includes(o)) CG.P.hurt(o, b.dmg * 0.7); else G.hurtGoblin(o, b.dmg * 0.7); } }
    R.gorBarils = L.filter(b => b.t > 0);
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !CG.S || !R.enemies || R.night || R.cine) return;
    for (const e of R.enemies) if (!e.dead && gorille(e)) pas(e, dt); barils(R, dt);
  };
  // ---------- dessin : le baril qui roule, et celui qu'il tient au-dessus de sa tête ----------
  function baril(g, x, y, a, s) { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.fillStyle = '#6a4722'; g.beginPath(); g.ellipse(0, 0, 13, 11, 0, 0, TAU); g.fill(); g.fillStyle = '#8e6638'; g.beginPath(); g.ellipse(-1, -1, 11, 9, 0, 0, TAU); g.fill();
    g.strokeStyle = '#4a4a50'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-6, -9.4); g.lineTo(-6, 9.4); g.moveTo(6, -9.4); g.lineTo(6, 9.4); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.stroke(); g.restore(); }
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const R = CG.R; if (!R || !R.gorBarils) return; for (const b of R.gorBarils) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(b.x, b.y + 3, 13, 5, 0, 0, TAU); g.fill(); } };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const b of R.gorBarils || []) baril(g, b.x, b.y - 11 - Math.abs(Math.sin(b.a * 0.5)) * 4, b.a, 1);
    if (R.enemies) for (const e of R.enemies) { const q = e.gor; if (!q || q.ph !== 'baril' || e.dead || !CG.onScreen(e.x, e.y)) continue; const I = Si.info(e.type), k = 1 - Math.max(0, q.t) / Go.LEVE; baril(g, e.x, e.y - (26 + 22 * Math.min(1, k * 1.6)) * I.taille, 0, 1.05); }
  };
})(window.CG);
