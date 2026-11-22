// Goblin Malin — l'équipement des gobelins.
//   Le sac du chef et le coffre du camp (dans sa hutte) : voir inventaire.js. On y glisse armes et armures, sur soi ou sur un gobelin.
//   Trois qualités par objet (épée, arc, armure) : 1 = ce que fabriquent les artisans, 2 et 3 = mieux.
//   Les commandes aux artisans : le forgeron, le facteur d'arcs et le tanneur améliorent l'équipement du chef ou celui d'un gobelin.
//     On choisit, on paie, et ça prend du temps : l'artisan y travaille à son atelier, et ne fabrique rien d'autre pendant ce temps.
//   Un gobelin qui n'est pas garde mais qui porte une arme se défend avec quand un monstre approche. Si le combat tourne mal, il détale.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, pick = CG.pick, dist = CG.dist;
  const Bq = CG.Banque = { MAX: 3, PV: 15, EPEE: 4, ARC: 3, DUREE: 45, CHEF: [40, 10], CHEF_ARMURE: 7, VOIT: 260, PERDU_VIE: 0.45, PERDU_T: 6 };
  Bq.NOMS = { epee: ['', 'Épée', 'Épée fine', 'Lame de maître'], arc: ['', 'Arc', 'Arc long', 'Arc de maître'], armure: ['', 'Armure de cuir', 'Cotte de mailles', 'Armure d\'écailles'] };
  Bq.IC = { epee: '🗡️', arc: '🏹', armure: '🧥', chapeau: '🪶', baton: '🪄' }; Bq.NOMS.chapeau = ['', 'Coiffe de chef']; Bq.NOMS.baton = ['', 'Bâton magique', 'Bâton magique', 'Bâton magique'];
  Bq.effet = (k, n) => k === 'armure' ? '+' + (15 + Bq.PV * (n - 1)) + ' vie' : k === 'epee' ? '+' + (4 + Bq.EPEE * (n - 1)) + ' dégâts au corps à corps' : n > 1 ? 'tire de loin, +' + Bq.ARC * (n - 1) + ' dégâts' : 'tire de loin';
  const nom = (k, n) => Bq.NOMS[k][Math.min(Bq.MAX, n)], niv = (g, k) => (g.equip && +g.equip[k]) || 0;
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('banque')) CG.Mondes.GLOBAL.push('banque'); // le coffre suit le chef d'un monde à l'autre
  const coffre = () => CG.S.banque || (CG.S.banque = {});
  Bq.deposer = function (k, n, q) { const c = coffre(), key = k + n; c[key] = (c[key] || 0) + (q || 1); };
  Bq.total = () => { const c = coffre(); let t = 0; Object.keys(c).forEach(k => { t += c[k] || 0; }); return t; };

  // ---------- ce que valent les qualités 2 et 3 ----------
  const mh0 = G.gobMaxHp; G.gobMaxHp = function (g) { return mh0.apply(this, arguments) + Bq.PV * Math.max(0, niv(g, 'armure') - 1); };
  const gd0 = G.guardDmg; G.guardDmg = function (g) { return gd0.apply(this, arguments) + (g.equip && g.equip.arc && !g.melee ? Bq.ARC * Math.max(0, niv(g, 'arc') - 1) : Bq.EPEE * Math.max(0, niv(g, 'epee') - 1)); };
  const porte = g => Object.keys(g.equip || {}).filter(k => Bq.NOMS[k] && niv(g, k)).map(k => Bq.IC[k] + ' ' + nom(k, niv(g, k))).join(', ');

  // ---------- le coffre du camp, dans la hutte du chef (la fenêtre est dans inventaire.js) ----------
  let direct = false; const in0 = D.interact; D.interact = function () {
    if (direct) return in0.apply(this, arguments); const S = CG.S, R = CG.R, it = D.findInteract();
    if (!it || (it.type !== 'home' && it.type !== 'sleep') || !S.buildings.some(b => b.type === 'chief' && !b.site) || (R && (R.alarm || R.ko > 0))) return in0.apply(this, arguments);
    const n = Bq.total();
    UI.dialog({ who: 'Ta hutte', tag: '🏠 chef ' + S.name, text: 'Te voilà chez toi. Ton lit est au fond, et le coffre du camp est sous la fenêtre.', options: [
      { label: '🛏️ ' + it.label, fn: () => { direct = true; try { in0.call(D); } finally { direct = false; } } },
      { label: '🧰 Le coffre du camp', sub: (n ? n + ' objet' + (n > 1 ? 's' : '') + ' dans le coffre' : 'Le coffre est vide') + ' · range ton sac, équipe-toi ou équipe tes gobelins', fn: () => Bq.ouvrir() },
      { label: '👋 Ressortir' }] });
  };

  // ---------- un gobelin armé se défend, même s'il n'est pas garde ----------
  Bq.seDefend = function (g) {
    if (g.job === 'garde' || g.child || g.ko === true || g.hidden || g.perch || !g.equip || !(g.equip.epee || g.equip.arc)) return false;
    const S = CG.S, R = CG.R, now = R.t || 0; if (g._sdT !== undefined && Math.abs(now - g._sdT) < 0.25) return g._sd; g._sdT = now;
    if (g.fuitT > now) return (g._sd = false);
    let n = 0, a = 1; for (const e of R.enemies) if (!e.dead && !e.calm && !e.struct && !(e.charm > 0) && dist(e, g) < Bq.VOIT) n++;
    if (!n) return (g._sd = false);
    for (const o of S.goblins) if (o !== g && !o.hidden && o.ko !== true && (o.job === 'garde' || o.state === 'fight') && dist(o, g) < Bq.VOIT) a++;
    if (!(R.ko > 0) && dist(S.player, g) < Bq.VOIT) a++;
    if (g.hp < G.gobMaxHp(g) * Bq.PERDU_VIE || n > a + 1) { // le combat est perdu : il lâche tout et file se cacher, comme les autres
      g.fuitT = now + Bq.PERDU_T; if (g.state === 'fight') { g.state = 'idle'; g.path = null; g.melee = false; G.say(g, pick(['Trop pour moi ! Je file !', 'Aïe ! Je suis pas garde, moi !', 'Ils sont trop nombreux ! Sauve qui peut !']), 2.4); }
      return (g._sd = false);
    }
    return (g._sd = true);
  };
  const mi0 = G.militia; G.militia = function (g) { return mi0.apply(this, arguments) || Bq.seDefend(g); };

  // ---------- les commandes aux artisans ----------
  const METIER = { forgeron: ['epee', 'armure'], arcier: ['arc'], tanneur: ['armure'] }; // ce que chacun sait améliorer chez un gobelin
  Bq.cout = function (k, n) { return k === 'epee' ? { minerai: 6 * n, or: 15 * n } : k === 'arc' ? { bois: 8 * n, or: 12 * n } : { cuir: 6 * n, or: 12 * n }; }; // n : la qualité visée
  Bq.coutChef = function (quoi) { const p = CG.S.player; return quoi === 'arme' ? { minerai: 6 + 4 * p.weapon, or: 15 + 15 * p.weapon } : { cuir: 5 + 3 * p.armor, or: 12 + 12 * p.armor }; };
  const prix = c => Object.keys(c).map(r => c[r] + ' ' + CG.RES[r].icon).join(' '), sec = t => t >= 90 ? Math.round(t / 60) + ' min' : Math.ceil(t / 5) * 5 + ' s';
  const commandes = () => CG.S.commandes || (CG.S.commandes = []);
  Bq.commande = g => commandes().find(c => c.art === g.id) || null;
  const titre = c => { const S = CG.S; if (c.qui === 'chef') return c.quoi === 'arme' ? 'ton arme (+' + S.player.weapon + ' → +' + (S.player.weapon + 1) + ')' : 'ton armure (+' + S.player.armor + ' → +' + (S.player.armor + 1) + ')'; const o = S.goblins.find(q => q.id === c.qui); return nom(c.quoi, c.n).toLowerCase() + ' pour ' + (o ? o.name : '...'); };
  function lancer(g, c, cout) { if (!G.canPay(cout) || Bq.commande(g)) return false; G.pay(cout); c.art = g.id; c.max = c.t; commandes().push(c); CG.sfx('build'); G.say(g, pick(['Je m\'y mets, chef. Ça ne se fait pas en un coup de marteau !', 'Compris, chef. Repasse plus tard, ce sera prêt.', 'Du beau travail, ça prend du temps. J\'y vais !']), 3.5); return true; }
  function finir(g, c) {
    const S = CG.S, p = S.player;
    if (c.qui === 'chef') { if (c.quoi === 'arme') p.weapon++; else p.armor = Math.min(Bq.CHEF_ARMURE, p.armor + 1); UI.toast('⚒️ ' + g.name + ' a fini : ' + (c.quoi === 'arme' ? 'ton arme passe à +' + p.weapon + '.' : 'ton armure passe à +' + p.armor + '.')); }
    else { const o = S.goblins.find(q => q.id === c.qui); if (o && niv(o, c.quoi) === c.n - 1) { const old = niv(o, c.quoi); o.equip[c.quoi] = c.n; if (c.quoi === 'armure') o.hp = Math.min(G.gobMaxHp(o), o.hp + (old ? Bq.PV : 15)); G.text(o.x, o.y - 46, Bq.IC[c.quoi] + ' ' + nom(c.quoi, c.n), '#bfe8ff', true); UI.toast('⚒️ ' + g.name + ' a fini : ' + nom(c.quoi, c.n).toLowerCase() + ' pour ' + o.name + '.'); }
      else { const z = Bq.deposer(c.quoi, c.n); UI.toast('⚒️ ' + g.name + ' a fini ' + nom(c.quoi, c.n).toLowerCase() + ' : rangé ' + (CG.Inventaire ? CG.Inventaire.ou(z) : 'dans le coffre du camp') + '.'); } } // le gobelin n'est plus là, ou a changé d'équipement entre-temps
    G.say(g, pick(['Voilà, chef ! Du travail soigné.', 'C\'est prêt ! Regarde-moi cette merveille.', 'Fini ! J\'ai les bras en compote.']), 3.5); if (CG.onScreen(g.x, g.y)) CG.sfx('level');
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !S.commandes || !S.commandes.length || R.night || R.cine) return;
    for (let i = S.commandes.length - 1; i >= 0; i--) {
      const c = S.commandes[i], g = S.goblins.find(q => q.id === c.art);
      if (!g || !METIER[g.job]) { S.commandes.splice(i, 1); continue; } // l'artisan est parti ou a changé de métier : la commande est perdue
      if (g.state !== 'work' && g.state !== 'wait') continue; // il n'avance que quand il est à son atelier
      if (!c.vu) { c.vu = true; c.sansMat = g.state === 'wait'; } // s'il avait déjà payé une fabrication, il la finira après
      g.state = 'work'; g.pose = 'work'; g.timer = Math.max(g.timer || 0, 4); g.bubble = null; c.t -= dt * (G.workSpeed ? G.workSpeed(g) : 1);
      if (c.t <= 0) { S.commandes.splice(i, 1); if (c.sansMat) { g.state = 'wait'; g.timer = 0.8; g.pose = null; } finir(g, c); }
    }
  };
  // l'atelier : que faire des objets fabriqués, et les commandes
  const at0 = UI.atelier; UI.atelier = function (g) {
    const S = CG.S, job = CG.JOBS[g.job], k = job && job.craft; if (!k || !METIER[g.job]) return at0.apply(this, arguments);
    const c = CG.CRAFTS[k], p = S.player, n = S.goblins.filter(o => o.equip[k]).length, again = () => UI.atelier(g), enCours = Bq.commande(g), PL = { epee: 'épées', arc: 'arcs', armure: 'armures de cuir' };
    const opts = [
      { label: '🛡️ Équiper les gardes', sub: n + ' gobelin(s) équipé(s) · quand tous les gardes en ont, le surplus est vendu', active: S.policy[k] === 'equiper', fn: () => { S.policy[k] = 'equiper'; G.say(g, 'Compris, chef : pour les gardes d\'abord !', 3); again(); } },
      { label: '🪙 Tout vendre', sub: 'Chaque objet rapporte ' + c.prix + ' 🪙', active: S.policy[k] === 'vendre', fn: () => { S.policy[k] = 'vendre'; G.say(g, 'D\'accord, chef : tout part au marché !', 3); again(); } }];
    const chef = (quoi, lib) => { const cout = Bq.coutChef(quoi), lv = quoi === 'arme' ? p.weapon : p.armor, plein = quoi === 'armure' && p.armor >= Bq.CHEF_ARMURE, t = Bq.CHEF[0] + Bq.CHEF[1] * lv;
      opts.push({ label: lib + ' (+' + lv + ' → +' + (lv + 1) + ')', sub: plein ? 'Elle ne peut pas être plus solide' : enCours ? 'Une commande est déjà en cours' : (quoi === 'arme' ? '+3 dégâts' : '-8 % de dégâts reçus') + ' · ' + prix(cout) + ' · environ ' + sec(t) + ' de travail', disabled: plein || !!enCours || !G.canPay(cout), fn: () => { lancer(g, { qui: 'chef', quoi, t }, cout); again(); } }); };
    if (g.job === 'forgeron') { chef('arme', '🗡️ Améliorer mon arme'); chef('armure', '🛡️ Renforcer mon armure'); }
    if (g.job === 'tanneur') chef('armure', '🛡️ Renforcer mon armure');
    opts.push({ label: '⚒️ Améliorer l\'équipement d\'un gobelin', sub: enCours ? 'Une commande est déjà en cours' : METIER[g.job].map(q => Bq.IC[q] + ' ' + Bq.NOMS[q][1].toLowerCase()).join(', ') + ' · jusqu\'à la qualité ' + Bq.MAX, disabled: !!enCours, fn: () => Bq.pourQui(g) });
    opts.push({ label: '↩ Retour', fn: () => UI.talkGoblin(g) });
    UI.dialog({ goblin: g, who: g.name, tag: '⚒️ atelier · ' + c.icon + ' ' + c.nom + ' (' + c.effet + ')',
      text: enCours ? 'Je travaille sur ' + titre(enCours) + ', chef. Encore ' + sec(Math.max(5, enCours.t)) + ' de travail environ. Je ne fabrique rien d\'autre tant que ce n\'est pas fini.' : 'Qu\'est-ce que je fais de mes ' + PL[k] + ', chef ? Je peux aussi améliorer une arme ou une armure : ça coûte, et ça prend du temps.', options: opts });
  };
  Bq.pourQui = function (g) {
    const S = CG.S, ks = METIER[g.job], l = S.goblins.filter(o => !o.exile && o.met !== false).sort((a, b) => (b.job === 'garde') - (a.job === 'garde') || b.lvl - a.lvl), opts = [];
    l.forEach(o => ks.forEach(k => { const a = niv(o, k); if (a >= Bq.MAX) return; const n = a + 1, cout = Bq.cout(k, n), t = Bq.DUREE * n;
      opts.push({ label: CG.JOBS[o.job].icon + ' ' + o.name + ' : ' + Bq.IC[k] + ' ' + nom(k, n), sub: (a ? nom(k, a) + ' → ' : 'Neuf · ') + Bq.effet(k, n) + ' · ' + prix(cout) + ' · ' + sec(t), disabled: !G.canPay(cout), fn: () => { lancer(g, { qui: o.id, quoi: k, n, t }, cout); UI.atelier(g); } }); }));
    UI.dialog({ goblin: g, who: g.name, tag: '⚒️ une commande', text: 'Pour qui je travaille, chef ? Dis-moi qui, et quoi.', grid: true, options: opts.concat([{ label: '↩ Retour', fn: () => UI.atelier(g) }]) });
  };
})(window.CG);
