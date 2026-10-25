// Rendu du match : terrain (quatre décors), joueurs triés par profondeur, balle et effets, tableau des points de vie.
(function (BC) {
  'use strict';
  const S = BC.sprites, C = BC.COURT, W = BC.W, H = BC.H;
  const R = BC.render = {};
  const rr = S.rr, circle = S.circle;
  const seeded = (n) => { let x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

  // ---------- Décors ----------
  function drawBackground(ctx, g, t) {
    const theme = g.court, id = g.courtId;
    // ciel / mur du fond
    const sky = ctx.createLinearGradient(0, 0, 0, C.top);
    sky.addColorStop(0, theme.sky); sky.addColorStop(1, S.shade(theme.sky, 0.78));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, C.top + 10);
    const GROUND = 190;   // au-dessus : décor ; en dessous : sol hors terrain où marchent les extérieurs
    if (id === 'gym') {
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
    // ombres
    for (const p of g.players) { if (p.state === 'gone') continue; const k = 1 - Math.min(0.7, p.z / 260); ctx.fillStyle = `rgba(0,0,0,${0.25 * k})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, 16 * p.def.size * k + 4, 6 * k + 2, 0, 0, Math.PI * 2); ctx.fill(); }
    const b = g.ball;
    if (b.state !== 'held') { const k = 1 - Math.min(0.75, b.z / 260); ctx.fillStyle = `rgba(0,0,0,${0.28 * k})`; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * k + 2, b.r * 0.45 * k + 1, 0, 0, Math.PI * 2); ctx.fill(); }
    // joueurs et balle triés par profondeur
    const items = g.players.filter(p => p.state !== 'gone').map(p => ({ y: p.y, p }));
    if (b.state !== 'held') items.push({ y: b.y + 1, ball: true });
    items.sort((a, c) => a.y - c.y);
    for (const it of items) {
      if (it.ball) { drawBall(ctx, g, b); continue; }
      const p = it.p, team = g.teams[p.team];
      const pose = p.state === 'ko' ? 'angel' : p.state === 'getup' ? 'pickup' : p.state === 'idle' || p.state === 'gone' ? 'idle' : p.state;
      const human = ui && ui.humans.find(h => h.team === p.team && g.controlled(p.team) === p);
      ctx.save(); ctx.translate(0, -p.z);
      S.drawPerson(ctx, p.x, p.y, p.def, team, { dir: p.facing, frame: p.frame, moving: p.moving, dash: p.dash.active, pose, ball: p.hasBall && pose !== 'hit', t: p.state === 'ko' ? p.ko : p.stateT, alpha: p.state === 'ko' ? Math.max(0, 1 - p.ko / 2.6) : (p.zone === 'out' ? 0.95 : 1) });
      ctx.restore();
      // indicateur du joueur contrôlé et nom
      const topY = p.y - p.z - 50 * Math.max(0.6, p.def.size) - 22;
      if (human && p.alive) { ctx.fillStyle = human.color; ctx.beginPath(); ctx.moveTo(p.x, topY + 8); ctx.lineTo(p.x - 9, topY - 6); ctx.lineTo(p.x + 9, topY - 6); ctx.closePath(); ctx.fill(); ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(human.label, p.x, topY - 10); }
      if (p.zone === 'in' && p.alive && (g.phase === 'ready' || t < 4)) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(p.def.name, p.x, topY + (human ? 24 : 6)); }
      if (p.lent && (g.phase === 'ready' || t < 4)) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText(p.def.name + ' (cousin prêté)', p.x, topY + 6); }
    }
    drawFx(ctx, g);
    ctx.restore();
    if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash})`; ctx.fillRect(0, 0, W, H); }
    drawHud(ctx, g, ui);
    drawMessages(ctx, g);
  };

  function drawBall(ctx, g, b) {
    if (!b.visible) return;
    const S_ = b.superId;
    if (b.trail.length > 1) { ctx.save(); for (let i = 0; i < b.trail.length; i++) { const q = b.trail[i], k = i / b.trail.length; ctx.globalAlpha = 0.35 * k; ctx.fillStyle = S_ === 'laser' ? '#9bf' : S_ === 'fusee' ? '#ffa030' : '#fff'; circle(ctx, q.x, q.y - q.z, b.r * (0.4 + 0.6 * k)); ctx.fill(); } ctx.restore(); }
    const glow = S_ ? ({ laser: '#8ff', fusee: '#f80', canon: '#f44', boulet: '#444', fantome: '#ccf', glitch: '#8f8', aimant: '#f8f', zigzag: '#ff8', crise: '#f66', flash: '#fff', bulle: '#8cf', tornade: '#cef', biscuit: '#fc8', rase: '#cfc', boomerang: '#fff' }[S_] || '#fff') : null;
    S.drawBall(ctx, b.x, b.y - b.z, b.r, { glow, alpha: b.alpha, spin: b.t * 10, color: S_ === 'boulet' ? '#333' : S_ === 'bulle' ? '#6ab4ff' : undefined, color2: S_ === 'boulet' ? '#777' : S_ === 'bulle' ? '#dff' : undefined });
    if (S_ === 'crise') { ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('WAAAH', b.x, b.y - b.z - b.r - 8); }
  }
  function drawFx(ctx, g) {
    for (const f of g.fx) {
      const k = f.t / f.dur;
      if (f.kind === 'pow') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = f.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = `bold ${f.text.length > 3 ? 20 : 26}px Arial Black, Arial`; ctx.textAlign = 'center'; const y = f.y - f.z - k * 40; ctx.strokeText(f.text, f.x, y); ctx.fillText(f.text, f.x, y); ctx.restore(); }
      else if (f.kind === 'burst') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffe36b'; const r = 14 + k * 30; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr_ = i % 2 ? r : r * 0.5; ctx.lineTo(f.x + Math.cos(a) * rr_, f.y - f.z + Math.sin(a) * rr_); } ctx.closePath(); ctx.fill(); ctx.restore(); }
      else if (f.kind === 'spark') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.color; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * 6, f.y - f.z + Math.sin(a) * 6); ctx.lineTo(f.x + Math.cos(a) * (10 + k * 30), f.y - f.z + Math.sin(a) * (10 + k * 30)); ctx.stroke(); } ctx.restore(); }
      else if (f.kind === 'snow') { ctx.fillStyle = `rgba(255,255,255,${1 - k})`; circle(ctx, f.x, f.y - f.z + k * 20, 2.5); ctx.fill(); }
      else if (f.kind === 'fire') { ctx.fillStyle = `rgba(255,${Math.round(160 - k * 120)},40,${1 - k})`; circle(ctx, f.x, f.y - f.z, 7 * (1 - k) + 2); ctx.fill(); }
    }
  }
  function drawHud(ctx, g, ui) {
    // bandeau du haut : équipes
    ctx.save();
    for (let t = 0; t < 2; t++) {
      const team = g.teams[t], x = t === 0 ? 24 : W - 24, al = t === 0 ? 'left' : 'right';
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, t === 0 ? 12 : W - 12 - 330, 12, 330, 40, 10); ctx.fill();
      S.drawLogo(ctx, t === 0 ? 40 : W - 40, 32, team, 28);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Arial Black, Arial'; ctx.textAlign = al; ctx.fillText(team.name.toUpperCase(), t === 0 ? 64 : W - 64, 40);
      const human = ui && ui.humans.find(h => h.team === t);
      ctx.font = 'bold 13px Arial'; ctx.fillStyle = human ? human.color : '#ffb0a0'; ctx.fillText(human ? human.label : 'ORDI · ' + BC.DIFFICULTIES[g.difficulty].toUpperCase(), t === 0 ? 220 : W - 220, 40);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, W / 2 - 110, 12, 220, 40, 10); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(g.court.name, W / 2, 37);
    // bas : points de vie des trois joueurs intérieurs de chaque équipe
    const y0 = H - 62, bw = 150, gap = 14;
    for (let t = 0; t < 2; t++) {
      const team = g.teams[t], players = g.inner(t);
      players.forEach((p, i) => {
        const x = t === 0 ? 20 + i * (bw + gap) : W - 20 - bw - (2 - i) * (bw + gap);
        ctx.fillStyle = p.alive ? 'rgba(0,0,0,0.5)' : 'rgba(60,0,0,0.5)'; rr(ctx, x, y0, bw, 50, 10); ctx.fill();
        if (ui && g.controlled(t) === p && ui.humans.find(h => h.team === t)) { ctx.strokeStyle = ui.humans.find(h => h.team === t).color; ctx.lineWidth = 2.5; rr(ctx, x, y0, bw, 50, 10); ctx.stroke(); }
        ctx.save(); ctx.beginPath(); rr(ctx, x + 4, y0 + 4, 42, 42, 8); ctx.clip(); ctx.fillStyle = team.color; ctx.fillRect(x + 4, y0 + 4, 42, 42); S.drawHead(ctx, p.def, x + 25, y0 + 27, 44); ctx.restore();
        if (!p.alive) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(ctx, x + 4, y0 + 4, 42, 42, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('K.-O.', x + 25, y0 + 30); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left'; ctx.fillText(`${i + 1} ${p.def.name}`, x + 52, y0 + 20);
        ctx.fillStyle = '#1b1b1b'; rr(ctx, x + 52, y0 + 28, bw - 62, 12, 4); ctx.fill();
        const k = p.hp / p.maxHp; ctx.fillStyle = k > 0.5 ? '#5ad66b' : k > 0.25 ? '#ffd166' : '#ff5a5a'; if (k > 0) { rr(ctx, x + 52, y0 + 28, (bw - 62) * k, 12, 4); ctx.fill(); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'right'; ctx.fillText(p.hp + ' / ' + p.maxHp, x + bw - 10, y0 + 38);
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
})(window.BC);
