// Goblin Malin — le Feu follet rouge : le grand frère du petit feu follet bleu. Plus costaud, plus méchant, et il ne tire pas
// une boule de feu : il crache une gerbe de braises (NB) un peu partout devant lui. Chaque braise retombe et laisse une flamme
// au sol pendant SOL secondes : qui marche dedans se brûle.
// Il remplace parfois un feu follet ordinaire à partir du jour JOUR (CHANCE). Tout est réglable dans CG.FolletRouge.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, rand = CG.rand, dist = CG.dist, TAU = Math.PI * 2;
  const Fr = CG.FolletRouge = { TYPE: 'folletRouge', JOUR: 5, CHANCE: 0.3, REPOS: [2.4, 3.4], NB: 5, EVENTAIL: 0.7, LOIN: [60, 200], VOL: 0.5, SOL: 3, RAYON: 19, CHOC: 0.6, BRULE: 0.3, TIC: 0.5 };
  CG.ENEMIES[Fr.TYPE] = { nom: 'Feu follet rouge', race: 'bete', hp: 32, dmg: 8, spd: 96, xp: 24, or: 9, cost: 4.5, range: 210, magic: true };
  const sp0 = G.spawnEnemy; G.spawnEnemy = function (type, x, y, opts) { const d = CG.S ? CG.S.day : 1; return sp0.call(this, type === 'follet' && !(opts && opts.exact) && d >= Fr.JOUR && Math.random() < Fr.CHANCE ? Fr.TYPE : type, x, y, opts); };
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.retreat || e.calm;
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && !g.dead && g.ko !== true && !g.perch) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); return l; };
  const brule = (o, dmg) => { const S = CG.S, R = CG.R; R.feuSrc = true; try { if (o === S.player) G.hurtPlayer(dmg); else if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); } finally { R.feuSrc = false; } };
  function gerbe(e, tg) {
    const R = CG.R, a0 = Math.atan2(tg.y - e.y, tg.x - e.x), d0 = dist(e, tg); e.atkAnim = 1; e.face = tg.x > e.x ? 1 : -1; if (CG.onScreen(e.x, e.y)) CG.sfx('bouleFeu');
    for (let i = 0; i < Fr.NB; i++) { const a = a0 + (i === 0 ? 0 : (i / (Fr.NB - 1) - 0.5) * 2 * Fr.EVENTAIL + rand(-0.12, 0.12)), d = i === 0 ? CG.clamp(d0, Fr.LOIN[0], Fr.LOIN[1]) : rand(Fr.LOIN[0], Fr.LOIN[1]); /* la première vise la cible, les autres s'éparpillent */
      (R.braises = R.braises || []).push({ x0: e.x, y0: e.y - 22, x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, t: 0, max: Fr.VOL + d / 900, dmg: e.dmg, s: Math.random() * 10 }); }
  }
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S || !R.enemies) return r;
    for (const e of R.enemies) { if (e.dead || e.type !== Fr.TYPE) continue; e.atkCd = Math.max(e.atkCd || 0, 0.6); /* pas de boule de feu ordinaire : seulement la gerbe */
      if (pris(e)) continue; e.gerbeCd = (e.gerbeCd === undefined ? rand(0.8, 1.8) : e.gerbeCd) - dt; const tg = e.target; if (e.gerbeCd > 0 || !tg || tg.dead || tg.hidden || tg.x === undefined) continue;
      if (dist(e, tg) > Fr.LOIN[1] + 30 || !W.lineClear(e.x, e.y, tg.x, tg.y)) continue; gerbe(e, tg); e.gerbeCd = rand(Fr.REPOS[0], Fr.REPOS[1]); }
    const B = R.braises; if (B && B.length) { for (const b of B) { b.t += dt; if (b.t < b.max) continue; b.fini = true;
        if (CG.onScreen(b.x, b.y)) { G.puff(b.x, b.y - 4, '#ff8a1e', 7, 90, 3); }
        for (const o of nous()) if (Math.hypot(o.x - b.x, o.y - b.y) < Fr.RAYON) brule(o, b.dmg * Fr.CHOC);
        if (W.walkPx(b.x, b.y)) (R.feuxSol = R.feuxSol || []).push({ x: b.x, y: b.y, t: Fr.SOL, max: Fr.SOL, dmg: b.dmg * Fr.BRULE, tic: Fr.TIC, s: b.s }); }
      R.braises = B.filter(b => !b.fini); }
    const F = R.feuxSol; if (F && F.length) { let L = null; for (const f of F) { f.t -= dt; f.tic -= dt; if (f.tic > 0) continue; f.tic = Fr.TIC; L = L || nous(); for (const o of L) if (Math.hypot(o.x - f.x, o.y - f.y) < Fr.RAYON) brule(o, f.dmg); }
      R.feuxSol = F.filter(f => f.t > 0); }
    return r;
  };
  // les alliés qui savent éviter le feu ne restent pas dans les flammes
  if (CG.Esquive && CG.Esquive.SOURCES) CG.Esquive.SOURCES.push(R => (R.feuxSol || []).map(f => ({ x: f.x, y: f.y, r: Fr.RAYON, ty: 'souffle', cle: f })));
  // ---------- les dessins ----------
  const circ = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); };
  const flamme = (g, x, fy, w, h, col, dx) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - w, fy + 6); g.quadraticCurveTo(x - w * 1.35, fy - h * 0.35, x + dx, fy - h); g.quadraticCurveTo(x + w * 1.35, fy - h * 0.35, x + w, fy + 6); g.quadraticCurveTo(x, fy + 6 + w * 0.7, x - w, fy + 6); g.fill(); };
  const ae = Art.enemy; Art.enemy = function (g, e, t0) {
    if (e.type !== Fr.TYPE) return ae.apply(this, arguments); const t = t0 + (e.seed || 0), face = e.face < 0 ? -1 : 1, x = e.x, y = e.y, mad = !e.calm, crache = e.atkAnim > 0;
    const fy = y - 28 + Math.sin(t * 4.4) * 4, fl = Math.sin(t * 10) * 3.4, k = crache ? 1 + Math.sin(e.atkAnim * Math.PI) * 0.25 : 1;
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(x, y + 1, 10, 3.4, 0, 0, TAU); g.fill();
    circ(g, x, fy, (24 + Math.sin(t * 5) * 2.5) * k, 'rgba(255,90,40,0.15)'); circ(g, x, fy, 15 * k, 'rgba(255,150,60,0.2)');
    flamme(g, x - 7, fy + 2, 4, 13, '#c8281a', -fl * 0.8); flamme(g, x + 7, fy + 2, 4, 14, '#c8281a', fl * 0.9); /* deux flammèches de côté, comme des cornes */
    flamme(g, x, fy, 11 * k, 25 * k, '#d8301c', fl); flamme(g, x, fy, 8 * k, 18 * k, '#ff7a1e', fl * 0.7); flamme(g, x, fy, 5 * k, 11.5 * k, '#ffd24a', fl * 0.4); flamme(g, x, fy + 1, 2.6, 6, '#fff6c8', fl * 0.2);
    [[-11, -7], [11, -12], [-6, -22], [5, -26]].forEach(([dx, dy], i) => { const ph = (t * 1.5 + i * 0.29) % 1; circ(g, x + dx + Math.sin(t * 3 + i) * 2.4, fy + dy - ph * 13, 1.7 * (1 - ph), 'rgba(255,' + (190 - i * 20) + ',90,' + (1 - ph).toFixed(2) + ')'); });
    const ex = x + face * 1.4; g.fillStyle = '#3a0a04'; for (const d of [-2.8, 2.8]) { g.beginPath(); g.ellipse(ex + d, fy + 0.8, 1.6, 2.2, 0, 0, TAU); g.fill(); } circ(g, ex - 2.4, fy, 0.6, '#ffe9a8'); circ(g, ex + 3.2, fy, 0.6, '#ffe9a8');
    if (mad) { g.strokeStyle = '#3a0a04'; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 5, fy - 3.4); g.lineTo(ex - 1.2, fy - 1.8); g.moveTo(ex + 5, fy - 3.4); g.lineTo(ex + 1.2, fy - 1.8); g.stroke(); }
    g.fillStyle = '#3a0a04'; g.beginPath(); g.ellipse(ex, fy + 5, crache ? 2.6 : 1.4, crache ? 3 : 0.9, 0, 0, TAU); g.fill(); if (crache) circ(g, ex, fy + 5.4, 1.3, '#ffb030');
  };
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const b of R.braises || []) { if (!CG.onScreen(b.x, b.y)) continue; const k = b.t / b.max; g.globalAlpha = 0.15 + k * 0.3; g.fillStyle = '#ff5a1e'; g.beginPath(); g.ellipse(b.x, b.y, Fr.RAYON * (0.4 + k * 0.6), Fr.RAYON * 0.5 * (0.4 + k * 0.6), 0, 0, TAU); g.fill(); } /* là où elle va tomber */
    for (const f of R.feuxSol || []) { if (!CG.onScreen(f.x, f.y)) continue; const a = Math.min(1, f.t / 0.5); g.globalAlpha = a * 0.5; g.fillStyle = '#3a1408'; g.beginPath(); g.ellipse(f.x, f.y + 2, Fr.RAYON, Fr.RAYON * 0.5, 0, 0, TAU); g.fill(); g.globalAlpha = a * 0.3; g.fillStyle = '#ff7a1e'; g.beginPath(); g.ellipse(f.x, f.y + 2, Fr.RAYON + 5, Fr.RAYON * 0.5 + 3, 0, 0, TAU); g.fill(); }
    g.globalAlpha = 1; }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const f of R.feuxSol || []) { if (!CG.onScreen(f.x, f.y)) continue; const a = Math.min(1, f.t / 0.5), h = (0.75 + Math.sin(t * 9 + f.s) * 0.15) * Math.min(1, (f.max - f.t) / 0.15 + 0.3); g.globalAlpha = a;
      [[-9, 0.7, 1.3], [8, 0.8, 2.6], [0, 1.15, 0]].forEach(([dx, sc, ph]) => { const fl = Math.sin(t * 11 + f.s + ph) * 2.4; flamme(g, f.x + dx, f.y - 3, 6 * sc, 17 * sc * h, '#e03a1c', fl); flamme(g, f.x + dx, f.y - 3, 4 * sc, 11.5 * sc * h, '#ff8a1e', fl * 0.7); flamme(g, f.x + dx, f.y - 3, 2.2 * sc, 6.5 * sc * h, '#ffe36b', fl * 0.4); }); }
    g.globalAlpha = 1;
    for (const b of R.braises || []) { const k = b.t / b.max, x = b.x0 + (b.x - b.x0) * k, y = b.y0 + (b.y - b.y0) * k - Math.sin(k * Math.PI) * 46; if (!CG.onScreen(x, y)) continue;
      for (let i = 1; i <= 3; i++) { const k2 = Math.max(0, k - i * 0.05), x2 = b.x0 + (b.x - b.x0) * k2, y2 = b.y0 + (b.y - b.y0) * k2 - Math.sin(k2 * Math.PI) * 46; circ(g, x2, y2, 3.6 - i * 0.8, 'rgba(255,120,40,' + (0.5 - i * 0.13).toFixed(2) + ')'); }
      circ(g, x, y, 4.6, '#e03a1c'); circ(g, x, y, 3.1, '#ff9a2a'); circ(g, x, y, 1.6, '#fff0b0'); } }; }
})(window.CG);
