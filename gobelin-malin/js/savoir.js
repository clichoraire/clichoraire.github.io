// Goblin Malin — dix cases de plus dans l'arbre des technologies : de petits avantages permanents qui se cumulent.
// Quatre font gagner plus d'expérience au chef, deux à ses gobelins et compagnons, deux rapportent plus d'or, deux font remonter le mana.
// « rang » (0 à 1) : où la case se range parmi celles de sa famille, du centre de l'arbre vers le bord (voir vues.js).
'use strict';
(function (CG) {
  const G = CG.G, Sa = CG.Savoir = { XP: 0.10, ELEVES: 0.15, OR: 0.10, MANA: 0.5, BATIR: 0.05, VITESSE: 0.05 };
  const pc = v => Math.round(v * 100);
  const L = [
    ['x1', 'guer', 0.30, 2, '📚', 'Vite appris I', 'xp'], ['x2', 'sorc', 0.45, 2, '📚', 'Vite appris II', 'xp'], ['x3', 'def', 0.60, 2, '📚', 'Vite appris III', 'xp'], ['x4', 'clan', 0.80, 2, '📚', 'Vite appris IV', 'xp'],
    ['x5', 'clan', 0.35, 1, '🎓', 'Bons élèves I', 'el'], ['x6', 'def', 0.85, 1, '🎓', 'Bons élèves II', 'el'],
    ['x7', 'clan', 0.55, 1, '💰', 'Flair du butin I', 'or'], ['x8', 'guer', 0.75, 1, '💰', 'Flair du butin II', 'or'],
    ['x9', 'sorc', 0.25, 1, '🔮', 'Esprit clair I', 'ma'], ['x10', 'sorc', 0.85, 1, '🔮', 'Esprit clair II', 'ma'],
    ['x11', 'clan', 0.15, 1, '🔨', 'Mains agiles I', 'ba'], ['x12', 'def', 0.30, 1, '🔨', 'Mains agiles II', 'ba'], ['x13', 'guer', 0.50, 1, '🔨', 'Mains agiles III', 'ba'], ['x14', 'clan', 0.65, 1, '🔨', 'Mains agiles IV', 'ba'], ['x15', 'def', 0.75, 1, '🔨', 'Mains agiles V', 'ba'],
    ['x16', 'guer', 0.20, 1, '👟', 'Pieds légers I', 'vi'], ['x17', 'clan', 0.45, 1, '👟', 'Pieds légers II', 'vi'], ['x18', 'sorc', 0.60, 1, '👟', 'Pieds légers III', 'vi'], ['x19', 'def', 0.50, 1, '👟', 'Pieds légers IV', 'vi'], ['x20', 'guer', 0.90, 1, '👟', 'Pieds légers V', 'vi']
  ];
  const DESC = { xp: 'Tu gagnes ' + pc(Sa.XP) + ' % d\'expérience en plus : les niveaux montent plus vite. Se cumule avec les autres « Vite appris ».', el: 'Tes gobelins et tes compagnons gagnent ' + pc(Sa.ELEVES) + ' % d\'expérience en plus.', or: 'Tout l\'or que tu ramasses vaut ' + pc(Sa.OR) + ' % de plus.', ma: 'Ton mana remonte un peu plus vite, tout le temps.', ba: 'Quand tu bâtis toi-même (E sur un chantier), chaque coup de marteau avance ' + pc(Sa.BATIR) + ' % de plus. Se cumule avec les autres « Mains agiles ».', vi: 'Tu te déplaces ' + pc(Sa.VITESSE) + ' % plus vite. Se cumule avec les autres « Pieds légers ».' };
  L.forEach(q => { const n = { id: q[0], br: q[1], rang: q[2], cout: q[3], t: 5, r: 0, icon: q[4], nom: q[5], desc: DESC[q[6]], savoir: q[6] }; CG.TECH.push(n); CG.TECH_BY_ID[n.id] = n; });
  const nb = k => { let n = 0; for (const q of L) if (q[6] === k && G.tech(q[0])) n++; return n; };
  Sa.nb = nb;
  const ax = G.addXp; G.addXp = function (n) { const k = nb('xp'); return ax.call(this, k && n > 0 ? n * (1 + Sa.XP * k) : n); }; // les fractions s'accumulent (un petit gain compte aussi) ; l'affichage arrondit
  G.xpGobMul = () => 1 + Sa.ELEVES * nb('el');
  const px = CG.P.xp; CG.P.xp = function (p, n) { return px.call(this, p, n * G.xpGobMul()); };
  const ga = G.gain; G.gain = function (res, n, x, y) { if (res === 'or' && n > 0) { const k = nb('or'); if (k) n = Math.round(n * (1 + Sa.OR * k)); } return ga.call(this, res, n, x, y); };
  const bw = G.buildWork; G.buildWork = function (b, amount, who) { if (CG.S && who === CG.S.player) amount *= 1 + Sa.BATIR * nb('ba'); return bw.call(this, b, amount, who); };
  const hm = G.heroMul; G.heroMul = function () { return hm.apply(this, arguments) * (1 + Sa.VITESSE * nb('vi')); };
  const mr = G.manaRegen; G.manaRegen = function () { return mr.apply(this, arguments) + Sa.MANA * nb('ma'); };
})(window.CG);
