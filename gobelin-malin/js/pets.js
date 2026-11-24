// Clan Gobelin — animaux apprivoisés : visite, adoption, combat, niveaux, évolution, dessin.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, Art = CG.Art, P = CG.P = {}, TAU = Math.PI * 2;
  const rand = CG.rand, pick = CG.pick, dist = CG.dist;
  const K = P.KINDS = {
    loup: { nom: 'Louveteau', evo: 'Loup alpha', icon: '🐺', hp: 40, dmg: 5, spd: 78, cd: 0.9, special: 'Bond mordant : il saute sur un ennemi éloigné.', hello: 'Un louveteau maigre s\'approche, la queue basse, et renifle vers ta réserve.' },
    ours: { nom: 'Ourson', evo: 'Grand ours', icon: '🐻', hp: 70, dmg: 6, spd: 52, cd: 1.2, special: 'Coup de patte au sol : étourdit tous les ennemis autour.', hello: 'Un ourson pataud s\'assoit devant toi et se frotte le ventre en gémissant.' },
    felin: { nom: 'Chaton sauvage', evo: 'Panthère d\'ombre', icon: '🐱', hp: 34, dmg: 6, spd: 86, cd: 0.7, special: 'Griffes d\'ombre : surgit derrière l\'ennemi et frappe trois fois.', hello: 'Un petit félin tacheté tourne autour de tes jambes en miaulant, l\'œil sur les provisions.' },
    hibou: { nom: 'Petit hibou', evo: 'Grand-duc lunaire', icon: '🦉', hp: 26, dmg: 5, spd: 66, cd: 1.5, fly: true, range: 220, special: 'Rayon de lune : une explosion qui blesse et ralentit.', hello: 'Un petit hibou se pose sur ton bâton, penche la tête et claque du bec.' },
    faucon: { nom: 'Jeune faucon', evo: 'Faucon-foudre', icon: '🦅', hp: 24, dmg: 4, spd: 108, cd: 0.8, fly: true, special: 'Piqué foudroyant : un éclair qui saute entre trois ennemis.', hello: 'Un jeune faucon décrit des cercles au-dessus de toi, puis se pose et réclame en criant.' }
  };
  const NAMES = ['Croc', 'Mousse', 'Griffe', 'Plume', 'Flocon', 'Ombre', 'Truffe', 'Éclair', 'Noisette', 'Tonnerre', 'Pépite', 'Brume', 'Caillou', 'Ronron', 'Tempête', 'Biscuit'];
  P.EVO_LVL = 5; P.MAX = 8; P.ADOPT = 6;
  P.maxHp = p => Math.round(K[p.kind].hp * 1.3 * (1 + 0.12 * (p.lvl - 1)) * (p.evo ? 1.8 : 1));
  P.dmg = p => (p.buffT > 0 && p.buff === 'atk' ? 1.4 : 1) * K[p.kind].dmg * (1 + 0.12 * (p.lvl - 1)) * (p.evo ? 1.5 : 1) * (1 + CG.S.day * 0.03);
  P.eats = p => { const k = K[p.kind] || {}; return (k.faim || 2) + (p.evo ? (k.faim ? 2 : 1) : 0); }; // orcs, trolls, ettins : forts, mais ils mangent beaucoup
  P.title = p => p.evo ? K[p.kind].evo : K[p.kind].nom;
  P.food = () => CG.S.pets.reduce((a, p) => a + P.eats(p), 0);

  // ---------- visite d'un animal affamé ----------
  P.startVisit = function () {
    const S = CG.S, R = CG.R; if (S.pets.length >= P.MAX) return;
    const kind = pick(Object.keys(K).filter(k => !K[k].monstre)), en = pick(['ouest', 'est', 'sud']), e = W.EXITS[en], f = G.firePos(), ex = W.center(e.x, e.y);
    const v = { id: S.nextId++, role: 'animal', look: 'animal', kind, x: ex.x, y: ex.y, face: 1, step: 0, moving: false, state: 'arrive', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 3.5), dest: { x: f.x + 70, y: f.y + 84 } };
    G.goTo(v, v.dest.x, v.dest.y); R.visitors.push(v);
    // pas d'annonce : on le découvre en le croisant près du feu
  };
  P.talk = function (v) {
    const S = CG.S, R = CG.R, k = K[v.kind], can = S.res.food >= P.ADOPT;
    CG.UI.dialog({ visitor: v, who: k.nom, tag: 'animal sauvage, affamé', text: k.hello, options: [
      { label: '🍖 Lui donner à manger (' + P.ADOPT + ' 🍖)', sub: can ? 'Il restera pour protéger le village (il mangera ' + 2 + ' 🍖 par jour)' : 'Tu n\'as pas assez de nourriture', disabled: !can, fn: () => {
        if (S.res.food < P.ADOPT || !R.visitors.includes(v)) return; S.res.food -= P.ADOPT; R.visitors.splice(R.visitors.indexOf(v), 1);
        const used = S.pets.map(p => p.name), p = { id: S.nextId++, kind: v.kind, name: K[v.kind] ? K[v.kind].nom : 'Animal', lvl: 1, xp: 0, evo: 0, x: v.x, y: v.y, pet: true };
        p.hp = P.maxHp(p); P.reset(p); S.pets.push(p); S.morale = Math.min(100, S.morale + 3);
        for (let i = 0; i < 6; i++) G.text(p.x + rand(-24, 24), p.y - rand(20, 60), '❤️', '#fff'); CG.sfx('heal');
        G.banner(p.name + ' rejoint le clan !', k.icon + ' ' + k.nom + ' · il défendra le village et grandira en se battant.', '#c8ffb0');
      } },
      { label: '👋 Le chasser gentiment', sub: 'Il repart dans la forêt', fn: () => { if (R.visitors.includes(v)) { v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); } } }] });
  };
  P.reset = function (p) { p.face = p.face || 1; p.step = 0; p.moving = false; p.atkCd = 0; p.atkAnim = 0; p.cdS = 3; p.path = null; p.repath = 0; p.timer = 0; p.target = null; p.eat = null; p.pet = true; p.seed = p.seed || Math.random() * 100; };
  P.talkPet = function (p) {
    const k = K[p.kind], S = CG.S;
    CG.UI.dialog({ visitor: { role: 'animal', look: 'animal', kind: p.kind, evo: p.evo }, who: p.name, tag: P.title(p) + (p.nomme ? ' · 🏷️ nommé' : '') + ' · niv. ' + p.lvl + ' · ❤ ' + Math.ceil(p.hp) + '/' + P.maxHp(p),
      text: p.evo ? p.name + ' te regarde fièrement. Attaque spéciale — ' + k.special : p.name + pick([' se frotte contre toi.', ' te renifle les poches, au cas où.', ' te regarde avec de grands yeux.', ' tourne autour de toi, tout content.']) + (p.buffT > 0 ? ' ' + P.BUFFS[p.buff].txt : ''),
      options: [{ label: '🤚 Le caresser', fn: () => { G.text(p.x, p.y - 44, '❤️', '#fff', true); CG.sfx('ok'); if (p.caresse !== S.day) { p.caresse = S.day; const n = P.CARESSE[0] + P.CARESSE[1] * p.lvl; G.text(p.x, p.y - 62, '+' + n + ' XP', '#c8ffb0'); G.puff(p.x, p.y - 16, '#ffb3d1', 8, 70, 3); P.xp(p, n); } } }] /* la première caresse du jour lui donne de l'expérience */.concat(G.count('mangeoire') ? [{ label: '🥣 L\'amener manger à la mangeoire', sub: S.res.food < 1 ? 'Il n\'y a plus de nourriture' : 'Coûte 1 🍖 · il en ressort avec un bonus au hasard (force, défense ou vitesse)', disabled: S.res.food < 1 || !!p.eat, fn: () => { const b = P.trough(p); if (b) { p.eat = { b, go: 25 }; p.path = null; G.text(p.x, p.y - 44, '🥣 ?', '#fff', true); } } }] : [], CG.Dressage ? CG.Dressage.options(p) : [], G.nameOpt(p), [ { label: '🌲 Le rendre à la forêt', sub: 'Il quitte le clan pour de bon', fn: () => { CG.UI.dialog({ visitor: { role: 'animal', look: 'animal', kind: p.kind, evo: p.evo }, who: p.name, tag: 'tu es sûr ?', text: 'Tu veux vraiment rendre ' + p.name + ' à la forêt ? Il quittera le clan pour de bon, et tu ne le reverras plus.', options: [{ label: '❤️ Non, il reste avec nous', sub: p.name + ' ne va nulle part' }, { label: '🌲 Oui, je le rends à la forêt', sub: 'Il part pour de bon', fn: () => { const i = S.pets.indexOf(p); if (i >= 0) { S.pets.splice(i, 1); G.puff(p.x, p.y - 14, '#c8ffb0', 14, 90, 4); CG.UI.toast(p.name + ' repart vivre dans la forêt.'); } } }] }); } }, { label: 'À plus tard' }]) });
  };

  // ---------- expérience et évolution ----------
  P.NIV_MAX = Infinity; // pas de plafond, comme le chef : chaque niveau demande juste plus d'expérience
  P.need = p => Math.round(40 * Math.pow(p.lvl, 1.3)); // l'XP qu'il faut pour le niveau suivant : 40, 121, 232, 368... (avant : 12 par niveau, ça montait bien trop vite)
  P.CARESSE = [12, 3]; P.REPAS = [5, 1]; /* l'expérience d'une caresse (une fois par jour) et d'un repas à la mangeoire : tant, plus tant par niveau */
  P.xp = function (p, n) {
    if (p.lvl >= P.NIV_MAX || p.evoT > 0) return; p.xp += n; const need = P.need(p);
    if (p.xp < need) return;
    p.xp -= need; p.lvl++; if (CG.R.dayStats) (CG.R.dayStats.petUps = CG.R.dayStats.petUps || []).push(p.name + ' (niv. ' + p.lvl + ')'); G.text(p.x, p.y - 50, p.name + ' niv. ' + p.lvl + ' !', '#c8ffb0'); CG.sfx('ok');
    if (p.kind === 'ame' && p.lvl >= CG.seuilEvo(p) && !p.evo && !p.evoDemain) { p.evoDemain = true; CG.sfx('spell'); G.banner('Quelque chose couve chez ' + p.name + '...', 'On verra bien demain matin, au réveil.', '#ffe36b'); } // la transformation se fera pendant la nuit (compagnons.js)
  };
  function evolve(p) {
    const R = CG.R; p.evo = 1; p.evoT = 0; p.hp = P.maxHp(p); p.cdS = 1; p.flash = 0.6;
    R.rings.push({ x: p.x, y: p.y - 10, r: 190, life: 0.5, col: '#ffffff' }, { x: p.x, y: p.y - 10, r: 110, life: 0.5, col: '#ffe36b' });
    G.puff(p.x, p.y - 20, '#ffffff', 40, 260, 5); G.puff(p.x, p.y - 20, '#ffe36b', 30, 180, 4); CG.sfx('level'); CG.sfx('fire');
    G.text(p.x, p.y - 80, '✨ ' + K[p.kind].evo + ' ✨', '#ffe36b', true);
    G.banner(p.name + ' se transforme en ' + K[p.kind].evo + ' !', 'Plus gros, plus résistant. ' + K[p.kind].special, '#ffe36b');
  }
  P.hurt = function (p, dmg) {
    if (p.ko || p.evoT > 0) return; dmg *= (p.evo ? 0.75 : 1) * (p.buffT > 0 && p.buff === 'def' ? 0.55 : 1); p.hp -= dmg; G.text(p.x, p.y - 40, '-' + Math.round(dmg), '#ffb0a0'); G.puff(p.x, p.y - 14, '#ddd', 3);
    if (p.hp <= 0) { p.hp = 0; p.ko = true; p.target = null; G.text(p.x, p.y - 54, p.name + ' est mort', '#ffb0a0', true); G.puff(p.x, p.y - 14, '#ddd', 14, 90, 4); CG.sfx('die'); }
  };

  // ---------- comportement ----------
  function hit(p, e, mul) { p.atkAnim = 1; const crit = p.kind === 'felin' && Math.random() < 0.25; G.hurtEnemy(e, P.dmg(p) * (mul || 1) * (crit ? 2 : 1), p); P.xp(p, 2); }
  function special(p, e, d) {
    if (K[p.kind].sp) return K[p.kind].sp(p, e, d); // monstres alliés : leur propre coup spécial
    const R = CG.R, dm = P.dmg(p);
    if (p.kind === 'loup') { if (d < 60 || d > 240) return false; for (let i = 0; i < 6; i++) R.parts.push({ x: CG.lerp(p.x, e.x, i / 6), y: CG.lerp(p.y, e.y, i / 6) - 12, vx: 0, vy: 0, life: 0.4, max: 0.4, col: '#c8e8ff', size: 6, float: true }); p.x = e.x - p.face * 20; p.y = e.y + 4; hit(p, e, 2.5); e.slow = Math.max(e.slow, 2); p.cdS = 6; }
    else if (p.kind === 'ours') { if (d > 60) return false; R.rings.push({ x: p.x, y: p.y - 4, r: 100, life: 0.5, col: '#c9a56b' }); G.puff(p.x, p.y - 4, '#c9a56b', 20, 190, 5); CG.sfx('fire'); for (const o of R.enemies) if (!o.dead && dist(o, p) < 100 + o.r) { o.rooted = Math.max(o.rooted, 1.6); G.hurtEnemy(o, dm * 1.5, p); } p.atkAnim = 1; p.cdS = 8; }
    else if (p.kind === 'felin') { if (d > 200) return false; G.puff(p.x, p.y - 12, '#6a3fa8', 10, 90, 4); p.x = e.x - (e.face || 1) * 22; p.y = e.y + 2; G.puff(p.x, p.y - 12, '#6a3fa8', 10, 90, 4); for (let i = 0; i < 3 && !e.dead; i++) hit(p, e, 0.8); p.cdS = 5; }
    else if (p.kind === 'hibou') { if (d > 260) return false; R.rings.push({ x: e.x, y: e.y - 10, r: 90, life: 0.5, col: '#c8d8ff' }); G.puff(e.x, e.y - 14, '#e8f0ff', 18, 150, 4); CG.sfx('spell'); for (const o of R.enemies) if (!o.dead && dist(o, e) < 90 + o.r) { o.slow = Math.max(o.slow, 4); G.hurtEnemy(o, dm * 2, p); } p.atkAnim = 1; p.cdS = 7; }
    else { if (d > 240) return false; let cur = e, from = { x: p.x, y: p.y - 40 }; const done = new Set(); CG.sfx('zap'); for (let i = 0; i < 3 && cur; i++) { done.add(cur); R.bolts.push({ x1: from.x, y1: from.y, x2: cur.x, y2: cur.y - 16, life: 0.25 }); G.hurtEnemy(cur, dm * 1.6, p); from = { x: cur.x, y: cur.y - 16 }; let nb = null, nd = 170; for (const o of R.enemies) { if (o.dead || done.has(o)) continue; const dd = dist(o, cur); if (dd < nd) { nd = dd; nb = o; } } cur = nb; } p.atkAnim = 1; p.cdS = 6; }
    P.xp(p, 2); return true;
  }
  function move(p, tx, ty, spd, dt) {
    if (K[p.kind].fly) { const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, st = Math.min(d, spd * dt); p.x += dx / d * st; p.y += dy / d * st; p.moving = d > 3; p.step += dt * 3; if (Math.abs(dx) > 3) p.face = dx > 0 ? 1 : -1; }
    else G.chase(p, tx, ty, spd, dt);
  }
  // ---------- la mangeoire : quelques secondes à manger, puis un bonus au hasard ----------
  P.BUFFS = { atk: { icon: '💪', nom: 'Force', txt: 'Il est gonflé à bloc : il frappe plus fort.' }, def: { icon: '🛡️', nom: 'Peau dure', txt: 'Il a le poil hérissé : il encaisse mieux les coups.' }, vit: { icon: '💨', nom: 'Vitesse', txt: 'Il déborde d\'énergie : il court plus vite.' } };
  P.trough = function (p) { let best = null, bd = 1e9; for (const b of CG.S.buildings) { if (b.type !== 'mangeoire' || b.site) continue; const d = Math.hypot((b.tx + 0.5) * T - p.x, (b.ty + 1) * T - p.y); if (d < bd) { bd = d; best = b; } } return best; };
  function feedStep(p, dt, spd) {
    const S = CG.S, R = CG.R;
    if (!p.eat) { // de temps en temps, il y va de lui-même
      p.feedT = (p.feedT === undefined ? rand(30, 90) : p.feedT) - dt;
      if (p.feedT <= 0) { p.feedT = rand(70, 150); if (!(p.buffT > 0) && S.res.food >= 1 && Math.random() < 0.6) { const b = P.trough(p); if (b) { p.eat = { b, go: 25 }; p.path = null; } } }
      return false;
    }
    const b = p.eat.b; if (b.gone || b.site) { p.eat = null; return false; }
    const x = (b.tx + 0.5) * T + (p.id % 2 ? 16 : -16), y = (b.ty + 1) * T + 12;
    if (p.eat.t === undefined) {
      if (Math.hypot(x - p.x, y - p.y) > 20) { move(p, x, y, spd, dt); p.eat.go -= dt; if (p.eat.go <= 0) p.eat = null; return true; }
      if (S.res.food < 1) { G.text(p.x, p.y - 44, 'La mangeoire est vide...', '#ffb0a0'); p.eat = null; return false; }
      S.res.food -= 1; p.eat.t = 4; G.text(p.x, p.y - 44, '-1 🍖', '#ffd0a0');
    }
    p.eat.t -= dt; p.moving = false; p.face = (b.tx + 0.5) * T > p.x ? 1 : -1; p.atkAnim = Math.max(p.atkAnim, Math.abs(Math.sin(R.t * 9)) * 0.5); // il plonge le museau
    if (Math.random() < dt * 7) R.parts.push({ x: (b.tx + 0.5) * T + rand(-8, 8), y: (b.ty + 1) * T - 10, vx: rand(-30, 30), vy: rand(-50, -20), life: 0.45, max: 0.45, col: Math.random() < 0.5 ? '#c8703a' : '#e8c88a', size: 2.5 });
    if (Math.random() < dt * 2.2 && CG.onScreen(p.x, p.y)) CG.sfx('chop');
    if (p.eat.t <= 0) {
      p.eat = null; P.xp(p, P.REPAS[0] + P.REPAS[1] * p.lvl); /* un bon repas : un peu d'expérience */ p.buff = pick(Object.keys(P.BUFFS)); p.buffT = 90; p.hp = Math.min(P.maxHp(p), p.hp + 15); p.feedT = rand(100, 170); const f = P.BUFFS[p.buff];
      G.text(p.x, p.y - 56, f.icon + ' ' + f.nom + ' !', '#c8ffb0', true); G.puff(p.x, p.y - 16, '#c8ffb0', 14, 90, 4); R.rings.push({ x: p.x, y: p.y - 8, r: 50, life: 0.4, col: '#c8ffb0' }); CG.sfx('heal');
    }
    return true;
  }
  P.update = function (dt) {
    const S = CG.S, R = CG.R, fire = G.firePos();
    for (const p of S.pets) {
      if (!p.nomme && K[p.kind]) { const n = P.title(p); if (p.name !== n) p.name = n; } /* tant que le chef ne lui a pas donné de nom, un animal s'appelle simplement « Loup », « Ours »... */
      if (!p.ko && !(p.hp > 0) && !(p.evoT > 0)) { p.hp = 0; p.ko = true; p.target = null; p.path = null; p.moving = false; } // à 0 de vie, il est mort : son corps reste par terre (cet état n'était pas sauvegardé : après un rechargement ou un changement de monde, l'animal se relevait avec 0 de vie)
      if (p.ko || p.ridden) continue; // en selle : c'est le chef qui le mène (monture.js)
      p.atkCd -= dt; p.cdS -= dt; if (p.atkAnim > 0) p.atkAnim -= dt * 4; if (p.flash > 0) p.flash -= dt; p.moving = false;
      if (p.evoT > 0) { // la transformation : des étincelles convergent, puis l'éclair
        p.evoT -= dt; const a = Math.random() * TAU, rr = 90 * (p.evoT / p.evoMax) + 20;
        if (Math.random() < dt * 40) R.parts.push({ x: p.x + Math.cos(a) * rr, y: p.y - 18 + Math.sin(a) * rr * 0.7, vx: -Math.cos(a) * 110, vy: -Math.sin(a) * 80, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#ffffff' : '#ffe36b', size: 4, float: true });
        if (p.evoT <= 0) evolve(p); continue;
      }
      if (p.buffT > 0) p.buffT -= dt;
      const k = K[p.kind], spd = k.spd * (p.evo ? 1.1 : 1) * (p.buffT > 0 && p.buff === 'vit' ? 1.4 : 1), mh = P.maxHp(p);
      let tg = null, bd = 1e9;
      for (const e of R.enemies) { if (e.dead || e.calm || e.retreat) continue; const d = dist(p, e); if ((e.event ? dist(e, fire) < 760 : d < 150) || d < 260) { if (d < bd) { bd = d; tg = e; } } }
      if (tg) {
        p.eat = null; p.face = tg.x > p.x ? 1 : -1;
        if (p.evo && p.cdS <= 0 && special(p, tg, bd)) continue;
        if (k.range) { if (bd > k.range) move(p, tg.x, tg.y, spd, dt); else if (p.atkCd <= 0) { p.atkCd = k.cd; p.atkAnim = 1; G.shoot({ x: p.x, y: p.y - 26 }, tg, 'bolt', P.dmg(p), 'g', p); P.xp(p, 2); } }
        else if (bd > 24 + tg.r) move(p, tg.x, tg.y + 2, spd * (k.fly ? 1.2 : 1), dt);
        else if (p.atkCd <= 0) { p.atkCd = k.cd; hit(p, tg); }
        continue;
      }
      // plus de vie qui remonte toute seule : c'est le guérisseur qui soigne les animaux
      // au calme : il rôde près du feu, et se couche le soir
      if (p.follow && G.tech('b24') && !(R.ko > 0)) { p.sleep = false; const pl = S.player, d = dist(p, pl); if (d > 600) { p.x = pl.x - 30; p.y = pl.y + 10; p.path = null; } else if (d > 62) move(p, pl.x - (p.id % 2 ? 34 : -34), pl.y + 14, spd * (d > 200 ? 1.5 : 1.1), dt); else p.face = pl.x > p.x ? 1 : -1; continue; }
      const night = S.hour >= 19.5 || S.hour < 6; p.sleep = night && dist(p, fire) < 170 && !k.fly;
      if (p.sleep) continue;
      if (feedStep(p, dt, spd)) continue;
      p.timer -= dt;
      if (p.timer <= 0) { const a = Math.random() * TAU, r = night ? rand(90, 150) : rand(80, 300); p.wx = fire.x + Math.cos(a) * r; p.wy = fire.y + Math.sin(a) * r * 0.8; p.timer = rand(3, 8); p.path = null; if (!k.fly && !W.walkPx(p.wx, p.wy)) p.timer = 0.3; }
      if (p.wx !== undefined && Math.hypot(p.wx - p.x, p.wy - p.y) > 14) move(p, p.wx, p.wy, spd * 0.55, dt);
    }
  };
  // le matin : tout le monde se relève ; ceux qui n'ont pas mangé peuvent repartir
  P.morning = function (lines, fed) {
    const S = CG.S, f = G.firePos();
    if (!fed) for (const p of S.pets.slice()) if (Math.random() < 0.3) { S.pets.splice(S.pets.indexOf(p), 1); lines.push(K[p.kind].icon + ' ' + p.name + ' n\'a rien eu à manger : il est reparti dans la forêt.'); }
    // un compagnon tombé au combat est mort : son corps reste par terre jusqu'au matin (le temps d'une Résurrection), puis il n'est plus là
    for (const p of S.pets.slice()) if (p.ko) { S.pets.splice(S.pets.indexOf(p), 1); if (CG.R && CG.R.mount === p) CG.R.mount = null; if (lines) lines.push('💀 ' + p.name + ' est mort au combat.'); }
    S.pets.forEach((p, i) => { p.ko = false; p.evoT = 0; p.hp = P.maxHp(p); P.reset(p); p.x = f.x + Math.cos(i * 1.3) * 110; p.y = f.y + 70 + Math.sin(i * 1.3) * 30; });
  };
  // ---------- l'onglet Animaux du village : une grande fiche par compagnon, avec son portrait vivant ----------
  const TEINTE = { loup: '120,170,230', ours: '214,150,84', felin: '190,120,255', hibou: '150,160,255', faucon: '110,200,255', gelee: '130,230,130', orc: '255,150,80', orcChaman: '120,220,200', troll: '160,180,205', ettin: '230,180,90' };
  P.panel = function () {
    const S = CG.S, R = CG.R, esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    if (!S.pets.length) return '<div class="an-vide"><div class="an-pattes">🐾</div><b>Aucun compagnon pour l\'instant</b><p>De temps en temps, une bête affamée vient rôder près du feu. Donne-lui à manger : elle restera pour défendre le village.</p></div><p class="note">0 / ' + P.MAX + ' compagnons.</p>';
    let h = '<div class="scroll"><div class="an-grid">';
    S.pets.forEach(p => {
      const k = K[p.kind], mh = P.maxHp(p), hp = Math.max(0, Math.min(mh, Math.ceil(p.hp))), need = P.need(p), col = TEINTE[p.kind] || '200,200,200';
      const etat = p.ko ? ['💀', 'Mort'] : R.mount === p ? ['🏇', 'Tu le montes'] : p.follow && G.tech('b24') ? ['🐾', CG.Dressage ? CG.Dressage.etat(p) : 'Te suit partout'] : (CG.S.pets.includes(p) && p.ecole ? ['🎓', 'En route vers l\'école'] : ['🏕️', 'Garde le village']);
      h += '<div class="an-card' + (p.evo ? ' evo' : '') + (p.ko ? ' ko' : '') + '" style="--c:' + col + '"><div class="an-scene"><canvas data-pet="' + p.id + '" width="300" height="260"></canvas>' + (p.evo ? '<span class="an-etoile">✨</span>' : '') + '<div class="an-lvl">Niv.<b>' + p.lvl + '</b></div></div>'
        + '<div class="an-info"><div class="an-ruban">' + k.icon + ' ' + esc(P.title(p)) + (p.nomme ? ' · 🏷️' : '') + '</div><h3>' + esc(p.name) + '</h3>'
        + '<div class="vl-bar' + (hp < mh * 0.35 ? ' low' : '') + '" title="Vie"><span>❤️</span><div><i style="width:' + 100 * hp / mh + '%"></i><u>' + hp + '/' + mh + '</u></div></div>'
        + '<div class="vl-bar xp" title="Expérience"><span>⭐</span><div><i style="width:' + Math.min(100, 100 * p.xp / need) + '%"></i><u>' + Math.floor(p.xp + 1e-6) + '/' + need + '</u></div></div>'
        + '<div class="an-chips"><span>' + etat[0] + ' ' + etat[1] + '</span><span>🍖 ' + P.eats(p) + ' par jour</span>' + (p.buffT > 0 ? '<span class="bon">' + P.BUFFS[p.buff].icon + ' ' + P.BUFFS[p.buff].nom + '</span>' : '') + '</div>'
        + (p.evo ? '<p class="an-sp"><b>Attaque spéciale</b> ' + esc(k.special) + '</p>' : '') + '</div></div>';
    });
    return h + '</div></div><p class="note">Les compagnons gagnent de l\'expérience en se battant. S\'ils tombent au combat, ils meurent. ' + S.pets.length + ' / ' + P.MAX + ' compagnons.</p>';
  };
  // les portraits bougent tant que la fenêtre est ouverte
  P.panelLive = function (root) {
    const cs = [...root.querySelectorAll('canvas[data-pet]')]; if (!cs.length) return; const t0 = performance.now();
    const draw = () => {
      if (!document.body.contains(cs[0])) return; const t = (performance.now() - t0) / 1000;
      for (const c of cs) {
        const p = CG.S.pets.find(o => o.id === +c.dataset.pet); if (!p) continue; const g = c.getContext('2d'), k = K[p.kind], z = (k.monstre ? 5 * (k.pz || 1) : p.evo ? 3.0 : 4.4) * (k.fly ? 0.85 : 1);
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 300, 260);
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(150, 216, 104, 22, 0, 0, TAU); g.fill();
        g.translate(150, k.fly ? 236 : 214); g.scale(z, z);
        Art.pet(g, Object.assign({}, p, { x: 0, y: 0, face: 1, moving: false, step: 0, atkAnim: 0, flash: 0, evoT: 0, ko: p.ko }), t);
      }
      requestAnimationFrame(draw);
    };
    draw();
  };

  // ---------- dessin ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, f) => ell(g, x, y, r, r, f);
  const line = (g, a, b, c, d, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const LOOK = {
    loup: [{ s: 0.82, col: '#8a8e98', dark: '#62666f', belly: '#c8ccd4', ear: 'point', tail: 'bushy', eye: '#ffe36b' }, { s: 1.3, col: '#cdd6e6', dark: '#7c88a0', belly: '#f2f6ff', ear: 'point', tail: 'bushy', eye: '#7dffea', mane: '#eef4ff', alpha: true, glow: 'rgba(125,255,234,0.18)' }],
    ours: [{ s: 0.86, col: '#9a6a3c', dark: '#6e4826', belly: '#c89a66', ear: 'round', tail: 'none', eye: '#221', fat: 1.25 }, { s: 1.6, col: '#5e3c22', dark: '#3c2412', belly: '#8a5e3a', ear: 'round', tail: 'none', eye: '#ffb432', fat: 1.3, moon: '#ffe9a8', claws: true }],
    felin: [{ s: 0.78, col: '#dcae58', dark: '#a8782c', belly: '#f4e0b0', ear: 'point', tail: 'long', eye: '#3a8a3a', spots: '#7a5220' }, { s: 1.25, col: '#3a2c50', dark: '#221832', belly: '#5a4878', ear: 'point', tail: 'long', eye: '#ffd84a', stripes: '#c070ff', spots: null, ombre: true, glow: 'rgba(192,112,255,0.2)' }]
  };
  function quad(g, o, L, t) {
    const sw = o.moving ? Math.sin(o.step * TAU) : 0, bob = o.moving ? Math.abs(sw) * 1.4 : Math.sin(t * 2.4) * 0.5, lunge = o.atkAnim > 0 ? Math.sin(o.atkAnim * Math.PI) * 6 : 0, fat = L.fat || 1;
    if (L.glow) ell(g, 0, -12, 26, 18, L.glow);
    if (o.sleep) { ell(g, 0, 0, 15, 5, 'rgba(0,0,0,0.2)'); ell(g, 0, -6, 14, 7 * fat, L.col); circ(g, 9, -5, 6, L.col); ell(g, -9, -3, 8, 3, L.dark); g.font = '11px sans-serif'; g.fillStyle = '#fff'; g.fillText('z', 12 + Math.sin(t * 2) * 2, -16 - ((t * 6) % 10)); return; }
    ell(g, 0, 1, 15, 5, 'rgba(0,0,0,0.22)'); g.translate(lunge, 0);
    [-9, -4, 5, 10].forEach((lx, i) => { line(g, lx, -8, lx + (i % 2 ? sw : -sw) * 4, 0, L.dark, 3.6); if (L.claws) { g.fillStyle = '#fff'; g.fillRect(lx + (i % 2 ? sw : -sw) * 4 - 2, -1, 4, 2); } });
    if (L.tail === 'bushy') { line(g, -13, -13 - bob, -21, -19 - bob + sw * 2, L.col, 5); circ(g, -22, -20 - bob + sw * 2, 3, L.belly); }
    else if (L.tail === 'long') { g.strokeStyle = L.col; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-13, -12 - bob); g.quadraticCurveTo(-24, -10 - bob, -22 + Math.sin(t * 3) * 3, -24 - bob); g.stroke(); }
    ell(g, 0, -12 - bob, 14, 7.5 * fat, L.col); ell(g, 1, -9 - bob, 10, 4 * fat, L.belly);
    if (L.spots) [[-6, -14], [0, -16], [5, -13], [-2, -11]].forEach(([x, y]) => circ(g, x, y - bob, 1.7, L.spots));
    if (L.stripes) [-7, -1, 5].forEach(x => line(g, x, -18 - bob, x + 2, -10 - bob, L.stripes, 1.8));
    if (L.mane) for (let i = 0; i < 5; i++) poly(g, [-8 + i * 4, -18 - bob, -6 + i * 4, -26 - bob - (i % 2) * 2, -3 + i * 4, -18 - bob], L.mane);
    if (L.moon) { g.strokeStyle = L.moon; g.lineWidth = 2.2; g.beginPath(); g.arc(4, -10 - bob, 5, 0.3, Math.PI - 0.3); g.stroke(); }
    const hx = 13, hy = -16 - bob; circ(g, hx, hy, 6.5 * (L.fat ? 1.08 : 1), L.col); ell(g, hx + 5.5, hy + 1.6, 4, 2.8, L.belly); circ(g, hx + 8.6, hy + 0.8, 1.3, '#221');
    if (L.ear === 'point') { poly(g, [hx - 4, hy - 4, hx - 4, hy - 12, hx + 0.5, hy - 5.5], L.dark); poly(g, [hx + 1, hy - 5.5, hx + 2.5, hy - 12, hx + 5, hy - 4], L.col); } else { circ(g, hx - 3, hy - 6, 2.8, L.dark); circ(g, hx + 3, hy - 6.5, 2.8, L.col); }
    circ(g, hx + 2.6, hy - 1.4, 1.5, L.eye); if (L.glow) circ(g, hx + 2.6, hy - 1.4, 3, L.glow);
    poly(g, [7, -15 - bob, 11, -11 - bob, 5, -9 - bob, 2, -13 - bob], '#d8402a'); // foulard du clan
  }
  // ---------- le loup et le félin : chacun son dessin (silhouette, pattes articulées, tête détaillée) ----------
  function patte(g, x, y, ph, mv, col, w, back, paw) {
    const s = mv ? Math.sin(ph) : 0, lift = mv ? Math.max(0, Math.cos(ph)) * 2.6 : 0, fx = x + s * 4.6 + (back ? -0.6 : 0.6), fy = -lift, kx = x + s * 1.7 + (back ? -2.4 : 1.1), ky = (y + fy) / 2 + (back ? 0.8 : 0);
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(kx, ky); g.stroke();
    g.lineWidth = w * 0.7; g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy - 1.2); g.stroke(); ell(g, fx + 1, fy - 1, w * 0.62, 1.5, paw || col);
  }
  const foulard = (g, x, y) => { g.strokeStyle = '#d8402a'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 2.4, y - 4.5); g.quadraticCurveTo(x + 1.5, y, x + 0.5, y + 4.5); g.stroke(); poly(g, [x - 0.5, y + 3.5, x - 5, y + 7.5, x - 0.5, y + 7], '#b02c1c'); };
  function zzz(g, t) { g.font = 'bold 11px sans-serif'; g.fillStyle = '#fff'; g.fillText('z', 12 + Math.sin(t * 2) * 2, -16 - ((t * 6) % 10)); }
  function loup(g, o, L, t) {
    const mv = o.moving, ph = o.step * TAU, sw = mv ? Math.sin(ph) : 0, bob = mv ? Math.abs(sw) * 1.3 : Math.sin(t * 2.2) * 0.5, lunge = o.atkAnim > 0 ? Math.sin(o.atkAnim * Math.PI) : 0, A = !!L.alpha;
    if (L.glow) ell(g, 0, -13, 29, 18, L.glow);
    if (o.sleep) { // roulé en boule, le museau sur la queue
      ell(g, 0, 0, 16, 5, 'rgba(0,0,0,0.2)'); const br = Math.sin(t * 1.6) * 0.5; ell(g, -1, -7 - br * 0.5, 14, 7.5 + br, L.col); ell(g, -3, -10 - br, 9, 3.5, L.dark);
      g.strokeStyle = L.col; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-13, -5); g.quadraticCurveTo(-8, 3, 6, -1); g.stroke(); circ(g, 7, -1.5, 2.4, L.belly);
      circ(g, 10, -6, 5.6, L.col); poly(g, [7, -9, 6, -15, 10.5, -10.5], L.dark); poly(g, [11, -10.5, 13.5, -15.5, 15, -9], L.col); ell(g, 14.5, -3.6, 4, 2.4, L.belly); circ(g, 17.6, -4, 1.2, '#1c1a20');
      g.strokeStyle = '#2a2630'; g.lineWidth = 1; g.beginPath(); g.arc(11.5, -6.4, 1.8, 0.2, Math.PI - 0.2); g.stroke(); zzz(g, t); return;
    }
    ell(g, 0, 1, 17, 4.6, 'rgba(0,0,0,0.22)'); g.translate(lunge * 7, 0);
    const by = (A ? -14 : -11.5) - bob, lw = A ? 3.6 : 3.3;
    patte(g, -9, by + 2, ph + Math.PI, mv, L.dark, lw, true); patte(g, 8.5, by + 3, ph, mv, L.dark, lw, false);
    // la queue : touffue, plus claire au bout ; elle remue quand il attend
    const wag = mv ? sw * 2 : Math.sin(t * 3.2) * 1.8, tu = A ? 1.25 : 1;
    g.fillStyle = L.col; g.beginPath(); g.moveTo(-12, by - 4); g.quadraticCurveTo(-21 * tu, by - 9 + wag, -27 * tu, by - 1 + wag); g.quadraticCurveTo(-24 * tu, by + 6 + wag, -18, by + 3); g.quadraticCurveTo(-14, by + 2, -11, by + 2); g.closePath(); g.fill();
    g.fillStyle = L.belly; g.beginPath(); g.moveTo(-27 * tu, by - 1 + wag); g.quadraticCurveTo(-24 * tu, by + 6 + wag, -19.5, by + 3.4); g.quadraticCurveTo(-22 * tu, by + 1 + wag, -27 * tu, by - 1 + wag); g.fill();
    // le corps : poitrail profond, ventre rentré
    ell(g, -9.5, by + 0.5, 5.6, 6, L.col);
    g.fillStyle = L.col; g.beginPath(); g.moveTo(-14.5, by - 1); g.quadraticCurveTo(-13, by - 8, -4, by - 7.2); g.quadraticCurveTo(6, by - 9.8, 12.5, by - 7); g.quadraticCurveTo(16, by, 11.5, by + 6.5); g.quadraticCurveTo(3, by + 7.6, -3, by + 4); g.quadraticCurveTo(-10, by + 6, -14.5, by - 1); g.fill();
    g.fillStyle = L.dark; g.beginPath(); g.moveTo(-13.5, by - 3.5); g.quadraticCurveTo(-5, by - 9.4, 12, by - 7.6); g.quadraticCurveTo(3, by - 4.2, -13.5, by - 3.5); g.fill(); // le dos, plus sombre
    g.fillStyle = L.belly; g.beginPath(); g.moveTo(-6, by + 4.4); g.quadraticCurveTo(3, by + 7.8, 11.5, by + 6.4); g.quadraticCurveTo(4, by + 3.6, -6, by + 4.4); g.fill();
    patte(g, -8, by + 3, ph, mv, L.col, lw + 0.3, true, L.belly); patte(g, 10, by + 4, ph + Math.PI, mv, L.col, lw + 0.3, false, L.belly);
    // l'encolure et sa collerette de poils clairs
    const hx = A ? 16 : 14.5, hy = by - (A ? 9.5 : 7.5) - lunge * 1.5, hr = A ? 6 : 6.4;
    poly(g, [8, by - 8, hx - 2, hy - 4.5, hx + 2, hy + 4, 12, by + 4], L.col);
    poly(g, [10.5, by - 1, 14.6, by + 1, 12.2, by + 2.6, 14.4, by + 5, 11.4, by + 5.4, 12, by + 8, 8.6, by + 5.6], L.belly);
    if (L.mane) for (let i = 0; i < 6; i++) { const mx = -3 + i * 3.3, my = by - 8.4 - i * 0.55; poly(g, [mx - 1.6, my + 1.5, mx - 2.6 - (i % 2), my - 6.5 - (i % 2) * 2, mx + 2, my + 0.6], L.mane); }
    foulard(g, 12.4, by - 3);
    // la tête
    poly(g, [hx - 4.4, hy - 3, hx - 6.4, hy - 12.5, hx - 0.4, hy - 5.4], L.dark); // l'oreille du fond
    circ(g, hx, hy, hr, L.col);
    poly(g, [hx - 4.5, hy + 1.5, hx - 8, hy + 5.5, hx - 4, hy + 4.6, hx - 4.6, hy + 8, hx - 0.5, hy + 5], L.belly); // les poils de la joue
    const ml = A ? 10.5 : 7.6, gueule = lunge * 2.6;
    g.fillStyle = L.belly; g.beginPath(); g.moveTo(hx + 1, hy + 2.2); g.lineTo(hx + ml - 1.2, hy + 2.6 + gueule); g.quadraticCurveTo(hx + ml - 2, hy + 5 + gueule, hx + 1, hy + 5.4); g.closePath(); g.fill(); // la mâchoire
    if (gueule > 0.6) { poly(g, [hx + 3, hy + 2.6, hx + ml - 2, hy + 2.7 + gueule * 0.5, hx + 3, hy + 3.4 + gueule * 0.5], '#8a2a30'); }
    g.fillStyle = L.col; g.beginPath(); g.moveTo(hx + 1.5, hy - 3.6); g.quadraticCurveTo(hx + ml * 0.6, hy - 2.6, hx + ml, hy + 0.2); g.lineTo(hx + ml - 0.4, hy + 2.6); g.lineTo(hx + 1, hy + 3.2); g.closePath(); g.fill(); // le museau
    g.fillStyle = L.belly; g.beginPath(); g.moveTo(hx + 3.5, hy + 1.2); g.lineTo(hx + ml - 0.6, hy + 1.3); g.lineTo(hx + ml - 0.4, hy + 2.6); g.lineTo(hx + 2, hy + 3.1); g.closePath(); g.fill();
    circ(g, hx + ml - 0.2, hy + 0.5, A ? 1.5 : 1.35, '#1c1a20');
    if (A) { poly(g, [hx + ml - 3.4, hy + 2.5, hx + ml - 2.6, hy + 5, hx + ml - 1.8, hy + 2.5], '#fff'); poly(g, [hx + 4.6, hy + 2.8, hx + 5.3, hy + 4.6, hx + 6, hy + 2.8], '#fff'); }
    poly(g, [hx - 0.6, hy - 4.6, hx + 0.4, hy - 13.5, hx + 4.4, hy - 4.2], L.col); poly(g, [hx + 0.6, hy - 5.4, hx + 0.9, hy - 10.8, hx + 3.2, hy - 5], A ? '#9aa6c0' : '#d8a8a0'); // l'oreille de devant
    if (A) { // regard dur, en amande, qui luit
      g.fillStyle = L.eye; g.beginPath(); g.moveTo(hx + 0.6, hy - 1.2); g.quadraticCurveTo(hx + 2.6, hy - 3.6, hx + 5, hy - 1.6); g.quadraticCurveTo(hx + 2.8, hy - 0.2, hx + 0.6, hy - 1.2); g.fill(); circ(g, hx + 3, hy - 1.7, 0.75, '#10202a');
      line(g, hx + 0.2, hy - 3.6, hx + 5.4, hy - 2.4, L.dark, 1.3); circ(g, hx + 3, hy - 1.7, 3.4, L.glow);
      poly(g, [hx - 0.4, hy - 7.6, hx + 1.4, hy - 5.4, hx - 0.4, hy - 3.6, hx - 2.2, hy - 5.6], '#7dffea'); // le losange du front
      line(g, hx + 5.6, hy - 1, hx + 8.6, hy + 0.2, 'rgba(60,70,90,0.55)', 0.9);
    } else { circ(g, hx + 2.8, hy - 1.4, 2.1, '#2a2218'); circ(g, hx + 2.8, hy - 1.4, 1.5, L.eye); circ(g, hx + 3, hy - 1.4, 0.8, '#1c1a20'); circ(g, hx + 3.5, hy - 2.1, 0.55, '#fff'); }
  }
  function felin(g, o, L, t) {
    const mv = o.moving, ph = o.step * TAU, sw = mv ? Math.sin(ph) : 0, bob = mv ? Math.abs(sw) * 1.1 : Math.sin(t * 2.4) * 0.45, lunge = o.atkAnim > 0 ? Math.sin(o.atkAnim * Math.PI) : 0, N = !!L.ombre;
    if (L.glow) ell(g, 0, -12, 29, 17, L.glow);
    if (o.sleep) { // en rond, la queue autour du museau
      ell(g, 0, 0, 15, 4.6, 'rgba(0,0,0,0.2)'); const br = Math.sin(t * 1.5) * 0.45; ell(g, -1, -6.5 - br * 0.5, 13, 7 + br, L.col); ell(g, -2, -3.4, 9, 3, L.belly);
      g.strokeStyle = L.col; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-12, -4); g.quadraticCurveTo(-6, 3.4, 9, 0); g.stroke(); if (N) circ(g, 9.6, -0.2, 2, L.stripes);
      circ(g, 9, -6.4, 5.4, L.col); poly(g, [5.4, -9, 5, -15, 9, -11], L.dark); poly(g, [9.6, -11, 12.6, -15.6, 13.8, -9.4], L.col); ell(g, 12.6, -4.6, 2.8, 2, L.belly);
      g.strokeStyle = '#2a2630'; g.lineWidth = 1; g.beginPath(); g.arc(10.4, -6.8, 1.7, 0.2, Math.PI - 0.2); g.stroke(); zzz(g, t); return;
    }
    ell(g, 0, 1, 16, 4.2, 'rgba(0,0,0,0.22)'); g.translate(lunge * 8, 0);
    const by = (N ? -12.5 : -10.5) - bob + lunge * 1.5, lw = N ? 3.2 : 3;
    // la queue : longue, en S, le bout qui bat tout seul
    const tq = Math.sin(t * 2.6) * 3, tq2 = Math.sin(t * 2.6 + 1.2) * 2.4, tl = N ? 1.15 : 1;
    g.strokeStyle = L.col; g.lineWidth = N ? 3.4 : 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-13, by - 1.5); g.bezierCurveTo(-23 * tl, by + 4, -27 * tl, by - 8 + tq2, -22 * tl + tq * 0.4, by - 15 + tq2); g.stroke();
    g.strokeStyle = N ? L.stripes : L.spots; g.lineWidth = N ? 3.6 : 3.1; g.beginPath(); g.moveTo(-22.6 * tl + tq * 0.3, by - 12.4 + tq2); g.lineTo(-22 * tl + tq * 0.4, by - 15 + tq2); g.stroke();
    if (N) circ(g, -22 * tl + tq * 0.4, by - 15.4 + tq2, 4.2 + Math.sin(t * 7) * 0.8, L.glow);
    patte(g, -9, by + 2, ph + Math.PI, mv, L.dark, lw, true); patte(g, 8, by + 3, ph, mv, L.dark, lw, false);
    // le corps : long, souple, l'épaule haute
    ell(g, -9.5, by + 0.4, 5.2, 5.6, L.col);
    g.fillStyle = L.col; g.beginPath(); g.moveTo(-14.5, by - 0.5); g.quadraticCurveTo(-13, by - 6.6, -4, by - 5.4); g.quadraticCurveTo(5, by - 8.6, 11.6, by - 6); g.quadraticCurveTo(14.6, by, 10.6, by + 5.4); g.quadraticCurveTo(2, by + 6, -4, by + 3.6); g.quadraticCurveTo(-10, by + 5.6, -14.5, by - 0.5); g.fill();
    g.fillStyle = L.belly; g.beginPath(); g.moveTo(-6, by + 3.8); g.quadraticCurveTo(2, by + 6.4, 10.6, by + 5.2); g.quadraticCurveTo(3, by + 2.8, -6, by + 3.8); g.fill();
    if (L.spots) [[-10, -3, 1.6], [-6, -1, 1.3], [-3, -4, 1.7], [1, -1.6, 1.3], [4, -5, 1.6], [8, -2.6, 1.4], [-11, 1, 1.2], [6, 1, 1.1]].forEach(q => ell(g, q[0], by + q[1], q[2], q[2] * 0.8, L.spots));
    if (N) { const pu = 0.65 + Math.sin(t * 3) * 0.3; g.globalAlpha = pu; [[-10, 0.2], [-5.5, 0.5], [-1, 0.2], [3.5, -0.4], [8, -0.2]].forEach(q => { g.strokeStyle = L.stripes; g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath(); g.moveTo(q[0] - 0.6, by - 6.4 + q[1] * 2 + Math.abs(q[0]) * 0.1); g.quadraticCurveTo(q[0] + 1.6, by - 2.5, q[0] - 0.4, by + 1.2); g.stroke(); }); g.globalAlpha = 1; }
    patte(g, -8, by + 3, ph, mv, L.col, lw + 0.2, true, L.belly); patte(g, 9.6, by + 3.6, ph + Math.PI, mv, L.col, lw + 0.2, false, L.belly);
    // la tête : ronde, museau court, grandes oreilles
    const hx = 14.4, hy = by - (N ? 7 : 6) - lunge, hr = N ? 6 : 6.4;
    poly(g, [8.5, by - 6.5, hx - 2, hy - 4, hx + 1.5, hy + 4.4, 11, by + 3.6], L.col); foulard(g, 11.4, by - 2.4);
    poly(g, [hx - 4.6, hy - 3, hx - 6.6, hy - 11.6, hx - 0.6, hy - 5.4], L.dark); if (!N) line(g, hx - 6.6, hy - 11.6, hx - 7.8, hy - 14.4, '#3a2a14', 1); // l'oreille du fond et son pinceau
    circ(g, hx, hy, hr, L.col);
    if (!N) poly(g, [hx - 4.5, hy + 1.6, hx - 8.2, hy + 4, hx - 4.4, hy + 4.2, hx - 6.4, hy + 7.4, hx - 1, hy + 5.2], L.belly); // les favoris du lynx
    ell(g, hx + 4.4, hy + 2.2, 3.5, 2.7, L.belly); poly(g, [hx + 6, hy + 0.2, hx + 7.9, hy + 0.3, hx + 6.9, hy + 1.6], N ? '#c070ff' : '#c8706a'); // le museau, la truffe
    g.strokeStyle = 'rgba(40,30,30,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(hx + 6.9, hy + 1.6); g.lineTo(hx + 6.6, hy + 2.9); g.quadraticCurveTo(hx + 5, hy + 3.9, hx + 3.6, hy + 3); g.stroke();
    if (lunge > 0.3) { poly(g, [hx + 3.4, hy + 3.4, hx + 7, hy + 3.2, hx + 5.6, hy + 3.4 + lunge * 3], '#8a2a30'); poly(g, [hx + 6, hy + 3.2, hx + 6.5, hy + 5, hx + 7, hy + 3.2], '#fff'); }
    g.strokeStyle = N ? 'rgba(220,190,255,0.8)' : 'rgba(255,255,255,0.85)'; g.lineWidth = 0.6; g.beginPath(); [[-1.2, 6], [0.4, 6.6], [2, 5.6]].forEach(q => { g.moveTo(hx + 4.6, hy + 2.4); g.lineTo(hx + 4.6 + q[1], hy + 2.4 + q[0]); }); g.stroke(); // les moustaches
    poly(g, [hx - 1, hy - 4.6, hx + 0.6, hy - 12.6, hx + 4.4, hy - 4], L.col); poly(g, [hx + 0.4, hy - 5.4, hx + 1, hy - 10.2, hx + 3.2, hy - 5], N ? '#7a5aa8' : '#f0c8b0'); if (!N) line(g, hx + 0.6, hy - 12.6, hx + 0.2, hy - 15.8, '#3a2a14', 1.1);
    // l'œil : grand et fendu
    if (N) { g.fillStyle = L.eye; g.beginPath(); g.moveTo(hx + 0.4, hy - 0.8); g.quadraticCurveTo(hx + 2.6, hy - 3.6, hx + 5, hy - 1.4); g.quadraticCurveTo(hx + 2.8, hy + 0.4, hx + 0.4, hy - 0.8); g.fill(); ell(g, hx + 2.9, hy - 1.4, 0.55, 1.4, '#1a1020'); circ(g, hx + 2.9, hy - 1.4, 3.6, L.glow); line(g, hx + 0.2, hy - 0.8, hx - 3.6, hy - 2.4 + Math.sin(t * 5) * 0.6, 'rgba(255,216,74,0.45)', 1.1); }
    else { ell(g, hx + 2.6, hy - 1.2, 2.2, 2.4, '#2a2218'); ell(g, hx + 2.6, hy - 1.2, 1.7, 1.9, L.eye); ell(g, hx + 2.8, hy - 1.2, 0.6, 1.5, '#1c1a20'); circ(g, hx + 3.3, hy - 2.1, 0.55, '#fff'); }
  }
  const PROPRE = { loup, felin };
  const BIRD = {
    hibou: [{ s: 0.85, col: '#a88a60', dark: '#7a6240', belly: '#e8d8b4', eye: '#ffd84a', round: true }, { s: 1.45, col: '#e4e0f2', dark: '#a8a0c8', belly: '#ffffff', eye: '#7dc8ff', round: true, tufts: true, glow: 'rgba(200,216,255,0.22)', stars: true }],
    faucon: [{ s: 0.8, col: '#8a745c', dark: '#5e4c3a', belly: '#e8dcc8', eye: '#221' }, { s: 1.35, col: '#f0c838', dark: '#b88a18', belly: '#fff6d0', eye: '#2a6ad8', glow: 'rgba(255,230,110,0.22)', bolt: true }]
  };
  function bird(g, o, L, t) {
    const alt = o.ko ? 5 : 34 + Math.sin(t * 2.2) * 4 - (o.atkAnim > 0 ? Math.sin(o.atkAnim * Math.PI) * 22 : 0), fl = o.ko ? 0.9 : Math.sin(t * (o.moving ? 16 : 9)); // assommé : par terre, les ailes repliées
    ell(g, 0, 1, 9, 3, 'rgba(0,0,0,0.18)'); g.translate(0, -alt);
    if (L.glow) circ(g, 0, 0, 22, L.glow);
    const wing = sd => { g.save(); g.scale(1, 1); g.rotate(sd * (0.3 + fl * 0.6)); poly(g, L.round ? [0, -2, -4, -18, -12, -14, -10, -2] : [0, -2, -3, -22, -9, -10, -7, -1], sd > 0 ? L.dark : L.col); g.restore(); };
    g.save(); g.translate(-2, -2); wing(-1); g.restore();
    if (!L.round) poly(g, [-8, 0, -17, 3, -16, -3], L.dark);
    ell(g, 0, 0, L.round ? 9 : 10, L.round ? 10 : 6, L.col); ell(g, 2, 2, L.round ? 6 : 6, L.round ? 7 : 3.5, L.belly);
    const hx = L.round ? 2 : 8, hy = L.round ? -9 : -4; circ(g, hx, hy, L.round ? 7.5 : 5, L.col);
    if (L.round) { circ(g, hx - 2, hy, 3.2, '#fff'); circ(g, hx + 3.6, hy, 3.2, '#fff'); circ(g, hx - 2, hy, 1.9, L.eye); circ(g, hx + 3.6, hy, 1.9, L.eye); circ(g, hx - 2, hy, 0.8, '#221'); circ(g, hx + 3.6, hy, 0.8, '#221'); poly(g, [hx - 0.6, hy + 2, hx + 2.2, hy + 2, hx + 0.8, hy + 5.5], '#e8a030'); if (L.tufts) { poly(g, [hx - 6, hy - 5, hx - 8, hy - 13, hx - 2, hy - 7], L.dark); poly(g, [hx + 7, hy - 5, hx + 9, hy - 13, hx + 3, hy - 7], L.dark); } }
    else { circ(g, hx + 1.5, hy - 1, 1.5, L.eye); poly(g, [hx + 4, hy - 1, hx + 9, hy + 1.5, hx + 4, hy + 2.5], '#e8a030'); }
    g.save(); g.translate(1, -1); wing(1); g.restore();
    poly(g, [-3, 3, 2, 4, 0, 8], '#d8402a');
    if (L.stars) for (let i = 0; i < 3; i++) { const a = t * 1.8 + i * 2.1; circ(g, Math.cos(a) * 19, Math.sin(a) * 11 - 2, 1.8, '#fff'); }
    if (L.bolt && Math.sin(t * 13) > 0.3) { g.strokeStyle = '#7dc8ff'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-12, -6); g.lineTo(-17, 0); g.lineTo(-13, 1); g.lineTo(-19, 8); g.stroke(); }
  }
  // o : animal du clan ou visiteur ; p.evoT > 0 pendant la transformation
  Art.pet = function (g, o, t) {
    const table = LOOK[o.kind] || BIRD[o.kind], draw = PROPRE[o.kind] || (LOOK[o.kind] ? quad : bird);
    let form = o.evo ? 1 : 0, sMul = 1;
    g.save(); g.translate(o.x, o.y);
    if (o.evoT > 0) {
      const pr = 1 - o.evoT / o.evoMax, pulse = Math.sin(pr * pr * 70);
      form = pulse > 0 ? 1 : 0; sMul = 1 + pr * 0.15 + Math.abs(pulse) * 0.08;
      const gr = g.createLinearGradient(0, -260, 0, 10); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,246,190,' + (0.25 + pr * 0.5) + ')');
      g.fillStyle = gr; g.fillRect(-26 - pr * 14, -260, 52 + pr * 28, 270);
      ell(g, 0, 0, 34 + pr * 20, 12 + pr * 6, 'rgba(255,240,170,' + (0.3 + pr * 0.4) + ')'); circ(g, 0, -18, 26 + pr * 26 + Math.sin(t * 20) * 3, 'rgba(255,255,255,' + (0.2 + pr * 0.5) + ')');
    }
    const L = table[form]; g.scale((o.face < 0 ? -1 : 1) * L.s * sMul, L.s * sMul);
    if (o.ko) { g.globalAlpha = 0.55; g.rotate(1.4); }
    draw(g, o, L, t + (o.seed || 0));
    g.restore();
    if (o.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + o.flash + ')'; g.beginPath(); g.arc(o.x, o.y - 18, 60 * (1.2 - o.flash), 0, TAU); g.fill(); }
  };
})(window.CG);
