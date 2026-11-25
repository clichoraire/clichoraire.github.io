// Goblin Malin — l'Arc de soie, un arc unique pour le chef. On ne le trouve qu'à un endroit : dans un coffre de la grotte du nid
// (la gueule de pierre qui s'ouvre parfois au milieu du nid d'araignées), avec TROUVER de chance, un seul essai par jour, une seule fois par partie.
//   Chaque flèche qui touche a TOILE[étoiles] de chance d'étaler une toile sous l'ennemi : ceux qui marchent dedans sont ralentis
//   (pas les araignées, elles sont chez elles).
//   ★★ et ★★★ : en plus, COCON[étoiles] de chance que l'ennemi soit ficelé sur place pendant COCON_T secondes (pas les chefs).
// Les étoiles se gagnent chez un facteur d'arcs (dans sa discussion), contre du bois et de l'or : AMELIO.
// Tout est réglable dans CG.ArcToile.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Bq = CG.Banque, Iv = CG.Inventaire, T = CG.TILE, TAU = Math.PI * 2; if (!Bq) return;
  const At = CG.ArcToile = { K: 'arcToile', NOM: 'Arc de soie', IC: '🕸️', TROUVER: 0.2, TOILE: [0, 0.5, 0.6, 0.7], COCON: [0, 0, 0.25, 0.5], COCON_T: 2, RAYON: 40, DUREE: 8, MAX: 14,
    AMELIO: { 2: { bois: 40, or: 500 }, 3: { bois: 80, or: 1200 } } };
  const pc = v => Math.round(v * 100) + ' %';
  At.texte = n => pc(At.TOILE[n] || 0) + ' de chance qu\'une flèche étale une toile sous l\'ennemi (elle le ralentit)' + (At.COCON[n] ? ' · ' + pc(At.COCON[n]) + ' de chance de le ficeler sur place ' + At.COCON_T + ' s' : '');
  Bq.NOMS[At.K] = ['', At.NOM, At.NOM, At.NOM, At.NOM]; Bq.IC[At.K] = At.IC; if (CG.Objets && CG.Objets.PHRASE) CG.Objets.PHRASE[At.K] = 'Filé par la reine des araignées. Ses flèches laissent des toiles.';
  if (Iv && Iv.effet) { const e0 = Iv.effet; Iv.effet = function (it, chef) { if (it && it.k === At.K) return chef ? At.texte(it.n || 1) : 'Pour le chef seulement'; return e0.apply(this, arguments); }; }
  if (Bq.effet) { const b0 = Bq.effet; Bq.effet = function (k, n) { return k === At.K ? 'Pour le chef seulement. ' + At.texte(n || 1) : b0.apply(this, arguments); }; }
  const porte = () => { const p = CG.S && CG.S.player, a = p && p.porte && p.porte.arme; return a && a.k === At.K ? a : null; };
  At.objet = () => { const S = CG.S, p = S.player, l = (p.porte ? [p.porte.arme] : []).concat(p.sac || [], S.coffre || []); return l.find(it => it && it.k === At.K) || null; };
  At.donner = n => { CG.S.arcToileEu = 1; return Bq.deposer(At.K, n || 1, 1, 'sac'); };
  // ---------- la flèche touche ----------
  const araignee = e => /araign/i.test(e.type) || e.type === 'cracheuse', chef = e => { const d = CG.ENEMIES[e.type]; return !!(d && d.boss) || !!e.duel || !!e.grosArene; };
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg, src) {
    const R = CG.R, S = CG.S, a = R && R.tirK === 'arrow' && S && src === S.player ? porte() : null, r = he0.apply(this, arguments); if (!a || !e || e.struct) return r; const n = Math.max(1, Math.min(3, a.n || 1));
    if (Math.random() < At.TOILE[n]) { const L = R.toilesSoie || (R.toilesSoie = []); L.push({ x: e.x, y: e.y + 2, r: At.RAYON, t: At.DUREE, max: At.DUREE, rot: Math.random() * TAU }); while (L.length > At.MAX) L.shift(); G.puff(e.x, e.y - 4, '#f2f4ea', 8, 80, 3); }
    if (!e.dead && At.COCON[n] && !chef(e) && Math.random() < At.COCON[n]) { e.rooted = Math.max(e.rooted || 0, At.COCON_T); e.cocon = R.t + At.COCON_T; e.path = null; if (CG.onScreen(e.x, e.y)) { G.text(e.x, e.y - 62, '🕸️ Ficelé !', '#f2f4ea', true); R.rings.push({ x: e.x, y: e.y - 8, r: 30, life: 0.3, col: '#f2f4ea' }); CG.sfx('hit'); } }
    return r;
  };
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R; const L = R && R.toilesSoie; if (!L || !L.length) return r;
    for (const w of L) { w.t -= dt; for (const e of R.enemies) { if (e.dead || e.struct || araignee(e)) continue; const dx = (e.x - w.x) / w.r, dy = (e.y - w.y) / (w.r * 0.62); if (dx * dx + dy * dy < 1) e.slow = Math.max(e.slow || 0, 0.3); } }
    R.toilesSoie = L.filter(w => w.t > 0); return r;
  };
  // ---------- les dessins : la toile au sol, les fils autour d'un ennemi ficelé ----------
  if (CG.Magie && CG.Magie.ground) { const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); const L = CG.R && CG.R.toilesSoie; if (!L || !L.length) return;
    for (const w of L) { if (!CG.onScreen(w.x, w.y)) continue; const k = Math.min(1, (w.max - w.t) / 0.25); g.save(); g.translate(w.x, w.y); g.scale(k, 0.62 * k); g.rotate(w.rot); g.globalAlpha = Math.min(0.85, w.t * 0.8);
      g.fillStyle = 'rgba(225,238,255,0.14)'; g.beginPath(); g.arc(0, 0, w.r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(235,244,255,0.85)'; g.lineWidth = 1.1; g.beginPath();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.moveTo(0, 0); g.lineTo(Math.cos(a) * w.r, Math.sin(a) * w.r); }
      for (let j = 1; j <= 3; j++) { const rr = w.r * j / 3.2; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, b = (i + 1) / 8 * TAU, m = (a + b) / 2; if (i === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); g.quadraticCurveTo(Math.cos(m) * rr * 0.82, Math.sin(m) * rr * 0.82, Math.cos(b) * rr, Math.sin(b) * rr); } }
      g.stroke(); g.restore(); } }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const R = CG.R; if (!R || !R.enemies) return;
    for (const e of R.enemies) { if (e.dead || !(e.cocon > R.t) || !CG.onScreen(e.x, e.y)) continue; const k = (e.cocon - R.t) / At.COCON_T, r = (e.r || 12) + 5, cy = e.y - 15; g.save(); g.globalAlpha = 0.45 + 0.45 * k; g.strokeStyle = '#f2f4ea'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; g.moveTo(e.x, cy); g.lineTo(e.x + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 9)); } g.stroke();
      g.beginPath(); g.ellipse(e.x, cy, r, r + 2, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(e.x, cy, r * 0.62, r * 0.7 + 1, 0.5, 0, TAU); g.stroke(); g.restore(); } }; }
  // ---------- où on le trouve : un coffre du nid d'araignées ou de la grotte du nid ----------
  At.chezLesAraignees = function () { const S = CG.S, Ar = CG.Arene; return !!(Ar && Ar.dans && Ar.dans() && S.arene && CG.GrotteNid && S.arene.id === CG.GrotteNid.ID); }; /* seulement dans la grotte du nid (la gueule de pierre qui s'ouvre parfois au milieu du nid), jamais dans un coffre dehors */
  if (D && D.openChest) { const oc0 = D.openChest; D.openChest = function (c) {
    const S = CG.S, ici = !!S && !!c && typeof c === 'object' && !c.open && !S.arcToileEu && S.arcToileJour !== S.day && At.chezLesAraignees(c), r = oc0.apply(this, arguments);
    try { if (ici && c.open) { S.arcToileJour = S.day; if (Math.random() < At.TROUVER) { At.donner(1); G.banner('🕸️ ' + At.NOM + ' !', 'Au fond du coffre, un arc tendu d\'un fil de soie. Ses flèches laissent des toiles. Il est dans ton sac.', '#e8f0ff'); CG.sfx('level'); } } } catch (e) { /* jamais bloquant */ }
    return r; }; }
  // ---------- les étoiles : chez un facteur d'arcs ----------
  if (G.nameOpt) { const no0 = G.nameOpt; G.nameOpt = function (o) {
    const base = no0.apply(this, arguments) || []; if (!o || o.pet || o.job !== 'arcier') return base; const it = At.objet(); if (!it || (it.n || 1) >= 3) return base;
    const n = (it.n || 1) + 1, c = At.AMELIO[n], prix = Object.keys(c).map(r => c[r] + ' ' + CG.RES[r].icon).join(' '), peut = G.canPay(c);
    return base.concat([{ label: '🕸️ Retendre mon ' + At.NOM + ' (' + '★'.repeat(n - 1) + ' → ' + '★'.repeat(n) + ')', sub: (peut ? '' : 'Il te manque de quoi payer · ') + prix + ' · ' + At.texte(n), disabled: !peut, fn: () => { if (!G.canPay(c)) return; G.pay(c); it.n = n; CG.sfx('level'); UI.toast('🕸️ ' + At.NOM + ' ' + '★'.repeat(n) + ' : ' + At.texte(n) + '.'); if (G.say) G.say(o, CG.pick(['Quelle soie ! Je n\'ai jamais rien tendu d\'aussi fin.', 'Voilà, chef. Il chante quand on le pince.']), 4); } }]);
  }; }
})(window.CG);
