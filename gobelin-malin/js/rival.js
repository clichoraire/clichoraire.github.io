// Goblin Malin — le chef rival. De temps en temps, le visiteur du jour est un autre chef gobelin : il vient provoquer le
// chef en duel. Il a un niveau (le même que le chef, ou un ou deux de plus) et il lance les mêmes sorts que lui.
//   Duel accepté : un contre un, près du feu. Les villageois regardent, ils ne s'en mêlent pas.
//   Gagné : il laisse 1 à 3 de ses gobelins, qui entrent dans le clan. Perdu : 1 à 3 gobelins du clan repartent avec lui.
//   Refusé : il s'en va pour de bon, en lançant une moquerie.
// Personne ne meurt dans un duel : le perdant est seulement sonné. Tout est réglable dans CG.Rival.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, Mo = CG.Mondes, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick, dist = CG.dist;
  const Rv = CG.Rival = { TYPE: 'rivalGob', CHANCE: 0.14, JOUR: 4, MIN_GOB: 3, PLUS: [0, 1, 1, 2, 2], MISE: [1, 3], MANA_S: 1.6, SORT_CD: [2.2, 3.6], PREPARE: 0.55, GEL: 2, LOIN: 950,
    SORTS: ['etincelle', 'feu', 'eclair', 'glace', 'racines', 'soin', 'bouclier', 'hate'] }; /* PLUS : niveaux de plus que le chef, tirés au hasard ; SORTS : ceux qu'il sait imiter, s'il les voit dans le grimoire du chef */
  CG.ENEMIES[Rv.TYPE] = { nom: 'Chef rival', race: 'rival', hp: 60, dmg: 7, spd: 104, xp: 0, or: 0, cost: 99, r: 12 };
  const SURNOMS = { m: [' le Teigneux', ' Dent-Cassée', ' le Rusé', ' Poing-de-Pierre', ' le Bruyant', ' Œil-Malin', ' le Costaud', ' Sans-Peur'], f: [' la Teigneuse', ' Dent-Pointue', ' la Rusée', ' Poing-de-Pierre', ' la Tempête', ' Œil-Malin', ' la Costaude', ' Sans-Peur'] };
  const DEFIS = ['On raconte partout que ton clan est le plus fort de la forêt. Moi, je dis que c\'est le mien. Un duel, toi contre moi, et on sera fixés !', 'Chef contre chef, sans gardes, sans animaux. Si tu gagnes, je te laisse de mes gobelins. Si je gagne, j\'emmène des tiens. Tu oses ?', 'J\'ai marché trois jours pour te voir. Pas pour ta soupe : pour te battre en duel. Alors, tu viens ?', 'Mon clan trouve que je me vante trop. Aide-moi à leur prouver que j\'ai raison : bats-toi contre moi !'];
  const MOQUERIES = ['Ha ! Je le savais. Un chef en carton !', 'Tu refuses ? Mes gobelins vont bien rire ce soir.', 'Dommage. Je croyais trouver un chef, j\'ai trouvé une poule mouillée.', 'Cot cot cot ! Tu entends ? C\'est le bruit que tu fais.', 'Bon. Je dirai à tout le monde que tu avais mal au ventre.', 'Même mon petit frère aurait dit oui. Il a quatre ans.', 'Garde ton bâton, alors. Il te servira de canne.', 'Un chef qui se cache derrière son feu de camp... Jolie légende !', 'Je repars. Ne tremble plus, c\'est fini.', 'Tu as raison d\'avoir peur. Moi aussi, à ta place, j\'aurais peur de moi.', 'Tant pis pour toi. J\'irai défier quelqu\'un de courageux.', 'Pfff. J\'ai fait tout ce chemin pour rien. Salut, le froussard !'];
  const BRAVO = ['Ouille... Bien joué, chef. Un marché est un marché : ils sont à toi.', 'D\'accord, d\'accord, tu es le plus fort ! Prends-les, ils t\'aimeront bien.', 'Je n\'ai rien vu venir... Tiens parole, moi aussi : les voilà.'];
  const PERDU = ['Ha ha ! Un marché est un marché : ceux-là viennent avec moi.', 'Tu t\'es bien battu. Mais j\'ai gagné : je les emmène.', 'Pas mal ! Presque. Allez, vous autres, on rentre chez moi.'];
  const duel = () => (CG.R && CG.R.duel) || null; Rv.duel = duel;
  // ---------- il vient ----------
  const pl0 = D.plan; D.plan = function () {
    const r = pl0.apply(this, arguments), S = CG.S, R = CG.R; if (!R.schedule || S.day < Rv.JOUR || (Mo && (Mo.ici() >= 2 || !Mo.feuIci())) || S.goblins.length < Rv.MIN_GOB || Math.random() > Rv.CHANCE) return r;
    R.schedule.push({ h: rand(8, 15), type: 'visit', role: 'rival' }); R.schedule.sort((a, b) => a.h - b.h); return r;
  };
  Rv.venir = function () {
    const S = CG.S, R = CG.R, p = S.player, en = pick(['ouest', 'est', 'sud']), e = W.EXITS[en], f = G.firePos(), ex = W.center(e.x, e.y), sex = Math.random() < 0.5 ? 'f' : 'm';
    const noms = (sex === 'f' ? CG.NAMES_F : CG.NAMES_M).filter(n => !S.goblins.some(g => g.name === n)), nom = (noms.length ? pick(noms) : 'Grumf') + pick(SURNOMS[sex]);
    const v = { id: S.nextId++, role: 'nomade', look: 'gobelin', sex, hue: rand(20, 60), x: ex.x, y: ex.y, face: 1, step: 0, moving: false, state: 'arrive', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 4.5), dest: { x: f.x + 30, y: f.y + 104 },
      rival: { nom, lvl: p.lvl + pick(Rv.PLUS), mise: Rv.MISE[0] + Math.floor(Math.random() * (Rv.MISE[1] - Rv.MISE[0] + 1)), defi: pick(DEFIS) } };
    if (!G.goTo(v, v.dest.x, v.dest.y)) return null; R.visitors.push(v);
    v.annonce = [nom, 'Un chef gobelin venu d\'ailleurs t\'attend près de ton feu. Va lui parler (E).', '#ffd0a0']; return v;
  };
  const sv0 = D.startVisit; D.startVisit = function (ev) { if (ev && ev.role === 'rival') return Rv.venir(); return sv0.apply(this, arguments); };
  const pluriel = n => n + ' gobelin' + (n > 1 ? 's' : '');
  const tk0 = D.talk; D.talk = function (v) {
    if (!v || !v.rival) return tk0.apply(this, arguments); const q = v.rival, R = CG.R;
    if (q.fini) return UI.dialog({ visitor: v, who: q.nom, tag: 'niv. ' + q.lvl, text: q.fini, options: [{ label: '👋 Bonne route' }] });
    if (duel()) return;
    UI.dialog({ visitor: v, who: q.nom, tag: '⚔️ chef rival · niv. ' + q.lvl, text: '« ' + q.defi + ' »', infos: true, extra: '<p class="ask">Si tu gagnes : il te laisse ' + pluriel(q.mise) + '. Si tu perds : ' + pluriel(q.mise) + ' du clan ' + (q.mise > 1 ? 'partent' : 'part') + ' avec lui.</p>', options: [
      { label: '⚔️ J\'accepte le duel', fn: () => Rv.commencer(v) },
      { label: '⏳ Pas tout de suite', sub: 'Il t\'attend encore un peu près du feu' },
      { label: '👋 Je refuse', sub: 'Il s\'en va pour de bon', fn: () => { if (!R.visitors.includes(v)) return; q.fini = 'Tu as eu ta chance. Je ne reviendrai pas.'; v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); G.say(v, pick(MOQUERIES), 5); CG.sfx('no'); } }] });
  };
  // ---------- le duel ----------
  function sortsDe(p) { const l = Rv.SORTS.filter(id => CG.SPELLS[id] && (id === 'etincelle' || (p.spells || []).includes(id))); if (l.length < 2 && CG.SPELLS.soin) l.push('soin'); return l; }
  Rv.commencer = function (v) {
    const S = CG.S, R = CG.R, p = S.player, q = v.rival; if (duel() || !R.visitors.includes(v)) return false;
    const e = G.spawnEnemy(Rv.TYPE, v.x, v.y, { wild: true, exact: true }); if (!e) return false; R.visitors.splice(R.visitors.indexOf(v), 1);
    const plus = q.lvl - p.lvl; e.hp = e.maxhp = Math.round(p.maxhp * 0.85 + q.lvl * 6 + plus * 8); e.dmg = Math.round(3 + q.lvl + p.maxhp * 0.03); e.spd = 100 + Math.min(20, q.lvl * 2);
    { const k = CG.Diff && CG.Diff.cur ? CG.Diff.cur() : null; if (k) { e.hp = e.maxhp = Math.max(1, Math.round(e.hp * (k.hp || 1))); e.dmg = Math.max(1, Math.round(e.dmg * (k.dmg || 1))); } } /* il suit la difficulté, comme tous les ennemis */
    e.duel = true; e.rv = { v, q, sex: v.sex, hue: v.hue, mp: 30 + q.lvl * 6, mpMax: 30 + q.lvl * 6, cd: rand(1.5, 2.5), sorts: sortsDe(p), bouclier: 0, hate: 0, prep: null };
    e.leash = 99999; e.aggroR = 9999; e.calm = false; e.target = p; e.rooted = 1.6; e.xp = 0; e.or = 0;
    R.duel = { e, v, q }; R.invuln = Math.max(R.invuln || 0, 1.2); G.banner('Duel !', q.nom + ' (niv. ' + q.lvl + ') contre toi. Personne d\'autre ne s\'en mêle.', '#ffd0a0'); CG.sfx('warning');
    for (let i = 0; i < 3; i++) R.rings.push({ x: (p.x + e.x) / 2, y: (p.y + e.y) / 2, r: 60 + i * 46, life: 0.5 + i * 0.15, col: '#ffd0a0' }); return true;
  };
  function revient(d, texte) { // le duel est fini : il redevient un visiteur, dit son mot et repart
    const R = CG.R, e = d.e, v = d.v; const i = R.enemies.indexOf(e); if (i >= 0) R.enemies.splice(i, 1); e.dead = true; R.duel = null; if (R.alarm && !R.event) R.alarm = false;
    v.x = e.x; v.y = e.y; v.state = 'wait'; v.moving = false; v.path = null; v.rival.fini = texte; v.leaveAt = Math.min(v.leaveAt, CG.S.hour + 0.25); R.visitors.push(v); G.say(v, texte, 5, 0.4); return v;
  }
  Rv.gagne = function () {
    const S = CG.S, R = CG.R, d = duel(); if (!d) return; const p = S.player, q = d.q, v = revient(d, pick(BRAVO)), noms = [];
    G.puff(v.x, v.y - 20, '#fff', 20, 150, 4); CG.sfx('victory'); G.addXp(20 + q.lvl * 10); S.morale = Math.min(100, S.morale + 5); R.invuln = Math.max(R.invuln || 0, 1.5);
    for (let i = 0; i < q.mise; i++) { const g = G.addGoblin(Math.random() < 0.5 ? 'f' : 'm', 'aucun'); if (!g) continue; g.x = v.x + rand(-40, 40); g.y = v.y + 30 + rand(-10, 20); if (G.unstick) G.unstick(g, 8); noms.push(g.name); G.puff(g.x, g.y - 16, '#c8ffb0', 10, 90, 3); }
    G.banner('Duel gagné !', q.nom + ' s\'incline. ' + (noms.length ? noms.join(', ') + (noms.length > 1 ? ' entrent' : ' entre') + ' dans ton clan. Moral +5.' : 'Moral +5.'), '#c8ffb0');
  };
  Rv.perdu = function () {
    const S = CG.S, R = CG.R, d = duel(); if (!d) return; const p = S.player, q = d.q, v = revient(d, pick(PERDU)), noms = [];
    p.hp = Math.max(1, Math.round(p.maxhp * 0.25)); R.ko = 0; R.invuln = 3; CG.sfx('no'); S.morale = Math.max(0, S.morale - 5);
    const cand = CG.shuffle(S.goblins.filter(g => !g.exile && !g.hidden && !g.child && g.ko !== true)), n = Math.min(q.mise, Math.max(0, S.goblins.length - 1), cand.length);
    for (let i = 0; i < n; i++) { const g = cand[i]; G.resetGoblin(g); g.exile = { t: 14 }; g.ask = null; g.path = null; G.goTo(g, v.exit.x + rand(-20, 20), v.exit.y + rand(-20, 20)); noms.push(g.name); if (i === 0) G.say(g, pick(['Désolé, chef... un marché est un marché.', 'Au revoir, chef. Tu vas me manquer.', 'Je n\'ai pas le choix, chef...']), 4.5, 1.2); }
    let or = 0; if (!n) { or = Math.min(S.res.or, 30 + S.day * 6); S.res.or -= or; }
    G.banner('Duel perdu...', q.nom + ' a gagné. ' + (n ? noms.join(', ') + (n > 1 ? ' repartent' : ' repart') + ' avec lui. Moral -5.' : 'Il n\'y a personne à emmener' + (or ? ' : il prend ' + or + ' 🪙.' : '.') + ' Moral -5.'), '#ff9a8a');
  };
  // le chef ne meurt pas dans un duel : il est sonné, et le duel est perdu
  const die0 = G.die; G.die = function () { if (duel()) return Rv.perdu(); return die0.apply(this, arguments); };
  // seuls le chef et sa magie peuvent le toucher ; son bouclier boit les coups ; son dernier point de vie finit le duel
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg, src) {
    if (!e || !e.duel || !duel()) return he0.apply(this, arguments); const S = CG.S;
    if (src && src !== S.player && (S.goblins.includes(src) || S.pets.includes(src))) return;
    const a = Array.prototype.slice.call(arguments), rv = e.rv;
    if (rv.bouclier > 0) { const b = Math.min(rv.bouclier, a[1]); rv.bouclier -= b; a[1] -= b; G.puff(e.x, e.y - 20, '#9ab6ff', 5); if (a[1] <= 0) return; }
    if (Math.max(1, Math.round(a[1])) * (e.sleepT > 0 ? 2 : 1) >= e.hp) return Rv.gagne();
    return he0.apply(this, a);
  };
  // ---------- sa magie : les mêmes sorts que le chef ----------
  function lancer(e, id) { const S = CG.S, R = CG.R, p = S.player, rv = e.rv, sp = CG.SPELLS[id], d = dist(e, p); rv.mp -= sp.mp; e.atkAnim = 1; G.text(e.x, e.y - 74, sp.icon + ' ' + sp.nom + ' !', sp.color || '#fff', true);
    if (id === 'etincelle') G.shoot(e, p, 'fireE', e.dmg * 0.8, 'e', e);
    else if (id === 'feu') G.shoot(e, p, 'fireE', e.dmg * 1.5, 'e', e, 40);
    else if (id === 'eclair') { if (d < 320 && W.lineClear(e.x, e.y, p.x, p.y)) { (R.rivalEclairs = R.rivalEclairs || []).push({ x0: e.x, y0: e.y - 30, x1: p.x, y1: p.y - 24, t: 0.22 }); G.hurtPlayer(e.dmg * 1.1); if (CG.onScreen(e.x, e.y)) CG.sfx('fire'); } }
    else if (id === 'glace' || id === 'racines') { if (d < 240) { R.rivalGel = Rv.GEL; R.rivalGelK = id === 'racines' ? 0.08 : 0.45; G.text(p.x, p.y - 70, id === 'racines' ? '🌿 Pris dans les racines' : '🥶 Gelé', sp.color, true); R.rings.push({ x: p.x, y: p.y - 6, r: 50, life: 0.4, col: sp.color }); } }
    else if (id === 'soin') { const s = Math.round(e.maxhp * 0.22); e.hp = Math.min(e.maxhp, e.hp + s); G.text(e.x, e.y - 56, '+' + s, '#7dff8a'); G.puff(e.x, e.y - 20, '#7dff8a', 14, 100, 3); CG.sfx('heal'); }
    else if (id === 'bouclier') { rv.bouclier = Math.round(e.maxhp * 0.2); rv.bouclierT = 8; R.rings.push({ x: e.x, y: e.y - 16, r: 40, life: 0.4, col: '#9ab6ff' }); }
    else if (id === 'hate') { rv.hate = 6; G.puff(e.x, e.y - 4, '#e6f7ff', 14, 130, 3); } }
  function choisir(e) { const R = CG.R, p = CG.S.player, rv = e.rv, d = dist(e, p), ok = id => rv.sorts.includes(id) && rv.mp >= CG.SPELLS[id].mp, k = Math.random();
    if (e.hp < e.maxhp * 0.45 && ok('soin') && k < 0.7) return 'soin';
    if (!(rv.bouclier > 0) && ok('bouclier') && k < 0.3) return 'bouclier';
    if (d > 150 && !(rv.hate > 0) && ok('hate') && k < 0.4) return 'hate';
    if (d < 230 && !(R.rivalGel > 0) && k < 0.35) { const c = ['glace', 'racines'].filter(ok); if (c.length) return pick(c); }
    if (d < 340 && W.lineClear(e.x, e.y, p.x, p.y)) { const c = ['etincelle', 'feu', 'eclair'].filter(ok); if (c.length) return pick(c); } return null; }
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.retreat;
  const up0 = G.update; G.update = function (dt) {
    const S0 = CG.S, R0 = CG.R, d0 = R0 && R0.duel;
    if (d0 && S0) { const e = d0.e, p = S0.player, rv = e.rv; e.target = p; e.seek = 1; e.calm = false; e.wild = { x: p.x, y: p.y }; e.spd = (100 + Math.min(20, d0.q.lvl * 2)) * (rv.hate > 0 ? 1.3 : 1);
      if (rv.prep) { e.rooted = Math.max(e.rooted || 0, 0.1); e.atkCd = Math.max(e.atkCd || 0, 0.3); } }
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || S !== S0 || R !== R0) return;
    if (R.rivalGel > 0) R.rivalGel -= dt; if (R.rivalEclairs && R.rivalEclairs.length) { R.rivalEclairs.forEach(b => { b.t -= dt; }); R.rivalEclairs = R.rivalEclairs.filter(b => b.t > 0); }
    const d = R.duel; if (!d) return; const e = d.e, p = S.player, rv = e.rv;
    if (e.dead || !R.enemies.includes(e)) { e.dead = false; if (!R.enemies.includes(e)) R.enemies.push(e); return Rv.gagne(); } /* tombé autrement (un sort qui tue d'un coup) : c'est gagné quand même */
    if (R.night || S.hour >= 23.4 || dist(e, p) > Rv.LOIN) { if (dist(e, p) > Rv.LOIN) return Rv.perdu(); revient(d, 'Il fait nuit. On remettra ça !'); return; } /* se sauver trop loin, c'est perdre */
    for (const g of S.goblins) if (g.target === e) { g.target = null; } for (const a of S.pets) if (a.target === e) a.target = null; /* les autres ne s'en mêlent pas */
    rv.mp = Math.min(rv.mpMax, rv.mp + Rv.MANA_S * dt); if (rv.hate > 0) rv.hate -= dt; if (rv.bouclierT > 0) { rv.bouclierT -= dt; if (rv.bouclierT <= 0) rv.bouclier = 0; }
    if (rv.prep) { if (pris(e)) { rv.prep = null; return; } rv.prep.t -= dt; e.face = p.x > e.x ? 1 : -1; if (rv.prep.t <= 0) { const id = rv.prep.id; rv.prep = null; rv.cd = rand(Rv.SORT_CD[0], Rv.SORT_CD[1]); lancer(e, id); } return; }
    rv.cd -= dt; if (rv.cd > 0 || pris(e)) return; const id = choisir(e); if (!id) { rv.cd = 0.5; return; } rv.prep = { id, t: Rv.PREPARE };
  };
  const hm0 = G.heroMul; G.heroMul = function () { const R = CG.R; return hm0.apply(this, arguments) * (R && R.rivalGel > 0 ? (R.rivalGelK || 0.45) : 1); };
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.push({ k: 'rivalGel', ic: '🥶', mal: true, nom: () => 'Ensorcelé', txt: 'Le chef rival t\'a jeté un sort : tu avances bien moins vite.', t: () => CG.R.rivalGel > 0 ? CG.R.rivalGel : 0 });
  // ---------- dessin : un gobelin à la peau plus rouge, un bandeau de chef, son nom et son niveau au-dessus ----------
  const ae = Art.enemy; Art.enemy = function (g, e, t) {
    if (e.type !== Rv.TYPE || !e.rv) return ae.apply(this, arguments); const rv = e.rv, f = e.face < 0 ? -1 : 1, T0 = t + (e.seed || 0);
    if (rv.bouclier > 0) { g.fillStyle = 'rgba(154,182,255,0.22)'; g.strokeStyle = 'rgba(154,182,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.ellipse(e.x, e.y - 22, 22, 28, 0, 0, TAU); g.fill(); g.stroke(); }
    Art.goblin(g, { x: e.x, y: e.y, face: e.face, t: T0, moving: e.moving, step: e.step, sex: rv.sex || 'm', hue: rv.hue || 40, job: 'aucun', tool: 'baton' });
    if (rv.prep) { const sp = CG.SPELLS[rv.prep.id], k = 1 - rv.prep.t / Rv.PREPARE; g.fillStyle = sp.color || '#fff'; g.globalAlpha = 0.35 + k * 0.5; g.beginPath(); g.arc(e.x + f * 14, e.y - 40, 4 + k * 6, 0, TAU); g.fill(); g.globalAlpha = 1; }
    g.font = '700 12px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; const txt = rv.q.nom + ' · niv. ' + rv.q.lvl; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(txt, e.x, e.y - 74); g.fillStyle = '#ffd0a0'; g.fillText(txt, e.x, e.y - 74);
    Art.bar(g, e.x, e.y - 68, 40, Math.max(0, rv.mp / rv.mpMax), '#5a9aff');
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const L = CG.R && CG.R.rivalEclairs; if (!L || !L.length) return;
    for (const b of L) { g.save(); g.strokeStyle = '#d6c8ff'; g.lineWidth = 3.5; g.lineCap = 'round'; g.shadowColor = '#fff'; g.beginPath(); g.moveTo(b.x0, b.y0); for (let i = 1; i < 6; i++) { const k = i / 6; g.lineTo(b.x0 + (b.x1 - b.x0) * k + Math.sin(i * 7 + b.x0) * 10, b.y0 + (b.y1 - b.y0) * k + Math.cos(i * 5 + b.y0) * 10); } g.lineTo(b.x1, b.y1); g.stroke(); g.restore(); } };
  Rv.essai = function () { const v = Rv.venir(); if (v) { const f = G.firePos(); v.x = f.x + 30; v.y = f.y + 104; v.path = null; v.state = 'wait'; v.moving = false; } return v; }; // pour les essais
})(window.CG);
