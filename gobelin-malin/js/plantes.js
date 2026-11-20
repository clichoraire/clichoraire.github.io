// Goblin Malin — deux plantes mauvaises, enracinées : elles ne bougent pas, il faut passer au large ou les arracher.
//   le Crache-braise : une grosse fleur aux pétales de flamme, bien visible, qui crache des boules de feu de loin ;
//   la Mordeuse : cachée dans l'herbe, on ne la voit pas du tout. Si le chef passe juste à côté, elle jaillit et le mord.
//     Une fois sortie, elle reste là et mord ce qui s'approche. Elle ne pousse jamais sur un sentier.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand; if (!G || !Art) return;
  // FEU / PIEGES : [au départ, un de plus tous les N jours, au plus] ; PRES : distance à laquelle la Mordeuse saute
  const Pl = CG.Plantes = { FEU: [2, 4, 6], FEU_JOUR: 2, PIEGES: [4, 3, 10], PRES: 30, MORSURE: 1.2, LOIN: 15, CROC: 64, CROC_T: 0.42, CROC_CD: 1.5, CROC_LONG: 26 }; /* CROC : sur une case voisine, la plante s'étire d'un coup et mord (distance, durée du coup, pause entre deux, allonge de la tige) */
  Object.assign(CG.ENEMIES, {
    planteFeu: { nom: 'Crache-braise', race: 'bete', hp: 30, dmg: 6, spd: 0, xp: 14, or: 3, cost: 3, range: 250, magic: true, r: 13 },
    mordeuse: { nom: 'Mordeuse', race: 'bete', hp: 26, dmg: 7, spd: 0, xp: 12, or: 2, cost: 2, r: 13 }
  });
  const MIENS = { planteFeu: 1, mordeuse: 1 }, monde = () => (CG.Mondes ? CG.Mondes.ici() : 0), ici = () => [0, 3, 4, 5].includes(monde()); // les forêts seulement
  // ---------- chaque matin, elles repoussent ailleurs ----------
  function semer() {
    const S = CG.S, R = CG.R; R.pieges = []; if (!ici()) return; const f = W.field(), day = S.day, pris = [];
    const lieu = () => { for (let k = 0; k < 200; k++) { const x = CG.irand(4, CG.MW - 5), y = CG.irand(4, CG.MH - 5); if (f[W.idx(x, y)] < 0 || W.tile[W.idx(x, y)] !== W.GRASS || Math.hypot(x - W.CX, y - W.CY) < Pl.LOIN || pris.some(o => Math.hypot(o.x - x, o.y - y) < 5) || S.buildings.some(b => Math.hypot(b.tx - x, b.ty - y) < 6)) continue; pris.push({ x, y }); return W.center(x, y); } return null; };
    const nb = q => Math.min(q[2], q[0] + Math.floor(day / q[1]));
    if (day >= Pl.FEU_JOUR) for (let i = 0; i < nb(Pl.FEU); i++) { const c = lieu(); if (!c) break; const e = G.spawnEnemy('planteFeu', c.x, c.y, { wild: true, exact: true }); if (e) { e.aggroR = 260; e.hx = c.x; e.hy = c.y; } }
    for (let i = 0; i < nb(Pl.PIEGES); i++) { const c = lieu(); if (c) R.pieges.push({ x: c.x + rand(-8, 8), y: c.y + rand(-6, 6) }); }
  }
  const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments); try { semer(); } catch (e) { /* jamais bloquant */ } return r; };
  // ---------- enracinées, et la Mordeuse qui jaillit ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !R.enemies || R.night || R.cine) return; const p = S.player;
    for (const e of R.enemies) { if (!MIENS[e.type] || e.dead) continue; if (e.hx === undefined) { e.hx = e.x; e.hy = e.y; } e.x = e.hx; e.y = e.hy; e.moving = false; e.path = null; e.kb = null; if (e.sortie > 0) e.sortie -= dt; // rien ne les déplace
      // sur une case voisine ? La tige se détend comme un ressort et la gueule claque, puis elle se rétracte
      e.crocCd = (e.crocCd || 0) - dt; const c = e.croc;
      if (c) { c.t -= dt; if (!c.fait && c.t <= Pl.CROC_T * 0.5) { c.fait = true; const o = c.tg; if (o && !o.dead && !o.hidden && o.ko !== true && !(o === p && (R.ko > 0 || R.invis > 0)) && Math.hypot(o.x - e.x, o.y - e.y) < Pl.CROC + 14) { const dmg = e.dmg * Pl.MORSURE; if (o === p) { G.hurtPlayer(dmg); R.shake = Math.max(R.shake || 0, 0.14); } else if (o.pet && CG.P && CG.P.hurt) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); G.puff(o.x, o.y - 14, '#5aa83a', 8, 90, 3); if (CG.onScreen(e.x, e.y)) CG.sfx('hit'); } } if (c.t <= 0) e.croc = null; continue; }
      if (e.crocCd > 0 || e.sortie > 0 || e.daze > 0 || e.para > 0 || e.sleepT > 0 || e.poly || e.charm > 0 || e.fear > 0 || e.etourdi > R.t) continue;
      let tg = null, bd = Pl.CROC; for (const o of [p].concat(S.pets, S.goblins)) { if (!o || o.dead || o.hidden || o.ko === true || o.ridden || (o === p && (R.ko > 0 || R.invis > 0))) continue; const d = Math.hypot(o.x - e.x, (o.y - e.y) * 1.15); if (d < bd) { bd = d; tg = o; } }
      if (tg) { const dx = tg.x - e.x, dy = tg.y - e.y, l = Math.hypot(dx, dy) || 1; e.croc = { t: Pl.CROC_T, dx: dx / l, dy: dy / l, tg, fait: false }; e.crocCd = Pl.CROC_CD; e.face = dx >= 0 ? 1 : -1; e.atkAnim = 1; e.atkCd = Math.max(e.atkCd || 0, 1.1); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } }
    const L = R.pieges; if (!L || !L.length || R.ko > 0 || R.death) return;
    for (let i = L.length - 1; i >= 0; i--) { const q = L[i]; if (Math.hypot(p.x - q.x, (p.y - q.y) * 1.2) > Pl.PRES) continue; L.splice(i, 1);
      const e = G.spawnEnemy('mordeuse', q.x, q.y, { wild: true, exact: true }); if (!e) continue; e.hx = q.x; e.hy = q.y; e.sortie = 0.45; e.atkAnim = 1; e.atkCd = 1.3; e.face = p.x > q.x ? 1 : -1; e.aggroR = 120;
      G.hurtPlayer(e.dmg * Pl.MORSURE); R.shake = Math.max(R.shake || 0, 0.16); CG.sfx('hit'); G.puff(q.x, q.y - 6, '#5aa83a', 16, 130, 3); G.puff(q.x, q.y - 4, '#3a7a2a', 8, 80, 4);
      for (let k = 0; k < 8; k++) R.parts.push({ x: q.x + rand(-8, 8), y: q.y - 4, vx: rand(-70, 70), vy: rand(-150, -60), life: rand(0.4, 0.7), max: 0.7, col: k % 2 ? '#7ac85a' : '#3f7a34', size: rand(2, 4) }); }
  };
  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, f) => ell(g, x, y, r, r, f);
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const feuille = (g, x, y, l, w, rot, col, nerv) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, -w, l, 0); g.quadraticCurveTo(l * 0.5, w, 0, 0); g.fill(); g.strokeStyle = nerv; g.lineWidth = 0.8; g.beginPath(); g.moveTo(1, 0); g.lineTo(l - 1.5, 0); g.stroke(); g.restore(); };
  function crache(g, e, t) { // le Crache-braise : une tige épaisse, deux grandes feuilles, une tête sombre couronnée de pétales de flamme
    const f = e.face < 0 ? -1 : 1, a = e.atkAnim > 0 ? e.atkAnim : 0, recul = a > 0.55 ? (1 - a) / 0.45 : a > 0 ? a / 0.55 : 0, bal = Math.sin(t * 1.8 + e.seed) * 1.6, cr = e.croc ? Math.sin((1 - e.croc.t / Pl.CROC_T) * Math.PI) * Pl.CROC_LONG : 0, tx = (bal - recul * 9 + (a > 0 && a <= 0.55 ? (0.55 - a) * 12 : 0)) + (e.croc ? e.croc.dx * cr * f : 0), ty = -30 + recul * 3 + (e.croc ? e.croc.dy * cr + cr * 0.5 : 0);
    ell(g, e.x, e.y + 1, 13, 4.4, 'rgba(0,0,0,0.22)'); g.save(); g.translate(e.x, e.y); g.scale(f, 1);
    feuille(g, -1, -2, 17, 6.5, Math.PI + 0.35 + Math.sin(t * 1.3) * 0.05, '#3f8a34', '#2c6a26'); feuille(g, 1, -2, 16, 6, -0.4 - Math.sin(t * 1.3) * 0.05, '#4a9a3a', '#2c6a26'); feuille(g, 0, -3, 10, 4, -1.2, '#5aaa48', '#2c6a26');
    g.strokeStyle = '#3a7a2e'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(-5, -16, tx, ty + 6); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(1, -3); g.quadraticCurveTo(-3.5, -16, tx + 1, ty + 6); g.stroke();
    [[-3, -11], [-2.6, -19]].forEach(q => poly(g, [q[0], q[1], q[0] - 4, q[1] - 1.5, q[0], q[1] - 2.6], '#2c6a26')); // des épines
    g.translate(tx, ty); g.rotate(-0.25 - recul * 0.4);
    const pu = 0.5 + Math.sin(t * 5 + e.seed) * 0.5, chaud = a > 0 ? 1 : 0.4 + pu * 0.3;
    for (let i = 0; i < 7; i++) { const an = -2.5 + i * 0.62, l = 11 + (i % 2) * 3 + Math.sin(t * 6 + i * 1.7) * 1.2; g.save(); g.rotate(an); poly(g, [-3.2, -5, 0, -5 - l, 3.2, -5], i % 2 ? '#ffb020' : '#f0661e'); poly(g, [-1.2, -6, 0, -4 - l * 0.6, 1.2, -6], '#ffe36b'); g.restore(); } // la couronne de flammes
    ell(g, 0, 0, 9.6, 8.8, '#6a2418'); ell(g, -2.6, 0.6, 5, 6.6, 'rgba(0,0,0,0.2)'); [[-4.6, -3.4, 1.3], [3.2, -5.2, 1.1], [-1, 5, 1.2], [5.4, 3.6, 0.9]].forEach(q => circ(g, q[0], q[1], q[2], 'rgba(255,170,60,' + (0.5 + pu * 0.4) + ')')); // des braises sous l'écorce
    const ouv = 2.2 + chaud * 3.4; g.globalAlpha = 0.4 * chaud; circ(g, 7.4, 0.6, ouv + 4, '#ffb020'); g.globalAlpha = 1; ell(g, 7.2, 0.6, ouv * 0.8, ouv, '#2a0c08'); ell(g, 7.6, 0.6, ouv * 0.5, ouv * 0.7, a > 0 ? '#fff3a8' : '#ff8a1e'); // la gueule, qui rougeoie
    circ(g, 1.4, -3.6, 1.5, '#ffe36b'); circ(g, 1.8, -3.6, 0.7, '#2a0c08'); g.restore();
    if (Math.sin(t * 2.2 + e.seed) > 0.6) { g.globalAlpha = 0.3; circ(g, e.x + f * (tx + 9), e.y + ty - 6 - ((t * 9) % 8), 2.2, '#d8d0c8'); g.globalAlpha = 1; } // un filet de fumée
  }
  function mord(g, e, t) { // la Mordeuse : une rosette de feuilles, et deux mâchoires vertes à épines qui claquent
    const f = e.face < 0 ? -1 : 1, sort = e.sortie > 0 ? 1 - e.sortie / 0.45 : 1, k = sort < 1 ? sort * (1.35 - 0.35 * sort) : 1, a = e.atkAnim > 0 ? e.atkAnim : 0, ferme = a > 0 ? Math.sin(a * Math.PI) : 0, bal = Math.sin(t * 2.4 + e.seed) * 1.5, cr = e.croc ? Math.sin((1 - e.croc.t / Pl.CROC_T) * Math.PI) * Pl.CROC_LONG : 0, cx = e.croc ? e.croc.dx * cr * f : 0, cy = e.croc ? e.croc.dy * cr + cr * 0.3 : 0;
    ell(g, e.x, e.y + 1, 13, 4.4, 'rgba(0,0,0,0.2)'); g.save(); g.translate(e.x, e.y);
    for (let i = 0; i < 6; i++) feuille(g, 0, -1, 14 * Math.min(1, k + 0.3), 4.6, i / 6 * TAU + 0.3, i % 2 ? '#3f8a34' : '#4a9a3a', '#2c6a26');
    g.scale(f * k, k);
    g.strokeStyle = '#3a7a2e'; g.lineWidth = 4.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(-4, -10, bal + ferme * 5 + cx, -16 + cy); g.stroke();
    g.translate(bal + ferme * 5 + cx, -17 + cy); g.rotate(-0.15 + ferme * 0.25);
    const ouv = 0.62 * (1 - ferme) + 0.06, mach = (s) => { g.save(); g.rotate(s * ouv); g.fillStyle = s < 0 ? '#4f9e3c' : '#3f8a34'; g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(-4, s * 11, 9, s * 7.4); g.quadraticCurveTo(15, s * 3, 15, 0); g.closePath(); g.fill();
      g.fillStyle = '#f0a0b0'; g.beginPath(); g.moveTo(-3, 0); g.quadraticCurveTo(-2, s * 6.4, 8.6, s * 4.4); g.quadraticCurveTo(12.6, s * 2, 13, 0); g.closePath(); g.fill();
      for (let i = 0; i < 5; i++) { const x = 1 + i * 2.9; poly(g, [x - 1.1, 0, x, -s * 3.4, x + 1.1, 0], '#f4f0d8'); } // les épines qui servent de dents
      if (s < 0) { circ(g, 2, -7, 1.4, 'rgba(255,255,255,0.25)'); circ(g, 7, -6.2, 0.9, '#2c6a26'); circ(g, -1, -5.4, 0.8, '#2c6a26'); } g.restore(); };
    mach(1); mach(-1); circ(g, -5, 0, 3.4, '#3a7a2e'); g.restore();
  }
  const ae = Art.enemy; Art.enemy = function (g, e, t) { if (e.type === 'planteFeu') return crache(g, e, t + (e.seed || 0)); if (e.type === 'mordeuse') return mord(g, e, t + (e.seed || 0)); return ae.apply(this, arguments); };
})(window.CG);
