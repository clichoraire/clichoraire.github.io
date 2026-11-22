// Goblin Malin — effets de sorts refaits : de vraies racines qui sortent de terre, un bouclier magique digne de ce nom, et un cri de guerre qui se voit.
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2, Ef = CG.Effets = {};
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  Ef.ROOT = 3.8; // durée des racines (voir game.js)

  // ---------- racines : elles percent le sol autour du monstre, s'enroulent sur lui et le tiennent ----------
  // une racine : du monticule (bx, by) vers le corps, en s'enroulant ; k = pousse de 0 à 1
  function racine(g, e, i, n, k, devant, t) {
    const a = i / n * TAU + e.seed, r = e.r + 15, bx = e.x + Math.cos(a) * r, by = e.y + 3 + Math.sin(a) * r * 0.45, cote = Math.cos(a) >= 0 ? 1 : -1;
    if ((Math.sin(a) > 0) !== devant) return;
    const H = (30 + (i % 3) * 9 + e.r * 0.9) * k, w = 5.2 - (i % 2), sway = Math.sin(t * 2.2 + i * 1.9) * 1.6;
    // la terre soulevée
    ell(g, bx, by + 1, 9, 4, '#5a4026'); ell(g, bx - 2, by, 5, 2.4, '#74583a'); ell(g, bx + 5, by + 2.5, 2.4, 1.4, '#3f2c18'); ell(g, bx - 6, by + 2.5, 2, 1.2, '#3f2c18');
    if (k <= 0.02) return;
    const tx = e.x - cote * (e.r * 0.25) + sway, ty = e.y - 8 - H, c1x = bx + cote * 9, c1y = by - H * 0.45, c2x = e.x + cote * (e.r + 5), c2y = e.y - H * 0.85;
    g.lineCap = 'round';
    [[w + 2.4, '#2e1e0e'], [w, '#6a4a26'], [w * 0.36, '#9a7444']].forEach(([lw, col], j) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(bx, by); g.bezierCurveTo(c1x - (j === 2 ? 1 : 0), c1y, c2x - (j === 2 ? 1 : 0), c2y, tx, ty); g.stroke(); });
    // une radicelle et une petite feuille
    const mx = (bx + c1x * 3 + c2x * 3 + tx) / 8, my = (by + c1y * 3 + c2y * 3 + ty) / 8;
    g.strokeStyle = '#6a4a26'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx, my); g.quadraticCurveTo(mx + cote * 8, my - 3, mx + cote * 10, my - 10 * k); g.stroke();
    if (k > 0.8) { g.save(); g.translate(tx, ty); g.rotate(-cote * 0.6 + sway * 0.05); ell(g, cote * 5, -2, 5.5, 2.6, '#5cae34'); ell(g, cote * 4, -2.6, 3, 1.2, '#8fd65a'); g.restore(); }
  }
  function racines(g, t, devant) {
    const R = CG.R; if (!R) return;
    for (const e of R.enemies) {
      if (!(e.rooted > 0) || !e.racines || e.dead || e.struct || !CG.onScreen(e.x, e.y)) continue; // seulement ceux pris par le sort Racines (l'onde de choc fige aussi, mais sans racines)
      const age = (e.rootMax || Ef.ROOT) - e.rooted, k = Math.min(1, Math.max(0, age / 0.32), e.rooted / 0.3), n = e.r > 16 ? 8 : 6;
      if (!devant) { ell(g, e.x, e.y + 3, e.r + 20, (e.r + 20) * 0.42, 'rgba(60,42,22,0.35)'); g.strokeStyle = 'rgba(40,26,12,0.5)'; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const a = i * 1.26 + e.seed; g.beginPath(); g.moveTo(e.x + Math.cos(a) * 6, e.y + 3 + Math.sin(a) * 3); g.lineTo(e.x + Math.cos(a) * (e.r + 17), e.y + 3 + Math.sin(a) * (e.r + 17) * 0.42); g.stroke(); } }
      for (let i = 0; i < n; i++) racine(g, e, i, n, k, devant, t);
      if (devant && k >= 1) { // une liane serrée autour du ventre
        g.strokeStyle = '#2e1e0e'; g.lineWidth = 5.5; g.beginPath(); g.ellipse(e.x, e.y - 14 - e.r * 0.3, e.r * 0.82, 4.5, 0, 0.15, Math.PI - 0.15); g.stroke();
        g.strokeStyle = '#7a5630'; g.lineWidth = 3; g.beginPath(); g.ellipse(e.x, e.y - 14 - e.r * 0.3, e.r * 0.82, 4.5, 0, 0.15, Math.PI - 0.15); g.stroke();
      }
    }
  }

  // ---------- bouclier : un dôme de lumière, des alvéoles, un cercle de runes au sol, et un éclat à chaque coup encaissé ----------
  let shPrev = 0, shHit = 0, shMax = 1, shBorn = -9;
  function bouclier(g, t) {
    const R = CG.R, p = CG.S.player; if (!(R.shield > 0) || R.ko > 0) { shPrev = 0; return; }
    if (shPrev <= 0) { shMax = R.shield; shBorn = t; } else if (R.shield < shPrev - 0.01) shHit = 1;
    if (R.shield > shMax) shMax = R.shield; shPrev = R.shield; if (shHit > 0) shHit -= 0.06;
    const born = Math.min(1, (t - shBorn) / 0.35), force = 0.45 + 0.55 * R.shield / shMax, fin = R.shieldT < 2.5 ? 0.55 + 0.45 * Math.sin(t * 16) : 1, A = force * fin;
    const cx = p.x, cy = p.y - 24, rx = 34 * (0.6 + 0.4 * born) + shHit * 3, ry = 44 * (0.6 + 0.4 * born) + shHit * 3;
    g.save();
    // le cercle de runes au sol
    g.globalAlpha = 0.75 * A; g.strokeStyle = '#9fc4ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, p.y + 2, 38, 15, 0, 0, TAU); g.stroke();
    g.setLineDash([3, 9]); g.lineDashOffset = -t * 26; g.lineWidth = 4; g.strokeStyle = '#e6f0ff'; g.beginPath(); g.ellipse(p.x, p.y + 2, 31, 12, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    // le dôme
    const gr = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.35, 4, cx, cy, ry); gr.addColorStop(0, 'rgba(230,240,255,' + (0.10 + shHit * 0.35) + ')'); gr.addColorStop(0.7, 'rgba(120,160,255,' + (0.16 + shHit * 0.3) + ')'); gr.addColorStop(1, 'rgba(90,130,255,0.5)');
    g.globalAlpha = A; g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
    // les alvéoles, seulement à l'intérieur du dôme
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.clip(); g.strokeStyle = 'rgba(200,225,255,' + (0.3 + shHit * 0.5) + ')'; g.lineWidth = 1;
    const s = 11, dy = s * 0.866; for (let j = -5; j <= 5; j++) for (let i = -4; i <= 4; i++) { const hx = cx + i * s * 1.5, hy = cy + j * dy * 2 + (i & 1 ? dy : 0) + ((t * 6) % (dy * 2)); g.beginPath(); for (let q = 0; q < 6; q++) { const an = q * TAU / 6; g[q ? 'lineTo' : 'moveTo'](hx + Math.cos(an) * s, hy + Math.sin(an) * s); } g.closePath(); g.stroke(); }
    g.restore();
    // le bord lumineux et deux reflets qui tournent
    g.strokeStyle = 'rgba(210,228,255,0.95)'; g.lineWidth = 2.2; g.shadowColor = '#7aa8ff'; g.shadowBlur = 12; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.stroke(); g.shadowBlur = 0;
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.lineCap = 'round'; [0, Math.PI].forEach(o => { const a = t * 1.8 + o; g.globalAlpha = A * 0.9; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, a, a + 0.55); g.stroke(); });
    g.globalAlpha = A * 0.8; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(cx - rx * 0.34, cy - ry * 0.4, rx * 0.26, ry * 0.2, -0.5, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    // de petites étoiles qui montent le long du dôme
    g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const u = (t * 0.5 + i / 5) % 1, a = i * 2.3 + t * 0.4; g.globalAlpha = A * Math.sin(u * Math.PI); g.beginPath(); g.arc(cx + Math.cos(a) * rx * 0.92, cy + ry * 0.7 - u * ry * 1.5, 1.8, 0, TAU); g.fill(); }
    g.restore();
  }

  // ---------- cri de guerre : le chef hurle (ondes sonores), et ceux qui l'entendent s'embrasent ----------
  const braves = () => CG.S.goblins.filter(o => !o.hidden && o.ko !== true && (o.job === 'garde' || G.militia(o)));
  function criSol(g, t) {
    const R = CG.R; if (!(R.cri > 0)) return; const a = Math.min(1, R.cri / 1.5);
    for (const o of braves()) { if (!CG.onScreen(o.x, o.y)) continue; const pu = 0.5 + 0.5 * Math.sin(t * 7 + o.id);
      const gr = g.createRadialGradient(o.x, o.y + 2, 2, o.x, o.y + 2, 26); gr.addColorStop(0, 'rgba(255,150,40,' + 0.5 * a + ')'); gr.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(o.x, o.y + 2, 26, 11, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,' + Math.round(120 + pu * 90) + ',40,' + 0.85 * a + ')'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(o.x, o.y + 2, 17 + pu * 3, 7 + pu * 1.3, 0, 0, TAU); g.stroke(); }
  }
  function criDessus(g, t) {
    const R = CG.R, p = CG.S.player;
    if (R.cri > 0) {
      const a = Math.min(1, R.cri / 1.5);
      for (const o of braves()) { if (!CG.onScreen(o.x, o.y)) continue;
        // des flammèches qui montent autour de lui
        for (let i = 0; i < 6; i++) { const u = (t * 1.3 + i / 6 + o.id * 0.37) % 1, x = o.x + Math.sin(i * 2.1 + o.id) * 13 + Math.sin(t * 6 + i) * 2, y = o.y - 4 - u * 50, hh = 17 * (1 - u) + 5; g.globalAlpha = a * (1 - u * 0.8); g.fillStyle = i % 2 ? '#ff8a1e' : '#ffd23a'; g.beginPath(); g.moveTo(x - 4.5, y); g.quadraticCurveTo(x - 5.5, y - hh * 0.5, x, y - hh); g.quadraticCurveTo(x + 5.5, y - hh * 0.5, x + 4.5, y); g.fill(); }
        // l'emblème de guerre au-dessus de la tête
        const yy = o.y - 80 + Math.sin(t * 5 + o.id) * 2; g.globalAlpha = a; g.fillStyle = 'rgba(120,20,10,0.9)'; g.beginPath(); g.arc(o.x, yy, 9, 0, TAU); g.fill(); g.strokeStyle = '#ffb432'; g.lineWidth = 1.5; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.x - 4.5, yy + 4.5); g.lineTo(o.x + 4.5, yy - 4.5); g.moveTo(o.x + 4.5, yy + 4.5); g.lineTo(o.x - 4.5, yy - 4.5); g.stroke(); g.strokeStyle = '#ffd23a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(o.x - 5.5, yy + 1.5); g.lineTo(o.x - 1.5, yy + 5.5); g.moveTo(o.x + 5.5, yy + 1.5); g.lineTo(o.x + 1.5, yy + 5.5); g.stroke(); } // deux lames croisées
      g.globalAlpha = 1;
    }
    if (R.criShout > 0) { // le hurlement : des ondes qui partent de sa bouche, et le cri écrit en gros
      const u = 1 - R.criShout / 1.1, dx = R.dir ? R.dir.x : p.face, dy = R.dir ? R.dir.y : 0, an = Math.atan2(dy * 0.6, dx || 0.001), mx = p.x + Math.cos(an) * 12, my = p.y - 34;
      g.save(); g.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const w = u * 1.5 - i * 0.16; if (w <= 0 || w >= 1) continue; const r = 14 + w * 150; g.globalAlpha = (1 - w) * 0.95; g.strokeStyle = i % 2 ? '#ffe36b' : '#ff8a1e'; g.lineWidth = 6 * (1 - w) + 1.5; g.beginPath(); g.ellipse(mx, my, r, r * 0.62, 0, an - 0.7, an + 0.7); g.stroke(); }
      for (let i = 0; i < 2; i++) { const w = u * 1.2 - i * 0.25; if (w <= 0 || w >= 1) continue; g.globalAlpha = (1 - w) * 0.6; g.strokeStyle = '#ffb05a'; g.lineWidth = 4 * (1 - w) + 1; g.beginPath(); g.ellipse(p.x, p.y, 40 + w * 320, (40 + w * 320) * 0.45, 0, 0, TAU); g.stroke(); }
      const sc = Math.min(1, u * 5) * (1 + Math.sin(t * 40) * 0.04); g.globalAlpha = Math.min(1, (1 - u) * 2.5); g.translate(p.x + Math.sin(t * 60) * 2, p.y - 92 - u * 18); g.scale(sc, sc); g.rotate(-0.06);
      g.font = '900 30px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#5a1008'; g.strokeText('WAAAGH !', 0, 0); g.fillStyle = '#ffd23a'; g.fillText('WAAAGH !', 0, 0);
      g.restore();
    }
  }

  // ---------- branchements ----------
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); racines(g, t, false); criSol(g, t); portails(g, t, true); };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); racines(g, t, true); cigogne(g, t); bouclier(g, t); criDessus(g, t); murApercu(g, t); portails(g, t, false); };
  // ---------- mur de feu : une première pression montre où il tombera (en transparence), la même touche une seconde fois le pose là ----------
  // même calcul que le vrai sort (ajouts.js) : en travers, devant le chef, ou entre lui et l'ennemi le plus proche
  function murPlace() {
    const R = CG.R, p = CG.S.player, tg = G.nearestEnemy(p.x, p.y, 320), dx0 = tg ? tg.x - p.x : R.dir.x, dy0 = tg ? tg.y - p.y : R.dir.y, dl = Math.hypot(dx0, dy0) || 1, ux = dx0 / dl, uy = dy0 / dl;
    const gap = tg ? Math.min(90, Math.max(46, dl * 0.5)) : 80, cx = p.x + ux * gap, cy = p.y + uy * gap, half = 120;
    return { x1: cx - uy * half, y1: cy + ux * half, x2: cx + uy * half, y2: cy - ux * half };
  }
  function murApercu(g, t) {
    const R = CG.R; if (!(R.murVise > 0)) return; const w = murPlace(), n = 13, pu = 0.5 + 0.5 * Math.sin(t * 6);
    g.save(); g.lineCap = 'round';
    g.globalAlpha = 0.28 + pu * 0.1; g.strokeStyle = '#ff8a1e'; g.lineWidth = 16; g.beginPath(); g.moveTo(w.x1, w.y1 + 2); g.lineTo(w.x2, w.y2 + 2); g.stroke();
    g.globalAlpha = 0.85; g.strokeStyle = '#ffe36b'; g.lineWidth = 2; g.setLineDash([8, 7]); g.lineDashOffset = -t * 30; g.beginPath(); g.moveTo(w.x1, w.y1 + 2); g.lineTo(w.x2, w.y2 + 2); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < n; i++) { const k = i / (n - 1), x = w.x1 + (w.x2 - w.x1) * k, y = w.y1 + (w.y2 - w.y1) * k, hh = 26 + Math.sin(t * 7 + i * 1.7) * 6; g.globalAlpha = 0.42; g.fillStyle = i % 2 ? '#ff8a1e' : '#ffb432'; g.beginPath(); g.moveTo(x - 8, y + 2); g.quadraticCurveTo(x - 9, y - hh * 0.5, x + Math.sin(t * 5 + i) * 3, y - hh); g.quadraticCurveTo(x + 9, y - hh * 0.5, x + 8, y + 2); g.fill(); }
    const p = CG.S.player, key = (() => { const i = p.spells.indexOf('murfeu'); return i >= 0 && i < 10 ? String((i + 1) % 10) : ''; })();
    g.globalAlpha = 1; g.font = 'bold 13px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = 'rgba(30,14,4,0.85)'; g.lineJoin = 'round'; const txt = '♨️ ' + (key ? 'Touche ' + key + ' encore' : 'Relance le sort') + ' pour poser le mur';
    g.strokeText(txt, (w.x1 + w.x2) / 2, Math.min(w.y1, w.y2) - 44); g.fillStyle = '#ffe9a8'; g.fillText(txt, (w.x1 + w.x2) / 2, Math.min(w.y1, w.y2) - 44);
    g.restore();
  }
  Ef.MUR_VISE = 8; // secondes avant que la visée s'annule toute seule
  const cast0 = G.cast;
  G.cast = function (id) {
    { const R = CG.R, p = CG.S.player;
      if (id === 'retour') { // le portail bleu remplace l'ancien saut instantané
        if (R.castCd > 0 || R.ko > 0 || R.cine) return; const cost = G.spellCost(id);
        if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
        p.mp -= cost; R.castCd = 0.9; R.castAnim = 1; R.murVise = 0; CG.sfx('spell'); ouvrirPortail(); return;
      }
      if (id === 'murfeu' && !(R.murVise > 0)) { // première pression : on vise, rien n'est dépensé
        if (R.castCd > 0 || R.ko > 0 || R.cine) return;
        if (p.mp < G.spellCost(id)) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
        R.murVise = Ef.MUR_VISE; CG.sfx('click'); return;
      }
      R.murVise = 0; // seconde pression (le mur se pose), ou un autre sort : la visée s'arrête
    }
    const R = CG.R, avant = id === 'cri' ? R.cri : id === 'bouclier' ? R.shieldT : 0, r = cast0.apply(this, arguments), p = CG.S.player;
    if (id === 'cri' && R.cri > avant) { // il ne frappe pas : il lève les bras et hurle
      R.castAnim = 0; R.criShout = 1.1; R.shake = Math.max(R.shake || 0, 0.35);
      for (const o of braves()) { G.puff(o.x, o.y - 16, '#ff8a1e', 12, 110, 4); G.text(o.x, o.y - 70, 'RAAAH !', '#ffb432'); o.emoteT = 1.2; }
    } else if (id === 'bouclier' && R.shieldT > avant) { R.rings.push({ x: p.x, y: p.y - 10, r: 80, life: 0.45, col: '#9fc4ff' }); G.puff(p.x, p.y - 24, '#cfe0ff', 22, 150, 4); G.text(p.x, p.y - 78, '🔮 Bouclier !', '#cfe0ff', true); }
    else if (id === 'racines') for (const e of R.enemies) if (e.rooted > 3.6 && !e.dead) { e.rootMax = e.rooted; e.racines = true; G.puff(e.x, e.y + 2, '#6a4a26', 14, 120, 4); G.puff(e.x, e.y - 4, '#5cae34', 5, 70, 3); }
    return r;
  };
  const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); const R = CG.R; if (!R) return; if (R.criShout > 0) R.criShout -= dt; if (R.murVise > 0) { R.murVise -= dt; if (R.ko > 0) R.murVise = 0; }
    if (R.cine && !R.cine.cigogne && R.cine.g && R.cine.g.fertile === CG.S.day) { R.cine.cigogne = true; const libre = G.capacity() - CG.S.goblins.length; R.cine.n = Math.max(R.cine.n, Math.min(libre, R.cine.n + CG.irand(1, 2))); }
    const P = R.portail; if (P) { P.age += dt; if (P.saut > 0) P.saut -= dt; /* le portail s'ouvre : rien ne se passe tant que le chef n'entre pas dedans */ else if (P.ferme > 0) { P.ferme -= dt; if (P.ferme <= 0) { [P.a, P.b].forEach(q => { G.puff(q.x, q.y - 40, '#8fd0ff', 16, 140, 3); R.rings.push({ x: q.x, y: q.y - 30, r: 50, life: 0.35, col: '#bfe4ff' }); }); R.portail = null; } } else { P.t -= dt; if (P.t <= 0) P.ferme = Ef.PORTAIL.ferme; else if (!(R.ko > 0) && !R.cine) { const q = P.cote === 'b' ? P.b : P.a, pl = CG.S.player, d = Math.hypot(pl.x - q.x, pl.y - q.y); if (!P.arme) { if (d > 30) P.arme = true; } else if (d < 17) Ef.traverser(); } } } };

  // ---------- retour au village : un portail bleu s'ouvre, reste une minute près du feu, et permet de revenir là d'où l'on vient ----------
  Ef.PORTAIL = { dur: 60, ouvre: 0.5, ferme: 0.7 };
  CG.SPELLS.retour.desc = 'Un portail bleu s\'ouvre juste à côté de toi : entre dedans pour arriver au village, près du feu. Il reste ouvert 1 minute : reprends-le pour retourner exactement là d\'où tu viens.';
  function ouvrirPortail() {
    const S = CG.S, R = CG.R, p = S.player, f = G.firePos(); let b = null;
    for (const [dx, dy] of [[78, 38], [-78, 38], [0, 86], [96, -20], [-96, -20]]) if (CG.W.walkPx(f.x + dx, f.y + dy)) { b = { x: f.x + dx, y: f.y + dy }; break; }
    if (!b) { const d = G.door(G.find('chief')); b = { x: d.x, y: d.y + 10 }; }
    // il s'ouvre une case à côté du chef (du côté où il regarde si c'est libre), jamais sur lui
    const T = CG.TILE, cote = (R.dir && R.dir.x < 0) || (R.dir && !R.dir.x && p.face < 0) ? -1 : 1; let a = null;
    for (const [dx, dy] of [[cote * T, 0], [-cote * T, 0], [0, -T], [0, T]]) if (CG.W.walkPx(p.x + dx, p.y + dy)) { a = { x: p.x + dx, y: p.y + dy }; break; }
    if (!a) a = { x: p.x + cote * T, y: p.y };
    R.portail = { a, d: { x: p.x, y: p.y }, b, t: Ef.PORTAIL.dur, age: 0, saut: Ef.PORTAIL.ouvre, ferme: 0, cote: 'a', arme: false };
    R.rings.push({ x: a.x, y: a.y - 10, r: 70, life: 0.45, col: '#5ab4ff' }); G.puff(a.x, a.y - 20, '#8fd0ff', 20, 130, 4);
  }
  // entrer dans le portail (en marchant dedans, ou avec E) : de l'autre côté, on sort une case à côté ; le retour le referme
  Ef.traverser = function () { const P = CG.R.portail; if (!P || P.saut > 0 || P.ferme > 0) return; if (P.cote === 'b') { passer({ x: P.d.x, y: P.d.y - 6 }, '🌀 De retour !'); P.ferme = Ef.PORTAIL.ferme; } else { passer({ x: P.b.x - 40, y: P.b.y }, '🏠 De retour au village !'); P.cote = 'b'; P.arme = false; } };
  function passer(vers, msg) { const R = CG.R, p = CG.S.player; G.puff(p.x, p.y - 20, '#8fd0ff', 26, 170, 4); p.x = vers.x; p.y = vers.y + 6; p.path = null; R.build = null; G.unstick(p, 9); R.invuln = Math.max(R.invuln || 0, 0.6); G.puff(p.x, p.y - 20, '#cfeaff', 30, 190, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 95, life: 0.5, col: '#ffffff' }); if (msg) G.text(p.x, p.y - 70, msg, '#bfe4ff', true); CG.sfx('spell'); }
  // le portail : un ovale d'énergie bleue qui tourbillonne, cœur blanc, éclairs sur le bord
  function portailDessin(g, x, y, t, k, seed) { // k : ouverture de 0 à 1
    if (k <= 0) return; const kx = Math.min(1, k * 1.6), ky = Math.min(1, 0.15 + k), rx = 24 * kx, ry = 44 * ky, cy = y - 40;
    g.save();
    g.fillStyle = 'rgba(6,10,30,' + 0.42 * k + ')'; g.beginPath(); g.ellipse(x, y + 4, 27 * kx, 8, 0, 0, TAU); g.fill(); // son ombre : il est bien posé par terre
    const gl = g.createRadialGradient(x, y + 2, 2, x, y + 2, 46); gl.addColorStop(0, 'rgba(90,170,255,' + 0.55 * k + ')'); gl.addColorStop(1, 'rgba(60,120,255,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(x, y + 2, 46 * kx, 14, 0, 0, TAU); g.fill();
    const au = g.createRadialGradient(x, cy, 4, x, cy, ry + 26); au.addColorStop(0, 'rgba(120,190,255,0.5)'); au.addColorStop(1, 'rgba(60,120,255,0)'); g.fillStyle = au; g.beginPath(); g.ellipse(x, cy, rx + 24, ry + 24, 0, 0, TAU); g.fill();
    const co = g.createRadialGradient(x, cy, 1, x, cy, ry); co.addColorStop(0, '#ffffff'); co.addColorStop(0.25, '#bfe6ff'); co.addColorStop(0.6, '#3f8fff'); co.addColorStop(1, '#1438b0'); g.fillStyle = co; g.beginPath(); g.ellipse(x, cy, rx, ry, 0, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.ellipse(x, cy, rx, ry, 0, 0, TAU); g.clip(); g.lineCap = 'round'; // le tourbillon
    for (let i = 0; i < 7; i++) { const a = t * 2.6 + i * 0.9 + seed, r = (0.25 + (i % 4) * 0.22); g.strokeStyle = 'rgba(' + (i % 2 ? '255,255,255' : '150,215,255') + ',' + (0.55 - (i % 4) * 0.08) + ')'; g.lineWidth = 2.6 - (i % 3) * 0.6; g.beginPath(); g.ellipse(x, cy, rx * r, ry * r, 0, a, a + 1.9); g.stroke(); }
    g.restore();
    g.shadowColor = '#5ab4ff'; g.shadowBlur = 16; g.strokeStyle = '#d8f0ff'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(x, cy, rx, ry, 0, 0, TAU); g.stroke(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const a = ((Math.floor(t * 9 + i * 3) * 2.399) + seed) % TAU, x1 = x + Math.cos(a) * rx, y1 = cy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + Math.cos(a) * 7 + Math.sin(t * 40 + i) * 3, y1 + Math.sin(a) * 7); g.lineTo(x1 + Math.cos(a) * 13 + Math.cos(t * 31 + i) * 4, y1 + Math.sin(a) * 12); g.stroke(); } // petits éclairs
    g.fillStyle = '#eaf6ff'; for (let i = 0; i < 6; i++) { const u = (t * 0.6 + i / 6 + seed) % 1; g.globalAlpha = Math.sin(u * Math.PI) * k; g.beginPath(); g.arc(x + Math.sin(i * 2.4 + seed) * (rx + 6), y - u * (ry * 2 + 10), 1.7, 0, TAU); g.fill(); }
    g.restore();
  }
  function portails(g, t, dessous) {
    const P = CG.R.portail; if (!P) return; const py = CG.S.player.y, k = P.ferme > 0 ? P.ferme / Ef.PORTAIL.ferme : Math.min(1, P.age / Ef.PORTAIL.ouvre);
    // le chef passe devant le portail quand il est plus bas que lui à l'écran, derrière sinon
    [P.a, P.b].forEach((q, i) => { if ((py > q.y - 4) === !!dessous && CG.onScreen(q.x, q.y)) portailDessin(g, q.x, q.y, t, k, i * 1.7); });
    if (dessous) return;
    { const q = P.cote === 'b' ? P.b : P.a; if (P.ferme <= 0 && P.saut <= 0 && CG.onScreen(q.x, q.y)) { const s = Math.ceil(P.t), P0 = P; { const P = { b: q, t: P0.t }; g.font = 'bold 12px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 3.5; g.lineJoin = 'round'; g.strokeStyle = 'rgba(8,20,60,0.85)'; g.strokeText(s + ' s', P.b.x, P.b.y - 92); g.fillStyle = s <= 10 ? '#ffb0a0' : '#cfeaff'; g.fillText(s + ' s', P.b.x, P.b.y - 92); } } }
  }
  { const D = CG.D, fi = D.findInteract, it0 = D.interact;
    D.findInteract = function () { const R = CG.R, P = R.portail, p = CG.S.player; if (P && P.saut <= 0 && P.ferme <= 0) { const q = P.cote === 'b' ? P.b : P.a; if (Math.hypot(p.x - q.x, p.y - q.y) < 58) return { type: 'portailBleu', obj: { x: q.x, y: q.y - 46 }, label: P.cote === 'b' ? 'Reprendre le portail' : 'Entrer dans le portail' }; } return fi.apply(this, arguments); };
    D.interact = function () { const it = D.findInteract(); if (it && it.type === 'portailBleu') { Ef.traverser(); return; } return it0.apply(this, arguments); };
  }

  // ---------- bénédiction de la cigogne : une gobeline enchantée aura plus de bébés si elle fonde une famille avec le chef ce soir ----------
  Ef.CIGOGNE = { portee: 260 };
  CG.SPELLS.cigogne = { nom: 'Bénédiction de la cigogne', icon: '🍼', mp: 14, prix: 600, desc: 'Enchante la gobeline (ou le gobelin, si tu es une cheffe) la plus proche jusqu\'au matin : si vous fondez une famille ce soir, il naîtra 1 ou 2 bébés de plus (s\'il reste de la place dans les huttes).', color: '#ff9ac8' };
  CG.SCROLL_POOL.push('cigogne');
  const castC = G.cast;
  G.cast = function (id) {
    if (id !== 'cigogne') return castC.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    let g = null, bd = Ef.CIGOGNE.portee; for (const o of S.goblins) { if (!CG.Soc.courtable(o) || o.hidden || o.perch || o.fertile === S.day) continue; const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; g = o; } }
    if (!g) { CG.sfx('no'); G.text(p.x, p.y - 56, (CG.Soc.courtable({ sex: 'f' }) ? 'Aucune gobeline' : 'Aucun gobelin') + ' à enchanter près de toi', '#ffb0d0'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); g.fertile = S.day; g.emoteT = 2;
    R.bolts.push({ x1: p.x, y1: p.y - 26, x2: g.x, y2: g.y - 30, life: 0.25 }); R.rings.push({ x: g.x, y: g.y - 10, r: 60, life: 0.5, col: '#ff9ac8' });
    for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, v = 50 + Math.random() * 90; R.parts.push({ x: g.x, y: g.y - 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.9, max: 0.9, col: i % 2 ? '#ff9ac8' : '#ffffff', size: 3.5 }); }
    G.text(g.x, g.y - 76, (g.sex === 'f' ? '🍼 Bénie' : '🍼 Béni') + ' par la cigogne !', '#ffd0e4', true);
    if (G.say) G.say(g, CG.pick(['Oh ! J\'ai des papillons dans le ventre !', 'Hi hi ! Ça chatouille partout !', 'Je me sens tout' + (g.sex === 'f' ? 'e' : '') + ' chose, chef...', 'C\'était quoi, ce gros oiseau ?', 'J\'ai soudain très envie de tricoter des petits bonnets.']), 3.5, 0.5);
  };
  function cigogne(g, t) { // des petits cœurs qui montent autour de la gobeline enchantée
    const S = CG.S; for (const o of S.goblins) { if (o.fertile !== S.day || o.hidden || !CG.onScreen(o.x, o.y)) continue;
      g.save(); g.textAlign = 'center'; for (let i = 0; i < 3; i++) { const u = (t * 0.45 + i / 3 + o.id * 0.31) % 1; g.globalAlpha = Math.sin(u * Math.PI) * 0.9; g.font = Math.round(9 + u * 6) + 'px sans-serif'; g.fillText('💗', o.x + Math.sin(i * 2.3 + o.id + t) * 14, o.y - 34 - u * 34); } g.restore(); }
  }

  // ---------- le grimoire : ce que fait chaque sort, en chiffres (valeur de base, puis à ton niveau) ----------
  // [icône, valeur de base ou null, texte] — {n} est remplacé par la valeur
  Ef.FICHE = {
    etincelle: ['⚔️', 9, '{n} dégâts'], feu: ['⚔️', 20, '{n} dégâts, en explosion'], glace: ['⚔️', 7, '{n} dégâts, ralentit 4,5 s'], soin: ['❤️', 35, '{n} points de vie (25 aux gobelins proches)'],
    racines: ['⚔️', 4, '{n} dégâts, cloue au sol 3,8 s'], eclair: ['⚔️', 15, '{n} dégâts, rebondit sur 4 ennemis'], bouclier: ['🛡️', 30, 'absorbe {n} dégâts, 12 s'], meteore: ['⚔️', 48, '{n} dégâts, grande explosion'],
    onde: ['⚔️', 5, '{n} dégâts, repousse tout autour'], poison: ['⚔️', 5.2, '{n} dégâts par seconde, 8 s'],
    cri: ['📯', null, 'Gardes : +50 % de dégâts, plus rapides, 12 s'], vision: ['⏳', null, 'Dure 30 secondes'], hate: ['👟', null, 'Vitesse ×1,3 pendant 12 s'], golem: ['⏳', null, 'Il reste 2 minutes'],
    faucon: ['⏳', null, 'Dure 5 secondes'], parefeu: ['🛡️', null, '−80 % de dégâts de feu, 20 s'], ombres: ['⏳', null, 'Dure 20 secondes'], retour: ['🌀', null, 'Portail ouvert 1 minute'], cigogne: ['👶', null, '+1 ou +2 bébés cette nuit']
  };
  Ef.fiche = function (id) {
    const f = Ef.FICHE[id], M = CG.Magie; let txt, ic;
    if (f) { ic = f[0]; const m = 1 + 0.12 * (CG.S.player.lvl - 1), fmt = v => String(Math.round(v * 10) / 10).replace('.', ','); txt = f[2].replace('{n}', '<b>' + (f[1] === null ? '' : fmt(f[1])) + '</b>') + (f[1] !== null && m > 1 ? ' <i>(à ton niveau : ' + fmt(f[1] * m) + ')</i>' : ''); }
    else { const d = { invisible: M.INVIS, sommeil: M.SLEEP, charme: M.CHARM, caboche: M.CABOCHE }[id]; if (!d) return ''; ic = '⏳'; txt = 'Dure <b>' + d + '</b> secondes'; }
    return '<div class="gr-effet"><span>' + ic + '</span>' + txt + '</div>';
  };
})(window.CG);
