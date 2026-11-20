// Goblin Malin — les petits : deux compagnons de la même espèce peuvent avoir un bébé pendant la nuit,
// si le clan a bien mangé, s'il reste de la nourriture pour lui, et s'il reste de la place pour un compagnon de plus.
'use strict';
(function (CG) {
  const G = CG.G, P = CG.P, Art = CG.Art, K = P.KINDS, Po = CG.Portee = { CHANCE: 0.25, COUT: 15, PETIT: 2, TAILLE: 0.6 };
  const NOMS = ['Minus', 'Pompon', 'Puce', 'Biscuit', 'Caillou', 'Tibou', 'Moustique', 'Pépin', 'Croquette', 'Bouton', 'Miette', 'Plume', 'Châtaigne', 'Pistache'];
  // les couples possibles : deux bêtes de la même espèce (pas les monstres alliés), debout toutes les deux
  Po.couples = function () {
    const S = CG.S, par = {}; S.pets.forEach(p => { if (!K[p.kind] || K[p.kind].monstre || p.ko || Po.petit(p)) return; (par[p.kind] = par[p.kind] || []).push(p); });
    return Object.keys(par).filter(k => par[k].length >= 2).map(k => par[k]);
  };
  Po.petit = p => !!p.bebe && CG.S.day - p.bebe < Po.PETIT;
  Po.naitre = function (parents) {
    const S = CG.S, a = parents[0], b = parents[1], used = S.pets.map(p => p.name), f = G.firePos();
    const p = { id: S.nextId++, kind: a.kind, name: CG.pick(NOMS.filter(n => !used.includes(n))) || 'Petit', lvl: 1, xp: 0, evo: 0, x: f.x + 60, y: f.y + 90, pet: true, bebe: S.day };
    p.hp = P.maxHp(p); P.reset(p); S.pets.push(p); S.res.food -= Po.COUT; S.morale = Math.min(100, S.morale + 3); return p;
  };
  const mo0 = P.morning; P.morning = function (lines, fed) {
    const couples = fed ? Po.couples() : []; // avant le réveil : ceux qui partent le ventre vide ne comptent plus
    const r = mo0.apply(this, arguments), S = CG.S;
    const l = couples.map(c => c.filter(p => S.pets.includes(p))).filter(c => c.length >= 2);
    if (l.length && S.pets.length < P.MAX && S.res.food >= Po.COUT && Math.random() < Po.CHANCE) {
      const c = CG.shuffle(CG.pick(l)), p = Po.naitre(c), i = S.pets.length - 1, f = G.firePos(); p.x = f.x + Math.cos(i * 1.3) * 110; p.y = f.y + 70 + Math.sin(i * 1.3) * 30;
      if (lines) lines.push('🍼 ' + c[0].name + ' et ' + c[1].name + ' ont eu un petit cette nuit : ' + K[p.kind].icon + ' ' + p.name + ' ! (-' + Po.COUT + ' 🍖, moral +3)');
    }
    return r;
  };
  // tout petit pendant ses deux premiers jours
  const pet00 = Art.pet, pet0 = function (g, o, t) { // un compagnon assommé ne bouge plus du tout : ni ailes, ni queue, ni souffle
    if (!o.ko) return pet00.apply(this, arguments); return pet00.call(this, g, Object.assign({}, o, { moving: false, atkAnim: 0, sleep: false, flash: 0, seed: 0 }), 0);
  };
  Art.pet = function (g, o, t) {
    if (!o.bebe || !CG.S || CG.S.day - o.bebe >= Po.PETIT) return pet0.apply(this, arguments);
    g.save(); g.translate(o.x, o.y); g.scale(Po.TAILLE, Po.TAILLE); g.translate(-o.x, -o.y); try { return pet0.apply(this, arguments); } finally { g.restore(); }
  };
})(window.CG);
