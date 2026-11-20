// Goblin Malin — les petites fées de passage. Contre un peu de nourriture, une fée te donne une bénédiction :
// que du bon, pas de mauvais côté (au contraire de Dame Ortie), et ça dure cinq minutes. Tu choisis parmi trois.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Art = CG.Art, W = CG.W, TAU = Math.PI * 2, pick = CG.pick, rand = CG.rand;
  const Fe = CG.Fee = { CHANCE: 0.3, JOUR: 2, DUREE: 300, CHOIX: 3 };
  Fe.prix = () => 12 + 3 * CG.S.day; // en nourriture
  Fe.NOMS = ['Rosée', 'Pétale', 'Luciole', 'Brindille', 'Clochette des bois', 'Mousseline', 'Étincelle'];
  Fe.B = {
    ailes: { ic: '🪽', nom: 'Pieds légers', txt: 'Tu cours 30 % plus vite.' },
    bras: { ic: '✊', nom: 'Bras vaillant', txt: 'Tu frappes 30 % plus fort.' },
    ecorce: { ic: '🌰', nom: 'Peau d\'écorce', txt: 'Tu reçois 25 % de dégâts en moins.' },
    rosee: { ic: '💧', nom: 'Rosée du matin', txt: 'Ton mana remonte de 3 points par seconde.' },
    seve: { ic: '🌱', nom: 'Sève douce', txt: 'Ta vie remonte toute seule, 1,5 point par seconde.' },
    trefle: { ic: '🍀', nom: 'Trèfle à quatre feuilles', txt: 'L\'or que tu ramasses vaut moitié plus.' }
  };
  const etat = () => { const S = CG.S, e = S && S.benie; return e && e.t > 0 && Fe.B[e.id] ? e : null; };
  const a = id => { const e = etat(); return !!e && e.id === id; };
  Fe.actif = etat;
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('benie')) CG.Mondes.GLOBAL.push('benie');
  Fe.benir = function (id) {
    const S = CG.S, R = CG.R, p = S.player, B = Fe.B[id]; if (!B) return; S.benie = { id, t: Fe.DUREE, max: Fe.DUREE };
    G.puff(p.x, p.y - 24, '#ffe9a8', 30, 170, 4); G.puff(p.x, p.y - 30, '#ffb0e0', 18, 130, 3); for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 46 + i * 36, life: 0.4 + i * 0.15, col: i % 2 ? '#ffb0e0' : '#ffe9a8' });
    CG.sfx('heal'); G.banner(B.ic + ' ' + B.nom, B.txt + ' La bénédiction dure cinq minutes.', '#ffe0f0');
  };
  // ---------- les effets ----------
  const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (a('ailes') ? 1.3 : 1); };
  const pd0 = G.playerDmg; G.playerDmg = function () { return pd0.apply(this, arguments) * (a('bras') ? 1.3 : 1); };
  const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { return hp0.call(this, a('ecorce') ? dmg * 0.75 : dmg); };
  const mr0 = G.manaRegen; G.manaRegen = function () { return mr0.apply(this, arguments) + (a('rosee') ? 3 : 0); };
  const ga0 = G.gain; G.gain = function (res, n, x, y) { if (res === 'or' && n > 0 && a('trefle')) n = Math.round(n * 1.5); return ga0.call(this, res, n, x, y); };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const e = etat(); if (!e) { if (S.benie) S.benie = null; return; }
    if (R.night || R.cine) return; e.t -= dt; const p = S.player;
    if (e.id === 'seve' && p.hp < p.maxhp && !(R.ko > 0)) p.hp = Math.min(p.maxhp, p.hp + 1.5 * dt);
    if (e.t <= 0) { const B = Fe.B[e.id]; S.benie = null; G.puff(p.x, p.y - 24, '#ffe9a8', 14, 100, 3); UI.toast(B.ic + ' ' + B.nom + ' : la bénédiction de la fée s\'est envolée.'); }
  };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'benie', ic: () => Fe.B[etat().id].ic, nom: () => 'Bénédiction : ' + Fe.B[etat().id].nom, txt: () => Fe.B[etat().id].txt, t: () => { const e = etat(); return e ? Math.max(0.1, e.t) : 0; } });

  // ---------- la visite ----------
  const pl0 = D.plan; D.plan = function () {
    const r = pl0.apply(this, arguments), S = CG.S, R = CG.R; if (!R.schedule || S.day < Fe.JOUR || Math.random() > Fe.CHANCE) return r;
    if (CG.Mondes && (CG.Mondes.ici() === 2 || !CG.Mondes.feuIci())) return r;
    R.schedule.push({ h: rand(7.5, 16), type: 'visit', role: 'fee' }); R.schedule.sort((x, y) => x.h - y.h); return r;
  };
  Fe.venir = function () {
    const S = CG.S, R = CG.R, en = pick(['ouest', 'est', 'sud']), e = W.EXITS[en], f = G.firePos(), ex = W.center(e.x, e.y);
    const v = { id: S.nextId++, role: 'fee', look: 'fee', nom: pick(Fe.NOMS), x: ex.x, y: ex.y, face: 1, step: 0, moving: false, state: 'arrive', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 4), dest: { x: f.x - 20, y: f.y + 104 }, prix: Fe.prix(),
      choix: CG.shuffle(Object.keys(Fe.B)).slice(0, Fe.CHOIX), teinte: pick(['#ff9ad0', '#9ad8ff', '#b8f08a', '#ffd86a', '#d0a8ff']) };
    if (!G.goTo(v, v.dest.x, v.dest.y)) return null; R.visitors.push(v);
    v.annonce = ['Une petite fée', 'Une lueur volette près de ton feu. Va lui parler (E).', '#ffe0f0']; return v;
  };
  const partir = v => { if (CG.R.visitors.includes(v)) { v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); } };
  Fe.parler = function (v) {
    const S = CG.S, e = etat(), prix = v.prix || Fe.prix(), peut = S.res.food >= prix, qui = v.nom + ', petite fée';
    if (v.fait) return UI.dialog({ visitor: v, who: qui, text: 'Hi hi ! Une seule par visite, grand chef vert. J\'ai le ventre plein, je vais faire la sieste dans une fleur.', options: [{ label: 'Bonne sieste !' }] });
    UI.dialog({ visitor: v, who: qui, tag: '✨ une bénédiction',
      text: 'Bonjour, grand chef vert ! J\'ai volé toute la matinée et j\'ai une faim de loup. Donne-moi ' + prix + ' 🍖 et je te bénis : rien que du bon, promis, pas comme la vieille au chaudron. Choisis celle que tu veux, elle dure cinq minutes.' + (e ? ' (Tu portes déjà une bénédiction : la nouvelle la remplacera.)' : ''),
      options: v.choix.map(id => ({ label: Fe.B[id].ic + ' ' + Fe.B[id].nom + ' (' + prix + ' 🍖)', sub: peut ? Fe.B[id].txt : 'Tu n\'as que ' + Math.floor(S.res.food) + ' 🍖', disabled: !peut, fn: () => {
        if (S.res.food < prix || v.fait) return; S.res.food -= prix; v.fait = true; G.say(v, pick(['Miam ! Merci ! Ferme les yeux... Voilà !', 'Oh, c\'est bon ! Tiens, grand chef : pfiou !', 'Un souffle, une étincelle... et hop, te voilà béni !']), 4);
        Fe.benir(id); v.leaveAt = Math.min(v.leaveAt, S.hour + 0.4);
      } })).concat([{ label: '🤔 Je vais y penser', sub: 'Elle volette encore un peu près du feu' }, { label: '👋 Non merci, petite fée', sub: 'Elle repart en zigzaguant', fn: () => partir(v) }]) });
  };
  const sv0 = D.startVisit; D.startVisit = function (ev) { if (ev.role === 'fee') return Fe.venir(); return sv0.apply(this, arguments); };
  const tk0 = D.talk; D.talk = function (v) { if (v.role === 'fee') return Fe.parler(v); return tk0.apply(this, arguments); };
  // ---------- son dessin : toute petite, des ailes qui battent, une lueur et une traînée de poussière ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const vis0 = Art.visitor; Art.visitor = function (g, v, t) {
    if (v.look !== 'fee') return vis0.apply(this, arguments);
    const portrait = v.x === 0 && v.y === 0, b = t * 2.6 + (v.seed || 0), haut = portrait ? 26 : 34 + Math.sin(b) * 4, col = v.teinte || '#ff9ad0', bat = Math.sin(t * 34), k = portrait ? 1.7 : 1;
    if (!portrait) ell(g, v.x, v.y + 2, 7, 2.4, 'rgba(0,0,0,0.18)');
    g.save(); g.translate(v.x, v.y - haut); g.scale((v.face < 0 ? -1 : 1) * k, k);
    ell(g, 0, -2, 17, 17, 'rgba(255,240,190,0.16)'); ell(g, 0, -2, 10, 10, 'rgba(255,250,220,0.2)');
    if (!portrait) for (let i = 0; i < 4; i++) { const q = (b * 0.5 + i / 4) % 1; g.globalAlpha = (1 - q) * 0.9; ell(g, -6 - q * 14 + Math.sin(b * 2 + i * 2) * 2, 4 + q * 18, 1.5 * (1 - q) + 0.5, 1.5 * (1 - q) + 0.5, i % 2 ? '#fff6c0' : col); } g.globalAlpha = 1;
    g.globalAlpha = 0.72; [[-1, -0.9, 9, 4.4], [-1, 0.5, 6.5, 3.2]].forEach((q, i) => { g.save(); g.translate(-1.5, -3 + i * 3); g.rotate(q[1] + bat * (i ? 0.25 : 0.45)); ell(g, -q[2] * 0.8, 0, q[2], q[3], i ? '#d8f4ff' : '#f2fbff'); g.restore(); }); g.globalAlpha = 1; // les ailes du fond
    g.strokeStyle = '#f0d0b0'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-1.2, 5); g.lineTo(-2, 9.5 + Math.sin(b * 2) * 0.6); g.moveTo(1.2, 5); g.lineTo(1.6, 9.8 - Math.sin(b * 2) * 0.6); g.stroke(); // les petites jambes
    g.fillStyle = col; g.beginPath(); g.moveTo(-2.4, -2.5); g.lineTo(2.4, -2.5); g.lineTo(4.6, 6); g.quadraticCurveTo(2.4, 4.6, 1.5, 6.4); g.quadraticCurveTo(0, 4.8, -1.5, 6.4); g.quadraticCurveTo(-2.4, 4.6, -4.6, 6); g.closePath(); g.fill(); // la robe en pétales
    g.strokeStyle = '#f0d0b0'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(2, -1); g.lineTo(6.5, -3.5); g.stroke(); // le bras qui tient la baguette
    g.strokeStyle = '#fff6c0'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(6.5, -3.5); g.lineTo(9.5, -8); g.stroke(); const sc = 1.6 + Math.sin(t * 9) * 0.5; ell(g, 9.5, -8, sc, sc, '#fff'); ell(g, 9.5, -8, sc * 2.2, sc * 2.2, 'rgba(255,246,170,0.35)');
    ell(g, 0, -6.4, 4.2, 4.2, '#f6dcc0'); // la tête
    g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(-0.4, -7.2, 4.4, Math.PI * 0.95, Math.PI * 2.1); g.quadraticCurveTo(1, -8, -3.6, -4.4); g.closePath(); g.fill(); ell(g, -3.6, -9.6, 2, 2, '#ffe07a'); // les cheveux et le chignon
    ell(g, 1.8, -6.2, 0.7, 0.9, '#2a2030'); ell(g, 2.6, -4.9, 0.9, 0.6, 'rgba(255,130,150,0.6)');
    g.globalAlpha = 0.85; [[-1, -0.7, 8, 3.8]].forEach(q => { g.save(); g.translate(-0.5, -2.5); g.rotate(q[1] - bat * 0.4); ell(g, -q[2] * 0.8, 0, q[2], q[3], '#ffffff'); g.restore(); }); g.globalAlpha = 1; // l'aile de devant
    g.restore();
  };
})(window.CG);
