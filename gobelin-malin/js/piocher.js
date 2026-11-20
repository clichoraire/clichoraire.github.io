// Clan Gobelin — le chef peut piocher un gisement lui-même, comme il cueille un buisson : on reste à côté sans bouger, le filon donne son minerai et disparaît jusqu'au lendemain.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, rand = CG.rand;
  D.ORE_GAIN = 5; D.ORE_TIME = 3.2;
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments); if (it) return it; const R = CG.R, p = CG.S.player; if (R.ko > 0 || R.cine || R.build) return it;
    let best = null, bd = 50; for (const n of W.nodes) { if (n.type !== 'ore' || n.gone) continue; const d = Math.hypot(n.x * T + T / 2 - p.x, n.y * T + T / 2 - p.y); if (d < bd) { bd = d; best = n; } }
    return best ? { type: 'ore', obj: best, label: R.picking && R.picking.n === best ? 'Tu pioches... (ne bouge pas)' : 'Piocher le gisement (+' + D.ORE_GAIN + ' ' + CG.RES.minerai.icon + ')' } : it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'ore') return in0.apply(this, arguments);
    const R = CG.R, p = CG.S.player; if (!R.picking) { R.picking = { n: it.obj, t: 0, max: D.ORE_TIME, px: p.x, py: p.y }; CG.sfx('chop'); }
  };
  const ps0 = G.pickStep; G.pickStep = function (dt) {
    const S = CG.S, R = CG.R, k = R.picking; if (!k || k.n.type !== 'ore') return ps0.apply(this, arguments);
    const p = S.player, x = k.n.x * T + T / 2, y = k.n.y * T + T / 2;
    if (k.n.gone || R.ko > 0 || Math.hypot(p.x - k.px, p.y - k.py) > 5 || CG.UI.modal) { R.picking = null; return; }
    const coup = Math.floor(k.t * 2.4); k.t += dt; p.face = x > p.x ? 1 : -1; R.chefPose = { k: 'mine', fin: R.t + 0.15 }; /* une pioche en main, pas son bâton */
    if (Math.floor(k.t * 2.4) !== coup) { CG.sfx('chop'); G.puff(x + rand(-8, 8), y - 12 - rand(0, 8), '#9aa0a8', 5, 90, 3); G.puff(x, y - 14, '#e8f0ff', 2, 70, 2); } // un coup de pioche : des éclats
    if (k.t < k.max) return;
    R.picking = null; k.n.gone = true; G.gain('minerai', D.ORE_GAIN, x, y - 30); G.puff(x, y - 10, '#8a8f98', 18, 130, 5); G.puff(x, y - 14, '#dfe6f2', 8, 100, 3); CG.sfx('coin');
    S.goblins.forEach(g => { if (g.node === k.n) G.resetGoblin(g); }); // un mineur qui visait ce filon en cherche un autre
  };
})(window.CG);

// ---------- le butin par terre ne reste pas éternellement : 30 secondes, puis il disparaît (il clignote sur la fin) ----------
(function (CG) {
  const G = CG.G, Art = CG.Art; CG.BUTIN_DUREE = 30; CG.BUTIN_ALERTE = 6;
  // on note d'où vient chaque objet tombé par terre : pendant qu'un monstre meurt, tout ce qui tombe est « à lui »
  { let enMort = 0; const he0 = G.hurtEnemy; G.hurtEnemy = function () { enMort++; try { return he0.apply(this, arguments); } finally { enMort--; } };
    const dp0 = G.drop; G.drop = function () { const R = CG.R, n = R.drops ? R.drops.length : 0, r = dp0.apply(this, arguments); if (enMort > 0 && R.drops) for (let i = n; i < R.drops.length; i++) R.drops[i].monstre = true; return r; }; }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !R.drops || !R.drops.length) return; let parti = false;
    for (const d of R.drops) { if (d.gone || d.f < 1 || !d.monstre) continue; /* seul le butin tombé d'un monstre finit par disparaître : ce qui était posé là (trésor d'un donjon, objet trouvé) reste */ d.age = (d.age || 0) + dt; if (d.age >= CG.BUTIN_DUREE) { d.gone = true; parti = true; if (CG.onScreen(d.x, d.y)) G.puff(d.x, d.y - 8, '#cfcfcf', 6, 60, 2.5); } }
    if (parti) R.drops = R.drops.filter(d => !d.gone);
  };
  const dr0 = Art.drops; Art.drops = function (g, list, t) { // de plus en plus vite à mesure que la fin approche
    return dr0.call(this, g, list.filter(d => { const r = CG.BUTIN_DUREE - (d.age || 0); return r > CG.BUTIN_ALERTE || Math.sin(t * (r < 2.5 ? 26 : 13)) > -0.2; }), t);
  };
})(window.CG);

