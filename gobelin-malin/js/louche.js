// Goblin Malin — le type louche. Certains jours, quand le chef se promène loin du village, quelqu'un se poste pas loin et
// lui fait « Psst… ». Si le chef s'approche :
//   - soit c'était un piège : il disparaît et une bande sort des fourrés ;
//   - soit il veut vendre un sac surprise, entre PRIX[0] et PRIX[1] pièces d'or. Dedans : de la vie ou du mana pour toujours,
//     une arme de feu ou de glace (armesfeu.js), une bourse d'or, une babiole… ou rien du tout : POUF, il file avec l'or.
// Plus le sac est cher, plus il a de chances de contenir une arme, et moins le vendeur a de chances de filer.
// Rien ne l'annonce : on l'entend, c'est tout. Tout se règle dans CG.Louche.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const Lo = CG.Louche = { JOUR: 2, PAR_JOUR: 0.45, ATTENTE: [35, 150], LOIN: 15, DIST: [380, 700], RESTE: 80, PSST: 430, PRES: 62, PIEGE: 0.3, PRIX: [100, 1000], DON: 5, BOURSE: [1.2, 2],
    /* ce qu'il y a dans le sac : [poids pour un sac à 100, poids pour un sac à 1000] */
    SAC: { pouf: [0.22, 0.12], vie: [0.17, 0.17], mana: [0.17, 0.17], arme: [0.2, 0.32], bourse: [0.12, 0.12], babiole: [0.12, 0.1] } };
  Lo.PSSTS = ['Psst…', 'Psst… Hé, toi…', 'Psst ! Par ici…', 'Hé… Psst…', 'Pssst… Approche…', 'Psst… Oui, toi, le vert…', 'Hé ! Psst… Viens voir…', 'Psst… J\'ai quelque chose pour toi…'];
  Lo.OFFRES = ['Chut… Pas si fort. J\'ai ici un sac. Ce qu\'il y a dedans ? Ça, mon petit chef, c\'est la surprise. {p} pièces d\'or, et il est à toi.',
    'Toi, tu as l\'air de quelqu\'un qui aime les bonnes affaires. Un sac surprise, tombé d\'une charrette. {p} pièces d\'or. Tu ne m\'as jamais vu.',
    'Approche, approche… Regarde ce beau sac. Non, tu ne regardes pas dedans. Tu paies {p} pièces d\'or, et APRÈS tu regardes.',
    'Hé hé… J\'ai un sac. Un sac très, très spécial. Je ne peux pas te dire d\'où il vient. {p} pièces d\'or. C\'est donné.',
    'Pas un mot à personne. Sac surprise, {p} pièces d\'or. Satisfait ou… ou rien du tout. Alors ?',
    'Tu veux voir quelque chose d\'incroyable ? Moi aussi. C\'est pour ça qu\'on n\'ouvre pas le sac avant d\'avoir payé. {p} pièces d\'or.'];
  Lo.REFUS = ['Tant pis pour toi…', 'Tu le regretteras…', 'Chut ! Tu ne m\'as pas vu.', 'Pff. Radin.', 'Reviens si tu changes d\'idée…', 'Un jour, tu repenseras à ce sac…'];
  Lo.PIEGES = ['Hé hé hé… Attrapez-le !', 'Trop facile… À vous, les gars !', 'Il a mordu ! Sautez-lui dessus !', 'Hé hé… Tu es trop curieux, petit chef.', 'Maintenant !'];
  Lo.BABIOLES = [['🧦', 'Une vieille chaussette', 'Elle sent très fort. Très, très fort.'], ['🪨', 'Un caillou', 'Un caillou tout à fait ordinaire.'], ['🥔', 'Une patate', 'Elle a des yeux. Elle te regarde.'], ['🦴', 'Un os rongé', 'Quelqu\'un a déjà mangé le meilleur.'], ['🧅', 'Un oignon', 'Tu pleures. C\'est l\'oignon, bien sûr.'], ['🪶', 'Une plume', 'Une seule plume. Même pas jolie.'], ['🥄', 'Une cuillère tordue', 'On ne peut même pas manger de la soupe avec.']];
  const dehors = () => { const S = CG.S, R = CG.R; return !S.arene && !R.night && !R.fireLit && !(R.ko > 0) && !R.cine && !R.build; };
  const loinDuFeu = (x, y) => { let f; try { f = G.firePos(); } catch (e) { return true; } return Math.hypot(x - f.x, y - f.y) > Lo.LOIN * T; };
  function jour() { const S = CG.S, R = CG.R; if (!R.loucheJ || R.loucheJ.jour !== S.day) R.loucheJ = { jour: S.day, vient: S.day >= Lo.JOUR && Math.random() < Lo.PAR_JOUR, dans: rand(Lo.ATTENTE[0], Lo.ATTENTE[1]) }; return R.loucheJ; }
  const prix = () => { const k = Math.random(); return Math.round((Lo.PRIX[0] + (Lo.PRIX[1] - Lo.PRIX[0]) * k * k) / 10) * 10; }; /* les sacs chers sont plus rares */
  // ---------- il se poste quelque part, hors de vue ----------
  Lo.poser = function (force) {
    const S = CG.S, R = CG.R, p = S.player;
    for (let i = 0; i < 60; i++) { const a = Math.random() * TAU, d = force ? rand(130, 170) : rand(Lo.DIST[0], Lo.DIST[1]), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.8, tx = Math.floor(x / T), ty = Math.floor(y / T);
      if (!W.inMap(tx, ty) || !W.walkPx(x, y)) continue; if (!force) { if (i < 40 && CG.onScreen(x, y)) continue; if (!loinDuFeu(x, y)) continue; try { if (W.reachable && !W.reachable(tx, ty)) continue; } catch (e) { /* rien */ } if (R.enemies.some(e => !e.dead && Math.hypot(e.x - x, e.y - y) < 200)) continue; }
      R.louche = { x, y, face: p.x > x ? 1 : -1, t: Lo.RESTE, next: 0, vu: false, piege: Math.random() < Lo.PIEGE, prix: prix(), seed: Math.random() * 10 };
      if (CG.onScreen(x, y)) G.puff(x, y - 18, '#6a6276', 16, 110, 4); return R.louche; }
    return null;
  };
  Lo.venir = function (piege, combien) { const L = Lo.poser(true); if (L) { if (piege !== undefined) L.piege = !!piege; if (combien) L.prix = combien; } return L; }; /* pour les essais */
  function pouf(L, mot) { const R = CG.R; if (R.louche !== L) return; R.louche = null; G.puff(L.x, L.y - 20, '#8a8296', 30, 190, 5); G.puff(L.x, L.y - 20, '#e8e4f0', 12, 110, 3); R.rings.push({ x: L.x, y: L.y - 12, r: 46, life: 0.4, col: '#b8b0c8' }); if (mot) G.text(L.x, L.y - 62, mot, '#f0ecff', true); CG.sfx('swing'); }
  // ---------- le piège ----------
  function piege(L) {
    const S = CG.S, R = CG.R, p = S.player, types = S.day >= 9 ? ['brigand', 'brigand', 'soldat'] : ['brigand'], nb = Math.min(5, 2 + Math.floor(S.day / 5));
    G.text(L.x, L.y - 76, pick(Lo.PIEGES), '#ffb0a0', true); pouf(L, 'POUF !');
    for (let i = 0; i < nb; i++) { let x = 0, y = 0, ok = false; for (let k = 0; k < 14 && !ok; k++) { const a = (i / nb) * TAU + rand(-0.5, 0.5), d = rand(105, 150); x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d * 0.85; ok = W.walkPx(x, y); } if (!ok) { x = L.x; y = L.y; }
      const type = pick(types); if (!CG.ENEMIES[type]) continue; const e = G.spawnEnemy(type, x, y, {}); if (e) { e.target = p; e.louche = true; G.puff(x, y - 16, '#5a7a3a', 12, 120, 4); } }
    G.banner('⚠️ C\'était un piège !', 'Une embuscade !', '#ffb0a0'); CG.sfx('hurt'); R.playerCombatUntil = R.t + 5;
  }
  // ---------- le sac surprise ----------
  function tirer(p) { const k = CG.clamp((p - Lo.PRIX[0]) / ((Lo.PRIX[1] - Lo.PRIX[0]) || 1), 0, 1), ks = Object.keys(Lo.SAC).filter(q => q !== 'arme' || !!CG.ArmesElem), w = ks.map(q => Lo.SAC[q][0] + (Lo.SAC[q][1] - Lo.SAC[q][0]) * k); let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < ks.length; i++) { r -= w[i]; if (r <= 0) return ks[i]; } return ks[0]; }
  Lo.tirer = tirer;
  Lo.ouvrir = function (L, quoi) {
    const S = CG.S, R = CG.R, p = S.player, k = quoi || tirer(L.prix);
    if (k === 'pouf') { pouf(L, 'POUF !'); G.banner('💨 POUF !', 'Il a filé avec tes ' + L.prix + ' pièces d\'or.', '#d8d0e8'); CG.sfx('no'); return k; }
    const or = t => { G.puff(p.x, p.y - 24, '#ffd84a', 22, 150, 4); for (let i = 0; i < 2; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 46 + i * 34, life: 0.45 + i * 0.15, col: '#ffe36b' }); G.text(p.x, p.y - 84, t, '#ffe36b', true); CG.sfx('heal'); };
    if (k === 'vie') { p.maxhp += Lo.DON; p.hp += Lo.DON; or('💛 +' + Lo.DON + ' vie max'); G.banner('💛 Une fiole dorée !', 'Tu as ' + Lo.DON + ' de vie de plus, pour toujours !', '#ffe9a8'); }
    else if (k === 'mana') { p.maxmp += Lo.DON; p.mp += Lo.DON; or('💛 +' + Lo.DON + ' mana max'); G.banner('💛 Une goutte dorée !', 'Tu as ' + Lo.DON + ' de mana de plus, pour toujours !', '#ffe9a8'); }
    else if (k === 'arme') { const A = CG.ArmesElem, id = pick(Object.keys(A.L)), o = A.L[id], n = CG.Qualite && CG.Qualite.tirer ? CG.Qualite.tirer() : CG.irand(1, 3), z = A.donner(id, n);
      G.text(p.x, p.y - 84, o.ic + ' ' + o.nom + ' ' + '★'.repeat(n), o.el === 'feu' ? '#ffb060' : '#cfeeff', true); G.puff(p.x, p.y - 24, o.el === 'feu' ? '#ff8a1e' : '#cfeeff', 24, 160, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 56, life: 0.5, col: o.el === 'feu' ? '#ff8a1e' : '#9adcff' }); CG.sfx('discovery');
      G.banner(o.ic + ' ' + o.nom + ' ' + '★'.repeat(n), o.phrase, o.el === 'feu' ? '#ffc890' : '#d0ecff'); if (z !== 'sac') UI.toast('🎒 Ton sac est plein : ' + o.nom + ' est au coffre du camp.'); }
    else if (k === 'bourse') { const n = Math.round(L.prix * rand(Lo.BOURSE[0], Lo.BOURSE[1]) / 5) * 5; S.res.or += n; or('+' + n + ' 🪙'); G.banner('💰 Une bourse pleine !', n + ' pièces d\'or. Il n\'a pas dû regarder dans son sac.', '#ffe9a8'); }
    else { const b = pick(Lo.BABIOLES); G.text(p.x, p.y - 84, b[0] + ' ' + b[1], '#e0d8c8', true); G.banner(b[0] + ' ' + b[1], b[2], '#e0d8c8'); CG.sfx('no'); }
    R.loucheFin = { L, t: 0.9 }; return k; /* il ne traîne pas : POUF, un instant après */
  };
  function parler(L) {
    const S = CG.S; L.vu = true;
    UI.dialog({ who: 'Un type louche', tag: 'il regarde partout autour de lui', text: pick(Lo.OFFRES).replace('{p}', L.prix), options: [
      { label: '👜 Acheter le sac surprise (' + L.prix + ' 🪙)', sub: 'Tu n\'as pas assez d\'or', disabled: (S.res.or || 0) < L.prix, fn: () => { if (CG.R.louche !== L || (S.res.or || 0) < L.prix) return; G.pay({ or: L.prix }); G.text(S.player.x, S.player.y - 62, '-' + L.prix + ' 🪙', '#ffd0a0', true); L.vendu = true; Lo.ouvrir(L); } },
      { label: 'Non merci', echap: true, fn: () => { if (CG.R.louche === L) G.text(L.x, L.y - 64, pick(Lo.REFUS), '#e8e0ff', true); } }] });
  }
  // ---------- chaque instant ----------
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !S.player || !R.enemies) return r; const p = S.player;
    if (R.loucheFin) { R.loucheFin.t -= dt; if (R.loucheFin.t <= 0) { const L = R.loucheFin.L; R.loucheFin = null; pouf(L, 'POUF !'); } }
    const L = R.louche;
    if (!L) { const j = jour(); if (!j.vient || j.fait || !dehors() || !loinDuFeu(p.x, p.y) || R.playerCombatUntil > R.t || (UI.modal && UI.modal.name)) return r; j.dans -= dt; if (j.dans > 0) return r; if (Lo.poser()) j.fait = true; else j.dans = 3; return r; }
    if (S.arene || R.night) { R.louche = null; return r; }
    const d = Math.hypot(p.x - L.x, p.y - L.y); if (Math.abs(p.x - L.x) > 6) L.face = p.x > L.x ? 1 : -1; if (!(UI.modal && UI.modal.name)) L.t -= dt;
    if (L.vendu) return r;
    if (L.t <= 0 && d > 240) { pouf(L); return r; }
    if (R.ko > 0 || R.cine) return r;
    if (d < Lo.PSST && d > Lo.PRES && R.t > L.next && CG.onScreen(L.x, L.y)) { L.next = R.t + rand(2.4, 3.8); G.text(L.x, L.y - 62, pick(Lo.PSSTS), '#e8e0ff'); }
    if (d < Lo.PRES && !L.vu && !(UI.modal && UI.modal.name)) { L.vu = true; if (L.piege) piege(L); else parler(L); }
    return r;
  };
  // on peut lui reparler tant qu'il est là (touche E)
  { const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it) return it; const R = CG.R, L = R && R.louche; if (!L || !L.vu || L.vendu || L.piege || R.ko > 0 || R.cine || R.build) return it; const p = CG.S.player; return Math.hypot(p.x - L.x, p.y - L.y) < 70 ? { type: 'louche', obj: { x: L.x, y: L.y - 40 }, label: 'Parler au type louche' } : it; };
    const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'louche' && CG.R.louche) return void parler(CG.R.louche); return in0.apply(this, arguments); }; }
  // ---------- son dessin : un long manteau sombre, un capuchon, et deux yeux qui regardent partout ----------
  const LOOK = { skin: '#9fb070', tunic: '#2f2a36', legs: '#1c1a20', sleeve: '#3a3442', robe: true, hood: true, cape: '#1c1a20', s: 1.05 };
  const dessin = { draw(g, o, t) { const L = o.L, guet = Math.sin(t * 1.7 + L.seed);
      Art.humanoid(g, Object.assign({ x: L.x, y: L.y, face: L.face, t, moving: false, step: 0, atk: 0 }, LOOK));
      const hy = L.y - 39, k = Math.sin(t * 3.1 + L.seed) > 0.2 ? 1 : -1; g.fillStyle = 'rgba(12,10,16,0.82)'; g.beginPath(); g.ellipse(L.x + L.face * 1.5, hy, 6.4, 4.2, 0, 0, TAU); g.fill(); /* l'ombre du capuchon */
      g.fillStyle = '#fff6b0'; for (const q of [-1, 1]) { g.beginPath(); g.arc(L.x + L.face * 1.5 + q * 2.7 + k * 0.9, hy + 0.2, 1.25, 0, TAU); g.fill(); }
      g.fillStyle = '#7a5a34'; g.beginPath(); g.ellipse(L.x - L.face * 9, L.y - 13 + guet * 0.6, 6.5, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#5c4226'; g.fillRect(L.x - L.face * 9 - 4, L.y - 22 + guet * 0.6, 8, 2.4); /* le sac */
    } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R, L = R && R.louche; if (L && CG.onScreen(L.x, L.y)) push(L.y, 21, { x: L.x, y: L.y, L, draw: dessin.draw }, null); }; }
})(window.CG);
