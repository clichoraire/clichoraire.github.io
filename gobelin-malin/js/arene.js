// Goblin Malin — les appels à l'aide. De temps en temps, quelqu'un vient jusqu'au feu demander au chef de se battre à sa
// place : des trolls gentils chassés de leur grotte, une elfe dont la clairière grouille d'araignées, un nain dont la mine
// est hantée, des hommes-crapauds du marais. Si le chef accepte, un portail l'emporte dans une petite carte à part, juste
// pour ce combat. Une fois tout le monde battu, un portail le ramène là où il était, et on le récompense.
// (Sous le capot, c'est la même porte que la pyramide : le monde de dehors reste figé pendant ce temps.)
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, Mo = CG.Mondes, Py = CG.Pyramide, T = CG.TILE, MW = CG.MW, MH = CG.MH, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  if (!Mo || !Py) return;
  const Ar = CG.Arene = { CHANCE: 0.22, JOUR: 3, TROIS: 0.4, BOSS: 0.4, BOSS_VIE: 3, BOSS_DMG: 1.4, CX: 14, CY: 36, RX: 10, RY: 7 };
  if (!Mo.GLOBAL.includes('arene')) Mo.GLOBAL.push('arene');
  const palier = () => { const l = CG.S.player.lvl; return l < 5 ? 0 : l < 10 ? 1 : 2; };
  Ar.Q = {
    trolls: { mondes: [0], qui: 'Trolls des collines', role: 'monstre', look: 'animal', kind: 'troll', lieu: 'La grotte des trolls', theme: 'grotte', chef: ['ours', 'La grosse bête'],
      texte: '« Chef petit, mais chef fort. Nous, trolls gentils. Grosse bête entrée dans grotte à nous. Elle mordre. Nous pas aimer bagarre. Toi y aller à notre place ? Nous faire trou magique pour toi. »',
      merci: '« Grotte à nous ! Merci, chef petit. Tiens, cailloux qui brillent. »', E: [['ours', 'loup', 'loup', 'loup'], ['ogre', 'ours', 'loup', 'loup'], ['ogre', 'ogre', 'troll', 'ours']] },
    elfe: { mondes: [0], qui: 'Sylène, gardienne elfe', role: 'nomade', look: 'elfeQ', lieu: 'La clairière aux toiles', theme: 'clairiere', chef: ['araignee', 'La reine des araignées'],
      texte: '« Chef gobelin, j\'ai honte de le demander. Des araignées géantes ont tissé leurs toiles dans la clairière de mes sœurs, et mon arc n\'y suffit plus. Veux-tu y aller ? J\'ouvre le passage. »',
      merci: '« La clairière respire de nouveau. Les elfes n\'oublient pas, chef. »', E: [['araignee', 'araignee', 'araignee', 'araignee'], ['araignee', 'araignee', 'araignee', 'araignee', 'champi', 'champi'], ['araignee', 'araignee', 'araignee', 'araignee', 'araignee', 'ogre']] },
    nain: { mondes: [0, 1], qui: 'Durgan, mineur nain', role: 'nomade', look: 'nainQ', lieu: 'La galerie hantée', theme: 'mine', chef: ['squelette', 'Le vieux roi d\'os'],
      texte: '« Par ma barbe ! On a creusé trop profond et on a réveillé des os qui marchent. Mes gars ne veulent plus descendre. Toi, tu n\'as peur de rien, il paraît. Tu descends les recoucher ? »',
      merci: '« Ha ! Plus un os debout. Voilà ta part du filon, peau verte. »', E: [['squelette', 'squelette', 'spectre'], ['squelette', 'squelette', 'squelette', 'spectre', 'spectre'], ['squelette', 'squelette', 'squelette', 'squelette', 'spectre', 'spectre', 'wraith']] },
    crapauds: { mondes: [1], qui: 'Hommes-crapauds de la mare', role: 'monstre', look: 'animal', kind: 'crapaudLancier', lieu: 'La mare aux lézards', theme: 'mare', chef: ['lezard', 'Le chef de guerre des lézards'],
      texte: '« Croâ. Les lézards ont pris notre mare. Nos têtards sont cachés sous les nénuphars. Toi, tu as battu leur roi... tu veux bien les chasser ? On t\'ouvre le chemin de l\'eau. Croâ. »',
      merci: '« Croâ ! La mare est à nous. Prends ça, c\'est tombé au fond il y a longtemps. »', E: [['lezard', 'lezard', 'geleeRouge'], ['lezard', 'lezard', 'lezard', 'chamanLezard'], ['basilic', 'lezardCav', 'lezard', 'lezard']] }
  };
  const dans = () => !!(CG.S && CG.S.arene && Mo.ici() === 2);
  Ar.dans = dans;
  // ---------- le visiteur qui demande de l'aide ----------
  const pl0 = D.plan; D.plan = function () {
    const r = pl0.apply(this, arguments), S = CG.S, R = CG.R; if (!R.schedule || S.day < Ar.JOUR || Mo.ici() === 2 || !Mo.feuIci() || Math.random() > Ar.CHANCE) return r;
    R.schedule.push({ h: rand(7.5, 14.5), type: 'visit', role: 'quete' }); R.schedule.sort((a, b) => a.h - b.h); return r;
  };
  Ar.venir = function (id) {
    const S = CG.S, R = CG.R, ids = Object.keys(Ar.Q).filter(k => Ar.Q[k].mondes.includes(Mo.ici()) && CG.ENEMIES[Ar.Q[k].E[0][0]] && (!Ar.Q[k].kind || CG.P.KINDS[Ar.Q[k].kind])); id = Ar.Q[id] ? id : pick(ids); if (!id) return null;
    const q = Ar.Q[id], en = pick(['ouest', 'est', 'sud']), e = W.EXITS[en], f = G.firePos(), ex = W.center(e.x, e.y);
    const v = { id: S.nextId++, role: q.role, look: q.look, kind: q.kind, evo: 0, quete: id, x: ex.x, y: ex.y, face: 1, step: 0, moving: false, state: 'arrive', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 4.5), dest: { x: f.x - 20, y: f.y + 110 } };
    if (!G.goTo(v, v.dest.x, v.dest.y)) return null; R.visitors.push(v);
    v.annonce = [q.qui, 'Quelqu\'un est venu te demander de l\'aide. Va lui parler (E).', '#ffd0a0']; return v;
  };
  Ar.parler = function (v) {
    const q = Ar.Q[v.quete], n = q.E[palier()].length;
    UI.dialog({ visitor: v, who: q.qui, tag: '🆘 demande ton aide', text: q.texte, options: [
      { label: '⚔️ J\'y vais', sub: q.sub || 'Un portail t\'emmène à « ' + q.lieu + ' » : un vieux château sombre, salle après salle, plein d\'ennemis. Tu reviendras ici même après le combat.', fn: () => Ar.partir(v.quete) },
      { label: '⏳ Pas tout de suite', sub: 'Il t\'attend encore un peu près du feu' },
      { label: '👋 Désolé, débrouillez-vous', sub: 'Il repart, déçu', fn: () => { if (CG.R.visitors.includes(v)) { v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); } } }] });
  };
  const sv0 = D.startVisit; D.startVisit = function (ev) { if (ev && ev.role === 'quete') return Ar.venir(); return sv0.apply(this, arguments); };
  const tk0 = D.talk; D.talk = function (v) { if (v.quete) return Ar.parler(v); return tk0.apply(this, arguments); };
  const vis0 = Art.visitor; Art.visitor = function (g, v, t) { if (v.look === 'elfeQ' || v.look === 'nainQ') return vis0.call(this, g, Object.assign({}, v, { look: v.look === 'elfeQ' ? 'elfe' : 'nain' }), t); return vis0.apply(this, arguments); };

  // ---------- partir, revenir ----------
  Ar.partir = function (id) { const S = CG.S, p = S.player; if (!Ar.Q[id] || Mo.ici() === 2) return false; Ar.attente = { id, de: Mo.ici(), x: p.x, y: p.y, palier: palier() }; if (!Mo.partir('pyramide')) { Ar.attente = null; return false; } return true; };
  const neuf = d => ({ day: d.day, hour: 12, morale: d.morale || 70, res: { food: 0, bois: 0, minerai: 0, cuir: 0, or: 0 }, goblins: [], pets: [], buildings: [], cuts: [], logs: [], young: [], chests: [], terra: {}, etages: 9 });
  const pb0 = Py.basculer; Py.basculer = function (par) {
    const entre = par === 'pyramide' && Ar.attente, sort = par === 'dehors' && CG.S.arene; if (!entre && !sort) return pb0.apply(this, arguments);
    const S = CG.S, GL = Mo.GLOBAL; if (UI.modal) UI.close();
    const suiv = S.pets.filter(a => a.follow && !a.ko && (G.tech('b24') || a.amene)).map(a => a.id);
    const data = JSON.parse(JSON.stringify(CG.pack())), ici = {}, N = {}; Object.keys(data).forEach(k => { if (!GL.includes(k)) ici[k] = data[k]; });
    const partent = ici.pets.filter(a => suiv.includes(a.id)); ici.pets = ici.pets.filter(a => !suiv.includes(a.id));
    GL.forEach(k => { if (data[k] !== undefined) N[k] = data[k]; });
    const la = entre ? neuf(data) : data.dehors; if (!la) return; const A = sort ? data.arene : null;
    Object.keys(la).forEach(k => { if (!GL.includes(k)) N[k] = la[k]; });
    if (entre) { N.dehors = ici; N.monde = 2; N.arene = Object.assign({ seed: Math.floor(Math.random() * 1e6), gagne: false }, Ar.attente); Ar.attente = null; }
    else { delete N.dehors; delete N.arene; N.monde = A.de; Object.keys(ici.res || {}).forEach(r => { N.res[r] = (N.res[r] || 0) + (ici.res[r] || 0); }); }
    N.pets = (N.pets || []).concat(partent);
    const h0 = N.hour, hp = N.player.hp, mp = N.player.mp;
    CG.S = N; G.initRuntime(); D.startDay();
    const R = CG.R, q = N.player; q.hp = hp; q.mp = mp; N.hour = Math.min(h0, 23.5);
    if (sort) { (R.schedule || []).forEach(e => { if (e.h <= N.hour) e.done = true; }); R.eveningSaid = N.hour >= 19; if (N.feastDay === N.day && Mo.feuIci()) { R.feast = true; R.feastOk = true; R.fireLit = true; } q.x = A.x; q.y = A.y; }
    else { q.x = (Ar.CX + 0.5) * T; q.y = (Ar.CY + Ar.RY - 1.5) * T; }
    G.unstick(q, 9); N.pets.forEach(o => { if (suiv.includes(o.id)) { o.x = q.x - 30 + rand(-14, 14); o.y = q.y + 16; o.path = null; } });
    W.drawMini(); R.invuln = 2.5; G.puff(q.x, q.y - 20, '#e0b0ff', 30, 180, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: q.x, y: q.y - 10, r: 60 + i * 44, life: 0.5 + i * 0.15, col: '#e0b0ff' });
    if (entre) { const Q = Ar.Q[N.arene.id]; G.banner(Q.titre || Q.lieu, Q.entree ? Q.entree : Q.vagues ? 'Les morts arrivent par vagues. Tiens jusqu\'à la dernière : un portail te ramènera. Dehors, le temps s\'est arrêté.' : 'Bats tout ce qui bouge, vague après vague. Le portail de pierre te ramènera ensuite. Dehors, le temps s\'est arrêté.', '#ffd0a0'); }
    else if (A.gagne) recompense(A); else G.banner('De retour', 'Tu es reparti avant la fin du combat : pas de récompense cette fois.', '#d8d0c0');
    try { CG.save(); } catch (e) { /* rien */ }
  };
  function recompense(A) {
    if (Ar.Q[A.id].recompense) return Ar.Q[A.id].recompense(A);
    const S = CG.S, p = S.player, Q = Ar.Q[A.id], or = 40 + 12 * S.day + A.palier * 30, xp = 30 + 6 * S.day; G.gain('or', or, p.x, p.y - 50); G.addXp(xp); S.morale = Math.min(100, S.morale + 3);
    let plus = ''; if (Math.random() < 0.35) { const id = G.newScroll(); if (id) { G.giveScroll(id, p.x, p.y); plus = ' Et un tome de sort !'; } }
    G.banner(Q.qui + ' te remercie', Q.merci + ' (+' + or + ' 🪙, +' + xp + ' XP, moral +3.)' + plus, '#c8ffb0'); CG.sfx('victory');
  }
  // ---------- la petite carte ----------
  const sol = (x, y) => { const dx = (x - Ar.CX) / Ar.RX, dy = (y - Ar.CY) / Ar.RY; return dx * dx + dy * dy <= 1; };
  const ge0 = Py.generer; Py.generer = function (seed, gen0) {
    ge0.apply(this, arguments); const S = CG.S; if (!S || !S.arene) return; const tile = W.tile, I = W.idx, rng = CG.makeRng(S.arene.seed);
    tile.fill(W.BUILD); for (let y = Ar.CY - Ar.RY; y <= Ar.CY + Ar.RY; y++) for (let x = Ar.CX - Ar.RX; x <= Ar.CX + Ar.RX; x++) if (sol(x, y)) tile[I(x, y)] = W.FLOOR;
    for (let i = 0; i < 7; i++) { const x = Ar.CX + Math.round((rng() - 0.5) * (Ar.RX * 2 - 6)), y = Ar.CY + Math.round((rng() - 0.5) * (Ar.RY * 2 - 5)); if (sol(x, y) && Math.hypot(x - Ar.CX, y - Ar.CY) > 2.5 && y < Ar.CY + Ar.RY - 3) tile[I(x, y)] = W.ROCK; } // quelques obstacles
    Object.assign(W.POI.portail, { x: Ar.CX, y: Ar.CY + Ar.RY, r: 0 }); W.CX = Ar.CX; W.CY = Ar.CY; W.fieldDirty = true; W.miniDirty = true;
  };
  const TH = {
    grotte: { fond: '#0a0a10', h: 230, s: 8, l: 34, bord: 'roche' }, mine: { fond: '#0c0806', h: 28, s: 30, l: 30, bord: 'roche' },
    crypte: { fond: '#07040c', h: 268, s: 24, l: 22, bord: 'roche' },
    clairiere: { fond: '#0c1a0c', h: 108, s: 40, l: 34, bord: 'arbre' }, mare: { fond: '#0a1410', h: 150, s: 26, l: 28, bord: 'arbre' }
  };
  Ar.TH = TH; /* d'autres fichiers y ajoutent leurs décors (sablestemples.js) */
  const pa0 = W.paint; W.paint = function () {
    if (!dans()) return pa0.apply(this, arguments);
    const th = TH[Ar.Q[CG.S.arene.id].theme], c = W.terrain = document.createElement('canvas'); c.width = MW * T; c.height = MH * T; const g = c.getContext('2d'), I = W.idx, rng = CG.makeRng(CG.S.arene.seed + 3);
    g.fillStyle = th.fond; g.fillRect(0, 0, c.width, c.height);
    const x0 = Ar.CX - Ar.RX - 3, x1 = Ar.CX + Ar.RX + 3, y0 = Ar.CY - Ar.RY - 3, y1 = Ar.CY + Ar.RY + 3;
    g.fillStyle = 'hsl(' + th.h + ',' + th.s + '%,' + (th.l - 12) + '%)'; g.beginPath(); g.ellipse((Ar.CX + 0.5) * T, (Ar.CY + 0.5) * T, (Ar.RX + 1.6) * T, (Ar.RY + 1.6) * T, 0, 0, TAU); g.fill();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = W.tile[I(x, y)]; if (t === W.BUILD) continue; const k = W.hash(x, y); g.fillStyle = 'hsl(' + (th.h + k * 8) + ',' + th.s + '%,' + (th.l + k * 7) + '%)'; g.fillRect(x * T - 1, y * T - 1, T + 2, T + 2); }
    for (let i = 0; i < 140; i++) { const x = (x0 + rng() * (x1 - x0)) * T, y = (y0 + rng() * (y1 - y0)) * T; if (!W.walkPx(x, y)) continue; g.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(x, y, 6 + rng() * 16, 3 + rng() * 7, 0, 0, TAU); g.fill();
      if (th.bord === 'arbre' && rng() < 0.3) { g.strokeStyle = 'rgba(190,230,150,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 8); g.moveTo(x + 3, y); g.lineTo(x + 4, y - 7); g.stroke(); } }
    if (th === TH.mare) for (let i = 0; i < 5; i++) { const x = (Ar.CX + (rng() - 0.5) * Ar.RX * 1.3) * T, y = (Ar.CY + (rng() - 0.5) * Ar.RY * 1.1) * T; g.fillStyle = 'rgba(70,130,150,0.4)'; g.beginPath(); g.ellipse(x, y, 30 + rng() * 26, 14 + rng() * 10, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(120,200,110,0.6)'; g.beginPath(); g.ellipse(x + 8, y - 2, 8, 4, 0, 0.5, TAU); g.fill(); }
    // la bordure (rochers ou arbres), de haut en bas pour qu'ils se recouvrent bien, et les obstacles du milieu
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = W.tile[I(x, y)];
      if (t === W.ROCK) { Art.rock(g, x, y); continue; } if (t !== W.BUILD) continue;
      let pres = false; for (let dy = -1; dy <= 1 && !pres; dy++) for (let dx = -1; dx <= 1; dx++) { const tt = W.tile[I(x + dx, y + dy)]; if (tt === W.FLOOR || tt === W.ROCK) { pres = true; break; } } if (!pres) continue;
      if (th.bord === 'arbre' && y <= Ar.CY + 2) Art.tree(g, x, y, 0, 0); else Art.rock(g, x, y); }
    const gc = W.ground = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; gc.getContext('2d').drawImage(c, 0, 0);
  };
  // ---------- les ennemis, la victoire, le portail du retour ----------
  const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments); if (!dans()) return r; const S = CG.S, R = CG.R, A = S.arene, p = S.player;
    R.enemies.length = 0; R.chests = []; R.lord2 = null; R.sortiePy = null; if (A.gagne) return r;
    const Q = Ar.Q[A.id]; if (Q.vagues || Q.donjon) return r;
    if (A.nv === undefined) { A.nv = Math.random() < Ar.TROIS ? 3 : 2; A.boss = Math.random() < Ar.BOSS; A.vague = 0; }
    if (A.bossVu) chefVague(); else vague(A.vague);
    return r;
  };
  // les ennemis arrivent par vagues (deux au moins) ; parfois, un chef plus gros ferme la marche
  function pose(type, i, n) { let x, y; for (let k = 0; k < 40; k++) { const a = -Math.PI * (0.1 + 0.8 * (i + 0.5) / n) + rand(-0.15, 0.15), d = rand(0.45, 0.8); x = (Ar.CX + 0.5 + Math.cos(a) * Ar.RX * d) * T; y = (Ar.CY + 0.5 + Math.sin(a) * Ar.RY * d) * T; if (W.walkPx(x, y)) break; }
    const e = G.spawnEnemy(type, x, y, { wild: true }); if (!e) return null; e.arene = true; e.etage = 99; e.leash = 2000; e.aggroR = 900; return e; }
  function vague(k) { const A = CG.S.arene; let l = Ar.Q[A.id].E[A.palier].filter(t => CG.ENEMIES[t]); if (k > 0) l = l.concat(l.slice(0, Math.min(k, 2))); l.forEach((t, i) => { const e = pose(t, i, l.length); if (e && k > 0) G.puff(e.x, e.y - 16, '#c8b8a0', 14, 100, 4); }); }
  function chefVague() { const A = CG.S.arene, c = Ar.Q[A.id].chef; if (!c || !CG.ENEMIES[c[0]]) return false; const e = pose(c[0], 0, 1); if (!e) return false;
    e.hp = e.maxhp = Math.round(e.hp * Ar.BOSS_VIE * (1 + A.palier * 0.5)); e.dmg *= Ar.BOSS_DMG; e.r = Math.round(e.r * 1.35); e.grosArene = true; e.nomArene = c[1];
    G.puff(e.x, e.y - 24, '#ff8a5a', 30, 180, 5); for (let i = 0; i < 3; i++) CG.R.rings.push({ x: e.x, y: e.y - 10, r: 50 + i * 40, life: 0.5 + i * 0.15, col: '#ff8a5a' }); return true; }
  { const ae = Art.enemy; Art.enemy = function (g, e, t) { if (!e.grosArene) return ae.apply(this, arguments); g.save(); g.translate(e.x, e.y); g.scale(1.5, 1.5); g.translate(-e.x, -e.y); try { return ae.apply(this, arguments); } finally { g.restore(); } }; }
  const sd0 = D.startDay; D.startDay = function () { const r = sd0.apply(this, arguments); if (dans()) { const R = CG.R; R.sortiePy = null; R.visitors = []; R.schedule = []; } return r; };
  function portail() { CG.R.sortiePy = { x: (Ar.CX + 0.5) * T, y: (Ar.CY + 0.5) * T, draw(g, o, t) { const a = 0.6 + Math.sin(t * 3) * 0.15; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(o.x, o.y + 4, 24, 7, 0, 0, TAU); g.fill(); [['rgba(120,60,200,' + a + ')', 1], ['rgba(190,130,255,' + a + ')', 0.7], ['rgba(240,225,255,' + a + ')', 0.35]].forEach(c => { g.fillStyle = c[0]; g.beginPath(); g.ellipse(o.x, o.y - 34, 22 * c[1], 40 * c[1], 0, 0, TAU); g.fill(); }); for (let i = 0; i < 5; i++) { const k = (t * 0.6 + i / 5) % 1, an = i * 1.3 + t; g.fillStyle = 'rgba(230,200,255,' + (1 - k) + ')'; g.beginPath(); g.arc(o.x + Math.cos(an) * 20 * (1 - k), o.y - 34 - k * 40, 2.4, 0, TAU); g.fill(); } } }; }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); if (!dans()) return; const S = CG.S, R = CG.R, A = S.arene; if (!R || A.gagne || Mo.pending) return;
    R.arT = (R.arT || 0) - dt; if (R.arT > 0) return; R.arT = 0.4; if (Ar.Q[A.id].vagues || Ar.Q[A.id].donjon || R.enemies.some(e => !e.dead && e.arene)) { R.arVide = false; return; } // les salles à vagues décident elles-mêmes de la fin
    if (!R.arVide) { R.arVide = true; R.arT = 1.5; return; } R.arVide = false; // un petit souffle avant la suite
    if (A.vague + 1 < A.nv) { A.vague++; vague(A.vague); G.banner('Vague ' + (A.vague + 1) + ' / ' + A.nv, pick(['Ce n\'était pas tout : il en arrive d\'autres !', 'Encore ! Ils sortent de partout.', 'Tiens bon, en voilà d\'autres.']), '#ffd0a0'); CG.sfx('horn'); return; }
    if (A.boss && !A.bossVu) { A.bossVu = true; if (chefVague()) { G.banner(Ar.Q[A.id].chef[1], 'Le plus gros attendait la fin. À toi de jouer !', '#ff9a8a'); CG.sfx('warning'); return; } }
    Ar.gagner();
  };
  Ar.gagner = function () {
    const S = CG.S, R = CG.R, A = S.arene; if (!A || A.gagne) return;
    A.gagne = true; R.sortiePy = null; const o = Mo.portailPos(); G.puff(o.x, o.y - 30, '#c090ff', 40, 220, 5); for (let i = 0; i < 3; i++) R.rings.push({ x: o.x, y: o.y - 10, r: 70 + i * 50, life: 0.5 + i * 0.15, col: '#c090ff' });
    G.banner('Victoire !', A.lot ? 'Quelque chose est apparu au milieu de la salle : ' + A.lot.ic + ' va le prendre avant de repartir par le portail de pierre.' : A.piedestal ? 'Un piédestal est sorti du sol au milieu de la salle, déjà ouvert : prends le tome (E) avant de repartir par le portail de pierre.' : 'Plus personne ne bouge. Reprends le portail de pierre par lequel tu es arrivé (E) pour revenir où tu étais.', '#ffe9a8'); CG.sfx('victory'); try { CG.save(); } catch (e) { /* rien */ }
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments); if (it && it.type === 'pyramideSortie' && dans()) it.label = CG.S.arene.gagne ? 'Prendre le portail du retour' : 'Fuir par le portail'; return it;
  };
})(window.CG);
