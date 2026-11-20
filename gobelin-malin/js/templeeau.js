// Goblin Malin — le temple englouti. Certains jours, un tourbillon tourne au milieu d'un étang. Celui qui arrive à poser le pied dessus
// (potion de nénuphar, passe-muraille...) est aspiré jusqu'à un temple sous l'eau. Là-dessous tout est bleu, on manque d'air : il faut
// revenir respirer près des algues à bulles. Des monstres d'eau partout, et au fond le gardien : une énorme pieuvre.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, Ar = CG.Arene, Gn = CG.GrotteNid, Mo = CG.Mondes, T = CG.TILE, MW = CG.MW, MH = CG.MH, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  if (!Ar || !Gn || !Mo) return;
  const Te = CG.TempleEau = { ID: 'templeEau', CHANCE: 0.4, JOUR: 4, LOIN: 9, AIR: 32, RESPIRE: 45, PRES_ALGUE: 78, NOYADE: 0.06, ASPIRE: 1.9,
    FOUET: { cd: 3.4, prep: 0.7, long: 200, large: 24, dmg: 1.2 }, HUILE: { cd: 10, v: 300, dur: 5.5, taches: 8 }, JET: { cd: 15, dur: 3.6, tour: 1.5, long: 240, large: 20, dmg: 0.9, pousse: 540, pousseT: 0.35, bras: 3 }, HATE: { cd: 16, dur: 5, vit: 1.8 } };
  /* AIR : secondes de souffle ; RESPIRE : souffle rendu par seconde près d'une algue ; NOYADE : part de la vie perdue par seconde sans air */
  const dedans = () => Gn.mode() === 'eau';
  // ---------- les monstres d'eau ----------
  CG.ENEMIES.meduse = { nom: 'Méduse', race: 'bete', hp: 18, dmg: 5, spd: 66, xp: 14, or: 6, cost: 2.5, r: 12 };
  CG.ENEMIES.crabeTemple = { nom: 'Crabe du temple', race: 'bete', hp: 42, dmg: 7, spd: 60, xp: 20, or: 9, cost: 4, r: 14 };
  CG.ENEMIES.murene = { nom: 'Murène', race: 'bete', hp: 22, dmg: 6, spd: 118, xp: 16, or: 7, cost: 3, r: 12 };
  CG.ENEMIES.gardienEau = { nom: 'Le gardien englouti', race: 'bete', hp: 95, dmg: 9, spd: 72, xp: 160, or: 80, cost: 20, r: 20 };
  Ar.Q[Te.ID] = { mondes: [], qui: 'Le temple englouti', lieu: 'Le temple englouti', titre: 'Le temple englouti', theme: 'eau', donjon: true, chef: ['gardienEau', 'Le gardien englouti'],
    entree: 'Tu es sous l\'eau ! Ton souffle baisse : reviens respirer près des algues qui font des bulles. Bats tout ce qui nage ici, jusqu\'au gardien. Dehors, le temps s\'est arrêté.',
    E: [['meduse', 'meduse', 'murene', 'crabeTemple'], ['meduse', 'murene', 'murene', 'crabeTemple', 'crabeTemple'], ['meduse', 'meduse', 'murene', 'murene', 'crabeTemple', 'crabeTemple']],
    recompense(A) { const S = CG.S, p = S.player, d = S.day, or = 120 + 18 * d + (A.palier || 0) * 50, xp = 60 + 9 * d; if (S.tourbillon) S.tourbillon.fait = true;
      G.gain('or', or, p.x, p.y - 50); G.addXp(xp); S.morale = Math.min(100, S.morale + 4); let plus = ''; const id = Math.random() < 0.7 ? G.newScroll() : null; if (id) { G.giveScroll(id, p.x, p.y); plus = ' Et un parchemin tout mouillé !'; }
      G.banner('Le gardien englouti est vaincu', 'Le tourbillon te recrache sur la rive. (+' + or + ' 🪙, +' + xp + ' XP, moral +4.)' + plus, '#bfe6ff'); CG.sfx('victory'); } };
  // ---------- le tourbillon, dans un étang ----------
  const eau = (x, y) => W.inMap(x, y) && W.tile[W.idx(x, y)] === W.WATER, fond = (x, y) => eau(x, y) && eau(x + 1, y) && eau(x - 1, y) && eau(x, y + 1) && eau(x, y - 1);
  Te.ici = function () { const S = CG.S; if (!S || Mo.ici() === 2) return null; let q = S.tourbillon;
    if (!q || q.day !== S.day) { q = S.tourbillon = { day: S.day, la: false, fait: false, x: -1, y: -1 }; let f; try { f = G.firePos(); } catch (e) { f = null; }
      if (f && S.day >= Te.JOUR && Math.random() < Te.CHANCE) { const c = []; for (let y = 3; y < MH - 3; y++) for (let x = 3; x < MW - 3; x++) if (fond(x, y) && Math.hypot(x - f.x / T, y - f.y / T) > Te.LOIN) c.push([x, y]); if (c.length) { const k = pick(c); q.x = k[0]; q.y = k[1]; q.la = true; } } }
    return q.la && !q.fait && eau(q.x, q.y) ? q : null; };
  Te.pos = () => { const q = Te.ici(); return q ? { x: (q.x + 0.5) * T, y: (q.y + 0.5) * T } : null; };
  // ---------- le décor du temple (peint une fois) ----------
  let algues = [];
  Te.peindre = function (P, cols) {
    const c = W.terrain = document.createElement('canvas'); c.width = MW * T; c.height = MH * T; const g = c.getContext('2d'), I = W.idx, tile = W.tile, rng = CG.makeRng(CG.S.arene.seed + 9); algues = [];
    g.fillStyle = '#041826'; g.fillRect(0, 0, c.width, c.height);
    const tous = P.salles.concat(P.recoins), x0 = Math.max(1, Math.min.apply(null, tous.map(s => s.x0)) - 3), x1 = Math.min(MW - 2, Math.max.apply(null, tous.map(s => s.x0 + s.w)) + 3), y0 = Math.max(1, Math.min.apply(null, tous.map(s => s.y0)) - 3), y1 = Math.min(MH - 2, Math.max.apply(null, tous.map(s => s.y0 + s.h)) + 3);
    const F = (x, y) => tile[I(x, y)] === W.FLOOR || cols.has(x + y * 1000);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!F(x, y)) continue; const k = W.hash(x, y), px = x * T, py = y * T; /* des dalles claires à moitié couvertes de sable */
      g.fillStyle = 'hsl(' + (178 + k * 10) + ',26%,' + (44 + k * 5 + ((x + y) % 2) * 3) + '%)'; g.fillRect(px, py, T, T); g.strokeStyle = 'rgba(10,50,60,0.35)'; g.lineWidth = 1.2; g.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
      if (k > 0.45) { g.fillStyle = 'rgba(226,208,150,' + (0.25 + k * 0.3) + ')'; g.beginPath(); g.ellipse(px + 8 + k * 22, py + 12 + k * 18, 12 + k * 10, 6 + k * 5, k * 3, 0, TAU); g.fill(); }
      if (k < 0.14) { g.strokeStyle = 'rgba(8,40,50,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + 6 + k * 90, py + 5); g.lineTo(px + 14 + k * 60, py + 17); g.lineTo(px + 9 + k * 80, py + 30); g.stroke(); } }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (F(x, y)) { if (!F(x, y - 1)) { const gr = g.createLinearGradient(0, y * T, 0, y * T + 18); gr.addColorStop(0, 'rgba(0,30,50,0.5)'); gr.addColorStop(1, 'rgba(0,30,50,0)'); g.fillStyle = gr; g.fillRect(x * T, y * T, T, 18); } continue; }
      let pres = false; for (let dy = -1; dy <= 1 && !pres; dy++) for (let dx = -1; dx <= 1; dx++) if (F(x + dx, y + dy)) { pres = true; break; } if (!pres) continue; const px = x * T, py = y * T, k = W.hash(x * 3, y * 5);
      if (F(x, y + 1)) { g.fillStyle = '#0c3442'; g.fillRect(px, py - 14, T, 14); g.fillStyle = 'hsl(186,34%,' + (30 + k * 5) + '%)'; g.fillRect(px, py, T, T); g.fillStyle = 'rgba(0,20,30,0.22)'; g.fillRect(px, py + T * 0.55, T, T * 0.45);
        g.strokeStyle = 'rgba(4,30,40,0.55)'; g.lineWidth = 1.2; g.beginPath(); for (let r = 0; r < 3; r++) { const yy = py + 13 * r; g.moveTo(px, yy + 13); g.lineTo(px + T, yy + 13); const off = (r + y) % 2 ? 10 : 30; g.moveTo(px + off, yy); g.lineTo(px + off, yy + 13); } g.stroke();
        g.fillStyle = 'hsl(180,36%,' + (44 + k * 6) + '%)'; g.fillRect(px, py - 3, T, 5); if (x % 3 === 0) { g.strokeStyle = '#e8d48a'; g.lineWidth = 1.6; g.beginPath(); g.arc(px + 20, py + 18, 7, 0, TAU); g.moveTo(px + 13, py + 18); g.quadraticCurveTo(px + 20, py + 12, px + 27, py + 18); g.stroke(); } /* un vieux signe gravé, doré */
        if (k > 0.55) { g.fillStyle = 'rgba(60,150,90,0.75)'; g.fillRect(px + 4 + k * 20, py - 3, 9, 9 + k * 12); } /* de la mousse qui pend */
      } else { g.fillStyle = 'hsl(192,40%,' + (13 + k * 4) + '%)'; g.fillRect(px, py, T, T); g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(px + 3 + k * 10, py + 4 + k * 12, 14, 9); } }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!cols.get(x + y * 1000)) continue; const px = x * T, py = y * T; /* des colonnes à moitié cassées */
      g.fillStyle = 'rgba(0,20,30,0.4)'; g.beginPath(); g.ellipse(px + 20, py + 33, 17, 6, 0, 0, TAU); g.fill(); const cg = g.createLinearGradient(px + 9, 0, px + 31, 0); cg.addColorStop(0, '#5a9aa0'); cg.addColorStop(0.45, '#a8dcd8'); cg.addColorStop(1, '#3a7480'); const h = W.hash(x, y) > 0.5 ? 56 : 34;
      g.fillStyle = '#3a7078'; g.fillRect(px + 5, py + 24, 30, 9); g.fillStyle = cg; g.fillRect(px + 9, py + 26 - h, 22, h); if (h > 40) { g.fillStyle = '#8accc8'; g.fillRect(px + 5, py - 36, 30, 8); } else { g.fillStyle = '#3a7480'; g.beginPath(); g.moveTo(px + 9, py + 26 - h); g.lineTo(px + 16, py + 20 - h); g.lineTo(px + 22, py + 27 - h); g.lineTo(px + 31, py + 22 - h); g.lineTo(px + 31, py + 28 - h); g.lineTo(px + 9, py + 28 - h); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(60,150,90,0.7)'; g.fillRect(px + 9, py + 6, 6, 12); }
    tous.forEach(s => { for (let i = 0; i < Math.round(s.w * s.h / 14); i++) { const px = s.x0 * T + 14 + rng() * (s.w * T - 28), py = s.y0 * T + 22 + rng() * (s.h * T - 36), q = rng(); if (!W.walkPx(px, py)) continue;
      if (q < 0.3) { const col = pick(['#e8607a', '#f09a4a', '#c86ad8']); g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py + 6); g.lineTo(px, py - 6); g.moveTo(px, py); g.lineTo(px - 7, py - 9); g.moveTo(px, py - 2); g.lineTo(px + 7, py - 10); g.moveTo(px - 4, py - 5); g.lineTo(px - 10, py - 4); g.stroke(); } /* du corail */
      else if (q < 0.5) { g.fillStyle = '#f0e2c0'; g.beginPath(); g.arc(px, py, 6, Math.PI, TAU); g.fill(); g.strokeStyle = '#c8b088'; g.lineWidth = 1; g.beginPath(); for (let j = -2; j <= 2; j++) { g.moveTo(px, py); g.lineTo(px + j * 2.6, py - 5.5); } g.stroke(); } /* un coquillage */
      else if (q < 0.7) { g.strokeStyle = '#3a9a5a'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); for (let j = -1; j <= 1; j++) { g.moveTo(px + j * 5, py + 6); g.quadraticCurveTo(px + j * 9, py - 4, px + j * 4, py - 14); } g.stroke(); } /* des herbes */
      else { g.fillStyle = 'rgba(226,208,150,0.4)'; g.beginPath(); g.ellipse(px, py, 10 + rng() * 16, 5 + rng() * 6, 0, 0, TAU); g.fill(); } } });
    P.salles.forEach((s, i) => { const coins = [[s.x0 + 1, s.y0 + 1], [s.x0 + s.w - 2, s.y0 + s.h - 2], [s.x0 + 1, s.y0 + s.h - 2], [s.x0 + s.w - 2, s.y0 + 1]], n = i === P.salles.length - 1 ? 3 : 1; let mis = 0; /* les algues à bulles : une par salle, trois chez le gardien */
      for (const k of (i % 2 ? coins.slice().reverse() : coins)) { if (mis >= n) break; if (tile[I(k[0], k[1])] !== W.FLOOR) continue; algues.push({ x: (k[0] + 0.5) * T, y: (k[1] + 0.7) * T }); mis++; } });
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
  };
  Te.algues = () => algues;
  const algue = { draw(g, o, t) { const x = o.x, y = o.y; g.fillStyle = 'rgba(0,20,30,0.3)'; g.beginPath(); g.ellipse(x, y + 2, 16, 5, 0, 0, TAU); g.fill();
    for (let i = -2; i <= 2; i++) { const w = Math.sin(t * 1.8 + i * 1.1) * 5, h = 34 - Math.abs(i) * 6; g.strokeStyle = i % 2 ? '#2f9a58' : '#48c070'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + i * 6, y); g.quadraticCurveTo(x + i * 7 + w, y - h * 0.5, x + i * 5 + w * 1.6, y - h); g.stroke(); }
    for (let i = 0; i < 5; i++) { const k = (t * 0.55 + i / 5) % 1; g.strokeStyle = 'rgba(235,250,255,' + (1 - k) * 0.9 + ')'; g.fillStyle = 'rgba(200,235,255,' + (1 - k) * 0.25 + ')'; g.lineWidth = 1.3; g.beginPath(); g.arc(x - 8 + i * 4 + Math.sin(t * 3 + i) * 3, y - 24 - k * 46, 2 + k * 3, 0, TAU); g.fill(); g.stroke(); } } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); if (!dedans()) return; for (const a of algues) if (CG.onScreen(a.x, a.y)) push(a.y, 21, Object.assign({ x: a.x, y: a.y }, algue), null); }; }
  // ---------- les taches d'huile sur l'écran ----------
  Te.tacher = function () { let d = document.getElementById('huile'); if (!d) { d = document.createElement('div'); d.id = 'huile'; d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;overflow:hidden'; document.body.appendChild(d); }
    const H = Te.HUILE; for (let i = 0; i < H.taches; i++) { const b = document.createElement('i'), w = rand(13, 25), h = w * rand(0.7, 1.1), rot = 'rotate(' + Math.round(rand(0, 360)) + 'deg)'; b.style.cssText = 'position:absolute;left:' + rand(2, 78) + '%;top:' + rand(2, 72) + '%;width:' + w + 'vmin;height:' + h + 'vmin;border-radius:' + rand(38, 60) + '% ' + rand(40, 62) + '% ' + rand(36, 58) + '% ' + rand(42, 64) + '%;background:radial-gradient(circle at 40% 35%,rgba(40,34,30,.97),rgba(8,6,6,.96) 55%,rgba(0,0,0,.85) 72%,rgba(0,0,0,0) 76%);transform:' + rot + ' scale(.2);opacity:0;transition:transform .25s ease-out,opacity .2s';
      d.appendChild(b); requestAnimationFrame(() => { b.style.opacity = '1'; b.style.transform = rot + ' scale(1)'; });
      setTimeout(() => { b.style.transition = 'opacity 1.4s, transform 1.6s ease-in'; b.style.opacity = '0'; b.style.transform = 'translateY(9vmin) ' + rot + ' scale(1)'; }, (H.dur - 1.5) * 1000 + i * 90); setTimeout(() => b.remove(), H.dur * 1000 + 900); } };
  // ---------- le gardien : ses quatre coups ----------
  const etat = new WeakMap(), seg = (px, py, x1, y1, x2, y2) => { const vx = x2 - x1, vy = y2 - y1, k = CG.clamp(((px - x1) * vx + (py - y1) * vy) / (vx * vx + vy * vy || 1), 0, 1); return Math.hypot(px - (x1 + vx * k), py - (y1 + vy * k)); };
  function gardien(e, dt) { const S = CG.S, R = CG.R, p = S.player; let q = etat.get(e); if (!q) { q = { ph: null, t: 0, fouet: 2, huile: 5, jet: 8, hate: 6, hateT: 0, vit: e.spd, coup: 0 }; etat.set(e, q); e.aggroR = 640; } /* il ne lâche pas le chef, même repoussé au bout de la salle */
    if (e.daze > 0 || e.para > 0 || e.sleepT > 0 || e.poly || e.fear > 0) return; const d = Math.hypot(p.x - e.x, p.y - e.y), vu = d < 520 && !(R.ko > 0) && !(R.invis > 0), F = Te.FOUET, J = Te.JET;
    ['fouet', 'huile', 'jet', 'hate'].forEach(k => { q[k] -= dt; }); q.coup -= dt;
    if (q.hateT > 0) { q.hateT -= dt; e.spd = q.vit * Te.HATE.vit; if (Math.random() < dt * 20) R.parts.push({ x: e.x + rand(-18, 18), y: e.y - rand(0, 30), vx: rand(-20, 20), vy: -rand(20, 60), life: 0.5, max: 0.5, col: '#dff6ff', size: 3, float: true }); if (q.hateT <= 0) e.spd = q.vit; }
    if (q.ph) { e.rooted = Math.max(e.rooted, 0.2); e.path = null; e.x = q.x; e.y = q.y; q.t -= dt; e.atkCd = Math.max(e.atkCd, 0.4); }
    if (q.ph === 'fouet') { if (q.t <= 0) { q.ph = 'claque'; q.t = 0.28; e.atkAnim = 1; const x2 = e.x + Math.cos(q.a) * F.long, y2 = e.y + Math.sin(q.a) * F.long; if (seg(p.x, p.y - 8, e.x, e.y - 10, x2, y2 - 10) < F.large && !(R.ko > 0)) { G.hurtPlayer(e.dmg * F.dmg); R.shake = Math.max(R.shake || 0, 0.2); } for (let i = 1; i <= 5; i++) G.puff(e.x + Math.cos(q.a) * F.long * i / 5, e.y - 6 + Math.sin(q.a) * F.long * i / 5, '#dff6ff', 4, 70, 3); CG.sfx('hit'); } return; }
    if (q.ph === 'claque') { if (q.t <= 0) q.ph = null; return; }
    if (q.ph === 'jet') { q.ang += J.tour * dt; if (q.coup <= 0 && !(R.ko > 0)) for (let i = 0; i < J.bras; i++) { const a = q.ang + i * TAU / J.bras; if (seg(p.x, p.y - 8, e.x, e.y - 12, e.x + Math.cos(a) * J.long, e.y - 12 + Math.sin(a) * J.long) < J.large) { q.coup = 0.8; G.hurtPlayer(e.dmg * J.dmg); const dx = p.x - e.x, dy = p.y - e.y, l = Math.hypot(dx, dy) || 1; R.jetPousse = { x: dx / l * J.pousse, y: dy / l * J.pousse, t: J.pousseT }; G.text(p.x, p.y - 70, '🌊', '#fff', true); CG.sfx('hurt'); break; } }
      if (q.t <= 0) q.ph = null; return; }
    if (!vu) return; const debut = k => { q.ph = k; q.x = e.x; q.y = e.y; };
    if (q.jet <= 0 && d < J.long + 40) { debut('jet'); q.t = J.dur; q.ang = Math.atan2(p.y - e.y, p.x - e.x) + 1.2; q.jet = J.cd; q.coup = 0.5; G.text(e.x, e.y - 110, '🌊 Jets d\'eau !', '#bfe6ff', true); CG.sfx('warning'); return; }
    if (q.fouet <= 0 && d < F.long - 10 && d > 46) { debut('fouet'); q.t = F.prep; q.a = Math.atan2(p.y - e.y, p.x - e.x); q.fouet = F.cd; e.face = p.x > e.x ? 1 : -1; CG.sfx('swing'); return; }
    if (q.huile <= 0 && d > 90 && d < 460 && W.lineClear(e.x, e.y, p.x, p.y)) { q.huile = Te.HUILE.cd; e.atkAnim = 1; const l = d || 1; (R.huiles || (R.huiles = [])).push({ x: e.x, y: e.y - 20, vx: (p.x - e.x) / l * Te.HUILE.v, vy: (p.y - 14 - (e.y - 20)) / l * Te.HUILE.v, life: 1.9 }); CG.sfx('swing'); return; }
    if (q.hate <= 0 && q.hateT <= 0 && d > 150) { q.hate = Te.HATE.cd; q.hateT = Te.HATE.dur; G.text(e.x, e.y - 110, '💨 Il accélère !', '#dff6ff', true); R.rings.push({ x: e.x, y: e.y - 10, r: 70, life: 0.5, col: '#dff6ff' }); CG.sfx('spell'); } }
  // ---------- chaque instant : le tourbillon dehors ; dedans, le souffle, les bulles, le gardien ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night || R.cine) return; const p = S.player;
    if (!dedans()) { R.souffle = undefined; const c = Te.pos(); if (R.aspire) { const a = R.aspire; a.t += dt; p.x += (a.x - p.x) * Math.min(1, dt * 8); p.y += (a.y - p.y) * Math.min(1, dt * 8); R.invuln = Math.max(R.invuln || 0, 0.5); R.atkCd = Math.max(R.atkCd || 0, 0.3); /* le tourbillon l'avale : on ne peut plus rien faire */
        if (Math.random() < dt * 40) { const an = Math.random() * TAU, r = 30 * (1 - a.t / a.dur) + 8; R.parts.push({ x: a.x + Math.cos(an) * r, y: a.y + Math.sin(an) * r * 0.55, vx: -Math.sin(an) * 90, vy: Math.cos(an) * 50, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffffff' : '#bfe6ff', size: rand(2, 4), float: true }); }
        if (!a.dit && a.t > a.dur * 0.45) { a.dit = true; G.text(a.x, a.y - 60, 'Glou... glou...', '#dff6ff', true); }
        if (a.t >= a.dur) { R.aspire = null; R.rings.push({ x: a.x, y: a.y, r: 60, life: 0.5, col: '#dff2ff' }); if (!Ar.partir(Te.ID)) R.tourbT = 2; } return; }
      R.tourbT = (R.tourbT || 0) - dt; if (c && !Mo.pending && !(R.ko > 0) && !R.alarm && R.tourbT <= 0 && Math.hypot(p.x - c.x, p.y - c.y) < 17) { R.aspire = { t: 0, dur: Te.ASPIRE, x: c.x, y: c.y }; CG.sfx('spell'); R.rings.push({ x: c.x, y: c.y, r: 50, life: 0.5, col: '#dff2ff' }); } return; }
    if (R.souffle === undefined) R.souffle = 100; const A = S.arene, pres = algues.some(a => Math.hypot(a.x - p.x, a.y - 16 - p.y) < Te.PRES_ALGUE); R.respire = pres;
    if (R.jetPousse) { const k = R.jetPousse, d = Math.min(dt, k.t); G.slide(p, k.x * d, 0, 9); G.slide(p, 0, k.y * d, 9); k.t -= dt; if (k.t <= 0 || R.ko > 0) R.jetPousse = null; }
    if (!(R.ko > 0)) { if (pres || A.gagne) R.souffle = Math.min(100, R.souffle + Te.RESPIRE * dt); else R.souffle = Math.max(0, R.souffle - 100 / Te.AIR * dt);
      if (R.souffle <= 0) { p.hp -= p.maxhp * Te.NOYADE * dt; R.noieT = (R.noieT || 0) - dt; if (R.noieT <= 0) { R.noieT = 1; G.text(p.x, p.y - 70, '🫧 De l\'air !', '#bfe6ff', true); G.puff(p.x, p.y - 30, '#dff6ff', 6, 60, 3); } if (p.hp <= 0) { p.hp = 0.5; R.invuln = 0; G.hurtPlayer(5); } } }
    if (Math.random() < dt * (pres ? 9 : 3)) R.parts.push({ x: p.x + rand(-6, 6), y: p.y - 34, vx: rand(-8, 8), vy: -rand(30, 60), life: 0.9, max: 0.9, col: '#dff6ff', size: rand(2, 3.5), float: true }); /* les bulles du chef */
    if (R.huiles && R.huiles.length) { for (const h of R.huiles) { h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt; if (!W.walkPx(h.x, h.y + 14)) h.life = 0; else if (Math.hypot(h.x - p.x, h.y - (p.y - 14)) < 20 && !(R.ko > 0)) { h.life = 0; Te.tacher(); G.text(p.x, p.y - 70, 'Beurk ! De l\'encre !', '#d8d0c8', true); G.puff(p.x, p.y - 20, '#1a1414', 14, 110, 4); CG.sfx('hurt'); } } R.huiles = R.huiles.filter(h => h.life > 0); }
    if (!A.gagne) for (const e of R.enemies) if (e.type === 'gardienEau' && !e.dead) gardien(e, dt);
  };
  // ---------- dessin des monstres d'eau ----------
  const ell = (g, x, y, rx, ry, f, a) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, TAU); g.fill(); };
  function meduse(g, e, t) { const b = Math.sin(t * 2.6) * 3, x = e.x, y = e.y - 22 + b, s = 1 + Math.sin(t * 2.6 + 1.5) * 0.08; ell(g, e.x, e.y + 2, 10, 3.5, 'rgba(0,20,30,0.25)');
    g.strokeStyle = 'rgba(240,170,230,0.8)'; g.lineWidth = 1.8; g.lineCap = 'round'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 4, y + 2); g.quadraticCurveTo(x + i * 5 + Math.sin(t * 4 + i) * 3, y + 10, x + i * 4 + Math.sin(t * 4 + i + 1) * 4, y + 19 - Math.abs(i) * 2); g.stroke(); }
    g.fillStyle = 'rgba(236,150,226,0.82)'; g.beginPath(); g.ellipse(x, y, 12 * s, 10 / s, 0, Math.PI, TAU); g.lineTo(x + 12 * s, y + 2); g.quadraticCurveTo(x, y + 6, x - 12 * s, y + 2); g.closePath(); g.fill(); ell(g, x - 4, y - 5, 4, 2.4, 'rgba(255,240,255,0.7)', -0.4);
    ell(g, x - 3.6 + e.face, y - 1, 1.5, 1.9, '#3a1040'); ell(g, x + 3.6 + e.face, y - 1, 1.5, 1.9, '#3a1040'); if (e.atkAnim > 0) { g.strokeStyle = '#fff6a0'; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 4; i++) { const a = t * 9 + i * 1.6; g.moveTo(x + Math.cos(a) * 12, y + 8 + Math.sin(a) * 6); g.lineTo(x + Math.cos(a) * 18, y + 8 + Math.sin(a) * 9); } g.stroke(); } }
  function crabe(g, e, t) { const x = e.x, w = e.moving ? Math.sin(e.step * 2.2) : 0, y = e.y - 8 - Math.abs(w) * 1.5, pc = e.atkAnim > 0 ? e.atkAnim * 5 : 0; ell(g, e.x, e.y + 2, 16, 5, 'rgba(0,20,30,0.28)');
    g.strokeStyle = '#a84a2a'; g.lineWidth = 2.6; g.lineCap = 'round'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const k = Math.sin(e.step * 2.2 + i * 2 + (s > 0 ? 1.5 : 0)) * (e.moving ? 3 : 0); g.beginPath(); g.moveTo(x + s * 9, y + 2 + i * 2); g.lineTo(x + s * (16 + i * 2), y + 1 + i * 2 - 3); g.lineTo(x + s * (19 + i * 2) + k, y + 8); g.stroke(); }
    ell(g, x, y, 14, 9, '#d8643a'); ell(g, x, y - 2, 11, 5.5, '#ee8a56'); ell(g, x - 5, y - 4, 3, 1.6, '#ffc49a');
    for (const s of [-1, 1]) { g.strokeStyle = '#c8542e'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(x + s * 11, y - 3); g.lineTo(x + s * 17, y - 11 - pc); g.stroke(); ell(g, x + s * 18.5, y - 14 - pc, 5, 4, '#e8744a'); g.strokeStyle = '#7a2a14'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + s * 18.5, y - 14 - pc); g.lineTo(x + s * 23, y - 16 - pc); g.stroke();
      g.strokeStyle = '#a84a2a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + s * 4, y - 7); g.lineTo(x + s * 4.5, y - 13); g.stroke(); ell(g, x + s * 4.5, y - 14, 2.1, 2.1, '#fff'); ell(g, x + s * 4.5 + e.face * 0.6, y - 14, 1, 1, '#1a1010'); } }
  function murene(g, e, t) { const f = e.face || 1, x = e.x, y = e.y - 16 + Math.sin(t * 3) * 2, ou = e.atkAnim > 0 ? e.atkAnim * 4 : 1.2; ell(g, e.x, e.y + 2, 15, 4, 'rgba(0,20,30,0.25)');
    g.strokeStyle = '#3a7a52'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); for (let i = 0; i <= 6; i++) { const k = i / 6, px = x - f * (k * 30 - 8), py = y + Math.sin(t * 7 - k * 5) * (2 + k * 5); if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke();
    g.strokeStyle = '#e8d86a'; g.lineWidth = 2; g.setLineDash([3, 5]); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#4a9464'; g.beginPath(); g.moveTo(x + f * 4, y - 6); g.lineTo(x + f * 17, y - 3 - ou * 0.5); g.lineTo(x + f * 8, y - 1); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x + f * 4, y + 6); g.lineTo(x + f * 16, y + 2 + ou); g.lineTo(x + f * 8, y + 1); g.closePath(); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + f * (9 + i * 2.4), y - 2); g.lineTo(x + f * (10 + i * 2.4), y + 1); g.lineTo(x + f * (11 + i * 2.4), y - 2.4); g.closePath(); g.fill(); }
    ell(g, x + f * 5, y - 4, 2.4, 2.4, '#ffe36b'); ell(g, x + f * 5.6, y - 4, 1, 1.6, '#1a1010'); }
  // le gardien : une tête énorme, et huit tentacules sur lesquelles il marche
  function gardienArt(g, e, t) { const q = etat.get(e) || {}, f = e.face || 1, ph = e.step * 1.6, mv = e.moving ? 1 : 0, bob = mv ? Math.abs(Math.sin(ph)) * 3 : Math.sin(t * 1.6) * 1.2, x = e.x, y = e.y - 16 - bob, jet = q.ph === 'jet', hate = q.hateT > 0;
    ell(g, e.x, e.y + 3, 30, 9, 'rgba(0,20,30,0.3)');
    for (let i = 0; i < 8; i++) { const cote = i < 4 ? -1 : 1, k = i % 4, hx = x + cote * (5 + k * 4.5), hy = y + 12, pas = ph + (i % 2 ? Math.PI : 0) + k * 0.5, av = Math.cos(pas) * 9 * mv * f, lv = Math.max(0, Math.sin(pas)) * 8 * mv; /* les tentacules avancent quatre par quatre, comme des pattes */
      let fx = e.x + cote * (14 + k * 8) + av, fy = e.y + 4 - k * 2.5 - lv + (mv ? 0 : Math.sin(t * 2 + i) * 1.5); if (jet) { fx = e.x + Math.cos(q.ang + i * TAU / 8) * 30; fy = e.y - 4 + Math.sin(q.ang + i * TAU / 8) * 12; }
      const mx = (hx + fx) / 2 + cote * 5, my = Math.min(hy, fy) - 5 - lv * 0.6; g.strokeStyle = '#5a2f86'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(mx, my, fx, fy); g.stroke(); g.strokeStyle = '#8a56bc'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(hx, hy - 1); g.quadraticCurveTo(mx, my - 1, fx, fy - 1); g.stroke(); ell(g, fx, fy, 2.6, 2, '#e8b8e0'); }
    if (q.ph === 'fouet' || q.ph === 'claque') { const k = q.ph === 'claque' ? 1 : 0.25, L = Te.FOUET.long * k, ex = e.x + Math.cos(q.a) * L, ey = e.y - 10 + Math.sin(q.a) * L - (q.ph === 'fouet' ? 22 : 0); g.strokeStyle = '#5a2f86'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y + 6); g.quadraticCurveTo((x + ex) / 2, Math.min(y, ey) - (q.ph === 'fouet' ? 26 : 6), ex, ey); g.stroke(); g.strokeStyle = '#8a56bc'; g.lineWidth = 4; g.stroke(); ell(g, ex, ey, 5, 4, '#e8b8e0'); } /* la grande tentacule qui claque de loin */
    ell(g, x, y - 20, 25, 27, '#6a3a9a'); ell(g, x + 4, y - 14, 21, 19, '#522a7c'); ell(g, x - 8, y - 32, 10, 7, '#9a6acc', -0.5); ell(g, x + 9, y - 36, 4, 3, '#522a7c'); ell(g, x - 14, y - 16, 3.4, 2.6, '#522a7c'); ell(g, x + 15, y - 24, 3, 2.4, '#9a6acc'); ell(g, x, y + 4, 19, 9, '#6a3a9a');
    for (const s of [-1, 1]) { ell(g, x + s * 8 + f * 2, y - 3, 5.4, 4.8, '#fff2a0'); ell(g, x + s * 8 + f * 3.4, y - 2.6, 1.6, 3.4, '#1a0c14'); g.strokeStyle = '#3a1a5a'; g.lineWidth = 3.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + s * 14 + f * 2, y - 10); g.lineTo(x + s * 3 + f * 2, y - 5.4); g.stroke(); }
    const ou = e.atkAnim > 0 ? e.atkAnim * 3 : jet ? 2.4 : 0; ell(g, x + f * 3, y + 7, 4.6 + ou * 0.5, 2.6 + ou, '#3a1a5a'); ell(g, x + f * 3, y + 7.2, 2.8 + ou * 0.5, 1.2 + ou * 0.9, '#120610');
    if (hate) { g.strokeStyle = 'rgba(223,246,255,0.7)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - f * (30 + i * 7), y - 30 + i * 16); g.lineTo(x - f * (46 + i * 7), y - 30 + i * 16); g.stroke(); } } }
  const ae = Art.enemy; Art.enemy = function (g, e, t) { const k = e.type; if (k === 'meduse') return meduse(g, e, t + e.seed); if (k === 'crabeTemple') return crabe(g, e, t + e.seed); if (k === 'murene') return murene(g, e, t + e.seed); if (k === 'gardienEau') return gardienArt(g, e, t + e.seed); return ae.apply(this, arguments); };
  // ---------- dessin : le tourbillon, l'annonce des coups, les jets, le bleu de l'eau, le souffle ----------
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    if (!dedans()) { const c = Te.pos(); if (c && CG.onScreen(c.x, c.y)) { g.save(); g.translate(c.x, c.y + 2); g.scale(1, 0.55); ell(g, 0, 0, 17, 17, 'rgba(8,40,70,0.55)'); g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(230,246,255,' + (0.85 - i * 0.2) + ')'; g.lineWidth = 2.4 - i * 0.5; g.beginPath(); for (let k = 0; k <= 20; k++) { const a = -t * 3.2 + i * TAU / 3 + k * 0.22, r = 3 + k * 0.72; if (k) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); } g.restore(); } return; }
    for (const e of R.enemies) { if (e.type !== 'gardienEau' || e.dead) continue; const q = etat.get(e); if (!q || q.ph !== 'fouet') continue; const F = Te.FOUET, k = 1 - q.t / F.prep; /* là où la tentacule va claquer */
      g.save(); g.translate(e.x, e.y - 4); g.rotate(q.a); g.fillStyle = 'rgba(255,90,90,' + (0.12 + k * 0.22) + ')'; g.fillRect(0, -F.large, F.long, F.large * 2); g.strokeStyle = 'rgba(255,130,130,' + (0.4 + k * 0.4) + ')'; g.lineWidth = 2; g.strokeRect(0, -F.large, F.long, F.large * 2); g.restore(); }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R || !dedans()) return; const p = CG.S.player, J = Te.JET;
    for (const e of R.enemies) { if (e.type !== 'gardienEau' || e.dead) continue; const q = etat.get(e); if (!q || q.ph !== 'jet') continue; /* les jets d'eau tournants */
      for (let i = 0; i < J.bras; i++) { const a = q.ang + i * TAU / J.bras; g.save(); g.translate(e.x, e.y - 12); g.rotate(a); const gr = g.createLinearGradient(0, 0, J.long, 0); gr.addColorStop(0, 'rgba(235,250,255,0.95)'); gr.addColorStop(1, 'rgba(120,200,255,0.15)'); g.fillStyle = gr; g.beginPath(); g.moveTo(14, -5); g.lineTo(J.long, -J.large * 0.8); g.lineTo(J.long, J.large * 0.8); g.lineTo(14, 5); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.setLineDash([12, 14]); g.lineDashOffset = -t * 260; g.beginPath(); g.moveTo(16, 0); g.lineTo(J.long, 0); g.stroke(); g.setLineDash([]); g.restore(); } }
    for (const h of R.huiles || []) { g.fillStyle = '#0c0808'; g.beginPath(); g.ellipse(h.x, h.y, 9, 7, Math.atan2(h.vy, h.vx), 0, TAU); g.fill(); g.fillStyle = 'rgba(120,110,100,0.7)'; g.beginPath(); g.ellipse(h.x - 2, h.y - 2, 3, 2, 0, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(16,96,170,0.24)'; g.fillRect(p.x - 1500, p.y - 1100, 3000, 2200); /* tout est bleu, là-dessous */
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = p.x - 900 + ((i * 420 + t * 26) % 1900), w = 60 + (i % 3) * 30; g.fillStyle = 'rgba(120,200,255,' + (0.035 + (i % 2) * 0.02) + ')'; g.beginPath(); g.moveTo(x, p.y - 700); g.lineTo(x + w, p.y - 700); g.lineTo(x + w - 260, p.y + 700); g.lineTo(x - 260, p.y + 700); g.closePath(); g.fill(); } g.restore(); /* des rayons qui descendent de la surface */
    const s = R.souffle === undefined ? 100 : R.souffle, w = 46, x = p.x - w / 2, y = p.y - 78, bas = s < 25; /* le souffle, au-dessus de la tête */
    g.fillStyle = 'rgba(4,20,40,0.7)'; g.fillRect(x - 1, y - 1, w + 2, 7); g.fillStyle = bas ? (Math.sin(t * 10) > 0 ? '#ff6a5a' : '#ffb0a0') : R.respire ? '#9af0ff' : '#5ac8ff'; g.fillRect(x, y, w * s / 100, 5); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x, y, w * s / 100, 1.4);
    g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('🫧', x - 9, y + 6);
  };
  Te.essai = function () { const S = CG.S, c = []; for (let y = 3; y < MH - 3; y++) for (let x = 3; x < MW - 3; x++) if (fond(x, y)) c.push([x, y]); if (!c.length) return null; const p = S.player; c.sort((a, b) => Math.hypot(a[0] * T - p.x, a[1] * T - p.y) - Math.hypot(b[0] * T - p.x, b[1] * T - p.y)); S.tourbillon = { day: S.day, la: true, fait: false, x: c[0][0], y: c[0][1] }; return Te.pos(); };
})(window.CG);
