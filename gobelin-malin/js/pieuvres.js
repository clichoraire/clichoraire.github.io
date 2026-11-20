// Goblin Malin — les pieuvres des étangs. Elles vivent sous l'eau, là où personne ne peut aller. De temps en temps, une tête sort,
// crache une boule de boue sur le chef (ou sur un gobelin qui passe), puis replonge. On ne peut les toucher que la tête hors de l'eau,
// et de loin : un sort, une flèche, une tour. La rouge est plus rare, plus solide, et crache plus fort.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const Pv = CG.Pieuvres = { JOUR: 2, MAX: 4, LOIN: 9, VOIT: 340, SOUS: [2.4, 4.4], SORT: 0.45, HAUT: 1.5, TIR: 0.5, PLONGE: 0.35, VOL: 0.85, TOUCHE: 26, ROUGE_JOUR: 4, ROUGE: [0.1, 0.03, 0.5] }; /* ROUGE : chance de base, + par jour, plafond */
  CG.ENEMIES.pieuvre = { nom: 'Pieuvre des étangs', race: 'bete', hp: 22, dmg: 6, spd: 0, xp: 16, or: 6, cost: 3, r: 13 };
  CG.ENEMIES.pieuvreRouge = { nom: 'Pieuvre rouge', race: 'bete', hp: 42, dmg: 10, spd: 0, xp: 32, or: 14, cost: 6, r: 14 };
  const etat = new WeakMap(), ici = () => (CG.Mondes ? CG.Mondes.ici() : 0);
  const eau = (x, y) => W.inMap(x, y) && W.tile[W.idx(x, y)] === W.WATER, fond = (x, y) => eau(x, y) && eau(x + 1, y) && eau(x - 1, y) && eau(x, y + 1) && eau(x, y - 1);
  // ---------- chaque jour : quelques étangs en abritent une (ou deux) ----------
  function etangs() { const vu = new Uint8Array(CG.MW * CG.MH), l = [];
    for (let y = 2; y < CG.MH - 2; y++) for (let x = 2; x < CG.MW - 2; x++) { if (vu[W.idx(x, y)] || !fond(x, y)) continue; const cases = [], pile = [[x, y]]; vu[W.idx(x, y)] = 1;
      while (pile.length) { const q = pile.pop(); cases.push(q); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const X = q[0] + d[0], Y = q[1] + d[1]; if (X > 1 && Y > 1 && X < CG.MW - 2 && Y < CG.MH - 2 && !vu[W.idx(X, Y)] && fond(X, Y)) { vu[W.idx(X, Y)] = 1; pile.push([X, Y]); } }); } l.push(cases); } return l; }
  Pv.peupler = function () {
    const S = CG.S, R = CG.R; R.pieuvres = []; if (!S || ici() === 2 || S.day < Pv.JOUR || (S.arene)) return; let f; try { f = G.firePos(); } catch (e) { return; }
    const l = CG.shuffle(etangs().filter(c => c.some(q => Math.hypot(q[0] - f.x / T, q[1] - f.y / T) > Pv.LOIN))), n = Math.min(Pv.MAX, 1 + Math.floor(S.day / 3), l.length);
    for (let i = 0; i < n; i++) { const cases = l[i].filter(q => Math.hypot(q[0] - f.x / T, q[1] - f.y / T) > Pv.LOIN), nb = cases.length >= 6 && S.day >= 6 && Math.random() < 0.5 ? 2 : 1;
      for (let k = 0; k < nb; k++) { const rouge = S.day >= Pv.ROUGE_JOUR && Math.random() < Math.min(Pv.ROUGE[2], Pv.ROUGE[0] + S.day * Pv.ROUGE[1]), c = pick(cases);
        const e = G.spawnEnemy(rouge ? 'pieuvreRouge' : 'pieuvre', (c[0] + 0.5) * T, (c[1] + 0.5) * T, { wild: true, exact: true }); R.enemies.splice(R.enemies.indexOf(e), 1); /* sous l'eau : elle n'est pas dans le monde */
        const q = { e, cases, ph: 'sous', t: rand(1, 3), tire: false }; etat.set(e, q); R.pieuvres.push(q); } }
  };
  const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments); try { Pv.peupler(); } catch (e) { CG.R.pieuvres = []; } return r; };
  // ---------- la boue : elle vole en cloche et retombe là où on se trouvait ----------
  function cracher(q, tg) { const R = CG.R, e = q.e; (R.boues || (R.boues = [])).push({ x0: e.x + e.face * 8, y0: e.y - 14, x1: tg.x, y1: tg.y, t: 0, dur: Pv.VOL * CG.clamp(Math.hypot(tg.x - e.x, tg.y - e.y) / 240, 0.6, 1.3), dmg: e.dmg, rouge: e.type === 'pieuvreRouge' }); e.atkAnim = 1; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
  function tombe(b) { const S = CG.S, R = CG.R, p = S.player, pres = o => Math.hypot(o.x - b.x1, o.y - b.y1) < Pv.TOUCHE;
    G.puff(b.x1, b.y1 - 4, '#6a4a2a', 12, 100, 4); G.puff(b.x1, b.y1 - 4, '#8a6a3a', 6, 70, 3); if (CG.onScreen(b.x1, b.y1)) CG.sfx('hit');
    (R.flaquesBoue || (R.flaquesBoue = [])).push({ x: b.x1, y: b.y1, fin: R.t + 3 });
    if (pres(p) && !(R.ko > 0)) G.hurtPlayer(b.dmg); for (const g of S.goblins) if (!g.hidden && !g.ko && pres(g)) G.hurtGoblin(g, b.dmg); if (CG.P && CG.P.hurt) for (const a of S.pets) if (!a.ko && pres(a)) CG.P.hurt(a, b.dmg); }
  const cible = e => { const S = CG.S, R = CG.R, p = S.player; let best = null, bd = Pv.VOIT; if (!(R.ko > 0) && !(R.invis > 0)) { const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < bd) { bd = d; best = p; } }
    if (!best) for (const g of S.goblins) { if (g.hidden || g.ko) continue; const d = Math.hypot(g.x - e.x, g.y - e.y); if (d < bd * 0.8) { bd = d / 0.8; best = g; } } return best; };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || R.night || R.cine) return;
    if (R.boues && R.boues.length) { for (const b of R.boues) { b.t += dt; if (b.t >= b.dur) tombe(b); } R.boues = R.boues.filter(b => b.t < b.dur); }
    if (R.flaquesBoue && R.flaquesBoue.length) R.flaquesBoue = R.flaquesBoue.filter(f => f.fin > R.t);
    const l = R.pieuvres; if (!l || !l.length) return;
    for (const q of l) { const e = q.e; if (e.dead) continue;
      if (q.ph === 'sous') { q.t -= dt; if (q.t > 0) continue; if (!eau(Math.floor(e.x / T), Math.floor(e.y / T))) { e.dead = true; continue; } /* son étang a disparu (un pont, de la terre) */
        if (!cible(e)) { q.t = 0.6; continue; } const c = pick(q.cases.filter(k => eau(k[0], k[1]))) || [Math.floor(e.x / T), Math.floor(e.y / T)]; e.x = (c[0] + 0.5) * T; e.y = (c[1] + 0.5) * T; e.wild = { x: e.x, y: e.y }; q.px = e.x; q.py = e.y;
        q.ph = 'sort'; q.t = Pv.SORT; q.tire = false; R.enemies.push(e); if (CG.onScreen(e.x, e.y)) { G.puff(e.x, e.y, '#bfe6ff', 10, 90, 3); R.rings.push({ x: e.x, y: e.y + 2, r: 30, life: 0.5, col: '#dff2ff' }); } continue; }
      e.x = q.px; e.y = q.py; e.rooted = Math.max(e.rooted, 0.5); e.path = null; e.moving = false; /* elle ne quitte jamais sa place */
      const tg = cible(e); if (tg) e.face = tg.x > e.x ? 1 : -1; if (e.daze > 0 || e.para > 0 || e.sleepT > 0 || e.poly) continue; /* assommée, elle reste la tête dehors : c'est le moment */
      q.t -= dt;
      if (q.ph === 'sort') { if (q.t <= 0) { q.ph = 'haut'; q.t = Pv.HAUT; } }
      else if (q.ph === 'haut') { if (!q.tire && q.t <= Pv.HAUT - Pv.TIR) { q.tire = true; if (tg) cracher(q, tg); } if (q.t <= 0) { q.ph = 'plonge'; q.t = Pv.PLONGE; } }
      else if (q.t <= 0) { q.ph = 'sous'; q.t = rand(Pv.SOUS[0], Pv.SOUS[1]); const i = R.enemies.indexOf(e); if (i >= 0) R.enemies.splice(i, 1); if (CG.onScreen(e.x, e.y)) { G.puff(e.x, e.y, '#bfe6ff', 8, 80, 3); R.rings.push({ x: e.x, y: e.y + 2, r: 26, life: 0.45, col: '#dff2ff' }); } } }
    R.pieuvres = l.filter(q => !q.e.dead);
  };
  // ---------- dessin : une tête ronde et tachetée, des sourcils fâchés, une bouche en rond, et deux bouts de tentacules qui dépassent ----------
  const ell = (g, x, y, rx, ry, f, a) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, TAU); g.fill(); };
  const C = { pieuvre: { c: '#3f93ad', s: '#2c6f88', l: '#8fd0e0', t: '#57aac2', oeil: '#fff4c0', pic: null }, pieuvreRouge: { c: '#c8442c', s: '#96281a', l: '#f29a72', t: '#dc6444', oeil: '#ffe36b', pic: '#5a140c' } };
  function tete(g, e, t, k) { const c = C[e.type], f = e.face || 1, ouvre = e.atkAnim > 0 ? Math.min(1, e.atkAnim * 1.6) : 0, gros = e.type === 'pieuvreRouge' ? 1.12 : 1;
    g.save(); g.translate(e.x, e.y + 2); g.scale(gros, gros); g.beginPath(); g.rect(-40, -70, 80, 70); g.clip(); g.translate(0, (1 - k) * 34); /* tout ce qui est sous la ligne d'eau reste caché */
    [-1, 1].forEach(s => { const w = Math.sin(t * 3.2 + s * 1.3) * 3; g.strokeStyle = c.t; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 15, 4); g.quadraticCurveTo(s * 23 + w, -6, s * 21 + w * 1.6, -15); g.stroke(); g.strokeStyle = c.l; g.lineWidth = 1.6; g.beginPath(); g.moveTo(s * 20 + w, -5); g.lineTo(s * 20 + w * 1.5, -12); g.stroke(); });
    if (c.pic) { g.fillStyle = c.pic; [[-8, -29, -11, -37], [0, -32, 0, -42], [8, -29, 11, -37]].forEach(q => { g.beginPath(); g.moveTo(q[0] - 3, q[1] + 2); g.lineTo(q[2], q[3]); g.lineTo(q[0] + 3, q[1] + 2); g.closePath(); g.fill(); }); } /* la rouge a une crête de piquants */
    ell(g, 0, -17, 15, 15, c.c); ell(g, 3, -12, 12, 9, c.s); ell(g, 0, -17, 15, 15, 'rgba(0,0,0,0)'); ell(g, -5, -24, 6, 4, c.l, -0.5); ell(g, 7, -26, 2.6, 2, c.s); ell(g, -9, -15, 2.2, 1.8, c.s); ell(g, 10, -18, 1.8, 1.5, c.l); /* des taches */
    ell(g, 0, -4, 13, 7, c.c); ell(g, 0, -1.5, 10, 4, c.l);
    [-1, 1].forEach(s => { ell(g, s * 5.6 + f * 1.2, -9, 3.6, 3.2, c.oeil); ell(g, s * 5.6 + f * 2.2, -8.6, 1.1, 2.3, '#1a1014'); g.strokeStyle = c.s; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 9.4 + f * 1.2, -13.6); g.lineTo(s * 2.4 + f * 1.2, -10.4); g.stroke(); }); /* les sourcils froncés */
    ell(g, f * 2, -2.2, 3.2 + ouvre * 1.2, 2.2 + ouvre * 2, c.s); ell(g, f * 2, -2, 1.9 + ouvre * 1.2, 1.1 + ouvre * 1.9, '#1a0c0c');
    g.restore();
    g.strokeStyle = 'rgba(225,242,255,' + (0.35 + k * 0.4) + ')'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(e.x, e.y + 3, (15 + Math.sin(t * 4) * 2) * gros, 5 * gros, 0, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(225,242,255,0.25)'; g.beginPath(); g.ellipse(e.x, e.y + 3, (23 + Math.sin(t * 4 + 1) * 3) * gros, 7.5 * gros, 0, 0, TAU); g.stroke(); }
  const ae = Art.enemy; Art.enemy = function (g, e, t) { if (e.type !== 'pieuvre' && e.type !== 'pieuvreRouge') return ae.apply(this, arguments); const q = etat.get(e), k = !q ? 1 : q.ph === 'sort' ? 1 - q.t / Pv.SORT : q.ph === 'plonge' ? q.t / Pv.PLONGE : 1; tete(g, e, t + e.seed, CG.clamp(k, 0, 1)); };
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const f of R.flaquesBoue || []) { if (!CG.onScreen(f.x, f.y)) continue; g.globalAlpha = Math.min(1, (f.fin - R.t) / 1.2) * 0.7; ell(g, f.x, f.y, 15, 6, '#5a3e22'); ell(g, f.x - 3, f.y - 1, 7, 2.6, '#7a5a34'); g.globalAlpha = 1; }
    for (const q of R.pieuvres || []) { if (q.ph !== 'sous' || q.e.dead || !CG.onScreen(q.e.x, q.e.y)) continue; const e = q.e; ell(g, e.x, e.y + 2, 13, 6, 'rgba(10,30,50,0.28)'); /* sous l'eau : une ombre, et quelques bulles */
      for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3 + e.seed) % 1; g.strokeStyle = 'rgba(230,245,255,' + (1 - k) * 0.7 + ')'; g.lineWidth = 1; g.beginPath(); g.arc(e.x - 6 + i * 6, e.y - k * 12, 1.5 + k * 1.5, 0, TAU); g.stroke(); } }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R || !R.boues) return;
    for (const b of R.boues) { const k = b.t / b.dur, x = b.x0 + (b.x1 - b.x0) * k, y0 = b.y0 + (b.y1 - b.y0) * k, y = y0 - Math.sin(k * Math.PI) * 54; if (!CG.onScreen(x, y)) continue;
      g.strokeStyle = 'rgba(120,60,30,' + (0.25 + k * 0.5) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(b.x1, b.y1, Pv.TOUCHE * (1.25 - k * 0.25), Pv.TOUCHE * 0.42 * (1.25 - k * 0.25), 0, 0, TAU); g.stroke(); /* là où ça va tomber */
      ell(g, x, y0 + 2, 6, 2.4, 'rgba(0,0,0,0.25)'); ell(g, x, y, b.rouge ? 7.5 : 6.5, b.rouge ? 7.5 : 6.5, b.rouge ? '#6a3220' : '#5a3e22'); ell(g, x - 2, y - 2, 2.6, 2, b.rouge ? '#a05a3a' : '#8a6a3a'); }
  };
  Pv.essai = function (rouge) { const S = CG.S, R = CG.R, p = S.player; let best = null, bd = 1e9; etangs().forEach(c => c.forEach(q => { const d = Math.hypot((q[0] + 0.5) * T - p.x, (q[1] + 0.5) * T - p.y); if (d < bd) { bd = d; best = { c, q }; } })); if (!best) return null;
    const e = G.spawnEnemy(rouge ? 'pieuvreRouge' : 'pieuvre', (best.q[0] + 0.5) * T, (best.q[1] + 0.5) * T, { wild: true, exact: true }); R.enemies.splice(R.enemies.indexOf(e), 1); const q = { e, cases: [best.q], ph: 'sous', t: 0.2, tire: false }; etat.set(e, q); (R.pieuvres || (R.pieuvres = [])).push(q); return q; };
})(window.CG);
