// Goblin Malin — le donjon de la horde. Quand le chef brise la sphère d'un piédestal, il arrive (CHANCE) qu'au lieu des vagues
// de la horde il soit aspiré dans un donjon des enfers. Il faut le traverser salle par salle et battre son gardien, le Six-Lames :
// le parchemin tombe alors par terre, à l'endroit où il s'écroule.
//   Le Six-Lames : six bras, six épées. Il tournoie en fonçant et tranche tout sur son passage ; il saute si haut qu'on ne le voit
//   plus (seule son ombre le trahit) et retombe d'un coup ; il crache du feu ; et il fait sortir des monstres de la terre.
// (Sous le capot : le même donjon que la montagne de feu de grottenid.js.) Tout se règle dans CG.DonjonHorde.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, Ar = CG.Arene, Au = CG.Autels, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  if (!Ar || !Au || !Au.break) return;
  const Dh = CG.DonjonHorde = {
    ID: 'hordeEnfer', TYPE: 'sixLames', CHANCE: 0.3, TAILLE: 1.5,
    REPOS: [2.2, 3.6], VUE: 440,
    TOUR: { PREP: 0.55, DUR: 2.6, V: 150, RAYON: 64, TIC: 0.3, DMG: 0.8 },
    SAUT: { PREP: 0.45, AIR: 1.5, VISE: 0.45, RAYON: 86, DMG: 1.6, RECUP: 0.6 },
    FEU: { PREP: 0.6, DUR: 1.3, PORTEE: 205, ANGLE: 0.42, TIC: 0.2, DMG: 0.45 },
    INVOQUE: { DUR: 1.1, NB: 3, MAX: 6, SORTES: ['squelette', 'squeletteRouge', 'diablotin', 'diablotinLance', 'molosseCornu', 'spectre'] }
  };
  CG.ENEMIES[Dh.TYPE] = { nom: 'Le Six-Lames', race: 'demon', hp: 130, dmg: 9, spd: 84, xp: 220, or: 130, cost: 99, r: 19 };
  const la = l => l.filter(t => CG.ENEMIES[t]);
  Ar.Q[Dh.ID] = { mondes: [], qui: 'Le donjon de la horde', lieu: 'Le donjon de la horde', titre: 'Le donjon de la horde', theme: 'lave', donjon: true, roi: true, chef: [Dh.TYPE, 'Le Six-Lames'],
    entree: 'La sphère t\'a avalé ! Te voilà chez la horde des enfers. Avance de salle en salle : le tome de sort est tout au fond, et quelqu\'un le garde.',
    E: [la(['diablotin', 'diablotinLance', 'molosseCornu', 'squelette']), la(['diablotin', 'diablotinLance', 'demon', 'cerbere', 'squeletteRouge']), la(['demon', 'cerbere3', 'cerbere', 'squeletteNoir', 'diablotinLance', 'spectreRouge'])],
    recompense(A) { const S = CG.S, p = S.player, d = S.day, or = 90 + 15 * d + (A.palier || 0) * 40, xp = 45 + 8 * d; G.gain('or', or, p.x, p.y - 50); G.addXp(xp); S.morale = Math.min(100, S.morale + 4);
      G.banner('Le Six-Lames est tombé', 'Le donjon de la horde se referme derrière toi. (+' + or + ' 🪙, +' + xp + ' XP, moral +4.)', '#ffb49a'); CG.sfx('victory'); } };
  const dedans = () => Ar.dans() && CG.S.arene && CG.S.arene.id === Dh.ID; Dh.dedans = dedans;
  // ---------- pas de retour en arrière : en Normal et en Difficile, le portail d'arrivée reste là pour s'enfuir ; en Élite et en Cauchemar, il se referme ----------
  Dh.SANS_RETOUR = { elite: 1, cauchemar: 1 }; Dh.sansRetour = () => !!(CG.Diff && CG.Diff.id && Dh.SANS_RETOUR[CG.Diff.id()]);
  if (CG.Pyramide && CG.Pyramide.generer) { const ge0 = CG.Pyramide.generer; CG.Pyramide.generer = function () { const r = ge0.apply(this, arguments), S = CG.S;
    if (S && S.arene && S.arene.id === Dh.ID && !S.arene.gagne && Dh.sansRetour() && W.POI.portail) Object.assign(W.POI.portail, { x: 2, y: 2, r: 0 }); /* le portail est rangé dans un coin noir de la carte : ni dessin ni touche E. La seule sortie est le passage qui s'ouvre quand le Six-Lames tombe */
    return r; }; }
  // ---------- la sphère : parfois, elle avale le chef ----------
  { const br0 = Au.break; Au.break = function (a) {
    const S = CG.S, R = CG.R; if (a && a.st === 'scelle' && !R.horde && Math.random() < Dh.CHANCE) { const i = S.autels.indexOf(a), p = S.player;
      if (Ar.partir(Dh.ID)) { Dh.enCours = { i, S, gagne: false }; a.st = 'vide'; a.day = S.day; /* la sphère est brisée pour de bon : même si le chef s'enfuit par le portail, le piédestal reste nu (pas de deuxième essai, pas de vagues) */ for (let k = 0; k < 30; k++) { const an = Math.random() * TAU, v = rand(60, 220); R.parts.push({ x: p.x, y: p.y - 30, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: rand(0.4, 0.9), max: 0.9, col: pick(['#ff7a3a', '#a060ff', '#ffd060']), size: rand(3, 6) }); } CG.sfx('warning'); if (Dh.sansRetour()) setTimeout(() => { try { CG.UI.toast('🔥 Le portail s\'est refermé derrière toi. Il n\'y a plus qu\'une sortie : battre le gardien.'); } catch (e) { /* rien */ } }, 2600); return; } }
    return br0.apply(this, arguments);
  }; }
  Dh.forcer = () => Ar.partir(Dh.ID); // pour les essais
  // ---------- ce que ses coups touchent ----------
  function frappe(x, y, r, dmg, feu) {
    const S = CG.S, R = CG.R, p = S.player; R.feuSrc = !!feu;
    try { if (!(R.ko > 0) && Math.hypot(p.x - x, p.y - y) < r) G.hurtPlayer(dmg); for (const a of S.pets) if (!a.ko && !a.ridden && Math.hypot(a.x - x, a.y - y) < r) CG.P.hurt(a, dmg * 0.6); for (const g of S.goblins.slice()) if (!g.hidden && Math.hypot(g.x - x, g.y - y) < r) G.hurtGoblin(g, dmg * 0.5); }
    finally { R.feuSrc = false; }
  }
  const hors = e => e.rooted > 0 || e.sleepT > 0 || e.para > 0 || e.poly || e.charm > 0;
  const repos = (e, s) => { e.sl.ph = 'repos'; e.sl.cd = rand(Dh.REPOS[0], Dh.REPOS[1]); e.sl.t = 0; e.spd = e.spd0; };
  function atterrir(e) { const R = CG.R, S = Dh.SAUT; e.sl.ph = 'recup'; e.sl.t = S.RECUP; frappe(e.x, e.y, S.RAYON, e.dmg * S.DMG); R.shake = Math.max(R.shake || 0, 0.3); R.rings.push({ x: e.x, y: e.y - 4, r: S.RAYON, life: 0.45, col: '#ffb060' }); G.puff(e.x, e.y - 6, '#c8a888', 26, 200, 5); if (CG.onScreen(e.x, e.y)) CG.sfx('tombe'); }
  function invoquer(e) {
    const R = CG.R, I = Dh.INVOQUE, l = la(I.SORTES), vivants = R.enemies.filter(o => !o.dead && o.slFils).length, pal = (CG.S.arene && CG.S.arene.palier) || 0;
    for (let k = 0; k < I.NB + (pal > 1 ? 1 : 0) && vivants + k < I.MAX; k++) { for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, d = rand(60, 150), x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d; if (!W.walkPx(x, y) || !W.walkPx(x, y - 14)) continue;
      (R.slTerre = R.slTerre || []).push({ x, y, t: 0.8, type: pick(l) }); R.rings.push({ x, y: y - 2, r: 26, life: 0.8, col: '#7a5a3a' }); break; } }
  }
  function boss(e, dt) {
    const R = CG.R, p = CG.S.player, s = e.sl || (e.sl = { ph: 'repos', cd: rand(1.5, 2.5), t: 0, rot: 0, dernier: '' }); if (e.spd0 === undefined) e.spd0 = e.spd;
    if (hors(e)) { if (s.ph === 'air') atterrir(e); else if (s.ph !== 'repos' && s.ph !== 'recup') repos(e); return; }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (s.ph === 'repos') {
      e.spd = e.spd0; s.cd -= dt; if (s.cd > 0 || d > Dh.VUE || R.ko > 0) return;
      const l = ['saut']; if (d < 280) l.push('tour', 'tour'); if (d < Dh.FEU.PORTEE + 30) l.push('feu', 'feu'); if (R.enemies.filter(o => !o.dead && o.slFils).length <= Dh.INVOQUE.MAX - 2) l.push('invoque');
      const c = l.filter(k => k !== s.dernier), k = pick(c.length ? c : l); s.dernier = k; s.ph = k + 'Prep'; s.t = k === 'tour' ? Dh.TOUR.PREP : k === 'saut' ? Dh.SAUT.PREP : k === 'feu' ? Dh.FEU.PREP : Dh.INVOQUE.DUR; s.tic = 0; e.path = null;
      if (k === 'invoque') { G.text(e.x, e.y - 96, 'Debout !', '#d0a0ff', true); CG.sfx('spell'); invoquer(e); } else if (CG.onScreen(e.x, e.y)) CG.sfx('warning');
      return;
    }
    e.spd = 0; e.atkCd = Math.max(e.atkCd || 0, 0.4); s.t -= dt; // pendant un coup spécial, il ne fait rien d'autre
    if (s.ph === 'tourPrep') { e.face = dx > 0 ? 1 : -1; if (s.t <= 0) { s.ph = 'tour'; s.t = Dh.TOUR.DUR; CG.sfx('swing'); } }
    else if (s.ph === 'tour') { const Q = Dh.TOUR; s.rot += dt * 17; G.slide(e, dx / d * Q.V * dt, dy / d * Q.V * dt, e.r || 14); s.tic -= dt;
      if (s.tic <= 0) { s.tic = Q.TIC; frappe(e.x, e.y, Q.RAYON, e.dmg * Q.DMG); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
      if (Math.random() < dt * 24) R.parts.push({ x: e.x + rand(-40, 40), y: e.y - 4, vx: rand(-60, 60), vy: rand(-50, -10), life: 0.35, max: 0.35, col: '#d8c8b0', size: 3, float: true });
      if (s.t <= 0) repos(e); }
    else if (s.ph === 'sautPrep') { if (s.t <= 0) { s.ph = 'air'; s.t = Dh.SAUT.AIR; G.puff(e.x, e.y - 6, '#c8a888', 18, 170, 4); CG.sfx('swing'); } }
    else if (s.ph === 'air') { const Q = Dh.SAUT; if (s.t > Q.VISE) { const k = Math.min(1, dt * 5); const nx = e.x + (p.x - e.x) * k, ny = e.y + (p.y - e.y) * k; if (W.walkPx(nx, ny)) { e.x = nx; e.y = ny; } } /* son ombre suit le chef, puis s'arrête juste avant la chute */ if (s.t <= 0) atterrir(e); }
    else if (s.ph === 'recup') { if (s.t <= 0) repos(e); }
    else if (s.ph === 'feuPrep') { e.face = dx > 0 ? 1 : -1; s.ang = Math.atan2(dy, dx); if (s.t <= 0) { s.ph = 'feu'; s.t = Dh.FEU.DUR; CG.sfx('bouleFeu'); } }
    else if (s.ph === 'feu') { const Q = Dh.FEU; let da = Math.atan2(dy, dx) - s.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; s.ang += Math.max(-dt * 0.9, Math.min(dt * 0.9, da)); e.face = Math.cos(s.ang) > 0 ? 1 : -1; s.tic -= dt; // le jet tourne lentement vers le chef : on peut le contourner
      for (let i = 0; i < 3; i++) { const a = s.ang + rand(-Q.ANGLE, Q.ANGLE), v = rand(240, 400); R.parts.push({ x: e.x + Math.cos(s.ang) * 22, y: e.y - 44, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 60, life: rand(0.3, 0.5), max: 0.5, col: pick(['#ffd060', '#ff8a1e', '#ff5a2a']), size: rand(3, 6) }); }
      if (s.tic <= 0) { s.tic = Q.TIC; const cible = (o, k, fn) => { const ox = o.x - e.x, oy = o.y - e.y, od = Math.hypot(ox, oy); if (od > Q.PORTEE) return; let a = Math.atan2(oy, ox) - s.ang; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; if (Math.abs(a) < Q.ANGLE + 0.12 || od < 30) fn(e.dmg * Q.DMG * k); };
        R.feuSrc = true; try { if (!(R.ko > 0)) cible(p, 1, v => G.hurtPlayer(v)); for (const a of CG.S.pets) if (!a.ko && !a.ridden) cible(a, 0.6, v => CG.P.hurt(a, v)); } finally { R.feuSrc = false; } }
      if (s.t <= 0) repos(e); }
    else if (s.ph === 'invoquePrep') { if (s.t <= 0) repos(e); }
    else repos(e);
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, S = CG.S; if (!R || !S || !R.enemies) return;
    { const h = Dh.enCours; if (h && !dedans() && !(CG.Mondes && CG.Mondes.pending) && !Ar.attente) { Dh.enCours = null; if (h.gagne) S.autelsDone = (S.autelsDone || 0) + 1; } } // de retour dehors : le piédestal est vide, son parchemin a été gagné en bas
    for (const e of R.enemies) { if (e.type !== Dh.TYPE) continue; if (e.dead) { if (!e.slFini) fin(e); continue; } boss(e, dt); }
    if (R.slBoss && !R.slBoss.slFini && (R.slBoss.dead || !R.enemies.includes(R.slBoss)) && R.slBoss.hp <= 0) fin(R.slBoss);
    for (const e of R.enemies) if (e.type === Dh.TYPE && !e.dead) R.slBoss = e;
    const L = R.slTerre; if (L && L.length) { for (const q of L) { q.t -= dt; if (Math.random() < dt * 22) R.parts.push({ x: q.x + rand(-12, 12), y: q.y - 2, vx: rand(-30, 30), vy: rand(-90, -30), life: 0.4, max: 0.4, col: pick(['#7a5a3a', '#5a4028', '#a08060']), size: rand(2.5, 4.5) });
        if (q.t <= 0) { const e = G.spawnEnemy(q.type, q.x, q.y, {}); if (e) { e.slFils = true; e.arene = true; e.calm = false; e.aggroR = 460; } G.puff(q.x, q.y - 10, '#7a5a3a', 16, 130, 4); if (CG.onScreen(q.x, q.y)) CG.sfx('hit'); } }
      R.slTerre = L.filter(q => q.t > 0); }
  };
  // il s'écroule : le parchemin tombe par terre, là où il est tombé, et le piédestal dehors est vidé
  function fin(e) {
    e.slFini = true; const S = CG.S, R = CG.R; if (!dedans()) return; R.slTerre = [];
    for (const o of R.enemies) if (o.slFils && !o.dead) G.hurtEnemy(o, 99999, null); // ses créatures retournent à la terre
    const id = G.newScroll(true); if (id) G.drop(e.x, e.y, { kind: 'scroll', id }); else { G.dropRes(e.x, e.y, 'or', 120); G.drop(e.x, e.y, { kind: 'potion', n: 1 }); }
    R.rings.push({ x: e.x, y: e.y - 10, r: 130, life: 0.7, col: '#ffe36b' }); G.text(e.x, e.y - 90, id ? '📖 Le tome !' : '🪙', '#ffe36b', true);
    if (Dh.enCours) Dh.enCours.gagne = true;
  }
  // en l'air, rien ne l'atteint
  { const he0 = G.hurtEnemy; G.hurtEnemy = function (e) { if (e && e.type === Dh.TYPE && e.sl && e.sl.ph === 'air' && !e.dead) return; return he0.apply(this, arguments); }; }
  // ---------- le dessin : pas de contour, des taches de couleur ----------
  const el = (g, x, y, rx, ry, c, r) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const poly = (g, p, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function bras(g, x, y, a, lame) { // un bras et son épée, depuis l'épaule (x, y), dans la direction a
    const cx = Math.cos(a), sy = Math.sin(a), mx = x + cx * 13, my = y + sy * 13;
    g.strokeStyle = '#8a2a2e'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(mx, my); g.stroke();
    el(g, mx, my, 3.4, 3.4, '#5a1a1e'); g.strokeStyle = '#c8a040'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(mx - sy * 4, my + cx * 4); g.lineTo(mx + sy * 4, my - cx * 4); g.stroke();
    const tx = mx + cx * lame, ty = my + sy * lame; poly(g, [mx - sy * 2.4, my + cx * 2.4, mx + sy * 2.4, my - cx * 2.4, tx, ty], '#dfe4ee'); poly(g, [mx, my, mx + sy * 2.4, my - cx * 2.4, tx, ty], '#aab2c4');
  }
  function dessin(g, e, t) {
    const s = e.sl || { ph: 'repos', rot: 0, t: 0 }, K = Dh.TAILLE, ph = s.ph;
    if (ph === 'air') { const Q = Dh.SAUT, k = 1 - Math.max(0, Math.min(1, s.t / Q.AIR)), r = 12 + 34 * k; el(g, e.x, e.y, r * 1.25, r * 0.5, 'rgba(0,0,0,' + (0.12 + 0.34 * k) + ')'); // seule son ombre : elle grossit et fonce avant qu'il retombe
      if (s.t < Q.VISE) { g.strokeStyle = 'rgba(255,120,60,' + (0.5 + 0.4 * Math.sin(t * 30)) + ')'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(e.x, e.y, Q.RAYON, Q.RAYON * 0.42, 0, 0, TAU); g.stroke(); const h = (s.t / Q.VISE) * 520; g.save(); g.translate(e.x, e.y - h); g.scale(K, K * 1.25); corps(g, e, t, s, 0); g.restore(); }
      return; }
    el(g, e.x, e.y + 1, 26, 8, 'rgba(0,0,0,0.3)');
    if (ph === 'tourPrep' || ph === 'tour') { g.strokeStyle = 'rgba(255,90,60,0.28)'; g.lineWidth = 2; g.beginPath(); g.ellipse(e.x, e.y, Dh.TOUR.RAYON, Dh.TOUR.RAYON * 0.42, 0, 0, TAU); g.stroke(); }
    if (ph === 'invoquePrep') { g.fillStyle = 'rgba(160,96,255,' + (0.18 + 0.1 * Math.sin(t * 12)) + ')'; g.beginPath(); g.ellipse(e.x, e.y, 46, 18, 0, 0, TAU); g.fill(); }
    if (ph === 'feuPrep') { const Q = Dh.FEU; g.fillStyle = 'rgba(255,120,40,0.16)'; g.beginPath(); g.moveTo(e.x, e.y - 20); g.arc(e.x, e.y - 20, Q.PORTEE, s.ang - Q.ANGLE, s.ang + Q.ANGLE); g.closePath(); g.fill(); }
    if (ph === 'feu') { const Q = Dh.FEU; g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 1; i <= 6; i++) { const d = Q.PORTEE * i / 6.5, w = 8 + i * 7; g.globalAlpha = 0.22 - i * 0.02; el(g, e.x + Math.cos(s.ang) * d, e.y - 30 + Math.sin(s.ang) * d, w * 1.2, w * 0.8, i < 3 ? '#ffd060' : '#ff6a1e', s.ang); } g.restore(); }
    g.save(); g.translate(e.x, e.y); const acc = ph === 'sautPrep' ? 0.78 : ph === 'recup' ? 0.86 : 1; g.scale(K, K * acc); corps(g, e, t, s, ph === 'tour' ? 1 : 0); g.restore();
  }
  function corps(g, e, t, s, tourne) {
    const f = e.face < 0 ? -1 : 1, mv = e.moving && !tourne ? Math.sin((e.step || 0) * TAU) : 0, b = Math.sin(t * 2.6 + (e.seed || 0)) * 0.8, ph = s.ph;
    g.save(); if (!tourne) g.scale(f, 1);
    g.strokeStyle = '#3a1418'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-5, -14); g.lineTo(-6 + mv * 5, 0); g.moveTo(5, -14); g.lineTo(6 - mv * 5, 0); g.stroke(); // les jambes
    if (tourne) { // il tournoie : six lames tout autour, et leur traînée
      g.strokeStyle = 'rgba(230,236,248,0.35)'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, -30, 42, 13, 0, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -30, 36, 10.5, 0, 0, TAU); g.stroke();
      const dos = [], devant = []; for (let i = 0; i < 6; i++) { const a = s.rot + i * TAU / 6; (Math.sin(a) < 0 ? dos : devant).push(a); }
      const lame = a => { const x0 = Math.cos(a) * 9, y0 = -30 + Math.sin(a) * 3, x1 = Math.cos(a) * 42, y1 = -30 + Math.sin(a) * 13; g.strokeStyle = '#8a2a2e'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.3); g.stroke(); g.strokeStyle = '#dfe4ee'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.3); g.lineTo(x1, y1); g.stroke(); };
      dos.forEach(lame); torse(g, b, ph, t); devant.forEach(lame);
    } else {
      const haut = ph === 'invoquePrep' ? -1.25 : ph === 'tourPrep' ? -0.7 : 0, sw = Math.sin(t * 2.2) * 0.08; // bras levés pour invoquer, écartés avant de tournoyer
      [[-0.95, 22], [-0.25, 24], [0.45, 22]].forEach((q, i) => { bras(g, -9, -38 + i * 4, Math.PI - (q[0] + haut * (i === 0 ? 0.4 : 1) + sw), q[1]); });
      torse(g, b, ph, t);
      [[-0.95, 22], [-0.25, 24], [0.45, 22]].forEach((q, i) => { bras(g, 9, -38 + i * 4, q[0] + haut * (i === 0 ? 0.4 : 1) + sw, q[1]); });
    }
    g.restore();
  }
  function torse(g, b, ph, t) {
    poly(g, [-12, -44 + b, 12, -44 + b, 9, -13, -9, -13], '#7a1f24'); poly(g, [2, -44 + b, 12, -44 + b, 9, -13, 3, -13], '#5e161b'); // le torse
    poly(g, [-10, -36 + b, 10, -36 + b, 8, -24, -8, -24], '#3a2a30'); g.fillStyle = '#c8a040'; g.fillRect(-9, -24, 18, 2.4); el(g, 0, -30 + b, 2.6, 2.6, '#ff7a3a'); // une plaque de fer noir, une braise au milieu
    el(g, 0, -52 + b, 9, 8.5, '#8a2a2e'); el(g, 3, -51 + b, 5.5, 7, '#6e1e24'); // la tête
    poly(g, [-7, -56 + b, -13, -69 + b, -3, -59 + b], '#e8dcc0'); poly(g, [7, -56 + b, 13, -69 + b, 3, -59 + b], '#d0c4a8'); // les cornes
    const feu = ph === 'feu' || ph === 'feuPrep', oe = feu ? '#fff2b0' : '#ffd060'; el(g, -3.2, -53 + b, 1.9, 1.5, oe); el(g, 3.4, -53 + b, 1.9, 1.5, oe);
    if (feu) { el(g, 1, -47 + b, 4, 3.2, '#2a0a0c'); el(g, 1, -47 + b, 2.6, 2, ph === 'feu' ? '#ffd060' : '#ff7a3a'); } else { g.fillStyle = '#2a0a0c'; g.fillRect(-3.5, -48 + b, 7, 1.6); poly(g, [-3, -47 + b, -1.6, -44 + b, -0.6, -47 + b], '#f4ecd8'); poly(g, [3, -47 + b, 1.6, -44 + b, 0.6, -47 + b], '#f4ecd8'); }
  }
  { const ae = Art.enemy; Art.enemy = function (g, e, t) { if (!e || e.type !== Dh.TYPE) return ae.apply(this, arguments); try { dessin(g, e, t || 0); } catch (x) { /* un dessin raté ne doit pas arrêter le jeu */ } }; }
})(window.CG);
