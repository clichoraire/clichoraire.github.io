// Goblin Malin — sept magies de plus, pour les grands cercles.
//   4e cercle : Invocation (une créature se bat avec toi ; le parchemin donne la plus petite, le slime, et d'autres parchemins
//               « Invocation : ... » ajoutent les suivantes, jusqu'au grand démon. Avec plusieurs créatures, on choisit en lançant).
//   6e cercle : Esprit des lames (un tourbillon de lames posé au sol, qui fonce sur les ennemis), Mur de poison (comme le mur
//               de feu, mais il empoisonne), et le Passage entre les mondes, qui avale le Retour au village : en plus des
//               portails vers tes villages, on marque des runes (achetées aux elfes) et on s'y téléporte.
//   7e cercle : Vampire de mana (un fantôme boit la magie des monstres et te la rapporte), Séisme (tout tremble : les monstres
//               ne bougent plus et n'attaquent plus, puis ils encaissent quand ça s'arrête).
//   9e cercle : Rayons tournants (des rayons partent de toi et tournent tout seuls pendant que tu fais autre chose).
// Chacun a ses trois niveaux. Chargé juste avant cerclesprix.js. Tout se règle dans CG.SortsSept.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, UI = CG.UI, M = CG.Magie, SP = CG.SPELLS, Art = CG.Art, Mo = CG.Mondes, TAU = Math.PI * 2, rand = CG.rand, dist = CG.dist;
  const S7 = CG.SortsSept = {
    LAMES: { dur: [18, 24, 30], vit: 215, cd: 0.3, rayon: 38, dmg: [0.55, 0.75, 1], vie: [40, 60, 90], voit: 430 },
    MURP: { dur: [10, 13, 16], demi: 120, dmg: [0.45, 0.6, 0.8], venin: [6, 8, 10], dps: [0.5, 0.7, 1] },
    RUNES: { prix: 450, stock: 3 },
    VAMP: { dur: [14, 18, 24], vit: 235, boit: 1.1, gain: [5, 7, 9], max: [40, 60, 90], voit: 470 },
    SEISME: { dur: [4, 5, 6.5], rayon: 900, dmg: [1.6, 2.2, 3] },
    RAYONS: { dur: [5, 6, 7], nb: [4, 6, 8], long: 230, tour: 2.2, dmg: [0.9, 1.1, 1.3], tic: 0.2, large: 16 },
    INVOC: { dur: [60, 80, 110], k: [1, 1.3, 1.7], CHANCE: 0.18, ORDRE: ['slime', 'squelette', 'chevalier', 'eau', 'feu', 'terre', 'air', 'demon'],
      B: { /* mana : ce que la créature coûte, en parts du sort ; vie, dmg : de base, avant le niveau du chef */
        slime: { nom: 'Slime', ic: '🟢', type: 'gelee', vie: 45, dmg: 4, vit: 85, cd: 1.1, mana: 1, don: 'il colle aux pattes : sa cible ralentit' },
        squelette: { nom: 'Squelette', ic: '💀', type: 'squelette', vie: 60, dmg: 7, vit: 120, cd: 0.95, mana: 1.2, don: 'un bon petit soldat' },
        chevalier: { nom: 'Chevalier squelette', ic: '🛡️', type: 'chevalier?', vie: 120, dmg: 10, vit: 100, cd: 1.1, mana: 1.5, armure: 0.6, don: 'son armure encaisse presque la moitié des coups' },
        eau: { nom: 'Élémentaire d\'eau', ic: '💧', col: ['#5ab8ff', '#d0ecff', '#2a78d0'], vie: 90, dmg: 8, vit: 115, cd: 1, mana: 1.7, soin: 2, don: 'chacun de ses coups te rend un peu de vie' },
        feu: { nom: 'Élémentaire de feu', ic: '🔥', col: ['#ff7a2a', '#ffe36b', '#d8301a'], vie: 80, dmg: 12, vit: 120, cd: 1, mana: 1.8, brule: true, don: 'ses coups mettent le feu' },
        terre: { nom: 'Élémentaire de terre', ic: '🪨', vie: 190, dmg: 11, vit: 72, cd: 1.3, mana: 1.9, sonne: 0.6, don: 'lent mais très solide, ses coups sonnent' },
        air: { nom: 'Élémentaire d\'air', ic: '🌪️', col: ['#d8f0ff', '#ffffff', '#9ac8e8'], vie: 70, dmg: 6, vit: 205, cd: 0.5, mana: 2, don: 'très rapide, il frappe sans arrêt' },
        demon: { nom: 'Grand démon', ic: '👹', type: 'seigneur', vie: 280, dmg: 22, vit: 115, cd: 1.2, mana: 3, souffle: 4, don: 'le plus fort de tous : un coup sur quatre explose' } } }
  };
  const IV = S7.INVOC, PARCH = k => 'inv_' + k;
  const def = (id, nom, icon, color, desc, pool) => { SP[id] = { nom, icon, mp: 12, prix: 1000, color, desc }; if (pool !== false && !CG.SCROLL_POOL.includes(id)) CG.SCROLL_POOL.push(id); };
  def('lames', 'Esprit des lames', '🌀', '#c8d4e8', 'Un tourbillon de lames apparaît au sol et fonce tout seul sur les ennemis pour les taillader. Il disparaît au bout d\'un moment, ou s\'il prend trop de coups.');
  def('murpoison', 'Mur de poison', '☣️', '#6fe03a', 'Un mur de vapeurs vertes en travers du chemin. Ceux qui le traversent sont blessés et restent empoisonnés un bon moment.');
  def('vampmana', 'Vampire de mana', '👻', '#9ab6ff', 'Un petit fantôme bleu vole de monstre en monstre pour boire leur magie, puis revient te donner tout le mana qu\'il a pris.');
  def('seisme', 'Séisme', '🌋', '#c9a56b', 'La terre tremble ! Tant que ça secoue, les monstres ne peuvent ni bouger ni attaquer. Toi, tu fais ce que tu veux. Quand le séisme s\'arrête, tous les monstres sont blessés.');
  def('rayons', 'Rayons tournants', '✴️', '#ffe36b', 'Des rayons de lumière partent de toi et tournent tout seuls pendant quelques secondes : ils brûlent fort tous les monstres qu\'ils balaient. Pendant ce temps, tu peux faire autre chose.');
  def('invoc', 'Invocation', '🐾', '#c8a0ff', 'Tu appelles une créature qui se bat à tes côtés. Ce parchemin t\'apprend la plus petite : le slime. D\'autres parchemins d\'invocation t\'en apprendront de plus fortes.');
  IV.ORDRE.slice(1).forEach(k => { const b = IV.B[k]; def(PARCH(k), 'Invocation : ' + b.nom, b.ic, '#c8a0ff', 'Ajoute une créature à ton sort Invocation : ' + b.nom.charAt(0).toLowerCase() + b.nom.slice(1) + ' (' + b.don + ').', false); });
  S7.T = {
    lames: ['Des lames plus tranchantes, qui tiennent plus longtemps.', 'Des lames terribles, très solides, qui restent encore plus longtemps.'],
    murpoison: ['Un poison plus fort, un mur qui dure plus longtemps.', 'Un poison terrible : le mur dure encore plus longtemps et le venin aussi.'],
    vampmana: ['Le fantôme boit plus, plus longtemps.', 'Le fantôme boit beaucoup plus et rapporte bien plus de mana.'],
    seisme: ['La terre tremble plus longtemps et frappe plus fort.', 'Un séisme interminable, qui frappe très fort à la fin.'],
    rayons: ['Six rayons au lieu de quatre, plus longtemps.', 'Huit rayons, encore plus longtemps.'],
    invoc: ['Tes créatures sont plus fortes et restent plus longtemps.', 'Tes créatures sont bien plus fortes et restent très longtemps.'],
    mondes: ['Coûte un quart de mana en moins.', 'Coûte moitié moins de mana.']
  };
  IV.ORDRE.slice(1).forEach(k => { S7.T[PARCH(k)] = ['—', '—']; });
  const niv = id => (CG.Niveaux && CG.Niveaux.niv ? Math.min(3, CG.Niveaux.niv(id)) : 1);
  const MIENS = ['lames', 'murpoison', 'vampmana', 'seisme', 'rayons', 'invoc'];
  if (Mo && Mo.GLOBAL) ['runes'].forEach(k => { if (!Mo.GLOBAL.includes(k)) Mo.GLOBAL.push(k); });
  const base = () => { const p = CG.S.player; return (6 + p.lvl * 1.6) * (G.tech('s4') ? 1.25 : 1); };
  const vivant = e => !e.dead && !e.struct && !(e.charm > 0);
  const liste = () => CG.R.sept || (CG.R.sept = []);
  const poisonCol = () => (CG.DMG ? CG.DMG.poison : '#6fe03a');
  function frapperVert(e, dmg) { const R = CG.R, c0 = R.dmgCol; R.dmgCol = poisonCol(); try { G.hurtEnemy(e, dmg, CG.S.player); } finally { R.dmgCol = c0; } }

  // ---------- les serviteurs (lames, invocations) ----------
  function effacer(s, tue) { s.dead = true; G.puff(s.x, s.y - 18, s.col || '#c8a0ff', 18, 130, 4); if (tue) { G.text(s.x, s.y - 60, s.k === 'lames' ? 'Brisées !' : s.nom + ' tombe !', '#e0d0ff', true); if (CG.onScreen(s.x, s.y)) CG.sfx('die'); } }
  { const h0 = M.hurt; M.hurt = function (s, dmg) { if (!s || !s.sept) return h0.apply(this, arguments); if (s.dead) return; dmg = Math.max(1, Math.round(dmg * (s.armure || 1))); s.hp -= dmg; s.flash = 0.18; G.text(s.x, s.y - 56, '-' + dmg, '#e0d0ff'); if (s.hp <= 0) effacer(s, true); }; }
  function poser(o) { const R = CG.R, p = CG.S.player, d = R.dir && (R.dir.x || R.dir.y) ? R.dir : { x: p.face < 0 ? -1 : 1, y: 0 }, L = Math.hypot(d.x, d.y) || 1; let x = p.x + d.x / L * 46, y = p.y + d.y / L * 46 + 6; if (!W.walkPx(x, y)) { x = p.x; y = p.y + 6; }
    const s = Object.assign({ summon: true, sept: true, id: -120 - liste().length, x, y, r: 13, age: 0, face: p.face || 1, step: 0, moving: false, atkCd: 0.5, atkAnim: 0, repath: 0, path: null, seek: 0, tg: null, dx: 0, dy: 1, seed: Math.random() * 10, coups: 0 }, o); s.maxhp = s.hp;
    liste().push(s); G.unstick(s, 11); G.puff(s.x, s.y - 16, s.col || '#c8a0ff', 20, 140, 4); for (let i = 0; i < 2; i++) R.rings.push({ x: s.x, y: s.y - 4, r: 40 + i * 30, life: 0.4 + i * 0.15, col: s.col || '#c8a0ff' }); return s; }
  function pas(s, dt) {
    const S = CG.S, R = CG.R, p = S.player; s.age += dt; s.t -= dt; s.atkCd -= dt; s.seek -= dt; if (s.atkAnim > 0) s.atkAnim -= dt * 3.5; if (s.flash > 0) s.flash -= dt; s.moving = false;
    if (s.t <= 0) return effacer(s, false); if (s.age < 0.4) return;
    if (s.tg && (!vivant(s.tg) || dist(s, s.tg) > s.voit + 80 || !R.enemies.includes(s.tg))) s.tg = null;
    if (s.seek <= 0) { s.seek = 0.4; let b = null, bd = 1e9; for (const e of R.enemies) { if (!vivant(e) || e.calm) continue; const d = dist(e, s); if ((d < s.voit || (s.k !== 'lames' && dist(e, p) < 230)) && d < bd) { bd = d; b = e; } } s.tg = b; }
    const x0 = s.x, y0 = s.y, tg = s.tg;
    if (s.k === 'lames') { // il fonce, et taillade tout ce qu'il touche
      if (tg) { if (dist(s, tg) > 14) G.chase(s, tg.x, tg.y + 2, s.vit, dt); } else if (dist(s, p) > 300) G.chase(s, p.x, p.y + 20, s.vit * 0.7, dt);
      if (s.atkCd <= 0) { let n = 0; for (const e of R.enemies) if (vivant(e) && Math.hypot(e.x - s.x, e.y - s.y) < S7.LAMES.rayon + (e.r || 12)) { G.hurtEnemy(e, s.dmg, s); n++; } if (n) { s.atkCd = S7.LAMES.cd; s.atkAnim = 1; if (CG.onScreen(s.x, s.y) && Math.random() < 0.4) CG.sfx('swing'); } }
    } else if (tg) { const d = dist(s, tg); s.face = tg.x > s.x ? 1 : -1;
      if (d > 26 + (tg.r || 12)) G.chase(s, tg.x, tg.y + 2, s.vit, dt);
      else if (s.atkCd <= 0) { s.atkCd = s.cd; s.atkAnim = 1; s.coups++; G.hurtEnemy(tg, s.dmg, s);
        if (s.colle) tg.slow = Math.max(tg.slow || 0, 1.6); if (s.soin && p.hp < p.maxhp) { p.hp = Math.min(p.maxhp, p.hp + s.soin); G.text(p.x, p.y - 58, '+' + s.soin, '#8dffb0'); }
        if (s.brule && CG.Elements && CG.Elements.bruler) CG.Elements.bruler(tg); if (s.sonne && !(CG.ENEMIES[tg.type] || {}).boss) tg.rooted = Math.max(tg.rooted || 0, s.sonne);
        if (s.souffle && s.coups % s.souffle === 0) { G.blast(tg.x, tg.y - 10, 80, s.dmg * 1.2, '#ff5a2a'); G.text(s.x, s.y - 84, '👹 GRAAH !', '#ffb080', true); } } }
    else { const gx = p.x - (p.face || 1) * 44, gy = p.y + 14, d = Math.hypot(gx - s.x, gy - s.y); if (dist(s, p) > 620) { s.x = gx; s.y = gy; s.path = null; G.unstick(s, 11); } else if (d > 26) G.chase(s, gx, gy, Math.max(s.vit, 150) * (d > 170 ? 1.5 : 1), dt); else s.face = p.face || 1; }
    const mx = s.x - x0, my = s.y - y0; if (Math.abs(mx) + Math.abs(my) > 0.2) { s.dx = mx; s.dy = my; s.moving = true; s.step += dt * 9; if (Math.abs(mx) > 0.3) s.face = mx > 0 ? 1 : -1; }
  }

  // ---------- Invocation : les créatures connues ----------
  const connues = () => { const p = CG.S.player, c = p.invocs || (p.invocs = {}); return IV.ORDRE.filter(k => k === 'slime' || c[k]); };
  S7.connues = connues;
  S7.apprendre = function (k) { const p = CG.S.player, b = IV.B[k]; if (!b || k === 'slime') return false; (p.invocs || (p.invocs = {}))[k] = true; if (CG.R) G.banner('Nouvelle invocation !', b.ic + ' ' + b.nom + ' : lance Invocation pour l\'appeler.', '#e0c8ff'); CG.sfx('level'); return true; };
  // un parchemin « Invocation : ... » copié dans le grimoire devient une créature de plus (il ne prend pas de page)
  function ranger() { const p = CG.S.player; for (let i = p.spells.length - 1; i >= 0; i--) { const m = /^inv_(\w+?)(?:_\d)?$/.exec(p.spells[i]); if (!m) continue; const id = p.spells[i]; p.spells.splice(i, 1); if (CG.Barre && CG.Barre.cases) { const C = CG.Barre.cases(); for (let j = 0; j < C.length; j++) if (C[j] === id) C[j] = null; } S7.apprendre(m[1]); if (!p.spells.includes('invoc')) p.spells.push('invoc'); } }
  { const ns0 = G.newScroll; G.newScroll = function () { const id = ns0.apply(this, arguments); try { const p = CG.S.player; if (id && p.spells.includes('invoc') && Math.random() < IV.CHANCE) { const k = IV.ORDRE.find(q => q !== 'slime' && !(p.invocs && p.invocs[q]) && !p.scrolls[PARCH(q)]); if (k) return PARCH(k); } } catch (e) { /* rien */ } return id; }; }
  function coutInvoc(k) { return Math.ceil(G.spellCost('invoc') * IV.B[k].mana); }
  function invoquer(k) {
    const S = CG.S, R = CG.R, p = S.player, b = IV.B[k], n = niv('invoc'), c = coutInvoc(k); if (p.mp < c) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= c; R.castCd = 0.5; R.castAnim = 1; CG.sfx('spell'); liste().forEach(s => { if (s.k === 'invoc' && !s.dead) effacer(s, false); });
    const m = (1 + 0.12 * (p.lvl - 1)) * IV.k[n - 1], type = b.type === 'chevalier?' ? (Object.keys(CG.ENEMIES).find(q => CG.ENEMIES[q].race === 'mort' && /chevalier/i.test(CG.ENEMIES[q].nom || '')) || 'squelette') : b.type;
    poser({ k: 'invoc', esp: k, nom: b.nom, type, pal: b.col, col: b.col ? b.col[0] : '#c8a0ff', hp: Math.round(b.vie * m), dmg: b.dmg * m, vit: b.vit, cd: b.cd, t: IV.dur[n - 1], voit: 300, armure: b.armure, colle: k === 'slime', soin: b.soin, brule: b.brule, sonne: b.sonne, souffle: b.souffle, r: k === 'demon' ? 18 : 13 });
    G.text(p.x, p.y - 70, b.ic + ' ' + b.nom + ' !', '#e0c8ff', true); if (k === 'demon') { CG.sfx('horn'); R.shake = Math.max(R.shake || 0, 0.25); }
  }
  // le petit choix (mêmes cartes que les formes de la Métamorphose)
  let el = null, touche = null;
  function fermer() { if (el) { el.remove(); el = null; } if (touche) { window.removeEventListener('keydown', touche, true); touche = null; } if (UI.modal && UI.modal.name === 'formes') UI.modal = null; }
  function choisir(titre, cartes, prendre) {
    fermer(); el = document.createElement('div'); el.id = 'formes-ui';
    el.innerHTML = '<div class="fo-titre">' + titre + '</div><div class="fo-rang">' + cartes.map((c, i) => '<button class="fo-c' + (c.non ? ' non' : '') + '" data-i="' + i + '" style="--c:' + c.col + ';--i:' + i + '"><u>' + (i + 1) + '</u><i>' + c.ic + '</i><b>' + c.nom + '</b><span>' + c.sub + '</span><em>💧 ' + c.mana + '</em></button>').join('') + '</div><div class="fo-bas">Échap : annuler</div>';
    document.body.appendChild(el); const ok = i => { const c = cartes[i]; if (!c) return; if (c.non) { CG.sfx('no'); return; } fermer(); prendre(c); };
    el.querySelectorAll('.fo-c').forEach(b => { b.onclick = () => ok(+b.dataset.i); }); el.onclick = e => { if (e.target === el) fermer(); };
    touche = e => { const n = +e.key; if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); return fermer(); } if (n >= 1 && n <= cartes.length) { e.stopPropagation(); e.preventDefault(); ok(n - 1); } else if (e.key.length === 1) e.stopPropagation(); };
    window.addEventListener('keydown', touche, true); if (UI.modal && !UI.modal.pauses) UI.close(); UI.modal = { name: 'formes', closable: true, pauses: true };
  }

  // ---------- les runes ----------
  const runes = () => { const S = CG.S; return S.runes || (S.runes = { vierges: 0, l: [] }); };
  S7.runes = runes;
  const enferme = () => (Mo && Mo.ici && Mo.ici() === 2) || (CG.Pyramide && CG.Pyramide.dedans && CG.Pyramide.dedans()) || (CG.Terres && CG.Terres.ici && CG.Terres.ici());
  const mondeNom = m => (Mo && Mo.NOMS && Mo.NOMS[m]) || 'ici';
  function marquer() { const S = CG.S, R = CG.R, p = S.player, Q = runes(), c = G.spellCost('mondes'); if (Q.vierges < 1) return; if (p.mp < c) { CG.sfx('no'); return G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); }
    p.mp -= c; R.castCd = 0.6; R.castAnim = 1; Q.vierges--; Q.l.push({ x: Math.round(p.x), y: Math.round(p.y), m: Mo && Mo.ici ? Mo.ici() : 0, nom: 'Rune ' + (Q.l.length + 1), jour: S.day });
    CG.sfx('spell'); for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 4, r: 30 + i * 26, life: 0.4 + i * 0.15, col: '#7dffea' }); G.puff(p.x, p.y - 10, '#7dffea', 20, 120, 4); G.text(p.x, p.y - 70, '🔷 Rune marquée ici', '#bffff4', true); try { CG.save(); } catch (e) { /* rien */ } }
  function sauter(r) { const S = CG.S, R = CG.R, p = S.player, c = G.spellCost('mondes'); if (R.ko > 0 || R.cine || R.night) return; /* le menu ne s'ouvre que si le sort est prêt */ if (p.mp < c) { CG.sfx('no'); return G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); }
    p.mp -= c; R.castCd = 0.6; R.castAnim = 1; CG.sfx('spell'); G.puff(p.x, p.y - 16, '#7dffea', 26, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 80, life: 0.45, col: '#7dffea' });
    p.x = r.x; p.y = r.y; p.path = null; R.build = null; G.unstick(p, 9); if (R.mount && CG.Monture && CG.Monture.suivre) CG.Monture.suivre();
    G.puff(p.x, p.y - 16, '#7dffea', 26, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 90, life: 0.5, col: '#ffffff' }); G.text(p.x, p.y - 64, '🔷 ' + r.nom, '#bffff4', true); }
  function menuRunes(village) { const Q = runes(), ici = Mo && Mo.ici ? Mo.ici() : 0, opts = [{ label: '🏠 Vers mon village', sub: 'Un portail s\'ouvre à côté de toi', fn: village }];
    Q.l.forEach((r, i) => { const loin = r.m !== ici; opts.push({ label: '🔷 ' + r.nom, sub: loin ? 'Elle est dans ' + mondeNom(r.m) + ' : passe d\'abord par le portail' : 'Marquée le jour ' + r.jour + ' — tu y vas tout de suite', fn: loin ? () => { CG.sfx('no'); UI.toast('🔷 Cette rune est dans ' + mondeNom(r.m) + '. Passe d\'abord par le portail de ton village.'); } : () => sauter(r) }); void i; });
    if (Q.vierges > 0) opts.push({ label: '✍️ Marquer cet endroit', sub: 'Sur une rune vierge (il t\'en reste ' + Q.vierges + ')', fn: marquer });
    opts.push({ label: 'Annuler' });
    UI.dialog({ who: SP.mondes.nom, tag: '🔷 runes', text: 'Où veux-tu aller ?', options: opts }); }
  // les elfes vendent les runes vierges ; plus personne ne vend le Retour au village
  { const sh0 = UI.shop; UI.shop = function (v) { try { if (v && v.shop) { for (let i = v.shop.length - 1; i >= 0; i--) if (v.shop[i].scroll === 'retour') v.shop.splice(i, 1);
      if (v.role === 'elfe' && v.runeVu === undefined) { v.runeVu = true; v.shop.push({ rune: true, icon: '🔷', label: 'Rune vierge', desc: 'Avec ton sort Passage entre les mondes, tu marques un endroit sur la rune. Ensuite, le sort t\'y ramène quand tu veux.', prix: S7.RUNES.prix, stock: S7.RUNES.stock, buy: () => { runes().vierges++; UI.toast('🔷 Une rune vierge de plus (' + runes().vierges + '). Lance le Passage entre les mondes pour la marquer.'); } }); } } } catch (e) { /* jamais bloquant */ } return sh0.apply(this, arguments); }; }
  // le Retour au village n'existe plus à part : c'est le Passage
  if (SP.mondes) { SP.mondes.desc = 'Le sort des voyages. Il ouvre un portail vers ton village (et vers celui de l\'autre monde, si tu en as un). Avec des runes vierges, achetées aux elfes, tu peux aussi marquer un endroit : le sort t\'y ramènera d\'un coup, quand tu veux.'; SP.mondes.court = 'Un portail vers ton village, ou un saut vers une de tes runes.'; if (!CG.SCROLL_POOL.includes('mondes')) CG.SCROLL_POOL.push('mondes'); }
  { const i = CG.SCROLL_POOL.indexOf('retour'); if (i >= 0) CG.SCROLL_POOL.splice(i, 1); }
  { const gs0 = G.giveScroll; G.giveScroll = function (id) { if (id === 'retour') { const p = CG.S.player; arguments[0] = p.spells.includes('mondes') || p.scrolls.mondes ? ((G.newScroll && G.newScroll(true)) || 'mondes') : 'mondes'; } return gs0.apply(this, arguments); }; }
  function fusion() { const p = CG.S.player, i = p.spells.indexOf('retour'); let eu = false;
    if (i >= 0) { p.spells.splice(i, 1); eu = true; if (!p.spells.includes('mondes')) { p.spells.push('mondes'); delete p.scrolls.mondes; } }
    if (p.scrolls && p.scrolls.retour) { delete p.scrolls.retour; if (!p.spells.includes('mondes')) p.scrolls.mondes = 1; }
    if (eu && CG.Barre && CG.Barre.cases) { const C = CG.Barre.cases(), la = C.includes('mondes'); for (let j = 0; j < C.length; j++) if (C[j] === 'retour') { C[j] = la ? null : 'mondes'; } } }

  // ---------- lancer ----------
  const ca0 = G.cast; G.cast = function (id) {
    if (id === 'mondes') { const Q = CG.S && CG.S.runes, moi = this; if (!Q || (!Q.vierges && !Q.l.length) || enferme()) return ca0.apply(this, arguments); const R = CG.R; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night) return; return menuRunes(() => ca0.call(moi, 'mondes')); }
    if (!MIENS.includes(id)) return ca0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return; const cost = G.spellCost(id), n = niv(id), col = SP[id].color;
    const rate = msg => { CG.sfx('no'); G.text(p.x, p.y - 56, msg, col); };
    if (id === 'invoc') { const l = connues(); if (l.length < 2) return invoquer('slime'); return choisir('Qui appelles-tu ?', l.map(k => { const b = IV.B[k], c = coutInvoc(k); return { k, ic: b.ic, nom: b.nom, sub: b.don, mana: c, col: b.col ? b.col[0] : '#c8a0ff', non: p.mp < c }; }), c => invoquer(c.k)); }
    if (p.mp < cost) return rate('Pas assez de mana');
    const payer = () => { p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); R.rings.push({ x: p.x, y: p.y - 8, r: 54, life: 0.4, col }); };
    if (id === 'lames') { payer(); liste().forEach(s => { if (s.k === 'lames' && !s.dead) effacer(s, false); }); const Q = S7.LAMES; poser({ k: 'lames', nom: 'Lames', col: '#c8d4e8', hp: Q.vie[n - 1], dmg: base() * Q.dmg[n - 1], vit: Q.vit, t: Q.dur[n - 1], voit: Q.voit, r: 12, n }); G.text(p.x, p.y - 66, '🌀 Tranchez !', col, true); return; }
    if (id === 'murpoison') { payer(); const Q = S7.MURP, tg = G.nearestEnemy ? G.nearestEnemy(p.x, p.y, 320) : null, dx0 = tg ? tg.x - p.x : R.dir.x, dy0 = tg ? tg.y - p.y : R.dir.y, dl = Math.hypot(dx0, dy0) || 1, ux = dx0 / dl, uy = dy0 / dl, gap = tg ? Math.min(90, Math.max(46, dl * 0.5)) : 80, cx = p.x + ux * gap, cy = p.y + uy * gap, h = Q.demi;
      (R.mursPoison = R.mursPoison || []).push({ x1: cx - uy * h, y1: cy + ux * h, x2: cx + uy * h, y2: cy - ux * h, t: Q.dur[n - 1], max: Q.dur[n - 1], tick: 0, dmg: base() * Q.dmg[n - 1], n, seed: Math.random() * 10 }); if (Math.abs(ux) > 0.1) p.face = ux > 0 ? 1 : -1; CG.sfx('fire'); return; }
    if (id === 'vampmana') { payer(); const Q = S7.VAMP; R.vampM = { x: p.x, y: p.y - 30, t: Q.dur[n - 1], banque: 0, tg: null, bois: 0, n, vus: new Map(), age: 0 }; G.text(p.x, p.y - 66, '👻 Va boire !', col, true); return; }
    if (id === 'seisme') { if (R.seismeS) return rate('La terre tremble déjà'); payer(); const Q = S7.SEISME; R.seismeS = { t: Q.dur[n - 1], dur: Q.dur[n - 1], dmg: base() * Q.dmg[n - 1], n, pouf: 0 }; G.text(p.x, p.y - 74, '🌋 SÉISME !', col, true); CG.sfx('tombe'); CG.sfx('horn'); return; }
    if (id === 'rayons') { payer(); const Q = S7.RAYONS; R.rayonsT = { t: Q.dur[n - 1], dur: Q.dur[n - 1], nb: Q.nb[n - 1], ang: Math.random() * TAU, dmg: base() * Q.dmg[n - 1], tic: 0, n }; G.text(p.x, p.y - 74, '✴️ Rayons !', col, true); CG.sfx('fire'); return; }
  };

  // ---------- chaque instant ----------
  const up0 = G.update; G.update = function (dt) {
    const r0 = up0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S || !R.enemies) return r0; const p = S.player;
    if (R.s7Vu !== S) { R.s7Vu = S; try { fusion(); } catch (e) { /* rien */ } } if (p.spells.some(q => q.charCodeAt(0) === 105 && q.slice(0, 4) === 'inv_')) ranger();
    const L = R.sept; if (L && L.length) { for (const s of L) if (!s.dead) pas(s, dt); if (L.some(s => s.dead)) R.sept = L.filter(s => !s.dead); }
    const MP = R.mursPoison; if (MP && MP.length) { const Q = S7.MURP;
      for (const w of MP) { w.t -= dt; w.tick -= dt; if (w.tick > 0) continue; w.tick = 0.45; const vx = w.x2 - w.x1, vy = w.y2 - w.y1, L2 = vx * vx + vy * vy || 1;
        for (const e of R.enemies) { if (e.dead || e.struct) continue; const k = CG.clamp(((e.x - w.x1) * vx + (e.y - w.y1) * vy) / L2, 0, 1); if (Math.hypot(e.x - (w.x1 + vx * k), e.y - (w.y1 + vy * k)) < 26 + (e.r || 12)) { frapperVert(e, w.dmg); e.veninS = { t: Q.venin[w.n - 1], dps: (2.5 + p.lvl * 0.6) * Q.dps[w.n - 1] * 2, tic: 0.5, n: 1 }; } } }
      R.mursPoison = MP.filter(w => w.t > 0); }
    const V = R.vampM; if (V) { const Q = S7.VAMP; V.t -= dt; V.age += dt; const plein = V.banque >= Q.max[V.n - 1];
      if (V.t <= 0 || plein || V.rentre) { V.rentre = true; V.tg = null; const dx = p.x - V.x, dy = p.y - 26 - V.y, d = Math.hypot(dx, dy) || 1; if (d < 16) { const g = Math.round(V.banque); if (g > 0) { p.mp = Math.min(p.maxmp, p.mp + g); G.text(p.x, p.y - 70, '+' + g + ' mana', '#9ab6ff', true); CG.sfx('heal'); R.rings.push({ x: p.x, y: p.y - 10, r: 60, life: 0.4, col: '#9ab6ff' }); } else G.text(p.x, p.y - 66, 'Rien à boire...', '#9ab6ff'); R.vampM = null; } else { const v = Q.vit * 1.3 * dt; V.x += dx / d * Math.min(v, d); V.y += dy / d * Math.min(v, d); } }
      else { if (V.tg && (!vivant(V.tg) || !R.enemies.includes(V.tg))) V.tg = null;
        if (!V.tg) { let b = null, bd = Q.voit; for (const e of R.enemies) { if (!vivant(e) || (V.vus.get(e) || 0) > R.t) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; b = e; } } V.tg = b; V.bois = 0; }
        const tx = V.tg ? V.tg.x : p.x + Math.cos(V.age * 1.6) * 46, ty = V.tg ? V.tg.y - 34 : p.y - 44 + Math.sin(V.age * 2.2) * 10, dx = tx - V.x, dy = ty - V.y, d = Math.hypot(dx, dy) || 1, v = Q.vit * dt; V.x += dx / d * Math.min(v, d); V.y += dy / d * Math.min(v, d);
        if (V.tg && d < 22) { V.bois += dt; if (Math.random() < dt * 14) R.parts.push({ x: V.tg.x + rand(-8, 8), y: V.tg.y - 20 + rand(-8, 8), vx: 0, vy: -40, life: 0.35, max: 0.35, col: '#9ab6ff', size: 3, float: true }); if (V.bois >= Q.boit) { V.banque += Q.gain[V.n - 1]; V.vus.set(V.tg, R.t + 6); G.text(V.tg.x, V.tg.y - 56, '💧', '#9ab6ff'); V.tg = null; } } } }
    const Z = R.seismeS; if (Z) { const Q = S7.SEISME; Z.t -= dt; Z.pouf -= dt; R.shake = Math.max(R.shake || 0, 0.22);
      for (const e of R.enemies) { if (!vivant(e) || Math.hypot(e.x - p.x, e.y - p.y) > Q.rayon) continue; e.rooted = Math.max(e.rooted || 0, 0.25); e.atkCd = Math.max(e.atkCd || 0, 0.5); e.moving = false; e.path = null; if (e.kb) e.kb = null; e.seismeT = R.t + 0.3; }
      if (Z.pouf <= 0) { Z.pouf = 0.3; R.rings.push({ x: p.x, y: p.y, r: 120 + Math.random() * 200, life: 0.5, col: '#c9a56b' }); for (let i = 0; i < 4; i++) G.puff(p.x + rand(-340, 340), p.y + rand(-220, 220), '#b89a70', 5, 70, 3); if (Math.random() < 0.5) CG.sfx('tombe'); }
      if (Z.t <= 0) { let n = 0; for (const e of R.enemies) { if (!vivant(e) || Math.hypot(e.x - p.x, e.y - p.y) > Q.rayon) continue; G.hurtEnemy(e, Z.dmg, p); n++; } for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y, r: 160 + i * 150, life: 0.5 + i * 0.15, col: '#e8c890' }); R.shake = Math.max(R.shake || 0, 0.5); CG.sfx('tombe'); G.text(p.x, p.y - 80, n ? '💥 ' + n + ' monstre' + (n > 1 ? 's' : '') + ' secoué' + (n > 1 ? 's' : '') + ' !' : 'La terre se calme', '#e8c890', true); R.seismeS = null; } }
    const Y = R.rayonsT; if (Y) { const Q = S7.RAYONS; Y.t -= dt; Y.ang += Q.tour * dt; Y.tic -= dt;
      if (Y.tic <= 0) { Y.tic = Q.tic; const ox = p.x, oy = p.y - 16; for (const e of R.enemies) { if (!vivant(e)) continue; const ex = e.x - ox, ey = e.y - 14 - oy, d = Math.hypot(ex, ey); if (d > Q.long + (e.r || 12)) continue; for (let i = 0; i < Y.nb; i++) { const a = Y.ang + i * TAU / Y.nb, k = ex * Math.cos(a) + ey * Math.sin(a); if (k < 0) continue; if (Math.abs(-ex * Math.sin(a) + ey * Math.cos(a)) < Q.large + (e.r || 12)) { G.hurtEnemy(e, Y.dmg, p); break; } } } }
      if (Y.t <= 0) R.rayonsT = null; }
    return r0;
  };
  if (CG.Buffs && CG.Buffs.LISTE) CG.Buffs.LISTE.push({ k: 'seisme', ic: '🌋', nom: () => SP.seisme.nom, txt: 'Les monstres ne bougent plus et n\'attaquent plus.', t: () => (CG.R && CG.R.seismeS ? CG.R.seismeS.t : 0) }, { k: 'rayonsT', ic: '✴️', nom: () => SP.rayons.nom, txt: 'Les rayons tournent tout seuls.', t: () => (CG.R && CG.R.rayonsT ? CG.R.rayonsT.t : 0) });

  // ---------- les dessins (sans contour) ----------
  const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  function barreVie(g, s) { if (s.hp >= s.maxhp) return; const k = Math.max(0, s.hp / s.maxhp); g.fillStyle = 'rgba(20,10,40,0.7)'; g.fillRect(s.x - 13, s.y - 54, 26, 4); g.fillStyle = '#c8a0ff'; g.fillRect(s.x - 12, s.y - 53, 24 * k, 2); }
  function elementaire(g, s, t) { const c = s.pal, y = s.y - 22 + Math.sin(t * 3 + s.seed) * 3, k = s.atkAnim > 0 ? 1 + s.atkAnim * 0.15 : 1;
    for (let i = 0; i < 5; i++) { const a = t * 3.2 + s.seed + i * 1.3, r = 15 - i * 2.4; ell(g, s.x + Math.cos(a) * (5 - i * 0.6), y + 16 - i * 8, r * k, r * 0.72 * k, i % 2 ? c[2] : c[0]); }
    ell(g, s.x + Math.sin(t * 4 + s.seed) * 1.5, y - 14, 8.5, 8, c[0]); ell(g, s.x - 2, y - 17, 3.4, 2.6, c[1]); g.fillStyle = '#fff'; g.fillRect(s.x - 4.5 + s.face * 1.5, y - 15, 2.6, 3); g.fillRect(s.x + 1.5 + s.face * 1.5, y - 15, 2.6, 3);
    for (let i = 0; i < 3; i++) { const a = t * 2.4 + i * 2.1 + s.seed; ell(g, s.x + Math.cos(a) * 19, y + Math.sin(a) * 8, 2.6, 2.6, c[1]); } }
  function lamesDessin(g, s, t) { const a0 = t * 13 + s.seed, n = 3 + (s.n || 1), y = s.y - 10;
    ell(g, s.x, s.y + 3, 19, 6, 'rgba(0,0,0,0.25)'); g.save(); g.translate(s.x, y); g.scale(1, 0.62);
    for (let i = 0; i < n; i++) { g.save(); g.rotate(a0 + i * TAU / n); g.fillStyle = i % 2 ? '#e8eef8' : '#aab6cc'; g.beginPath(); g.moveTo(5, -3); g.quadraticCurveTo(20, -11, 31, 0); g.quadraticCurveTo(18, 1, 5, 4); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(12, -3.5, 12, 1.4); g.restore(); }
    g.fillStyle = 'rgba(200,212,232,0.22)'; g.beginPath(); g.arc(0, 0, 31, 0, TAU); g.fill(); g.restore(); ell(g, s.x, y, 6, 5, '#3a4458'); ell(g, s.x - 1.5, y - 1.5, 2.2, 1.6, '#cfe0ff'); }
  const serviteur = { draw(g, s, t) { const fin = s.t < 3 ? 0.5 + 0.4 * Math.abs(Math.sin(t * 10)) : 1; g.save(); g.globalAlpha = Math.min(1, s.age / 0.3) * fin;
    try { if (s.k === 'lames') lamesDessin(g, s, t);
      else { g.strokeStyle = 'rgba(200,160,255,0.75)'; g.lineWidth = 2; g.beginPath(); g.ellipse(s.x, s.y + 2, s.r + 7, (s.r + 7) * 0.36, 0, 0, TAU); g.stroke(); /* l'anneau mauve : celui-là est avec nous */
        if (s.pal) { ell(g, s.x, s.y + 3, 14, 5, 'rgba(0,0,0,0.22)'); elementaire(g, s, t); }
        else if (s.esp === 'terre' && M.draw) M.draw(g, s, t);
        else { s.calm = true; if (s.esp === 'demon') { g.translate(s.x, s.y); g.scale(0.85, 0.85); g.translate(-s.x, -s.y); } Art.enemy(g, s, t); } }
    } catch (e) { ell(g, s.x, s.y - 16, 12, 14, s.col || '#c8a0ff'); }
    g.restore(); barreVie(g, s); } };
  const murVert = { draw(g, o, t) { const w = o.w, a = Math.min(1, w.t / 0.6, (w.max - w.t) / 0.3 + 0.2), N = 13; g.save();
    for (let i = 0; i <= N; i++) { const k = i / N, x = w.x1 + (w.x2 - w.x1) * k, y = w.y1 + (w.y2 - w.y1) * k, h = 26 + 12 * Math.sin(t * 5 + i * 1.7 + w.seed), sw = Math.sin(t * 3 + i + w.seed) * 3;
      g.globalAlpha = a * 0.3; ell(g, x, y + 2, 15, 6, '#1e5a14'); g.globalAlpha = a * 0.62; ell(g, x + sw, y - h * 0.45, 11, h * 0.55, '#3aa02a'); g.globalAlpha = a * 0.7; ell(g, x - sw * 0.6, y - h * 0.3, 7.5, h * 0.36, '#8dee4a');
      const b = (t * 0.9 + i * 0.37 + w.seed) % 1; g.globalAlpha = a * (1 - b) * 0.9; ell(g, x + Math.sin(i * 7 + w.seed) * 8, y - 8 - b * 46, 2.6, 2.6, '#d8ff9a'); }
    g.restore(); } };
  const fantome = { draw(g, o, t) { const V = o.V, x = V.x, y = V.y + Math.sin(t * 5) * 2, k = Math.min(1, V.banque / 20); g.save(); g.globalAlpha = 0.82;
    if (V.tg && Math.hypot(V.tg.x - V.x, V.tg.y - 34 - V.y) < 26) { g.strokeStyle = 'rgba(154,182,255,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6 * Math.sin(t * 12), (y + V.tg.y - 16) / 2, V.tg.x, V.tg.y - 16); g.stroke(); }
    ell(g, x, y, 10 + k * 3, 11 + k * 3, '#cfdcff'); g.fillStyle = '#cfdcff'; g.beginPath(); g.moveTo(x - 10 - k * 3, y); for (let i = 0; i <= 4; i++) g.lineTo(x - 10 - k * 3 + (20 + k * 6) * i / 4, y + 13 + (i % 2 ? 5 : 0) + Math.sin(t * 6 + i) * 1.5); g.lineTo(x + 10 + k * 3, y); g.fill();
    ell(g, x, y + 2, 6 + k * 2, 6 + k * 2, 'rgba(90,140,255,' + (0.25 + 0.5 * k) + ')'); g.fillStyle = '#1a2a5a'; g.fillRect(x - 4.5, y - 3, 2.6, 4); g.fillRect(x + 2, y - 3, 2.6, 4); g.restore(); } };
  const rayonsD = { draw(g, o, t) { const Y = o.Y, p = CG.S.player, Q = S7.RAYONS, ox = p.x, oy = p.y - 16, a = Math.min(1, Y.t / 0.5, (Y.dur - Y.t) / 0.25 + 0.15); g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < Y.nb; i++) { const an = Y.ang + i * TAU / Y.nb, x2 = ox + Math.cos(an) * Q.long, y2 = oy + Math.sin(an) * Q.long; g.globalAlpha = a * 0.3; g.strokeStyle = '#ffb040'; g.lineWidth = 20; g.beginPath(); g.moveTo(ox, oy); g.lineTo(x2, y2); g.stroke(); g.globalAlpha = a * 0.6; g.strokeStyle = '#ffe36b'; g.lineWidth = 9; g.stroke(); g.globalAlpha = a; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.stroke(); }
    g.globalAlpha = a * 0.8; ell(g, ox, oy, 15 + 3 * Math.sin(t * 20), 15 + 3 * Math.sin(t * 20), '#fff3c0'); g.restore(); void t; } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const s of R.sept || []) if (!s.dead && CG.onScreen(s.x, s.y)) push(s.y, 21, Object.assign(s, serviteur), null);
    for (const w of R.mursPoison || []) push(Math.max(w.y1, w.y2), 21, { x: w.x1, y: w.y1, w, draw: murVert.draw }, null);
    if (R.vampM) push(R.vampM.y + 60, 21, { x: R.vampM.x, y: R.vampM.y, V: R.vampM, draw: fantome.draw }, null);
    if (R.rayonsT) { const p = CG.S.player; push(p.y + 1, 21, { x: p.x, y: p.y, Y: R.rayonsT, draw: rayonsD.draw }, null); } }; }
  S7.donner = () => { const p = CG.S.player; MIENS.concat(['mondes']).forEach(id => { if (!p.spells.includes(id)) p.spells.push(id); }); }; // pour les essais
})(window.CG);
