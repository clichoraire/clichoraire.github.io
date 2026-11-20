// Goblin Malin — la cloche d'alarme : pendant une attaque, le chef la sonne (E) et tout le clan prend les armes jusqu'à ce que le village soit sauf.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Art = CG.Art, T = CG.TILE, Cl = CG.Cloche = {};
  CG.BUILDS.cloche = { nom: 'Cloche d\'alarme', icon: '🔔', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 10, minerai: 8 }, tech: 'd23', desc: 'Pendant une attaque, va la sonner (E) : tous tes gobelins sortent se battre, jusqu\'à ce que le village soit sauf.' };
  Art.extra.cloche = { w: 56, h: 84, draw(c) {
    const f = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(28, 76, 24, 6, 0, 0, 6.3); c.fill();
    f(6, 14, 6, 62, '#7a5630'); f(44, 14, 6, 62, '#6a4826'); f(2, 10, 52, 7, '#8f6636'); f(2, 10, 52, 2, '#a8804a'); f(4, 72, 10, 5, '#5a3d22'); f(42, 72, 10, 5, '#5a3d22');
  } };
  // la cloche elle-même se balance quand on la sonne
  const de = Art.drawExtra;
  Art.drawExtra = function (g, b, t) {
    de.apply(this, arguments); if (b.type !== 'cloche') return;
    const x = (b.tx + 0.5) * T, y = (b.ty + 1) * T - 60, sw = b.ringT > 0 ? Math.sin(t * 16) * 0.5 * Math.min(1, b.ringT) : Math.sin((t || 0) * 1.2) * 0.03;
    g.save(); g.translate(x, y); g.rotate(sw); g.fillStyle = '#5a3d22'; g.fillRect(-2, 0, 4, 8);
    g.fillStyle = '#d8a52e'; g.beginPath(); g.moveTo(-6, 8); g.quadraticCurveTo(-8, 26, -15, 33); g.lineTo(15, 33); g.quadraticCurveTo(8, 26, 6, 8); g.closePath(); g.fill();
    g.fillStyle = '#f4d060'; g.beginPath(); g.moveTo(-4, 10); g.quadraticCurveTo(-6, 24, -11, 31); g.lineTo(-5, 31); g.quadraticCurveTo(-2, 22, -1, 10); g.closePath(); g.fill();
    g.fillStyle = '#a8781c'; g.fillRect(-16, 32, 32, 4); g.fillStyle = '#6a4a14'; g.beginPath(); g.arc(-sw * 14, 39, 3.6, 0, 6.3); g.fill(); g.restore();
    if (b.ringT > 0) for (let i = 0; i < 2; i++) { const k = ((t * 1.6 + i * 0.5) % 1); g.strokeStyle = 'rgba(255,227,107,' + (0.8 * (1 - k) * Math.min(1, b.ringT)) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(x, y + 24, 20 + k * 46, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(x, y + 24, 20 + k * 46, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); }
  };
  const near = () => { const S = CG.S, p = S.player; for (const b of S.buildings) if (b.type === 'cloche' && !b.site && Math.hypot((b.tx + 0.5) * T - p.x, (b.ty + 0.5) * T - p.y) < 66) return b; return null; };
  Cl.ring = function (b) {
    const S = CG.S, R = CG.R; b.ringT = 4; CG.sfx('bell');
    if (!R.alarm) { CG.UI.toast('🔔 La cloche sonne... mais tout est calme. Garde-la pour une attaque.'); return; }
    if (R.armes) return;
    R.armes = true; let n = 0;
    S.goblins.forEach(g => { if (g.job === 'garde' || g.child || !G.militia(g)) return; n++; if (g.hidden) { g.hidden = false; G.unstick(g, 8); } if (g.state === 'flee') g.state = 'idle'; g.path = null; g.emoteT = 2; });
    const x = (b.tx + 0.5) * T, y = (b.ty + 0.5) * T; for (let i = 0; i < 3; i++) R.rings.push({ x, y, r: 120 + i * 90, life: 0.6 + i * 0.15, col: '#ffe36b' });
    G.banner('Aux armes !', n ? n + ' gobelin' + (n > 1 ? 's sortent' : ' sort') + ' défendre le village.' : 'Tout le monde se bat déjà.', '#ffe36b');
  };
  // tant que la cloche a sonné et que l'attaque dure, tout le monde (sauf les enfants) se bat comme un garde
  const mi = G.militia; G.militia = g => (!!CG.R.armes && !!CG.R.alarm && g.job !== 'garde' && !g.child && g.koNight !== CG.S.day && g.ko !== true) || mi(g);
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S) return;
    if (R.armes && !R.alarm) { R.armes = false; CG.UI.toast('🔔 Le village est sauf : chacun retourne à son ouvrage.'); }
    for (const b of S.buildings) if (b.ringT > 0) b.ringT -= dt;
  };
  const find0 = D.findInteract;
  D.findInteract = function () {
    const R = CG.R; if (!(R.ko > 0) && !R.cine && !R.build) { const b = near(); if (b && R.alarm && !R.armes) return { type: 'cloche', obj: b, label: '🔔 Sonner la cloche : aux armes !' }; const it = find0.apply(this, arguments); if (it) return it; if (b) return { type: 'cloche', obj: b, label: R.armes ? '🔔 La cloche a sonné : tout le clan se bat' : '🔔 Sonner la cloche' }; return it; }
    return find0.apply(this, arguments);
  };
  const inter0 = D.interact;
  D.interact = function () { const it = D.findInteract(); if (it && it.type === 'cloche') return Cl.ring(it.obj); return inter0.apply(this, arguments); };
})(window.CG);
