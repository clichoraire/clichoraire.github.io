// Goblin Malin — de nouveaux objets à ramasser par terre :
//   le cœur rose : rend 2 de vie ; la goutte bleue : rend 2 de mana (rien de permanent) ;
//   le cœur d'or et la goutte d'or (rares, au fond des coffres) : +vie ou +mana maximum, pour toujours. Il faut les ramasser.
//   Et les squelettes ordinaires, certains seulement, lancent de temps en temps un os qui revient comme un boomerang.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Art = CG.Art, W = CG.W, TAU = Math.PI * 2, rand = CG.rand;
  const Ob = CG.Objets = { SOIN: 2, MANA: 2, COEUR: 0.06, GOUTTE: 0.045, COFFRE: 0.45, ARME: 0.04, LANCEUR: 0.4, DELAI: [15, 24], VITESSE: 165, PORTEE: [90, 270], ALLER: 250, PREP: 0.8 };
  const MIENS = { coeur: 1, mana: 1, coeurOr: 1, manaOr: 1, objet: 1 };
  // les objets trouvés (arme, armure, outil) : ils tombent par terre comme le reste, et c'est en les ramassant qu'on apprend ce que c'est.
  // Une phrase toute courte, sans chiffres ; la qualité se lit en étoiles à côté du nom.
  Ob.PHRASE = { epee: 'Donne-la à un gobelin : il frappera plus fort.', arc: 'Donne-le à un gobelin : il tirera de loin.', armure: 'Donne-la à un gobelin : il sera plus solide.', pioche: 'Pour ramasser plus de minerai.', hache: 'Pour ramasser plus de bois.', gant: 'Pour cueillir plus de baies.' };
  Ob.lacher = function (x, y, k, n) { G.drop(x, y, { kind: 'objet', k, n }); G.puff(x, y - 20, '#bfe8ff', 24, 150, 4); CG.sfx('discovery'); };
  // ---------- ramasser ----------
  const pk0 = G.pickUp; G.pickUp = function (d) {
    if (!d || !MIENS[d.kind]) return pk0.apply(this, arguments); const p = CG.S.player, n = d.n || 1;
    if (d.kind === 'objet') { const Bq = CG.Banque, z = Bq.deposer(d.k, n, 1, 'sac'), nom = Bq.IC[d.k] + ' ' + Bq.NOMS[d.k][n];
      G.text(p.x, p.y - 84, nom, '#d0ecff', true); G.puff(p.x, p.y - 24, '#bfe8ff', 18, 140, 4); CG.R.rings.push({ x: p.x, y: p.y - 10, r: 50, life: 0.5, col: '#bfe8ff' }); CG.sfx('heal');
      G.banner(nom + ' ' + '★'.repeat(n), Ob.PHRASE[d.k] || (z === 'sac' ? 'C\'est dans ton sac.' : 'C\'est au coffre du camp.'), '#d0ecff'); if (z !== 'sac') CG.UI.toast('🎒 Ton sac est plein : ' + nom + ' est au coffre du camp.'); return; }
    if (d.kind === 'coeur') { const v = Ob.SOIN * n; p.hp = Math.min(p.maxhp, p.hp + v); G.text(d.x, d.y - 30, '+' + v + ' ❤', '#ff9ac0'); CG.sfx('ok'); }
    else if (d.kind === 'mana') { const v = Ob.MANA * n; p.mp = Math.min(p.maxmp, p.mp + v); G.text(d.x, d.y - 30, '+' + v + ' 💧', '#9ad0ff'); CG.sfx('ok'); }
    else { const vie = d.kind === 'coeurOr'; if (vie) { p.maxhp += n; p.hp += n; } else { p.maxmp += n; p.mp += n; }
      G.text(p.x, p.y - 84, (vie ? '💛 +' + n + ' vie max' : '💛 +' + n + ' mana max'), '#ffe36b', true); G.puff(p.x, p.y - 24, '#ffd84a', 22, 150, 4); for (let i = 0; i < 2; i++) CG.R.rings.push({ x: p.x, y: p.y - 10, r: 46 + i * 34, life: 0.45 + i * 0.15, col: '#ffe36b' }); CG.sfx('heal');
      G.banner(vie ? '💛 Cœur d\'or' : '💛 Goutte d\'or', vie ? 'Tu as plus de vie, pour toujours !' : 'Tu as plus de mana, pour toujours !', '#ffe9a8'); }
  };
  // ---------- où on en trouve ----------
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e) { const r = he0.apply(this, arguments);
    if (e && e.dead && !e.objLache && !e.struct) { e.objLache = true; const boss = CG.ENEMIES[e.type] && CG.ENEMIES[e.type].boss, k = Math.random(); if (k < Ob.COEUR) G.drop(e.x, e.y, { kind: 'coeur', n: boss ? 3 : 1 }); else if (k < Ob.COEUR + Ob.GOUTTE) G.drop(e.x, e.y, { kind: 'mana', n: boss ? 3 : 1 }); }
    return r; };
  const oc0 = D.openChest; D.openChest = function (c) { const r = oc0.apply(this, arguments); if (c && c.kind !== 'piege' && Math.random() < Ob.COFFRE) { const n = CG.irand(1, 3); for (let i = 0; i < n; i++) G.drop(c.x, c.y, { kind: Math.random() < 0.55 ? 'coeur' : 'mana', n: 1 }); }
    const Bq = CG.Banque; if (c && c.kind !== 'piege' && Bq && Math.random() < Ob.ARME) { // très rarement : une arme ou une armure pour un gobelin
      const k = ['epee', 'arc', 'armure'][CG.irand(0, 2)], q = Math.random(), n = q < 0.5 ? 1 : q < 0.85 ? 2 : 3; Ob.lacher(c.x, c.y, k, n); } // elle tombe par terre avec le reste : on la ramasse en marchant dessus
    return r; };
  // ---------- leurs dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  function coeur(g, s, a, b, c) { const p = () => { g.beginPath(); g.moveTo(0, 7 * s); g.bezierCurveTo(-11 * s, -1 * s, -7.5 * s, -9.5 * s, 0, -4 * s); g.bezierCurveTo(7.5 * s, -9.5 * s, 11 * s, -1 * s, 0, 7 * s); g.closePath(); }; g.fillStyle = b; p(); g.fill(); g.save(); g.clip(); ell(g, -1.5 * s, -3.5 * s, 8 * s, 5.5 * s, a); g.restore(); ell(g, -3.2 * s, -4.2 * s, 2 * s, 1.3 * s, c, -0.5); }
  function goutte(g, s, a, b, c) { const p = () => { g.beginPath(); g.moveTo(0, -9 * s); g.bezierCurveTo(8 * s, 0, 7 * s, 8 * s, 0, 8 * s); g.bezierCurveTo(-7 * s, 8 * s, -8 * s, 0, 0, -9 * s); g.closePath(); }; g.fillStyle = b; p(); g.fill(); g.save(); g.clip(); ell(g, -1.5 * s, 0.5 * s, 5 * s, 7 * s, a); g.restore(); ell(g, -2.2 * s, 1 * s, 1.5 * s, 2.4 * s, c, 0.3); }
  const dr0 = Art.drops; Art.drops = function (g, list, t) {
    const autres = [], moi = []; for (const d of list) (MIENS[d.kind] ? moi : autres).push(d); dr0.call(this, g, autres, t);
    for (const d of moi) { if (d.d > 0 || !CG.onScreen(d.x, d.y)) continue; const fly = d.f < 1, obj = d.kind === 'objet', or = obj || d.kind === 'coeurOr' || d.kind === 'manaOr', bob = fly ? 0 : Math.sin(t * 3 + d.seed) * 2, y = d.y - d.h - 8 - bob, s = or ? 1.25 : 0.95;
      ell(g, d.x, d.y + 2, 8 * (fly ? 0.6 : 1), 3, 'rgba(0,0,0,0.26)');
      if (!fly) ell(g, d.x, y, (or ? 17 : 11) + Math.sin(t * 4 + d.seed) * 2, (or ? 17 : 11) + Math.sin(t * 4 + d.seed) * 2, obj ? 'rgba(150,215,255,0.34)' : or ? 'rgba(255,220,90,0.32)' : d.kind === 'coeur' ? 'rgba(255,130,180,0.25)' : 'rgba(110,180,255,0.25)');
      g.save(); g.translate(d.x, y); if (fly) g.rotate(d.f * 9 + d.seed); else g.scale(1 + Math.sin(t * 5 + d.seed) * 0.06, 1 + Math.sin(t * 5 + d.seed) * 0.06);
      if (obj) { g.fillStyle = '#fff'; g.font = '23px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(CG.Banque.IC[d.k] || '🎁', 0, 0); g.textBaseline = 'alphabetic'; }
      else if (d.kind === 'coeur') coeur(g, s, '#ff9ac6', '#f0609a', '#ffe0ee'); else if (d.kind === 'coeurOr') coeur(g, s, '#ffe680', '#e0a81e', '#fffbe0'); else if (d.kind === 'mana') goutte(g, s, '#8fd0ff', '#3a8cf0', '#e0f4ff'); else goutte(g, s, '#ffe680', '#e0a81e', '#fffbe0');
      if (or && !fly) { const k = (t * 1.3 + d.seed) % 1; g.globalAlpha = 1 - k; g.fillStyle = '#fff'; g.beginPath(); g.arc(9 * Math.cos(t * 2 + d.seed), -4 - k * 14, 1.4, 0, TAU); g.fill(); }
      g.restore(); }
  };
  // ---------- l'os boomerang des squelettes ordinaires ----------
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const o of S.goblins) if (!o.hidden && o.ko !== true) l.push(o); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); return l; };
  const frappe = (o, dmg) => { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); };
  const sp0 = G.spawnEnemy; G.spawnEnemy = function (type) { const e = sp0.apply(this, arguments); if (e && e.type === 'squelette' && !e.grosArene && Math.random() < Ob.LANCEUR) { e.lanceur = true; e.bmCd = rand(5, Ob.DELAI[0]); } return e; };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night || R.cine) return; const B = R.boomerangs || (R.boomerangs = []);
    for (const e of R.enemies) {
      if (!e.lanceur || e.dead || e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.calm) continue;
      if (e.bmPrep) { e.bmPrep.t -= dt; e.atkCd = Math.max(e.atkCd, 0.3); if (e.bmPrep.t > 0) continue; const q = e.bmPrep; e.bmPrep = null; e.atkAnim = 1; B.push({ e, x: e.x, y: e.y - 16, ux: q.ux, uy: q.uy, d: 0, max: q.max, retour: false, rot: 0, vus: new Set(), dmg: e.dmg * 0.8 }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); continue; }
      e.bmCd -= dt; if (e.bmCd > 0) continue; let tg = null, bd = Ob.PORTEE[1]; for (const o of nous()) { const q = Math.hypot(o.x - e.x, o.y - e.y); if (q < bd) { bd = q; tg = o; } } if (!tg) { e.bmCd = 1; continue; } const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy); // il vise le plus proche : le chef, un gobelin ou un compagnon
      if (d < Ob.PORTEE[0] || d > Ob.PORTEE[1] || !W.lineClear(e.x, e.y, tg.x, tg.y)) { e.bmCd = 1; continue; }
      e.bmCd = rand(Ob.DELAI[0], Ob.DELAI[1]); e.bmPrep = { t: Ob.PREP, ux: dx / d, uy: dy / d, max: Math.min(Ob.ALLER, d + 50) }; e.face = dx >= 0 ? 1 : -1; G.text(e.x, e.y - 50, '🦴', '#fff', true);
    }
    for (const b of B) { const v = Ob.VITESSE * dt; b.rot += dt * 11;
      if (!b.retour) { b.x += b.ux * v; b.y += b.uy * v; b.d += v; if (b.d >= b.max) { b.retour = true; b.vus = new Set(); } }
      else { const e = b.e, tx = e.dead ? b.x : e.x, ty = e.dead ? b.y : e.y - 16, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy); if (e.dead || d < 14) { b.fini = true; if (e.dead) G.puff(b.x, b.y, '#ddd', 5, 50, 2); continue; } b.x += dx / d * v; b.y += dy / d * v; b.d += v; if (b.d > b.max * 4) b.fini = true; }
      for (const o of nous()) if (!b.vus.has(o) && Math.hypot(o.x - b.x, o.y - 14 - b.y) < 17) { b.vus.add(o); frappe(o, b.dmg); G.puff(b.x, b.y, '#f0ead8', 5, 60, 2); }
    }
    if (B.length) R.boomerangs = B.filter(b => !b.fini);
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R || !R.boomerangs) return;
    for (const b of R.boomerangs) { if (!CG.onScreen(b.x, b.y)) continue; ell(g, b.x, b.y + 16, 6, 2.2, 'rgba(0,0,0,0.2)'); g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.strokeStyle = '#f0ead8'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-8, 4); g.lineTo(0, -3); g.lineTo(8, 4); g.stroke(); ell(g, -8.6, 4.6, 2.6, 2.6, '#f0ead8'); ell(g, 8.6, 4.6, 2.6, 2.6, '#f0ead8'); g.restore(); }
  };
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const e of R.enemies) { const q = e.bmPrep; if (!q || e.dead || !CG.onScreen(e.x, e.y)) continue; const k = 1 - q.t / Ob.PREP; g.save(); g.globalAlpha = 0.2 + k * 0.35; g.strokeStyle = '#f0ead8'; g.lineWidth = 7; g.lineCap = 'round'; g.setLineDash([10, 12]); g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + q.ux * q.max, e.y + q.uy * q.max); g.stroke(); g.restore(); }
  };
})(window.CG);
