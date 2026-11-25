// Goblin Malin — l'esquive. Quand un monstre prépare une attaque qu'on voit venir (le champignon qui gonfle avant ses spores,
// le cercle ou la ligne d'un chef ennemi), les alliés s'écartent le temps que ça passe, puis ils y retournent.
// Chacun a son adresse à lui, par sorte d'attaque : doué (il file tout de suite), ordinaire (il met un instant à réagir) ou
// maladroit (il réagit tard et recule mal : souvent, il encaisse). Gobelins et animaux, tous différents.
//   Un animal passé par l'école des animaux sait tout esquiver. Un animal évolué ou un gobelin évolué gagne un cran partout.
// Tout est réglable dans CG.Esquive. Pour ajouter un danger : pousser une fonction dans CG.Esquive.SOURCES (elle rend des cercles
// {x, y, r} ou des lignes {x, y, x2, y2, w} ; « ty » dit la sorte d'attaque, « cle » l'objet qui sert à compter son âge).
'use strict';
(function (CG) {
  const G = CG.G, P = CG.P; if (!P || !P.update) return;
  const Es = CG.Esquive = { MARGE: 26, VITESSE: 190, K: 2.4, /* il recule à VITESSE au moins, ou K fois sa vitesse */
    TYPES: { cercle: 'coups au sol', charge: 'charges', souffle: 'souffles de feu', spore: 'nuages de spores' },
    NIV: [{ attente: 1.1, k: 0.55 }, { attente: 0.4, k: 0.85 }, { attente: 0, k: 1.1 }], /* maladroit, ordinaire, doué : le temps avant de réagir (secondes), et sa vitesse de recul */
    SOURCES: [
      R => R.enemies.filter(e => !e.dead && e.spore && !(e.charm > 0)).map(e => ({ x: e.x, y: e.y, r: e.spore.r, ty: 'spore', cle: e.spore })), // le champignon qui gonfle
      R => (R.zones || []).filter(z => z.t > 0).map(z => Object.assign({}, z, { ty: z.k === 'ligne' ? (z.feu ? 'souffle' : 'charge') : 'cercle', cle: z })) // les attaques annoncées des chefs : cercles et lignes
    ] };
  // l'adresse de chacun : toujours la même pour le même gobelin ou le même animal (tirée de son numéro), avec au moins un point fort et un point faible
  const memo = new WeakMap();
  Es.profil = function (o) {
    const ks = Object.keys(Es.TYPES), plus = o.evo || o.cls ? 1 : 0, cle = (o.dresse ? 'd' : '') + plus; let m = memo.get(o); if (m && m.cle === cle) return m.p;
    const p = {}; if (o.dresse) ks.forEach(k => { p[k] = 2; });
    else { let s = ((o.id || 1) * 2654435761 + (o.name ? o.name.length * 97 : 0)) >>> 0; const al = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      ks.forEach(k => { const a = al(); p[k] = a < 0.3 ? 0 : a < 0.65 ? 1 : 2; }); const fort = ks[Math.floor(al() * ks.length)]; let faible = ks[Math.floor(al() * ks.length)]; if (faible === fort) faible = ks[(ks.indexOf(fort) + 1) % ks.length];
      p[fort] = 2; p[faible] = 0; if (plus) ks.forEach(k => { p[k] = Math.min(2, p[k] + 1); }); }
    memo.set(o, { cle, p }); return p; };
  Es.texte = function (o) { const p = Es.profil(o), ks = Object.keys(Es.TYPES), bon = ks.filter(k => p[k] === 2), mal = ks.filter(k => p[k] === 0); if (bon.length === ks.length) return 'Sait tout esquiver';
    return (bon.length ? 'Doué : ' + bon.map(k => Es.TYPES[k]).join(', ') : '') + (bon.length && mal.length ? ' · ' : '') + (mal.length ? 'Maladroit : ' + mal.map(k => Es.TYPES[k]).join(', ') : ''); };
  Es.sait = () => true; /* tout le monde essaie, chacun à sa façon (avant : seulement les animaux évolués) */
  const ages = new WeakMap();
  function dangers(R) { let l = []; for (const f of Es.SOURCES) { try { l = l.concat(f(R) || []); } catch (e) { /* une source en panne n'arrête pas les autres */ } }
    l.forEach(z => { const c = z.cle || z; if (typeof c !== 'object') { z.age = 9; return; } let t0 = ages.get(c); if (t0 === undefined) { t0 = R.t || 0; ages.set(c, t0); } z.age = (R.t || 0) - t0; if (!z.ty) z.ty = z.x2 !== undefined ? 'charge' : 'cercle'; }); return l; }
  // la poussée pour sortir du danger le plus pressant (ou rien), et le cran d'adresse le plus bas parmi ceux qui le menacent
  function fuite(p, L, prof) { let fx = 0, fy = 0, niv = 2;
    for (const z of L) { const n0 = prof[z.ty] === undefined ? 1 : prof[z.ty]; if (z.age < Es.NIV[n0].attente) continue;
      if (z.x2 !== undefined) { const vx = z.x2 - z.x, vy = z.y2 - z.y, L2 = vx * vx + vy * vy || 1, k = CG.clamp(((p.x - z.x) * vx + (p.y - z.y) * vy) / L2, 0, 1), qx = z.x + vx * k, qy = z.y + vy * k, dx = p.x - qx, dy = p.y - qy, d = Math.hypot(dx, dy); if (d > (z.w || 40) / 2 + Es.MARGE) continue; const n = Math.sqrt(L2); if (d < 1) { fx += -vy / n; fy += vx / n; } else { fx += dx / d; fy += dy / d; } }
      else { const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy); if (d > (z.r || 60) + Es.MARGE) continue; if (d < 1) { fx += 1; } else { fx += dx / d; fy += dy / d; } }
      niv = Math.min(niv, n0); }
    const n = Math.hypot(fx, fy); return n > 0.01 ? { x: fx / n, y: fy / n, k: Es.NIV[niv].k } : null; }
  function bouge(o, f, base, dt) { const v = Math.max(Es.VITESSE, base * Es.K) * f.k * dt;
    if (!G.slide(o, f.x * v, f.y * v, 8)) G.slide(o, -f.y * v, f.x * v, 8); // un mur dans le dos : il file de côté
    o.moving = true; o.step = (o.step || 0) + dt * 12; o.face = f.x > 0 ? 1 : -1; o.atkCd = Math.max(o.atkCd || 0, 0.25); /* il ne frappe pas en reculant */
    if (!o.esq) { o.esq = 1; if (CG.onScreen(o.x, o.y)) G.text(o.x, o.y - 46, '💨', '#fff'); } }
  let L = null;
  const up0 = P.update; P.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; L = null; if (!S || !R || !R.enemies) return r;
    L = dangers(R);
    for (const p of S.pets) { if (p.ko || p.ridden || p.evoT > 0 || !L.length) { if (p.esq) p.esq = 0; continue; }
      const f = fuite(p, L, Es.profil(p)); if (!f) { p.esq = 0; continue; }
      const k = P.KINDS && P.KINDS[p.kind]; bouge(p, f, (k && k.spd) || 70, dt); p.path = null; }
    return r;
  };
  // les gobelins aussi (les animaux passent avant, dans la même image : la liste des dangers est déjà prête)
  const ug0 = G.update; G.update = function (dt) {
    const r = ug0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !R.enemies || !L || !L.length) return r;
    for (const g of S.goblins) { if (g.hidden || g.exile || g.perch || g.nap || g.dead || g.hp <= 0 || g.bebe || g.cine) { if (g.esq) g.esq = 0; continue; }
      const f = fuite(g, L, Es.profil(g)); if (!f) { g.esq = 0; continue; } bouge(g, f, 70, dt); }
    return r;
  };
})(window.CG);
