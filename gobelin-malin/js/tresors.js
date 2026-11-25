// Goblin Malin — trois trouvailles :
//   1) rarement, un coffre cache un objet qui augmente pour toujours la vie ou le mana (+1, +2 ou +3) ;
//   2) la Fontaine de mana, à bâtir : tout près d'elle, le mana remonte deux fois plus vite ;
//   3) le puits magique, quelque part sur la carte, à un nouvel endroit chaque jour : on y jette 1, 2 ou 5 pièces d'or. Souvent, rien...
//      et parfois une voix répond et donne un pouvoir passager, petit, moyen ou gros.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, pick = CG.pick, rand = CG.rand;
  const Tr = CG.Tresors = { COFFRE: 0.08, POIDS: [[1, 0.5], [2, 0.35], [3, 0.15]], FONTAINE: 180 };
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const tirer = l => { let r = Math.random(); for (const q of l) { r -= q[1]; if (r < 0) return q[0]; } return l[0][0]; };

  // ---------- 1. les objets rares des coffres ----------
  const oc0 = D.openChest; D.openChest = function (c) {
    const r = oc0.apply(this, arguments); if (!c || c.kind === 'piege' || Math.random() >= Tr.COFFRE) return r;
    const p = CG.S.player, n = tirer(Tr.POIDS), vie = Math.random() < 0.5;
    G.drop(c.x, c.y, { kind: vie ? 'coeurOr' : 'manaOr', n }); void p; // il ne va plus tout seul dans la poche : il tombe par terre, à ramasser (objets.js)
    G.puff(c.x, c.y - 20, '#ffd84a', 26, 150, 4); CG.sfx('discovery');
    G.banner(vie ? '💛 Un cœur d\'or !' : '💛 Une perle d\'or !', 'Un objet rare est tombé du coffre. Ramasse-le !', '#ffe9a8');
    return r;
  };

  // ---------- 2. la Fontaine de mana ----------
  CG.BUILDS.fontaine = { nom: 'Fontaine de mana', icon: '⛲', w: 1, h: 1, cat: 'magie', cout: { bois: 10, minerai: 30, or: 80 }, desc: 'Une eau bleue qui ne tarit jamais. Tant que tu restes tout près, ton mana remonte deux fois plus vite.' };
  // elle se gagne dans l'arbre des technologies (branche de la sorcellerie) ; celles déjà bâties restent
  CG.BUILDS.fontaine.tech = 'fm1';
  { const n = { id: 'fm1', br: 'sorc', rang: 0.15, cout: 2, t: 5, r: 0, icon: '⛲', nom: 'Fontaine de mana', desc: 'Révèle la Fontaine de mana : tant que tu restes tout près, ton mana remonte deux fois plus vite.', unlock: ['fontaine'] }; CG.TECH.push(n); if (CG.TECH_BY_ID) CG.TECH_BY_ID[n.id] = n; }
  Tr.presFontaine = function () { const S = CG.S; if (!S) return false; const p = S.player; for (const b of S.buildings) if (b.type === 'fontaine' && !b.site && Math.hypot((b.tx + 0.5) * T - p.x, (b.ty + 0.5) * T - p.y) < Tr.FONTAINE) return true; return false; };
  { let memo = false, mt = 0; const up = G.update; G.update = function (dt) { up.apply(this, arguments); mt -= dt; if (mt > 0) return; mt = 0.3; const v = Tr.presFontaine(); memo = v; Tr._pres = v; }; }
  // près de la fontaine : pas de message, seulement une lueur bleue aux pieds du chef
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); if (!Tr._pres || !CG.S || !CG.R || CG.R.ko > 0) return; const p = CG.S.player, k = 0.75 + Math.sin(t * 3) * 0.25;
    g.save(); g.globalAlpha = 0.42 * k; g.fillStyle = '#3a98ff'; g.beginPath(); g.ellipse(p.x, p.y + 2, 24, 10, 0, 0, TAU); g.fill(); g.globalAlpha = 0.4 * k; g.fillStyle = '#9ad8ff'; g.beginPath(); g.ellipse(p.x, p.y + 2, 15, 6, 0, 0, TAU); g.fill();
    g.globalAlpha = 0.95 * k; g.strokeStyle = '#6ab8ff'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(p.x, p.y + 2, 23 + Math.sin(t * 3) * 1.5, 9.5 + Math.sin(t * 3) * 0.6, 0, 0, TAU); g.stroke(); g.restore(); }; }
  const mr0 = G.manaRegen; G.manaRegen = function () { return mr0.apply(this, arguments) * (Tr._pres ? 2 : 1); };
  Art.extra.fontaine = { w: 60, h: 64, draw(c) {
    ell(c, 30, 56, 27, 6.5, 'rgba(0,0,0,0.25)'); ell(c, 30, 48, 25, 9, '#8d8981'); ell(c, 30, 45, 25, 9, '#a9a59c'); ell(c, 30, 45, 20.5, 6.6, '#2f7fd8'); ell(c, 25, 44, 8, 2, '#8fd0ff');
    c.fillStyle = '#8d8981'; c.fillRect(27, 22, 6, 23); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(27, 22, 2, 23); ell(c, 30, 22, 11, 4, '#a9a59c'); ell(c, 30, 21, 8.4, 2.6, '#4a9cf0');
    c.fillStyle = '#c8d0e0'; c.beginPath(); c.moveTo(30, 6); c.lineTo(34, 15); c.lineTo(30, 20); c.lineTo(26, 15); c.closePath(); c.fill(); c.fillStyle = '#7dc8ff'; c.beginPath(); c.moveTo(30, 6); c.lineTo(34, 15); c.lineTo(30, 20); c.closePath(); c.fill();
  }, anim(g, cx, by, t) {
    g.strokeStyle = 'rgba(150,215,255,0.8)'; g.lineWidth = 1.6; g.lineCap = 'round'; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(cx + s * 6, by - 42); g.quadraticCurveTo(cx + s * 15, by - 40 + Math.sin(t * 6) * 0.6, cx + s * 14, by - 22); g.stroke(); });
    for (let i = 0; i < 5; i++) { const k = (t * 0.35 + i / 5) % 1; g.globalAlpha = (1 - k) * 0.85; ell(g, cx - 12 + i * 6 + Math.sin(t * 2 + i * 2) * 3, by - 50 - k * 30, 1.6 + (1 - k), 1.6 + (1 - k), i % 2 ? '#bfe6ff' : '#7dc8ff'); } g.globalAlpha = 1;
    ell(g, cx, by - 56, 5 + Math.sin(t * 4) * 1, 5 + Math.sin(t * 4) * 1, 'rgba(140,210,255,0.35)');
  } };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'fontaine', ic: '⛲', nom: () => 'Fontaine de mana', txt: 'Ton mana remonte deux fois plus vite tant que tu restes près de la fontaine.', t: () => Tr._pres ? true : 0, fin: () => 'près de la fontaine' });

  // la peau du chef devient grise comme la pierre tant qu'un pouvoir le durcit : Statue de Pierre, Peau de pierre de Dame Ortie, Pierre du puits
  CG.peauDePierre = () => { const S = CG.S; if (!S) return false; if (CG.Statues && CG.Statues.actif && CG.Statues.actif('pierre')) return true; const e = CG.Sorciere && CG.Sorciere.actif(); if (e && e.id === 'pierre') return true; const v = S.voix; return !!(v && v.t > 0 && v.id === 'peau'); };
  // ---------- 3. le puits magique ----------
  const Pu = CG.Puits = { COUPS: [1, 7], MIN: 16, LANCERS: 7, REPOND: { 1: 0.22, 2: 0.36, 5: 0.6 }, NIVEAU: { 1: [[1, 0.82], [2, 0.16], [3, 0.02]], 2: [[1, 0.66], [2, 0.28], [3, 0.06]], 5: [[1, 0.44], [2, 0.38], [3, 0.18]] }, DUREE: [0, 180, 240, 300], TAILLE: ['', 'petit', 'moyen', 'gros'],
    DON: 0.25, DON_VIE: [0, 10, 20, 35], DON_MANA: [0, 5, 10, 18] }; // DON : quand le puits répond, la chance que ce soit un don pour toujours (vie ou mana maximum) plutôt qu'un pouvoir qui passe
  Pu.V = {
    vit: { ic: '🌬️', nom: 'Souffle du puits', v: [0, 0.08, 0.16, 0.3], txt: n => 'Tu cours ' + Math.round(n * 100) + ' % plus vite.' },
    force: { ic: '🔥', nom: 'Braise du fond', v: [0, 0.1, 0.2, 0.4], txt: n => 'Tu frappes ' + Math.round(n * 100) + ' % plus fort.' },
    peau: { ic: '🪨', nom: 'Pierre du puits', v: [0, 0.1, 0.2, 0.35], txt: n => 'Tu reçois ' + Math.round(n * 100) + ' % de dégâts en moins.' },
    mana: { ic: '🌊', nom: 'Eau profonde', v: [0, 1, 2, 4], txt: n => 'Ton mana remonte de ' + n + ' point' + (n > 1 ? 's' : '') + ' par seconde en plus.' },
    vie: { ic: '🌿', nom: 'Mousse du puits', v: [0, 0.5, 1, 2.5], txt: n => 'Ta vie remonte toute seule, ' + String(n).replace('.', ',') + ' point' + (n > 1 ? 's' : '') + ' par seconde.' },
    savoir: { ic: '👁️', nom: 'Écho ancien', v: [0, 0.15, 0.3, 0.6], txt: n => 'Tu gagnes ' + Math.round(n * 100) + ' % d\'expérience en plus.' }
  };
  const VOIX = ['« ... Merci, petite chose verte... »', '« ... Encore... non. Assez. Tiens... »', '« ... Qui... réveille... le fond ?... Prends... »', '« ... Ça brille... J\'aime... ce qui brille... »', '« ... Chhh... Approche... Voilà... pour toi... »', '« ... Longtemps... que personne... n\'avait rien jeté... »'];
  const SILENCE = ['Plouf... Puis plus rien. Silence.', 'La pièce tombe longtemps. Rien ne répond.', 'Un petit « ploc » tout au fond. C\'est tout.', 'Tu tends l\'oreille... Rien. Juste le vent.', 'Silence. Le puits garde ta pièce.'];
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('voix')) CG.Mondes.GLOBAL.push('voix');
  const etat = () => { const S = CG.S, e = S && S.voix; return e && e.t > 0 && Pu.V[e.id] ? e : null; };
  const val = id => { const e = etat(); return e && e.id === id ? Pu.V[id].v[e.niv] : 0; };
  Pu.actif = etat;
  const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (1 + val('vit')); };
  const pd0 = G.playerDmg; G.playerDmg = function () { return pd0.apply(this, arguments) * (1 + val('force')); };
  const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { return hp0.call(this, dmg * (1 - val('peau'))); };
  const mr1 = G.manaRegen; G.manaRegen = function () { return mr1.apply(this, arguments) + val('mana'); };
  const ax0 = G.addXp; G.addXp = function (n) { const k = val('savoir'); return ax0.call(this, k && n > 0 ? n * (1 + k) : n); };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'voix', ic: () => Pu.V[etat().id].ic, nom: () => Pu.V[etat().id].nom + ' (' + Pu.TAILLE[etat().niv] + ' pouvoir du puits)', txt: () => { const e = etat(), V = Pu.V[e.id]; return V.txt(V.v[e.niv]); }, t: () => { const e = etat(); return e ? Math.max(0.1, e.t) : 0; } });
  // où il est aujourd'hui : loin du village, sur une case où l'on peut marcher, atteignable à pied
  Pu.ici = function () {
    const S = CG.S; if (!S || (CG.Mondes && CG.Mondes.ici() > 1)) return null; let q = S.puits;
    if (!q || q.day !== S.day || q.m !== (S.monde || 0)) {
      q = S.puits = { day: S.day, m: S.monde || 0, x: -1, y: -1, lancers: 0, parle: false }; const f = W.field ? W.field() : null;
      for (let k = 0; k < 500; k++) { const tx = CG.irand(4, CG.MW - 5), ty = CG.irand(4, CG.MH - 5), i = W.idx(tx, ty);
        if (!W.walkTile(tx, ty) || !W.walkTile(tx, ty + 1) || (f && f[i] < 0) || W.tile[i] === W.FLAT || Math.hypot(tx - W.CX, ty - W.CY) < Pu.MIN) continue;
        if ((W.nodes || []).some(n => Math.abs(n.x - tx) < 2 && Math.abs(n.y - ty) < 2) || S.buildings.some(b => Math.abs(b.tx - tx) < 4 && Math.abs(b.ty - ty) < 4) || (W.sites || []).some(s => Math.hypot(s.x - tx, s.y - ty) < s.r + 2)) continue;
        q.x = tx; q.y = ty; break; }
    }
    return q.x >= 0 ? q : null;
  };
  // le puits devient gourmand : chaque pièce jetée fait monter le prix de la suivante, pour toujours (HAUSSE). Une vieille partie démarre déjà haut (DEPART par jour passé).
  Pu.HAUSSE = 1; Pu.DEPART = 0; Pu.DEPART_MAX = 30; /* plus de hausse (avant : 1,15 par pièce jetée, pour toujours, et 2 crans par jour passé : au jour 5 une pièce coûtait déjà 80). Remettre HAUSSE au-dessus de 1 pour qu'il redevienne gourmand */
  Pu.fois = () => { const S = CG.S; if (S.puitsN === undefined) S.puitsN = Math.min(Pu.DEPART_MAX, Math.max(0, (S.day - 1) * Pu.DEPART)); return Math.pow(Pu.HAUSSE, S.puitsN); };
  Pu.CHER = 2; /* tout coûte le double au puits */
  Pu.prix = n => Math.max(n, Math.round(n * Pu.CHER * Pu.fois()));
  Pu.payer = n => { const S = CG.S, c = Pu.prix(n); S.res.or -= c; S.puitsN++; return c; };
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('puitsN')) CG.Mondes.GLOBAL.push('puitsN');
  const pos = q => ({ x: q.x * T + T / 2, y: q.y * T + T / 2 });
  Pu.pos = () => { const q = Pu.ici(); return q ? pos(q) : null; };
  Pu.jeter = function (n) {
    const S = CG.S, R = CG.R, q = Pu.ici(), p = S.player; if (!q || S.res.or < Pu.prix(n) || q.parle || q.lancers >= Pu.LANCERS || R.puitsT) return; Pu.payer(n); q.lancers++; const c = pos(q);
    CG.sfx('coin'); R.puitsPiece = { t: 0, x0: p.x, y0: p.y - 30, x1: c.x, y1: c.y - 9 }; // la pièce part de la main du chef et tombe dans le puits (voir le dessin plus bas)
    if (!(q.sourd >= 1)) q.sourd = Pu.COUPS[0] + Math.floor(Math.random() * (Pu.COUPS[1] - Pu.COUPS[0] + 1)); /* chaque jour, le puits choisit en secret combien de pièces il veut (de 1 à 7) : rien avant, et à celle-là il répond à coup sûr */
    R.puitsT = { t: 1.5, n, repond: q.lancers >= q.sourd };
  };
  function reponse(n, repond, muet) {
    const S = CG.S, R = CG.R, q = Pu.ici(), p = S.player; if (!q) return; const c = pos(q);
    if (!repond) return { silence: '' }; // rien : pas un mot, pas un signe
    const niv = tirer(Pu.NIVEAU[n]), don = Math.random() < Pu.DON ? (Math.random() < 0.5 ? 'vie' : 'mana') : null, id = pick(Object.keys(Pu.V)), V = Pu.V[id]; q.parle = true;
    if (don === 'vie') { p.maxhp += Pu.DON_VIE[niv]; p.hp += Pu.DON_VIE[niv]; } else if (don === 'mana') { p.maxmp += Pu.DON_MANA[niv]; p.mp += Pu.DON_MANA[niv]; } else S.voix = { id, niv, t: Pu.DUREE[niv], max: Pu.DUREE[niv] };
    const col = ['', '#bfe6ff', '#b0a0ff', '#ffd84a'][niv];
    for (let i = 0; i < 2 + niv; i++) R.rings.push({ x: c.x, y: c.y - 10, r: 50 + i * 44, life: Math.min(0.95, 0.45 + i * 0.12), col }); G.puff(c.x, c.y - 30, col, 20 + niv * 12, 160 + niv * 40, 5); G.puff(p.x, p.y - 24, col, 16, 120, 4);
    CG.sfx(niv === 3 ? 'victory' : 'discovery'); R.shake = Math.max(R.shake || 0, niv * 0.12);
    const voix = pick(VOIX), quoi = don === 'vie' ? '❤️ Don de vie' : don === 'mana' ? '💧 Don de mana' : V.ic + ' ' + V.nom, detail = don ? 'Un ' + Pu.TAILLE[niv] + ' don, pour toujours : +' + (don === 'vie' ? Pu.DON_VIE[niv] + ' de vie maximum' : Pu.DON_MANA[niv] + ' de mana maximum') : 'Un ' + Pu.TAILLE[niv] + ' pouvoir : ' + V.txt(V.v[niv]) + ' (' + Math.round(Pu.DUREE[niv] / 60) + ' minutes)';
    if (don) G.text(p.x, p.y - 70, don === 'vie' ? '❤️ +' + Pu.DON_VIE[niv] + ' vie max' : '💧 +' + Pu.DON_MANA[niv] + ' mana max', col, true);
    if (!muet) G.banner(quoi, don ? detail : V.txt(V.v[niv]) + ' (' + Math.round(Pu.DUREE[niv] / 60) + ' minutes)', col); return { voix, quoi, detail, col, niv };
  }
  Pu.reponse = reponse;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return;
    if (R.puitsPiece) { R.puitsPiece.t += dt; if (R.puitsPiece.t > Pu.VOL + 0.75) R.puitsPiece = null; }
    if (R.puitsT) { R.puitsT.t -= dt; if (R.puitsT.t <= 0) { const a = R.puitsT; R.puitsT = null; Pu.reponse(a.n, a.repond); } }
    const e = etat(); if (!e) { if (S.voix) S.voix = null; return; } if (R.night || R.cine) return; e.t -= dt; const p = S.player;
    if (e.id === 'vie' && p.hp < p.maxhp && !(R.ko > 0)) p.hp = Math.min(p.maxhp, p.hp + Pu.V.vie.v[e.niv] * dt);
    if (e.t <= 0) { const V = Pu.V[e.id]; S.voix = null; UI.toast(V.ic + ' ' + V.nom + ' : le pouvoir du puits s\'est éteint.'); }
  };
  Pu.parler = function () {
    const S = CG.S, q = Pu.ici(); if (!q) return; const or = Math.floor(S.res.or), fini = q.parle || q.lancers >= Pu.LANCERS;
    const opt = k => ({ k, n: Pu.prix(k) }), opt2 = ({ k, n }) => ({ label: '🪙 Jeter ' + n + ' pièce' + (n > 1 ? 's' : '') + ' d\'or', sub: or < n ? 'Tu n\'as que ' + or + ' 🪙' : k === 1 ? 'On ne sait jamais...' : k === 2 ? 'Un peu plus de chances qu\'on te réponde' : 'Le puits aime ce qui brille : plus de chances, et de plus gros pouvoirs', disabled: or < n, fn: () => Pu.jeter(k) });
    UI.dialog({ who: 'Le puits magique', tag: fini ? '🕳️ muet pour aujourd\'hui' : '🕳️ ' + (Pu.LANCERS - q.lancers) + ' essai' + (Pu.LANCERS - q.lancers > 1 ? 's' : '') + ' aujourd\'hui',
      text: q.parle ? 'Tu te penches. L\'eau noire ne bouge plus. Ce qui vit là-dessous a déjà parlé aujourd\'hui : il ne dira plus rien avant demain... et demain, le puits sera ailleurs.' : q.lancers >= Pu.LANCERS ? 'Le puits est plein d\'échos. Il ne répondra plus aujourd\'hui.' : 'Un vieux puits couvert de mousse, que personne n\'a creusé. Il n\'était pas là hier. On n\'en voit pas le fond... mais on dirait que quelque chose écoute. Tu jettes une pièce ?',
      options: (fini ? [] : [opt2(opt(1)), opt2(opt(2)), opt2(opt(5))]).concat([{ label: '👋 S\'éloigner' }]) });
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R; if (R.ko > 0 || R.cine || R.build) return it; const c = Pu.pos(); if (!c) return it; const p = CG.S.player;
    if (Math.hypot(p.x - c.x, p.y - (c.y + 10)) < 50 && (!it || (it.type !== 'visitor' && it.type !== 'goblin'))) { const q = Pu.ici(); if (!q || q.parle || q.lancers >= Pu.LANCERS) return it; return { type: 'puitsMagique', obj: { x: c.x, y: c.y - 44 }, label: 'Jeter ' + Pu.prix(Pu.MISE) + ' 🪙 dans le puits' }; } return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'puitsMagique') return in0.apply(this, arguments); if (CG.R.puitsT) return; if (CG.S.res.or < Pu.prix(Pu.MISE)) { CG.sfx('no'); CG.UI.toast('Le puits veut ' + Pu.prix(Pu.MISE) + ' 🪙 maintenant. Il devient gourmand.'); return; } Pu.jeter(Pu.MISE); };
  // la pièce : elle tourne en l'air, plonge dans le trou, et l'eau noire fait un rond
  Pu.MISE = 5; Pu.VOL = 0.6;
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const a = CG.R && CG.R.puitsPiece; if (!a) return; const k = a.t / Pu.VOL;
    if (k < 1) { const x = a.x0 + (a.x1 - a.x0) * k, y = a.y0 + (a.y1 - a.y0) * k - Math.sin(k * Math.PI) * 54, rx = 1.2 + Math.abs(Math.cos(a.t * 16)) * 4.6; ell(g, x, y, rx, 5.6, '#b8860b'); ell(g, x, y - 0.6, Math.max(0.6, rx - 1), 4.6, '#ffd84a'); ell(g, x - rx * 0.3, y - 2, Math.max(0.4, rx * 0.3), 1.4, 'rgba(255,255,255,0.8)');
      if (k > 0.1) { g.globalAlpha = 0.35; ell(g, a.x0 + (a.x1 - a.x0) * (k - 0.08), a.y0 + (a.y1 - a.y0) * (k - 0.08) - Math.sin((k - 0.08) * Math.PI) * 54, 2.2, 2.2, '#fff3a8'); g.globalAlpha = 1; } }
    else { const q = (a.t - Pu.VOL) / 0.75; if (q < 0.25) { g.globalAlpha = 1 - q * 4; ell(g, a.x1, a.y1 + q * 16, 3.4 * (1 - q * 2), 4 * (1 - q * 2), '#ffd84a'); g.globalAlpha = 1; }
      g.save(); g.globalAlpha = Math.max(0, 1 - q) * 0.8; g.strokeStyle = '#aebcff'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(a.x1, a.y1 + 1, 3 + q * 10, 1 + q * 3, 0, 0, Math.PI * 2); g.stroke(); g.restore(); } }; }
  // son dessin : margelle de pierre moussue, petit toit, et une lueur qui monte du fond
  const dessin = { x: 0, y: 0, draw(g, o, t) {
    const x = o.x, y = o.y, q = Pu.ici(), eteint = q && (q.parle || q.lancers >= Pu.LANCERS), pu = 0.5 + Math.sin(t * 2.2) * 0.5;
    ell(g, x, y + 8, 24, 7, 'rgba(0,0,0,0.26)');
    if (!eteint) ell(g, x, y - 6, 34, 26, 'rgba(120,150,255,' + (0.1 + pu * 0.07) + ')');
    g.fillStyle = '#5a3d22'; g.fillRect(x - 17, y - 40, 3.4, 34); g.fillRect(x + 13.6, y - 40, 3.4, 34); // les montants
    g.fillStyle = '#77726a'; g.beginPath(); g.moveTo(x - 19, y - 8); g.lineTo(x - 19, y + 4); g.quadraticCurveTo(x, y + 13, x + 19, y + 4); g.lineTo(x + 19, y - 8); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,38,34,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 19, y - 1); g.quadraticCurveTo(x, y + 7, x + 19, y - 1); [-10, 0, 10].forEach(d => { g.moveTo(x + d, y - 3); g.lineTo(x + d, y + 9); }); g.stroke();
    ell(g, x, y - 8, 19, 6.4, '#928d84'); ell(g, x, y - 8, 14.6, 4.4, '#0c0a18'); if (!eteint) { ell(g, x, y - 7.6, 9 + pu * 2, 2.6 + pu * 0.6, 'rgba(110,140,255,' + (0.35 + pu * 0.3) + ')'); ell(g, x - 2, y - 8, 3, 1, 'rgba(210,225,255,0.7)'); }
    [[-15, -4, 5], [9, 2, 6], [-4, 6, 4], [15, -5, 3.5]].forEach(m => ell(g, x + m[0], y + m[1], m[2], m[2] * 0.5, '#5f8f3a')); // la mousse
    g.fillStyle = '#6a3a22'; g.beginPath(); g.moveTo(x - 23, y - 38); g.lineTo(x, y - 54); g.lineTo(x + 23, y - 38); g.closePath(); g.fill(); g.fillStyle = '#8a5030'; g.beginPath(); g.moveTo(x - 23, y - 38); g.lineTo(x, y - 54); g.lineTo(x, y - 38); g.closePath(); g.fill();
    g.strokeStyle = '#3a2a18'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 38); g.lineTo(x, y - 20); g.stroke(); g.fillStyle = '#5a4630'; g.fillRect(x - 3, y - 21, 6, 6); // la corde et le seau
    if (!eteint) for (let i = 0; i < 4; i++) { const k = (t * 0.3 + i / 4) % 1; g.globalAlpha = (1 - k) * 0.9; ell(g, x - 9 + i * 6 + Math.sin(t * 1.7 + i * 2) * 3, y - 10 - k * 40, 1.5 + (1 - k), 1.5 + (1 - k), i % 2 ? '#c8d4ff' : '#8f9cff'); } g.globalAlpha = 1;
  } };
  if (CG.Armee) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const c = Pu.pos(); if (c && CG.onScreen(c.x, c.y)) { dessin.x = c.x; dessin.y = c.y; push(c.y + 6, 21, dessin, null); } }; }
})(window.CG);
