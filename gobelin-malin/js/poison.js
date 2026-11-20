// Goblin Malin — sort : Nuage de poison. Un nuage vert se pose sur l'ennemi le plus proche et ronge tout ce qui reste dedans.
'use strict';
(function (CG) {
  const G = CG.G, Po = CG.Poison = { DUR: 8, R: 105, TICK: 0.5 };
  CG.SPELLS.poison = { nom: 'Nuage de poison', icon: '☠️', mp: 16, prix: 800, desc: 'Un nuage toxique flotte 8 secondes sur l\'ennemi le plus proche : tout ennemi qui reste dedans perd de la vie, encore et encore.', color: '#9be04a' };
  CG.SCROLL_POOL.push('poison');
  const cast0 = G.cast;
  G.cast = function (id) {
    if (id !== 'poison') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    if (R.invis > 0 && CG.Magie.reveal) CG.Magie.reveal();
    let tg = null, bd = 340; for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; tg = e; } }
    const x = tg ? tg.x : p.x + (R.dir ? R.dir.x : p.face) * 130, y = tg ? tg.y : p.y + (R.dir ? R.dir.y : 0) * 130;
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell');
    (R.clouds = R.clouds || []).push({ x, y, t: Po.DUR, tick: 0.2, dmg: 2.6 * (1 + 0.12 * (p.lvl - 1)), seed: Math.random() * 9 });
    R.bolts.push({ x1: p.x, y1: p.y - 26, x2: x, y2: y - 10, life: 0.3 }); R.rings.push({ x, y, r: Po.R, life: 0.5, col: '#9be04a' }); G.puff(x, y - 10, '#9be04a', 22, 110, 5); G.text(x, y - 70, '☠️ Nuage de poison !', '#c8ff9a', true);
  };
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, C = R && R.clouds; if (!C || !C.length) return; const p = CG.S.player;
    for (const c of C) {
      c.t -= dt; c.tick -= dt; if (c.tick > 0) continue; c.tick = Po.TICK;
      for (const e of R.enemies.slice()) { if (e.dead || e.struct || e.charm > 0) continue; if (Math.hypot(e.x - c.x, (e.y - c.y) / 0.75) > Po.R) continue; R.dmgCol = CG.DMG.poison; G.hurtEnemy(e, c.dmg, p); R.dmgCol = null; R.parts.push({ x: e.x + (Math.random() - 0.5) * 14, y: e.y - 26, vx: 0, vy: -28, life: 0.5, max: 0.5, col: '#b8f070', size: 3, float: true }); }
    }
    R.clouds = C.filter(c => c.t > 0);
  };
  // le nuage : de grosses volutes vertes qui tournent lentement, par-dessus les personnages
  const mk0 = CG.Magie.marks;
  CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const C = CG.R.clouds; if (!C) return;
    for (const c of C) {
      if (!CG.onScreen(c.x, c.y)) continue; const a = Math.min(1, c.t / 1.2, (Po.DUR - c.t) / 0.5);
      for (let i = 0; i < 9; i++) { const an = i * 0.7 + c.seed + t * (i % 2 ? 0.35 : -0.28), rad = (i ? 0.3 + (i % 3) * 0.2 : 0) * Po.R, x = c.x + Math.cos(an) * rad, y = c.y - 14 + Math.sin(an) * rad * 0.7, r = Po.R * (0.34 + (i % 4) * 0.05) * (1 + Math.sin(t * 1.7 + i) * 0.07); g.fillStyle = 'rgba(' + (i % 2 ? '120,200,60' : '90,170,70') + ',' + (0.17 * a) + ')'; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
      g.globalAlpha = 0.75 * a; g.font = '18px sans-serif'; g.textAlign = 'center'; for (let i = 0; i < 3; i++) { const k = (t * 0.35 + i / 3 + c.seed) % 1; g.fillText('☠️', c.x + Math.sin(i * 2.1 + c.seed) * Po.R * 0.5, c.y - 10 - k * 46); } g.globalAlpha = 1;
    }
  };
})(window.CG);
