// Clan Gobelin — deux bêtes qui ont enfin leur caractère : l'ours pique un sprint de 2 à 3 secondes puis se remet à marcher,
// et le sanglier gratte le sol puis fonce tout droit, comme la Ruée du chef.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, rand = CG.rand, Be = CG.Betes = {
    OURS: { mul: 1.9, dur: [2, 3], repos: [3.5, 5.5], vue: 340 },
    SANGLIER: { elan: 0.65, dur: 0.9, vitesse: 330, repos: [4, 6], min: 80, max: 270, dmg: 1.5, sonne: 2.2 } /* sonne : secondes qu'il reste étourdi après avoir percuté quelque chose */
  };
  const hors = e => e.dead || e.calm || e.struct || e.retreat || e.charm > 0 || e.rooted > 0;
  function ours(e, dt) {
    const R = CG.R, O = Be.OURS; if (e.spd0 === undefined) { e.spd0 = e.spd; e.repos = rand(0.5, 2); }
    if (hors(e)) { e.course = 0; e.spd = e.spd0; return; }
    if (e.course > 0) { // il court : la poussière vole
      e.course -= dt; e.spd = e.spd0 * O.mul;
      if (e.moving && Math.random() < dt * 14) R.parts.push({ x: e.x + rand(-8, 8), y: e.y - 2, vx: rand(-16, 16), vy: rand(-26, -8), life: 0.45, max: 0.45, col: '#d8c8a0', size: 3.5, float: true });
      if (e.course <= 0) { e.spd = e.spd0; e.repos = rand(O.repos[0], O.repos[1]); }
      return;
    }
    e.spd = e.spd0; e.repos -= dt; const t = e.target;
    if (e.repos <= 0 && t && !t.dead && Math.hypot(t.x - e.x, t.y - e.y) < O.vue) { e.course = rand(O.dur[0], O.dur[1]); if (CG.onScreen(e.x, e.y)) { G.text(e.x, e.y - 58, '💢', '#fff', true); CG.sfx('warning'); } }
  }
  function sanglier(e, dt) {
    const R = CG.R, S = CG.S, B = Be.SANGLIER, c = e.charge; if (e.spd0 === undefined) { e.spd0 = e.spd; e.repos = rand(1, 3); }
    if (hors(e)) { e.charge = null; e.spd = e.spd0; return; }
    if (!c) {
      e.spd = e.spd0; e.repos -= dt; const t = e.target; if (e.repos > 0 || !t || t.dead || t.hidden) return;
      const dx = t.x - e.x, dy = t.y - e.y, d = Math.hypot(dx, dy); if (d < B.min || d > B.max || !W.lineClear(e.x, e.y, t.x, t.y)) return;
      e.charge = { ph: 'elan', t: B.elan, dx: dx / d, dy: dy / d, tg: t }; e.path = null; if (CG.onScreen(e.x, e.y)) { G.text(e.x, e.y - 50, '❗', '#ffe36b', true); CG.sfx('warning'); }
      return;
    }
    e.spd = 0; e.atkCd = Math.max(e.atkCd || 0, 0.3); e.face = c.dx > 0 ? 1 : -1; c.t -= dt; // pendant la charge, il ne fait rien d'autre
    if (c.ph === 'elan') { // il gratte le sol en visant ; la direction se verrouille à la fin
      const t = c.tg; if (t && !t.dead) { const dx = t.x - e.x, dy = t.y - e.y, d = Math.hypot(dx, dy) || 1; c.dx = dx / d; c.dy = dy / d; }
      e.moving = true; e.step += dt * 10; if (Math.random() < dt * 16) R.parts.push({ x: e.x - c.dx * 12 + rand(-5, 5), y: e.y - 1, vx: -c.dx * rand(40, 90), vy: -c.dy * rand(40, 90) - rand(8, 24), life: 0.4, max: 0.4, col: '#d8c8a0', size: 3.5, float: true });
      if (c.t <= 0) { c.ph = 'course'; c.t = B.dur; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
      return;
    }
    const x0 = e.x, y0 = e.y, v = B.vitesse * dt; G.slide(e, c.dx * v, c.dy * v, e.r || 12); e.moving = true; e.step += dt * 9;
    if (Math.random() < dt * 30) R.parts.push({ x: e.x - c.dx * 10, y: e.y - 3, vx: rand(-20, 20), vy: rand(-30, -8), life: 0.35, max: 0.35, col: '#d8c8a0', size: 3, float: true });
    const fini = (choc) => { e.charge = null; e.spd = e.spd0; e.repos = rand(B.repos[0], B.repos[1]); e.atkCd = 1.1; if (choc) { e.rooted = Math.max(e.rooted || 0, B.sonne); e.etourdi = R.t + B.sonne; e.atkCd = Math.max(e.atkCd, B.sonne); G.puff(e.x + c.dx * 12, e.y - 10, '#e8dcc0', 12, 120, 3.5); /* sonné : des étoiles lui tournent autour de la tête (main.js) */ if (CG.onScreen(e.x, e.y)) CG.sfx('hit'); } };
    // le premier qu'il percute : le chef, un gobelin ou un animal
    const p = S.player, cible = [p].concat(S.goblins, S.pets).find(o => o && !o.hidden && !o.dead && o.ko !== true && !o.ridden && !(o === p && R.ko > 0) && Math.hypot(o.x - (e.x + c.dx * 10), o.y - (e.y + c.dy * 10)) < 22 + (e.r || 12));
    if (cible) { const dmg = e.dmg * B.dmg; if (cible === p) G.hurtPlayer(dmg); else if (cible.pet) CG.P.hurt(cible, dmg); else G.hurtGoblin(cible, dmg); G.puff(cible.x, cible.y - 16, '#fff', 10, 130, 3); return fini(false); }
    if ((e.x - x0) * c.dx + (e.y - y0) * c.dy < v * 0.35) return fini(true); // un arbre, un mur : il s'assomme une seconde
    if (c.t <= 0) fini(false);
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !CG.S) return;
    for (const e of R.enemies) { if (e.type === 'ours') ours(e, dt); else if (e.type === 'sanglier') sanglier(e, dt); }
  };
  // pendant l'élan du sanglier : un trait rouge au sol montre où il va foncer
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    const R = CG.R; if (R) for (const e of R.enemies) { const c = e.charge; if (!c || c.ph !== 'elan' || e.dead || !CG.onScreen(e.x, e.y)) continue; const k = 1 - c.t / Be.SANGLIER.elan, L = Be.SANGLIER.vitesse * Be.SANGLIER.dur * 0.8;
      g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,80,60,' + (0.18 + k * 0.32) + ')'; g.lineWidth = 16; g.beginPath(); g.moveTo(e.x + c.dx * 14, e.y + c.dy * 14); g.lineTo(e.x + c.dx * L * k, e.y + c.dy * L * k); g.stroke(); g.restore(); }
    return gr0.apply(this, arguments);
  };
})(window.CG);
