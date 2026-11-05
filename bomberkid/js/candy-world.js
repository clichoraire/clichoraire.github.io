// Thème guimauve et nuages : monstre guimauve (nouveau dessin, saut écrasé), bloc de guimauve qui donne une guimauve
// à manger, bloc nuage qui fait « pouf », et trampoline (2 cases en marchant, 3 en courant).
(function (BK) {
  'use strict';
  const W = BK.World.prototype, S = BK.sprites, TAU = Math.PI * 2;
  Object.assign(BK.DECO_PROPS, { marshmallow: 2, cloudblock: 2, trampoline: 0 });
  if (!BK.CUBE_BLOCKS.includes('marshmallow')) BK.CUBE_BLOCKS.push('marshmallow');
  BK.BLOCK_COLORS = { marshmallow: '#ffd1e3', cloudblock: '#ffffff' };
  // Guimauve costaude : plus musclée, plus solide, saute deux fois plus loin (4 cases).
  if (BK.ENEMIES.guimauve && !BK.ENEMIES.guimauve_costaud) {
    BK.ENEMIES.guimauve_costaud = { ...BK.ENEMIES.guimauve, name: 'Guimauve costaude', hp: 3, r: 0.36, score: 360, xp: 36, dmg: 15 };
    const items = BK.EDITOR_TABS?.find(t => t.id === 'ennemis')?.items;
    if (items) { const i = items.findIndex(it => it.enemy === 'guimauve'); items.splice(i + 1, 0, { enemy: 'guimauve_costaud', name: 'Guimauve costaude', icon: '💪', hint: 'Une guimauve musclée : 3 bombes. Te voit à 5 cases et saute jusqu’à 4 cases pour t’écraser.' }); }
  }
  const MALLOWS = ['guimauve', 'guimauve_costaud'], strong = e => e.type === 'guimauve_costaud';
  // Corps de guimauve (monstre et guimauve à manger) : cylindre aux côtés bombés et au dessus arrondi, dégradé gauche → droite.
  S.drawMallowBody = function (ctx, w, y0, y1, hurt) {
    const ry = w * 0.3, my = (y0 + y1) / 2, g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, hurt ? '#ffd6d6' : '#eadad3'); g.addColorStop(0.35, hurt ? '#fff0f0' : '#ffffff'); g.addColorStop(1, hurt ? '#ffc9c9' : '#f1e1d9');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w, y0); ctx.quadraticCurveTo(-w * 1.08, my, -w, y1); ctx.ellipse(0, y1, w, ry * 0.8, 0, Math.PI, 0, true); ctx.quadraticCurveTo(w * 1.08, my, w, y0); ctx.ellipse(0, y0, w, ry, 0, 0, Math.PI, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(210,175,168,0.3)'; ctx.beginPath(); ctx.ellipse(0, y1 - ry * 0.15, w * 0.9, ry * 0.55, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-w * 0.55, my + (y1 - y0) * 0.05, w * 0.14, (y1 - y0) * 0.24, -0.12, 0, TAU); ctx.fill();
    const cap = ctx.createLinearGradient(0, y0 - ry, 0, y0 + ry); cap.addColorStop(0, '#ffffff'); cap.addColorStop(1, hurt ? '#ffe8e8' : '#f7ede7');
    ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(0, y0 + ry * 0.05, w * 0.96, ry * 0.9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-w * 0.25, y0 - ry * 0.15, w * 0.38, ry * 0.32, -0.1, 0, TAU); ctx.fill();
  };

  // ---------------------------------------------------------------- monstre guimauve
  // Écrasement / étirement selon le saut : accroupi, étiré en vol, puis rebond élastique à l'atterrissage.
  const easeInOut = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  BK.mallowSquash = e => {
    const m = e && e.mallow; if (!m) return { sx: 1, sy: 1 };
    if (m.phase === 'crouch') { const v = easeInOut(Math.min(1, m.t / 0.35)); return { sx: 1 + 0.22 * v, sy: 1 - 0.3 * v }; }
    if (m.phase === 'air') { const u = Math.min(1, m.t / m.dur), v = Math.sin(Math.PI * u); return { sx: 1 - 0.12 * v, sy: 1 + 0.18 * v }; }
    const u = Math.min(1, m.t / 0.6), d = Math.exp(-6 * u) * Math.cos(14 * u);   // elastic : s'écrase fort, rebondit, se replace
    return { sx: 1 + 0.32 * d, sy: 1 - 0.42 * d };
  };
  const drawEnemy = S.drawEnemy;
  S.drawEnemy = function (ctx, type, o = {}) {
    if (!MALLOWS.includes(type)) return drawEnemy.call(this, ctx, type, o);
    const e = o.creature || {}, t = o.t || 0, s = (o.s || 60) / 100, hurt = o.hurt > 0 && Math.floor(t * 16) % 2, q = BK.mallowSquash(e), big = type === 'guimauve_costaud', air = e.mallow?.phase === 'air';
    const w = big ? 34 : 29, y0 = big ? -64 : -60;
    ctx.save(); ctx.scale(o.flip ? -s : s, s);
    if (!e.mallow) ctx.translate(0, -Math.abs(Math.sin(t * 4)) * 4);   // petit dandinement en marchant
    ctx.scale(q.sx, q.sy);
    ctx.fillStyle = '#f2c4cf'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * (big ? 16 : 13), -3, big ? 12 : 10, 5, 0, 0, TAU); ctx.fill(); }   // pieds
    S.drawMallowBody(ctx, w, y0, -6, hurt);
    if (big) {   // bandeau rose noué sur le côté
      ctx.strokeStyle = '#ff5c8a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-w + 1, -50); ctx.quadraticCurveTo(0, -44, w - 1, -50); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w - 2, -50); ctx.lineTo(w + 9, -56 + Math.sin(t * 8) * 2); ctx.moveTo(w - 2, -49); ctx.lineTo(w + 8, -43 + Math.sin(t * 8 + 1) * 2); ctx.stroke();
    }
    // bras : petits et ronds, ou gros biceps gonflés pour la costaude
    if (big) for (const sx of [-1, 1]) {
      const lift = air ? -10 : Math.sin(t * 3 + sx) * 2, flex = '#f3e3dc';
      ctx.fillStyle = flex; ctx.beginPath(); ctx.ellipse(sx * 40, -34 + lift, 11, 9, 0, 0, TAU); ctx.fill();   // épaule
      ctx.beginPath(); ctx.ellipse(sx * 45, -46 + lift, 10, 10, 0, 0, TAU); ctx.fill();   // biceps
      ctx.fillStyle = 'rgba(205,170,165,0.45)'; ctx.beginPath(); ctx.ellipse(sx * 47, -43 + lift, 6, 3, sx * 0.4, 0, Math.PI); ctx.fill();
      ctx.fillStyle = flex; ctx.beginPath(); ctx.ellipse(sx * 47, -60 + lift, 7, 9, 0, 0, TAU); ctx.fill();   // avant-bras levé
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx * 47, -70 + lift, 8, 0, TAU); ctx.fill();   // poing
      ctx.fillStyle = 'rgba(205,170,165,0.5)'; ctx.fillRect(sx * 47 - 5, -71 + lift, 10, 1.5);
    } else { ctx.fillStyle = '#f6e9e2'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 31, -30 - (air ? 12 : 0), 6, 10, sx * 0.3, 0, TAU); ctx.fill(); } }
    // visage : yeux brillants (sourcils froncés pour la costaude), joues roses, bouche
    const blink = Math.sin(t * 1.7 + (e.x || 0)) > 0.96, ey = big ? -36 : -38;
    ctx.fillStyle = '#3a2b3a'; for (const sx of [-10, 10]) { ctx.beginPath(); ctx.ellipse(sx, ey, 4.5, blink ? 1 : 6, 0, 0, TAU); ctx.fill(); }
    if (!blink) { ctx.fillStyle = '#fff'; for (const sx of [-11.5, 8.5]) { ctx.beginPath(); ctx.arc(sx, ey - 2.5, 1.8, 0, TAU); ctx.fill(); } }
    if (big) { ctx.strokeStyle = '#3a2b3a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 16, ey - 11); ctx.lineTo(sx * 5, ey - 7); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,150,180,0.65)'; for (const sx of [-19, 19]) { ctx.beginPath(); ctx.ellipse(sx, ey + 10, 5.5, 3.2, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#7b5566'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath();
    if (e.mallow && e.mallow.phase !== 'land') ctx.ellipse(0, ey + 14, 4, 4.5, 0, 0, TAU);
    else if (big) { ctx.moveTo(-7, ey + 13); ctx.quadraticCurveTo(0, ey + 17, 7, ey + 13); }
    else ctx.arc(0, ey + 11, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  };
  // Attaque spéciale : il s'accroupit, saute 2 cases vers le héros, s'écrase à l'atterrissage (dégâts sur sa case) et rebondit.
  W.mallowLanding = function (e) {
    const c = Math.floor(e.x), r = Math.floor(e.y), D = this.mallowDir(e), h = this.hAt(c, r), ok = (cc, rr) => this.inside(cc, rr) && !this.cell(cc, rr) && this.walkableTerrain(cc, rr) && !this.bombAt(cc, rr) && !this.solidEnemyAt(cc, rr) && Math.abs(this.hAt(cc, rr) - h) < 0.05;
    for (const d of strong(e) ? [4, 3, 2, 1] : [2, 1]) { const cc = c + D.dx * d, rr = r + D.dy * d; if (ok(cc, rr)) return { x: cc + 0.5, y: rr + 0.5 }; }
    return null;
  };
  W.mallowDir = function (e) { const p = e.mallowTarget, dx = p.x - e.x, dy = p.y - e.y; return BK.DIRS[Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : (dy > 0 ? 0 : 2)]; };
  const fantasy = W.updateFantasyEnemy;
  W.updateFantasyEnemy = function (e, dt) {
    if (!MALLOWS.includes(e.type)) return fantasy.call(this, e, dt);
    const m = e.mallow;
    if (m) {
      m.t += dt;
      if (m.phase === 'crouch') { if (m.t >= 0.35) { m.phase = 'air'; m.t = 0; this.burst(e.x, e.y, 0.25, 'rgba(255,240,245,0.9)', 5); } return; }
      if (m.phase === 'air') {
        const u = Math.min(1, m.t / m.dur); e.x = m.x0 + (m.x1 - m.x0) * u; e.y = m.y0 + (m.y1 - m.y0) * u; e.z = 4 * u * (1 - u) * (strong(e) ? 1.7 : 1.15);
        if (u >= 1) { e.z = 0; m.phase = 'land'; m.t = 0; this.shake = Math.max(this.shake || 0, strong(e) ? 0.22 : 0.12); this.burst(e.x, e.y, 0.45, 'rgba(255,225,235,0.95)', 10); this.events.push({ type: 'stomp', enemy: e });
          for (const p of this.players) if (p.alive && !p.npc && !p.air && Math.hypot(p.x - e.x, p.y - e.y) < (strong(e) ? 0.9 : 0.7)) this.hitPlayer(p, { kind: 'enemy', enemy: e }); }
        return;
      }
      if (m.t >= 0.6) { e.mallow = null; e.mallowCool = 2 + Math.random() * 1.2; }
      return;
    }
    e.mallowCool = (e.mallowCool ?? 1.2) - dt;
    const p = this.visibleEnemyTarget(e, strong(e) ? 5.5 : 3.5);
    if (p && e.mallowCool <= 0) { e.mallowTarget = p; const to = this.mallowLanding(e); if (to) { e.flip = to.x < e.x; e.patrolTarget = null; e.mallow = { phase: 'crouch', t: 0, x0: e.x, y0: e.y, x1: to.x, y1: to.y, dur: strong(e) ? 0.8 : 0.55 }; return; } e.mallowCool = 0.8; }
    this.localEnemyPatrol(e, dt, 2);
  };

  // ---------------------------------------------------------------- arbre à guimauves
  const drawTree = S.drawTree;
  S.drawTree = function (ctx, x, y, k, t, o) {
    o = o || {}; if (o.style !== 'guimauve' || ((o.size || 1) < 0.5 && !o.potted)) return drawTree.call(this, ctx, x, y, k, t, o);
    k *= o.size || 1; const r = k * 0.9, sway = Math.sin(t * 1.3) * k * 0.03, cols = ['#ffffff', '#ffd1e3', '#c8f2e0', '#fff1b8', '#e3d4ff'];
    ctx.save(); ctx.translate(x, y);
    if (!o.potted) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.35, 0, 0, TAU); ctx.fill(); }
    ctx.lineCap = 'round'; let n = 0;
    const mallow = (mx, my, c) => { const w = k * 0.13, h = k * 0.15; ctx.fillStyle = c; S.rr(ctx, mx - w, my - h, w * 2, h * 2, w * 0.7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(mx, my - h * 0.85, w * 0.85, h * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(180,140,140,0.25)'; ctx.beginPath(); ctx.ellipse(mx, my + h * 0.75, w * 0.8, h * 0.22, 0, 0, TAU); ctx.fill(); };
    const tips = [];
    const branch = (x0, y0, ang, len, w, depth) => { const x1 = x0 + Math.cos(ang) * len + sway * depth * 0.3, y1 = y0 + Math.sin(ang) * len; ctx.strokeStyle = '#9a6b52'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,200,0.35)'; ctx.lineWidth = w * 0.3; ctx.beginPath(); ctx.moveTo(x0 - w * 0.2, y0); ctx.lineTo(x1 - w * 0.2, y1); ctx.stroke();
      if (depth <= 0) { tips.push([x1, y1]); return; } branch(x1, y1, ang - 0.55 - 0.15 * depth, len * 0.68, w * 0.62, depth - 1); branch(x1, y1, ang + 0.5, len * 0.62, w * 0.62, depth - 1); };
    branch(0, 0, -Math.PI / 2, k * 0.8, k * 0.18, 3);
    for (const [mx, my] of tips) mallow(mx, my - k * 0.06, cols[n++ % cols.length]);
    ctx.restore();
  };

  // ---------------------------------------------------------------- dessin : nuage, trampoline, guimauve à manger
  const drawDeco = S.drawDeco;
  S.drawDeco = function (ctx, kind, x, y, k, t, nb, seed, orientation, lightColor, props = {}) {
    if (kind === 'cloudblock') return S.drawCloudBlock(ctx, x, y, k, t, props?.color || BK.BLOCK_COLORS.cloudblock, seed || 1);
    if (kind === 'trampoline') return S.drawTrampoline(ctx, x, y, k, t);
    return drawDeco.call(this, ctx, kind, x, y, k, t, nb, seed, orientation, lightColor, props);
  };
  S.drawCloudBlock = function (ctx, x, y, k, t, color, seed) {
    const rnd = n => { const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); }, bob = Math.sin(t * 1.6 + seed) * k * 0.025;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(0, 0, k * 0.48, k * 0.18, 0, 0, TAU); ctx.fill();
    const puffs = [[-0.26, -0.3, 0.26], [0.26, -0.3, 0.26], [0, -0.32, 0.3], [-0.14, -0.58, 0.26], [0.16, -0.6, 0.24], [0.02, -0.78, 0.2]].map(([px, py, pr], i) => [px * k + (rnd(i) - 0.5) * k * 0.05, py * k + bob, pr * k * (0.92 + rnd(i + 9) * 0.16)]);
    const g = ctx.createLinearGradient(0, -k, 0, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, color); g.addColorStop(1, S.shade ? S.shade(color, 0.82) : color);
    ctx.fillStyle = g; ctx.beginPath(); for (const [px, py, pr] of puffs) { ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, TAU); } ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (const [px, py, pr] of puffs.slice(3)) { ctx.beginPath(); ctx.ellipse(px - pr * 0.3, py - pr * 0.35, pr * 0.4, pr * 0.22, -0.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  S.drawTrampoline = function (ctx, x, y, k, t) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0, 0, k * 0.46, k * 0.18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a5466'; for (const lx of [-0.34, -0.12, 0.12, 0.34]) S.rr(ctx, lx * k - k * 0.025, -k * 0.27, k * 0.05, k * 0.27, k * 0.02), ctx.fill();
    ctx.fillStyle = '#2f8fe0'; ctx.beginPath(); ctx.ellipse(0, -k * 0.3, k * 0.46, k * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd54a'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * k * 0.4, -k * 0.3 + Math.sin(a) * k * 0.17, k * 0.03, k * 0.02, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#26324d'; ctx.beginPath(); ctx.ellipse(0, -k * 0.3, k * 0.34, k * 0.14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-k * 0.08, -k * 0.34, k * 0.14, k * 0.04, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd54a'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? k * 0.035 : k * 0.08; ctx.lineTo(Math.cos(a) * rad, -k * 0.3 + Math.sin(a) * rad * 0.45); } ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  const drawItem = S.drawItem;
  S.drawItem = function (ctx, type, s, t, value) {
    if (type !== 'marshmallow') return drawItem.call(this, ctx, type, s, t, value);
    ctx.save(); ctx.translate(0, -s * 0.04 - Math.sin(t * 3) * s * 0.04);
    S.drawMallowBody(ctx, s * 0.19, -s * 0.4, -s * 0.02, false);   // même corps que le monstre guimauve
    ctx.restore();
  };

  // ---------------------------------------------------------------- nuage : « pouf » quand il est détruit
  const destroy = W.destroyBlock;
  W.destroyBlock = function (c, r, by) {
    const kind = this.deco[this.idx(c, r)], color = this.props[c + ',' + r]?.color || BK.BLOCK_COLORS.cloudblock;
    const out = destroy.call(this, c, r, by);
    if (kind === 'cloudblock') {
      const gz = this.explore ? this.groundZ(c + 0.5, r + 0.5) : 0;
      for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, v = 0.6 + Math.random() * 1.1; this.particles.push({ x: c + 0.5, y: r + 0.5, z: gz + 0.3 + Math.random() * 0.4, gz, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0.3 + Math.random() * 0.5, life: 0.7 + Math.random() * 0.4, t: 0, color: i % 3 ? color : '#ffffff', size: 0.16 + Math.random() * 0.14, float: true }); }
      this.particles.push({ x: c + 0.5, y: r + 0.5, z: gz + 0.4, gz, vx: 0, vy: 0, vz: 0, life: 0.5, t: 0, color: 'rgba(255,255,255,0.7)', size: 0.25, float: true, ring: true });
      this.addFloater?.(c + 0.5, r + 0.5, 'Pouf !', { size: 0.26, color: '#ffffff', life: 0.9 });
    }
    return out;
  };

  // ---------------------------------------------------------------- trampoline
  W.trampolineJump = function (p, c, r) {
    const gz = (x, y) => this.explore ? this.groundZ(x, y) : 0, run = !!p.running, dir = p.dir ?? 0, D = BK.DIRS[dir], h0 = gz(c + 0.5, r + 0.5);
    const free = (cc, rr) => this.inside(cc, rr) && !this.cell(cc, rr) && this.walkableTerrain(cc, rr) && !this.solidEnemyAt(cc, rr) && gz(cc + 0.5, rr + 0.5) <= h0 + 0.61 && this.jumpHeightClear(p.x,p.y,cc+.5,rr+.5);
    let target = null; for (let d = run ? 3 : 2; d >= 1 && !target; d--) { const cc = c + D.dx * d, rr = r + D.dy * d; if (free(cc, rr)) target = { c: cc, r: rr }; }
    const tx = target ? target.c + 0.5 : c + 0.5, ty = target ? target.r + 0.5 : r + 0.5, b = target ? this.bombAt(target.c, target.r) : null;
    p.air = { x0: p.x, y0: p.y, z0: gz(p.x, p.y), x1: tx, y1: ty, z1: gz(tx, ty) + (b ? 0.55 : 0), h: run ? 1.5 : 1.15, t: 0, dur: run ? 0.8 : 0.62, bomb: b, dir };
    this.bounceT.set(this.idx(c, r), 0.45); this.burst(p.x, p.y, 0.3, 'rgba(255,255,255,0.8)', 6); this.events.push({ type: 'bounce', player: p }); this.setPose(p, 'jump', 99);
  };
  const updatePlayer = W.updatePlayer;
  W.updatePlayer = function (p, dt) {
    updatePlayer.call(this, p, dt);
    if (!this.explore || !p.alive || p.npc || p.ally || p.air || p.falling || p.onBomb || p.boat || p.swallowedBy) return;
    const c = Math.floor(p.x), r = Math.floor(p.y), i = this.idx(c, r);
    if (this.deco[i] !== 'trampoline') { p.lastTramp = null; return; }
    if (p.lastTramp === i || Math.hypot(p.x - c - 0.5, p.y - r - 0.5) > 0.32) return;   // au centre du trampoline, une fois par passage
    p.lastTramp = i; this.trampolineJump(p, c, r);
  };
})(window.BK);
