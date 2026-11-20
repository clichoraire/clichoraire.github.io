// Clan Gobelin — mode debug : un panneau d'outils ouvert depuis l'écran-titre. Premier outil : l'atelier des personnages.
'use strict';
(function (CG) {
  const Dbg = CG.Debug = { tools: [], open: false }, A8 = CG.Art8;
  let root, cur = null, raf = 0;
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  Dbg.show = function (toolId) {
    if (!root) build();
    root.hidden = false; Dbg.open = true; Dbg.select(toolId || (cur && cur.id) || Dbg.tools[0].id);
  };
  Dbg.hide = function () { if (cur && cur.stop) cur.stop(); cancelAnimationFrame(raf); root.hidden = true; Dbg.open = false; };
  Dbg.select = function (id) {
    if (cur && cur.stop) cur.stop(); cancelAnimationFrame(raf);
    cur = Dbg.tools.find(t => t.id === id) || Dbg.tools[0];
    root.querySelectorAll('.dbg-nav button').forEach(b => b.classList.toggle('on', b.dataset.tool === cur.id));
    const main = root.querySelector('.dbg-main'); main.innerHTML = ''; root.querySelector('.dbg-title').textContent = cur.icon + ' ' + cur.nom; root.querySelector('.dbg-sub').textContent = cur.desc || '';
    cur.start(main);
  };
  Dbg.loop = fn => { let last = performance.now(); const tick = now => { if (!Dbg.open) return; fn(Math.min(0.05, (now - last) / 1000)); last = now; raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); };
  function build() {
    root = h('div', '', ''); root.id = 'dbg'; root.hidden = true;
    root.innerHTML = '<aside class="dbg-side"><div class="dbg-logo"><span class="dbg-dot"></span> Goblin Malin<small>mode debug · v' + CG.VERSION + '</small></div><div class="dbg-cap">Outils</div><nav class="dbg-nav"></nav><div class="dbg-foot"><button id="dbg-close">↩ Retour au jeu</button></div></aside><section class="dbg-body"><header class="dbg-head"><div><h1 class="dbg-title"></h1><p class="dbg-sub"></p></div><div class="dbg-hud" id="dbg-hud"></div></header><div class="dbg-main"></div></section>';
    document.body.appendChild(root);
    const nav = root.querySelector('.dbg-nav');
    Dbg.tools.forEach(t => { const b = h('button', '', '<span>' + t.icon + '</span>' + t.nom); b.dataset.tool = t.id; b.onclick = () => Dbg.select(t.id); nav.appendChild(b); });
    nav.appendChild(h('p', 'dbg-soon', 'D\'autres outils viendront s\'ajouter ici.'));
    root.querySelector('#dbg-close').onclick = Dbg.hide;
    // tant que le panneau est ouvert, le clavier lui appartient (le jeu ne voit rien)
    const eat = e => { if (!Dbg.open) return; if (e.target && /INPUT|SELECT/.test(e.target.tagName) && e.target.type !== 'range' && e.target.type !== 'checkbox') return; e.stopImmediatePropagation(); if (e.type === 'keydown' && e.code === 'Escape') return Dbg.hide(); if (cur && cur.key) cur.key(e); };
    window.addEventListener('keydown', eat, true); window.addEventListener('keyup', eat, true);
  }

  // ================= Outil 1 : l'atelier des personnages =================
  const JOBS = ['chef', 'cueilleur', 'chasseur', 'bucheron', 'mineur', 'forgeron', 'arcier', 'tanneur', 'garde', 'eclaireur', 'guerisseur', 'aucun'];
  const JOB_NOM = { chef: 'Chef', aucun: 'Sans métier' };
  const st = { who: 'chef', sex: 'm', dir: 'S', pose: 'idle', speed: 1, zoom: 1, grid: true, vec: true, sheet: false, t: 0, walk: 0, once: null, keys: {}, keyWalk: false, parts: [], shake: 0, look: Object.assign({}, A8.DEF), evolved: false, mode: 'persos', transparent: false };
  let cv, ctx, W = 600, H = 600, ui = {};
  const nomJob = j => JOB_NOM[j] || (CG.JOBS[j] ? CG.JOBS[j].nom : j);
  const isOld = () => st.who.indexOf('jeu:') === 0, isEnemy = () => st.who.indexOf('ennemi:') === 0;

  function mount(main, mode) {
    st.mode = mode; if (mode === 'creer' && (isOld() || isEnemy())) st.who = 'aucun';
    main.innerHTML = '<section class="dbg-stage"><canvas id="dbg-cv"></canvas><div class="dbg-toast" id="dbg-toast">Image PNG exportée !</div><div class="dbg-legend"><span>Flèches / WASD : marcher · glisser : orienter</span><span>Espace / clic : frapper</span></div></section><aside class="dbg-panel"></aside>';
    cv = main.querySelector('#dbg-cv'); ctx = cv.getContext('2d'); const P = main.querySelector('.dbg-panel');
    if (mode === 'creer') buildCreator(P); else {
    // 1. personnage
    let opt = '<optgroup label="Gobelins 8 directions (nouveau dessin)">' + JOBS.map(j => '<option value="' + j + '">' + nomJob(j) + '</option>').join('') + '</optgroup>';
    opt += '<optgroup label="Ancien dessin (gauche / droite seulement)">' + JOBS.map(j => '<option value="jeu:' + j + '">Ancien gobelin — ' + nomJob(j) + '</option>').join('') + '</optgroup>';
    opt += '<optgroup label="Ennemis du jeu (gauche / droite seulement)">' + Object.keys(CG.ENEMIES).filter(k => !CG.ENEMIES[k].struct).map(k => '<option value="ennemi:' + k + '">' + CG.ENEMIES[k].nom + '</option>').join('') + '</optgroup>';
    P.appendChild(block('1. Personnage', '<select id="dbg-who">' + opt + '</select><select id="dbg-cls" style="margin-top:6px"><option value="">Évolution : gobelin</option><option value="hob">Hobgobelin</option><option value="chaman">Chaman</option><option value="assassin">Assassin</option><option value="loup">Chevaucheur de loup</option><option value="lord">Goblin Lord</option></select><div class="dbg-row2"><button data-sex="m" class="dbg-b on">♂ Gobelin</button><button data-sex="f" class="dbg-b">♀ Gobeline</button></div><div class="dbg-slide"><span>Teinte de peau</span><b id="dbg-huev">' + Math.round(st.look.hue) + '</b></div><input id="dbg-hue" type="range" min="70" max="140" step="1" value="' + st.look.hue + '"><div class="dbg-checks"><label><input id="dbg-evo" type="checkbox"' + (st.evolved ? ' checked' : '') + '> Évolué (a reçu un nom)</label><label><input id="dbg-arm" type="checkbox"> Armure de cuir</label><label><input id="dbg-eli" type="checkbox"> Garde d\'élite (casque doré)</label></div><p class="dbg-hint">Le reste de l\'apparence se règle dans l\'outil « Création de personnage ».</p>'));
    // 2. orientation
    const cell = d => d ? '<button class="dbg-b dbg-dir" data-dir="' + d[0] + '">' + d[1] + '</button>' : '<div class="dbg-compass">🧭</div>';
    P.appendChild(block('2. Orientation (8 directions)', '<div class="dbg-grid3 dbg-rose">' + [['NW', '↖ NO'], ['N', '↑ N'], ['NE', '↗ NE'], ['W', '← O'], null, ['E', 'E →'], ['SW', '↙ SO'], ['S', '↓ S'], ['SE', '↘ SE']].map(cell).join('') + '</div>', '<span id="dbg-deg">90°</span>'));
    // 3. animations
    P.appendChild(block('3. Animation et action', '<div class="dbg-grid3">' + Object.keys(A8.POSES).map(k => '<button class="dbg-b dbg-pose" data-pose="' + k + '"><span>' + A8.POSES[k].icon + '</span>' + A8.POSES[k].nom + '</button>').join('') + '</div>'));
    // 4. réglages
    P.appendChild(block('4. Réglages et repères', '<div class="dbg-slide"><span>Vitesse d\'animation</span><b id="dbg-spv">1.00x</b></div><input id="dbg-sp" type="range" min="0.1" max="2" step="0.05" value="1"><div class="dbg-slide"><span>Zoom</span><b id="dbg-zv">1.0x</b></div><input id="dbg-zoom" type="range" min="0.4" max="1.6" step="0.05" value="1"><div class="dbg-checks"><label><input id="dbg-grid" type="checkbox" checked> Sol et grille</label><label><input id="dbg-vec" type="checkbox" checked> Vecteur et hitbox</label><label><input id="dbg-sheet" type="checkbox"> Planche des 8 directions</label></div>'));
    }
    const ex = h('button', 'dbg-export', '📸 Exporter l\'image en PNG transparent'); P.appendChild(ex);
    // écouteurs
    ui.who = P.querySelector('#dbg-who'); ui.who.value = st.who; ui.who.onchange = () => { st.who = ui.who.value; sync(); };
    const evo = P.querySelector('#dbg-evo'); if (evo) evo.onchange = () => { st.evolved = evo.checked; }; const cl = P.querySelector('#dbg-cls'); if (cl) { cl.value = st.cls || ''; cl.onchange = () => { st.cls = cl.value || null; }; }
    [['#dbg-arm', 'armor'], ['#dbg-eli', 'elite']].forEach(c => { const e = P.querySelector(c[0]); if (!e) return; e.checked = !!st[c[1]]; e.onchange = () => { st[c[1]] = e.checked; }; });
    P.querySelectorAll('[data-sex]').forEach(b => b.onclick = () => { st.sex = b.dataset.sex; sync(); });
    P.querySelectorAll('.dbg-dir').forEach(b => b.onclick = () => { st.dir = b.dataset.dir; sync(); });
    P.querySelectorAll('.dbg-pose').forEach(b => b.onclick = () => setPose(b.dataset.pose));
    const bind = (id, fn) => { const e = P.querySelector(id); if (!e) return null; e.oninput = () => fn(e); return e; };
    bind('#dbg-hue', e => { st.look.hue = +e.value; P.querySelector('#dbg-huev').textContent = e.value; });
    bind('#dbg-sp', e => { st.speed = +e.value; P.querySelector('#dbg-spv').textContent = st.speed.toFixed(2) + 'x'; });
    bind('#dbg-zoom', e => { st.zoom = +e.value; P.querySelector('#dbg-zv').textContent = st.zoom.toFixed(1) + 'x'; });
    [['#dbg-grid', 'grid'], ['#dbg-vec', 'vec'], ['#dbg-sheet', 'sheet']].forEach(c => { const e = P.querySelector(c[0]); if (!e) return; e.checked = st[c[1]]; e.onchange = () => { st[c[1]] = e.checked; }; });
    ex.onclick = exportPng;
    // souris : clic = frapper, glisser = orienter
    let down = null;
    cv.onpointerdown = e => { down = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) <= 12) return; const r = cv.getBoundingClientRect(); st.dir = A8.dirFrom(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height * 0.56)); sync(); };
    cv.onpointerup = e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) <= 12) hit(); down = null; };
    window.addEventListener('resize', resize); resize(); sync();
    Dbg.loop(dt => { update(dt); render(); });
  }
  function block(title, html, right) { const d = h('div', 'dbg-block', '<div class="dbg-bt"><h2>' + title + '</h2>' + (right || '') + '</div>' + html); return d; }
  function resize() { if (!cv || !cv.parentElement) return; const r = cv.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); W = r.width; H = r.height; }
  function setPose(p) { if (p === 'attack') return hit(); st.pose = p; st.once = null; sync(); }
  function hit() { if (st.once && st.once.p < 0.65) return; st.once = { p: 0, hit: false }; sync(); }
  function sync() {
    if (!root) return; const P = root.querySelector('.dbg-panel'); if (!P) return; const d = A8.DIRS[st.dir];
    P.querySelectorAll('.dbg-dir').forEach(b => b.classList.toggle('on', b.dataset.dir === st.dir));
    P.querySelectorAll('.dbg-pose').forEach(b => b.classList.toggle('on', st.once ? b.dataset.pose === 'attack' : b.dataset.pose === st.pose));
    P.querySelectorAll('[data-sex]').forEach(b => { b.classList.toggle('on', b.dataset.sex === st.sex); b.disabled = isEnemy() || st.who === 'chef' || st.who === 'jeu:chef'; });
    const dg = P.querySelector('#dbg-deg'); if (dg) dg.textContent = d.deg + '°';
    const hud = document.getElementById('dbg-hud'), etat = st.once ? 'FRAPPE !' : A8.POSES[st.pose].nom.toUpperCase();
    hud.innerHTML = '<span>DIR : ' + d.label + '</span><i>|</i><span class="' + (st.once ? 'hot' : '') + '">ÉTAT : ' + etat + '</span>' + (isOld() || isEnemy() ? '<i>|</i><span class="warn">2 directions seulement</span>' : '');
  }
  function key(e) {
    const walkKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    if (e.type === 'keydown') { if (e.code === 'Space') { e.preventDefault(); return hit(); } if (!walkKeys.includes(e.code)) return; e.preventDefault(); st.keys[e.code] = true; }
    else { if (!st.keys[e.code]) return; delete st.keys[e.code]; }
    const k = st.keys; let dx = 0, dy = 0; if (k.ArrowUp || k.KeyW) dy--; if (k.ArrowDown || k.KeyS) dy++; if (k.ArrowLeft || k.KeyA) dx--; if (k.ArrowRight || k.KeyD) dx++;
    if (dx || dy) { st.dir = A8.dirFrom(dx, dy); if (!st.keyWalk) { st.keyWalk = st.pose; } if (st.pose !== 'walk' && st.pose !== 'carry') st.pose = 'walk'; sync(); }
    else if (st.keyWalk) { st.pose = st.keyWalk === 'walk' || st.keyWalk === 'carry' ? 'idle' : st.keyWalk; st.keyWalk = false; sync(); }
  }
  function puff(x, y, n, col, v0, v1, size) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = v0 + Math.random() * (v1 - v0); st.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, s: size * (0.6 + Math.random() * 0.8), life: 1, dec: 1.8 + Math.random() * 1.2, col }); } }
  function update(dt) {
    const d = dt * st.speed; st.t += d;
    const walking = st.pose === 'walk' || st.pose === 'carry';
    if (walking) { const a = Math.floor(st.walk / Math.PI); st.walk += d * 10.5; if (Math.floor(st.walk / Math.PI) !== a && !st.sheet) puff(W / 2 + (Math.random() - 0.5) * 24, H * 0.68 + 4, 3, 'rgba(210,190,140,0.5)', 15, 35, 4); } else st.walk += d * 2;
    if (st.once) { st.once.p += d / A8.POSES.attack.dur; if (st.once.p >= 0.42 && !st.once.hit) { st.once.hit = true; st.shake = 7; const v = A8.DIRS[st.dir]; if (!st.sheet) puff(W / 2 + v.vx * 75 * st.zoom, H * 0.58 + v.vy * 45 * st.zoom, 12, '#fde047', 60, 160, 5.5); } if (st.once.p >= 1) { st.once = null; sync(); } }
    st.shake = st.shake > 0.1 ? st.shake * Math.pow(0.02, dt) : 0;
    for (let i = st.parts.length - 1; i >= 0; i--) { const p = st.parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.life -= p.dec * dt; if (p.life <= 0) st.parts.splice(i, 1); }
  }
  // dessine le personnage choisi, pieds en (x, y), à l'échelle sc (1 = 140 px de haut environ)
  function drawWho(x, y, sc, dirKey) {
    const d = A8.DIRS[dirKey], pose = st.once ? 'attack' : st.pose;
    if (!isOld() && !isEnemy()) return A8.goblin(ctx, { x, y, scale: sc, dir: dirKey, t: st.t, pose, p: st.once ? st.once.p : undefined, walk: st.walk, job: st.who, chief: st.who === 'chef', sex: st.who === 'chef' ? 'm' : st.sex, cls: st.cls, fun: st.fun, look: st.look, evolved: st.evolved, armor: st.armor, elite: st.elite });
    // les dessins actuels du jeu : seulement gauche / droite
    const face = d.vx < -0.1 ? -1 : 1, moving = pose === 'walk' || pose === 'carry', step = (st.walk / 6.283) % 1, atk = st.once ? Math.max(0, 1 - st.once.p) : 0, k = sc * 3.4;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    try {
      if (isEnemy()) CG.Art.enemy(ctx, { type: st.who.slice(7), x: 0, y: 0, face, seed: 1, moving, step, atkAnim: atk, calm: false, hp: 1 }, st.t);
      else { const job = st.who.slice(4), chief = job === 'chef', map = { chop: 'work', mine: 'work', build: 'work', gather: 'work', pickup: 'work', dance: 'dance', cheer: 'cheer', heal: 'heal' };
        let tool = chief ? 'baton' : null; try { if (!chief) tool = CG.G.toolOf({ job, equip: {}, state: 'work' }); } catch (e) { tool = null; }
        CG.Art.goblinOld(ctx, { x: 0, y: 0, face, t: st.t, moving, step, sex: chief ? 'm' : st.sex, hue: st.look.hue, lum: 44, job: chief ? undefined : job, chief, pose: map[pose] || null, equip: {}, tool, atk, glow: chief ? '#b070ff' : undefined, carry: pose === 'carry' ? 'bois' : undefined }); }
    } catch (e) { ctx.fillStyle = '#ff9a8a'; ctx.font = '4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('dessin indisponible', 0, -10); }
    ctx.restore();
  }
  function floor(cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy);
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 210 * s); g.addColorStop(0, 'rgba(120,200,90,0.20)'); g.addColorStop(1, 'rgba(16,22,19,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 220 * s, 110 * s, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(160,220,140,0.13)'; ctx.lineWidth = 1; const tw = 64 * s, th = 32 * s;
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const x = (i - j) * tw / 2, y = (i + j) * th / 2; if (Math.abs(x) > 210 * s || Math.abs(y) > 105 * s) continue; ctx.beginPath(); ctx.moveTo(x, y - th / 2); ctx.lineTo(x + tw / 2, y); ctx.lineTo(x, y + th / 2); ctx.lineTo(x - tw / 2, y); ctx.closePath(); ctx.stroke(); }
    ctx.restore();
  }
  function gizmo(cx, cy, d, s) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = 'rgba(250,204,21,0.55)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 44 * s, 22 * s, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    const ex = d.vx * 96 * s, ey = d.vy * 48 * s, a = Math.atan2(ey, ex); ctx.strokeStyle = ctx.fillStyle = 'rgba(96,220,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(d.vx * 46 * s, d.vy * 23 * s); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * 10, ey + Math.sin(a) * 10); ctx.lineTo(ex + Math.cos(a + 2.5) * 9, ey + Math.sin(a + 2.5) * 9); ctx.lineTo(ex + Math.cos(a - 2.5) * 9, ey + Math.sin(a - 2.5) * 9); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function render() {
    ctx.clearRect(0, 0, W, H);
    if (st.sheet) { // planche : les 8 directions d'un coup
      const order = ['NW', 'N', 'NE', 'E', 'W', 'SW', 'S', 'SE'], pos = { NW: [0, 0], N: [1, 0], NE: [2, 0], W: [0, 1], E: [2, 1], SW: [0, 2], S: [1, 2], SE: [2, 2] }, cw = W / 3, ch = H / 3, s = Math.min(cw / 200, ch / 235) * st.zoom;
      order.forEach(k => { const x = pos[k][0] * cw + cw / 2, y = pos[k][1] * ch + ch * 0.86; if (!st.transparent && st.grid) { ctx.fillStyle = 'rgba(120,200,90,0.07)'; ctx.beginPath(); ctx.ellipse(x, y, cw * 0.4, ch * 0.16, 0, 0, 6.283); ctx.fill(); } if (!st.transparent && st.vec) gizmo(x, y, A8.DIRS[k], s * 0.55); drawWho(x, y, s, k); if (!st.transparent) { ctx.fillStyle = k === st.dir ? '#ffe36b' : 'rgba(200,240,190,0.6)'; ctx.font = '600 12px ui-monospace, monospace'; ctx.textAlign = 'left'; ctx.fillText(A8.DIRS[k].label, pos[k][0] * cw + 10, pos[k][1] * ch + 18); } });
      if (!st.transparent) { ctx.fillStyle = 'rgba(200,240,190,0.45)'; ctx.font = '600 12px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText('taille du jeu', W / 2, H / 2 - 34); drawWho(W / 2, H / 2 + 26, 0.34, st.dir); }
      return;
    }
    if (st.mode === 'creer') { // un grand portrait qu'on fait tourner, et le tour complet en dessous
      const s = Math.min(W / 300, (H - 150) / 200) * 0.82, cx = W / 2, gy = H - 190, order = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'], cw = W / 8;
      if (!st.transparent) floor(cx, gy, s * 0.9);
      drawWho(cx, gy, s, st.dir);
      if (!st.transparent) order.forEach((k, i) => { const x = cw * i + cw / 2; if (k === st.dir) { ctx.fillStyle = 'rgba(74,222,128,0.12)'; ctx.beginPath(); ctx.roundRect(cw * i + 4, H - 138, cw - 8, 112, 12); ctx.fill(); } drawWho(x, H - 44, Math.min(0.5, cw / 230), k); });
      return;
    }
    const d = A8.DIRS[st.dir], s = Math.min(W, H) / 440 * st.zoom, sx = st.transparent ? 0 : (Math.random() - 0.5) * st.shake * 2, sy = st.transparent ? 0 : (Math.random() - 0.5) * st.shake * 2, cx = W / 2 + sx, gy = H * 0.68 + sy;
    if (!st.transparent && st.grid) floor(cx, gy, s);
    if (!st.transparent && st.vec) gizmo(cx, gy, d, s);
    drawWho(cx, gy, s, st.dir);
    if (!st.transparent) {
      for (const p of st.parts) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(200,240,190,0.45)'; ctx.font = '600 11px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText('taille du jeu', 52, H - 74); drawWho(52, H - 22, 0.34, st.dir);
    }
  }
  function exportPng() {
    st.transparent = true; render(); const url = cv.toDataURL('image/png'); st.transparent = false; render();
    const a = document.createElement('a'); a.download = 'gobelin_' + st.who.replace(':', '-') + '_' + (st.sheet ? 'planche' : st.dir.toLowerCase()) + '_' + (st.once ? 'attack' : st.pose) + '.png'; a.href = url; a.click();
    const t = document.getElementById('dbg-toast'); t.textContent = 'Image PNG exportée !'; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2000);
  }
  // ================= Outil 2 : création de personnage =================
  function buildCreator(P) {
    const L = st.look, R = A8.RANGES, fmt = (k, v) => k === 'hue' || k === 'hue2' || k === 'iris' || k === 'cheekHue' || k === 'lum' ? Math.round(v) + (k === 'lum' ? ' %' : '°') : (+v).toFixed(2);
    const sl = (k, label) => '<div class="dbg-slide"><span>' + label + '</span><b data-v="' + k + '">' + fmt(k, L[k]) + '</b></div><input type="range" data-k="' + k + '" min="' + R[k][0] + '" max="' + R[k][1] + '" step="' + (R[k][1] - R[k][0] > 5 ? 1 : 0.01) + '" value="' + L[k] + '">';
    const sel = (k, map, nom) => '<select data-s="' + k + '">' + Object.keys(map).map(v => '<option value="' + v + '"' + (L[k] === v ? ' selected' : '') + '>' + (nom ? map[v].nom : map[v]) + '</option>').join('') + '</select>';
    P.appendChild(block('1. Base', '<select id="dbg-who">' + JOBS.map(j => '<option value="' + j + '">' + nomJob(j) + '</option>').join('') + '</select><div class="dbg-row2"><button data-sex="m" class="dbg-b">♂ Gobelin</button><button data-sex="f" class="dbg-b">♀ Gobeline</button></div><div class="dbg-checks"><label><input id="dbg-evo" type="checkbox"' + (st.evolved ? ' checked' : '') + '> Évolué (a reçu un nom)</label></div><div class="dbg-row2"><button class="dbg-b dbg-pose" data-pose="idle">🧘 Repos</button><button class="dbg-b dbg-pose" data-pose="walk">🐾 Marche</button></div>'));
    P.appendChild(block('Gabarit', sl('size', 'Hauteur (grand et mince)') + sl('head', 'Grosseur de la tête') + sl('belly', 'Corpulence') + sl('skull', 'Profondeur du crâne')));
    P.appendChild(block('2. Peau', sl('hue', 'Teinte de peau') + sl('hue2', 'Teinte une fois évolué (vert-orange-rouge)') + sl('lum', 'Clarté')));
    P.appendChild(block('3. Nez', sl('noseW', 'Largeur') + sl('noseH', 'Hauteur')));
    P.appendChild(block('4. Dents', sel('teeth', A8.TEETH)));
    P.appendChild(block('5. Joues', sl('cheekHue', 'Couleur') + sl('cheekSize', 'Grosseur') + sl('cheekA', 'Intensité')));
    P.appendChild(block('6. Oreilles', sel('ear', A8.EARS, true) + sl('earSize', 'Grandeur')));
    P.appendChild(block('7. Yeux', sel('eyes', A8.EYES) + sl('iris', 'Couleur de l\'iris') + sl('eyeSize', 'Grosseur')));
    const acts = h('div', 'dbg-acts', '<button class="dbg-b" id="dbg-rnd">🎲 Au hasard</button><button class="dbg-b" id="dbg-def">↺ Par défaut</button><button class="dbg-b" id="dbg-chef">👑 Utiliser pour mon chef</button><button class="dbg-b" id="dbg-copy">📋 Copier le code</button>'); P.appendChild(acts);
    const refresh = () => { P.querySelectorAll('[data-k]').forEach(e => { e.value = L[e.dataset.k]; P.querySelector('[data-v="' + e.dataset.k + '"]').textContent = fmt(e.dataset.k, L[e.dataset.k]); }); P.querySelectorAll('[data-s]').forEach(e => { e.value = L[e.dataset.s]; }); };
    P.querySelectorAll('[data-k]').forEach(e => e.oninput = () => { L[e.dataset.k] = +e.value; P.querySelector('[data-v="' + e.dataset.k + '"]').textContent = fmt(e.dataset.k, +e.value); });
    P.querySelectorAll('[data-s]').forEach(e => e.onchange = () => { L[e.dataset.s] = e.value; });
    const say = m => { const t = document.getElementById('dbg-toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2200); };
    P.querySelector('#dbg-rnd').onclick = () => { Object.assign(L, A8.randomLook()); refresh(); };
    P.querySelector('#dbg-def').onclick = () => { Object.assign(L, A8.DEF); refresh(); };
    P.querySelector('#dbg-chef').onclick = () => { A8.setChiefLook(Object.assign({}, L)); say('👑 Ton chef aura cette apparence dans le jeu.'); };
    P.querySelector('#dbg-copy').onclick = () => { const txt = JSON.stringify(L); try { navigator.clipboard.writeText(txt); say('📋 Code copié.'); } catch (e) { prompt('Code du personnage :', txt); } };
  }
  Dbg.tools.push({ id: 'persos', icon: '🧌', nom: 'Personnages', desc: 'Tous les personnages, dans les 8 directions, avec leurs poses et leurs animations.', start: m => mount(m, 'persos'), key, stop: () => { window.removeEventListener('resize', resize); st.keys = {}; } });
  Dbg.tools.push({ id: 'creer', icon: '🎨', nom: 'Création de personnage', desc: 'Peau, nez, dents, joues, oreilles, yeux : fabrique ton gobelin. Glisse sur le canevas pour le faire tourner.', start: m => mount(m, 'creer'), key, stop: () => { window.removeEventListener('resize', resize); st.keys = {}; } });
  Dbg.state = st;
  // ouverture directe : index.html#debug
  window.addEventListener('load', () => { if (location.hash === '#debug') setTimeout(() => Dbg.show(), 50); });
})(window.CG);
