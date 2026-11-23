// Goblin Malin — huit sorts de plus pour les petits cercles (Faiblesse, le 9e, est dans sortsfaibles.js).
//   2e cercle : Frénésie (on frappe plus vite), Rusé (plus de vie et de mana max), Venin (empoisonne un seul monstre),
//               Mur de pierre (un mur qui barre le passage : 4 cases, puis 6 en métal, puis 8 gravé de runes).
//   3e cercle : Coffre-piège (un faux coffre : l'humain, le démon, le gnome ou l'elfe qui l'ouvre reçoit un gant de boxe en pleine
//               figure et recule de dix cases), Flair du trésor (dit si un coffre est un vrai ou un coffre vorace),
//               Protection (les coups font moins mal), Force (on frappe plus fort).
// Chacun a ses trois niveaux. Tout se règle dans CG.SortsNeufs.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, SP = CG.SPELLS, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  const Sn = CG.SortsNeufs = {
    FRENESIE: { dur: 20, k: [0.7, 0.55, 0.42] }, /* k : ce qu'il reste du temps entre deux coups */
    RUSE: { dur: 90, k: [0.1, 0.2, 0.3] },
    VENIN: { portee: 330, dur: [8, 10, 12], dps: [1, 1.6, 2.4], saute: 130 },
    MUR: { nb: [4, 6, 8], dur: [12, 16, 26], devant: 58 },
    COFFRE: { dur: 45, coups: [1, 2, 3], attire: 240, dmg: [1, 1.5, 2.2], recul: 10, sonne: 5, races: ['humain', 'demon', 'gnome', 'elfe'] },
    FLAIR: { rayon: [320, 520, 800], dur: 90 },
    PROTEC: { dur: 30, k: [0.85, 0.75, 0.62] }, /* la part des dégâts qui passe encore */
    FORCE: { dur: 30, k: [1.1, 1.3, 1.6] }
  };
  const def = (id, nom, icon, color, desc) => { SP[id] = { nom, icon, mp: 6, prix: 500, color, desc }; if (!CG.SCROLL_POOL.includes(id)) CG.SCROLL_POOL.push(id); };
  def('frenesie', 'Frénésie', '💢', '#ff9a5a', 'Pendant 20 secondes, tu frappes bien plus vite.');
  def('ruse', 'Rusé', '🦊', '#ffc070', 'Pendant une minute et demie, tu as plus de vie et plus de mana au maximum.');
  def('venin', 'Venin', '🐍', '#7dff6a', 'Le monstre le plus proche est empoisonné : le venin le ronge pendant plusieurs secondes.');
  def('murpierre', 'Mur de pierre', '🧱', '#b8b8c4', 'Un mur de pierre sort du sol devant toi : personne ne passe au travers tant qu\'il tient.');
  def('coffrepiege', 'Coffre-piège', '🥊', '#ff5a4a', 'Tu poses un faux coffre. L\'humain, le démon, le gnome ou l\'elfe qui vient l\'ouvrir reçoit un gant de boxe en pleine figure et vole dix cases plus loin. S\'il heurte quelque chose, il reste sonné.');
  def('flair', 'Flair du trésor', '🔎', '#ffe36b', 'Tu sens les coffres autour de toi : un vrai trésor, ou un coffre vorace qui attend de te mordre ?');
  def('protec', 'Protection', '🛡️', '#9ad0ff', 'Pendant 30 secondes, les coups te font moins mal.');
  def('force', 'Force', '💪', '#ff7a5a', 'Pendant 30 secondes, tu frappes plus fort.');
  Sn.T = {
    frenesie: ['Tu frappes encore plus vite.', 'Tu frappes plus de deux fois plus vite.'], ruse: ['Encore plus de vie et de mana.', 'Bien plus de vie et de mana.'],
    venin: ['Venin plus fort, plus longtemps.', 'Venin terrible : quand le monstre tombe, le venin saute sur son voisin.'],
    murpierre: ['Six cases de large, en métal : il tient plus longtemps.', 'Huit cases de large, gravé de runes : il tient très longtemps.'],
    coffrepiege: ['Le gant frappe deux fois avant que le coffre s\'en aille, et plus fort.', 'Trois coups de gant, encore plus forts.'],
    flair: ['Tu sens les coffres de plus loin, et les faux se marquent en rouge sur la mini-carte.', 'Tu sens les coffres de très loin.'],
    protec: ['Les coups font encore moins mal.', 'Les coups font bien moins mal.'], force: ['Tu frappes bien plus fort.', 'Tu frappes beaucoup plus fort.']
  };
  if (CG.Sorts3) CG.Sorts3.FLECHE = G.ETINCELLE || 5; // la Flèche magique : mêmes dégâts que l'Étincelle, mais elle part plus vite et va plus loin
  if (SP.fleche) SP.fleche.desc = 'Une flèche de lumière : elle part plus vite et va plus loin que l\'Étincelle, pour les mêmes dégâts.';
  const niv = id => (CG.Niveaux && CG.Niveaux.niv ? Math.min(3, CG.Niveaux.niv(id)) : 1);
  const MIENS = Object.keys(Sn.T);
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('ruse')) CG.Mondes.GLOBAL.push('ruse');
  // ---------- Rusé : la vie et le mana en plus, rendus à la fin ----------
  function finRuse() { const S = CG.S, p = S.player, r = S.ruse; if (!r) return; S.ruse = null; p.maxhp = Math.max(1, p.maxhp - r.hp); p.maxmp = Math.max(0, p.maxmp - r.mp); p.hp = Math.min(p.hp, p.maxhp); p.mp = Math.min(p.mp, p.maxmp); }
  // ---------- le mur ----------
  function mur(n) {
    const R = CG.R, p = CG.S.player, Q = Sn.MUR, d = R.dir || { x: p.face || 1, y: 0 }, L = Math.hypot(d.x, d.y) || 1, cx = Math.floor((p.x + d.x / L * Q.devant) / T), cy = Math.floor((p.y + d.y / L * Q.devant) / T), vert = Math.abs(d.x) >= Math.abs(d.y), nb = Q.nb[n - 1], cases = [];
    for (let i = 0; i < nb; i++) { const o = i - Math.floor((nb - 1) / 2), tx = cx + (vert ? 0 : o), ty = cy + (vert ? o : 0); if (tx < 2 || ty < 2 || tx > CG.MW - 3 || ty > CG.MH - 3) continue; const j = W.idx(tx, ty), t = W.tile[j];
      if (!(t === W.GRASS || t === W.PATH || t === W.CLEAR || t === W.FLOOR)) continue; const x = tx * T + T / 2, y = ty * T + T / 2; if (Math.hypot(p.x - x, p.y - y) < 30 || R.enemies.some(e => !e.dead && Math.hypot(e.x - x, e.y - y) < 24) || CG.S.goblins.some(g => !g.hidden && Math.hypot(g.x - x, g.y - y) < 24)) continue;
      W.tile[j] = W.BUILD; cases.push({ tx, ty, j, t }); G.puff(x, y, '#b8b8c4', 8, 90, 3); }
    if (!cases.length) return false; W.fieldDirty = true; (R.mursPierre = R.mursPierre || []).push({ cases, t: Q.dur[n - 1], max: Q.dur[n - 1], n }); R.shake = Math.max(R.shake || 0, 0.12); CG.sfx('tombe'); return true;
  }
  function tomber(m) { for (const c of m.cases) { if (W.tile[c.j] === W.BUILD) W.tile[c.j] = c.t; G.puff(c.tx * T + T / 2, c.ty * T + T / 2, '#9a9aa6', 8, 80, 3); } W.fieldDirty = true; }
  // ---------- les sorts ----------
  const ca0 = G.cast; G.cast = function (id) {
    if (!MIENS.includes(id)) return ca0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return; const cost = G.spellCost(id), n = niv(id), col = SP[id].color;
    const rate = msg => { CG.sfx('no'); G.text(p.x, p.y - 56, msg, col); };
    if (p.mp < cost) return rate('Pas assez de mana');
    const payer = () => { p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); R.rings.push({ x: p.x, y: p.y - 8, r: 54, life: 0.4, col }); };
    if (id === 'frenesie') { payer(); R.frenesie = { t: Sn.FRENESIE.dur, k: Sn.FRENESIE.k[n - 1] }; G.text(p.x, p.y - 62, '💢 Frénésie !', col, true); return; }
    if (id === 'protec') { payer(); R.protec = { t: Sn.PROTEC.dur, k: Sn.PROTEC.k[n - 1] }; G.text(p.x, p.y - 62, '🛡️ Protection !', col, true); return; }
    if (id === 'force') { payer(); R.forceS = { t: Sn.FORCE.dur, k: Sn.FORCE.k[n - 1] }; G.text(p.x, p.y - 62, '💪 Force !', col, true); return; }
    if (id === 'ruse') { payer(); finRuse(); const hp = Math.round(p.maxhp * Sn.RUSE.k[n - 1]), mp = Math.round(p.maxmp * Sn.RUSE.k[n - 1]); p.maxhp += hp; p.maxmp += mp; p.hp += hp; p.mp = Math.min(p.maxmp, p.mp + mp); S.ruse = { hp, mp, t: Sn.RUSE.dur }; G.text(p.x, p.y - 62, '🦊 Rusé !', col, true); return; }
    if (id === 'venin') { const Q = Sn.VENIN; let tg = null, bd = Q.portee; for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; tg = e; } } if (!tg) return rate('Aucun monstre ici');
      payer(); p.face = tg.x > p.x ? 1 : -1; R.bolts.push({ x1: p.x, y1: p.y - 26, x2: tg.x, y2: tg.y - 18, life: 0.25 }); mordre(tg, n); return; }
    if (id === 'murpierre') { if (!mur(n)) return rate('Pas de place pour un mur ici'); payer(); return; }
    if (id === 'coffrepiege') { const d = R.dir || { x: p.face || 1, y: 0 }, L = Math.hypot(d.x, d.y) || 1; let x = p.x + d.x / L * 46, y = p.y + d.y / L * 46; if (!W.walkPx(x, y)) { x = p.x; y = p.y + 6; }
      payer(); const Q = Sn.COFFRE; (R.coffresPieges = R.coffresPieges || []).push({ x, y, t: Q.dur, coups: Q.coups[n - 1], dmg: (8 + p.lvl * 2) * Q.dmg[n - 1], poing: 0, ux: 1, uy: 0 }); G.puff(x, y - 8, '#c9a56b', 12, 90, 3); return; }
    if (id === 'flair') { const Q = Sn.FLAIR, ray = Q.rayon[n - 1], l = (R.chests || []).filter(c => !c.open && Math.hypot(c.x - p.x, c.y - p.y) < ray); payer(); R.rings.push({ x: p.x, y: p.y - 6, r: Math.min(ray, 420), life: 0.7, col });
      if (!l.length) { G.text(p.x, p.y - 62, 'Aucun coffre près d\'ici', col); return; }
      let faux = 0; l.forEach(c => { const f = !!(CG.Mimic && CG.Mimic.est && CG.Mimic.est(c)); c.flair = { faux: f, t: R.t + Q.dur }; if (f) { faux++; if (n >= 2) c.flairFaux = true; } });
      G.text(p.x, p.y - 62, faux ? '🔎 ' + faux + (faux > 1 ? ' coffres voraces !' : ' coffre vorace !') : '🔎 Que des vrais trésors', faux ? '#ff8a7a' : '#c8ffb0', true); return; }
  };
  function mordre(e, n) { const Q = Sn.VENIN, p = CG.S.player; e.veninS = { t: Q.dur[n - 1], dps: (2.5 + p.lvl * 0.6) * Q.dps[n - 1], tic: 0.5, n }; G.text(e.x, e.y - 60, '🐍 Empoisonné !', '#7dff6a', true); G.puff(e.x, e.y - 20, '#7dff6a', 10, 80, 3); }
  // ---------- ce que font les buffs ----------
  { const at0 = G.attack; G.attack = function () { const R = CG.R, cd = R ? R.atkCd : 0, r = at0.apply(this, arguments); if (R && R.frenesie && R.frenesie.t > 0 && R.atkCd > cd) R.atkCd *= R.frenesie.k; return r; }; }
  { const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { const R = CG.R; if (R && R.protec && R.protec.t > 0) dmg *= R.protec.k; return hp0.call(this, dmg); }; }
  { const pd = G.playerDmg; G.playerDmg = function () { const R = CG.R; return pd.apply(this, arguments) * (R && R.forceS && R.forceS.t > 0 ? R.forceS.k : 1); }; }
  if (CG.Buffs && CG.Buffs.LISTE) { const L = CG.Buffs.LISTE, t = k => () => { const q = CG.R && CG.R[k]; return q && q.t > 0 ? q.t : 0; };
    L.push({ k: 'frenesie', ic: '💢', nom: () => SP.frenesie.nom, txt: 'Tu frappes plus vite.', t: t('frenesie') }, { k: 'protec', ic: '🛡️', nom: () => SP.protec.nom, txt: 'Les coups te font moins mal.', t: t('protec') }, { k: 'forceS', ic: '💪', nom: () => SP.force.nom, txt: 'Tu frappes plus fort.', t: t('forceS') },
      { k: 'ruse', ic: '🦊', nom: () => SP.ruse.nom, txt: 'Plus de vie et de mana au maximum.', t: () => (CG.S && CG.S.ruse ? CG.S.ruse.t : 0) }); }
  // ---------- chaque instant ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, S = CG.S; if (!R || !S || !R.enemies) return; const p = S.player;
    ['frenesie', 'protec', 'forceS'].forEach(k => { if (R[k] && R[k].t > 0) R[k].t -= dt; });
    if (S.ruse) { S.ruse.t -= dt; if (S.ruse.t <= 0) finRuse(); }
    for (const e of R.enemies) { const v = e.veninS; if (!v) continue; if (e.dead) { e.veninS = null; if (v.n >= 3 && v.t > 1) { let tg = null, bd = Sn.VENIN.saute; for (const o of R.enemies) { if (o === e || o.dead || o.struct || o.charm > 0 || o.veninS) continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd) { bd = d; tg = o; } } if (tg) mordre(tg, v.n); } continue; }
      v.t -= dt; v.tic -= dt; if (v.tic <= 0) { v.tic = 0.5; const c0 = R.dmgCol; R.dmgCol = CG.DMG ? CG.DMG.poison : '#6fe03a'; try { G.hurtEnemy(e, v.dps * 0.5, p); } finally { R.dmgCol = c0; } } if (v.t <= 0) e.veninS = null; }
    const M = R.mursPierre; if (M && M.length) { for (const m of M) { m.t -= dt; if (m.t <= 0) tomber(m); } R.mursPierre = M.filter(m => m.t > 0); }
    const C = R.coffresPieges; if (C && C.length) { const Q = Sn.COFFRE;
      for (const c of C) { c.t -= dt; if (c.poing > 0) c.poing -= dt;
        for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0 || e.kb || (e.leurreNon > R.t) || e.rooted > 0) continue; const d = CG.ENEMIES[e.type] || {}; if (d.boss || !Q.races.includes(d.race)) continue; const dx = e.x - c.x, dy = e.y - c.y, q = Math.hypot(dx, dy) || 1; if (q > Q.attire || c.coups <= 0) continue;
          if (q > 34) { e.aggro = null; e.target = null; e.atkCd = Math.max(e.atkCd || 0, 0.3); G.chase(e, c.x, c.y + 4, (e.spd || 70) * 1.15, dt); continue; } // il ne résiste pas : il va l'ouvrir
          c.coups--; c.poing = 0.4; c.ux = dx / q; c.uy = dy / q; e.kb = { vx: c.ux * 1450, vy: c.uy * 1450, t: 0.6 }; e.path = null; e.calm = false; e.poing = { x: e.x, y: e.y, t: R.t + 0.62 }; e.leurreNon = R.t + 25;
          G.hurtEnemy(e, c.dmg, p); G.text(c.x, c.y - 60, 'PAF !', '#ff5a4a', true); R.shake = Math.max(R.shake || 0, 0.2); CG.sfx('hit'); if (c.coups <= 0) c.t = Math.min(c.t, 1.2); } }
      R.coffresPieges = C.filter(c => { if (c.t > 0) return true; G.puff(c.x, c.y - 8, '#c9a56b', 10, 80, 3); return false; }); }
    for (const e of R.enemies) { const q = e.poing; if (!q || e.dead) continue; if (R.t < q.t && e.kb) continue; e.poing = null; // arrêté net par un obstacle avant d'avoir fait ses dix cases : sonné
      if (Math.hypot(e.x - q.x, e.y - q.y) < Sn.COFFRE.recul * T * 0.8) { e.rooted = Math.max(e.rooted || 0, Sn.COFFRE.sonne); e.etourdi = R.t + Sn.COFFRE.sonne; G.text(e.x, e.y - 58, '💫', '#fff', true); } }
  };
  // ---------- les dessins ----------
  const box = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, el = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const bloc = { draw(g, o, t) { const m = o.m, x = o.x - T / 2, y = o.y - T / 2, k = Math.min(1, (m.max - m.t) / 0.25), fin = Math.min(1, m.t / 0.4), h = 46 * k * fin, metal = m.n === 2, rune = m.n === 3;
    el(g, o.x, o.y + 16, 22, 6, 'rgba(0,0,0,0.25)'); box(g, x + 1, y + T - 4 - h, T - 2, h, metal ? '#8f9cb0' : '#9a968c'); box(g, x + T / 2, y + T - 4 - h, T / 2 - 1, h, 'rgba(0,0,0,0.14)'); box(g, x + 1, y + T - 4 - h, T - 2, 4, 'rgba(255,255,255,0.28)');
    if (h > 20) { if (metal) { g.fillStyle = '#dfe6f2'; [[6, 8], [T - 8, 8], [6, h - 8], [T - 8, h - 8]].forEach(q => { g.beginPath(); g.arc(x + q[0], y + T - 4 - h + q[1], 1.8, 0, TAU); g.fill(); }); }
      else { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + 1, y + T - 4 - h * 0.5, T - 2, 1.5); g.fillRect(x + T * 0.5, y + T - 4 - h, 1.5, h * 0.5); g.fillRect(x + T * 0.28, y + T - 4 - h * 0.5, 1.5, h * 0.5); }
      if (rune) { g.fillStyle = 'rgba(140,220,255,' + (0.55 + 0.3 * Math.sin(t * 4 + o.x)) + ')'; g.fillRect(x + T / 2 - 1.5, y + T - 4 - h + 9, 3, 14); g.fillRect(x + T / 2 - 6, y + T - 4 - h + 14, 12, 3); } } } };
  const coffre = { draw(g, o, t) { const c = o.c, x = c.x, y = c.y, a = Math.min(1, c.t / 0.5);
    g.save(); g.globalAlpha = a; el(g, x, y + 3, 17, 5, 'rgba(0,0,0,0.25)'); box(g, x - 14, y - 16, 28, 18, '#8a5a2a'); box(g, x, y - 16, 14, 18, 'rgba(0,0,0,0.14)'); box(g, x - 15, y - 21, 30, 7, '#a06a32'); box(g, x - 15, y - 15, 30, 2.5, '#e8c84a'); box(g, x - 2.5, y - 14, 5, 6, '#e8c84a');
    el(g, x + 10, y - 23, 3, 3, '#ff3a2a'); // notre marque : nous, on sait que c'est un piège
    if (c.poing > 0) { const k = Math.sin((1 - c.poing / 0.4) * Math.PI), L = 14 + 46 * k, gx = x + c.ux * L, gy = y - 12 + c.uy * L * 0.8; g.strokeStyle = '#b8bcc8'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y - 12); for (let i = 1; i <= 6; i++) g.lineTo(x + c.ux * L * i / 6 + (i % 2 ? 4 : -4) * -c.uy, y - 12 + c.uy * L * 0.8 * i / 6 + (i % 2 ? 4 : -4) * c.ux); g.stroke(); el(g, gx, gy, 10, 9, '#e8281e'); el(g, gx - c.ux * 6, gy - c.uy * 5, 6, 6, '#c81e16'); el(g, gx + 2, gy - 3, 3.5, 2.5, 'rgba(255,255,255,0.45)'); box(g, gx - c.ux * 12 - 3, gy - c.uy * 9 - 3, 6, 6, '#f4f0e8'); }
    g.restore(); } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const m of R.mursPierre || []) for (const c of m.cases) { const x = c.tx * T + T / 2, y = c.ty * T + T / 2; if (CG.onScreen(x, y)) push(y + 14, 21, { x, y, m, draw: bloc.draw }, null); }
    for (const c of R.coffresPieges || []) if (CG.onScreen(c.x, c.y)) push(c.y + 2, 21, { x: c.x, y: c.y, c, draw: coffre.draw }, null); }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const R = CG.R; if (!R || !R.chests) return;
    for (const c of R.chests) { const f = c.flair; if (!f || c.open || f.t < R.t || !CG.onScreen(c.x, c.y)) continue; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.fillStyle = f.faux ? '#ff5a4a' : '#8dffb0'; g.fillText(f.faux ? '👹 Faux !' : '✔ Vrai', c.x, c.y - 40 + Math.sin(t * 3) * 2); } }; }
})(window.CG);
