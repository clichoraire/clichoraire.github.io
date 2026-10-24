// Affichage du match : patinoire, joueurs, rondelle, effets, tableau indicateur.
(function (HK) {
  'use strict';
  const R = HK.RINK, G = HK.GOAL, S = HK.sprites, W = HK.W, H = HK.H;
  const CX = () => HK.CX, CY = () => HK.CY;
  let rink = null;
  const TAU = Math.PI * 2;

  function buildRink() {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
    // aréna
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#171b27'); bg.addColorStop(1, '#0d1018');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // foule (bandes en haut et en bas, petits points colorés)
    const rnd = HK.makeRand(7);
    const crowd = (y0, y1) => {
      for (let y = y0; y < y1; y += 7) for (let x = 6; x < W; x += 7) {
        if (rnd() < 0.12) continue;
        ctx.fillStyle = `hsl(${(rnd() * 360) | 0},${40 + rnd() * 40 | 0}%,${35 + rnd() * 30 | 0}%)`;
        ctx.fillRect(x + (rnd() * 3 - 1), y + (rnd() * 3 - 1), 4, 5);
      }
    };
    crowd(112, R.y - 14); crowd(R.y + R.h + 12, H - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 112, W, R.y - 14 - 112); ctx.fillRect(0, R.y + R.h + 12, W, H - (R.y + R.h + 12));
    // bande extérieure (verre + bande blanche + plinthe jaune)
    S.rr(ctx, R.x - 12, R.y - 12, R.w + 24, R.h + 24, R.r + 12); ctx.fillStyle = '#dfe6ee'; ctx.fill();
    S.rr(ctx, R.x - 7, R.y - 7, R.w + 14, R.h + 14, R.r + 7); ctx.fillStyle = '#f6c21b'; ctx.fill();
    // glace
    S.rr(ctx, R.x, R.y, R.w, R.h, R.r); ctx.fillStyle = '#eef6ff'; ctx.fill();
    ctx.save(); ctx.clip();
    const ice = ctx.createRadialGradient(CX(), CY(), 50, CX(), CY(), 700); ice.addColorStop(0, 'rgba(255,255,255,0.5)'); ice.addColorStop(1, 'rgba(190,215,240,0.5)');
    ctx.fillStyle = ice; ctx.fillRect(R.x, R.y, R.w, R.h);
    // lignes
    const gxl = HK.goalX(-1), gxr = HK.goalX(1);
    ctx.lineWidth = 3; ctx.strokeStyle = '#d7332a';
    for (const gx of [gxl, gxr]) { ctx.beginPath(); ctx.moveTo(gx, R.y); ctx.lineTo(gx, R.y + R.h); ctx.stroke(); }
    ctx.lineWidth = 7; ctx.strokeStyle = '#2d63c8';
    for (const bx of [CX() - R.w * 0.19, CX() + R.w * 0.19]) { ctx.beginPath(); ctx.moveTo(bx, R.y); ctx.lineTo(bx, R.y + R.h); ctx.stroke(); }
    ctx.strokeStyle = '#d7332a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(CX(), R.y); ctx.lineTo(CX(), R.y + R.h); ctx.stroke();
    // cercles
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#2d63c8'; ctx.beginPath(); ctx.arc(CX(), CY(), 62, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#2d63c8'; S.circle(ctx, CX(), CY(), 5); ctx.fill();
    ctx.strokeStyle = '#d7332a'; ctx.fillStyle = '#d7332a';
    for (const fx of [CX() - 310, CX() + 310]) for (const fy of [CY() - 140, CY() + 140]) { ctx.beginPath(); ctx.arc(fx, fy, 52, 0, TAU); ctx.stroke(); S.circle(ctx, fx, fy, 4); ctx.fill(); }
    for (const fx of [CX() - 150, CX() + 150]) for (const fy of [CY() - 140, CY() + 140]) { S.circle(ctx, fx, fy, 4); ctx.fill(); }
    // enclaves des gardiens
    for (const side of [-1, 1]) {
      const gx = HK.goalX(side);
      ctx.beginPath(); ctx.moveTo(gx, CY() - G.crease); ctx.arc(gx, CY(), G.crease, side < 0 ? -Math.PI / 2 : Math.PI * 1.5, side < 0 ? Math.PI / 2 : Math.PI / 2, side > 0); ctx.closePath();
      ctx.fillStyle = 'rgba(120,180,240,0.45)'; ctx.fill(); ctx.strokeStyle = '#d7332a'; ctx.lineWidth = 2; ctx.stroke();
    }
    // logo central
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#1b2a4a'; ctx.font = 'bold 54px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BOISJOLI', CX(), CY() - 2); ctx.restore();
    ctx.restore();
    // bordure fine
    S.rr(ctx, R.x, R.y, R.w, R.h, R.r); ctx.strokeStyle = '#9fb3c8'; ctx.lineWidth = 2; ctx.stroke();
    // bancs (petits panneaux au-dessus de la glace)
    rink = c;
  }

  function drawNet(ctx, side, lamp) {
    const n = HK.netBox(side);
    ctx.save();
    if (lamp) { ctx.fillStyle = `rgba(255,40,40,${0.35 + 0.35 * Math.sin(performance.now() / 60)})`; S.circle(ctx, side < 0 ? n.x0 - 16 : n.x1 + 16, n.y0 - 14, 9); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(n.x0, n.y0, n.x1 - n.x0, n.y1 - n.y0);
    ctx.strokeStyle = 'rgba(120,130,150,0.8)'; ctx.lineWidth = 1;
    for (let x = n.x0 + 5; x < n.x1; x += 6) { ctx.beginPath(); ctx.moveTo(x, n.y0); ctx.lineTo(x, n.y1); ctx.stroke(); }
    for (let y = n.y0 + 5; y < n.y1; y += 6) { ctx.beginPath(); ctx.moveTo(n.x0, y); ctx.lineTo(n.x1, y); ctx.stroke(); }
    ctx.strokeStyle = '#d7332a'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (side < 0) { ctx.moveTo(n.x1, n.y0); ctx.lineTo(n.x0, n.y0); ctx.lineTo(n.x0, n.y1); ctx.lineTo(n.x1, n.y1); }
    else { ctx.moveTo(n.x0, n.y0); ctx.lineTo(n.x1, n.y0); ctx.lineTo(n.x1, n.y1); ctx.lineTo(n.x0, n.y1); }
    ctx.stroke();
    ctx.fillStyle = '#d7332a'; S.circle(ctx, n.gx, n.y0, 4); ctx.fill(); S.circle(ctx, n.gx, n.y1, 4); ctx.fill();
    ctx.restore();
  }

  function shadow(ctx, x, y, rx, ry) { ctx.fillStyle = 'rgba(0,0,30,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }

  function drawSkater(ctx, g, s, now) {
    const T = g.teams[s.team].def, v = Math.hypot(s.vx, s.vy), size = s.def.size;
    shadow(ctx, s.x, s.y + 2, s.r * 1.1, s.r * 0.45);
    if (s.buff > 0) { ctx.fillStyle = 'rgba(255,210,60,0.35)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 2, s.r * 1.5, s.r * 0.65, 0, 0, TAU); ctx.fill(); }
    if (s.boostT > 0 && v > 80) { ctx.strokeStyle = 'rgba(255,230,80,0.7)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const k = (i - 1) * 7; ctx.beginPath(); ctx.moveTo(s.x - s.vx / v * 14, s.y - 20 * size + k); ctx.lineTo(s.x - s.vx / v * 40, s.y - 20 * size + k - s.vy / v * 26); ctx.stroke(); } }
    if (s.magnet > 0) { ctx.strokeStyle = 'rgba(220,40,60,0.8)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y - 20 * size, 40 + 6 * Math.sin(now / 90), 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    const scream = g.fx.some(f => f.kind === 'crise' && f.s === s);
    S.drawPerson(ctx, s.x, s.y, s.def, T, {
      dir: s.dir, frame: s.anim, moving: v > 25, down: s.down > 0, slide: s.slide > 0,
      stunKind: s.stun > 0 ? s.stunKind : null, frozen: s.stun > 0 && s.stunKind === 'frozen', ghost: s.ghost > 0,
      charge: s.charge, scream,
    });
    const top = s.y - (13 + 21 + 20 * (1 + Math.max(0, 1 - size) * 0.9)) * size;   // haut de la tête
    if (s.shield > 0) { ctx.fillStyle = 'rgba(150,220,255,0.25)'; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(s.x, (s.y + top) / 2, s.r * 2.2, (s.y - top) * 0.72, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; S.circle(ctx, s.x - s.r * 1.1, (s.y + top) / 2 - (s.y - top) * 0.4, 4); ctx.fill(); }
    if (s.stun > 0) {
      if (s.stunKind === 'dizzy') { ctx.fillStyle = '#ffd400'; for (let i = 0; i < 3; i++) { const a = now / 250 + i * TAU / 3; star(ctx, s.x + Math.cos(a) * 16, top - 6 + Math.sin(a) * 5, 5); } }
      else if (s.stunKind === 'eat') { ctx.fillStyle = '#ff5a8a'; for (let i = 0; i < 2; i++) { const ph = (now / 600 + i * 0.5) % 1; heart(ctx, s.x + (i ? 10 : -8), top - 4 - ph * 22, 5 * (1 - ph * 0.5)); } }
      else if (s.stunKind === 'frozen') { ctx.strokeStyle = '#7fe0ff'; ctx.lineWidth = 2; ctx.beginPath(); let x = s.x - 18, y = top - 8; ctx.moveTo(x, y); for (let i = 1; i <= 6; i++) { x += 6; y += (i % 2 ? -5 : 5); ctx.lineTo(x, y); } ctx.stroke(); }
    }
    if (s.slowT > 0 && s.slowKind === 'blizzard') { ctx.fillStyle = 'rgba(240,250,255,0.9)'; for (let i = 0; i < 5; i++) { const ph = (now / 900 + i * 0.2) % 1; S.circle(ctx, s.x - 16 + i * 8 + Math.sin(now / 200 + i) * 3, top + ph * (s.y - top), 2); ctx.fill(); } }
    if (s.slowT > 0 && s.slowKind === 'cheat') { ctx.fillStyle = 'rgba(60,255,120,0.8)'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; for (let i = 0; i < 4; i++) { const ph = (now / 700 + i * 0.25) % 1; ctx.fillText(((now / 100 + i) | 0) % 2 ? '1' : '0', s.x - 14 + i * 9, top + ph * (s.y - top)); } }
    if (s.rage > 0) { ctx.fillStyle = `rgba(255,40,40,${0.25 + 0.15 * Math.sin(now / 60)})`; ctx.beginPath(); ctx.ellipse(s.x, s.y - 22, s.r * 2, s.r * 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('#@%!', s.x + 18, top - 10 + Math.sin(now / 80) * 3); }
    if (s.wall > 0) { ctx.strokeStyle = '#b55a2b'; ctx.lineWidth = 3; ctx.setLineDash([8, 4]); ctx.strokeRect(s.x - s.r * 1.6, top - 4, s.r * 3.2, s.y - top + 6); ctx.setLineDash([]); }
    if (s.perfect > 0) { ctx.fillStyle = `rgba(255,215,0,${0.6 + 0.3 * Math.sin(now / 70)})`; star(ctx, s.x + s.dir * (s.r + 14), s.y - 4, 9); }
    if (s.stun > 0 && s.stunKind === 'charmed') { ctx.fillStyle = '#ff5a8a'; for (let i = 0; i < 3; i++) { const ph = (now / 500 + i * 0.33) % 1; heart(ctx, s.x - 10 + i * 10, top - 4 - ph * 24, 5 * (1 - ph * 0.5)); } }
    if (s.slap > 0) { ctx.fillStyle = `rgba(255,${120 + 80 * Math.sin(now / 80)},40,0.9)`; flame(ctx, s.x + s.dir * (s.r + 14), s.y - 2, 7 + 2 * Math.sin(now / 70)); }
    if (s.slide > 0) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 6; i++) { S.circle(ctx, s.x - s.vx / (v || 1) * (10 + i * 7) + (Math.sin(now / 30 + i) * 6), s.y + 2 + Math.cos(now / 40 + i) * 5, 2.5); ctx.fill(); } }
  }
  function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  function heart(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.3, x - r * 0.6, y - r * 1.4, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.3, x, y + r); ctx.fill(); }
  function flame(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x + r, y - r * 0.5, x + r * 0.7, y); ctx.quadraticCurveTo(x, y + r * 0.5, x - r * 0.7, y); ctx.quadraticCurveTo(x - r, y - r * 0.5, x, y - r * 2); ctx.fill(); }
  function cookie(ctx, x, y, r) { ctx.fillStyle = '#c98b4a'; S.circle(ctx, x, y, r); ctx.fill(); ctx.fillStyle = '#4a2a10'; S.circle(ctx, x - r * 0.3, y - r * 0.2, r * 0.2); ctx.fill(); S.circle(ctx, x + r * 0.35, y + r * 0.1, r * 0.2); ctx.fill(); S.circle(ctx, x - r * 0.05, y + r * 0.45, r * 0.18); ctx.fill(); }

  function drawGoalie(ctx, g, T, now) {
    const gl = T.goalie;
    shadow(ctx, gl.x, gl.y + gl.h / 2 + 2, 18, 7);
    S.drawPerson(ctx, gl.x, gl.y + gl.h / 2, gl.def || HK.GOALIE_DEF, T.def, { goalie: true, dir: gl.dir, frame: gl.anim * 4, moving: Math.abs(gl.vy) > 30, down: gl.down > 0 });
    if (gl.slowT > 0) { ctx.fillStyle = 'rgba(240,250,255,0.9)'; for (let i = 0; i < 4; i++) { const ph = (now / 900 + i * 0.25) % 1; S.circle(ctx, gl.x - 14 + i * 9, gl.y - 30 + ph * 50, 2); ctx.fill(); } }
  }

  function drawPuck(ctx, p, now) {
    if (!p.owner && p.trail.length > 1) { ctx.strokeStyle = p.hard ? 'rgba(255,90,30,0.6)' : 'rgba(40,40,60,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y); for (const q of p.trail) ctx.lineTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    shadow(ctx, p.x + 1, p.y + 2, 6, 3.5);
    if (p.hard) { ctx.fillStyle = `rgba(255,120,30,${0.5 + 0.3 * Math.sin(now / 50)})`; S.circle(ctx, p.x, p.y, 10); ctx.fill(); }
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 6.5, 4.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 1.4, 6.5, 3.6, 0, 0, TAU); ctx.fill();
  }

  // Flèche de visée pendant qu'on charge un lancer (touche tenue) : part du joueur vers l'endroit où la rondelle va
  // partir (même calcul que le tir : coin opposé au gardien, ou droit devant si on tourne le dos au but), et elle
  // s'allonge, s'épaissit et passe du blanc à l'orange puis au rouge à mesure que la charge monte.
  function drawAimArrow(ctx, g, s, now) {
    const T = g.teams[s.team], side = -T.side, gx = HK.goalX(side), gl = g.teams[1 - s.team].goalie;
    const hm = G.mouth / 2 - 11, aimY = gl.y > CY() ? CY() - hm : CY() + hm;
    const toNet = Math.atan2(aimY - s.y, gx - s.x);
    const da = Math.atan2(Math.sin(s.face - toNet), Math.cos(s.face - toNet));
    const ang = Math.abs(da) > 1.1 ? s.face : toNet + da * 0.15;
    const c = Math.max(0, Math.min(1, s.charge));
    const len = 44 + 150 * c, w = 5 + 13 * c;
    const r = 255, gg = Math.round(c < 0.5 ? 255 - c * 2 * 70 : 185 - (c - 0.5) * 2 * 150), b = Math.round(c < 0.5 ? 255 - c * 2 * 200 : 55 - (c - 0.5) * 2 * 30);
    const col = `rgba(${r},${gg},${b},${0.55 + 0.4 * c})`;
    ctx.save(); ctx.translate(s.x + Math.cos(ang) * (s.r + 8), s.y + 4 + Math.sin(ang) * (s.r + 8)); ctx.rotate(ang);
    ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -w * 0.3); ctx.lineTo(len - w * 1.6, -w * 0.5); ctx.lineTo(len - w * 1.6, -w * 1.1); ctx.lineTo(len, 0); ctx.lineTo(len - w * 1.6, w * 1.1); ctx.lineTo(len - w * 1.6, w * 0.5); ctx.lineTo(0, w * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    // graduations de charge le long de la tige
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 1; i <= 4; i++) { const x = (len - w * 1.6) * i / 5; ctx.fillRect(x - 1, -w * 0.35, 2, w * 0.7); }
    ctx.restore();
    if (c >= 1) { // pleine charge : anneau qui pulse au bout de la flèche
      const k = (now / 400) % 1, tx = s.x + Math.cos(ang) * (s.r + 8 + len), ty = s.y + 4 + Math.sin(ang) * (s.r + 8 + len);
      ctx.strokeStyle = `rgba(255,70,40,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(tx, ty, 8 + 16 * k, (8 + 16 * k) * 0.6, 0, 0, TAU); ctx.stroke();
    }
  }

  function drawFx(ctx, g, layer, now) {
    for (const f of g.fx) {
      const k = 1 - f.t / f.t0;   // progression 0..1
      if (layer === 'under') {
        if (f.kind === 'charge') { ctx.strokeStyle = `rgba(255,120,40,${1 - k})`; ctx.lineWidth = 6 * (1 - k) + 1; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * k, 0, TAU); ctx.stroke(); }
        if (f.kind === 'crise') { for (let i = 0; i < 3; i++) { const kk = (k + i * 0.33) % 1; ctx.strokeStyle = `rgba(255,60,60,${0.8 * (1 - kk)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * kk, 0, TAU); ctx.stroke(); } }
        if (f.kind === 'capitaine') { ctx.strokeStyle = `rgba(255,210,60,${1 - k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 30 + 200 * k, 0, TAU); ctx.stroke(); }
        if (f.kind === 'aimant' && f.s) { ctx.strokeStyle = `rgba(220,40,60,0.5)`; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(f.s.x, f.s.y, 120 + 10 * Math.sin(now / 100), 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        if (f.kind === 'laser') { ctx.strokeStyle = `rgba(255,30,30,${1 - k})`; ctx.lineWidth = 14 * (1 - k) + 2; ctx.beginPath(); ctx.moveTo(f.x + Math.cos(f.ang) * 10, f.y - 24); ctx.lineTo(f.x + Math.cos(f.ang) * f.len, f.y - 24 + Math.sin(f.ang) * f.len); ctx.stroke(); ctx.strokeStyle = `rgba(255,220,220,${1 - k})`; ctx.lineWidth = 3; ctx.stroke(); }
        if (f.kind === 'blizzard') { ctx.fillStyle = 'rgba(200,235,255,0.18)'; const x0 = f.side < 0 ? R.x : CX(); ctx.fillRect(x0, R.y, R.w / 2, R.h); ctx.fillStyle = 'rgba(255,255,255,0.85)'; const rnd = HK.makeRand(3); for (let i = 0; i < 60; i++) { const px = x0 + rnd() * R.w / 2, ph = (now / 1500 + rnd()) % 1; S.circle(ctx, px + Math.sin(now / 300 + i) * 8, R.y + ph * R.h, 2 + rnd() * 2); ctx.fill(); } }
        if (f.kind === 'docteur') { ctx.strokeStyle = `rgba(80,255,120,${1 - k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 30 + 180 * k, 0, TAU); ctx.stroke(); }
        if (f.kind === 'tempsmort') { ctx.fillStyle = `rgba(255,255,255,${0.15 * (1 - k)})`; ctx.fillRect(R.x, R.y, R.w, R.h); }
        if (f.kind === 'flash') { ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.fillRect(R.x, R.y, R.w, R.h); }
        if (f.kind === 'cheat') { ctx.fillStyle = 'rgba(40,200,90,0.08)'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.fillStyle = 'rgba(60,255,120,0.5)'; ctx.font = 'bold 12px monospace'; const rnd = HK.makeRand(5); for (let i = 0; i < 40; i++) { const px = R.x + rnd() * R.w, ph = (now / 2000 + rnd()) % 1; ctx.fillText(((now / 90 + i) | 0) % 2 ? '1' : '0', px, R.y + ph * R.h); } }
      } else {
        if (f.kind === 'biscuits') { for (let i = 0; i < 8; i++) { const a = i * TAU / 8, rr = f.r * Math.min(1, k * 3), bounce = Math.abs(Math.sin(Math.min(1, k * 3) * Math.PI)) * 30; cookie(ctx, f.x + Math.cos(a) * rr, f.y - 10 + Math.sin(a) * rr * 0.6 - bounce, 6); } }
        if (f.kind === 'teleport') { ctx.fillStyle = `rgba(255,255,160,${1 - k})`; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + k * 3; star(ctx, f.x + Math.cos(a) * (10 + 40 * k), f.y - 20 + Math.sin(a) * (10 + 40 * k), 5); } }
        if (f.kind === 'bulle') { ctx.strokeStyle = `rgba(200,240,255,${1 - k})`; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(f.x - 20 + i * 10, f.y - 30 - k * 40 - i * 5, 4 + i, 0, TAU); ctx.stroke(); } }
        if (f.kind === 'fantome') { ctx.fillStyle = `rgba(230,230,255,${0.6 * (1 - k)})`; for (let i = 0; i < 5; i++) { S.circle(ctx, f.x - 20 + i * 10, f.y - 20 - k * 30, 10 + k * 10); ctx.fill(); } }
        if (f.kind === 'slap') { ctx.fillStyle = `rgba(255,140,30,${1 - k})`; for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + k * 2; flame(ctx, f.x + Math.cos(a) * 30 * k, f.y - 15 + Math.sin(a) * 30 * k, 8 * (1 - k)); } }
        if (f.kind === 'crise') { ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = 'bold 26px Arial Black, Arial'; ctx.textAlign = 'center'; const y = f.y - 60 - k * 20; ctx.strokeText('WAAAAH !', f.x, y); ctx.fillText('WAAAAH !', f.x, y); }
        if (f.kind === 'capitaine') { ctx.fillStyle = `rgba(255,220,80,${1 - k})`; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = 'bold 24px Arial Black, Arial'; ctx.textAlign = 'center'; const y = f.y - 60 - k * 20; ctx.strokeText('ALLEZ !', f.x, y); ctx.fillText('ALLEZ !', f.x, y); }
        if (['tempsmort', 'deal', 'objection', 'lemieux', 'chaise', 'docteur', 'nerfs', 'boucane'].includes(f.kind)) {
          const txt = { tempsmort: 'TEMPS D\'ARRÊT !', deal: 'DEAL !', objection: 'OBJECTION !', lemieux: '66 !', chaise: 'CHAISE MUSICALE !', docteur: 'TOUT LE MONDE DEBOUT !', nerfs: 'AAAH !', boucane: 'KOF KOF…' }[f.kind];
          const col = { tempsmort: '#fff', deal: '#7fe3ff', objection: '#ffd166', lemieux: '#ffd700', chaise: '#ffb3f0', docteur: '#7dffa0', nerfs: '#9fd3ff', boucane: '#bbb' }[f.kind];
          ctx.fillStyle = col; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = 'bold 24px Arial Black, Arial'; ctx.textAlign = 'center'; const y = f.y - 60 - k * 25; ctx.strokeText(txt, f.x, y); ctx.fillText(txt, f.x, y); ctx.globalAlpha = 1;
        }
        if (f.kind === 'charme') { ctx.fillStyle = `rgba(255,90,140,${1 - k})`; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + k; heart(ctx, f.x + Math.cos(a) * f.r * k, f.y - 20 + Math.sin(a) * f.r * k * 0.6, 6); } }
        if (f.kind === 'zoom' && f.s) { ctx.fillStyle = `rgba(255,230,80,0.9)`; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; if (k < 0.3) ctx.fillText('ZOOM ZOOM !', f.s.x, f.s.y - 60 - k * 60); }
        if (f.kind === 'glissade' && f.s) { ctx.fillStyle = `rgba(255,255,255,0.9)`; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; if (k < 0.5) ctx.fillText('WOUHOU !', f.s.x, f.s.y - 40 - k * 40); }
      }
    }
  }

  function label(ctx, x, y, text, bg, fg, small) {
    ctx.font = `bold ${small ? 10 : 11}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = bg; S.rr(ctx, x - w / 2, y - 8, w, 15, 5); ctx.fill();
    ctx.fillStyle = fg; ctx.fillText(text, x, y + 0.5);
  }

  function drawHud(ctx, g, ui, now) {
    ctx.fillStyle = '#0f1320'; ctx.fillRect(0, 0, W, 112);
    ctx.fillStyle = '#2a3350'; ctx.fillRect(0, 110, W, 2);
    for (let i = 0; i < 2; i++) {
      const T = g.teams[i], d = T.def, right = i === 1, sx = right ? -1 : 1, ox = right ? W : 0;
      S.drawLogo(ctx, ox + sx * 62, 50, d, 74);
      ctx.textBaseline = 'middle'; ctx.textAlign = right ? 'right' : 'left';
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Arial Black, Arial'; ctx.fillText(d.name.toUpperCase(), ox + sx * 118, 30);
      const who = ui.humans.find(h => h.team === i);
      ctx.font = '13px Arial'; ctx.fillStyle = who ? who.color : '#9aa4bf';
      ctx.fillText(who ? who.label : 'ORDI · ' + HK.DIFFICULTIES[g.difficulty], ox + sx * 118, 56);
      // joueur contrôlé + pouvoir
      const c = who ? g.controlled[i] : null;
      if (c) {
        const P = HK.POWERS[c.def.power];
        ctx.fillStyle = '#e8ecf5'; ctx.font = 'bold 14px Arial';
        ctx.fillText(c.def.name + ' · ' + P.icon + ' ' + P.name, ox + sx * 118, 78);
        const bw = 240, bx = right ? W - 118 - bw : 118, ready = c.cd <= 0, frac = ready ? 1 : 1 - c.cd / P.cd;
        ctx.fillStyle = '#242b40'; S.rr(ctx, bx, 92, bw, 10, 5); ctx.fill();
        ctx.fillStyle = ready ? (Math.sin(now / 150) > 0 ? '#ffd166' : '#ffb000') : '#5a6a9a'; S.rr(ctx, bx, 92, bw * frac, 10, 5); ctx.fill();
        ctx.fillStyle = ready ? '#ffd166' : '#8a94b0'; ctx.font = '11px Arial'; ctx.textAlign = right ? 'left' : 'right';
        ctx.fillText(ready ? 'PRÊT' : Math.ceil(c.cd) + ' s', right ? bx - 6 : bx + bw + 6, 97);
      } else if (who && g.goalieHuman === i) {
        ctx.fillStyle = '#e8ecf5'; ctx.font = 'bold 14px Arial'; ctx.fillText('Gardien · flèches pour bouger, C pour plonger', ox + sx * 118, 78);
      } else {
        const sc = T.skaters.map(s => s.def.name).join(' · ');
        ctx.fillStyle = '#7f8aa8'; ctx.font = '12px Arial'; ctx.fillText(sc, ox + sx * 118, 78);
      }
      // score
      ctx.fillStyle = d.accent || d.color; ctx.font = 'bold 64px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.fillText(String(T.score), right ? 810 : 470, 52);
      ctx.fillStyle = '#7f8aa8'; ctx.font = '11px Arial'; ctx.fillText('tirs ' + T.shots + ' · mises en échec ' + T.hits, right ? 810 : 470, 96);
    }
    // horloge
    ctx.fillStyle = '#1a2033'; S.rr(ctx, 540, 14, 200, 84, 10); ctx.fill();
    ctx.fillStyle = g.ot ? '#ffd166' : '#fff'; ctx.font = 'bold 44px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(g.clockText(), 640, 46);
    ctx.fillStyle = '#9aa4bf'; ctx.font = 'bold 14px Arial'; ctx.fillText(g.periodText(), 640, 82);
    // bancs et énergie (bas)
    ctx.fillStyle = 'rgba(10,12,20,0.85)'; ctx.fillRect(0, H - 34, W, 34);
    for (let i = 0; i < 2; i++) {
      const T = g.teams[i], right = i === 1; let x = right ? W - 20 : 20;
      ctx.textBaseline = 'middle'; ctx.font = 'bold 12px Arial';
      const items = T.skaters.filter(s => !s.bot).map(s => ({ s, on: true })).concat(T.bench.slice(0, 3).map(s => ({ s, on: false })));
      if (T.bench.length > 3) items.push({ s: { def: { name: '+' + (T.bench.length - 3) }, stamina: 1 }, on: false, more: true });
      if (right) items.reverse();
      for (const it of items) {
        const s = it.s, name = s.def.name, w = ctx.measureText(name).width + 16;
        if (right) x -= w;
        ctx.fillStyle = it.on ? T.def.color : '#2a2f40'; S.rr(ctx, x, H - 27, w, 20, 5); ctx.fill();
        ctx.fillStyle = it.on ? T.def.color2 : '#8a94b0'; ctx.textAlign = 'left'; ctx.fillText(name, x + 8, H - 17);
        ctx.fillStyle = '#000'; ctx.fillRect(x + 4, H - 6, w - 8, 3); ctx.fillStyle = s.stamina > 0.4 ? '#5ad66b' : '#e0a030'; ctx.fillRect(x + 4, H - 6, (w - 8) * s.stamina, 3);
        if (!it.on && !it.more) { ctx.fillStyle = '#8a94b0'; ctx.font = '9px Arial'; ctx.fillText('banc', x + w - 26, H - 23); ctx.font = 'bold 12px Arial'; }
        if (right) x -= 6; else x += w + 6;
      }
    }
  }

  function bigText(ctx, text, x, y, size, color, stroke) {
    ctx.font = `bold ${size}px Arial Black, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size / 9); ctx.strokeStyle = stroke || '#000'; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }

  function drawOverlay(ctx, g, ui, now) {
    const cx = CX(), cy = CY();
    if (g.phase === 'intro' && g.intro) {
      const ent = g.intro.part === 'entrance';
      bigText(ctx, ent ? 'ENTRÉE DES JOUEURS' : '🎵 HYMNE NATIONAL', cx, R.y + 40, 30, '#fff');
      if (!ent) { // petit drapeau au centre
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - 36, R.y + 64, 72, 40); ctx.fillStyle = '#d7332a'; ctx.fillRect(cx - 36, R.y + 64, 16, 40); ctx.fillRect(cx + 20, R.y + 64, 16, 40);
        ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍁', cx, R.y + 84);
      }
      if (Math.sin(now / 350) > -0.3) bigText(ctx, 'Entrée ou Espace pour passer', cx, R.y + R.h - 30, 16, '#ffd166');
    }
    if (g.phase === 'faceoff') {
      const a = Math.min(1, g.phaseT);
      ctx.globalAlpha = a;
      if (g.ot && g.period > HK.PERIODS && g.clock === 0) { bigText(ctx, 'PROLONGATION', cx, cy - 70, 44, '#ffd166'); bigText(ctx, 'Le premier but gagne !', cx, cy - 28, 20, '#fff'); }
      else bigText(ctx, 'MISE AU JEU', cx, cy - 50, 36, '#fff');
      ctx.globalAlpha = 1;
    }
    if (g.phase === 'goal' && g.lastGoal) {
      const lg = g.lastGoal, T = g.teams[lg.team].def, k = 3.4 - g.phaseT, sc = k < 0.3 ? 1.6 - k * 2 : 1 + 0.05 * Math.sin(now / 90);
      ctx.save(); ctx.translate(cx, cy - 60); ctx.scale(sc, sc);
      bigText(ctx, 'BUT !!!', 0, 0, 80, T.color, '#000'); ctx.restore();
      const who = lg.own ? 'Dans son propre filet… (' + (lg.scorer ? lg.scorer.def.name : '?') + ')' : (lg.scorer ? lg.scorer.def.name + ' marque !' : 'But !');
      bigText(ctx, who, cx, cy + 10, 30, '#fff');
      if (lg.assist) bigText(ctx, 'Passe : ' + lg.assist.def.name, cx, cy + 44, 18, '#ffd166');
      ctx.fillStyle = `rgba(255,255,255,${0.12 * Math.abs(Math.sin(now / 80))})`; ctx.fillRect(0, 0, W, H);
    }
    if (g.phase === 'periodEnd') {
      bigText(ctx, 'FIN DE LA ' + ['', '1re', '2e', '3e'][g.period] + ' PÉRIODE', cx, cy - 30, 40, '#fff');
      bigText(ctx, g.teams[0].def.name + ' ' + g.teams[0].score + ' — ' + g.teams[1].score + ' ' + g.teams[1].def.name, cx, cy + 20, 26, '#ffd166');
    }
    if (g.phase === 'over') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(R.x, R.y, R.w, R.h);
      if (g.winner >= 0) { const T = g.teams[g.winner].def; S.drawLogo(ctx, cx, cy - 90, T, 90); bigText(ctx, 'VICTOIRE DES ' + T.name.replace('Les ', '').toUpperCase() + ' !', cx, cy, 48, T.color); }
      else bigText(ctx, 'MATCH NUL', cx, cy, 48, '#fff');
      bigText(ctx, g.teams[0].score + ' — ' + g.teams[1].score, cx, cy + 50, 36, '#fff');
      if (Math.sin(now / 300) > 0) bigText(ctx, 'Entrée pour continuer', cx, cy + 100, 18, '#ffd166');
    }
    // messages
    let ty = R.y + (ui.drill ? 76 : 18);
    for (const t of ui.toasts) { ctx.globalAlpha = Math.min(1, t.t); label(ctx, cx, ty, t.text, t.color || 'rgba(0,0,0,0.75)', '#fff'); ty += 20; }
    ctx.globalAlpha = 1;
  }

  HK.render = function (ctx, g, ui) {
    if (!rink) buildRink();
    const now = performance.now();
    ctx.save();
    if (ui.shake > 0) ctx.translate((Math.random() - 0.5) * ui.shake * 8, (Math.random() - 0.5) * ui.shake * 8);
    ctx.drawImage(rink, 0, 0);
    const lampSide = g.phase === 'goal' && g.lastGoal ? -g.teams[g.lastGoal.team].side : 0;
    drawNet(ctx, -1, lampSide === -1); drawNet(ctx, 1, lampSide === 1);
    drawFx(ctx, g, 'under', now);
    for (const h of ui.humans) { const s = g.controlled[h.team]; if (s && s.charge >= 0 && g.puck.owner === s) drawAimArrow(ctx, g, s, now); } // visée du lancer chargé
    for (const c of g.cones) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 3, c.r + 2, (c.r + 2) * 0.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(c.x - c.r, c.y + 2); ctx.lineTo(c.x, c.y - c.r * 2.2); ctx.lineTo(c.x + c.r, c.y + 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(c.x - c.r * 0.55, c.y - c.r * 0.9, c.r * 1.1, 3); }
    for (const t of g.targets) { if (!t.active) continue; for (let i = 3; i >= 1; i--) { ctx.fillStyle = i % 2 ? '#e8352b' : '#fff'; S.circle(ctx, t.x, t.y, t.r * i / 3); ctx.fill(); } }
    if (ui.drill && ui.drill.gates) ui.drill.gates.forEach((gt, i) => { const cur = i === ui.drill.gateIdx, done = i < ui.drill.gateIdx; ctx.strokeStyle = done ? 'rgba(90,214,107,0.5)' : cur ? '#ffd166' : 'rgba(120,130,160,0.5)'; ctx.lineWidth = cur ? 4 : 2; ctx.setLineDash(cur ? [] : [6, 6]); ctx.beginPath(); ctx.arc(gt.x, gt.y, gt.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = ctx.strokeStyle; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), gt.x, gt.y); });
    if (g.smoke) { const sm = g.smoke, a = Math.min(1, sm.t / 0.8) * 0.75; const rnd = HK.makeRand(11); for (let i = 0; i < 26; i++) { const ang = rnd() * TAU, rr = rnd() * sm.r * 0.85, wob = Math.sin(now / 400 + i) * 8; ctx.fillStyle = `rgba(${150 + rnd() * 60 | 0},${150 + rnd() * 60 | 0},${160 + rnd() * 60 | 0},${a * (0.5 + rnd() * 0.4)})`; S.circle(ctx, sm.x + Math.cos(ang) * rr + wob, sm.y + Math.sin(ang) * rr * 0.8 - 10, 22 + rnd() * 26); ctx.fill(); } }
    // entités triées par y
    const items = [];
    for (const T of g.teams) { for (const s of T.skaters) items.push({ y: s.y, f: () => drawSkater(ctx, g, s, now) }); items.push({ y: T.goalie.y + T.goalie.h / 2, f: () => drawGoalie(ctx, g, T, now) }); }
    const p = g.puck; items.push({ y: p.y + (p.owner ? 1 : 0), f: () => drawPuck(ctx, p, now) });
    items.sort((a, b) => a.y - b.y); for (const it of items) it.f();
    drawFx(ctx, g, 'over', now);
    // étiquettes
    for (const T of g.teams) for (const s of T.skaters) {
      const size = s.def.size, top = s.y - (13 + 21 + 20 * (1 + Math.max(0, 1 - size) * 0.9)) * size - 12;
      const who = ui.humans.find(h => g.controlled[h.team] === s);
      const hum = ui.humans.find(h => h.team === s.team), idx = hum && !s.bot ? g.teams[s.team].skaters.indexOf(s) : -1;
      const keys = hum ? (hum.n === 1 ? ['1', '2', '3'] : ['8', '9', '0']) : [];
      label(ctx, s.x, top, (idx >= 0 && idx < 3 ? keys[idx] + ' · ' : '') + s.def.name + (s.def.birth && HK.isBirthday(s.def.birth) ? ' 🎂' : ''), who ? who.color : 'rgba(0,0,0,0.6)', who ? '#000' : '#fff');
      if (who) { ctx.fillStyle = who.color; const by = top - 14 + Math.sin(now / 120) * 2; ctx.beginPath(); ctx.moveTo(s.x - 7, by - 8); ctx.lineTo(s.x + 7, by - 8); ctx.lineTo(s.x, by); ctx.closePath(); ctx.fill(); }
    }
    for (const T of g.teams) for (const s of T.box) { S.drawPerson(ctx, s.x, s.y, s.def, T.def, { dir: s.dir, frame: 0, scale: 0.8 }); label(ctx, s.x, s.y + 12, s.def.name + ' · punition ' + Math.ceil(s.penalty) + ' s', '#d9342b', '#fff', true); }
    for (const h of ui.humans) if (g.goalieHuman === h.team) { const gl = g.teams[h.team].goalie; ctx.fillStyle = h.color; const by = gl.y - 46 + Math.sin(now / 120) * 2; ctx.beginPath(); ctx.moveTo(gl.x - 7, by - 8); ctx.lineTo(gl.x + 7, by - 8); ctx.lineTo(gl.x, by); ctx.closePath(); ctx.fill(); label(ctx, gl.x, by - 16, 'Toi (gardien)', h.color, '#000'); }
    ctx.restore();
    drawHud(ctx, g, ui, now);
    if (ui.drill) drawDrill(ctx, ui.drill, now);
    drawOverlay(ctx, g, ui, now);
  };
  function drawDrill(ctx, d, now) {
    const x = CX() - 300, y = R.y + 6, w = 600, h = 56;
    ctx.fillStyle = 'rgba(10,12,24,0.85)'; S.rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = d.state === 'won' ? '#5ad66b' : d.state === 'lost' ? '#e8352b' : '#3a4466'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial';
    ctx.fillText(d.name + '  ·  ' + d.level, x + 14, y + 16);
    ctx.fillStyle = '#c9d2ea'; ctx.font = '13px Arial'; ctx.fillText(d.text, x + 14, y + 40);
    ctx.textAlign = 'right'; ctx.fillStyle = d.time < 10 ? '#ff6b5e' : '#ffd166'; ctx.font = 'bold 26px Arial Black, Arial'; ctx.fillText(Math.ceil(d.time) + ' s', x + w - 14, y + 20);
    ctx.fillStyle = '#242b40'; S.rr(ctx, x + w - 200, y + 36, 186, 10, 5); ctx.fill(); ctx.fillStyle = '#5ad66b'; S.rr(ctx, x + w - 200, y + 36, 186 * d.frac, 10, 5); ctx.fill();
    if (d.state === 'won' || d.state === 'lost') { ctx.save(); ctx.translate(CX(), CY() - 40); ctx.scale(1 + 0.04 * Math.sin(now / 90), 1 + 0.04 * Math.sin(now / 90)); bigText(ctx, d.state === 'won' ? 'RÉUSSI !' : 'RATÉ…', 0, 0, 64, d.state === 'won' ? '#5ad66b' : '#ff6b5e'); ctx.restore(); }
  }
  HK.renderReset = () => { rink = null; };
})(window.HK);
