// Clan Gobelin — le nom véritable : nommer un gobelin ou un animal le fait évoluer (le lendemain matin), mais ça coûte au chef.
'use strict';
(function (CG) {
  const G = CG.G, P = CG.P;
  G.NAME_TECH = 's13'; G.NAME_LVL = 5; G.PET_NAME_LVL = 5;
  G.nameCost = () => ({ food: 15, or: 20, hp: Math.round(CG.S.player.maxhp * 0.3) });
  const taken = n => CG.S.goblins.concat(CG.S.pets).some(o => (o.name || '').toLowerCase() === n.toLowerCase() || (o.naming || '').toLowerCase() === n.toLowerCase());
  // l'option du menu de discussion (gobelin ou animal) ; rien tant que le pouvoir n'est pas appris
  G.nameOpt = function (o) {
    if (!G.tech(G.NAME_TECH) || o.nomme) return [];
    const S = CG.S, c = G.nameCost(), need = o.pet ? G.PET_NAME_LVL : G.NAME_LVL, prix = '-' + c.food + ' 🍖 · -' + c.or + ' 🪙 · -' + c.hp + ' ❤';
    if (o.naming) return [{ label: '🏷️ Son nom véritable : ' + o.naming, sub: 'Le changement se fera pendant la nuit : tu verras demain matin', disabled: true }];
    if (o.lvl < need) return [{ label: '🏷️ Lui donner un nom véritable', sub: 'Pas encore prêt : il faut être de niveau ' + need + ' (niveau ' + o.lvl + ' en ce moment)', disabled: true }];
    const why = S.res.food < c.food ? 'Il te manque de la nourriture' : S.res.or < c.or ? 'Il te manque de l\'or' : S.player.hp <= c.hp ? 'Tu es trop blessé : ça te coûterait la vie' : '';
    return [{ label: '🏷️ Lui donner un nom véritable', sub: why ? why + ' (' + prix + ')' : 'Recevoir un nom, c\'est évoluer · ' + prix, disabled: !!why, fn: () => G.nameDialog(o) }];
  };
  G.nameDialog = function (o, err) {
    const c = G.nameCost(), d = { who: o.name, tag: '🏷️ nom véritable', text: (err ? err + ' ' : '') + 'Quel nom veux-tu donner à ' + o.name + ' ? Ça te coûtera ' + c.food + ' 🍖, ' + c.or + ' 🪙 et ' + c.hp + ' ❤ de ta propre énergie. Le changement se fera pendant la nuit.',
      extra: '<p><input id="nm-in" type="text" maxlength="14" autocomplete="off" placeholder="Nouveau nom" style="font:inherit;padding:6px 10px;border-radius:8px;border:2px solid #6b4a2a;background:#fff8e4;color:#2a1c0e;width:220px"></p>',
      options: [{ label: '✨ Lui donner ce nom', fn: () => {
        const n = (document.getElementById('nm-in').value || '').trim().replace(/\s+/g, ' ');
        if (n.length < 2) return G.nameDialog(o, 'Il faut au moins deux lettres.');
        if (taken(n)) return G.nameDialog(o, 'Ce nom est déjà porté dans le clan.');
        G.giveName(o, n);
      } }, { label: 'Pas maintenant' }] };
    if (o.pet) d.visitor = { role: 'animal', look: 'animal', kind: o.kind, evo: o.evo }; else d.goblin = o;
    CG.UI.dialog(d); const el = document.getElementById('nm-in'); if (el) { el.focus(); el.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') document.querySelector('#dialog .opts button').click(); }; }
  };
  G.giveName = function (o, n) {
    const S = CG.S, p = S.player, c = G.nameCost();
    if (S.res.food < c.food || S.res.or < c.or || p.hp <= c.hp) return false;
    S.res.food -= c.food; S.res.or -= c.or; p.hp -= c.hp; CG.R.hurtFlash = 0.5; o.naming = n;
    G.text(p.x, p.y - 56, '-' + c.hp + ' ❤', '#ff6a5a', true); G.text(o.x, o.y - 50, '✨', '#fff', true); G.puff(o.x, o.y - 18, '#ffe9a8', 14, 80, 3); CG.sfx('spell');
    CG.UI.toast('🏷️ Tu as nommé ' + o.name + ' : « ' + n + ' ». Le nom te vide de ton énergie... Rien ne change pour l\'instant.');
    return true;
  };
  // pendant la nuit : le nom prend, et celui qui le porte évolue
  G.applyNames = function (lines) {
    const S = CG.S;
    S.goblins.concat(S.pets).forEach(o => {
      if (!o.naming) return;
      const old = o.name; o.name = o.naming; o.naming = null; o.nomme = true;
      if (lines) lines.push('🏷️ ' + old + ' s\'est réveillé' + (o.sex === 'f' ? 'e' : '') + ' changé' + (o.sex === 'f' ? 'e' : '') + ' : on l\'appelle désormais ' + o.name + '. Plus grand' + (o.sex === 'f' ? 'e' : '') + ', plus fort' + (o.sex === 'f' ? 'e' : '') + ', plus vaillant' + (o.sex === 'f' ? 'e' : '') + '.');
    });
  };
  // les nommés : plus de vie, plus de force, plus de cœur à l'ouvrage
  const mh = G.gobMaxHp; G.gobMaxHp = g => Math.round(mh(g) * (g.nomme ? 1.4 : 1));
  const ws = G.workSpeed; G.workSpeed = g => ws(g) * (g.nomme ? 1.25 : 1);
  const gd = G.guardDmg; G.guardDmg = g => gd(g) * (g.nomme ? 1.3 : 1);
  const pm = P.maxHp; P.maxHp = p => Math.round(pm(p) * (p.nomme ? 1.4 : 1));
  const pd = P.dmg; P.dmg = p => pd(p) * (p.nomme ? 1.3 : 1);
})(window.CG);
