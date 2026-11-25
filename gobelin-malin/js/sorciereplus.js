// Goblin Malin — deux grands services de Dame Ortie, la jeteuse de sorts.
//   1) Elle ramène à la vie un gobelin tombé au combat, contre de l'or. De plus en plus cher : REZ donne les premiers prix,
//      puis REZ_PLUS de plus à chaque fois.
//   2) Rarement (COEUR de chance à chaque visite), elle a dans son panier un Cœur de diamant. Si le chef tombe, le cœur se brise
//      à sa place : il se relève avec la moitié de sa vie (COEUR_VIE). Chaque cœur acheté fait monter le prix du suivant.
// Tout est réglable dans CG.SorcierePlus.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, So = CG.Sorciere; if (!So || !UI) return;
  const Sp = CG.SorcierePlus = { REZ: [500, 1000, 2000, 2500, 5000, 6000, 7000], REZ_PLUS: 1000, COEUR: 0.2, COEUR_PRIX: 5000, COEUR_VIE: 0.5, INVULN: 3 };
  Sp.prixRez = () => { const n = (CG.S && CG.S.rezSorciere) || 0, L = Sp.REZ; return n < L.length ? L[n] : L[L.length - 1] + (n - L.length + 1) * Sp.REZ_PLUS; };
  Sp.prixCoeur = () => Sp.COEUR_PRIX * (((CG.S && CG.S.coeursAchetes) || 0) + 1);
  Sp.coeurs = () => (CG.S && CG.S.coeursDiamant) || 0;

  // ---------- 1. ramener un gobelin ----------
  Sp.choisir = function (v) {
    const S = CG.S, Rz = CG.Sorts2, prix = Sp.prixRez(), or = Math.floor(S.res.or), plein = S.goblins.length >= G.capacity(), morts = (S.morts || []).slice().reverse();
    UI.dialog({ visitor: v, who: So.NOM, tag: '🕊️ ' + prix + ' 🪙 pour le ramener',
      text: 'Hi hi... La mort, mon joli, c\'est une porte mal fermée. Dis-moi qui tu veux revoir. Ce sera ' + prix + ' 🪙 cette fois-ci. La prochaine fois, ce sera plus cher : ils prennent goût au voyage.',
      options: morts.slice(0, 8).map(c => { const J = CG.JOBS[c.job] || CG.JOBS.aucun; return { label: '🕊️ ' + c.name + ' (' + J.icon + ' niv. ' + (c.lvl || 1) + ')', sub: plein ? 'Plus de place au village : bâtis une hutte d\'abord' : or < prix ? 'Tu n\'as que ' + or + ' 🪙' : 'Revient près de toi, comme avant', disabled: plein || or < prix,
        fn: () => { if (S.res.or < prix || !S.morts.includes(c) || !Rz || !Rz.relever) return; S.res.or -= prix; S.rezSorciere = (S.rezSorciere || 0) + 1; CG.sfx('coin'); const g = Rz.relever(c); if (g && Rz.lumiere) Rz.lumiere(g.x, g.y, g.name);
          G.say(v, CG.pick(['Reviens par ici, toi ! On n\'a pas fini !', 'Poil de troll, souffle de crapaud... debout !', 'Et voilà. Tout neuf. Enfin, presque.']), 4); if (g && G.say) G.say(g, CG.pick(['Hein ? Ça sent la soupe aux orties...', 'Chef ! Tu as payé pour moi ?!', 'J\'ai vu une vieille dame me tirer par l\'oreille.']), 4, 1.4); } }; })
        .concat([{ label: 'Pas maintenant', echap: true, fn: () => So.parler(v) }]) });
  };
  let enParle = null;
  const pa0 = So.parler; So.parler = function (v) { enParle = v; try { return pa0.apply(this, arguments); } finally { enParle = null; } };
  const dg0 = UI.dialog; UI.dialog = function (d) {
    try { const S = CG.S, v = enParle; if (v && d && d.visitor === v && Array.isArray(d.options) && S && (S.morts || []).length && CG.Sorts2 && CG.Sorts2.relever) { enParle = null;
        const prix = Sp.prixRez(), n = S.morts.length, opt = { label: '🕊️ Ramène un de mes gobelins (' + prix + ' 🪙)', sub: n + ' gobelin' + (n > 1 ? 's' : '') + ' tombé' + (n > 1 ? 's' : '') + ' au combat', fn: () => Sp.choisir(v) };
        d.options = d.options.slice(); d.options.splice(Math.min(1, d.options.length), 0, opt); } } catch (e) { /* jamais bloquant */ }
    return dg0.apply(this, arguments);
  };

  // ---------- 2. le Cœur de diamant ----------
  if (!document.getElementById('cd-css')) { const st = document.createElement('style'); st.id = 'cd-css'; st.textContent =
    '@keyframes cd-brille{0%,100%{filter:drop-shadow(0 0 3px #9fe8ff) drop-shadow(0 0 8px #6ab8ff)}50%{filter:drop-shadow(0 0 7px #fff) drop-shadow(0 0 18px #ff9af0)}}@keyframes cd-eclat{0%,100%{opacity:.15;transform:scale(.5) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(45deg)}}' +
    'svg.cd-coeur{width:38px;height:38px;overflow:visible;animation:cd-brille 1.6s ease-in-out infinite}svg.cd-coeur .e{transform-box:fill-box;transform-origin:center;animation:cd-eclat 1.1s ease-in-out infinite}svg.cd-coeur .e2{animation-delay:.4s}svg.cd-coeur .e3{animation-delay:.75s}'; document.head.appendChild(st); }
  const etoile = (x, y, r, c) => '<path class="e ' + c + '" d="M' + x + ' ' + (y - r) + 'L' + (x + r * 0.22) + ' ' + (y - r * 0.22) + 'L' + (x + r) + ' ' + y + 'L' + (x + r * 0.22) + ' ' + (y + r * 0.22) + 'L' + x + ' ' + (y + r) + 'L' + (x - r * 0.22) + ' ' + (y + r * 0.22) + 'L' + (x - r) + ' ' + y + 'L' + (x - r * 0.22) + ' ' + (y - r * 0.22) + 'Z" fill="#fff"/>';
  Sp.svg = () => '<svg class="cd-coeur" viewBox="0 0 40 40"><defs><linearGradient id="cd-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fdff"/><stop offset=".35" stop-color="#8fe6ff"/><stop offset=".7" stop-color="#b79cff"/><stop offset="1" stop-color="#ff9ae6"/></linearGradient></defs>'
    + '<path d="M20 36L4 19Q0 9 9 6Q16 4 20 12Q24 4 31 6Q40 9 36 19Z" fill="url(#cd-g)" stroke="#fff" stroke-width="1"/>'
    + '<path d="M20 12L11 17L20 36ZM20 12L29 17L20 36Z" fill="rgba(255,255,255,.28)"/><path d="M4 19L11 17L9 6ZM36 19L29 17L31 6Z" fill="rgba(60,90,200,.22)"/><path d="M9 6L11 17L20 12ZM31 6L29 17L20 12Z" fill="rgba(255,255,255,.5)"/>'
    + etoile(9, 8, 5, 'e1') + etoile(32, 13, 4, 'e2') + etoile(22, 29, 3.5, 'e3') + '</svg>';
  Sp.article = function () { const prix = Sp.prixCoeur(); return { icon: Sp.svg(), label: 'Cœur de diamant', desc: 'Si tu tombes au combat, il se brise à ta place : tu te relèves avec la moitié de ta vie.' + (Sp.coeurs() ? ' Tu en as déjà ' + Sp.coeurs() + '.' : ''), prix, stock: 1, coeurD: true,
    buy: () => { const S = CG.S; S.coeursDiamant = (S.coeursDiamant || 0) + 1; S.coeursAchetes = (S.coeursAchetes || 0) + 1; CG.sfx('level'); UI.toast('💎 Le Cœur de diamant bat contre ta poitrine. Si tu tombes, il te relèvera.'); } }; };
  if (So.panier) { const pn0 = So.panier; So.panier = function () { const l = pn0.apply(this, arguments) || []; try { if (Math.random() < Sp.COEUR) l.unshift(Sp.article()); } catch (e) { /* jamais bloquant */ } return l; }; }
  // le chef tombe : le cœur se brise à sa place (pas pendant un duel entre chefs, où personne ne meurt)
  const die0 = G.die; G.die = function () {
    const S = CG.S, R = CG.R, p = S && S.player; if (!p || !R || R.death || R.duel || !(Sp.coeurs() > 0)) return die0.apply(this, arguments);
    S.coeursDiamant--; p.hp = Math.max(1, Math.round(p.maxhp * Sp.COEUR_VIE)); R.invuln = Math.max(R.invuln || 0, Sp.INVULN); R.ko = 0;
    for (let i = 0; i < 4; i++) R.rings.push({ x: p.x, y: p.y - 14, r: 50 + i * 55, life: 0.5 + i * 0.18, col: i % 2 ? '#ff9ae6' : '#9fe8ff' });
    G.puff(p.x, p.y - 20, '#ffffff', 34, 240, 5); G.puff(p.x, p.y - 20, '#9fe8ff', 26, 190, 4); G.puff(p.x, p.y - 20, '#ff9ae6', 18, 150, 4); CG.sfx('level');
    G.banner('💎 Le Cœur de diamant se brise !', 'Tu te relèves avec la moitié de ta vie.' + (Sp.coeurs() ? ' Il t\'en reste ' + Sp.coeurs() + '.' : ' C\'était ton dernier.'), '#bfeaff');
  };
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.push({ k: 'coeurDiamant', ic: '💎', nom: () => 'Cœur de diamant' + (Sp.coeurs() > 1 ? ' ×' + Sp.coeurs() : ''), txt: () => 'Si tu tombes au combat, il se brise à ta place et tu te relèves avec la moitié de ta vie.', t: () => (Sp.coeurs() > 0 ? true : 0), fin: () => 'jusqu\'à ce qu\'il serve' });
})(window.CG);
