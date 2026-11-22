// Goblin Malin — la grande magie du Demon Lord. Deux attaques rien qu'à lui, en plus de celles des seigneurs démons :
//   le Souffle balayant : il se plante là et crache un long jet de feu qu'il promène d'un côté à l'autre, puis il repasse ;
//   le Brasier : des boules de feu tombent du ciel sur les constructions du village, qui restent en flammes un moment.
// Il est aussi plus solide et frappe plus fort. (Le bouton de triche « Scène du Demon Lord » rejoue son arrivée.)
'use strict';
(function (CG) {
  const G = CG.G, B = CG.Boss, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  const Df = CG.DemonFeu = { HP: 1250, DMG: 21, CD: [6.5, 9], BALAI: { avert: 1, dur: 3.6, arc: 1.05, L: 420, w: 54, tic: 0.22, k: 0.75, bati: 0.5 }, BRASIER: { n: 6, rage: 9, loin: 900, r: 62, k: 1.2, bati: 2.4, brule: 6, tic: 3.5 } };
  if (CG.ENEMIES.demonLord) { CG.ENEMIES.demonLord.hp = Df.HP; CG.ENEMIES.demonLord.dmg = Df.DMG; }
  const centre = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T });
  const brules = () => CG.R.dlBrule || (CG.R.dlBrule = []);
  const allumer = (b, t) => { const l = brules(), o = l.find(q => q.b === b); if (o) o.t = Math.max(o.t, t); else l.push({ b, t, tic: 1 }); };
  // dans le jet : entre la gueule et le bout, pas trop loin de l'axe (le jet s'élargit en s'éloignant)
  function dansJet(e, a, o, marge) { const Q = Df.BALAI, dx = o.x - e.x, dy = o.y - (e.y - 8), u = dx * Math.cos(a) + dy * Math.sin(a), v = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)); return u > 18 && u < Q.L + (marge || 0) && v < Q.w * (0.45 + 0.75 * u / Q.L) + (marge || 0); }
  const angle = q => { const Q = Df.BALAI, u = CG.clamp((q.t - Q.avert) / Q.dur, 0, 1); return q.a0 + Q.arc * q.sens * Math.cos(u * TAU); }; /* d'un bord à l'autre, puis il repasse */
  function balai(e) {
    const p = CG.S.player, Q = Df.BALAI; if (Math.hypot(p.x - e.x, p.y - e.y) > Q.L + 60) return false;
    e.balai = { t: 0, a0: Math.atan2(p.y - e.y, p.x - e.x), sens: Math.random() < 0.5 ? 1 : -1, tic: 0, son: 0, bt: 0 }; const hold = Q.avert + Q.dur + 0.3;
    e.rooted = Math.max(e.rooted || 0, hold); e.atkCd = Math.max(e.atkCd || 0, hold + 0.2); e.bcd = Math.max(e.bcd || 0, hold + 1.2); e.path = null; e.face = p.x > e.x ? 1 : -1;
    G.text(e.x, e.y - 96, '⚠ Souffle balayant !', '#ffd0a0', true); CG.sfx('warning'); return true;
  }
  function brasier(e) {
    const S = CG.S, R = CG.R, Q = Df.BRASIER, rage = e.hp < e.maxhp * 0.4;
    const l = CG.shuffle(S.buildings.filter(b => !b.site && G.buildMaxHp(b) > 0 && Math.hypot(centre(b).x - e.x, centre(b).y - e.y) < Q.loin)).slice(0, rage ? Q.rage : Q.n); if (!l.length) return false;
    const Z = R.zones || (R.zones = []), F = R.dlTombe || (R.dlTombe = []);
    l.forEach((b, i) => { const c = centre(b), t = 1.3 + i * 0.38; Z.push({ k: 'cercle', by: e, col: '#ff5a2a', x: c.x, y: c.y, r: Q.r, t, max: t, dmg: e.dmg * Q.k, roc: 'feu' }); F.push({ b, t, by: e }); });
    e.rooted = Math.max(e.rooted || 0, 1.5); e.atkCd = Math.max(e.atkCd || 0, 1.7); e.bcd = Math.max(e.bcd || 0, 3.2); e.path = null; e.atkAnim = 1;
    G.text(e.x, e.y - 96, '⚠ Brasier sur le village !', '#ffd0a0', true); CG.sfx('warning'); return true;
  }
  function souffler(e, dt) {
    const S = CG.S, R = CG.R, p = S.player, q = e.balai, Q = Df.BALAI; q.t += dt; e.rooted = Math.max(e.rooted || 0, 0.2); e.path = null;
    if (q.t < Q.avert) return; if (q.t >= Q.avert + Q.dur) { e.balai = null; return; }
    const a = angle(q), ca = Math.cos(a), sa = Math.sin(a); e.atkAnim = 1; e.face = ca >= 0 ? 1 : -1;
    if ((q.son -= dt) <= 0) { q.son = 0.3; if (CG.onScreen(e.x, e.y)) CG.sfx('fire'); }
    for (let i = 0; i < 4; i++) if (Math.random() < dt * 60) { const u = Math.random(), d = 20 + u * Q.L, w = Q.w * (0.4 + 0.7 * u), o = rand(-w, w); /* les flammes le long du jet */
      R.parts.push({ x: e.x + ca * d - sa * o, y: e.y - 8 + sa * d + ca * o, vx: ca * 150 + rand(-30, 30), vy: sa * 150 - rand(10, 60), life: 0.35 + u * 0.3, max: 0.65, col: Math.random() < 0.3 ? '#ffe36b' : Math.random() < 0.5 ? '#ff8a1e' : '#ff4a1a', size: 5 + u * 9, float: true }); }
    if ((q.tic -= dt) <= 0) { q.tic = Q.tic; const d = e.dmg * Q.k;
      R.feuSrc = true; if (R.ko <= 0 && dansJet(e, a, p)) G.hurtPlayer(d);
      for (const g of S.goblins.slice()) if (!g.hidden && !g.perch && dansJet(e, a, g)) G.hurtGoblin(g, d * 0.4); R.feuSrc = false;
      for (const o of S.pets) if (!o.ko && !o.ridden && dansJet(e, a, o)) CG.P.hurt(o, d * 0.5);
      if (R.golem && !R.golem.dead && dansJet(e, a, R.golem)) CG.Magie.hurt(R.golem, d * 0.6); }
    if ((q.bt -= dt) <= 0) { q.bt = 0.45; for (const b of S.buildings.slice()) { if (b.site || !G.buildMaxHp(b) || !dansJet(e, a, centre(b), 14)) continue; G.hitBuilding(b, e.dmg * Q.bati, e); if (S.buildings.includes(b) && !b.site) allumer(b, 4); } } /* tout ce que le jet lèche prend feu */
  }
  const st0 = B.step; B.step = function (e, dt) {
    if (e.type !== 'demonLord') return st0.apply(this, arguments); const R = CG.R, p = CG.S.player;
    if (e.balai) return souffler(e, dt);
    e.dlcd = (e.dlcd === undefined ? 4.5 : e.dlcd) - dt;
    if (e.dlcd <= 0 && !e.retreat && !(e.fear > 0) && !(e.daze > 0) && R.ko <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 520) {
      const ordre = e.dlDer === 'balai' ? [brasier, balai] : [balai, brasier], fait = ordre.find(f => f(e));
      if (fait) { e.dlDer = fait === balai ? 'balai' : 'brasier'; e.dlcd = rand(Df.CD[0], Df.CD[1]) * (e.hp < e.maxhp * 0.4 ? 0.7 : 1); return; } e.dlcd = 1; }
    return st0.apply(this, arguments);
  };
  // les boules qui tombent sur les constructions, et ce qui brûle encore après
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const Q = Df.BRASIER;
    if (R.dlTombe && R.dlTombe.length) { for (const f of R.dlTombe) { f.t -= dt; if (f.t > 0) continue; const b = f.b, vivant = !f.by || (!f.by.dead && R.enemies.includes(f.by)); if (!vivant || !S.buildings.includes(b) || b.site) continue;
        const c = centre(b); G.puff(c.x, c.y - 14, '#ff7a1e', 24, 170, 6); G.hitBuilding(b, f.by.dmg * Q.bati, f.by); if (S.buildings.includes(b) && !b.site) allumer(b, Q.brule); }
      R.dlTombe = R.dlTombe.filter(f => f.t > 0); }
    const l = R.dlBrule; if (!l || !l.length) return;
    for (const o of l) { o.t -= dt; const b = o.b; if (!S.buildings.includes(b) || b.site) { o.t = 0; continue; } const c = centre(b);
      if (CG.onScreen(c.x, c.y)) for (let i = 0; i < 2; i++) if (Math.random() < dt * 22) R.parts.push({ x: c.x + rand(-b.w * T * 0.4, b.w * T * 0.4), y: c.y + rand(-b.h * T * 0.5, b.h * T * 0.3), vx: rand(-12, 12), vy: -rand(40, 90), life: rand(0.4, 0.8), max: 0.8, col: Math.random() < 0.35 ? '#ffe36b' : Math.random() < 0.6 ? '#ff8a1e' : '#ff4a1a', size: rand(4, 9), float: true });
      if ((o.tic -= dt) <= 0) { o.tic = 1; G.hitBuilding(b, Q.tic, null); } }
    R.dlBrule = l.filter(o => o.t > 0);
  };
  // dessin : l'éventail qui prévient, puis le jet lui-même
  const gr0 = B.ground; B.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return; const Q = Df.BALAI;
    for (const e of R.enemies) { const q = e.balai; if (!q || e.dead) continue; const x = e.x, y = e.y - 8;
      if (q.t < Q.avert) { const f = q.t / Q.avert; g.save(); g.beginPath(); g.moveTo(x, y); g.arc(x, y, Q.L, q.a0 - Q.arc - 0.12, q.a0 + Q.arc + 0.12); g.closePath(); g.fillStyle = 'rgba(255,40,30,' + (0.1 + f * 0.14) + ')'; g.fill(); g.strokeStyle = 'rgba(255,220,200,' + (0.6 + Math.sin(t * 18) * 0.25) + ')'; g.lineWidth = 2.5; g.stroke(); g.restore(); continue; }
      const a = angle(q), fl = 0.85 + Math.sin(t * 40) * 0.15; g.save(); g.translate(x, y); g.rotate(a);
      [['rgba(255,70,20,0.34)', 1.25], ['rgba(255,140,30,0.5)', 0.85], ['rgba(255,230,120,0.7)', 0.42]].forEach(c => { const w0 = Q.w * 0.3 * c[1], w1 = Q.w * 1.2 * c[1] * fl; g.fillStyle = c[0]; g.beginPath(); g.moveTo(14, -w0); g.quadraticCurveTo(Q.L * 0.55, -w1 * 0.9, Q.L, -w1 * 0.7); g.quadraticCurveTo(Q.L + 26 * c[1], 0, Q.L, w1 * 0.7); g.quadraticCurveTo(Q.L * 0.55, w1 * 0.9, 14, w0); g.closePath(); g.fill(); });
      g.restore(); }
  };
  // ---------- pour la triche : rejouer son arrivée, comme au jour 31 ----------
  Df.scene = function () {
    const S = CG.S, R = CG.R, UI = CG.UI; if (!S || !R) return false;
    if (CG.Mondes && CG.Mondes.ici() !== 0) { UI.toast('La scène du Demon Lord se joue dans la forêt du début.'); return false; }
    if (R.seisme || R.night || R.cine || R.ko > 0) { UI.toast('Pas maintenant : attends que le calme revienne.'); return false; }
    for (const e of R.enemies) if (e.event && !e.dead) e.dead = true; R.event = null; R.alarm = false; R.spawnQ = [];
    S.demon = null; if (S.day < 31) S.day = 31; if (S.hour >= 21 || S.hour < 6) S.hour = 10;
    (R.schedule || []).forEach(e => { if (e.type === 'attack') e.done = true; });
    R.seisme = { t: 0, ph: 'portail' }; CG.sfx('warning'); return true;
  };
})(window.CG);
