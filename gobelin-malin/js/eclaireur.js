// Goblin Malin — l'éclaireur et les découvertes : la mini-carte ne montre que le territoire, le reste se découvre.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, Sc = CG.Scout = {};
  const SEE = 185, CHIEF_SEE = 215;

  // ---------- le métier ----------
  CG.JOBS.eclaireur = { nom: 'Éclaireur', nomF: 'Éclaireuse', icon: '🧭', desc: 'Explore les alentours et revient te raconter ce qu\'il a vu : trésors, bêtes, monstres, repaires ennemis. Ses découvertes s\'ajoutent à la carte.' };
  CG.JOB_ORDER.splice(CG.JOB_ORDER.indexOf('garde') + 1, 0, 'eclaireur');
  CG.Art8.LOOKS.eclaireur = { tunic: '#3f6a6a', tool: null, cape: '#2f4a3a' };
  if (CG.Art.JOBCOL) CG.Art.JOBCOL.eclaireur = '#3f6a6a';
  if (CG.LINES) CG.LINES.eclaireur = ['J\'ai les meilleurs yeux du clan. Et les meilleures jambes.', 'La forêt est pleine de choses que personne n\'a encore vues.', 'Je regarde, je compte, je reviens. Jamais je ne me bats.'];

  // ---------- ce qu'il y a à découvrir ----------
  const PLACES = [
    ['ruines', '🏛️', 'de vieilles ruines hantées'], ['portail', '🌀', 'un étrange portail de pierre'], ['cache', '🕳️', 'une cachette secrète'],
    ['nid', '🕸️', 'un vieux nid d\'araignées'], ['ile', '🏝️', 'une clairière isolée près de l\'eau']
  ];
  const BEAST = { loup: ['🐺', 'un loup solitaire'], sanglier: ['🐗', 'un sanglier sauvage'], ours: ['🐻', 'un ours'], araignee: ['🕷️', 'une araignée géante'], squelette: ['💀', 'un squelette'] };
  const CAMP = { tente: ['⛺', 'une tente de brigands'], camp: ['🏕️', 'un camp humain'], cabane: ['🛖', 'une cabane de gnomes archers'], grotte: ['👹', 'une grotte d\'ogres'] };
  Sc.targets = function () {
    const S = CG.S, R = CG.R, out = [];
    PLACES.forEach(p => { const c = W.center(W.POI[p[0]].x, W.POI[p[0]].y); out.push({ key: 'lieu:' + p[0], x: c.x, y: c.y, icon: p[1], txt: p[2] }); });
    { const c = W.center(W.GRAVE.x, W.GRAVE.y); out.push({ key: 'lieu:cimetiere', x: c.x, y: c.y, icon: '🪦', txt: 'un vieux cimetière' }); }
    W.chestDefs.forEach((c, i) => { if (S.chests.includes(i)) return; const p = W.center(c.x, c.y); out.push({ key: 'coffre:' + i, x: p.x, y: p.y, icon: '💰', txt: 'un coffre au trésor', small: true }); });
    for (const e of R.enemies) { if (e.struct || e.dead || !e.wild || e.campId || e.type === 'squelette' || !BEAST[e.type]) continue; out.push({ key: 'bete:' + S.day + ':' + e.id, x: e.x, y: e.y, icon: BEAST[e.type][0], txt: BEAST[e.type][1], beast: true }); }
    for (const e of R.enemies) { if (!e.struct || e.dead || !CAMP[e.type]) continue; out.push({ key: 'camp:' + e.type + ':' + Math.round(e.x) + ':' + Math.round(e.y), x: e.x, y: e.y, icon: CAMP[e.type][0], txt: CAMP[e.type][1], foe: true }); }
    return out;
  };
  const found = () => CG.S.found || (CG.S.found = {});
  function where(t) {
    const f = G.firePos(), dx = t.x - f.x, dy = t.y - f.y, a = Math.abs(dx), b = Math.abs(dy);
    const ns = dy < 0 ? 'nord' : 'sud', eo = dx > 0 ? 'est' : 'ouest';
    return a > b * 2.2 ? 'à l\'' + eo : b > a * 2.2 ? 'au ' + ns : 'au ' + ns + '-' + eo;
  }
  // une découverte : elle s'écrit dans les nouvelles et s'allume sur la mini-carte
  Sc.reveal = function (t, who, delay) {
    const S = CG.S, F = found(); if (F[t.key]) return false; F[t.key] = S.day;
    setTimeout(() => {
      if (!CG.running || CG.S !== S) return;
      CG.UI.toast('🧭 ' + (who ? who + ' a repéré ' : 'Tu as découvert ') + t.txt + ', ' + where(t) + ' du village. ' + t.icon);
      CG.R.pings.push({ x: t.x, y: t.y, t0: performance.now(), icon: t.icon, foe: t.foe });
      const m = document.getElementById('mini'); m.classList.remove('ping'); void m.offsetWidth; m.classList.add('ping');
      CG.sfx(t.foe ? 'warning' : 'discovery');
    }, (delay || 0) * 1000);
    return true;
  };

  // ---------- le travail de l'éclaireur ----------
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function goNear(g, x, y) {
    for (let i = 0; i < 14; i++) { const a = Math.random() * TAU, r = i < 2 ? 50 : 60 + i * 12, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (W.walkPx(px, py) && G.goTo(g, px, py)) return true; }
    return false;
  }
  function look(g) {
    const F = found(), seen = g.seen || (g.seen = []);
    for (const t of Sc.targets()) if (!F[t.key] && !seen.includes(t.key) && d2(g, t) < SEE) { seen.push(t.key); G.text(g.x, g.y - 46, '❗', '#ffe36b', true); g.bubble = '👀'; }
  }
  Sc.step = function (g, dt) {
    const S = CG.S, fire = G.firePos(), seen = g.seen || (g.seen = []);
    if (!['idle', 'sGo', 'sLook', 'sBack', 'sTell'].includes(g.state)) g.state = 'idle';
    if (g.state === 'idle') {
      g.moving = false; g.timer -= dt; if (g.timer > 0) return true;
      const F = found(), late = S.hour >= 17.5;
      if (seen.length && d2(g, fire) < 240) { g.state = 'sTell'; g.timer = 1.2; return true; }
      if (seen.length >= 1 || g.trips >= 2) { g.trips = 0; if (G.goTo(g, fire.x + CG.rand(-50, 50), fire.y + CG.rand(50, 90))) { g.state = 'sBack'; return true; } }
      if (late) { g.timer = 3; return false; } // en fin de journée il reste au village
      const list = Sc.targets().filter(t => !F[t.key] && !seen.includes(t.key) && !(g.skip && g.skip[t.key] > CG.R.t)).sort((a, b) => d2(g, a) - d2(g, b));
      for (const t of list.slice(0, 3)) { if (goNear(g, t.x, t.y)) { g.state = 'sGo'; g.bubble = null; return true; } (g.skip || (g.skip = {}))[t.key] = CG.R.t + 90; }
      // plus rien de connu à trouver : il part au hasard, loin, voir s'il y a du nouveau
      for (let i = 0; i < 8; i++) { const x = CG.rand(4, CG.MW - 4) * T, y = CG.rand(4, CG.MH - 4) * T; if (Math.hypot(x - fire.x, y - fire.y) > 500 && W.walkPx(x, y) && G.goTo(g, x, y)) { g.state = 'sGo'; g.bubble = null; return true; } }
      g.timer = 2; return true;
    }
    if (g.state === 'sGo') {
      g.scanT = (g.scanT || 0) - dt; if (g.scanT <= 0) { g.scanT = 0.5; look(g); }
      if (G.follow(g, 62, dt)) { g.state = 'sLook'; g.timer = 7; g.trips = (g.trips || 0) + 1; look(g); }
      return true;
    }
    if (g.state === 'sLook') { g.moving = false; g.timer -= dt; if (Math.random() < dt * 1.6) g.face = -g.face; if (g.timer <= 0) { g.state = 'idle'; g.timer = 0.2; g.bubble = seen.length ? '👀' : null; } return true; }
    if (g.state === 'sBack') { if (G.follow(g, 66, dt)) { g.state = seen.length ? 'sTell' : 'idle'; g.timer = seen.length ? 1.2 : 12; } return true; }
    // de retour : il raconte tout, une découverte après l'autre
    g.moving = false; g.pose = 'cheer'; g.timer -= dt;
    if (g.timer <= 0) {
      const all = Sc.targets(); let n = 0;
      seen.forEach(k => { const t = all.find(o => o.key === k); if (t && Sc.reveal(t, g.name, n * 2.6)) n++; });
      g.seen = []; g.bubble = null; g.pose = null; g.state = 'idle'; g.timer = 14 + n * 2.6; /* il souffle un peu au village avant de repartir */ if (n) { G.gobXp(g, n * 2, 12); G.text(g.x, g.y - 50, '🧭 Chef ! J\'ai vu quelque chose !', '#ffe9a8', true); }
    }
    return true;
  };
  // le chef découvre aussi ce qu'il voit de ses propres yeux
  let chiefT = 0;
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments);
    chiefT -= dt; if (chiefT > 0 || !CG.S) return; chiefT = 0.5;
    const p = CG.S.player, F = found(); let n = 0;
    for (const t of Sc.targets()) if (!F[t.key] && d2(p, t) < CHIEF_SEE && Sc.reveal(t, null, n * 1.5)) n++;
  };
  // ---------- les villageois crient ce qu'ils croisent en chemin, hors du village : annonce en bas à gauche + repère animé sur la mini-carte ----------
  Sc.CRI = { vue: 170, village: 380, pause: 3.5 };
  const COFFRE = { vivres: 'une caisse de vivres', savoir: 'une idole ancienne', butin: 'une malle de butin', precieux: 'un coffre précieux', magique: 'un coffre magique' };
  const CRIS = ['Hé ! J\'ai vu {x}', 'Chef ! Il y a {x}', 'Oh ! Regardez, {x}', 'Par ici ! {x}'], ALERTE = ['Attention ! {x}', 'Aaah ! {x}', 'Danger ! {x}'];
  function crier(g, txt, x, y, icon, foe) {
    const R = CG.R, tpl = CG.pick(foe ? ALERTE : CRIS), dit = tpl.replace('{x}', foe ? txt.charAt(0).toUpperCase() + txt.slice(1) : txt).replace(/! ([a-zàéèêîôû])/, (m, c) => '! ' + c.toUpperCase());
    R.criT = R.t + Sc.CRI.pause;
    CG.UI.toast((foe ? '⚠️ ' : '📣 ') + g.name + ' : « ' + dit + ', ' + where({ x, y }) + ' du village ! » ' + icon);
    R.pings.push({ x, y, t0: performance.now(), icon, foe, dur: foe ? 12000 : 7000 }); // le repère reste et continue de battre, le temps de le trouver sur la carte
    const m = document.getElementById('mini'); if (m) { m.classList.remove('ping'); void m.offsetWidth; m.classList.add('ping'); }
    G.text(g.x, g.y - 50, foe ? '❗' : '👀', '#ffe36b', true); CG.sfx(foe ? 'warning' : 'discovery');
  }
  let criScan = 0;
  const up1 = G.update;
  G.update = function (dt) {
    up1.apply(this, arguments);
    criScan -= dt; if (criScan > 0 || !CG.S || !CG.R) return; criScan = 0.6;
    const S = CG.S, R = CG.R; if (R.t < (R.criT || 0) || S.hour < 6.2 || S.hour > 20) return;
    const fire = G.firePos(), F = found(), V = Sc.CRI.vue, dits = R.dits || (R.dits = {});
    let cibles = null;
    for (const g of S.goblins) {
      if (g.hidden || g.ko === true || g.job === 'eclaireur' || d2(g, fire) < Sc.CRI.village) continue; // l'éclaireur, lui, garde ses nouvelles pour son retour
      // un coffre du jour
      for (const c of R.chests) if (!c.open && !c.vu && d2(g, c) < V) { c.vu = true; return crier(g, COFFRE[c.kind] || 'un coffre', c.x, c.y, '💰', false); }
      // un lieu ou un repaire encore inconnu : il entre dans la carte pour de bon
      for (const t of cibles || (cibles = Sc.targets())) if (!t.beast && !F[t.key] && d2(g, t) < V) { F[t.key] = S.day; return crier(g, t.txt, t.x, t.y, t.icon, !!t.foe); }
      // des bêtes ou des monstres qui rôdent (une seule alerte par bande)
      for (const e of R.enemies) {
        if (e.dead || e.struct || !e.wild || d2(g, e) > V) continue;
        const jt = S.day + ':' + e.type, k = jt + ':' + Math.round(e.x / 260) + ':' + Math.round(e.y / 260); if (dits[k]) continue;
        const n = R.enemies.filter(o => !o.dead && o.type === e.type && d2(o, e) < 200).length, nom = CG.ENEMIES[e.type].nom.toLowerCase();
        dits[k] = 1; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) dits[jt + ':' + (Math.round(e.x / 260) + dx) + ':' + (Math.round(e.y / 260) + dy)] = 1;
        return crier(g, (n > 1 ? n + ' ' + nom.split(' ').map(w => /[sx]$/.test(w) ? w : w + (/eu$/.test(w) ? 'x' : 's')).join(' ') : 'un' + (/e$/.test(nom.split(' ')[0]) && !/^(squelette|gnome|ogre)/.test(nom) ? 'e ' : ' ') + nom) + ' en vue', e.x, e.y, (BEAST[e.type] || ['👹'])[0], true);
      }
    }
  };
  const init0 = G.initRuntime; G.initRuntime = function () { init0.apply(this, arguments); CG.R.pings = []; chiefT = 2; };

  // ---------- la mini-carte : territoire, clan, et seulement ce qui a été découvert ----------
  function badge(g, x, y, icon, s, foe) {
    g.fillStyle = foe ? 'rgba(120,16,10,0.9)' : 'rgba(30,22,10,0.85)'; g.beginPath(); g.arc(x, y, 6.2 * s, 0, TAU); g.fill();
    g.strokeStyle = foe ? '#ff5a4a' : '#ffe36b'; g.lineWidth = 1; g.stroke();
    g.font = Math.round(8.5 * s) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, x, y + 0.5);
  }
  // un lieu nettoyé aujourd'hui (cimetière, nid, ruines...) : un petit crochet vert à côté de son rond
  Sc.fait = t => { const R = CG.R; return !!(t && t.key && t.key.indexOf('lieu:') === 0 && R && R.siteDone && R.siteDone[t.key.slice(5)]); };
  Sc.coche = function (g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#1f7a2e'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); g.fillStyle = '#4ad85a'; g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-2.1, 0.2); g.lineTo(-0.5, 1.9); g.lineTo(2.3, -1.6); g.stroke(); g.restore(); };
  Sc.mini = function (g, dot) {
    const S = CG.S, R = CG.R, p = S.player, F = found(), k = 2 / T, now = performance.now();
    // les ennemis ne se voient que de près, ou une fois l'alerte donnée
    for (const e of R.enemies) { if (e.struct || e.dead) continue; if (e.seen) dot(e.x, e.y, e.wild ? '#ffb0a0' : '#ff3020', e.wild ? 2 : 4); }
    for (const c of R.chests) if (!c.open && (c.vu || c.flairFaux || d2(c, p) < 420)) dot(c.x, c.y, c.flairFaux ? '#ff4a3a' : '#ffe36b', c.flairFaux ? 4 : 3); /* en rouge : un coffre vorace flairé par le sort (sortsneufs.js) */ // vus par le chef, ou signalés par un villageois
    const fresh = {}; R.pings = R.pings.filter(q => now - q.t0 < (q.dur || 3400)); R.pings.forEach(q => { fresh[Math.round(q.x) + ':' + Math.round(q.y)] = q; });
    for (const t of Sc.targets()) { if (!F[t.key] || fresh[Math.round(t.x) + ':' + Math.round(t.y)]) continue; if (t.small) { const x = Math.round(t.x * k), y = Math.round(t.y * k); g.fillStyle = '#3a2408'; g.fillRect(x - 3, y - 2, 6, 5); g.fillStyle = '#ffd84a'; g.fillRect(x - 2, y - 1, 4, 3); g.fillStyle = '#8a5a14'; g.fillRect(x - 2, y, 4, 1); } else if (t.beast) dot(t.x, t.y, '#ffb0a0', 3); else { badge(g, t.x * k, t.y * k, t.icon, 0.85, t.foe); if (Sc.fait(t)) Sc.coche(g, t.x * k + 7, t.y * k + 6, 1); } }
    // l'animation d'une découverte : le trait part du village, les anneaux s'ouvrent, l'icône rebondit
    const f = G.firePos();
    for (const q of R.pings) {
      const a = (now - q.t0) / 1000, x = q.x * k, y = q.y * k, fx = f.x * k, fy = f.y * k, col = q.foe ? '255,90,74' : '255,227,107';
      const tr = Math.min(1, a / 0.7), e3 = 1 - Math.pow(1 - tr, 3);
      g.save(); g.lineCap = 'round';
      const LA = q.dur ? q.dur / 1000 - 0.6 : 2.6; if (a < LA) { g.globalAlpha = Math.min(1, (LA - a) * 1.5); g.strokeStyle = 'rgba(' + col + ',0.95)'; g.lineWidth = 1.6; g.setLineDash([3, 3]); g.lineDashOffset = -a * 14; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + (x - fx) * e3, fy + (y - fy) * e3); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
      if (a > 0.6) {
        const b = a - 0.6;
        if (b < 0.35) { g.fillStyle = 'rgba(255,255,255,' + (0.9 * (1 - b / 0.35)) + ')'; g.beginPath(); g.arc(x, y, 5 + b * 60, 0, TAU); g.fill(); }
        for (let i = 0; i < 3; i++) { const r = (q.dur ? (b - i * 0.28) % 1.7 : b - i * 0.28) / 1.3; if (r <= 0 || r >= 1) continue; g.strokeStyle = 'rgba(' + col + ',' + (1 - r) + ')'; g.lineWidth = 2.4 * (1 - r) + 0.5; g.beginPath(); g.arc(x, y, 4 + r * 30, 0, TAU); g.stroke(); }
        if (b < 1.1) for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + b * 1.5, r0 = 8 + b * 16, r1 = r0 + 6 * (1 - b / 1.1); g.strokeStyle = 'rgba(255,255,255,' + (1 - b / 1.1) + ')'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); g.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); g.stroke(); }
        const pk = Math.min(1, b / 0.55), s = pk < 1 ? 2.6 * Math.sin(pk * Math.PI * 0.5) * (1 + 0.35 * Math.sin(pk * Math.PI)) : 1 + 1.6 * Math.max(0, 1 - (b - 0.55) / 0.9) + (b < 2.4 ? Math.sin(b * 9) * 0.08 : 0);
        badge(g, x, y, q.icon, Math.max(0.2, s), q.foe);
      }
      g.restore();
    }
  };

  // ---------- cimetière : tombes et crypte ----------
  const node0 = CG.Art.node;
  CG.Art.node = function (g, n, t) {
    if (n.type !== 'tomb' && n.type !== 'crypt') return node0.apply(this, arguments);
    const x = n.x * T + T / 2, y = n.y * T + T / 2 + 8, el = (cx, cy, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); };
    if (n.type === 'crypt') {
      el(x, y + 4, 44, 10, 'rgba(0,0,0,0.28)');
      g.fillStyle = '#6a6a72'; g.fillRect(x - 34, y - 44, 68, 48); g.fillStyle = '#56565e'; g.fillRect(x, y - 44, 34, 48);
      g.fillStyle = '#7e7e88'; g.beginPath(); g.moveTo(x - 42, y - 44); g.lineTo(x, y - 74); g.lineTo(x + 42, y - 44); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.moveTo(x, y - 74); g.lineTo(x + 42, y - 44); g.lineTo(x, y - 44); g.closePath(); g.fill();
      g.fillStyle = '#17141c'; g.beginPath(); g.moveTo(x - 11, y + 4); g.lineTo(x - 11, y - 20); g.arc(x, y - 20, 11, Math.PI, 0); g.lineTo(x + 11, y + 4); g.closePath(); g.fill();
      g.fillStyle = '#8e8e98'; g.fillRect(x - 2.5, y - 98, 5, 26); g.fillRect(x - 9, y - 91, 18, 5);
      const gl = 0.25 + Math.sin((t || 0) * 2) * 0.12; el(x, y - 12, 7, 10, 'rgba(140,255,200,' + gl + ')');
      el(x - 26, y - 2, 9, 5, 'rgba(70,120,60,0.8)'); el(x + 30, y, 8, 4, 'rgba(70,120,60,0.8)');
      return;
    }
    const v = n.v || 0, lean = ((n.x * 7 + n.y * 13) % 5 - 2) * 0.05;
    el(x, y + 3, 13, 4.5, 'rgba(0,0,0,0.25)'); el(x, y + 12, 12, 7, 'rgba(96,72,44,0.55)');
    g.save(); g.translate(x, y + 2); g.rotate(lean);
    if (v === 0) { g.fillStyle = '#8a8a92'; g.beginPath(); g.moveTo(-9, 0); g.lineTo(-9, -16); g.arc(0, -16, 9, Math.PI, 0); g.lineTo(9, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(2, -24, 7, 24); g.fillStyle = '#5e5e66'; g.fillRect(-4, -17, 8, 2); g.fillRect(-4, -12, 6, 2); }
    else if (v === 1) { g.fillStyle = '#7c7c84'; g.fillRect(-3, -28, 6, 28); g.fillRect(-10, -21, 20, 6); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, -28, 3, 28); }
    else if (v === 2) { g.fillStyle = '#94948c'; g.fillRect(-10, -20, 20, 20); g.fillStyle = '#7a7a72'; g.fillRect(-12, -23, 24, 4); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(2, -20, 8, 20); g.fillStyle = 'rgba(60,110,60,0.7)'; g.fillRect(-10, -6, 6, 6); }
    else { g.fillStyle = '#6b4a2a'; g.fillRect(-2.5, -26, 5, 26); g.fillRect(-9, -19, 18, 4.5); g.fillStyle = '#eee6d0'; g.beginPath(); g.arc(0, -28, 5.5, 0, TAU); g.fill(); g.fillStyle = '#2a1c12'; g.fillRect(-3, -29.5, 2, 2); g.fillRect(1, -29.5, 2, 2); }
    g.restore();
  };

  // ---------- la grande carte (bouton à droite, ou touche C) ----------
  let big = null, bigCv = null, bigRaf = 0, fond = null, fondK = '', fondT = 0;
  // le fond de la carte : un vieux parchemin, le territoire peint dessus, bordure à l'encre, rose des vents. Refait seulement quand il change.
  function parchemin(w, h, s, ox, oy, u) {
    const c = fond || (fond = document.createElement('canvas')); c.width = w; c.height = h; const g = c.getContext('2d'), mw = CG.MW * T * s, mh = CG.MH * T * s;
    const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.72); gr.addColorStop(0, '#f6e8c0'); gr.addColorStop(0.7, '#e9d49c'); gr.addColorStop(1, '#c9a868'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(120,80,30,' + (0.03 + rnd() * 0.07) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, (1 + rnd() * 5) * u, 0, TAU); g.fill(); }
    const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
    g.save(); rr(ox, oy, mw, mh, 12 * u); g.clip(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(W.mini, ox, oy, mw, mh);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#f2dcaa'; g.fillRect(ox, oy, mw, mh); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(246,232,192,0.16)'; g.fillRect(ox, oy, mw, mh);
    g.strokeStyle = 'rgba(70,40,10,0.13)'; g.lineWidth = 1 * u; g.beginPath(); for (let i = 10; i < CG.MW; i += 10) { g.moveTo(ox + i * T * s, oy); g.lineTo(ox + i * T * s, oy + mh); } for (let j = 10; j < CG.MH; j += 10) { g.moveTo(ox, oy + j * T * s); g.lineTo(ox + mw, oy + j * T * s); } g.stroke();
    const vg = g.createRadialGradient(ox + mw / 2, oy + mh / 2, Math.min(mw, mh) * 0.42, ox + mw / 2, oy + mh / 2, Math.max(mw, mh) * 0.74); vg.addColorStop(0, 'rgba(110,70,25,0)'); vg.addColorStop(1, 'rgba(110,70,25,0.5)'); g.fillStyle = vg; g.fillRect(ox, oy, mw, mh); g.restore();
    g.strokeStyle = '#4a2e12'; g.lineWidth = 3 * u; rr(ox, oy, mw, mh, 12 * u); g.stroke(); g.lineWidth = 1.2 * u; g.strokeStyle = 'rgba(74,46,18,0.7)'; rr(ox - 6 * u, oy - 6 * u, mw + 12 * u, mh + 12 * u, 16 * u); g.stroke();
    // rose des vents
    // dans le coin de la carte le plus dégagé : jamais par-dessus un lieu (le nid d'araignées est souvent en haut à droite)
    const R1 = 40 * u, coins = [[ox + mw - 62 * u, oy + 66 * u], [ox + 62 * u, oy + 66 * u], [ox + mw - 62 * u, oy + mh - 62 * u], [ox + 62 * u, oy + mh - 62 * u]]; let lieux = []; try { lieux = Sc.targets().filter(q => !q.beast && !q.small).map(q => [ox + q.x * s, oy + q.y * s]); const f = G.firePos(); lieux.push([ox + f.x * s, oy + f.y * s]); } catch (e) { lieux = []; }
    const libre = q => lieux.reduce((m, l) => Math.min(m, Math.hypot(l[0] - q[0], l[1] - q[1])), 1e9), coin = coins.find(q => libre(q) > 120 * u) || coins.slice().sort((a, b) => libre(b) - libre(a))[0], cx = coin[0], cy = coin[1]; g.save(); g.translate(cx, cy);
    g.fillStyle = 'rgba(246,232,192,0.82)'; g.beginPath(); g.arc(0, 0, R1 * 1.12, 0, TAU); g.fill(); g.strokeStyle = '#4a2e12'; g.lineWidth = 1.6 * u; g.stroke(); g.beginPath(); g.arc(0, 0, R1 * 0.62, 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, L = i % 2 ? R1 * 0.58 : R1, wd = i % 2 ? R1 * 0.13 : R1 * 0.2; g.save(); g.rotate(a); g.fillStyle = i === 0 ? '#a8261c' : '#4a2e12'; g.beginPath(); g.moveTo(0, -L); g.lineTo(wd, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.fillStyle = i === 0 ? '#e0685a' : '#b89460'; g.beginPath(); g.moveTo(0, -L); g.lineTo(-wd, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.restore(); }
    g.fillStyle = '#f6e8c0'; g.beginPath(); g.arc(0, 0, 3.4 * u, 0, TAU); g.fill(); g.strokeStyle = '#4a2e12'; g.stroke();
    g.font = 'bold ' + Math.round(15 * u) + 'px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3 * u; g.strokeStyle = '#f6e8c0'; g.strokeText('N', 0, -R1 - 12 * u); g.fillStyle = '#a8261c'; g.fillText('N', 0, -R1 - 12 * u); g.restore();
    return c;
  }
  function drawBig() {
    bigRaf = requestAnimationFrame(drawBig);
    const S = CG.S, R = CG.R, F = found(), r = bigCv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (!w || !h) return; if (bigCv.width !== w || bigCv.height !== h) { bigCv.width = w; bigCv.height = h; }
    const g = bigCv.getContext('2d'), u = Math.max(1, Math.min(w, h) / 760), mg = 20 * u, s = Math.min((w - 2 * mg) / (CG.MW * T), (h - 2 * mg) / (CG.MH * T)), ox = (w - CG.MW * T * s) / 2, oy = (h - CG.MH * T * s) / 2;
    const X = x => ox + x * s, Y = y => oy + y * s, now = performance.now() / 1000, dirty = W.miniDirty, fk = w + 'x' + h;
    if (dirty) W.drawMini();
    if (!fond || fondK !== fk || dirty || now - fondT > 4) { parchemin(w, h, s, ox, oy, u); fondK = fk; fondT = now; }
    g.drawImage(fond, 0, 0);
    for (const b of S.buildings) { const d = CG.BUILDS[b.type]; if (!d || d.flat || d.terrain) continue; const bx = X(b.tx * T), by = Y(b.ty * T), bw = b.w * T * s, bh = b.h * T * s; if (d.barrier || b.site || b.type === 'fire') { g.fillStyle = b.site ? 'rgba(90,60,30,0.45)' : d.barrier ? '#5a4030' : '#e8641e'; g.fillRect(bx, by, bw, bh); continue; } g.fillStyle = '#7a4a22'; g.fillRect(bx + bw * 0.12, by + bh * 0.45, bw * 0.76, bh * 0.55); g.fillStyle = '#a8321e'; g.beginPath(); g.moveTo(bx - bw * 0.04, by + bh * 0.5); g.lineTo(bx + bw / 2, by - bh * 0.1); g.lineTo(bx + bw * 1.04, by + bh * 0.5); g.closePath(); g.fill(); g.strokeStyle = '#3a2010'; g.lineWidth = 1 * u; g.stroke(); }
    const dot = (x, y, c, rr) => { g.fillStyle = '#14100a'; g.beginPath(); g.arc(X(x), Y(y), (rr + 1.4) * u, 0, TAU); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(X(x), Y(y), rr * u, 0, TAU); g.fill(); };
    for (const gb of S.goblins) if (!gb.hidden) dot(gb.x, gb.y, '#c8ff8a', 3);
    for (const a of S.pets) if (!a.ko) dot(a.x, a.y, '#4ad8c8', 3);
    for (const v of R.visitors) dot(v.x, v.y, '#7ad0ff', 4);
    const p = S.player;
    for (const e of R.enemies) { if (e.struct || e.dead) continue; if (e.seen) dot(e.x, e.y, e.wild ? '#ffb0a0' : '#ff3020', 3.5); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let n = 0;
    for (const t of Sc.targets()) {
      if (!F[t.key]) continue; n++;
      const x = X(t.x), y = Y(t.y), rr = (t.small ? 9 : t.beast ? 12 : 17) * u, pul = t.foe ? 1 + Math.sin(now * 4) * 0.08 : 1;
      const py = y - rr * 1.55, pr = rr * pul; // une épingle plantée dans la carte
      g.fillStyle = 'rgba(40,22,6,0.3)'; g.beginPath(); g.ellipse(x + rr * 0.25, y + 1.5 * u, rr * 0.55, rr * 0.22, 0, 0, TAU); g.fill();
      if (t.foe) { g.strokeStyle = 'rgba(200,40,24,' + (0.5 - 0.5 * ((now * 0.8) % 1)) + ')'; g.lineWidth = 2 * u; g.beginPath(); g.arc(x, py, rr * (1.1 + ((now * 0.8) % 1) * 0.9), 0, TAU); g.stroke(); }
      g.fillStyle = t.foe ? '#b8281c' : '#4a2e12'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - pr * 1.25, py + pr * 0.75, x - pr * 0.98, py - pr * 0.2); g.arc(x, py, pr, Math.PI * 1.06, Math.PI * 1.94); g.quadraticCurveTo(x + pr * 1.25, py + pr * 0.75, x, y); g.closePath(); g.fill();
      g.fillStyle = t.foe ? '#ffe2d0' : '#fbf0cf'; g.beginPath(); g.arc(x, py, pr * 0.8, 0, TAU); g.fill();
      g.font = Math.round(rr * 1.02) + 'px sans-serif'; g.fillStyle = '#fff'; g.fillText(t.icon, x, py + 1);
      if (t.small) continue; // les coffres : l'icône suffit
      const lb = t.txt.replace(/^(une?|des?|la|le|l'|de) /, '').replace(/^vieilles |^vieux |^vieil /, ''), nm = lb.charAt(0).toUpperCase() + lb.slice(1);
      g.font = 'italic bold ' + Math.round(13.5 * u) + 'px Georgia, serif'; g.lineJoin = 'round'; g.lineWidth = 4.5 * u; g.strokeStyle = 'rgba(248,236,200,0.92)'; g.strokeText(nm, x, y + 12 * u); g.fillStyle = t.foe ? '#8a1408' : '#3a2008'; g.fillText(nm, x, y + 12 * u);
    }
    const f = G.firePos(); { const tx = 'Village de ' + S.name, vx = X(f.x), vy = Y(f.y) - 52 * u; g.font = 'bold ' + Math.round(14 * u) + 'px Georgia, serif'; const tw = g.measureText(tx).width + 22 * u, th = 22 * u; g.fillStyle = '#7a1c12'; g.beginPath(); g.moveTo(vx - tw / 2 - 9 * u, vy - th / 2 + 4 * u); g.lineTo(vx - tw / 2, vy - th / 2 + 4 * u); g.lineTo(vx - tw / 2, vy + th / 2 + 4 * u); g.lineTo(vx - tw / 2 - 9 * u, vy + th / 2 + 4 * u); g.lineTo(vx - tw / 2 - 3 * u, vy + 4 * u); g.closePath(); g.fill(); g.beginPath(); g.moveTo(vx + tw / 2 + 9 * u, vy - th / 2 + 4 * u); g.lineTo(vx + tw / 2, vy - th / 2 + 4 * u); g.lineTo(vx + tw / 2, vy + th / 2 + 4 * u); g.lineTo(vx + tw / 2 + 9 * u, vy + th / 2 + 4 * u); g.lineTo(vx + tw / 2 + 3 * u, vy + 4 * u); g.closePath(); g.fill(); g.fillStyle = '#b8281c'; g.fillRect(vx - tw / 2, vy - th / 2, tw, th); g.strokeStyle = '#4a0c06'; g.lineWidth = 1.4 * u; g.strokeRect(vx - tw / 2, vy - th / 2, tw, th); g.fillStyle = '#fff1c4'; g.fillText(tx, vx, vy + 1); }
    const k = (now * 0.9) % 1; g.strokeStyle = 'rgba(255,255,255,' + (0.9 - k * 0.9) + ')'; g.lineWidth = 2.4 * u; g.beginPath(); g.arc(X(p.x), Y(p.y), (7 + k * 16) * u, 0, TAU); g.stroke(); dot(p.x, p.y, '#fff', 5.5); g.fillStyle = '#2f8a2a'; g.beginPath(); g.arc(X(p.x), Y(p.y), 3 * u, 0, TAU); g.fill();
    big.querySelector('#bm-n').textContent = n ? n + ' découverte' + (n > 1 ? 's' : '') + ' sur la carte' : 'Rien de découvert encore : explore, ou nomme un éclaireur 🧭';
  }
  CG.UI.carte = function () {
    if (!CG.S) return;
    if (!big) {
      big = document.createElement('div'); big.id = 'bigmap'; big.hidden = true;
      big.innerHTML = '<div class="bm-box"><div class="bm-title">🗺️ Carte du territoire</div><button id="bm-x" title="Fermer (C)">✕</button><canvas id="bm-cv"></canvas><div class="bm-foot"><span id="bm-n"></span><span class="bm-leg"><span><i style="background:#fff"></i>Toi</span><span><i style="background:#c8ff8a"></i>Gobelins</span><span><i style="background:#4ad8c8"></i>Animaux</span><span><i style="background:#7ad0ff"></i>Visiteurs</span><span><i style="background:#ff3020"></i>Ennemis en vue</span></span></div></div>';
      document.body.appendChild(big); bigCv = big.querySelector('#bm-cv');
      big.querySelector('#bm-x').onclick = CG.UI.dismiss; big.addEventListener('mousedown', e => { if (e.target === big) CG.UI.dismiss(); });
    }
    CG.sfx('page');
    CG.UI.modal = { name: 'carte', closable: true, pauses: false }; CG.keys.clear(); big.hidden = false; cancelAnimationFrame(bigRaf); bigRaf = requestAnimationFrame(drawBig);
  };
  const close0 = CG.UI.close; CG.UI.close = function () { if (big && !big.hidden) { big.hidden = true; cancelAnimationFrame(bigRaf); } return close0.apply(this, arguments); };
  window.addEventListener('load', () => { const b = document.getElementById('btn-carte'); if (b) b.onclick = () => CG.UI.toggle('carte'); });
})(window.CG);
