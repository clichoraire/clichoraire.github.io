// Goblin Malin — le fou rire général : quand tous les gobelins du clan ont reçu une « Grosse caboche » dans la même journée,
//   le moral gagne 10 points, et ce qui dépasse 100 % est gardé à part (jusqu'à 110 %). Ce surplus ne prend pas la place
//   de l'euphorie du feu (+20) : les deux s'additionnent, jusqu'à 130 %. Il dure jusqu'au lendemain matin. Tout se règle dans CG.FouRire.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Fr = CG.FouRire = { MORAL: 10 };
  const clan = () => CG.S.goblins.filter(g => !g.bebe);
  const vus = () => { const S = CG.S; if (!S.rireVus || S.rireVus.d !== S.day) S.rireVus = { d: S.day, ids: [] }; return S.rireVus; };
  // le surplus au-dessus de 100 % : il ne compte que si le moral est resté plein
  Fr.plus = () => { const S = CG.S, r = S && S.rire; return r && r.d === S.day && S.morale >= 99.5 ? r.n : 0; };
  Fr.fait = () => { const S = CG.S; return !!(S && S.rire && S.rire.d === S.day); };
  Fr.compte = () => { const v = vus(), l = clan(); return [l.filter(g => v.ids.includes(g.id)).length, l.length]; };
  const c0 = G.cast;
  G.cast = function (id) {
    if (!/^caboche/.test(String(id)) || !CG.S || !CG.R) return c0.apply(this, arguments);
    const S = CG.S, av = new Map(S.goblins.map(g => [g, g.bigT || 0])), r = c0.apply(this, arguments);
    const g = S.goblins.find(o => (o.bigT || 0) > av.get(o) + 0.01); if (!g || g.bebe) return r;
    const v = vus(); if (!v.ids.includes(g.id)) v.ids.push(g.id); if (Fr.fait()) return r;
    const [n, tot] = Fr.compte();
    if (n < tot) { G.text(g.x, g.y - 104, '🎈 ' + n + ' / ' + tot, '#ffd0ea'); return r; }
    const libre = Math.max(0, 100 - S.morale), a = Math.min(Fr.MORAL, libre); S.morale += a; S.rire = { d: S.day, n: Fr.MORAL - a };
    const p = S.player; G.banner('😂 Fou rire général !', 'Tout le clan a la grosse caboche : moral +' + Fr.MORAL + (S.rire.n > 0 ? ' (il monte à ' + Math.round(100 + S.rire.n + (CG.Fete ? CG.Fete.euphorie() : 0)) + ' %)' : '') + ', jusqu\'à demain matin.', '#ffb0d8');
    CG.sfx('victory'); CG.R.rings.push({ x: p.x, y: p.y - 10, r: 160, life: 0.7, col: '#ffb0d8' }); S.goblins.forEach(o => { o.emoteT = 3; o.pep = Math.max(o.pep || 0, 30); });
    return r;
  };
  // au-dessus de 100 %, le travail va encore un peu plus vite (même règle que le moral ordinaire)
  { const ws = G.workSpeed; G.workSpeed = g => { const s = Fr.plus(); return ws(g) * (s > 0 ? (0.7 + (CG.S.morale + s) / 100 * 0.6) / (0.7 + CG.S.morale / 100 * 0.6) : 1); }; }
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.push({ k: 'fourire', ic: '😂', nom: () => 'Fou rire général', txt: () => 'Tout le clan a eu la grosse caboche aujourd\'hui : +' + Fr.plus() + ' % de moral au-dessus de 100 %. S\'ajoute à l\'euphorie du feu.', t: () => (Fr.plus() > 0 ? true : 0), fin: () => 'jusqu\'à demain matin' });
  if (CG.SPELLS.caboche) CG.SPELLS.caboche.desc += ' Si tout le clan y passe dans la même journée, c\'est le fou rire général : moral +' + Fr.MORAL + ', même au-dessus de 100 %.';
})(window.CG);
