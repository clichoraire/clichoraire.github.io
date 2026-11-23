// Goblin Malin — les os. On les ramasse : ils vont dans le sac du chef (une pile, comme les potions).
//   Pour en faire des potions, on les porte à un alchimiste : on lui parle, on choisit la potion, puis combien d'os on lui laisse.
//   Il dit combien de potions ça fera et en combien de temps ; on accepte, ou on annule. Les os donnés restent au chaudron.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Al = CG.Alchimie; if (!Al || !UI) return;
  const Os = CG.OsPorte = { CHOIX: [1, 3, 5, 10] }; /* les quantités proposées, en nombre de potions (plus « tout ») */
  const TAILLE = ['', 'petite', 'moyenne', 'grosse'];
  const spe = r => (Al.SPE && Al.SPE[r.slice(0, -1)]) || null;
  const nom = (r, n) => { const q = spe(r); if (q) return q.nom.toLowerCase(); const t = TAILLE[Al.niveau()]; return (n > 1 ? t + 's potions de ' : t + ' potion de ') + (r[0] === 'v' ? 'vie' : 'mana'); };
  const ic = r => spe(r) ? spe(r).ic : r[0] === 'v' ? '❤️' : '💧';
  const sur = () => Math.floor(CG.S.player.os || 0);
  // une vieille partie : les os de la réserve reviennent dans le sac, pour être portés à l'alchimiste
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments), S = CG.S, p = S.player; p.os = p.os || 0; if (!S.osV) { S.osV = 1; const n = Math.floor((S.res && S.res.os) || 0); if (n > 0) { p.os += n; S.res.os -= n; } } return r; };
  // ramassés : dans le sac (les gants comptent toujours)
  const pk0 = G.pickUp; if (pk0) G.pickUp = function (d) { if (!(d && d.kind === 'res' && d.res === 'os')) return pk0.apply(this, arguments); const S = CG.S, a = S.res.os || 0, r = pk0.apply(this, arguments), n = (S.res.os || 0) - a; if (n > 0) { S.res.os = a; S.player.os = (S.player.os || 0) + n; } return r; };
  const chaudron = g => g && g.chaud ? CG.S.buildings.find(b => b.type === 'chaudron' && !b.site && b.tx + ',' + b.ty === g.chaud) : null;
  const etat = g => { const S = CG.S; S.alchimie = S.alchimie || {}; return S.alchimie[g.chaud] || (S.alchimie[g.chaud] = { r: null, prog: 0, paye: false, caisse: 0, cr: null }); };
  const recettes = () => { const p = CG.S.player, l = ['vie1', 'mana1']; if (Al.SPE) Object.keys(Al.SPE).forEach(k => { const v = p.recettes && p.recettes[k]; if (v && v !== 'deposee') l.push(k + '1'); }); return l; };
  const temps = (g, r, n) => { const la = CG.S.goblins.filter(o => o.job === 'alchimiste' && o.chaud === g.chaud && !o.exile).length, v = la > 1 ? Al.DEUX : 1, s = n * Al.temps(r) / v; return s < 50 ? 'moins d\'une minute' : 'à peu près ' + Math.max(1, Math.round(s / 60)) + ' minute' + (Math.round(s / 60) > 1 ? 's' : ''); };
  const retour = g => ({ label: '↩ Annuler', fn: () => { if (UI.talkGoblin) UI.talkGoblin(g); } });
  Os.choisir = function (g) {
    if (!chaudron(g)) return UI.dialog({ goblin: g, who: g.name, tag: '⚗️ alchimiste', text: 'Je n\'ai pas encore de chaudron, chef. Garde tes os pour l\'instant.', options: [retour(g)] });
    const n = sur(); UI.dialog({ goblin: g, who: g.name, tag: '🦴 tu as ' + n + ' os', text: 'Des os ! Parfait. Qu\'est-ce que je te prépare avec ça, chef ?',
      options: recettes().map(r => { const c = Al.cout(r); return { label: ic(r) + ' ' + nom(r, 1).replace(/^./, x => x.toUpperCase()), sub: n < c ? 'Il faut ' + c + ' os pour une seule : tu n\'en as pas assez' : c + ' os par potion', disabled: n < c, fn: () => Os.combien(g, r) }; }).concat([retour(g)]) });
  };
  Os.combien = function (g, r) {
    const c = Al.cout(r), max = Math.floor(sur() / c), l = Os.CHOIX.filter(k => k < max).concat([max]);
    UI.dialog({ goblin: g, who: g.name, tag: '🦴 tu as ' + sur() + ' os', text: 'Combien d\'os tu me laisses, chef ?',
      options: l.map(k => ({ label: '🦴 ' + k * c + ' os', sub: (k === max && l.length > 1 ? 'Tout ce que tu peux donner : ' : 'De quoi faire ') + k + ' potion' + (k > 1 ? 's' : ''), fn: () => Os.estimer(g, r, k) })).concat([{ label: '↩ Choisir une autre potion', fn: () => Os.choisir(g) }]) });
  };
  Os.estimer = function (g, r, k) {
    const c = Al.cout(r), x = k * c;
    UI.dialog({ goblin: g, who: g.name, tag: '⚗️ son estimation', text: 'Avec ' + x + ' os, je te fais ' + k + ' ' + nom(r, k) + '. Ça va me prendre ' + temps(g, r, k) + '. Ça te va, chef ?',
      options: [{ label: '✅ D\'accord, vas-y', sub: 'Tu lui laisses ' + x + ' os', fn: () => Os.donner(g, r, x) }, { label: '🔢 Changer le nombre d\'os', fn: () => Os.combien(g, r) }, retour(g)] });
  };
  Os.donner = function (g, r, x) {
    const S = CG.S, p = S.player; if (sur() < x || !chaudron(g)) { CG.sfx('no'); return; } p.os -= x; S.res.os = (S.res.os || 0) + x; const e = etat(g);
    if (e.r !== r) { if (e.paye) { S.res.os += Al.cout(e.r); e.paye = false; } e.r = r; e.prog = 0; }
    CG.sfx('ok'); G.text(g.x, g.y - 52, '+' + x + ' 🦴', '#fff', true); G.say(g, CG.pick(['Merci chef ! Je m\'y mets tout de suite.', 'Ça va sentir bon dans cinq minutes !', 'Beaux os. Recule un peu, ça éclabousse.']), 3.5);
    UI.toast('🦴 ' + g.name + ' a reçu ' + x + ' os. Les potions iront à la réserve, caisse par caisse.');
  };
  // la discussion avec un alchimiste : porter des os, tout en haut
  const dl0 = UI.dialog; UI.dialog = function (o) {
    const g = o && o.goblin; if (g && g.job === 'alchimiste' && CG.S && Array.isArray(o.options) && o.options.some(q => q && /^🛠/.test(q.label || ''))) { const n = sur();
      o = Object.assign({}, o, { options: [{ label: '🦴 Lui porter des os' + (n ? ' (tu en as ' + n + ')' : ''), sub: n ? 'Tu choisis la potion, et combien d\'os tu lui laisses' : 'Tu n\'as pas d\'os sur toi. Les squelettes en laissent tomber.', disabled: !n, fn: () => Os.choisir(g) }].concat(o.options) }); }
    return dl0.call(this, o);
  };
  // le chaudron : on y dit toujours où en sont les os
  if (Al.SANS_OS) Al.SANS_OS = ['Salut, chef ! Je n\'ai plus d\'os pour les potions. Si tu en as dans ton sac, donne-m\'en !', 'Ah, chef ! Mon chaudron est vide : il me faut des os. Les squelettes en ont plein.', 'Chef, plus un seul os ! Sans os, pas de potion. Tu m\'en apportes ?', 'Bonjour chef. Je tourne ma louche dans le vide : plus d\'os. Tu en as sur toi ?'];
})(window.CG);
