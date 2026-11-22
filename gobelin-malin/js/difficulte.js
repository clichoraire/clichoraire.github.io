// Goblin Malin — les quatre difficultés, choisies en créant une partie : Normal, Difficile (le jeu tel quel), Élite, Cauchemar.
// Élite ne s'ouvre qu'après avoir vaincu le Demon Lord en Difficile, et Cauchemar après l'avoir vaincu en Élite (gardé hors des parties).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, Df = CG.Diff = { pending: null };
  Df.LIST = {
    normal: { nom: 'Normal', icon: '🌼', build: 2, hp: 0.7, dmg: 0.7, xp: 1, titre: 'Pour les chefs qui aiment dormir la nuit.', desc: 'Tu connais déjà l\'Étincelle, 7 gobelins au départ, clôtures et palissades déjà apprises, des ennemis plus mous et moins pressés de venir.' },
    difficile: { nom: 'Difficile', icon: '🔥', build: 3, hp: 1, dmg: 1, xp: 1, titre: 'La vraie vie de gobelin : personne ne t\'a rien promis.', desc: 'Aucun sort au départ, 5 gobelins, et des ennemis en pleine forme.' },
    elite: { nom: 'Élite', icon: '💀', build: 3, hp: 2, dmg: 2, xp: 1.6, titre: 'Tu vas pleurer. Tes gobelins aussi.', desc: 'Monstres deux fois plus costauds et deux fois plus méchants, niveaux plus longs à gagner, invasions à répétition.' },
    cauchemar: { nom: 'Cauchemar', icon: '☠️', build: 4, hp: 3, dmg: 2.5, xp: 2, prix: 1.5, seul: true, titre: 'Tu pars seul, tout coûte plus cher, et personne n\'en est revenu.', desc: 'Aucun gobelin au départ, constructions et marchands une fois et demie plus chers, monstres trois fois plus costauds, niveaux deux fois plus longs, chantiers interminables, et des invasions jour et nuit.' }
  };
  // ---------- les difficultés barrées : il faut avoir vaincu le Demon Lord dans celle d'avant ----------
  Df.BESOIN = { elite: 'difficile', cauchemar: 'elite' }; const CLE = 'gobelinmalin.records';
  Df.records = () => { try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) { return {}; } };
  Df.record = k => Df.records()[k] || 0;
  Df.noter = function () { const S = CG.S; if (!S || !S.day) return; const k = Df.id(), r = Df.records(), boss = !!(S.demon && S.demon.mort && !S.demon.triche); if ((r[k] || 0) >= S.day && (!boss || r['boss_' + k])) return;
    r[k] = Math.max(r[k] || 0, S.day); if (boss) r['boss_' + k] = 1; try { localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) { /* rien */ } };
  Df.ouvert = k => { const b = Df.BESOIN[k]; return !b || !!Df.record('boss_' + b); };
  Df.verrou = k => { const b = Df.BESOIN[k], r = Df.record(b); return 'Bats le Demon Lord en ' + Df.LIST[b].nom + (r ? ' (ton record : jour ' + r + ')' : ''); };
  /* la fiole de vie de base : 45 en Normal, 30 dans toutes les difficultés au-dessus */
  Df.FIOLE = { normal: 45 }; Df.FIOLE_DUR = 30; CG.fiole = () => Df.FIOLE[Df.id()] || Df.FIOLE_DUR;
  window.addEventListener('DOMContentLoaded', () => { const A = CG.Alchimie; if (A && A.VIE) Object.defineProperty(A.VIE, 1, { get: () => CG.fiole(), enumerable: true, configurable: true }); });
  Df.id = () => (CG.S && Df.LIST[CG.S.diff] ? CG.S.diff : 'difficile'); // les parties d'avant : difficile, comme toujours
  Df.cur = () => Df.LIST[Df.id()];
  const ns = G.newState; G.newState = function () { const S = ns.apply(this, arguments); S.diff = Df.LIST[Df.pending] && Df.ouvert(Df.pending) ? Df.pending : 'difficile'; Df.pending = null; return S; };
  // les ennemis : plus mous en Normal, deux fois plus de vie et de dégâts en Élite
  const se = G.spawnEnemy; G.spawnEnemy = function () { const e = se.apply(this, arguments), k = Df.cur(); if (e && k.hp !== 1) { e.hp = e.maxhp = Math.max(1, Math.round(e.hp * k.hp)); e.dmg *= k.dmg; } return e; };
  // les chantiers : deux fois plus longs en Normal, trois fois en Difficile et en Élite (les améliorations aussi, voir ameliorer.js)
  const sn = G.siteNeed; G.siteNeed = type => sn(type) * Df.cur().build;
  // les niveaux du chef
  const xn = G.xpNeed; G.xpNeed = l => Math.floor(xn(l) * Df.cur().xp);
  // les invasions. repos : chance que l'attaque du jour soit annulée ; pas2 / max2 : chance d'une 2e attaque le même jour (pas2 de plus par jour, jusqu'à max2) ; nuit : chance d'une attaque de nuit
  Df.ATTAQUES = { normal: { repos: 0.5, pas2: 0, max2: 0, nuit: 0.05 }, difficile: { repos: 0.2, pas2: 0.05, max2: 0.7, nuit: 0.15 }, elite: { repos: 0, pas2: 0.1, max2: 0.8, nuit: 0.3 }, cauchemar: { repos: 0, pas2: 1, max2: 1, nuit: 0.6 } };
  const plan = D.plan;
  D.plan = function () {
    plan.apply(this, arguments); const S = CG.S, R = CG.R, id = Df.id(), day = S.day; Df.noter(); if (!R.schedule) return;
    const att = R.schedule.filter(e => e.type === 'attack'), keep = att.find(e => e.boss) || att[0], C = Df.ATTAQUES[id] || Df.ATTAQUES.normal;
    R.schedule = R.schedule.filter(e => e.type !== 'attack' || e === keep); /* on repart de la seule attaque principale, puis chaque difficulté ajoute ou enlève */
    if (keep && !keep.boss && day > 1 && Math.random() < C.repos) R.schedule = R.schedule.filter(e => e !== keep); /* certains jours, personne ne vient (jamais un jour de boss) */
    if (day >= 2 && Math.random() < Math.min(C.max2, day * C.pas2)) { const h1 = keep ? keep.h : 11; R.schedule.push({ h: h1 > 13 ? h1 - CG.rand(3.5, 5) : h1 + CG.rand(3.5, 5), type: 'attack', kind: Math.random() < 0.5 ? 'humains' : 'betes' }); } /* une deuxième attaque le même jour : la chance monte un peu chaque jour */
    S.raidNuit = 0; if (day >= 3 && Math.random() < C.nuit) { if (Math.random() < 0.5) R.schedule.push({ h: 20.7, type: 'attack', kind: 'humains', night: true }); else S.raidNuit = day; } /* la nuit : une seule chance par jour, soit au coucher du soleil, soit en plein sommeil (nuit.js) */
    R.schedule.sort((a, b) => a.h - b.h);
  };
  // les prix : en Cauchemar, tout ce qu'on bâtit et tout ce qu'on achète coûte plus cher
  Df.prix = function () { const k = Df.cur().prix || 1; Object.keys(CG.BUILDS).forEach(t => { const b = CG.BUILDS[t]; if (!b.cout) return; if (!b.cout0) b.cout0 = Object.assign({}, b.cout); const c = {}; Object.keys(b.cout0).forEach(r => { c[r] = Math.ceil(b.cout0[r] * k); }); b.cout = c; }); };
  if (CG.UI && CG.UI.shop) { const sh0 = CG.UI.shop; CG.UI.shop = function (v) { const k = Df.cur().prix || 1; if (k !== 1 && v && v.shop) v.shop.forEach(it => { if (it && typeof it.prix === 'number' && !it._cher) { it._cher = true; it.prix = Math.ceil(it.prix * k); } }); return sh0.apply(this, arguments); }; }
  // l'ouverture en iris, façon dessin animé : tout est noir, un rond s'ouvre sur le chef, s'arrête un instant, puis révèle tout
  Df.iris = function () {
    let el = document.getElementById('iris'); if (el) el.remove(); el = document.createElement('div'); el.id = 'iris'; el.style.cssText = 'position:fixed;inset:0;z-index:48;pointer-events:none;background:#000'; document.body.appendChild(el);
    const t0 = performance.now(), ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
    (function tick() {
      const t = (performance.now() - t0) / 1000, w = innerWidth, h = innerHeight, p = CG.S && CG.S.player, s = p && CG.R && CG.R.cam ? CG.toScreen(p.x, p.y - 22) : { x: w / 2, y: h / 2 };
      const max = Math.hypot(Math.max(s.x, w - s.x), Math.max(s.y, h - s.y)) + 20, petit = Math.min(w, h) * 0.11;
      const r = t < 0.7 ? 0 : t < 1.25 ? ease((t - 0.7) / 0.55) * petit : t < 2.3 ? petit * (1 + Math.sin((t - 1.25) * 6) * 0.03) : petit + Math.pow((t - 2.3) / 1.1, 2) * (max - petit);
      if (t > 3.4 || !document.body.contains(el)) { el.remove(); return; }
      el.style.background = r <= 0 ? '#000' : 'radial-gradient(circle at ' + s.x.toFixed(1) + 'px ' + s.y.toFixed(1) + 'px, transparent ' + Math.max(0, r - 1.5).toFixed(1) + 'px, #000 ' + r.toFixed(1) + 'px)';
      requestAnimationFrame(tick);
    })();
  };
  // le départ en Normal : l'Étincelle, une troisième hutte et deux compagnons de plus
  const st = CG.start;
  CG.start = function (isNew) {
    const r = st.apply(this, arguments); if (isNew) Df.iris(); Df.prix();
    if (isNew && Df.cur().seul) { const S = CG.S; S.goblins.slice().forEach(g => G.resetGoblin(g)); S.goblins.length = 0; CG.save(); return r; } // en Cauchemar, le chef commence seul : il faudra accueillir ceux qui passent
    if (!isNew || Df.id() !== 'normal') return r;
    const S = CG.S, p = S.player; S.tech.owned.d24 = 1; S.tech.owned.d25 = 1; // en Normal, on sait déjà bâtir clôtures, portails et palissades if (!p.spells.includes('etincelle')) p.spells.push('etincelle');
    const f = G.firePos(), fx = Math.floor(f.x / T), fy = Math.floor(f.y / T); let spot = null;
    for (let rr = 4; rr < 12 && !spot; rr++) for (let a = 0; a < 16 && !spot; a++) { const tx = Math.round(fx + Math.cos(a * 0.3927) * rr), ty = Math.round(fy + Math.sin(a * 0.3927) * rr); if (W.canBuild(tx, ty, 2, 2) && W.canBuild(tx, ty + 2, 2, 1)) spot = [tx, ty]; }
    if (spot) { const b = { type: 'hut', tx: spot[0], ty: spot[1], w: 2, h: 2, variant: 2 }; S.buildings.push(b); W.blockBuilding(b); }
    ['bucheron', 'cueilleur'].forEach((j, i) => { const g = G.addGoblin(i ? 'f' : 'm', j); g.talent = j; G.makeApt(g); g.hp = G.gobMaxHp(g); g.met = true; });
    /* plus de bandeau « Jour 1 » : on arrive directement dans le jeu, sous le cercle noir */ CG.save(); return r;
  };
})(window.CG);
