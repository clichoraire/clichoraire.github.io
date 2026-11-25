// Goblin Malin — les petits feux. Certains jours, de petits feux brûlent encore ici et là : surtout autour du portail du nord
//   (les démons sont passés par là) et autour des piédestaux, et un ou deux ailleurs sur la carte. Un nouveau tirage chaque matin, par monde.
//   Marcher dedans brûle (DMG de vie toutes les TIC secondes). Seule la magie de l'eau les éteint (eau.js appelle Braises.arroser).
//   Un feu éteint laisse parfois quelque chose (BUTIN) : un bel objet (rare), le trou d'une fée, ou quelques pièces d'or
//   (la moitié d'un petit coffre). Souvent rien du tout. Rien ne l'annonce.
// Tout se règle dans CG.Braises.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, M = CG.Magie, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, irand = CG.irand, pick = CG.pick;
  if (!G || !W || !M) return;
  const Br = CG.Braises = {
    JOUR: 0.75, /* la chance qu'il y ait des feux ce jour-là */
    PORTAIL: [2, 4], /* combien autour du portail du nord */ AUTEL: 0.6, AUTEL_N: [1, 2], /* la chance qu'un piédestal en ait, et combien */ AILLEURS: [1, 3],
    VILLAGE: 11, /* jamais à moins de tant de cases du feu de camp */ ECART: 2,
    DMG: 4, TIC: 0.6, RAYON: 17,
    BUTIN: { objet: 0.05, fee: 0.15, or: 0.5 }, /* le reste du temps : rien */
    OBJETS: ['epee', 'armure', 'arc', 'pioche', 'hache', 'gant'], BEAU: 0.25 /* la part des objets trois étoiles (les autres en ont deux) */
  };
  const monde = () => (CG.Mondes && CG.Mondes.ici ? CG.Mondes.ici() : 0);
  Br.liste = () => { const S = CG.S; return S && !S.arene && S.braises && S.braises.jour === S.day ? S.braises.l : []; };
  // ---------- le tirage du matin ----------
  function libre(x, y, l) {
    const S = CG.S; if (x < 3 || y < 3 || x > CG.MW - 4 || y > CG.MH - 4 || !W.walkTile(x, y)) return false; const t = W.tile[W.idx(x, y)]; if (t !== W.GRASS && t !== W.CLEAR && t !== W.PATH) return false;
    if (Math.hypot(x - W.CX, y - W.CY) < Br.VILLAGE) return false;
    if (S.buildings.some(b => x >= b.tx - 1 && x <= b.tx + b.w && y >= b.ty - 1 && y <= b.ty + b.h)) return false;
    if ((S.autels || []).some(a => Math.abs(a.tx - x) <= 1 && Math.abs(a.ty - y) <= 1)) return false;
    if ((S.decors && S.decors.l || []).some(d => Math.hypot(d.x - x, d.y - y) < 3)) return false;
    if (l.some(f => Math.hypot(f.tx - x, f.ty - y) < Br.ECART)) return false;
    try { if (W.reachable && !W.reachable(x, y)) return false; } catch (e) { /* rien */ } return true;
  }
  function autour(cx, cy, r0, r1, n, l) { for (let i = 0, k = 0; i < n && k < 200; k++) { const an = Math.random() * TAU, r = rand(r0, r1), x = Math.round(cx + Math.cos(an) * r), y = Math.round(cy + Math.sin(an) * r * 0.8); if (!libre(x, y, l)) continue; ajouter(x, y, l); i++; } }
  function ajouter(x, y, l) { l.push({ tx: x, ty: y, x: x * T + T / 2 + rand(-7, 7), y: y * T + T / 2 + rand(-5, 5), seed: Math.random() * 100, eteint: false }); }
  Br.tirer = function (force) {
    const S = CG.S, l = []; S.braises = { jour: S.day, l }; if (S.arene || (!force && Math.random() >= Br.JOUR)) return l;
    const po = W.POI && W.POI.portail; if (monde() === 0 && po && po.r > 0) autour(po.x, po.y, 2, 6, irand(Br.PORTAIL[0], Br.PORTAIL[1]), l);
    (S.autels || []).forEach(a => { if (!a.off && (force || Math.random() < Br.AUTEL)) autour(a.tx, a.ty, 2, 4, irand(Br.AUTEL_N[0], Br.AUTEL_N[1]), l); });
    for (let i = irand(Br.AILLEURS[0], Br.AILLEURS[1]), k = 0; i > 0 && k < 400; k++) { const x = irand(4, CG.MW - 5), y = irand(4, CG.MH - 5); if (!libre(x, y, l)) continue; ajouter(x, y, l); i--; }
    return l;
  };
  // ---------- l'eau les éteint ----------
  const allumes = () => Br.liste().filter(f => !f.eteint);
  Br.proche = function (x, y, r) { let b = null, bd = r; for (const f of allumes()) { const d = Math.hypot(f.x - x, f.y - y); if (d < bd) { bd = d; b = f; } } return b; };
  Br.arroser = function (x, y, r) { let n = 0; for (const f of allumes()) if (Math.hypot(f.x - x, f.y - y) < r) { eteindre(f); n++; } return n; };
  function eteindre(f) {
    const S = CG.S, R = CG.R; f.eteint = true;
    for (let i = 0; i < 12; i++) R.parts.push({ x: f.x + rand(-7, 7), y: f.y - rand(2, 14), vx: rand(-14, 14), vy: rand(-58, -22), life: rand(0.5, 1), max: 1, col: i % 3 ? '#e8eef2' : '#aab4bc', size: rand(3.5, 6.5), float: true });
    if (CG.onScreen(f.x, f.y)) { CG.sfx('no'); G.text(f.x, f.y - 34, 'Pschhh !', '#dff4ff'); }
    const u = Math.random(), B = Br.BUTIN;
    if (u < B.objet && CG.Objets && CG.Objets.lacher) CG.Objets.lacher(f.x, f.y + 6, pick(Br.OBJETS), Math.random() < Br.BEAU ? 3 : 2);
    else if (u < B.objet + B.fee && CG.Secrets && monde() !== 2) { try { CG.Secrets.liste(); if (S.secrets && S.secrets.day === S.day && !S.secrets.l.some(s => s.x === f.tx && s.y === f.ty)) { S.secrets.l.push({ x: f.tx, y: f.ty, k: 'trou', fait: false }); f.fee = true; } } catch (e) { /* jamais bloquant */ } }
    else if (u < B.objet + B.fee + B.or) G.dropRes(f.x, f.y, 'or', 4 + S.day + irand(0, 4));
  }
  // ---------- chaque instant : le tirage du jour, la brûlure ----------
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    const res = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !R.parts || !S.player) return res;
    if (!S.arene && (!S.braises || S.braises.jour !== S.day)) { try { Br.tirer(); } catch (e) { S.braises = { jour: S.day, l: [] }; } }
    const p = S.player; tic -= dt;
    for (const f of allumes()) {
      if (CG.onScreen(f.x, f.y) && Math.random() < dt * 5) R.parts.push({ x: f.x + rand(-5, 5), y: f.y - rand(8, 18), vx: rand(-10, 10), vy: rand(-46, -22), life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#ffb02a' : '#ffe36b', size: 2.2, float: true });
      if (tic <= 0 && !(R.ko > 0) && !R.cine && !(R.passe > 0) && Math.hypot(p.x - f.x, p.y - f.y) < Br.RAYON) { tic = Br.TIC; R.feuSrc = true; try { G.hurtPlayer(Br.DMG); } finally { R.feuSrc = false; } } }
    return res;
  };
  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const flamme = (g, x, y, w, h, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x, y - h); g.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y); g.quadraticCurveTo(x, y + w * 0.7, x - w, y); g.fill(); };
  function feu(g, o, t) {
    const f = o.f, x = f.x, y = f.y, s = f.seed, v = Math.sin(t * 9 + s) * 0.5 + Math.sin(t * 15.3 + s * 2) * 0.5;
    ell(g, x, y - 6, 26, 15, 'rgba(255,150,40,' + (0.13 + v * 0.03) + ')');
    g.strokeStyle = '#3a2a1c'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 9, y + 1); g.lineTo(x + 7, y - 2); g.moveTo(x - 6, y - 3); g.lineTo(x + 9, y + 2); g.stroke();
    ell(g, x - 3, y, 2, 1.4, '#ff7a2a'); ell(g, x + 4, y - 1, 1.6, 1.2, '#ffb02a');
    flamme(g, x - 5 + v, y - 1, 4.6, 13 + v * 3, '#e8481e'); flamme(g, x + 5 - v, y - 1, 4.4, 11 - v * 2.5, '#e8481e');
    flamme(g, x + v * 1.4, y - 1, 6.6, 21 + v * 4, '#ff7a1e'); flamme(g, x + v, y - 1, 4.2, 14 + v * 3, '#ffc02a'); flamme(g, x + v * 0.6, y - 1, 2.2, 7.5 + v * 2, '#fff2a8');
  }
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); for (const f of allumes()) if (CG.onScreen(f.x, f.y)) push(f.y, 21, { x: f.x, y: f.y, f, draw: feu }, null); }; }
  // un feu éteint : un petit rond de cendres (sauf s'il a laissé le trou d'une fée)
  if (M.ground) { const gr0 = M.ground; M.ground = function (g, t) { gr0.apply(this, arguments);
    for (const f of Br.liste()) { if (!f.eteint || f.fee || !CG.onScreen(f.x, f.y)) continue; ell(g, f.x, f.y, 11, 5.5, 'rgba(30,24,20,0.5)'); ell(g, f.x - 2, f.y - 0.5, 5, 2.4, 'rgba(90,84,80,0.6)'); g.strokeStyle = '#2a1e14'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(f.x - 8, f.y + 1); g.lineTo(f.x + 6, f.y - 2); g.stroke(); } }; }
})(window.CG);
