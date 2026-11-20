// Goblin Malin — deux nouveaux venus dans les hordes de l'enfer :
//   le molosse à deux têtes : il piétine, puis se rue droit sur quelqu'un. S'il attrape le chef, il lui mord la jambe : impossible de bouger
//     tant qu'on ne l'a pas frappé 2 ou 3 fois. Le reste du temps, il griffe comme tout le monde.
//   le diablotin lancier : le cousin du diablotin, mais au corps à corps, avec une lance.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, TAU = Math.PI * 2, rand = CG.rand, dist = CG.dist;
  const En = CG.Enfer = { PREP: 0.65, ELAN: 430, DUREE: 0.75, MIN: 90, MAX: 300, REPOS: [5, 7.5], MORSURE: 0.5, TIC: 0.9 };
  CG.ENEMIES.cerbere = { nom: 'Molosse à deux têtes', race: 'demon', hp: 46, dmg: 7, spd: 92, xp: 22, or: 8, cost: 4, r: 15 };
  CG.ENEMIES.molosseCornu = { nom: 'Molosse cornu', race: 'demon', hp: 32, dmg: 6, spd: 98, xp: 15, or: 6, cost: 3, r: 14 }; // une seule tête, deux cornes : il ne mord pas, il encorne et projette
  CG.ENEMIES.cerbere3 = { nom: 'Cerbère à trois têtes', race: 'demon', hp: 80, dmg: 9, spd: 88, xp: 42, or: 16, cost: 7, r: 18 }; // le plus gros : il faut 3 ou 4 coups pour lui faire lâcher prise
  En.CHIENS = { molosseCornu: 1, cerbere: 2, cerbere3: 3 }; // nombre de têtes
  En.JOURS = { molosseCornu: 4, cerbere: 7, cerbere3: 11 }; // pas avant ce jour-là : ce ne sont pas des monstres de début de partie
  En.POIDS = { molosseCornu: 3, cerbere: 2, cerbere3: 1 }; En.PART = 0.4;
  CG.ENEMIES.diablotinLance = { nom: 'Diablotin lancier', race: 'demon', hp: 26, dmg: 6, spd: 102, xp: 12, or: 6, cost: 2.5 };
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.rooted > 0;
  En.lacher = function (frappe) {
    const R = CG.R, m = R.mordu; if (!m) return; R.mordu = null; const e = m.e, p = CG.S.player; e.rueCd = rand(En.REPOS[0], En.REPOS[1]); e.atkCd = 1;
    if (frappe && !e.dead) { e.daze = 0.9; G.slide(e, m.cote * 22, 4); G.text(e.x, e.y - 50, 'Kaï !', '#ffd0a0', true); G.puff(p.x + m.cote * 10, p.y - 6, '#ffb090', 10, 90, 3); }
  };
  function mordre(e) {
    const R = CG.R, p = CG.S.player, avant = p.hp; G.hurtPlayer(e.dmg); if (R.ko > 0 || R.invuln > 0 && p.hp === avant) return; // esquivé, protégé ou assommé : il rate sa prise
    R.mordu = { e, coups: 0, need: (Math.random() < 0.5 ? 2 : 3) + (e.type === 'cerbere3' ? 1 : 0), tic: En.TIC, cote: e.x >= p.x ? 1 : -1, dit: 0 }; e.rue = null; p.path = null;
    G.text(p.x, p.y - 74, '🦷 Il te tient la jambe ! Frappe-le !', '#ff9a8a', true); if (CG.onScreen(p.x, p.y)) CG.sfx('hurt');
  }
  function pas(e, dt) {
    const S = CG.S, R = CG.R, p = S.player, m = R.mordu && R.mordu.e === e ? R.mordu : null;
    if (m) { // accroché à la jambe du chef
      if (R.ko > 0 || pris(e)) return En.lacher(false);
      e.x = p.x + m.cote * 15; e.y = p.y + 3; e.face = -m.cote; e.moving = false; e.path = null;
      m.tic -= dt; if (m.tic <= 0) { m.tic = En.TIC; e.atkAnim = 1; G.hurtPlayer(e.dmg * En.MORSURE); }
      m.dit -= dt; if (m.dit <= 0) { m.dit = 2.2; G.text(p.x, p.y - 74, 'Frappe-le ! (' + (m.need - m.coups) + ')', '#ffd0a0'); }
      return;
    }
    if (pris(e)) { e.rue = null; return; }
    const r = e.rue;
    if (!r) {
      e.rueCd = (e.rueCd === undefined ? rand(1.2, 3.5) : e.rueCd) - dt; const tg = e.target;
      if (!tg || e.rueCd > 0 || e.retreat || e.siege) return; const d = dist(e, tg);
      if (d < En.MIN || d > En.MAX || !W.lineClear(e.x, e.y, tg.x, tg.y)) return;
      e.rue = { ph: 0, t: En.PREP, tg, x: e.x, y: e.y }; e.path = null; G.text(e.x, e.y - 52, '❗', '#ff6a4a', true); if (CG.onScreen(e.x, e.y)) CG.sfx('warning'); return;
    }
    if (r.ph === 0) { // il gratte le sol, les deux gueules tournées vers sa proie
      e.x = r.x; e.y = r.y; e.moving = false; e.face = r.tg.x > e.x ? 1 : -1; r.t -= dt;
      if (Math.random() < dt * 14) R.parts.push({ x: e.x - e.face * 10 + rand(-4, 4), y: e.y - 1, vx: -e.face * rand(30, 70), vy: rand(-40, -10), life: 0.35, max: 0.35, col: '#8a6a4a', size: 2.5 });
      if (r.t <= 0) { const dx = r.tg.x - e.x, dy = r.tg.y - e.y, l = Math.hypot(dx, dy) || 1; r.ph = 1; r.t = En.DUREE; r.ux = dx / l; r.uy = dy / l; r.vus = new Set(); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
      return;
    }
    // la ruée : tout droit, sans tourner
    e.x = r.x; e.y = r.y; e.moving = true; e.step += dt * 5; e.face = r.ux >= 0 ? 1 : -1; r.t -= dt; let bute = false;
    for (let i = 0; i < 3 && !bute; i++) { if (!G.slide(e, r.ux * En.ELAN * dt / 3, r.uy * En.ELAN * dt / 3)) bute = true; }
    if (Math.hypot(e.x - r.x, e.y - r.y) < En.ELAN * dt * 0.35) bute = true; r.x = e.x; r.y = e.y;
    if (Math.random() < dt * 30) R.parts.push({ x: e.x - r.ux * 12, y: e.y - 10, vx: -r.ux * 40, vy: -r.uy * 40 - 20, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ff6a1e' : '#ffb432', size: 3, float: true });
    if (e.type === 'molosseCornu') { if (!r.corne && !(R.ko > 0) && !(R.invis > 0) && Math.hypot(p.x - e.x, p.y - e.y) < 26) { r.corne = true; const avant = p.hp; G.hurtPlayer(e.dmg * 1.5); if (p.hp < avant) { for (let i = 0; i < 6; i++) G.slide(p, r.ux * 11, r.uy * 11); p.path = null; G.text(p.x, p.y - 74, '💥 Coup de corne !', '#ff9a8a', true); G.puff(p.x, p.y - 16, '#ffd0a0', 10, 110, 3); } r.t = Math.min(r.t, 0.12); } }
    else if (!R.mordu && !(R.ko > 0) && !(R.invis > 0) && Math.hypot(p.x - e.x, p.y - e.y) < 26) return mordre(e);
    for (const o of S.goblins.concat(S.pets)) { if (o.hidden || o.ko || r.vus.has(o) || Math.hypot(o.x - e.x, o.y - e.y) > 22) continue; r.vus.add(o); if (o.pet || S.pets.includes(o)) CG.P.hurt(o, e.dmg * 1.4); else G.hurtGoblin(o, e.dmg * 1.4); }
    if (bute || r.t <= 0) { e.rue = null; e.rueCd = rand(En.REPOS[0], En.REPOS[1]); e.atkCd = 0.5; if (bute && r.t > 0.25) { e.daze = 0.7; G.puff(e.x, e.y - 12, '#ddd', 8, 80, 3); } }
  }
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R; let px, py, tenu = false; const L = [];
    if (S && R) { for (const e of R.enemies) if (En.CHIENS[e.type] && !e.dead) { L.push(e); if (e.rue || (R.mordu && R.mordu.e === e)) { e.atkCd = Math.max(e.atkCd, 0.3); e._x = e.x; e._y = e.y; e._tenu = true; } else e._tenu = false; }
      if (R.mordu) { if (R.mordu.e.dead || !R.enemies.includes(R.mordu.e)) R.mordu = null; else { tenu = true; px = S.player.x; py = S.player.y; } } }
    up0.apply(this, arguments); if (CG.S !== S || CG.R !== R || !S || !R) return;
    if (tenu && R.mordu) { const p = S.player; p.x = px; p.y = py; p.moving = false; p.path = null; } // la jambe prise : le chef ne bouge plus (il peut frapper et lancer des sorts)
    if (R.night || R.cine) return;
    for (const e of L) { if (e.dead) continue; if (e._tenu) { e.x = e._x; e.y = e._y; } pas(e, dt); }
  };
  // chaque coup du chef sur le molosse qui le tient compte ; au 2e ou 3e, il lâche
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg, src, playerAttack) {
    const R = CG.R, m = R && R.mordu, parChef = playerAttack === undefined ? src === CG.S.player : playerAttack; const r = he0.apply(this, arguments);
    if (m && m.e === e && parChef) { m.coups++; if (e.dead || m.coups >= m.need) En.lacher(true); }
    return r;
  };

  // ---------- où on les croise : partout où il y a des diablotins ----------
  { const P = CG.W && CG.W.POIS; void P; }
  En.melange = function (type) {
    if (type !== 'diablotin' && type !== 'demon') return type; if (type === 'diablotin') return Math.random() < 0.4 ? 'diablotinLance' : type;
    const jour = CG.S ? CG.S.day : 1, l = Object.keys(En.JOURS).filter(k => jour >= En.JOURS[k]); if (!l.length || Math.random() >= En.PART) return type; // les premiers jours : aucun chien des enfers
    let tot = 0; l.forEach(k => { tot += En.POIDS[k]; }); let r = Math.random() * tot; for (const k of l) { r -= En.POIDS[k]; if (r <= 0) return k; } return l[0];
  };
  const sp0 = G.spawnEnemy; G.spawnEnemy = function (type, x, y, opts) { // hordes, piédestaux, portail, Demon Lord : une partie des diablotins porte une lance, une partie des démons est remplacée par un molosse
    const o = opts || {}; if ((!o.wild || o.enfer) && !o.exact) type = En.melange(type); return sp0.call(this, type, x, y, opts);
  };

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function patte(g, x, y, ph, mv, col, w, back) {
    const s = mv ? Math.sin(ph) : 0, lift = mv ? Math.max(0, Math.cos(ph)) * 3 : 0, fx = x + s * 5.5 + (back ? -0.6 : 0.6), fy = -lift, kx = x + s * 2 + (back ? -2.6 : 1.2), ky = (y + fy) / 2 + (back ? 0.8 : 0);
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(kx, ky); g.stroke(); g.lineWidth = w * 0.72; g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy - 1.2); g.stroke();
    ell(g, fx + 1.2, fy - 1, w * 0.7, 1.7, col); g.fillStyle = '#f2e6d0'; g.fillRect(fx + 2.2, fy - 1.2, 2.2, 1.3);
  }
  function tete(g, hx, hy, t, gueule, C, devant) {
    if (C.cornes) { g.strokeStyle = '#e8dcc0'; g.lineCap = 'round'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(hx - 2.5, hy - 4.5); g.quadraticCurveTo(hx - 7, hy - 13, hx + 1.5, hy - 17); g.stroke(); g.lineWidth = 1.6; g.beginPath(); g.moveTo(hx + 0.5, hy - 15.6); g.lineTo(hx + 2.6, hy - 18); g.stroke(); } // la corne du fond
    poly(g, [hx - 4, hy - 3.4, hx - 6.6, hy - 11, hx - 0.4, hy - 5.2], C.d); // oreille
    ell(g, hx, hy, 5.8, 5.6, devant ? C.c : C.m);
    g.fillStyle = C.v; g.beginPath(); g.moveTo(hx + 1, hy + 2); g.lineTo(hx + 9.4, hy + 2.6 + gueule); g.quadraticCurveTo(hx + 8, hy + 5.4 + gueule, hx + 1, hy + 5.4); g.closePath(); g.fill();
    if (gueule > 0.5) poly(g, [hx + 2.6, hy + 2.6, hx + 8.6, hy + 2.6 + gueule * 0.45, hx + 2.6, hy + 3.6 + gueule * 0.5], '#ff7a2a');
    g.fillStyle = devant ? C.c : C.m; g.beginPath(); g.moveTo(hx + 1.4, hy - 3.6); g.quadraticCurveTo(hx + 6.6, hy - 2.6, hx + 10.4, hy + 0.4); g.lineTo(hx + 10, hy + 2.6); g.lineTo(hx + 1, hy + 3.2); g.closePath(); g.fill();
    ell(g, hx + 10.2, hy + 0.7, 1.5, 1.4, '#120a0a'); poly(g, [hx + 7, hy + 2.5, hx + 7.8, hy + 5.2, hx + 8.6, hy + 2.5], '#fff'); poly(g, [hx + 3.6, hy + 2.8, hx + 4.3, hy + 4.8, hx + 5, hy + 2.8], '#fff');
    poly(g, [hx - 0.4, hy - 4.4, hx + 0.8, hy - 12.4, hx + 4.4, hy - 4], devant ? C.c : C.m);
    g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(hx + 0.8, hy - 1.2); g.quadraticCurveTo(hx + 2.8, hy - 3.6, hx + 5.2, hy - 1.5); g.quadraticCurveTo(hx + 3, hy - 0.2, hx + 0.8, hy - 1.2); g.fill(); ell(g, hx + 3.1, hy - 1.6, 0.7, 0.9, '#3a0c08'); ell(g, hx + 3, hy - 1.5, 3.6, 3.2, 'rgba(255,170,60,0.28)');
    g.strokeStyle = C.d; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hx + 0.2, hy - 3.6); g.lineTo(hx + 5.6, hy - 2.3); g.stroke();
    if (C.cornes) { g.strokeStyle = '#f6eeda'; g.lineCap = 'round'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx + 1.5, hy - 5); g.quadraticCurveTo(hx + 1, hy - 14, hx + 10, hy - 15.5); g.stroke(); g.lineWidth = 1.8; g.beginPath(); g.moveTo(hx + 9, hy - 15.4); g.lineTo(hx + 12.4, hy - 14.6); g.stroke(); } // la corne de devant, pointée vers l'avant
  }
  function molosse(g, e, t) {
    const R = CG.R, nt = En.CHIENS[e.type] || 2, C = nt === 1 ? { c: '#4a3a44', m: '#352830', d: '#1c1418', v: '#7a4a4a', cornes: true } : nt === 3 ? { c: '#2c1416', m: '#1e0c0e', d: '#0e0405', v: '#a8321e' } : { c: '#5a1c1a', m: '#40100f', d: '#260808', v: '#8a3a2a' }, ech = nt === 1 ? 1.08 : nt === 3 ? 1.5 : 1.22, r = e.rue, prep = r && r.ph === 0, fonce = r && r.ph === 1, tient = R.mordu && R.mordu.e === e;
    const mv = e.moving, ph = e.step * TAU, sw = mv ? Math.sin(ph) : 0, bob = mv ? Math.abs(sw) * 1.4 : Math.sin(t * 2.4) * 0.5, atk = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) : 0;
    g.save(); g.translate(e.x, e.y); g.scale((e.face < 0 ? -1 : 1) * ech, ech);
    ell(g, 0, 1, 18, 5, 'rgba(0,0,0,0.26)');
    if (fonce) { g.globalAlpha = 0.35; for (let i = 1; i <= 3; i++) ell(g, -i * 9, -12, 14 - i * 2, 7 - i, '#ff6a1e'); g.globalAlpha = 1; }
    if (prep) { g.translate(Math.sin(t * 46) * 0.8, 2.4); g.rotate(-0.08); } else if (tient) g.rotate(0.12);
    g.translate(atk * 5, 0); const by = -14 - bob;
    patte(g, -9, by + 2, ph + Math.PI, mv, C.d, 3.9, true); patte(g, 8.5, by + 3, ph, mv, C.d, 3.9, false);
    // la queue : une flamme
    const fl = Math.sin(t * 11) * 2; g.fillStyle = '#ff6a1e'; g.beginPath(); g.moveTo(-13, by - 3); g.quadraticCurveTo(-21, by - 9 + fl, -25, by - 13 + fl); g.quadraticCurveTo(-20, by - 3, -24, by + 1 - fl); g.quadraticCurveTo(-17, by + 1, -12, by + 2); g.closePath(); g.fill(); ell(g, -19, by - 4 + fl * 0.4, 3, 2.2, '#ffd84a');
    ell(g, -9.5, by + 0.5, 6, 6.4, C.c);
    g.fillStyle = C.c; g.beginPath(); g.moveTo(-15, by - 1); g.quadraticCurveTo(-13, by - 8.4, -4, by - 7.4); g.quadraticCurveTo(6, by - 10.6, 13, by - 7.4); g.quadraticCurveTo(17, by, 12, by + 7); g.quadraticCurveTo(3, by + 8, -3, by + 4.2); g.quadraticCurveTo(-10, by + 6.2, -15, by - 1); g.fill();
    g.fillStyle = C.d; g.beginPath(); g.moveTo(-14, by - 3.6); g.quadraticCurveTo(-5, by - 9.6, 12.4, by - 8); g.quadraticCurveTo(3, by - 4.4, -14, by - 3.6); g.fill();
    for (let i = 0; i < 5; i++) { const mx = -8 + i * 4.2, my = by - 7.6 - (i > 2 ? (i - 2) * 0.7 : 0); poly(g, [mx - 1.6, my + 1.4, mx - 0.8, my - 4.6, mx + 1.8, my + 1], '#1a0606'); } // l'échine hérissée
    g.strokeStyle = 'rgba(255,120,40,0.75)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-6, by + 1); g.lineTo(-3, by + 3.4); g.lineTo(-4.6, by - 1.6); g.moveTo(3, by - 1); g.lineTo(6, by + 2.6); g.stroke(); // les fissures de braise
    patte(g, -8, by + 3, ph, mv, C.c, 4.2, true); patte(g, 10, by + 4, ph + Math.PI, mv, C.c, 4.2, false);
    // deux encolures, deux têtes : celle du fond plus haute, celle de devant plus basse
    const g1 = (prep ? 1.2 : 0) + atk * 2.6 + (fonce ? 2.4 : 0) + (tient ? 0 : 0), g2 = tient ? 0.3 + Math.abs(Math.sin(t * 9)) * 1.2 : g1;
    if (nt === 3) { poly(g, [5, by - 9, 8.5, by - 21, 14, by - 16, 11, by - 5], C.d); tete(g, 11.5, by - 21.5 + Math.sin(t * 3 + 2.6) * 0.6, t, g1 * 0.8, { c: C.m, m: C.d, d: C.d, v: C.v }, false); } // la troisième tête, tout en haut
    if (nt >= 2) { poly(g, [7, by - 8, 13.5, by - 15, 18, by - 9, 12, by - 2], C.m); tete(g, 16.5, by - 13 + Math.sin(t * 3) * 0.6, t, g1, C, false); }
    poly(g, [9, by - 4, 15, by - 6, 18.5, by + 1, 12, by + 5], C.c);
    g.strokeStyle = '#3a3238'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(12, by - 5); g.lineTo(15.4, by + 4); g.stroke(); [[12.6, by - 3.6], [14, by + 0.2], [15.2, by + 3.4]].forEach(q => poly(g, [q[0] + 0.6, q[1] - 1.2, q[0] + 4, q[1], q[0] + 0.6, q[1] + 1.2], '#c8ccd4')); // le collier à pointes
    tete(g, 18.5, by - 3 + Math.sin(t * 3 + 1.4) * 0.6, t, g2, C, true);
    g.restore();
  }
  const ae = Art.enemy; Art.enemy = function (g, e, t) {
    if (En.CHIENS[e.type]) return molosse(g, e, t + (e.seed || 0));
    if (e.type !== 'diablotinLance') return ae.apply(this, arguments);
    Art.humanoid(g, { x: e.x, y: e.y, face: e.face, t: t + e.seed, moving: e.moving, step: e.step, atk: 0, angry: !e.calm, skin: '#f08a3a', tunic: '#5a2a3a', legs: '#3a1a26', horns: '#2a1810', wings: 'rgba(110,40,60,0.85)', s: 0.74, eye: '#fff07a', ears: true, fangs: true });
    // la lance : tenue à deux mains, elle part en avant quand il frappe
    const f = e.face < 0 ? -1 : 1, k = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) : 0, bx = e.x + f * (2 + k * 13), by = e.y - 15 + Math.sin((t + e.seed) * 3) * 0.6;
    g.save(); g.translate(bx, by); g.scale(f, 1); g.rotate(-0.16 + k * 0.1);
    g.strokeStyle = '#4a2e1a'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(-13, 0); g.lineTo(15, 0); g.stroke();
    poly(g, [14, -3.2, 24, 0, 14, 3.2, 16, 0], '#d8dce8'); poly(g, [14, -3.2, 24, 0, 16, 0], '#f4f6fa'); g.strokeStyle = '#d8402a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(12.6, -2); g.lineTo(12.6, 2.4); g.stroke();
    g.restore();
  };
  // le trait de visée du molosse qui se prépare, et la dent au-dessus du chef mordu
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const e of R.enemies) { const r = e.rue; if (!r || r.ph !== 0 || e.dead || !CG.onScreen(e.x, e.y)) continue; const dx = r.tg.x - e.x, dy = r.tg.y - e.y, l = Math.hypot(dx, dy) || 1, L = En.ELAN * En.DUREE, k = 1 - r.t / En.PREP;
      g.save(); g.globalAlpha = 0.25 + k * 0.4; g.strokeStyle = '#ff4a2a'; g.lineWidth = 12; g.lineCap = 'round'; g.setLineDash([16, 12]); g.lineDashOffset = -t * 60; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + dx / l * L, e.y + dy / l * L); g.stroke(); g.restore(); }
  };
})(window.CG);
