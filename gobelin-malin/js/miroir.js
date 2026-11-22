// Goblin Malin — le sort Miroir. Deux copies du chef, bleutées et un peu transparentes, sortent de lui et se battent à ses
// côtés. Chacune n'a qu'un cinquième de sa vie et ne frappe qu'à un cinquième de sa force, mais les ennemis se retournent
// contre elles quand elles les touchent. Elles s'effacent au bout d'un moment, ou quand elles n'ont plus de vie.
// Tout est réglable dans CG.Miroir.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, M = CG.Magie, Art = CG.Art, dist = CG.dist, TAU = Math.PI * 2;
  const Mi = CG.Miroir = { NB: 2, PART: 0.2, DUREE: 25, VOIT: 280, PRES_CHEF: 230, VITESSE: 150, CD: 0.85 }; /* PART : la part de vie et de dégâts du chef que chaque copie reçoit */
  CG.SPELLS.miroir = { nom: 'Miroir', icon: '🪞', mp: 24, prix: 900, desc: 'Deux copies de toi apparaissent et se battent à tes côtés.', color: '#a8d8ff' };
  if (CG.SCROLL_POOL && !CG.SCROLL_POOL.includes('miroir')) CG.SCROLL_POOL.push('miroir');
  if (CG.SortsDesc) { const D = CG.SortsDesc; ['L', 'COURT', 'LIVRE', 'TEXTE'].forEach(k => { if (D[k] && typeof D[k] === 'object' && !D[k].miroir) D[k].miroir = 'Deux copies de toi sortent de ton corps et se battent avec toi. Elles sont fragiles.'; }); }
  const liste = () => CG.R.miroirs || (CG.R.miroirs = []);
  function effacer(s, tue) { s.dead = true; G.puff(s.x, s.y - 20, '#a8d8ff', 18, 130, 4); if (tue) { G.text(s.x, s.y - 60, 'Brisé !', '#cfe8ff', true); if (CG.onScreen(s.x, s.y)) CG.sfx('die'); } }
  Mi.lancer = function () {
    const S = CG.S, R = CG.R, p = S.player, L = liste(); L.forEach(s => { if (!s.dead) effacer(s, false); }); L.length = 0;
    const hp = Math.max(1, Math.round(p.maxhp * Mi.PART)), dmg = Math.max(1, G.playerDmg() * Mi.PART);
    for (let i = 0; i < Mi.NB; i++) { const cote = i % 2 ? 1 : -1; let x = p.x + cote * 40, y = p.y + 8; if (!W.walkPx(x, y)) { x = p.x; y = p.y + 4; }
      const s = { summon: true, miroir: true, id: -90 - i, cote, x, y, r: 12, hp, maxhp: hp, dmg, t: Mi.DUREE, age: 0, face: p.face || 1, step: 0, moving: false, atkCd: 0.4 + i * 0.3, atkAnim: 0, repath: 0, path: null, seek: i * 0.2, tg: null, dx: 0, dy: 1 };
      L.push(s); R.rings.push({ x, y: y - 6, r: 46, life: 0.45, col: '#a8d8ff' }); G.puff(x, y - 20, '#dff0ff', 16, 130, 4); }
    G.text(p.x, p.y - 64, '🪞 Miroir !', '#cfe8ff', true);
  };
  const c0 = G.cast; G.cast = function (id) { if (id !== 'miroir') return c0.apply(this, arguments); const p = CG.S.player, mp = p.mp, r = c0.apply(this, arguments); if (p.mp < mp) Mi.lancer(); return r; };
  // un coup reçu : la copie encaisse avec sa petite vie
  const h0 = M.hurt; M.hurt = function (s, dmg) { if (!s || !s.miroir) return h0.apply(this, arguments); if (s.dead) return; dmg = Math.max(1, Math.round(dmg)); s.hp -= dmg; s.flash = 0.18; G.text(s.x, s.y - 56, '-' + dmg, '#cfe8ff'); G.puff(s.x, s.y - 22, '#a8d8ff', 4, 70, 3); if (s.hp <= 0) effacer(s, true); };
  function pas(s, dt) {
    const S = CG.S, R = CG.R, p = S.player; s.age += dt; s.t -= dt; s.atkCd -= dt; s.seek -= dt; if (s.atkAnim > 0) s.atkAnim -= dt * 3.5; if (s.flash > 0) s.flash -= dt; s.moving = false;
    if (s.t <= 0 || R.ko > 0) return effacer(s, false);
    if (s.tg && (s.tg.dead || dist(s, s.tg) > 400 || !R.enemies.includes(s.tg))) s.tg = null;
    if (s.seek <= 0) { s.seek = 0.4; let b = null, bd = 1e9; for (const e of R.enemies) { if (e.dead || e.calm || e.charm > 0) continue; const d = dist(e, s); if ((d < Mi.VOIT || dist(e, p) < Mi.PRES_CHEF) && d < bd) { bd = d; b = e; } } s.tg = b; }
    const x0 = s.x, y0 = s.y, tg = s.tg;
    if (tg) { const d = dist(s, tg); s.face = tg.x > s.x ? 1 : -1;
      if (d > 26 + (tg.r || 12)) G.chase(s, tg.x, tg.y + 2, Mi.VITESSE, dt);
      else if (s.atkCd <= 0) { s.atkCd = Mi.CD; s.atkAnim = 1; G.hurtEnemy(tg, s.dmg, s); } }
    else { const gx = p.x + s.cote * 42, gy = p.y + 12, d = Math.hypot(gx - s.x, gy - s.y); if (dist(s, p) > 520) { s.x = gx; s.y = gy; s.path = null; } else if (d > 22) G.chase(s, gx, gy, Mi.VITESSE * (d > 160 ? 1.5 : 1.05), dt); else s.face = p.face || 1; }
    const mx = s.x - x0, my = s.y - y0; if (Math.abs(mx) + Math.abs(my) > 0.2) { s.dx = mx; s.dy = my; s.moving = true; s.step += dt * 9; }
  }
  const up0 = G.update; G.update = function (dt) { const r = up0.apply(this, arguments), R = CG.R; if (R && R.miroirs && R.miroirs.length) { for (const s of R.miroirs) if (!s.dead) pas(s, dt); if (R.miroirs.some(s => s.dead)) R.miroirs = R.miroirs.filter(s => !s.dead); } return r; };
  // le dessin : le chef lui-même, en bleu pâle et à moitié transparent
  const copie = { draw(g, s, t) {
    const fin = s.t < 3 ? 0.45 + 0.4 * Math.abs(Math.sin(t * 10)) : 1, a = Math.min(1, s.age / 0.3) * 0.62 * fin;
    g.save(); g.globalAlpha = a * 0.6; g.fillStyle = '#a8d8ff'; g.beginPath(); g.ellipse(s.x, s.y + 2, 17, 6, 0, 0, TAU); g.fill();
    g.globalAlpha = s.flash > 0 ? Math.min(1, a + 0.3) : a;
    try { Art.goblin(g, { dir: CG.Art8.dirFrom(s.dx || 0, s.dy || 1), x: s.x, y: s.y, face: s.face, t: t + s.id, moving: s.moving, step: s.step, sex: 'm', hue: 200, lum: 62, chief: true, tool: 'baton', glow: '#a8d8ff', atk: Math.max(0, s.atkAnim), s: 1.12 * (CG.Evo ? CG.Evo.chefScale() : 1) }); } catch (e) { /* pas de dessin : la copie se bat quand même */ }
    g.globalAlpha = Math.min(1, a + 0.25); const k = Math.max(0, s.hp / s.maxhp); g.fillStyle = 'rgba(10,20,40,0.7)'; g.fillRect(s.x - 13, s.y - 58, 26, 4); g.fillStyle = '#a8d8ff'; g.fillRect(s.x - 12, s.y - 57, 24 * k, 2);
    g.restore(); } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R || !R.miroirs) return; for (const s of R.miroirs) if (!s.dead && CG.onScreen(s.x, s.y)) push(s.y, 21, Object.assign(s, copie), null); }; }
  Mi.donner = () => { const p = CG.S.player; if (!p.spells.includes('miroir')) p.spells.push('miroir'); }; // pour les essais
})(window.CG);
