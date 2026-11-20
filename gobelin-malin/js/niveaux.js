// Goblin Malin — les sorts à niveaux : certains sorts existent en version II puis III, chacune sur son propre parchemin.
// On ne trouve le parchemin du niveau II que si on connaît déjà le sort, et le III que si on a le II.
// Le parchemin copié, le sort du grimoire monte d'un cran (même place, même touche) : plus fort, plus gros, et parfois tout autre chose.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Art = CG.Art, Nv = CG.Niveaux = { TROUVE: 0.4, MARCHAND: 0.4 }, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const CHIF = ['', '', ' II', ' III'];
  // pour chaque sort : ce que disent les niveaux II et III
  Nv.T = {
    etincelle: ['Trait plus puissant (+50 %).', 'Dégâts doublés, et deux étincelles de plus partent en éventail.'],
    feu: ['Boule plus grosse : +50 % de dégâts, explosion plus large.', 'Dégâts doublés, explosion bien plus large, puis trois explosions en chaîne autour du point d\'impact.'],
    glace: ['+50 % de dégâts, le froid dure plus longtemps.', 'Dégâts doublés, et les ennemis touchés sont figés sur place 2 secondes.'],
    soin: ['Soigne moitié plus.', 'Soigne le double, guérit aussi tes animaux, et chasse le poison.'],
    racines: ['+50 % de dégâts, les racines tiennent plus longtemps.', 'Dégâts doublés, racines bien plus tenaces, et leurs épines empoisonnent la sève : les ennemis restent ralentis en sortant.'],
    eclair: ['+40 % de dégâts.', '+80 % de dégâts, et chaque ennemi foudroyé reste sonné un instant.'],
    bouclier: ['Absorbe moitié plus, dure plus longtemps.', 'Absorbe le double, dure encore plus longtemps.'],
    murfeu: ['Flammes bleues : +60 % de dégâts, 13 secondes.', 'Flammes mauves : dégâts plus que doublés, mur plus long, 16 secondes.'],
    poison: ['Venin plus fort : +60 % de dégâts.', 'Venin terrible : dégâts multipliés par 2,4, et le nuage englue les ennemis.'],
    passe: ['Dure 16 secondes au lieu de 10.', 'Dure 24 secondes.'],
    meteore: ['Pierre plus grosse : +50 % de dégâts, cratère plus large.', 'Dégâts doublés, cratère immense, et deux éclats retombent juste après.']
  };
  const BASE = Nv.BASE = {}; // nom et description d'origine
  Object.keys(Nv.T).forEach(b => { const sp = CG.SPELLS[b]; if (!sp) { delete Nv.T[b]; return; } BASE[b] = { nom: sp.nom, desc: sp.desc };
    [2, 3].forEach(n => { CG.SPELLS[b + '_' + n] = { nom: sp.nom + CHIF[n], icon: sp.icon, mp: sp.mp, prix: Math.round(sp.prix * (n === 2 ? 1.8 : 3)), color: sp.color, desc: 'Amélioration du sort ' + sp.nom + ' : ' + Nv.T[b][n - 2] + ' Il remplace l\'ancien dans ton grimoire.', amelio: { base: b, n } }; if (CG.Effets && CG.Effets.FICHE && CG.Effets.FICHE[b]) CG.Effets.FICHE[b + '_' + n] = CG.Effets.FICHE[b]; }); });
  const niv = b => { const p = CG.S && CG.S.player; return (p && p.sortNiv && p.sortNiv[b]) || 1; };
  Nv.niv = niv;
  Nv.rafraichir = () => nommer();
  function nommer() { Object.keys(BASE).forEach(b => { const n = niv(b), sp = CG.SPELLS[b]; sp.nom = BASE[b].nom + CHIF[n]; sp.desc = BASE[b].desc + (n > 1 ? ' — Niveau ' + CHIF[n].trim() + ' : ' + Nv.T[b][n - 2] : ''); }); }
  // un parchemin d'amélioration copié : le sort monte, le parchemin disparaît
  Nv.ranger = function () {
    const p = CG.S && CG.S.player; if (!p) return false; let change = false; p.sortNiv = p.sortNiv || {};
    for (let i = p.spells.length - 1; i >= 0; i--) { const a = CG.SPELLS[p.spells[i]] && CG.SPELLS[p.spells[i]].amelio; if (!a) continue; p.spells.splice(i, 1); change = true; if (!p.spells.includes(a.base)) p.spells.splice(Math.min(i, p.spells.length), 0, a.base); if (a.n > niv(a.base)) { p.sortNiv[a.base] = a.n; if (CG.R) UI.toast('⬆️ ' + BASE[a.base].nom + ' passe au niveau ' + CHIF[a.n].trim() + ' : ' + Nv.T[a.base][a.n - 2]); } }
    Object.keys(p.scrolls).forEach(id => { const a = CG.SPELLS[id] && CG.SPELLS[id].amelio; if (a && niv(a.base) >= a.n) { delete p.scrolls[id]; change = true; } });
    if (change) nommer(); return change;
  };
  Nv.dispo = function () { const p = CG.S.player; return Object.keys(BASE).filter(b => p.spells.includes(b) && niv(b) < 3).map(b => b + '_' + (niv(b) + 1)).filter(id => !p.scrolls[id]); };
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); const p = CG.S.player; p.sortNiv = p.sortNiv || {}; Nv.ranger(); nommer(); return r; };
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player;
    tic -= dt; if (tic <= 0) { tic = 0.3; if (Nv.ranger() && UI.modal && UI.modal.name === 'grimoire') UI.grimoire(); }
    // boule de feu III : les explosions en chaîne, là où elle a frappé
    const F = R.feux3; if (F && F.length) { for (const s of F) { if (s.life > 0 && R.shots.includes(s)) continue; s.vu = true; if (s.done || s.life <= 0) [0, 1, 2].forEach(i => { const a = i / 3 * TAU + Math.random(); (R.echos = R.echos || []).push({ t: 0.18 + i * 0.16, x: s.x + Math.cos(a) * 58, y: s.y + Math.sin(a) * 44, r: 56, dmg: s.dmg * 0.4 }); }); } R.feux3 = F.filter(s => !s.vu); }
    const E = R.echos; if (E && E.length) { for (const e of E) { e.t -= dt; if (e.t <= 0) G.blast(e.x, e.y, e.r, e.dmg, '#ffb432'); } R.echos = E.filter(e => e.t > 0); }
    // poison III : le nuage englue
    for (const c of R.clouds || []) if (c.niv >= 3) for (const e of R.enemies) if (!e.dead && !e.struct && Math.hypot(e.x - c.x, (e.y - c.y) / 0.75) < CG.Poison.R) e.slow = Math.max(e.slow, 0.5);
  };
  const sc0 = G.spellCost; G.spellCost = function (id) { const v = sc0.apply(this, arguments); return BASE[id] ? Math.ceil(v * (1 + 0.15 * (niv(id) - 1))) : v; };
  // ---------- lancer : le sort d'origine fait son œuvre, puis on gonfle ce qu'il a créé ----------
  const cast0 = G.cast; G.cast = function (id) {
    const n = BASE[id] ? niv(id) : 1; if (n < 2) return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player, k = n === 2 ? 1.5 : 2, mp0 = p.mp;
    const tirs0 = R.shots.length, del0 = R.delayed.length, murs0 = (R.walls || []).length, nu0 = (R.clouds || []).length, hp0 = p.hp, vies = new Map(R.enemies.map(e => [e, e.hp])), gob = new Map(S.goblins.map(g => [g, g.hp]));
    const r = cast0.apply(this, arguments); if (p.mp >= mp0) return r; // le sort n'est pas parti
    if (id === 'etincelle' || id === 'feu') { const neufs = R.shots.slice(tirs0); neufs.forEach(s => { s.dmg *= k; s.niv = n; if (id === 'feu') { s.aoe *= n === 2 ? 1.3 : 1.6; if (n === 3) (R.feux3 = R.feux3 || []).push(s); } });
      if (id === 'etincelle' && n === 3 && neufs[0]) { const s = neufs[0]; [-0.55, 0.55].forEach(a => { const c = Math.cos(a), si = Math.sin(a); R.shots.push(Object.assign({}, s, { vx: s.vx * c - s.vy * si, vy: s.vx * si + s.vy * c })); }); } }
    else if (id === 'meteore') { R.delayed.slice(del0).forEach(d => { d.dmg *= k; d.r *= n === 2 ? 1.25 : 1.5; d.niv = n; if (n === 3) [0, 1].forEach(i => { const a = Math.random() * TAU; R.delayed.push({ t: 1.25 + i * 0.3, max: 1.25 + i * 0.3, x: d.x + Math.cos(a) * 90, y: d.y + Math.sin(a) * 70, r: 70, dmg: d.dmg * 0.45 }); }); }); }
    else if (id === 'murfeu') { (R.walls || []).slice(murs0).forEach(w => { w.niv = n; w.dmg *= n === 2 ? 1.6 : 2.3; w.t = w.max = n === 2 ? 13 : 16; if (n === 3) { const cx = (w.x1 + w.x2) / 2, cy = (w.y1 + w.y2) / 2; w.x1 = cx + (w.x1 - cx) * 1.35; w.y1 = cy + (w.y1 - cy) * 1.35; w.x2 = cx + (w.x2 - cx) * 1.35; w.y2 = cy + (w.y2 - cy) * 1.35; } }); }
    else if (id === 'poison') { (R.clouds || []).slice(nu0).forEach(c => { c.niv = n; c.dmg *= n === 2 ? 1.6 : 2.4; }); }
    else if (id === 'bouclier') { R.shield = Math.round(R.shield * k); R.shieldT += n === 2 ? 4 : 8; }
    else if (id === 'soin') { const h = (p.hp - hp0), plus = Math.round(Math.max(h, 10) * (k - 1)); p.hp = Math.min(p.maxhp, p.hp + plus); G.text(p.x + 16, p.y - 70, '+' + plus, '#b8ffb0'); gob.forEach((v, g) => { if (g.hp > v) g.hp = Math.min(G.gobMaxHp(g), g.hp + (g.hp - v) * (k - 1)); });
      if (n === 3) { R.venin = null; S.goblins.forEach(g => { if (CG.dist(g, p) < 170) g.venin = null; }); S.pets.forEach(a => { if (!a.ko && CG.dist(a, p) < 170) { a.venin = null; a.hp = Math.min(CG.P.maxHp(a), a.hp + 30 + p.lvl * 4); G.puff(a.x, a.y - 20, '#7dff8a', 6, 60, 3); } }); } }
    else { // givre, racines, éclair : ceux qui ont été touchés reçoivent le reste
      const ke = id === 'eclair' ? (n === 2 ? 1.4 : 1.8) : k;
      vies.forEach((v, e) => { if (e.dead || e.hp >= v) return; const d = v - e.hp;
        if (id === 'glace') { e.slow *= n === 2 ? 1.5 : 1.8; if (n === 3) e.rooted = Math.max(e.rooted, 2); }
        else if (id === 'racines') { e.rooted *= n === 2 ? 1.4 : 1.8; if (n === 3) e.slow = Math.max(e.slow, e.rooted + 3); }
        else if (n === 3) e.daze = Math.max(e.daze || 0, 0.9);
        G.hurtEnemy(e, d * (ke - 1), p); });
    }
    if (n === 3) R.rings.push({ x: p.x, y: p.y - 10, r: 60, life: 0.3, col: '#e0b0ff' });
    return r;
  };
  // ---------- où trouver les parchemins d'amélioration ----------
  const ns0 = G.newScroll; G.newScroll = function () { const d = Nv.dispo(), a = ns0.apply(this, arguments); if (!d.length || !a) return d.length ? pick(d) : a; const p = CG.S.player, n = CG.SCROLL_POOL.filter(i => !p.spells.includes(i) && !p.scrolls[i]).length; return Math.random() < d.length / (n + d.length) ? pick(d) : a; }; // une amélioration a la même chance que n'importe quel autre parchemin, pas plus
  const sh0 = UI.shop; UI.shop = function (v) {
    if (v && v.shop && v.nivVu === undefined && ['nain', 'elfe', 'sorciere', 'demonMarchand'].includes(v.role)) { v.nivVu = true; const d = Nv.dispo(); if (d.length && Math.random() < Nv.MARCHAND) { const id = pick(d), sp = CG.SPELLS[id]; v.shop.unshift({ scroll: id, icon: '📜', label: 'Parchemin : ' + sp.nom, desc: 'Cercle de magie ' + CG.cercle(id), prix: sp.prix, stock: 1 }); } }
    return sh0.apply(this, arguments);
  };
  document.addEventListener('click', () => { if (CG.S && CG.running) setTimeout(() => { try { if (Nv.ranger() && UI.modal && UI.modal.name === 'grimoire') UI.grimoire(); } catch (e) { /* rien */ } }, 0); });
  // ---------- ce qu'on voit ----------
  const COUL = { 2: ['rgba(60,150,255,0.35)', '#2a7aff', '#8fd0ff', '#e0f4ff'], 3: ['rgba(170,60,255,0.38)', '#8a2aff', '#d090ff', '#f6e0ff'] };
  const fw0 = Art.fireWalls; Art.fireWalls = function (g, walls, t) {
    const simples = walls.filter(w => !(w.niv >= 2)); if (simples.length) fw0.call(this, g, simples, t);
    for (const w of walls) { if (!(w.niv >= 2)) continue; const C = COUL[w.niv], n = w.niv === 3 ? 18 : 13, k = Math.min(1, w.t / 1.2) * Math.min(1, (w.max - w.t) / 0.3 + 0.2), H = w.niv === 3 ? 36 : 30;
      for (let i = 0; i < n; i++) { const x = CG.lerp(w.x1, w.x2, i / (n - 1)), y = CG.lerp(w.y1, w.y2, i / (n - 1)), h = (H + Math.sin(t * 9 + i * 1.7 + w.seed) * 9) * k, sw = Math.sin(t * 6 + i) * 3;
        g.fillStyle = C[0]; g.beginPath(); g.ellipse(x, y + 2, 13, 5, 0, 0, TAU); g.fill();
        [[C[1], 10, 1], [C[2], 6.5, 0.7], [C[3], 3, 0.42]].forEach(f => { g.fillStyle = f[0]; g.beginPath(); g.moveTo(x - f[1], y + 2); g.quadraticCurveTo(x - f[1] * 1.1, y - h * 0.6 * f[2], x + sw * f[2], y - h * f[2]); g.quadraticCurveTo(x + f[1] * 1.1, y - h * 0.6 * f[2], x + f[1], y + 2); g.fill(); }); } }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R;
    for (const s of R.shots) { if (!(s.niv >= 2) || s.kind !== 'feu' || !CG.onScreen(s.x, s.y)) continue; const r = s.niv === 3 ? 17 : 13; g.fillStyle = 'rgba(255,120,30,0.3)'; g.beginPath(); g.arc(s.x, s.y, r + 8, 0, TAU); g.fill(); g.fillStyle = s.niv === 3 ? '#ff4a1e' : '#ff8a1e'; g.beginPath(); g.arc(s.x, s.y, r, 0, TAU); g.fill(); g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(s.x, s.y, r * 0.45, 0, TAU); g.fill(); }
    for (const c of R.clouds || []) { if (!(c.niv >= 2) || !CG.onScreen(c.x, c.y)) continue; const a = Math.min(1, c.t / 1.2); g.strokeStyle = c.niv === 3 ? 'rgba(200,120,255,' + 0.7 * a + ')' : 'rgba(190,255,90,' + 0.7 * a + ')'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.ellipse(c.x, c.y - 6, CG.Poison.R, CG.Poison.R * 0.75, t * 0.4, 0, TAU); g.stroke(); g.setLineDash([]); }
  };
})(window.CG);
