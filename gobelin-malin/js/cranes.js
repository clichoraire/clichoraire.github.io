// Goblin Malin — de nouveaux morts pour les donjons à squelettes (crypte, galerie hantée...) : les crânes ailés et le dragon squelette.
//   Crâne ailé (blanc)   : une tête de mort à ailes de chauve-souris. Il prend son élan et fonce tout droit, comme un sanglier, sans repousser.
//   Crâne de braise      : plus rapide, plus fort. Toutes les dix secondes il s'arrête et crache du feu devant lui pendant trois secondes.
//   Crâne sorcier (mauve): il lance des boules de feu, se téléporte, tire une rafale de petites boules d'énergie mauve, et fait
//                          apparaître des reflets de lui-même : pareils à l'œil, mais un seul coup les brise et ils ne font presque rien.
//   Dragon squelette     : blanc (fort comme un squelette noir), puis rouge, puis noir. Il mord, crache un grand souffle, et le noir appelle des crânes.
// Dans un donjon, une partie des squelettes ordinaires est remplacée par ces créatures, selon le jour. Tout est réglable dans CG.Cranes.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, dist = CG.dist, rand = CG.rand, TAU = Math.PI * 2;
  const Cn = CG.Cranes = { PART: 0.3, ROUGE: [5, 0.38], MAUVE: [9, 0.22], DRAGON: 0.1, DRAGON_JOUR: 6, DRAGON_ROUGE: [11, 0.4], DRAGON_NOIR: [18, 0.3],
    ELAN: 0.55, FONCE: 0.62, FONCE_V: 470, CHARGE_CD: [3, 5], FEU_CD: 10, FEU: 3, FEU_L: 135, FEU_A: 0.38, FEU_TIC: 0.35,
    SORT_CD: [4.5, 6.5], RAFALE: 1.6, RAFALE_PAS: 0.16, ORBE_V: 300, REFLETS: 2, SOUFFLE_CD: 8, SOUFFLE: 2.5, SOUFFLE_L: 195, SOUFFLE_A: 0.42, APPEL_CD: 16 };
  Object.assign(CG.ENEMIES, {
    craneBlanc: { nom: 'Crâne ailé', race: 'mort', hp: 18, dmg: 5, spd: 125, xp: 9, or: 3, cost: 2, r: 10 },
    craneRouge: { nom: 'Crâne de braise', race: 'mort', hp: 34, dmg: 8, spd: 160, xp: 18, or: 7, cost: 3.5, r: 10 },
    craneMauve: { nom: 'Crâne sorcier', race: 'mort', hp: 58, dmg: 10, spd: 165, xp: 36, or: 14, cost: 6, r: 11, range: 230, magic: true },
    craneReflet: { nom: 'Reflet', race: 'mort', hp: 1, dmg: 1, spd: 165, xp: 0, or: 0, cost: 0, r: 11, range: 230, magic: true },
    dragonOs: { nom: 'Dragon squelette', race: 'mort', hp: 80, dmg: 13, spd: 100, xp: 45, or: 20, cost: 7, r: 20 },
    dragonOsRouge: { nom: 'Dragon squelette rouge', race: 'mort', hp: 140, dmg: 18, spd: 112, xp: 80, or: 34, cost: 11, r: 22 },
    dragonOsNoir: { nom: 'Dragon squelette noir', race: 'mort', hp: 230, dmg: 24, spd: 122, xp: 140, or: 55, cost: 16, r: 24 } });
  const CRANE = { craneBlanc: 1, craneRouge: 1, craneMauve: 1, craneReflet: 1 }, DRAGON = { dragonOs: 1, dragonOsRouge: 1.15, dragonOsNoir: 1.3 };
  // ---------- ceux qu'ils visent ----------
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && !g.perch && g.ko !== true) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); if (R.golem && !R.golem.dead) l.push(R.golem); for (const s of R.miroirs || []) if (!s.dead) l.push(s); return l; };
  function frappe(o, dmg) { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (o.summon) CG.Magie.hurt(o, dmg); else if (o.pet) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); }
  const cible = e => { const t = e.target, S = CG.S, R = CG.R; return t && !t.dead && !t.hidden && t.ko !== true && !(t === S.player && (R.ko > 0 || R.invis > 0)) && !(t.type && CG.ENEMIES[t.type]) ? t : null; };
  const libre = e => !(e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.kb || e.retreat);
  const fige = e => { e.rooted = Math.max(e.rooted || 0, 0.12); e.atkCd = Math.max(e.atkCd, 0.35); e.moving = false; e.path = null; };
  const flamme = (x, y, a, v, cols) => CG.R.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.86, life: 0.42, max: 0.42, col: cols[Math.floor(Math.random() * cols.length)], size: 3 + Math.random() * 3, float: true });
  const FEUX = { craneRouge: ['#ffb432', '#ff7a2a', '#ff4a1e'], dragonOs: ['#e8f6ff', '#9ad8ff', '#5aa8ff'], dragonOsRouge: ['#ffd23a', '#ff7a2a', '#e03a1e'], dragonOsNoir: ['#e0a8ff', '#a05aff', '#5a2aa8'] };
  // un souffle : pendant qu'il dure, tout ce qui est dans le cône devant la bête brûle
  function souffle(e, dt, L, A, bx, by) {
    const q = e.cn; q.t -= dt; q.tic -= dt; fige(e); e.face = Math.cos(q.a) >= 0 ? 1 : -1; e.atkAnim = Math.max(e.atkAnim, 0.6);
    for (let i = 0; i < 3; i++) flamme(bx, by, q.a + (Math.random() - 0.5) * A * 1.8, L * (1.6 + Math.random() * 0.9), FEUX[e.type]);
    if (q.tic <= 0) { q.tic = Cn.FEU_TIC; for (const o of nous()) { const dx = o.x - e.x, dy = o.y - e.y, d = Math.hypot(dx, dy); if (d > L + 10) continue; let da = Math.atan2(dy, dx) - q.a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < A) frappe(o, e.dmg * q.k); } }
    if (q.t <= 0 || !libre(e)) e.cn = null;
  }
  function pasCrane(e, dt) {
    const R = CG.R, tg = cible(e), q = e.cn;
    if (e.type === 'craneBlanc') {
      if (!q) { e.cnCd = (e.cnCd === undefined ? rand(1.5, 3.5) : e.cnCd) - dt; if (e.cnCd > 0 || !tg || !libre(e)) return; const d = dist(e, tg); if (d < 70 || d > 300 || !W.lineClear(e.x, e.y, tg.x, tg.y)) return;
        e.cn = { ph: 'elan', t: Cn.ELAN, a: Math.atan2(tg.y - e.y, tg.x - e.x) }; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); return; }
      fige(e); q.t -= dt; if (!libre(e)) { e.cn = null; e.cnCd = 2; return; }
      if (q.ph === 'elan') { if (tg) q.a = Math.atan2(tg.y - e.y, tg.x - e.x); e.face = Math.cos(q.a) >= 0 ? 1 : -1; if (q.t <= 0) { q.ph = 'fonce'; q.t = Cn.FONCE; q.touche = false; } return; }
      const x0 = e.x, y0 = e.y; G.slide(e, Math.cos(q.a) * Cn.FONCE_V * dt, 0, e.r); G.slide(e, 0, Math.sin(q.a) * Cn.FONCE_V * dt, e.r); e.moving = true;
      if (Math.random() < dt * 30) R.parts.push({ x: e.x, y: e.y - 24, vx: 0, vy: 0, life: 0.25, max: 0.25, col: '#f2eedc', size: 3, float: true });
      if (!q.touche) for (const o of nous()) if (Math.hypot(o.x - e.x, o.y - e.y) < 22) { frappe(o, e.dmg * 1.3); q.touche = true; break; } // il cogne, mais ne repousse pas
      if (q.t <= 0 || Math.hypot(e.x - x0, e.y - y0) < Cn.FONCE_V * dt * 0.3) { e.cn = null; e.cnCd = rand(Cn.CHARGE_CD[0], Cn.CHARGE_CD[1]); }
      return; }
    if (e.type === 'craneRouge') {
      if (q) return souffle(e, dt, Cn.FEU_L, Cn.FEU_A, e.x + Math.cos(q.a) * 10, e.y - 22);
      e.cnCd = (e.cnCd === undefined ? rand(2, 5) : e.cnCd) - dt; if (e.cnCd > 0 || !tg || !libre(e) || dist(e, tg) > Cn.FEU_L + 20 || !W.lineClear(e.x, e.y, tg.x, tg.y)) return;
      e.cnCd = Cn.FEU_CD; e.cn = { t: Cn.FEU, tic: 0.25, k: 0.45, a: Math.atan2(tg.y - e.y, tg.x - e.x) }; if (CG.onScreen(e.x, e.y)) CG.sfx('fire'); return; }
    if (e.type === 'craneMauve') {
      if (q) { fige(e); q.t -= dt; q.pas -= dt; if (!libre(e) || !tg) { e.cn = null; return; } e.face = tg.x > e.x ? 1 : -1; e.atkAnim = Math.max(e.atkAnim, 0.5);
        if (q.pas <= 0) { q.pas = Cn.RAFALE_PAS; const a = Math.atan2(tg.y - 16 - (e.y - 24), tg.x - e.x) + (Math.random() - 0.5) * 0.26; (R.orbesC = R.orbesC || []).push({ x: e.x, y: e.y - 24, vx: Math.cos(a) * Cn.ORBE_V, vy: Math.sin(a) * Cn.ORBE_V, life: 1.3, dmg: e.dmg * 0.22 }); }
        if (q.t <= 0) e.cn = null; return; }
      e.cnCd = (e.cnCd === undefined ? rand(2, 4) : e.cnCd) - dt; if (e.cnCd > 0 || !tg || !libre(e) || dist(e, tg) > 330) return; e.cnCd = rand(Cn.SORT_CD[0], Cn.SORT_CD[1]);
      const reflets = R.enemies.filter(o => o.refletDe === e && !o.dead).length, k = Math.random();
      if (reflets < Cn.REFLETS && k < 0.38) { for (let i = reflets; i < Cn.REFLETS; i++) { let x = e.x + (i % 2 ? 46 : -46), y = e.y + rand(-20, 20); if (!W.walkPx(x, y)) { x = e.x; y = e.y; } const o = G.spawnEnemy('craneReflet', x, y, { wild: !!e.wild, exact: true }); if (!o) continue; o.hp = o.maxhp = 1; o.dmg = 1; o.refletDe = e; o.cnVu = true; ['arene', 'etage', 'leash', 'aggroR', 'grotte', 'event', 'hunt'].forEach(c => { if (e[c] !== undefined) o[c] = e[c]; }); o.calm = false; o.target = e.target; G.puff(x, y - 24, '#d8a8ff', 14, 110, 3); } if (CG.onScreen(e.x, e.y)) CG.sfx('spell'); }
      else if (k < 0.68) { for (let i = 0; i < 14; i++) { const a = Math.random() * TAU, d = rand(120, 220), x = tg.x + Math.cos(a) * d, y = tg.y + Math.sin(a) * d * 0.8; if (!W.walkPx(x, y) || !W.walkPx(x - 10, y) || !W.walkPx(x + 10, y)) continue; G.puff(e.x, e.y - 24, '#b88cf0', 16, 120, 4); e.x = x; e.y = y; e.path = null; G.puff(x, y - 24, '#e0b8ff', 16, 120, 4); R.rings.push({ x, y: y - 6, r: 40, life: 0.35, col: '#c890ff' }); if (CG.onScreen(x, y)) CG.sfx('spell'); break; } }
      else { e.cn = { t: Cn.RAFALE, pas: 0.1 }; if (CG.onScreen(e.x, e.y)) CG.sfx('zap'); }
      return; }
    if (e.type === 'craneReflet' && e.refletDe && (e.refletDe.dead || !R.enemies.includes(e.refletDe))) { e.dead = true; G.puff(e.x, e.y - 24, '#d8a8ff', 10, 90, 3); }
  }
  function pasDragon(e, dt) {
    const R = CG.R, tg = cible(e), s = DRAGON[e.type], q = e.cn;
    if (q) return souffle(e, dt, Cn.SOUFFLE_L * s, Cn.SOUFFLE_A, e.x + Math.cos(q.a) * 46 * s, e.y - 40 * s);
    if (e.type === 'dragonOsNoir' && tg && libre(e)) { e.apCd = (e.apCd === undefined ? 7 : e.apCd) - dt; if (e.apCd <= 0) { e.apCd = Cn.APPEL_CD; if (R.enemies.filter(o => o.appelDe === e && !o.dead).length < 4) { for (let i = 0; i < 2; i++) { const o = G.spawnEnemy('craneBlanc', e.x + (i ? 50 : -50), e.y + 20, { wild: !!e.wild, exact: true }); if (!o) continue; o.appelDe = e; o.cnVu = true; ['arene', 'etage', 'leash', 'aggroR', 'grotte', 'event', 'hunt'].forEach(c => { if (e[c] !== undefined) o[c] = e[c]; }); o.calm = false; G.puff(o.x, o.y - 20, '#c8c0e0', 12, 100, 3); } G.text(e.x, e.y - 90 * s, '☠️', '#fff', true); if (CG.onScreen(e.x, e.y)) CG.sfx('horn'); } } }
    e.cnCd = (e.cnCd === undefined ? rand(2.5, 5) : e.cnCd) - dt; if (e.cnCd > 0 || !tg || !libre(e) || dist(e, tg) > Cn.SOUFFLE_L * s + 10 || !W.lineClear(e.x, e.y, tg.x, tg.y)) return;
    e.cnCd = Cn.SOUFFLE_CD; e.cn = { t: Cn.SOUFFLE, tic: 0.3, k: 0.4, a: Math.atan2(tg.y - e.y, tg.x - e.x) }; if (CG.onScreen(e.x, e.y)) CG.sfx('fire');
  }
  // ---------- qui remplace un squelette, dans un donjon ----------
  Cn.choix = function () { const d = CG.S.day, R = CG.R;
    if (d >= Cn.DRAGON_JOUR && !R.dragonOsVu && Math.random() < Cn.DRAGON) { R.dragonOsVu = true; return d >= Cn.DRAGON_NOIR[0] && Math.random() < Cn.DRAGON_NOIR[1] ? 'dragonOsNoir' : d >= Cn.DRAGON_ROUGE[0] && Math.random() < Cn.DRAGON_ROUGE[1] ? 'dragonOsRouge' : 'dragonOs'; }
    if (Math.random() > Cn.PART) return null; return d >= Cn.MAUVE[0] && Math.random() < Cn.MAUVE[1] ? 'craneMauve' : d >= Cn.ROUGE[0] && Math.random() < Cn.ROUGE[1] ? 'craneRouge' : 'craneBlanc'; };
  function changer(e, type) { const R = CG.R, o = G.spawnEnemy(type, e.x, e.y, { wild: !!e.wild, exact: true }); if (!o) return; o.cnVu = true; ['arene', 'etage', 'leash', 'aggroR', 'grotte', 'event', 'hunt', 'calm', 'site', 'revenu'].forEach(c => { if (e[c] !== undefined) o[c] = e[c]; }); if (e.wild) o.wild = e.wild; const i = R.enemies.indexOf(e); if (i >= 0) R.enemies.splice(i, 1); }
  Cn.poser = function (type, x, y) { const p = CG.S.player, o = G.spawnEnemy(type, x === undefined ? p.x + 150 : x, y === undefined ? p.y : y, { wild: true, exact: true }); if (o) { o.cnVu = true; o.calm = false; o.aggroR = 360; } return o; }; // pour les essais
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R;
    if (S && R && R.enemies && !R.night) {
      tic -= dt; if (tic <= 0) { tic = 0.5; if (CG.Mondes && CG.Mondes.ici() >= 2) for (const e of R.enemies.slice()) { if (e.cnVu) continue; e.cnVu = true; if (e.dead || e.grosArene || !/^squelette/.test(e.type)) continue; const t = Cn.choix(); if (t) changer(e, t); } }
      for (const e of R.enemies) { if (e.dead) continue; if (CRANE[e.type]) pasCrane(e, dt); else if (DRAGON[e.type]) pasDragon(e, dt); }
      const O = R.orbesC; if (O && O.length) { const L = nous(); for (const s of O) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; if (!W.walkPx(s.x, s.y + 18)) { s.life = 0; G.puff(s.x, s.y, '#c890ff', 4, 60, 2.5); continue; } for (const o of L) if (Math.hypot(o.x - s.x, o.y - 16 - s.y) < 13) { frappe(o, s.dmg); s.life = 0; G.puff(s.x, s.y, '#e0b8ff', 5, 70, 2.5); break; } } R.orbesC = O.filter(s => s.life > 0); }
    }
    return up0.apply(this, arguments);
  };
  // ---------- les dessins ----------
  const el = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const po = (g, p, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const ln = (g, p, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const PAL = { craneBlanc: ['#f2eedc', '#cfc8b0', '#7ad8ff', '#5a5468'], craneRouge: ['#ee6a52', '#b83a2c', '#ffd23a', '#5a1c18'], craneMauve: ['#b88cf0', '#8a5cc8', '#ff8af4', '#3a2060'], craneReflet: ['#b88cf0', '#8a5cc8', '#ff8af4', '#3a2060'] };
  function crane(g, e, t) {
    const C = PAL[e.type], q = e.cn, elan = q && q.ph === 'elan', fonce = q && q.ph === 'fonce', feu = q && q.a !== undefined && !q.ph, f = e.face < 0 ? -1 : 1, tt = t + (e.seed || 0);
    const x = e.x + (elan ? Math.sin(tt * 60) * 1.6 : 0), y = e.y - 26 + (fonce ? 4 : Math.sin(tt * 4) * 3), bat = Math.sin(tt * (fonce ? 26 : 14)), gueule = feu || (q && q.pas !== undefined) ? 5 : Math.max(0, e.atkAnim || 0) * 4 + (elan ? 2 : 0);
    Art.shadow(g, e.x, e.y + 1, 9);
    g.save(); g.translate(x, y); if (fonce || elan) g.rotate(f * (fonce ? 0.3 : -0.2));
    [-1, 1].forEach(s => { po(g, [s * 6, -3, s * 15, -12 - bat * 5, s * 27, -15 - bat * 9, s * 24, -4 - bat * 4, s * 19, -1 - bat * 3, s * 16, 4 - bat * 2, s * 11, 1, s * 9, 5], C[3]); ln(g, [s * 6, -3, s * 27, -15 - bat * 9], 'rgba(0,0,0,0.35)', 1); ln(g, [s * 13, -10 - bat * 4, s * 19, -1 - bat * 3], 'rgba(0,0,0,0.3)', 0.9); ln(g, [s * 10, -7 - bat * 3, s * 11, 1], 'rgba(0,0,0,0.3)', 0.9); });
    po(g, [-6, 3 + gueule * 0.5, 6, 3 + gueule * 0.5, 5, 9 + gueule, -5, 9 + gueule], C[1]); g.fillStyle = '#1a1420'; g.fillRect(-4.5, 3, 9, 2 + gueule * 0.6); // la mâchoire
    g.fillStyle = C[0]; for (let i = 0; i < 4; i++) g.fillRect(-4 + i * 2.3, 5 + gueule * 0.9, 1.5, 2.4);
    el(g, 0, -3, 10, 9, C[0]); el(g, 3.4, -1.6, 6, 6.6, 'rgba(0,0,0,0.1)'); g.fillStyle = C[0]; g.fillRect(-6, 1, 12, 4); for (let i = 0; i < 5; i++) { g.fillStyle = C[1]; g.fillRect(-5 + i * 2.2, 3.4, 0.7, 2.2); }
    el(g, -4 + f, -3, 3, 3.6, '#1a1420'); el(g, 4 + f, -3, 3, 3.6, '#1a1420'); po(g, [f * 0.4 - 1.4, 1.6, f * 0.4 + 1.4, 1.6, f * 0.4, -0.8], '#1a1420');
    const lu = 0.7 + Math.sin(tt * 6) * 0.3; g.globalAlpha *= lu; el(g, -4 + f * 1.6, -3, 1.5, 1.7, C[2]); el(g, 4 + f * 1.6, -3, 1.5, 1.7, C[2]); g.globalAlpha /= lu;
    el(g, -3.4, -8, 3.4, 1.8, 'rgba(255,255,255,0.3)');
    g.restore();
  }
  const PALD = { dragonOs: ['#ece6d2', '#bdb59c', '#7ad8ff'], dragonOsRouge: ['#e8765c', '#a83a2c', '#ffd23a'], dragonOsNoir: ['#5a5666', '#2c2934', '#d08aff'] };
  function dragon(g, e, t) {
    const C = PALD[e.type], s = DRAGON[e.type], f = e.face < 0 ? -1 : 1, tt = t + (e.seed || 0), bob = Math.sin(tt * 3) * 1.5, bat = Math.sin(tt * 5), pas = e.moving ? Math.sin((e.step || 0) * 1.6) * 5 : 0, feu = !!e.cn, gueule = feu ? 9 : Math.max(0, e.atkAnim || 0) * 8;
    el(g, e.x, e.y + 2, 36 * s, 9 * s, 'rgba(0,0,0,0.25)');
    g.save(); g.translate(e.x, e.y); g.scale(f * s, s); g.translate(0, bob);
    for (let i = 0; i < 8; i++) { const k = i / 7; el(g, -20 - k * 34, -20 + k * 12 + Math.sin(tt * 3 + k * 4) * 3 * k, 4.2 - k * 2.6, 4 - k * 2.4, i % 2 ? C[1] : C[0]); } // la queue
    ln(g, [-13, -20, -18 - pas, -9, -11 - pas, -1 - bob], C[1], 3.4); ln(g, [9, -20, 5 + pas, -9, 12 + pas, -1 - bob], C[1], 3.4); // les pattes du fond
    // l'aile : des os, et un reste de peau déchirée
    const ax = 2, ay = -27, w1 = [-10, -54 - bat * 6], pts = [[-36, -46 - bat * 10], [-30, -30 - bat * 5], [-16, -64 - bat * 9]];
    g.globalAlpha = 0.28; po(g, [ax, ay, w1[0], w1[1], pts[2][0], pts[2][1], pts[0][0], pts[0][1], -26, -38 - bat * 6, pts[1][0], pts[1][1], -14, -30], C[1]); g.globalAlpha = 1;
    ln(g, [ax, ay, w1[0], w1[1]], C[0], 3); pts.forEach(p => ln(g, [w1[0], w1[1], p[0], p[1]], C[0], 2));
    for (let i = 0; i < 7; i++) el(g, -18 + i * 5.3, -22 - Math.sin(i / 6 * Math.PI) * 5, 4, 3.8, i % 2 ? C[0] : C[1]); // l'échine
    g.strokeStyle = C[0]; g.lineWidth = 2; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const rx = -12 + i * 5; g.beginPath(); g.moveTo(rx, -24); g.quadraticCurveTo(rx - 5, -14, rx + 1, -8); g.stroke(); } // les côtes
    ln(g, [-9, -18, -14 + pas, -8, -7 + pas, 0 - bob], C[0], 3.8); ln(g, [13, -18, 9 - pas, -8, 16 - pas, 0 - bob], C[0], 3.8); [[-7 + pas, 0], [16 - pas, 0]].forEach(p => { ln(g, [p[0], p[1] - bob, p[0] + 5, p[1] - bob], C[0], 2.4); });
    for (let i = 0; i < 6; i++) { const k = i / 5; el(g, 15 + k * 15, -26 - k * 19, 3.6, 3.6, i % 2 ? C[1] : C[0]); } // le cou
    g.translate(33, -49); g.rotate(feu ? 0.18 : -0.08 + Math.sin(tt * 2) * 0.05);
    po(g, [-2, -5, -13, -15, -8, -3], C[1]); po(g, [2, -6, -6, -18, -1, -4], C[0]); // les cornes
    po(g, [2, 3, 20, 4 + gueule * 0.25, 18, 8 + gueule, 3, 7 + gueule * 0.5], C[1]); g.fillStyle = C[0]; for (let i = 0; i < 4; i++) po(g, [7 + i * 3.6, 5 + gueule * 0.6, 8.8 + i * 3.6, 1.4 + gueule * 0.6, 10.6 + i * 3.6, 5 + gueule * 0.6], C[0]); // la mâchoire du bas
    el(g, 2, -1, 9, 7, C[0]); po(g, [4, -6, 22, -3, 23, 3, 6, 5], C[0]); po(g, [8, 3, 22, 3, 23, 4.6, 8, 5], C[1]);
    for (let i = 0; i < 4; i++) po(g, [8 + i * 3.6, 4, 9.8 + i * 3.6, 7.6, 11.6 + i * 3.6, 4], C[0]);
    el(g, 4, -2, 3.4, 3, '#1a1420'); const lu = 0.7 + Math.sin(tt * 5) * 0.3; g.globalAlpha = lu; el(g, 4.8, -2, 1.8, 1.7, C[2]); g.globalAlpha = 1; el(g, 19.5, -1.4, 1.1, 0.9, '#1a1420');
    g.restore();
  }
  const en0 = Art.enemy; Art.enemy = function (g, e, t) { if (CRANE[e.type]) { if (e.type === 'craneReflet') { const a = g.globalAlpha; g.globalAlpha = a * 0.88; crane(g, e, t); g.globalAlpha = a; return; } return crane(g, e, t); } if (DRAGON[e.type]) return dragon(g, e, t); return en0.apply(this, arguments); };
  // les petites boules d'énergie mauve
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const O = CG.R && CG.R.orbesC; if (!O || !O.length) return; for (const s of O) { if (!CG.onScreen(s.x, s.y)) continue; el(g, s.x, s.y, 7, 7, 'rgba(190,120,255,0.3)'); el(g, s.x, s.y, 4, 4, '#c890ff'); el(g, s.x - 1, s.y - 1, 1.7, 1.7, '#fff'); } };
})(window.CG);
