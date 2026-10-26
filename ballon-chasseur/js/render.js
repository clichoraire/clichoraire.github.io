// Rendu du match : terrain (quatre décors), joueurs triés par profondeur, balle, pouvoirs et effets, tableau des points
// de vie et des pouvoirs, écran d'accueil et galerie de la famille.
(function (BC) {
  'use strict';
  const S = BC.sprites, C = BC.COURT, W = BC.W, H = BC.H;
  const R = BC.render = {};
  const rr = S.rr, circle = S.circle;
  const seeded = (n) => { let x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const POSE = { ko: 'angel', getup: 'pickup', idle: 'idle', gone: 'idle', stun: 'catch', bubble: 'jump', spin: 'windup', windup: 'windup', throw: 'throw', catch: 'catch', hit: 'hit', down: 'down', jump: 'jump', pickup: 'pickup', return: 'idle' };

  // ---------- Décors ----------
  function drawBackground(ctx, g, t) {
    const theme = g.court, id = g.courtId;
    // ciel / mur du fond
    const sky = ctx.createLinearGradient(0, 0, 0, C.top);
    sky.addColorStop(0, theme.sky); sky.addColorStop(1, S.shade(theme.sky, 0.78));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, C.top + 10);
    const GROUND = 190;   // au-dessus : décor ; en dessous : sol hors terrain où marchent les extérieurs
    if (theme.monster) {
      const accent=theme.accent, biome=theme.biome;
      ctx.fillStyle='#efe8c7'; circle(ctx,1030,60,30);ctx.fill();
      ctx.fillStyle=theme.sky;circle(ctx,1044,52,28);ctx.fill();
      for(let i=0;i<12;i++){
        const x=35+i*118,h=55+seeded(i+7)*85;
        ctx.fillStyle=S.shade(theme.floor,.62);
        if(biome==='forest'||biome==='swamp'){
          ctx.fillRect(x-7,GROUND-h,14,h);ctx.beginPath();ctx.moveTo(x-40,GROUND-h*.25);ctx.lineTo(x,GROUND-h-35);ctx.lineTo(x+40,GROUND-h*.25);ctx.fill();
        }else{
          ctx.beginPath();ctx.moveTo(x-40,GROUND);ctx.lineTo(x-28,GROUND-h);ctx.lineTo(x+7,GROUND-h-22);ctx.lineTo(x+34,GROUND);ctx.fill();
          if(biome==='crypt'){ctx.fillStyle=accent;ctx.fillRect(x-9,GROUND-h+22,6,15);}
        }
      }
      ctx.fillStyle=accent+'22';for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(160+i*330+Math.sin(t*.3+i)*20,165+i%2*12,210,13,0,0,Math.PI*2);ctx.fill();}
    } else if (id === 'gym') {
      // gymnase : mur beige, bannières des familles, estrades avec la foule
      ctx.fillStyle = '#3a3f52'; ctx.fillRect(0, 0, W, 36);
      ctx.fillStyle = '#d9c9a3'; ctx.fillRect(0, 36, W, 70);
      for (let i = 0; i < 4; i++) { const tm = BC.TEAMS[i]; ctx.fillStyle = tm.color; rr(ctx, 130 + i * 300, 58, 100, 42, 6); ctx.fill(); ctx.fillStyle = tm.color2; ctx.font = 'bold 20px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.fillText(tm.short, 180 + i * 300, 86); }
      bleachers(ctx, 106, GROUND - 106, t, '#7a5a3a', false, 3);
      ctx.fillStyle = '#2b2f3c'; ctx.fillRect(0, GROUND - 6, W, 8);
    } else if (id === 'parc') {
      ctx.fillStyle = '#fff6c9'; circle(ctx, 1080, 70, 46); ctx.fill();
      for (let i = 0; i < 6; i++) { const x = 60 + i * 230 + seeded(i) * 60; cloud(ctx, x + Math.sin(t * 0.05 + i) * 15, 50 + seeded(i + 9) * 50, 0.8 + seeded(i + 3) * 0.5); }
      ctx.fillStyle = '#4c8f3c'; ctx.fillRect(0, 130, W, GROUND - 130);
      for (let i = 0; i < 9; i++) tree(ctx, 50 + i * 150 + seeded(i + 20) * 40, GROUND - 4 - seeded(i + 2) * 10, 0.8 + seeded(i) * 0.4);
      bleachers(ctx, 140, GROUND - 140, t, '#6e4b2a', true, 2);
    } else if (id === 'ruelle') {
      // ruelle : briques, fenêtres, portes de garage, corde à linge
      ctx.fillStyle = '#8a4a3a'; ctx.fillRect(0, 40, W, GROUND - 40);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 40; y < GROUND; y += 18) for (let x = (y / 18) % 2 ? 0 : 20; x < W; x += 40) ctx.fillRect(x, y, 19, 8);
      for (let i = 0; i < 5; i++) { const x = 40 + i * 260; ctx.fillStyle = '#4f6d8a'; ctx.fillRect(x, 50, 60, 70); ctx.fillStyle = '#2b3744'; ctx.fillRect(x + 5, 55, 50, 60); ctx.fillStyle = 'rgba(255,230,150,0.35)'; ctx.fillRect(x + 9, 59, 20, 24); }
      for (let i = 0; i < 4; i++) { const x = 160 + i * 300; ctx.fillStyle = '#c9c3b4'; rr(ctx, x, 120, 130, GROUND - 120, 4); ctx.fill(); ctx.fillStyle = '#9a9488'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 6, 130 + k * 20, 118, 3); }
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 80); ctx.quadraticCurveTo(640, 120, W, 70); ctx.stroke();
      for (let i = 0; i < 7; i++) { const x = 80 + i * 180, y = 80 + (1 - Math.pow((x - 640) / 640, 2)) * 36; ctx.fillStyle = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#9b59b6', '#2ecc71', '#e67e22'][i]; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + i) * 0.08); ctx.fillRect(-9, 0, 18, 24 + (i % 2) * 8); ctx.restore(); }
    } else {
      // plage : mer, vagues, parasols, mouettes
      const sea = ctx.createLinearGradient(0, 100, 0, GROUND); sea.addColorStop(0, '#2d7fc9'); sea.addColorStop(1, '#5fb2e8');
      ctx.fillStyle = '#fff2b0'; circle(ctx, 220, 60, 34); ctx.fill();
      ctx.fillStyle = sea; ctx.fillRect(0, 100, W, GROUND - 100);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); const y = 118 + i * 18 + Math.sin(t * 1.5 + i) * 3; for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 40 + t * 2 + i) * 3); ctx.stroke(); }
      for (let i = 0; i < 3; i++) { const x = (t * 40 + i * 450) % (W + 100) - 50, y = 50 + i * 18 + Math.sin(t * 3 + i) * 6; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x - 4, y - 8, x, y); ctx.quadraticCurveTo(x + 4, y - 8, x + 12, y); ctx.stroke(); }
    }
    // sol hors terrain
    ctx.fillStyle = S.shade(theme.floor, 0.72); ctx.fillRect(0, GROUND, W, H - GROUND);
    if (id === 'plage') for (let i = 0; i < 4; i++) { const x = 140 + i * 320 + seeded(i + 7) * 60, y = GROUND + 4; ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 2, y - 30, 4, 40); ctx.fillStyle = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'][i]; ctx.beginPath(); ctx.arc(x, y - 30, 40, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x + k * 19, y - 66 + Math.abs(k) * 9); ctx.stroke(); } }
    // terrain
    ctx.fillStyle = theme.floor; ctx.fillRect(C.left, C.top, C.right - C.left, C.bottom - C.top);
    ctx.fillStyle = theme.floor2; for (let x = C.left; x < C.right; x += 60) ctx.fillRect(x, C.top, 30, C.bottom - C.top);
    if (id === 'gym') { ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; for (let y = C.top; y < C.bottom; y += 16) { ctx.beginPath(); ctx.moveTo(C.left, y); ctx.lineTo(C.right, y); ctx.stroke(); } }
    ctx.strokeStyle = theme.line; ctx.lineWidth = 4; ctx.strokeRect(C.left, C.top, C.right - C.left, C.bottom - C.top);
    ctx.beginPath(); ctx.moveTo(C.mid, C.top); ctx.lineTo(C.mid, C.bottom); ctx.stroke();
    ctx.lineWidth = 2; circle(ctx, C.mid, (C.top + C.bottom) / 2, 40); ctx.stroke();
    // couloirs extérieurs (pointillés)
    ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(C.left - BC.LANE - 30, C.top - BC.LANE - 24); ctx.lineTo(C.right + BC.LANE + 30, C.top - BC.LANE - 24); ctx.moveTo(C.left - BC.LANE - 30, C.bottom + BC.LANE + 24); ctx.lineTo(C.right + BC.LANE + 30, C.bottom + BC.LANE + 24); ctx.stroke(); ctx.setLineDash([]);
  }
  function bleachers(ctx, y, h, t, wood, light, rows) {
    rows = rows || 4; const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = r % 2 ? wood : S.shade(wood, 0.85); ctx.fillRect(0, y + r * rh, W, rh);
      for (let i = 0; i < 44; i++) {
        const x = 15 + i * 29 + (r % 2) * 14, bob = Math.sin(t * 3 + i * 1.7 + r) * (r === 0 ? 3 : 2);
        const hue = seeded(i * 7 + r) * 360;
        ctx.fillStyle = `hsl(${hue},55%,${light ? 55 : 48}%)`; rr(ctx, x - 9, y + r * rh + 8 + bob, 18, rh - 6, 5); ctx.fill();
        ctx.fillStyle = ['#f0c8a0', '#e8b98f', '#d9a070', '#f6d6bd'][i % 4]; circle(ctx, x, y + r * rh + 7 + bob, 6); ctx.fill();
      }
    }
  }
  function cloud(ctx, x, y, s) { ctx.fillStyle = 'rgba(255,255,255,0.92)'; for (const [dx, dy, r] of [[0, 0, 22], [22, -6, 18], [-22, 2, 16], [8, 10, 15]]) { circle(ctx, x + dx * s, y + dy * s, r * s); ctx.fill(); } }
  function tree(ctx, x, y, s) { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 6 * s, y - 20 * s, 12 * s, 40 * s); ctx.fillStyle = '#2f7a2a'; circle(ctx, x, y - 42 * s, 34 * s); ctx.fill(); ctx.fillStyle = '#3f9a36'; circle(ctx, x - 14 * s, y - 32 * s, 22 * s); ctx.fill(); circle(ctx, x + 16 * s, y - 36 * s, 24 * s); ctx.fill(); }

  // ---------- Match ----------
  R.draw = function (ctx, g, ui) {
    const t = g.time;
    ctx.save();
    if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    drawBackground(ctx, g, t);
    // blizzard : la moitié de l'équipe ralentie est sous la neige
    for (let tm = 0; tm < 2; tm++) if (g.blizzard[tm] > 0) {
      const x0 = tm === 0 ? C.left - BC.LANE - 20 : C.mid, x1 = tm === 0 ? C.mid : C.right + BC.LANE + 20, k = Math.min(1, g.blizzard[tm] / 2);
      ctx.fillStyle = `rgba(200,230,255,${0.14 * k})`; ctx.fillRect(x0, C.top - BC.LANE - 20, x1 - x0, C.bottom - C.top + BC.LANE * 2 + 40);
      ctx.fillStyle = `rgba(255,255,255,${0.85 * k})`;
      for (let i = 0; i < 60; i++) { const sx = x0 + seeded(i * 3 + tm) * (x1 - x0) + Math.sin(t * 1.5 + i) * 14, sy = 120 + ((seeded(i * 5) * 600 + t * (60 + seeded(i) * 60)) % 600); circle(ctx, sx, sy, 1.6 + seeded(i * 7) * 2); ctx.fill(); }
    }
    // auras (cri du capitaine) et ombres
    for (const p of g.players) {
      if (p.state === 'gone') continue;
      if (p.fx.rageT > 0 && p.alive) { ctx.fillStyle = `rgba(255,70,50,${0.22 + Math.sin(t * 8) * 0.08})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, 26 * p.def.size + 6, 10, 0, 0, Math.PI * 2); ctx.fill(); }
      const k = 1 - Math.min(0.7, p.z / 260); ctx.fillStyle = `rgba(0,0,0,${0.25 * k})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, 16 * p.def.size * k + 4, 6 * k + 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    const b = g.ball;
    if (b.state !== 'held') { const k = 1 - Math.min(0.75, b.z / 260); ctx.fillStyle = `rgba(0,0,0,${0.28 * k})`; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * k + 2, b.r * 0.45 * k + 1, 0, 0, Math.PI * 2); ctx.fill(); }
    for (const q of g.projectiles) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    // joueurs, balle et projectiles triés par profondeur
    const items = g.players.filter(p => p.state !== 'gone').map(p => ({ y: p.y, p }));
    if (b.state !== 'held') items.push({ y: b.y + 1, ball: true });
    for (const q of g.projectiles) items.push({ y: q.y + 2, proj: q });
    items.sort((a, c) => a.y - c.y);
    for (const it of items) {
      if (it.ball) { drawBall(ctx, g, b); continue; }
      if (it.proj) { drawProjectile(ctx, it.proj, t); continue; }
      drawPlayer(ctx, g, it.p, ui, t);
    }
    // ligne de visée du porteur humain : jaune = diagonale choisie, vert = visée assistée sur un adversaire, blanc = tout droit
    const holder = b.holder;
    if (ui && holder && holder.alive && g.phase === 'play' && ui.humans.find(h => h.team === holder.team) && (holder.state === 'idle' || holder.state === 'jump' || holder.state === 'windup')) drawAim(ctx, g, holder);
    drawFx(ctx, g);
    ctx.restore();
    if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash})`; ctx.fillRect(0, 0, W, H); }
    drawHud(ctx, g, ui);
    drawMessages(ctx, g);
  };

  function drawPlayer(ctx, g, p, ui, t) {
    const team = g.teams[p.team], F = p.fx;
    const pose = POSE[p.state] || 'idle';
    const human = ui && ui.humans.find(h => h.team === p.team && g.controlled(p.team) === p);
    const hgt = 50 * Math.max(0.6, p.def.size);
    let dir = p.facing, alpha = p.state === 'ko' ? Math.max(0, 1 - p.ko / 2.6) : (p.zone === 'out' ? 0.95 : 1);
    if (p.state === 'spin') dir = Math.cos(p.stateT * 45) >= 0 ? 1 : -1;   // toupie
    if (F.ghostT > 0) alpha = 0.35;
    // cheval et licorne d'Alexie
    if (F.horseT > 0) drawHorse(ctx, p, t, dir);
    ctx.save(); ctx.translate(0, -p.z - (F.horseT > 0 ? 18 : 0));
    S.drawPerson(ctx, p.x, p.y, p.def, team, { dir, frame: p.frame, moving: p.moving, dash: p.dash.active, pose, ball: p.hasBall && pose !== 'hit', t: p.state === 'ko' ? p.ko : p.stateT, alpha });
    // aimant de Jessica
    if (F.magnetT > 0) { const mx = p.x + dir * 22, my = p.y - 30; ctx.save(); ctx.translate(mx, my); ctx.rotate(dir > 0 ? -Math.PI / 2 : Math.PI / 2); ctx.lineWidth = 7; ctx.strokeStyle = '#d33'; ctx.beginPath(); ctx.arc(0, 0, 9, Math.PI, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-9, 8); ctx.moveTo(9, 0); ctx.lineTo(9, 8); ctx.stroke(); ctx.restore();
      const bb = g.ball; if (bb.state === 'magnet') { ctx.strokeStyle = `rgba(255,120,255,${0.5 + Math.sin(t * 20) * 0.3})`; ctx.lineWidth = 2; ctx.setLineDash([4, 8]); for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo((mx + bb.x) / 2, (my + bb.y - bb.z) / 2 + k * 30, bb.x, bb.y - bb.z); ctx.stroke(); } ctx.setLineDash([]); } }
    // figé par l'électricité
    if (p.state === 'stun') { ctx.strokeStyle = `rgba(255,255,120,${0.6 + Math.sin(t * 30) * 0.4})`; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = t * 9 + i * 1.6, cx = p.x + Math.cos(a) * 18, cy = p.y - hgt * 0.6 + Math.sin(a * 1.3) * 16; ctx.beginPath(); ctx.moveTo(cx - 5, cy - 6); ctx.lineTo(cx + 1, cy - 1); ctx.lineTo(cx - 2, cy + 1); ctx.lineTo(cx + 5, cy + 7); ctx.stroke(); } }
    // ralenti par le blizzard : flocons sur la tête
    if (F.slowT > 0 && p.alive) { ctx.fillStyle = 'rgba(220,240,255,0.9)'; for (let i = 0; i < 3; i++) circle(ctx, p.x - 10 + i * 10, p.y - hgt - 6 + Math.sin(t * 4 + i) * 3, 2.2), ctx.fill(); }
    // toupie d'Edison
    if (p.state === 'spin') { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(p.x, p.y - 12 - i * 16, 22 + i * 7, 7, 0, t * 20 + i, t * 20 + i + 4); ctx.stroke(); } }
    ctx.restore();
    // dans une bulle de savon
    if (p.state === 'bubble') { const r = hgt * 0.62 + 10, cy = p.y - p.z - hgt / 2; ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(160,220,255,0.22)'; circle(ctx, p.x, cy, r); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(p.x - r * 0.4, cy - r * 0.45, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    // charge du lancer : barre au-dessus de la tête
    const topY = p.y - p.z - hgt - 22;
    if (p.charging) { const w = 44, k = p.charge; ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(ctx, p.x - w / 2 - 2, topY - 2, w + 4, 10, 4); ctx.fill(); ctx.fillStyle = k < 0.5 ? '#ffd166' : k < 0.9 ? '#ff8a3a' : '#ff3a3a'; rr(ctx, p.x - w / 2, topY, w * k, 6, 3); ctx.fill(); if (k >= 1) { ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('MAX', p.x, topY - 6); } }
    // indicateur du joueur contrôlé et nom
    if (human && p.alive) { ctx.fillStyle = human.color; ctx.beginPath(); ctx.moveTo(p.x, topY + 8); ctx.lineTo(p.x - 9, topY - 6); ctx.lineTo(p.x + 9, topY - 6); ctx.closePath(); ctx.fill(); ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(human.label, p.x, topY - 10); }
    if (p.zone === 'in' && p.alive && (g.phase === 'ready' || t < 4)) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(p.def.name, p.x, topY + (human ? 24 : 6)); }
    if (p.lent && (g.phase === 'ready' || t < 4)) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText(p.def.name + ' (cousin prêté)', p.x, topY + 6); }
    // pouvoir armé : l'icône scintille au-dessus du joueur
    if (p.power.armed && p.alive) { const P = BC.POWERS[p.power.id]; ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 14) * 0.4; ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.fillText(P.icon, p.x + 22, topY - 2); ctx.restore(); }
  }
  // Cheval d'Alexie (sous elle) et sa licorne à côté.
  function drawHorse(ctx, p, t, dir) {
    const bob = Math.sin(t * 12) * 2;
    const horse = (x, y, s, body, mane, unicorn) => {
      ctx.save(); ctx.translate(x, y + bob); ctx.scale(dir * s, s);
      ctx.fillStyle = body;
      for (const k of [-10, -3, 5, 12]) { ctx.fillRect(k - 2, -14, 4, 14 + Math.sin(t * 14 + k) * 2); }
      ctx.beginPath(); ctx.ellipse(0, -20, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18, -30, 8, 6, 0.6, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(14, -36, 10, 8);
      ctx.fillStyle = mane; ctx.beginPath(); ctx.ellipse(10, -32, 9, 4, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-20, -22, 4, 8, 0.4, 0, Math.PI * 2); ctx.fill();
      if (unicorn) { ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.moveTo(22, -38); ctx.lineTo(26, -50); ctx.lineTo(29, -37); ctx.closePath(); ctx.fill(); const cols = ['#ff6b6b', '#ffd166', '#7dffa0', '#5fe3ff', '#d7a6ff']; cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(2 - i * 4, -34 + i, 4, 6); }); }
      ctx.fillStyle = '#222'; circle(ctx, 22, -33, 1.5); ctx.fill();
      ctx.restore();
    };
    horse(p.x, p.y, 1.1, '#8b5a2b', '#3b2614', false);
    horse(p.x - dir * 48, p.y + 6, 0.85, '#fff', '#f9c', true);
  }
  function drawProjectile(ctx, q, t) {
    if (q.kind === 'bubble') { const y = q.y - q.z; ctx.save(); ctx.fillStyle = 'rgba(160,220,255,0.25)'; circle(ctx, q.x, y, q.r); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(q.x - q.r * 0.4, y - q.r * 0.4, q.r * 0.25, q.r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else if (q.kind === 'cookie') cookie(ctx, q.x, q.y - q.z, 8, t * 10);
  }
  function cookie(ctx, x, y, r, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.fillStyle = '#c98b4a'; circle(ctx, 0, 0, r); ctx.fill(); ctx.fillStyle = '#5a3a1a'; for (const [dx, dy] of [[-0.4, -0.3], [0.3, -0.4], [0.1, 0.35], [-0.35, 0.3], [0.45, 0.1]]) { circle(ctx, dx * r, dy * r, r * 0.18); ctx.fill(); } ctx.restore(); }
  function drawAim(ctx, g, p) {
    const a = g.aimDir(p, p.lastMove), z = p.z + 30, len = p.zone === 'in' ? 460 : 320;
    ctx.save(); ctx.globalAlpha = 0.85; ctx.setLineDash([7, 11]); ctx.lineWidth = 2.5;
    ctx.strokeStyle = a.manual ? '#ffd166' : a.assisted ? '#7dffa0' : 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(p.x + a.x * 26, p.y + a.y * 26 - z); ctx.lineTo(p.x + a.x * len, p.y + a.y * len - z); ctx.stroke();
    ctx.setLineDash([]);
    if (a.target && !a.manual) { ctx.strokeStyle = a.assisted ? '#7dffa0' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(a.target.x, a.target.y + 2, 20, 8, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  function drawBall(ctx, g, b) {
    if (!b.visible) return;
    const P = b.power ? BC.POWERS[b.power] : null, pw = b.power;
    if (b.trail.length > 1) { ctx.save(); const rainbow = ['#ff6b6b', '#ffd166', '#7dffa0', '#5fe3ff', '#d7a6ff', '#ff9ccf']; for (let i = 0; i < b.trail.length; i++) { const q = b.trail[i], k = i / b.trail.length; ctx.globalAlpha = 0.4 * k; ctx.fillStyle = pw === 'licorne' ? rainbow[i % rainbow.length] : pw === 'fusee' ? '#ffa030' : pw === 'triche' ? '#8f8' : '#bbb'; circle(ctx, q.x, q.y - q.z, b.r * (0.4 + 0.6 * k)); ctx.fill(); } ctx.restore(); }
    let x = b.x, y = b.y - b.z;
    if (pw === 'triche' && Math.random() < 0.3) { x += (Math.random() - 0.5) * 10; y += (Math.random() - 0.5) * 10; }   // la balle « bogue »
    S.drawBall(ctx, x, y, b.r, { glow: P ? P.color : (b.smash ? '#fff' : null), alpha: b.alpha, spin: b.t * 10, color: pw === 'boulet' ? '#333' : undefined, color2: pw === 'boulet' ? '#777' : undefined });
    if (pw === 'fusee') { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.fillStyle = '#ddd'; rr(ctx, -b.r - 14, -5, 16, 10, 3); ctx.fill(); ctx.fillStyle = '#d33'; ctx.beginPath(); ctx.moveTo(-b.r - 14, -5); ctx.lineTo(-b.r - 20, -10); ctx.lineTo(-b.r - 14, 0); ctx.lineTo(-b.r - 20, 10); ctx.lineTo(-b.r - 14, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
    if (pw === 'biscuit') cookie(ctx, x + 12, y - 12, 6, b.t * 8);
  }
  function drawFx(ctx, g) {
    for (const f of g.fx) {
      const k = f.t / f.dur;
      if (f.kind === 'pow') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = f.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = `bold ${f.text.length > 3 ? 20 : 26}px Arial Black, Arial`; ctx.textAlign = 'center'; const y = f.y - f.z - k * 40; ctx.strokeText(f.text, f.x, y); ctx.fillText(f.text, f.x, y); ctx.restore(); }
      else if (f.kind === 'burst') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffe36b'; const r = 14 + k * 30; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr_ = i % 2 ? r : r * 0.5; ctx.lineTo(f.x + Math.cos(a) * rr_, f.y - f.z + Math.sin(a) * rr_); } ctx.closePath(); ctx.fill(); ctx.restore(); }
      else if (f.kind === 'spark') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.color; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * 6, f.y - f.z + Math.sin(a) * 6); ctx.lineTo(f.x + Math.cos(a) * (10 + k * 30), f.y - f.z + Math.sin(a) * (10 + k * 30)); ctx.stroke(); } ctx.restore(); }
      else if (f.kind === 'snow') { ctx.fillStyle = `rgba(255,255,255,${1 - k})`; circle(ctx, f.x, f.y - f.z + k * 20, 2.5); ctx.fill(); }
      else if (f.kind === 'fire') { ctx.fillStyle = `rgba(255,${Math.round(160 - k * 120)},40,${1 - k})`; circle(ctx, f.x, f.y - f.z, 7 * (1 - k) + 2); ctx.fill(); }
      else if (f.kind === 'speed') { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y - f.z); ctx.lineTo(f.x - 18 - k * 20, f.y - f.z); ctx.stroke(); }
      else if (f.kind === 'laser') { ctx.save(); ctx.globalAlpha = 1 - k; for (const ly of f.lines) { ctx.strokeStyle = '#8ff'; ctx.lineWidth = 6 - k * 4; ctx.shadowColor = '#8ff'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(f.x, f.y - f.z); ctx.lineTo(f.x2, ly - 30); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); } ctx.restore(); }
      else if (f.kind === 'bolt') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 4; ctx.shadowColor = '#ff8'; ctx.shadowBlur = 12; ctx.beginPath(); let x = f.x + 10, y = f.y - f.z - 200; ctx.moveTo(x, y); for (let i = 1; i <= 6; i++) { x = f.x + (i % 2 ? -12 : 12) * (1 - i / 7); y = f.y - f.z - 200 + i * 33; ctx.lineTo(x, y); } ctx.stroke(); ctx.restore(); }
      else if (f.kind === 'pop') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; circle(ctx, f.x, f.y - f.z, 12 + k * 26); ctx.stroke(); ctx.restore(); }
      else if (f.kind === 'dust') { ctx.fillStyle = `rgba(230,220,200,${0.6 * (1 - k)})`; for (let i = -1; i <= 1; i++) { circle(ctx, f.x + i * (8 + k * 14), f.y - k * 8, 5 + k * 6); ctx.fill(); } }
      else if (f.kind === 'wind') { ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(f.x, f.y - f.z, 10 + k * 16, 4, 0, 0, Math.PI * 1.5); ctx.stroke(); }
      else if (f.kind === 'glitch') { ctx.fillStyle = `rgba(140,255,140,${0.8 * (1 - k)})`; ctx.fillRect(f.x - 4, f.y - f.z - 2, 8, 4); }
      else if (f.kind === 'crumb') { const x = f.x + f.vx * f.t, y = f.y + f.vy * f.t, z = Math.max(0, f.z + f.vz * f.t - 0.5 * BC.GRAVITY * 0.8 * f.t * f.t); cookie(ctx, x, y - z, 4.5, f.t * 9); }
      else if (f.kind === 'explosion') { ctx.save(); ctx.globalAlpha = 1 - k; const r = f.r * (0.3 + k * 0.7); const grd = ctx.createRadialGradient(f.x, f.y - f.z, r * 0.1, f.x, f.y - f.z, r); grd.addColorStop(0, '#fff'); grd.addColorStop(0.4, '#ffd166'); grd.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = grd; circle(ctx, f.x, f.y - f.z, r); ctx.fill(); ctx.restore(); }
    }
  }
  function drawHud(ctx, g, ui) {
    // bandeau du haut : équipes
    ctx.save();
    for (let t = 0; t < 2; t++) {
      const team = g.teams[t], x = t === 0 ? 24 : W - 24, al = t === 0 ? 'left' : 'right';
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, t === 0 ? 12 : W - 12 - 330, 12, 330, 40, 10); ctx.fill();
      S.drawLogo(ctx, t === 0 ? 40 : W - 40, 32, team, 28);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Arial Black, Arial'; ctx.textAlign = al; ctx.fillText(team.name.toUpperCase(), t === 0 ? 64 : W - 64, 32, 265);
      const human = ui && ui.humans.find(h => h.team === t);
      ctx.font = 'bold 13px Arial'; ctx.fillStyle = human ? human.color : '#ffb0a0'; ctx.fillText(human ? human.label : 'ORDI · ' + BC.DIFFICULTIES[g.difficulty].toUpperCase(), t === 0 ? 64 : W - 64, 47, 265);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, W / 2 - 110, 12, 220, 40, 10); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(g.court.name, W / 2, 37, 205);
    // bas : points de vie et pouvoir des trois joueurs intérieurs de chaque équipe
    const ph = 66, y0 = H - ph - 10, bw = 150, gap = 14, tm = g.time;
    for (let t = 0; t < 2; t++) {
      const team = g.teams[t], players = g.inner(t), human = ui && ui.humans.find(h => h.team === t);
      players.forEach((p, i) => {
        const x = t === 0 ? 20 + i * (bw + gap) : W - 20 - bw - (2 - i) * (bw + gap);
        ctx.fillStyle = p.alive ? 'rgba(0,0,0,0.5)' : 'rgba(60,0,0,0.5)'; rr(ctx, x, y0, bw, ph, 10); ctx.fill();
        if (human && g.controlled(t) === p) { ctx.strokeStyle = human.color; ctx.lineWidth = 2.5; rr(ctx, x, y0, bw, ph, 10); ctx.stroke(); }
        ctx.save(); ctx.beginPath(); rr(ctx, x + 4, y0 + 4, 42, 42, 8); ctx.clip(); ctx.fillStyle = team.color; ctx.fillRect(x + 4, y0 + 4, 42, 42); S.drawHead(ctx, p.def, x + 25, y0 + 27, 44); ctx.restore();
        if (!p.alive) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(ctx, x + 4, y0 + 4, 42, 42, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('K.-O.', x + 25, y0 + 30); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left'; ctx.fillText(`${i + 1} ${p.def.name}`, x + 52, y0 + 20);
        ctx.fillStyle = '#1b1b1b'; rr(ctx, x + 52, y0 + 28, bw - 62, 12, 4); ctx.fill();
        const k = p.hp / p.maxHp; ctx.fillStyle = k > 0.5 ? '#5ad66b' : k > 0.25 ? '#ffd166' : '#ff5a5a'; if (k > 0) { rr(ctx, x + 52, y0 + 28, (bw - 62) * k, 12, 4); ctx.fill(); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'right'; ctx.fillText(p.hp + ' / ' + p.maxHp, x + bw - 10, y0 + 38);
        // pouvoir : icône + cases de recharge (un attrapé de l'équipe = une case)
        const P = BC.POWERS[p.power.id]; if (!P || !p.alive) return;
        const ready = p.power.charge >= p.power.max, py = y0 + 54;
        ctx.save();
        if (p.power.armed) ctx.globalAlpha = 0.5 + Math.sin(tm * 14) * 0.5; else if (!ready) ctx.globalAlpha = 0.45;
        if (ready) { ctx.shadowColor = P.color; ctx.shadowBlur = 10; }
        ctx.font = '15px Arial'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(P.icon, x + 6, py + 5);
        ctx.restore();
        for (let c = 0; c < p.power.max; c++) { const cw = (bw - 86) / p.power.max; ctx.fillStyle = c < p.power.charge ? P.color : '#2a3350'; rr(ctx, x + 30 + c * (cw + 3), py - 4, cw, 9, 3); ctx.fill(); }
        ctx.font = 'bold 10px Arial'; ctx.textAlign = 'right'; ctx.fillStyle = p.power.armed ? P.color : ready ? '#fff' : '#9aa4bf';
        ctx.fillText(P.kind === 'passive' ? (ready ? 'PASSIF' : '') : p.power.armed ? 'ARMÉ' : ready ? 'V : PRÊT' : '', x + bw - 8, py + 4);
      });
    }
    ctx.restore();
  }
  function drawMessages(ctx, g) {
    let y = 150;
    for (const m of g.messages) {
      const k = m.t / m.dur, pop = Math.min(1, m.t / 0.15), alpha = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(W / 2, y); ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
      ctx.font = 'bold 54px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#1b1b1b'; ctx.strokeText(m.text, 0, 0); ctx.fillStyle = '#ffd166'; ctx.fillText(m.text, 0, 0);
      if (m.sub) { ctx.font = 'bold 22px Arial'; ctx.lineWidth = 5; ctx.strokeText(m.sub, 0, 34); ctx.fillStyle = '#fff'; ctx.fillText(m.sub, 0, 34); }
      ctx.restore(); y += 90;
    }
  }

  // ---------- Écran d'accueil : la famille s'échauffe sur le terrain ----------
  R.drawMenuScene = function (ctx, actors, t, hovered) {
    const g = { court: BC.COURTS.parc, courtId: 'parc', time: t };
    drawBackground(ctx, g, t);
    for (const a of actors.slice().sort((x, y) => x.y - y.y)) {
      const ph = (t * 0.8 + a.phase) % 3;
      const pose = a === hovered ? 'wave' : ph < 0.5 ? 'windup' : ph < 0.8 ? 'throw' : 'idle';
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(a.x, a.y, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
      S.drawPerson(ctx, a.x, a.y, a.d, a.team, { dir: a.dir, scale: 1.3, frame: 0, pose, ball: pose === 'windup', t });
      if (ph >= 0.5 && ph < 1.6 && a !== hovered) { const k = (ph - 0.5) / 1.1; const bx = a.x + a.dir * (20 + k * 420), bz = 40 + Math.sin(k * Math.PI) * 30; ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(bx, a.y, 8, 3, 0, 0, Math.PI * 2); ctx.fill(); S.drawBall(ctx, bx, a.y - bz, 12, { spin: k * 12 }); }
    }
  };

  // ---------- Galerie : toute la famille côte à côte (pour faire des images) ----------
  // o : { pose, scale, byFamily, court ('none' = fond transparent), names, t, hovered }
  R.drawGallery = function (ctx, o) {
    const t = o.t || 0, groups = o.byFamily ? BC.TEAMS.map(tm => ({ team: tm, ids: tm.players })) : [{ team: null, ids: BC.TEAMS.flatMap(tm => tm.players) }];
    ctx.clearRect(0, 0, W, H);
    if (o.court !== 'none') {                          // plancher du terrain choisi, sur toute l'image (pas d'estrades derrière les têtes)
      const theme = BC.COURTS[o.court] || BC.COURTS.gym;
      ctx.fillStyle = theme.floor; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = theme.floor2; for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 30, H);
      ctx.strokeStyle = theme.line; ctx.lineWidth = 4; ctx.globalAlpha = 0.5; ctx.strokeRect(40, 30, W - 80, H - 60); ctx.beginPath(); ctx.moveTo(W / 2, 30); ctx.lineTo(W / 2, H - 30); ctx.stroke(); circle(ctx, W / 2, H / 2, 60); ctx.stroke(); ctx.globalAlpha = 1;
    }
    const sc = o.scale || 2, spots = [];
    if (o.byFamily) {
      const rowH = H / groups.length;
      groups.forEach((gr, r) => {
        const y = rowH * (r + 1) - 8 - 10 * sc, n = gr.ids.length, w = 60 * sc, x0 = 250 + (W - 250 - n * w) / 2;
        if (o.court !== 'none') { ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, 16, y - rowH + 24, 210, rowH - 32, 14); ctx.fill(); }
        S.drawLogo(ctx, 60, y - rowH / 2 + 8, gr.team, 56);
        ctx.fillStyle = gr.team.color; ctx.font = 'bold 26px Arial Black, Arial'; ctx.textAlign = 'left'; ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.strokeText(gr.team.name, 100, y - rowH / 2 + 18); ctx.fillText(gr.team.name, 100, y - rowH / 2 + 18);
        gr.ids.forEach((id, i) => spots.push({ id, team: gr.team, x: x0 + i * w + w / 2, y }));
      });
    } else {
      const ids = groups[0].ids, rows = 2, perRow = Math.ceil(ids.length / rows), w = Math.min(60 * sc, (W - 60) / perRow);
      ids.forEach((id, i) => { const r = Math.floor(i / perRow), k = i % perRow, n = r === rows - 1 ? ids.length - perRow * (rows - 1) : perRow; const x0 = (W - n * w) / 2; spots.push({ id, team: BC.TEAMS.find(tm => tm.players.includes(id)), x: x0 + k * w + w / 2, y: 330 + r * 330 }); });
    }
    const hov = o.hovered;
    for (const s of spots) {
      const d = BC.PLAYERS[s.id], pose = s.id === hov ? 'wave' : (o.pose === 'mix' ? ['idle', 'windup', 'throw', 'jump', 'catch'][spots.indexOf(s) % 5] : o.pose || 'idle');
      const z = pose === 'jump' ? 24 : 0;
      if (o.court !== 'none') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 16 * d.size * sc + 4, 7, 0, 0, Math.PI * 2); ctx.fill(); }
      S.drawPerson(ctx, s.x, s.y - z, d, s.team, { dir: 1, scale: sc, frame: 0, pose, ball: pose === 'windup' || pose === 'throw', t });
      if (o.names) { ctx.font = `bold ${Math.round(8 * sc)}px Arial`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.fillStyle = '#fff'; ctx.strokeText(d.name, s.x, s.y + 10 * sc); ctx.fillText(d.name, s.x, s.y + 10 * sc); }
      s.w = 30 * d.size * sc; s.h = 50 * Math.max(0.6, d.size) * sc;
    }
    return spots;
  };
})(window.BC);
