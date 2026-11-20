// Goblin Malin — la publicité : certains marchands proposent, contre de l'or, de vanter le clan sur les routes.
// Le marchand repart aussitôt en criant ses louanges jusqu'à la sortie de la carte. Trois niveaux : plus on paie, plus il en fait,
// plus longtemps ça dure, et plus on a de chances de voir arriver des gobelins errants les matins suivants.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, pick = CG.pick, rand = CG.rand, Pu = CG.Pub = { OFFRE: 0.45, ROLES: ['nain', 'elfe', 'sorciere', 'demonMarchand'] };
  Pu.NIV = [null,
    { nom: 'Petite annonce', icon: '📣', prix: 35, jours: 2, chance: 0.4, desc: 'Il parle de ton clan en chemin, sans trop se fatiguer.' },
    { nom: 'Grande tournée', icon: '📯', prix: 80, jours: 3, chance: 0.65, desc: 'Il vante ton clan dans chaque village, à pleine voix.' },
    { nom: 'Légende vivante', icon: '🎺', prix: 160, jours: 5, chance: 0.9, desc: 'Il chante ta gloire partout où il passe : on parlera de toi jusqu\'au bout des routes.' }];
  const CRIS = [null,
    ['Il paraît que le clan de {n} prend des gobelins...', 'Gobelins sans toit ? Allez voir chez {n}. C\'est pas mal.', 'Le clan de {n} cherche du monde ! Enfin, je crois.', 'Y a de la place chez {n}, à ce qu\'on dit.'],
    ['Oyez, oyez ! Le clan de {n} accueille les gobelins !', 'Un toit, un feu, une fête chaque soir : chez {n} !', 'Gobelins errants ! Le clan de {n} vous ouvre ses huttes !', 'Le meilleur clan de la forêt ? Celui de {n}, pardi !', 'Venez nombreux ! Chez {n}, on mange à sa faim !'],
    ['GLOIRE AU CLAN DE {N} ! LE PLUS GRAND DE TOUS LES CLANS !', 'OYEZ ! {N} LE MALIN ACCUEILLE TOUS LES GOBELINS !', 'DES HUTTES, DES FÊTES, DE LA VIANDE ! CHEZ {N} !', 'QUI N\'A PAS ENTENDU PARLER DE {N} ?! LE CHEF DES CHEFS !', 'ACCOUREZ ! LE CLAN DE {N} ENTRE DANS LA LÉGENDE !', 'MÊME LES DÉMONS TREMBLENT DEVANT {N} ! REJOIGNEZ-LE !']];
  Pu.active = () => { const S = CG.S, p = S && S.pub; return p && S.day > p.jour && S.day <= p.fin ? p : null; };
  const reste = p => p.fin - Math.max(CG.S.day, p.jour);
  // ---------- l'offre, dans la boutique de certains marchands ----------
  const sh0 = UI.shop; UI.shop = function (v) {
    const S = CG.S;
    if (v && v.shop && v.pubVu === undefined && Pu.ROLES.includes(v.role)) { v.pubVu = Math.random() < Pu.OFFRE;
      if (v.pubVu) [1, 2, 3].forEach(n => { const N = Pu.NIV[n]; v.shop.push({ pub: n, icon: N.icon, label: 'Publicité : ' + N.nom, desc: N.desc + ' Pendant ' + N.jours + ' jours, ' + Math.round(N.chance * 100) + ' % de chances chaque matin que des gobelins errants viennent frapper à ta porte. Il repart tout de suite faire sa tournée.', prix: N.prix, stock: 1,
        buy: () => { v.pub = n; v.shop.forEach(it => { if (it.pub) it.stock = 0; }); const a = S.pub, f = S.day + N.jours; S.pub = { niv: a && a.fin >= S.day ? Math.max(a.niv, n) : n, jour: S.day, fin: a && a.fin >= S.day ? Math.max(a.fin, f) : f }; UI.toast(N.icon + ' ' + N.nom + ' : le marchand part vanter ton clan. Des gobelins errants pourraient arriver dès demain.'); } }); }); }
    return sh0.apply(this, arguments);
  };
  // ---------- il s'en va en criant ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return;
    for (const v of R.visitors) { if (!v.pub || v.state !== 'leave') continue; v.pubT = (v.pubT === undefined ? 1.2 : v.pubT) - dt; if (v.pubT > 0) continue; v.pubT = v.pub === 3 ? 2.6 : v.pub === 2 ? 3.2 : 4.2;
      let t; do { t = pick(CRIS[v.pub]); } while (t === v.pubDit && CRIS[v.pub].length > 1); v.pubDit = t; G.say(v, t.replace('{n}', S.name).replace('{N}', S.name.toUpperCase()), v.pub === 3 ? 2.4 : 2.8);
      if (v.pub >= 2 && CG.onScreen(v.x, v.y)) { G.text(v.x + rand(-10, 10), v.y - 78, pick(['♪', '📣', '♫']), '#ffe36b'); if (v.pub === 3) CG.sfx('horn'); } }
  };
  // ---------- l'effet : des gobelins errants, les matins suivants ----------
  const pl0 = D.plan; D.plan = function () {
    const r = pl0.apply(this, arguments), S = CG.S, R = CG.R, p = Pu.active(); if (!p || !R.schedule) return r;
    if (CG.Mondes && CG.Mondes.marais() && !S.buildings.some(b => b.type === 'chief' && !b.site)) return r;
    if (R.schedule.some(e => e.type === 'visit' && e.role === 'nomade') || Math.random() > Pu.NIV[p.niv].chance) return r;
    R.schedule.push({ h: rand(7, 12.5), type: 'visit', role: 'nomade', pub: true }); R.schedule.sort((a, b) => a.h - b.h);
    return r;
  };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'pub', ic: '📣', nom: () => { const p = CG.S.pub; return 'Publicité : ' + Pu.NIV[p.niv].nom; }, txt: () => { const p = CG.S.pub, j = reste(p); return 'Un marchand vante ton clan sur les routes : ' + Math.round(Pu.NIV[p.niv].chance * 100) + ' % de chances chaque matin que des gobelins errants arrivent. Encore ' + j + (j > 1 ? ' jours.' : ' jour.'); }, t: () => { const S = CG.S, p = S && S.pub; return p && S.day <= p.fin && reste(p) > 0 ? true : 0; } });
})(window.CG);
