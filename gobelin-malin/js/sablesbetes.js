// Goblin Malin — ceux qui vivent dans les Sables sans fin (sables.js) et dans ses temples (sablestemples.js). Tous sont
// rapides, et chacun a un tour de magie qu'on voit venir (une marque au sol, une ligne) et qu'on peut éviter :
//   derviche des dunes  : il tourne sur lui-même et fonce en ligne droite, lames dehors ;
//   djinn des sables    : il disparaît dans un tourbillon, réapparaît à côté de sa proie et fait éclater un anneau de vent ;
//   mage du soleil      : trois colonnes de lumière tombent du ciel, l'une après l'autre ;
//   chacal de lune      : en meute, très vite ; il s'efface et ressort dans le dos de sa proie ;
//   voleur des sables   : une bombe de fumée, et il frappe par-derrière ;
//   momie               : lente et très solide ; elle maudit le sol sous sa cible, et des scarabées sortent d'elle quand elle tombe ;
//   scarabée volant, frelon d'ambre : des bestioles qui volent par-dessus tout (le frelon tire son dard de loin).
// Et quatre grands gardiens, pour le fond du grand temple : le pharaon d'or, le sphinx de grès, la reine scarabée, le colosse de sable.
// Tout se règle dans CG.SablesBetes.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, B = CG.Boss, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, dist = CG.dist;
  if (!G || !Art) return;
  const Sb = CG.SablesBetes = {
    DERVICHE: { REPOS: [3.2, 4.6], PORTEE: [80, 300], ELAN: 80, LARGE: 44, ATTENTE: 0.6, DMG: 1.3 },
    DJINN: { REPOS: [5, 7], PORTEE: 380, SAUT: [70, 115], ANNEAU: 96, ATTENTE: 0.8, DMG: 1.2 },
    MAGE: { REPOS: [4, 5.5], PORTEE: 330, NB: 3, R: 46, ATTENTE: 0.9, SUITE: 0.32, DMG: 1.1 },
    CHACAL: { REPOS: [4, 6], PORTEE: [60, 270], DOS: 42 },
    VOLEUR: { REPOS: [5, 7], PORTEE: 300, FUMEE: 1, DOS: 40 },
    MOMIE: { REPOS: [6, 8], PORTEE: 290, R: 62, ATTENTE: 1.15, DMG: 0.9, SCARABEES: 2 },
    PHARAON: { SEUILS: [0.66, 0.33] }, REINE: { PONTE: 11, NB: 2, MAX: 6 }, SPHINX: { EBOULIS: 10, NB: 4 }, COLOSSE: { TEMPETE: 12, DUREE: 3, TIRE: 70, PORTEE: 420 }
  };
  Object.assign(CG.ENEMIES, {
    derviche: { nom: 'Derviche des dunes', race: 'humain', hp: 150, dmg: 20, spd: 140, xp: 70, or: 18, cost: 5 },
    djinn: { nom: 'Djinn des sables', race: 'bete', hp: 190, dmg: 22, spd: 125, xp: 95, or: 25, cost: 7, r: 14 },
    mageSoleil: { nom: 'Mage du soleil', race: 'humain', hp: 120, dmg: 24, spd: 95, xp: 85, or: 22, cost: 6, range: 250, magic: true },
    chacalLune: { nom: 'Chacal de lune', race: 'bete', hp: 90, dmg: 16, spd: 170, xp: 45, or: 4, cost: 3, food: 1 },
    voleurSable: { nom: 'Voleur des sables', race: 'humain', hp: 130, dmg: 19, spd: 150, xp: 70, or: 40, cost: 5 },
    roiVoleurs: { nom: 'Roi des voleurs', race: 'humain', hp: 260, dmg: 26, spd: 140, xp: 320, or: 260, cost: 16, r: 16, boss: true, cadence: [3.2, 4.4], zcol: '#b070ff' },
    momie: { nom: 'Momie', race: 'mort', hp: 320, dmg: 26, spd: 62, xp: 110, or: 20, cost: 8, r: 15 },
    scarabeeVolant: { nom: 'Scarabée volant', race: 'bete', hp: 60, dmg: 12, spd: 160, xp: 30, or: 2, cost: 2, r: 10 },
    frelonAmbre: { nom: 'Frelon d\'ambre', race: 'bete', hp: 70, dmg: 14, spd: 130, xp: 40, or: 3, cost: 3, r: 10, range: 220 },
    pharaonOr: { nom: 'Pharaon d\'or', race: 'mort', hp: 400, dmg: 32, spd: 70, xp: 700, or: 300, cost: 30, r: 17, boss: true, cadence: [3.6, 4.8], zcol: '#e8c84a' },
    sphinxGres: { nom: 'Sphinx de grès', race: 'bete', hp: 440, dmg: 36, spd: 96, xp: 700, or: 280, cost: 30, r: 22, boss: true, cadence: [3.6, 5], zcol: '#d8b070' },
    reineScarabee: { nom: 'Reine scarabée', race: 'bete', hp: 380, dmg: 30, spd: 104, xp: 700, or: 260, cost: 30, r: 21, boss: true, cadence: [3.4, 4.6], zcol: '#7ad06a' },
    colosseSable: { nom: 'Colosse de sable', race: 'bete', hp: 480, dmg: 36, spd: 58, xp: 700, or: 300, cost: 30, r: 24, boss: true, cadence: [4, 5.2], zcol: '#e0a050' }
  });
  Sb.GARDIENS = ['pharaonOr', 'sphinxGres', 'reineScarabee', 'colosseSable'];
  Sb.NOMS = { pharaonOr: 'Le pharaon d\'or', sphinxGres: 'Le sphinx de grès', reineScarabee: 'La reine scarabée', colosseSable: 'Le colosse de sable' };
  if (B && B.KIT) Object.assign(B.KIT, { roiVoleurs: ['charge', 'tourbillon'], pharaonOr: ['pluie', 'croix', 'nova'], sphinxGres: ['charge', 'ecrase', 'rocher'], reineScarabee: ['charge', 'souffle', 'tourbillon'], colosseSable: ['ecrase', 'rocher', 'deluge'] });
  if (CG.Spectres && CG.Spectres.FANTOME) { CG.Spectres.FANTOME.scarabeeVolant = 1; CG.Spectres.FANTOME.frelonAmbre = 1; } // ils volent : ni mur ni rocher ne les arrête
  const zones = () => CG.R.zones || (CG.R.zones = []);
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.retreat || e.calm || e.rooted > 0;
  const cible = e => { const t = e.target; return t && !t.dead && !t.hidden && t.x !== undefined ? t : null; };
  const pret = (e, dt, R0) => { e.sbCd = (e.sbCd === undefined ? rand(1.2, 2.6) : e.sbCd) - dt; if (e.sbCd > 0) return false; e.sbCd = 0.5; return true; }; /* 0,5 s avant de réessayer si le tour ne part pas */
  const repos = (e, Q) => { e.sbCd = rand(Q.REPOS[0], Q.REPOS[1]); };
  const dos = (tg, de, d) => { const f = tg.face < 0 ? -1 : 1; for (const q of [[-f * d, 0], [f * d, 0], [0, d], [0, -d]]) { const x = tg.x + q[0], y = tg.y + q[1]; if (W.walkPx(x, y)) return { x, y }; } return null; };
  function petit(type, x, y, de) { const e = G.spawnEnemy(type, x, y, { wild: true, exact: true }); if (!e) return null; e.calm = false; e.aggroR = 900; e.leash = 2000; if (de && de.arene) { e.arene = true; e.etage = de.etage; } e.target = de ? de.target : null; G.puff(x, y - 14, '#e0c080', 12, 100, 3); return e; }
  Sb.petit = petit;
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S || !R.enemies) return r;
    for (const e of R.enemies) {
      const ty = e.type; if (e.sbT > 0) e.sbT -= dt; if (e.spinT > 0) e.spinT -= dt;
      if (e.dead) { if (ty === 'momie' && !e.sbVide) { e.sbVide = true; for (let i = 0; i < Sb.MOMIE.SCARABEES; i++) petit('scarabeeVolant', e.x + rand(-18, 18), e.y + rand(-10, 10), e); } continue; }
      if (ty === 'derviche') { const Q = Sb.DERVICHE, tg = cible(e); if (pris(e) || !tg || !pret(e, dt)) continue; const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < Q.PORTEE[0] || d > Q.PORTEE[1] || !W.lineClear(e.x, e.y, tg.x, tg.y)) continue;
        const L = d + Q.ELAN; zones().push({ k: 'ligne', by: e, col: '#ffe0a0', x: e.x, y: e.y, x2: e.x + dx / d * L, y2: e.y + dy / d * L, w: Q.LARGE, t: Q.ATTENTE, max: Q.ATTENTE, dmg: e.dmg * Q.DMG }); e.rooted = Math.max(e.rooted || 0, Q.ATTENTE + 0.1); e.atkCd = Math.max(e.atkCd || 0, Q.ATTENTE + 0.3); e.path = null; e.spinT = Q.ATTENTE + 0.45; e.face = dx > 0 ? 1 : -1; repos(e, Q); }
      else if (ty === 'djinn') { const Q = Sb.DJINN, tg = cible(e); if (pris(e) || !tg || !pret(e, dt) || dist(e, tg) > Q.PORTEE) continue; let q = null;
        for (let k = 0; k < 12 && !q; k++) { const a = Math.random() * TAU, d = rand(Q.SAUT[0], Q.SAUT[1]), x = tg.x + Math.cos(a) * d, y = tg.y + Math.sin(a) * d * 0.8; if (W.walkPx(x, y)) q = { x, y }; } if (!q) continue;
        G.puff(e.x, e.y - 20, '#7ad0e8', 18, 130, 4); e.x = q.x; e.y = q.y; e.path = null; G.puff(e.x, e.y - 20, '#e0c080', 18, 130, 4); e.sbT = 0.5; e.face = tg.x > e.x ? 1 : -1; if (CG.onScreen(e.x, e.y)) CG.sfx('spell');
        zones().push({ k: 'cercle', by: e, col: '#7ad0e8', x: e.x, y: e.y, r: Q.ANNEAU, t: Q.ATTENTE, max: Q.ATTENTE, dmg: e.dmg * Q.DMG, self: true }); e.rooted = Math.max(e.rooted || 0, Q.ATTENTE + 0.1); e.atkCd = Math.max(e.atkCd || 0, Q.ATTENTE + 0.2); repos(e, Q); }
      else if (ty === 'mageSoleil') { const Q = Sb.MAGE, tg = cible(e); if (pris(e) || !tg || !pret(e, dt) || dist(e, tg) > Q.PORTEE) continue;
        for (let i = 0; i < Q.NB; i++) { const a = Math.random() * TAU, d = i ? rand(40, 95) : 0, t = Q.ATTENTE + i * Q.SUITE; zones().push({ k: 'cercle', by: e, col: '#ffd23a', x: tg.x + Math.cos(a) * d, y: tg.y + Math.sin(a) * d * 0.8, r: Q.R, t, max: t, dmg: e.dmg * Q.DMG, roc: 'feu' }); }
        e.atkAnim = 1; e.rooted = Math.max(e.rooted || 0, 0.7); e.face = tg.x > e.x ? 1 : -1; G.text(e.x, e.y - 70, '☀️', '#ffe36b', true); if (CG.onScreen(e.x, e.y)) CG.sfx('warning'); repos(e, Q); }
      else if (ty === 'chacalLune') { const Q = Sb.CHACAL, tg = cible(e); if (pris(e) || !tg || !pret(e, dt)) continue; const d = dist(e, tg); if (d < Q.PORTEE[0] || d > Q.PORTEE[1]) continue; const q = dos(tg, e, Q.DOS); if (!q) continue;
        G.puff(e.x, e.y - 12, '#b8d0ff', 12, 100, 3); e.x = q.x; e.y = q.y; e.path = null; e.sbT = 0.45; e.atkCd = 0.25; e.face = tg.x > e.x ? 1 : -1; G.puff(e.x, e.y - 12, '#b8d0ff', 10, 90, 3); repos(e, Q); }
      else if (ty === 'voleurSable' || ty === 'roiVoleurs') { const Q = Sb.VOLEUR, tg = cible(e);
        if (e.fumee > 0) { e.fumee -= dt; e.rooted = Math.max(e.rooted || 0, 0.1); if (e.fumee <= 0) { const q = tg ? dos(tg, e, Q.DOS) : null; if (q) { e.x = q.x; e.y = q.y; e.path = null; e.face = tg.x > e.x ? 1 : -1; } e.atkCd = 0.2; e.sbT = 0.3; G.puff(e.x, e.y - 18, '#5a5068', 16, 120, 4); } continue; }
        if (pris(e) || !tg || !pret(e, dt) || dist(e, tg) > Q.PORTEE) continue; e.fumee = Q.FUMEE; e.path = null; G.puff(e.x, e.y - 18, '#5a5068', 26, 150, 5); G.puff(e.x, e.y - 18, '#8a80a0', 12, 90, 4); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); repos(e, Q); }
      else if (ty === 'momie') { const Q = Sb.MOMIE, tg = cible(e); if (pris(e) || !tg || !pret(e, dt) || dist(e, tg) > Q.PORTEE) continue;
        zones().push({ k: 'cercle', by: e, col: '#7ad06a', x: tg.x, y: tg.y, r: Q.R, t: Q.ATTENTE, max: Q.ATTENTE, dmg: e.dmg * Q.DMG }); e.atkAnim = 1; e.rooted = Math.max(e.rooted || 0, 0.6); G.text(e.x, e.y - 76, '☠️', '#b8ffb0', true); repos(e, Q); }
      else if (ty === 'pharaonOr') { const Q = Sb.PHARAON; e.sbN = e.sbN || 0; if (e.sbN < Q.SEUILS.length && e.hp < e.maxhp * Q.SEUILS[e.sbN]) { e.sbN++; petit('momie', e.x - 70, e.y + 30, e); petit('scarabeeVolant', e.x + 60, e.y - 20, e); petit('scarabeeVolant', e.x + 70, e.y + 40, e); G.text(e.x, e.y - 110, 'Levez-vous, mes serviteurs !', '#ffe36b', true); CG.sfx('warning'); } }
      else if (ty === 'reineScarabee') { const Q = Sb.REINE; if (!cible(e)) continue; e.sbP = (e.sbP === undefined ? 5 : e.sbP) - dt; if (e.sbP > 0) continue; e.sbP = Q.PONTE; if (R.enemies.filter(o => !o.dead && o.type === 'scarabeeVolant').length >= Q.MAX) continue; for (let i = 0; i < Q.NB; i++) petit('scarabeeVolant', e.x + rand(-40, 40), e.y + rand(-30, 30), e); G.text(e.x, e.y - 100, 'Ses petits éclosent !', '#b8ffb0', true); }
      else if (ty === 'sphinxGres') { const Q = Sb.SPHINX, tg = cible(e); if (!tg || pris(e)) continue; e.sbP = (e.sbP === undefined ? 6 : e.sbP) - dt; if (e.sbP > 0) continue; e.sbP = Q.EBOULIS;
        for (let i = 0; i < Q.NB; i++) { const a = i / Q.NB * TAU + Math.random(), d = i ? rand(60, 140) : 0, t = 1.2 + i * 0.3; zones().push({ k: 'cercle', by: e, col: '#d8b070', x: tg.x + Math.cos(a) * d, y: tg.y + Math.sin(a) * d * 0.8, r: 60, t, max: t, dmg: e.dmg * 1.4, roc: true }); } G.text(e.x, e.y - 110, '⚠ Le plafond s\'effondre !', '#ffd0a0', true); CG.sfx('warning'); }
      else if (ty === 'colosseSable') { const Q = Sb.COLOSSE, p = S.player; e.sbP = (e.sbP === undefined ? 7 : e.sbP) - dt;
        if (e.tempete > 0) { e.tempete -= dt; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (!(R.ko > 0) && d > 60 && d < Q.PORTEE) G.slide(p, dx / d * Q.TIRE * dt, dy / d * Q.TIRE * dt, 9);
          if (Math.random() < dt * 40) { const a = Math.random() * TAU, k = rand(120, Q.PORTEE); R.parts.push({ x: e.x + Math.cos(a) * k, y: e.y + Math.sin(a) * k * 0.7, vx: -Math.cos(a) * 240, vy: -Math.sin(a) * 170, life: 0.5, max: 0.5, col: '#e8c890', size: rand(2, 4.5), float: true }); } }
        else if (e.sbP <= 0 && cible(e) && !pris(e)) { e.sbP = Q.TEMPETE; e.tempete = Q.DUREE; G.text(e.x, e.y - 120, '⚠ Tempête de sable !', '#ffe0a0', true); CG.sfx('warning'); } }
    }
    return r;
  };
  // un voleur dans sa fumée : personne ne le vise (même tour que le spectre transparent)
  { let enJeu = 0; const u1 = G.update; G.update = function () { enJeu++; try { return u1.apply(this, arguments); } finally { enJeu--; } };
    const se0 = G.spawnEnemy; G.spawnEnemy = function (type) { const e = se0.apply(this, arguments); if (e && (type === 'voleurSable' || type === 'roiVoleurs')) { let c = !!e.calm; Object.defineProperty(e, 'calm', { configurable: true, enumerable: true, get: () => c || (enJeu > 0 && e.fumee > 0 && !e.dead && !W.foe), set: v => { c = !!v; } }); } return e; }; }

  // ---------- les dessins (des aplats, pas de contour) ----------
  const el = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fill(); };
  const po = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const li = (g, x1, y1, x2, y2, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const base = (e, t) => ({ x: e.x, y: e.y, face: e.face, t: t + (e.seed || 0), moving: e.moving, step: e.step, atk: e.atkAnim, angry: !e.calm });
  const HUM = {
    derviche: { skin: '#c89068', tunic: '#f4efe0', legs: '#c8322a', sleeve: '#f4efe0', hood: true, weapon: 'epee', s: 1.02 },
    mageSoleil: { skin: '#e0b088', tunic: '#e8c040', legs: '#b8862a', sleeve: '#fff0b0', hat: true, hatCol: '#f4f0e0', weapon: 'baton', glow: '#ffe36b', beard: '#f4f0e0', s: 1.02 },
    voleurSable: { skin: '#c89068', tunic: '#2e2a44', legs: '#201c30', sleeve: '#2e2a44', hood: true, weapon: 'epee', s: 0.98 },
    roiVoleurs: { skin: '#c89068', tunic: '#4a2a6a', legs: '#201c30', sleeve: '#4a2a6a', hood: true, weapon: 'epee', cape: '#b02a3a', s: 1.3 },
    momie: { skin: '#d8d0b0', tunic: '#cfc6a2', legs: '#c8be98', sleeve: '#d8d0b0', eye: '#7dffea', s: 1.22 },
    pharaonOr: { skin: '#d8d0b0', tunic: '#e8c84a', legs: '#cfc6a2', sleeve: '#d8d0b0', eye: '#7dffea', weapon: 'baton', glow: '#7dffea', cape: '#2f6ac0', s: 1.34 }
  };
  function turban(g, e, s, c1, c2) { const f = e.face < 0 ? -1 : 1, y = e.y - 42 * s; el(g, e.x, y, 9 * s, 5.5 * s, c1); el(g, e.x - f * 2 * s, y - 2.5 * s, 6.5 * s, 3.6 * s, c2); el(g, e.x + f * 4 * s, y - 1 * s, 1.8 * s, 1.8 * s, '#e8c84a'); }
  function bandes(g, e, s) { g.strokeStyle = 'rgba(120,104,70,0.6)'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 6; i++) { const y = e.y - 8 * s - i * 6 * s, k = i % 2 ? 1 : -1; g.moveTo(e.x - 8 * s, y + k * 1.5); g.lineTo(e.x + 8 * s, y - k * 1.5); } g.stroke(); li(g, e.x - (e.face < 0 ? -1 : 1) * 6 * s, e.y - 22 * s, e.x - (e.face < 0 ? -1 : 1) * 13 * s, e.y - 12 * s + Math.sin((e.step || 0) * 4) * 2, '#d8d0b0', 2); }
  function nemes(g, e, s) { const x = e.x, y = e.y - 40 * s; po(g, [x - 11 * s, y + 13 * s, x - 9 * s, y - 6 * s, x, y - 10 * s, x + 9 * s, y - 6 * s, x + 11 * s, y + 13 * s, x + 6 * s, y + 2 * s, x - 6 * s, y + 2 * s], '#e8c84a'); g.fillStyle = '#2f6ac0'; for (let i = 0; i < 3; i++) { g.fillRect(x - 10.5 * s, y - 1 * s + i * 4.4 * s, 3.4 * s, 1.8 * s); g.fillRect(x + 7.1 * s, y - 1 * s + i * 4.4 * s, 3.4 * s, 1.8 * s); } el(g, x, y - 9 * s, 2 * s, 3 * s, '#d8264a'); }
  function djinn(g, e, t) { const f = e.face < 0 ? -1 : 1, x = e.x, s = 1.1, fl = Math.sin(t * 3) * 3, y = e.y - 10 + fl, a = e.atkAnim > 0 ? e.atkAnim : 0;
    el(g, x, e.y + 2, 12, 4, 'rgba(0,0,0,0.18)');
    g.fillStyle = '#3aa0c8'; g.beginPath(); g.moveTo(x - 9 * s, y - 14 * s); g.quadraticCurveTo(x - 12 * s, y, x - 2 * s + Math.sin(t * 5) * 3, y + 4 * s); g.quadraticCurveTo(x + 4 * s + Math.sin(t * 4) * 4, y + 12 * s, x + Math.sin(t * 6) * 3, y + 16 * s); g.quadraticCurveTo(x + 13 * s, y, x + 9 * s, y - 14 * s); g.closePath(); g.fill(); /* la traîne de fumée */
    el(g, x, y - 22 * s, 10 * s, 11 * s, '#4ab8e0'); el(g, x - 3 * s, y - 25 * s, 5 * s, 6 * s, 'rgba(255,255,255,0.16)'); po(g, [x - 10 * s, y - 14 * s, x + 10 * s, y - 14 * s, x + 7 * s, y - 10 * s, x - 7 * s, y - 10 * s], '#e8c84a'); /* le torse, la ceinture d'or */
    [-1, 1].forEach(k => { const hx = x + k * 13 * s + f * a * 8, hy = y - 22 * s - a * 10 * (k === f ? 1 : 0.3); li(g, x + k * 9 * s, y - 27 * s, hx, hy, '#4ab8e0', 4.6 * s); el(g, hx, hy, 2.8 * s, 2.8 * s, '#e8c84a'); });
    el(g, x + f * 1.5, y - 39 * s, 7.5 * s, 7.5 * s, '#4ab8e0'); po(g, [x - 3 * s, y - 45 * s, x + 3 * s, y - 45 * s, x - f * 3 * s, y - 56 * s], '#1c2a50'); el(g, x - f * 3 * s, y - 56 * s, 2 * s, 2 * s, '#e8c84a'); /* la tête, le toupet */
    [-1, 1].forEach(k => el(g, x + f * 3 * s + k * 2.8 * s, y - 40 * s, 1.5 * s, 2 * s, '#fff6c8')); po(g, [x + f * 1 * s, y - 34 * s, x + f * 7 * s, y - 34 * s, x + f * 4 * s, y - 29 * s], '#1c2a50'); }
  function chacal(g, e, t) { const f = e.face < 0 ? -1 : 1, x = e.x, y = e.y, st = Math.sin((e.step || 0) * 9) * (e.moving ? 5 : 0), a = e.atkAnim > 0 ? e.atkAnim : 0, c1 = '#8a96c0', c2 = '#5a648c';
    el(g, x, y + 1, 15, 4, 'rgba(0,0,0,0.2)'); el(g, x, y - 12, 20, 16, 'rgba(160,190,255,0.12)');
    [[-8, st], [-4, -st], [6, -st], [10, st]].forEach(q => li(g, x + f * q[0], y - 9, x + f * (q[0] + q[1] * 0.5), y, c2, 2.6));
    el(g, x, y - 13, 13, 6, c1); li(g, x - f * 12, y - 14, x - f * 22, y - 20 + Math.sin(t * 6) * 2, c2, 3.4); /* le corps, la queue */
    const hx = x + f * (13 + a * 6), hy = y - 20; el(g, hx, hy, 6.5, 5.5, c1); po(g, [hx + f * 4, hy - 2, hx + f * 13, hy + 1, hx + f * 4, hy + 3.5], c1); el(g, hx + f * 12.5, hy + 0.8, 1.4, 1.4, '#1c1c2c'); /* la tête, le museau */
    [-1, 1].forEach(k => po(g, [hx - f * 1 + k * 3, hy - 4, hx - f * 2 + k * 4.5, hy - 15, hx + f * 2 + k * 3, hy - 5], c2)); el(g, hx + f * 3, hy - 1.5, 1.6, 1.6, '#eaf2ff'); }
  function scarabee(g, e, t, gros) { const s = gros ? 2.3 : 1, x = e.x, y = e.y - (gros ? 14 : 26 + Math.sin(t * 5) * 3), f = e.face < 0 ? -1 : 1, bat = Math.sin(t * 40);
    el(g, x, e.y + 1, 10 * s, 3.4 * s, 'rgba(0,0,0,' + (gros ? 0.28 : 0.16) + ')');
    if (gros) for (let i = 0; i < 3; i++) [-1, 1].forEach(k => li(g, x + k * 7 * s, y - 2 * s + i * 2, x + k * (13 + i * 1.5) * s, y + 6 * s + Math.sin(t * 9 + i + k) * (e.moving ? 2 : 0), '#16242c', 1.5 * s));
    else [-1, 1].forEach(k => el(g, x + k * 9 * s, y - 5 * s, 9 * s, (2 + Math.abs(bat) * 3.5) * s, 'rgba(220,240,255,0.5)', k * (0.5 + bat * 0.3)));
    el(g, x, y, 9 * s, 7 * s, '#1c5a56'); el(g, x - 2 * s, y - 2 * s, 5.5 * s, 3.8 * s, '#3aa894'); li(g, x, y - 6.5 * s, x, y + 6.5 * s, '#0e3432', 1.1 * s); el(g, x - 3.5 * s, y - 3 * s, 1.6 * s, 2.4 * s, 'rgba(255,240,170,0.7)'); /* la carapace, son reflet d'or */
    el(g, x + f * 9 * s, y, 4 * s, 3.6 * s, '#16242c'); [-1, 1].forEach(k => li(g, x + f * 11 * s, y + k * 1.6 * s, x + f * 15.5 * s, y + k * 3.4 * s - (e.atkAnim > 0 ? k * 2 : 0), '#e8c84a', 1.5 * s));
    if (gros) { po(g, [x - 6 * s, y - 7 * s, x - 6.5 * s, y - 12 * s, x - 3 * s, y - 9 * s, x, y - 13 * s, x + 3 * s, y - 9 * s, x + 6.5 * s, y - 12 * s, x + 6 * s, y - 7 * s], '#e8c84a'); el(g, x, y - 8.4 * s, 1.1 * s, 1.1 * s, '#d8264a'); } }
  function frelon(g, e, t) { const x = e.x, y = e.y - 30 + Math.sin(t * 6) * 3, f = e.face < 0 ? -1 : 1, bat = Math.sin(t * 46);
    el(g, x, e.y + 1, 9, 3, 'rgba(0,0,0,0.16)'); [-1, 1].forEach(k => el(g, x - f * 1 + k * 7, y - 6, 8, 2 + Math.abs(bat) * 3, 'rgba(230,240,255,0.5)', k * (0.5 + bat * 0.3)));
    el(g, x - f * 6, y + 1, 8, 5.5, '#e8a020'); g.fillStyle = '#2a1c10'; [-9, -5, -1].forEach(q => g.fillRect(x + f * q - 1, y - 4.2, 2, 8.4)); po(g, [x - f * 13, y - 1, x - f * 20, y + 3 + (e.atkAnim > 0 ? 3 : 0), x - f * 13, y + 3], '#2a1c10'); /* le ventre rayé, le dard */
    el(g, x + f * 3, y - 1, 5, 4.6, '#c87818'); el(g, x + f * 9, y - 1, 4, 3.8, '#2a1c10'); el(g, x + f * 10.5, y - 2, 1.4, 1.6, '#ff5a3a'); }
  function sphinx(g, e, t) { const f = e.face < 0 ? -1 : 1, x = e.x, y = e.y, st = Math.sin((e.step || 0) * 7) * (e.moving ? 4 : 0), a = e.atkAnim > 0 ? e.atkAnim : 0, c1 = '#d8b070', c2 = '#b08a4a', c3 = '#8a6a34';
    el(g, x, y + 2, 30, 8, 'rgba(0,0,0,0.28)');
    [[-18, st], [-11, -st], [10, -st], [17, st]].forEach(q => { li(g, x + f * q[0], y - 16, x + f * (q[0] + q[1] * 0.4), y - 1, c2, 7); el(g, x + f * (q[0] + q[1] * 0.4 + 2), y, 5, 3, c3); });
    el(g, x - f * 2, y - 24, 24, 12, c1); el(g, x - f * 6, y - 28, 14, 5, 'rgba(255,240,200,0.25)'); li(g, x - f * 24, y - 26, x - f * 34, y - 38 + Math.sin(t * 3) * 3, c2, 4); el(g, x - f * 34, y - 39 + Math.sin(t * 3) * 3, 3.4, 3.4, c3); /* le corps de lion, la queue */
    [-1, 1].forEach(k => po(g, [x - f * 4, y - 32, x - f * (14 + k * 4), y - 52 - k * 3 + Math.sin(t * 2 + k) * 2, x - f * 20, y - 30], 'rgba(200,170,110,0.75)')); /* deux ailes de pierre */
    const hx = x + f * (18 + a * 5), hy = y - 42; po(g, [hx - 12, hy + 16, hx - 10, hy - 8, hx, hy - 13, hx + 10, hy - 8, hx + 12, hy + 16, hx + 7, hy + 4, hx - 7, hy + 4], '#e8c84a'); g.fillStyle = '#2f6ac0'; for (let i = 0; i < 3; i++) { g.fillRect(hx - 11.5, hy - 2 + i * 5, 4, 2); g.fillRect(hx + 7.5, hy - 2 + i * 5, 4, 2); }
    el(g, hx, hy, 8, 9, c1); [-1, 1].forEach(k => el(g, hx + f * 1.5 + k * 3.2, hy - 1.5, 1.7, 2, '#7dffea')); g.fillStyle = c3; g.fillRect(hx - 3 + f * 1.5, hy + 4, 6, 1.5); po(g, [hx - 2.4, hy + 8, hx + 2.4, hy + 8, hx + 1.6, hy + 15, hx - 1.6, hy + 15], '#2f6ac0'); }
  function colosse(g, e, t) { const f = e.face < 0 ? -1 : 1, x = e.x, y = e.y, a = e.atkAnim > 0 ? e.atkAnim : 0, bob = Math.sin(t * 2) * 1.5, c1 = '#d8b070', c2 = '#b88a4a', c3 = '#8a6430';
    el(g, x, y + 2, 28, 8, 'rgba(0,0,0,0.3)'); if (e.tempete > 0) for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(240,210,150,' + (0.35 - i * 0.08) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y - 30, 40 + i * 22, 14 + i * 7, 0, t * 5 + i, t * 5 + i + 4); g.stroke(); }
    [-1, 1].forEach(k => { el(g, x + k * 10, y - 6, 8, 8, c2); el(g, x + k * 10, y - 1, 9, 4, c3); }); /* deux jambes de blocs */
    el(g, x, y - 30 + bob, 20, 19, c1); el(g, x - 5, y - 36 + bob, 9, 8, 'rgba(255,240,200,0.25)'); g.strokeStyle = c3; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 10, y - 24 + bob); g.lineTo(x - 2, y - 30 + bob); g.lineTo(x - 6, y - 40 + bob); g.moveTo(x + 6, y - 20 + bob); g.lineTo(x + 12, y - 30 + bob); g.stroke(); /* le torse fissuré */
    [-1, 1].forEach(k => { const up = k === f ? a * 26 : 0, hx = x + k * 27, hy = y - 22 + bob - up; li(g, x + k * 17, y - 38 + bob, hx, hy, c2, 9); el(g, hx, hy + 3, 9, 9, c1); el(g, hx - 2, hy, 4, 3.5, 'rgba(255,240,200,0.3)'); });
    el(g, x + f * 2, y - 54 + bob, 10, 9, c2); [-1, 1].forEach(k => el(g, x + f * 4 + k * 3.6, y - 55 + bob, 2, 2.4, '#ffe36b')); g.fillStyle = c3; g.fillRect(x + f * 4 - 4, y - 50 + bob, 8, 2);
    if (Math.random() < 0.3) CG.R.parts.push({ x: x + rand(-18, 18), y: y - rand(4, 50), vx: rand(-10, 10), vy: rand(20, 50), life: 0.5, max: 0.5, col: '#e8c890', size: rand(1.5, 3) }); }
  const DESSIN = { djinn, chacalLune: chacal, scarabeeVolant: (g, e, t) => scarabee(g, e, t, false), reineScarabee: (g, e, t) => scarabee(g, e, t, true), frelonAmbre: frelon, sphinxGres: sphinx, colosseSable: colosse };
  const ae0 = Art.enemy; Art.enemy = function (g, e, t) {
    const H = HUM[e.type], Dz = DESSIN[e.type]; if (!H && !Dz) return ae0.apply(this, arguments);
    const k = e.grosArene ? 1.4 : 1, tt = t + (e.seed || 0), al = g.globalAlpha; g.save();
    if (e.fumee > 0) g.globalAlpha = al * 0.12; else if (e.sbT > 0) g.globalAlpha = al * (1 - e.sbT);
    if (k !== 1) { g.translate(e.x, e.y); g.scale(k, k); g.translate(-e.x, -e.y); }
    if (e.spinT > 0) { const c = Math.cos(tt * 26); g.translate(e.x, e.y); g.scale(Math.abs(c) < 0.25 ? 0.25 * (c < 0 ? -1 : 1) : c, 1); g.translate(-e.x, -e.y); for (let i = 0; i < 2; i++) { g.strokeStyle = 'rgba(255,240,200,' + (0.5 - i * 0.2) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(e.x, e.y - 22, 22 + i * 8, 6 + i * 2, 0, tt * 9 + i * 2, tt * 9 + i * 2 + 4); g.stroke(); } }
    try {
      if (Dz) Dz(g, e, tt);
      else { Art.humanoid(g, Object.assign(base(e, t), H)); const s = H.s || 1;
        if (e.type === 'derviche') turban(g, e, s, '#f4efe0', '#c8322a'); else if (e.type === 'voleurSable') { el(g, e.x + (e.face < 0 ? -1 : 1) * 2, e.y - 33 * s, 6 * s, 3.2 * s, '#2e2a44'); } /* un foulard sur le nez */
        else if (e.type === 'roiVoleurs') { turban(g, e, s, '#4a2a6a', '#e8c84a'); el(g, e.x + (e.face < 0 ? -1 : 1) * 2, e.y - 33 * s, 6 * s, 3.2 * s, '#2e2a44'); }
        else if (e.type === 'momie') bandes(g, e, s); else if (e.type === 'pharaonOr') { bandes(g, e, s); nemes(g, e, s); } }
    } finally { g.restore(); }
  };
  Sb.essai = k => { const p = CG.S.player, e = G.spawnEnemy(k, p.x + 110, p.y, { wild: true, exact: true }); if (e) { e.calm = false; e.aggroR = 900; e.leash = 2000; } return e; }; // pour les essais
})(window.CG);
