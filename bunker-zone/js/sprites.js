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
  };
  ZC.spriteIsImage = (type) => { const d = ZC.UNITS[type]; return sheet.ready && !!SPEC[d && d.hero ? d.base : type]; };

  // Dessine un cadre : le sprite est mis à l'échelle sur sa hauteur de référence (rh) et son sommet
  // est placé en (feet - h) pour que tous les cadres d'une unité s'alignent.
  function frame(ctx, name, h, feet, flip, alpha) {
    const f = sheet.frames[name]; if (!f) return;
    const k = h / (f.rh || f.bh || f.h);
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha *= alpha;
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(sheet.img, f.x, f.y, f.w, f.h, -(f.bx + f.bw / 2) * k, (feet - h) - f.by * k, f.w * k, f.h * k);
    ctx.restore();
  }
  // Direction (0 = est, 2 = sud, 4 = ouest, 6 = nord) à partir de l'angle de l'unité
  function dir8(facing) { return ((Math.round(facing / (Math.PI / 4)) % 8) + 8) % 8; }

  // Unité de la feuille : disque aux couleurs du joueur, pastilles d'amélioration, cadre selon l'état
  function sheetUnit(ctx, spec, c, a, m, atk, facing, w, ar, death) {
    if (facing !== undefined) ctx.rotate(-facing);
    const d = facing === undefined ? 0 : dir8(facing);
    const flip = d >= 3 && d <= 5;
    if (death !== undefined) { // cadavre : s'affaisse et s'assombrit
      ctx.save(); ctx.translate(0, spec.feet); ctx.scale(1, Math.max(0.25, 1 - death * 0.75)); ctx.translate(0, -spec.feet);
      frame(ctx, spec.idle, spec.h, spec.feet, flip, 1 - death * 0.5);
      ctx.restore();
      return;
    }
    const r = Math.max(7, spec.h * 0.32);
    ell(ctx, 0, spec.feet, r, r * 0.45, ZC.rgba(c, 0.4), c, 1);
    // pastilles : armes (jaune) à droite, armure (bleu) à gauche
    for (let i = 0; i < w; i++) circ(ctx, r + 2 + i * 3, spec.feet, 1.1, '#ffd040');
    for (let i = 0; i < ar; i++) circ(ctx, -r - 2 - i * 3, spec.feet, 1.1, '#5cc8ff');
    let name;
    if (atk > 0) name = spec.fire;
    else if (m) name = spec.walk[Math.floor(a / 1.5) % spec.walk.length];
    else name = spec.idle;
    const bob = m && (d === 2 || d === 6) ? Math.sin(a) : 0;
    frame(ctx, name, spec.h, spec.feet + bob, flip);
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
  // facing : angle de l'unité (le contexte est déjà tourné d'autant ; les sprites de la feuille s'en servent pour se remettre droits)
  // death : progression 0..1 de l'animation de mort (cadavre), sinon undefined
  ZC.drawUnitSprite = function (ctx, type, color, anim, moving, atk, t, up, facing, death) {
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
    if (S[base]) { S[base](ctx, color, anim, moving, atk, t || 0, facing); return; }
    const spec = SPEC[base];
    if (spec && sheet.ready) { sheetUnit(ctx, spec, color, anim, moving, atk, facing, w, ar, death); return; }
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
