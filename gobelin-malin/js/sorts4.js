// Goblin Malin — deux sorts de plus : le Cœur de géant (la vie maximum du chef grossit pendant une minute) et la Bombe
// (on la pose devant soi, la mèche brûle trois secondes, puis elle saute ; elle blesse tout le monde : ennemis, chef, gobelins,
// animaux et constructions. Les gobelins et les animaux le savent : ils s'en écartent tant que la mèche brûle).
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2, rand = CG.rand;
  const S4 = CG.Sorts4 = { COEUR: 0.4, COEUR_T: 60, MECHE: 3, BOMBE_DMG: 45, BOMBE_R: 120, BOMBE_CLAN: 0.5, FUITE: 190, MARGE: 34, CORPS: 20 };
  Object.assign(CG.SPELLS, {
    coeur: { nom: 'Cœur de géant', icon: '💗', mp: 16, prix: 700, color: '#ff8aa8', desc: 'Ta vie maximum grossit de ' + Math.round(S4.COEUR * 100) + ' % pendant ' + S4.COEUR_T + ' secondes, et tu gagnes tout de suite ces points de vie. À la fin, ta vie maximum revient comme avant.' },
    bombe: { nom: 'Bombe', icon: '💣', mp: 10, prix: 450, color: '#ff8a1e', desc: 'Tu poses une bombe devant toi. Elle explose après ' + S4.MECHE + ' secondes et blesse tout ce qui est autour : les ennemis, les constructions, ton clan... et toi. Tes gobelins et tes animaux s\'en écartent tout seuls : fais comme eux !' }
  });
  CG.SCROLL_POOL.push('coeur', 'bombe');
  if (CG.Effets && CG.Effets.FICHE) Object.assign(CG.Effets.FICHE, { coeur: ['❤️', null, '+' + Math.round(S4.COEUR * 100) + ' % de vie max, ' + S4.COEUR_T + ' s'], bombe: ['⚔️', S4.BOMBE_DMG, '{n} dégâts, grande explosion après ' + S4.MECHE + ' s'] });
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('coeur')) CG.Mondes.GLOBAL.push('coeur');
  const mul = () => { const p = CG.S.player; return (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1); };
  S4.finCoeur = function (muet) { const S = CG.S, p = S.player, c = S.coeur; if (!c) return; S.coeur = null; p.maxhp -= c.d; p.hp = Math.min(p.hp, p.maxhp); if (!muet) { G.puff(p.x, p.y - 24, '#ffd0dc', 16, 110, 4); G.text(p.x, p.y - 70, 'Le Cœur de géant s\'arrête', '#ffd0dc'); } };
  const cast0 = G.cast; G.cast = function (id) {
    if (id !== 'coeur' && id !== 'bombe') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night) return; const cost = G.spellCost(id);
    if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1;
    if (id === 'coeur') {
      if (S.coeur) S4.finCoeur(true); const d = Math.round(p.maxhp * S4.COEUR); S.coeur = { t: S4.COEUR_T, d }; p.maxhp += d; p.hp = Math.min(p.maxhp, p.hp + d); CG.sfx('heal');
      G.puff(p.x, p.y - 24, '#ff8aa8', 28, 170, 5); for (let i = 0; i < 2; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 60 + i * 40, life: 0.45 + i * 0.15, col: '#ff8aa8' }); G.text(p.x, p.y - 80, '💗 +' + d + ' vie max', '#ffb0c4', true);
    } else {
      const d = R.dir && (R.dir.x || R.dir.y) ? R.dir : { x: p.face < 0 ? -1 : 1, y: 0 }; let x = p.x + d.x * 36, y = p.y + d.y * 36; if (!CG.W.walkPx(x, y)) { x = p.x; y = p.y; }
      (R.bombes = R.bombes || []).push({ x, y, t: S4.MECHE, dmg: S4.BOMBE_DMG * mul(), n: 0 }); CG.sfx('swing'); if (CG.Magie.reveal && R.invis > 0) CG.Magie.reveal();
    }
  };
  // l'explosion ne choisit pas son camp : le chef, les gobelins, les animaux et les constructions y passent aussi
  S4.souffle = function (b) {
    const S = CG.S, R = CG.R, p = S.player, T = CG.TILE, r = S4.BOMBE_R, d = b.dmg * S4.BOMBE_CLAN, pres = e => Math.hypot(e.x - b.x, e.y - b.y) < r;
    R.feuSrc = true;
    try {
      if (!(R.ko > 0) && pres(p)) G.hurtPlayer(d);
      for (const g of S.goblins.slice()) if (!g.hidden && !g.dead && g.ko !== true && !g.perch && pres(g)) G.hurtGoblin(g, d);
      if (CG.P && S.pets) for (const a of S.pets) if (!a.ko && pres(a)) CG.P.hurt(a, d);
    } finally { R.feuSrc = false; }
    for (const c of S.buildings.slice()) {
      if (!G.buildMaxHp(c)) continue;
      const dx = Math.max(c.tx * T - b.x, 0, b.x - (c.tx + c.w) * T), dy = Math.max(c.ty * T - b.y, 0, b.y - (c.ty + c.h) * T);
      if (Math.hypot(dx, dy) < r) { c.warned = true; G.hitBuilding(c, b.dmg); }
    }
  };
  // la bombe est un objet posé : on ne marche pas à travers (sauf le chef pendant un passe-muraille, et ce qui vole)
  S4.bloquer = function (B) {
    const S = CG.S, R = CG.R, sort = (e, r) => { for (const b of B) { const dx = e.x - b.x, dy = e.y - b.y, d = Math.hypot(dx, dy); if (d < r) { const m = r - d; G.slide(e, (d ? dx / d : 1) * m, (d ? dy / d : 0) * m, 8); } } };
    if (!(R.passe > 0) && !(R.ko > 0)) sort(S.player, S4.CORPS);
    for (const e of R.enemies) if (!e.dead && !e.struct && !(CG.ENEMIES[e.type] || {}).fly) sort(e, S4.CORPS + (e.r || 12) - 10);
    for (const g of S.goblins) if (!g.hidden && !g.perch) sort(g, S4.CORPS);
    if (S.pets) for (const a of S.pets) if (!a.ko && !a.ridden && !((CG.P.KINDS || {})[a.kind] || {}).fly) sort(a, S4.CORPS);
  };
  // tant que la mèche brûle, les gobelins et les animaux s'écartent de la bombe
  S4.fuir = function (B, dt) {
    const S = CG.S, lim = S4.BOMBE_R + S4.MARGE, st = S4.FUITE * dt;
    const ecarte = (e, gob) => {
      let fx = 0, fy = 0;
      for (const b of B) { const dx = e.x - b.x, dy = e.y - b.y, d = Math.hypot(dx, dy); if (d < lim) { fx += d ? dx / d : 1; fy += d ? dy / d : 0; } }
      if (!fx && !fy) { if (gob && e.peurBombe) { e.peurBombe = false; if (e.bubble === '😱') e.bubble = null; } return; }
      const n = Math.hypot(fx, fy) || 1; fx /= n; fy /= n;
      if (!G.slide(e, fx * st, fy * st, 8)) G.slide(e, -fy * st, fx * st, 8);
      e.face = fx > 0 ? 1 : -1; e.moving = true; e.step = (e.step || 0) + dt * 5;
      if (gob && !e.bubble) { e.bubble = '😱'; e.peurBombe = true; }
    };
    for (const g of S.goblins) if (!g.hidden && !g.dead && g.ko !== true && !g.perch && !g.exile) ecarte(g, true);
    if (S.pets) for (const a of S.pets) if (!a.ko && !a.ridden) ecarte(a, false);
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return;
    if (R.bombes && !R.bombes.length && !R.bombesFin) { R.bombesFin = true; for (const g of S.goblins) if (g.peurBombe) { g.peurBombe = false; if (g.bubble === '😱') g.bubble = null; } } else if (R.bombes && R.bombes.length) R.bombesFin = false;
    const c = S.coeur; if (c && !R.night && !R.cine) { c.t -= dt; if (c.t <= 0) S4.finCoeur(); }
    const B = R.bombes; if (!B || !B.length) return;
    S4.fuir(B, dt); S4.bloquer(B);
    for (const b of B) { b.t -= dt; const s = Math.ceil(b.t); if (s !== b.n && b.t > 0) { b.n = s; if (CG.onScreen(b.x, b.y)) CG.sfx('click'); }
      if (Math.random() < dt * 30) R.parts.push({ x: b.x + 7, y: b.y - 24, vx: rand(-30, 30), vy: rand(-60, -10), life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ffe36b' : '#ff8a1e', size: 3 });
      if (b.t <= 0) { G.blast(b.x, b.y - 14, S4.BOMBE_R, b.dmg, '#ff8a1e'); S4.souffle(b); G.puff(b.x, b.y - 14, '#3a3030', 26, 220, 7); G.puff(b.x, b.y - 14, '#ffe36b', 16, 160, 5); R.rings.push({ x: b.x, y: b.y - 8, r: S4.BOMBE_R * 0.6, life: 0.3, col: '#ffe36b' }); R.shake = Math.max(R.shake || 0, 0.45); } }
    R.bombes = B.filter(b => b.t > 0);
  };
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R.bombes) return;
    for (const b of R.bombes) { if (!CG.onScreen(b.x, b.y)) continue; const k = 1 - b.t / S4.MECHE, cl = Math.sin(t * (8 + k * 30)) > 0, z = 1 + (cl ? 0.08 + k * 0.1 : 0);
      g.save(); g.globalAlpha = 0.12 + k * 0.1; g.strokeStyle = '#ff5a3a'; g.lineWidth = 2; g.setLineDash([8, 8]); g.beginPath(); g.ellipse(b.x, b.y - 4, S4.BOMBE_R, S4.BOMBE_R * 0.92, 0, 0, TAU); g.stroke(); g.restore(); // jusqu'où ça va sauter
      ell(g, b.x, b.y + 2, 12, 4, 'rgba(0,0,0,0.3)'); ell(g, b.x, b.y - 9, 11 * z, 11 * z, cl ? '#5a2a2a' : '#26222a'); ell(g, b.x - 3.4, b.y - 13, 3.4, 2.6, 'rgba(255,255,255,0.3)');
      g.fillStyle = '#8a8690'; g.fillRect(b.x - 3, b.y - 22 * z, 6, 4); g.strokeStyle = '#c8a878'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(b.x, b.y - 22 * z); g.quadraticCurveTo(b.x + 5, b.y - 30, b.x + 7 - k * 5, b.y - 25 - (1 - k) * 4); g.stroke();
      ell(g, b.x + 7 - k * 5, b.y - 25 - (1 - k) * 4, 3 + Math.sin(t * 40) * 1, 3 + Math.sin(t * 40) * 1, '#ffe36b'); ell(g, b.x + 7 - k * 5, b.y - 25 - (1 - k) * 4, 1.4, 1.4, '#ffffff');
      g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(String(Math.ceil(b.t)), b.x, b.y - 36); g.fillStyle = cl ? '#ff9a8a' : '#fff'; g.fillText(String(Math.ceil(b.t)), b.x, b.y - 36); }
  };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'coeur', ic: '💗', nom: () => 'Cœur de géant', txt: () => { const c = CG.S.coeur; return '+' + (c ? c.d : 0) + ' points de vie maximum. À la fin, ta vie maximum revient comme avant.'; }, t: () => { const c = CG.S.coeur; return c && c.t > 0 ? c.t : 0; } });
})(window.CG);
