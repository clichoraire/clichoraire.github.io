// Goblin Malin — le chevalier squelette : un squelette en armure, tête nue, avec une épée et un bouclier.
//   Il marche moins vite que les autres, mais il encaisse. Son bouclier pare les premiers coups (CLANG !), puis il casse : seuls les coups d'arme et les flèches l'entament, la magie glisse dessus.
//   Il apparaît à la place d'un squelette ordinaire, à partir du jour CG.ChevalierOs.JOUR.
'use strict';
(function (CG) {
  const G = CG.G, Art = CG.Art, Mt = CG.Morts, TAU = Math.PI * 2;
  const Ch = CG.ChevalierOs = { TYPE: 'squeletteChevalier', JOUR: 5, CHANCE: 0.16, PARE: 3, FLECHES: ['arrow', 'carreau'] };
  CG.ENEMIES[Ch.TYPE] = { nom: 'Chevalier squelette', race: 'mort', hp: 86, dmg: 11, spd: 88, xp: 36, or: 15, cost: 6, r: 13 };
  if (Mt && Mt.RANGS && Mt.RANGS.squelette) Mt.RANGS.squelette.splice(1, 0, [Ch.TYPE, Ch.JOUR, Ch.CHANCE]);
  if (CG.Alchimie && CG.Alchimie.LACHE) CG.Alchimie.LACHE[Ch.TYPE] = 2;
  const sp0 = G.spawnEnemy; G.spawnEnemy = function () { const e = sp0.apply(this, arguments); if (e && e.type === Ch.TYPE) e.pare = Ch.PARE; return e; };
  // ce qui entame un bouclier : un coup d'arme (le chef, un gobelin, un compagnon) ou une flèche. Pas la magie.
  let coupChef = 0; { const at0 = G.attack; G.attack = function () { coupChef++; try { return at0.apply(this, arguments); } finally { coupChef--; } }; }
  Ch.arme = function (src) { const S = CG.S, R = CG.R; if (R.tirK) return Ch.FLECHES.includes(R.tirK); if (!src) return false; if (src === S.player) return coupChef > 0; return S.goblins.includes(src) || S.pets.includes(src); };
  // le bouclier : les premiers coups ne font presque rien
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg) {
    if (e && e.type === Ch.TYPE && e.pare > 0 && !e.dead && !(e.sleepT > 0) && !(e.para > 0)) {
      const a = Array.prototype.slice.call(arguments); a[1] = 0; const vu = CG.onScreen(e.x, e.y);
      if (!Ch.arme(arguments[2])) { // un sort, du feu, du poison : ça glisse sur le bouclier sans l'entamer
        if (!(e.pareDit > CG.R.t)) { e.pareDit = CG.R.t + 1.4; e.pareT = 0.15; G.text(e.x, e.y - 66, '🛡️ La magie glisse dessus !', '#bfd4ff', true); G.puff(e.x + (e.face < 0 ? -12 : 12), e.y - 26, '#bfd4ff', 4, 90, 2.5); }
        return he0.apply(this, a); }
      e.pare--; e.pareT = 0.3;
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
    // pas de casque : on voit bien son crâne
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
