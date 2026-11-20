// Goblin Malin — la pyramide du marais : un temple à degrés, à l'orée de la carte. On y entre par sa grande ouverture.
// Dedans, c'est un donjon : cinq salles carrées, de plus en plus petites, reliées par des escaliers qui ne s'ouvrent
// qu'une fois la salle vidée. Tout en haut, le Demon Lord, revenu d'entre les morts, plus fort et plus terrible.
// Tant que le chef est dans la pyramide, les deux mondes (forêt et marais) sont figés : le temps ne passe que là.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, T = CG.TILE, MW = CG.MW, MH = CG.MH, Mo = CG.Mondes, Py = CG.Pyramide = {};
  const rand = CG.rand, pick = CG.pick, dist = CG.dist, TAU = Math.PI * 2;
  Py.dedans = () => Mo.ici() === 2;
  // les salles, de bas en haut : [largeur, hauteur] en cases
  const TAILLES = [[25, 15], [21, 13], [17, 11], [13, 9], [11, 8]], CX = 48;
  const SALLES = (() => { const l = []; let bas = MH - 3; TAILLES.forEach(([w, h], i) => { const y0 = bas - h + 1; l.push({ i, x0: CX - (w >> 1), y0, w, h, cx: (CX + 0.5) * T, cy: (y0 + h / 2) * T }); bas = y0 - 4; }); return l; })();
  const ESCALIERS = SALLES.slice(0, -1).map((s, i) => ({ i, x0: CX - 1, y0: s.y0 - 3, w: 3, h: 3 })); // entre la salle i et la salle i + 1
  const PEUPLE = [['lezard', 'lezard', 'lezard', 'lezard', 'geleeRouge', 'geleeRouge', 'geleeRouge'], ['cracheuse', 'cracheuse', 'cracheuse', 'crapaud', 'crapaud', 'lezard', 'lezard'], ['demon', 'demon', 'demon', 'diablotin', 'diablotin', 'diablotin', 'chamanLezard'], ['basilic', 'lezardCav', 'lezardCav', 'demon', 'demon', 'chamanLezard'], ['demonLord2']];
  const NOMS = ['Salle des offrandes', 'Salle des tisseuses', 'Salle des braises', 'Salle du serpent', 'Sanctuaire'];
  CG.ENEMIES.demonLord2 = { nom: 'Demon Lord, le Revenant', race: 'demon', hp: 1050, dmg: 20, spd: 78, xp: 1200, or: 500, cost: 99, r: 26, boss: true, cadence: [2.5, 3.6], haut: 2.7, zcol: '#b070ff' };
  CG.Boss.KIT.demonLord2 = ['pluie', 'nova', 'souffle', 'deluge', 'croix'];

  // ---------- dehors : la pyramide dans le marais ----------
  const base = () => ({ tx: W.GRAVE.x, ty: W.GRAVE.y });
  Py.porte = () => { const b = base(); return { x: (b.tx + 0.5) * T, y: (b.ty + 0.5) * T }; };
  Py.poser = function (set) { // appelé à la fin de la création du marais : l'emprise du temple, et le parvis devant
    const b = base(); for (let y = -6; y <= 2; y++) for (let x = -5; x <= 5; x++) set(b.tx + x, b.ty + y, y >= -4 && y <= -1 && Math.abs(x) <= 3 ? W.BUILD : W.GRASS);
    for (let y = 0; y <= 1; y++) for (let x = -1; x <= 1; x++) set(b.tx + x, b.ty + y, W.PATH);
  };
  let sprite = null;
  function temple() {
    if (sprite) return sprite; const c = sprite = document.createElement('canvas'), g = c.getContext('2d'); c.width = 340; c.height = 270;
    const box = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); }, rng = CG.makeRng(41);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(170, 252, 164, 16, 0, 0, TAU); g.fill();
    for (let i = 0; i < 5; i++) { // cinq degrés de pierre dorée
      const w = 300 - i * 50, h = 40, x = 170 - w / 2, y = 210 - i * 40;
      box(x, y, w, h, '#b89a5a'); box(x, y, w, 7, '#d8bc7a'); box(x, y + h - 9, w, 9, '#8a7040'); box(x + w - 12, y, 12, h, 'rgba(0,0,0,0.16)');
      g.strokeStyle = 'rgba(60,44,20,0.4)'; g.lineWidth = 1.5; for (let k = 0, bx = x + 4; bx < x + w - 6; k++) { const bw = 20 + rng() * 14; g.strokeRect(bx, y + 9, Math.min(bw, x + w - 6 - bx), 20); bx += bw; }
      for (let k = 0; k < 3 - Math.floor(i / 2); k++) { const mx = x + 10 + rng() * (w - 20); g.fillStyle = 'rgba(70,120,60,0.75)'; g.beginPath(); g.ellipse(mx, y + 3, 10 + rng() * 10, 4, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(60,110,50,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx, y + 4); g.quadraticCurveTo(mx + (rng() - 0.5) * 8, y + 16, mx + (rng() - 0.5) * 6, y + 20 + rng() * 14); g.stroke(); }
    }
    box(125, 14, 90, 38, '#a88a4c'); box(120, 8, 100, 10, '#d8bc7a'); box(150, 26, 40, 26, '#1a0c20'); g.fillStyle = 'rgba(190,90,255,0.5)'; g.fillRect(156, 30, 28, 22); // le petit temple du sommet
    g.fillStyle = '#9a7c44'; g.beginPath(); g.moveTo(138, 250); g.lineTo(202, 250); g.lineTo(190, 50); g.lineTo(150, 50); g.closePath(); g.fill(); // le grand escalier
    g.strokeStyle = 'rgba(50,36,16,0.5)'; g.lineWidth = 1.5; for (let y = 58; y < 250; y += 8) { const k = (y - 50) / 200, hw = 20 + k * 12; g.beginPath(); g.moveTo(170 - hw, y); g.lineTo(170 + hw, y); g.stroke(); }
    // la grande ouverture, tout en bas
    box(126, 168, 88, 82, '#8a7040'); box(120, 160, 100, 12, '#d8bc7a'); g.fillStyle = '#0c0612'; g.beginPath(); g.moveTo(138, 250); g.lineTo(138, 196); g.quadraticCurveTo(170, 168, 202, 196); g.lineTo(202, 250); g.closePath(); g.fill();
    [[132, 178], [208, 178]].forEach(([x, y]) => { g.fillStyle = '#e8c84a'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.fillStyle = '#8a1c2a'; g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); });
    for (let i = 0; i < 4; i++) { box(142 + i * 16, 163, 8, 6, '#8a1c2a'); }
    return c;
  }
  const temoin = { draw(g, o, t) {
    const q = Py.porte(), x = q.x, y = q.y - T / 2; g.drawImage(temple(), Math.round(x - 170), Math.round(y - 250));
    const a = 0.3 + Math.sin(t * 2) * 0.12; g.fillStyle = 'rgba(180,80,255,' + a + ')'; g.beginPath(); g.ellipse(x, y - 30, 20, 30, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,190,255,' + a * 0.7 + ')'; g.beginPath(); g.ellipse(x, y - 28, 9, 17, 0, 0, TAU); g.fill();
    [[-38, -72], [38, -72]].forEach(([dx, dy], i) => { const h = 10 + Math.sin(t * 9 + i * 2) * 3; g.fillStyle = '#ff7a1e'; g.beginPath(); g.moveTo(x + dx - 4, y + dy); g.quadraticCurveTo(x + dx, y + dy - h * 1.7, x + dx + 4, y + dy); g.fill(); g.fillStyle = '#ffe36b'; g.beginPath(); g.moveTo(x + dx - 2, y + dy); g.quadraticCurveTo(x + dx, y + dy - h, x + dx + 2, y + dy); g.fill(); });
  } };
  if (CG.Armee) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (Mo.marais()) { const q = Py.porte(); if (CG.onScreen(q.x, q.y - 100) || CG.onScreen(q.x - 150, q.y) || CG.onScreen(q.x + 150, q.y)) push(q.y - T / 2 - 6, 21, temoin, null); } if (Py.dedans() && CG.R.sortiePy) push(CG.R.sortiePy.y, 21, CG.R.sortiePy, null); }; }

  // ---------- dedans : la carte du donjon ----------
  Py.generer = function (seed, gen0) {
    gen0.call(W, seed); const S = CG.S, tile = W.tile, I = W.idx, ouverts = (S && S.etages) || 0;
    tile.fill(W.BUILD);
    SALLES.forEach(s => { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) tile[I(s.x0 + x, s.y0 + y)] = W.FLOOR; });
    ESCALIERS.forEach(e => { for (let y = 0; y < e.h; y++) for (let x = 0; x < e.w; x++) tile[I(e.x0 + x, e.y0 + y)] = e.i < ouverts ? W.PATH : W.BUILD; });
    Object.keys(W.POI).forEach(k => { Object.assign(W.POI[k], { x: 2, y: 2, r: 0 }); }); delete W.POI.lezards;
    Object.assign(W.POI.portail, { x: CX, y: SALLES[0].y0 + SALLES[0].h - 2, r: 0 }); Object.assign(W.GRAVE, { x: 2, y: MH - 3, r: 0 });
    W.nodes = []; W.chestDefs = []; W.wildDefs = []; W.ponds = []; W.sites = []; W.CX = CX; W.CY = SALLES[0].y0 + 7; W.fieldDirty = true; W.miniDirty = true;
  };
  function ouvrir(i) { const e = ESCALIERS[i]; if (!e) return; for (let y = 0; y < e.h; y++) for (let x = 0; x < e.w; x++) W.tile[W.idx(e.x0 + x, e.y0 + y)] = W.PATH; W.fieldDirty = true; W.miniDirty = true; }
  const paint0 = W.paint;
  W.paint = function () {
    if (!Py.dedans()) return paint0.apply(this, arguments);
    const c = W.terrain = document.createElement('canvas'); c.width = MW * T; c.height = MH * T; const g = c.getContext('2d'), rng = CG.makeRng(W.seed + 5);
    g.fillStyle = '#07050b'; g.fillRect(0, 0, c.width, c.height);
    const mur = (x, y, w, h) => { g.fillStyle = '#6a5630'; g.fillRect(x, y, w, h); g.fillStyle = '#8a7240'; g.fillRect(x, y, w, Math.min(6, h)); g.strokeStyle = 'rgba(30,20,8,0.5)'; g.lineWidth = 1.5; for (let by = y + 6; by < y + h - 4; by += 18) for (let bx = x + ((by / 18 | 0) % 2 ? 0 : 20); bx < x + w; bx += 40) g.strokeRect(bx, by, Math.min(40, x + w - bx), 18); };
    SALLES.forEach(s => {
      const x = s.x0 * T, y = s.y0 * T, w = s.w * T, h = s.h * T;
      mur(x - 16, y - 56, w + 32, 56); mur(x - 16, y, 16, h + 14); mur(x + w, y, 16, h + 14); mur(x - 16, y + h, w + 32, 14);
      for (let ty = 0; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) { const k = W.hash(s.x0 + tx, s.y0 + ty), px = x + tx * T, py = y + ty * T; g.fillStyle = 'hsl(' + (40 + k * 6) + ',' + (34 + k * 8) + '%,' + (44 + k * 9 - (tx + ty) % 2 * 3) + '%)'; g.fillRect(px, py, T, T); g.strokeStyle = 'rgba(50,36,14,0.35)'; g.lineWidth = 1.5; g.strokeRect(px + 0.75, py + 0.75, T - 1.5, T - 1.5); if (k > 0.86) { g.strokeStyle = 'rgba(40,28,10,0.5)'; g.beginPath(); g.moveTo(px + 6, py + 8 + k * 10); g.lineTo(px + 18, py + 20); g.lineTo(px + 14 + k * 14, py + 34); g.stroke(); } }
      g.strokeStyle = '#e8c84a'; g.lineWidth = 3; g.strokeRect(x + T * 1.5, y + T * 1.5, w - T * 3, h - T * 3); // le liseré d'or
      const cx = x + w / 2, cy = y + h / 2, R0 = Math.min(w, h) * 0.24; g.strokeStyle = 'rgba(138,28,42,0.55)'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, R0 * 0.55, 0, TAU); g.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * R0 * 0.55, cy + Math.sin(a) * R0 * 0.55); g.lineTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); g.stroke(); }
      for (let i = 0; i < s.w - 2; i += 3) { const gx = x + 26 + i * T + rng() * 8; g.fillStyle = '#4a3a1c'; g.fillRect(gx, y - 40, 22, 26); g.fillStyle = i % 2 ? '#e8c84a' : '#8a1c2a'; g.beginPath(); g.arc(gx + 11, y - 30, 5, 0, TAU); g.fill(); g.fillRect(gx + 4, y - 22, 14, 3); } // les glyphes du mur du fond
      g.font = 'bold 15px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(60,40,12,0.55)'; g.fillText(NOMS[s.i], cx, y + h - 12);
    });
    ESCALIERS.forEach(e => { const x = e.x0 * T, y = e.y0 * T, w = e.w * T, h = e.h * T; mur(x - 14, y - 8, 14, h + 8); mur(x + w, y - 8, 14, h + 8); for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#a88c50' : '#c8ac68'; g.fillRect(x, y + i * h / 12, w, h / 12 + 1); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, y + (i + 1) * h / 12 - 3, w, 3); } });
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
  };
  const mini0 = W.drawMini;
  W.drawMini = function () { if (!Py.dedans()) return mini0.apply(this, arguments); const c = W.mini || (W.mini = document.createElement('canvas')); c.width = MW * 2; c.height = MH * 2; const g = c.getContext('2d'); g.fillStyle = '#0c0a12'; g.fillRect(0, 0, c.width, c.height); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const t = W.tile[W.idx(x, y)]; if (t === W.BUILD) continue; g.fillStyle = t === W.PATH ? '#e8c84a' : '#b89a5a'; g.fillRect(x * 2, y * 2, 2, 2); } W.miniDirty = false; };

  // ---------- entrer, sortir : les deux mondes restent figés pendant ce temps ----------
  const neuf = d => ({ day: d.day, hour: 12, morale: d.morale || 70, res: { food: 0, bois: 0, minerai: 0, cuir: 0, or: 0 }, goblins: [], pets: [], buildings: [], cuts: [], logs: [], young: [], chests: [], terra: {}, etages: 0 });
  Py.basculer = function (par) {
    const S = CG.S, GL = Mo.GLOBAL, entre = par === 'pyramide'; if (UI.modal) UI.close();
    const suiv = G.tech('b24') ? S.pets.filter(a => a.follow && !a.ko).map(a => a.id) : [];
    const data = JSON.parse(JSON.stringify(CG.pack())), ici = {}, N = {}; Object.keys(data).forEach(k => { if (!GL.includes(k)) ici[k] = data[k]; });
    const partent = ici.pets.filter(a => suiv.includes(a.id)); ici.pets = ici.pets.filter(a => !suiv.includes(a.id));
    GL.forEach(k => { if (data[k] !== undefined) N[k] = data[k]; });
    const la = entre ? neuf(data) : data.dehors; if (!la) return;
    Object.keys(la).forEach(k => { if (!GL.includes(k)) N[k] = la[k]; });
    if (entre) { N.dehors = ici; N.monde = 2; } else { delete N.dehors; N.monde = 1; Object.keys(ici.res || {}).forEach(r => { N.res[r] = (N.res[r] || 0) + (ici.res[r] || 0); }); } // ce qu'on a ramassé dedans ressort avec nous
    N.pets = (N.pets || []).concat(partent);
    const h0 = N.hour, hp = N.player.hp, mp = N.player.mp;
    CG.S = N; G.initRuntime(); D.startDay();
    const R = CG.R, q = N.player; q.hp = hp; q.mp = mp; N.hour = Math.min(h0, 23.5);
    if (!entre) { (R.schedule || []).forEach(e => { if (e.h <= N.hour) e.done = true; }); R.eveningSaid = N.hour >= 19; if (N.feastDay === N.day && Mo.feuIci()) { R.feast = true; R.feastOk = true; R.fireLit = true; } }
    const a = entre ? Mo.devantPortail() : (() => { const d = Py.porte(); return { x: d.x, y: d.y + 44 }; })();
    q.x = a.x; q.y = a.y; G.unstick(q, 9); N.pets.forEach(o => { if (suiv.includes(o.id)) { o.x = q.x - 30 + rand(-14, 14); o.y = q.y + 16; o.path = null; } });
    W.drawMini(); R.invuln = 2.5; G.puff(q.x, q.y - 20, '#e0b0ff', 30, 180, 4);
    if (entre) G.banner('La pyramide', 'Cinq salles, de plus en plus étroites. Vide chacune pour ouvrir l\'escalier. Dehors, le temps s\'est arrêté.', '#f0d8a0'); else G.banner('De retour dans le marais', 'Rien n\'a bougé pendant que tu étais dans la pyramide.', '#b8e8c0');
    try { CG.save(); } catch (e) { /* rien */ }
  };
  // dedans, l'horloge ne tourne pas : ni soir, ni fête, ni nuit
  const du0 = D.update; D.update = function (dt) { if (!Py.dedans() || Mo.pending) return du0.apply(this, arguments); const S = CG.S, h = S.hour; const r = du0.apply(this, arguments); if (CG.S === S) S.hour = h; return r; };
  // les portails ne traversent pas ces murs
  const cast0 = G.cast; G.cast = function (id) { if (Py.dedans() && (id === 'mondes' || id === 'retour')) { CG.sfx('no'); return UI.toast('La magie des portails ne traverse pas ces murs. Il faut ressortir par où tu es entré.'); } return cast0.apply(this, arguments); };

  // ---------- les gardiens de chaque salle ----------
  function peupler(i) {
    const S = CG.S, R = CG.R, s = SALLES[i], n = (S.pyramide && S.pyramide.n) || 0;
    PEUPLE[i].forEach((type, k) => {
      let x, y; for (let t = 0; t < 30; t++) { x = (s.x0 + 1.5 + Math.random() * (s.w - 3)) * T; y = (s.y0 + 1.2 + Math.random() * (s.h - (i < 4 ? 5 : 3.5))) * T; if (W.walkPx(x, y)) break; }
      if (type === 'demonLord2') { x = s.cx; y = s.y0 * T + T * 2.4; }
      const e = G.spawnEnemy(type, x, y, { wild: true, mul: 1 + n * 0.25 }); if (!e) return; e.etage = i; e.leash = Math.max(s.w, s.h) * T; e.aggroR = type === 'demonLord2' ? 420 : 260; if (type === 'demonLord2') R.lord2 = e;
    });
  }
  const rw0 = D.rollWild; D.rollWild = function () {
    if (!Py.dedans()) return rw0.apply(this, arguments);
    const S = CG.S, R = CG.R; R.chests = []; R.siteDone = {}; R.siteN = {}; R.siteCoffre = {}; R.noNightRaid = true; R.lord2 = null; R.sortiePy = null;
    for (let i = S.etages || 0; i < SALLES.length; i++) peupler(i);
  };
  const sd0 = D.startDay; D.startDay = function () {
    const r = sd0.apply(this, arguments); if (!Py.dedans()) return r; const S = CG.S, R = CG.R;
    R.schedule = []; R.band = null; S.autels = []; S.statues = { day: S.day, list: [] }; R.visitors = []; R.pyT = 0; if ((S.etages || 0) >= SALLES.length) sortie();
    return r;
  };
  function sortie() { const s = SALLES[4]; CG.R.sortiePy = { x: s.cx, y: s.cy + 20, draw(g, o, t) { const a = 0.6 + Math.sin(t * 3) * 0.15; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(o.x, o.y + 4, 24, 7, 0, 0, TAU); g.fill(); [['rgba(190,150,40,' + a + ')', 1], ['rgba(255,227,107,' + a + ')', 0.7], ['rgba(255,255,230,' + a + ')', 0.35]].forEach(c => { g.fillStyle = c[0]; g.beginPath(); g.ellipse(o.x, o.y - 34, 22 * c[1], 40 * c[1], 0, 0, TAU); g.fill(); }); } }; }
  function victoire(e) {
    const S = CG.S, R = CG.R, p = S.player, n = ((S.pyramide && S.pyramide.n) || 0) + 1; S.pyramide = { n, jour: S.day };
    p.maxhp += 20; p.hp += 20; p.maxmp += 10; p.mp += 10; S.tech.points += 2;
    for (let i = 0; i < 5; i++) R.rings.push({ x: e.x, y: e.y - 10, r: 80 + i * 60, life: 0.5 + i * 0.2, col: i % 2 ? '#ffe36b' : '#b070ff' }); G.puff(e.x, e.y - 30, '#b070ff', 60, 280, 6);
    G.banner('Le Revenant est retombé en cendres !', 'Son cœur brûle encore : +20 vie max, +10 mana max, +2 points de technologie. Un passage doré s\'ouvre pour ressortir.', '#ffe9a8'); CG.sfx('victory'); sortie();
  }
  const gu0 = G.update; G.update = function (dt) {
    gu0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !Py.dedans()) return;
    // le Revenant : il appelle des diablotins, et s'enrage à mi-vie
    const L = R.lord2; if (L && !L.dead && L.target) { L.appel = (L.appel === undefined ? 9 : L.appel) - dt; if (L.appel <= 0) { L.appel = L.hp < L.maxhp * 0.5 ? 9 : 14; const vivants = R.enemies.filter(o => !o.dead && o.etage === 4 && o !== L).length; if (vivants < 5) { G.text(L.x, L.y - 130, '« Levez-vous ! »', '#e0b0ff', true); CG.sfx('warning'); for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; let x = L.x + Math.cos(a) * 90, y = L.y + Math.sin(a) * 70; if (!W.walkPx(x, y)) { x = L.x; y = L.y + 30; } const d = G.spawnEnemy('diablotin', x, y, { wild: true }); if (d) { d.etage = 4; d.sbire = true; d.leash = 600; d.aggroR = 500; d.target = S.player; G.puff(x, y - 16, '#b070ff', 12, 110, 4); } } } }
      if (L.hp < L.maxhp * 0.5 && !L.rage) { L.rage = true; L.spd *= 1.25; G.text(L.x, L.y - 140, '« ASSEZ ! »', '#ff6a5a', true); for (let i = 0; i < 3; i++) R.rings.push({ x: L.x, y: L.y - 10, r: 90 + i * 70, life: 0.5 + i * 0.15, col: '#ff3a6a' }); CG.sfx('horn'); } }
    R.pyT = (R.pyT || 0) - dt; if (R.pyT > 0) return; R.pyT = 0.4;
    const et = S.etages || 0; if (et >= SALLES.length) return;
    if (R.enemies.some(e => !e.dead && e.etage === et && !e.sbire)) return;
    if (et === 4) { R.enemies.forEach(e => { if (e.etage === 4 && !e.dead) { e.dead = true; G.puff(e.x, e.y - 16, '#b070ff', 10, 100, 4); } }); S.etages = 5; victoire(R.lord2 || { x: SALLES[4].cx, y: SALLES[4].cy }); return; }
    S.etages = et + 1; ouvrir(et); const s = SALLES[et], e = ESCALIERS[et], ex = (e.x0 + 1.5) * T, ey = (e.y0 + 1.5) * T;
    R.chests.push({ x: s.cx + (et % 2 ? 90 : -90), y: s.cy, kind: pick(['precieux', 'magique', 'savoir', 'precieux']), open: false });
    G.puff(ex, ey, '#e8c84a', 30, 160, 5); R.rings.push({ x: ex, y: ey, r: 80, life: 0.5, col: '#ffe36b' }); G.banner(NOMS[et] + ' : vidée !', 'La dalle se soulève : l\'escalier vers « ' + NOMS[et + 1] + ' » est ouvert. Un coffre est apparu.', '#f0d8a0'); CG.sfx('discovery'); try { CG.save(); } catch (er) { /* rien */ }
  };

  // ---------- E : entrer, sortir ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R, p = CG.S.player; if (R.ko > 0 || R.cine || R.build) return it;
    if (Mo.marais()) { const q = Py.porte(); if (Math.hypot(p.x - q.x, p.y - q.y) < 64 && (!it || it.type === 'home' || it.type === 'sleep')) return { type: 'pyramide', obj: { x: q.x, y: q.y - 10 }, label: 'Entrer dans la pyramide' }; }
    if (Py.dedans()) { const q = Mo.portailPos(); if (Math.hypot(p.x - q.x, p.y - (q.y + 24)) < 60) return { type: 'pyramideSortie', obj: { x: q.x, y: q.y - 24 }, label: 'Sortir de la pyramide' }; const o = R.sortiePy; if (o && Math.hypot(p.x - o.x, p.y - o.y) < 56) return { type: 'pyramideSortie', obj: { x: o.x, y: o.y - 40 }, label: 'Prendre le passage doré vers la sortie' }; }
    return it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || (it.type !== 'pyramide' && it.type !== 'pyramideSortie')) return in0.apply(this, arguments);
    if (it.type === 'pyramideSortie' && CG.R.enemies.some(e => !e.dead && (e.target === CG.S.player) && dist(e, CG.S.player) < 260)) { CG.sfx('no'); return UI.toast('Pas avec des monstres sur le dos !'); }
    Mo.partir(it.type === 'pyramide' ? 'pyramide' : 'dehors');
  };

  // ---------- dessins : les dalles qui barrent les escaliers, les torches, et le Revenant ----------
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); if (!Py.dedans() || CG.S.arene) return; /* les grilles et les torches de la pyramide n'ont rien à faire dans une salle hors du monde (château, grotte, crypte) */ const et = CG.S.etages || 0;
    ESCALIERS.forEach(e => { if (e.i < et) return; const x = e.x0 * T, y = (e.y0 + 2) * T + 8, w = e.w * T; if (!CG.onScreen(x + w / 2, y)) return; g.fillStyle = '#4a3a1c'; g.fillRect(x - 2, y, w + 4, 30); g.fillStyle = '#6a5630'; g.fillRect(x - 2, y, w + 4, 6); for (let i = 0; i < 5; i++) { g.fillStyle = '#2a2018'; g.fillRect(x + 8 + i * 23, y + 6, 8, 24); g.fillStyle = '#8a8a94'; g.fillRect(x + 10 + i * 23, y + 6, 3, 24); } g.fillStyle = '#e8c84a'; g.beginPath(); g.arc(x + w / 2, y + 16, 7, 0, TAU); g.fill(); g.fillStyle = '#8a1c2a'; g.beginPath(); g.arc(x + w / 2, y + 16, 3, 0, TAU); g.fill(); });
    SALLES.forEach(s => { [[s.x0 * T + 26, s.y0 * T - 8], [(s.x0 + s.w) * T - 26, s.y0 * T - 8]].forEach(([x, y], i) => { if (!CG.onScreen(x, y)) return; g.fillStyle = '#3a2a14'; g.fillRect(x - 3, y - 6, 6, 16); const h = 13 + Math.sin(t * 9 + i * 2 + s.i) * 4; g.fillStyle = 'rgba(255,170,60,0.18)'; g.beginPath(); g.arc(x, y - 10, 34, 0, TAU); g.fill(); g.fillStyle = '#ff7a1e'; g.beginPath(); g.moveTo(x - 6, y - 6); g.quadraticCurveTo(x - 7, y - 6 - h * 0.6, x + Math.sin(t * 6 + i) * 2, y - 6 - h * 1.4); g.quadraticCurveTo(x + 7, y - 6 - h * 0.6, x + 6, y - 6); g.fill(); g.fillStyle = '#ffe36b'; g.beginPath(); g.moveTo(x - 3, y - 6); g.quadraticCurveTo(x, y - 6 - h, x + 3, y - 6); g.fill(); }); });
  };
  const en0 = Art.enemy; Art.enemy = function (g, e, t) {
    if (e.type !== 'demonLord2') return en0.apply(this, arguments);
    const x = e.x, tt = t + e.seed, vol = 10 + Math.sin(tt * 2.2) * 5, y = e.y - vol, rage = e.hp < e.maxhp * 0.5, c1 = rage ? '255,60,110' : '150,90,255', c2 = rage ? '#ff3a6a' : '#b070ff';
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, e.y + 3, 44, 13, 0, 0, TAU); g.fill();
    // le cercle de runes qui tourne sous lui
    g.save(); g.translate(x, e.y + 2); g.scale(1, 0.38); g.strokeStyle = 'rgba(' + c1 + ',0.75)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 66, 0, TAU); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 54, 0, TAU); g.stroke(); for (let i = 0; i < 8; i++) { const a = tt * 0.8 + i / 8 * TAU; g.fillStyle = 'rgba(' + c1 + ',0.9)'; g.fillRect(Math.cos(a) * 60 - 4, Math.sin(a) * 60 - 4, 8, 8); } g.restore();
    // quatre grandes ailes d'os et de flamme froide
    const bat = Math.sin(tt * 3.4) * 0.16;
    [[-1, -0.5, 96], [1, -0.5, 96], [-1, 0.25, 66], [1, 0.25, 66]].forEach(([sd, inc, L]) => { g.save(); g.translate(x + sd * 12, y - 78); g.rotate(sd * (inc + bat * (inc < 0 ? 1 : -0.7))); g.fillStyle = 'rgba(16,6,26,0.94)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(sd * L, -L * 0.5); g.lineTo(sd * L * 0.84, -L * 0.04); g.lineTo(sd * L * 0.95, L * 0.22); g.lineTo(sd * L * 0.6, L * 0.14); g.lineTo(sd * L * 0.64, L * 0.4); g.lineTo(sd * L * 0.3, L * 0.22); g.lineTo(0, L * 0.3); g.closePath(); g.fill(); g.strokeStyle = 'rgba(' + c1 + ',0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(sd * L, -L * 0.5); g.moveTo(0, 0); g.lineTo(sd * L * 0.95, L * 0.22); g.moveTo(0, 0); g.lineTo(sd * L * 0.64, L * 0.4); g.stroke(); g.restore(); });
    for (let i = 0; i < 9; i++) { const k = (tt * 0.9 + i / 9) % 1, fx = x + Math.sin(i * 2.4 + tt) * 30; g.fillStyle = 'rgba(' + c1 + ',' + (0.7 * (1 - k)) + ')'; g.beginPath(); g.arc(fx, e.y - k * 70, 5 * (1 - k) + 1.5, 0, TAU); g.fill(); } // les flammes froides qui montent
    Art.humanoid(g, { x, y, face: e.face, t: tt, moving: false, step: 0, atk: e.atkAnim, angry: true, skin: '#d8d2e8', tunic: '#120a1c', legs: '#0a0612', sleeve: '#d8d2e8', horns: '#f4f0ff', s: 2.3, eye: rage ? '#ff3a6a' : '#b070ff', weapon: 'baton', glow: c2, cape: '#2a1048', skull: true, ears: true, fangs: true });
    const hy = y - 112; g.strokeStyle = '#e8c84a'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, hy - 6, 20, 6, 0, 0, TAU); g.stroke(); for (let i = -2; i <= 2; i++) { const h = 12 + (i % 2 ? 0 : 7) + Math.sin(tt * 8 + i) * 2; g.fillStyle = i % 2 ? c2 : '#f4f0ff'; g.beginPath(); g.moveTo(x + i * 8 - 3.5, hy - 6); g.lineTo(x + i * 8, hy - 6 - h); g.lineTo(x + i * 8 + 3.5, hy - 6); g.fill(); } // la couronne
    g.fillStyle = 'rgba(' + c1 + ',' + (0.55 + Math.sin(tt * 6) * 0.25) + ')'; g.beginPath(); g.arc(x, y - 56, 8 + Math.sin(tt * 6) * 2, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 56, 3, 0, TAU); g.fill(); // le cœur qui bat
    if (e.slow > 0) { g.fillStyle = 'rgba(160,230,255,0.3)'; g.beginPath(); g.ellipse(x, y - 40, 30, 52, 0, 0, TAU); g.fill(); }
  };
})(window.CG);
