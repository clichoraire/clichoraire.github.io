// Goblin Malin — l'Étincelle grandit avec le sort. Niveau I : quelques petites étincelles qui crépitent, pas de boule.
// Niveau II : un cœur brillant avec de petits arcs. Niveau III : une vraie boule de foudre, avec ses éclairs. Et dans chaque niveau, elle grossit un peu avec les dégâts.
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2, Et = CG.Etincelle = {};
  const c0 = G.cast; G.cast = function (id) {
    const R = CG.R, n0 = R && R.shots ? R.shots.length : 0, r = c0.apply(this, arguments);
    if (id === 'etincelle' && CG.R && CG.R.shots) for (let i = n0; i < CG.R.shots.length; i++) { const s = CG.R.shots[i]; if (s.kind === 'bolt' && s.team === 'p') { s.etin = s.niv || 1; s.gr = Math.max(0, Math.min(1, (s.dmg - 9) / 60)); s.ph = Math.random() * 9; } }
    return r;
  };
  const eclat = (g, x, y, r, a) => { g.beginPath(); for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; g.moveTo(x, y); g.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } g.stroke(); };
  const arc = (g, x, y, a, l, t) => { g.beginPath(); g.moveTo(x, y); let px = x, py = y; for (let i = 1; i <= 3; i++) { const d = l * i / 3, j = Math.sin(t * 40 + i * 7 + a * 5) * l * 0.22; px = x + Math.cos(a) * d - Math.sin(a) * j; py = y + Math.sin(a) * d + Math.cos(a) * j; g.lineTo(px, py); } g.stroke(); };
  Et.dessin = function (g, s, t) {
    const n = s.etin, k = 1 + (s.gr || 0) * 0.8, ph = s.ph || 0, x = s.x, y = s.y, dir = Math.atan2(s.vy, s.vx); g.save(); g.lineCap = 'round';
    if (n === 1) { // de petites étincelles qui se suivent en crépitant
      for (let i = 0; i < 4; i++) { const q = i / 4, w = Math.sin(t * 31 + ph + i * 2.3), ex = x - Math.cos(dir) * q * 16 + Math.cos(dir + 1.57) * w * 4, ey = y - Math.sin(dir) * q * 16 + Math.sin(dir + 1.57) * w * 4, r = (3.4 - q * 1.6) * k * (0.7 + 0.3 * Math.sin(t * 47 + i));
        g.strokeStyle = i ? '#ffe36b' : '#fffbe0'; g.lineWidth = i ? 1.3 : 1.7; eclat(g, ex, ey, r, t * 9 + i); }
      g.fillStyle = 'rgba(255,240,150,0.28)'; g.beginPath(); g.arc(x, y, 5 * k, 0, TAU); g.fill();
    } else {
      const r = (n === 2 ? 4.2 : 7) * k, na = n === 2 ? 3 : 6;
      g.fillStyle = n === 2 ? 'rgba(255,235,120,0.25)' : 'rgba(170,220,255,0.25)'; g.beginPath(); g.arc(x, y, r * 2.4, 0, TAU); g.fill();
      g.strokeStyle = n === 2 ? '#ffe36b' : '#bfe8ff'; g.lineWidth = n === 2 ? 1.5 : 2; for (let i = 0; i < na; i++) arc(g, x, y, ph + i * TAU / na + t * (n === 2 ? 5 : 8), r * (n === 2 ? 2 : 2.6), t + i);
      g.fillStyle = n === 2 ? '#ffe36b' : '#9ad8ff'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(x, y, r * 0.55, 0, TAU); g.fill();
      if (n === 3) { g.strokeStyle = 'rgba(190,230,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(dir) * 22 * k, y - Math.sin(dir) * 22 * k); g.stroke(); }
    }
    g.restore();
  };
})(window.CG);
