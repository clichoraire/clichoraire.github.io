// Goblin Malin — le sort Résurrection marche aussi sur les pierres tombales des cimetières de la forêt.
//   Près d'une vieille tombe, lancer Résurrection (ou E, si on connaît le sort) en fait sortir un squelette qui se bat pour nous :
//   une tombe = un squelette, une fois par jour. Il est un peu plus fort qu'un squelette ordinaire, il suit le chef, cogne les
//   monstres et leur lance des os. Il reste jusqu'à ce qu'il tombe (ou jusqu'au lendemain). Tout se règle dans CG.TombesLeve.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, So = CG.Sorts2;
  const Tl = CG.TombesLeve = { SUIT: { loin: 130, k: 2.6, saut: 760 }, /* loin du chef, il court pour le rattraper ; trop loin, il réapparaît près de lui */ MANA: 20, PRES: 62, MAX: 6, VIE: 1.5, DMG: 1.4, OS: { CD: [2, 3], PORTEE: 250, MIN: 50, V: 330, DMG: 0.8 } };
  const centre = n => ({ x: n.x * T + T / 2, y: n.y * T + T / 2 });
  const sait = () => { const p = CG.S.player; return p.spells.some(id => id === 'resurrection' || /^resurrection_/.test(id)); };
  const releves = () => CG.R.enemies.filter(e => e.releve && !e.dead);
  function tombePres() { const S = CG.S, p = S.player; if (!W.nodes) return null; let best = null, bd = Tl.PRES; for (const n of W.nodes) { if (n.type !== 'tomb' || n.leve === S.day) continue; const q = centre(n), d = Math.hypot(q.x - p.x, q.y + 8 - p.y); if (d < bd) { bd = d; best = n; } } return best; }
  Tl.lever = function (n) {
    const S = CG.S, R = CG.R, p = S.player, q = centre(n); if (R.castCd > 0 || R.ko > 0 || R.cine) return false;
    if (releves().length >= Tl.MAX) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Tu as déjà assez de squelettes', '#d8c8ff'); return false; }
    if (p.mp < Tl.MANA) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana (' + Tl.MANA + ')', '#9ad0ff'); return false; }
    let x = q.x, y = q.y + 26; if (!W.walkPx(x, y)) { x = p.x + (q.x > p.x ? 26 : -26); y = p.y; }
    const e = G.spawnEnemy('squelette', x, y, { exact: true }); if (!e) return false;
    p.mp -= Tl.MANA; R.castCd = 0.8; R.castAnim = 1; n.leve = S.day;
    e.hp = e.maxhp = Math.round(e.hp * Tl.VIE); e.dmg *= Tl.DMG; e.charm = 1e7; e.releve = true; e.lanceur = false; e.wild = null; e.site = null; e.cimetiere = false; e.osCd = rand(1, 2); e.calm = true; e.xp = 0; e.or = 0; G.text(x, y - 64, '💀 À tes ordres, chef !', '#d8c8ff', true);
    if (So && So.lumiere) So.lumiere(x, y, 'Squelette'); else { G.puff(x, y - 16, '#e8e0ff', 22, 150, 4); R.rings.push({ x, y: y - 6, r: 60, life: 0.5, col: '#d8c8ff' }); CG.sfx('spell'); }
    G.puff(q.x, q.y + 6, '#7a5a3a', 16, 120, 4); return true;
  };
  if (CG.SPELLS.resurrection) CG.SPELLS.resurrection.desc += ' Près d\'une vieille tombe de cimetière, il en fait sortir un squelette qui se bat pour toi.';
  // le sort lancé près d'une tombe : c'est elle qu'il réveille
  { const ca0 = G.cast; G.cast = function (id) { if (id === 'resurrection' || /^resurrection_/.test(id || '')) { const n = CG.S && CG.R ? tombePres() : null; if (n) return void Tl.lever(n); } return ca0.apply(this, arguments); }; }
  // E devant une tombe, quand on connaît le sort
  { const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it) return it; const R = CG.R; if (!R || R.ko > 0 || R.cine || R.build || !sait()) return it; const n = tombePres(); return n ? { type: 'tombeLeve', obj: n, label: 'Réveiller ce mort 🕊️ (' + Tl.MANA + ' mana)' } : it; };
    const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'tombeLeve') return void Tl.lever(it.obj); return in0.apply(this, arguments); }; }
  // ---------- les os qu'ils lancent ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !R.enemies) return; const O = Tl.OS, B = R.osAllies || (R.osAllies = []);
    for (const e of R.enemies) { if (!e.releve || e.dead) continue; if (e.charm < 1e6) e.charm = 1e7;
      { const p = CG.S.player, d = Math.hypot(p.x - e.x, p.y - e.y); if (e.spd0 === undefined) e.spd0 = e.spd; e.spd = e.spd0 * (d > Tl.SUIT.loin ? Tl.SUIT.k : 1.25); if (d > Tl.SUIT.saut) { e.x = p.x - (p.face || 1) * 36; e.y = p.y + 12; e.path = null; if (G.unstick) G.unstick(e, 9); G.puff(e.x, e.y - 16, '#e8e0ff', 14, 110, 4); } }
      e.osCd -= dt; if (e.osCd > 0 || e.rooted > 0) continue;
      let tg = null, bd = O.PORTEE; for (const o of R.enemies) { if (o === e || o.dead || o.charm > 0 || (o.calm && !o.struct)) continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd && d > O.MIN) { bd = d; tg = o; } }
      if (!tg || !W.lineClear(e.x, e.y, tg.x, tg.y)) { e.osCd = 0.5; continue; }
      e.osCd = rand(O.CD[0], O.CD[1]); e.atkAnim = 1; e.face = tg.x > e.x ? 1 : -1; const dx = tg.x - e.x, dy = (tg.y - 14) - (e.y - 18), d = Math.hypot(dx, dy) || 1;
      B.push({ x: e.x, y: e.y - 18, vx: dx / d * O.V, vy: dy / d * O.V, t: 1.1, rot: 0, dmg: e.dmg * O.DMG, de: e }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
    for (const b of B) { b.x += b.vx * dt; b.y += b.vy * dt; b.t -= dt; b.rot += dt * 14;
      for (const o of R.enemies) { if (o.dead || o.charm > 0 || o === b.de || Math.hypot(o.x - b.x, o.y - 14 - b.y) > 15 + (o.r || 12) * 0.4) continue; G.hurtEnemy(o, b.dmg, b.de); G.puff(b.x, b.y, '#f0ead8', 5, 60, 2); b.t = 0; break; } }
    if (B.length) R.osAllies = B.filter(b => b.t > 0);
  };
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const B = CG.R && CG.R.osAllies; if (!B || !B.length) return;
    for (const b of B) { if (!CG.onScreen(b.x, b.y)) continue; g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.strokeStyle = '#f4eedc'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.stroke(); g.fillStyle = '#f4eedc'; [[-7, -2], [-7, 2], [7, -2], [7, 2]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 2.2, 0, TAU); g.fill(); }); g.restore(); } }; }
})(window.CG);
