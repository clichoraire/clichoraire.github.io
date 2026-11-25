// Goblin Malin — « Champ de paralysie », un sort du 6e cercle. Un rideau d'énergie se dresse devant le chef, aussi large que
// le Mur de pierre (NB cases, en travers de là où il regarde). On passe au travers... mais tout ennemi qui y met le pied reste
// figé sur place (PARA secondes). Une fois libéré, il a REPIT secondes pour en sortir avant d'être repris.
// Ne marche pas sur les chefs ennemis. Le clan, lui, le traverse sans rien sentir. Tout est réglable dans CG.ChampPara.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, SP = CG.SPELLS, TAU = Math.PI * 2, ID = 'champpara';
  const Cp = CG.ChampPara = { NB: 4, DEVANT: 58, DUREE: 16, PARA: 4, REPIT: 2.5, MANA: 16, PRIX: 1450, COL: '#c9a0ff' };
  SP[ID] = { nom: 'Champ de paralysie', icon: '🌀', mp: Cp.MANA, prix: Cp.PRIX, color: Cp.COL, desc: 'Un rideau d\'énergie, large comme un mur de pierre, se dresse devant toi pendant ' + Cp.DUREE + ' secondes. Tout ennemi qui le traverse reste figé ' + Cp.PARA + ' secondes. Ne marche pas sur les chefs.' };
  if (CG.SCROLL_POOL && !CG.SCROLL_POOL.includes(ID)) CG.SCROLL_POOL.push(ID);
  if (CG.CerclesPrix && CG.CerclesPrix.CERCLE) CG.CerclesPrix.CERCLE[ID] = 6;
  if (CG.Effets && CG.Effets.FICHE) CG.Effets.FICHE[ID] = ['⏳', null, Cp.PARA + ' s sans bouger pour qui le traverse, ' + Cp.DUREE + ' s'];
  const cast0 = G.cast; G.cast = function (id) {
    if (id !== ID) return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return; const cout = G.spellCost ? G.spellCost(ID) : Cp.MANA;
    if (p.mp < cout) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana (' + cout + ')', '#9ab6ff'); return; }
    const d = R.dir || { x: p.face || 1, y: 0 }, L = Math.hypot(d.x, d.y) || 1, cx = Math.floor((p.x + d.x / L * Cp.DEVANT) / T), cy = Math.floor((p.y + d.y / L * Cp.DEVANT) / T), vert = Math.abs(d.x) >= Math.abs(d.y), cases = [];
    for (let i = 0; i < Cp.NB; i++) { const o = i - Math.floor((Cp.NB - 1) / 2), tx = cx + (vert ? 0 : o), ty = cy + (vert ? o : 0); if (tx < 2 || ty < 2 || tx > CG.MW - 3 || ty > CG.MH - 3 || !W.walkTile(tx, ty)) continue; cases.push({ x: tx * T + T / 2, y: ty * T + T / 2, s: Math.random() * 10 }); }
    if (!cases.length) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas de place pour un champ ici', Cp.COL); return; }
    p.mp -= cout; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); if (CG.Magie.reveal && R.invis > 0) CG.Magie.reveal(); if (Math.abs(d.x) > 0.1) p.face = d.x > 0 ? 1 : -1;
    (R.champsPara = R.champsPara || []).push({ cases, t: Cp.DUREE, max: Cp.DUREE, vus: new Map() });
    cases.forEach(c => { G.puff(c.x, c.y - 10, Cp.COL, 8, 120, 3); R.rings.push({ x: c.x, y: c.y, r: 30, life: 0.35, col: Cp.COL }); });
  };
  const chef = e => { const d = CG.ENEMIES[e.type]; return !!(d && d.boss) || !!e.duel; };
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R; const L = R && R.champsPara; if (!L || !L.length) return r;
    for (const c of L) { c.t -= dt;
      for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0 || chef(e) || e.para > 0 || (c.vus.get(e) || 0) > R.t) continue;
        if (!c.cases.some(q => Math.abs(e.x - q.x) < T / 2 + 4 && Math.abs(e.y - q.y) < T / 2 + 4)) continue;
        e.para = Cp.PARA; e.daze = Math.max(e.daze || 0, 0.3); e.fear = 0; e.path = null; e.moving = false; c.vus.set(e, R.t + Cp.PARA + Cp.REPIT);
        if (CG.onScreen(e.x, e.y)) { G.text(e.x, e.y - 60, '🌀 Figé', Cp.COL, true); G.puff(e.x, e.y - 18, '#f0e0ff', 10, 110, 3); R.rings.push({ x: e.x, y: e.y - 8, r: 34, life: 0.3, col: Cp.COL }); CG.sfx('zap'); } } }
    R.champsPara = L.filter(c => c.t > 0); return r;
  };
  // ---------- le dessin : par case, une lueur au sol, un voile mauve qui ondule, des filaments d'énergie et des étincelles qui montent ----------
  let voile = null;
  function image() { if (voile) return voile; const c = document.createElement('canvas'); c.width = 44; c.height = 76; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 76);
    gr.addColorStop(0, 'rgba(200,160,255,0)'); gr.addColorStop(0.35, 'rgba(190,140,255,0.34)'); gr.addColorStop(0.8, 'rgba(150,90,240,0.5)'); gr.addColorStop(1, 'rgba(120,70,220,0.1)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(4, 76); g.quadraticCurveTo(0, 30, 10, 4); g.quadraticCurveTo(22, -4, 34, 4); g.quadraticCurveTo(44, 30, 40, 76); g.closePath(); g.fill();
    const g2 = g.createLinearGradient(0, 0, 44, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, 'rgba(255,240,255,0.3)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = g2; g.fillRect(14, 8, 16, 64);
    return (voile = c); }
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const L = CG.R && CG.R.champsPara; if (!L || !L.length) return;
    for (const c of L) { const a = Math.min(1, c.t / 1.2, (c.max - c.t) / 0.3); for (const q of c.cases) { if (!CG.onScreen(q.x, q.y)) continue; g.globalAlpha = a * (0.3 + Math.sin(t * 4 + q.s) * 0.08); g.fillStyle = '#a070ff'; g.beginPath(); g.ellipse(q.x, q.y + 4, T / 2 + 2, T / 4, 0, 0, TAU); g.fill(); g.globalAlpha = a * 0.5; g.strokeStyle = '#e8d0ff'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(q.x, q.y + 4, T / 2 - 3 + Math.sin(t * 3 + q.s) * 2, T / 4 - 2, 0, 0, TAU); g.stroke(); } } g.globalAlpha = 1; }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const L = CG.R && CG.R.champsPara; if (!L || !L.length) return; const im = image();
    for (const c of L) { const a = Math.min(1, c.t / 1.2, (c.max - c.t) / 0.3);
      for (const q of c.cases) { if (!CG.onScreen(q.x, q.y)) continue; const w = Math.sin(t * 2.6 + q.s), h = 70 + Math.sin(t * 3.4 + q.s * 2) * 5;
        g.globalAlpha = a * (0.75 + w * 0.15); g.drawImage(im, q.x - 22 + w * 2, q.y + 8 - h, 44, h); g.drawImage(im, q.x - 16 - w * 3, q.y + 6 - h * 0.8, 32, h * 0.8);
        g.globalAlpha = a * 0.9; g.strokeStyle = '#fff4b0'; g.lineWidth = 1.3; g.lineCap = 'round'; /* un filament doré qui zigzague, redessiné quelques fois par seconde */
        const k = Math.floor(t * 9 + q.s * 3), al = n => { const v = Math.sin(k * 12.9898 + n * 78.233 + q.s) * 43758.5453; return v - Math.floor(v); };
        if (al(0) < 0.6) { g.beginPath(); let x = q.x + (al(1) - 0.5) * 22, y = q.y + 2; g.moveTo(x, y); for (let i = 2; i < 6; i++) { x += (al(i) - 0.5) * 16; y -= 9 + al(i + 6) * 6; g.lineTo(x, y); } g.stroke(); }
        for (let i = 0; i < 3; i++) { const u = (t * 0.55 + i / 3 + q.s) % 1, x = q.x + Math.sin(q.s * 7 + i * 2.4 + u * 5) * 13, y = q.y + 4 - u * 62, r = 1.3 + (1 - u) * 1.4; g.globalAlpha = a * (1 - u); g.fillStyle = i % 2 ? '#ffffff' : '#e0c0ff'; g.beginPath(); g.moveTo(x, y - r * 1.6); g.lineTo(x + r * 0.5, y); g.lineTo(x, y + r * 1.6); g.lineTo(x - r * 0.5, y); g.closePath(); g.fill(); } } }
    g.globalAlpha = 1; }; }
})(window.CG);
