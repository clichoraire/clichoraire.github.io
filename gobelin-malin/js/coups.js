// Goblin Malin — récolter, c'est comme bâtir : un coup à chaque fois qu'on appuie (E, clic ou bouton), pas plus vite qu'un coup de marteau.
//   Buisson, gisement, arbre, tronc : rien n'avance tout seul. Les coups déjà donnés restent si on s'éloigne un moment.
//   Chaque coup a son geste (CG.Coups.GESTE s) : la main part, touche à CG.Coups.TOUCHE s, et là seulement ça compte.
//   Un meilleur outil (★★, ★★★) demande moins de coups : CG.Coups.OUTIL.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, T = CG.TILE, rand = CG.rand, TAU = Math.PI * 2;
  const Cp = CG.Coups = { NB: { bush: 10, ore: 15, arbreChef: 18, troncChef: 12 }, OUTIL: [1, 1, 0.8, 0.6], REPOS: 0.4, GESTE: 0.5, TOUCHE: 0.17 };
  const ENCORE = { bush: 'Cueillir encore', ore: 'Encore un coup de pioche', arbreChef: 'Encore un coup de hache', troncChef: 'Encore un coup de hache' };
  const COL = { bush: '#3a8a44', ore: '#9aa0a8', arbreChef: '#c9a56b', troncChef: '#c9a56b' };
  const QUOI = { bush: ['gant', 'gather'], ore: ['pioche', 'mine'], arbreChef: ['hache', 'chop'], troncChef: ['hache', 'chop'] };
  Cp.nb = function (type) { const q = CG.S && CG.S.player.porte, o = q && q[QUOI[type][0]], n = o && o.n > 0 ? Math.min(3, o.n) : 1; return Math.max(3, Math.round(Cp.NB[type] * Cp.OUTIL[n])); };
  const cle = it => it.type === 'troncChef' ? 'l' + it.obj.tx + ',' + it.obj.ty + ',' + it.obj.halves : it.type[0] + it.obj.x + ',' + it.obj.y;
  const faits = () => { const R = CG.R; return R.coupsFaits || (R.coupsFaits = {}); };
  const centre = it => it.type === 'troncChef' ? { x: (it.obj.tx + 0.5 + (it.obj.dir || 1) * 0.35) * T, y: it.obj.ty * T + T / 2 } : { x: it.obj.x * T + T / 2, y: it.obj.y * T + T / 2 };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments); if (!it || !Cp.NB[it.type] || !CG.R) return it;
    const n = faits()[cle(it)] || 0; if (/ne bouge pas/.test(it.label) || n > 0) it.label = ENCORE[it.type] + ' (' + n + '/' + Cp.nb(it.type) + ')'; return it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || !Cp.NB[it.type]) return in0.apply(this, arguments);
    const R = CG.R, p = CG.S.player; if (R.coupT > 0 || R.coupImp) return; const c = cle(it), n = Cp.nb(it.type);
    let k = R.picking || R.coupe; if (k && k.cle !== c) return;
    if (!k) { in0.apply(this, arguments); k = R.picking || R.coupe; if (!k) return; k.cle = c; k.gele = k.max * Math.min(n - 1, faits()[c] || 0) / n; k.t = k.gele; }
    const o = centre(it); p.face = o.x > p.x ? 1 : -1; R.coupT = Cp.REPOS;
    R.coupPose = R.chefPose = { k: QUOI[it.type][1], fin: R.t + Cp.GESTE, d: R.t, dur: Cp.GESTE };
    R.coupImp = { t: R.t + Cp.TOUCHE, k, c, n, type: it.type, o, obj: it.obj };
  };
  // ---------- le coup touche : ça compte, et ça se voit ----------
  const fx = () => { const R = CG.R; return R.coupFx || (R.coupFx = []); };
  function touche(R, m) {
    const k = m.k, M = faits(), nb = (M[m.c] || 0) + 1, o = m.o, p = CG.S.player, F = fx(), fini = nb >= m.n;
    if (fini) { delete M[m.c]; k.gele = k.max; } else { M[m.c] = nb; k.gele = k.max * nb / m.n; } k.t = k.gele; k.secoue = R.t;
    CG.sfx('chop'); G.puff(o.x + rand(-8, 8), o.y - 12 - rand(0, 10), COL[m.type], 5, 100, 3);
    if (m.type === 'bush') { // des baies sautent du buisson et filent dans les mains du chef, quelques feuilles s'envolent
      const col = CG.Art.baie ? CG.Art.baie(m.obj).col : '#d8264a';
      for (let i = 0; i < 2 + (fini ? 3 : 0); i++) F.push({ q: 'baie', x: o.x + rand(-10, 10), y: o.y - 10 - rand(0, 8), vx: rand(-60, 60), vy: -rand(120, 190), t: 0, vie: 0.75, col, r: 3 });
      for (let i = 0; i < 3; i++) F.push({ q: 'feuille', x: o.x + rand(-12, 12), y: o.y - 14, vx: rand(-40, 40), vy: -rand(30, 70), t: 0, vie: 0.8, col: i ? '#4aa052' : '#2f7a3a', r: 3, a: rand(0, 6) });
    } else if (m.type === 'ore') { // des étincelles au bout de la pioche, des éclats de roche qui retombent
      for (let i = 0; i < 5; i++) F.push({ q: 'etincelle', x: o.x, y: o.y - 14, vx: rand(-150, 150), vy: -rand(40, 170), t: 0, vie: 0.28, col: i % 2 ? '#fff6c8' : '#ffd060', r: 1.6 });
      for (let i = 0; i < 3; i++) F.push({ q: 'eclat', x: o.x + rand(-6, 6), y: o.y - 12, vx: rand(-70, 70), vy: -rand(90, 160), t: 0, vie: 0.7, col: i ? '#9aa0a8' : '#c6ccd6', r: rand(2, 3.4), sol: o.y + rand(2, 12), a: rand(0, 6) });
      R.shake = Math.max(R.shake || 0, 0.04);
    } else { // des copeaux de bois ; d'un arbre debout, des feuilles tombent de la cime
      for (let i = 0; i < 4; i++) F.push({ q: 'eclat', x: o.x + rand(-5, 5), y: o.y - 14, vx: (p.x < o.x ? -1 : 1) * rand(20, 110), vy: -rand(80, 150), t: 0, vie: 0.7, col: i % 2 ? '#e2c088' : '#b98a4e', r: rand(2, 3.2), sol: o.y + rand(2, 12), a: rand(0, 6) });
      if (m.type === 'arbreChef') for (let i = 0; i < 3; i++) F.push({ q: 'feuille', x: o.x + rand(-22, 22), y: o.y - 52 - rand(0, 26), vx: rand(-14, 14), vy: rand(16, 34), t: 0, vie: 1.5, col: i ? '#4aa052' : '#6cbf5a', r: 3.2, a: rand(0, 6) });
    }
  }
  const tient = (R, k) => { const S = CG.S, p = S.player, W = CG.W; if (R.ko > 0 || CG.UI.modal || Math.hypot(p.x - k.px, p.y - k.py) > 5) return false; if (k.n) return !k.n.gone; if (R.night) return false; return k.l ? S.logs.includes(k.l) : W.tile[W.idx(k.a.x, k.a.y)] === W.TREE; };
  const lache = (R, k) => { if (k.l && k.l.by === 'chef') k.l.by = null; if (R.coupImp && R.coupImp.k === k) R.coupImp = null; if (R.coupPose) { if (R.chefPose === R.coupPose) R.chefPose = null; R.coupPose = null; } };
  const up0 = G.update; G.update = function (dt) {
    const R0 = CG.R; let k = null, ou = null;
    if (R0) {
      if (R0.coupT > 0) R0.coupT -= dt;
      const m = R0.coupImp; if (m && R0.t >= m.t) { R0.coupImp = null; if ((R0.picking || R0.coupe) === m.k) touche(R0, m); }
      ou = R0.picking ? 'picking' : R0.coupe ? 'coupe' : null; k = ou && R0[ou];
      if (k && k.cle && k.gele < k.max) R0[ou] = null; else k = null; /* entre deux coups, le travail ne bouge pas : la vieille routine ne tourne pas */
    }
    up0.apply(this, arguments); const R = CG.R; if (!R) return;
    if (k && R === R0) { if (!R.picking && !R.coupe && tient(R, k)) { R[ou] = k; k.t = k.gele; } else lache(R, k); }
    const cp = R.coupPose; if (cp) { if (cp.fin <= R.t) R.coupPose = null; else if (!R.chefPose || (R.chefPose !== cp && ['chop', 'mine', 'gather'].includes(R.chefPose.k))) R.chefPose = cp; }
    const F = R.coupFx; if (F && F.length) { const p = CG.S.player;
      for (const f of F) { f.t += dt;
        if (f.q === 'baie') { const u = f.t / f.vie; if (u < 0.4) { f.vy += 620 * dt; f.x += f.vx * dt; f.y += f.vy * dt; } else { const v = Math.min(1, dt * (6 + u * 22)); f.x += (p.x - f.x) * v; f.y += (p.y - 22 - f.y) * v; } }
        else if (f.q === 'feuille') { f.vy += 60 * dt; f.vx *= 1 - dt * 2; f.x += (f.vx + Math.sin(f.t * 7 + f.a) * 26) * dt; f.y += Math.min(f.vy, 46) * dt; }
        else if (f.q === 'eclat') { if (f.y < f.sol || f.vy < 0) { f.vy += 620 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.a += dt * 12; } }
        else { f.vy += 420 * dt; f.x += f.vx * dt; f.y += f.vy * dt; } }
      R.coupFx = F.filter(f => f.t < f.vie); }
  };
  // la petite barre au-dessus de l'arbre ou du tronc (le buisson et le gisement ont déjà la leur), et tout ce qui vole
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return; const k = R.coupe;
    if (k && CG.Art.bar) { const x = k.l ? (k.l.tx + 0.5 + (k.l.dir || 1) * 0.35) * T : k.a.x * T + T / 2, y = k.l ? k.l.ty * T - 4 : k.a.y * T - 30; CG.Art.bar(g, x, y, 34, k.t / k.max, '#e8c88a'); }
    const F = R.coupFx; if (!F || !F.length) return;
    for (const f of F) { const u = f.t / f.vie; g.globalAlpha = u > 0.75 ? Math.max(0, (1 - u) * 4) : 1; g.fillStyle = f.col;
      if (f.q === 'baie') { g.beginPath(); g.arc(f.x, f.y, f.r, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(f.x - 1, f.y - 1, 1, 0, TAU); g.fill(); }
      else if (f.q === 'feuille') { g.save(); g.translate(f.x, f.y); g.rotate(Math.sin(f.t * 7 + f.a) * 0.9); g.beginPath(); g.ellipse(0, 0, f.r * 1.5, f.r * 0.7, 0, 0, TAU); g.fill(); g.restore(); }
      else if (f.q === 'eclat') { g.save(); g.translate(f.x, f.y); g.rotate(f.a); g.fillRect(-f.r, -f.r * 0.6, f.r * 2, f.r * 1.2); g.restore(); }
      else { g.beginPath(); g.arc(f.x, f.y, f.r, 0, TAU); g.fill(); } }
    g.globalAlpha = 1;
  };
})(window.CG);
