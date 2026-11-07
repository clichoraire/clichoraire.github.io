// Paper Loop — données : personnages (têtes de la famille), machines de la boutique, économie.
(function (root) {
  'use strict';
  const PL = root.PL = root.PL || {};
  PL.VERSION = '0.2.0';
  PL.SAVE_KEY = 'paperloop.save';

  // Personnages : la famille au complet. outfit = chandail, pants = pantalon, size : 1 = adulte.
  PL.CHARACTERS = [
    { id: 'zachary',  name: 'Zachary',  family: 'jo',   size: 1.0,  outfit: '#d9342b', pants: '#243b6b' },
    { id: 'alexie',   name: 'Alexie',   family: 'jo',   size: 0.86, outfit: '#9b3fd4', pants: '#ff5fc8' },
    { id: 'eliott',   name: 'Eliott',   family: 'jo',   size: 0.84, outfit: '#2f9d3a', pants: '#1b1b1b' },
    { id: 'adam',     name: 'Adam',     family: 'bibi', size: 0.74, outfit: '#ff8a1f', pants: '#b5541a' },
    { id: 'milo',     name: 'Milo',     family: 'bibi', size: 0.62, outfit: '#3f9cff', pants: '#8d6e63' },
    { id: 'edison',   name: 'Edison',   family: 'jay',  size: 0.66, outfit: '#f4c430', pants: '#8d6e63' },
    { id: 'matthieu', name: 'Matthieu', family: 'matt', size: 1.0,  outfit: '#1e5bd8', pants: '#2b2b2b' },
    { id: 'josee',    name: 'Josée',    family: 'matt', size: 0.94, outfit: '#b48cf0', pants: '#4a4a4a' },
    { id: 'richard',  name: 'Richard',  family: 'matt', size: 0.96, outfit: '#8d6e63', pants: '#3e2723' },
    { id: 'mickael',  name: 'Mickael',  family: 'bibi', size: 0.98, outfit: '#00897b', pants: '#1b1b1b' },
    { id: 'marie',    name: 'Marie',    family: 'bibi', size: 0.94, outfit: '#e91e63', pants: '#3a3a3a' },
    { id: 'jeremie',  name: 'Jérémie',  family: 'jay',  size: 1.0,  outfit: '#b71c1c', pants: '#1b1b1b' },
    { id: 'jessica',  name: 'Jessica',  family: 'jay',  size: 0.94, outfit: '#f9a825', pants: '#4a4a4a' },
    { id: 'josue',    name: 'Josué',    family: 'jo',   size: 0.98, outfit: '#0f5a2a', pants: '#1b1b1b' },
    { id: 'emily',    name: 'Émily',    family: 'jo',   size: 0.94, outfit: '#26c6da', pants: '#3a3a3a' },
  ];
  PL.FAMILIES = { jo: 'Josué & Émily', bibi: 'Mickael & Marie', jay: 'Jérémie & Jessica', matt: 'Matthieu, Josée & Richard' };
  PL.charById = id => PL.CHARACTERS.find(c => c.id === id) || PL.CHARACTERS[0];

  // Machines des boutiques. scope 'global' : un pouvoir ou un bonus pour tout le jeu ; scope 'course' : les clones et la
  // récompense de base de la course du hub où se trouve la machine. price(n, courseDef) : prix du prochain achat quand on en
  // a déjà fait n. max : nombre d'achats possibles. bought(p, courseDef) : messages après l'achat.
  PL.MACHINES = [
    { id: 'wall',  scope: 'global', title: ['Saut', 'mural'],        block: ['Saut', 'mural'],      sub: 'Débloque',          price: () => 700,                                     max: 1,
      bought: () => ['Saut mural débloqué !', 'Colle-toi à un mur en l’air et saute.'] },
    { id: 'dash',  scope: 'global', title: ['Élan'],                 block: ['Élan', 'Maj / X'],    sub: 'Débloque · Maj',    price: () => 3000000,                                    max: 1,
      bought: () => ['Élan débloqué !', 'Maj ou X : une poussée vers l’avant, même en l’air.'] },
    { id: 'watts', scope: 'global', title: ['Pièces', 'en plus'],    block: ['Pièces', '+50 %'],     sub: '+50 % par achat',   price: n => Math.round(55000 * Math.pow(5, n)), max: 2,   // démo : 55 k puis 275 k
      bought: p => ['Toutes les récompenses : +' + Math.round(PL.ECON.wattsStep * p.watts * 100) + ' %'] },
    { id: 'cmult', scope: 'global', title: ['Part des', 'clones'],   block: ['Part des', 'clones'],  sub: '+0,1 par achat',    price: n => 5800 * Math.pow(2, n) - 2000, max: 99,   // démo : 3,8 k · 9,6 k · 21,2 k · 44,4 k · 90,8 k · 183,6 k · 369,2 k
      bought: p => ['Les clones touchent ' + PL.fmtMult(PL.cloneMult(p)) + ' la récompense'] },
    { id: 'double', scope: 'global', title: ['Saut', 'en l’air'],  block: ['Saut', 'en l’air'],     sub: 'Débloque',          price: () => 554710000000, max: 1,   // démo : 554,71 G
      bought: () => ['Saut en l’air débloqué !', 'Un deuxième saut en plein vol.'] },
    { id: 'watts2', scope: 'global', title: ['Pièces', 'en plus'],   block: ['Pièces', '+50 %'],     sub: '+50 % par achat',   price: n => Math.round(316980000 * Math.pow(5, n)), max: 2,   // démo (hub 3) : 316,98 M, continue le bonus global
      bought: p => ['Toutes les récompenses : +' + Math.round(PL.ECON.wattsStep * p.watts * 100) + ' %'] },
    { id: 'speed', scope: 'global', title: ['Clones', 'rapides'],    block: ['Clones', 'rapides'],   sub: '+5 % de chance',    price: n => Math.round(6340000 * Math.pow(2, n)), max: 20,   // démo : 6,34 M ; chaque tour, 5 % × n de chance d'un tour deux fois plus vite
      bought: p => ['Chance de tour rapide : ' + (5 * p.speed) + ' %'] },
    { id: 'clone', scope: 'course', title: ['Clone'],                block: ['Clone', '{C}'],        sub: '+1 par achat',      price: (n, c) => PL.clonePriceAt(c, n), max: 99,
      bought: () => ['Un clone de plus !'] },
    { id: 'mult',  scope: 'course', title: ['Récompense', 'de base'], block: ['Récompense', '{C}'],  sub: '+1 par achat',     price: (n, c) => PL.multPriceAt(c, n),  max: 45,   // démo : « CAPPED » à 46×
      bought: (p, c) => ['Récompense : ' + PL.fmtGold(PL.reward(p, c)) + ' par course ' + c.name] },
  ];
  PL.machineById = id => PL.MACHINES.find(m => m.id === id);

  // Économie (l'or est toujours un entier).
  // Récompense d'une course = récompense de base × (1 + 50 % × « Pièces en plus »). Récompense de base : la table `rewards`
  // de la course indexée par le nombre d'achats « Récompense de base » (sinon base × (achats + 1)). Un clone touche la
  // récompense × la part des clones (0,1 au départ, +0,1 par achat « Part des clones »), au moins 1 pièce.
  PL.ECON = { clonePause: 0.6, cloneMult: 0.1, cloneMultStep: 0.1, wattsStep: 0.5, speedStep: 0.05, fastMul: 2 };
  PL.fastChance = p => Math.min(1, PL.ECON.speedStep * (p.speed || 0));   // chance qu'un tour de clone soit un tour rapide (× fastMul)
  const tableAt = (t, k, rate) => k < t.length ? t[k] : Math.round(t[t.length - 1] * Math.pow(rate, k - t.length + 1));
  PL.newProfile = () => ({ gold: 0, total: 0, wall: false, dash: false, double: false, watts: 0, watts2: 0, cmult: 0, speed: 0, courses: {} });
  // Anciennes sauvegardes (v0.1 : une seule course, champs à la racine) → données par course ; or arrondi à l'entier.
  PL.migrateProfile = p => {
    if (!p.courses) { p.courses = { un: { clones: p.clones || 0, mult: p.mult || 0, best: p.best == null ? null : p.best, runs: p.runs || 0, rec: p.rec || null } }; for (const k of ['clones', 'mult', 'best', 'runs', 'rec', 'cloneMult']) delete p[k]; }
    if (p.dash == null) p.dash = false; if (p.double == null) p.double = false; if (p.watts == null) p.watts = 0; if (p.watts2 == null) p.watts2 = 0; if (p.cmult == null) p.cmult = 0; if (p.speed == null) p.speed = 0; if (p.total == null) p.total = 0;
    p.gold = Math.round(p.gold || 0); p.total = Math.round(p.total || 0);
    return p;
  };
  PL.courseData = (p, id) => { p.courses = p.courses || {}; const d = p.courses[id] = p.courses[id] || { clones: 0, mult: 0, best: null, runs: 0, rec: null, medals: {} }; if (!d.medals) { d.medals = d.medal ? { silver: true } : {}; delete d.medal; } return d; };
  PL.bestMedal = d => d.medals && d.medals.gold ? 'gold' : d.medals && d.medals.silver ? 'silver' : null;
  PL.totalClones = p => Object.values(p.courses || {}).reduce((s, c) => s + (c.clones || 0), 0);
  PL.totalRuns = p => Object.values(p.courses || {}).reduce((s, c) => s + (c.runs || 0), 0);
  PL.baseRewardAt = (def, k) => def.rewards ? tableAt(def.rewards, k, 1.1) : def.base * (1 + k);
  PL.rewardAt = (p, def, k) => Math.max(1, Math.round(PL.baseRewardAt(def, k) * (1 + PL.ECON.wattsStep * (p.watts || 0))));
  PL.reward = (p, def) => PL.rewardAt(p, def, PL.courseData(p, def.id).mult || 0);
  PL.cloneMult = p => Math.round((PL.ECON.cloneMult + PL.ECON.cloneMultStep * (p.cmult || 0)) * 10) / 10;
  PL.cloneReward = (p, def) => Math.max(1, Math.round(PL.reward(p, def) * PL.cloneMult(p)));
  PL.clonePriceAt = (def, n) => def.clonePrices ? tableAt(def.clonePrices, n, 1.165) : Math.round(def.clonePrice * Math.pow(def.cloneRate || 1.7, n));
  PL.multPriceAt = (def, n) => def.rewards ? n + 1 : Math.max(1, Math.round(def.multPrice * Math.pow(def.multRate || 2.1, n)));
  PL.addGold = (p, g) => { p.gold = Math.round(p.gold + g); p.total = Math.round((p.total || 0) + g); };
  // 999 → « 999 », 2520 → « 2,52 k », 3 000 000 → « 3,00 M » (comme les Kw / Mw de la démo)
  PL.fmtGold = g => { g = Math.round(g); const a = Math.abs(g); return a < 1000 ? String(g) : a < 1e6 ? (g / 1000).toFixed(2).replace('.', ',') + ' k' : a < 1e9 ? (g / 1e6).toFixed(2).replace('.', ',') + ' M' : (g / 1e9).toFixed(2).replace('.', ',') + ' G'; };
  PL.fmtMult = m => m.toFixed(1).replace('.', ',') + ' ×';

  PL.fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return (m ? m + ':' : '') + (m ? String(Math.floor(r)).padStart(2, '0') : Math.floor(r)) + '.' + String(Math.floor((r % 1) * 100)).padStart(2, '0'); };
  if (typeof module !== 'undefined') module.exports = PL;
})(typeof window !== 'undefined' ? window : globalThis);
