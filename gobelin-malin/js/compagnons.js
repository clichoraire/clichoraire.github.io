// Clan Gobelin — les compagnons (animaux, orcs, trolls...) ne se transforment plus en plein jour : quand ils sont prêts, ça couve,
// et c'est au réveil qu'on assiste à leur évolution, dans la même scène que celle du chef.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, P = CG.P;
  const stats = p => ({ hp: P.maxHp(p), atk: P.dmg(p) });
  function transformer(p) { // ce que faisait l'éclair en plein jour, sans le spectacle
    const av = stats(p); p.evo = 1; p._evo = 1; p.evoDemain = false; p.evoT = 0; p.hp = P.maxHp(p); p.cdS = 1; return { avant: av, apres: stats(p) };
  }
  const nd0 = D.nextDay; D.nextDay = function () {
    const r = nd0.apply(this, arguments), S = CG.S, R = CG.R, file = S.pets.filter(p => p.evoDemain && !p.evo).map(p => ({ p, st: transformer(p) }));
    S.pets.forEach(p => { if (p.evo) p.evoDemain = false; });
    if (!file.length || !(CG.Accueil && CG.Accueil.evolvePet)) return r;
    const jeu = S, suite = () => { // l'une après l'autre, après la scène du chef s'il évolue lui aussi
      if (CG.S !== jeu || !file.length) return;
      if (UI.modal || CG.R.night) return void setTimeout(suite, 300);
      const k = file.shift(); CG.R.evoStats = k.st; CG.Accueil.evolvePet(k.p, () => setTimeout(suite, 250));
    };
    setTimeout(suite, 400); try { CG.save(); } catch (e) { }
    return r;
  };
  // le petit signe, en attendant : des étincelles dorées de temps en temps autour de celui qui va changer
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; tic -= dt; if (tic > 0) return; tic = 0.35;
    for (const p of S.pets) if (p.evoDemain && !p.ko && !p.ridden && CG.onScreen(p.x, p.y)) R.parts.push({ x: p.x + CG.rand(-14, 14), y: p.y - 8 - CG.rand(0, 26), vx: CG.rand(-8, 8), vy: CG.rand(-30, -12), life: 0.8, max: 0.8, col: Math.random() < 0.5 ? '#ffe36b' : '#ffffff', size: 2.5, float: true });
  };
})(window.CG);
