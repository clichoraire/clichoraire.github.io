// Goblin Malin — ce qui se range dans « Discuter » avec un gobelin, et le parasol :
//   un bricoleur : « Lui demander d'améliorer des murs » (c'était dans le menu principal) ;
//   les mots doux : une simple phrase gentille parmi les autres, sans cœur ni indice. La choisir, c'est flirter ;
//   fonder une famille : plus de bouton « Lui faire la cour ». Le soir près du feu, quand on s'aime assez, une phrase le propose ;
//   un gobelin assis sous un parasol : on peut le faire dégager (le moral baisse un peu, et il râle).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Soc = CG.Soc, pick = CG.pick, Di = CG.Discuter = { DEGAGE_MORAL: -1, BOUDE: 120 };
  Di.DOUX = ['Tu as de beaux yeux, tu sais.', 'J\'aime bien quand tu es près de moi.', 'Ton sourire éclaire tout le village.', 'Je pensais justement à toi.', 'Tu sens bon la mousse fraîche, aujourd\'hui.', 'Reste encore un peu. J\'aime ta compagnie.', 'Le village est plus beau quand tu es là.', 'Tu as une jolie voix, le sais-tu ?'];
  Di.FAMILLE = ['J\'aimerais fonder une famille avec toi.', 'Et si on avait des petits, toi et moi ?', 'Ma hutte est grande. Il y aurait de la place pour une famille.'];
  Di.DEGAGE = ['Pff...', 'Whoa, t\'es sérieux ?!', 'Je venais d\'arriver...', 'Mais j\'étais bien, là !', 'D\'accord, d\'accord... je me lève.', 'Même pas cinq minutes de repos, hein ?', 'C\'est TON parasol, peut-être ?', 'Hé ! J\'ai mal partout, moi !', 'Bon. Je vais m\'asseoir sur un caillou, alors.', 'Tu parles d\'un chef...', 'Grmbl. L\'ombre, c\'est pour tout le monde, non ?', 'Aïe, mes pieds... Bon, j\'y vais.', 'Et dire que je commençais à rêver.'];
  Di.ORDRE = ['Allez, debout. Dégage de là.', 'Lève-toi, j\'ai besoin de la place.', 'Fini la sieste. Ouste !'];
  window.addEventListener('load', () => {
    if (!Soc || !Soc.chat) return; let premier = null;
    const ch0 = Soc.chat; Soc.chat = function (g, topic) { premier = topic ? null : g; try { return ch0.apply(this, arguments); } finally { premier = null; } };
    const dl0 = UI.dialog; UI.dialog = function (o) {
      const g = premier, R = CG.R;
      if (g && o && o.goblin === g && Array.isArray(o.options)) { premier = null; const plus = [];
        if (CG.Bricoleur && g.job === 'aucun' && !g.child) plus.push({ label: '🧱 Lui demander d\'améliorer des murs', fn: () => CG.Bricoleur.demander(g) });
        if (CG.Amour && CG.Amour.cible(g) && !R.alarm) plus.push({ label: pick(Di.DOUX), fn: () => CG.Amour.flirt(g) }); /* rien ne dit que c'est du flirt */
        if (Soc.famillePrete && Soc.famillePrete(g)) plus.push({ label: pick(Di.FAMILLE), fn: () => Soc.famille(g) }); /* le soir près du feu, quand on s'aime assez */
        if (plus.length) { const opts = o.options.slice(), doux = plus.filter(x => !/^🧱/.test(x.label)), murs = plus.filter(x => /^🧱/.test(x.label));
          doux.forEach(x => opts.splice(Math.floor(Math.random() * (opts.length + 1)), 0, x)); /* la phrase douce se mêle aux autres réponses */
          o = Object.assign({}, o, { options: opts.concat(murs) }); } }
      // sous un parasol : le faire dégager (dans son menu, juste avant « au revoir »)
      const q = o && o.goblin; if (q && q.ombre && q.ombre.la && Array.isArray(o.options) && o.options.some(x => x && /^🛠/.test(x.label || ''))) {
        const opts = o.options.slice(), i = opts.findIndex(x => x && /^👋/.test(x.label || ''));
        opts.splice(i < 0 ? opts.length : i, 0, { label: '⛱️ ' + pick(Di.ORDRE), fn: () => Di.degager(q) }); o = Object.assign({}, o, { options: opts }); }
      return dl0.call(this, o);
    };
  });
  Di.degager = function (g) {
    const S = CG.S, R = CG.R; if (!g.ombre) return; g.ombre = null; g.bubble = null; g.ombreNon = R.t + Di.BOUDE; G.resetGoblin(g);
    S.morale = CG.clamp(S.morale + Di.DEGAGE_MORAL, 0, 100); g.ami = CG.clamp((g.ami || 0) - 1, -6, 6); G.say(g, pick(Di.DEGAGE), 4); G.text(g.x, g.y - 50, '💢', '#fff', true); CG.sfx('no');
  };
  // il ne revient pas s'asseoir tout de suite après s'être fait chasser
  if (CG.Repli && CG.Repli.step) { const st = CG.Repli.step; CG.Repli.step = function (g) { const avant = g.ombre, r = st.apply(this, arguments); if (!avant && g.ombre && g.ombreNon > CG.R.t) { g.ombre = null; G.resetGoblin(g); return false; } return r; }; }
})(window.CG);
