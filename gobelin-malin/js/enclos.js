// Goblin Malin — l'enclos à sangliers se bâtit vide. Pour qu'il donne de la viande et du cuir, il faut y amener un sanglier :
// on en trouve un dans la forêt, on le frappe jusqu'à ce qu'il soit sonné (il ne meurt pas tant qu'un enclos vide l'attend),
// on l'attrape (E), il suit le chef au bout de sa corde, et il entre tout seul dès qu'on arrive près de l'enclos vide.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2;
  const Ec = CG.Enclos = { SONNE: 45, PRES: 62, ENTRE: 110, LAISSE: 46 }; /* SONNE : secondes qu'il reste sonné ; PRES : distance pour l'attraper ; ENTRE : distance de l'enclos où il entre ; LAISSE : longueur de la corde */
  const centre = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h) * T - 14 });
  const vides = () => (CG.S ? CG.S.buildings.filter(b => b.type === 'enclos' && !b.site && !b.bete) : []);
  Ec.vides = vides;
  // ---------- les enclos collés l'un à l'autre n'en font qu'un : la clôture ne passe que sur le tour ----------
  const est = (x, y) => { const b = G.buildingAt(x, y); return !!b && b.type === 'enclos' && !b.site; };
  const colle = (a, b) => a !== b && ((a.tx < b.tx + b.w && b.tx < a.tx + a.w && (a.ty === b.ty + b.h || b.ty === a.ty + a.h)) || (a.ty < b.ty + b.h && b.ty < a.ty + a.h && (a.tx === b.tx + b.w || b.tx === a.tx + a.w))); /* ils se touchent par un côté */
  Ec.groupe = function (b) { const S = CG.S, tous = S.buildings.filter(o => o.type === 'enclos' && !o.site), vu = [b], file = [b]; while (file.length) { const c = file.pop(); for (const o of tous) if (!vu.includes(o) && colle(c, o)) { vu.push(o); file.push(o); } } return vu; };
  const box = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  const dedans = b => ({ x0: b.tx * T + 18, x1: (b.tx + b.w) * T - 18, y0: b.ty * T + 14, y1: (b.ty + b.h) * T - 22 }); /* là où un sanglier peut poser ses pattes */
  // le sanglier de chaque enclos : il se promène, et il passe d'un enclos à son voisin quand ils sont collés
  function bete(b) { if (!b._sg) { const d = dedans(b); b._sg = { x: (d.x0 + d.x1) / 2, y: (d.y0 + d.y1) / 2, bx: 0, by: 0, va: false, pause: Math.random() * 3, face: Math.random() < 0.5 ? 1 : -1, step: 0, seed: Math.random() * 9, chez: b }; } return b._sg; }
  function promener(b, dt) { const q = bete(b); if (!CG.S.buildings.includes(q.chez) || q.chez.site) { b._sg = null; return; }
    if (!q.va) { if ((q.pause -= dt) > 0) return; const voisins = CG.S.buildings.filter(o => o.type === 'enclos' && !o.site && colle(q.chez, o)), ou = voisins.length && Math.random() < 0.55 ? voisins[Math.floor(Math.random() * voisins.length)] : q.chez, d = dedans(ou); q.bx = d.x0 + Math.random() * (d.x1 - d.x0); q.by = d.y0 + Math.random() * (d.y1 - d.y0); q.vers = ou; q.va = true; return; }
    const dx = q.bx - q.x, dy = q.by - q.y, d = Math.hypot(dx, dy), v = Ec.PAS * dt; if (d <= v) { q.x = q.bx; q.y = q.by; q.va = false; q.chez = q.vers || q.chez; q.pause = 1.5 + Math.random() * 4; return; }
    q.x += dx / d * v; q.y += dy / d * v; q.step += dt * 1.6; if (Math.abs(dx) > 1) q.face = dx > 0 ? 1 : -1; { const ici = G.buildingAt(Math.floor(q.x / T), Math.floor(q.y / T)); if (ici && ici.type === 'enclos' && !ici.site) q.chez = ici; } }
  Ec.PAS = 15; /* la vitesse de sa promenade */
  // ---------- seule la clôture arrête le chef : dedans, il marche librement, et il entre par la porte (une seule par enclos) ----------
  const W = CG.W, wt0 = W.walkTile; W.walkTile = function (x, y) { return wt0.apply(this, arguments) || (!!W.chef && est(x, y)); };
  let portes = { cle: '', m: new Map() };
  Ec.porte = function (b) { // la case de l'enclos dont le bord du bas est la porte : la plus en bas, puis la plus à gauche, devant un endroit où l'on peut marcher
    const S = CG.S; if (!S || !b || b.site) return null; const cle = S.buildings.length + ':' + S.buildings.reduce((n, o) => n + (o.type === 'enclos' && !o.site ? 1 : 0), 0) + ':' + (S.day || 0); if (portes.cle !== cle) portes = { cle, m: new Map() };
    if (portes.m.has(b)) return portes.m.get(b); const gr = Ec.groupe(b); let best = null, bs = -1e9;
    for (const o of gr) for (let i = 0; i < o.w; i++) { const tx = o.tx + i, ty = o.ty + o.h - 1; if (est(tx, ty + 1)) continue; const s = (wt0.call(W, tx, ty + 1) ? 10000 : 0) + ty * 100 - tx; if (s > bs) { bs = s; best = { tx, ty }; } }
    gr.forEach(o => portes.m.set(o, best)); return best;
  };
  Ec.cloture = function (p, x0, y0) {
    const c = (x, y) => ({ tx: Math.floor(x / T), ty: Math.floor(y / T) }), dans = (x, y) => { const q = c(x, y); return est(q.tx, q.ty); }, a = dans(x0, y0); if (dans(p.x, p.y) === a) return;
    const i = a ? c(x0, y0) : c(p.x, p.y), o = a ? c(p.x, p.y) : c(x0, y0), pt = Ec.porte(G.buildingAt(i.tx, i.ty)); if (pt && i.tx === pt.tx && i.ty === pt.ty && o.tx === pt.tx && o.ty === pt.ty + 1) return; /* par la porte */
    if (dans(p.x, y0) === a) p.y = y0; else if (dans(x0, p.y) === a) p.x = x0; else { p.x = x0; p.y = y0; }
  };
  const X = Art.extra; if (X && X.enclos) {
    const de0 = Art.drawExtra; Art.drawExtra = function (g, b, t) {
      if (!b || b.type !== 'enclos') return de0.apply(this, arguments); const S = CG.S, x0 = b.tx * T, y0 = b.ty * T, x1 = x0 + b.w * T, y1 = y0 + b.h * T;
      for (let i = 0; i < b.w; i++) if (!est(b.tx + i, b.ty - 1)) { const x = x0 + i * T; box(g, x, y0 - 13, T, 3, '#7a5630'); box(g, x, y0 - 5, T, 3, '#6a4826'); box(g, x - 2, y0 - 19, 4, 20, '#8a6234'); box(g, x + T - 2, y0 - 19, 4, 20, '#8a6234'); } /* le fond */
      for (let j = 0; j < b.h; j++) { const y = y0 + j * T; if (!est(b.tx - 1, b.ty + j)) { box(g, x0 - 1.5, y - 9, 3, T, '#6a4826'); box(g, x0 - 2.5, y + 4, 5, 18, '#96703e'); } if (!est(b.tx + b.w, b.ty + j)) { box(g, x1 - 1.5, y - 9, 3, T, '#6a4826'); box(g, x1 - 2.5, y + 4, 5, 18, '#96703e'); } } /* les côtés */
      if (S && CG.R) for (const o of S.buildings) { if (o.type !== 'enclos' || !o.bete || o.site) continue; const q = bete(o); if (q.x < x0 || q.x >= x1 || q.y < y0 - 2 || q.y >= y1) continue; /* le sanglier qui se trouve dans ce morceau-ci, derrière la barrière du devant */
        g.save(); g.translate(q.x, q.y); g.scale(0.92, 0.92); try { Art.enemy(g, { type: 'sanglier', x: 0, y: 0, face: q.face, seed: q.seed, moving: q.va, step: q.step, atkAnim: 0, hp: 1, maxhp: 1, calm: true, enclos: true }, t || 0); } catch (e) { /* rien */ } g.restore(); }
      const pt = Ec.porte(b);
      for (let i = 0; i < b.w; i++) if (!est(b.tx + i, b.ty + b.h)) { const x = x0 + i * T;
        if (pt && pt.tx === b.tx + i && pt.ty === b.ty + b.h - 1) { [x - 2, x + T - 3].forEach(px => { box(g, px, y1 - 31, 5, 32, '#a47a46'); box(g, px + 3, y1 - 31, 2, 32, 'rgba(0,0,0,0.2)'); box(g, px - 1, y1 - 33, 7, 3, '#c49a5c'); }); /* la porte : deux poteaux plus hauts, le battant ouvert vers l'intérieur */
          g.fillStyle = '#8a6234'; g.beginPath(); g.moveTo(x + 2, y1 - 20); g.lineTo(x + 12, y1 - 34); g.lineTo(x + 12, y1 - 30); g.lineTo(x + 2, y1 - 16); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x + 2, y1 - 9); g.lineTo(x + 12, y1 - 23); g.lineTo(x + 12, y1 - 19); g.lineTo(x + 2, y1 - 5); g.closePath(); g.fill(); box(g, x + 10, y1 - 35, 3, 17, '#7a5630'); continue; }
        box(g, x, y1 - 18, T, 4, '#8a6234'); box(g, x, y1 - 8, T, 4, '#7a5630'); [x - 2, x + T - 3].forEach(px => { box(g, px, y1 - 27, 5, 28, '#a47a46'); box(g, px + 3, y1 - 27, 2, 28, 'rgba(0,0,0,0.2)'); }); } /* le devant */
    };
    // le sol de terre battue, sous tout le monde
    const gr0 = CG.Magie.ground; CG.Magie.ground = function (g) { const S = CG.S; if (S) for (const b of S.buildings) { if (b.type !== 'enclos' || b.site) continue; const x0 = b.tx * T, y0 = b.ty * T; if (!CG.onScreen(x0 + T, y0 + T)) continue;
        g.fillStyle = '#8f7146'; g.fillRect(x0, y0 - 6, b.w * T, b.h * T + 2); const h = CG.W.hash(b.tx, b.ty); g.fillStyle = 'rgba(70,48,24,0.28)'; g.beginPath(); g.ellipse(x0 + 22 + h * 30, y0 + 24 + h * 20, 13, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x0 + 58 - h * 18, y0 + 52, 10, 4, 0, 0, TAU); g.fill();
        g.fillStyle = '#d8b878'; g.fillRect(x0 + 50 - h * 30, y0 + 14 + h * 8, 14, 4); g.fillStyle = '#c9a56b'; g.fillRect(x0 + 52 - h * 30, y0 + 11 + h * 8, 10, 3); } return gr0.apply(this, arguments); };
  }
  // un enclos ne s'améliore plus en pierre ou en métal : il s'agrandit en en collant d'autres
  if (CG.Ameliorer && CG.Ameliorer.UP) delete CG.Ameliorer.UP.enclos; if (CG.Ameliorer2 && CG.Ameliorer2.TYPES) { const i = CG.Ameliorer2.TYPES.indexOf('enclos'); if (i >= 0) CG.Ameliorer2.TYPES.splice(i, 1); }
  if (CG.FicheBati && CG.FicheBati.TEXTE) { const ph0 = CG.FicheBati.phrase; CG.FicheBati.phrase = function (b) { if (!b || b.type !== 'enclos') return ph0.apply(this, arguments); const gr = Ec.groupe(b), n = gr.filter(o => o.bete).length; return !n ? 'Un enclos vide. Il attend un sanglier : va en chercher un dans la forêt.' : gr.some(o => !o.bete) ? 'Un grand enclos. Il reste de la place pour un autre sanglier.' : gr.length > 1 ? 'Un grand enclos, où les sangliers se promènent.' : 'Un enclos et son sanglier. Colle-lui un autre enclos pour l\'agrandir.'; }; }
  CG.BUILDS.enclos.desc = 'Un enclos, vide au départ. Tu peux y entrer par sa porte. Collés l\'un à l\'autre, les enclos se rejoignent en un seul grand enclos. Amènes-y un sanglier de la forêt : il donnera de la viande et du cuir.';
  // ---------- pas de bête, pas de viande ----------
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R; if (S) for (const b of S.buildings) if (b.type === 'enclos' && !b.bete) b.pt = 0; /* le compteur de production reste à zéro tant qu'il est vide */
    up0.apply(this, arguments); if (!S || !R) return; const p = S.player;
    for (const b of S.buildings) if (b.type === 'enclos' && b.bete && !b.site) promener(b, dt);
    for (const e of R.enemies) { if (!e.sonne || e.dead) continue; e.sonne -= dt; e.daze = Math.max(e.daze || 0, 0.5); e.rooted = Math.max(e.rooted || 0, 0.5); e.path = null; if (e.sonne <= 0) { e.sonne = 0; e.daze = 0; e.rooted = 0; } } /* sonné : il ne bouge plus, un moment */
    const l = R.laisse; if (!l) return;
    if (R.night || R.alarm || R.ko > 0 || R.death) { R.laisse = null; G.text(l.x, l.y - 40, 'Le sanglier s\'enfuit !', '#ffb0a0', true); G.puff(l.x, l.y - 10, '#c9a56b', 12, 110, 4); CG.sfx('no'); return; }
    const dx = p.x - l.x, dy = p.y - l.y, d = Math.hypot(dx, dy); l.moving = d > Ec.LAISSE; if (l.moving) { const v = Math.min(d - Ec.LAISSE, 260 * dt); l.x += dx / d * v; l.y += dy / d * v; l.step = (l.step || 0) + dt * 2.2; } if (Math.abs(dx) > 3) l.face = dx > 0 ? 1 : -1;
    if (d > 420) { l.x = p.x - 30; l.y = p.y; } /* le chef s'est téléporté : la corde tient bon */
    const b = vides().find(q => Math.hypot(centre(q).x - p.x, centre(q).y - p.y) < Ec.ENTRE); if (!b) return;
    b.bete = true; b.pt = 0; R.laisse = null; const c = centre(b); G.puff(c.x, c.y - 20, '#c9a56b', 16, 120, 4); R.rings.push({ x: c.x, y: c.y - 10, r: 60, life: 0.5, col: '#ffe36b' }); G.text(c.x, c.y - 70, '🐗 Le sanglier est dans l\'enclos !', '#ffe9a8', true); S.morale = Math.min(100, S.morale + 2); G.addXp(8); CG.sfx('discovery');
  };
  // ---------- sonné plutôt que tué, tant qu'un enclos vide l'attend ----------
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg) {
    if (e && e.sonne > 0) return; /* on ne frappe pas un sanglier sonné */
    if (e && !e.dead && e.type === 'sanglier' && !e.event && !CG.R.laisse && vides().length && e.hp - Math.max(1, Math.round(dmg)) <= e.maxhp * 0.25) {
      e.hp = Math.max(1, Math.round(e.maxhp * 0.25)); e.sonne = Ec.SONNE; e.target = null; e.path = null; e.calm = true; G.text(e.x, e.y - 50, '💫', '#fff', true); G.puff(e.x, e.y - 16, '#fff3a8', 8, 80, 3); CG.sfx('hit'); return; }
    return he0.apply(this, arguments);
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const R = CG.R, S = CG.S; if (R && S && !R.laisse && !(R.ko > 0) && !R.cine && !R.build && vides().length) { const p = S.player; let best = null, bd = Ec.PRES;
      for (const e of R.enemies) { if (!(e.sonne > 0) || e.dead) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
      if (best) return { type: 'sanglierPris', obj: best, label: 'Attraper le sanglier' }; }
    return fi0.apply(this, arguments);
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'sanglierPris') return in0.apply(this, arguments); const R = CG.R, e = it.obj, i = R.enemies.indexOf(e); if (i < 0) return;
    R.enemies.splice(i, 1); R.laisse = { x: e.x, y: e.y, face: e.face || 1, step: 0, moving: false, seed: e.seed || 0 }; G.text(e.x, e.y - 50, 'Attrapé !', '#ffe9a8', true); CG.sfx('ok'); CG.UI.toast('🐗 Ramène-le à ton enclos vide.');
  };
  // ---------- le sanglier au bout de sa corde ----------
  window.addEventListener('load', () => { const A = CG.Armee; if (!A || !A.pousser) return; const po = A.pousser; A.pousser = function (push) { po.apply(this, arguments); const R = CG.R, S = CG.S, l = R && R.laisse; if (!l || !S) return; const p = S.player;
      push(l.y, 21, { x: l.x, y: l.y, draw: (g, o, t) => { g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(p.x, p.y - 22); g.quadraticCurveTo((p.x + l.x) / 2, Math.max(p.y, l.y) - 4, l.x + l.face * 10, l.y - 16); g.stroke(); Art.enemy(g, { type: 'sanglier', x: l.x, y: l.y, face: l.face, seed: l.seed, moving: l.moving, step: l.step, atkAnim: 0, hp: 1, maxhp: 1, calm: true }, t); } }, null); }; });
  // ---------- sauvegarde, et les enclos d'avant gardent leur sanglier ----------
  const pk0 = CG.pack; CG.pack = function () { const d = pk0.apply(this, arguments), S = CG.S; if (d && d.buildings && S) d.buildings.forEach((o, i) => { const b = S.buildings[i]; if (b && b.type === 'enclos' && b.bete) o.bete = true; }); if (d) d.enclosV = 1; return d; };
  const ir0 = G.initRuntime; G.initRuntime = function () { const S = CG.S; if (S && !S.enclosV) { S.buildings.forEach(b => { if (b.type === 'enclos' && !b.site) b.bete = true; }); if (S.ailleurs && S.ailleurs.buildings) S.ailleurs.buildings.forEach(b => { if (b.type === 'enclos' && !b.site) b.bete = true; }); S.enclosV = 1; } const r = ir0.apply(this, arguments); CG.R.laisse = null; return r; };
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('enclosV')) CG.Mondes.GLOBAL.push('enclosV');
})(window.CG);
