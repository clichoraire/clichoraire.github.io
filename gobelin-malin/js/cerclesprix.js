// Goblin Malin — le grimoire remis en ordre.
//   1) Les neuf cercles : chaque sort a son cercle écrit ici (CERCLE), du 1er (les premiers mots) au 9e (la magie des dieux).
//   2) Le prix d'un parchemin dépend de son cercle (PRIX : de tant à tant de pièces d'or), et son mana aussi (MANA) :
//      les petits cercles coûtent peu, les grands coûtent cher.
//   3) Tous les sorts ont trois niveaux (I, II, III). Ceux de niveaux.js gardent les leurs ; les autres reçoivent les leurs ici (T).
//      Parchemin de niveau II : au moins 3 fois le prix du sort. Niveau III : 10 000 pièces d'or et plus.
//   4) Dans la cité des elfes, le vieux mage vend le niveau II des sorts qu'on connaît, de n'importe quel cercle.
// Chargé après tous les sorts. Tout se règle dans CG.CerclesPrix.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Nv = CG.Niveaux, M = CG.Magie, SP = CG.SPELLS; if (!Nv || !M) return;
  const Cp = CG.CerclesPrix = {
    PRIX: [null, [200, 500], [400, 700], [600, 900], [800, 1200], [1100, 1400], [1300, 1600], [1500, 1800], [1700, 2000], [2500, 3500]],
    MANA: [null, [3, 5], [5, 8], [7, 10], [9, 12], [11, 15], [14, 18], [16, 22], [20, 28], [30, 40]],
    NIV2: 3, NIV3: [8, 10000], /* un parchemin de niveau II vaut 3 fois le sort ; un niveau III, 8 fois et jamais moins de 10 000 */
    CERCLE: {
      etincelle: 1, maladroit: 1, tetevide: 1, faiblesse: 1, vision: 1, caboche: 1, venin: 1, fleche: 1,
      frenesie: 2, ruse: 2, murpierre: 2, antidote: 2, bouclier: 2, feu: 2, glace: 2, ombres: 2, paralysie: 2, racines: 2, verglas: 2,
      coffrepiege: 3, flair: 3, protec: 3, force: 3, cri: 3, cigogne: 3, eclair: 3, faucon: 3, metaSquelette: 3, repousse: 3,
      murfeu: 4, invisible: 4, teleport: 4, coeur: 4, parefeu: 4, sommeil: 4, onde: 4, soin: 4, retour: 4, bombe: 4, invoc: 4, inv_squelette: 4,
      hate: 5, armFeu: 5, armGlace: 5, armPoison: 5, armRonces: 5, armVent: 5, bestiole: 5, electro: 5, metaLoup: 5, miroir: 5, inv_chevalier: 5, passe: 5, poison: 5,
      mondes: 6, charme: 6, hatetemps: 6, illusion: 6, meteore: 6, lames: 6, murpoison: 6, inv_eau: 6, inv_feu: 6, inv_terre: 6,
      golem: 7, metaOurs: 7, vampmana: 7, seisme: 7, inv_air: 7,
      metaDemon: 8, rayon: 8, temps: 8, inv_demon: 8,
      resurrection: 9, rayons: 9
    },
    FIXE: { teleport: { mp: 20 } } /* la Téléportation coûte cher au niveau I (elle baisse en montant) ; le Passage entre les mondes ne se vend pas */
  };
  const base = id => (SP[id] && SP[id].amelio ? SP[id].amelio.base : id);
  // ---------- 1) les cercles ----------
  Cp.cercle = id => Cp.CERCLE[base(id)] || 0;
  // ---------- 2) prix et mana, rangés dans la fourchette de leur cercle (du moins cher au plus cher, comme avant) ----------
  { const par = {}; Object.keys(Cp.CERCLE).forEach(id => { if (SP[id]) (par[Cp.CERCLE[id]] = par[Cp.CERCLE[id]] || []).push(id); });
    Object.keys(par).forEach(c => { const l = par[c], P = Cp.PRIX[c], Mn = Cp.MANA[c], place = (ids, cle) => { const o = ids.slice().sort((a, b) => (SP[a][cle] || 0) - (SP[b][cle] || 0) || (a < b ? -1 : 1)), r = {}; o.forEach((id, i) => { r[id] = o.length > 1 ? i / (o.length - 1) : 0.5; }); return r; };
      const kp = place(l, 'prix'), km = place(l, 'mp');
      l.forEach(id => { const F = Cp.FIXE[id] || {}; SP[id].prix = F.prix !== undefined ? F.prix : Math.round((P[0] + (P[1] - P[0]) * kp[id]) / 50) * 50; SP[id].mp = F.mp !== undefined ? F.mp : Math.round(Mn[0] + (Mn[1] - Mn[0]) * km[id]); }); }); }
  // ---------- 3) trois niveaux pour tous ----------
  const CHIF = ['', '', ' II', ' III'], niv = b => Nv.niv(b);
  const MOINS = ['Coûte un quart de mana en moins.', 'Coûte moitié moins de mana.'], LONG = ['Dure bien plus longtemps.', 'Dure encore plus longtemps : plus du double.'];
  Cp.T = {
    caboche: ['La tête grossit comme avant, et tout le monde rit plus fort : plus de moral et de joie.', 'Une tête énorme ! Tout le clan est plié de rire : encore plus de moral, et les rieurs travaillent le cœur léger.'],
    teleport: ['Tu vas plus loin (6 à 7 cases), pour moins de mana.', 'Tu vas très loin (9 cases), pour moitié moins de mana, et tu arrives dans un souffle qui bouscule les monstres.'],
    hate: LONG, vision: ['Dure 75 secondes.', 'Dure 3 minutes.'], cri: LONG, invisible: LONG, sommeil: ['Le sommeil dure moitié plus.', 'Le sommeil dure plus du double.'], charme: ['Le charme tient bien plus longtemps.', 'Le charme tient plus du double du temps.'],
    ombres: ['Tu vois plus loin dans l\'ombre, plus longtemps.', 'Tu vois très loin dans l\'ombre, très longtemps.'], onde: ['Le souffle porte plus loin.', 'Le souffle balaie tout, très loin autour de toi.'],
    golem: ['Ton élémentaire reste bien plus longtemps.', 'Ton élémentaire reste plus du double du temps.'], miroir: ['Trois reflets au lieu de deux.', 'Quatre reflets.'],
    temps: LONG, hatetemps: LONG, rayon: ['Le rayon frappe bien plus fort.', 'Le rayon frappe presque deux fois plus fort.'],
    paralysie: ['La paralysie dure moitié plus.', 'La paralysie dure le double.'], bestiole: ['Le maléfice dure moitié plus.', 'Le maléfice dure bien plus du double.'], fleche: ['La flèche frappe moitié plus fort.', 'La flèche frappe deux fois plus fort.'],
    armFeu: LONG, armGlace: LONG, armPoison: LONG, armRonces: LONG, armVent: LONG, metaSquelette: LONG, metaLoup: LONG, metaOurs: LONG, metaDemon: LONG,
    resurrection: ['Ramener quelqu\'un coûte un quart de mana en moins.', 'Ramener quelqu\'un coûte moitié moins de mana.']
  };
  if (CG.SortsFaibles) Object.assign(Cp.T, CG.SortsFaibles.T); if (CG.SortsNeufs) Object.assign(Cp.T, CG.SortsNeufs.T); if (CG.SortsSept) Object.assign(Cp.T, CG.SortsSept.T);
  Object.keys(Cp.CERCLE).forEach(id => { if (SP[id] && !Nv.T[id] && !Cp.T[id]) Cp.T[id] = MOINS; }); // les autres : moins de mana
  Object.keys(Cp.T).forEach(b => { const sp = SP[b]; if (!sp || Nv.T[b]) return; Nv.T[b] = Cp.T[b]; Nv.BASE[b] = { nom: sp.nom, desc: sp.desc };
    [2, 3].forEach(n => { SP[b + '_' + n] = { nom: sp.nom + CHIF[n], icon: sp.icon, mp: sp.mp, prix: 0, color: sp.color, desc: 'Amélioration du sort ' + sp.nom + ' : ' + Nv.T[b][n - 2] + ' Il remplace l\'ancien dans ton grimoire.', amelio: { base: b, n } }; if (CG.Effets && CG.Effets.FICHE && CG.Effets.FICHE[b]) CG.Effets.FICHE[b + '_' + n] = CG.Effets.FICHE[b]; }); });
  Object.keys(Nv.BASE).forEach(b => { const sp = SP[b]; [2, 3].forEach(n => { const q = SP[b + '_' + n]; if (!q) return; q.mp = sp.mp; q.prix = n === 2 ? Math.round(sp.prix * Cp.NIV2 / 50) * 50 : Math.max(Cp.NIV3[1], Math.round(sp.prix * Cp.NIV3[0] / 500) * 500); }); });
  // ce que les niveaux changent vraiment. K : [niveau I, II, III]
  const levier = (o, cle, b, K) => { if (!o || typeof o[cle] !== 'number') return; const v0 = o[cle]; Object.defineProperty(o, cle, { get: () => v0 * K[Math.min(3, niv(b)) - 1], set: () => { }, configurable: true }); };
  levier(M, 'HASTE', 'hate', [1, 1.6, 2.4]); levier(M, 'SLEEP', 'sommeil', [1, 1.5, 2.2]); levier(M, 'INVIS', 'invisible', [1, 1.5, 2.2]); levier(M, 'CHARM', 'charme', [1, 1.6, 2.5]); levier(M, 'PUSH_R', 'onde', [1, 1.3, 1.6]); levier(M, 'GOLEM_T', 'golem', [1, 1.5, 2.2]);
  if (CG.Ombre && CG.Ombre.SORT) { levier(CG.Ombre.SORT, 'dur', 'ombres', [1, 1.6, 2.4]); levier(CG.Ombre.SORT, 'rayon', 'ombres', [1, 1.3, 1.7]); }
  if (CG.Miroir) { const v0 = CG.Miroir.NB; Object.defineProperty(CG.Miroir, 'NB', { get: () => v0 + niv('miroir') - 1, set: () => { }, configurable: true }); }
  if (CG.Temps) { levier(CG.Temps.LENT, 'dur', 'temps', [1, 1.5, 2.2]); levier(CG.Temps.VITE, 'dur', 'hatetemps', [1, 1.5, 2.2]); }
  if (CG.Sorts3) { levier(CG.Sorts3, 'RAYON_DMG', 'rayon', [1, 1.4, 1.9]); levier(CG.Sorts3, 'PARA', 'paralysie', [1, 1.5, 2]); levier(CG.Sorts3, 'BETE', 'bestiole', [1, 1.5, 2.5]); levier(CG.Sorts3, 'FLECHE', 'fleche', [1, 1.5, 2]); }
  if (CG.Sorts2 && CG.Sorts2.TP) { const v0 = CG.Sorts2.TP.cases; Object.defineProperty(CG.Sorts2.TP, 'cases', { get: () => [v0, 6.5, 9][Math.min(3, niv('teleport')) - 1], set: () => { }, configurable: true }); }
  if (CG.Sorts2 && CG.Sorts2.cout) { const c0 = CG.Sorts2.cout; CG.Sorts2.cout = function () { return Math.ceil(c0.apply(this, arguments) * [1, 0.75, 0.5][Math.min(3, niv('resurrection')) - 1]); }; }
  // les sorts dont la durée est un réglage partagé (manteaux, métamorphoses) : on l'allonge le temps de lancer le sort
  const TEMPO = {}; ['armFeu', 'armGlace', 'armPoison', 'armRonces', 'armVent'].forEach(id => { TEMPO[id] = [CG.Elements, 'DUR', [1, 1.6, 2.4]]; }); ['metaSquelette', 'metaLoup', 'metaOurs', 'metaDemon'].forEach(id => { TEMPO[id] = [CG.Meta, 'DUREE', [1, 1.5, 2.1]]; });
  // le mana : les sorts « moins de mana » baissent ; la Téléportation aussi ; les autres gardent la règle de niveaux.js (un peu plus cher à chaque niveau)
  const RABAIS = {}; Object.keys(Cp.T).forEach(b => { if (Cp.T[b] === MOINS) RABAIS[b] = [1, 0.75, 0.5]; }); RABAIS.teleport = [1, 0.7, 0.5];
  { const sc0 = G.spellCost; G.spellCost = function (id) { const v = sc0.apply(this, arguments), n = Math.min(3, niv(id)); return RABAIS[id] && n > 1 ? Math.max(1, Math.ceil(v / (1 + 0.15 * (n - 1)) * RABAIS[id][n - 1])) : v; }; }
  { const ca0 = G.cast; G.cast = function (id) {
    const S = CG.S, R = CG.R; if (!S || !R) return ca0.apply(this, arguments); const p = S.player, n = Math.min(3, niv(id)), q = TEMPO[id], v0 = { vision: R.vision || 0, cri: R.cri || 0, x: p.x, y: p.y, moral: S.morale };
    let r; if (q && q[0] && n > 1) { const o = q[0], k = q[1], d = Object.getOwnPropertyDescriptor(o, k), val = o[k]; Object.defineProperty(o, k, { value: val * q[2][n - 1], writable: true, configurable: true }); try { r = ca0.apply(this, arguments); } finally { if (d) Object.defineProperty(o, k, d); else o[k] = val; } } else r = ca0.apply(this, arguments);
    if (n > 1 && CG.R === R) {
      if (id === 'vision' && R.vision > v0.vision) R.vision = [30, 75, 180][n - 1];
      if (id === 'cri' && R.cri > v0.cri) R.cri *= [1, 1.5, 2.2][n - 1];
      if (id === 'teleport' && n === 3 && (p.x !== v0.x || p.y !== v0.y)) { for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d > 95) continue; e.kb = { vx: dx / d * 420, vy: dy / d * 420, t: 0.3 }; e.path = null; G.hurtEnemy(e, 4 + p.lvl, p); } R.rings.push({ x: p.x, y: p.y - 6, r: 95, life: 0.4, col: '#9fd0ff' }); }
    }
    if (id === 'caboche' && CG.R === R) { const g = S.goblins.filter(o => o.bigT > 0).sort((a, b) => b.bigT - a.bigT)[0]; if (g && g.bigT > M.CABOCHE - 0.5) { g.bigNiv = n; if (n > 1 && S.morale >= v0.moral) { S.morale = Math.min(100, S.morale + (n - 1)); for (const o of S.goblins) if (!o.hidden && Math.hypot(o.x - g.x, o.y - g.y) < 260) o.pep = Math.max(o.pep || 0, n === 3 ? 60 : 30); } } }
    return r;
  }; }
  // la grosse caboche : petite au niveau I, comme avant au II, énorme au III
  { const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); const S = CG.S; if (!S || !S.goblins) return; for (const g of S.goblins) if (g.bigT > 0 && g.bigK > 1) g.bigK = 1 + (g.bigK - 1) * [0.6, 1, 1.5][(g.bigNiv || 1) - 1]; }; }
  if (Nv.rafraichir) { const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); try { Nv.rafraichir(); } catch (e) { /* rien */ } return r; }; }
  // ---------- 4) chez les elfes : le niveau II des sorts qu'on connaît ----------
  Cp.elfes = function () { const p = CG.S.player; return Object.keys(Nv.BASE).filter(b => p.spells.includes(b) && niv(b) === 1 && SP[b + '_2'] && SP[b].prix > 0 && !p.scrolls[b + '_2']).sort((a, b) => Cp.cercle(a) - Cp.cercle(b) || SP[a].prix - SP[b].prix)
    .map(b => { const id = b + '_2', sp = SP[id]; return { scroll: id, icon: '📜', label: 'Parchemin : ' + sp.nom, desc: 'Cercle ' + Cp.cercle(b) + ' · ' + Nv.T[b][0], prix: sp.prix, stock: 1 }; }); };
})(window.CG);
