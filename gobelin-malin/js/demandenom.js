// Goblin Malin — quand un gobelin ou un compagnon a le niveau qu'il faut, il vient trouver le chef pour lui demander un nom
// officiel. Le chef dit oui (la page du nom s'ouvre) ou remet ça à plus tard : il reviendra le lendemain. Rien ne dit à quoi
// sert ce nom. Le choix « Le renommer officiellement » reste aussi dans sa discussion. Tout est réglable dans CG.DemandeNom.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, P = CG.P, pick = CG.pick, Dn = CG.DemandeNom = { LOIN: 620, PRES: 50, PATIENCE: 30, PAUSE: 25, MATIN: 7, SOIR: 18.5 };
  const Of = () => CG.Officiel, Co = () => CG.Compagnons, fem = g => g.sex === 'f';
  let pause = 8, tic = 0;
  const calme = () => { const S = CG.S, R = CG.R; return !R.alarm && !R.night && !R.cine && !R.seisme && !(R.ko > 0) && !R.death && !R.build && S.hour >= Dn.MATIN && S.hour < Dn.SOIR && CG.Soc.inVillage() && !(CG.Soc.combat && CG.Soc.combat()); };
  const libre = o => o.nomPlusTard !== CG.S.day && CG.dist(o, CG.S.player) < Dn.LOIN;
  const enCours = () => CG.S.goblins.some(g => g.demNom) || CG.S.pets.some(p => p.demNom);
  function demanderGob(g) {
    const il = fem(g) ? 'elle' : 'il';
    UI.dialog({ goblin: g, who: g.name, tag: '🏷️ une demande', text: pick(['Chef... j\'ai quelque chose à te demander. Tu voudrais me donner un nom officiel ?', 'Chef ! J\'y pense depuis des jours. Je voudrais un nom officiel. Un vrai. Tu veux bien ?', 'Chef, c\'est le moment, je le sens. Tu me donnes mon nom officiel ?']),
      options: [{ label: '🏷️ D\'accord, ' + g.name, fn: () => { if (Of().pret(g)) Of().demander(g); } }, { label: '⏳ Plus tard', fn: () => { g.nomPlusTard = CG.S.day; G.say(g, pick(['D\'accord, chef. Je reviendrai.', 'Bon... demain, alors ?', 'Je comprends. Plus tard.']), 3); void il; } }] });
    if (UI.modal) UI.modal.closable = false;
  }
  function demanderPet(p) {
    UI.dialog({ visitor: { role: 'animal', look: 'animal', kind: p.kind, evo: p.evo }, who: p.name, tag: '🏷️ une demande', text: p.name + pick([' s\'assoit devant toi et te fixe sans bouger. On dirait qu\'il attend que tu lui donnes un nom officiel.', ' te barre le chemin et te regarde droit dans les yeux. Il veut quelque chose : un nom officiel, on dirait.', ' pose la tête contre ta main et ne te lâche plus du regard. Il attend un nom officiel.']),
      options: [{ label: '🏷️ D\'accord', fn: () => { if (Co().pret(p)) Co().demander(p); } }, { label: '⏳ Plus tard', fn: () => { p.nomPlusTard = CG.S.day; G.text(p.x, p.y - 44, '...', '#fff', true); } }] });
    if (UI.modal) UI.modal.closable = false;
  }
  const lacher = o => { if (o.demNom && !o.pet) { o.cine = false; G.resetGoblin(o); } o.demNom = null; };
  // le gobelin en route vers le chef (même passage que les autres petites scènes : game.js → G.cineStep)
  const cs0 = G.cineStep; G.cineStep = function (g, dt) {
    const d = g.demNom; if (!d) return cs0.apply(this, arguments);
    const p = CG.S.player, dist = CG.dist(g, p); d.t -= dt; g.pose = null; if (g.hidden) g.hidden = false;
    if (d.t <= 0 || !calme() || !Of().pret(g)) { lacher(g); pause = Dn.PAUSE; return; }
    if (dist < Dn.PRES) { g.moving = false; g.face = p.x > g.x ? 1 : -1; if (!UI.modal) { lacher(g); pause = Dn.PAUSE; demanderGob(g); } return; }
    if ((d.r -= dt) <= 0 || !g.path || !g.path.length) { d.r = 0.7; if (!G.goTo(g, p.x + (g.x > p.x ? 30 : -30), p.y + 6)) { lacher(g); g.nomPlusTard = CG.S.day; pause = 6; return; } }
    G.follow(g, 120, dt);
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !Of() || !Co()) return;
    if (R.alarm || R.night) { S.goblins.concat(S.pets).forEach(o => { if (o.demNom) lacher(o); }); return; }
    // le compagnon en route : il trotte jusqu'au chef (sa « promenade » vise le chef), puis il demande
    for (const a of S.pets) { const d = a.demNom; if (!d) continue; const p = S.player; d.t -= dt;
      if (d.t <= 0 || !calme() || !Co().pret(a)) { lacher(a); pause = Dn.PAUSE; continue; }
      if (CG.dist(a, p) < Dn.PRES + 24) { if (!UI.modal) { lacher(a); pause = Dn.PAUSE; demanderPet(a); } continue; }
      a.wx = p.x + (a.x > p.x ? 34 : -34); a.wy = p.y + 10; a.timer = 2; a.eat = null; a.soin = null; }
    if ((tic -= dt) > 0) return; tic = 1; if (pause > 0) { pause -= 1; return; }
    if (UI.modal || !calme() || enCours()) return;
    const g = S.goblins.find(o => Of().pret(o) && !o.hidden && !o.exile && !o.cine && !o.ask && !o.aide && !o.migre && !o.demenage && o.ko !== true && libre(o));
    if (g) { G.resetGoblin(g); g.cine = true; g.state = 'cine'; g.demNom = { t: Dn.PATIENCE, r: 0 }; g.bubble = '🏷️'; return; }
    const a = S.pets.find(o => Co().pret(o) && !o.ridden && libre(o));
    if (a) a.demNom = { t: Dn.PATIENCE };
  };
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); pause = 8; CG.S.goblins.concat(CG.S.pets).forEach(o => { o.demNom = null; }); return r; };
})(window.CG);
