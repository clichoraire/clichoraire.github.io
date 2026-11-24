// Goblin Malin — les chapeaux du chef. En plus de la coiffe à plumes, le chef peut porter (case « Chapeau » de son inventaire) :
//   des chapeaux ordinaires, que les marchands de passage ont parfois dans leur hotte ;
//   des chapeaux uniques, qu'on ne trouve que chez un seul vendeur : la tisseuse du village elfique, la sorcière, le colporteur
//   démon, le marchand nain. Le plus fou : le Chapeau du vieux sage, qui monte d'un niveau le sort de ton choix tant qu'on le porte.
// Un seul chapeau à la fois. Tout se règle dans CG.Chapeaux.L (prix, bonus) et CG.Chapeaux.HOTTE.
//   vie / mana : en plus au maximum · regen : vie par seconde · manaS : mana par seconde · def : part des dégâts reçus en moins
//   (négatif = en plus) · dmg : dégâts en plus · vit : vitesse en plus · or : or trouvé en plus · sorts : rabais sur le mana des sorts
//   sage : monte d'un niveau un sort choisi.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Bq = CG.Banque, Iv = CG.Inventaire, Art = CG.Art, TAU = Math.PI * 2, pick = CG.pick; if (!Bq || !Iv) return;
  const Cp = CG.Chapeaux = { HOTTE: 0.6, UNIQUE: 0.5 }; /* HOTTE : chance qu'un marchand de passage ait un chapeau ordinaire ; UNIQUE : chance que la sorcière, le démon ou le nain ait le sien ce jour-là */
  Cp.L = {
    chapGardien: { nom: 'Masque de gardien d\'antan', ic: '🥅', prix: 480, def: 0.12, phrase: 'Un vieux masque blanc de gardien de but. Les coups rebondissent dessus comme des rondelles.' },
    chapMarmite: { nom: 'Marmite cabossée', ic: '🍲', prix: 320, vie: 25, phrase: 'Elle a déjà servi à la soupe. Maintenant, elle sert à ta tête.' },
    chapPaille: { nom: 'Chapeau de paille', ic: '👒', prix: 420, regen: 0.6, phrase: 'À l\'ombre de son bord, les bobos guérissent tout seuls.' },
    chapFeutre: { nom: 'Feutre à plume rouge', ic: '🎩', prix: 380, vit: 0.12, phrase: 'Le chapeau des coureurs des bois. On dirait que la plume te tire en avant.' },
    chapCarton: { nom: 'Couronne en carton', ic: '👑', prix: 550, or: 0.15, phrase: 'Découpée par un enfant. L\'or, lui, n\'y voit que du feu.' },
    chapSage: { nom: 'Chapeau du vieux sage', ic: '🧙', prix: 3000, sage: true, rare: 3, chez: 'elfes', phrase: 'Il murmure quand on le met. Le sort qu\'il choisit avec toi devient plus fort d\'un niveau.' },
    chapEtoile: { nom: 'Bonnet étoilé', ic: '🌟', prix: 2000, sorts: 0.2, rare: 3, chez: 'elfes', phrase: 'Tissé un soir sans lune. Les sorts te coûtent moins de mana.' },
    chapSorciere: { nom: 'Grand chapeau de sorcière', ic: '🧹', prix: 1600, manaS: 0.8, mana: 15, rare: 3, chez: 'sorciere', phrase: 'Pointu, noir, un peu tordu. Le mana te revient comme un chat à l\'heure du souper.' },
    chapCornes: { nom: 'Cornes du diable', ic: '😈', prix: 1400, dmg: 0.25, def: -0.15, rare: 3, chez: 'demonMarchand', phrase: 'Tu cognes comme un démon. Et tu encaisses comme un démon qui a oublié son armure.' },
    chapMineur: { nom: 'Casque de mineur à chandelle', ic: '⛑️', prix: 900, vie: 20, def: 0.08, rare: 3, chez: 'nain', phrase: 'Du bon fer nain, avec une chandelle qui ne s\'éteint jamais.' }
  };
  const L = Cp.L, n1 = v => String(Math.round(v * 10) / 10).replace('.', ','), pc = v => Math.round(Math.abs(v) * 100) + ' %';
  Object.keys(L).forEach(k => { const o = L[k]; Bq.NOMS[k] = ['', o.nom, o.nom, o.nom, o.nom]; Bq.IC[k] = o.ic; if (CG.Objets && CG.Objets.PHRASE) CG.Objets.PHRASE[k] = o.phrase; });
  // celui que le chef porte (jamais la coiffe à plumes, qui garde ses propres règles dans mode.js)
  Cp.porte = () => { const p = CG.S && CG.S.player, it = p && p.porte && p.porte.chapeau; return it && L[it.k] ? it : null; };
  const H = () => { const it = Cp.porte(); return it ? L[it.k] : null; };
  const Nv = () => CG.Niveaux, sortNom = b => (Nv() && Nv().BASE && Nv().BASE[b] ? Nv().BASE[b].nom : (CG.SPELLS[b] || {}).nom || b);
  Cp.texte = function (it) { const o = L[it.k], l = []; if (!o) return '';
    if (o.vie) l.push('+' + o.vie + ' vie maximum'); if (o.mana) l.push('+' + o.mana + ' mana maximum'); if (o.regen) l.push('+' + n1(o.regen) + ' vie par seconde'); if (o.manaS) l.push('+' + n1(o.manaS) + ' mana par seconde');
    if (o.def > 0) l.push('Armure : ' + pc(o.def) + ' de dégâts reçus en moins'); if (o.dmg) l.push('+' + pc(o.dmg) + ' de dégâts'); if (o.def < 0) l.push(pc(o.def) + ' de dégâts reçus en plus'); if (o.vit) l.push('+' + pc(o.vit) + ' de vitesse'); if (o.or) l.push('+' + pc(o.or) + ' d\'or trouvé'); if (o.sorts) l.push('Sorts : ' + pc(o.sorts) + ' de mana en moins');
    if (o.sage) l.push(it.sort ? 'Ton sort « ' + sortNom(it.sort) + ' » : +1 niveau' : 'Un sort de ton choix : +1 niveau');
    return l.join(' · '); };
  { const e0 = Iv.effet; Iv.effet = function (it, chef) { if (it && it.k === 'chapeau' && CG.Mode && CG.Mode.CHEF) return chef ? '+' + pc(CG.Mode.CHEF.dmg) + ' de dégâts · +' + n1(CG.Mode.CHEF.mana) + ' mana par seconde' : 'Pour le chef seulement'; /* la coiffe à plumes a ses chiffres, elle aussi */ return it && L[it.k] ? (chef ? Cp.texte(it) : 'Pour le chef seulement') : e0.apply(this, arguments); };
    const b0 = Bq.effet; Bq.effet = function (k) { return L[k] ? 'Pour le chef seulement' : b0.apply(this, arguments); }; }
  // ---------- ce qu'ils font ----------
  { const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { const o = H(); return hp0.call(this, o && o.def && dmg < 9999 ? dmg * (1 - o.def) : dmg); };
    const pd0 = G.playerDmg; G.playerDmg = function () { const o = H(); return pd0.apply(this, arguments) * (o && o.dmg ? 1 + o.dmg : 1); };
    const mr0 = G.manaRegen; G.manaRegen = function () { const o = H(); return mr0.apply(this, arguments) + (o && o.manaS ? o.manaS : 0); };
    const hm0 = G.heroMul; G.heroMul = function () { const o = H(); return hm0.apply(this, arguments) * (o && o.vit ? 1 + o.vit : 1); };
    const sc0 = G.spellCost; G.spellCost = function () { const o = H(), v = sc0.apply(this, arguments); return o && o.sorts ? Math.max(1, Math.ceil(v * (1 - o.sorts))) : v; };
    const ga0 = G.gain; G.gain = function (res, n, x, y) { const o = H(); if (res === 'or' && n > 0 && o && o.or) n = Math.round(n * (1 + o.or)); return ga0.call(this, res, n, x, y); }; }
  // la vie et le mana en plus, et le sort du sage : on ajuste dès que le chapeau change (p.chap retient ce qui est appliqué)
  function sortsPossibles() { const p = CG.S.player, N = Nv(); if (!N || !N.T) return []; return (p.spells || []).filter(b => N.T[b] && N.niv(b) < 3); }
  function accorder(it) {
    const l = sortsPossibles(); if (!l.length) { if (!it.dit) { it.dit = true; UI.toast('🧙 Le chapeau du sage ne trouve aucun sort à renforcer pour l\'instant : il attend que tu en apprennes un.'); } return; }
    UI.dialog({ who: 'Le chapeau du vieux sage', tag: '🧙 il murmure à ton oreille', text: '« Hmm… Voyons ce qu\'il y a dans cette caboche verte. Lequel de tes sorts veux-tu que je renforce ? Choisis bien : je ne changerai pas d\'avis. »', options: l.slice(0, 9).map(b => ({ label: (CG.SPELLS[b].icon || '📜') + ' ' + sortNom(b), fn: () => { it.sort = b; CG.sfx('level'); UI.toast('🧙 Le chapeau du sage s\'accorde à « ' + sortNom(b) + ' » : +1 niveau tant que tu le portes.'); } })).concat([{ label: 'Je vais y penser', echap: true }]) }); it.demande = (CG.R.t || 0) + 20; }
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !S.player) return r; const p = S.player, o = H(), it = Cp.porte();
    if (o && o.regen && !(R.ko > 0) && p.hp > 0 && p.hp < p.maxhp) p.hp = Math.min(p.maxhp, p.hp + o.regen * dt);
    tic -= dt; if (tic > 0) return r; tic = 0.3; const c = p.chap || (p.chap = { vie: 0, mana: 0, sort: null });
    const vie = o && o.vie ? o.vie : 0, mana = o && o.mana ? o.mana : 0;
    if (vie !== c.vie) { const d = vie - c.vie; c.vie = vie; p.maxhp += d; p.hp = Math.max(1, Math.min(p.maxhp, p.hp + Math.max(0, d))); }
    if (mana !== c.mana) { const d = mana - c.mana; c.mana = mana; p.maxmp += d; p.mp = Math.max(0, Math.min(p.maxmp, p.mp + Math.max(0, d))); }
    const N = Nv(), veut = o && o.sage && it.sort ? it.sort : null;
    if (N && c.sort && c.sort !== veut) { const n = Math.max(1, N.niv(c.sort) - 1); p.sortNiv = p.sortNiv || {}; if (n > 1) p.sortNiv[c.sort] = n; else delete p.sortNiv[c.sort]; c.sort = null; N.rafraichir(); }
    if (N && veut && !c.sort && N.T && N.T[veut] && N.niv(veut) < 3) { p.sortNiv = p.sortNiv || {}; p.sortNiv[veut] = N.niv(veut) + 1; c.sort = veut; N.rafraichir(); G.text(p.x, p.y - 84, '🧙 ' + CG.SPELLS[veut].nom, '#bfe4ff', true); }
    if (o && o.sage && !it.sort && !UI.modal && !R.cine && !R.alarm && !(it.demande > (R.t || 0))) accorder(it);
    return r;
  };
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), p = CG.S && CG.S.player; if (d && d.player && p && p.chap) d.player.chap = p.chap; return d; }; }
  // ---------- chez les marchands ----------
  const possede = k => { const S = CG.S, p = S.player, tous = (p.sac || []).concat(p.porte ? [p.porte.chapeau] : [], S.coffre || [], (S.banque && S.banque.coffre) || []); return tous.some(it => it && it.k === k) || !!(S.chapEus && S.chapEus[k]); };
  const article = k => { const o = L[k]; return { icon: o.ic, label: o.nom, desc: Cp.texte({ k }) + ' · se porte sur ta tête', prix: o.prix, stock: 1, chap: k, buy: () => { const S = CG.S; (S.chapEus = S.chapEus || {})[k] = 1; Bq.deposer(k, o.rare || 1, 1, 'sac'); UI.toast(o.ic + ' ' + o.nom + ' : dans ton sac. Mets-le dans la case « Chapeau » de ton inventaire.'); } }; };
  Cp.article = article;
  const sh0 = UI.shop; UI.shop = function (v) {
    try { if (v && Array.isArray(v.shop) && !v.chapVu) { v.chapVu = true; const elfes = !!(v.titre && /tisseuse/.test(v.titre)), role = v.role, plus = [];
        Object.keys(L).forEach(k => { const o = L[k]; if (!o.chez || possede(k)) return; if (o.chez === 'elfes' ? elfes : (o.chez === role && Math.random() < Cp.UNIQUE)) plus.push(article(k)); });
        if (!elfes && !v.titre && Math.random() < Cp.HOTTE) { const l = Object.keys(L).filter(k => !L[k].chez && !possede(k)); if (l.length) plus.push(article(pick(l))); }
        plus.forEach(a => v.shop.push(a)); } } catch (e) { /* jamais bloquant */ }
    return sh0.apply(this, arguments);
  };
  // ---------- leur dessin, posé sur la tête du chef ----------
  const el = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const po = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const rc = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // l'origine : le sommet du crâne ; y vers le bas ; « dos » : le chef nous tourne le dos
  Cp.DESSIN = {
    chapGardien(g, t, dos) { el(g, 0, 3, 11.5, 7, '#f2efe6'); rc(g, -11.5, 3, 23, 3, '#f2efe6'); g.strokeStyle = '#8a8478'; g.lineWidth = 1; g.beginPath(); g.moveTo(-11, 6); g.lineTo(11, 6); g.stroke();
      if (dos) { rc(g, -1.5, 6, 3, 9, '#6a4a2a'); return; } g.fillStyle = '#f7f4ec'; g.beginPath(); g.moveTo(-9, 6); g.quadraticCurveTo(-10, 18, -5, 23); g.quadraticCurveTo(0, 26, 5, 23); g.quadraticCurveTo(10, 18, 9, 6); g.closePath(); g.fill();
      el(g, -4.2, 12, 2.6, 2, '#2a2420'); el(g, 4.2, 12, 2.6, 2, '#2a2420'); g.fillStyle = '#2a2420'; for (const q of [[-2.5, 18], [0, 17.2], [2.5, 18], [-1.3, 20.6], [1.3, 20.6]]) { g.beginPath(); g.arc(q[0], q[1], 0.8, 0, TAU); g.fill(); } g.strokeStyle = '#c8322a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-7, 8.5); g.lineTo(-4, 9.8); g.moveTo(7, 8.5); g.lineTo(4, 9.8); g.stroke(); },
    chapMarmite(g) { po(g, [-11, 6, -10, -6, 10, -6, 11, 6], '#5c5a62'); el(g, 0, -6, 10, 3, '#74727c'); rc(g, -12.5, 5, 25, 2.6, '#44424a'); el(g, -5, -1, 2.6, 2, '#4a4850'); g.strokeStyle = '#3c3a42'; g.lineWidth = 2; g.beginPath(); g.arc(-12.5, 0, 3, 1.2, 5); g.stroke(); g.beginPath(); g.arc(12.5, 0, 3, -1.9, 1.9); g.stroke(); rc(g, 3, -4, 2, 7, 'rgba(255,255,255,0.14)'); },
    chapPaille(g) { el(g, 0, 5, 19, 5.2, '#d9b24a'); el(g, 0, 4.2, 19, 4.4, '#edc95e'); po(g, [-9.5, 4, -8, -5, 8, -5, 9.5, 4], '#edc95e'); el(g, 0, -5, 8, 2.6, '#f6d874'); rc(g, -9, 0.5, 18, 3, '#c8322a'); g.strokeStyle = 'rgba(140,100,30,0.45)'; g.lineWidth = 0.7; g.beginPath(); for (let i = -14; i <= 14; i += 4) { g.moveTo(i, 2.5); g.lineTo(i * 1.15, 8.5); } g.stroke(); },
    chapFeutre(g, t) { po(g, [-12, 5, -8, -3, 2, -11, 9, -3, 13, 5], '#3f7a44'); po(g, [-15, 6, 16, 6, 12, 2.5, -11, 2.5], '#2f6236'); rc(g, -9, 0, 19, 2.4, '#1f4426'); const b = Math.sin(t * 5) * 1.2; g.strokeStyle = '#e03a2a'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(7, 0); g.quadraticCurveTo(15, -10, 11 + b, -19); g.stroke(); g.strokeStyle = '#ff8a6a'; g.lineWidth = 1; g.beginPath(); g.moveTo(7.5, -1); g.quadraticCurveTo(14, -10, 11 + b, -18); g.stroke(); },
    chapCarton(g) { po(g, [-10.5, 5, -11.5, -7, -6, -1, -3, -9, 0, -1, 3, -9, 6, -1, 11.5, -7, 10.5, 5], '#e8c33a'); rc(g, -10.5, 2, 21, 3.4, '#c79a1e'); el(g, 0, 3.7, 1.8, 1.5, '#d8423a'); el(g, -6, 3.7, 1.5, 1.3, '#3a8ad8'); el(g, 6, 3.7, 1.5, 1.3, '#3ab86a'); g.strokeStyle = 'rgba(120,80,10,0.5)'; g.lineWidth = 0.8; g.setLineDash([2, 1.6]); g.beginPath(); g.moveTo(-10, 0.5); g.lineTo(10, 0.5); g.stroke(); g.setLineDash([]); },
    chapSage(g, t) { el(g, 0, 5, 17, 4.6, '#2f3f8a'); po(g, [-10, 4.5, -5, -12, 2, -24, 10, -29, 6, -16, 10, 4.5], '#3c50a8'); po(g, [2, -24, 10, -29, 6, -16], '#2f3f8a'); rc(g, -9.5, 0.5, 19.5, 3, '#c9a84a'); const k = 0.6 + Math.sin(t * 3) * 0.4; g.fillStyle = 'rgba(255,236,150,' + k.toFixed(2) + ')'; for (const q of [[-3, -6, 1.6], [3.5, -13, 1.3], [-1, -15, 1], [5, -3, 1.1]]) { g.beginPath(); g.arc(q[0], q[1], q[2], 0, TAU); g.fill(); } el(g, 10, -29, 2.2, 2.2, 'rgba(255,240,170,' + (0.5 + k * 0.4).toFixed(2) + ')'); },
    chapEtoile(g, t) { po(g, [-11, 5, -10, -3, -3, -10, 6, -11, 14, -6, 17, 3, 13, 0, 9, 5], '#6a3fa8'); rc(g, -11.5, 2.5, 21.5, 3.6, '#efe6ff'); const b = Math.sin(t * 2.4) * 1.5, sx = 17.5, sy = 6 + b; g.strokeStyle = '#6a3fa8'; g.lineWidth = 1; g.beginPath(); g.moveTo(17, 3); g.lineTo(sx, sy); g.stroke(); g.fillStyle = '#ffe36b'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 1.9 : 4.4; g.lineTo(sx + Math.cos(a) * r, sy + 3 + Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; for (const q of [[-5, -3], [2, -6], [8, -2]]) { g.beginPath(); g.arc(q[0], q[1], 0.9, 0, TAU); g.fill(); } },
    chapSorciere(g) { el(g, 0, 5, 20, 5, '#1c1822'); po(g, [-10, 4.5, -6, -10, -1, -22, -9, -31, 5, -20, 10, 4.5], '#2a2432'); po(g, [-1, -22, -9, -31, -3, -24], '#1c1822'); rc(g, -9.6, 0, 19.8, 3.6, '#5a2a78'); rc(g, -2.6, -0.6, 5.2, 4.8, '#d8b040'); rc(g, -1.3, 0.7, 2.6, 2.2, '#5a2a78'); rc(g, 4, -14, 1.4, 12, 'rgba(255,255,255,0.08)'); },
    chapCornes(g, t) { for (const s of [-1, 1]) { po(g, [s * 5, 4, s * 12, 2, s * 15, -6, s * 13, -15, s * 10, -7, s * 6, -3], '#c22a22'); po(g, [s * 13, -15, s * 15, -6, s * 12.5, -9], '#7a1414'); g.strokeStyle = 'rgba(255,200,170,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s * 7, 0); g.quadraticCurveTo(s * 11, -3, s * 12.6, -11); g.stroke(); } el(g, 0, 3, 7, 2.4, '#3a1414'); const k = 0.25 + Math.sin(t * 6) * 0.1; el(g, -13, -15, 3.4, 3.4, 'rgba(255,120,40,' + k.toFixed(2) + ')'); el(g, 13, -15, 3.4, 3.4, 'rgba(255,120,40,' + k.toFixed(2) + ')'); },
    chapMineur(g, t, dos) { el(g, 0, 2, 11.5, 8.5, '#7c7f8a'); rc(g, -11.5, 2, 23, 4.2, '#7c7f8a'); rc(g, -13, 5, 26, 2.6, '#565962'); rc(g, -1.2, -6.5, 2.4, 9, '#9a9da8'); el(g, -4.5, -2, 3, 2, 'rgba(255,255,255,0.18)'); if (dos) return;
      rc(g, -2.6, -1, 5.2, 4.4, '#44464e'); rc(g, -1.1, -6, 2.2, 5.2, '#f2ead0'); const f = Math.sin(t * 13) * 0.8; el(g, 0, -9.5, 5.5 + f, 5.5 + f, 'rgba(255,200,90,0.22)'); po(g, [-2, -6.2, 0, -12.5 - f, 2, -6.2], '#ffb432'); po(g, [-1, -6.2, 0, -9.6, 1, -6.2], '#fff0b0'); }
  };
  Cp.HAUT = 33; /* du sol au sommet du crâne du chef, en pixels (à l'échelle 1) */
  const ag0 = Art.goblin; Art.goblin = function (g, o) {
    const it = o && o.chief && o.noHat !== true ? Cp.porte() : null; if (!it) return ag0.apply(this, arguments);
    const a = Array.prototype.slice.call(arguments); a[1] = Object.assign({}, o, { noHat: true }); const r = ag0.apply(this, a), f = Cp.DESSIN[it.k]; if (!f) return r;
    const s = o.s || 1, e = o.ent, dir = (e && e.dir8) || (o.moving ? ((o.face || 1) < 0 ? 'W' : 'E') : 'S'), dos = dir === 'N' || dir === 'NE' || dir === 'NW', t = o.t || 0, pas = o.moving ? Math.abs(Math.sin((o.step || 0) * TAU)) * 1.5 : 0;
    g.save(); if (o.alpha !== undefined) g.globalAlpha = o.alpha; g.translate(o.x, o.y - (Cp.HAUT + pas) * s); g.scale(s * (dir === 'W' || dir === 'NW' || dir === 'SW' ? -1 : 1), s); try { f(g, t, dos); } catch (x) { /* jamais bloquant */ } g.restore(); return r;
  };
})(window.CG);
