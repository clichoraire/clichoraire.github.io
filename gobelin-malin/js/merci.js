// Goblin Malin — après un appel à l'aide réussi :
//   celui qui avait demandé de l'aide est encore là quand on ressort du portail : il attend le chef, le remercie et lui donne sa récompense.
//   Et dans la salle, quand le dernier ennemi tombe, il arrive (pas toujours) qu'un piédestal déjà ouvert sorte du sol avec un parchemin.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, W = CG.W, Ar = CG.Arene, T = CG.TILE, pick = CG.pick; if (!Ar || !Ar.Q) return;
  const Mc = CG.Merci = { PARCHEMIN: 0.35, ATTEND: 3, FIOLE: 0.5 };
  // ce qu'il dit en partant, selon ce qu'il est : un troll ne parle pas comme un elfe
  Mc.ADIEU = {
    troll: ['Groumf. Troll pas oublier petit vert.', 'Toi petit. Toi fort. Troll content.', 'Si petit vert en danger, troll cogner pour lui.'],
    elfe: ['Que les feuilles guident tes pas, chef gobelin.', 'La forêt se souviendra de ton nom.', 'Si le vent t\'apporte des ennuis, les miens l\'entendront.'],
    nain: ['Par ma barbe, tu as ma parole et ma pioche !', 'Chez les nains, une dette ne s\'oublie jamais.', 'Ce soir, je lève ma chope à ton nom, chef.'],
    crapaud: ['Croâ ! La mare se souviendra de toi.', 'Que tes pieds restent toujours au frais, chef.', 'Croâ, croâ. Ami des crapauds, pour toujours.'],
    autre: ['Si un jour tu as besoin de moi, tu sais où chercher.', 'Que tes pas soient légers, chef gobelin.', 'Je parlerai de toi autour de moi.']
  };
  Mc.adieu = q => { const k = ((q && (q.kind || '')) + ' ' + (q && (q.look || '')) + ' ' + (q && (q.qui || ''))).toLowerCase(); return Mc.ADIEU[/troll|ogre/.test(k) ? 'troll' : /elfe/.test(k) ? 'elfe' : /nain/.test(k) ? 'nain' : /crapaud/.test(k) ? 'crapaud' : 'autre']; };
  // ---------- le parchemin dans la salle ----------
  const ga0 = Ar.gagner; Ar.gagner = function () {
    const S = CG.S, R = CG.R, A = S.arene;
    if (A && !A.gagne && !A.donne && A.id !== 'crypte' && Math.random() < Mc.PARCHEMIN && G.newScroll && G.newScroll(true)) {
      A.donne = true; A.piedestal = true; const p = S.player, c = { x: (Ar.CX + 0.5) * T, y: (Ar.CY + 0.5) * T };
      S.autels = (S.autels || []).filter(o => !o.crypte); S.autels.push({ tx: Ar.CX, ty: Ar.CY, st: 'ouvert', id: null, day: S.day, crypte: true });
      if (Math.hypot(p.x - c.x, p.y - c.y) < 34) { p.y = c.y + 40; G.unstick(p, 9); }
      G.puff(c.x, c.y - 20, '#c090ff', 34, 200, 5); G.puff(c.x, c.y - 30, '#ffe36b', 20, 140, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: c.x, y: c.y - 6, r: 50 + i * 40, life: 0.45 + i * 0.15, col: i % 2 ? '#ffe36b' : '#c090ff' });
      if (R.pings) R.pings.push({ x: c.x, y: c.y, t0: performance.now(), icon: '📖', dur: 5000 }); CG.sfx('discovery');
    }
    return ga0.apply(this, arguments);
  };
  // ---------- le retour : il est toujours là ----------
  function lot(m) { const S = CG.S, d = S.day; return [['or', 40 + 12 * d + m.palier * 30], ['food', 20 + 4 * d]].concat([pick([['bois', 20 + 3 * d], ['minerai', 10 + 2 * d], ['cuir', 8 + 2 * d]])]); }
  function donner(v, silencieux) {
    const S = CG.S, p = S.player, m = v.merci; if (!m) return; v.merci = null; v.remercie = true; const l = m.lot, xp = 30 + 6 * S.day;
    l.forEach((q, i) => G.gain(q[0], q[1], p.x + (i - 1) * 28, p.y - 50 - (i % 2) * 14)); G.addXp(xp); S.morale = Math.min(100, S.morale + 3); if (m.fiole) p.potions = (p.potions || 0) + 1;
    CG.sfx('victory'); const txt = l.map(q => '+' + q[1] + ' ' + CG.RES[q[0]].icon).join(', ') + ', +' + xp + ' XP, moral +3' + (m.fiole ? ', une fiole de vie 🧪' : '') + '.';
    if (silencieux) UI.toast('🎁 ' + Ar.Q[v.quete].qui + ' est reparti en te laissant sa récompense : ' + txt); else G.banner(Ar.Q[v.quete].qui + ' te remercie', txt, '#c8ffb0');
    v.leaveAt = Math.min(v.leaveAt, S.hour + 0.3);
  }
  Mc.retour = function (A) {
    const S = CG.S, R = CG.R, p = S.player, q = Ar.Q[A.id]; let ex = null, bd = 1e9; Object.values(W.EXITS).forEach(e => { const c = W.center(e.x, e.y), d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; ex = c; } });
    const v = { id: S.nextId++, role: q.role, look: q.look, kind: q.kind, evo: 0, quete: A.id, x: p.x + 56, y: p.y + 12, face: -1, step: 0, moving: false, state: 'wait', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(23.5, S.hour + Mc.ATTEND), merci: { palier: A.palier || 0, fiole: Math.random() < Mc.FIOLE } };
    v.merci.lot = lot(v.merci); if (!W.walkPx(v.x, v.y)) { v.x = p.x - 56; if (!W.walkPx(v.x, v.y)) { v.x = p.x; v.y = p.y + 30; } } G.unstick(v, 8); R.visitors.push(v);
    if (q.sauve) { const a = { id: S.nextId++, role: q.role, look: q.sauve.look, evo: 0, sauve: A.id, maitre: v, x: p.x - 34, y: p.y + 14, face: 1, step: 0, moving: false, state: 'wait', exit: ex, seed: Math.random() * 100, leaveAt: 99 }; if (!W.walkPx(a.x, a.y)) { a.x = p.x; a.y = p.y + 34; } G.unstick(a, 8); R.visitors.push(a); G.say(a, pick(['Maître ! Je suis là !', 'L\'air frais... enfin !']), 4, 2.2); }
    G.banner(q.qui + ' t\'attendait', 'Tu es revenu vainqueur. Va lui parler (E) : il a quelque chose pour toi.', '#c8ffb0'); CG.sfx('ok'); G.say(v, pick(['Tu es vivant ! Je n\'osais plus y croire.', 'Te voilà ! J\'ai tout entendu d\'ici.', 'Par tous les arbres... tu l\'as fait !']), 4, 0.8);
  };
  Object.keys(Ar.Q).forEach(k => { const q = Ar.Q[k]; if (!q.recompense && q.look && q.role) q.recompense = Mc.retour; });
  const tk0 = D.talk; D.talk = function (v) {
    if (v && v.sauve) return UI.dialog({ visitor: v, who: Ar.Q[v.sauve].sauve.qui, text: pick(['« Sans toi, j\'y serais encore, dans cette cage. Merci, chef ! »', '« Je n\'oublierai jamais ça. Va voir mon maître, il a quelque chose pour toi. »']), options: [{ label: '👋 De rien' }] });
    if (v && v.quete && v.merci) { const q = Ar.Q[v.quete], m = v.merci;
      return UI.dialog({ visitor: v, who: q.qui, tag: '🙏 te remercie', text: q.merci + ' Tiens, prends ceci : c\'est peu, mais c\'est de bon cœur.', extra: '<p class="ask">' + m.lot.map(x => '+' + x[1] + ' ' + CG.RES[x[0]].icon).join(' · ') + (m.fiole ? ' · 🧪 une fiole de vie' : '') + '</p>',
        options: [{ label: '🎁 Merci, c\'est gentil', fn: () => { donner(v); G.say(v, pick(Mc.adieu(q)), 4); } }, { label: '🤝 Garde tout, tu en as plus besoin que moi', sub: 'Tu ne prends rien · moral +6', fn: () => { v.merci = null; v.remercie = true; CG.S.morale = Math.min(100, CG.S.morale + 6); G.addXp(30 + 6 * CG.S.day); G.say(v, 'Un chef au grand cœur... On s\'en souviendra.', 4); v.leaveAt = Math.min(v.leaveAt, CG.S.hour + 0.3); CG.sfx('ok'); } }] }); }
    if (v && v.remercie) return UI.dialog({ visitor: v, who: Ar.Q[v.quete].qui, text: pick(['Encore merci. Je reprends la route, le cœur plus léger.', 'Je n\'oublierai pas ce que tu as fait.']), options: [{ label: '👋 Bonne route' }] });
    return tk0.apply(this, arguments);
  };
  // s'il repart sans que le chef lui ait parlé, il laisse quand même sa récompense
  let tic = 0; const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); const R = CG.R; if (!R || !R.visitors) return; tic -= dt; if (tic > 0) return; tic = 0.5; for (const v of R.visitors) if (v.merci && v.state === 'leave') donner(v, true);
    /* celui qu'on a sauvé repart avec son maître, juste derrière lui */ for (const a of R.visitors) if (a.sauve && a.state !== 'leave' && (!a.maitre || a.maitre.state === 'leave' || !R.visitors.includes(a.maitre))) { a.state = 'leave'; G.goTo(a, a.exit.x, a.exit.y); } };
})(window.CG);
