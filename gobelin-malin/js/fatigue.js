// Goblin Malin — la nuit blanche et la fatigue.
//   À minuit, tout le clan va se coucher, mais plus le chef : il peut rester debout jusqu'à 6 h, et le jour suivant commence
//   sans qu'il ait dormi. Seulement, ça se paie. Après EVEIL heures sans dormir, il est fatigué (visible en haut à gauche) :
//   chaque heure de plus ajoute un cran, jusqu'à MAX crans. Un cran = PAS.vit de vitesse, PAS.vie de vie max et PAS.mana de mana max en moins.
//   Tout revient dès qu'il dort une vraie nuit.
//   La sieste (E à la porte de sa hutte, de jour, une fois par jour) : SIESTE.heures heures passent d'un coup, la fatigue redescend à
//   SIESTE.cran crans et n'en bouge plus jusqu'à minuit. Après minuit, elle remonte. Et une deuxième nuit blanche de suite est
//   impossible : à 6 h, le chef s'écroule et dort jusqu'à REVEIL heures (la matinée est perdue).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI;
  const Fa = CG.Fatigue = { EVEIL: 18, MAX: 5, PAS: { vit: 0.04, vie: 0.1, mana: 0.1 }, SIESTE: { heures: 3, cran: 2, de: 6, a: 18 }, REVEIL: 12 };
  if (CG.Mondes && CG.Mondes.GLOBAL) ['eveil', 'fatRetire', 'siesteJour', 'nuitsBlanches', 'fatFige'].forEach(k => { if (!CG.Mondes.GLOBAL.includes(k)) CG.Mondes.GLOBAL.push(k); });
  Fa.crans = function () { const S = CG.S; if (!S) return 0; const e = S.eveil || 0; return e < Fa.EVEIL ? 0 : Math.min(Fa.MAX, 1 + Math.floor(e - Fa.EVEIL)); };
  // la vie et le mana maximum : on retire, on rend, sans jamais toucher à ce que le chef a gagné pour de bon
  function appliquer() {
    const S = CG.S, p = S.player, n = Fa.crans(), r = S.fatRetire || (S.fatRetire = { hp: 0, mp: 0, n: 0 }); if (r.n === n) return;
    p.maxhp += r.hp; p.maxmp += r.mp; const hp = Math.round(p.maxhp * Fa.PAS.vie * n), mp = Math.round(p.maxmp * Fa.PAS.mana * n);
    p.maxhp = Math.max(1, p.maxhp - hp); p.maxmp = Math.max(0, p.maxmp - mp); S.fatRetire = { hp, mp, n };
    if (n < r.n) { p.hp = Math.min(p.maxhp, p.hp + (r.hp - hp)); p.mp = Math.min(p.maxmp, p.mp + (r.mp - mp)); } else { p.hp = Math.max(1, Math.min(p.hp, p.maxhp)); p.mp = Math.min(p.mp, p.maxmp); if (CG.R && n > r.n) { G.text(p.x, p.y - 70, n === 1 ? '🥱 Tu es fatigué...' : '🥱 De plus en plus fatigué...', '#c8c0e0', true); CG.sfx('no'); } }
  }
  { const hm = G.heroMul; G.heroMul = function () { return hm.apply(this, arguments) * (1 - Fa.PAS.vit * Fa.crans()); }; }
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.push({ k: 'fatigue', ic: '🥱', mal: true, nom: 'Fatigué', txt: 'Tu n\'as pas dormi : tu es plus lent, avec moins de vie et de mana. Chaque heure de sommeil enlève un cran (10 %) : une vraie nuit efface tout, une sieste en enlève trois.', t: () => (Fa.crans() > 0 ? true : 0), n: () => Fa.crans() });
  // ---------- les heures : minuit ne force plus à dormir ----------
  let dormi = false;
  let couche = 0; /* l'heure où le chef s'est couché : chaque heure dormie enlève Fa.DODO cran(s) de fatigue (un cran = 10 % de vie et de mana) */
  Fa.DODO = 1;
  Fa.repos = function (heures) { const S = CG.S, n = Fa.crans(), reste = Math.max(0, n - Math.floor(heures * Fa.DODO + 1e-6)); S.eveil = reste > 0 ? Fa.EVEIL + reste - 0.5 : 0; S.fatFige = reste > 0; /* ce qui reste ne bouge plus jusqu'à minuit */ appliquer(); return reste; };
  { const sn0 = D.startNight; D.startNight = function () { dormi = true; couche = CG.S ? CG.S.hour : 0; return sn0.apply(this, arguments); }; }
  { const nd0 = D.nextDay; D.nextDay = function () {
    const S = CG.S, p = S.player, aDormi = dormi; dormi = false; const hp0 = p.hp, mp0 = p.mp, croule = !!S.fatCroule; S.fatCroule = false;
    const r = nd0.apply(this, arguments);
    if (aDormi) { const h = croule ? 99 : ((6 - couche) % 24 + 24) % 24 || 24, avant = Fa.crans(); S.nuitsBlanches = 0; S.fatFige = false; const reste = Fa.repos(h); if (reste > 0 && !croule) UI.toast('🥱 Tu n\'as dormi que ' + Math.round(h) + ' h : ' + (avant - reste) + ' cran' + (avant - reste > 1 ? 's' : '') + ' de fatigue en moins, il t\'en reste ' + reste + '. Couche-toi plus tôt ce soir.'); if (croule) { S.hour = Fa.REVEIL; (CG.R.schedule || []).forEach(e => { if (e.h <= S.hour) e.done = true; }); UI.toast('🥱 Tu t\'es écroulé de fatigue : tu as dormi jusqu\'à midi.'); } }
    else { S.nuitsBlanches = (S.nuitsBlanches || 0) + 1; S.fatFige = false; p.hp = Math.min(p.maxhp, hp0); p.mp = Math.min(p.maxmp, mp0); UI.toast('🌅 Le jour se lève, et tu n\'as pas fermé l\'œil.'); } // pas de sommeil : pas de vie rendue
    return r;
  }; }
  // la fin de la nuit : à 6 h (30 h au compteur), le jour suivant commence. Une deuxième nuit blanche de suite : le chef s'écroule.
  Fa.matin = function () { const S = CG.S, R = CG.R; if (R.fadeDir || R.night || R.alarm || R.cine) return; if ((S.nuitsBlanches || 0) >= 1) { S.fatCroule = true; G.text(S.player.x, S.player.y - 70, '💤 Tu t\'écroules de fatigue...', '#c8c0e0', true); D.startNight(); } else D.nextDay(); };
  { const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !CG.running || R.night || R.cine || UI.modal && UI.modal.pauses) return;
    if (!(S.fatFige && S.hour < 24) && !(CG.Mondes && CG.Mondes.ici() === 2)) S.eveil = (S.eveil || 0) + dt / D.HOUR; // après une sieste, la fatigue ne bouge plus jusqu'à minuit
    if (S.hour >= 24 && R.fireLit) R.fireLit = false; // minuit : le feu s'éteint, le clan dort
    appliquer();
  }; }
  // ---------- la sieste ----------
  Fa.peutSieste = function () { const S = CG.S, R = CG.R; return Fa.crans() > 0 && S.siesteJour !== S.day && S.hour >= Fa.SIESTE.de && S.hour < Fa.SIESTE.a && !R.alarm && !R.cine && !R.event; };
  Fa.sieste = function () {
    const S = CG.S, R = CG.R, p = S.player; if (!Fa.peutSieste()) return; S.siesteJour = S.day; S.hour = Math.min(18.9, S.hour + Fa.SIESTE.heures); const resteS = Fa.repos(Fa.SIESTE.heures); S.fatFige = true;
    R.fade = 1; R.fadeDir = -1; CG.sfx('heal'); G.text(p.x, p.y - 70, '😴 Une bonne sieste...', '#c8c0e0', true); UI.toast(resteS > 0 ? '😴 ' + Fa.SIESTE.heures + ' heures ont passé. Il te reste ' + resteS + ' cran' + (resteS > 1 ? 's' : '') + ' de fatigue : il te faudra une vraie nuit.' : '😴 ' + Fa.SIESTE.heures + ' heures ont passé. Tu es en pleine forme !');
  };
  { const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments), R = CG.R; if (it && it.type !== 'home' && it.type !== 'hut') return it; if (!R || R.ko > 0 || R.build || !Fa.peutSieste()) return it; const b = G.find('chief'); if (!b) return it; const d = G.door(b), p = CG.S.player; return Math.hypot(d.x - p.x, d.y - p.y) < 58 ? { type: 'sieste', label: 'Faire une sieste 😴 (' + Fa.SIESTE.heures + ' heures passent)' } : it; };
    const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'sieste') return Fa.sieste(); return in0.apply(this, arguments); }; }
})(window.CG);
