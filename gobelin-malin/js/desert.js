// Goblin Malin — le désert du sud. La carte où mène le chemin du sud (terres.js, monde 4) est coupée en deux : en haut, la forêt
//   comme chez nous ; en bas, un grand désert. Du sable à perte de vue, de hautes buttes de roche rouge qu'on contourne (et derrière
//   lesquelles on passe), des aiguilles de pierre, des cactus, et des sables mouvants : on y avance au ralenti, on s'y enfonce,
//   et si on y reste trop longtemps, on y laisse de la vie.
//   Les bêtes de là-bas ne sont pas celles de la forêt : serpent des sables, vipère à cornes (enfouie, elle bondit ; sa morsure
//   empoisonne), cobra cracheur (il se dresse et crache son venin de loin), python des dunes (énorme), scorpion géant (dard
//   empoisonné), et les nomades : sabreurs au cimeterre, archers, et leur chef aux deux lames.
//   Tout se règle dans CG.Desert.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, Art = CG.Art, Te = CG.Terres, TAU = Math.PI * 2, rand = CG.rand; if (!Te || !W) return;
  const Ds = CG.Desert = {
    MONDE: 4, BORD: 30, /* la rangée où la forêt s'arrête (elle ondule un peu) */
    BUTTES: 16, AIGUILLES: 12, CACTUS: 46, MOUVANTS: 8,
    SABLE: { LENT: 0.42, FOND: 3.2, PV: 0.06, PX: 15 }, /* sables mouvants : vitesse du chef dedans, secondes pour s'enfoncer jusqu'au cou, part de sa vie perdue par seconde ensuite, pixels d'enfoncement */
    VENIN: { vipereCornes: [6, 2], scorpionGeant: [8, 3], cobraCracheur: [5, 2] }, /* [secondes, vie par seconde] */
    CRACHAT: { VUE: 240, CD: 2.3, V: 300 }, ENFOUIE: 105 /* à cette distance, la vipère enfouie bondit */
  };
  Ds.MONDES = [4, 6]; Ds.PASSAGE = 49; /* 6 : les Sables sans fin (sables.js), du désert partout ; PASSAGE : la colonne du passage vers le sud, en bas de la carte 4 */
  const ici = () => Ds.MONDES.includes(Te.ici()), tout = () => Te.ici() === 6, BORD = () => (tout() ? -9 : Ds.BORD), PLUS = () => (tout() ? 1.9 : 1);
  // ---------- les bêtes et les nomades ----------
  Object.assign(CG.ENEMIES, {
    serpentSable: { nom: 'Serpent des sables', race: 'bete', hp: 22, dmg: 5, spd: 118, xp: 9, or: 0, cost: 1.5, food: 1 },
    vipereCornes: { nom: 'Vipère à cornes', race: 'bete', hp: 28, dmg: 6, spd: 106, xp: 13, or: 0, cost: 2.5, food: 1 },
    cobraCracheur: { nom: 'Cobra cracheur', race: 'bete', hp: 32, dmg: 7, spd: 84, xp: 16, or: 0, cost: 3, food: 1 },
    pythonDunes: { nom: 'Python des dunes', race: 'bete', hp: 130, dmg: 13, spd: 66, xp: 55, or: 0, cost: 8, r: 18, food: 6 },
    scorpionGeant: { nom: 'Scorpion géant', race: 'bete', hp: 46, dmg: 8, spd: 84, xp: 18, or: 2, cost: 3.5, r: 14 },
    nomadeSabre: { nom: 'Nomade au cimeterre', race: 'humain', hp: 42, dmg: 9, spd: 92, xp: 16, or: 9, cost: 3 },
    nomadeArcher: { nom: 'Archer nomade', race: 'humain', hp: 28, dmg: 7, spd: 80, xp: 16, or: 9, cost: 3, range: 240 },
    nomadeChef: { nom: 'Chef des nomades', race: 'humain', hp: 120, dmg: 14, spd: 86, xp: 60, or: 45, cost: 9, r: 15 }
  });
  const PETITS = [['serpentSable'], ['vipereCornes'], ['cobraCracheur', 'serpentSable'], ['scorpionGeant'], ['nomadeSabre', 'nomadeArcher'], ['serpentSable', 'vipereCornes'], ['nomadeSabre']];
  const GROS = [['pythonDunes'], ['nomadeChef', 'nomadeSabre', 'nomadeArcher'], ['scorpionGeant', 'scorpionGeant', 'cobraCracheur']];
  const SERPENT = { serpentSable: 1, vipereCornes: 1, cobraCracheur: 1, pythonDunes: 1 };
  // ---------- la carte ----------
  let plan = null; Ds.plan = () => plan;
  Ds.dans = (px, py) => { if (!plan) return false; const tx = Math.max(0, Math.min(CG.MW - 1, Math.floor(px / T))); return py / T > plan.bord[tx]; };
  function generer(seed) {
    const tile = W.tile, I = W.idx, MW = CG.MW, MH = CG.MH, rng = CG.makeRng(seed + 4411), noise = W.noise, bord = [];
    for (let x = 0; x < MW; x++) bord.push(BORD() + (noise(x / 9 + 3.3, 7.7) - 0.5) * 9);
    if (!tout()) for (let y = MH - 8; y < MH; y++) for (let a = -1; a <= 1; a++) tile[I(Ds.PASSAGE + a, y)] = W.PATH; /* le passage du sud : une piste qui sort par le bas */
    const des = (x, y) => y > bord[x], libre = (x, y) => x >= 3 && y >= 3 && x < MW - 3 && y < MH - 3 && tile[I(x, y)] === W.GRASS && des(x, y);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { if (!des(x, y)) continue; const i = I(x, y), t = tile[i], rim = x < 2 || y >= MH - 2 || x >= MW - 2 || (tout() && y < 2);
      if (rim) { if (t !== W.PATH) tile[i] = W.BUILD; } else if (t === W.TREE || t === W.WATER) tile[i] = W.GRASS; }
    const pres = (x, y, m, quoi) => { for (let b = -m; b <= m; b++) for (let a = -m; a <= m; a++) { if (!W.inMap(x + a, y + b)) continue; const t = tile[I(x + a, y + b)]; if (quoi.includes(t)) return true; } return false; };
    const buttes = [], pris = new Set();
    const poser = (rx, ry, H, essais) => { for (let k = 0; k < essais; k++) { const cx = 6 + Math.floor(rng() * (MW - 12)), cy = Math.ceil(BORD() + 7 + rng() * (MH - BORD() - 13)), ph = rng() * 6, l = []; let ok = true;
        for (let b = -Math.ceil(ry) - 2; b <= Math.ceil(ry) + 2 && ok; b++) for (let a = -Math.ceil(rx) - 2; a <= Math.ceil(rx) + 2 && ok; a++) { const x = cx + a, y = cy + b, an = Math.atan2(b, a), k2 = 1 + Math.sin(an * 3 + ph) * 0.16, d = (a * a) / (rx * rx * k2) + (b * b) / (ry * ry * k2);
          if (d < 2.6 && (!libre(x, y) || pris.has(I(x, y)) || pres(x, y, 1, [W.PATH, W.ROCK, W.BUILD]))) ok = false; else if (d < 1) l.push([x, y]); }
        if (!ok || !l.length) continue; l.forEach(q => { tile[I(q[0], q[1])] = W.BUILD; }); for (let b = -Math.ceil(ry) - 2; b <= Math.ceil(ry) + 2; b++) for (let a = -Math.ceil(rx) - 2; a <= Math.ceil(rx) + 2; a++) if (W.inMap(cx + a, cy + b)) pris.add(I(cx + a, cy + b));
        const xs = l.map(q => q[0]), ys = l.map(q => q[1]); buttes.push({ l, x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys), H, seed: Math.floor(rng() * 1e6) }); return true; } return false; };
    const mouvants = []; for (let k = 0; k < 900 && mouvants.length < Ds.MOUVANTS * PLUS(); k++) { const x = 8 + Math.floor(rng() * (MW - 16)), y = Math.ceil(BORD() + 6 + rng() * (MH - BORD() - 12)), rx = 2 + rng() * 1.6, ry = 1.3 + rng() * 0.9; let ok = !mouvants.some(m => Math.hypot(m.tx - x, m.ty - y) < 12);
      for (let b = -3; b <= 3 && ok; b++) for (let a = -4; a <= 4 && ok; a++) if (!libre(x + a, y + b) || pris.has(I(x + a, y + b))) ok = false; if (!ok) continue; for (let b = -3; b <= 3; b++) for (let a = -4; a <= 4; a++) pris.add(I(x + a, y + b)); mouvants.push({ tx: x, ty: y, x: (x + 0.5) * T, y: (y + 0.5) * T, rx: rx * T, ry: ry * T, seed: rng() * 10 }); }
    for (let i = 0; i < Ds.BUTTES * PLUS(); i++) poser(2 + rng() * 2.8, 1.1 + rng() * 1.3, 58 + rng() * 44, 60);
    for (let i = 0; i < Ds.AIGUILLES * PLUS(); i++) poser(0.7, 0.7, 70 + rng() * 50, 40);
    const cactus = []; for (let k = 0; k < 900 && cactus.length < Ds.CACTUS * PLUS(); k++) { const x = 4 + Math.floor(rng() * (MW - 8)), y = Math.ceil(BORD() + 2 + rng() * (MH - BORD() - 6)); if (!libre(x, y) || pris.has(I(x, y)) || pres(x, y, 1, [W.PATH, W.BUILD, W.ROCK])) continue; tile[I(x, y)] = W.BUILD; pris.add(I(x, y)); cactus.push({ x, y, v: Math.floor(rng() * 3), s: 0.85 + rng() * 0.4 }); }
    W.nodes = (W.nodes || []).filter(n => !des(n.x, n.y) || tile[I(n.x, n.y)] === W.GRASS); W.ponds = (W.ponds || []).filter(p => !des(p.x, p.y)); W.fieldDirty = true; W.miniDirty = true;
    plan = { bord, buttes, cactus, mouvants, seed };
  }
  const gen0 = W.generate; W.generate = function (seed) { const r = gen0.apply(this, arguments); if (ici()) generer(seed); else plan = null; return r; };
  // ---------- le sol ----------
  const pa0 = W.paint; W.paint = function () {
    const r = pa0.apply(this, arguments); if (!ici() || !plan || !W.terrain) return r;
    const g = W.terrain.getContext('2d'), tile = W.tile, I = W.idx, MW = CG.MW, MH = CG.MH, noise = W.noise, rng = CG.makeRng(plan.seed + 91), bord = plan.bord, des = (x, y) => y > bord[x];
    const el = (x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { if (!des(x, y)) continue; const n = noise(x / 6 + 2, y / 6 + 9), rim = (x < 2 || y >= MH - 2 || x >= MW - 2 || (tout() && y < 2)) && tile[I(x, y)] !== W.PATH; g.fillStyle = rim ? 'hsl(16,' + (44 + n * 8) + '%,' + (30 + n * 8) + '%)' : 'hsl(' + (38 + n * 6) + ',' + (54 + n * 8) + '%,' + (66 + n * 8) + '%)'; g.fillRect(x * T, y * T, T, T); }
    for (let x = 0; x < MW; x++) { const by = bord[x] * T; for (let k = 0; k < 9; k++) { const up = rng() < 0.5; el(x * T + rng() * T, by + (up ? -rng() * 46 : rng() * 46) + T, 14 + rng() * 26, 8 + rng() * 14, up ? 'hsla(40,56%,' + (64 + rng() * 8) + '%,' + (0.35 + rng() * 0.4) + ')' : 'hsla(' + (78 + rng() * 20) + ',36%,' + (38 + rng() * 10) + '%,' + (0.25 + rng() * 0.3) + ')', rng() * 3); } } /* la lisière : le sable mord sur l'herbe, quelques touffes mordent sur le sable */
    const y0 = Math.max(0, (BORD() + 5) * T), hh = MH * T - y0, NB = PLUS();
    for (let i = 0; i < 3000 * NB; i++) { const x = rng() * MW * T, y = y0 - 3 * T + rng() * (hh + 3 * T); if (!Ds.dans(x, y)) continue; const n = noise(x / T / 6 + 2, y / T / 6 + 9); el(x, y, 18 + rng() * 30, 9 + rng() * 15, 'hsla(' + (36 + n * 8) + ',' + (50 + rng() * 12) + '%,' + (62 + n * 12 + rng() * 5) + '%,0.45)', rng() * 0.6 - 0.3); }
    g.lineCap = 'round'; for (let i = 0; i < 1500 * NB; i++) { const x = rng() * MW * T, y = y0 - 2 * T + rng() * (hh + 2 * T); if (!Ds.dans(x, y)) continue; const w = 16 + rng() * 34; g.strokeStyle = 'rgba(150,104,52,' + (0.12 + rng() * 0.16) + ')'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x, y - 4 - rng() * 5, x + w / 2, y + rng() * 3); g.stroke(); } /* les rides du vent */
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { if (!des(x, y) || tile[I(x, y)] !== W.PATH) continue; for (let k = 0; k < 3; k++) el(x * T + rng() * T, y * T + rng() * T, 16 + rng() * 12, 11 + rng() * 8, 'rgba(176,134,82,' + (0.28 + rng() * 0.2) + ')', rng() * 3); if (rng() < 0.5) el(x * T + rng() * T, y * T + rng() * T, 2 + rng() * 3, 1.5 + rng() * 2, 'rgba(120,96,70,0.6)'); } /* la piste : du sable tassé, des cailloux */
    for (let i = 0; i < 260 * NB; i++) { const x = rng() * MW * T, y = y0 + rng() * hh; if (!Ds.dans(x, y) || !W.walkPx(x, y)) continue; const q = rng();
      if (q < 0.5) { g.strokeStyle = 'rgba(122,110,62,0.8)'; g.lineWidth = 1.4; g.beginPath(); for (let a = -1.2; a <= 1.2; a += 0.4) { g.moveTo(x, y); g.lineTo(x + Math.sin(a) * 9, y - Math.cos(a) * (7 + rng() * 5)); } g.stroke(); } /* une touffe sèche */
      else if (q < 0.85) { el(x, y, 4 + rng() * 5, 3 + rng() * 3, 'rgba(150,126,98,0.9)'); el(x - 1, y - 1.5, 2.5, 1.6, 'rgba(210,190,160,0.5)'); }
      else { el(x, y, 6, 4.6, '#efe8d4'); el(x - 2, y - 0.5, 1.4, 1.6, '#5a4a3a'); el(x + 2, y - 0.5, 1.4, 1.6, '#5a4a3a'); g.strokeStyle = '#efe8d4'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x + 9, y + 3); g.lineTo(x + 22, y + 7); g.moveTo(x + 10, y + 8); g.lineTo(x + 21, y + 1); g.stroke(); } } /* un crâne blanchi et deux os */
    for (const m of plan.mouvants) { for (let k = 5; k >= 1; k--) el(m.x, m.y, m.rx * (0.3 + k * 0.16), m.ry * (0.3 + k * 0.16), 'rgba(' + (150 - k * 6) + ',' + (112 - k * 5) + ',' + (62 - k * 3) + ',' + (0.16 + (5 - k) * 0.05) + ')'); } /* les sables mouvants : une cuvette plus sombre (les remous sont dessinés par-dessus, en mouvement) */
    for (const b of plan.buttes) el((b.x0 + b.x1 + 1) / 2 * T + 8, (b.y1 + 1) * T + 2, (b.x1 - b.x0 + 1) * T * 0.56 + 6, 12, 'rgba(60,34,20,0.3)');
    for (const c of plan.cactus) el((c.x + 0.5) * T + 5, (c.y + 0.5) * T + 13, 14, 5, 'rgba(60,40,20,0.28)');
    return r;
  };
  const mi0 = W.drawMini; W.drawMini = function () { const r = mi0.apply(this, arguments); if (!ici() || !plan || !W.mini) return r; const g = W.mini.getContext('2d'), I = W.idx;
    for (let y = 0; y < CG.MH; y++) for (let x = 0; x < CG.MW; x++) { if (!(y > plan.bord[x])) continue; const t = W.tile[I(x, y)]; g.fillStyle = t === W.BUILD ? '#a8563a' : t === W.PATH ? '#c29a62' : t === W.ROCK ? '#8a857a' : '#dcc282'; g.fillRect(x * 2, y * 2, 2, 2); }
    g.fillStyle = '#b08a52'; for (const m of plan.mouvants) g.fillRect(m.tx * 2 - 3, m.ty * 2 - 2, 7, 5); return r; };
  // ---------- les buttes, les aiguilles et les cactus : des images faites une fois, triées avec les personnages ----------
  const EP = [10, 7, 13, 6, 11, 8, 14, 7, 9]; /* l'épaisseur des couches de roche, de haut en bas */
  const STRATES = ['#b4532e', '#c96a3a', '#a2462a', '#d4884e', '#bb5c32', '#96402a', '#cf7a44'];
  function imageButte(b) {
    const w = (b.x1 - b.x0 + 1) * T + 24, h = (b.y1 - b.y0 + 1) * T + b.H + 16, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), rng = CG.makeRng(b.seed), PAS = 8, cols = {};
    b.l.forEach(q => { const k = q[0]; if (!cols[k]) cols[k] = [q[1], q[1]]; else { cols[k][0] = Math.min(cols[k][0], q[1]); cols[k][1] = Math.max(cols[k][1], q[1]); } });
    const haut = [], bas = [], n = Math.ceil((b.x1 - b.x0 + 1) * T / PAS);
    for (let i = 0; i <= n; i++) { const fx = b.x0 + (i * PAS) / T, c0 = cols[Math.floor(fx)] || cols[Math.floor(fx) - 1] || cols[b.x0], bord = Math.min(i, n - i) / 3; const k = Math.min(1, 0.35 + bord * 0.65); /* les deux bouts s'arrondissent */
      const yt = (c0[0] - b.y0) * T, yb = (c0[1] + 1 - b.y0) * T, mid = (yt + yb) / 2; haut.push(mid + (yt - mid) * k + (rng() - 0.5) * 5); bas.push(mid + (yb - mid) * k + (rng() - 0.5) * 4); }
    const X = i => 12 + i * PAS, OY = b.H + 8;
    // la paroi : des strates de couleur, du pied (bas) jusqu'au rebord du plateau (bas - H)
    for (let i = 0; i < n; i++) { const x = X(i), yb = OY + bas[i], yh = yb - b.H; const dec = Math.sin(i * 0.35 + b.seed) * 2.5 + Math.sin(i * 0.11 + b.seed * 2) * 3; let y = yh, s = 0, lim = yh + EP[0] + dec; /* les strates : les mêmes couches d'un bout à l'autre de la butte, qui ondulent un peu */
      while (y < yb) { const fin = Math.min(yb, Math.max(y + 1, lim)); g.fillStyle = STRATES[(s + b.seed) % STRATES.length]; g.fillRect(x, y, PAS + 0.6, fin - y + 0.6); y = fin; s++; lim += EP[s % EP.length]; }
      const om = i / n; g.fillStyle = 'rgba(40,14,10,' + (om > 0.55 ? (om - 0.55) * 0.55 : 0).toFixed(3) + ')'; g.fillRect(x, yh, PAS + 0.6, b.H); g.fillStyle = 'rgba(255,220,170,' + (om < 0.3 ? (0.3 - om) * 0.4 : 0).toFixed(3) + ')'; g.fillRect(x, yh, PAS + 0.6, b.H);
      if (rng() < 0.16) { g.fillStyle = 'rgba(50,18,12,0.35)'; g.fillRect(x + rng() * PAS, yh + rng() * b.H * 0.3, 1.6, b.H * (0.3 + rng() * 0.6)); } /* une fissure */
      g.fillStyle = 'rgba(40,14,10,0.3)'; g.fillRect(x, yb - 4, PAS + 0.6, 4); }
    // le plateau : plus clair, vu d'en haut
    g.fillStyle = '#dc9458'; g.beginPath(); g.moveTo(X(0), OY + haut[0] - b.H); for (let i = 1; i <= n; i++) g.lineTo(X(i), OY + haut[i] - b.H); for (let i = n; i >= 0; i--) g.lineTo(X(i), OY + bas[Math.min(i, n - 1)] - b.H + 1); g.closePath(); g.fill();
    g.save(); g.clip(); for (let k = 0; k < 26; k++) { g.fillStyle = rng() < 0.5 ? 'rgba(240,180,120,0.35)' : 'rgba(170,96,54,0.3)'; g.beginPath(); g.ellipse(rng() * w, OY - b.H + rng() * (h - OY + 10), 6 + rng() * 14, 3 + rng() * 6, 0, 0, TAU); g.fill(); } g.restore();
    g.strokeStyle = 'rgba(255,214,160,0.55)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < n; i++) { const y = OY + bas[i] - b.H + 1; if (!i) g.moveTo(X(i), y); else g.lineTo(X(i), y); } g.stroke(); /* le rebord, au soleil */
    return { c, ox: b.x0 * T - 12, oy: b.y0 * T - OY };
  }
  const CACT = [];
  function imageCactus(v) { if (CACT[v]) return CACT[v]; const c = document.createElement('canvas'); c.width = 60; c.height = 80; const g = c.getContext('2d'), rr = (x, y, w, h, r, f) => { g.fillStyle = f; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
    if (v === 2) { [[30, 62, 13], [19, 50, 10], [41, 48, 11], [30, 36, 9]].forEach((q, i) => { g.fillStyle = i % 2 ? '#4f9a54' : '#448a4a'; g.beginPath(); g.ellipse(q[0], q[1], q[2], q[2] * 0.92, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(q[0] - 3, q[1] - 3, q[2] * 0.4, q[2] * 0.3, 0, 0, TAU); g.fill(); }); g.fillStyle = '#ff7a9a'; g.beginPath(); g.arc(30, 27, 3.4, 0, TAU); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(30, 27, 1.3, 0, TAU); g.fill(); }
    else { rr(23, 14, 14, 62, 7, '#458c4c'); rr(23, 14, 6, 62, 6, '#52a058'); rr(8, 34, 9, 22, 4.5, '#458c4c'); rr(8, 46, 20, 9, 4.5, '#458c4c'); if (v === 1) { rr(43, 24, 9, 24, 4.5, '#3f8246'); rr(33, 40, 19, 9, 4.5, '#3f8246'); g.fillStyle = '#ffe36b'; g.beginPath(); g.arc(30, 13, 3.2, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(20,60,26,0.5)'; for (let y = 20; y < 72; y += 7) { g.fillRect(29.4, y, 1.2, 3); g.fillRect(25, y + 3, 1, 2.4); g.fillRect(34, y + 3, 1, 2.4); } }
    return (CACT[v] = c); }
  const butteS = { draw(g, o) { const b = o.b; if (!b.img) b.img = imageButte(b); g.drawImage(b.img.c, b.img.ox, b.img.oy); } };
  const cactusS = { draw(g, o) { const c = o.c, im = imageCactus(c.v), w = 60 * c.s, h = 80 * c.s; g.drawImage(im, (c.x + 0.5) * T - w / 2, (c.y + 0.5) * T + 14 - h, w, h); } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (!ici() || !plan) return;
    for (const b of plan.buttes) { const cx = (b.x0 + b.x1 + 1) / 2 * T, cy = (b.y0 + b.y1 + 1) / 2 * T; if (CG.onScreen(cx, cy) || CG.onScreen(b.x0 * T, b.y0 * T - b.H) || CG.onScreen((b.x1 + 1) * T, (b.y1 + 1) * T) || CG.onScreen(b.x0 * T, (b.y1 + 1) * T) || CG.onScreen((b.x1 + 1) * T, b.y0 * T - b.H)) push((b.y1 + 1) * T - 6, 21, Object.assign({ x: cx, y: (b.y1 + 1) * T - 6, b }, butteS), null); }
    for (const c of plan.cactus) { const x = (c.x + 0.5) * T, y = (c.y + 0.5) * T + 12; if (CG.onScreen(x, y - 20)) push(y, 21, Object.assign({ x, y, c }, cactusS), null); } }; }
  // ---------- les sables mouvants ----------
  const dansMouvant = (x, y) => { if (!plan) return null; for (const m of plan.mouvants) { const a = (x - m.x) / (m.rx * 0.86), b = (y - m.y) / (m.ry * 0.86); if (a * a + b * b < 1) return m; } return null; };
  Ds.dansMouvant = dansMouvant;
  { const hm0 = G.heroMul; G.heroMul = function () { const R = CG.R; return hm0.apply(this, arguments) * (R && R.sableM > 0 ? Ds.SABLE.LENT : 1); }; }
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    const r = gr0.apply(this, arguments); if (!ici() || !plan) return r;
    for (const m of plan.mouvants) { if (!CG.onScreen(m.x, m.y)) continue; g.save(); g.translate(m.x, m.y); g.scale(1, m.ry / m.rx); g.lineWidth = 2.2;
      for (let k = 0; k < 4; k++) { const u = ((t * 0.16 + k / 4 + m.seed) % 1), rr = m.rx * 0.84 * (1 - u); g.strokeStyle = 'rgba(112,78,40,' + (0.34 * Math.sin(u * Math.PI)).toFixed(2) + ')'; g.beginPath(); g.arc(0, 0, rr, t * 0.5 + k, t * 0.5 + k + 4.4); g.stroke(); }
      g.fillStyle = 'rgba(98,66,34,0.5)'; g.beginPath(); g.arc(0, 0, 5 + Math.sin(t * 2 + m.seed) * 1.5, 0, TAU); g.fill(); g.restore(); }
    return r;
  };
  // le chef s'enfonce : on le dessine plus bas, coupé à la surface du sable
  const ag0 = Art.goblin; Art.goblin = function (g, o) {
    const R = CG.R, k = o && o.chief && o.ent === (CG.S && CG.S.player) && R && R.sableK > 0 ? Math.min(1, R.sableK) : 0; if (!k) return ag0.apply(this, arguments);
    const a = Array.prototype.slice.call(arguments), d = k * Ds.SABLE.PX * (o.s || 1); a[1] = Object.assign({}, o, { y: o.y + d });
    g.save(); g.beginPath(); g.rect(o.x - 90, o.y - 170, 180, 169); g.clip(); let r; try { r = ag0.apply(this, a); } finally { g.restore(); }
    g.fillStyle = 'rgba(140,100,54,0.75)'; g.beginPath(); g.ellipse(o.x, o.y - 1, 15, 4.6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(214,180,120,0.8)'; g.beginPath(); g.ellipse(o.x, o.y - 2, 12, 3.2, 0, 0, TAU); g.fill(); return r;
  };
  // ---------- les crachats du cobra ----------
  const crachats = () => { const R = CG.R; return R.dsCrachats || (R.dsCrachats = []); };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    const r = mk0.apply(this, arguments), R = CG.R; if (!R || !R.dsCrachats) return r;
    for (const s of R.dsCrachats) { g.fillStyle = 'rgba(150,230,70,0.3)'; g.beginPath(); g.arc(s.x, s.y, 7, 0, TAU); g.fill(); g.fillStyle = '#9be04a'; g.beginPath(); g.arc(s.x, s.y, 4.2, 0, TAU); g.fill(); g.fillStyle = '#e0ffa8'; g.beginPath(); g.arc(s.x - 1, s.y - 1, 1.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(150,230,70,0.45)'; g.beginPath(); g.arc(s.x - s.vx * 0.035, s.y - s.vy * 0.035, 3, 0, TAU); g.fill(); }
    return r;
  };
  // ---------- chaque instant ----------
  const cible = e => e.target && !e.target.dead && !e.target.hidden ? e.target : null;
  function remplacer(R) {
    const S = CG.S, l = R.enemies.filter(e => e.tk !== undefined && !e.dead && !e.desert && Ds.dans(e.x, e.y)); R.desertFait = true; if (!l.length) return;
    const meutes = {}; l.forEach(e => { const k = Math.round(((e.wild && e.wild.x) || e.x) / 110) + ':' + Math.round(((e.wild && e.wild.y) || e.y) / 110) + ':' + e.type; (meutes[k] = meutes[k] || []).push(e); });
    Object.keys(meutes).sort().forEach((k, i) => { const m = meutes[k], gros = (CG.ENEMIES[m[0].type].cost || 1) >= 5, rng = CG.makeRng((S.seed || 1) + S.day * 53 + i * 977 + k.length), L = gros ? GROS : PETITS, sortes = L[Math.floor(rng() * L.length)];
      m.forEach((e, j) => { const type = sortes[gros && sortes.length > 1 ? Math.min(j, sortes.length - 1) : j % sortes.length]; if (j > 0 && type === 'pythonDunes') { e.dead = true; e.desert = true; R.enemies.splice(R.enemies.indexOf(e), 1); const n = G.spawnEnemy('serpentSable', e.x, e.y, { wild: true, mul: Te.FORCE }); if (n) { n.tk = e.tk; n.desert = true; } return; }
        const i0 = R.enemies.indexOf(e); if (i0 >= 0) R.enemies.splice(i0, 1); e.dead = true; const n = G.spawnEnemy(type, e.x, e.y, { wild: true, mul: Te.FORCE }); if (!n) return; n.tk = e.tk; n.desert = true; n.leash = e.leash; if (type === 'vipereCornes' && rng() < 0.75) { n.enfouie = true; n.calm = true; n.aggroR = 0; } if (type === 'nomadeChef' || type === 'pythonDunes') n.aggroR = 300; }); });
  }
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R0 = CG.R;
    if (S && R0 && R0.enemies && ici()) for (const e of R0.enemies) { if (e.dead) continue; e._da = e.atkAnim || 0; if (e.enfouie) { const p = S.player, vu = !(R0.ko > 0) && !(R0.invis > 0); if (!e.calm || e.hp < e.maxhp || (vu && Math.hypot(p.x - e.x, p.y - e.y) < Ds.ENFOUIE)) { e.enfouie = false; e.calm = false; e.aggroR = 320; e.rooted = 0; e.seek = 1.5; if (vu) e.target = p; e.atkCd = 0.35; G.text(e.x, e.y - 40, '❗', '#ffe36b', true); G.puff(e.x, e.y - 6, '#e0c080', 16, 120, 3); if (CG.onScreen(e.x, e.y)) CG.sfx('warning'); } else { e.rooted = Math.max(e.rooted || 0, 0.2); e.target = null; e.path = null; e.moving = false; } } }
    const r = up0.apply(this, arguments), R = CG.R; if (!S || !R || CG.S !== S || !ici() || !plan) { if (R) { R.sableK = 0; R.sableM = 0; } return r; } const p = S.player;
    if (R.terreM === Te.ici() && !R.desertFait) remplacer(R);
    // le venin des morsures : au moment où le coup part
    for (const e of R.enemies) { if (e.dead || !e.desert) continue; const V = Ds.VENIN[e.type];
      if (V && e.type !== 'cobraCracheur' && (e.atkAnim || 0) > (e._da || 0) + 0.5) { const tg = cible(e); if (tg && Math.hypot(tg.x - e.x, tg.y - e.y) < (e.r || 12) + 34 && CG.Marais && CG.Marais.venin) CG.Marais.venin(tg, V[0], V[1]); }
      if (e.type === 'cobraCracheur') { const tg = cible(e), C = Ds.CRACHAT, d = tg ? Math.hypot(tg.x - e.x, tg.y - e.y) : 1e9; e.crCd = (e.crCd || rand(0.5, 1.5)) - dt; e.dresse = !!tg && d < C.VUE && d > 46 && W.lineClear(e.x, e.y, tg.x, tg.y);
        if (e.dresse) { e.rooted = Math.max(e.rooted || 0, 0.15); e.moving = false; e.face = tg.x > e.x ? 1 : -1; if (e.crCd <= 0 && !(e.daze > 0) && !(e.sleepT > 0)) { e.crCd = C.CD; e.crAnim = 0.35; const dx = tg.x - e.x, dy = tg.y - 16 - (e.y - 30); const l = Math.hypot(dx, dy) || 1; crachats().push({ x: e.x + e.face * 6, y: e.y - 30, vx: dx / l * C.V, vy: dy / l * C.V, t: 1.4, dmg: e.dmg, age: 0 }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } }
        if (e.crAnim > 0) e.crAnim -= dt; }
      if (!SERPENT[e.type] && dansMouvant(e.x, e.y)) e.slow = Math.max(e.slow || 0, 0.3); } /* les serpents glissent sur les sables mouvants ; les autres s'y embourbent */
    if (R.dsCrachats && R.dsCrachats.length) { for (const s of R.dsCrachats) { s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; s.age += dt; let touche = null;
        if (!(R.ko > 0) && Math.hypot(p.x - s.x, p.y - 16 - s.y) < 13) touche = p; else for (const o of S.goblins.concat(S.pets)) if (!o.hidden && !o.dead && o.ko !== true && Math.hypot(o.x - s.x, o.y - 14 - s.y) < 12) { touche = o; break; }
        if (touche) { s.t = 0; if (touche === p) G.hurtPlayer(s.dmg); else if (touche.pet) CG.P.hurt(touche, s.dmg); else G.hurtGoblin(touche, s.dmg); const V = Ds.VENIN.cobraCracheur; if (CG.Marais && CG.Marais.venin) CG.Marais.venin(touche, V[0], V[1]); G.puff(s.x, s.y, '#9be04a', 8, 90, 3); }
        else if (s.age > 0.12 && !W.walkPx(s.x, s.y + 18)) { s.t = 0; G.puff(s.x, s.y, '#9be04a', 5, 60, 2.5); } }
      R.dsCrachats = R.dsCrachats.filter(s => s.t > 0); }
    // les sables mouvants
    const m = !(R.ko > 0) && !R.mount ? dansMouvant(p.x, p.y) : null, Sb = Ds.SABLE;
    if (m) { R.sableM = 0.25; const av = R.sableK || 0; R.sableK = Math.min(1.2, av + dt / Sb.FOND); if (!av) { G.text(p.x, p.y - 66, 'Des sables mouvants !', '#ffe0a0', true); CG.sfx('warning'); }
      if (Math.random() < dt * 5) R.parts.push({ x: p.x + rand(-12, 12), y: p.y - 2, vx: rand(-14, 14), vy: rand(-16, -4), life: 0.5, max: 0.5, col: '#d8b878', size: 2.6 });
      if (R.sableK >= 1) { R.sableTic = (R.sableTic || 0) - dt; if (R.sableTic <= 0) { R.sableTic = 1; G.hurtPlayer(Math.max(2, p.maxhp * Sb.PV)); G.text(p.x, p.y - 80, 'Tu t\'enfonces !', '#ff9a8a', true); } } }
    else { if (R.sableM > 0) R.sableM -= dt; if (R.sableK > 0) R.sableK = Math.max(0, R.sableK - dt * 1.6); R.sableTic = 0; }
    return r;
  };
  // ---------- leurs dessins (aucun contour : des aplats, des ombres) ----------
  const el = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const po = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const SERP = {
    serpentSable: { n: 11, gros: 4.2, c1: '#d6b06a', c2: '#b88a48', ventre: '#f0dca8', oeil: '#2a2018', e: 1 },
    vipereCornes: { n: 10, gros: 5.2, c1: '#c9a678', c2: '#7a5a3a', ventre: '#ead8b0', oeil: '#ffd24a', cornes: true, e: 1.05 },
    cobraCracheur: { n: 12, gros: 4.8, c1: '#3c3a34', c2: '#d8b040', ventre: '#e8d8a0', oeil: '#ff5a3a', cobra: true, e: 1.1 },
    pythonDunes: { n: 16, gros: 9.5, c1: '#b8894a', c2: '#5a3c22', ventre: '#ecd8a8', oeil: '#ffd24a', e: 1.75 }
  };
  function serpent(g, e, t) {
    const L = SERP[e.type], f = e.face < 0 ? -1 : 1, x = e.x, y = e.y, onde = e.moving ? (e.step || 0) * 5 : t * 1.6, amp = e.moving ? 5 : 2.2, pas = L.gros * 1.25, mord = e.atkAnim > 0 ? Math.sin(Math.min(1, e.atkAnim) * Math.PI) : 0;
    if (e.enfouie) { el(g, x, y, 15, 5, 'rgba(120,84,44,0.35)'); el(g, x, y - 1, 11, 3.4, 'rgba(226,196,138,0.9)'); po(g, [x - 5, y - 2, x - 6.5, y - 9, x - 3, y - 3], '#8a6a44'); po(g, [x + 5, y - 2, x + 6.5, y - 9, x + 3, y - 3], '#8a6a44'); el(g, x - 2.6, y - 2.6, 1.2, 0.9, '#ffd24a'); el(g, x + 2.6, y - 2.6, 1.2, 0.9, '#ffd24a'); return; }
    const dresse = L.cobra && (e.dresse || e.crAnim > 0), n = dresse ? L.n - 4 : L.n;
    el(g, x - f * n * pas * 0.4, y + 2, n * pas * 0.55, L.gros * 0.9, 'rgba(0,0,0,0.22)');
    for (let i = n - 1; i >= 0; i--) { const k = i / (n - 1), px = x - f * i * pas, py = y - L.gros * 0.5 + Math.sin(onde - i * 0.75) * amp * (0.35 + k * 0.65), rr = L.gros * (i === 0 ? 1 : 1 - k * 0.55);
      el(g, px, py + rr * 0.3, rr * 1.05, rr * 0.8, L.ventre); el(g, px, py, rr * 1.05, rr * 0.82, i % 2 ? L.c2 : L.c1); if (i % 2 === 0) el(g, px - 1, py - rr * 0.3, rr * 0.5, rr * 0.25, 'rgba(255,255,255,0.14)'); }
    let hx = x + f * (L.gros * 0.9 + mord * 9), hy = y - L.gros * 0.7 + Math.sin(onde) * amp * 0.3;
    if (dresse) { const h = 26 * L.e, cr = e.crAnim > 0 ? Math.sin(e.crAnim / 0.35 * Math.PI) : 0; for (let i = 0; i < 6; i++) { const k = i / 5; el(g, x + f * (k * k * 5 + cr * 3 * k), y - 4 - k * h, L.gros * (1 - k * 0.15), L.gros * 0.95, i % 2 ? L.c2 : L.c1); }
      hx = x + f * (6 + cr * 6); hy = y - 6 - h; el(g, hx - f * 4, hy + 8, 10.5, 12, L.c1); el(g, hx - f * 3, hy + 9, 7, 9, L.ventre); po(g, [hx - f * 4 - 3, hy + 5, hx - f * 4, hy + 10, hx - f * 4 + 3, hy + 5], L.c2); /* la coiffe déployée et sa marque */ }
    el(g, hx, hy, L.gros * 1.35, L.gros * 1.05, L.c1); el(g, hx + f * L.gros * 0.5, hy + L.gros * 0.25, L.gros * 0.8, L.gros * 0.55, L.ventre);
    if (L.cornes) { po(g, [hx - f * 1, hy - L.gros * 0.8, hx - f * 2.5, hy - L.gros * 2.3, hx + f * 1.4, hy - L.gros * 0.9], '#6a4a2a'); po(g, [hx + f * 2, hy - L.gros * 0.8, hx + f * 2.6, hy - L.gros * 2.1, hx + f * 4.2, hy - L.gros * 0.8], '#6a4a2a'); }
    el(g, hx + f * L.gros * 0.45, hy - L.gros * 0.3, L.gros * 0.3, L.gros * 0.3, '#fff8e0'); el(g, hx + f * L.gros * 0.5, hy - L.gros * 0.3, L.gros * 0.13, L.gros * 0.26, L.oeil);
    if (mord > 0.2) { po(g, [hx + f * L.gros, hy, hx + f * (L.gros * 2 + 2), hy - 2.5, hx + f * (L.gros * 2 + 2), hy + 3.5], '#7a1a22'); g.fillStyle = '#fff'; g.fillRect(hx + f * L.gros * 1.5, hy - 2.2, 1.3, 3); }
    else if (Math.sin(t * 5 + (e.seed || 0)) > 0.72) { g.strokeStyle = '#d83a4a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(hx + f * L.gros * 1.2, hy + 1); g.lineTo(hx + f * (L.gros * 1.2 + 6), hy + 1); g.lineTo(hx + f * (L.gros * 1.2 + 9), hy - 1.4); g.moveTo(hx + f * (L.gros * 1.2 + 6), hy + 1); g.lineTo(hx + f * (L.gros * 1.2 + 9), hy + 3.2); g.stroke(); } /* sa langue fourchue */
  }
  function scorpion(g, e, t) {
    const f = e.face < 0 ? -1 : 1, x = e.x, y = e.y - 8, m = e.moving ? Math.sin((e.step || 0) * 6) : 0, pique = e.atkAnim > 0 ? Math.sin(Math.min(1, e.atkAnim) * Math.PI) : 0, C = '#8a5a2a', F = '#6a4220', Cl = '#b07a3c';
    el(g, x, e.y + 2, 20, 6, 'rgba(0,0,0,0.25)'); g.strokeStyle = F; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const lx = x - 8 + i * 5.5, d = (i % 2 ? m : -m) * 2.4; g.beginPath(); g.moveTo(lx, y + 3); g.lineTo(lx - 3 + d, y + 9); g.lineTo(lx - 5 + d, y + 11); g.moveTo(lx, y - 2); g.lineTo(lx - 2 - d, y - 8); g.stroke(); }
    for (let i = 3; i >= 0; i--) el(g, x - f * (i * 5 - 4), y + 1, 7.5 - i * 0.7, 6 - i * 0.5, i % 2 ? C : Cl); el(g, x + f * 9, y + 1, 6.5, 5.4, C); el(g, x + f * 11, y - 1, 1.3, 1.3, '#1a1010'); el(g, x + f * 12.5, y + 1.5, 1.1, 1.1, '#1a1010');
    for (const s of [-1, 1]) { const bx = x + f * 13, by = y + 1 + s * 5; g.strokeStyle = C; g.lineWidth = 2.6; g.beginPath(); g.moveTo(bx - f * 3, by - s * 2); g.lineTo(bx + f * 6, by + s * 3); g.stroke(); el(g, bx + f * 10, by + s * 4, 5, 3.4, Cl); po(g, [bx + f * 13, by + s * 2.6, bx + f * 19, by + s * 3 - 1.5, bx + f * 14, by + s * 4.4], F); po(g, [bx + f * 13, by + s * 5.4, bx + f * 18.5, by + s * 6.4, bx + f * 14, by + s * 4.6], F); }
    const q = []; for (let i = 0; i <= 5; i++) { const k = i / 5, a = Math.PI * (0.15 + k * (0.95 - pique * 0.45)); q.push([x - f * (16 + Math.sin(a) * 10 - k * (4 + pique * 22)), y - 2 - (1 - Math.cos(a)) * 13]); }
    for (let i = 0; i < q.length; i++) el(g, q[i][0], q[i][1], 4.4 - i * 0.35, 4 - i * 0.3, i % 2 ? Cl : C); const e5 = q[5]; po(g, [e5[0], e5[1] - 3, e5[0] + f * 9, e5[1] + 2 + pique * 3, e5[0], e5[1] + 3], '#3a2014'); el(g, e5[0] + f * 8, e5[1] + 2 + pique * 3, 1.3, 1.3, '#b8f070');
  }
  const NOM = { nomadeSabre: { robe: '#2f5a8a', robe2: '#254a74', turban: '#e8e0c8', ceinture: '#c8322a', s: 1 }, nomadeArcher: { robe: '#b88a4a', robe2: '#9a7038', turban: '#3a6a5a', ceinture: '#5a3a22', s: 0.97, arc: true }, nomadeChef: { robe: '#7a1e2a', robe2: '#5c1420', turban: '#1c1a22', ceinture: '#d8b040', s: 1.28, deux: true, plume: true } };
  function cimeterre(g, lg) { g.fillStyle = '#5a3a22'; g.fillRect(-1.3, -3, 2.6, 7); g.fillStyle = '#d8b040'; g.fillRect(-4, -4.4, 8, 2); g.fillStyle = '#e4e8f0'; g.beginPath(); g.moveTo(-1.6, -4.4); g.quadraticCurveTo(-2.5, -lg * 0.6, 4.5, -lg); g.quadraticCurveTo(7.5, -lg * 0.55, 1.8, -4.4); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(-1, -5); g.quadraticCurveTo(-1.6, -lg * 0.6, 4, -lg + 1); g.quadraticCurveTo(0.6, -lg * 0.6, 0, -5); g.closePath(); g.fill(); }
  function nomade(g, e, t) {
    const N = NOM[e.type], f = e.face < 0 ? -1 : 1, s = N.s, sw = e.moving ? Math.sin((e.step || 0) * TAU) : 0, bob = e.moving ? Math.abs(sw) * 1.5 : Math.sin(t * 2.4 + (e.seed || 0)) * 0.6, u = e.atkAnim > 0 ? 1 - Math.min(1, e.atkAnim) : -1;
    el(g, e.x, e.y + 1, 13 * s, 4.6 * s, 'rgba(0,0,0,0.26)'); g.save(); g.translate(e.x, e.y); g.scale(f * s, s);
    g.fillStyle = '#3a2a1e'; g.fillRect(-5.5 + sw * 2.4, -9, 4.4, 9); g.fillRect(1.2 - sw * 2.4, -9, 4.4, 9); el(g, -3 + sw * 2.4, 0, 3.6, 1.8, '#2a1c14'); el(g, 3.6 - sw * 2.4, 0, 3.6, 1.8, '#2a1c14');
    const by = -30 - bob; po(g, [-8.5, -7, -7, by + 3, 7, by + 3, 9, -7, 4, -5 + sw, -3, -5 - sw], N.robe); po(g, [1, -6, 2, by + 3, 7, by + 3, 9, -7], N.robe2); g.fillStyle = N.ceinture; g.fillRect(-7.6, -17 - bob, 15.8, 3); g.fillRect(3.4, -17 - bob, 2.4, 9);
    // le bras arrière, puis la tête, puis le bras qui frappe
    const sw2 = u < 0 ? 0.35 + sw * 0.4 : u < 0.3 ? 0.35 - (u / 0.3) * 2.3 : u < 0.6 ? -1.95 + ((u - 0.3) / 0.3) * 3.4 : 1.45 - ((u - 0.6) / 0.4) * 1.1;
    if (N.deux) { g.save(); g.translate(-6, by + 7); g.rotate(-0.5 - sw * 0.3 - (u >= 0 ? Math.sin(u * Math.PI) * 1.2 : 0)); g.fillStyle = N.robe2; g.fillRect(-2, 0, 4, 11); g.translate(0, 11); cimeterre(g, 21); g.restore(); }
    const hy = by - 5; el(g, 0, hy + 1, 6.4, 6.8, '#c98a5a'); po(g, [-6.6, hy + 2, 6.6, hy + 2, 6, hy + 8.5, -6, hy + 8.5], N.turban === '#1c1a22' ? '#2a2630' : '#d8ceb0'); /* le voile sur le bas du visage */
    el(g, 0, hy - 3.6, 7.6, 5, N.turban); el(g, -1.5, hy - 5.6, 6, 3.2, N.turban); g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(-7, hy - 3, 14, 1.2); g.fillRect(-6, hy - 5.6, 12, 1); po(g, [-6.5, hy - 2, -11, hy + 6 + Math.sin(t * 4) * 1.2, -7, hy + 2], N.turban);
    if (N.plume) { po(g, [1, hy - 7, 4, hy - 19, 6, hy - 7], '#d8b040'); el(g, 3, hy - 6.6, 2.2, 2.2, '#c8322a'); }
    el(g, 2.2, hy - 0.2, 1.3, 1.1, '#fff'); el(g, 4.8, hy - 0.2, 1.1, 1, '#fff'); el(g, 2.6, hy - 0.1, 0.7, 0.8, '#1a1210'); el(g, 5, hy - 0.1, 0.6, 0.8, '#1a1210'); g.fillStyle = '#1a1210'; g.fillRect(0.6, hy - 2.2, 3.2, 0.9); g.fillRect(4, hy - 2, 2.4, 0.8);
    g.save(); g.translate(5.5, by + 7);
    if (N.arc) { const tire = u >= 0 && u < 0.6 ? Math.min(1, u / 0.3) : 0; g.rotate(-1.35); g.fillStyle = N.robe; g.fillRect(-2, 0, 4, 11); g.translate(0, 12); g.strokeStyle = '#6a4424'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-13, -2); g.quadraticCurveTo(0, 9, 13, -2); g.stroke(); g.strokeStyle = '#efe6d0'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-13, -2); g.lineTo(0, -2 - tire * 7); g.lineTo(13, -2); g.stroke(); if (tire > 0) { g.fillStyle = '#d8c8a0'; g.fillRect(-0.6, -2 - tire * 7, 1.2, 13); } }
    else { g.rotate(sw2); g.fillStyle = N.robe; g.fillRect(-2.2, 0, 4.4, 11); el(g, 0, 11.5, 2.6, 2.4, '#c98a5a'); g.translate(0, 11); g.rotate(-0.5); cimeterre(g, N.deux ? 23 : 20); if (u >= 0.3 && u < 0.62) { g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 19, -1.9, -0.6); g.stroke(); } }
    g.restore(); g.restore();
  }
  const ae0 = Art.enemy; Art.enemy = function (g, e, t) {
    if (!e || !e.type) return ae0.apply(this, arguments); const tt = (t || 0) + (e.seed || 0);
    try { if (SERP[e.type]) return serpent(g, e, tt); if (e.type === 'scorpionGeant') return scorpion(g, e, tt); if (NOM[e.type]) return nomade(g, e, tt); } catch (x) { return; }
    return ae0.apply(this, arguments);
  };
  // pas de feuilles mortes dans le sable
  if (CG.Tas && CG.Tas.tirer) { const ti0 = CG.Tas.tirer; CG.Tas.tirer = function () { const l = ti0.apply(this, arguments); if (!ici() || !plan || !CG.S.tas) return l; CG.S.tas.l = CG.S.tas.l.filter(q => !Ds.dans(q.x, q.y)); return CG.S.tas.l; }; }
  Ds.essai = k => { const p = CG.S.player, e = G.spawnEnemy(k, p.x + 90, p.y, { wild: true }); if (e) e.desert = true; return e; };
})(window.CG);
