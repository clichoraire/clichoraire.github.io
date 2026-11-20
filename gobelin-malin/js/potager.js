// Clan Gobelin — le potager à champignons : les champignons poussent un par un. Quand le potager est plein, ce sont les cueilleurs
// qui viennent les cueillir un à un et les portent à la réserve : c'est leur priorité, avant les buissons.
'use strict';
(function (CG) {
  const G = CG.G, T = CG.TILE, Po = CG.Potager = { MAX: 8, POUSSE: 22, CUEILLE: 1.6, GAIN: 2 };
  CG.BUILDS.potager.prod = null; // fini la nourriture qui tombe toute seule
  CG.BUILDS.potager.desc = 'Les champignons y poussent un par un, toute la journée. Quand il est plein (' + Po.MAX + '), tes cueilleurs viennent les cueillir un à un et les portent à la réserve : ' + Po.GAIN + ' de nourriture par champignon. À bâtir à l\'ombre, loin du feu, des torches et des cristaux.';
  const potagers = () => CG.S.buildings.filter(b => b.type === 'potager' && !b.site);
  const pris = b => CG.S.goblins.filter(g => g.potager === b && (g.state === 'toChamp' || g.state === 'champ')).length;
  // ---------- la pousse ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || R.night) return;
    for (const b of potagers()) {
      if (b.champ === undefined) b.champ = 0;
      if (b.recolte) { if (b.champ <= 0) { b.recolte = false; b.pt = 0; } continue; } // on attend que les cueilleurs aient tout ramassé
      b.pt = (b.pt || 0) + dt; if (b.pt < Po.POUSSE) continue; b.pt = 0; b.champ++;
      const x = (b.tx + b.w / 2) * T, y = (b.ty + b.h / 2) * T; if (CG.onScreen(x, y)) { G.puff(x + CG.rand(-20, 20), y + CG.rand(-16, 16), '#f4ead0', 5, 50, 2.5); G.text(x, y - 34, '🍄', '#fff'); }
      if (b.champ >= Po.MAX) { b.champ = Po.MAX; b.recolte = true; if (CG.onScreen(x, y)) G.text(x, y - 52, 'Potager plein !', '#ffd0c0', true); }
    }
  };
  // ---------- la cueillette : appelée par la routine du cueilleur, avant ses buissons ----------
  Po.step = function (g, dt) {
    const S = CG.S, b = g.potager;
    if (g.state === 'toChamp') { if (!b || !S.buildings.includes(b) || !(b.champ > 0)) { g.potager = null; G.resetGoblin(g); return true; } if (G.follow(g, 96, dt)) { g.state = 'champ'; g.timer = Po.CUEILLE; g.face = (b.tx + b.w / 2) * T > g.x ? 1 : -1; } return true; }
    if (g.state === 'champ') {
      if (!b || !S.buildings.includes(b) || !(b.champ > 0)) { g.potager = null; G.resetGoblin(g); return true; }
      g.moving = false; g.pose = 'work'; g.timer -= dt * G.workSpeed(g); if (g.timer > 0) return true;
      { const n = Math.min(b.champ, CG.Outils ? CG.Outils.cap(g) : 1); b.champ -= n; g.charge = n; } g.pose = null; g.carry = 'baies'; g.champi = true; const st = G.dropPoint(g); if (!st || !G.goTo(g, st.x + CG.rand(-24, 24), st.y + CG.rand(-2, 8))) { g.carry = null; g.champi = false; G.resetGoblin(g); return true; } g.state = 'toStockC'; return true;
    }
    if (g.state === 'toStockC') { if (G.follow(g, 96, dt)) { G.gain('food', (Po.GAIN + (CG.Allies && CG.Allies.bless('recolte') ? 1 : 0) + (G.tech('b11') ? 1 : 0)) * (G.outilVide ? G.outilVide(g) : 1), g.x, g.y - 30); g.carry = null; g.champi = false; if (G.gobXp) G.gobXp(g, 1, 5); g.state = 'idle'; g.timer = 0.4; } return true; }
    if (g.state !== 'idle' && g.state !== 'toNode' && g.state !== 'work') return false; // il rapporte déjà quelque chose : il finit d'abord. Sinon, le potager passe avant le buisson
    let best = null, bd = 1e9; for (const p of potagers()) { if (!p.recolte || p.champ - pris(p) <= 0) continue; const d = Math.hypot((p.tx + p.w / 2) * T - g.x, (p.ty + p.h / 2) * T - g.y); if (d < bd) { bd = d; best = p; } }
    if (!best) return false;
    const k = g.id % 4, x = (best.tx + 0.5 + (k % 2)) * T + CG.rand(-6, 6), y = (best.ty + 0.6 + (k > 1 ? 1 : 0)) * T;
    if (g.state !== 'idle') G.resetGoblin(g);
    if (!G.goTo(g, x, y)) return false; g.potager = best; g.state = 'toChamp'; g.bubble = null; return true;
  };
})(window.CG);
