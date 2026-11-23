// Goblin Malin — les araignées qui tirent des boules de toile.
//   Une partie des araignées géantes (pas les bébés, pas la reine, qui a son propre tir) crache une boule de toile droit sur le chef.
//   Plus l'araignée est forte, plus elle tire souvent. Si la boule attrape le chef : il ne peut plus bouger pendant PRIS seconde(s).
//   Dans tous les cas, une toile reste par terre là où la boule finit (elle ralentit, comme celles de la reine ; le mur de feu la brûle).
//   La boule ne blesse pas : on peut l'esquiver en s'écartant. Tout se règle dans CG.ToileTir.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, TAU = Math.PI * 2, rand = CG.rand;
  const Tt = CG.ToileTir = { PART: 0.45, DELAI: [5.5, 2.2], /* du plus faible au plus fort */ FORT: [20, 100], /* la vie d'une araignée faible, et celle d'une très forte */
    PORTEE: [90, 360], VITESSE: 270, VOL: 1.5, TOUCHE: 17, PRIS: 1, TOILE: { r: 42, t: 9 }, MAX: 10, VISE: 0.45 };
  const tireuse = e => { if (e.type !== 'araignee' || e.petite || e.grosArene || e.struct) return false; if (e.tireuse === undefined) e.tireuse = Math.random() < Tt.PART; return e.tireuse; };
  Tt.delai = e => { const k = CG.clamp(((e.maxhp || 20) - Tt.FORT[0]) / (Tt.FORT[1] - Tt.FORT[0]), 0, 1); return Tt.DELAI[0] + (Tt.DELAI[1] - Tt.DELAI[0]) * k; };
  Tt.pris = () => !!(CG.R && CG.R.toilePris > CG.R.t);
  function poser(x, y) { const R = CG.R, T = R.toiles || (R.toiles = []); if (!W.walkPx(x, y)) return; T.push({ x, y, r: Tt.TOILE.r, t: Tt.TOILE.t, rot: Math.random() * TAU }); while (T.length > Tt.MAX) T.shift(); G.puff(x, y - 4, '#f2f4ea', 10, 90, 3); }
  const up0 = G.update; G.update = function (dt) {
    const r0 = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !R.enemies || R.night || R.cine) return r0; const p = S.player, B = R.tirsToile || (R.tirsToile = []);
    for (const e of R.enemies) { if (e.dead || !tireuse(e)) continue; if (e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.rooted > 0 || e.calm) continue;
      e.ttCd = (e.ttCd === undefined ? rand(1, 2.5) : e.ttCd) - dt; if (e.ttCd > 0) continue;
      const dx = p.x - e.x, dy = (p.y - 14) - (e.y - 12), d = Math.hypot(dx, dy);
      if (R.ko > 0 || R.invis > 0 || d < Tt.PORTEE[0] || d > Tt.PORTEE[1] || (W.lineClear && !W.lineClear(e.x, e.y, p.x, p.y))) { e.ttCd = 0.5; continue; }
      e.ttCd = Tt.delai(e) * rand(0.85, 1.15); e.atkAnim = 1; e.face = dx > 0 ? 1 : -1;
      const vise = p.moving ? Tt.VISE : 0, tx = dx + (R.dir ? R.dir.x : 0) * vise * 60, ty = dy + (R.dir ? R.dir.y : 0) * vise * 60, L = Math.hypot(tx, ty) || 1; /* elle vise un peu devant un chef qui court */
      B.push({ x: e.x, y: e.y - 12, vx: tx / L * Tt.VITESSE, vy: ty / L * Tt.VITESSE, t: Tt.VOL, x0: e.x, y0: e.y - 12, rot: 0 }); G.puff(e.x, e.y - 12, '#f2f4ea', 5, 60, 2); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
    for (const b of B) { b.x += b.vx * dt; b.y += b.vy * dt; b.t -= dt; b.rot += dt * 10;
      if (!(R.ko > 0) && Math.hypot(b.x - p.x, b.y - (p.y - 14)) < Tt.TOUCHE) { b.t = 0; b.fini = true; poser(p.x, p.y + 2); R.toilePris = R.t + Tt.PRIS; p.path = null; if (R.ruee) R.ruee = null; G.text(p.x, p.y - 70, '🕸️ Attrapé !', '#e9ecdc', true); R.rings.push({ x: p.x, y: p.y - 8, r: 34, life: 0.3, col: '#f2f4ea' }); CG.sfx('hit'); continue; }
      if (b.t <= 0 || !W.walkPx(b.x, b.y + 12)) { if (!b.fini) { b.fini = true; poser(b.x - b.vx * dt, b.y + 12 - b.vy * dt); } b.t = 0; } }
    if (B.length) R.tirsToile = B.filter(b => b.t > 0);
    return r0;
  };
  // pris dans la toile : le chef ne bouge plus (il peut encore frapper et lancer des sorts)
  { const hm0 = G.heroMul; G.heroMul = function () { return Tt.pris() ? 0 : hm0.apply(this, arguments); }; }
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.push({ k: 'toilePris', ic: '🕸️', mal: true, nom: 'Attrapé', txt: 'Une boule de toile t\'a eu : tu ne peux plus bouger un instant.', t: () => (Tt.pris() ? CG.R.toilePris - CG.R.t : 0) });
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const b of R.tirsToile || []) { if (!CG.onScreen(b.x, b.y)) continue; g.strokeStyle = 'rgba(240,244,234,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x - b.vx * 0.09, b.y - b.vy * 0.09); g.stroke();
      g.fillStyle = '#f2f4ea'; g.beginPath(); g.arc(b.x, b.y, 6.5, 0, TAU); g.fill(); g.strokeStyle = 'rgba(160,170,150,0.9)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 3; i++) { const a = b.rot + i * 2.1; g.moveTo(b.x + Math.cos(a) * 6.5, b.y + Math.sin(a) * 6.5); g.lineTo(b.x - Math.cos(a) * 6.5, b.y - Math.sin(a) * 6.5); } g.stroke(); }
    if (Tt.pris()) { const p = CG.S.player, k = (R.toilePris - R.t) / Tt.PRIS; g.save(); g.globalAlpha = 0.5 + 0.4 * k; g.strokeStyle = '#f2f4ea'; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; g.moveTo(p.x, p.y - 16); g.lineTo(p.x + Math.cos(a) * 20, p.y - 16 + Math.sin(a) * 22); } g.stroke(); g.beginPath(); g.ellipse(p.x, p.y - 16, 13, 15, 0, 0, TAU); g.stroke(); g.restore(); } }; }
})(window.CG);
