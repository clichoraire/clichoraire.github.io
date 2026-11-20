// Goblin Malin — les terres nouvelles du marais (la carte y est deux fois plus vaste que dans la forêt) et ce qu'on y trouve :
//   le bayou et ses alligators : ils guettent dans l'eau, on ne voit que le bout du museau et les yeux, immobiles. Si on passe trop près,
//     tantôt ils jaillissent (bam !), tantôt ils replongent sans bruit. Blessés, ils retournent se cacher sous l'eau. Trois sortes, du plus
//     faible au plus fort : l'alligator, l'alligator venimeux (il crache du poison) et le vieil alligator des eaux (poison et geysers).
//   les cabanes sur pilotis : perchées sur de longues pattes de bois au bord de l'eau, elles tirent des flèches et lancent des roches.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, Mo = CG.Mondes, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const Mg = CG.Marecage = { LAPINS: { x: 114, y: 28, r: 4 }, BAYOU: { x: 108, y: 80, rx: 13, ry: 9 }, MARE: { x: 121, y: 56, rx: 7, ry: 5 },
    NB: [9, 18], VOIT: 150, ATTAQUE: 0.65, DELAI: [0.7, 2.4], FOND: [8, 20], FUITE: 0.3, SEUL: 7, JOURS: { alligator: 1, alligatorVenin: 3, alligatorAncien: 6 },
    CRACHAT: [4, 6.5], GEYSER: [5, 7.5], GEYSER_R: 54, TREMPE: 2.5, TREMPE_K: 0.6,
    PILOTIS: 5, PORTEE: 310, RETOUR: 4, ROCHE_R: 38 };
  Object.assign(CG.ENEMIES, {
    alligator: { nom: 'Alligator', race: 'bete', hp: 62, dmg: 10, spd: 86, xp: 28, or: 5, cost: 5, r: 18, food: 4 },
    alligatorVenin: { nom: 'Alligator venimeux', race: 'bete', hp: 96, dmg: 12, spd: 90, xp: 46, or: 9, cost: 7, r: 19, food: 5, venin: [6, 2.5] },
    alligatorAncien: { nom: 'Vieil alligator des eaux', race: 'bete', hp: 150, dmg: 15, spd: 88, xp: 78, or: 20, cost: 9, r: 21, food: 6, venin: [6, 3] },
    pilotis: { nom: 'Cabane sur pilotis', race: 'repaire', struct: true, hp: 120, dmg: 7, spd: 0, xp: 40, or: 30, cost: 99, r: 26 }
  });
  const GATOR = { alligator: 1, alligatorVenin: 2, alligatorAncien: 3 };
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0) && !(R.invis > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && g.ko !== true) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); return l; };
  const frappe = (o, dmg) => { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); };
  const pres = (x, y, r) => { let b = null, bd = r; for (const o of nous()) { const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; b = o; } } return b; };
  const ici = () => !!(Mo && Mo.marais() && W.marecage);

  // ---------- le terrain : appelé par mondes.js pendant qu'il dessine le marais ----------
  Mg.terrain = function (o) {
    const set = o.set, glade = o.glade, carve = o.carve, P = o.P, E = o.E, L = Mg.LAPINS, noise = W.noise;
    const lac = q => { for (let y = -q.ry - 2; y <= q.ry + 2; y++) for (let x = -q.rx - 2; x <= q.rx + 2; x++) if ((x * x) / (q.rx * q.rx) + (y * y) / (q.ry * q.ry) < 0.8 + noise((q.x + x) / 3 + 7.7, (q.y + y) / 3 + 2.2) * 0.4) set(q.x + x, q.y + y, W.WATER); };
    lac(Mg.BAYOU); lac(Mg.MARE);
    const ilot = { x: Mg.BAYOU.x, y: Mg.BAYOU.y, r: 3 }, rive = { x: Mg.BAYOU.x + 17, y: Mg.BAYOU.y + 3, r: 2 };
    glade(ilot); glade(L); glade(rive);
    carve(P.chasse, L, 1.6); carve(L, E.est, 1.6); carve(P.ruines, L, 1.5); carve(L, { x: Mg.MARE.x - 9, y: Mg.MARE.y }, 1.4); carve({ x: Mg.MARE.x - 9, y: Mg.MARE.y }, rive, 1.6);
    carve(P.lezards, ilot, 1.2); carve(ilot, rive, 1.2); carve(rive, E.est, 1.4); carve(ilot, E.sud, 1.6);
    W.marecage = { lapins: L, ilot, pilotis: null };
  };
  // où se dressent les cabanes sur pilotis : au bord de l'eau, dans les terres nouvelles, toujours aux mêmes endroits
  function cabanes() {
    const M = W.marecage; if (M.pilotis) return M.pilotis; const f = W.field(), rng = CG.makeRng(W.seed + 77), l = [];
    for (let k = 0; k < 6000 && l.length < Mg.PILOTIS; k++) {
      const x = 4 + Math.floor(rng() * (CG.MW - 8)), y = 4 + Math.floor(rng() * (CG.MH - 8)); if (x < CG.MW0 - 2 && y < CG.MH0 - 2) continue;
      if (f[W.idx(x, y)] < 0 || !W.walkTile(x, y) || W.tile[W.idx(x, y)] === W.PATH) continue;
      let eau = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (W.isWater(x + dx, y + dy)) eau = true; if (!eau) continue;
      if (Math.hypot(x - M.lapins.x, y - M.lapins.y) < 10 || l.some(q => Math.hypot(q.x - x, q.y - y) < 13) || Object.values(W.EXITS).some(e => Math.hypot(e.x - x, e.y - y) < 7)) continue;
      l.push({ x, y });
    }
    return (M.pilotis = l);
  }
  // où guettent les alligators aujourd'hui : dans l'eau, tout contre une rive où l'on peut marcher, loin du campement
  function guetteurs() {
    const S = CG.S, f = W.field(), l = [], n = Math.min(Mg.NB[1], Mg.NB[0] + Math.floor(S.day / 2)), sortes = Object.keys(Mg.JOURS).filter(k => S.day >= Mg.JOURS[k]);
    for (let k = 0; k < 5000 && l.length < n; k++) {
      const x = CG.irand(3, CG.MW - 4), y = CG.irand(3, CG.MH - 4); if (W.tile[W.idx(x, y)] !== W.WATER || Math.hypot(x - W.CX, y - W.CY) < 16) continue;
      let terre = null; for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + d[0], b = y + d[1]; if (W.inMap(a, b) && W.walkTile(a, b) && f[W.idx(a, b)] >= 0) { terre = { x: a * T + T / 2, y: b * T + T / 2 }; break; } }
      if (!terre || l.some(q => Math.hypot(q.tx - x, q.ty - y) < 5) || S.buildings.some(b => Math.hypot(b.tx - x, b.ty - y) < 9) || Math.hypot(x - W.marecage.lapins.x, y - W.marecage.lapins.y) < 8) continue;
      const type = sortes[Math.floor(Math.pow(Math.random(), 1.6) * sortes.length)]; // les plus forts plus rarement
      l.push(lurker({ tx: x, ty: y, x: x * T + T / 2, y: y * T + T / 2 + 4, terre, type, st: 'guet', t: 0, pense: 0, delai: 0, face: terre.x >= x * T + T / 2 ? 1 : -1, seed: Math.random() * 50, hp: null }));
    }
    return l;
  }
  const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments), S = CG.S, R = CG.R; R.gators = null; R.jets = []; if (!ici()) return r;
    S.pilotisBas = S.pilotisBas || {};
    cabanes().forEach((q, i) => { if (S.pilotisBas[i] !== undefined && S.day - S.pilotisBas[i] < Mg.RETOUR) return; const e = G.spawnEnemy('pilotis', q.x * T + T / 2, q.y * T + T / 2 + 8, { wild: true, exact: true }); e.pil = i; e.tir = rand(1, 3); });
    R.gators = guetteurs(); return r;
  };

  // ---------- les alligators ----------
  function eclabousse(x, y, n) { const R = CG.R; G.puff(x, y - 4, '#bfe8d8', n, 150, 4); G.puff(x, y - 4, '#7ab8a8', n >> 1, 90, 3); R.rings.push({ x, y, r: 34, life: 0.4, col: '#cfeee0' }); if (CG.onScreen(x, y)) CG.sfx('hit'); }
  function sortir(L, tg) {
    const R = CG.R, e = G.spawnEnemy(L.type, L.terre.x, L.terre.y, { wild: true, exact: true }); if (L.hp) e.hp = Math.min(e.maxhp, L.hp);
    e.gator = L; e.bond = 0.32; e.atkCd = 0.3; e.target = tg; e.face = tg.x >= e.x ? 1 : -1; e.spe = rand(2, 4); L.st = 'sorti'; L.e = e; L.seul = 0; L.rentre = false; L.peur = false;
    eclabousse(L.x, L.y, 22); G.text(L.x, L.y - 46, '💥', '#fff', true); if (CG.onScreen(L.x, L.y)) CG.sfx('warning');
  }
  function plonger(L, sec) { L.st = 'fond'; L.t = sec || rand(Mg.FOND[0], Mg.FOND[1]); L.pense = 0; L.bulles = 1.2; if (CG.onScreen(L.x, L.y)) G.puff(L.x, L.y - 2, '#bfe8d8', 6, 40, 2); }
  function special(L, e, dt) {
    const R = CG.R, niv = GATOR[e.type], pr = e.prep;
    if (pr) {
      e.moving = false; pr.t -= dt; e.atkCd = Math.max(e.atkCd, 0.4); if (pr.t > 0) return;
      e.prep = null; e.atkAnim = 1;
      if (pr.k === 'crachat') { const dx = pr.x - e.x, dy = pr.y - e.y, l = Math.hypot(dx, dy) || 1; R.jets.push({ k: 'venin', x: e.x + dx / l * 18, y: e.y - 8, vx: dx / l * 310, vy: dy / l * 310, life: 1.1, dmg: e.dmg * 0.7, dps: niv === 3 ? 3 : 2.5 }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
      else { // le geyser : une colonne d'eau jaillit là où le cercle était posé
        for (const o of nous()) if (Math.hypot(o.x - pr.x, o.y - pr.y) < Mg.GEYSER_R) { frappe(o, e.dmg * 1.3); if (o === CG.S.player) { R.trempe = Mg.TREMPE; G.text(o.x, o.y - 70, '💦 Trempé !', '#9adcff', true); } }
        G.puff(pr.x, pr.y - 20, '#9adcff', 26, 240, 5); G.puff(pr.x, pr.y - 40, '#e0f6ff', 14, 180, 4); R.rings.push({ x: pr.x, y: pr.y, r: Mg.GEYSER_R, life: 0.45, col: '#9adcff' }); R.geysers = (R.geysers || []).concat([{ x: pr.x, y: pr.y, t: 0.5 }]); if (CG.onScreen(pr.x, pr.y)) CG.sfx('fire');
      }
      return;
    }
    if (niv < 2 || e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0) return;
    e.spe -= dt; if (e.spe > 0) return; const tg = e.target; if (!tg || tg.hidden) { e.spe = 0.5; return; } const d = Math.hypot(tg.x - e.x, tg.y - e.y);
    if (niv === 3 && d < 330 && Math.random() < 0.55) { e.prep = { k: 'geyser', t: 1.0, max: 1.0, x: tg.x, y: tg.y }; e.spe = rand(Mg.GEYSER[0], Mg.GEYSER[1]); G.text(e.x, e.y - 50, '💧', '#9adcff', true); return; }
    if (d > 80 && d < 290 && W.lineClear(e.x, e.y, tg.x, tg.y)) { e.prep = { k: 'crachat', t: 0.55, max: 0.55, x: tg.x, y: tg.y }; e.spe = rand(Mg.CRACHAT[0], Mg.CRACHAT[1]); e.face = tg.x >= e.x ? 1 : -1; return; }
    e.spe = 0.6;
  }
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R, tenus = [];
    if (S && R && R.gators) for (const L of R.gators) { const e = L.e; if (L.st === 'sorti' && e && !e.dead && (L.rentre || e.prep)) { e._gx = e.x; e._gy = e.y; tenus.push(e); if (L.rentre) { e.calm = true; e.target = null; e.atkCd = Math.max(e.atkCd, 0.5); } } }
    up0.apply(this, arguments); if (CG.S !== S || CG.R !== R || !S || !R) return;
    if (R.trempe > 0) R.trempe -= dt;
    if (R.geysers) { for (const q of R.geysers) q.t -= dt; R.geysers = R.geysers.filter(q => q.t > 0); }
    if (R.night || R.cine) return;
    for (const e of tenus) { e.x = e._gx; e.y = e._gy; }
    const jets = R.jets || (R.jets = []);
    for (const s of jets) {
      if (s.k === 'venin') { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; for (const o of nous()) if (Math.hypot(o.x - s.x, o.y - 12 - s.y) < 20) { frappe(o, s.dmg); if (CG.Marais) CG.Marais.venin(o, 6, s.dps); s.life = 0; G.puff(s.x, s.y, '#9be04a', 10, 90, 3); break; } }
      else { s.t += dt; if (s.t >= s.dur) { s.life = 0; for (const o of nous()) if (Math.hypot(o.x - s.tx, o.y - s.ty) < Mg.ROCHE_R) frappe(o, s.dmg); G.puff(s.tx, s.ty - 4, '#a89a84', 14, 130, 4); R.rings.push({ x: s.tx, y: s.ty, r: Mg.ROCHE_R, life: 0.35, col: '#d8c8a8' }); if (CG.onScreen(s.tx, s.ty)) CG.sfx('hit'); } }
    }
    R.jets = jets.filter(s => s.life > 0);
    if (!R.gators) return;
    for (let i = R.gators.length - 1; i >= 0; i--) {
      const L = R.gators[i];
      if (L.st === 'guet') {
        const tg = pres(L.x, L.y, Mg.VOIT); if (!tg) { L.pense = 0; continue; }
        if (!L.pense) L.delai = rand(Mg.DELAI[0], Mg.DELAI[1]); L.pense += dt; if (L.pense < L.delai) continue;
        if (Math.random() < Mg.ATTAQUE) sortir(L, tg); else plonger(L);
      } else if (L.st === 'fond') {
        L.t -= dt; if (L.bulles > 0) L.bulles -= dt; if (L.hp) L.hp += dt * 2; if (L.t <= 0) { L.st = 'guet'; L.pense = 0; }
      } else {
        const e = L.e; if (!e || e.dead || !R.enemies.includes(e)) { R.gators.splice(i, 1); continue; }
        if (e.bond > 0) e.bond -= dt;
        if (!L.rentre) {
          const tg = pres(e.x, e.y, 420); L.seul = tg ? 0 : L.seul + dt;
          if (!L.peur && e.hp < e.maxhp * Mg.FUITE) { L.peur = true; if (Math.random() < 0.7) { L.rentre = true; G.text(e.x, e.y - 50, '💨', '#cfeee0', true); } }
          if (L.seul > Mg.SEUL) L.rentre = true;
          if (L.rentre) { e.prep = null; e.path = null; continue; }
          special(L, e, dt);
        } else { // il retourne à l'eau, et disparaît dessous
          if (!(e.rooted > 0) && !(e.para > 0) && !(e.sleepT > 0) && !e.poly) G.chase(e, L.terre.x, L.terre.y, e.spd * 1.5, dt);
          if (Math.hypot(e.x - L.terre.x, e.y - L.terre.y) < 30) { const k = R.enemies.indexOf(e); if (k >= 0) R.enemies.splice(k, 1); L.hp = e.hp; L.e = null; eclabousse(L.x, L.y, 14); plonger(L, rand(12, 24)); }
        }
      }
    }
  };
  const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (CG.R && CG.R.trempe > 0 ? Mg.TREMPE_K : 1); };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'trempe', ic: '💦', mal: true, nom: 'Trempé', txt: 'Le geyser t\'a renversé : tu avances moins vite un instant.', t: () => CG.R.trempe > 0 ? CG.R.trempe : 0 });

  // ---------- les cabanes sur pilotis ----------
  if (CG.Camps) {
    const st0 = CG.Camps.step; CG.Camps.step = function (e, dt) {
      if (e.type !== 'pilotis') return st0.apply(this, arguments);
      const R = CG.R; e.tir = (e.tir === undefined ? 1 : e.tir) - dt; if (e.tir > 0) return; const tg = pres(e.x, e.y, Mg.PORTEE); if (!tg) { e.tir = 0.4; return; }
      e.face = tg.x >= e.x ? 1 : -1; e.atkAnim = 1;
      if (Math.random() < 0.55) { G.shoot({ x: e.x, y: e.y - 62 }, tg, 'arrow', e.dmg, 'e'); e.tir = rand(1.4, 1.9); }
      else { (R.jets || (R.jets = [])).push({ k: 'roche', x0: e.x, y0: e.y - 80, tx: tg.x, ty: tg.y, t: 0, dur: 1.05, dmg: e.dmg * 1.7, life: 1 }); e.tir = rand(2.2, 2.9); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
    };
    const ds0 = CG.Camps.destroyed; CG.Camps.destroyed = function (e) {
      if (e.type !== 'pilotis') return ds0.apply(this, arguments);
      const S = CG.S, R = CG.R; G.puff(e.x, e.y - 50, '#c9a56b', 30, 200, 6); G.puff(e.x, e.y - 20, '#8a6a4a', 18, 150, 5); CG.sfx('fire'); R.rings.push({ x: e.x, y: e.y - 6, r: 100, life: 0.5, col: '#e0c890' });
      (S.pilotisBas = S.pilotisBas || {})[e.pil] = S.day; R.chests.push({ x: e.x, y: e.y + 10, kind: 'precieux', open: false }); G.dropRes(e.x, e.y + 6, 'bois', 12);
      const prime = 15 + 3 * S.day; G.addXp(prime); G.text(e.x, e.y - 90, '+' + prime + ' XP', '#bfe4ff', true); G.banner('La cabane s\'effondre !', 'Ses longues pattes de bois ont cédé : +' + prime + ' XP. Ramasse ce qui est tombé.', '#b8ffb0');
    };
  }

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const COUL = { 1: { c: '#5a7038', d: '#3c4c26', v: '#b8c080', o: '#e8d24a' }, 2: { c: '#7a8a2e', d: '#4a5a1c', v: '#d0d878', o: '#d070ff', t: '#8a3ab0' }, 3: { c: '#2c5a62', d: '#183a44', v: '#8ac0c0', o: '#7af0ff', t: '#7af0ff' } };
  // le guetteur : rien que le bout du museau et les yeux, posés sur l'eau, sans un mouvement
  function lurker(L) {
    L.draw = function (g, o, t) {
      if (L.st === 'sorti') return; const C = COUL[GATOR[L.type]];
      if (L.st === 'fond') { if (L.bulles > 0) { g.globalAlpha = Math.min(1, L.bulles); for (let i = 0; i < 3; i++) { const q = (t * 0.9 + i / 3 + L.seed) % 1; g.strokeStyle = 'rgba(220,245,235,0.8)'; g.lineWidth = 1; g.beginPath(); g.arc(L.x - 6 + i * 6, L.y - q * 10, 1.4 + q * 1.6, 0, TAU); g.stroke(); } g.globalAlpha = 1; } return; }
      g.save(); g.translate(L.x, L.y); g.scale(L.face, 1);
      g.strokeStyle = 'rgba(220,245,235,0.28)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(2, 1, 21, 6, 0, 0, TAU); g.stroke();
      ell(g, 13, 0, 4.4, 2.2, C.d); ell(g, 14.6, -0.8, 0.9, 0.7, '#0c1408'); ell(g, 11.8, -0.8, 0.9, 0.7, '#0c1408'); // le bout du museau et les narines
      ell(g, -4, -1.6, 3.6, 2.6, C.d); ell(g, 2.4, -1.6, 3.6, 2.6, C.d); // les deux bosses des yeux
      const clin = (t * 0.23 + L.seed) % 1 < 0.03; if (!clin) { ell(g, -3.6, -2.4, 1.7, 1.2, C.o); ell(g, 2.8, -2.4, 1.7, 1.2, C.o); g.fillStyle = '#0c1408'; g.fillRect(-3.9, -3.4, 0.7, 2); g.fillRect(2.5, -3.4, 0.7, 2); }
      g.restore();
    };
    return L;
  }
  function gator(g, e, t) {
    const niv = GATOR[e.type], C = COUL[niv], ech = niv === 1 ? 1.35 : niv === 2 ? 1.5 : 1.75, mv = e.moving, ph = e.step * TAU, atk = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) : 0, prep = e.prep;
    let ox = 0, oy = 0; const L = e.gator; if (e.bond > 0 && L) { const k = e.bond / 0.32; ox = (L.x - e.x) * k; oy = (L.y - e.y) * k - Math.sin((1 - k) * Math.PI) * 26; }
    ell(g, e.x, e.y + 1, 26 * ech, 5.5 * ech, 'rgba(0,0,0,0.24)');
    g.save(); g.translate(e.x + ox, e.y + oy); g.scale((e.face < 0 ? -1 : 1) * ech, ech); g.translate(atk * 5, 0);
    const gueule = atk * 7 + (prep && prep.k === 'crachat' ? 6 : 0) + (prep && prep.k === 'geyser' ? 2 + Math.sin(t * 20) : 0), by = -7 - (mv ? Math.abs(Math.sin(ph)) * 0.8 : 0), q = Math.sin(t * 3.4 + (mv ? ph : 0)) * (mv ? 5 : 2);
    // la queue : longue, qui balaie
    g.strokeStyle = C.d; g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(-12, by + 1); g.quadraticCurveTo(-22, by + 2 + q * 0.5, -30, by + 3 + q); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(-28, by + 3 + q * 0.9); g.lineTo(-36, by + 4 + q * 1.4); g.stroke();
    const patte = (x, a) => { const s = mv ? Math.sin(ph + a) * 3.5 : 0; g.strokeStyle = C.d; g.lineWidth = 3.6; g.beginPath(); g.moveTo(x, by + 3); g.lineTo(x + s - 1, -0.5); g.stroke(); ell(g, x + s + 0.8, -0.3, 3, 1.5, C.d); };
    patte(-9, Math.PI); patte(8, 0);
    g.fillStyle = C.c; g.beginPath(); g.moveTo(-15, by + 1); g.quadraticCurveTo(-12, by - 6.5, -1, by - 6); g.quadraticCurveTo(9, by - 6.5, 14, by - 3); g.lineTo(14, by + 4); g.quadraticCurveTo(0, by + 7.5, -15, by + 1); g.fill(); // le corps
    ell(g, 0, by + 3.6, 12, 2.6, C.v);
    for (let i = 0; i < 7; i++) poly(g, [-13 + i * 3.6, by - 4.6, -11.6 + i * 3.6, by - 8.2 - (i % 2), -10 + i * 3.6, by - 4.8], C.d); // les écailles du dos
    if (C.t) { g.fillStyle = C.t; g.globalAlpha = niv === 3 ? 0.55 + Math.sin(t * 4) * 0.25 : 0.8; [[-8, by - 1.5], [-2, by + 0.5], [5, by - 2], [10, by + 0.5]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], niv === 3 ? 1.5 : 1.3, 0, TAU); g.fill(); }); g.globalAlpha = 1; } // taches de venin, ou runes d'eau
    patte(-6, 0); patte(11, Math.PI);
    // la tête : longue mâchoire qui s'ouvre
    g.save(); g.translate(13, by - 1);
    poly(g, [0, 1, 17, 2.4 + gueule * 0.55, 16, 5 + gueule * 0.55, 0, 5], C.v); // mâchoire du bas
    if (gueule > 1) { poly(g, [1, 1, 15, 1.6 + gueule * 0.3, 1, 3.4], niv === 2 ? '#7a2a90' : '#a83a3a'); for (let i = 0; i < 4; i++) poly(g, [4 + i * 3.2, 2.4 + gueule * 0.5 * (i + 1) / 5, 5 + i * 3.2, 0.2 + gueule * 0.5 * (i + 1) / 5, 6 + i * 3.2, 2.6 + gueule * 0.5 * (i + 1) / 5], '#fff'); }
    g.rotate(-gueule * 0.045);
    g.fillStyle = C.c; g.beginPath(); g.moveTo(-1, -4.4); g.quadraticCurveTo(4, -6.4, 7, -3); g.lineTo(17, -1.6); g.quadraticCurveTo(19, 0, 17, 1.8); g.lineTo(0, 2); g.closePath(); g.fill(); // mâchoire du haut
    for (let i = 0; i < 4; i++) poly(g, [5 + i * 3.2, 1.6, 6 + i * 3.2, 3.8, 7 + i * 3.2, 1.6], '#fff');
    ell(g, 3.6, -4.2, 2.6, 2.2, C.d); ell(g, 4, -4.4, 1.5, 1.2, C.o); g.fillStyle = '#0c1408'; g.fillRect(3.7, -5.4, 0.7, 2); ell(g, 16.4, -1.4, 0.9, 0.7, '#0c1408');
    if (niv === 3) { poly(g, [-1, -5, 0.5, -10.5, 2.6, -5.6], C.o); poly(g, [-3.6, -4, -3, -8.4, -1, -4.6], C.o); } // la crête du vieux
    g.restore();
    if (niv === 2 && Math.sin(t * 5 + e.seed) > 0.4) ell(g, 27, by + 5 + ((t * 9 + e.seed) % 5), 1, 1.6, '#9be04a'); // il bave du venin
    g.restore();
  }
  function cabane(g, e, t) {
    const hit = e.hit > 0 ? Math.sin(t * 50) * 1.5 : 0, H = 66, bal = Math.sin(t * 1.3 + e.seed) * 0.6;
    ell(g, e.x, e.y + 2, 30, 7, 'rgba(0,0,0,0.22)');
    g.save(); g.translate(e.x + hit, e.y);
    g.strokeStyle = '#4a3420'; g.lineCap = 'round'; g.lineWidth = 3.4; [[-21, -25], [-9, -11], [9, 11], [21, 25]].forEach(q => { g.beginPath(); g.moveTo(q[0] * 0.78, -H); g.lineTo(q[1], 0); g.stroke(); }); // les longues pattes de bois
    g.lineWidth = 1.8; g.strokeStyle = '#5c4228'; g.beginPath(); g.moveTo(-23, -18); g.lineTo(22, -38); g.moveTo(23, -18); g.lineTo(-22, -38); g.stroke(); // les croisillons
    g.strokeStyle = '#6a4c2c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-3, -H); g.lineTo(-5, 0); g.moveTo(4, -H); g.lineTo(5, 0); for (let i = 1; i < 8; i++) { g.moveTo(-3.2 - i * 0.22, -H + i * 8); g.lineTo(4.1 + i * 0.12, -H + i * 8); } g.stroke(); // l'échelle
    g.translate(bal, 0);
    g.fillStyle = '#5c4228'; g.fillRect(-27, -H - 3, 54, 5); // le plancher
    g.fillStyle = '#7a5a34'; g.fillRect(-21, -H - 30, 42, 28); g.strokeStyle = 'rgba(40,24,10,0.35)'; g.lineWidth = 1; g.beginPath(); for (let i = -14; i <= 14; i += 7) { g.moveTo(i, -H - 30); g.lineTo(i, -H - 2); } g.stroke(); // les murs de planches
    g.fillStyle = '#1c1410'; g.fillRect(-7, -H - 22, 14, 11); // la fenêtre de tir
    const f = e.face < 0 ? -1 : 1, tir = e.atkAnim > 0 ? Math.sin(e.atkAnim * Math.PI) : 0; ell(g, f * (1 + tir * 2), -H - 16, 3.6, 3.4, '#6a9a3a'); ell(g, f * (2.6 + tir * 2), -H - 16.6, 0.9, 0.9, '#ffe36b'); // le guetteur, dans l'ombre
    poly(g, [-29, -H - 28, 0, -H - 54, 29, -H - 28], '#8a7a3a'); poly(g, [-29, -H - 28, 0, -H - 54, 0, -H - 28], '#9c8c46'); g.strokeStyle = 'rgba(60,50,20,0.4)'; g.lineWidth = 1; g.beginPath(); for (let i = -22; i <= 22; i += 6) { g.moveTo(i * 0.2, -H - 50); g.lineTo(i, -H - 28); } g.stroke(); // le toit de roseaux
    g.strokeStyle = '#3a2a18'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(24, -H - 2); g.lineTo(24, -H + 9); g.stroke(); ell(g, 24, -H + 11, 2.6, 3, '#c8402a'); // une lanterne
    g.restore();
  }
  const ae0 = Art.enemy; Art.enemy = function (g, e, t) { if (GATOR[e.type]) return gator(g, e, t + (e.seed || 0)); if (e.type === 'pilotis') return cabane(g, e, t); return ae0.apply(this, arguments); };
  if (CG.Armee) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const R = CG.R; if (!R || !R.gators) return; for (const L of R.gators) if (L.st !== 'sorti' && CG.onScreen(L.x, L.y)) push(L.y, 21, L, null); }; }
  // les annonces au sol : le trait du crachat, le cercle du geyser, l'ombre de la roche qui arrive
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    if (R.gators) for (const L of R.gators) { const e = L.e, pr = e && !e.dead && e.prep; if (!pr || !CG.onScreen(e.x, e.y)) continue; const k = 1 - pr.t / pr.max;
      g.save();
      if (pr.k === 'crachat') { g.globalAlpha = 0.25 + k * 0.4; g.strokeStyle = '#9be04a'; g.lineWidth = 9; g.lineCap = 'round'; g.setLineDash([12, 10]); g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(pr.x, pr.y); g.stroke(); }
      else { g.globalAlpha = 0.16 + k * 0.3; g.fillStyle = '#5ab8f0'; g.beginPath(); g.ellipse(pr.x, pr.y, Mg.GEYSER_R, Mg.GEYSER_R * 0.62, 0, 0, TAU); g.fill(); g.globalAlpha = 0.9; g.strokeStyle = '#c8f0ff'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(pr.x, pr.y, Mg.GEYSER_R * k, Mg.GEYSER_R * 0.62 * k, 0, 0, TAU); g.stroke(); }
      g.restore(); }
    for (const s of R.jets || []) if (s.k === 'roche') { const k = s.t / s.dur; g.save(); g.globalAlpha = 0.18 + k * 0.32; g.fillStyle = '#e04a2a'; g.beginPath(); g.ellipse(s.tx, s.ty, Mg.ROCHE_R, Mg.ROCHE_R * 0.62, 0, 0, TAU); g.fill(); g.globalAlpha = 0.85; g.strokeStyle = '#ffd0a0'; g.lineWidth = 2; g.beginPath(); g.ellipse(s.tx, s.ty, Mg.ROCHE_R * k, Mg.ROCHE_R * 0.62 * k, 0, 0, TAU); g.stroke(); g.restore(); }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const s of R.jets || []) {
      if (s.k === 'venin') { ell(g, s.x, s.y, 6, 6, '#9be04a'); ell(g, s.x - 1.5, s.y - 1.5, 2.4, 2.4, '#e0ffb0'); ell(g, s.x - s.vx * 0.03, s.y - s.vy * 0.03, 3.6, 3.6, 'rgba(155,224,74,0.5)'); }
      else { const k = s.t / s.dur, x = s.x0 + (s.tx - s.x0) * k, y = s.y0 + (s.ty - s.y0) * k - Math.sin(k * Math.PI) * 90; g.save(); g.translate(x, y); g.rotate(s.t * 7); poly(g, [-7, -3, -2, -7, 6, -4, 7, 3, 1, 7, -6, 4], '#8a8274'); poly(g, [-7, -3, -2, -7, 6, -4, 0, 0], '#aaa294'); g.restore(); }
    }
    for (const q of R.geysers || []) { const k = q.t / 0.5; g.save(); g.globalAlpha = k * 0.8; g.fillStyle = '#bfeaff'; g.beginPath(); g.moveTo(q.x - 15, q.y); g.quadraticCurveTo(q.x - 9, q.y - 100 * (1.2 - k), q.x, q.y - 124 * (1.2 - k)); g.quadraticCurveTo(q.x + 9, q.y - 100 * (1.2 - k), q.x + 15, q.y); g.closePath(); g.fill(); g.restore(); }
  };
})(window.CG);
