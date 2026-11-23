// Goblin Malin — la jungle des singes. Un coin de la forêt, à l'écart du village, est plus touffu que le reste : des fougères,
// des bananiers, des lianes. C'est là que vivent les singes, et ils sont tous méchants.
//   Huit espèces : chimpanzé, bonobo, gorille, orang-outan, gibbon, siamang, babouin, macaque. Chacune a trois rangs, de plus
//   en plus gros et de plus en plus forts (les rangs 2 et 3 n'arrivent que plus tard dans la partie).
//   Les lanceurs envoient des bananes en cloche (on voit où elles vont tomber). Les sauteurs se ramassent, puis bondissent de
//   très loin sur leur cible. Les autres cognent. Et quelques-uns restent perchés dans les arbres à lancer de petites bombes.
// Tout est réglable dans CG.Singes.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, dist = CG.dist, rand = CG.rand, pick = CG.pick, TAU = Math.PI * 2;
  const Si = CG.Singes = { RAYON: 9, LIEU: 'cache', NB: [2, 6], PAR_JOUR: 0.25, PERCHES: [7, 11], DESCEND: 0.55, VOIT: 175, EPARS: [2, 4], EPARS_LOIN: 24, RANG2: 6, RANG3: 12, LANCE_CD: [3, 4.6], LANCE_L: [80, 310], VOL: 0.95, BANANE_R: 26, BOMBE_R: 44, BOMBE_CD: [3.6, 5.4], BOMBE_L: 360,
    SAUT_CD: [4, 6.5], SAUT_L: [110, 430], ELAN: 0.45, SAUT: 0.7, SAUT_R: 32, HAUT: 74 }; /* SAUT_L : de combien un sauteur peut bondir (dix fois le petit saut d'une gelée) */
  // espèce : [nom, vie, dégâts, vitesse, taille, façon de se battre, poil, visage, longs bras]
  Si.ESPECES = {
    chimpanze: ['Chimpanzé', 22, 5, 120, 1, 'lance', '#3a2a22', '#d8a880', 1], bonobo: ['Bonobo', 18, 4, 135, 0.95, 'saute', '#1e1a1c', '#6a4a44', 1.05],
    gorille: ['Gorille', 60, 11, 88, 1.5, 'cogne', '#3c3e44', '#2a2a2e', 1], orangOutan: ['Orang-outan', 40, 8, 92, 1.25, 'lance', '#c8602a', '#7a4a3a', 1.3],
    gibbon: ['Gibbon', 14, 4, 150, 0.8, 'saute', '#d8c8a0', '#2a2422', 1.4], siamang: ['Siamang', 20, 5, 140, 0.95, 'saute', '#18161a', '#3a3438', 1.35],
    babouin: ['Babouin', 28, 7, 126, 1.05, 'cogne', '#8a7a4a', '#c8785a', 0.9], macaque: ['Macaque', 16, 4, 130, 0.85, 'lance', '#9a8a70', '#e8a898', 0.9] };
  Si.RANGS = [['', 1, 1, 1], [' costaud', 1.6, 1.4, 1.13], [' alpha', 2.5, 1.9, 1.27]]; // [suffixe, vie, dégâts, taille]
  const INFO = {};
  Object.keys(Si.ESPECES).forEach(k => { const q = Si.ESPECES[k]; Si.RANGS.forEach((r, i) => { const id = k + (i + 1); CG.ENEMIES[id] = { nom: q[0] + r[0], race: 'bete', hp: Math.round(q[1] * r[1]), dmg: Math.round(q[2] * r[2] * 10) / 10, spd: q[3] + i * 6, xp: Math.round((5 + q[1] * 0.35) * (1 + i * 0.8)), or: 1 + i * 2, cost: 2 + i * 1.5, r: Math.round(11 * q[4] * r[3]) }; INFO[id] = { esp: k, rang: i, taille: q[4] * r[3], mode: q[5], poil: q[6], face: q[7], bras: q[8] }; }); });
  Si.info = t => INFO[t] || null;
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && !g.perch && g.ko !== true) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); if (R.golem && !R.golem.dead) l.push(R.golem); for (const s of R.miroirs || []) if (!s.dead) l.push(s); return l; };
  function frappe(o, dmg) { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (o.summon) CG.Magie.hurt(o, dmg); else if (o.pet) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); }
  const libre = e => !(e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.kb || e.retreat);
  const visee = (e, L) => { const S = CG.S, R = CG.R; let b = e.target && !e.target.dead && !e.target.hidden && e.target.ko !== true && !(e.target.type && CG.ENEMIES[e.target.type]) ? e.target : null; if (b === S.player && (R.ko > 0 || R.invis > 0)) b = null; if (b || !L) return b; let bd = L; for (const o of nous()) { const d = dist(e, o); if (d < bd) { bd = d; b = o; } } return b; };
  // ---------- ce qui vole : bananes et petites bombes, en cloche ----------
  function lancer(e, tg, bombe) { const R = CG.R, d = dist(e, tg) || 1; (R.singeTirs = R.singeTirs || []).push({ x0: e.x + (e.face || 1) * 8, y0: e.y - (e.perche ? Si.HAUT : 22), x1: tg.x, y1: tg.y, t: 0, dur: Si.VOL * CG.clamp(d / 240, 0.6, 1.4), dmg: e.dmg * (bombe ? 1.2 : 0.9), bombe: !!bombe, rot: Math.random() * 6 }); e.atkAnim = 1; e.face = tg.x > e.x ? 1 : -1; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
  Si.lancer = lancer;
  function tombe(s) { const R = CG.R, r = s.bombe ? Si.BOMBE_R : Si.BANANE_R;
    if (s.bombe) { G.puff(s.x1, s.y1 - 6, '#ff8a1e', 18, 160, 4); G.puff(s.x1, s.y1 - 6, '#4a4040', 10, 90, 4); R.rings.push({ x: s.x1, y: s.y1, r: r + 10, life: 0.35, col: '#ffb432' }); if (CG.onScreen(s.x1, s.y1)) CG.sfx('hit'); } else G.puff(s.x1, s.y1 - 4, '#ffe36b', 7, 80, 3);
    for (const o of nous()) if (Math.hypot(o.x - s.x1, (o.y - s.y1) / 0.8) < r) frappe(o, s.dmg); }
  // ---------- chacun sa façon ----------
  function pas(e, dt) {
    const R = CG.R, I = INFO[e.type], q = e.sg;
    if (e.perche && e.descend && libre(e)) { const tg = visee(e, Si.VOIT); if (tg && dist(e, tg) < Si.VOIT) { const y1 = (e.pty + 1) * T + T / 2; e.perche = false; e.descend = false; e.spd = CG.ENEMIES[e.type].spd; e.aggroR = 260; e.leash = 560; e.rooted = 0; e.target = tg; e.calm = false; e.sgCd = rand(1.2, 2.5); e.sg = { ph: 'vol', t: 0.4, dur: 0.4, x0: e.x, y0: e.y, x1: e.x, y1: y1, h: 0 }; G.puff(e.x, e.y - Si.HAUT + 10, '#2a6a30', 8, 90, 3); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); return; } }
    if (e.perche) { e.rooted = Math.max(e.rooted || 0, 0.3); e.moving = false; e.path = null; e.atkCd = Math.max(e.atkCd, 0.5); e.calm = false; e.sgCd = (e.sgCd === undefined ? rand(1, 3) : e.sgCd) - dt; if (e.sgCd > 0 || !libre(e)) return; const tg = visee(e, Si.BOMBE_L); if (!tg || dist(e, tg) > Si.BOMBE_L) return; e.sgCd = rand(Si.BOMBE_CD[0], Si.BOMBE_CD[1]); lancer(e, tg, true); return; }
    if (q) { // un bond : il se ramasse, puis vole jusqu'à l'endroit visé
      e.rooted = Math.max(e.rooted || 0, 0.12); e.atkCd = Math.max(e.atkCd, 0.4); e.path = null; e.moving = false; q.t -= dt;
      if (q.ph === 'elan') { if (!libre(e)) { e.sg = null; return; } if (q.t <= 0) { q.ph = 'vol'; q.t = q.dur = Si.SAUT * CG.clamp(Math.hypot(q.x1 - e.x, q.y1 - e.y) / 300, 0.6, 1.3); q.x0 = e.x; q.y0 = e.y; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } return; }
      const k = 1 - Math.max(0, q.t) / q.dur; e.x = q.x0 + (q.x1 - q.x0) * k; e.y = q.y0 + (q.y1 - q.y0) * k; q.h = Math.sin(k * Math.PI) * Si.HAUT * CG.clamp(q.dur / Si.SAUT, 0.7, 1.3); e.face = q.x1 > q.x0 ? 1 : -1;
      if (q.t <= 0) { e.sg = null; e.sgCd = rand(Si.SAUT_CD[0], Si.SAUT_CD[1]); e.x = q.x1; e.y = q.y1; R.rings.push({ x: e.x, y: e.y, r: Si.SAUT_R + 14, life: 0.35, col: '#d8c8a0' }); G.puff(e.x, e.y - 2, '#b8a888', 12, 120, 4); if (CG.onScreen(e.x, e.y)) CG.sfx('hit'); for (const o of nous()) if (Math.hypot(o.x - e.x, o.y - e.y) < Si.SAUT_R) frappe(o, e.dmg * 1.2); }
      return; }
    if (I.mode === 'cogne') return;
    e.sgCd = (e.sgCd === undefined ? rand(1.5, 3.5) : e.sgCd) - dt; if (e.sgCd > 0 || !libre(e) || e.rooted > 0.2) return; const tg = visee(e); if (!tg) return; const d = dist(e, tg);
    if (I.mode === 'lance') { if (d < Si.LANCE_L[0] || d > Si.LANCE_L[1] || !W.lineClear(e.x, e.y, tg.x, tg.y)) return; e.sgCd = rand(Si.LANCE_CD[0], Si.LANCE_CD[1]); e.rooted = Math.max(e.rooted || 0, 0.45); lancer(e, tg, false); return; }
    if (d < Si.SAUT_L[0] || d > Si.SAUT_L[1]) return; let x = tg.x, y = tg.y; if (!W.walkPx(x, y)) return; // un sauteur : il passe par-dessus les arbres
    e.sg = { ph: 'elan', t: Si.ELAN, x1: x, y1: y, h: 0 }; e.face = x > e.x ? 1 : -1;
  }
  const up0 = G.update; G.update = function (dt) {
    const R = CG.R;
    if (R && R.enemies && !R.night) { for (const e of R.enemies) if (!e.dead && INFO[e.type]) pas(e, dt);
      const L = R.singeTirs; if (L && L.length) { for (const s of L) { s.t += dt; if (s.t >= s.dur) tombe(s); } R.singeTirs = L.filter(s => s.t < s.dur); } }
    return up0.apply(this, arguments);
  };
  // ---------- la jungle : où elle est, ce qui y pousse, qui y vit ----------
  Si.lieu = function () { // toujours au même endroit : le coin en bas à gauche de la carte, autour de la cachette
    const S = CG.S; if (!S || (CG.Mondes && CG.Mondes.ici() !== 0)) return null; if (S.jungle && S.jungle.v === 2 && W.inMap(S.jungle.x, S.jungle.y)) return S.jungle;
    const P = W.POI && W.POI[Si.LIEU], R0 = Si.RAYON, x = P ? P.x : 8, y = P ? P.y : CG.MH - 8;
    S.jungle = { x: CG.clamp(x + 2, R0 - 2, CG.MW - R0 + 2), y: CG.clamp(y - 2, R0 - 2, CG.MH - R0 + 2), r: R0, v: 2 }; return S.jungle;
  };
  const rang = () => { const d = CG.S.day, k = Math.random(); return d >= Si.RANG3 && k < 0.22 ? 3 : d >= Si.RANG2 && k < 0.5 ? 2 : 1; };
  Si.peupler = function () {
    const S = CG.S, R = CG.R, J = Si.lieu(); if (!J) return 0; const esp = Object.keys(Si.ESPECES); let nb = 0;
    const n = Math.min(Si.NB[1], Math.round(Si.NB[0] + (S.day - 1) * Si.PAR_JOUR));
    for (let i = 0, k = 0; i < n && k < 300; k++) { const a = Math.random() * TAU, d = Math.random() * (J.r - 1), tx = Math.round(J.x + Math.cos(a) * d), ty = Math.round(J.y + Math.sin(a) * d * 0.85); if (!W.inMap(tx, ty) || !W.walkTile(tx, ty)) continue;
      const e = G.spawnEnemy(pick(esp) + rang(), tx * T + T / 2, ty * T + T / 2, { wild: true, exact: true }); if (!e) continue; e.jungle = true; e.aggroR = 230; e.leash = 520; i++; nb++; }
    const np = Si.PERCHES[0] + Math.floor(Math.random() * (Si.PERCHES[1] - Si.PERCHES[0] + 1));
    for (let i = 0, k = 0; i < np && k < 300; k++) { const a = Math.random() * TAU, d = Math.random() * J.r, tx = Math.round(J.x + Math.cos(a) * d), ty = Math.round(J.y + Math.sin(a) * d * 0.85); if (!W.inMap(tx, ty) || W.tile[W.idx(tx, ty)] !== W.TREE || !W.walkTile(tx, ty + 1) || R.enemies.some(o => o.perche && Math.abs(o.ptx - tx) + Math.abs(o.pty - ty) < 3)) continue;
      const bas = Math.random() < Si.DESCEND, e = G.spawnEnemy(pick(bas ? esp : ['macaque', 'chimpanze', 'gibbon', 'orangOutan']) + rang(), tx * T + T / 2, ty * T + T / 2 + 17, { wild: true, exact: true }); if (!e) continue; e.jungle = true; e.perche = true; e.descend = bas; e.ptx = tx; e.pty = ty; e.aggroR = 0; e.leash = 9999; e.spd = 0; i++; nb++; }
    /* quelques singes éparpillés ailleurs dans la forêt, loin du village */
    const ne = Si.EPARS[0] + Math.floor(Math.random() * (Si.EPARS[1] - Si.EPARS[0] + 1));
    for (let i = 0, k = 0; i < ne && k < 400; k++) { const tx = 3 + Math.floor(Math.random() * (CG.MW - 6)), ty = 3 + Math.floor(Math.random() * (CG.MH - 6)); if (!W.walkTile(tx, ty) || Math.hypot(tx - W.CX, ty - W.CY) < Si.EPARS_LOIN || Math.hypot(tx - J.x, ty - J.y) < J.r + 4) continue; let arbre = false; for (let dy = -1; dy <= 1 && !arbre; dy++) for (let dx = -1; dx <= 1; dx++) if (W.tile[W.idx(tx + dx, ty + dy)] === W.TREE) { arbre = true; break; } if (!arbre) continue;
      const e = G.spawnEnemy(pick(esp) + rang(), tx * T + T / 2, ty * T + T / 2, { wild: true, exact: true }); if (!e) continue; e.aggroR = 200; e.leash = 420; i++; nb++; }
    return nb;
  };
  const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments); try { if (CG.S && (!CG.Mondes || CG.Mondes.ici() === 0)) Si.peupler(); } catch (e) { /* jamais bloquant */ } return r; };
  // le décor : un sol plus sombre et plus vert, des fougères, des bananiers (rien ne bloque le passage)
  let deco = null, decoCle = '';
  function decor() { const J = Si.lieu(); if (!J) return null; const cle = J.x + ':' + J.y + ':' + (CG.S.seed || 0); if (deco && decoCle === cle) return deco; decoCle = cle; const rng = CG.makeRng((CG.S.seed || 1) + J.x * 31 + J.y * 17), L = [];
    for (let i = 0; i < 110; i++) { const a = rng() * TAU, d = Math.sqrt(rng()) * (J.r + 0.5) * T, x = J.x * T + Math.cos(a) * d, y = J.y * T + Math.sin(a) * d * 0.85; if (!W.walkPx(x, y)) continue; L.push({ x, y, k: rng() < 0.16 ? 'bananier' : rng() < 0.5 ? 'fougere' : 'fleur', s: 0.8 + rng() * 0.5, v: rng() }); }
    deco = { J, sol: L.filter(o => o.k !== 'bananier'), haut: L.filter(o => o.k === 'bananier') }; return deco; }
  const el = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const Dk = CG.S && (!CG.Mondes || CG.Mondes.ici() === 0) ? decor() : null; if (!Dk) return; const J = Dk.J, cx = J.x * T, cy = J.y * T, R0 = (J.r + 2) * T;
    if (CG.onScreen(cx, cy) || CG.onScreen(cx - R0, cy) || CG.onScreen(cx + R0, cy) || CG.onScreen(cx, cy - R0) || CG.onScreen(cx, cy + R0)) { g.save(); g.translate(cx, cy); g.scale(1, 0.85); const gd = g.createRadialGradient(0, 0, R0 * 0.2, 0, 0, R0); gd.addColorStop(0, 'rgba(10,70,30,0.34)'); gd.addColorStop(0.75, 'rgba(10,70,30,0.26)'); gd.addColorStop(1, 'rgba(10,70,30,0)'); g.fillStyle = gd; g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.fill(); g.restore(); }
    for (const o of Dk.sol) { if (!CG.onScreen(o.x, o.y)) continue; if (o.k === 'fougere') { for (let i = -2; i <= 2; i++) el(g, o.x + i * 5 * o.s, o.y - 4 * o.s - Math.abs(i) * -1.5, 2.6 * o.s, 9 * o.s, i % 2 ? '#2f8a3a' : '#3fa048', i * 0.42 + Math.sin(t * 1.4 + o.v * 9) * 0.04); } else { el(g, o.x, o.y, 3 * o.s, 3 * o.s, o.v < 0.5 ? '#ff5a7a' : '#ffb03a'); el(g, o.x, o.y, 1.2 * o.s, 1.2 * o.s, '#fff2a8'); el(g, o.x - 5 * o.s, o.y + 2, 4 * o.s, 2 * o.s, '#2f8a3a', 0.4); } }
    // là où une banane ou une bombe va tomber
    for (const s of (CG.R.singeTirs || [])) { const k = s.t / s.dur, r = (s.bombe ? Si.BOMBE_R : Si.BANANE_R); g.strokeStyle = s.bombe ? 'rgba(255,90,60,' + (0.35 + k * 0.5) + ')' : 'rgba(255,220,90,' + (0.3 + k * 0.5) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(s.x1, s.y1, r * (0.5 + k * 0.5), r * 0.8 * (0.5 + k * 0.5), 0, 0, TAU); g.stroke(); el(g, s.x1, s.y1, r * 0.3 * k, r * 0.24 * k, 'rgba(0,0,0,0.2)'); }
  };
  const bananier = { draw(g, o, t) { const x = o.x, y = o.y, s = o.s, b = Math.sin(t * 1.2 + o.v * 7) * 0.05; el(g, x, y + 2, 14 * s, 5 * s, 'rgba(0,0,0,0.22)');
    g.fillStyle = '#7a8a3a'; g.fillRect(x - 3 * s, y - 34 * s, 6 * s, 36 * s); g.fillStyle = '#5a6a2a'; g.fillRect(x + 0.5 * s, y - 34 * s, 2.5 * s, 36 * s);
    [[-1.1, 26], [-0.5, 30], [0.2, 31], [0.8, 28], [1.35, 24]].forEach((q, i) => { g.save(); g.translate(x, y - 34 * s); g.rotate(q[0] + b * (i - 2)); el(g, 0, -q[1] * s * 0.5, 6.5 * s, q[1] * s * 0.5, i % 2 ? '#3fa048' : '#2f8a3a'); g.fillStyle = 'rgba(20,70,30,0.5)'; g.fillRect(-0.6, -q[1] * s, 1.2, q[1] * s); g.restore(); });
    if (o.v > 0.4) for (let i = 0; i < 4; i++) el(g, x + (i - 1.5) * 3.2 * s, y - 30 * s + Math.abs(i - 1.5) * -1.5, 1.9 * s, 5.5 * s, '#ffd83a', (i - 1.5) * 0.22); } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (CG.Mondes && CG.Mondes.ici() !== 0) return; const Dk = decor(); if (!Dk) return; for (const o of Dk.haut) if (CG.onScreen(o.x, o.y)) push(o.y, 21, Object.assign(o, bananier), null); }; }
  // ---------- le dessin d'un singe ----------
  const TEINTE = [1, 0.8, 0.62]; // les rangs 2 et 3 : un poil plus sombre
  const fonce = (c, k) => { const n = parseInt(c.slice(1), 16); return 'rgb(' + Math.round((n >> 16) * k) + ',' + Math.round(((n >> 8) & 255) * k) + ',' + Math.round((n & 255) * k) + ')'; };
  function singe(g, e, t) {
    const I = INFO[e.type], q = e.sg, tt = t + (e.seed || 0), f = e.face < 0 ? -1 : 1, s = I.taille, poil = fonce(I.poil, TEINTE[I.rang]), poil2 = fonce(I.poil, TEINTE[I.rang] * 0.72), face = I.face, B = I.bras;
    const vol = q && q.ph === 'vol', elan = q && q.ph === 'elan', haut = e.perche ? Si.HAUT - 8 : vol ? q.h : 0, marche = e.moving ? Math.sin((e.step || 0) * 1.7) : 0, lance = Math.max(0, e.atkAnim || 0);
    const torse = !!(e.gor && e.gor.ph === 'torse'), porte = !!(e.gor && e.gor.ph === 'baril'), pattes = I.esp === 'gorille' && e.moving && lance < 0.05 && !e.gor && !vol && !e.perche; /* le gorille : il se tape le torse, lève un baril, ou marche sur les poings (gorille.js) */
    if (!e.perche) Art.shadow(g, e.x, e.y + 1, 12 * s * (vol ? 0.6 : 1));
    g.save(); g.translate(e.x, e.y - haut); g.scale(f * s, s * (elan ? 0.82 : 1)); if (vol) g.rotate(-0.25); if (pattes) { g.translate(0, -Math.abs(marche) * 1.6); g.rotate(0.3); } if (torse) g.translate(0, -Math.abs(Math.sin(tt * 11)) * 1.5);
    if (e.perche) { el(g, 0, -2, 15, 5, '#2a6a30'); } // un bout de feuillage sous lui
    el(g, -5, -2, 4.2, 3, poil2); el(g, 5, -2, 4.2, 3, poil2); // les pieds
    el(g, 0, -13, 10.5, 11.5, poil); el(g, 1, -11, 6.5, 7.5, 'rgba(255,255,255,0.1)'); if (I.esp === 'gorille' && I.rang === 2) el(g, -2, -18, 8, 4, 'rgba(210,214,224,0.75)'); // le dos argenté de l'alpha
    if (I.esp === 'babouin') el(g, -8, -6, 3.4, 3, '#e05a5a'); if (I.esp === 'siamang') el(g, 2, -20, 4.5 + Math.sin(tt * 3) * 1.2, 4 + Math.sin(tt * 3) * 1.2, '#8a8088');
    const main = (cote, leve) => { const sx = cote * 9, sy = -20, hx = torse ? cote * (3 + 5 * Math.max(0, Math.sin(tt * 22) * cote)) : porte ? cote * 9 : pattes ? 13 + cote * 3 + marche * cote * 6 : leve ? cote * 13 : cote * (10 + 3 * B) + marche * cote * 2, hy = torse ? -15 : porte ? -41 : pattes ? -5 - Math.max(0, marche * cote) * 4 : leve ? -34 - 6 * lance : (vol ? -30 : -2 - 4 * (B - 1) + marche * 2 * cote); g.strokeStyle = poil2; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cote * (15 + 3 * B), (sy + hy) / 2, hx, hy); g.stroke(); el(g, hx, hy, 3, 2.6, face); };
    main(-1, false); main(1, lance > 0.05 || e.perche);
    el(g, -8.5, -31, 3.2, 3.6, face); el(g, 8.5, -31, 3.2, 3.6, face); el(g, 0, -30, 9, 8.6, poil); // les oreilles et la tête
    if (I.esp === 'orangOutan') { el(g, -8, -27, 3.4, 6, fonce(I.face, 0.8)); el(g, 8, -27, 3.4, 6, fonce(I.face, 0.8)); } if (I.esp === 'gibbon') el(g, 0, -29, 7.4, 7, '#f4ecd8');
    el(g, 0.8, -28.5, 6.4, 6, face); el(g, 1.2, -25.4, 4.8, 3.5, fonce(face, 1.12)); if (I.esp === 'babouin') el(g, 2.5, -24.6, 5.4, 3, fonce(face, 0.9));
    el(g, -1.8, -30, 1.9, 2, '#fff'); el(g, 4, -30, 1.9, 2, '#fff'); el(g, -1.3, -29.8, 0.9, 1.1, '#1a1010'); el(g, 4.5, -29.8, 0.9, 1.1, '#1a1010');
    g.strokeStyle = '#1a1010'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-4.4, -33.4); g.lineTo(-0.2, -31.8); g.moveTo(6.6, -33.4); g.lineTo(2.4, -31.8); g.stroke(); // l'air méchant
    if (lance > 0.2 || vol || torse) { el(g, 1.4, -24.6, 2.8, 2.2, '#3a0a10'); g.fillStyle = '#fff'; g.fillRect(-0.4, -26, 1.2, 1.3); g.fillRect(2, -26, 1.2, 1.3); } else { g.beginPath(); g.moveTo(-1, -24.4); g.lineTo(3.6, -24.4); g.stroke(); }
    if (I.esp === 'bonobo') { g.strokeStyle = poil2; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -38.4); g.lineTo(-5, -35); g.moveTo(0, -38.4); g.lineTo(5, -35); g.stroke(); }
    g.restore();
  }
  const en0 = Art.enemy; Art.enemy = function (g, e, t) { if (INFO[e.type]) return singe(g, e, t); return en0.apply(this, arguments); };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const L = CG.R && CG.R.singeTirs; if (!L || !L.length) return;
    for (const s of L) { const k = s.t / s.dur, x = s.x0 + (s.x1 - s.x0) * k, y = s.y0 + (s.y1 - s.y0) * k - Math.sin(k * Math.PI) * 70; if (!CG.onScreen(x, y)) continue; g.save(); g.translate(x, y); g.rotate(s.rot + s.t * 9);
      if (s.bombe) { el(g, 0, 0, 5.5, 5.5, '#2a2424'); el(g, -1.6, -1.8, 1.8, 1.4, 'rgba(255,255,255,0.3)'); g.fillStyle = '#8a6a3a'; g.fillRect(-1, -8.5, 2, 3.5); el(g, 0, -9.5, 2 + Math.sin(t * 30) * 0.8, 2 + Math.sin(t * 30) * 0.8, '#ffb432'); }
      else { g.strokeStyle = '#ffd83a'; g.lineWidth = 4.2; g.lineCap = 'round'; g.beginPath(); g.arc(0, -4, 7.5, 0.5, 2.64); g.stroke(); g.strokeStyle = '#c89a1a'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, -4, 9.2, 0.6, 2.5); g.stroke(); el(g, 6.4, 0, 1.3, 1.3, '#5a4018'); }
      g.restore(); } };
  Si.poser = function (type, x, y) { const p = CG.S.player, o = G.spawnEnemy(type, x === undefined ? p.x + 150 : x, y === undefined ? p.y : y, { wild: true, exact: true }); if (o) { o.calm = false; o.aggroR = 360; } return o; }; // pour les essais
})(window.CG);
