// Goblin Malin — viser juste. Tout est réglable dans CG.Viser.
//   1) On clique (ou on touche, sur tablette) un gobelin, un visiteur ou un compagnon pour lui parler : plus besoin que ce soit
//      le plus proche du chef. Il faut être assez près (PORTEE) ; sinon « Trop loin ». À la souris, celui qu'on survole est
//      souligné d'un anneau clair. S'il y a un ennemi juste là, le clic reste un coup d'arme.
//   2) La construction que la touche E va améliorer (ou marteler) est entourée d'un cadre doré, doux, seulement quand le chef
//      est à côté. Et on peut cliquer une construction améliorable toute proche : une petite fenêtre demande confirmation.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, T = CG.TILE, TAU = Math.PI * 2, Vi = CG.Viser = { PORTEE: 190, BATI: 150, ENNEMI: 46, SURVOL: 4 };
  let souris = null, force = null, vise = null, viseT = -9;
  const monde = e => { const R = CG.R, k = CG.viewScale ? CG.viewScale() : 1; return { x: e.clientX / k + R.cam.x, y: e.clientY / k + R.cam.y }; };
  const libre = () => { const R = CG.R; return CG.running && CG.S && R && !UI.modal && !R.build && !(R.ko > 0) && !R.cine && !R.night && !R.death; };
  // qui est sous le doigt : le plus proche du point visé, parmi ceux dont le corps passe dessous
  Vi.sous = function (x, y) {
    const S = CG.S, R = CG.R; let best = null, bd = 1e9;
    const essai = (k, o, l, h) => { const dx = Math.abs(x - o.x), dy = y - o.y; if (dx > l || dy > 10 || dy < -h) return; const d = Math.hypot(dx, dy + h * 0.45); if (d < bd) { bd = d; best = { k, o }; } };
    for (const g of S.goblins) if (!g.hidden && !g.exile) essai('goblin', g, 20, 56);
    for (const v of R.visitors) if (!(v.state === 'leave' && !v.rattrape)) essai('visitor', v, 24, 74);
    for (const a of S.pets) if (!a.ko && !a.ridden) { const K = CG.P.KINDS[a.kind] || {}; essai('pet', a, 26, K.fly ? 90 : 54); }
    return best;
  };
  const ennemi = (x, y) => CG.R.enemies.some(e => !e.dead && Math.abs(e.x - x) < Vi.ENNEMI && y - e.y < 14 && y - e.y > -Vi.ENNEMI * 1.8);
  // la construction améliorable sous le doigt (une clôture se clique aussi par ses piquets, un peu plus haut que sa case)
  function bati(x, y) {
    const Am = CG.Ameliorer; if (!Am) return null; const cx = Math.floor(x / T), cy = Math.floor(y / T);
    return [G.buildingAt(cx, cy), G.buildingAt(cx, cy + 1)].find(b => b && !b.site && !b.upg && b.type !== 'hut' && b.type !== 'chief' && Am.next(b)) || null;
  }
  // on passe par la touche E habituelle, mais en lui désignant quelqu'un : toutes les règles du jeu s'appliquent comme d'habitude
  const fi0 = D.findInteract; D.findInteract = function () { if (force) return { type: force.k, obj: force.o, label: 'Parler' }; return fi0.apply(this, arguments); };
  Vi.parler = function (c) { force = c; try { D.interact(); } finally { force = null; } };
  document.addEventListener('mousedown', e => {
    if (e.button !== 0 || !e.target || e.target.id !== 'game' || !libre()) return;
    const S = CG.S, R = CG.R, p = S.player, m = monde(e); if (ennemi(m.x, m.y)) return; // un ennemi là : on frappe
    const c = Vi.sous(m.x, m.y);
    if (c) { e.stopImmediatePropagation(); e.preventDefault();
      if (Math.hypot(c.o.x - p.x, c.o.y - p.y) > Vi.PORTEE) { G.text(c.o.x, c.o.y - 62, 'Trop loin', '#ffe9a8'); return; }
      p.face = c.o.x > p.x ? 1 : -1; Vi.parler(c); return; }
    const b = !R.alarm && bati(m.x, m.y);
    if (b && Math.hypot((b.tx + b.w / 2) * T - p.x, (b.ty + b.h / 2) * T - p.y) < Vi.BATI) { e.stopImmediatePropagation(); e.preventDefault(); CG.Ameliorer.ask(b); }
  }, true);
  document.addEventListener('mousemove', e => { souris = e.target && e.target.id === 'game' ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; }, true);
  // ---------- les repères : l'anneau sous celui qu'on survole, le cadre autour de la construction visée par E ----------
  function cadre(g, b, t) {
    const x = b.tx * T + 2, y = b.ty * T + 2, w = b.w * T - 4, h = b.h * T - 4, a = 0.5 + Math.sin(t * 3) * 0.18, r = 7;
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    g.fillStyle = 'rgba(255,227,107,' + a * 0.22 + ')'; g.fill(); g.strokeStyle = 'rgba(255,236,150,' + a + ')'; g.lineWidth = 2; g.stroke();
  }
  window.addEventListener('load', () => {
    const M = CG.Magie; if (!M || !M.marks) return; const mk0 = M.marks;
    M.marks = function (g, t) {
      mk0.apply(this, arguments); const R = CG.R, cv = document.getElementById('game'); if (!libre()) { if (cv && cv.style.cursor) cv.style.cursor = ''; return; }
      // le survol (souris seulement : après quelques secondes sans bouger, on n'affiche plus rien)
      let c = null; if (souris && performance.now() - souris.t < Vi.SURVOL * 1000) { const k = CG.viewScale ? CG.viewScale() : 1, x = souris.x / k + R.cam.x, y = souris.y / k + R.cam.y; if (!ennemi(x, y)) c = Vi.sous(x, y); }
      if (cv) { const cur = c ? 'pointer' : ''; if (cv.style.cursor !== cur) cv.style.cursor = cur; }
      if (c) { const o = c.o, a = 0.6 + Math.sin(t * 5) * 0.15; g.strokeStyle = 'rgba(255,255,255,' + a + ')'; g.lineWidth = 2.2; g.beginPath(); g.ellipse(o.x, o.y + 1, 19, 7.5, 0, 0, TAU); g.stroke(); }
      // la construction que E va toucher
      if (R.t - viseT > 0.15 || R.t < viseT) { viseT = R.t; const it = D.findInteract(); vise = it && (it.type === 'ameliorer' || it.type === 'travaux') && it.obj && it.obj.tx !== undefined ? it.obj : null; }
      if (vise && CG.S.buildings.includes(vise)) cadre(g, vise, t);
    };
  });
})(window.CG);
