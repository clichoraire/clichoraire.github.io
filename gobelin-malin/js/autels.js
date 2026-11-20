// Goblin Malin — piédestaux aux parchemins : une sphère mauve protège le parchemin ; la briser réveille une horde des enfers, vague après vague.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, D = CG.D, T = CG.TILE, Au = CG.Autels = {}, TAU = Math.PI * 2;
  const rand = CG.rand, pick = CG.pick;
  Au.N = 3; Au.RECHARGE = 3; // jours avant qu'un piédestal vidé retrouve un parchemin et sa sphère
  const pos = a => ({ x: a.tx * T + T / 2, y: a.ty * T + T / 2 });
  // un parchemin que le chef ne connaît pas encore (null s'il les a tous)
  G.newScroll = function () { const p = CG.S.player, pool = CG.SCROLL_POOL.filter(i => !p.spells.includes(i) && !p.scrolls[i]); return pool.length ? pick(pool) : null; };

  Au.init = function () {
    const S = CG.S; if (S.autels) { S.autels.forEach(a => { if (a.st === 'horde') a.st = 'scelle'; }); return; }
    const list = [], MW = CG.MW, MH = CG.MH, ok = (x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!W.walkTile(x + dx, y + dy)) return false;
      const d = Math.hypot(x - W.CX, y - W.CY); if (d < 17 || d > 36 || !W.reachable(x, y)) return false;
      if (Math.hypot(x - W.GRAVE.x, y - W.GRAVE.y) < 9) return false;
      if (!Object.values(W.POI).every(p => Math.hypot(x - p.x, y - p.y) > p.r + 4) || !Object.values(W.EXITS).every(e => Math.hypot(x - e.x, y - e.y) > 8)) return false;
      return list.every(a => Math.hypot(x - a.tx, y - a.ty) > 26);
    };
    for (let k = 0; k < 6000 && list.length < Au.N; k++) { const x = 6 + Math.floor(Math.random() * (MW - 12)), y = 6 + Math.floor(Math.random() * (MH - 12)); if (ok(x, y)) list.push({ tx: x, ty: y, st: 'scelle', id: null, day: 0 }); }
    S.autels = list; S.autelsDone = S.autelsDone || 0;
  };
  Au.power = () => CG.S.player.lvl + 2 * (CG.S.autelsDone || 0);

  // ---------- la horde ----------
  // où la horde peut surgir : les cases collées au piédestal, et celles qu'on atteint à pied depuis elles (deux pas au plus). Jamais dans une poche fermée entre les arbres.
  function autour(a) {
    const T = CG.TILE, vu = new Set(), out = []; let front = [];
    for (let dy = -1; dy <= a.h; dy++) for (let dx = -1; dx <= a.w; dx++) { const x = a.tx + dx, y = a.ty + dy; if (dx >= 0 && dx < a.w && dy >= 0 && dy < a.h) continue; if (W.inMap(x, y) && W.walkTile(x, y)) { vu.add(x + ',' + y); front.push([x, y]); } }
    for (let pas = 0; pas < 3 && front.length; pas++) { const suite = []; for (const [x, y] of front) { out.push({ x: x * T + T / 2, y: y * T + T / 2, pas }); if (pas < 2) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (vu.has(k) || !W.inMap(x + dx, y + dy) || !W.walkTile(x + dx, y + dy)) continue; vu.add(k); suite.push([x + dx, y + dy]); } } front = suite; }
    return out;
  }
  function wave(h) {
    const pw = h.pw, w = h.wave, c = pos(h.a); let budget = (7 + pw * 1.3) * (0.6 + 0.4 * w);
    const pool = ['diablotin'].concat(pw >= 3 || w >= 2 ? ['demon'] : []), out = [];
    while (budget > 2 && out.length < 14) { const okT = pool.filter(t => CG.ENEMIES[t].cost <= budget + 0.5); if (!okT.length) break; const t = pick(okT); out.push(t); budget -= CG.ENEMIES[t].cost; }
    if (!out.length) out.push('diablotin');
    const cases = CG.shuffle(autour({ tx: h.a.tx, ty: h.a.ty, w: h.a.w || 1, h: h.a.h || 1 }));
    out.forEach((type, i) => { const s = cases.length ? cases[i % cases.length] : { x: c.x, y: c.y + 30 }; let x = s.x + rand(-9, 9), y = s.y + rand(-9, 9); if (!W.walkPx(x, y)) { x = s.x; y = s.y; } h.q.push({ t: 0.5 + i * 0.45, type: CG.Enfer ? CG.Enfer.melange(type) : type, x, y }); }); // parmi eux : des lanciers et des molosses à deux têtes (enfer.js)
    G.text(c.x, c.y - 96, 'Vague ' + (w + 1) + ' / ' + h.waves, '#e0a0ff', true); if (CG.onScreen(c.x, c.y)) CG.sfx('warning');
  }
  Au.break = function (a) {
    const S = CG.S, R = CG.R, c = pos(a); if (a.st !== 'scelle' || R.horde) return;
    const pw = Au.power(); a.st = 'horde';
    R.horde = { a, pw, wave: 0, waves: 3 + Math.min(3, Math.floor(pw / 4)), q: [], list: [], t: 0, day: S.day };
    for (let i = 0; i < 26; i++) { const an = Math.random() * TAU, v = rand(90, 240); R.parts.push({ x: c.x, y: c.y - 44, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 40, life: rand(0.4, 0.9), max: 0.9, col: pick(['#d9a0ff', '#a060ff', '#ffffff']), size: rand(3, 6) }); }
    R.rings.push({ x: c.x, y: c.y - 10, r: 150, life: 0.6, col: '#c080ff' }); CG.sfx('zap'); CG.sfx('fire');
    G.banner('La sphère vole en éclats !', 'Le sol tremble. Une horde des enfers vient défendre le parchemin...', '#e0a0ff');
    wave(R.horde);
  };
  function step(dt) {
    const S = CG.S, R = CG.R, h = R.horde;
    for (const a of S.autels) if (a.st === 'vide' && S.day >= a.day + Au.RECHARGE) { a.st = 'scelle'; a.id = null; }
    // un piédestal resté « en pleine horde » sans horde (partie quittée pendant le combat) : la sphère se referme, on peut retenter
    for (const a of S.autels) if (a.st === 'horde' && (!h || h.a !== a)) a.st = 'scelle';
    if (!h) return;
    if (S.day !== h.day || R.death) { h.a.st = 'scelle'; R.horde = null; return; } // la nuit est passée : la sphère s'est refermée
    const c = pos(h.a);
    for (const q of h.q) {
      q.t -= dt; if (q.t > 0) continue;
      const e = G.spawnEnemy(q.type, q.x, q.y, { wild: true, mul: 1 + h.pw * 0.03 });
      e.wild = { x: c.x, y: c.y + 20 }; e.aggroR = 480; e.leash = 760; e.horde = true; e.calm = false; h.list.push(e);
      G.puff(q.x, q.y - 16, '#a060ff', 16, 120, 4); R.rings.push({ x: q.x, y: q.y - 4, r: 34, life: 0.35, col: '#c080ff' });
    }
    h.q = h.q.filter(q => q.t > 0);
    if (h.q.length || h.list.some(e => !e.dead && R.enemies.includes(e))) { h.t = 0; return; }
    h.t += dt; if (h.t < 2.2) return; h.t = 0; h.wave++;
    if (h.wave < h.waves) return wave(h);
    h.a.st = 'ouvert'; S.autelsDone = (S.autelsDone || 0) + 1; R.horde = null; CG.sfx('victory');
    G.banner('La horde est vaincue !', 'Le parchemin est à toi : va le prendre sur le piédestal.', '#ffe36b'); R.rings.push({ x: c.x, y: c.y - 10, r: 120, life: 0.6, col: '#ffe36b' });
  }
  Au.take = function (a) {
    const S = CG.S, c = pos(a); if (a.st !== 'ouvert') return;
    const id = G.newScroll(); a.st = 'vide'; a.day = S.day; G.puff(c.x, c.y - 40, '#ffe36b', 18, 110, 4);
    if (id) G.giveScroll(id, c.x, c.y - 20); else { G.dropRes(c.x, c.y, 'or', 80); G.drop(c.x, c.y, { kind: 'potion', n: 1 }); CG.UI.toast('Tu connais déjà tous les sorts : le piédestal te laisse de l\'or.'); }
    G.addXp(20 + S.day * 3);
  };
  const up0 = G.update; G.update = function (dt) { up0(dt); if (!CG.S.autels) Au.init(); step(dt); };

  // ---------- E devant un piédestal ----------
  const near = () => { const S = CG.S, p = S.player; if (!S.autels) return null; for (const a of S.autels) { const c = pos(a); if (Math.hypot(c.x - p.x, c.y + 10 - p.y) < 58) return a; } return null; };
  const find0 = D.findInteract;
  D.findInteract = function () {
    const R = CG.R; if (!(R.ko > 0) && !R.cine && !R.build) { const a = near(); if (a && a.st === 'scelle' && !R.horde) return { type: 'autel', obj: a, label: 'Examiner le piédestal' }; if (a && a.st === 'ouvert') return { type: 'autel', obj: a, label: 'Prendre le parchemin 📜' }; }
    return find0.apply(this, arguments);
  };
  const inter0 = D.interact;
  D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'autel') return inter0.apply(this, arguments);
    const a = it.obj; if (a.st === 'ouvert') return Au.take(a);
    CG.UI.autel(3 + Math.min(3, Math.floor(Au.power() / 4)), () => Au.break(a)); // la fenêtre du piédestal (ui.js)
  };

  // ---------- dessin ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const rr = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  Au.draw = function (g, a, t) {
    const c = pos(a), x = c.x, y = c.y + 12, lit = a.st !== 'vide', fy = y - 62 + Math.sin(t * 2 + a.tx) * 3;
    ell(g, x, y + 2, 30, 9, 'rgba(0,0,0,0.28)');
    rr(g, x - 26, y - 8, 52, 10, '#6f7479'); rr(g, x - 26, y - 8, 52, 3, '#8d9398'); rr(g, x - 20, y - 15, 40, 8, '#7b8186'); rr(g, x - 20, y - 15, 40, 3, '#9aa0a5');
    rr(g, x - 11, y - 40, 22, 26, '#7b8186'); rr(g, x - 11, y - 40, 7, 26, '#959ba0'); rr(g, x + 5, y - 40, 6, 26, '#64696e');
    rr(g, x - 18, y - 46, 36, 7, '#8d9398'); rr(g, x - 18, y - 46, 36, 2.5, '#aab0b5');
    if (lit) { g.fillStyle = a.st === 'horde' ? 'rgba(255,90,70,' + (0.6 + Math.sin(t * 8) * 0.3) + ')' : 'rgba(200,130,255,' + (0.6 + Math.sin(t * 3) * 0.25) + ')'; [[-3, -34], [3, -28], [-2, -22]].forEach(q => g.fillRect(x + q[0] - 2, y + q[1], 4, 3)); }
    if (a.st === 'vide') return;
    // le parchemin qui flotte
    if (a.st === 'ouvert') ell(g, x, fy, 22 + Math.sin(t * 4) * 3, 22 + Math.sin(t * 4) * 3, 'rgba(255,227,107,0.28)');
    g.save(); g.translate(x, fy); g.rotate(Math.sin(t * 1.3) * 0.12 - 0.25);
    rr(g, -11, -6, 22, 12, '#f0dfb4'); rr(g, -11, -6, 22, 3, '#fff3d0'); ell(g, -11, 0, 3.5, 7, '#d9bf86'); ell(g, 11, 0, 3.5, 7, '#d9bf86'); rr(g, -2, -6.5, 4, 13, '#c0392b');
    g.restore();
    if (a.st === 'horde') { g.strokeStyle = 'rgba(255,80,60,0.75)'; g.lineWidth = 2.5; for (let i = 0; i < 2; i++) { g.beginPath(); g.ellipse(x, fy, 20, 8, t * 2.4 + i * 1.57, 0, TAU); g.stroke(); } return; }
    if (a.st !== 'scelle') return;
    // la sphère : une armure transparente mauve
    const R0 = 30 + Math.sin(t * 1.7) * 1.2, gr = g.createRadialGradient(x - 9, fy - 10, 3, x, fy, R0);
    gr.addColorStop(0, 'rgba(235,200,255,0.5)'); gr.addColorStop(0.55, 'rgba(170,90,255,0.26)'); gr.addColorStop(1, 'rgba(120,40,220,0.5)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, fy, R0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(215,160,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.arc(x, fy, R0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(230,190,255,0.35)'; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x, fy, R0, R0 * (0.28 + i * 0.26), t * 0.5 + i * 1.05, 0, TAU); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.arc(x, fy, R0 - 6, 3.5, 4.4); g.stroke();
    ell(g, x, y - 2, 34, 10, 'rgba(170,90,255,' + (0.12 + Math.sin(t * 2.2) * 0.05) + ')');
  };
})(window.CG);
