// Goblin Malin — quand un gobelin du clan évolue (son nom officiel le change en hobgobelin ou en chevaucheur de loup, ou
// bien il prend sa voie pendant la nuit), il a droit à la même grande scène que le chef : la silhouette dans l'ombre,
// les « ?! », les rayons, l'éclair, et sa nouvelle forme. Une scène à la fois, l'une après l'autre.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Eg = CG.EvoGob = { file: [] };
  // À quel niveau on évolue : entre 7 et 12, tiré au sort pour chacun (le chef, chaque gobelin, chaque compagnon), et
  // toujours le même pour lui dans une partie. On ne l'affiche nulle part : on ne sait jamais exactement quand.
  CG.EVO_MIN = 7; CG.EVO_MAX = 12;
  CG.seuilEvo = function (o) { const S = CG.S, id = o && o.id !== undefined ? o.id + (o.pet ? 7919 : 0) : -1, v = Math.sin(((S && S.seed) || 1) * 12.9898 + id * 78.233) * 43758.5453; return CG.EVO_MIN + Math.floor((v - Math.floor(v)) * (CG.EVO_MAX - CG.EVO_MIN + 1)); };
  const stats = g => ({ hp: G.gobMaxHp(g), atk: G.guardDmg(g) });
  Eg.ajouter = function (g, avant, st) { Eg.file.push({ g, avant, st }); };
  // les voies choisies la veille s'appliquent pendant la nuit : on note qui a changé
  const an0 = G.applyNames; G.applyNames = function () {
    const S = CG.S, suivis = S.goblins.filter(o => o.classing || o.naming).map(o => ({ o, cls: o.cls, job: o.job, nomme: !!o.nomme, av: stats(o) }));
    const r = an0.apply(this, arguments);
    suivis.forEach(k => { if (!S.goblins.includes(k.o) || (k.o.cls === k.cls && !!k.o.nomme === k.nomme)) return; Eg.ajouter(k.o, { cls: k.cls, job: k.job, nomme: k.nomme }, { avant: k.av, apres: stats(k.o) }); });
    return r;
  };
  // ce qu'il faut à la scène : de quoi le dessiner avant et après, son nouveau titre, la petite phrase
  Eg.fiche = function (g, avant) {
    const k = { g, avant }, f = g.sex === 'f', C = g.cls && CG.Evo && CG.Evo.CLASSES[g.cls], voie = g.cls !== k.avant.cls;
    const nom = g.cls === 'loup' ? (f ? 'Chevaucheuse de loup' : 'Chevaucheur de loup') : voie && C ? (f && C.nomF ? C.nomF : C.nom) : (f ? 'Hobgobeline' : 'Hobgobelin');
    const sub = g.name + (g.cls === 'loup' ? ' a trouvé sa monture : plus de vie, plus de force, et ça galope.' : voie && C ? ' a pris sa voie pendant la nuit.' : ' porte maintenant son nom officiel : plus grand' + (f ? 'e' : '') + ', plus fort' + (f ? 'e' : '') + ', plus rapide.');
    return { gob: Eg.corps(g, k.avant), E: { nom, col: g.cls === 'loup' ? '170,200,255' : voie ? '255,154,74' : '255,227,107', sub } };
  };
  Eg.corps = (g, avant) => ({ sex: g.sex, look: g.look, hue: g.hue, hat: g.hat, fun: g.fun, cls0: avant.cls, cls1: g.cls, job0: avant.job, job1: g.job, nomme0: avant.nomme });
  function jouer(k) {
    const g = k.g, f = Eg.fiche(g, k.avant);
    if (CG.EvoStats) CG.EvoStats.file = CG.EvoStats.file.filter(c => c.titre !== g.name); // pas la petite carte en plus
    CG.R.evoStats = k.st;
    CG.Accueil.evolveGob(f.gob, f.E, () => { Eg.pause = 0.4; });
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !Eg.file.length) return;
    if (Eg.pause > 0) { Eg.pause -= dt; return; }
    if (UI.modal || R.night || R.cine || R.fade > 0.3 || R.ko > 0 || R.trouve || !(CG.Accueil && CG.Accueil.evolveGob)) return;
    const k = Eg.file.shift(); if (S.goblins.includes(k.g)) jouer(k);
  };
})(window.CG);
