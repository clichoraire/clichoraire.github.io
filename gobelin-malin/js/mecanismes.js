// Goblin Malin — mécanismes : des pièges qui se fixent sur une clôture (bois, muret ou métal) et tirent d'un seul côté.
// Lance-pieux, lance-flammes, rune gluante. On choisit le côté avec R avant de poser.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, Bt = CG.Bt, Me = CG.Meca = {};
  const DV = [[1, 0], [0, 1], [-1, 0], [0, -1]], COTE = ['vers la droite', 'vers le bas', 'vers la gauche', 'vers le haut'];
  Me.K = {
    pieux: { L: 270, w: 58, cd: 1.1, col: '#c8ccd8' },
    flamme: { L: 150, w: 46, cd: 1.6, col: '#ff8a1e' },
    glu: { L: 210, w: 70, cd: 7, col: '#8ad84a' }
  };
  const def = (mech, nom, icon, cout, tech, desc) => ({ nom, icon, w: 1, h: 1, cat: 'meca', on: 'fence', cout, mech, tech, repeat: true, desc: desc + ' Se fixe sur une clôture, un muret ou une clôture en métal ; R choisit le côté.' });
  CG.BUILDS.mecaPieux = def('pieux', 'Lance-pieux', '🏹', { bois: 12, minerai: 6 }, 'd20', 'Tire des pieux sur les ennemis qui approchent de son côté.');
  CG.BUILDS.mecaFlamme = def('flamme', 'Lance-flammes', '🔥', { bois: 10, minerai: 12 }, 'd21', 'Crache une langue de feu qui brûle tous les ennemis devant lui.');
  CG.BUILDS.mecaGlu = def('glu', 'Rune gluante', '🧪', { minerai: 8, or: 20 }, 'd22', 'Sa magie couvre le sol de glu : les ennemis s\'y traînent.');
  const BASSE = b => b && !b.site && CG.BUILDS[b.type] && CG.BUILDS[b.type].low;

  // ---------- le dessin : un boîtier sur la clôture, la bouche tournée du bon côté ----------
  function boitier(g, x, y, k, dir, t, fx) {
    const d = DV[dir], K = Me.K[k];
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-10, -6, 20, 14);
    g.fillStyle = k === 'glu' ? '#4a3a6a' : '#5a4630'; g.fillRect(-10, -9, 20, 14); g.fillStyle = k === 'glu' ? '#6a56a0' : '#7a6040'; g.fillRect(-10, -9, 20, 4);
    g.fillStyle = '#2c2418'; g.fillRect(-10, -1, 20, 2); g.fillStyle = '#c8ccd8'; [-7, 7].forEach(px => { g.beginPath(); g.arc(px, -5, 1.4, 0, 6.3); g.fill(); });
    // la bouche
    g.save(); g.rotate(Math.atan2(d[1], d[0]));
    if (k === 'pieux') { g.fillStyle = '#8a6234'; g.fillRect(4, -3.5, 13, 7); g.fillStyle = '#d8dce8'; g.beginPath(); g.moveTo(17, -3); g.lineTo(24, 0); g.lineTo(17, 3); g.fill(); }
    else if (k === 'flamme') { g.fillStyle = '#6a6e7a'; g.fillRect(4, -4, 12, 8); g.fillStyle = '#3a3a40'; g.fillRect(14, -5, 4, 10); const fl = 3 + Math.sin(t * 14) * 1.5; g.fillStyle = '#ffb02a'; g.beginPath(); g.arc(19 + fl / 2, 0, fl, 0, 6.3); g.fill(); }
    else { g.fillStyle = '#8ad84a'; g.beginPath(); g.arc(13, 0, 6 + Math.sin(t * 3) * 0.8, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(11, -2, 2, 0, 6.3); g.fill(); }
    if (fx > 0 && k === 'flamme') { for (let i = 0; i < 9; i++) { const u = i / 9, r = 6 + u * K.w * 0.5; g.fillStyle = 'rgba(255,' + Math.round(210 - u * 130) + ',40,' + (0.75 * fx * (1 - u * 0.6)) + ')'; g.beginPath(); g.arc(20 + u * (K.L - 26) + Math.sin(t * 30 + i) * 3, Math.sin(t * 22 + i * 2) * u * 9, r, 0, 6.3); g.fill(); } }
    g.restore(); g.restore();
  }
  Art.extra.mecaPieux = { w: 60, h: 60, draw(c) { boitier(c, 26, 40, 'pieux', 0, 0, 0); } };
  Art.extra.mecaFlamme = { w: 60, h: 60, draw(c) { boitier(c, 26, 40, 'flamme', 0, 0, 0); } };
  Art.extra.mecaGlu = { w: 60, h: 60, draw(c) { boitier(c, 26, 40, 'glu', 0, 0, 0); } };
  const de = Art.drawExtra;
  Art.drawExtra = function (g, b, t) { de.apply(this, arguments); if (b.mech) boitier(g, (b.tx + 0.5) * T, (b.ty + 1) * T - 44, b.mech.k, b.mech.dir, t || 0, b.mech.fx || 0); };

  // ---------- la pose : sur une clôture basse, un seul par clôture ; R tourne sur quatre côtés ----------
  const rot0 = Bt.rotate;
  Bt.rotate = function () { const b = CG.R.build, d = b && CG.BUILDS[b.type]; if (d && d.mech) { b.rot = ((b.rot || 0) + 1) % 4; CG.sfx('swing'); return; } return rot0.apply(this, arguments); };
  const pick0 = Bt.pick; Bt.pick = function () { const r = pick0.apply(this, arguments), b = CG.R.build; if (b && CG.BUILDS[b.type] && !CG.BUILDS[b.type].mech && b.rot > 1) b.rot = 0; return r; };
  const spot0 = D.buildSpot;
  D.buildSpot = function () {
    const R = CG.R, d = R.build && CG.BUILDS[R.build.type]; if (!d || !d.mech) return spot0.apply(this, arguments);
    const m = R.mouse; if (!m) return { tx: 0, ty: 0, w: 1, h: 1, ok: false };
    const tx = Math.floor((m.x + R.cam.x) / T), ty = Math.floor((m.y + R.cam.y) / T), f = G.buildingAt(tx, ty);
    return { tx, ty, w: 1, h: 1, ok: !!(BASSE(f) && !f.mech && G.canPay(d.cout)), target: f };
  };
  const place0 = D.placeBuild;
  D.placeBuild = function () {
    const R = CG.R, d = R.build && CG.BUILDS[R.build.type]; if (!d || !d.mech) return place0.apply(this, arguments);
    const sp = D.buildSpot();
    if (!sp.ok) { CG.sfx('no'); CG.UI.toast(!G.canPay(d.cout) ? 'Il te manque des ressources.' : sp.target && sp.target.mech ? 'Cette clôture porte déjà un mécanisme.' : 'Un mécanisme se fixe sur une clôture, un muret ou une clôture en métal déjà bâtis.'); return; }
    G.pay(d.cout); const f = sp.target; f.mech = { k: d.mech, dir: (R.build.rot || 0) % 4, cd: 1 };
    const x = (f.tx + 0.5) * T, y = (f.ty + 0.5) * T; G.puff(x, y - 20, '#ffe36b', 12, 90, 3); G.text(x, y - 60, d.icon + ' ' + d.nom + ' ' + COTE[f.mech.dir], '#ffe9a8'); CG.sfx('poser');
    if (!G.canPay(d.cout)) R.build = null;
  };
  // l'aperçu : la zone couverte, du côté choisi
  const draw0 = Bt.draw;
  Bt.draw = function (ctx, t) {
    draw0.apply(this, arguments); const R = CG.R, d = R.build && CG.BUILDS[R.build.type]; if (!d || !d.mech || !R.mouse) return;
    const sp = D.buildSpot(), K = Me.K[d.mech], v = DV[(R.build.rot || 0) % 4], x = (sp.tx + 0.5) * T, y = (sp.ty + 0.5) * T;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(v[1], v[0])); ctx.fillStyle = sp.ok ? 'rgba(255,200,80,0.22)' : 'rgba(255,80,60,0.18)'; ctx.fillRect(14, -K.w, K.L, K.w * 2); ctx.strokeStyle = sp.ok ? 'rgba(255,230,150,0.9)' : 'rgba(255,140,120,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.strokeRect(14, -K.w, K.L, K.w * 2); ctx.setLineDash([]);
    ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(K.L + 30, 0); ctx.lineTo(K.L + 10, -12); ctx.lineTo(K.L + 10, 12); ctx.closePath(); ctx.fill(); ctx.restore();
    boitier(ctx, x, (sp.ty + 1) * T - 44, d.mech, (R.build.rot || 0) % 4, t, 0);
  };

  // ---------- le tir ----------
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || R.night) return; const p = S.player;
    for (const b of S.buildings) {
      const m = b.mech; if (!m) continue; if (!BASSE(b)) { if (!b.site) delete b.mech; continue; }
      if (m.fx > 0) m.fx -= dt * 2.2; m.cd -= dt; if (m.cd > 0) continue;
      const K = Me.K[m.k], v = DV[m.dir], cx = (b.tx + 0.5) * T, cy = (b.ty + 0.5) * T, hits = []; let best = null, bd = 1e9;
      for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0 || e.calm || (e.wild && !e.target)) continue; const rx = e.x - cx, ry = e.y - cy, al = rx * v[0] + ry * v[1], la = Math.abs(rx * v[1] - ry * v[0]); if (al < 12 || al > K.L || la > K.w) continue; hits.push(e); if (al < bd) { bd = al; best = e; } }
      if (!best) { m.cd = 0.25; continue; }
      m.cd = K.cd; const on = CG.onScreen(cx, cy);
      if (m.k === 'pieux') { G.shoot({ x: cx + v[0] * 16, y: cy + v[1] * 16 - 8 }, best, 'carreau', 6 + S.day * 0.6, 'g', null); }
      else if (m.k === 'flamme') { m.fx = 1; hits.forEach(e => { G.hurtEnemy(e, 7 + S.day * 0.7, p, false); G.puff(e.x, e.y - 14, '#ff8a1e', 4, 60, 3); }); if (on) CG.sfx('fire'); }
      else { (R.gluZ = R.gluZ || []).push({ x: best.x, y: best.y, r: 66, t: 6, max: 6 }); R.bolts.push({ x1: cx, y1: cy - 30, x2: best.x, y2: best.y, life: 0.25 }); G.puff(best.x, best.y - 4, '#8ad84a', 14, 90, 4); if (on) CG.sfx('spell'); }
    }
    const Z = R.gluZ; if (Z && Z.length) { for (const z of Z) { z.t -= dt; for (const e of R.enemies) if (!e.dead && !e.struct && Math.hypot(e.x - z.x, (e.y - z.y) / 0.75) < z.r) e.slow = Math.max(e.slow || 0, 0.6); } R.gluZ = Z.filter(z => z.t > 0); }
  };
  // les flaques de glu magique, au sol
  const gr0 = CG.Magie.ground;
  CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const Z = CG.R.gluZ; if (!Z) return;
    for (const z of Z) { const a = Math.min(1, z.t / 0.8, (z.max - z.t) / 0.3); g.save(); g.translate(z.x, z.y); g.scale(1, 0.75); g.globalAlpha = a; g.fillStyle = 'rgba(96,170,50,0.55)'; g.beginPath(); for (let i = 0; i <= 14; i++) { const an = i / 14 * 6.283, r = z.r * (0.88 + Math.sin(an * 3 + z.x) * 0.1); g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.fill(); g.fillStyle = 'rgba(170,235,110,0.6)'; [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.16], [0.1, -0.4, 0.12]].forEach(q => { g.beginPath(); g.arc(q[0] * z.r, q[1] * z.r, q[2] * z.r * (1 + Math.sin(t * 3 + q[0] * 9) * 0.12), 0, 6.3); g.fill(); }); g.restore(); }
  };
})(window.CG);
