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
    // L’étourdissement utilise les étoiles et le voile ci-dessous.
    // Un filtre blur sur chaque primitive de la piste bloque le rendu Canvas.
    const T = race.track, th = T.theme, segs = T.segs;
    if (me.state === 'lift') { R.drawLift(ctx, race, me, vx, vy, vw, vh, t); R.drawHud(ctx, race, me, vx, vy, vw, vh, t); ctx.restore(); return; }
    // Focus et vent : apparition progressive entre 60 et 90 km/h.
    const speedFocus = SK.clamp(((me.speed || 0) - 60 / 3.6) / (30 / 3.6), 0, 1);
    const focus = me.state === 'ride' ? (me.crouch || 0) * speedFocus : 0;
    const f = (vw / 2) * camDepth * (1 + .06 * focus), cx = vx + vw / 2, cy = vy + vh * 0.42;
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
    for (const k of race.rocks) { const i = Math.floor(k.z / SEG); (bySeg[i] = bySeg[i] || []).push({ kind: 'rock', trapType:k.type||'rock', x: k.x, z: k.z, h: 0 }); }
    for(const e of race.explosions||[]){const i=Math.floor(e.z/SEG);(bySeg[i]=bySeg[i]||[]).push({kind:'explosion',e,x:e.x,z:e.z,h:1});}
    for (const sh of race.shots) { if (sh.drop != null) { if (sh.target) (bySeg[Math.floor(sh.target.z / SEG)] = bySeg[Math.floor(sh.target.z / SEG)] || []).push({ kind: 'shot', s: sh, x: sh.target.x, z: sh.target.z, h: sh.h }); } else if (sh.z != null) { const i = Math.floor(sh.z / SEG); (bySeg[i] = bySeg[i] || []).push({ kind: 'shot', s: sh, x: sh.x, z: sh.z, h: sh.h }); } }
    for (let n = proj.length - 1; n >= 0; n--) {
      const p = proj[n]; if (p.x1 == null) continue; const s = p.s;
      if(!p.hidden){ctx.save();ctx.beginPath();ctx.rect(vx,vy,vw,Math.max(0,p.clip-vy));ctx.clip();R.drawFence(ctx,th,s,p,p.n);ctx.restore();}
      const items = [];
      for (const pr of s.props) if(!pr.destroyed)items.push({ kind: 'prop', p: pr, x: pr.x, z: s.z + (pr.dz == null ? SEG / 2 : pr.dz), h: 0 });
      for (const b of s.boxes) if (b.taken <= race.time) items.push({ kind: 'box', b, x: b.x, z: s.z + SEG / 2, h: 0.6 });
      for (const c of s.coins) if (c.taken <= race.time) items.push({ kind: 'coin', c, x: c.x, z: s.z + SEG / 2, h: 0.5 });
      if(s.puzzle&&!s.puzzle.taken)items.push({kind:'puzzle',x:s.puzzle.x,z:s.z+SEG/2,h:1});
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
        if(it.kind==='explosion'){const age=(race.time-it.e.at)/1.2;ctx.save();ctx.globalAlpha=1-age;for(let k=0;k<12;k++){const a=k*Math.PI/6;circ(ctx,sx+Math.cos(a)*sc*age*5,sy-sc+Math.sin(a)*sc*age*5,sc*(.6+age),k%2?'#ffb52e':'#fff4a4');}ctx.restore();}
        if (it.kind === 'prop') R.drawProp(ctx, it.p.type, sx, sy, sc, it.p.v || 0, t, it.p);
        else if (it.kind === 'box') R.drawBox(ctx, it.b, sx, sy, sc, t);
        else if(it.kind==='puzzle')SK.PhotoPuzzles.drawPiece(ctx,sx,sy,sc,t);
        else if (it.kind === 'coin') R.drawCoin(ctx, sx, sy, sc, t);
        else if (it.kind === 'rock') R.drawProp(ctx, it.trapType, sx, sy, sc, 0.5, t, {});
        else if (it.kind === 'shot') R.drawShot(ctx, it.s, sx, sy - it.h * sc, sc, t);
        else if (it.kind === 'racer') { if (it.r === me) me.screen = { sx, sy, sc }; R.drawRacer(ctx, it.r, sx, sy, sc, t, it.r === me); }
        ctx.restore();
      }
    }
    if (th.snowfall) R.drawSnowfall(ctx, vx, vy, vw, vh, t, me.speed);
    if(focus>0){
      const glow=ctx.createRadialGradient(vx+vw*.5,vy+vh*.7,vw*.16,vx+vw*.5,vy+vh*.7,vw*.72);
      glow.addColorStop(0,'rgba(8,30,65,0)');glow.addColorStop(1,`rgba(8,30,65,${.25*focus})`);
      ctx.fillStyle=glow;ctx.fillRect(vx,vy,vw,vh);
      // Traînées périphériques : conserver la piste et le Kid dégagés au centre.
      const strength=focus*SK.clamp((me.speed||0)/24,0,1);
      ctx.save();ctx.beginPath();ctx.rect(vx,vy,vw*.24,vh);ctx.rect(vx+vw*.76,vy,vw*.24,vh);ctx.clip();
      ctx.lineCap='round';
      for(let side of [-1,1])for(let i=0;i<20;i++){
        const phase=(t*(1.7+(i%3)*.3)+i*.618)%1;
        const dx=side*vw*(.29+phase*.32),dy=((i/19)-.5)*vh*1.7;
        const sx=vx+vw*.5+dx,sy=vy+vh*.52+dy*(.45+phase*.55);
        ctx.globalAlpha=strength*Math.sin(phase*Math.PI)*.85;
        ctx.strokeStyle=i%3?'#ffffff':'#9beaff';ctx.lineWidth=Math.max(1.5,vw*.002)*(1+phase);
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+dx*.25,sy+dy*.2);ctx.stroke();
      }ctx.restore();
    }
    if(race.course.blizzard)R.drawBlizzard(ctx,race,me,vx,vy,vw,vh);
    SK.LensSnow.draw(ctx,me,vx,vy,vw,vh);
    ctx.filter='none';
    if(me.state==='stunned'){ctx.fillStyle='rgba(12,18,35,'+(.13+.025*Math.sin(t*4))+')';ctx.fillRect(vx,vy,vw,vh);}
    if(!race.preview)R.drawHud(ctx, race, me, vx, vy, vw, vh, t);
    const incoming=race.shots.find(s=>s.target===me);
    if(incoming){ctx.save();const w=Math.min(vw*.65,520),x=vx+(vw-w)/2,y=vy+vh*.12;ctx.fillStyle=Math.sin(t*12)>0?'#b62237':'#e14d37';ctx.beginPath();ctx.roundRect(x,y,w,56,18);ctx.fill();ctx.fillStyle='#fff6cf';ctx.font='bold 25px sans-serif';ctx.textAlign='center';ctx.fillText('⚠ '+(SK.powerPresentation(incoming.from,'shot',incoming.kind).name)+' approche !',vx+vw/2,y+36);ctx.restore();}

    ctx.restore();
  };

  R.drawBlizzard=function(c,race,me,x,y,w,h){
    const gust=SK.stormAt(race.course,race.time,race.seed),t=Math.max(0,race.time),power=gust.strength;
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    c.fillStyle='rgba(37,58,86,.23)';c.fillRect(x,y,w,h);
    const fog=c.createLinearGradient(0,y,0,y+h);fog.addColorStop(0,'rgba(170,188,207,.68)');fog.addColorStop(.39,'rgba(216,229,237,'+(.79+power*.12)+')');fog.addColorStop(.68,'rgba(216,229,237,.36)');fog.addColorStop(1,'rgba(216,229,237,.08)');c.fillStyle=fog;c.fillRect(x,y,w,h);
    c.lineCap='round';for(let i=0;i<130;i++){const depth=.4+(i%5)*.16,dx=gust.direction*power*340;const sx=x+((i*97.31+t*(35+dx)*depth)%w+w)%w,sy=y+((i*73.13+t*95*depth)%h+h)%h;c.strokeStyle='rgba(255,255,255,'+(.3+depth*.45)+')';c.lineWidth=1+depth*1.8;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx-(12+power*50)*gust.direction*depth,sy-7*depth);c.stroke();}
    if((gust.warning||power>.01)&&me.state!=='done'){
      const scale=Math.min(w/1150,h/680),cx=x+(gust.direction>0?w*.15:w*.85),cy=y+h*.27;
      c.save();c.translate(cx,cy+Math.sin(t*3)*5*scale);c.scale(scale*(gust.direction>0?1:-1),scale);
      c.fillStyle='#536078';c.strokeStyle='#2c374e';c.lineWidth=4;c.beginPath();c.moveTo(-84,22);c.bezierCurveTo(-135,14,-117,-43,-77,-35);c.bezierCurveTo(-77,-92,-10,-102,12,-63);c.bezierCurveTo(57,-91,103,-53,88,-17);c.bezierCurveTo(142,-11,126,46,76,45);c.lineTo(-74,45);c.closePath();c.fill();c.stroke();
      for(const ex of [-32,27]){c.fillStyle='#f5f7ff';c.beginPath();c.ellipse(ex,-15,18,15,0,0,TAU);c.fill();circ(c,ex+7,-13,7,'#182034');}
      c.strokeStyle='#20273d';c.lineWidth=7;c.beginPath();c.moveTo(-54,-39);c.lineTo(-13,-26);c.moveTo(8,-26);c.lineTo(46,-39);c.stroke();
      c.fillStyle='#253047';c.beginPath();c.ellipse(64,18,12,8+power*10,0,0,TAU);c.fill();
      if(power>0){c.strokeStyle='#effaff';c.lineWidth=3;for(let i=0;i<5;i++){const len=60+power*160;c.beginPath();c.moveTo(80,12+i*6);c.bezierCurveTo(105,0+i*15,130+len*.4,15+i*12,80+len,5+i*18+Math.sin(t*5+i)*10);c.stroke();}}
      c.restore();c.textAlign='center';c.font='bold '+Math.max(14,22*scale)+'px "Trebuchet MS",sans-serif';c.lineWidth=5;c.strokeStyle='#263952';c.fillStyle='#fff6cf';const label=gust.warning?'Attention, bourrasque !':gust.direction>0?'Vent → · Compense vers la gauche !':'← Vent · Compense vers la droite !';c.strokeText(label,x+w*.5,y+h*.15);c.fillText(label,x+w*.5,y+h*.15);
    }
    c.restore();
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

  R.drawFence = function(ctx,th,s,p,n){
    const fog=SK.clamp((n-DRAW*.55)/(DRAW*.45),0,1);
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
      case 'trailwarning': {const jump=p.action==='jump';rect(ctx,x-.08*s,y-2.8*s,.16*s,2.8*s,'#6d5039');ctx.fillStyle='#ffcf57';ctx.beginPath();ctx.moveTo(x,y-3.8*s);ctx.lineTo(x+1.1*s,y-2.8*s);ctx.lineTo(x,y-1.8*s);ctx.lineTo(x-1.1*s,y-2.8*s);ctx.closePath();ctx.fill();ctx.fillStyle='#233b51';ctx.font='bold '+Math.max(11,s*.48)+'px Arial';ctx.textAlign='center';ctx.fillText(jump?'SAUTE':'BAISSE',x,y-2.78*s);ctx.font='bold '+Math.max(9,s*.28)+'px Arial';ctx.fillText(jump?'RELÂCHE X':'MAINTIENS ↑',x,y-2.4*s);break;}
      case 'fallenlog': {const half=(p.span||12)*s,col=p.style==='metal'?'#687e8c':p.style==='bamboo'?'#66863d':'#815031';ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x-half,y-.78*s,half*2,.78*s,.28*s);ctx.fill();ctx.strokeStyle=p.style==='metal'?'#ffd05b':'#ba8451';ctx.lineWidth=Math.max(1,s*.08);for(let k=-4;k<=4;k++){ctx.beginPath();ctx.moveTo(x+half*k/5,y-.65*s);ctx.lineTo(x+half*k/5+s*.25,y-.15*s);ctx.stroke();}circ(ctx,x-half,y-.39*s,.39*s,'#c49b6a');circ(ctx,x-half,y-.39*s,.23*s,'#966c41');if(p.style==='wood'){ctx.strokeStyle='#68432b';ctx.lineWidth=s*.18;ctx.beginPath();ctx.moveTo(x+half*.5,y-.5*s);ctx.lineTo(x+half*.5+s*.65,y-s*1.05);ctx.stroke();}break;}
      case 'lowarch': {const half=(p.span||12)*s;ctx.fillStyle='#65422c';ctx.fillRect(x-half,y-2.4*s,.3*s,2.4*s);ctx.fillRect(x+half-.3*s,y-2.4*s,.3*s,2.4*s);ctx.fillRect(x-half,y-2.4*s,half*2,1*s);ctx.fillStyle='#fff5c4';ctx.font='bold '+Math.max(10,s*.45)+'px sans-serif';ctx.textAlign='center';ctx.fillText('↑ BAISSE-TOI',x,y-1.75*s);break;}
      case 'polarbear': {
        ctx.save();ctx.translate(x,y);ctx.scale(p.dir||1,1);
        ctx.fillStyle='#7697ab55';ctx.beginPath();ctx.ellipse(0,0,s*1.65,s*.36,0,0,TAU);ctx.fill();
        for(let i=0;i<4;i++){const xx=(-1+i*.65)*s,step=p.phase==='warning'?0:Math.sin(t*(p.phase==='charge'?17:6)+i*2)*s*.14;rect(ctx,xx,-s*.8+step,s*.38,s*.8-step,i%2?'#d0e4ed':'#f5fbff');}
        ctx.fillStyle='#eef8fc';ctx.beginPath();ctx.ellipse(-s*.15,-s*1.25,s*1.45,s*.86,0,0,TAU);ctx.fill();
        circ(ctx,s*1.05,-s*1.95,s*.61,'#fff');circ(ctx,s*.8,-s*2.48,s*.23,'#e1eff5');circ(ctx,s*.8,-s*2.48,s*.12,'#9caeb9');
        circ(ctx,s*1.53,-s*1.82,s*.35,'#e3f0f5');circ(ctx,s*1.77,-s*1.87,s*.15,'#263d50');circ(ctx,s*1.18,-s*2.08,s*.075,'#192e40');
        ctx.strokeStyle='#263d50';ctx.lineWidth=Math.max(1,s*.06);ctx.beginPath();ctx.moveTo(s*.99,-s*2.25);ctx.lineTo(s*1.28,-s*2.17);ctx.stroke();ctx.restore();
        if(p.phase==='warning'){ctx.fillStyle='#ffcc49';ctx.font='bold '+Math.max(18,s*1.1)+'px Arial';ctx.textAlign='center';ctx.fillText('!',x,y-s*3.2);}
        break;
      }
      case 'snowguard': {
        R.drawProp(ctx,'snowman',x,y,s*1.3,v,t,{});
        ctx.strokeStyle='#4a2730';ctx.lineWidth=Math.max(2,s*.09);ctx.beginPath();ctx.moveTo(x-s*.30,y-s*3.06);ctx.lineTo(x-s*.06,y-s*2.95);ctx.moveTo(x+s*.30,y-s*3.06);ctx.lineTo(x+s*.06,y-s*2.95);ctx.stroke();
        const side=p.x>0?-1:1,raised=p.windup>0;ctx.strokeStyle='#715135';ctx.lineWidth=Math.max(2,s*.12);ctx.beginPath();ctx.moveTo(x+side*s*.5,y-s*1.8);ctx.lineTo(x+side*s*1.1,y-s*(raised?2.9:1.6));ctx.stroke();
        if(raised){circ(ctx,x+side*s*1.1,y-s*2.9,s*.36,'#fff');ctx.fillStyle='#ffcb47';ctx.font='bold '+Math.max(15,s*.9)+'px Arial';ctx.textAlign='center';ctx.fillText('!',x,y-s*4.2);}
        break;
      }
      case 'snowman': case 'bigsnowman': { const k = type === 'bigsnowman' ? 6 : 1; circ(ctx, x, y - 0.6 * k * s, 0.65 * k * s, '#fafafa'); circ(ctx, x, y - 1.45 * k * s, 0.5 * k * s, '#ffffff'); circ(ctx, x, y - 2.15 * k * s, 0.38 * k * s, '#ffffff'); circ(ctx, x - 0.13 * k * s, y - 2.25 * k * s, 0.05 * k * s, '#000'); circ(ctx, x + 0.13 * k * s, y - 2.25 * k * s, 0.05 * k * s, '#000'); drawCarrot(ctx, x + 0.12 * k * s, y - 2.13 * k * s, k * s); rect(ctx, x - 0.3 * k * s, y - 2.55 * k * s, 0.6 * k * s, 0.08 * k * s, '#212121'); rect(ctx, x - 0.2 * k * s, y - 2.95 * k * s, 0.4 * k * s, 0.42 * k * s, '#212121'); if (k > 1) { ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 0.1 * k * s; ctx.beginPath(); ctx.moveTo(x - 0.4 * k * s, y - 1.85 * k * s); ctx.lineTo(x + 0.4 * k * s, y - 1.8 * k * s); ctx.stroke(); } break; }
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
      case 'banana': {
        ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.lineCap='round';ctx.lineJoin='round';
        for(const [dx,dy] of [[-1.1,.05],[.9,.22],[.45,-.65]]){
          ctx.beginPath();ctx.moveTo(0,-.35);ctx.quadraticCurveTo(dx*.25,.18,dx,dy);
          ctx.strokeStyle='#a57414';ctx.lineWidth=.22;ctx.stroke();ctx.strokeStyle='#ffe34b';ctx.lineWidth=.15;ctx.stroke();
        }
        ctx.fillStyle='#765023';ctx.fillRect(-.07,-.48,.14,.22);ctx.restore();break;
      }
      case 'cone': { tri(ctx, x, y, 1 * s, 1.4 * s, '#ff6d00'); rect(ctx, x - 0.3 * s, y - 0.8 * s, 0.6 * s, 0.2 * s, '#fff'); break; }
      case 'cow': {
        ctx.save();ctx.translate(x,y);ctx.scale(p?.facing||1,1);
        const phase=p?.walk?(p.walkTime||0)*5+v*6:0;
        ctx.fillStyle='#244a2b30';ctx.beginPath();ctx.ellipse(0,0,s*1.65,s*.32,0,0,TAU);ctx.fill();
        for(let k=0;k<4;k++){
          const base=(k<2?-.95:.8)*s,shift=p?.walk?Math.sin(phase+k*Math.PI*.7)*s*.22:0;
          ctx.strokeStyle=k%2?'#fff':'#c5d0d1';ctx.lineWidth=s*.21;ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(base,-s*.7);ctx.lineTo(base+shift,-s*.12);ctx.stroke();
          ctx.strokeStyle='#343c40';ctx.lineWidth=s*.23;ctx.beginPath();ctx.moveTo(base+shift,-s*.12);ctx.lineTo(base+shift+s*.13,-s*.07);ctx.stroke();
        }
        ctx.fillStyle='#fff';rr(ctx,-s*1.3,-s*1.6,s*2.6,s*1.05,s*.32);ctx.fill();
        circ(ctx,-s*.55,-s*1.22,s*.34,'#263238');circ(ctx,s*.55,-s*.92,s*.26,'#263238');
        ctx.strokeStyle='#eee';ctx.lineWidth=s*.10;ctx.beginPath();ctx.moveTo(-s*1.28,-s*1.3);ctx.quadraticCurveTo(-s*1.7,-s*1.15,-s*1.65,-s*.7+Math.sin(phase)*s*.12);ctx.stroke();
        ctx.fillStyle='#fff';rr(ctx,s*.95,-s*1.95,s*.87,s*.9,s*.24);ctx.fill();
        circ(ctx,s*1.60,-s*1.25,s*.28,'#efb6be');circ(ctx,s*1.50,-s*1.66,s*.065,'#263238');
        ctx.strokeStyle='#e1c595';ctx.lineWidth=s*.1;ctx.beginPath();ctx.moveTo(s*1.1,-s*1.88);ctx.lineTo(s*1.02,-s*2.13);ctx.moveTo(s*1.58,-s*1.9);ctx.lineTo(s*1.65,-s*2.12);ctx.stroke();
        ctx.restore();break;
      }
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
      case 'flag': { const col = (p && p.color) || '#e53935', h = 2.4 * s; rect(ctx, x - 0.06 * s, y - h, 0.12 * s, h, '#eceff1'); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 0.06 * s, y - h); ctx.lineTo(x + 1.1 * s + Math.sin(t * 6 + x) * 0.1 * s, y - h + 0.4 * s); ctx.lineTo(x + 0.06 * s, y - h + 0.8 * s); ctx.closePath(); ctx.fill(); break; }
      case 'liftpole': { const h = 9 * s; rect(ctx, x - 0.2 * s, y - h, 0.4 * s, h, '#546e7a'); rect(ctx, x - 1.5 * s, y - h, 3 * s, 0.3 * s, '#546e7a'); break; }
      default: { circ(ctx, x, y - 0.6 * s, 0.6 * s, '#9e9e9e'); }
    }
  };
  R.drawBox = function (ctx, b, x, y, s, t) {
    const sz = 1.2 * s, bob = Math.sin(t * 4 + b.x) * 0.1 * s, cy0 = y - 0.9 * s - bob;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, sz * 0.6, sz * 0.2, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, cy0); ctx.rotate(Math.sin(t * 3) * 0.25);
    const red=b.kind==='red',face=red?'#ed4944':'#278fe6',side=red?'#9e252b':'#15549d',top=red?'#ff9180':'#83d5ff';
    const poly=(pts,col)=>{ctx.fillStyle=col;ctx.beginPath();pts.forEach(([a,b],i)=>i?ctx.lineTo(a*sz,b*sz):ctx.moveTo(a*sz,b*sz));ctx.closePath();ctx.fill();ctx.strokeStyle='#ffffff88';ctx.lineWidth=Math.max(1,sz*.025);ctx.stroke();};
    poly([[-.5,-.5],[-.2,-.76],[.8,-.76],[.5,-.5]],top);
    poly([[.5,-.5],[.8,-.76],[.8,.24],[.5,.5]],side);
    poly([[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],face);
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + sz * 0.8 + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.kind === 'red' ? '!' : '?', 0, sz * 0.05); ctx.restore();
  };
  R.drawCoin = function (ctx, x, y, s, t) {
    const r = 0.45 * s, w = Math.abs(Math.cos(t * 5 + x * 0.01)) * r + 0.1;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.25, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.ellipse(x, y - 0.9 * s, w, r, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff8f00'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.stroke();
  };
  function drawCarrot(ctx, x, y, s) {
    ctx.fillStyle = '#ff8743'; ctx.beginPath();
    ctx.moveTo(x, y - 0.065 * s); ctx.lineTo(x + 0.34 * s, y + 0.025 * s);
    ctx.lineTo(x, y + 0.065 * s); ctx.closePath(); ctx.fill();
  }
  function powerStar(ctx,x,y,r,color,angle=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();
    for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.42:r;ctx.lineTo(Math.cos(a)*d,Math.sin(a)*d);}
    ctx.closePath();ctx.fill();ctx.restore();
  }
  R.drawStarBoost=function(ctx,x,y,s,t){
    ctx.save();
    const colors=['#fff176','#ff76cf','#69d9ff','#c69aff'];
    for(let i=0;i<28;i++){
      const age=((t*1.6+i*.137)%1+1)%1,spread=(Math.sin(i*27.4)*.9)*(.25+age);
      const px=x+spread*s,py=y+s*(.15+age*2.5);
      ctx.globalAlpha=(1-age)*.95;
      ctx.strokeStyle=colors[i%4];ctx.lineWidth=Math.max(1,s*.035*(1-age));
      ctx.beginPath();ctx.moveTo(px-spread*s*.12,py-s*.24);ctx.lineTo(px,py);ctx.stroke();
      powerStar(ctx,px,py,s*(.055+.11*(1-age)),colors[i%4],t*2+i);
    }
    ctx.restore();
  };
  R.drawUnicorn=function(ctx,x,y,s,t){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    // A galloping white unicorn, with a golden horn and flowing rainbow mane.
    const ellipse=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
    for(let i=0;i<9;i++)powerStar(ctx,-.7-i*.14,-.45+Math.sin(t*9+i)*.18,.09,['#fff176','#ff76cf','#69d9ff'][i%3],t+i);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(let i=0;i<4;i++){
      const hip=i<2?-.35:.35,phase=t*16+(i%2)*Math.PI+(i<2?.6:0),foot=hip+Math.sin(phase)*.28;
      ctx.strokeStyle=i%2?'#e1d8ed':'#fff5ff';ctx.lineWidth=.17;ctx.beginPath();ctx.moveTo(hip,-.55);ctx.lineTo(foot,-.2);ctx.lineTo(foot+.1,-.08);ctx.stroke();
      ellipse(foot+.1,-.06,.12,.075,'#c17add');
    }
    ellipse(0,-.65,.66,.34,'#fff6ff');
    ctx.strokeStyle='#fff6ff';ctx.lineWidth=.38;ctx.beginPath();ctx.moveTo(.36,-.65);ctx.lineTo(.49,-1.18);ctx.stroke();
    for(let i=0;i<3;i++){ctx.strokeStyle=['#ff76cf','#69d9ff','#c69aff'][i];ctx.lineWidth=.12;ctx.beginPath();ctx.moveTo(.41-i*.07,-1.34);ctx.bezierCurveTo(.08-i*.1,-1.2,.38,-.9,.16-i*.08,-.8);ctx.stroke();}
    ellipse(.57,-1.24,.29,.23,'#fff6ff');ellipse(.81,-1.16,.24,.14,'#f7d7f1');
    ctx.fillStyle='#fff0ff';ctx.beginPath();ctx.moveTo(.39,-1.35);ctx.lineTo(.35,-1.7);ctx.lineTo(.59,-1.4);ctx.fill();
    ctx.fillStyle='#ffe36a';ctx.beginPath();ctx.moveTo(.68,-1.4);ctx.lineTo(.96,-1.85);ctx.lineTo(.84,-1.34);ctx.fill();
    ellipse(.68,-1.29,.045,.055,'#303252');ellipse(.69,-1.31,.014,.018,'#fff');
    ctx.restore();
  };
  R.drawShot = function (ctx, sh, x, y, s, t) {
    const k = sh.kind;
    if(k==='wildsnow'){circ(ctx,x,y,s*.42,'#8ab8d2');circ(ctx,x-s*.06,y-s*.06,s*.34,'#fff');return;}
    if(k==='bombe'&&sh.from?.def?.id==='alexie'){R.drawUnicorn(ctx,x,y,s,t);return;}
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    if (k === 'bombe') { circ(ctx, x, y - 0.6 * s, 0.55 * s, '#212121'); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = Math.max(1, 0.1 * s); ctx.beginPath(); ctx.moveTo(x, y - 1.1 * s); ctx.lineTo(x + 0.3 * s, y - 1.5 * s); ctx.stroke(); circ(ctx, x + 0.3 * s, y - 1.5 * s, 0.15 * s * (1 + Math.sin(t * 20) * 0.5), '#ffab00'); }
    else if (k === 'parachute') { ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(x, y - 1.5 * s, 1 * s, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - s, y - 1.5 * s); ctx.lineTo(x, y - 0.3 * s); ctx.lineTo(x + s, y - 1.5 * s); ctx.stroke(); circ(ctx, x, y - 0.3 * s, 0.25 * s, '#333'); }
    else if (k === 'gel') { ctx.fillStyle = 'rgba(128,222,234,0.9)'; ctx.beginPath(); ctx.moveTo(x, y - 1.6 * s); ctx.lineTo(x + 0.5 * s, y - 0.8 * s); ctx.lineTo(x, y); ctx.lineTo(x - 0.5 * s, y - 0.8 * s); ctx.fill(); }
    else if (k === 'poele') { ctx.save(); ctx.translate(x, y - 0.6 * s); ctx.rotate(t * 8); circ(ctx, 0, 0, 0.7 * s, '#37474f'); circ(ctx, 0, 0, 0.5 * s, '#546e7a'); rect(ctx, 0.6 * s, -0.1 * s, 1.2 * s, 0.2 * s, '#212121'); ctx.restore(); }
    else if (k === 'bonhomme') { circ(ctx, x, y - 0.6 * s, 0.6 * s, '#fff'); circ(ctx, x, y - 1.4 * s, 0.4 * s, '#fff'); drawCarrot(ctx, x + 0.12 * s, y - 1.4 * s, s); }
  };
  R.drawSnowfall = function (ctx, vx, vy, vw, vh, t, speed) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 90; i++) { const px = vx + ((i * 97.3 + t * (20 + i % 7 * 9)) % vw + vw) % vw, py = vy + ((i * 61.7 + t * (120 + i % 5 * 40 + speed * 3)) % vh + vh) % vh; ctx.fillRect(px, py, 2 + i % 3, 2 + i % 3); }
  };

  // ------------------------------------------------------------------ coureur (vectoriel). x,y = pieds au sol ; s = px/m
  // Même silhouette de trois quarts en course et dans les menus, le village et la boutique.
  // La vue de face est réservée aux vrilles et aux chutes. Apparence = personnage + garde-robe (r.look).
  const lookOf = r => { const d = r.def, c = d.colors, l = r.look || {}; return { gripBoots:l.gripBoots??!!r.gear?.bottes, rocketPack: l.rocketPack ?? !!r.gear?.fusee, goggles:Object.prototype.hasOwnProperty.call(l,'goggles')?l.goggles:['lunettesMiroir','lunettesTricolores','lunettesNeige','lunettesForet','lunettes'].find(id=>r.gear?.[id])||null, helmet: Object.prototype.hasOwnProperty.call(l,'helmet')?l.helmet:Object.keys(r.gear||{}).find(SK.isHelmet)||false, jacket: l.jacket || c.jacket, pants: l.pants || c.pants, hat: l.hat || d.hat || 'cap', hatColor: l.hatColor || c.hat, hair: l.hair || d.hairStyle || 'short', hairColor: l.hairColor || c.hair, skin: l.skin || c.skin, scarf: c.scarf, board: r.board?.color || c.board }; };
  const shade = (hex, k) => { const A = parse(hex.length === 7 ? hex : '#888888'); return 'rgb(' + Math.round(A[0] * k) + ',' + Math.round(A[1] * k) + ',' + Math.round(A[2] * k) + ')'; };
  const line = (ctx, pts, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); };
  R.drawRacer = function (ctx, r, x, y, s, t, isMe) {
    s *= SK.characterScale(r.def.id);
    const L = lookOf(r), h = r.h || 0;
    if(r.state==='stunned'){ctx.save();ctx.font='bold '+Math.max(12,s*.28)+'px Arial';ctx.textAlign='center';ctx.fillStyle='#ffdf4d';for(let i=0;i<5;i++){const a=t*3+i*TAU/5;ctx.fillText('★',x+Math.cos(a)*s*.55,y-s*2.7+Math.sin(a)*s*.14);}ctx.restore();}
    if(r.fx?.wobble>0)x+=Math.sin(t*20)*s*.08;
    if(r.fx?.pushPose>0)x+=(r.pushDirection||1)*s*.12;
    ctx.fillStyle = 'rgba(0,0,0,' + (0.22 / (1 + h * 0.5)) + ')'; ctx.beginPath(); ctx.ellipse(x + 0.1 * s, y + 0.12 * s, 0.62 * s / (1 + h * 0.15), 0.30 * s / (1 + h * 0.15), 0, 0, TAU); ctx.fill();
    if(r.state==='drop'){R.drawChair(ctx,r,x,y-h*s-s*.5,s,t);return;}
    if((r.fx?.fan>0||r.fx?.comboBoost>0)&&r.def.id==='alexie')R.drawStarBoost(ctx,x,y-h*s,s,t);
    else if (r.fx && (r.fx.fan > 0 || r.fx.comboBoost > 0)) {
      ctx.save(); ctx.translate(x,y-h*s-.65*s);
      ctx.fillStyle='#344b61'; ctx.strokeStyle='#b9e3ef'; ctx.lineWidth=.06*s;
      ctx.beginPath();ctx.arc(0,0,.38*s,0,TAU);ctx.fill();ctx.stroke();
      ctx.rotate(t*35);ctx.fillStyle='#d8f6ff';
      for(let blade=0;blade<3;blade++){ctx.rotate(TAU/3);ctx.beginPath();ctx.ellipse(.16*s,0,.19*s,.075*s,.35,0,TAU);ctx.fill();}
      ctx.fillStyle='#ffc747';ctx.beginPath();ctx.arc(0,0,.07*s,0,TAU);ctx.fill();ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, 0.08 * s); for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 0.5 * s, y - 0.3 * s - h * s + Math.sin(t * 30 + k) * 0.1 * s); ctx.lineTo(x + k * 0.5 * s, y + 0.9 * s - h * s); ctx.stroke(); } }
    ctx.save(); ctx.translate(x, y - h * s);
    if(r.fx?.pushHit>0)ctx.rotate((r.pushHitDirection||1)*.28*Math.sin(Math.PI*(1-r.fx.pushHit/.65)));
    if (r.fx && r.fx.invisible > 0) ctx.globalAlpha = isMe ? 0.45 : 0.25;
    const steer = r.visualTurn != null ? r.visualTurn : r.steer != null ? r.steer : (r.input ? r.input.steer : 0), crouch = Math.max(r.crouch||0,r.jumpCharge||0,r.pumpPose||0);
    let front = false, anim = null, p = 0, grab = false, method = false;
    if (r.curTrick) {
      const d = r.curTrick.def; p = Math.min(1, r.curTrick.t / d.dur); anim = d.anim;
      if (anim === 'spin' || anim === 'rodeo') { const ang = p * TAU * (d.turns || 1) * (d.sign || 1), cs = Math.cos(ang); front = cs < 0; ctx.scale(Math.max(0.12, Math.abs(cs)), 1); }
      if (anim === 'flip' || anim === 'rodeo') { ctx.translate(0, -1.0 * s); ctx.rotate(d.sign * p * TAU); ctx.translate(0, 1.0 * s); }
      if (anim === 'grab') { grab = true; ctx.translate(0, 0.25 * s); ctx.scale(1, 0.85); }
      if (anim === 'method') { method = true; ctx.rotate(-0.55 * Math.sin(p * Math.PI)); ctx.translate(0, 0.15 * s); ctx.scale(1, 0.92); }
    }
    if (r.state === 'fall') { if(r.fx?.slip>0)ctx.rotate(Math.sin(r.fx.slip*18)*.3); front = true; ctx.rotate(Math.PI / 2 * 0.9); ctx.translate(0.3 * s, 0.6 * s); ctx.scale(0.9, 0.9); if (r.flat > 0) { ctx.rotate(-Math.PI / 2 * 0.9); ctx.translate(-0.3 * s, -0.6 * s); ctx.scale(1.5, 0.35); } }
    else if (r.state === 'air' || r.state === 'drop') ctx.rotate(-steer * 0.15 + (r.vy > 0 ? -0.08 : 0.08));
    else if (r.state === 'ride') ctx.rotate(steer * 0.2);
    if (r.fx && r.fx.snowman > 0) { circ(ctx, 0, -0.55 * s, 0.6 * s, '#fafafa'); circ(ctx, 0, -1.35 * s, 0.45 * s, '#fff'); if (front) { circ(ctx, -0.15 * s, -1.45 * s, 0.05 * s, '#000'); circ(ctx, 0.15 * s, -1.45 * s, 0.05 * s, '#000'); drawCarrot(ctx, 0.12 * s, -1.33 * s, s); } rect(ctx, -0.3 * s, -1.85 * s, 0.6 * s, 0.4 * s, '#212121'); ctx.restore(); return; }
    if(r.state==='ride'){
      const brake=r.brake||0;
      // Appui sur la carre au freinage, position ramassée en accélération.
      const straight=SK.Sprites&&!r.def.hidden&&!front&&!r.curTrick;
      ctx.transform(1,0,(straight?0:.16*crouch)-.20*brake,1-(straight?0:.16*crouch)-.06*brake,0,0);
      ctx.rotate(-.12*brake);
    }
    if (!SK.Sprites || !SK.Sprites.draw(ctx, r, L, s, front, steer)) {
      if (front) drawFrontBody(ctx, r, L, s, t, false, steer, crouch, grab, method); else drawBackBody(ctx, r, L, s, t, steer, crouch, grab, method);
    }
    ctx.restore();
    // ---- effets autour
    ctx.save(); ctx.translate(x, y - h * s);
    if(r.fx?.pushHit>0){const fade=r.fx.pushHit/.65,dir=r.pushHitDirection||1;ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle='#fff3a0';ctx.lineWidth=Math.max(2,s*.05);ctx.lineCap='round';for(let i=0;i<3;i++){const yy=-s*(.8+i*.35);ctx.beginPath();ctx.moveTo(-dir*s*.75,yy);ctx.lineTo(-dir*s*(1.15+(1-fade)*.5),yy+s*.12);ctx.stroke();}ctx.restore();}
    const burstAge=r.boxBurst&&r.race?r.race.time-r.boxBurst.at:2;
    if(burstAge>=0&&burstAge<.7){
      ctx.save();ctx.globalAlpha=1-burstAge/.7;
      for(let i=0;i<28;i++){const a=i*2.39996,d=(.3+burstAge*(2+i%4))*s;
        ctx.save();ctx.translate(Math.cos(a)*d,-s*.8+Math.sin(a)*d-burstAge*s*1.2+burstAge*burstAge*s*2);
        ctx.rotate(a+burstAge*(i%2?12:-12));ctx.fillStyle=i%4===0?'#fff':r.boxBurst.kind==='red'?'#ff554d':'#45baff';
        const k=s*(.06+i%3*.035);ctx.fillRect(-k,-k,k*2,k*1.4);ctx.restore();
      }ctx.restore();
    }
    if(r.state==='ride'&&(r.brake||0)>.01&&(r.speed||0)>1){
      const intensity=(r.brake||0)*Math.min(1,r.speed/18);
      for(let i=0;i<64;i++){
        const age=(t*2.2+i*.6180339)%1,angle=i*2.39996;
        const spread=(.35+age*3.2)*s,px=Math.cos(angle)*spread;
        const py=Math.sin(angle)*spread*.36-age*(1-age)*s*4.8;
        ctx.globalAlpha=intensity*Math.pow(1-age,.65);
        const radius=Math.max(1.2,(.065+(i%4)*.038)*s);
        circ(ctx,px,py,radius,'#ffffff');ctx.strokeStyle='#83bddc';ctx.lineWidth=Math.max(.7,s*.018);ctx.stroke();
      }ctx.globalAlpha=1;
    }
    if (r.state === 'frozen') { ctx.fillStyle = 'rgba(128,222,234,0.6)'; rr(ctx, -1.0 * s, -2.4 * s, 2.0 * s, 2.5 * s, 0.2 * s); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, 0.05 * s); ctx.stroke(); }
    if (r.state === 'fall') { for (let k = 0; k < 3; k++) { const a = t * 5 + k * TAU / 3; circ(ctx, Math.cos(a) * 0.6 * s, -1.2 * s + Math.sin(a) * 0.25 * s, 0.1 * s, '#ffeb3b'); } }
    if (r.fx && r.fx.parachute > 0) { ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(0, -3.8 * s, 1.5 * s, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ffab91'; ctx.beginPath(); ctx.arc(0, -3.8 * s, 0.5 * s, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1.5 * s, -3.8 * s); ctx.lineTo(0, -1.6 * s); ctx.lineTo(1.5 * s, -3.8 * s); ctx.stroke(); }
    if (r.fx && r.fx.slow > 0) { circ(ctx, -0.5 * s, -3.2 * s, 0.5 * s, '#90a4ae'); circ(ctx, 0.3 * s, -3.4 * s, 0.6 * s, '#90a4ae'); circ(ctx, 0.9 * s, -3.1 * s, 0.4 * s, '#90a4ae'); ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = Math.max(1, 0.05 * s); for (let k = 0; k < 5; k++) { const yy = ((t * 6 + k * 0.37) % 1); ctx.beginPath(); ctx.moveTo((-0.8 + k * 0.4) * s, (-2.8 + yy * 1.8) * s); ctx.lineTo((-0.8 + k * 0.4) * s, (-2.6 + yy * 1.8) * s); ctx.stroke(); } }

    if (!isMe && r.ctrl === 'human') { ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(9, 0.35 * s) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('J' + (r.player + 1), 0, -2.6 * s); }
    ctx.restore();
  };
  R.drawWalker = function(ctx,r,x,y,s,t,direction,moving) {
    s *= SK.characterScale(r.def.id);
    ctx.fillStyle='rgba(40,65,80,0.18)';ctx.beginPath();ctx.ellipse(x,y+2,s*.42,s*.13,0,0,TAU);ctx.fill();
    if(SK.Sprites) SK.Sprites.walk(ctx,r,lookOf(r),x,y,s,t,direction,moving);
  };
  // Silhouette tracée dans les coordonnées de la référence (538 × 716).
  // Canvas : l'ordre des couches tient lieu de z-index. Les tracés sont mis en cache.
  const riderPaths = new Map();
  function riderShape(ctx, d, color) {
    let path = riderPaths.get(d);
    if (!path) { path = new Path2D(d); riderPaths.set(d, path); }
    ctx.fillStyle = color; ctx.fill(path);
  }
  function drawBackBody(ctx, r, L, s, t, steer, crouch, grab, method) {
    ctx.save(); ctx.scale(s / 220, s / 220); ctx.translate(-240, -560);
    // 1. Semelle et dessus de la planche : arrière en haut à gauche, avant en bas à droite.
    SK.drawBoard(ctx,r.board,248,518,103,300,-.75,r.input?.steer||0);
    // 2. Jambe et botte éloignées, puis jambe et botte proches : les genoux se chevauchent.
    riderShape(ctx, 'M 153 323 C 143 345 166 365 208 398 L 179 454 Q 170 477 191 490 L 222 480 L 266 415 Q 280 393 258 373 L 213 333 Z', shade(L.pants, 0.8));
    riderShape(ctx, 'M 183 434 Q 201 431 205 451 L 200 480 L 228 470 Q 252 456 261 478 Q 267 492 243 496 L 189 500 Q 166 502 167 484 L 176 450 Q 176 436 183 434 Z', '#263b40');
    riderShape(ctx, 'M 203 341 Q 195 363 221 386 L 280 435 L 239 512 Q 233 534 254 545 Q 277 551 286 530 L 340 440 Q 352 419 333 402 L 281 353 Z', L.pants);
    riderShape(ctx, 'M 240 500 Q 263 498 265 520 L 261 542 L 286 532 Q 311 518 321 537 Q 331 554 315 559 L 253 568 Q 224 571 226 551 L 235 512 Z', '#263b40');
    // 3. Le haut du corps s'abaisse à l'accélération sans décoller les bottes.
    ctx.save(); ctx.translate(-crouch * 10, crouch * 27);
    const air = r.state === 'air' || r.state === 'drop' || !!r.curTrick;
    const arm = (right, angle) => {
      ctx.save();
      if(r.fx?.pushPose>0&&(right?1:-1)===(r.pushDirection||1)){const reach=Math.sin(Math.PI*SK.clamp(1-r.fx.pushPose/.55,0,1));ctx.translate((right?1:-1)*35*reach,-20*reach);angle+=(right?-.2:.5)*reach;}
      ctx.translate(right ? 295 : 170, right ? 250 : 225); ctx.rotate(angle); ctx.translate(right ? -295 : -170, right ? -250 : -225);
      if (right) {
        circ(ctx, 295, 253, 18, L.jacket);
        riderShape(ctx, 'M 291 232 Q 305 232 320 244 L 359 263 L 430 258 L 438 294 L 350 302 Q 341 303 327 294 L 282 268 Z', L.jacket);
        riderShape(ctx, 'M 420 259 L 429 248 Q 438 240 443 251 L 442 256 Q 465 252 469 271 Q 476 295 449 296 L 433 296 Q 407 291 416 268 Z', L.skin);
      } else {
        riderShape(ctx, 'M 179 205 L 105 229 L 52 283 L 77 308 L 124 256 L 179 241 Z', shade(L.jacket, 0.86));
        riderShape(ctx, 'M 52 281 Q 70 282 78 296 Q 84 312 78 326 Q 75 334 66 325 Q 53 342 38 330 Q 19 317 34 296 Z', L.skin);
      }
      ctx.restore();
    };
    arm(false, grab ? -0.8 : method ? -1.0 : air ? 0.65 : steer * 0.12);
    // 4. Cou, tête, cheveux, oreille puis casquette. Le col recouvre le bas de la tête.
    riderShape(ctx, 'M 228 190 L 274 191 L 277 229 L 222 222 Z', L.skin);
    riderShape(ctx, 'M 180 140 C 178 98 220 79 264 95 C 304 105 321 137 313 171 C 309 197 290 219 266 223 L 211 208 Q 181 193 180 140 Z', L.skin);
    if (L.hair !== 'bald') {
      riderShape(ctx, 'M 179 145 C 177 103 205 86 248 91 Q 296 93 310 134 L 304 159 Q 291 148 286 165 L 287 182 Q 267 214 227 210 L 205 207 Q 182 188 179 145 Z', L.hairColor);
      if (L.hair === 'long' || L.hair === 'ponytail' || L.hair === 'pigtails') {
        riderShape(ctx, L.hair === 'long' ? 'M 182 147 L 194 262 Q 247 281 285 243 L 286 174 Z' : 'M 193 145 Q 160 148 166 186 Q 177 222 155 259 Q 204 255 203 214 L 210 162 Z', L.hairColor);
        if (L.hair === 'pigtails') riderShape(ctx, 'M 292 149 Q 324 156 317 184 L 333 238 Q 294 226 291 195 Z', L.hairColor);
      }
      if (L.hair === 'curly') for (let i = 0; i < 9; i++) circ(ctx, 191 + i * 13, 132 - Math.sin(i / 8 * Math.PI) * 39, 16, L.hairColor);
      if (L.hair === 'spiky') for (let i = 0; i < 6; i++) tri(ctx, 193 + i * 20, 119 - Math.sin(i / 5 * Math.PI) * 22, 28, 29, L.hairColor);
      if (L.hair === 'dreads') for (let i = 0; i < 6; i++) line(ctx, [[190 + i * 18, 140], [194 + i * 17, 215]], 15, L.hairColor);
    }
    riderShape(ctx, 'M 297 154 Q 281 150 280 165 Q 278 179 291 184 L 300 179 Z', L.skin);
    if (r.def.earbuds) { line(ctx, [[293, 165], [294, 180]], 4, '#f5f5f5'); }
    if (L.hat === 'cap' && r.def.id !== 'shinobin') {
      riderShape(ctx, 'M 179 153 C 172 111 194 75 231 71 C 270 65 299 81 309 113 Q 338 111 336 123 Q 331 134 301 139 Q 236 162 179 153 Z', L.hatColor);
      riderShape(ctx, 'M 189 145 Q 189 127 207 127 Q 226 126 231 145 Z', L.hairColor);
    } else drawHat(ctx, L, 244 / 185, 151 / 185, 185, false, r.def.id, t);
    // 5. Torse incliné, empiècement et numéro ; le bras proche vient en dernier.
    riderShape(ctx, 'M 176 205 L 286 230 Q 312 237 309 261 L 289 344 Q 286 367 264 362 L 163 340 Q 134 334 140 306 L 153 245 Z', L.jacket);
    riderShape(ctx, 'M 176 205 L 286 230 Q 302 235 305 250 L 295 272 L 152 243 L 154 216 Z', shade(L.jacket, 0.88));
    ctx.save(); ctx.translate(213, 291); ctx.rotate(0.18); ctx.fillStyle = '#f9ece2'; ctx.font = 'italic 900 60px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(r.idx != null ? r.idx + 1 : 1), 0, 16); ctx.restore();
    arm(true, grab || method ? -0.65 : air ? -0.55 : steer * 0.12);
    ctx.restore(); ctx.restore();
  }
  // Vue de face pendant les vrilles et les chutes
  function drawFrontBody(ctx, r, L, s, t, side, steer, crouch, grab, method) {
    const air = r.state === 'air' || r.state === 'drop' || !!r.curTrick;
    SK.drawBoard(ctx,r.board,0,0,s*.42,s*1.95,Math.PI/2+(side?steer*.15:.5),r.input?.steer||0);
    const ff = side ? { x: -0.33, y: -0.1 } : { x: -0.3, y: 0.1 }, bf = side ? { x: 0.33, y: -0.1 } : { x: 0.3, y: -0.12 };
    const hipY = -0.95 + 0.14 * crouch, th = 0.62 * (1 - 0.15 * crouch), shY = hipY - th, headY = shY - 0.36;
    line(ctx, [[-0.14 * s, hipY * s], [(ff.x - 0.12 - 0.12 * crouch) * s, ((hipY + ff.y) / 2) * s], [ff.x * s, (ff.y - 0.1) * s]], 0.3 * s, L.pants);
    line(ctx, [[0.14 * s, hipY * s], [(bf.x + 0.12 + 0.12 * crouch) * s, ((hipY + bf.y) / 2) * s], [bf.x * s, (bf.y - 0.1) * s]], 0.3 * s, L.pants);
    for (const f of [ff, bf]) { ctx.fillStyle = '#263238'; rr(ctx, (f.x - 0.24) * s, (f.y - 0.2) * s, 0.48 * s, 0.24 * s, 0.08 * s); ctx.fill(); }
    ctx.fillStyle = L.jacket; rr(ctx, -0.42 * s, shY * s, 0.84 * s, (th + 0.1) * s, 0.2 * s); ctx.fill();
    ctx.fillStyle = shade(L.jacket, 0.8); ctx.fillRect(-0.05 * s, (shY + 0.1) * s, 0.1 * s, (th - 0.1) * s); // fermeture éclair
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-0.22 * s, shY * s); ctx.lineTo(0, (shY + 0.22) * s); ctx.lineTo(0.22 * s, shY * s); ctx.closePath(); ctx.fill(); // col
    let lh = { x: -0.95, y: shY + 0.3 }, rh = { x: 0.95, y: shY + 0.3 };
    if (air) { lh = { x: -0.85, y: shY - 0.55 }; rh = { x: 0.85, y: shY - 0.55 }; }
    if (grab) { lh = { x: -0.4, y: -0.05 }; rh = { x: 0.8, y: shY - 0.5 }; }
    if (method) { lh = { x: 0.4, y: 0.05 }; rh = { x: -0.9, y: shY - 0.2 }; }
    if (r.state === 'ride' && !r.curTrick) { lh.y += 0.15 * crouch; rh.y += 0.15 * crouch; }
    line(ctx, [[-0.4 * s, (shY + 0.14) * s], [-0.72 * s, (shY + 0.26) * s], [lh.x * s, lh.y * s]], 0.22 * s, L.jacket);
    line(ctx, [[0.4 * s, (shY + 0.14) * s], [0.72 * s, (shY + 0.26) * s], [rh.x * s, rh.y * s]], 0.22 * s, L.jacket);
    circ(ctx, lh.x * s, lh.y * s, 0.13 * s, L.skin); circ(ctx, rh.x * s, rh.y * s, 0.13 * s, L.skin);
    rect(ctx, -0.1 * s, (shY - 0.12) * s, 0.2 * s, 0.16 * s, L.skin);
    circ(ctx, 0, headY * s, 0.36 * s, L.skin);
    drawHair(ctx, L, 0, headY, s, true, r.def.id);
    // visage
    const glasses = !!r.def.glasses;
    if (glasses) { ctx.strokeStyle = '#263238'; ctx.lineWidth = 0.04 * s; ctx.beginPath(); ctx.arc(-0.13 * s, (headY + 0.02) * s, 0.1 * s, 0, TAU); ctx.moveTo(0.23 * s, (headY + 0.02) * s); ctx.arc(0.13 * s, (headY + 0.02) * s, 0.1 * s, 0, TAU); ctx.stroke(); }
    circ(ctx, -0.13 * s, (headY + 0.02) * s, 0.045 * s, '#263238'); circ(ctx, 0.13 * s, (headY + 0.02) * s, 0.045 * s, '#263238');
    circ(ctx, -0.24 * s, (headY + 0.12) * s, 0.06 * s, 'rgba(255,120,120,0.35)'); circ(ctx, 0.24 * s, (headY + 0.12) * s, 0.06 * s, 'rgba(255,120,120,0.35)');
    ctx.strokeStyle = '#8d4a3a'; ctx.lineWidth = 0.04 * s; ctx.beginPath();
    if (r.state === 'fall') ctx.arc(0, (headY + 0.16) * s, 0.08 * s, 0, TAU); else ctx.arc(0, (headY + 0.1) * s, 0.12 * s, 0.25, Math.PI - 0.25); ctx.stroke();
    drawFamilyFeatures(ctx, r.def, 0, headY, s);
    drawHat(ctx, L, 0, headY, s, true, r.def.id, t);
  }
  function drawFamilyFeatures(ctx, def, hx, hy, s) {
    if (def.freckles) for (const side of [-1, 1]) for (let k = 0; k < 3; k++) circ(ctx, (hx + side * (0.17 + k * 0.035)) * s, (hy + 0.1 + (k % 2) * 0.035) * s, 0.012 * s, '#a56c43');
    if (def.pacifier) { ctx.fillStyle = '#80cbc4'; ctx.beginPath(); ctx.ellipse(hx * s, (hy + 0.19) * s, 0.13 * s, 0.08 * s, 0, 0, TAU); ctx.fill(); circ(ctx, hx * s, (hy + 0.21) * s, 0.055 * s, '#fff3d1'); }
    if (def.earbuds) for (const side of [-1, 1]) line(ctx, [[(hx + side * 0.3) * s, (hy + 0.03) * s], [(hx + side * 0.3) * s, (hy + 0.15) * s]], 0.035 * s, '#f5f5f5');
  }
  function drawHair(ctx, L, hx, hy, s, front, id) {
    const col = L.hairColor; ctx.fillStyle = col;
    if (L.hair === 'bald') return;
    if (front) { ctx.beginPath(); ctx.arc(hx * s, (hy - 0.04) * s, 0.37 * s, Math.PI, 0); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(hx * s, hy * s, 0.37 * s, Math.PI * 0.85, Math.PI * 2.15); ctx.fill(); rect(ctx, (hx - 0.3) * s, hy * s, 0.6 * s, 0.22 * s, col); }
    if (L.hair === 'ponytail') { line(ctx, [[(hx - 0.31) * s, (hy - 0.16) * s], [(hx - 0.44) * s, (hy + 0.16) * s], [(hx - 0.37) * s, (hy + 0.48) * s]], 0.19 * s, col); }
    if (L.hair === 'curly') for (let i = 0; i < 7; i++) circ(ctx, (hx - 0.3 + i * 0.1) * s, (hy - 0.16 - Math.sin(i / 6 * Math.PI) * 0.17) * s, 0.11 * s, col);
    if (L.hair === 'fringe') { ctx.beginPath(); ctx.moveTo((hx - 0.35) * s, (hy - 0.19) * s); ctx.lineTo((hx + 0.28) * s, (hy - 0.2) * s); ctx.lineTo((hx + 0.12) * s, (hy + 0.04) * s); ctx.lineTo(hx * s, (hy - 0.04) * s); ctx.lineTo((hx - 0.13) * s, (hy + 0.02) * s); ctx.fill(); }
    if (L.hair === 'long') { rect(ctx, (hx - 0.38) * s, (hy - 0.05) * s, 0.16 * s, 0.5 * s, col); rect(ctx, (hx + 0.22) * s, (hy - 0.05) * s, 0.16 * s, 0.5 * s, col); if (!front) rect(ctx, (hx - 0.3) * s, hy * s, 0.6 * s, 0.5 * s, col); }
    if (L.hair === 'pigtails') { rect(ctx, (hx - 0.6) * s, (hy - 0.18) * s, 0.2 * s, 0.45 * s, col); rect(ctx, (hx + 0.4) * s, (hy - 0.18) * s, 0.2 * s, 0.45 * s, col); }
    if (L.hair === 'dreads') for (let k = -2; k <= 2; k++) rect(ctx, (hx + k * 0.13 - 0.04) * s, (hy - 0.5) * s, 0.09 * s, 0.3 * s, col);
    if (L.hair === 'spiky') for (let k = -2; k <= 2; k++) tri(ctx, (hx + k * 0.14) * s, (hy - 0.3) * s, 0.14 * s, 0.3 * s, col);
  }
  function drawHat(ctx, L, hx, hy, s, front, id, t) {
    const col = L.hatColor;
    if(id==='shadowking'||id==='matthieuboss') {if(id==='matthieuboss'&&front)SK.Throne.drawFace(ctx,hx*s,hy*s,.38*s);else circ(ctx,hx*s,hy*s,.38*s,'#372d2c');ctx.fillStyle='#9a7b39';ctx.beginPath();for(const [i,p] of [[-.37,-.26],[-.43,-.65],[-.19,-.47],[0,-.73],[.19,-.47],[.43,-.65],[.37,-.26]].entries()){if(i===0)ctx.moveTo((hx+p[0])*s,(hy+p[1])*s);else ctx.lineTo((hx+p[0])*s,(hy+p[1])*s);}ctx.closePath();ctx.fill();return;}

    if (id === 'shinobin') { ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(hx * s, hy * s, 0.37 * s, 0, TAU); ctx.fill(); if (front) { rect(ctx, (hx - 0.32) * s, (hy - 0.06) * s, 0.64 * s, 0.16 * s, L.skin); circ(ctx, (hx - 0.13) * s, (hy + 0.02) * s, 0.045 * s, '#263238'); circ(ctx, (hx + 0.13) * s, (hy + 0.02) * s, 0.045 * s, '#263238'); } rect(ctx, (hx - 0.37) * s, (hy - 0.14) * s, 0.74 * s, 0.07 * s, L.scarf || '#d32f2f'); ctx.strokeStyle = L.scarf || '#d32f2f'; ctx.lineWidth = 0.08 * s; ctx.beginPath(); ctx.moveTo((hx + 0.3) * s, (hy - 0.05) * s); ctx.lineTo((hx + 0.85) * s + Math.sin(t * 12) * 0.1 * s, (hy + 0.2) * s); ctx.stroke(); return; }
    if (L.hat === 'none') return;
    if (L.hat === 'cap') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx * s, (hy - 0.08) * s, 0.36 * s, Math.PI, 0); ctx.fill(); rect(ctx, (hx - 0.36) * s, (hy - 0.12) * s, 0.72 * s, 0.1 * s, col);
      ctx.fillStyle = shade(col, 0.85); if (front) { if (id === 'jam') rect(ctx, (hx - 0.6) * s, (hy - 0.12) * s, 0.4 * s, 0.09 * s, shade(col, 0.85)); else { ctx.beginPath(); ctx.ellipse((hx + 0.05) * s, (hy - 0.06) * s, 0.42 * s, 0.1 * s, 0, 0, Math.PI); ctx.fill(); } }
      else { ctx.beginPath(); ctx.ellipse((hx + (id === 'jam' ? -0.3 : 0.45)) * s, (hy - 0.1) * s, 0.3 * s, 0.09 * s, 0.1, 0, TAU); ctx.fill(); } }
    else if (L.hat === 'beanie') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx * s, (hy - 0.06) * s, 0.37 * s, Math.PI, 0); ctx.fill(); rect(ctx, (hx - 0.38) * s, (hy - 0.12) * s, 0.76 * s, 0.14 * s, shade(col, 0.85)); circ(ctx, hx * s, (hy - 0.46) * s, 0.1 * s, '#fff'); }
    else if (L.hat === 'band') { rect(ctx, (hx - 0.37) * s, (hy - 0.22) * s, 0.74 * s, 0.12 * s, col); }
  }
  // Visage seul (barre de progression, étiquettes)
  R.drawFace = function (ctx, r, x, y, rad) {
    const L = lookOf(r), s = rad / 0.36;
    if (SK.Sprites && SK.Sprites.face(ctx,r,L,x,y,rad)) return;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.clip(); ctx.fillStyle = L.skin; ctx.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
    ctx.translate(x, y); ctx.scale(0.85, 0.85);
    drawHair(ctx, L, 0, 0.02, s, true, r.def.id);
    circ(ctx, -0.13 * s, 0.04 * s, 0.05 * s, '#263238'); circ(ctx, 0.13 * s, 0.04 * s, 0.05 * s, '#263238');
    ctx.strokeStyle = '#8d4a3a'; ctx.lineWidth = 0.05 * s; ctx.beginPath(); ctx.arc(0, 0.12 * s, 0.12 * s, 0.25, Math.PI - 0.25); ctx.stroke();
    drawFamilyFeatures(ctx, r.def, 0, 0.02, s);
    drawHat(ctx, L, 0, 0.02, s, true, r.def.id, 0);
    ctx.restore();
  };

  R.drawChair=function(ctx,r,x,y,s,t){
    ctx.save();ctx.translate(x,y);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#334a58';ctx.lineWidth=Math.max(2,s*.10);
    ctx.beginPath();ctx.moveTo(0,-s*3.2);ctx.lineTo(0,-s*2.1);ctx.lineTo(-s*1.0,-s*1.5);ctx.lineTo(-s*1.0,s*.05);ctx.stroke();
    ctx.fillStyle='#812e3b';rr(ctx,-s*1.05,-s*1.1,s*2.1,s*.94,s*.17);ctx.fill();
    ctx.fillStyle='#be4c56';rr(ctx,-s*.93,-s*.98,s*1.86,s*.65,s*.12);ctx.fill();
    ctx.fillStyle='#da6870';rr(ctx,-s*1.10,-s*.13,s*2.2,s*.26,s*.08);ctx.fill();
    if(SK.Sprites&&!r.def.hidden)SK.Sprites.seated(ctx,r,lookOf(r),s);
    else {ctx.save();ctx.translate(0,-s*.5);drawFrontBody(ctx,r,lookOf(r),s,t,false,0,1,false,false);ctx.restore();}
    ctx.strokeStyle='#253c48';ctx.lineWidth=s*.095;ctx.beginPath();ctx.moveTo(-s*1.03,-s*.7);ctx.lineTo(-s*.92,s*.28);ctx.lineTo(s*.92,s*.28);ctx.lineTo(s*1.03,-s*.7);ctx.stroke();
    ctx.strokeStyle='#a9c5d1';ctx.lineWidth=s*.035;ctx.beginPath();ctx.moveTo(-s*.86,s*.245);ctx.lineTo(s*.86,s*.245);ctx.stroke();
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
      R.drawChair(ctx,o,cx0+sw,cy0+95,30,t);
    }
    const panelW=Math.min(vw*.74,430),panelH=76,px=vx+(vw-panelW)/2,py=vy+vh-panelH-94;
    ctx.fillStyle='#102b46e8';rr(ctx,px,py,panelW,panelH,16);ctx.fill();
    ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold '+Math.min(20,vw*.032)+'px sans-serif';
    ctx.fillText(waiting?'Départ dans '+Math.max(0,me.lift.board-race.time).toFixed(1)+' s':'Vers le sommet · '+Math.round(prog*100)+' %',vx+vw/2,py+26);
    ctx.fillStyle='#c9e7f7';ctx.font=Math.min(15,vw*.026)+'px sans-serif';ctx.fillText('Tour '+me.lift.lapDone+' terminé · '+SK.ordinal(me.rank+1)+' place',vx+vw/2,py+48);
    ctx.fillStyle='#35516b';rr(ctx,px+18,py+60,panelW-36,5,2);ctx.fill();ctx.fillStyle='#65d8f4';rr(ctx,px+18,py+60,Math.max(4,(panelW-36)*prog),5,2);ctx.fill();
  };

  // ------------------------------------------------------------------ HUD
  R.finishMessage=rank=>rank===0?{title:'VICTOIRE !!!',subtitle:'1re place !',color:'#ffd43b'}:rank===1?{title:'SUPER, 2e !',subtitle:'Une superbe deuxième place !',color:'#d5edff'}:rank===2?{title:'BRAVO, 3e !',subtitle:'Une place sur le podium !',color:'#ffb475'}:{title:'COURSE TERMINÉE !',subtitle:(rank+1)+'e place · Bien joué !',color:'#87e9ff'};
  R.drawFinishBanner=function(ctx,r,x,y,w,t){
    const msg=R.finishMessage(r.rank),size=Math.min(66,w*.09),pulse=1+Math.sin(t*3)*.018;
    ctx.save();ctx.translate(x,y);ctx.scale(pulse,pulse);ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
    ctx.font=size+'px "Titan One","Arial Black",sans-serif';
    const fit=Math.min(1,(w*.92)/Math.max(1,ctx.measureText(msg.title).width));ctx.scale(fit,fit);
    ctx.strokeStyle='#442958';ctx.lineWidth=11;ctx.strokeText(msg.title,0,6);ctx.strokeStyle='#fff';ctx.lineWidth=7;ctx.strokeText(msg.title,0,0);ctx.fillStyle=msg.color;ctx.fillText(msg.title,0,0);
    ctx.font='bold '+Math.max(16,size*.36)+'px "Trebuchet MS",sans-serif';ctx.lineWidth=5;ctx.strokeStyle='#17354e';ctx.strokeText(msg.subtitle,0,size*.95);ctx.fillStyle='#fff';ctx.fillText(msg.subtitle,0,size*.95);
    if(r.rank<3){for(let i=0;i<8;i++){const a=i*TAU/8+t*.25,dx=Math.cos(a)*w*.43,dy=Math.sin(a)*size*.75;ctx.fillStyle=['#ffd43b','#ff7bb7','#68e3ff'][i%3];ctx.save();ctx.translate(dx,dy);ctx.rotate(a);ctx.fillRect(-3,-5,6,10);ctx.restore();}}
    ctx.restore();
  };
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
    if(me.levelInfo?.points>0){
      box(vx+12,vy+96*F,190*F,48*F);ctx.textAlign='left';ctx.fillStyle='#ffe380';ctx.font='bold '+18*F+'px sans-serif';
      ctx.fillText('⭐ ↑ Niveau '+me.levelInfo.level,vx+22,vy+116*F);
      ctx.font='bold '+14*F+'px sans-serif';ctx.fillText(me.levelInfo.points+' points au gym',vx+22,vy+135*F);
    }
    // temps et pièces
    box(vx + vw - 12 - 180 * F, vy + 12, 180 * F, 74 * F);
    ctx.textAlign = 'right'; ctx.font = 'bold ' + 24 * F + 'px monospace'; ctx.fillStyle = '#fff';
    ctx.fillText(SK.fmtTime(Math.max(0, me.state === 'done' ? me.finishTime : race.time)), vx + vw - 24, vy + 42 * F);
    ctx.font = '900 ' + 22 * F + 'px "Arial Black", Arial, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(SK.fmtGold(me.coins,false), vx + vw - 24, vy + 74 * F);
    SK.drawGoldCoin(ctx, vx + vw - 24 - ctx.measureText(SK.fmtGold(me.coins,false)).width - 20 * F, vy + 66 * F, 12 * F);
    ctx.save();ctx.textAlign='right';ctx.font='bold '+14*F+'px Arial';ctx.fillStyle='#ffe59b';
    ctx.fillText('Récolte '+me.coinsTotal+' / '+(me.coinCapacity||20)+' · Pointe +'+SK.coinSpeedBonus(me)+' km/h',vx+vw-24,vy+98*F);
    ctx.fillText('Turbo '+Math.round((me.turboCharge||0)*100)+' %',vx+vw-24,vy+118*F);
    if(me.gear.boussole){const future=race.track.segs.slice(Math.floor(me.z/SK.SEG)+4,Math.floor(me.z/SK.SEG)+45).find(s=>Math.abs(s.curve)>.4);ctx.textAlign='center';ctx.fillText(future?(future.curve>0?'Virage →':'← Virage')+' · '+Math.round(future.z-me.z)+' m':'↑ Tout droit',vx+vw*.5,vy+105*F);}
    if(me.gear.meteore&&me.meteorUntil>race.time){ctx.strokeStyle='#ffdc6390';ctx.lineWidth=7*F;ctx.beginPath();ctx.ellipse(vx+vw*.5,vy+vh*.77,vw*.15,vh*.05,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
    ctx.save();ctx.font='bold '+18*F+'px Arial';ctx.textAlign='left';ctx.fillStyle='#fff';ctx.fillText('N · Pousser '+(me.pushCooldown>0?Math.ceil(me.pushCooldown)+' s':'✊'),vx+20,vy+vh-95*F);ctx.restore();
    // tir et objet
    const slot = (x, y, kind, id, label, key) => {
      const def = id ? SK.powerPresentation(me,kind,id) : null;
      ctx.fillStyle = 'rgba(0,0,0,0.42)'; rr(ctx, x, y, 150 * F, 62 * F, 10); ctx.fill();
      ctx.strokeStyle = kind === 'shot' ? '#e53935' : '#1e88e5'; ctx.lineWidth = 3; ctx.beginPath(); rr(ctx, x + 6, y + 6, 50 * F, 50 * F, 8); ctx.stroke();
      ctx.textAlign = 'center'; ctx.font = 22 * F + 'px sans-serif'; ctx.fillStyle = '#fff'; if (def) ctx.fillText(def.icon, x + 6 + 25 * F, y + 6 + 40 * F);
      ctx.textAlign = 'left'; ctx.font = 'bold ' + 13 * F + 'px sans-serif'; ctx.fillStyle = kind === 'shot' ? '#ef9a9a' : '#90caf9'; ctx.fillText(label + (key ? ' (' + key + ')' : ''), x + 64 * F, y + 22 * F);
      ctx.fillStyle = '#fff'; ctx.font = 'bold ' + 14 * F + 'px sans-serif'; ctx.fillText(def ? def.name : '—', x + 64 * F, y + 44 * F, 82 * F);
    };
    const keys = me.player === 1 ? ['J', 'K'] : ['V', 'B'];
    slot(vx + 12, vy + vh - 12 - 62 * F, 'shot', me.shot, 'Tir', keys[0]);
    slot(vx + 12 + 158 * F, vy + vh - 12 - 62 * F, 'item', me.item, 'Objet', keys[1]);
    // vitesse
    box(vx + vw - 12 - 170 * F, vy + vh - 12 - 62 * F, 170 * F, 62 * F);
    const kmh = Math.round(me.speed * 3.6), pct = SK.clamp(me.speed / (SK.raceTopSpeed(me) * 1.45), 0, 1);
    ctx.fillStyle = '#263238'; rr(ctx, vx + vw - 12 - 160 * F, vy + vh - 12 - 26 * F, 150 * F, 12 * F, 6); ctx.fill();
    ctx.fillStyle = (me.fx.fan > 0 || me.fx.comboBoost > 0) ? '#69f0ae' : pct > 0.8 ? '#ffd600' : '#4fc3f7'; rr(ctx, vx + vw - 12 - 160 * F, vy + vh - 12 - 26 * F, 150 * F * pct, 12 * F, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.font = 'bold ' + 20 * F + 'px monospace'; ctx.fillText(kmh + ' km/h', vx + vw - 24, vy + vh - 12 - 36 * F);
    const surf = SK.SURFACES[race.track.segAt(me.z).surface]; ctx.textAlign = 'left'; ctx.font = 12 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(surf ? surf.name : '', vx + vw - 12 - 160 * F, vy + vh - 12 - 36 * F);
    // barre de progression à droite : UN tour de piste (départ en haut, remontée en bas) ; pendant la remontée on remonte
    const bx = vx + vw - 40, by0 = vy + 110 * F, by1 = vy + vh - 100 * F;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx, by0); ctx.lineTo(bx, by1); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(bx - 12, by0 - 2, 24, 4); ctx.fillRect(bx - 12, by1 - 2, 24, 4);
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DÉPART', bx, by0 - 8); ctx.fillText('REMONTÉE', bx, by1 + 16);
    race.racers.slice().sort((a, b) => b.rank - a.rank).forEach(o => {
      let p;
      if (o.state === 'done') p = 1; else if (o.state === 'lift') p = race.time < o.lift.board ? 1 : 1 - SK.clamp((race.time - o.lift.board) / (o.lift.end - o.lift.board), 0, 1);
      else if (o.state === 'drop') p = 0; else p = SK.clamp(o.z / race.L, 0, 1);
      const yy = by0 + (by1 - by0) * p, rad = o === me ? 20 : 15;
      if (o.state === 'lift' && race.time >= o.lift.board) { ctx.strokeStyle = '#263238'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, yy - rad); ctx.lineTo(bx, yy - rad - 10); ctx.stroke(); }
      circ(ctx, bx, yy, rad + 3, o === me ? '#ffd600' : 'rgba(0,0,0,0.55)'); R.drawFace(ctx, o, bx, yy, rad);
      if (race.laps > 1) { ctx.fillStyle = o === me ? '#ffd600' : '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('T' + Math.min(race.laps, o.lap + 1), bx + rad + 5, yy + 4); }
    });
    // le rocher qu'on vient de lâcher : il part de la main et tombe derrière nous (vers la caméra)
    if (me.rockAnim != null && race.time - me.rockAnim < 0.7 && me.screen) { const q = (race.time - me.rockAnim) / 0.7, sc = me.screen.sc * (0.8 + 2.2 * q); const rx = me.screen.sx + 0.6 * me.screen.sc + (vx + vw * 0.5 - me.screen.sx) * q, ry = me.screen.sy - 1.5 * me.screen.sc - Math.sin(q * Math.PI) * 60 * F + (vy + vh + 40 - me.screen.sy) * q; R.drawProp(ctx, me.trapType||'rock', rx, ry, sc * 0.5, 0.5, t, {}); }
    // messages centraux
    ctx.textAlign = 'center';
    if (race.phase === 'count') { const n = Math.min(3, Math.ceil(-race.time)); ctx.font = 'bold ' + 120 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(n > 0 ? String(n) : 'GO !', vx + vw / 2 + 4, vy + vh / 2 + 4); ctx.fillStyle = n > 1 ? '#ffd600' : '#69f0ae'; ctx.fillText(n > 0 ? String(n) : 'GO !', vx + vw / 2, vy + vh / 2); }
    else if (race.time < 1) { ctx.font = 'bold ' + 120 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText('GO !', vx + vw / 2 + 4, vy + vh / 2 + 4); ctx.fillStyle = '#69f0ae'; ctx.fillText('GO !', vx + vw / 2, vy + vh / 2); }
    if (me.lap + 1 < race.laps && me.state === 'ride' && me.z > race.L - 160) { // où est le portail de la remontée ?
      const dir = race.gateX > me.x + 2 ? '→' : race.gateX < me.x - 2 ? '←' : '↑';
      ctx.font = 'bold ' + 22 * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(dir + ' Remontée ' + dir, vx + vw / 2 + 2, vy + vh * 0.34 + 2); ctx.fillStyle = '#ffd600'; ctx.fillText(dir + ' Remontée ' + dir, vx + vw / 2, vy + vh * 0.34);
    }
    if (race.mission) { // objectif de la pratique
      const m=race.mission,values={slalom:race.gatesPassed,coins:me.trackCoins,tricks:me.tricksCoins,pushes:me.stats.pushes,hits:me.stats.hits,edges:me.stats.edges,nofall:me.stats.falls};
      const score=m.type==='time'?SK.fmtTime(Math.max(0,race.time)):['nofall','edges'].includes(m.type)?values[m.type]+(m.type==='nofall'?' chute(s)':' contact(s)'):values[m.type]+' / '+m.goal;
      const label=m.type==='time'?'Objectif '+SK.fmtTime(m.goal):m.name;
      box(vx+vw/2-160*F,vy+12*F,320*F,(m.type==='slalom'?128:96)*F);
      ctx.textAlign='center';ctx.fillStyle='#fff3b9';ctx.font='bold '+16*F+'px sans-serif';ctx.fillText(label,vx+vw/2,vy+36*F,300*F);
      ctx.font=48*F+'px "Titan One", sans-serif';ctx.lineWidth=5*F;ctx.strokeStyle='#16344c';ctx.strokeText(score,vx+vw/2,vy+91*F,300*F);ctx.fillStyle='#ffdb45';ctx.fillText(score,vx+vw/2,vy+91*F,300*F);
      if(m.type==='slalom'){const elapsed=me.finishTime??Math.max(0,race.time),tier=['gold','silver','bronze'].find(k=>elapsed<=m.medalTimes[k]);ctx.font='bold '+17*F+'px sans-serif';ctx.fillStyle=tier?'#fff4c9':'#ff8a80';ctx.fillText(tier?SK.MEDALS[tier].icon+' Objectif '+SK.MEDALS[tier].name+' · '+SK.fmtTime(Math.max(0,m.medalTimes[tier]-elapsed))+' restantes':'Temps dépassé',vx+vw/2,vy+124*F,300*F);}


    }
    if (me.curTrick) { ctx.font = 'bold ' + 26 * F + 'px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(me.curTrick.def.name + '…', vx + vw / 2, vy + vh * 0.3); }
    if (me.hud) {
      me.hud = me.hud.filter(m => m.until > race.time);
      me.hud.forEach((m, i) => { const a = SK.clamp((m.until - race.time) / 0.4, 0, 1); ctx.globalAlpha = a; ctx.font = 'bold ' + (m.big ? 40 : 26) * F + 'px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(m.text, vx + vw / 2 + 2, vy + vh * 0.2 + i * 36 * F + 2); ctx.fillStyle = m.color || '#fff'; ctx.fillText(m.text, vx + vw / 2, vy + vh * 0.2 + i * 36 * F); ctx.globalAlpha = 1; });
    }
    // La consigne reste visible pendant la récupération, puis disparaît à 70 km/h.
    if(race.phase==='race' && me.recovering && (me.state==='fall'||me.state==='ride') && me.speed<70/3.6){
      ctx.save();
      const w=Math.min(vw*.9,460*F),x=vx+vw/2,y=vy+vh*.77;
      box(x-w/2,y,w,70*F);
      ctx.textAlign='center';ctx.font='bold '+26*F+'px sans-serif';ctx.fillStyle='#ffe16b';
      ctx.fillText('Tapote vite sur ↑',x,y+29*F,w-16*F);
      ctx.font='bold '+22*F+'px sans-serif';ctx.fillStyle='#fff';
      ctx.fillText('pour repartir plus vite !',x,y+56*F,w-16*F);
      ctx.restore();
    }
    if(me.state==='done'){if(race.mission){box(vx+vw/2-160*F,vy+vh/2-50*F,320*F,100*F);ctx.font='bold '+32*F+'px sans-serif';ctx.fillStyle='#ffd600';ctx.fillText(SK.missionOutcome(race,me).perfect&&SK.missionOutcome(race,me).medal==='gold'?'🏆 OR + PARFAIT !':SK.missionOutcome(race,me).perfect?'🌟 PARFAIT !':SK.missionOutcome(race,me).ok?'Mission réussie !':'Mission échouée',vx+vw/2,vy+vh/2);}else R.drawFinishBanner(ctx,me,vx+vw*.5,vy+vh*.25,vw*.88,t);}
  };
  R.notify = function (r, text, color, big, dur) { r.hud = r.hud || []; r.hud.push({ text, color, big, until: r.race.time + (dur || 2) }); if (r.hud.length > 3) r.hud.shift(); };
})(window.SK);
