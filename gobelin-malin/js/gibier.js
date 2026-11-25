// Goblin Malin — le gibier et le vrai métier de chasseur.
//   Du gibier se promène autour du village : faisans, biches et cerfs. Ce ne sont pas des monstres : ils broutent et se sauvent quand on approche.
//   Le chasseur les traque, les tire à l'arc de loin, va chercher sa prise et la rapporte (viande et cuir). Plus il monte de niveau,
//   plus il vise juste, plus il frappe fort et plus il rapporte. Quand un monstre approche, il lui tire dessus au lieu de se cacher,
//   et pendant une attaque il se poste près du feu, derrière les gardes.
//   Le chef peut chasser lui aussi (un coup ou une flèche) : la viande va droit à la réserve.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, rand = CG.rand, TAU = Math.PI * 2, dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const Gi = CG.Gibier = {
    MAX: 7, POUSSE: 16, LOIN: [7, 18], /* combien de bêtes à la fois, secondes entre deux arrivées, distance du feu (en cases) */
    SORTES: { faisan: { hp: 1, food: 2, cuir: 0, v: 150, part: 0.3 }, biche: { hp: 2, food: 3, cuir: 1, v: 165, part: 0.45 }, cerf: { hp: 3.2, food: 4, cuir: 2, v: 155, part: 0.25 } },
    PEUR: 85, TIR: 165, COLLE: 44, /* COLLE : à cette distance, plus besoin de ligne de tir dégagée */ VISE: 0.6, RECHARGE: 1.4, PREND: 1.1, XP_MAX: 8,
    JUSTE: [0.62, 0.07, 0.96], /* chance de toucher : au niveau 1, par niveau de plus, au maximum */
    FORCE: [1, 0.35, 1], /* dégâts d'une flèche sur le gibier : de base, par niveau de plus, en plus avec un arc équipé */
    DEF: { VUE: 250, RECUL: 95, CD: 1.6, DMG: [3, 1.2, 3], PV: 0.35 } /* contre les monstres : il tire jusqu'à VUE, recule sous RECUL, et se replie sous 35 % de vie */
  };
  const liste = () => { const R = CG.R; return R.gibier || (R.gibier = []); };
  const dehors = () => CG.Mondes && CG.Mondes.ici && CG.Mondes.ici() === 2;
  // ---------- les bêtes ----------
  function sorte() { let r = Math.random(); for (const k in Gi.SORTES) { r -= Gi.SORTES[k].part; if (r <= 0) return k; } return 'biche'; }
  function naitre(cache) {
    const f = G.firePos();
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * TAU, r = rand(Gi.LOIN[0], Gi.LOIN[1]) * T, x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r * 0.85, tx = Math.floor(x / T), ty = Math.floor(y / T);
      if (tx < 3 || ty < 3 || tx > CG.MW - 4 || ty > CG.MH - 4 || !W.walkTile(tx, ty) || !W.walkTile(tx + 1, ty) || !W.walkTile(tx, ty + 1)) continue;
      if (cache && CG.onScreen(x, y)) continue;
      let pres = false; for (const e of CG.R.enemies) if (!e.dead && dist(e, { x, y }) < 260) { pres = true; break; } if (pres) continue;
      if (!W.path(x, y, f.x, f.y + 60)) continue; // il faut qu'un chasseur puisse s'y rendre à pied
      const k = sorte(); liste().push({ k, x, y, hp: Gi.SORTES[k].hp, face: Math.random() < 0.5 ? 1 : -1, t: rand(1, 4), va: false, fx: 0, fy: 0, fuite: 0, scan: Math.random() * 0.3, step: 0, seed: Math.random() * 100 }); return true;
    }
    return false;
  }
  function fuir(a, de, sec) { a.fuite = Math.max(a.fuite, sec); if (a.detour > 0) return; /* elle contourne un obstacle : on ne la renvoie pas dedans */ const dx = a.x - de.x, dy = a.y - de.y, d = Math.hypot(dx, dy) || 1; a.fx = dx / d; a.fy = dy / d; }
  Gi.DETOURS = [0.8, -0.8, 1.57, -1.57, 2.4, -2.4, 3.14]; Gi.DEMI_TOUR = 0.5; /* bloquée : les angles qu'elle essaie, dans l'ordre ; et le temps minimum entre deux demi-tours (sinon elle clignote gauche-droite) */
  function bete(a, dt) {
    const R = CG.R, S = CG.S, K = Gi.SORTES[a.k];
    if (a.mort) { a.mortT += dt; if (a.pris) a.parti = (a.parti || 0) + dt; return; }
    if ((a.scan -= dt) <= 0) { // qui approche ?
      a.scan = 0.25; let m = null, bd = Gi.PEUR; const voir = o => { const d = dist(o, a); if (d < bd) { bd = d; m = o; } };
      if (!(R.ko > 0)) voir(S.player); for (const g of S.goblins) if (!g.hidden) voir(g); for (const e of R.enemies) if (!e.dead) voir(e);
      if (m) fuir(a, m, 1.5);
    }
    let v = 0;
    if (a.fuite > 0) { a.fuite -= dt; v = K.v; }
    else {
      a.t -= dt;
      if (a.t <= 0) { a.va = !a.va; a.t = a.va ? rand(1, 2.4) : rand(2, 5); if (a.va) { const f = G.firePos(), d = dist(a, f); let an = Math.random() * TAU; if (d > (Gi.LOIN[1] + 3) * T) an = Math.atan2(f.y - a.y, f.x - a.x) + rand(-0.5, 0.5); else if (d < (Gi.LOIN[0] - 2) * T) an = Math.atan2(a.y - f.y, a.x - f.x) + rand(-0.5, 0.5); a.fx = Math.cos(an); a.fy = Math.sin(an); } }
      if (a.va) v = 34;
    }
    a.moving = v > 0;
    if (a.detour > 0) a.detour -= dt; if (a.bloque > 0) { a.bloque -= dt; v = 0; a.moving = false; } a.faceT = (a.faceT || 0) - dt;
    if (v) { if (!G.slide(a, a.fx * v * dt, a.fy * v * dt, 6)) { // un obstacle : elle cherche par où passer, et garde ce cap un moment
        const a0 = Math.atan2(a.fy, a.fx), sens = (a.seed || 0) % 2 < 1 ? 1 : -1; let ok = false;
        for (const da of Gi.DETOURS) { const an = a0 + da * sens, fx = Math.cos(an), fy = Math.sin(an); if (G.slide(a, fx * v * dt, fy * v * dt, 6)) { a.fx = fx; a.fy = fy; a.detour = 0.7; ok = true; break; } }
        if (!ok) { a.bloque = 0.8; a.fuite = 0; a.va = false; a.t = rand(1, 2); a.moving = false; } } /* coincée de partout : elle s'arrête au lieu de trembler */
      a.step += dt * v / 18; const f = Math.abs(a.fx) > 0.2 ? (a.fx > 0 ? 1 : -1) : a.face; if (f !== a.face && a.faceT <= 0) { a.face = f; a.faceT = Gi.DEMI_TOUR; } }
  }
  // une bête est touchée ; « par » : le chef ou un gobelin
  Gi.touche = function (a, dmg, par) {
    if (a.mort) return; const R = CG.R, S = CG.S, K = Gi.SORTES[a.k]; a.hp -= dmg;
    G.puff(a.x, a.y - 12, a.k === 'faisan' ? '#c98a4a' : '#e8d8b8', 5, 70, 2.5);
    if (a.hp > 0) { fuir(a, par || S.player, 2.6); return; }
    a.mort = true; a.mortT = 0; a.moving = false; a.par = par; if (CG.onScreen(a.x, a.y)) CG.sfx('hit');
    if (!(par && par.job === 'chasseur' && par.gib && par.gib.a === a)) { // le chef (ou un autre) : la viande va droit à la réserve
      a.pris = true; if (a.vise) a.vise = null; G.gain('food', K.food, a.x, a.y - 26); if (K.cuir) G.gain('cuir', K.cuir, a.x, a.y - 42);
    }
  };
  // ---------- le chasseur ----------
  Gi.degats = g => { const D = Gi.DEF.DMG; return (D[0] + g.lvl * D[1] + (g.equip && g.equip.arc ? D[2] * (+g.equip.arc === 4 ? 3 : 1) : 0)) * G.apt(g, 'chasseur'); };
  const juste = g => Math.min(Gi.JUSTE[2], Gi.JUSTE[0] + (g.lvl - 1) * Gi.JUSTE[1]);
  const force = g => Gi.FORCE[0] + (g.lvl - 1) * Gi.FORCE[1] + (g.equip && g.equip.arc ? Gi.FORCE[2] : 0);
  function lacher(g) { const q = g.gib; if (q && q.a && q.a.vise === g) q.a.vise = null; g.gib = null; }
  { const rs0 = G.resetGoblin; G.resetGoblin = function (g) { if (g && g.gib) lacher(g); if (g) g.butin = null; return rs0.apply(this, arguments); }; }
  function fini(g, sec) { lacher(g); g.state = 'idle'; g.timer = sec || 0.5; g.pose = null; g.path = null; g.moving = false; }
  function proie(g) {
    const R = CG.R; let best = null, bd = 1e9;
    for (const a of liste()) { if (a.vise || a.pris || (a.sauf > R.t)) continue; if (a.mort && a.par && a.par !== g && a.par.gib && a.par.gib.a === a) continue; const d = dist(a, g) * (a.mort ? 0.5 : 1); if (d < bd) { bd = d; best = a; } }
    return best;
  }
  function rentrer(g) { const st = G.dropPoint(g) || G.firePos(); if (!G.goTo(g, st.x + rand(-24, 24), st.y + rand(-2, 8))) { const f = G.firePos(); G.goTo(g, f.x, f.y + 50); } g.gib = { ph: 'retour' }; g.carry = 'chasse'; g.pose = null; }
  function deposer(g) {
    const b = g.butin || { food: 0, cuir: 0 }; if (b.food) G.gain('food', b.food, g.x, g.y - 30); if (b.cuir) G.gain('cuir', b.cuir, g.x, g.y - 46);
    g.butin = null; g.carry = null; if (G.outilVide) G.outilVide(g); fini(g, 0.6);
  }
  // sa journée : appelée à la place du vieux terrain de chasse. Faux = pas de gibier en vue, il fait comme avant.
  Gi.step = function (g, dt) {
    const R = CG.R, q = g.gib;
    if (!q) {
      if (g.state === 'gPoste' || g.state === 'gDef' || g.state === 'chasse') { g.state = 'idle'; g.timer = 0.3; g.pose = null; }
      if (g.state !== 'idle' || dehors()) return false;
      g.moving = false; g.timer -= dt; if (g.timer > 0) return true;
      const a = proie(g); if (!a) { if (g.butin) { g.state = 'chasse'; rentrer(g); return true; } return false; }
      if (!G.goTo(g, a.x, a.y)) { a.sauf = R.t + 30; g.timer = 0.5; return true; }
      a.vise = g; g.gib = { a, ph: a.mort ? 'va' : 'traque', r: 1, dur: 0 }; g.state = 'chasse'; g.bubble = null; return true;
    }
    g.state = 'chasse'; const a = q.a;
    if (q.ph === 'retour') { if (G.follow(g, 96, dt)) deposer(g); return true; }
    if (!a || liste().indexOf(a) < 0 || (a.pris && q.ph !== 'prend')) { fini(g, 0.4); return true; }
    const d = dist(a, g);
    if (q.ph === 'traque') {
      g.pose = null; if (a.mort) { if (a.par === g) q.ph = 'va'; else fini(g, 0.4); return true; }
      if (d < Gi.TIR && (d < Gi.COLLE || W.lineClear(g.x, g.y, a.x, a.y))) { q.ph = 'vise'; /* collé à la bête, il tire même si elle est blottie contre un mur ou une hutte : sinon il piétinait sur place sans fin */ q.t = Gi.VISE; g.path = null; g.moving = false; return true; }
      q.dur += dt; if (q.dur > 30) { a.sauf = R.t + 25; fini(g, 0.5); return true; } // elle court trop : il en cherche une autre
      q.r -= dt; if (q.r <= 0 || !g.path || !g.path.length) { q.r = 1; if (!G.goTo(g, a.x, a.y)) { a.sauf = R.t + 30; fini(g, 0.5); return true; } }
      G.follow(g, 104, dt); return true;
    }
    if (q.ph === 'vise') {
      g.moving = false; g.face = a.x > g.x ? 1 : -1;
      if (a.mort) { q.ph = 'traque'; return true; }
      if (d > Gi.TIR * 1.3 || (d >= Gi.COLLE && !W.lineClear(g.x, g.y, a.x, a.y))) { q.ph = 'traque'; q.r = 0; return true; }
      q.t -= dt; if (q.t > 0) return true;
      g.atkAnim = 1; G.shoot(g, a, 'arrow', Gi.degats(g), 'g', g); const s = R.shots[R.shots.length - 1]; s.gib = a; s.rate = Math.random() > juste(g); s.life = Math.min(s.life, d / 380 + 0.25);
      q.ph = 'attend'; q.t = Gi.RECHARGE; return true;
    }
    if (q.ph === 'attend') {
      g.moving = false; q.t -= dt;
      if (a.mort && a.par === g) { q.ph = 'va'; if (!G.goTo(g, a.x, a.y)) { g.x = a.x; g.y = a.y; } return true; }
      if (q.t <= 0) { q.ph = a.mort ? 'traque' : (d < Gi.TIR && (d < Gi.COLLE || W.lineClear(g.x, g.y, a.x, a.y)) ? 'vise' : 'traque'); q.t = Gi.VISE * 0.7; q.r = 0; }
      return true;
    }
    if (q.ph === 'va') { if (d < 16 || G.follow(g, 100, dt)) { if (dist(a, g) > 40 && G.goTo(g, a.x, a.y)) return true; q.ph = 'prend'; q.t = Gi.PREND; g.moving = false; g.face = a.x > g.x ? 1 : -1; } return true; }
    if (q.ph === 'prend') {
      g.moving = false; g.pose = 'work'; q.t -= dt * G.workSpeed(g); if (q.t > 0) return true;
      const K = Gi.SORTES[a.k], b = g.butin || (g.butin = { food: 0, cuir: 0 }), plus = (CG.Allies && CG.Allies.bless && CG.Allies.bless('recolte') ? 1 : 0);
      b.food += K.food + Math.floor((g.lvl - 1) / 2) + plus + (G.tech('b11') ? 1 : 0); if (K.cuir) b.cuir += K.cuir + (g.lvl >= 4 ? 1 : 0);
      a.pris = true; a.vise = null; g.gib = null; g.pose = null; G.gobXp(g, 1, Gi.XP_MAX);
      if (G.outilSuite && G.outilSuite(g)) return true; // la gibecière : il repart en chercher une autre avant de rentrer
      rentrer(g); return true;
    }
    fini(g, 0.4); return true;
  };
  // assez en forme pour tirer sur un monstre au lieu de se sauver
  Gi.brave = g => g.job === 'chasseur' && !g.child && !g.bebe && g.ko !== true && !g.exile && !g.perch && (!CG.OutilsBase || CG.OutilsBase.a(g)); /* sans arc, il ne tire pas. Sinon il ne rentre jamais se cacher : il défend le village avec les gardes */
  function poste(g, dt) { // pendant une attaque : près du feu, derrière les gardes
    const f = G.firePos(), x = f.x + ((g.id % 5) - 2) * 34, y = f.y + 70 + (g.id % 2) * 22; g.hidden = false; g.pose = null;
    if (Math.hypot(x - g.x, y - g.y) > 26) { if (g.state !== 'gPoste' || !g.path || !g.path.length) { G.resetGoblin(g); if (!G.goTo(g, x, y)) return false; g.state = 'gPoste'; } G.follow(g, 125, dt); }
    else { g.state = 'gPoste'; g.moving = false; g.path = null; }
    return true;
  }
  Gi.defend = function (g, dt) {
    if (!Gi.brave(g)) { if (g.state === 'gDef' || g.state === 'gPoste') { g.state = 'idle'; g.timer = 0.2; } return false; }
    const R = CG.R, D = Gi.DEF;
    g.gdT = (g.gdT || 0) - dt; if (g.gdT <= 0 || (g.gdE && g.gdE.dead)) { g.gdT = 0.3; let best = null, bd = D.VUE; for (const e of R.enemies) { if (e.dead || e.calm || e.struct || e.charm > 0) continue; const d = dist(e, g); if (d < bd) { bd = d; best = e; } } g.gdE = best; }
    const e = g.gdE;
    if (!e) { if (g.state === 'gDef') { g.state = 'idle'; g.timer = 0.5; g.path = null; } return R.alarm ? poste(g, dt) : false; }
    if (g.state !== 'gDef') { G.resetGoblin(g); g.state = 'gDef'; }
    g.hidden = false; g.alerte = 0; g.panic = 0; g.pose = null; g.bubble = null;
    const dx = g.x - e.x, dy = g.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d < D.RECUL) G.chase(g, g.x + dx / d * 70, g.y + dy / d * 70, 108, dt); else { g.moving = false; g.path = null; }
    if (g.atkCd <= 0 && (!G.shotClear || G.shotClear(g, e))) { g.atkCd = D.CD; g.atkAnim = 1; g.face = e.x > g.x ? 1 : -1; G.shoot(g, e, 'arrow', Gi.degats(g), 'g', g); }
    else if (!g.moving) g.face = e.x > g.x ? 1 : -1;
    return true;
  };
  // ---------- chaque image ----------
  let pousse = 3;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R, S = CG.S; if (!R || !S || !CG.running || R.gel || dehors()) return;
    const L = liste();
    if (R.gibDebut === undefined) { R.gibDebut = 1; for (let i = 0; i < Gi.MAX - 2; i++) naitre(false); }
    pousse -= dt; if (pousse <= 0) { pousse = Gi.POUSSE; if (L.filter(a => !a.mort).length < Gi.MAX && !R.alarm) naitre(true); }
    for (const a of L) bete(a, dt);
    for (const s of R.shots) { // les flèches
      if (s.team === 'e' || s.life <= 0) continue;
      if (s.gib) { const a = s.gib; if (!s.rate && !a.mort && Math.hypot(s.x - a.x, s.y - (a.y - 12)) < 16) { s.life = 0; Gi.touche(a, force(s.owner), s.owner); } else if (s.rate && s.life < 0.06 && !s.dit) { s.dit = true; if (!a.mort) fuir(a, s.owner, 2.2); if (CG.onScreen(s.x, s.y)) G.text(s.x, s.y - 10, 'Raté !', '#e8e0d0'); } continue; }
      for (const a of L) if (!a.mort && Math.hypot(s.x - a.x, s.y - (a.y - 12)) < 15) { s.life = 0; Gi.touche(a, 2, s.owner || S.player); break; }
    }
    for (let i = L.length - 1; i >= 0; i--) { const a = L[i]; if (a.mort && ((a.pris && a.parti > 0.8) || a.mortT > 45)) { if (a.vise) a.vise = null; L.splice(i, 1); } }
  };
  // le chef : un coup d'arme suffit
  { const at0 = G.attack; if (at0) G.attack = function () { const R = CG.R, cd = R ? R.atkCd : 0, r = at0.apply(this, arguments); if (!R || !R.gibier || !(R.atkCd > cd)) return r; const p = CG.S.player, dir = R.dir || { x: p.face || 1, y: 0 };
    for (const a of R.gibier) { if (a.mort) continue; const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy); if (d < 50 && (d < 24 || (dx * dir.x + dy * dir.y) / d > 0.2)) Gi.touche(a, 2, p); } return r; }; }
  // ---------- le dessin (pas de contour : des taches de couleur) ----------
  const el = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  function patte(g, x, y, l, a, c, w) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * l, y + Math.cos(a) * l); g.stroke(); }
  function faisan(g, a, t) {
    const m = a.moving ? Math.sin(a.step * 2) : 0, pic = !a.moving && !a.mort && Math.sin(t * 1.3 + a.seed) > 0.55 ? 1 : 0; // il picore
    patte(g, -2, -5, 6, m * 0.6, '#b8863a', 1.6); patte(g, 3, -5, 6, -m * 0.6, '#b8863a', 1.6);
    g.fillStyle = '#7a5226'; g.beginPath(); g.moveTo(-6, -11); g.quadraticCurveTo(-20, -15, -25, -8); g.quadraticCurveTo(-16, -9, -6, -7); g.fill(); // la longue queue
    el(g, 0, -10, 8.5, 6, '#b5682c'); el(g, -1, -9, 5, 3.5, '#d08a3c');
    g.save(); g.translate(7, -13); g.rotate(pic * 0.9); el(g, 2, -4, 3.2, 4.5, '#1f6a4a'); el(g, 3, -8, 3.4, 3.2, '#256f55'); el(g, 4.2, -8, 1.6, 1.6, '#d8362a'); g.fillStyle = '#e8c860'; g.beginPath(); g.moveTo(6, -9); g.lineTo(9.5, -8); g.lineTo(6, -7); g.fill(); el(g, 2, -1.5, 3.2, 1.1, '#f0ece0'); g.restore();
  }
  function cervide(g, a, t, cerf) {
    const m = a.moving ? Math.sin(a.step) : 0, k = cerf ? 1.12 : 0.95, br = !a.moving && !a.mort && Math.sin(t * 0.7 + a.seed) > 0.3 ? 1 : 0, robe = cerf ? '#9a6238' : '#b98250', ombre = cerf ? '#7c4c2a' : '#96673c';
    g.scale(k, k);
    patte(g, -9, -14, 14, m * 0.5, ombre, 2.6); patte(g, 8, -14, 14, -m * 0.5, ombre, 2.6); patte(g, -6, -14, 14, -m * 0.5, robe, 2.8); patte(g, 11, -14, 14, m * 0.5, robe, 2.8);
    el(g, 0, -19, 14, 8, robe); el(g, -2, -16, 9, 4, '#d8b48a'); el(g, -13, -21, 3, 3.2, '#f4ecdc'); // le corps, le ventre clair, la petite queue blanche
    if (!cerf) { g.fillStyle = 'rgba(255,244,220,0.55)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-6 + i * 4, -22 + (i % 2) * 2, 1, 0, TAU); g.fill(); } }
    g.save(); g.translate(11, -22); g.rotate(br * 1.15); // le cou et la tête : elle broute de temps en temps
    g.strokeStyle = robe; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(5, -11); g.stroke();
    el(g, 8, -14, 5.5, 4, robe); el(g, 12, -13, 2.6, 2.2, ombre); el(g, 13.6, -13.4, 1, 0.9, '#2a1c14'); el(g, 8.5, -15, 0.9, 1, '#2a1c14');
    g.fillStyle = ombre; g.beginPath(); g.ellipse(3.5, -18, 1.8, 4, -0.5, 0, TAU); g.fill();
    if (cerf) { g.strokeStyle = '#e0cfa8'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(5, -17); g.quadraticCurveTo(2, -27, 8, -32); g.moveTo(3.6, -24); g.lineTo(-1, -28); g.moveTo(5, -28); g.lineTo(1, -33); g.moveTo(6.5, -17); g.quadraticCurveTo(8, -25, 13, -29); g.moveTo(8.6, -24); g.lineTo(12, -23); g.stroke(); }
    g.restore();
  }
  const dessin = { draw(g, o, t) {
    const a = o.a; g.save(); g.translate(a.x, a.y);
    if (a.mort) g.globalAlpha = a.pris ? Math.max(0, 1 - (a.parti || 0) / 0.8) : Math.min(1, Math.max(0, (45 - a.mortT) / 3));
    el(g, 0, 0, a.k === 'faisan' ? 9 : 15, a.k === 'faisan' ? 3 : 4.5, 'rgba(0,0,0,0.18)');
    g.scale(a.face, 1);
    if (a.mort) { g.translate(0, -3); g.rotate(Math.min(1, a.mortT * 5) * 1.45); g.translate(0, a.k === 'faisan' ? 6 : 14); } // couchée sur le flanc
    else if (a.fuite > 0 && a.k !== 'faisan') g.translate(0, -Math.abs(Math.sin(a.step * 0.5)) * 5); // elle bondit en se sauvant
    if (a.k === 'faisan') faisan(g, a, t); else cervide(g, a, t, a.k === 'cerf');
    g.restore();
  } };
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R || !R.gibier) return; for (const a of R.gibier) if (CG.onScreen(a.x, a.y)) push(a.y, 21, { x: a.x, y: a.y, a, draw: dessin.draw }, null); }; }
  // ---------- les mots ----------
  if (CG.JOBS && CG.JOBS.chasseur) CG.JOBS.chasseur.desc = 'Chasse le gibier à l\'arc : viande et cuir. Tire aussi sur les monstres qui approchent.';
})(window.CG);
