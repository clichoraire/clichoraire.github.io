// Goblin Malin — le sommeil et la fatigue.
//   À minuit, le chef s'endort, toujours. Au village, il va se coucher comme tout le monde. Loin du village, il tombe de
//   sommeil là où il est et dort par terre : il se réveille au même endroit, fatigué d'un cran de plus (MAX crans au plus).
//   Un cran = PAS.vie de vie max, PAS.mana de mana max et PAS.vit de vitesse en moins.
//   La fatigue ne s'en va que d'une façon : passer la nuit suivante au village (dans sa hutte). Une nuit de plus dehors,
//   c'est un cran de plus.
//   Il n'y a plus de sieste. Tout est réglable dans CG.Fatigue.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI;
  const Fa = CG.Fatigue = { MAX: 5, PAS: { vit: 0.04, vie: 0.1, mana: 0.1 }, VILLAGE: 480 };
  if (CG.Mondes && CG.Mondes.GLOBAL) ['fatN', 'fatRetire', 'fatDehors'].forEach(k => { if (!CG.Mondes.GLOBAL.includes(k)) CG.Mondes.GLOBAL.push(k); });
  Fa.crans = function () { const S = CG.S; return S ? Math.max(0, Math.min(Fa.MAX, S.fatN || 0)) : 0; };
  Fa.auVillage = function () { const S = CG.S, Mo = CG.Mondes; if (!S) return true; if (Mo && Mo.feuIci && !Mo.feuIci()) return false; if (CG.Arene && CG.Arene.dans && CG.Arene.dans()) return false; const f = G.firePos(); return Math.hypot(S.player.x - f.x, S.player.y - f.y) < Fa.VILLAGE; };
  // la vie et le mana maximum : on retire, on rend, sans jamais toucher à ce que le chef a gagné pour de bon
  function appliquer() {
    const S = CG.S, p = S.player, n = Fa.crans(), r = S.fatRetire || (S.fatRetire = { hp: 0, mp: 0, n: 0 }); if (r.n === n) return;
    p.maxhp += r.hp; p.maxmp += r.mp; const hp = Math.round(p.maxhp * Fa.PAS.vie * n), mp = Math.round(p.maxmp * Fa.PAS.mana * n);
    p.maxhp = Math.max(1, p.maxhp - hp); p.maxmp = Math.max(0, p.maxmp - mp); S.fatRetire = { hp, mp, n };
    if (n < r.n) { p.hp = Math.min(p.maxhp, p.hp + (r.hp - hp)); p.mp = Math.min(p.maxmp, p.mp + (r.mp - mp)); } else { p.hp = Math.max(1, Math.min(p.hp, p.maxhp)); p.mp = Math.min(p.mp, p.maxmp); }
  }
  { const hm = G.heroMul; G.heroMul = function () { return hm.apply(this, arguments) * (1 - Fa.PAS.vit * Fa.crans()); }; }
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.push({ k: 'fatigue', ic: '🥱', mal: true, nom: 'Fatigué', txt: () => 'Tu as dormi par terre, loin du village : ' + Math.round(Fa.PAS.vie * Fa.crans() * 100) + ' % de vie et de mana en moins, et tu es plus lent. Ça ne passera qu\'en dormant une nuit au village, dans ta hutte.', t: () => (Fa.crans() > 0 ? true : 0), n: () => Fa.crans(), fin: () => 'jusqu\'à une nuit au village' });
  // ---------- la nuit : où le chef s'est endormi ----------
  { const sn0 = D.startNight; D.startNight = function (resume) { const S = CG.S; if (S && !resume) { const dehors = !Fa.auVillage(); S.fatDehors = dehors ? { x: S.player.x, y: S.player.y } : null; } return sn0.apply(this, arguments); }; }
  { const nd0 = D.nextDay; D.nextDay = function () {
    const S0 = CG.S, lieu = S0 && S0.fatDehors, r = nd0.apply(this, arguments), S = CG.S; if (!S || S !== S0) return r; const p = S.player; S.fatDehors = null; const r0 = S.fatRetire; if (r0 && r0.n) { p.maxhp += r0.hp; p.maxmp += r0.mp; S.fatRetire = { hp: 0, mp: 0, n: 0 }; } /* on repart du vrai maximum avant de recompter */
    if (lieu) { S.fatN = Math.min(Fa.MAX, (S.fatN || 0) + 1); p.x = lieu.x; p.y = lieu.y; if (G.unstick) G.unstick(p, 9); appliquer(); p.hp = p.maxhp; p.mp = p.maxmp;
      UI.toast('🥱 Tu as dormi par terre, loin du village : ' + Math.round(Fa.PAS.vie * Fa.crans() * 100) + ' % de vie et de mana en moins' + (Fa.crans() >= Fa.MAX ? ' (le pire)' : '') + '. Dors au village la nuit prochaine pour t\'en remettre.'); if (CG.R) G.text(p.x, p.y - 70, '🥱 Aïe, mon dos...', '#c8c0e0', true); }
    else { const avant = Fa.crans(); S.fatN = 0; appliquer(); p.hp = p.maxhp; p.mp = p.maxmp; if (avant > 0) UI.toast('😌 Une vraie nuit dans ta hutte : la fatigue est partie.'); }
    return r;
  }; }
  // 6 h du matin sans avoir dormi (une attaque qui a duré toute la nuit) : le jour se lève quand même
  Fa.matin = function () { const S = CG.S, R = CG.R; if (R.fadeDir || R.night || R.cine) return; S.fatDehors = Fa.auVillage() ? null : { x: S.player.x, y: S.player.y }; D.nextDay(); };
  { const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !CG.running) return; appliquer();
    if (R.night || R.cine || R.fadeDir || R.alarm || R.ko > 0 || R.death || (UI.modal && UI.modal.pauses)) return;
    if (S.hour >= 24 && R.fireLit) R.fireLit = false; // minuit : le feu s'éteint, le clan dort
    if (S.hour >= 24) { const p = S.player; if (UI.modal) UI.close(); /* minuit : le chef dort, où qu'il soit */
      if (!Fa.auVillage()) { G.text(p.x, p.y - 70, '💤 Tu tombes de sommeil...', '#c8c0e0', true); G.puff(p.x, p.y - 10, '#c8c0e0', 10, 70, 3); } D.startNight(); }
  }; }
})(window.CG);
