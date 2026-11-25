// Goblin Malin — la partie de pêche. Certains jours (CHANCE), un petit ponton de bois s'avance sur un des lacs de la forêt,
// une canne à pêche posée au bout. On y va, on la prend (E)... et les poissons sortent la tête de l'eau, en grille, comme au
// jeu de la marmotte : des bleus, des mauves, des jaunes, tout gentils, et des ROUGES aux gros sourcils fâchés.
//   Le but : taper (clic ou doigt) BUT poissons rouges avant la fin de la minuterie qui s'ouvre au-dessus de la tête du chef.
//   Ils sortent par 1 à 3, restent plus ou moins longtemps selon la vague, replongent, ressortent ailleurs. Taper un gentil
//   fait perdre du temps (ERREUR). Réussi : un butin jaillit autour du chef (or, poisson, parfois une fiole, 0 à 2 objets).
//   Pendant la partie, les ennemis ne voient pas le chef et ne peuvent pas le blesser ; à l'écran, rien ne change.
// Tout est réglable dans CG.Peche.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick; if (!W || !D || !CG.Magie) return;
  const Pe = CG.Peche = { CHANCE: 0.22, JOUR: 2, ESSAIS: 3, BUT: 9, TEMPS: 30, ERREUR: 1.5, VISIBLE: [0.7, 1.45], ENTRE: 0.28, MONTE: 0.16, ROUGE: [0.85, 0.45], PAS: [[36, 26], [30, 22]], TOUCHE: 21,
    OBJETS: [0.35, 0.8], QUALITE: [0.6, 0.9] }; /* OBJETS : sous 0,35 aucun objet, sous 0,8 un seul, sinon deux ; QUALITE : sous 0,6 une étoile, sous 0,9 deux, sinon trois */
  const monde = () => (CG.Mondes && CG.Mondes.ici ? CG.Mondes.ici() : 0), eau = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return W.inMap(tx, ty) && W.tile[W.idx(tx, ty)] === W.WATER; };
  // ---------- le lac du jour : son ponton (au sud) et la grille des poissons ----------
  function plan(i) { const q = (W.ponds || [])[i]; if (!q) return null; let sy = q.y; while (sy < q.y + 6 && W.inMap(q.x, sy) && W.tile[W.idx(q.x, sy)] === W.WATER) sy++; if (sy === q.y || !W.walkTile(q.x, sy)) return null;
    const cx = q.x * T + T / 2, bord = sy * T, cy = Math.min(q.y * T + T / 2 - 8, bord - 74);
    for (const pas of Pe.PAS) { const cells = []; for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) { const x = cx + c * pas[0], y = cy + r * pas[1]; if (eau(x, y) && eau(x - 11, y) && eau(x + 11, y) && eau(x, y - 12)) cells.push({ x, y }); } if (cells.length === 9) return { cx, bord, cells, pied: { x: cx, y: bord + 14 } }; }
    return null; }
  let memo = null; const lieu = () => { const S = CG.S, J = S && S.peche; if (!J || J.day !== S.day || J.fini || monde() !== 0) return null; if (!memo || memo.i !== J.pond || memo.seed !== W.seed) memo = { i: J.pond, seed: W.seed, p: plan(J.pond) }; return memo.p; };
  Pe.lieu = lieu;
  Pe.tirer = function (force) { const S = CG.S; if (!S || monde() !== 0) return; S.peche = null; memo = null; if (!force && (S.day < Pe.JOUR || Math.random() > Pe.CHANCE)) return;
    const ok = (W.ponds || []).map((q, i) => i).filter(i => plan(i)); if (ok.length) S.peche = { day: S.day, pond: pick(ok), essais: 0 }; };
  if (D.startDay) { const sd = D.startDay; D.startDay = function () { const r = sd.apply(this, arguments); try { Pe.tirer(); } catch (e) { /* jamais bloquant */ } return r; }; }
  // ---------- prendre la canne ----------
  const jeu = () => (CG.R && CG.R.pecheJeu) || null;
  { const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S || jeu() || R.ko > 0 || R.cine || R.build || R.alarm || (it && it.type !== 'home' && it.type !== 'hut')) return it; const L = lieu(); if (!L) return it; const p = S.player;
      return Math.hypot(p.x - L.pied.x, p.y - L.pied.y) < 46 ? { type: 'peche', obj: L.pied, label: 'Prendre la canne à pêche 🎣' } : it; };
    const in0 = D.interact; D.interact = function () { if (jeu()) return; const it = D.findInteract(); if (it && it.type === 'peche') return Pe.commencer(); return in0.apply(this, arguments); }; }
  Pe.commencer = function () { const S = CG.S, R = CG.R, L = lieu(); if (!L || jeu()) return false; const p = S.player; S.peche.essais = (S.peche.essais || 0) + 1; p.face = 1; p.moving = false; if (CG.keys && CG.keys.clear) CG.keys.clear();
    R.pecheJeu = { L, t: Pe.TEMPS, pris: 0, age: 0, vague: null, pause: 0.6, sauts: [], dernier: -1 }; CG.sfx('level'); G.text(p.x, p.y - 96, '🎣 Tape les poissons rouges !', '#ffe9a8', true); return true; };
  const GENTILS = [['#3a8ee8', '#1f5cb8', '#bfe0ff'], ['#58b8f0', '#2a7cc0', '#e0f4ff'], ['#8a6ae0', '#5a3eb0', '#e0d4ff'], ['#b07ae8', '#7a48b8', '#f0e0ff'], ['#f0c838', '#c08a14', '#fff4c0'], ['#f4dc6a', '#c8a020', '#fffbe0']], ROUGE = ['#e03a2a', '#9a1a12', '#ffb0a0'];
  function vague(J) { const n = 1 + Math.floor(Math.random() * 3), libres = CG.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8].filter(c => c !== J.dernier)), dur = rand(Pe.VISIBLE[0], Pe.VISIBLE[1]), fish = [];
    for (let i = 0; i < n; i++) { const mechant = Math.random() < Pe.ROUGE[i ? 1 : 0]; fish.push({ c: libres[i], mechant, col: mechant ? ROUGE : pick(GENTILS), s: Math.random() * 10, etat: 'la', sorte: Math.floor(Math.random() * 3) }); }
    J.dernier = fish[0].c; J.vague = { fish, t: dur + Pe.MONTE, max: dur + Pe.MONTE, age: 0 }; }
  function finir(gagne) { const S = CG.S, R = CG.R, J = jeu(); if (!J) return; R.pecheJeu = null; const p = S.player;
    if (!gagne) { CG.sfx('no'); const reste = Pe.ESSAIS - (S.peche.essais || 0); G.text(p.x, p.y - 80, '🐟 Raté ! ' + J.pris + ' / ' + Pe.BUT, '#ffb0a0', true); if (reste <= 0) { S.peche.fini = true; UI.toast('🎣 Les poissons ont compris le truc : ils ne remonteront plus aujourd\'hui.'); } else UI.toast('🎣 Raté de peu. Tu peux reprendre la canne (' + reste + ' essai' + (reste > 1 ? 's' : '') + ' encore aujourd\'hui).'); return; }
    S.peche.fini = true; Pe.butin(p.x, p.y); };
  // le butin : comme après un gros monstre, en plus doux
  Pe.butin = function (x, y) { const S = CG.S, R = CG.R, Bq = CG.Banque, lvl = S.player.lvl || 1; CG.sfx('level'); CG.sfx('coffre'); G.banner('🎣 Belle pêche !', 'Les neuf grognons sont au sec. Regarde ce que le lac a recraché.', '#bfe6ff');
    for (let i = 0; i < 3; i++) R.rings.push({ x, y: y - 8, r: 50 + i * 40, life: 0.4 + i * 0.15, col: i % 2 ? '#ffe36b' : '#bfe6ff' }); G.puff(x, y - 16, '#bfe6ff', 26, 190, 4); G.puff(x, y - 16, '#ffe36b', 14, 150, 3);
    const autour = (k, n) => { const a = k / n * TAU + rand(-0.3, 0.3), d = rand(34, 78); let px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7; if (!W.walkPx(px, py)) { px = x + rand(-14, 14); py = y + rand(4, 18); } return { x: px, y: py }; };
    const tas = 6 + Math.floor(Math.random() * 5), or = 60 + lvl * 25 + Math.floor(Math.random() * 80); for (let i = 0; i < tas; i++) { const q = autour(i, tas); G.dropRes(q.x, q.y, i % 3 === 2 ? 'food' : 'or', i % 3 === 2 ? 4 + Math.floor(Math.random() * 5) : Math.max(3, Math.round(or / tas))); }
    for (let i = 0, n = Math.random() < 0.5 ? 1 : Math.random() < 0.4 ? 2 : 0; i < n; i++) { const q = autour(i + 0.5, 3); G.drop(q.x, q.y, { kind: 'potion', n: 1 }); }
    { const q = autour(0.2, 2); G.drop(q.x, q.y, { kind: 'xp', n: 20 + lvl * 8 }); }
    const k = Math.random(), nb = k < Pe.OBJETS[0] ? 0 : k < Pe.OBJETS[1] ? 1 : 2; if (!Bq || !Bq.deposer) return;
    for (let i = 0; i < nb; i++) { const u = Math.random(), n = u < Pe.QUALITE[0] ? 1 : u < Pe.QUALITE[1] ? 2 : 3, s = Math.random(); let cle = pick(['epee', 'arc', 'armure']), q = n;
      if (s < 0.18 && CG.Outils && CG.Outils.L) { cle = pick(Object.keys(CG.Outils.L)); q = 1; } else if (s < 0.3 && CG.Equipement && CG.Equipement.L) cle = pick(Object.keys(CG.Equipement.L));
      try { Bq.deposer(cle, q, 1, 'sac'); const nom = (Bq.NOMS[cle] && Bq.NOMS[cle][q]) || cle, ic = Bq.IC[cle] || '🎁'; G.text(x + (i ? 26 : -26), y - 84 - i * 18, ic + ' ' + nom + (CG.Outils && CG.Outils.L[cle] ? '' : ' ' + '★'.repeat(q)), q >= 3 ? '#8ac4ff' : q === 2 ? '#8af08a' : '#f0e4c8', true); UI.toast('🎣 Dans le filet : ' + ic + ' ' + nom + (CG.Outils && CG.Outils.L[cle] ? '' : ' ' + '★'.repeat(q)) + ' (dans ton sac).'); } catch (e) { /* jamais bloquant */ } } };
  // ---------- chaque instant ----------
  const up0 = G.update; G.update = function (dt) {
    const R0 = CG.R, J0 = R0 && R0.pecheJeu; if (J0) { R0.invis = Math.max(R0.invis || 0, 0.25); if (CG.keys && CG.keys.clear) CG.keys.clear(); } /* invisible pour les monstres ; le dessin, lui, ne change pas (main.js) */
    const r = up0.apply(this, arguments), R = CG.R, S = CG.S, J = R && R.pecheJeu; if (!J || !S) return r; const p = S.player;
    if (R.ko > 0 || R.night || R.cine || !lieu()) { R.pecheJeu = null; return r; } p.moving = false; J.age += dt; J.t -= dt;
    for (const s of J.sauts) s.t += dt; J.sauts = J.sauts.filter(s => s.t < s.max);
    if (J.t <= 0) { finir(false); return r; }
    if (!J.vague) { J.pause -= dt; if (J.pause <= 0) vague(J); return r; }
    const V = J.vague; V.t -= dt; V.age += dt; if (V.t <= 0) { J.vague = null; J.pause = Pe.ENTRE; }
    return r;
  };
  { const hm0 = G.heroMul; G.heroMul = function () { return jeu() ? 0 : hm0.apply(this, arguments); };
    const hp0 = G.hurtPlayer; G.hurtPlayer = function () { if (jeu()) return; return hp0.apply(this, arguments); };
    ['attack', 'cast'].forEach(k => { const f0 = G[k]; if (typeof f0 === 'function') G[k] = function () { if (jeu()) return; return f0.apply(this, arguments); }; }); }
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.forEach(b => { if (!b || !/invis/i.test(b.k || '')) return; const t0 = b.t; b.t = function () { return jeu() ? 0 : (typeof t0 === 'function' ? t0.apply(this, arguments) : t0); }; });
  // ---------- le clic, le doigt ----------
  function taper(wx, wy) { const R = CG.R, J = jeu(); if (!J) return; const V = J.vague; let best = null, bd = Pe.TOUCHE + 6;
    if (V && V.age > Pe.MONTE * 0.5) for (const f of V.fish) { if (f.etat !== 'la') continue; const c = J.L.cells[f.c], d = Math.hypot(wx - c.x, (wy - (c.y - 12)) * 0.85); if (d < bd) { bd = d; best = f; } }
    if (!best) { R.parts.push({ x: wx, y: wy, vx: 0, vy: -20, life: 0.3, max: 0.3, col: '#d8f0ff', size: 4, float: true }); CG.sfx('swing'); return; }
    const c = J.L.cells[best.c]; best.etat = 'tape'; J.sauts.push({ x: c.x, y: c.y, f: best, t: 0, max: 0.7, dir: Math.random() < 0.5 ? -1 : 1 }); G.puff(c.x, c.y - 6, '#e8f6ff', 10, 120, 3); R.rings.push({ x: c.x, y: c.y, r: 26, life: 0.3, col: '#e8f6ff' });
    if (best.mechant) { J.pris++; CG.sfx('hit'); CG.sfx('coin'); G.text(c.x, c.y - 44, J.pris + ' / ' + Pe.BUT, '#ffe36b', true); if (J.pris >= Pe.BUT) finir(true); }
    else { J.t = Math.max(0.1, J.t - Pe.ERREUR); CG.sfx('no'); G.text(c.x, c.y - 44, 'Oups ! -' + String(Pe.ERREUR).replace('.', ',') + ' s', '#ff9a8a', true); } }
  if (typeof window !== 'undefined') { const surJeu = e => e.target && e.target.id === 'game';
    window.addEventListener('pointerdown', e => { if (!jeu() || !surJeu(e) || (UI && UI.modal)) return; e.preventDefault(); e.stopPropagation(); const m = CG.versMonde(e.clientX, e.clientY); taper(m.x, m.y); }, true);
    ['mousedown', 'touchstart', 'click'].forEach(k => window.addEventListener(k, e => { if (!jeu() || !surJeu(e) || (UI && UI.modal)) return; e.stopPropagation(); if (k !== 'touchstart') e.preventDefault(); }, true)); }
  // ---------- les dessins ----------
  const ell = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fill(); };
  // un poisson, la tête vers le haut ; (0, 0) = la ligne d'eau ; « h » : de combien il dépasse
  function poisson(g, f, h, t, sonne) { const C = f.col, w = 11, m = f.mechant; g.save(); g.translate(0, -h);
    g.fillStyle = C[1]; g.beginPath(); if (f.sorte === 1) { g.moveTo(-3, -13); g.lineTo(0, -21); g.lineTo(4, -13); } else if (f.sorte === 2) { g.moveTo(-5, -12); g.lineTo(-3, -18); g.lineTo(0, -13); g.lineTo(3, -19); g.lineTo(5, -12); } else { g.moveTo(-4, -12); g.quadraticCurveTo(1, -22, 5, -12); } g.closePath(); g.fill(); /* la nageoire du dos */
    for (const d of [-1, 1]) { g.save(); g.translate(d * w, 3); g.rotate(d * (0.5 + Math.sin(t * 9 + f.s) * 0.3)); ell(g, d * 3, 0, 4.5, 2.4, C[1]); g.restore(); }
    g.fillStyle = C[0]; g.beginPath(); g.moveTo(-w, 16); g.quadraticCurveTo(-w - 1.5, -6, 0, -15); g.quadraticCurveTo(w + 1.5, -6, w, 16); g.closePath(); g.fill(); ell(g, 0, 7, w * 0.62, 9, C[2]);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(-4.5, -6, 2.4, 4.5, 0.4, 0, TAU); g.fill();
    for (const d of [-1, 1]) { const ex = d * 4.6, ey = -3; if (sonne) { g.strokeStyle = '#2a1410'; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 2, ey - 2); g.lineTo(ex + 2, ey + 2); g.moveTo(ex - 2, ey + 2); g.lineTo(ex + 2, ey - 2); g.stroke(); continue; }
      ell(g, ex, ey, 3.3, 3.6, '#ffffff'); ell(g, ex + (m ? -d * 0.6 : 0), ey + (m ? 0.5 : 0.2), 1.6, 1.9, '#1a1420'); ell(g, ex + 0.6, ey - 1, 0.6, 0.6, '#ffffff');
      if (m) { g.strokeStyle = '#3a0806'; g.lineWidth = 2.4; g.lineCap = 'round'; const b = Math.sin(t * 14 + f.s) * 0.5; g.beginPath(); g.moveTo(ex - d * 4.2, ey - 7 + b); g.lineTo(ex + d * 2.6, ey - 2.6); g.stroke(); } } /* les gros sourcils fâchés, qui frémissent */
    if (sonne) { ell(g, 0, 5.5, 2.6, 2.2, '#3a1410'); }
    else if (m) { g.fillStyle = '#3a0806'; g.beginPath(); g.moveTo(-5, 6); g.quadraticCurveTo(0, 2.5, 5, 6); g.lineTo(4, 8.5); g.lineTo(-4, 8.5); g.closePath(); g.fill(); g.fillStyle = '#ffffff'; for (const tx of [-3, -0.6, 1.8]) { g.beginPath(); g.moveTo(tx, 5.4); g.lineTo(tx + 1.1, 7.8); g.lineTo(tx + 2.2, 5.4); g.closePath(); g.fill(); } }
    else { g.strokeStyle = '#2a2030'; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath(); g.arc(0, 4, 3.2, 0.25, Math.PI - 0.25); g.stroke(); ell(g, -7.4, 3, 1.8, 1.2, 'rgba(255,150,170,0.5)'); ell(g, 7.4, 3, 1.8, 1.2, 'rgba(255,150,170,0.5)'); }
    g.restore(); }
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const L = lieu(), J = jeu(); if (!L || !CG.onScreen(L.cx, L.bord)) return;
    // le ponton : deux pieux, des planches, et la canne posée au bout tant qu'on ne l'a pas prise
    const x = L.cx, y0 = L.bord + 6, y1 = L.bord - 30; g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x - 12, y1 + 5, 28, y0 - y1); g.fillStyle = '#5a3a1c'; g.fillRect(x - 14, y1 - 2, 4, 14); g.fillRect(x + 10, y1 - 2, 4, 14);
    for (let i = 0, n = 6; i < n; i++) { const py = y1 + (y0 - y1) * i / n; g.fillStyle = i % 2 ? '#a8763e' : '#96683a'; g.fillRect(x - 13, py, 26, (y0 - y1) / n - 1); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x - 13, py + (y0 - y1) / n - 2, 26, 1); }
    if (!J) { g.strokeStyle = '#6a4420'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 8, y1 + 12); g.lineTo(x - 12, y1 - 20); g.stroke(); g.strokeStyle = 'rgba(240,240,240,0.8)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 12, y1 - 20); g.quadraticCurveTo(x - 16, y1 - 8, x - 15, y1 + 2 + Math.sin(t * 2) * 1.5); g.stroke(); ell(g, x - 15, y1 + 3 + Math.sin(t * 2) * 1.5, 2, 2, '#e03a2a'); }
    if (!J) return;
    for (const c of L.cells) { ell(g, c.x, c.y + 2, 15, 6.5, 'rgba(10,40,80,0.32)'); g.strokeStyle = 'rgba(220,240,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.ellipse(c.x, c.y + 2, 13 + Math.sin(t * 3 + c.x) * 1.5, 5.5, 0, 0, TAU); g.stroke(); } };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const S = CG.S, R = CG.R, J = jeu(); if (!S || !J) return; const L = J.L, V = J.vague, p = S.player;
    if (V) for (const f of V.fish) { if (f.etat !== 'la') continue; const c = L.cells[f.c], k = Math.min(1, V.age / Pe.MONTE, Math.max(0, V.t) / Pe.MONTE), e = k * k * (3 - 2 * k), h = e * 17 + (k >= 1 ? Math.sin(t * 7 + f.s) * 1.2 : 0);
      g.save(); g.beginPath(); g.rect(c.x - 24, c.y - 60, 48, 62); g.clip(); g.translate(c.x, c.y + 14); poisson(g, f, h, t, false); g.restore();
      g.strokeStyle = 'rgba(235,248,255,0.85)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(c.x, c.y + 2, 12.5, 4.6, 0, 0, Math.PI); g.stroke(); } /* le bourrelet d'eau devant lui */
    for (const s of J.sauts) { const k = s.t / s.max, x = s.x + s.dir * k * 16, y = s.y - Math.sin(k * Math.PI) * 52; g.save(); g.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1; g.translate(x, y - 6); g.rotate(s.dir * k * TAU * 1.2); g.translate(0, 2); poisson(g, s.f, 0, t, s.f.mechant); g.restore();
      if (s.f.mechant && k < 0.8) for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; g.fillStyle = '#ffe36b'; g.beginPath(); g.arc(x + Math.cos(a) * 15, y - 22 + Math.sin(a) * 5, 1.8, 0, TAU); g.fill(); }
      if (k > 0.86 && !s.plouf) { s.plouf = true; G.puff(s.x + s.dir * 16, s.y, '#e8f6ff', 8, 100, 3); } }
    // la minuterie, au-dessus de la tête du chef
    const o = Math.min(1, J.age / 0.22), sc = o < 1 ? 0.4 + o * 0.75 - (o > 0.8 ? (o - 0.8) * 0.75 : 0) : 1, k = Math.max(0, J.t / Pe.TEMPS), presse = J.t < 8, w = 104, hh = 36;
    g.save(); g.translate(p.x, Math.min(p.y - 92, L.cells[0].y - 52)); g.scale(sc, sc); /* au-dessus de sa tête, et toujours plus haut que la grille : elle ne cache aucun poisson */ g.fillStyle = 'rgba(24,16,8,0.9)'; g.strokeStyle = presse && Math.floor(t * 6) % 2 ? '#ff8a6a' : '#c9a06a'; g.lineWidth = 2; g.beginPath(); const rr = 9; g.moveTo(-w / 2 + rr, -hh / 2); g.arcTo(w / 2, -hh / 2, w / 2, hh / 2, rr); g.arcTo(w / 2, hh / 2, -w / 2, hh / 2, rr); g.arcTo(-w / 2, hh / 2, -w / 2, -hh / 2, rr); g.arcTo(-w / 2, -hh / 2, w / 2, -hh / 2, rr); g.closePath(); g.fill(); g.stroke();
    g.font = '700 13px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffe9b8'; g.fillText('🐟 ' + J.pris + ' / ' + Pe.BUT, -w / 2 + 9, -7); g.textAlign = 'right'; g.fillStyle = presse ? '#ff9a8a' : '#e8f0ff'; g.fillText(Math.ceil(J.t) + ' s', w / 2 - 9, -7);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(-w / 2 + 8, 5, w - 16, 7); g.fillStyle = presse ? '#f06a4a' : '#6ad0ff'; g.fillRect(-w / 2 + 8, 5, (w - 16) * k, 7); g.restore(); g.textBaseline = 'alphabetic'; };
})(window.CG);
