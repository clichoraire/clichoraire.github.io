// Snow Kids — rendu pseudo-3D (route en segments façon OutRun) : ciel et décor de fond, piste, décors, coureurs, HUD,
// vue de la remontée mécanique. Tout est dessiné au code (aucune image).
(function (SK) {
  'use strict';
  const SEG = SK.SEG, DRAW = 130, FOV = 95 * Math.PI / 180, CAM_BEHIND = 9, CAM_H = 3.8;
  const camDepth = 1 / Math.tan(FOV / 2);
  const R = SK.Render = {};
  const colCache = {};
  const parse = c => { let v = colCache[c]; if (!v) { const h = c.replace('#', ''); v = colCache[c] = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; } return v; };
  const mix = (a, b, t) => { if (t <= 0) return a; if (t >= 1) return b; const A = parse(a), B = parse(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; };
  const darken = (c, k) => { const A = parse(c); return 'rgb(' + Math.round(A[0] * k) + ',' + Math.round(A[1] * k) + ',' + Math.round(A[2] * k) + ')'; };
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------------ vue d'un coureur
  R.drawView = function (ctx, race, me, vx, vy, vw, vh, t) {
    ctx.save(); ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
    const T = race.track, th = T.theme, segs = T.segs;
    if (me.state === 'lift') { R.drawLift(ctx, race, me, vx, vy, vw, vh, t); R.drawHud(ctx, race, me, vx, vy, vw, vh, t); ctx.restore(); return; }
    const f = (vw / 2) * camDepth, cx = vx + vw / 2, cy = vy + vh * 0.42;
    const camZ = me.z - CAM_BEHIND, camX = me.x * 0.92, camY = T.groundY(Math.max(0, me.z)) + CAM_H + me.h * 0.35;
    const baseIdx = Math.max(0, Math.floor(camZ / SEG)), baseSeg = segs[baseIdx];
    const basePct = SK.clamp((camZ - baseSeg.z) / SEG, 0, 1);
    // ciel et fond
    let curveAhead = 0; for (let n = 0; n < 25 && baseIdx + n < segs.length; n++) curveAhead += segs[baseIdx + n].curve * (1 - n / 25);
    R.drawSky(ctx, th, vx, vy, vw, vh, cy, -curveAhead * 400 + camX * 2, t, me);
    if (segs[Math.min(segs.length - 1, baseIdx + 2)].tunnel) { ctx.fillStyle = '#15151b'; ctx.fillRect(vx, vy, vw, vh); }
    // segments : projection puis dessin du plus proche au plus loin (clip par maxY)
    let x = 0, dx = -baseSeg.curve * basePct, maxY = vy + vh;
    const proj = [];
    for (let n = 0; n < DRAW; n++) {
      const i = baseIdx + n; if (i >= segs.length) break;
      const s = segs[i];
      const dz1 = s.z - camZ, dz2 = s.z + SEG - camZ;
      const p = { s, n, hidden: true, clip: maxY };
      if (dz2 > 0.3) {
        const sc1 = f / Math.max(0.3, dz1), sc2 = f / dz2;
        p.x1 = cx + (x - camX) * sc1; p.y1 = cy + (camY - s.y1) * sc1; p.w1 = s.w * sc1; p.sc1 = sc1; p.dz1 = dz1;
        p.x2 = cx + (x + dx - camX) * sc2; p.y2 = cy + (camY - s.y2) * sc2; p.w2 = s.w * sc2; p.sc2 = sc2; p.dz2 = dz2;
        p.cxw = x; // décalage de courbe (monde) au début du segment
        if (dz1 > 0.3 && p.y2 < maxY && p.y1 > p.y2 - 0.01) {
          p.hidden = false; p.clip = maxY;
          R.drawSegment(ctx, th, s, p, vx, vw, n, maxY, race);
          maxY = p.y2;
        } else p.clip = maxY;
      }
      proj.push(p);
      x += dx; dx += s.curve;
    }
    // sprites : du plus loin au plus proche
    const bySeg = {};
    for (const r of race.racers) { if (r.state === 'lift' || r.state === 'done') continue; const i = Math.floor(r.z / SEG); (bySeg[i] = bySeg[i] || []).push({ kind: 'racer', r, x: r.x, z: r.z, h: r.h }); }
    for (const k of race.rocks) { const i = Math.floor(k.z / SEG); (bySeg[i] = bySeg[i] || []).push({ kind: 'rock', x: k.x, z: k.z, h: 0 }); }
    for (const sh of race.shots) { if (sh.drop != null) { if (sh.target) (bySeg[Math.floor(sh.target.z / SEG)] = bySeg[Math.floor(sh.target.z / SEG)] || []).push({ kind: 'shot', s: sh, x: sh.target.x, z: sh.target.z, h: sh.h }); } else if (sh.z != null) { const i = Math.floor(sh.z / SEG); (bySeg[i] = bySeg[i] || []).push({ kind: 'shot', s: sh, x: sh.x, z: sh.z, h: sh.h }); } }
    for (let n = proj.length - 1; n >= 0; n--) {
      const p = proj[n]; if (p.x1 == null) continue; const s = p.s;
      const items = [];
      for (const pr of s.props) items.push({ kind: 'prop', p: pr, x: pr.x, z: s.z + (pr.dz == null ? SEG / 2 : pr.dz), h: 0 });
      for (const b of s.boxes) if (b.taken <= race.time) items.push({ kind: 'box', b, x: b.x, z: s.z + SEG / 2, h: 0.6 });
      for (const c of s.coins) if (c.taken <= race.time) items.push({ kind: 'coin', c, x: c.x, z: s.z + SEG / 2, h: 0.5 });
      if (bySeg[s.i]) for (const it of bySeg[s.i]) items.push(it);
      items.sort((a, b) => b.z - a.z);
      for (const it of items) {
        const dz = it.z - camZ; if (dz < (it.kind === 'racer' ? 3 : 6.5)) continue; // rien de géant entre la caméra et le joueur
        const sc = f / dz, pct = SK.clamp((it.z - s.z) / SEG, 0, 1);
        const xw = p.cxw + (proj[n + 1] ? (proj[n + 1].cxw - p.cxw) * pct : 0);
        const gy = s.y1 + (s.y2 - s.y1) * pct;
        const sx = cx + (xw + it.x - camX) * sc, sy = cy + (camY - gy) * sc;
        const fog = th.fog ? SK.clamp((n - DRAW * 0.55) / (DRAW * 0.45), 0, 1) : 0;
        const clipY = p.clip;
        ctx.save();
        if (sy > clipY + 1) { ctx.beginPath(); ctx.rect(vx, vy, vw, clipY - vy); ctx.clip(); }
        if (fog > 0.02) ctx.globalAlpha = 1 - fog * 0.85;
        if (it.kind === 'prop') R.drawProp(ctx, it.p.type, sx, sy, sc, it.p.v || 0, t, it.p);
        else if (it.kind === 'box') R.drawBox(ctx, it.b, sx, sy, sc, t);
        else if (it.kind === 'coin') R.drawCoin(ctx, sx, sy, sc, t);
        else if (it.kind === 'rock') R.drawProp(ctx, 'rock', sx, sy, sc, 0.5, t, {});
        else if (it.kind === 'shot') R.drawShot(ctx, it.s, sx, sy - it.h * sc, sc, t);
        else if (it.kind === 'racer') R.drawRacer(ctx, it.r, sx, sy, sc, t, it.r === me);
        ctx.restore();
      }
    }
    if (th.snowfall) R.drawSnowfall(ctx, vx, vy, vw, vh, t, me.speed);
    R.drawHud(ctx, race, me, vx, vy, vw, vh, t);
    ctx.restore();
  };

  // ------------------------------------------------------------------ ciel et fond
  R.drawSky = function (ctx, th, vx, vy, vw, vh, horizon, bgOff, t, me) {
    const g = ctx.createLinearGradient(0, vy, 0, horizon + 30); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = th.ground[0]; ctx.fillRect(vx, horizon, vw, vh - (horizon - vy));
    if (th.stars) { ctx.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const sx = vx + ((i * 173.3 + bgOff * 0.2) % vw + vw) % vw, sy = vy + (i * 97.7) % (horizon - vy - 20); ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); ctx.fillRect(sx, sy, 2, 2); } ctx.globalAlpha = 1; }
    const sunX = vx + vw * 0.72 + bgOff * 0.1, sunY = vy + (horizon - vy) * 0.35;
    if (th.sun === 'sun') { ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,245,157,0.3)'; ctx.beginPath(); ctx.arc(sunX, sunY, 52, 0, TAU); ctx.fill(); }
    else if (th.sun === 'bigsun') { ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(sunX - vw * 0.2, horizon - 20, 80, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,200,100,0.35)'; ctx.beginPath(); ctx.arc(sunX - vw * 0.2, horizon - 20, 110, 0, TAU); ctx.fill(); }
    else if (th.sun === 'moon') { ctx.fillStyle = '#fff9c4'; ctx.beginPath(); ctx.arc(sunX, sunY, 28, 0, TAU); ctx.fill(); ctx.fillStyle = th.sky[0]; ctx.beginPath(); ctx.arc(sunX + 12, sunY - 8, 24, 0, TAU); ctx.fill(); }
    // couche de fond (parallaxe sur la courbe)
    ctx.save(); ctx.beginPath(); ctx.rect(vx, vy, vw, horizon - vy + 2); ctx.clip();
    const off = ((bgOff % vw) + vw) % vw;
    for (let rep = -1; rep <= 1; rep++) R.drawBackdrop(ctx, th.bg, vx - off + rep * vw, horizon, vw, th, t);
    ctx.restore();
  };
  R.drawBackdrop = function (ctx, kind, x0, hy, w, th, t) {
    const dark = darken(th.sky[0], 0.75), mid = mix(th.sky[1], th.ground[0], 0.6);
    const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, hy + 2); for (const p of pts) ctx.lineTo(x0 + p[0] * w, hy - p[1]); ctx.lineTo(x0 + w, hy + 2); ctx.closePath(); ctx.fill(); };
    if (kind === 'mountains' || kind === 'peaks' || kind === 'bigsnowman') {
      poly([[0, 40], [0.1, 120], [0.2, 70], [0.33, 160], [0.45, 90], [0.55, 150], [0.68, 60], [0.8, 130], [0.92, 80], [1, 40]], dark);
      poly([[0, 20], [0.15, 70], [0.3, 40], [0.5, 90], [0.62, 50], [0.75, 80], [0.9, 30], [1, 20]], mid);
      ctx.fillStyle = '#ffffff'; [[0.33, 160], [0.55, 150], [0.8, 130]].forEach(p => { ctx.beginPath(); ctx.moveTo(x0 + p[0] * w, hy - p[1]); ctx.lineTo(x0 + p[0] * w - 22, hy - p[1] + 34); ctx.lineTo(x0 + p[0] * w + 22, hy - p[1] + 34); ctx.closePath(); ctx.fill(); });
      if (kind === 'bigsnowman') R.drawProp(ctx, 'bigsnowman', x0 + w * 0.5, hy + 2, 3.2, 0, t, {});
    } else if (kind === 'mesas') {
      poly([[0, 30], [0.08, 30], [0.1, 90], [0.22, 92], [0.24, 40], [0.4, 40], [0.42, 120], [0.55, 122], [0.57, 50], [0.7, 50], [0.72, 80], [0.85, 82], [0.87, 30], [1, 30]], '#8d4a2b');
      poly([[0, 15], [0.3, 25], [0.6, 15], [1, 20]], '#a85a34');
    } else if (kind === 'city') {
      for (let i = 0; i < 26; i++) { const bw = w / 26, bh = 40 + ((i * 53) % 110); ctx.fillStyle = i % 3 ? '#161a33' : '#1f2447'; ctx.fillRect(x0 + i * bw, hy - bh, bw - 4, bh + 2); ctx.fillStyle = '#ffe082'; for (let k = 0; k < bh / 14; k++) for (let m = 0; m < 2; m++) if ((i * 7 + k * 3 + m) % 4) ctx.fillRect(x0 + i * bw + 6 + m * 14, hy - bh + 6 + k * 14, 5, 7); }
    } else if (kind === 'hills') {
      poly([[0, 30], [0.2, 70], [0.4, 45], [0.6, 80], [0.8, 40], [1, 30]], '#2e7d32'); poly([[0, 15], [0.3, 40], [0.55, 25], [0.8, 45], [1, 15]], '#43a047');
    } else if (kind === 'dunes') {
      poly([[0, 20], [0.25, 60], [0.5, 30], [0.75, 70], [1, 20]], '#c9a05a'); poly([[0, 10], [0.35, 35], [0.65, 15], [1, 30]], '#dcb46a');
      R.drawProp(ctx, 'pyramid', x0 + w * 0.3, hy + 2, 2.2, 0, t, {});
    } else if (kind === 'castle') {
      poly([[0, 30], [0.15, 80], [0.3, 50], [0.5, 100], [0.7, 60], [0.85, 90], [1, 30]], '#1f1233'); R.drawProp(ctx, 'pagoda', x0 + w * 0.5, hy + 2, 3, 0, t, {});
    } else if (kind === 'park') {
      poly([[0, 20], [0.3, 50], [0.6, 30], [1, 40]], '#6fc45f'); R.drawProp(ctx, 'ferris', x0 + w * 0.3, hy + 2, 1.8, 0, t, {}); R.drawProp(ctx, 'tent', x0 + w * 0.7, hy + 2, 2.5, 0, t, {});
    }
  };

  // ------------------------------------------------------------------ un segment de piste
  R.drawSegment = function (ctx, th, s, p, vx, vw, n, maxY, race) {
    const fog = SK.clamp((n - DRAW * 0.55) / (DRAW * 0.45), 0, 1), alt = s.i % 2;
    const roadCols = th.road[s.surface] || th.road[Object.keys(th.road)[0]];
    const yTop = p.y2, hgt = p.y1 - p.y2 + 1;
    // sol
    ctx.fillStyle = mix(th.ground[alt], th.fog, fog); ctx.fillRect(vx, yTop, vw, hgt);
    if (s.tunnel) { // galerie : murs et plafond au-dessus du segment, ouverture sombre
      const h = 7 * p.sc2; ctx.fillStyle = alt ? '#3a3a44' : '#33333c'; ctx.fillRect(p.x2 - p.w2 * 1.9, p.y2 - h, p.w2 * 3.8, h + hgt + 1);
      ctx.fillStyle = '#15151b'; ctx.fillRect(p.x2 - p.w2 * 1.3, p.y2 - h * 0.85, p.w2 * 2.6, h * 0.85 + 1);
      if (s.i % 6 === 0) { ctx.fillStyle = '#ffe082'; ctx.fillRect(p.x2 - 0.3 * p.sc2, p.y2 - h * 0.82, 0.6 * p.sc2, Math.max(1, 0.25 * p.sc2)); }
    }
    // talus / bordure
    const bank = 1.6, rumble = 0.9;
    R.quad(ctx, p.x1 - p.w1 - bank * p.sc1, p.y1, p.x2 - p.w2 - bank * p.sc2, p.y2, p.x2 - p.w2, p.y2, p.x1 - p.w1, p.y1, mix(th.rumble[alt], th.fog, fog));
    R.quad(ctx, p.x1 + p.w1, p.y1, p.x2 + p.w2, p.y2, p.x2 + p.w2 + bank * p.sc2, p.y2, p.x1 + p.w1 + bank * p.sc1, p.y1, mix(th.rumble[alt], th.fog, fog));
    // route
    R.quad(ctx, p.x1 - p.w1, p.y1, p.x2 - p.w2, p.y2, p.x2 + p.w2, p.y2, p.x1 + p.w1, p.y1, mix(roadCols[alt], th.fog, fog * 0.9));
    // clôtures : deux rails qui suivent la piste, un poteau tous les 3 segments
    if (!s.tunnel && !s.finish) {
      const off = 1.3, railCol = mix('#ffab91', th.fog, fog), postCol = mix('#8d6e63', th.fog, fog);
      for (const side of [-1, 1]) {
        const xa = p.x1 + side * (p.w1 + off * p.sc1), xb = p.x2 + side * (p.w2 + off * p.sc2);
        for (const hgt2 of [0.5, 0.95]) {
          const ya = p.y1 - hgt2 * p.sc1, yb = p.y2 - hgt2 * p.sc2, ta = Math.max(1, 0.09 * p.sc1), tb = Math.max(1, 0.09 * p.sc2);
          R.quad(ctx, xa, ya, xb, yb, xb, yb + tb, xa, ya + ta, railCol);
        }
        if (s.i % 3 === 0) { const ph = 1.15 * p.sc1, pw = Math.max(1, 0.2 * p.sc1); ctx.fillStyle = postCol; ctx.fillRect(xa - pw / 2, p.y1 - ph, pw, ph); }
      }
    }
    if (s.ramp) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(p.x1 - p.w1, p.y1); ctx.lineTo(p.x2 - p.w2, p.y2); ctx.lineTo(p.x2 + p.w2, p.y2); ctx.lineTo(p.x1 + p.w1, p.y1); ctx.fill(); if (s.jump) { ctx.fillStyle = '#ff5252'; ctx.fillRect(p.x2 - p.w2, p.y2 - 1, p.w2 * 2, 2); } }
    if (th.centerLine && s.i % 4 < 2) R.quad(ctx, p.x1 - 0.15 * p.sc1, p.y1, p.x2 - 0.15 * p.sc2, p.y2, p.x2 + 0.15 * p.sc2, p.y2, p.x1 + 0.15 * p.sc1, p.y1, '#ffe082');
    if (s.surface === 'quick' && alt) { ctx.fillStyle = 'rgba(60,40,10,0.25)'; ctx.beginPath(); ctx.ellipse((p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2, p.w1 * 0.5, hgt, 0, 0, TAU); ctx.fill(); }
    if (s.surface === 'ice' && s.i % 7 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(p.x1 - p.w1 * 0.3, p.y1 - hgt * 0.4, p.w1 * 0.25, Math.max(1, hgt * 0.15)); }
    if (s.barrier) { // barrière de la gare : fermée partout sauf au portail
      const hb = 1.3, g0 = s.barrier.gateX - s.barrier.gateW, g1 = s.barrier.gateX + s.barrier.gateW;
      for (const [a, b] of [[-s.w, g0], [g1, s.w]]) { if (b <= a) continue; const xa = p.x1 + a * p.sc1, xb = p.x1 + b * p.sc1; ctx.fillStyle = '#c62828'; ctx.fillRect(xa, p.y1 - hb * p.sc1, xb - xa, Math.max(1, 0.22 * p.sc1)); ctx.fillStyle = '#fff'; ctx.fillRect(xa, p.y1 - 0.7 * p.sc1, xb - xa, Math.max(1, 0.16 * p.sc1)); ctx.fillStyle = '#5d4037'; for (let x = a; x <= b; x += 4) ctx.fillRect(p.x1 + x * p.sc1 - 0.1 * p.sc1, p.y1 - hb * p.sc1, Math.max(1, 0.2 * p.sc1), hb * p.sc1); }
    }
    if (s.finish && s.i === race.track.segs.length - 40) { // ligne d'arrivée
      for (let k = 0; k < 8; k++) R.quad(ctx, p.x1 - p.w1 + k * p.w1 / 4, p.y1, p.x2 - p.w2 + k * p.w2 / 4, p.y2, p.x2 - p.w2 + (k + 1) * p.w2 / 4, p.y2, p.x1 - p.w1 + (k + 1) * p.w1 / 4, p.y1, k % 2 ? '#222' : '#fff');
    }
  };
  R.quad = function (ctx, x1, y1, x2, y2, x3, y3, x4, y4, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill(); };

  // ------------------------------------------------------------------ décors et obstacles (s = pixels par mètre)
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const tri = (ctx, x, y, w, h, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill(); };
  const circ = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const rect = (ctx, x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  R.drawProp = function (ctx, type, x, y, s, v, t, p) {
    if (s < 0.6) { if (p && p.big) s = Math.max(s, 0.6); else return; }
    const big = p && p.big ? 2.2 : 1; s *= big;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    switch (type) {
      case 'pine': case 'fir': { const h = (type === 'fir' ? 7 : 5.5) * (0.8 + v * 0.5) * s; ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s * 0.4, 0, 0, TAU); ctx.fill(); rect(ctx, x - s * 0.25, y - s * 1.2, s * 0.5, s * 1.2, '#5d4037'); tri(ctx, x, y - s * 0.8, h * 0.6, h * 0.45, '#2e7d32'); tri(ctx, x, y - h * 0.4, h * 0.5, h * 0.4, '#388e3c'); tri(ctx, x, y - h * 0.65, h * 0.38, h * 0.35, '#43a047'); if (type === 'fir' || v > 0.5) { tri(ctx, x, y - h * 0.42, h * 0.45, h * 0.2, '#f5f5f5'); tri(ctx, x, y - h * 0.68, h * 0.3, h * 0.15, '#ffffff'); } break; }
      case 'tree': case 'cherry': { const h = 5 * (0.8 + v * 0.4) * s; ctx.beginPath(); ctx.ellipse(x, y, s * 1.5, s * 0.4, 0, 0, TAU); ctx.fill(); rect(ctx, x - s * 0.3, y - h * 0.5, s * 0.6, h * 0.5, '#6d4c41'); circ(ctx, x, y - h * 0.65, h * 0.4, type === 'cherry' ? '#f48fb1' : '#43a047'); circ(ctx, x - h * 0.25, y - h * 0.5, h * 0.3, type === 'cherry' ? '#f8bbd0' : '#4caf50'); circ(ctx, x + h * 0.25, y - h * 0.5, h * 0.3, type === 'cherry' ? '#f06292' : '#388e3c'); break; }
      case 'deadtree': { const h = 4 * s; rect(ctx, x - s * 0.25, y - h, s * 0.5, h, '#4e342e'); ctx.strokeStyle = '#4e342e'; ctx.lineWidth = s * 0.3; ctx.beginPath(); ctx.moveTo(x, y - h * 0.6); ctx.lineTo(x - h * 0.4, y - h * 0.95); ctx.moveTo(x, y - h * 0.75); ctx.lineTo(x + h * 0.35, y - h * 1.05); ctx.stroke(); break; }
      case 'bush': { circ(ctx, x, y - s * 0.6, s * 1.1, '#388e3c'); circ(ctx, x - s * 0.8, y - s * 0.4, s * 0.8, '#43a047'); circ(ctx, x + s * 0.8, y - s * 0.4, s * 0.8, '#2e7d32'); break; }
      case 'flower': { rect(ctx, x - s * 0.06, y - s * 0.8, s * 0.12, s * 0.8, '#2e7d32'); circ(ctx, x, y - s * 0.9, s * 0.3, ['#ff5252', '#ffeb3b', '#e040fb', '#ffffff'][Math.floor(v * 4)]); circ(ctx, x, y - s * 0.9, s * 0.1, '#ff8f00'); break; }
      case 'rock': { ctx.beginPath(); ctx.ellipse(x, y, s * 1.6, s * 0.4, 0, 0, TAU); ctx.fill(); const h = (1.4 + v * 0.6) * s; ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.moveTo(x - 1.3 * s, y); ctx.lineTo(x - 1.1 * s, y - h * 0.6); ctx.lineTo(x - 0.3 * s, y - h); ctx.lineTo(x + 0.7 * s, y - h * 0.8); ctx.lineTo(x + 1.3 * s, y - h * 0.3); ctx.lineTo(x + 1.2 * s, y); ctx.fill(); ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.moveTo(x - 1.1 * s, y - h * 0.6); ctx.lineTo(x - 0.3 * s, y - h); ctx.lineTo(x + 0.2 * s, y - h * 0.55); ctx.fill(); break; }
      case 'snowman': case 'bigsnowman': { const k = type === 'bigsnowman' ? 6 : 1; circ(ctx, x, y - 0.6 * k * s, 0.65 * k * s, '#fafafa'); circ(ctx, x, y - 1.45 * k * s, 0.5 * k * s, '#ffffff'); circ(ctx, x, y - 2.15 * k * s, 0.38 * k * s, '#ffffff'); circ(ctx, x - 0.13 * k * s, y - 2.25 * k * s, 0.05 * k * s, '#000'); circ(ctx, x + 0.13 * k * s, y - 2.25 * k * s, 0.05 * k * s, '#000'); tri(ctx, x + 0.25 * k * s, y - 2.12 * k * s, 0.12 * k * s, -0.3 * k * s, '#ff7043'); rect(ctx, x - 0.3 * k * s, y - 2.55 * k * s, 0.6 * k * s, 0.08 * k * s, '#212121'); rect(ctx, x - 0.2 * k * s, y - 2.95 * k * s, 0.4 * k * s, 0.42 * k * s, '#212121'); if (k > 1) { ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 0.1 * k * s; ctx.beginPath(); ctx.moveTo(x - 0.4 * k * s, y - 1.85 * k * s); ctx.lineTo(x + 0.4 * k * s, y - 1.8 * k * s); ctx.stroke(); } break; }
      case 'igloo': { ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.arc(x, y, 2.2 * s, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.arc(x, y, 0.8 * s, Math.PI, 0); ctx.fill(); break; }
      case 'mesa': { const h = 9 * s; rect(ctx, x - 4 * s, y - h, 8 * s, h, '#a0522d'); rect(ctx, x - 3.4 * s, y - h, 6.8 * s, h * 0.15, '#c1693a'); rect(ctx, x - 4 * s, y - h * 0.5, 8 * s, h * 0.08, '#8b4521'); break; }
      case 'cactus': { const h = 2.5 * (0.8 + v * 0.5) * s; ctx.fillStyle = '#2e7d32'; rr(ctx, x - 0.3 * s, y - h, 0.6 * s, h, 0.3 * s); ctx.fill(); rr(ctx, x - 1.1 * s, y - h * 0.7, 0.45 * s, h * 0.4, 0.2 * s); ctx.fill(); rr(ctx, x + 0.65 * s, y - h * 0.8, 0.45 * s, h * 0.45, 0.2 * s); ctx.fill(); rect(ctx, x - 1.1 * s, y - h * 0.35, 1.1 * s, 0.3 * s, '#2e7d32'); rect(ctx, x, y - h * 0.4, 1.1 * s, 0.3 * s, '#2e7d32'); break; }
      case 'palm': { const h = 6 * s; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 0.4 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 0.8 * s, y - h * 0.5, x + 0.4 * s, y - h); ctx.stroke(); ctx.strokeStyle = '#43a047'; ctx.lineWidth = 0.35 * s; for (let k = 0; k < 6; k++) { const a = -Math.PI + k * Math.PI / 5; ctx.beginPath(); ctx.moveTo(x + 0.4 * s, y - h); ctx.quadraticCurveTo(x + 0.4 * s + Math.cos(a) * 2 * s, y - h + Math.sin(a) * 1.2 * s - 0.5 * s, x + 0.4 * s + Math.cos(a) * 3 * s, y - h + 1.2 * s); ctx.stroke(); } break; }
      case 'pyramid': { const h = 10 * s; tri(ctx, x, y, h * 1.6, h, '#d7a85c'); ctx.fillStyle = '#b8894a'; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + h * 0.8, y); ctx.lineTo(x, y); ctx.fill(); break; }
      case 'skull': { circ(ctx, x, y - 0.6 * s, 0.6 * s, '#f5f5f5'); circ(ctx, x - 0.22 * s, y - 0.65 * s, 0.15 * s, '#333'); circ(ctx, x + 0.22 * s, y - 0.65 * s, 0.15 * s, '#333'); rect(ctx, x - 0.3 * s, y - 0.25 * s, 0.6 * s, 0.25 * s, '#e0e0e0'); break; }
      case 'icicle': { const h = 2.4 * s; ctx.fillStyle = 'rgba(190,235,255,0.9)'; for (let k = -1; k <= 1; k++) tri(ctx, x + k * 0.6 * s, y, 0.6 * s, h * (1 - Math.abs(k) * 0.3), 'rgba(190,235,255,0.9)'); break; }
      case 'lamp': { const h = 7 * s; rect(ctx, x - 0.12 * s, y - h, 0.24 * s, h, '#9e9e9e'); rect(ctx, x - 0.12 * s, y - h, 1.6 * s, 0.2 * s, '#9e9e9e'); circ(ctx, x + 1.6 * s, y - h + 0.3 * s, 0.4 * s, '#fff59d'); ctx.fillStyle = 'rgba(255,245,157,0.12)'; ctx.beginPath(); ctx.moveTo(x + 1.6 * s, y - h); ctx.lineTo(x - 0.5 * s, y); ctx.lineTo(x + 3.7 * s, y); ctx.fill(); break; }
      case 'building': case 'tower': { const h = (type === 'tower' ? 26 : 8 + v * 10) * s, w = (type === 'tower' ? 7 : 4 + v * 3) * s; rect(ctx, x - w / 2, y - h, w, h, v > 0.5 ? '#263045' : '#1d2438'); ctx.fillStyle = '#ffe082'; for (let r = 0; r < h / (1.4 * s); r++) for (let c = 0; c < w / (1.2 * s) - 0.5; c++) if ((r * 3 + c * 5 + Math.floor(v * 10)) % 3) ctx.fillRect(x - w / 2 + 0.3 * s + c * 1.2 * s, y - h + 0.3 * s + r * 1.4 * s, 0.6 * s, 0.8 * s); if (type === 'tower') { rect(ctx, x - 0.1 * s, y - h - 4 * s, 0.2 * s, 4 * s, '#ef5350'); circ(ctx, x, y - h - 4 * s, 0.4 * s * (1 + 0.3 * Math.sin(t * 6)), '#ff1744'); } break; }
      case 'sign': { rect(ctx, x - 0.1 * s, y - 4 * s, 0.2 * s, 4 * s, '#757575'); rect(ctx, x - 1.6 * s, y - 5.5 * s, 3.2 * s, 1.6 * s, ['#e91e63', '#00e5ff', '#76ff03', '#ffea00'][Math.floor(v * 4)]); break; }
      case 'car': { const col = ['#e53935', '#1e88e5', '#fdd835', '#8e24aa', '#ffffff'][Math.floor(v * 5)]; ctx.beginPath(); ctx.ellipse(x, y, 2.3 * s, 0.5 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = col; rr(ctx, x - 2.2 * s, y - 1.3 * s, 4.4 * s, 1.1 * s, 0.3 * s); ctx.fill(); rr(ctx, x - 1.3 * s, y - 2.1 * s, 2.6 * s, 1 * s, 0.3 * s); ctx.fill(); rect(ctx, x - 1.1 * s, y - 2 * s, 2.2 * s, 0.6 * s, '#b3e5fc'); circ(ctx, x - 1.4 * s, y - 0.2 * s, 0.45 * s, '#212121'); circ(ctx, x + 1.4 * s, y - 0.2 * s, 0.45 * s, '#212121'); circ(ctx, x - 1.9 * s, y - 0.9 * s, 0.2 * s, '#ff5252'); circ(ctx, x + 1.9 * s, y - 0.9 * s, 0.2 * s, '#ff5252'); break; }
      case 'cone': { tri(ctx, x, y, 1 * s, 1.4 * s, '#ff6d00'); rect(ctx, x - 0.3 * s, y - 0.8 * s, 0.6 * s, 0.2 * s, '#fff'); break; }
      case 'cow': { ctx.beginPath(); ctx.ellipse(x, y, 1.6 * s, 0.4 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; rr(ctx, x - 1.3 * s, y - 1.5 * s, 2.6 * s, 1.1 * s, 0.4 * s); ctx.fill(); circ(ctx, x - 0.4 * s, y - 1.1 * s, 0.35 * s, '#212121'); circ(ctx, x + 0.6 * s, y - 0.8 * s, 0.3 * s, '#212121'); rect(ctx, x - 1 * s, y - 0.5 * s, 0.25 * s, 0.5 * s, '#eee'); rect(ctx, x + 0.8 * s, y - 0.5 * s, 0.25 * s, 0.5 * s, '#eee'); ctx.fillStyle = '#fff'; rr(ctx, x + 1.1 * s, y - 1.9 * s, 0.8 * s, 0.8 * s, 0.2 * s); ctx.fill(); circ(ctx, x + 1.6 * s, y - 1.3 * s, 0.25 * s, '#f8bbd0'); break; }
      case 'house': case 'lodge': { const k = type === 'lodge' ? 2 : 1, w = 4 * k * s, h = 2.6 * k * s; rect(ctx, x - w / 2, y - h, w, h, type === 'lodge' ? '#6d4c41' : '#ffe0b2'); tri(ctx, x, y - h, w * 1.2, h * 0.7, '#b71c1c'); rect(ctx, x - 0.4 * k * s, y - 1.3 * k * s, 0.8 * k * s, 1.3 * k * s, '#4e342e'); rect(ctx, x + 0.8 * k * s, y - 2 * k * s, 0.8 * k * s, 0.7 * k * s, '#fff59d'); rect(ctx, x - 1.6 * k * s, y - 2 * k * s, 0.8 * k * s, 0.7 * k * s, '#fff59d'); break; }
      case 'windmill': { const h = 9 * s; tri(ctx, x, y, 4 * s, h, '#eeeeee'); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 0.3 * s; for (let k = 0; k < 4; k++) { const a = t * 0.8 + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + Math.cos(a) * 4 * s, y - h + Math.sin(a) * 4 * s); ctx.stroke(); } break; }
      case 'peak': { tri(ctx, x, y, 24 * s, 22 * s, '#90a4ae'); tri(ctx, x, y - 12 * s, 11 * s, 10 * s, '#ffffff'); break; }
      case 'torii': { const h = 5 * s; rect(ctx, x - 1.8 * s, y - h, 0.4 * s, h, '#c62828'); rect(ctx, x + 1.4 * s, y - h, 0.4 * s, h, '#c62828'); rect(ctx, x - 2.4 * s, y - h, 4.8 * s, 0.4 * s, '#212121'); rect(ctx, x - 2 * s, y - h + 0.9 * s, 4 * s, 0.3 * s, '#c62828'); break; }
      case 'bamboo': { const h = 5 * (0.8 + v * 0.5) * s; ctx.strokeStyle = '#7cb342'; ctx.lineWidth = 0.3 * s; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 0.5 * s, y); ctx.lineTo(x + k * 0.5 * s + k * 0.3 * s, y - h * (1 - Math.abs(k) * 0.2)); ctx.stroke(); } ctx.fillStyle = '#558b2f'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + (k % 2 ? 0.8 : -0.8) * s, y - h * (0.4 + k * 0.13), 0.7 * s, 0.18 * s, k % 2 ? 0.4 : -0.4, 0, TAU); ctx.fill(); } break; }
      case 'lantern': { rect(ctx, x - 0.5 * s, y - 0.3 * s, 1 * s, 0.3 * s, '#616161'); rect(ctx, x - 0.2 * s, y - 1.4 * s, 0.4 * s, 1.1 * s, '#757575'); rect(ctx, x - 0.6 * s, y - 2.1 * s, 1.2 * s, 0.7 * s, '#9e9e9e'); rect(ctx, x - 0.4 * s, y - 2 * s, 0.8 * s, 0.5 * s, '#ffcc80'); tri(ctx, x, y - 2.1 * s, 1.6 * s, 0.5 * s, '#616161'); break; }
      case 'statue': { rect(ctx, x - 0.6 * s, y - 0.4 * s, 1.2 * s, 0.4 * s, '#616161'); ctx.fillStyle = '#757575'; rr(ctx, x - 0.45 * s, y - 1.6 * s, 0.9 * s, 1.2 * s, 0.3 * s); ctx.fill(); circ(ctx, x, y - 1.9 * s, 0.35 * s, '#757575'); break; }
      case 'pagoda': { const w = 5 * s, h = 2 * s; for (let k = 0; k < 3; k++) { const ww = w * (1 - k * 0.2), yy = y - k * h; rect(ctx, x - ww / 2 * 0.7, yy - h, ww * 0.7, h, '#efebe9'); tri(ctx, x, yy - h * 0.7, ww * 1.3, h * 0.6, '#b71c1c'); rect(ctx, x - ww / 2 * 0.72, yy - h * 0.4, ww * 0.72, 0.1 * s, '#3e2723'); } break; }
      case 'balloon': { const col = ['#ff5252', '#40c4ff', '#ffeb3b', '#69f0ae', '#e040fb'][Math.floor(v * 5)], h = (2.5 + v) * s; ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - h - 0.7 * s, 0.6 * s, 0.75 * s, 0, 0, TAU); ctx.fill(); break; }
      case 'tent': { const w = 6 * s, h = 4 * s; tri(ctx, x, y, w, h, '#e53935'); ctx.fillStyle = '#fff'; for (let k = -2; k <= 2; k += 2) { ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + k * w / 8 - w / 16, y); ctx.lineTo(x + k * w / 8 + w / 16, y); ctx.fill(); } rect(ctx, x - 0.08 * s, y - h - 1 * s, 0.16 * s, 1 * s, '#616161'); tri(ctx, x + 0.5 * s, y - h - 0.4 * s, -1 * s, 0.6 * s, '#ffeb3b'); break; }
      case 'ferris': { const rad = 8 * s, cy0 = y - rad - 1.5 * s; ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 0.3 * s; ctx.beginPath(); ctx.moveTo(x - 3 * s, y); ctx.lineTo(x, cy0); ctx.lineTo(x + 3 * s, y); ctx.stroke(); ctx.beginPath(); ctx.arc(x, cy0, rad, 0, TAU); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = t * 0.4 + k * TAU / 8; ctx.beginPath(); ctx.moveTo(x, cy0); ctx.lineTo(x + Math.cos(a) * rad, cy0 + Math.sin(a) * rad); ctx.stroke(); circ(ctx, x + Math.cos(a) * rad, cy0 + Math.sin(a) * rad + 0.5 * s, 0.7 * s, ['#ff5252', '#40c4ff', '#ffeb3b', '#69f0ae'][k % 4]); } break; }
      case 'lollipop': { rect(ctx, x - 0.08 * s, y - 2 * s, 0.16 * s, 2 * s, '#fff'); circ(ctx, x, y - 2.4 * s, 0.6 * s, '#ff4081'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.1 * s; ctx.beginPath(); ctx.arc(x, y - 2.4 * s, 0.35 * s, 0, 4.5); ctx.stroke(); break; }
      case 'teacup': { const a = t * 1.5; ctx.beginPath(); ctx.ellipse(x, y, 2 * s, 0.5 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#80deea'; ctx.beginPath(); ctx.ellipse(x, y - 0.3 * s, 1.8 * s, 0.5 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fce4ec'; ctx.beginPath(); ctx.moveTo(x - 1.6 * s, y - 0.4 * s); ctx.lineTo(x - 1.2 * s, y - 1.8 * s); ctx.lineTo(x + 1.2 * s, y - 1.8 * s); ctx.lineTo(x + 1.6 * s, y - 0.4 * s); ctx.fill(); ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.ellipse(x, y - 1.8 * s, 1.2 * s, 0.35 * s, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fce4ec'; ctx.lineWidth = 0.25 * s; ctx.beginPath(); ctx.arc(x + 1.5 * s + Math.cos(a) * 0.3 * s, y - 1.1 * s, 0.5 * s, -1.2, 1.2); ctx.stroke(); break; }
      case 'gate': { const w = (p && p.wide ? 30 : 10) * s / big, h = 6 * s / big; const ss = s / big; rect(ctx, x - w / 2, y - h, 0.5 * ss, h, '#455a64'); rect(ctx, x + w / 2 - 0.5 * ss, y - h, 0.5 * ss, h, '#455a64'); rect(ctx, x - w / 2, y - h, w, 1.2 * ss, '#ff5252'); ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(8, 0.9 * ss) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('REMONTÉE', x, y - h + 0.95 * ss); break; }
      case 'fence': { const h = 1.1 * s; rect(ctx, x - 0.12 * s, y - h, 0.24 * s, h, '#8d6e63'); rect(ctx, x - 1.6 * s, y - h * 0.8, 3.2 * s, 0.14 * s, p && p.v > 0.5 ? '#ff7043' : '#ffab91'); rect(ctx, x - 1.6 * s, y - h * 0.4, 3.2 * s, 0.12 * s, '#ffab91'); break; }
      case 'liftpole': { const h = 9 * s; rect(ctx, x - 0.2 * s, y - h, 0.4 * s, h, '#546e7a'); rect(ctx, x - 1.5 * s, y - h, 3 * s, 0.3 * s, '#546e7a'); break; }
      default: { circ(ctx, x, y - 0.6 * s, 0.6 * s, '#9e9e9e'); }
    }
  };
  R.drawBox = function (ctx, b, x, y, s, t) {
    const sz = 1.2 * s, bob = Math.sin(t * 4 + b.x) * 0.1 * s, cy0 = y - 0.9 * s - bob;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, sz * 0.6, sz * 0.2, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, cy0); ctx.rotate(Math.sin(t * 3) * 0.25);
    ctx.fillStyle = b.kind === 'red' ? '#e53935' : '#1e88e5'; rr(ctx, -sz / 2, -sz / 2, sz, sz, sz * 0.15); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, sz * 0.08); ctx.strokeRect(-sz / 2 + sz * 0.1, -sz / 2 + sz * 0.1, sz * 0.8, sz * 0.8);
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + sz * 0.8 + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.kind === 'red' ? '!' : '?', 0, sz * 0.05); ctx.restore();
  };
  R.drawCoin = function (ctx, x, y, s, t) {
    const r = 0.45 * s, w = Math.abs(Math.cos(t * 5 + x * 0.01)) * r + 0.1;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.25, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.ellipse(x, y - 0.9 * s, w, r, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff8f00'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.stroke();
  };
  R.drawShot = function (ctx, sh, x, y, s, t) {
    const k = sh.kind;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    if (k === 'bombe') { circ(ctx, x, y - 0.6 * s, 0.55 * s, '#212121'); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = Math.max(1, 0.1 * s); ctx.beginPath(); ctx.moveTo(x, y - 1.1 * s); ctx.lineTo(x + 0.3 * s, y - 1.5 * s); ctx.stroke(); circ(ctx, x + 0.3 * s, y - 1.5 * s, 0.15 * s * (1 + Math.sin(t * 20) * 0.5), '#ffab00'); }
    else if (k === 'parachute') { ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(x, y - 1.5 * s, 1 * s, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - s, y - 1.5 * s); ctx.lineTo(x, y - 0.3 * s); ctx.lineTo(x + s, y - 1.5 * s); ctx.stroke(); circ(ctx, x, y - 0.3 * s, 0.25 * s, '#333'); }
    else if (k === 'gel') { ctx.fillStyle = 'rgba(128,222,234,0.9)'; ctx.beginPath(); ctx.moveTo(x, y - 1.6 * s); ctx.lineTo(x + 0.5 * s, y - 0.8 * s); ctx.lineTo(x, y); ctx.lineTo(x - 0.5 * s, y - 0.8 * s); ctx.fill(); }
    else if (k === 'poele') { ctx.save(); ctx.translate(x, y - 0.6 * s); ctx.rotate(t * 8); circ(ctx, 0, 0, 0.7 * s, '#37474f'); circ(ctx, 0, 0, 0.5 * s, '#546e7a'); rect(ctx, 0.6 * s, -0.1 * s, 1.2 * s, 0.2 * s, '#212121'); ctx.restore(); }
    else if (k === 'bonhomme') { circ(ctx, x, y - 0.6 * s, 0.6 * s, '#fff'); circ(ctx, x, y - 1.4 * s, 0.4 * s, '#fff'); tri(ctx, x + 0.3 * s, y - 1.4 * s, 0.15 * s, -0.4 * s, '#ff7043'); }
  };
  R.drawSnowfall = function (ctx, vx, vy, vw, vh, t, speed) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 90; i++) { const px = vx + ((i * 97.3 + t * (20 + i % 7 * 9)) % vw + vw) % vw, py = vy + ((i * 61.7 + t * (120 + i % 5 * 40 + speed * 3)) % vh + vh) % vh; ctx.fillRect(px, py, 2 + i % 3, 2 + i % 3); }
  };

  // ------------------------------------------------------------------ coureur (vectoriel). x,y = pieds au sol ; s = px/m
  // En course on le voit DE DOS (il regarde là où il va) ; hors course (pose 'side') et pendant une vrille quand il nous
  // fait face, on le voit de face. Chaque figure a sa propre animation.
  R.drawRacer = function (ctx, r, x, y, s, t, isMe) {
    const c = r.def.colors, h = r.h;
    ctx.fillStyle = 'rgba(0,0,0,' + (0.25 / (1 + h * 0.5)) + ')'; ctx.beginPath(); ctx.ellipse(x, y + 0.1 * s, 0.6 * s / (1 + h * 0.15), 0.3 * s / (1 + h * 0.15), 0, 0, TAU); ctx.fill();
    if (r.fx.fan > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, 0.08 * s); for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 0.5 * s, y - 0.3 * s - h * s + Math.sin(t * 30 + k) * 0.1 * s); ctx.lineTo(x + k * 0.5 * s, y + 0.9 * s - h * s); ctx.stroke(); } }
    ctx.save(); ctx.translate(x, y - h * s);
    if (r.fx.invisible > 0) ctx.globalAlpha = isMe ? 0.45 : 0.25;
    const steer = r.steer != null ? r.steer : (r.input ? r.input.steer : 0);
    let front = r.pose === 'side', anim = null, p = 0, grab = false, method = false;
    if (r.curTrick) {
      const d = r.curTrick.def; p = Math.min(1, r.curTrick.t / d.dur); anim = d.anim;
      if (anim === 'spin' || anim === 'rodeo') { const ang = p * TAU * (d.turns || 1) * (d.sign || 1), cs = Math.cos(ang); front = cs < 0; ctx.scale(Math.max(0.12, Math.abs(cs)), 1); }
      if (anim === 'flip' || anim === 'rodeo') { ctx.translate(0, -0.9 * s); ctx.rotate(d.sign * p * TAU); ctx.translate(0, 0.9 * s); }
      if (anim === 'grab') { grab = true; ctx.translate(0, 0.25 * s); ctx.scale(1, 0.82); }
      if (anim === 'method') { method = true; ctx.rotate(-0.55 * Math.sin(p * Math.PI)); ctx.translate(0, 0.15 * s); ctx.scale(1, 0.9); }
    }
    if (r.state === 'fall') { front = true; ctx.rotate(Math.PI / 2 * 0.9); ctx.translate(0.3 * s, 0.6 * s); ctx.scale(0.9, 0.9); if (r.flat > 0) { ctx.rotate(-Math.PI / 2 * 0.9); ctx.translate(-0.3 * s, -0.6 * s); ctx.scale(1.5, 0.35); } }
    else if (r.state === 'air' || r.state === 'drop') ctx.rotate(-steer * 0.15 + (r.vy > 0 ? -0.08 : 0.08));
    else if (r.state === 'ride') { ctx.rotate(steer * 0.22); if (r.input && r.input.down) ctx.scale(1, 1.03); }
    if (r.fx.snowman > 0) { circ(ctx, 0, -0.55 * s, 0.6 * s, '#fafafa'); circ(ctx, 0, -1.35 * s, 0.45 * s, '#fff'); if (front) { circ(ctx, -0.15 * s, -1.45 * s, 0.05 * s, '#000'); circ(ctx, 0.15 * s, -1.45 * s, 0.05 * s, '#000'); tri(ctx, 0.25 * s, -1.33 * s, 0.12 * s, -0.35 * s, '#ff7043'); } rect(ctx, -0.3 * s, -1.85 * s, 0.6 * s, 0.4 * s, '#212121'); ctx.restore(); return; }
    // ---- planche
    if (r.pose === 'side') {
      ctx.save(); ctx.rotate(steer * 0.15);
      ctx.fillStyle = c.board; rr(ctx, -0.85 * s, -0.14 * s, 1.7 * s, 0.26 * s, 0.13 * s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-0.65 * s, -0.11 * s, 1.3 * s, 0.06 * s); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-0.8 * s, 0.06 * s, 1.6 * s, 0.06 * s);
      ctx.restore();
    } else {
      ctx.save(); ctx.rotate(steer * 0.25 + (grab ? 0.35 : 0) + (method ? -0.3 : 0));
      ctx.fillStyle = c.board; ctx.beginPath(); ctx.moveTo(-0.42 * s, 0.2 * s); ctx.quadraticCurveTo(-0.46 * s, 0.42 * s, 0, 0.46 * s); ctx.quadraticCurveTo(0.46 * s, 0.42 * s, 0.42 * s, 0.2 * s);
      ctx.lineTo(0.26 * s, -1.0 * s); ctx.quadraticCurveTo(0, -1.25 * s, -0.26 * s, -1.0 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(-0.26 * s, 0.24 * s); ctx.lineTo(0.26 * s, 0.24 * s); ctx.lineTo(0.16 * s, -0.95 * s); ctx.lineTo(-0.16 * s, -0.95 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(-0.42 * s, 0.2 * s); ctx.quadraticCurveTo(-0.46 * s, 0.42 * s, 0, 0.46 * s); ctx.quadraticCurveTo(0.46 * s, 0.42 * s, 0.42 * s, 0.2 * s); ctx.lineTo(0.42 * s, 0.27 * s); ctx.quadraticCurveTo(0, 0.54 * s, -0.42 * s, 0.27 * s); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // ---- corps : pieds dans les fixations (de dos : un pied devant l'autre le long de la planche), genoux fléchis
    const crouch = r.crouch || 0, side = r.pose === 'side';
    const fl = side || front ? { x: -0.3, y: -0.08 } : { x: -0.22, y: -0.34 }, fr = side || front ? { x: 0.3, y: -0.08 } : { x: 0.22, y: -0.04 };
    if (!side) { ctx.fillStyle = '#263238'; rr(ctx, -0.3 * s, (fl.y - 0.07) * s, 0.6 * s, 0.14 * s, 0.05 * s); ctx.fill(); rr(ctx, -0.3 * s, (fr.y - 0.07) * s, 0.6 * s, 0.14 * s, 0.05 * s); ctx.fill(); } // fixations
    const hipY = (side || front ? -0.8 : -0.95) + 0.1 * crouch, th = 0.6 * (1 - 0.14 * crouch), shY = hipY - th + 0.12, headY = hipY - th - 0.3 + 0.05 * crouch;
    const leg = (hx, foot, kneeDir) => { const kx = (hx + foot.x) / 2 + kneeDir * (0.16 + 0.3 * crouch), ky = (hipY + foot.y) / 2 + 0.04; ctx.strokeStyle = c.pants; ctx.lineWidth = 0.26 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx * s, hipY * s); ctx.quadraticCurveTo(kx * s, ky * s, foot.x * s, (foot.y - 0.08) * s); ctx.stroke(); };
    leg(-0.2, fl, -1); leg(0.2, fr, 1);
    rect(ctx, (fl.x - 0.2) * s, (fl.y - 0.14) * s, 0.4 * s, 0.16 * s, '#263238'); rect(ctx, (fr.x - 0.2) * s, (fr.y - 0.14) * s, 0.4 * s, 0.16 * s, '#263238'); // bottes
    // ---- torse (penché vers l'avant quand on s'accroupit : plus court)
    ctx.fillStyle = c.jacket; rr(ctx, -0.42 * s, (hipY - th) * s, 0.84 * s, (th + 0.06) * s, 0.15 * s); ctx.fill();
    if (!front) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; rr(ctx, -0.42 * s, (hipY - th) * s, 0.84 * s, 0.22 * s, 0.15 * s); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold ' + 0.3 * s + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(r.idx != null ? r.idx + 1 : 1), 0, (hipY - th * 0.25) * s); }
    else { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-0.04 * s, (hipY - th) * s, 0.08 * s, th * s); }
    // ---- bras
    ctx.strokeStyle = c.jacket; ctx.lineWidth = 0.16 * s; ctx.lineCap = 'round';
    const up = (r.state === 'air' || r.state === 'drop' || !!r.curTrick) && !grab && !method;
    let ax1 = -0.6, ay1 = shY + 0.45, ax2 = 0.6, ay2 = shY + 0.45;
    if (up) { ax1 = -0.75; ay1 = shY - 0.5; ax2 = 0.75; ay2 = shY - 0.5; }
    if (grab) { ax1 = -0.35; ay1 = -0.3; ax2 = 0.7; ay2 = shY - 0.45; }
    if (method) { ax1 = -0.3; ay1 = 0.12; ax2 = 0.8; ay2 = shY - 0.15; }
    if (!up && !grab && !method && r.state === 'ride') { ax1 += steer * 0.15 - 0.1 * crouch; ay1 += 0.15 * crouch - Math.max(0, -steer) * 0.5; ax2 += steer * 0.15 + 0.1 * crouch; ay2 += 0.15 * crouch - Math.max(0, steer) * 0.5; }
    ctx.beginPath(); ctx.moveTo(-0.38 * s, shY * s); ctx.lineTo(ax1 * s, ay1 * s); ctx.moveTo(0.38 * s, shY * s); ctx.lineTo(ax2 * s, ay2 * s); ctx.stroke();
    circ(ctx, ax1 * s, ay1 * s, 0.1 * s, c.skin); circ(ctx, ax2 * s, ay2 * s, 0.1 * s, c.skin);
    ctx.save(); ctx.translate(0, (headY + 1.55) * s);
    // ---- tête
    circ(ctx, 0, -1.55 * s, 0.32 * s, c.skin);
    if (r.def.id === 'shinobin') {
      ctx.fillStyle = c.hat; ctx.beginPath(); ctx.arc(0, -1.55 * s, 0.33 * s, 0, TAU); ctx.fill();
      if (front) { rect(ctx, -0.3 * s, -1.6 * s, 0.6 * s, 0.14 * s, c.skin); circ(ctx, -0.12 * s, -1.53 * s, 0.04 * s, '#263238'); circ(ctx, 0.12 * s, -1.53 * s, 0.04 * s, '#263238'); }
      rect(ctx, -0.33 * s, -1.66 * s, 0.66 * s, 0.06 * s, c.scarf); ctx.strokeStyle = c.scarf; ctx.lineWidth = 0.08 * s; ctx.beginPath(); ctx.moveTo(front ? 0.3 * s : -0.1 * s, -1.5 * s); ctx.lineTo((front ? 0.8 : 0.5) * s + Math.sin(t * 12) * 0.1 * s, -1.25 * s); ctx.stroke();
    } else if (front) {
      ctx.fillStyle = c.hair; ctx.beginPath(); ctx.arc(0, -1.6 * s, 0.33 * s, Math.PI, 0); ctx.fill();
      if (r.def.id === 'wendy') { rect(ctx, -0.55 * s, -1.75 * s, 0.2 * s, 0.4 * s, c.hair); rect(ctx, 0.35 * s, -1.75 * s, 0.2 * s, 0.4 * s, c.hair); }
      if (r.def.id === 'jam') for (let k = -2; k <= 2; k++) rect(ctx, k * 0.12 * s - 0.04 * s, -1.95 * s, 0.08 * s, 0.25 * s, c.hair);
      ctx.fillStyle = c.hat; ctx.beginPath(); ctx.arc(0, -1.68 * s, 0.3 * s, Math.PI, 0); ctx.fill();
      if (r.def.id !== 'nancy') rect(ctx, r.def.id === 'jam' ? -0.6 * s : 0, -1.72 * s, 0.6 * s, 0.09 * s, c.hat); else circ(ctx, 0, -1.98 * s, 0.1 * s, '#fff');
      const ex = 0.09;
      if (r.def.id === 'wendy' || r.def.id === 'tommy') { ctx.strokeStyle = '#263238'; ctx.lineWidth = 0.04 * s; ctx.beginPath(); ctx.arc(-0.12 * s, -1.52 * s, ex * s, 0, TAU); ctx.arc(0.12 * s, -1.52 * s, ex * s, 0, TAU); ctx.stroke(); }
      circ(ctx, -0.12 * s, -1.52 * s, 0.04 * s, '#263238'); circ(ctx, 0.12 * s, -1.52 * s, 0.04 * s, '#263238');
      if (r.state === 'fall') { ctx.strokeStyle = '#263238'; ctx.lineWidth = 0.04 * s; ctx.beginPath(); ctx.arc(0, -1.4 * s, 0.08 * s, 0, TAU); ctx.stroke(); }
      else { ctx.strokeStyle = '#8d4a3a'; ctx.lineWidth = 0.04 * s; ctx.beginPath(); ctx.arc(0, -1.45 * s, 0.1 * s, 0.2, Math.PI - 0.2); ctx.stroke(); }
    } else { // de dos : cheveux sur la nuque, casquette (visière cachée, sauf Jam qui la porte à l'envers)
      ctx.fillStyle = c.hair; ctx.beginPath(); ctx.arc(0, -1.55 * s, 0.33 * s, Math.PI * 0.9, Math.PI * 2.1); ctx.fill(); rect(ctx, -0.3 * s, -1.55 * s, 0.6 * s, 0.14 * s, c.hair);
      if (r.def.id === 'wendy') { rect(ctx, -0.55 * s, -1.75 * s, 0.2 * s, 0.45 * s, c.hair); rect(ctx, 0.35 * s, -1.75 * s, 0.2 * s, 0.45 * s, c.hair); }
      if (r.def.id === 'linda' || r.def.id === 'nancy') rect(ctx, -0.22 * s, -1.5 * s, 0.44 * s, 0.4 * s, c.hair);
      if (r.def.id === 'jam') for (let k = -2; k <= 2; k++) rect(ctx, k * 0.12 * s - 0.04 * s, -1.95 * s, 0.08 * s, 0.25 * s, c.hair);
      ctx.fillStyle = c.hat; ctx.beginPath(); ctx.arc(0, -1.66 * s, 0.31 * s, Math.PI, 0); ctx.fill(); rect(ctx, -0.31 * s, -1.68 * s, 0.62 * s, 0.1 * s, c.hat);
      if (r.def.id === 'jam') rect(ctx, -0.3 * s, -1.66 * s, 0.6 * s, 0.1 * s, c.hat); else if (r.def.id === 'nancy') circ(ctx, 0, -1.98 * s, 0.1 * s, '#fff'); else { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-0.12 * s, -1.75 * s, 0.24 * s, 0.05 * s); }
    }
    ctx.restore();
    ctx.restore();
    // ---- effets autour
    ctx.save(); ctx.translate(x, y - h * s);
    if (r.state === 'frozen') { ctx.fillStyle = 'rgba(128,222,234,0.6)'; rr(ctx, -0.9 * s, -2.1 * s, 1.8 * s, 2.15 * s, 0.2 * s); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, 0.05 * s); ctx.stroke(); }
    if (r.state === 'fall') { for (let k = 0; k < 3; k++) { const a = t * 5 + k * TAU / 3; circ(ctx, Math.cos(a) * 0.6 * s, -1.2 * s + Math.sin(a) * 0.25 * s, 0.1 * s, '#ffeb3b'); } }
    if (r.fx.parachute > 0) { ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(0, -3.6 * s, 1.5 * s, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ffab91'; ctx.beginPath(); ctx.arc(0, -3.6 * s, 0.5 * s, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1.5 * s, -3.6 * s); ctx.lineTo(0, -1.2 * s); ctx.lineTo(1.5 * s, -3.6 * s); ctx.stroke(); }
    if (r.fx.slow > 0) { circ(ctx, -0.5 * s, -3 * s, 0.5 * s, '#90a4ae'); circ(ctx, 0.3 * s, -3.2 * s, 0.6 * s, '#90a4ae'); circ(ctx, 0.9 * s, -2.9 * s, 0.4 * s, '#90a4ae'); ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = Math.max(1, 0.05 * s); for (let k = 0; k < 5; k++) { const yy = ((t * 6 + k * 0.37) % 1); ctx.beginPath(); ctx.moveTo((-0.8 + k * 0.4) * s, (-2.6 + yy * 1.8) * s); ctx.lineTo((-0.8 + k * 0.4) * s, (-2.4 + yy * 1.8) * s); ctx.stroke(); } }
    if (r.state === 'drop') { // la chaise de la remontée qui dépose le coureur
      ctx.strokeStyle = '#263238'; ctx.lineWidth = Math.max(1, 0.1 * s); ctx.beginPath(); ctx.moveTo(0, -2.2 * s); ctx.lineTo(0, -6 * s); ctx.stroke();
      ctx.fillStyle = '#ef5350'; rr(ctx, -1.1 * s, -0.25 * s, 2.2 * s, 0.3 * s, 0.1 * s); ctx.fill(); rr(ctx, -1.1 * s, -2.25 * s, 0.22 * s, 2.0 * s, 0.1 * s); ctx.fill(); rr(ctx, 0.88 * s, -2.25 * s, 0.22 * s, 2.0 * s, 0.1 * s); ctx.fill(); rr(ctx, -1.1 * s, -2.3 * s, 2.2 * s, 0.25 * s, 0.1 * s); ctx.fill();
    }
    if (!isMe && r.ctrl === 'human') { ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(9, 0.35 * s) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('J' + (r.player + 1), 0, -2.3 * s); }
    ctx.restore();
  };

  // ------------------------------------------------------------------ remontée mécanique
  R.drawLift = function (ctx, race, me, vx, vy, vw, vh, t) {
    const th = race.track.theme, g = ctx.createLinearGradient(0, vy, 0, vy + vh); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(vx, vy, vw, vh);
    R.drawBackdrop(ctx, th.bg, vx, vy + vh * 0.72, vw, th, t);
    ctx.fillStyle = th.ground[0]; ctx.beginPath(); ctx.moveTo(vx, vy + vh); ctx.lineTo(vx, vy + vh * 0.75); ctx.lineTo(vx + vw, vy + vh * 0.3); ctx.lineTo(vx + vw, vy + vh); ctx.fill();
    ctx.fillStyle = th.ground[1]; ctx.beginPath(); ctx.moveTo(vx, vy + vh); ctx.lineTo(vx, vy + vh * 0.9); ctx.lineTo(vx + vw * 0.6, vy + vh * 0.65); ctx.lineTo(vx + vw, vy + vh * 0.75); ctx.lineTo(vx + vw, vy + vh); ctx.fill();
    for (let k = 0; k < 5; k++) R.drawProp(ctx, th.decor[k % th.decor.length], vx + vw * (0.1 + k * 0.2), vy + vh * (0.9 - k * 0.1), 14 - k * 2, k * 0.2, t, {});
    // câble et pylônes
    const x0 = vx + vw * 0.08, y0 = vy + vh * 0.75, x1 = vx + vw * 0.92, y1 = vy + vh * 0.22;
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0 - 60); ctx.lineTo(x1, y1 - 60); ctx.stroke();
    for (let k = 0; k <= 1; k++) { const px = k ? x1 : x0, py = k ? y1 : y0; ctx.fillStyle = '#455a64'; ctx.fillRect(px - 6, py - 60, 12, 60 + vh * 0.1); ctx.fillRect(px - 40, py - 66, 80, 8); }
    const waiting = race.time < me.lift.board;
    const prog = waiting ? 0 : SK.clamp((race.time - me.lift.board) / SK.LIFT_RIDE, 0, 1);
    // autres chaises (coureurs en remontée)
    for (const o of race.racers) {
      if (o.state !== 'lift') continue;
      const p = race.time < o.lift.board ? 0 : SK.clamp((race.time - o.lift.board) / SK.LIFT_RIDE, 0, 1);
      const cx0 = x0 + (x1 - x0) * p, cy0 = y0 - 60 + (y1 - y0) * p, sw = Math.sin(t * 2 + o.idx) * 3;
      if (race.time < o.lift.board) { R.drawRacer(ctx, o, x0 + 40 + o.idx * 30, y0 + vh * 0.08, 36, t, o === me); continue; }
      ctx.strokeStyle = '#263238'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + sw, cy0 + 70); ctx.stroke();
      ctx.fillStyle = '#ef5350'; ctx.fillRect(cx0 + sw - 36, cy0 + 70, 72, 10); ctx.fillRect(cx0 + sw + 28, cy0 + 40, 8, 40);
      ctx.save(); ctx.translate(cx0 + sw, cy0 + 72); ctx.scale(1, 0.75); R.drawRacer(ctx, o, 0, 0, 40, t, o === me); ctx.restore();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, vx + vw / 2 - 190, vy + vh * 0.5 - 40, 380, 80, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(waiting ? 'Prochaine chaise dans ' + Math.max(0, me.lift.board - race.time).toFixed(1) + ' s' : 'Remontée vers le sommet… ' + Math.round(prog * 100) + ' %', vx + vw / 2, vy + vh * 0.5 - 4);
    ctx.font = '18px sans-serif'; ctx.fillText('Tour ' + me.lift.lapDone + ' terminé · ' + SK.ordinal(me.rank + 1) + ' place', vx + vw / 2, vy + vh * 0.5 + 26);
  };

  // ------------------------------------------------------------------ HUD
  R.drawHud = function (ctx, race, me, vx, vy, vw, vh, t) {
    const small = vw < 900, F = small ? 0.8 : 1;
    ctx.textBaseline = 'alphabetic';
    const box = (x, y, w, h) => { ctx.fillStyle = 'rgba(0,0,0,0.42)'; rr(ctx, x, y, w, h, 10); ctx.fill(); };
    // position et tour
    box(vx + 12, vy + 12, 150 * F, 74 * F);
    ctx.fillStyle = ['#ffd600', '#cfd8dc', '#ff8a65', '#fff', '#fff'][Math.min(4, me.rank)] || '#fff'; ctx.font = 'bold ' + 44 * F + 'px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(SK.ordinal(me.rank + 1), vx + 24, vy + 58 * F);
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + 16 * F + 'px sans-serif'; ctx.fillText('Tour ' + Math.min(race.laps, me.lap + 1) + ' / ' + race.laps, vx + 24, vy + 80 * F);
    ctx.fillText('sur ' + race.racers.length, vx + 100 * F, vy + 58 * F);
    // temps et pièces
    box(vx + vw - 12 - 180 * F, vy + 12, 180 * F, 74 * F);
    ctx.textAlign = 'right'; ctx.font = 'bold ' + 24 * F + 'px monospace'; ctx.fillStyle = '#fff';
    ctx.fillText(SK.fmtTime(Math.max(0, me.state === 'done' ? me.finishTime : race.time)), vx + vw - 24, vy + 42 * F);
    ctx.font = '900 ' + 22 * F + 'px "Arial Black", Arial, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(SK.fmtGold(me.coins), vx + vw - 24, vy + 74 * F);
    SK.drawGoldCoin(ctx, vx + vw - 24 - ctx.measureText(SK.fmtGold(me.coins)).width - 20 * F, vy + 66 * F, 12 * F);
    // tir et objet
    const slot = (x, y, kind, id, label, key) => {
      const def = id ? (kind === 'shot' ? SK.SHOTS[id] : SK.ITEMS[id]) : null;
      ctx.fillStyle = 'rgba(0,0,0,0.42)'; rr(ctx, x, y, 150 * F, 62 * F, 10); ctx.fill();
      ctx.strokeStyle = kind === 'shot' ? '#e53935' : '#1e88e5'; ctx.lineWidth = 3; ctx.beginPath(); rr(ctx, x + 6, y + 6, 50 * F, 50 * F, 8); ctx.stroke();
      ctx.textAlign = 'center'; ctx.font = 34 * F + 'px sans-serif'; ctx.fillStyle = '#fff'; if (def) ctx.fillText(def.icon, x + 6 + 25 * F, y + 6 + 40 * F);
      ctx.textAlign = 'left'; ctx.font = 'bold ' + 13 * F + 'px sans-serif'; ctx.fillStyle = kind === 'shot' ? '#ef9a9a' : '#90caf9'; ctx.fillText(label + (key ? ' (' + key + ')' : ''), x + 64 * F, y + 22 * F);
      ctx.fillStyle = '#fff'; ctx.font = 'bold ' + 14 * F + 'px sans-serif'; ctx.fillText(def ? def.name : '—', x + 64 * F, y + 44 * F);
    };
    const keys = me.player === 1 ? ['J', 'K'] : ['V', 'B'];
    slot(vx + 12, vy + vh - 12 - 62 * F, 'shot', me.shot, 'Tir', keys[0]);
    slot(vx + 12 + 158 * F, vy + vh - 12 - 62 * F, 'item', me.item, 'Objet', keys[1]);
    if (!me.shot && me.coins < SK.SHOT_COST && race.mode !== 'time') { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 11 * F + 'px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Boîte rouge = ' + SK.SHOT_COST + ' G', vx + 14, vy + vh - 12 - 66 * F); }
    // vitesse
    box(vx + vw - 12 - 170 * F, vy + vh - 12 - 62 * F, 170 * F, 62 * F);
    const kmh = Math.round(me.speed * 3.6), pct = SK.clamp(me.speed / (me.maxSpeed * 1.45), 0, 1);
    ctx.fillStyle = '#263238'; rr(ctx, vx + vw - 12 - 160 * F, vy + vh - 12 - 26 * F, 150 * F, 12 * F, 6); ctx.fill();
    ctx.fillStyle = me.fx.fan > 0 ? '#69f0ae' : pct > 0.8 ? '#ffd600' : '#4fc3f7'; rr(ctx, vx + vw - 12 - 160 * F, vy + vh - 12 - 26 * F, 150 * F * pct, 12 * F, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.font = 'bold ' + 20 * F + 'px monospace'; ctx.fillText(kmh + ' km/h', vx + vw - 24, vy + vh - 12 - 36 * F);
    const surf = SK.SURFACES[race.track.segAt(me.z).surface]; ctx.textAlign = 'left'; ctx.font = 12 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(surf ? surf.name : '', vx + vw - 12 - 160 * F, vy + vh - 12 - 36 * F);
    // barre de progression (la montagne) à droite
    const bx = vx + vw - 34, by0 = vy + 100 * F, by1 = vy + vh - 90 * F;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx, by0); ctx.lineTo(bx, by1); ctx.stroke();
    for (let k = 0; k <= race.laps; k++) { const yy = by0 + (by1 - by0) * k / race.laps; ctx.fillStyle = '#fff'; ctx.fillRect(bx - 8, yy - 1, 16, 2); }
    const total = race.laps * race.L;
    race.racers.slice().sort((a, b) => b.rank - a.rank).forEach(o => {
      const p = SK.clamp((o.state === 'done' ? total : o.progress()) / total, 0, 1), yy = by0 + (by1 - by0) * p;
      circ(ctx, bx, yy, o === me ? 11 : 8, o.def.colors.jacket); ctx.strokeStyle = o === me ? '#fff' : 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.def.name[0], bx, yy); ctx.textBaseline = 'alphabetic';
    });
    // messages centraux
    ctx.textAlign = 'center';
    if (race.phase === 'count') { const n = Math.min(3, Math.ceil(-race.time)); ctx.font = 'bold ' + 120 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(n > 0 ? String(n) : 'GO !', vx + vw / 2 + 4, vy + vh / 2 + 4); ctx.fillStyle = n > 1 ? '#ffd600' : '#69f0ae'; ctx.fillText(n > 0 ? String(n) : 'GO !', vx + vw / 2, vy + vh / 2); }
    else if (race.time < 1) { ctx.font = 'bold ' + 120 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText('GO !', vx + vw / 2 + 4, vy + vh / 2 + 4); ctx.fillStyle = '#69f0ae'; ctx.fillText('GO !', vx + vw / 2, vy + vh / 2); }
    if (me.lap + 1 < race.laps && me.state === 'ride' && me.z > race.L - 160) { // où est le portail de la remontée ?
      const dir = race.gateX > me.x + 2 ? '→' : race.gateX < me.x - 2 ? '←' : '↑';
      ctx.font = 'bold ' + 34 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(dir + ' Remontée ' + dir, vx + vw / 2 + 2, vy + vh * 0.34 + 2); ctx.fillStyle = '#ffd600'; ctx.fillText(dir + ' Remontée ' + dir, vx + vw / 2, vy + vh * 0.34);
    }
    if (me.curTrick) { ctx.font = 'bold ' + 26 * F + 'px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(me.curTrick.def.name + '…', vx + vw / 2, vy + vh * 0.3); }
    if (me.hud) {
      me.hud = me.hud.filter(m => m.until > race.time);
      me.hud.forEach((m, i) => { const a = SK.clamp((m.until - race.time) / 0.4, 0, 1); ctx.globalAlpha = a; ctx.font = 'bold ' + (m.big ? 40 : 26) * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(m.text, vx + vw / 2 + 2, vy + vh * 0.2 + i * 36 * F + 2); ctx.fillStyle = m.color || '#fff'; ctx.fillText(m.text, vx + vw / 2, vy + vh * 0.2 + i * 36 * F); ctx.globalAlpha = 1; });
    }
    if (me.state === 'done') { box(vx + vw / 2 - 160 * F, vy + vh / 2 - 50 * F, 320 * F, 100 * F); ctx.font = 'bold ' + 40 * F + 'px sans-serif'; ctx.fillStyle = '#ffd600'; ctx.fillText('Arrivée ! ' + SK.ordinal(me.rank + 1), vx + vw / 2, vy + vh / 2 + 2); ctx.font = 18 * F + 'px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(SK.fmtTime(me.finishTime), vx + vw / 2, vy + vh / 2 + 34 * F); }
  };
  R.notify = function (r, text, color, big, dur) { r.hud = r.hud || []; r.hud.push({ text, color, big, until: r.race.time + (dur || 2) }); if (r.hud.length > 3) r.hud.shift(); };
})(window.SK);
