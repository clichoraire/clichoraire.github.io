// Goblin Malin — le coffre vorace. De temps en temps, un coffre n'en est pas un : quand le chef veut l'ouvrir, le couvercle se
// soulève tout seul sur une rangée de dents pointues, deux yeux s'allument, et il se met à sauter après lui comme une gelée.
// Rien ne le distingue d'un vrai coffre avant. Une fois battu, il retombe en coffre ouvert et rend ce qu'il gardait.
// Tout est réglable dans CG.Mimic.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Art = CG.Art, TAU = Math.PI * 2;
  const Mi = CG.Mimic = { CHANCE: 0.12, JOUR: 2, RYTHME: 1.5, SOL: 0.42, SAUT: 15, SANS: { piege: 1, savoir: 1 } }; /* CHANCE : part des coffres qui mordent ; RYTHME : sauts par seconde ; SOL : part du temps posé par terre ; SANS : sortes de coffres jamais voraces */
  CG.ENEMIES.mimic = { nom: 'Coffre vorace', race: 'bete', hp: 34, dmg: 6, spd: 135, xp: 14, or: 0, cost: 3, r: 13 };
  const phase = e => ((CG.R.t || 0) * Mi.RYTHME + (e.seed || 0)) % 1;
  Mi.est = function (c) { const S = CG.S; if (c.mimic === undefined) c.mimic = S.day >= Mi.JOUR && !Mi.SANS[c.kind] && !c.vu && Math.random() < Mi.CHANCE; return !!c.mimic; };
  function reveiller(c) {
    const R = CG.R, i = R.chests.indexOf(c); if (i >= 0) R.chests.splice(i, 1);
    const e = G.spawnEnemy('mimic', c.x, c.y, { wild: true, exact: true }); if (!e) { c.mimic = false; R.chests.push(c); return D.openChest(c); }
    e.coffre = c; e.calm = false; e.aggroR = 420; e.leash = 900; e.atkAnim = 1; e.atkCd = 0.5; e.target = CG.S.player; e.seed = 1 - ((R.t || 0) * Mi.RYTHME) % 1; /* il part d'un bond, tout de suite */
    G.puff(c.x, c.y - 10, '#e8d0a0', 14, 110, 3); G.text(c.x, c.y - 44, '!!', '#ff6a5a', true); CG.sfx('warning');
    return e;
  }
  Mi.reveiller = reveiller;
  function rendre(e) { const R = CG.R, c = e.coffre; e.rendu = true; if (!c) return; c.mimic = false; c.x = e.x; c.y = e.y + 4; if (!R.chests.includes(c)) R.chests.push(c); D.openChest(c); }
  // chargé en dernier : c'est lui qui décide d'abord si le coffre s'ouvre ou s'il mord
  const oc0 = D.openChest; D.openChest = function (c) { if (c && typeof c === 'object' && !c.open && Mi.est(c)) return reveiller(c); return oc0.apply(this, arguments); };
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e) { const r = he0.apply(this, arguments); if (e && e.type === 'mimic' && e.dead && !e.rendu) rendre(e); return r; };
  const up0 = G.update; G.update = function (dt) {
    const R = CG.R; if (R && R.enemies) for (const e of R.enemies) { if (e.type !== 'mimic') continue; if (e.dead) { if (!e.rendu) rendre(e); continue; } if (phase(e) < Mi.SOL) e.rooted = Math.max(e.rooted || 0, 0.04); } // posé par terre entre deux bonds
    return up0.apply(this, arguments);
  };
  // ---------- le dessin : le même coffre, coupé en deux, avec une gueule entre les deux moitiés ----------
  function dessin(g, e, t) {
    const x = e.x, y = e.y, c = e.coffre || {}, ph = phase(e), air = ph >= Mi.SOL && !(e.para > 0 || e.sleepT > 0), k = air ? (ph - Mi.SOL) / (1 - Mi.SOL) : 0, saut = air ? Math.sin(k * Math.PI) * Mi.SAUT : 0;
    const ecrase = air ? -0.1 * Math.sin(k * Math.PI) : Math.max(0, 1 - ph / 0.14) * 0.2, mord = Math.max(0, Math.min(1, e.atkAnim || 0)), gap = 4.5 + Math.abs(Math.sin(t * 5 + (e.seed || 0))) * 2.5 + mord * 8 + (air ? 3 : 0), face = e.face < 0 ? -1 : 1;
    Art.shadow(g, x, y + 8, 16 * (1 - saut / 45));
    g.save(); g.translate(x, y + 8 - saut); g.scale(1 + ecrase, 1 - ecrase); g.translate(-x, -(y + 8));
    g.save(); g.beginPath(); g.rect(x - 19, y - 8.4, 38, 17.4); g.clip(); Art.chest(g, x, y, false, c.kind); g.restore(); // la caisse
    g.fillStyle = '#35070f'; g.fillRect(x - 13.5, y - 8.5 - gap, 27, gap + 1.5); g.fillStyle = '#5a0f1c'; g.fillRect(x - 13.5, y - 8.5 - gap, 27, Math.min(gap, 3)); // la gueule
    g.fillStyle = '#e8566e'; g.beginPath(); g.ellipse(x + face * 3, y - 8, 6.5, 2.6 + mord * 1.5, 0, Math.PI, 0); g.fill(); g.fillStyle = '#c23a54'; g.fillRect(x + face * 3 - 0.5, y - 10.2 - mord, 1, 2.2 + mord); // la langue
    const dent = (dx, bas, h) => { g.beginPath(); g.moveTo(x + dx - 2.3, bas); g.lineTo(x + dx, bas + h); g.lineTo(x + dx + 2.3, bas); g.closePath(); g.fill(); };
    g.fillStyle = '#fffdf2'; for (let i = 0; i < 5; i++) dent(-10.4 + i * 5.2, y - 8, -(4 + (i % 2) * 1.6)); // les dents du bas
    g.save(); g.translate(x, y - 8); g.rotate(-face * 0.05 * (1 + mord)); g.translate(-x, -(y - 8) - gap);
    g.save(); g.beginPath(); g.rect(x - 19, y - 24, 38, 16.2); g.clip(); Art.chest(g, x, y, false, c.kind); g.restore(); // le couvercle
    g.fillStyle = '#fffdf2'; for (let i = 0; i < 6; i++) dent(-11.5 + i * 4.6, y - 7.8, 4.2 + ((i + 1) % 2) * 1.8); // les dents du haut
    [-6.5, 6.5].forEach(dx => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x + dx, y - 12.2, 3.5, 3.3, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(x + dx + face * 0.9, y - 12, 2.1, 0, TAU); g.fill(); g.fillStyle = '#1a0a08'; g.beginPath(); g.ellipse(x + dx + face * 1.2, y - 12, 0.9, 1.9, 0, 0, TAU); g.fill(); });
    g.strokeStyle = '#3a2010'; g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 10.5, y - 16.6); g.lineTo(x - 3.2, y - 14.4); g.moveTo(x + 10.5, y - 16.6); g.lineTo(x + 3.2, y - 14.4); g.stroke(); // des sourcils méchants
    g.restore(); g.restore();
  }
  const en0 = Art.enemy; Art.enemy = function (g, e, t) { if (e.type === 'mimic') return dessin(g, e, t); return en0.apply(this, arguments); };
})(window.CG);
