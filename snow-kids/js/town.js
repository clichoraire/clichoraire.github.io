// Snow Kids — mode Aventure : écran de choix du personnage (les Kids alignés sur la neige) et le village,
// où l'on tourne à gauche / à droite pour choisir une maison (télésiège, boutique, maison des Kids, chalet des records).
(function (SK) {
  'use strict';
  const R = SK.Render, TAU = Math.PI * 2;
  const T = SK.Town = {};
  // Faux coureur pour dessiner un personnage hors course
  SK.fakeRacer = function (charId, boardId, state) { return { def: SK.charById(charId) || SK.CHARACTERS[0], board: SK.boardById(boardId), fx: { parachute: 0, fan: 0, invisible: 0, slow: 0, snowman: 0 }, state: state || 'ride', h: 0, vy: 0, input: { steer: 0, down: false, up: false }, curTrick: null, flat: 0, ctrl: 'cpu', player: -1, pose: 'side' }; };

  T.HOUSES = [
    { id: 'lift', name: 'Télésiège', desc: 'Choisir une piste et partir en course.', angle: 0 },
    { id: 'shop', name: 'Boutique de planches', desc: 'Acheter, équiper et améliorer tes planches.', angle: 90 },
    { id: 'kids', name: 'Maison des Kids', desc: 'Changer de personnage.', angle: 180 },
    { id: 'records', name: 'Chalet des records', desc: 'Tes meilleurs temps, tes pistes gagnées et ta tirelire.', angle: 270 },
  ];
  let raf = 0, keyHandler = null, clickHandler = null, canvas = null;
  function stop() { cancelAnimationFrame(raf); raf = 0; if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; } if (clickHandler && canvas) { canvas.removeEventListener('click', clickHandler); clickHandler = null; } }
  T.close = stop;

  // décor commun : ciel, montagnes, neige
  function scene(ctx, W, H, t, horizon) {
    const th = SK.THEMES.rookie, g = ctx.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(W * 0.78, horizon * 0.4, 36, 0, TAU); ctx.fill();
    ctx.fillStyle = th.ground[0]; ctx.fillRect(0, horizon, W, H - horizon);
    R.drawBackdrop(ctx, 'mountains', 0, horizon, W, th, t);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 60; i++) ctx.fillRect(((i * 97.3 + t * 25) % W + W) % W, ((i * 61.7 + t * 45) % H + H) % H, 3, 3);
  }

  // ------------------------------------------------------------------ choix du personnage
  // opts : { canvas, unlocked (Shinobin ?), current, onPick(charId), onBack, info(el) }
  T.select = function (opts) {
    stop(); canvas = opts.canvas; const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    const list = SK.CHARACTERS.filter(c => !c.hidden || opts.unlocked);
    let idx = Math.max(0, list.findIndex(c => c.id === opts.current)), bounce = 0;
    const positions = () => list.map((c, i) => W * (0.5 + (i - (list.length - 1) / 2) * 0.13));
    const update = () => { if (opts.onChange) opts.onChange(list[idx]); };
    keyHandler = e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { idx = (idx + list.length - 1) % list.length; bounce = 1; update(); SK.Audio.sfx('click'); e.preventDefault(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { idx = (idx + 1) % list.length; bounce = 1; update(); SK.Audio.sfx('click'); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'KeyX' || e.code === 'Space') { e.preventDefault(); opts.onPick(list[idx].id); }
      else if (e.code === 'Escape') { if (opts.onBack) opts.onBack(); }
    };
    window.addEventListener('keydown', keyHandler);
    clickHandler = e => {
      const r = canvas.getBoundingClientRect(), mx = (e.clientX - r.left) * W / r.width;
      let best = 0, bd = 1e9; positions().forEach((x, i) => { const d = Math.abs(x - mx); if (d < bd) { bd = d; best = i; } });
      if (best === idx && bd < 70) opts.onPick(list[idx].id); else { idx = best; bounce = 1; update(); SK.Audio.sfx('click'); }
    };
    canvas.addEventListener('click', clickHandler);
    update();
    const frame = () => {
      raf = requestAnimationFrame(frame); const t = performance.now() / 1000, horizon = H * 0.5;
      scene(ctx, W, H, t, horizon);
      // clôture au fond
      ctx.fillStyle = '#90a4ae'; for (let x = 20; x < W; x += 90) { ctx.fillRect(x, horizon - 30, 8, 44); } ctx.fillRect(0, horizon - 22, W, 5); ctx.fillRect(0, horizon - 5, W, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.86, W * 0.46, H * 0.09, 0, 0, TAU); ctx.fill();
      bounce = Math.max(0, bounce - 0.04);
      positions().forEach((x, i) => {
        const c = list[i], sel = i === idx, s = (sel ? 78 : 60) * (W / 1280);
        const y = H * 0.84 + (sel ? -Math.abs(Math.sin(t * 6)) * 14 * bounce - 6 : 0);
        if (sel) { ctx.fillStyle = 'rgba(255,214,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, H * 0.85, s * 1.1, s * 0.3, 0, 0, TAU); ctx.fill(); }
        const fr = SK.fakeRacer(c.id); fr.input.steer = sel ? Math.sin(t * 3) * 0.3 : 0;
        if (!sel) ctx.globalAlpha = 0.85; R.drawRacer(ctx, fr, x, y, s, t, false); ctx.globalAlpha = 1;
        ctx.textAlign = 'center'; ctx.font = (sel ? 'bold 26px' : '18px') + ' sans-serif'; ctx.fillStyle = sel ? '#1565c0' : '#37474f'; ctx.fillText(c.name + (c.hidden ? ' 🥷' : ''), x, H * 0.84 - s * 2.35 - (sel ? 10 : 0));
        if (sel) { ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(x, H * 0.84 - s * 2.3 + 6); ctx.lineTo(x - 12, H * 0.84 - s * 2.3 - 12); ctx.lineTo(x + 12, H * 0.84 - s * 2.3 - 12); ctx.fill(); }
      });
      ctx.textAlign = 'center'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = 'rgba(0,40,90,0.8)'; ctx.fillText('← → pour choisir · Entrée ou X pour confirmer · clic sur un Kid', W / 2, H - 14);
    };
    frame();
  };

  // ------------------------------------------------------------------ le village
  // opts : { canvas, charId, labelEl, onEnter(houseId), onBack }
  T.open = function (opts) {
    stop(); canvas = opts.canvas; const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    let target = T._angle || 0, angle = target, tw = null; // tw : animation de rotation en cours
    const ease = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const rotate = d => { target += d; T._angle = target; tw = { from: angle, to: target, t0: performance.now(), dur: 650 }; label(); SK.Audio.sfx('click'); };
    const houseAt = a => T.HOUSES.find(h => h.angle === ((a % 360) + 360) % 360);
    const label = () => { const h = houseAt(target); if (opts.labelEl) opts.labelEl.innerHTML = `<b>${h.name}</b><span>${h.desc}</span><em>← → se promener · Entrée / X entrer · Échap menu</em>`; };
    keyHandler = e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { rotate(-90); e.preventDefault(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { rotate(90); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'KeyX' || e.code === 'Space') { e.preventDefault(); if (Math.abs(angle - target) < 8) opts.onEnter(houseAt(target).id); }
      else if (e.code === 'Escape') { if (opts.onBack) opts.onBack(); }
    };
    window.addEventListener('keydown', keyHandler);
    let drawn = [];
    clickHandler = e => {
      const r = canvas.getBoundingClientRect(), mx = (e.clientX - r.left) * W / r.width, my = (e.clientY - r.top) * H / r.height;
      const hit = drawn.filter(d => Math.abs(mx - d.x) < d.hw && my > d.y - d.hh && my < d.y + 20).sort((a, b) => b.depth - a.depth)[0];
      if (!hit) return;
      if (hit.h.angle === ((target % 360) + 360) % 360) opts.onEnter(hit.h.id);
      else { const diff = ((hit.h.angle - target) % 360 + 540) % 360 - 180; rotate(diff); }
    };
    canvas.addEventListener('click', clickHandler);
    label();
    const frame = () => {
      raf = requestAnimationFrame(frame); const t = performance.now() / 1000, horizon = H * 0.45;
      if (tw) { const p = Math.min(1, (performance.now() - tw.t0) / tw.dur); angle = tw.from + (tw.to - tw.from) * ease(p); if (p >= 1) tw = null; } else angle = target;
      scene(ctx, W, H, t, horizon);
      // place du village
      ctx.fillStyle = '#dde7f0'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.78, W * 0.42, H * 0.17, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.78, W * 0.3, H * 0.12, 0, 0, TAU); ctx.fill();
      // sapins autour
      for (let i = 0; i < 10; i++) { const a = (i * 36 - angle) * Math.PI / 180, d = Math.cos(a); if (d < -0.3) continue; const sc = 0.5 + 0.5 * d; R.drawProp(ctx, i % 2 ? 'pine' : 'fir', W / 2 + Math.sin(a) * W * 0.62, horizon + 20 + 60 * sc, 9 * sc, i / 10, t, {}); }
      drawn = [];
      const list = T.HOUSES.map(h => { const a = (h.angle - angle) * Math.PI / 180; return { h, a, depth: Math.cos(a) }; }).filter(o => o.depth > -0.35).sort((a, b) => a.depth - b.depth);
      for (const o of list) {
        const sc = 0.45 + 0.55 * Math.max(0, o.depth), x = W / 2 + Math.sin(o.a) * W * 0.38, y = horizon + 40 + 160 * sc;
        const sel = Math.abs(((o.h.angle - target) % 360 + 360) % 360) < 1;
        drawHouse(ctx, o.h.id, x, y, 60 * sc, t, sel);
        drawn.push({ h: o.h, x, y, hw: 150 * sc, hh: 220 * sc, depth: o.depth });
      }
      // le personnage, de dos (dessiné de face : il regarde le joueur)
      const fr = SK.fakeRacer(opts.charId); fr.input.steer = Math.sin(t * 1.5) * 0.15; fr.input.up = false;
      R.drawRacer(ctx, fr, W / 2, H * 0.84, 58, t, false);
    };
    frame();
  };
  function drawHouse(ctx, id, x, y, s, t, sel) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x, y + 4, s * 2.4, s * 0.5, 0, 0, TAU); ctx.fill();
    if (sel) { ctx.fillStyle = 'rgba(255,214,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 4, s * 2.8, s * 0.65, 0, 0, TAU); ctx.fill(); }
    const rect = (xx, yy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(xx, yy, w, h); };
    const tri = (xx, yy, w, h, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(xx, yy - h); ctx.lineTo(xx - w / 2, yy); ctx.lineTo(xx + w / 2, yy); ctx.closePath(); ctx.fill(); };
    if (id === 'lift') {
      rect(x - 1.6 * s, y - 1.8 * s, 3.2 * s, 1.8 * s, '#546e7a'); tri(x, y - 1.8 * s, 3.8 * s, 1.1 * s, '#37474f');
      rect(x - 0.4 * s, y - 1.1 * s, 0.8 * s, 1.1 * s, '#263238');
      ctx.strokeStyle = '#263238'; ctx.lineWidth = Math.max(1, 0.08 * s); ctx.beginPath(); ctx.moveTo(x + 1.4 * s, y - 2.9 * s); ctx.lineTo(x + 4.5 * s, y - 5 * s); ctx.stroke();
      rect(x + 1.3 * s, y - 2.9 * s, 0.2 * s, 1.2 * s, '#263238');
      const p = (t * 0.15) % 1, cx0 = x + 1.4 * s + 3.1 * s * p, cy0 = y - 2.9 * s - 2.1 * s * p; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0, cy0 + 0.6 * s); ctx.stroke(); rect(cx0 - 0.35 * s, cy0 + 0.6 * s, 0.7 * s, 0.12 * s, '#ef5350');
      rect(x - 1.5 * s, y - 2.6 * s, 3 * s, 0.6 * s, '#ef5350'); ctx.fillStyle = '#fff'; ctx.font = 'bold ' + 0.42 * s + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TÉLÉSIÈGE', x, y - 2.15 * s);
    } else if (id === 'shop') {
      rect(x - 1.8 * s, y - 2 * s, 3.6 * s, 2 * s, '#ffe0b2'); tri(x, y - 2 * s, 4.2 * s, 1.2 * s, '#1e88e5');
      rect(x - 1.8 * s, y - 2.1 * s, 3.6 * s, 0.35 * s, '#e53935'); for (let k = 0; k < 6; k++) rect(x - 1.8 * s + k * 0.6 * s, y - 2.1 * s, 0.3 * s, 0.35 * s, '#fff');
      rect(x - 1.5 * s, y - 1.5 * s, 1.2 * s, 1 * s, '#b3e5fc'); rect(x + 0.4 * s, y - 1.2 * s, 0.8 * s, 1.2 * s, '#6d4c41');
      // planches en vitrine
      ['#e53935', '#43a047', '#fdd835'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x - 1.2 * s + k * 0.35 * s, y - 1 * s, 0.12 * s, 0.42 * s, 0.2, 0, TAU); ctx.fill(); });
      rect(x - 1.4 * s, y - 2.8 * s, 2.8 * s, 0.55 * s, '#fff8e1'); ctx.fillStyle = '#e65100'; ctx.font = 'bold ' + 0.42 * s + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BOUTIQUE', x, y - 2.38 * s);
    } else if (id === 'kids') {
      rect(x - 1.7 * s, y - 2 * s, 3.4 * s, 2 * s, '#fff176'); tri(x, y - 2 * s, 4 * s, 1.3 * s, '#e53935');
      rect(x - 0.4 * s, y - 1.2 * s, 0.8 * s, 1.2 * s, '#5d4037'); rect(x - 1.4 * s, y - 1.6 * s, 0.7 * s, 0.7 * s, '#b3e5fc'); rect(x + 0.7 * s, y - 1.6 * s, 0.7 * s, 0.7 * s, '#b3e5fc');
      rect(x + 0.8 * s, y - 3.0 * s, 0.35 * s, 0.9 * s, '#8d6e63');
      const fr = SK.fakeRacer(['nancy', 'jam', 'wendy'][Math.floor(t / 2) % 3]); R.drawRacer(ctx, fr, x - 2.3 * s, y, s * 0.55, t, false);
      rect(x - 1.5 * s, y - 2.85 * s, 3 * s, 0.55 * s, '#fff'); ctx.fillStyle = '#1565c0'; ctx.font = 'bold ' + 0.36 * s + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MAISON DES KIDS', x, y - 2.45 * s);
    } else {
      rect(x - 1.6 * s, y - 1.9 * s, 3.2 * s, 1.9 * s, '#8d6e63'); tri(x, y - 1.9 * s, 3.8 * s, 1.2 * s, '#4e342e');
      rect(x - 0.4 * s, y - 1.1 * s, 0.8 * s, 1.1 * s, '#3e2723'); rect(x - 1.3 * s, y - 1.5 * s, 0.6 * s, 0.6 * s, '#fff59d'); rect(x + 0.7 * s, y - 1.5 * s, 0.6 * s, 0.6 * s, '#fff59d');
      ctx.fillStyle = '#ffd600'; ctx.font = 'bold ' + 1 * s + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🏆', x, y - 2.3 * s);
      rect(x - 1.4 * s, y - 2.75 * s + 0.9 * s, 2.8 * s, 0.5 * s, '#fff'); ctx.fillStyle = '#5d4037'; ctx.font = 'bold ' + 0.38 * s + 'px sans-serif'; ctx.fillText('RECORDS', x, y - 2.75 * s + 1.27 * s);
    }
  }
})(window.SK);
