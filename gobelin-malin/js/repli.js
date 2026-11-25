// Clan Gobelin — le repli : un combattant presque mort lâche le combat. S'il y a un guérisseur à son poste, il court se faire soigner ;
// sinon il se met à l'abri. Pareil pour les animaux et les alliés. Et un repère qui bat sur la mini-carte tant que le village est attaqué.
'use strict';
(function (CG) {
  const G = CG.G, T = CG.TILE, Re = CG.Repli = { SEUIL: 0.5, RETOUR: 0.8, CALME: 340, PEUR: 150 }; // PEUR : un ennemi plus près que ça, et le blessé ne reste pas planté là
  const CRI = ['Je me replie !', 'Aïe aïe aïe ! Je n\'en peux plus !', 'Couvrez-moi, je recule !', 'J\'ai mon compte !', 'Je reviens, je vais me faire soigner !'];
  // la hutte de guérisseur la plus proche où quelqu'un soigne vraiment
  Re.hutte = function (o) {
    const S = CG.S; if (!S.goblins.some(g => g.job === 'guerisseur' && !g.exile)) return null; let b = null, bd = 1e9;
    for (const h of S.buildings) { if (h.type !== 'guerisseur' || h.site || h.ruin) continue; const d = Math.hypot((h.tx + 1) * T - o.x, (h.ty + 2) * T - o.y); if (d < bd) { bd = d; b = h; } }
    return b;
  };
  const danger = (o, r) => { for (const e of CG.R.enemies) if (!e.dead && !e.calm && !e.struct && Math.hypot(e.x - o.x, e.y - o.y) < r) return true; return false; };
  const plusPres = (x, y) => { let bd = 1e9; for (const e of CG.R.enemies) if (!e.dead && !e.calm && !e.struct) { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) bd = d; } return bd; };
  // un coin du village loin des monstres : devant une hutte, près du feu, chez le guérisseur... celui dont l'ennemi le plus proche est le plus loin
  Re.refuge = function (o) {
    const S = CG.S, l = [G.firePos()]; for (const b of S.buildings) if ((b.type === 'hut' || b.type === 'chief' || b.type === 'guerisseur') && !b.site) { const d = G.door(b); l.push({ x: d.x + 24, y: d.y + 18 }); }
    let best = null, bs = -1e9; for (const q of l) { if (!CG.W.walkPx(q.x, q.y)) continue; const s = Math.min(600, plusPres(q.x, q.y)) - 0.35 * Math.hypot(q.x - o.x, q.y - o.y); if (s > bs) { bs = s; best = q; } }
    return best;
  };
  function place(o, h) { const d = G.door(h), k = (o.id || 0) % 5; return { x: d.x - 34 + k * 17, y: d.y + 20 + (k % 2) * 16 }; } // devant la hutte, bien dans le cercle de soin

  // ---------- les gobelins qui se battent (gardes, miliciens) ----------
  Re.step = function (g, dt) {
    const R = CG.R, S = CG.S, mh = G.gobMaxHp(g);
    if (!g.repli) {
      if (g.job === 'guerisseur' || g.perch || g.hidden || g.hp <= 0 || g.hp > mh * (g.job === 'garde' ? Re.SEUIL : CG.Fuite ? CG.Fuite.PV : Re.SEUIL) || !(g.job === 'garde' || G.militia(g)) || !danger(g, 260)) return false;
      g.repli = { h: Re.hutte(g) }; G.resetGoblin(g); g.repli = g.repli || { h: Re.hutte(g) }; g.state = 'repli'; g.melee = false;
      const but = g.repli.h ? place(g, g.repli.h) : G.door(G.shelter(g)); g.repli.but = but; if (!G.goTo(g, but.x, but.y)) { g.repli = null; return false; }
      G.say(g, CG.pick(CRI), 2.6); return true;
    }
    const r = g.repli;
    if (g.hp >= mh * Re.RETOUR || (!R.alarm && !danger(g, Re.CALME) && (!r.h || g.hp >= mh * 0.5))) { g.repli = null; g.bubble = null; if (g.hidden) { g.hidden = false; G.unstick(g, 8); } G.resetGoblin(g); return false; }
    if (r.h && (r.h.gone || !CG.S.buildings.includes(r.h))) { g.repli = null; return false; }
    g.state = 'repli'; g.pose = null;
    if (g.hidden) return true;
    if (r.h && danger(g, Re.PEUR)) { // les monstres arrivent jusqu'à lui : il ne reste pas là à se faire taper, il court se cacher dans une hutte
      r.h = null; r.la = false; const d = G.door(G.shelter(g)); r.but = d; if (!G.goTo(g, d.x, d.y)) { g.repli = null; return false; }
      G.say(g, CG.pick(['Ils arrivent ! Je me cache !', 'Pas ici ! Je file à l\'abri !', 'Au secours, ils me suivent !']), 2.4); return true;
    }
    g.bubble = '🩹';
    if (!r.la) { if (G.follow(g, 150, dt)) { r.la = true; if (!r.h) { g.hidden = true; g.bubble = null; } } return true; }
    g.moving = false; return true; // devant la hutte : il attend que le guérisseur s'occupe de lui
  };
  const rs0 = G.resetGoblin; G.resetGoblin = function (g) { const r = g.repli; rs0.apply(this, arguments); if (r) g.repli = r; };

  // ---------- les animaux et les alliés ----------
  // Trois cas. Au village avec un guérisseur : il va devant sa hutte et y reste jusqu'à être remis (même sans monstre autour,
  // dès qu'il est sous SOIN). Au village sans guérisseur : il s'éloigne des monstres. Loin du village (forêt, donjon, arène) :
  // il passe derrière le chef. Et dans tous les cas : un monstre tout près, ou un chemin bouché, et il s'écarte au lieu de rester planté là.
  Re.SOIN = 0.7; Re.VILLAGE = 900; Re.ATTENTE = 30; Re.PAUSE = 60;
  const ici0 = () => !CG.Mondes || !CG.Mondes.ici || CG.Mondes.ici() === 0;
  const auVillage = o => { if (!ici0()) return false; const f = G.firePos(); return !!f && Math.hypot(o.x - f.x, o.y - f.y) < Re.VILLAGE; };
  const proche = o => { let b = null, bd = 1e9; for (const e of CG.R.enemies) if (!e.dead && !e.calm && !e.struct) { const d = Math.hypot(e.x - o.x, e.y - o.y); if (d < bd) { bd = d; b = e; } } return b; };
  // un point où l'on peut marcher, à l'opposé de l'ennemi le plus proche
  Re.ecart = function (o) {
    const e = proche(o), a0 = e ? Math.atan2(o.y - e.y, o.x - e.x) : Math.random() * 6.283;
    for (const d of [150, 90, 50]) for (const da of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.3, -2.3, 3.14]) { const x = o.x + Math.cos(a0 + da) * d, y = o.y + Math.sin(a0 + da) * d; if (CG.W.walkPx(x, y) && CG.W.walkPx((x + o.x) / 2, (y + o.y) / 2)) return { x, y }; }
    return null;
  };
  // derrière le chef, du côté opposé aux monstres
  function derriere(o) { const c = CG.S.player, e = proche(c); if (e) { const d = Math.hypot(c.x - e.x, c.y - e.y) || 1; for (const k of [66, 40]) { const x = c.x + (c.x - e.x) / d * k, y = c.y + (c.y - e.y) / d * k; if (CG.W.walkPx(x, y)) return { x, y }; } } return Re.ecart(o) || { x: c.x, y: c.y }; }
  const chezLeChef = () => { const b = G.find('chief'); if (!b) return null; const d = G.door(b); return { x: d.x + 30, y: d.y + 22 }; };
  const pu0 = CG.P.update; CG.P.update = function (dt) {
    const S = CG.S, R = CG.R, mis = [];
    for (const p of S.pets) {
      if (p.ko || p.ridden || p.evoT > 0 || p.tombe || p.enSoin) { p.repli = null; continue; } const mh = CG.P.maxHp(p), k = CG.P.KINDS[p.kind];
      if (!p.repli) {
        if (p.hp <= 0) continue; const vil = auVillage(p), peur = p.hp <= mh * Re.SEUIL && danger(p, 260);
        const h = vil ? Re.hutte(p) : null, soin = !peur && h && p.hp < mh * Re.SOIN && !(R.t < p.soinPause) && auVillage(S.player); // blessé, au calme, le chef au village : il va voir le guérisseur
        if (!peur && !soin) continue;
        p.repli = { h, dehors: !vil, but: h ? place(p, h) : vil ? (chezLeChef() || Re.ecart(p) || { x: p.x, y: p.y }) : derriere(p), sx: p.x, sy: p.y, st: 1, hp: p.hp, att: 0 }; p.path = null; G.text(p.x, p.y - 44, '🩹', '#fff', true);
      }
      const r = p.repli, pres = danger(p, Re.PEUR), calme = !R.alarm && !danger(p, Re.CALME);
      if (p.hp >= mh * Re.RETOUR || (r.h && !S.buildings.includes(r.h)) || (r.dehors ? calme : !r.h ? calme : calme && !auVillage(S.player))) { p.repli = null; continue; }
      if (r.dehors) { r.vu = (r.vu || 0) - dt; if (r.vu <= 0) { r.vu = 0.5; const q = pres ? (Re.ecart(p) || derriere(p)) : derriere(p); /* un monstre sur lui : il s'en éloigne d'abord */ if (Math.hypot(q.x - r.but.x, q.y - r.but.y) > 24) { r.but = q; p.path = null; } } }
      else { r.fuite = (r.fuite || 0) - dt; // un monstre trop près : il change de coin plutôt que d'attendre les coups
        if (r.fuite <= 0 && pres) { r.fuite = 1.2; let q = Re.refuge(p); if (!q || Math.hypot(q.x - p.x, q.y - p.y) < 60 || Math.hypot(q.x - r.but.x, q.y - r.but.y) < 30) q = Re.ecart(p); if (q) { r.but = q; r.ecarte = true; p.path = null; } }
        else if (r.ecarte && r.h && !danger(p, 260)) { r.ecarte = false; r.but = place(p, r.h); p.path = null; } } // le calme revenu, il retourne devant la hutte
      mis.push(p); p.ridden = true; // le temps de la mise à jour normale : il ne cherche pas la bagarre
      p.atkCd -= dt; if (p.atkAnim > 0) p.atkAnim -= dt * 4; if (p.flash > 0) p.flash -= dt; p.moving = false; p.sleep = false;
      const dx = r.but.x - p.x, dy = r.but.y - p.y, d = Math.hypot(dx, dy), spd = k.spd * 1.25;
      if (d > 16) { if (k.fly) { const st = Math.min(d, spd * dt); p.x += dx / d * st; p.y += dy / d * st; p.moving = true; p.step += dt * 3; if (Math.abs(dx) > 3) p.face = dx > 0 ? 1 : -1; } else G.chase(p, r.but.x, r.but.y, spd, dt);
        r.st -= dt; if (r.st <= 0) { if (Math.hypot(p.x - r.sx, p.y - r.sy) < 8) { const q = Re.ecart(p); if (q) { r.but = q; r.ecarte = true; p.path = null; } else if (!pres) { p.repli = null; } } r.st = 1; r.sx = p.x; r.sy = p.y; } } // il n'avance pas (chemin bouché) : il change de but
      else if (r.h && !r.ecarte) { if (p.hp > r.hp + 0.5) { r.hp = p.hp; r.att = 0; } else if ((r.att += dt) > Re.ATTENTE && !danger(p, 260)) { p.repli = null; p.soinPause = R.t + Re.PAUSE; } } // devant la hutte et personne ne le soigne : il n'attend pas toute la journée
    }
    try { return pu0.apply(this, arguments); } finally { mis.forEach(p => { p.ridden = false; }); }
  };
  // un petit pansement au-dessus de l'animal qui se replie
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (c, t) {
    mk0.apply(this, arguments); const S = CG.S; if (!S) return;
    for (const p of S.pets) { if (!p.repli || p.ko || !CG.onScreen(p.x, p.y)) continue; c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText('🩹', p.x, p.y - 44 + Math.sin(t * 5 + p.id) * 2); }
  };

  // ---------- le village est attaqué : un repère qui bat sans arrêt sur la mini-carte, là où ça cogne ----------
  let pt = 0;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, S = CG.S;
    if (S && S.goblins && S.vieClan !== 2) { S.vieClan = 2; S.goblins.forEach(g => { if (g.hp > 0 && !g.dead) g.hp = G.gobMaxHp(g); }); (S.pets || []).forEach(p => { if (!p.ko && p.hp > 0) p.hp = CG.P.maxHp(p); }); } /* la vie du clan a monté : une vieille partie remet tout le monde à sa nouvelle vie, une seule fois */
    if (!R || !S || !R.alarm || !R.pings) return; pt -= dt; if (pt > 0) return; pt = 1.6;
    const f = G.firePos(); let n = 0, x = 0, y = 0;
    for (const e of R.enemies) { if (e.dead || e.struct || e.calm || e.wild || Math.hypot(e.x - f.x, e.y - f.y) > 760) continue; n++; x += e.x; y += e.y; }
    if (!n) return; R.pings = R.pings.filter(q => !q.siege);
    R.pings.push({ x: x / n, y: y / n, t0: performance.now() - 700, icon: '⚔️', foe: true, dur: 3200, siege: true });
  };
})(window.CG);
