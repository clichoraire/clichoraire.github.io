// Goblin Malin — les pouvoirs de la reine des araignées (le gros de la clairière aux toiles).
//   La boule de toile : elle crache une boule de soie qui retombe sur le chef ou tout près ; là où elle tombe, une toile s'étale au sol
//     et ralentit quiconque marche dedans (sauf les araignées). Un cercle l'annonce. Le mur de feu brûle ces toiles.
//   La couvée : à deux tiers puis à un tiers de sa vie, elle appelle une poignée de bébés araignées.
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2, rand = CG.rand;
  const Re = CG.Reine = { DELAI: [3.5, 5.5], VOL: 0.85, PORTEE: 420, ECART: 46, RAYON: 60, DUREE: 14, MAX: 6, LENT: 0.5, COUVEE: 3, SEUILS: [0.66, 0.33] };
  const reine = e => e.grosArene && e.type === 'araignee' && !e.dead;
  const dans = (x, y) => { const R = CG.R; if (!R || !R.toiles) return false; for (const w of R.toiles) { const dx = (x - w.x) / w.r, dy = (y - w.y) / (w.r * 0.62); if (dx * dx + dy * dy < 1) return true; } return false; };
  Re.dans = dans;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night || R.cine) return; const p = S.player;
    const T = R.toiles || (R.toiles = []), B = R.boules || (R.boules = []);
    for (const e of R.enemies) {
      if (!reine(e)) continue; if (e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0) continue;
      e.toileCd = (e.toileCd === undefined ? rand(1.5, 3) : e.toileCd) - dt; const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (e.toileCd <= 0) { if (R.ko > 0 || d > Re.PORTEE) e.toileCd = 0.5; else { e.toileCd = rand(Re.DELAI[0], Re.DELAI[1]); e.atkAnim = 1; const a = Math.random() * TAU, k = Math.random() < 0.5 ? 0 : Math.random() * Re.ECART; // une fois sur deux en plein sur le chef
        B.push({ x0: e.x, y0: e.y - 26, tx: p.x + Math.cos(a) * k, ty: p.y + Math.sin(a) * k * 0.7, t: 0 }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } }
      e.couvee = e.couvee || 0; if (e.couvee < Re.SEUILS.length && e.hp < e.maxhp * Re.SEUILS[e.couvee]) { e.couvee++; G.text(e.x, e.y - 70, '🕷️ La reine appelle sa couvée !', '#e9ecdc', true); G.puff(e.x, e.y - 10, '#e9ecdc', 18, 130, 4); if (CG.onScreen(e.x, e.y)) CG.sfx('warning');
        for (let i = 0; i < Re.COUVEE; i++) { const q = G.spawnEnemy('araignee', e.x + rand(-40, 40), e.y + rand(-26, 26), { wild: true, exact: true }); if (!q) continue; q.hp = q.maxhp = Math.max(4, Math.round(q.maxhp * 0.45)); q.dmg *= 0.5; q.petite = 0.5; q.r = Math.max(6, Math.round(q.r * 0.6)); q.seen = true; q.target = p; if (G.unstick) G.unstick(q, 8); } }
    }
    for (const b of B) { b.t += dt; if (b.t < Re.VOL) continue; b.fini = true; T.push({ x: b.tx, y: b.ty, r: Re.RAYON, t: Re.DUREE, rot: Math.random() * TAU }); if (T.length > Re.MAX) T.shift();
      G.puff(b.tx, b.ty - 4, '#f2f4ea', 14, 110, 3); R.rings.push({ x: b.tx, y: b.ty, r: Re.RAYON, life: 0.35, col: '#f2f4ea' }); if (CG.onScreen(b.tx, b.ty)) CG.sfx('hit');
      if (!(R.ko > 0) && dans(p.x, p.y)) G.text(p.x, p.y - 70, '🕸️ Englué !', '#e9ecdc', true); }
    if (B.length) R.boules = B.filter(b => !b.fini);
    if (T.length) { for (const w of T) { w.t -= dt; if (R.walls) for (const m of R.walls) { const vx = m.x2 - m.x1, vy = m.y2 - m.y1, k = Math.max(0, Math.min(1, ((w.x - m.x1) * vx + (w.y - m.y1) * vy) / (vx * vx + vy * vy || 1))); if (Math.hypot(w.x - (m.x1 + vx * k), w.y - (m.y1 + vy * k)) < w.r * 0.8) { w.t = 0; G.puff(w.x, w.y - 6, '#ff8a1e', 14, 110, 4); G.puff(w.x, w.y - 10, '#777', 6, 60, 3); } } } R.toiles = T.filter(w => w.t > 0); }
  };
  const hm0 = G.heroMul; G.heroMul = function () { const p = CG.S && CG.S.player, R = CG.R; return hm0.apply(this, arguments) * (p && R && !R.mount && dans(p.x, p.y) ? Re.LENT : 1); };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'toileReine', ic: '🕸️', mal: true, nom: 'Englué', txt: 'Tu marches dans la toile de la reine : tu avances deux fois moins vite. Sors-en, ou brûle-la avec un mur de feu.', t: () => { const p = CG.S && CG.S.player; return p && dans(p.x, p.y) ? 1 : 0; } });
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const w of R.toiles || []) { if (!CG.onScreen(w.x, w.y)) continue; g.save(); g.translate(w.x, w.y); g.scale(1, 0.62); g.rotate(w.rot); g.globalAlpha = Math.min(0.8, w.t * 0.8); g.fillStyle = 'rgba(240,244,234,0.13)'; g.beginPath(); g.arc(0, 0, w.r, 0, TAU); g.fill();
      g.strokeStyle = '#eef0e6'; g.lineWidth = 1.1; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; g.moveTo(0, 0); g.lineTo(Math.cos(a) * w.r, Math.sin(a) * w.r); } for (let k = 1; k <= 4; k++) { const r = w.r * k / 4; for (let i = 0; i <= 9; i++) { const a = i / 9 * TAU, x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) { const a0 = (i - 0.5) / 9 * TAU; g.quadraticCurveTo(Math.cos(a0) * r * 0.84, Math.sin(a0) * r * 0.84, x, y); } else g.moveTo(x, y); } } g.stroke(); g.restore(); }
    for (const b of R.boules || []) { const k = b.t / Re.VOL; g.save(); g.globalAlpha = 0.14 + k * 0.28; g.fillStyle = '#f2f4ea'; g.beginPath(); g.ellipse(b.tx, b.ty, Re.RAYON, Re.RAYON * 0.62, 0, 0, TAU); g.fill(); g.globalAlpha = 0.85; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.ellipse(b.tx, b.ty, Re.RAYON * k, Re.RAYON * 0.62 * k, 0, 0, TAU); g.stroke(); g.restore(); }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const b of R.boules || []) { const k = Math.min(1, b.t / Re.VOL), x = b.x0 + (b.tx - b.x0) * k, y = b.y0 + (b.ty - b.y0) * k - Math.sin(k * Math.PI) * 80; g.fillStyle = '#f2f4ea'; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); g.strokeStyle = 'rgba(160,170,150,0.9)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 3; i++) { const a = b.t * 9 + i * 2.1; g.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); g.lineTo(x - Math.cos(a) * 8, y - Math.sin(a) * 8); } g.stroke(); g.strokeStyle = 'rgba(240,244,234,0.5)'; g.beginPath(); g.moveTo(x, y); g.lineTo(b.x0 + (b.tx - b.x0) * Math.max(0, k - 0.18), b.y0 + (b.ty - b.y0) * Math.max(0, k - 0.18) - Math.sin(Math.max(0, k - 0.18) * Math.PI) * 80); g.stroke(); }
  };
})(window.CG);
