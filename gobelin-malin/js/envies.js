// Goblin Malin — les envies du clan. De temps en temps, un gobelin vient demander une construction qui manque au village :
// « Hé chef, on pourrait avoir une balançoire ? ». Dire oui, c'est promettre de la bâtir avant la fin du lendemain
// (tenu : le moral monte ; oublié : il baisse). Si on ne sait pas encore la bâtir, ou s'il manque des ressources,
// le « oui » est grisé : il faut bien dire non, ou pas maintenant.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Soc = CG.Soc, pick = CG.pick, rand = CG.rand;
  const En = CG.Envies = { CHANCE: 0.55, DELAI: 1, TENU: 3, OUBLI: -3, HEURE: [8, 16] }; /* CHANCE : jours où quelqu'un demande ; DELAI : jours en plus d'aujourd'hui pour tenir parole */
  En.L = [
    { type: 'parasol', quoi: 'un parasol', le: 'le parasol', ask: ['Hé chef, tu crois qu\'on pourrait avoir un coin pour se reposer ?', 'Chef, un peu d\'ombre pour souffler, ce serait possible ?', 'Chef, le soleil tape fort. On pourrait avoir un parasol ?'] },
    { type: 'balancoire', quoi: 'des balançoires', le: 'les balançoires', ask: ['Hey chef, on pourrait avoir une balançoire ?', 'Chef ! Chef ! Une balançoire, s\'il te plaît ! Juste une !', 'Chef, on s\'ennuie après le travail. Des balançoires, tu en penses quoi ?'] },
    { type: 'puits', quoi: 'un puits', le: 'le puits', ask: ['Chef, on a soif à force de travailler. Un puits, ce serait possible ?', 'Chef, aller chercher l\'eau à la mare, c\'est loin. On creuse un puits ?'] },
    { type: 'taverne', quoi: 'une taverne', le: 'la taverne', ask: ['Chef, il nous faudrait un endroit pour fêter. Une taverne, peut-être ?', 'Chef, tous les grands clans ont une taverne. Pourquoi pas nous ?'] },
    { type: 'marmite', quoi: 'une grande marmite', le: 'la marmite', ask: ['Chef, la soupe serait meilleure dans une grande marmite. On peut en avoir une ?', 'Chef, on mange chacun dans son coin. Avec une marmite, on partagerait !'] },
    { type: 'mangeoire', quoi: 'une mangeoire', le: 'la mangeoire', si: S => S.pets.length > 0, ask: ['Chef, les animaux mangent dans nos bols. On pourrait leur faire une mangeoire ?', 'Chef, les bêtes du clan n\'ont nulle part où manger. Une mangeoire ?'] },
    { type: 'hut', quoi: 'une hutte de plus', le: 'la nouvelle hutte', toujours: true, si: S => S.goblins.length >= G.capacity(), ask: ['Chef, on dort les uns sur les autres. Une hutte de plus, ce serait possible ?', 'Chef, quelqu\'un m\'a ronflé dans l\'oreille toute la nuit. Il nous faut une autre hutte !'] }
  ];
  const OUI = ['Youpi ! Merci, chef !', 'C\'est vrai ? Je vais le dire à tout le monde !', 'Tu es le meilleur, chef !', 'Oh ! J\'ai hâte !'], PLUS_TARD = ['D\'accord, chef. Une autre fois, alors.', 'Je comprends. On attendra.', 'Bon... tant pis. Peut-être plus tard ?'], NON = ['Oh... d\'accord.', 'Pfff. On ne peut jamais rien avoir.', 'Les autres clans, eux, ils en ont...'], MERCI = ['Wouah ! {le} est là ! Merci, chef !', 'Tu as tenu parole, chef !', 'Regardez tous ! {le} !'];
  const promesses = () => { const S = CG.S; return S.envies || (S.envies = []); };
  const bati = (type, depuis) => CG.S.buildings.filter(b => b.type === type && !b.site).length > (depuis || 0);
  const manque = S => En.L.filter(e => CG.BUILDS[e.type] && (e.toujours || !S.buildings.some(b => b.type === e.type)) && (!e.si || e.si(S)) && !promesses().some(p => p.type === e.type));
  function rep(g, delta, l, mot) { const S = CG.S; S.morale = CG.clamp(S.morale + delta, 0, 100); if (delta) g.ami = CG.clamp((g.ami || 0) + (delta > 0 ? 1 : -1), -6, 6); G.say(g, pick(l), 4); if (delta) G.text(g.x, g.y - 50, delta > 0 ? '❤️' : '💢', '#fff', true); CG.sfx(delta < 0 ? 'no' : 'ok'); void mot; }
  function demander(g, e, dl) {
    const S = CG.S, d = CG.BUILDS[e.type], appris = G.buildUnlocked(e.type) || (e.toujours && G.tech(d.tech)) , paye = G.canPay(d.cout), peut = appris && paye;
    dl({ goblin: g, who: g.name, tag: '💭 une envie', text: pick(e.ask), options: [
      { label: '🔨 D\'accord, je vais bâtir ' + e.quoi + '.', sub: !appris ? 'Tu ne sais pas encore bâtir ça' : !paye ? 'Il te manque des ressources' : '', disabled: !peut, fn: () => { promesses().push({ type: e.type, le: e.le, day: S.day, qui: g.id, nom: g.name, avant: S.buildings.filter(b => b.type === e.type && !b.site).length }); rep(g, 1, OUI); UI.toast('📌 Promesse à ' + g.name + ' : bâtir ' + e.quoi + ' avant demain soir.'); } },
      { label: peut ? 'Pas maintenant. Plus tard, peut-être.' : 'J\'aimerais bien, mais on n\'a pas ce qu\'il faut.', fn: () => rep(g, peut ? -1 : 0, PLUS_TARD) },
      { label: 'Non. Vous avez déjà tout ce qu\'il vous faut.', fn: () => rep(g, -3, NON) },
      { label: Soc.PRESSE || 'Je n\'ai pas le temps.', echap: true, fn: () => rep(g, Soc.PRESSE_MORAL || -1, PLUS_TARD) }] });
  }
  const dl0 = UI.dialog; UI.dialog = function (o) {
    const g = o && o.goblin, d = g && g.envieDem; if (!d) return dl0.apply(this, arguments); g.envieDem = null;
    const e = En.L.find(x => x.type === d.type); if (!e || CG.R.t - d.t > 80 || !/question|besoin de toi/.test(o.tag || '') || !manque(CG.S).includes(e)) return dl0.apply(this, arguments);
    return demander(g, e, q => dl0.call(UI, q));
  };
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || (tic -= dt) > 0) return; tic = 1;
    // les promesses : tenues dès que c'est bâti, oubliées une fois le délai passé
    for (const p of promesses().slice()) { const l = promesses();
      if (bati(p.type, p.avant)) { l.splice(l.indexOf(p), 1); S.morale = Math.min(100, S.morale + En.TENU); const g = S.goblins.find(o => o.id === p.qui); if (g && !g.hidden) { G.say(g, pick(MERCI).replace('{le}', p.le.charAt(0).toUpperCase() + p.le.slice(1)), 4.5); G.text(g.x, g.y - 50, '❤️', '#fff', true); } UI.toast('🎉 Promesse tenue : ' + p.le + ' ' + (/^les /.test(p.le) ? 'sont là' : 'est là') + '. (moral +' + En.TENU + ')'); CG.sfx('ok'); }
      else if (S.day > p.day + En.DELAI) { l.splice(l.indexOf(p), 1); S.morale = Math.max(0, S.morale + En.OUBLI); (S.envieNotes || (S.envieNotes = [])).push('😞 Tu avais promis ' + p.le + ' à ' + p.nom + '... et rien n\'a été bâti. (moral ' + En.OUBLI + ')'); } }
    if (R.alarm || R.night || R.cine || R.ko > 0 || UI.modal || S.day < 2 || S.hour < 7 || S.hour > 18.3) return;
    const J = R.envieJ && R.envieJ.day === S.day ? R.envieJ : (R.envieJ = { day: S.day, h: Math.random() < En.CHANCE ? rand(En.HEURE[0], En.HEURE[1]) : 99, fait: false });
    if (J.fait || S.hour < J.h || promesses().length || !Soc.inVillage() || Soc.combat() || S.goblins.some(g => g.ask)) return;
    const l = manque(S); if (!l.length) { J.fait = true; return; }
    const cand = S.goblins.filter(g => g.met && !g.hidden && !g.exile && !g.carry && !g.log && !g.cine && !g.child && !g.bebe && g.state !== 'fight' && g.ko !== true && CG.dist(g, S.player) < 900); if (!cand.length) return;
    const g = pick(cand), e = pick(l); G.resetGoblin(g); g.ask = { t: 50 }; g.repath = 0; g.envieDem = { type: e.type, t: R.t }; J.fait = true; if (Soc.timer !== undefined) Soc.timer = Math.max(Soc.timer, 40);
  };
  const an0 = G.applyNames; G.applyNames = function (lines) { const S = CG.S; if (S && S.envieNotes && S.envieNotes.length && Array.isArray(lines)) { S.envieNotes.forEach(n => lines.push(n)); S.envieNotes = []; } return an0.apply(this, arguments); };
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); CG.S.goblins.forEach(g => { g.envieDem = null; }); return r; };
})(window.CG);
