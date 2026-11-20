// Clan Gobelin — la Ruée (F) façon bottes de course : on piétine sur place, puis on fonce l'arme en avant. Et le compte à rebours de la veillée.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Ru = CG.Ruee = { ELAN: 0.7, DUREE: 0.85, VITESSE: 340, DEGATS: 1.6 };
  const MOVE = ['a', 'd', 'w', 's', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

  const pw0 = G.power; G.power = function (id) {
    if (id !== 'dash') return pw0.apply(this, arguments);
    const S = CG.S, R = CG.R, n = CG.TECH.find(t => t.power === 'dash');
    if (!n || !G.tech(n.id) || R.ko > 0 || R.cine || R.ruee) return;
    R.pcd = R.pcd || {}; if (R.pcd.dash > 0) { CG.sfx('no'); return; }
    R.pcd.dash = CG.POWERS.dash.cd; const l = Math.hypot(R.dir.x, R.dir.y) || 1;
    R.ruee = { ph: 'elan', t: Ru.ELAN, dir: { x: R.dir.x / l, y: R.dir.y / l }, hit: new Set(), pas: 0 }; CG.sfx('click');
  };
  function fin(choc) {
    const R = CG.R, p = CG.S.player, r = R.ruee; R.ruee = null; p.moving = false;
    if (choc) { G.puff(p.x + r.dir.x * 12, p.y - 12 + r.dir.y * 12, '#e8dcc0', 12, 120, 3.5); R.rings.push({ x: p.x + r.dir.x * 12, y: p.y - 8, r: 34, life: 0.3, col: '#fff3c4' }); CG.sfx('hit'); }
  }
  const up0 = G.update; G.update = function (dt) {
    const R = CG.R, r = R && R.ruee; if (!r) return up0.apply(this, arguments);
    const K = CG.keys, tenu = MOVE.filter(k => K.has(k)); tenu.forEach(k => K.delete(k)); // pendant la ruée, on ne dirige plus : tout droit
    try { up0.apply(this, arguments); } finally { tenu.forEach(k => K.add(k)); }
    const S = CG.S, p = S.player; if (R.ruee !== r) return;
    if (R.ko > 0 || R.cine || R.night || R.butin) { R.ruee = null; return; }
    R.dir = { x: r.dir.x, y: r.dir.y }; if (r.dir.x) p.face = r.dir.x > 0 ? 1 : -1; p.moving = true; r.t -= dt;
    if (r.ph === 'elan') { // on piétine sur place : les pieds s'emballent, la poussière vole derrière
      p.step += dt * 11; r.pas -= dt;
      if (r.pas <= 0) { r.pas = 0.07; R.parts.push({ x: p.x - r.dir.x * 10 + CG.rand(-5, 5), y: p.y - 1, vx: -r.dir.x * CG.rand(40, 90) + CG.rand(-14, 14), vy: -r.dir.y * CG.rand(40, 90) - CG.rand(8, 26), life: 0.4, max: 0.4, col: '#d8c8a0', size: 3.5, float: true }); }
      if (r.t <= 0) { r.ph = 'course'; r.t = Ru.DUREE; CG.sfx('swing'); }
      return;
    }
    R.invuln = Math.max(R.invuln || 0, 0.15); p.step += dt * 9;
    const x0 = p.x, y0 = p.y, v = Ru.VITESSE * dt; G.slide(p, r.dir.x * v, r.dir.y * v, 9);
    p.x = CG.clamp(p.x, 12, CG.MW * CG.TILE - 12); p.y = CG.clamp(p.y, 12, CG.MH * CG.TILE - 12);
    const fait = (p.x - x0) * r.dir.x + (p.y - y0) * r.dir.y;
    r.pas -= dt; if (r.pas <= 0) { r.pas = 0.03; R.parts.push({ x: p.x - r.dir.x * 6, y: p.y - 14, vx: 0, vy: 0, life: 0.3, max: 0.3, col: '#c8ffb0', size: 6, float: true }); R.parts.push({ x: p.x - r.dir.x * 10, y: p.y - 1, vx: CG.rand(-20, 20), vy: CG.rand(-30, -8), life: 0.35, max: 0.35, col: '#d8c8a0', size: 3, float: true }); }
    for (const e of R.enemies) if (!e.dead && !r.hit.has(e) && Math.hypot(e.x - (p.x + r.dir.x * 14), e.y - (p.y + r.dir.y * 14)) < 30 + e.r) { r.hit.add(e); G.hurtEnemy(e, G.playerDmg() * Ru.DEGATS, p); }
    if (fait < v * 0.35) return fin(true); // un mur, un arbre : on s'arrête net
    if (r.t <= 0) fin(false);
  };
  // l'arme pointée devant pendant la course : un éclat à la pointe et des traits de vitesse
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (c, t) {
    mk0.apply(this, arguments); const R = CG.R, r = R && R.ruee; if (!r || r.ph !== 'course') return; const p = CG.S.player, nx = -r.dir.y, ny = r.dir.x;
    c.save(); c.lineCap = 'round';
    for (let i = -1; i <= 1; i++) { const L = 26 + ((t * 9 + i * 1.7) % 1) * 22, ox = p.x + nx * i * 9 - r.dir.x * 14, oy = p.y - 18 + ny * i * 9 - r.dir.y * 14; c.strokeStyle = 'rgba(255,255,255,' + (0.5 - Math.abs(i) * 0.15) + ')'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox - r.dir.x * L, oy - r.dir.y * L); c.stroke(); }
    const tx = p.x + r.dir.x * 30, ty = p.y - 20 + r.dir.y * 26, pu = 3 + Math.sin(t * 40) * 1.2;
    c.fillStyle = 'rgba(255,255,220,0.9)'; c.beginPath(); c.moveTo(tx + r.dir.x * pu * 2.4, ty + r.dir.y * pu * 2.4); c.lineTo(tx + nx * pu, ty + ny * pu); c.lineTo(tx - r.dir.x * pu, ty - r.dir.y * pu); c.lineTo(tx - nx * pu, ty - ny * pu); c.closePath(); c.fill();
    c.restore();
  };
  CG.POWERS.dash.nom = 'Ruée';
  { const n = CG.TECH.find(t => t.power === 'dash'); if (n) n.desc = 'Nouveau pouvoir (touche F) : tu piétines un instant sur place, puis tu fonces droit devant, l\'arme pointée, en blessant tout sur ton passage. Un mur t\'arrête net.'; }

  // ---------- la veillée : de 20 h à minuit, on voit le temps filer avant d'aller dormir ----------
  let el = null, vu = '';
  const rf0 = UI.refresh; UI.refresh = function () {
    rf0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return;
    if (!el) { const top = document.getElementById('top'); if (!top) return; el = document.createElement('div'); el.id = 'veillee'; el.hidden = true; top.insertBefore(el, document.getElementById('res'));
      const css = document.createElement('style'); css.textContent = '#veillee{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:14px;color:#ffe9c0;padding:0 12px;border-left:1px solid rgba(255,220,150,.3);border-right:1px solid rgba(255,220,150,.3)}#veillee[hidden]{display:none}#veillee .b{position:relative;width:104px;height:10px;border-radius:6px;background:rgba(0,0,0,.5);box-shadow:inset 0 0 0 1px rgba(255,200,120,.35)}#veillee .b i{position:absolute;left:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,#ffb03a,#ff6a2a 60%,#8a5ad0)}#veillee .b u{position:absolute;top:-3px;bottom:-3px;width:2px;background:rgba(255,255,255,.45)}#veillee .b s{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;text-decoration:none;font-size:14px;line-height:16px;text-align:center}#veillee b{color:#ffe36b;min-width:34px}#veillee.fin b{color:#ff9a8a}'; document.head.appendChild(css); }
    const on = S.hour >= 20 && R.fireLit && !R.night && !R.death;
    if (!on) { if (!el.hidden) { el.hidden = true; vu = ''; } return; }
    const k = CG.clamp((S.hour - 20) / 4, 0, 1), sec = Math.max(0, Math.ceil((24 - S.hour) * CG.D.HOUR)), cle = Math.round(k * 104) + '|' + sec + '|' + !!R.alarm; if (cle === vu && !el.hidden) return; vu = cle; el.hidden = false;
    el.className = sec <= 20 && !R.alarm ? 'fin' : '';
    el.title = 'La veillée : à minuit, tout le monde va dormir'; el.innerHTML = '<span>🔥</span><div class="b"><i style="width:' + (k * 100).toFixed(1) + '%"></i><u style="left:25%"></u><u style="left:50%"></u><u style="left:75%"></u><s style="left:' + (k * 100).toFixed(1) + '%">🌙</s></div><span>💤</span><b>' + (R.alarm ? '⚔' : '' + Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60) + '</b>';
  };
})(window.CG);
