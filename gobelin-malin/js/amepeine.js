// Goblin Malin — les deux tours de l'âme en peine (la grande ombre à capuche du cimetière et de la crypte). Elle reste lente
// et solide, mais elle ne fait plus que se promener :
//   1) Mains d'ombre : une tache noire s'étale sous sa cible ; un instant plus tard, des mains en sortent et griffent
//      tout ce qui est resté dessus. On l'évite en sortant de la tache.
//   2) Feux follets des morts : trois petites flammes mauves quittent sa capuche et dérivent lentement vers sa cible.
//      Elles suivent mal : un pas de côté suffit. Elles s'éteignent toutes seules.
// Rien de bien méchant : c'est un tank. Tout se règle dans CG.AmePeine.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, rand = CG.rand, dist = CG.dist, TAU = Math.PI * 2;
  if (!CG.ENEMIES.wraith || !CG.Magie) return;
  const Ap = CG.AmePeine = { TYPE: 'wraith', REPOS: [4.5, 6.5], PORTEE: 300,
    MAINS: { R: 44, ATTENTE: 1, DMG: 0.7, RESTE: 0.5 },
    FEUX: { NB: 3, VIT: 78, TOURNE: 1.5, VIE: 4.2, R: 13, DMG: 0.4 } };
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.retreat || e.calm || e.rooted > 0;
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && !g.dead && g.ko !== true && !g.perch) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); return l; };
  const mal = (o, dmg) => { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); };
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S || !R.enemies) return r;
    for (const e of R.enemies) { if (e.dead || e.type !== Ap.TYPE || pris(e)) continue;
      e.apCd = (e.apCd === undefined ? rand(1.5, 3) : e.apCd) - dt; const tg = e.target; if (e.apCd > 0 || !tg || tg.dead || tg.hidden || tg.x === undefined || dist(e, tg) > Ap.PORTEE) continue;
      e.apCd = rand(Ap.REPOS[0], Ap.REPOS[1]); e.atkAnim = 1; e.face = tg.x > e.x ? 1 : -1; e.apTour = !e.apTour;
      if (e.apTour) { (R.mainsOmbre = R.mainsOmbre || []).push({ x: tg.x, y: tg.y, t: 0, dmg: e.dmg * Ap.MAINS.DMG, s: Math.random() * 10, fait: false }); if (CG.onScreen(tg.x, tg.y)) CG.sfx('spell'); }
      else { const F = Ap.FEUX, a0 = Math.atan2(tg.y - e.y, tg.x - e.x); for (let i = 0; i < F.NB; i++) { const a = a0 + (i - (F.NB - 1) / 2) * 0.75; (R.feuxMorts = R.feuxMorts || []).push({ x: e.x, y: e.y - 30, a, tg, t: 0, dmg: e.dmg * F.DMG, s: Math.random() * 10, de: e }); } if (CG.onScreen(e.x, e.y)) CG.sfx('spell'); } }
    const M = R.mainsOmbre; if (M && M.length) { for (const m of M) { m.t += dt; if (m.fait || m.t < Ap.MAINS.ATTENTE) continue; m.fait = true;
        for (const o of nous()) if (Math.hypot(o.x - m.x, (o.y - m.y) / 0.7) < Ap.MAINS.R) mal(o, m.dmg);
        if (CG.onScreen(m.x, m.y)) { G.puff(m.x, m.y - 10, '#6a3aa8', 12, 110, 4); CG.sfx('hit'); } }
      R.mainsOmbre = M.filter(m => m.t < Ap.MAINS.ATTENTE + Ap.MAINS.RESTE); }
    const L = R.feuxMorts; if (L && L.length) { const F = Ap.FEUX; let N = null;
      for (const f of L) { f.t += dt; const tg = f.tg; if (tg && !tg.dead && !tg.hidden) { let d = Math.atan2(tg.y - 16 - f.y, tg.x - f.x) - f.a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; const m = F.TOURNE * dt; f.a += Math.max(-m, Math.min(m, d)); }
        f.x += Math.cos(f.a) * F.VIT * dt; f.y += Math.sin(f.a) * F.VIT * dt; if (f.t < 0.35) continue; N = N || nous();
        for (const o of N) if (Math.hypot(o.x - f.x, o.y - 16 - f.y) < F.R + 8) { mal(o, f.dmg); f.t = 99; if (CG.onScreen(f.x, f.y)) G.puff(f.x, f.y, '#b070ff', 8, 90, 3); break; } }
      R.feuxMorts = L.filter(f => f.t < F.VIE && !(f.de && f.de.dead && f.t < 0)); }
    return r;
  };
  // les alliés qui savent éviter les cercles sortent de la tache
  if (CG.Esquive && CG.Esquive.SOURCES) CG.Esquive.SOURCES.push(R => (R.mainsOmbre || []).filter(m => !m.fait).map(m => ({ x: m.x, y: m.y, r: Ap.MAINS.R, ty: 'cercle', cle: m })));
  // ---------- dessins ----------
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (c, t) {
    gr0.apply(this, arguments); const R = CG.R, M = R && R.mainsOmbre; if (!M || !M.length) return;
    for (const m of M) { if (!CG.onScreen(m.x, m.y)) continue; const k = Math.min(1, m.t / Ap.MAINS.ATTENTE), fin = m.fait ? 1 - (m.t - Ap.MAINS.ATTENTE) / Ap.MAINS.RESTE : 1, r = Ap.MAINS.R * (0.3 + 0.7 * Math.min(1, m.t / 0.35));
      c.save(); c.translate(m.x, m.y); c.scale(1, 0.7); c.globalAlpha = Math.max(0, fin);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(14,6,26,0.86)'); g.addColorStop(0.75, 'rgba(40,16,70,0.62)'); g.addColorStop(1, 'rgba(90,40,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(190,120,255,' + (0.35 + 0.5 * k) + ')'; c.lineWidth = 2.2; c.setLineDash([7, 6]); c.lineDashOffset = -t * 30; c.beginPath(); c.arc(0, 0, r * 0.94, 0, TAU); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(230,190,255,' + 0.8 * k + ')'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * 0.94, -Math.PI / 2, -Math.PI / 2 + k * TAU); c.stroke(); // le tour qui se ferme : c'est le compte à rebours
      c.restore(); }
  };
  function main(c, x, y, h, s, penche) { // une main d'ombre qui sort du sol : un bras, une paume, quatre doigts crochus
    c.save(); c.translate(x, y); c.rotate(penche); c.fillStyle = '#1c0e30'; c.beginPath(); c.moveTo(-3.4 * s, 0); c.lineTo(-2.6 * s, -h); c.lineTo(2.6 * s, -h); c.lineTo(3.4 * s, 0); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, -h - 2 * s, 5 * s, 4.4 * s, 0, 0, TAU); c.fill(); c.strokeStyle = '#1c0e30'; c.lineWidth = 2 * s; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.42; c.beginPath(); c.moveTo(Math.cos(a) * 4 * s, -h - 2 * s + Math.sin(a) * 4 * s); c.quadraticCurveTo(Math.cos(a) * 9 * s, -h - 2 * s + Math.sin(a) * 10 * s, Math.cos(a) * 7 * s + 2 * s, -h - 2 * s + Math.sin(a) * 7 * s + 4 * s); c.stroke(); }
    c.strokeStyle = 'rgba(180,110,255,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-2 * s, -h * 0.2); c.lineTo(-1.6 * s, -h * 0.9); c.stroke(); c.restore(); }
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (c, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const m of R.mainsOmbre || []) { if (!m.fait || !CG.onScreen(m.x, m.y)) continue; const u = (m.t - Ap.MAINS.ATTENTE) / Ap.MAINS.RESTE, h = Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5) * 26 * (u > 0.7 ? (1 - u) / 0.3 : 1);
      for (let i = 0; i < 5; i++) { const a = m.s + i / 5 * TAU, d = i ? Ap.MAINS.R * 0.55 : 0; main(c, m.x + Math.cos(a) * d, m.y + Math.sin(a) * d * 0.7, h * (i ? 0.8 : 1.15), i ? 0.9 : 1.2, Math.sin(m.s * 3 + i) * 0.25); } }
    for (const f of R.feuxMorts || []) { if (!CG.onScreen(f.x, f.y)) continue; const F = Ap.FEUX, a = Math.min(1, f.t / 0.3) * Math.min(1, (F.VIE - f.t) / 0.6), w = Math.sin(t * 9 + f.s) * 1.6; if (a <= 0) continue;
      c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(150,80,255,0.28)'; c.beginPath(); c.arc(f.x, f.y, F.R + 5, 0, TAU); c.fill();
      c.fillStyle = '#8a4ae0'; c.beginPath(); c.moveTo(f.x - 7, f.y + 5); c.quadraticCurveTo(f.x - 9, f.y - 6, f.x + w - Math.cos(f.a) * 6, f.y - 15); c.quadraticCurveTo(f.x + 9, f.y - 6, f.x + 7, f.y + 5); c.quadraticCurveTo(f.x, f.y + 10, f.x - 7, f.y + 5); c.fill();
      c.fillStyle = '#e8d0ff'; c.beginPath(); c.arc(f.x, f.y + 1, 4.4, 0, TAU); c.fill(); c.fillStyle = '#1c0e30'; c.beginPath(); c.arc(f.x - 1.6, f.y, 1.1, 0, TAU); c.arc(f.x + 1.6, f.y, 1.1, 0, TAU); c.fill(); c.restore(); }
  };
})(window.CG);
