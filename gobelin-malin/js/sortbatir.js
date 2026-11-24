// Goblin Malin — « Chantier éclair », un sort du 7e cercle. On le lance une fois : la liste des chantiers en cours s'ouvre
//   (constructions à bâtir et améliorations en travaux), on choisit, et c'est bâti en un clin d'œil.
//   Il coûte toujours MANA (100), sans rabais ; le mana n'est pris que si on choisit vraiment quelque chose.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, T = CG.TILE, SP = CG.SPELLS, ID = 'batisseur', Sb = CG.SortBatir = { MANA: 100, PRIX: 1700 };
  SP[ID] = { nom: 'Chantier éclair', icon: '🏗️', mp: Sb.MANA, prix: Sb.PRIX, color: '#ffd86a', desc: 'Tu choisis un chantier ou des travaux en cours, n\'importe où dans le village : c\'est bâti en un clin d\'œil. Coûte ' + Sb.MANA + ' de mana, toujours.' };
  if (CG.SCROLL_POOL && !CG.SCROLL_POOL.includes(ID)) CG.SCROLL_POOL.push(ID);
  if (CG.CerclesPrix && CG.CerclesPrix.CERCLE) CG.CerclesPrix.CERCLE[ID] = 7;
  { const sc0 = G.spellCost; G.spellCost = function (id) { return id === ID ? Sb.MANA : sc0.apply(this, arguments); }; }
  const milieu = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T });
  Sb.liste = function () { const S = CG.S, p = S.player, Am = CG.Ameliorer, l = [];
    for (const b of S.buildings) { const d = CG.BUILDS[b.type]; if (!d) continue;
      if (b.site) l.push({ b, quoi: 'site', nom: d.nom, icon: d.icon || '🏗️', fait: b.need ? Math.min(1, (b.prog || 0) / b.need) : 0 });
      else if (b.upg && Am && Am.finish) { const n = Am.UP && Am.UP[b.type] && Am.UP[b.type][b.upg.i]; l.push({ b, quoi: 'travaux', nom: (n && n.nom) || 'Travaux : ' + d.nom, icon: '🔨', fait: b.upg.need ? Math.min(1, (b.upg.prog || 0) / b.upg.need) : 0 }); } }
    l.forEach(q => { const c = milieu(q.b); q.d = Math.hypot(c.x - p.x, c.y - p.y); }); return l.sort((a, b) => a.d - b.d); };
  function batir(q) {
    const S = CG.S, R = CG.R, p = S.player, b = q.b; if (!S.buildings.includes(b) || (q.quoi === 'site' ? !b.site : !b.upg)) return; if (p.mp < Sb.MANA) { CG.sfx('no'); return; }
    p.mp -= Sb.MANA; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); const c = milieu(b);
    for (let i = 0; i < 3; i++) R.rings.push({ x: c.x, y: c.y, r: 50 + i * 45, life: 0.4 + i * 0.15, col: '#ffd86a' }); G.puff(c.x, c.y - 10, '#ffe9a8', 40, 220, 5); G.puff(c.x, c.y - 10, '#c9c2b0', 24, 160, 4); R.rings.push({ x: p.x, y: p.y - 6, r: 60, life: 0.4, col: '#ffd86a' });
    if (q.quoi === 'site') G.finishBuild(b); else { b.upg.prog = b.upg.need; CG.Ameliorer.finish(b); }
    G.text(c.x, c.y - 84, '🏗️ En un clin d\'œil !', '#ffe36b', true); R.shake = Math.max(R.shake || 0, 0.12);
  }
  const cast0 = G.cast; G.cast = function (id) {
    if (id !== ID) return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || UI.modal) return;
    const l = Sb.liste(); if (!l.length) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Rien à bâtir en ce moment', '#ffe9a8'); return; }
    if (p.mp < Sb.MANA) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana (' + Sb.MANA + ')', '#9ab6ff'); return; }
    UI.dialog({ who: 'Chantier éclair', tag: '🏗️ ' + Sb.MANA + ' de mana', text: 'Que veux-tu voir bâti en un clin d\'œil ?', options: l.slice(0, 8).map(q => ({ label: q.icon + ' ' + q.nom + ' (' + Math.round(q.fait * 100) + ' % fait)', fn: () => batir(q) })).concat([{ label: 'Rien, finalement', sub: 'Le mana n\'est pas dépensé', echap: true }]) });
  };
})(window.CG);
