// Goblin Malin — les armes de feu et de glace : l'épée de feu, l'arc de feu, l'épée de glace, l'arc de glace.
//   Elles ne se forgent pas et ne s'achètent chez aucun marchand ordinaire : on les trouve (louche.js). Le chef seul sait s'en servir.
//   Feu : les dégâts sont des dégâts de feu (chiffres rouges), et la cible prend parfois feu.
//   Glace : la cible est parfois ralentie. Un ennemi ralenti devient bleuté, quelle que soit la cause (sort, armure de givre, arme).
//   La teinte : l'ennemi est dessiné à part, sur une petite image, puis recouvert de bleu (jamais de ctx.filter). Au plus TEINTES par image.
// Tout se règle dans CG.ArmesElem.
'use strict';
(function (CG) {
  const G = CG.G, Bq = CG.Banque, Iv = CG.Inventaire, Art = CG.Art, rand = CG.rand; if (!Bq || !Iv) return;
  const Ae = CG.ArmesElem = { CHANCE: { feu: 0.3, glace: 0.35 }, BONUS: 2, LENT: 3.5, COL: { feu: '#ff2800', glace: '#7fd0ff' }, ETINCELLE: { feu: '#ff8a1e', glace: '#cfeeff' }, TEINTE: 'rgba(60,140,255,0.5)', TEINTES: 14 };
  Ae.L = {
    epeeFeu: { base: 'epee', el: 'feu', marque: '🔥', ic: '🗡️🔥', nom: 'Épée de feu', phrase: 'Sa lame brûle sans jamais fondre. Ce qu\'elle touche prend parfois feu.' },
    arcFeu: { base: 'arc', el: 'feu', marque: '🔥', ic: '🏹🔥', nom: 'Arc de feu', phrase: 'Ses flèches s\'allument toutes seules. Ce qu\'elles touchent prend parfois feu.' },
    epeeGlace: { base: 'epee', el: 'glace', marque: '❄️', ic: '🗡️❄️', nom: 'Épée de glace', phrase: 'Froide à en coller les doigts. Ce qu\'elle touche avance parfois au ralenti.' },
    arcGlace: { base: 'arc', el: 'glace', marque: '❄️', ic: '🏹❄️', nom: 'Arc de glace', phrase: 'Ses flèches laissent du givre dans l\'air. Ce qu\'elles touchent avance parfois au ralenti.' }
  };
  Object.keys(Ae.L).forEach(k => { const o = Ae.L[k]; Bq.NOMS[k] = ['', o.nom, o.nom, o.nom, o.nom]; Bq.IC[k] = '<span class="ae-ic">' + o.ic.slice(0, -o.marque.length) + '<b>' + o.marque + '</b></span>'; /* dans le sac : l'arme, avec sa flamme ou son flocon en coin (du HTML : ces armes ne tombent jamais par terre) */ if (CG.Objets && CG.Objets.PHRASE) CG.Objets.PHRASE[k] = o.phrase; });
  { const st = document.createElement('style'); st.textContent = '.ae-ic{position:relative;display:inline-block;line-height:1}.ae-ic b{position:absolute;right:-.42em;top:-.38em;font-size:.56em;font-weight:400;line-height:1}'; document.head.appendChild(st); }
  Ae.tenue = () => { const p = CG.S && CG.S.player, a = p && p.porte && p.porte.arme; return a && Ae.L[a.k] ? Ae.L[a.k] : null; };
  Ae.donner = function (k, n) { return Bq.deposer(k, n || 1, 1, 'sac'); };
  const suite = o => (o.el === 'feu' ? 'met parfois le feu' : 'ralentit parfois');
  { const e0 = Bq.effet; Bq.effet = function (k) { return Ae.L[k] ? 'Pour le chef seulement' : e0.apply(this, arguments); };
    const i0 = Iv.effet; Iv.effet = function (it, chef) { const o = it && Ae.L[it.k]; if (!o) return i0.apply(this, arguments); if (!chef) return 'Pour le chef seulement'; return (o.base === 'epee' ? '+' + ((Iv.CHEF_EPEE[it.n] || 0) + Ae.BONUS) + ' dégâts' : 'Tire de loin') + ', ' + suite(o); }; }
  // ---------- un coup ou une flèche du chef ----------
  const at0 = G.attack; G.attack = function () { const o = Ae.tenue(), R = CG.R; if (!o || !R) return at0.apply(this, arguments); R.elemCoup = o.el; try { return at0.apply(this, arguments); } finally { R.elemCoup = null; } };
  const sh0 = G.shoot; G.shoot = function (from, to, kind, dmg, team) { const R = CG.R, n = R && R.shots ? R.shots.length : 0, r = sh0.apply(this, arguments); if (R && R.elemCoup && team === 'p') for (let i = n; i < R.shots.length; i++) R.shots[i].elem = R.elemCoup; return r; };
  let dedans = false;
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg) {
    const R = CG.R, el = R && !dedans ? (R.tirEl || R.elemCoup) : null; if (!el || !e || e.dead) return he0.apply(this, arguments);
    const a = Array.prototype.slice.call(arguments), col = R.dmgCol; a[1] = dmg + Ae.BONUS; R.dmgCol = Ae.COL[el]; dedans = true; let r; try { r = he0.apply(this, a); } finally { R.dmgCol = col; dedans = false; }
    if (!e.dead && !e.struct && Math.random() < Ae.CHANCE[el]) {
      if (el === 'feu') { if (CG.Elements && CG.Elements.bruler) CG.Elements.bruler(e); }
      else { const neuf = !(e.slow > 0); e.slow = Math.max(e.slow || 0, Ae.LENT); if (neuf && CG.onScreen(e.x, e.y)) { G.text(e.x, e.y - 58, '❄️ Ralenti !', '#cfeeff'); G.puff(e.x, e.y - 18, '#cfeeff', 8, 90, 3); } } }
    return r;
  };
  // ---------- les étincelles : sur l'arme du chef et derrière ses flèches ----------
  let et = 0, teintes = 0;
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; teintes = 0; if (!S || !R || !R.parts) return r;
    for (const s of R.shots || []) if (s.elem && Math.random() < dt * 30) R.parts.push({ x: s.x, y: s.y, vx: rand(-18, 18), vy: rand(-18, 18), life: 0.3, max: 0.3, col: Ae.ETINCELLE[s.elem], size: 2.4 });
    const o = Ae.tenue(); if (!o || R.ko > 0) return r; et -= dt; if (et > 0) return r; et = 0.14; const p = S.player;
    R.parts.push({ x: p.x + (p.face || 1) * 11 + rand(-3, 3), y: p.y - 24 + rand(-6, 4), vx: rand(-8, 8), vy: o.el === 'feu' ? rand(-34, -16) : rand(6, 18), life: 0.4, max: 0.4, col: Ae.ETINCELLE[o.el], size: 2 });
    return r;
  };
  // ---------- un ennemi ralenti est bleuté ----------
  const SZ = 132, K = 2; let off = null, og = null;
  const en0 = Art.enemy; Art.enemy = function (g, e, t) {
    if (!(e.slow > 0) || e.dead || (e.r || 12) > 20 || teintes >= Ae.TEINTES || !CG.onScreen(e.x, e.y)) return en0.apply(this, arguments);
    if (!off) { off = document.createElement('canvas'); off.width = off.height = SZ * K; og = off.getContext('2d'); }
    teintes++; og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-over'; og.globalAlpha = 1; og.clearRect(0, 0, SZ * K, SZ * K); og.setTransform(K, 0, 0, K, (SZ / 2 - e.x) * K, (SZ * 0.8 - e.y) * K);
    og.save(); let bon = true; try { en0.call(this, og, e, t); } catch (err) { bon = false; } og.restore(); if (!bon) return en0.apply(this, arguments);
    og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-atop'; og.globalAlpha = 1; og.fillStyle = Ae.TEINTE; og.fillRect(0, 0, SZ * K, SZ * K); og.globalCompositeOperation = 'source-over';
    g.drawImage(off, e.x - SZ / 2, e.y - SZ * 0.8, SZ, SZ);
  };
})(window.CG);
