// Goblin Malin — les technologies offertes. De temps en temps, une case de l'arbre est donnée sans dépenser de point :
// parfois à la mort d'un mini-boss, rarement à la fin d'un portail, très très rarement par une Grande Fée (qui laisse
// alors choisir entre deux constructions).
// Règles : la case offerte se trouve au plus Dn.LOIN anneaux plus loin que l'anneau le plus éloigné déjà atteint (sans
// jamais dépasser le dernier). Elle ouvre ses voisines du MÊME anneau ; pour passer par elle vers un autre anneau, il
// faut d'abord qu'une case apprise avec des points la touche. Et une case « niveau 2 » (CG.Vues.NIVEAU) reste fermée
// tant que son niveau 1 n'est pas appris.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, V = CG.Vues, pick = CG.pick;
  if (!V) return;
  const Dn = CG.DonTech = { BOSS: 0.25, PORTAIL: 0.1, FEE: 0.05, LOIN: 2 };
  const tech = () => CG.S.tech, dons = () => tech().dons || (tech().dons = {});
  Dn.a = id => !!(CG.S && CG.S.tech && CG.S.tech.dons && CG.S.tech.dons[id]);
  // l'anneau le plus éloigné où le chef possède déjà une case (0 : rien encore)
  Dn.rendu = () => CG.TECH.reduce((m, n) => G.tech(n.id) && V.anneau(n.id) < 99 ? Math.max(m, V.anneau(n.id)) : m, 0);
  Dn.max = () => Math.min(V.plan(2).K, Dn.rendu() + Dn.LOIN);
  // les cases qu'on peut offrir maintenant ; construction = seulement celles qui révèlent une construction
  Dn.choix = function (construction) {
    const max = Dn.max();
    return CG.TECH.filter(n => !n.vide && !n.bonus && !G.tech(n.id) && V.anneau(n.id) <= max && !(V.NIVEAU[n.id] && !G.tech(V.NIVEAU[n.id])) && (!construction || (n.unlock || []).some(b => CG.BUILDS[b])));
  };
  Dn.donner = function (id, qui) {
    const n = CG.TECH_BY_ID[id], t = tech(); if (!n || (G.tech(id) && !(t.plans && t.plans[id]))) return false;
    const sousPlan = !!(t.plans && t.plans[id]); if (sousPlan) delete t.plans[id];
    t.owned[id] = true; dons()[id] = true; if (n.onBuy && !sousPlan) n.onBuy();
    const noms = (n.unlock || []).filter(b => CG.BUILDS[b]).map(b => CG.BUILDS[b].nom).join(', ');
    CG.sfx('level'); G.banner('Nouvelle technologie !', n.icon + ' ' + n.nom + (noms ? ' : tu peux bâtir ' + noms + ' (B).' : ' : ' + n.desc), '#ffe36b');
    UI.toast('🌳 ' + (qui || 'Cadeau') + ' : « ' + n.nom + ' » t\'est offerte, sans dépenser de point. Dans l\'arbre, ses voisines du même anneau sont ouvertes.');
    try { CG.save(); } catch (e) { /* rien */ } return true;
  };
  Dn.hasard = function (qui) { const l = Dn.choix(false); return l.length ? Dn.donner(pick(l).id, qui) : false; };
  // deux constructions différentes, pour la Grande Fée
  Dn.deux = function () { const l = Dn.choix(true); if (l.length < 2) return null; const a = pick(l), b = pick(l.filter(n => n !== a)); return [a.id, b.id]; };

  // ---------- un mini-boss tombe ----------
  { const he0 = G.hurtEnemy; G.hurtEnemy = function (e) {
    const vivant = e && !e.dead, r = he0.apply(this, arguments);
    try { if (vivant && e.dead && !e.donVu && (CG.ENEMIES[e.type] || {}).boss) { e.donVu = true; if (Math.random() < Dn.BOSS) Dn.hasard('Butin du chef ennemi'); } } catch (err) { /* jamais bloquant */ }
    return r;
  }; }
  // ---------- un portail est terminé ----------
  if (CG.Arene) { const ga0 = CG.Arene.gagner; CG.Arene.gagner = function () {
    const A = CG.S.arene, avant = !!(A && A.gagne), r = ga0.apply(this, arguments);
    try { if (A && !avant && A.gagne && Math.random() < Dn.PORTAIL) Dn.hasard('Trouvée derrière le portail'); } catch (err) { /* jamais bloquant */ }
    return r;
  }; }
})(window.CG);
