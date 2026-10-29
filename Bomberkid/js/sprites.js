// Dessin des personnages (corps procédural + tête de famille), des bombes, flammes, objets et ennemis.
// Repère d'un sprite : origine aux pieds, y négatif vers le haut, s = pixels par case.
(function (BK) {
  'use strict';
  const S = BK.sprites = {};
  const TAU = Math.PI * 2;
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.closePath(); }
  const shade = (hex, k) => { if (!hex || hex[0] !== '#') return hex; const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + [f(n >> 16), f(n >> 8 & 255), f(n & 255)].map(c => c.toString(16).padStart(2, '0')).join(''); };
  S.rr = rr; S.circle = circle; S.shade = shade;
  // Petites bulles d’aide : largeur mesurée et retours à la ligne, au-dessus de la ceinture.
  S.drawHelpBubble = function(ctx,text,remaining,bottom=BK.H-100) {
    if(!text||remaining<=0)return;
    ctx.save();ctx.font='bold 17px Nunito, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';
    const maxWidth=Math.min(480,BK.W-40),padding=16,available=maxWidth-padding*2,lines=[];
    for(const paragraph of String(text).split('\n')) {
      let line='';
      for(const word of paragraph.split(/\s+/).filter(Boolean)) {
        if(line&&ctx.measureText(line+' '+word).width>available){lines.push(line);line='';}
        for(const ch of word){if(ctx.measureText(line+ch).width>available){lines.push(line);line='';}line+=ch;}
        line+=' ';
      }
      if(line.trim())lines.push(line.trim());
    }
    if(!lines.length){ctx.restore();return;}
    const width=Math.min(maxWidth,Math.max(140,...lines.map(l=>ctx.measureText(l).width+padding*2))),height=lines.length*23+24,x=(BK.W-width)/2,y=bottom-height;
    ctx.globalAlpha=Math.min(1,remaining*2);ctx.fillStyle='rgba(255,249,226,0.96)';ctx.strokeStyle='#85b6d4';ctx.lineWidth=2;
    rr(ctx,x,y,width,height,15);ctx.fill();ctx.stroke();ctx.fillStyle='#304a65';
    lines.forEach((line,i)=>ctx.fillText(line.trim(),x+padding,y+12+11.5+i*23));ctx.restore();
    return {x,y,width,height,lines};
  };
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };

  // -------------------------------------------------------------------- bombe
  // Bombe noire ronde, mèche et étincelle. fuse : 0..1 = fraction du temps restant (1 = vient d'être posée).
  // Roche des gants de force : un gros caillou gris ; cracked = elle a déjà servi une fois (elle cassera au prochain lancer).
  S.drawBoulder = function (ctx, x, y, k, o) {
    o = o || {}; ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-k * 0.12, -k * 0.14, k * 0.05, 0, 0, k * 0.42); g.addColorStop(0, '#b4bcc6'); g.addColorStop(1, '#5a616a'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-k * 0.36, k * 0.1); ctx.lineTo(-k * 0.3, -k * 0.2); ctx.lineTo(-k * 0.05, -k * 0.34); ctx.lineTo(k * 0.25, -k * 0.26); ctx.lineTo(k * 0.37, k * 0.02); ctx.lineTo(k * 0.22, k * 0.26); ctx.lineTo(-k * 0.2, k * 0.26); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-k * 0.1, -k * 0.18, k * 0.12, k * 0.05, -0.4, 0, TAU); ctx.fill();
    if (o.cracked) { ctx.strokeStyle = '#2a2e35'; ctx.lineWidth = Math.max(1, k * 0.025); ctx.beginPath(); ctx.moveTo(-k * 0.05, -k * 0.3); ctx.lineTo(k * 0.02, -k * 0.1); ctx.lineTo(-k * 0.06, k * 0.02); ctx.lineTo(k * 0.06, k * 0.2); ctx.stroke(); }
    ctx.restore();
  };
  // Poisson (pêché, lancé ou qui frétille au sol) : corps bleu, queue, œil ; a = angle, cooked = grillé.
  S.drawFish = function (ctx, x, y, k, a, cooked) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0);
    const g = ctx.createLinearGradient(0, -k * 0.14, 0, k * 0.14); if (cooked) { g.addColorStop(0, '#c9823a'); g.addColorStop(1, '#8a4a1a'); } else { g.addColorStop(0, '#8fd0ff'); g.addColorStop(1, '#2f6fd6'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, k * 0.24, k * 0.13, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(k * 0.2, 0); ctx.lineTo(k * 0.36, -k * 0.13); ctx.lineTo(k * 0.36, k * 0.13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = cooked ? 'rgba(60,30,10,0.5)' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; for (const sx of [-0.08, 0.02]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 0.1); ctx.quadraticCurveTo(k * sx + k * 0.05, 0, k * sx, k * 0.1); ctx.stroke(); }
    ctx.fillStyle = '#fff'; circle(ctx, -k * 0.13, -k * 0.03, k * 0.04); ctx.fill(); ctx.fillStyle = '#1b1b1b'; circle(ctx, -k * 0.14, -k * 0.03, k * 0.02); ctx.fill();
    if (cooked) { ctx.strokeStyle = 'rgba(40,20,5,0.6)'; ctx.lineWidth = Math.max(1, k * 0.02); for (const sx of [-0.14, -0.02, 0.1]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 0.08); ctx.lineTo(k * sx + k * 0.04, k * 0.08); ctx.stroke(); } }
    ctx.restore();
  };
  // Lanterne à fée accrochée au pantalon : cage dorée, petite fée dedans. lit = allumée (ailes qui battent, halo) ;
  // sinon la fée dort, roulée en boule, avec des « z » qui montent. back = vue de dos (la lanterne passe derrière).
  S.drawLantern = function (ctx, x, y, k, lit, t, back) {
    ctx.save(); ctx.translate(x, y); if (back) ctx.globalAlpha *= 0.85; const sw = Math.sin(t * 2.3) * 0.08; ctx.rotate(sw);
    const w = k * 0.2, h = k * 0.3;
    if (lit) { const g = ctx.createRadialGradient(0, h * 0.2, k * 0.02, 0, h * 0.2, k * 0.55); g.addColorStop(0, 'rgba(255,230,140,' + (0.55 + 0.1 * Math.sin(t * 7)) + ')'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; circle(ctx, 0, h * 0.2, k * 0.55); ctx.fill(); }
    ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = Math.max(1, k * 0.02); ctx.beginPath(); ctx.moveTo(0, -h * 0.55); ctx.lineTo(0, -h * 0.35); ctx.stroke();   // crochet
    ctx.fillStyle = '#c9a24a'; rr(ctx, -w * 0.6, -h * 0.4, w * 1.2, h * 0.12, k * 0.02); ctx.fill();   // chapeau
    ctx.fillStyle = lit ? 'rgba(255,240,180,0.55)' : 'rgba(200,210,230,0.35)'; rr(ctx, -w * 0.5, -h * 0.3, w, h * 0.62, k * 0.03); ctx.fill();   // verre
    ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = Math.max(1, k * 0.015); rr(ctx, -w * 0.5, -h * 0.3, w, h * 0.62, k * 0.03); ctx.stroke(); for (const sx of [-0.17, 0.17]) { ctx.beginPath(); ctx.moveTo(sx * w, -h * 0.3); ctx.lineTo(sx * w, h * 0.32); ctx.stroke(); }
    ctx.fillStyle = '#c9a24a'; rr(ctx, -w * 0.6, h * 0.3, w * 1.2, h * 0.12, k * 0.02); ctx.fill();   // socle
    // la fée
    const fy = h * 0.02 + (lit ? Math.sin(t * 6) * h * 0.06 : h * 0.12);
    if (lit) { ctx.fillStyle = 'rgba(255,255,255,' + (0.7 + 0.3 * Math.abs(Math.sin(t * 22))) + ')'; const fl = Math.abs(Math.sin(t * 22)) * w * 0.3 + w * 0.08; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * (w * 0.1 + fl * 0.5), fy - h * 0.04, fl, h * 0.09, sx * 0.5, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = lit ? '#fff2a8' : '#e8d8c0'; circle(ctx, 0, fy, lit ? w * 0.16 : w * 0.2); ctx.fill(); ctx.fillStyle = '#ffd54a'; circle(ctx, 0, fy - (lit ? w * 0.22 : w * 0.1), w * 0.11); ctx.fill();
    if (!lit) { ctx.fillStyle = '#5a4a3a'; ctx.font = 'bold ' + Math.max(6, Math.round(k * 0.12)) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (let i = 0; i < 3; i++) { const ph = ((t * 0.7 + i * 0.33) % 1); ctx.globalAlpha = (1 - ph) * 0.9; ctx.font = 'bold ' + Math.max(6, Math.round(k * (0.1 + ph * 0.08))) + 'px Nunito, sans-serif'; ctx.fillText('z', w * 0.45 + ph * w * 0.5, -h * 0.35 - ph * h * 0.7); } ctx.globalAlpha = 1; }
    else { ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1, rr0 = w * (0.35 + 0.15 * Math.sin(t * 3 + i)); circle(ctx, Math.cos(a) * rr0, fy + Math.sin(a) * rr0 * 0.7, Math.max(1, k * 0.012)); ctx.fill(); } }
    ctx.restore();
  };
  S.drawBoat = function(ctx,x,y,s,dir,t,front) {
    ctx.save();ctx.translate(x,y+Math.sin(t*.4)*s*.015);
    const side=dir===1||dir===3,w=s*(side?.62:.44),h=s*(side?.25:.38);
    ctx.lineWidth=Math.max(1,s*.035);ctx.strokeStyle='#56351e';
    if(!front){
      ctx.fillStyle='rgba(190,238,255,.35)';ctx.beginPath();ctx.ellipse(0,s*.08,w*1.15,h*.9,0,0,TAU);ctx.fill();
      ctx.fillStyle='#b77e43';ctx.beginPath();ctx.moveTo(-w,0);ctx.quadraticCurveTo(-w*.65,-h*1.35,w,0);ctx.quadraticCurveTo(w*.65,h*1.15,-w,0);ctx.fill();ctx.stroke();
      ctx.fillStyle='#593b26';ctx.beginPath();ctx.ellipse(0,-s*.035,w*.72,h*.55,0,0,TAU);ctx.fill();
      ctx.strokeStyle='#dfad68';ctx.lineWidth=s*.08;ctx.beginPath();ctx.moveTo(-w*.55,-h*.1);ctx.lineTo(w*.55,h*.1);ctx.stroke();
      ctx.strokeStyle='#bd9057';ctx.lineWidth=s*.045;for(const sign of [-1,1]){const sweep=Math.sin(t)*s*.12;ctx.beginPath();ctx.moveTo(sign*w*.4,-s*.06);ctx.lineTo(sign*w*1.4,h*.65+sweep);ctx.stroke();ctx.lineWidth=s*.1;ctx.beginPath();ctx.moveTo(sign*w*1.25,h*.52+sweep);ctx.lineTo(sign*w*1.5,h*.76+sweep);ctx.stroke();ctx.lineWidth=s*.045;}
    } else {ctx.fillStyle='#94602f';ctx.beginPath();ctx.moveTo(-w,0);ctx.quadraticCurveTo(0,h*.6,w,0);ctx.quadraticCurveTo(w*.6,h*1.2,-w*.65,h*.55);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#e0ae6c';ctx.beginPath();ctx.moveTo(-w,0);ctx.quadraticCurveTo(0,h*.6,w,0);ctx.stroke();}
    ctx.restore();
  };

  S.drawBomb = function (ctx, x, y, r, o) {
    o = o || {}; r *= (o.giga ? 1.6 : 1) * (1 + (o.inflation || 0) * 0.55); const t = o.t || 0, fuse = Math.max(0, Math.min(1, o.fuse == null ? 1 : o.fuse));
    const pulse = 1 + 0.07 * Math.sin(t * (6 + (1 - fuse) * 14)) * (0.4 + (1 - fuse));
    ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    const hot = clamp01((0.25 - fuse) / 0.25);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, o.giga ? '#e7b3ff' : o.level === 2 ? '#ff8c86' : hot ? '#6b4040' : '#4a5260'); g.addColorStop(0.7, o.giga ? '#8b3bc4' : o.level === 2 ? '#ce243d' : '#1f242c'); g.addColorStop(1, o.giga ? '#421465' : o.level === 2 ? '#721327' : '#0c0e12');
    ctx.fillStyle = g; circle(ctx, 0, 0, r); ctx.fill();
    if (hot) { ctx.fillStyle = 'rgba(255,80,40,' + (hot * 0.35 * (0.6 + 0.4 * Math.sin(t * 30))) + ')'; circle(ctx, 0, 0, r); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.42, r * 0.22, r * 0.13, -0.7, 0, TAU); ctx.fill();
    // bouchon et mèche
    ctx.fillStyle = '#5a6270'; rr(ctx, -r * 0.2, -r * 1.08, r * 0.4, r * 0.25, r * 0.06); ctx.fill();
    const fl = 0.15 + 0.35 * fuse;
    ctx.strokeStyle = '#d9c7a0'; ctx.lineWidth = Math.max(1.2, r * 0.1); ctx.beginPath(); ctx.moveTo(0, -r * 1.05);
    ctx.quadraticCurveTo(r * 0.25, -r * (1.1 + fl), r * (0.35 + fl * 0.6), -r * (1.15 + fl * 1.4)); ctx.stroke();
    const sx = r * (0.35 + fl * 0.6), sy = -r * (1.15 + fl * 1.4);
    if (!o.noSpark) {
      ctx.fillStyle = '#fff2a8'; circle(ctx, sx, sy, r * (0.12 + 0.06 * Math.sin(t * 40))); ctx.fill();
      ctx.strokeStyle = '#ffb03a'; ctx.lineWidth = 1.2; for (let i = 0; i < 4; i++) { const a = t * 25 + i * 1.6, l = r * (0.18 + 0.1 * Math.sin(t * 33 + i)); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); ctx.stroke(); }
    }
    ctx.restore();
  };

  // -------------------------------------------------------------------- personnage
  // o : { pose, t, view: 'front'|'back'|'side', flip, s (px par case), walk (phase de marche), carrying (bool), speed }
  S.drawCharacter = function (ctx, def, o) {
    o = o || {}; const s = o.s || 60, pose = o.pose || 'idle', t = o.t || 0, view = o.view || 'front';
    const k = def.size || 1, H = s * (0.8 + 0.7 * k);        // hauteur totale (adulte 1,5 case, tout-petit 1,25)
    const hd = H * 0.5, bh = H * 0.33, lh = H * 0.17, bw = H * 0.4;
    const outfit = def.outfit || '#d9342b', accent = def.accent || '#1e5bd8', skin = def.skin || '#f3cfae';
    const side = view === 'side', back = view === 'back';
    const walking = pose === 'walk' || pose === 'carrywalk';
    const carrying = pose === 'carry' || pose === 'carrywalk' || o.carrying;
    const ph = walking ? (o.walk != null ? o.walk : t * 9) : 0;
    const swing = walking ? Math.sin(ph) : 0;
    const bob = walking ? Math.abs(Math.sin(ph)) * H * 0.035 : Math.sin(t * 2.2) * H * 0.008;
    let crouch = 0, lean = 0, jump = 0, spin = 0, fade = 1, armMode = carrying ? 'up' : 'swing', headTilt = 0, scaleY = 1;
    const pt = o.poseT == null ? t : o.poseT;   // temps depuis le début de la pose (animations courtes)
    if (pose === 'pickup') { const u = pt / 0.4; crouch = Math.sin(clamp01(u) * Math.PI) * H * 0.12; armMode = u < 0.5 ? 'down' : 'up'; }
    else if (pose === 'place') { const u = pt / 0.25; crouch = Math.sin(clamp01(u) * Math.PI) * H * 0.1; armMode = 'down'; }
    else if (pose === 'throw') { const u = pt / 0.35; armMode = u < 0.35 ? 'up' : 'forward'; lean = (u < 0.35 ? -0.12 : 0.18) * (side ? 1 : 0); }
    else if (pose === 'hit') { lean = -0.25 * Math.sin(clamp01(pt / 0.5) * Math.PI); armMode = 'flail'; headTilt = -0.2; }
    else if (pose === 'dead') { const u = clamp01(pt / 1.3); spin = u * TAU * 2; fade = 1 - ease((u - 0.55) / 0.45); jump = Math.sin(clamp01(u / 0.5) * Math.PI) * H * 0.6; armMode = 'flail'; }
    else if (pose === 'win') { const u = (t % 0.9) / 0.9; jump = Math.sin(u * Math.PI) * H * 0.35; armMode = 'cheer'; }
    else if (pose === 'jump') { armMode = 'cheer'; scaleY = 1.04; crouch = -H * 0.02; headTilt = -0.05; }
    else if (pose === 'drink') { const u = (pt % 0.4) / 0.4; crouch = H * 0.06 + Math.sin(u * TAU) * H * 0.025; armMode = 'up'; headTilt = 0.35 + Math.sin(u * TAU) * 0.05; lean = 0.08 * (side ? 1 : 0); }
    else if (pose === 'lose') { crouch = H * 0.08; armMode = 'hang'; headTilt = 0.25; scaleY = 0.97; }
    else if (pose === 'fish') { armMode = 'forward'; lean = 0.1 * (side ? 1 : 0); crouch = H * 0.02 + (o.jolt ? Math.sin(pt * 30) * H * 0.03 : 0); headTilt = 0.12; }   // canne tendue vers l'eau
    const flip = o.flip ? -1 : 1;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.globalAlpha *= fade;
    ctx.translate(0, -jump);
    if (spin) { ctx.translate(0, -H * 0.5); ctx.rotate(spin); ctx.translate(0, H * 0.5); }
    ctx.scale(flip, scaleY);
    if (lean) { ctx.rotate(lean); }
    // ---- jambes
    const legY = -lh - bob + crouch, legW = H * 0.14;
    const legs = () => {
      const boot = accent === '#ffffff' ? '#cfd3d8' : accent;
      if(pose==='sit'){
        for(const sign of [-1,1]){ctx.fillStyle=shade(outfit,.85);rr(ctx,sign*H*.11-legW/2,legY,legW,lh*.55,legW*.4);ctx.fill();ctx.fillStyle=boot;rr(ctx,sign*H*.11-legW*.65,legY+lh*.42,legW*1.4,H*.1,legW*.3);ctx.fill();}
      } else if (side) {
        for (const front of [false, true]) {   // jambe arrière puis jambe avant
          const sw = swing * H * 0.12, xs = front ? sw : -sw, lift = (front ? Math.max(0, swing) : Math.max(0, -swing)) * H * 0.07;
          ctx.fillStyle = front ? shade(outfit, 0.85) : shade(outfit, 0.6);
          rr(ctx, xs - legW / 2, legY - lift, legW, lh + bob - crouch * 0.4 + lift, legW * 0.4); ctx.fill();
          ctx.fillStyle = front ? boot : shade(boot, 0.7);
          rr(ctx, xs - legW * 0.55, -H * 0.07 - lift, legW * 1.35, H * 0.07, legW * 0.3); ctx.fill();
        }
      } else {
        for (const sgn of [-1, 1]) {
          const lift = (sgn * swing > 0 ? sgn * swing : 0) * H * 0.07;
          ctx.fillStyle = shade(outfit, 0.85);
          rr(ctx, sgn * H * 0.11 - legW / 2, legY - lift, legW, lh + bob - crouch * 0.4 + lift, legW * 0.4); ctx.fill();
          ctx.fillStyle = boot;
          rr(ctx, sgn * H * 0.11 - legW * 0.65, -H * 0.07 - lift, legW * 1.3, H * 0.07, legW * 0.3); ctx.fill();
        }
      }
    };
    legs(true);
    // ---- torse
    const torsoTop = legY - bh + crouch * 0.4, tw = side ? bw * 0.78 : bw;
    const torso = () => {   // (de profil, le bras arrière est dessiné avant, le torse le cache)
      ctx.fillStyle = outfit; rr(ctx, -tw / 2, torsoTop, tw, bh + H * 0.04, tw * 0.35); ctx.fill();
      if (def.belly) { ctx.fillStyle = shade(outfit, 1.12); ctx.beginPath(); ctx.ellipse(side ? tw * 0.12 : 0, torsoTop + bh * 0.62, tw * 0.42, bh * 0.36, 0, 0, TAU); ctx.fill(); }
      if (!back) { ctx.fillStyle = shade(outfit, 1.18); rr(ctx, -tw * 0.22, torsoTop + bh * 0.12, tw * 0.44, bh * 0.45, tw * 0.15); ctx.fill(); }
      // ceinture et boucle
      ctx.fillStyle = '#23262d'; rr(ctx, -tw / 2, torsoTop + bh * 0.68, tw, bh * 0.2, 2); ctx.fill();
      if (!back) { ctx.fillStyle = '#ffd54a'; rr(ctx, (side ? tw * 0.18 : 0) - tw * 0.1, torsoTop + bh * 0.68, tw * 0.2, bh * 0.2, 2); ctx.fill(); }
    };
    if (!side) torso();
    // ---- bras
    const shY = torsoTop + bh * 0.18, armL = H * 0.26, armW = H * 0.11;
    const glove = accent;
    const arm = (sx, ang, len, o2) => {
      o2 = o2 || {}; const ex = sx + Math.sin(ang) * len, ey = shY + Math.cos(ang) * len;
      ctx.strokeStyle = o2.dark ? shade(outfit, 0.6) : outfit; ctx.lineWidth = armW; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, shY); ctx.lineTo(ex, ey); ctx.stroke();
      const gr = armW * 0.62 * (o2.big || 1);
      ctx.fillStyle = o2.dark ? shade(glove, 0.7) : glove; circle(ctx, ex, ey, gr); ctx.fill();
      ctx.strokeStyle = shade(glove === '#ffffff' ? '#cfd3d8' : glove, 0.75); ctx.lineWidth = 1; circle(ctx, ex, ey, gr); ctx.stroke();
      return { x: ex, y: ey };
    };
    let hands = [];
    const sw = swing * 0.8;
    if (side) {
      // bras arrière (plus foncé) puis bras avant ; le balancement se voit de profil
      let backA, frontA, len = armL, big = 1;
      if (armMode === 'up') { backA = Math.PI - 0.25; frontA = Math.PI - 0.25; }
      else if (armMode === 'down') { backA = 0.9; frontA = 0.9; len = armL * 1.05; }
      else if (armMode === 'forward') { backA = Math.PI / 2; frontA = Math.PI / 2 + 0.1; }
      else if (armMode === 'flail') { backA = Math.PI - 0.6 + Math.sin(t * 20) * 0.3; frontA = Math.PI - 1.0 - Math.sin(t * 20) * 0.3; }
      else if (armMode === 'cheer') { backA = Math.PI - 0.4 + Math.sin(t * 8) * 0.15; frontA = Math.PI - 0.6 - Math.sin(t * 8) * 0.15; }
      else if (armMode === 'hang') { backA = 0.05; frontA = -0.05; }
      else { backA = -sw; frontA = sw; }
      hands.push(arm(-tw * 0.05, backA, len, { dark: true })); torso(); hands.push(arm(tw * 0.1, frontA, len, { big }));   // bras arrière, corps, bras avant : un seul bras devant
    } else {
      // vue de face / de dos : les bras pendent sur les côtés ; en marchant ils raccourcissent (balancement en profondeur)
      let aL, aR, len = armL, big = 1;
      if (armMode === 'up') { aL = Math.PI + 0.3; aR = Math.PI - 0.3; }
      else if (armMode === 'down') { aL = -0.35; aR = 0.35; len = armL * 1.08; }
      else if (armMode === 'forward') { aL = -0.25; aR = 0.25; len = armL * 0.5; big = 1.35; }
      else if (armMode === 'flail') { aL = Math.PI + 0.8 - Math.sin(t * 20) * 0.3; aR = Math.PI - 0.8 + Math.sin(t * 20) * 0.3; }
      else if (armMode === 'cheer') { aL = Math.PI + 0.5 - Math.sin(t * 8) * 0.2; aR = Math.PI - 0.5 + Math.sin(t * 8) * 0.2; }
      else if (armMode === 'hang') { aL = -0.08; aR = 0.08; }
      else { aL = -0.22; aR = 0.22; }
      const lenL = armMode === 'swing' ? len * (0.6 + 0.4 * Math.cos(sw)) : len, lenR = armMode === 'swing' ? len * (0.6 + 0.4 * Math.cos(sw + Math.PI)) : len;
      hands.push(arm(-tw / 2 + armW * 0.25, back ? -aR : aL, lenL, { big: back ? 1 : big }));
      hands.push(arm(tw / 2 - armW * 0.25, back ? -aL : aR, lenR, { big: back ? 1 : big }));
    }
    // ---- tête
    const headY = torsoTop - hd * 0.42 + H * 0.03;    // centre
    ctx.save(); ctx.translate(0, headY); ctx.rotate(headTilt);
    const F = BK.FamilyHeadsRef && BK.FamilyHeadsRef();
    const portrait = F && F.has(def.familyPortrait);
    if (portrait) {
      const hw = hd * 1.18, hh = hd * 1.16;
      F.draw(ctx, def.familyPortrait, view, -hw / 2, -hh * 0.5 - hd * 0.05, hw, hh);
    } else {
      ctx.fillStyle = skin; circle(ctx, 0, 0, hd / 2); ctx.fill();
      ctx.fillStyle = def.hair || '#5a3a22'; ctx.beginPath(); ctx.arc(0, -hd * 0.08, hd / 2, Math.PI, TAU); ctx.closePath(); ctx.fill();
      if (!back) { ctx.fillStyle = '#222'; circle(ctx, (side ? hd * 0.22 : -hd * 0.16), hd * 0.02, hd * 0.05); ctx.fill(); if (!side) { circle(ctx, hd * 0.16, hd * 0.02, hd * 0.05); ctx.fill(); } }
    }
    // antenne
    const ax = side ? -hd * 0.05 : 0, ay = -hd * 0.5 - H * 0.02;
    ctx.strokeStyle = '#4b5563'; ctx.lineWidth = Math.max(1.5, H * 0.02); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax + swing * hd * 0.1, ay - hd * 0.16, ax + swing * hd * 0.15, ay - hd * 0.3); ctx.stroke();
    ctx.fillStyle = def.antenna || '#ffd54a'; circle(ctx, ax + swing * hd * 0.15, ay - hd * 0.3, Math.max(2.5, H * 0.045)); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; circle(ctx, ax + swing * hd * 0.15 - H * 0.012, ay - hd * 0.3 - H * 0.012, Math.max(1, H * 0.014)); ctx.fill();
    ctx.restore();
    if (pose === 'hit' || (pose === 'dead' && pt < 0.6)) { ctx.fillStyle = '#ffe36b'; for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.1; circle(ctx, Math.cos(a) * hd * 0.7, headY - hd * 0.75 + Math.sin(a) * hd * 0.2, Math.max(2, H * 0.03)); ctx.fill(); } }
    // ---- bombe portée au-dessus de la tête
    if (carrying && armMode === 'up') {
      const by = headY - hd * 0.5 - H * 0.26, br = H * 0.17;
      if (o.rock) S.drawBoulder(ctx, 0, by + br * 0.1, br * 2.4, { cracked: o.rockCracked }); else S.drawBomb(ctx, 0, by, br, { level:o.bombLevel, giga:o.bombGiga, inflation:o.bombInflation, gift:o.bombGift, t: o.bombT != null ? o.bombT : t, fuse: o.bombFuse == null ? 1 : o.bombFuse });
      ctx.fillStyle = glove; for (const sgn of (side ? [1] : [-1, 1])) { circle(ctx, sgn * br * 0.8, by + br * 0.55, armW * 0.5); ctx.fill(); }
    }
    ctx.restore();
    return { height: H, headY: -(lh + bh) - hd };
  };

  // -------------------------------------------------------------------- ennemis
  // Animaux pacifiques, dessinés dans les mêmes unités que les autres habitants.
  S.drawAnimal = function (ctx, type, o) {
    if (type === 'lapin_gentil') { S.drawEnemy(ctx, 'lapin', { ...o, s:(o.s||60)*0.75, tame:true }); return; }
    const s = (o.s || 60)*(o.baby ? 0.5+Math.min(3,o.growth||0)/6 : 1), t = o.t || 0, moving = o.state === 'walk', cat = type === 'chat', bird = type === 'oiseau';
    ctx.save(); ctx.scale((o.flip ? -1 : 1) * s, s);
    const ellipse = (x,y,rx,ry,col,rot=0) => { ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot,0,TAU); ctx.fill(); };
    const line = (pts,col,w) => { ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); };
    const poly = (pts,col) => { ctx.fillStyle=col; ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); };
    const eye = (x,y) => { ellipse(x,y,0.027,0.033,'#243344'); ellipse(x+0.008,y-0.012,0.009,0.011,'#fff'); };
    if (type === 'escargot') {
      // À peine une demi-case de long, avec une coquille et deux antennes mobiles.
      const colors=BK.SNAIL_COLORS[o.shellColor]||BK.SNAIL_COLORS.default;
      const sway=Math.sin(t*1.8)*0.012, visible=1-Math.max(0,Math.min(1,o.shell||0));
      if (visible > 0) {
      ctx.save(); ctx.translate(-0.055,-0.04); ctx.scale(visible,visible); ctx.translate(0.055,0.04);
      ellipse(0,-0.035,0.23,0.045,'#a8c879');
      ellipse(0.15,-0.075,0.065,0.055,'#c8e595');
      for(const x of [0.13,0.19]) {
        line([[x,-0.09],[x+0.025+sway,-0.18]],'#a8c879',0.018);
        ellipse(x+0.025+sway,-0.18,0.016,0.018,'#34483e');
      }
      ctx.restore();
      }
      ellipse(-0.055,-0.13,0.135,0.125,colors.dark);
      ellipse(-0.06,-0.14,0.116,0.108,colors.shell);
      const spiral=[];
      for(let i=0;i<=48;i++) { const a=i/48*Math.PI*3.5, r=0.006+i/48*0.085; spiral.push([-0.06+Math.cos(a)*r,-0.14+Math.sin(a)*r]); }
      line(spiral,colors.dark,0.016);
      ellipse(-0.095,-0.205,0.035,0.013,colors.shine,-0.4);
    } else if (type === 'cerf') {
      const stride=moving?Math.sin(t*9)*0.07:0;
      for(const x of [-0.24,0.18]) line([[x,-0.43],[x-stride,-0.04]],'#825633',0.065);
      const g=ctx.createLinearGradient(0,-0.65,0,-0.2);g.addColorStop(0,'#e0b47b');g.addColorStop(1,'#ae7948');
      ellipse(-0.02,-0.47,0.37,0.22,g);ellipse(-0.12,-0.39,0.24,0.1,'#f0d8ac');
      line([[0.23,-0.45],[0.31,-0.83]],'#c28d54',0.17);
      for(const x of [-0.27,0.22]) {line([[x,-0.42],[x+stride,-0.06]],'#cea06b',0.065);line([[x+stride,-0.07],[x+stride+0.025,-0.025]],'#4a4034',0.065);}
      ellipse(-0.39,-0.55,0.1,0.055,'#f6e4c9',-0.6);
      for(const sign of [-1,1]) {const x=0.27+sign*0.09;line([[x,-0.94],[x+sign*0.07,-1.13],[x+sign*0.13,-1.25]],'#796044',0.03);line([[x+sign*0.08,-1.15],[x+sign*0.02,-1.25]],'#796044',0.025);}
      ellipse(0.13,-0.9,0.12,0.055,'#c59b6c',0.45);ellipse(0.43,-0.9,0.12,0.055,'#c59b6c',-0.45);
      ellipse(0.3,-0.83,0.14,0.18,g);ellipse(0.38,-0.75,0.11,0.07,'#f6dfb7');ellipse(0.45,-0.77,0.035,0.03,'#3f352c');eye(0.32,-0.87);
      for(const [x,y] of [[-0.2,-0.57],[-0.08,-0.6],[0.04,-0.57],[-0.14,-0.48],[-0.01,-0.49]])ellipse(x,y,0.025,0.035,'#f5dfb6');
    } else if (bird) {
      const flap = moving ? Math.sin(t*22) : Math.sin(t*3)*0.08;
      line([[-0.06,-0.11],[-0.07,-0.02],[-0.02,-0.02]],'#db9b36',0.025); line([[0.09,-0.11],[0.1,-0.02],[0.15,-0.02]],'#db9b36',0.025);
      poly([[-0.15,-0.17],[-0.36,-0.31],[-0.3,-0.13],[-0.14,-0.1]],'#327da7');
      const g=ctx.createLinearGradient(0,-0.45,0,-0.08); g.addColorStop(0,'#91d9f3'); g.addColorStop(1,'#3385bd');
      ellipse(0,-0.23,0.22,0.17,g); ellipse(0.08,-0.19,0.12,0.11,'#ffe1aa');
      ctx.save(); ctx.translate(-0.08,-0.26); ctx.rotate(-0.3+flap*0.85); ellipse(-0.08,0,0.16,0.075,'#367cae'); line([[-0.18,0.01],[-0.04,0.035]],'#78b8d9',0.018); ctx.restore();
      ellipse(0.16,-0.37,0.13,0.125,'#6bbde4'); poly([[0.26,-0.38],[0.38,-0.34],[0.26,-0.31]],'#f5b93e'); eye(0.195,-0.395);
    } else {
      const fur=cat?'#e7a05a':'#bc8048', light=cat?'#ffd5a0':'#eac193', dark=cat?'#aa6639':'#754d35', sit=cat&&!moving;
      const stride=moving?Math.sin(t*11)*0.045:0;
      ctx.save(); ctx.translate(-0.25,-0.26); ctx.rotate(Math.sin(t*(cat?2.5:9))*(cat?0.15:0.3));
      ctx.strokeStyle=fur; ctx.lineWidth=cat?0.065:0.09; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-0.23,-0.1,-0.19,-0.34); ctx.stroke(); ctx.restore();
      for (const x of [-0.2,0.16]) { line([[x,-0.23],[x-stride,-0.035],[x+0.045-stride,-0.025]],dark,0.075); }
      const g=ctx.createLinearGradient(0,-0.5,0,-0.1); g.addColorStop(0,light); g.addColorStop(1,fur);
      ellipse(sit?-0.09:-0.03,sit?-0.26:-0.25,sit?0.19:0.3,sit?0.25:0.19,g);
      for (const x of [sit?-0.02:-0.23,0.16]) { line([[x,sit?-0.32:-0.22],[x+stride,-0.04],[x+0.05+stride,-0.03]],light,0.07); }
      ctx.save(); const sniff=!cat&&!moving?0.07+Math.sin(t*3)*0.02:0; ctx.translate(0,sniff);
      if (cat) {
        poly([[0.02,-0.47],[0.01,-0.72],[0.17,-0.59]],fur); poly([[0.22,-0.59],[0.35,-0.71],[0.35,-0.46]],fur);
        poly([[0.055,-0.54],[0.045,-0.66],[0.13,-0.57]],'#eab2aa'); poly([[0.25,-0.57],[0.32,-0.65],[0.32,-0.53]],'#eab2aa');
      }
      ellipse(0.19,-0.46,0.19,0.18,g);
      if (!cat) { ellipse(0.04,-0.46,0.075,0.16,dark,-0.2); ellipse(0.31,-0.45,0.065,0.13,dark,0.2); }
      ellipse(0.24,-0.38,0.115,0.08,'#fff0d7'); eye(0.145,-0.49); eye(0.27,-0.49);
      ellipse(0.24,-0.405,0.032,0.023,cat?'#bc7476':'#2d2927');
      line([[0.24,-0.39],[0.24,-0.36],[0.28,-0.35]],'#785342',0.012);
      if (cat) {
        for (const side of [-1,1]) for (const y of [-0.39,-0.35]) line([[0.24+side*0.07,y],[0.24+side*0.19,y-0.02]],'#785342',0.009);
        for (const x of [0.12,0.19,0.26]) line([[x,-0.615],[x+0.012,-0.56]],dark,0.018);
      } else { ellipse(0.27,-0.325,0.025,0.04,'#eb9198'); line([[0.06,-0.3],[0.26,-0.29]],'#4e9aa5',0.045); ellipse(0.22,-0.26,0.026,0.029,'#ffdb64'); }
      ctx.restore();
      if (cat) { for (const x of [-0.2,-0.12,-0.04]) line([[x,-0.4],[x+0.025,-0.33]],dark,0.025); }
    }
    ctx.restore();
  };
  S.drawEnemy = function (ctx, type, o) {
    if(BK.ENEMIES[type].bestiary){S.drawBestiary(ctx,type,o);return;}
    if(BK.ENEMIES[type].wildlife){S.drawWildlife(ctx,type,o);return;}
    if (BK.ENEMIES[type].peaceful) { S.drawAnimal(ctx, type, o || {}); return; }
    const E = BK.ENEMIES[type]; o = o || {}; const s = o.s || 60, t = o.t || 0, hurt = o.hurt || 0;
    const r = E.r * s * 1.3, col = hurt > 0 && Math.floor(t * 30) % 2 ? '#ffffff' : o.inferno ? '#783c32' : E.color;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    const flip = o.flip ? -1 : 1; ctx.scale(flip, 1);
    if (type === 'ballon') {
      const bob = Math.sin(t * 3) * r * 0.15, w = r * (1 + 0.05 * Math.sin(t * 5));
      ctx.fillStyle = shade(col, 0.8); ctx.beginPath(); ctx.ellipse(0, -r * 0.1 - bob, r * 0.25, r * 0.35, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(-r * 0.3, -r * 1.3 - bob, r * 0.1, 0, -r - bob, r); g.addColorStop(0, shade(col, 1.25)); g.addColorStop(1, col);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r - bob, w, r * 1.05, 0, 0, TAU); ctx.fill();
      face(ctx, 0, -r - bob, r, t, 'grumpy');
    } else if (type === 'gluant') {
      const sq = 1 + 0.12 * Math.sin(t * 8), h = r * 1.5 / sq, w = r * sq;
      ctx.fillStyle = shade(col, 0.75); ctx.beginPath(); ctx.ellipse(0, 0, w * 1.05, r * 0.3, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(-w * 0.3, -h * 0.7, r * 0.1, 0, -h * 0.5, h); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, col);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(-w, -h * 1.3, 0, -h * 1.25); ctx.quadraticCurveTo(w, -h * 1.3, w, 0); ctx.closePath(); ctx.fill();
      face(ctx, 0, -h * 0.6, r * 0.9, t, 'hungry');
    } else if (type === 'fantome') {
      const bob = Math.sin(t * 2.5) * r * 0.2, h = r * 1.9;
      ctx.globalAlpha *= 0.85 + 0.15 * Math.sin(t * 6);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -h * 0.55 - bob - r * 0.3, r, Math.PI, TAU); ctx.lineTo(r, -r * 0.3 - bob);
      for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(r - r * (i + 0.5) / 2, -bob - r * 0.3 - (i % 2 ? 0 : r * 0.3) + Math.sin(t * 10 + i) * r * 0.08, r - r * (i + 1) / 2, -bob - r * 0.3);
      ctx.closePath(); ctx.fill();
      face(ctx, 0, -h * 0.55 - bob - r * 0.25, r, t, 'boo');
    } else if (type === 'chevalier' || type === 'chevalier_rouge' || type === 'chevalier_bleu' || type === 'chevalier_dore') {
      // chevalier en armure : bottes, jambières, plastron bombé, épaulières, bouclier à emblème, épée, heaume à plumet.
      // Pierre (gris), rouge, bleu ; le doré brille d'une aura et d'étincelles. En charge : penché en avant, visière rouge, traînées.
      const charge = o.charging ? 1 : 0, gold = type === 'chevalier_dore', metal = hurt > 0 && Math.floor(t * 30) % 2 ? '#ffffff' : (gold ? '#f1c232' : '#b8c0c9'), dark = shade(metal, 0.65), bob = Math.sin(t * (charge ? 30 : 5)) * r * 0.04;
      const trim = gold ? '#fff2a8' : type === 'chevalier_rouge' ? '#ffd54a' : type === 'chevalier_bleu' ? '#e6eef6' : '#c9a24a';
      if (gold) { const ga = ctx.createRadialGradient(0, -r * 1.1, r * 0.3, 0, -r * 1.1, r * 2.2); ga.addColorStop(0, 'rgba(255,220,90,' + (0.35 + 0.1 * Math.sin(t * 4)) + ')'); ga.addColorStop(1, 'rgba(255,220,90,0)'); ctx.fillStyle = ga; circle(ctx, 0, -r * 1.1, r * 2.2); ctx.fill(); }
      if (charge) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1.5, r * 0.06); for (let i = 0; i < 3; i++) { const y = -r * (0.6 + i * 0.5), L = r * (1.2 + ((t * 40 + i * 7) % 5) / 5); ctx.beginPath(); ctx.moveTo(-r * 0.9, y); ctx.lineTo(-r * 0.9 - L, y); ctx.stroke(); } }
      ctx.save(); ctx.translate(0, -bob); if (charge) ctx.rotate(0.18);
      // bottes et jambières
      for (const sgn of [-1, 1]) { const st = charge ? sgn * Math.sin(t * 30) * r * 0.2 : sgn * Math.sin(t * 5) * r * 0.08; ctx.fillStyle = dark; rr(ctx, sgn * r * 0.38 - r * 0.2, -r * 0.75, r * 0.4, r * 0.75 + st * 0.2, r * 0.1); ctx.fill(); ctx.fillStyle = '#3a3f48'; rr(ctx, sgn * r * 0.38 - r * 0.26, -r * 0.22 + st * 0.3, r * 0.52, r * 0.22, r * 0.08); ctx.fill(); }
      // plastron bombé, ceinture, épaulières
      const g = ctx.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, shade(col, 0.75)); g.addColorStop(0.45, shade(col, 1.25)); g.addColorStop(1, shade(col, 0.7)); ctx.fillStyle = g; rr(ctx, -r * 0.85, -r * 1.85, r * 1.7, r * 1.2, r * 0.35); ctx.fill();
      ctx.strokeStyle = shade(col, 0.5); ctx.lineWidth = Math.max(1, r * 0.05); rr(ctx, -r * 0.85, -r * 1.85, r * 1.7, r * 1.2, r * 0.35); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -r * 1.75); ctx.lineTo(0, -r * 0.95); ctx.stroke();
      ctx.fillStyle = '#2a2d33'; rr(ctx, -r * 0.85, -r * 0.95, r * 1.7, r * 0.2, r * 0.05); ctx.fill(); ctx.fillStyle = trim; rr(ctx, -r * 0.14, -r * 0.97, r * 0.28, r * 0.24, r * 0.05); ctx.fill();
      for (const sgn of [-1, 1]) { ctx.fillStyle = metal; ctx.beginPath(); ctx.ellipse(sgn * r * 0.85, -r * 1.7, r * 0.38, r * 0.3, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = trim; circle(ctx, sgn * r * 0.85, -r * 1.72, r * 0.07); ctx.fill(); }
      // bouclier (à gauche) avec emblème, épée (à droite)
      ctx.save(); ctx.translate(-r * 1.05, -r * 1.3); ctx.fillStyle = shade(col, 0.6); ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.5); ctx.lineTo(r * 0.4, -r * 0.5); ctx.lineTo(r * 0.4, r * 0.1); ctx.quadraticCurveTo(r * 0.4, r * 0.55, 0, r * 0.75); ctx.quadraticCurveTo(-r * 0.4, r * 0.55, -r * 0.4, r * 0.1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.stroke();
      ctx.fillStyle = trim; if (gold) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); ctx.lineTo(Math.cos(a + 0.4) * r * 0.12, Math.sin(a + 0.4) * r * 0.12); ctx.closePath(); ctx.fill(); } circle(ctx, 0, 0, r * 0.1); ctx.fill(); } else { rr(ctx, -r * 0.06, -r * 0.32, r * 0.12, r * 0.6, 2); ctx.fill(); rr(ctx, -r * 0.24, -r * 0.14, r * 0.48, r * 0.12, 2); ctx.fill(); } ctx.restore();
      ctx.save(); ctx.translate(r * 0.95, -r * 1.25); ctx.rotate(charge ? 1.35 : -0.25 + Math.sin(t * 3) * 0.05); ctx.fillStyle = '#5a3a1a'; rr(ctx, -r * 0.06, -r * 0.05, r * 0.12, r * 0.35, 2); ctx.fill(); ctx.fillStyle = trim; rr(ctx, -r * 0.24, -r * 0.1, r * 0.48, r * 0.1, 2); ctx.fill(); const bg = ctx.createLinearGradient(-r * 0.08, 0, r * 0.08, 0); bg.addColorStop(0, '#f4f6fb'); bg.addColorStop(0.5, '#c4ccd4'); bg.addColorStop(1, '#8a929c'); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-r * 0.08, -r * 0.1); ctx.lineTo(r * 0.08, -r * 0.1); ctx.lineTo(r * 0.08, -r * 1.0); ctx.lineTo(0, -r * 1.15); ctx.lineTo(-r * 0.08, -r * 1.0); ctx.closePath(); ctx.fill(); ctx.restore();
      // heaume : calotte, visière à fente (rouge en charge), plumet
      ctx.fillStyle = metal; rr(ctx, -r * 0.62, -r * 2.75, r * 1.24, r * 1.0, r * 0.4); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; rr(ctx, -r * 0.62, -r * 2.75, r * 1.24, r * 1.0, r * 0.4); ctx.stroke();
      ctx.fillStyle = shade(metal, 0.85); rr(ctx, -r * 0.62, -r * 2.3, r * 1.24, r * 0.5, r * 0.2); ctx.fill(); ctx.fillStyle = dark; rr(ctx, -r * 0.55, -r * 2.3, r * 1.1, r * 0.1, 2); ctx.fill();
      ctx.fillStyle = charge ? '#ff3b2f' : '#111'; rr(ctx, -r * 0.45, -r * 2.42, r * 0.9, r * 0.13, 3); ctx.fill(); if (charge) { ctx.fillStyle = 'rgba(255,60,40,0.45)'; rr(ctx, -r * 0.5, -r * 2.5, r * 1.0, r * 0.3, 4); ctx.fill(); }
      ctx.strokeStyle = dark; ctx.lineWidth = 1; for (const sx of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(sx * r, -r * 2.25); ctx.lineTo(sx * r, -r * 1.85); ctx.stroke(); }
      const plume = gold ? '#ffd54a' : type === 'chevalier_rouge' ? '#e53935' : type === 'chevalier_bleu' ? '#3f84ff' : '#8a929c'; ctx.fillStyle = plume; ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 2.75); ctx.quadraticCurveTo(-r * 0.2, -r * 3.4 + Math.sin(t * 6) * r * 0.05, -r * 0.75, -r * 3.25); ctx.quadraticCurveTo(-r * 0.3, -r * 3.05, r * 0.1, -r * 2.75); ctx.closePath(); ctx.fill(); ctx.fillStyle = trim; rr(ctx, -r * 0.14, -r * 2.85, r * 0.28, r * 0.14, 2); ctx.fill();
      if (gold) { ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const a = t * 2 + i * TAU / 4, sx = Math.cos(a) * r * 1.3, sy = -r * 1.4 + Math.sin(a) * r * 0.9, s2 = r * (0.08 + 0.05 * Math.sin(t * 9 + i)); ctx.beginPath(); ctx.moveTo(sx, sy - s2); ctx.lineTo(sx + s2 * 0.3, sy); ctx.lineTo(sx, sy + s2); ctx.lineTo(sx - s2 * 0.3, sy); ctx.closePath(); ctx.fill(); } }
      ctx.restore();
    } else if (type === 'lapin') {
      // lapin maléfique : boule blanche, grandes oreilles, yeux rouges et dents ; essoufflé (oreilles tombantes, langue,
      // gouttes), ou apprivoisé par une carotte (rose, yeux doux, cœurs). En charge : étiré, traînées derrière.
      const tired = o.state === 'tired', eat = o.state === 'eat', charge = o.state === 'charge', tame = !!o.tame;
      const body = hurt > 0 && Math.floor(t * 30) % 2 ? '#ffffff' : (tame ? '#fbe4ee' : col), dk = shade(body, 0.82), pink = '#ff8fab';
      const sx = charge ? 1.3 : tired ? 1.12 : 1 + 0.04 * Math.sin(t * 6), sy = charge ? 0.8 : tired ? 0.88 : 1 - 0.04 * Math.sin(t * 6);
      if (charge) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1.5, r * 0.06); for (let i = 0; i < 3; i++) { const y = -r * (0.4 + i * 0.4), L = r * (1 + ((t * 40 + i * 5) % 4) / 4); ctx.beginPath(); ctx.moveTo(-r * 0.9, y); ctx.lineTo(-r * 0.9 - L, y); ctx.stroke(); } }
      ctx.save(); ctx.scale(sx, sy);
      for (const sgn of [-1, 1]) { ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(sgn * r * 0.5, -r * 0.08, r * 0.42, r * 0.2, 0, 0, TAU); ctx.fill(); }   // grands pieds
      ctx.fillStyle = body; circle(ctx, -r * 0.8, -r * 0.55, r * 0.26); ctx.fill();   // queue en pompon
      const g = ctx.createRadialGradient(-r * 0.3, -r * 1.0, r * 0.1, 0, -r * 0.75, r * 1.1); g.addColorStop(0, shade(body, 1.08)); g.addColorStop(1, dk); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.75, r * 0.95, r * 0.75, 0, 0, TAU); ctx.fill();
      // oreilles : droites et nerveuses, ou tombantes
      for (const sgn of [-1, 1]) { const droop = tired || tame ? 1.0 + sgn * 0.15 : 0.15 * sgn + Math.sin(t * 7 + sgn) * 0.08; ctx.save(); ctx.translate(sgn * r * 0.32, -r * 1.35); ctx.rotate(sgn * droop); ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 0.2, r * 0.6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = pink; ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 0.1, r * 0.42, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = body; circle(ctx, r * 0.15, -r * 1.3, r * 0.6); ctx.fill();   // tête
      ctx.fillStyle = pink; ctx.beginPath(); ctx.ellipse(r * 0.42, -r * 1.22, r * 0.1, r * 0.07, 0, 0, TAU); ctx.fill();   // museau
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; for (const sgn of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(r * 0.42, -r * 1.2); ctx.lineTo(r * (0.42 + sgn * 0.45), -r * (1.1 + i * 0.15)); ctx.stroke(); }
      if (tired) { ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1.5, r * 0.06); for (const ex of [-0.05, 0.4]) { ctx.beginPath(); ctx.moveTo(r * (ex - 0.1), -r * 1.5); ctx.lineTo(r * (ex + 0.1), -r * 1.35); ctx.moveTo(r * (ex + 0.1), -r * 1.5); ctx.lineTo(r * (ex - 0.1), -r * 1.35); ctx.stroke(); } ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.ellipse(r * 0.42, -r * 1.02 + Math.sin(t * 12) * r * 0.03, r * 0.1, r * 0.16, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7fc8ff'; for (let i = 0; i < 2; i++) { const u = (t * 0.8 + i * 0.5) % 1; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.ellipse(r * (0.75 + i * 0.2), -r * 1.7 + u * r * 0.6, r * 0.06, r * 0.1, 0, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
      else if (tame) { ctx.fillStyle = '#111'; for (const ex of [-0.05, 0.4]) { circle(ctx, r * ex, -r * 1.42, r * 0.09); ctx.fill(); } ctx.fillStyle = '#fff'; for (const ex of [-0.05, 0.4]) { circle(ctx, r * (ex + 0.03), -r * 1.46, r * 0.035); ctx.fill(); } ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r * 0.42, -r * 1.12, r * 0.12, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.fillStyle = '#ffb3c6'; for (const ex of [-0.25, 0.6]) { circle(ctx, r * ex, -r * 1.25, r * 0.09); ctx.fill(); } }
      else { ctx.fillStyle = '#ff2a2a'; for (const ex of [-0.05, 0.4]) { ctx.beginPath(); ctx.ellipse(r * ex, -r * 1.42, r * 0.11, r * 0.09, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#111'; for (const ex of [-0.05, 0.4]) { circle(ctx, r * (ex + 0.03), -r * 1.42, r * 0.04); ctx.fill(); } ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1.5, r * 0.07); for (const [ex, sgn] of [[-0.05, -1], [0.4, 1]]) { ctx.beginPath(); ctx.moveTo(r * (ex - sgn * 0.14), -r * 1.62); ctx.lineTo(r * (ex + sgn * 0.14), -r * 1.52); ctx.stroke(); }
        ctx.fillStyle = '#fff'; for (const tx of [0.34, 0.46]) rr(ctx, r * tx, -r * 1.12, r * 0.1, r * (charge ? 0.22 : 0.16), 1); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 1.12); ctx.lineTo(r * 0.6, -r * 1.12); ctx.stroke(); }
      if (eat) { ctx.save(); ctx.translate(r * 0.6, -r * 1.05 + Math.abs(Math.sin(t * 14)) * r * 0.05); ctx.rotate(0.6); S.drawCarrot(ctx, 0, 0, r * 0.9, 0); ctx.restore(); }
      ctx.restore();
    } else if (type === 'serpent') {
      // serpent venimeux : corps qui ondule (anneaux de plus en plus petits vers la queue), losanges sombres, tête plate,
      // yeux jaunes à pupille fendue, langue fourchue qui sort et rentre
      const seg = 7, body = hurt > 0 && Math.floor(t * 30) % 2 ? '#ffffff' : col, dk = shade(body, 0.6);
      for (let i = seg - 1; i >= 0; i--) { const u = i / (seg - 1), x = r * (0.7 - u * 1.9), y = -r * 0.28 + Math.sin(t * 9 - i * 0.9) * r * 0.18, rad = r * (0.34 - u * 0.2); ctx.fillStyle = body; circle(ctx, x, y, rad); ctx.fill(); ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(x, y - rad * 0.9); ctx.lineTo(x + rad * 0.45, y - rad * 0.3); ctx.lineTo(x, y + rad * 0.3); ctx.lineTo(x - rad * 0.45, y - rad * 0.3); ctx.closePath(); ctx.fill(); }
      const hx = r * 0.95, hy = -r * 0.32 + Math.sin(t * 9) * r * 0.12; ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(hx, hy, r * 0.5, r * 0.36, 0, 0, TAU); ctx.fill(); ctx.fillStyle = shade(body, 1.25); ctx.beginPath(); ctx.ellipse(hx + r * 0.05, hy + r * 0.12, r * 0.4, r * 0.16, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe066'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + r * 0.1, hy - r * 0.08 + sgn * r * 0.16, r * 0.12, r * 0.1, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#111'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + r * 0.13, hy - r * 0.08 + sgn * r * 0.16, r * 0.03, r * 0.09, 0, 0, TAU); ctx.fill(); }
      const tongue = Math.max(0, Math.sin(t * 7)) * r * 0.5; if (tongue > 0.05) { ctx.strokeStyle = '#ff2a4a'; ctx.lineWidth = Math.max(1, r * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + r * 0.5, hy); ctx.lineTo(hx + r * 0.5 + tongue, hy); ctx.lineTo(hx + r * 0.5 + tongue + r * 0.12, hy - r * 0.1); ctx.moveTo(hx + r * 0.5 + tongue, hy); ctx.lineTo(hx + r * 0.5 + tongue + r * 0.12, hy + r * 0.1); ctx.stroke(); }
      ctx.fillStyle = shade(body, 0.5); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(hx - r * 0.2 + i * r * 0.14, hy - r * 0.34); ctx.lineTo(hx - r * 0.14 + i * r * 0.14, hy - r * 0.42); ctx.lineTo(hx - r * 0.08 + i * r * 0.14, hy - r * 0.34); ctx.closePath(); ctx.fill(); }
    } else if (type === 'orque') {
      // orque : trapu, vert, plastron de métal rivé, épaulières à pointes, défenses, yeux rouges ; épée qu'il abat sans arrêt
      const swing = o.swing || 0, chase = !!o.chasing, skin = hurt > 0 && Math.floor(t * 30) % 2 ? '#ffffff' : col, dk = shade(skin, 0.7), step = chase ? Math.sin(t * 16) : Math.sin(t * 4) * 0.3;
      for (const sgn of [-1, 1]) { ctx.fillStyle = '#3e2a1a'; rr(ctx, sgn * r * 0.4 - r * 0.24, -r * 0.7 + sgn * step * r * 0.12, r * 0.48, r * 0.7, r * 0.12); ctx.fill(); ctx.fillStyle = '#2a1c10'; rr(ctx, sgn * r * 0.4 - r * 0.3, -r * 0.2 + sgn * step * r * 0.12, r * 0.6, r * 0.2, r * 0.08); ctx.fill(); }
      ctx.fillStyle = skin; rr(ctx, -r * 0.95, -r * 1.9, r * 1.9, r * 1.35, r * 0.4); ctx.fill();   // torse massif
      ctx.fillStyle = '#8d8d96'; rr(ctx, -r * 0.7, -r * 1.75, r * 1.4, r * 0.95, r * 0.2); ctx.fill(); ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 1.5; rr(ctx, -r * 0.7, -r * 1.75, r * 1.4, r * 0.95, r * 0.2); ctx.stroke(); ctx.fillStyle = '#5a5a62'; for (const [x, y] of [[-0.5, -1.6], [0.5, -1.6], [-0.5, -1.0], [0.5, -1.0]]) { circle(ctx, x * r, y * r, r * 0.06); ctx.fill(); }   // plastron rivé
      ctx.fillStyle = '#3a2a1a'; rr(ctx, -r * 0.95, -r * 0.75, r * 1.9, r * 0.2, 3); ctx.fill(); ctx.fillStyle = '#c9a24a'; rr(ctx, -r * 0.12, -r * 0.77, r * 0.24, r * 0.24, 3); ctx.fill();
      for (const sgn of [-1, 1]) { ctx.fillStyle = '#6f6f78'; ctx.beginPath(); ctx.ellipse(sgn * r * 0.95, -r * 1.75, r * 0.4, r * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9d9e0'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.95 + i * r * 0.2 - r * 0.06, -r * 1.95); ctx.lineTo(sgn * r * 0.95 + i * r * 0.2, -r * 2.25); ctx.lineTo(sgn * r * 0.95 + i * r * 0.2 + r * 0.06, -r * 1.95); ctx.closePath(); ctx.fill(); } }   // épaulières à pointes
      ctx.fillStyle = skin; circle(ctx, 0, -r * 2.3, r * 0.6); ctx.fill(); ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(0, -r * 2.0, r * 0.45, r * 0.2, 0, 0, TAU); ctx.fill();   // tête et mâchoire
      ctx.fillStyle = '#5a0a0a'; ctx.beginPath(); ctx.ellipse(0, -r * 2.02, r * 0.3, chase ? r * 0.14 : r * 0.07, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4f0e6'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.28, -r * 2.0); ctx.lineTo(sgn * r * 0.2, -r * 2.3); ctx.lineTo(sgn * r * 0.12, -r * 2.0); ctx.closePath(); ctx.fill(); }   // défenses
      ctx.fillStyle = '#ff2a2a'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.22, -r * 2.45, r * 0.09); ctx.fill(); } ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1.5, r * 0.07); for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.4, -r * 2.68); ctx.lineTo(sgn * r * 0.1, -r * 2.58); ctx.stroke(); }
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.moveTo(-r * 0.15, -r * 2.85); ctx.quadraticCurveTo(0, -r * 3.3, r * 0.2, -r * 2.85); ctx.closePath(); ctx.fill();   // touffe
      ctx.save(); ctx.translate(r * 1.05, -r * 1.45); ctx.rotate(-1.3 + (1 - swing) * 1.9 * (chase ? 1 : 0.3)); ctx.fillStyle = '#5a3a1a'; rr(ctx, -r * 0.07, -r * 0.05, r * 0.14, r * 0.4, 2); ctx.fill(); ctx.fillStyle = '#3a3f48'; rr(ctx, -r * 0.3, -r * 0.12, r * 0.6, r * 0.12, 2); ctx.fill(); ctx.fillStyle = '#b8c0c9'; ctx.beginPath(); ctx.moveTo(-r * 0.14, -r * 0.12); ctx.lineTo(r * 0.14, -r * 0.12); ctx.lineTo(r * 0.2, -r * 1.1); ctx.lineTo(-r * 0.05, -r * 1.35); ctx.lineTo(-r * 0.14, -r * 1.1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#5a6270'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();   // épée large
      if (swing > 0.5) { ctx.strokeStyle = 'rgba(255,255,255,' + ((swing - 0.5) * 1.4) + ')'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.beginPath(); ctx.arc(r * 1.05, -r * 1.45, r * 1.2, -1.4, 0.4); ctx.stroke(); }
    } else if (type === 'shaman') {
      // shaman orque : robe en lambeaux, collier d'os, masque de bois peint à plumes, bâton à crâne dont l'orbe verte
      // brille quand il lance un sort ; quand il soigne, un anneau vert monte autour de lui
      const cast = o.cast || 0, heal = o.heal || 0, skin = hurt > 0 && Math.floor(t * 30) % 2 ? '#ffffff' : col, bob = Math.sin(t * 2.5) * r * 0.06;
      if (heal > 0) { ctx.strokeStyle = 'rgba(140,255,140,' + heal * 0.8 + ')'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.ellipse(0, -r * (1 - heal) * 2.4, r * (1.2 + heal * 0.4), r * 0.4, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(140,255,140,' + heal + ')'; for (let i = 0; i < 3; i++) { const x = (i - 1) * r * 0.8, y = -r * 1.5 - heal * r * 1.2 - i * r * 0.2; rr(ctx, x - r * 0.04, y - r * 0.14, r * 0.08, r * 0.28, 1); ctx.fill(); rr(ctx, x - r * 0.14, y - r * 0.04, r * 0.28, r * 0.08, 1); ctx.fill(); } }
      ctx.save(); ctx.translate(0, -bob);
      const g = ctx.createLinearGradient(0, -r * 1.9, 0, 0); g.addColorStop(0, '#5a3a1a'); g.addColorStop(1, '#2e1c0c'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 1.9); ctx.lineTo(r * 0.45, -r * 1.9); ctx.lineTo(r * 0.95, 0); for (let i = 0; i < 6; i++) ctx.lineTo(r * (0.95 - (i + 0.5) * 0.317), i % 2 ? 0 : -r * 0.22); ctx.lineTo(-r * 0.95, 0); ctx.closePath(); ctx.fill();   // robe en lambeaux
      ctx.fillStyle = skin; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sgn * r * 0.75, -r * 1.5, r * 0.22, r * 0.3, 0, 0, TAU); ctx.fill(); }   // épaules
      ctx.fillStyle = '#f4f0e6'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * r * 0.2, -r * 1.55 + Math.abs(i) * r * 0.08, r * 0.07, r * 0.12, 0, 0, TAU); ctx.fill(); }   // collier d'os
      ctx.fillStyle = skin; circle(ctx, 0, -r * 2.15, r * 0.55); ctx.fill();
      ctx.fillStyle = '#8a5a2a'; rr(ctx, -r * 0.5, -r * 2.6, r * 1.0, r * 0.8, r * 0.3); ctx.fill(); ctx.fillStyle = '#f4f0e6'; rr(ctx, -r * 0.4, -r * 2.35, r * 0.8, r * 0.08, 1); ctx.fill(); rr(ctx, -r * 0.05, -r * 2.55, r * 0.1, r * 0.6, 1); ctx.fill();   // masque peint
      ctx.fillStyle = '#7ef05a'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sgn * r * 0.22, -r * 2.3, r * 0.11, r * 0.08, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#111'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.22, -r * 2.3, r * 0.04); ctx.fill(); }
      [['#e53935', -0.35, -0.4], ['#ffd54a', 0, -0.1], ['#3f84ff', 0.35, 0.4]].forEach(([c2, x, a]) => { ctx.save(); ctx.translate(x * r, -r * 2.6); ctx.rotate(a + Math.sin(t * 3 + x) * 0.06); ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(0, -r * 0.45, r * 0.12, r * 0.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.9); ctx.stroke(); ctx.restore(); });   // plumes
      ctx.save(); ctx.translate(r * 0.85, -r * 0.2); ctx.rotate(-0.15 - cast * 0.35); ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2.5, r * 0.1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 2.4); ctx.stroke(); ctx.fillStyle = '#f4f0e6'; circle(ctx, 0, -r * 2.45, r * 0.2); ctx.fill(); ctx.fillStyle = '#111'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.07, -r * 2.48, r * 0.045); ctx.fill(); }
      const orb = ctx.createRadialGradient(0, -r * 2.85, 0, 0, -r * 2.85, r * (0.3 + cast * 0.35)); orb.addColorStop(0, 'rgba(230,255,200,0.95)'); orb.addColorStop(0.4, 'rgba(126,240,90,0.85)'); orb.addColorStop(1, 'rgba(126,240,90,0)'); ctx.fillStyle = orb; circle(ctx, 0, -r * 2.85, r * (0.3 + cast * 0.35)); ctx.fill(); ctx.restore();
      ctx.restore();
    } else if (type === 'crapaud') {
      const full=Math.max(0,Math.min(1,o.bellyFill??(o.swallowed?1:0)));
      const kick=Math.max(0,Math.min(1,(o.bellyKick||0)/.32)),wave=Math.cos((1-kick)*Math.PI*3)*kick,side=o.bellySide||1;
      const sq = o.squash || 0, w = r * (1 + sq * .25+full*.32+wave*.06), h = r * (1.1 - sq * .3+full*.18);
      ctx.translate(side*wave*r*.07,-Math.abs(wave)*r*.035);
      ctx.fillStyle = shade(col, 0.7); ctx.beginPath(); ctx.ellipse(0, 0, w * 1.15, r * 0.35, 0, 0, TAU); ctx.fill();   // ventre/pattes
      for (const sgn of [-1, 1]) { ctx.fillStyle = shade(col, 0.9); ctx.beginPath(); ctx.ellipse(sgn * w * 0.95, -r * 0.1, r * 0.35, r * 0.22, 0, 0, TAU); ctx.fill(); }
      const g = ctx.createRadialGradient(-w * 0.3, -h * 0.9, r * 0.1, 0, -h * 0.6, h * 1.2); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, col);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -h * 0.65, w, h * 0.75, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e9f0b8'; ctx.beginPath(); ctx.ellipse(side*wave*r*.14, -h * .36, w * (.6+full*.18)+wave*r*.08, h * (.35+full*.24)-wave*r*.045, side*wave*.1, 0, TAU); ctx.fill();
      if(full>0){ctx.save();ctx.globalAlpha=full*.4;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(-w*.24+side*wave*r*.14,-h*.52,w*.16,h*.09,-.3,0,TAU);ctx.fill();ctx.restore();}
      for (const sgn of [-1, 1]) { ctx.fillStyle = col; circle(ctx, sgn * w * 0.45, -h * 1.3, r * 0.26); ctx.fill(); ctx.fillStyle = '#fff'; circle(ctx, sgn * w * 0.45, -h * 1.3, r * 0.19); ctx.fill(); ctx.fillStyle = '#111'; circle(ctx, sgn * w * 0.45 + (o.lookX || 0) * r * 0.06, -h * 1.3, r * 0.09); ctx.fill(); }
      if(!o.swallowed&&o.toadAttack==='swallow'){ctx.fillStyle='#3e2943';ctx.beginPath();ctx.ellipse(0,-h*.55,w*.4,h*.28,0,0,TAU);ctx.fill();}
      ctx.strokeStyle = '#3f5a1c'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.beginPath(); ctx.arc(0, -h * 0.8, w * 0.5, 0.2, Math.PI - 0.2); ctx.stroke();
    } else if (type === 'cogneur') {
      // trapu, casque, gros marteau de bois qu'il lève puis abat
      const wind = o.wind || 0, ang = o.state === 'rest' ? 1.1 : -1.3 * wind;
      ctx.fillStyle = shade(col, 0.75); for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sgn * r * 0.45, -r * 0.1, r * 0.3, r * 0.2, 0, 0, TAU); ctx.fill(); }
      const g = ctx.createRadialGradient(-r * 0.3, -r * 1.1, r * 0.1, 0, -r * 0.8, r * 1.1); g.addColorStop(0, shade(col, 1.25)); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.8, r * 0.95, r * 0.85, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6f7883'; ctx.beginPath(); ctx.ellipse(0, -r * 1.35, r * 0.8, r * 0.45, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#8f98a3'; rr(ctx, -r * 0.85, -r * 1.4, r * 1.7, r * 0.14, r * 0.05); ctx.fill();
      face(ctx, 0, -r * 0.85, r * 0.8, t, 'grumpy');
      ctx.save(); ctx.translate(r * 0.7, -r * 0.9); ctx.rotate(ang); ctx.fillStyle = '#6b4a2a'; rr(ctx, 0, -r * 0.08, r * 1.3, r * 0.16, r * 0.05); ctx.fill(); ctx.fillStyle = '#7a8794'; rr(ctx, r * 1.05, -r * 0.45, r * 0.55, r * 0.9, r * 0.08); ctx.fill(); ctx.strokeStyle = '#4a515a'; ctx.lineWidth = 1.5; rr(ctx, r * 1.05, -r * 0.45, r * 0.55, r * 0.9, r * 0.08); ctx.stroke(); ctx.restore();
    } else if (type === 'cracheur') {
      // boule orange, crête de flammes, grande bouche qui crache
      const rec = o.recoil || 0; for (let i = 0; i < 3; i++) { const fx = (i - 1) * r * 0.35, fh = r * (0.45 + 0.15 * Math.sin(t * 9 + i)); const g = ctx.createLinearGradient(0, -r * 1.7, 0, -r * 1.7 - fh); g.addColorStop(0, '#ff8a1f'); g.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - r * 0.15, -r * 1.6); ctx.quadraticCurveTo(fx + Math.sin(t * 7 + i) * r * 0.1, -r * 1.7 - fh * 0.6, fx, -r * 1.7 - fh); ctx.quadraticCurveTo(fx + r * 0.1, -r * 1.7 - fh * 0.5, fx + r * 0.15, -r * 1.6); ctx.closePath(); ctx.fill(); }
      const g = ctx.createRadialGradient(-r * 0.3, -r * 1.2, r * 0.1, 0, -r * 0.95, r * 1.05); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.95, r * 0.95 * (1 + rec * 0.1), r * 0.95, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sgn * r * 0.35, -r * 1.3, r * 0.2, r * 0.24, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#111'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.35 + r * 0.05, -r * 1.28, r * 0.1); ctx.fill(); }
      ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1, r * 0.06); for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.55, -r * 1.62); ctx.lineTo(sgn * r * 0.18, -r * 1.5); ctx.stroke(); }
      ctx.fillStyle = '#3a0a0a'; ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 0.65, r * 0.45 + rec * r * 0.1, r * 0.3 + rec * r * 0.15, 0, 0, TAU); ctx.fill();
      if (rec > 0.5) { const gg = ctx.createRadialGradient(r * 0.1, -r * 0.65, 0, r * 0.1, -r * 0.65, r * 0.5); gg.addColorStop(0, 'rgba(255,240,150,0.95)'); gg.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = gg; circle(ctx, r * 0.1, -r * 0.65, r * 0.5); ctx.fill(); }
      ctx.fillStyle = '#fff'; for (const sx of [-0.25, -0.05, 0.25]) { ctx.beginPath(); ctx.moveTo(sx * r + r * 0.1, -r * 0.9); ctx.lineTo(sx * r + r * 0.18, -r * 0.7); ctx.lineTo(sx * r + r * 0.26, -r * 0.9); ctx.closePath(); ctx.fill(); }
    } else if (type === 'glaceur') {
      // cristal de glace à pointes, visage renfrogné, reflet qui brille
      const rec = o.recoil || 0, pts = [[0, -2.2], [0.75, -1.7], [0.95, -0.8], [0.6, 0], [-0.6, 0], [-0.95, -0.8], [-0.75, -1.7]];
      ctx.fillStyle = shade(col, 0.7); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(-r, -r * 2, r, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, 0.8)); ctx.fillStyle = g; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x * r * 0.88, y * r * 0.92 - r * 0.05) : ctx.moveTo(x * r * 0.88, y * r * 0.92 - r * 0.05)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8fbff'; for (const [x, y, s2] of [[-0.6, -2.0, 0.35], [0.5, -2.1, 0.3], [0.95, -1.3, 0.25]]) { ctx.beginPath(); ctx.moveTo(x * r, y * r); ctx.lineTo(x * r - s2 * r * 0.4, y * r + s2 * r * 0.8); ctx.lineTo(x * r + s2 * r * 0.4, y * r + s2 * r * 0.8); ctx.closePath(); ctx.fill(); }
      face(ctx, 0, -r * 0.95, r * 0.75, t, 'grumpy');
      if (rec > 0.5) { ctx.fillStyle = 'rgba(255,255,255,' + (rec - 0.5) + ')'; circle(ctx, 0, -r * 0.6, r * 0.5 * rec); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 1.75); ctx.lineTo(-r * 0.35, -r * 2.0); ctx.stroke();
    } else if (type === 'magicien') {
      // robe mauve, chapeau pointu étoilé, baguette qui brille quand il lance un sort ; il flotte un peu
      const bob = Math.sin(t * 2.5) * r * 0.12, cast = o.cast || 0; ctx.translate(0, -bob);
      const g = ctx.createLinearGradient(0, -r * 1.6, 0, 0); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, shade(col, 0.7)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 1.5); ctx.lineTo(r * 0.3, -r * 1.5); ctx.lineTo(r * 0.95, 0); ctx.lineTo(-r * 0.95, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd54a'; for (const [x, y] of [[-0.35, -0.5], [0.3, -0.9], [0.1, -0.25]]) { const px = x * r, py = y * r, s2 = r * 0.1; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? s2 * 0.45 : s2; ctx.lineTo(px + Math.cos(a) * rad, py + Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#f4d3b0'; circle(ctx, 0, -r * 1.55, r * 0.42); ctx.fill(); face(ctx, 0, -r * 1.55, r * 0.5, t, 'smile');
      ctx.fillStyle = shade(col, 0.85); ctx.beginPath(); ctx.ellipse(0, -r * 1.85, r * 0.75, r * 0.16, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 1.85); ctx.lineTo(r * 0.45, -r * 1.85); ctx.lineTo(r * 0.15, -r * 2.75); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd54a'; circle(ctx, r * 0.05, -r * 2.2, r * 0.07); ctx.fill(); circle(ctx, -r * 0.15, -r * 2.0, r * 0.05); ctx.fill();
      ctx.save(); ctx.translate(r * 0.7, -r * 1.0); ctx.rotate(-0.6 - cast * 0.6); ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.9, 0); ctx.stroke(); const gg = ctx.createRadialGradient(r * 0.95, 0, 0, r * 0.95, 0, r * (0.25 + cast * 0.3)); gg.addColorStop(0, 'rgba(255,255,255,0.95)'); gg.addColorStop(0.4, 'rgba(217,166,255,0.8)'); gg.addColorStop(1, 'rgba(217,166,255,0)'); ctx.fillStyle = gg; circle(ctx, r * 0.95, 0, r * (0.25 + cast * 0.3)); ctx.fill(); ctx.restore();
    } else if (type === 'taupe') {
      if (o.state === 'hidden') {   // bosse de terre qui bouge
        ctx.fillStyle = '#7d5428'; ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 1.0, r * 0.45, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a6a35'; ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.25, r * 0.6, r * 0.25, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(40,25,10,0.5)'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo((i - 1) * r * 0.5, -r * 0.15); ctx.lineTo((i - 1) * r * 0.5 + r * 0.2, r * 0.1); ctx.stroke(); }
      } else {
        const g = ctx.createRadialGradient(-r * 0.3, -r * 1.0, r * 0.1, 0, -r * 0.75, r * 1.0); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.75, r * 0.85, r * 0.9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f4f4f4'; for (const sgn of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sgn * r * (0.55 + i * 0.15), -r * 0.4); ctx.lineTo(sgn * r * (0.6 + i * 0.15), -r * 0.05); ctx.lineTo(sgn * r * (0.7 + i * 0.15), -r * 0.4); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.ellipse(r * 0.05, -r * 0.95, r * 0.22, r * 0.17, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1, r * 0.06); for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.45, -r * 1.25); ctx.lineTo(sgn * r * 0.2, -r * 1.2); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; for (const sgn of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.2, -r * (0.9 + i * 0.1)); ctx.lineTo(sgn * r * 0.9, -r * (0.85 + i * 0.2)); ctx.stroke(); }
      }
    } else if (type === 'guepe' || type === 'abeille') {
      // corps rayé jaune et noir, ailes qui battent vite, dard
      const wf = Math.sin(t * 40); ctx.fillStyle = 'rgba(255,255,255,0.65)'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sgn * r * 0.5, -r * 1.3 + wf * r * 0.1, r * 0.6, r * 0.25, sgn * (0.5 + wf * 0.3), 0, TAU); ctx.fill(); }
      const g = ctx.createRadialGradient(-r * 0.2, -r * 0.9, r * 0.1, 0, -r * 0.7, r * 1.0); g.addColorStop(0, shade(col, 1.2)); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.7, r * 1.0, r * 0.6, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, -r * 0.7, r * 1.0, r * 0.6, 0, 0, TAU); ctx.clip(); ctx.fillStyle = '#222'; for (const sx of [-0.45, -0.05, 0.35]) ctx.fillRect(sx * r, -r * 1.4, r * 0.2, r * 1.4); ctx.restore();
      ctx.fillStyle = '#222'; circle(ctx, r * 1.0, -r * 0.8, r * 0.38); ctx.fill(); ctx.fillStyle = '#fff'; circle(ctx, r * 1.1, -r * 0.9, r * 0.14); ctx.fill(); ctx.fillStyle = '#111'; circle(ctx, r * 1.14, -r * 0.9, r * 0.07); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.moveTo(-r * 0.95, -r * 0.75); ctx.lineTo(-r * 1.4, -r * 0.6); ctx.lineTo(-r * 0.95, -r * 0.55); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1, r * 0.05); for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * 1.1, -r * 1.1); ctx.quadraticCurveTo(r * (1.2 + sgn * 0.15), -r * 1.5, r * (1.35 + sgn * 0.2), -r * 1.55); ctx.stroke(); }
    } else if (type === 'plante') {
      // feuilles au sol ; la tige et la tête rouge à dents sortent du sol selon « up »
      const up = o.up == null ? 1 : o.up, bite = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.fillStyle = '#2f8a3a'; for (const a of [0.3, 1.2, 1.9, 2.8]) { ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.55, -r * 0.05 + Math.sin(a) * r * 0.15, r * 0.45, r * 0.18, a, 0, TAU); ctx.fill(); }
      if (up > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(-r * 2, -r * 4, r * 4, r * 4 - r * 0.1); ctx.clip(); ctx.translate(0, r * 2.2 * (1 - up));
        ctx.strokeStyle = '#3fae4a'; ctx.lineWidth = Math.max(3, r * 0.22); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.2, -r * 0.8, 0, -r * 1.5); ctx.stroke();
        ctx.fillStyle = '#3fae4a'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.8, r * 0.35, r * 0.14, -0.5, 0, TAU); ctx.fill();
        const g = ctx.createRadialGradient(-r * 0.25, -r * 2.1, r * 0.1, 0, -r * 1.9, r * 0.9); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, col); ctx.fillStyle = g; circle(ctx, 0, -r * 1.9, r * 0.75); ctx.fill();
        ctx.fillStyle = '#fff'; for (const [x, y] of [[-0.35, -2.3], [0.3, -2.4], [0.45, -1.8], [-0.1, -2.6]]) { circle(ctx, x * r, y * r, r * 0.1); ctx.fill(); }
        ctx.fillStyle = '#5a0a0a'; ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 1.75, r * 0.5, r * 0.18 + bite * r * 0.22, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; for (const sx of [-0.3, -0.1, 0.1, 0.3]) { ctx.beginPath(); ctx.moveTo(sx * r + r * 0.05, -r * 1.93 - bite * r * 0.2); ctx.lineTo(sx * r + r * 0.12, -r * 1.75); ctx.lineTo(sx * r + r * 0.19, -r * 1.93 - bite * r * 0.2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx * r + r * 0.05, -r * 1.57 + bite * r * 0.2); ctx.lineTo(sx * r + r * 0.12, -r * 1.75); ctx.lineTo(sx * r + r * 0.19, -r * 1.57 + bite * r * 0.2); ctx.closePath(); ctx.fill(); }
        ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 1.75, r * 0.5, r * 0.18 + bite * r * 0.22, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    } else if (type === 'squelette' || type === 'squelette_rouge' || type === 'squelette_noir') {
      // crâne, cage thoracique, bras et jambes en bâtons ; teinte selon la variante, yeux rouges pour le noir
      const bone = hurt > 0 && Math.floor(t * 30) % 2 ? '#ffffff' : (type === 'squelette' ? '#f4f0e6' : type === 'squelette_rouge' ? '#e04a3a' : '#3a3a44'), dark = shade(bone, 0.6), bob = Math.sin(t * 6) * r * 0.05;
      ctx.translate(0, -bob); ctx.strokeStyle = bone; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, r * 0.13);
      for (const sgn of [-1, 1]) { const sw = Math.sin(t * 8 + (sgn > 0 ? 0 : Math.PI)) * r * 0.2; ctx.beginPath(); ctx.moveTo(sgn * r * 0.25, -r * 0.65); ctx.lineTo(sgn * r * 0.3 + sw, 0); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(0, -r * 0.95, r * 0.45, r * 0.42, 0, 0, TAU); ctx.fillStyle = bone; ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1, r * 0.06); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, -r * (1.15 - i * 0.18), r * 0.4, r * 0.07, 0, 0, TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(0, -r * 1.35); ctx.lineTo(0, -r * 0.55); ctx.stroke();
      const armUp = o.bone ? -1.1 : 0.4, sw2 = o.bone ? 0 : Math.sin(t * 8) * 0.4; ctx.strokeStyle = bone; ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 1.2); ctx.lineTo(-r * 0.8, -r * 0.7 + sw2 * r); ctx.stroke(); ctx.beginPath(); ctx.moveTo(r * 0.4, -r * 1.2); ctx.lineTo(r * 0.9, -r * 1.2 + armUp * r * 0.5); ctx.stroke();
      ctx.fillStyle = bone; circle(ctx, 0, -r * 1.75, r * 0.5); ctx.fill(); ctx.fillStyle = dark; rr(ctx, -r * 0.32, -r * 1.42, r * 0.64, r * 0.2, r * 0.05); ctx.fill(); ctx.strokeStyle = bone; ctx.lineWidth = 1.5; for (const sx of [-0.2, -0.07, 0.07, 0.2]) { ctx.beginPath(); ctx.moveTo(sx * r, -r * 1.42); ctx.lineTo(sx * r, -r * 1.24); ctx.stroke(); }
      ctx.fillStyle = type === 'squelette_noir' ? '#ff3b2f' : '#111'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sgn * r * 0.2, -r * 1.85, r * 0.13, r * 0.16, 0, 0, TAU); ctx.fill(); }
      if (type === 'squelette_noir') { ctx.fillStyle = 'rgba(255,60,40,0.35)'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.2, -r * 1.85, r * 0.25); ctx.fill(); } }
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(0, -r * 1.7); ctx.lineTo(-r * 0.06, -r * 1.58); ctx.lineTo(r * 0.06, -r * 1.58); ctx.closePath(); ctx.fill();
    } else if (type === 'lanceur') {
      // bloc de métal sombre avec une bouche ronde qui crache des fusées
      const w = r * 2.1, h = r * 2.0, rec = o.recoil || 0; ctx.translate(0, 0); ctx.scale(1 + rec * 0.08, 1 - rec * 0.08);
      ctx.fillStyle = shade(col, 0.7); rr(ctx, -w / 2, -h, w, h, r * 0.18); ctx.fill(); ctx.fillStyle = col; rr(ctx, -w / 2 + r * 0.08, -h + r * 0.08, w - r * 0.16, h - r * 0.2, r * 0.14); ctx.fill();
      ctx.fillStyle = shade(col, 1.35); rr(ctx, -w / 2 + r * 0.08, -h + r * 0.08, w - r * 0.16, r * 0.22, r * 0.1); ctx.fill();
      ctx.fillStyle = shade(col, 1.5); for (const [sx, sy] of [[-0.42, -0.9], [0.42, -0.9], [-0.42, -0.12], [0.42, -0.12]]) { circle(ctx, sx * w, sy * h, r * 0.07); ctx.fill(); }
      ctx.fillStyle = '#111'; circle(ctx, 0, -h * 0.42, r * 0.55); ctx.fill(); ctx.strokeStyle = shade(col, 1.6); ctx.lineWidth = Math.max(2, r * 0.1); circle(ctx, 0, -h * 0.42, r * 0.55); ctx.stroke();
      ctx.fillStyle = hurt > 0 ? '#fff' : '#ff8a1f'; circle(ctx, 0, -h * 0.42, r * 0.18 + rec * r * 0.25); ctx.fill();
      ctx.fillStyle = '#fff'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.22, -h * 0.85); ctx.lineTo(sgn * r * 0.72, -h * 0.98); ctx.lineTo(sgn * r * 0.72, -h * 0.78); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#111'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.55, -h * 0.86, r * 0.08); ctx.fill(); }
    } else if (type === 'marin') {
      // serpent de mer bleu-vert : corps dans l'eau (ou au sol), long cou en S, tête à gueule articulée tournée vers le héros ;
      // pendant la charge, une boule de poison grossit dans la gueule ouverte, puis elle en sort
      const aim = o.aim == null ? Math.PI / 2 : o.aim, dx = Math.cos(aim) < 0 ? -1 : 1, mouth = o.mouth || 0, charge = o.charge || 0;
      ctx.scale(flip, 1); ctx.translate(0, Math.sin(t * 2) * r * 0.06);
      const dark = shade(col, 0.7), belly = shade(col, 1.35);
      if (o.water) { ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; for (let i = 0; i < 2; i++) { const ph = (t * 0.6 + i * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(0, 0, r * (0.5 + ph * 0.6), r * (0.2 + ph * 0.25), 0, 0, TAU); ctx.stroke(); } ctx.globalAlpha = o.alpha != null ? o.alpha : 1; }
      // corps
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.8, r * 0.38, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.stroke();
      ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(0, r * 0.02, r * 0.55, r * 0.16, 0, 0, Math.PI); ctx.fill();
      // cou en S jusqu'à la tête
      const hx = dx * r * 0.45, hy = -r * 1.55, cx1 = -dx * r * 0.45, cy1 = -r * 0.9;
      const neck = () => { ctx.beginPath(); ctx.moveTo(0, -r * 0.2); ctx.quadraticCurveTo(cx1, cy1, hx, hy); };
      ctx.lineCap = 'round'; ctx.strokeStyle = dark; ctx.lineWidth = r * 0.56; neck(); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = r * 0.46; neck(); ctx.stroke(); ctx.strokeStyle = belly; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.moveTo(dx * r * 0.08, -r * 0.2); ctx.quadraticCurveTo(cx1 + dx * r * 0.1, cy1, hx + dx * r * 0.06, hy + r * 0.1); ctx.stroke();
      // nageoires dorsales le long du cou
      ctx.fillStyle = shade(col, 0.55); for (const u of [0.25, 0.5, 0.75]) { const px = (1 - u) * (1 - u) * 0 + 2 * (1 - u) * u * cx1 + u * u * hx, py = (1 - u) * (1 - u) * -r * 0.2 + 2 * (1 - u) * u * cy1 + u * u * hy; ctx.beginPath(); ctx.moveTo(px - dx * r * 0.2, py - r * 0.1); ctx.lineTo(px - dx * r * 0.55, py - r * 0.35); ctx.lineTo(px - dx * r * 0.18, py + r * 0.18); ctx.closePath(); ctx.fill(); }
      // tête
      ctx.save(); ctx.translate(hx, hy);
      ctx.fillStyle = shade(col, 0.55); ctx.beginPath(); ctx.moveTo(-dx * r * 0.1, -r * 0.3); ctx.lineTo(-dx * r * 0.05, -r * 0.8); ctx.lineTo(dx * r * 0.25, -r * 0.32); ctx.closePath(); ctx.fill();   // crête
      const inner = '#17352a';
      // mâchoire inférieure (pivote vers le bas selon « mouth »)
      ctx.save(); ctx.translate(dx * r * 0.05, r * 0.12); ctx.rotate(dx * mouth * 0.75);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-dx * r * 0.2, -r * 0.05); ctx.lineTo(dx * r * 0.78, -r * 0.02); ctx.quadraticCurveTo(dx * r * 0.8, r * 0.2, dx * r * 0.55, r * 0.24); ctx.lineTo(-dx * r * 0.2, r * 0.22); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1, r * 0.05); ctx.stroke();
      ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(-dx * r * 0.05, -r * 0.04); ctx.lineTo(dx * r * 0.72, -r * 0.01); ctx.lineTo(dx * r * 0.6, r * 0.08); ctx.lineTo(-dx * r * 0.02, r * 0.08); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; for (const u of [0.2, 0.4, 0.6]) { ctx.beginPath(); ctx.moveTo(dx * r * u, 0); ctx.lineTo(dx * r * (u + 0.06), -r * 0.14); ctx.lineTo(dx * r * (u + 0.12), 0); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      // boule de poison qui grossit dans la gueule
      if (charge > 0) { const br = r * 0.42 * charge; ctx.save(); ctx.translate(dx * r * 0.5, r * 0.18 + mouth * r * 0.12); const g = ctx.createRadialGradient(-br * 0.3, -br * 0.3, 0, 0, 0, br * 1.5); g.addColorStop(0, '#e9ffb0'); g.addColorStop(0.4, '#7ef05a'); g.addColorStop(0.8, 'rgba(60,170,40,0.9)'); g.addColorStop(1, 'rgba(60,200,40,0)'); ctx.fillStyle = g; circle(ctx, 0, 0, br * 1.5); ctx.fill(); ctx.fillStyle = '#5ad13a'; circle(ctx, 0, 0, br); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; circle(ctx, -br * 0.3, -br * 0.3, br * 0.3); ctx.fill(); ctx.restore(); }
      // crâne et mâchoire supérieure
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -r * 0.3); ctx.lineTo(dx * r * 0.8, -r * 0.12); ctx.quadraticCurveTo(dx * r * 0.85, r * 0.05, dx * r * 0.7, r * 0.1); ctx.lineTo(0, r * 0.14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1, r * 0.05); ctx.stroke();
      ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(dx * r * 0.1, r * 0.06); ctx.lineTo(dx * r * 0.72, r * 0.02); ctx.lineTo(dx * r * 0.7, r * 0.1); ctx.lineTo(dx * r * 0.08, r * 0.14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; for (const u of [0.25, 0.45, 0.65]) { ctx.beginPath(); ctx.moveTo(dx * r * u, r * 0.06); ctx.lineTo(dx * r * (u + 0.06), r * 0.2 + mouth * r * 0.02); ctx.lineTo(dx * r * (u + 0.12), r * 0.06); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#5ad13a'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.2 + dx * r * 0.05, -r * 0.5 + r * 0.32, r * 0.12 * (sgn === dx ? 1 : 0.8)); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(dx * r * 0.18, -r * 0.14, r * 0.15, r * 0.13, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#111'; circle(ctx, dx * r * 0.22, -r * 0.13, r * 0.07); ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.beginPath(); ctx.moveTo(dx * r * 0.02, -r * 0.34); ctx.lineTo(dx * r * 0.34, -r * 0.24); ctx.stroke();   // sourcil
      ctx.fillStyle = dark; circle(ctx, dx * r * 0.62, -r * 0.08, r * 0.04); ctx.fill();   // narine
      ctx.restore();
    } else if (type === 'canon' || type === 'canon_rouge' || type === 'canon_bleu') {
      // affût de bois sur deux roues, fût (noir, rouge ou bleu) qui pivote vers le héros ; il se gonfle avant de tirer
      const aim = o.aim == null ? -Math.PI / 2 : o.aim, rec = o.recoil || 0, sw = o.swell || 0; ctx.scale(flip, 1);   // annule le flip : l'angle gère l'orientation
      const ax = Math.cos(aim), ay = Math.sin(aim) * 0.6, len = r * 1.4 - rec * r * 0.25;
      if (sw > 0) { ctx.save(); ctx.translate(0, -r * 0.7); ctx.scale(1 + sw * 0.28, 1 + sw * 0.28); ctx.translate(0, r * 0.7); }
      ctx.fillStyle = '#3a2a1a'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.75, -r * 0.35, r * 0.4); ctx.fill(); } ctx.fillStyle = '#7a4f24'; for (const sgn of [-1, 1]) { circle(ctx, sgn * r * 0.75, -r * 0.35, r * 0.28); ctx.fill(); }
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(1.5, r * 0.08); for (const sgn of [-1, 1]) for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; ctx.beginPath(); ctx.moveTo(sgn * r * 0.75 - Math.cos(a) * r * 0.28, -r * 0.35 - Math.sin(a) * r * 0.28); ctx.lineTo(sgn * r * 0.75 + Math.cos(a) * r * 0.28, -r * 0.35 + Math.sin(a) * r * 0.28); ctx.stroke(); }
      ctx.fillStyle = '#a0703a'; ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.3); ctx.lineTo(r * 0.9, -r * 0.3); ctx.lineTo(r * 0.6, -r * 1.0); ctx.lineTo(-r * 0.6, -r * 1.0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.translate(0, -r * 0.95); const sa = Math.atan2(ay, ax); ctx.rotate(sa);
      ctx.fillStyle = hurt > 0 ? '#fff' : col; rr(ctx, -r * 0.35, -r * 0.3, len + r * 0.35, r * 0.6, r * 0.25); ctx.fill(); ctx.fillStyle = shade(col, 1.8); rr(ctx, len - r * 0.25, -r * 0.34, r * 0.25, r * 0.68, r * 0.1); ctx.fill(); ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.ellipse(len, 0, r * 0.1, r * 0.3, 0, 0, TAU); ctx.fill();
      if (rec > 0.6) { ctx.fillStyle = 'rgba(255,220,120,' + (rec - 0.6) * 2.5 + ')'; circle(ctx, len + r * 0.3, 0, r * 0.45 * rec); ctx.fill(); }
      if (sw > 0) { const gl = E.ball === 'fire' ? '255,120,40' : E.ball === 'blue' ? '120,180,255' : '255,220,120'; ctx.fillStyle = 'rgba(' + gl + ',' + (0.3 + sw * 0.6) + ')'; circle(ctx, len, 0, r * 0.12 + sw * r * 0.22); ctx.fill(); ctx.strokeStyle = 'rgba(' + gl + ',' + (0.8 * sw) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(len, 0, r * (0.3 + sw * 0.45), 0, TAU); ctx.stroke(); }
      ctx.restore(); if (sw > 0) ctx.restore();
      ctx.fillStyle = hurt > 0 ? '#fff' : col; circle(ctx, 0, -r * 0.95, r * 0.42); ctx.fill(); ctx.fillStyle = shade(col, 1.6); circle(ctx, -r * 0.12, -r * 1.05, r * 0.1); ctx.fill();
    } else if (type === 'golem') {
      if(o.inferno){ctx.strokeStyle='#ffb33e';ctx.lineWidth=r*.12;ctx.beginPath();ctx.arc(0,-r*1.3,r*1.8,0,TAU);ctx.stroke();}
      const stomp = o.stomp || 0, bw = r * 1.3, bh = r * 2.4;
      const rock = (x, y, w, h, c) => { ctx.fillStyle = c; rr(ctx, x - w / 2, y - h, w, h, w * 0.25); ctx.fill(); ctx.strokeStyle = shade(c, 0.6); ctx.lineWidth = 1.5; rr(ctx, x - w / 2, y - h, w, h, w * 0.25); ctx.stroke(); };
      for (const sgn of [-1, 1]) rock(sgn * bw * 0.45, 0 - (sgn > 0 ? stomp * r * 0.6 : 0), r * 0.6, r * 0.7, shade(col, 0.8));   // pieds
      rock(0, -r * 0.55, bw * 1.4, bh * 0.8, col);                                                                     // corps
      for (const sgn of [-1, 1]) rock(sgn * bw * 0.95, -r * 0.6 + (sgn < 0 ? -stomp * r * 0.8 : 0), r * 0.55, r * 1.6, shade(col, 0.9));   // bras
      rock(0, -bh * 0.8 + r * 0.1, bw * 0.9, r * 0.9, shade(col, 1.1));                                                 // tête
      ctx.fillStyle = hurt > 0 ? '#fff' : '#ffb03a'; for (const sgn of [-1, 1]) { circle(ctx, sgn * bw * 0.25, -bh * 0.8 - r * 0.3, r * 0.1); ctx.fill(); }
      ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(-bw * 0.3, -bh * 0.8 - r * 0.8); ctx.lineTo(-bw * 0.15, -bh * 0.8 - r * 1.1); ctx.lineTo(0, -bh * 0.8 - r * 0.85); ctx.lineTo(bw * 0.15, -bh * 0.8 - r * 1.1); ctx.lineTo(bw * 0.3, -bh * 0.8 - r * 0.8); ctx.closePath(); ctx.fill();   // couronne
    }
    ctx.restore();
  };
  // Portail bleu (style Diablo) : anneau vertical lumineux, tourbillon à l'intérieur, étincelles qui orbitent, lueur au sol.
  S.drawPortal = function (ctx, x, y, k, t, open, boost) {
    ctx.save(); ctx.translate(x, y); const cy = -k * 0.8, rx = k * 0.44, ry = k * 0.82, spin = t * (2.2 + (boost || 0) * 4);
    if (!open) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, k * 0.5, k * 0.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a6678'; ctx.lineWidth = k * 0.08; ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(40,50,70,0.5)'; ctx.fill(); ctx.restore(); return; }
    const g0 = ctx.createRadialGradient(0, 0, 0, 0, 0, k * 0.8); g0.addColorStop(0, 'rgba(120,190,255,' + (0.45 + 0.1 * Math.sin(t * 5)) + ')'); g0.addColorStop(1, 'rgba(120,190,255,0)'); ctx.fillStyle = g0; ctx.beginPath(); ctx.ellipse(0, 0, k * 0.8, k * 0.34, 0, 0, TAU); ctx.fill();
    const glow = ctx.createRadialGradient(0, cy, 0, 0, cy, ry * 1.4); glow.addColorStop(0, 'rgba(140,200,255,0.35)'); glow.addColorStop(1, 'rgba(140,200,255,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, cy, rx * 1.9, ry * 1.35, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, TAU); ctx.clip();
    const g = ctx.createRadialGradient(0, cy, 0, 0, cy, ry); g.addColorStop(0, '#dff3ff'); g.addColorStop(0.35, '#3f84ec'); g.addColorStop(1, '#0b1f5c'); ctx.fillStyle = g; ctx.fillRect(-rx, cy - ry, rx * 2, ry * 2);
    ctx.lineWidth = Math.max(2, k * 0.07); ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const a0 = spin + i * TAU / 7, u = ((t * 0.7 + i / 7) % 1); const sx = rx * (0.15 + 0.85 * u), sy = ry * (0.15 + 0.85 * u); ctx.strokeStyle = 'rgba(210,235,255,' + (0.75 * (1 - u * 0.6)) + ')'; ctx.beginPath(); ctx.ellipse(0, cy, sx, sy, 0, a0, a0 + 1.4); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(160,215,255,0.35)'; ctx.lineWidth = k * 0.18; ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#9fdcff'; ctx.lineWidth = k * 0.07; ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { const a = -spin * 0.8 + i * TAU / 9, px = Math.cos(a) * rx * 1.15, py = cy + Math.sin(a) * ry * 1.1, s = k * (0.03 + 0.02 * Math.sin(t * 9 + i)); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 7 + i); circle(ctx, px, py, s); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.restore();
  };
  // Gros diamant bleu qui tourne lentement sur lui-même (largeur = cos de l'angle), facettes, reflet, rayons derrière.
  // Château d'une île-monde : donjon central, mur crénelé, deux tours à toit pointu, drapeaux, et un gros diamant qui tourne au sommet.
  S.drawCastle = function (ctx, x, y, k, t, T, o) {
    o = o || {}; ctx.save(); ctx.translate(x, y);
    const wall = T.hardTop || '#c4ccd4', wallD = T.hard || '#9aa3ad', dark = T.hardDark || '#6b747d', roof = T.soft || '#d9342b', W = k * 2.3, H = k * 0.85;
    const tower = (tx, tw, th) => {
      ctx.fillStyle = wallD; ctx.fillRect(tx - tw / 2, -th, tw, th); ctx.fillStyle = wall; ctx.fillRect(tx - tw / 2, -th, tw * 0.3, th); ctx.fillStyle = dark; ctx.fillRect(tx + tw * 0.3, -th, tw * 0.2, th);
      ctx.fillStyle = wallD; for (let i = -1; i <= 1; i++) ctx.fillRect(tx + i * tw * 0.34 - tw * 0.12, -th - tw * 0.2, tw * 0.24, tw * 0.22);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(tx - tw * 0.7, -th - tw * 0.18); ctx.lineTo(tx, -th - tw * 1.35); ctx.lineTo(tx + tw * 0.7, -th - tw * 0.18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(tx, -th - tw * 0.18); ctx.lineTo(tx, -th - tw * 1.35); ctx.lineTo(tx + tw * 0.7, -th - tw * 0.18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1b2a4a'; rr(ctx, tx - tw * 0.1, -th * 0.7, tw * 0.2, tw * 0.3, tw * 0.1); ctx.fill(); ctx.fillStyle = 'rgba(255,230,120,0.9)'; rr(ctx, tx - tw * 0.06, -th * 0.7 + tw * 0.04, tw * 0.12, tw * 0.2, tw * 0.06); ctx.fill();
    };
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, k * 0.08, W * 0.6, k * 0.3, 0, 0, TAU); ctx.fill();
    tower(0, k * 0.78, k * 1.7);   // donjon (derrière)
    ctx.fillStyle = wallD; ctx.fillRect(-W / 2, -H, W, H); ctx.fillStyle = wall; ctx.fillRect(-W / 2, -H, W, H * 0.14);
    ctx.fillStyle = wallD; for (let i = 0; i < 7; i++) { const cx = -W / 2 + W * (i + 0.5) / 7; ctx.fillRect(cx - W * 0.045, -H - k * 0.16, W * 0.09, k * 0.17); }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(-W / 2, -H + H * j / 4); ctx.lineTo(W / 2, -H + H * j / 4); ctx.stroke(); }
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(-k * 0.22, 0); ctx.lineTo(-k * 0.22, -H * 0.5); ctx.arc(0, -H * 0.5, k * 0.22, Math.PI, 0); ctx.lineTo(k * 0.22, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(1, k * 0.03); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -H * 0.62); ctx.stroke();
    tower(-W / 2 + k * 0.08, k * 0.52, k * 1.3); tower(W / 2 - k * 0.08, k * 0.52, k * 1.3);
    for (const tx of [-W / 2 + k * 0.08, W / 2 - k * 0.08]) { const top = -k * 1.3 - k * 0.52 * 1.35; ctx.strokeStyle = '#3e2723'; ctx.lineWidth = Math.max(1, k * 0.03); ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(tx, top - k * 0.4); ctx.stroke(); ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.moveTo(tx, top - k * 0.4); ctx.lineTo(tx + k * 0.28 + Math.sin(t * 5 + tx) * k * 0.04, top - k * 0.31); ctx.lineTo(tx, top - k * 0.22); ctx.closePath(); ctx.fill(); }
    const dy = -k * 1.7 - k * 0.78 * 1.35 - k * 0.6 + Math.sin(t * 2) * k * 0.07;
    S.drawDiamond(ctx, 0, dy, k * 0.55, t, { rays: !o.locked, open: true });
    ctx.restore();
  };
  S.drawDiamond = function (ctx, x, y, r, t, o) {
    o = o || {}; ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha = Math.max(0, o.alpha);
    if (o.rays) { ctx.save(); ctx.globalAlpha *= 0.5; for (let i = 0; i < 12; i++) { const a = t * 0.4 + i * TAU / 12; const g = ctx.createLinearGradient(0, 0, Math.cos(a) * r * 2.6, Math.sin(a) * r * 2.6); g.addColorStop(0, 'rgba(180,240,255,0.55)'); g.addColorStop(1, 'rgba(180,240,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - 0.09) * r * 2.6, Math.sin(a - 0.09) * r * 2.6); ctx.lineTo(Math.cos(a + 0.09) * r * 2.6, Math.sin(a + 0.09) * r * 2.6); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    const sx = Math.max(0.12, Math.abs(Math.cos(t * 1.1))), P = (px, py) => [px * r * sx, py * r];
    const dim = !o.open; const top = dim ? '#c8ccd2' : '#e8fbff', mid = dim ? '#8a9099' : '#5fd0ff', deep = dim ? '#5a6068' : '#1472c8', edge = dim ? '#3a4048' : '#0a3f7a';
    // pavillon (bas) puis couronne (haut)
    const G = [P(-1, -0.05), P(-0.5, -0.05), P(0, -0.05), P(0.5, -0.05), P(1, -0.05)], B = P(0, 1.05), T = [P(-0.55, -0.45), P(0.55, -0.45)];
    const facet = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = Math.max(1, r * 0.03); ctx.stroke(); };
    facet([G[0], G[1], B], deep); facet([G[1], G[2], B], mid); facet([G[2], G[3], B], deep); facet([G[3], G[4], B], mid);
    facet([G[0], T[0], G[1]], mid); facet([G[1], T[0], T[1], G[3]], top); facet([G[3], T[1], G[4]], mid); facet([G[1], T[0], G[2]], top); facet([G[2], T[1], G[3]], mid);
    // reflet qui balaie + étoiles
    if (!dim) { ctx.save(); ctx.beginPath(); ctx.moveTo(G[0][0], G[0][1]); ctx.lineTo(T[0][0], T[0][1]); ctx.lineTo(T[1][0], T[1][1]); ctx.lineTo(G[4][0], G[4][1]); ctx.lineTo(B[0], B[1]); ctx.closePath(); ctx.clip(); const u = ((t * 0.5) % 1) * 2 - 1; ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.moveTo(u * r * 1.6 - r * 0.2, -r * 0.6); ctx.lineTo(u * r * 1.6 + r * 0.15, -r * 0.6); ctx.lineTo(u * r * 1.6 - r * 0.45, r * 1.1); ctx.lineTo(u * r * 1.6 - r * 0.8, r * 1.1); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const ph = (t * 1.3 + i * 0.37) % 1, s = Math.sin(ph * Math.PI) * r * 0.16; if (s < 1) continue; const px = [-0.6, 0.4, 0.1][i] * r * sx, py = [-0.35, -0.2, 0.5][i] * r; ctx.beginPath(); ctx.moveTo(px, py - s); ctx.lineTo(px + s * 0.25, py); ctx.lineTo(px, py + s); ctx.lineTo(px - s * 0.25, py); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(px - s, py); ctx.lineTo(px, py - s * 0.25); ctx.lineTo(px + s, py); ctx.lineTo(px, py + s * 0.25); ctx.closePath(); ctx.fill(); } }
    ctx.restore();
  };
  // Projectiles : fusée noire au museau rond qui suit le héros (yeux fâchés, flamme derrière) et boulet de canon.
  S.drawShot = function (ctx, s, k, t) {
    ctx.save();
    if (s.kind === 'fire') { const r = k * 0.22; const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.6); g.addColorStop(0, '#fff6c2'); g.addColorStop(0.35, '#ffb347'); g.addColorStop(0.7, 'rgba(255,100,20,0.8)'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; circle(ctx, 0, 0, r * 1.6); ctx.fill(); ctx.fillStyle = '#ff8a1f'; circle(ctx, 0, 0, r); ctx.fill(); ctx.fillStyle = '#fff2a8'; circle(ctx, -r * 0.25, -r * 0.25, r * 0.45); ctx.fill(); ctx.restore(); return; }
    if (s.kind === 'bone') { const L = k * 0.5, R = k * 0.09; ctx.rotate(t * 14); ctx.strokeStyle = '#f4f0e6'; ctx.lineCap = 'round'; ctx.lineWidth = R * 2; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0); ctx.stroke(); ctx.fillStyle = '#f4f0e6'; for (const sx of [-1, 1]) for (const sy of [-1, 1]) { circle(ctx, sx * L / 2, sy * R * 0.9, R * 1.15); ctx.fill(); } ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0); ctx.stroke(); ctx.restore(); return; }
    if (s.kind === 'dirt') { const r = k * 0.22; ctx.rotate(t * 6); ctx.fillStyle = '#7d5428'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr2 = r * (0.85 + 0.2 * ((i * 7) % 3) / 2); ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5e3a18'; circle(ctx, -r * 0.3, -r * 0.2, r * 0.18); ctx.fill(); circle(ctx, r * 0.3, r * 0.25, r * 0.14); ctx.fill(); ctx.fillStyle = '#9a6a35'; circle(ctx, r * 0.2, -r * 0.4, r * 0.15); ctx.fill(); ctx.fillStyle = '#3fae4a'; ctx.fillRect(-r * 0.1, -r * 1.05, r * 0.12, r * 0.35); ctx.restore(); return; }
    if (s.kind === 'ice') { const sa = Math.atan2(Math.sin(s.a) * 0.6, Math.cos(s.a)); ctx.rotate(sa); const L = k * 0.6, R = k * 0.14; ctx.fillStyle = '#bfefff'; ctx.beginPath(); ctx.moveTo(L / 2, 0); ctx.lineTo(0, -R); ctx.lineTo(-L / 2, 0); ctx.lineTo(0, R); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(L * 0.3, 0); ctx.lineTo(0, -R * 0.4); ctx.lineTo(-L * 0.3, 0); ctx.closePath(); ctx.fill(); ctx.restore(); return; }
    if (s.kind === 'magic') {   // (dark : la magie verte et noire du shaman)
      const R = k * 0.3, a0 = t * 5; ctx.strokeStyle = s.dark ? 'rgba(126,240,90,0.55)' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; circle(ctx, 0, 0, R * 1.15); ctx.stroke();
      if (s.dark) { const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.3); gg.addColorStop(0, 'rgba(126,240,90,0.5)'); gg.addColorStop(1, 'rgba(20,40,10,0)'); ctx.fillStyle = gg; circle(ctx, 0, 0, R * 1.3); ctx.fill(); }
      const shapes = s.dark ? [['#7ef05a', 'tri'], ['#1b1b1b', 'circle'], ['#b0ff80', 'square']] : [['#ff5c8a', 'tri'], ['#ffd54a', 'circle'], ['#3f9cff', 'square']];
      shapes.forEach(([col, kind], i) => { const a = a0 + i * TAU / 3, x = Math.cos(a) * R, y = Math.sin(a) * R * 0.6, s2 = k * 0.13; ctx.save(); ctx.translate(x, y); ctx.rotate(-a0 * 1.5); ctx.fillStyle = col; ctx.beginPath(); if (kind === 'tri') { ctx.moveTo(0, -s2); ctx.lineTo(s2 * 0.9, s2 * 0.6); ctx.lineTo(-s2 * 0.9, s2 * 0.6); ctx.closePath(); } else if (kind === 'circle') ctx.arc(0, 0, s2 * 0.8, 0, TAU); else ctx.rect(-s2 * 0.7, -s2 * 0.7, s2 * 1.4, s2 * 1.4); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); });
      ctx.restore(); return;
    }
    if (s.kind === 'poison') {   // boule verte de poison : brille, se tortille, laisse des gouttes
      const r = k * 0.24, w = Math.sin(t * 18); ctx.rotate(Math.atan2(Math.sin(s.a) * 0.6, Math.cos(s.a))); ctx.scale(1 + w * 0.1, 1 - w * 0.1);
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.7); g.addColorStop(0, '#e9ffb0'); g.addColorStop(0.35, '#7ef05a'); g.addColorStop(0.7, 'rgba(60,170,40,0.75)'); g.addColorStop(1, 'rgba(60,200,40,0)'); ctx.fillStyle = g; circle(ctx, 0, 0, r * 1.7); ctx.fill();
      ctx.fillStyle = '#4fc934'; ctx.beginPath(); ctx.moveTo(-r * 1.6, 0); ctx.quadraticCurveTo(-r * 0.8, -r * 0.5, 0, -r * 0.6); ctx.quadraticCurveTo(-r * 0.8, r * 0.5, -r * 1.6, 0); ctx.fill();   // traînée
      ctx.fillStyle = '#5ad13a'; circle(ctx, 0, 0, r); ctx.fill(); ctx.fillStyle = '#2e8a22'; circle(ctx, r * 0.35, r * 0.3, r * 0.2); ctx.fill(); circle(ctx, -r * 0.2, r * 0.45, r * 0.12); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; circle(ctx, -r * 0.3, -r * 0.3, r * 0.3); ctx.fill(); ctx.restore(); return;
    }
    if (s.kind === 'ball') {   // noir, de feu (rouge brûlant) ou bleu (glacé qui luit)
      const r = k * 0.24;
      if (s.color === 'fire') { const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7); g.addColorStop(0, 'rgba(255,170,60,0.9)'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; circle(ctx, 0, 0, r * 1.7); ctx.fill(); ctx.fillStyle = '#c62828'; circle(ctx, 0, 0, r); ctx.fill(); ctx.fillStyle = '#ff8a1f'; circle(ctx, 0, 0, r * 0.65); ctx.fill(); ctx.fillStyle = '#fff2a8'; circle(ctx, -r * 0.3, -r * 0.3, r * 0.3); ctx.fill(); ctx.restore(); return; }
      if (s.color === 'blue') { const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.6); g.addColorStop(0, 'rgba(140,200,255,0.8)'); g.addColorStop(1, 'rgba(60,120,255,0)'); ctx.fillStyle = g; circle(ctx, 0, 0, r * 1.6); ctx.fill(); ctx.fillStyle = '#1e63b3'; circle(ctx, 0, 0, r); ctx.fill(); ctx.fillStyle = '#5aa4ff'; circle(ctx, r * 0.1, r * 0.1, r * 0.6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; circle(ctx, -r * 0.35, -r * 0.35, r * 0.3); ctx.fill(); ctx.restore(); return; }
      ctx.fillStyle = '#1e1e24'; circle(ctx, 0, 0, r); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; circle(ctx, -r * 0.35, -r * 0.35, r * 0.28); ctx.fill(); ctx.restore(); return;
    }
    const sa = Math.atan2(Math.sin(s.a) * 0.6, Math.cos(s.a)); ctx.rotate(sa); const L = k * 0.9, R = k * 0.25;
    for (let i = 0; i < 2; i++) { const f = 0.8 + 0.2 * Math.sin(t * 25 + i * 2); ctx.fillStyle = i ? 'rgba(255,230,120,0.9)' : 'rgba(255,140,40,0.85)'; ctx.beginPath(); ctx.moveTo(-L / 2, -R * (0.6 - i * 0.25)); ctx.lineTo(-L / 2 - k * (0.35 - i * 0.12) * f, 0); ctx.lineTo(-L / 2, R * (0.6 - i * 0.25)); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#1a1a1e'; ctx.beginPath(); ctx.moveTo(-L / 2, -R); ctx.lineTo(L / 2 - R, -R); ctx.arc(L / 2 - R, 0, R, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-L / 2, R); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9342b'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L / 2, sgn * R * 0.6); ctx.lineTo(-L / 2 - R * 0.5, sgn * R * 1.5); ctx.lineTo(-L / 2 + R * 0.8, sgn * R * 0.9); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(L * 0.12, -R * 0.45, R * 0.28, R * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#111'; circle(ctx, L * 0.16, -R * 0.45, R * 0.13); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, k * 0.03); ctx.beginPath(); ctx.moveTo(-L * 0.05, -R * 0.95); ctx.lineTo(L * 0.3, -R * 0.75); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; rr(ctx, -L / 2 + R * 0.3, -R * 0.85, L * 0.5, R * 0.25, R * 0.1); ctx.fill();
    ctx.restore();
  };
  function face(ctx, x, y, r, t, mood) {
    const blink = Math.sin(t * 1.7) > 0.96;
    ctx.fillStyle = '#fff';
    for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sgn * r * 0.3, y - r * 0.05, r * 0.2, blink ? r * 0.03 : r * 0.24, 0, 0, TAU); ctx.fill(); }
    if (!blink) { ctx.fillStyle = '#111'; for (const sgn of [-1, 1]) { circle(ctx, x + sgn * r * 0.3, y, r * 0.1); ctx.fill(); } }
    ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1, r * 0.06);
    if (mood === 'grumpy') { for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sgn * r * 0.5, y - r * 0.4); ctx.lineTo(x + sgn * r * 0.15, y - r * 0.28); ctx.stroke(); } ctx.beginPath(); ctx.arc(x, y + r * 0.45, r * 0.25, Math.PI + 0.3, TAU - 0.3); ctx.stroke(); }
    else if (mood === 'hungry') { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.4, r * 0.3, r * 0.18, 0, 0, TAU); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(x, y + r * 0.35, r * 0.2, 0, Math.PI); ctx.stroke(); }
  }

  // -------------------------------------------------------------------- objets
  // Pièce d'or : disque qui tourne lentement sur lui-même (largeur = cos de l'angle), tranche visible de profil, reflet.
  // Écrit un texte où chaque « 🪙 » est remplacé par une vraie pièce d'or dessinée (l'emoji est argenté sur Mac).
  S.textWithCoin = function (ctx, text, x, y) {
    const parts = String(text).split('🪙'); if (parts.length === 1) { ctx.fillText(text, x, y); return; }
    const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font), size = m ? parseFloat(m[1]) : 20, cw = size * 1.15;
    const widths = parts.map(p => ctx.measureText(p).width), total = widths.reduce((a, b) => a + b, 0) + cw * (parts.length - 1);
    const align = ctx.textAlign; let x0 = align === 'right' || align === 'end' ? x - total : align === 'center' ? x - total / 2 : x;
    const fill = ctx.fillStyle; ctx.save(); ctx.textAlign = 'left';
    parts.forEach((p, i) => { ctx.fillStyle = fill; ctx.fillText(p, x0, y); x0 += widths[i]; if (i < parts.length - 1) { S.drawCoin(ctx, x0 + cw / 2, y - size * 0.36, size * 0.44, 0); x0 += cw; } });
    ctx.restore();
  };
  S.coinWidth = function (ctx, text) { const parts = String(text).split('🪙'); const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font), size = m ? parseFloat(m[1]) : 20; return parts.reduce((a, p) => a + ctx.measureText(p).width, 0) + size * 1.15 * (parts.length - 1); };
  S.drawCoin = function (ctx, x, y, r, t) {
    const a = t * 1.6, cw = Math.cos(a), sx = Math.max(0.08, Math.abs(cw)), edge = r * 0.14;
    ctx.save(); ctx.translate(x, y);
    // tranche (décalée du côté caché) puis face
    ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.ellipse(-Math.sign(cw) * edge * (1 - sx), 0, r * sx, r, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(-r, -r, r, r); const sh = (Math.sin(t * 2.2) + 1) / 2; g.addColorStop(0, '#fff2a8'); g.addColorStop(Math.max(0.05, Math.min(0.95, sh)), '#ffd54a'); g.addColorStop(1, '#d99a00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * sx, r, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a06f00'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,111,0,0.6)'; ctx.lineWidth = Math.max(1, r * 0.07); ctx.beginPath(); ctx.ellipse(0, 0, r * sx * 0.72, r * 0.72, 0, 0, TAU); ctx.stroke();
    if (sx > 0.3) { ctx.save(); ctx.scale(sx, 1); ctx.fillStyle = '#a06f00'; ctx.font = 'bold ' + Math.round(r * 1.1) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', 0, r * 0.05); ctx.restore(); }
    const tw = ((t * 0.7) % 1); if (tw < 0.25) { const k = Math.sin(tw / 0.25 * Math.PI); ctx.fillStyle = 'rgba(255,255,255,' + k + ')'; const px = -r * 0.5 * sx, py = -r * 0.55; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + dx * r * 0.45 * k, py + dy * r * 0.45 * k); ctx.lineTo(px + dy * r * 0.08, py + dx * r * 0.08); ctx.closePath(); ctx.fill(); } }
    ctx.restore();
  };
  // Carotte (objet au sol, lancée, ou dans la gueule d'un lapin) : cône orange strié, fanes vertes ; rot = inclinaison.
  S.drawCarrot = function (ctx, x, y, k, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.fillStyle = '#ff8a1f'; ctx.beginPath(); ctx.moveTo(-k * 0.13, -k * 0.2); ctx.quadraticCurveTo(-k * 0.16, 0.05 * k, 0, k * 0.32); ctx.quadraticCurveTo(k * 0.16, 0.05 * k, k * 0.13, -k * 0.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,60,0,0.45)'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { const yy = -k * 0.08 + i * k * 0.11, w = k * (0.11 - i * 0.03); ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(w, yy); ctx.stroke(); }
    ctx.strokeStyle = '#3fae4a'; ctx.lineWidth = Math.max(1.5, k * 0.05); ctx.lineCap = 'round'; for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(0, -k * 0.2); ctx.lineTo(Math.sin(a) * k * 0.18, -k * 0.2 - Math.cos(a) * k * 0.22); ctx.stroke(); }
    ctx.restore();
  };
  S.drawAxe = function(ctx,x,y,s) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(0.35);
    ctx.fillStyle='#976136';rr(ctx,-0.045,-0.4,0.09,0.85,0.03);ctx.fill();ctx.fillStyle='#d4a269';ctx.fillRect(-0.028,-0.3,0.025,0.65);
    const g=ctx.createLinearGradient(-0.1,-0.4,0.32,-0.1);g.addColorStop(0,'#f0f9fa');g.addColorStop(1,'#688d9a');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-0.1,-0.42);ctx.lineTo(0.28,-0.5);ctx.quadraticCurveTo(0.43,-0.25,0.28,-0.06);ctx.lineTo(0.04,-0.22);ctx.lineTo(-0.1,-0.22);ctx.closePath();ctx.fill();ctx.strokeStyle='#476674';ctx.lineWidth=0.025;ctx.stroke();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(0.28,-0.47);ctx.quadraticCurveTo(0.39,-0.25,0.28,-0.1);ctx.stroke();ctx.restore();
  };
  S.drawMeat = function(ctx, x, y, s, cooked) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(-0.35);
    if(cooked){ctx.fillStyle='#fff1d6';rr(ctx,0.08,-0.08,0.43,0.14,0.06);ctx.fill();for(const yy of [-0.08,0.08]){circle(ctx,0.48,yy,0.09);ctx.fill();}}
    const g=ctx.createLinearGradient(-0.3,-0.25,0.2,0.25);g.addColorStop(0,cooked?'#f2b56e':'#f6a4a6');g.addColorStop(1,cooked?'#a24e25':'#bc445b');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(-0.1,0,0.34,0.26,-0.25,0,TAU);ctx.fill();
    ctx.strokeStyle=cooked?'#ffe0a4':'#ffe3d5';ctx.lineWidth=0.035;ctx.beginPath();ctx.ellipse(-0.1,0,0.27,0.19,-0.25,0,TAU);ctx.stroke();
    ctx.strokeStyle=cooked?'#844326':'#ffe3d5';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-0.26+i*0.12,-0.09);ctx.lineTo(-0.2+i*0.12,0.1);ctx.stroke();}ctx.restore();
  };
  S.drawItem = function (ctx, type, s, t, value) {
    if(BK.ITEMS[type]?.snailColor) { S.drawAnimal(ctx,'escargot',{s:s*2,shell:1,shellColor:BK.ITEMS[type].snailColor,baby:BK.ITEMS[type].baby,growth:BK.ITEMS[type].growth,t});return; }
    if (type === 'heart' && value) s *= value >= 20 ? 1.3 : value <= 5 ? 0.8 : 1;
    if (type === 'axe') { S.drawAxe(ctx,0,-s*0.3,s*0.8);return; }
    if (['meatraw','meatcooked','poultryraw','poultrycooked'].includes(type)) { S.drawMeat(ctx,0,-s*0.3,s*0.85,type==='meatcooked'||type==='poultrycooked');return; }
    if (type === 'coin') { const bob = Math.sin(t * 3) * s * 0.04; S.drawCoin(ctx, 0, -s * 0.42 - bob, s * 0.26, t); return; }
    if (type === 'fish' || type === 'fishcooked') { const fl = type === 'fish' ? Math.max(0, Math.sin(t * 7)) : 0; S.drawFish(ctx, 0, -s * 0.12 - fl * s * 0.22, s * 0.9, type === 'fish' ? Math.sin(t * 7) * 0.35 : 0, type === 'fishcooked'); return; }
    if (type === 'pumpkinpiece') {
      ctx.save(); ctx.translate(0, -s * 0.3 - Math.sin(t * 3) * s * 0.04); ctx.scale(s, s);
      ctx.fillStyle = '#c75b17'; ctx.beginPath(); ctx.moveTo(-0.4, -0.15); ctx.quadraticCurveTo(0, 0.5, 0.4, -0.15); ctx.lineTo(0.32, -0.23); ctx.quadraticCurveTo(0, 0.27, -0.32, -0.23); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffb642'; ctx.beginPath(); ctx.moveTo(-0.32, -0.23); ctx.lineTo(0.32, -0.23); ctx.quadraticCurveTo(0, 0.27, -0.32, -0.23); ctx.fill();
      ctx.fillStyle = '#fff0b0'; for (const x of [-0.12, 0.04, 0.17]) { ctx.beginPath(); ctx.ellipse(x, -0.12, 0.025, 0.045, 0.4, 0, TAU); ctx.fill(); } ctx.restore(); return;
    }
    if (type === 'carrot') { S.drawCarrot(ctx, 0, -s * 0.2 - Math.sin(t * 3) * s * 0.03, s * 0.85, 0.5 + Math.sin(t * 2) * 0.1); return; }
    const I = BK.ITEMS[type]; const r = s * 0.3, bob = Math.sin(t * 3) * s * 0.03;
    ctx.save(); ctx.translate(0, -r - bob);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; rr(ctx, -r, -r, r * 2, r * 2, r * 0.3); ctx.fill();
    ctx.strokeStyle = I.color; ctx.lineWidth = Math.max(2, s * 0.05); rr(ctx, -r, -r, r * 2, r * 2, r * 0.3); ctx.stroke();
    ctx.fillStyle = I.color; ctx.globalAlpha *= 0.25; rr(ctx, -r, -r, r * 2, r * 2, r * 0.3); ctx.fill(); ctx.globalAlpha /= 0.25;
    ctx.font = Math.round(r * 1.3) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText(I.icon, 0, r * 0.08);
    if ((type === 'heart' || type === 'honey') && value) { ctx.font = '900 ' + Math.round(r * 0.75) + 'px Nunito, sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = type === 'honey' ? '#6b3a00' : '#7a1030'; ctx.strokeText('×' + value, r * 0.75, r * 0.85); ctx.fillStyle = '#fff'; ctx.fillText('×' + value, r * 0.75, r * 0.85); }
    ctx.restore();
  };

  // -------------------------------------------------------------------- flammes
  // Une case de flamme : u = 0..1 progression (0 = apparition, 1 = fin). kind : 'center' | 'mid' | 'end', dir 0..3.
  S.drawFlame = function (ctx, cam, cx, cy, u, kind, dir, seed, z0, magic, level=1, domeHeight=0) {
    const grow = Math.sin(Math.min(1, u) * Math.PI);                 // monte puis retombe
    const r = 0.46 * (0.55 + 0.45 * grow), h = (domeHeight || 0.55) * grow + 0.1; z0 = z0 || 0;
    const x = cx + 0.5, y = cy + 0.5;
    const base = cam.project(x, y, z0), top = cam.project(x, y, z0 + h), k = base.k;
    const rx = r * k, ry = rx * 0.55;
    const g = ctx.createRadialGradient(base.x, top.y + (base.y - top.y) * 0.5, rx * 0.1, base.x, top.y + (base.y - top.y) * 0.5, rx * 1.1);
    if (magic) { g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * grow) + ')'); g.addColorStop(0.45, 'rgba(220,170,255,' + (0.9 * grow) + ')'); g.addColorStop(0.8, 'rgba(140,60,220,' + (0.75 * grow) + ')'); g.addColorStop(1, 'rgba(80,20,140,0)'); }
    else if(level>=2) { g.addColorStop(0,'rgba(255,190,150,'+(0.98*grow)+')');g.addColorStop(.35,'rgba(255,65,35,'+(0.96*grow)+')');g.addColorStop(.75,'rgba(220,15,35,'+(0.88*grow)+')');g.addColorStop(1,'rgba(140,0,25,0)'); }
    else { g.addColorStop(0, 'rgba(255,255,220,' + (0.95 * grow) + ')'); g.addColorStop(0.45, 'rgba(255,190,60,' + (0.9 * grow) + ')'); g.addColorStop(0.8, 'rgba(255,90,30,' + (0.75 * grow) + ')'); g.addColorStop(1, 'rgba(200,40,20,0)'); }
    ctx.fillStyle = g;
    ctx.beginPath();
    if (kind === 'center') { ctx.ellipse(base.x, base.y - (base.y - top.y) * 0.5, rx * 1.15, (base.y - top.y) * 0.7 + ry, 0, 0, TAU); }
    else {
      const vertical = dir === 0 || dir === 2;
      const along = vertical ? 0.62 : 0.62;
      ctx.ellipse(base.x, base.y - (base.y - top.y) * 0.5, vertical ? rx * 0.85 : rx * 1.25 * (kind === 'end' ? 0.9 : 1), vertical ? ry * 1.9 * along + (base.y - top.y) * 0.5 : (base.y - top.y) * 0.55 + ry, 0, 0, TAU);
    }
    ctx.fill();
    // étincelles
    ctx.fillStyle = (level>=2&&!magic?'rgba(255,100,65,':'rgba(255,240,160,') + (0.8 * grow) + ')';
    for (let i = 0; i < 3; i++) { const a = seed * 3 + i * 2.1 + u * 9, rad = rx * (0.5 + 0.5 * u); circle(ctx, base.x + Math.cos(a) * rad, base.y - (base.y - top.y) * 0.6 + Math.sin(a) * rad * 0.5 - u * k * 0.4, k * 0.03); ctx.fill(); }
  };

  // -------------------------------------------------------------------- décors d'exploration
  // Buisson rond (bloc mou des jardins). (x,y) = point au sol projeté, k = pixels par case.
  S.drawBush = function (ctx, x, y, k, color, seed) {
    const r = k * 0.42; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = shade(color, 0.7); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.45, 0, 0, TAU); ctx.fill();
    const blobs = [[0, -r * 0.55, r * 0.75], [-r * 0.5, -r * 0.35, r * 0.5], [r * 0.5, -r * 0.4, r * 0.52], [-r * 0.2, -r * 0.95, r * 0.45], [r * 0.25, -r * 0.9, r * 0.42]];
    for (const [bx, by, br] of blobs) { const g = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, br * 0.1, bx, by, br); g.addColorStop(0, shade(color, 1.35)); g.addColorStop(1, shade(color, 0.85)); ctx.fillStyle = g; circle(ctx, bx, by, br); ctx.fill(); }
    ctx.restore();
  };
  // Arbre : o = { style: 'feuillu' | 'automne' | 'sapin' | 'mort', size: 0.7 | 1 | 1.4 }
  S.drawTree = function (ctx, x, y, k, t, o) {
    o = o || {}; const style = o.style || 'feuillu', sz = o.size || 1; k = k * sz; const r = k * 0.9;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.35, 0, 0, TAU); ctx.fill();
    const sway = Math.sin(t * 1.3) * k * 0.03;
    if (style === 'sapin') {
      ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.1, -k * 0.5, k * 0.2, k * 0.5, k * 0.04); ctx.fill();
      for (let i = 0; i < 4; i++) { const w = r * (1.0 - i * 0.2), yy = -k * (0.45 + i * 0.42), c = i % 2 ? '#2f7a3a' : '#3a9a48'; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-w + sway, yy); ctx.lineTo(sway, yy - k * 0.7); ctx.lineTo(w + sway, yy); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 4; i++) { const w = r * (1.0 - i * 0.2), yy = -k * (0.45 + i * 0.42); ctx.beginPath(); ctx.moveTo(sway, yy - k * 0.7); ctx.lineTo(w * 0.5 + sway, yy - k * 0.35); ctx.lineTo(sway, yy - k * 0.5); ctx.closePath(); ctx.fill(); }
    } else if (style === 'mort') {
      ctx.strokeStyle = '#5a4030'; ctx.lineCap = 'round';
      const branch = (x0, y0, ang, len, w, depth) => { const x1 = x0 + Math.cos(ang) * len + sway * depth * 0.3, y1 = y0 + Math.sin(ang) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); if (depth <= 0) return; branch(x1, y1, ang - 0.5 - 0.2 * depth, len * 0.65, w * 0.6, depth - 1); branch(x1, y1, ang + 0.45, len * 0.6, w * 0.6, depth - 1); };
      branch(0, 0, -Math.PI / 2, k * 0.75, k * 0.16, 3);
    } else {
      const auto = style === 'automne', cols = auto ? ['#d9542a', '#e8882a', '#f4c430', '#c73b2a'] : ['#2f8a3a', '#3a9d45', '#3a9d45', '#48b556'];
      ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.14, -k * 1.1, k * 0.28, k * 1.1, k * 0.06); ctx.fill();
      for (const [bx, by, br, c] of [[0, -k * 1.55, r * 0.8, cols[0]], [-r * 0.5, -k * 1.3, r * 0.55, cols[1]], [r * 0.5, -k * 1.35, r * 0.55, cols[2]], [0, -k * 1.95, r * 0.5, cols[3]]]) {
        const g = ctx.createRadialGradient(bx + sway - br * 0.3, by - br * 0.3, br * 0.1, bx + sway, by, br); g.addColorStop(0, shade(c, 1.3)); g.addColorStop(1, shade(c, 0.8)); ctx.fillStyle = g; circle(ctx, bx + sway, by, br); ctx.fill();
      }
      if (auto) { ctx.fillStyle = '#e8882a'; for (let i = 0; i < 4; i++) { const u = (t * 0.25 + i * 0.25) % 1; circle(ctx, Math.sin(t * 2 + i * 2) * r * 0.6, -k * 1.2 + u * k * 1.2, k * 0.04); ctx.fill(); } }
    }
    ctx.restore();
  };
  // Roche : galet irrégulier gris, avec des facettes claires et quelques fissures.
  S.drawRock = function (ctx, x, y, k, seed) {
    const rnd = n => { const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
    const w = k * 0.46, h = k * 0.62; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 1.05, w * 0.4, 0, 0, TAU); ctx.fill();
    const pts = []; const n = 9; for (let i = 0; i < n; i++) { const a = i / n * TAU, rad = 1 + (rnd(i) - 0.5) * 0.35; pts.push({ x: Math.cos(a) * w * rad, y: -h * 0.55 + Math.sin(a) * h * 0.55 * rad }); }
    const g = ctx.createRadialGradient(-w * 0.35, -h * 0.85, w * 0.1, 0, -h * 0.5, w * 1.3); g.addColorStop(0, '#c9d0d8'); g.addColorStop(0.6, '#8f98a3'); g.addColorStop(1, '#4f5761');
    ctx.fillStyle = g; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, k * 0.03); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.5); ctx.lineTo(-w * 0.05, -h * 0.3); ctx.lineTo(w * 0.2, -h * 0.45); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-w * 0.3, -h * 0.8, w * 0.3, h * 0.12, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  };
  // Touffe de fleurs : plusieurs tiges avec des pétales aux couleurs données.
  S.drawFlowers = function (ctx, x, y, k, colors, seed, t) {
    colors = (colors && colors.length) ? colors : ['#ff5fc8']; const rnd = n => { const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
    ctx.save(); ctx.translate(x, y);
    for (let i = 0; i < 5; i++) {
      const fx = (rnd(i) - 0.5) * k * 0.7, fy = (rnd(i + 10) - 0.5) * k * 0.3, hgt = k * (0.18 + rnd(i + 20) * 0.14), sway = Math.sin(t * 2 + i) * k * 0.015, col = colors[i % colors.length];
      ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = Math.max(1, k * 0.03); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + sway, fy - hgt * 0.5, fx + sway * 2, fy - hgt); ctx.stroke();
      ctx.fillStyle = '#3a9d45'; ctx.beginPath(); ctx.ellipse(fx + k * 0.04, fy - hgt * 0.4, k * 0.05, k * 0.025, 0.6, 0, TAU); ctx.fill();
      const cx = fx + sway * 2, cy = fy - hgt, pr = k * 0.055;
      ctx.fillStyle = col; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + i; circle(ctx, cx + Math.cos(a) * pr * 1.2, cy + Math.sin(a) * pr * 1.2, pr); ctx.fill(); }
      ctx.fillStyle = '#ffe36b'; circle(ctx, cx, cy, pr * 0.7); ctx.fill();
    }
    ctx.restore();
  };
  // Sculptures de pierre : silhouettes fixes, chacune avec une pose distincte.
  S.drawStoneStatue = function (ctx, kind, k) {
    ctx.save(); ctx.scale(k, k);
    const stone = '#b8c7ce', shade = '#748996', edge = '#506775';
    const poly = (pts, color) => { ctx.fillStyle = color; ctx.beginPath(); pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 0.018; ctx.stroke(); };
    const limb = (pts, width = 0.11) => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.strokeStyle = edge; ctx.lineWidth = width + 0.035; ctx.stroke(); ctx.strokeStyle = stone; ctx.lineWidth = width; ctx.stroke(); };
    ctx.fillStyle = 'rgba(0,0,0,0.23)'; ctx.beginPath(); ctx.ellipse(0,0,0.43,0.13,0,0,TAU); ctx.fill();
    poly([[-0.37,0],[0.37,0],[0.37,-0.22],[-0.37,-0.22]], shade);
    poly([[-0.4,-0.22],[0.4,-0.22],[0.32,-0.3],[-0.32,-0.3]], '#d0d9dc');
    let hx = 0, hy = -1.42;
    if (kind === 'statue_mermaid') {
      poly([[-0.24,-0.34],[-0.27,-0.65],[-0.12,-0.92],[0.11,-0.88],[0.21,-0.64],[0.08,-0.46],[0.35,-0.46],[0.42,-0.68],[0.49,-0.43],[0.35,-0.3],[0,-0.3]], '#91adb2');
      poly([[-0.15,-1.25],[0.15,-1.25],[0.1,-0.91],[-0.12,-0.91]], stone);
      limb([[-0.15,-1.19],[-0.31,-0.97],[-0.24,-0.73]]); limb([[0.14,-1.2],[0.31,-1.08],[0.42,-1.26]]);
      for (let j=0;j<3;j++) limb([[-0.16,-0.76+j*0.12],[-0.02,-0.7+j*0.12],[0.1,-0.75+j*0.12]],0.018);
    } else if (kind === 'statue_thinker') {
      hx=-0.09; hy=-1.18;
      poly([[-0.27,-0.3],[0.23,-0.3],[0.23,-0.72],[-0.27,-0.72]], shade);
      limb([[0.05,-0.76],[0.31,-0.69],[0.26,-0.34],[0.37,-0.33]],0.15); limb([[-0.08,-0.76],[-0.28,-0.7],[-0.25,-0.34],[-0.12,-0.33]],0.15);
      poly([[-0.19,-1.03],[0.06,-1.06],[0.18,-0.73],[-0.13,-0.69]], stone);
      limb([[0.06,-1.02],[0.25,-0.86],[0.02,-1.11]]); limb([[-0.17,-0.99],[-0.32,-0.85],[-0.27,-0.7]]);
    } else if (kind === 'statue_dancer') {
      hx=0.04; hy=-1.5;
      limb([[-0.07,-0.77],[-0.13,-0.52],[-0.06,-0.33]],0.1); limb([[0.09,-0.78],[0.36,-0.64],[0.48,-0.84]],0.1);
      poly([[-0.12,-1.3],[0.16,-1.28],[0.1,-1.04],[0.29,-0.79],[-0.28,-0.79],[-0.08,-1.05]], stone);
      limb([[-0.12,-1.25],[-0.36,-1.43],[-0.25,-1.7]]); limb([[0.15,-1.25],[0.38,-1.44],[0.27,-1.71]]);
    } else {
      hx=-0.04; hy=-1.36;
      limb([[-0.09,-0.78],[-0.28,-0.57],[-0.31,-0.32],[-0.12,-0.32]],0.15); limb([[0.09,-0.77],[0.26,-0.36],[0.42,-0.33]],0.15);
      poly([[-0.2,-1.18],[0.15,-1.18],[0.19,-0.76],[-0.18,-0.76]], stone);
      limb([[-0.18,-1.1],[-0.34,-0.92],[-0.31,-0.74]]); limb([[0.14,-1.09],[0.31,-0.94],[0.4,-1.09]]);
      limb([[0.41,-0.32],[0.41,-1.52]],0.035); poly([[0.35,-1.5],[0.41,-1.7],[0.47,-1.5]], stone);
      poly([[-0.43,-0.94],[-0.19,-0.94],[-0.2,-0.6],[-0.31,-0.48],[-0.44,-0.6]], shade);
    }
    ctx.fillStyle = shade; ctx.beginPath(); ctx.ellipse(hx,hy,0.18,0.21,0,0,TAU); ctx.fill();
    if (kind === 'statue_mermaid') poly([[hx-0.17,hy],[hx-0.25,hy+0.37],[hx-0.1,hy+0.31],[hx+0.19,hy+0.34],[hx+0.17,hy-0.07]],shade);
    ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(hx+0.02,hy+0.03,0.135,0.16,-0.12,0,TAU); ctx.fill();
    limb([[hx-0.04,hy+0.02],[hx-0.015,hy+0.02]],0.018); limb([[hx+0.07,hy+0.02],[hx+0.095,hy+0.02]],0.018);
    ctx.strokeStyle=edge; ctx.lineWidth=0.014; ctx.beginPath(); ctx.moveTo(hx-0.025,hy+0.1); ctx.lineTo(hx+0.07,hy+0.1); ctx.stroke();
    ctx.restore();
  };
  // Décorations : kind = lamp, bench, tomb, statue, well, fence, mushrooms, grass, crate, campfire, pumpkin, chest, log, pillar.
  // (x, y) : centre de la case projeté, k : pixels par case, nb : voisins de même sorte { n, s, e, w } (barrières).
  const CABIN_KINDS=new Set(['terrarium','aquarium','fishing_basket','fish_trout','fish_bass','fish_pike','antlers_moose','antlers_deer','fly_frame','lumber_saw','trophy_cup','trophy_star','trophy_shield']);
  S.terrariumSnailPose = function(t,seed,props,i) {
    const food=props.snailFood,age=food?.elapsed||0;
const phase=t*.22+i*2.3+(seed||0)*.1;let x=Math.sin(phase)*.31,y=-.31-(i%3)*.105,flip=Math.cos(phase)<0;
        if(food){const start=food.starts[i]||{x,y},side=i%2?-1:1,target={x:side*(.075+(i%4)*.025),y:-.34-Math.floor(i/2)*.025},u=Math.min(1,age/3),ease=u*u*(3-2*u);if(age<9){x=start.x+(target.x-start.x)*ease;y=start.y+(target.y-start.y)*ease;flip=side>0;if(age>=3)y+=Math.sin(age*10+i)*.006;}else{const v=Math.min(1,(age-9)/3);x=target.x+(x-target.x)*v;y=target.y+(y-target.y)*v;}}
    return {x,y,flip};
  };
  S.drawCabinDeco=function(ctx,kind,k,t,seed,mounted=false,props={}){
    ctx.save();ctx.scale(k,k);ctx.lineWidth=.018;ctx.lineJoin='round';ctx.lineCap='round';
    const box=(x,y,w,h,color,r=.02)=>{ctx.fillStyle=color;rr(ctx,x,y,w,h,r);ctx.fill();};
    const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();};
    const line=(points,color,width=.018)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
    const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
    const plaque=()=>{box(-.54,-1.26,1.08,.9,'#634535',.06);for(let i=0;i<4;i++){box(-.51,-1.23+i*.215,1.02,.19,i%2?'#987959':'#ac8c65');line([[-.46,-1.15+i*.215],[.42,-1.17+i*.215]],'#705840',.009);}for(const x of [-.46,.46])for(const y of [-1.18,-.43])oval(x,y,.018,.018,'#493f35');};
    const fish=(x,y,scale,color,spots=false,long=false)=>{ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);poly([[-.27,0],[-.43,-.14],[-.43,.14]],color);poly([[-.12,-.08],[.02,-.23],[.14,-.08]],color);oval(0,0,long?.36:.29,long?.09:.14,color);oval(.12,.04,.13,.065,'#e7d5a4');if(spots)for(let i=0;i<9;i++)oval(-.2+(i%5)*.08,-.06+Math.floor(i/5)*.075,.014,.012,'#e9cd91');oval(long?.27:.2,-.025,.025,.028,'#fff2cd');oval(long?.28:.21,-.025,.012,.016,'#172d30');line([[.13,-.07],[.1,.01],[.14,.08]],'#416354',.012);ctx.restore();};
    if(!mounted) oval(0,.02,.5,.13,'rgba(0,0,0,.22)');
    if(kind==='terrarium'){
      box(-.51,-.12,1.02,.14,'#835638');box(-.46,-.06,.15,.13,'#62442e');box(.31,-.06,.15,.13,'#62442e');
      box(-.49,-.82,.98,.72,'#9bd2bd');box(-.45,-.77,.9,.6,'#d9efd0');
      box(-.45,-.3,.9,.14,'#8b6548');box(-.45,-.33,.9,.065,'#93c958');
      for(const x of [-.35,.29]) {line([[x,-.32],[x,-.59]],'#59974e',.025);oval(x-.045,-.51,.07,.03,'#7cbd63');oval(x+.045,-.57,.07,.03,'#9bd675');}
      oval(.12,-.31,.1,.035,'#bca88d');box(-.2,-.38,.2,.08,'#986340');
      ctx.save();ctx.beginPath();ctx.rect(-.44,-.76,.88,.59);ctx.clip();
      const food=props.snailFood,age=food?.elapsed||0;
      if(food&&age<9){const size=age<3?1:Math.max(.08,1-(age-3)/6);ctx.save();ctx.translate(0,-.37);ctx.scale(size,size);poly([[-.055,-.07],[.055,-.07],[.015,.06]],'#f49a35');line([[0,-.07],[-.04,-.13]],'#65a74e',.025);line([[0,-.07],[.035,-.14]],'#81c65c',.025);ctx.restore();}
      (props.snails||[]).slice(0,8).forEach((sn,i)=>{const {x,y,flip}=S.terrariumSnailPose(t,seed,props,i);
        ctx.save();ctx.translate(x,y);S.drawAnimal(ctx,'escargot',{s:.5,t:t+i,flip,state:'walk',shellColor:sn.color,baby:sn.baby,growth:(sn.growth||0)+(food?.starts[i]?.baby?Math.max(0,Math.min(1,(age-3)/9)):0)});ctx.restore();});ctx.restore();
      poly([[-.41,-.74],[-.29,-.74],[-.41,-.42]],'#ffffff66');line([[-.48,-.8],[-.48,-.15],[.48,-.15],[.48,-.8]],'#56897e',.035);
      box(-.53,-.87,1.06,.09,'#bc8a51');for(let i=0;i<10;i++)line([[-.43+i*.095,-.85],[-.43+i*.095,-.8]],'#674b35',.012);
      oval(0,-.82,.075,.05,'#ebcd88');
    }else if(kind==='aquarium'){
      box(-.48,-.38,.96,.4,'#604739');box(-.43,-.33,.4,.27,'#866245');box(.03,-.33,.4,.27,'#866245');oval(-.06,-.2,.018,.018,'#d4b66d');oval(.06,-.2,.018,.018,'#d4b66d');
      box(-.53,-1.12,1.06,.78,'#357a8d');box(-.48,-1.06,.96,.65,'#7dc5d0');box(-.48,-.51,.96,.1,'#d6bd83');
      for(const x of [-.34,.27,.37]){line([[x,-.48],[x-.025,-.69],[x+.02,-.86]],'#337b57',.03);line([[x,-.6],[x-.1,-.7]],'#68a95c',.025);}
      ctx.save();ctx.beginPath();ctx.rect(-.46,-1.04,.92,.56);ctx.clip();
      for(let i=0;i<4;i++){const phase=t*(.65+i*.09)+i*1.7+(seed||0)*.2;ctx.save();ctx.translate(Math.sin(phase)*.31,-.67-i*.085+Math.sin(phase*2)*.022);ctx.scale(Math.cos(phase)>=0?1:-1,1);fish(0,0,.25,['#ed963e','#e6d766','#d56663','#567ac6'][i]);ctx.restore();}
      for(let i=0;i<5;i++){const f=(t*.23+i*.21)%1;ctx.strokeStyle='#d2faff';ctx.lineWidth=.009;ctx.beginPath();ctx.arc(.38+Math.sin(t+i)*.02,-.48-f*.55,.012+(i%2)*.007,0,TAU);ctx.stroke();}ctx.restore();
      poly([[-.43,-1.04],[-.31,-1.04],[-.43,-.65]],'#ffffff55');line([[-.49,-1.08],[-.49,-.39],[.49,-.39],[.49,-1.08]],'#b8e4dd',.035);box(-.56,-1.15,1.12,.1,'#3f524e');box(-.55,-.42,1.1,.08,'#3f524e');
    }else if(kind==='fishing_basket'){
      line([[-.3,-.52],[-.27,-.88],[.25,-.88],[.32,-.5]],'#755333',.065);
      box(-.4,-.58,.8,.55,'#b98b4e',.1);
      ctx.save();rr(ctx,-.4,-.58,.8,.55,.1);ctx.clip();for(let i=0;i<10;i++)line([[-.5,-.08-i*.055],[.5,-.12-i*.055]],'#e1b778',.025);for(let i=0;i<12;i++)line([[-.5+i*.09,-.64],[-.38+i*.09,0]],'#805b32',.014);ctx.restore();
      oval(0,-.56,.42,.13,'#dbad6c');oval(0,-.58,.13,.045,'#5b4631');box(-.045,-.5,.09,.28,'#775136');box(-.055,-.32,.11,.08,'#c5aa61');
    }else if(kind.startsWith('fish_')){
      plaque();fish(.03,-.83,1.13,kind==='fish_trout'?'#638b7d':kind==='fish_bass'?'#74954e':'#7f9362',kind!=='fish_bass',kind==='fish_pike');
      box(-.25,-.48,.5,.085,'#ccb581');ctx.fillStyle='#493e2d';ctx.font='bold .055px sans-serif';ctx.textAlign='center';ctx.fillText(kind==='fish_trout'?'TRUITE MOUCHETÉE':kind==='fish_bass'?'ACHIGAN':'BROCHET',0,-.42);
    }else if(kind.startsWith('antlers_')){
      poly([[-.27,-1.05],[.27,-1.05],[.26,-.58],[0,-.39],[-.26,-.58]],'#684631');poly([[-.22,-1.0],[.22,-1.0],[.2,-.62],[0,-.46],[-.2,-.62]],'#9c714b');
      for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);line([[.04,-.84],[.22,-1.05],[.39,-1.25],[.46,-1.49]],'#d3b78c',.055);
        if(kind==='antlers_moose'){poly([[.18,-1.11],[.23,-1.38],[.34,-1.54],[.49,-1.48],[.48,-1.22],[.31,-1.08]],'#cdb087');for(let j=0;j<4;j++)line([[.24+j*.07,-1.32],[.23+j*.09,-1.58+(j%2)*.04]],'#e2cba5',.035);}
        else for(let j=0;j<3;j++)line([[.16+j*.09,-1.0-j*.11],[.12+j*.11,-1.24-j*.1]],'#e1c9a2',.03);ctx.restore();}
      oval(0,-.83,.09,.14,'#e4d2ad');
    }else if(kind==='fly_frame'){
      box(-.55,-1.22,1.1,.88,'#604331');box(-.49,-1.16,.98,.76,'#c49d64');box(-.44,-1.11,.88,.66,'#eee2c6');
      ['ROYAL','MUDDLER','SAUMON'].forEach((label,i)=>{const x=(i-1)*.28;line([[x-.07,-.77],[x+.08,-.77],[x+.1,-.69],[x+.06,-.67]],'#5b554b',.012);line([[x-.05,-.79],[x+.05,-.79]],['#b9533e','#aa8b4e','#617966'][i],.05);for(const sign of [-1,1]){line([[x,-.8],[x+sign*.09,-.99]],'#685a49',.016);line([[x,-.8],[x+sign*.12,-.92]],'#c7ad76',.025);}ctx.font='bold .047px sans-serif';ctx.textAlign='center';ctx.fillStyle='#64543d';ctx.fillText(label,x,-.52);});poly([[-.42,-1.09],[-.22,-1.09],[-.42,-.86]],'#ffffff77');
    }else if(kind==='lumber_saw'){
      plaque();box(-.44,-.94,.88,.23,'#b3bab4');for(let i=0;i<12;i++)poly([[-.44+i*.073,-.71],[-.405+i*.073,-.64],[-.37+i*.073,-.71]],'#c5ccc6');for(const x of [-.49,.39]){box(x,-1.02,.1,.4,'#5f3d23');box(x+.025,-.97,.05,.28,'#b17b42');}
      oval(.24,-.88,.055,.055,'#eccd7e');for(const x of [-.2,0,.13]){poly([[x,-.97],[x-.09,-.78],[x+.09,-.78]],'#4b7865');line([[x,-.81],[x,-.73]],'#725437',.02);}
    }else{
      box(-.3,-.19,.6,.18,'#443832');box(-.24,-.23,.48,.07,'#816343');box(-.14,-.12,.28,.06,'#d7bb7b');
      const color=kind==='trophy_star'?'#d4e3e9':kind==='trophy_shield'?'#bf8453':'#edc356';
      box(-.06,-.59,.12,.37,color);box(-.2,-.28,.4,.07,color);
      if(kind==='trophy_cup'){for(const sign of [-1,1]){ctx.strokeStyle='#cd9833';ctx.lineWidth=.055;ctx.beginPath();ctx.ellipse(sign*.27,-.85,.13,.17,0,0,TAU);ctx.stroke();}poly([[-.3,-1.08],[.3,-1.08],[.23,-.7],[.08,-.58],[-.08,-.58],[-.23,-.7]],color);oval(0,-1.08,.3,.06,'#ffe299');line([[-.18,-1.01],[-.15,-.77]],'#fff0b0',.04);}
      else if(kind==='trophy_star'){const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.15:.34;pts.push([Math.cos(a)*r,-.88+Math.sin(a)*r]);}poly(pts,color);poly([[0,-1.21],[0,-.88],[-.32,-.98]],'#f4fbff');}
      else {poly([[-.29,-1.16],[.29,-1.16],[.25,-.73],[0,-.54],[-.25,-.73]],color);poly([[-.23,-1.1],[.23,-1.1],[.19,-.77],[0,-.62],[-.19,-.77]],'#75533f');oval(0,-.88,.12,.15,'#dfb079');ctx.fillStyle='#765238';ctx.font='bold .19px serif';ctx.textAlign='center';ctx.fillText('1',0,-.82);}
    }
    ctx.restore();
  };

  S.drawTrapSaw=function(ctx,x,y,r,t){ctx.save();ctx.translate(x,y);ctx.rotate(t*6);ctx.fillStyle='#b8c9d8';ctx.strokeStyle='#53647b';ctx.lineWidth=Math.max(.012,r*.07);ctx.beginPath();for(let i=0;i<32;i++){const a=i/32*TAU,rr=r*(i%2?.72:1);i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#526378';circle(ctx,0,0,r*.23);ctx.fill();ctx.restore();};
  S.drawMechanism=function(ctx,kind,k){
    ctx.save();ctx.scale(k,k);const floor=['trap_spikes','trap_crusher','trap_gas'].includes(kind);
    ctx.fillStyle='#536178';rr(ctx,-.43,floor?-.2:-.7,.86,floor?.36:.72,.07);ctx.fill();ctx.fillStyle='#9aaabd';rr(ctx,-.37,floor?-.2:-.72,.74,.16,.03);ctx.fill();
    if(floor){for(let r=0;r<2;r++)for(let c=0;c<3;c++){ctx.fillStyle='#233145';ctx.beginPath();ctx.ellipse((c-1)*.24,(r-.5)*.12,.07,.035,0,0,TAU);ctx.fill();}ctx.strokeStyle=kind==='trap_spikes'?'#e6bc5f':kind==='trap_gas'?'#98cc68':'#e78863';ctx.lineWidth=.035;ctx.strokeRect(-.38,-.19,.76,.3);}
    else if(kind==='trap_saw'){S.drawTrapSaw(ctx,0,-.4,.26,0);}
    else{const color=kind==='trap_zap'?'#83e3ff':kind==='trap_dart'?'#b5de6c':kind==='trap_frost'?'#c2f1ff':'#ffac51';ctx.fillStyle='#263145';ctx.beginPath();ctx.ellipse(0,-.37,.26,.21,0,0,TAU);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=.055;ctx.stroke();
      if(kind==='trap_zap'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(.04,-.61);ctx.lineTo(-.12,-.34);ctx.lineTo(.02,-.34);ctx.lineTo(-.04,-.12);ctx.lineTo(.16,-.42);ctx.lineTo(.03,-.42);ctx.closePath();ctx.fill();}
      else if(kind==='trap_dart'){ctx.strokeStyle='#c9944e';ctx.lineWidth=.04;ctx.beginPath();ctx.moveTo(0,-.5);ctx.lineTo(0,-.17);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-.09,-.28);ctx.lineTo(0,-.09);ctx.lineTo(.09,-.28);ctx.closePath();ctx.fill();}
      else{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-.14,-.19);ctx.lineTo(0,-.57);ctx.lineTo(.14,-.19);ctx.closePath();ctx.fill();}}
    ctx.restore();
  };
  // Décors du château, dessinés dans la même palette et à la même échelle que le village.
  S.drawCastleDeco=function(ctx,kind,k,t,mounted=false,props={}){
    ctx.save();ctx.scale(k,k);ctx.lineJoin='round';ctx.lineCap='round';
    const gold='#e8b94f',light='#ffdf84',wood='#795039',dark='#493449',stone='#aab6c6',red='#a93658',blue='#496fb0';
    const box=(x,y,w,h,c)=>{ctx.fillStyle=c;rr(ctx,x,y,w,h,.025);ctx.fill();};
    const oval=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();};
    const line=(pts,c,w=.035)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
    const poly=(pts,c)=>{ctx.fillStyle=c;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
    const base=()=>{box(-.4,-.13,.8,.13,wood);};
    const shield=(x,y,size,c)=>{ctx.save();ctx.translate(x,y);ctx.scale(size,size);poly([[-.4,-.6],[.4,-.6],[.36,-.05],[0,.25],[-.36,-.05]],gold);poly([[-.32,-.52],[.32,-.52],[.27,-.08],[0,.14],[-.27,-.08]],c);line([[0,-.48],[0,.02]],light,.06);line([[-.2,-.28],[.2,-.28]],light,.06);ctx.restore();};
    const sword=(x,y,a=0)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);poly([[-.05,0],[-.05,-.75],[0,-.9],[.05,-.75],[.05,0]],'#dce8ef');line([[0,-.75],[0,-.1]],'#91a6bb',.015);line([[-.17,-.03],[.17,-.03]],gold,.055);line([[0,0],[0,.2]],wood,.07);oval(0,.21,.065,.05,gold);ctx.restore();};
    const crown=(x,y)=>{poly([[x-.3,y],[x-.35,y-.3],[x-.15,y-.2],[x,y-.43],[x+.15,y-.2],[x+.35,y-.3],[x+.3,y]],gold);line([[x-.26,y-.06],[x+.26,y-.06]],light,.04);for(const dx of [-.18,0,.18])oval(x+dx,y-.12,.04,.05,dx?blue:red);};
    const book=(x,y,w,c)=>{box(x,y,w,.12,c);box(x+.04,y+.025,w-.08,.055,'#f5dfaf');line([[x+.08,y],[x+.08,y+.12]],gold,.02);};
    if(!mounted)oval(0,.03,.48,.13,'rgba(0,0,0,.23)');
    switch(kind.slice(7)){
      case 'throne':box(-.36,-1.3,.72,1.15,gold);box(-.28,-1.22,.56,.83,red);crown(0,-1.27);box(-.4,-.48,.8,.23,red);for(const x of [-.4,.3]){box(x,-.7,.1,.7,gold);oval(x+.05,-.7,.08,.08,light);}line([[-.17,-.35],[.17,-.35]],'#ec7c89');break;
      case 'armor':base();for(const x of [-.23,.12]){box(x,-.42,.12,.35,stone);oval(x+.06,-.08,.13,.065,dark);}poly([[-.3,-.96],[.3,-.96],[.23,-.45],[-.23,-.45]],stone);line([[0,-.88],[0,-.5]],'#e3ecf5');oval(0,-1.2,.24,.27,stone);box(-.2,-1.26,.4,.075,dark);for(const x of [-.34,.34])oval(x,-.85,.14,.18,'#7f91a9');poly([[0,-1.43],[.03,-1.65],[.25,-1.58],[.09,-1.4]],red);break;
      case 'weapons':base();for(const x of [-.4,.4])box(x-.04,-1.25,.08,1.25,wood);box(-.44,-.95,.88,.12,wood);for(const x of [-.25,0,.25])sword(x,-.32,x*.25);break;
      case 'shieldstand':base();box(-.045,-1.15,.09,1.05,wood);shield(0,-.55,1,blue);break;
      case 'bed':box(-.5,-.53,1,.42,wood);box(-.46,-.6,.92,.32,red);box(-.4,-.63,.35,.2,'#fff0d1');for(const x of [-.5,.45])box(x,-1.45,.06,1.45,gold);poly([[-.55,-1.45],[0,-1.65],[.55,-1.45]],red);box(-.55,-1.45,1.1,.13,red);for(const x of [-.5,.33])poly([[x,-1.35],[x+.17,-1.35],[x+.12,-.7],[x,-.8]],'#cf5872');break;
      case 'carpet':poly([[-.45,-.38],[.45,-.38],[.55,.15],[-.55,.15]],gold);poly([[-.38,-.33],[.38,-.33],[.46,.09],[-.46,.09]],red);poly([[0,-.27],[.2,-.12],[0,.03],[-.2,-.12]],gold);for(let i=0;i<9;i++)line([[-.4+i*.1,.13],[-.4+i*.1,.23]],light,.018);break;
      case 'lectern':base();box(-.09,-.8,.18,.7,wood);poly([[-.43,-1.05],[.38,-1.05],[.5,-.65],[-.32,-.65]],wood);poly([[-.35,-1.02],[0,-.98],[.32,-1.02],[.42,-.72],[0,-.69],[-.26,-.72]],'#f8e4b4');line([[0,-.97],[0,-.7]],gold,.025);for(let i=0;i<3;i++)line([[-.25,-.94+i*.065],[-.06,-.92+i*.065]],'#9d7952',.015);break;
      case 'scrolls':for(let i=0;i<4;i++){const x=-.3+i*.17,y=-.22-i*.07;box(x,y-.45,.16,.55,'#f0d6a0');oval(x+.08,y-.45,.08,.04,'#fff0c9');line([[x,y-.1],[x+.16,y-.1]],red,.05);}break;
      case 'treasure':{
        let rng=(props.treasureSeed??73419)>>>0;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
        const levels=7+Math.floor(random()*3),lean=(random()-.5)*.18;
        for(let row=0;row<levels;row++){const n=Math.max(2,15-row*2),width=.49*(1-row/(levels+1));for(let i=0;i<n;i++){const x=(i/(n-1)*2-1)*width+lean*row/levels+(random()-.5)*.06,y=-.025-row*.085+(random()-.5)*.025,rx=.055+random()*.02;
          oval(x,y+.025,rx,.031,'#ac701e');oval(x,y,rx,.031,random()>.45?'#ffcf43':'#edb52e');ctx.strokeStyle='#d18b23';ctx.lineWidth=.008;ctx.beginPath();ctx.ellipse(x,y,rx*.7,.019,0,0,TAU);ctx.stroke();line([[x-rx*.4,y-.013],[x+rx*.3,y-.018]],'#fff1a0',.009);
        }}
        const gems=4+Math.floor(random()*3);for(let i=0;i<gems;i++){const x=(i/(gems-1)-.5)*.78+(random()-.5)*.08,y=-.13-(1-Math.abs(x)*1.6)*levels*.07+(random()-.5)*.12,size=.09+random()*.035,c=['#51c7ef','#87e6df','#b598f3'][i%3];
          poly([[x-size,y],[x-size*.55,y-size*.65],[x+size*.55,y-size*.65],[x+size,y],[x,y+size*1.25]],c);
          poly([[x-size,y],[x,y],[x,y+size*1.25]],'#2986bb');poly([[x-size*.55,y-size*.65],[x+size*.55,y-size*.65],[x,y]],'#e2fbff');line([[x-size,y],[x+size,y],[x,y+size*1.25],[x-size,y]],'#27678a',.012);
        }break;
      }
      case 'arch':for(const x of [-.5,.28]){box(x,-1.05,.22,1.05,stone);for(let i=0;i<4;i++)line([[x,-i*.24],[x+.22,-i*.24]],'#77879e',.018);}ctx.strokeStyle=stone;ctx.lineWidth=.24;ctx.beginPath();ctx.arc(0,-1.03,.39,Math.PI,TAU);ctx.stroke();box(-.1,-1.49,.2,.25,'#d3dce7');break;
      case 'cauldron':for(const x of [-.25,.25])line([[x,-.15],[x*1.3,.03]],dark,.07);oval(0,-.42,.43,.4,dark);oval(0,-.7,.43,.13,'#849a74');oval(0,-.71,.34,.09,'#a7d461');for(let i=0;i<3;i++)oval(-.2+i*.2,-.75-((t*.3+i*.27)%1)*.35,.035,.035,'#caeaa0');break;
      case 'hourglass':base();box(-.36,-1.2,.72,.1,gold);for(const x of [-.28,.28])line([[x,-1.1],[x,-.15]],wood,.06);poly([[-.24,-1.08],[.24,-1.08],[.04,-.63],[.24,-.18],[-.24,-.18],[-.04,-.63]],'#b3d9e0');poly([[-.17,-.92],[.17,-.92],[0,-.62]],gold);poly([[-.21,-.2],[.21,-.2],[0,-.47]],gold);line([[0,-.63],[0,-.4]],light,.02);break;
      case 'crown':oval(0,-.14,.43,.19,red);line([[-.35,-.06],[.35,-.06]],gold,.03);crown(0,-.22);break;
      case 'harp':base();line([[-.36,-.15],[-.33,-1.35],[.4,-1.1],[.2,-.15],[-.36,-.15]],gold,.09);for(let i=0;i<7;i++){const x=-.24+i*.075;line([[x,-1.27+i*.025],[x*.6,-.21]],light,.012);}break;
      case 'mirror':if(!mounted){base();line([[0,-.6],[0,-.1]],gold,.1);}oval(0,-.88,.38,.56,gold);oval(0,-.88,.31,.48,'#a9dce9');line([[-.17,-1.14],[.15,-.84]],'#f0fcff',.06);line([[-.18,-.96],[.04,-.75]],'#d8f4fa',.035);break;
      case 'globe':base();box(-.05,-.55,.1,.45,gold);oval(0,-.89,.38,.38,blue);ctx.strokeStyle=gold;ctx.lineWidth=.035;ctx.beginPath();ctx.ellipse(0,-.89,.44,.44,0,0,TAU);ctx.stroke();for(const x of [-.14,.14]){ctx.beginPath();ctx.ellipse(x,-.89,.12,.35,0,0,TAU);ctx.stroke();}line([[-.36,-.89],[.36,-.89]],light,.02);break;
      case 'chains':for(const x of [-.2,.2])for(let i=0;i<7;i++){ctx.strokeStyle=i%2?stone:'#65758c';ctx.lineWidth=.04;ctx.beginPath();ctx.ellipse(x,-1.3+i*.17,i%2?.06:.09,.11,0,0,TAU);ctx.stroke();}break;
      case 'cage':case 'portcullis':{const cage=kind==='castle_cage';box(-.48,-.12,.96,.12,stone);box(-.48,-1.27,.96,.12,stone);for(let i=0;i<5;i++){const x=-.4+i*.2;line([[x,-1.2],[x,-.1]],'#526174',.045);if(!cage)poly([[x-.04,-.12],[x+.04,-.12],[x,.08]],stone);}for(const y of [-.85,-.4])line([[-.44,y],[.44,y]],'#6d7d91',.04);if(cage)ctx.strokeStyle=stone,ctx.lineWidth=.045,ctx.beginPath(),ctx.ellipse(0,-1.28,.47,.16,0,Math.PI,TAU),ctx.stroke();break;}
      case 'tapestry':line([[-.5,-1.35],[.5,-1.35]],gold,.06);poly([[-.4,-1.3],[.4,-1.3],[.4,-.35],[0,-.15],[-.4,-.35]],red);shield(0,-.7,.6,blue);line([[-.34,-1.2],[-.34,-.4],[0,-.25],[.34,-.4],[.34,-1.2]],gold,.02);break;
      case 'glass':box(-.4,-1.15,.8,1,stone);oval(0,-1.15,.4,.35,stone);box(-.32,-1.14,.64,.9,blue);oval(0,-1.13,.32,.27,'#b582db');poly([[0,-1.35],[.28,-.92],[0,-.55],[-.28,-.92]],'#f7c662');poly([[0,-.55],[.29,-.27],[-.29,-.27]],'#65ba97');line([[0,-1.4],[0,-.23]],dark,.035);line([[-.32,-.65],[.32,-.65]],dark,.035);break;
      case 'wallshield':sword(-.18,-.25,-.55);sword(.18,-.25,.55);shield(0,-.58,.85,red);break;
      case 'swordstone':poly([[-.46,0],[-.4,-.4],[-.15,-.56],[.33,-.43],[.5,-.03]],'#8c9aaa');poly([[-.4,-.4],[-.15,-.56],[.33,-.43],[0,-.28]],'#c1cbd5');sword(0,-.7);break;
      case 'brazier':base();line([[0,-.1],[0,-.62]],dark,.09);poly([[-.4,-.85],[.4,-.85],[.23,-.55],[-.23,-.55]],dark);for(let i=0;i<3;i++){const x=(i-1)*.17;poly([[x-.13,-.85],[x,-1.25-Math.sin(t*7+i)*.08],[x+.12,-.85]],i===1?'#ffe188':'#ff8d42');}break;
      case 'pedestal':box(-.34,-.18,.68,.18,stone);box(-.22,-.84,.44,.66,'#c9d0db');box(-.38,-.95,.76,.15,stone);line([[-.12,-.76],[-.12,-.25]],'#f0f0e5',.035);break;
      case 'egg':oval(0,-.08,.43,.13,wood);oval(0,-.51,.29,.43,'#70aaa1');for(let i=0;i<9;i++)oval(Math.sin(i*3)*.17,-.25-(i%4)*.15,.06,.04,'#c7df9d');break;
      case 'chest':box(-.45,-.65,.9,.65,red);oval(0,-.65,.45,.2,red);for(const x of [-.32,.23])box(x,-.75,.09,.7,gold);box(-.1,-.48,.2,.2,gold);oval(0,-.37,.035,.045,dark);break;
      case 'quill':oval(0,-.1,.32,.12,gold);box(-.2,-.4,.4,.3,blue);oval(0,-.4,.18,.06,dark);line([[0,-.43],[.38,-1.23]],gold,.025);poly([[.07,-.64],[.13,-1.1],[.45,-1.35],[.43,-.92]],'#fff0d1');line([[.1,-.67],[.41,-1.24]],gold,.018);break;
      case 'books':book(-.42,-.14,.84,blue);book(-.35,-.28,.75,red);book(-.4,-.42,.7,'#5d9377');book(-.29,-.56,.7,'#8761a5');break;
      case 'chess':poly([[-.5,-.5],[.5,-.5],[.5,.04],[-.5,.04]],gold);for(let r=0;r<6;r++)for(let c=0;c<6;c++)box(-.45+c*.15,-.46+r*.075,.15,.075,(r+c)%2?dark:'#f0dcc0');for(const [x,y,c] of [[-.3,-.29,'#f4ddaf'],[.15,-.36,dark],[.3,-.12,dark]]){oval(x,y,.07,.035,c);box(x-.035,y-.15,.07,.15,c);oval(x,y-.18,.06,.06,c);}break;
      case 'barrel':box(-.33,-.8,.66,.7,wood);oval(0,-.8,.33,.12,'#b88b57');oval(0,-.1,.33,.09,wood);for(const y of [-.65,-.25])box(-.35,y,.7,.08,stone);line([[0,-.77],[0,-.15]],'#b58a54',.025);break;
      case 'food':oval(0,-.25,.43,.23,'#b88b57');box(-.4,-.3,.8,.3,'#ad7b47');for(let i=0;i<7;i++)line([[-.34+i*.11,-.28],[-.34+i*.11,-.02]],'#e0b779',.02);for(const x of [-.22,0,.22])oval(x,-.38,.12,.1,x===0?'#9bc256':'#db6852');poly([[.12,-.45],[.3,-.77],[.4,-.7],[.28,-.4]],'#f3cd85');break;
      case 'hay':box(-.48,-.54,.96,.53,'#d5ab51');for(let i=0;i<18;i++)line([[-.44+i*.05,-.5],[-.41+i*.05,-.02]],i%2?'#f2ce71':'#ba8b3c',.015);for(const x of [-.25,.25])box(x,-.56,.045,.58,wood);break;
      case 'bell':base();for(const x of [-.4,.35])box(x,-1.35,.05,1.35,wood);box(-.43,-1.4,.86,.08,wood);poly([[-.22,-1.1],[-.34,-.55],[.34,-.55],[.22,-1.1],[0,-1.24]],gold);oval(0,-.55,.35,.08,light);oval(0,-.5,.065,.09,dark);line([[0,-1.35],[0,-1.22]],dark,.04);break;
      case 'gong':base();for(const x of [-.43,.38])box(x,-1.4,.05,1.4,red);box(-.5,-1.45,1,.08,gold);oval(0,-.83,.39,.46,gold);oval(0,-.83,.3,.36,'#c58c32');oval(0,-.83,.1,.12,light);line([[.36,-.12],[.2,-.55]],wood,.04);oval(.2,-.55,.08,.08,dark);break;
    }
    ctx.restore();
  };
  S.drawDeco = function (ctx, kind, x, y, k, t, nb, seed, orientation=0, lightColor, props={}) {
    ctx.save(); ctx.translate(x, y); const sh = r => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, k * r, k * r * 0.4, 0, 0, TAU); ctx.fill(); };
    const rnd = n => { const v = Math.sin((seed || 1) * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
    const light=(alpha,fallback)=>BK.LIGHT_COLORS[lightColor]?.rgb?'rgba('+BK.LIGHT_COLORS[lightColor].rgb+','+alpha+')':fallback;
    const dir=((orientation%4)+4)%4;
    // Les objets restent verticaux : rotation autour de leur axe, jamais du dessin à plat.
    if(kind!=='chair'&&dir){if(dir===2)ctx.scale(-1,1);else ctx.transform(dir===1?.65:-.65,dir===1?.16:-.16,0,1,0,0);}
    if(kind==='waterjet'){sh(.4);ctx.fillStyle='#647f99';rr(ctx,-k*.3,-k*.65,k*.6,k*.65,k*.1);ctx.fill();ctx.strokeStyle='#b6e4ef';ctx.lineWidth=k*.08;circle(ctx,0,-k*.36,k*.2);ctx.stroke();ctx.fillStyle='#259dd9';circle(ctx,0,-k*.36,k*.14);ctx.fill();}
    if(kind==='firebar'){sh(.4);ctx.fillStyle='#635979';rr(ctx,-k*.32,-k*.35,k*.64,k*.4,k*.07);ctx.fill();ctx.fillStyle='#a695b7';circle(ctx,0,-k*.19,k*.23);ctx.fill();ctx.fillStyle='#ffc857';circle(ctx,0,-k*.19,k*.1);ctx.fill();}
    else if(kind.startsWith('trap_')){S.drawMechanism(ctx,kind,k);}
    else if(BK.BIOME_DECOR.some(it=>it.deco===kind)){S.drawBiomeDeco(ctx,kind,k,t);}
    else if(kind.startsWith('castle_')){S.drawCastleDeco(ctx,kind,k,t,false,props);}
    else if(CABIN_KINDS.has(kind)){S.drawCabinDeco(ctx,kind,k,t,seed,false,props);}
    else if(['table_round','table_dining','table_low'].includes(kind)){
      const low=kind==='table_low',round=kind==='table_round',h=low?.36:.7;sh(.55);
      ctx.strokeStyle='#50331e';ctx.lineWidth=Math.max(1,k*.022);
      if(round){
        ctx.fillStyle='#6d4428';ctx.beginPath();ctx.ellipse(0,-k*.04,k*.3,k*.11,0,0,TAU);ctx.fill();ctx.stroke();
        rr(ctx,-k*.08,-k*h,k*.16,k*h,k*.03);ctx.fill();ctx.stroke();
      }else{
        for(const x of [-.42,.42])for(const back of [true,false]){ctx.fillStyle=low?'#624337':'#b77d45';rr(ctx,k*x-k*.04,-k*(h+(back?.16:-.1)),k*.08,k*(h+(back?.16:-.1)),k*.015);ctx.fill();ctx.stroke();}
        if(low){ctx.fillStyle='#7e5642';rr(ctx,-k*.43,-k*.18,k*.86,k*.13,k*.02);ctx.fill();ctx.stroke();}
      }
      ctx.fillStyle=round?'#a66c32':low?'#5d3c2e':'#b68149';
      if(round){ctx.beginPath();ctx.ellipse(0,-k*h,k*.53,k*.25,0,0,TAU);}else rr(ctx,-k*.55,-k*(h+.2),k*1.1,k*.42,k*.035);ctx.fill();ctx.stroke();
      ctx.fillStyle=round?'#e2b571':low?'#98664d':'#e8bf82';
      if(round){ctx.beginPath();ctx.ellipse(0,-k*(h+.055),k*.53,k*.24,0,0,TAU);}else rr(ctx,-k*.55,-k*(h+.25),k*1.1,k*.4,k*.035);ctx.fill();ctx.stroke();
      if(kind==='table_dining'){ctx.fillStyle='#ecf0dd';rr(ctx,-k*.15,-k*(h+.25),k*.3,k*.45,k*.02);ctx.fill();ctx.fillStyle='#5b9b9d';rr(ctx,-k*.11,-k*(h+.25),k*.04,k*.45,0);ctx.fill();}
      else {ctx.strokeStyle=round?'#bf8c4e':'#b58461';ctx.beginPath();ctx.moveTo(-k*.35,-k*(h+.06));ctx.lineTo(k*.35,-k*(h+.06));ctx.stroke();}
    } else if(kind==='fireplace'){
      sh(.5);ctx.lineWidth=Math.max(1,k*.025);ctx.strokeStyle='#554d43';
      ctx.fillStyle='#746a5c';rr(ctx,-k*.48,-k*1.25,k*.96,k*1.25,k*.04);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#a99a83';ctx.lineWidth=Math.max(1,k*.02);for(let row=0;row<5;row++){const y=-k*1.22+row*k*.24;ctx.beginPath();ctx.moveTo(-k*.46,y);ctx.lineTo(k*.46,y);ctx.stroke();for(const x of row%2?[-.23,.23]:[0]){ctx.beginPath();ctx.moveTo(k*x,y);ctx.lineTo(k*x,y+k*.23);ctx.stroke();}}
      ctx.fillStyle='#3e2d23';rr(ctx,-k*.31,-k*.82,k*.62,k*.74,k*.12);ctx.fill();ctx.strokeStyle='#b6a084';ctx.lineWidth=k*.07;ctx.stroke();
      ctx.fillStyle='#b09b7c';rr(ctx,-k*.54,-k*1.3,k*1.08,k*.14,k*.035);ctx.fill();rr(ctx,-k*.54,-k*.09,k*1.08,k*.16,k*.035);ctx.fill();
      const glow=ctx.createRadialGradient(0,-k*.34,0,0,-k*.34,k*.42);glow.addColorStop(0,light(.6,'rgba(255,157,42,.6)'));glow.addColorStop(1,light(0,'rgba(255,125,35,0)'));ctx.fillStyle=glow;ctx.fillRect(-k*.4,-k*.8,k*.8,k*.8);
      ctx.strokeStyle='#70401f';ctx.lineWidth=k*.09;for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(-k*.22,-k*(.19+sign*.06));ctx.lineTo(k*.22,-k*(.19-sign*.06));ctx.stroke();}
      for(let i=0;i<3;i++){const x=(i-1)*k*.14,h=k*(.32+.08*Math.sin(t*7+i*2));ctx.fillStyle=i===1?light(1,'#ffe98b'):light(1,'#ff8b2c');ctx.beginPath();ctx.moveTo(x-k*.1,-k*.2);ctx.quadraticCurveTo(x-k*.13,-k*.3,x+Math.sin(t*5+i)*k*.04,-k*.2-h);ctx.quadraticCurveTo(x+k*.16,-k*.28,x+k*.1,-k*.2);ctx.closePath();ctx.fill();}
    } else if(kind==='chair'&&dir){
      sh(.34);ctx.save();if(dir===3)ctx.scale(-1,1);
      const side=dir!==2;ctx.strokeStyle='#59371d';ctx.lineWidth=Math.max(1,k*.025);
      for(const x of [-.23,.23]){ctx.fillStyle='#996432';rr(ctx,x*k-k*.035,-k*.53,k*.07,k*.53,k*.015);ctx.fill();ctx.stroke();}
      ctx.fillStyle='#dca660';ctx.beginPath();ctx.ellipse(0,-k*.53,k*.34,k*.15,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle='#a9743b';rr(ctx,side?k*.2:-k*.28,-k*1.05,side?k*.09:k*.56,k*.6,k*.035);ctx.fill();ctx.stroke();
      if(!side){ctx.fillStyle='#80512b';rr(ctx,-k*.22,-k*.97,k*.44,k*.24,k*.02);ctx.fill();ctx.stroke();}
      ctx.restore();
    } else if(kind==='chair'||kind==='stool'){
      const chair=kind==='chair',h=chair?.5:.38;sh(.34);
      ctx.strokeStyle='#59371d';ctx.lineWidth=Math.max(1,k*.025);
      for(const x of [-.23,.23])for(const back of [true,false]){ctx.fillStyle=back?'#79502b':'#a26a36';rr(ctx,k*x-k*.035,-k*(h+(back?.12:0)),k*.07,k*(h+(back?.12:0)),k*.015);ctx.fill();ctx.stroke();}
      if(chair){ctx.fillStyle='#a9743b';rr(ctx,-k*.28,-k*1.05,k*.56,k*.48,k*.055);ctx.fill();ctx.stroke();ctx.fillStyle='#e1b371';rr(ctx,-k*.21,-k*.97,k*.42,k*.23,k*.025);ctx.fill();ctx.strokeStyle='#85562d';for(const x of [-.11,.11]){ctx.beginPath();ctx.moveTo(k*x,-k*.96);ctx.lineTo(k*x,-k*.76);ctx.stroke();}}
      ctx.fillStyle='#98602e';ctx.beginPath();ctx.ellipse(0,-k*h,k*.34,k*.16,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle='#dca660';ctx.beginPath();ctx.ellipse(0,-k*(h+.045),k*.34,k*.15,0,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#b78547';ctx.beginPath();ctx.moveTo(-k*.24,-k*(h+.07));ctx.lineTo(k*.24,-k*(h+.07));ctx.stroke();
    } else if (kind === 'lamp') {
      sh(0.22); ctx.fillStyle = '#2f3540'; rr(ctx, -k * 0.12, -k * 0.1, k * 0.24, k * 0.1, k * 0.03); ctx.fill(); ctx.fillStyle = '#3e4553'; rr(ctx, -k * 0.035, -k * 1.5, k * 0.07, k * 1.42, k * 0.02); ctx.fill();
      const glow = 0.5 + 0.1 * Math.sin(t * 6); const g = ctx.createRadialGradient(0, -k * 1.55, k * 0.05, 0, -k * 1.55, k * 0.6); g.addColorStop(0, light(glow,'rgba(255,230,140,' + glow + ')')); g.addColorStop(1, light(0,'rgba(255,230,140,0)')); ctx.fillStyle = g; circle(ctx, 0, -k * 1.55, k * 0.6); ctx.fill();
      ctx.fillStyle = '#2f3540'; ctx.beginPath(); ctx.moveTo(-k * 0.2, -k * 1.4); ctx.lineTo(k * 0.2, -k * 1.4); ctx.lineTo(k * 0.14, -k * 1.75); ctx.lineTo(-k * 0.14, -k * 1.75); ctx.closePath(); ctx.fill();
      ctx.fillStyle = light(1,'#fff2a8'); rr(ctx, -k * 0.12, -k * 1.7, k * 0.24, k * 0.26, k * 0.03); ctx.fill(); ctx.fillStyle = '#2f3540'; ctx.beginPath(); ctx.moveTo(-k * 0.17, -k * 1.75); ctx.lineTo(0, -k * 1.9); ctx.lineTo(k * 0.17, -k * 1.75); ctx.closePath(); ctx.fill();
    } else if (kind === 'bench') {
      sh(0.4); ctx.fillStyle = '#5a3a1a'; for (const sx of [-0.3, 0.3]) { rr(ctx, k * sx - k * 0.04, -k * 0.4, k * 0.08, k * 0.4, k * 0.02); ctx.fill(); }
      ctx.fillStyle = '#a0703a'; rr(ctx, -k * 0.42, -k * 0.5, k * 0.84, k * 0.16, k * 0.03); ctx.fill(); ctx.fillStyle = '#b07a3e'; rr(ctx, -k * 0.42, -k * 0.82, k * 0.84, k * 0.12, k * 0.03); ctx.fill(); rr(ctx, -k * 0.42, -k * 0.66, k * 0.84, k * 0.1, k * 0.03); ctx.fill();
      ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-k * 0.42, -k * 0.42); ctx.lineTo(k * 0.42, -k * 0.42); ctx.stroke();
    } else if (kind === 'tomb') {
      sh(0.3); ctx.fillStyle = '#7f8794'; ctx.beginPath(); ctx.moveTo(-k * 0.26, -k * 0.05); ctx.lineTo(-k * 0.26, -k * 0.6); ctx.arc(0, -k * 0.6, k * 0.26, Math.PI, TAU); ctx.lineTo(k * 0.26, -k * 0.05); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#4f5761'; ctx.lineWidth = Math.max(1, k * 0.03); ctx.stroke(); ctx.fillStyle = '#4f5761'; rr(ctx, -k * 0.03, -k * 0.7, k * 0.06, k * 0.32, 1); ctx.fill(); rr(ctx, -k * 0.12, -k * 0.62, k * 0.24, k * 0.06, 1); ctx.fill();
      ctx.fillStyle = '#5fb84a'; ctx.beginPath(); ctx.ellipse(k * 0.2, -k * 0.04, k * 0.16, k * 0.07, 0, 0, TAU); ctx.fill();
    } else if (BK.STATUES.includes(kind) && kind !== 'statue') {
      S.drawStoneStatue(ctx, kind, k);
    } else if (kind === 'statue') {
      sh(0.34); ctx.fillStyle = '#8f98a3'; rr(ctx, -k * 0.3, -k * 0.3, k * 0.6, k * 0.3, k * 0.04); ctx.fill(); ctx.fillStyle = '#b8c0c9'; rr(ctx, -k * 0.26, -k * 0.34, k * 0.52, k * 0.08, k * 0.02); ctx.fill();
      ctx.save(); ctx.translate(0, -k * 0.34); const sdef = { size: 0.9, outfit: '#9aa3ad', accent: '#7a838d', antenna: '#b8c0c9', skin: '#b8c0c9', hair: '#8f98a3', familyPortrait: '__statue__' };
      S.drawCharacter(ctx, sdef, { s: k * 0.75, pose: 'win', t: 0, view: 'front' }); ctx.restore();
    } else if (kind === 'well') {
      sh(0.42); ctx.fillStyle = '#7f8794'; ctx.beginPath(); ctx.ellipse(0, -k * 0.32, k * 0.4, k * 0.18, 0, 0, Math.PI); ctx.lineTo(-k * 0.4, -k * 0.32); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8f98a3'; ctx.fillRect(-k * 0.4, -k * 0.32, k * 0.8, k * 0.3); ctx.fillStyle = '#6b7380'; ctx.beginPath(); ctx.ellipse(0, -k * 0.02, k * 0.4, k * 0.18, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#2b3a55'; ctx.beginPath(); ctx.ellipse(0, -k * 0.32, k * 0.3, k * 0.12, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4f5761'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-k * 0.4, -k * 0.32 + k * 0.1 * (i + 1)); ctx.lineTo(k * 0.4, -k * 0.32 + k * 0.1 * (i + 1)); ctx.stroke(); }
      ctx.fillStyle = '#6b4a2a'; for (const sx of [-0.34, 0.34]) ctx.fillRect(k * sx - k * 0.03, -k * 1.0, k * 0.06, k * 0.7); ctx.fillStyle = '#b5452a'; ctx.beginPath(); ctx.moveTo(-k * 0.5, -k * 0.95); ctx.lineTo(0, -k * 1.25); ctx.lineTo(k * 0.5, -k * 0.95); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -k * 0.95); ctx.lineTo(0, -k * 0.5); ctx.stroke(); ctx.fillStyle = '#5a3a1a'; rr(ctx, -k * 0.08, -k * 0.56, k * 0.16, k * 0.14, k * 0.02); ctx.fill();
    } else if (kind === 'fence') {
      nb = nb || {}; ctx.fillStyle = '#a0703a'; const post = (px) => { rr(ctx, px - k * 0.05, -k * 0.55, k * 0.1, k * 0.55, k * 0.02); ctx.fill(); ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.moveTo(px - k * 0.06, -k * 0.55); ctx.lineTo(px, -k * 0.64); ctx.lineTo(px + k * 0.06, -k * 0.55); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#a0703a'; };
      const rail = (x0, x1, yy) => { ctx.fillStyle = '#b07a3e'; rr(ctx, x0, yy, x1 - x0, k * 0.07, 1); ctx.fill(); };
      if (nb.w || nb.e) { rail(nb.w ? -k * 0.5 : 0, nb.e ? k * 0.5 : 0, -k * 0.45); rail(nb.w ? -k * 0.5 : 0, nb.e ? k * 0.5 : 0, -k * 0.25); }
      if (nb.n) { ctx.fillStyle = '#9a6a35'; rr(ctx, -k * 0.035, -k * 0.75, k * 0.07, k * 0.35, 1); ctx.fill(); } if (nb.s) { ctx.fillStyle = '#9a6a35'; rr(ctx, -k * 0.035, -k * 0.45, k * 0.07, k * 0.45, 1); ctx.fill(); }
      post(0);
    } else if (kind === 'mushrooms') {
      for (let i = 0; i < 3; i++) { const mx = (rnd(i) - 0.5) * k * 0.5, my = (rnd(i + 3) - 0.5) * k * 0.2, mh = k * (0.12 + rnd(i + 6) * 0.1), col = ['#d9342b', '#f4c430', '#b48cf0'][i]; ctx.fillStyle = '#f4e2b8'; rr(ctx, mx - k * 0.035, my - mh, k * 0.07, mh, k * 0.02); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(mx, my - mh, k * 0.1, k * 0.07, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; circle(ctx, mx - k * 0.03, my - mh - k * 0.03, k * 0.015); ctx.fill(); }
    } else if (kind === 'grass') {
      ctx.strokeStyle = '#3a9d45'; ctx.lineWidth = Math.max(1, k * 0.03); ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const gx = (rnd(i) - 0.5) * k * 0.8, gy = (rnd(i + 9) - 0.5) * k * 0.35, h = k * (0.15 + rnd(i + 18) * 0.2), sway = Math.sin(t * 2 + i) * k * 0.03; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + sway, gy - h * 0.6, gx + sway * 2 + k * 0.03, gy - h); ctx.stroke(); }
    } else if (kind === 'melon' || kind === 'cheese' || kind === 'gift' || kind === 'dirtblock') {
      // blocs cubiques aux coins arrondis (style Minecraft) : face avant et dessus en biais ; ils se cassent avec une bombe
      sh(0.42); const w = k * 0.84, hh = w * 0.9, dep = w * 0.14, R = w * 0.12;
      const C = { melon: ['#2e7d32', '#4caf50', '#1b5e20'], cheese: ['#f4c430', '#ffe066', '#c99a00'], gift: ['#d9342b', '#ef5350', '#8e1c14'], dirtblock: ['#7d5428', '#5fb84a', '#4a2f14'] }[kind];
      const topFace = (fn) => { ctx.save(); ctx.translate(0, -hh); ctx.transform(1, 0, -1, 1, 0, 0); rr(ctx, -w / 2, -dep, w, dep, Math.min(R, dep * 0.5)); ctx.clip(); ctx.fillStyle = C[1]; ctx.fillRect(-w, -dep - 1, w * 3, dep + 2); fn && fn(); ctx.restore(); };
      ctx.fillStyle = C[0]; rr(ctx, -w / 2, -hh, w, hh, R); ctx.fill();
      ctx.save(); rr(ctx, -w / 2, -hh, w, hh, R); ctx.clip();
      if (kind === 'melon') { ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = Math.max(2, w * 0.07); for (let i = 0; i < 4; i++) { const x = -w * 0.36 + i * w * 0.24; ctx.beginPath(); ctx.moveTo(x, -hh); ctx.quadraticCurveTo(x + w * 0.08, -hh * 0.75, x, -hh * 0.5); ctx.quadraticCurveTo(x - w * 0.08, -hh * 0.25, x, 0); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.18)'; rr(ctx, -w * 0.42, -hh * 0.92, w * 0.2, hh * 0.3, R * 0.5); ctx.fill(); }
      else if (kind === 'cheese') { ctx.fillStyle = C[2]; for (const [x, y, s2] of [[-0.25, -0.65, 0.11], [0.2, -0.75, 0.08], [0.28, -0.3, 0.13], [-0.2, -0.25, 0.07], [0.02, -0.5, 0.06]]) { ctx.beginPath(); ctx.ellipse(x * w, y * hh, s2 * w, s2 * w * 0.8, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,0.25)'; rr(ctx, -w * 0.42, -hh * 0.92, w * 0.18, hh * 0.25, R * 0.5); ctx.fill(); }
      else if (kind === 'gift') { ctx.fillStyle = '#ffd54a'; ctx.fillRect(-w * 0.09, -hh, w * 0.18, hh); ctx.fillRect(-w / 2, -hh * 0.58, w, hh * 0.16); ctx.fillStyle = 'rgba(255,255,255,0.2)'; rr(ctx, -w * 0.44, -hh * 0.92, w * 0.22, hh * 0.28, R * 0.5); ctx.fill(); }
      else { ctx.fillStyle = C[2]; for (let i = 0; i < 9; i++) { const x = (rnd(i) - 0.5) * w * 0.85, y = -hh * (0.1 + rnd(i + 9) * 0.6); ctx.beginPath(); ctx.ellipse(x, y, w * 0.05, w * 0.035, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = C[1]; ctx.beginPath(); ctx.moveTo(-w / 2, -hh); ctx.lineTo(w / 2, -hh); for (let i = 8; i >= 0; i--) ctx.lineTo(-w / 2 + i * w / 8, -hh * (0.78 + (i % 2 ? 0.08 : 0) + rnd(i + 20) * 0.04)); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#4caf50'; ctx.fillRect(-w / 2, -hh, w, hh * 0.05); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1, k * 0.03); rr(ctx, -w / 2, -hh, w, hh, R); ctx.stroke();
      topFace(kind === 'melon' ? () => { ctx.strokeStyle = '#81c784'; ctx.lineWidth = Math.max(1.5, w * 0.05); for (let i = 0; i < 4; i++) { const x = -w * 0.36 + i * w * 0.24; ctx.beginPath(); ctx.moveTo(x, -dep); ctx.lineTo(x, 0); ctx.stroke(); } } : kind === 'gift' ? () => { ctx.fillStyle = '#ffd54a'; ctx.fillRect(-w * 0.09, -dep, w * 0.18, dep); ctx.fillRect(-w, -dep * 0.6, w * 3, dep * 0.2); } : kind === 'cheese' ? () => { ctx.fillStyle = C[2]; ctx.beginPath(); ctx.ellipse(w * 0.15, -dep * 0.5, w * 0.08, dep * 0.3, 0, 0, TAU); ctx.fill(); } : null);
      if (kind === 'melon') { ctx.fillStyle = '#6d4c41'; rr(ctx, w * 0.02, -hh - dep - k * 0.08, k * 0.06, k * 0.1, 2); ctx.fill(); }
      if (kind === 'gift') { ctx.fillStyle = '#ffd54a'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(w * 0.08 + sgn * w * 0.11, -hh - dep * 0.45, w * 0.12, w * 0.07, sgn * 0.5, 0, TAU); ctx.fill(); } circle(ctx, w * 0.08, -hh - dep * 0.45, w * 0.04); ctx.fill(); }
    } else if (kind === 'carrot') {
      // carotte plantée : fanes vertes qui dépassent du sol, le haut orange visible ; on marche dessus pour la cueillir
      sh(0.18); ctx.fillStyle = '#ff8a1f'; ctx.beginPath(); ctx.ellipse(0, -k * 0.04, k * 0.13, k * 0.07, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7d5428'; ctx.beginPath(); ctx.ellipse(0, 0, k * 0.2, k * 0.06, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff8a1f'; ctx.beginPath(); ctx.ellipse(0, -k * 0.05, k * 0.12, k * 0.06, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3fae4a'; ctx.lineWidth = Math.max(1.5, k * 0.05); ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.42 + Math.sin(t * 2 + i) * 0.05, L = k * (0.3 + (i % 2) * 0.12); ctx.beginPath(); ctx.moveTo(0, -k * 0.06); ctx.quadraticCurveTo(Math.sin(a) * L * 0.5, -k * 0.06 - L * 0.5, Math.sin(a) * L, -k * 0.06 - Math.cos(a) * L); ctx.stroke(); }
    } else if (kind === 'crate') {
      sh(0.4); const w = k * 0.8; ctx.fillStyle = '#b07a3e'; ctx.fillRect(-w / 2, -w * 0.9, w, w * 0.9); ctx.fillStyle = '#c98f4f'; ctx.beginPath(); ctx.moveTo(-w / 2, -w * 0.9); ctx.lineTo(-w / 2 + w * 0.12, -w * 1.02); ctx.lineTo(w / 2 + w * 0.12, -w * 1.02); ctx.lineTo(w / 2, -w * 0.9); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(1.5, k * 0.04); ctx.strokeRect(-w / 2, -w * 0.9, w, w * 0.9); ctx.beginPath(); ctx.moveTo(-w / 2, -w * 0.9); ctx.lineTo(w / 2, 0); ctx.moveTo(w / 2, -w * 0.9); ctx.lineTo(-w / 2, 0); ctx.stroke();
    } else if (kind === 'campfire') {
      sh(0.35); ctx.fillStyle = '#5a5a5a'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; circle(ctx, Math.cos(a) * k * 0.32, Math.sin(a) * k * 0.14, k * 0.07); ctx.fill(); }
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, k * 0.08); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-k * 0.22, -k * 0.02); ctx.lineTo(k * 0.22, -k * 0.14); ctx.moveTo(k * 0.22, -k * 0.02); ctx.lineTo(-k * 0.22, -k * 0.14); ctx.stroke();
      for (let i = 0; i < 3; i++) { const f = (t * 3 + i * 0.7) % 1, hh = k * (0.35 + 0.15 * Math.sin(t * 9 + i)); const g = ctx.createRadialGradient(0, -k * 0.25, 0, 0, -k * 0.25, hh); g.addColorStop(0, light(0.95,'rgba(255,240,160,0.95)')); g.addColorStop(0.5, light(0.8,'rgba(255,150,40,0.8)')); g.addColorStop(1, light(0,'rgba(230,60,20,0)')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-k * 0.2, -k * 0.08); ctx.quadraticCurveTo(-k * 0.1 + Math.sin(t * 7 + i) * k * 0.05, -hh * 0.6, 0, -k * 0.1 - hh); ctx.quadraticCurveTo(k * 0.1, -hh * 0.6, k * 0.2, -k * 0.08); ctx.closePath(); ctx.fill(); void f; }
      ctx.fillStyle = 'rgba(120,120,120,0.45)'; for (let i = 0; i < 3; i++) { const u = ((t * 0.4 + i * 0.33) % 1); ctx.globalAlpha = 0.5 * (1 - u); circle(ctx, Math.sin(t + i * 2) * k * 0.08, -k * 0.6 - u * k * 0.9, k * (0.06 + u * 0.1)); ctx.fill(); } ctx.globalAlpha = 1;
    } else if (kind === 'pumpkin') {
      sh(0.34); const g = ctx.createRadialGradient(-k * 0.1, -k * 0.35, k * 0.05, 0, -k * 0.25, k * 0.4); g.addColorStop(0, '#ffb347'); g.addColorStop(1, '#d9681f'); ctx.fillStyle = g;
      for (const sx of [-0.2, 0.2, 0]) { ctx.beginPath(); ctx.ellipse(k * sx, -k * 0.25, k * 0.22, k * 0.26, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(120,50,10,0.4)'; ctx.lineWidth = 1; for (const sx of [-0.1, 0.1]) { ctx.beginPath(); ctx.ellipse(k * sx, -k * 0.25, k * 0.1, k * 0.26, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#3a9d45'; rr(ctx, -k * 0.04, -k * 0.6, k * 0.08, k * 0.14, k * 0.02); ctx.fill();
      ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.moveTo(-k * 0.2, -k * 0.3); ctx.lineTo(-k * 0.1, -k * 0.4); ctx.lineTo(-k * 0.06, -k * 0.28); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(k * 0.2, -k * 0.3); ctx.lineTo(k * 0.1, -k * 0.4); ctx.lineTo(k * 0.06, -k * 0.28); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-k * 0.18, -k * 0.16); ctx.lineTo(-k * 0.1, -k * 0.08); ctx.lineTo(0, -k * 0.15); ctx.lineTo(k * 0.1, -k * 0.08); ctx.lineTo(k * 0.18, -k * 0.16); ctx.lineTo(0, -k * 0.2); ctx.closePath(); ctx.fill();
    } else if (kind === 'chest') {
      if(props.open){ctx.fillStyle='#ffd54a';for(let i=0;i<5;i++){circle(ctx,(i-2)*k*.12,-k*(.7+(i%2)*.2),k*.08);ctx.fill();}}
      sh(0.38); const w = k * 0.7; ctx.fillStyle = '#8a5a2a'; rr(ctx, -w / 2, -k * 0.42, w, k * 0.42, k * 0.04); ctx.fill(); ctx.fillStyle = '#a0703a'; rr(ctx, -w / 2, -k * 0.62, w, k * 0.24, k * 0.1); ctx.fill();
      ctx.fillStyle = '#ffd54a'; ctx.fillRect(-w / 2, -k * 0.42, w, k * 0.05); ctx.fillRect(-w * 0.4, -k * 0.62, k * 0.05, k * 0.62); ctx.fillRect(w * 0.4 - k * 0.05, -k * 0.62, k * 0.05, k * 0.62); rr(ctx, -k * 0.07, -k * 0.46, k * 0.14, k * 0.14, k * 0.03); ctx.fill(); ctx.fillStyle = '#5a3a1a'; circle(ctx, 0, -k * 0.38, k * 0.025); ctx.fill();
    } else if (kind === 'log') {
      sh(0.42); ctx.fillStyle = '#7a4f24'; rr(ctx, -k * 0.45, -k * 0.34, k * 0.9, k * 0.32, k * 0.16); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,5,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-k * 0.4, -k * 0.28 + i * k * 0.09); ctx.lineTo(k * 0.3, -k * 0.28 + i * k * 0.09); ctx.stroke(); }
      ctx.fillStyle = '#d9b382'; ctx.beginPath(); ctx.ellipse(k * 0.42, -k * 0.18, k * 0.09, k * 0.16, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a0703a'; ctx.beginPath(); ctx.ellipse(k * 0.42, -k * 0.18, k * 0.05, k * 0.09, 0, 0, TAU); ctx.stroke();
    } else if (kind === 'shelf') {
      sh(0.4); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-k * 0.42, -k * 1.5, k * 0.84, k * 1.5); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-k * 0.38, -k * 1.46, k * 0.76, k * 1.42);
      for (let i = 0; i < 3; i++) { const yy = -k * (0.45 + i * 0.45); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-k * 0.4, yy, k * 0.8, k * 0.06); for (let j = 0; j < 3; j++) { const col = ['#d9342b', '#3f9cff', '#49e26a', '#ffd54a', '#b48cf0', '#ff8a1f'][(i * 3 + j + (seed || 0)) % 6]; ctx.fillStyle = col; rr(ctx, -k * 0.3 + j * k * 0.24, yy - k * 0.3, k * 0.14, k * 0.3, k * 0.04); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-k * 0.3 + j * k * 0.24 + k * 0.02, yy - k * 0.28, k * 0.03, k * 0.2); } }
    } else if (kind === 'pillar') {
      sh(0.36); ctx.fillStyle = '#8f98a3'; rr(ctx, -k * 0.32, -k * 0.12, k * 0.64, k * 0.12, k * 0.02); ctx.fill(); const g = ctx.createLinearGradient(-k * 0.24, 0, k * 0.24, 0); g.addColorStop(0, '#6f7883'); g.addColorStop(0.4, '#c4ccd4'); g.addColorStop(1, '#6f7883'); ctx.fillStyle = g; ctx.fillRect(-k * 0.24, -k * 1.5, k * 0.48, k * 1.38);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; for (const sx of [-0.12, 0, 0.12]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 1.5); ctx.lineTo(k * sx, -k * 0.12); ctx.stroke(); }
      ctx.fillStyle = '#b8c0c9'; rr(ctx, -k * 0.32, -k * 1.62, k * 0.64, k * 0.14, k * 0.02); ctx.fill();
    } else if (S.decoExtra[kind]) S.decoExtra[kind](ctx, k, t, nb, seed, sh, rnd, light);
    ctx.restore();
  };
  // ---------------------------------------------------------------- 20 décorations de plus (extérieur et intérieur)
  // Chaque fonction dessine à l'origine (centre de la case, au sol) ; k = taille d'une case en pixels, t = temps.
  const flame = (ctx, x, y, k, h, t, i, light=(a,f)=>f) => { const hh = h * (0.85 + 0.15 * Math.sin(t * 9 + i)); const g = ctx.createRadialGradient(x, y, 0, x, y, hh); g.addColorStop(0, light(0.95,'rgba(255,240,160,0.95)')); g.addColorStop(0.5, light(0.85,'rgba(255,150,40,0.85)')); g.addColorStop(1, light(0,'rgba(230,60,20,0)')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - k * 0.12, y); ctx.quadraticCurveTo(x - k * 0.05 + Math.sin(t * 7 + i) * k * 0.03, y - hh * 0.6, x, y - hh); ctx.quadraticCurveTo(x + k * 0.05, y - hh * 0.6, x + k * 0.12, y); ctx.closePath(); ctx.fill(); };
  S.decoExtra = {
    wheel(ctx, k, t, nb, seed, sh) {
      sh(0.3); ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(3, k * 0.1); circle(ctx, 0, -k * 0.5, k * 0.45); ctx.stroke(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = Math.max(1.5, k * 0.05); circle(ctx, 0, -k * 0.5, k * 0.5); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = Math.max(2, k * 0.06); ctx.beginPath(); ctx.moveTo(-Math.cos(a) * k * 0.42, -k * 0.5 - Math.sin(a) * k * 0.42); ctx.lineTo(Math.cos(a) * k * 0.42, -k * 0.5 + Math.sin(a) * k * 0.42); ctx.stroke(); }
      ctx.fillStyle = '#4a4a50'; circle(ctx, 0, -k * 0.5, k * 0.1); ctx.fill();
    },
    trough(ctx, k, t, nb, seed, sh) {
      sh(0.45); ctx.fillStyle = '#5a3a1a'; for (const sx of [-0.4, 0.4]) { rr(ctx, k * sx - k * 0.04, -k * 0.35, k * 0.08, k * 0.35, k * 0.02); ctx.fill(); }
      ctx.fillStyle = '#8a5a2a'; rr(ctx, -k * 0.48, -k * 0.62, k * 0.96, k * 0.34, k * 0.05); ctx.fill(); ctx.fillStyle = '#a0703a'; ctx.beginPath(); ctx.ellipse(0, -k * 0.62, k * 0.48, k * 0.14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3f84ec'; ctx.beginPath(); ctx.ellipse(0, -k * 0.62, k * 0.4, k * 0.1, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -k * 0.62, k * 0.2 + Math.sin(t * 2) * k * 0.05, k * 0.05, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(60,30,10,0.5)'; for (const sx of [-0.25, 0, 0.25]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 0.6); ctx.lineTo(k * sx, -k * 0.3); ctx.stroke(); }
    },
    banner(ctx, k, t, nb, seed, sh, rnd) {
      sh(0.18); ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.04, -k * 1.7, k * 0.08, k * 1.7, k * 0.02); ctx.fill(); ctx.fillStyle = '#ffd54a'; circle(ctx, 0, -k * 1.72, k * 0.07); ctx.fill();
      const col = ['#d9342b', '#1e88e5', '#43a047', '#8e24aa', '#fb8c00'][Math.floor(rnd(1) * 5)], wave = Math.sin(t * 3 + (seed || 0)) * k * 0.08;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(k * 0.04, -k * 1.65); ctx.quadraticCurveTo(k * 0.45, -k * 1.5 + wave, k * 0.75, -k * 1.35 + wave); ctx.lineTo(k * 0.04, -k * 1.05); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(k * 0.04, -k * 1.65); ctx.quadraticCurveTo(k * 0.3, -k * 1.55 + wave * 0.5, k * 0.5, -k * 1.45 + wave * 0.7); ctx.lineTo(k * 0.04, -k * 1.4); ctx.closePath(); ctx.fill();
    },
    market(ctx, k, t, nb, seed, sh) {
      sh(0.48); ctx.fillStyle = '#5a3a1a'; for (const sx of [-0.44, 0.44]) { rr(ctx, k * sx - k * 0.04, -k * 1.4, k * 0.08, k * 1.4, k * 0.02); ctx.fill(); }
      ctx.fillStyle = '#a0703a'; rr(ctx, -k * 0.5, -k * 0.6, k, k * 0.16, k * 0.03); ctx.fill(); ctx.fillStyle = '#8a5a2a'; rr(ctx, -k * 0.46, -k * 0.44, k * 0.92, k * 0.4, k * 0.03); ctx.fill();
      ctx.fillStyle = '#d9342b'; for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#f4f4f4' : '#d9342b'; ctx.beginPath(); ctx.moveTo(-k * 0.55 + i * k * 0.275, -k * 1.45); ctx.lineTo(-k * 0.55 + (i + 1) * k * 0.275, -k * 1.45); ctx.lineTo(-k * 0.55 + (i + 1) * k * 0.275, -k * 1.2); ctx.lineTo(-k * 0.55 + (i + 0.5) * k * 0.275, -k * 1.1); ctx.lineTo(-k * 0.55 + i * k * 0.275, -k * 1.2); ctx.closePath(); ctx.fill(); }
      const cols = ['#ff5c8a', '#ffd54a', '#49e26a', '#ff8a1f']; for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; circle(ctx, -k * 0.3 + i * k * 0.2, -k * 0.68, k * 0.08); ctx.fill(); }
    },
    beehive(ctx, k, t, nb, seed, sh) {
      sh(0.3); ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.3, -k * 0.14, k * 0.6, k * 0.14, k * 0.03); ctx.fill();
      for (let i = 0; i < 4; i++) { const w = k * (0.42 - i * 0.07), y = -k * (0.22 + i * 0.2); ctx.fillStyle = i % 2 ? '#e2b84a' : '#f0cc63'; ctx.beginPath(); ctx.ellipse(0, y, w, k * 0.13, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(0, -k * 0.3, k * 0.09, k * 0.07, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#222'; for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1, px = Math.cos(a) * k * 0.55, py = -k * 0.6 + Math.sin(a * 1.3) * k * 0.3; circle(ctx, px, py, k * 0.035); ctx.fill(); ctx.fillStyle = '#ffd54a'; circle(ctx, px + k * 0.02, py, k * 0.02); ctx.fill(); ctx.fillStyle = '#222'; }
    },
    mossrock(ctx, k, t, nb, seed, sh) {
      sh(0.45); const g = ctx.createRadialGradient(-k * 0.2, -k * 0.5, k * 0.1, 0, -k * 0.35, k * 0.6); g.addColorStop(0, '#9aa3ad'); g.addColorStop(1, '#5a616a'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-k * 0.5, 0); ctx.quadraticCurveTo(-k * 0.55, -k * 0.6, -k * 0.15, -k * 0.75); ctx.quadraticCurveTo(k * 0.3, -k * 0.85, k * 0.5, -k * 0.35); ctx.quadraticCurveTo(k * 0.55, 0, k * 0.4, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3fae4a'; ctx.beginPath(); ctx.ellipse(-k * 0.1, -k * 0.68, k * 0.3, k * 0.1, -0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(k * 0.3, -k * 0.45, k * 0.16, k * 0.07, 0.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#2f8a3a'; ctx.beginPath(); ctx.ellipse(-k * 0.35, -k * 0.35, k * 0.12, k * 0.06, 0.3, 0, TAU); ctx.fill();
    },
    logpile(ctx, k, t, nb, seed, sh) {
      sh(0.46); const log = (x, y) => { ctx.fillStyle = '#7a4f24'; rr(ctx, x - k * 0.45, y - k * 0.14, k * 0.9, k * 0.28, k * 0.1); ctx.fill(); ctx.fillStyle = '#d9b382'; ctx.beginPath(); ctx.ellipse(x + k * 0.45, y, k * 0.08, k * 0.14, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x + k * 0.45, y, k * 0.04, k * 0.07, 0, 0, TAU); ctx.stroke(); };
      log(-k * 0.05, -k * 0.16); log(k * 0.05, -k * 0.42); log(0, -k * 0.68);
    },
    bigmushroom(ctx, k, t, nb, seed, sh) {
      sh(0.4); ctx.fillStyle = '#f4e8d0'; rr(ctx, -k * 0.2, -k * 0.75, k * 0.4, k * 0.75, k * 0.08); ctx.fill(); ctx.fillStyle = '#d8ccb0'; rr(ctx, -k * 0.2, -k * 0.75, k * 0.08, k * 0.75, k * 0.04); ctx.fill();
      const g = ctx.createRadialGradient(-k * 0.2, -k * 1.1, k * 0.1, 0, -k * 0.9, k * 0.7); g.addColorStop(0, '#ff6b6b'); g.addColorStop(1, '#c62828'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -k * 0.8, k * 0.62, k * 0.45, 0, Math.PI, TAU); ctx.lineTo(k * 0.62, -k * 0.72); ctx.ellipse(0, -k * 0.72, k * 0.62, k * 0.12, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; for (const [x, y, s2] of [[-0.3, -1.05, 0.1], [0.15, -1.15, 0.08], [0.4, -0.95, 0.07], [-0.05, -0.9, 0.06]]) { circle(ctx, x * k, y * k, s2 * k); ctx.fill(); }
    },
    bones(ctx, k, t, nb, seed, sh, rnd) {
      const bone = (x, y, a, len) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = '#e8e2d2'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, k * 0.06); ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0); ctx.stroke(); ctx.fillStyle = '#e8e2d2'; for (const sx of [-1, 1]) for (const sy of [-1, 1]) { circle(ctx, sx * len / 2, sy * k * 0.025, k * 0.04); ctx.fill(); } ctx.restore(); };
      bone(-k * 0.25, -k * 0.05, 0.3 + rnd(1), k * 0.4); bone(k * 0.2, -k * 0.12, -0.5 + rnd(2) * 0.6, k * 0.35); bone(k * 0.05, k * 0.02, 1.2, k * 0.3);
      ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.ellipse(-k * 0.05, -k * 0.2, k * 0.17, k * 0.15, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2a2a'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-k * 0.05 + sgn * k * 0.06, -k * 0.22, k * 0.04, k * 0.05, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(k * 0.3, -k * 0.05, k * (0.1 + i * 0.05), Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
    },
    // ---- hiver
    snowman(ctx, k, t, nb, seed, sh) {
      sh(0.36); const ball = (y, r) => { const g = ctx.createRadialGradient(-r * 0.3, y - r * 0.3, r * 0.1, 0, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfdeee'); ctx.fillStyle = g; circle(ctx, 0, y, r); ctx.fill(); };
      ball(-k * 0.3, k * 0.32); ball(-k * 0.76, k * 0.24); ball(-k * 1.12, k * 0.18);
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(1.5, k * 0.035); ctx.lineCap = 'round'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * k * 0.2, -k * 0.8); ctx.lineTo(sx * k * 0.52, -k * 1.0); ctx.moveTo(sx * k * 0.42, -k * 0.94); ctx.lineTo(sx * k * 0.5, -k * 1.1); ctx.stroke(); }
      ctx.fillStyle = '#2a2a2a'; for (const y of [-0.68, -0.8]) { circle(ctx, 0, y * k, k * 0.03); ctx.fill(); } for (const sx of [-1, 1]) { circle(ctx, sx * k * 0.06, -k * 1.16, k * 0.025); ctx.fill(); }
      ctx.fillStyle = '#ff8a1f'; ctx.beginPath(); ctx.moveTo(k * 0.02, -k * 1.1); ctx.lineTo(k * 0.2, -k * 1.07); ctx.lineTo(k * 0.02, -k * 1.04); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9342b'; rr(ctx, -k * 0.17, -k * 0.98, k * 0.34, k * 0.07, k * 0.03); ctx.fill(); rr(ctx, k * 0.04, -k * 0.96, k * 0.08, k * 0.18, k * 0.03); ctx.fill();
      ctx.fillStyle = '#2a2a2a'; rr(ctx, -k * 0.2, -k * 1.3, k * 0.4, k * 0.05, k * 0.02); ctx.fill(); rr(ctx, -k * 0.13, -k * 1.5, k * 0.26, k * 0.22, k * 0.03); ctx.fill();
    },
    snowpine(ctx, k, t, nb, seed, sh) {
      sh(0.36); ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.07, -k * 0.3, k * 0.14, k * 0.32, k * 0.03); ctx.fill();
      const tier = (y, w, h) => { ctx.fillStyle = '#2e6b3a'; ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(0, y - h); ctx.lineTo(w, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-w * 0.75, y - h * 0.22); ctx.quadraticCurveTo(-w * 0.3, y - h * 0.05, 0, y - h * 0.3); ctx.quadraticCurveTo(w * 0.3, y - h * 0.05, w * 0.75, y - h * 0.22); ctx.lineTo(0, y - h); ctx.closePath(); ctx.fill(); };
      tier(-k * 0.28, k * 0.52, k * 0.5); tier(-k * 0.62, k * 0.42, k * 0.46); tier(-k * 0.94, k * 0.3, k * 0.42);
    },
    baretree(ctx, k, t, nb, seed, sh) {
      sh(0.3); ctx.strokeStyle = '#5a3a1a'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, k * 0.09); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -k * 0.7); ctx.stroke();
      ctx.lineWidth = Math.max(1.5, k * 0.05); const br = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0 * k, y0 * k); ctx.lineTo(x1 * k, y1 * k); ctx.stroke(); };
      br(0, -0.7, -0.35, -1.05); br(0, -0.7, 0.3, -1.1); br(0, -0.5, 0.32, -0.75); br(-0.35, -1.05, -0.5, -1.3); br(-0.35, -1.05, -0.2, -1.35); br(0.3, -1.1, 0.5, -1.3); br(0.3, -1.1, 0.25, -1.4);
      ctx.fillStyle = '#ffffff'; for (const [x, y, w] of [[-0.35, -1.07, 0.1], [0.3, -1.12, 0.1], [0.32, -0.77, 0.08], [0, -0.72, 0.09], [-0.5, -1.31, 0.06], [0.5, -1.31, 0.06]]) { ctx.beginPath(); ctx.ellipse(x * k, y * k - k * 0.03, w * k, k * 0.035, 0, 0, TAU); ctx.fill(); }
    },
    icerock(ctx, k, t, nb, seed, sh) {
      sh(0.45); const g = ctx.createRadialGradient(-k * 0.2, -k * 0.55, k * 0.1, 0, -k * 0.35, k * 0.65); g.addColorStop(0, '#e8f6ff'); g.addColorStop(1, '#7fb0dc'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-k * 0.5, 0); ctx.lineTo(-k * 0.42, -k * 0.55); ctx.lineTo(-k * 0.1, -k * 0.8); ctx.lineTo(k * 0.3, -k * 0.7); ctx.lineTo(k * 0.5, -k * 0.3); ctx.lineTo(k * 0.42, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, k * 0.025); ctx.beginPath(); ctx.moveTo(-k * 0.3, -k * 0.5); ctx.lineTo(-k * 0.08, -k * 0.7); ctx.moveTo(k * 0.1, -k * 0.6); ctx.lineTo(k * 0.3, -k * 0.2); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-k * 0.05, -k * 0.74, k * 0.28, k * 0.07, -0.15, 0, TAU); ctx.fill();
    },
    icecrystal(ctx, k, t, nb, seed, sh) {
      sh(0.3); const glow = 0.25 + 0.12 * Math.sin(t * 2.5 + (seed || 0)); const g = ctx.createRadialGradient(0, -k * 0.45, k * 0.05, 0, -k * 0.45, k * 0.75); g.addColorStop(0, 'rgba(170,230,255,' + glow + ')'); g.addColorStop(1, 'rgba(170,230,255,0)'); ctx.fillStyle = g; circle(ctx, 0, -k * 0.45, k * 0.75); ctx.fill();
      const cr = (x, h, w, a) => { ctx.save(); ctx.translate(x, 0); ctx.rotate(a); const gg = ctx.createLinearGradient(-w, 0, w, 0); gg.addColorStop(0, '#bfe9ff'); gg.addColorStop(0.5, '#f4fcff'); gg.addColorStop(1, '#7fc4f0'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(w, -h * 0.3); ctx.lineTo(w * 0.7, 0); ctx.lineTo(-w * 0.7, 0); ctx.lineTo(-w, -h * 0.3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); };
      cr(-k * 0.22, k * 0.7, k * 0.13, -0.35); cr(k * 0.24, k * 0.6, k * 0.12, 0.4); cr(0, k * 1.05, k * 0.17, 0.02);
    },
    igloo(ctx, k, t, nb, seed, sh) {
      sh(0.5); const g = ctx.createRadialGradient(-k * 0.15, -k * 0.6, k * 0.1, 0, -k * 0.3, k * 0.7); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfdeee'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -k * 0.05, k * 0.55, k * 0.62, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,150,190,0.35)'; ctx.lineWidth = 1; for (const yy of [0.25, 0.45]) { ctx.beginPath(); ctx.ellipse(0, -k * 0.05, k * 0.55 * Math.sqrt(1 - yy * yy), k * 0.62 * Math.sqrt(1 - yy * yy), 0, Math.PI, TAU); ctx.stroke(); }
      ctx.fillStyle = '#e6eef6'; ctx.beginPath(); ctx.ellipse(0, -k * 0.02, k * 0.22, k * 0.26, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1b2236'; ctx.beginPath(); ctx.ellipse(0, -k * 0.02, k * 0.14, k * 0.18, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    },
    sled(ctx, k, t, nb, seed, sh) {
      sh(0.4); ctx.strokeStyle = '#6b4a2a'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, k * 0.05); for (const y of [-0.08, -0.2]) { ctx.beginPath(); ctx.moveTo(-k * 0.45, y * k); ctx.lineTo(k * 0.35, y * k); ctx.quadraticCurveTo(k * 0.55, y * k, k * 0.5, y * k - k * 0.22); ctx.stroke(); }
      ctx.fillStyle = '#d9342b'; for (let i = 0; i < 4; i++) { rr(ctx, -k * 0.42 + i * k * 0.2, -k * 0.4, k * 0.16, k * 0.22, k * 0.03); ctx.fill(); } ctx.fillStyle = '#b12a22'; rr(ctx, -k * 0.44, -k * 0.3, k * 0.82, k * 0.05, k * 0.02); ctx.fill();
      ctx.strokeStyle = '#d9b382'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-k * 0.44, -k * 0.3); ctx.quadraticCurveTo(-k * 0.6, -k * 0.15, -k * 0.55, -k * 0.02); ctx.stroke();
    },
    skis(ctx, k, t, nb, seed, sh) {
      sh(0.3); const ski = (x, a, col) => { ctx.save(); ctx.translate(x, 0); ctx.rotate(a); ctx.fillStyle = col; rr(ctx, -k * 0.05, -k * 1.2, k * 0.1, k * 1.2, k * 0.05); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; rr(ctx, -k * 0.02, -k * 1.1, k * 0.03, k * 0.9, k * 0.01); ctx.fill(); ctx.restore(); };
      ski(-k * 0.18, -0.18, '#3f9cff'); ski(k * 0.18, 0.18, '#ff6a1f');
      ctx.strokeStyle = '#5a616a'; ctx.lineWidth = Math.max(1, k * 0.025); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * k * 0.38, 0); ctx.lineTo(sx * k * 0.3, -k * 0.95); ctx.stroke(); ctx.fillStyle = '#2f3540'; circle(ctx, sx * k * 0.36, -k * 0.12, k * 0.05); ctx.fill(); }
    },
    snowpile(ctx, k, t, nb, seed, sh) {
      const g = ctx.createRadialGradient(-k * 0.1, -k * 0.3, k * 0.05, 0, -k * 0.15, k * 0.55); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d6e4f2'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-k * 0.5, 0); ctx.quadraticCurveTo(-k * 0.35, -k * 0.42, 0, -k * 0.38); ctx.quadraticCurveTo(k * 0.3, -k * 0.5, k * 0.5, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(160,190,230,0.35)'; ctx.beginPath(); ctx.ellipse(k * 0.15, -k * 0.06, k * 0.22, k * 0.05, 0, 0, TAU); ctx.fill();
    },
    snowballs(ctx, k, t, nb, seed, sh) {
      sh(0.4); const ball = (x, y, r) => { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c9dbee'); ctx.fillStyle = g; circle(ctx, x, y, r); ctx.fill(); };
      ball(-k * 0.28, -k * 0.16, k * 0.16); ball(0, -k * 0.16, k * 0.16); ball(k * 0.28, -k * 0.16, k * 0.16); ball(-k * 0.14, -k * 0.42, k * 0.15); ball(k * 0.14, -k * 0.42, k * 0.15); ball(0, -k * 0.66, k * 0.14);
    },
    rock(ctx, k, t, nb, seed, sh) { sh(0.4); S.drawBoulder(ctx, 0, -k * 0.28, k, {}); },
    jukebox(ctx, k, t, nb, seed, sh) {
      sh(0.42); ctx.fillStyle = '#7a2a1a'; ctx.beginPath(); ctx.moveTo(-k * 0.42, 0); ctx.lineTo(-k * 0.42, -k * 0.9); ctx.arc(0, -k * 0.9, k * 0.42, Math.PI, TAU); ctx.lineTo(k * 0.42, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = Math.max(2, k * 0.05); ctx.beginPath(); ctx.arc(0, -k * 0.9, k * 0.34, Math.PI, TAU); ctx.stroke();
      const hue = (t * 120) % 360; ctx.fillStyle = 'hsl(' + hue + ',90%,60%)'; ctx.beginPath(); ctx.arc(0, -k * 0.9, k * 0.26, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1a22'; rr(ctx, -k * 0.3, -k * 0.7, k * 0.6, k * 0.3, k * 0.04); ctx.fill(); ctx.fillStyle = '#ffd54a'; for (let i = 0; i < 4; i++) { ctx.fillRect(-k * 0.24 + i * k * 0.14, -k * 0.63, k * 0.06, k * 0.16); }
      ctx.fillStyle = '#d9b382'; rr(ctx, -k * 0.34, -k * 0.34, k * 0.68, k * 0.3, k * 0.04); ctx.fill(); ctx.strokeStyle = '#7a2a1a'; ctx.lineWidth = 1; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-k * 0.34 + i * k * 0.136, -k * 0.34); ctx.lineTo(-k * 0.34 + i * k * 0.136, -k * 0.04); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = Math.round(k * 0.22) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', k * 0.5 + Math.sin(t * 3) * k * 0.05, -k * 1.2 - (t * 0.4 % 1) * k * 0.3);
    },
    guitar(ctx, k, t, nb, seed, sh) {
      sh(0.3); ctx.save(); ctx.rotate(-0.25); ctx.fillStyle = '#c0742a'; ctx.beginPath(); ctx.ellipse(0, -k * 0.3, k * 0.26, k * 0.22, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -k * 0.62, k * 0.2, k * 0.18, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1a22'; circle(ctx, 0, -k * 0.42, k * 0.08); ctx.fill(); ctx.fillStyle = '#5a3a1a'; rr(ctx, -k * 0.04, -k * 1.35, k * 0.08, k * 0.72, k * 0.02); ctx.fill(); ctx.fillStyle = '#2a2a2a'; rr(ctx, -k * 0.06, -k * 1.5, k * 0.12, k * 0.18, k * 0.03); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * k * 0.02, -k * 1.4); ctx.lineTo(i * k * 0.02, -k * 0.2); ctx.stroke(); } ctx.restore();
    },
    drum(ctx, k, t, nb, seed, sh) {
      sh(0.4); ctx.fillStyle = '#d9342b'; rr(ctx, -k * 0.36, -k * 0.6, k * 0.72, k * 0.6, k * 0.04); ctx.fill(); ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = Math.max(1.5, k * 0.03); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-k * 0.34 + i * k * 0.136, -k * 0.56); ctx.lineTo(-k * 0.34 + (i + 1) * k * 0.136, -k * 0.08); ctx.stroke(); }
      ctx.fillStyle = '#f4e8d0'; ctx.beginPath(); ctx.ellipse(0, -k * 0.6, k * 0.37, k * 0.14, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#6b4a2a'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, k * 0.035); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * k * 0.1, -k * 0.65); ctx.lineTo(sx * k * 0.4, -k * 1.0); ctx.stroke(); ctx.fillStyle = '#f4e8d0'; circle(ctx, sx * k * 0.4, -k * 1.0, k * 0.05); ctx.fill(); }
    },
    skullpile(ctx, k, t, nb, seed, sh) {
      sh(0.42); const skull = (x, y, s2) => { ctx.fillStyle = '#e8e2d2'; circle(ctx, x, y, s2); ctx.fill(); ctx.fillStyle = '#2a2a2a'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sgn * s2 * 0.35, y - s2 * 0.1, s2 * 0.2, s2 * 0.26, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#d8ccb0'; rr(ctx, x - s2 * 0.4, y + s2 * 0.4, s2 * 0.8, s2 * 0.3, s2 * 0.1); ctx.fill(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1; for (const sx of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(x + sx * s2, y + s2 * 0.4); ctx.lineTo(x + sx * s2, y + s2 * 0.7); ctx.stroke(); } };
      skull(-k * 0.3, -k * 0.18, k * 0.17); skull(k * 0.05, -k * 0.15, k * 0.18); skull(k * 0.38, -k * 0.2, k * 0.16); skull(-k * 0.12, -k * 0.48, k * 0.17); skull(k * 0.22, -k * 0.5, k * 0.16); skull(k * 0.05, -k * 0.8, k * 0.18);
    },
    signpost(ctx, k, t, nb, seed, sh) {
      sh(0.2); ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.05, -k * 1.2, k * 0.1, k * 1.2, k * 0.02); ctx.fill();
      for (const [dir, yy, col] of [[1, -1.15, '#c98f4f'], [-1, -0.85, '#b07a3e']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-dir * k * 0.3, yy * k); ctx.lineTo(dir * k * 0.3, yy * k); ctx.lineTo(dir * k * 0.42, (yy + 0.11) * k); ctx.lineTo(dir * k * 0.3, (yy + 0.22) * k); ctx.lineTo(-dir * k * 0.3, (yy + 0.22) * k); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(40,20,5,0.5)'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(-k * 0.2, (yy + 0.07 + i * 0.07) * k); ctx.lineTo(k * 0.15, (yy + 0.07 + i * 0.07) * k); ctx.stroke(); } }
    },
    cask(ctx, k, t, nb, seed, sh) {
      sh(0.34); const g = ctx.createLinearGradient(-k * 0.3, 0, k * 0.3, 0); g.addColorStop(0, '#7a4f24'); g.addColorStop(0.5, '#b07a3e'); g.addColorStop(1, '#7a4f24'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-k * 0.26, -k * 0.05); ctx.quadraticCurveTo(-k * 0.38, -k * 0.4, -k * 0.26, -k * 0.75); ctx.lineTo(k * 0.26, -k * 0.75); ctx.quadraticCurveTo(k * 0.38, -k * 0.4, k * 0.26, -k * 0.05); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c98f4f'; ctx.beginPath(); ctx.ellipse(0, -k * 0.75, k * 0.26, k * 0.09, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a4a50'; ctx.lineWidth = Math.max(2, k * 0.05); for (const yy of [-0.2, -0.6]) { ctx.beginPath(); ctx.moveTo(-k * 0.33, yy * k); ctx.lineTo(k * 0.33, yy * k); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(40,20,5,0.3)'; ctx.lineWidth = 1; for (const sx of [-0.12, 0.05, 0.2]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 0.72); ctx.lineTo(k * sx, -k * 0.08); ctx.stroke(); }
    },
    hay(ctx, k, t, nb, seed, sh) {
      sh(0.42); ctx.fillStyle = '#e2b84a'; rr(ctx, -k * 0.42, -k * 0.6, k * 0.84, k * 0.6, k * 0.08); ctx.fill(); ctx.fillStyle = '#f0cc63'; rr(ctx, -k * 0.42, -k * 0.6, k * 0.84, k * 0.14, k * 0.06); ctx.fill();
      ctx.strokeStyle = 'rgba(150,100,20,0.5)'; ctx.lineWidth = 1; for (let i = 0; i < 14; i++) { const x = -k * 0.38 + i * k * 0.058, y = -k * 0.5 + ((i * 7) % 5) * k * 0.08; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + k * 0.05, y + k * 0.12); ctx.stroke(); }
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = Math.max(1.5, k * 0.03); for (const sx of [-0.18, 0.18]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 0.6); ctx.lineTo(k * sx, 0); ctx.stroke(); }
    },
    scarecrow(ctx, k, t, nb, seed, sh) {
      sh(0.2); ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.04, -k * 1.3, k * 0.08, k * 1.3, k * 0.02); ctx.fill(); rr(ctx, -k * 0.45, -k * 0.95, k * 0.9, k * 0.07, k * 0.02); ctx.fill();
      ctx.fillStyle = '#e2b84a'; for (const sx of [-0.45, 0.45]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 0.95); ctx.lineTo(k * sx - k * 0.06, -k * 0.75); ctx.lineTo(k * sx + k * 0.06, -k * 0.75); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#d9342b'; rr(ctx, -k * 0.22, -k * 1.0, k * 0.44, k * 0.5, k * 0.06); ctx.fill(); ctx.fillStyle = '#3f6fb0'; rr(ctx, -k * 0.2, -k * 0.55, k * 0.4, k * 0.1, k * 0.03); ctx.fill();
      ctx.fillStyle = '#e2b84a'; ctx.beginPath(); ctx.moveTo(-k * 0.16, -k * 0.5); ctx.lineTo(k * 0.16, -k * 0.5); ctx.lineTo(k * 0.1, -k * 0.3); ctx.lineTo(-k * 0.1, -k * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f0cc63'; circle(ctx, 0, -k * 1.12, k * 0.17); ctx.fill(); ctx.fillStyle = '#2a1a0a'; circle(ctx, -k * 0.06, -k * 1.14, k * 0.025); ctx.fill(); circle(ctx, k * 0.06, -k * 1.14, k * 0.025); ctx.fill(); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-k * 0.06, -k * 1.06); ctx.lineTo(k * 0.06, -k * 1.06); ctx.stroke();
      ctx.fillStyle = '#8a5a2a'; rr(ctx, -k * 0.26, -k * 1.28, k * 0.52, k * 0.06, k * 0.02); ctx.fill(); ctx.beginPath(); ctx.moveTo(-k * 0.14, -k * 1.28); ctx.lineTo(k * 0.14, -k * 1.28); ctx.lineTo(k * 0.1, -k * 1.45); ctx.lineTo(-k * 0.1, -k * 1.45); ctx.closePath(); ctx.fill();
    },
    flowerpot(ctx, k, t, nb, seed, sh, rnd) {
      sh(0.28); ctx.fillStyle = '#b5532a'; ctx.beginPath(); ctx.moveTo(-k * 0.22, -k * 0.4); ctx.lineTo(k * 0.22, -k * 0.4); ctx.lineTo(k * 0.16, 0); ctx.lineTo(-k * 0.16, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c9683a'; rr(ctx, -k * 0.25, -k * 0.46, k * 0.5, k * 0.1, k * 0.02); ctx.fill();
      ctx.strokeStyle = '#3a9d45'; ctx.lineWidth = Math.max(1.5, k * 0.03); const cols = ['#ff5c8a', '#ffd54a', '#7fb3ff', '#ff8a1f', '#f06292'];
      for (let i = 0; i < 4; i++) { const x = -k * 0.14 + i * k * 0.095, h = k * (0.25 + rnd(i) * 0.2); ctx.beginPath(); ctx.moveTo(x, -k * 0.42); ctx.quadraticCurveTo(x + k * 0.03, -k * 0.42 - h / 2, x, -k * 0.42 - h); ctx.stroke(); ctx.fillStyle = cols[(i + (seed || 0)) % cols.length]; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; circle(ctx, x + Math.cos(a) * k * 0.05, -k * 0.42 - h + Math.sin(a) * k * 0.05, k * 0.035); ctx.fill(); } ctx.fillStyle = '#fff2a8'; circle(ctx, x, -k * 0.42 - h, k * 0.025); ctx.fill(); }
    },
    mailbox(ctx, k, t, nb, seed, sh) {
      sh(0.2); ctx.fillStyle = '#6b4a2a'; rr(ctx, -k * 0.04, -k * 0.9, k * 0.08, k * 0.9, k * 0.02); ctx.fill();
      ctx.fillStyle = '#1e5bd8'; rr(ctx, -k * 0.3, -k * 1.2, k * 0.6, k * 0.34, k * 0.12); ctx.fill(); ctx.fillStyle = '#3f7ff0'; rr(ctx, -k * 0.3, -k * 1.2, k * 0.6, k * 0.1, k * 0.1); ctx.fill();
      ctx.fillStyle = '#0f3a8f'; rr(ctx, k * 0.18, -k * 1.14, k * 0.1, k * 0.22, k * 0.04); ctx.fill(); ctx.fillStyle = '#d9342b'; rr(ctx, -k * 0.34, -k * 1.42, k * 0.06, k * 0.3, k * 0.02); ctx.fill(); rr(ctx, -k * 0.34, -k * 1.42, k * 0.16, k * 0.08, k * 0.02); ctx.fill();
    },
    stump(ctx, k, t, nb, seed, sh) {
      sh(0.4); ctx.fillStyle = '#7a4f24'; rr(ctx, -k * 0.34, -k * 0.45, k * 0.68, k * 0.45, k * 0.05); ctx.fill(); ctx.fillStyle = '#5e3a18'; for (const sx of [-0.25, -0.05, 0.15]) ctx.fillRect(k * sx, -k * 0.4, k * 0.03, k * 0.36);
      ctx.fillStyle = '#d9b382'; ctx.beginPath(); ctx.ellipse(0, -k * 0.45, k * 0.36, k * 0.16, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 1; for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, -k * 0.45, k * 0.09 * i, k * 0.04 * i, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#7a4f24'; ctx.beginPath(); ctx.ellipse(-k * 0.42, -k * 0.08, k * 0.14, k * 0.06, 0, 0, TAU); ctx.fill();
    },
    cactus(ctx, k, t, nb, seed, sh) {
      sh(0.26); ctx.fillStyle = '#3a9d45'; rr(ctx, -k * 0.14, -k * 1.1, k * 0.28, k * 1.1, k * 0.14); ctx.fill();
      rr(ctx, -k * 0.42, -k * 0.85, k * 0.14, k * 0.4, k * 0.07); ctx.fill(); rr(ctx, -k * 0.42, -k * 0.55, k * 0.32, k * 0.12, k * 0.06); ctx.fill(); rr(ctx, k * 0.28, -k * 0.7, k * 0.14, k * 0.3, k * 0.07); ctx.fill(); rr(ctx, k * 0.1, -k * 0.5, k * 0.32, k * 0.12, k * 0.06); ctx.fill();
      ctx.fillStyle = '#5fc46a'; rr(ctx, -k * 0.06, -k * 1.05, k * 0.06, k * 0.95, k * 0.03); ctx.fill(); ctx.fillStyle = '#f0f0d0'; for (let i = 0; i < 8; i++) { circle(ctx, -k * 0.1 + (i % 2) * k * 0.2, -k * 1.0 + i * k * 0.12, k * 0.015); ctx.fill(); }
      ctx.fillStyle = '#ff5c8a'; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; circle(ctx, Math.cos(a) * k * 0.06, -k * 1.12 + Math.sin(a) * k * 0.06, k * 0.04); ctx.fill(); } ctx.fillStyle = '#ffd54a'; circle(ctx, 0, -k * 1.12, k * 0.03); ctx.fill();
    },
    cart(ctx, k, t, nb, seed, sh) {
      sh(0.45); ctx.fillStyle = '#5a3a1a'; ctx.lineWidth = Math.max(1.5, k * 0.04); for (const sx of [-0.3, 0.3]) { ctx.fillStyle = '#3a2a1a'; circle(ctx, k * sx, -k * 0.12, k * 0.17); ctx.fill(); ctx.fillStyle = '#c98f4f'; circle(ctx, k * sx, -k * 0.12, k * 0.12); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; ctx.beginPath(); ctx.moveTo(k * sx - Math.cos(a) * k * 0.12, -k * 0.12 - Math.sin(a) * k * 0.12); ctx.lineTo(k * sx + Math.cos(a) * k * 0.12, -k * 0.12 + Math.sin(a) * k * 0.12); ctx.stroke(); } }
      ctx.fillStyle = '#a0703a'; ctx.beginPath(); ctx.moveTo(-k * 0.5, -k * 0.6); ctx.lineTo(k * 0.5, -k * 0.6); ctx.lineTo(k * 0.44, -k * 0.22); ctx.lineTo(-k * 0.44, -k * 0.22); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.lineWidth = 1; for (const sx of [-0.25, 0, 0.25]) { ctx.beginPath(); ctx.moveTo(k * sx, -k * 0.6); ctx.lineTo(k * sx, -k * 0.22); ctx.stroke(); }
      ctx.fillStyle = '#e2b84a'; for (const [sx, sy] of [[-0.2, -0.68], [0.05, -0.75], [0.28, -0.66]]) { circle(ctx, k * sx, k * sy, k * 0.13); ctx.fill(); }
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, k * 0.05); ctx.beginPath(); ctx.moveTo(k * 0.5, -k * 0.5); ctx.lineTo(k * 0.75, -k * 0.3); ctx.stroke();
    },
    fountain(ctx, k, t, nb, seed, sh) {
      sh(0.48); ctx.fillStyle = '#8f98a3'; ctx.beginPath(); ctx.ellipse(0, -k * 0.1, k * 0.48, k * 0.24, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8c0c9'; ctx.beginPath(); ctx.ellipse(0, -k * 0.22, k * 0.48, k * 0.24, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3f84ec'; ctx.beginPath(); ctx.ellipse(0, -k * 0.22, k * 0.4, k * 0.18, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 2; i++) { const u = (t * 0.8 + i * 0.5) % 1; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.ellipse(0, -k * 0.22, k * 0.1 + u * k * 0.28, k * 0.05 + u * k * 0.12, 0, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1;
      ctx.fillStyle = '#8f98a3'; rr(ctx, -k * 0.07, -k * 0.75, k * 0.14, k * 0.55, k * 0.03); ctx.fill(); ctx.fillStyle = '#b8c0c9'; ctx.beginPath(); ctx.ellipse(0, -k * 0.75, k * 0.18, k * 0.07, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(160,210,255,0.9)'; ctx.lineWidth = Math.max(1.5, k * 0.03); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, u = (t * 1.2 + i * 0.17) % 1; const x1 = Math.cos(a) * k * 0.08, x2 = Math.cos(a) * k * (0.1 + u * 0.3); ctx.beginPath(); ctx.moveTo(x1, -k * 0.78); ctx.quadraticCurveTo((x1 + x2) / 2, -k * 1.05, x2, -k * 0.22 - Math.sin(a) * k * 0.1); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 5; i++) { const u = (t * 1.5 + i * 0.2) % 1; circle(ctx, Math.sin(i * 2.1) * k * 0.05, -k * 0.8 - u * k * 0.35, k * 0.025); ctx.fill(); }
    },
    table(ctx, k, t, nb, seed, sh) {
      sh(0.44); ctx.fillStyle = '#5a3a1a'; for (const sx of [-0.36, 0.36]) { rr(ctx, k * sx - k * 0.04, -k * 0.5, k * 0.08, k * 0.5, k * 0.02); ctx.fill(); }
      ctx.fillStyle = '#a0703a'; rr(ctx, -k * 0.48, -k * 0.62, k * 0.96, k * 0.18, k * 0.04); ctx.fill(); ctx.fillStyle = '#c98f4f'; rr(ctx, -k * 0.48, -k * 0.62, k * 0.96, k * 0.07, k * 0.03); ctx.fill();
      ctx.fillStyle = (seed || 0) % 2 ? '#d9342b' : '#3f6fb0'; rr(ctx, -k * 0.2, -k * 0.64, k * 0.4, k * 0.2, k * 0.02); ctx.fill(); ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.ellipse(k * 0.02, -k * 0.6, k * 0.09, k * 0.04, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff5c8a'; circle(ctx, k * 0.02, -k * 0.62, k * 0.03); ctx.fill();
    },
    chair(ctx, k, t, nb, seed, sh) {
      sh(0.28); ctx.fillStyle = '#5a3a1a'; for (const sx of [-0.2, 0.2]) { rr(ctx, k * sx - k * 0.03, -k * 0.4, k * 0.06, k * 0.4, k * 0.02); ctx.fill(); }
      ctx.fillStyle = '#a0703a'; rr(ctx, -k * 0.26, -k * 0.5, k * 0.52, k * 0.14, k * 0.03); ctx.fill(); ctx.fillStyle = '#b07a3e'; rr(ctx, -k * 0.24, -k * 1.0, k * 0.48, k * 0.52, k * 0.06); ctx.fill();
      ctx.fillStyle = '#8a5a2a'; for (const sx of [-0.12, 0, 0.12]) ctx.fillRect(k * sx - k * 0.02, -k * 0.95, k * 0.04, k * 0.4);
    },
    bed(ctx, k, t, nb, seed, sh) {
      sh(0.46); ctx.fillStyle = '#5a3a1a'; rr(ctx, -k * 0.46, -k * 0.5, k * 0.92, k * 0.5, k * 0.04); ctx.fill(); rr(ctx, -k * 0.46, -k * 0.95, k * 0.1, k * 0.5, k * 0.03); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; rr(ctx, -k * 0.36, -k * 0.6, k * 0.82, k * 0.25, k * 0.05); ctx.fill(); ctx.fillStyle = ['#d9342b', '#3f6fb0', '#7b3fb0', '#2f8a3a'][(seed || 0) % 4]; rr(ctx, -k * 0.1, -k * 0.62, k * 0.56, k * 0.3, k * 0.06); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 3; i++) ctx.fillRect(-k * 0.1, -k * 0.56 + i * k * 0.09, k * 0.56, k * 0.03);
      ctx.fillStyle = '#ffffff'; rr(ctx, -k * 0.34, -k * 0.72, k * 0.24, k * 0.14, k * 0.05); ctx.fill();
    },
    bookshelf(ctx, k, t, nb, seed, sh) {
      sh(0.4); ctx.fillStyle = '#4a2f14'; ctx.fillRect(-k * 0.44, -k * 1.6, k * 0.88, k * 1.6); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-k * 0.4, -k * 1.56, k * 0.8, k * 1.52);
      const cols = ['#d9342b', '#3f6fb0', '#2f8a3a', '#ffd54a', '#7b3fb0', '#ff8a1f', '#26c6da', '#f4f4f4'];
      for (let i = 0; i < 4; i++) { const yy = -k * (0.35 + i * 0.38); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-k * 0.42, yy, k * 0.84, k * 0.05); let x = -k * 0.36; let j = 0; while (x < k * 0.3) { const w = k * (0.06 + ((i * 5 + j * 3 + (seed || 0)) % 4) * 0.02), h = k * (0.22 + ((i * 3 + j * 7 + (seed || 0)) % 3) * 0.04); ctx.fillStyle = cols[(i * 3 + j + (seed || 0)) % cols.length]; ctx.fillRect(x, yy - h, w, h); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x, yy - h, w, k * 0.02); x += w + k * 0.015; j++; } }
    },
    fireplace(ctx, k, t, nb, seed, sh) {
      sh(0.44); ctx.fillStyle = '#6f7883'; rr(ctx, -k * 0.48, -k * 1.3, k * 0.96, k * 1.3, k * 0.04); ctx.fill(); ctx.fillStyle = '#8f98a3'; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { if ((i > 0 && i < 4) && j > 0) continue; rr(ctx, -k * 0.46 + i * k * 0.19 + (j % 2) * k * 0.05, -k * 1.26 + j * k * 0.42, k * 0.16, k * 0.36, k * 0.02); ctx.fill(); }
      ctx.fillStyle = '#b8c0c9'; rr(ctx, -k * 0.5, -k * 1.36, k * 1, k * 0.1, k * 0.02); ctx.fill(); ctx.fillStyle = '#1a1210'; rr(ctx, -k * 0.3, -k * 0.85, k * 0.6, k * 0.85, k * 0.04); ctx.fill();
      ctx.fillStyle = '#5a3a1a'; rr(ctx, -k * 0.24, -k * 0.16, k * 0.48, k * 0.1, k * 0.04); ctx.fill(); rr(ctx, -k * 0.2, -k * 0.26, k * 0.4, k * 0.1, k * 0.04); ctx.fill();
      for (let i = 0; i < 3; i++) flame(ctx, -k * 0.12 + i * k * 0.12, -k * 0.2, k, k * (0.4 + (i === 1 ? 0.2 : 0)), t, i);
      const glow = 0.25 + 0.08 * Math.sin(t * 8); ctx.fillStyle = 'rgba(255,170,60,' + glow + ')'; ctx.beginPath(); ctx.ellipse(0, k * 0.02, k * 0.5, k * 0.18, 0, 0, TAU); ctx.fill();
    },
    cauldron(ctx, k, t, nb, seed, sh) {
      sh(0.36); ctx.fillStyle = '#2a2a30'; for (const sx of [-0.2, 0.2]) { rr(ctx, k * sx - k * 0.04, -k * 0.18, k * 0.08, k * 0.18, k * 0.02); ctx.fill(); }
      const g = ctx.createRadialGradient(-k * 0.1, -k * 0.5, k * 0.05, 0, -k * 0.4, k * 0.45); g.addColorStop(0, '#5a5a66'); g.addColorStop(1, '#1e1e26'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -k * 0.42, k * 0.36, k * 0.34, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.ellipse(0, -k * 0.68, k * 0.34, k * 0.12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#5fe36a'; ctx.beginPath(); ctx.ellipse(0, -k * 0.68, k * 0.28, k * 0.09, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9dff9d'; for (let i = 0; i < 4; i++) { const u = (t * 0.9 + i * 0.25) % 1; ctx.globalAlpha = 0.9 * (1 - u); circle(ctx, Math.sin(i * 1.7 + t) * k * 0.15, -k * 0.7 - u * k * 0.4, k * (0.03 + u * 0.05)); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = Math.max(2, k * 0.04); ctx.beginPath(); ctx.arc(0, -k * 0.68, k * 0.36, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    },
    plant(ctx, k, t, nb, seed, sh) {
      sh(0.3); ctx.fillStyle = '#b5532a'; ctx.beginPath(); ctx.moveTo(-k * 0.24, -k * 0.42); ctx.lineTo(k * 0.24, -k * 0.42); ctx.lineTo(k * 0.18, 0); ctx.lineTo(-k * 0.18, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c9683a'; rr(ctx, -k * 0.27, -k * 0.48, k * 0.54, k * 0.1, k * 0.02); ctx.fill();
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42 + Math.sin(t + i) * 0.03, len = k * (0.55 + (i % 2) * 0.2); ctx.fillStyle = i % 2 ? '#2f8a3a' : '#3fae4a'; ctx.beginPath(); ctx.moveTo(0, -k * 0.45); ctx.quadraticCurveTo(Math.cos(a) * len * 0.5 - Math.sin(a) * k * 0.14, -k * 0.45 + Math.sin(a) * len * 0.5, Math.cos(a) * len, -k * 0.45 + Math.sin(a) * len); ctx.quadraticCurveTo(Math.cos(a) * len * 0.5 + Math.sin(a) * k * 0.14, -k * 0.45 + Math.sin(a) * len * 0.5, 0, -k * 0.45); ctx.fill(); }
    },
    piano(ctx, k, t, nb, seed, sh) {
      sh(0.46); ctx.fillStyle = '#1a1a22'; rr(ctx, -k * 0.48, -k * 1.2, k * 0.96, k * 1.2, k * 0.04); ctx.fill(); ctx.fillStyle = '#2e2e3a'; rr(ctx, -k * 0.44, -k * 1.16, k * 0.88, k * 0.5, k * 0.03); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; rr(ctx, -k * 0.44, -k * 0.62, k * 0.88, k * 0.14, k * 0.02); ctx.fill(); ctx.fillStyle = '#1a1a22'; for (let i = 0; i < 10; i++) { if (i % 7 === 2 || i % 7 === 6) continue; ctx.fillRect(-k * 0.4 + i * k * 0.085, -k * 0.62, k * 0.045, k * 0.08); }
      ctx.fillStyle = '#c9a24a'; for (const sx of [-0.3, 0.3]) { rr(ctx, k * sx - k * 0.03, -k * 0.95, k * 0.06, k * 0.06, k * 0.02); ctx.fill(); }
      ctx.fillStyle = '#f4f4f4'; rr(ctx, -k * 0.12, -k * 1.1, k * 0.24, k * 0.3, k * 0.02); ctx.fill(); ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-k * 0.1, -k * 1.05 + i * k * 0.06); ctx.lineTo(k * 0.1, -k * 1.05 + i * k * 0.06); ctx.stroke(); }
    },
    candelabra(ctx, k, t, nb, seed, sh, rnd, light) {
      sh(0.2); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.ellipse(0, -k * 0.04, k * 0.2, k * 0.08, 0, 0, TAU); ctx.fill(); rr(ctx, -k * 0.03, -k * 0.9, k * 0.06, k * 0.88, k * 0.02); ctx.fill();
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = Math.max(2, k * 0.05); ctx.beginPath(); ctx.moveTo(-k * 0.28, -k * 0.95); ctx.quadraticCurveTo(0, -k * 0.7, k * 0.28, -k * 0.95); ctx.stroke();
      for (const sx of [-0.28, 0, 0.28]) { ctx.fillStyle = '#f4f0e0'; rr(ctx, k * sx - k * 0.035, -k * 1.2 + (sx ? 0 : -k * 0.1), k * 0.07, k * 0.26, k * 0.02); ctx.fill(); flame(ctx, k * sx, -k * 1.2 + (sx ? 0 : -k * 0.1), k, k * 0.2, t, sx * 10, light); }
    },
    anvil(ctx, k, t, nb, seed, sh) {
      sh(0.4); ctx.fillStyle = '#7a4f24'; rr(ctx, -k * 0.3, -k * 0.3, k * 0.6, k * 0.3, k * 0.04); ctx.fill(); ctx.fillStyle = '#d9b382'; ctx.beginPath(); ctx.ellipse(0, -k * 0.3, k * 0.3, k * 0.1, 0, 0, TAU); ctx.fill();
      const g = ctx.createLinearGradient(0, -k * 0.75, 0, -k * 0.3); g.addColorStop(0, '#8a919c'); g.addColorStop(1, '#4a505a'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-k * 0.2, -k * 0.32); ctx.lineTo(k * 0.2, -k * 0.32); ctx.lineTo(k * 0.14, -k * 0.5); ctx.lineTo(k * 0.44, -k * 0.56); ctx.lineTo(k * 0.52, -k * 0.68); ctx.lineTo(k * 0.3, -k * 0.74); ctx.lineTo(-k * 0.3, -k * 0.74); ctx.lineTo(-k * 0.46, -k * 0.62); ctx.lineTo(-k * 0.16, -k * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b8c0c9'; rr(ctx, -k * 0.3, -k * 0.76, k * 0.6, k * 0.05, k * 0.02); ctx.fill();
    }
  };

  // Cible rayée jaune et noire sur un socle ; hit = déjà atteinte (elle devient verte et se penche).
  S.drawTarget = function (ctx, x, y, k, hit, t, color) {
    const col = color || '#ffd54a';
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#7a7f88'; rr(ctx, -k * 0.3, -k * 0.22, k * 0.6, k * 0.26, k * 0.06); ctx.fill();
    ctx.fillStyle = '#5a5f68'; ctx.beginPath(); ctx.ellipse(0, -k * 0.22, k * 0.3, k * 0.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4b4f58'; ctx.fillRect(-k * 0.04, -k * 0.95, k * 0.08, k * 0.75);
    const w = k * 0.5, h = k * 0.5, cy = -k * 1.05; ctx.translate(0, cy); if (hit) ctx.rotate(0.35);
    ctx.fillStyle = hit ? shade(col, 0.55) : col; rr(ctx, -w / 2, -h / 2, w, h, k * 0.08); ctx.fill();
    ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, k * 0.08); ctx.clip(); ctx.fillStyle = hit ? 'rgba(0,0,0,0.25)' : 'rgba(20,20,20,0.9)'; ctx.lineWidth = k * 0.09;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-w + i * w * 0.4, h); ctx.lineTo(i * w * 0.4 + w * 0.1, -h); ctx.lineTo(i * w * 0.4 + w * 0.25, -h); ctx.lineTo(-w + i * w * 0.4 + w * 0.15, h); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1.5, k * 0.04); rr(ctx, -w / 2, -h / 2, w, h, k * 0.08); ctx.stroke();
    if (!hit) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(t * 5)) + ')'; circle(ctx, 0, 0, k * 0.08); ctx.fill(); }
    ctx.restore();
  };
  // Bloc de métal riveté dont une face (wood : 0 sud, 1 ouest, 2 nord, 3 est) est en planches de bois.
  S.drawMetal = function (ctx, cam, c, r, z, wood) {
    const D3 = BK.draw3d, steel = { top: '#9fb0c4', front: '#6f8096', side: '#4f5d70' }, woodCol = '#b07a3e';
    const camX = cam.pos.x, visibleSide = c + 0.5 < camX ? 3 : 1;   // face latérale visible : est si le bloc est à gauche de la caméra, sinon ouest
    const col = { top: steel.top, front: wood === 0 ? woodCol : steel.front, side: wood === visibleSide ? woodCol : steel.side };
    const f = D3.cube(ctx, cam, c + 0.03, r + 0.03, c + 0.97, r + 0.97, 0.9, col, { z, outline: 'rgba(0,0,0,0.35)' });
    // rivets sur les faces de métal, planches sur la face de bois
    const rivets = q => { ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (const [u, v] of [[0.15, 0.2], [0.85, 0.2], [0.15, 0.8], [0.85, 0.8]]) { const p = D3.onQuad(q, u, v); ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.2, cam.scaleAt(c + 0.5, r + 0.5) * 0.035), 0, TAU); ctx.fill(); } };
    const planks = q => { ctx.strokeStyle = 'rgba(60,30,10,0.55)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { const a = D3.onQuad(q, 0, k / 4), b = D3.onQuad(q, 1, k / 4); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } };
    if (wood === 0) planks(f.front); else rivets(f.front);
    if (f.side) { if (wood === visibleSide) planks(f.side); else rivets(f.side); }
    rivets(f.top);
    // une bande de bois sur le dessus, du côté de la face en bois, pour la repérer même quand elle est cachée
    const band = wood === 2 ? [D3.onQuad(f.top, 0, 0), D3.onQuad(f.top, 1, 0), D3.onQuad(f.top, 1, 0.22), D3.onQuad(f.top, 0, 0.22)] : wood === 0 ? [D3.onQuad(f.top, 0, 0.78), D3.onQuad(f.top, 1, 0.78), D3.onQuad(f.top, 1, 1), D3.onQuad(f.top, 0, 1)] : wood === 1 ? [D3.onQuad(f.top, 0, 0), D3.onQuad(f.top, 0.22, 0), D3.onQuad(f.top, 0.22, 1), D3.onQuad(f.top, 0, 1)] : [D3.onQuad(f.top, 0.78, 0), D3.onQuad(f.top, 1, 0), D3.onQuad(f.top, 1, 1), D3.onQuad(f.top, 0.78, 1)];
    D3.quad(ctx, band, woodCol); ctx.lineWidth = 1; D3.quad(ctx, band, null, 'rgba(60,30,10,0.6)');
  };
  // Baril dormant : tonneau de bois cerclé, avec une rune violette qui pulse.
  S.drawBarrel = function (ctx, x, y, k, t) {
    const w = k * 0.62, h = k * 0.8; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.6, w * 0.22, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#6b4a2a'); g.addColorStop(0.5, '#a0703a'); g.addColorStop(1, '#5a3a1a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.15); ctx.quadraticCurveTo(-w * 0.6, -h * 0.55, -w / 2, -h * 0.95); ctx.lineTo(w / 2, -h * 0.95); ctx.quadraticCurveTo(w * 0.6, -h * 0.55, w / 2, -h * 0.15); ctx.quadraticCurveTo(0, -h * 0.05, -w / 2, -h * 0.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a4f24'; ctx.beginPath(); ctx.ellipse(0, -h * 0.95, w / 2, w * 0.18, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3e3a45'; ctx.lineWidth = Math.max(2, k * 0.05); for (const yy of [-h * 0.3, -h * 0.8]) { ctx.beginPath(); ctx.moveTo(-w * 0.56, yy); ctx.quadraticCurveTo(0, yy + h * 0.08, w * 0.56, yy); ctx.stroke(); }
    S.drawRune(ctx, 0, -h * 0.55, k * 0.16, t);
    ctx.restore();
  };
  // Rune magique violette (sur les barils et les portes scellées).
  S.drawRune = function (ctx, x, y, r, t) {
    const a = 0.55 + 0.35 * Math.sin(t * 3); ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(230,190,255,' + a + ')'; ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.shadowColor = '#b48cf0'; ctx.shadowBlur = r * 0.8;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 3; i++) { const an = -Math.PI / 2 + i * TAU / 3; ctx.lineTo(Math.cos(an) * r * 0.75, Math.sin(an) * r * 0.75); } ctx.closePath(); ctx.stroke();
    ctx.restore();
  };
  // Maison de bois : la porte est sur la case (c, r) ; hp = { w: largeur (impaire), d: profondeur, roof: couleur du toit }.
  S.drawHouse = function (ctx, cam, c, r, t, z0, hp) {
    hp = hp || {}; const w = Math.max(1, hp.w || 3), d = Math.max(1, hp.d || 2), roof = hp.roof || '#b5452a', hw = (w - 1) / 2;
    z0 = z0 || 0; const x0 = c - hw, x1 = c + hw + 1, y0 = r - d + 1, y1 = r + 1, h = 1.15, D3 = BK.draw3d;
    const wood = hp.wall || '#b07a3e', woodDark = shade(wood, 0.7), woodLight = shade(wood, 1.15);
    const f = D3.cube(ctx, cam, x0, y0, x1, y1, h, { top: woodDark, front: wood, side: woodDark }, { z: z0, bricks: 'rgba(60,30,10,0.45)', rows: 5, cols: 1 });
    const q = f.front, sk = cam.scaleAt(c + 0.5, r + 1), du = 0.4 / w;
    D3.quad(ctx, [D3.onQuad(q, 0.5 - du, 0.35), D3.onQuad(q, 0.5 + du, 0.35), D3.onQuad(q, 0.5 + du, 1), D3.onQuad(q, 0.5 - du, 1)], '#3b2412');
    D3.quad(ctx, [D3.onQuad(q, 0.5 - du * 0.8, 0.4), D3.onQuad(q, 0.5 + du * 0.8, 0.4), D3.onQuad(q, 0.5 + du * 0.8, 0.98), D3.onQuad(q, 0.5 - du * 0.8, 0.98)], '#5a3a1a');
    const knob = D3.onQuad(q, 0.5 + du * 0.5, 0.72); ctx.fillStyle = '#ffd54a'; circle(ctx, knob.x, knob.y, Math.max(1.5, sk * 0.04)); ctx.fill();
    for (let k = 0; k < w; k++) { if (k !== hw - 1 && k !== hw + 1) continue; const u = (k + 0.5) / w, ww = Math.min(0.18 / w, 0.09); const win = [D3.onQuad(q, u - ww, 0.3), D3.onQuad(q, u + ww, 0.3), D3.onQuad(q, u + ww, 0.55), D3.onQuad(q, u - ww, 0.55)]; D3.quad(ctx, win, '#8fd3ff'); ctx.lineWidth = 1.5; D3.quad(ctx, win, null, '#3b2412'); }
    if (hp.sign !== '') { const sw = Math.min(0.45, 0.6 / w); const sgn = [D3.onQuad(q, 0.5 - sw, 0.08), D3.onQuad(q, 0.5 + sw, 0.08), D3.onQuad(q, 0.5 + sw, 0.26), D3.onQuad(q, 0.5 - sw, 0.26)]; D3.quad(ctx, sgn, '#f4e2b8'); ctx.lineWidth = 1.5; D3.quad(ctx, sgn, null, '#7a4f24');
      const sc = D3.onQuad(q, 0.5, 0.17); ctx.fillStyle = '#7a2f18'; ctx.font = 'bold ' + Math.round(sk * 0.17) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(hp.sign || 'MAGASIN', sc.x, sc.y); }
    const e0 = cam.project(x0 - 0.2, y0 - 0.2, z0 + h), e1 = cam.project(x1 + 0.2, y0 - 0.2, z0 + h), e2 = cam.project(x1 + 0.2, y1 + 0.2, z0 + h), e3 = cam.project(x0 - 0.2, y1 + 0.2, z0 + h);
    const r0 = cam.project(x0 - 0.2, (y0 + y1) / 2, z0 + h + 0.45 + 0.22 * d), r1 = cam.project(x1 + 0.2, (y0 + y1) / 2, z0 + h + 0.45 + 0.22 * d);
    const camX = cam.pos.x, mid = (x0 + x1) / 2;
    const gable = (a, b, top, col) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(top.x, top.y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
    if (mid > camX) gable(e0, e3, r0, woodLight); else gable(e1, e2, r1, woodLight);
    D3.quad(ctx, [e0, e1, r1, r0], shade(roof, 0.75));
    const pan = [e3, e2, r1, r0]; D3.quad(ctx, pan, roof);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { const a = D3.onQuad(pan, 0, k / 4), b = D3.onQuad(pan, 1, k / 4); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    D3.cube(ctx, cam, x1 - 0.7, y0 + 0.2, x1 - 0.35, y0 + 0.55, 1.5, { top: '#9a9a9a', front: '#7a7a7a', side: '#5a5a5a' }, { z: z0 + h - 0.2 });
    ctx.fillStyle = 'rgba(230,230,230,0.6)'; for (let k = 0; k < 3; k++) { const u = ((t * 0.5 + k * 0.33) % 1), p = cam.project(x1 - 0.52 + Math.sin(t + k) * 0.1, y0 + 0.37, z0 + h + 1.3 + u * 1.2); ctx.globalAlpha = 0.6 * (1 - u); circle(ctx, p.x, p.y, p.k * (0.08 + u * 0.12)); ctx.fill(); } ctx.globalAlpha = 1;
  };
  // -------------------------------------------------------------------- aide : accès à FamilyHeads dans le navigateur
  BK.FamilyHeadsRef = () => (typeof window !== 'undefined' && window.FamilyHeads) || null;
})(window.BK);
