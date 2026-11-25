// Goblin Malin — deux mondes : la forêt du départ, et le marais derrière le portail démoniaque du nord.
// Chaque monde garde tout ce qui lui appartient (village, gobelins, réserves, jour et heure) : quand le chef est dans l'un, l'autre est figé.
// Le chef, lui, emporte ce qu'il est : niveau, sorts, équipement, technologies, et les animaux qui le suivent.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, T = CG.TILE, Mo = CG.Mondes = {};
  const rand = CG.rand, pick = CG.pick, dist = CG.dist, TAU = Math.PI * 2;
  // ce qui suit le chef d'un monde à l'autre ; tout le reste de la sauvegarde appartient au monde où l'on est
  const GLOBAL = ['v', 'seed', 'name', 'player', 'tech', 'nextId', 'diff', 'stats', 'chefEvo', 'chefFun', 'chefHat', 'chefHatOwned', 'statBuffs', 'autelsDone', 'policy', 'monde', 'ailleurs', 'demon', 'chef2', 'dehors', 'pyramide', 'secretsVu'];
  Mo.GLOBAL = GLOBAL;
  Mo.NOMS = ['la forêt', 'le marais'];
  Mo.ici = () => (CG.S && CG.S.monde) || 0;
  Mo.marais = () => Mo.ici() === 1;
  Mo.ouvert = () => !!(CG.S && CG.S.demon && CG.S.demon.mort);
  const bati = (S, type) => (S.buildings || []).some(b => b.type === type && !b.site);
  Mo.feuIci = () => Mo.ici() === 0 || CG.S.buildings.some(b => b.type === 'fire');
  Mo.pretLaBas = () => { const a = CG.S.ailleurs; return !!a && (Mo.marais() || (bati(a, 'fire') && bati(a, 'chief'))); };
  Mo.portailPos = () => { const po = W.POI.portail; return { x: po.x * T + T / 2, y: (po.y - 2) * T }; };
  Mo.devantPortail = () => { const q = Mo.portailPos(); return { x: q.x, y: q.y + 56 }; };

  // ---------- la carte du marais ----------
  const POI0 = JSON.parse(JSON.stringify(W.POI)), GRAVE0 = Object.assign({}, W.GRAVE), C0 = { x: W.CX, y: W.CY }, C1 = { x: 46, y: 22 };
  const POI1 = { baies: { x: 20, y: 26, r: 4 }, chasse: { x: 72, y: 24, r: 5 }, mine: { x: 24, y: 54, r: 5 }, etang: { x: 60, y: 46, r: 4 }, ruines: { x: 82, y: 12, r: 5 }, portail: { x: 45, y: 6, r: 4 },
    cache: { x: 9, y: 10, r: 3 }, nid: { x: 13, y: 62, r: 4 }, ile: { x: 50, y: 62, r: 3 }, clairiere: { x: 33, y: 38, r: 3 }, lezards: { x: 80, y: 58, r: 8 } };
  const GRAVE1 = { x: 90, y: 36, r: 3 };
  const gen0 = W.generate;
  // le marais est deux fois plus vaste que la forêt : la carte change de taille quand on change de monde, et les sorties suivent ses bords
  const EX0 = JSON.parse(JSON.stringify(W.EXITS)), EX1 = { ouest: { x: 1, y: 35 }, est: { x: CG.MW1 - 2, y: 52 }, sud: { x: 70, y: CG.MH1 - 2 }, nord: { x: 45, y: 5 } };
  function taille(grand) {
    CG.MW = grand ? CG.MW1 : CG.MW0; CG.MH = grand ? CG.MH1 : CG.MH0; Object.keys(EX0).forEach(k => Object.assign(W.EXITS[k], (grand ? EX1 : EX0)[k]));
    const m = document.getElementById('mini'); if (m && m.width !== CG.MW * 2) { m.width = CG.MW * 2; m.height = CG.MH * 2; }
  }
  Mo.taille = taille;
  // un marais d'avant l'agrandissement : ses cases étaient numérotées sur 96 de large, on les renumérote (rien ne bouge de place)
  function agrandir() {
    const S = CG.S; if (!S || S.carteL === CG.MW1) return; const L0 = CG.MW0, L1 = CG.MW1, f = i => { i = +i; const x = i % L0; return (i - x) / L0 * L1 + x; };
    if (S.cuts) S.cuts = S.cuts.map(f); if (S.young) S.young = S.young.map(f); if (S.terra) { const t = {}; Object.keys(S.terra).forEach(k => { t[f(k)] = S.terra[k]; }); S.terra = t; } if (S.cheminM) { const t = {}; Object.keys(S.cheminM).forEach(k => { t[f(k)] = 1; }); S.cheminM = t; }
    S.carteL = L1;
  }
  function poser(P, GR, C) { Object.keys(W.POI).forEach(k => { if (!P[k]) delete W.POI[k]; }); Object.keys(P).forEach(k => { W.POI[k] = Object.assign(W.POI[k] || {}, P[k]); }); Object.assign(W.GRAVE, GR); W.CX = C.x; W.CY = C.y; }
  function genMarais(seed) {
    poser(POI1, GRAVE1, C1); gen0.call(W, seed);
    const tile = W.tile, noise = W.noise, rng = CG.makeRng(seed + 31), I = W.idx, P = W.POI;
    for (let y = 0; y < CG.MH; y++) for (let x = 0; x < CG.MW; x++) {
      const bord = x < 2 || y < 2 || x >= CG.MW - 2 || y >= CG.MH - 2, n = noise(x / 7 + 3.3, y / 7 + 9.1), m = noise(x / 3 + 50, y / 3 + 20), d = Math.hypot((x - C1.x) * 0.9, (y - C1.y) * 1.1);
      let t = W.GRASS;
      if (bord) t = rng() < 0.96 ? W.TREE : W.GRASS;
      else if (d < 8) t = W.GRASS;
      else if (n > 0.63) t = W.WATER;                                    // les mares du marais
      else if (n * 0.55 + m * 0.45 > 0.52) t = rng() < 0.6 ? W.TREE : W.GRASS;
      else t = rng() < 0.07 ? W.TREE : W.GRASS;
      tile[I(x, y)] = t;
    }
    const set = (x, y, t) => { if (x >= 1 && y >= 1 && x < CG.MW - 1 && y < CG.MH - 1) tile[I(x, y)] = t; };
    const glade = g => { for (let y = -g.r - 1; y <= g.r + 1; y++) for (let x = -g.r - 1; x <= g.r + 1; x++) if (Math.hypot(x, y) < g.r - 0.6 + rng() * 1.2) set(g.x + x, g.y + y, W.GRASS); };
    Object.values(P).forEach(glade); glade(W.GRAVE);
    const carve = (a, b, wob) => { // des levées de terre qui traversent les mares
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2), ph = rng() * 6, px = -(b.y - a.y), py = b.x - a.x, pl = Math.hypot(px, py) || 1;
      for (let i = 0; i <= n; i++) { const k = i / n, s = Math.sin(k * Math.PI) * Math.sin(k * 7 + ph) * (wob === undefined ? 2.2 : wob), x = Math.round(a.x + (b.x - a.x) * k + px / pl * s), y = Math.round(a.y + (b.y - a.y) * k + py / pl * s);
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (W.inMap(x + dx, y + dy)) tile[I(x + dx, y + dy)] = W.PATH; }
    };
    const C = C1, E = W.EXITS;
    carve(C, P.portail, 1.2); carve(C, P.clairiere); carve(P.clairiere, E.ouest); carve(C, P.chasse); carve(P.chasse, E.est); carve(P.clairiere, P.baies, 1.4); carve(P.clairiere, P.mine);
    if (CG.Marecage) CG.Marecage.terrain({ set, glade, carve, rng, tile, I, P, E, C }); // les terres nouvelles, à l'est et au sud (marecage.js)
    carve(P.mine, P.nid, 1.4); carve(P.clairiere, P.etang); carve(P.etang, P.ile, 1.5); carve(P.ile, E.sud, 1.2); carve(P.etang, P.lezards, 1.6); carve(P.chasse, P.ruines, 1.5); carve(P.baies, P.cache, 1.3); carve(P.etang, W.GRAVE, 1.5);
    Object.values(E).forEach(e => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (W.inMap(e.x + dx, e.y + dy)) tile[I(e.x + dx, e.y + dy)] = W.PATH; });
    const nodes = W.nodes = [];
    for (let a = 2.2; a < 5.4; a += 0.16) { const r = P.mine.r - 0.4 + rng() * 1.6; set(Math.round(P.mine.x + Math.cos(a) * r), Math.round(P.mine.y + Math.sin(a) * r), W.ROCK); }
    for (let i = 0; i < 6; i++) { const a = 2.5 + i * 0.5, x = Math.round(P.mine.x + Math.cos(a) * 2.6), y = Math.round(P.mine.y + Math.sin(a) * 2.6); set(x, y, W.GRASS); nodes.push({ type: 'ore', x, y }); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rng() * 0.4, r = 2 + rng() * 1.6, x = Math.round(P.baies.x + Math.cos(a) * r), y = Math.round(P.baies.y + Math.sin(a) * r); set(x, y, W.GRASS); nodes.push({ type: 'bush', x, y }); }
    for (let i = 0; i < 3; i++) { const x = P.clairiere.x - 1 + i, y = P.clairiere.y - 2 + (i % 2); set(x, y, W.GRASS); nodes.push({ type: 'bush', x, y }); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.5, r = 3 + rng() * 1.5, x = Math.round(P.chasse.x + Math.cos(a) * r), y = Math.round(P.chasse.y + Math.sin(a) * r); set(x, y, W.GRASS); nodes.push({ type: 'game', x, y }); }
    // un vieux temple englouti
    for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) set(P.ruines.x + x, P.ruines.y + y, W.FLOOR);
    for (let x = -4; x <= 4; x++) { if (x !== 0 && rng() < 0.8) set(P.ruines.x + x, P.ruines.y - 3, W.WALL); if (Math.abs(x) > 1 && rng() < 0.75) set(P.ruines.x + x, P.ruines.y + 3, W.WALL); }
    for (let y = -2; y <= 2; y++) { if (rng() < 0.75) set(P.ruines.x - 4, P.ruines.y + y, W.WALL); if (y !== 0 && rng() < 0.75) set(P.ruines.x + 4, P.ruines.y + y, W.WALL); }
    // le grand campement des hommes-lézards : une enceinte, deux entrées (ouest et nord), une place au milieu
    { const L = P.lezards, ecart = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
      for (let y = -7; y <= 7; y++) for (let x = -8; x <= 8; x++) if ((x * x) / 64 + (y * y) / 49 < 1) set(L.x + x, L.y + y, W.GRASS);
      for (let a = 0; a < TAU; a += 0.07) { if (ecart(a, Math.PI) < 0.3 || ecart(a, -Math.PI / 2) < 0.3) continue; set(Math.round(L.x + Math.cos(a) * 7.4), Math.round(L.y + Math.sin(a) * 6.4), W.WALL); }
      for (let y = -1; y <= 1; y++) for (let x = -2; x <= 2; x++) set(L.x + x, L.y + y, W.FLOOR); }
    W.chestDefs = []; W.wildDefs = []; W.ponds = [];
    W.sites = [
      { k: 'ruines', x: P.ruines.x, y: P.ruines.y, r: 3, base: 3, mobs: [['lezard', 1], ['chamanLezard', 1], ['basilic', 1]] },
      { k: 'nid', x: P.nid.x, y: P.nid.y, r: 3, base: 3, mobs: [['cracheuse', 1]] },
      { k: 'ile', x: P.ile.x, y: P.ile.y, r: 2, base: 2, mobs: [['geleeRouge', 1], ['crapaud', 1]] },
      { k: 'cache', x: P.cache.x, y: P.cache.y, r: 2, base: 2, mobs: [['crapaud', 1], ['geleeRouge', 1]] },
      { k: 'lezards', x: P.lezards.x, y: P.lezards.y, r: 5, base: 5, mobs: [['lezard', 1], ['lezardCav', 1], ['chamanLezard', 1]] }
    ];
    if (CG.Pyramide) CG.Pyramide.poser(set);
    const f = CG.S && (CG.S.buildings || []).find(b => b.type === 'fire'); if (f) { W.CX = f.tx; W.CY = f.ty; }
    W.fieldDirty = true; W.miniDirty = true;
  }
  W.generate = function (seed) { taille(Mo.marais()); if (Mo.marais()) agrandir(); if (Mo.ici() === 2 && CG.Pyramide) { poser(POI1, GRAVE1, C1); return CG.Pyramide.generer(seed, gen0); } if (Mo.marais()) return genMarais(seed + 9173); poser(POI0, GRAVE0, C0); return gen0.apply(this, arguments); };

  // le terrain : celui de la forêt, assombri et verdi, avec de la vase, des champignons qui luisent et des bulles dans les mares
  const paint0 = W.paint;
  W.paint = function () {
    paint0.apply(this, arguments); if (!Mo.marais()) return;
    [W.terrain, W.ground].forEach(c => { const g = c.getContext('2d'); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#a4a888'; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(40,66,58,0.2)'; g.fillRect(0, 0, c.width, c.height); g.restore(); });
    const g = W.terrain.getContext('2d'), rng = CG.makeRng(W.seed + 9), at = (x, y) => W.tile[W.idx(CG.clamp(Math.floor(x / T), 0, CG.MW - 1), CG.clamp(Math.floor(y / T), 0, CG.MH - 1))];
    for (let i = 0; i < 1500; i++) { const x = rng() * CG.MW * T, y = rng() * CG.MH * T, t = at(x, y); if (t !== W.GRASS && t !== W.TREE) continue; g.fillStyle = rng() < 0.6 ? 'rgba(52,44,28,0.26)' : 'rgba(30,60,50,0.22)'; g.beginPath(); g.ellipse(x, y, 10 + rng() * 22, 6 + rng() * 12, rng() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 520; i++) { const x = rng() * CG.MW * T, y = rng() * CG.MH * T, t = at(x, y), k = rng();
      if (t === W.WATER) { g.strokeStyle = 'rgba(190,230,170,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 1.5 + k * 3, 0, TAU); g.stroke(); continue; }
      if (t !== W.GRASS) continue; const col = k < 0.5 ? '#c58adf' : '#8fe0c0';
      g.fillStyle = 'rgba(255,255,255,0.1)'; g.beginPath(); g.arc(x, y - 4, 7, 0, TAU); g.fill(); g.fillStyle = '#e8e2d0'; g.fillRect(x - 1, y - 4, 2, 5); g.fillStyle = col; g.beginPath(); g.ellipse(x, y - 4, 4.2, 2.8, 0, Math.PI, 0); g.fill(); }
  };
  const mini0 = W.drawMini;
  W.drawMini = function () { mini0.apply(this, arguments); if (!Mo.marais()) return; const g = W.mini.getContext('2d'); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#9aa48a'; g.fillRect(0, 0, W.mini.width, W.mini.height); g.restore(); };

  // les arbres du marais : troncs morts, saules qui pleurent, palétuviers sur leurs racines
  const arbres = {};
  function arbre(v, nu) {
    const cle = v + (nu ? 'n' : ''); if (arbres[cle]) return arbres[cle];
    const s = arbres[cle] = document.createElement('canvas'), c = s.getContext('2d'), rng = CG.makeRng(v * 17 + 3); s.width = 96; s.height = 146; c.translate(0, 16); c.lineCap = 'round';
    const ell = (x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }, li = (x1, y1, x2, y2, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    if (!nu) ell(48, 118, 24, 8, 'rgba(0,0,0,0.28)');
    if (v === 0) { // tronc mort
      li(48, 118, 46, 60, '#3a3028', 11); li(46, 62, 44, 34, '#3a3028', 7); li(46, 76, 26, 52, '#3a3028', 5); li(26, 52, 20, 36, '#3a3028', 3); li(46, 66, 68, 44, '#3a3028', 5); li(68, 44, 76, 26, '#3a3028', 3); li(68, 44, 82, 42, '#3a3028', 2.5); li(44, 36, 36, 18, '#3a3028', 3); li(44, 36, 54, 16, '#3a3028', 3);
      li(44, 116, 43, 62, 'rgba(255,255,255,0.08)', 3); ell(40, 84, 6, 3, 'rgba(110,150,90,0.6)'); ell(54, 100, 5, 2.6, 'rgba(110,150,90,0.6)');
    } else if (v === 1) { // saule pleureur
      li(48, 118, 48, 62, '#4a3a26', 12); li(45, 116, 45, 66, 'rgba(0,0,0,0.2)', 4);
      [[48, 46, 34], [28, 54, 22], [68, 54, 22], [48, 30, 24]].forEach(([x, y, r], i) => ell(x, y, r, r * 0.9, 'hsl(' + (96 - i * 4) + ',30%,' + (22 + i * 3) + '%)'));
      for (let i = 0; i < 15; i++) { const x = 14 + i * 5 + rng() * 3, y0 = 46 + rng() * 22, L = 26 + rng() * 30; c.strokeStyle = 'hsla(' + (88 + rng() * 20) + ',34%,' + (26 + rng() * 10) + '%,0.9)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + (rng() - 0.5) * 8, y0 + L * 0.5, x + (rng() - 0.5) * 6, y0 + L); c.stroke(); }
      for (let i = 0; i < 10; i++) ell(22 + rng() * 52, 16 + rng() * 44, 4 + rng() * 5, 3 + rng() * 4, 'rgba(150,180,90,0.3)');
    } else { // palétuvier
      for (let i = 0; i < 5; i++) { const x = 30 + i * 9; c.strokeStyle = '#3e3020'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(48, 84); c.quadraticCurveTo(x, 96, x - (48 - x) * 0.5, 118); c.stroke(); }
      li(48, 90, 48, 56, '#4a3a26', 9);
      [[48, 44, 32, 20], [30, 50, 20, 14], [66, 48, 22, 15], [48, 28, 22, 14]].forEach(([x, y, rx, ry], i) => ell(x, y, rx, ry, 'hsl(' + (150 + i * 5) + ',28%,' + (18 + i * 3) + '%)'));
      for (let i = 0; i < 12; i++) ell(22 + rng() * 52, 18 + rng() * 36, 4 + rng() * 5, 3 + rng() * 3, 'rgba(120,190,150,0.26)');
      for (let i = 0; i < 6; i++) { const x = 24 + rng() * 48; li(x, 56 + rng() * 6, x + (rng() - 0.5) * 4, 70 + rng() * 14, 'rgba(120,150,90,0.7)', 1.4); }
    }
    return s;
  }
  const tree0 = Art.tree;
  Art.tree = function (g, tx, ty, rot, sc, nu) {
    if (!Mo.marais()) return tree0.apply(this, arguments);
    const h = W.hash(tx, ty), s = arbre(Math.floor(h * 3), nu), bx = tx * T + T / 2 + (W.hash(ty, tx) - 0.5) * 12, by = ty * T + T / 2 + (h * 7 % 1 - 0.5) * 8 + 14;
    if (rot || sc) { g.save(); g.translate(bx, by); if (rot) g.rotate(rot); if (sc) g.scale(sc, sc); g.drawImage(s, -48, -134); g.restore(); } else g.drawImage(s, bx - 48, by - 134);
  };

  // ---------- passer d'un monde à l'autre ----------
  const neuf = d => ({ day: d.day, hour: 8, morale: 70, res: { food: 30, bois: 60, minerai: 0, cuir: 0, or: 0 }, goblins: [], pets: [], buildings: [], cuts: [], logs: [], young: [], chests: [], terra: {} });
  let voileEl = null;
  function voile() { if (!voileEl) { voileEl = document.createElement('div'); voileEl.id = 'mo-voile'; document.body.appendChild(voileEl); } voileEl.className = ''; void voileEl.offsetWidth; voileEl.className = 'on'; }
  Mo.partir = function (par) {
    const R = CG.R; if (Mo.pending || R.night || R.cine || R.ko > 0) return false;
    if (R.alarm) { CG.sfx('no'); UI.toast('Pas pendant une attaque : ton village a besoin de toi.'); return false; }
    if (R.mount && CG.Monture && CG.Monture.off) CG.Monture.off();
    Mo.pending = { par, t: 0.75 }; R.invuln = Math.max(R.invuln || 0, 2.5); R.build = null; if (CG.Bt && CG.Bt.open) CG.Bt.toggle(false); CG.sfx('spell'); voile();
    const p = CG.S.player; for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 50 + i * 40, life: 0.4 + i * 0.15, col: '#c070ff' }); G.puff(p.x, p.y - 20, '#c070ff', 30, 170, 4);
    return true;
  };
  function basculer(par) {
    if (par === 'pyramide' || par === 'dehors') return CG.Pyramide.basculer(par);
    const S = CG.S, cible = 1 - Mo.ici(); if (UI.modal) UI.close();
    const suiv = G.tech('b24') ? S.pets.filter(a => a.follow && !a.ko).map(a => a.id) : [];
    const data = JSON.parse(JSON.stringify(CG.pack())), ici = {}; Object.keys(data).forEach(k => { if (!GLOBAL.includes(k)) ici[k] = data[k]; });
    const partent = ici.pets.filter(a => suiv.includes(a.id)); ici.pets = ici.pets.filter(a => !suiv.includes(a.id));
    const demG = S.goblins.filter(g => g.demenage && !g.hidden).map(g => g.id), partG = ici.goblins.filter(g => demG.includes(g.id)); ici.goblins = ici.goblins.filter(g => !demG.includes(g.id)); // ceux qui déménagent avec le chef
    const premier = !data.ailleurs, la = data.ailleurs || neuf(data), N = {};
    GLOBAL.forEach(k => { if (data[k] !== undefined) N[k] = data[k]; }); Object.keys(la).forEach(k => { if (!GLOBAL.includes(k)) N[k] = la[k]; });
    N.monde = cible; N.ailleurs = ici; N.pets = (N.pets || []).concat(partent);
    N.goblins = (N.goblins || []).concat(partG.map(g => { g.home = Math.max(0, (N.buildings || []).findIndex(b => b.type === 'chief')); return g; }));
    const h0 = N.hour, hp = N.player.hp, mp = N.player.mp;
    CG.S = N; G.initRuntime(); D.startDay();
    const R = CG.R, q = N.player; q.hp = hp; q.mp = mp; N.hour = Math.min(h0, 23.5);
    (R.schedule || []).forEach(e => { if (e.h <= N.hour) e.done = true; }); R.eveningSaid = N.hour >= 19;
    if (N.feastDay === N.day && Mo.feuIci()) { R.feast = true; R.feastOk = true; R.fireLit = true; }
    const f = G.firePos(), a = par === 'sort' ? { x: f.x + 46, y: f.y + 28 } : Mo.devantPortail();
    q.x = a.x; q.y = a.y; G.unstick(q, 9);
    N.pets.forEach(o => { if (suiv.includes(o.id)) { o.x = q.x - 30 + rand(-14, 14); o.y = q.y + 16; o.path = null; } });
    N.goblins.forEach(o => { if (demG.includes(o.id)) { o.x = q.x + 30 + rand(-16, 16); o.y = q.y + 18 + rand(-6, 10); o.path = null; o.hidden = false; G.unstick(o, 8); } });
    W.drawMini(); R.invuln = 2.5; G.puff(q.x, q.y - 20, '#e0b0ff', 34, 190, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: q.x, y: q.y - 10, r: 60 + i * 44, life: 0.5 + i * 0.15, col: '#e0b0ff' });
    if (cible === 1) G.banner(premier ? 'Le marais' : 'De retour au marais', premier ? 'Un autre monde, de l\'autre côté du portail. Tu es seul : bâtis ta hutte de chef (B). Pour le feu de camp, va voir le Feu du clan dans tes technologies (T).' : 'Rien n\'a bougé depuis ton départ.', '#b8e8c0');
    else G.banner('De retour dans la forêt', 'Ton village t\'attendait : rien n\'a bougé depuis ton départ.', '#ffe9a8');
    if (premier && cible === 1) setTimeout(() => { if (CG.S === N) UI.toast('🌀 Le portail derrière toi s\'est refermé. Il ne se rouvrira que lorsque ta hutte de chef sera bâtie ici.'); }, 5200);
    try { CG.save(); } catch (e) { /* rien */ }
  }
  const du0 = D.update; D.update = function (dt) {
    if (Mo.pending) { Mo.pending.t -= dt; if (Mo.pending.t <= 0) { const q = Mo.pending; Mo.pending = null; basculer(q.par); } return; }
    return du0.apply(this, arguments);
  };

  // ---------- le portail du nord ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    let it = fi0.apply(this, arguments); const S = CG.S, R = CG.R, p = S.player; if (R.ko > 0 || R.cine || R.build) return it;
    if (Mo.ici() !== 0 && !S.buildings.some(b => b.type === 'chief')) { if (it && it.type === 'home') it = null; else if (it && it.type === 'sleep') it.label = 'Dormir à la belle étoile jusqu\'au matin'; }
    if (Mo.ici() !== 2 && (Mo.ouvert() || Mo.marais()) && (!it || it.type === 'home' || it.type === 'sleep')) {
      const q = Mo.portailPos(); if (Math.hypot(p.x - q.x, p.y - (q.y + 24)) < 60) return { type: 'portailDemon', obj: { x: q.x, y: q.y - 24 }, label: !Mo.marais() ? 'Entrer dans le portail démoniaque' : bati(S, 'chief') ? 'Reprendre le portail vers la forêt' : 'Portail fermé : bâtis d\'abord ta hutte de chef' };
    }
    return it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'portailDemon') return in0.apply(this, arguments);
    if (Mo.marais() && !bati(CG.S, 'chief')) { CG.sfx('no'); return UI.toast('Le portail reste fermé. Bâtis ta hutte de chef (B, onglet Habitations) : c\'est elle qui t\'ancre dans ce monde.'); }
    Mo.partir('portail');
  };

  // ---------- le sort : Rappel ----------
  // Il ouvre un portail vers un de tes villages. Un seul village : c'est le portail bleu habituel, vers celui de ce monde.
  // Deux villages (un feu et une hutte de chef dans l'autre monde) : on choisit lequel. Le portail violet mène à l'autre monde.
  CG.SPELLS.mondes = { nom: 'Rappel', icon: '🌀', mp: 30, prix: 0, desc: 'Ouvre un portail à côté de toi, vers un de tes villages : entre dedans pour arriver près de son feu. Si tu as un village dans chaque monde (un feu de camp et une hutte de chef), tu choisis lequel. Le monde que tu quittes reste figé jusqu\'à ton retour.', color: '#c070ff' };
  if (CG.Effets && CG.Effets.FICHE) CG.Effets.FICHE.mondes = ['🌀', null, 'Portail ouvert 1 minute'];
  Mo.PORTAIL = 60;
  let direct = false;
  const peut = id => { const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night || Mo.pending) return false; if (p.mp < G.spellCost(id)) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return false; } return true; };
  function bleu(id) { // le portail bleu du sort Retour, payé au prix du sort lancé
    const S = CG.S, R = CG.R, p = S.player, mp0 = p.mp; direct = true; try { p.mp = Math.max(p.mp, G.spellCost('retour')); R.castCd = 0; cast0.call(G, 'retour'); } finally { direct = false; }
    if (R.portail) p.mp = mp0 - G.spellCost(id); else p.mp = mp0;
  }
  function violet(id) {
    const S = CG.S, R = CG.R, p = S.player; if (R.alarm) { CG.sfx('no'); return UI.toast('Pas pendant une attaque : ton village a besoin de toi.'); }
    let x = p.x + (p.face < 0 ? -46 : 46), y = p.y; if (!W.walkPx(x, y)) x = p.x - (p.face < 0 ? -46 : 46); if (!W.walkPx(x, y)) { x = p.x; y = p.y + 40; } if (!W.walkPx(x, y)) { x = p.x; y = p.y; }
    p.mp -= G.spellCost(id); R.castCd = 0.6; R.castAnim = 1; CG.sfx('spell'); R.portailM = { x, y, t: Mo.PORTAIL, age: 0, arme: Math.hypot(p.x - x, p.y - y) > 30 };
    for (let i = 0; i < 3; i++) R.rings.push({ x, y: y - 20, r: 40 + i * 30, life: 0.4 + i * 0.15, col: '#c070ff' }); G.puff(x, y - 24, '#c070ff', 24, 150, 4); G.text(x, y - 96, '🌀 Vers ' + Mo.NOMS[1 - Mo.ici()], '#e0b0ff', true);
  }
  function choisir(id) {
    const ici = Mo.NOMS[Mo.ici()], la = Mo.NOMS[1 - Mo.ici()], nom = s => s.replace(/^l[ea] /, '');
    UI.dialog({ who: CG.SPELLS[id].nom, tag: '🌀 deux villages', text: 'Tu as un village dans chaque monde. Vers lequel ouvrir le portail ?', options: [
      { label: '🏠 Le village de ' + ici, sub: 'Un portail bleu vers le feu de ce monde-ci', fn: () => { if (peut(id)) bleu(id); } },
      { label: '🌀 Le village d' + (/^le /.test(la) ? 'u ' : 'e la ') + nom(la), sub: 'Un portail violet vers l\'autre monde : celui-ci restera figé jusqu\'à ton retour', fn: () => { if (peut(id)) violet(id); } },
      { label: 'Annuler' }] });
  }
  const cast0 = G.cast; G.cast = function (id) {
    if (direct || (id !== 'mondes' && id !== 'retour')) return cast0.apply(this, arguments);
    const S = CG.S, deux = S.player.spells.includes('mondes') && Mo.pretLaBas();
    if (id === 'retour' && !deux) return cast0.apply(this, arguments);
    if (!peut(id)) return;
    if (deux) return choisir(id);
    bleu(id); // un seul village : le portail s'ouvre vers lui
  };
  // le portail violet : ouvert une minute, on y entre en marchant dedans ou avec E
  const guP = G.update; G.update = function (dt) {
    guP.apply(this, arguments); const R = CG.R, P = R && R.portailM; if (!P) return; const p = CG.S.player, d = Math.hypot(p.x - P.x, p.y - P.y);
    P.t -= dt; P.age += dt; if (P.t <= 0 || R.night) { G.puff(P.x, P.y - 30, '#c070ff', 16, 140, 3); R.portailM = null; return; }
    if (!P.arme) { if (d > 30) P.arme = true; } else if (d < 17 && !(R.ko > 0) && !R.cine && !Mo.pending) { if (Mo.partir('sort')) R.portailM = null; else P.arme = false; }
  };
  const fiP = D.findInteract; D.findInteract = function () { const R = CG.R, P = R.portailM, p = CG.S.player; if (P && !R.build && !(R.ko > 0) && Math.hypot(p.x - P.x, p.y - P.y) < 58) return { type: 'portailViolet', obj: { x: P.x, y: P.y - 46 }, label: 'Entrer dans le portail vers ' + Mo.NOMS[1 - Mo.ici()] }; return fiP.apply(this, arguments); };
  const inP = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'portailViolet') { if (Mo.partir('sort')) CG.R.portailM = null; return; } return inP.apply(this, arguments); };
  const mkP = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mkP.apply(this, arguments); const P = CG.R.portailM; if (!P || !CG.onScreen(P.x, P.y)) return; const k = Math.min(1, P.age / 0.4), a = Math.min(1, P.t / 1.5), y = P.y - 34;
    g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(P.x, P.y + 4, 24 * k, 7 * k, 0, 0, TAU); g.fill();
    [['rgba(70,20,120,0.92)', 1], ['rgba(140,60,220,0.9)', 0.8], ['rgba(220,160,255,0.85)', 0.5], ['rgba(255,240,255,0.9)', 0.2]].forEach(c => { g.fillStyle = c[0]; g.beginPath(); g.ellipse(P.x, y, 22 * k * c[1], 40 * k * c[1], 0, 0, TAU); g.fill(); });
    g.strokeStyle = 'rgba(240,200,255,0.85)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const an = t * 2.4 + i * 2.1; g.beginPath(); g.ellipse(P.x, y, 22 * k * (0.9 - i * 0.2), 40 * k * (0.9 - i * 0.2), 0, an, an + 1.6); g.stroke(); }
    for (let i = 0; i < 6; i++) { const an = t * 1.7 + i * 1.05, r = 30 + Math.sin(t * 3 + i) * 6; g.fillStyle = 'rgba(230,180,255,0.9)'; g.fillRect(P.x + Math.cos(an) * r * 0.75 - 1.5, y + Math.sin(an) * r * 1.3 - 1.5, 3, 3); }
    const s = Math.ceil(P.t); g.font = 'bold 12px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 3.5; g.lineJoin = 'round'; g.strokeStyle = 'rgba(40,8,60,0.85)'; g.strokeText(s + ' s', P.x, P.y - 92); g.fillStyle = s <= 10 ? '#ffb0a0' : '#f0d8ff'; g.fillText(s + ' s', P.x, P.y - 92);
    g.restore();
  };

  // ---------- bâtir au marais : la hutte du chef, le feu, la réserve ; et dans la forêt, la hutte du sous-chef ----------
  CG.BUILDS.chief = { nom: 'Hutte du chef', icon: '🏠', w: 3, h: 2, cat: 'clan', cout: { bois: 40 }, desc: 'Ta hutte dans ce monde : tu y dors, et elle rouvre le portail vers la forêt. Une seule.' };
  CG.BUILDS.fire = { nom: 'Feu de camp', icon: '🔥', w: 1, h: 1, cat: 'clan', cout: { bois: 10 }, desc: 'Le cœur du village : la fête du soir, et l\'endroit où t\'amène le sort Rappel. Un seul. Laisse de la place autour.' };
  CG.BUILDS.stock = { nom: 'Réserve', icon: '📦', w: 2, h: 1, cat: 'clan', cout: { bois: 15 }, desc: 'Là où tes gobelins déposent ce qu\'ils rapportent. Une seule.' };
  CG.BUILDS.souschef = { nom: 'Hutte du sous-chef', icon: '👑', w: 2, h: 2, cat: 'clan', cout: { bois: 40, or: 30 }, desc: 'Une fois bâtie, parle à un gobelin pour l\'élire sous-chef : c\'est à lui que les autres iront poser leurs questions.' };
  const bu0 = G.buildUnlocked; G.buildUnlocked = function (k) {
    const S = CG.S; if (!S) return false; const deja = S.buildings.some(b => b.type === k);
    if (k === 'chief' || k === 'fire' || k === 'stock') return Mo.marais() && !deja;
    if (k === 'souschef') return !Mo.marais() && !!S.chef2 && !deja;
    return bu0.apply(this, arguments);
  };
  const mh0 = G.buildMaxHp; G.buildMaxHp = b => b.type === 'chief' || b.type === 'souschef' ? 0 : mh0(b); // comme avant : la hutte du chef ne tombe pas en ruine
  const nf0 = W.nearFire; if (nf0) W.nearFire = function () { return Mo.feuIci() ? nf0.apply(this, arguments) : false; };
  const fb0 = G.finishBuild; G.finishBuild = function (b) {
    const r = fb0.apply(this, arguments), S = CG.S;
    if (Mo.marais() && b.type === 'chief' && !S.chef2) { S.chef2 = true; G.banner('Ta hutte du marais est bâtie', 'Le portail du nord se rouvre. Dans la forêt, tu peux maintenant inviter des gobelins ici, et bâtir une hutte de sous-chef.', '#b8e8c0'); CG.sfx('victory'); }
    if (b.type === 'souschef') UI.toast('👑 La hutte du sous-chef est prête. Parle à un gobelin pour l\'élire.');
    return r;
  };
  if (Art.extra) Art.extra.souschef = { w: 96, h: 112, draw(c) {
    const box = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); }, tri = (p, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); };
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(48, 102, 40, 8, 0, 0, TAU); c.fill();
    box(16, 60, 64, 42, '#b08a52'); box(16, 84, 64, 18, '#9a7644'); box(40, 74, 16, 28, '#3a2412'); box(42, 76, 12, 26, '#2a180a');
    tri([6, 62, 48, 18, 90, 62], '#7a3a8a'); tri([48, 18, 90, 62, 48, 62], '#622c70'); for (let i = 0; i < 5; i++) box(14 + i * 15, 56 - Math.abs(2 - i) * 2, 9, 3, 'rgba(255,255,255,0.14)');
    box(76, 10, 3, 52, '#5a3d22'); tri([79, 12, 96, 19, 79, 27], '#e8c84a'); c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('👑', 48, 52);
  } };

  // au marais, le feu est là où on l'a bâti
  let tic = 0;
  const gu0 = G.update; G.update = function (dt) {
    gu0.apply(this, arguments); const S = CG.S; if (!S) return; tic -= dt; if (tic > 0) return; tic = 0.5;
    if (Mo.marais()) { const f = S.buildings.find(b => b.type === 'fire'), x = f ? f.tx : C1.x, y = f ? f.ty : C1.y; if (W.CX !== x || W.CY !== y) { W.CX = x; W.CY = y; CG.R.tabPos = null; } }
    if (S.sousChef && !S.goblins.some(g => g.id === S.sousChef)) S.sousChef = null;
  };
  // sans feu de camp, pas de fête : la soirée passe, c'est tout
  const fe0 = D.feast; D.feast = function () {
    if (Mo.feuIci()) return fe0.apply(this, arguments);
    const S = CG.S, R = CG.R; R.feast = true; R.feastOk = true; S.feastDay = S.day; R.dayStats.eaten = 0; if (S.goblins.length) UI.toast('Pas de feu de camp ici : pas de fête ce soir.');
  };

  // ---------- inviter un gobelin dans l'autre monde ; élire un sous-chef ----------
  Mo.inviter = function (g) {
    G.resetGoblin(g); g.ask = null; g.migre = { t: 90 }; g.repath = 0;
    G.say(g, pick(['Un autre monde ?! J\'y cours, chef !', 'Je prends mon baluchon et je file au portail.', 'D\'accord, chef. Je t\'attends là-bas !', 'Le portail du nord ? Brr... mais j\'y vais.']), 4);
  };
  function transferer(g) {
    const S = CG.S, A = S.ailleurs, o = A && JSON.parse(JSON.stringify(CG.pack().goblins.find(k => k.id === g.id) || null)); g.migre = null; if (!o) return;
    const load = i => A.goblins.filter(k => k.home === i).length, huts = A.buildings.map((b, i) => b.type === 'hut' && !b.site ? i : -1).filter(i => i >= 0).sort((a, b) => load(a) - load(b));
    o.home = huts.length ? huts[0] : Math.max(0, A.buildings.findIndex(b => b.type === 'chief')); o.sansMaison = !huts.length || undefined; A.goblins.push(o);
    G.puff(g.x, g.y - 20, '#c070ff', 26, 150, 4); CG.R.rings.push({ x: g.x, y: g.y - 10, r: 60, life: 0.45, col: '#c070ff' }); if (CG.onScreen(g.x, g.y)) CG.sfx('spell');
    G.resetGoblin(g); const i = S.goblins.indexOf(g); if (i >= 0) S.goblins.splice(i, 1); if (S.sousChef === g.id) S.sousChef = null;
    UI.toast('🌀 ' + g.name + ' a traversé le portail : ' + (g.sex === 'f' ? 'elle' : 'il') + ' t\'attend dans ' + Mo.NOMS[1 - Mo.ici()] + '.');
  }
  Mo.step = function (g, dt) { // appelé par la routine du gobelin tant qu'il marche vers le portail
    const q = Mo.devantPortail(); g.migre.t -= dt; g.bubble = '🌀'; g.pose = null;
    if (dist(g, q) < 48 || g.migre.t <= 0) { transferer(g); return true; }
    g.repath = (g.repath || 0) - dt; if (!g.path || !g.path.length || g.repath <= 0) { if (!G.goTo(g, q.x, q.y)) g.migre.t = Math.min(g.migre.t, 4); g.repath = 2.5; }
    G.follow(g, 150, dt); return true;
  };
  Mo.sousChef = () => { const S = CG.S; return S && S.sousChef && !Mo.marais() && G.count('souschef') ? S.goblins.find(g => g.id === S.sousChef && !g.hidden) || null : null; };
  const no0 = G.nameOpt; G.nameOpt = function (o) {
    const base = no0.apply(this, arguments), S = CG.S, out = []; if (o.pet || !o.met) return base;
    const autre = Mo.NOMS[1 - Mo.ici()], il = o.sex === 'f' ? 'Elle' : 'Il';
    if (S.chef2 && S.ailleurs && !o.bebe) out.push(o.migre ? { label: '🌀 En route vers ' + autre, sub: il + ' marche vers le portail du nord', disabled: true }
      : { label: '🌀 L\'inviter à vivre dans ' + autre, sub: CG.R.alarm ? 'Pas pendant une attaque !' : il + ' part tout de suite par le portail du nord et t\'attendra là-bas', disabled: !!CG.R.alarm, fn: () => Mo.inviter(o) });
    if (!Mo.marais() && G.count('souschef') && !o.bebe) out.push(S.sousChef === o.id ? { label: '👑 Lui retirer le titre de sous-chef', fn: () => { S.sousChef = null; G.say(o, 'Bon... c\'était lourd à porter, de toute façon.', 3.5); } }
      : { label: '👑 L\'élire sous-chef', sub: 'Les gobelins iront lui poser leurs questions, plus à toi', fn: () => { S.sousChef = o.id; G.puff(o.x, o.y - 24, '#ffe36b', 22, 130, 4); G.text(o.x, o.y - 66, '👑 Sous-chef !', '#ffe36b', true); o.emoteT = 2.5; CG.sfx('level'); S.morale = Math.min(100, S.morale + 2); G.say(o, pick(['Moi ?! Je ne te décevrai pas, chef !', 'Sous-chef ! Maman serait fière.', 'Compte sur moi. Je m\'occupe de tout.']), 4); } });
    return base.concat(out);
  };
  // les questions vont au sous-chef : il règle ça entre gobelins
  const QS = ['Sous-chef, j\'ai une question...', 'Dis, tu as une minute ?', 'Il faut que je te parle de quelque chose.', 'Sous-chef ! C\'est à propos du travail...'], RS = ['Je m\'en occupe.', 'Bonne question. Voilà ce qu\'on va faire...', 'Laisse, je règle ça. Pas besoin de déranger le chef.', 'Hmm. Oui. Fais comme ça, et tout ira bien.', 'C\'est noté. Retourne travailler tranquille.'];
  const as0 = G.askStep; G.askStep = function (g, dt) {
    const sc = Mo.sousChef(), R = CG.R; if (!sc) return as0.apply(this, arguments);
    if (sc === g) { g.ask = null; G.resetGoblin(g); return false; }
    g.ask.t -= dt; if (g.ask.t <= 0 || R.alarm) { g.ask = null; G.resetGoblin(g); return false; }
    g.bubble = '❓'; g.pose = null;
    if (dist(g, sc) > 52) { g.repath -= dt; if (!g.path || !g.path.length || g.repath <= 0) { G.goTo(g, sc.x, sc.y + 6); g.repath = 1.2; } G.follow(g, 200, dt); return true; }
    g.ask = null; G.resetGoblin(g); g.face = sc.x > g.x ? 1 : -1; g.timer = 4; G.say(g, pick(QS), 3); G.say(sc, pick(RS), 3.5, 1.8); CG.S.morale = Math.min(100, CG.S.morale + 0.5);
    return true;
  };
  // la couronne du sous-chef, et le portail du nord qui gronde une fois ouvert
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const sc = Mo.sousChef();
    if (sc && CG.onScreen(sc.x, sc.y)) { g.font = '14px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('👑', sc.x, sc.y - 58 + Math.sin(t * 2.4) * 1.5); }
    if (Mo.ouvert() || Mo.marais()) { const q = Mo.portailPos(); if (CG.onScreen(q.x, q.y)) { const ferme = Mo.marais() && !bati(CG.S, 'chief'); for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; g.strokeStyle = ferme ? 'rgba(150,150,170,' + (0.35 * (1 - k)) + ')' : 'rgba(255,90,60,' + (0.55 * (1 - k)) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(q.x, q.y - 22, 14 + k * 26, 26 + k * 30, 0, 0, TAU); g.stroke(); } } }
  };

  // pas de panneau des nouvelles tant qu'il n'y a pas de village ici
  if (CG.Tableau && CG.Tableau.pos) { const tp0 = CG.Tableau.pos; CG.Tableau.pos = function () { return Mo.feuIci() ? tp0.apply(this, arguments) : null; }; }
  const css = document.createElement('style');
  css.textContent = '#mo-voile{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 50%,#f0d0ff 0%,#8a3ad0 40%,#1a0630 100%)}#mo-voile.on{animation:mo-v 2.2s ease-out both}@keyframes mo-v{0%{opacity:0}30%{opacity:1}55%{opacity:1}100%{opacity:0}}';
  document.head.appendChild(css);
})(window.CG);
