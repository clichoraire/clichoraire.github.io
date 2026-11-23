// Goblin Malin — les animaux évolués savent esquiver. Un animal tout jeune fonce et encaisse ; une fois évolué (Loup alpha,
// Grand ours...), il a appris : quand un monstre prépare une attaque qu'on voit venir (le champignon qui gonfle avant ses spores,
// le cercle ou la ligne d'un chef ennemi), il s'écarte le temps que ça passe, puis il y retourne.
// Pour ajouter un danger : pousser une fonction dans CG.Esquive.SOURCES (elle rend des cercles {x, y, r} ou des lignes {x, y, x2, y2, w}).
'use strict';
(function (CG) {
  const G = CG.G, P = CG.P; if (!P || !P.update) return;
  const Es = CG.Esquive = { MARGE: 26, VITESSE: 190, K: 2.4, /* il recule à VITESSE au moins, ou K fois sa vitesse */
    SOURCES: [
      R => R.enemies.filter(e => !e.dead && e.spore && !(e.charm > 0)).map(e => ({ x: e.x, y: e.y, r: e.spore.r })), // le champignon qui gonfle
      R => (R.zones || []).filter(z => z.t > 0) // les attaques annoncées des chefs : cercles et lignes
    ] };
  Es.sait = p => !!p.evo; // seulement une fois évolué
  function dangers(R) { let l = []; for (const f of Es.SOURCES) { try { l = l.concat(f(R) || []); } catch (e) { /* une source en panne n'arrête pas les autres */ } } return l; }
  // la poussée pour sortir du danger le plus pressant (ou rien)
  function fuite(p, L) { let fx = 0, fy = 0;
    for (const z of L) {
      if (z.x2 !== undefined) { const vx = z.x2 - z.x, vy = z.y2 - z.y, L2 = vx * vx + vy * vy || 1, k = CG.clamp(((p.x - z.x) * vx + (p.y - z.y) * vy) / L2, 0, 1), qx = z.x + vx * k, qy = z.y + vy * k, dx = p.x - qx, dy = p.y - qy, d = Math.hypot(dx, dy); if (d > (z.w || 40) / 2 + Es.MARGE) continue; const n = Math.sqrt(L2); if (d < 1) { fx += -vy / n; fy += vx / n; } else { fx += dx / d; fy += dy / d; } }
      else { const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy); if (d > (z.r || 60) + Es.MARGE) continue; if (d < 1) { fx += 1; } else { fx += dx / d; fy += dy / d; } } }
    const n = Math.hypot(fx, fy); return n > 0.01 ? { x: fx / n, y: fy / n } : null; }
  const up0 = P.update; P.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !R.enemies) return r;
    let L = null;
    for (const p of S.pets) { if (!Es.sait(p) || p.ko || p.ridden || p.evoT > 0) { if (p.esq) p.esq = 0; continue; }
      if (L === null) { L = dangers(R); } if (!L.length) { p.esq = 0; continue; }
      const f = fuite(p, L); if (!f) { p.esq = 0; continue; }
      const k = P.KINDS && P.KINDS[p.kind], v = Math.max(Es.VITESSE, ((k && k.spd) || 70) * Es.K) * dt;
      if (!G.slide(p, f.x * v, f.y * v, 8)) G.slide(p, -f.y * v, f.x * v, 8); // un mur dans le dos : il file de côté
      p.moving = true; p.step = (p.step || 0) + dt * 12; p.face = f.x > 0 ? 1 : -1; p.path = null; p.atkCd = Math.max(p.atkCd || 0, 0.25); /* il ne mord pas en reculant */
      if (!p.esq) { p.esq = 1; if (CG.onScreen(p.x, p.y)) G.text(p.x, p.y - 46, '💨', '#fff'); } }
    return r;
  };
})(window.CG);
