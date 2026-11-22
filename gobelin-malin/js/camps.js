// Clan Gobelin — campements ennemis : des repaires qui fabriquent des ennemis, puis lancent un raid.
'use strict';
(function (CG) {
  const G = CG.G, Art = CG.Art, Camps = CG.Camps = {}, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  // every : secondes entre deux renforts · raid : combien il en faut pour partir à l'attaque
  const C = Camps.KINDS = {
    tente: { every: 105, raid: 3, min: 1, units: d => ['brigand'], titre: 'Une tente de brigands' },
    camp: { every: 68, raid: 5, min: 2, units: d => d >= 11 ? ['soldat', 'archer', 'chevalier', 'mage'] : d >= 8 ? ['milicien', 'soldat', 'archer', 'chevalier'] : d >= 4 ? ['brigand', 'milicien', 'soldat', 'archer'] : d >= 3 ? ['brigand', 'milicien', 'soldat'] : ['brigand', 'milicien'], titre: 'Un camp humain' },
    cabane: { every: 78, raid: 4, min: 2, units: d => ['gnome'], titre: 'Une cabane de gnomes archers' },
    grotte: { every: 160, raid: 2, min: 3, units: d => ['ogre'], titre: 'Une grotte d\'ogres' }
  };
  Camps.roll = function (spots) {
    const S = CG.S, R = CG.R, day = S.day, n = day < 4 ? 1 : day < 7 ? 2 : 3, kinds = Object.keys(C).filter(k => day >= C[k].min), made = [];
    // les repaires restent là tant qu'on ne les a pas détruits : chaque nuit de plus, ils sont mieux garnis, plus solides et plus pressés
    const list = S.camps || (S.camps = []);
    list.forEach(c => { if (c.day !== day) { c.age += day - c.day; c.day = day; } if (c.kind === 'tente' && c.age >= 3) c.kind = 'camp'; /* la tente est devenue un vrai camp */ });
    while (list.length < n && spots.length) { const s = spots.pop(), c = { x: s.x, y: s.y, kind: day === 1 ? 'tente' : pick(kinds), age: 0, day }; list.push(c); made.push(C[c.kind].titre.toLowerCase()); }
    list.forEach(cp => {
      const kind = cp.kind, c = CG.W.center(cp.x, cp.y), age = Math.min(6, cp.age);
      const e = G.spawnEnemy(kind, c.x, c.y, { wild: true }); e.campKind = kind; e.campRef = cp; e.age = age;
      e.hp = e.maxhp = Math.round(e.maxhp * (1 + age * 0.15)); e.rate = Math.max(0.5, 1 - age * 0.08); e.raidN = C[kind].raid + age; e.partN = C[kind].raid + Math.floor(age / 2); // il faut autant de renforts qu'avant pour partir ; une partie reste garder le repaire
      e.spawnT = C[kind].every * e.rate * rand(0.7, 1);
      for (let i = 0, g = Math.min(6, 1 + age); i < g; i++) { const m = G.spawnEnemy(pick(C[kind].units(day + age)), c.x + rand(-48, 48), c.y + 44 + rand(0, 18), { wild: true }); m.campId = e.id; m.wild = { x: c.x, y: c.y + 50 }; }
    });
    R.campNote = ''; R.campSeen = made.length ? '⚠ Repéré dans les alentours : ' + made.join(', ') + ' (carré rouge sur la carte). Détruis-le avant qu\'ils soient assez nombreux pour attaquer !' : '';
  };
  const members = e => CG.R.enemies.filter(m => m.campId === e.id && !m.dead && m.wild);
  Camps.step = function (e, dt) {
    const S = CG.S, R = CG.R, c = C[e.type]; if (S.hour < 6 || S.hour > 19) return;
    e.spawnT -= dt; if (e.spawnT > 0) return;
    const raid = e.raidN || c.raid;
    e.spawnT = c.every * (e.rate || 1) * rand(0.8, 1.2);
    if (e.raided && members(e).length >= raid) return; // un seul raid par jour : ensuite il se contente de se regarnir
    const m = G.spawnEnemy(pick(c.units(S.day + (e.age || 0))), e.x + rand(-44, 44), e.y + 40 + rand(0, 16), { wild: true }); m.campId = e.id; m.wild = { x: e.x, y: e.y + 50 };
    G.puff(m.x, m.y - 14, '#ddd', 8, 70, 3);
    const all = members(e); if (all.length < raid || e.raided) return;
    if (R.event && R.event.type !== 'attack') return; // on attend que le visiteur soit reparti
    e.raided = true;
    all.slice(0, e.partN || all.length).forEach(o => { o.wild = null; o.event = true; o.target = null; o.exit = { x: e.x, y: e.y + 40 }; });
    if (!R.event) R.event = { type: 'attack', kind: 'camp', quiet: true, msg: ['Un raid attaque le village !', c.titre + ' a envoyé ses troupes. Aux armes ! ' + ((e.age || 0) >= 2 ? 'Ce repaire grossit chaque jour : détruis-le, sinon il attaquera de plus en plus fort.' : 'Ensuite, va détruire leur repaire.')] };
  };
  Camps.destroyed = function (e) {
    const S = CG.S, R = CG.R; G.puff(e.x, e.y - 20, '#c9a56b', 30, 200, 6); G.puff(e.x, e.y - 20, '#ff8a1e', 16, 150, 5); CG.sfx('fire');
    R.rings.push({ x: e.x, y: e.y - 6, r: 110, life: 0.5, col: '#ffb05a' });
    if (S.camps) S.camps = S.camps.filter(c => c !== e.campRef); // celui-là ne reviendra pas demain
    if (e.age) G.dropRes(e.x, e.y + 6, 'or', 10 * e.age);
    R.chests.push({ x: e.x, y: e.y + 6, kind: 'precieux', open: false }); S.morale = Math.min(100, S.morale + 2);
    const prime = 20 + 8 * (e.age || 0) + 3 * S.day; G.addXp(prime); G.text(e.x, e.y - 70, '+' + prime + ' XP', '#bfe4ff', true);
    G.banner('Repaire détruit !', 'Plus aucun ennemi n\'en sortira : +' + prime + ' XP. Ramasse le butin.', '#b8ffb0');
  };

  // ---------- un lieu nettoyé (cimetière, ruines, nid...) : tous ses gardiens du jour sont tombés, prime d'XP ----------
  const LIEU = { cimetiere: 'Cimetière nettoyé !', ruines: 'Ruines nettoyées !', nid: 'Nid d\'araignées nettoyé !', ile: 'Clairière nettoyée !', cache: 'Cachette nettoyée !', portail: 'Portail nettoyé !' };
  let lieuT = 0;
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); lieuT -= dt; if (lieuT > 0 || !CG.S || !CG.R || !CG.W.sites) return; lieuT = 0.5;
    const S = CG.S, R = CG.R, done = R.siteDone || (R.siteDone = {});
    for (const s of CG.W.sites) {
      if (done[s.k]) continue; let n = 0, vivants = 0;
      for (const e of R.enemies) if (e.site === s.k) { n++; if (!e.dead) vivants++; }
      if (!n) { if (R.siteN && R.siteN[s.k]) n = R.siteN[s.k]; else continue; }
      (R.siteN || (R.siteN = {}))[s.k] = Math.max(n, (R.siteN[s.k] || 0));
      if (vivants) continue;
      done[s.k] = true; (S.propre || (S.propre = {}))[(CG.Mondes && CG.Mondes.ici ? CG.Mondes.ici() : 0) + ':' + s.k] = S.day; /* retenu : le nid d'araignées grossit tant qu'on ne le nettoie pas, et la carte coche les lieux faits */ const prime = 12 + 4 * R.siteN[s.k] + 3 * S.day; G.addXp(prime);
      let plus = '';
      if (s.k === 'cimetiere' || s.k === 'nid') { // la récompense : le coffre apparaît
        const c0 = R.siteCoffre && R.siteCoffre[s.k], ctr = CG.W.center(s.x, s.y), c = c0 || { x: ctr.x, y: ctr.y, kind: 'precieux', open: false }; if (R.siteCoffre) delete R.siteCoffre[s.k];
        c.vu = true; R.chests.push(c); G.puff(c.x, c.y - 6, '#8a6a3a', 22, 130, 4); G.puff(c.x, c.y - 10, '#ffe36b', 16, 110, 3); R.rings.push({ x: c.x, y: c.y - 4, r: 60, life: 0.6, col: '#ffe36b' }); CG.sfx('discovery'); plus = s.k === 'nid' ? ' Un coffre apparaît sous les toiles !' : ' Un coffre sort de terre !';
        if (R.pings) R.pings.push({ x: c.x, y: c.y, t0: performance.now(), icon: '🎁', dur: 7000 });
      }
      CG.sfx('lieuNettoye'); G.banner(LIEU[s.k] || 'Lieu nettoyé !', 'Plus un seul monstre ici aujourd\'hui : +' + prime + ' XP.' + plus, '#bfe4ff');
    }
  };

  // ---------- dessin ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const box = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  function tent(g, x, y, s, col, stripe) {
    ell(g, x, y + 2, 30 * s, 8 * s, 'rgba(0,0,0,0.25)');
    poly(g, [x - 28 * s, y, x, y - 44 * s, x + 28 * s, y], col); poly(g, [x, y, x, y - 44 * s, x + 28 * s, y], 'rgba(0,0,0,0.18)');
    poly(g, [x - 7 * s, y, x, y - 24 * s, x + 7 * s, y], '#2a1c12'); poly(g, [x - 16 * s, y - 19 * s, x + 16 * s, y - 19 * s, x + 19 * s, y - 14 * s, x - 19 * s, y - 14 * s], stripe);
    box(g, x - 1.5 * s, y - 52 * s, 3 * s, 10 * s, '#5a3d22');
  }
  Art.camp = function (g, e, t) {
    const x = e.x, y = e.y, hurt = e.hp < e.maxhp * 0.5;
    if (e.type === 'tente') { tent(g, x, y, 1.1, '#c8b890', '#8a5a2a'); box(g, x + 26, y - 12, 14, 12, '#8a5a2a'); }
    else if (e.type === 'camp') {
      tent(g, x - 44, y - 16, 0.9, '#d8d0b8', '#4a6aa8'); tent(g, x + 44, y - 14, 0.9, '#d8d0b8', '#4a6aa8'); tent(g, x, y - 30, 1.15, '#e8e0c8', '#a8322a');
      box(g, x + 30, y - 78, 3, 50, '#5a3d22'); poly(g, [x + 33, y - 78, x + 54, y - 71, x + 33, y - 62], '#4a6aa8');
      ell(g, x, y + 12, 14, 5, '#74706a'); for (let i = 0; i < 3; i++) { const ph = t * 8 + i * 2; g.fillStyle = i % 2 ? '#ff8a1e' : '#ffb432'; g.beginPath(); g.moveTo(x - 7 + i * 5, y + 10); g.quadraticCurveTo(x - 8 + i * 5, y - 2, x - 3 + i * 5 + Math.sin(ph) * 2, y - 12 - Math.sin(ph) * 3); g.quadraticCurveTo(x + 2 + i * 5, y - 2, x + 1 + i * 5, y + 10); g.fill(); }
    } else if (e.type === 'cabane') {
      ell(g, x, y + 2, 36, 9, 'rgba(0,0,0,0.25)'); box(g, x - 28, y - 34, 56, 34, '#8a6234'); box(g, x, y - 34, 28, 34, 'rgba(0,0,0,0.15)');
      g.strokeStyle = 'rgba(40,26,12,0.5)'; g.lineWidth = 2; for (let yy = y - 26; yy < y; yy += 8) { g.beginPath(); g.moveTo(x - 28, yy); g.lineTo(x + 28, yy); g.stroke(); }
      poly(g, [x - 7, y, x - 7, y - 18, x + 7, y - 18, x + 7, y], '#2a1c12'); box(g, x + 13, y - 26, 9, 8, '#ffd86b');
      g.fillStyle = '#c8322a'; g.beginPath(); g.ellipse(x, y - 34, 38, 26, 0, Math.PI, 0); g.fill(); [[-18, -46], [6, -52], [22, -42], [-4, -40]].forEach(([dx, dy]) => ell(g, x + dx, y + dy, 5, 4, '#fff'));
      box(g, x - 46, y - 30, 3, 30, '#5a3d22'); ell(g, x - 44.5, y - 34, 9, 9, '#f4ead0'); ell(g, x - 44.5, y - 34, 5.5, 5.5, '#c8322a'); ell(g, x - 44.5, y - 34, 2, 2, '#f4ead0');
    } else {
      ell(g, x, y + 4, 54, 12, 'rgba(0,0,0,0.28)');
      poly(g, [x - 52, y + 4, x - 44, y - 30, x - 22, y - 58, x + 10, y - 66, x + 38, y - 44, x + 52, y - 12, x + 50, y + 4], '#77736b'); poly(g, [x + 10, y - 66, x + 38, y - 44, x + 52, y - 12, x + 50, y + 4, x + 14, y + 4], '#5f5b54'); poly(g, [x - 44, y - 30, x - 22, y - 58, x - 12, y - 46, x - 34, y - 24], '#9a968c');
      g.fillStyle = '#16100c'; g.beginPath(); g.ellipse(x - 2, y + 4, 22, 34, 0, Math.PI, 0); g.fill();
      const bl = Math.sin(t * 1.3) > 0.94 ? 0 : 1; if (bl) { ell(g, x - 9, y - 16, 2.6, 2, '#ffb432'); ell(g, x + 4, y - 16, 2.6, 2, '#ffb432'); }
      ell(g, x + 30, y + 2, 7, 5, '#eee6d0'); g.strokeStyle = '#eee6d0'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 38, y + 4); g.lineTo(x - 26, y + 8); g.stroke();
    }
    if (hurt) for (let i = 0; i < 3; i++) { const p = (t * 0.5 + i / 3) % 1; ell(g, x - 10 + i * 12 + Math.sin(t * 2 + i) * 4, y - 50 - p * 40, 5 + p * 7, 5 + p * 7, `rgba(60,56,52,${0.5 * (1 - p)})`); }
  };
})(window.CG);
