// Goblin Malin — le marais : ses monstres (gelées rouges qui bondissent, araignées cracheuses, hommes-lézards à longue lance,
// cavaliers sur leurs sauriens, chamans, crapauds-buffles, basilics, et le roi dans son campement), le poison, et le sort Antidote.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, T = CG.TILE, Mo = CG.Mondes, Ma = CG.Marais = {};
  const rand = CG.rand, pick = CG.pick, dist = CG.dist, lerp = CG.lerp, TAU = Math.PI * 2;
  Object.assign(CG.ENEMIES, {
    geleeRouge: { nom: 'Gelée rouge', race: 'bete', hp: 24, dmg: 6, spd: 60, xp: 12, or: 4, cost: 2 },
    cracheuse: { nom: 'Araignée cracheuse', race: 'bete', hp: 30, dmg: 5, spd: 96, xp: 14, or: 2, cost: 3, venin: [5, 2] },
    lezard: { nom: 'Homme-lézard', race: 'lezard', hp: 44, dmg: 8, spd: 80, xp: 18, or: 8, cost: 3.5, r: 13, lance: 78 },
    lezardCav: { nom: 'Cavalier-lézard', race: 'lezard', hp: 78, dmg: 10, spd: 126, xp: 30, or: 14, cost: 6, r: 17, lance: 88 },
    chamanLezard: { nom: 'Chaman-lézard', race: 'lezard', hp: 38, dmg: 5, spd: 70, xp: 28, or: 14, cost: 5, range: 240, magic: true },
    crapaud: { nom: 'Crapaud-buffle', race: 'bete', hp: 70, dmg: 7, spd: 50, xp: 26, or: 3, cost: 5, r: 18, food: 4, venin: [6, 2] },
    basilic: { nom: 'Basilic', race: 'bete', hp: 150, dmg: 13, spd: 70, xp: 70, or: 30, cost: 9, r: 20, food: 5, venin: [8, 3] },
    roiLezard: { nom: 'Roi des hommes-lézards', race: 'lezard', hp: 520, dmg: 15, spd: 74, xp: 400, or: 250, cost: 99, r: 22, boss: true, lance: 98, zcol: '#9be04a', haut: 2 }
  });
  CG.Boss.KIT.roiLezard = ['charge', 'tourbillon', 'ecrase', 'rocher'];
  const MIENS = { geleeRouge: 1, cracheuse: 1, lezard: 1, lezardCav: 1, chamanLezard: 1, crapaud: 1, basilic: 1, roiLezard: 1 };
  const MEUTES = ['geleeRouge', 'geleeRouge', 'cracheuse', 'lezard', 'lezard', 'crapaud', 'lezardCav', 'chamanLezard'];

  // ---------- le poison ----------
  Ma.venin = function (o, sec, dps) {
    const S = CG.S, R = CG.R; if (!o || o.dead || (o.type && CG.ENEMIES[o.type]) || o.summon) return;
    if (o === S.player) { if (R.antidote > 0 || R.ko > 0) return; const v = R.venin; R.venin = { t: Math.max(sec, v ? v.t : 0), dps: Math.max(dps, v ? v.dps : 0), tic: v ? v.tic : 1 }; if (!v) G.text(o.x, o.y - 66, '☠ Empoisonné !', '#b8f070', true); return; }
    if (o.immun > R.t) return; const v = o.venin; o.venin = { t: Math.max(sec, v ? v.t : 0), dps: Math.max(dps, v ? v.dps : 0), tic: v ? v.tic : 1 };
  };
  function ronge(o, v, dt, perd) { // le poison ne tue pas : il laisse à 1 point de vie
    v.t -= dt; v.tic -= dt; if (v.tic > 0) return v.t > 0; v.tic = 1;
    const n = Math.max(1, Math.round(v.dps)); perd(n); if (CG.onScreen(o.x, o.y)) { G.text(o.x + rand(-8, 8), o.y - 48, '-' + n, CG.DMG ? CG.DMG.poison : '#b8f070'); CG.R.parts.push({ x: o.x + rand(-8, 8), y: o.y - 28, vx: 0, vy: -26, life: 0.6, max: 0.6, col: '#9be04a', size: 3, float: true }); }
    return v.t > 0;
  }
  CG.SPELLS.antidote = { nom: 'Antidote', icon: '💚', mp: 10, prix: 500, desc: 'Chasse le poison de ton corps et de tous les tiens autour de toi, et vous en protège pendant 40 secondes.', color: '#7dff8a' };
  CG.SCROLL_POOL.push('antidote');
  if (CG.Effets && CG.Effets.FICHE) CG.Effets.FICHE.antidote = ['💚', null, 'Plus de poison, 40 secondes'];
  Ma.ANTIDOTE = 40;
  const cast0 = G.cast; G.cast = function (id) {
    if (id !== 'antidote') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('heal'); R.venin = null; R.antidote = Ma.ANTIDOTE;
    S.goblins.concat(S.pets).forEach(o => { if (dist(o, p) < 320) { if (o.venin) G.text(o.x, o.y - 50, '💚', '#fff'); o.venin = null; o.immun = R.t + Ma.ANTIDOTE; } });
    for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 90 + i * 90, life: 0.45 + i * 0.15, col: '#7dff8a' }); G.puff(p.x, p.y - 20, '#7dff8a', 26, 150, 4); G.text(p.x, p.y - 70, '💚 Antidote !', '#b8ffb0', true);
  };
  if (CG.Buffs) CG.Buffs.LISTE.push(
    { k: 'venin', ic: '☠️', nom: 'Empoisonné', txt: () => 'Le poison te ronge : -' + Math.round(CG.R.venin.dps) + ' de vie par seconde. Il ne te tuera pas, mais il te laisse sans défense. Le sort Antidote le chasse.', t: () => CG.R.venin ? Math.max(0.1, CG.R.venin.t) : 0, mal: true },
    { k: 'antidote', ic: '💚', nom: 'Antidote', txt: 'Aucun poison ne t\'atteint.', t: () => CG.R.antidote > 0 ? CG.R.antidote : 0 },
    { k: 'petrif', ic: '🗿', nom: 'Pétrifié', txt: 'Tu as croisé le regard du basilic : tu ne peux plus bouger. La prochaine fois, tourne-lui le dos !', t: () => CG.R.petrif > 0 ? CG.R.petrif : 0, mal: true });

  // ---------- ce qui vole et ce qui reste par terre ----------
  const tirs = () => CG.R.tirsM || (CG.R.tirsM = []), toiles = () => CG.R.toilesM || (CG.R.toilesM = []), flaques = () => CG.R.flaquesM || (CG.R.flaquesM = []);
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && !g.perch) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); if (R.golem && !R.golem.dead) l.push(R.golem); return l; };
  function frappe(o, dmg) { const S = CG.S; if (!o) return; if (o === S.player) G.hurtPlayer(dmg); else if (o.type && CG.ENEMIES[o.type]) G.hurtEnemy(o, dmg, null); else if (o.summon) CG.Magie.hurt(o, dmg); else if (o.pet) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); }
  const visible = (e, o) => o && !o.dead && !o.hidden && o.ko !== true && !(o === CG.S.player && (CG.R.ko > 0 || CG.R.invis > 0));
  function lancerTir(e, k, tg, v) { const d = dist(e, tg) || 1; tirs().push({ k, x0: e.x, y0: e.y - 14, x1: tg.x, y1: tg.y, t: 0, dur: Math.max(0.25, d / v), by: e, dmg: e.dmg, tg }); }
  Ma.lancerTir = lancerTir; Ma.TOILE_CD = [14, 17]; Ma.TOILE_V = 120;
  // une boule de toile qui rencontre quelqu'un ou quelque chose en chemin s'écrase là, tout de suite : la toile s'étale à cet endroit
  function touche(s) {
    if ((s.k !== 'toile' && s.k !== 'toileP') || s.renvoi) return false; const k = s.t / s.dur; if (k < 0.1) return false;
    const x = lerp(s.x0, s.x1, k), y = lerp(s.y0 + 14, s.y1, k);
    for (const o of nous()) if (Math.hypot(o.x - x, o.y - y) < 17) { s.x1 = o.x; s.y1 = o.y; return true; }
    if (!W.walkPx(x, y) && !(W.isWater && W.isWater(Math.floor(x / CG.TILE), Math.floor(y / CG.TILE)))) { s.x1 = x; s.y1 = y; return true; }
    return false;
  }
  function arrive(s) {
    const R = CG.R, x = s.x1, y = s.y1;
    if (s.k === 'toileP') { toiles().push({ x, y, r: 24, t: 6, seed: Math.random() * 9 }); G.puff(x, y - 4, '#eef2ff', 5, 50, 2.5); } // la petite toile des araignées de la forêt : elle colle un peu, sans faire mal
    else if (s.k === 'toile') { toiles().push({ x, y, r: 46, t: 10, seed: Math.random() * 9 }); G.puff(x, y - 6, '#eef2ff', 10, 80, 3); for (const o of nous()) if (Math.hypot(o.x - x, o.y - y) < 30) frappe(o, s.dmg * 0.6); }
    else if (s.k === 'bave') { flaques().push({ x, y, r: 46, t: 9, tic: 0, seed: Math.random() * 9 }); G.puff(x, y - 6, '#9be04a', 14, 100, 4); R.rings.push({ x, y, r: 46, life: 0.35, col: '#9be04a' }); if (CG.onScreen(x, y)) CG.sfx('hit'); for (const o of nous()) if (Math.hypot(o.x - x, o.y - y) < 34) { frappe(o, s.dmg * 0.8); Ma.venin(o, 6, 2); } }
    else { G.puff(x, y - 12, '#9be04a', 8, 90, 3); for (const o of nous()) if (Math.hypot(o.x - x, o.y - y) < 28) { frappe(o, s.dmg); Ma.venin(o, 6, 2); break; } }
  }
  // les toiles crachées collent comme celles du nid : même ralentissement, même icône
  if (CG.Nid) { const dt0 = CG.Nid.dansToile; CG.Nid.dansToile = function (x, y) { if (dt0.apply(this, arguments)) return true; const L = CG.R && CG.R.toilesM; if (!L || !L.length) return false; for (const o of L) { const dx = (x - o.x) / o.r, dy = (y - o.y) / (o.r * 0.7); if (dx * dx + dy * dy < 1) return true; } return false; }; }
  const dansToileM = (x, y) => { const L = CG.R.toilesM; if (!L) return false; for (const o of L) { const dx = (x - o.x) / o.r, dy = (y - o.y) / (o.r * 0.7); if (dx * dx + dy * dy < 1) return true; } return false; };

  // ---------- leurs manières de se battre ----------
  function monstre(e, dt) {
    const S = CG.S, R = CG.R, p = S.player, d0 = CG.ENEMIES[e.type], tg = visible(e, e.target) ? e.target : null, libre = !(e.sleepT > 0) && !(e.charm > 0) && !(e.fear > 0) && !(e.daze > 0) && !e.kb && !e.retreat;
    const d = tg ? dist(e, tg) : 1e9;
    // morsure empoisonnée : au moment où le coup part
    if (d0.venin) { if (e.atkAnim > 0.9 && !e._vn) { e._vn = true; if (tg && d < e.r + 44) Ma.venin(tg, d0.venin[0], d0.venin[1]); } else if (e.atkAnim < 0.5) e._vn = false; }
    if (e.type === 'geleeRouge') {
      const s = e.saut;
      if (s) { s.t += dt; const k = Math.min(1, s.t / s.dur); e.x = lerp(s.x0, s.x1, k); e.y = lerp(s.y0, s.y1, k); e.z = Math.sin(k * Math.PI) * s.h; e.moving = true; e.atkCd = Math.max(e.atkCd, 0.4); e.path = null;
        if (k >= 1) { e.saut = null; e.z = 0; G.unstick(e, 8); R.rings.push({ x: e.x, y: e.y, r: 44, life: 0.35, col: '#ff6a5a' }); G.puff(e.x, e.y - 4, '#e8402a', 12, 110, 4); if (CG.onScreen(e.x, e.y)) CG.sfx('hit'); for (const o of nous()) if (Math.hypot(o.x - e.x, o.y - e.y) < 40) frappe(o, e.dmg * 1.3); e.atkCd = 0.9; } }
      else { e.sautCd = (e.sautCd === undefined ? rand(0.6, 2.4) : e.sautCd) - dt; if (libre && tg && e.sautCd <= 0 && !(e.rooted > 0) && d > 64 && d < 260 && W.walkPx(tg.x, tg.y)) { const k = (d - 12) / d; e.saut = { t: 0, dur: 0.5 + d / 520, x0: e.x, y0: e.y, x1: e.x + (tg.x - e.x) * k, y1: e.y + (tg.y - e.y) * k, h: 60 + d * 0.22 }; e.sautCd = rand(2.4, 3.8); e.face = tg.x > e.x ? 1 : -1; if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } }
      return;
    }
    if (!libre) return;
    if (e.type === 'cracheuse') { e.crCd = (e.crCd === undefined ? rand(0.8, 2.5) : e.crCd) - dt; if (tg && e.crCd <= 0 && d > 60 && d < 280 && W.lineClear(e.x, e.y, tg.x, tg.y)) { e.crCd = rand(3.6, 5); e.atkAnim = 1; e._vn = true; e.rooted = Math.max(e.rooted, 0.5); e.face = tg.x > e.x ? 1 : -1; lancerTir(e, 'toile', tg, 340); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } return; }
    if (e.type === 'crapaud') { e.crCd = (e.crCd === undefined ? rand(1, 3) : e.crCd) - dt; if (tg && e.crCd <= 0 && d > 80 && d < 300) { e.crCd = rand(4, 5.5); e.atkAnim = 1; e._vn = true; e.rooted = Math.max(e.rooted, 0.6); e.face = tg.x > e.x ? 1 : -1; lancerTir(e, 'bave', tg, 260); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); } return; }
    if (e.type === 'chamanLezard') {
      e.crCd = (e.crCd === undefined ? rand(2, 4) : e.crCd) - dt; e.soinCd = (e.soinCd === undefined ? rand(3, 6) : e.soinCd) - dt;
      if (tg && e.crCd <= 0 && d < 300 && W.lineClear(e.x, e.y, tg.x, tg.y)) { e.crCd = rand(5.5, 7.5); e.atkAnim = 1; lancerTir(e, 'dard', tg, 300); G.text(e.x, e.y - 62, '☠', '#b8f070'); }
      if (e.soinCd <= 0) { e.soinCd = 6; let n = 0; for (const o of R.enemies) { if (o.dead || o === e || CG.ENEMIES[o.type].race !== 'lezard' || o.hp >= o.maxhp || dist(o, e) > 180) continue; o.hp = Math.min(o.maxhp, o.hp + Math.ceil(o.maxhp * 0.12)); G.text(o.x, o.y - 54, '+', '#8dff8a', true); n++; } if (n) { R.rings.push({ x: e.x, y: e.y, r: 180, life: 0.5, col: '#8dff8a' }); e.atkAnim = 1; } else e.soinCd = 1.5; }
      return;
    }
    if (e.type === 'basilic') {
      e.regCd = (e.regCd === undefined ? rand(3, 5) : e.regCd) - dt;
      if (e.regard > 0) { e.regard -= dt; e.face = p.x > e.x ? 1 : -1; if (e.regard <= 0) { const dp = dist(e, p) || 1, vers = (R.dir.x * (e.x - p.x) + R.dir.y * (e.y - p.y)) / dp; if (dp < 270 && !(R.ko > 0) && !(R.invis > 0) && vers > 0.15 && W.lineClear(e.x, e.y, p.x, p.y)) { R.petrif = 1.7; G.text(p.x, p.y - 70, '🗿 Pétrifié !', '#d8d8d8', true); G.puff(p.x, p.y - 20, '#b8b8b8', 18, 110, 4); CG.sfx('no'); } else if (dp < 300) G.text(p.x, p.y - 66, 'Esquivé !', '#b8ffb0'); } }
      else if (tg === p && e.regCd <= 0 && d < 240 && W.lineClear(e.x, e.y, p.x, p.y)) { e.regCd = rand(7, 9.5); e.regard = 1.15; e.rooted = Math.max(e.rooted, 1.2); G.text(e.x, e.y - 70, '👁 Ne le regarde pas !', '#ffe36b', true); CG.sfx('warning'); }
      return;
    }
    // la longue lance des hommes-lézards
    if (d0.lance && tg && e.atkCd <= 0 && !(e.rooted > 0.25) && d < d0.lance && d > e.r + 20) { e.atkCd = 1.5; e.atkAnim = 1; e.rooted = Math.max(e.rooted, 0.42); e.face = tg.x > e.x ? 1 : -1; e.path = null; frappe(tg, e.dmg); R.bolts.push({ x1: e.x + e.face * 10, y1: e.y - 22, x2: tg.x, y2: tg.y - 18, life: 0.12 }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
  }
  const prev = new WeakMap();
  const gu0 = G.update; G.update = function (dt) {
    gu0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night) return; const p = S.player;
    for (const e of R.enemies) if (!e.dead && MIENS[e.type]) monstre(e, dt);
    for (const e of R.enemies) { if (e.dead || e.type !== 'araignee') continue; // l'araignée géante crache une petite toile, lente, de loin en loin
      e.toCd = (e.toCd === undefined ? rand(5, Ma.TOILE_CD[1]) : e.toCd) - dt; const tg = e.target; if (e.toCd > 0 || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.kb || e.retreat || !visible(e, tg)) continue;
      const d = dist(e, tg); if (d < 70 || d > 240 || !W.lineClear(e.x, e.y, tg.x, tg.y)) continue;
      e.toCd = rand(Ma.TOILE_CD[0], Ma.TOILE_CD[1]); e.atkAnim = 1; e.rooted = Math.max(e.rooted, 0.4); e.face = tg.x > e.x ? 1 : -1; lancerTir(e, 'toileP', tg, Ma.TOILE_V); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
    // projectiles
    const Ti = R.tirsM; if (Ti && Ti.length) { for (const s of Ti) { s.t += dt; if (s.t < s.dur && touche(s)) s.t = s.dur; if (s.t >= s.dur) arrive(s); } R.tirsM = Ti.filter(s => s.t < s.dur); }
    // toiles : gobelins et animaux s'y empêtrent aussi (le chef et les ennemis : voir nid.js et game.js)
    const To = R.toilesM; if (To && To.length) { for (const o of To) o.t -= dt; R.toilesM = To.filter(o => o.t > 0);
      for (const o of S.goblins.concat(S.pets)) { const q = prev.get(o); if (q && !o.hidden && dansToileM(o.x, o.y)) { o.x = q.x + (o.x - q.x) * 0.5; o.y = q.y + (o.y - q.y) * 0.5; } if (q) { q.x = o.x; q.y = o.y; } else prev.set(o, { x: o.x, y: o.y }); } }
    // flaques de poison
    const Fl = R.flaquesM; if (Fl && Fl.length) { for (const f of Fl) { f.t -= dt; f.tic -= dt; if (f.tic > 0) continue; f.tic = 0.5; for (const o of nous()) if (Math.hypot(o.x - f.x, (o.y - f.y) / 0.7) < f.r) Ma.venin(o, 4, 2); } R.flaquesM = Fl.filter(f => f.t > 0); }
    // le poison qui ronge
    if (R.antidote > 0) R.antidote -= dt; if (R.petrif > 0) R.petrif -= dt;
    if (R.venin && !ronge(p, R.venin, dt, n => { p.hp = Math.max(1, p.hp - n); })) R.venin = null;
    for (const g of S.goblins) if (g.venin && !ronge(g, g.venin, dt, n => { g.hp = Math.max(1, g.hp - n); })) g.venin = null;
    for (const a of S.pets) if (a.venin && !ronge(a, a.venin, dt, n => { a.hp = Math.max(1, a.hp - n); })) a.venin = null;
    // le roi est tombé : le campement n'a plus de maître
    if (R.roi && R.roi.dead) { if (R.roi.hp <= 0 && !S.roiMort) { S.roiMort = true; S.morale = Math.min(100, S.morale + 10); G.banner('Le roi des hommes-lézards est tombé !', 'Son campement n\'a plus de maître. Le marais te craint, maintenant.', '#b8e8c0'); CG.sfx('victory'); } R.roi = null; }
  };
  const hm0 = G.heroMul; G.heroMul = function () { return CG.R && CG.R.petrif > 0 ? 0 : hm0.apply(this, arguments); };

  // ---------- le marais au quotidien : meutes, roi, attaques des hommes-lézards ----------
  const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments); if (!Mo || !Mo.marais()) return r;
    const S = CG.S, R = CG.R, map = {}; R.noNightRaid = true;
    for (const e of R.enemies.slice()) { // les bêtes de la forêt n'ont rien à faire ici : chaque meute devient une meute du marais
      if (!e.wild || e.site || e.struct || e.campId || MIENS[e.type]) continue;
      const nt = map[e.type] || (map[e.type] = pick(MEUTES)), i = R.enemies.indexOf(e); if (i >= 0) R.enemies.splice(i, 1);
      if (Math.random() < Math.min(1, CG.ENEMIES[e.type].cost / CG.ENEMIES[nt].cost + 0.25)) G.spawnEnemy(nt, e.x, e.y, { wild: true });
    }
    if (!S.roiMort) { const L = W.POI.lezards, c = W.center(L.x, L.y), e = G.spawnEnemy('roiLezard', c.x, c.y + 20, { wild: true }); if (e) { e.site = 'lezards'; e.leash = 560; e.aggroR = 280; R.roi = e; } }
    return r;
  };
  if (CG.Camps && CG.Camps.roll) { const cr0 = CG.Camps.roll; CG.Camps.roll = function () { if (Mo && Mo.marais()) return; return cr0.apply(this, arguments); }; }
  const pl0 = D.plan; D.plan = function () {
    const r = pl0.apply(this, arguments); if (!Mo || !Mo.marais()) return r; const S = CG.S, R = CG.R;
    if (!S.buildings.some(b => b.type === 'chief' && !b.site)) { R.schedule = []; return r; } // tant que tu n'es pas installé, personne ne sait que tu es là
    R.schedule = R.schedule.filter(e => e.type !== 'demande'); R.schedule.forEach(e => { if (e.type === 'attack') { e.kind = 'lezards'; e.boss = false; } });
    return r;
  };
  const DIRS = { ouest: 'l\'ouest', est: 'l\'est', sud: 'le sud' };
  const sa0 = D.startAttack; D.startAttack = function (ev) {
    if (ev.kind !== 'lezards') return sa0.apply(this, arguments);
    const S = CG.S, R = CG.R, exit = pick(['ouest', 'est', 'sud']), e = W.EXITS[exit], day = S.day, pool = ['lezard', 'lezard', 'lezardCav', 'chamanLezard', 'cracheuse', 'geleeRouge'], out = [];
    let budget = (2 + day * 1.5 + day * day * 0.1) * 0.55;
    while (budget > 1.5 && out.length < 14) { const ok = pool.filter(t => CG.ENEMIES[t].cost <= budget + 0.6); if (!ok.length) break; const t = pick(ok); out.push(t); budget -= CG.ENEMIES[t].cost; }
    if (!out.length) out.push('lezard');
    out.forEach((type, i) => R.spawnQ.push({ t: 0.4 + i * 0.6, type, x: e.x * T + T / 2 + rand(-34, 34), y: e.y * T + T / 2 + rand(-34, 34) }));
    R.event = { type: 'attack', kind: 'lezards', exit, quiet: true, msg: [ev.night ? 'Les hommes-lézards attaquent dans la nuit !' : 'Les hommes-lézards attaquent !', 'Ils arrivent par ' + DIRS[exit] + '. Aux armes !'] };
  };

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, f) => { g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const line = (g, x1, y1, x2, y2, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const ROUGE = ['rgba(190,40,40,0.92)', 'rgba(240,90,70,0.92)', 'rgba(130,20,20,0.5)', 'rgba(255,220,200,0.5)', '#5a0c0c', '#4a0808', '#2a0808'], VERTE = ['rgba(60,170,100,0.9)', 'rgba(110,215,135,0.9)', 'rgba(40,130,80,0.5)', 'rgba(220,255,225,0.45)', '#1c5a36', '#1c4a30', '#16202a'];
  // toutes les gelées avancent par petits bonds : elles s'écrasent, décollent, retombent
  function gelee(g, e, t, C) {
    C = C || ROUGE; const bond = !e.z && e.moving ? Math.sin(t * 7) : 0, face = e.face < 0 ? -1 : 1, x = e.x, z = e.z || Math.max(0, bond) * 11, y = e.y - z, air = z > 4, sq = e.z ? -0.22 : e.moving ? -bond * 0.2 : Math.sin(t * 4) * 0.14, lunge = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) * 5 * face : 0;
    const cx = x + lunge, cy = y - 10 * (1 - sq), rx = 14 * (1 + sq), ry = 12 * (1 - sq), k = 1 - Math.min(0.6, z / 160);
    ell(g, x, e.y + 1, 13 * k, 5.4 * k, 'rgba(0,0,0,0.22)');
    ell(g, cx, cy, rx, ry, C[0]); ell(g, cx, cy - 1.5, rx * 0.86, ry * 0.8, C[1]); if (!air) ell(g, cx - rx * 0.1, y - 1.5, rx * 0.9, 2.6, C[2]);
    [[-5, 2, 1.6], [4, 4, 1.2], [1, -5, 1]].forEach(([dx, dy, r], i) => circ(g, cx + dx, cy + dy + Math.sin(t * 2 + i * 2) * 1.2, r, C[3]));
    ell(g, cx - rx * 0.36, cy - ry * 0.5, rx * 0.3, ry * 0.2, 'rgba(255,240,230,0.75)');
    const ex = cx + face * 3, ey = cy - 1; [-3.8, 3.8].forEach(dx => { circ(g, ex + dx, ey, 2.8, '#fffdf2'); circ(g, ex + dx + face * 0.8, ey + 0.2, 1.5, C[6]); });
    if (!e.calm) { line(g, ex - 6.6, ey - 4.6, ex - 1.6, ey - 2.8, C[4], 1.4); line(g, ex + 6.6, ey - 4.6, ex + 1.6, ey - 2.8, C[4], 1.4); }
    if (e.z > 4 || e.atkAnim > 0) { ell(g, ex, ey + 5.2, 3.6, 2.8, C[5]); g.fillStyle = '#fff'; g.fillRect(ex - 2.6, ey + 3.2, 1.4, 1.8); g.fillRect(ex + 1.2, ey + 3.2, 1.4, 1.8); } else line(g, ex - 2.4, ey + 4.6, ex + 2.4, ey + 4.6, C[4], 1.3);
  }
  function cracheuse(g, e, t) {
    const pr = Object.create(e); pr.type = 'araignee'; g.save(); g.translate(e.x, e.y); g.scale(1.22, 1.22); g.translate(-e.x, -e.y); Art.beast(g, pr, t); g.restore();
    const face = e.face < 0 ? -1 : 1, bx = e.x - face * 7.5, by = e.y - 13; ell(g, bx, by, 7, 5.4, 'rgba(140,230,80,0.82)'); ell(g, bx - 2, by - 2, 2.6, 1.6, 'rgba(240,255,220,0.7)'); const k = (t * 0.8) % 1; circ(g, bx, by + 6 + k * 8, 1.6 * (1 - k), 'rgba(150,235,90,0.9)');
    if (e.atkAnim > 0.5) circ(g, e.x + face * 15, e.y - 8, 3.5, '#f2f6ff');
  }
  function lezard(g, e, t, o) {
    o = o || {}; const face = e.face < 0 ? -1 : 1, s = o.s || 1, sw = e.moving ? Math.sin(e.step * TAU) : 0, bob = e.moving ? Math.abs(sw) * 1.4 : Math.sin(t * 2.4) * 0.6, th = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) : 0;
    const col = o.col || '#5a9a48', dark = o.dark || '#3e7434', lite = '#b8d880';
    g.save(); g.translate(e.x, e.y - (o.dy || 0)); if (!o.monte) ell(g, 0, 1, 13 * s, 5 * s, 'rgba(0,0,0,0.22)'); g.scale(face * s, s);
    g.strokeStyle = dark; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-4, -11 - bob); g.quadraticCurveTo(-16, -8, -21, -1 + Math.sin(t * 3) * 2.5); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(-19, -3); g.lineTo(-25, 1 + Math.sin(t * 3) * 3); g.stroke();
    if (!o.monte) { line(g, -3, -10, -3 + sw * 4, 0, dark, 4.4); line(g, 4, -10, 4 - sw * 4, 0, dark, 4.4); ell(g, -2 + sw * 4, 0.4, 3.6, 1.7, '#2e5a28'); ell(g, 5 - sw * 4, 0.4, 3.6, 1.7, '#2e5a28'); }
    ell(g, 0, -19 - bob, 8, 11, col); ell(g, 2.5, -17 - bob, 4.6, 8, lite); g.fillStyle = '#6a4a26'; g.fillRect(-8, -12 - bob, 16, 4); poly(g, [-3, -8 - bob, 4, -8 - bob, 0.5, -1 - bob], '#8a5a2a');
    if (o.roi) poly(g, [-8, -26 - bob, -11, -4 - bob, -5, -10 - bob], '#8a1c2a');
    // tête : museau, crête, œil fendu
    const hy = -33 - bob; ell(g, 3, hy, 7, 6, col); ell(g, 10.5, hy + 1.8, 6.4, 3.8, col); ell(g, 11, hy + 3.6, 5.4, 1.8, lite);
    for (let i = 0; i < 3; i++) poly(g, [-3 + i * 3.2, hy - 4.6, -1.4 + i * 3.2, hy - 10.5 + i, 0.6 + i * 3.2, hy - 4.8], o.chaman ? '#c58adf' : '#e8502a');
    ell(g, 5.4, hy - 1.2, 2.2, 2.3, '#ffe36b'); ell(g, 5.8, hy - 1.2, 0.7, 1.9, '#1c1410'); line(g, 2.6, hy - 4.2, 8, hy - 3, '#2e5a28', 1.3); circ(g, 15.5, hy + 0.8, 0.7, '#1c2a14');
    if (th > 0.2) { poly(g, [8, hy + 4.4, 15.5, hy + 4, 11, hy + 8], '#6a1420'); g.fillStyle = '#fff'; g.fillRect(9.4, hy + 4.2, 1.2, 1.8); g.fillRect(12.6, hy + 4, 1.2, 1.8); }
    if (o.roi) { poly(g, [-3.5, hy - 5, -3.5, hy - 12, -0.5, hy - 8.5, 2.5, hy - 13, 5.5, hy - 8.5, 8.5, hy - 12, 8.5, hy - 5], '#ffcf3a'); circ(g, 2.5, hy - 7, 1.3, '#e8402a'); }
    if (o.chaman) { [-1, 1].forEach(k => { g.strokeStyle = k > 0 ? '#8fe0c0' : '#ffe36b'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-2, hy - 5); g.quadraticCurveTo(-8, hy - 12 - k * 2, -9 - k, hy - 19); g.stroke(); }); }
    // bras et arme
    const ax = 5 + th * 6, ay = -22 - bob; line(g, 2, -24 - bob, ax, ay, col, 3.6); circ(g, ax, ay, 2.2, dark);
    if (o.chaman) { line(g, ax, ay + 14, ax + 1, ay - 22, '#4a3420', 2.6); circ(g, ax + 1, ay - 25, 4.6, '#eee8d8'); circ(g, ax - 0.4, ay - 25.5, 1, '#221'); circ(g, ax + 2.6, ay - 25.5, 1, '#221'); circ(g, ax + 1, ay - 25, 8 + Math.sin(t * 5) * 1.5, 'rgba(155,224,74,0.22)'); }
    else { const L = (o.roi ? 40 : 34) + th * 18, x0 = ax - 14, x1 = ax + L, yy = ay - 1 - th * 2; line(g, x0, yy + 3, x1, yy, o.roi ? '#c9a13e' : '#7a5a34', 2.6);
      if (o.roi) { [-5, 0, 5].forEach(dy => { line(g, x1 - 2, yy + dy * 0.8, x1 + 9, yy + dy, '#e8ecf4', 2); }); line(g, x1 - 2, yy - 4.4, x1 - 2, yy + 4.4, '#e8ecf4', 2); }
      else { poly(g, [x1, yy - 3.4, x1 + 11, yy, x1, yy + 3.4], '#dfe4ee'); poly(g, [x1 - 5, yy - 1.5, x1 - 1, yy - 5, x1 - 1, yy - 1.2], '#e8502a'); } }
    g.restore();
  }
  function cavalier(g, e, t) {
    const face = e.face < 0 ? -1 : 1, sw = e.moving ? Math.sin(e.step * TAU) : 0, bob = e.moving ? Math.abs(sw) * 2 : Math.sin(t * 2.2) * 0.6, x = e.x, y = e.y;
    ell(g, x, y + 2, 22, 7, 'rgba(0,0,0,0.24)'); g.save(); g.translate(x, y); g.scale(face, 1);
    const c = '#8a7a3a', dk = '#6a5c28', lt = '#d8c88a';
    g.strokeStyle = c; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(-12, -17 - bob); g.quadraticCurveTo(-26, -18, -34, -10 + Math.sin(t * 4) * 3); g.stroke();
    line(g, -6, -12, -8 + sw * 7, -5, dk, 6); line(g, -8 + sw * 7, -5, -5 + sw * 9, 0, dk, 3.6); line(g, 4, -12, 6 - sw * 7, -5, c, 6); line(g, 6 - sw * 7, -5, 9 - sw * 9, 0, c, 3.6);
    g.restore(); lezard(g, e, t, { monte: true, dy: 15 + bob, s: 0.92 }); g.save(); g.translate(x, y); g.scale(face, 1);
    ell(g, 0, -17 - bob, 16, 9, c); ell(g, 2, -13 - bob, 11, 4.4, lt); for (let i = 0; i < 4; i++) ell(g, -8 + i * 5.4, -22 - bob, 2.2, 1.5, dk);
    line(g, 12, -20 - bob, 20, -29 - bob, c, 7); ell(g, 24, -31 - bob, 7.5, 5.4, c); ell(g, 30, -29.6 - bob, 5.4, 3.4, c); circ(g, 23.6, -33 - bob, 1.9, '#ffe36b'); ell(g, 23.9, -33 - bob, 0.6, 1.6, '#1c1410');
    g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) g.fillRect(26.5 + i * 2.2, -27.6 - bob, 1.1, 2); line(g, 2, -24 - bob, 14, -22 - bob, '#6a4a26', 1.6); line(g, 14, -22 - bob, 22, -28 - bob, '#6a4a26', 1.2);
    g.restore();
  }
  function crapaud(g, e, t) {
    const face = e.face < 0 ? -1 : 1, hop = e.moving ? Math.abs(Math.sin(e.step * Math.PI)) * 7 : 0, gorge = 1 + Math.sin(t * 3.4) * 0.14, ouv = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) : 0;
    ell(g, e.x, e.y + 2, 20, 7, 'rgba(0,0,0,0.24)'); g.save(); g.translate(e.x, e.y - hop); g.scale(face, 1);
    ell(g, -12, -4, 8, 6, '#4a6a2a'); ell(g, -15, 0, 6, 2.6, '#3a5420'); ell(g, 0, -12, 18, 12.5, '#6a8a3a'); ell(g, 2, -7, 14, 7, '#c8d08a');
    ell(g, 11, -6 + ouv * 2, 6.5 * gorge, 5.5 * gorge, 'rgba(232,226,160,0.95)'); ell(g, 10, 0, 6, 2.6, '#3a5420');
    [[-8, -18, 2.2], [-2, -21, 1.8], [-12, -11, 1.6], [4, -19, 1.5], [-6, -13, 1.3]].forEach(([dx, dy, r]) => circ(g, dx, dy, r, '#4a6a2a'));
    [[5, -22], [13, -20]].forEach(([dx, dy]) => { circ(g, dx, dy, 4.6, '#6a8a3a'); circ(g, dx + 0.6, dy - 0.4, 3.2, '#ffcf3a'); ell(g, dx + 0.8, dy - 0.4, 2.2, 0.9, '#1c1410'); });
    if (ouv > 0.15) { ell(g, 14, -11, 5.5, 2 + ouv * 4, '#5a1420'); circ(g, 17 + ouv * 6, -11, 2.6, '#9be04a'); } else line(g, 6, -10.5, 19, -11.5, '#3a5420', 1.5);
    g.restore();
  }
  function basilic(g, e, t) {
    const face = e.face < 0 ? -1 : 1, bob = Math.sin(t * 3) * 1, feu = e.regard > 0;
    ell(g, e.x, e.y + 2, 26, 7, 'rgba(0,0,0,0.24)'); g.save(); g.translate(e.x, e.y); g.scale(face, 1);
    for (let i = 7; i >= 0; i--) { const sx = -6 - i * 5.4, sy = -9 + Math.sin(t * 5 + i * 0.9 + (e.moving ? e.step * 6 : 0)) * 3.2 - (i < 2 ? 2 : 0), r = 9.5 - i * 0.9; ell(g, sx, sy, r, r * 0.86, i % 2 ? '#3a6a5a' : '#2e584a'); if (i % 2 === 0) circ(g, sx, sy - r * 0.5, 2, '#e8c84a'); }
    [-14, 2].forEach((lx, i) => { const k = Math.sin(e.step * TAU + i * 3) * (e.moving ? 3 : 0); line(g, lx, -5, lx + k, 0, '#22443a', 4); });
    line(g, 0, -10, 9, -24 - bob, '#3a6a5a', 11); ell(g, 13, -29 - bob, 10, 8, '#3a6a5a'); ell(g, 21, -26 - bob, 7, 4.6, '#3a6a5a'); ell(g, 20, -24 - bob, 6, 2, '#b8d8a0');
    for (let i = 0; i < 4; i++) poly(g, [4 + i * 4, -35 - bob, 6.4 + i * 4, -45 - bob + i * 1.5, 8.6 + i * 4, -35.5 - bob], '#e8402a');
    if (feu) { const k = 1 - e.regard / 1.15; circ(g, 15, -30 - bob, 10 + k * 14, 'rgba(255,227,107,' + (0.2 + k * 0.3) + ')'); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 3; line(g, 15 + Math.cos(a) * 8, -30 - bob + Math.sin(a) * 8, 15 + Math.cos(a) * (14 + k * 14), -30 - bob + Math.sin(a) * (14 + k * 14), 'rgba(255,240,150,0.8)', 1.6); } }
    circ(g, 15, -30 - bob, feu ? 4.4 : 3.4, feu ? '#fff6a0' : '#ffe36b'); ell(g, 15.4, -30 - bob, 1, feu ? 3.6 : 2.6, '#1c1410');
    if (e.atkAnim > 0.2) { poly(g, [17, -23 - bob, 27, -24 - bob, 21, -17 - bob], '#5a1420'); g.fillStyle = '#fff'; g.fillRect(19, -23.4 - bob, 1.3, 2.4); g.fillRect(23.4, -23.6 - bob, 1.3, 2.4); }
    g.restore();
  }
  const DRAW = { gelee: (g, e, t) => gelee(g, e, t, VERTE), geleeRouge: gelee, cracheuse, lezard: (g, e, t) => lezard(g, e, t), lezardCav: cavalier, chamanLezard: (g, e, t) => lezard(g, e, t, { chaman: true, col: '#4a9a8a', dark: '#2e6a5e' }), crapaud, basilic, roiLezard: (g, e, t) => lezard(g, e, t, { roi: true, s: 1.75, col: '#4a8a3a', dark: '#2e5e28' }) };
  const en0 = Art.enemy; Art.enemy = function (g, e, t) {
    const f = DRAW[e.type]; if (!f || e.struct) return en0.apply(this, arguments);
    f(g, e, t + e.seed); if (e.slow > 0) { g.fillStyle = 'rgba(160,230,255,0.35)'; g.beginPath(); g.ellipse(e.x, e.y - 14, 16, 20, 0, 0, TAU); g.fill(); }
  };
  // au sol : toiles crachées et flaques de poison
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R;
    for (const f of R.flaquesM || []) { if (!CG.onScreen(f.x, f.y)) continue; const a = Math.min(1, f.t / 1.2); ell(g, f.x, f.y, f.r, f.r * 0.7, 'rgba(90,150,40,' + (0.4 * a) + ')'); ell(g, f.x - 4, f.y - 2, f.r * 0.7, f.r * 0.45, 'rgba(150,220,70,' + (0.4 * a) + ')'); for (let i = 0; i < 4; i++) { const k = (t * 0.7 + i / 4 + f.seed) % 1; g.strokeStyle = 'rgba(210,255,150,' + (0.8 * (1 - k) * a) + ')'; g.lineWidth = 1.4; g.beginPath(); g.arc(f.x + Math.sin(i * 2.4 + f.seed) * f.r * 0.6, f.y + Math.cos(i * 1.7 + f.seed) * f.r * 0.35, 2 + k * 5, 0, TAU); g.stroke(); } }
    for (const o of R.toilesM || []) { if (!CG.onScreen(o.x, o.y)) continue; const a = Math.min(1, o.t / 1.5); g.save(); g.translate(o.x, o.y); g.scale(1, 0.7); g.rotate(o.seed); g.strokeStyle = 'rgba(240,244,255,' + (0.75 * a) + ')'; g.lineWidth = 1.5; g.fillStyle = 'rgba(240,244,255,' + (0.12 * a) + ')'; g.beginPath(); g.arc(0, 0, o.r, 0, TAU); g.fill();
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(an) * o.r, Math.sin(an) * o.r); g.stroke(); }
      for (let k = 1; k <= 3; k++) { g.beginPath(); for (let i = 0; i <= 8; i++) { const an = i / 8 * TAU, rr = o.r * k / 3.2 * (i % 2 ? 0.94 : 1); if (i) g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else g.moveTo(rr, 0); } g.stroke(); } g.restore(); }
  };
  // par-dessus : ce qui vole, le chef pétrifié, les empoisonnés
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const S = CG.S, R = CG.R, p = S.player;
    for (const s of R.tirsM || []) { const k = s.t / s.dur, x = lerp(s.x0, s.x1, k), y = lerp(s.y0, s.y1, k) - Math.sin(k * Math.PI) * (s.k === 'bave' ? 70 : s.k === 'toile' ? 22 : s.k === 'toileP' ? 14 : 8); if (!CG.onScreen(x, y)) continue;
      if (s.k === 'toileP') { circ(g, x, y, 3.4, '#f2f6ff'); circ(g, x - 1, y - 1, 1.3, '#fff'); }
      else if (s.k === 'toile') { circ(g, x, y, 6, '#f2f6ff'); circ(g, x - 1.5, y - 1.5, 2.4, '#fff'); line(g, x, y, lerp(s.x0, s.x1, Math.max(0, k - 0.12)), lerp(s.y0, s.y1, Math.max(0, k - 0.12)) - Math.sin(Math.max(0, k - 0.12) * Math.PI) * 22, 'rgba(240,244,255,0.6)', 1.5); }
      else if (s.k === 'bave') { ell(g, s.x1, s.y1, 20 * k + 6, (20 * k + 6) * 0.6, 'rgba(155,224,74,0.18)'); circ(g, x, y, 7.5, '#7ac83a'); circ(g, x - 2, y - 2, 3, '#d8ffa0'); }
      else { circ(g, x, y, 5, '#9be04a'); circ(g, x, y, 2.2, '#f0ffd0'); } }
    if (R.petrif > 0 && !(R.ko > 0)) { g.fillStyle = 'rgba(150,150,150,0.55)'; g.beginPath(); g.ellipse(p.x, p.y - 22, 17, 28, 0, 0, TAU); g.fill(); g.font = '15px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('🗿', p.x, p.y - 62); }
    const bulle = o => { const k = (t * 1.2 + (o.id || 0) * 0.37) % 1; g.fillStyle = 'rgba(155,224,74,' + (1 - k) + ')'; g.beginPath(); g.arc(o.x + Math.sin(t * 3 + (o.id || 0)) * 8, o.y - 30 - k * 22, 2.6, 0, TAU); g.fill(); };
    if (R.venin) bulle(p); for (const o of S.goblins) if (o.venin && !o.hidden && CG.onScreen(o.x, o.y)) bulle(o); for (const o of S.pets) if (o.venin && CG.onScreen(o.x, o.y)) bulle(o);
  };
  // essais : faire apparaître toute la ménagerie autour du chef
  Ma.zoo = function () { const p = CG.S.player; return Object.keys(MIENS).map((k, i) => { const e = G.spawnEnemy(k, p.x - 240 + i * 70, p.y - 90 + (i % 2) * 40, { wild: true }); return e; }); };
})(window.CG);
