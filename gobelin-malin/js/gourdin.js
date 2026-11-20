// Goblin Malin — le coup de gourdin des gros (ogre, troll). Au lieu de frapper d'un coup sec, ils lèvent leur massue,
// visent un endroit au sol (une zone rouge qui se remplit), puis l'abattent : la terre se fend, une onde de poussière part
// en rond, des cailloux volent. On esquive en sortant de la zone à temps. Tout ce qui est dedans prend le coup.
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2, SQ = 0.75, rand = CG.rand; // SQ : les zones sont des ovales aplatis, comme le sol vu de haut
  const Go = CG.Gourdin = { FRAPPE: 0.28, TRACE: 2.6,
    TYPES: { ogre: { r: 46, elan: 0.8, dmg: 1.3, repos: [1.5, 2.3] }, troll: { r: 62, elan: 0.9, dmg: 1.4, repos: [1.9, 2.8] } } };
  const chocs = () => CG.R.chocs || (CG.R.chocs = []);
  const aNous = o => { const S = CG.S; return !!o && (o === S.player || o.pet || o.summon || S.goblins.includes(o) || S.pets.includes(o)); };
  const visible = o => o && !o.dead && !o.hidden && o.ko !== true && !(o === CG.S.player && (CG.R.ko > 0 || CG.R.invis > 0));
  const dedans = (c, o, r) => Math.hypot(o.x - c.x, (o.y - c.y) / SQ) <= r;
  const empeche = e => e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.kb || e.retreat;
  function frappe(e, c, q) {
    const S = CG.S, R = CG.R, p = S.player, dmg = e.dmg * q.dmg, ecran = CG.onScreen(c.x, c.y);
    if (!(R.ko > 0) && dedans(c, p, q.r)) G.hurtPlayer(dmg);
    for (const g of S.goblins.slice()) if (!g.hidden && !g.perch && dedans(c, g, q.r)) G.hurtGoblin(g, dmg * 0.7);
    for (const a of S.pets) if (!a.ko && !a.ridden && dedans(c, a, q.r)) CG.P.hurt(a, dmg * 0.7);
    if (R.golem && !R.golem.dead && dedans(c, R.golem, q.r)) CG.Magie.hurt(R.golem, dmg * 0.8);
    chocs().push({ x: c.x, y: c.y, r: q.r, t: 0, seed: Math.random() * 100 });
    if (!ecran) return;
    R.shake = Math.max(R.shake || 0, 0.32); CG.sfx('fire'); CG.sfx('hit');
    for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, v = rand(60, 190); R.parts.push({ x: c.x + Math.cos(a) * 6, y: c.y + Math.sin(a) * 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * SQ - rand(70, 210), life: rand(0.5, 0.9), max: 0.9, col: i % 3 ? '#7a5c3c' : '#a8906a', size: rand(2.5, 5) }); } // les cailloux qui sautent
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + rand(-0.1, 0.1), v = rand(120, 210); R.parts.push({ x: c.x + Math.cos(a) * q.r * 0.25, y: c.y + Math.sin(a) * q.r * 0.25 * SQ - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * SQ - rand(4, 22), life: rand(0.45, 0.75), max: 0.75, col: i % 2 ? '#e0d2b0' : '#c8b48c', size: rand(5, 9), float: true }); } // la poussière qui part en rond
    for (let i = 0; i < 3; i++) R.rings.push({ x: c.x, y: c.y, r: q.r * (0.9 + i * 0.55), life: 0.3 + i * 0.13, col: i === 1 ? '#ffffff' : '#e8d8b0' });
  }
  function pas(e, dt) {
    const R = CG.R, q = Go.TYPES[e.type], tg = e.target, c = e.coup;
    if (e.gcd === undefined) e.gcd = rand(0.2, 0.8);
    if (c) {
      if (empeche(e)) { e.coup = null; e.gcd = 0.8; return; } // endormi, charmé, effrayé : le coup tombe à l'eau
      c.t -= dt; e.atkCd = Math.max(e.atkCd, 0.5); e.rooted = Math.max(e.rooted || 0, 0.1); e.moving = false; e.face = c.x > e.x ? 1 : -1;
      if (c.t > Go.FRAPPE) e.atkAnim = 1; // la massue reste levée, puis s'abat pendant les derniers instants
      else if (!c.siffle) { c.siffle = true; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
      if (c.t <= 0) { e.coup = null; e.gcd = rand(q.repos[0], q.repos[1]); e.rooted = Math.max(e.rooted || 0, 0.45); frappe(e, c, q); }
      return;
    }
    e.gcd -= dt; if (!tg || !aNous(tg) || !visible(tg) || empeche(e)) return;
    const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1; if (d > e.r + 40) return;
    e.atkCd = Math.max(e.atkCd, 0.3); // tout près d'un des nôtres, il ne frappe plus qu'au gourdin
    if (e.gcd > 0 || d > e.r + 26 || e.rooted > 0.3) return;
    const L = Math.min(d, e.r + 30); e.coup = { t: q.elan, max: q.elan, x: e.x + dx / d * L, y: e.y + dy / d * L }; e.path = null; e.atkAnim = 1; e.face = dx > 0 ? 1 : -1;
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !CG.S || !R.enemies) return;
    for (const e of R.enemies) if (Go.TYPES[e.type] && !e.dead) pas(e, dt);
    const C = R.chocs; if (C && C.length) { for (const c of C) c.t += dt; R.chocs = C.filter(c => c.t < Go.TRACE); }
  };
  // ---------- au sol : la zone qui annonce le coup, puis les traces de l'impact ----------
  const h = (s, i) => { const x = Math.sin(s * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R || !CG.S) return;
    for (const e of R.enemies) { const c = e.coup, q = Go.TYPES[e.type]; if (!c || !q || e.dead || !CG.onScreen(c.x, c.y)) continue; const f = 1 - Math.max(0, c.t) / c.max;
      g.save(); g.translate(c.x, c.y); g.scale(1, SQ); g.fillStyle = 'rgba(255,40,30,0.18)'; g.beginPath(); g.arc(0, 0, q.r, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,60,30,0.38)'; g.beginPath(); g.arc(0, 0, q.r * f, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,220,200,' + (0.7 + Math.sin(t * 18) * 0.25) + ')'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, q.r, 0, TAU); g.stroke(); g.restore(); }
    const C = R.chocs; if (!C) return;
    for (const c of C) { if (!CG.onScreen(c.x, c.y)) continue; const a = c.t, vie = 1 - a / Go.TRACE, pousse = Math.min(1, a / 0.12);
      g.save(); g.translate(c.x, c.y); g.scale(1, SQ);
      g.globalAlpha = Math.min(1, vie * 1.6) * 0.5; g.fillStyle = '#2a1c10'; g.beginPath(); g.arc(0, 0, c.r * 0.34, 0, TAU); g.fill(); // le creux au milieu
      g.globalAlpha = Math.min(1, vie * 1.8) * 0.85; g.strokeStyle = '#22160c'; g.lineCap = 'round'; g.lineJoin = 'round'; // les fissures, qui s'ouvrent d'un coup puis s'effacent
      for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + (h(c.seed, i) - 0.5) * 0.5, L = c.r * (0.5 + h(c.seed, i + 20) * 0.5) * pousse; let x = Math.cos(an) * c.r * 0.2, y = Math.sin(an) * c.r * 0.2;
        g.lineWidth = 4.2; g.beginPath(); g.moveTo(x, y); for (let k = 1; k <= 4; k++) { const u = k / 4, d = (h(c.seed, i * 7 + k) - 0.5) * 0.55; x = Math.cos(an + d) * (c.r * 0.2 + L * u); y = Math.sin(an + d) * (c.r * 0.2 + L * u); g.lineTo(x, y); if (k === 2) g.lineWidth = 2.6; } g.stroke();
        if (i % 3 === 0) { const b = an + (h(c.seed, i + 50) > 0.5 ? 0.7 : -0.7); g.lineWidth = 1.5; g.beginPath(); g.moveTo(Math.cos(an) * (c.r * 0.2 + L * 0.5), Math.sin(an) * (c.r * 0.2 + L * 0.5)); g.lineTo(Math.cos(an) * (c.r * 0.2 + L * 0.5) + Math.cos(b) * L * 0.3, Math.sin(an) * (c.r * 0.2 + L * 0.5) + Math.sin(b) * L * 0.3); g.stroke(); } }
      if (a < 0.5) { const k = a / 0.5, e1 = 1 - Math.pow(1 - k, 3); // l'onde de choc : deux anneaux qui filent, et un éclair au centre
        g.globalAlpha = (1 - k) * 0.9; g.strokeStyle = '#fff6dc'; g.lineWidth = 7 * (1 - k) + 1.5; g.beginPath(); g.arc(0, 0, c.r * (0.3 + e1 * 1.5), 0, TAU); g.stroke();
        g.globalAlpha = (1 - k) * 0.5; g.strokeStyle = '#d8c090'; g.lineWidth = 14 * (1 - k) + 2; g.beginPath(); g.arc(0, 0, c.r * (0.2 + e1 * 1.05), 0, TAU); g.stroke(); }
      if (a < 0.14) { g.globalAlpha = (1 - a / 0.14) * 0.85; g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(0, 0, c.r * (0.5 + a * 4), 0, TAU); g.fill(); }
      g.restore(); }
    g.globalAlpha = 1;
  };
})(window.CG);
