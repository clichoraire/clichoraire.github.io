// Goblin Malin — écran d'accueil (Jouer, Configuration, Debug) et création du chef avant une nouvelle partie.
'use strict';
(function (CG) {
  const UI = CG.UI, A8 = CG.Art8, TAU = Math.PI * 2, CFG_KEY = 'goblin-malin-config';
  const Acc = CG.Accueil = { open: false };
  let root = null, cv = null, ctx = null, raf = 0, t0 = 0, view = 'menu', look = null, nom = 'Grizz', pdir = 'S', drag = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- configuration (gardée d'une fois à l'autre) ----------
  // mêmes réglages que la fenêtre de pause
  const cfg = { get music() { return CG.audio.musicOn; }, set music(v) { CG.audio.musicOn = v; }, get sfx() { return CG.audio.sfxOn; }, set sfx(v) { CG.audio.sfxOn = v; } };
  const applyCfg = () => CG.audio.savePrefs();
  try { localStorage.removeItem(CFG_KEY); } catch (e) { /* rien */ }

  // ---------- avertissement avant d'écraser une partie ----------
  function ask(o) {
    const sv = CG.peekSave(), d = document.createElement('div'); d.className = 'acc-ask';
    const nb = sv && sv.goblins ? sv.goblins.length : 0;
    d.innerHTML = '<div class="acc-card"><div class="acc-warn">⚠️</div><h3>' + o.titre + '</h3>' +
      (sv ? '<div class="acc-save"><div class="acc-slot">Partie<b>n° 1</b></div><div class="acc-info"><b>' + esc(sv.name) + '</b><span>☀️ Jour ' + sv.day + ' &nbsp;·&nbsp; 👥 ' + nb + ' gobelin' + (nb > 1 ? 's' : '') + (sv.player ? ' &nbsp;·&nbsp; ⭐ Chef niv. ' + sv.player.lvl : '') + '</span></div></div>' : '') +
      (o.texte ? '<p>' + o.texte + '</p>' : '') + '<div class="acc-ask-btns"><button class="acc-btn low" id="q-non"><span class="tx">Annuler</span></button><button class="acc-btn danger" id="q-oui"><span class="ic">🗑️</span><span class="tx">' + o.oui + '</span></button></div></div>';
    root.appendChild(d);
    CG.sfx('uiWarn');
    const close = ok => {
      if (d.classList.contains('out')) return;
      CG.sfx(ok ? 'ok' : 'uiClose');
      d.classList.add('out'); setTimeout(() => d.remove(), 180);
      if (ok) o.ok(); else { const b = box().querySelector('.acc-btn'); if (b) b.focus(); }
    };
    d.querySelector('#q-non').onclick = () => close(false); d.querySelector('#q-oui').onclick = () => close(true);
    d.addEventListener('mousedown', e => { if (e.target === d) close(false); });
    d.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(false); else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') { e.preventDefault(); CG.sfx('click'); (document.activeElement === d.querySelector('#q-non') ? d.querySelector('#q-oui') : d.querySelector('#q-non')).focus(); } });
    d.querySelector('#q-non').focus();
  }

  // ---------- décor animé : le village la nuit, autour du feu ----------
  const stars = [], flies = [], band = [];
  for (let i = 0; i < 90; i++) stars.push([Math.random(), Math.random() * 0.55, Math.random() * 1.6 + 0.4, Math.random() * TAU]);
  for (let i = 0; i < 26; i++) flies.push([Math.random(), Math.random(), Math.random() * TAU, 0.4 + Math.random() * 0.8]);
  const JOBS = ['bucheron', 'mineur', 'cueilleur', 'chasseur', 'garde', 'guerisseur', 'forgeron'];
  function makeBand() {
    band.length = 0;
    const n = 6;
    for (let i = 0; i < n; i++) { const a = Math.PI * (0.08 + 0.84 * i / (n - 1)); band.push({ a, job: JOBS[i % JOBS.length], sex: i % 2 ? 'f' : 'm', look: A8.randomLook(), pose: ['dance', 'cheer', 'dance', 'idle', 'dance', 'cheer'][i], ph: Math.random() * 3 }); }
  }
  function hills(w, h, y, amp, col, seed) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w + 40; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.004 + seed) * amp + Math.sin(x * 0.011 + seed * 2.3) * amp * 0.4);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  function hut(x, y, s, t) {
    ctx.fillStyle = '#4a3a24'; ctx.beginPath(); ctx.moveTo(x - 60 * s, y); ctx.lineTo(x - 52 * s, y - 50 * s); ctx.lineTo(x + 52 * s, y - 50 * s); ctx.lineTo(x + 60 * s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a5a2c'; ctx.beginPath(); ctx.moveTo(x - 74 * s, y - 46 * s); ctx.quadraticCurveTo(x, y - 150 * s, x + 74 * s, y - 46 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,190,90,' + (0.75 + Math.sin(t * 3 + x) * 0.12) + ')'; ctx.beginPath(); ctx.roundRect(x - 12 * s, y - 34 * s, 24 * s, 34 * s, [12 * s, 12 * s, 0, 0]); ctx.fill();
  }
  function tree(x, y, s) { ctx.fillStyle = '#0f170d'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - (46 - i * 9) * s, y - i * 46 * s); ctx.lineTo(x, y - (110 + i * 46) * s); ctx.lineTo(x + (46 - i * 9) * s, y - i * 46 * s); ctx.closePath(); ctx.fill(); } }
  function scene(t) {
    const w = cv.width, h = cv.height, u = Math.min(w, h * 1.5) / 1400, wide = w > h * 1.15;
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#0a1024'); sky.addColorStop(0.45, '#1c2a4a'); sky.addColorStop(0.72, '#3f3a5a'); sky.addColorStop(1, '#6a4a3a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    for (const s of stars) { ctx.globalAlpha = 0.45 + Math.sin(t * 1.6 + s[3]) * 0.4; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s[0] * w, s[1] * h, s[2] * u * 1.4, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    const mx = w * 0.84, my = h * 0.17, mr = 62 * u; let gr = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4); gr.addColorStop(0, 'rgba(255,245,200,0.35)'); gr.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = gr; ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
    ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(210,190,140,0.5)'; ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.2, 0, TAU); ctx.arc(mx + mr * 0.25, my + mr * 0.3, mr * 0.14, 0, TAU); ctx.fill();
    hills(w, h, h * 0.56, 40 * u, '#26304a', 1); hills(w, h, h * 0.63, 34 * u, '#1c2a2e', 4);
    for (let i = 0; i < 16; i++) tree(((i * 0.0713 + 0.02) % 1) * w * 1.1 - 30, h * 0.69 + Math.sin(i * 5.1) * 12 * u, (0.8 + (i % 4) * 0.16) * u * 1.2);
    hills(w, h, h * 0.71, 14 * u, '#17220f', 7);
    const gy = h * 0.74; ctx.fillStyle = '#1d2b12'; ctx.fillRect(0, gy, w, h - gy);
    const fx = wide ? w * 0.68 : w * 0.5, fy = h * 0.83;
    hut(fx - 400 * u, gy + 16 * u, 1.5 * u, t); hut(fx + 420 * u, gy + 24 * u, 1.7 * u, t); hut(fx + 60 * u, gy + 4 * u, 1.15 * u, t);
    // lueur du feu sur le sol
    const fl = 1 + Math.sin(t * 9) * 0.04 + Math.sin(t * 13.7) * 0.03; ctx.save(); ctx.translate(fx, fy); ctx.scale(1, 0.36);
    gr = ctx.createRadialGradient(0, 0, 10, 0, 0, 620 * u * fl); gr.addColorStop(0, 'rgba(255,170,70,0.55)'); gr.addColorStop(0.5, 'rgba(255,120,40,0.16)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 620 * u * fl, 0, TAU); ctx.fill(); ctx.restore();
    const R = 250 * u, list = band.map(b => ({ b, x: fx + Math.cos(b.a) * R * 1.25, y: fy - Math.sin(b.a) * R * 0.34 - 10 * u }));
    const fire = () => {
      ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(fx, fy, 62 * u, 17 * u, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 15 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx - 46 * u, fy + 3 * u); ctx.lineTo(fx + 40 * u, fy - 15 * u); ctx.moveTo(fx + 46 * u, fy + 3 * u); ctx.lineTo(fx - 40 * u, fy - 15 * u); ctx.stroke();
      [['#ff7a2a', 1, 0], ['#ffb040', 0.7, 1.3], ['#fff0a0', 0.4, 2.6]].forEach(c => { const k = c[1] * u, s = Math.sin(t * 8 + c[2]) * 9 * k; ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(fx - 38 * k, fy - 8 * u); ctx.bezierCurveTo(fx - 52 * k, fy - 70 * k, fx - 8 * k + s, fy - 96 * k, fx + s * 1.6, fy - (165 + Math.sin(t * 11 + c[2]) * 18) * k); ctx.bezierCurveTo(fx + 12 * k + s, fy - 96 * k, fx + 52 * k, fy - 70 * k, fx + 38 * k, fy - 8 * u); ctx.closePath(); ctx.fill(); });
      for (let i = 0; i < 12; i++) { const k = (t * 0.32 + i / 12) % 1; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffc060'; ctx.beginPath(); ctx.arc(fx + Math.sin(i * 7.3 + k * 6) * 46 * u * k, fy - 110 * u - k * 300 * u, (3.4 - k * 2.4) * u, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    };
    fire();
    list.sort((a, b) => a.y - b.y).forEach(o => { const b = o.b, d = Math.cos(b.a); A8.goblin(ctx, { x: o.x, y: o.y, scale: 0.92 * u, dir: d > 0.45 ? 'SW' : d < -0.45 ? 'SE' : 'S', t: t + b.ph, pose: b.pose, walk: 0, job: b.job, sex: b.sex, look: b.look, noHat: true }); });
    // le chef, au premier plan
    if (view === 'menu') A8.goblin(ctx, { x: wide ? fx + 300 * u : w * 0.82, y: h * 0.985, scale: 1.75 * u, dir: 'SW', t, pose: 'idle', walk: 0, job: 'chef', chief: true, sex: 'm', look: A8.chiefLook() });
    for (const f of flies) { const x = ((f[0] + Math.sin(t * 0.21 * f[3] + f[2]) * 0.05) % 1) * w, y = (0.5 + f[1] * 0.45 + Math.sin(t * 0.5 * f[3] + f[2] * 2) * 0.03) * h; ctx.globalAlpha = 0.35 + Math.sin(t * 2.4 + f[2]) * 0.35; ctx.fillStyle = '#d8ff8a'; ctx.beginPath(); ctx.arc(x, y, 2.6 * u, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  }
  function preview(t) {
    const c = root.querySelector('#acc-prev'); if (!c) return;
    const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
    const g = c.getContext('2d'), w = c.width, h = c.height, s = Math.min(w / 250, h / 290);
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(w / 2, h * 0.86, 78 * s, 20 * s, 0, 0, TAU); g.fill();
    if (evoCls) look.hue2 = look.hue;
    A8.goblin(g, { x: w / 2, y: h * 0.86, scale: (evoCls ? 1.05 : 1.25) * s, dir: pdir, t, pose: 'idle', walk: 0, job: 'chef', chief: true, sex: 'm', look, cls: evoCls });
  }
  function loop(ms) {
    raf = requestAnimationFrame(loop); if (!Acc.open || (CG.Debug && CG.Debug.open)) return;
    const t = (ms - t0) / 1000, dpr = Math.min(1.5, window.devicePixelRatio || 1), w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    scene(t); if (view === 'creer') preview(t); if (view === 'evo') evoAnim((ms - evoS.t0) / 1000);
  }

  // ---------- l'évolution du chef : la grande scène ----------
  let evoCls = null, evoS = null;
  const EVO = [null, { nom: 'Hobgobelin', col: '255,154,74', sub: 'Plus grand, plus fort, plus rapide.' }, { nom: 'Goblin Lord', col: '255,227,107', sub: 'Le seigneur de tous les gobelins.' }];
  // le personnage de la scène : le chef, ou un compagnon (animal, monstre allié) qui évolue
  function evoPerso(g, o) {
    const gob = evoS && evoS.gob; if (gob) { const neu = o.look === evoS.newLook; return A8.goblin(g, Object.assign({}, o, { job: neu ? gob.job1 : gob.job0, chief: false, sex: gob.sex, look: gob.look, hue: gob.hue, cls: (neu ? gob.cls1 : gob.cls0) || null, evolved: neu ? true : !!gob.nomme0, noHat: !gob.hat, hatJob: gob.hat || undefined, fun: gob.fun, tool: null })); } // un gobelin du clan
    const pet = evoS && evoS.pet; if (!pet) return A8.goblin(g, o);
    const neu = o.look === evoS.newLook, k = (o.scale || 1) * (evoS.petK || 2.6);
    g.save(); g.translate(o.x, o.y); g.scale(k, k); CG.Art.pet(g, Object.assign({}, pet, { x: 0, y: 0, face: 1, moving: false, step: 0, atkAnim: 0, flash: 0, evoT: 0, ko: false, ridden: false, sleep: false, evo: neu ? 1 : 0 }), o.t || 0); g.restore();
  }
  function evoAnim(t) {
    const c = root.querySelector('#acc-evo-cv'); if (!c) return;
    const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
    const g = c.getContext('2d'), w = c.width, h = c.height, u = Math.min(w / 900, h / 780), cx = w / 2, cy = h * 0.52, E = evoS.E || EVO[evoS.stage], col = E.col, T1 = 2.8, T2 = 3.3, INTRO = 5;
    g.clearRect(0, 0, w, h);
    if (evoS.pre) { // on choisit encore son nom : il attend, bien visible, dans une lueur douce
      const gr0 = g.createRadialGradient(cx, cy - 90 * u, 10, cx, cy - 90 * u, 300 * u); gr0.addColorStop(0, 'rgba(255,227,107,' + (0.2 + Math.sin(t * 2) * 0.05) + ')'); gr0.addColorStop(1, 'rgba(255,227,107,0)'); g.fillStyle = gr0; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx, cy, 86 * u, 22 * u, 0, 0, TAU); g.fill();
      evoPerso(g, { x: cx, y: cy, scale: 1.5 * u * evoS.s0, dir: 'S', t, pose: 'idle', walk: 0, job: 'chef', chief: true, sex: 'm', look: evoS.oldLook, cls: evoS.oldCls }); return;
    }
    if (t < INTRO) {
      if (t < 0.9) return; // d'abord, rien du tout
      const fade = Math.min(1, (t - 0.9) / 0.9), ombre = t < 3.3 ? 1 : Math.max(0, 1 - (t - 3.3) / 1.1), sc = 1.5 * u * evoS.s0, W2 = Math.round(380 * u), H2 = Math.round(470 * u);
      const o = evoS.sil || (evoS.sil = document.createElement('canvas')); if (o.width !== W2) { o.width = W2; o.height = H2; } const og = o.getContext('2d'); og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, W2, H2);
      evoPerso(og, { x: W2 / 2, y: H2 - 40 * u, scale: sc, dir: 'S', t, pose: 'idle', walk: 0, job: 'chef', chief: true, sex: 'm', look: evoS.oldLook, cls: evoS.oldCls });
      if (ombre > 0) { og.globalCompositeOperation = 'source-atop'; og.fillStyle = 'rgba(6,6,12,' + ombre + ')'; og.fillRect(0, 0, W2, H2); }
      g.globalAlpha = fade; g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx, cy, 86 * u, 22 * u, 0, 0, TAU); g.fill(); g.drawImage(o, cx - W2 / 2, cy - (H2 - 40 * u)); g.globalAlpha = 1;
      // les « ?! » qui surgissent autour de lui, tant qu'il est dans l'ombre
      [['?!', -150, -250, 1.5, -0.25], ['!!', 140, -280, 1.9, 0.2], ['?!?', 10, -350, 2.35, -0.06], ['?', -190, -150, 2.7, -0.4], ['!', 185, -160, 2.95, 0.35]].forEach(q => { const k = t - q[3]; if (k < 0 || ombre <= 0) return; const pop = Math.min(1, k / 0.18), s = (1.5 - 0.5 * pop) * (1 + Math.sin(t * 9 + q[1]) * 0.04); g.save(); g.translate(cx + q[1] * u, cy + q[2] * u - Math.min(k, 1.2) * 8 * u); g.rotate(q[4]); g.scale(s, s); g.globalAlpha = pop * Math.min(1, ombre * 2); g.font = '900 ' + Math.round(58 * u) + 'px "Arial Black", "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 9 * u; g.strokeStyle = '#1a0c05'; g.strokeText(q[0], 0, 0); g.fillStyle = q[0].includes('?') ? '#ffe36b' : '#ff8a5a'; g.fillText(q[0], 0, 0); g.restore(); if (!evoS['s' + q[3]]) { evoS['s' + q[3]] = true; CG.sfx('no'); } });
      return;
    }
    t -= INTRO; if (!evoS.go) { evoS.go = true; CG.sfx('spell'); }
    const k = Math.min(1, t / T1), after = t > T2, pw = after ? 1 : k * k;
    // halo et rayons qui tournent
    let gr = g.createRadialGradient(cx, cy - 90 * u, 10, cx, cy - 90 * u, (220 + pw * 220) * u); gr.addColorStop(0, 'rgba(' + col + ',' + (0.25 + pw * 0.5) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(cx, cy - 90 * u); g.rotate(t * (after ? 0.35 : 0.6 + k * 2.2));
    for (let i = 0; i < 14; i++) { g.rotate(TAU / 14); g.fillStyle = 'rgba(' + col + ',' + (0.05 + pw * (i % 2 ? 0.2 : 0.11)) + ')'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-26 * u, -(340 + pw * 200) * u); g.lineTo(26 * u, -(340 + pw * 200) * u); g.closePath(); g.fill(); }
    g.restore();
    // cercle runique au sol
    g.save(); g.translate(cx, cy); g.scale(1, 0.32); g.rotate(-t * 1.3); g.strokeStyle = 'rgba(' + col + ',' + (0.3 + pw * 0.6) + ')'; g.lineWidth = 5 * u; g.setLineDash([26 * u, 14 * u]); g.beginPath(); g.arc(0, 0, (150 + Math.sin(t * 4) * 6) * u, 0, TAU); g.stroke(); g.setLineDash([8 * u, 10 * u]); g.lineWidth = 3 * u; g.beginPath(); g.arc(0, 0, 112 * u, 0, TAU); g.stroke(); g.restore();
    // étincelles : aspirées vers lui avant, projetées et retombant après
    for (let i = 0; i < 46; i++) {
      const a = i * 2.399 + t * (after ? 0.4 : 1.6), ph = (t * (after ? 0.35 : 0.5 + k) + i * 0.137) % 1, rad = after ? (60 + ph * 330) * u : (330 * (1 - ph) + 20) * u;
      const x = cx + Math.cos(a) * rad, y = cy - 90 * u + Math.sin(a) * rad * 0.75 - (after ? 0 : ph * 30 * u), s = (after ? 4.5 * (1 - ph) + 1 : 1.5 + ph * 4) * u;
      g.globalAlpha = after ? 1 - ph : 0.25 + ph * 0.75; g.fillStyle = i % 3 ? 'rgb(' + col + ')' : '#fff'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    // le chef : l'ancien qui tremble et s'élève, puis le nouveau qui retombe
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx, cy, 86 * u, 22 * u, 0, 0, TAU); g.fill();
    if (t < T1 + 0.25) { const sh = k * k * 7 * u, lift = k * k * 26 * u; evoPerso(g, { x: cx + (Math.random() - 0.5) * sh, y: cy - lift + (Math.random() - 0.5) * sh * 0.5, scale: 1.5 * u * evoS.s0 * (1 + k * 0.06 * Math.sin(t * 30)), dir: 'S', t, pose: k > 0.55 ? 'cheer' : 'idle', walk: 0, job: 'chef', chief: true, sex: 'm', look: evoS.oldLook, cls: evoS.oldCls }); }
    else { const b = Math.min(1, (t - T1 - 0.25) / 0.7), e = 1 + 0.35 * Math.pow(1 - b, 2) * Math.cos(b * 9); evoPerso(g, { x: cx, y: cy - (1 - b) * (1 - b) * 26 * u, scale: 1.5 * u * evoS.s1 * e, dir: 'S', t, pose: t < T2 + 1.6 ? 'cheer' : 'idle', walk: 0, job: 'chef', chief: true, sex: 'm', look: evoS.newLook, cls: evoS.newCls }); }
    // l'éclair blanc au moment du changement, puis les ondes
    const fl = t < T1 ? Math.max(0, (t - T1 + 0.5) / 0.5) : Math.max(0, 1 - (t - T1) / 0.9); if (fl > 0) { const a = Math.min(1, fl), fg = g.createRadialGradient(cx, cy - 80 * u, 0, cx, cy - 80 * u, Math.max(w, h) * (0.35 + a * 0.75)); fg.addColorStop(0, 'rgba(255,255,255,' + a + ')'); fg.addColorStop(0.55, 'rgba(255,255,255,' + a * 0.9 + ')'); fg.addColorStop(1, 'rgba(255,255,255,' + (a > 0.9 ? a : 0) + ')'); g.fillStyle = fg; g.fillRect(0, 0, w, h); }
    if (after) for (let i = 0; i < 3; i++) { const q = (t - T2 - i * 0.25) / 1.4; if (q <= 0 || q >= 1) continue; g.strokeStyle = 'rgba(' + col + ',' + (1 - q) + ')'; g.lineWidth = (10 * (1 - q) + 1) * u; g.beginPath(); g.ellipse(cx, cy - 60 * u, q * 420 * u, q * 300 * u, 0, 0, TAU); g.stroke(); }
    if (t > T1 && !evoS.boom) { evoS.boom = true; CG.sfx('horn'); }
    if (t > T2 + 0.3 && !evoS.shown) { evoS.shown = true; const B = box(); B.querySelector('#evo-t').textContent = E.nom + ' !'; B.querySelector('#evo-t').classList.add('on'); B.querySelector('#evo-s').textContent = E.sub; B.querySelector('#evo-s').classList.add('on'); B.querySelector('.evo-pre').style.visibility = 'hidden'; }
    if (t > T2 + 1.5 && !evoS.btn) { evoS.btn = true; const b = box().querySelector('#evo-go'); b.style.display = ''; b.focus(); }
  }
  const SKIP = '<button id="evo-skip" style="position:fixed;top:14px;right:16px;z-index:5;font:bold 15px \'Trebuchet MS\',system-ui,sans-serif;padding:9px 16px;border-radius:12px;border:2px solid rgba(255,255,255,.35);background:rgba(20,16,12,.7);color:#f2ecdc;cursor:pointer">⏭ Passer</button>';
  Acc.evolve = function (stage, oldLook, newLook, done) {
    if (!root) build();
    const CLS = [null, 'hob', 'lord'], SC = [1, 1.1, 1.14];
    evoS = { t0: performance.now(), stage, oldLook, newLook, oldCls: CLS[stage - 1], newCls: CLS[stage], s0: SC[stage - 1], s1: SC[stage] };
    view = 'evo'; root.className = 'creer'; root.hidden = false; Acc.open = true; UI.modal = { name: 'evo', closable: false, pauses: true }; CG.keys.clear();
    box().innerHTML = '<div class="acc-evo"><p class="evo-pre">Quelque chose se passe...</p><canvas id="acc-evo-cv"></canvas><div class="evo-gap"></div><h2 class="acc-h evo-t" id="evo-t"></h2><p class="evo-s" id="evo-s"></p>' + big('evo-go', '▶', 'Continuer', '', 'go') + '</div>';
    const b = box().querySelector('#evo-go'); b.style.display = 'none'; b.onclick = () => { Acc.hide(); UI.modal = null; if (done) done(); };
    box().querySelector('.acc-evo').insertAdjacentHTML('beforeend', SKIP); box().querySelector('#evo-skip').onclick = () => b.onclick(); // pressé : on saute la scène
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };
  // la même scène pour un compagnon : sa silhouette, les éclairs, puis sa nouvelle forme
  Acc.evolvePet = function (pet, done) {
    const K = CG.P.KINDS[pet.kind] || {}; Acc.evolve(1, 'avant', 'apres', done);
    evoS.pet = pet; evoS.petK = K.monstre ? 2.1 : 2.8; evoS.s0 = 1; evoS.s1 = 1.12; evoS.E = { nom: K.evo || 'Évolution', col: '255,227,107', sub: pet.name + ' a changé pendant la nuit. ' + (K.special || '') };
  };


  // et pour un gobelin du clan : lui avant, lui après (hobgobelin, chevaucheur de loup, ou sa nouvelle voie)
  Acc.evolveGob = function (gob, E, done) {
    Acc.evolve(1, 'avant', 'apres', done);
    evoS.gob = gob; evoS.s0 = gob.cls1 === 'loup' ? 0.9 : 1; evoS.s1 = gob.cls1 === 'loup' ? 0.82 : 1.1; evoS.E = E;
  };

  // la même page, mais d'abord pour lui donner son nom : une grosse barre en haut, lui au milieu, « Confirmer » en bas.
  // o = { nom, phrase, verifier(n) → message d'erreur ou rien, confirmer(n) → { gob, E, st } }
  Acc.nommerGob = function (gob, o, done) {
    if (!root) build();
    evoS = { t0: performance.now(), stage: 1, oldLook: 'avant', newLook: 'apres', oldCls: null, newCls: null, s0: 1, s1: 1, gob, pre: true, E: { nom: '', col: '255,227,107', sub: '' } };
    view = 'evo'; root.className = 'creer'; root.hidden = false; Acc.open = true; UI.modal = { name: 'evo', closable: false, pauses: true }; CG.keys.clear();
    box().innerHTML = '<div class="acc-evo"><p class="evo-s on" style="margin:1vh 0 0;max-width:760px;text-align:center">' + esc(o.phrase || '') + '</p>'
      + '<input id="evo-nom" type="text" maxlength="14" autocomplete="off" spellcheck="false" style="font:900 clamp(26px,5vh,46px) \'Trebuchet MS\',system-ui,sans-serif;text-align:center;width:min(560px,90%);padding:1.2vh 18px;border-radius:16px;border:4px solid #8a6a2a;background:#fff8e4;color:#2a1c0e;box-shadow:0 6px 0 #5a421a,0 10px 24px rgba(0,0,0,.5);outline:none">'
      + '<p id="evo-err" style="margin:0;min-height:1.4em;font-weight:bold;color:#ffb0a0;text-shadow:0 2px 6px #000"></p><canvas id="acc-evo-cv"></canvas><div class="evo-gap"></div>' + big('evo-ok', '✨', 'Confirmer', 'C\'est son nom officiel', 'go') + '</div>';
    const inp = box().querySelector('#evo-nom'), ok = box().querySelector('#evo-ok'); inp.value = o.nom || '';
    const valider = () => {
      const n = (inp.value || '').trim().replace(/\s+/g, ' '), err = o.verifier ? o.verifier(n) : null; if (err) { box().querySelector('#evo-err').textContent = err; CG.sfx('no'); inp.focus(); return; }
      const k = o.confirmer(n); if (!k) { Acc.hide(); UI.modal = null; if (done) done(); return; }
      if (CG.R) CG.R.evoStats = k.st; Acc.evolveGob(k.gob, k.E, done); evoS.t0 = performance.now() - 4500; // on sait déjà qui c'est : pas de silhouette mystère, la lumière tout de suite
    };
    box().querySelector('.acc-evo').insertAdjacentHTML('beforeend', SKIP); box().querySelector('#evo-skip').onclick = () => { o.confirmer(o.nom); Acc.hide(); UI.modal = null; if (done) done(); }; // il garde son nom, sans la scène
    ok.onclick = valider; inp.onkeydown = ev => { ev.stopPropagation(); if (ev.key === 'Enter') valider(); }; inp.onkeyup = ev => ev.stopPropagation();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); setTimeout(() => { inp.focus(); inp.select(); }, 60);
  };

  // ---------- les écrans ----------
  const big = (id, icon, txt, sub, cls) => '<button class="acc-btn ' + (cls || '') + '" id="' + id + '"><span class="ic">' + icon + '</span><span class="tx">' + txt + (sub ? '<small>' + sub + '</small>' : '') + '</span></button>';
  const box = () => root.querySelector('#acc-ui');
  function focusFirst() { const b = box().querySelector('.acc-btn, input'); if (b && view !== 'creer') b.focus(); }
  function menu() {
    view = 'menu'; root.className = '';
    box().innerHTML = '<div class="acc-menu"><div class="acc-logo"><span>Goblin</span><b>Malin</b></div><p class="acc-tag">Tu es le seul gobelin malin du clan.<br>Fais grandir ton village, et protège-le.</p>' +
      '<div class="acc-btns">' + big('a-jouer', '▶', 'Jouer', '', 'go') + big('a-config', '⚙️', 'Configuration') + '' + big('a-debug', '🛠️', 'Debug') + '</div></div><div class="acc-ver">v' + CG.VERSION + '</div>';
    box().querySelector('#a-jouer').onclick = () => { CG.peekSave() ? parties() : debut(); };
    box().querySelector('#a-config').onclick = config;
    box().querySelector('#a-debug').onclick = () => CG.Debug.show();
    if (box().querySelector('#a-tombes')) box().querySelector('#a-tombes').onclick = () => CG.Tombes.ouvrir();
    focusFirst();
  }
  function parties() {
    const sv = CG.peekSave(); view = 'parties'; root.className = '';
    box().innerHTML = '<div class="acc-menu"><div class="acc-logo small"><span>Goblin</span><b>Malin</b></div><div class="acc-btns">' + big('a-cont', '▶', 'Continuer', esc(sv.name) + ' · jour ' + sv.day + ' · ' + (CG.Diff.LIST[sv.diff] || CG.Diff.LIST.difficile).nom, 'go') + big('a-new', '🌱', 'Nouvelle partie') + big('a-back', '←', 'Retour', '', 'low') + '</div></div>';
    box().querySelector('#a-cont').onclick = () => { UI.close(); CG.start(false); };
    box().querySelector('#a-new').onclick = () => ask({ titre: 'Écraser la partie n° 1 ?', texte: '', oui: 'Oui, écraser', ok: debut });
    box().querySelector('#a-back').onclick = menu; focusFirst();
  }
  function config() {
    view = 'config'; root.className = '';
    const audio = [['music', '🎵', 'Musique', 'Activée', 'Coupée'], ['sfx', '🔊', 'Effets sonores', 'Activés', 'Coupés']];
    const sw = ([k, icon, txt, on, off]) => '<div class="acc-audio">' + big('c-' + k, icon, txt, cfg[k] ? on : off, cfg[k] ? 'on' : 'off') + UI.audioVolume(k) + '</div>';
    box().innerHTML = '<div class="acc-menu acc-config"><h2 class="acc-h">⚙️ Configuration</h2><div class="acc-btns">' + audio.map(sw).join('') + big('c-full', '🖥️', 'Plein écran', document.fullscreenElement ? 'Activé' : 'Coupé', document.fullscreenElement ? 'on' : 'off') + (CG.peekSave() ? big('c-wipe', '🗑️', 'Effacer la partie', '', 'danger') : '') + big('a-back', '←', 'Retour', '', 'low') + '</div></div>';
    for (const [k, , label] of audio) {
      const id = '#c-' + k, button = box().querySelector(id);
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(cfg[k]));
      button.onclick = () => { cfg[k] = !cfg[k]; applyCfg(); CG.sfx('click'); config(); box().querySelector(id).focus(); };
    }
    UI.bindAudioVolumes(box());
    box().querySelector('#c-full').onclick = () => { try { const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); if (p && p.then) p.then(() => { if (view === 'config') config(); }, () => { }); } catch (e) { /* rien */ } };
    const wp = box().querySelector('#c-wipe'); if (wp) wp.onclick = () => ask({ titre: 'Effacer la partie n° 1 ?', texte: 'Elle sera perdue pour de bon : impossible de revenir en arrière.', oui: 'Oui, effacer', ok: () => { CG.wipe(); config(); } });
    box().querySelector('#a-back').onclick = menu; focusFirst();
  }
  // création du chef : toujours avant une nouvelle partie
  const SL = [['Peau', [['hue', 'Teinte'], ['lum', 'Clarté']]], ['Gabarit', [['size', 'Hauteur'], ['head', 'Grosseur de la tête'], ['belly', 'Corpulence']]], ['Nez', [['noseW', 'Largeur'], ['noseH', 'Hauteur']]], ['Joues', [['cheekHue', 'Couleur'], ['cheekSize', 'Grosseur'], ['cheekA', 'Intensité']]]];
  // une nouvelle partie commence par la petite histoire (fondu au noir), puis la création du chef
  function debut() { if (CG.Intro && !CG.Intro.off) CG.Intro.play(() => creer()); else creer(); }
  // dernier choix avant de partir : la difficulté
  function difficulte(n) {
    view = 'diff'; root.className = ''; const L = CG.Diff.LIST;
    box().innerHTML = '<div class="acc-menu acc-diff"><h2 class="acc-h">Quel genre de chef es-tu ?</h2><div class="acc-btns">' + Object.keys(L).map(k => { const ok = CG.Diff.ouvert(k); return '<button class="acc-btn diff-' + k + (ok ? '' : ' verrou') + '" id="d-' + k + '"><span class="ic">' + (ok ? L[k].icon : '🔒') + '</span><span class="tx">' + L[k].nom + '<small>' + esc(ok ? L[k].titre : CG.Diff.verrou(k)) + '</small></span></button>'; }).join('') + big('d-back', '←', 'Retour', '', 'low') + '</div></div>';
    Object.keys(L).forEach(k => { box().querySelector('#d-' + k).onclick = () => { if (!CG.Diff.ouvert(k)) { CG.sfx('no'); return; } CG.Diff.pending = k; UI.close(); CG.start(true, n); }; });
    box().querySelector('#d-back').onclick = () => creer();
  }
  function creer(evo) {
    view = 'creer'; root.className = 'creer'; pdir = 'S'; evoCls = evo ? CG.Evo.chefCls() : null;
    look = Object.assign({}, A8.chiefLook());
    if (!evo && look.stage) look = Object.assign({}, A8.DEF, look.base || {}); // nouvelle partie : on repart du gobelin d'avant les évolutions
    const R = Object.assign({}, A8.RANGES, evo ? null : A8.CREATE), fit = () => { for (const k in A8.CREATE) if (!evo) look[k] = Math.max(R[k][0], Math.min(R[k][1], look[k])); }; fit();
    const sel = (k, map, nm) => '<select data-s="' + k + '">' + Object.keys(map).map(v => '<option value="' + v + '">' + esc(nm ? map[v].nom : map[v]) + '</option>').join('') + '</select>';
    const cards = (k, map) => '<div class="acc-cards" data-c="' + k + '">' + Object.keys(map).map(v => '<button data-v="' + v + '"><canvas data-eye="' + v + '" data-ck="' + k + '" width="132" height="84"></canvas><span>' + esc(map[v].nom || map[v]) + '</span></button>').join('') + '</div>';
    const marks = '<div class="acc-chips acc-marks">' + Object.keys(A8.MARKS).map(v => '<button data-m="' + v + '">' + esc(A8.MARKS[v]) + '</button>').join('') + '</div>';
    const sl = (k, label) => '<label class="acc-sl"><span>' + label + '</span><input type="range" data-k="' + k + '" min="' + R[k][0] + '" max="' + R[k][1] + '" step="' + (R[k][1] - R[k][0] > 5 ? 1 : 0.01) + '" value="' + look[k] + '"></label>';
    const chips = (k, map, nm) => '<div class="acc-chips" data-c="' + k + '">' + Object.keys(map).map(v => '<button data-v="' + v + '">' + esc(nm ? map[v].nom : map[v]) + '</button>').join('') + '</div>';
    const grp = (t, html) => '<section><h3>' + t + '</h3>' + html + '</section>';
    const sexe = '<div class="acc-chips acc-sexe" data-c="sex"><button data-v="m">♂ Gobelin</button><button data-v="f">♀ Gobeline</button></div>'; if (!look.sex) look.sex = 'm';
    box().innerHTML = '<div class="acc-creer"><h2 class="acc-h">' + (evo ? 'Ton nouveau corps de ' + CG.Evo.chefNom() : 'Crée ton chef') + '</h2><div class="acc-cols"><div class="acc-left"><div class="acc-stage"><canvas id="acc-prev"></canvas><button class="acc-rot" id="a-rl" title="Tourner">◀</button><button class="acc-rot r" id="a-rr" title="Tourner">▶</button></div>' +
      sexe + '<label class="acc-name"' + (evo ? ' style="display:none"' : '') + '>Ton nom de chef<input id="a-name" maxlength="14" value="' + esc(nom) + '"></label><button class="acc-mini" id="a-rnd">🎲 Au hasard</button></div>' +
      '<div class="acc-opts"><div class="acc-in">' + SL.slice(0, 3).map(s => grp(s[0], s[1].map(x => sl(x[0], x[1])).join(''))).join('') + grp('Forme du visage', sel('jaw', A8.JAWS, true)) + grp('Dents', sel('teeth', A8.TEETH)) + grp(SL[3][0], SL[3][1].map(x => sl(x[0], x[1])).join('')) + grp('Vêtement', '<div class="acc-hc">' + A8.TUNICS.map(c => '<button data-tc="' + c + '" style="background:' + c + '" title="Couleur du vêtement"></button>').join('') + '</div>') + grp('Coiffure', cards('hair', A8.HAIRS) + '<div class="acc-hc">' + A8.HAIRC.map(c => '<button data-hc="' + c + '" style="background:' + c + '" title="Couleur des cheveux"></button>').join('') + '</div>') + grp('Oreilles', cards('ear', A8.EARS) + sl('earSize', 'Grandeur')) + grp('Yeux', cards('eyes', A8.EYES) + sl('iris', 'Couleur de l\'iris') + sl('eyeSize', 'Grosseur')) + grp('Signes particuliers', marks) + '</div></div></div>' +
      '<div class="acc-foot">' + (evo ? '' : big('a-back', '←', 'Retour', '', 'low')) + big('a-go', '▶', evo ? 'Reprendre l\'aventure' : 'Commencer l\'aventure', '', 'go') + '</div></div>';
    const B = box(), eyeCards = () => B.querySelectorAll('[data-eye]').forEach(c => { const g = c.getContext('2d'); g.clearRect(0, 0, 132, 84); if (c.dataset.ck === 'hair') { A8.goblin(g, { x: 62, y: 152, scale: 0.98, dir: 'SW', t: 0.4, pose: 'idle', walk: 0, job: 'aucun', sex: look.sex, noHat: true, look: Object.assign({}, look, { hair: c.dataset.eye, size: 1, head: 1, marks: null }) }); return; } if (c.dataset.ck === 'ear') { A8.goblin(g, { x: EARX, y: EARY, scale: EARS, dir: 'S', t: 0.4, pose: 'idle', walk: 0, job: 'aucun', sex: look.sex, noHat: true, look: Object.assign({}, look, { ear: c.dataset.eye, size: 1, head: 1, earSize: 1, marks: null }) }); return; } A8.goblin(g, { x: 66, y: 232, scale: 2.05, dir: 'S', t: 0.4, pose: 'idle', walk: 0, job: 'aucun', sex: look.sex, noHat: true, look: Object.assign({}, look, { eyes: c.dataset.eye, size: 1, head: 1, eyeSize: 1, marks: null, noseW: 0.8, noseH: 0.8, hair: 'chauve' }) }); });
    const refresh = () => { if (!look.jaw) look.jaw = 'rond'; if (!A8.HAIRS[look.hair]) look.hair = look.sex === 'f' ? 'couettes' : 'chauve'; if (look.sex !== 'f') { if (A8.HAIR_F.includes(look.hair)) look.hair = 'chauve'; if (look.marks && look.marks.levres) { delete look.marks.levres; if (!Object.keys(look.marks).length) look.marks = null; } } B.querySelectorAll('[data-c="hair"] button').forEach(b => { b.style.display = look.sex !== 'f' && A8.HAIR_F.includes(b.dataset.v) ? 'none' : ''; }); { const lv = B.querySelector('[data-m="levres"]'); if (lv) lv.style.display = look.sex === 'f' ? '' : 'none'; } B.querySelectorAll('[data-hc]').forEach(b => b.classList.toggle('on', look.hairC === b.dataset.hc)); B.querySelectorAll('[data-tc]').forEach(b => b.classList.toggle('on', look.tunic === b.dataset.tc)); ['noseW', 'noseH'].forEach(k => { const mx = look.sex === 'f' ? (R[k][0] + R[k][1]) / 2 : R[k][1], e = B.querySelector('[data-k="' + k + '"]'); if (e) e.max = mx; if (look[k] > mx) look[k] = mx; }); /* gobelines : le nez ne dépasse pas la moitié de la glissière */ eyeCards(); B.querySelectorAll('[data-s]').forEach(e => { e.value = look[e.dataset.s]; }); B.querySelectorAll('[data-m]').forEach(b => b.classList.toggle('on', !!(look.marks && look.marks[b.dataset.m]))); B.querySelectorAll('[data-k]').forEach(e => { e.value = look[e.dataset.k]; }); B.querySelectorAll('[data-c]').forEach(c => c.querySelectorAll('button').forEach(b => b.classList.toggle('on', look[c.dataset.c] === b.dataset.v))); };
    const EARX = -37, EARY = 181, EARS = 1.4; B.querySelectorAll('[data-k]').forEach(e => { e.oninput = () => { look[e.dataset.k] = +e.value; }; e.onchange = () => { CG.sfx('click'); eyeCards(); }; });
    B.querySelectorAll('[data-s]').forEach(e => { e.onchange = () => { look[e.dataset.s] = e.value; }; });
    B.querySelectorAll('[data-tc]').forEach(b => { b.onclick = () => { look.tunic = look.tunic === b.dataset.tc ? undefined : b.dataset.tc; refresh(); }; });
    B.querySelectorAll('[data-hc]').forEach(b => { b.onclick = () => { look.hairC = look.hairC === b.dataset.hc ? undefined : b.dataset.hc; refresh(); }; });
    B.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => { const m = Object.assign({}, look.marks || {}); if (m[b.dataset.m]) delete m[b.dataset.m]; else { A8.MARK_X.forEach(G2 => { if (G2.includes(b.dataset.m)) G2.forEach(k => delete m[k]); }); m[b.dataset.m] = 1; } look.marks = Object.keys(m).length ? m : null; refresh(); }; });
    B.querySelectorAll('[data-c] button').forEach(b => { b.onclick = () => { const k = b.parentNode.dataset.c, v = b.dataset.v; if (k === 'sex' && v !== look.sex) { if (v === 'f' && look.hair === 'chauve') look.hair = 'couettes'; else if (v === 'm' && look.hair === 'couettes') look.hair = 'chauve'; } look[k] = v; refresh(); }; });
    const ORD = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'], turn = d => { pdir = ORD[(ORD.indexOf(pdir) + d + 8) % 8]; };
    B.querySelector('#a-rl').onclick = () => turn(1); B.querySelector('#a-rr').onclick = () => turn(-1);
    const st = B.querySelector('#acc-prev'); st.onpointerdown = e => { drag = e.clientX; st.setPointerCapture(e.pointerId); }; st.onpointermove = e => { if (drag === null) return; const d = e.clientX - drag; if (Math.abs(d) > 34) { turn(d > 0 ? -1 : 1); drag = e.clientX; } }; st.onpointerup = st.onpointercancel = () => { drag = null; };
    B.querySelector('#a-rnd').onclick = () => { const sk = look.skull, sx = look.sex; Object.assign(look, A8.randomLook()); look.skull = sk; look.sex = sx; fit(); refresh(); };
    B.querySelector('#a-name').oninput = e => { nom = e.target.value; };
    if (!evo) B.querySelector('#a-back').onclick = () => (CG.peekSave() ? parties() : menu());
    B.querySelector('#a-go').onclick = () => { if (evo) { look.hue2 = look.hue; A8.setChiefLook(Object.assign({}, look)); Acc.hide(); UI.close(); CG.save(); return; } const n = (B.querySelector('#a-name').value || '').trim() || 'Grizz'; delete look.skull; A8.setChiefLook(Object.assign({}, look)); nom = n; difficulte(n); };
    refresh(); if (!evo) B.querySelector('#a-name').select();
  }

  function build() {
    root = document.createElement('div'); root.id = 'acc'; root.innerHTML = '<canvas id="acc-bg"></canvas><div id="acc-ui"></div>'; document.body.appendChild(root);
    cv = root.querySelector('#acc-bg'); ctx = cv.getContext('2d');
    root.addEventListener('click', e => {
      const b = e.target.closest('#acc-ui button:not(:disabled)');
      if (!b || b.matches('.ld-btn, #a-new, #c-wipe, #c-music, #c-sfx')) return;
      CG.sfx(b.matches('#a-back, #d-back') ? 'uiClose' : b.id === 'a-config' ? 'uiOpen' : 'click');
    }, true);
    root.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape' && view !== 'menu') { const b = box().querySelector('#a-back, #d-back'); if (b) b.click(); return; }
      if (e.target.tagName === 'INPUT') { if (e.key === 'Enter' && e.target.id === 'a-name') box().querySelector('#a-go').click(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const L = [...box().querySelectorAll('.acc-btn')]; if (!L.length) return;
      const i = L.indexOf(document.activeElement), next = i < 0 ? (e.key === 'ArrowDown' ? 0 : L.length - 1) : (i + (e.key === 'ArrowDown' ? 1 : -1) + L.length) % L.length;
      L[next].focus(); if (next !== i) CG.sfx('click'); e.preventDefault();
    });
    root.addEventListener('keyup', e => e.stopPropagation());
  }
  Acc.show = function () { if (!root) build(); makeBand(); root.hidden = false; Acc.open = true; t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); menu(); };
  Acc.hide = function () { if (!root) return; root.hidden = true; Acc.open = false; cancelAnimationFrame(raf); box().innerHTML = ''; };

  // l'ancien petit panneau reste dessous (il bloque le jeu et sert aux robots-testeurs) ; l'accueil le recouvre
  const title0 = UI.title;
  UI.title = function () {
    if (!CG.start.acc) { const s0 = CG.start; CG.start = function () { Acc.hide(); return s0.apply(this, arguments); }; CG.start.acc = true; }
    title0.apply(this, arguments);
    if (UI.modal && UI.modal.name === 'title') Acc.show();
  };
})(window.CG);
