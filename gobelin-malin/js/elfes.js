// Goblin Malin — le village des elfes, tout au fond de la forêt de l'ouest (la carte voisine, pas la forêt du départ).
//   Une grande clairière, six demeures de pierre claire et de bois d'argent (la grande salle, deux maisons dans les arbres géants,
//   deux pavillons, la tour du mage), une fontaine au milieu. Les elfes sont des amis : ils vendent des armes, des armures et des
//   outils elfiques (qualité 4, au-dessus des « de maître »), très chers et très forts, pour le chef comme pour les gobelins.
//   Le vieux mage vend de la vie ou du mana pour toujours : 1000 pièces d'or le point.
// Tout se règle dans CG.Elfes.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, Bq = CG.Banque, Iv = CG.Inventaire, Eq = CG.Equipement;
  const El = CG.Elfes = {
    MONDE: 3, /* la forêt de l'ouest : la carte où l'on arrive en sortant de chez nous par la gauche (terres.js) */
    LIEU: { x: 11, y: 25, rx: 9, ry: 7 }, /* le centre de la clairière (en cases) et sa taille */
    MAISONS: [{ k: 'salle', tx: 9, ty: 20, w: 5 }, { k: 'arbre', tx: 4, ty: 22, w: 2 }, { k: 'arbre2', tx: 17, ty: 22, w: 2 }, { k: 'pavillon', tx: 3, ty: 27, w: 2 }, { k: 'pavillon2', tx: 18, ty: 27, w: 2 }, { k: 'tour', tx: 14, ty: 30, w: 2 }, { k: 'fontaine', tx: 11, ty: 25, w: 1 }],
    ECHELLE: 1.45, /* la taille des demeures : elles dominent les arbres */
    PNJ: [[11.5, 21.9], [5.5, 28.7], [17.5, 28.7], [13.6, 31.7]], /* où se tiennent la dame, l'archer, la tisseuse et le mage (en cases) */
    GARDE: 0.34, /* un monstre qui entre dans le village est frappé par la lumière des elfes : cette part de sa vie à chaque éclair */
    PRIX: { arc: 2500, epee: 2400, armure: 3000, pioche: 1800, hache: 1800, gant: 1800 }, STOCK: 2,
    MANA: 120, /* il faut au moins ce mana maximum pour être accueilli : sinon les gardes barrent l'entrée */
    MAGE: 1000, /* pièces d'or pour +1 de vie ou de mana, pour toujours */
    FEU: 0.25, /* la part des dégâts de feu qui passe à travers l'armure elfique */
    GOB: { arme: 8, vie: 30 } /* en plus, sur un gobelin : dégâts d'une arme elfique, vie d'une armure elfique */
  };
  const chezNous = () => !!CG.Mondes && CG.Mondes.ici() === El.MONDE; /* seulement dans la forêt de l'ouest (la carte voisine, par la sortie ouest) */
  // ---------- l'équipement elfique : la qualité 4 ----------
  if (Bq) { Bq.NOMS.epee[4] = 'Lame elfique'; Bq.NOMS.arc[4] = 'Arc elfique'; Bq.NOMS.armure[4] = 'Armure elfique'; }
  if (Eq) { Eq.L.pioche.noms[4] = 'Pioche elfique'; Eq.L.hache.noms[4] = 'Hache elfique'; Eq.L.gant.noms[4] = 'Gants elfiques'; Eq.CHEF[4] = 4; Eq.GOB[4] = 6; }
  if (Iv) { Iv.CHEF_EPEE[4] = 24; Iv.CHEF_ARMURE[4] = 80; }
  if (CG.Armes) CG.Armes.ARC_DMG[4] = 2;
  if (CG.Armures) CG.Armures.MOINS[4] = 0.35;
  const q4 = v => (v && typeof v === 'object' ? v.n : +v) === 4;
  { const gd0 = G.guardDmg; G.guardDmg = function (g) { const e = g && g.equip; return gd0.apply(this, arguments) + (e && (g.equip.arc && !g.melee ? q4(e.arc) : q4(e.epee)) ? El.GOB.arme : 0); }; }
  { const mh0 = G.gobMaxHp; G.gobMaxHp = function (g) { return mh0.apply(this, arguments) + (g && g.equip && q4(g.equip.armure) ? El.GOB.vie : 0); }; }
  // le feu : l'armure elfique en arrête presque tout (R.feuSrc est levé par le jeu quand un dégât vient du feu)
  { const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { const q = CG.S && CG.S.player.porte; if (CG.R && CG.R.feuSrc && q && q4(q.armure)) dmg *= El.FEU; return hp0.call(this, dmg); }; }
  { const hg0 = G.hurtGoblin; G.hurtGoblin = function (g, dmg) { if (CG.R && CG.R.feuSrc && g && g.equip && q4(g.equip.armure) && dmg < 9999) { const a = Array.prototype.slice.call(arguments); a[1] = dmg * El.FEU; return hg0.apply(this, a); } return hg0.apply(this, arguments); }; }
  const PHRASE = {
    arc: 'Léger comme une plume. Ses flèches frappent très fort. Pour toi ou un gobelin.', epee: 'Une lame qui brille sous la lune. Rien ne lui résiste. Pour toi ou un gobelin.',
    armure: 'Elle arrête les coups, et le feu ne la traverse presque pas. Pour toi ou un gobelin.', pioche: 'Chaque coup donne le double d\'une pioche de maître.',
    hache: 'Chaque coup donne le double d\'une hache de maître.', gant: 'Deux fois plus de baies qu\'avec des gants de maître.' };
  const article = k => ({ icon: Bq.IC[k], label: Bq.NOMS[k][4], desc: PHRASE[k], prix: El.PRIX[k], stock: El.STOCK, buy: () => { const z = Bq.deposer(k, 4, 1, 'sac'); UI.toast(Bq.IC[k] + ' ' + Bq.NOMS[k][4] + ' : rangé ' + (Iv && Iv.ou ? Iv.ou(z) : 'dans ton sac') + '.'); } });

  // ---------- la clairière ----------
  const gen0 = W.generate; W.generate = function (seed) {
    const r = gen0.apply(this, arguments); W.elfes = null; if (!chezNous() || !W.tile) return r;
    let porte = null; const L = El.LIEU, rng = CG.makeRng((W.seed || seed || 1) + 9091), ok = (x, y) => x >= 2 && y >= 2 && x < CG.MW - 2 && y < CG.MH - 2;
    for (let y = L.y - L.ry - 1; y <= L.y + L.ry + 1; y++) for (let x = L.x - L.rx - 1; x <= L.x + L.rx + 1; x++) {
      if (!ok(x, y)) continue; const d = Math.pow((x - L.x) / L.rx, 2) + Math.pow((y - L.y) / L.ry, 2); if (d > 1 - rng() * 0.14) continue;
      W.tile[W.idx(x, y)] = d < 0.13 || (Math.abs(x - L.x) <= 1 && y < L.y && y > L.y - L.ry + 1) ? W.PATH : W.GRASS; // la place ronde, et l'allée qui monte à la grande salle
    }
    { // un sentier relie le village à la clairière la plus proche (là-bas, tous les sentiers partent du carrefour)
      const P = CG.Terres && CG.Terres.plan && CG.Terres.plan(), l = P ? [P.hub].concat(P.clairieres || []) : [{ x: CG.MW - 3, y: 35 }], a = { x: L.x + 2, y: L.y + 1 }; let b = l[0], bd = 1e9;
      l.forEach(o => { const d = Math.hypot(o.x - a.x, o.y - a.y); if (d > L.rx + 4 && d < bd) { bd = d; b = o; } });
      { const ux = b.x - L.x, uy = b.y - L.y, q = 1 / Math.sqrt(Math.pow(ux / (L.rx + 3), 2) + Math.pow(uy / (L.ry + 3), 2)); porte = { x: (L.x + ux * q + 0.5) * T, y: (L.y + uy * q + 1) * T }; }
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2); for (let k = 0; k <= n; k++) { const q = k / n, x = Math.round(a.x + (b.x - a.x) * q), y = Math.round(a.y + (b.y - a.y) * q + Math.sin(q * Math.PI) * Math.sin(q * 6) * 1.6); for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (ok(x + dx, y + dy)) W.tile[W.idx(x + dx, y + dy)] = W.PATH; }
    }
    if (W.nodes) W.nodes = W.nodes.filter(n => Math.pow((n.x - L.x) / (L.rx + 1), 2) + Math.pow((n.y - L.y) / (L.ry + 1), 2) > 1);
    El.MAISONS.forEach(m => { for (let dy = 1; dy <= 2; dy++) for (let i = -1; i <= m.w; i++) { const j = W.idx(m.tx + i, m.ty + dy); if (ok(m.tx + i, m.ty + dy) && (W.tile[j] === W.TREE || W.tile[j] === W.ROCK)) W.tile[j] = W.GRASS; } }); // rien ne pousse devant une porte
    El.PNJ.forEach(q => { for (let dy = -1; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = Math.floor(q[0]) + dx, y = Math.floor(q[1]) + dy, j = W.idx(x, y); if (ok(x, y) && (W.tile[j] === W.TREE || W.tile[j] === W.ROCK)) W.tile[j] = W.GRASS; } }); // ni devant un habitant
    El.MAISONS.forEach(m => { for (let i = 0; i < m.w; i++) W.tile[W.idx(m.tx + i, m.ty)] = W.BUILD; });
    W.elfes = { x: (L.x + 0.5) * T, y: (L.y + 0.5) * T, r: (L.rx + 2) * T, porte };
    if (porte) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = Math.floor(porte.x / T) + dx, y = Math.floor(porte.y / T) + dy, j = W.idx(x, y); if (ok(x, y) && (W.tile[j] === W.TREE || W.tile[j] === W.ROCK || W.tile[j] === W.WATER)) W.tile[j] = W.GRASS; } // de la place pour les deux gardes
    return r;
  };
  // pas de monstres installés chez les elfes
  { const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments), R = CG.R, V = W.elfes; if (V && R && R.enemies) R.enemies = R.enemies.filter(e => Math.hypot(e.x - V.x, e.y - V.y) > V.r + 60); return r; }; }

  // ---------- les habitants ----------
  const px = (tx, ty) => ({ x: tx * T, y: ty * T });
  function peuple() {
    const R = CG.R, mk = (role, nom, titre, tx, ty, o) => Object.assign({ role: 'elfeV', quoi: role, look: 'elfeV', nom, titre, x: tx * T, y: ty * T, face: 1, step: 0, moving: false, seed: tx * 1.7 }, o);
    R.elfesV = [
      mk('dame', 'Dame Aëlis', 'gardienne du village', El.PNJ[0][0], El.PNJ[0][1], { tunic: '#e8ecf4', hair: '#f4ecc0', glow: '#bfe8ff' }),
      mk('archer', 'Faelar', 'maître archer', El.PNJ[1][0], El.PNJ[1][1], { tunic: '#3f8a5a', hair: '#e8d890', glow: '#7dff8a', shop: ['arc', 'epee'].map(article) }),
      mk('tisseuse', 'Ilwen', 'tisseuse d\'armures', El.PNJ[2][0], El.PNJ[2][1], { tunic: '#4a6fa8', hair: '#c8b0e0', glow: '#9ad0ff', shop: ['armure', 'pioche', 'hache', 'gant'].map(article) }),
      mk('mage', 'Maître Orvald', 'vieux mage', El.PNJ[3][0], El.PNJ[3][1], { look: 'mageV' })
    ];
    const P = W.elfes && W.elfes.porte; if (P) { const dx = P.x - W.elfes.x, dy = P.y - W.elfes.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; // deux gardes, de chaque côté du sentier
      [[-1, 'Thalan'], [1, 'Erevan']].forEach(q => { let x = P.x + nx * 46 * q[0], y = P.y + ny * 46 * q[0]; if (!W.walkPx(x, y)) { x = P.x + q[0] * 30; y = P.y; } R.elfesV.push(mk('garde', q[1], 'garde de la cité', x / T, y / T, { tunic: '#c8ccd8', hair: '#e8e0b0', glow: '#bfe8ff', armure: true })); }); }
  }
  El.accueilli = () => { const p = CG.S && CG.S.player; return !!p && p.maxmp >= El.MANA; };
  const dire = (v, text, options) => UI.dialog({ visitor: v, who: v.nom + ', ' + v.titre, tag: v.quoi === 'mage' ? '🧙 Mage · ami' : '🌿 Elfe · ami', text, options });
  const AUREVOIR = { label: '👋 Au revoir', sub: 'Tu reprends ta route', fn: () => { } };
  El.parler = function (v) {
    const S = CG.S, p = S.player;
    if (v.quoi === 'garde') return dire(v, El.accueilli() ? 'Passe, ami des elfes. La cité t\'est ouverte.' : 'Halte. Seuls ceux qui portent assez de magie entrent dans la cité. Tu as ' + Math.floor(p.maxmp) + ' de mana : il en faut ' + El.MANA + '. Reviens plus tard, petit chef.', [AUREVOIR]);
    if (v.quoi === 'dame') return dire(v, v.vu ? 'Que les étoiles veillent sur ton clan, petit chef.' : 'Un gobelin, ici ? La forêt t\'a laissé passer : sois le bienvenu. Nos artisans font les plus beaux arcs du monde. Va les voir.', [AUREVOIR]), void (v.vu = true);
    if (v.quoi === 'mage') {
      const or = Math.floor(S.res.or), peut = or >= El.MAGE, acheter = quoi => () => {
        if (S.res.or < El.MAGE) return; S.res.or -= El.MAGE; if (quoi === 'vie') { p.maxhp += 1; p.hp = Math.min(p.maxhp, p.hp + 1); } else { p.maxmp += 1; p.mp = Math.min(p.maxmp, p.mp + 1); }
        CG.sfx('heal'); G.text(p.x, p.y - 70, quoi === 'vie' ? '❤️ +1 vie pour toujours' : '💧 +1 mana pour toujours', quoi === 'vie' ? '#ffb0a8' : '#9ad0ff', true); CG.R.rings.push({ x: p.x, y: p.y - 10, r: 60, life: 0.6, col: quoi === 'vie' ? '#ff8a8a' : '#7ab8ff' });
        setTimeout(() => El.parler(v), 0);
      };
      return dire(v, v.vu ? 'Encore toi ? Bien. La magie se paie, petit chef, mais elle ne s\'en va jamais.' : 'Hmm. Un chef gobelin qui vient voir un vieux mage... Je peux te rendre plus fort pour toujours. Mais ce n\'est pas donné.',
        [{ label: '❤️ +1 vie pour toujours · ' + El.MAGE + ' 🪙', sub: 'Tu as ' + or + ' 🪙', disabled: !peut, fn: acheter('vie') }, { label: '💧 +1 mana pour toujours · ' + El.MAGE + ' 🪙', sub: 'Tu as ' + or + ' 🪙', disabled: !peut, fn: acheter('mana') }].concat(CG.CerclesPrix ? [{ label: '📖 Voir ses tomes de niveau II', sub: 'Pour rendre plus forts les sorts que tu connais déjà', fn: () => { v.shop = CG.CerclesPrix.elfes(); if (!v.shop.length) return dire(v, 'Je n\'ai rien pour toi aujourd\'hui : apprends d\'abord un sort, ou finis ceux que tu as.', [AUREVOIR]); UI.shop(v, { nom: v.nom + ', ' + v.titre, hello: 'Un sort qu\'on connaît peut toujours grandir. Mais ce savoir-là se paie cher.' }); } }] : []).concat([AUREVOIR])), void (v.vu = true);
    }
    const archer = v.quoi === 'archer';
    dire(v, archer ? 'Regarde cet arc. Du bois d\'argent, une corde de lune. Il coûte cher, oui. Mais tu n\'en verras jamais de meilleur.' : 'Mes armures sont légères comme une feuille et dures comme la pierre. Même le feu les laisse tranquilles.',
      [{ label: '🛒 Voir ses merveilles', sub: archer ? 'Arcs et lames elfiques, pour toi ou tes gobelins' : 'Armures et outils elfiques, pour toi ou tes gobelins', fn: () => UI.shop(v, { nom: v.nom + ', ' + v.titre, hello: 'Prends ton temps. Ce qui est beau ne se choisit pas vite.' }) }, AUREVOIR]);
  };
  { const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R, L = R && R.elfesV; if (!L || !W.elfes || R.ko > 0 || R.cine || R.build) return it; if (it && it.type !== 'home' && it.type !== 'hut') return it;
    const p = CG.S.player; let best = null, bd = 62; for (const v of L) { const d = Math.hypot(v.x - p.x, v.y - p.y); if (d < bd) { bd = d; best = v; } }
    return best ? { type: 'elfeV', obj: best, label: 'Parler à ' + best.nom + (best.quoi === 'mage' ? ' 🧙' : ' 🌿') } : it;
  };
    const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'elfeV') return El.parler(it.obj); return in0.apply(this, arguments); }; }
  { const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); const R = CG.R; if (!R || !CG.S) return; if (!W.elfes) { if (R.elfesV) R.elfesV = null; return; } if (!R.elfesV) peuple(); const p = CG.S.player; for (const v of R.elfesV) if (Math.abs(p.x - v.x) > 6) v.face = p.x > v.x ? 1 : -1;
    // pas assez de mana : les gardes repoussent le chef hors de la cité
    if (!El.accueilli() && !(R.ko > 0)) { const V0 = W.elfes, L0 = El.LIEU, ux = (p.x - V0.x) / ((L0.rx + 0.6) * T), uy = (p.y - V0.y) / ((L0.ry + 0.6) * T), q = Math.hypot(ux, uy);
      if (q < 1) { const P = V0.porte; let x = V0.x + (p.x - V0.x) / (q || 1) * 1.1, y = V0.y + (p.y - V0.y) / (q || 1) * 1.1; if (!W.walkPx(x, y) && P) { x = P.x + (P.x - V0.x) * 0.12; y = P.y + (P.y - V0.y) * 0.12; } p.x = x; p.y = y; p.path = null; G.unstick(p, 9);
        if (!(R.elfesHalte > R.t)) { R.elfesHalte = R.t + 2.5; CG.sfx('no'); const gd = R.elfesV.filter(v => v.quoi === 'garde').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; G.text(gd ? gd.x : p.x, (gd ? gd.y : p.y) - 70, 'Halte ! Pas assez de magie.', '#bfe8ff', true); } } }
    // la lumière des elfes garde le village : un monstre qui y entre est frappé, encore et encore
    R.elfesT = (R.elfesT || 0) - dt; if (R.elfesT > 0) return; R.elfesT = 0.5; const V = W.elfes, L = El.LIEU;
    for (const e of R.enemies.slice()) { if (e.dead || e.struct || e.charm > 0 || Math.pow((e.x - V.x) / ((L.rx + 1) * T), 2) + Math.pow((e.y - V.y) / ((L.ry + 1) * T), 2) > 1) continue;
      if (!CG.onScreen(e.x, e.y)) { const i = R.enemies.indexOf(e); if (i >= 0 && !e.boss) R.enemies.splice(i, 1); continue; }
      if (e.elfT > R.t) continue; e.elfT = R.t + 0.9; R.bolts.push({ x1: V.x, y1: V.y - 110, x2: e.x, y2: e.y - 14, life: 0.3 }); R.rings.push({ x: e.x, y: e.y - 10, r: 34, life: 0.4, col: '#fff2b8' }); CG.sfx('zap'); G.hurtEnemy(e, Math.max(4, (e.maxhp || 10) * El.GARDE), null); } }; }

  // ---------- les dessins ----------
  const PIERRE = '#eef0e4', PIERRE2 = '#d4d8cc', OMBRE = '#aab2ac', TOIT = '#3f7f86', TOIT2 = '#2f6670', OR = '#e6c66a', LUEUR = '#fff2b8', BOIS = '#b9b3a6', BOIS2 = '#8f8a80';
  const el = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const rc = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const poly = (g, p, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  // une arche en ogive, pied en (x, y)
  function arche(g, x, y, w, h, c) { g.fillStyle = c; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y - h * 0.5); g.quadraticCurveTo(x - w / 2, y - h * 0.9, x, y - h); g.quadraticCurveTo(x + w / 2, y - h * 0.9, x + w / 2, y - h * 0.5); g.lineTo(x + w / 2, y); g.closePath(); g.fill(); }
  // un toit elfique : deux courbes qui montent en pointe
  function toit(g, x, y, w, h, c, c2) { g.fillStyle = c; g.beginPath(); g.moveTo(x - w / 2 - 7, y + 2); g.quadraticCurveTo(x - w * 0.16, y - h * 0.3, x, y - h); g.quadraticCurveTo(x + w * 0.16, y - h * 0.3, x + w / 2 + 7, y + 2); g.closePath(); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(x, y - h); g.quadraticCurveTo(x + w * 0.16, y - h * 0.3, x + w / 2 + 7, y + 2); g.lineTo(x + w * 0.12, y + 2); g.quadraticCurveTo(x + w * 0.04, y - h * 0.4, x, y - h); g.fill();
    rc(g, x - w / 2 - 7, y, w + 14, 3, OR); }
  function etoile(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - Math.PI / 2, q = i % 2 ? r * 0.38 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }
  function fleche(g, x, y, h, c) { poly(g, [x - 2.2, y, x + 2.2, y, x, y - h], c); etoile(g, x, y - h - 4, 5, OR); }
  function colonne(g, x, y, h) { rc(g, x - 2.5, y - h, 5, h, PIERRE); rc(g, x + 0.5, y - h, 2, h, PIERRE2); rc(g, x - 4, y - h - 2, 8, 3, OR); rc(g, x - 4, y - 3, 8, 3, PIERRE2); }
  function fenetre(g, x, y, w, h) { arche(g, x, y, w + 3, h + 3, OR); arche(g, x, y, w, h, '#fff0a8'); arche(g, x, y, w * 0.45, h * 0.8, '#ffdf7a'); }
  function marches(g, x, y, w, n) { for (let i = 0; i < n; i++) { rc(g, x - w / 2 - i * 5, y - 4 * (n - i), w + i * 10, 4, i % 2 ? PIERRE : PIERRE2); } }
  function feuillage(g, x, y, r, s) { const C = ['#c99a34', '#deb848', '#efd468', '#fff0a8']; /* des feuilles d'or */ for (let i = 0; i < 16; i++) { const a = (i * 2.4 + s) % TAU, d = r * (0.25 + ((i * 37 + s * 11) % 60) / 100); el(g, x + Math.cos(a) * d * 1.25, y + Math.sin(a) * d * 0.7, r * 0.42, r * 0.34, C[i % 3]); } for (let i = 0; i < 9; i++) { const a = (i * 1.9 + s) % TAU, d = r * 0.5; el(g, x + Math.cos(a) * d * 1.1 - 4, y + Math.sin(a) * d * 0.6 - r * 0.2, r * 0.2, r * 0.14, C[3]); } }
  const DESSINS = {
    salle(g) { // la grande salle : un large perron, cinq arches, deux tourelles et une haute flèche
      el(g, 0, 0, 104, 13, 'rgba(0,0,0,0.2)'); marches(g, 0, 0, 96, 4);
      rc(g, -84, -92, 168, 76, PIERRE); rc(g, 30, -92, 54, 76, PIERRE2); rc(g, -84, -96, 168, 5, OR); rc(g, -84, -20, 168, 4, OMBRE);
      [-62, -33, 33, 62].forEach(x => { arche(g, x, -18, 20, 50, '#5a7f86'); arche(g, x, -18, 15, 44, '#fff0a8'); arche(g, x, -18, 6, 34, '#ffe08a'); });
      arche(g, 0, -16, 34, 66, OR); arche(g, 0, -16, 28, 60, '#3a5a60'); arche(g, 0, -16, 22, 52, '#ffe9a0'); arche(g, 0, -16, 9, 40, '#fff8d8');
      [-76, -48, -19, 19, 48, 76].forEach(x => colonne(g, x, -16, 74));
      toit(g, 0, -96, 150, 62, TOIT, TOIT2);
      fenetre(g, 0, -108, 12, 22);
      [-70, 70].forEach(x => { rc(g, x - 13, -150, 26, 58, PIERRE); rc(g, x + 3, -150, 10, 58, PIERRE2); fenetre(g, x, -108, 8, 18); fenetre(g, x, -134, 6, 12); toit(g, x, -150, 26, 52, TOIT, TOIT2); fleche(g, x, -200, 22, OR); });
      rc(g, -9, -178, 18, 24, PIERRE); rc(g, 2, -178, 7, 24, PIERRE2); fenetre(g, 0, -160, 6, 12); toit(g, 0, -178, 18, 46, TOIT, TOIT2); fleche(g, 0, -222, 30, OR);
      [-48, 48].forEach(x => { rc(g, x - 1, -86, 2, 8, OR); poly(g, [x - 7, -78, x + 7, -78, x + 7, -48, x, -40, x - 7, -48], '#2f6670'); etoile(g, x, -62, 4.5, OR); }); // les bannières
    },
    arbre(g, o) { // une maison dans un arbre géant : un tronc d'argent, un escalier qui tourne, une plate-forme et sa maisonnette
      el(g, 0, 0, 58, 10, 'rgba(0,0,0,0.2)');
      g.fillStyle = BOIS; g.beginPath(); g.moveTo(-34, 2); g.quadraticCurveTo(-16, -18, -15, -70); g.lineTo(-12, -170); g.lineTo(12, -170); g.lineTo(15, -70); g.quadraticCurveTo(16, -18, 34, 2); g.closePath(); g.fill();
      g.fillStyle = BOIS2; g.beginPath(); g.moveTo(34, 2); g.quadraticCurveTo(16, -18, 15, -70); g.lineTo(12, -170); g.lineTo(4, -170); g.lineTo(6, -70); g.quadraticCurveTo(8, -20, 14, 2); g.closePath(); g.fill();
      for (let i = 0; i < 9; i++) { const a = i * 0.75, x = Math.sin(a) * 19, y = -8 - i * 8.5, d = Math.cos(a); if (d > -0.2) { rc(g, x - 8, y, 16, 3, PIERRE); rc(g, x - 8, y + 3, 16, 2, OMBRE); } } // l'escalier en colimaçon
      feuillage(g, 0, -172, 62, o ? 3 : 1);
      rc(g, -44, -92, 88, 5, PIERRE); rc(g, -44, -87, 88, 3, OMBRE); poly(g, [-36, -84, -14, -84, -15, -70], BOIS2); poly(g, [36, -84, 14, -84, 15, -70], BOIS2);
      for (let x = -42; x <= 42; x += 7) rc(g, x - 0.8, -104, 1.6, 12, OR); rc(g, -44, -106, 88, 2.5, PIERRE);
      rc(g, -22, -132, 44, 40, PIERRE); rc(g, 6, -132, 16, 40, PIERRE2); arche(g, -9, -92, 13, 26, '#3a5a60'); arche(g, -9, -92, 9, 22, '#ffe9a0'); fenetre(g, 11, -106, 8, 15);
      toit(g, 0, -132, 44, 40, o ? '#4a6fa8' : TOIT, o ? '#3a5a8c' : TOIT2); fleche(g, 0, -170, 14, OR);
      [-38, 38].forEach(x => { rc(g, x - 0.5, -84, 1, 14, OR); el(g, x, -67, 4.5, 5.5, '#fff0a8'); el(g, x, -67, 2.2, 3, '#fffbe0'); }); // des lanternes pendues
    },
    pavillon(g, o) { // un pavillon ouvert : trois arches sous un dôme en pointe
      el(g, 0, 0, 56, 9, 'rgba(0,0,0,0.2)'); marches(g, 0, 0, 78, 2);
      rc(g, -40, -64, 80, 56, o ? '#dfe6ee' : PIERRE); rc(g, 14, -64, 26, 56, PIERRE2); rc(g, -40, -68, 80, 5, OR);
      [-25, 25].forEach(x => { arche(g, x, -8, 17, 42, '#5a7f86'); arche(g, x, -8, 12, 36, '#fff0a8'); });
      arche(g, 0, -8, 22, 50, OR); arche(g, 0, -8, 17, 45, '#3a5a60'); arche(g, 0, -8, 12, 38, '#ffe9a0');
      [-38, -13, 13, 38].forEach(x => colonne(g, x, -8, 56));
      toit(g, 0, -68, 76, 58, o ? '#4a6fa8' : TOIT, o ? '#3a5a8c' : TOIT2); fenetre(g, 0, -76, 8, 15); fleche(g, 0, -124, 22, OR);
      rc(g, -52, -40, 2, 40, OR); el(g, -51, -44, 5, 6, '#fff0a8'); el(g, -51, -44, 2.4, 3.2, '#fffbe0'); // une lanterne sur pied
    },
    tour(g) { // la tour du mage : haute, mince, un balcon et un toit bleu nuit semé d'étoiles
      el(g, 0, 0, 44, 8, 'rgba(0,0,0,0.2)'); marches(g, 0, 0, 44, 2);
      poly(g, [-24, -8, 24, -8, 19, -150, -19, -150], '#e2e4ea'); poly(g, [6, -8, 24, -8, 19, -150, 5, -150], '#c6cad6');
      arche(g, 0, -8, 18, 34, OR); arche(g, 0, -8, 14, 30, '#3a3a5c'); arche(g, 0, -8, 8, 22, '#b8a8ff');
      fenetre(g, -6, -62, 7, 14); fenetre(g, 6, -92, 7, 14); fenetre(g, -5, -122, 6, 12);
      rc(g, -30, -154, 60, 6, PIERRE); rc(g, -30, -148, 60, 3, OMBRE); for (let x = -28; x <= 28; x += 7) rc(g, x - 0.8, -166, 1.6, 12, OR); rc(g, -30, -168, 60, 2.5, PIERRE);
      rc(g, -15, -196, 30, 42, '#e2e4ea'); rc(g, 3, -196, 12, 42, '#c6cad6'); fenetre(g, 0, -166, 9, 18);
      toit(g, 0, -196, 34, 70, '#3a4a8c', '#2c3a72'); [[-6, -212, 2.2], [5, -222, 1.8], [-2, -236, 1.6], [8, -206, 1.5]].forEach(q => etoile(g, q[0], q[1], q[2], '#fff2b8'));
      fleche(g, 0, -264, 16, OR);
    },
    fontaine(g) { // la fontaine : une vasque de pierre et un petit arbre blanc
      el(g, 0, 2, 38, 11, 'rgba(0,0,0,0.18)'); el(g, 0, -4, 34, 12, PIERRE2); el(g, 0, -7, 34, 12, PIERRE); el(g, 0, -8, 28, 9, '#7fd0e0'); el(g, -6, -10, 12, 3.5, '#c8f4ff');
      rc(g, -3, -30, 6, 22, PIERRE); el(g, 0, -30, 12, 4, PIERRE2); el(g, 0, -32, 12, 4, PIERRE);
      g.strokeStyle = '#f6f8f4'; g.lineCap = 'round'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -32); g.lineTo(0, -52); g.stroke(); g.lineWidth = 1.8; [[-10, -62], [10, -64], [-5, -70], [6, -72], [0, -76]].forEach(q => { g.beginPath(); g.moveTo(0, -50); g.quadraticCurveTo(q[0] * 0.3, -58, q[0], q[1]); g.stroke(); });
      [[-11, -64], [11, -66], [-6, -72], [7, -74], [0, -79], [-3, -62], [4, -60]].forEach(q => el(g, q[0], q[1], 3.2, 2.6, '#fbfff4'));
    }
  };
  const TAILLE = { salle: [240, 270], arbre: [150, 250], pavillon: [130, 160], tour: [90, 300], fontaine: [84, 96] }, cache = {};
  function image(k) { if (cache[k]) return cache[k]; const base = k.replace('2', ''), s = TAILLE[base], K = El.ECHELLE, c = document.createElement('canvas'); c.width = Math.ceil(s[0] * K); c.height = Math.ceil(s[1] * K); const g = c.getContext('2d'); g.translate(c.width / 2, c.height - 14 * K); g.scale(K, K); DESSINS[base](g, k !== base); cache[k] = c; return c; }
  // les lueurs qui respirent, par-dessus l'image
  const LUEURS = { salle: [[0, -44, 22], [-70, -112, 9], [70, -112, 9], [0, -226, 9]], arbre: [[-38, -67, 11], [38, -67, 11], [-9, -104, 9]], pavillon: [[-51, -44, 11], [0, -30, 15]], tour: [[0, -20, 12], [0, -174, 11], [0, -284, 8]], fontaine: [[0, -70, 16]] };
  const maison = { draw(g, o, t) {
    const m = o.m, im = image(m.k), base = m.k.replace('2', ''), K = El.ECHELLE; g.drawImage(im, Math.round(o.x - im.width / 2), Math.round(o.y - im.height + 14 * K));
    const b = 0.5 + 0.5 * Math.sin(t * 1.6 + m.tx); g.save(); g.globalCompositeOperation = 'lighter';
    for (const q0 of LUEURS[base]) { const q = [q0[0] * K, q0[1] * K, q0[2] * K]; g.globalAlpha = 0.06 + 0.05 * b; el(g, o.x + q[0], o.y + q[1], q[2] * 1.7, q[2] * 1.7, base === 'tour' ? '#b8a8ff' : base === 'fontaine' ? '#c8f4ff' : LUEUR); g.globalAlpha = 0.1 + 0.07 * b; el(g, o.x + q[0], o.y + q[1], q[2], q[2], base === 'tour' ? '#d8ccff' : LUEUR); }
    g.restore();
    if (base === 'fontaine') { g.fillStyle = 'rgba(220,250,255,0.8)'; for (let i = 0; i < 4; i++) { const k = (t * 0.9 + i * 0.25) % 1; g.fillRect(o.x + (-9 + i * 6) * K, o.y + (-30 + k * 20) * K, 2, 5); } }
  } };
  const habitant = { draw(g, o, t) { Art.visitor(g, o.v, t); } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) {
    po0.apply(this, arguments); const R = CG.R; if (!W.elfes || !R) return;
    for (const m of El.MAISONS) { const x = (m.tx + m.w / 2) * T, y = (m.ty + 1) * T; if (CG.onScreen(x, y) || CG.onScreen(x, y - 200) || CG.onScreen(x, y - 390) || CG.onScreen(x - 170, y - 100) || CG.onScreen(x + 170, y - 100) || CG.onScreen(x - 170, y - 300) || CG.onScreen(x + 170, y - 300)) push(y - 2, 21, { x, y, m, draw: maison.draw }, null); }
    for (const v of R.elfesV || []) if (CG.onScreen(v.x, v.y)) push(v.y, 21, { x: v.x, y: v.y, v, draw: habitant.draw }, null);
  }; }
  // les elfes du village et le vieux mage
  { const vis0 = Art.visitor; Art.visitor = function (g, v, t) {
    if (v.look === 'elfeV') return Art.humanoid(g, { x: v.x, y: v.y, face: v.face, t: t + (v.seed || 0), moving: false, step: 0, skin: '#f4dcc0', tunic: v.tunic || '#3f8a5a', legs: '#2a4a3a', s: 1.14, hair: v.hair || '#f0e090', longHair: true, ears: true, robe: !v.armure, armor: !!v.armure, cape: v.armure ? '#2f6670' : undefined, glow: v.glow || '#7dff8a' });
    if (v.look !== 'mageV') return vis0.apply(this, arguments);
    const s = 1.16, f = v.face < 0 ? -1 : 1, bob = Math.sin((t + (v.seed || 0)) * 2.4) * 0.6;
    Art.humanoid(g, { x: v.x, y: v.y, face: v.face, t: t + (v.seed || 0), moving: false, step: 0, skin: '#f0d2b4', tunic: '#8e97ac', sleeve: '#7c8598', legs: '#565c6c', s, robe: true });
    g.save(); g.translate(v.x, v.y); g.scale(f * s, s); g.translate(0, -bob);
    poly(g, [-5.5, -33, 6.5, -33, 4, -22, 1.5, -13, -1, -22], '#f4f4ee'); poly(g, [0, -33, 6.5, -33, 4, -22, 1.5, -13], '#dcdcd6'); // la longue barbe
    el(g, 0.5, -44.5, 14, 3.4, '#6c7690'); poly(g, [-8, -45, 9, -45, 4, -60, -4, -72, -1, -58], '#7f89a4'); poly(g, [2, -45, 9, -45, 4, -60, -4, -72, 1, -58], '#6c7690'); rc(g, -7.5, -48.5, 16, 2.4, '#c8b060'); // le chapeau pointu, un peu tordu
    g.strokeStyle = '#8a6a44'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(13, 0); g.lineTo(12, -50); g.stroke(); el(g, 12, -54, 4.2, 4.8, '#bfe8ff'); el(g, 11, -55.5, 1.6, 2, '#ffffff'); // le bâton et son cristal
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 + 0.12 * Math.sin(t * 2); el(g, 12, -54, 9, 9, '#9ad0ff'); g.restore();
  }; }
})(window.CG);
