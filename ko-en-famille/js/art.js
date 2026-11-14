// K.O. en Famille — dessin : aréna (pré-rendue), adversaires (squelette + poses), boxeur de la famille vu de dos, projectiles.
(function (root) {
  'use strict';
  const BX = root.BX;
  const A = BX.art = {};
  const TAU = Math.PI * 2, PI = Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const eout = t => 1 - Math.pow(1 - t, 3), ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  A.lerp = lerp; A.clamp = clamp; A.eout = eout; A.ease = ease;
  const shadeCache = new Map();
  function shade(hex, k) {
    const key = hex + k; let v = shadeCache.get(key); if (v) return v;
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    v = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; shadeCache.set(key, v); return v;
  }
  A.shade = shade;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
  function star(c, x, y, r, n = 5, inner = .45) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -PI / 2 + i * PI / n, rr2 = i % 2 ? r * inner : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); }
  function sparkle(c, x, y, r, col) { c.save(); c.fillStyle = col || '#fff'; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); }
  A.rr = rr; A.ell = ell; A.star = star; A.sparkle = sparkle;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ======================= ARÉNA (pré-rendue une fois par taille) =======================
  A.arena = function (W, H, q, circ) {
    const cv = document.createElement('canvas'); cv.width = Math.round(W * q); cv.height = Math.round(H * q);
    const g = cv.getContext('2d'); g.scale(q, q); cv.spectators = [];
    const C = circ || BX.CIRCUITS[0], R = rng(7 + (C.id || '').length * 13);
    let gr = g.createLinearGradient(0, 0, 0, 470); gr.addColorStop(0, '#05030f'); gr.addColorStop(1, '#1b1033'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // Faisceaux de projecteurs
    g.globalCompositeOperation = 'lighter';
    [[180, .05], [460, .04], [820, .04], [1100, .05]].forEach(([x, a]) => {
      const lg = g.createLinearGradient(x, 0, 640, 520); lg.addColorStop(0, 'rgba(255,240,200,' + a * 2 + ')'); lg.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = lg; g.beginPath(); g.moveTo(x - 18, -10); g.lineTo(x + 18, -10); g.lineTo(640 + (x - 640) * .3 + 140, 560); g.lineTo(640 + (x - 640) * .3 - 140, 560); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
    // Foule (rangées du fond vers l’avant)
    const shirts = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#ef6c00', '#00838f', '#ad1457', '#5d4037', '#eceff1', '#37474f'];
    const skins = ['#f1c7a1', '#e0ac7e', '#c68642', '#8d5524', '#f5d5c0', '#d9a066'];
    for (let row = 0; row < 7; row++) {
      const y = 120 + row * 44, sc = .55 + row * .09, dark = .62 - row * .06;
      for (let x = -20 + (row % 2) * 17; x < W + 30; x += 34 * sc + R() * 8) {
        const yy = y + R() * 8, sh = shirts[(R() * shirts.length) | 0], sk = skins[(R() * skins.length) | 0];
        g.fillStyle = shade(sh, -dark); ell(g, x, yy + 26 * sc, 17 * sc, 16 * sc); g.fill();
        g.fillStyle = shade(sk, -dark); ell(g, x, yy, 10 * sc, 11 * sc); g.fill();
        if (row >= 2 && row <= 4 && (x < 310 || x > 970)) cv.spectators.push({ x, y: yy });
        if (R() < .35) { g.fillStyle = shade(['#3e2723', '#212121', '#795548', '#fdd835'][(R() * 4) | 0], -dark); g.beginPath(); g.arc(x, yy - 3 * sc, 10 * sc, PI, TAU); g.fill(); }
        if (R() < .05 && row > 1) { // pancartes
          const txt = ['GO !', 'K.O. !', '♥', 'BOUM', 'WOW'][(R() * 5) | 0];
          g.save(); g.translate(x, yy - 22 * sc); g.rotate((R() - .5) * .3); g.fillStyle = shade('#fafafa', -dark * .6); g.fillRect(-26 * sc, -14 * sc, 52 * sc, 26 * sc);
          g.fillStyle = shade('#c62828', -dark * .5); g.font = '900 ' + (15 * sc) + 'px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 0); g.restore();
        }
      }
    }
    // Bannière du circuit (menus seulement)
    if (A.banner) {
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(440, 34, 400, 46);
    g.strokeStyle = C.color; g.lineWidth = 3; g.strokeRect(440, 34, 400, 46);
    g.fillStyle = C.color; g.font = '28px Bungee, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(C.name.toUpperCase(), 640, 58); }
    // Lampes du plafond
    for (let i = 0; i < 9; i++) { const x = 120 + i * 130; g.fillStyle = '#222'; g.fillRect(x - 16, 0, 32, 10); const lg = g.createRadialGradient(x, 12, 1, x, 12, 26); lg.addColorStop(0, 'rgba(255,250,220,.95)'); lg.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = lg; g.beginPath(); g.arc(x, 12, 26, 0, TAU); g.fill(); }
    // Tablier du ring
    g.fillStyle = C.apron || '#0d2a5c'; g.fillRect(0, 420, W, 34);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '20px Bungee, Impact, sans-serif'; g.textAlign = 'center';
    for (let x = 120; x < W; x += 340) g.fillText('K.O. EN FAMILLE', x, 438);
    // Plancher du ring
    g.beginPath(); g.moveTo(70, 452); g.lineTo(W - 70, 452); g.lineTo(W + 60, H); g.lineTo(-60, H); g.closePath();
    gr = g.createLinearGradient(0, 452, 0, H); gr.addColorStop(0, '#9fb3c8'); gr.addColorStop(.35, '#dfe7ef'); gr.addColorStop(1, '#f4f7fa'); g.fillStyle = gr; g.fill();
    g.save(); g.translate(640, 600); g.scale(1, .2); g.lineWidth = 14; g.strokeStyle = C.color; g.globalAlpha = .45; g.beginPath(); g.arc(0, 0, 330, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 250, 0, TAU); g.stroke(); g.restore();
    // Poteaux et câbles du fond
    const posts = [150, W - 150];
    posts.forEach(x => { gr = g.createLinearGradient(x - 12, 0, x + 12, 0); gr.addColorStop(0, '#666'); gr.addColorStop(.5, '#eee'); gr.addColorStop(1, '#555'); g.fillStyle = gr; g.fillRect(x - 10, 286, 20, 172); g.fillStyle = C.color; g.fillRect(x - 14, 280, 28, 14); });
    const ropes = C.ropes || ['#c62828', '#fff', '#1565c0'];
    [318, 356, 394].forEach((y, i) => {
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 9; g.beginPath(); g.moveTo(posts[0], y + 4); g.quadraticCurveTo(640, y + 14, posts[1], y + 4); g.stroke();
      g.strokeStyle = ropes[i]; g.lineWidth = 7; g.beginPath(); g.moveTo(posts[0], y); g.quadraticCurveTo(640, y + 10, posts[1], y); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(posts[0], y - 2); g.quadraticCurveTo(640, y + 8, posts[1], y - 2); g.stroke();
    });
    // Vignette
    gr = g.createRadialGradient(640, 380, 300, 640, 380, 820); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return cv;
  };

  // ======================= POSES DES ADVERSAIRES =======================
  // Repère local : pieds en (0,0), le haut est négatif. Gants : [0] = gauche de l’écran, [1] = droite.
  const G = {
    high: [{ x: -60, y: -322 }, { x: 60, y: -322 }],
    low: [{ x: -60, y: -212 }, { x: 60, y: -212 }],
    both: [{ x: -22, y: -372 }, { x: 24, y: -334 }],
    open: [{ x: -95, y: -270 }, { x: 95, y: -270 }],
  };
  function base(s, b) {
    const T = s.time || 0, g0 = G[s.guard] || G.high, slow = s.tired ? .5 : 1;
    const R = {
      bx: 0, by: Math.sin(T * 3.2 * slow) * 4, rot: Math.sin(T * 1.7) * .025, sx: 1, sy: 1, hx: Math.sin(T * 1.7) * 3, hy: 0, hr: 0, belly: 0, spin: 1,
      expr: s.expr || 'calm', ring: 0, knee: 0, blow: 0,
      g: [{ x: g0[0].x, y: g0[0].y + Math.sin(T * 3.2 + 1) * 5, s: 1 }, { x: g0[1].x, y: g0[1].y + Math.sin(T * 3.2) * 5, s: 1 }],
    };
    const style=b?.boxingStyle;
    if(style){
      const fatigue=b.sprinter?1/(1+((s.round||1)-1)*.6):1,beat=T*style.tempo*fatigue;
      const wave=b.id==='robot'?Math.round(Math.sin(beat)):Math.sin(beat);
      R.bx=wave*style.sway;R.by=Math.abs(Math.sin(beat))*style.bounce*fatigue;
      R.rot=style.lean+Math.sin(beat*.5)*.018;R.hx=-wave*style.sway*.25;
      R.hy=b.sprinter?((s.round||1)-1)*7:0;
      R.g.forEach((g,i)=>{g.x*=style.width;g.y+=(i===0?style.lead:-style.lead)*.5;});
    }
    return R;
  }
  const to = (g, x, y, sc, k) => { g.x = lerp(g.x, x, k); g.y = lerp(g.y, y, k); g.s = lerp(g.s, sc, k); };
  const P = {}; // poses : P[nom](R, sd, ph, t, T) — sd = -1 gant gauche de l’écran, +1 droit
  P.jab = (R, sd, ph, t, T) => {
    const a = R.g[sd < 0 ? 0 : 1];
    if (ph === 'tell') { const e = eout(t); to(a, sd * 100, -362, .92, e); a.x += t > .55 ? Math.sin(T * 70) * 3 : 0; R.rot += sd * .07 * e; R.expr = 'tell'; }
    else { to(a, sd * 100, -362, .92, 1); const e = eout(Math.min(1, t * 3)); to(a, sd * 18, -168, 2.5, e); R.rot += lerp(sd * .07, -sd * .07, e); R.by += 12 * e; R.hx -= sd * 8 * e; R.expr = 'angry'; }
  };
  P.body = (R, sd, ph, t, T) => {
    P.jab(R,sd,ph,t,T);const g=R.g[sd<0?0:1];g.y+=ph==='tell'?110:75;R.by+=12;R.rot+=sd*.08;
  };
  P.hook = (R, sd, ph, t, T) => {
    const a = R.g[sd < 0 ? 0 : 1];
    if (ph === 'tell') { const e = eout(t); to(a, sd * 205, -318, .95, e); R.rot += sd * .2 * e; R.hx += sd * 14 * e; R.expr = 'tell'; if (t > .6) a.y += Math.sin(T * 60) * 3; }
    else { const k = eout(Math.min(1, t * 2.6)); a.x = lerp(sd * 205, -sd * 40, k); a.y = -318 - Math.sin(k * PI) * 34 + k * 150; a.s = lerp(.95, 2.3, k); R.rot += lerp(sd * .2, -sd * .18, k); R.expr = 'angry'; }
  };
  P.upper = (R, sd, ph, t) => {
    const a = R.g[sd < 0 ? 0 : 1];
    if (ph === 'tell') { const e = eout(t); to(a, sd * 82, -150, 1, e); R.by += 28 * e; R.rot += sd * .12 * e; R.hy += 10 * e; R.expr = 'tell'; }
    else { const k = eout(Math.min(1, t * 2.6)); a.x = lerp(sd * 82, sd * 12, k); a.y = lerp(-150, -250, k); a.s = lerp(1, 2.7, k); R.by += lerp(28, -24, k); R.rot += lerp(sd * .12, -sd * .08, k); R.hy -= 10 * k; R.expr = 'angry'; }
  };
  // Techniques de boxe aux trajectoires distinctes ; les signaux restent attachés au gant.
  P.cross=(R,sd,ph,t,T)=>{P.jab(R,sd,ph,t,T);const e=ph==='tell'?ease(t):Math.sin(Math.min(1,t*2)*PI/2);R.rot-=sd*.13*e;R.bx-=sd*12*e;R.g[sd<0?1:0].y=-335;};
  P.stepJab=(R,sd,ph,t,T)=>{P.jab(R,sd,ph,t,T);const e=ph==='tell'?ease(t):1-ease(t);R.by-=8*e;R.bx+=sd*14*e;R.knee=.12*e;};
  P.shovel=(R,sd,ph,t,T)=>{P.upper(R,sd,ph,t,T);const g=R.g[sd<0?0:1],e=ph==='tell'?ease(t):1-ease(t);g.x+=sd*55*e;g.y+=35*e;R.rot+=sd*.16*e;};
  P.overhand=(R,sd,ph,t,T)=>{const g=R.g[sd<0?0:1];if(ph==='tell'){to(g,sd*145,-475,.95,ease(t));R.rot+=sd*.16*t;R.expr='tell';}else{const e=eout(Math.min(1,t*2.8));to(g,lerp(sd*145,-sd*15,e),lerp(-475,-170,e),lerp(.95,2.5,e),1);R.rot-=sd*.18*e;R.by+=20*e;R.expr='angry';}};
  P.checkHook=(R,sd,ph,t,T)=>{P.hook(R,sd,ph,t,T);const e=ph==='tell'?ease(t):1-ease(t);R.bx-=sd*35*e;R.rot+=sd*.08*e;R.knee=.2*e;};
  P.overhead = (R, sd, ph, t, T) => {
    if (ph === 'tell') { const e = eout(t); to(R.g[0], -24, -540, 1.02, e); to(R.g[1], 24, -540, 1.02, e); R.by -= 12 * e; R.hy -= 8 * e; R.sy = 1 + .03 * e; R.expr = t > .5 ? 'shout' : 'tell'; if (t > .6) R.bx += Math.sin(T * 50) * 3; }
    else { const k = eout(Math.min(1, t * 3)); to(R.g[0], -24, -540, 1.02, 1); to(R.g[1], 24, -540, 1.02, 1); to(R.g[0], -20, -168, 2.5, k); to(R.g[1], 20, -168, 2.5, k); R.by += 22 * k; R.hy += 22 * k; R.expr = 'angry'; }
  };
  P.charge = (R, sd, ph, t, T) => {
    to(R.g[0], -50, -300, 1, 1); to(R.g[1], 50, -300, 1, 1);
    if (ph === 'tell') { const e = eout(t); R.by += 40 * e; R.hy += 45 * e; R.sy = 1 - .05 * e; R.bx += Math.sin(T * 55) * 6 * e; R.expr = 'angry'; R.lowerHead = e; }
    else { const k = eout(Math.min(1, t * 3)); R.by += lerp(40, 175, k); R.hy += 45; R.sx = R.sy = lerp(.95, 1.65, k); R.expr = 'angry'; R.lowerHead = 1; }
  };
  P.axeDown=(R,sd,ph,t,T)=>{
    const g=R.g[sd<0?0:1];
    if(ph==='tell'){to(g,sd*88,-530,1.05,eout(t));R.expr='tell';R.by-=8*ease(t);}
    else{const e=eout(Math.min(1,t*3));to(g,sd*70,lerp(-530,-160,e),lerp(1.05,2.3,e),1);R.by+=24*e;R.expr='angry';}
  };
  P.axeWind=(R,sd,ph,t,T)=>{
    if(ph!=='tell'){P.axeDown(R,sd,ph,t,T);return;}
    const e=ease(t);R.by-=18*e;R.sx=R.sy=1-.06*e;R.expr='tell';
    const spin=t*Math.PI*6;to(R.g[1],125+Math.cos(spin)*45,-380+Math.sin(spin)*55,1.05,1);to(R.g[0],-75,-255,1,1);
  };
  P.mooseCharge=(R,sd,ph,t,T)=>{
    if(ph==='tell'){P.charge(R,sd,ph,t,T);const beat=t*4;R.knee=beat<3?Math.sin((beat%1)*PI)*.75:0;R.hr+=Math.sin(T*40)*.035;R.sx=R.sy=1-.06*ease(t);}
    else{P.upper(R,1,ph,t,T);R.by+=70*eout(t);R.sx=R.sy=1+.35*Math.sin(Math.min(1,t*2)*PI/2);R.rot-=.12;}
  };
  P.forestQuake=(R,sd,ph,t,T)=>{
    P.overhead(R,sd,ph,t,T);
    if(ph!=='tell'){const e=eout(Math.min(1,t*3));to(R.g[0],-90,-30,1.5,e);to(R.g[1],90,-30,1.5,e);R.by+=50*e;R.hy+=35*e;R.knee=.4*e;}
  };
  P.mapleDrink=(R,sd,ph,t,T)=>{
    R.sx=R.sy=1-.07*ease(t/.18);R.by-=12+Math.sin(clamp(t/.18,0,1)*PI)*24;R.expr='eat';R.hr=-.1;
    to(R.g[0],-85,-225,1,1);to(R.g[1],48,-410+Math.sin(T*7)*3,1,1);
  };
  P.belly = (R, sd, ph, t) => {
    to(R.g[0], -135, -300, 1, 1); to(R.g[1], 135, -300, 1, 1);
    if (ph === 'tell') { const e = eout(t); R.belly = .7 * e; R.by -= 8 * e; R.hy -= 8 * e; R.sy = 1 + .04 * e; R.expr = 'smug'; }
    else { const k = eout(Math.min(1, t * 3)); R.belly = .7; R.by += lerp(-8, 140, k); R.sx = R.sy = lerp(1, 1.45, k); R.expr = 'shout'; }
  };
  P.throw = (R, sd, ph, t) => {
    const a = R.g[sd < 0 ? 0 : 1];
    if (ph === 'tell') { const e = eout(t); to(a, sd * 125, -495, .95, e); R.rot += sd * .12 * e; R.expr = 'tell'; R.hold = sd < 0 ? 0 : 1; }
    else { to(a, sd * 125, -495, .95, 1); const k = eout(Math.min(1, t * 4)); to(a, sd * 30, -255, 1.4, k); R.rot += lerp(sd * .12, -sd * .1, k); R.expr = 'angry'; }
  };
  P.stomp = (R, sd, ph, t) => {
    to(R.g[0], -95, -392, 1, 1); to(R.g[1], 95, -392, 1, 1);
    if (ph === 'tell') { const e = eout(t); R.by -= 30 * e; R.knee = e; R.expr = 'angry'; }
    else { R.by += lerp(-30, 12, Math.min(1, t * 5)); R.knee = Math.max(0, 1 - t * 5); R.expr = 'shout'; R.ring = t; }
  };
  P.shout = (R, sd, ph, t) => {
    const e = ph === 'tell' ? eout(t) : 1;
    to(R.g[0], -120, -262, 1, e); to(R.g[1], 120, -262, 1, e); R.hy -= 6 * e; R.expr = e > .5 ? 'shout' : 'tell';
    if (ph === 'strike') R.ring = t;
  };
  P.whistle = (R,sd,ph,t) => { P.shout(R,sd,ph,t); R.whistle=1;R.expr='whistle';to(R.g[1],48,-390,.8,1); };
  P.present = (R, sd, ph, t, T) => {
    const e = ph === 'tell' ? eout(t) : 1;
    to(R.g[1], 125, -470 + Math.sin(T * 8) * 6, 1, e); to(R.g[0], -60, -300, 1, e); R.rot += .05 * e; R.expr = 'smug';
  };
  P.spin = (R, sd, ph, t, T) => {
    if (ph === 'tell') { const e = ease(t); R.spin = Math.cos(e * TAU * 2); to(R.g[0], -160, -320, 1, 1); to(R.g[1], 160, -320, 1, 1); R.expr = 'smug'; }
    else P.sweep(R, sd, ph, t, T);
  };
  P.sweep = (R, sd, ph, t) => {
    const a = R.g[sd < 0 ? 0 : 1], o = R.g[sd < 0 ? 1 : 0];
    if (ph === 'tell') { const e = eout(t); to(a, sd * 235, -360, 1, e); R.rot += sd * .25 * e; R.hx += sd * 10 * e; R.expr = 'tell'; }
    else { const k = eout(Math.min(1, t * 2.4)); a.x = lerp(sd * 250, -sd * 260, k); a.y = -300 + Math.sin(k * PI) * 25; a.s = lerp(1.2, 1.9, Math.sin(k * PI)); R.rot += lerp(sd * .25, -sd * .25, k); to(o, -sd * 70, -300, 1, 1); R.expr = 'angry'; }
  };
  P.grab = (R, sd, ph, t) => {
    if (ph === 'tell') { const e = eout(t); to(R.g[0], -235, -330, 1.1, e); to(R.g[1], 235, -330, 1.1, e); R.by += 10 * e; R.expr = 'smug'; }
    else { const k = eout(Math.min(1, t * 3)); to(R.g[0], -235, -330, 1.1, 1); to(R.g[1], 235, -330, 1.1, 1); to(R.g[0], -45, -200, 2.4, k); to(R.g[1], 45, -200, 2.4, k); R.by += 10 + 20 * k; R.expr = 'angry'; }
  };
  P.knit = (R, sd, ph, t, T) => {
    const e = ph === 'tell' ? eout(t) : 1;
    to(R.g[0], -26 + Math.sin(T * 22) * 6, -300, 1, e); to(R.g[1], 26 - Math.sin(T * 22) * 6, -300, 1, e); R.expr = 'smug'; R.needles = 1;
    if (ph === 'strike') { to(R.g[0], -70, -280, 1.2, Math.min(1, t * 4)); to(R.g[1], 70, -280, 1.2, Math.min(1, t * 4)); }
  };
  P.blow = (R, sd, ph, t, T) => {
    const e = ph === 'tell' ? eout(t) : 1;
    to(R.g[0], -125, -335, 1, e); to(R.g[1], 125, -335, 1, e); R.hy -= 14 * e; R.by -= 8 * e;
    if (ph === 'strike') { R.blow = 1; R.bx += Math.sin(T * 60) * 3; }
  };
  P.leap = (R, sd, ph, t) => {
    to(R.g[0], -60, -520, 1, 1); to(R.g[1], 60, -520, 1, 1);
    if (ph === 'tell') { if (t < .45) { R.by += 40 * eout(t / .45); to(R.g[0], -80, -300, 1, 1); to(R.g[1], 80, -300, 1, 1); } else R.by += 40 - eout((t - .45) / .55) * 900; R.expr = 'shout'; }
    else { const k = eout(Math.min(1, t * 2.4)); R.by += lerp(-860, 150, k); R.sx = R.sy = lerp(1.1, 1.6, k); R.expr = 'shout'; }
  };
  // Poses « libres » (pause, provocation) : t va de 0 à 1 sur toute la durée.
  P.eat = (R, sd, ph, t, T) => { to(R.g[0], -48, -292, 1, 1); to(R.g[1], 26, -385 + Math.sin(T * 7) * 26, 1, 1); R.expr = 'eat'; R.hr = Math.sin(T * 7) * .05; };
  P.jacks = (R, sd, ph, t, T) => { const p = (Math.sin(T * 9) + 1) / 2; to(R.g[0], -lerp(70, 170, p), lerp(-250, -540, p), 1, 1); to(R.g[1], lerp(70, 170, p), lerp(-250, -540, p), 1, 1); R.by -= Math.abs(Math.sin(T * 9)) * 18; R.expr = 'smug'; };
  P.flex = (R, sd, ph, t, T) => { const b = Math.sin(T * 6); to(R.g[0], -158, -432 + b * 12, 1.05, 1); to(R.g[1], 158, -432 - b * 12, 1.05, 1); R.hy += b * 3; R.expr = 'smug'; R.flexing = 1; };
  P.taunt = (R, sd, ph, t, T) => { to(R.g[0], -150 - Math.sin(T * 9) * 20, -260, 1, 1); to(R.g[1], 150 + Math.sin(T * 9) * 20, -260, 1, 1); R.expr = 'shout'; R.hy += Math.sin(T * 9) * 3; };
  P.overheat = (R, sd, ph, t, T) => { to(R.g[0], -85, -200, .95, 1); to(R.g[1], 85, -200, .95, 1); R.by += 20; R.hr = .15 + Math.sin(T * 3) * .05; R.expr = 'dizzy'; R.steam = 1; };
  P.stop = (R, sd, ph, t, T) => { to(R.g[1], 80, -510, 1.15, 1); to(R.g[0], -60, -300, 1, 1); R.sign = 'stop'; R.expr = t < .3 ? 'shout' : 'tell'; R.whistle = t < .3 ? 1 : 0; };
  P.go = (R, sd, ph, t) => { to(R.g[1], 90, -470, 1, 1); to(R.g[0], -70, -260, 1, 1); R.sign = 'go'; R.expr = 'oops'; };
  P.laugh = (R, sd, ph, t, T) => { to(R.g[0], -50, -230, 1, 1); to(R.g[1], 50, -230, 1, 1); R.hy -= 10 + Math.abs(Math.sin(T * 14)) * 5; R.hr = -.1; R.expr = 'win'; };
  A.poses = P;

  A.pose = function (b, s) {
    const T = s.time || 0, m = s.move, R = base(s,b);
    const ph = s.ph, t = clamp(s.t || 0, 0, 1);
    if (m && (ph === 'tell' || ph === 'strike' || ph === 'rec' || ph === 'after')) {
      const fn = P[m.pose] || P.jab, sd = m.from === 'R' ? 1 : -1;
      // L’ouverture (rec) et le retour (after) partent de la fin du coup et reviennent vers la garde.
      if (ph === 'tell' || ph === 'strike') {const weight=b.boxingStyle?.tempo||2;const motion=ph==='strike'?Math.pow(t,weight>3?.7:weight<1.6?1.35:1):t;fn(R,sd,ph,motion,T);}
      else if(m.feint&&m.follow)fn(R,sd,'tell',1-ease(t),T);
      else if (/^(charge|leap|belly)$/.test(m.pose)) {
        const w = ph === 'rec' ? 1 - ease(clamp((t - .7) / .3, 0, 1)) : 1 - ease(t);
        R.by += 34 * w; R.hy += 22 * w; R.rot += Math.sin(T * 7) * .09 * w; R.hr += Math.sin(T * 5) * .12 * w;
        to(R.g[0], -110, -210, 1, w); to(R.g[1], 110, -210, 1, w); if (ph === 'rec') R.expr = 'dizzy';
      }
      else {
        const M = base(s,b); fn(M, sd, 'strike', 1, T);
        const w = ph === 'rec' ? 1 - ease(clamp((t - .65) / .35, 0, 1)) : 1 - ease(t);
        mix(R, M, w); R.expr = ph === 'rec' ? 'oops' : R.expr;
        if (ph === 'rec') { R.by += 8; R.hy += 6; }
      }
    } else if (ph === 'free' && m) { (P[m.pose] || P.taunt)(R, 1, 'free', t, T); }
    else if (ph === 'stop') P.stop(R, 1, 'free', t, T);
    else if (ph === 'go') P.go(R, 1, 'free', t, T);
    else if (ph === 'laugh') P.laugh(R, 1, 'free', t, T);
    else if (ph === 'hitstun') { R.expr = 'hurt'; to(R.g[0], -95, -255, 1, .6); to(R.g[1], 95, -255, 1, .6); }
    else if (ph === 'cover') { const g = G.both; to(R.g[0], g[0].x, g[0].y, 1.1, 1); to(R.g[1], g[1].x, g[1].y, 1.1, 1); R.expr = 'tell'; R.by += 6; }
    else if (ph === 'down' || ph === 'ko' || ph === 'getup') {
      let e = ph === 'down' ? eout(t) : ph === 'ko' ? 1 : 1 - ease(t);
      if (ph === 'down' && s.fakeRise) { e *= 1 - clamp(s.fakeRise, 0, .75); R.bx += Math.sin(T * 19) * 5 * s.fakeRise; }
      // Le corps pivote à la hanche, les jambes se replient, les bras retombent.
      // Les proportions restent intactes jusque dans la pose allongée.
      R.fall = e; R.by = 105 * e; R.rot = (s.fallSide || 1) * PI / 2 * e; R.hy += 12 * Math.sin(e * PI);
      R.bx += (s.fallSide || 1) * 25 * e;
      to(R.g[0], -150, -235, .95, e); to(R.g[1], 145, -150, .95, e); R.expr = e > .5 ? 'ko' : 'dizzy';
      if (ph === 'getup' && t > .3) R.bx += Math.sin(T * 9) * 8 * (1 - t);
    }
    else if (ph === 'rest') {
      R.rest = true; R.knee = .5; R.hy += 8; R.hr = -.035; R.expr = 'calm';
      to(R.g[0], -80, -190, .9, 1); to(R.g[1], 80, -190, .9, 1);
    }
    else if (ph === 'win') { const b = Math.abs(Math.sin(T * 5)); to(R.g[0], -95, -545 - b * 20, 1.05, 1); to(R.g[1], 95, -545 - b * 20, 1.05, 1); R.by -= b * 14; R.expr = 'win'; }
    else if (ph === 'intro') { R.expr = 'smug'; }
    else if (ph === 'dizzy') { R.expr = 'dizzy'; R.rot += Math.sin(T * 4) * .08; to(R.g[0], -90, -230, 1, 1); to(R.g[1], 90, -230, 1, 1); }
    // Réaction aux coups reçus (se superpose)
    if (s.react && s.react.k > 0) {
      const k = s.react.k, sd = s.react.side || 1;
      if (s.react.kind === 'head') { R.hx += sd * 18 * k; R.hy -= 10 * k; R.hr += sd * .28 * k; R.rot += sd * .05 * k; }
      else if (s.react.kind === 'upper') { R.hy -= 34 * k; R.by -= 14 * k; R.hr += sd * .15 * k; R.sy *= 1 + .04 * k; }
      else { R.by += 14 * k; R.hy += 16 * k; R.g.forEach(g => g.y += 30 * k); R.sy *= 1 - .04 * k; }
      if (ph !== 'down' && ph !== 'ko') R.expr = 'hurt';
    }
    if(b.look.catlady&&!s.react&&['idle','intro','tell','strike','free'].includes(ph)){R.expr=Math.sin(T*9)>.2?'shout':'angry';R.hr+=Math.sin(T*7)*.035;}
    if (s.expr && ph === 'idle') R.expr = s.expr;
    if(s.surprised){R.expr='surprised';R.hr+=Math.sin(T*12)*.07;to(R.g[0],-125,-185,1,1);to(R.g[1],125,-190,1,1);}
    return R;
  };
  function mix(R, M, w) {
    for (const k of ['bx', 'by', 'rot', 'sx', 'sy', 'hx', 'hy', 'hr', 'belly', 'spin', 'knee']) R[k] = lerp(R[k], M[k], w);
    for (let i = 0; i < 2; i++) { R.g[i].x = lerp(R.g[i].x, M.g[i].x, w); R.g[i].y = lerp(R.g[i].y, M.g[i].y, w); R.g[i].s = lerp(R.g[i].s, M.g[i].s, w); }
    if (w > .5) { R.lowerHead = M.lowerHead; R.expr = M.expr; }
  }

  // ======================= DESSIN D’UN ADVERSAIRE =======================
  // ctx doit être placé aux pieds de l’adversaire (échelle comprise).
  A.boxer = function (ctx, b, s) {
    const L = s.look || b.look, R = s.R || A.pose(b, s), T = s.time || 0, w = L.w || 1;
    ctx.save();
    // Ombre au sol
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(ctx, R.bx * .6 + (s.fallSide || 1) * (R.fall || 0) * 45, 4, (120 + 140 * (R.fall || 0)) * w * R.sx, 18, 0); ctx.fill();
    ctx.translate(R.bx, R.by);
    if (R.fall != null) ctx.translate(0, -170);
    ctx.rotate(R.rot);
    if (R.fall != null) ctx.translate(0, 170);
    ctx.scale(R.sx * R.spin, R.sy);
    const back = R.spin < 0;
    if (L.cape && !s.noCape) drawCape(ctx, L, R, w, T);
    drawLegs(ctx, L, R, w);
    if (L.kind === 'robot') drawRobotBody(ctx, L, R, w, T); else drawTorso(ctx, L, R, w, T, s);
    if (back) { drawBackHead(ctx, L, R); }
    else if(s.familyId && root.FamilyHeads?.frame(s.familyId,'front')){
      const img=root.FamilyHeads.frame(s.familyId,'front');ctx.save();ctx.translate(R.hx,-392+R.hy);ctx.rotate(R.hr);const h=145,w=h*img.width/img.height;ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
    }
    else if (L.kind === 'robot') drawRobotHead(ctx, L, R, s, T);
    else if (L.kind === 'shadow') drawShadowHead(ctx, L, R, s, T);
    else drawHead(ctx, L, R, s, T);
    // Bras et gants : le plus petit (le plus loin) d’abord
    const order = R.g[0].s <= R.g[1].s ? [0, 1] : [1, 0];
    for (const i of order) { drawArm(ctx, L, R, w, i, s); }
    drawProps(ctx, L, R, s, T);
    if(s.burn>0)drawBodyFire(ctx,L,R,T,s.burn);
    ctx.restore();
    return R;
  };

  // Flammes ancrées au torse et aux membres, dans le repère animé du boxeur.
  function drawBodyFire(c,L,R,T,remaining){
    const w=L.w||1,shoulder=70*w*(L.shoulders||1);
    const patches=[[-shoulder,-300,1],[shoulder,-300,.9],[-28*w,-245,1.1],[30*w,-200,.85],[0,-160,.7],...R.g.map(g=>[g.x,g.y+10*g.s,.65*g.s])];
    c.save();c.globalAlpha=Math.min(1,remaining*2);
    patches.forEach(([x,y,size],i)=>{
      c.save();c.translate(x,y);c.scale(size,size);
      const flicker=Math.sin(T*17+i*2.3),h=44+flicker*10,lean=Math.sin(T*11+i)*10;
      c.shadowColor='#ff6924';c.shadowBlur=13;
      for(const [color,scale] of [['#ed3a19',1],['#ff971e',.73],['#fff19b',.38]]){
        c.save();c.scale(scale,scale);c.fillStyle=color;c.beginPath();c.moveTo(-17,2);
        c.bezierCurveTo(-29,-13,-8,-28,-15,-h*.7);
        c.quadraticCurveTo(-3,-h*.52,lean,-h);
        c.bezierCurveTo(lean+17,-h*.65,7,-h*.45,19,-h*.35);
        c.bezierCurveTo(29,-10,14,8,-17,2);c.fill();c.restore();
      }c.restore();
    });c.restore();
  }
  function skinOf(L) { return L.kind === 'shadow' ? '#1d0b3a' : L.kind === 'robot' ? '#90a4ae' : (L.skin || '#f1c7a1'); }
  function drawCape(c, L, R, w, T) {
    const sw = 100 * w, fl = Math.sin(T * 2) * 10;
    c.fillStyle = shade(L.cape, -.25);
    c.beginPath(); c.moveTo(-sw, -320); c.quadraticCurveTo(-sw - 40, -150, -sw - 50 + fl, -30); c.lineTo(sw + 50 - fl, -30); c.quadraticCurveTo(sw + 40, -150, sw, -320); c.closePath(); c.fill();
    c.fillStyle = L.cape; c.beginPath(); c.moveTo(-sw, -320); c.quadraticCurveTo(-sw - 30, -150, -sw - 40 + fl, -34); c.lineTo(-sw * .75, -40); c.lineTo(-sw * .7, -300); c.fill();
    c.beginPath(); c.moveTo(sw, -320); c.quadraticCurveTo(sw + 30, -150, sw + 40 - fl, -34); c.lineTo(sw * .75, -40); c.lineTo(sw * .7, -300); c.fill();
    if (L.capeTrim) { c.fillStyle = L.capeTrim; for (let i = -5; i <= 5; i++) { c.beginPath(); c.arc(i * sw * .2, -322 + Math.abs(i) * 4, 16, 0, TAU); c.fill(); } }
  }
  function drawLegs(c, L, R, w) {
    const sk = skinOf(L), lw = 36 * Math.sqrt(w) * (L.legs || 1);
    for (const sd of [-1, 1]) {
      const kneeUp = sd > 0 ? R.knee : 0;
      c.strokeStyle = L.kind === 'robot' ? '#546e7a' : sk; c.lineWidth = lw; c.lineCap = 'round';
      const fold = R.fall || 0, spread = R.rest ? 24 : fold * (sd > 0 ? 30 : 14);
      const footX = sd * (50 * (L.stance || 1) + spread) * w, footY = -14 - kneeUp * 90 - fold * (sd > 0 ? 36 : 5);
      c.beginPath(); c.moveTo(sd * 40 * w, -120); c.lineTo(sd * (52 * (L.stance || 1) + spread) * w, -60 - kneeUp * 70 - fold * 28); c.lineTo(footX, footY); c.stroke();
      c.fillStyle = L.kind === 'robot' ? '#263238' : '#1b1b1b'; rr(c, footX - 28, footY - 8, 56, 26, 10); c.fill();
      if(L.slippers){c.fillStyle=sd<0?'#b18baa':'#8ea183';ell(c,footX,footY+4,35,17);c.fill();c.fillStyle='#ddd8c1';ell(c,footX-9,footY,11,8);c.fill();}
      if (L.kind === 'robot') { c.fillStyle = '#455a64'; for (let i = 0; i < 4; i++) c.fillRect(sd * 50 * w - 24 + i * 13, -14 - kneeUp * 90, 8, 8); }
    }
    // Culotte
    const tw = 82 * w * (L.waist || 1) * (1 + (L.belly || 0) * .12);
    c.fillStyle = L.trunks; c.beginPath(); c.moveTo(-tw, -178); c.lineTo(tw, -178); c.lineTo(tw + 8, -98); c.lineTo(8, -104); c.lineTo(0, -128); c.lineTo(-8, -104); c.lineTo(-tw - 8, -98); c.closePath(); c.fill();
    c.fillStyle = L.trim || '#fff'; c.fillRect(-tw, -182, tw * 2, 16);
    c.fillStyle = shade(L.trunks, -.25); c.fillRect(-tw - 8, -106, 14, 8); c.fillRect(tw - 6, -106, 14, 8);
  }
  function torsoPath(c, sw, ww, belly, chest = 1) {
    c.beginPath(); c.moveTo(-sw, -312);
    c.quadraticCurveTo(-sw * chest - 6, -240, -ww - belly * 30, -175);
    c.lineTo(ww + belly * 30, -175); c.quadraticCurveTo(sw * chest + 6, -240, sw, -312);
    c.quadraticCurveTo(0, -342, -sw, -312); c.closePath();
  }
  function drawTorso(c, L, R, w, T, s) {
    const sk = skinOf(L), sw = 94 * w * (L.shoulders || 1), ww = 66 * w * (L.waist || 1), bl = (L.belly || 0) + R.belly, sh = L.shirt || { type: 'bare' };
    // Cou
    c.fillStyle = shade(sk, -.08); rr(c, -24 * (L.neck || 1), -350, 48 * (L.neck || 1), 50, 14); c.fill();
    torsoPath(c, sw, ww, bl, L.chest || 1);
    if (L.kind === 'shadow') {
      const gr = c.createLinearGradient(0, -340, 0, -170); gr.addColorStop(0, '#2b1259'); gr.addColorStop(1, '#0b0218'); c.fillStyle = gr; c.fill();
      c.strokeStyle = 'rgba(160,110,255,.7)'; c.lineWidth = 3; c.stroke();
    } else {
      const solid = { tank: sk, bare: sk, plaid: sh.c1, vest: '#eceff1', track: sh.c1, jersey: sh.c1, blazer: sh.c1, cardigan: sh.c1 }[sh.type] || sk;
      c.fillStyle = solid; c.fill();
      c.save(); torsoPath(c, sw, ww, bl, L.chest || 1); c.clip();
      if (sh.type === 'plaid') { c.globalAlpha = .45; c.fillStyle = sh.c2; for (let x = -sw - 40; x < sw + 40; x += 34) c.fillRect(x, -345, 12, 190); for (let y = -340; y < -170; y += 34) c.fillRect(-sw - 40, y, sw * 2 + 80, 12); c.globalAlpha = 1; c.strokeStyle = shade(sh.c1, -.4); c.lineWidth = 3; c.beginPath(); c.moveTo(0, -330); c.lineTo(0, -175); c.stroke(); }
      if (sh.type === 'tank') {
        c.fillStyle = sh.c1; c.beginPath(); c.moveTo(-sw * .6, -322); c.lineTo(-sw * .38, -322); c.quadraticCurveTo(0, -268, sw * .38, -322); c.lineTo(sw * .6, -322); c.quadraticCurveTo(sw * .74, -250, ww + bl * 30 + 10, -175); c.lineTo(-ww - bl * 30 - 10, -175); c.quadraticCurveTo(-sw * .74, -250, -sw * .6, -322); c.fill();
        if (sh.stain) { c.fillStyle = 'rgba(140,80,20,.55)'; ell(c, -20, -232, 16, 11, .3); c.fill(); ell(c, 22, -205, 9, 7); c.fill(); }
      }
      if (sh.type === 'vest') {
        c.fillStyle = sh.c1; c.beginPath(); c.moveTo(-sw * .7, -322); c.lineTo(-sw * .2, -322); c.lineTo(-10, -250); c.lineTo(-10, -175); c.lineTo(-ww - 30, -175); c.lineTo(-sw - 10, -300); c.fill();
        c.beginPath(); c.moveTo(sw * .7, -322); c.lineTo(sw * .2, -322); c.lineTo(10, -250); c.lineTo(10, -175); c.lineTo(ww + 30, -175); c.lineTo(sw + 10, -300); c.fill();
        c.fillStyle = sh.c2; c.fillRect(-sw - 10, -232, sw * 2 + 20, 13); c.fillRect(-sw - 10, -202, sw * 2 + 20, 13);
      }
      if (sh.type === 'track') { c.fillStyle = sh.c2; c.fillRect(-3, -335, 6, 165); c.fillRect(-sw, -312, 14, 140); c.fillRect(sw - 14, -312, 14, 140); }
      if (sh.type === 'jersey') {
        c.fillStyle = sh.c2; c.fillRect(-sw - 10, -228, sw * 2 + 20, 16); c.fillStyle = shade(sh.c1, -.3); c.fillRect(-sw - 10, -212, sw * 2 + 20, 8);
        c.fillStyle = sh.c2; c.font = '900 52px Nunito, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sh.num || '', 0, -270);
        c.strokeStyle = shade(sh.c1, -.4); c.lineWidth = 2; c.strokeText(sh.num || '', 0, -270);
      }
      if (sh.type === 'blazer') { c.fillStyle = sh.c2; c.beginPath(); c.moveTo(-36, -330); c.lineTo(36, -330); c.lineTo(0, -230); c.fill(); c.fillStyle = shade(sh.c1, -.3); c.beginPath(); c.moveTo(-36, -330); c.lineTo(-10, -240); c.lineTo(-48, -270); c.fill(); c.beginPath(); c.moveTo(36, -330); c.lineTo(10, -240); c.lineTo(48, -270); c.fill(); c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(-50, -290, 6, 0, TAU); c.fill(); }
      if (sh.type === 'cardigan') { c.fillStyle = sh.c2; c.beginPath(); c.moveTo(-30, -332); c.lineTo(30, -332); c.lineTo(8, -175); c.lineTo(-8, -175); c.fill(); c.fillStyle = shade(sh.c1, -.35); for (let y = -300; y < -180; y += 30) { c.beginPath(); c.arc(-14, y, 5, 0, TAU); c.fill(); } c.strokeStyle = shade(sh.c1, -.2); c.lineWidth = 2; for (let y = -320; y < -180; y += 12) { c.beginPath(); c.moveTo(-sw, y); c.lineTo(-30, y); c.moveTo(30, y); c.lineTo(sw, y); c.stroke(); } }
      if (sh.type === 'bare' || sh.type === 'tank') {
        c.strokeStyle = shade(sk, -.22); c.lineWidth = 3; c.lineCap = 'round';
        if (sh.type === 'bare') { c.beginPath(); c.moveTo(-sw * .7, -268); c.quadraticCurveTo(-sw * .35, -244, -6, -262); c.moveTo(sw * .7, -268); c.quadraticCurveTo(sw * .35, -244, 6, -262); c.stroke(); if (bl < .3) { for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-22, -232 + i * 20); c.lineTo(-6, -230 + i * 20); c.moveTo(22, -232 + i * 20); c.lineTo(6, -230 + i * 20); c.stroke(); } } }
      }
      c.restore();
      if (bl > 0) { // bedaine
        c.fillStyle = sh.type === 'tank' ? sh.c1 : sh.type === 'bare' ? sk : solid; ell(c, 0, -205, (ww + bl * 30) * .95, 46 + bl * 22); c.fill();
        if (sh.type === 'plaid') { c.save(); ell(c, 0, -205, (ww + bl * 30) * .95, 46 + bl * 22); c.clip(); c.globalAlpha = .45; c.fillStyle = sh.c2; for (let x = -sw - 40; x < sw + 40; x += 34) c.fillRect(x, -280, 12, 160); for (let y = -270; y < -140; y += 34) c.fillRect(-sw - 40, y, sw * 2 + 80, 12); c.restore(); c.strokeStyle = shade(sh.c1, -.4); c.lineWidth = 3; c.beginPath(); c.moveTo(0, -250); c.lineTo(0, -160); c.stroke(); }
        c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 3; c.beginPath(); c.arc(0, -190 + bl * 6, 6, 0, PI); c.stroke();
        if (sh.stain) { c.fillStyle = 'rgba(140,80,20,.5)'; ell(c, -26, -212, 14, 9, .4); c.fill(); }
      }
      if(L.catlady){
        c.fillStyle='#b9ad7e';rr(c,-90,-263,52,49,6);c.fill();rr(c,37,-229,53,48,6);c.fill();
        A.cat(c,-67,-266,.43,T,'#d29d61',false);A.cat(c,62,-229,.39,T+.7,'#7d8b8e',false);
        c.strokeStyle='#c5b7b4';c.lineWidth=2;for(const x of [-70,48]){c.beginPath();c.moveTo(x,-305);c.lineTo(x+14,-293);c.moveTo(x+7,-309);c.lineTo(x+18,-298);c.stroke();}
      }
      if (L.pearls) { c.fillStyle = '#fafafa'; for (let i = -5; i <= 5; i++) { c.beginPath(); c.arc(i * 7, -324 + Math.abs(i) * -1 + i * i * .9, 4.5, 0, TAU); c.fill(); } }
      if (L.belt) { c.fillStyle = L.belt; rr(c, -ww - 18, -200, (ww + 18) * 2, 34, 8); c.fill(); c.fillStyle = shade(L.belt, .5); ell(c, 0, -183, 36, 24); c.fill(); c.fillStyle = L.belt; star(c, 0, -183, 16); c.fill(); c.fillStyle = '#d32f2f'; c.beginPath(); c.arc(-40, -183, 6, 0, TAU); c.arc(40, -183, 6, 0, TAU); c.fill(); }
      if (L.whistle && !R.whistle) { c.strokeStyle = '#eee'; c.lineWidth = 2; c.beginPath(); c.moveTo(-24, -340); c.quadraticCurveTo(0, -270, 24, -340); c.stroke(); c.fillStyle = '#cfd8dc'; rr(c, -10, -296, 24, 12, 5); c.fill(); }
    }
  }
  function drawRobotBody(c, L, R, w, T) {
    const sw = 100 * w;
    c.fillStyle = L.dark; rr(c, -30, -360, 60, 60, 10); c.fill();
    c.fillStyle = L.metal; rr(c, -sw, -330, sw * 2, 160, 26); c.fill();
    c.fillStyle = shade(L.metal, -.25); rr(c, -sw, -200, sw * 2, 30, 12); c.fill();
    c.fillStyle = L.dark; rr(c, -60, -300, 120, 80, 12); c.fill();
    // Vis sans fin de souffleuse (ventre)
    c.save(); rr(c, -56, -296, 112, 72, 10); c.clip();
    c.strokeStyle = '#cfd8dc'; c.lineWidth = 7; for (let i = -3; i < 5; i++) { const x = ((i * 28 + T * 120) % 140) - 70; c.beginPath(); c.moveTo(x, -296); c.lineTo(x + 26, -224); c.stroke(); }
    c.restore();
    c.fillStyle = '#ffeb3b'; c.fillRect(-sw + 10, -320, 22, 8); c.fillRect(sw - 32, -320, 22, 8);
    c.fillStyle = '#212121'; c.font = '900 16px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('RS-3000', 0, -180);
    if (R.steam) for (let i = 0; i < 6; i++) { const p = (T * .8 + i / 6) % 1; c.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - p)) + ')'; c.beginPath(); c.arc(Math.sin(i * 7 + T) * 60, -330 - p * 220, 14 + p * 30, 0, TAU); c.fill(); }
  }
  function drawArm(c, L, R, w, i, s) {
    const sd = i === 0 ? -1 : 1, g = R.g[i], sk = skinOf(L), sh = L.shirt || {};
    const sx = sd * 86 * w * (L.shoulders || 1), sy = -306;
    const ex = (sx + g.x) / 2 + sd * 34, ey = (sy + g.y) / 2 + 28;
    const sleeve = L.kind === 'robot' ? '#78909c' : L.kind === 'shadow' ? '#1d0b3a' : ({ plaid: sh.c1, vest: '#eceff1', track: sh.c1, jersey: sh.c1, blazer: sh.c1, cardigan: sh.c1 }[sh.type]);
    const th = 30 * Math.sqrt(w) * (L.arms || 1) * (1 + (g.s - 1) * .35);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = sleeve || sk; c.lineWidth = th; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = (sleeve && sh.type !== 'tank') ? sleeve : sk; c.lineWidth = th * .9 * (L.forearms || 1); c.beginPath(); c.moveTo(ex, ey); c.lineTo(g.x, g.y + 14 * g.s); c.stroke();
    if (L.kind === 'robot') { c.fillStyle = '#455a64'; c.beginPath(); c.arc(ex, ey, th * .55, 0, TAU); c.fill(); }
    if (sh.type === 'track') { c.strokeStyle = sh.c2; c.lineWidth = 4; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(g.x, g.y + 14 * g.s); c.stroke(); }
    if (L.flexing || R.flexing) { c.fillStyle = sk; ell(c, (sx + ex) / 2, (sy + ey) / 2 - 14, 22, 16); c.fill(); }
    let col = L.gloves;
    if (s.aurora) col = i === 0 ? '#69f0ae' : '#e040fb';
    drawGlove(c, g.x, g.y, g.s, col, sd, L.kind === 'robot', s.glintG === i ? s.glint : 0, s.aurora);
  }
  function drawGlove(c, x, y, s, col, sd, metal, glint, glow) {
    const r = 31 * s;
    if (glow) { const gr = c.createRadialGradient(x, y, r * .3, x, y, r * 2.2); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.globalAlpha = .55; c.beginPath(); c.arc(x, y, r * 2.2, 0, TAU); c.fill(); c.globalAlpha = 1; }
    // Poignet
    c.fillStyle = metal ? '#546e7a' : '#f5f5f5'; rr(c, x - r * .62, y + r * .62, r * 1.24, r * .62, r * .2); c.fill();
    c.fillStyle = shade(col, -.35); ell(c, x, y + r * .06, r * 1.04, r * 1.12); c.fill();
    c.fillStyle = col; ell(c, x, y, r, r * 1.08); c.fill();
    c.fillStyle = shade(col, -.12); ell(c, x - sd * r * .62, y + r * .25, r * .36, r * .5, sd * .4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.38)'; ell(c, x - r * .3, y - r * .42, r * .38, r * .22, -.5); c.fill();
    if (metal) { c.strokeStyle = '#37474f'; c.lineWidth = 2 * s; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x - r * .6, y + k * r * .35); c.lineTo(x + r * .6, y + k * r * .35); c.stroke(); } }
    if (glint > 0) { c.globalAlpha = glint; sparkle(c, x + r * .3, y - r * .5, r * 1.1, '#fff'); c.globalAlpha = 1; }
  }
  A.glove = drawGlove;

  function drawBackHead(c, L, R) {
    c.save(); c.translate(R.hx, -392 + R.hy); const hs = 54 * (L.head || 1);
    c.fillStyle = L.kind === 'robot' ? L.metal : L.kind === 'shadow' ? '#1d0b3a' : (L.hair && L.hair.c) || '#333'; ell(c, 0, 0, hs * .95, hs * 1.05); c.fill(); c.restore();
  }
  function drawRobotHead(c, L, R, s, T) {
    c.save(); c.translate(R.hx, -400 + R.hy); c.rotate(R.hr);
    // Cheminée de souffleuse
    c.fillStyle = shade(L.metal, -.15); c.beginPath(); c.moveTo(-14, -60); c.lineTo(14, -60); c.lineTo(22, -120); c.quadraticCurveTo(30, -150, 70, -150); c.lineTo(76, -126); c.quadraticCurveTo(46, -126, 40, -110); c.lineTo(30, -60); c.fill();
    c.fillStyle = L.metal; rr(c, -62, -66, 124, 118, 22); c.fill();
    c.fillStyle = '#111'; rr(c, -50, -36, 100, 46, 12); c.fill();
    const red = s.lieRed, eyeCol = red ? '#ff1744' : L.eye;
    c.fillStyle = eyeCol; c.shadowColor = eyeCol;
    const dir = s.eyes || 0;
    if (s.rebootEyes) { c.shadowBlur=18; c.fillStyle='#ff3d25'; c.fillRect(-38,-24,26,22); c.fillRect(12,-24,26,22); c.shadowBlur=0; }
    else if (s.expr === 'ko' || R.expr === 'ko') { c.font = '900 30px Nunito'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('X  X', 0, -13); }
    else if (dir) { c.save(); c.translate(0, -13); c.scale(-dir, 1); for (const ox of [-24, 24]) { c.beginPath(); c.moveTo(ox - 14, 0); c.lineTo(ox + 6, -14); c.lineTo(ox + 6, -6); c.lineTo(ox + 16, -6); c.lineTo(ox + 16, 6); c.lineTo(ox + 6, 6); c.lineTo(ox + 6, 14); c.closePath(); c.fill(); } c.restore(); }
    else { const h = R.expr === 'tell' ? 5 : R.expr === 'hurt' || R.expr === 'dizzy' ? 3 : 12; c.fillRect(-38, -13 - h / 2, 26, h); c.fillRect(12, -13 - h / 2, 26, h); }
    // Grille-bouche
    c.fillStyle = '#263238'; rr(c, -34, 20, 68, 20, 6); c.fill();
    c.fillStyle = R.expr === 'shout' || R.blow ? '#ffeb3b' : '#78909c'; for (let i = 0; i < 6; i++) c.fillRect(-30 + i * 11, 24, 6, 12);
    c.fillStyle = '#ffeb3b'; c.beginPath(); c.arc(-50, -54, 6, 0, TAU); c.fill(); c.fillStyle = (T * 4 | 0) % 2 ? '#f44336' : '#4caf50'; c.beginPath(); c.arc(50, -54, 6, 0, TAU); c.fill();
    if (R.expr === 'dizzy' || R.expr === 'hurt') drawDizzy(c, 0, -80, T, R.expr === 'dizzy');
    c.restore();
  }
  const shadowHeads = new Map();
  A.shadowHead = function (id) {
    if (shadowHeads.has(id)) return shadowHeads.get(id);
    const F = root.FamilyHeads, img = F && F.frame(id, 'front'); if (!img) return null;
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const l = (p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11) / 255; p[i] = 30 + l * 70; p[i + 1] = 10 + l * 30; p[i + 2] = 60 + l * 110; }
    g.putImageData(d, 0, 0); shadowHeads.set(id, cv); return cv;
  };
  function drawShadowHead(c, L, R, s, T) {
    c.save(); c.translate(R.hx, -392 + R.hy); c.rotate(R.hr);
    const img = s.shadowId && A.shadowHead(s.shadowId), hs = 54 * (L.head || 1);
    const gr = c.createRadialGradient(0, 0, hs * .5, 0, 0, hs * 2); gr.addColorStop(0, 'rgba(124,77,255,.5)'); gr.addColorStop(1, 'rgba(124,77,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, hs * 2, 0, TAU); c.fill();
    if (img) { const h = hs * 2.5, wd = h * img.width / img.height; c.drawImage(img, -wd / 2, -h * .58, wd, h); }
    else { c.fillStyle = '#1d0b3a'; ell(c, 0, 0, hs * .92, hs * 1.05); c.fill(); }
    c.fillStyle = s.glint > 0 || R.expr === 'tell' ? '#fff' : '#b388ff'; for (const ox of [-.33, .33]) { ell(c, ox * hs, -hs * .08, hs * .14, hs * (R.expr === 'tell' ? .05 : .08)); c.fill(); }
    if (s.glint > 0) { c.globalAlpha = s.glint; sparkle(c, hs * .36, -hs * .12, hs * .55); c.globalAlpha = 1; }
    if (R.expr === 'dizzy' || R.expr === 'ko') drawDizzy(c, 0, -hs * 1.3, T, true);
    c.restore();
  }
  function drawDizzy(c, x, y, T, on) { if (!on) return; for (let i = 0; i < 3; i++) { const a = T * 4 + i * TAU / 3; c.fillStyle = '#ffeb3b'; star(c, x + Math.cos(a) * 55, y + Math.sin(a) * 14, 11); c.fill(); } }

  function drawHead(c, L, R, s, T) {
    const hs = 54 * (L.head || 1), sk = skinOf(L), hair = L.hair || {}, ex = R.expr;
    c.save(); c.translate(R.hx, -392 + R.hy); c.rotate(R.hr);
    if (R.lowerHead) c.translate(0, R.lowerHead * 6);
    // Cheveux arrière / bois
    if (L.antlers) drawAntlers(c, hs, L.antlers, R.lowerHead || 0);
    if (hair.style === 'big') { c.fillStyle = hair.c; for (let i = 0; i < 9; i++) { const a = PI * .85 + i * PI * 1.3 / 8; c.beginPath(); c.arc(Math.cos(a) * hs * 1.05, Math.sin(a) * hs * .95 + 6, hs * .5, 0, TAU); c.fill(); } }
    if (hair.style === 'bun') { c.fillStyle = hair.c; c.beginPath(); c.arc(0, -hs * 1.1, hs * .42, 0, TAU); c.fill(); }
    if (hair.style === 'mullet') { c.fillStyle = hair.c; rr(c, -hs * .95, -hs * .2, hs * 1.9, hs * 1.35, hs * .4); c.fill(); }
    if(hair.style==='mohawk'){c.fillStyle=hair.c;c.beginPath();c.moveTo(-hs*.28,-hs*.5);c.lineTo(-hs*.2,-hs*1.16);c.lineTo(0,-hs*1.32);c.lineTo(hs*.22,-hs*1.13);c.lineTo(hs*.28,-hs*.5);c.closePath();c.fill();}
    if(hair.style==='wild'){
      c.fillStyle=hair.c;
      for(let i=0;i<18;i++){const a=PI*.58+i*PI*1.83/17,r=hs*(1.05+(i%3)*.08);c.beginPath();c.ellipse(Math.cos(a)*r,Math.sin(a)*r+8,hs*.29,hs*.56,a-.5,0,TAU);c.fill();}
      c.strokeStyle=shade(hair.c,-.25);c.lineWidth=3;for(let i=0;i<7;i++){const x=(i-3)*hs*.25;c.beginPath();c.moveTo(x,-hs*.7);c.quadraticCurveTo(x-24,-hs*1.5,x+17,-hs*1.7);c.stroke();}
    }
    // Oreilles
    c.fillStyle = shade(sk, -.08); ell(c, -hs * .92, 4, hs * .17, hs * .24); c.fill(); ell(c, hs * .92, 4, hs * .17, hs * .24); c.fill();
    if (L.earrings) { c.fillStyle = L.earrings; c.beginPath(); c.arc(-hs * .94, hs * .32, 6, 0, TAU); c.arc(hs * .94, hs * .32, 6, 0, TAU); c.fill(); }
    // Visage
    c.fillStyle = sk; ell(c, 0, 0, hs * .9, hs * 1.04); c.fill();
    c.fillStyle = 'rgba(0,0,0,.06)'; ell(c, hs * .18, hs * .1, hs * .7, hs * .9); c.fill();
    if (L.stubble) { c.fillStyle = 'rgba(60,40,30,.18)'; ell(c, 0, hs * .55, hs * .7, hs * .42); c.fill(); }
    if (L.beard) { c.fillStyle = L.beard; c.beginPath(); c.moveTo(-hs * .88, 0); c.quadraticCurveTo(-hs * .9, hs * 1.3, 0, hs * 1.35); c.quadraticCurveTo(hs * .9, hs * 1.3, hs * .88, 0); c.quadraticCurveTo(hs * .5, hs * .45, 0, hs * .5); c.quadraticCurveTo(-hs * .5, hs * .45, -hs * .88, 0); c.fill(); }
    if (hair.style === 'mask') drawMask(c, hs, hair);
    if (L.wrinkles) { c.strokeStyle = shade(sk, -.25); c.lineWidth = 1.5; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * hs * .55, -hs * .02); c.lineTo(sd * hs * .7, hs * .02); c.moveTo(sd * hs * .55, hs * .05); c.lineTo(sd * hs * .68, hs * .12); c.stroke(); } c.beginPath(); c.moveTo(-hs * .3, -hs * .55); c.lineTo(hs * .3, -hs * .55); c.stroke(); }
    if (L.scar) { c.strokeStyle = '#c47a6a'; c.lineWidth = 3; c.beginPath(); c.moveTo(hs * .35, -hs * .45); c.lineTo(hs * .55, -hs * .15); c.stroke(); }
    drawFace(c, hs, L, ex, s, T, R);
    // Cheveux avant / chapeaux
    if (hair.style === 'cap') { c.fillStyle = hair.cap; c.beginPath(); c.arc(0, -hs * .3, hs * .95, PI * 1.02, TAU * .99); c.fill(); rr(c, -hs * .95, -hs * .42, hs * 1.9, hs * .2, 6); c.fill(); c.fillStyle = shade(hair.cap, -.25); ell(c, 0, -hs * .3, hs * .9, hs * .12); c.fill(); c.fillStyle = hair.c; c.fillRect(-hs * .92, -hs * .25, hs * .18, hs * .4); c.fillRect(hs * .74, -hs * .25, hs * .18, hs * .4); }
    if (hair.style === 'tuque') { c.fillStyle = hair.c; c.fillRect(-hs * .9, -hs * .35, hs * .25, hs * .5); c.fillRect(hs * .65, -hs * .35, hs * .25, hs * .5); c.fillStyle = hair.cap; c.beginPath(); c.arc(0, -hs * .35, hs * .95, PI, TAU); c.lineTo(hs * .95, -hs * .28); c.lineTo(-hs * .95, -hs * .28); c.fill(); c.fillStyle = hair.c2; rr(c, -hs, -hs * .5, hs * 2, hs * .28, 8); c.fill(); c.beginPath(); c.arc(0, -hs * 1.35, hs * .26, 0, TAU); c.fill(); }
    if (hair.style === 'bun' || hair.style === 'big' || hair.style === 'slick' || hair.style === 'mullet') { c.fillStyle = hair.c; c.beginPath(); c.arc(0, -hs * .15, hs * .93, PI * 1.05, TAU * .975); c.quadraticCurveTo(hs * .2, -hs * .75, -hs * .1, -hs * .5); c.quadraticCurveTo(-hs * .6, -hs * .62, -hs * .9, -hs * .2); c.fill(); if (hair.style === 'slick') { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3; c.beginPath(); c.arc(0, -hs * .2, hs * .7, PI * 1.2, PI * 1.7); c.stroke(); } }
    if(hair.style==='wild'){c.fillStyle=hair.c;c.beginPath();c.moveTo(-hs,-hs*.25);c.lineTo(-hs*.75,-hs*1.15);c.lineTo(-hs*.18,-hs*.9);c.lineTo(hs*.25,-hs*1.33);c.lineTo(hs*.97,-hs*.35);c.lineTo(hs*.3,-hs*.6);c.lineTo(-hs*.2,-hs*.36);c.lineTo(-hs*.5,-hs*.72);c.closePath();c.fill();}
    if (hair.style === 'balding') { c.fillStyle = hair.c; ell(c, -hs * .8, -hs * .2, hs * .2, hs * .35); c.fill(); ell(c, hs * .8, -hs * .2, hs * .2, hs * .35); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; ell(c, -hs * .2, -hs * .75, hs * .25, hs * .1, -.3); c.fill(); }
    if (hair.style === 'curlers') { c.fillStyle = hair.c; c.beginPath(); c.arc(0, -hs * .2, hs * .95, PI, TAU); c.fill(); for (let i = 0; i < 5; i++) { const x = -hs * .7 + i * hs * .35, y = -hs * .82 + Math.abs(i - 2) * hs * .12; c.fillStyle = hair.c2; rr(c, x - hs * .16, y - hs * .12, hs * .32, hs * .24, 6); c.fill(); c.fillStyle = shade(hair.c2, -.25); c.fillRect(x - 2, y - hs * .12, 4, hs * .24); } }
    if (L.headband) { c.fillStyle = L.headband; rr(c, -hs * .92, -hs * .58, hs * 1.84, hs * .2, 6); c.fill(); }
    if (L.antlers) { c.fillStyle = L.antlers; rr(c, -hs * .8, -hs * .78, hs * 1.6, hs * .22, 6); c.fill(); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * hs * .32 - 10, -hs * .76); c.lineTo(i * hs * .32, -hs * 1.05 + Math.abs(i) * 6); c.lineTo(i * hs * .32 + 10, -hs * .76); c.fill(); } c.fillStyle = '#e53935'; c.beginPath(); c.arc(0, -hs * .67, 6, 0, TAU); c.fill(); }
    if (L.glasses) { c.strokeStyle = L.glasses; c.lineWidth = 3.5; c.beginPath(); c.arc(-hs * .33, -hs * .08, hs * .24, 0, TAU); c.moveTo(hs * .57, -hs * .08); c.arc(hs * .33, -hs * .08, hs * .24, 0, TAU); c.moveTo(-hs * .09, -hs * .1); c.lineTo(hs * .09, -hs * .1); c.stroke(); }
    if (ex === 'dizzy' || ex === 'ko') drawDizzy(c, 0, -hs * 1.25, T, true);
    if (ex === 'hurt' || ex === 'eat') { c.fillStyle = 'rgba(120,200,255,.8)'; c.beginPath(); c.arc(hs * .85, -hs * .5, 6, 0, TAU); c.fill(); }
    c.restore();
  }
  function drawAntlers(c, hs, col, low) {
    c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 12;
    for (const sd of [-1, 1]) {
      c.save(); c.scale(sd, 1); c.rotate(-low * .5);
      c.beginPath(); c.moveTo(hs * .4, -hs * .7); c.quadraticCurveTo(hs * 1.4, -hs * 1.3, hs * 1.9, -hs * 2.3); c.stroke();
      c.lineWidth = 9; [[.85, -1.05, 1.0, -1.85], [1.3, -1.45, 1.55, -2.2], [1.6, -1.85, 2.4, -2.1], [1.2, -1.3, 1.9, -1.2]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(hs * a, hs * b); c.lineTo(hs * d, hs * e); c.stroke(); });
      c.lineWidth = 12; c.restore();
    }
  }
  function drawMask(c, hs, hair) {
    c.fillStyle = hair.c; ell(c, 0, -hs * .05, hs * .93, hs * 1.0); c.fill();
    c.fillStyle = hair.c2;
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * hs * .1, -hs * .05); c.quadraticCurveTo(sd * hs * .5, -hs * .7, sd * hs * .85, -hs * .5); c.quadraticCurveTo(sd * hs * .55, -hs * .45, sd * hs * .7, -hs * .1); c.quadraticCurveTo(sd * hs * .4, -hs * .3, sd * hs * .1, -hs * .05); c.fill(); }
    c.beginPath(); c.moveTo(0, -hs * .95); c.lineTo(hs * .12, -hs * .5); c.lineTo(0, -hs * .3); c.lineTo(-hs * .12, -hs * .5); c.fill();
    c.fillStyle = '#fff'; for (const sd of [-1, 1]) { ell(c, sd * hs * .33, -hs * .08, hs * .24, hs * .18); c.fill(); }
    c.fillStyle = shade(hair.c, -.3); ell(c, 0, hs * .55, hs * .34, hs * .2); c.fill();
  }
  function drawFace(c, hs, L, ex, s, T, R) {
    if(L.serious && ['calm','smug'].includes(ex))ex='tell';
    const ink = '#2b1d16', ey = -hs * .08;
    // Yeux
    for (const sd of [-1, 1]) {
      const x = sd * hs * .33;
      if(ex==='surprised'){c.fillStyle='#fff';ell(c,x,ey,hs*(sd<0?.23:.16),hs*(sd<0?.22:.13));c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();c.fillStyle=ink;ell(c,x-sd*hs*.06,ey+hs*.04,hs*.055,hs*.07);c.fill();continue;}
      if (ex === 'ko') { c.strokeStyle = ink; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 9, ey - 9); c.lineTo(x + 9, ey + 9); c.moveTo(x + 9, ey - 9); c.lineTo(x - 9, ey + 9); c.stroke(); continue; }
      if (ex === 'hurt') { c.strokeStyle = ink; c.lineWidth = 4; c.beginPath(); c.moveTo(x - sd * 10, ey - 8); c.lineTo(x + sd * 6, ey); c.lineTo(x - sd * 10, ey + 8); c.stroke(); continue; }
      if (ex === 'eat' || ex === 'win') { c.strokeStyle = ink; c.lineWidth = 4; c.beginPath(); c.arc(x, ey + 4, 9, PI * 1.15, PI * 1.85); c.stroke(); continue; }
      if (ex === 'dizzy') { c.strokeStyle = ink; c.lineWidth = 2.5; c.beginPath(); for (let a = 0; a < TAU * 2; a += .4) { const r2 = a * 1.3; c.lineTo(x + Math.cos(a + T * 6) * r2, ey + Math.sin(a + T * 6) * r2); } c.stroke(); continue; }
      const rx = hs * .17, ry = ex === 'tell' ? hs * .07 : ex === 'shout' || ex === 'oops' ? hs * .17 : hs * .13;
      c.fillStyle = '#fff'; ell(c, x, ey, rx, ry); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = ink; c.beginPath(); c.arc(x + (ex === 'smug' ? sd * 2 : 0), ey + 1, Math.min(ry, hs * .085), 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 2, ey - 2, 2, 0, TAU); c.fill();
    }
    // Sourcils
    c.strokeStyle = (L.hair && L.hair.style !== 'mask' && L.hair.c) || ink; if (L.hair && L.hair.style === 'cap') c.strokeStyle = L.hair.c; c.lineWidth = 6; c.lineCap = 'round';
    for (const sd of [-1, 1]) {
      const x = sd * hs * .33; let a = 0, dy = 0;
      if (ex === 'angry' || ex === 'tell' || ex === 'shout') a = .38; else if (ex === 'hurt' || ex === 'oops') a = -.3; else if (ex === 'smug') { a = sd > 0 ? -.25 : .15; dy = sd > 0 ? -5 : 0; }
      c.save(); c.translate(x, ey - hs * .3 + dy); c.rotate(-sd * a); c.beginPath(); c.moveTo(-16, 0); c.lineTo(16, 0); c.stroke(); c.restore();
    }
    // Nez
    c.fillStyle = shade(L.skin || '#e0b090', -.18); ell(c, 0, hs * .22, hs * .12, hs * .1); c.fill();
    // Moustache
    if (L.mustache) { c.fillStyle = L.mustache; c.beginPath(); c.moveTo(0, hs * .36); c.quadraticCurveTo(-hs * .4, hs * .26, -hs * .5, hs * .52); c.quadraticCurveTo(-hs * .25, hs * .42, 0, hs * .45); c.quadraticCurveTo(hs * .25, hs * .42, hs * .5, hs * .52); c.quadraticCurveTo(hs * .4, hs * .26, 0, hs * .36); c.fill(); }
    // Bouche
    const my = hs * .6; c.lineWidth = 4; c.strokeStyle = ink;
    if (ex === 'shout' || ex === 'win') { c.fillStyle = '#5d1a1a'; ell(c, 0, my + 4, hs * .3, hs * (ex === 'win' ? .16 : .24)); c.fill(); c.fillStyle = '#e57373'; ell(c, 0, my + hs * .13, hs * .16, hs * .07); c.fill(); c.fillStyle = '#fff'; c.fillRect(-hs * .2, my - hs * .12, hs * .4, hs * .07); }
    else if (ex === 'angry' || ex === 'tell') { c.fillStyle = '#fff'; rr(c, -hs * .26, my - hs * .08, hs * .52, hs * .16, 5); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-hs * .26, my); c.lineTo(hs * .26, my); c.stroke(); if (L.toothGap) { c.fillStyle = '#3a1a1a'; c.fillRect(hs * .02, my - hs * .08, hs * .1, hs * .16); } }
    else if (ex === 'hurt') { c.fillStyle = '#5d1a1a'; c.beginPath(); c.moveTo(-hs * .24, my); for (let i = 0; i <= 6; i++) c.lineTo(-hs * .24 + i * hs * .08, my + (i % 2 ? -6 : 6)); c.lineTo(hs * .2, my + 14); c.lineTo(-hs * .2, my + 14); c.fill(); }
    else if (ex === 'ko') { c.beginPath(); c.arc(0, my + 8, hs * .2, PI * 1.15, PI * 1.85); c.stroke(); c.fillStyle = '#e57373'; ell(c, hs * .08, my + 12, 8, 12); c.fill(); }
    else if (ex === 'eat') { const k = (Math.sin(T * 14) + 1) / 2; c.fillStyle = shade(L.skin || '#e0b090', -.05); ell(c, -hs * .5, hs * .42, hs * .2, hs * .18); c.fill(); ell(c, hs * .5, hs * .42, hs * .2, hs * .18); c.fill(); c.fillStyle = '#5d1a1a'; ell(c, 0, my, hs * .16, 3 + k * 8); c.fill(); }
    else if(ex==='surprised'){c.fillStyle='#5d1a1a';ell(c,hs*.04,my,hs*.27,hs*.22,-.15);c.fill();c.fillStyle='#fff';c.fillRect(-hs*.18,my-hs*.17,hs*.36,hs*.07);c.fillStyle='#ef8f9c';ell(c,hs*.14,my+hs*.15,hs*.12,hs*.14);c.fill();}
    else if (ex === 'oops') { c.fillStyle = '#5d1a1a'; ell(c, 0, my + 2, hs * .1, hs * .12); c.fill(); }
    else if (ex === 'smug') { c.beginPath(); c.moveTo(-hs * .24, my); c.quadraticCurveTo(hs * .05, my + 12, hs * .3, my - 10); c.stroke(); }
    else { c.beginPath(); c.moveTo(-hs * .2, my + 2); c.quadraticCurveTo(0, my + 6, hs * .2, my + 2); c.stroke(); }
    if (L.lips && (ex === 'calm' || ex === 'smug')) { c.strokeStyle = L.lips; c.lineWidth = 6; c.beginPath(); c.moveTo(-hs * .18, my + 2); c.quadraticCurveTo(0, my + 8, hs * .18, my + 2); c.stroke(); }
    if (L.whistle && R.whistle) {
      c.strokeStyle='#372b29';c.lineWidth=3;c.fillStyle='#91a4ad';rr(c,-8,my-5,25,10,3);c.fill();c.stroke();
      c.fillStyle='#e1edf2';ell(c,23,my+1,14,12);c.fill();c.stroke();c.fillStyle='#344650';c.fillRect(16,my-8,10,5);
      c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(20,my+6);c.lineTo(30,my+3);c.stroke();
      c.strokeStyle='#e5edf4';c.beginPath();c.moveTo(24,my+13);c.quadraticCurveTo(45,my+65,4,my+80);c.stroke();
      c.strokeStyle='#a2efff';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.arc(35,my,18+i*12+Math.sin(T*20)*2,-.6,.6);c.stroke();}
    }
    if(s.syrupBoost){c.save();c.globalAlpha=.45;c.fillStyle='#f04036';for(const side of [-1,1]){ell(c,side*hs*.55,hs*.32,hs*.2,hs*.13);c.fill();}c.restore();}
    if (s.glint > 0 && s.glintG == null) { c.save();c.globalAlpha=s.glint;if(s.cue==='eyes'){c.shadowColor='#ffe35a';c.shadowBlur=20;c.fillStyle='#fff28b';for(const side of [-1,1]){ell(c,side*hs*.33,ey,hs*.18,hs*.09);c.fill();}}else sparkle(c,hs*.36,ey-4,hs*.55,'#fff');c.restore(); }

  }

  // ---------- Accessoires ----------
  function drawProps(c, L, R, s, T) {
    const m = s.move, g0 = R.g[0], g1 = R.g[1];
    if(s.syrupShatter>=0&&s.syrupShatter<.8){
      c.save();const age=s.syrupShatter;c.globalAlpha=1-age/.8;
      for(let i=0;i<12;i++){c.save();c.translate(55+Math.cos(i*2.4)*age*180,-420+Math.sin(i*2.4)*age*120+age*age*240);c.rotate(i+age*6);c.fillStyle=i%2?'#ffe5a5':'#a8dbe6';c.beginPath();c.moveTo(-5,-7);c.lineTo(7,1);c.lineTo(-2,6);c.closePath();c.fill();c.restore();}c.restore();
    }
    if(m?.prop==='maple'&&s.ph==='free'){
      c.save();c.translate(g1.x-7,g1.y-25);c.rotate(-.7);c.fillStyle='#914e20';rr(c,-17,-28,34,49,9);c.fill();c.strokeStyle='#ffd28d';c.lineWidth=3;c.stroke();c.fillStyle='#f6d183';c.fillRect(-8,-42,16,16);c.fillStyle='#fff0c1';rr(c,-13,-15,26,24,4);c.fill();c.fillStyle='#c83b30';c.font='22px serif';c.textAlign='center';c.fillText('🍁',0,5);c.restore();
    }
    if(s.ph==='tell'&&s.cueFlash>0&&!['eyes','glove'].includes(s.cue)){
      c.save();c.globalAlpha=s.cueFlash;c.strokeStyle='#fff2ad';c.fillStyle='#fff2ad';c.lineWidth=5;
      const side=m?.from==='L'?-1:1;
      if(s.cue==='shoulder'){for(let i=0;i<3;i++){c.beginPath();c.moveTo(side*(115+i*14),-335-i*12);c.lineTo(side*(132+i*20),-350-i*16);c.stroke();}}
      else if(s.cue==='breath'){for(const side of [-1,1]){c.beginPath();c.moveTo(side*25,-365);c.quadraticCurveTo(side*80,-350,side*95,-380);c.stroke();}}
      else{for(const side of [-1,1])for(let i=0;i<3;i++){c.beginPath();c.moveTo(side*(55+i*17),-4);c.lineTo(side*(62+i*23),-22-i*3);c.stroke();}}
      c.restore();
    }
    if(m?.fx==='quake'&&s.ph==='strike'){
      c.save();c.strokeStyle='#ffe5a1';for(let i=0;i<3;i++){const e=(s.t+i*.25)%1;c.globalAlpha=1-e;c.lineWidth=6*(1-e)+1;ell(c,0,15,100+e*500,15+e*65);c.stroke();}c.restore();
    }

    if (m && m.prop === 'poutine' && s.ph === 'free') {
      c.save(); c.translate(g0.x + 10, g0.y - 34);
      c.fillStyle = '#fafafa'; c.beginPath(); c.moveTo(-46, -8); c.lineTo(46, -8); c.lineTo(34, 30); c.lineTo(-34, 30); c.fill(); c.fillStyle = '#c62828'; c.fillRect(-40, 4, 80, 8);
      c.fillStyle = '#ffca28'; for (let i = 0; i < 9; i++) { c.save(); c.translate(-36 + i * 9, -10); c.rotate((i % 3 - 1) * .4); c.fillRect(-3, -16, 7, 22); c.restore(); }
      c.fillStyle = '#6d3b1a'; ell(c, 0, -12, 34, 10); c.fill(); c.fillStyle = '#fff8e1'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-22 + i * 11, -16 + (i % 2) * 4, 5, 0, TAU); c.fill(); }
      c.restore();
      c.strokeStyle = '#bdbdbd'; c.lineWidth = 4; c.beginPath(); c.moveTo(g1.x, g1.y); c.lineTo(g1.x - 18, g1.y - 40); c.stroke(); c.fillStyle = '#ffca28'; c.fillRect(g1.x - 22, g1.y - 56, 6, 18);
    }
    if(L.catlady&&m&&((m.projectile==='cat'&&s.ph==='tell')||(m.prop==='cat'&&s.ph==='free'))){const g=m.from==='L'?g0:g1;A.cat(c,g.x,g.y-40,.8,T,'#d29d61',false);}
    if (m && m.prop === 'cookie' && s.ph === 'free') { c.fillStyle = '#c68642'; c.beginPath(); c.arc(g1.x - 10, g1.y - 30, 24, 0, TAU); c.fill(); c.fillStyle = '#3e2723'; [[-8, -6], [6, 4], [-2, 10], [10, -10]].forEach(([x, y]) => { c.beginPath(); c.arc(g1.x - 10 + x, g1.y - 30 + y, 3.5, 0, TAU); c.fill(); }); }
    if (m && m.prop === 'sign' && (s.ph === 'tell' || s.ph === 'strike')) { const g = m.from === 'L' ? g0 : g1; drawSign(c, g.x, g.y - 70 * g.s, 52 * g.s, 'stop'); c.strokeStyle = '#9e9e9e'; c.lineWidth = 8 * g.s; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x, g.y - 30 * g.s); c.stroke(); }
    if (m && m.prop === 'purse' && (s.ph === 'tell' || s.ph === 'strike')) { const g = m.from === 'L' ? g0 : g1; drawPurse(c, g.x, g.y + 40 * g.s, g.s); }
    if (R.sign) { drawSign(c, g1.x, g1.y - 110, 70, R.sign); c.strokeStyle = '#9e9e9e'; c.lineWidth = 9; c.beginPath(); c.moveTo(g1.x, g1.y); c.lineTo(g1.x, g1.y - 45); c.stroke(); }
    if (R.needles) { c.strokeStyle = '#bdbdbd'; c.lineWidth = 5; c.beginPath(); c.moveTo(g0.x, g0.y); c.lineTo(g0.x + 60, g0.y - 60 + Math.sin(T * 22) * 8); c.moveTo(g1.x, g1.y); c.lineTo(g1.x - 60, g1.y - 60 - Math.sin(T * 22) * 8); c.stroke(); if (s.ph === 'tell') A.projectile(c, 'yarn', 0, g0.y + 40, 1, T); }
    if (R.hold != null && m && m.projectile) { const g = R.g[R.hold]; A.projectile(c, m.projectile, g.x, g.y - 34, .8, T); }
    if (R.ring > 0) { c.strokeStyle = 'rgba(255,255,255,' + (.7 * (1 - R.ring)) + ')'; for (let i = 0; i < 3; i++) { const r = (R.ring * 3 + i * .3) % 1; c.lineWidth = 8 * (1 - r); ell(c, 0, -392, 80 + r * 360, 50 + r * 230); c.stroke(); } }
    if (s.ph === 'tell' && m && m.icon) {
      const y = -392 - 150 - Math.sin(T * 6) * 6;
      c.fillStyle = s.lieRed ? 'rgba(198,40,40,.95)' : 'rgba(255,255,255,.95)'; rr(c, -58, y - 52, 116, 96, 18); c.fill(); c.strokeStyle = '#1a237e'; c.lineWidth = 4; c.stroke();
      c.font = '62px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(m.icon, 0, y - 2);
      if (m.pose === 'hook') { c.fillStyle = s.lieRed ? '#fff' : '#1a237e'; c.font = '900 28px Nunito'; c.fillText(m.from === 'L' ? '◀' : '▶', m.from === 'L' ? -40 : 40, y + 30); }
    }
  }
  function drawSign(c, x, y, r, kind) {
    c.save(); c.translate(x, y);
    if (kind === 'go') { c.fillStyle = '#2e7d32'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * .1; c.stroke(); c.fillStyle = '#fff'; c.font = '900 ' + (r * .55) + 'px Nunito'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GO', 0, 2); }
    else { c.fillStyle = '#c62828'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = PI / 8 + i * PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * .08; c.stroke(); c.fillStyle = '#fff'; c.font = '900 ' + (r * .42) + 'px Nunito'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ARRÊT', 0, 2); }
    c.restore();
  }
  function drawPurse(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = '#4a148c'; c.lineWidth = 6; c.beginPath(); c.arc(0, -10, 22, PI, TAU); c.stroke(); c.fillStyle = '#7b1fa2'; c.beginPath(); c.moveTo(-36, -8); c.lineTo(36, -8); c.lineTo(44, 40); c.lineTo(-44, 40); c.fill(); c.fillStyle = '#ffd54f'; c.fillRect(-8, 2, 16, 10); c.restore(); }

  A.cat=function(c,x,y,size,T,col,flying){
    c.save();c.translate(x,y);c.scale(size,size);if(flying)c.rotate(Math.sin(T*14)*.12);
    c.strokeStyle=col;c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(-34,7);c.bezierCurveTo(-77,-3,-76,-45,-55,-33);c.stroke();
    c.fillStyle=col;ell(c,0,8,39,22);c.fill();
    for(const sd of [-1,1]){const kick=flying?Math.sin(T*23+sd)*8:0;rr(c,sd*23-9,16+kick,18,25,8);c.fill();}
    c.beginPath();c.moveTo(-27,-17);c.lineTo(-30,-49);c.lineTo(-8,-34);c.lineTo(13,-35);c.lineTo(32,-49);c.lineTo(28,-15);c.closePath();c.fill();ell(c,1,-16,32,28);c.fill();
    c.fillStyle='#e4b1ac';for(const sd of [-1,1]){c.beginPath();c.moveTo(sd*25,-28);c.lineTo(sd*26,-42);c.lineTo(sd*12,-32);c.fill();}
    c.fillStyle='#fff4cc';for(const sd of [-1,1]){ell(c,sd*12,-18,9,11);c.fill();}c.fillStyle='#263b2b';for(const sd of [-1,1]){ell(c,sd*12,-17,2.5,7);c.fill();}
    c.fillStyle='#915b60';c.beginPath();c.moveTo(-5,-6);c.lineTo(5,-6);c.lineTo(0,-1);c.fill();
    c.strokeStyle='#4f4b48';c.lineWidth=1.8;for(const sd of [-1,1])for(let i=0;i<3;i++){c.beginPath();c.moveTo(sd*17,-5+i*4);c.lineTo(sd*43,-11+i*9);c.stroke();}
    if(flying){c.fillStyle='#814c58';ell(c,0,6,5,6);c.fill();}c.restore();
  };
  A.projectile = function (c, type, x, y, s, T, variant) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if(type==='cat')A.cat(c,0,0,1,T,variant==='L'?'#86938f':'#d39d65',true);
    else if (type === 'ball') { c.fillStyle = '#d32f2f'; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill(); c.strokeStyle = '#b71c1c'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 34, -.4, 2.2); c.stroke(); c.fillStyle = 'rgba(255,255,255,.3)'; ell(c, -10, -12, 12, 7, -.5); c.fill(); }
    else if (type === 'rocket') { c.rotate(Math.sin(T * 30) * .05); c.fillStyle = 'rgba(255,152,0,.85)'; c.beginPath(); c.moveTo(-14, 30); c.lineTo(0, 70 + Math.sin(T * 40) * 12); c.lineTo(14, 30); c.fill(); c.fillStyle = '#ffeb3b'; c.beginPath(); c.moveTo(-8, 30); c.lineTo(0, 52); c.lineTo(8, 30); c.fill(); drawGlove(c, 0, 0, 1.1, '#b0bec5', 1, true, 0); }
    else if (type === 'slipper') { c.rotate(T * 10); c.fillStyle = '#f48fb1'; ell(c, 0, 0, 40, 20); c.fill(); c.fillStyle = '#fce4ec'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(-14 + (i % 4) * 9, -10 + (i >> 2) * 8, 6, 0, TAU); c.fill(); } c.fillStyle = '#ad1457'; ell(c, 18, 0, 16, 12); c.fill(); }
    else if (type === 'teeth') { const o = Math.abs(Math.sin(T * 18)) * 10; c.fillStyle = '#ec407a'; rr(c, -34, -16 - o, 68, 14, 7); c.fill(); rr(c, -34, 4 + o, 68, 14, 7); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.fillRect(-30 + i * 10.5, -6 - o, 9, 10); c.fillRect(-30 + i * 10.5, -2 + o, 9, 10); } }
    else if (type === 'log') { c.rotate(T * 14); c.fillStyle = '#8d5524'; A.rr(c, -60, -18, 120, 36, 16); c.fill(); c.fillStyle = '#6d4c41'; for (let i = -40; i < 50; i += 26) c.fillRect(i, -18, 4, 36); c.fillStyle = '#d7a86e'; A.ell(c, 58, 0, 10, 18); c.fill(); c.strokeStyle = '#8d5524'; c.lineWidth = 2; c.beginPath(); c.arc(58, 0, 6, 0, 7); c.stroke(); }
    else if (type === 'yarn') { c.fillStyle = '#f06292'; c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.fill(); c.strokeStyle = '#ad1457'; c.lineWidth = 2.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(0, 0, 26, i * .7 + T, i * .7 + T + 1.8); c.stroke(); } c.beginPath(); c.moveTo(20, 16); c.quadraticCurveTo(50, 40, 30, 70); c.stroke(); }
    c.restore();
  };

  // ======================= BOXEUR DE LA FAMILLE (vu de dos) =======================
  const PSKIN = '#e9bc98';
  // Taille des jeunes par rapport au dessin adulte, y compris le plus grand.
  A.childScale = ch => BX.KIDS.includes(ch.id) ? lerp(.5, .7, clamp((ch.size - .62) / .38, 0, 1)) : 1;
  A.ringScale = ch => BX.KIDS.includes(ch.id) ? lerp(.43,.50,clamp((ch.size-.62)/.38,0,1)) : .58;
  A.childBackBody=ch=>({shoulder:ch.id==='milo'?48:56,shoulderY:-185,hem:ch.id==='milo'?-60:-35,limb:ch.id==='milo'?58:72,foot:ch.id==='milo'?65:110});
  A.ringOriginY=ch=>620+(BX.KIDS.includes(ch.id)?(146-A.childBackBody(ch).foot)*A.ringScale(ch):0);
  A.ringHeadY=ch=>BX.KIDS.includes(ch.id)&&BX.familyBody?620+(146-289*1.35*BX.familyBody.factor(ch))*A.ringScale(ch):A.ringOriginY(ch)-262*A.ringScale(ch);
  A.childBackArm=(ch,sd,g)=>{
    const p=A.childBackBody(ch),sx=sd*p.shoulder,sy=p.shoulderY,dx=g.x-sx,dy=g.y+22-sy,d=Math.hypot(dx,dy)||.01,reach=Math.min(d,p.limb*2-.5),ux=dx/d,uy=dy/d;
    const wx=sx+ux*reach,wy=sy+uy*reach,h=Math.sqrt(Math.max(0,p.limb*p.limb-reach*reach/4));
    const sign=dy<0?sd:-sd;
    return {sx,sy,ex:(sx+wx)/2-uy*h*sign,ey:(sy+wy)/2+ux*h*sign,wx,wy};
  };
  A.player = function (c, ch, s) {
    if(s.st==='special' && s.t<BX.SPECIAL_LEAD){
      const beat=Math.max(0,s.t)/BX.SPECIAL_LEAD*BX.SPECIAL_HITS,index=Math.floor(beat);
      const patterns={fire:[0,1,0,0,1],ice:[1,0,1,0,0],lightning:[0,0,1,0,1],wind:[1,0,1,1,0]};
      return A.player(c,ch,{...s,st:'punch',t:beat-index,side:index%2?'R':'L',high:!!patterns[s.element][Math.min(index,4)],element:null});
    }
    if (s.st === 'down' || s.st === 'getup') {
      const rise = clamp(s.rise || 0, 0, 1);
      const fall = s.st === 'down' ? eout(clamp(s.t || 0, 0, 1)) : 1;
      const progress = s.st === 'getup' ? lerp(rise, 1, ease(clamp(s.t || 0, 0, 1))) : rise;
      const punching = s.recoveryT >= 0 && s.recoveryT < 1;
      return A.player(c, ch, Object.assign({}, s, { st: punching ? 'punch' : 'idle', t: punching ? s.recoveryT : 0,
        side: s.recoverySide || 'L', high: false, tired: false, aside: 0, recoveryDepth: 330 * fall * (1 - progress) }));
    }
    if(BX.KIDS.includes(ch.id)&&BX.familyBody)return BX.familyBody.player(c,ch,s);
    const T=s.time||0,k=s.inRing?A.ringScale(ch):.7+.14*clamp((ch.size-.6)/.4,0,1),originY=s.inRing?A.ringOriginY(ch)+(s.backstep||0):742;
    // Portée courte : un coup haut fait bondir le jeune, sans étirer ses bras.
    const punchY = s.high ? -350 : s.zone === 'low' ? -270 : -305;
    const upperY = -380;
    let yaw=0;
    let bx = 0, by = Math.sin(T * 3.4) * 3, rot = 0, hx = 0, hy = 0, legBend=0;
    by += s.recoveryDepth || 0;
    const gL = { x: -82, y: -250 + Math.sin(T * 3.4 + 1) * 4, s: 1 }, gR = { x: 82, y: -250 + Math.sin(T * 3.4) * 4, s: 1 };
    const st = s.st, t = s.t || 0;
    if (s.tired) { gL.y = gR.y = -190 + Math.sin(T * 2) * 4; gL.x = -95; gR.x = 95; by += 10; }
    if (st === 'dodge') { const e = t < .3 ? eout(t / .3) : t > .75 ? 1 - ease((t - .75) / .25) : 1; bx = s.dir * 185 * e; rot = s.dir * .22 * e; by += 18 * e; }
    else if (st === 'duck') { const e = t < .25 ? eout(t / .25) : t > .78 ? 1 - ease((t - .78) / .22) : 1; by += 125 * e; gL.y -= 20 * e; gR.y -= 20 * e; gL.x += 20 * e; gR.x -= 20 * e; }
    else if (st === 'parry') { const g=s.hand==='A'?gL:gR;g.x=s.hand==='A'?-68:68;g.y=s.high?-280:-140;g.s=1.15;by+=4; }
    else if (st === 'block') { gL.x = -50; gL.y = -268; gL.s = 1.05; gR.x = 50; gR.y = -268; gR.s = 1.05; by += 12; }
    else if(st==='special'){
      const q=clamp((t-BX.SPECIAL_LEAD)/(1-BX.SPECIAL_LEAD),0,1),sd=s.side==='L'?-1:1,g=sd<0?gL:gR,other=sd<0?gR:gL;
      const charge=clamp(q/.22,0,1),strike=eout(clamp((q-.22)/.31,0,1)),recover=ease(clamp((q-.62)/.38,0,1)),active=1-recover;
      legBend=(q<.22?charge:1-strike)*.9*active;
      if(s.element==='fire'){
        by=(q<.22?45*charge:lerp(45,-90,strike))*active;bx=sd*65*strike*active;rot=sd*lerp(-.25,.2,strike)*active;
        g.x=lerp(sd*130,sd*25,strike)*active+sd*82*recover;g.y=lerp(-175,-405,strike)*active-250*recover;g.s=1+.35*active;
        other.x=-sd*125;other.y=-200-65*strike;
      }else if(s.element==='ice'){
        by=(q<.22?25*charge:-35*(1-strike))*active;rot=-sd*.12*strike*active;
        gL.x=-65;gR.x=65;gL.y=gR.y=lerp(-250,-465,charge);
        g.y=lerp(-465,-310,strike)*active-250*recover;other.y=lerp(-465,-245,strike)*active-250*recover;g.s=1+.45*strike*active;
      }else if(s.element==='lightning'){
        by=(q<.22?60*charge:lerp(60,-170,strike))*active;bx=-sd*30*strike*active;rot=sd*lerp(.2,-.18,strike)*active;
        g.x=lerp(sd*110,sd*15,strike)*active+sd*82*recover;g.y=lerp(-120,-470,strike)*active-250*recover;other.y=-190;g.s=1+.3*active;legBend=.75*active;
      }else{
        const spin=ease(clamp((q-.12)/.5,0,1));yaw=sd*TAU*spin;rot=0;by=-12*Math.sin(q*PI);bx=sd*35*Math.sin(q*PI);
        g.x=sd*lerp(150,-30,strike)*active+sd*82*recover;g.y=lerp(-230,-380,strike)*active-250*recover;other.x=-sd*135;other.y=-235;legBend=.5*Math.sin(q*PI);
      }
    }
    else if(st==='charge'){
      const sd=s.side==='L'?-1:1,g=sd<0?gL:gR,power=s.power||0;
      g.x=sd*(95+power*20);g.y=-225+power*30;g.s=1+power*1.5;
      by+=power*15;rot=sd*.08*power;legBend=power*.5;
    }
    else if (st === 'punch' || st === 'upper') {
      const g = s.side === 'L' ? gL : gR, sd = s.side === 'L' ? -1 : 1;
      if (st === 'punch') {
        const e = t < .35 ? eout(t / .35) : 1 - ease((t - .35) / .65);
        g.x = lerp(g.x, sd * (s.high ? 12 : 8), e); g.y = lerp(g.y, punchY, e); g.s = lerp(1, s.high ? .62 : .7, e);
        rot = -sd * .07 * e; bx = -sd * 22 * e; hx = -sd * 6 * e;
        g.s*=1+(s.power||0)*1.65;
        if (s.inRing) by -= ((s.high ? 64 : 36)+(s.power||0)*65) * e; legBend=.45*e;
      } else {
        const w = s.wind || .4, tt = t;
        if (tt < w) { const e = eout(tt / w); g.x = lerp(g.x, sd * 70, e); g.y = lerp(g.y, -130, e); by += 24 * e;legBend=.7*e; rot = sd * .12 * e; }
        else { const e = eout(clamp((tt - w) / .18, 0, 1)), back = clamp((tt - w - .3) / .4, 0, 1); g.x = sd * lerp(70, 12, e); g.y = lerp(-130, upperY, e); g.s = lerp(1, .7, e); by += lerp(24, s.inRing ? -108 : -30, e); rot = lerp(sd * .12, -sd * .1, e); g.x = lerp(g.x, sd * 82, back); g.y = lerp(g.y, -250, back); g.s = lerp(g.s, 1, back); by = lerp(by, 0, back);legBend=e*(1-back); }
      }
    }
    else if (st === 'hit') {
      const e = Math.pow(Math.max(0, 1 - t), .7), sd = s.hitSide ?? 1, power = s.hitPower || 1;
      bx += sd * 62 * e * power; by += 30 * e * power;
      hx += sd * 19 * e + Math.sin(T * 50) * 5 * e; hy += 12 * e;
      rot = sd * .28 * e * power;
      gL.x -= 30 * e; gR.x += 30 * e; gL.y += 45 * e; gR.y += 30 * e;
    }
    else if (st === 'stun') { rot = Math.sin(T * 5) * .12; bx = Math.sin(T * 5) * 30; gL.y = gR.y = -190; }
    else if (st === 'down') { const e = eout(clamp(t, 0, 1)); by += 330 * e; rot = .3 * e; }
    else if (st === 'getup') { const e = 1 - eout(clamp(t, 0, 1)); by += 330 * e; rot = .3 * e; }
    else if (st === 'win') { const b2 = Math.abs(Math.sin(T * 5)); gL.x = -110; gR.x = 110; gL.y = gR.y = -345 - b2 * 10; by -= b2 * 10; }
    else if (st === 'lose') { by += 60; gL.y = gR.y = -150; rot = .05; }
    if(s.element && (st==='punch'||st==='upper')){
      const g=s.side==='L'?gL:gR,sd=s.side==='L'?-1:1,q=st==='upper'?clamp(t/(s.wind+.45),0,1):clamp(t,0,1),pulse=Math.sin(q*PI);
      if(s.element==='fire'){rot-=sd*.18*pulse;bx+=sd*32*pulse;g.y-=28*pulse;g.s+=.25*pulse;}
      if(s.element==='ice'){rot=sd*.03;by+=8*pulse;g.x=lerp(sd*82,sd*28,pulse);g.y-=18*pulse;}
      if(s.element==='lightning'){by-=24*pulse;rot-=sd*.12*pulse;g.x+=sd*18*Math.sin(q*PI*2);}
      if(s.element==='wind'){g.x=sd*lerp(140,-95,ease(q));g.y=punchY+30*Math.cos(q*PI);rot=sd*(.25-.5*q);bx-=sd*35*pulse;}
    }
    if(s.targetGlove){const a=s.targetGlove,g=a.side==='L'?gL:gR;g.x=lerp(g.x,a.x,a.amount);g.y=lerp(g.y,a.y,a.amount);by=0;}
    const child=BX.KIDS.includes(ch.id),body=child?A.childBackBody(ch):null;
    if(child){for(const g of [gL,gR]){if(['idle','block','dodge','duck','hit'].includes(st))g.y+=35;const a=A.childBackArm(ch,g===gL?-1:1,g);g.x=a.wx;g.y=a.wy-22;}}
    if (s.aside) { const e = eout(clamp(s.aside, 0, 1)); bx -= 330 * e; by += 20 * e; rot -= .06 * e; }
    c.save(); c.translate(640 + bx, originY + by); c.rotate(rot); c.scale(k*(Math.cos(yaw)<0?-1:1)*Math.max(.18,Math.abs(Math.cos(yaw))), k);
    if (s.flash) c.globalAlpha = 1;
    // Bras (derrière la tête quand ils vont vers l’avant)
    const arm = (sd, g) => {
      if(child){const a=A.childBackArm(ch,sd,g);c.lineCap='round';c.lineJoin='round';c.lineWidth=ch.id==='milo'?25:28;c.strokeStyle=shade(PSKIN,-.20);c.beginPath();c.moveTo(a.sx,a.sy);c.lineTo(a.ex,a.ey);c.stroke();c.lineWidth=ch.id==='milo'?23:26;c.strokeStyle=shade(PSKIN,.10);c.beginPath();c.moveTo(a.ex,a.ey);c.lineTo(a.wx,a.wy);c.stroke();return;}

      const sx = sd * 78, sy = -172, up = g.y < -330, ex = (sx + g.x) / 2 + sd * (up ? 20 : 24), ey = (sy + g.y) / 2 + (up ? 0 : 28);
      c.strokeStyle = shade(PSKIN, -.06); c.lineCap = 'round'; c.lineWidth = 40; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
      c.lineWidth = 34 * (.75 + g.s * .25); c.beginPath(); c.moveTo(ex, ey); c.lineTo(g.x, g.y + 20 * g.s); c.stroke();
    };
    if(s.inRing&&child){
      for(const sd of [-1,1]){const x=sd*(ch.id==='milo'?26:32),fy=body.foot-legBend*18;c.strokeStyle=PSKIN;c.lineWidth=ch.id==='milo'?23:26;c.lineCap='round';c.beginPath();c.moveTo(x,body.hem+42);c.lineTo(x+sd*legBend*10,(body.hem+42+fy)/2);c.lineTo(x,fy);c.stroke();c.fillStyle='#293e49';rr(c,x-22,fy-10,44,23,8);c.fill();c.fillStyle='#83929a';rr(c,x-21,fy+7,42,6,3);c.fill();}
      const width=ch.id==='milo'?54:61;c.fillStyle='#293e49';rr(c,-width,body.hem-3,width*2,55,12);c.fill();
    }else if(s.inRing){
      c.strokeStyle=PSKIN;c.lineWidth=23;c.lineCap='round';c.lineJoin='round';
      for(const sd of [-1,1]){
        const kneeX=sd*(42+legBend*14),kneeY=94-legBend*20,footX=sd*43,footY=146-legBend*22;
        c.beginPath();c.moveTo(sd*30,40);c.lineTo(kneeX,kneeY);c.lineTo(footX,footY);c.stroke();
        c.fillStyle='#f4f0df';rr(c,footX-22,footY-9,52,24,8);c.fill();
        c.fillStyle='#253944';rr(c,footX-24,footY+9,56,6,3);c.fill();
        c.fillStyle=ch.tank;c.fillRect(footX-13,footY-3,19,5);
      }
      c.fillStyle='#253943';rr(c,-59,-5,118,67,11);c.fill();c.fillStyle='#e6dfca';c.fillRect(-58,0,116,8);
    }
    // Dos et épaules
    const tank = ch.tank;
    if(child){
      const w=body.shoulder,hem=body.hem,top=body.shoulderY;
      const fabric=c.createLinearGradient(-w,0,w,0);fabric.addColorStop(0,shade(tank,.12));fabric.addColorStop(.45,tank);fabric.addColorStop(1,shade(tank,-.22));c.fillStyle=fabric;
      c.beginPath();c.moveTo(-w+2,hem);c.quadraticCurveTo(-w+11,hem-55,-w+4,top+24);c.lineTo(-27,top-9);c.quadraticCurveTo(0,top+5,27,top-9);c.lineTo(w-4,top+24);c.quadraticCurveTo(w-11,hem-55,w-2,hem);c.quadraticCurveTo(0,hem+5,-w+2,hem);c.closePath();c.fill();
      c.fillStyle='#fff4de';c.font='18px Bungee, Impact';c.textAlign='center';if(Math.cos(yaw)>0)c.fillText(ch.name.toUpperCase(),0,hem-26,85);
    }else{
    c.save(); c.scale(.64, 1);
    c.fillStyle = PSKIN; c.beginPath(); c.moveTo(-150, 20); c.lineTo(-138, -150); c.quadraticCurveTo(-120, -196, -40, -205); c.lineTo(40, -205); c.quadraticCurveTo(120, -196, 138, -150); c.lineTo(150, 20); c.fill();
    c.fillStyle = tank; c.beginPath(); c.moveTo(-151, 20); c.lineTo(-137, -126); c.quadraticCurveTo(-108, -150, -86, -197); c.lineTo(-48, -201); c.quadraticCurveTo(0, -152, 48, -201); c.lineTo(86, -197); c.quadraticCurveTo(108, -150, 137, -126); c.lineTo(151, 20); c.fill();
    c.fillStyle = shade(tank, -.18); c.fillRect(-151, -20, 302, 6);
    c.fillStyle = 'rgba(255,255,255,.92)'; c.font = '30px Bungee, Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if(Math.cos(yaw)>0)c.fillText(ch.name.toUpperCase(), 0, -70, 200);
    c.restore();
    }
    arm(-1, gL); arm(1, gR);
    // Gants : devant le visage = plus loin que la tête, donc dessinés avant elle (on les voit dépasser de chaque côté)
    for (const [sd, g] of [[-1, gL], [1, gR]]) {
      const element=(s.side==='L'?sd===-1:sd===1)&&['punch','upper','special'].includes(st)?s.element:null;
      if(element)drawElementGlove(c,g,element,T);
      const color={fire:'#ff672b',ice:'#83e5ff',lightning:'#c596ff',wind:'#8df5c1'}[element]||ch.gloves;
      drawGlove(c,g.x,g.y,g.s*(child?1.03:1.22),color,child?sd:-sd,false,element?.6:0);
    }
    // Tête de dos
    const F = root.FamilyHeads;
    const expression=ch.id==='edison'?(st==='hit'?1:st==='charge'?0:s.tired?2:null):null;
    const expressive=expression!==null&&root.TrainingSprites?.face(expression);
    const img=expressive||(F&&F.frame(ch.id,Math.cos(yaw)<0?'front':'back'));
    c.save(); c.translate(hx, hy - 262);
    c.fillStyle = shade(PSKIN, -.1); rr(c, -30, 20, 60, 50, 16); c.fill();
    if(expressive && (s.side==='R'||(st==='hit'&&(s.hitSide??1)<0)))c.scale(-1,1);
    if (img) { const h = 168, w = h * img.width / img.height; c.drawImage(img, -w / 2, -h / 2 - 6, w, h); }
    else { c.fillStyle = '#4e342e'; ell(c, 0, 0, 62, 72); c.fill(); }
    c.restore();
    const tieCol = s.tied ? '#f06292' : null;
    if (tieCol) { c.strokeStyle = tieCol; c.lineWidth = 6; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(gL.x, gL.y - 20 + i * 12); c.quadraticCurveTo(0, gL.y - 30 + i * 14 + Math.sin(T * 8 + i) * 6, gR.x, gR.y - 20 + i * 12); c.stroke(); } }
    if (s.tired) { c.fillStyle = 'rgba(120,200,255,.85)'; for (let i = 0; i < 3; i++) { const p = (T * .9 + i / 3) % 1; c.beginPath(); c.arc(-70 + i * 70, -330 + p * 80, 6, 0, TAU); c.fill(); } }
    c.restore();
    return { x: 640 + bx, y: originY + (s.inRing?160*k:0) + by,
      headX: 640 + bx + (hx * Math.cos(rot) - (hy - 262) * Math.sin(rot)) * k,
      headY: originY + by + (hx * Math.sin(rot) + (hy - 262) * Math.cos(rot)) * k };
  };

  A.drawElementGlove=drawElementGlove;
  function drawElementGlove(c,g,kind,T){
    c.save();c.translate(g.x,g.y);c.lineWidth=5;c.lineCap='round';
    const color={fire:'#ff9a26',ice:'#9aefff',lightning:'#dcc0ff',wind:'#baffdc'}[kind];
    c.shadowColor=color;c.shadowBlur=18;c.fillStyle=c.strokeStyle=color;
    if(kind==='fire')for(let i=0;i<7;i++){const x=(i-3)*13,h=55+22*Math.sin(T*22+i);c.beginPath();c.moveTo(x-14,22);c.quadraticCurveTo(x-26,-35,x+Math.sin(T*15+i)*12,-h);c.quadraticCurveTo(x+25,-20,x+14,22);c.fill();}
    if(kind==='ice')for(let i=0;i<8;i++){c.save();c.rotate(i*PI/4);c.beginPath();c.moveTo(20,0);c.lineTo(48,-9);c.lineTo(70,0);c.lineTo(48,9);c.closePath();c.fill();c.restore();}
    if(kind==='lightning')for(let i=0;i<5;i++){c.save();c.rotate(i*TAU/5+T*3);c.beginPath();c.moveTo(18,0);c.lineTo(45,-15);c.lineTo(37,11);c.lineTo(85+8*Math.sin(T*25+i),0);c.stroke();c.restore();}
    if(kind==='wind')for(let i=0;i<4;i++){c.beginPath();c.ellipse(0,10-i*12,55+i*14,20+i*5,T*6+i*.3,.3,PI*1.8);c.stroke();}
    c.restore();
  }

  // Des proportions propres aux enfants, indépendantes de l’échelle d’affichage.
  A.childFrontPose = function(ch,T=0,sb={}) {
    const toddler=ch.id==='milo',shoulderY=toddler?-255:-300,shoulderX=toddler?48:56;
    const limb=toddler?58:72,hem=toddler?-130:-150,head=toddler?174:182;
    const bob=Math.sin(T*3)*3,e=sb.e||0;
    const arms=[-1,1].map(sd=>{
      const active=sd===sb.side,extension=active?e:0;
      let gx=sd*(shoulderX-18),gy=shoulderY-15;
      if(sb.celebrate){gx=sd*85;gy=shoulderY-limb*1.8;}
      else if(sb.rope){gx=sd*100;gy=hem+15+bob;}
      else if(sb.rest){gx=sd*90;gy=hem-15+bob;}
      else {gx=lerp(gx,sd*(shoulderX-8),extension);gy=lerp(gy,shoulderY-22,extension);}
      const sx=sd*shoulderX,sy=shoulderY,dx=gx-sx,dy=gy+25-sy;
      const distance=Math.hypot(dx,dy)||.01,reach=Math.min(distance,limb*2-.5),ux=dx/distance,uy=dy/distance;
      const wx=sx+ux*reach,wy=sy+uy*reach,h=Math.sqrt(Math.max(0,limb*limb-reach*reach/4));
      // Le coude reste sous l’épaule en garde ; la longueur des deux segments est fixe.
      const sign=sb.celebrate?sd:-sd,ex=(sx+wx)/2-uy*h*sign,ey=(sy+wy)/2+ux*h*sign;
      return {sd,sx,sy,ex,ey,wx,wy,gx:wx,gy:wy-25,scale:(toddler?.94:1.03)+extension*.28};
    });
    return {toddler,shoulderY,shoulderX,limb,hem,head,arms};
  };
  function drawChildFront(c,ch,x,y,k,T,sb={}) {
    const p=A.childFrontPose(ch,T,sb),waist=p.toddler?55:62;
    c.save();c.translate(x,y);c.scale(k*A.childScale(ch),k*A.childScale(ch));c.rotate((sb.side||0)*.035*(sb.e||0));
    const gradient=(x1,y1,x2,y2,color)=>{const g=c.createLinearGradient(x1,y1,x2,y2);g.addColorStop(0,shade(color,.12));g.addColorStop(.45,color);g.addColorStop(1,shade(color,-.22));return g;};
    // Jambes plus courtes chez le tout-petit, avec un léger modelé latéral.
    for(const sd of [-1,1]){
      const lx=sd*(p.toddler?28:33),foot=sb.rest?lx+sd*15:lx;
      c.strokeStyle=gradient(lx-14,0,lx+14,0,PSKIN);c.lineWidth=p.toddler?25:27;c.lineCap='round';c.beginPath();c.moveTo(lx,p.hem+40);c.lineTo(foot,-21);c.stroke();
      c.fillStyle=gradient(foot-23,-25,foot+23,0,'#283641');rr(c,foot-23,-25,46,25,9);c.fill();c.fillStyle='#83929a';rr(c,foot-22,-7,44,6,3);c.fill();
    }
    c.fillStyle=gradient(-waist,p.hem,waist,p.hem+60,'#293e49');rr(c,-waist,p.hem-4,waist*2,p.toddler?52:62,13);c.fill();
    c.strokeStyle='#172a34';c.lineWidth=3;c.beginPath();c.moveTo(0,p.hem+24);c.lineTo(0,p.hem+54);c.stroke();
    // Seul le cou est nu : aucune silhouette de peau plus large que le maillot.
    c.fillStyle=gradient(-20,0,20,0,PSKIN);rr(c,-20,p.shoulderY-25,40,46,12);c.fill();
    const jersey=()=>{c.beginPath();c.moveTo(-waist+7,p.hem);c.quadraticCurveTo(-waist+15,p.hem-55,-p.shoulderX+6,p.shoulderY+25);c.lineTo(-29,p.shoulderY-5);c.quadraticCurveTo(0,p.shoulderY+27,29,p.shoulderY-5);c.lineTo(p.shoulderX-6,p.shoulderY+25);c.quadraticCurveTo(waist-15,p.hem-55,waist-7,p.hem);c.quadraticCurveTo(0,p.hem+5,-waist+7,p.hem);c.closePath();};
    jersey();c.fillStyle=gradient(-waist,0,waist,0,ch.tank);c.fill();
    // Deux segments lisibles : haut du bras dans l’ombre, avant-bras clair devant.
    for(const a of p.arms){
      c.lineCap='round';c.lineJoin='round';c.lineWidth=p.toddler?25:28;
      c.strokeStyle=shade(PSKIN,-.20);
      c.beginPath();c.moveTo(a.sx,a.sy+7);c.lineTo(a.ex,a.ey);c.stroke();
    }
    for(const a of p.arms){
      c.lineWidth=p.toddler?23:26;c.lineCap='round';
      const skin=c.createLinearGradient(a.ex,a.ey,a.wx,a.wy);
      skin.addColorStop(0,shade(PSKIN,.05));skin.addColorStop(1,shade(PSKIN,.13));c.strokeStyle=skin;
      c.beginPath();c.moveTo(a.ex,a.ey);c.lineTo(a.wx,a.wy);c.stroke();
    }
    const img=root.FamilyHeads&&root.FamilyHeads.frame(ch.id,'front');
    if(img){const width=p.head*img.width/img.height;c.drawImage(img,-width/2,p.shoulderY-p.head+20,width,p.head);}
    for(const a of p.arms){if(sb.rope){c.fillStyle=PSKIN;ell(c,a.gx,a.gy,12,15);c.fill();}else drawGlove(c,a.gx,a.gy,a.scale,ch.gloves,a.sd,false,0);}
    c.restore();
  }

  // Boxeur de la famille de face (écran VS, cartes) : x,y = pieds ; k = échelle.
  // sb (optionnel) : shadow boxing { side: -1 | 1, e: 0..1 } — un gant part vers l’avant.
  A.playerFront = function (c, ch, x, y, k, T, sb) {
    if(BX.KIDS.includes(ch.id)&&BX.familyBody)return BX.familyBody.front(c,ch,x,y,k,T,sb);
    if(BX.KIDS.includes(ch.id))return drawChildFront(c,ch,x,y,k,T||0,sb||{});
    k *= A.childScale(ch);
    c.save(); c.translate(x, y); c.scale(k, k);
    const b = Math.sin((T || 0) * 3) * 4;
    const pe = sb && sb.e || 0, ps = sb && sb.side || 0, rest = sb && sb.rest, jumpingRope = sb && sb.rope, celebrating = sb && sb.celebrate;
    if (sb) c.rotate(ps * .05 * pe);
    c.save(); c.scale(.82, 1);
    c.strokeStyle = PSKIN; c.lineCap = 'round'; c.lineWidth = 34; c.beginPath(); c.moveTo(-40, -110); c.lineTo(rest ? -65 : -44, rest ? -75 : -20); c.lineTo(rest ? -70 : -44, -20); c.moveTo(40, -110); c.lineTo(rest ? 65 : 44, rest ? -75 : -20); c.lineTo(rest ? 70 : 44, -20); c.stroke();
    c.fillStyle = '#1b1b1b'; rr(c, rest ? -98 : -74, -26, 56, 26, 10); c.fill(); rr(c, rest ? 42 : 18, -26, 56, 26, 10); c.fill();
    c.fillStyle = '#263238'; rr(c, -80, -160, 160, 70, 14); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-80, -160, 160, 10);
    c.fillStyle = PSKIN; c.beginPath(); c.moveTo(-110, -150); c.lineTo(-96, -330); c.quadraticCurveTo(0, -370, 96, -330); c.lineTo(110, -150); c.fill();
    c.fillStyle = ch.tank; c.beginPath(); c.moveTo(-100, -150); c.lineTo(-80, -320); c.lineTo(-50, -335); c.quadraticCurveTo(0, -270, 50, -335); c.lineTo(80, -320); c.lineTo(100, -150); c.fill();
    c.strokeStyle = PSKIN; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 34; const gx = sd => celebrating ? sd * 105 : jumpingRope ? sd * 110 : sd === ps ? lerp(sd * 66, sd * 18, pe) : sd * 66, gy = sd => celebrating ? -475 - Math.abs(Math.sin((T || 0) * 6)) * 10 : jumpingRope ? -185 + b : rest ? -205 + b : sd === ps ? lerp(-345 + b, -385, pe) : -345 + b, gs = sd => sd === ps ? lerp(1.35, 1.9, pe) : 1.35;
    c.beginPath(); for (const sd of [-1, 1]) { const ex = celebrating ? sd * 136 : sd * lerp(128, 100, sd === ps ? pe : 0), ey = celebrating ? -395 : lerp(-225, -300, sd === ps ? pe : 0); c.moveTo(sd * 100, -320); c.lineTo(ex, ey); c.lineTo(gx(sd) * 1.06, gy(sd) + 15); } c.stroke();
    c.restore();
    const F = root.FamilyHeads, img = F && F.frame(ch.id, 'front');
    if (img) { const h = 190, w = h * img.width / img.height; c.drawImage(img, -w / 2, -350 - h + 30, w, h); }
    // le gant qui frappe passe devant la tête
    if (jumpingRope) { c.fillStyle = PSKIN; for (const sd of [-1, 1]) { ell(c, gx(sd), gy(sd), 18, 22); c.fill(); } }
    else {
      if (ps !== -1) drawGlove(c, gx(-1), gy(-1), gs(-1), ch.gloves, 1, false, 0);
      if (ps !== 1) drawGlove(c, gx(1), gy(1), gs(1), ch.gloves, -1, false, 0);
      if (ps) drawGlove(c, gx(ps), gy(ps), gs(ps), ch.gloves, -ps, false, 0);
    }
    c.restore();
  };

  // Coach au bord du ring : survêtement, serviette et carnet, sans gants de combat.
  A.cornerCoach = function (c, coach, x, y, k, T, side, rival, turnAngle) {
    c.save(); c.translate(x, y); c.scale(k, k);
    const jacket = rival ? '#9e4039' : shade(coach.tank, -.2), bob = Math.sin(T * 2.7) * 3;
    c.strokeStyle = '#27323d'; c.lineWidth = 34; c.lineCap = 'round'; c.beginPath(); c.moveTo(-32, -150); c.lineTo(-43, -23); c.moveTo(32, -150); c.lineTo(45, -23); c.stroke();
    c.fillStyle = '#e4decf'; rr(c, -70, -23, 61, 23, 8); c.fill(); rr(c, 20, -23, 61, 23, 8); c.fill();
    c.fillStyle = jacket; rr(c, -84, -350 + bob, 168, 210, 27); c.fill();
    c.fillStyle = '#e9dfc9'; c.fillRect(-4, -343 + bob, 8, 198); c.fillRect(-70, -318 + bob, 9, 144); c.fillRect(61, -318 + bob, 9, 144);
    const turning = typeof turnAngle === 'number', handX = side * (140 + (turning ? Math.cos(turnAngle) * 16 : 0)), handY = -306 + bob + (turning ? Math.sin(turnAngle) * 26 : 0);
    c.strokeStyle = jacket; c.lineWidth = 32; c.beginPath(); c.moveTo(side * 65, -320 + bob); c.lineTo(side * 113, -256 + bob); c.lineTo(handX, handY); c.moveTo(-side * 65, -320 + bob); c.lineTo(-side * 112, -230 + bob); c.stroke();
    c.fillStyle = '#e9bc98'; ell(c, handX, handY, 17, 19); c.fill(); ell(c, -side * 112, -224 + bob, 17, 18); c.fill();
    c.fillStyle = '#d9cfb3'; rr(c, -side * 112 - 20, -228, 40, 80, 5); c.fill(); c.fillStyle = '#6c8c9b'; c.fillRect(-side * 112 - 16, -178, 32, 7);
    // Serviette autour du cou.
    c.strokeStyle = '#efe8d5'; c.lineWidth = 16; c.beginPath(); c.moveTo(-42, -283); c.lineTo(-48, -349); c.quadraticCurveTo(0, -388, 48, -349); c.lineTo(42, -270); c.stroke();
    const img = !rival && root.FamilyHeads && root.FamilyHeads.frame(coach.id, 'front');
    if (img) { const h = 180, w = h * img.width / img.height; c.drawImage(img, -w / 2, -510 + bob, w, h); }
    else {
      const look = { skin: '#dfae87', head: .98, hair: { style: 'cap', c: '#44332b', cap: '#7e302c' }, mustache: '#46352c' };
      drawHead(c, look, { hx: 0, hy: -29 + bob, hr: side * .04, expr: 'smug' }, {}, T);
    }
    c.restore(); return { x: x + handX * k, y: y + handY * k };
  };

  // Bulle BD réutilisable : le texte se replie, la pointe reste attachée au locuteur.
  A.comicBubble = function (c, text, x, y, width, speaker, reveal = 1, size = 20) {
    c.save(); c.font = '900 ' + size + 'px Nunito'; c.textAlign = 'left'; c.textBaseline = 'top';
    const lines = [], words = text.split(' '); let current = '';
    for (const word of words) {
      const next = current ? current + ' ' + word : word;
      if (current && c.measureText(next).width > width - 36) { lines.push(current); current = word; } else current = next;
    }
    if (current) lines.push(current);
    const height = lines.length * size * 1.25 + 28, tailX = clamp(speaker.x, x + 24, x + width - 24);
    c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
    c.fillStyle = '#fffdf6'; c.strokeStyle = '#182b36'; c.lineWidth = 3;
    rr(c, x, y, width, height, 16); c.fill(); c.stroke(); c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.beginPath(); c.moveTo(tailX - 11, y + height - 1); c.lineTo(speaker.x, speaker.y); c.lineTo(tailX + 12, y + height - 1); c.fill(); c.stroke();
    c.fillRect(tailX - 10, y + height - 4, 20, 6);
    c.fillStyle = '#182b36'; let remaining = Math.floor(text.length * reveal);
    lines.forEach((line, i) => { c.fillText(line.slice(0, Math.max(0, remaining)), x + 18, y + 14 + i * size * 1.25); remaining -= line.length + 1; });
    c.restore(); return height;
  };

  // Portrait (tête et épaules) d’un adversaire, mis en cache.
  const portraits = new Map();
  A.portrait = function (b, size, shadowId) {
    const key = b.id + size + (shadowId || ''); if (portraits.has(key)) return portraits.get(key);
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d');
    const k = size / 300; g.translate(size / 2, size * 1.62); g.scale(k, k);
    A.boxer(g, b, { ph: 'intro', time: .3, guard: 'low', shadowId, noCape: false });
    portraits.set(key, cv); return cv;
  };
  A.clearPortraits = () => portraits.clear();
})(window);
