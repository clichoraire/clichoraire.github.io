// Goblin Malin — le chevalier squelette : un squelette en armure, avec une épée et un bouclier.
//   Il marche moins vite que les autres, mais il encaisse. Son bouclier pare les premiers coups (CLANG !), puis il casse.
//   Il apparaît à la place d'un squelette ordinaire, à partir du jour CG.ChevalierOs.JOUR.
'use strict';
(function (CG) {
  const G = CG.G, Art = CG.Art, Mt = CG.Morts, TAU = Math.PI * 2;
  const Ch = CG.ChevalierOs = { TYPE: 'squeletteChevalier', JOUR: 5, CHANCE: 0.16, PARE: 3 };
  CG.ENEMIES[Ch.TYPE] = { nom: 'Chevalier squelette', race: 'mort', hp: 86, dmg: 11, spd: 88, xp: 36, or: 15, cost: 6, r: 13 };
  if (Mt && Mt.RANGS && Mt.RANGS.squelette) Mt.RANGS.squelette.splice(1, 0, [Ch.TYPE, Ch.JOUR, Ch.CHANCE]);
  if (CG.Alchimie && CG.Alchimie.LACHE) CG.Alchimie.LACHE[Ch.TYPE] = 2;
  const sp0 = G.spawnEnemy; G.spawnEnemy = function () { const e = sp0.apply(this, arguments); if (e && e.type === Ch.TYPE) e.pare = Ch.PARE; return e; };
  // le bouclier : les premiers coups ne font presque rien
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg) {
    if (e && e.type === Ch.TYPE && e.pare > 0 && !e.dead && !(e.sleepT > 0) && !(e.para > 0)) {
      const a = Array.prototype.slice.call(arguments); a[1] = 0; e.pare--; e.pareT = 0.3; const vu = CG.onScreen(e.x, e.y);
      if (e.pare > 0) { G.text(e.x, e.y - 66, 'CLANG !', '#dfe6f2', true); G.puff(e.x + (e.face < 0 ? -12 : 12), e.y - 26, '#fff6c8', 5, 120, 2.5); }
      else { G.text(e.x, e.y - 66, 'Bouclier brisé !', '#ffe36b', true); G.puff(e.x, e.y - 26, '#9aa0ac', 14, 170, 4); G.puff(e.x, e.y - 26, '#7a1e22', 6, 120, 3); }
      if (vu) CG.sfx(e.pare > 0 ? 'chop' : 'tombe');
      return he0.apply(this, a); }
    return he0.apply(this, arguments);
  };
  const up0 = G.update; G.update = function (dt) { const R = CG.R; if (R && R.enemies) for (const e of R.enemies) if (e.pareT > 0) e.pareT -= dt; return up0.apply(this, arguments); };
  // ---------- dessin ----------
  const LOOK = { skin: '#ece6d6', tunic: '#565c6a', legs: '#8a8e98', sleeve: '#a4a8b4', s: 1.18, cape: '#7a1e22', armor: true, skull: true, weapon: 'epee' };
  const ae = Art.enemy; Art.enemy = function (g, e, t) {
    if (e.type !== Ch.TYPE) return ae.apply(this, arguments);
    const T0 = t + (e.seed || 0), f = e.face < 0 ? -1 : 1, s = LOOK.s, sec = e.pareT > 0 ? Math.sin(e.pareT * 60) * 2.5 : 0, x = e.x + sec;
    Art.humanoid(g, Object.assign({ x, y: e.y, face: e.face, t: T0, moving: e.moving, step: e.step, atk: e.atkAnim, angry: !e.calm }, LOOK));
    const bob = e.moving ? Math.abs(Math.sin(e.step * TAU)) * 1.5 : Math.sin(T0 * 2.4) * 0.6;
    g.save(); g.translate(x, e.y); g.scale(f * s, s);
    // un casque ouvert : on voit le crâne dessous
    const hy = -37 - bob; g.fillStyle = '#b4b8c4'; g.beginPath(); g.arc(0, hy - 1.5, 8.6, Math.PI, 0); g.lineTo(8.6, hy + 0.5); g.lineTo(-8.6, hy + 0.5); g.closePath(); g.fill();
    g.fillStyle = '#8a8e98'; g.fillRect(-9.4, hy - 1.2, 18.8, 2.2); g.fillRect(0.6, hy - 1, 2, 5.5); /* le bord, le nasal */
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-3, hy - 6.5, 2.6, 1.3, -0.5, 0, TAU); g.fill();
    g.fillStyle = '#7a1e22'; g.beginPath(); g.moveTo(-1, hy - 9.5); g.quadraticCurveTo(-4, hy - 19, -12, hy - 12 + Math.sin(T0 * 4) * 1.2); g.quadraticCurveTo(-5, hy - 12, -1.5, hy - 8.6); g.fill();
    // le bouclier, tenu devant lui
    if (e.pare > 0) { const bx = 7, by = -22 - bob + (e.pareT > 0 ? -2 : 0); g.translate(bx, by);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.moveTo(-7.5, -10); g.lineTo(8.5, -10); g.lineTo(8.5, 3); g.quadraticCurveTo(7, 11, 0.5, 14); g.quadraticCurveTo(-6, 11, -7.5, 3); g.closePath(); g.fill();
      g.fillStyle = '#9aa0ac'; g.beginPath(); g.moveTo(-8, -11); g.lineTo(8, -11); g.lineTo(8, 2); g.quadraticCurveTo(7, 10, 0, 13); g.quadraticCurveTo(-7, 10, -8, 2); g.closePath(); g.fill();
      g.fillStyle = '#7a1e22'; g.beginPath(); g.moveTo(-5.6, -8.6); g.lineTo(5.6, -8.6); g.lineTo(5.6, 1.6); g.quadraticCurveTo(4.8, 7.6, 0, 10); g.quadraticCurveTo(-4.8, 7.6, -5.6, 1.6); g.closePath(); g.fill();
      g.fillStyle = '#ece6d6'; g.beginPath(); g.arc(0, -1.6, 2.9, 0, TAU); g.fill(); g.fillRect(-1.7, 0.4, 3.4, 2.4); g.fillStyle = '#3a0c10'; g.fillRect(-1.7, -2.4, 1.2, 1.4); g.fillRect(0.5, -2.4, 1.2, 1.4); /* un petit crâne peint */
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-7, -10.2, 14, 1.2);
      for (let i = 0; i < Ch.PARE - e.pare; i++) { g.strokeStyle = '#2a1416'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-4 + i * 5, -8); g.lineTo(-2 + i * 4, -3); g.lineTo(-5 + i * 6, 3); g.stroke(); } }
    g.restore();
  };
})(window.CG);
