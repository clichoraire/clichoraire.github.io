// Goblin Malin — voir venir l'ennemi : on ne voit sur les cartes que les ennemis qu'un des nôtres a sous les yeux.
// L'affût d'éclaireur (petite cachette dans les buissons) : un éclaireur s'y poste et surveille les environs. Le sort Œil du faucon montre tout, 5 secondes.
// Et les bêtes des alentours ne laissent plus passer les gobelins : elles les poursuivent, ils détalent.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, Es = CG.Espion = {}, TAU = Math.PI * 2;
  Es.VUE = { chef: 420, gobelin: 230, tour: 340, feu: 480 }; Es.RAYON = [480, 680, 900]; Es.FAUCON = 5; Es.PEUR = 135;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), mid = b => ({ x: (b.tx + 0.5) * T, y: (b.ty + 0.5) * T });

  // ---------- l'affût ----------
  CG.BUILDS.affut = { nom: 'Affût d\'éclaireur', icon: '🌿', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 8 }, tech: 'd26', desc: 'Une cachette dans les buissons, à poser le long des routes. Un éclaireur s\'y poste : tu vois sur la carte les ennemis qui passent près de lui, et il te prévient tout de suite. Il n\'attaque pas.' };
  Es.spy = b => CG.S.goblins.find(g => g.perch === b) || null;
  Es.rayon = b => Es.RAYON[Math.min(2, b.up || 0)];
  Art.extra.affut = { w: 64, h: 60, lvl: b => Math.min(2, b.up || 0), draw(c) {
    const el = (x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
    el(32, 52, 28, 6, 'rgba(0,0,0,0.22)');
    [[14, 38, 14, '#2f6a2c'], [48, 38, 14, '#2a6228'], [31, 30, 19, '#3a7e34'], [22, 26, 11, '#479440'], [42, 25, 10, '#3f8a3a'], [31, 44, 15, '#2f6a2c']].forEach(q => el(q[0], q[1], q[2], q[2] * 0.82, q[3]));
    el(31, 38, 9, 6.5, '#12240f'); // le trou d'où il regarde
    [[12, 30], [50, 32], [26, 18], [40, 46]].forEach(q => el(q[0], q[1], 2, 2, '#d8402a')); // quelques baies
  }, up(c) { c.fillStyle = '#6b4a2a'; c.fillRect(8, 20, 3, 28); c.fillRect(53, 22, 3, 26); c.strokeStyle = '#8a6234'; c.lineWidth = 2; c.beginPath(); c.moveTo(9, 22); c.lineTo(55, 24); c.stroke(); [[14, 20], [24, 17], [36, 18], [47, 21]].forEach(q => { c.fillStyle = '#4a9a40'; c.beginPath(); c.ellipse(q[0], q[1], 6, 4, 0.3, 0, TAU); c.fill(); }); },
    anim(g, x, y, t, night, b) { // les yeux de l'éclaireur dans le trou, et sa longue-vue une fois l'affût amélioré
      const here = !!(b && Es.spy(b)), ey = y - 22;
      if (b && b.up) { g.save(); g.translate(x + 4, ey - 2); g.rotate(-0.25 + Math.sin(t * 0.7) * 0.25); g.fillStyle = '#c8962e'; g.fillRect(0, -2.5, 15, 5); g.fillStyle = '#8a6a1c'; g.fillRect(13, -3.5, 4, 7); if (b.up > 1) { g.fillStyle = '#e8c84a'; g.fillRect(17, -2, 7, 4); } g.fillStyle = 'rgba(200,240,255,' + (0.5 + Math.sin(t * 3) * 0.3) + ')'; g.fillRect((b.up > 1 ? 23 : 16), -1.5, 2, 3); g.restore(); }
      if (here && Math.sin(t * 0.9 + x) > -0.92) { g.fillStyle = '#fffbe0'; g.beginPath(); g.ellipse(x - 5, ey, 2.6, 2.9, 0, 0, TAU); g.ellipse(x + 3, ey, 2.6, 2.9, 0, 0, TAU); g.fill(); const k = Math.sin(t * 1.3) * 1.1; g.fillStyle = '#1c1510'; g.beginPath(); g.arc(x - 5 + k, ey, 1.3, 0, TAU); g.arc(x + 3 + k, ey, 1.3, 0, TAU); g.fill(); }
      else if (b && !b.site && !here) CG.Art.bubble && CG.onScreen(x, y) && Math.sin(t * 2) > 0.2 && CG.Art.bubble(g, x, y - 52, '❌');
    } };
  if (CG.Ameliorer) CG.Ameliorer.UP.affut = [{ tech: 'd27', nom: 'Affût à longue-vue', cout: { bois: 6, minerai: 4 }, sec: 10, effet: 'il voit bien plus loin' }, { tech: 'd28', nom: 'Nid d\'espion', cout: { bois: 10, minerai: 8, or: 15 }, sec: 16, effet: 'il voit presque jusqu\'au bout de la route' }];
  [['d26', 1, 4, 1, '🌿', 'Affûts', 'Révèle l\'Affût d\'éclaireur : une cachette où un éclaireur se poste pour surveiller une route. Sans lui, tu ne vois les ennemis que lorsqu\'un des tiens les a sous les yeux.', { unlock: ['affut'] }],
   ['d27', 1, 5, 1, '🔭', 'Longues-vues', 'Tu peux équiper tes affûts d\'une longue-vue, un à la fois : va à côté (E). Ils voient bien plus loin.', { req: ['d26'] }],
   ['d28', 3, 5, 2, '🕵️', 'Réseau d\'espions', 'Tu peux changer un affût à longue-vue en nid d\'espion : il voit très loin.', { req: ['d27'] }]
  ].forEach(q => { const n = Object.assign({ id: q[0], br: 'def', t: q[1], r: q[2], cout: q[3], icon: q[4], nom: q[5], desc: q[6] }, q[7]); CG.TECH.push(n); if (CG.TECH_BY_ID) CG.TECH_BY_ID[n.id] = n; });

  // ---------- l'éclaireur prend son poste (de jour, et pendant une alerte) ----------
  const step0 = CG.Scout.step;
  CG.Scout.step = function (g, dt) {
    const S = CG.S, R = CG.R, duty = R.alarm || (S.hour >= 6 && S.hour < 19);
    let b = g.post; if (b && (S.buildings.indexOf(b) < 0 || b.site || b.type !== 'affut')) { if (g.perch) G.unperch(g); g.post = b = null; }
    if (!duty) { if (g.perch || g.post) G.unperch(g); return step0.apply(this, arguments); }
    if (g.perch) { g.moving = false; g.pose = null; return true; }
    if (g.affCd > 0) g.affCd -= dt;
    if (!b && !(g.affCd > 0) && !(g.seen && g.seen.length)) { // un affût libre ? (s'il a des nouvelles à raconter, il rentre d'abord)
      let bd = 1e9; for (const t of S.buildings) { if (t.type !== 'affut' || t.site || S.goblins.some(o => o !== g && o.post === t)) continue; const d = dist(mid(t), g); if (d < bd) { bd = d; b = t; } }
      if (b) { const c = mid(b); let ok = false; for (const q of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) { const x = c.x + q[0] * T, y = c.y + q[1] * T; if (W.walkPx(x, y) && G.goTo(g, x, y)) { ok = true; break; } } if (!ok) { g.affCd = 8; b = null; } else { g.post = b; g.state = 'sGo'; g.bubble = null; } }
      else g.affCd = 3;
    }
    if (!b) return step0.apply(this, arguments);
    if (dist(mid(b), g) < T * 1.7 || G.follow(g, 66, dt)) { if (dist(mid(b), g) < T * 2.2) { g.perch = b; const c = mid(b); g.x = c.x; g.y = c.y; g.moving = false; g.path = null; g.state = 'idle'; G.puff(c.x, c.y - 10, '#4a9a40', 8, 70, 3); } else { g.post = null; g.affCd = 6; } }
    return true;
  };
  // un éclaireur posté ne se dessine pas sur une tour : on ne voit que ses yeux dans le buisson
  const td = CG.Tours.draw; CG.Tours.draw = function (c, g) { if (g.perch && g.perch.type === 'affut') return; return td.apply(this, arguments); };

  // ---------- qui voit quoi (recalculé trois fois par seconde) ----------
  let vt = 0;
  function regarder() {
    const S = CG.S, R = CG.R, p = S.player, fire = G.firePos(), tout = R.faucon > 0, posts = [];
    for (const b of S.buildings) if (b.type === 'affut' && !b.site) { const s = Es.spy(b); if (s) posts.push({ c: mid(b), r: Es.rayon(b), g: s }); }
    for (const e of R.enemies) {
      if (e.dead || e.struct) { e.seen = false; continue; }
      let vu = tout || (R.ko <= 0 && dist(e, p) < Es.VUE.chef) || dist(e, fire) < Es.VUE.feu, par = null;
      if (!vu) for (const q of posts) if (dist(e, q.c) < q.r) { vu = true; par = q; break; }
      if (!vu) for (const g of S.goblins) { if (g.hidden) continue; if (dist(e, g) < (g.perch ? Es.VUE.tour : Es.VUE.gobelin)) { vu = true; break; } }
      e.seen = vu;
      // un guetteur voit l'armée arriver : il prévient tout de suite, bien avant qu'elle soit aux portes
      if (par && e.event && R.event && R.event.type === 'attack' && R.event.quiet && !R.event.vue) { R.event.vue = true; const dx = e.x - fire.x, dy = e.y - fire.y, ou = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'à l\'est' : 'à l\'ouest') : (dy > 0 ? 'au sud' : 'au nord'); CG.UI.toast('🔭 ' + par.g.name + ' a repéré des ennemis ' + ou + ' du village : ils approchent !'); CG.sfx('attaque'); if (R.pings) R.pings.push({ x: e.x, y: e.y, t0: performance.now(), foe: true }); }
    }
  }
  // ---------- la peur : un travailleur qui a une bête aux trousses détale ----------
  function peur() {
    const S = CG.S, R = CG.R;
    for (const g of S.goblins) {
      if (g.hidden || g.perch || g.job === 'garde' || g.ko === true || G.militia(g) || (CG.Gibier && CG.Gibier.brave(g))) continue;
      if (g.job === 'guerisseur' && (g.state === 'heal' || g.state === 'toHeal')) { g.panic = 0; g.alerte = 0; continue; } /* à son poste, il soigne même pendant une attaque : pas de panique affichée pour rien */
      let pres = false; for (const e of R.enemies) if (!e.dead && !e.struct && !(e.charm > 0) && !(e.sleepT > 0) && !e.calm && dist(e, g) < Es.PEUR) { pres = true; break; }
      if (!pres) continue;
      if (!(g.alerte > 0)) { G.text(g.x, g.y - 50, Es.arme(g) ? '⚔️' : '😱', '#fff'); if (CG.onScreen(g.x, g.y)) CG.sfx('no'); }
      g.panic = 2.4; g.alerte = Es.ALERTE; // en alerte : il abandonne ce qu'il faisait et rentre se mettre à l'abri (voir alerteStep)
    }
  }
  // en alerte : quoi qu'il faisait, il fait demi-tour, court jusqu'à son abri et y reste tant que le danger n'est pas passé
  Es.ALERTE = 10; // secondes de calme avant de ressortir
  // celui à qui on a confié une arme ne détale pas : il se défend tant que la bête est sur lui, et ne rentre qu'une fois le coup passé
  Es.arme = g => !!(g.equip && (g.equip.epee || g.equip.arc)) && !g.child && !g.bebe;
  Es.DEFEND = [150, 230]; // jusqu'où il se bat : à l'épée, à l'arc
  Es.defend = function (g, dt) { const R = CG.R; if (g.hidden || !Es.arme(g)) return false; let tg = null, bd = Es.DEFEND[g.equip.arc ? 1 : 0]; for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0 || e.sleepT > 0 || e.calm) continue; const d = dist(e, g); if (d < bd) { bd = d; tg = e; } }
    if (!tg) return false; if (g.state !== 'fight') { G.resetGoblin(g); g.bubble = null; } g.panic = 0; G.guardFight(g, tg, bd, dt); return true; };

  Es.alerteStep = function (g, dt) {
    const S = CG.S, R = CG.R;
    if (g.job === 'garde' || G.militia(g) || g.perch) { g.alerte = 0; return false; }
    let danger = false; const ray = g.hidden ? 230 : Es.PEUR * 1.7; for (const e of R.enemies) if (!e.dead && !e.struct && !(e.charm > 0) && !(e.sleepT > 0) && !e.calm && dist(e, g) < ray) { danger = true; break; }
    if (danger) g.alerte = Es.ALERTE; else g.alerte -= dt;
    if (danger && Es.defend(g, dt)) return true;
    if (g.alerte <= 0) { g.alerte = 0; if (g.state === 'peur') { if (g.hidden) { g.hidden = false; if (G.unstick) G.unstick(g, 8); } g.bubble = null; g.state = 'idle'; g.timer = 0.3; } return false; } // tout est calme : il retourne au travail
    if (g.state !== 'peur') { G.resetGoblin(g); g.melee = false; g.state = 'peur'; g.hidden = false; g.refuge = G.shelter(g); const d = G.door(g.refuge); if (!G.goTo(g, d.x, d.y)) { const f = G.firePos(); G.goTo(g, f.x, f.y + 40); } g.bubble = null; }
    if (g.hidden) { g.moving = false; return true; }
    g.panic = Math.max(g.panic || 0, 0.5);
    if (G.follow(g, 130, dt)) { if (g.dehors) g.moving = false; else g.hidden = true; }
    return true;
  };
  // l'indice : un panneau d'alerte rouge qui bat au-dessus de sa tête, et un cercle pointillé à ses pieds
  const mkA = CG.Magie.marks;
  CG.Magie.marks = function (g, t) {
    mkA.apply(this, arguments); const S = CG.S; if (!S) return;
    for (const o of S.goblins) {
      if (!(o.alerte > 0) || o.hidden || !CG.onScreen(o.x, o.y)) continue; const pu = 0.5 + 0.5 * Math.sin(t * 10 + o.id), y = o.y - 66 + Math.sin(t * 8 + o.id) * 2, s = 1 + pu * 0.12;
      g.save();
      g.strokeStyle = 'rgba(255,90,60,' + (0.5 + pu * 0.4) + ')'; g.lineWidth = 2; g.setLineDash([5, 5]); g.lineDashOffset = -t * 30; g.beginPath(); g.ellipse(o.x, o.y + 2, 16, 6.5, 0, 0, 6.3); g.stroke(); g.setLineDash([]);
      g.translate(o.x, y); g.scale(s, s); g.lineJoin = 'round';
      g.beginPath(); g.moveTo(0, -11); g.lineTo(11, 8); g.lineTo(-11, 8); g.closePath(); g.fillStyle = '#e8402a'; g.fill(); g.strokeStyle = '#fff3c4'; g.lineWidth = 2.2; g.stroke();
      g.fillStyle = '#fff'; g.fillRect(-1.5, -5, 3, 7.5); g.beginPath(); g.arc(0, 5, 1.7, 0, 6.3); g.fill();
      g.restore();
    }
  };
  const es0 = G.evoSpd; G.evoSpd = g => es0(g) * (g.panic > 0 ? 1.5 : 1) * (g.bebe ? 0.72 : 1);
  // le nouveau-né (son premier jour seulement) : il traîne, travaille moins vite et a peu de vie
  const wsB = G.workSpeed; G.workSpeed = g => wsB(g) * (g.bebe ? 0.6 : 1);
  const mhB = G.gobMaxHp; G.gobMaxHp = g => g.bebe ? Math.min(mhB(g), g.bebe) : mhB(g);
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S) return;
    if (R.faucon > 0) R.faucon -= dt;
    for (const g of S.goblins) if (g.panic > 0) g.panic -= dt;
    for (const g of S.goblins) { if (!g.perch || g.perch.type !== 'affut') continue; if (g.job !== 'eclaireur') { G.unperch(g); continue; } const c = mid(g.perch); g.x = c.x; g.y = c.y; g.moving = false; g.path = null; g.hidden = false; if (g.state === 'flee') g.state = 'idle'; } // il reste caché à son poste, même pendant l'alerte
    vt -= dt; if (vt <= 0) { vt = 0.33; regarder(); if (!R.night) peur(); }
  };

  // ---------- le sort : Œil du faucon ----------
  CG.SPELLS.faucon = { nom: 'Œil du faucon', icon: '🦅', mp: 10, prix: 600, desc: 'Pendant 5 secondes, tu vois sur la carte tous les ennemis, où qu\'ils soient. Ensuite, tu ne vois plus que ceux que les tiens ont sous les yeux.', color: '#ffe36b' };
  CG.SCROLL_POOL.push('faucon');
  const cast0 = G.cast;
  G.cast = function (id) {
    if (id !== 'faucon') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); R.faucon = Es.FAUCON; vt = 0;
    for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 160 + i * 140, life: 0.6 + i * 0.2, col: '#ffe36b' });
    const n = R.enemies.filter(e => !e.dead && !e.struct).length; G.text(p.x, p.y - 64, '🦅 ' + (n ? n + ' ennemi' + (n > 1 ? 's' : '') + ' en vue !' : 'Personne à l\'horizon'), '#ffe9a8', true);
    const now = performance.now(); if (R.pings) R.enemies.forEach(e => { if (!e.dead && !e.struct) R.pings.push({ x: e.x, y: e.y, t0: now, foe: true }); });
  };
})(window.CG);
