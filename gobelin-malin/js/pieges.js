// Goblin Malin — les pièges des châteaux (château de glace des elfes noirs, et les autres donjons bâtis de la même façon).
//   Des dalles bien cachées : on marche dessus, *clic*, et un instant plus tard le piège part.
//     piques (sortent du sol) · fleche (une flèche empoisonnée, tirée du mur) · rafale (trois dards à la file) · explosion (le sol saute)
//     gel (un souffle glacé, château de glace seulement) · trappe (le sol s'ouvre) · alarme (une cloche : tout le monde accourt)
//     gaz (un nuage de poison qui reste) · rocher (une grosse pierre roule vers la dalle)
//   Et des pièges qu'on voit : la statue qui lance des boules de feu, celle qui crache du feu (4 s, pause 3 s), la scie qui va et vient.
//   Les monstres du château connaissent les pièges : seul le chef les déclenche. Tout est réglable dans CG.Pieges.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, Gn = CG.GrotteNid; if (!Gn) return;
  const Pg = CG.Pieges = {
    MODES: ['chateau', 'glace'], PAR_SALLE: [2, 4], COULOIR: 0.7, STATUES: [0, 2], SCIE: 0.4,
    BASE: 5, JOUR: 0.5, /* les dégâts d'un piège : (BASE + JOUR par jour) × FORCE, et ça suit la difficulté */
    DALLES: ['piques', 'fleche', 'rafale', 'explosion', 'gel', 'trappe', 'alarme', 'gaz', 'rocher'],
    FORCE: { piques: 1.2, fleche: 1, rafale: 0.7, explosion: 1.6, gel: 0.5, trappe: 1.5, gaz: 0.3, rocher: 1.8, boule: 1.2, feu: 0.6, scie: 1.3, guet: 0.55 },
    CLIC: { piques: 0.35, fleche: 0.45, rafale: 0.45, explosion: 0.8, gel: 0.4, trappe: 0.25, alarme: 0.3, gaz: 0.4, rocher: 0.6 }, /* le temps entre le *clic* et le piège */
    /* combien de pièges, selon la difficulté : dalles par salle, chance d'une dalle par couloir, statues par salle, chance d'une scie, chance d'une sentinelle par salle */
    NB: { normal: { salle: [1, 2], couloir: 0.4, statues: [0, 1], scie: 0.25, guet: 0.2 }, difficile: { salle: [2, 4], couloir: 0.7, statues: [0, 2], scie: 0.4, guet: 0.4 }, elite: { salle: [3, 5], couloir: 0.85, statues: [1, 2], scie: 0.55, guet: 0.55 }, cauchemar: { salle: [4, 6], couloir: 1, statues: [1, 3], scie: 0.7, guet: 0.75 } },
    /* la sentinelle : sa tête tourne sans arrêt ; si elle voit le chef, elle le suit du regard et tire sans relâche. TOURNE / SUIT : vitesse de la tête (radians par seconde) quand elle cherche / quand elle suit ; VUE : portée ; ANGLE : demi-largeur du regard ; PERD : secondes hors de vue avant qu'elle lâche */
    GUET: { TOURNE: 1.3, SUIT: 2.3, VUE: 250, ANGLE: 0.42, CADENCE: 0.5, VITESSE: 330, PERD: 0.7, ALERTE: 0.45 }, COFFRE: 4, /* COFFRE : à partir de combien de pièges dans une même salle on y cache un coffre */
    OEIL: 520, /* rayon dans lequel l'Œil des ombres fait luire les dalles cachées */ REPOS: 4, FEU: [4, 3], FEU_LONG: 3, BOULE: [2.6, 300, 230], SCIE_V: 110, GAZ: [6, 62], CHUTE: 1.2
  };
  Pg.dmg = k => (Pg.BASE + CG.S.day * Pg.JOUR) * (Pg.FORCE[k] || 1) * (CG.Diff && CG.Diff.cur ? CG.Diff.cur().dmg : 1);
  const actif = () => { const R = CG.R; return !!(R && R.grotte && R.grotte.chateau && CG.Arene && CG.Arene.dans() && Pg.MODES.includes(Gn.mode())); };
  // ---------- où ils sont : toujours les mêmes pour un même château ----------
  function poser(R) {
    const S = CG.S, P = Gn.plan(), p = S.player; if (!P || !P.salles || !P.salles[1] || !W.walkPx(p.x, p.y) || !W.walkTile(P.salles[1].x0 + Math.floor(P.salles[1].w / 2), P.salles[1].y0 + Math.floor(P.salles[1].h / 2))) return; /* le château n'est pas encore peint */ const L = R.pgListe = [], rng = CG.makeRng(((S.arene && S.arene.seed) || 1) + 4177);
    const libre = (x, y) => W.walkTile(x, y) && W.walkTile(x - 1, y) && W.walkTile(x + 1, y) && W.walkTile(x, y - 1) && W.walkTile(x, y + 1);
    const loin = (x, y) => { for (const q of L) if (Math.abs(q.tx - x) < 2 && Math.abs(q.ty - y) < 2) return false; return Math.hypot((x + 0.5) * T - p.x, (y + 0.5) * T - p.y) > 4 * T; };
    let sac = []; const sorte = () => { if (!sac.length) { sac = Pg.DALLES.filter(k => k !== 'gel' || Gn.mode() === 'glace'); for (let i = sac.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)), a = sac[i]; sac[i] = sac[j]; sac[j] = a; } } return sac.pop(); };
    const mettre = (k, tx, ty, plus) => { const o = Object.assign({ k, tx, ty, x: (tx + 0.5) * T, y: (ty + 0.5) * T, e: 'arme', t: 0, vu: false, h: rng(), salle }, plus); L.push(o); return o; };
    const entre = a => a[0] + Math.floor(rng() * (a[1] - a[0] + 1)), N = Pg.NB[CG.Diff && CG.Diff.id ? CG.Diff.id() : 'difficile'] || Pg.NB.difficile; let salle = 0; const parSalle = {};
    const large = (x, y) => { for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (!W.walkTile(x + a, y + b)) return false; return true; };
    P.salles.forEach((s, i) => { if (!i) return; salle = i;
      for (let k = 0, n = entre(N.salle), es = 0; k < n && es < 80; es++) { const tx = s.x0 + 1 + Math.floor(rng() * Math.max(1, s.w - 2)), ty = s.y0 + 1 + Math.floor(rng() * Math.max(1, s.h - 2)); if (!libre(tx, ty) || !loin(tx, ty)) continue; mettre(sorte(), tx, ty); k++; }
      for (let k = 0, n = entre(N.statues), es = 0; k < n && es < 40; es++) { const tx = s.x0 + 1 + Math.floor(rng() * Math.max(1, s.w - 2)); let ty = s.y0 - 1; while (ty < s.y0 + 3 && !W.walkTile(tx, ty)) ty++; /* adossée au mur du haut, tournée vers la salle */
        if (!W.walkTile(tx, ty) || W.walkTile(tx, ty - 1) || !W.walkTile(tx, ty + 1) || !W.walkTile(tx, ty + 2) || !loin(tx, ty)) continue; mettre(rng() < 0.5 ? 'boule' : 'feu', tx, ty, { e: 'veille', t: 1 + rng() * 3, dx: 0, dy: 1 }); k++; }
      if (s.w >= 5 && s.h >= 5 && rng() < N.guet) for (let es = 0; es < 40; es++) { const tx = s.x0 + 2 + Math.floor(rng() * Math.max(1, s.w - 4)), ty = s.y0 + 2 + Math.floor(rng() * Math.max(1, s.h - 4)); if (!large(tx, ty) || !loin(tx, ty)) continue; mettre('guet', tx, ty, { e: 'tourne', a: rng() * TAU, sens: rng() < 0.5 ? -1 : 1, perdu: 0, tir: 0 }); break; } /* la sentinelle : au milieu de la salle, pour qu'on puisse tourner autour */
      if (s.w >= 6 && rng() < N.scie) { const ty = s.y0 + 1 + Math.floor(rng() * Math.max(1, s.h - 2)); let a = s.x0 + 1, b = s.x0 + s.w - 2, ok = b - a >= 3; for (let x = a; x <= b && ok; x++) if (!W.walkTile(x, ty)) ok = false; if (ok && loin(a, ty)) mettre('scie', a, ty, { x0: (a + 0.5) * T, x1: (b + 0.5) * T, v: Pg.SCIE_V, e: 'tourne', a: 0 }); } });
    salle = 0; L.forEach(o => { if (o.salle) parSalle[o.salle] = (parSalle[o.salle] || 0) + 1; });
    { let best = 0; Object.keys(parSalle).forEach(i => { if (parSalle[i] >= Pg.COFFRE && (!best || parSalle[i] > parSalle[best])) best = +i; }); /* la salle la plus piégée cache un coffre : tant de pièges, ça garde forcément quelque chose */
      if (best) { const s = P.salles[best], dedans = c => c.x >= s.x0 * T && c.x < (s.x0 + s.w) * T && c.y >= s.y0 * T && c.y < (s.y0 + s.h) * T, mine = L.filter(o => o.salle === best); let ou = null, bd = 1e9;
        if (!(R.chests || []).some(c => dedans(c))) { for (let ty = s.y0 + 1; ty < s.y0 + s.h - 1; ty++) for (let tx = s.x0 + 1; tx < s.x0 + s.w - 1; tx++) { if (!libre(tx, ty) || L.some(o => o.tx === tx && o.ty === ty) || (R.chests || []).some(c => Math.hypot(c.x - (tx + 0.5) * T, c.y - (ty + 0.5) * T) < 50)) continue; let d = 0; mine.forEach(o => { d += Math.hypot(o.tx - tx, o.ty - ty); }); if (d < bd) { bd = d; ou = [tx, ty]; } }
          if (ou) (R.chests = R.chests || []).push({ x: (ou[0] + 0.5) * T, y: (ou[1] + 0.5) * T, kind: 'magique', open: false, biome: Gn.mode(), pg: true }); } } }
    P.couloirs.forEach(c => { if (rng() >= N.couloir) return; const my = Math.round((c.y1 + c.y2) / 2);
      for (const q of [[c.mx, my], [c.mx + 1, my + 1], [c.mx, c.y2], [c.mx + 1, c.y1 + 1], [c.mx - 1, c.y1]]) if (W.walkTile(q[0], q[1]) && loin(q[0], q[1])) { mettre(['piques', 'fleche', 'rafale'][Math.floor(rng() * 3)], q[0], q[1]); break; } });
  }
  // ---------- ce qui vole, ce qui roule ----------
  const blesser = (k, feu) => { const R = CG.R; if (feu) R.feuSrc = true; try { G.hurtPlayer(Pg.dmg(k)); } finally { if (feu) R.feuSrc = false; } };
  const tir = (x, y, bx, by, q, v, k) => { const R = CG.R, d = Math.hypot(bx - x, by - y) || 1; (R.pgTirs = R.pgTirs || []).push({ x, y, vx: (bx - x) / d * v, vy: (by - y) / d * v, t: 2.2, age: 0, q, k: k || q }); };
  function mur(o) { // le mur le plus proche d'une dalle (à deux cases au moins) : c'est de là que part le trait
    let best = null, bd = 99; for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) { let n = 0; while (n < 9 && W.walkTile(o.tx + dx * (n + 1), o.ty + dy * (n + 1))) n++; if (n >= 2 && n < 9 && n < bd) { bd = n; best = { x: o.x + dx * n * T, y: o.y + dy * n * T, dx: -dx, dy: -dy }; } }
    return best || { x: o.x + 3 * T, y: o.y, dx: -1, dy: 0 };
  }
  function volants(R, dt) {
    const p = CG.S.player, vivant = !(R.ko > 0);
    if (R.pgTirs && R.pgTirs.length) { for (const s of R.pgTirs) { s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; s.age += dt;
        if (vivant && Math.hypot(p.x - s.x, p.y - 16 - s.y) < 13) { s.t = 0; const av = p.hp; blesser(s.k, s.q === 'boule'); if (s.q === 'fleche' && p.hp < av && CG.Marais && CG.Marais.venin) CG.Marais.venin(p, 6, Math.max(1, Pg.dmg('fleche') * 0.2)); G.puff(s.x, s.y, s.q === 'boule' ? '#ff8a1e' : s.q === 'rayon' ? '#ff5a3a' : s.q === 'fleche' ? '#9be04a' : '#c9a56b', 8, 90, 3); }
        else if (s.age > 0.15 && !W.walkPx(s.x, s.y + 16)) { s.t = 0; G.puff(s.x, s.y, s.q === 'boule' ? '#ff8a1e' : '#c9a56b', 5, 70, 3); } }
      R.pgTirs = R.pgTirs.filter(s => s.t > 0); }
    if (R.pgRochers && R.pgRochers.length) { for (const r of R.pgRochers) { r.x += r.vx * dt; r.a += r.vx * dt / 16; r.t -= dt; if (!W.walkPx(r.x + Math.sign(r.vx) * 14, r.y)) { r.t = 0; G.puff(r.x, r.y - 12, '#9a948a', 16, 140, 4); R.shake = Math.max(R.shake || 0, 0.15); if (CG.onScreen(r.x, r.y)) CG.sfx('tombe'); }
        else if (vivant && !r.touche && Math.hypot(p.x - r.x, p.y - r.y) < 24) { r.touche = true; blesser('rocher'); for (let i = 0; i < 5; i++) G.slide(p, 0, (p.y >= r.y ? 1 : -1) * 8); G.text(p.x, p.y - 74, '💥 Écrasé !', '#ff9a8a', true); } }
      R.pgRochers = R.pgRochers.filter(r => r.t > 0); }
  }
  // ---------- le piège part ----------
  function partir(o, d) {
    const R = CG.R, p = CG.S.player, vu = CG.onScreen(o.x, o.y); o.e = 'repos'; o.t = Pg.REPOS;
    if (o.k === 'piques') { o.e = 'actif'; o.t = 1.1; if (vu) CG.sfx('swing'); if (d < 24) { blesser('piques'); o.cd = R.t + 0.7; } }
    else if (o.k === 'fleche') { const m = mur(o); tir(m.x, m.y - 18, p.x, p.y - 16, 'fleche', 430); if (vu) CG.sfx('swing'); }
    else if (o.k === 'rafale') { o.e = 'actif'; o.n = 3; o.t2 = 0; o.de = mur(o); o.t = 2; }
    else if (o.k === 'explosion') { R.rings.push({ x: o.x, y: o.y - 6, r: 80, life: 0.4, col: '#ff8a1e' }); G.puff(o.x, o.y - 10, '#ff8a1e', 26, 200, 5); G.puff(o.x, o.y - 10, '#ffd24a', 12, 140, 4); R.shake = Math.max(R.shake || 0, 0.2); if (vu) CG.sfx('bouleFeu'); if (d < 62) blesser('explosion', true); }
    else if (o.k === 'gel') { R.rings.push({ x: o.x, y: o.y - 6, r: 95, life: 0.45, col: '#a8e4ff' }); G.puff(o.x, o.y - 10, '#e0f6ff', 26, 190, 4); if (vu) CG.sfx('spell'); if (d < 85) { blesser('gel'); if (CG.Loups && CG.Loups.geler) { CG.Loups.geler(); CG.Loups.geler(); } else R.gelMort = Math.max(R.gelMort || 0, 4); } }
    else if (o.k === 'trappe') { o.e = 'ouvert'; G.puff(o.x, o.y, '#6a5a48', 14, 110, 4); if (vu) CG.sfx('tombe'); if (d < 26) { blesser('trappe'); if (!(R.ko > 0)) { R.pgChute = { t: Pg.CHUTE, x: o.x, y: o.y + 4 }; G.text(o.x, o.y - 70, 'Aaaah !', '#ffe9a8', true); } } }
    else if (o.k === 'alarme') { o.t = 14; CG.sfx('bell'); G.text(o.x, o.y - 60, '🔔 DONG ! DONG !', '#ffe36b', true); for (let i = 0; i < 3; i++) R.rings.push({ x: o.x, y: o.y - 10, r: 120 + i * 140, life: 0.5 + i * 0.25, col: '#ffe36b' });
      for (const e of R.enemies) if (!e.dead && !e.struct && Math.hypot(e.x - o.x, e.y - o.y) < 760) { e.calm = false; e.target = p; e.aggroR = Math.max(e.aggroR || 0, 1200); G.text(e.x, e.y - 52, '❗', '#ff6a4a', true); } }
    else if (o.k === 'gaz') { o.e = 'actif'; o.t = Pg.GAZ[0]; o.tic = 0; G.puff(o.x, o.y - 10, '#9be04a', 20, 120, 5); if (vu) CG.sfx('spell'); }
    else if (o.k === 'rocher') { let g = 0, dr = 0; while (g < 8 && W.walkTile(o.tx - g - 1, o.ty)) g++; while (dr < 8 && W.walkTile(o.tx + dr + 1, o.ty)) dr++; const cote = g >= dr ? -1 : 1, n = Math.max(g, dr);
      (R.pgRochers = R.pgRochers || []).push({ x: o.x + cote * n * T, y: o.y, vx: -cote * 250, a: 0, t: 5 }); R.shake = Math.max(R.shake || 0, 0.12); G.text(o.x + cote * n * T, o.y - 50, '❗', '#ff6a4a', true); if (vu) CG.sfx('warning'); }
  }
  function pas(R, dt) {
    const p = CG.S.player, vivant = !(R.ko > 0) && !R.cine;
    for (const o of R.pgListe) { o.t -= dt; const d = Math.hypot(p.x - o.x, p.y - o.y);
      if (o.k === 'scie') { o.x += o.v * dt; if (o.x >= o.x1) { o.x = o.x1; o.v = -Pg.SCIE_V; } else if (o.x <= o.x0) { o.x = o.x0; o.v = Pg.SCIE_V; } o.a += dt * 16;
        if (vivant && d < 21 && !(o.cd > R.t)) { o.cd = R.t + 0.8; blesser('scie'); for (let i = 0; i < 4; i++) G.slide(p, 0, (p.y >= o.y ? 1 : -1) * 7); G.puff(p.x, p.y - 14, '#ffd0a0', 8, 100, 3); } continue; }
      if (o.k === 'guet') { const U = Pg.GUET, vers = Math.atan2(p.y - o.y, p.x - o.x), ec = Math.atan2(Math.sin(vers - o.a), Math.cos(vers - o.a)), voit = vivant && d < U.VUE && d > 14 && Math.abs(ec) < U.ANGLE && !(R.invis > 0) && W.lineClear(o.x, o.y, p.x, p.y);
        if (o.e !== 'vise') { o.a += U.TOURNE * o.sens * dt; if (voit) { o.e = 'vise'; o.perdu = 0; o.tir = U.ALERTE; if (CG.onScreen(o.x, o.y)) { G.text(o.x, o.y - 66, '❗', '#ff6a4a', true); CG.sfx('warning'); } } continue; }
        o.a += Math.max(-U.SUIT * dt, Math.min(U.SUIT * dt, ec)); /* elle suit du regard, mais sa tête a une vitesse limite : en tournant vite autour d'elle, tout près, on sort de son regard */
        if (voit) { o.perdu = 0; o.tir -= dt; if (o.tir <= 0) { o.tir = U.CADENCE; tir(o.x + Math.cos(o.a) * 12, o.y - 34 + Math.sin(o.a) * 5, p.x, p.y - 16, 'rayon', U.VITESSE, 'guet'); if (CG.onScreen(o.x, o.y)) CG.sfx('swing'); } }
        else { o.perdu += dt; if (o.perdu > U.PERD) { o.e = 'tourne'; o.sens = ec >= 0 ? 1 : -1; } }
        continue; }
      if (o.k === 'boule') { const B = Pg.BOULE; if (o.t <= 0 && vivant && d < B[1] && d > 30 && !(R.invis > 0) && W.lineClear(o.x, o.y + 10, p.x, p.y)) { o.t = B[0]; tir(o.x, o.y - 30, p.x, p.y - 16, 'boule', B[2]); if (CG.onScreen(o.x, o.y)) CG.sfx('bouleFeu'); } continue; }
      if (o.k === 'feu') { if (o.t <= 0) { if (o.e === 'souffle') { o.e = 'veille'; o.t = Pg.FEU[1]; } else { o.e = 'souffle'; o.t = Pg.FEU[0]; o.tic = 0.25; if (CG.onScreen(o.x, o.y)) CG.sfx('fire'); } }
        if (o.e === 'souffle' && vivant) { o.tic -= dt; if (o.tic <= 0) { o.tic = 0.4; const L = Pg.FEU_LONG * T, k = CG.clamp(((p.x - o.x) * o.dx + (p.y - o.y - 8) * o.dy) / L, 0, 1); if (Math.hypot(p.x - (o.x + o.dx * L * k), p.y - (o.y + 8 + o.dy * L * k)) < 19) blesser('feu', true); } } continue; }
      if (o.e === 'arme') { if (vivant && d < 15 && !(R.passe > 0)) { o.e = 'clic'; o.t = Pg.CLIC[o.k]; o.vu = true; G.text(o.x, o.y - 36, '*clic*', '#ffffff', true); CG.sfx('click'); } }
      else if (o.e === 'clic') { if (o.t <= 0) partir(o, d); }
      else if (o.e === 'actif') {
        if (o.k === 'piques') { if (vivant && d < 20 && !(o.cd > R.t)) { o.cd = R.t + 0.7; blesser('piques'); } }
        else if (o.k === 'rafale') { o.t2 -= dt; if (o.t2 <= 0 && o.n > 0) { o.n--; o.t2 = 0.22; const m = o.de; tir(m.x, m.y - 18, m.x + m.dx * 200, m.y - 18 + m.dy * 200, 'dard', 440, 'rafale'); if (CG.onScreen(o.x, o.y)) CG.sfx('swing'); } if (!o.n) o.t = Math.min(o.t, 0); }
        else if (o.k === 'gaz') { o.tic -= dt; if (o.tic <= 0) { o.tic = 0.5; if (vivant && d < Pg.GAZ[1]) { blesser('gaz'); if (CG.Marais && CG.Marais.venin) CG.Marais.venin(p, 4, Math.max(1, Pg.dmg('gaz'))); } } }
        if (o.t <= 0) { o.e = 'repos'; o.t = Pg.REPOS; } }
      else if (o.e === 'repos' && o.t <= 0) o.e = 'arme';
    }
  }
  const up0 = G.update; G.update = function (dt) {
    const R0 = CG.R, ch = R0 && R0.pgChute; up0.apply(this, arguments); const R = CG.R; if (!R || R !== R0 || !CG.S) return;
    if (ch && R.pgChute === ch) { const p = CG.S.player; p.x = ch.x; p.y = ch.y; p.moving = false; p.path = null; ch.t -= dt; if (ch.t <= 0 || R.ko > 0) { R.pgChute = null; G.puff(p.x, p.y - 10, '#c9b89a', 10, 90, 3); } } /* au fond de la trappe : le temps de remonter */
    if (!R.pgListe) { if (actif() && R.enemies && R.enemies.length && !(CG.Mondes && CG.Mondes.pending)) poser(R); return; }
    if (R.night) return; pas(R, dt); volants(R, dt);
  };
  Pg.essai = k => { const R = CG.R, p = CG.S.player, tx = Math.floor(p.x / T) + 2, ty = Math.floor(p.y / T), o = { k, tx, ty, x: (tx + 0.5) * T, y: (ty + 0.5) * T, e: 'arme', t: 0, vu: false, h: 0.5 }; if (k === 'boule' || k === 'feu') Object.assign(o, { e: 'veille', t: 1, dx: 0, dy: 1 }); if (k === 'scie') Object.assign(o, { x0: o.x - 60, x1: o.x + 60, v: Pg.SCIE_V, e: 'tourne', a: 0 }); (R.pgListe = R.pgListe || []).push(o); return o; };

  // ---------- dessin ----------
  const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const tri = (g, a, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[2], a[3]); g.lineTo(a[4], a[5]); g.closePath(); g.fill(); };
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R || !R.pgListe) return;
    for (const o of R.pgListe) { if (!CG.onScreen(o.x, o.y)) continue; const x = o.x, y = o.y;
      if (o.k === 'scie') { g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.x0 - 8, y + 2); g.lineTo(o.x1 + 8, y + 2); g.stroke(); continue; } /* la rainure où elle glisse */
      if (o.k === 'guet') { const U = Pg.GUET, v = o.e === 'vise', k = v ? 0.5 + Math.sin(t * 14) * 0.2 : 1; g.save(); g.translate(x, y + 4); g.scale(1, 0.62); g.fillStyle = v ? 'rgba(255,60,40,' + (0.2 * k).toFixed(2) + ')' : 'rgba(255,220,120,0.09)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, U.VUE * 0.55, o.a - U.ANGLE, o.a + U.ANGLE); g.closePath(); g.fill(); g.restore(); continue; } /* son regard, au sol */
      if (o.k === 'boule' || o.k === 'feu') continue;
      if (o.e === 'ouvert') { g.fillStyle = '#0a0806'; g.fillRect(x - 17, y - 17, 34, 34); g.fillStyle = '#3a2e22'; g.fillRect(x - 17, y - 17, 34, 5); g.fillStyle = 'rgba(120,96,70,0.8)'; g.fillRect(x - 19, y - 19, 38, 2); g.fillRect(x - 19, y + 17, 38, 2); continue; }
      if (R.oeilOmbre > 0 && o.e === 'arme' && Math.hypot(o.x - CG.S.player.x, o.y - CG.S.player.y) < Pg.OEIL) { /* l'Œil des ombres (ombre.js) : les dalles cachées près du chef luisent tant que le sort dure */
        const k = 0.5 + Math.sin(t * 5 + o.x * 0.05) * 0.5, f = Math.min(1, R.oeilOmbre / 1.5); ell(g, x, y, 30 + k * 4, 21 + k * 3, 'rgba(255,226,130,' + (0.2 * f).toFixed(2) + ')');
        g.fillStyle = 'rgba(255,226,130,' + ((0.45 + k * 0.2) * f).toFixed(2) + ')'; g.fillRect(x - 15, y - 15, 30, 30); g.strokeStyle = 'rgba(255,244,200,' + ((0.85 + k * 0.15) * f).toFixed(2) + ')'; g.lineWidth = 2.5; g.strokeRect(x - 15, y - 15, 30, 30); }
      const enf = o.e === 'clic' || o.e === 'actif'; /* bien cachée tant qu'on n'a pas marché dessus : un joint à peine plus sombre, un indice minuscule */
      g.fillStyle = enf ? 'rgba(0,0,0,0.3)' : o.vu ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.045)'; g.fillRect(x - 15, y - 15, 30, 30); g.strokeStyle = 'rgba(0,0,0,' + (o.vu ? 0.4 : 0.13) + ')'; g.lineWidth = 1; g.strokeRect(x - 14.5, y - 14.5, 29, 29);
      if (o.k === 'piques') { g.fillStyle = 'rgba(0,0,0,' + (o.vu ? 0.55 : 0.2) + ')'; for (let i = 0; i < 9; i++) g.fillRect(x - 10 + (i % 3) * 9, y - 10 + Math.floor(i / 3) * 9, 2, 2);
        if (o.e === 'actif') { const k = Math.min(1, (1.1 - o.t) / 0.08) * Math.min(1, o.t / 0.2); for (let i = 0; i < 9; i++) { const px = x - 9 + (i % 3) * 9, py = y - 8 + Math.floor(i / 3) * 9; tri(g, [px - 2.6, py + 1, px + 2.6, py + 1, px, py - 15 * k], '#c8ccd8'); tri(g, [px, py + 1, px + 2.6, py + 1, px, py - 15 * k], '#8a8e9a'); } } }
      else if (o.vu) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
      if (o.k === 'explosion' && o.e === 'clic') { const k = 1 - o.t / Pg.CLIC.explosion; ell(g, x, y, 62, 44, 'rgba(255,90,30,' + (0.12 + k * 0.22).toFixed(2) + ')'); ell(g, x, y, 62 * k, 44 * k, 'rgba(255,170,60,0.3)'); }
      if (o.k === 'gel' && o.e === 'clic') ell(g, x, y, 85, 60, 'rgba(150,220,255,0.2)');
    }
    for (const r of R.pgRochers || []) ell(g, r.x, r.y + 4, 20, 7, 'rgba(0,0,0,0.3)');
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    if (R.pgListe) for (const o of R.pgListe) { if (!CG.onScreen(o.x, o.y)) continue; const x = o.x, y = o.y;
      if (o.k === 'scie') { g.save(); g.translate(x, y - 6); g.rotate(o.a); g.fillStyle = '#b8bcc8'; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? 16 : 11; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); } g.closePath(); g.fill(); ell(g, 0, 0, 7, 5.6, '#8a8e9a'); ell(g, 0, 0, 2.5, 2, '#3a3c44'); g.restore(); }
      else if (o.k === 'feu' && o.e === 'souffle') { const L = Pg.FEU_LONG * T, k = Math.min(1, (Pg.FEU[0] - o.t) / 0.25) * Math.min(1, o.t / 0.3); for (let i = 0; i < 9; i++) { const u = (i + ((t * 3.2 + o.h) % 1)) / 9, px = x + o.dx * L * u + Math.sin(t * 11 + i * 1.9) * 4 * u, py = y + 2 + o.dy * L * u, r = (6 + u * 10) * k; ell(g, px, py, r, r * 0.9, 'rgba(255,90,30,' + (0.75 - u * 0.4).toFixed(2) + ')'); ell(g, px, py, r * 0.55, r * 0.5, 'rgba(255,210,90,' + (0.8 - u * 0.5).toFixed(2) + ')'); } }
      else if (o.k === 'gaz' && o.e === 'actif') { const a = Math.min(1, o.t / 0.8) * 0.3; for (let i = 0; i < 6; i++) { const an = i * 1.05 + t * 0.5, r = 22 + Math.sin(t * 1.3 + i) * 10; ell(g, x + Math.cos(an) * r, y - 10 + Math.sin(an) * r * 0.6, 26, 18, 'rgba(140,220,80,' + a.toFixed(2) + ')'); } } }
    for (const s of R.pgTirs || []) { if (s.q === 'rayon') { const a = Math.atan2(s.vy, s.vx); g.save(); g.translate(s.x, s.y); g.rotate(a); g.fillStyle = 'rgba(255,70,50,0.35)'; g.fillRect(-13, -4, 24, 8); g.fillStyle = '#ff5a3a'; g.fillRect(-11, -2, 20, 4); g.fillStyle = '#ffe0c0'; g.fillRect(-3, -1, 12, 2); g.restore(); continue; }
      if (s.q === 'boule') { ell(g, s.x, s.y, 9, 9, 'rgba(255,120,30,0.35)'); ell(g, s.x, s.y, 6, 6, '#ff7a1e'); ell(g, s.x - 1, s.y - 1, 3, 3, '#ffe08a'); ell(g, s.x - s.vx * 0.04, s.y - s.vy * 0.04, 4, 4, 'rgba(255,150,40,0.45)'); continue; }
      const a = Math.atan2(s.vy, s.vx); g.save(); g.translate(s.x, s.y); g.rotate(a); g.fillStyle = '#7a5630'; g.fillRect(-9, -0.8, 15, 1.6); tri(g, [5, -2.6, 11, 0, 5, 2.6], s.q === 'fleche' ? '#8ae04a' : '#d8dce8'); tri(g, [-9, 0, -12, -2.6, -6, 0], '#e8e0d0'); tri(g, [-9, 0, -12, 2.6, -6, 0], '#e8e0d0'); g.restore(); }
    for (const r of R.pgRochers || []) { g.save(); g.translate(r.x, r.y - 16); g.rotate(r.a); ell(g, 0, 0, 19, 18, '#7c766c'); ell(g, -4, -5, 11, 9, '#989288'); ell(g, 6, 6, 4, 3, '#5c564e'); ell(g, -8, 5, 3, 2.4, '#5c564e'); g.restore(); }
  };
  // les statues : un socle, une tête de dragon de pierre ; les yeux rougissent juste avant qu'elle tire ou crache
  const statue = { draw(g, o, t) { const x = o.x, y = o.y + 10, q = o.o, chaud = q.k === 'feu' ? (q.e === 'souffle' ? 1 : q.t < 0.7 ? 1 - q.t / 0.7 : 0) : (q.t < 0.6 && q.t > -3 ? 1 - Math.max(0, q.t) / 0.6 : 0);
      ell(g, x, y + 2, 17, 6, 'rgba(0,0,0,0.3)'); g.fillStyle = '#5c5a64'; g.fillRect(x - 13, y - 12, 26, 14); g.fillStyle = '#74727e'; g.fillRect(x - 15, y - 15, 30, 5); g.fillStyle = '#4a4852'; g.fillRect(x - 13, y - 2, 26, 4);
      g.fillStyle = '#6a6874'; g.beginPath(); g.moveTo(x - 10, y - 15); g.lineTo(x - 11, y - 34); g.quadraticCurveTo(x, y - 46, x + 11, y - 34); g.lineTo(x + 10, y - 15); g.closePath(); g.fill();
      tri(g, [x - 10, y - 36, x - 15, y - 50, x - 5, y - 40], '#56545e'); tri(g, [x + 10, y - 36, x + 15, y - 50, x + 5, y - 40], '#56545e'); /* les cornes */
      g.fillStyle = '#7e7c88'; g.beginPath(); g.moveTo(x - 7, y - 28); g.lineTo(x + 7, y - 28); g.lineTo(x + 5, y - 15); g.lineTo(x - 5, y - 15); g.closePath(); g.fill(); /* le museau */
      g.fillStyle = q.k === 'feu' ? '#1a1014' : '#2a2026'; g.beginPath(); g.ellipse(x, y - 19, 4.2, 3 + chaud * 1.5, 0, 0, TAU); g.fill(); if (chaud > 0) ell(g, x, y - 19, 3, 2 + chaud, 'rgba(255,140,40,' + (0.5 + chaud * 0.5).toFixed(2) + ')');
      const oe = chaud > 0 ? 'rgba(255,' + Math.round(90 + chaud * 60) + ',40,1)' : '#2a2630'; ell(g, x - 5, y - 33, 2.2, 1.8, oe); ell(g, x + 5, y - 33, 2.2, 1.8, oe); if (chaud > 0.3) { ell(g, x - 5, y - 33, 4.5, 4, 'rgba(255,120,40,0.25)'); ell(g, x + 5, y - 33, 4.5, 4, 'rgba(255,120,40,0.25)'); }
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x - 9, y - 38, 3, 20); } };
  // la sentinelle : un pieu de pierre trapu coiffé d'un heaume rond à visière ; la fente de la visière glisse autour du heaume avec le regard
  const guetteur = { draw(g, o, t) { const x = o.x, y = o.y + 10, q = o.o, v = q.e === 'vise', c = Math.cos(q.a), sn = Math.sin(q.a), hy = y - 36;
      ell(g, x, y + 2, 18, 6.5, 'rgba(0,0,0,0.32)'); g.fillStyle = '#4e4c58'; g.beginPath(); g.moveTo(x - 15, y + 2); g.lineTo(x - 11, y - 8); g.lineTo(x + 11, y - 8); g.lineTo(x + 15, y + 2); g.closePath(); g.fill(); /* le socle */
      g.fillStyle = '#62606c'; g.beginPath(); g.moveTo(x - 9, y - 8); g.lineTo(x - 7, y - 28); g.lineTo(x + 7, y - 28); g.lineTo(x + 9, y - 8); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 2, y - 28, 6, 20); g.strokeStyle = 'rgba(20,16,24,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 8, y - 16); g.lineTo(x + 8, y - 16); g.stroke(); /* le fût */
      ell(g, x, hy, 13, 11.5, '#74727e'); ell(g, x - 3, hy - 4, 7, 4.5, 'rgba(255,255,255,0.12)'); g.fillStyle = '#56545e'; g.beginPath(); g.moveTo(x - 4, hy - 11); g.lineTo(x, hy - 19); g.lineTo(x + 4, hy - 11); g.closePath(); g.fill(); /* le heaume et sa pointe */
      g.fillStyle = '#4a4852'; g.fillRect(x - 13, hy + 5, 26, 3);
      if (sn > -0.35) { const ex = x + c * 9, ey = hy + 1 + sn * 3, w = 7 * (0.45 + 0.55 * Math.max(0, sn + 0.35) / 1.35) + 2; g.fillStyle = '#1c1820'; g.fillRect(ex - w / 2 - 1, ey - 2.5, w + 2, 5); const k = v ? 0.7 + Math.sin(t * 16) * 0.3 : 0.75; g.fillStyle = v ? 'rgba(255,70,40,' + k.toFixed(2) + ')' : 'rgba(255,214,110,' + k.toFixed(2) + ')'; g.fillRect(ex - w / 2, ey - 1.3, w, 2.6); ell(g, ex, ey, w * 0.9, 4.5, v ? 'rgba(255,70,40,0.22)' : 'rgba(255,214,110,0.14)'); }
      else { g.strokeStyle = 'rgba(30,26,36,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - c * 6 - 3, hy - 2); g.lineTo(x - c * 6 + 3, hy + 3); g.moveTo(x - c * 6 + 3, hy - 2); g.lineTo(x - c * 6 - 3, hy + 3); g.stroke(); } /* de dos : une marque gravée derrière le heaume */
    } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R || !R.pgListe) return; for (const o of R.pgListe) { if (!CG.onScreen(o.x, o.y)) continue; if (o.k === 'boule' || o.k === 'feu') push(o.y + 8, 21, Object.assign({ x: o.x, y: o.y, o }, statue), null); else if (o.k === 'guet') push(o.y + 8, 21, Object.assign({ x: o.x, y: o.y, o }, guetteur), null); } }; }
})(window.CG);
