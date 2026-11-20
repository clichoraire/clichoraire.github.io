// Goblin Malin — le sort Passe-muraille : pendant quelques secondes, le chef passe à travers tout (murs, arbres, rochers, eau, bâtiments).
// Trois niveaux (niveaux.js) : 10, 16 puis 24 secondes. Si le sort s'arrête pendant qu'on est dans un obstacle, on ressort au sol libre le plus proche.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, TAU = Math.PI * 2, rand = CG.rand;
  const Pa = CG.Passe = { T: [0, 10, 16, 24], ALERTE: 3, COL: '#a8f0e0' };
  CG.SPELLS.passe = { nom: 'Passe-muraille', icon: '👻', mp: 14, prix: 800, color: Pa.COL, desc: 'Pendant ' + Pa.T[1] + ' secondes, tu passes à travers tout : murs, arbres, rochers, eau, bâtiments. Si le sort s\'arrête pendant que tu es dans un obstacle, tu ressors au sol libre le plus proche.' };
  CG.SCROLL_POOL.push('passe');
  if (CG.Effets && CG.Effets.FICHE) CG.Effets.FICHE.passe = ['⏳', null, 'traverse tout, ' + Pa.T[1] + ' à ' + Pa.T[3] + ' s selon le niveau'];
  Pa.duree = () => Pa.T[(CG.Niveaux && CG.Niveaux.niv('passe')) || 1] || Pa.T[1];
  const libre = (x, y) => W.walkPx(x - 9, y - 9) && W.walkPx(x + 9, y - 9) && W.walkPx(x - 9, y + 9) && W.walkPx(x + 9, y + 9);
  // le sol libre le plus proche, de préférence un endroit d'où l'on peut revenir au camp
  function sortir(p) {
    if (libre(p.x, p.y)) return false; const T = CG.TILE, tx = Math.floor(p.x / T), ty = Math.floor(p.y / T); let best = null, bd = 1e9, secours = null, sd = 1e9;
    for (let r = 1; r <= 40 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = tx + dx, y = ty + dy; if (!W.inMap(x, y) || !W.walkTile(x, y)) continue;
      const c = W.center(x, y), d = Math.hypot(c.x - p.x, c.y - p.y); let ok = true; try { ok = !W.reachable || W.reachable(x, y); } catch (e) { ok = true; }
      if (ok) { if (d < bd) { bd = d; best = c; } } else if (d < sd) { sd = d; secours = c; } }
    const but = best || secours; if (but) { p.x = but.x; p.y = but.y; } else if (G.unstick) G.unstick(p, 9);
    p.path = null; return true;
  }
  Pa.sortir = sortir;
  Pa.fin = function (muet) {
    const R = CG.R, p = CG.S.player; if (!(R.passe > 0) && !R.passeFin) return; R.passe = 0; R.passeFin = false; const x0 = p.x, y0 = p.y; W.surEau = R.surEau > 0; /* potion de nénuphar : l'eau compte comme du sol */ const sorti = sortir(p); W.surEau = false;
    if (muet) return; if (sorti) { G.puff(x0, y0 - 20, Pa.COL, 14, 120, 4); R.invuln = Math.max(R.invuln || 0, 0.5); }
    G.puff(p.x, p.y - 20, '#ffffff', 16, 120, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 50, life: 0.35, col: Pa.COL }); G.text(p.x, p.y - 66, sorti ? 'Tu ressors à l\'air libre' : 'Tu redeviens solide', Pa.COL); CG.sfx('zap');
  };
  const cast0 = G.cast; G.cast = function (id) {
    if (id !== 'passe') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night) return; const cost = G.spellCost(id);
    if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; R.passe = R.passeMax = Pa.duree(); R.passeN = 0; R.passeFin = true; CG.sfx('zap');
    G.puff(p.x, p.y - 22, Pa.COL, 26, 160, 5); for (let i = 0; i < 2; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 50 + i * 36, life: 0.4 + i * 0.15, col: i ? '#ffffff' : Pa.COL }); G.text(p.x, p.y - 78, '👻 Passe-muraille : ' + R.passe + ' s', Pa.COL, true);
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !(R.passe > 0)) return; const p = S.player;
    if (R.ko > 0 || R.night) { Pa.fin(true); return; } if (R.cine) return;
    R.passe -= dt; if (R.passe <= 0) { Pa.fin(); return; }
    if (Math.random() < dt * (p.moving ? 16 : 6)) R.parts.push({ x: p.x + rand(-9, 9), y: p.y - rand(4, 34), vx: rand(-10, 10), vy: rand(-34, -12), life: 0.5, max: 0.5, col: Math.random() < 0.6 ? Pa.COL : '#ffffff', size: 3, float: true });
    if (R.passe <= Pa.ALERTE) { const s = Math.ceil(R.passe); if (s !== R.passeN) { R.passeN = s; CG.sfx('click'); G.text(p.x, p.y - 64, libre(p.x, p.y) ? String(s) : s + ' — sors de là !', libre(p.x, p.y) ? '#ffffff' : '#ffd08a', true); } }
  };
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!(R.passe > 0)) return; const p = CG.S.player, fin = R.passe <= Pa.ALERTE, a = fin ? 0.25 + 0.25 * (Math.sin(t * 16) > 0 ? 1 : 0) : 0.34 + Math.sin(t * 4) * 0.08;
    g.save(); g.globalAlpha = a; g.strokeStyle = Pa.COL; g.lineWidth = 2; g.setLineDash([6, 7]); g.lineDashOffset = -t * 22; g.beginPath(); g.ellipse(p.x, p.y + 2, 20, 8, 0, 0, TAU); g.stroke();
    g.setLineDash([]); g.globalAlpha = a * 0.45; g.fillStyle = Pa.COL; g.beginPath(); g.ellipse(p.x, p.y + 2, 15, 6, 0, 0, TAU); g.fill(); g.restore();
  };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'passe', ic: '👻', nom: () => CG.SPELLS.passe.nom, txt: 'Tu passes à travers tout : murs, arbres, rochers, eau, bâtiments. À la fin, si tu es dans un obstacle, tu ressors au sol libre le plus proche.', t: () => CG.R.passe > 0 ? CG.R.passe : 0 });
})(window.CG);
