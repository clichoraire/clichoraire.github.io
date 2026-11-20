// Goblin Malin — le chef abat un arbre lui-même, s'il porte une hache (case « Hache » de son équipement).
//   Même déroulement que pour les bûcherons : il cogne, l'arbre tombe et laisse un tronc couché. Le tronc se débite ensuite
//   en deux fois (par lui, E, ou par un bûcheron qui passe) : chaque moitié donne du bois. La hache du chef augmente ce bois.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, rand = CG.rand;
  const Ab = CG.Abattre = { ARBRE: 3.2, TRONC: 2.4, GAIN: 3, PRES: 48, COUP: 0.42 };
  const hache = () => { const q = CG.S.player.porte; return q && q.hache ? q.hache : null; };
  const centre = (x, y) => ({ x: x * T + T / 2, y: y * T + T / 2 });
  function arbrePres() { const R = CG.R, p = CG.S.player, px = Math.floor(p.x / T), py = Math.floor(p.y / T); let best = null, bd = Ab.PRES;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = px + dx, y = py + dy; if (!W.inMap(x, y) || W.tile[W.idx(x, y)] !== W.TREE || (R.reserved && R.reserved.has(W.idx(x, y)))) continue; const c = centre(x, y), d = Math.hypot(c.x - p.x, c.y - p.y) - (R.dir && (R.dir.x * (c.x - p.x) + R.dir.y * (c.y - p.y)) > 0 ? 8 : 0); if (d < bd) { bd = d; best = { x, y }; } }
    return best; }
  function troncPres() { const S = CG.S, R = CG.R, p = S.player; let best = null, bd = 54;
    for (const l of S.logs || []) { if (l.halves <= 0 || (l.by !== null && l.by !== undefined && l.by !== 'chef') || (l.fall !== undefined && R.t - l.fall < 1)) continue; const d = Math.hypot((l.tx + 0.5 + (l.dir || 1) * 0.35) * T - p.x, l.ty * T + T / 2 + 6 - p.y); if (d < bd) { bd = d; best = l; } }
    return best; }
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments); if (it) return it; const R = CG.R; if (R.ko > 0 || R.cine || R.build || !hache()) return it;
    const k = R.coupe, l = troncPres(); if (l) return { type: 'troncChef', obj: l, label: k && k.l === l ? 'Tu débites le tronc... (ne bouge pas)' : 'Débiter le tronc 🪓 (+' + Ab.GAIN + ' ' + CG.RES.bois.icon + ')' };
    const a = arbrePres(); return a ? { type: 'arbreChef', obj: a, label: k && k.a && k.a.x === a.x && k.a.y === a.y ? 'Tu abats l\'arbre... (ne bouge pas)' : 'Abattre l\'arbre 🪓' } : it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || (it.type !== 'arbreChef' && it.type !== 'troncChef')) return in0.apply(this, arguments);
    const R = CG.R, p = CG.S.player; if (R.coupe) return;
    if (it.type === 'troncChef') { it.obj.by = 'chef'; R.coupe = { l: it.obj, t: 0, max: Ab.TRONC, px: p.x, py: p.y }; } else R.coupe = { a: it.obj, t: 0, max: Ab.ARBRE, px: p.x, py: p.y };
    CG.sfx('chop');
  };
  const lache = k => { if (k && k.l && k.l.by === 'chef') k.l.by = null; CG.R.coupe = null; };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player;
    if (R.chutes && R.chutes.length) { for (const c of R.chutes) if (!c.fait && R.t >= c.t) { c.fait = true; G.puff((c.l.tx + 0.5 + c.l.dir * 0.7) * T, c.l.ty * T + T / 2, '#3a8a44', 14, 110, 5); if (CG.onScreen(c.l.tx * T, c.l.ty * T)) CG.sfx('hit'); R.shake = Math.max(R.shake || 0, 0.12); } R.chutes = R.chutes.filter(c => !c.fait); }
    const k = R.coupe; if (!k) return;
    const c = k.l ? { x: (k.l.tx + 0.5 + (k.l.dir || 1) * 0.35) * T, y: k.l.ty * T + T / 2 } : centre(k.a.x, k.a.y);
    if (R.ko > 0 || R.night || CG.UI.modal || !hache() || Math.hypot(p.x - k.px, p.y - k.py) > 5 || (k.l ? !S.logs.includes(k.l) : W.tile[W.idx(k.a.x, k.a.y)] !== W.TREE)) return lache(k);
    const coup = Math.floor(k.t / Ab.COUP); k.t += dt; p.face = c.x > p.x ? 1 : -1; R.chefPose = { k: 'chop', fin: R.t + 0.15 };
    if (Math.floor(k.t / Ab.COUP) !== coup) { CG.sfx('chop'); G.puff(c.x + rand(-8, 8), c.y - 14 - rand(0, 10), '#c9a56b', 5, 90, 3); if (k.a) G.puff(c.x + rand(-14, 14), c.y - 40, '#3a8a44', 2, 50, 3); }
    if (k.t < k.max) return; R.coupe = null;
    if (k.a) { // l'arbre tombe : comme pour un bûcheron
      const i = W.idx(k.a.x, k.a.y); W.cutTree(k.a.x, k.a.y); S.cuts.push(i); G.puff(c.x, c.y - 20, '#3a8a44', 14, 110, 5);
      const log = { tx: k.a.x, ty: k.a.y, halves: 2, cut: false, dir: p.face, fall: R.t, by: null }; S.logs.push(log); (R.chutes = R.chutes || []).push({ l: log, t: R.t + 0.9 }); if (CG.onScreen(p.x, p.y)) CG.sfx('swing'); G.text(c.x, c.y - 60, 'TIMBER !', '#e8ffb0', true); G.unstick(p, 9); return; }
    const l = k.l; l.cut = true; l.halves--; l.by = null; if (l.halves <= 0) S.logs.splice(S.logs.indexOf(l), 1);
    if (CG.Equipement) CG.Equipement.ctx = 'hache'; try { G.gain('bois', Ab.GAIN, c.x, c.y - 30); } finally { if (CG.Equipement) CG.Equipement.ctx = null; }
    G.puff(c.x, c.y - 8, '#c9a56b', 14, 110, 4); CG.sfx('coin');
  };
})(window.CG);
