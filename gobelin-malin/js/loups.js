// Goblin Malin — la meute. Les loups ne font plus que mordre :
//   le loup ordinaire : de temps en temps, il se ramasse (0,7 s) puis bondit de deux cases ;
//   le loup noir : plus gros, plus rapide, plus fort. Il recule d'un bond quand on le frappe, et bondit plus vite ;
//   le loup alpha : il bondit, attrape la jambe et ne lâche plus tant qu'on ne l'a pas frappé. Son hurlement rend la meute plus forte ;
//   le loup à prisme : tout mauve, un prisme entre les yeux. Boules de magie, rayon, et il se téléporte quand on s'approche ;
//   le loup des neiges : gros, blanc, il pique des courses. Sa morsure gèle : chaque couche ralentit un peu plus (icône en haut à gauche) ;
//   l'alpha noir : tout ça à la fois, ou presque. Chaque morsure assombrit l'écran d'un cran, et parfois elle empoisonne.
// Où : le bois des loups (toute la meute), le château de glace (loups des neiges). Tout est réglable dans CG.Loups.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, En = CG.Enfer, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, dist = CG.dist;
  const Lp = CG.Loups = { SAUT_DEPART: 0.3, /* chance qu'un loup ouvre le combat par un bond ; sinon il attend quelques secondes avant son premier saut */
    SAUT: 2 * T, VOL: 0.42, HAUT: 7, POSE: 0.35, MIN: 50, MAX: 135, /* le bond : il se ramasse, vise, et hop ! deux cases en VOL secondes, en cloche (HAUT pixels). Il reste POSE secondes à l'arrêt en retombant. Lancé entre MIN et MAX pixels de la proie */
    SORTES: {
      loup: { bond: { prep: 0.7, cd: [10, 14], k: 1.3 } },
      loupNoir: { bond: { prep: 0.4, cd: [6, 9], k: 1.4 }, esquive: { chance: 0.7, cote: 0 } },
      loupAlpha: { bond: { prep: 0.6, cd: [7, 10], k: 1 }, tient: true, hurle: true },
      loupMauve: { mage: true },
      loupNeige: { course: { cd: [7, 10], dur: 3, k: 1.7 }, gel: true },
      loupAlphaNoir: { bond: { prep: 0.35, cd: [5, 8], k: 1.2 }, tient: true, esquive: { chance: 0.75, cote: 0.5 }, course: { cd: [8, 11], dur: 2, k: 2 }, ombre: true, poison: 0.3 }
    },
    ESQUIVE: { cd: 1.3, t: 0.16, v: 380 },
    HURLE: { cd: [12, 16], rayon: 230, dur: 9, dmg: 1.4, spd: 1.2 },
    MAUVE: { cd: [2.6, 3.8], voit: 340, rayonPart: 0.4, boule: 1, rayon: 1.5, vise: 0.65, long: 380, large: 15, tp: [5, 7], tpPres: 80, tpLoin: [150, 220], vBoule: 260 },
    GEL: { dur: 6, max: 5, lent: 0.12 }, /* chaque couche : 12 % de vitesse en moins */
    OMBRE: { dur: 10, max: 6, noir: 0.15 }, /* chaque cran : l'écran s'assombrit de 15 % */
    POISON: [6, 2],
    MEUTE: [['loup', 5], ['loupNoir', 2], ['loupMauve', 2], ['loupAlpha', 1]], /* le bois des loups : qui on y croise, et à quel poids */
    CHEF_NOIR: { jour: 7, chance: 0.5 }, /* à partir de ce jour, le chef de meute est parfois l'alpha noir */
    NEIGE_PART: 0.3 /* château de glace : pour chaque elfe noir, cette chance d'avoir un loup des neiges à côté */
  };
  const E = CG.ENEMIES;
  E.loupNoir = { nom: 'Loup noir', race: 'bete', hp: 34, dmg: 7, spd: 130, xp: 14, or: 0, cost: 3, food: 1, r: 14 };
  E.loupAlpha = { nom: 'Loup alpha', race: 'bete', hp: 58, dmg: 8, spd: 112, xp: 26, or: 0, cost: 5, food: 2, r: 16 };
  E.loupMauve = { nom: 'Loup à prisme', race: 'bete', hp: 28, dmg: 6, spd: 104, xp: 18, or: 0, cost: 4, food: 1, r: 13, range: 230 };
  E.loupNeige = { nom: 'Loup des neiges', race: 'bete', hp: 46, dmg: 7, spd: 122, xp: 20, or: 0, cost: 4, food: 2, r: 16 };
  E.loupAlphaNoir = { nom: 'Alpha noir', race: 'bete', hp: 90, dmg: 10, spd: 120, xp: 60, or: 0, cost: 9, food: 2, r: 18 };
  const LOOK = {
    loupNoir: { s: 1.3, col: '#2e2c34', dark: '#1a1820', lite: '#55525e', eye: '#ff5a3a' },
    loupAlpha: { s: 1.5, col: '#5e6470', dark: '#3c4049', lite: '#d8dce4', eye: '#ffb030', criniere: '#2c3038' },
    loupMauve: { s: 1.05, col: '#7a4ab8', dark: '#4e2a80', lite: '#c8a8f0', eye: '#f6e0ff', prisme: true },
    loupNeige: { s: 1.4, col: '#e8f0f8', dark: '#a8bcd0', lite: '#ffffff', eye: '#3ac0ff', givre: true },
    loupAlphaNoir: { s: 1.62, col: '#17151c', dark: '#08070a', lite: '#3a3644', eye: '#c060ff', criniere: '#000000', fumee: true }
  };
  const sorte = e => Lp.SORTES[e.type];
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.rooted > 0;
  const tient = e => { const R = CG.R; return !!(R.mordu && R.mordu.e === e); };
  const entre = a => rand(a[0], a[1]);
  Lp.meute = () => { const l = []; Lp.MEUTE.forEach(q => { if (E[q[0]]) for (let i = 0; i < q[1]; i++) l.push(q[0]); }); return l; };
  Lp.chef = () => CG.S && CG.S.day >= Lp.CHEF_NOIR.jour && Math.random() < Lp.CHEF_NOIR.chance ? 'loupAlphaNoir' : 'loupAlpha';

  // ---------- ce que fait une morsure ----------
  function geler() { const R = CG.R, p = CG.S.player, g = R.gelLoup || (R.gelLoup = { n: 0, t: 0 }); g.n = Math.min(Lp.GEL.max, g.n + 1); g.t = Lp.GEL.dur; G.text(p.x, p.y - 74, '🥶 Gelé ×' + g.n, '#bfe6ff', true); G.puff(p.x, p.y - 18, '#dff4ff', 10, 90, 3); }
  Lp.geler = geler;
  function ombrer() { const R = CG.R, p = CG.S.player, o = R.ombreLoup || (R.ombreLoup = { n: 0, t: 0 }); o.n = Math.min(Lp.OMBRE.max, o.n + 1); o.t = Lp.OMBRE.dur; G.text(p.x, p.y - 74, '🌑 Ombre ×' + o.n, '#c8a0ff', true); G.puff(p.x, p.y - 18, '#2a1a3a', 12, 90, 4); }
  function morsure(e) { const s = sorte(e), p = CG.S.player; if (!s) return; if (s.gel) geler(); if (s.ombre) ombrer();
    if (s.poison && Math.random() < s.poison && CG.Marais && CG.Marais.venin) CG.Marais.venin(p, Lp.POISON[0], Lp.POISON[1]); }
  function attraper(e) {
    const R = CG.R, p = CG.S.player, avant = p.hp; G.hurtPlayer(e.dmg); if (R.ko > 0 || p.hp >= avant) return; morsure(e);
    R.mordu = { e, coups: 0, need: (Math.random() < 0.5 ? 2 : 3) + (e.type === 'loupAlphaNoir' ? 1 : 0), tic: En ? En.TIC : 0.9, cote: e.x >= p.x ? 1 : -1, dit: 0 }; p.path = null;
    G.text(p.x, p.y - 74, '🦷 Il te tient la jambe ! Frappe-le !', '#ff9a8a', true); if (CG.onScreen(p.x, p.y)) CG.sfx('hurt');
  }
  const lacher = f => { if (En && En.lacher) En.lacher(f); else CG.R.mordu = null; };
  const frapper = (o, dmg) => { const S = CG.S; if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); };

  // ---------- le loup à prisme : boules, rayon, téléportation ----------
  function teleporter(e) {
    const R = CG.R, p = CG.S.player, M = Lp.MAUVE;
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU), r = entre(M.tpLoin), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.8; if (!W.walkPx(x, y) || !W.lineClear(x, y, p.x, p.y)) continue;
      G.puff(e.x, e.y - 16, '#b070ff', 16, 130, 4); R.rings.push({ x: e.x, y: e.y - 10, r: 40, life: 0.3, col: '#c070ff' }); e.x = x; e.y = y; e.path = null; e.face = p.x > x ? 1 : -1;
      G.puff(x, y - 16, '#e0c0ff', 18, 150, 4); R.rings.push({ x, y: y - 10, r: 50, life: 0.35, col: '#e0b0ff' }); if (CG.onScreen(x, y)) CG.sfx('spell'); return true; }
    return false;
  }
  function boule(e, tg) { const R = CG.R, M = Lp.MAUVE, x = e.x + (e.face < 0 ? -12 : 12), y = e.y - 20, dx = tg.x - x, dy = tg.y - 16 - y, l = Math.hypot(dx, dy) || 1; (R.loupTirs = R.loupTirs || []).push({ x, y, vx: dx / l * M.vBoule, vy: dy / l * M.vBoule, t: 1.7, dmg: e.dmg * M.boule }); if (CG.onScreen(e.x, e.y)) CG.sfx('spell'); }
  function rayon(e, v) {
    const S = CG.S, R = CG.R, M = Lp.MAUVE, x1 = e.x + v.ux * 12, y1 = e.y - 20, x2 = x1 + v.ux * M.long, y2 = y1 + v.uy * M.long; (R.loupRayons = R.loupRayons || []).push({ x1, y1, x2, y2, t: 0.3 }); if (CG.onScreen(e.x, e.y)) CG.sfx('zap');
    const pres = o => { const k = CG.clamp(((o.x - x1) * (x2 - x1) + (o.y - 16 - y1) * (y2 - y1)) / (M.long * M.long), 0, 1); return Math.hypot(o.x - (x1 + (x2 - x1) * k), o.y - 16 - (y1 + (y2 - y1) * k)) < M.large; };
    if (!(R.ko > 0) && pres(S.player)) G.hurtPlayer(e.dmg * M.rayon); for (const o of S.goblins.concat(S.pets)) if (!o.hidden && !o.ko && !o.dead && pres(o)) frapper(o, e.dmg * M.rayon);
  }
  function tirs(dt) {
    const S = CG.S, R = CG.R, p = S.player; if (R.loupRayons && R.loupRayons.length) { for (const r of R.loupRayons) r.t -= dt; R.loupRayons = R.loupRayons.filter(r => r.t > 0); }
    const L = R.loupTirs; if (!L || !L.length) return;
    for (const s of L) { s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; if (s.t <= 0) continue;
      if (!(R.ko > 0) && Math.hypot(p.x - s.x, p.y - 16 - s.y) < 14) { G.hurtPlayer(s.dmg); s.t = 0; } else for (const o of S.goblins.concat(S.pets)) if (!o.hidden && !o.ko && !o.dead && Math.hypot(o.x - s.x, o.y - 16 - s.y) < 13) { frapper(o, s.dmg); s.t = 0; break; }
      if (s.t <= 0) G.puff(s.x, s.y, '#c890ff', 10, 110, 3); }
    R.loupTirs = L.filter(s => s.t > 0);
  }

  // ---------- chaque loup, à chaque instant ----------
  function pas(e, dt, hp0) {
    const S = CG.S, R = CG.R, p = S.player, s = sorte(e), M = Lp.MAUVE;
    if (e.spd0 === undefined) { e.spd0 = e.spd; e.dmg0 = e.dmg; e.bondCd = rand(2, 6); e.courseCd = rand(3, 7); e.hurleCd = rand(4, 8); e.sortCd = rand(1, 2.5); e.tpCd = rand(2, 4); }
    if (e.meute > 0) e.meute -= dt; if (e.course > 0) { e.course -= dt; if (Math.random() < dt * 20) R.parts.push({ x: e.x - (e.face < 0 ? -10 : 10), y: e.y - 6, vx: rand(-20, 20), vy: rand(-30, -5), life: 0.35, max: 0.35, col: s.gel ? '#eef8ff' : '#5a3a7a', size: 3 }); }
    e.spd = e.spd0 * (e.meute > 0 ? Lp.HURLE.spd : 1) * (e.course > 0 && s.course ? s.course.k : 1); e.dmg = e.dmg0 * (e.meute > 0 ? Lp.HURLE.dmg : 1);
    const m = tient(e) ? R.mordu : null;
    if (m) { // accroché à la jambe du chef
      if (R.ko > 0 || pris(e)) return lacher(false);
      e.x = p.x + m.cote * 15; e.y = p.y + 3; e.face = -m.cote; e.moving = false; e.path = null; e.bond = e.esq = null;
      m.tic -= dt; if (m.tic <= 0) { m.tic = En ? En.TIC : 0.9; e.atkAnim = 1; const av = p.hp; G.hurtPlayer(e.dmg * (En ? En.MORSURE : 0.5)); if (p.hp < av) morsure(e); }
      m.dit -= dt; if (m.dit <= 0) { m.dit = 2.2; G.text(p.x, p.y - 74, 'Frappe-le ! (' + (m.need - m.coups) + ')', '#ffd0a0'); }
      e.bondCd = Math.max(e.bondCd, 4); return;
    }
    if (pris(e)) { e.bond = e.esq = e.vise = null; return; }
    if ((e.atkAnim || 0) > (e._a || 0) + 0.3 && e.target === p && p.hp < hp0 && !e.bond) morsure(e); /* une morsure ordinaire vient de porter */
    if (e.esq) { const q = e.esq; q.t -= dt; e.moving = true; for (let i = 0; i < 3; i++) G.slide(e, q.ux * Lp.ESQUIVE.v * dt / 3, q.uy * Lp.ESQUIVE.v * dt / 3); e.face = p.x > e.x ? 1 : -1; if (q.t <= 0) e.esq = null; return; }
    const tg = e.target, d = tg ? dist(e, tg) : 1e9;
    if (s.course && !(e.course > 0)) { e.courseCd -= dt; if (e.courseCd <= 0 && tg && d > 70) { e.course = s.course.dur; e.courseCd = s.course.dur + entre(s.course.cd); G.text(e.x, e.y - 52, '💨', '#fff', true); } }
    if (s.hurle) { e.hurleCd -= dt; if (e.hurleCd <= 0 && tg && !e.bond) { const H = Lp.HURLE, l = R.enemies.filter(o => o !== e && !o.dead && Lp.SORTES[o.type] && dist(o, e) < H.rayon);
      if (l.length) { e.hurleCd = entre(H.cd); l.forEach(o => { o.meute = H.dur; G.puff(o.x, o.y - 16, '#ff7a5a', 8, 80, 3); }); G.text(e.x, e.y - 62, 'AOUUUH !', '#ffd0a0', true); for (let i = 0; i < 2; i++) R.rings.push({ x: e.x, y: e.y - 10, r: 70 + i * 80, life: 0.4 + i * 0.2, col: '#ff8a5a' }); if (CG.onScreen(e.x, e.y)) CG.sfx('warning'); } else e.hurleCd = 2; } }
    if (s.mage) {
      e.tpCd -= dt; e.sortCd -= dt;
      if (e.vise) { const v = e.vise; e.x = v.x; e.y = v.y; e.moving = false; e.face = v.ux >= 0 ? 1 : -1; v.t -= dt; if (v.t <= 0) { if (!v.tire) { v.tire = true; v.t = 0.3; rayon(e, v); } else e.vise = null; } return; }
      if (!tg) return;
      if (e.tpCd <= 0 && (e.tpFuir || (tg === p && d < M.tpPres))) { e.tpFuir = false; e.tpCd = teleporter(e) ? entre(M.tp) : 1; return; }
      if (e.sortCd <= 0 && d < M.voit && d > 40 && W.lineClear(e.x, e.y, tg.x, tg.y)) { e.sortCd = entre(M.cd); e.atkAnim = 1; e.face = tg.x > e.x ? 1 : -1;
        if (Math.random() < M.rayonPart) { e.vise = { x: e.x, y: e.y, t: M.vise, ux: (tg.x - e.x) / (d || 1), uy: (tg.y - e.y) / (d || 1) }; e.path = null; } else boule(e, tg); }
      return;
    }
    if (e.pose > 0) { e.pose -= dt; e.moving = false; return; }
    const B = s.bond; if (!B) return; const b = e.bond;
    if (!b) { if (!tg) e.bondVu = false; else if (!e.bondVu) { e.bondVu = true; e.bondCd = Math.random() < Lp.SAUT_DEPART ? rand(0.2, 0.9) : rand(2.5, 7.5); } /* en voyant sa proie : parfois il saute tout de suite, le plus souvent il fonce d'abord la mordre */
      e.bondCd -= dt; if (!tg || e.bondCd > 0 || e.retreat || e.siege || tg.struct || d < Lp.MIN || d > Lp.MAX || !W.lineClear(e.x, e.y, tg.x, tg.y)) return;
      e.bond = { ph: 0, t: B.prep, ux: (tg.x - e.x) / (d || 1), uy: (tg.y - e.y) / (d || 1), x: e.x, y: e.y }; e.path = null; G.text(e.x, e.y - 46, 'Grrrrr...', '#ffd0a0', true); return; }
    if (b.ph === 0) { e.x = b.x; e.y = b.y; e.moving = false; if (tg && !tg.dead) { const l = dist(e, tg) || 1; b.ux = (tg.x - e.x) / l; b.uy = (tg.y - e.y) / l; } /* il suit sa proie des yeux jusqu'au dernier moment */ e.face = b.ux >= 0 ? 1 : -1; b.t -= dt;
      if (b.t <= 0) { b.ph = 1; b.t = Lp.VOL; b.vus = new Set(); G.puff(e.x, e.y - 2, '#c9b89a', 6, 70, 3); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } return; }
    e.x = b.x; e.y = b.y; e.moving = true; e.step += dt * 5; b.t -= dt; const v = Lp.SAUT / Lp.VOL; let bute = false;
    for (let i = 0; i < 3 && !bute; i++) if (!G.slide(e, b.ux * v * dt / 3, b.uy * v * dt / 3)) bute = true; b.x = e.x; b.y = e.y;
    if (!b.touche && !(R.ko > 0) && !(R.invis > 0) && Math.hypot(p.x - e.x, p.y - e.y) < 24) { b.touche = true; e.atkAnim = 1;
      if (s.tient && !R.mordu) { attraper(e); if (tient(e)) { e.bond = null; e.bondCd = entre(B.cd); return; } } else { const av = p.hp; G.hurtPlayer(e.dmg * B.k); if (p.hp < av) morsure(e); } }
    for (const o of S.goblins.concat(S.pets)) { if (o.hidden || o.ko || o.dead || b.vus.has(o) || Math.hypot(o.x - e.x, o.y - e.y) > 22) continue; b.vus.add(o); frapper(o, e.dmg * B.k); }
    if (bute || b.t <= 0) { e.bond = null; e.bondCd = entre(B.cd); e.atkCd = 0.5; e.pose = Lp.POSE; G.puff(e.x, e.y - 2, '#c9b89a', 8, 80, 3); } /* il retombe : un nuage de poussière, un instant pour se reprendre */
  }
  // ---------- le château de glace : des loups des neiges parmi les elfes noirs ----------
  function neige(R) {
    const Gn = CG.GrotteNid; if (!Gn || !R.grotte || !R.grotte.chateau || R.grotte.loupsN || Gn.mode() !== 'glace') return; R.grotte.loupsN = true; if (R.enemies.some(e => e.type === 'loupNeige')) return;
    for (const o of R.enemies.slice()) { if (!o.arene || o.dead || o.grosArene || o === R.grotte.reine || Math.random() >= Lp.NEIGE_PART) continue; let x = o.x + rand(-40, 40), y = o.y + rand(-40, 40); for (let k = 0; k < 20 && !W.walkPx(x, y); k++) { x = o.x + rand(-50, 50); y = o.y + rand(-50, 50); } if (!W.walkPx(x, y)) continue;
      const e = G.spawnEnemy('loupNeige', x, y, { wild: true, exact: true }); if (!e) continue; e.arene = true; e.etage = o.etage; e.leash = o.leash; e.aggroR = o.aggroR; e.calm = o.calm; e.grotte = true; }
  }
  let voile = null, voileN = -1;
  function ombre(R) { const n = R && R.ombreLoup ? R.ombreLoup.n : 0; if (n === voileN) return; voileN = n;
    if (!voile) { if (!n) return; voile = document.createElement('div'); voile.id = 'ombre-loup'; voile.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;transition:opacity .5s;opacity:0'; document.body.appendChild(voile); void voile.offsetWidth; }
    const a = Math.min(0.92, n * Lp.OMBRE.noir); if (n) voile.style.background = 'radial-gradient(ellipse at 50% 50%,rgba(6,2,14,' + (a * 0.45).toFixed(2) + ') 0%,rgba(6,2,14,' + a.toFixed(2) + ') 60%)'; voile.style.opacity = n ? 1 : 0; }
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R, L = []; let hp0 = 0;
    if (S && R && R.enemies) { hp0 = S.player.hp;
      for (const e of R.enemies) { if (!Lp.SORTES[e.type] || e.dead || e.struct) continue; L.push(e); e._a = e.atkAnim || 0; if (sorte(e).mage) e.atkCd = Math.max(e.atkCd || 0, 0.5); /* il ne mord pas, il lance */
        if (e.bond || e.esq || e.vise || e.pose > 0 || tient(e)) { e.atkCd = Math.max(e.atkCd || 0, 0.3); e._fx = e.x; e._fy = e.y; e._fige = true; } else e._fige = false; } }
    up0.apply(this, arguments); if (CG.S !== S || CG.R !== R || !S || !R) { ombre(CG.R); return; }
    const g = R.gelLoup; if (g) { g.t -= dt; if (g.t <= 0 || R.ko > 0) R.gelLoup = null; } const o = R.ombreLoup; if (o) { o.t -= dt; if (o.t <= 0 || R.ko > 0) R.ombreLoup = null; }
    ombre(R); tirs(dt); if (R.enemies) neige(R);
    if (R.night || R.cine) return;
    for (const e of L) { if (e.dead) continue; if (e._fige) { e.x = e._fx; e.y = e._fy; } pas(e, dt, hp0); }
  };
  // frappé par le chef : le loup noir recule d'un bond, l'alpha noir recule ou fait un pas de côté, le loup à prisme se sauve
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg, src, playerAttack) {
    const r = he0.apply(this, arguments); const s = e && Lp.SORTES[e.type]; if (!s || e.dead || !CG.R) return r; const R = CG.R, p = CG.S.player; if (!(playerAttack === undefined ? src === p : playerAttack)) return r;
    if (s.mage) e.tpFuir = true;
    if (s.esquive && !e.bond && !e.esq && !tient(e) && !pris(e) && !(e.esqCd > R.t) && Math.random() < s.esquive.chance) { const d = dist(e, p) || 1; let ux = (e.x - p.x) / d, uy = (e.y - p.y) / d;
      if (Math.random() < s.esquive.cote) { const k = Math.random() < 0.5 ? 1 : -1, x = ux; ux = -uy * k; uy = x * k; } e.esq = { t: Lp.ESQUIVE.t, ux, uy }; e.esqCd = R.t + Lp.ESQUIVE.cd; e.path = null; G.puff(e.x, e.y - 4, '#bbb', 5, 60, 2); }
    return r;
  };
  const hm0 = G.heroMul; G.heroMul = function () { const g = CG.R && CG.R.gelLoup; return hm0.apply(this, arguments) * (g ? Math.max(0.3, 1 - g.n * Lp.GEL.lent) : 1); };
  if (CG.Buffs) CG.Buffs.LISTE.push(
    { k: 'gelLoup', ic: '🥶', mal: true, nom: () => 'Morsure de glace', txt: () => 'Le loup des neiges t\'a gelé : tu marches moins vite. Chaque morsure ajoute une couche de gel.', t: () => CG.R.gelLoup ? CG.R.gelLoup.t : 0, n: () => CG.R.gelLoup ? CG.R.gelLoup.n : 0 },
    { k: 'ombreLoup', ic: '🌑', mal: true, nom: () => 'Ombre du loup', txt: () => 'L\'alpha noir t\'a mordu : tu vois plus sombre. Chaque morsure assombrit encore.', t: () => CG.R.ombreLoup ? CG.R.ombreLoup.t : 0, n: () => CG.R.ombreLoup ? CG.R.ombreLoup.n : 0 });

  // ---------- dessin ----------
  const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, c) => ell(g, x, y, r, r, c);
  const line = (g, x1, y1, x2, y2, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const poly = (g, a, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) g.lineTo(a[i], a[i + 1]); g.closePath(); g.fill(); };
  const saut = e => { const b = e.bond; return !b ? [0, e.pose > 0 ? 0.88 : 1, 0] : b.ph === 0 ? [0, 0.78 + Math.min(0.1, b.t * 0.2), Math.sin(CG.R.t * 55) * 1.3] : [Math.sin(CG.clamp(1 - b.t / Lp.VOL, 0, 1) * Math.PI) * Lp.HAUT, 0.94, 0]; }; /* [hauteur, écrasement, tremblement] : il s'étire en arrière et tremble, puis file presque à plat */
  function loup(g, e, t, P) {
    const face = e.face < 0 ? -1 : 1, sw = e.moving ? Math.sin(e.step * TAU) : 0, bob = e.moving ? Math.abs(sw) * 1.5 : Math.sin(t * 2.5) * 0.5, lunge = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) * 6 : 0, bite = e.atkAnim > 0;
    const s = P.s * (e.grosArene ? 1.2 : 1), [haut, ecrase, tremble] = saut(e), col = P.col, dark = P.dark, lite = P.lite;
    g.save(); g.translate(e.x, e.y); Art.shadow(g, 0, 2, 16 * s * (haut ? 0.75 : 1));
    if (P.fumee) for (let i = 0; i < 4; i++) { const k = (t * 0.7 + i / 4) % 1; ell(g, Math.sin(t * 2 + i * 2.1) * 12 * s, -8 * s - k * 30 * s, (7 - k * 4) * s, (5 - k * 3) * s, 'rgba(60,20,90,' + (0.3 * (1 - k)).toFixed(2) + ')'); }
    g.translate(tremble, -haut); g.scale(face * s * (ecrase < 0.87 ? 1.1 : 1), s * ecrase); g.translate(lunge - (ecrase < 0.87 ? 4 : 0), 0);
    [-9, -4, 5, 10].forEach((lx, i) => { const fx = lx + (i % 2 ? sw : -sw) * 4 + (haut ? (i < 2 ? -4 : 5) : 0); line(g, lx, -8, fx, haut ? -3 : 0, dark, 3.8); ell(g, fx + 1, haut ? -2.8 : 0.2, 2.9, 1.5, dark); });
    line(g, -13, -13 - bob, -21, -19 - bob + sw * 2, col, 5); circ(g, -22, -20 - bob + sw * 2, 2.8, lite);
    ell(g, 0, -12 - bob, 14, 7, col); ell(g, 1, -8.6 - bob, 10, 3.4, lite); ell(g, -6, -14 - bob, 6, 3, 'rgba(0,0,0,0.1)');
    const backY = -19 - bob; for (let i = 0; i < 4; i++) { const fx = -8 + i * 4.2; poly(g, [fx - 1.6, backY + 2.2, fx + 0.4, backY - 1.8, fx + 2, backY + 2.2], dark); }
    if (P.criniere) for (let i = 0; i < 5; i++) { const fx = 1 + i * 2.6; poly(g, [fx - 2.4, -17 - bob, fx - 0.6, -25.5 - bob - (i % 2) * 2, fx + 2.2, -16 - bob], P.criniere); } /* une grosse crinière sur la nuque */
    const hx = 13, hy = -15 - bob;
    poly(g, [hx - 5, hy - 3.5, hx - 4.4, hy - 11.5, hx - 0.5, hy - 5], dark); poly(g, [hx - 0.2, hy - 5, hx + 1.8, hy - 12, hx + 4.4, hy - 4], col); poly(g, [hx + 0.8, hy - 5.4, hx + 1.9, hy - 9.8, hx + 3.3, hy - 4.8], P.givre ? '#bfe0f6' : '#c89a88');
    circ(g, hx, hy, 6, col); ell(g, hx + 5.6, hy + 2, 5.4, 3, lite); circ(g, hx + 10.4, hy + 0.8, 1.5, '#1c1410'); circ(g, hx + 10, hy + 0.4, 0.45, '#fff');
    if (bite) { poly(g, [hx + 2.4, hy + 3.4, hx + 9.6, hy + 3, hx + 6, hy + 7.4], '#5a1420'); poly(g, [hx + 3.4, hy + 3.4, hx + 4.3, hy + 5.6, hx + 5.2, hy + 3.3], '#fff'); poly(g, [hx + 7, hy + 3.2, hx + 7.8, hy + 5.4, hx + 8.6, hy + 3.1], '#fff'); }
    else { line(g, hx + 3, hy + 4.2, hx + 9.4, hy + 3.8, '#2a1a14', 1); poly(g, [hx + 6.6, hy + 3.8, hx + 7.3, hy + 5.8, hx + 8, hy + 3.8], '#fff'); }
    ell(g, hx + 2.4, hy - 1.5, 2, 2.1, P.eye); ell(g, hx + 2.8, hy - 1.4, 0.7, 1.5, '#1c1410'); circ(g, hx + 3.2, hy - 2, 0.4, '#fff'); if (!e.calm) line(g, hx + 0.2, hy - 4.6, hx + 4.8, hy - 3, '#1c1410', 1.3);
    if (P.prisme) { const py = hy - 5.6, k = 0.6 + Math.sin(t * 5) * 0.4, v = e.vise && !e.vise.tire ? 1 : 0; circ(g, hx + 4.4, py, 4.5 + v * 3, 'rgba(230,170,255,' + (0.25 + k * 0.2 + v * 0.3).toFixed(2) + ')'); poly(g, [hx + 4.4, py - 3.6, hx + 6.6, py, hx + 4.4, py + 3.2, hx + 2.2, py], '#f0c8ff'); poly(g, [hx + 4.4, py - 3.6, hx + 6.6, py, hx + 4.4, py], '#ffffff'); }
    if (P.givre) { [[-10, -19], [-3, -20.4], [5, -19.6]].forEach(q => poly(g, [q[0] - 1.6, q[1] - bob + 1.4, q[0], q[1] - bob - 3.4, q[0] + 1.6, q[1] - bob + 1.4], '#bfe6ff')); if (Math.sin(t * 3 + (e.seed || 0)) > 0.3) ell(g, hx + 14, hy + 3 - ((t * 6) % 3), 2.4, 1.6, 'rgba(230,246,255,0.5)'); } /* des glaçons sur le dos, de la buée */
    g.restore();
  }
  const ae = Art.enemy; Art.enemy = function (g, e, t) {
    const P = LOOK[e.type]; if (P) return loup(g, e, t + (e.seed || 0), P);
    if (e.type !== 'loup' || !(e.bond || e.pose > 0)) return ae.apply(this, arguments);
    const [haut, ecrase, tremble] = saut(e); g.save(); g.translate(e.x + tremble, e.y - haut); g.scale(ecrase < 0.87 ? 1.1 : 1, ecrase); g.translate(-e.x, -e.y); try { return ae.apply(this, arguments); } finally { g.restore(); }
  };
  // au sol : la meute enragée (halo rouge), le bond qui se prépare, le rayon qui vise
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R || !R.enemies) return;
    for (const e of R.enemies) { if (e.dead || !Lp.SORTES[e.type] || !CG.onScreen(e.x, e.y)) continue;
      if (e.meute > 0) { g.fillStyle = 'rgba(255,90,50,' + (0.22 + Math.sin(t * 6) * 0.08).toFixed(2) + ')'; g.beginPath(); g.ellipse(e.x, e.y + 2, 20, 8, 0, 0, TAU); g.fill(); }
      const b = e.bond; if (b && b.ph === 0) { const k = 1 - b.t / sorte(e).bond.prep; g.save(); g.globalAlpha = 0.2 + k * 0.4; g.strokeStyle = '#ffd24a'; g.lineWidth = 9; g.lineCap = 'round'; g.setLineDash([10, 9]); g.lineDashOffset = -t * 50; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + b.ux * Lp.SAUT, e.y + b.uy * Lp.SAUT); g.stroke(); g.restore(); }
      const v = e.vise; if (v && !v.tire) { const k = 1 - v.t / Lp.MAUVE.vise; g.save(); g.globalAlpha = 0.2 + k * 0.45; g.strokeStyle = '#c070ff'; g.lineWidth = 3 + k * 3; g.setLineDash([8, 8]); g.lineDashOffset = -t * 70; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + v.ux * Lp.MAUVE.long, e.y + v.uy * Lp.MAUVE.long); g.stroke(); g.restore(); } }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const s of R.loupTirs || []) { circ(g, s.x, s.y, 9, 'rgba(170,90,255,0.3)'); circ(g, s.x, s.y, 5.5, '#a860f0'); circ(g, s.x - 1.2, s.y - 1.2, 2.4, '#f0dcff'); circ(g, s.x - s.vx * 0.04, s.y - s.vy * 0.04, 3.4, 'rgba(170,90,255,0.4)'); }
    for (const r of R.loupRayons || []) { const a = Math.min(1, r.t / 0.2); g.save(); g.globalAlpha = a; g.lineCap = 'round'; g.strokeStyle = 'rgba(170,90,255,0.45)'; g.lineWidth = 16; g.beginPath(); g.moveTo(r.x1, r.y1); g.lineTo(r.x2, r.y2); g.stroke(); g.strokeStyle = '#c890ff'; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.restore(); }
  };
})(window.CG);
