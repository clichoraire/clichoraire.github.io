// Goblin Malin — les bêtes paisibles de la carte. Chaque jour, deux ou trois animaux sauvages (louveteau, ourson, chaton,
// hibou, faucon) traînent loin du village, une bulle 🍖 au-dessus de la tête. Ils ne sont pas méchants : on leur parle (E),
// on leur donne à manger (trois fois plus qu'à ceux qui viennent mendier au feu), et ils suivent le chef jusqu'au village, où ils restent comme compagnons.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, P = CG.P, W = CG.W, UI = CG.UI, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const Sa = CG.Sauvages = { MIN: 2, MAX: 3, PRES: 11, LOIN: 34 };
  const monde = () => (CG.Mondes ? CG.Mondes.ici() : 0);
  Sa.tirer = function () {
    const S = CG.S, f = G.firePos(), fx = f.x / T, fy = f.y / T, l = [], kinds = Object.keys(P.KINDS).filter(k => !P.KINDS[k].monstre), n = S.pets.length >= P.MAX ? 0 : Sa.MIN + Math.floor(Math.random() * (Sa.MAX - Sa.MIN + 1));
    for (let i = 0; i < 4000 && l.length < n; i++) {
      const x = 4 + Math.floor(Math.random() * (CG.MW - 8)), y = 4 + Math.floor(Math.random() * (CG.MH - 8)), d = Math.hypot(x - fx, y - fy); if (d < Sa.PRES || d > Sa.LOIN) continue;
      const t = W.tile[W.idx(x, y)]; if ((t !== W.GRASS && t !== W.CLEAR && t !== W.PATH) || !W.walkTile(x, y) || !W.walkTile(x + 1, y) || !W.walkTile(x, y + 1)) continue;
      if (l.some(o => Math.hypot(o.x - x, o.y - y) < 12)) continue;
      if (!G.goTo({ x: x * T + T / 2, y: y * T + T / 2 }, f.x, f.y + 60)) continue; // il faut pouvoir s'y rendre à pied
      l.push({ kind: pick(kinds), x, y, pris: false });
    }
    S.sauvages = { day: S.day, l }; return l;
  };
  const visiteurs = () => CG.R.visitors.filter(v => v.sauvage);
  function poser() { // les animaux du jour, remis sur la carte (nouveau jour, partie rechargée, changement de monde)
    const S = CG.S, R = CG.R; for (const v of visiteurs()) R.visitors.splice(R.visitors.indexOf(v), 1);
    if (monde() === 2) { R.sauvJ = S.day + ':' + monde(); return; }
    if (!S.sauvages || S.sauvages.day !== S.day) Sa.tirer();
    for (const o of S.sauvages.l) { if (o.pris) continue; const c = W.center(o.x, o.y);
      R.visitors.push({ id: S.nextId++, role: 'animal', look: 'animal', kind: o.kind, x: c.x, y: c.y, face: Math.random() < 0.5 ? 1 : -1, step: 0, moving: false, state: 'wait', exit: c, seed: Math.random() * 100, leaveAt: 99, dest: c, sauvage: o, hx: c.x, hy: c.y, w: rand(1, 4), dx: 0, dy: 0 }); }
    R.sauvJ = S.day + ':' + monde();
  }
  Sa.liste = visiteurs;
  const du0 = D.update; D.update = function (dt) {
    const r = du0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !R.visitors || R.night || R.cine) return r;
    if (R.sauvJ !== S.day + ':' + monde()) poser();
    const p = S.player;
    for (const o of S.sauvages ? S.sauvages.l : []) { // nourri ou chassé : il n'est plus là
      if (o.pris) continue; const v = R.visitors.find(q => q.sauvage === o); if (v && v.state !== 'leave') continue; o.pris = true; if (v) continue;
      const a = S.pets[S.pets.length - 1]; if (a && a.kind === o.kind && !a.amene && a.lvl === 1 && Math.hypot(a.x - p.x, a.y - p.y) < 160) { a.amene = true; a.follow = true; UI.toast('🐾 ' + a.name + ' te suit. Ramène-le au village : il y restera avec le clan.'); }
    }
    for (const v of visiteurs()) { // ils flânent autour de leur coin, et s'arrêtent pour regarder le chef approcher
      if (v.state !== 'wait' || R.talking === v) continue; const d = Math.hypot(p.x - v.x, p.y - v.y); if (d < 150) continue;
      v.w -= dt; if (v.w <= 0) { v.w = rand(1.5, 4.5); if (Math.random() < 0.45) { v.dx = 0; v.dy = 0; } else { const far = Math.hypot(v.x - v.hx, v.y - v.hy) > 70, a = far ? Math.atan2(v.hy - v.y, v.hx - v.x) : Math.random() * TAU; v.dx = Math.cos(a); v.dy = Math.sin(a); } }
      if (v.dx || v.dy) { const k = P.KINDS[v.kind], sp = 26 * dt; if (k.fly ? (v.x += v.dx * sp, v.y += v.dy * sp, true) : G.slide(v, v.dx * sp, v.dy * sp)) { v.moving = true; v.step += dt * 2.4; if (Math.abs(v.dx) > 0.1) v.face = v.dx > 0 ? 1 : -1; } else v.w = 0; }
    }
    return r;
  };
  // un animal qu'on va chercher dans la forêt se laisse moins facilement amadouer : il faut trois fois plus de nourriture
  Sa.PRIX = 3;
  const pt0 = P.talk; P.talk = function (v) {
    if (!v || !v.sauvage) return pt0.apply(this, arguments);
    const base = P.ADOPT, cher = base * Sa.PRIX, d0 = UI.dialog;
    UI.dialog = function (o) { (o.options || []).forEach(op => { const f = op.fn; if (f) op.fn = () => { const b = P.ADOPT; P.ADOPT = cher; try { f(); } finally { P.ADOPT = b; } }; }); return d0.call(this, o); };
    P.ADOPT = cher; try { return pt0.apply(this, arguments); } finally { P.ADOPT = base; UI.dialog = d0; }
  };
  // celui qu'on vient de nourrir suit le chef jusqu'au feu, même sans la technologie des Compagnons fidèles
  const pu0 = P.update; P.update = function (dt) {
    const S = CG.S, R = CG.R, am = S.pets.filter(a => a.amene); if (!am.length) return pu0.apply(this, arguments);
    const t0 = G.tech; G.tech = id => id === 'b24' ? true : t0(id); let r; try { r = pu0.apply(this, arguments); } finally { G.tech = t0; }
    const f = G.firePos(), feu = !CG.Mondes || CG.Mondes.feuIci();
    for (const a of am) if (a.ko || (feu && Math.hypot(a.x - f.x, a.y - f.y) < 260)) { a.amene = false; if (!a.dresse) a.follow = false; if (!a.ko) { G.text(a.x, a.y - 44, '🏕️', '#fff', true); UI.toast('🏕️ ' + a.name + ' est arrivé au village. Il garde maintenant le clan.'); } }
    return r;
  };
})(window.CG);
