// Goblin Malin — l'atelier de couture et la garde-robe : des vêtements amusants à débloquer dans l'arbre, puis à faire porter.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Art = CG.Art, T = CG.TILE, Mode = CG.Mode = {};

  // ---------- la construction spéciale ----------
  CG.BUILDS.couture = { nom: 'Atelier de couture', icon: '🧵', w: 2, h: 2, cat: 'clan', cout: { bois: 25, cuir: 4 }, tech: 'm0', desc: 'On y coud les chapeaux : celui de chaque métier rend son porteur plus efficace, et ta coiffe de chef te rend plus fort. On y change aussi de tenue (à sa porte pour toi, en leur parlant pour tes gobelins).' };

  // ---------- les vêtements, et leur branche dans l'arbre ----------
  Mode.ITEMS = [
    { id: 'lunettes', tech: 'm1', icon: '🕶️', nom: 'Lunettes de soleil', t: 2, r: 0, req: ['m0'], cout: 1, desc: 'Pour avoir l\'air mystérieux, même la nuit.' },
    { id: 'noeud', tech: 'm2', icon: '🎀', nom: 'Nœud papillon', t: 2, r: 1, req: ['m0'], cout: 1, desc: 'Très chic pour la fête du soir.' },
    { id: 'moustache', tech: 'm3', icon: '🥸', nom: 'Fausse moustache', t: 3, r: 0, req: ['m1'], cout: 1, desc: 'Personne ne te reconnaîtra. Ou presque.' },
    { id: 'clown', tech: 'm4', icon: '🔴', nom: 'Nez de clown', t: 3, r: 1, req: ['m2'], cout: 1, desc: 'Pouet !' },
    { id: 'hautforme', tech: 'm5', icon: '🎩', nom: 'Chapeau haut-de-forme', t: 4, r: 0, req: ['m3'], cout: 2, desc: 'Remplace le chapeau du métier par un grand chapeau de monsieur.' },
    { id: 'tutu', tech: 'm6', icon: '🩰', nom: 'Tutu rose', t: 4, r: 1, req: ['m4'], cout: 2, desc: 'Un tutu à froufrous, par-dessus n\'importe quel habit.' },
    { id: 'cape', tech: 'm7', icon: '🦸', nom: 'Cape de héros', t: 5, r: 0, req: ['m5'], cout: 2, desc: 'Une grande cape qui flotte au vent.' }
  ];
  CG.TECH_BRANCHES.push({ id: 'mode', nom: '👕 Garde-robe du clan' });
  const add = n => { CG.TECH.push(n); CG.TECH_BY_ID[n.id] = n; };
  add({ id: 'm0', br: 'mode', t: 1, r: 0, cout: 1, icon: '🧵', nom: 'Couture', desc: 'Révèle l\'Atelier de couture. On y coud les chapeaux de métier (+20 % d\'efficacité) et ta coiffe de chef, et on y change de tenue.', unlock: ['couture'] });
  Mode.ITEMS.forEach(i => add({ id: i.tech, br: 'mode', t: i.t, r: i.r, cout: i.cout, icon: i.icon, nom: i.nom, desc: 'Nouveau vêtement à l\'atelier de couture. ' + i.desc, req: i.req }));

  Mode.atelier = () => CG.S.buildings.find(b => b.type === 'couture' && !b.site);
  Mode.owned = () => Mode.ITEMS.filter(i => G.tech(i.tech));
  const wear = g => g ? (g.fun || (g.fun = {})) : (CG.S.chefFun || (CG.S.chefFun = {}));

  // ---------- les chapeaux : cousus à l'atelier, un par métier ; portés par quelqu'un qui fait ce métier, ils rendent plus efficace ----------
  Mode.HAT = { cout: { cuir: 2, or: 8 }, bonus: 0.2 }; Mode.CHEF = { cout: { cuir: 4, or: 25 }, dmg: 0.15, mana: 0.2, marchand: 450 }; /* marchand : son prix chez un marchand de passage */
  const prix = c => Object.keys(c).map(r => c[r] + ' ' + CG.RES[r].icon).join(' '), nomJ = (g, j) => (g.sex === 'f' ? CG.JOBS[j].nomF : CG.JOBS[j].nom).toLowerCase();
  Mode.hatOn = g => !!g && !!g.hat && g.hat === g.job;
  function chapeaux(g) {
    const S = CG.S;
    if (!g) { // la coiffe du chef
      if (S.chefHatOwned) return [{ label: (S.chefHat ? '✅ ' : '▫️ ') + '🪶 Coiffe de chef', sub: S.chefHat ? 'Portée : +15 % de dégâts, +0,2 mana par seconde — clique pour l\'enlever' : 'Dans ton coffre : +15 % de dégâts, +0,2 mana par seconde', active: !!S.chefHat, fn: () => { S.chefHat = !S.chefHat; CG.sfx('ok'); UI.tenue(g); } }];
      return [{ label: '🧵 Coudre ta coiffe de chef (' + prix(Mode.CHEF.cout) + ')', sub: 'Trois grandes plumes : +15 % de dégâts, +0,2 mana par seconde', disabled: !G.canPay(Mode.CHEF.cout), fn: () => { G.pay(Mode.CHEF.cout); S.chefHatOwned = true; S.chefHat = true; CG.sfx('build'); UI.tenue(g); } }];
    }
    const own = g.hats || (g.hats = {}), out = [], pct = Math.round(Mode.HAT.bonus * 100);
    if (g.hat && g.hat !== g.job) out.push({ label: '✅ 🎩 Chapeau de ' + nomJ(g, g.hat), sub: 'Porté, mais ce n\'est plus son métier : aucun bonus — clique pour l\'enlever', active: true, fn: () => { g.hat = null; CG.sfx('ok'); UI.tenue(g); } });
    if (own[g.job]) out.push({ label: (g.hat === g.job ? '✅ ' : '▫️ ') + '🎩 Chapeau de ' + nomJ(g, g.job), sub: g.hat === g.job ? 'Porté : +' + pct + ' % d\'efficacité — clique pour l\'enlever' : 'Rangé : +' + pct + ' % d\'efficacité quand il est porté', active: g.hat === g.job, fn: () => { g.hat = g.hat === g.job ? null : g.job; CG.sfx('ok'); UI.tenue(g); } });
    else out.push({ label: '🧵 Coudre un chapeau de ' + nomJ(g, g.job) + ' (' + prix(Mode.HAT.cout) + ')', sub: '+' + pct + ' % d\'efficacité tant qu\'' + (g.sex === 'f' ? 'elle' : 'il') + ' fait ce métier', disabled: !G.canPay(Mode.HAT.cout), fn: () => { G.pay(Mode.HAT.cout); own[g.job] = 1; g.hat = g.job; CG.sfx('build'); UI.tenue(g); } });
    return out;
  }
  const ws0 = G.workSpeed; G.workSpeed = g => ws0(g) * (Mode.hatOn(g) ? 1 + Mode.HAT.bonus : 1);
  const gd0 = G.guardDmg; G.guardDmg = g => gd0(g) * (Mode.hatOn(g) ? 1 + Mode.HAT.bonus : 1);
  const coiffe = () => !!CG.S.chefHat && !(CG.Chapeaux && CG.Chapeaux.porte()); /* la coiffe à plumes ne compte que si c'est bien elle qu'on porte, pas un autre chapeau (chapeaux.js) */
  const pd0 = G.playerDmg; G.playerDmg = () => pd0() * (coiffe() ? 1 + Mode.CHEF.dmg : 1);
  const mr0 = G.manaRegen; G.manaRegen = () => mr0() + (coiffe() ? Mode.CHEF.mana : 0);

  // ---------- la fenêtre : on coche ce qu'on porte ----------
  UI.tenue = function (g) {
    const items = Mode.owned(), W = wear(g), nb = items.filter(i => W[i.id]).length;
    const opts = chapeaux(g).concat(items.map(i => ({ label: (W[i.id] ? '✅ ' : '▫️ ') + i.icon + ' ' + i.nom, sub: W[i.id] ? 'Porté — clique pour l\'enlever' : i.desc, active: !!W[i.id], fn: () => { if (W[i.id]) delete W[i.id]; else W[i.id] = 1; CG.sfx('ok'); UI.tenue(g); } })));
    if (nb) opts.push({ label: '🧺 Tout enlever', fn: () => { items.forEach(i => delete W[i.id]); UI.tenue(g); } });
    opts.push({ label: g ? '👋 C\'est parfait' : '👋 Fermer' });
    UI.dialog({ goblin: g || undefined, who: g ? g.name : '🧵 Atelier de couture', tag: g ? 'Sa tenue' : 'Ta tenue de chef',
      text: (g ? 'Qu\'est-ce que je mets, chef ?' : 'Choisis ce que tu portes. Pour habiller un gobelin, va lui parler.') + (items.length ? '' : ' Pour d\'autres vêtements, débloque-les dans l\'arbre (T), branche « Garde-robe du clan ».'), options: opts });
  };
  // l'option dans la discussion avec un gobelin (seulement une fois l'atelier bâti)
  // l'option est rangée dans « Discuter » (seulement une fois l'atelier bâti) : elle s'ajoute aux réponses du premier sujet
  Mode.opt = g => [];
  window.addEventListener('load', () => { const Soc = CG.Soc; if (!Soc || !Soc.chat) return; let premier = null;
    const ch0 = Soc.chat; Soc.chat = function (g, topic) { premier = topic ? null : g; try { return ch0.apply(this, arguments); } finally { premier = null; } };
    const dl0 = UI.dialog; UI.dialog = function (o) { const g = premier; if (g && o && o.goblin === g && Array.isArray(o.options) && Mode.atelier()) { premier = null; o = Object.assign({}, o, { options: o.options.concat([{ label: '👕 Changer sa tenue', fn: () => UI.tenue(g) }]) }); } return dl0.call(this, o); };
  });

  // à la porte de l'atelier : la tenue du chef
  const find0 = D.findInteract;
  D.findInteract = function () {
    const it = find0.apply(this, arguments);
    if (it && it.type !== 'hut' && it.type !== 'home') return it;
    const R = CG.R, p = CG.S.player; if (R.ko > 0 || R.cine || R.build) return it;
    for (const b of CG.S.buildings) if (b.type === 'couture' && !b.site && CG.dist(p, G.door(b)) < 52) return { type: 'couture', obj: b, label: 'Changer de tenue' };
    return it;
  };
  const inter0 = D.interact;
  D.interact = function () { const it = D.findInteract(); if (it && it.type === 'couture') return UI.tenue(null); return inter0.apply(this, arguments); };

  // ---------- dessin de l'atelier ----------
  const box = (c, x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
  const ell = (c, x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.fill(); };
  const poly = (c, p, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); };
  Art.extra.couture = { w: 124, h: 124, draw(c) {
    const m = 62, b = 116; ell(c, m, b, 48, 9, 'rgba(0,0,0,0.25)');
    box(c, m - 38, b - 46, 76, 46, '#d8b88a'); box(c, m, b - 46, 38, 46, 'rgba(0,0,0,0.12)'); box(c, m - 38, b - 8, 76, 8, '#a8845a');
    box(c, m - 9, b - 28, 18, 28, '#4a2e5a'); ell(c, m + 5, b - 14, 1.8, 1.8, '#ffd84a');
    poly(c, [m - 50, b - 42, m + 50, b - 42, m + 18, b - 96, m - 18, b - 96], '#9a4aa8'); poly(c, [m, b - 42, m + 50, b - 42, m + 18, b - 96, m, b - 96], '#7a3a88');
    for (let i = 0; i < 6; i++) { const x = m - 44 + i * 17.6; poly(c, [x, b - 42, x + 17.6, b - 42, x + 8.8, b - 32], i % 2 ? '#ffd84a' : '#ff9ccc'); }
    // enseigne : une bobine de fil et une aiguille
    ell(c, m, b - 66, 13, 13, '#f4ead0'); box(c, m - 7, b - 74, 14, 16, '#e8302a'); box(c, m - 9, b - 76, 18, 3, '#8a5a2a'); box(c, m - 9, b - 59, 18, 3, '#8a5a2a');
    c.strokeStyle = '#c8c8d0'; c.lineWidth = 2; c.beginPath(); c.moveTo(m + 14, b - 80); c.lineTo(m - 12, b - 54); c.stroke(); c.strokeStyle = '#e8302a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(m + 13, b - 79); c.quadraticCurveTo(m + 26, b - 70, m + 16, b - 58); c.stroke();
    // corde à linge avec des vêtements
    box(c, m + 40, b - 40, 3, 40, '#6b4a2a'); box(c, m + 56, b - 34, 3, 34, '#6b4a2a'); c.strokeStyle = '#d8c8a0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(m + 41, b - 38); c.quadraticCurveTo(m + 49, b - 32, m + 57, b - 32); c.stroke();
    poly(c, [m + 43, b - 36, m + 51, b - 34, m + 50, b - 22, m + 44, b - 23], '#7ad0ff'); poly(c, [m + 51, b - 33, m + 56, b - 32, m + 56, b - 24, m + 52, b - 25], '#ffd84a');
    // mannequin
    box(c, m - 31, b - 18, 2.5, 18, '#6b4a2a'); ell(c, m - 30, b - 24, 7, 9, '#e85a9a'); ell(c, m - 30, b - 35, 3.5, 3.5, '#c8a878');
  } };
})(window.CG);
