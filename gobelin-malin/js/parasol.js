// Goblin Malin — le parasol : rouge et blanc, planté dans l'herbe. On marche dessous sans gêne.
//   Ce que dit sa fiche : un coin d'ombre pour se reposer. Une seule personne à la fois (le chef, ou un gobelin blessé qui y va
//   de lui-même quand la place est libre) y regagne un peu de vie, lentement.
//   Ce que sa fiche ne dit pas : posé sur un potager à champignons, il s'ouvre au-dessus du carré, et les champignons, à l'ombre,
//   poussent plus vite. Au joueur de le découvrir.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2;
  const Pa = CG.Parasol = { SOIN: 5, PRES: 26, BLESSE: 0.7, POUSSE: 1.6, COUT: { bois: 12, cuir: 4 } };
  CG.BUILDS.parasol = { nom: 'Parasol', icon: '⛱️', w: 1, h: 1, cat: 'clan', on: 'road', cout: Pa.COUT, tile: 'flat', flat: true,
    desc: 'Un coin d\'ombre pour se reposer. Une seule personne à la fois : toi, ou un gobelin blessé. On y regagne ' + Pa.SOIN + ' points de vie toutes les 15 minutes. On peut marcher dessous.' };
  if (CG.START_BUILDS && !CG.START_BUILDS.includes('parasol')) CG.START_BUILDS.push('parasol');
  const pied = b => ({ x: (b.tx + 0.5) * T, y: (b.ty + 0.5) * T + 6 }), milieu = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T + 12 });
  const parasols = () => CG.S.buildings.filter(b => b.type === 'parasol' && !b.site);
  // ---------- le dessin ----------
  const ROUGE = '#d8322e', BLANC = '#f8f3e8';
  // l'ombre au sol (dessinée sous tout le monde) ; k : la taille
  function ombre(g, x, y, k) { g.fillStyle = 'rgba(10,20,10,0.26)'; g.beginPath(); g.ellipse(x + 5 * k, y + 2, 35 * k, 14 * k, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(10,20,10,0.12)'; g.beginPath(); g.ellipse(x + 5 * k, y + 2, 41 * k, 17 * k, 0, 0, TAU); g.fill(); }
  // le mât et la toile : huit quartiers rouges et blancs, un bord festonné, une boule au sommet. La toile bouge à peine dans le vent.
  function toile(g, x, y, k, t) {
    const h = 58 * k, rx = 36 * k, ry = 12.5 * k, ht = 27 * k, cy = y - h, ax = x + Math.sin(t * 1.3 + x * 0.01) * 0.8 * k, ay = cy - ht, N = 8, a0 = Math.PI / N;
    g.strokeStyle = '#6a4424'; g.lineWidth = 3.4 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, cy + 2); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1 * k; g.beginPath(); g.moveTo(x - 0.9 * k, y - 2); g.lineTo(x - 0.9 * k, cy + 4); g.stroke();
    g.fillStyle = '#8e1c1a'; g.beginPath(); g.ellipse(x, cy, rx, ry, 0, 0, TAU); g.fill(); /* le dessous de la toile, dans l'ombre */
    const pt = i => { const a = a0 + i / N * TAU; return [x + Math.cos(a) * rx, cy + Math.sin(a) * ry, a]; };
    const ordre = []; for (let i = 0; i < N; i++) ordre.push(i); ordre.sort((p, q) => Math.sin(a0 + (p + 0.5) / N * TAU) - Math.sin(a0 + (q + 0.5) / N * TAU)); /* ceux du fond d'abord */
    for (const i of ordre) { const A = pt(i), B = pt(i + 1), am = (A[2] + B[2]) / 2, mx = x + Math.cos(am) * rx * 1.04, my = cy + Math.sin(am) * ry * 1.04 + 3.2 * k;
      g.fillStyle = i % 2 ? BLANC : ROUGE; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + A[0]) / 2 + Math.cos(A[2]) * 5 * k, (ay + A[1]) / 2 - 7 * k, A[0], A[1]); g.quadraticCurveTo(mx, my, B[0], B[1]); g.quadraticCurveTo((ax + B[0]) / 2 + Math.cos(B[2]) * 5 * k, (ay + B[1]) / 2 - 7 * k, ax, ay); g.closePath(); g.fill();
      const lum = Math.cos(am - 3.6); g.fillStyle = lum > 0 ? 'rgba(255,255,255,' + 0.13 * lum + ')' : 'rgba(0,0,0,' + -0.16 * lum + ')'; g.fill(); }
    g.fillStyle = '#f0c84a'; g.beginPath(); g.arc(ax, ay - 2.2 * k, 3 * k, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(ax - 0.9 * k, ay - 3.1 * k, 1 * k, 0, TAU); g.fill();
  }
  Pa.dessin = (g, x, y, k, t) => { ombre(g, x, y, k); toile(g, x, y, k, t || 0); };
  { const bu = Art.building; Art.building = function (g, b, t) { if (b.type !== 'parasol') return bu.apply(this, arguments); const q = pied(b); if (!CG.R || !CG.running || CG.R.build && CG.R.build.fant === b) ombre(g, q.x, q.y, 1); toile(g, q.x, q.y, 1, t || 0); };
    const fl = Art.flats; if (fl) Art.flats = function (g, list, t) { const moi = list.filter(b => b.type === 'parasol'); if (moi.length) { moi.forEach(b => Pa.dessin(g, pied(b).x, pied(b).y, 1, t)); list = list.filter(b => b.type !== 'parasol'); if (!list.length) return; } return fl.call(this, g, list, t); };
    const gr = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr.apply(this, arguments); const S = CG.S; if (!S) return; for (const b of S.buildings) { if (b.site) continue; if (b.type === 'parasol') { const q = pied(b); if (CG.onScreen(q.x, q.y)) ombre(g, q.x, q.y, 1); } else if (b.parasol) { const q = milieu(b); if (CG.onScreen(q.x, q.y)) ombre(g, q.x, q.y, 1.45); } } };
    const po = CG.Armee && CG.Armee.pousser; if (po) CG.Armee.pousser = function (push) { po.apply(this, arguments); const S = CG.S; if (!S) return; for (const b of S.buildings) if (b.parasol && !b.site) { const q = milieu(b); if (CG.onScreen(q.x, q.y)) push((b.ty + b.h) * T + 2, 21, { x: q.x, y: q.y, draw(g, o, t) { toile(g, o.x, o.y, 1.45, t || 0); } }, null); } }; }
  // ---------- le poser sur un potager : il s'ouvre au-dessus du carré ----------
  { const bs = D.buildSpot; D.buildSpot = function () { const sp = bs.apply(this, arguments), R = CG.R; if (sp && !sp.ok && R.build && R.build.type === 'parasol') { const b = G.buildingAt(sp.tx, sp.ty); if (b && b.type === 'potager' && !b.site && !b.parasol && G.canPay(Pa.COUT)) { sp.ok = true; sp.potager = b; } } return sp; };
    const pb = D.placeBuild; D.placeBuild = function () { const R = CG.R; if (R.build && R.build.type === 'parasol') { const sp = D.buildSpot(); if (sp && sp.ok && sp.potager) { const b = sp.potager, q = milieu(b); G.pay(Pa.COUT); b.parasol = true; CG.sfx('poser'); G.puff(q.x, q.y - 40, '#f8f3e8', 14, 110, 4); G.puff(q.x, q.y - 40, '#d8322e', 10, 90, 3); if (!G.canPay(Pa.COUT)) R.build = null; return; } } return pb.apply(this, arguments); };
    const pk = CG.pack; CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.buildings && S) d.buildings.forEach((o, i) => { if (S.buildings[i] && S.buildings[i].parasol) o.parasol = true; }); return d; }; }
  // ---------- se reposer : une personne à la fois ----------
  const dessous = (b, o) => { const q = pied(b); return Math.hypot(o.x - q.x, o.y - (q.y - 4)) < Pa.PRES; };
  const pris = b => CG.S.goblins.some(g => g.ombre && g.ombre.b === b) || (!(CG.R.ko > 0) && dessous(b, CG.S.player));
  // un gobelin blessé, sans rien d'urgent à faire, va s'asseoir sous un parasol libre (la routine du repli passe avant tout le reste)
  if (CG.Repli && CG.Repli.step) { const st = CG.Repli.step; CG.Repli.step = function (g, dt) {
      if (st.apply(this, arguments)) { g.ombre = null; return true; } const S = CG.S, R = CG.R, mh = G.gobMaxHp(g), o = g.ombre;
      if (o) { if (R.alarm || R.night || g.hp >= mh || g.hp <= 0 || !S.buildings.includes(o.b) || o.b.site || (!(R.ko > 0) && o.la && dessous(o.b, S.player) && Math.hypot(S.player.x - g.x, S.player.y - g.y) < 8)) { g.ombre = null; g.bubble = null; G.resetGoblin(g); return false; }
        g.state = 'ombre'; g.pose = null; if (!o.la) { if (G.follow(g, 96, dt)) o.la = true; return true; } g.moving = false; g.bubble = '💤'; return true; }
      if (R.alarm || R.night || g.state !== 'idle' || g.hidden || g.perch || g.child || g.exile || g.job === 'guerisseur' || g.hp <= 0 || g.hp >= mh * Pa.BLESSE || S.hour < 7 || S.hour > 19) return false;
      const b = parasols().filter(q => !pris(q)).sort((p, q) => Math.hypot(pied(p).x - g.x, pied(p).y - g.y) - Math.hypot(pied(q).x - g.x, pied(q).y - g.y))[0]; if (!b) return false;
      const q = pied(b); G.resetGoblin(g); if (!G.goTo(g, q.x + 7, q.y - 2)) return false; g.ombre = { b, la: false }; g.state = 'ombre'; return true; }; }
  // toutes les 15 minutes de jeu : celui qui est dessous regagne un peu de vie ; et le potager à l'ombre pousse plus vite
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night) return; const p = S.player;
    for (const b of S.buildings) if (b.parasol && b.type === 'potager' && !b.site && !b.recolte && b.pt !== undefined) b.pt += dt * (Pa.POUSSE - 1);
    const q = Math.floor(S.hour * 4); if (R.parasolQ === undefined) R.parasolQ = q; if (q === R.parasolQ) return; R.parasolQ = q;
    for (const b of parasols()) { const g = S.goblins.find(o => o.ombre && o.ombre.b === b && o.ombre.la), c = pied(b);
      if (g) { const mh = G.gobMaxHp(g); if (g.hp < mh) { g.hp = Math.min(mh, g.hp + Pa.SOIN); if (CG.onScreen(g.x, g.y)) G.text(g.x, g.y - 46, '+' + Pa.SOIN + ' ❤', '#ffb0a0'); } }
      else if (!(R.ko > 0) && dessous(b, p) && p.hp < p.maxhp) { p.hp = Math.min(p.maxhp, p.hp + Pa.SOIN); G.text(p.x, p.y - 60, '+' + Pa.SOIN + ' ❤', '#ffb0a0'); G.puff(c.x, c.y - 30, '#f8f3e8', 5, 50, 2.5); } }
  };
})(window.CG);
