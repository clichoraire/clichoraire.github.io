// Goblin Malin — tours de guet : il faut un garde dedans pour qu'elles tirent. Les gardes y montent d'eux-mêmes, en priorité.
'use strict';
(function (CG) {
  const G = CG.G, T = CG.TILE, To = CG.Tours = {};
  G.towerGuard = b => CG.S.goblins.find(g => g.perch === b && g.job === 'garde') || null;
  G.unperch = function (g) {
    const b = g.perch; g.perch = null; g.post = null;
    if (b) { const d = G.door(b); g.x = d.x; g.y = d.y + 4; }
    G.resetGoblin(g); g.timer = 0.4;
  };
  // vrai = ce garde s'occupe d'une tour (il y va, ou il y est déjà)
  G.towerStep = function (g, dt) {
    const S = CG.S, R = CG.R, duty = R.alarm || (S.hour >= 6 && S.hour < 19); // le soir, il redescend pour la fête et la nuit
    let b = g.post;
    if (b && (S.buildings.indexOf(b) < 0 || b.site || b.type !== 'tower')) { G.unperch(g); b = null; }
    if (!duty) { if (g.perch || g.post) G.unperch(g); return false; }
    if (g.tourCd > 0) g.tourCd -= dt;
    if (!b) {
      if (g.tourCd > 0) return false;
      let bd = 1e9;
      for (const t of S.buildings) {
        if (t.type !== 'tower' || t.site || S.goblins.some(o => o !== g && o.post === t && o.job === 'garde')) continue;
        const d = G.door(t), dd = Math.hypot(d.x - g.x, d.y - g.y); if (dd < bd) { bd = dd; b = t; }
      }
      if (!b) { g.tourCd = 1.5; return false; }
      G.resetGoblin(g); g.post = b; g.melee = false;
    }
    if (g.perch) { g.moving = false; g.state = 'tour'; g.pose = null; return true; }
    const d = G.door(b), climb = () => { g.perch = b; g.x = d.x; g.y = d.y; g.moving = false; g.path = null; g.state = 'tour'; G.puff(d.x, d.y - 8, '#d8c8a0', 8, 70, 3); };
    if (Math.hypot(g.x - d.x, g.y - d.y) < 18) { climb(); return true; }
    if (g.state !== 'tour' || !g.path) { if (!G.goTo(g, d.x, d.y)) { g.post = null; g.tourCd = 6; return false; } g.state = 'tour'; }
    if (G.follow(g, 100, dt)) climb();
    return true;
  };
  // le garde en haut de sa tour : le buste dépasse du parapet
  To.draw = function (c, g, t) {
    const b = g.perch, cx = (b.tx + b.w / 2) * T, by = (b.ty + b.h) * T, A = CG.Art, py = by - 95;
    c.save(); c.translate(cx, py); c.scale(0.88, 0.88);
    A.goblin(c, { hatJob: g.hat, x: 0, y: 0, face: g.face || 1, dir: g.face < 0 ? 'SW' : 'SE', t: t, sex: g.sex, hue: g.hue, lum: g.lum, job: 'garde', equip: g.equip, tool: 'arc', atk: g.atkAnim, look: g.look, cls: g.cls || (g.nomme ? 'hob' : null), evolved: !!g.nomme, noLegs: true });
    c.restore();
    c.fillStyle = '#8a6234'; c.fillRect(cx - 29, by - 105, 58, 23); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(cx - 29, by - 88, 58, 6);
    c.fillStyle = '#6b4a2a'; for (let i = 0; i < 5; i++) if (i !== 2) c.fillRect(cx - 27 + i * 12, by - 112, 7, 10);
    if (g.perch && g.perch.up > 1) { c.fillStyle = '#e8c84a'; c.fillRect(cx - 31, by - 86, 62, 4); c.fillRect(cx - 31, by - 104, 62, 3); }
  };
})(window.CG);
