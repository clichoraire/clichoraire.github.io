// L'aventure : on quitte l'école par le tapis et on traverse les biomes (DS.BIOMES), case par case, avec les flèches.
// Chaque biome est une grille tirée au sort (mais toujours la même pour une partie donnée) : des obstacles, un chemin garanti, des monstres sur le chemin,
// et le boss du biome devant la sortie. Marcher sur un monstre lance un combat de horde (js/duel.js, cfg.horde) : lui, puis parfois d'autres vagues,
// pendant que le biome s'en mêle (incendie, séisme, blizzard…). Gagné : le monstre disparaît. Perdu : on se réveille à l'entrée du biome.
(function () {
  'use strict';
  var DS = window.DS, A = DS.art, SFX = DS.audio;
  var $ = function (id) { return document.getElementById(id); };
  var COLS = 14, ROWS = 8, T = 80; // la grille, et la taille d'une case sur le canevas (1120 × 640)
  var host = null, save = null, cv = null, g = null, world = null, raf = 0, running = false, moving = null, busy = false, t0 = 0, flash = 0, wipe = null;
  var EVENTS = { // ce que chaque biome peut faire pendant un combat : un sort tombé du ciel, ou le sol qui tremble
    foret: [{ spell: 'toxicus', say: '☠️ Des spores empoisonnées !' }, { quake: true, say: '💢 La forêt tremble !' }, { spell: 'tenebra', say: '🌑 La nuit tombe d’un coup !' }],
    marais: [{ spell: 'vortex', say: '🌊 Le marais déborde !' }, { spell: 'toxicus', say: '☠️ Un nuage de gaz !' }, { spell: 'somnus', say: '💤 Des vapeurs de sommeil…' }],
    desert: [{ quake: true, say: '💢 Tremblement de terre !' }, { spell: 'saxum', say: '🪨 Éboulement !' }, { spell: 'lumina', say: '☀️ Le soleil t’aveugle !' }],
    givre: [{ spell: 'blizzardus', say: '🌨️ BLIZZARD !' }, { spell: 'stiria', say: '❄️ Des piques de glace tombent !' }, { spell: 'glacius', say: '🧊 Un vent glacial !' }],
    volcan: [{ spell: 'flammurus', say: '🔥 LE SOL S’EMBRASE ! Aegis !' }, { spell: 'meteorus', say: '☄️ Pluie de lave !' }, { quake: true, say: '💢 Le volcan gronde !' }],
    ombres: [{ spell: 'tenebra', say: '🌑 Les ombres t’avalent !' }, { spell: 'nocturna', say: '🌙 Des boules de nuit !' }, { quake: true, say: '💢 Le royaume tremble !' }, { spell: 'silencio', say: '🤫 Un silence de mort…' }]
  };
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function biome() { return DS.BIOMES[save.adv.biome % DS.BIOMES.length]; }
  function mon(id) { return DS.byId(DS.MONSTERS, id); }
  function level(boss) { return biome().level + save.adv.loop * DS.ADV_LOOP + (boss ? 2 : 0); }
  // La grille du biome : obstacles au hasard, un chemin garanti de gauche à droite, trois monstres sur le chemin, le boss devant la sortie.
  function build() {
    var B = biome(), r = rng(save.adv.seed * 31 + save.adv.biome * 7 + save.adv.loop * 101 + 1), grid = [], y, x, i;
    for (y = 0; y < ROWS; y++) { grid.push([]); for (x = 0; x < COLS; x++) { var v = r(); grid[y].push(v < 0.24 ? 1 : v < 0.36 ? 2 : 0); } } // 1 obstacle · 2 décor · 0 libre
    var y0 = 1 + Math.floor(r() * (ROWS - 2)), py = y0, path = [];
    for (x = 0; x < COLS; x++) {
      grid[py][x] = 0; path.push([x, py]);
      if (x > 0 && x < COLS - 2 && r() < 0.55) { var ny = Math.max(0, Math.min(ROWS - 1, py + (r() < 0.5 ? -1 : 1))); for (var yy = Math.min(py, ny); yy <= Math.max(py, ny); yy++) { grid[yy][x] = 0; path.push([x, yy]); } py = ny; }
    }
    for (y = 0; y < ROWS; y++) { if (y !== py) grid[y][COLS - 2] = 1; if (y !== py) grid[y][COLS - 1] = 1; }
    grid[py][COLS - 1] = 3; grid[y0][0] = 0; grid[y0][1] = 0;
    // Les monstres ne se voient pas : ils surgissent en marchant (comme dans Pokémon), surtout dans les hautes herbes (4). Seuls se montrent le gardien 👑 de la sortie
    // et, s'il existe un passage obligé (une colonne à une seule case libre), le monstre qui le garde.
    for (y = 0; y < ROWS; y++) for (x = 1; x < COLS - 2; x++) if (grid[y][x] === 0 && r() < 0.3) grid[y][x] = 4;
    var mons = [], chokes = [];
    for (x = 3; x < COLS - 4; x++) { var free = []; for (y = 0; y < ROWS; y++) if (grid[y][x] !== 1) free.push(y); if (free.length === 1) chokes.push([x, free[0]]); }
    if (chokes.length) { var ck = chokes[Math.floor(r() * chokes.length)]; grid[ck[1]][ck[0]] = 0; mons.push({ i: 0, id: B.monsters[Math.floor(r() * B.monsters.length)], x: ck[0], y: ck[1], guard: true }); }
    mons.push({ i: 3, id: B.boss, x: COLS - 2, y: py, boss: true });
    grid[y0][0] = 0; grid[y0][1] = 0;
    world = { grid: grid, mons: mons, entry: [0, y0], B: B, key: save.adv.biome + ':' + save.adv.loop };
    if (save.adv.x < 0 || save.adv.key !== world.key) { save.adv.x = 0; save.adv.y = y0; save.adv.key = world.key; save.adv.cleared = {}; save.adv.kills = 0; }
  }
  function cleared(m) { return !!save.adv.cleared[m.i]; }
  function monAt(x, y) { return world.mons.filter(function (m) { return m.x === x && m.y === y && !cleared(m); })[0] || null; }

  // ───────────────────────── Dessin ─────────────────────────
  function tileXY(x, y) { return { x: x * T + T / 2, y: y * T + T / 2 }; }
  function obstacle(kind, cx, cy, r, i) {
    var ph = i * 1.7;
    if (kind === 'tree' || kind === 'pine') {
      g.fillStyle = '#3a2414'; g.fillRect(cx - 5, cy + 4, 10, 26);
      if (kind === 'pine') { g.fillStyle = '#1f4a30'; [30, 16, 2].forEach(function (dy, k) { var w = 26 - k * 5; g.beginPath(); g.moveTo(cx, cy + dy - 64); g.lineTo(cx - w, cy + dy - 20); g.lineTo(cx + w, cy + dy - 20); g.closePath(); g.fill(); }); g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.moveTo(cx, cy - 64); g.lineTo(cx - 10, cy - 44); g.lineTo(cx + 10, cy - 44); g.closePath(); g.fill(); }
      else { g.fillStyle = '#1e4a24'; g.beginPath(); g.arc(cx, cy - 10, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2f6b34'; g.beginPath(); g.arc(cx - 8, cy - 18, 18, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(cx + 10, cy - 8, 16, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(cx - 10, cy - 24, 8, 0, Math.PI * 2); g.fill(); }
    } else if (kind === 'reed') {
      g.fillStyle = '#2a4a5a'; g.beginPath(); g.ellipse(cx, cy + 6, 32, 20, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(120,200,220,0.25)'; g.beginPath(); g.ellipse(cx - 6 + Math.sin(t0 + ph) * 3, cy + 2, 14, 6, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5a7a2a'; g.lineWidth = 3; for (var k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * 9, cy + 10); g.quadraticCurveTo(cx + k * 9 + Math.sin(t0 * 1.5 + k) * 4, cy - 14, cx + k * 11, cy - 30); g.stroke(); }
    } else if (kind === 'rock') {
      g.fillStyle = '#7a6a50'; g.beginPath(); g.moveTo(cx - 30, cy + 20); g.lineTo(cx - 22, cy - 12); g.lineTo(cx - 4, cy - 26); g.lineTo(cx + 18, cy - 16); g.lineTo(cx + 30, cy + 12); g.lineTo(cx + 22, cy + 22); g.closePath(); g.fill();
      g.fillStyle = '#9a8a68'; g.beginPath(); g.moveTo(cx - 22, cy - 12); g.lineTo(cx - 4, cy - 26); g.lineTo(cx + 18, cy - 16); g.lineTo(cx + 2, cy - 4); g.closePath(); g.fill();
    } else if (kind === 'lava') {
      g.fillStyle = '#2a1a1a'; g.beginPath(); g.ellipse(cx, cy + 4, 34, 24, 0, 0, Math.PI * 2); g.fill();
      var gr = g.createRadialGradient(cx, cy + 4, 4, cx, cy + 4, 30); gr.addColorStop(0, '#ffd24a'); gr.addColorStop(0.5, '#ff6a1a'); gr.addColorStop(1, '#8a1a0a'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy + 4, 28, 18, 0, 0, Math.PI * 2); g.fill();
      A.flame(g, cx + Math.sin(t0 * 2 + ph) * 8, cy + 2, 10 + Math.sin(t0 * 5 + ph) * 3, t0, ph);
    } else if (kind === 'tomb') {
      g.fillStyle = '#5a5a6a'; g.beginPath(); g.moveTo(cx - 16, cy + 22); g.lineTo(cx - 16, cy - 12); g.arc(cx, cy - 12, 16, Math.PI, 0); g.lineTo(cx + 16, cy + 22); g.closePath(); g.fill();
      g.fillStyle = '#3a3a4a'; g.fillRect(cx - 22, cy + 18, 44, 8); g.strokeStyle = '#2a2a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy - 18); g.lineTo(cx, cy + 6); g.moveTo(cx - 8, cy - 10); g.lineTo(cx + 8, cy - 10); g.stroke();
    }
  }
  function deco(kind, cx, cy, i) {
    var ph = i * 2.3;
    if (kind === 'flower') { [[-14, 6, '#ff7ab8'], [10, -8, '#ffe066'], [16, 12, '#c58bff']].forEach(function (q) { g.fillStyle = q[2]; g.beginPath(); g.arc(cx + q[0], cy + q[1], 4, 0, Math.PI * 2); g.fill(); }); }
    else if (kind === 'mushroom') { g.fillStyle = '#e8e0d0'; g.fillRect(cx - 3, cy, 6, 12); g.fillStyle = '#c0402a'; g.beginPath(); g.arc(cx, cy, 11, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - 4, cy - 5, 2.5, 0, Math.PI * 2); g.fill(); }
    else if (kind === 'bone') { g.strokeStyle = '#e8e0d0'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 14, cy + 6); g.lineTo(cx + 12, cy - 6); g.stroke(); g.beginPath(); g.moveTo(cx - 6, cy - 10); g.lineTo(cx + 4, cy + 12); g.stroke(); }
    else if (kind === 'snow') { g.fillStyle = 'rgba(255,255,255,0.8)'; [[-16, 4], [8, -10], [14, 14]].forEach(function (q) { g.beginPath(); g.arc(cx + q[0], cy + q[1], 5, 0, Math.PI * 2); g.fill(); }); }
    else if (kind === 'ember') { for (var k = 0; k < 3; k++) { var a = 0.5 + 0.5 * Math.sin(t0 * 4 + ph + k); g.fillStyle = 'rgba(255,' + Math.round(120 + 80 * a) + ',40,' + (0.4 + 0.6 * a) + ')'; g.beginPath(); g.arc(cx + (k - 1) * 14, cy + (k % 2) * 10 - Math.sin(t0 * 2 + k) * 3, 3 + a * 2, 0, Math.PI * 2); g.fill(); } }
    else if (kind === 'skull') { g.fillStyle = '#d8d0c8'; g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill(); g.fillRect(cx - 6, cy + 4, 12, 7); g.fillStyle = '#1b1b26'; g.beginPath(); g.arc(cx - 3.5, cy - 1, 2.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(cx + 3.5, cy - 1, 2.5, 0, Math.PI * 2); g.fill(); }
  }
  // Les hautes herbes (ou cendres, neige profonde, brume…) : là où les monstres surgissent le plus souvent.
  function grass(B, cx, cy, i) {
    var col = B.id === 'givre' ? 'rgba(170,200,235,0.9)' : B.id === 'desert' ? 'rgba(120,95,50,0.8)' : B.id === 'volcan' ? 'rgba(90,60,55,0.95)' : B.id === 'ombres' ? 'rgba(90,70,140,0.8)' : B.id === 'marais' ? 'rgba(70,95,50,0.95)' : 'rgba(40,95,40,0.95)';
    g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round';
    for (var k = 0; k < 6; k++) { var gx = cx - 28 + (k % 3) * 28 + ((i + k) % 3) * 4, gy = cy - 16 + Math.floor(k / 3) * 30, sw = Math.sin(t0 * 2 + i + k) * 3; g.beginPath(); g.moveTo(gx, gy + 12); g.lineTo(gx + sw, gy - 6); g.moveTo(gx + 8, gy + 12); g.lineTo(gx + 10 + sw, gy - 2); g.moveTo(gx - 6, gy + 12); g.lineTo(gx - 9 + sw, gy); g.stroke(); }
  }
  function draw() {
    if (!world) return;
    var B = world.B, x, y, i, W = cv.width, H = cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      var c = world.grid[y][x], q = tileXY(x, y);
      g.fillStyle = B.ground[(x + y) % 2]; g.fillRect(x * T, y * T, T, T);
      if (c === 4) grass(B, q.x, q.y, x * 7 + y * 3);
      g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x * T, y * T + T - 4, T, 4);
      if (c === 3) { // la sortie : une arche de lumière
        g.save(); g.globalCompositeOperation = 'lighter'; A.glowDot(g, q.x, q.y, 40, '#ffe9a0', 0.5 + 0.2 * Math.sin(t0 * 3)); g.restore();
        g.strokeStyle = '#ffe9a0'; g.lineWidth = 6; g.beginPath(); g.moveTo(q.x - 22, q.y + 30); g.lineTo(q.x - 22, q.y - 10); g.arc(q.x, q.y - 10, 22, Math.PI, 0); g.lineTo(q.x + 22, q.y + 30); g.stroke();
      }
    }
    var items = []; // dessinés du haut vers le bas, pour que ce qui est devant recouvre ce qui est derrière
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) { var cc = world.grid[y][x]; if (cc === 1 || cc === 2) items.push({ y: y, x: x, kind: cc }); }
    world.mons.forEach(function (m) { if (!cleared(m)) items.push({ y: m.y, x: m.x, kind: 'mon', m: m }); });
    var px = save.adv.x, py = save.adv.y, pk = 0;
    if (moving) { pk = Math.min(1, (performance.now() - moving.t0) / 180); px = moving.x0 + (moving.x1 - moving.x0) * pk; py = moving.y0 + (moving.y1 - moving.y0) * pk; }
    items.push({ y: py, x: px, kind: 'me' });
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it, k) {
      var q = tileXY(it.x, it.y);
      if (it.kind === 1) obstacle(B.obst, q.x, q.y, T, k);
      else if (it.kind === 2) deco(B.deco, q.x, q.y, k);
      else if (it.kind === 'mon') { var d = mon(it.m.id); A.drawMonster(g, d, q.x, q.y + T * 0.42, (it.m.boss ? T * 1.25 : T * 0.9) * (d.size > 1.2 ? 1 : 1), { t: t0 + k }); if (it.m.boss || it.m.guard) { g.font = '18px sans-serif'; g.textAlign = 'center'; g.fillText(it.m.boss ? '👑' : '🛡️', q.x, q.y - T * 0.75); } }
      else { var me = host.look(), age = host.myAge(); A.drawWizard(g, me, q.x, q.y + T * 0.44, T * 1.15 / DS.AGES[age].h, { face: 'happy', age: age }); } // notre sorcier, toujours de la même taille quel que soit son âge
    });
    if (flash > 0) { g.fillStyle = 'rgba(255,255,255,' + flash + ')'; g.fillRect(0, 0, W, H); }
    if (wipe) { // la rencontre : l'écran tremble, puis des bandes noires le balaient (comme sur la vieille console)
      var wk = Math.min(1, (performance.now() - wipe.t0) / 900), bands = 8, bh = H / bands;
      g.save(); if (wk < 0.3) g.translate(Math.sin(wk * 80) * 8, 0); g.fillStyle = '#000';
      for (var b = 0; b < bands; b++) { var bw = W * Math.max(0, Math.min(1, (wk - 0.25 - b * 0.04) * 2.2)); if (b % 2) g.fillRect(W - bw, b * bh, bw, bh + 1); else g.fillRect(0, b * bh, bw, bh + 1); }
      if (wk < 0.3 && Math.floor(wk * 30) % 2) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 0, W, H); }
      g.restore();
    }
    var sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, A.rgba(B.sky, 0.35)); sky.addColorStop(0.3, 'rgba(0,0,0,0)'); g.fillStyle = sky; g.fillRect(0, 0, W, H); // un peu de ciel au-dessus
  }
  function loop() { if (!running) return; t0 = performance.now() / 1000; if (flash > 0) flash -= 0.03; if (moving && performance.now() - moving.t0 >= 180) moving = null; draw(); raf = requestAnimationFrame(loop); }

  // ───────────────────────── Déplacements et rencontres ─────────────────────────
  function say(html) { $('adv-msg').innerHTML = html; }
  function hud() {
    var B = world.B, k = save.adv.kills || 0, gb = world.mons.filter(function (m) { return !cleared(m); }).length;
    $('adv-biome').textContent = B.name; $('adv-sub').textContent = 'Biome ' + (save.adv.biome + 1) + ' / ' + DS.BIOMES.length + (save.adv.loop ? ' · ' + (save.adv.loop + 1) + 'e tour' : '') + ' · monstres de niveau ' + level(false) + ' · ' + plural(k, 'monstre vaincu', 'monstres vaincus') + ' ici' + (gb ? ' · ' + plural(gb, 'gardien', 'gardiens') : ' · sortie libre');
  }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }
  function move(dx, dy) {
    if (!world || busy || moving) return;
    var x = save.adv.x + dx, y = save.adv.y + dy;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    var c = world.grid[y][x];
    if (c === 1) { SFX.nope(); return; }
    var m = monAt(x, y);
    if (m) return encounter(m);
    moving = { x0: save.adv.x, y0: save.adv.y, x1: x, y1: y, t0: performance.now() };
    save.adv.x = x; save.adv.y = y; host.persist(); SFX.pick();
    if (c === 3) { busy = true; flash = 1; SFX.chime(); setTimeout(nextBiome, 500); return; }
    save.adv.steps = (save.adv.steps || 0) + 1; // une rencontre au hasard : souvent dans les hautes herbes, rarement ailleurs, jamais deux pas de suite
    if (save.adv.steps > 1 && Math.random() < (c === 4 ? 0.28 : 0.05)) { save.adv.steps = 0; encounter(null); }
  }
  function nextBiome() {
    save.adv.biome++; if (save.adv.biome >= DS.BIOMES.length) { save.adv.biome = 0; save.adv.loop++; }
    save.adv.x = -1; busy = false; host.persist(); build(); hud();
    say(save.adv.biome === 0 ? '🏆 Tu as traversé tout le monde ! Il recommence, avec des monstres plus forts de ' + DS.ADV_LOOP + ' niveaux.' : '➡ Te voilà dans <b>' + world.B.name + '</b>. Les monstres y sont de niveau ' + level(false) + '.');
  }
  // On marche sur un monstre : la horde se forme (lui, puis parfois une ou deux vagues de plus), et le combat commence.
  function encounter(m) {
    var B = world.B, pool = B.monsters.map(mon), d = m ? mon(m.id) : pick(pool), waves = [], r = Math.random();
    if (m && m.boss) { waves.push([pool[0], pool[1]]); waves.push([d]); }
    else if (m && m.guard) { waves.push([d]); waves.push([pick(pool), pick(pool)]); }
    else { waves.push(r < 0.3 ? [d, pick(pool)] : [d]); if (r < 0.55) waves.push([pick(pool), pick(pool)]); if (r < 0.2) waves.push([pick(pool), pick(pool), pick(pool)]); }
    busy = true; wipe = { t0: performance.now() }; SFX.horn(); say(m ? '⚔ <b>' + d.name + (d.title ? ' ' + d.title : '') + '</b> te barre la route !' : '⚔ Un monstre surgit des hautes herbes !');
    setTimeout(function () { busy = false; wipe = null; host.startAdventureDuel({ foe: d, level: level(!!(m && m.boss)), horde: { waves: waves, events: EVENTS[B.id] || [], level: level(!!(m && m.boss)) }, m: m }); }, 950);
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  // Retour du combat (js/main.js). Gagné : le monstre disparaît ; perdu : on se réveille à l'entrée du biome.
  function onEnd(win, m) {
    if (!world) build();
    if (win) {
      save.adv.kills = (save.adv.kills || 0) + 1;
      if (m) { save.adv.cleared[m.i] = true; say(m.boss ? '👑 Le gardien du biome est vaincu ! La sortie, à droite, est libre.' : '🛡️ Le gardien du passage est vaincu : la voie est libre.'); }
      else say('✔ Monstres vaincus ! Continue… les hautes herbes en cachent d’autres.');
    } else { save.adv.x = world.entry[0]; save.adv.y = world.entry[1]; say('💫 Tu te réveilles à l’entrée du biome… Prépare mieux ta ceinture !'); }
    host.persist();
  }
  function render() {
    build(); hud(); if (!$('adv-msg').innerHTML) say('Avance avec les <b>flèches</b> (clavier ou boutons). Les monstres se cachent, surtout dans les hautes herbes… Le gardien 👑 garde la sortie, à droite.');
    if (!running) { running = true; raf = requestAnimationFrame(loop); }
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function init(h) {
    host = h; save = h.save; cv = $('adv-canvas'); g = cv.getContext('2d');
    $('adv-pad').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var d = b.dataset.dir; move(d === 'l' ? -1 : d === 'r' ? 1 : 0, d === 'u' ? -1 : d === 'd' ? 1 : 0); }); });
    window.addEventListener('keydown', function (e) {
      if ($('screen-aventure').classList.contains('hidden') || e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.code; if (k === 'ArrowLeft') move(-1, 0); else if (k === 'ArrowRight') move(1, 0); else if (k === 'ArrowUp') move(0, -1); else if (k === 'ArrowDown') move(0, 1); else return;
      e.preventDefault();
    });
  }
  DS.aventure = { init: init, render: render, stop: stop, onEnd: onEnd, move: move, get world() { return world; } };
})();
