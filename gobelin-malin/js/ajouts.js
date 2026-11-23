// Clan Gobelin — ajouts : pillards qui s'en prennent aux constructions, ruines, peur, mangeoire, balançoires, nouveaux pièges.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, D = CG.D, T = CG.TILE, Art = CG.Art, TAU = Math.PI * 2;
  const rand = CG.rand, pick = CG.pick, dist = CG.dist;

  // ---------- nouvelles constructions ----------
  Object.assign(CG.BUILDS, {
    mangeoire: { nom: 'Mangeoire', icon: '🥣', w: 1, h: 1, cat: 'clan', cout: { bois: 12, food: 6 }, desc: 'Tes animaux viennent parfois y manger (1 🍖) et en ressortent avec un bonus au hasard : force, défense ou vitesse. Tu peux aussi y envoyer un animal en allant le voir.' },
    balancoire: { nom: 'Balançoires', icon: '🎠', w: 2, h: 2, cat: 'clan', cout: { bois: 25 }, desc: 'Les gobelins adorent : +1 de moral toutes les 40 secondes pendant la journée (deux balançoires au plus comptent).' },
    chausse: { nom: 'Chausse-trapes', icon: '🔩', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 2 }, tile: 'flat', flat: true, repeat: true, trap: true, desc: 'Un petit piège pas cher : de petites pointes qui piquent les pieds des ennemis.' },
    glu: { nom: 'Flaque de glu', icon: '🟢', w: 1, h: 1, cat: 'defense', on: 'road', cout: { slime: 1 }, tile: 'flat', flat: true, repeat: true, trap: true, desc: 'Ne blesse pas, mais colle aux bottes : les ennemis avancent très lentement pendant 4 secondes.' },
    filet: { nom: 'Piège à filet', icon: '🕸️', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 4, cuir: 2 }, tile: 'flat', flat: true, repeat: true, trap: true, desc: 'Attrape le premier ennemi qui passe et l\'immobilise 3 secondes. Se retend tout seul en 8 secondes.' },
    fosse: { nom: 'Fosse à pieux', icon: '🕳️', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 10, minerai: 6 }, tile: 'flat', flat: true, repeat: true, trap: true, desc: 'Un gros piège : l\'ennemi tombe dedans, prend de lourds dégâts et reste coincé un instant.' },
    baril: { nom: 'Baril explosif', icon: '💥', w: 1, h: 1, cat: 'defense', on: 'road', cout: { minerai: 8, or: 12 }, tile: 'flat', flat: true, repeat: true, trap: true, desc: 'Explose quand un ennemi marche dessus et blesse tout le groupe autour. Ne sert qu\'une fois.' }
  });
  CG.BUILDS.filet.tech = 'd18'; CG.BUILDS.fosse.tech = 'd19'; CG.BUILDS.baril.tech = 'd15'; CG.BUILDS.balancoire.tech = 'b17'; CG.BUILDS.mangeoire.tech = 'b18';
  CG.BUILDS.chausse.tech = 'd16';

  // ---------- les constructions encaissent, puis tombent en ruine (à rebâtir par les bricoleurs) ----------
  const rectDist = (b, x, y) => Math.hypot(Math.max(b.tx * T - x, 0, x - (b.tx + b.w) * T), Math.max(b.ty * T - y, 0, y - (b.ty + b.h) * T));
  G.shelter = function (g) {
    const S = CG.S, h = S.buildings[g.home]; if (h && !h.site) return h;
    return S.buildings.find(b => b.type === 'chief' && !b.site) || S.buildings.find(b => b.type === 'hut' && !b.site) || h;
  };
  // le chef frappe la construction qui est juste devant lui
  G.strikeBuilding = function () {
    const S = CG.S, R = CG.R, p = S.player; let b = null;
    for (const r of [22, 38]) { b = G.buildingAt(Math.floor((p.x + R.dir.x * r) / T), Math.floor((p.y - 6 + R.dir.y * r) / T)); if (b) break; }
    if (!b) return;
    const d = CG.BUILDS[b.type], cx = (b.tx + b.w / 2) * T, cy = (b.ty + b.h / 2) * T, dmg = G.playerDmg();
    if (b.site && d && d.barrier) { b.hp = (b.hp || d.hp * 0.5) - dmg; G.puff(cx, cy - 10, '#c9a56b', 5, 70, 3); CG.sfx(b.hp <= 0 ? 'fire' : 'chop'); if (b.hp <= 0) { G.text(cx, cy - 40, d.nom + ' détruit !', '#ff9a8a'); G.removeBuilding(b); } return; }
    if (!G.buildMaxHp(b)) { if (!b.site && (!d || !d.flat)) { G.text(cx, b.ty * T - 10, 'Indestructible', '#e8dcc0'); CG.sfx('no'); } return; }
    G.hitBuilding(b, dmg, null, true);
  };
  G.hitBuilding = function (b, dmg, e, byChief) {
    const S = CG.S, mh = G.buildMaxHp(b); if (!mh) return; if (b.hp === undefined) b.hp = mh; if (byChief) b.warned = true;
    b.hp -= dmg; const cx = (b.tx + b.w / 2) * T, cy = (b.ty + b.h / 2) * T;
    G.puff(cx + rand(-14, 14), cy - rand(0, 30), '#c9a56b', 4, 70, 3); if (CG.onScreen(cx, cy)) CG.sfx(b.hp <= 0 ? 'fire' : 'chop');
    if (!b.warned) { b.warned = true; CG.UI.toast('🔥 Les ennemis s\'en prennent à : ' + CG.BUILDS[b.type].nom + ' !'); }
    if (b.hp > 0) return;
    if (CG.BUILDS[b.type].barrier) { G.text(cx, cy - 40, CG.BUILDS[b.type].nom + ' détruit !', '#ff9a8a'); G.removeBuilding(b); return; }
    if (byChief && G.canDemolish(b)) { G.text(cx, cy - 40, CG.BUILDS[b.type].nom + ' détruit !', '#ff9a8a'); G.puff(cx, cy - 10, '#c9a56b', 26, 170, 5); G.removeBuilding(b); return; } // démoli par le chef : il disparaît pour de bon
    // en ruine : le chantier repart de zéro, sans rien coûter
    const i = S.buildings.indexOf(b);
    W.unblock(b); b.site = true; b.ruin = true; b.prog = 0; b.need = G.siteNeed(b.type); delete b.hp; b.warned = false; W.blockBuilding(b);
    G.puff(cx, cy - 10, '#c9a56b', 30, 190, 6); G.puff(cx, cy - 20, '#555', 16, 120, 5); CG.R.rings.push({ x: cx, y: cy, r: 90, life: 0.5, col: '#ffb05a' });
    G.text(cx, cy - 50, CG.BUILDS[b.type].nom + ' en ruine !', '#ff9a8a', true); if (!byChief) { S.morale = Math.max(0, S.morale - 3); CG.R.dayStats.ruines = (CG.R.dayStats.ruines || 0) + 1; }
    S.goblins.forEach(g => { if (g.home !== i && g.refuge !== b) return; if (g.hidden) { g.hidden = false; G.unstick(g, 8); } if (g.state === 'flee') g.state = 'idle'; });
    G.unstick(S.player, 9);
    if (e) { e.obj = null; e.razed = (e.razed || 0) + 1; } // il passe à la construction suivante : un attaquant ne repart plus de lui-même
  };
  // chaque matin, tout ce qui tient encore debout est réparé
  const sd = D.startDay; D.startDay = function () { sd.apply(this, arguments); W.nodes.forEach(n => { n.gone = false; }); /* les buissons cueillis par le chef ont repoussé */ CG.S.buildings.forEach(b => { const mh = G.buildMaxHp(b); if (mh) b.hp = mh; b.warned = false; }); };

  // ---------- les pillards : chacun choisit une hutte (ou autre chose) et s'y attaque ----------
  function pickObj(e) {
    const S = CG.S, list = [];
    for (const b of S.buildings) {
      if (b.site || !CG.BUILDS[b.type] || CG.BUILDS[b.type].barrier || !G.buildMaxHp(b)) continue;
      const w = (b.type === 'hut' ? 4 : b.type === 'chief' ? 3 : 1.5) / (1 + Math.hypot((b.tx + b.w / 2) * T - e.x, (b.ty + b.h / 2) * T - e.y) / 500);
      list.push([b, w]);
    }
    let tot = list.reduce((a, l) => a + l[1], 0); const loot = tot * 0.2 + 0.2; // une fois sur cinq environ : piller la réserve
    let r = Math.random() * (tot + loot); if (r >= tot) return 'stock';
    for (const l of list) { r -= l[1]; if (r <= 0) return l[0]; }
    return 'stock';
  }
  // où un pillard se place pour voler : devant la réserve, un dépôt ou un grenier (le plus proche), jamais au feu
  G.stockSpot = function (e) {
    let b = e.stockB;
    if (!b || b.gone || b.site) {
      b = null; let bd = 1e9;
      for (const o of CG.S.buildings) { if (o.site || (o.type !== 'stock' && o.type !== 'depot' && o.type !== 'grenier')) continue; const d = G.door(o), dd = Math.hypot(d.x - e.x, d.y - e.y); if (dd < bd) { bd = dd; b = o; } }
      e.stockB = b;
    }
    if (!b) { const f = G.firePos(); return { x: f.x, y: f.y + 40, bx: f.x }; }
    const d = G.door(b); return { x: d.x + ((e.id % 5) - 2) * 10, y: d.y - 4 + (e.id % 2) * 8, bx: d.x };
  };
  // renvoie vrai tant que le pillard s'occupe d'une construction ; faux = pillage de la réserve (ancien comportement)
  G.raidStep = function (e, dt, spd) {
    let o = e.obj;
    if (o && o !== 'stock' && (o.gone || o.site)) o = e.obj = null;
    if (!o) { o = e.obj = pickObj(e); e.objT = 0; e.path = null; }
    if (o === 'stock') return false;
    const d = G.door(o), tx = d.x + ((e.id % 5) - 2) * 9, ty = d.y - 6, rd = rectDist(o, e.x, e.y);
    if (rd > (e.range ? 150 : 30)) {
      e.objT += dt; if (e.objT > 40) { e.obj = 'stock'; return false; } // introuvable ou trop bien protégé : il va piller
      if (spd) G.chase(e, tx, ty, spd, dt); return true;
    }
    const cx = (o.tx + o.w / 2) * T, cy = (o.ty + o.h / 2) * T; e.face = cx > e.x ? 1 : -1; e.objT = 0; e.blase = true; // une fois à l'ouvrage, il ne se laisse plus distraire par un simple regard
    if (e.atkCd <= 0) {
      e.atkAnim = 1;
      if (e.range) { e.atkCd = 1.9; G.shoot(e, { x: cx, y: cy }, CG.ENEMIES[e.type].magic ? 'fireE' : 'arrow', 0.01, 'e'); G.hitBuilding(o, e.dmg * 0.8, e); }
      else { e.atkCd = 1.15; G.hitBuilding(o, e.dmg, e); }
    }
    return true;
  };

  // ---------- peur (sort d'illusion) : il fuit vers chez lui, reste confus, puis revient ----------
  G.fearStep = function (e, dt) {
    const p = CG.S.player;
    if (e.fear > 0) {
      e.fear -= dt; const spd = e.rooted > 0 ? 0 : e.spd * 1.3 * (e.slow > 0 ? 0.45 : 1), home = e.exit || e.wild;
      if (e.fearGo === 0) { e.fearGo = home && Math.hypot(home.x - e.x, home.y - e.y) > 50 && G.goTo(e, home.x, home.y) ? 1 : 2; }
      if (e.fearGo === 1 && e.path && e.path.length) { if (spd) G.follow(e, spd, dt); }
      else if (spd) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (G.slide(e, dx / d * spd * dt, dy / d * spd * dt)) { e.moving = true; e.step += dt * spd / 34; e.face = dx > 0 ? 1 : -1; } }
      if (e.fear <= 0) { e.daze = 2; e.path = null; e.aggro = null; e.target = null; }
      return;
    }
    e.daze -= dt; e.moving = false; if (Math.random() < dt * 5) e.face = -e.face; // il regarde partout, perdu
    if (e.daze <= 0) { e.path = null; e.seek = 0; }
  };
  const cast0 = G.cast;
  G.cast = function (id) {
    if (id !== 'illusion' && id !== 'retour' && id !== 'murfeu') return cast0(id);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell');
    if (id === 'retour') { // retour au village d'un coup, devant la hutte du chef
      const d = G.door(G.find('chief')); G.puff(p.x, p.y - 16, '#b070ff', 26, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 70, life: 0.4, col: '#b070ff' });
      p.x = d.x; p.y = d.y + 10; p.path = null; R.build = null; G.unstick(p, 9);
      G.puff(p.x, p.y - 16, '#b070ff', 26, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 90, life: 0.5, col: '#ffffff' }); G.text(p.x, p.y - 64, '🏠 De retour au village !', '#e0c8ff', true); return;
    }
    if (id === 'murfeu') { // un mur de flammes en travers, juste devant le chef
      const tg = G.nearestEnemy(p.x, p.y, 320), dx0 = tg ? tg.x - p.x : R.dir.x, dy0 = tg ? tg.y - p.y : R.dir.y, dl = Math.hypot(dx0, dy0) || 1, ux = dx0 / dl, uy = dy0 / dl;
      const gap = tg ? Math.min(90, Math.max(46, dl * 0.5)) : 80, cx = p.x + ux * gap, cy = p.y + uy * gap, half = 120;
      (R.walls = R.walls || []).push({ x1: cx - uy * half, y1: cy + ux * half, x2: cx + uy * half, y2: cy - ux * half, t: 10, max: 10, tick: 0, dmg: 6 * (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1), seed: Math.random() * 10 });
      if (Math.abs(ux) > 0.1) p.face = ux > 0 ? 1 : -1; CG.sfx('fire'); return;
    }
    CG.sfx('horn');
    const rad = 300; R.rings.push({ x: p.x, y: p.y - 10, r: rad, life: 0.6, col: '#c08aff' }, { x: p.x, y: p.y - 10, r: rad * 0.6, life: 0.5, col: '#ffffff' });
    R.ghost = { x: p.x, y: p.y, t: 1.6 }; G.puff(p.x, p.y - 40, '#c08aff', 34, 240, 5);
    let n = 0;
    for (const e of R.enemies) { if (e.dead || e.struct || dist(e, p) > rad + e.r) continue; e.fear = CG.ENEMIES[e.type].boss ? 3 : 6; e.daze = 0; e.fearGo = 0; e.path = null; e.calm = false; n++; G.text(e.x, e.y - 50, '😱', '#fff'); }
    if (!n) G.text(p.x, p.y - 70, 'Personne à effrayer...', '#c08aff');
  };

  // ---------- pièges, balançoires ----------
  const upd0 = G.updateBuildings;
  G.updateBuildings = function (dt) {
    upd0(dt);
    const S = CG.S, R = CG.R, day = S.day, poison = G.tech('d10');
    let swings = 0;
    for (const b of S.buildings.slice()) {
      if (b.site) continue;
      if (b.type === 'balancoire') { swings++; continue; }
      const d = CG.BUILDS[b.type]; if (!d || !d.trap) continue;
      if (b.cdT > 0) { b.cdT -= dt; if (b.type === 'filet') continue; }
      for (const e of R.enemies) {
        if (e.dead || e.struct || Math.floor(e.x / T) !== b.tx || Math.floor(e.y / T) !== b.ty) continue;
        const cx = (b.tx + 0.5) * T, cy = (b.ty + 0.5) * T;
        if (b.type === 'baril') { G.removeBuilding(b); G.explode(cx, cy, 95, 28 + day * 3, '#ff8a1e'); break; }
        if (b.type === 'filet') { e.rooted = Math.max(e.rooted, 3); b.cdT = 8; G.text(cx, cy - 40, '🕸️ Pris !', '#fff'); G.puff(cx, cy - 10, '#e8e0c8', 10, 80, 3); CG.sfx('swing'); break; }
        if (R.t < (e['t_' + b.type] || 0)) continue;
        if (b.type === 'glu') { e['t_glu'] = R.t + 1; e.slow = Math.max(e.slow, 4); if (Math.random() < 0.5) G.puff(e.x, e.y - 4, '#8ad84a', 3, 40, 3); }
        else if (b.type === 'chausse') { e['t_chausse'] = R.t + 0.9; if (poison) e.slow = Math.max(e.slow, 1.2); G.hurtEnemy(e, (2 + day * 0.4) * (poison ? 2 : 1), null); }
        else if (b.type === 'fosse') { e['t_fosse'] = R.t + 3.5; e.rooted = Math.max(e.rooted, 1.3); G.puff(cx, cy - 6, '#6b4a2a', 12, 90, 4); G.hurtEnemy(e, 16 + day * 2, null); }
      }
    }
    if (swings && S.hour >= 7 && S.hour < 19 && !R.alarm) {
      R.swingT = (R.swingT || 0) + dt;
      if (R.swingT >= 40) { R.swingT = 0; const n = Math.min(2, swings); S.morale = Math.min(100, S.morale + n); for (const b of S.buildings) if (b.type === 'balancoire' && !b.site) G.text((b.tx + 1) * T, b.ty * T - 10, '+1 😊', '#c8ffb0'); }
    }
    if (R.ghost) { R.ghost.t -= dt; if (R.ghost.t <= 0) R.ghost = null; }
    G.pickStep(dt);
    if (R.drops && R.drops.length) {
      const p = S.player;
      for (const d of R.drops) {
        if (d.d > 0) { d.d -= dt; continue; }
        if (d.f < 1) { // il vole en cloche jusqu'à son point de chute
          d.f = Math.min(1, d.f + dt / 0.6); d.x = CG.lerp(d.sx, d.tx, d.f); d.y = CG.lerp(d.sy, d.ty, d.f); d.h = Math.sin(d.f * Math.PI) * 54;
          if (d.f >= 1) { d.h = 0; d.land = 0.25; G.puff(d.x, d.y, '#e8dcc0', 3, 40, 2); }
          continue;
        }
        if (d.land > 0) d.land -= dt;
        if (R.ko > 0) continue;
        const dx = p.x - d.x, dy = p.y - 6 - d.y, dd = Math.hypot(dx, dy) || 1;
        const loin = G.ramasseK ? G.ramasseK() : 1; // « Bras longs » (objets.js) : on ramasse de plus loin
        if (dd < 24 * loin) { G.pickUp(d); d.gone = true; }
        else if (dd < 62 * loin) { const st = Math.min(dd, 190 * dt); d.x += dx / dd * st; d.y += dy / dd * st; } // aspiré quand on passe tout près
      }
      R.drops = R.drops.filter(d => !d.gone);
    }
    if (R.walls && R.walls.length) {
      for (const w of R.walls) {
        w.t -= dt; w.tick -= dt; if (w.tick > 0) continue; w.tick = 0.45;
        const vx = w.x2 - w.x1, vy = w.y2 - w.y1, L2 = vx * vx + vy * vy;
        for (const e of R.enemies) { if (e.dead || e.struct) continue; const k = CG.clamp(((e.x - w.x1) * vx + (e.y - w.y1) * vy) / L2, 0, 1); if (Math.hypot(e.x - (w.x1 + vx * k), e.y - (w.y1 + vy * k)) < 24 + e.r) { G.hurtEnemy(e, w.dmg, S.player); } /* il brûle, il ne ralentit pas */ }
      }
      R.walls = R.walls.filter(w => w.t > 0);
    }
  };
  // ---------- butin au sol (coffres) : il tombe là où il y a de la place, on le ramasse en marchant dessus ----------
  G.drop = function (cx, cy, it) {
    const R = CG.R, used = R.drops = R.drops || []; let x = cx, y = cy + 20;
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * TAU, r = rand(36, 62 + i * 3), nx = cx + Math.cos(a) * r, ny = cy + 8 + Math.sin(a) * r * 0.8;
      if (!W.walkPx(nx, ny) || !W.walkPx(nx - 9, ny) || !W.walkPx(nx + 9, ny) || !W.walkPx(nx, ny + 7)) continue;
      if (i < 16 && used.some(o => Math.hypot(o.tx - nx, o.ty - ny) < 20)) continue; // pas empilés les uns sur les autres
      x = nx; y = ny; break;
    }
    used.push(Object.assign({ x: cx, y: cy - 10, sx: cx, sy: cy - 10, tx: x, ty: y, f: 0, h: 0, d: used.filter(o => o.f === 0).length * 0.07, seed: Math.random() * 10 }, it));
  };
  G.dropRes = function (cx, cy, res, n) {
    const piles = Math.min(5, Math.max(1, Math.ceil(n / (res === 'or' ? 10 : 5)))); let left = n;
    for (let i = 0; i < piles; i++) { const q = i === piles - 1 ? left : Math.round(n / piles); left -= q; if (q > 0) G.drop(cx, cy, { kind: 'res', res, n: q }); }
  };
  G.pickUp = function (d) {
    const S = CG.S, p = S.player;
    if (d.kind === 'res') { G.gain(d.res, d.n, d.x, d.y - 24); CG.sfx('coin'); }
    else if (d.kind === 'potion') { p.potions += d.n; G.text(d.x, d.y - 30, '+' + d.n + ' fiole de vie ❤️', '#ff8a8a'); CG.sfx('ok'); }
    else if (d.kind === 'scroll') G.giveScroll(d.id, d.x, d.y);
    else if (d.kind === 'mystere') { if (CG.Puits && CG.Puits.ouvrirBoule) CG.Puits.ouvrirBoule(d); }
    else if (d.kind === 'xp') { G.addXp(d.n); G.text(d.x, d.y - 30, '+' + d.n + ' XP ✨', '#9ad0ff'); CG.sfx('ok'); }
    G.puff(d.x, d.y - 6, '#ffe36b', 5, 60, 2);
  };
  // ce qui traîne encore par terre le soir est ramassé par le clan pendant la nuit
  const nd = D.nextDay; D.nextDay = function () { (CG.R.drops || []).forEach(d => { d.x = CG.S.player.x; d.y = CG.S.player.y; G.pickUp(d); }); CG.R.drops = []; return nd.apply(this, arguments); };
  Art.drops = function (g, list, t) {
    g.textAlign = 'center';
    for (const d of list) {
      if (d.d > 0 || !CG.onScreen(d.x, d.y)) continue;
      const fly = d.f < 1, bob = fly ? 0 : Math.sin(t * 3 + d.seed) * 2, sq = d.land > 0 ? 1 - d.land * 1.2 : 1, y = d.y - d.h - 6 - bob;
      ell(g, d.x, d.y + 2, 9 * (fly ? 0.6 : 1), 3.5, 'rgba(0,0,0,0.28)');
      if (!fly && (d.kind === 'scroll' || d.kind === 'recette' || d.kind === 'potion' || d.kind === 'xp' || d.kind === 'mystere')) circ(g, d.x, y - 4, 13 + Math.sin(t * 4 + d.seed) * 2, d.kind === 'xp' ? 'rgba(150,210,255,0.3)' : d.kind === 'mystere' ? 'rgba(190,150,255,0.35)' : d.kind === 'scroll' ? 'rgba(255,227,107,0.3)' : 'rgba(255,90,100,0.3)');
      g.save(); g.translate(d.x, y); g.scale(1, sq); if (fly) g.rotate(d.f * 9 + d.seed);
      g.fillStyle = '#fff'; g.font = (d.kind === 'res' ? 19 : 21) + 'px sans-serif'; if (d.kind === 'potion' && Art.fiole) Art.fiole(g, 0, 2, 1); else if (d.kind === 'mystere' && Art.bouleMystere) { if (fly) g.rotate(-(d.f * 9 + d.seed)); Art.bouleMystere(g, t + d.seed); } else g.fillText(d.kind === 'res' ? CG.RES[d.res].icon : d.kind === 'scroll' ? '📜' : d.kind === 'recette' ? '📄' : '✨', 0, 4);
      g.restore();
    }
  };
  G.explode = function (x, y, r, dmg, col) {
    const R = CG.R; R.rings.push({ x, y, r, life: 0.4, col }); G.puff(x, y, col, 26, 210, 5); G.puff(x, y, '#444', 12, 120, 5); CG.sfx('fire');
    for (const e of R.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < r + e.r) G.hurtEnemy(e, dmg, null);
  };

  // ---------- le guérisseur : à sa hutte, il soigne tous ceux qui sont autour ----------
  CG.BUILDS.guerisseur = { nom: 'Hutte du guérisseur', icon: '🌿', w: 2, h: 2, cat: 'clan', cout: { bois: 25, food: 10 }, desc: 'Donne le métier de Guérisseur à un gobelin : posté ici, il soigne les gobelins, les animaux et le chef qui se tiennent près de la hutte, même pendant une attaque.' };
  CG.BUILDS.guerisseur.tech = 'b25'; // à débloquer dans l'arbre (Premiers soins)
  G.healR = () => G.tech('b19') ? 250 : 190;
  G.healerStep = function (g, dt) {
    const S = CG.S, R = CG.R; let b = null, bd = 1e9;
    for (const o of S.buildings) { if (o.type !== 'guerisseur' || o.site) continue; const d = Math.hypot((o.tx + 1) * T - g.x, (o.ty + 2) * T - g.y) + (o.healer && o.healer !== g && R.t - o.healOn < 1 ? 5000 : 0); if (d < bd) { bd = d; b = o; } }
    if (!b || (G.partyTime() && !R.alarm)) { if (g.state === 'toHeal' || g.state === 'heal') { g.state = 'idle'; g.pose = null; } if (!b && !R.alarm) g.bubble = '🌿'; return false; }
    if (g.hidden) g.hidden = false;
    const d = G.door(b), px = d.x + 22, py = d.y - 2;
    if (g.state !== 'toHeal' && g.state !== 'heal') { G.resetGoblin(g); g.state = 'toHeal'; g.bubble = null; G.goTo(g, px, py); }
    if (g.state === 'toHeal') { if (Math.hypot(px - g.x, py - g.y) < 16 || G.follow(g, 110, dt)) { g.state = 'heal'; } return true; }
    g.moving = false; b.healer = g; b.healOn = R.t;
    const cx = (b.tx + 1) * T, cy = (b.ty + 1.5) * T, nv = Math.min(2, b.up || 0), A2 = CG.Ameliorer2, HR = G.healR() + (A2 ? A2.RAYON * nv : 0), near = o => Math.hypot(o.x - cx, o.y - cy) < HR, p = S.player;
    const maxOf = o => o === p ? p.maxhp : o.pet ? CG.P.maxHp(o) : G.gobMaxHp(o), ok = o => o && !o.hidden && !o.dead && o.ko !== true && !(o === p && R.ko > 0) && o.hp < maxOf(o) - 0.05 && near(o) && (o === p || o.pet ? true : S.goblins.includes(o));
    // un seul patient à la fois : celui qui en a le plus besoin, gardé jusqu'à ce qu'il soit guéri
    if (!ok(g.patient)) { g.patient = null; let worst = 1; for (const o of S.goblins.concat(S.pets, [p])) { if (!ok(o)) continue; const k = o.hp / maxOf(o); if (k < worst) { worst = k; g.patient = o; } } }
    const o = g.patient;
    if (!o) { g.pose = null; return true; }
    g.pose = 'heal'; g.face = o.x > g.x ? 1 : -1; g.healT = R.t; o.healedT = R.t;
    o.hp = Math.min(maxOf(o), o.hp + 2.6 * (G.tech('b19') ? 2 : 1) * (1 + (A2 ? A2.SOIN * nv : 0)) * G.workSpeed(g) * dt);
    g.plusT = (g.plusT || 0) - dt; if (g.plusT <= 0) { g.plusT = 0.32; R.texts.push({ x: o.x + rand(-10, 10), y: o.y - 34 - rand(0, 8), txt: Math.random() < 0.3 ? '++' : '+', col: '#8dff9a', life: 0.9, big: Math.random() < 0.4 }); }
    if (Math.random() < dt * 5) R.parts.push({ x: g.x + g.face * 10 + rand(-4, 4), y: g.y - 30, vx: g.face * rand(10, 30), vy: rand(-36, -16), life: 0.5, max: 0.5, col: '#b8ffc0', size: 2.5, float: true });
    g.healXp = (g.healXp || 0) + dt; if (g.healXp > 6) { g.healXp = 0; G.gobXp(g, 1, 5); }
    return true;
  };

  // halo vert au sol : sous celui qu'on soigne, et sous le guérisseur concentré
  Art.healGlow = function (g, t) {
    const S = CG.S, R = CG.R, halo = (o, r, a) => { const pu = 0.5 + Math.sin(t * 6) * 0.5, gr = g.createRadialGradient(o.x, o.y, 2, o.x, o.y, r); gr.addColorStop(0, 'rgba(120,255,140,' + (a + pu * 0.2) + ')'); gr.addColorStop(1, 'rgba(120,255,140,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(o.x, o.y + 1, r, r * 0.5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(170,255,180,' + (0.5 + pu * 0.3) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(o.x, o.y + 1, r * 0.62 + pu * 2, r * 0.3 + pu, 0, 0, TAU); g.stroke(); };
    for (const o of S.goblins.concat(S.pets, [S.player])) { if (o.hidden) continue; if (R.t - o.healedT < 0.3) halo(o, 30, 0.5); if (R.t - o.healT < 0.3) halo(o, 22, 0.3); }
  };
  // cueillir un buisson prend un petit moment : on reste à côté, sans bouger
  G.pickStep = function (dt) {
    const S = CG.S, R = CG.R, k = R.picking; if (!k) return;
    const p = S.player, x = k.n.x * T + T / 2, y = k.n.y * T + T / 2;
    if (k.n.gone || R.ko > 0 || Math.hypot(p.x - k.px, p.y - k.py) > 5 || CG.UI.modal) { R.picking = null; return; }
    k.t += dt; p.face = x > p.x ? 1 : -1; R.chefPose = { k: 'gather', fin: R.t + 0.15 }; /* il cueille à deux mains, penché sur le buisson : plus de coup de bâton */
    if (Math.random() < dt * 6) G.puff(x + rand(-12, 12), y - 8 - rand(0, 10), Math.random() < 0.6 ? '#3a8a44' : (CG.Art.baie ? CG.Art.baie(k.n).col : '#d8264a'), 1, 40, 3);
    if (Math.random() < dt * 3) CG.sfx('chop');
    if (k.t < k.max) return;
    R.picking = null; k.n.gone = true; const dore = CG.Art.baie && CG.Art.baie(k.n) === CG.Art.BAIES[3]; G.gain('food', CG.D.BUSH_FOOD * (dore ? CG.Art.DOREE_FOIS : 1), x, y - 30); if (dore) G.text(x, y - 56, '✨ Baies dorées : le double !', '#ffe36b', true); G.puff(x, y - 10, '#3a8a44', 16, 110, 5); G.puff(x, y - 14, '#d8264a', 8, 90, 3); CG.sfx('coin');
  };

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, f) => ell(g, x, y, r, r, f);
  const line = (g, a, b, c, d, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const box = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  Art.extra.mangeoire = { w: 52, h: 48, draw(c) {
    ell(c, 26, 41, 23, 5, 'rgba(0,0,0,0.25)'); box(c, 8, 30, 5, 11, '#5a3d22'); box(c, 39, 30, 5, 11, '#5a3d22');
    poly(c, [3, 18, 49, 18, 44, 34, 8, 34], '#8a6234'); poly(c, [26, 18, 49, 18, 44, 34, 26, 34], '#74502a'); box(c, 2, 16, 48, 4, '#a47a46');
    ell(c, 26, 18, 20, 5, '#b85a34'); circ(c, 17, 16, 4, '#d8744a'); circ(c, 27, 14, 4.5, '#c8643e'); circ(c, 36, 16, 4, '#d8744a'); box(c, 20, 10, 3, 6, '#f4ead0'); circ(c, 21.5, 9, 2.5, '#f4ead0');
    poly(c, [22, 26, 26, 22, 30, 26, 26, 30], '#f4ead0'); // petite patte gravée
  } };
  Art.extra.balancoire = { w: 104, h: 104, draw(c) {
    const m = 52, b = 96; ell(c, m, b, 46, 8, 'rgba(0,0,0,0.22)');
    line(c, m - 44, b, m - 32, b - 82, '#6b4a2a', 5); line(c, m - 20, b, m - 32, b - 82, '#5a3d22', 5);
    line(c, m + 44, b, m + 32, b - 82, '#5a3d22', 5); line(c, m + 20, b, m + 32, b - 82, '#6b4a2a', 5);
    line(c, m - 36, b - 82, m + 36, b - 82, '#8a6234', 6); circ(c, m - 32, b - 82, 4, '#a47a46'); circ(c, m + 32, b - 82, 4, '#a47a46');
    poly(c, [m - 4, b - 88, m + 4, b - 88, m, b - 98], '#d8402a');
  }, anim(g, x, y, t, night, b) {
    const top = y - 82 + 6 - 8; // barre du haut
    [-15, 15].forEach((ox, i) => {
      const a = Math.sin(t * 2.2 + i * 1.7 + b.tx) * (night ? 0.08 : 0.5), L = 52, px = x + ox, sx = px + Math.sin(a) * L, sy = top + Math.cos(a) * L;
      line(g, px - 5, top, sx - 6, sy, '#d8c8a0', 1.6); line(g, px + 5, top, sx + 6, sy, '#d8c8a0', 1.6); box(g, sx - 9, sy - 1, 18, 4, '#a47a46');
      if (!night && !i) { // un petit gobelin se balance
        ell(g, sx, sy - 7, 5, 6, '#6b4a2a'); circ(g, sx, sy - 17, 6, '#6ab84a'); poly(g, [sx - 5, sy - 18, sx - 13, sy - 21, sx - 5, sy - 14], '#6ab84a'); poly(g, [sx + 5, sy - 18, sx + 13, sy - 21, sx + 5, sy - 14], '#5aa83e');
        circ(g, sx - 2, sy - 18, 1.1, '#221'); circ(g, sx + 2.4, sy - 18, 1.1, '#221'); line(g, sx - 2, sy - 14.5, sx + 2, sy - 14.5, '#221', 1); line(g, sx - 2, sy - 2, sx - 3 + Math.sin(a) * 6, sy + 7, '#6ab84a', 2.6); line(g, sx + 2, sy - 2, sx + 3 + Math.sin(a) * 6, sy + 7, '#5aa83e', 2.6);
      }
    });
  } };
  Art.extra.guerisseur = { w: 108, h: 116, draw(c) {
    const m = 54, b = 108; ell(c, m, b, 44, 9, 'rgba(0,0,0,0.25)');
    box(c, m - 36, b - 44, 72, 44, '#e8dcc0'); box(c, m, b - 44, 36, 44, 'rgba(0,0,0,0.12)'); box(c, m - 36, b - 8, 72, 8, '#b8a888');
    box(c, m - 9, b - 26, 18, 26, '#3a5a2a');
    poly(c, [m - 46, b - 40, m + 46, b - 40, m + 14, b - 92, m - 14, b - 92], '#4f9a44'); poly(c, [m, b - 40, m + 46, b - 40, m + 14, b - 92, m, b - 92], '#3d7c36');
    [[-30, -50], [-12, -62], [8, -52], [26, -60], [-2, -78]].forEach(([x, y]) => { ell(c, m + x, b + y, 6, 3.5, '#7ad06a'); });
    circ(c, m, b - 58, 11, '#fff'); box(c, m - 2.5, b - 66, 5, 16, '#3aa84a'); box(c, m - 8, b - 60.5, 16, 5, '#3aa84a');
    box(c, m + 26, b - 30, 3, 30, '#6b4a2a'); [[-6, '#d8402a'], [0, '#e8c84a'], [6, '#b070ff']].forEach(([x, col]) => { line(c, m + 27 + x, b - 30, m + 27 + x, b - 22, '#6b4a2a', 1); ell(c, m + 27 + x, b - 19, 2.6, 4, col); });
    ell(c, m - 28, b - 4, 8, 6, '#7a5630'); ell(c, m - 28, b - 8, 7, 3, '#8ad84a');
  } };
  // murs de feu : une rangée de flammes qui dansent, plus basses à la fin
  Art.fireWalls = function (g, walls, t) {
    for (const w of walls) {
      const n = 13, k = Math.min(1, w.t / 1.2) * Math.min(1, (w.max - w.t) / 0.3 + 0.2);
      for (let i = 0; i < n; i++) {
        const x = CG.lerp(w.x1, w.x2, i / (n - 1)), y = CG.lerp(w.y1, w.y2, i / (n - 1)), h = (26 + Math.sin(t * 9 + i * 1.7 + w.seed) * 8) * k, sw = Math.sin(t * 6 + i) * 3;
        ell(g, x, y + 2, 12, 5, 'rgba(255,120,30,0.35)');
        g.fillStyle = '#ff5a1e'; g.beginPath(); g.moveTo(x - 10, y + 2); g.quadraticCurveTo(x - 11, y - h * 0.6, x + sw, y - h); g.quadraticCurveTo(x + 11, y - h * 0.6, x + 10, y + 2); g.fill();
        g.fillStyle = '#ffb432'; g.beginPath(); g.moveTo(x - 6, y + 2); g.quadraticCurveTo(x - 6, y - h * 0.4, x + sw * 0.6, y - h * 0.68); g.quadraticCurveTo(x + 6, y - h * 0.4, x + 6, y + 2); g.fill();
        ell(g, x, y - 3, 3, 5 * k, '#fff2a0');
      }
    }
  };
  const flats0 = Art.flats;
  Art.flats = function (g, list, t) {
    flats0(g, list, t);
    for (const b of list) {
      const x = b.tx * T, y = b.ty * T, cx = x + T / 2, cy = y + T / 2;
      if (b.type === 'chausse') {
        ell(g, cx, cy + 2, 15, 11, 'rgba(58,42,26,0.45)');
        [[-8, -3], [2, -6], [9, 1], [-3, 5], [6, 8], [-10, 7]].forEach(([dx, dy]) => { poly(g, [cx + dx - 2.5, cy + dy + 2, cx + dx, cy + dy - 5, cx + dx + 2.5, cy + dy + 2], '#b8bcc8'); line(g, cx + dx - 3, cy + dy + 2, cx + dx + 3, cy + dy + 2, '#74787f', 1.4); if (CG.G.tech('d10')) circ(g, cx + dx, cy + dy - 4.5, 1.6, '#7adf4a'); });
      } else if (b.type === 'glu') {
        const w = Math.sin(t * 1.8 + b.tx) * 1.5; ell(g, cx, cy + 2, 17 + w, 13 - w * 0.5, '#4f9a2e'); ell(g, cx - 2, cy, 13 + w, 9, '#7ad04a'); ell(g, cx - 6, cy - 3, 5, 2.5, 'rgba(255,255,255,0.45)');
        const p = (t * 0.6 + b.ty * 0.3) % 1; circ(g, cx + 6, cy + 2, 2 + p * 3, 'rgba(200,255,150,' + (0.7 * (1 - p)) + ')'); circ(g, cx - 12, cy + 8, 3, '#7ad04a'); circ(g, cx + 13, cy - 6, 2.4, '#7ad04a');
      } else if (b.type === 'filet') {
        const ready = !(b.cdT > 0); g.globalAlpha = ready ? 1 : 0.4; ell(g, cx, cy + 2, 16, 12, 'rgba(58,42,26,0.35)');
        g.strokeStyle = '#e8e0c8'; g.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 6, cy - 10); g.lineTo(cx + i * 6, cy + 13); g.moveTo(cx - 15, cy + 1 + i * 5); g.lineTo(cx + 15, cy + 1 + i * 5); g.stroke(); }
        [[-15, -10], [15, -10], [-15, 13], [15, 13]].forEach(([dx, dy]) => circ(g, cx + dx, cy + dy, 2.6, '#6b4a2a')); g.globalAlpha = 1;
      } else if (b.type === 'fosse') {
        ell(g, cx, cy + 2, 19, 15, '#5e4226'); ell(g, cx, cy + 2, 16, 12, '#1c120a');
        [[-8, 0], [0, -3], [8, 1], [-4, 6], [5, 7]].forEach(([dx, dy]) => { poly(g, [cx + dx - 3, cy + dy + 5, cx + dx, cy + dy - 6, cx + dx + 3, cy + dy + 5], '#c9a56b'); poly(g, [cx + dx, cy + dy + 5, cx + dx, cy + dy - 6, cx + dx + 3, cy + dy + 5], '#8a6234'); });
      } else if (b.type === 'baril') {
        ell(g, cx, cy + 12, 12, 4, 'rgba(0,0,0,0.25)'); g.fillStyle = '#7a3a24'; g.beginPath(); g.ellipse(cx, cy, 11, 14, 0, 0, TAU); g.fill(); box(g, cx - 11, cy - 6, 22, 3, '#3a3a40'); box(g, cx - 11, cy + 4, 22, 3, '#3a3a40');
        ell(g, cx, cy - 12, 8, 3, '#5a2a18'); line(g, cx, cy - 13, cx + 5, cy - 20, '#d8c8a0', 1.6); if (Math.sin(t * 12 + b.tx) > 0) circ(g, cx + 5, cy - 21, 2.2, '#ffb432'); g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText('💀', cx, cy + 4);
      }
    }
  };
  // le monstre de l'illusion, au-dessus du chef, le temps d'un cri
  Art.ghost = function (g, o, t) {
    const a = Math.min(1, o.t / 0.5) * Math.min(1, (1.6 - o.t) / 0.2), s = 1.6 + (1.6 - o.t) * 0.5;
    g.save(); g.translate(o.x, o.y - 70 - (1.6 - o.t) * 20); g.scale(s, s); g.globalAlpha = Math.max(0, a) * 0.8;
    g.fillStyle = '#3a1c5a'; g.beginPath(); g.moveTo(-26, 24); g.quadraticCurveTo(-34, -30, 0, -36); g.quadraticCurveTo(34, -30, 26, 24);
    for (let i = 0; i < 5; i++) g.lineTo(26 - i * 13 - 6.5, 14 + Math.sin(t * 9 + i) * 3), g.lineTo(26 - (i + 1) * 13, 24); g.closePath(); g.fill();
    poly(g, [-18, -26, -30, -46, -8, -32], '#3a1c5a'); poly(g, [18, -26, 30, -46, 8, -32], '#3a1c5a');
    ell(g, -10, -10, 6, 8, '#ff3a2a'); ell(g, 10, -10, 6, 8, '#ff3a2a'); circ(g, -10, -9, 2.2, '#ffe36b'); circ(g, 10, -9, 2.2, '#ffe36b');
    g.fillStyle = '#12061e'; g.beginPath(); g.ellipse(0, 8, 13, 8 + Math.sin(t * 20) * 2, 0, 0, TAU); g.fill();
    [-8, -3, 2, 7].forEach(x => poly(g, [x, 2, x + 2.5, 8, x + 5, 2], '#fff'));
    g.restore();
  };
})(window.CG);
