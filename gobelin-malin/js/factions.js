// Goblin Malin — chacun son camp. Avant, tout ce qui n'était pas du clan fonçait sur le clan, côte à côte, sans se regarder.
// Maintenant :
//   - les monstres (bêtes sauvages, morts-vivants) s'en prennent à tout le monde : au clan, mais aussi aux humains, aux elfes
//     noirs, aux hommes-lézards et aux démons qui passent près d'eux ;
//   - ces peuples-là se défendent et attaquent les monstres qu'ils croisent en chemin ;
//   - les gnomes sont du côté des monstres : ils ne se battent pas entre eux.
// Deux peuples différents ne se battent pas entre eux, les monstres non plus. Ceux d'une même bande (une même attaque, un même
// lieu, un même campement) restent ensemble. Rien de tout ça dans les donjons, ni pour les chefs ennemis.
// Tout est réglable dans CG.Factions.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, dist = CG.dist;
  const Fa = CG.Factions = { PEUPLES: { humain: 1, elfeNoir: 1, lezard: 1, demon: 1 }, VOIT: 230, LACHE: 400, TIC: 0.4, ACTIF: false }; /* ACTIF : faux = les ennemis ne se battent plus entre eux (une attaque arrivait décimée par les bêtes du chemin) */ /* VOIT : distance à laquelle deux camps se sautent dessus ; LACHE : distance où ils abandonnent */
  // le camp d'un ennemi : son peuple, ou « monstre » (les gnomes aussi). null : il ne prend pas part à ces bagarres
  Fa.camp = function (e) { const d = e && CG.ENEMIES[e.type]; if (!d || d.struct || e.struct || d.boss || e.grosArene || d.race === 'repaire') return null; return Fa.PEUPLES[d.race] ? d.race : 'monstre'; };
  const pret = e => !e.dead && !e.struct && !e.retreat && !e.voleur && !e.calm && !(e.charm > 0) && !(e.sleepT > 0) && !e.arene && !e.grotte && !e.hidden;
  const memeBande = (a, b) => (!a.wild && !b.wild) || (a.site && a.site === b.site) || (a.campRef && a.campRef === b.campRef);
  Fa.ennemis = function (a, b) { if (!Fa.ACTIF || a === b || !pret(a) || !pret(b)) return false; const ca = Fa.camp(a), cb = Fa.camp(b); if (!ca || !cb || ca === cb || (ca !== 'monstre' && cb !== 'monstre')) return false; return !memeBande(a, b); };
  const ici = () => !CG.Mondes || CG.Mondes.ici() < 2;
  const notre = o => !!o && !(o.type && CG.ENEMIES[o.type]); // le chef, un gobelin, un animal : quelqu'un du clan
  function lacher(e) { const b = e.fac; e.fac = null; if (e.event && !e.hunt) { if (e.aggro === b) { e.aggro = null; e.path = null; e.provoked = false; e.blase = !!e._facBl; } } else if (e.target === b) { e.target = null; e.seek = 0; } }
  function chercher(e) {
    const R = CG.R; let best = null, bd = Fa.VOIT;
    for (const o of R.enemies) { if (!Fa.ennemis(e, o)) continue; const d = dist(e, o); if (d >= bd) continue; if (e.wild && dist(o, e.wild) > (e.leash || 380)) continue; bd = d; best = o; }
    if (!best) return; const cur = e.event && !e.hunt ? e.aggro : e.target; if (notre(cur) && dist(e, cur) <= bd) return; /* déjà aux prises avec quelqu'un du clan, plus près */
    if (!W.lineClear(e.x, e.y, best.x, best.y)) return;
    e.fac = best; e._facBl = e.blase; e.path = null;
  }
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R;
    if (S && R && R.enemies && R.enemies.length > 1 && !R.night && ici()) {
      tic -= dt; const cherche = tic <= 0; if (cherche) tic = Fa.TIC;
      for (const e of R.enemies) {
        if (e.fac) { const b = e.fac; if (b.dead || !R.enemies.includes(b) || !Fa.ennemis(e, b) || dist(e, b) > Fa.LACHE) lacher(e); }
        else if (cherche && pret(e) && Fa.camp(e)) chercher(e);
        const b = e.fac; if (!b) continue;
        if (e.event && !e.hunt) { e.aggro = b; e.aggroT = 9; e.provoked = true; } else { e.target = b; e.seek = Math.max(e.seek || 0, 0.3); }
      }
    }
    return up0.apply(this, arguments);
  };
  // un archer ou un mage ennemi qui vise un autre ennemi : son tir le touche pour de bon (les tirs ennemis ne blessaient que le clan)
  const sh0 = G.shoot; G.shoot = function (from, to, kind, dmg, team) {
    if (team === 'e' && from && to && from.type && to.type && CG.ENEMIES[from.type] && CG.ENEMIES[to.type] && from.fac === to) { G.hurtEnemy(to, dmg, from); const R = CG.R; if (R.bolts) R.bolts.push({ x1: from.x, y1: from.y - 20, x2: to.x, y2: to.y - 16, life: 0.2 }); return; }
    return sh0.apply(this, arguments);
  };
})(window.CG);
