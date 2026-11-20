// Goblin Malin — la scène du début (bouton temporaire sur l'écran-titre) : une petite histoire, des gobelins pas futés, puis le grand titre.
'use strict';
(function (CG) {
  const A8 = CG.Art8, In = CG.Intro = {}, TAU = Math.PI * 2;
  let root = null, cv = null, raf = 0, t0 = 0, cast = null, fin = false, done = null;
  // le texte du haut : chaque phrase arrive, monte doucement, puis s'efface
  const TXT = [
    [0.8, 5.2, 'Il était une fois, au fond d\'une forêt, un clan de gobelins.'],
    [6.2, 4.6, 'De braves gobelins. Mais pas très futés.'],
    [11.4, 5, 'Travailler ensemble ? Ils essayaient très fort.'],
    [17, 4.8, 'Mais l\'un d\'eux était différent.'],
    [22.4, 4.6, 'Lui, il savait compter jusqu\'à trois.'],
    [27.2, 3.6, '(Parfois même jusqu\'à quatre.)'],
    [31.4, 4.4, 'Alors le clan fit de lui son chef...'],
    [36.2, 3.6, '... parce que vous êtes...']
  ], TITRE = 40, FIN = 43.5;
  // les bruits de l'histoire : chaque son part une seule fois, au moment où l'image le montre
  let sons = {};
  const son = (cle, nom) => { if (sons[cle]) return; sons[cle] = 1; if (CG.sfx) CG.sfx(nom); }, rythme = (cle, t, per, dec, nom) => { const n = Math.floor((t + dec) / per); if (t + dec >= 0) son(cle + n, nom); };
  const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
  function build() {
    root = document.createElement('div'); root.id = 'intro'; root.style.cssText = 'position:fixed;inset:0;z-index:60;background:#000;overflow:hidden;transition:opacity 0.6s';
    root.innerHTML = '<canvas style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas><button id="in-skip" style="position:absolute;right:18px;top:16px;padding:8px 16px;font:700 15px \'Trebuchet MS\',system-ui,sans-serif;color:#fff4d2;background:rgba(40,26,10,0.7);border:2px solid #8a6a2a;border-radius:12px;cursor:pointer">Passer ▸</button><button id="in-end" class="acc-btn go" style="position:absolute;left:50%;bottom:7vh;transform:translateX(-50%);width:auto;min-width:300px;display:none"><span class="ic">▶</span><span class="tx">Créer mon chef</span></button>';
    document.body.appendChild(root); cv = root.querySelector('canvas');
    root.querySelector('#in-skip').onclick = () => In.stop();
    root.querySelector('#in-end').onclick = () => In.stop();
  }
  const now = () => (performance.now() - t0) / 1000;
  In.play = function (cb) {
    if (!root) build(); done = cb || null; fin = false; sons = {}; root.hidden = false; root.style.display = ''; root.querySelector('#in-end').style.display = 'none'; root.querySelector('#in-skip').style.display = '';
    const mk = sex => { const look = A8.randomLook({}); if (look && look.marks) ['lunettes', 'lunettesC', 'monocle'].forEach(k => { delete look.marks[k]; }); return { sex, look }; }; /* pas de lunettes dans l'histoire : au début, les gobelins ne sont pas des intellectuels */ cast = [mk('m'), mk('f'), mk('m'), mk('m')]; t0 = performance.now() + 600; // le noir d'abord, l'histoire ensuite
    root.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { root.style.opacity = '1'; }));
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); if (CG.sfx) CG.sfx('page');
  };
  In.seek = sec => { t0 = performance.now() - sec * 1000; sons = {}; }; // pour les essais
  In.stop = function () { cancelAnimationFrame(raf); if (root) root.style.display = 'none'; if (done) done(); };
  window.addEventListener('keydown', e => { if (root && root.style.display !== 'none' && e.key === 'Escape') { e.stopPropagation(); In.stop(); } }, true);

  function loop() {
    raf = requestAnimationFrame(loop);
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr); if (!w || !h) return; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const g = cv.getContext('2d'), t = now(), u = Math.min(w / 1300, h / 800), gy = h * 0.74, cx = w / 2;
    // ---- le décor : ciel du soir, collines, sapins, sol
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#16224a'); sky.addColorStop(0.5, '#3a3a6a'); sky.addColorStop(0.74, '#c8785a'); sky.addColorStop(0.75, '#3f6a2c'); sky.addColorStop(1, '#2a4a1e'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(w * 0.82, h * 0.2, 44 * u, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,233,176,0.12)'; g.beginPath(); g.arc(w * 0.82, h * 0.2, 90 * u, 0, TAU); g.fill();
    for (let i = 0; i < 40; i++) { const sx = (i * 397 % 1000) / 1000 * w, sy = (i * 211 % 500) / 1000 * h; g.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.3 * Math.sin(t * 2 + i)) + ')'; g.fillRect(sx, sy, 2 * u, 2 * u); }
    g.fillStyle = '#243a4a'; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= w; x += 40) g.lineTo(x, gy - (70 + Math.sin(x / (170 * u)) * 36 + Math.sin(x / (61 * u)) * 12) * u); g.lineTo(w, gy); g.fill();
    const sapin = (x, s, col) => { g.fillStyle = col; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x, gy - (210 - k * 46) * s * u); g.lineTo(x - (38 + k * 20) * s * u, gy - (86 - k * 40) * s * u); g.lineTo(x + (38 + k * 20) * s * u, gy - (86 - k * 40) * s * u); g.fill(); } g.fillStyle = '#3a2412'; g.fillRect(x - 7 * s * u, gy - 12 * s * u, 14 * s * u, 14 * s * u); };
    for (let i = 0; i < 14; i++) sapin((i * 0.083 - 0.03) * w + Math.sin(i * 7) * 30 * u, 0.9 + (i % 3) * 0.22, i % 2 ? '#1c3a2a' : '#17301f');
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 26; i++) g.fillRect(((i * 613) % 1000) / 1000 * w, gy + ((i * 271) % 200) / 200 * (h - gy), 22 * u, 3 * u);
    // ---- les accessoires
    const om = (x, y, rx) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.26, 0, 0, TAU); g.fill(); };
    const arbre = (x, sh) => { om(x, gy + 46 * u, 60 * u); g.save(); g.translate(x + (sh || 0), gy + 46 * u); g.fillStyle = '#5a3a1c'; g.fillRect(-13 * u, -120 * u, 26 * u, 122 * u); g.fillStyle = '#2f7a34'; g.beginPath(); g.arc(0, -170 * u, 74 * u, 0, TAU); g.fill(); g.fillStyle = '#3f9a44'; g.beginPath(); g.arc(-20 * u, -190 * u, 44 * u, 0, TAU); g.fill(); g.restore(); };
    const roche = (x, y) => { om(x, y, 44 * u); g.fillStyle = '#7c7870'; g.beginPath(); g.ellipse(x, y - 22 * u, 42 * u, 30 * u, 0, 0, TAU); g.fill(); g.fillStyle = '#9a968c'; g.beginPath(); g.ellipse(x - 10 * u, y - 32 * u, 22 * u, 12 * u, -0.2, 0, TAU); g.fill(); };
    const gob = (i, x, y, o) => { const c = cast[i]; om(x, y, 34 * u); A8.goblin(g, Object.assign({ x, y, scale: 1.25 * u, dir: 'S', t, pose: 'idle', job: 'aucun', sex: c.sex, look: c.look, noHat: true }, o)); };
    const chef = (x, y, o) => { om(x, y, 38 * u); A8.goblin(g, Object.assign({ x, y, scale: 1.4 * u, dir: 'S', t, pose: 'idle', job: 'chef', chief: true, sex: (A8.chiefLook() || {}).sex || 'm', look: A8.chiefLook() }, o)); };
    const bulle = (x, y, s, a, col) => { if (a <= 0) return; g.save(); g.globalAlpha = Math.min(1, a); g.font = '900 ' + Math.round(40 * u) + 'px "Arial Black","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 8 * u; g.strokeStyle = '#1a0c05'; g.strokeText(s, x, y); g.fillStyle = col || '#ffe36b'; g.fillText(s, x, y); g.restore(); };
    const Y = gy + 70 * u;
    // ---- les scènes
    if (t < TITRE) {
      const A = cx - 380 * u, B = cx, C = cx + 380 * u;
      if (t < 11) { // 1 : chacun son idée de génie
        if (t > 0.6) { rythme('toc', t, 0.95, 0, 'chop'); rythme('clang', t, 0.85, 0.4, 'build'); } if (t > 2.6) { son('bong', 'tombe'); son('bong2', 'hurt'); } if (t > 5.7) son('hein', 'uiWarn'); if (t > 6.9) son('fuit', 'swing');
        arbre(A + 78 * u, Math.sin(t * 17) * (t % 0.95 < 0.15 ? 3 * u : 0)); gob(0, A, Y, { dir: 'E', pose: 'mine' }); if (t % 0.95 < 0.25) bulle(A + 60 * u, Y - 150 * u, 'TOC', 1, '#fff');
        roche(B + 74 * u, Y + 6 * u); gob(1, B, Y, { dir: 'E', pose: 'chop' }); if ((t + 0.4) % 0.85 < 0.25) bulle(B + 74 * u, Y - 90 * u, 'CLANG', 1, '#bfe4ff');
        const tr = C + 150 * u, gx = C + 86 * u; arbre(tr, t > 2.6 && t < 3.05 ? Math.sin(t * 60) * 4 * u : 0);
        if (t < 2.6) gob(2, C - 200 * u + t / 2.6 * 290 * u, Y, { dir: 'E', pose: 'walk' });
        else if (t < 5.6) { gob(2, gx, Y, { dir: 'S', pose: 'sleep' }); if (t < 3.6) bulle(gx, Y - 190 * u, 'BONG !', 1, '#ff8a5a'); }
        else if (t < 6.9) { gob(2, gx, Y, { dir: t < 6.3 ? 'S' : 'E' }); bulle(gx, Y - 190 * u, '?!', (t - 5.7) * 4, '#ffe36b'); }
        else { const k = (t - 6.9) / 2.4, x = gx + 40 * u + k * k * 700 * u; gob(2, x, Y + 26 * u, { dir: 'E', pose: 'walk', walk: t * 22 }); if (k < 0.7) bulle(x - 60 * u, Y - 170 * u, 'AAAH !', 1, '#fff'); } // il contourne l'arbre et détale
      } else if (t < 16.5) { // 2 : la même bûche, poussée des deux bords en même temps
        if (t < 14.9) rythme('pousse', t, 0.63, 0, 'swing'); else son('stop', 'no');
        const stop = t > 14.9, j = stop ? 0 : Math.sin(t * 10) * 7 * u, lx = cx + j, ly = Y - 34 * u;
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(lx, Y + 4 * u, 150 * u, 14 * u, 0, 0, TAU); g.fill();
        g.fillStyle = '#7a5630'; g.fillRect(lx - 130 * u, ly - 22 * u, 260 * u, 46 * u); g.fillStyle = '#946c3e'; g.fillRect(lx - 130 * u, ly - 22 * u, 260 * u, 12 * u); g.strokeStyle = '#5a3d20'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(lx - 70 * u, ly + 4 * u); g.lineTo(lx - 10 * u, ly + 6 * u); g.moveTo(lx + 30 * u, ly - 2 * u); g.lineTo(lx + 80 * u, ly); g.stroke();
        [-1, 1].forEach(sd => { g.fillStyle = '#c9a56b'; g.beginPath(); g.ellipse(lx + sd * 130 * u, ly + 1 * u, 11 * u, 23 * u, 0, 0, TAU); g.fill(); g.strokeStyle = '#8a6234'; g.lineWidth = 2 * u; g.beginPath(); g.ellipse(lx + sd * 130 * u, ly + 1 * u, 5 * u, 11 * u, 0, 0, TAU); g.stroke(); });
        gob(0, lx - 186 * u, Y, { dir: 'E', pose: stop ? 'idle' : 'walk', walk: t * 14 }); gob(1, lx + 186 * u, Y, { dir: 'W', pose: stop ? 'idle' : 'walk', walk: t * 14 + 2 });
        if (!stop) { bulle(cx - 200 * u, Y - 196 * u, 'POUSSE !', Math.sin(t * 5) > 0.2 ? 1 : 0, '#fff'); bulle(cx + 200 * u, Y - 196 * u, 'POUSSE !', Math.sin(t * 5) < -0.2 ? 1 : 0, '#fff'); for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1, k = (t * 2 + i * 0.5) % 1; g.fillStyle = 'rgba(200,190,160,' + 0.5 * (1 - k) + ')'; g.beginPath(); g.arc(cx + sd * (230 + k * 40) * u, Y - k * 20 * u, (6 + k * 10) * u, 0, TAU); g.fill(); } }
        else { bulle(cx - 200 * u, Y - 196 * u, '?', (t - 15) * 4, '#ffe36b'); bulle(cx + 200 * u, Y - 196 * u, '?', (t - 15.3) * 4, '#ffe36b'); }
        gob(2, cx + 470 * u, Y + 20 * u, { pose: 'nap' }); gob(3, cx - 470 * u, Y + 14 * u, { dir: 'E' }); bulle(cx - 470 * u, Y - 176 * u, '...', (t - 12.5) * 2, '#fff');
      } else if (t < 22) { // 3 : il arrive, et tout le monde le regarde
        if (t > 16.9 && t < 20) rythme('pas', t, 0.42, 0, 'click'); if (t > 18) son('quoi', 'uiOpen');
        const k = ease((t - 16.8) / 3.2), x = -120 * u + k * (cx + 120 * u);
        [[0, cx + 250 * u], [1, cx + 390 * u], [2, cx - 280 * u], [3, cx - 420 * u]].forEach((q, i) => { gob(q[0], q[1], Y + (i % 2) * 14 * u, { dir: q[1] > x ? 'W' : 'E' }); bulle(q[1], Y - 190 * u - (i % 2) * 10 * u, '?', (t - 18 - i * 0.4) * 3, '#ffe36b'); });
        chef(x, Y, { dir: 'E', pose: k < 1 ? 'walk' : 'idle' });
      } else if (t < 31) { // 4 : un, deux, trois !
        const n = t < 23.6 ? 0 : t < 24.9 ? 1 : t < 26.2 ? 2 : t < 28.6 ? 3 : 4, wow = t > 26.2;
        if (n) son('compte' + n, n === 3 ? 'victory' : n === 4 ? 'uiWarn' : 'ok');
        [[0, cx + 250 * u], [1, cx + 390 * u], [2, cx - 280 * u], [3, cx - 420 * u]].forEach((q, i) => { gob(q[0], q[1], Y + (i % 2) * 14 * u, { dir: q[1] > cx ? 'W' : 'E', pose: wow ? 'cheer' : 'idle', t: t + i * 0.3 }); if (wow && t < 28.4) bulle(q[1], Y - (196 + (i % 2) * 52) * u, i % 2 ? 'WOW !' : 'OOOH !', (t - 26.2 - i * 0.15) * 4, '#fff'); if (n === 4) bulle(q[1], Y - 196 * u, '?!', (t - 28.8 - i * 0.1) * 4, '#ff8a5a'); });
        chef(cx, Y, { pose: n === 3 || n === 4 ? 'cheer' : 'idle' });
        if (n) { const s = ['', '1...', '2...', '3 !', '4 ?!'][n], k = Math.min(1, (t - [0, 23.6, 24.9, 26.2, 28.6][n]) / 0.2); g.save(); g.translate(cx, Y - 250 * u); g.scale(1.6 - 0.6 * k, 1.6 - 0.6 * k); bulle(0, 0, s, 1, n >= 3 ? '#9be04a' : '#ffe36b'); g.restore(); }
      } else { // 5 : la fête autour du nouveau chef
        const lift = Math.abs(Math.sin(t * 3.2)) * 26 * u; rythme('tam', t, 0.44, 0, Math.floor(t / 0.44) % 4 === 2 ? 'drumHigh' : 'drumLow'); if (t > 31.6) son('fete', 'level');
        for (let i = 0; i < 4; i++) { const a = t * 1.1 + i * TAU / 4, x = cx + Math.cos(a) * 340 * u, y = Y + 20 * u + Math.sin(a) * 58 * u; if (Math.sin(a) < 0) gob(i, x, y, { pose: 'dance', dir: Math.cos(a) > 0 ? 'W' : 'E', t: t + i }); }
        chef(cx, Y - 26 * u - lift, { pose: "cheer" });
        for (let i = 0; i < 4; i++) { const a = t * 1.1 + i * TAU / 4, x = cx + Math.cos(a) * 340 * u, y = Y + 20 * u + Math.sin(a) * 58 * u; if (Math.sin(a) >= 0) gob(i, x, y, { pose: 'dance', dir: Math.cos(a) > 0 ? 'W' : 'E', t: t + i }); }
      }
    }
    // un court fondu au noir à chaque changement de tableau, et au tout début
    [11, 16.5, 31].forEach(c => { const d = Math.abs(t - c); if (d < 0.4) { g.fillStyle = 'rgba(6,8,20,' + (1 - d / 0.4) + ')'; g.fillRect(0, 0, w, h); } });
    if (t < 1.4) { g.fillStyle = 'rgba(0,0,0,' + Math.min(1, 1 - (t - 0.2) / 1.2) + ')'; g.fillRect(0, 0, w, h); }
    // ---- le texte du haut
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const L of TXT) { const k = t - L[0]; if (k < 0 || k > L[1]) continue; const a = Math.min(1, k / 0.7, (L[1] - k) / 1.3); g.globalAlpha = a; g.font = 'italic bold ' + Math.round(38 * u) + 'px Georgia, serif'; const y = h * 0.13 - k * 7 * u; g.lineJoin = 'round'; g.lineWidth = 8 * u; g.strokeStyle = 'rgba(10,8,20,0.75)'; g.strokeText(L[2], cx, y); g.fillStyle = '#fbf0d4'; g.fillText(L[2], cx, y); g.globalAlpha = 1; }
    // ---- le grand titre
    if (t >= TITRE - 0.6) {
      const k = Math.min(1, (t - TITRE + 0.6) / 0.6); g.fillStyle = 'rgba(8,10,24,' + 0.82 * k + ')'; g.fillRect(0, 0, w, h);
      if (t >= TITRE) {
        const q = t - TITRE, ty = h * 0.36; g.save(); g.translate(cx, ty); g.rotate(q * 0.25);
        for (let i = 0; i < 16; i++) { g.rotate(TAU / 16); g.fillStyle = 'rgba(255,216,74,' + (i % 2 ? 0.16 : 0.08) * Math.min(1, q) + ')'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-40 * u, -900 * u); g.lineTo(40 * u, -900 * u); g.fill(); } g.restore();
        const mot = (s, y, size, col, sh1, sh2, d) => { const kk = Math.min(1, Math.max(0, (q - d) / 0.28)); if (kk <= 0) return; const sc = 3 - 2 * kk + (kk >= 1 ? Math.sin(Math.min(1, (q - d - 0.28) / 0.25) * Math.PI) * 0.08 : 0); g.save(); g.translate(cx, y); g.rotate(-0.05); g.scale(sc, sc); g.globalAlpha = kk; g.font = '900 ' + Math.round(size * u) + 'px "Arial Black","Trebuchet MS",system-ui,sans-serif'; g.textAlign = 'center'; g.fillStyle = sh2; g.fillText(s, 0, 16 * u); g.fillStyle = sh1; g.fillText(s, 0, 8 * u); g.fillStyle = col; g.fillText(s, 0, 0); g.restore(); if (kk > 0 && !mot['s' + d]) { mot['s' + d] = true; } };
        mot('LE GOBLIN', ty - 60 * u, 120, '#8ee04a', '#2f6a1a', '#17300c', 0); mot('MALIN', ty + 78 * u, 158, '#ffd84a', '#b8741a', '#5a340c', 0.55);
        if (!fin && q > 0) { fin = 1; CG.sfx && CG.sfx('discovery'); } if (fin === 1 && q > 0.55) { fin = 2; CG.sfx && CG.sfx('level'); }
        if (q > 1) { const b = Math.abs(Math.sin(q * 3)) * 18 * u; chef(cx, h * 0.86 - b, { pose: 'cheer' }); }
        if (q > FIN - TITRE) { root.querySelector('#in-end').style.display = ''; root.querySelector('#in-skip').style.display = 'none'; }
      }
    }
  }
})(window.CG);
