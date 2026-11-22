// Clan Gobelin — la chicane : parfois, deux gobelins du même métier ne se supportent plus et se tapent dessus (sans se faire bien mal).
// Les autres courent prévenir le chef, en bulle. À lui d'aller les calmer... ou de les laisser régler ça à mort.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Soc = CG.Soc, pick = CG.pick, rand = CG.rand, clamp = CG.clamp;
  const Ch = CG.Chicane = { PAS: ['garde', 'guerisseur', 'eclaireur'], DUREE: 95, PLANCHER: 0.35, timer: 150 };
  const fem = g => g.sex === 'f';
  const INSULTES = ['Face de navet !', 'Voleur de champignons !', 'Tu sens le troll mouillé !', 'Répète un peu, pour voir !', 'C\'est MON coin !', 'Tiens ! Prends ça !', 'Aïe ! Pas les oreilles !', 'Tu travailles comme une limace !', 'Ma grand-mère cogne plus fort !', 'Rends-moi mon panier !', 'Espèce de vieux crapaud !', 'Ouille ! Tricheur !'];
  const ALERTES = ['Chef ! Vite ! {a} se bat avec {b} !', 'Chef, viens voir ! {a} et {b} se tapent dessus !', 'Au secours, chef ! {a} et {b} vont s\'arracher les oreilles !', 'Chef ! Ça cogne entre {a} et {b} ! Fais quelque chose !'];
  const MORT = ['Tu l\'auras voulu !', 'Cette fois, c\'est pour de vrai !', 'Un de nous deux ne mangera pas ce soir !', 'Le chef l\'a dit. Désolé{e}... non, pas désolé{e} !'];
  const PAIX = ['Bon... d\'accord, chef. Pardon.', 'C\'est vrai que j\'ai exagéré.', 'Hmpf. Je lui pardonne. Pour cette fois.', 'On fait la paix. Mais c\'est quand même mon panier.', 'Désolé{e}, chef. On retourne travailler.',
    'C\'est lui qui a commencé ! ... Bon, d\'accord.', 'Aïe, mon oreille. Ça va, ça va, j\'arrête.', 'Oui, chef. On se serre la main. Voilà.', 'Je ne lui parle plus. Mais je ne le tape plus non plus.', 'D\'accord. Mais je garde un œil sur lui.',
    'Pardon, chef. J\'ai vu rouge.', 'Bon. Trêve. Jusqu\'à demain, au moins.', 'On rigolait, chef ! ... Non ? Bon.', 'J\'ai eu tort. Un tout petit peu.', 'Ça va, on arrête. De toute façon, j\'étais en train de gagner.', 'Paix, paix ! J\'ai perdu une dent, ça suffit.'];
  // la paix est faite... mais ça grogne encore un peu en s'éloignant
  const GROGNE = ['... Face de crapaud.', 'Nez de navet !', '(tout bas) Pied plat.', 'Tu sens le vieux champignon.', 'Oreilles de chou !', 'La prochaine fois, le chef ne sera pas là...', 'Gros bêta.', '... Tête de caillou.', 'J\'ai entendu, hein !', 'Même pas mal, d\'abord.', 'Ta hutte pue.', 'Espèce de limace à pattes.', 'Pfff. Mauviette.', 'Toi-même !', 'C\'est celui qui dit qui l\'est.', '... Grande perche.'];
  const libre = g => g.met && !g.child && !g.bebe && !g.hidden && !g.exile && !g.nap && !g.cine && !g.repli && !g.perch && !g.ask && !Ch.PAS.includes(g.job) && g.hp > G.gobMaxHp(g) * 0.6;
  Ch.paires = function () { const S = CG.S, par = {}, out = []; S.goblins.filter(libre).forEach(g => { (par[g.job] = par[g.job] || []).push(g); }); for (const j in par) if (par[j].length >= 2) out.push(par[j]); return out; };
  Ch.lancer = function (a, b) {
    const R = CG.R, S = CG.S; if (R.chicane) return null; if (!a) { const l = Ch.paires(); if (!l.length) return null; const gr = CG.shuffle(pick(l).slice()); a = gr[0]; b = gr[1]; }
    const c = R.chicane = { a, b, t: Ch.DUREE, mort: false, tour: 0, cd: 0.6, alerte: 1.2, dit: 0 }; a.chicane = b.chicane = c; G.resetGoblin(a); G.resetGoblin(b);
    G.say(a, pick(INSULTES), 2.6); G.say(b, pick(INSULTES), 2.6, 0.9); return c;
  };
  function fin(c, comment) {
    const R = CG.R; if (R.chicane === c) R.chicane = null;
    [c.a, c.b].forEach(g => { if (g.chicane === c) { g.chicane = null; if (!g.dead) { G.resetGoblin(g); g.atkAnim = 0; } } });
    CG.S.goblins.forEach(g => { if (g.crieur) { g.crieur = null; G.resetGoblin(g); } });
    if (comment === 'fatigue' && !c.a.dead && !c.b.dead) { const S = CG.S; S.morale = Math.max(0, S.morale - 3); [c.a, c.b].forEach(g => { g.ami = clamp((g.ami || 0) - 1, -6, 6); }); G.say(c.a, 'Pff... j\'en peux plus.', 3); G.say(c.b, 'On remettra ça.', 3, 0.8); UI.toast('😒 ' + c.a.name + ' et ' + c.b.name + ' se sont battus jusqu\'à l\'épuisement. Personne n\'est venu les séparer. (moral -3)'); }
  }
  Ch.fin = fin;
  // ---------- la routine d'un gobelin qui se bat, ou qui court prévenir le chef ----------
  Ch.step = function (g, dt) {
    const R = CG.R, S = CG.S, c = g.chicane;
    if (g.crieur) { // il fonce vers le chef, crie la nouvelle, puis retourne à ses affaires
      const k = g.crieur, p = S.player; k.t -= dt; if (k.t <= 0 || !R.chicane || R.alarm || (CG.Soc.combat && CG.Soc.combat() && !k.dit)) { if (R.chicane && !k.dit && !R.alarm && k.t > 0) R.chicane.alerte = 2; g.crieur = null; G.resetGoblin(g); return false; }
      const d = CG.dist(g, p); g.pose = null;
      if (d > 62 && !k.dit) { g.bubble = '❗'; g.repath = (g.repath || 0) - dt; if (!g.path || !g.path.length || g.repath <= 0) { G.goTo(g, p.x, p.y + 8); g.repath = 0.8; } G.follow(g, 190, dt); return true; }
      if (k.dit) { const cc = R.chicane, mx = (cc.a.x + cc.b.x) / 2, my = (cc.a.y + cc.b.y) / 2, dm = Math.hypot(g.x - mx, g.y - my); g.bubble = null; k.t = Math.max(k.t, 5); // il conduit le chef jusqu'à la bagarre, et l'attend s'il traîne
        if (dm < 84) { g.moving = false; g.path = null; g.face = mx > g.x ? 1 : -1; return true; }
        if (d > 170) { g.moving = false; g.path = null; g.face = p.x > g.x ? 1 : -1; if ((k.cri = (k.cri || 0) - dt) <= 0) { k.cri = 6; G.say(g, pick(['Par ici, chef !', 'Viens vite, c\'est par là !', 'Suis-moi, chef !']), 2.6); } return true; }
        g.repath = (g.repath || 0) - dt; if (!g.path || !g.path.length || g.repath <= 0) { if (!G.goTo(g, cc.a.x, cc.a.y + 30)) G.goTo(g, cc.a.x, cc.a.y); g.repath = 1; } G.follow(g, 125, dt); return true; }
      g.moving = false; g.face = p.x > g.x ? 1 : -1; g.bubble = null;
      if (!k.dit) { k.dit = true; k.cri = 5; k.t = Math.max(k.t, 5); const cc = R.chicane; G.say(g, pick(ALERTES).replace('{a}', cc.a.name).replace('{b}', cc.b.name), 4.6); g.emoteT = 1.2; if (CG.onScreen(g.x, g.y)) CG.sfx('warning'); }
      return true;
    }
    if (!c) return false;
    if (R.chicane !== c) { g.chicane = null; return false; }
    const o = c.a === g ? c.b : c.a;
    if (o.dead || !S.goblins.includes(o) || R.alarm || R.night || o.hidden || g.hidden) { fin(c); return false; }
    g.state = 'chicane'; g.pose = null; g.bubble = null; const d = CG.dist(g, o);
    if (R.talking === g || R.talking === o) { g.moving = false; g.face = S.player.x > g.x ? 1 : -1; return true; } // le chef leur parle : ils s'arrêtent, essoufflés
    if (d > 30) { if (d > 320 && c.mort === false && c.t < Ch.DUREE - 6) { fin(c); return false; } G.chase(g, o.x + (g === c.a ? -22 : 22), o.y, 120, dt); return true; }
    g.moving = false; g.face = o.x > g.x ? 1 : -1;
    if (g !== c.a) return true; // c'est le premier des deux qui tient le compte des coups
    c.t -= dt; c.cd -= dt; c.dit -= dt;
    if (Math.random() < dt * 5) R.parts.push({ x: (g.x + o.x) / 2 + rand(-14, 14), y: g.y - 6 - rand(0, 16), vx: rand(-40, 40), vy: rand(-50, -10), life: 0.5, max: 0.5, col: '#d8c8a0', size: 4, float: true });
    if (c.cd <= 0) {
      c.cd = c.mort ? 0.7 : 0.85; c.tour++; const f = c.tour % 2 ? c.a : c.b, v = f === c.a ? c.b : c.a; f.atkAnim = 1;
      G.text(v.x + rand(-8, 8), v.y - 44, pick(['💢', '💥', '⭐', '💢']), '#fff'); if (CG.onScreen(v.x, v.y)) CG.sfx('hit');
      if (c.mort) { G.hurtGoblin(v, 3 + f.lvl * 1.2 + Math.random() * 2); if (v.dead || !S.goblins.includes(v)) return victoire(c, f, v), true; if (CG.dist(f, v) > 200 || v.hidden) { fin(c); UI.toast('💀 ' + v.name + ' a été tiré de là de justesse. Le combat est fini.'); return true; } }
      else { const bas = Math.max(1, G.gobMaxHp(v) * Ch.PLANCHER); if (v.hp > bas) v.hp = Math.max(bas, v.hp - 1); } // une gifle : ça pique, ça ne tue pas
    }
    if (c.dit <= 0) { c.dit = rand(2.2, 4); G.say(Math.random() < 0.5 ? c.a : c.b, (c.mort && Math.random() < 0.4 ? pick(MORT) : pick(INSULTES)).replace(/\{e\}/g, ''), 2.2); }
    if (!c.mort && c.t <= 0) fin(c, 'fatigue');
    return true;
  };
  function victoire(c, gagnant, perdant) {
    const S = CG.S; fin(c); gagnant.ami = clamp((gagnant.ami || 0) - 1, -6, 6); gagnant.emoteT = 0;
    G.say(gagnant, pick(['... Qu\'est-ce que j\'ai fait ?', 'Voilà. C\'est réglé.', 'Il l\'avait cherché. ... Hein, chef ?']), 4.5); Soc.bystanders(perdant, 'choc');
    G.banner('☠ ' + perdant.name + ' est mort' + (fem(perdant) ? 'e' : ''), gagnant.name + ' a gagné le combat à mort. Le clan est sous le choc.', '#ff9a8a');
  }
  // ---------- quand ça démarre, et qui court prévenir ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const c = R.chicane;
    if (c) {
      if (c.a.chicane !== c || c.b.chicane !== c) return fin(c);
      if (c.alerte > 0) { c.alerte -= dt; if (c.alerte <= 0 && CG.Soc.combat && CG.Soc.combat()) c.alerte = 2; /* le chef se bat : la nouvelle attendra la fin du combat */ if (c.alerte <= 0 && Soc.inVillage() && !R.alarm) { // seulement si le chef est près du village
        const p = S.player, cand = CG.shuffle(S.goblins.filter(g => !g.chicane && g.met && !g.hidden && !g.exile && !g.nap && !g.carry && !g.log && !g.repli && !g.ask && g.job !== 'garde' && g.job !== 'guerisseur' && g.state !== 'fight' && CG.dist(g, p) < 800)).slice(0, 1 + (Math.random() < 0.45 ? 1 : 0));
        cand.forEach((g, i) => { G.resetGoblin(g); g.crieur = { t: 16 + i * 2, dit: false }; g.repath = 0; });
        if (R.pings) R.pings.push({ x: (c.a.x + c.b.x) / 2, y: (c.a.y + c.b.y) / 2, t0: performance.now(), icon: '💢', dur: 8000 });
      } }
      return;
    }
    if (R.alarm || R.night || R.cine || R.ko > 0 || S.hour < 7.5 || S.hour > 17.5) return;
    Ch.timer -= dt; if (Ch.timer > 0) return; Ch.timer = rand(170, 380);
    if (Math.random() < 0.6) Ch.lancer();
  };
  const sd0 = D.startDay; D.startDay = function () { const R = CG.R; if (R && R.chicane) fin(R.chicane); const r = sd0.apply(this, arguments); CG.S.goblins.forEach(g => { g.chicane = null; g.crieur = null; }); Ch.timer = rand(120, 300); return r; };
  // ---------- leur parler : la paix, ou le combat à mort ----------
  const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it && it.type === 'goblin' && it.obj.chicane) { const c = it.obj.chicane; it.label = c.mort ? c.a.name + ' et ' + c.b.name + ' se battent à mort' : 'Séparer ' + c.a.name + ' et ' + c.b.name + ' 💢'; } return it; };
  // comme pour le gobelin qui guide vers un monstre : un rond doré sous ceux qui se battent et sous celui qui vient prévenir,
  // et des chevrons qui partent du messager vers la bagarre
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (c, t) {
    const R = CG.R, S = CG.S, ch = R && R.chicane;
    if (ch && S) { const pu = 0.5 + 0.5 * Math.sin(t * 5), mx = (ch.a.x + ch.b.x) / 2, my = (ch.a.y + ch.b.y) / 2;
      const rond = g => { if (g.hidden || !CG.onScreen(g.x, g.y)) return; const gr = c.createRadialGradient(g.x, g.y + 2, 3, g.x, g.y + 2, 34); gr.addColorStop(0, 'rgba(255,220,90,' + (0.5 + pu * 0.2) + ')'); gr.addColorStop(1, 'rgba(255,220,90,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(g.x, g.y + 2, 34, 15, 0, 0, 6.3); c.fill();
        c.strokeStyle = 'rgba(255,236,150,' + (0.75 + pu * 0.25) + ')'; c.lineWidth = 2.5; c.setLineDash([9, 6]); c.lineDashOffset = -t * 26; c.beginPath(); c.ellipse(g.x, g.y + 2, 22 + pu * 3, 9.5 + pu * 1.3, 0, 0, 6.3); c.stroke(); c.setLineDash([]); };
      c.save(); rond(ch.a); rond(ch.b);
      for (const g of S.goblins) { if (!g.crieur || !g.crieur.dit || g.hidden || !CG.onScreen(g.x, g.y)) continue; rond(g);
        const n = g.path && g.path.length ? g.path[0] : { x: mx, y: my }, dx = n.x - g.x, dy = n.y - g.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; if (Math.hypot(mx - g.x, my - g.y) < 84) continue; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 3;
        for (let i = 0; i < 3; i++) { const k = ((t * 1.6 + i / 3) % 1), cx = g.x + ux * (30 + k * 34), cy = g.y + 2 + uy * (30 + k * 34) * 0.8; c.strokeStyle = 'rgba(255,236,150,' + Math.sin(k * Math.PI) * 0.9 + ')'; c.beginPath(); c.moveTo(cx - ux * 6 - uy * 7, cy - uy * 5 + ux * 6); c.lineTo(cx, cy); c.lineTo(cx - ux * 6 + uy * 7, cy - uy * 5 - ux * 6); c.stroke(); } }
      c.restore(); }
    return gr0.apply(this, arguments);
  }; }
  const tk0 = Soc.talk; Soc.talk = function (g) {
    const c = g.chicane; if (!c || CG.R.chicane !== c) return tk0.apply(this, arguments);
    const S = CG.S, o = c.a === g ? c.b : c.a, e = s => s.replace(/\{e\}/g, fem(g) ? 'e' : '');
    if (c.mort) return UI.dialog({ goblin: g, who: g.name, tag: '⚔️ combat à mort', text: 'Trop tard, chef ! Tu l\'as dit toi-même : jusqu\'au bout !', options: [
      { label: '🕊️ Arrêtez ! J\'ai changé d\'idée.', sub: 'Ils s\'arrêtent, mais le clan a eu peur', fn: () => { fin(c); S.morale = Math.max(0, S.morale - 1); G.say(g, 'Ouf...', 3); G.say(o, 'On a eu chaud.', 3, 0.7); UI.toast('🕊️ Tu arrêtes le combat à mort juste à temps. (moral -1)'); } },
      { label: '👀 Continuez.' }] });
    { // un seul E : le chef les sépare, sans fenêtre
        fin(c); S.morale = Math.min(100, S.morale + 2); G.addXp(5); [g, o].forEach(x => { x.ami = clamp((x.ami || 0) + 1, -6, 6); x.pep = Math.max(x.pep || 0, 20); G.text(x.x, x.y - 50, '🤝', '#fff', true); });
        G.say(g, e(pick(PAIX)), 4); G.say(o, pick(PAIX).replace(/\{e\}/g, fem(o) ? 'e' : ''), 4, 0.9); Soc.bystanders(g, 'good'); CG.sfx('ok'); UI.toast('🕊️ ' + g.name + ' et ' + o.name + ' font la paix. (moral +2)');
        if (Math.random() < 0.75) { const n = CG.irand(1, 3), duo = Math.random() < 0.5 ? [g, o] : [o, g]; for (let k = 0; k < n; k++) G.say(duo[k % 2], pick(GROGNE), 2.8, 5 + k * 2.6 + Math.random()); } /* quelques insultes qui traînent, chacun son tour */ return; }
    UI.dialog({ goblin: g, who: g.name + ' et ' + o.name, tag: '💢 en pleine chicane', text: '', options: [
      { label: '⚔️ D\'accord. Réglez ça pour de bon : combat à mort.', sub: 'Ils se battront pour vrai, jusqu\'à ce qu\'un des deux tombe', fn: () => {
        c.mort = true; c.cd = 0.5; S.morale = Math.max(0, S.morale - 3); G.say(g, e(pick(MORT)), 3); G.say(o, pick(MORT).replace(/\{e\}/g, fem(o) ? 'e' : ''), 3, 0.8); Soc.bystanders(g, 'choc'); CG.sfx('horn'); UI.toast('⚔️ Combat à mort entre ' + g.name + ' et ' + o.name + '. Le clan retient son souffle. (moral -3)'); } },
      { label: '🙄 Je repasse plus tard.' }] });
  };
})(window.CG);
