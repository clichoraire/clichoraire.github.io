// Goblin Malin — une demande propre aux bricoleurs : « va améliorer des murs ». Dans la discussion avec un bricoleur, on
// choisit le matériau (pierre ou métal), puis combien de murs. Il faut avoir de quoi payer le tout ; si oui, on paie, les
// chantiers s'ouvrent (les plus proches de lui d'abord) et il part au travail. Clôtures, palissades, murs et portails.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, T = CG.TILE, Am = CG.Ameliorer, Br = CG.Bricoleur = { NOMBRES: [1, 3, 5, 10], MURS: ['cloture', 'muret', 'palissade', 'mur', 'portail', 'portailPierre'] };
  if (!Am) return;
  Br.MAT = { pierre: { ic: '🪨', nom: 'En pierre', techs: ['d3'], dit: 'en pierre' }, metal: { ic: '⚙️', nom: 'En métal', techs: ['d8', 'd9'], dit: 'en métal' } };
  const prix = c => Object.keys(c).filter(r => c[r] > 0).map(r => c[r] + ' ' + CG.RES[r].icon).join(' ');
  // les murs qu'on peut améliorer dans ce matériau, du plus proche au plus loin (en suivant le mur de proche en proche)
  Br.murs = function (g, mat) {
    const M = Br.MAT[mat], l = CG.S.buildings.filter(b => Br.MURS.includes(b.type) && !b.site && !b.upg && !b.ruin && Am.next(b) && M.techs.includes(Am.next(b).tech));
    const out = []; let x = g.x, y = g.y;
    while (l.length) { let bi = 0, bd = 1e9; l.forEach((b, i) => { const d = Math.hypot((b.tx + b.w / 2) * T - x, (b.ty + b.h / 2) * T - y); if (d < bd) { bd = d; bi = i; } }); const b = l.splice(bi, 1)[0]; out.push(b); x = (b.tx + b.w / 2) * T; y = (b.ty + b.h / 2) * T; }
    return out;
  };
  const somme = l => { const c = {}; l.forEach(b => { const n = Am.next(b).cout; Object.keys(n).forEach(r => { c[r] = (c[r] || 0) + n[r]; }); }); return c; };
  Br.demander = function (g) {
    const opts = Object.keys(Br.MAT).map(k => { const M = Br.MAT[k], n = Br.murs(g, k).length;
      return { label: M.ic + ' ' + M.nom, sub: n ? n + ' mur' + (n > 1 ? 's' : '') + ' à améliorer' : 'Aucun mur à améliorer comme ça pour l\'instant', disabled: !n, fn: () => Br.combien(g, k) }; });
    UI.dialog({ goblin: g, who: g.name, tag: '🔨 bricoleur', infos: true, text: 'Améliorer des murs ? Avec plaisir, chef ! En quoi je les fais ?', options: opts.concat([{ label: '↩ Retour', fn: () => UI.talkGoblin(g) }]) });
  };
  Br.combien = function (g, mat) {
    const M = Br.MAT[mat], l = Br.murs(g, mat), ns = Br.NOMBRES.filter(n => n < l.length).concat([l.length]);
    const opts = ns.map(n => { const lot = l.slice(0, n), c = somme(lot), ok = G.canPay(c);
      return { label: (n === l.length && n > 1 ? 'Tous les ' + n + ' murs' : n + ' mur' + (n > 1 ? 's' : '')) + ' — ' + prix(c), sub: ok ? '' : 'Il te manque des ressources', disabled: !ok, fn: () => Br.partir(g, mat, lot) }; });
    UI.dialog({ goblin: g, who: g.name, tag: '🔨 bricoleur', text: M.nom + ', compris. Combien de murs, chef ? Je commence par les plus proches.', options: opts.concat([{ label: '↩ Retour', fn: () => Br.demander(g) }]) });
  };
  Br.partir = function (g, mat, lot) {
    if (!G.canPay(somme(lot))) { CG.sfx('no'); return UI.toast('Il te manque des ressources.'); }
    let n = 0; lot.forEach(b => { if (Am.apply(b)) n++; }); if (!n) return;
    G.resetGoblin(g); G.say(g, n > 1 ? 'J\'y vais, chef ! ' + n + ' murs ' + Br.MAT[mat].dit + ', c\'est parti.' : 'J\'y vais, chef ! Un mur ' + Br.MAT[mat].dit + ', c\'est parti.', 3.5); g.emoteT = 2;
  };
  // dans la discussion avec un bricoleur
  const dl0 = UI.dialog; UI.dialog = function (o) {
    const g = o && o.goblin; if (false && g) { /* l'option est maintenant rangée dans « Discuter » (discuter.js) */
      const opts = o.options.slice(), i = opts.findIndex(x => x && /^👋/.test(x.label || ''));
      opts.splice(i < 0 ? opts.length : i, 0, { label: '🧱 Lui demander d\'améliorer des murs', fn: () => Br.demander(g) });
      o = Object.assign({}, o, { options: opts });
    }
    return dl0.call(this, o);
  };
})(window.CG);
