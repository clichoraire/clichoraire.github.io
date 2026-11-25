// Goblin Malin — quatre sorts de plus. Le Rayon vrille (on charge deux secondes, bras tendu, puis un énorme rayon qui
// traverse tout et vide presque tout le mana), le Maléfice de basse-cour (un ennemi devient une petite bête inoffensive),
// la Paralysie, et la Flèche magique (un petit sort de départ, comme l'Étincelle).
'use strict';
(function (CG) {
  const G = CG.G, Art = CG.Art, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const S3 = CG.Sorts3 = { CHARGE: 2.2, TIR: 0.9, TIC: 0.15, RAYON_DMG: 22, RAYON_LONG: 640, RAYON_MANA: 0.6, BETE: 12, PARA: 4, SECOUE: 2, AMPLI: 2.4, /* SECOUE : les dernières secondes, le paralysé se met à trembler, de plus en plus fort (AMPLI : pixels, tout à la fin) */ FLECHE: 7, DEBUT: 0.45, DEBUT_JOUR: 6, BETES: ['rat', 'cobaye', 'poule', 'lapin', 'grenouille'] };
  const NOMS = { rat: 'un rat', cobaye: 'un cochon d\'Inde', poule: 'une poule', lapin: 'un lapin', grenouille: 'une grenouille' };
  Object.assign(CG.SPELLS, {
    fleche: { nom: 'Flèche magique', icon: '🏹', mp: 3, prix: 25, color: '#9adcff', desc: 'Une petite flèche de lumière, rapide, qui va loin.' },
    paralysie: { nom: 'Paralysie', icon: '⚡', mp: 12, prix: 500, color: '#ffe36b', desc: 'L\'ennemi le plus proche ne peut plus bouger ni frapper pendant ' + S3.PARA + ' secondes. Ne marche pas sur les chefs.' },
    bestiole: { nom: 'Maléfice de basse-cour', icon: '🐔', mp: 20, prix: 800, color: '#ffb0e0', desc: 'L\'ennemi le plus proche était une terreur. Pendant ' + S3.BETE + ' secondes, c\'est une petite chose ridicule qui ne ferait pas peur à une salade. En quoi ? Surprise. Lui non plus ne s\'y attendait pas. Les chefs, trop fiers, refusent de se laisser faire.' },
    rayon: { nom: 'Rayon vrille', icon: '🌀', mp: 30, prix: 1600, color: '#ffe36b', desc: 'Tu charges ' + String(S3.CHARGE).replace('.', ',') + ' secondes, deux doigts au front, puis tu tends le bras : un énorme rayon traverse tous les ennemis devant toi. Il te prend ' + Math.round(S3.RAYON_MANA * 100) + ' % de ton mana maximum.' }
  });
  CG.SCROLL_POOL.push('fleche', 'paralysie', 'bestiole', 'rayon');
  if (CG.Effets && CG.Effets.FICHE) Object.assign(CG.Effets.FICHE, { fleche: ['⚔️', S3.FLECHE, '{n} dégâts, va vite et loin'], paralysie: ['⏳', null, S3.PARA + ' s sans bouger'], bestiole: ['⏳', null, S3.BETE + ' s en petite bête'], rayon: ['⚔️', S3.RAYON_DMG * Math.round(S3.TIR / S3.TIC), '{n} dégâts à tout ce qui est dans le rayon'] });
  const mul = () => { const p = CG.S.player; return (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1); };
  const chefE = e => { const d = CG.ENEMIES[e.type]; return !!(d && d.boss) || e.struct; };
  const sc0 = G.spellCost; G.spellCost = function (id) { const c = sc0.apply(this, arguments); return id === 'rayon' ? Math.max(c, Math.ceil(CG.S.player.maxmp * S3.RAYON_MANA)) : c; };
  // le sort de départ : les premiers jours, tant qu'on n'a ni Étincelle ni Flèche magique, on tombe plus souvent dessus
  const ns0 = G.newScroll; G.newScroll = function () {
    const S = CG.S, p = S.player, r = ns0.apply(this, arguments), libres = ['fleche', 'etincelle'].filter(i => !p.spells.includes(i) && !p.scrolls[i]);
    return r; // plus de coup de pouce : le premier parchemin est tiré au hasard comme les autres
  };
  const cible = (ok) => { const R = CG.R, p = CG.S.player; let tg = null, bd = 340; for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0 || !ok(e)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; tg = e; } } return tg; };
  const rate = txt => { const p = CG.S.player; CG.sfx('no'); G.text(p.x, p.y - 56, txt, '#9ab6ff'); };
  const cast0 = G.cast; G.cast = function (id) {
    const S = CG.S, R = CG.R; if (R && R.rayon) return; // en plein rayon : rien d'autre
    if (id !== 'fleche' && id !== 'paralysie' && id !== 'bestiole' && id !== 'rayon') return cast0.apply(this, arguments);
    const p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night) return; const cost = G.spellCost(id);
    if (p.mp < cost) return rate('Pas assez de mana');
    let tg = null;
    if (id === 'paralysie' || id === 'bestiole') {
      tg = cible(e => !chefE(e) && !(e.para > 0) && !e.poly); if (!tg) return rate(cible(e => chefE(e)) ? 'Trop puissant pour ce sort !' : 'Personne à ensorceler ici');
    }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); if (CG.Magie.reveal && R.invis > 0) CG.Magie.reveal();
    if (id === 'fleche') {
      const t = G.nearestEnemy(p.x, p.y, 520), aim = t || { x: p.x + R.dir.x * 240, y: p.y + R.dir.y * 240 + 14 }; if (t && Math.abs(t.x - p.x) > 4) p.face = t.x > p.x ? 1 : -1;
      const n0 = R.shots.length; G.shoot(p, aim, 'bolt', S3.FLECHE * mul(), 'p'); const s = R.shots[n0]; if (s) { s.vx *= 1.6; s.vy *= 1.6; s.life = 1.5; s.fleche = true; }
    } else if (id === 'paralysie') {
      tg.para = S3.PARA; tg.daze = Math.max(tg.daze || 0, 0.3); tg.fear = 0; tg.path = null; tg.moving = false; p.face = tg.x > p.x ? 1 : -1; CG.sfx('zap');
      R.bolts.push({ x1: p.x, y1: p.y - 26, x2: tg.x, y2: tg.y - 18, life: 0.3 }); R.rings.push({ x: tg.x, y: tg.y - 6, r: 50, life: 0.45, col: '#ffe36b' }); G.text(tg.x, tg.y - 60, '⚡ Paralysé !', '#ffe36b', true);
    } else if (id === 'bestiole') {
      const k = pick(S3.BETES); tg.poly = { k, t: S3.BETE, w: 0, dx: 0, dy: 0 }; tg.daze = Math.max(tg.daze || 0, 0.3); tg.fear = 0; tg.path = null; tg.aggro = null; tg.target = null; p.face = tg.x > p.x ? 1 : -1;
      G.puff(tg.x, tg.y - 16, '#ffb0e0', 26, 150, 5); G.puff(tg.x, tg.y - 16, '#ffffff', 12, 100, 4); R.rings.push({ x: tg.x, y: tg.y - 6, r: 56, life: 0.5, col: '#ffb0e0' }); G.text(tg.x, tg.y - 60, 'Pouf ! ' + NOMS[k].charAt(0).toUpperCase() + NOMS[k].slice(1) + ' !', '#ffd0f0', true);
    } else { R.rayon = { ph: 'charge', t: S3.CHARGE, dx: R.dir.x || (p.face < 0 ? -1 : 1), dy: R.dir.y || 0, tic: 0 }; R.castCd = S3.CHARGE + S3.TIR + 0.3; if (R.mount && CG.Monture && CG.Monture.off) CG.Monture.off(); }
  };
  const hm0 = G.heroMul; G.heroMul = function () { const r = CG.R && CG.R.rayon; return hm0.apply(this, arguments) * (r ? (r.ph === 'charge' ? 0.3 : 0.02) : 1); };
  // les ensorcelés ne suivent plus leur idée : le paralysé ne bouge pas, la petite bête trottine au hasard et se sauve du chef
  const fs0 = G.fearStep; G.fearStep = function (e, dt) {
    if (e.para > 0) { e.moving = false; return; }
    const q = e.poly; if (!q) return fs0.apply(this, arguments);
    const p = CG.S.player, px = e.x - p.x, py = e.y - p.y, d = Math.hypot(px, py) || 1; q.w -= dt;
    if (d < 80) { q.dx = px / d; q.dy = py / d; q.w = 0.5; } else if (q.w <= 0) { q.w = rand(0.6, 1.8); if (Math.random() < 0.35) { q.dx = 0; q.dy = 0; } else { const a = Math.random() * TAU; q.dx = Math.cos(a); q.dy = Math.sin(a); } }
    if (q.dx || q.dy) { const v = (d < 80 ? 70 : 42) * dt; if (G.slide(e, q.dx * v, q.dy * v)) { e.moving = true; e.step += dt * 3.4; if (Math.abs(q.dx) > 0.1) e.face = q.dx > 0 ? 1 : -1; } else q.w = 0; }
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player;
    for (const e of R.enemies) {
      if (e.para > 0) { e.para -= dt; e.daze = Math.max(e.daze || 0, 0.25); e.fear = 0; if (e.dead) e.para = 0; }
      if (e.poly) { e.poly.t -= dt; e.daze = Math.max(e.daze || 0, 0.25); e.fear = 0; if (e.poly.t <= 0 || e.dead) { e.poly = null; if (!e.dead) { G.puff(e.x, e.y - 18, '#ffb0e0', 22, 140, 5); R.rings.push({ x: e.x, y: e.y - 6, r: 50, life: 0.4, col: '#ffffff' }); } } }
    }
    const r = R.rayon; if (!r) return;
    if (R.ko > 0 || R.night || R.cine) { R.rayon = null; return; }
    r.t -= dt; R.castAnim = 0; R.swing = 0; // son propre bras ne se lève pas : c'est le nôtre qu'on dessine
    if (r.ph === 'charge') {
      if (R.dir.x || R.dir.y) { r.dx = R.dir.x; r.dy = R.dir.y; }
      if (r.t <= 0) { // on lâche tout : vers l'ennemi le plus proche s'il y en a un devant, sinon tout droit
        const tg = G.nearestEnemy(p.x, p.y, 560); if (tg) { const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy) || 1; r.dx = dx / d; r.dy = dy / d; }
        r.ph = 'tir'; r.t = S3.TIR; r.tic = 0; r.dmg = S3.RAYON_DMG * mul(); if (Math.abs(r.dx) > 0.05) p.face = r.dx > 0 ? 1 : -1; CG.sfx('zap'); CG.sfx('fire'); R.shake = Math.max(R.shake || 0, 0.5);
      }
      return;
    }
    R.dir = { x: r.dx, y: r.dy }; if (Math.abs(r.dx) > 0.05) p.face = r.dx > 0 ? 1 : -1; p.path = null; r.tic -= dt;
    if (r.tic <= 0) { r.tic = S3.TIC; const o = S3.bout(p, r), L = S3.RAYON_LONG;
      for (const e of R.enemies) { if (e.dead || e.charm > 0) continue; const ex = e.x - o.x, ey = e.y - 14 - o.y, q = CG.clamp(ex * r.dx + ey * r.dy, 0, L); if (Math.hypot(ex - r.dx * q, ey - r.dy * q) < 22 + e.r) { G.hurtEnemy(e, r.dmg, p); R.parts.push({ x: e.x + rand(-8, 8), y: e.y - 16 + rand(-8, 8), vx: rand(-60, 60), vy: rand(-80, 20), life: 0.35, max: 0.35, col: '#ffe36b', size: 5, float: true }); } } }
    if (r.t <= 0) R.rayon = null;
  };
  // le bout des doigts, d'où part le rayon
  S3.bout = (p, r) => ({ x: p.x + r.dx * 40, y: p.y - 27 + r.dy * 30 });

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const lig = (g, p, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const tri = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  // les petites bêtes
  function bete(g, e, t) {
    const k = e.poly.k, face = e.face < 0 ? -1 : 1, st = e.moving ? Math.sin(e.step * TAU) : 0, hop = (k === 'lapin' || k === 'grenouille') && e.moving ? Math.abs(Math.sin(e.step * Math.PI)) * 7 : e.moving ? Math.abs(st) * 1.5 : 0;
    ell(g, e.x, e.y + 1, 10, 3.4, 'rgba(0,0,0,0.24)'); g.save(); g.translate(e.x, e.y - hop); g.scale(face, 1);
    if (k === 'rat') { lig(g, [-8, -4, -14, -3 + st, -19, -7 - st], '#e0a0a8', 1.6); ell(g, 0, -6, 9, 5.6, '#8a8690'); ell(g, 8, -6.4, 5, 4, '#96929c'); tri(g, [11, -7.5, 15.5, -5.6, 11, -4.2], '#96929c'); ell(g, 6.5, -11, 2.8, 3, '#b8a0a8'); ell(g, 15.2, -5.6, 1.1, 1.1, '#e08090'); ell(g, 10.4, -7.6, 1, 1, '#1c1410'); [-4, 4].forEach(x => lig(g, [x, -2, x + st * 2, 0], '#6a666e', 1.8)); }
    else if (k === 'cobaye') { ell(g, 0, -7, 10.5, 7.2, '#f4ead8'); ell(g, -4, -8, 6, 6, '#c87a34'); ell(g, 5, -9.5, 4.4, 3.6, '#6a4424'); ell(g, 9.4, -6.4, 2.6, 2.4, '#f4ead8'); ell(g, 5.6, -13, 2, 1.6, '#b06a5a'); ell(g, 8.6, -8.6, 1.1, 1.1, '#1c1410'); ell(g, 11.6, -6, 0.9, 0.8, '#d07080'); [-5, 5].forEach(x => ell(g, x + st * 1.5, -0.6, 2.2, 1.3, '#e0b8a0')); }
    else if (k === 'poule') { const pic = !e.moving && Math.sin(t * 5 + e.seed) > 0.6 ? 4 : 0; [-2, 3].forEach(x => lig(g, [x, -4, x + st * 2.5, 0], '#e8a020', 1.5)); ell(g, -1, -9, 8.6, 7, '#fbf6ea'); tri(g, [-7, -12, -14, -17, -8, -6], '#eee6d4'); ell(g, -2, -8, 4.6, 3.6, '#eee6d4'); g.save(); g.translate(5, -13); g.rotate(pic * 0.16); ell(g, 2.4, -3.4, 4.2, 4.2, '#fbf6ea'); tri(g, [6, -4, 10.4, -2.6, 6, -1.6], '#f0a020'); [0.4, 2.6, 4.6].forEach(x => ell(g, x, -7.6, 1.5, 1.9, '#e02a2a')); ell(g, 5.4, -0.6, 1.2, 1.8, '#e02a2a'); ell(g, 3.8, -4.2, 0.9, 0.9, '#1c1410'); g.restore(); }
    else if (k === 'lapin') { ell(g, -8.6, -6, 3, 3, '#ffffff'); ell(g, -1, -7, 8.4, 6.4, '#e8dccc'); ell(g, 6.6, -11, 5, 4.6, '#efe4d6'); ell(g, 4.6, -18.5, 1.9, 6, '#e8dccc', -0.25); ell(g, 8, -18.5, 1.9, 6, '#efe4d6', 0.1); ell(g, 8, -18.5, 0.9, 4.2, '#f0b8c0', 0.1); ell(g, 8.4, -11.6, 1, 1, '#1c1410'); ell(g, 11.2, -9.8, 0.9, 0.8, '#e08090'); ell(g, -4 + st * 2, -1, 4, 1.8, '#d8ccb8'); ell(g, 5, -1, 2.4, 1.5, '#d8ccb8'); }
    else { ell(g, -5, -3, 5, 3, '#3f8a34'); ell(g, 0, -6.4, 8.4, 5.6, '#5ab84a'); ell(g, 1.6, -4.4, 6, 3, '#d8eaa0'); [[3.4, -11.4], [8, -10.6]].forEach(q => { ell(g, q[0], q[1], 2.8, 2.8, '#5ab84a'); ell(g, q[0] + 0.4, q[1] - 0.2, 1.7, 1.7, '#fff6c0'); ell(g, q[0] + 0.7, q[1] - 0.2, 0.8, 1.1, '#1c1410'); }); lig(g, [3, -6.4, 9.4, -6.8], '#2f6a2a', 1.1); ell(g, 6, -0.8, 3, 1.4, '#3f8a34'); }
    g.restore();
    if (e.poly.t < 2.5 && Math.sin(t * 22) > 0) { g.globalAlpha = 0.6; ell(g, e.x, e.y - 8, 13, 11, 'rgba(255,176,224,0.5)'); g.globalAlpha = 1; } // ça va lâcher
  }
  const en0 = Art.enemy; Art.enemy = function (g, e, t) {
    if (e.poly) return bete(g, e, t);
    if (e.para > 0 && e.para < S3.SECOUE && !e.dead) { const k = 1 - e.para / S3.SECOUE; g.save(); g.translate(Math.sin(t * 58 + (e.id || 0)) * S3.AMPLI * k * k, 0); try { en0.apply(this, arguments); } finally { g.restore(); } } /* il lutte contre le sort : ça va lâcher */
    else en0.apply(this, arguments);
    if (e.para > 0) { const h = 20 + (e.r || 12) * 1.6; g.save(); g.strokeStyle = '#fff6a0'; g.lineWidth = 2; g.lineJoin = 'round'; g.globalAlpha = e.para < 1.5 ? 0.45 + Math.sin(t * 20) * 0.3 : 0.9;
      for (let i = 0; i < 3; i++) { const sd = Math.floor(t * 9) * 7 + i * 31 + e.id, a = (sd * 2.399) % TAU, x = e.x + Math.cos(a) * (e.r + 6), y = e.y - h * 0.5 + Math.sin(a) * h * 0.45, z = (sd % 5) - 2; g.beginPath(); g.moveTo(x - 5, y - 7); g.lineTo(x + 2 + z, y - 2); g.lineTo(x - 3, y + 1); g.lineTo(x + 5, y + 7); g.stroke(); }
      g.restore(); }
  };
  // le bras du chef : deux doigts au front pendant la charge, puis tendu vers la cible
  const gob0 = Art.goblin; Art.goblin = function (g, o) {
    gob0.apply(this, arguments); const R = CG.R, r = R && R.rayon; if (!r || !o || !o.chief || o.dir === undefined || o.tool !== 'baton' || (CG.Meta && CG.Meta.forme())) return;
    const s = o.s || 1, peau = 'hsl(' + (o.hue || 112) + ',46%,' + (o.lum || 46) + '%)', fonce = 'hsl(' + (o.hue || 112) + ',46%,' + ((o.lum || 46) - 12) + '%)', f = r.dx < -0.05 ? -1 : r.dx > 0.05 ? 1 : (o.face < 0 ? -1 : 1), ex = o.x + f * 5 * s, ey = o.y - 27 * s;
    g.save(); if (o.alpha !== undefined && o.alpha < 1) g.globalAlpha *= o.alpha;
    if (r.ph === 'charge') { const hx = o.x + f * 5 * s, hy = o.y - 38 * s, cx = o.x + f * 16 * s, cy = o.y - 29 * s; lig(g, [ex, ey, cx, cy, hx, hy], fonce, 6.4 * s); lig(g, [ex, ey, cx, cy, hx, hy], peau, 4.6 * s); lig(g, [hx, hy, hx - f * 2.4 * s, hy - 5 * s], peau, 2 * s); lig(g, [hx + f * 1.6 * s, hy, hx - f * 0.4 * s, hy - 5.6 * s], peau, 2 * s); }
    else { const b = S3.bout({ x: o.x, y: o.y }, r), mx = b.x - r.dx * 6, my = b.y - r.dy * 5; lig(g, [ex, ey, mx, my], fonce, 6.4 * s); lig(g, [ex, ey, mx, my], peau, 4.6 * s); ell(g, mx, my, 3.4 * s, 3.4 * s, peau); lig(g, [mx, my - 1, b.x, b.y - 1], peau, 2 * s); lig(g, [mx, my + 1.4, b.x - r.dx, b.y + 1.4], peau, 2 * s); }
    g.restore();
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R, p = CG.S.player;
    for (const s of R.shots) { if (!s.fleche || !CG.onScreen(s.x, s.y)) continue; const a = Math.atan2(s.vy, s.vx); g.save(); g.translate(s.x, s.y); g.rotate(a); g.fillStyle = 'rgba(154,220,255,0.35)'; g.fillRect(-34, -2.5, 30, 5); g.fillStyle = '#e8f8ff'; g.fillRect(-20, -1.3, 22, 2.6); tri(g, [10, 0, -1, -6, 2, 0, -1, 6], '#9adcff'); tri(g, [8, 0, 1, -3, 2.6, 0, 1, 3], '#ffffff'); tri(g, [-20, 0, -26, -4.4, -22, 0, -26, 4.4], '#9adcff'); g.restore(); }
    const r = R.rayon; if (!r) return; g.save(); g.lineCap = 'round';
    if (r.ph === 'charge') { const k = 1 - r.t / S3.CHARGE, s = 1.12 * (CG.Evo && CG.Evo.chefScale ? CG.Evo.chefScale() : 1), f = r.dx < -0.05 ? -1 : r.dx > 0.05 ? 1 : (p.face < 0 ? -1 : 1), x = p.x + f * 4 * s, y = p.y - 45 * s, rr = 3 + k * 8 + Math.sin(t * 30) * 1.2;
      for (let i = 0; i < 7; i++) { const q = 1 - ((t * 1.6 + i / 7) % 1), a = i * 2.4 + t * 2, d = q * (26 + k * 30); g.globalAlpha = (1 - q) * 0.9; ell(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 2.2, 2.2, i % 2 ? '#c070ff' : '#ffe36b'); }
      g.globalAlpha = 0.35 + k * 0.3; ell(g, x, y, rr * 2.1, rr * 2.1, 'rgba(255,227,107,0.5)'); g.globalAlpha = 1; ell(g, x, y, rr, rr, '#ffe36b'); ell(g, x, y, rr * 0.5, rr * 0.5, '#ffffff');
    } else { const o = S3.bout(p, r), pousse = Math.min(1, (S3.TIR - r.t) / 0.12), fin = Math.min(1, r.t / 0.18), L = S3.RAYON_LONG * pousse, x2 = o.x + r.dx * L, y2 = o.y + r.dy * L, nx = -r.dy, ny = r.dx, w = fin * (1 + Math.sin(t * 50) * 0.08);
      lig(g, [o.x, o.y, x2, y2], 'rgba(255,214,80,0.22)', 40 * w); lig(g, [o.x, o.y, x2, y2], 'rgba(255,227,107,0.55)', 22 * w);
      [0, Math.PI].forEach((ph, j) => { g.strokeStyle = j ? 'rgba(255,150,60,0.9)' : 'rgba(190,110,255,0.95)'; g.lineWidth = 3.4 * w; g.beginPath(); for (let d = 0; d <= L; d += 9) { const off = Math.sin(d * 0.085 - t * 34 + ph) * 15 * w * Math.min(1, d / 40), x = o.x + r.dx * d + nx * off, y = o.y + r.dy * d + ny * off; if (d) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); });
      lig(g, [o.x, o.y, x2, y2], '#ffe36b', 11 * w); lig(g, [o.x, o.y, x2, y2], '#ffffff', 5 * w);
      ell(g, o.x, o.y, 9 * w, 9 * w, 'rgba(255,240,170,0.9)'); ell(g, o.x, o.y, 4.5 * w, 4.5 * w, '#ffffff'); ell(g, x2, y2, 20 * w, 20 * w, 'rgba(255,227,107,0.45)');
    }
    g.restore();
  };
})(window.CG);
