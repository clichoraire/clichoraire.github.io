// ============================================================
//  sprites.js — Dessin des unités
//  Les unités des quatre races sont dessinées depuis la feuille de sprites
//  assets/units.png (vue 3/4 : tournées à gauche en miroir). Les structures,
//  le dropship et les ruines restent dessinés procéduralement.
//  Chaque fonction dessine centrée en (0,0). c = couleur du joueur, a = phase
//  d'animation, m = en mouvement, atk = 0..1 animation d'attaque, t = temps.
// ============================================================
(function (ZC) {
  'use strict';
  const TAU = Math.PI * 2;

  function ell(ctx, x, y, rx, ry, fill, stroke, lw) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  function circ(ctx, x, y, r, fill, stroke, lw) { ell(ctx, x, y, r, r, fill, stroke, lw); }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  // ------------------------------------------------------------ Feuille de sprites (voir tools/sprites/extract.js)
  const sheet = { img: null, ready: false, frames: {} };
  if (ZC.SHEET && typeof Image !== 'undefined') {
    sheet.frames = ZC.SHEET.frames;
    sheet.img = new Image();
    sheet.img.onload = () => { sheet.ready = true; };
    sheet.img.src = ZC.SHEET.src;
  }
  // Cadres par unité : h = hauteur à l'écran du sprite, feet = position des pieds sous le centre
  const SPEC = {
    marine:     { idle: 'marine_idle', walk: ['marine_walk1', 'marine_walk2'], fire: 'marine_fire', h: 27, feet: 7 },
    exomarine:  { idle: 'exo_idle',    walk: ['exo_walk1', 'exo_walk2'],       fire: 'exo_fire',    h: 40, feet: 10 },
    runner:     { idle: 'runner_idle', walk: ['runner_walk1', 'runner_walk2', 'runner_walk3'], fire: 'runner_fire', h: 20, feet: 6 },
    beast:      { idle: 'beast_idle',  walk: ['beast_walk1', 'beast_walk2'],   fire: 'beast_fire',  h: 46, feet: 12 },
    blade:      { idle: 'blade_idle',  walk: ['blade_walk1', 'blade_walk2'],   fire: 'blade_fire',  h: 29, feet: 8 },
    archonmech: { idle: 'archon_idle', walk: ['archon_walk1', 'archon_walk2'], fire: 'archon_fire', h: 46, feet: 12 },
    scoutbot:   { idle: 'scout_idle',  walk: ['scout_walk1', 'scout_walk2', 'scout_walk3'], fire: 'scout_fire', h: 28, feet: 7 },
    siegemech:  { idle: 'siege_idle',  walk: ['siege_walk1', 'siege_walk2'],   fire: 'siege_fire',  h: 48, feet: 13 },
    // Niveau 3 : mêmes cadres que le niveau 2, plus grands, avec une parure de rang 3 dessinée par-dessus (tier3)
    colossus:   { idle: 'exo_idle',    walk: ['exo_walk1', 'exo_walk2'],       fire: 'exo_fire',    h: 50, feet: 13, tier3: 'human',  tint: 'rgba(20,30,60,0.5)' },    // acier sombre
    ravager:    { idle: 'beast_idle',  walk: ['beast_walk1', 'beast_walk2'],   fire: 'beast_fire',  h: 58, feet: 15, tier3: 'insect', tint: 'rgba(50,0,25,0.45)' },    // chitine noire et pourpre
    avatar:     { idle: 'archon_idle', walk: ['archon_walk1', 'archon_walk2'], fire: 'archon_fire', h: 58, feet: 15, tier3: 'energy', tint: 'rgba(255,235,170,0.35)' }, // or et lumière
    fortress:   { idle: 'siege_idle',  walk: ['siege_walk1', 'siege_walk2'],   fire: 'siege_fire',  h: 60, feet: 16, tier3: 'mecha',  tint: 'rgba(30,15,15,0.45)' },   // bronze de guerre sombre
  };
  // Parure de rang 3 : repères visuels forts pour reconnaître d'un coup d'œil l'unité la plus puissante de chaque race
  function tier3Deco(ctx, kind, spec, c, t, flip) {
    const top = spec.feet - spec.h, cy = top + spec.h * 0.45, sx = flip ? -1 : 1;
    ctx.save();
    switch (kind) {
      case 'human': { // acier sombre (teinte), pointes d'épaule dorées et voyants rouges du réacteur dorsal
        const sy = top + spec.h * 0.34;
        ctx.fillStyle = '#ffd040'; ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 0.8;
        for (const side of [-1, 1]) { const px = side * spec.h * 0.19; ctx.beginPath(); ctx.moveTo(px, sy + 1); ctx.lineTo(px + side * 6, sy - 7); ctx.lineTo(px + side * 4, sy + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        const glow = 0.5 + 0.5 * Math.sin(t * 7);
        for (const side of [-1, 1]) circ(ctx, side * spec.h * 0.08, sy + 6, 1.6, 'rgba(255,' + Math.round(60 + 90 * glow) + ',40,0.95)');
        break;
      }
      case 'insect': { // cornes dorsales et yeux rouges luisants
        ctx.fillStyle = '#5a1a14'; ctx.strokeStyle = '#ffb090'; ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i++) { const bx = i * spec.h * 0.16, by = top + spec.h * 0.3; ctx.beginPath(); ctx.moveTo(bx - 4, by + 4); ctx.lineTo(bx + i * 3, by - spec.h * 0.22 - (i === 0 ? 4 : 0)); ctx.lineTo(bx + 4, by + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        const eye = 'rgba(255,40,40,' + (0.7 + 0.3 * Math.sin(t * 8)) + ')';
        circ(ctx, sx * spec.h * 0.2, top + spec.h * 0.28, 1.8, eye); circ(ctx, sx * spec.h * 0.28, top + spec.h * 0.3, 1.5, eye);
        break;
      }
      case 'energy': { // halo d'énergie tournant et étincelles
        ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) { const a0 = t * 2.5 + k * TAU / 3; ctx.strokeStyle = 'rgba(140,220,255,0.85)'; ctx.beginPath(); ctx.arc(0, cy, spec.h * 0.42, a0, a0 + 1.1); ctx.stroke(); }
        for (let k = 0; k < 4; k++) { const a = t * 4 + k * TAU / 4; circ(ctx, Math.cos(a) * spec.h * 0.45, cy + Math.sin(a) * spec.h * 0.3, 1.4, 'rgba(220,245,255,0.9)'); }
        break;
      }
      case 'mecha': { // antenne à feu clignotant et blindage additionnel
        ctx.strokeStyle = '#8c96a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-sx * spec.h * 0.18, top + spec.h * 0.25); ctx.lineTo(-sx * spec.h * 0.22, top - 4); ctx.stroke();
        circ(ctx, -sx * spec.h * 0.22, top - 5, 2, Math.sin(t * 5) > 0 ? '#ff4040' : '#601010');
        for (const side of [-1, 1]) { roundRect(ctx, side * spec.h * 0.26 - 4, cy - 3, 8, 12, 2); ctx.fillStyle = '#3a4250'; ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.stroke(); }
        break;
      }
    }
    ctx.restore();
  }
  ZC.spriteIsImage = (type) => { const d = ZC.UNITS[type]; return sheet.ready && !!SPEC[d && d.hero ? d.base : type]; };
  ZC.spriteSpec = (type) => { const d = ZC.UNITS[type]; return SPEC[d && d.hero ? d.base : type] || null; }; // { h, feet } : hauteur à l'écran et position des pieds

  // Dessine un cadre : le sprite est mis à l'échelle sur sa hauteur de référence (rh) et son sommet
  // est placé en (feet - h) pour que tous les cadres d'une unité s'alignent.
  // Cadres teintés (unités de niveau 3) : le cadre est recopié dans un canvas hors écran puis voilé de la teinte, une seule fois
  const tinted = new Map();
  function tintedFrame(f, tint) {
    const key = f.x + ',' + f.y + tint;
    let cv = tinted.get(key);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = f.w; cv.height = f.h;
      const c2 = cv.getContext('2d');
      c2.drawImage(sheet.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      c2.globalCompositeOperation = 'source-atop'; c2.fillStyle = tint; c2.fillRect(0, 0, f.w, f.h);
      tinted.set(key, cv);
    }
    return cv;
  }
  function frame(ctx, name, h, feet, flip, alpha, tint) {
    const f = sheet.frames[name]; if (!f) return;
    const k = h / (f.rh || f.bh || f.h);
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha *= alpha;
    if (flip) ctx.scale(-1, 1);
    if (tint && typeof document !== 'undefined') ctx.drawImage(tintedFrame(f, tint), 0, 0, f.w, f.h, -(f.bx + f.bw / 2) * k, (feet - h) - f.by * k, f.w * k, f.h * k);
    else ctx.drawImage(sheet.img, f.x, f.y, f.w, f.h, -(f.bx + f.bw / 2) * k, (feet - h) - f.by * k, f.w * k, f.h * k);
    ctx.restore();
  }
  // Direction (0 = est, 2 = sud, 4 = ouest, 6 = nord) à partir de l'angle de l'unité
  function dir8(facing) { return ((Math.round(facing / (Math.PI / 4)) % 8) + 8) % 8; }

  // Unité de la feuille : disque aux couleurs du joueur, pastilles d'amélioration, cadre selon l'état
  function sheetUnit(ctx, spec, c, a, m, atk, facing, w, ar, death, t) {
    if (facing !== undefined) ctx.rotate(-facing);
    const d = facing === undefined ? 0 : dir8(facing);
    const flip = d >= 3 && d <= 5;
    if (death !== undefined) { // cadavre : s'affaisse et s'assombrit
      ctx.save(); ctx.translate(0, spec.feet); ctx.scale(1, Math.max(0.25, 1 - death * 0.75)); ctx.translate(0, -spec.feet);
      frame(ctx, spec.idle, spec.h, spec.feet, flip, 1 - death * 0.5, spec.tint);
      ctx.restore();
      return;
    }
    const r = Math.max(7, spec.h * 0.32);
    ell(ctx, 0, spec.feet, r, r * 0.45, ZC.rgba(c, 0.4), c, 1);
    if (spec.tier3) ell(ctx, 0, spec.feet, r + 3, (r + 3) * 0.45, null, 'rgba(255,208,64,' + (0.55 + 0.3 * Math.sin((t || 0) * 4)) + ')', 2); // anneau doré de rang 3
    // pastilles : armes (jaune) à droite, armure (bleu) à gauche
    for (let i = 0; i < w; i++) circ(ctx, r + 2 + i * 3, spec.feet, 1.1, '#ffd040');
    for (let i = 0; i < ar; i++) circ(ctx, -r - 2 - i * 3, spec.feet, 1.1, '#5cc8ff');
    let name;
    if (atk > 0) name = spec.fire;
    else if (m) name = spec.walk[Math.floor(a / 1.5) % spec.walk.length];
    else name = spec.idle;
    const bob = m && (d === 2 || d === 6) ? Math.sin(a) : 0;
    frame(ctx, name, spec.h, spec.feet + bob, flip, undefined, spec.tint);
    if (spec.tier3) tier3Deco(ctx, spec.tier3, spec, c, t || 0, flip);
  }
  // Secours quand la feuille n'est pas chargée : silhouette simple
  function fallback(ctx, c, def, atk) {
    const r = def ? def.radius : 8;
    circ(ctx, 0, 0, r, '#6c727c', '#2a2e35', 1);
    circ(ctx, -r * 0.3, 0, r * 0.45, c);
    if (def && def.range > 0) { ctx.fillStyle = '#3a3d44'; ctx.fillRect(r * 0.3, -1.5, r * 1.3 - atk * 3, 3); }
  }

  const S = {};

  // Bunker (structure, jamais tournée)
  S.bunker = function (ctx, c, a, m, atk, t) {
    roundRect(ctx, -24, -20, 48, 40, 6); ctx.fillStyle = '#353a42'; ctx.fill(); ctx.strokeStyle = '#111418'; ctx.lineWidth = 2; ctx.stroke();
    roundRect(ctx, -20, -16, 40, 32, 5); ctx.fillStyle = '#5f6771'; ctx.fill();
    roundRect(ctx, -16, -12, 32, 24, 4); ctx.fillStyle = '#7d858f'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-14, -10, 28, 4);
    ctx.fillStyle = '#0e1114';
    ctx.fillRect(-11, -14, 7, 3); ctx.fillRect(4, -14, 7, 3); ctx.fillRect(-11, 11, 7, 3); ctx.fillRect(4, 11, 7, 3);
    ctx.fillRect(-18, -4, 3, 8); ctx.fillRect(15, -4, 3, 8);
    ctx.fillStyle = c;
    ctx.fillRect(-23, -19, 9, 3); ctx.fillRect(14, -19, 9, 3); ctx.fillRect(-23, 16, 9, 3); ctx.fillRect(14, 16, 9, 3);
    ctx.fillStyle = '#262b31'; ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 1; ctx.strokeRect(-5.5, -5.5, 11, 11);
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
    const bl = (Math.sin(t * 4) + 1) / 2;
    circ(ctx, 0, -15, 2.2, ZC.rgba(c, 0.35 + 0.65 * bl));
  };

  // Centre de commandement (structure principale : seul producteur de dropships)
  S.hq = function (ctx, c, a, m, atk, t) {
    roundRect(ctx, -34, -28, 68, 56, 8); ctx.fillStyle = '#2f343c'; ctx.fill(); ctx.strokeStyle = '#0e1114'; ctx.lineWidth = 2.5; ctx.stroke();
    roundRect(ctx, -29, -23, 58, 46, 6); ctx.fillStyle = '#555d68'; ctx.fill();
    ctx.fillStyle = '#6b737e'; ctx.fillRect(-29, -20, 12, 40); ctx.fillRect(17, -20, 12, 40);
    ctx.fillStyle = '#1a1e24'; for (let i = 0; i < 3; i++) { ctx.fillRect(-26, -16 + i * 13, 6, 4); ctx.fillRect(20, -16 + i * 13, 6, 4); }
    const g = ctx.createRadialGradient(-4, -6, 2, 0, 0, 16);
    g.addColorStop(0, '#aeb6c0'); g.addColorStop(1, '#6b737e');
    circ(ctx, 0, -2, 15, g, '#1a1e24', 1.5);
    circ(ctx, 0, -2, 6, '#3a414a', '#1a1e24', 1);
    ctx.fillStyle = c;
    ctx.fillRect(-33, -27, 14, 4); ctx.fillRect(19, -27, 14, 4); ctx.fillRect(-33, 23, 14, 4); ctx.fillRect(19, 23, 14, 4);
    ctx.fillRect(-10, 14, 20, 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-12.5, 15.5, 25, 7);
    ctx.strokeStyle = '#c0c8d0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(12, -12); ctx.lineTo(18, -24); ctx.stroke();
    const bl = (Math.sin(t * 5) + 1) / 2;
    circ(ctx, 18, -24, 2.5, ZC.rgba(c, 0.4 + 0.6 * bl));
    circ(ctx, -18, -24, 2, 'rgba(255,220,80,' + (0.3 + 0.7 * (1 - bl)) + ')');
  };

  // Extracteur (structure sur un gisement) : socle, tour et mèche qui tourne
  S.extractor = function (ctx, c, a, m, atk, t) {
    ell(ctx, 0, 4, 17, 11, '#2b2f36', '#0e1114', 2);
    ell(ctx, 0, 2, 13, 8, '#555d68');
    ctx.fillStyle = '#3a414a'; ctx.fillRect(-9, -14, 18, 16); ctx.strokeStyle = '#14171c'; ctx.lineWidth = 1; ctx.strokeRect(-9, -14, 18, 16);
    ctx.fillStyle = '#7d858f'; ctx.fillRect(-7, -12, 14, 4);
    ctx.fillStyle = c; ctx.fillRect(-8, -6, 4, 6); ctx.fillRect(4, -6, 4, 6);
    ctx.save(); ctx.translate(0, -6); ctx.rotate(a);
    ctx.fillStyle = '#c8d0d8'; for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.fillRect(0, -1.5, 9, 3); }
    ctx.restore();
    const bl = (Math.sin(t * 6) + 1) / 2;
    circ(ctx, 0, -6, 2.5, 'rgba(57,255,20,' + (0.4 + 0.6 * bl) + ')');
    ctx.fillStyle = '#1e2227'; ctx.fillRect(-13, 6, 26, 3); ctx.fillStyle = '#39ff14'; ctx.globalAlpha = 0.6; ctx.fillRect(-12, 7, 24 * bl, 1); ctx.globalAlpha = 1;
  };

  // Tours défensives (structures, jamais tournées par le rendu : on oriente nous-mêmes le canon)
  S.towerHuman = function (ctx, c, a, m, atk, t) { // tour de guet : pieds, plateforme, parapet ; occupée = silhouettes
    ctx.strokeStyle = '#2b2f36'; ctx.lineWidth = 3; ctx.beginPath(); for (const [x, y] of [[-10, 10], [10, 10], [-10, -8], [10, -8]]) { ctx.moveTo(x, y); ctx.lineTo(x * 0.6, y * 0.6); } ctx.stroke();
    roundRect(ctx, -13, -13, 26, 26, 4); ctx.fillStyle = '#4a515c'; ctx.fill(); ctx.strokeStyle = '#14171c'; ctx.lineWidth = 1.5; ctx.stroke();
    roundRect(ctx, -10, -10, 20, 20, 3); ctx.fillStyle = '#6b737e'; ctx.fill();
    ctx.fillStyle = '#2b2f36'; for (let i = -1; i <= 1; i++) { ctx.fillRect(i * 7 - 2, -13, 4, 3); ctx.fillRect(i * 7 - 2, 10, 4, 3); ctx.fillRect(-13, i * 7 - 2, 3, 4); ctx.fillRect(10, i * 7 - 2, 3, 4); }
    ctx.fillStyle = c; ctx.fillRect(-4, -4, 8, 8);
    const bl = (Math.sin(t * 5) + 1) / 2; circ(ctx, 0, 0, 1.8, 'rgba(255,220,80,' + (0.3 + 0.7 * bl) + ')');
  };
  S.towerInsect = function (ctx, c, a, m, atk, t) { // colonie d'épines : bulbe organique et épines dressées
    ell(ctx, 0, 4, 15, 10, '#5a2a3a', '#2a1018', 1.5);
    ell(ctx, 0, 0, 11, 11, '#8c4a5e', '#2a1018', 1);
    ctx.strokeStyle = '#d8c8b0'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + Math.sin(t * 2 + i) * 0.1, l = 10 + (atk > 0 ? 6 : 0); ctx.moveTo(Math.cos(b) * 6, Math.sin(b) * 6); ctx.lineTo(Math.cos(b) * (6 + l), Math.sin(b) * (6 + l)); }
    ctx.stroke();
    circ(ctx, 0, 0, 4, c); circ(ctx, 0, 0, 2, '#ffe080');
  };
  S.towerEnergy = function (ctx, c, a, m, atk, t) { // canon à photons : socle et cristal flottant
    ell(ctx, 0, 5, 14, 9, '#3a3c5a', '#14141f', 1.5);
    ctx.fillStyle = c; ctx.fillRect(-9, 2, 18, 3);
    const bl = 0.6 + 0.4 * Math.sin(t * 6), h = 2 * Math.sin(t * 3);
    ctx.fillStyle = 'rgba(120,200,255,' + (0.15 + 0.2 * bl) + ')'; ctx.beginPath(); ctx.arc(0, -4 + h, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6cd4ff'; ctx.beginPath(); ctx.moveTo(0, -16 + h); ctx.lineTo(7, -4 + h); ctx.lineTo(0, 6 + h); ctx.lineTo(-7, -4 + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + bl + ')'; ctx.beginPath(); ctx.moveTo(0, -12 + h); ctx.lineTo(3, -5 + h); ctx.lineTo(0, -1 + h); ctx.lineTo(-3, -5 + h); ctx.closePath(); ctx.fill();
  };
  // Annexes des centres de commandement (petit bâtiment accolé) : laboratoire, chambre d'évolution, sanctuaire, atelier
  S.addonHuman = function (ctx, c, a, m, atk, t) { // laboratoire : bloc gris, antenne parabolique, baie bleutée
    ell(ctx, 0, 6, 16, 10, '#2b2f36', '#0e1114', 1.5);
    ctx.fillStyle = '#4a515c'; ctx.fillRect(-12, -10, 24, 18); ctx.strokeStyle = '#14171c'; ctx.lineWidth = 1.5; ctx.strokeRect(-12, -10, 24, 18);
    ctx.fillStyle = '#6b737e'; ctx.fillRect(-10, -8, 20, 4);
    ctx.fillStyle = c; ctx.fillRect(-12, 4, 24, 3);
    ctx.fillStyle = 'rgba(90,184,255,' + (0.5 + 0.3 * Math.sin(t * 3)) + ')'; ctx.fillRect(-8, -3, 16, 5);
    ctx.save(); ctx.translate(6, -12); ctx.rotate(Math.sin(t * 0.7) * 0.3); ell(ctx, 0, 0, 6, 3, '#c8d0d8', '#14171c', 1); ctx.fillStyle = '#14171c'; ctx.fillRect(-0.7, -5, 1.4, 5); ctx.restore();
    circ(ctx, -8, -12, 1.6, 'rgba(255,80,60,' + (0.4 + 0.6 * (Math.sin(t * 5) + 1) / 2) + ')');
  };
  S.addonInsect = function (ctx, c, a, m, atk, t) { // chambre d'évolution : cocon charnu qui palpite, veines colorées
    ell(ctx, 0, 6, 16, 10, '#4a2230', '#2a1018', 1.5);
    const pulse = 1 + 0.05 * Math.sin(t * 2.5);
    ell(ctx, 0, -1, 12 * pulse, 13 * pulse, '#8c4a5e', '#2a1018', 1.2);
    ell(ctx, -3, -5, 5, 6, '#b06a7c');
    ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, 6); ctx.quadraticCurveTo(-2, -2, 2, -10); ctx.moveTo(8, 6); ctx.quadraticCurveTo(4, 0, -1, -8); ctx.stroke();
    circ(ctx, 0, -2, 2.2, 'rgba(255,170,90,' + (0.5 + 0.5 * (Math.sin(t * 2.5) + 1) / 2) + ')');
  };
  S.addonEnergy = function (ctx, c, a, m, atk, t) { // sanctuaire : obélisque de cristal et anneau flottant
    ell(ctx, 0, 7, 15, 9, '#2a2f55', '#0e1130', 1.5);
    ctx.fillStyle = '#c9b25a'; ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(9, 6); ctx.lineTo(6, 2); ctx.lineTo(-6, 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#5a4a10'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#9ad0ff'; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(5, 2); ctx.lineTo(-5, 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#2a4a8a'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(2, 0); ctx.lineTo(-1, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -6 + Math.sin(t * 2) * 1.5, 9, 3, 0, 0, TAU); ctx.stroke();
  };
  S.addonMecha = function (ctx, c, a, m, atk, t) { // atelier : hangar à toit rayé, engrenage qui tourne
    ell(ctx, 0, 6, 16, 10, '#2b2f36', '#0e1114', 1.5);
    ctx.fillStyle = '#3a414a'; ctx.fillRect(-13, -8, 26, 16); ctx.strokeStyle = '#14171c'; ctx.lineWidth = 1.5; ctx.strokeRect(-13, -8, 26, 16);
    ctx.fillStyle = '#7d858f'; for (let i = -12; i < 12; i += 4) ctx.fillRect(i, -8, 2, 6);
    ctx.fillStyle = c; ctx.fillRect(-13, 5, 26, 3);
    ctx.save(); ctx.translate(6, -1); ctx.rotate(t * 1.5); ctx.fillStyle = '#c8d0d8'; for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.fillRect(-1.2, 0, 2.4, 5.5); } ctx.restore(); circ(ctx, 6, -1, 2.5, '#3a414a', '#c8d0d8', 1);
    circ(ctx, -7, -2, 2, 'rgba(108,212,255,' + (0.4 + 0.6 * (Math.sin(t * 4) + 1) / 2) + ')');
  };
  S.towerMecha = function (ctx, c, a, m, atk, t, facing) { // tourelle : base, dôme et canon orienté vers la cible
    ell(ctx, 0, 4, 15, 10, '#2b2f36', '#0e1114', 1.5);
    circ(ctx, 0, 0, 10, '#555d68', '#14171c', 1);
    ctx.fillStyle = c; ctx.fillRect(-8, -2, 4, 4); ctx.fillRect(4, -2, 4, 4);
    ctx.save(); ctx.rotate(facing || 0);
    ctx.fillStyle = '#3a414a'; ctx.fillRect(2, -3, 14 - atk * 3, 6); ctx.fillStyle = '#8a95a3'; ctx.fillRect(2, -2, 13 - atk * 3, 2);
    if (atk > 0) { ctx.fillStyle = 'rgba(255,220,120,' + atk + ')'; circ(ctx, 17, 0, 4 * atk, 'rgba(255,220,120,' + atk + ')'); }
    ctx.restore();
    circ(ctx, 0, 0, 5, '#7d858f', '#14171c', 1); circ(ctx, 0, 0, 1.5, '#6cd4ff');
  };

  // Ruines d'un bunker détruit
  S.ruins = function (ctx, seed) {
    const rnd = ZC.seededRandom(seed || 7);
    ctx.fillStyle = 'rgba(15,12,10,0.55)';
    ctx.beginPath(); ctx.ellipse(0, 2, 30, 22, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 7; i++) {
      ctx.save();
      ctx.translate((rnd() - 0.5) * 36, (rnd() - 0.5) * 28);
      ctx.rotate(rnd() * TAU);
      ctx.fillStyle = i % 2 ? '#3a3f47' : '#2a2e34';
      ctx.fillRect(-7, -4, 14 + rnd() * 6, 6 + rnd() * 4);
      ctx.restore();
    }
    ctx.strokeStyle = '#5f6771'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-6, -16); ctx.moveTo(10, 6); ctx.lineTo(18, 12); ctx.stroke();
  };

  // Dropship (unité volante)
  S.dropship = function (ctx, c, a, m, atk, t) {
    ctx.fillStyle = '#4f565f'; ctx.strokeStyle = '#1e2227'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-4, -5); ctx.lineTo(-13, -17); ctx.lineTo(-21, -17); ctx.lineTo(-12, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(-13, 17); ctx.lineTo(-21, 17); ctx.lineTo(-12, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c; ctx.fillRect(-19, -16, 6, 2); ctx.fillRect(-19, 14, 6, 2);
    ell(ctx, 0, 0, 17, 8, '#747c86', '#1e2227', 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(-8, -4, 16, 3);
    ell(ctx, 10, 0, 5, 3.6, '#4fb8ff', '#1e2227', 1);
    ctx.fillStyle = '#2f343b'; ctx.fillRect(-20, -7, 8, 5); ctx.fillRect(-20, 2, 8, 5);
    const f = 0.55 + 0.45 * Math.sin(t * 30);
    ctx.fillStyle = 'rgba(255,170,60,' + f + ')'; ctx.fillRect(-25, -6, 5, 3); ctx.fillRect(-25, 3, 5, 3);
    ctx.fillStyle = c; ctx.fillRect(-6, -2, 9, 4);
  };

  // Travailleurs (vue de dessus, orientés vers +x) : un par race
  S.workerHuman = function (ctx, c, a, m, atk, t) { // ouvrier : petit véhicule à chenilles avec une pince
    ctx.fillStyle = '#2a2e35'; ctx.fillRect(-7, -7, 12, 3); ctx.fillRect(-7, 4, 12, 3);
    roundRect(ctx, -6, -5, 11, 10, 2); ctx.fillStyle = '#8e97a3'; ctx.fill(); ctx.strokeStyle = '#1e2227'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = c; ctx.fillRect(-5, -4, 4, 8);
    ctx.fillStyle = '#3f6fb0'; ctx.fillRect(0, -3, 4, 6);
    const o = m ? Math.sin(a * 2) * 1.2 : 0;
    ctx.strokeStyle = '#c0c8d0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(9, -4 + o); ctx.moveTo(4, 3); ctx.lineTo(9, 4 - o); ctx.stroke();
  };
  S.workerInsect = function (ctx, c, a, m, atk, t) { // drone : larve à six pattes
    const w = m ? Math.sin(a * 3) * 2 : 0;
    ctx.strokeStyle = '#5a2a3a'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = -1; i <= 1; i++) { ctx.moveTo(i * 3, -3); ctx.lineTo(i * 3 - 2 + w, -8); ctx.moveTo(i * 3, 3); ctx.lineTo(i * 3 - 2 - w, 8); }
    ctx.stroke();
    ell(ctx, -1, 0, 8, 5, '#8c4a5e', '#2a1018', 1);
    ell(ctx, 4, 0, 4, 3.2, c, '#2a1018', 1);
    ctx.fillStyle = '#ffe080'; ctx.fillRect(6, -2, 1.5, 1.5); ctx.fillRect(6, 1, 1.5, 1.5);
  };
  S.workerEnergy = function (ctx, c, a, m, atk, t) { // sonde : orbe flottant
    const bl = 0.6 + 0.4 * Math.sin(t * 6);
    circ(ctx, 0, 0, 9, 'rgba(120,200,255,' + (0.15 * bl) + ')');
    circ(ctx, 0, 0, 6.5, '#d9c57a', '#4a3c14', 1);
    circ(ctx, 1, 0, 3.2, '#6cd4ff'); circ(ctx, 1, 0, 1.5, 'rgba(255,255,255,' + bl + ')');
    ctx.fillStyle = c; ctx.fillRect(-6, -1.5, 4, 3);
  };
  S.workerMecha = function (ctx, c, a, m, atk, t) { // foreur : robot carré avec une mèche
    ctx.fillStyle = '#3a4048'; ctx.fillRect(-7, -6, 10, 12); ctx.strokeStyle = '#14171c'; ctx.lineWidth = 1; ctx.strokeRect(-7, -6, 10, 12);
    ctx.fillStyle = '#8a95a3'; ctx.fillRect(-6, -5, 8, 10);
    ctx.fillStyle = c; ctx.fillRect(-5, -4, 6, 3);
    circ(ctx, -1, 2, 1.5, '#6cd4ff');
    ctx.save(); ctx.translate(3, 0); ctx.rotate(m ? a * 4 : t * 3);
    ctx.fillStyle = '#c8d0d8'; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(7, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  ZC.drawRuins = function (ctx, seed) { S.ruins(ctx, seed); };

  // up = { weapons, armor } : niveaux d'amélioration (pastilles sous l'unité)
  // ------------------------------------------------------------ Variantes par race des bâtiments et du dropship
  // (S[type + '_' + race] est utilisé s'il existe ; sinon le dessin humain par défaut)
  const spike = (ctx, x, y, ang, len, w, fill) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(len, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill(); ctx.restore(); };
  const glow = (ctx, x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };

  // --- Essaim insectoïde : chair, carapace, orifices qui palpitent
  S.bunker_insect = function (ctx, c, a, m, atk, t) {
    const pulse = 1 + 0.04 * Math.sin(t * 3);
    ell(ctx, 0, 4, 26, 19, '#5a2a3a', '#2a1018', 2);
    ell(ctx, 0, 0, 22 * pulse, 16 * pulse, '#8a3a4e');
    ell(ctx, -4, -4, 13, 9, '#a85268');
    for (let i = 0; i < 6; i++) { const ang = i * TAU / 6 + 0.4; spike(ctx, Math.cos(ang) * 20, Math.sin(ang) * 14, ang, 9, 3, '#e9d8c2'); }
    for (const [x, y] of [[-10, 2], [8, 4], [0, -9]]) { const o = 2.5 + 1.2 * Math.sin(t * 4 + x); circ(ctx, x, y, o, '#2a0a12', '#120408', 1); }
    ctx.fillStyle = c; for (let i = 0; i < 4; i++) { const ang = i * TAU / 4 + TAU / 8; circ(ctx, Math.cos(ang) * 15, Math.sin(ang) * 10, 2.4, c); }
    glow(ctx, 0, -2, 8, ZC.rgba(c, 0.25 + 0.2 * Math.sin(t * 3)));
  };
  S.hq_insect = function (ctx, c, a, m, atk, t) {
    const pulse = 1 + 0.03 * Math.sin(t * 2.5);
    ell(ctx, 0, 8, 36, 24, '#4a2030', '#200a12', 2.5);
    ell(ctx, 0, 0, 31 * pulse, 23 * pulse, '#7e3348');
    ell(ctx, -6, -6, 18, 12, '#9c4a62');
    for (let i = 0; i < 8; i++) { const ang = i * TAU / 8; spike(ctx, Math.cos(ang) * 29, Math.sin(ang) * 21, ang, 12, 3.5, '#e9d8c2'); }
    for (const [x, y, r] of [[-16, 6, 5], [14, 8, 5], [2, -14, 4], [16, -8, 3.5], [-14, -10, 3.5]]) { const o = r * (0.8 + 0.25 * Math.sin(t * 3 + x)); circ(ctx, x, y, o, '#2a0a12', '#120408', 1); circ(ctx, x, y, o * 0.4, ZC.rgba(c, 0.6)); }
    ell(ctx, 0, 0, 7, 5, '#1a0610', '#0a0206', 1); glow(ctx, 0, 0, 14, ZC.rgba(c, 0.3 + 0.25 * Math.sin(t * 2.5)));
    ctx.strokeStyle = '#c86e86'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const ang = t * 0.8 + i * 2.1; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 10, Math.sin(ang) * 7); ctx.quadraticCurveTo(Math.cos(ang) * 22, Math.sin(ang) * 16 + 4, Math.cos(ang + 0.5) * 30, Math.sin(ang + 0.5) * 22); ctx.stroke(); }
  };
  S.extractor_insect = function (ctx, c, a, m, atk, t) {
    ell(ctx, 0, 5, 17, 11, '#4a2030', '#200a12', 2);
    const s = 1 + 0.08 * Math.sin(t * 5);
    ell(ctx, 0, -2, 11 * s, 12 * s, '#8a3a4e', '#3a1020', 1);
    ell(ctx, -3, -6, 5, 4, '#b05a72');
    for (let i = 0; i < 5; i++) { const ang = i * TAU / 5 + t * 0.5; ctx.strokeStyle = '#c86e86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 8, Math.sin(ang) * 6); ctx.lineTo(Math.cos(ang) * 17, Math.sin(ang) * 12 + 3); ctx.stroke(); }
    circ(ctx, 0, -2, 3.5, '#2a0a12'); circ(ctx, 0, -2, 2, 'rgba(57,255,20,' + (0.5 + 0.5 * Math.sin(t * 6)) + ')');
    ctx.fillStyle = c; circ(ctx, 8, -8, 2.2, c); circ(ctx, -8, -8, 2.2, c);
  };
  S.dropship_insect = function (ctx, c, a, m, atk, t) {   // surveillant volant : sac gonflé, tentacules qui ondulent
    const b = 1 + 0.05 * Math.sin(t * 3);
    for (let i = 0; i < 4; i++) { const y = -9 + i * 6, ph = t * 5 + i; ctx.strokeStyle = '#8a3a4e'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-10, y); ctx.quadraticCurveTo(-18, y + Math.sin(ph) * 3, -24, y + Math.sin(ph + 1) * 4); ctx.stroke(); }
    ell(ctx, 0, 0, 18 * b, 11 * b, '#9c4a62', '#3a1020', 1.5);
    ell(ctx, 4, -3, 10, 5, '#b86a82');
    ctx.fillStyle = c; for (const [x, y] of [[-8, 0], [0, 6], [8, 2]]) circ(ctx, x, y, 2.3, c);
    circ(ctx, 11, 0, 3.2, '#2a0a12', '#120408', 1); circ(ctx, 12, -0.5, 1.4, '#ffd14a');
    spike(ctx, -14, -8, -2.2, 6, 2, '#e9d8c2'); spike(ctx, -14, 8, 2.2, 6, 2, '#e9d8c2');
  };

  // --- Guerriers d'énergie : or, cristal et champs bleutés
  S.bunker_energy = function (ctx, c, a, m, atk, t) {
    ctx.fillStyle = '#b8912e'; ctx.strokeStyle = '#4a3a10'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const ang = i * TAU / 6; ctx.lineTo(Math.cos(ang) * 24, Math.sin(ang) * 19); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e2c05a'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const ang = i * TAU / 6; ctx.lineTo(Math.cos(ang) * 17, Math.sin(ang) * 13); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = c; for (let i = 0; i < 3; i++) { const ang = i * TAU / 3 + TAU / 12; ctx.fillRect(Math.cos(ang) * 19 - 2, Math.sin(ang) * 14 - 2, 4, 4); }
    const h = 6 + 2 * Math.sin(t * 2);
    glow(ctx, 0, -h, 13, 'rgba(90,180,255,0.45)');
    ctx.fillStyle = '#9fe0ff'; ctx.strokeStyle = '#2a6ab0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -h - 11); ctx.lineTo(6, -h); ctx.lineTo(0, -h + 8); ctx.lineTo(-6, -h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,200,255,' + (0.3 + 0.3 * Math.sin(t * 4)) + ')'; ctx.lineWidth = 1.5; ell(ctx, 0, 2, 21, 15, null, ctx.strokeStyle, 1.5);
  };
  S.hq_energy = function (ctx, c, a, m, atk, t) {
    ctx.fillStyle = '#a8862a'; ctx.strokeStyle = '#3a2c0c'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-34, 14); ctx.lineTo(-22, -24); ctx.lineTo(22, -24); ctx.lineTo(34, 14); ctx.lineTo(0, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e2c05a'; ctx.beginPath(); ctx.moveTo(-24, 10); ctx.lineTo(-15, -17); ctx.lineTo(15, -17); ctx.lineTo(24, 10); ctx.lineTo(0, 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c; ctx.fillRect(-20, -22, 10, 4); ctx.fillRect(10, -22, 10, 4); ctx.fillRect(-6, 20, 12, 4);
    for (let i = 0; i < 4; i++) { const ang = t * 1.2 + i * TAU / 4, r = 20; ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); const x = Math.cos(ang) * r, y = -2 + Math.sin(ang) * r * 0.6; ctx.moveTo(x, y - 6); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill(); }
    const h = 8 + 2 * Math.sin(t * 2);
    glow(ctx, 0, -h, 20, 'rgba(90,180,255,0.5)');
    circ(ctx, 0, -h, 9, '#cfeeff', '#2a6ab0', 1.5); circ(ctx, -3, -h - 3, 3, 'rgba(255,255,255,0.8)');
    ctx.strokeStyle = 'rgba(120,200,255,' + (0.35 + 0.3 * Math.sin(t * 3)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -h + 9); ctx.lineTo(0, 12); ctx.stroke();
  };
  S.extractor_energy = function (ctx, c, a, m, atk, t) {
    ell(ctx, 0, 5, 17, 11, '#a8862a', '#3a2c0c', 2); ell(ctx, 0, 4, 11, 7, '#e2c05a');
    ctx.fillStyle = c; ctx.fillRect(-13, 2, 4, 4); ctx.fillRect(9, 2, 4, 4);
    const h = 10 + 2 * Math.sin(t * 2.5);
    ctx.strokeStyle = 'rgba(57,255,20,' + (0.4 + 0.4 * Math.sin(t * 8)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -h + 6); ctx.stroke();
    ctx.save(); ctx.translate(0, -h); ctx.rotate(a * 0.5);
    ctx.fillStyle = '#9fe0ff'; ctx.strokeStyle = '#2a6ab0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 0); ctx.lineTo(0, 9); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore(); glow(ctx, 0, -h, 11, 'rgba(90,180,255,0.4)');
  };
  S.dropship_energy = function (ctx, c, a, m, atk, t) {   // navette : coque dorée effilée, anneau d'énergie
    ctx.fillStyle = '#c9a33a'; ctx.strokeStyle = '#3a2c0c'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(2, -9); ctx.lineTo(-16, -6); ctx.lineTo(-20, 0); ctx.lineTo(-16, 6); ctx.lineTo(2, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8cf6a'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(2, -5); ctx.lineTo(-12, -3); ctx.lineTo(-12, 3); ctx.lineTo(2, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c; ctx.fillRect(-10, -8, 8, 2.5); ctx.fillRect(-10, 5.5, 8, 2.5);
    ctx.strokeStyle = 'rgba(120,200,255,' + (0.5 + 0.4 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 2; ell(ctx, -6, 0, 6, 11, null, ctx.strokeStyle, 2);
    ell(ctx, 8, 0, 4, 3, '#9fe0ff', '#2a6ab0', 1);
    glow(ctx, -20, 0, 7, 'rgba(120,200,255,0.6)');
  };

  // --- Mécas cybernétiques : acier sombre, voyants, antennes et rotors
  S.bunker_mecha = function (ctx, c, a, m, atk, t) {
    ctx.fillStyle = '#2b3038'; ctx.strokeStyle = '#0c0e12'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * TAU / 8 + TAU / 16; ctx.lineTo(Math.cos(ang) * 25, Math.sin(ang) * 20); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a525e'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * TAU / 8 + TAU / 16; ctx.lineTo(Math.cos(ang) * 18, Math.sin(ang) * 14); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1a1e24'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const ang = i * TAU / 4 + TAU / 8; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 18, Math.sin(ang) * 14); ctx.lineTo(Math.cos(ang) * 25, Math.sin(ang) * 20); ctx.stroke(); }
    ctx.fillStyle = c; ctx.fillRect(-22, -3, 5, 6); ctx.fillRect(17, -3, 5, 6);
    circ(ctx, 0, 0, 9, '#20242b', '#0c0e12', 1.5);
    ctx.save(); ctx.rotate(t * 1.5); ctx.strokeStyle = '#9fb0c4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, 0); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 4; i++) { const on = ((t * 3 + i) % 4) < 1; circ(ctx, -12 + i * 8, 15, 1.8, on ? '#ff5a3a' : '#5a2a22'); }
    ctx.strokeStyle = '#c0c8d0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(14, -12); ctx.lineTo(20, -22); ctx.stroke(); circ(ctx, 20, -22, 2, ZC.rgba(c, 0.5 + 0.5 * Math.sin(t * 4)));
  };
  S.hq_mecha = function (ctx, c, a, m, atk, t) {
    roundRect(ctx, -34, -28, 68, 56, 3); ctx.fillStyle = '#23272e'; ctx.fill(); ctx.strokeStyle = '#0c0e12'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#3d454f'; ctx.fillRect(-30, -24, 60, 48);
    ctx.fillStyle = '#596270'; ctx.fillRect(-30, -24, 60, 6); ctx.fillRect(-30, 18, 60, 6);
    ctx.strokeStyle = '#1a1e24'; ctx.lineWidth = 1; for (let i = -24; i <= 24; i += 12) { ctx.beginPath(); ctx.moveTo(i, -18); ctx.lineTo(i, 18); ctx.stroke(); }
    for (let i = 0; i < 3; i++) { circ(ctx, -22 + i * 9, -12, 3.5, '#2b3038', '#0c0e12', 1); const sm = (t * 0.7 + i * 0.4) % 1; circ(ctx, -22 + i * 9 + sm * 4, -16 - sm * 10, 2 + sm * 3, 'rgba(160,170,180,' + (0.35 * (1 - sm)) + ')'); }
    ctx.fillStyle = c; ctx.fillRect(-33, -27, 12, 4); ctx.fillRect(21, -27, 12, 4); ctx.fillRect(-33, 23, 12, 4); ctx.fillRect(21, 23, 12, 4);
    roundRect(ctx, -12, -6, 24, 16, 2); ctx.fillStyle = '#20242b'; ctx.fill(); ctx.strokeStyle = '#9fb0c4'; ctx.lineWidth = 1; ctx.stroke();
    for (let i = 0; i < 6; i++) { const on = ((t * 4 + i * 0.7) % 3) < 1; ctx.fillStyle = on ? '#4fff6a' : '#1e3a24'; ctx.fillRect(-9 + i * 3.5, -3, 2, 2); }
    ctx.fillStyle = '#4fb8ff'; ctx.fillRect(-9, 2, 18 * (0.5 + 0.5 * Math.sin(t)), 3);
    ctx.save(); ctx.translate(18, 2); ctx.rotate(t * 0.9); ctx.strokeStyle = '#c0c8d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 7, -1.2, 1.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, 0); ctx.stroke(); ctx.restore();
    circ(ctx, 18, 2, 2, '#596270');
  };
  S.extractor_mecha = function (ctx, c, a, m, atk, t) {
    roundRect(ctx, -16, -4, 32, 16, 3); ctx.fillStyle = '#23272e'; ctx.fill(); ctx.strokeStyle = '#0c0e12'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#3d454f'; ctx.fillRect(-13, -2, 26, 11);
    ctx.fillStyle = c; ctx.fillRect(-14, 0, 3, 6); ctx.fillRect(11, 0, 3, 6);
    ctx.fillStyle = '#596270'; ctx.fillRect(-6, -16, 12, 13); ctx.strokeStyle = '#14171c'; ctx.lineWidth = 1; ctx.strokeRect(-6, -16, 12, 13);
    ctx.save(); ctx.translate(0, -8); ctx.rotate(a * 1.5); ctx.strokeStyle = '#c8d0d8'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, 0); ctx.stroke(); } ctx.restore();
    circ(ctx, 0, -8, 2.5, '#20242b');
    const bl = (Math.sin(t * 6) + 1) / 2; for (let i = 0; i < 3; i++) circ(ctx, -8 + i * 8, 12, 1.6, i / 3 < bl ? '#39ff14' : '#1e3a24');
  };
  S.dropship_mecha = function (ctx, c, a, m, atk, t) {   // drone quadrirotor avec nacelle
    ctx.strokeStyle = '#20242b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.moveTo(-12, 12); ctx.lineTo(12, -12); ctx.stroke();
    for (const [x, y] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
      circ(ctx, x, y, 7.5, 'rgba(180,190,200,0.22)'); ctx.save(); ctx.translate(x, y); ctx.rotate(t * 40 + x); ctx.strokeStyle = 'rgba(220,228,236,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); ctx.restore();
      circ(ctx, x, y, 2, '#596270', '#0c0e12', 1);
    }
    roundRect(ctx, -10, -7, 20, 14, 3); ctx.fillStyle = '#3d454f'; ctx.fill(); ctx.strokeStyle = '#0c0e12'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = c; ctx.fillRect(-7, -4, 14, 3);
    roundRect(ctx, -7, 3, 14, 7, 2); ctx.fillStyle = '#23272e'; ctx.fill();
    circ(ctx, 7, 0, 2.5, '#4fb8ff', '#0c0e12', 1);
    circ(ctx, -8, 0, 1.6, ((t * 3) % 1) < 0.5 ? '#ff5a3a' : '#5a2a22');
  };

  // facing : angle de l'unité (le contexte est déjà tourné d'autant ; les sprites de la feuille s'en servent pour se remettre droits)
  // death : progression 0..1 de l'animation de mort (cadavre), sinon undefined
  // race : race du propriétaire, pour les variantes de bâtiments et de dropship
  ZC.drawUnitSprite = function (ctx, type, color, anim, moving, atk, t, up, facing, death, race) {
    const def = ZC.UNITS[type];
    const base = def && def.hero ? def.base : type;
    const w = up ? up.weapons | 0 : 0, ar = up ? up.armor | 0 : 0;
    if (def && def.hero && death === undefined) { // anneau doré pulsant du héros
      ctx.save(); if (facing !== undefined) ctx.rotate(-facing);
      const r = def.radius + 6 + Math.sin((t || 0) * 5) * 1.5;
      ctx.strokeStyle = 'rgba(255,208,64,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, def.radius * 0.6, r, r * 0.5, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,160,0.35)'; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
    const fn = (race && S[base + '_' + race]) || S[base];
    if (fn) { fn(ctx, color, anim, moving, atk, t || 0, facing); return; }
    const spec = SPEC[base];
    if (spec && sheet.ready) { sheetUnit(ctx, spec, color, anim, moving, atk, facing, w, ar, death, t); return; }
    if (facing !== undefined && death !== undefined) ctx.rotate(-facing);
    fallback(ctx, color, def, atk);
  };

  // Portrait d'un personnage de l'aventure (canvas carré, taille s). key = nom de cadre, tint = voile coloré optionnel
  ZC.drawCharPortrait = function (ctx, key, s, tint) {
    const g = ctx.createLinearGradient(0, 0, 0, s); g.addColorStop(0, '#1a2230'); g.addColorStop(1, '#0a0d12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    ctx.save(); ctx.translate(s / 2, s / 2);
    if (sheet.ready && sheet.frames[key]) {
      const f = sheet.frames[key], k = (s * 0.86) / Math.max(f.bw, f.bh);
      ctx.drawImage(sheet.img, f.x, f.y, f.w, f.h, -(f.bx + f.bw / 2) * k, -(f.by + f.bh / 2) * k, f.w * k, f.h * k);
      if (tint) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = tint; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.globalCompositeOperation = 'source-over'; }
    } else circ(ctx, 0, 0, s * 0.3, '#6c727c', '#2a2e35', 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; for (let y = 0; y < s; y += 4) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(s, y + 0.5); ctx.stroke(); }
  };
})(window.ZC);
