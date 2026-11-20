// Clan Gobelin — les marchands errants repartent une fois qu'on leur a acheté quelque chose ; un troll ou un ettin du clan
// ne peut pas s'empêcher de se moquer d'eux ; et le cri de guerre galvanise aussi les animaux, les monstres alliés et le golem.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, pick = CG.pick, rand = CG.rand, Ma = CG.Marchands = { MOQUEURS: ['troll', 'ettin'], CIBLES: { sorciere: 'humaine', nain: 'nain', elfe: 'elfe' }, CRI: 1.5 };

  // ---------- après un achat, le marchand plie bagage ----------
  let cur = null; const total = v => (v.shop || []).reduce((n, it) => n + (it.stock || 0), 0);
  const sh0 = UI.shop; UI.shop = function (v) { cur = { v, n: total(v) }; return sh0.apply(this, arguments); };
  const cl0 = UI.close; UI.close = function () {
    const c = cur, etait = UI.modal; const r = cl0.apply(this, arguments);
    if (c && etait) { cur = null; const R = CG.R, v = c.v; if (total(v) < c.n && R && R.visitors.includes(v) && v.state !== 'leave' && v.exit) {
      v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); G.say(v, pick(['Affaire conclue ! Je reprends la route.', 'Merci, chef. Au plaisir !', 'Bonne journée ! D\'autres clients m\'attendent.', 'Marché conclu. À la prochaine !']), 3.5); } }
    return r;
  };

  // ---------- les moqueries du troll ----------
  // {r} : « humaine », « nain » ou « elfe » ; {R} : pareil, avec la majuscule
  const BLAGUES = [
    'Hé, {r} ! Toi vendre des potions ? Toi devrais en boire une pour ta figure.',
    'Moi déjà mangé un marchand. Goût de vieille botte. Toi sentir pareil.',
    '{R} tout petit. Moi me moucher, toi partir avec le vent.',
    'Ton sac plus gros que ta tête. Dans les deux, y a rien de bon.',
    'Toi demander de l\'or pour ça ? Moi trouver mieux sous mes ongles de pied.',
    'Hé, {r} ! Ta maman savoir que toi traîner chez les gobelins ?',
    'Moi compter jusqu\'à trois. Toi courir. Un... euh... beaucoup !',
    'Toi sentir la savonnette. Pouah ! Ça piquer le nez.',
    '{R} avoir deux bras tout mous. Comme nouilles. Moi avoir faim maintenant.',
    'Si moi m\'asseoir sur ta charrette, toi vendre des galettes.',
    'Toi parler beaucoup. Moi avoir une massue. Massue gagner toujours.',
    'Ha ! {R} avoir peur ? Regarde, ses genoux faire de la musique !'
  ];
  const BLAGUES_2 = ['Tais-toi, tête de gauche !', 'Non, toi tais-toi, tête de droite !', 'Nous deux d\'accord : {r} très moche.']; // l'ettin se chicane entre ses deux têtes
  const REPLIQUES = ['Je... je suis ici pour le commerce, moi !', 'Chef ! Tu pourrais tenir ta grosse bête en laisse ?', 'Très drôle. Vraiment. Ha. Ha.', 'On ne m\'avait pas prévenu pour... ça.', 'Je double mes prix si ça continue ! ... Non, je plaisante. Ne me mange pas.', 'Recule ! Tu baves sur ma marchandise !', 'J\'ai connu des dragons plus polis.', '... (range discrètement ses plus beaux articles)'];
  const RIRES = [['Ha ha ha ha !', 1], ['Hi hi ! Il est méchant, notre troll !', 1], ['Pauvre marchand...', 0], ['😂', 1], ['Encore une, encore une !', 1]];
  let mt = 8;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return;
    if (R.cri > 0) for (const p of S.pets) if (!p.ko && !p.ridden && p.atkCd > 0) p.atkCd -= dt * 0.5; // sous le cri, les alliés frappent aussi plus vite
    if (R.alarm || R.night || R.ko > 0) return; mt -= dt; if (mt > 0) return; mt = rand(7, 12);
    const v = R.visitors.find(o => Ma.CIBLES[o.look] && o.state !== 'leave' && o.state !== 'arrive'); if (!v) return;
    const brutes = S.pets.filter(p => Ma.MOQUEURS.includes(p.kind) && !p.ko && !p.ridden && !p.sleep && !p.repli); if (!brutes.length) return;
    const p = pick(brutes), d = Math.hypot(p.x - v.x, p.y - v.y);
    p.wx = v.x + (p.x > v.x ? 46 : -46); p.wy = v.y + 14; p.timer = 14; p.path = null; // il vient se planter à côté du marchand
    if (d > 420) return; const race = Ma.CIBLES[v.look], Race = race.charAt(0).toUpperCase() + race.slice(1), f = s => s.replace(/\{r\}/g, race).replace(/\{R\}/g, Race);
    R.blaguesVues = R.blaguesVues || []; let libres = BLAGUES.filter(b => !R.blaguesVues.includes(b)); if (!libres.length) { R.blaguesVues = []; libres = BLAGUES; } const b = pick(libres); R.blaguesVues.push(b);
    p.face = v.x > p.x ? 1 : -1; G.say(p, f(b), 4.6);
    if (p.kind === 'ettin' && Math.random() < 0.5) G.say(p, f(pick(BLAGUES_2)), 3, 4.8);
    if (Math.random() < 0.75) { G.say(v, pick(REPLIQUES), 3.8, 2.6); setTimeout(() => { if (CG.R === R && R.visitors.includes(v)) G.text(v.x, v.y - 60, '💢', '#fff', true); }, 2600); }
    CG.shuffle(S.goblins.filter(g => !g.hidden && g.met && Math.hypot(g.x - p.x, g.y - p.y) < 260)).slice(0, 2).forEach((g, i) => { const w = pick(RIRES); G.say(g, w[0], 2.4, 1.6 + i * 0.6); if (R.speech.length) R.speech[R.speech.length - 1].laugh = !!w[1]; });
  };

  // ---------- le cri de guerre vaut pour tous ceux qui se battent à tes côtés ----------
  const pd0 = CG.P.dmg; CG.P.dmg = function (p) { return pd0.apply(this, arguments) * (CG.R && CG.R.cri > 0 ? Ma.CRI : 1); };
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg, who) { const R = CG.R; if (R && R.cri > 0 && who && who === R.golem) dmg *= Ma.CRI; return he0.call(this, e, dmg, who); };
  const cast0 = G.cast; G.cast = function (id) {
    const R = CG.R, avant = R ? R.cri : 0, r = cast0.apply(this, arguments);
    if (id === 'cri' && R && R.cri > avant) { const S = CG.S; S.pets.concat(R.golem && !R.golem.dead ? [R.golem] : []).forEach(a => { if (a.ko || a.ridden) return; G.text(a.x, a.y - 48, '💢', '#fff'); G.puff(a.x, a.y - 20, '#ffb05a', 6); }); }
    return r;
  };
  if (CG.SPELLS.cri) CG.SPELLS.cri.desc = (CG.SPELLS.cri.desc || '').replace(/\s*Tes animaux.*$/, '') + ' Tes animaux, tes monstres alliés et ton golem frappent eux aussi 50 % plus fort et plus vite.';
  if (CG.Buffs) { const b = CG.Buffs.LISTE.find(x => x.k === 'cri'); if (b) b.txt = 'Tes gardes, tes animaux, tes monstres alliés et ton golem frappent plus vite et font 50 % de dégâts en plus.'; }
})(window.CG);
