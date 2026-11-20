// Goblin Malin — déménager ensemble : on demande à un gobelin de nous suivre jusqu'à l'autre campement (l'autre monde).
// Il marche derrière le chef, se bat à ses côtés, traverse le portail avec lui, et s'installe en arrivant près du camp.
// S'il n'y a pas de hutte libre là-bas, il garde une bulle 🏚️ au-dessus de la tête jusqu'à ce qu'on lui en bâtisse une.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Mo = CG.Mondes, pick = CG.pick, dist = CG.dist; if (!Mo) return;
  const De = CG.Demenager = { PRES: 230, COMBAT: 300, BULLE: '🏚️' };
  const fem = g => g.sex === 'f';
  De.partir = function (g) {
    G.resetGoblin(g); g.ask = null; g.migre = null; g.demenage = { de: Mo.ici() }; g.repath = 0; g.emoteT = 1.2;
    G.say(g, pick(['Je te suis, chef ! Je prends mon baluchon.', 'On déménage ? D\'accord, je reste collé' + (fem(g) ? 'e' : '') + ' à toi.', 'Avec toi, chef, j\'irais au bout du monde. Enfin... de l\'autre monde.']), 4);
  };
  De.rester = function (g) { g.demenage = null; G.resetGoblin(g); G.say(g, pick(['Ah bon ? Je défais mon baluchon, alors.', 'D\'accord, chef. Je retourne à mon travail.']), 3.5); };
  const camp = () => { const S = CG.S, b = S.buildings.find(k => (k.type === 'fire' || k.type === 'chief') && !k.site); if (!b) return null; return Mo.ici() === 0 ? G.firePos() : { x: (b.tx + b.w / 2) * CG.TILE, y: (b.ty + b.h / 2) * CG.TILE }; };
  // une hutte où il reste de la place (la moins remplie), ou -1
  De.hutte = function (moi) {
    const S = CG.S, load = i => S.goblins.filter(g => g !== moi && g.home === i && !g.sansMaison).length, cap = G.hutCap();
    const l = S.buildings.map((b, i) => b.type === 'hut' && !b.site ? i : -1).filter(i => i >= 0 && load(i) < cap).sort((a, b) => load(a) - load(b)); return l.length ? l[0] : -1;
  };
  function installer(g) {
    const S = CG.S, h = De.hutte(g); g.demenage = null; G.resetGoblin(g); g.emoteT = 2;
    if (h >= 0) { g.home = h; g.sansMaison = false; G.say(g, pick(['C\'est donc ici, ma nouvelle maison !', 'Nous y voilà. Je vais poser mes affaires.', 'Joli coin, chef. Je m\'installe.']), 4); UI.toast('🏠 ' + g.name + ' s\'installe dans ' + Mo.NOMS[Mo.ici()] + '.'); }
    else { g.home = Math.max(0, S.buildings.findIndex(b => b.type === 'chief')); g.sansMaison = true; G.say(g, pick(['Nous y voilà... mais je dors où, moi, chef ?', 'Il n\'y a pas de hutte pour moi ici. Tu m\'en bâtis une ?']), 4.5); UI.toast(De.BULLE + ' ' + g.name + ' est arrivé' + (fem(g) ? 'e' : '') + ', mais n\'a pas de maison ici : bâtis une hutte (B).'); }
    G.puff(g.x, g.y - 20, '#ffe36b', 14, 100, 4); CG.sfx('ok');
  }
  De.step = function (g, dt) {
    const S = CG.S, R = CG.R, p = S.player, d = g.demenage; if (!d) return false;
    if (Mo.ici() < 2 && Mo.ici() !== d.de) { const c = camp(); if (c && dist(g, c) < De.PRES) { installer(g); return false; } }
    g.pose = null; g.hidden = false;
    let tgt = null, bd = De.COMBAT; for (const e of R.enemies) { if (e.dead || e.calm || e.struct) continue; const dd = dist(g, e); if (dd < bd && dist(e, p) < 420) { bd = dd; tgt = e; } }
    if (tgt) { g.bubble = null; G.guardFight(g, tgt, bd, dt); return true; }
    if (g.state === 'fight') { g.path = null; g.melee = false; } g.state = 'suit'; g.bubble = '🎒';
    const dp = dist(g, p); if (dp > 900) { g.x = p.x - 30; g.y = p.y + 14; g.path = null; G.unstick(g, 8); return true; }
    if (dp > 62) { g.repath = (g.repath || 0) - dt; if (!g.path || !g.path.length || g.repath <= 0) { const k = S.goblins.indexOf(g) % 3 - 1; if (!G.goTo(g, p.x - (p.face || 1) * 28, p.y + 12 + k * 14)) G.goTo(g, p.x, p.y); g.repath = 0.6; } G.follow(g, dp > 190 ? 200 : 140, dt); }
    else { g.moving = false; g.path = null; g.face = p.x > g.x ? 1 : -1; }
    return true;
  };
  // ceux qui n'ont pas de maison : la bulle, et dès qu'une hutte se libère ou se bâtit, ils la prennent
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S; if (!S) return; let cherche = false; tic -= dt; if (tic <= 0) { tic = 2; cherche = true; }
    for (const g of S.goblins) { if (!g.sansMaison) continue;
      if (cherche) { const h = De.hutte(g); if (h >= 0) { g.home = h; g.sansMaison = false; g.bubble = null; G.say(g, pick(['Une hutte pour moi ! Merci, chef !', 'Enfin un toit !']), 3.5); UI.toast('🏠 ' + g.name + ' a maintenant une maison.'); continue; } }
      if (!g.bubble && !g.hidden) g.bubble = De.BULLE; }
  };
  const no0 = G.nameOpt; G.nameOpt = function (o) {
    const base = no0.apply(this, arguments), S = CG.S; if (o.pet || !o.met || o.bebe || o.child || !S.chef2 || !S.ailleurs || Mo.ici() > 1) return base;
    const autre = Mo.NOMS[1 - Mo.ici()], il = fem(o) ? 'Elle' : 'Il';
    return base.concat(o.demenage ? [{ label: '🏠 Finalement, reste ici', sub: il + ' arrête de te suivre et retourne à son travail', fn: () => De.rester(o) }]
      : [{ label: '🎒 Suis-moi, on déménage dans ' + autre, sub: il + ' te suit et se bat à tes côtés jusqu\'à ton camp de l\'autre côté du portail', fn: () => De.partir(o) }]);
  };
})(window.CG);