// ---------- le totem de guerre : +20 % de dégâts aux gobelins qui se battent dans son rayon. Plusieurs totems ne s'additionnent pas. ----------
(function (CG) {
  const T = CG.TILE; CG.TOTEM_RAYON = 7 * T;
  const totems = () => CG.S.buildings.filter(b => b.type === 'totem' && !b.site);
  CG.totemPres = o => { for (const b of totems()) if (Math.hypot((b.tx + 0.5) * T - o.x, (b.ty + 0.5) * T - o.y) < CG.TOTEM_RAYON) return true; return false; };
  // le bonus vaut aussi pour le chef, les animaux, les monstres alliés et le golem
  { const G = CG.G, pd = G.playerDmg; G.playerDmg = function () { return pd.apply(this, arguments) * (CG.S && CG.totemPres(CG.S.player) ? 1.2 : 1); };
    const ad = CG.P.dmg; CG.P.dmg = function (p) { return ad.apply(this, arguments) * (p && CG.totemPres(p) ? 1.2 : 1); };
    const he = G.hurtEnemy; G.hurtEnemy = function (e, dmg, who) { const R = CG.R; if (R && who && who === R.golem && CG.totemPres(who)) dmg *= 1.2; return he.call(this, e, dmg, who); }; }
  CG.BUILDS.totem.desc = 'Tous ceux qui se battent pour toi près du totem (7 cases autour) font 20 % de dégâts en plus : ton chef, les gardes, les villageois armés, les animaux et les monstres alliés. Un deuxième totem ne s\'ajoute pas au premier : il couvre seulement un autre endroit.';
  // son rayon se voit au sol : pendant une attaque, ou quand le chef s'approche
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    const S = CG.S, R = CG.R; if (S && R) { const p = S.player;
      for (const b of totems()) { const x = (b.tx + 0.5) * T, y = (b.ty + 0.5) * T; if (!CG.onScreen(x, y) && !CG.onScreen(x + CG.TOTEM_RAYON, y) && !CG.onScreen(x - CG.TOTEM_RAYON, y) && !CG.onScreen(x, y + CG.TOTEM_RAYON * 0.8) && !CG.onScreen(x, y - CG.TOTEM_RAYON * 0.8)) continue;
        const pres = Math.hypot(p.x - x, p.y - y) < CG.TOTEM_RAYON + 60; if (!R.alarm && !pres && !R.build) continue;
        g.save(); g.strokeStyle = 'rgba(255,150,80,' + (R.alarm ? 0.7 : 0.5) + ')'; g.lineWidth = 3; g.setLineDash([12, 10]); g.lineDashOffset = -t * 14; g.beginPath(); g.arc(x, y, CG.TOTEM_RAYON, 0, 6.3); g.stroke(); g.setLineDash([]);
        g.fillStyle = 'rgba(255,150,80,' + (R.alarm ? 0.05 : 0.03) + ')'; g.beginPath(); g.arc(x, y, CG.TOTEM_RAYON, 0, 6.3); g.fill(); g.restore(); } }
    return gr0.apply(this, arguments);
  };
})(window.CG);
