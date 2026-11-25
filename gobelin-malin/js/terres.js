// Goblin Malin — les forêts voisines. Les trois chemins qui sortent de la forêt mènent à trois autres forêts (à partir du niveau 10) :
// à l'ouest, au sud et à l'est. Ce sont des forêts ordinaires, comme celle du départ, mais leurs sentiers ne mènent nulle part :
// ils s'arrêtent dans des clairières, et seul le côté par où l'on arrive touche le bord de la carte.
// Les bêtes y sont plus fortes que chez nous. Pendant que le chef est là-bas, son village attend, mais l'heure tourne :
// à minuit, il est ramené dans sa hutte pour dormir.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, T = CG.TILE, Mo = CG.Mondes;
  const rand = CG.rand;
  if (!Mo) return;
  // FORCE : vie et dégâts des bêtes de là-bas, par rapport aux mêmes bêtes chez nous ; MEUTES : en plus de celles des clairières
  // PART : pendant l'absence du chef, le clan récolte cette part de son rythme habituel
  const Te = CG.Terres = { NIV: 10, FORCE: 1.5, MEUTES: 13, TARD: 23.5, PART: 0.5 };
  const RES = ['food', 'bois', 'minerai', 'cuir'], IC = { food: '🍖', bois: '🪵', minerai: '🪨', cuir: '🟤' };
  ['foret', 'terre'].forEach(k => { if (!Mo.GLOBAL.includes(k)) Mo.GLOBAL.push(k); });
  Te.L = {
    3: { par: 'ouest', titre: 'La forêt de l\'ouest', col: '#c8e8b0' },
    4: { par: 'sud', titre: 'La forêt du sud', col: '#c8e8b0' },
    5: { par: 'est', titre: 'La forêt de l\'est', col: '#c8e8b0' },
    6: { par: 'sud', titre: 'Les Sables sans fin', col: '#ffe0a0', sous: 'Rien que du sable, à perte de vue. Tout ce qui vit ici est rapide, rusé et dangereux.' } /* le grand désert, tout au sud : on y entre par le bas de la forêt du sud (sables.js) */
  };
  Te.DERNIER = 6;
  const PAR = { ouest: 3, sud: 4, est: 5 }, SOUS = 'Les sentiers d\'ici ne mènent nulle part, et les bêtes sont plus coriaces que chez toi.';
  // par où l'on arrive : en face de la sortie qu'on a prise ([case d'arrivée], [bout du sentier, sur le bord])
  const arrivee = m => m === 6 ? { x: 49, y: 2, bx: 49, by: 0 } : m === 3 ? { x: CG.MW - 3, y: 35, bx: CG.MW - 1, by: 35 } : m === 4 ? { x: 49, y: 2, bx: 49, by: 0 } : { x: 2, y: 33, bx: 0, by: 33 };
  Te.ici = () => { const m = Mo.ici(); return m >= 3 && m <= Te.DERNIER ? m : 0; };
  Te.arrivee = arrivee;
  let plan = null; Te.plan = () => plan;
  const etat = () => { const S = CG.S; return S.terre || (S.terre = {}); };
  // ce qu'on a déjà tué et ouvert là-bas aujourd'hui : on ne le retrouve pas en revenant le même jour
  const jour = m => { const E = etat(), S = CG.S; if (!E.jour || E.jour.day !== S.day) E.jour = { day: S.day }; return E.jour[m] || (E.jour[m] = { morts: {}, coffres: {} }); };

  // le rythme du clan : ce qu'il a récolté aujourd'hui, par heure de travail (de 6 h à 19 h). Trop tôt pour le savoir : on garde le dernier rythme connu.
  function rythme() { const S = CG.S, R = CG.R, E = etat(), st = R.dayStats || {}, dur = Math.min(S.hour, 19) - (R.terreH0 || 6); if (dur >= 2) { E.rythme = {}; RES.forEach(k => { E.rythme[k] = Math.max(0, st[k] || 0) / dur; }); } return E.rythme || null; }

  // ---------- les cartes ----------
  function generer(m, seed) {
    const tile = W.tile, I = W.idx, MW = CG.MW, MH = CG.MH, noise = W.noise, rng = CG.makeRng(seed + m * 101), A = arrivee(m);
    const dedans = (x, y) => x >= 1 && y >= 1 && x < MW - 1 && y < MH - 1, set = (x, y, t) => { if (dedans(x, y)) tile[I(x, y)] = t; };
    const ox = m * 11.7, oy = m * 5.3; // le bruit est décalé : sinon les bois auraient la même forme que chez nous
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const bord = x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2, d = noise(x / 8 + ox, y / 8 + oy) * 0.7 + noise(x / 3 + 40 + ox, y / 3 + 40 + oy) * 0.3;
      tile[I(x, y)] = rng() < (bord ? 0.96 : d > 0.56 ? 0.86 : d > 0.42 ? 0.3 : 0.05) ? W.TREE : W.GRASS;
    }
    const clairiere = g => { for (let y = -g.r - 1; y <= g.r + 1; y++) for (let x = -g.r - 1; x <= g.r + 1; x++) if (Math.hypot(x, y) < g.r - 0.6 + rng() * 1.2) set(g.x + x, g.y + y, W.GRASS); };
    const pave = (x, y) => { for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (W.inMap(x + dx, y + dy)) tile[I(x + dx, y + dy)] = W.PATH; };
    const sentier = (a, b, wob) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2), ph = rng() * 6, px = -(b.y - a.y), py = b.x - a.x, pl = Math.hypot(px, py) || 1;
      for (let i = 0; i <= n; i++) { const k = i / n, s = Math.sin(k * Math.PI) * Math.sin(k * 7 + ph) * wob; pave(Math.round(a.x + (b.x - a.x) * k + px / pl * s), Math.round(a.y + (b.y - a.y) * k + py / pl * s)); } };
    // un carrefour vers le milieu, puis des clairières où les sentiers s'arrêtent : aucune à moins de 10 cases d'un bord
    const hub = { x: 36 + Math.floor(rng() * 24), y: 25 + Math.floor(rng() * 22), r: 4 }, L = [];
    for (let k = 0; k < 600 && L.length < 7; k++) { const g = { x: 11 + Math.floor(rng() * (MW - 22)), y: 11 + Math.floor(rng() * (MH - 22)), r: 3 + Math.floor(rng() * 2) };
      if (Math.hypot(g.x - hub.x, g.y - hub.y) < 15 || Math.hypot(g.x - A.x, g.y - A.y) < 18 || L.some(o => Math.hypot(o.x - g.x, o.y - g.y) < 16)) continue; L.push(g); }
    clairiere(hub); L.forEach(clairiere);
    sentier({ x: A.bx, y: A.by }, hub, 2.6);
    const relies = [hub]; L.slice().sort((a, b) => Math.hypot(a.x - hub.x, a.y - hub.y) - Math.hypot(b.x - hub.x, b.y - hub.y)).forEach(g => { // chacune se branche sur la plus proche déjà reliée : ça fait des embranchements
      let pr = hub, bd = 1e9; relies.forEach(o => { const d = Math.hypot(o.x - g.x, o.y - g.y); if (d < bd) { bd = d; pr = o; } }); sentier(pr, g, 2); relies.push(g); });
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (W.inMap(A.x + dx, A.y + dy)) tile[I(A.x + dx, A.y + dy)] = W.PATH;
    // des rochers dans deux clairières, des buissons de baies dans une autre
    const nodes = [];
    L.slice(0, 2).forEach(g => { const a0 = rng() * 6; for (let a = a0; a < a0 + 3; a += 0.2) { const r = g.r - 0.3 + rng() * 1.4, x = Math.round(g.x + Math.cos(a) * r), y = Math.round(g.y + Math.sin(a) * r); if (dedans(x, y) && tile[I(x, y)] !== W.PATH) set(x, y, W.ROCK); } });
    if (L[2]) for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + rng() * 0.4, r = 1.6 + rng() * 1.4, x = Math.round(L[2].x + Math.cos(a) * r), y = Math.round(L[2].y + Math.sin(a) * r); if (dedans(x, y) && tile[I(x, y)] === W.GRASS && !nodes.some(o => o.x === x && o.y === y)) nodes.push({ type: 'bush', x, y }); }
    // des mares un peu partout, loin des clairières et de l'entrée
    const ponds = [], pris = new Set(nodes.map(n => I(n.x, n.y))), loin = (x, y) => Math.hypot(x - A.x, y - A.y) > 8 && relies.every(g => Math.hypot(x - g.x, y - g.y) > g.r + 5);
    for (let k = 0; k < 400 && ponds.length < 10; k++) {
      const x = 5 + Math.floor(rng() * (MW - 10)), y = 5 + Math.floor(rng() * (MH - 10)), rx = 1.6 + rng() * 2.2, ry = 1.2 + rng() * 1.4, ph = rng() * 6;
      if (!loin(x, y) || ponds.some(p => Math.hypot(p.x - x, p.y - y) < 13)) continue;
      ponds.push({ x, y });
      for (let dy = -4; dy <= 4; dy++) for (let dx = -5; dx <= 5; dx++) {
        if (!dedans(x + dx, y + dy)) continue; const i = I(x + dx, y + dy); if (pris.has(i)) continue;
        const a = Math.atan2(dy, dx), k2 = 1 + Math.sin(a * 3 + ph) * 0.18, d = (dx * dx) / (rx * rx * k2) + (dy * dy) / (ry * ry * k2);
        if (d < 1 && (tile[i] === W.TREE || tile[i] === W.GRASS)) tile[i] = W.WATER; else if (d < 2.4 && tile[i] === W.TREE && rng() < 0.6) tile[i] = W.GRASS;
      }
    }
    Object.keys(W.POI).forEach(k => { Object.assign(W.POI[k], { x: 2, y: 2, r: 0 }); }); Object.assign(W.GRAVE, { x: 2, y: MH - 3, r: 0 });
    W.nodes = nodes; W.chestDefs = []; W.wildDefs = []; W.ponds = ponds; W.sites = []; W.CX = hub.x; W.CY = hub.y; W.fieldDirty = true; W.miniDirty = true;
    plan = { m, hub, clairieres: L, arr: A };
  }
  const gen1 = W.generate; W.generate = function (seed) { const m = Te.ici(); if (!m) { plan = null; return gen1.apply(this, arguments); } gen1.call(W, seed); generer(m, seed); };

  // ---------- passer d'une forêt à l'autre ----------
  const neuf = (d, ici) => ({ day: d.day, hour: d.hour, morale: d.morale || 70, res: JSON.parse(JSON.stringify(ici.res || {})), goblins: [], pets: [], buildings: [], cuts: [], logs: [], young: [], chests: [], terra: {}, sauvages: { day: d.day, l: [] }, secrets: { day: d.day, l: [] } });
  let voileEl = null;
  function voile() { if (!voileEl) { voileEl = document.createElement('div'); voileEl.style.cssText = 'position:fixed;inset:0;z-index:40;background:#0a1208;pointer-events:none;opacity:0'; document.body.appendChild(voileEl); } if (voileEl.animate) voileEl.animate([{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 1700, easing: 'ease-in-out' }); }
  Te.partir = function (dest, minuit) {
    const R = CG.R, S = CG.S; if (Te.pending || Mo.pending || R.night || R.cine || R.ko > 0 || R.death) return false;
    if (!minuit && R.alarm) { CG.sfx('no'); UI.toast('Pas pendant une attaque : ton village a besoin de toi.'); return false; }
    if (dest && S.hour >= Te.TARD) { CG.sfx('no'); UI.toast('Il est trop tard pour partir si loin. Va dormir.'); return false; }
    if (R.mount && CG.Monture && CG.Monture.off) CG.Monture.off();
    Te.pending = { dest, t: 0.75, minuit: !!minuit }; R.invuln = Math.max(R.invuln || 0, 2.5); R.build = null; if (CG.Bt && CG.Bt.open) CG.Bt.toggle(false); if (!minuit) CG.sfx('page'); voile(); return true;
  };
  function basculer(dest, minuit) {
    const S = CG.S, GL = Mo.GLOBAL, entre = dest !== 0, de = Te.ici(); if (UI.modal) UI.close(); etat();
    const ry = entre ? rythme() : null, suiv = G.tech('b24') ? S.pets.filter(a => a.follow && !a.ko).map(a => a.id) : [];
    const data = JSON.parse(JSON.stringify(CG.pack())), ici = {}, N = {}; Object.keys(data).forEach(k => { if (!GL.includes(k)) ici[k] = data[k]; });
    const partent = (ici.pets || []).filter(a => suiv.includes(a.id)); ici.pets = (ici.pets || []).filter(a => !suiv.includes(a.id));
    GL.forEach(k => { if (data[k] !== undefined) N[k] = data[k]; });
    if (entre && !de) { ici.attH = ((CG.R && CG.R.schedule) || []).filter(e => e.type === 'attack' && !e.done).map(e => e.h); ici.depart = { h: data.hour, r: ry }; } // les attaques prévues, et le rythme du clan au départ
    const la = entre ? neuf(data, ici) : data.foret; if (!la) return;
    Object.keys(la).forEach(k => { if (!GL.includes(k)) N[k] = la[k]; });
    if (entre) { if (!de) N.foret = ici; /* d'une terre à une autre : le village qui attend reste celui de la forêt */ N.monde = dest; } else { delete N.foret; N.monde = 0; N.res = JSON.parse(JSON.stringify(ici.res || N.res)); } // ses ressources suivent le chef, à l'aller comme au retour
    N.pets = (N.pets || []).concat(partent);
    const attH = N.attH || [], dp = N.depart, heure = minuit ? 24 : Math.min(data.hour, 24), hp = N.player.hp, mp = N.player.mp; delete N.attH; delete N.depart;
    CG.S = N; G.initRuntime(); D.startDay();
    const R = CG.R, q = N.player; q.hp = hp; q.mp = mp; N.hour = heure; // l'heure a tourné pendant ce temps
    let a = null;
    if (entre) { const ar = (Te.arriveeDe && Te.arriveeDe(dest, de)) || arrivee(dest); a = W.center(ar.x, ar.y); }
    else { let k = attH.filter(h => h > N.hour).length; (R.schedule || []).forEach(e => { if (e.h <= N.hour) e.done = true; else if (e.type === 'attack') { if (k > 0) k--; else e.done = true; } }); // personne n'attaque un village sans son chef : ce qui devait venir pendant son absence ne vient pas
      R.terreH0 = Math.min(N.hour, 19);
      if (dp && dp.r) { const hr = Math.max(0, Math.min(N.hour, 19) - Math.min(dp.h, 19)), l = []; RES.forEach(r => { const n = Math.floor((dp.r[r] || 0) * hr * Te.PART); if (n > 0) { N.res[r] = (N.res[r] || 0) + n; l.push('+' + n + ' ' + IC[r]); } }); if (l.length) setTimeout(() => UI.toast('Pendant ton absence, le clan a tourné au ralenti : ' + l.join(' · ')), 1600); }
      R.eveningSaid = N.hour >= 19; if (N.feastDay === N.day && Mo.feuIci()) { R.feast = true; R.feastOk = true; R.fireLit = true; }
      if (!minuit) { const par = Te.L[de] ? Te.L[de].par : 'ouest', e = W.EXITS[par], c = W.center(e.x, e.y); a = { x: c.x + (par === 'ouest' ? 70 : par === 'est' ? -70 : 0), y: c.y + (par === 'sud' ? -70 : 0) }; } } // à minuit, il est déjà devant sa hutte
    if (a) { q.x = a.x; q.y = a.y; q.path = null; G.unstick(q, 9); }
    N.pets.forEach(o => { if (suiv.includes(o.id)) { o.x = q.x + rand(-20, 20); o.y = q.y + 18; o.path = null; } });
    W.drawMini(); R.invuln = 2.5;
    if (entre) G.banner(Te.L[dest].titre, Te.L[dest].sous || SOUS, Te.L[dest].col); else if (minuit) UI.toast('🌙 Minuit : le sommeil t\'a ramené à ta hutte.'); else G.banner('De retour dans la forêt', 'Ton village t\'attendait.', '#ffe9a8');
    try { CG.save(); } catch (e) { /* rien */ }
  }
  const du0 = D.update; D.update = function (dt) {
    if (Te.pending) { Te.pending.t -= dt; if (Te.pending.t <= 0) { const q = Te.pending; Te.pending = null; basculer(q.dest, q.minuit); } return; }
    if (!Te.ici() || Mo.pending) return du0.apply(this, arguments);
    const S = CG.S, R = CG.R; R.feast = true; R.eveningSaid = true; // ni fête ni veillée ici : elles attendent au village
    if (S.hour >= 19 && !R.terreSoir) { R.terreSoir = true; G.banner('Le soir tombe', 'Tu es loin de chez toi. À minuit, le sommeil te ramènera à ta hutte.', '#ffcf7a'); }
    if (S.hour >= 23.97 && !R.death) { Te.partir(0, true); return; } // minuit : il rentre dormir
    return du0.apply(this, arguments);
  };
  const cast0 = G.cast; G.cast = function (id) { if (Te.ici() && (id === 'mondes' || id === 'retour')) { CG.sfx('no'); return UI.toast('Tes portails ne trouvent pas ton village d\'ici. Il faut repartir par le chemin.'); } return cast0.apply(this, arguments); };
  if (CG.Bt && CG.Bt.toggle) { const tg0 = CG.Bt.toggle; CG.Bt.toggle = function (on) { if (Te.ici() && on !== false && !CG.Bt.open) { CG.sfx('no'); return UI.toast('Tu n\'es pas chez toi : on ne bâtit pas ici.'); } return tg0.apply(this, arguments); }; }
  const rw0 = D.rollWild; D.rollWild = function () { if (!Te.ici()) return rw0.apply(this, arguments); const R = CG.R; R.chests = []; R.siteDone = {}; R.siteN = {}; R.siteCoffre = {}; R.noNightRaid = true; R.terreM = 0; };
  const sd0 = D.startDay; D.startDay = function () { const r = sd0.apply(this, arguments); if (!Te.ici()) return r; const S = CG.S, R = CG.R; R.schedule = []; R.band = null; S.autels = []; S.statues = { day: S.day, list: [] }; R.visitors = []; R.terreM = 0; R.terreSoir = S.hour >= 19; return r; };

  // ---------- les bêtes et les coffres de là-bas ----------
  // tout est tiré d'après la carte et le jour : en revenant le même jour, on retrouve les mêmes meutes, moins celles qu'on a tuées
  const FORTS = ['loup', 'sanglier', 'araignee', 'brigand', 'squelette', 'follet', 'champi', 'diablotin', 'ours'], GROS = ['ours', 'ogre', 'troll', 'squelette', 'diablotin', 'champi', 'araignee'];
  const BUTIN = ['commun', 'vivres', 'savoir', 'butin', 'precieux', 'magique', 'piege'], BEAU = ['precieux', 'butin', 'magique', 'savoir'];
  function peupler() {
    const S = CG.S, R = CG.R, m = Te.ici(), P = plan; if (!P || P.m !== m) return; R.terreM = m;
    const p = S.player, A = P.arr; if (!W.walkPx(p.x, p.y)) { const c = W.center(A.x, A.y); p.x = c.x; p.y = c.y; p.path = null; }
    const J = jour(m), rng = CG.makeRng((S.seed || 1) + m * 977 + S.day * 31), f = W.field(), MW = CG.MW, MH = CG.MH, spots = P.clairieres.map(g => ({ x: g.x, y: g.y, fond: true }));
    for (let k = 0; k < 1500 && spots.length < P.clairieres.length + Te.MEUTES; k++) { const x = 4 + Math.floor(rng() * (MW - 8)), y = 4 + Math.floor(rng() * (MH - 8));
      if (f[W.idx(x, y)] < 0 || Math.hypot(x - A.x, y - A.y) < 14 || spots.some(s => Math.hypot(s.x - x, s.y - y) < 8)) continue; spots.push({ x, y }); }
    R.chests = []; R.enemies = R.enemies.filter(e => e.tk === undefined); let id = 0;
    spots.forEach((s, i) => {
      const c = W.center(s.x, s.y), l = s.fond ? GROS : FORTS, type = l[Math.floor(rng() * l.length)], cost = CG.ENEMIES[type].cost || 2, max = s.fond ? 5 : 4; let budget = (s.fond ? 7 : 4.5) + Math.min(6, S.day * 0.3), n = 0;
      while ((budget >= cost || n === 0) && n < max) { budget -= cost; n++; const tk = id++; let x = c.x + (rng() - 0.5) * 92, y = c.y + (rng() - 0.5) * 80; if (J.morts[tk]) continue;
        if (!W.walkPx(x, y)) { x = c.x; y = c.y; } if (!W.walkPx(x, y)) continue; const e = G.spawnEnemy(type, x, y, { wild: true, mul: Te.FORCE }); if (e) e.tk = tk; }
      const r = rng(), r2 = rng(), kind = s.fond ? BEAU[Math.floor(r2 * BEAU.length)] : BUTIN[Math.floor(r2 * BUTIN.length)]; // au bout d'un sentier, il y a toujours quelque chose
      if ((s.fond || r < 0.45) && !J.coffres[i] && W.walkPx(c.x, c.y)) R.chests.push({ x: c.x, y: c.y, kind, open: false, tk: i });
    });
    R.terreN = id;
  }
  const oc0 = D.openChest; D.openChest = function (c) { const m = Te.ici(); if (m && c && c.tk !== undefined) jour(m).coffres[c.tk] = 1; return oc0.apply(this, arguments); };
  let noteT = 0;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return;
    const m = Te.ici(); if (!m || R.cine) return; if (R.terreM !== m) peupler();
    noteT -= dt; if (noteT > 0) return; noteT = 1; // on note celles qui sont tombées
    const J = jour(m), vus = new Set(); for (const e of R.enemies) if (e.tk !== undefined && !e.dead) vus.add(e.tk); for (let i = 0; i < (R.terreN || 0); i++) if (!vus.has(i)) J.morts[i] = 1;
  };

  // ---------- les chemins : sortir de la forêt, et en revenir ----------
  const NOMS_PAR = { ouest: 'Prendre le chemin de l\'ouest', sud: 'Prendre le chemin du sud', est: 'Prendre le chemin de l\'est' };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), S = CG.S, R = CG.R, p = S.player; if (R.ko > 0 || R.cine || R.build || Te.pending) return it; const m = Te.ici();
    if (!m) { if (Mo.ici() !== 0 || (it && it.type !== 'home' && it.type !== 'sleep')) return it;
      for (const par of ['ouest', 'sud', 'est']) { const e = W.EXITS[par], c = W.center(e.x, e.y); if (Math.hypot(p.x - c.x, p.y - c.y) < 84) return { type: 'terreChemin', par, obj: { x: p.x, y: p.y - 30 }, label: p.lvl >= Te.NIV ? NOMS_PAR[par] : NOMS_PAR[par] + ' : il faut être niveau ' + Te.NIV }; }
      return it; }
    if (it) return it;
    const a = arrivee(m), c = W.center(a.x, a.y); if (Math.hypot(p.x - c.x, p.y - c.y) < 84) return { type: 'terreRetour', obj: { x: p.x, y: p.y - 30 }, label: m === 6 ? 'Remonter vers la forêt du sud' : 'Reprendre le chemin du village' };
    return it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(), p = CG.S.player; if (!it) return in0.apply(this, arguments);
    if (it.type === 'terreChemin') { if (p.lvl < Te.NIV) { CG.sfx('no'); return UI.toast('🚧 Ce chemin mène loin de chez toi. Reviens quand tu seras niveau ' + Te.NIV + ' (tu es niveau ' + p.lvl + ').'); } return Te.partir(PAR[it.par]); }
    if (it.type === 'terreRetour') return Te.partir(Te.ici() === 6 ? 4 : 0);
    return in0.apply(this, arguments);
  };
})(window.CG);
