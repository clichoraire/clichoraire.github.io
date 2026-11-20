// Goblin Malin — boss : chaque chef ennemi a deux attaques spéciales annoncées au sol (zone rouge qui se remplit). On les évite en sortant de la zone à temps.
'use strict';
(function (CG) {
  const G = CG.G, B = CG.Boss = {}, TAU = Math.PI * 2, SQ = 0.75; // SQ : les zones sont des ovales aplatis, comme le sol vu de haut
  const rand = CG.rand, pick = CG.pick;
  B.KIT = { capitaine: ['charge', 'tourbillon'], troll: ['ecrase', 'rocher'], seigneur: ['pluie', 'nova', 'souffle', 'deluge', 'croix'] };
  const NOM = { charge: 'Charge !', tourbillon: 'Tourbillon d\'acier !', ecrase: 'Écrase-tout !', rocher: 'Lancer de rocher !', pluie: 'Pluie de feu !', nova: 'Anneau infernal !', souffle: 'Souffle de feu !', deluge: 'Déluge infernal !', croix: 'Croix de flammes !' };
  const zones = () => CG.R.zones || (CG.R.zones = []);
  const inC = (z, o) => Math.hypot(o.x - z.x, (o.y - z.y) / SQ);
  function inside(z, o) {
    if (z.k === 'ligne') { const dx = z.x2 - z.x, dy = z.y2 - z.y, L = Math.hypot(dx, dy) || 1, u = ((o.x - z.x) * dx + (o.y - z.y) * dy) / L, v = Math.abs((o.x - z.x) * dy - (o.y - z.y) * dx) / L; return u > -10 && u < L + 10 && v < z.w / 2; }
    const d = inC(z, o); return d <= z.r && (!z.r0 || d >= z.r0);
  }
  function fire(z) {
    const S = CG.S, R = CG.R, p = S.player, e = z.by;
    if (e && (e.dead || !R.enemies.includes(e))) return; // le boss est tombé avant : l'attaque s'éteint
    if (z.k === 'ligne' && z.feu) { // il crache : une langue de feu le long de la ligne, sans bouger
      const dx = z.x2 - z.x, dy = z.y2 - z.y; for (let i = 1; i <= 12; i++) { const k = i / 12; R.parts.push({ x: z.x + dx * k + rand(-z.w / 3, z.w / 3), y: z.y + dy * k - 10 + rand(-z.w / 4, z.w / 4), vx: dx * 0.25 + rand(-30, 30), vy: dy * 0.25 - rand(10, 50), life: 0.5 + k * 0.3, max: 0.8, col: i % 3 ? '#ff8a1e' : '#ffe36b', size: 6 + k * 7, float: true }); }
      if (!z.mute) CG.sfx('fire'); if (e) e.atkAnim = 1;
    } else if (z.k === 'ligne') { // il fonce le long de la ligne
      const dx = z.x2 - z.x, dy = z.y2 - z.y; for (let i = 0; i < 14; i++) { if (!G.slide(e, dx / 14, dy / 14, 9)) break; if (i % 2 === 0) R.parts.push({ x: e.x, y: e.y - 16, vx: 0, vy: 0, life: 0.35, max: 0.35, col: z.col, size: 7, float: true }); }
      e.path = null; e.atkAnim = 1; CG.sfx('swing');
    } else { R.rings.push({ x: z.x, y: z.y, r: z.r, life: 0.45, col: z.col }); G.puff(z.x, z.y - 6, z.col, 22, 60 + z.r * 1.4, 5); CG.sfx('fire'); if (e && z.self) e.atkAnim = 1; }
    R.feuSrc = !!(z.feu || z.roc === 'feu' || (e && CG.ENEMIES[e.type] && CG.ENEMIES[e.type].race === 'demon')); // du feu : le sort Peau de salamandre en protège
    if (R.ko <= 0 && inside(z, p)) G.hurtPlayer(z.dmg);
    for (const g of S.goblins.slice()) if (!g.hidden && !g.perch && inside(z, g)) G.hurtGoblin(g, z.dmg * 0.5);
    R.feuSrc = false;
    for (const a of S.pets) if (!a.ko && !a.ridden && inside(z, a)) CG.P.hurt(a, z.dmg * 0.6);
    if (R.golem && !R.golem.dead && inside(z, R.golem)) CG.Magie.hurt(R.golem, z.dmg * 0.7);
  }
  function cast(e, name) {
    const R = CG.R, p = CG.S.player, Z = zones(), dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, col = { capitaine: '#ffd23a', troll: '#c9a56b', seigneur: '#ff5a2a' }[e.type] || CG.ENEMIES[e.type].zcol || '#ff5a2a';
    const z = o => { const q = Object.assign({ k: 'cercle', by: e, col, max: o.t }, o); Z.push(q); return q; };
    let hold = 1;
    if (name === 'tourbillon') { if (d > 150) return false; z({ x: e.x, y: e.y, r: 100, t: 1.0, dmg: e.dmg * 1.8, self: true }); hold = 1.1; }
    else if (name === 'charge') { if (d < 90 || d > 360) return false; const L = Math.min(330, d + 110); z({ k: 'ligne', x: e.x, y: e.y, x2: e.x + dx / d * L, y2: e.y + dy / d * L, w: 50, t: 0.95, dmg: e.dmg * 2 }); hold = 1.2; e.face = dx > 0 ? 1 : -1; }
    else if (name === 'ecrase') { if (d > 170) return false; z({ x: e.x, y: e.y, r: 125, t: 1.25, dmg: e.dmg * 2, self: true }); hold = 1.4; }
    else if (name === 'rocher') { if (d < 100 || d > 440) return false; z({ x: p.x, y: p.y, r: 72, t: 1.35, dmg: e.dmg * 1.7, roc: true }); hold = 0.9; }
    else if (name === 'pluie') { if (d > 460) return false; for (let i = 0; i < 6; i++) { const a = Math.random() * TAU, r = i ? rand(60, 150) : 0; z({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * SQ, r: 56, t: 1.0 + i * 0.28, dmg: e.dmg * 1.3, roc: 'feu' }); } hold = 1.2; }
    else if (name === 'souffle') { // un éventail de trois langues de feu vers toi
      if (d > 330) return false; const a0 = Math.atan2(dy, dx), L = 310; [-0.42, 0, 0.42].forEach((da, i) => z({ k: 'ligne', feu: true, mute: i > 0, x: e.x, y: e.y, x2: e.x + Math.cos(a0 + da) * L, y2: e.y + Math.sin(a0 + da) * L, w: 78, t: 1.05, dmg: e.dmg * 1.6 })); hold = 1.3; e.face = dx > 0 ? 1 : -1; }
    else if (name === 'croix') { // des flammes dans toutes les directions autour de lui ; enragé, il en ajoute en diagonale
      if (d > 300) return false; const n = e.hp < e.maxhp * 0.4 ? 8 : 4, a0 = Math.random() * TAU, L = 330; for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; z({ k: 'ligne', feu: true, mute: i > 0, x: e.x, y: e.y, x2: e.x + Math.cos(a) * L, y2: e.y + Math.sin(a) * L * SQ, w: 64, t: 1.25, dmg: e.dmg * 1.6 }); } hold = 1.5; }
    else if (name === 'deluge') { // le ciel s'embrase : des flammes tombent partout autour, par vagues
      if (d > 520) return false; const n = e.hp < e.maxhp * 0.4 ? 22 : 16; for (let i = 0; i < n; i++) { const a = i * 2.4 + Math.random() * 0.8, r = 40 + Math.sqrt(i / n) * 330; z({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * SQ, r: 52, t: 1.1 + (i % 6) * 0.42 + Math.random() * 0.2, dmg: e.dmg * 1.3, roc: 'feu' }); } z({ x: p.x, y: p.y, r: 52, t: 1.2, dmg: e.dmg * 1.3, roc: 'feu' }); hold = 1.6; }
    else if (name === 'nova') { if (d > 230) return false; z({ x: e.x, y: e.y, r: 185, r0: 62, t: 1.3, dmg: e.dmg * 1.7, self: true }); hold = 1.4; } // tout près de lui, on est à l'abri
    e.rooted = Math.max(e.rooted, hold); e.atkCd = Math.max(e.atkCd, hold + 0.2); e.path = null;
    G.text(e.x, e.y - 96, '⚠ ' + NOM[name], '#ffd0a0', true); CG.sfx('warning'); return true;
  }
  B.step = function (e, dt) {
    const R = CG.R, p = CG.S.player, kit = B.KIT[e.type]; if (!kit) return;
    e.bcd = (e.bcd === undefined ? 3.5 : e.bcd) - dt;
    if (e.bcd > 0 || e.retreat || e.fear > 0 || e.daze > 0 || R.ko > 0) return;
    if (Math.hypot(p.x - e.x, p.y - e.y) > 470) { e.bcd = 0.6; return; }
    const order = CG.shuffle(kit.slice()).sort((a, b) => (a === e.lastB) - (b === e.lastB)); // jamais deux fois de suite la même, si possible
    e.bcd = order.some(n => cast(e, n) && ((e.lastB = n), true)) ? (e.type === 'seigneur' ? rand(3.6, 5) : CG.ENEMIES[e.type].cadence ? rand(CG.ENEMIES[e.type].cadence[0], CG.ENEMIES[e.type].cadence[1]) : rand(5, 7)) * (e.hp < e.maxhp * 0.4 ? 0.7 : 1) : 0.7; // blessé, il s'énerve
  };
  const up0 = G.update;
  G.update = function (dt) {
    up0(dt);
    const R = CG.R, Z = zones();
    for (const e of R.enemies) if (!e.dead && CG.ENEMIES[e.type].boss) B.step(e, dt);
    for (const z of Z) { z.t -= dt; if (z.t <= 0) fire(z); }
    if (Z.length) R.zones = Z.filter(z => z.t > 0);
  };
  // les chefs laissent toujours un parchemin (un sort que tu n'as pas encore, s'il en reste)
  B.loot = function (e) { const id = G.newScroll(); if (id) G.drop(e.x, e.y, { kind: 'scroll', id }); else G.dropRes(e.x, e.y, 'or', 60); };

  // ---------- dessin ----------
  B.ground = function (g, t) {
    const Z = CG.R.zones; if (!Z || !Z.length) return;
    for (const z of Z) {
      const f = 1 - Math.max(0, z.t) / z.max, wait = z.max > 1.6 && z.t > 1.1; if (wait) continue; // les dernières flammes de la pluie n'apparaissent qu'une seconde avant
      g.save();
      if (z.k === 'ligne') {
        const dx = z.x2 - z.x, dy = z.y2 - z.y, L = Math.hypot(dx, dy); g.translate(z.x, z.y); g.rotate(Math.atan2(dy, dx));
        g.fillStyle = 'rgba(255,40,30,0.2)'; g.fillRect(0, -z.w / 2, L, z.w); g.fillStyle = 'rgba(255,60,30,0.42)'; g.fillRect(0, -z.w / 2, L * f, z.w);
        g.strokeStyle = 'rgba(255,220,200,0.9)'; g.lineWidth = 2; g.strokeRect(0, -z.w / 2, L, z.w);
      } else {
        g.translate(z.x, z.y); g.scale(1, SQ);
        g.beginPath(); g.arc(0, 0, z.r, 0, TAU); if (z.r0) g.arc(0, 0, z.r0, 0, TAU, true); g.fillStyle = 'rgba(255,40,30,0.2)'; g.fill();
        const rf = z.r0 ? z.r0 + (z.r - z.r0) * f : z.r * f; g.beginPath(); g.arc(0, 0, rf, 0, TAU); if (z.r0) g.arc(0, 0, z.r0, 0, TAU, true); g.fillStyle = 'rgba(255,60,30,0.4)'; g.fill();
        g.strokeStyle = 'rgba(255,220,200,' + (0.7 + Math.sin(t * 18) * 0.25) + ')'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, z.r, 0, TAU); g.stroke(); if (z.r0) { g.beginPath(); g.arc(0, 0, z.r0, 0, TAU); g.stroke(); }
      }
      g.restore();
    }
  };
  // ce qui tombe du ciel (rocher du troll, flammes du seigneur), dessiné par-dessus les personnages
  B.sky = function (g, t) {
    const Z = CG.R.zones; if (!Z) return;
    for (const z of Z) { if (!z.roc || z.t > 0.55) continue; const k = z.t / 0.55, y = z.y - 12 - k * 420;
      if (z.roc === 'feu') { g.fillStyle = '#ff5a2a'; g.beginPath(); g.arc(z.x, y, 13, 0, TAU); g.fill(); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(z.x, y, 7, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,120,40,0.35)'; g.fillRect(z.x - 5, y - 60, 10, 60); }
      else { g.fillStyle = '#6e5236'; g.beginPath(); g.arc(z.x, y, 24, 0, TAU); g.fill(); g.fillStyle = '#96764f'; g.beginPath(); g.arc(z.x - 5, y - 6, 15, 0, TAU); g.fill(); }
    }
  };
  // grande barre de vie en haut de l'écran
  B.hud = function (g, vw, vh) {
    const R = CG.R; let e = null; for (const o of R.enemies) if (!o.dead && CG.ENEMIES[o.type].boss && CG.onScreen(o.x, o.y)) { e = o; break; } if (!e || R.death) return;
    const w = Math.min(460, vw * 0.4), x = (vw - w) / 2, y = vh - 34, f = Math.max(0, e.hp / e.maxhp);
    g.fillStyle = 'rgba(20,8,6,0.85)'; g.fillRect(x - 4, y - 4, w + 8, 22); g.fillStyle = '#3a1410'; g.fillRect(x, y, w, 14);
    const gr = g.createLinearGradient(0, y, 0, y + 14); gr.addColorStop(0, '#ff7a5a'); gr.addColorStop(1, '#b8201a'); g.fillStyle = gr; g.fillRect(x, y, w * f, 14);
    g.strokeStyle = '#e8b040'; g.lineWidth = 2; g.strokeRect(x - 4, y - 4, w + 8, 22);
    g.font = 'bold 15px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.fillStyle = '#ffe9a8';
    const nom = '☠ ' + CG.ENEMIES[e.type].nom + ' ☠'; g.strokeText(nom, vw / 2, y - 10); g.fillText(nom, vw / 2, y - 10);
  };
})(window.CG);
