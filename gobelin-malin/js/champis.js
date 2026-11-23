// Goblin Malin — les champignons se diversifient. À la place d'un Champi-mordeur ordinaire, selon le jour, on croise parfois :
//   écarlate : plus costaud, tape plus fort ;
//   bleu     : petit et vif, il court beaucoup plus vite ;
//   à spores : il gonfle, puis lâche un nuage de spores empoisonnées tout autour de lui (on le voit venir, on s'écarte) ;
//   sorcier  : il reste à distance et lance des dards de poison ;
//   gros     : musclé, bien plus fort et plus rapide, pour plus tard dans la partie.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, Ma = CG.Marais, TAU = Math.PI * 2, rand = CG.rand, dist = CG.dist;
  const Ch = CG.Champis = { SPORES: 78, GONFLE: 0.85, SPORES_CD: [5, 7], DARD_CD: [2.8, 3.8], DARD_V: 200 };
  Ch.COGNE = { CD: [7, 10], PRES: 110, PREP: 0.7, RAYON: 125, LENT: 3.5, K: 0.5, DMG: 0.5 }; /* le gros champi lève les poings (PREP s), cogne le sol, et tout le monde à RAYON pixels marche à moitié vitesse pendant LENT s */
  Ch.TOUPIE = { VOIT: 250, CD: [6, 9], SAUT: 0.7, DUREE: 4.5, SONNE: 1.8, ACC: 520, FROT: 1.6, VMAX: 230, ZIG: 290, ZIG_V: 2.7, TOUCHE: 27, DMG: 0.3, RECHARGE: 0.8, POUSSE: 95, POUSSE_T: 0.22 };
  // tous les autres champignons secouent la tête de temps en temps : un petit nuage de spores, plus rare et bien moins fort
  Ch.FORT = { r: Ch.SPORES, cd: Ch.SPORES_CD, dmg: 0.6, venin: [5, 2], n: 34 }; Ch.PETIT = { r: 54, cd: [13, 17], dmg: 0.25, venin: [3, 1], n: 16, petit: true };
  Object.assign(CG.ENEMIES, {
    champiToupie: { nom: 'Champi-toupie', race: 'bete', hp: 44, dmg: 7, spd: 64, xp: 18, or: 4, cost: 3.5, food: 2 },
    champiRouge: { nom: 'Champi écarlate', race: 'bete', hp: 42, dmg: 9, spd: 66, xp: 12, or: 2, cost: 2.5, food: 2 },
    champiBleu: { nom: 'Champi bleu', race: 'bete', hp: 30, dmg: 6, spd: 92, xp: 11, or: 2, cost: 2.2, food: 2 },
    champiSpore: { nom: 'Champi à spores', race: 'bete', hp: 38, dmg: 6, spd: 54, xp: 14, or: 3, cost: 3, food: 2 },
    champiMage: { nom: 'Champi sorcier', race: 'bete', hp: 32, dmg: 7, spd: 58, xp: 16, or: 5, cost: 3.5, range: 200, food: 2 },
    champiCostaud: { nom: 'Gros champi', race: 'bete', hp: 150, dmg: 16, spd: 82, xp: 42, or: 12, cost: 6.5, r: 16, food: 4 }
  });
  // [type, à partir du jour, chance] : même mécanique que les squelettes (morts.js)
  if (CG.Morts && CG.Morts.RANGS) CG.Morts.RANGS.champi = [['champiCostaud', 7, 0.18], ['champiMage', 4, 0.15], ['champiToupie', 3, 0.2], ['champiSpore', 3, 0.2], ['champiBleu', 3, 0.22], ['champiRouge', 2, 0.25]];
  const LOOK = {
    champiRouge: { s: 1.15, cap: '#b8141c', pois: '#ffd84a', pied: '#f4ecd6' },
    champiBleu: { s: 0.9, cap: '#2f78e0', pois: '#d8f0ff', pied: '#eef2f6' },
    champiSpore: { s: 1.05, cap: '#9ab85a', pois: '#4e6a22', pied: '#e8ecc8', spore: true },
    champiMage: { s: 1, cap: '#6a3ab8', pois: '#ffe36b', pied: '#ece4f4', chapeau: true },
    champiToupie: { s: 1.12, cap: '#e8862a', pois: '#fff2c8', pied: '#f4e8cc' },
    champiCostaud: { s: 1.6, cap: '#8a3a1c', pois: '#f0dcb0', pied: '#e8d8b8', muscle: true }
  };
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.kb || e.retreat;
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && !g.perch && g.ko !== true) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); return l; };
  const frappe = (o, dmg) => { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); };
  const visible = o => o && !o.dead && !o.hidden && o.ko !== true && !(o === CG.S.player && (CG.R.ko > 0 || CG.R.invis > 0));
  function spores(e, dt, q) {
    const R = CG.R, s = e.spore;
    if (s) { if (pris(e)) { e.spore = null; e.spCd = 2; return; }
      s.t -= dt; e.rooted = Math.max(e.rooted || 0, 0.1); e.atkCd = Math.max(e.atkCd, 0.4); e.moving = false; if (s.t > 0) return;
      e.spore = null; e.spCd = rand(q.cd[0], q.cd[1]); e.atkAnim = 1;
      R.dmgCol = CG.DMG ? CG.DMG.poison : null; for (const o of nous()) if (Math.hypot(o.x - e.x, (o.y - e.y) / 0.75) < q.r) { frappe(o, e.dmg * q.dmg); if (Ma) Ma.venin(o, q.venin[0], q.venin[1]); } R.dmgCol = null;
      if (!CG.onScreen(e.x, e.y)) return; CG.sfx('hit');
      for (let i = 0; i < q.n; i++) { const a = i / q.n * TAU + rand(-0.12, 0.12), v = rand(70, 150) * q.r / Ch.SPORES; R.parts.push({ x: e.x + Math.cos(a) * 8, y: e.y - 14 + Math.sin(a) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.75 - rand(0, 16), life: rand(0.6, 1.1), max: 1.1, col: i % 3 === 0 ? '#e0f08a' : i % 3 === 1 ? '#9be04a' : '#6fae2a', size: rand(3, 6), float: true }); }
      for (let i = 0; i < 2; i++) R.rings.push({ x: e.x, y: e.y - 4, r: q.r * (0.85 + i * 0.35), life: 0.4 + i * 0.15, col: i ? '#e0f08a' : '#9be04a' });
      return; }
    e.spCd = (e.spCd === undefined ? (q.petit ? rand(4, q.cd[1]) : rand(1.5, 3.5)) : e.spCd) - dt; const tg = e.target;
    if (e.spCd > 0 || pris(e) || !visible(tg) || dist(e, tg) > q.r + 12) return;
    e.spore = { t: Ch.GONFLE, max: Ch.GONFLE, r: q.r, petit: !!q.petit }; e.path = null; if (!q.petit && CG.onScreen(e.x, e.y)) CG.sfx('warning');
  }
  function sorcier(e, dt) {
    e.atkCd = Math.max(e.atkCd, 0.3); // jamais de flèche ni de boule de feu : seulement ses dards de poison
    e.mgCd = (e.mgCd === undefined ? rand(1, 2.5) : e.mgCd) - dt; const tg = e.target;
    if (e.mgCd > 0 || pris(e) || !Ma || !Ma.lancerTir || !visible(tg)) return; const d = dist(e, tg); if (d > 250 || !W.lineClear(e.x, e.y, tg.x, tg.y)) return;
    e.mgCd = rand(Ch.DARD_CD[0], Ch.DARD_CD[1]); e.atkAnim = 1; e.face = tg.x > e.x ? 1 : -1; Ma.lancerTir(e, 'dard', tg, Ch.DARD_V); if (CG.onScreen(e.x, e.y)) CG.sfx('swing');
  }
  // ---------- le Champi-toupie : il saute sur la tête et tourne comme une toupie, en fonçant sur sa cible sans arriver à se diriger ----------
  function toupie(e, dt) {
    const R = CG.R, S = CG.S, q = e.toupie, T = Ch.TOUPIE;
    if (!q) { e.tpCd = (e.tpCd === undefined ? rand(2, 4) : e.tpCd) - dt; const tg = e.target;
      if (e.tpCd > 0 || e.spore || pris(e) || !visible(tg) || dist(e, tg) > T.VOIT) return;
      e.toupie = { ph: 'saut', t: T.SAUT, max: T.SAUT }; e.path = null; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); return; }
    if (e.retreat) { e.toupie = null; e.tpCd = 3; return; }
    e.rooted = Math.max(e.rooted || 0, 0.1); e.atkCd = Math.max(e.atkCd, 0.4); e.moving = false; e.path = null; q.t -= dt;
    if (q.ph === 'sonne') { if (q.t <= 0) { e.toupie = null; e.tpCd = rand(T.CD[0], T.CD[1]); } return; }
    if (q.ph !== 'sonne' && (e.para > 0 || e.poly || e.sleepT > 0 || e.daze > 0 || e.kb)) { q.ph = 'sonne'; q.t = q.max = T.SONNE; return; }
    if (q.ph === 'saut') { if (q.t <= 0) { q.ph = 'tourne'; q.t = q.max = T.DUREE; q.vx = 0; q.vy = 0; q.a = 0; q.zig = rand(0, TAU); q.cd = 0; q.fum = 0; } return; }
    q.a += dt * 24; q.zig += dt * T.ZIG_V; q.cd -= dt; const tg = visible(e.target) ? e.target : null;
    if (tg) { const dx = tg.x - e.x, dy = tg.y - e.y, l = Math.hypot(dx, dy) || 1, z = Math.sin(q.zig) * T.ZIG; q.vx += (dx / l * T.ACC - dy / l * z) * dt; q.vy += (dy / l * T.ACC + dx / l * z) * dt; }
    const fr = Math.exp(-T.FROT * dt); q.vx *= fr; q.vy *= fr; const v = Math.hypot(q.vx, q.vy); if (v > T.VMAX) { q.vx *= T.VMAX / v; q.vy *= T.VMAX / v; }
    const x0 = e.x, y0 = e.y, r = e.r || 10; G.slide(e, q.vx * dt, 0, r); G.slide(e, 0, q.vy * dt, r); let choc = false;
    if (e.x === x0 && Math.abs(q.vx) > 30) { q.vx *= -0.7; choc = true; } if (e.y === y0 && Math.abs(q.vy) > 30) { q.vy *= -0.7; choc = true; } /* il rebondit sur les arbres et les murs */
    const vu = CG.onScreen(e.x, e.y); if (choc && vu) { G.puff(e.x, e.y - 8, '#e8dcc0', 6, 90, 3); CG.sfx('hit'); }
    q.fum -= dt; if (vu && q.fum <= 0 && v > 60) { q.fum = 0.07; R.parts.push({ x: e.x + rand(-6, 6), y: e.y + rand(-2, 2), vx: -q.vx * 0.15 + rand(-20, 20), vy: -q.vy * 0.15 - rand(4, 20), life: 0.4, max: 0.4, col: '#d8cca8', size: rand(3, 5), float: true }); }
    if (q.cd <= 0) for (const o of nous()) { const dx = o.x - e.x, dy = o.y - e.y, d = Math.hypot(dx, dy) || 1; if (d > T.TOUCHE || (o === S.player && R.invis > 0)) continue;
      const moi = o === S.player, avant = moi ? S.player.hp : 0; frappe(o, e.dmg * T.DMG); q.cd = T.RECHARGE;
      if (moi && S.player.hp < avant) { R.toupiePousse = { x: dx / d * T.POUSSE / T.POUSSE_T, y: dy / d * T.POUSSE / T.POUSSE_T, t: T.POUSSE_T }; G.puff(o.x, o.y - 18, '#fff', 10, 160, 3); }
      q.vx = -dx / d * T.VMAX * 0.75; q.vy = -dy / d * T.VMAX * 0.75; if (vu) { R.rings.push({ x: e.x + dx / 2, y: e.y + dy / 2 - 10, r: 34, life: 0.3, col: '#ffe9b0' }); CG.sfx('hit'); } break; }
    if (q.t <= 0) { q.ph = 'sonne'; q.t = q.max = T.SONNE; }
  }
  function pousseChef(dt) { const R = CG.R, k = R.toupiePousse; if (!k) return; if (R.ko > 0) { R.toupiePousse = null; return; } const d = Math.min(dt, k.t); G.slide(CG.S.player, k.x * d, 0, 9); G.slide(CG.S.player, 0, k.y * d, 9); k.t -= dt; if (k.t <= 0) R.toupiePousse = null; }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !CG.S || !R.enemies || R.night || R.cine) return; pousseChef(dt);
    for (const e of R.enemies) { if (e.dead) continue; if (e.type === 'champiToupie') { toupie(e, dt); if (e.toupie) continue; } if (e.type === 'champiSpore') spores(e, dt, Ch.FORT); else if (e.type === 'champi' || LOOK[e.type]) { spores(e, dt, Ch.PETIT); if (e.type === 'champiMage') sorcier(e, dt); else if (e.type === 'champiCostaud') cogne(e, dt); } }
    if (R.lentChampi > 0) R.lentChampi -= dt;
  };
  function cogne(e, dt) {
    const S = CG.S, R = CG.R, p = S.player, C = Ch.COGNE; if (e.para > 0 || e.sleepT > 0 || e.poly || e.charm > 0 || e.fear > 0 || e.rooted > 0) { e.cogne = null; return; }
    const c = e.cogne;
    if (!c) { e.cogneCd = (e.cogneCd === undefined ? rand(2, 5) : e.cogneCd) - dt; const tg = e.target; if (e.cogneCd > 0 || !tg || dist(e, tg) > C.PRES) return; e.cogne = { t: C.PREP, x: e.x, y: e.y }; e.path = null; G.text(e.x, e.y - 76, '❗', '#ff6a4a', true); return; }
    e.x = c.x; e.y = c.y; e.moving = false; e.atkCd = Math.max(e.atkCd || 0, 0.5); c.t -= dt; if (c.t > 0) return;
    e.cogne = null; e.cogneCd = rand(C.CD[0], C.CD[1]); e.atkAnim = 1; G.text(e.x, e.y - 76, 'BOUM !', '#ffe9a8', true); R.shake = Math.max(R.shake || 0, 0.28); if (CG.onScreen(e.x, e.y)) CG.sfx('tombe');
    for (let i = 0; i < 3; i++) R.rings.push({ x: e.x, y: e.y, r: C.RAYON * (0.5 + i * 0.3), life: 0.35 + i * 0.12, col: '#c9a56b' }); G.puff(e.x, e.y - 4, '#a58a5c', 26, 200, 5);
    if (!(R.ko > 0) && dist(e, p) < C.RAYON) { G.hurtPlayer(e.dmg * C.DMG); R.lentChampi = C.LENT; G.text(p.x, p.y - 74, '🐌 Tout tremble !', '#e8d8b8', true); }
    for (const o of S.goblins.concat(S.pets)) { if (o.hidden || o.ko || o.dead || dist(e, o) > C.RAYON) continue; o.lentT = R.t + C.LENT; if (S.pets.includes(o)) CG.P.hurt(o, e.dmg * C.DMG * 0.6); else G.hurtGoblin(o, e.dmg * C.DMG * 0.6); }
  }
  { const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (CG.R && CG.R.lentChampi > 0 ? Ch.COGNE.K : 1); };
    const ev0 = G.evoSpd; if (ev0) G.evoSpd = function (g) { return ev0.apply(this, arguments) * (g && g.lentT > CG.R.t ? Ch.COGNE.K : 1); };
    if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'lentChampi', ic: '🐌', mal: true, nom: () => 'Sol qui tremble', txt: 'Le gros champi a cogné le sol : tu marches bien moins vite.', t: () => CG.R.lentChampi > 0 ? CG.R.lentChampi : 0 });
    const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const R = CG.R; if (!R || !R.enemies) return; for (const e of R.enemies) { const c = e.cogne; if (!c || e.dead || !CG.onScreen(e.x, e.y)) continue; const k = 1 - c.t / Ch.COGNE.PREP; g.fillStyle = 'rgba(200,150,80,' + (0.1 + k * 0.2).toFixed(2) + ')'; g.beginPath(); g.ellipse(e.x, e.y, Ch.COGNE.RAYON, Ch.COGNE.RAYON * 0.72, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(230,180,90,0.28)'; g.beginPath(); g.ellipse(e.x, e.y, Ch.COGNE.RAYON * k, Ch.COGNE.RAYON * 0.72 * k, 0, 0, TAU); g.fill(); } }; }
  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, f) => ell(g, x, y, r, r, f);
  const line = (g, x1, y1, x2, y2, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const boite = (g, x, y, w, h, r, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); };
  // la toupie : la tête en bas, le chapeau qui tourne au sol, les pieds en l'air
  function enToupie(g, e, t, L, q) {
    const s = L.s, a = q.a, v = Math.hypot(q.vx || 0, q.vy || 0), k = Math.min(1, v / Ch.TOUPIE.VMAX), fin = q.t < 0.9 ? q.t / 0.9 : 1, pen = Math.sin(t * 7) * (0.1 + (1 - fin) * 0.3) + (q.vx || 0) / Ch.TOUPIE.VMAX * 0.22;
    ell(g, e.x, e.y + 1, 15 * s, 4.4 * s, 'rgba(0,0,0,0.22)');
    g.save(); g.translate(e.x, e.y); g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const b = a * 0.9 + i * TAU / 3; g.strokeStyle = 'rgba(255,255,255,' + (0.25 + k * 0.35) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -3 - i * 7 * s, (19 - i * 2) * s, (5.5 - i * 0.6) * s, 0, b, b + 1.5); g.stroke(); } /* les traits du tourbillon */
    g.rotate(pen); g.scale(s, s);
    const sw = Math.sin(a * 0.7) * 3; line(g, -4, -27, -6 - sw, -35, '#d8cfb4', 3.5); line(g, 4, -27, 6 - sw, -35, '#d8cfb4', 3.5); ell(g, -6 - sw, -36, 3, 1.8, '#b8ae90'); ell(g, 6 - sw, -36, 3, 1.8, '#b8ae90'); /* les pieds battent l'air */
    line(g, -7, -20, -13 - k * 4, -18 - k * 5, L.pied, 2.6); line(g, 7, -20, 13 + k * 4, -18 - k * 5, L.pied, 2.6); /* les bras écartés par la vitesse */
    boite(g, -7, -27, 14, 15, 5, L.pied);
    const c = Math.cos(a), sn = Math.sin(a); if (c > -0.2) { const ex = sn * 5.5, w = Math.max(0.25, c); g.strokeStyle = '#16202a'; g.lineWidth = 1.3; [-2.8, 2.8].forEach(d => { const x = ex + d * w; g.beginPath(); g.moveTo(x - 1.6 * w, -22.6); g.lineTo(x + 1.6 * w, -19.4); g.moveTo(x + 1.6 * w, -22.6); g.lineTo(x - 1.6 * w, -19.4); g.stroke(); }); ell(g, ex, -16.6, 2 * w, 1.6, '#822'); } /* les yeux en croix passent devant à chaque tour */
    g.fillStyle = L.cap; g.beginPath(); g.ellipse(0, -13, 15.5, 12.5, 0, 0, Math.PI); g.fill(); g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(0, -13, 15.5, 12.5, 0, 0, Math.PI * 0.5); g.lineTo(0, -13); g.fill();
    for (let i = 0; i < 5; i++) { const b = a + i * TAU / 5, cz = Math.cos(b); if (cz < 0.1) continue; const h = 2.5 + (i % 2) * 4.5, rx = 15.5 * Math.sqrt(Math.max(0, 1 - (h / 12.5) * (h / 12.5))); ell(g, Math.sin(b) * rx * 0.92, -13 + h, 2.5 * cz, 2.1, L.pois); } /* les pois défilent sur le chapeau */
    ell(g, 0, -13, 15.5, 2.6, 'rgba(0,0,0,0.14)');
    g.restore();
  }
  function dessin(g, e, t, L) {
    const tq = e.toupie;
    if (tq && tq.ph === 'tourne') return enToupie(g, e, t, L, tq);
    if (tq && !tq.fait) { tq.fait = 1; g.save(); /* une seule passe : le dessin normal, basculé ou sonné */
      if (tq.ph === 'saut') { const k = 1 - Math.max(0, tq.t) / tq.max, cy = e.y - 15 * L.s; g.translate(e.x, cy - Math.sin(k * Math.PI) * 26); g.rotate(k * k * Math.PI * (e.face < 0 ? -1 : 1)); g.translate(-e.x, -cy); }
      else g.translate(Math.sin(t * 5) * 2.5, 0);
      dessin(g, e, t, L); g.restore(); tq.fait = 0;
      if (tq.ph === 'sonne') for (let i = 0; i < 3; i++) { const b = t * 4 + i * TAU / 3, x = e.x + Math.cos(b) * 12 * L.s, y = e.y - 38 * L.s + Math.sin(b) * 3.5; g.fillStyle = Math.sin(b) > 0 ? '#ffe36b' : '#d8b840'; g.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 1.5 : 3.6, c = j / 10 * TAU - Math.PI / 2; g.lineTo(x + Math.cos(c) * r, y + Math.sin(c) * r); } g.closePath(); g.fill(); } /* les étoiles du tournis */
      return; }
    const face = e.face < 0 ? -1 : 1, bite = e.atkAnim > 0, mad = !e.calm || L.muscle, sp = e.spore, gonfle = sp ? 1 - Math.max(0, sp.t) / sp.max : 0, s = L.s * (1 + (sp && sp.petit ? 0 : gonfle * 0.22)), SR = sp ? sp.r || Ch.SPORES : 0;
    if (sp) { g.save(); g.translate(e.x, e.y); g.scale(1, 0.75); g.fillStyle = 'rgba(130,210,60,0.16)'; g.beginPath(); g.arc(0, 0, SR, 0, TAU); g.fill(); g.fillStyle = 'rgba(150,220,70,0.3)'; g.beginPath(); g.arc(0, 0, SR * gonfle, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(224,240,138,' + (0.65 + Math.sin(t * 18) * 0.25) + ')'; g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, SR, 0, TAU); g.stroke(); g.restore(); } // la zone des spores, qui se remplit
    ell(g, e.x, e.y + 1, 12 * s, 3.6 * s, 'rgba(0,0,0,0.2)');
    g.save(); g.translate(e.x, e.y); g.scale(s, s);
    const sw = e.moving ? Math.sin(e.step * TAU) : 0, b = Math.abs(sw) * 1.5, cx = (bite ? Math.sin(e.atkAnim * Math.PI) * 5 * face : 0) + (sp ? Math.sin(t * (sp.petit ? 26 : 40)) * (sp.petit ? 3.2 : gonfle * 1.2) : 0), top = -18 - b, bras = L.muscle ? 5 : 2.6, lb = L.muscle ? 9 : 7;
    line(g, -4, -6, -4 + sw * 3, 0, '#d8cfb4', L.muscle ? 5 : 3.5); line(g, 4, -6, 4 - sw * 3, 0, '#d8cfb4', L.muscle ? 5 : 3.5); ell(g, -4 + sw * 3, 0, 3, 1.6, '#b8ae90'); ell(g, 4 - sw * 3, 0, 3, 1.6, '#b8ae90');
    line(g, cx - lb, top + 8, cx - lb - 4, top + 12 + sw * 2, L.pied, bras); line(g, cx + lb, top + 8, cx + lb + 4, top + 12 - sw * 2 - (bite ? 5 : 0), L.pied, bras);
    if (L.muscle) { circ(g, cx - lb - 2, top + 9.5, 3.4, L.pied); circ(g, cx + lb + 2, top + 9.5 - (bite ? 2 : 0), 3.4, L.pied); circ(g, cx - lb - 4, top + 12.5 + sw * 2, 3, '#d8c8a4'); circ(g, cx + lb + 4, top + 12.5 - sw * 2 - (bite ? 5 : 0), 3, '#d8c8a4'); } // biceps et poings
    boite(g, cx - lb, top, lb * 2, 14, 5, L.pied); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(cx - lb + (face > 0 ? 0 : lb * 2 - 5), top + 2, 5, 11);
    if (L.muscle) { line(g, cx - 3, top + 10.5, cx + 3, top + 10.5, 'rgba(120,90,50,0.45)', 1); line(g, cx, top + 8.5, cx, top + 12.5, 'rgba(120,90,50,0.35)', 1); }
    const ex = cx + face * 2, ey = top + 6, oeil = (x, y, r) => { circ(g, x, y, r, '#fffdf2'); circ(g, x + face * r * 0.3, y + 0.2, r * 0.55, L.chapeau ? '#3a1466' : '#16202a'); circ(g, x + face * r * 0.5, y - r * 0.35, r * 0.22, '#fff'); };
    oeil(ex - 2.8, ey, 2); oeil(ex + 2.8, ey, 2);
    if (mad) { line(g, ex - 5, ey - 3.6, ex - 1.2, ey - 2.2, '#5a3020', L.muscle ? 1.7 : 1.2); line(g, ex + 5, ey - 3.6, ex + 1.2, ey - 2.2, '#5a3020', L.muscle ? 1.7 : 1.2); }
    if (bite || sp) ell(g, ex, ey + 4.6, sp ? 2.6 : 2.2, sp ? 2.4 : 1.8, '#822'); else line(g, ex - 2, ey + 4.4, ex + 2, ey + 4.4, '#822', 1.3);
    ell(g, cx, top + 1, 14.5, 3, 'rgba(0,0,0,0.12)');
    if (L.chapeau) { // un chapeau pointu de sorcier, avec une étoile
      g.fillStyle = L.cap; g.beginPath(); g.ellipse(cx, top, 15.5, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(cx - 10, top); g.quadraticCurveTo(cx - 5, top - 14, cx + face * 5 + Math.sin(t * 3) * 1.2, top - 25); g.quadraticCurveTo(cx + 6, top - 12, cx + 10, top); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.moveTo(cx, top); g.quadraticCurveTo(cx + 3, top - 13, cx + face * 5, top - 25); g.quadraticCurveTo(cx + 6, top - 12, cx + 10, top); g.closePath(); g.fill();
      circ(g, cx - 3, top - 8, 1.7, L.pois); circ(g, cx + 4, top - 3.5, 1.2, L.pois); circ(g, cx - 6, top - 2.4, 1, L.pois);
      const ox = cx + (lb + 5) * face, oy = top + 6 - (bite ? 5 : 0), r = 3 + Math.sin(t * 7) * 0.7; circ(g, ox, oy, r * 2.3, 'rgba(150,230,70,0.22)'); circ(g, ox, oy, r, '#9be04a'); circ(g, ox - 1, oy - 1, r * 0.4, '#f0ffd0'); // l'orbe de poison dans sa main
    } else {
      const ry = L.spore ? 14 : 12.5; g.fillStyle = L.cap; g.beginPath(); g.ellipse(cx, top, 15.5, ry, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(cx, top, 15.5, ry, 0, Math.PI * 1.5, 0); g.lineTo(cx, top); g.fill();
      [[-7, -5, 2.6], [3.5, -8.5, 2.2], [9.5, -3.5, 1.7], [-1.5, -3, 1.4], [-11.5, -1.6, 1.2]].forEach(([dx, dy, r]) => { circ(g, cx + dx, top + dy, r, L.pois); if (!L.spore) circ(g, cx + dx + 0.5, top + dy + 0.5, r * 0.55, 'rgba(0,0,0,0.07)'); });
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(cx, top, 12.5, ry * 0.8, 0, Math.PI * 1.12, Math.PI * 1.4); g.stroke();
      if (L.spore) for (let i = 0; i < 4; i++) { const q = (t * 0.5 + i / 4) % 1; g.globalAlpha = (1 - q) * 0.8; circ(g, cx - 8 + i * 5.4 + Math.sin(t * 2 + i) * 2, top - 10 - q * 12, 1.3, '#d8f08a'); } g.globalAlpha = 1; // quelques spores qui s'échappent toujours
    }
    g.restore();
    if (e.slow > 0) { g.fillStyle = 'rgba(160,230,255,0.35)'; g.beginPath(); g.ellipse(e.x, e.y - 14 * s, 14 * s, 20 * s, 0, 0, TAU); g.fill(); }
  }
  const ae = Art.enemy; Art.enemy = function (g, e, t) { const L = LOOK[e.type];
    if (!L) { const sp = e.type === 'champi' && e.spore; if (!sp) return ae.apply(this, arguments); // le champignon ordinaire : sa zone, puis lui-même qui se secoue
      const k = 1 - Math.max(0, sp.t) / sp.max; g.save(); g.translate(e.x, e.y); g.scale(1, 0.75); g.fillStyle = 'rgba(130,210,60,0.16)'; g.beginPath(); g.arc(0, 0, sp.r, 0, TAU); g.fill(); g.fillStyle = 'rgba(150,220,70,0.3)'; g.beginPath(); g.arc(0, 0, sp.r * k, 0, TAU); g.fill(); g.restore();
      g.save(); g.translate(Math.sin(t * 26) * 3.2, 0); const r = ae.apply(this, arguments); g.restore(); return r; }
    return dessin(g, e, t + (e.seed || 0), L); };
})(window.CG);
