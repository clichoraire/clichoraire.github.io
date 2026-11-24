// Goblin Malin — l'effet visuel du lancer de chaque sort. Chaque sort appartient à une famille (feu, glace, foudre, nature, poison,
//   ombre, lumière, terre, vent, arcane). Au lancer : un cercle magique tourne sous le chef, une gerbe propre à la famille l'entoure,
//   et les sorts qui touchent quelqu'un à distance n'envoient plus un éclair blanc : un trait de leur couleur file jusqu'à la cible
//   et la même gerbe y éclate. Seule la famille « foudre » garde de vrais éclairs. Tout se règle dans CG.SortsVisuel.
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2;
  // durées en secondes : cercle au sol, gerbe autour du chef, trait vers la cible ; TAILLE grossit ou réduit tout
  const Sv = CG.SortsVisuel = { CERCLE: 0.8, GERBE: 0.95, LIEN: 0.3, TAILLE: 1, GROS: 1.3, /* la gerbe seule */ MAX: 24 };
  const F = Sv.FAM = {};
  const fam = (f, l) => l.split(' ').forEach(id => { F[id] = f; });
  fam('feu', 'feu murfeu meteore parefeu bombe armFeu metaDemon cri force frenesie inv_feu inv_demon');
  fam('glace', 'glace verglas armGlace inv_eau');
  fam('foudre', 'etincelle eclair electro paralysie rayon rayons');
  fam('nature', 'racines repousse armRonces soin antidote coeur cigogne');
  fam('poison', 'poison venin armPoison murpoison');
  fam('ombre', 'invisible ombres illusion faiblesse tetevide maladroit vampmana invoc inv_squelette inv_chevalier metaSquelette metaLoup');
  fam('lumiere', 'vision faucon flair resurrection bouclier protec miroir');
  fam('terre', 'golem murpierre seisme coffrepiege metaOurs batisseur inv_terre');
  fam('vent', 'hate onde armVent passe inv_air');
  // tout le reste (téléportation, temps, charme, berceuse, caboche…) : arcane
  Sv.famille = id => F[String(id).replace(/_\d$/, '')] || 'arcane';
  // n° de branches de l'étoile du cercle, et seconde couleur de la famille
  const STYLE = { feu: [3, '#ffe36b'], glace: [6, '#f0fbff'], foudre: [4, '#ffffff'], nature: [5, '#d8ffb0'], poison: [3, '#b070e0'], ombre: [7, '#4a2a78'], lumiere: [8, '#fffbe0'], terre: [4, '#f0dcae'], vent: [0, '#ffffff'], arcane: [5, '#ffffff'] };
  const h = (s, i, j) => { const v = Math.sin(s * 12.9898 + i * 78.233 + (j || 0) * 37.719) * 43758.5453; return v - Math.floor(v); };
  const liste = () => { const R = CG.R; return R.svFx || (R.svFx = []); };

  // ---------- au lancer ----------
  const c0 = G.cast;
  G.cast = function (id) {
    const S = CG.S, R = CG.R; if (!S || !R || !R.bolts) return c0.apply(this, arguments);
    const p = S.player, mp = p.mp, nb = R.bolts.length, an = R.castAnim || 0, avant = new Set(R.bolts), r = c0.apply(this, arguments);
    if (!(p.mp < mp - 0.01) && !(R.castAnim > an && R.castAnim > 0.9)) return r; // rien n'est parti (pas de mana, pas de cible, visée en cours)
    const b = String(id).replace(/_\d$/, ''), f = Sv.famille(b), col = (CG.SPELLS[b] || CG.SPELLS[id] || {}).color || '#c8b8ff', L = liste(), seed = Math.random() * 99;
    L.push({ k: 'cercle', f, col, t0: R.t, seed, suit: true, x: p.x, y: p.y }, { k: 'gerbe', f, col, t0: R.t, seed, suit: true, x: p.x, y: p.y, e: 1 });
    for (const q of R.bolts.slice()) { if (avant.has(q)) continue;
      if (f === 'foudre') { q.col = col; continue; }
      R.bolts.splice(R.bolts.indexOf(q), 1); // plus d'éclair : un trait de la couleur du sort, et la gerbe sur la cible
      L.push({ k: 'lien', f, col, t0: R.t, seed: seed + 1, x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2 }, { k: 'gerbe', f, col, t0: R.t + Sv.LIEN * 0.55, seed: seed + 2, x: q.x2, y: q.y2 + 22, e: 0.8 }); }
    if (L.length > Sv.MAX) L.splice(0, L.length - Sv.MAX);
    return r;
  };
  const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); const R = CG.R; if (!R || !R.svFx || !R.svFx.length) return; const D = { cercle: Sv.CERCLE, gerbe: Sv.GERBE, lien: Sv.LIEN + 0.15 }; R.svFx = R.svFx.filter(q => R.t - q.t0 < D[q.k]); };

  // ---------- le cercle magique, à plat sous le chef ----------
  function cercle(g, q, k, t) {
    const st = STYLE[q.f], n = st[0], r = (14 + 30 * (1 - Math.pow(1 - Math.min(1, k * 2.2), 3))) * Sv.TAILLE, a = k < 0.15 ? k / 0.15 : Math.max(0, 1 - (k - 0.15) / 0.85);
    g.save(); g.translate(q.x, q.y + 2); g.scale(1, 0.46); g.rotate(q.seed + k * 2.4);
    g.globalAlpha = a * 0.16; g.fillStyle = q.col; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.globalAlpha = a * 0.9; g.strokeStyle = q.col; g.lineWidth = 2.6; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.lineWidth = 1.3; g.beginPath(); g.arc(0, 0, r * 0.74, 0, TAU); g.stroke();
    g.strokeStyle = st[1]; g.globalAlpha = a * 0.85; g.lineWidth = 1.5;
    if (n) { const pas = n % 2 ? 2 : n === 4 ? 1 : 2, tours = n % 2 || n === 4 ? 1 : 2; // étoile tracée d'un trait (ou deux polygones croisés)
      for (let u = 0; u < tours; u++) { g.beginPath(); for (let i = 0; i <= n; i++) { const an = (i * pas + u) / n * TAU; i ? g.lineTo(Math.cos(an) * r * 0.74, Math.sin(an) * r * 0.74) : g.moveTo(Math.cos(an) * r * 0.74, Math.sin(an) * r * 0.74); } g.stroke(); }
      if (n === 4) { g.rotate(TAU / 8); g.strokeRect(-r * 0.52, -r * 0.52, r * 1.04, r * 1.04); } }
    else { g.beginPath(); for (let i = 0; i < 40; i++) { const an = i / 40 * TAU * 2, rr = r * 0.74 * i / 40; i ? g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : g.moveTo(0, 0); } g.stroke(); }
    g.fillStyle = st[1]; const m = n || 6; for (let i = 0; i < m; i++) { const an = (i + 0.5) / m * TAU - k * 5; g.beginPath(); g.arc(Math.cos(an) * r * 0.87, Math.sin(an) * r * 0.87, 1.9, 0, TAU); g.fill(); }
    g.restore();
  }

  // ---------- la gerbe : une par famille, dessinée d'après l'âge (aucune particule à suivre) ----------
  const etoile = (g, x, y, r) => { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); };
  const GERBE = {
    feu(g, q, k, e) { for (let i = 0; i < 16; i++) { const d = h(q.seed, i) * 0.35, kk = (k - d) / (1 - d); if (kk <= 0 || kk >= 1) continue; const an = h(q.seed, i, 1) * TAU, x = Math.cos(an) * (8 + h(q.seed, i, 2) * 16) * e + Math.sin(kk * 9 + i) * 3, y = -6 - kk * (34 + h(q.seed, i, 3) * 44) * e, r = (1 - kk) * (4 + h(q.seed, i, 4) * 4.5) * e;
      g.globalAlpha = Math.min(1, (1 - kk) * 1.6); g.fillStyle = kk < 0.35 ? '#ffb02a' : kk < 0.7 ? '#ff6a1e' : '#c8321e'; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x - r * 0.9, y - r * 1.5, x, y - r * 2.6); g.quadraticCurveTo(x + r * 0.9, y - r * 1.5, x + r, y); g.arc(x, y, r, 0, Math.PI); g.fill();
      g.fillStyle = '#fff2a8'; g.beginPath(); g.arc(x, y - r * 0.2, r * 0.45, 0, TAU); g.fill(); } },
    glace(g, q, k, e) { g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + q.seed, rr = (12 + (1 - Math.pow(1 - k, 2)) * (30 + h(q.seed, i) * 26)) * e, x = Math.cos(an) * rr, y = -22 * e + Math.sin(an) * rr * 0.6 + k * k * 14, s = (3.5 + h(q.seed, i, 1) * 4) * e * (1 - k * 0.4), rot = k * 2 + i;
      g.globalAlpha = Math.min(1, (1 - k) * 1.8); g.strokeStyle = i % 2 ? '#f0fbff' : q.col; g.lineWidth = 1.6; g.beginPath(); for (let b = 0; b < 3; b++) { const a2 = rot + b * Math.PI / 3; g.moveTo(x - Math.cos(a2) * s, y - Math.sin(a2) * s); g.lineTo(x + Math.cos(a2) * s, y + Math.sin(a2) * s); } g.stroke(); } },
    foudre(g, q, k, e, t) { const pas = Math.floor(t * 22); g.lineCap = 'round'; for (let i = 0; i < 5; i++) { if (h(q.seed + pas, i) < 0.3) continue; const an = h(q.seed + pas, i, 1) * TAU, r0 = 8 * e, r1 = (26 + h(q.seed + pas, i, 2) * 20) * e; g.beginPath(); for (let s = 0; s <= 4; s++) { const rr = r0 + (r1 - r0) * s / 4, a2 = an + (h(q.seed + pas, i, 3 + s) - 0.5) * 0.9; const x = Math.cos(a2) * rr, y = -22 * e + Math.sin(a2) * rr * 0.8; s ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.globalAlpha = (1 - k) * 0.5; g.strokeStyle = q.col; g.lineWidth = 5; g.stroke(); g.globalAlpha = 1 - k; g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.stroke(); } },
    nature(g, q, k, e) { for (let i = 0; i < 11; i++) { const d = h(q.seed, i) * 0.3, kk = (k - d) / (1 - d); if (kk <= 0 || kk >= 1) continue; const an = h(q.seed, i, 1) * TAU + kk * 4.5, rr = (16 + h(q.seed, i, 2) * 12 + kk * 8) * e, x = Math.cos(an) * rr, y = -4 - kk * (50 + h(q.seed, i, 3) * 24) * e + Math.sin(an) * 5;
      g.globalAlpha = Math.min(1, (1 - kk) * 2, kk * 6); g.fillStyle = i % 3 === 0 ? '#d8ffb0' : i % 3 === 1 ? q.col : '#3f9a26'; g.beginPath(); g.ellipse(x, y, 5.2 * e, 2.3 * e, an * 1.7, 0, TAU); g.fill(); } },
    poison(g, q, k, e) { for (let i = 0; i < 11; i++) { const d = h(q.seed, i) * 0.35, kk = (k - d) / (1 - d); if (kk <= 0 || kk >= 1) continue; const an = h(q.seed, i, 1) * TAU, x = Math.cos(an) * (10 + h(q.seed, i, 2) * 16) * e + Math.sin(kk * 7 + i) * 3, y = -2 - kk * (48 + h(q.seed, i, 3) * 20) * e, r = (2.6 + h(q.seed, i, 4) * 3.4) * e * (0.6 + kk * 0.6), a = Math.min(1, (1 - kk) * 3, kk * 8);
      g.globalAlpha = a * 0.5; g.fillStyle = '#58c832'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = a * 0.9; g.strokeStyle = i % 4 ? '#2f7a1e' : '#8a4ac8'; g.lineWidth = 1.1; g.stroke(); g.fillStyle = '#f4ffe0'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.4, Math.max(0.7, r * 0.2), 0, TAU); g.fill(); } },
    ombre(g, q, k, e) { for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + q.seed + k * 3.6, rr = (50 * (1 - k) + 5) * e, y0 = -22 * e - h(q.seed, i) * 14 + k * 6;
      for (let s = 0; s < 5; s++) { const a2 = an - s * 0.16, r2 = rr + s * 3; g.globalAlpha = (1 - s / 5) * Math.min(1, k * 5, (1 - k) * 3) * 0.75; g.fillStyle = s ? '#3a2060' : q.col; g.beginPath(); g.arc(Math.cos(a2) * r2, y0 + Math.sin(a2) * r2 * 0.6, (4.2 - s * 0.6) * e, 0, TAU); g.fill(); } } },
    lumiere(g, q, k, e) { const a = Math.sin(Math.PI * Math.min(1, k * 1.15)); for (let i = 0; i < 7; i++) { const x = (h(q.seed, i) - 0.5) * 44 * e, w = (2 + h(q.seed, i, 1) * 4) * e, ht = (36 + h(q.seed, i, 2) * 44) * e * Math.min(1, k * 3.2); g.globalAlpha = a * 0.38; g.fillStyle = i % 2 ? '#fffbe0' : q.col; g.beginPath(); g.moveTo(x - w, 2); g.lineTo(x + w, 2); g.lineTo(x + w * 0.35, 2 - ht); g.lineTo(x - w * 0.35, 2 - ht); g.fill(); }
      g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const d = h(q.seed, i, 5) * 0.4, kk = (k - d) / (1 - d); if (kk <= 0 || kk >= 1) continue; g.globalAlpha = Math.sin(Math.PI * kk); etoile(g, (h(q.seed, i, 6) - 0.5) * 50 * e, -8 - kk * 52 * e - h(q.seed, i, 7) * 12, (3 + h(q.seed, i, 8) * 3.5) * e); } },
    terre(g, q, k, e) { g.globalAlpha = (1 - k) * 0.4; g.fillStyle = '#c9a56b'; g.beginPath(); g.ellipse(0, 2, (16 + k * 30) * e, (6 + k * 9) * e, 0, 0, TAU); g.fill();
      for (let i = 0; i < 10; i++) { const an = h(q.seed, i) * TAU, v = (22 + h(q.seed, i, 1) * 26) * e, x = Math.cos(an) * v * k * 1.3, y = Math.sin(an) * v * k * 0.35 - Math.sin(Math.PI * Math.min(1, k * 1.25)) * (18 + h(q.seed, i, 2) * 30) * e, s = (2.6 + h(q.seed, i, 3) * 3.4) * e;
        g.globalAlpha = Math.min(1, (1 - k) * 2.5); g.fillStyle = i % 3 ? '#6e5232' : '#c8c8d2'; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s * 0.3, y - s); g.lineTo(x + s, y - s * 0.4); g.lineTo(x + s * 0.6, y + s * 0.7); g.fill(); } },
    vent(g, q, k, e) { g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const y = (-6 - i * 11 - k * 10) * e, rr = (16 + i * 3 + k * 14) * e, a0 = q.seed + i * 1.3 + k * (7 + i), long = 1.5 + Math.sin(Math.PI * k) * 1.1; g.globalAlpha = Math.sin(Math.PI * k) * 0.8; g.strokeStyle = i % 2 ? '#ffffff' : q.col; g.lineWidth = 2.2 - i * 0.2; g.beginPath(); g.ellipse(0, y, rr, rr * 0.34, 0, a0, a0 + long); g.stroke(); } },
    arcane(g, q, k, e) { for (let i = 0; i < 11; i++) { const d = h(q.seed, i) * 0.3, kk = (k - d) / (1 - d); if (kk <= 0 || kk >= 1) continue; const an = i / 11 * TAU + q.seed + kk * 5, rr = (24 - kk * 8) * e, x = Math.cos(an) * rr, y = -2 - kk * 58 * e + Math.sin(an) * rr * 0.35, s = (2.8 + h(q.seed, i, 1) * 3.6) * e * (0.6 + 0.4 * Math.sin(kk * 30 + i));
      g.globalAlpha = Math.sin(Math.PI * kk); g.fillStyle = i % 3 ? q.col : '#ffffff'; etoile(g, x, y, s); } }
  };
  function gerbe(g, q, k, t) { g.save(); g.translate(q.x, q.y); GERBE[q.f](g, q, k, (q.e || 1) * Sv.TAILLE * Sv.GROS, t); g.restore(); }

  // ---------- le trait vers la cible : une comète de la couleur du sort, sur une trajectoire un peu bombée ----------
  function lien(g, q, age) {
    const k = Math.min(1, age / Sv.LIEN), fin = Math.max(0, 1 - Math.max(0, age - Sv.LIEN) / 0.15), d = Math.hypot(q.x2 - q.x1, q.y2 - q.y1), cx = (q.x1 + q.x2) / 2, cy = (q.y1 + q.y2) / 2 - Math.min(40, d * 0.18);
    const pt = u => { const v = 1 - u; return [v * v * q.x1 + 2 * v * u * cx + u * u * q.x2, v * v * q.y1 + 2 * v * u * cy + u * u * q.y2]; };
    g.save(); for (let s = 12; s >= 0; s--) { const u = k - s * 0.045; if (u < 0) continue; const P = pt(u), a = (1 - s / 13) * fin; g.globalAlpha = a * 0.75; g.fillStyle = q.f === 'ombre' && s ? '#3a2060' : q.col; g.beginPath(); g.arc(P[0] + Math.sin(u * 20 + q.seed + s) * 1.5, P[1], 5.5 * (1 - s / 15), 0, TAU); g.fill(); }
    const P = pt(k); g.globalAlpha = fin; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(P[0], P[1], 3, 0, TAU); g.fill(); g.restore();
  }

  // ---------- branchements : le cercle au sol, la gerbe parmi les personnages, le trait par-dessus ----------
  const ici = q => { if (q.suit && CG.S) { q.x = CG.S.player.x; q.y = CG.S.player.y; } };
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const R = CG.R; if (!R || !R.svFx) return; for (const q of R.svFx) if (q.k === 'cercle') { ici(q); const k = (R.t - q.t0) / Sv.CERCLE; if (k >= 0 && k < 1 && CG.onScreen(q.x, q.y)) cercle(g, q, k, t); } }; }
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R || !R.svFx) return;
    for (const q of R.svFx) if (q.k === 'gerbe') { ici(q); const k = (R.t - q.t0) / Sv.GERBE; if (k > 0 && k < 1 && CG.onScreen(q.x, q.y)) push(q.y + 4, 21, { x: q.x, y: q.y, q, draw(g, o, t) { const kk = (CG.R.t - o.q.t0) / Sv.GERBE; if (kk > 0 && kk < 1) gerbe(g, o.q, kk, t); } }, null); } }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const R = CG.R; if (!R || !R.svFx) return; for (const q of R.svFx) if (q.k === 'lien') { const age = R.t - q.t0; if (age >= 0 && age < Sv.LIEN + 0.15) lien(g, q, age); } }; }
})(window.CG);
