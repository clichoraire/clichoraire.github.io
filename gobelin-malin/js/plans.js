// Goblin Malin — les plans de construction. Certains marchands de passage proposent parfois, très cher (300 à 800 or), le plan
// d'une construction que tu n'as pas encore. Le plan débloque cette case de l'arbre des technologies : tu peux bâtir la chose
// tout de suite, et la case compte comme apprise : elle ouvre le chemin vers ses voisines (décision de Matthieu, v0.238).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, pick = CG.pick;
  const Pl = CG.Plans = { CHANCE: 0.4, PRIX: [300, 800], ROLES: ['nain', 'elfe', 'demonMarchand', 'lapin'] };
  const plans = () => { const t = CG.S.tech; return t.plans || (t.plans = {}); };
  Pl.a = id => !!(CG.S && CG.S.tech && CG.S.tech.plans && CG.S.tech.plans[id]);
  // les cases qui débloquent une construction, pas encore obtenues
  Pl.dispo = () => CG.TECH.filter(n => (n.unlock || []).some(b => CG.BUILDS[b]) && !G.tech(n.id));
  Pl.prix = function (n) { const l = CG.TECH.filter(q => (q.unlock || []).length).map(q => q.cout), a = Math.min.apply(null, l), b = Math.max.apply(null, l), k = b > a ? (n.cout - a) / (b - a) : 0.5; return Math.round((Pl.PRIX[0] + (Pl.PRIX[1] - Pl.PRIX[0]) * k) / 10) * 10; };
  Pl.acheter = function (id) {
    const S = CG.S, n = CG.TECH_BY_ID[id]; if (!n || G.tech(id)) return false; S.tech.owned[id] = true; plans()[id] = true; if (n.onBuy) n.onBuy();
    const noms = n.unlock.filter(b => CG.BUILDS[b]).map(b => CG.BUILDS[b].nom).join(', '); CG.sfx('level'); UI.toast('📐 Plan acheté : tu peux maintenant bâtir ' + noms + ' (B). Dans l\'arbre, les cases d\'à côté s\'ouvrent.'); return true;
  };
  Pl.article = function (n) { const noms = n.unlock.filter(b => CG.BUILDS[b]).map(b => CG.BUILDS[b].nom).join(', ');
    return { plan: n.id, icon: '📐', label: 'Plan : ' + noms, desc: 'Tu pourras le bâtir, et ça ouvre les cases d\'à côté.', prix: Pl.prix(n), stock: 1, buy: () => Pl.acheter(n.id) }; };
  const sh0 = UI.shop; UI.shop = function (v) {
    try { if (v && v.shop && v.planVu === undefined && Pl.ROLES.includes(v.role)) { v.planVu = Math.random() < Pl.CHANCE; const l = Pl.dispo(); if (v.planVu && l.length) v.shop.push(Pl.article(pick(l))); }
      if (v && v.shop) v.shop.forEach(it => { if (it.plan && G.tech(it.plan)) it.stock = 0; }); } catch (e) { /* jamais bloquant */ }
    return sh0.apply(this, arguments);
  };
})(window.CG);
