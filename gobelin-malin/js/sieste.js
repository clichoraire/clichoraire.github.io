// Clan Gobelin — la sieste : de jour, le chef peut entrer dans sa hutte et dormir un peu. On voit des « zzZ » au-dessus du toit,
// et il récupère 2 points de vie par demi-heure de jeu. C'est lent : la hutte du guérisseur soigne bien mieux, et c'est normal.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Si = CG.Sieste = { SOIN: 2 };
  Si.debut = function () {
    const S = CG.S, R = CG.R, p = S.player; if (!Si.PERMIS) { UI.toast('Tu pourras dormir ici à la tombée du soir (19 h).'); return; } /* plus de sieste : on ne dort que la nuit (remettre Si.PERMIS à true pour la ravoir) */ if (R.sieste || R.alarm || R.ko > 0 || R.cine || S.hour >= 19) return;
    const d = G.door(G.find('chief')); p.x = d.x; p.y = d.y + 10; p.path = null; p.moving = false; R.build = null; if (R.ruee) R.ruee = null;
    R.sieste = { demi: Math.floor(S.hour * 2), t: 0, gagne: 0, x: d.x, y: d.y }; CG.keys.clear(); G.puff(d.x, d.y - 18, '#d8e4ff', 12, 80, 3); CG.sfx('uiClose');
    UI.toast('😴 Tu fais la sieste : +' + Si.SOIN + ' ❤ par demi-heure. Appuie sur une touche pour ressortir.');
  };
  Si.fin = function (pourquoi) {
    const S = CG.S, R = CG.R, s = R.sieste; if (!s) return; R.sieste = null; const p = S.player; p.x = s.x; p.y = s.y + 10; G.unstick(p, 9); CG.keys.clear();
    G.puff(p.x, p.y - 18, '#d8e4ff', 10, 80, 3); if (pourquoi) UI.toast(pourquoi); else if (s.gagne) UI.toast('🥱 Tu ressors reposé : +' + s.gagne + ' ❤.');
  };
  const up0 = G.update; G.update = function (dt) {
    const R = CG.R, s = R && R.sieste; if (!s) return up0.apply(this, arguments);
    const S = CG.S, p = S.player, K = CG.keys; s.t += dt;
    const touche = s.t > 0.4 && K.size > 0 && ![...K].every(k => k === 'Shift' || k === 'Meta' || k === 'Control' || k === 'Alt'); K.clear(); // endormi : il ne bouge pas, ne frappe pas
    up0.apply(this, arguments);
    if (R.sieste !== s) return; p.x = s.x; p.y = s.y + 10; p.moving = false; R.invuln = Math.max(R.invuln || 0, 0.3);
    if (R.alarm) return Si.fin('⚔️ Le village est attaqué : tu bondis hors de ta hutte !');
    if (R.night || R.cine || R.ko > 0) { R.sieste = null; return; }
    if (S.hour >= 19) return Si.fin('🌇 Le soir tombe : tu te réveilles pour la fête.');
    const demi = Math.floor(S.hour * 2);
    if (demi !== s.demi) { s.demi = demi; if (p.hp < p.maxhp) { const n = Math.min(Si.SOIN, Math.ceil(p.maxhp - p.hp)); p.hp = Math.min(p.maxhp, p.hp + Si.SOIN); s.gagne += n; G.text(s.x, s.y - 96, '+' + n + ' ❤', '#8dff9a', true); } }
    if (touche) Si.fin();
  };
  // des zzZ qui montent au-dessus de la hutte
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const s = CG.R && CG.R.sieste; if (!s || !CG.onScreen(s.x, s.y)) return;
    g.save(); g.textAlign = 'center'; g.lineJoin = 'round';
    for (let i = 0; i < 3; i++) { const k = (t * 0.38 + i / 3) % 1, x = s.x + 16 + k * 30 + Math.sin(k * 6 + i) * 5, y = s.y - 70 - k * 70; g.globalAlpha = Math.sin(k * Math.PI); g.font = 'bold ' + Math.round(13 + k * 15) + 'px "Trebuchet MS", system-ui, sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(20,24,60,0.8)'; g.strokeText(k > 0.55 ? 'Z' : 'z', x, y); g.fillStyle = '#dfe6ff'; g.fillText(k > 0.55 ? 'Z' : 'z', x, y); }
    g.restore();
  };
  // pendant la sieste, la touche E sert à ressortir
  const fi0 = D.findInteract; D.findInteract = function () { const s = CG.R && CG.R.sieste; if (s) return { type: 'reveilSieste', obj: { x: s.x, y: s.y - 46 }, label: 'Sortir de ta hutte' }; return fi0.apply(this, arguments); };
  const in0 = D.interact; D.interact = function () { if (CG.R && CG.R.sieste) return Si.fin(); return in0.apply(this, arguments); };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'sieste', ic: '😴', nom: () => 'Sieste', txt: 'Tu dors dans ta hutte : +' + Si.SOIN + ' points de vie par demi-heure de jeu. La hutte du guérisseur soigne bien plus vite.', t: () => CG.R.sieste ? true : 0, fin: () => 'jusqu\'à ce que tu ressortes' });
})(window.CG);
