// Goblin Malin — améliorer une construction sur place : on bâtit toujours la version de base, puis on va à côté (E) pour lancer les travaux.
// Les travaux prennent du temps : les bricoleurs s'en chargent (ou le chef, s'il reste à côté). Clôture → muret → clôture en métal ; palissade → mur de pierre → mur de métal.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, Am = CG.Ameliorer = {};
  // chaque palier : la technologie qu'il faut, le prix, les secondes de travail, et ce que ça donne
  const maison = k => [{ tech: 'd3', nom: 'Maison de pierre', cout: { minerai: Math.round(12 * k) }, sec: 22, effet: 'murs de pierre, deux fois plus solide' }, { tech: 'd9', nom: 'Maison de métal', cout: { minerai: Math.round(25 * k), or: Math.round(20 * k) }, sec: 30, effet: 'plaquée de métal, trois fois plus solide qu\'une hutte' }];
  Am.UP = {
    cloture: [{ tech: 'd3', to: 'muret', nom: 'Muret de pierre', cout: { minerai: 3 }, sec: 7, effet: 'deux fois plus solide, toujours assez bas pour tirer par-dessus' }],
    muret: [{ tech: 'd8', to: 'clotureFer', nom: 'Clôture en métal', cout: { minerai: 5 }, sec: 10, effet: 'presque incassable, et on tire toujours par-dessus' }],
    palissade: [{ tech: 'd3', to: 'mur', nom: 'Mur de pierre', cout: { minerai: 6 }, sec: 14, effet: 'deux fois plus solide' }],
    mur: [{ tech: 'd9', to: 'murMetal', nom: 'Mur de métal', cout: { minerai: 10 }, sec: 20, effet: 'le plus solide de tous' }],
    portail: [{ tech: 'd8', to: 'portailFer', nom: 'Portail ferré', cout: { bois: 2, minerai: 2 }, sec: 8, effet: 'deux fois plus solide' }],
    hut: maison(1), chief: maison(1.5).map((m, i) => Object.assign(m, { effet: m.effet + ' ; ' + [7, 10][i] + ' gobelins sans toit peuvent s\'y cacher pendant une attaque (au lieu de ' + [4, 7][i] + ')' })),
    tower: [{ tech: 'd5', nom: 'Tour fortifiée', cout: { bois: 15, minerai: 8 }, sec: 18, effet: '+50 % de dégâts, portée accrue' }, { tech: 'd7', nom: 'Donjon d\'archers', cout: { bois: 20, minerai: 15, or: 30 }, sec: 26, effet: 'dégâts doublés, tir bien plus rapide' }],
    tourMagie: [{ tech: 's7', nom: 'Tour d\'archimage', cout: { minerai: 15, or: 60 }, sec: 24, effet: 'explosions plus larges, plus fortes, plus fréquentes' }]
  };
  if (CG.BUILDS.mur) delete CG.BUILDS.mur.tech; // le mur de pierre ne se bâtit plus d'un coup : c'est une palissade améliorée
  Am.lvl = b => (b && b.up) || 0;
  Am.next = b => { const L = b && !b.site && !b.upg && Am.UP[b.type]; const n = L && L[Am.lvl(b)]; return n && G.tech(n.tech) ? n : null; };
  const prix = c => Object.keys(c).map(r => c[r] + ' ' + CG.RES[r].icon).join(' ');
  const mid = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T });
  function enTravaux() { const S = CG.S, p = S.player; let best = null, bd = 62; for (const b of S.buildings) { if (!b.upg) continue; const x0 = b.tx * T, y0 = b.ty * T, dx = Math.max(x0 - p.x, 0, p.x - (x0 + b.w * T)), dy = Math.max(y0 - p.y, 0, p.y - (y0 + b.h * T)), d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = b; } } return best; }
  function near() {
    const S = CG.S, p = S.player; let best = null, bd = 62;
    for (const b of S.buildings) { if (!Am.UP[b.type] || !Am.next(b)) continue; const x0 = b.tx * T, y0 = b.ty * T, dx = Math.max(x0 - p.x, 0, p.x - (x0 + b.w * T)), dy = Math.max(y0 - p.y, 0, p.y - (y0 + b.h * T)), d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = b; } }
    return best;
  }
  // on paie, et les travaux commencent
  Am.apply = function (b) {
    const n = Am.next(b); if (!n) return false; if (!G.canPay(n.cout)) { CG.sfx('no'); CG.UI.toast('Il te manque des ressources pour améliorer : ' + prix(n.cout) + '.'); return false; }
    G.pay(n.cout); b.upg = { i: Am.lvl(b), prog: 0, need: n.sec * (CG.Diff ? CG.Diff.cur().build : 1) }; const c = mid(b); G.text(c.x, c.y - 56, '🔨 Travaux : ' + n.nom, '#bfe4ff'); G.puff(c.x, c.y - 10, '#c9c2b0', 10, 90, 3); CG.sfx('ok');
    if (!CG.S.goblins.some(g => g.job === 'aucun')) CG.UI.toast('🔨 Aucun bricoleur pour faire les travaux : frappe toi-même (E), coup de marteau par coup de marteau.');
    return true;
  };
  Am.finish = function (b) {
    const n = Am.UP[b.type] && Am.UP[b.type][b.upg.i]; delete b.upg; if (!n) return;
    const m0 = G.buildMaxHp(b), k = m0 && b.hp ? b.hp / m0 : 1;
    if (n.to) { W.unblock(b); b.type = n.to; W.blockBuilding(b); } else b.up = Am.lvl(b) + 1;
    const m1 = G.buildMaxHp(b); if (m1 && b.hp !== undefined) b.hp = m1 * k; tm = null;
    const c = mid(b); G.puff(c.x, c.y - 10, '#ffe36b', 22, 130, 4); CG.R.rings.push({ x: c.x, y: c.y, r: 70, life: 0.45, col: '#ffe36b' }); G.text(c.x, c.y - 56, '⬆️ ' + n.nom + ' !', '#ffe36b', true); if (CG.onScreen(c.x, c.y)) CG.sfx('build'); W.miniDirty = true;
  };
  Am.ask = function (b, autre) {
    const n = Am.next(b); if (!n) return; const ok = G.canPay(n.cout), d = CG.BUILDS[b.type];
    const opts = [{ label: '⬆️ Améliorer en ' + n.nom, sub: 'Coût : ' + prix(n.cout) + ' · les travaux prennent du temps', disabled: !ok, fn: () => { CG.UI.close(); Am.apply(b); } }];
    if (autre) opts.push({ label: autre.label, fn: () => { CG.UI.close(); autre.fn(); } });
    CG.UI.dialog({ who: d.nom, tag: '⬆️ amélioration', text: 'Tu peux en faire : ' + n.nom + ' (' + n.effet + '). Ça coûte ' + prix(n.cout) + '.' + (ok ? '' : ' Il te manque des ressources.'), options: opts.concat([{ label: 'Pas maintenant' }]) });
  };
  // les huttes ont déjà leur propre touche E : on y ajoute le choix d'améliorer
  const hutte = it => it && (it.type === 'hut' ? it.obj : it.type === 'home' ? G.find('chief') : null);
  const find0 = D.findInteract;
  D.findInteract = function () {
    const it = find0.apply(this, arguments), R = CG.R; if (R.ko > 0 || R.cine || R.build) return it;
    if (it) { const h = hutte(it); if (h && Am.next(h)) it.label += ' · ⬆️ amélioration possible'; return it; }
    const tv = enTravaux(); if (tv) return { type: 'travaux', obj: tv, label: 'Donner un coup de marteau (' + Am.UP[tv.type][tv.upg.i].nom + ')' };
    const b = near(); if (!b) return it; const n = Am.next(b);
    return { type: 'ameliorer', obj: b, label: '⬆️ Améliorer : ' + n.nom + ' (' + prix(n.cout) + ')' };
  };
  const inter0 = D.interact;
  D.interact = function () {
    const it = D.findInteract(), self = this, a = arguments; if (it && it.type === 'ameliorer') return Am.apply(it.obj); // plus de fenêtre : on paie et le chantier du nouveau matériau commence tout de suite
    if (it && it.type === 'travaux') { const R = CG.R, b = it.obj; if (R.atkCd > 0) return; R.atkCd = 0.4; R.chefPose = { k: 'build', fin: R.t + 0.62 }; b.upg.prog += Math.max(1.3, b.upg.need / 7); const c = mid(b); G.puff(c.x + CG.rand(-b.w * 14, b.w * 14), c.y - CG.rand(0, 26), '#c9c2b0', 3, 60, 2.5); CG.sfx('chop'); if (b.upg.prog >= b.upg.need) Am.finish(b); return; }
    const h = hutte(it); if (h && Am.next(h)) return Am.ask(h, { label: it.type === 'hut' ? '🛖 Voir qui habite ici' : '🛖 Ta hutte', fn: () => { const nx = Am.next; Am.next = () => null; try { inter0.apply(self, a); } finally { Am.next = nx; } } });
    return inter0.apply(this, arguments);
  };

  // ---------- les travaux avancent : bricoleurs (voir chantier.js), ou le chef s'il reste à côté ----------
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || R.night) return; const p = S.player;
    for (const b of S.buildings) { if (!b.upg) continue; const c = mid(b); if (b.upg.prog >= b.upg.need) Am.finish(b); } // rien n'avance tout seul : il faut un bricoleur, ou les coups de marteau du chef
  };

  // ---------- tirer par-dessus : une clôture basse laisse passer les flèches, une palissade ou un mur les arrête ----------
  let tm = null, tmT = -9;
  function hauts() { const S = CG.S, R = CG.R; if (tm && R.t - tmT < 1 && R.t >= tmT) return tm; tm = new Set(); tmT = R.t; for (const b of S.buildings) { const d = CG.BUILDS[b.type]; if (d && d.tall && !b.site) tm.add(b.tx + b.ty * 1000); } return tm; }
  G.shotClear = function (a, b) {
    const H = hauts(); if (!H.size) return true; const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 14);
    for (let i = 1; i < n; i++) { const k = i / n; if (H.has(Math.floor((a.x + (b.x - a.x) * k) / T) + Math.floor((a.y + (b.y - a.y) * k) / T) * 1000)) return false; }
    return true;
  };

  // ---------- la barre de travaux au-dessus de la construction ----------
  // le nouveau matériau monte par-dessus l'ancien, de bas en haut, comme un chantier
  const futur = (g, b, a) => { const n = Am.UP[b.type] && Am.UP[b.type][b.upg.i]; if (!n) return; const pr = Math.min(1, b.upg.prog / b.upg.need); if (pr <= 0.01) return; const f = Object.create(b); f.upg = null; if (n.to) f.type = n.to; else f.up = Am.lvl(b) + 1; const H = CG.siteH ? CG.siteH(f) : 60 + b.h * 50, x = b.tx * T, y = b.ty * T; g.save(); g.beginPath(); g.rect(x - 70, y + b.h * T + 14 - H * pr, b.w * T + 140, H * pr); g.clip(); if (Art.extra[f.type]) de.call(Art, g, f, a[2], a[3]); else bu.call(Art, g, f, a[2], a[3]); g.restore(); };
  const barre = (g, b, a) => { if (!b.upg) return; if (a) futur(g, b, a); const c = mid(b), y = (b.ty + b.h) * T - (b.h > 1 ? 150 : 74); Art.bar(g, c.x, y, 36, Math.min(1, b.upg.prog / b.upg.need), '#7ad0ff'); g.font = '13px sans-serif'; g.textAlign = 'center'; g.fillText('🔨', c.x, y - 6); };
  const de = Art.drawExtra; Art.drawExtra = function (g, b) { de.apply(this, arguments); barre(g, b, arguments); };
  const bu = Art.building; Art.building = function (g, b) { bu.apply(this, arguments); barre(g, b, arguments); };
})(window.CG);
