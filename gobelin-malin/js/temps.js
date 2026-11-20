// Clan Gobelin — deux sorts sur le temps : le ralentir (la journée dure deux fois plus longtemps) ou le presser (1,5 fois plus vite).
// Seule l'horloge change : toi, ton clan et les monstres bougez à la même vitesse.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Tp = CG.Temps = { LENT: { dur: 150, k: 2 }, VITE: { dur: 150, k: 1 / 1.5 } }, BASE = D.HOUR;
  CG.SPELLS.temps = { nom: 'Ralentir le temps', icon: '⏳', mp: 36, prix: 1800, desc: 'Pendant 2 minutes et demie, le soleil traîne dans le ciel : les heures passent deux fois moins vite. De quoi explorer plus loin, ou bâtir encore un peu avant la nuit. Rien d\'autre ne ralentit.', color: '#e8c86a' };
  CG.SPELLS.hatetemps = { nom: 'Presser le temps', icon: '⌛', mp: 22, prix: 1100, desc: 'Pendant 2 minutes et demie, le soleil file : les heures passent une fois et demie plus vite. Pour arriver plus tôt au soir, ou au matin d\'après. Rien d\'autre n\'accélère.', color: '#8ad0ff' };
  CG.SCROLL_POOL.push('temps', 'hatetemps');
  if (CG.Effets) Object.assign(CG.Effets.FICHE, { temps: ['⏳', null, 'Heures 2 fois plus lentes, 2 min 30'], hatetemps: ['⌛', null, 'Heures 1,5 fois plus rapides, 2 min 30'] });
  Tp.actif = () => { const R = CG.R; return R && R.temps && R.temps.t > 0 ? R.temps : null; };
  const cast0 = G.cast; G.cast = function (id) {
    if (id !== 'temps' && id !== 'hatetemps') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    const lent = id === 'temps', c = lent ? Tp.LENT : Tp.VITE, col = CG.SPELLS[id].color;
    p.mp -= cost; R.castCd = 0.6; R.castAnim = 1; CG.sfx('spell'); R.temps = { id, t: c.dur, k: c.k }; // l'un remplace l'autre
    for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 70 + i * 60, life: 0.5 + i * 0.18, col });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; R.parts.push({ x: p.x + Math.cos(a) * 34, y: p.y - 26 + Math.sin(a) * 34, vx: -Math.sin(a) * (lent ? 30 : 110), vy: Math.cos(a) * (lent ? 30 : 110), life: 0.9, max: 0.9, col, size: 3.5, float: true }); }
    G.text(p.x, p.y - 70, lent ? '⏳ Le temps ralentit...' : '⌛ Le temps file !', col, true);
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, a = R && R.temps;
    if (a && a.t > 0) { a.t -= dt; if (a.t <= 0 || R.night) { R.temps = null; if (!R.night && CG.S) G.text(CG.S.player.x, CG.S.player.y - 64, 'Le temps reprend son cours', '#ffe9a8'); } }
    D.HOUR = BASE * (R && R.temps && R.temps.t > 0 ? R.temps.k : 1);
  };
  // l'horloge du haut change de couleur pendant le sort
  const css = document.createElement('style'); css.textContent = 'body.t-lent #clock{color:#ffe08a;text-shadow:0 0 8px rgba(255,200,80,.7)}body.t-vite #clock{color:#bfe4ff;text-shadow:0 0 8px rgba(120,200,255,.8)}'; document.head.appendChild(css);
  const rf0 = CG.UI.refresh; CG.UI.refresh = function () { rf0.apply(this, arguments); const a = Tp.actif(), b = document.body.classList; b.toggle('t-lent', !!a && a.id === 'temps'); b.toggle('t-vite', !!a && a.id === 'hatetemps'); };
})(window.CG);
