// Goblin Malin — trois équipements de récolte : la pioche, la hache et les gants. Trois qualités chacun, comme les armes.
//   Sur le chef (une case chacun, à côté de l'arme et de l'armure) : un pourcentage de plus sur ce qu'il récolte lui-même.
//     pioche : le minerai et l'or des rochers · hache : le bois · gants : les baies et les os
//   Sur un gobelin (sa case « Outil ») : un nombre fixe de plus à chaque voyage, s'il a le bon métier. Ce n'est pas le même bonus.
//   On les trouve chez les marchands, et très rarement au fond d'un coffre.
// Aussi ici : une fenêtre qui laisse le jeu continuer ne noircit plus et ne floute plus l'écran (seulement quand le jeu est arrêté).
'use strict';
(function (CG) {
  const st = document.createElement('style'); st.textContent = 'body.fen-libre #modal{background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}body.fen-pause #modal{background:rgba(6,10,4,.5)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important}'; document.head.appendChild(st);
  const tic = () => { const U = CG.UI, fige = !CG.S || !CG.running || !!(U && U.modal && U.modal.pauses); document.body.classList.toggle('fen-libre', !fige); document.body.classList.toggle('fen-pause', !!(CG.S && CG.running && U && U.modal && U.modal.pauses && !['title', 'over', 'summary'].includes(U.modal.name))); requestAnimationFrame(tic); }; requestAnimationFrame(tic);
})(window.CG);
(function (CG) {
  const G = CG.G, D = CG.D, Bq = CG.Banque, Iv = CG.Inventaire; if (!Bq || !Iv) return;
  const Eq = CG.Equipement = { CHEF: [0, 0.5, 1, 1.5], GOB: [0, 1, 2, 3], PRIX: [0, 90, 240, 520], COFFRE: 0.03, DONJON: 0.08, QUAL: [0.8, 0.97] };
  Eq.L = {
    pioche: { ic: '⛏️', noms: ['', 'Pioche', 'Pioche solide', 'Pioche de maître'], job: 'mineur', res: 'minerai', chef: 'de minerai et d\'or quand tu pioches un rocher toi-même' },
    hache: { ic: '🪓', noms: ['', 'Hache', 'Hache affûtée', 'Hache de maître'], job: 'bucheron', res: 'bois', chef: 'de bois quand tu débites un tronc ou que tu en ramasses. Elle te permet aussi d\'abattre un arbre toi-même' },
    gant: { ic: '🧤', noms: ['', 'Gants de cuir', 'Gants doublés', 'Gants de maître'], job: 'cueilleur', res: 'food', chef: 'de baies quand tu cueilles un buisson, et d\'os quand tu en ramasses' }
  };
  Object.keys(Eq.L).forEach(k => { Bq.NOMS[k] = Eq.L[k].noms; Bq.IC[k] = Eq.L[k].ic; });
  const pc = n => '+' + Math.round(Eq.CHEF[n] * 100) + ' %';
  { const e0 = Bq.effet; Bq.effet = function (k, n) { const o = Eq.L[k]; if (!o) return e0.apply(this, arguments); const J = CG.JOBS[o.job]; return J.nom + ' : +' + Eq.GOB[n] + ' ' + CG.RES[o.res].icon + ' à chaque voyage'; };
    const i0 = Iv.effet; Iv.effet = function (it, chef) { const o = it && Eq.L[it.k]; if (!o) return i0.apply(this, arguments); return chef ? pc(it.n) + ' ' + o.chef : Bq.effet(it.k, it.n); }; }
  // ---------- le chef : ce qu'il récolte lui-même ----------
  const porte = k => { const S = CG.S, q = S && S.player.porte; return q && q[k] ? q[k] : null; };
  { const ps = G.pickStep; if (ps) G.pickStep = function () { const k = CG.R && CG.R.picking; Eq.ctx = k && k.n ? (k.n.type === 'ore' ? 'pioche' : 'gant') : null; try { return ps.apply(this, arguments); } finally { Eq.ctx = null; } };
    const pu = G.pickUp; if (pu) G.pickUp = function (d) { Eq.ctx = d && d.kind === 'res' ? (d.res === 'bois' ? 'hache' : d.res === 'os' ? 'gant' : null) : null; try { return pu.apply(this, arguments); } finally { Eq.ctx = null; } }; }
  const ga0 = G.gain; G.gain = function (res, n, x, y) {
    const S = CG.S, Fi = CG.Filons;
    if (S && n > 0 && Eq.ctx) { const it = porte(Eq.ctx), k = Eq.ctx; Eq.ctx = null; /* une seule fois par récolte */
      if (it && ((k === 'pioche' && res === 'minerai') || (k === 'hache' && res === 'bois') || (k === 'gant' && (res === 'food' || res === 'os')))) { const b = 1 + Eq.CHEF[it.n];
        if (k === 'pioche' && Fi && Fi.chef) { const c = Fi.CHEF; Fi.CHEF = Math.round(c * b); try { return ga0.call(this, res, n, x, y); } finally { Fi.CHEF = c; } }
        n = Math.max(n + 1, Math.round(n * b)); } }
    else if (S && n > 0 && x !== undefined) { // un gobelin qui rentre de sa récolte avec le bon outil
      const g = S.goblins.find(o => o.travail && Eq.L[o.travail.k] && Eq.L[o.travail.k].job === o.job && Eq.L[o.travail.k].res === res && Math.abs(o.x - x) < 0.5 && Math.abs(o.y - 30 - y) < 0.5);
      if (g) { const b = Eq.GOB[g.travail.n] || 0; if (res === 'minerai' && g.orVein && Fi) { const c = Fi.GAIN; Fi.GAIN = c + b; try { return ga0.call(this, res, n, x, y); } finally { Fi.GAIN = c; } } n += b; } }
    return ga0.call(this, res, n, x, y);
  };
  // la sauvegarde : l'outil de travail de chaque gobelin
  { const pk = CG.pack; CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (g && g.travail) o.travail = g.travail; }); return d; }; }
  // ---------- où on les trouve ----------
  const qualite = () => { if (CG.Qualite) return CG.Qualite.tirer(); const q = Math.random(); return q < Eq.QUAL[0] ? 1 : q < Eq.QUAL[1] ? 2 : 3; }; /* les étoiles montent avec les jours (qualite.js) */
  Eq.COURT = { pioche: 'Pour ramasser plus de minerai.', hache: 'Pour ramasser plus de bois et abattre des arbres.', gant: 'Pour cueillir plus de baies.' }; // chez les marchands : une phrase, sans chiffres
  Eq.article = function (k, n) { const o = Eq.L[k]; return { icon: o.ic, label: o.noms[n], desc: '★'.repeat(n) + ' ' + Eq.COURT[k], prix: Eq.PRIX[n], stock: 1, buy: () => { const z = Bq.deposer(k, n, 1, 'sac'); CG.UI.toast(o.ic + ' ' + o.noms[n] + ' : rangé ' + Iv.ou(z) + '.'); } }; };
  if (CG.Outils && CG.Outils.stock) { const s0 = CG.Outils.stock; CG.Outils.stock = function (role) { const l = s0.apply(this, arguments) || [];
      const ks = role === 'nain' ? ['pioche', 'hache'] : role === 'elfe' ? ['gant'] : role === 'sorciere' ? [] : Math.random() < 0.6 ? [CG.pick(Object.keys(Eq.L))] : [];
      return l.concat(ks.map(k => Eq.article(k, qualite()))); }; }
  if (CG.Lapins && CG.Lapins.stock) { const s1 = CG.Lapins.stock; CG.Lapins.stock = function () { const l = s1.apply(this, arguments) || []; if (Math.random() < 0.7) { const k = CG.pick(Object.keys(Eq.L)); l.push(Eq.article(k, qualite())); } return l; }; }
  // très rarement, au fond d'un coffre (un peu moins rarement dans un donjon)
  { const oc0 = D.openChest; D.openChest = function (c) { const r = oc0.apply(this, arguments);
      if (c && c.kind !== 'piege' && Math.random() < (c.biome ? Eq.DONJON : Eq.COFFRE)) { const k = CG.pick(Object.keys(Eq.L)), n = qualite(); if (CG.Objets && CG.Objets.lacher) CG.Objets.lacher(c.x, c.y, k, n); else Bq.deposer(k, n, 1, 'sac'); } // l'outil tombe par terre avec le reste (objets.js)
      return r; }; }
})(window.CG);
