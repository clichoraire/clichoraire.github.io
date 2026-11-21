// Goblin Malin — les Lapins : un peuple neutre, marchand dans l'âme et joueur comme pas un.
//   Un colporteur Lapin passe parfois au village ; dans le marais, leur comptoir est toujours ouvert (à l'est).
//   Ils vendent des armes et des armures meilleures que celles de tes artisans (elles arrivent dans ton sac),
//   des parchemins, des carottes ; ils rachètent tes ressources ; ils troquent un parchemin contre un autre ;
//   et ils adorent parier : chacun lance un dé, le plus haut rafle la mise.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Art = CG.Art, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, pick = CG.pick, rand = CG.rand;
  const Lp = CG.Lapins = { CHANCE: 0.3, JOUR: 2, PARIS: 5, MISES: [20, 50, 100], MISE_FOOD: 20, TROC: 20, PRIX: { epee: [0, 0, 90, 220], arc: [0, 0, 80, 200], armure: [0, 0, 110, 260] }, PARCHEMIN: 0.8 };
  Lp.NOMS = ['Maître Trèfle', 'Dame Pissenlit', 'Oncle Luzerne', 'Carotin', 'Mademoiselle Radis', 'Pimprenelle', 'Grand-Oreille', 'Compère Museau'];
  const DES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  // ce qu'un Lapin a dans son sac ; « gros » : le comptoir du marais, mieux garni
  Lp.stock = function (gros) {
    const S = CG.S, p = S.player, Bq = CG.Banque, l = [];
    if (Bq) ['epee', 'arc', 'armure'].forEach(k => [2, 3].forEach(n => { if (Math.random() > (n === 2 ? 0.8 : gros ? 0.75 : 0.4)) return;
      l.push({ icon: Bq.IC[k], label: Bq.NOMS[k][n], desc: '★'.repeat(n) + ' ' + ((CG.Objets && CG.Objets.PHRASE[k]) || 'Pour un gobelin.'), prix: Lp.PRIX[k][n], stock: n === 2 ? (gros ? 3 : 2) : 1, buy: () => { const z = Bq.deposer(k, n, 1, 'sac'); UI.toast(Bq.IC[k] + ' ' + Bq.NOMS[k][n] + ' : rangé ' + (CG.Inventaire ? CG.Inventaire.ou(z) : 'dans le coffre du camp') + '.'); } }); }));
    const vus = {}; for (let i = 0; i < (gros ? 3 : 2); i++) { const id = G.newScroll && G.newScroll(); if (!id || vus[id] || Math.random() < 0.25) continue; vus[id] = 1; const sp = CG.SPELLS[id]; l.push({ scroll: id, icon: '📜', label: 'Parchemin : ' + sp.nom, desc: 'Cercle de magie ' + CG.cercle(id), prix: Math.round(sp.prix * Lp.PARCHEMIN), stock: 1 }); }
    l.push({ icon: '🥕', label: 'Panier de carottes', desc: '+25 nourriture.', prix: 20, stock: gros ? 5 : 3, buy: () => { S.res.food += 25; } });
    l.push({ icon: '🧪', label: 'Fiole de vie', desc: 'Une potion de plus dans ta besace.', prix: 30, stock: 2, buy: () => { p.potions = (p.potions || 0) + 1; } });
    return l;
  };
  const qui = v => v.nom + (v.comptoir ? ', du comptoir des Lapins' : ', colporteur Lapin');
  Lp.parler = function (v) {
    const S = CG.S, p = S.player, nb = Object.keys(p.scrolls || {}).length;
    UI.dialog({ visitor: v, who: qui(v), tag: '🐇 Lapin · neutre',
      text: v.salue ? pick(['Encore toi, peau verte ! Tant mieux, j\'aime les bons clients.', 'On marchande, on troque, ou on joue ? Dis-moi tout.', 'Mes oreilles frétillent : tu as de l\'or sur toi, je le sens.']) : pick(['Bien le bonjour, peau verte ! Chez nous, les Lapins, on ne se bat pas : on marchande. Et on parie, aussi. Surtout.', 'Hop hop hop ! Des lames fines, des cottes solides, des parchemins... et un dé qui ne demande qu\'à rouler.', 'Ni ami ni ennemi : commerçant ! Regarde mon sac, ou tente ta chance aux dés.']),
      options: [
        { label: '🛒 Voir ses marchandises', sub: 'Armes et armures pour tes gobelins, parchemins, carottes · il rachète aussi tes ressources', fn: () => UI.shop(v, { nom: qui(v), hello: 'Tout est de première qualité, parole de Lapin. Les armes et les armures iront droit dans le coffre de ta hutte.' }) },
        { label: '🔁 Troquer un parchemin', sub: nb ? 'Un parchemin pas encore copié + ' + Lp.TROC + ' 🍖 contre un autre, au hasard' : 'Tu n\'as aucun parchemin à troquer (seulement ceux que tu n\'as pas copiés)', disabled: !nb || S.res.food < Lp.TROC, fn: () => Lp.troc(v) },
        { label: '🎲 Parier aux dés', sub: (v.paris || 0) >= Lp.PARIS ? 'Il a assez joué pour aujourd\'hui' : 'Chacun lance un dé : le plus haut rafle la mise', disabled: (v.paris || 0) >= Lp.PARIS, fn: () => Lp.pari(v) },
        { label: '👋 Au revoir' }] });
    v.salue = true;
  };
  Lp.troc = function (v) {
    const S = CG.S, p = S.player, ids = Object.keys(p.scrolls || {}).filter(id => CG.SPELLS[id]);
    UI.dialog({ visitor: v, who: qui(v), tag: '🔁 troc de parchemins', text: 'Un parchemin contre un autre, et ' + Lp.TROC + ' 🍖 pour ma peine. Tu ne choisis pas ce que tu reçois : c\'est ça qui est drôle ! Lequel me donnes-tu ?', grid: true,
      options: ids.map(id => ({ label: '📜 ' + CG.SPELLS[id].nom, sub: 'Tu le donnes, avec ' + Lp.TROC + ' 🍖', disabled: S.res.food < Lp.TROC, fn: () => {
        if (!p.scrolls[id] || S.res.food < Lp.TROC) return; const neuf = G.newScroll && G.newScroll(); if (!neuf) return UI.dialog({ visitor: v, who: qui(v), text: 'Ah, zut : tu connais déjà tout ce que j\'ai dans mon sac. Garde ton parchemin.', options: [{ label: '↩ Retour', fn: () => Lp.parler(v) }] });
        S.res.food -= Lp.TROC; delete p.scrolls[id]; G.giveScroll(neuf, p.x, p.y); G.say(v, pick(['Marché conclu ! Tiens, celui-là sent encore l\'encre.', 'Topons là ! Tu ne le regretteras pas. Enfin, j\'espère.']), 3.5); } })).concat([{ label: '↩ Retour', fn: () => Lp.parler(v) }]) });
  };
  Lp.pari = function (v) {
    const S = CG.S, opts = Lp.MISES.map(m => ({ label: '🪙 Miser ' + m + ' pièces', sub: S.res.or >= m ? 'Si tu gagnes : +' + m + ' 🪙' : 'Tu n\'as que ' + Math.floor(S.res.or) + ' 🪙', disabled: S.res.or < m, fn: () => lancer(v, 'or', m) }));
    opts.push({ label: '🍖 Miser ' + Lp.MISE_FOOD + ' de nourriture', sub: S.res.food >= Lp.MISE_FOOD ? 'Si tu gagnes : +' + Lp.MISE_FOOD + ' 🍖' : 'Tu n\'as que ' + Math.floor(S.res.food) + ' 🍖', disabled: S.res.food < Lp.MISE_FOOD, fn: () => lancer(v, 'food', Lp.MISE_FOOD) });
    opts.push({ label: '↩ Assez joué', fn: () => Lp.parler(v) });
    UI.dialog({ visitor: v, who: qui(v), tag: '🎲 un dé chacun · encore ' + Math.max(0, Lp.PARIS - (v.paris || 0)) + ' partie(s)', text: 'La règle est simple, peau verte : tu lances ton dé, je lance le mien. Le plus haut rafle la mise de l\'autre. Égalité, on relance. Combien oses-tu ?', options: opts });
  };
  const table = (a, b) => '<p class="lp-des" style="font-size:52px;line-height:1;text-align:center;margin:6px 0"><span style="color:#8fe07a">' + a + '</span> <small style="font-size:16px;opacity:.7">contre</small> <span style="color:#ffd08a">' + b + '</span></p>';
  function lancer(v, res, mise) {
    const S = CG.S; if (S.res[res] < mise || (v.paris || 0) >= Lp.PARIS) return Lp.pari(v);
    let a, b, egal = 0; do { a = CG.irand(1, 6); b = CG.irand(1, 6); if (a === b) egal++; } while (a === b);
    v.paris = (v.paris || 0) + 1; const gagne = a > b, ic = CG.RES[res].icon; let fini = false;
    UI.dialog({ visitor: v, who: qui(v), tag: '🎲 les dés roulent...', text: 'Tu secoues ton dé dans ta main, il secoue le sien entre ses pattes...', extra: table('<span id="lp-a">⚀</span>', '<span id="lp-b">⚀</span>'), options: [{ label: '...', disabled: true }] });
    CG.sfx('swing');
    const roule = setInterval(() => { const ea = document.getElementById('lp-a'), eb = document.getElementById('lp-b'); if (ea) ea.textContent = pick(DES); if (eb) eb.textContent = pick(DES); }, 70);
    setTimeout(() => {
      clearInterval(roule); if (fini || CG.S !== S) return; fini = true; S.res[res] += gagne ? mise : -mise; if (res === 'or' && gagne && CG.R && CG.R.dayStats) CG.R.dayStats.or += mise;
      CG.sfx(gagne ? 'coin' : 'no'); const txt = (egal ? 'Égalité au premier lancer, on a relancé. ' : '') + (gagne ? pick(['Tu gagnes ! Ah, mes oreilles en tombent...', 'Bien joué, peau verte. La chance des débutants !', 'Rhaa ! Tu as le poignet, toi.']) + ' +' + mise + ' ' + ic : pick(['Perdu ! Hi hi, mon dé m\'aime bien.', 'À moi la mise ! On remet ça ?', 'Pas de veine, peau verte. Le dé est capricieux.']) + ' -' + mise + ' ' + ic);
      if (!UI.modal || UI.modal.name !== 'dialog' || !document.getElementById('lp-a')) return UI.toast('🎲 ' + DES[a - 1] + ' contre ' + DES[b - 1] + ' : ' + txt); // la fenêtre a été fermée entre-temps : le résultat compte quand même
      UI.dialog({ visitor: v, who: qui(v), tag: gagne ? '🎲 gagné !' : '🎲 perdu...', text: txt, extra: table(DES[a - 1], DES[b - 1]), options: [{ label: '🎲 Encore une partie', disabled: (v.paris || 0) >= Lp.PARIS, sub: (v.paris || 0) >= Lp.PARIS ? 'Il range son dé : assez joué pour aujourd\'hui' : '', fn: () => Lp.pari(v) }, { label: '↩ Assez joué', fn: () => Lp.parler(v) }] });
    }, 950);
  }

  // ---------- la visite au village ----------
  const pl0 = D.plan; D.plan = function () {
    const r = pl0.apply(this, arguments), S = CG.S, R = CG.R; if (!R.schedule || S.day < Lp.JOUR || Math.random() > Lp.CHANCE) return r;
    if (CG.Mondes && (CG.Mondes.ici() === 2 || !CG.Mondes.feuIci())) return r;
    R.schedule.push({ h: rand(7.5, 15.5), type: 'visit', role: 'lapin' }); R.schedule.sort((x, y) => x.h - y.h); return r;
  };
  Lp.venir = function () {
    const S = CG.S, R = CG.R, e = W.EXITS[pick(['ouest', 'est', 'sud'])], f = G.firePos(), ex = W.center(e.x, e.y);
    const v = { id: S.nextId++, role: 'lapin', look: 'lapin', nom: pick(Lp.NOMS), x: ex.x, y: ex.y, face: 1, step: 0, moving: false, state: 'arrive', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 4.5), dest: { x: f.x + 30, y: f.y + 100 }, shop: Lp.stock(false), sells: true, paris: 0, robe: pick(['#b8502a', '#3a7a9a', '#7a5ab0', '#4a8a4a', '#b08a2a']) };
    if (!G.goTo(v, v.dest.x, v.dest.y)) return null; R.visitors.push(v);
    v.annonce = ['Un colporteur Lapin', 'De longues oreilles, un gros sac : il vient marchander, pas se battre. Va lui parler (E).', '#ffe9c8']; return v;
  };
  const sv0 = D.startVisit; D.startVisit = function (ev) { if (ev.role === 'lapin') return Lp.venir(); return sv0.apply(this, arguments); };
  const tk0 = D.talk; D.talk = function (v) { if (v.role === 'lapin') return Lp.parler(v); return tk0.apply(this, arguments); };

  // ---------- le comptoir du marais ----------
  const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments), R = CG.R; R.comptoir = null; if (!CG.Mondes || !CG.Mondes.marais() || !W.marecage) return r;
    const L = W.marecage.lapins, c = W.center(L.x, L.y);
    R.comptoir = { role: 'lapin', look: 'lapin', comptoir: true, nom: 'Mère Garenne', x: c.x, y: c.y + 14, face: 1, step: 0, moving: false, seed: 3.3, shop: Lp.stock(true), sells: true, paris: 0, robe: '#a03a5a',
      draw(g, o, t) { etal(g, this.x, this.y - 14, t); this.face = CG.S.player.x >= this.x ? 1 : -1; Art.visitor(g, this, t); } };
    return r;
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R, c = R && R.comptoir; if (!c || R.ko > 0 || R.cine || R.build) return it;
    if ((!it || it.type === 'home' || it.type === 'hut') && Math.hypot(c.x - CG.S.player.x, c.y - CG.S.player.y) < 62) return { type: 'lapin', obj: c, label: 'Parler à ' + c.nom + ' 🐇' };
    return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'lapin') return Lp.parler(it.obj); return in0.apply(this, arguments); };
  if (CG.Armee) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const c = CG.R && CG.R.comptoir; if (c && CG.onScreen(c.x, c.y)) push(c.y, 21, c, null); }; }

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function etal(g, x, y, t) { // une butte avec une porte ronde (le terrier), et un étal sous un auvent rayé
    ell(g, x, y + 16, 62, 12, 'rgba(0,0,0,0.2)');
    g.fillStyle = '#5c7a3a'; g.beginPath(); g.moveTo(x - 60, y + 14); g.quadraticCurveTo(x - 44, y - 44, x - 16, y - 40); g.quadraticCurveTo(x + 6, y - 38, x + 12, y + 14); g.closePath(); g.fill();
    ell(g, x - 24, y - 4, 13, 16, '#3a2414'); ell(g, x - 24, y - 2, 10.5, 13.5, '#7a4a22'); ell(g, x - 17, y - 2, 1.6, 1.6, '#e8c84a'); // la porte ronde
    g.fillStyle = '#6a4a2a'; g.fillRect(x + 16, y - 10, 46, 5); g.fillRect(x + 18, y - 6, 4, 20); g.fillRect(x + 56, y - 6, 4, 20); // l'étal
    g.fillRect(x + 17, y - 44, 3, 36); g.fillRect(x + 58, y - 44, 3, 36);
    for (let i = 0; i < 6; i++) poly(g, [x + 12 + i * 9, y - 46, x + 21 + i * 9, y - 46, x + 21 + i * 9, y - 36, x + 16.5 + i * 9, y - 32, x + 12 + i * 9, y - 36], i % 2 ? '#f2ead8' : '#d8602a'); // l'auvent rayé
    ell(g, x + 26, y - 13, 3, 2.4, '#e8802a'); ell(g, x + 31, y - 12.6, 3, 2.4, '#e8802a'); poly(g, [x + 40, y - 10, x + 43, y - 19, x + 46, y - 10], '#c8ccd4'); g.fillStyle = '#e8dcc0'; g.fillRect(x + 50, y - 15, 7, 5); // carottes, une lame, un parchemin
    const d = Math.floor(t * 0.7) % 6; g.fillStyle = '#fff'; g.fillRect(x + 34, y - 15.5, 5, 5); g.fillStyle = '#222'; g.fillRect(x + 36, y - 13.5 + (d % 2) * 0.4, 1, 1); // le dé, toujours sur le comptoir
  }
  const vis0 = Art.visitor; Art.visitor = function (g, v, t) {
    if (v.look !== 'lapin') return vis0.apply(this, arguments);
    const portrait = v.x === 0 && v.y === 0, k = portrait ? 1.9 : 1.25, b = t * 2.2 + (v.seed || 0), mv = v.moving, saut = mv ? Math.abs(Math.sin((v.step || 0) * TAU)) * 5 : 0, col = v.robe || '#b8502a', F = '#e8dcc8', O = '#cfc0a6';
    if (!portrait) ell(g, v.x, v.y + 1, 11, 3.6, 'rgba(0,0,0,0.22)');
    g.save(); g.translate(v.x, v.y - saut + (portrait ? 8 : 0)); g.scale((v.face < 0 ? -1 : 1) * k, k);
    ell(g, -6.5, -9, 5.4, 6.4, '#8a6a3a'); g.strokeStyle = '#5c4424'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-6, -14); g.lineTo(2, -17); g.stroke(); // le sac sur le dos
    ell(g, -3, -0.6, 4.4, 2, O); ell(g, 3.4, -0.6, 4.8, 2, F); // les grands pieds
    ell(g, -6, -5, 2.6, 2.6, '#fff'); // la queue en pompon
    ell(g, 0, -8.4, 6.2, 7.6, F); // le corps
    g.fillStyle = col; g.beginPath(); g.moveTo(-5.8, -12); g.quadraticCurveTo(0, -16.5, 5.8, -12); g.lineTo(5.6, -4.6); g.quadraticCurveTo(0, -3, -5.6, -4.6); g.closePath(); g.fill(); ell(g, 2.4, -8.6, 2.6, 4.6, '#fbf4e6'); ell(g, 3.2, -10.6, 0.8, 0.8, '#e8c84a'); ell(g, 3.2, -7.4, 0.8, 0.8, '#e8c84a'); // le gilet et ses boutons
    g.strokeStyle = F; g.lineCap = 'round'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(4, -11); g.lineTo(8 + Math.sin(b) * 0.8, -8.4); g.stroke(); ell(g, 8.4 + Math.sin(b) * 0.8, -8, 1.5, 1.5, F); // la patte de devant
    const or = Math.sin(b * 0.9) * 0.08;
    g.save(); g.translate(-1.6, -21.4); g.rotate(-0.34 + or); ell(g, 0, -8, 2.5, 8.6, O); ell(g, 0, -8, 1.2, 6.4, '#e8a8a0'); g.restore(); // l'oreille du fond
    ell(g, 1, -18.6, 5.6, 5.2, F); // la tête
    g.save(); g.translate(2.4, -22); g.rotate(0.12 - or); ell(g, 0, -8.6, 2.6, 9, F); ell(g, 0, -8.6, 1.3, 6.8, '#f0b4ac'); g.restore(); // l'oreille de devant
    ell(g, 5.8, -17.2, 3, 2.6, '#fbf4e6'); ell(g, 7.8, -18, 1.1, 0.9, '#e07a8a'); g.fillStyle = '#fff'; g.fillRect(5.8, -15.6, 1.9, 2.2); g.strokeStyle = 'rgba(90,70,50,0.5)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(6.75, -15.6); g.lineTo(6.75, -13.4); g.stroke(); // le museau, le nez, les deux dents
    const clin = (t * 0.31 + (v.seed || 0)) % 1 < 0.04; if (clin) { g.strokeStyle = '#2a2018'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(1.8, -19.6); g.lineTo(4, -19.6); g.stroke(); } else { ell(g, 2.9, -19.8, 1.25, 1.6, '#2a2018'); ell(g, 3.3, -20.3, 0.45, 0.5, '#fff'); }
    g.strokeStyle = 'rgba(60,50,40,0.45)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(7, -16.6); g.lineTo(11.4, -17.6); g.moveTo(7, -16); g.lineTo(11.6, -15.6); g.stroke(); // les moustaches
    g.restore();
  };
})(window.CG);
