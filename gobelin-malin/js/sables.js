// Goblin Malin — les Sables sans fin. Tout en bas de la forêt du sud (là où elle devient désert), une piste sort par le
// bord de la carte entre deux obélisques : à partir du niveau 15, elle mène à une carte entière de désert.
//   Du sable partout, des buttes, des cactus, des sables mouvants (tout ça vient de desert.js), et en plus :
//   des palmiers, de rares oasis, des campements de tentes, deux petits temples à moitié ensevelis, et le grand temple
//   en haut de son immense escalier (les donjons eux-mêmes sont dans sablestemples.js).
//   Les bêtes y sont bien plus fortes, et la moitié des meutes sont des créatures d'ici (sablesbetes.js).
//   La nuit, des traces bleues se mettent à luire sur le sable : au bout, une trappe, et dessous le repaire des voleurs.
// Tout se règle dans CG.Sables.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Te = CG.Terres, Ds = CG.Desert, Ar = CG.Arene, Mo = CG.Mondes, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  if (!Te || !Ds || !Mo || !W) return;
  const Sa = CG.Sables = { MONDE: 6, NIV: 15, FORCE: [1.5, 1.3], /* vie et dégâts des bêtes du désert ici, en plus de ce qu'elles ont déjà dans les forêts voisines */
    NEUFS: 0.55, /* part des meutes remplacées par les créatures des Sables */ PALMIERS: 16, NUIT: [19, 5], PAS: 30, TRAPPE_PRES: 46, PORTE_PRES: 54,
    MEUTES: [['derviche'], ['djinn'], ['mageSoleil', 'derviche'], ['chacalLune'], ['derviche', 'mageSoleil'], ['chacalLune', 'chacalLune', 'djinn'], ['djinn', 'derviche']] };
  if (!Mo.GLOBAL.includes('sablesFait')) Mo.GLOBAL.push('sablesFait');
  const ici = () => Te.ici() === Sa.MONDE, nuit = () => { const h = CG.S.hour; return h >= Sa.NUIT[0] || h < Sa.NUIT[1]; };
  const faits = () => { const S = CG.S; return S.sablesFait || (S.sablesFait = {}); }, fait = cle => faits()[cle] === CG.S.day;
  Te.arriveeDe = (dest, de) => (dest === 4 && de === Sa.MONDE ? { x: Ds.PASSAGE, y: CG.MH - 5 } : null); // en remontant, on ressort par le bas de la forêt du sud
  let plan = null; Sa.plan = () => plan;

  // ---------- la carte ----------
  function generer(seed) {
    const tile = W.tile, I = W.idx, MW = CG.MW, MH = CG.MH, rng = CG.makeRng(seed + 6606), DP = Ds.plan(), TP = Te.plan(); plan = null; if (!DP || !TP) return;
    const dedans = (x, y) => x >= 3 && y >= 3 && x < MW - 3 && y < MH - 3;
    // faire place nette dans un rectangle : buttes, cactus et sables mouvants s'en vont
    const vider = (x0, y0, x1, y1) => {
      DP.buttes = DP.buttes.filter(b => { if (b.x1 < x0 - 1 || b.x0 > x1 + 1 || b.y1 < y0 - 1 || b.y0 > y1 + 1) return true; b.l.forEach(q => { tile[I(q[0], q[1])] = W.GRASS; }); return false; });
      DP.cactus = DP.cactus.filter(c => { if (c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) return true; tile[I(c.x, c.y)] = W.GRASS; return false; });
      DP.mouvants = DP.mouvants.filter(m => m.tx < x0 - 4 || m.tx > x1 + 4 || m.ty < y0 - 3 || m.ty > y1 + 3);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (dedans(x, y) && tile[I(x, y)] !== W.PATH) tile[I(x, y)] = W.GRASS; };
    const mur = (x, y) => { if (dedans(x, y)) tile[I(x, y)] = W.BUILD; };
    W.nodes = (W.nodes || []).filter(n => n.type !== 'bush'); // pas de buissons de baies dans le sable
    const A = TP.arr, L = TP.clairieres.slice().sort((a, b) => Math.hypot(b.x - A.x, b.y - A.y) - Math.hypot(a.x - A.x, a.y - A.y)); // de la plus loin de l'entrée à la plus proche
    const P = { seed, oasis: [], palmiers: [], tentes: [], temples: [], grand: null, trappe: null, trace: [] };
    // le grand temple : la clairière la plus lointaine qui a la place (douze rangées au-dessus d'elle)
    const gi = L.findIndex(g => g.y >= 19 && g.x >= 11 && g.x <= MW - 12); if (gi >= 0) { const g = L.splice(gi, 1)[0]; vider(g.x - 9, g.y - 15, g.x + 9, g.y - 2);
      for (let r = 0; r < 10; r++) { const y = g.y - 3 - r, hw = 7 - Math.floor(r / 2); for (let a = -hw; a <= hw; a++) { if (Math.abs(a) <= 1) tile[I(g.x + a, y)] = W.PATH; else mur(g.x + a, y); } }
      for (let b = 0; b < 2; b++) for (let a = -3; a <= 3; a++) mur(g.x + a, g.y - 13 - b);
      for (let a = -1; a <= 1; a++) tile[I(g.x + a, g.y - 2)] = W.PATH;
      P.grand = { tx: g.x, ty: g.y, x: (g.x + 0.5) * T, yBas: (g.y - 2) * T, yHaut: (g.y - 12) * T, porte: { x: (g.x + 0.5) * T, y: (g.y - 12) * T + 14 } }; }
    // deux petits temples
    L.splice(0, 2).forEach((g, i) => { vider(g.x - 3, g.y - 6, g.x + 3, g.y - 3); for (let b = 3; b <= 5; b++) for (let a = -2; a <= 2; a++) mur(g.x + a, g.y - b); P.temples.push({ i, tx: g.x, ty: g.y, x: (g.x + 0.5) * T, y: (g.y - 2) * T }); /* une case de vide entre la porte et le milieu de la clairière (où il y a souvent un coffre) */ });
    // deux campements : trois tentes autour de la clairière
    L.splice(0, 2).forEach(g => { [[-3, -2], [3, -2], [0, -3], [-4, 1]].forEach((q, k) => { if (k === 3 && rng() < 0.5) return; const x = g.x + q[0], y = g.y + q[1]; if (!dedans(x, y) || tile[I(x, y)] === W.PATH) return; vider(x, y, x, y); mur(x, y); P.tentes.push({ x, y, v: Math.floor(rng() * 3), feu: k === 0 ? { x: (g.x + 0.5) * T, y: (g.y + 0.5) * T + 30 } : null }); }); });
    // les oasis : une mare, de l'herbe, des palmiers
    L.forEach(g => { const cx = g.x, cy = g.y - 4, rx = 2.4 + rng() * 0.8, ry = 1.5 + rng() * 0.4; if (!dedans(cx - 4, cy - 3) || !dedans(cx + 4, cy + 3)) return; vider(cx - 5, cy - 3, cx + 5, cy + 3); const eau = [];
      for (let b = -3; b <= 3; b++) for (let a = -4; a <= 4; a++) { const x = cx + a, y = cy + b; if ((a * a) / (rx * rx) + (b * b) / (ry * ry) < 1 && tile[I(x, y)] === W.GRASS) { tile[I(x, y)] = W.WATER; eau.push([x, y]); } }
      P.oasis.push({ x: (cx + 0.5) * T, y: (cy + 0.5) * T, rx: rx * T, ry: ry * T, eau });
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + rng() * 0.6, x = Math.round(cx + Math.cos(a) * (rx + 1.4)), y = Math.round(cy + Math.sin(a) * (ry + 1.3)); if (dedans(x, y) && tile[I(x, y)] === W.GRASS && !(x === g.x && y >= g.y - 2)) { mur(x, y); P.palmiers.push({ x, y, s: 0.9 + rng() * 0.4, v: Math.floor(rng() * 3) }); } } });
    // quelques palmiers perdus dans les dunes
    for (let k = 0; k < 900 && P.palmiers.length < Sa.PALMIERS + P.oasis.length * 5; k++) { const x = 4 + Math.floor(rng() * (MW - 8)), y = 4 + Math.floor(rng() * (MH - 8)); let ok = tile[I(x, y)] === W.GRASS && !Ds.dansMouvant((x + 0.5) * T, (y + 0.5) * T);
      for (let b = -1; b <= 1 && ok; b++) for (let a = -1; a <= 1; a++) if (tile[I(x + a, y + b)] !== W.GRASS) { ok = false; break; } if (!ok) continue; mur(x, y); P.palmiers.push({ x, y, s: 0.85 + rng() * 0.45, v: Math.floor(rng() * 3) }); }
    // la trappe des voleurs : loin de l'entrée et des temples, en plein sable ; et la piste de traces qui y mène depuis le carrefour
    const hub = TP.hub, loinDe = (x, y) => Math.hypot(x - A.x, y - A.y) > 26 && Math.hypot(x - hub.x, y - hub.y) > 16 && (!P.grand || Math.hypot(x - P.grand.tx, y - P.grand.ty + 6) > 14) && P.temples.every(t => Math.hypot(x - t.tx, y - t.ty + 3) > 8);
    for (let k = 0; k < 2000 && !P.trappe; k++) { const x = 6 + Math.floor(rng() * (MW - 12)), y = 6 + Math.floor(rng() * (MH - 12)); if (!loinDe(x, y)) continue; let ok = true; for (let b = -1; b <= 1 && ok; b++) for (let a = -1; a <= 1; a++) if (tile[I(x + a, y + b)] !== W.GRASS) { ok = false; break; } if (ok && !Ds.dansMouvant((x + 0.5) * T, (y + 0.5) * T)) P.trappe = { tx: x, ty: y, x: (x + 0.5) * T, y: (y + 0.5) * T }; }
    if (P.trappe) { const a = { x: (hub.x + 0.5) * T, y: (hub.y + 0.5) * T }, b = P.trappe, d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(2, Math.floor(d / Sa.PAS)), px = -(b.y - a.y) / d, py = (b.x - a.x) / d, ph = rng() * 6;
      for (let i = 1; i < n; i++) { const k = i / n, w = Math.sin(k * Math.PI) * (Math.sin(k * 9 + ph) * 70 + Math.sin(k * 23 + ph * 2) * 22), x = a.x + (b.x - a.x) * k + px * w, y = a.y + (b.y - a.y) * k + py * w; P.trace.push({ x, y, cote: i % 2 ? 1 : -1 }); }
      for (let i = 0; i < P.trace.length; i++) { const q = P.trace[i], nx = (P.trace[i + 1] || b); q.a = Math.atan2(nx.y - q.y, nx.x - q.x); } }
    plan = P; W.fieldDirty = true; W.miniDirty = true;
  }
  const gen0 = W.generate; W.generate = function (seed) { const r = gen0.apply(this, arguments); if (ici()) generer(seed); else plan = null; return r; };

  // ---------- le sol : les oasis, le grand temple vu d'en haut, ses marches ----------
  const el = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fill(); };
  const pa0 = W.paint; W.paint = function () {
    const r = pa0.apply(this, arguments); if (!W.terrain) return r; const g = W.terrain.getContext('2d');
    if (Te.ici() === 4 && Ds.plan()) { const x = (Ds.PASSAGE + 0.5) * T, y = (CG.MH - 4) * T; el(g, x - 78, y + 8, 16, 5, 'rgba(60,40,20,0.3)'); el(g, x + 78, y + 8, 16, 5, 'rgba(60,40,20,0.3)'); return r; }
    if (!ici() || !plan) return r; const rng = CG.makeRng(plan.seed + 77);
    for (const o of plan.oasis) { // l'herbe autour, puis l'eau
      for (let k = 0; k < 26; k++) { const a = rng() * TAU, d = 1.05 + rng() * 0.5; el(g, o.x + Math.cos(a) * o.rx * d, o.y + Math.sin(a) * o.ry * d, 16 + rng() * 22, 9 + rng() * 10, 'hsla(' + (86 + rng() * 22) + ',44%,' + (40 + rng() * 10) + '%,' + (0.5 + rng() * 0.3) + ')', rng() * 3); }
      el(g, o.x, o.y, o.rx * 1.08, o.ry * 1.12, '#c8b070'); el(g, o.x, o.y, o.rx, o.ry, '#3f9ab8'); el(g, o.x, o.y + 2, o.rx * 0.84, o.ry * 0.8, '#2f84a8'); el(g, o.x - o.rx * 0.3, o.y - o.ry * 0.3, o.rx * 0.3, o.ry * 0.18, 'rgba(255,255,255,0.22)', -0.2);
      for (let k = 0; k < 10; k++) { const a = rng() * TAU, x = o.x + Math.cos(a) * o.rx * 1.05, y = o.y + Math.sin(a) * o.ry * 1.05; g.strokeStyle = '#3a7a34'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); for (let j = -1; j <= 1; j++) { g.moveTo(x, y); g.lineTo(x + j * 4, y - 9 - rng() * 6); } g.stroke(); } }
    for (const t of plan.tentes) { el(g, (t.x + 0.5) * T + 6, (t.y + 0.5) * T + 16, 30, 8, 'rgba(60,40,20,0.3)'); if (t.feu) { el(g, t.feu.x, t.feu.y, 15, 7, 'rgba(50,40,34,0.6)'); for (let k = 0; k < 6; k++) el(g, t.feu.x + Math.cos(k) * 12, t.feu.y + Math.sin(k) * 5, 3.4, 2.4, '#8a8478'); } }
    for (const t of plan.temples) el(g, t.x + 8, t.y + 2, 110, 14, 'rgba(60,40,20,0.3)');
    for (const p of plan.palmiers) el(g, (p.x + 0.5) * T + 10, (p.y + 0.5) * T + 14, 20 * p.s, 6 * p.s, 'rgba(60,40,20,0.25)');
    const Gt = plan.grand; if (Gt) { // dix gradins de grès, de plus en plus étroits ; au milieu, l'escalier
      el(g, Gt.x + 14, Gt.yBas + 10, 8.4 * T, 22, 'rgba(60,40,20,0.3)');
      for (let r2 = 0; r2 < 10; r2++) { const hw = 7 - Math.floor(r2 / 2), y = (Gt.ty - 3 - r2) * T, x0 = (Gt.tx - hw) * T, w = (hw * 2 + 1) * T, l = 54 + r2 * 2.2;
        g.fillStyle = 'hsl(36,48%,' + l + '%)'; g.fillRect(x0, y, w, T); g.fillStyle = 'rgba(255,244,200,0.35)'; g.fillRect(x0, y, w, 3); g.fillStyle = 'rgba(70,44,14,0.3)'; g.fillRect(x0, y + T - 6, w, 6); g.fillStyle = 'rgba(70,44,14,0.16)'; g.fillRect(x0 + w - T * 0.8, y, T * 0.8, T);
        g.strokeStyle = 'rgba(90,60,20,0.25)'; g.lineWidth = 1; g.beginPath(); for (let bx = x0 + 14 + (r2 % 2) * 12; bx < x0 + w; bx += 28) { g.moveTo(bx, y + 4); g.lineTo(bx, y + T - 6); } g.stroke();
        if (r2 % 2 === 0) for (let k = -1; k <= 1; k += 2) { const gx = Gt.x + k * (hw - 0.4) * T; g.fillStyle = 'rgba(47,106,192,0.55)'; g.fillRect(gx - 8, y + 12, 16, 4); g.fillStyle = 'rgba(232,200,74,0.7)'; g.fillRect(gx - 8, y + 18, 16, 2.5); } }
      const sx = (Gt.tx - 1) * T, sw = 3 * T, sy0 = (Gt.ty - 12) * T, sy1 = (Gt.ty - 2) * T + T; g.fillStyle = '#e4c88a'; g.fillRect(sx, sy0, sw, sy1 - sy0);
      for (let y = sy0; y < sy1; y += 8) { g.fillStyle = 'rgba(90,60,20,0.3)'; g.fillRect(sx, y + 6, sw, 2); g.fillStyle = 'rgba(255,246,210,0.3)'; g.fillRect(sx, y, sw, 1.5); } /* les marches */
      g.fillStyle = '#b88a4a'; g.fillRect(sx - 7, sy0, 7, sy1 - sy0); g.fillRect(sx + sw, sy0, 7, sy1 - sy0); g.fillStyle = 'rgba(255,244,200,0.4)'; g.fillRect(sx - 7, sy0, 2, sy1 - sy0); g.fillRect(sx + sw, sy0, 2, sy1 - sy0); /* les rampes */ }
    return r;
  };
  const mi0 = W.drawMini; W.drawMini = function () { const r = mi0.apply(this, arguments); if (!ici() || !plan || !W.mini) return r; const g = W.mini.getContext('2d');
    g.fillStyle = '#3f9ab8'; for (const o of plan.oasis) for (const q of o.eau) g.fillRect(q[0] * 2, q[1] * 2, 2, 2);
    g.fillStyle = '#e8c84a'; for (const t of plan.temples) g.fillRect(t.tx * 2 - 4, (t.ty - 5) * 2, 10, 6); if (plan.grand) { g.fillRect((plan.grand.tx - 3) * 2, (plan.grand.ty - 13) * 2, 14, 22); g.fillStyle = '#fff6c8'; g.fillRect(plan.grand.tx * 2 - 1, (plan.grand.ty - 12) * 2, 4, 20); }
    g.fillStyle = '#c8322a'; for (const t of plan.tentes) g.fillRect(t.x * 2 - 1, t.y * 2 - 1, 4, 4); return r; };

  // ---------- ce qui tient debout : palmiers, tentes, petits temples, le sanctuaire du grand temple, les obélisques du passage ----------
  const PALM = [];
  function imagePalmier(v) { if (PALM[v]) return PALM[v]; const c = document.createElement('canvas'); c.width = 120; c.height = 130; const g = c.getContext('2d'), bx = 60, by = 126, pen = [10, -8, 3][v], tx = bx + pen, ty = 44;
    g.strokeStyle = '#7a5a34'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx - pen * 0.6, 86, tx, ty); g.stroke(); g.strokeStyle = 'rgba(40,24,10,0.3)'; g.lineWidth = 1.6; for (let i = 0; i < 9; i++) { const k = i / 9, x = bx + (tx - bx) * k * k - pen * 0.3 * Math.sin(k * 3), y = by + (ty - by) * k; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y - 2); g.stroke(); }
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.62, lg = 40 + (i % 3) * 6, ex = tx + Math.cos(a) * lg, ey = ty + Math.sin(a) * lg * 0.55 + 14, mx = tx + Math.cos(a) * lg * 0.55, my = ty + Math.sin(a) * lg * 0.7 - 6;
      g.fillStyle = i % 2 ? '#3f8a3a' : '#4fa044'; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my - 8, ex, ey); g.quadraticCurveTo(mx, my + 6, tx, ty + 3); g.fill(); g.strokeStyle = 'rgba(20,60,20,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my - 2, ex, ey); g.stroke(); }
    el(g, tx - 4, ty + 6, 4, 4.4, '#6a4722'); el(g, tx + 4, ty + 7, 4, 4.4, '#7a5530'); return (PALM[v] = c); }
  const TENTE = [['#b02a3a', '#e8e0c8'], ['#2f5a8a', '#e8e0c8'], ['#c89a20', '#7a3a1c']];
  const palmierS = { draw(g, o) { const p = o.p, im = imagePalmier(p.v), w = 120 * p.s, h = 130 * p.s; g.drawImage(im, (p.x + 0.5) * T - w / 2, (p.y + 0.5) * T + 14 - h, w, h); } };
  const tenteS = { draw(g, o, t) { const q = o.q, x = (q.x + 0.5) * T, y = (q.y + 0.5) * T + 16, C = TENTE[q.v];
    g.fillStyle = C[0]; g.beginPath(); g.moveTo(x - 34, y); g.lineTo(x, y - 54); g.lineTo(x + 34, y); g.closePath(); g.fill(); g.fillStyle = C[1]; [[-22, -11], [11, 22]].forEach(b => { g.beginPath(); g.moveTo(x + b[0], y); g.lineTo(x + b[0] * 0.08, y - 50); g.lineTo(x + b[1] * 0.08, y - 50); g.lineTo(x + b[1], y); g.closePath(); g.fill(); });
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x, y - 54); g.lineTo(x + 34, y); g.closePath(); g.fill(); g.fillStyle = '#1c1410'; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x, y - 30); g.lineTo(x + 9, y); g.closePath(); g.fill();
    g.strokeStyle = '#5a3d22'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 54); g.lineTo(x, y - 66); g.stroke(); g.fillStyle = C[0]; g.beginPath(); g.moveTo(x, y - 66); g.lineTo(x + 11 + Math.sin(t * 4 + q.x) * 2, y - 62); g.lineTo(x, y - 58); g.closePath(); g.fill();
    if (q.feu) { const f = q.feu, fl = Math.sin(t * 9) * 2; g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(f.x - 6, f.y); g.quadraticCurveTo(f.x - 8, f.y - 10, f.x + fl, f.y - 20); g.quadraticCurveTo(f.x + 8, f.y - 10, f.x + 6, f.y); g.fill(); el(g, f.x, f.y - 5, 3, 5, '#ffe36b'); } } };
  function petitTemple(g, x, y, ouvert, t) { // un bloc de grès entre quatre colonnes, à moitié enseveli
    g.fillStyle = '#c8a058'; g.fillRect(x - 92, y - 104, 184, 106); g.fillStyle = 'rgba(255,244,200,0.3)'; g.fillRect(x - 92, y - 104, 184, 4); g.fillStyle = 'rgba(70,44,14,0.2)'; g.fillRect(x + 40, y - 104, 52, 106);
    g.fillStyle = '#b88a4a'; g.fillRect(x - 100, y - 118, 200, 16); g.fillStyle = '#e0bc74'; g.fillRect(x - 100, y - 118, 200, 4); g.fillStyle = 'rgba(47,106,192,0.6)'; g.fillRect(x - 92, y - 98, 184, 4); g.fillStyle = 'rgba(232,200,74,0.7)'; g.fillRect(x - 92, y - 92, 184, 2.5);
    [-76, -38, 38, 76].forEach(k => { g.fillStyle = '#d8b46a'; g.fillRect(x + k - 9, y - 100, 18, 100); g.fillStyle = 'rgba(255,244,200,0.35)'; g.fillRect(x + k - 9, y - 100, 4, 100); g.fillStyle = '#b88a4a'; g.fillRect(x + k - 12, y - 104, 24, 7); g.fillRect(x + k - 12, y - 6, 24, 7); });
    g.fillStyle = '#0c0806'; g.beginPath(); g.moveTo(x - 16, y + 2); g.lineTo(x - 16, y - 46); g.lineTo(x - 9, y - 56); g.lineTo(x + 9, y - 56); g.lineTo(x + 16, y - 46); g.lineTo(x + 16, y + 2); g.closePath(); g.fill();
    if (ouvert) { g.fillStyle = 'rgba(255,190,80,' + (0.16 + Math.sin(t * 2.2) * 0.06) + ')'; g.beginPath(); g.ellipse(x, y - 22, 11, 20, 0, 0, TAU); g.fill(); } else { g.fillStyle = '#8a6a34'; g.fillRect(x - 15, y - 44, 30, 46); g.strokeStyle = 'rgba(40,24,10,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 44); g.lineTo(x, y + 2); g.stroke(); } /* fait aujourd'hui : la dalle est refermée */
    el(g, x, y - 76, 9, 9, '#e8c84a'); el(g, x, y - 76, 4.5, 4.5, '#c8322a'); el(g, x - 70, y + 2, 44, 12, '#e6cd92'); el(g, x + 60, y + 3, 52, 13, '#e6cd92'); el(g, x - 92, y - 16, 22, 24, '#e6cd92'); /* le sable qui l'ensevelit */ }
  const templeS = { draw(g, o, t) { petitTemple(g, o.x, o.y, !fait('temple' + o.i), t || 0); } };
  const sanctuaireS = { draw(g, o, t) { const x = o.x, y = o.y; t = t || 0; // au sommet des marches : la porte noire, un disque d'or, deux braseros
    g.fillStyle = '#d0a860'; g.fillRect(x - 3.5 * T, y - 96, 7 * T, 96); g.fillStyle = 'rgba(255,244,200,0.35)'; g.fillRect(x - 3.5 * T, y - 96, 7 * T, 4); g.fillStyle = 'rgba(70,44,14,0.2)'; g.fillRect(x + 2 * T, y - 96, 1.5 * T, 96);
    g.fillStyle = '#b88a4a'; g.fillRect(x - 3.7 * T, y - 110, 7.4 * T, 16); g.fillStyle = '#e8c84a'; g.fillRect(x - 3.7 * T, y - 110, 7.4 * T, 4);
    [-2.6, -1.4, 1.4, 2.6].forEach(k => { g.fillStyle = '#e0bc74'; g.fillRect(x + k * T - 9, y - 92, 18, 92); g.fillStyle = 'rgba(47,106,192,0.6)'; g.fillRect(x + k * T - 9, y - 80, 18, 5); g.fillRect(x + k * T - 9, y - 22, 18, 5); });
    g.fillStyle = '#0a0604'; g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x - 22, y - 56); g.lineTo(x - 12, y - 70); g.lineTo(x + 12, y - 70); g.lineTo(x + 22, y - 56); g.lineTo(x + 22, y); g.closePath(); g.fill();
    if (!fait('grand')) { g.fillStyle = 'rgba(255,190,80,' + (0.18 + Math.sin(t * 2) * 0.07) + ')'; g.beginPath(); g.ellipse(x, y - 28, 15, 26, 0, 0, TAU); g.fill(); } else { g.fillStyle = '#8a6a34'; g.fillRect(x - 21, y - 56, 42, 56); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 0.3; g.strokeStyle = 'rgba(255,227,107,0.8)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + Math.cos(a) * 15, y - 128 + Math.sin(a) * 15); g.lineTo(x + Math.cos(a) * 22, y - 128 + Math.sin(a) * 22); g.stroke(); } el(g, x, y - 128, 13, 13, '#e8c84a'); el(g, x - 3, y - 131, 6, 6, '#fff0a0');
    [-1, 1].forEach(k => { const bx = x + k * 2 * T, fl = Math.sin(t * 9 + k) * 2; g.fillStyle = '#6a4a22'; g.fillRect(bx - 3, y - 26, 6, 26); g.fillStyle = '#8a6a34'; g.fillRect(bx - 10, y - 32, 20, 7); g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(bx - 8, y - 32); g.quadraticCurveTo(bx - 10, y - 46, bx + fl, y - 58); g.quadraticCurveTo(bx + 10, y - 46, bx + 8, y - 32); g.fill(); el(g, bx, y - 38, 4, 6, '#ffe36b'); }); } };
  const obelisqueS = { draw(g, o) { const x = o.x, y = o.y; g.fillStyle = '#c8a058'; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 6, y - 84); g.lineTo(x + 6, y - 84); g.lineTo(x + 9, y); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,244,200,0.3)'; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 6, y - 84); g.lineTo(x - 2, y - 84); g.lineTo(x - 4, y); g.closePath(); g.fill();
    g.fillStyle = '#e8c84a'; g.beginPath(); g.moveTo(x - 6, y - 84); g.lineTo(x, y - 98); g.lineTo(x + 6, y - 84); g.closePath(); g.fill(); g.strokeStyle = 'rgba(70,45,10,0.5)'; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(x - 3, y - 70 + i * 16); g.lineTo(x + 3, y - 70 + i * 16); g.moveTo(x, y - 66 + i * 16); g.lineTo(x, y - 60 + i * 16); } g.stroke(); } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments);
    if (Te.ici() === 4 && Ds.plan()) { const x = (Ds.PASSAGE + 0.5) * T, y = (CG.MH - 4) * T + 8; [-78, 78].forEach(k => { if (CG.onScreen(x + k, y - 40)) push(y, 21, Object.assign({ x: x + k, y }, obelisqueS), null); }); return; }
    if (!ici() || !plan) return;
    for (const p of plan.palmiers) { const x = (p.x + 0.5) * T, y = (p.y + 0.5) * T + 12; if (CG.onScreen(x, y - 40) || CG.onScreen(x, y - 110)) push(y, 21, Object.assign({ x, y, p }, palmierS), null); }
    for (const q of plan.tentes) { const x = (q.x + 0.5) * T, y = (q.y + 0.5) * T + 16; if (CG.onScreen(x, y - 30)) push(y, 21, Object.assign({ x, y, q }, tenteS), null); }
    for (const t of plan.temples) { const y = (t.ty - 2) * T - 2; if (CG.onScreen(t.x, y - 50) || CG.onScreen(t.x - 90, y) || CG.onScreen(t.x + 90, y)) push(y, 21, Object.assign({ x: t.x, y, i: t.i }, templeS), null); }
    const Gt = plan.grand; if (Gt) { const y = Gt.yHaut - 2; if (CG.onScreen(Gt.x, y - 60) || CG.onScreen(Gt.x - 130, y) || CG.onScreen(Gt.x + 130, y) || CG.onScreen(Gt.x, y - 130)) push(y, 21, Object.assign({ x: Gt.x, y }, sanctuaireS), null); } }; }

  // ---------- la nuit : les traces bleues et la trappe ; le jour : un peu de sable dans le vent ----------
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); if (!ici() || !plan || !plan.trappe || !nuit() || fait('trappe')) return; const P = plan;
    const b = P.trappe; if (!CG.onScreen(b.x, b.y)) return; el(g, b.x, b.y, 38, 22, 'rgba(60,170,255,' + (0.16 + Math.sin(t * 2.4) * 0.06) + ')');
    g.fillStyle = '#4a3220'; g.fillRect(b.x - 22, b.y - 14, 44, 28); g.fillStyle = '#7a5530'; g.fillRect(b.x - 19, b.y - 11, 38, 22); g.strokeStyle = 'rgba(30,18,8,0.6)'; g.lineWidth = 1.5; g.beginPath(); [-7, 5].forEach(k => { g.moveTo(b.x + k, b.y - 11); g.lineTo(b.x + k, b.y + 11); }); g.stroke();
    g.fillStyle = '#3a3a42'; g.fillRect(b.x - 19, b.y - 7, 38, 3); g.fillRect(b.x - 19, b.y + 4, 38, 3); g.strokeStyle = '#c8ccd8'; g.lineWidth = 2; g.beginPath(); g.arc(b.x + 12, b.y, 4, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(140,225,255,' + (0.5 + Math.sin(t * 3) * 0.25) + ')'; g.lineWidth = 1.6; g.strokeRect(b.x - 22, b.y - 14, 44, 28); }; }
  // les traces luisent par-dessus le noir de la nuit : une lueur bleue qui court le long de la piste, vers la trappe
  { const ll0 = CG.lueurs; CG.lueurs = function (g, t) { if (ll0) ll0.apply(this, arguments); if (!ici() || !plan || !plan.trappe || !nuit() || fait('trappe')) return; const P = plan, n = P.trace.length;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const q = P.trace[i]; if (!CG.onScreen(q.x, q.y) || !W.walkPx(q.x, q.y)) continue; const onde = 0.5 + 0.5 * Math.sin(t * 2.6 - i * 0.55), a = 0.22 + 0.5 * onde, ox = Math.cos(q.a + Math.PI / 2) * 5 * q.cote, oy = Math.sin(q.a + Math.PI / 2) * 5 * q.cote; /* une lueur qui court le long de la piste, vers la trappe */
      g.save(); g.translate(q.x + ox, q.y + oy); g.rotate(q.a); g.fillStyle = 'rgba(40,150,255,' + a * 0.4 + ')'; g.beginPath(); g.ellipse(0, 0, 15, 9, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(90,200,255,' + a + ')'; g.beginPath(); g.ellipse(-1, 0, 5.4, 3, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(6, 0, 2.6, 2.2, 0, 0, TAU); g.fill(); g.restore(); }
    g.restore();
    const b = P.trappe; if (CG.onScreen(b.x, b.y)) { g.strokeStyle = 'rgba(140,225,255,' + (0.5 + Math.sin(t * 3) * 0.25) + ')'; g.lineWidth = 1.6; g.strokeRect(b.x - 22, b.y - 14, 44, 28); } }; }
  // les traces percent le noir de la nuit : c'est par elles qu'on les voit de loin
  { const lu0 = CG.lumieres; CG.lumieres = function (light, t) { if (lu0) lu0.apply(this, arguments); if (!ici() || !plan || !plan.trappe || !nuit() || fait('trappe')) return; const P = plan;
    for (let i = 0; i < P.trace.length; i++) { const q = P.trace[i]; if (!CG.onScreen(q.x, q.y) || !W.walkPx(q.x, q.y)) continue; light(q.x, q.y, 26, 0.2); }
    light(P.trappe.x, P.trappe.y, 60, 0.6); }; }
  let dit = false, ventT = 0;
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !ici() || !plan) { dit = false; return r; } const p = S.player;
    if (R.terreM === Sa.MONDE && R.desertFait && !R.sablesE) renforcer(R);
    if (nuit() && !dit && plan.trappe && !fait('trappe') && !R.cine) { dit = true; G.banner('La nuit tombe sur les dunes', 'Des traces bleues se mettent à luire dans le sable. Elles partent du carrefour... et mènent quelque part.', '#9ad8ff'); } if (!nuit()) dit = false;
    ventT -= dt; if (ventT <= 0 && R.cam) { ventT = 0.07; const x = p.x + rand(-620, 620), y = p.y + rand(-340, 340); R.parts.push({ x, y, vx: rand(110, 190), vy: rand(-12, 12), life: 0.9, max: 0.9, col: 'rgba(240,214,160,0.7)', size: rand(1.2, 2.6), float: true }); }
    return r;
  };
  // les bêtes : toutes plus fortes, et une bonne part des meutes devient des créatures d'ici
  function renforcer(R) {
    const S = CG.S; R.sablesE = true; const l = R.enemies.filter(e => e.tk !== undefined && !e.dead), meutes = {};
    l.forEach(e => { const k = Math.round(((e.wild && e.wild.x) || e.x) / 150) + ':' + Math.round(((e.wild && e.wild.y) || e.y) / 150); (meutes[k] = meutes[k] || []).push(e); });
    Object.keys(meutes).sort().forEach((k, i) => { const m = meutes[k], rng = CG.makeRng((S.seed || 1) + S.day * 71 + i * 131 + 6);
      if (rng() < Sa.NEUFS) { const sortes = Sa.MEUTES[Math.floor(rng() * Sa.MEUTES.length)].filter(t => CG.ENEMIES[t]); if (sortes.length) { m.forEach((e, j) => { const type = sortes[j % sortes.length], i0 = R.enemies.indexOf(e); if (i0 >= 0) R.enemies.splice(i0, 1); e.dead = true;
          const n = G.spawnEnemy(type, e.x, e.y, { wild: true }); if (!n) return; n.tk = e.tk; n.desert = true; n.sables = true; if (e.leash) n.leash = e.leash; }); return; } }
      m.forEach(e => { e.maxhp = Math.round(e.maxhp * Sa.FORCE[0]); e.hp = e.maxhp; e.dmg *= Sa.FORCE[1]; e.sables = true; }); });
  }

  // ---------- les passages et les portes ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || R.ko > 0 || R.cine || R.build || Te.pending) return it; const p = S.player, m = Te.ici();
    if (m === 4 && Ds.plan() && !it) { const c = W.center(Ds.PASSAGE, CG.MH - 4); if (Math.hypot(p.x - c.x, p.y - c.y) < 84) return { type: 'sablesChemin', obj: { x: p.x, y: p.y - 30 }, label: p.lvl >= Sa.NIV ? 'Descendre vers les Sables sans fin' : 'Les Sables sans fin : il faut être niveau ' + Sa.NIV }; return it; }
    if (m !== Sa.MONDE || !plan || (it && it.type !== 'sleep')) return it; /* « dormir à la belle étoile » est proposé partout la nuit : une porte ou la trappe passent avant */
    const Gt = plan.grand; if (Gt && !fait('grand') && Math.hypot(p.x - Gt.porte.x, p.y - Gt.porte.y) < Sa.PORTE_PRES) return { type: 'sablesPorte', cle: 'grand', q: 'grandTemple', obj: { x: Gt.porte.x, y: Gt.porte.y - 50 }, label: 'Entrer dans le grand temple du soleil' };
    for (const t of plan.temples) if (!fait('temple' + t.i) && Math.hypot(p.x - t.x, p.y - t.y) < Sa.PORTE_PRES) return { type: 'sablesPorte', cle: 'temple' + t.i, q: 'templeSable', obj: { x: t.x, y: t.y - 60 }, label: 'Entrer dans le temple des sables' };
    const b = plan.trappe; if (b && nuit() && !fait('trappe') && Math.hypot(p.x - b.x, p.y - b.y) < Sa.TRAPPE_PRES) return { type: 'sablesPorte', cle: 'trappe', q: 'repaireVoleurs', obj: { x: b.x, y: b.y - 30 }, label: 'Ouvrir la trappe' };
    return it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(), S = CG.S; if (!it || (it.type !== 'sablesChemin' && it.type !== 'sablesPorte')) return in0.apply(this, arguments); const p = S.player;
    if (it.type === 'sablesChemin') { if (p.lvl < Sa.NIV) { CG.sfx('no'); return UI.toast('🏜️ Au-delà des obélisques, il n\'y a plus que du sable, et tout y est mortel. Reviens quand tu seras niveau ' + Sa.NIV + ' (tu es niveau ' + p.lvl + ').'); } return Te.partir(Sa.MONDE); }
    if (CG.R.enemies.some(e => !e.dead && !e.calm && e.target === p && Math.hypot(e.x - p.x, e.y - p.y) < 220)) { CG.sfx('no'); return UI.toast('Pas avec des ennemis sur le dos !'); }
    if (Ar && Ar.partir) Ar.partir(it.q, it.cle);
  };
  Sa.aller = () => Te.partir(Sa.MONDE); // pour les essais
})(window.CG);
