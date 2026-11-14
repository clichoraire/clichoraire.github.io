// K.O. en Famille — scène de course (après la première victoire d’un circuit) : ton boxeur court au lever du soleil,
// le coach suit à vélo. ~30 s, décors et rencontres tirés au hasard, musique originale. « Passer » après 5 s.
(function (root) {
  'use strict';
  const BX = root.BX, A = BX.art, AU = BX.audio;
  const R = BX.run = {};
  const W = 1280, H = 720, GROUND = 600, SEG = 4.6, TOTAL = 30.4, TAU = Math.PI * 2;
  let S = null;
  const rnd = seed => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const pick = (r, a) => a[(r() * a.length) | 0];

  // Le thème de course partage maintenant les instruments et le mixage du jeu.
  function playMusic() { AU.scene('run'); return AU.musicStop; }

  // ---------- Démarrage ----------
  R.start = function (o) { // { ch, coach, circuit, next, cameos:[boxers], onDone }
    const seed = (Date.now() & 0xffff) + 7, r = rnd(seed);
    const pool = ['parc', 'port', 'cote', 'rue', 'hiver', 'campagne'];
    for (let i = pool.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0;[pool[i], pool[j]] = [pool[j], pool[i]]; }
    const segs = ['ville'].concat(pool.slice(0, 4), ['sommet']);
    S = Object.assign({ t: 0, scroll: 0, segs, r, actors: [], said: null, done: false }, o);
    // Rencontres : quelques-unes par décor (sauf au sommet)
    const lines = ['Lâche pas !', 'Go, go, go !', 'T’es capable !', 'Bravo, champion !', 'On est fiers de toi !', 'Vas-y, la famille !', 'Bonne chance !', 'Wow, t’es rapide !'];
    for (let i = 0; i < segs.length - 1; i++) {
      const t0 = i * SEG, n = 1 + (r() < .6 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const at = t0 + .6 + k * 2 + r() * 1.2, kind = pick(r, segs[i] === 'hiver' ? ['fan', 'kid', 'dog', 'snowman'] : segs[i] === 'port' ? ['fan', 'birds', 'fan', 'kid'] : ['fan', 'fan', 'kid', 'dog', 'birds', 'car']);
        S.actors.push({ at, kind, line: pick(r, lines), col: pick(r, ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00897b']), skin: pick(r, ['#f1c7a1', '#e0ac7e', '#c68642', '#8d5524']), hat: r() < .5 });
      }
    }
    // Un ancien adversaire battu vient saluer (si on en a)
    if (o.cameos && o.cameos.length) S.actors.push({ at: 2 * SEG + 1.2, kind: 'cameo', b: pick(r, o.cameos), line: 'Hé ! Pas de rancune !' });
    S.actors.forEach(a => a.x0 = null);
    S.stopMusic = playMusic();
    AU.crowd(0);
  };
  R.state = () => S;
  R.skip = function () { if (!S || S.done) return; S.done = true; if (S.stopMusic) S.stopMusic(); const cb = S.onDone; S = null; cb && cb(); };
  R.canSkip = () => S && S.t > 5;

  R.update = function (dt) {
    if (!S) return;
    S.t += dt;
    const seg = segAt(S.t), speed = seg === 'cote' ? 330 : seg === 'sommet' ? 520 * Math.max(0, 1 - (S.t - (S.segs.length - 1) * SEG) / 1.6) : 520;
    S.scroll += speed * dt; S.speed = speed;
    for (const a of S.actors) if (a.x0 == null && S.t >= a.at) a.x0 = S.scroll + W + 80;
    if (S.t >= TOTAL) R.skip();
  };
  const segAt = t => S.segs[Math.min(S.segs.length - 1, Math.floor(t / SEG))];

  // ---------- Décors ----------
  const SKY = {
    ville: ['#ff9e80', '#ffe0b2'], parc: ['#81d4fa', '#e1f5fe'], port: ['#4fc3f7', '#b3e5fc'], cote: ['#ffcc80', '#fff3e0'],
    rue: ['#90caf9', '#e3f2fd'], hiver: ['#b0bec5', '#eceff1'], campagne: ['#80deea', '#e0f7fa'], sommet: ['#ff7043', '#ffd54f'],
  };
  function drawSeg(ctx, kind, sc, T, viewWidth=W) {
    const sky = SKY[kind];
    let gr = ctx.createLinearGradient(0, 0, 0, GROUND); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, viewWidth, GROUND);
    // Soleil
    const sunY = kind === 'sommet' ? 300 : kind === 'ville' ? 330 : 120;
    ctx.fillStyle = kind === 'hiver' ? 'rgba(255,255,255,.7)' : 'rgba(255,241,118,.95)'; ctx.beginPath(); ctx.arc(1000, sunY, kind === 'sommet' ? 110 : 60, 0, TAU); ctx.fill();
    // Loin : collines / ville
    const far = sc * .15;
    ctx.fillStyle = kind === 'hiver' ? '#cfd8dc' : kind === 'sommet' ? '#8d6e63' : '#90a4ae';
    ctx.beginPath(); ctx.moveTo(0, GROUND); for (let x = 0; x <= viewWidth; x += 40) ctx.lineTo(x, 330 + Math.sin((x + far) / 170) * 40 + Math.sin((x + far) / 63) * 14); ctx.lineTo(viewWidth, GROUND); ctx.fill();
    if (kind === 'ville' || kind === 'rue' || kind === 'sommet' || kind === 'port') skyline(ctx, sc * .25, kind === 'sommet' ? 380 : 360, kind === 'sommet' ? '#5d4037' : '#78909c');
    // Milieu
    const mid = sc * .5;
    if (kind === 'ville') rowOf(ctx, mid, 260, (x, i, r) => house(ctx, x, r));
    if (kind === 'rue') rowOf(ctx, mid, 300, (x, i, r) => shop(ctx, x, r, i));
    if (kind === 'parc' || kind === 'campagne') rowOf(ctx, mid, kind === 'parc' ? 170 : 240, (x, i, r) => tree(ctx, x, r, kind === 'campagne' && r() < .4 ? 'pine' : 'maple'));
    if (kind === 'campagne') rowOf(ctx, sc * .35, 700, (x) => barn(ctx, x));
    if (kind === 'hiver') rowOf(ctx, mid, 230, (x, i, r) => r() < .5 ? tree(ctx, x, r, 'pine', true) : house(ctx, x, r, true));
    if (kind === 'port') { ctx.fillStyle = '#1e88e5'; ctx.fillRect(0, 470, viewWidth, 100); ctx.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 12; i++) ctx.fillRect(((i * 150 - sc * .4) % (W + 150) + W + 150) % (W + 150) - 75, 500 + (i % 3) * 20, 50, 3); rowOf(ctx, sc * .4, 520, (x) => boat(ctx, x, T)); }
    if (kind === 'cote') { ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(0, 420); ctx.lineTo(viewWidth, 300); ctx.lineTo(viewWidth, GROUND); ctx.fill(); rowOf(ctx, mid, 220, (x, i, r) => tree(ctx, x, r, 'maple')); }
    if (kind === 'sommet') { ctx.fillStyle = '#6d4c41'; ctx.fillRect(0, 520, viewWidth, 80); ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 520); ctx.lineTo(viewWidth, 520); ctx.stroke(); for (let x = 20; x < viewWidth; x += 60) { ctx.fillStyle = '#4e342e'; ctx.fillRect(x, 520, 8, 40); } }
    // Sol : trottoir + rue
    ctx.fillStyle = kind === 'hiver' ? '#eceff1' : kind === 'campagne' ? '#8d6e63' : kind === 'parc' ? '#7cb342' : '#bdbdbd'; ctx.fillRect(0, GROUND - 20, viewWidth, 90);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; for (let x = -(sc % 120); x < viewWidth; x += 120) { ctx.beginPath(); ctx.moveTo(x, GROUND - 20); ctx.lineTo(x - 20, GROUND + 70); ctx.stroke(); }
    ctx.fillStyle = kind === 'campagne' ? '#6d4c41' : '#455a64'; ctx.fillRect(0, GROUND + 70, viewWidth, H - GROUND - 70);
    if (kind !== 'campagne') { ctx.fillStyle = '#ffd600'; for (let x = -(sc * 1.3 % 160); x < viewWidth; x += 160) ctx.fillRect(x, GROUND + 100, 80, 8); }
    if (kind === 'hiver') { ctx.fillStyle = '#fafafa'; for (let x = -(sc % 300); x < viewWidth; x += 300) { A.ell(ctx, x + 60, GROUND - 16, 90, 26); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 60; i++) { const x = (i * 97 + T * 40 - sc * .3) % viewWidth, y = (i * 53 + T * 70) % GROUND; ctx.beginPath(); ctx.arc((x + W) % viewWidth, y, 2 + (i % 3), 0, TAU); ctx.fill(); } }
  }
  function rowOf(ctx, off, gap, fn) { const first = Math.floor(off / gap) - 1; for (let i = first; i < first + Math.ceil(W / gap) + 3; i++) { fn(i * gap - off, i, rnd(i * 7919 + gap)); } }
  function skyline(ctx, off, base, col) { ctx.fillStyle = col; rowOf(ctx, off, 70, (x, i, r) => { const h = 40 + r() * 110; ctx.fillRect(x, base - h, 60, h + 120); ctx.fillStyle = 'rgba(255,255,200,.35)'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 8 + (k % 2) * 26, base - h + 12 + (k >> 1) * 22, 12, 10); ctx.fillStyle = col; }); }
  function house(ctx, x, r, snow) {
    const c = pick(r, ['#ef9a9a', '#90caf9', '#fff59d', '#a5d6a7', '#ce93d8', '#ffcc80']), w = 170, h = 120, y = GROUND - 20 - h;
    ctx.fillStyle = c; ctx.fillRect(x, y, w, h); ctx.fillStyle = pick(r, ['#6d4c41', '#37474f', '#b71c1c']); ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + w / 2, y - 70); ctx.lineTo(x + w + 14, y); ctx.fill();
    if (snow) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + w / 2, y - 70); ctx.lineTo(x + w + 14, y); ctx.lineTo(x + w / 2, y - 56); ctx.fill(); }
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x + 70, y + 60, 32, 60); ctx.fillStyle = '#fff8e1'; ctx.fillRect(x + 18, y + 30, 36, 30); ctx.fillRect(x + 118, y + 30, 36, 30);
    // escalier extérieur québécois
    if (r() < .5) { ctx.strokeStyle = '#263238'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + w - 6, y + h); ctx.lineTo(x + w + 30, y + 40); ctx.lineTo(x + w + 30, y + h); ctx.stroke(); }
  }
  function shop(ctx, x, r, i) {
    const names = ['DÉPANNEUR', 'CASSE-CROÛTE', 'BOULANGERIE', 'QUINCAILLERIE', 'CRÈMERIE', 'FRIPERIE'];
    const c = pick(r, ['#8d6e63', '#a1887f', '#795548', '#90a4ae']), w = 260, h = 200, y = GROUND - 20 - h;
    ctx.fillStyle = c; ctx.fillRect(x, y, w, h); ctx.fillStyle = pick(r, ['#c62828', '#1565c0', '#2e7d32', '#f9a825']); ctx.fillRect(x + 10, y + 70, w - 20, 34);
    ctx.fillStyle = '#fff'; ctx.font = '18px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText(names[((i % names.length) + names.length) % names.length], x + w / 2, y + 94);
    ctx.fillStyle = '#b3e5fc'; ctx.fillRect(x + 20, y + 115, 100, 60); ctx.fillStyle = '#4e342e'; ctx.fillRect(x + 150, y + 115, 50, 85);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#fff' : ctx.fillStyle === '#fff' ? '#c62828' : '#c62828'; ctx.fillRect(x + 10 + k * 60, y + 104, 60, 10); }
  }
  function tree(ctx, x, r, kind, snow) {
    const y = GROUND - 20;
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x - 9, y - 110, 18, 110);
    if (kind === 'pine') { ctx.fillStyle = '#2e7d32'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 60 + k * 12, y - 70 - k * 50); ctx.lineTo(x, y - 160 - k * 50); ctx.lineTo(x + 60 - k * 12, y - 70 - k * 50); ctx.fill(); if (snow) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 20, y - 140 - k * 50); ctx.lineTo(x, y - 160 - k * 50); ctx.lineTo(x + 20, y - 140 - k * 50); ctx.fill(); ctx.fillStyle = '#2e7d32'; } } return; }
    const col = pick(r, ['#e65100', '#c62828', '#f9a825', '#ef6c00', '#2e7d32']);
    ctx.fillStyle = col; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.3) * 40, y - 150 + Math.sin(k * 1.7) * 30, 48, 0, TAU); ctx.fill(); }
  }
  function barn(ctx, x) { const y = GROUND - 30; ctx.fillStyle = '#c62828'; ctx.fillRect(x, y - 120, 160, 120); ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.moveTo(x - 10, y - 120); ctx.lineTo(x + 80, y - 190); ctx.lineTo(x + 170, y - 120); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeRect(x + 55, y - 80, 50, 80); ctx.beginPath(); ctx.moveTo(x + 55, y - 80); ctx.lineTo(x + 105, y); ctx.moveTo(x + 105, y - 80); ctx.lineTo(x + 55, y); ctx.stroke(); }
  function boat(ctx, x, T) { const y = 520 + Math.sin(T * 2 + x) * 4; ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 140, y); ctx.lineTo(x + 115, y + 26); ctx.lineTo(x + 20, y + 26); ctx.fill(); ctx.fillStyle = '#795548'; ctx.fillRect(x + 66, y - 90, 5, 90); ctx.fillStyle = '#ffccbc'; ctx.beginPath(); ctx.moveTo(x + 72, y - 88); ctx.lineTo(x + 130, y - 8); ctx.lineTo(x + 72, y - 8); ctx.fill(); }

  // ---------- Personnages de profil ----------
  const SKIN = '#e9bc98';
  function head(ctx, id, x, y, h) { const F = root.FamilyHeads, img = F && F.frame(id, 'side'); if (img) { const w = h * img.width / img.height; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); } else { ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.arc(x, y, h * .4, 0, TAU); ctx.fill(); } }
  function limb(ctx, x, y, a1, a2, l1, l2, w, col) { const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(kx + Math.sin(a1 + a2) * l2, ky + Math.cos(a1 + a2) * l2); ctx.stroke(); return [kx + Math.sin(a1 + a2) * l2, ky + Math.cos(a1 + a2) * l2]; }
  // Cycle de course avec appuis au sol, deux segments par jambe et bras opposés.
  R.runnerPose = function (ch, T, mode) {
    const phase = T * 11, win = mode === 'win';
    const bob = win ? Math.abs(Math.sin(T * 7)) * 9 : 3 + Math.abs(Math.sin(phase * 2)) * 4;
    const hip = { x: 0, y: -80 - bob }, legs = [];
    for (let i = 0; i < 2; i++) {
      const u = ((phase / TAU + i * .5) % 1 + 1) % 1, stance = u < .55, v = stance ? u / .55 : (u - .55) / .45;
      const ankle = { x: win ? (i ? 13 : -13) : stance ? A.lerp(29, -31, v) : A.lerp(-31, 29, A.ease(v)),
        y: -7 - (win || stance ? 0 : Math.sin(v * Math.PI) * 39) };
      const origin = { x: i ? 3 : -3, y: hip.y + 2 }, dx = ankle.x - origin.x, dy = ankle.y - origin.y;
      const d = Math.max(1, Math.hypot(dx, dy)), along = d / 2, bend = Math.sqrt(Math.max(0, 44 * 44 - along * along));
      const knee = { x: origin.x + dx * .5 + dy / d * bend, y: origin.y + dy * .5 - dx / d * bend };
      legs.push({ hip: origin, knee, ankle, stance: win || stance, shoeAngle: win ? 0 : stance ? A.lerp(-.08, .12, v) : -.45 + Math.sin(v * Math.PI) * .55 });
    }
    const arms = [0, 1].map(i => {
      const shoulder = { x: i ? 9 : 0, y: hip.y - 46 }, side = i ? 1 : -1;
      if (win) return { shoulder, elbow: { x: shoulder.x + side * 17, y: shoulder.y - 29 }, hand: { x: shoulder.x + side * 28, y: shoulder.y - 56 } };
      const angle = -Math.cos(T * 5 + i * Math.PI) * .5;
      const elbow = { x: shoulder.x + Math.sin(angle) * 27, y: shoulder.y + Math.cos(angle) * 27 };
      return { shoulder, elbow, hand: { x: elbow.x + Math.sin(angle + 1.7) * 25, y: elbow.y + Math.cos(angle + 1.7) * 25 } };
    });
    return { hip, legs, arms, bob, head: { x: 11, y: hip.y - 95 }, scale: .84 + .16 * A.clamp((ch.size - .62) / .38, 0, 1) };
  };
  function runnerShoe(ctx, leg, accent) {
    ctx.save(); ctx.translate(leg.ankle.x, leg.ankle.y); ctx.rotate(leg.shoeAngle);
    // Petite chaussette et espadrille de profil : talon, pointe, semelle et lacets.
    ctx.fillStyle = '#eee9dc'; A.rr(ctx, -5, -10, 12, 12, 3); ctx.fill();
    ctx.fillStyle = '#f3f1e7'; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.quadraticCurveTo(-7, -12, 3, -9); ctx.lineTo(10, -3); ctx.quadraticCurveTo(23, -3, 24, 3); ctx.lineTo(23, 7); ctx.lineTo(-10, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#263b44'; A.rr(ctx, -10, 4, 34, 4, 2); ctx.fill();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-1, -5); ctx.lineTo(8, 2); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#85979a'; ctx.lineWidth = 1.3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(3 + i * 3, -5 + i); ctx.lineTo(7 + i * 3, -4 + i); ctx.stroke(); }
    ctx.restore();
  }
  function runner(ctx, ch, x, T, mode) {
    const pose = R.runnerPose(ch, T, mode), hood = ch.tank, hip = pose.hip;
    if(root.BX.KIDS.includes(ch.id)&&root.BX.familyBody){
      const k=.66*pose.scale,originY=GROUND-177*k*root.BX.familyBody.factor(ch),stride=mode==='win'?0:Math.sin(T*10)*38;
      const hands=pose.arms.map(a=>({x:x+a.hand.x*pose.scale,y:GROUND+a.hand.y*pose.scale}));
      root.BX.familyBody.equipment(ctx,ch,x,originY,k,{view:'side',time:T,stride,hands,shadow:true});return;
    }
    ctx.save(); ctx.translate(x, GROUND); ctx.scale(pose.scale, pose.scale);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ell(ctx, 0, 5, 41, 7); ctx.fill();
    const leg = (part, behind) => {
      ctx.strokeStyle = behind ? A.shade(SKIN, -.16) : SKIN; ctx.lineWidth = behind ? 14 : 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(part.hip.x, part.hip.y); ctx.lineTo(part.knee.x, part.knee.y); ctx.lineTo(part.ankle.x, part.ankle.y - 3); ctx.stroke();
      runnerShoe(ctx, part, A.shade(hood, -.22));
    };
    const arm = (part, behind) => {
      ctx.strokeStyle = A.shade(hood, behind ? -.22 : -.04); ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(part.shoulder.x, part.shoulder.y); ctx.lineTo(part.elbow.x, part.elbow.y); ctx.lineTo(part.hand.x, part.hand.y); ctx.stroke();
      ctx.fillStyle = behind ? A.shade(SKIN, -.12) : SKIN; ctx.beginPath(); ctx.arc(part.hand.x, part.hand.y, 6.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#eee8d5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(part.hand.x - 4, part.hand.y - 5); ctx.lineTo(part.hand.x + 3, part.hand.y - 4); ctx.stroke();
    };
    leg(pose.legs[0], true); arm(pose.arms[0], true); leg(pose.legs[1], false);
    ctx.fillStyle = '#263943'; A.rr(ctx, -21, hip.y - 7, 43, 25, 7); ctx.fill();
    ctx.fillStyle = '#40505a'; ctx.fillRect(-20, hip.y - 6, 40, 4);
    ctx.fillStyle = hood; ctx.beginPath(); ctx.moveTo(-17, hip.y - 62); ctx.quadraticCurveTo(5, hip.y - 73, 27, hip.y - 53); ctx.lineTo(24, hip.y + 3); ctx.quadraticCurveTo(-2, hip.y + 10, -23, hip.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = A.shade(hood, -.22); A.rr(ctx, -27, hip.y - 69, 27, 24, 10); ctx.fill();
    ctx.strokeStyle = A.shade(hood, -.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-19, hip.y - 2); ctx.lineTo(22, hip.y + 1); ctx.stroke();
    ctx.fillStyle = '#f5efdc'; ctx.font = '9px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText('K.O.', 13, hip.y - 32);
    arm(pose.arms[1], false);
    head(ctx, ch.id, pose.head.x, pose.head.y, 88);
    ctx.restore();
  }
  R.drawRunner = runner;
  R.drawCyclist = cyclist;
  R.drawScenery = drawSeg;
  function cyclist(ctx, coach, x, T, uphill) {
    const y = GROUND - 8, rot = T * 9;
    const wheel = cx => { ctx.strokeStyle = '#263238'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, y - 34, 34, 0, TAU); ctx.stroke(); ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(cx, y - 34); ctx.lineTo(cx + Math.cos(a) * 32, y - 34 + Math.sin(a) * 32); ctx.stroke(); } };
    ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ell(ctx, x, y + 10, 80, 8); ctx.fill();
    wheel(x - 50); wheel(x + 50);
    ctx.strokeStyle = '#c62828'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 50, y - 34); ctx.lineTo(x - 10, y - 34); ctx.lineTo(x + 30, y - 90); ctx.lineTo(x - 22, y - 92); ctx.lineTo(x - 10, y - 34); ctx.moveTo(x + 30, y - 90); ctx.lineTo(x + 50, y - 34); ctx.moveTo(x + 30, y - 90); ctx.lineTo(x + 34, y - 112); ctx.stroke();
    ctx.strokeStyle = '#212121'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 24, y - 114); ctx.lineTo(x + 44, y - 112); ctx.stroke();
    // pédalier
    const pa = rot * .8; const px = x - 10 + Math.cos(pa) * 16, py = y - 34 + Math.sin(pa) * 16, qx = x - 10 - Math.cos(pa) * 16, qy = y - 34 - Math.sin(pa) * 16;
    const hip = [x - 22, y - 112];
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 15; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo((hip[0] + qx) / 2 + 14, (hip[1] + qy) / 2); ctx.lineTo(qx, qy); ctx.stroke();
    ctx.fillStyle = '#1565c0'; A.rr(ctx, x - 40, y - 168, 42, 62, 14); ctx.fill(); ctx.fillStyle = '#fafafa'; ctx.fillRect(x - 40, y - 150, 42, 6);
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo((hip[0] + px) / 2 + 14, (hip[1] + py) / 2); ctx.lineTo(px, py); ctx.stroke();
    ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(x - 12, y - 160); ctx.lineTo(x + 18, y - 130); ctx.lineTo(x + 36, y - 114); ctx.stroke();
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 30, y - 166); ctx.quadraticCurveTo(x - 4, y - 130, x + 6, y - 168); ctx.stroke(); ctx.fillStyle = '#cfd8dc'; A.rr(ctx, x - 6, y - 142, 16, 8, 3); ctx.fill();
    head(ctx, coach.id, x - 12 + (uphill ? Math.sin(T * 8) * 3 : 0), y - 206, 86);
  }
  function person(ctx, a, x, T) {
    const y = GROUND - 22, wave = Math.sin(T * 10);
    if (a.kind === 'dog') { const run = Math.sin(T * 18); ctx.fillStyle = '#8d6e63'; A.ell(ctx, x, y - 30, 38, 18); ctx.fill(); ctx.beginPath(); ctx.arc(x + 38, y - 44, 15, 0, TAU); ctx.fill(); ctx.fillStyle = '#5d4037'; A.ell(ctx, x + 34, y - 56, 6, 12, -.4); ctx.fill(); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (const [dx, s] of [[-24, 1], [-14, -1], [18, 1], [28, -1]]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 20); ctx.lineTo(x + dx + run * 8 * s, y); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x - 36, y - 34); ctx.lineTo(x - 52, y - 48 + wave * 6); ctx.stroke(); return; }
    if (a.kind === 'birds') { ctx.strokeStyle = '#37474f'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const bx = x + i * 30 - 60, by = y - 60 - (T * 60 % 200) * (i % 2 ? 1 : .7) - i * 10, f = Math.sin(T * 20 + i) * 6; ctx.beginPath(); ctx.moveTo(bx - 10, by + f); ctx.lineTo(bx, by); ctx.lineTo(bx + 10, by + f); ctx.stroke(); } return; }
    if (a.kind === 'car') { const cx = x - 200 * ((T * 3) % 1); ctx.fillStyle = a.col; A.rr(ctx, cx - 90, GROUND + 70, 180, 50, 14); ctx.fill(); A.rr(ctx, cx - 50, GROUND + 40, 100, 40, 12); ctx.fill(); ctx.fillStyle = '#b3e5fc'; ctx.fillRect(cx - 40, GROUND + 46, 80, 26); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(cx - 50, GROUND + 122, 16, 0, TAU); ctx.arc(cx + 50, GROUND + 122, 16, 0, TAU); ctx.fill(); return; }
    if (a.kind === 'snowman') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 30, 34, 0, TAU); ctx.arc(x, y - 82, 24, 0, TAU); ctx.arc(x, y - 120, 18, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff6f00'; ctx.beginPath(); ctx.moveTo(x, y - 120); ctx.lineTo(x - 22, y - 116); ctx.lineTo(x, y - 114); ctx.fill(); ctx.fillStyle = '#d32f2f'; ctx.fillRect(x - 18, y - 106, 36, 8); ctx.fillStyle = '#212121'; ctx.fillRect(x - 16, y - 150, 32, 16); ctx.fillRect(x - 22, y - 136, 44, 4); return; }
    if (a.kind === 'cameo') { ctx.save(); ctx.translate(x, y + 18); ctx.scale(.36, .36); A.boxer(ctx, a.b, { ph: 'win', time: T, shadowId: S.ch.id }); ctx.restore(); return; }
    const kid = a.kind === 'kid', s = kid ? .7 : 1, top = y - 150 * s;
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 12 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 8 * s, y - 60 * s); ctx.lineTo(x - 10 * s, y); ctx.moveTo(x + 8 * s, y - 60 * s); ctx.lineTo(x + 10 * s, y); ctx.stroke();
    ctx.fillStyle = a.col; A.rr(ctx, x - 22 * s, top + 40 * s, 44 * s, 60 * s, 12 * s); ctx.fill();
    ctx.strokeStyle = a.col; ctx.lineWidth = 11 * s; ctx.beginPath(); ctx.moveTo(x + 18 * s, top + 50 * s); ctx.lineTo(x + 34 * s + wave * 8 * s, top + 10 * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 18 * s, top + 50 * s); ctx.lineTo(x - 24 * s, top + 90 * s); ctx.stroke();
    ctx.fillStyle = a.skin; ctx.beginPath(); ctx.arc(x + 36 * s + wave * 8 * s, top + 6 * s, 7 * s, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, top + 20 * s, 22 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(x - 7 * s, top + 16 * s, 2.5 * s, 0, TAU); ctx.arc(x + 7 * s, top + 16 * s, 2.5 * s, 0, TAU); ctx.fill(); ctx.strokeStyle = '#212121'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, top + 24 * s, 8 * s, .2, Math.PI - .2); ctx.stroke();
    if (a.hat) { ctx.fillStyle = kid ? '#e91e63' : '#1565c0'; ctx.beginPath(); ctx.arc(x, top + 12 * s, 22 * s, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, top - 14 * s, 7 * s, 0, TAU); ctx.fill(); }
  }
  function bubble(ctx, x, y, txt) {
    ctx.save(); ctx.font = '900 20px Nunito'; const w = Math.max(160, Math.min(380, ctx.measureText(txt).width + 36));
    A.comicBubble(ctx, txt, A.clamp(x - w / 2, 16, W - w - 16), y - 68, w, { x, y: y + 12 }, 1, 20); ctx.restore();
  }

  // ---------- Rendu ----------
  const COACH_LINES = { parc: 'Respire par le nez !', port: 'Sens-tu l’air du fleuve ?', cote: 'Ouf… pousse dans la côte !', rue: 'Plus vite, champion !', hiver: 'Un vrai Québécois a pas froid !', campagne: 'On fait un dernier kilomètre !' };
  R.render = function (ctx) {
    if (!S) return;
    const T = Math.max(0, S.t), i = Math.max(0, Math.min(S.segs.length - 1, Math.floor(T / SEG))), kind = S.segs[i], into = T - i * SEG;
    const uphill = kind === 'cote', last = kind === 'sommet';
    ctx.save();
    if (uphill) { ctx.translate(640, 360); ctx.rotate(-.06); ctx.scale(1.08, 1.08); ctx.translate(-640, -360); }
    drawSeg(ctx, kind, S.scroll, T);
    if (into < .7 && i > 0) { ctx.globalAlpha = 1 - into / .7; drawSeg(ctx, S.segs[i - 1], S.scroll, T); ctx.globalAlpha = 1; }
    // Rencontres
    for (const a of S.actors) {
      if (a.x0 == null) continue; const x = a.x0 - S.scroll; if (x < -300 || x > W + 300) continue;
      person(ctx, a, x, T);
      if ((a.kind === 'fan' || a.kind === 'kid' || a.kind === 'cameo') && x < 1000 && x > 200) bubble(ctx, x, a.kind === 'cameo' ? GROUND - 200 : a.kind === 'kid' ? GROUND - 140 : GROUND - 190, a.line);
    }
    // Coach et boxeur
    const lastT = last ? into : 0;
    const coachX = last ? Math.min(560, 330 + lastT * 120) : 330 + Math.sin(T * .7) * 20, runX = last ? 760 : 640 + Math.sin(T * .5) * 30;
    cyclist(ctx, S.coach, coachX, last && lastT > 2 ? 0 : T, uphill);
    runner(ctx, S.ch, runX, T, last && lastT > 1.4 ? 'win' : 'run');
    if (!last && into > .8 && into < 3.2 && COACH_LINES[kind] && (i % 2 === 1 || uphill)) bubble(ctx, coachX - 10, GROUND - 270, COACH_LINES[kind]);
    if (last && lastT > 2) bubble(ctx, coachX - 10, GROUND - 270, 'Je suis fier de toi, ' + S.ch.name + ' !');
    ctx.restore();
    // Titres
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const title = (txt, sub, a, col) => { ctx.globalAlpha = a; ctx.fillStyle = 'rgba(5,3,15,.55)'; ctx.fillRect(0, 50, W, 130); ctx.font = '64px Bungee, Impact'; ctx.lineWidth = 10; ctx.strokeStyle = '#140a26'; ctx.strokeText(txt, 640, 105); ctx.fillStyle = col; ctx.fillText(txt, 640, 105); ctx.fillStyle = '#fff'; ctx.font = '900 28px Nunito'; ctx.fillText(sub, 640, 152); ctx.globalAlpha = 1; };
    if (T < 4) title('🏆 ' + S.circuit.name.toUpperCase() + ' GAGNÉ !', 'Entraînement spécial avec ' + S.coach.name + '…', Math.min(1, T * 2, (4 - T) * 2), S.circuit.color);
    if (last && lastT > 2.2) title(S.next ? 'PROCHAIN : ' + S.next.name.toUpperCase() : 'LE MONDE T’ATTEND !', S.next ? 'Le vrai défi commence maintenant.' : 'Tu es au sommet !', Math.min(1, (lastT - 2.2) * 2), '#ffd600');
    // Bandes de cinéma
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 34); ctx.fillRect(0, H - 34, W, 34);
    ctx.restore();
  };
})(window);
