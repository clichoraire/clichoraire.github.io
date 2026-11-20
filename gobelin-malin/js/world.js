// Clan Gobelin — monde : génération de la carte, terrain en cache, recherche de chemin.
'use strict';
(function (CG) {
  const T = CG.TILE;
  const GRASS = 0, TREE = 1, WATER = 2, ROCK = 3, BUILD = 4, PATH = 5, CLEAR = 6, FLOOR = 7, WALL = 8;
  const GATE = 9, MOAT = 10, BRIDGE = 11, FLAT = 12;
  const W = CG.W = { GRASS, TREE, WATER, ROCK, BUILD, PATH, CLEAR, FLOOR, WALL, GATE, MOAT, BRIDGE, FLAT };
  W.CX = 47; W.CY = 36; // centre du village (le feu)
  W.POI = {
    baies: { x: 68, y: 17, r: 5 }, chasse: { x: 21, y: 55, r: 6 }, mine: { x: 19, y: 15, r: 5 },
    etang: { x: 72, y: 50, r: 4 }, ruines: { x: 83, y: 62, r: 6 }, portail: { x: 45, y: 6, r: 4 },
    cache: { x: 8, y: 64, r: 3 }, nid: { x: 88, y: 7, r: 4 }, ile: { x: 87, y: 40, r: 3 }, clairiere: { x: 30, y: 30, r: 3 }
  };
  W.GRAVE = { x: 12, y: 46, r: 4 };
  W.EXITS = { ouest: { x: 1, y: 35 }, est: { x: 94, y: 33 }, sud: { x: 49, y: 70 }, nord: { x: 45, y: 5 } };

  const idx = (x, y) => y * CG.MW + x;
  W.idx = idx;
  W.inMap = (x, y) => x >= 0 && y >= 0 && x < CG.MW && y < CG.MH;
  W.walkTile = (x, y) => {
    if (x < 0 || y < 0 || x >= CG.MW || y >= CG.MH) return false;
    const t = W.tile[idx(x, y)]; if (W.surEau && (t === WATER || t === MOAT)) return true;
    // W.foe = vrai pendant le tour des ennemis : ils sont arrêtés par les portails mais pataugent dans les douves
    return t === GRASS || t === PATH || t === CLEAR || t === FLOOR || t === BRIDGE || t === FLAT || (t === GATE ? !W.foe : t === MOAT && !!W.foe);
  };
  W.walkPx = (px, py) => W.walkTile(Math.floor(px / T), Math.floor(py / T));
  W.center = (tx, ty) => ({ x: tx * T + T / 2, y: ty * T + T / 2 });
  // petit hachage stable par tuile (variantes d'arbres, décalages)
  W.hash = (x, y) => { let h = (x * 374761393 + y * 668265263 + W.seed * 144665) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function makeNoise(rng, n) {
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i++) g[i] = rng();
    return function (x, y) {
      x = ((x % n) + n) % n; y = ((y % n) + n) % n;
      const x0 = Math.floor(x), y0 = Math.floor(y), x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
      let fx = x - x0, fy = y - y0; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      return CG.lerp(CG.lerp(g[y0 * n + x0], g[y0 * n + x1], fx), CG.lerp(g[y1 * n + x0], g[y1 * n + x1], fx), fy);
    };
  }

  W.generate = function (seed) {
    W.seed = seed;
    const rng = CG.makeRng(seed), noise = makeNoise(rng, 32);
    W.noise = noise;
    const tile = W.tile = new Uint8Array(CG.MW * CG.MH);
    const cx = W.CX, cy = W.CY;
    for (let y = 0; y < CG.MH; y++) for (let x = 0; x < CG.MW; x++) {
      const d = Math.hypot((x - cx) * 0.9, (y - cy) * 1.12);
      const ang = Math.atan2(y - cy, x - cx);
      const clearR = 8.6 + 1.6 * noise(ang * 2.2 + 9, 3.3);
      let p;
      if (d < clearR) p = 0;
      else if (x < 2 || y < 2 || x >= CG.MW - 2 || y >= CG.MH - 2) p = 0.96;
      else if (d < clearR + 6) p = 0.84;
      else { const dens = noise(x / 8, y / 8) * 0.7 + noise(x / 3 + 40, y / 3 + 40) * 0.3; p = dens > 0.56 ? 0.86 : dens > 0.42 ? 0.3 : 0.05; }
      tile[idx(x, y)] = rng() < p ? TREE : GRASS;
    }
    const set = (x, y, t) => { if (x >= 1 && y >= 1 && x < CG.MW - 1 && y < CG.MH - 1) tile[idx(x, y)] = t; };
    const glade = (g, t) => { for (let y = -g.r - 1; y <= g.r + 1; y++) for (let x = -g.r - 1; x <= g.r + 1; x++) if (Math.hypot(x, y) < g.r - 0.6 + rng() * 1.2) set(g.x + x, g.y + y, t === undefined ? GRASS : t); };
    Object.values(W.POI).forEach(g => glade(g));
    // sentiers sinueux
    const carve = (a, b, wob) => {
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2), ph = rng() * 6;
      const px = -(b.y - a.y), py = b.x - a.x, pl = Math.hypot(px, py) || 1;
      for (let i = 0; i <= n; i++) {
        const t = i / n, s = Math.sin(t * Math.PI) * Math.sin(t * 7 + ph) * (wob === undefined ? 2.2 : wob);
        const x = Math.round(a.x + (b.x - a.x) * t + px / pl * s), y = Math.round(a.y + (b.y - a.y) * t + py / pl * s);
        if (x < 0 || y < 0 || x >= CG.MW || y >= CG.MH) continue;
        tile[idx(x, y)] = PATH; if (x + 1 < CG.MW) tile[idx(x + 1, y)] = PATH; if (y + 1 < CG.MH) { tile[idx(x, y + 1)] = PATH; if (x + 1 < CG.MW) tile[idx(x + 1, y + 1)] = PATH; }
      }
    };
    const C = { x: cx, y: cy }, P = W.POI;
    carve(C, W.EXITS.ouest); carve(C, W.EXITS.est); carve(C, W.EXITS.sud); carve(C, P.portail);
    carve({ x: 58, y: 34 }, P.baies); carve({ x: 36, y: 36 }, P.mine); carve({ x: 34, y: 37 }, P.chasse);
    carve({ x: 50, y: 48 }, P.etang); carve(P.etang, P.ruines); carve(P.chasse, P.cache, 1.2); carve(P.baies, P.nid, 1.5);
    carve(P.etang, P.ile, 1.5); carve({ x: 38, y: 35 }, P.clairiere, 1);
    // rebords de carte : les sorties restent ouvertes
    Object.values(W.EXITS).forEach(e => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (W.inMap(e.x + dx, e.y + dy)) tile[idx(e.x + dx, e.y + dy)] = PATH; });
    // mine : rochers en croissant + filons
    const nodes = W.nodes = [];
    for (let a = 2.2; a < 5.4; a += 0.16) { const r = P.mine.r - 0.4 + rng() * 1.6; set(Math.round(P.mine.x + Math.cos(a) * r), Math.round(P.mine.y + Math.sin(a) * r), ROCK); }
    for (let i = 0; i < 6; i++) { const a = 2.5 + i * 0.5; const x = Math.round(P.mine.x + Math.cos(a) * 2.6), y = Math.round(P.mine.y + Math.sin(a) * 2.6); set(x, y, GRASS); nodes.push({ type: 'ore', x, y }); }
    // étang
    for (let y = -3; y <= 3; y++) for (let x = -5; x <= 5; x++) if ((x * x) / 20 + (y * y) / 6.5 < 1) set(P.etang.x + 6 + x, P.etang.y - 1 + y, WATER);
    // buissons de baies
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + rng() * 0.4, r = 2 + rng() * 1.8; const x = Math.round(P.baies.x + Math.cos(a) * r), y = Math.round(P.baies.y + Math.sin(a) * r); set(x, y, GRASS); nodes.push({ type: 'bush', x, y }); }
    for (let i = 0; i < 3; i++) { const x = P.clairiere.x - 1 + i, y = P.clairiere.y + (i % 2); set(x, y, GRASS); nodes.push({ type: 'bush', x, y }); }
    // affûts de chasse
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + 0.5, r = 3 + rng() * 1.5; const x = Math.round(P.chasse.x + Math.cos(a) * r), y = Math.round(P.chasse.y + Math.sin(a) * r); set(x, y, GRASS); nodes.push({ type: 'game', x, y }); }
    // ruines : sol dallé + murs brisés
    for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) set(P.ruines.x + x, P.ruines.y + y, FLOOR);
    for (let x = -4; x <= 4; x++) { if (x !== 0 && rng() < 0.8) set(P.ruines.x + x, P.ruines.y - 3, WALL); if (Math.abs(x) > 1 && rng() < 0.75) set(P.ruines.x + x, P.ruines.y + 3, WALL); }
    for (let y = -2; y <= 2; y++) { if (rng() < 0.75) set(P.ruines.x - 4, P.ruines.y + y, WALL); if (y !== 0 && rng() < 0.75) set(P.ruines.x + 4, P.ruines.y + y, WALL); }
    // coffres et bêtes sauvages
    W.chestDefs = [
      { x: P.ruines.x, y: P.ruines.y - 1, loot: { scroll: 'eclair', or: 40 } },
      { x: P.cache.x, y: P.cache.y, loot: { scroll: 'soin', or: 20 } },
      { x: P.nid.x + 1, y: P.nid.y, loot: { scroll: 'feu', or: 25 } },
      { x: P.ile.x + 1, y: P.ile.y, loot: { scroll: 'glace', potion: 2 } },
      { x: P.portail.x + 2, y: P.portail.y - 1, loot: { or: 30, potion: 1 } },
      { x: P.mine.x - 1, y: P.mine.y - 1, loot: { or: 25, minerai: 10 } }
    ];
    W.chestDefs.forEach(c => { if (!W.walkTile(c.x, c.y)) set(c.x, c.y, GRASS); });
    W.wildDefs = [
      { type: 'squelette', x: P.ruines.x - 2, y: P.ruines.y + 1 }, { type: 'squelette', x: P.ruines.x + 2, y: P.ruines.y }, { type: 'squelette', x: P.ruines.x, y: P.ruines.y + 2 },
      { type: 'ours', x: P.cache.x + 1, y: P.cache.y - 1 },
      { type: 'araignee', x: P.nid.x - 1, y: P.nid.y + 1 }, { type: 'araignee', x: P.nid.x, y: P.nid.y - 2 }, { type: 'araignee', x: P.nid.x - 2, y: P.nid.y - 1 },
      { type: 'loup', x: P.ile.x - 1, y: P.ile.y + 1 }, { type: 'loup', x: P.ile.x, y: P.ile.y - 1 },
      { type: 'sanglier', x: P.chasse.x + 8, y: P.chasse.y + 6 }, { type: 'loup', x: 62, y: 62 }, { type: 'sanglier', x: 30, y: 12 }
    ];
    W.wildDefs.forEach(c => { if (!W.walkTile(c.x, c.y)) set(c.x, c.y, GRASS); });
    { // cimetière
      const gr = W.GRAVE, r2 = CG.makeRng(seed + 7717);
      for (let y = -gr.r - 1; y <= gr.r + 1; y++) for (let x = -gr.r - 2; x <= gr.r + 2; x++) { const i = idx(gr.x + x, gr.y + y), t = tile[i]; if ((x * x) / ((gr.r + 1.4) * (gr.r + 1.4)) + (y * y) / (gr.r * gr.r) < 1 - r2() * 0.18 && (t === TREE || t === ROCK)) tile[i] = GRASS; }
      for (let i = 0; i <= 22; i++) { const k = i / 22, x = Math.round(gr.x + 1 + (22 - gr.x - 1) * k + Math.sin(k * 6) * 1.2), y = Math.round(gr.y - 1 + (36 - gr.y + 1) * k); for (let d = 0; d < 2; d++) { const j = idx(x + d, y); if (tile[j] === TREE || tile[j] === GRASS || tile[j] === ROCK) tile[j] = PATH; } }
      nodes.push({ type: 'crypt', x: gr.x, y: gr.y - 2 });
      for (let ry = 0; ry < 3; ry++) for (let rx = -3; rx <= 3; rx++) { if (rx === 0 || r2() < 0.2) continue; const x = gr.x + rx, y = gr.y - 1 + ry * 2; if (tile[idx(x, y)] !== GRASS) continue; nodes.push({ type: 'tomb', x, y, v: Math.floor(r2() * 4) }); }
      W.chestDefs.push({ x: gr.x + 1, y: gr.y - 2, loot: { or: 45, potion: 1 } });
      W.wildDefs.push({ type: 'squelette', x: gr.x - 2, y: gr.y }, { type: 'squelette', x: gr.x + 2, y: gr.y + 2 });
      W.chestDefs.concat(W.wildDefs.slice(-2)).slice(-3).forEach(c => { if (!W.walkTile(c.x, c.y)) set(c.x, c.y, GRASS); });
    }
    { // points d'eau : mares et sources un peu partout (hasard à part, loin du village et des lieux)
      const r3 = CG.makeRng(seed + 4242), taken = new Set(), ponds = [];
      nodes.forEach(n => taken.add(idx(n.x, n.y))); W.chestDefs.concat(W.wildDefs).forEach(c => taken.add(idx(c.x, c.y)));
      const far = (x, y) => Math.hypot(x - cx, y - cy) > 15 && Math.hypot(x - W.GRAVE.x, y - W.GRAVE.y) > 9 && Object.values(W.POI).every(p => Math.hypot(x - p.x, y - p.y) > p.r + 5) && Object.values(W.EXITS).every(e => Math.hypot(x - e.x, y - e.y) > 6);
      for (let k = 0; k < 400 && ponds.length < 11; k++) {
        const x = 5 + Math.floor(r3() * (CG.MW - 10)), y = 5 + Math.floor(r3() * (CG.MH - 10)), rx = 1.6 + r3() * 2.2, ry = 1.2 + r3() * 1.4, ph = r3() * 6;
        if (!far(x, y) || ponds.some(p => Math.hypot(p.x - x, p.y - y) < 13)) continue;
        ponds.push({ x, y });
        for (let dy = -4; dy <= 4; dy++) for (let dx = -5; dx <= 5; dx++) {
          const a = Math.atan2(dy, dx), k2 = 1 + Math.sin(a * 3 + ph) * 0.18, i = idx(x + dx, y + dy);
          if (!W.inMap(x + dx, y + dy) || taken.has(i)) continue;
          const d = (dx * dx) / (rx * rx * k2) + (dy * dy) / (ry * ry * k2);
          if (d < 1 && (tile[i] === TREE || tile[i] === GRASS)) tile[i] = WATER; else if (d < 2.4 && tile[i] === TREE && r3() < 0.6) tile[i] = GRASS;
        }
      }
      W.ponds = ponds;
    }
    // les lieux qui restent d'un jour à l'autre : chaque matin ils se repeuplent (de plus en plus) et cachent un nouveau coffre.
    // mobs : [type, à partir de quel jour]
    W.sites = [
      { k: 'ruines', x: P.ruines.x, y: P.ruines.y, r: 3, base: 3, mobs: [['squelette', 1], ['follet', 3], ['mage', 6], ['chevalier', 8]] },
      { k: 'cimetiere', x: W.GRAVE.x, y: W.GRAVE.y, r: 3, base: 2, mobs: [['squelette', 1], ['follet', 3], ['demon', 7]] },
      { k: 'nid', x: P.nid.x, y: P.nid.y, r: 3, base: 2, mobs: [['araignee', 1], ['champi', 4], ['ogre', 8]] },
      { k: 'ile', x: P.ile.x, y: P.ile.y, r: 2, base: 1, mobs: [['loup', 1], ['sanglier', 3], ['ours', 6]] },
      { k: 'cache', x: P.cache.x, y: P.cache.y, r: 2, base: 1, mobs: [['loup', 1], ['ours', 3], ['ogre', 7]] },
      { k: 'portail', x: P.portail.x, y: P.portail.y, r: 3, base: 1, mobs: [['gelee', 1], ['diablotin', 4], ['demon', 7]] }
    ];
    W.chestDefs = []; // plus aucun coffre fixe : tous les coffres sont remis en jeu chaque matin
    W.fieldDirty = true; W.miniDirty = true;
  };

  // ---------- peinture du terrain (une seule fois, dans un canevas hors écran) ----------
  // ---------- bords organiques : le contour de chaque case de chemin ou d'eau suit un bruit continu, jamais deux fois pareil ----------
  const offAt = (wx, wy, base, amp) => base + amp * ((W.noise(wx / 23 + 31, wy / 23 + 7) - 0.5) * 1.6 + (W.noise(wx / 8 + 5, wy / 8 + 91) - 0.5) * 1.0);
  function tilePoly(g, x, y, same, base, amp) {
    const L = x * T, U = y * T, R = L + T, B = U + T, e = 0.7, st = 5;
    const up = !same(x, y - 1), rt = !same(x + 1, y), dn = !same(x, y + 1), lf = !same(x - 1, y);
    const o = (wx, wy) => offAt(wx, wy, base, amp), neg = v => Math.max(0, -v);
    let first = true; const P = (px, py) => { if (first) { g.moveTo(px, py); first = false; } else g.lineTo(px, py); };
    const fan = (cx, cy, a0) => { if (base < 0) return; const r0 = Math.max(0, o(cx, cy)), k0 = (W.hash(x * 7 + Math.round(a0 * 3), y * 5) - 0.5) * 0.7; for (let i = 1; i < 6; i++) { const k = i / 6, a = a0 + k * Math.PI / 2, r = r0 * (1 + k0 * Math.sin(k * Math.PI)); P(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
    g.beginPath();
    for (let q = (up && lf ? neg(o(L, U)) : 0), hi = T - (up && rt ? neg(o(R, U)) : 0); q <= hi + 0.01; q += st) { const wx = L + Math.min(q, hi); P(wx, up ? U - o(wx, U) : U - e); }
    if (up && rt) fan(R, U, -Math.PI / 2);
    for (let q = (rt && up ? neg(o(R, U)) : 0), hi = T - (rt && dn ? neg(o(R, B)) : 0); q <= hi + 0.01; q += st) { const wy = U + Math.min(q, hi); P(rt ? R + o(R, wy) : R + e, wy); }
    if (rt && dn) fan(R, B, 0);
    for (let q = (dn && rt ? neg(o(R, B)) : 0), hi = T - (dn && lf ? neg(o(L, B)) : 0); q <= hi + 0.01; q += st) { const wx = R - Math.min(q, hi); P(wx, dn ? B + o(wx, B) : B + e); }
    if (dn && lf) fan(L, B, Math.PI / 2);
    for (let q = (lf && dn ? neg(o(L, B)) : 0), hi = T - (lf && up ? neg(o(L, U)) : 0); q <= hi + 0.01; q += st) { const wy = B - Math.min(q, hi); P(lf ? L - o(L, wy) : L - e, wy); }
    if (lf && up) fan(L, U, Math.PI);
    g.closePath();
  }
  const sameOf = type => (x, y) => !W.inMap(x, y) || W.tile[idx(x, y)] === type;
  function organic(g, tiles, same, base, amp, fill) { g.fillStyle = fill; for (const [x, y] of tiles) { tilePoly(g, x, y, same, base, amp); g.fill(); } }
  // chemins : liseré sombre irrégulier, terre battue, grandes taches de teinte
  function paintPaths(g, tiles) {
    const same = sameOf(PATH);
    organic(g, tiles, same, 11.5, 7, 'rgba(92,72,44,0.55)'); organic(g, tiles, same, 8, 6, '#a58a5c');
    for (const [x, y] of tiles) for (let i = 0; i < 2; i++) { const h = W.hash(x * 3 + i * 11, y * 5 - i * 7), h2 = W.hash(y * 2 + i, x * 9 + i); g.fillStyle = h < 0.5 ? 'rgba(190,164,112,0.22)' : 'rgba(118,94,58,0.16)'; g.beginPath(); g.ellipse(x * T + 6 + h2 * 28, y * T + 6 + h * 28, 9 + h * 12, 6 + h2 * 8, h * 3, 0, 6.3); g.fill(); }
  }
  // eau : sable, sable mouillé, eau claire du bord, puis de plus en plus profonde, avec reflets, nénuphars et roseaux
  function paintWater(g, tiles) {
    const same = sameOf(WATER);
    organic(g, tiles, same, 13, 5, '#cdbd8c'); organic(g, tiles, same, 8.5, 4.5, '#a99a6a'); organic(g, tiles, same, 5, 4.5, '#74c6de'); organic(g, tiles, same, -3.5, 4, '#4c9fc8'); organic(g, tiles, same, -11, 3.5, '#3a86b6');
    for (const [x, y] of tiles) {
      const cx = x * T + T / 2, cy = y * T + T / 2, h = W.hash(x * 4 + 3, y * 6 + 1), h2 = W.hash(y * 3 + 7, x * 2 + 5), shore = !same(x, y - 1) || !same(x + 1, y) || !same(x, y + 1) || !same(x - 1, y);
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1.6; g.lineCap = 'round';
      if (h < 0.55) { const rx = cx - 12 + h2 * 20, ry = cy - 8 + h * 22; g.beginPath(); g.moveTo(rx - 8, ry); g.quadraticCurveTo(rx, ry - 3.5, rx + 8, ry); g.stroke(); if (h2 < 0.5) { g.beginPath(); g.moveTo(rx - 3, ry + 5); g.quadraticCurveTo(rx + 3, ry + 2.5, rx + 9, ry + 5); g.stroke(); } }
      if (h2 > 0.82) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(cx + (h - 0.5) * 20, cy + (h2 - 0.9) * 60, 2.4, 1, 0, 0, 6.3); g.fill(); }
      if (!shore && h > 0.8) { const lx = cx + (h2 - 0.5) * 18, ly = cy + (h - 0.9) * 40; g.fillStyle = '#3f8f48'; g.beginPath(); g.moveTo(lx, ly); g.arc(lx, ly, 6.5, 0.5, 5.9); g.closePath(); g.fill(); g.fillStyle = '#5cb05a'; g.beginPath(); g.moveTo(lx, ly); g.arc(lx, ly, 4.4, 0.7, 5.6); g.closePath(); g.fill(); if (h2 < 0.5) { g.fillStyle = '#ffd0e4'; g.beginPath(); g.arc(lx - 1, ly - 1, 2.4, 0, 6.3); g.fill(); g.fillStyle = '#ffe36b'; g.beginPath(); g.arc(lx - 1, ly - 1, 1, 0, 6.3); g.fill(); } }
      if (shore && h > 0.62) { const side = !same(x - 1, y) ? -1 : !same(x + 1, y) ? 1 : 0, bx = cx + side * 15 + (h2 - 0.5) * 8, by = !same(x, y + 1) ? y * T + T - 2 : !same(x, y - 1) ? y * T + 8 : cy + (h2 - 0.5) * 20; for (let i = 0; i < 3; i++) { const rx = bx + (i - 1) * 4, top = by - 15 - i * 3 - h * 5; g.strokeStyle = '#4f8a3a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(rx, by); g.quadraticCurveTo(rx + (i - 1) * 2, by - 8, rx + (i - 1) * 3, top); g.stroke(); if (i !== 1 || h2 > 0.4) { g.fillStyle = '#6b4a2a'; g.beginPath(); g.ellipse(rx + (i - 1) * 3, top - 1, 1.8, 4, (i - 1) * 0.2, 0, 6.3); g.fill(); } } }
    }
  }
  W.paint = function () {
    const c = W.terrain = document.createElement('canvas'); c.width = CG.MW * T; c.height = CG.MH * T;
    const g = c.getContext('2d'), rng = CG.makeRng(W.seed + 77), tile = W.tile, noise = W.noise;
    for (let y = 0; y < CG.MH; y++) for (let x = 0; x < CG.MW; x++) {
      const n = noise(x / 5 + 11, y / 5 + 3), t = tile[idx(x, y)];
      const forest = t === TREE ? 1 : 0;
      const l = 33 + n * 9 - forest * 7, s = 44 + n * 8;
      g.fillStyle = `hsl(${96 + n * 16},${s}%,${l}%)`;
      g.fillRect(x * T, y * T, T, T);
    }
    // adoucir le damier par des taches
    for (let i = 0; i < 5200; i++) {
      const x = rng() * c.width, y = rng() * c.height, n = noise(x / T / 5 + 11, y / T / 5 + 3);
      g.fillStyle = `hsla(${92 + n * 22},${40 + rng() * 14}%,${30 + n * 12 + rng() * 5}%,0.5)`;
      g.beginPath(); g.ellipse(x, y, 16 + rng() * 26, 10 + rng() * 16, rng() * 3, 0, 6.3); g.fill();
    }
    // place du village en terre battue
    const vc = W.center(W.CX, W.CY);
    const gr = g.createRadialGradient(vc.x, vc.y, 30, vc.x, vc.y, 230);
    gr.addColorStop(0, 'rgba(150,118,74,0.95)'); gr.addColorStop(0.6, 'rgba(142,116,72,0.55)'); gr.addColorStop(1, 'rgba(142,116,72,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(vc.x, vc.y, 250, 200, 0, 0, 6.3); g.fill();
    // copie du sol nu (herbe, taches, terre battue) : sert à repeindre sans couture quand on pose un chemin ou du gazon
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
    const po = (x, y) => (W.hash(x * 5 + 1, y * 3 + 2) - 0.5) * 6;
    const blobs = (type, draw) => { for (let y = 0; y < CG.MH; y++) for (let x = 0; x < CG.MW; x++) if (tile[idx(x, y)] === type) draw(x * T + T / 2, y * T + T / 2, x, y); };
    // sentiers et eau : contours irréguliers
    const tilesOf = type => { const l = []; for (let y = 0; y < CG.MH; y++) for (let x = 0; x < CG.MW; x++) if (tile[idx(x, y)] === type) l.push([x, y]); return l; };
    paintPaths(g, tilesOf(PATH));
    blobs(PATH, (px, py) => { for (let i = 0; i < 2; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(120,98,62,0.6)' : 'rgba(190,168,120,0.45)'; g.beginPath(); g.ellipse(px + (rng() - 0.5) * 30, py + (rng() - 0.5) * 30, 2 + rng() * 4, 1.5 + rng() * 2, 0, 0, 6.3); g.fill(); } });
    paintWater(g, tilesOf(WATER));
    // sol rocailleux et dalles
    g.fillStyle = 'rgba(120,112,100,0.6)'; blobs(ROCK, (px, py) => { g.beginPath(); g.arc(px, py, 34, 0, 6.3); g.fill(); });
    blobs(FLOOR, (px, py, x, y) => { g.fillStyle = (x + y) % 2 ? '#8d8a80' : '#99968a'; g.fillRect(px - T / 2, py - T / 2, T, T); g.strokeStyle = 'rgba(40,40,36,0.35)'; g.lineWidth = 1.5; g.strokeRect(px - T / 2 + 1, py - T / 2 + 1, T - 2, T - 2); if (rng() < 0.3) { g.fillStyle = 'rgba(70,110,50,0.6)'; g.beginPath(); g.arc(px + (rng() - 0.5) * 24, py + (rng() - 0.5) * 24, 6, 0, 6.3); g.fill(); } });
    // touffes d'herbe et fleurs
    for (let i = 0; i < 4200; i++) {
      const x = rng() * c.width, y = rng() * c.height, t = tile[idx(Math.floor(x / T), Math.floor(y / T))];
      if (t !== GRASS && t !== TREE) continue;
      if (rng() < 0.12 && t === GRASS) { g.fillStyle = CG.pick2(rng, ['#fff3a8', '#ffb3d1', '#ffffff', '#c9b3ff']); g.beginPath(); g.arc(x, y, 2.2, 0, 6.3); g.fill(); g.fillStyle = '#e8b030'; g.beginPath(); g.arc(x, y, 0.9, 0, 6.3); g.fill(); }
      else { g.strokeStyle = rng() < 0.5 ? 'rgba(40,82,30,0.55)' : 'rgba(150,196,90,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 4, y - 6); g.moveTo(x, y); g.lineTo(x, y - 8); g.moveTo(x + 3, y); g.lineTo(x + 5, y - 6); g.stroke(); }
    }
    for (let i = 0; i < CG.MW * CG.MH; i++) if (tile[i] === CLEAR) W.paintStump(i % CG.MW, Math.floor(i / CG.MW));
  };
  CG.pick2 = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  W.paintStump = function (tx, ty) {
    const g = W.terrain.getContext('2d'), h = W.hash(tx, ty), x = tx * T + T / 2 + (h - 0.5) * 10, y = ty * T + T / 2 + 6;
    g.fillStyle = 'rgba(126,150,70,0.45)'; g.beginPath(); g.ellipse(tx * T + T / 2, ty * T + T / 2, 24, 20, 0, 0, 6.3); g.fill();
    if (h < 0.45) { // une souche de temps en temps seulement, pour laisser la place nette
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(x, y + 3, 9, 4, 0, 0, 6.3); g.fill();
      g.fillStyle = '#6b4a2a'; g.fillRect(x - 6, y - 4, 12, 7);
      g.fillStyle = '#c9a56b'; g.beginPath(); g.ellipse(x, y - 4, 6, 3, 0, 0, 6.3); g.fill();
      g.strokeStyle = '#8a6a3c'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y - 4, 3, 1.5, 0, 0, 6.3); g.stroke();
    }
  };

  W.paintRegrow = function (tx, ty) { const g = W.terrain.getContext('2d'); g.fillStyle = 'hsla(104,44%,27%,0.92)'; g.beginPath(); g.ellipse(tx * T + T / 2, ty * T + T / 2 + 2, 25, 21, 0, 0, 6.3); g.fill(); };

  // Repeint une petite zone après un changement de terrain (chemin posé, gazon semé).
  W.repaintArea = function (tx, ty) {
    const g = W.terrain.getContext('2d'), x0 = (tx - 1) * T, y0 = (ty - 1) * T;
    g.save(); g.beginPath(); g.rect(x0, y0, 3 * T, 3 * T); g.clip();
    const each = (r, f) => { for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (W.inMap(x, y)) f(x, y, W.tile[idx(x, y)], x * T + T / 2, y * T + T / 2); };
    g.drawImage(W.ground, x0, y0, 3 * T, 3 * T, x0, y0, 3 * T, 3 * T); // le sol d'origine, au pixel près
    const po = (x, y) => (W.hash(x * 5 + 1, y * 3 + 2) - 0.5) * 6;
    const near = type => { const l = []; each(2, (x, y, t) => { if (t === type) l.push([x, y]); }); return l; };
    paintPaths(g, near(PATH));
    each(2, (x, y, t, px, py) => { if (t !== PATH) return; for (let i = 0; i < 2; i++) { const h = W.hash(x * 2 + i, y * 9 + i); g.fillStyle = h < 0.5 ? 'rgba(120,98,62,0.6)' : 'rgba(190,168,120,0.45)'; g.beginPath(); g.ellipse(px + (h - 0.5) * 30, py + (W.hash(y * 4 + i, x) - 0.5) * 30, 2 + h * 4, 1.5 + h * 2, 0, 0, 6.3); g.fill(); } });
    paintWater(g, near(WATER));
    g.fillStyle = 'rgba(120,112,100,0.6)'; each(2, (x, y, t, px, py) => { if (t === ROCK) { g.beginPath(); g.arc(px, py, 34, 0, 6.3); g.fill(); } });
    each(1, (x, y, t, px, py) => { if (t === FLOOR) { g.fillStyle = (x + y) % 2 ? '#8d8a80' : '#99968a'; g.fillRect(px - T / 2, py - T / 2, T, T); } });
    each(1, (x, y, t, px, py) => { if (t !== GRASS) return; for (let i = 0; i < 2; i++) { const h = W.hash(x + i * 5, y - i * 3), gx = px + (h - 0.5) * 30, gy = py + (W.hash(y, x + i) - 0.5) * 28; g.strokeStyle = h < 0.5 ? 'rgba(40,82,30,0.55)' : 'rgba(150,196,90,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx - 3, gy); g.lineTo(gx - 4, gy - 6); g.moveTo(gx, gy); g.lineTo(gx, gy - 8); g.moveTo(gx + 3, gy); g.lineTo(gx + 5, gy - 6); g.stroke(); } });
    g.restore();
    each(1, (x, y, t) => { if (t === CLEAR) W.paintStump(x, y); });
  };
  // pose un chemin ou du gazon ; renvoie faux si la case ne s'y prête pas
  W.terrainOk = (tx, ty, kind) => { if (!W.inMap(tx, ty)) return false; const t = W.tile[idx(tx, ty)]; return kind === 'path' ? (t === GRASS || t === CLEAR) : (t === PATH || t === CLEAR); };
  W.setTerrain = function (tx, ty, kind) { W.tile[idx(tx, ty)] = kind === 'path' ? PATH : GRASS; W.fieldDirty = true; W.miniDirty = true; if (W.terrain) W.repaintArea(tx, ty); };

  // ---------- modifications ----------
  W.cutTree = function (tx, ty) {
    const i = idx(tx, ty); if (W.tile[i] !== TREE) return false;
    W.tile[i] = CLEAR; W.fieldDirty = true; W.miniDirty = true;
    if (W.terrain) W.paintStump(tx, ty);
    return true;
  };
  W.canBuild = function (tx, ty, w, h, on) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!W.inMap(tx + x, ty + y)) return false;
      const t = W.tile[idx(tx + x, ty + y)];
      if (on === 'water' ? (t !== WATER && t !== MOAT) : (t !== GRASS && t !== CLEAR && !(on === 'road' && t === PATH))) return false;
    }
    return true;
  };
  W.blockBuilding = function (b) {
    const def = CG.BUILDS[b.type] || {}, kind = b.site ? 'flat' : def.tile, // en chantier, on passe encore à travers : la clôture ne barre le passage qu'une fois bâtie
      t = kind === 'gate' ? GATE : kind === 'moat' ? MOAT : kind === 'bridge' ? BRIDGE : kind === 'flat' ? FLAT : BUILD;
    b.under = W.tile[idx(b.tx, b.ty)];
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) W.tile[idx(b.tx + x, b.ty + y)] = t === BUILD && b.h > 1 && y < b.h - 1 ? FLAT : t; // seul le pied du bâtiment bloque : on peut marcher derrière le toit
    W.fieldDirty = true; W.miniDirty = true;
  };

  W.unblock = function (b) {
    const u = b.under === WATER || b.under === MOAT || b.under === CLEAR || b.under === PATH ? b.under : GRASS;
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) W.tile[idx(b.tx + x, b.ty + y)] = u;
    W.fieldDirty = true; W.miniDirty = true;
  };
  W.isWater = (x, y) => W.inMap(x, y) && [WATER, MOAT, BRIDGE].includes(W.tile[idx(x, y)]);

  // ---------- chemins (parcours en largeur, 8 directions, sans couper les coins) ----------
  const NMAX = CG.MW1 * CG.MH1, prev = new Int32Array(NMAX), seen = new Uint32Array(NMAX), queue = new Int32Array(NMAX); // assez grand pour la plus grande carte
  let gen = 0;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  function nearestWalk(tx, ty) {
    if (W.walkTile(tx, ty)) return [tx, ty];
    for (let r = 1; r < 6; r++) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (Math.max(Math.abs(x), Math.abs(y)) === r && W.walkTile(tx + x, ty + y)) return [tx + x, ty + y];
    return null;
  }
  W.lineClear = function (ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 12);
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      if (!W.walkPx(x - 9, y - 9) || !W.walkPx(x + 9, y - 9) || !W.walkPx(x - 9, y + 9) || !W.walkPx(x + 9, y + 9)) return false;
    }
    return true;
  };
  // renvoie une liste de points (pixels) ou null
  W.path = function (sx, sy, gx, gy) {
    const s = nearestWalk(Math.floor(sx / T), Math.floor(sy / T)); if (!s) return null;
    const gtx = CG.clamp(Math.floor(gx / T), 0, CG.MW - 1), gty = CG.clamp(Math.floor(gy / T), 0, CG.MH - 1);
    const reach = W.walkTile(gtx, gty) ? 0 : 1;
    gen++; let head = 0, tail = 0; const si = idx(s[0], s[1]);
    queue[tail++] = si; seen[si] = gen; prev[si] = -1; let found = -1;
    while (head < tail) {
      const ci = queue[head++], x = ci % CG.MW, y = (ci - x) / CG.MW;
      if (Math.max(Math.abs(x - gtx), Math.abs(y - gty)) <= reach) { found = ci; break; }
      for (let k = 0; k < 8; k++) {
        const nx = x + DX[k], ny = y + DY[k]; if (!W.walkTile(nx, ny)) continue;
        if (k > 3 && (!W.walkTile(x + DX[k], y) || !W.walkTile(x, y + DY[k]))) continue;
        const ni = idx(nx, ny); if (seen[ni] === gen) continue;
        seen[ni] = gen; prev[ni] = ci; queue[tail++] = ni;
      }
    }
    if (found < 0) return null;
    const pts = [];
    for (let ci = found; ci !== -1; ci = prev[ci]) pts.push({ x: (ci % CG.MW) * T + T / 2, y: Math.floor(ci / CG.MW) * T + T / 2 });
    pts.reverse();
    if (reach === 0) pts.push({ x: gx, y: gy });
    // lissage : sauter les points intermédiaires quand la ligne est libre
    const out = []; let cx = sx, cy = sy, i = 0;
    while (i < pts.length) {
      let j = Math.min(pts.length - 1, i + 12);
      while (j > i && !W.lineClear(cx, cy, pts[j].x, pts[j].y)) j--;
      out.push(pts[j]); cx = pts[j].x; cy = pts[j].y; i = j + 1;
    }
    return out;
  };
  // distance (en tuiles) depuis le feu, pour choisir les arbres à abattre
  W.field = function () {
    if (!W.fieldDirty && W._field) return W._field;
    if (W._field && W._field.length !== CG.MW * CG.MH) W._field = null; const f = W._field || (W._field = new Int16Array(CG.MW * CG.MH)); f.fill(-1);
    let head = 0, tail = 0; const s = nearestWalk(W.CX, W.CY + 1), si = idx(s[0], s[1]);
    queue[tail++] = si; f[si] = 0;
    while (head < tail) {
      const ci = queue[head++], x = ci % CG.MW, y = (ci - x) / CG.MW;
      for (let k = 0; k < 4; k++) { const nx = x + DX[k], ny = y + DY[k]; if (!W.walkTile(nx, ny)) continue; const ni = idx(nx, ny); if (f[ni] >= 0) continue; f[ni] = f[ci] + 1; queue[tail++] = ni; }
    }
    W.fieldDirty = false; return f;
  };
  W.reachable = (tx, ty) => W.inMap(tx, ty) && W.field()[idx(tx, ty)] >= 0;
  W.findTree = function (reserved) {
    const f = W.field(); let best = null, bs = 1e9;
    for (let y = 1; y < CG.MH - 1; y++) for (let x = 1; x < CG.MW - 1; x++) {
      const i = idx(x, y); if (W.tile[i] !== TREE || reserved.has(i)) continue;
      let d = -1; for (let k = 0; k < 4; k++) { const v = f[idx(x + DX[k], y + DY[k])]; if (v >= 0 && (d < 0 || v < d)) d = v; }
      if (d < 0) continue;
      const sc = Math.hypot(x - W.CX, (y - W.CY) * 1.15) + Math.random() * 2.5;
      if (sc < bs) { bs = sc; best = { x, y }; }
    }
    return best;
  };

  // ---------- mini-carte ----------
  W.drawMini = function () {
    const c = W.mini || (W.mini = document.createElement('canvas')); c.width = CG.MW * 2; c.height = CG.MH * 2;
    const g = c.getContext('2d'), col = ['#5d9a48', '#2f6a2c', '#4a9ac8', '#8a857a', '#c98a4a', '#b89a66', '#79aa52', '#9a968a', '#6a665e', '#e0b060', '#4a9ac8', '#a87a40', '#8aa85a'];
    for (let y = 0; y < CG.MH; y++) for (let x = 0; x < CG.MW; x++) { g.fillStyle = col[W.tile[idx(x, y)]]; g.fillRect(x * 2, y * 2, 2, 2); }
    W.miniDirty = false;
  };
})(window.CG);
