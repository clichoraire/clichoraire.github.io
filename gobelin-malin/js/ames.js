// Goblin Malin — le cimetière des anciens chefs, à bâtir au village (une case de l'arbre le révèle).
//   On y voit les pierres tombales de ses anciens personnages, avec leur nom. Le soir, les fantômes de quelques-uns apparaissent.
//   On peut demander à l'un d'eux de venir défendre le village : ça coûte 30 % de sa vie et de son mana (il faut en avoir au moins 31 %).
//   Le fantôme devient un compagnon de niveau 1. Il change d'allure en évoluant (stade 2, puis stade 3), et on peut lui donner un nom véritable.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, P = CG.P, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const Am = CG.Ames = { PRIX: 0.3, MIN: 0.31, SOIR: 19, MAX: 3, PIERRES: 5, NIV3: 10, K3: 1.35 };
  Am.TITRES = ['Fantôme', 'Spectre gardien', 'Âme ancienne'];
  CG.BUILDS.cimetiere = { nom: 'Cimetière des anciens chefs', icon: '🪦', w: 3, h: 2, cat: 'magie', cout: { bois: 30, minerai: 25, or: 60 }, tech: 'cm1', desc: 'Les pierres tombales de tes anciens chefs. Le soir, quelques-uns de leurs fantômes y apparaissent : tu peux leur demander de défendre le village.' };
  { const n = { id: 'cm1', br: 'sorc', rang: 0.5, cout: 2, t: 5, r: 0, icon: '🪦', nom: 'Cimetière des anciens chefs', desc: 'Révèle le Cimetière des anciens chefs : les tombes de tes anciens personnages, et leurs fantômes le soir.', unlock: ['cimetiere'] }; CG.TECH.push(n); if (CG.TECH_BY_ID) CG.TECH_BY_ID[n.id] = n; }
  P.KINDS.ame = { monstre: true, fly: true, faim: 0, nom: Am.TITRES[0], evo: Am.TITRES[1], icon: '👻', hp: 46, dmg: 7, spd: 84, cd: 0.9, pz: 0.8, special: 'Il traverse tout et ne mange rien. Au stade 3, il devient une Âme ancienne.', hello: '' };
  const tombes = () => (CG.Tombes ? CG.Tombes.liste() : []).filter(t => t && t.nom && t.chef !== false);
  const lieu = () => CG.S.buildings.find(b => b.type === 'cimetiere' && !b.site) || null;
  const centre = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h) * T });
  // ---------- le compagnon fantôme ----------
  const stade = p => Math.min(2, +p.evo || 0);
  const ti0 = P.title; P.title = function (p) { return p.kind === 'ame' ? Am.TITRES[stade(p)] : ti0.apply(this, arguments); };
  const ea0 = P.eats; P.eats = function (p) { return p.kind === 'ame' ? 0 : ea0.apply(this, arguments); };
  const mh0 = P.maxHp; P.maxHp = function (p) { const v = mh0.apply(this, arguments); return p.kind === 'ame' && stade(p) === 2 ? Math.round(v * Am.K3) : v; };
  const dm0 = P.dmg; P.dmg = function (p) { const v = dm0.apply(this, arguments); return p.kind === 'ame' && stade(p) === 2 ? v * Am.K3 : v; };
  const xp0 = P.xp; P.xp = function (p, n) { const r = xp0.apply(this, arguments);
    if (p.kind === 'ame' && p.evo === 1 && p.lvl >= Am.NIV3) { const R = CG.R; p.evo = 2; p.hp = P.maxHp(p); R.rings.push({ x: p.x, y: p.y - 10, r: 190, life: 0.5, col: '#ffffff' }, { x: p.x, y: p.y - 10, r: 110, life: 0.5, col: '#d0a0ff' }); G.puff(p.x, p.y - 20, '#d0a0ff', 36, 240, 5); CG.sfx('level');
      G.banner(p.name + ' devient une ' + Am.TITRES[2] + ' !', 'Son dernier stade : plus grand, plus fort, couronné de flammes mauves.', '#e0c0ff'); }
    return r; };
  Am.lier = function (a) {
    const S = CG.S, R = CG.R, p = S.player, cv = Math.round(p.maxhp * Am.PRIX), cm = Math.round(p.maxmp * Am.PRIX); if (p.hp < p.maxhp * Am.MIN || p.mp < p.maxmp * Am.MIN) return false;
    p.hp = Math.max(1, p.hp - cv); p.mp = Math.max(0, p.mp - cm); R.hurtFlash = 0.4; G.text(p.x, p.y - 60, '-' + cv + ' ❤ · -' + cm + ' 💧', '#d0a0ff', true);
    const o = { id: S.nextId++, kind: 'ame', name: a.nom, lvl: 1, xp: 0, evo: 0, x: a.x, y: a.y, pet: true, follow: false }; P.reset(o); o.hp = P.maxHp(o); S.pets.push(o); R.ames = (R.ames || []).filter(q => q !== a);
    for (let i = 0; i < 3; i++) R.rings.push({ x: a.x, y: a.y - 14, r: 40 + i * 34, life: 0.45 + i * 0.15, col: i % 2 ? '#ffffff' : '#a8f0d0' }); G.puff(a.x, a.y - 20, '#c8ffe8', 26, 170, 4); CG.sfx('spell');
    G.banner('Le fantôme de ' + a.nom + ' te suit', 'Un ' + Am.TITRES[0].toLowerCase() + ' de niveau 1 rejoint tes compagnons. Il grandira en se battant ; tu peux lui donner un nom véritable en lui parlant.', '#c8ffe8'); return true;
  };
  Am.parler = function (a) {
    const S = CG.S, p = S.player, cv = Math.round(p.maxhp * Am.PRIX), cm = Math.round(p.maxmp * Am.PRIX), okV = p.hp >= p.maxhp * Am.MIN, okM = p.mp >= p.maxmp * Am.MIN;
    UI.dialog({ visitor: { role: 'animal', look: 'animal', kind: 'ame', evo: 0 }, who: 'Le fantôme de ' + a.nom, tag: '👻 ancien chef · niveau ' + a.niv + ' · tombé au jour ' + a.jour,
      text: pick(['« Tiens... un chef bien vivant. J\'avais ton âge, ta place, et ton air sûr de moi. »', '« Le feu de camp sent toujours pareil. Ça me manque, tu sais. »', '« Je suis tombé au jour ' + a.jour + '. Fais mieux que moi, petit. »', '« On m\'appelait chef, autrefois. Maintenant, je compte les lucioles. »']),
      options: [{ label: '🕯️ Viens défendre le village avec moi', sub: !okV ? 'Il te faut au moins 31 % de ta vie' : !okM ? 'Il te faut au moins 31 % de ton mana' : 'Te coûte ' + cv + ' ❤ et ' + cm + ' 💧 (30 % de chaque) · il devient un compagnon de niveau 1', disabled: !okV || !okM, fn: () => Am.lier(a) }, { label: '👋 Repose en paix' }] });
  };
  // ---------- le soir : quelques fantômes sortent des tombes ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; R.amesT = (R.amesT || 0) - dt; if (R.amesT > 0) return; R.amesT = 0.7;
    const b = lieu(), soir = S.hour >= Am.SOIR && !R.night;
    if (!b || !soir) { if (R.ames && R.ames.length) R.ames = []; if (!soir) R.amesJour = null; return; }
    if (R.amesJour === S.day) return; R.amesJour = S.day; const l = CG.shuffle(tombes().slice()).slice(0, Am.MAX), c = centre(b);
    R.ames = l.map((t, i) => { const a = { nom: t.nom, niv: t.niv, jour: t.jour, x: c.x + (i - (l.length - 1) / 2) * 62, y: c.y + 30 + (i % 2) * 14, seed: Math.random() * 40, ne: 0,
      draw(g, o, tt) { const k = Math.min(1, (a.ne += 0.02)); g.save(); g.globalAlpha = 0.85 * k; fantome(g, { x: a.x, y: a.y + (1 - k) * 14, evo: 0, face: CG.S.player.x >= a.x ? 1 : -1, seed: a.seed }, tt); g.globalAlpha = k; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 3; g.strokeText(a.nom, a.x, a.y - 62); g.fillStyle = '#d8ffec'; g.fillText(a.nom, a.x, a.y - 62); g.restore(); } }; return a; });
    if (R.ames.length) { G.puff(c.x, c.y - 20, '#c8ffe8', 16, 110, 3); if (CG.onScreen(c.x, c.y)) CG.sfx('spell'); UI.toast('👻 Des lueurs s\'élèvent de ton cimetière : ' + R.ames.map(a => a.nom).join(', ') + '. Va leur parler (E).'); }
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R, p = CG.S.player; if (!R.ames || !R.ames.length || R.ko > 0 || R.cine || R.build) return it;
    if (it && it.type !== 'home' && it.type !== 'hut' && it.type !== 'sleep') return it; let best = null, bd = 50;
    for (const a of R.ames) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < bd) { bd = d; best = a; } }
    return best ? { type: 'ame', obj: best, label: 'Parler au fantôme de ' + best.nom + ' 👻' } : it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'ame') return Am.parler(it.obj); return in0.apply(this, arguments); };
  if (CG.Armee) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R || !R.ames) return; for (const a of R.ames) if (CG.onScreen(a.x, a.y)) push(a.y, 21, a, null); }; }
  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const TEINTES = [['#c8ffe8', '#8fe0c0', '#2a5a4a'], ['#bfe0ff', '#7ab0f0', '#22407a'], ['#e8d0ff', '#b488f0', '#4a2a80']];
  function fantome(g, o, t) { // un chef gobelin devenu fantôme : oreilles pointues, drap qui flotte, et de plus en plus d'allure à chaque stade
    const s = Math.min(2, +o.evo || 0), C = TEINTES[s], portrait = o.x === 0 && o.y === 0, ech = (portrait ? 1.5 : 1) * [1, 1.22, 1.46][s], b = t * 2.4 + (o.seed || 0), haut = (portrait ? 4 : 16) + Math.sin(b) * 3, atk = o.atkAnim > 0 ? Math.sin(o.atkAnim * Math.PI) : 0;
    if (!portrait) ell(g, o.x, o.y + 1, 10 * ech, 3 * ech, 'rgba(0,0,0,0.16)');
    g.save(); g.translate(o.x, o.y - haut); g.scale((o.face < 0 ? -1 : 1) * ech, ech); g.translate(atk * 5, 0); if (o.ko) g.globalAlpha *= 0.35;
    ell(g, 0, -14, 17 + s * 3, 19 + s * 3, s === 2 ? 'rgba(200,150,255,0.16)' : s === 1 ? 'rgba(150,200,255,0.14)' : 'rgba(180,255,220,0.12)');
    if (s >= 1) { g.fillStyle = C[2]; g.globalAlpha *= 0.8; g.beginPath(); g.moveTo(-7, -18); g.quadraticCurveTo(-18, -6 + Math.sin(b) * 2, -15 + Math.sin(b * 1.3) * 2, 6); g.lineTo(-4, 0); g.closePath(); g.fill(); g.globalAlpha /= 0.8; } // la cape en lambeaux
    g.fillStyle = C[0]; g.beginPath(); g.moveTo(-8.5, -18); g.quadraticCurveTo(-10.5, -4, -9 + Math.sin(b) * 1.4, 4); g.quadraticCurveTo(-5.5, 0.5, -3.4, 5 + Math.sin(b + 1) * 1.2); g.quadraticCurveTo(0, 0.5, 3.4, 5 + Math.sin(b + 2) * 1.2); g.quadraticCurveTo(6, 0.5, 9 + Math.sin(b + 3) * 1.4, 3.4); g.quadraticCurveTo(10.5, -4, 8.5, -18); g.closePath(); g.fill(); // le drap
    ell(g, 0, -9, 5.4, 6.4, 'rgba(255,255,255,0.22)');
    poly(g, [-7, -22, -16.5, -26.5, -7.6, -17.6], C[1]); poly(g, [7, -22, 16.5, -26.5, 7.6, -17.6], C[1]); // les oreilles de gobelin
    ell(g, 0, -20.5, 8.6, 8.2, C[0]); ell(g, -2, -23, 4, 2.6, 'rgba(255,255,255,0.35)');
    const oe = s === 2 ? '#ffd86a' : s === 1 ? '#eaf6ff' : C[2]; ell(g, -2.6, -20.4, 1.7, 2.3, oe); ell(g, 3.4, -20.4, 1.7, 2.3, oe); if (s) { ell(g, -2.6, -20.4, 3.2, 3.6, 'rgba(255,255,255,0.18)'); ell(g, 3.4, -20.4, 3.2, 3.6, 'rgba(255,255,255,0.18)'); }
    g.strokeStyle = C[2]; g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(-1.6, -15.6); g.quadraticCurveTo(0.6, -14.6 - atk * 2, 3, -15.6); g.stroke();
    g.strokeStyle = C[0]; g.lineWidth = 3; g.beginPath(); g.moveTo(6.4, -12); g.lineTo(11.5 + atk * 4, -13.5 - atk * 3); g.stroke(); // un bras
    if (s >= 1) { poly(g, [-6, -27.4, -6.6, -32.6, -3, -29.4, 0, -33.8, 3, -29.4, 6.6, -32.6, 6, -27.4], s === 2 ? '#ffd86a' : '#dfe8f4'); } // la couronne du chef
    if (s === 2) { g.strokeStyle = '#d8c8f0'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(12.5, -3); g.lineTo(12.5, -27); g.stroke(); const f = Math.sin(t * 9 + (o.seed || 0)) * 1.2; ell(g, 12.5, -30, 3.6, 4.6 + f, '#b070ff'); ell(g, 12.5, -29.4, 1.8, 2.6 + f * 0.5, '#f0d8ff'); // le bâton à flamme mauve
      for (let i = 0; i < 3; i++) { const q = (t * 0.7 + i / 3) % 1; g.globalAlpha *= (1 - q); ell(g, -9 + i * 9 + Math.sin(b + i * 2) * 2, 2 - q * 34, 1.6, 1.6, '#d0a0ff'); g.globalAlpha /= (1 - q) || 1; } }
    g.restore();
  }
  const pet0 = Art.pet; Art.pet = function (g, o, t) { if (o.kind === 'ame') return fantome(g, o, t + (o.seed || 0)); return pet0.apply(this, arguments); };
  // le cimetière : une petite enceinte, cinq pierres, et les noms des anciens chefs gravés dessus
  const POS = [[26, 62], [62, 54], [98, 62], [44, 92], [84, 92]];
  if (Art.extra) Art.extra.cimetiere = { w: 128, h: 110, draw(c) {
    ell(c, 64, 96, 62, 13, 'rgba(0,0,0,0.25)'); c.fillStyle = '#3c4a30'; c.beginPath(); c.ellipse(64, 78, 60, 26, 0, 0, TAU); c.fill(); c.fillStyle = '#48583a'; c.beginPath(); c.ellipse(60, 74, 44, 17, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2a2a30'; c.lineWidth = 1.6; for (let i = 0; i < 15; i++) { const x = 8 + i * 8; c.beginPath(); c.moveTo(x, 46); c.lineTo(x, 30); c.stroke(); poly(c, [x - 1.6, 30, x, 26, x + 1.6, 30], '#2a2a30'); } c.beginPath(); c.moveTo(6, 34); c.lineTo(122, 34); c.moveTo(6, 42); c.lineTo(122, 42); c.stroke(); // la grille du fond
    POS.forEach((q, i) => { const x = q[0], y = q[1]; ell(c, x, y + 1, 12, 3.4, 'rgba(0,0,0,0.3)'); c.fillStyle = '#6a747a'; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x - 10, y - 16); c.quadraticCurveTo(x - 10, y - 27, x, y - 27); c.quadraticCurveTo(x + 10, y - 27, x + 10, y - 16); c.lineTo(x + 10, y); c.closePath(); c.fill();
      c.fillStyle = '#868f95'; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x - 10, y - 16); c.quadraticCurveTo(x - 10, y - 27, x, y - 27); c.quadraticCurveTo(x - 5, y - 22, x - 5, y - 14); c.lineTo(x - 5, y); c.closePath(); c.fill(); poly(c, [x - 11, y, x - 8, y - 6, x - 5, y], '#3f7026'); if (i % 2) poly(c, [x + 6, y, x + 9, y - 5, x + 11, y], '#4b8030'); });
  }, anim(g, cx, by, t, night) {
    const l = tombes().slice(-Am.PIERRES); g.save(); g.textAlign = 'center'; g.font = 'bold 7px sans-serif'; g.fillStyle = '#20282c';
    POS.forEach((q, i) => { const tb = l[l.length - 1 - i], x = cx - 64 + q[0], y = by - 110 + q[1]; if (!tb) { g.fillStyle = 'rgba(32,40,44,0.5)'; g.fillRect(x - 1, y - 20, 2, 9); g.fillRect(x - 4, y - 17, 8, 2); g.fillStyle = '#20282c'; return; } let n = tb.nom; if (n.length > 6) n = n.slice(0, 5) + '.'; g.fillText(n, x, y - 13); g.fillText('n.' + tb.niv, x, y - 5); });
    if (night) for (let i = 0; i < 3; i++) { const k = (t * 0.25 + i / 3) % 1; g.globalAlpha = Math.sin(k * Math.PI) * 0.7; ell(g, cx - 40 + i * 40 + Math.sin(t + i * 2) * 8, by - 40 - k * 30, 1.8, 1.8, '#c8ffa0'); } g.restore(); } };
})(window.CG);
