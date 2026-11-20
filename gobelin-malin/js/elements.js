// Goblin Malin — les éléments. D'abord deux maux qui collent aux ennemis : la brûlure et le poison (ils perdent de la vie
// pendant quelques secondes). Tout ce qui est du feu (boule de feu, météore, mur de feu, bombe, démon...) a une chance
// d'enflammer. Ensuite quatre sorts « manteaux », cousins de l'Électrification : pendant 15 secondes, ce qui s'approche
// du chef en souffre, et celui qui le frappe encore plus (le Manteau de vent, lui, renvoie les tirs). Un seul manteau à la fois (l'Électrification reste à part).
'use strict';
(function (CG) {
  const G = CG.G, Art = CG.Art, TAU = Math.PI * 2, rand = CG.rand;
  const El = CG.Elements = { CHANCE: 0.35, BRULE: 4, BRULE_DPS: 3, MUR: 0.5, DUR: 15, RAYON: 62, TIC: 0.5, FEUX: { '#ff8a1e': 1, '#ff4a2a': 1, '#ff5a2a': 1, '#ff4a1e': 1, '#ffb432': 1 } };
  const mul = () => { const p = CG.S.player; return (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1); };
  const ok = e => e && !e.dead && !e.struct && !(e.charm > 0);
  El.bruler = function (e, sec, dps) { if (!ok(e)) return; const neuf = !(e.brule && e.brule.t > 0); e.brule = { t: Math.max(sec || El.BRULE, e.brule ? e.brule.t : 0), dps: Math.max(dps || El.BRULE_DPS * mul(), e.brule ? e.brule.dps : 0), tic: neuf ? 0.5 : e.brule.tic }; if (neuf && CG.onScreen(e.x, e.y)) G.text(e.x, e.y - 58, '🔥 En feu !', '#ffb060'); };
  El.empoisonner = function (e, sec, dps) { if (!ok(e)) return; const neuf = !(e.empo && e.empo.t > 0); e.empo = { t: Math.max(sec, e.empo ? e.empo.t : 0), dps: Math.max(dps, e.empo ? e.empo.dps : 0), tic: neuf ? 0.5 : e.empo.tic }; if (neuf && CG.onScreen(e.x, e.y)) G.text(e.x, e.y - 58, '☠️ Empoisonné !', '#c8ff9a'); };
  // ---------- le feu enflamme ----------
  const bl0 = G.blast; G.blast = function (x, y, r, dmg, col) {
    const res = bl0.apply(this, arguments);
    if (El.FEUX[col]) for (const e of CG.R.enemies) if (ok(e) && Math.hypot(e.x - x, e.y - 14 - y) < r + e.r && Math.random() < El.CHANCE) El.bruler(e);
    return res;
  };
  // ---------- les manteaux ----------
  El.M = {
    armFeu: { nom: 'Manteau de braises', icon: '🔥', mp: 18, prix: 900, col: '#ff8a1e', dmg: 4, cri: '🔥 Manteau de braises !', desc: 'des braises tournent autour de toi : tout ennemi qui s\'approche est brûlé encore et encore, et celui qui te frappe prend feu.', fiche: 'brûle autour de toi, enflamme celui qui te frappe' },
    armPoison: { nom: 'Peau de crapaud', icon: '🐸', mp: 18, prix: 900, col: '#9be04a', dmg: 2, cri: '🐸 Peau de crapaud !', desc: 'ta peau suinte de venin : tout ennemi qui s\'approche est empoisonné, et celui qui te frappe l\'est trois fois plus fort.', fiche: 'empoisonne autour de toi, encore plus celui qui te frappe' },
    armGlace: { nom: 'Carapace de givre', icon: '❄️', mp: 18, prix: 900, col: '#9adcff', dmg: 3, cri: '❄️ Carapace de givre !', desc: 'le froid t\'entoure : tout ennemi qui s\'approche est ralenti et blessé, et celui qui te frappe reste gelé sur place deux secondes.', fiche: 'ralentit autour de toi, gèle celui qui te frappe' },
    armVent: { nom: 'Manteau de vent', icon: '🌪️', mp: 18, prix: 900, col: '#d8f0ff', dmg: 1, cri: '🌪️ Manteau de vent !', desc: 'un tourbillon t\'entoure : les flèches, les boules de feu et les crachats des ennemis font demi-tour et repartent sur celui qui les a tirés. Celui qui te frappe est repoussé.', fiche: 'renvoie les tirs ennemis à l\'envoyeur' },
    armRonces: { nom: 'Écorce de ronces', icon: '🌿', mp: 18, prix: 900, col: '#6fbf4a', dmg: 3, cri: '🌿 Écorce de ronces !', desc: 'des ronces t\'enveloppent : tout ennemi qui s\'approche se pique, et celui qui te frappe reçoit en retour presque tout le coup qu\'il t\'a donné.', fiche: 'pique autour de toi, renvoie 80 % des coups' }
  };
  Object.keys(El.M).forEach(id => { const m = El.M[id]; CG.SPELLS[id] = { nom: m.nom, icon: m.icon, mp: m.mp, prix: m.prix, color: m.col, desc: 'Pendant ' + El.DUR + ' secondes, ' + m.desc }; CG.SCROLL_POOL.push(id); if (CG.Effets && CG.Effets.FICHE) CG.Effets.FICHE[id] = ['⚔️', m.dmg * 2, '{n} dégâts par seconde, ' + m.fiche + ', ' + El.DUR + ' s']; });
  const manteau = () => { const R = CG.R, a = R && R.manteau; return a && a.t > 0 ? a : null; };
  El.manteau = manteau;
  const cast0 = G.cast; G.cast = function (id) {
    const m = El.M[id]; if (!m) return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night) return; const cost = G.spellCost(id);
    if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); R.manteau = { id, t: El.DUR, tic: 0 };
    R.rings.push({ x: p.x, y: p.y - 10, r: El.RAYON + 30, life: 0.45, col: m.col }); G.puff(p.x, p.y - 24, m.col, 24, 170, 4); G.text(p.x, p.y - 78, m.cri, m.col, true);
  };
  // le Manteau de braises brûle les toiles d'araignée sur lesquelles le chef marche (celles du nid comme celles qu'on lui crache)
  El.TOILE = 8; // marge autour de la toile, en plus de son rayon
  { let bt = 0; const upT = G.update; G.update = function (dt) { upT.apply(this, arguments); const a = manteau(); if (!a || a.id !== 'armFeu' || !CG.Nid || !CG.Nid.bruler) return; bt -= dt; if (bt > 0) return; bt = 0.12;
    const p = CG.S.player, f0 = CG.Nid.FEU; CG.Nid.FEU = El.TOILE; try { CG.Nid.bruler({ x1: p.x, y1: p.y, x2: p.x, y2: p.y }); } finally { CG.Nid.FEU = f0; } }; }
  // celui qui frappe le chef
  const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) {
    const R = CG.R, p = CG.S.player, a = manteau();
    if (a && !(R.invuln > 0) && !(R.ko > 0)) { let e = null, bd = 70; for (const o of R.enemies) { if (!ok(o)) continue; const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd + o.r) { bd = d; e = o; } }
      if (e) { const k = mul();
        if (a.id === 'armFeu') { R.dmgCol = CG.DMG.feu; G.hurtEnemy(e, 5 * k, p); R.dmgCol = null; El.bruler(e, 5, 4 * k); G.puff(e.x, e.y - 18, '#ff8a1e', 10, 110, 4); }
        else if (a.id === 'armPoison') { El.empoisonner(e, 8, 6 * k); G.puff(e.x, e.y - 18, '#9be04a', 10, 90, 4); }
        else if (a.id === 'armGlace') { G.hurtEnemy(e, 5 * k, p); e.rooted = Math.max(e.rooted || 0, 2); e.slow = Math.max(e.slow || 0, 4); G.puff(e.x, e.y - 18, '#cfeeff', 12, 110, 4); G.text(e.x, e.y - 58, '❄️ Gelé !', '#cfeeff'); }
        else if (a.id === 'armVent') { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; for (let i = 0; i < 10; i++) if (!G.slide(e, dx / d * 7, dy / d * 7)) break; e.path = null; e.slow = Math.max(e.slow || 0, 1); G.hurtEnemy(e, 3 * k, p); G.puff(e.x, e.y - 18, '#ffffff', 10, 130, 3); }
        else { G.hurtEnemy(e, Math.max(3, dmg * 0.8), p); G.puff(e.x, e.y - 18, '#6fbf4a', 10, 110, 3); } } }
    return hp0.apply(this, arguments);
  };
  // le vent retourne les tirs : on regarde avant que le jeu les fasse avancer, pour qu'aucun ne passe
  El.VENT = 74;
  function renvoyer() {
    const S = CG.S, R = CG.R, p = S.player; let n = 0;
    for (const s of R.shots) { if (s.team !== 'e' || s.life <= 0) continue; const dx = s.x - p.x, dy = s.y - (p.y - 18); if (dx * dx + dy * dy > El.VENT * El.VENT || s.vx * dx + s.vy * dy > 0) continue; // seulement ceux qui arrivent
      const v = Math.hypot(s.vx, s.vy) || 300, o = s.owner && !s.owner.dead ? s.owner : G.nearestEnemy(s.x, s.y, 600); let ux = -s.vx / v, uy = -s.vy / v; if (o) { const ox = o.x - s.x, oy = o.y - 16 - s.y, od = Math.hypot(ox, oy) || 1; ux = ox / od; uy = oy / od; }
      s.vx = ux * v * 1.2; s.vy = uy * v * 1.2; s.team = 'p'; s.owner = p; s.life = 1.6; s.renvoi = true; n++; R.rings.push({ x: s.x, y: s.y, r: 20, life: 0.25, col: '#ffffff' }); }
    const Ti = R.tirsM; if (Ti && Ti.length) for (const s of Ti) { if (s.renvoi || s.t / s.dur < 0.45 || Math.hypot(s.x1 - p.x, s.y1 - p.y) > El.VENT) continue; // les crachats du marais : ils repartent d'où ils viennent
      s.renvoi = true; n++; const k = 0.5, x = s.x0 + (s.x1 - s.x0) * k, y = s.y0 + (s.y1 - s.y0) * k - 20; R.rings.push({ x, y, r: 20, life: 0.25, col: '#ffffff' });
      if (s.by && !s.by.dead) { const n0 = R.shots.length; G.shoot({ x, y: y + 18 }, s.by, 'bolt', Math.max(4, s.dmg || 4), 'p', p); if (R.shots[n0]) R.shots[n0].renvoi = true; } }
    if (Ti && Ti.length) R.tirsM = Ti.filter(s => !s.renvoi); // retirés avant d'arriver : ils ne font plus rien au chef
    if (n && CG.onScreen(p.x, p.y)) CG.sfx('swing');
  }
  const up0 = G.update; G.update = function (dt) {
    { const R0 = CG.R, a0 = R0 && R0.manteau; if (CG.S && a0 && a0.t > 0 && a0.id === 'armVent' && !(R0.ko > 0)) renvoyer(); }
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player;
    for (const e of R.enemies) { // la brûlure et le poison rongent
      const b = e.brule; if (b) { b.t -= dt; b.tic -= dt; if (e.dead || b.t <= 0) e.brule = null; else if (b.tic <= 0) { b.tic = 0.5; R.dmgCol = CG.DMG.feu; G.hurtEnemy(e, b.dps * 0.5, p, false); R.dmgCol = null; } }
      const v = e.empo; if (v) { v.t -= dt; v.tic -= dt; if (e.dead || v.t <= 0) e.empo = null; else if (v.tic <= 0) { v.tic = 0.5; R.dmgCol = CG.DMG.poison; G.hurtEnemy(e, v.dps * 0.5, p, false); R.dmgCol = null; } }
    }
    // le mur de feu et le corps du démon enflamment ceux qui les touchent
    if (R.walls && R.walls.length) for (const w of R.walls) { const vx = w.x2 - w.x1, vy = w.y2 - w.y1, L2 = vx * vx + vy * vy || 1; for (const e of R.enemies) { if (!ok(e) || (e.brule && e.brule.t > 1)) continue; const q = CG.clamp(((e.x - w.x1) * vx + (e.y - w.y1) * vy) / L2, 0, 1); if (Math.hypot(e.x - (w.x1 + vx * q), e.y - (w.y1 + vy * q)) < 26 + e.r && Math.random() < El.MUR * dt * 2) El.bruler(e); } }
    if (R.meta && R.meta.t > 0 && R.meta.id === 'metaDemon') for (const e of R.enemies) if (ok(e) && !(e.brule && e.brule.t > 1) && Math.hypot(e.x - p.x, e.y - p.y) < 70 && Math.random() < El.CHANCE * dt) El.bruler(e);
    const a = R.manteau; if (!a) return; a.t -= dt; a.tic -= dt; if (a.t <= 0 || R.night) { R.manteau = null; return; }
    if (a.tic <= 0 && !(R.ko > 0)) { a.tic = El.TIC; const m = El.M[a.id], k = mul();
      for (const e of R.enemies.slice()) { if (!ok(e) || Math.hypot(e.x - p.x, e.y - p.y) > El.RAYON + e.r) continue; G.hurtEnemy(e, m.dmg * k, p);
        if (a.id === 'armFeu') { if (Math.random() < 0.25) El.bruler(e); } else if (a.id === 'armPoison') El.empoisonner(e, 5, 2 * k); else if (a.id === 'armGlace') e.slow = Math.max(e.slow || 0, 1.5);
        R.parts.push({ x: e.x + rand(-8, 8), y: e.y - 20, vx: rand(-30, 30), vy: -40, life: 0.35, max: 0.35, col: m.col, size: 3, float: true }); } }
  };
  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const flamme = (g, x, y, h, c1, c2) => { g.fillStyle = c1; g.beginPath(); g.moveTo(x - h * 0.4, y); g.quadraticCurveTo(x - h * 0.5, y - h * 0.55, x, y - h); g.quadraticCurveTo(x + h * 0.5, y - h * 0.55, x + h * 0.4, y); g.closePath(); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(x - h * 0.2, y); g.quadraticCurveTo(x - h * 0.24, y - h * 0.3, x, y - h * 0.55); g.quadraticCurveTo(x + h * 0.24, y - h * 0.3, x + h * 0.2, y); g.closePath(); g.fill(); };
  const en0 = Art.enemy; Art.enemy = function (g, e, t) {
    en0.apply(this, arguments);
    if (e.brule) { const r = e.r || 12; for (let i = 0; i < 3; i++) { const x = e.x + (i - 1) * r * 0.7, h = 9 + Math.sin(t * 13 + i * 2.1 + e.seed) * 3; flamme(g, x, e.y - 8 - (i === 1 ? r * 1.1 : r * 0.3), h, 'rgba(255,120,30,0.9)', '#ffe36b'); } }
    if (e.empo) { const r = e.r || 12; for (let i = 0; i < 3; i++) { const k = (t * 0.9 + i / 3 + e.seed) % 1; g.globalAlpha = (1 - k) * 0.85; ell(g, e.x + Math.sin(i * 2.4 + e.seed) * r * 0.8, e.y - 12 - k * (20 + r), 2 + k * 2, 2 + k * 2, '#9be04a'); } g.globalAlpha = 1; }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R, a = manteau(); if (!a || R.ko > 0) return; const p = CG.S.player, al = Math.min(1, a.t / 1.5), cx = p.x, cy = p.y - 22, m = El.M[a.id];
    g.save(); g.globalAlpha = al * 0.16; ell(g, cx, cy + 14, El.RAYON, El.RAYON * 0.62, m.col); g.globalAlpha = al;
    for (let i = 0; i < 6; i++) { const an = t * (a.id === 'armGlace' ? 1.4 : 2.4) + i * TAU / 6, x = cx + Math.cos(an) * 30, y = cy + 4 + Math.sin(an) * 17, dev = Math.sin(an) > 0;
      g.globalAlpha = al * (dev ? 1 : 0.5);
      if (a.id === 'armFeu') flamme(g, x, y + 5, 11 + Math.sin(t * 15 + i) * 2.5, '#ff7a1e', '#ffe36b');
      else if (a.id === 'armPoison') { const k = (t * 1.2 + i / 6) % 1; ell(g, x, y - k * 14, 3.4 - k * 1.4, 3.4 - k * 1.4, '#9be04a'); ell(g, x - 1, y - k * 14 - 1, 1, 1, '#e4ffc0'); }
      else if (a.id === 'armGlace') { g.save(); g.translate(x, y); g.rotate(an * 1.5); g.fillStyle = '#cfeeff'; g.beginPath(); g.moveTo(0, -7); g.lineTo(3, 0); g.lineTo(0, 7); g.lineTo(-3, 0); g.closePath(); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(-0.6, -5, 1.2, 5); g.restore(); }
      else if (a.id === 'armVent') { g.strokeStyle = 'rgba(235,248,255,0.85)'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.ellipse(cx, cy + 6 - (i - 2.5) * 7, 30 - Math.abs(i - 2.5) * 4, 9, 0, an * 2, an * 2 + 1.5); g.stroke(); }
      else { const x2 = cx + Math.cos(an + 0.7) * 30, y2 = cy + 4 + Math.sin(an + 0.7) * 17; g.strokeStyle = '#3f7a2a'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + Math.cos(an) * 5, (y + y2) / 2 - 5, x2, y2); g.stroke(); g.fillStyle = '#2e5a1e'; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x + Math.cos(an) * 7, y + Math.sin(an) * 5 - 3); g.lineTo(x + 2, y); g.closePath(); g.fill(); ell(g, x2, y2, 2.4, 1.4, '#6fbf4a', an); } }
    g.restore();
  };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'manteau', ic: () => El.M[manteau().id].icon, nom: () => El.M[manteau().id].nom, txt: () => { const d = El.M[manteau().id].desc; return d.charAt(0).toUpperCase() + d.slice(1); }, t: () => { const a = manteau(); return a ? a.t : 0; } });
})(window.CG);
