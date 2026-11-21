// Goblin Malin — les chambres secrètes. Chaque jour, dans chaque monde, un ou deux passages se cachent : un arbre au tronc
// creux, un rocher fendu. Presque rien ne les distingue des autres (un petit trou sombre, une lueur de temps en temps).
// Si le chef pousse dedans, il passe au travers et tombe dans une chambre où l'attend une fée géante : elle offre un peu
// de vie ou de mana, pour toujours.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  const Se = CG.Secrets = { MAX: 2, DON: 10, POUSSE: 0.4, LOIN: 9, COUPS: 4, MAGIE: 3, ECART: 18, MEMOIRE: 16, FEUILLES: 0.15, SOIN: 150, REPOS: 7 }; // COUPS : coups pour briser un rocher fendu ; MAGIE : secondes que dure le don de la fée
  const ici = () => (CG.Mondes ? CG.Mondes.ici() : 0);
  const SOL = { trou: 1, animal: 1, rond: 1, fleur: 1, papillon: 1 }; // les secrets posés au ras du sol, sur une case libre
  // où est le passage, au pixel près : le pied du tronc, ou le milieu du rocher
  Se.pos = s => { if (s.k === 'feuilles') return { x: s.px, y: s.py }; if (s.k === 'papillon' && s.ox !== undefined) return { x: s.ox, y: s.oy }; if (SOL[s.k]) return { x: s.x * T + T / 2 + (W.hash(s.x, s.y) - 0.5) * 14, y: s.y * T + T / 2 + (W.hash(s.y, s.x) - 0.5) * 10 }; if (s.k === 'arbre') { const h = W.hash(s.x, s.y); return { x: s.x * T + T / 2 + (W.hash(s.y, s.x) - 0.5) * 12, y: s.y * T + T / 2 + (h * 7 % 1 - 0.5) * 8 + 14 }; } return { x: s.x * T + T / 2, y: s.y * T + T / 2 + 8 }; };
  Se.TROU = { VILLAGE: 22, ROUTE: 4, BORD: 16, CACHE: 0.5, CACHE_VILLAGE: 11 }; /* le trou de la fée : loin du feu (cases), loin de tout sentier, pas trop loin du bord de la carte ; CACHE : une fois sur deux, il est sous un rocher ou un buisson à récolter */
  Se.bonTrou = function (x, y, cache) { let f; try { f = G.firePos(); } catch (e) { f = null; } const L = Se.TROU; /* cache : sous un rocher ou un buisson, il suffit d'être hors du village (il n'y a guère de buissons au bord de la carte) */
    if (f && Math.hypot(x - f.x / T, y - f.y / T) < (cache ? L.CACHE_VILLAGE : L.VILLAGE)) return false; if (cache) return true; if (Math.min(x, y, CG.MW - 1 - x, CG.MH - 1 - y) > L.BORD) return false;
    for (let dy = -L.ROUTE; dy <= L.ROUTE; dy++) for (let dx = -L.ROUTE; dx <= L.ROUTE; dx++) { const X = x + dx, Y = y + dy; if (W.inMap(X, Y) && W.tile[W.idx(X, Y)] === W.PATH) return false; } return true; };
  const dessus = s => (W.nodes || []).find(n => n.x === s.x && n.y === s.y && (n.type === 'bush' || n.type === 'ore')); /* ce qui cache le trou, tant qu'on ne l'a pas récolté */
  const tient = s => s.k === 'trou' && s.sous ? (() => { const n = dessus(s); return !n || !!n.gone; })() : SOL[s.k] ? W.walkTile(s.x, s.y) : W.tile[W.idx(s.x, s.y)] === (s.k === 'arbre' ? W.TREE : W.ROCK);
  // Le tirage du jour. Dix sortes de secrets : l'arbre creux, le rocher fendu, le trou dans l'herbe, le trou sous un rocher à miner,
  // le trou sous un buisson, le trou sous un tas de feuilles (tasfeuilles.js), l'animal blessé, le rond de champignons, la fleur
  // bleue, le papillon doré — et les feuilles d'or. Une sorte qu'on vient de DÉCOUVRIR se repose : on ne la revoit pas avant
  // Se.REPOS jours (S.secretsVu). S'il ne reste aucune sorte reposée, il n'y a pas de secret ce jour-là.
  // Jamais deux fois de suite au même endroit non plus : on garde en mémoire les derniers endroits (S.secretsHist) et on s'en
  // tient loin, et on évite autant que possible les sortes de la veille (même pas trouvées).
  Se.sorte = s => s.k === 'trou' ? (s.tas ? 'trouFeuilles' : s.sous ? ((s.cache || (dessus(s) || {}).type) === 'bush' ? 'trouBuisson' : 'trouRoche') : 'trou') : s.k;
  Se.repos = k => { const S = CG.S, v = S && S.secretsVu; return !!v && v[k] !== undefined && S.day >= v[k] && S.day - v[k] < Se.REPOS; };
  Se.noter = s => { const S = CG.S; if (S) (S.secretsVu = S.secretsVu || {})[Se.sorte(s)] = S.day; };
  Se.NOMS = { arbre: 'un arbre au tronc creux', roche: 'un rocher fendu', trou: 'un trou dans l\'herbe', trouRoche: 'quelque chose sous un rocher à miner', trouBuisson: 'quelque chose sous un buisson', trouFeuilles: 'quelque chose sous un tas de feuilles', animal: 'un petit faon blessé', rond: 'un rond de champignons', fleur: 'une fleur bleue qui brille', papillon: 'un papillon doré' };
  Se.nom = s => Se.NOMS[Se.sorte(s)] || 'quelque chose d\'étrange';
  Se.tirer = function () {
    const S = CG.S, f = G.firePos(), fx = Math.floor(f.x / T), fy = Math.floor(f.y / T), n = Math.random() < 0.5 ? Se.MAX : 1, l = [], C = { arbre: [], roche: [], trou: [], trouRoche: [], trouBuisson: [], animal: [] };
    const hist = S.secretsHist || (S.secretsHist = []), hier = S.secrets && S.secrets.l ? S.secrets.l.map(Se.sorte) : [];
    const acces = (x, y) => { try { return !W.reachable || W.reachable(x, y); } catch (e) { return true; } };
    for (let y = 3; y < CG.MH - 3; y++) for (let x = 3; x < CG.MW - 3; x++) {
      const t = W.tile[W.idx(x, y)]; if (Math.hypot(x - fx, y - fy) < Se.LOIN) continue;
      if ((t === W.GRASS || t === W.CLEAR) && W.walkTile(x, y)) { // du sol libre : un trou, un animal blessé, un rond de champignons, une fleur, un papillon
        if (S.buildings.some(b => x >= b.tx - 2 && x <= b.tx + b.w + 1 && y >= b.ty - 2 && y <= b.ty + b.h + 1) || !acces(x, y)) continue;
        if (Se.bonTrou(x, y)) C.trou.push({ x, y }); C.animal.push({ x, y }); continue; }
      const k = t === W.TREE ? 'arbre' : t === W.ROCK ? 'roche' : null; if (!k || !W.walkTile(x, y + 1)) continue;
      let cache = false; for (let dy = 1; dy <= 3 && !cache; dy++) for (let dx = -1; dx <= 1; dx++) if (W.tile[W.idx(x + dx, y + dy)] === W.TREE) { cache = true; break; } if (cache) continue; // un arbre devant le cacherait
      if (S.buildings.some(b => x >= b.tx - 1 && x <= b.tx + b.w && y >= b.ty - 1 && y <= b.ty + b.h)) continue;
      C[k].push({ x, y });
    }
    C.rond = C.fleur = C.papillon = C.animal; // n'importe quel coin d'herbe libre
    (W.nodes || []).forEach(o => { if (o.gone || !Se.bonTrou(o.x, o.y, true)) return; if (o.type === 'ore') C.trouRoche.push(o); else if (o.type === 'bush') C.trouBuisson.push(o); }); /* caché : on ne le verra qu'une fois le rocher miné ou le buisson cueilli */
    const mk = (k, o) => k === 'trouRoche' || k === 'trouBuisson' ? { x: o.x, y: o.y, k: 'trou', sous: true, cache: o.type, fait: false } : { x: o.x, y: o.y, k, fait: false };
    const loin = (c, r) => !hist.some(h => Math.hypot(h.x - c.x, h.y - c.y) < r) && !l.some(o => Math.hypot(o.x - c.x, o.y - c.y) < Math.max(r, 12));
    const sortes = CG.shuffle(Object.keys(C).filter(k => C[k].length && !Se.repos(k))).sort((a, b) => hier.includes(a) - hier.includes(b)); // les sortes au repos sont écartées ; celles d'hier passent en dernier
    for (const k of sortes) { if (l.length >= n) break; // la variété d'abord : chaque sorte à son tour, le plus loin possible des derniers endroits (on ne se rapproche que s'il n'y a rien d'autre)
      for (const r of [Se.ECART, Se.ECART / 2, 5]) { const c = C[k].filter(o => loin(o, r)); if (c.length) { l.push(mk(k, c[Math.floor(Math.random() * c.length)])); break; } } }
    l.forEach(s => hist.push({ x: s.x, y: s.y })); while (hist.length > Se.MEMOIRE) hist.shift();
    S.secrets = { day: S.day, l };
    if (!S.feuilles && S.day >= 2 && Math.random() < Se.FEUILLES && !Se.repos('feuilles')) Se.semer(); // rare : des feuilles dorées à retrouver
    return l;
  };
  // les feuilles dorées : quatre à six, semées loin les unes des autres. Elles restent jusqu'à ce qu'on les ait toutes trouvées.
  Se.semer = function () {
    const S = CG.S, f = G.firePos(), fx = f.x / T, fy = f.y / T, n = 4 + Math.floor(Math.random() * 3), l = [];
    for (let i = 0; i < 8000 && l.length < n; i++) { const x = 3 + Math.floor(Math.random() * (CG.MW - 6)), y = 3 + Math.floor(Math.random() * (CG.MH - 6)), t = W.tile[W.idx(x, y)];
      if ((t !== W.GRASS && t !== W.CLEAR) || !W.walkTile(x, y) || Math.hypot(x - fx, y - fy) < 7 || l.some(o => Math.hypot(o.x - x, o.y - y) < 13)) continue;
      try { if (W.reachable && !W.reachable(x, y)) continue; } catch (e) { /* rien */ }
      l.push({ x, y, px: x * T + T / 2 + (W.hash(x, y) - 0.5) * 20, py: y * T + T / 2 + (W.hash(y, x) - 0.5) * 16, pris: false }); }
    if (l.length < 4) return null; S.feuilles = { l }; return l;
  };
  Se.liste = () => { const S = CG.S; if (!S || ici() === 2) return []; if (!S.secrets || S.secrets.day !== S.day) Se.tirer(); return S.secrets.l.filter(s => !s.fait && tient(s)); };

  // ---------- la chambre : une scène à part, par-dessus le jeu ----------
  let cv = null, gx = null, raf = 0;
  const ell = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  // la tête de la Grande Fée : de longs cheveux d'or qui ondulent, de grands yeux violets qui clignent, des oreilles pointues,
  // une frange de côté et une couronne de fleurs. Quand elle fait son don (don > 0), elle ferme les yeux et rit.
  const feeOr = (g, cx, fy) => { const or = g.createLinearGradient(cx, fy - 112, cx, fy + 72); or.addColorStop(0, '#ffe994'); or.addColorStop(0.45, '#f7c444'); or.addColorStop(1, '#de962a'); return or; };
  // les cheveux du dos, dessinés avant la robe et les bras : deux grandes vagues qui descendent jusqu'à la taille
  function feeDos(g, cx, fy, t) {
    const sw = Math.sin(t * 1.3) * 4, sw2 = Math.sin(t * 1.3 + 0.9) * 3, or = feeOr(g, cx, fy);
    g.fillStyle = or; g.beginPath(); g.moveTo(cx - 28, fy - 92);
    g.bezierCurveTo(cx - 54, fy - 70, cx - 50, fy - 20, cx - 56 + sw, fy + 14); g.bezierCurveTo(cx - 60 + sw, fy + 40, cx - 42 + sw2, fy + 52, cx - 47 + sw2, fy + 72);
    g.bezierCurveTo(cx - 30 + sw2, fy + 60, cx - 22, fy + 44, cx - 16, fy + 30); g.lineTo(cx + 16, fy + 30);
    g.bezierCurveTo(cx + 22, fy + 44, cx + 30 + sw2, fy + 60, cx + 47 + sw2, fy + 72); g.bezierCurveTo(cx + 42 + sw2, fy + 52, cx + 60 + sw, fy + 40, cx + 56 + sw, fy + 14);
    g.bezierCurveTo(cx + 50, fy - 20, cx + 54, fy - 70, cx + 28, fy - 92); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(186,116,20,0.4)'; g.lineWidth = 1.4; g.lineCap = 'round';
    [-1, 1].forEach(s => [0.6, 0.8, 0.95].forEach((k, i) => { g.beginPath(); g.moveTo(cx + s * 30 * k, fy - 56); g.bezierCurveTo(cx + s * 47 * k, fy - 20, cx + s * 45 * k + sw * 0.6, fy + 20, cx + s * 50 * k + sw2 * 0.8, fy + 58 - i * 6); g.stroke(); }));
  }
  function feeTete(g, cx, fy, t, don) {
    const sw = Math.sin(t * 1.3) * 4, sw2 = Math.sin(t * 1.3 + 0.9) * 3, hy = fy - 70, joie = don > 0.3, cligne = (t % 4.3) < 0.13, or = feeOr(g, cx, fy);
    // le cou, le haut de la robe et son petit bijou
    g.fillStyle = '#f2cdb0'; g.fillRect(cx - 7, fy - 47, 14, 13);
    g.fillStyle = '#f6f0ff'; g.beginPath(); g.moveTo(cx - 22, fy - 44); g.lineTo(cx - 6, fy - 40); g.lineTo(cx, fy - 35); g.lineTo(cx + 6, fy - 40); g.lineTo(cx + 22, fy - 44); g.lineTo(cx + 16, fy - 14); g.lineTo(cx - 16, fy - 14); g.closePath(); g.fill();
    ell(g, cx, fy - 30, 3.4, 3.4, '#ffd86a'); ell(g, cx, fy - 30, 2, 2, '#8ad8ff'); ell(g, cx - 0.7, fy - 30.8, 0.7, 0.7, '#fff');
    // les oreilles pointues
    [-1, 1].forEach(s => { g.fillStyle = '#fbd9bd'; g.beginPath(); g.moveTo(cx + s * 24, hy - 8); g.quadraticCurveTo(cx + s * 40, hy - 15, cx + s * 46, hy - 27); g.quadraticCurveTo(cx + s * 35, hy - 1, cx + s * 25, hy + 7); g.closePath(); g.fill();
      g.fillStyle = 'rgba(238,150,140,0.5)'; g.beginPath(); g.moveTo(cx + s * 27, hy - 6); g.quadraticCurveTo(cx + s * 37, hy - 11, cx + s * 41, hy - 20); g.quadraticCurveTo(cx + s * 34, hy - 3, cx + s * 27, hy + 2); g.closePath(); g.fill(); });
    // le visage : des joues rondes et un petit menton
    const peau = g.createRadialGradient(cx - 6, hy - 10, 4, cx, hy, 38); peau.addColorStop(0, '#fff2e4'); peau.addColorStop(1, '#fbd9bd');
    g.fillStyle = peau; g.beginPath(); g.moveTo(cx - 27, hy - 6); g.bezierCurveTo(cx - 28, hy + 20, cx - 12, hy + 32, cx, hy + 32); g.bezierCurveTo(cx + 12, hy + 32, cx + 28, hy + 20, cx + 27, hy - 6); g.bezierCurveTo(cx + 27, hy - 36, cx - 27, hy - 36, cx - 27, hy - 6); g.closePath(); g.fill();
    [-1, 1].forEach(s => ell(g, cx + s * 17, hy + 13, 6.2, 3.5, 'rgba(255,128,150,0.38)'));
    const ey = hy + 2;
    [-1, 1].forEach(s => { const ex = cx + s * 11.5; g.lineCap = 'round';
      if (joie || cligne) { g.strokeStyle = '#3a2244'; g.lineWidth = 2.4; g.beginPath(); if (joie) { g.moveTo(ex - 6, ey + 2); g.quadraticCurveTo(ex, ey - 7, ex + 6, ey + 2); } else { g.moveTo(ex - 6, ey); g.quadraticCurveTo(ex, ey + 4, ex + 6, ey); } g.stroke(); }
      else { ell(g, ex, ey, 6.4, 7.6, '#ffffff');
        const iris = g.createLinearGradient(ex, ey - 6, ex, ey + 7); iris.addColorStop(0, '#5a2fb0'); iris.addColorStop(1, '#b997ff');
        ell(g, ex + s * 0.4, ey + 0.8, 4.8, 6, iris); ell(g, ex + s * 0.4, ey + 1, 2.3, 3.1, '#1e1238'); ell(g, ex - 1.6, ey - 2.4, 1.9, 2.1, '#fff'); ell(g, ex + 1.8, ey + 3.2, 0.9, 0.9, 'rgba(255,255,255,0.85)');
        g.strokeStyle = '#3a2244'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(ex - s * 6.6, ey - 2.5); g.quadraticCurveTo(ex, ey - 10.5, ex + s * 7.2, ey - 3.5); g.stroke(); // la paupière et ses cils
        g.lineWidth = 1.5; g.beginPath(); g.moveTo(ex + s * 7.2, ey - 3.5); g.lineTo(ex + s * 10.4, ey - 6.5); g.moveTo(ex + s * 5.6, ey - 6.6); g.lineTo(ex + s * 8, ey - 10.2); g.stroke(); }
      g.strokeStyle = '#cf9632'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(ex - s * 5.5, ey - 13); g.quadraticCurveTo(ex + s, ey - 16.5 - (joie ? 1.5 : 0), ex + s * 7.5, ey - 12.5); g.stroke(); }); // les sourcils
    g.strokeStyle = 'rgba(214,140,116,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 1.6, hy + 12); g.quadraticCurveTo(cx, hy + 14, cx + 1.8, hy + 12); g.stroke(); // le bout du nez
    if (joie) { g.fillStyle = '#b2304e'; g.beginPath(); g.moveTo(cx - 7, hy + 19); g.quadraticCurveTo(cx, hy + 31, cx + 7, hy + 19); g.quadraticCurveTo(cx, hy + 22, cx - 7, hy + 19); g.fill(); ell(g, cx, hy + 25, 3, 1.8, '#ff8aa0'); }
    else { g.strokeStyle = '#d2506e'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx - 6.5, hy + 19.5); g.quadraticCurveTo(cx, hy + 25.5, cx + 6.5, hy + 19.5); g.stroke(); ell(g, cx, hy + 24.6, 2.4, 1, 'rgba(255,170,185,0.8)'); }
    // les mèches de devant, qui encadrent le visage et tombent sur les épaules
    g.fillStyle = or; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(cx + s * 24, hy - 14); g.bezierCurveTo(cx + s * 35, hy + 6, cx + s * 31, hy + 22, cx + s * 34 + sw * 0.4, hy + 38); g.bezierCurveTo(cx + s * 34 + sw * 0.5, hy + 48, cx + s * 28 + sw2 * 0.5, hy + 56, cx + s * 30 + sw2 * 0.8, hy + 66);
      g.bezierCurveTo(cx + s * 23 + sw2 * 0.5, hy + 56, cx + s * 25, hy + 40, cx + s * 26, hy + 26); g.bezierCurveTo(cx + s * 27, hy + 14, cx + s * 29, hy + 2, cx + s * 24, hy - 14); g.closePath(); g.fill(); });
    g.strokeStyle = 'rgba(255,250,215,0.55)'; g.lineWidth = 1.6; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(cx + s * 29.5, hy + 2); g.bezierCurveTo(cx + s * 31.5, hy + 14, cx + s * 29, hy + 28, cx + s * 30.5 + sw * 0.4, hy + 44); g.stroke(); });
    // la frange, peignée sur le côté, et son reflet
    g.fillStyle = or; g.beginPath(); g.moveTo(cx - 30, hy - 2); g.bezierCurveTo(cx - 38, hy - 51, cx + 38, hy - 51, cx + 30, hy - 2);
    g.quadraticCurveTo(cx + 27, hy - 18, cx + 10, hy - 27); g.quadraticCurveTo(cx + 2, hy - 17, cx - 14, hy - 17); g.quadraticCurveTo(cx - 26, hy - 16, cx - 30, hy - 2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(186,116,20,0.4)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx + 9, hy - 27); g.quadraticCurveTo(cx - 6, hy - 30, cx - 22, hy - 20); g.moveTo(cx + 11, hy - 28); g.quadraticCurveTo(cx + 20, hy - 26, cx + 26, hy - 18); g.stroke();
    g.strokeStyle = 'rgba(255,255,235,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 19, hy - 28); g.quadraticCurveTo(cx - 3, hy - 38, cx + 15, hy - 31); g.stroke();
    // la couronne de fleurs : cinq petites fleurs à cinq pétales, des feuilles entre elles
    for (let i = 0; i < 4; i++) { const x = cx - 16.5 + i * 11, y = hy - 30 - Math.sin((i + 0.5) / 4 * Math.PI) * 5; ell(g, x, y, 3.6, 1.7, '#58a84a', i % 2 ? 0.5 : -0.5); }
    for (let i = 0; i < 5; i++) { const x = cx - 22 + i * 11, y = hy - 30 - Math.sin(i / 4 * Math.PI) * 6, col = ['#ff8aa8', '#ffffff', '#8ad8ff', '#ffffff', '#ff8aa8'][i], r = i === 2 ? 1.25 : 1;
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2 + Math.sin(t * 0.8 + i) * 0.1; ell(g, x + Math.cos(a) * 3.1 * r, y + Math.sin(a) * 3.1 * r, 2.5 * r, 2.5 * r, col); } ell(g, x, y, 1.9 * r, 1.9 * r, '#ffd84a'); }
    for (let i = 0; i < 4; i++) { const tw = Math.pow(Math.max(0, Math.sin(t * 2.2 + i * 1.7)), 8); if (tw < 0.03) continue; g.globalAlpha = tw; const x = cx + [-34, 30, -22, 38][i], y = hy + [-20, -8, 40, 30][i]; ell(g, x, y, 2.4, 0.7, '#fffbe0'); ell(g, x, y, 0.7, 2.4, '#fffbe0'); } g.globalAlpha = 1;
  }
  function scene() {
    const R = CG.R, c = R && R.chambre; if (!c) { cancelAnimationFrame(raf); if (cv) cv.style.display = 'none'; return; }
    raf = requestAnimationFrame(scene); const now = performance.now() / 1000, dt = Math.min(0.05, now - (c.h || now)); c.h = now; c.t += dt;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = window.innerWidth, h = window.innerHeight; if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = gx, t = c.t, arbre = c.s.k !== 'roche' && c.s.k !== 'trou'; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (c.ph === 'out') { c.o -= dt * 1.4; if (c.o <= 0) { R.chambre = null; cv.style.display = 'none'; cancelAnimationFrame(raf); return; } } else c.o = Math.min(1, c.o + dt * 1.6);
    cv.style.opacity = c.o;
    // le fond : un creux sombre, éclairé par le milieu
    g.fillStyle = arbre ? '#0c120c' : '#0c0e16'; g.fillRect(0, 0, w, h);
    const cx = w / 2, sol = h * 0.56, gr = g.createRadialGradient(cx, sol - 80, 20, cx, sol - 80, Math.max(w, h) * 0.6); gr.addColorStop(0, arbre ? 'rgba(120,200,130,0.55)' : 'rgba(120,160,230,0.5)'); gr.addColorStop(0.45, arbre ? 'rgba(40,80,50,0.35)' : 'rgba(40,56,100,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    ell(g, cx, sol + 30, Math.min(w * 0.42, 520), 110, arbre ? '#2a3a22' : '#2a3040'); ell(g, cx, sol + 22, Math.min(w * 0.36, 440), 84, arbre ? '#3a5230' : '#3a4460');
    // les parois : racines qui pendent, ou stalactites
    for (let i = 0; i < 14; i++) { const x = (i + 0.5) / 14 * w + Math.sin(i * 7.3) * 30, L = 60 + (Math.sin(i * 3.7) * 0.5 + 0.5) * (Math.abs(x - cx) / w * 2) * h * 0.5;
      if (arbre) { g.strokeStyle = i % 2 ? '#2a1c10' : '#3a2816'; g.lineWidth = 7 + (i % 3) * 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, -10); g.quadraticCurveTo(x + Math.sin(i * 2.1 + t * 0.6) * 22, L * 0.6, x + Math.sin(i * 5) * 16, L); g.stroke(); }
      else { g.fillStyle = i % 2 ? '#1c2030' : '#262c40'; g.beginPath(); g.moveTo(x - 20 - (i % 3) * 6, -4); g.lineTo(x + 20 + (i % 3) * 6, -4); g.lineTo(x + Math.sin(i * 5) * 6, L * 0.8); g.closePath(); g.fill(); } }
    [-1, 1].forEach(s => { g.fillStyle = arbre ? '#150e08' : '#10121c'; g.beginPath(); g.moveTo(cx + s * w * 0.5, 0); g.quadraticCurveTo(cx + s * w * 0.3, h * 0.45, cx + s * w * 0.5, h); g.closePath(); g.fill(); });
    // champignons ou cristaux qui luisent
    for (let i = 0; i < 9; i++) { const s = i % 2 ? 1 : -1, x = cx + s * (150 + ((i * 97) % 300)), y = sol + 10 + ((i * 53) % 70), k = 0.6 + Math.sin(t * 1.6 + i) * 0.25;
      ell(g, x, y - 8, 22, 22, arbre ? 'rgba(140,255,190,' + 0.12 * k + ')' : 'rgba(140,200,255,' + 0.14 * k + ')');
      if (arbre) { g.fillStyle = '#e8e0d0'; g.fillRect(x - 2, y - 10, 4, 10); ell(g, x, y - 11, 9, 5.4, i % 3 ? '#58e0a0' : '#c070ff'); ell(g, x - 3, y - 12.4, 2, 1.2, 'rgba(255,255,255,0.6)'); }
      else { g.fillStyle = i % 3 ? '#7ac8ff' : '#c0a0ff'; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x - 2, y - 22); g.lineTo(x + 3, y - 16); g.lineTo(x + 7, y); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x - 2, y - 18, 1.6, 14); } }
    // la fée géante
    const fy = sol - 170 + Math.sin(t * 1.5) * 10, bat = Math.sin(t * 9) * 0.22, don = c.don ? Math.min(1, (t - c.donT) / 0.8) : 0;
    const hl = g.createRadialGradient(cx, fy, 10, cx, fy, 230); hl.addColorStop(0, 'rgba(255,240,200,' + (0.42 + don * 0.3) + ')'); hl.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = hl; g.fillRect(cx - 240, fy - 240, 480, 480);
    [-1, 1].forEach(s => { [[-0.5, 150, 56, 'rgba(200,240,255,0.42)'], [0.42, 104, 42, 'rgba(230,200,255,0.4)']].forEach(a => { g.save(); g.translate(cx + s * 14, fy - 30); g.rotate(s * (a[0] + bat * (a[0] < 0 ? 1 : -0.7)) + (s < 0 ? Math.PI : 0)); ell(g, a[1] * 0.55, 0, a[1] * 0.55, a[2] * 0.5, a[3]); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(a[1] * 1.02, 0); g.stroke(); g.restore(); }); });
    feeDos(g, cx, fy, t);
    g.fillStyle = '#f6f0ff'; g.beginPath(); g.moveTo(cx - 22, fy - 44); g.quadraticCurveTo(cx - 62, fy + 70, cx - 40 + Math.sin(t * 2) * 5, fy + 112); g.quadraticCurveTo(cx, fy + 126, cx + 40 + Math.sin(t * 2 + 1) * 5, fy + 112); g.quadraticCurveTo(cx + 62, fy + 70, cx + 22, fy - 44); g.closePath(); g.fill(); // la robe
    g.fillStyle = 'rgba(190,170,255,0.4)'; g.beginPath(); g.moveTo(cx + 2, fy - 40); g.quadraticCurveTo(cx + 46, fy + 60, cx + 34, fy + 112); g.quadraticCurveTo(cx + 54, fy + 60, cx + 22, fy - 44); g.closePath(); g.fill();
    g.fillStyle = '#ffd86a'; g.fillRect(cx - 21, fy - 14, 42, 6);
    const lev = c.don ? -0.9 * don : Math.sin(t * 1.5) * 0.1; [-1, 1].forEach(s => { g.strokeStyle = '#ffe4cc'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + s * 22, fy - 38); g.lineTo(cx + s * 52, fy - 8 + lev * 30); g.lineTo(cx + s * (70 - don * 30), fy + 8 + lev * 70); g.stroke(); });
    feeTete(g, cx, fy, t, don); // les cheveux, le visage, la couronne de fleurs
    // les poussières de lumière
    for (let i = 0; i < 26; i++) { const a = i * 2.4 + t * (0.3 + (i % 5) * 0.08), r = 90 + ((i * 61) % 190), x = cx + Math.cos(a) * r * 1.5, y = fy + 20 + Math.sin(a * 1.3) * r * 0.7; g.globalAlpha = 0.35 + Math.sin(t * 3 + i) * 0.3; ell(g, x, y, 2.2, 2.2, i % 3 ? '#fff6c0' : '#c8f0ff'); } g.globalAlpha = 1;
    if (c.don) { const col = c.don === 'vie' ? '#ff6a7a' : '#6aa8ff'; for (let i = 0; i < 16; i++) { const k = ((t - c.donT) * 0.9 + i / 16) % 1, x = cx + Math.sin(i * 2.4) * 40 * (1 - k), y = fy + 30 + k * (sol - 30 - fy); g.globalAlpha = 1 - k; ell(g, x, y, 4, 4, col); } g.globalAlpha = 1; }
    // le chef, tout petit devant elle
    const p = CG.S.player, z = 2.1; g.save(); g.translate(cx, sol + 26); g.scale(z, z); if (c.don) ell(g, 0, -22, 30, 30, c.don === 'vie' ? 'rgba(255,120,130,' + 0.35 * don + ')' : 'rgba(120,170,255,' + 0.35 * don + ')');
    Art.goblin(g, { dir: CG.Art8.dirFrom(0, -1), x: 0, y: 0, face: 1, t, moving: false, step: 0, sex: 'm', hue: 112, lum: 46, chief: true, tool: 'baton', glow: '#b070ff', atk: 0, equip: { armure: p.armor > 0 }, s: 1.12 * (CG.Evo ? CG.Evo.chefScale() : 1), pose: c.don ? 'cheer' : undefined }); g.restore();
    // la suite de la visite
    if (c.don) magie(g, c, cx, fy, sol, w, h);
    if (c.ph === 'in' && t > 1) { c.ph = 'parle'; parler(c); }
    else if (c.ph === 'don' && t - c.donT > Se.MAGIE) { if (UI.modal && UI.modal.name === 'chambre') UI.modal = null; c.ph = 'out'; UI.toast(c.don === 'tech' ? '🧚 La fée t\'a appris : ' + c.techNom + '.' : c.don === 'vie' ? '🧚 La fée t\'a donné +' + Se.DON + ' de vie maximum, pour toujours.' : '🧚 La fée t\'a donné +' + Se.DON + ' de mana maximum, pour toujours.'); }
  }
  // le don : pendant trois secondes, la magie de la fée traverse le chef de part en part
  function magie(g, c, cx, fy, sol, w, h) {
    const t = c.t, a = t - c.donT, k = Math.min(1, a / Se.MAGIE), vie = c.don === 'vie', C = vie ? ['#ff6a8a', '#ffd0dc', '255,110,140'] : ['#5aa0ff', '#d0e6ff', '100,160,255'], py = sol - 20, fort = Math.sin(Math.min(1, a / 0.5) * Math.PI / 2) * (1 - Math.max(0, (a - (Se.MAGIE - 0.5)) / 0.5));
    g.save(); g.globalCompositeOperation = 'lighter';
    if (a < 0.35) { g.fillStyle = 'rgba(255,255,255,' + (1 - a / 0.35) * 0.8 + ')'; g.fillRect(0, 0, w, h); } // l'éclair du début
    const col = g.createLinearGradient(cx, 0, cx, sol + 40); col.addColorStop(0, 'rgba(' + C[2] + ',0)'); col.addColorStop(0.5, 'rgba(' + C[2] + ',' + 0.5 * fort + ')'); col.addColorStop(1, 'rgba(255,255,255,' + 0.75 * fort + ')');
    const lw = 70 + Math.sin(t * 22) * 12; g.fillStyle = col; g.beginPath(); g.moveTo(cx - lw * 0.35, 0); g.lineTo(cx + lw * 0.35, 0); g.lineTo(cx + lw, sol + 40); g.lineTo(cx - lw, sol + 40); g.closePath(); g.fill(); // la colonne de lumière
    for (let r = 0; r < 4; r++) { g.strokeStyle = r % 2 ? C[1] : C[0]; g.globalAlpha = 0.75 * fort; g.lineWidth = 5 - r; g.lineCap = 'round'; g.beginPath(); // les rubans qui descendent en spirale des mains de la fée jusqu'au chef
      for (let i = 0; i <= 40; i++) { const u = i / 40, y = fy + 10 + u * (py - fy), ray = (1 - u * 0.75) * 120 * (0.6 + 0.4 * Math.sin(a * 2)), x = cx + Math.sin(u * 9 - a * 7 + r * TAU / 4) * ray; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
    g.globalAlpha = 1;
    for (let i = 0; i < 5; i++) { const q = ((a * 0.9 + i / 5) % 1), rr = 30 + q * Math.max(w, h) * 0.5; g.globalAlpha = (1 - q) * 0.6 * fort; g.strokeStyle = i % 2 ? '#ffffff' : C[0]; g.lineWidth = 6 * (1 - q) + 1; g.beginPath(); g.ellipse(cx, sol + 22, rr, rr * 0.32, 0, 0, TAU); g.stroke(); } // les ondes au sol
    for (let i = 0; i < 70; i++) { const q = ((a * (0.5 + (i % 7) * 0.09) + i * 0.137) % 1), an = i * 2.399 + a * 2.2, rr = (1 - q) * (160 + (i % 5) * 60), x = cx + Math.cos(an) * rr, y = py - 30 + Math.sin(an) * rr * 0.6 - q * 40; g.globalAlpha = q * fort; ell(g, x, y, 2 + q * 3, 2 + q * 3, i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? C[0] : '#ffe36b'); } // les étincelles aspirées vers le chef
    for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + a * 1.6, L = 60 + Math.sin(a * 9 + i) * 26; g.globalAlpha = 0.55 * fort; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx + Math.cos(an) * 34, py - 30 + Math.sin(an) * 34); g.lineTo(cx + Math.cos(an) * (34 + L), py - 30 + Math.sin(an) * (34 + L)); g.stroke(); } // les rayons qui sortent de lui
    g.globalAlpha = fort; const au = g.createRadialGradient(cx, py - 30, 4, cx, py - 30, 120 + Math.sin(a * 12) * 14); au.addColorStop(0, 'rgba(255,255,255,0.9)'); au.addColorStop(0.4, 'rgba(' + C[2] + ',0.55)'); au.addColorStop(1, 'rgba(' + C[2] + ',0)'); g.fillStyle = au; g.fillRect(cx - 150, py - 180, 300, 300);
    if (a > Se.MAGIE - 0.4) { g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,' + Math.sin((a - (Se.MAGIE - 0.4)) / 0.4 * Math.PI) * 0.7 + ')'; g.fillRect(0, 0, w, h); } // l'éclair de la fin
    g.restore();
    const z = 0.6 + Math.min(1, a / 0.5) * 0.4, ty = h * 0.2 - k * 16; g.save(); g.globalAlpha = Math.min(1, a / 0.4) * (1 - Math.max(0, (a - (Se.MAGIE - 0.4)) / 0.4)); g.textAlign = 'center'; g.font = '900 ' + Math.round(Math.min(72, w * 0.075) * z) + 'px "Trebuchet MS", sans-serif'; g.lineWidth = 8; g.strokeStyle = 'rgba(20,10,40,0.85)'; g.lineJoin = 'round';
    const mot = c.don === 'tech' ? c.techNom.toUpperCase() : (vie ? '❤️ +' + Se.DON + ' VIE' : '💧 +' + Se.DON + ' MANA') + ' POUR TOUJOURS'; g.strokeText(mot, cx, ty); g.fillStyle = C[1]; g.fillText(mot, cx, ty);
    if (c.don !== 'tech') { /* le total, en très gros : il monte un par un jusqu'à la nouvelle valeur */ const p = CG.S.player, fin = Math.round(vie ? p.maxhp : p.maxmp), d0 = 0.5, d1 = Se.MAGIE - 1.1, n = Math.max(0, Math.min(Se.DON, Math.floor((a - d0) / (d1 - d0) * Se.DON + 1e-6))), val = fin - Se.DON + n;
      if (c.compte !== n) { if (c.compte !== undefined && n > 0) CG.sfx('coin'); c.compte = n; c.compteT = a; } const pop = 1 + Math.max(0, 1 - (a - c.compteT) / 0.14) * 0.22, big = Math.round(Math.min(150, w * 0.15) * pop);
      g.font = '900 ' + big + 'px "Trebuchet MS", sans-serif'; g.lineWidth = 12; g.strokeText((vie ? '❤️ ' : '💧 ') + val, cx, ty + big * 1.05); g.fillStyle = n >= Se.DON ? '#ffe36b' : '#ffffff'; g.fillText((vie ? '❤️ ' : '💧 ') + val, cx, ty + big * 1.05); }
    g.restore();
  }
  if (!document.getElementById('fe-css')) { const st = document.createElement('style'); st.id = 'fe-css'; st.textContent =
    '#chambre-ui{position:fixed;inset:0;z-index:11;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:22px;padding:0 24px 6vh;pointer-events:none;animation:feIn .7s ease both}@keyframes feIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}' +
    '.fe-msg{max-width:900px;text-align:center;font:900 clamp(26px,4.2vw,50px)/1.15 "Trebuchet MS",system-ui,sans-serif;color:#fff;text-shadow:0 0 22px rgba(255,220,150,.9),0 4px 0 #1a1030,0 0 3px #1a1030}.fe-msg small{display:block;margin-top:12px;font:600 clamp(15px,1.9vw,21px)/1.35 "Trebuchet MS",system-ui,sans-serif;color:#fff3d0;text-shadow:0 2px 0 #1a1030,0 0 10px rgba(0,0,0,.8)}' +
    '.fe-choix{display:flex;gap:28px;pointer-events:auto}.fe-c{position:relative;display:grid;grid-template-columns:auto 1fr;column-gap:16px;align-items:center;width:min(350px,43vw);padding:16px 22px 18px 16px;border-radius:24px;border:4px solid var(--b);color:#fff;cursor:pointer;font:inherit;text-align:left;background:linear-gradient(var(--c1),var(--c2));box-shadow:inset 0 3px 0 rgba(255,255,255,.34),inset 0 -7px 0 rgba(0,0,0,.16),0 9px 0 var(--b),0 18px 28px rgba(0,0,0,.55);transition:transform .09s,box-shadow .09s,filter .12s}' +
    '.fe-c.vie{--c1:#ff7f9c;--c2:#c2204a;--b:#4a0a1e}.fe-c.mana{--c1:#6ab4ff;--c2:#2048c2;--b:#0c1c5a}' +
    '.fe-c:hover,.fe-c:focus-visible{transform:translateY(-4px) scale(1.03);filter:brightness(1.12);outline:none;box-shadow:inset 0 3px 0 rgba(255,255,255,.4),inset 0 -7px 0 rgba(0,0,0,.16),0 13px 0 var(--b),0 22px 32px rgba(0,0,0,.55),0 0 0 4px rgba(255,227,107,.8)}.fe-c:active{transform:translateY(7px);box-shadow:inset 0 3px 0 rgba(255,255,255,.3),0 2px 0 var(--b)}' +
    '.fe-c i{grid-row:1/3;display:grid;place-items:center;width:74px;height:74px;border-radius:50%;font:normal 40px/1 sans-serif;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.5),rgba(255,255,255,.12) 60%);border:3px solid rgba(255,255,255,.75);box-shadow:inset 0 -5px 10px rgba(0,0,0,.22),0 3px 0 rgba(0,0,0,.25)}' +
    '.fe-c b{align-self:end;font:900 clamp(22px,2.6vw,30px)/1 "Trebuchet MS",system-ui,sans-serif;letter-spacing:1.2px;text-transform:uppercase;text-shadow:0 2px 0 rgba(0,0,0,.45)}.fe-c span{align-self:start;margin-top:5px;font:700 13.5px/1.25 "Trebuchet MS",system-ui,sans-serif;opacity:.95;text-shadow:0 1px 0 rgba(0,0,0,.4)}' +
    '.fe-c u{position:absolute;right:-10px;top:-12px;min-width:28px;height:28px;display:grid;place-items:center;font:900 14px "Trebuchet MS",system-ui,sans-serif;text-decoration:none;color:#3a2710;background:linear-gradient(#fff3c8,#e8c860);border:3px solid #2a1808;border-radius:10px;box-shadow:0 3px 0 #2a1808}' +
    '#source-ui{position:fixed;inset:0;z-index:12;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 58%,#bff4ff 0,#4ab0f0 26%,#1a5ac8 58%,#081c56 100%);animation:srcIn 3.4s ease both}@keyframes srcIn{0%{opacity:0}10%{opacity:1}86%{opacity:1}100%{opacity:0}}' +
    '#source-ui .on{position:absolute;left:50%;top:58%;width:40px;height:16px;margin:-8px 0 0 -20px;border-radius:50%;border:3px solid rgba(255,255,255,.85);animation:srcOn 2s ease-out var(--d) infinite}@keyframes srcOn{from{transform:scale(1);opacity:.9}to{transform:scale(26);opacity:0}}' +
    '#source-ui i{position:absolute;bottom:-20px;width:var(--s);height:var(--s);border-radius:50%;border:2px solid rgba(255,255,255,.8);background:rgba(255,255,255,.18);animation:srcBu var(--t) linear var(--d) infinite}@keyframes srcBu{to{transform:translate(var(--x),-110vh)}}' +
    '#source-ui .tx{position:relative;text-align:center;color:#fff;font:900 clamp(34px,6vw,70px)/1.1 "Trebuchet MS",system-ui,sans-serif;text-shadow:0 0 24px rgba(180,240,255,.95),0 4px 0 #0a1c50;animation:srcTx .7s cubic-bezier(.2,1.4,.4,1) .35s both}@keyframes srcTx{from{transform:scale(.4);opacity:0}}#source-ui .tx small{display:block;margin-top:14px;font:700 clamp(17px,2.4vw,26px)/1.3 "Trebuchet MS",system-ui,sans-serif;color:#e8fbff;text-shadow:0 2px 0 #0a1c50}#source-ui .tx b{color:#ffe36b}';
    document.head.appendChild(st); }
  function parler(c) {
    const p = CG.S.player; let el = document.getElementById('chambre-ui'); if (el) el.remove();
    const choix = quoi => { if (c.don) return; c.don = quoi; c.donT = c.t; c.ph = 'don'; c.s.fait = true; if (quoi === 'vie') { p.maxhp += Se.DON; p.hp += Se.DON; } else if (quoi === 'mana') { p.maxmp += Se.DON; p.mp += Se.DON; } else { c.techNom = CG.TECH_BY_ID[quoi].icon + ' ' + CG.TECH_BY_ID[quoi].nom; c.don = 'tech'; CG.DonTech.donner(quoi, 'Cadeau de la Grande Fée'); } CG.sfx('feeDon'); window.removeEventListener('keydown', touche, true); el.remove(); try { CG.save(); } catch (e) { /* rien */ } };
    /* très très rarement, elle offre plutôt une construction, au choix entre deux */ if (c.s.tech === undefined) { const Dn = CG.DonTech; c.s.tech = (Dn && Math.random() < Dn.FEE && Dn.deux()) || null; } const T2 = c.s.tech && c.s.tech.every(id => !CG.G.tech(id)) ? c.s.tech.map(id => CG.TECH_BY_ID[id]) : null;
    const touche = e => { if (e.key === '1') { e.stopPropagation(); choix(T2 ? T2[0].id : 'vie'); } else if (e.key === '2') { e.stopPropagation(); choix(T2 ? T2[1].id : 'mana'); } };
    el = document.createElement('div'); el.id = 'chambre-ui';
    const M = { rond: ['Tu es entré dans le rond des fées !', 'Un pas au milieu de mes champignons, et te voilà chez moi. Bien peu osent y mettre le pied.'], fleur: ['C\'était la fleur de la Grande Fée !', 'Tu t\'es penché sur ma fleur au lieu de marcher dessus sans la voir. Elle m\'a tout raconté.'], papillon: ['Tu as rattrapé le papillon d\'or !', 'Mon petit messager t\'a bien fait courir, hi hi ! Mais tu ne l\'as pas quitté des yeux.'], trou: ['Tu es tombé chez la Grande Fée !', 'Oh ! Un visiteur qui tombe du plafond... Personne ne regarde jamais où il met les pieds, et toi tu trouves ma porte.'], animal: ['La Grande Fée t\'a vu faire !', 'Tu as soigné mon petit faon sans rien demander en retour. Les bois entiers l\'ont vu, et moi aussi.'], feuilles: ['Toutes les feuilles d\'or !', 'Mes feuilles ! Le vent les avait semées aux quatre coins des bois, et tu les as toutes retrouvées.'] }[c.s.k] || ['Tu as trouvé la Grande Fée !', 'Il y a si longtemps que personne n\'a remarqué ma porte...'];
    el.innerHTML = '<div class="fe-msg">' + M[0] + '<small>« ' + M[1] + ' Tu mérites un cadeau, petit chef. Un seul, mais il est à toi pour toujours. »</small></div>'
      + '<div class="fe-choix"><button class="fe-c vie"><u>1</u><i>❤️</i><b>+' + Se.DON + ' vie</b><span>Vie maximum, pour toujours (tu en as ' + Math.round(p.maxhp) + ')</span></button><button class="fe-c mana"><u>2</u><i>💧</i><b>+' + Se.DON + ' mana</b><span>Mana maximum, pour toujours (tu en as ' + Math.round(p.maxmp) + ')</span></button></div>';
    if (T2) { const nb = n => (n.unlock || []).filter(b => CG.BUILDS[b]).map(b => CG.BUILDS[b].nom).join(', '); el.querySelector('.fe-choix').innerHTML = T2.map((n, i) => '<button class="fe-c ' + (i ? 'mana' : 'vie') + '"><u>' + (i + 1) + '</u><i>' + n.icon + '</i><b>' + n.nom + '</b><span>Tu sauras bâtir : ' + nb(n) + '</span></button>').join(''); }
    document.body.appendChild(el); el.querySelector('.vie').onclick = () => choix(T2 ? T2[0].id : 'vie'); el.querySelector('.mana').onclick = () => choix(T2 ? T2[1].id : 'mana'); window.addEventListener('keydown', touche, true);
    if (UI.modal && !UI.modal.pauses) UI.close(); UI.modal = { name: 'chambre', closable: false, pauses: true }; // rien d'autre ne réagit tant qu'on n'a pas choisi
  }
  // parfois, un trou caché ne mène pas chez la fée : on tombe dans une source magique (toute la vie et la mana, et 20 % de plus)
  Se.SOURCE = 0.5; Se.SOURCE_PLUS = 0.2;
  // un niveau de gagné : le bouton Technologies bat cinq fois en doré (il y a des points à dépenser)
  { let niv = null; const un = G.update; G.update = function () { const r = un.apply(this, arguments), S = CG.S, b = document.getElementById('btn-tech'); if (!S || !b) return r; const l = S.player.lvl; if (niv !== null && niv.S === S && l > niv.l) { b.classList.remove('pulse-or'); void b.offsetWidth; b.classList.add('pulse-or'); setTimeout(() => b.classList.remove('pulse-or'), 4200); } niv = { S, l }; return r; };
    const st = document.createElement('style'); st.textContent = '#buttons button.pulse-or{animation:pulseOr .8s ease-out 5}@keyframes pulseOr{0%{box-shadow:0 0 0 0 rgba(255,215,80,.95),0 0 14px rgba(255,227,107,.9);border-color:#ffe36b;filter:brightness(1.35)}100%{box-shadow:0 0 0 22px rgba(255,215,80,0),0 0 14px rgba(255,227,107,0);filter:brightness(1)}}'; document.head.appendChild(st); }
  Se.source = function (s) {
    const S = CG.S, R = CG.R, p = S.player; if (R.source) return; R.source = true; s.fait = true; CG.keys.clear(); p.path = null; CG.sfx('heal');
    if (UI.modal && !UI.modal.pauses) UI.close(); UI.modal = { name: 'source', closable: false, pauses: true };
    const hp = Math.round(p.maxhp * (1 + Se.SOURCE_PLUS)), mp = Math.round(p.maxmp * (1 + Se.SOURCE_PLUS)); p.hp = Math.max(p.hp, hp); p.mp = Math.max(p.mp, mp);
    const el = document.createElement('div'); el.id = 'source-ui'; let h = ''; for (let i = 0; i < 4; i++) h += '<div class="on" style="--d:' + i * 0.5 + 's"></div>'; for (let i = 0; i < 18; i++) h += '<i style="left:' + (4 + (i * 53) % 92) + '%;--s:' + (8 + (i * 7) % 16) + 'px;--t:' + (2.2 + (i % 5) * 0.5) + 's;--d:' + (i % 6) * -0.5 + 's;--x:' + ((i * 31) % 60 - 30) + 'px"></i>';
    el.innerHTML = h + '<div class="tx">PLOUF ! Une source magique !<small>❤️ <b>' + hp + '</b> / ' + p.maxhp + ' &nbsp;·&nbsp; 💧 <b>' + mp + '</b> / ' + p.maxmp + '<br>Toute ta vie et ta mana... et 20 % de plus !</small></div>'; document.body.appendChild(el);
    setTimeout(() => { el.remove(); if (CG.R) CG.R.source = false; if (UI.modal && UI.modal.name === 'source') UI.modal = null; if (CG.R === R) { R.invuln = Math.max(R.invuln || 0, 1.5); G.puff(p.x, p.y - 20, '#a8e8ff', 30, 180, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 60 + i * 44, life: 0.5 + i * 0.15, col: '#a8e8ff' }); UI.toast('💦 La source magique t\'a rendu toute ta vie et ta mana, avec 20 % de plus.'); } try { CG.save(); } catch (e) { /* rien */ } }, 3300);
  };
  { const us = G.update; G.update = function () { const S = CG.S, p = S && S.player, h0 = p ? p.hp : 0, m0 = p ? p.mp : 0, r = us.apply(this, arguments); if (p && CG.S === S) { if (h0 > p.maxhp && p.hp === p.maxhp) p.hp = h0; if (m0 > p.maxmp && p.mp === p.maxmp) p.mp = m0; } return r; }; } /* au-dessus du maximum, un soin ne fait pas redescendre : seuls les coups et les sorts entament le surplus */
  Se.entrer = function (s) {
    const R = CG.R; if (R.chambre) return; const q = Se.pos(s); Se.noter(s); // découverte : cette sorte de cachette se repose Se.REPOS jours
    if (s.k === 'trou' && s.sous) { if (s.source === undefined) s.source = Math.random() < Se.SOURCE; if (s.source) return Se.source(s); }
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'chambre'; cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:10;display:none;opacity:0;pointer-events:auto'; document.body.appendChild(cv); gx = cv.getContext('2d'); }
    G.puff(q.x, q.y - 14, '#fff6c0', 22, 140, 4); CG.sfx('discovery'); CG.keys.clear(); CG.S.player.path = null;
    R.chambre = { s, t: 0, o: 0, ph: 'in' }; cv.style.display = 'block'; cancelAnimationFrame(raf); raf = requestAnimationFrame(scene);
  };
  // dans la chambre, le monde dehors attend
  const up0 = G.update; G.update = function (dt) {
    const R = CG.R, S = CG.S; if (R && R.chambre) return; up0.apply(this, arguments); if (!S || !R || R.ko > 0 || R.night || R.cine || UI.modal || R.sieste) return;
    const p = S.player, l = Se.liste(); let pres = null;
    for (const s of l) { if (s.k !== 'arbre') continue; const q = Se.pos(s), dx = q.x - p.x, dy = (q.y - 6) - p.y, d = Math.hypot(dx, dy); if (d < T * 0.5 + 22 && CG.keys.size > 0 && R.dir && (R.dir.x * dx + R.dir.y * dy) / (d || 1) > 0.6) { pres = s; break; } }
    for (const s of l) if (s !== pres) s.p = 0;
    if (pres) { pres.p = (pres.p || 0) + dt; if (pres.p >= Se.POUSSE) { pres.p = 0; Se.entrer(pres); return; } }
    for (const s of l) if (s.k === 'trou' && s.sous && !s.vu && tient(s)) { s.vu = true; const q = Se.pos(s); if (CG.onScreen(q.x, q.y)) { CG.sfx('secret'); G.text(q.x, q.y - 40, '✨ Un trou secret !', '#fff6c0', true); G.puff(q.x, q.y - 8, '#fff6c0', 18, 120, 3); for (let i = 0; i < 2; i++) R.rings.push({ x: q.x, y: q.y - 4, r: 40 + i * 34, life: 0.5 + i * 0.2, col: '#fff6c0' }); } } /* le buisson ou le rocher vient de partir : le petit air de la découverte */
    for (const s of l) { // le trou : on tombe dedans en marchant dessus ; l'animal soigné : la fée vient ensuite
      if (s.k === 'trou') { const q = Se.pos(s); if (Math.hypot(q.x - p.x, q.y - p.y) < 9) { G.text(p.x, p.y - 56, 'Aaah !', '#fff6c0', true); p.x = q.x; p.y = q.y; Se.entrer(s); return; } }
      else if (s.k === 'animal' && s.gueri !== undefined) { s.gueri += dt; if (s.gueri > 1.8) { Se.entrer(s); return; } }
      else if (s.k === 'rond') { const q = Se.pos(s); if (Math.hypot(q.x - p.x, (q.y - p.y) * 1.7) < 9) { s.d = (s.d || 0) + dt; if (s.d > 0.45) { s.d = 0; Se.entrer(s); return; } } else s.d = 0; } // il faut s'arrêter un instant au milieu du rond
      else if (s.k === 'fleur') { const q = Se.pos(s); if (Math.hypot(q.x - p.x, q.y - p.y) < 11) { G.text(q.x, q.y - 36, 'Oh ! La belle fleur...', '#bfe8ff', true); Se.entrer(s); return; } }
      else if (s.k === 'papillon') { if (papillon(s, p, dt)) { G.text(p.x, p.y - 56, 'Je te tiens !', '#ffe36b', true); Se.entrer(s); return; } } }
    const F = S.feuilles; if (!F || ici() === 2) return;
    if (F.fini !== undefined) { F.fini += dt; if (F.fini > 1.1) { S.feuilles = null; Se.entrer({ k: 'feuilles', px: p.x, py: p.y, x: Math.floor(p.x / T), y: Math.floor(p.y / T) }); } return; }
    for (const q of F.l) { if (q.pris || Math.hypot(q.px - p.x, q.py - p.y) > 15) continue; q.pris = true; const k = F.l.filter(o => o.pris).length;
      G.puff(q.px, q.py - 4, '#ffe36b', 12, 90, 3); CG.sfx('ok'); G.text(q.px, q.py - 30, '🍂 ' + k + ' / ' + F.l.length, '#ffe36b', true); if (k === F.l.length) { F.fini = 0; R.rings.push({ x: p.x, y: p.y - 10, r: 80, life: 0.6, col: '#ffe36b' }); } }
  };
  const du0 = D.update; D.update = function () { if (CG.R && CG.R.chambre) return; return du0.apply(this, arguments); };
  // le rocher fendu : chaque coup du chef y ajoute une fissure ; au dernier, il éclate et la chambre s'ouvre
  const at0 = G.attack; G.attack = function () {
    const R = CG.R, S = CG.S, cd = R ? R.atkCd : 1; const r = at0.apply(this, arguments); if (!R || !S || cd > 0 || R.ko > 0 || R.chambre || !(R.swing > 0)) return r;
    const p = S.player; for (const s of Se.liste()) { if (s.k !== 'roche') continue; const q = Se.pos(s), dx = q.x - p.x, dy = (q.y - 14) - p.y, d = Math.hypot(dx, dy); if (d > 62) continue;
      s.coups = (s.coups || 0) + 1; s.choc = 0.25; R.shake = Math.max(R.shake || 0, 0.1 + s.coups * 0.04); CG.sfx('hit'); G.puff(q.x, q.y - 16, '#b8b4aa', 6 + s.coups * 3, 110, 3); G.puff(q.x, q.y - 16, '#a8e0ff', s.coups * 2, 80, 2);
      if (s.coups < Se.COUPS) { G.text(q.x, q.y - 50, ['Crac...', 'Crrrac !', 'CRAC !'][Math.min(2, s.coups - 1)], '#e8f4ff', s.coups > 1); }
      else { for (let i = 0; i < 3; i++) R.rings.push({ x: q.x, y: q.y - 14, r: 50 + i * 40, life: 0.4 + i * 0.15, col: i % 2 ? '#ffffff' : '#a8e0ff' }); G.puff(q.x, q.y - 16, '#8a867c', 30, 220, 6); G.puff(q.x, q.y - 20, '#fff6c0', 26, 180, 4); CG.sfx('fire'); G.text(q.x, q.y - 60, '💥', '#fff', true); Se.entrer(s); }
      break; }
    return r;
  };
  // ---------- le trou, l'animal blessé, les feuilles dorées : au ras du sol, sans rien qui les annonce ----------
  // le papillon doré : il s'envole un peu plus loin chaque fois qu'on s'approche ; à la quatrième, il se laisse attraper
  Se.PAPILLON = { PEUR: 34, FUITES: 3, SAUT: 120 };
  function papillon(s, p, dt) {
    if (s.vol > 0) { s.vol -= dt * 1.3; return false; } const q = Se.pos(s), L = Se.PAPILLON; if (Math.hypot(q.x - p.x, q.y - p.y) > L.PEUR) return false;
    if ((s.fuites || 0) >= L.FUITES) return true;
    const a0 = Math.atan2(q.y - p.y, q.x - p.x);
    for (let i = 0; i < 14; i++) { const a = a0 + (i ? (Math.random() - 0.5) * 2.6 : 0), d = L.SAUT * (0.8 + Math.random() * 0.5), x = q.x + Math.cos(a) * d, y = q.y + Math.sin(a) * d; if (x < 3 * T || y < 3 * T || x > (CG.MW - 3) * T || y > (CG.MH - 3) * T || !W.walkPx(x, y)) continue;
      s.fx = q.x; s.fy = q.y; s.ox = x; s.oy = y; s.vol = 1; s.fuites = (s.fuites || 0) + 1; return false; }
    return true; // nulle part où s'enfuir : il se laisse prendre
  }
  function papi(g, s, t) {
    let q = Se.pos(s); const vole = s.vol > 0; if (vole) { const u = 1 - s.vol, e = u * u * (3 - 2 * u); q = { x: s.fx + (s.ox - s.fx) * e, y: s.fy + (s.oy - s.fy) * e - Math.sin(u * Math.PI) * 26 }; } if (!CG.onScreen(q.x, q.y)) return;
    const b = Math.abs(Math.sin(t * (vole ? 24 : 7) + s.x)), x = q.x + (vole ? 0 : Math.sin(t * 2.3 + s.y) * 3), y = q.y - 15 + Math.sin(t * 3.1 + s.x) * 2.5;
    if (!vole) ell(g, q.x, q.y + 1, 3, 1.1, 'rgba(0,0,0,0.14)');
    [-1, 1].forEach(d => { ell(g, x + d * 3.1 * b, y - 1, 3.3 * b + 0.4, 3.5, '#ffd24a', d * 0.4); ell(g, x + d * 2.3 * b, y + 2.3, 2.1 * b + 0.3, 2.1, '#ffb02a', -d * 0.3); ell(g, x + d * 3.3 * b, y - 1.4, 1.2 * b, 1.2, '#fff3b0'); });
    ell(g, x, y + 0.4, 0.8, 3, '#5a3a10');
    const tw = Math.pow(Math.max(0, Math.sin(t * 1.7 + s.x)), 10); if (tw > 0.02) { g.globalAlpha = tw; ell(g, x + 4, y - 4, 1.2, 1.2, '#fffbe0'); g.globalAlpha = 1; }
  }
  // le rond de champignons : huit tout petits champignons en cercle dans l'herbe
  function rond(g, q, s, t) {
    const h0 = W.hash(s.x, s.y) * 6;
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + h0, x = q.x + Math.cos(a) * 15, y = q.y + Math.sin(a) * 8, k = 0.8 + W.hash(s.x + i, s.y + 2) * 0.5;
      g.fillStyle = '#efe6d2'; g.fillRect(x - 0.7 * k, y - 3 * k, 1.4 * k, 3 * k); ell(g, x, y - 3.2 * k, 2.6 * k, 1.7 * k, i % 3 ? '#c8553a' : '#d98a3a'); ell(g, x - 0.7 * k, y - 3.7 * k, 0.6 * k, 0.4 * k, 'rgba(255,255,255,0.75)'); }
    const tw = Math.pow(Math.max(0, Math.sin(t * 0.9 + s.x * 1.3 + s.y)), 16); if (tw > 0.02) { g.globalAlpha = tw * 0.8; ell(g, q.x, q.y - 1, 1.1, 0.8, '#ffe9a0'); g.globalAlpha = 1; }
  }
  // la fleur bleue : toute seule, avec une lueur très légère
  function fleur(g, q, s, t) {
    const x = q.x + Math.sin(t * 1.4 + s.x) * 1.2, y = q.y - 10, pu = 0.5 + Math.sin(t * 2 + s.y) * 0.5;
    g.strokeStyle = '#3f8a3a'; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(q.x, q.y); g.quadraticCurveTo(q.x, q.y - 6, x, y); g.stroke();
    ell(g, q.x - 2.4, q.y - 3.4, 2.4, 1, '#4c9c40', -0.5); ell(g, q.x + 2.4, q.y - 4.6, 2.4, 1, '#4c9c40', 0.5);
    ell(g, x, y, 8, 8, 'rgba(150,215,255,' + (0.08 + pu * 0.12).toFixed(3) + ')');
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; ell(g, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.1, 2.1, '#9ad6ff'); } ell(g, x, y, 1.5, 1.5, '#fff2a0');
  }
  function faon(g, q, s, t) {
    const gu = s.gueri, up = gu !== undefined, f = W.hash(s.x + 3, s.y) < 0.5 ? -1 : 1, B = '#b9824a', F = '#9a6a3a';
    g.save(); g.translate(q.x, q.y);
    if (up) { const k = Math.min(1, gu / 0.4); g.translate(f * Math.max(0, gu - 0.7) * 70, 0); g.globalAlpha = 1 - Math.max(0, (gu - 1.2) / 0.6); g.scale(f, 1); ell(g, 0, 2, 9, 3, 'rgba(0,0,0,0.18)');
      g.translate(0, -6 * k - Math.abs(Math.sin(gu * 10)) * 4 * k); g.fillStyle = F; [-6, -3, 4, 7].forEach((x, i) => g.fillRect(x, -1, 1.7, 7 * k + (i % 2 ? Math.sin(gu * 10) : -Math.sin(gu * 10))));
      ell(g, 0, -4, 9.5, 5, B); ell(g, 1, -2.2, 6.5, 2.6, '#d9b58a'); [[-4, -6], [0, -7], [3, -5.4]].forEach(o => ell(g, o[0], o[1], 1, 0.8, '#f4e6d0')); ell(g, -9.4, -5, 1.6, 1.4, '#f4e6d0');
      ell(g, 8, -9, 2.4, 4, B, 0.5); ell(g, 10, -13, 4.2, 3.5, B); ell(g, 8, -17, 1.5, 3, F, -0.4); ell(g, 10.6, -17.4, 1.5, 3, F, 0.2); ell(g, 13.4, -12.4, 1.2, 1, '#3a2414'); ell(g, 10.6, -13.8, 0.9, 1, '#20140c'); }
    else { const tr = Math.sin(t * 0.9 + s.x) > 0.55 ? Math.sin(t * 34) * 0.45 : 0; g.translate(tr, 0); g.scale(f, 1); ell(g, 0, 2, 11, 3.4, 'rgba(0,0,0,0.18)');
      ell(g, -5, 0.6, 4, 1.6, F); ell(g, 5, 0.9, 4, 1.6, F); ell(g, 0, -3.6, 10, 5.2 + Math.sin(t * 2.4) * 0.35, B); ell(g, 1, -1.6, 7, 2.8, '#d9b58a'); [[-4, -5.6], [0, -6.6], [3, -5]].forEach(o => ell(g, o[0], o[1], 1, 0.8, '#f4e6d0')); ell(g, -9.8, -4, 1.6, 1.4, '#f4e6d0');
      ell(g, 9.6, -2.6, 4.4, 3.3, B); ell(g, 7.4, -5.6, 1.5, 2.8, F, -0.9); ell(g, 13, -2, 1.2, 1, '#3a2414'); ell(g, 10.4, -3.2, 1.1, 0.4, '#20140c'); // la tête posée au sol, l'œil fermé
      ell(g, -2.6, -6, 2.1, 1.2, '#a82c2c'); ell(g, -3.4, -5.4, 0.9, 0.7, '#7a1c1c'); } // la blessure
    g.restore();
  }
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const S = CG.S; if (!S || !CG.R) return;
    for (const s of Se.liste()) { if (!SOL[s.k] || s.k === 'papillon') continue; const q = Se.pos(s); if (!CG.onScreen(q.x, q.y)) continue;
      if (s.k === 'animal') { faon(g, q, s, t); continue; } if (s.k === 'rond') { rond(g, q, s, t); continue; } if (s.k === 'fleur') { fleur(g, q, s, t); continue; }
      ell(g, q.x, q.y, 7.6, 3.7, 'rgba(46,34,20,0.5)'); ell(g, q.x, q.y + 0.5, 6, 2.8, '#1a120a'); ell(g, q.x + 0.5, q.y + 1.1, 4, 1.6, '#090503');
      const tw = Math.pow(Math.max(0, Math.sin(t * 0.9 + s.x * 1.3 + s.y)), 18); if (tw > 0.02) { g.globalAlpha = tw * 0.8; ell(g, q.x + 0.6, q.y + 0.8, 1, 0.7, '#ffe9a0'); g.globalAlpha = 1; } }
    const F = S.feuilles; if (!F || ici() === 2) return;
    for (const q of F.l) { if (q.pris || !CG.onScreen(q.px, q.py)) continue; const a = W.hash(q.x, q.y + 5) * TAU;
      g.save(); g.translate(q.px, q.py); g.rotate(a); g.fillStyle = '#d9a520'; g.beginPath(); g.moveTo(-5.5, 0); g.quadraticCurveTo(0, -4.2, 5.5, 0); g.quadraticCurveTo(0, 4.2, -5.5, 0); g.fill();
      g.strokeStyle = '#f6d868'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-7, 0); g.lineTo(4.6, 0); g.stroke(); g.restore();
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.3 + q.x * 2.1 + q.y)), 12); if (tw > 0.02) { g.globalAlpha = tw; ell(g, q.px + 1.5, q.py - 1.5, 1.3, 1.3, '#fffbe0'); g.globalAlpha = 1; } }
  };
  // le sort de Soin, lancé tout près de l'animal blessé, le remet sur pattes (rien d'autre ne marche)
  const ca0 = G.cast; G.cast = function (id) {
    const S = CG.S, R = CG.R, p = S && S.player, mp = p ? p.mp : 0, cd = R ? R.castCd : 0, r = ca0.apply(this, arguments);
    if (id !== 'soin' || !p || !R || !(p.mp < mp || R.castCd > cd)) return r;
    for (const s of Se.liste()) { if (s.k !== 'animal' || s.gueri !== undefined) continue; const q = Se.pos(s); if (Math.hypot(q.x - p.x, q.y - p.y) > Se.SOIN) continue;
      s.gueri = 0; G.puff(q.x, q.y - 8, '#7dff8a', 20, 110, 4); G.puff(q.x, q.y - 10, '#fff6c0', 10, 80, 3); G.text(q.x, q.y - 30, '💚', '#7dff8a', true); }
    return r;
  };
  // ---------- ce qui les trahit : presque rien ----------
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); if (!CG.S || !CG.R) return; const p = CG.S.player;
    for (const s of Se.liste()) { if (s.k === 'papillon') { papi(g, s, t); continue; } if (s.k !== 'arbre' && s.k !== 'roche') continue; const q = Se.pos(s); if (!CG.onScreen(q.x, q.y)) continue; if (s.k === 'arbre' && p.y > q.y - 8 && p.y < q.y + 40 && Math.abs(p.x - q.x) < 14) continue; // le chef est devant le trou de l'arbre (les fissures du rocher, elles, restent toujours visibles)
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.1 + s.x * 1.7 + s.y)), 14), pousse = (s.p || 0) / Se.POUSSE;
      if (s.k === 'arbre') { ell(g, q.x, q.y - 15, 4.2, 6, '#2e1d0e'); ell(g, q.x + 0.4, q.y - 14.6, 3.2, 5, '#140c06'); if (tw > 0.02) { g.globalAlpha = tw * 0.9; ell(g, q.x - 0.8, q.y - 15.4, 0.9, 0.9, '#ffe9a0'); ell(g, q.x + 1.4, q.y - 15.4, 0.9, 0.9, '#ffe9a0'); g.globalAlpha = 1; } }
      else { const nc = s.coups || 0, sx = s.choc > 0 ? Math.sin(t * 90) * 1.6 : 0; if (s.choc > 0) s.choc -= 0.016; g.save(); g.translate(sx, 0);
        g.strokeStyle = '#2a2824'; g.lineWidth = 1.5 + nc * 0.25; g.lineJoin = 'round'; g.beginPath(); g.moveTo(q.x - 3, q.y - 30); g.lineTo(q.x + 1, q.y - 22); g.lineTo(q.x - 2, q.y - 15); g.lineTo(q.x + 2, q.y - 6); g.lineTo(q.x, q.y);
        if (nc >= 1) { g.moveTo(q.x + 1, q.y - 22); g.lineTo(q.x + 8, q.y - 26); g.lineTo(q.x + 13, q.y - 21); g.moveTo(q.x - 2, q.y - 15); g.lineTo(q.x - 9, q.y - 12); } // une fissure de plus à chaque coup
        if (nc >= 2) { g.moveTo(q.x - 9, q.y - 12); g.lineTo(q.x - 14, q.y - 17); g.moveTo(q.x - 9, q.y - 12); g.lineTo(q.x - 12, q.y - 5); g.moveTo(q.x + 2, q.y - 6); g.lineTo(q.x + 10, q.y - 9); g.lineTo(q.x + 14, q.y - 4); }
        if (nc >= 3) { g.moveTo(q.x - 3, q.y - 30); g.lineTo(q.x - 10, q.y - 27); g.moveTo(q.x + 8, q.y - 26); g.lineTo(q.x + 9, q.y - 33); g.moveTo(q.x + 10, q.y - 9); g.lineTo(q.x + 7, q.y - 16); g.moveTo(q.x - 12, q.y - 5); g.lineTo(q.x - 6, q.y - 1); }
        g.stroke(); if (nc) { g.globalAlpha = 0.25 + nc * 0.18 + Math.sin(t * 5) * 0.1; g.strokeStyle = '#a8e0ff'; g.lineWidth = 0.9 + nc * 0.3; g.beginPath(); g.moveTo(q.x - 3, q.y - 30); g.lineTo(q.x + 1, q.y - 22); g.lineTo(q.x - 2, q.y - 15); g.lineTo(q.x + 2, q.y - 6); g.stroke(); g.globalAlpha = 1; } g.restore(); if (tw > 0.02) { g.globalAlpha = tw * 0.8; g.strokeStyle = '#a8e0ff'; g.lineWidth = 1; g.beginPath(); g.moveTo(q.x + 1, q.y - 22); g.lineTo(q.x - 2, q.y - 15); g.lineTo(q.x + 2, q.y - 6); g.stroke(); g.globalAlpha = 1; } }
      if (pousse > 0) { g.globalAlpha = pousse * 0.6; ell(g, q.x, q.y - 14, 12 + pousse * 8, 14 + pousse * 8, 'rgba(255,246,192,0.5)'); g.globalAlpha = 1; } }
  };
})(window.CG);
