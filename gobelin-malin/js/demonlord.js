// Goblin Malin — le Demon Lord. Quand le chef est de niveau 10 et que 14 jours ont passé, le vieux portail du nord se réveille :
// le chef peut l'activer (E). La terre tremble, tout le clan court autour du feu, et le Demon Lord surgit avec sa petite armée.
// Le chef s'avance devant les siens, ils échangent quelques mots (« Tu ne nous auras jamais ! »), et le combat commence.
// Le vaincre ouvre pour de bon le portail démoniaque du nord (voir mondes.js) et donne le sort Passage entre les mondes.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, DL = CG.DemonLord = { JOUR: 14, NIVEAU: 10, TARD: 22.5 }, Mo = CG.Mondes;
  const rand = CG.rand, pick = CG.pick, TAU = Math.PI * 2;
  CG.ENEMIES.demonLord = { nom: 'Demon Lord', race: 'demon', hp: 700, dmg: 17, spd: 72, xp: 600, or: 300, cost: 99, r: 24, boss: true, cadence: [3, 4.4], haut: 2.25 };
  CG.Boss.KIT.demonLord = ['pluie', 'nova', 'souffle', 'deluge', 'croix'];
  const DITS = ['Tu as senti ça ?!', 'C\'était quoi, ÇA ?!', 'La terre a bougé... non ?', 'Tu sais ce qui se passe, chef ?', 'J\'ai renversé ma chope !', 'Ça venait du nord...', 'Chut ! Écoutez...', 'J\'aime pas ça. J\'aime pas ça du tout.', 'Les tambours se sont tus tout seuls...', 'Regardez le ciel !'];
  const cv = () => document.getElementById('game');
  let ciel = null;
  function rouge(on) { if (!ciel) { ciel = document.createElement('div'); ciel.id = 'dl-ciel'; document.body.appendChild(ciel); } ciel.classList.toggle('on', !!on); }

  const foret = () => !Mo || Mo.ici() === 0;
  DL.pret = function () { const S = CG.S; return !!S && !S.demon && foret() && S.player.lvl >= DL.NIVEAU && S.day > DL.JOUR; };
  // la scène tient les commandes : une fausse fenêtre, qui ne met pas le jeu en pause
  const SCENE = { name: 'scene', closable: false, pauses: false };
  const tenir = () => { if (!UI.modal) UI.modal = SCENE; }, lacher = () => { if (UI.modal === SCENE) UI.modal = null; };
  const clan = () => CG.S.goblins.filter(g => !g.exile && !g.bebe && !g.migre && !g.demenage);
  DL.lancer = function () {
    const S = CG.S, R = CG.R; if (R.seisme || !DL.pret()) return;
    if (R.alarm || R.event || R.night || R.fadeDir || R.cine || R.ko > 0 || S.hour >= DL.TARD) { CG.sfx('no'); return UI.toast('Le portail ne répond pas. Reviens un peu plus tard.'); }
    R.seisme = { t: 0, ph: 'portail' }; if (R.mount && CG.Monture && CG.Monture.off) CG.Monture.off();
    (R.schedule || []).forEach(e => { if (e.type === 'attack') e.done = true; }); // pas d'autre attaque aujourd'hui
    CG.sfx('warning'); G.text(S.player.x, S.player.y - 70, '?!', '#ffe36b', true);
  };
  function fin() { // tout remettre en place (la scène est finie, ou coupée court)
    const R = CG.R, q = R.seisme; secoue(0); lacher(); if (q && q.ph !== 'combat') R.fade = 0;
    CG.S.goblins.forEach(g => { if (g.seis) { g.seis = null; g.cine = false; G.resetGoblin(g); } });
  }
  // les gobelins pendant la scène : ils tournent autour du feu, affolés, puis se serrent derrière le chef
  const cs0 = G.cineStep; G.cineStep = function (g, dt) {
    const s = g.seis; if (!s) return cs0.apply(this, arguments);
    const f = G.firePos(); let tx, ty, v = 150;
    if (s.abri) { tx = s.abri.x; ty = s.abri.y; v = 170; } else { s.a += dt * s.w; tx = f.x + Math.cos(s.a) * s.r; ty = f.y + Math.sin(s.a) * s.r * 0.62; }
    const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy); g.pose = null;
    if (d < 4) { g.moving = false; if (s.abri && s.vers) g.face = s.vers > g.x ? 1 : -1; return; }
    const st = Math.min(d, v * dt); if (!G.slide(g, dx / d * st, dy / d * st)) { g.x += dx / d * st; g.y += dy / d * st; }
    if (Math.abs(dx) > 2) g.face = dx > 0 ? 1 : -1; g.moving = true; g.step += dt * v / 34;
  };
  function rassembler() { // dans le noir : le chef est revenu au village en courant, tout le clan est sorti
    const S = CG.S, R = CG.R, p = S.player, f = G.firePos();
    p.x = f.x; p.y = f.y + 84; p.face = 1; R.dir = { x: 0, y: -1 }; G.unstick(p, 9);
    S.pets.forEach((o, i) => { if (o.follow && !o.ko) { o.x = p.x + (i % 2 ? 34 : -34); o.y = p.y + 14 + (i >> 1) * 12; o.path = null; } });
    clan().forEach((g, i, l) => { G.resetGoblin(g); g.cine = true; g.state = 'cine'; g.seis = { a: i / l.length * TAU, w: (i % 2 ? 1 : -1) * rand(1.5, 2.1), r: 92 + (i % 3) * 22 };
      g.x = f.x + Math.cos(g.seis.a) * g.seis.r; g.y = f.y + Math.sin(g.seis.a) * g.seis.r * 0.62; });
    CG.shuffle(clan()).slice(0, 8).forEach((g, i) => G.say(g, DITS[i % DITS.length], 3, 1 + i * 0.95));
  }
  // le faux Demon Lord et sa fausse escorte : ils sont là, immobiles, le temps que le chef leur parle
  function surgir(q) {
    const R = CG.R, f = G.firePos(); let c = null;
    for (let k = 0; k < 40 && !c; k++) { const a = -Math.PI / 2 + (k % 2 ? 1 : -1) * Math.floor(k / 2) * 0.16, d = 230 + (k % 3) * 24, x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d * 0.8; if (W.walkPx(x, y) && W.reachable(Math.floor(x / CG.TILE), Math.floor(y / CG.TILE))) c = { x, y }; }
    if (!c) c = { x: f.x, y: f.y - 150 };
    const faux = (type, x, y) => ({ type, x, y, face: f.x >= x ? 1 : -1, seed: Math.random() * 9, moving: false, step: 0, atkAnim: 0, hp: 1, maxhp: 1, r: 12, flash: 0, slow: 0 });
    q.c = c; q.faux = [faux('demonLord', c.x, c.y)]; q.eclat = [{ x: c.x, y: c.y, t: 0, r: 90 }];
    const n = 9 + Math.min(5, Math.floor(Math.max(0, CG.S.day - 30) / 2));
    for (let i = 0; i < n; i++) { const a = Math.PI + (i + 0.5) / n * Math.PI, d = 70 + (i % 3) * 34; let x = c.x + Math.cos(a) * d * 1.5, y = c.y + Math.sin(a) * d * 0.7 - 10; if (!W.walkPx(x, y)) { x = c.x + rand(-40, 40); y = c.y + rand(-20, 30); }
      q.faux.push(faux(i % 3 === 0 ? 'demon' : 'diablotin', x, y)); q.eclat.push({ x, y, t: 0.25 + i * 0.09, r: 30 }); }
    rouge(true); CG.sfx('horn');
    // le clan se serre au sud du feu ; le chef, lui, va passer devant
    clan().forEach((g, i) => { if (!g.seis) return; g.seis.abri = { x: f.x + ((i % 7) - 3) * 30 + rand(-8, 8), y: f.y + 62 + Math.floor(i / 7) * 26 + rand(-6, 6) }; g.seis.vers = c.x; });
    CG.shuffle(clan()).slice(0, 5).forEach((g, i) => G.say(g, ['UN DÉMON !!', 'Il est ÉNORME !', 'Chef !!', 'Maman...', 'Restez ensemble !'][i], 2.6, 0.6 + i * 0.5));
    const p = CG.S.player, cote = c.x >= f.x ? 1 : -1; q.pas = [{ x: f.x + cote * 78, y: f.y + 30 }, { x: f.x + cote * 60, y: f.y - 50 }, { x: f.x + (c.x - f.x) * 0.3, y: f.y + (c.y - f.y) * 0.42 }];
    void p;
  }
  const PAROLES = [
    ['???', '« QUI a réveillé mon portail ?! »', 'C\'est moi. Je suis le chef de ce clan.'],
    ['Demon Lord', '« Toi ? Un tout petit gobelin ? Ha ! Ha ! Ha ! Je suis le Demon Lord. Cette forêt est à moi, maintenant. »', 'Cette forêt, c\'est chez nous.'],
    ['Demon Lord', '« Alors donne-moi ton village... et je te laisse partir. »', 'Tu ne nous auras JAMAIS !']];
  function parler(q) {
    const P = PAROLES[q.i]; q.ouvert = true;
    UI.dialog({ visitor: { look: 'demonLord' }, who: P[0], tag: '', text: P[1], options: [{ label: '🗨️ ' + P[2], fn: () => { CG.sfx('ok'); } }] });
    if (UI.modal) UI.modal.closable = false;
  }
  function secoue(a) { const c = cv(); if (!c) return; c.style.transform = a > 0.05 ? 'translate(' + ((Math.random() - 0.5) * 2 * a).toFixed(1) + 'px,' + ((Math.random() - 0.5) * 2 * a).toFixed(1) + 'px) scale(1.03)' : ''; }
  function poussiere(n) { const R = CG.R, cam = R.cam, k = CG.viewScale ? CG.viewScale() : 1, vw = window.innerWidth / k, vh = window.innerHeight / k; for (let i = 0; i < n; i++) R.parts.push({ x: cam.x + Math.random() * vw, y: cam.y + Math.random() * vh, vx: rand(-20, 20), vy: rand(30, 90), life: rand(0.5, 1), max: 1, col: Math.random() < 0.5 ? '#b89a6a' : '#8a7a5a', size: rand(2, 4), float: true }); }
  function arrivee(q) {
    const S = CG.S, R = CG.R; fin();
    (q.faux || []).forEach((e, i) => { const v = G.spawnEnemy(e.type, e.x, e.y, { hunt: i === 0 || i % 2 === 1 }); if (v) { v.face = e.face; v.seed = e.seed; } if (i === 0) q.lord = v; });
    q.faux = null;
    R.event = { type: 'attack', kind: 'demons', exit: 'nord', quiet: true, demonLord: true, msg: ['☠ Le Demon Lord !', '« Alors je prends TOUT ! » Aux armes !'] };
    D.soundAlarm(); CG.sfx('attaque'); rouge(true);
    clan().forEach(g => { if (!g.hidden && Math.random() < 0.6) G.say(g, pick(['JAMAIS !', 'Avec le chef !', 'Pour le clan !', 'On reste ensemble !', 'Aux armes !']), 2.6, Math.random() * 1.2); });
  }
  function victoire(q) {
    const S = CG.S, R = CG.R, p = S.player; q.fini = true; q.t2 = 0; S.demon = { mort: true, jour: S.day }; rouge(false); if (CG.Diff && CG.Diff.noter) CG.Diff.noter();
    for (const e of R.enemies) if (e.event && !e.dead && e !== q.lord) { e.retreat = true; e.path = null; }
    if (!p.spells.includes('mondes')) p.spells.push('mondes'); delete p.scrolls.mondes;
    if (CG.SPELLS.antidote && !p.spells.includes('antidote') && !p.scrolls.antidote) p.scrolls.antidote = 1;
    G.puff(q.lord.x, q.lord.y - 30, '#c070ff', 50, 260, 6); for (let i = 0; i < 4; i++) R.rings.push({ x: q.lord.x, y: q.lord.y - 10, r: 80 + i * 60, life: 0.5 + i * 0.2, col: '#c070ff' });
    S.morale = Math.min(100, S.morale + 15); try { CG.save(); } catch (e) { /* rien */ }
  }
  function etape(q, dt) {
    const S = CG.S, R = CG.R; q.t += dt;
    if (q.ph !== 'combat') {
      const p = S.player;
      if (R.alarm || R.night || R.death || R.ko > 0 || !foret()) { fin(); rouge(false); R.seisme = null; return; } // autre chose a éclaté : ce sera pour une autre fois
      tenir(); R.atkCd = Math.max(R.atkCd, 0.4); R.castCd = Math.max(R.castCd, 0.4);
      const t = q.t; let a = 0;
      if (q.ph === 'portail') { // devant le portail : il s'allume, la terre se met à trembler, tout devient noir
        const o = Mo ? Mo.portailPos() : p; a = 3 + t * 3.2; R.fade = CG.clamp((t - 2.3) / 0.8, 0, 1);
        if ((q.son = (q.son || 0) - dt) <= 0) { q.son = 0.42; CG.sfx('fire'); R.rings.push({ x: o.x, y: o.y - 22, r: 50 + t * 34, life: 0.5, col: '#ff3a1a' }); G.puff(o.x, o.y - 26, '#ff5a2a', 10, 120, 4); }
        if (t >= 3.2) { rassembler(); q.ph = 'panique'; q.t = 0; a = 12; }
      } else if (q.ph === 'panique') { // au village : tout le monde court autour du feu
        R.fade = CG.clamp(1 - t / 0.9, 0, 1); a = t < 3.4 ? 12 * (t > 2.6 ? (3.4 - t) / 0.8 : 1) : t > 5.6 && t < 7.2 ? 7 * Math.sin((t - 5.6) / 1.6 * Math.PI) : 0;
        if (a > 2 && (q.son = (q.son || 0) - dt) <= 0) { q.son = 0.5; CG.sfx('fire'); }
        if (t >= 9.4) { q.ph = 'surgit'; q.t = 0; }
      } else if (q.ph === 'surgit') { // la grosse secousse, les éclairs : il est là
        a = t < 1.3 ? 17 * Math.min(1, t / 0.5) : Math.max(0, 9 * (1 - (t - 1.3) / 0.9));
        if (t >= 1.3 && !q.faux) surgir(q);
        if (q.eclat) q.eclat.forEach(e => { if (e.fait || t - 1.3 < e.t) return; e.fait = true; G.puff(e.x, e.y - 20, '#ff3a1a', e.r > 50 ? 26 : 10, e.r > 50 ? 200 : 120, 5); if (e.r > 50) { G.puff(e.x, e.y - 20, '#1a0a12', 18, 120, 6); for (let i = 0; i < 3; i++) R.rings.push({ x: e.x, y: e.y, r: e.r + i * 40, life: 0.45 + i * 0.16, col: i % 2 ? '#ffb030' : '#ff3a1a' }); } R.bolts.push({ x1: e.x + rand(-30, 30), y1: e.y - 620, x2: e.x, y2: e.y - 10, life: 0.35 }); });
        if (t >= 4.4) { q.ph = 'avance'; q.t = 0; }
      } else if (q.ph === 'avance') { // le chef passe devant les siens
        const w = q.pas[0]; if (!w) { q.ph = 'parle'; q.t = 0; q.i = 0; p.face = q.c.x >= p.x ? 1 : -1; }
        else { const dx = w.x - p.x, dy = w.y - p.y, d = Math.hypot(dx, dy), st = 95 * dt; if (d <= st + 2 || t > 9) q.pas.shift(); else { p.x += dx / d * st; p.y += dy / d * st; R.dir = { x: dx / d, y: dy / d }; if (Math.abs(dx) > 2) p.face = dx > 0 ? 1 : -1; q.marche = true; } }
      } else if (q.ph === 'parle') { // quelques mots, face à face
        const libre = !UI.modal || UI.modal === SCENE;
        if (q.ouvert && libre) { q.ouvert = false; q.i++; q.t = 0; if (q.i >= PAROLES.length) { q.ph = 'cri'; G.text(p.x, p.y - 74, 'JAMAIS !', '#ffe36b', true); CG.sfx('level'); } }
        else if (!q.ouvert && libre && t > 0.7) parler(q);
      } else if (q.ph === 'cri') { a = 4; if (t >= 1.3) { secoue(0); q.ph = 'combat'; q.t = 0; arrivee(q); return; } }
      secoue(a); if (a > 2 && Math.random() < dt * 30) poussiere(2);
      return;
    }
    if (q.ph === 'combat') {
      if (!q.fini && q.lord && (q.lord.dead || !R.enemies.includes(q.lord))) { if (q.lord.hp <= 0) victoire(q); else { rouge(false); R.seisme = null; } return; }
      if (q.fini) { q.t2 += dt; if (q.t2 > 5 && !q.dit) { q.dit = true; G.banner('Le Demon Lord est tombé !', 'Tu lui arraches un sort : Passage entre les mondes (🌀). Et au nord, son portail est resté ouvert...', '#e0b0ff'); CG.sfx('victory');
        setTimeout(() => UI.toast('📜 Sur lui, un parchemin : Antidote. Copie-le dans ton grimoire (G) : là où mène ce portail, tout est poison.'), 4500); R.seisme = null; } }
    }
  }
  const du0 = D.update; D.update = function (dt) {
    const r = du0.apply(this, arguments), R = CG.R, S0 = () => CG.S; if (!CG.S || !R) return r;
    if (R.seisme) etape(R.seisme, dt);
    else if (!S0().demonSigne && DL.pret() && !R.alarm && !R.night && !R.cine && !UI.modal) { S0().demonSigne = true; secoue(5); setTimeout(() => secoue(0), 700); CG.sfx('fire'); G.banner('Le sol a frémi...', 'Ça venait du nord.', '#ffb0a0'); }
    return r;
  };
  // le chef marche pendant la scène (le jeu, lui, le croit immobile)
  const gu0 = G.update; G.update = function (dt) {
    gu0.apply(this, arguments); const R = CG.R, q = R && R.seisme; if (!q || !q.marche) return; q.marche = false;
    const p = CG.S.player; p.moving = true; p.step += dt * 2.6;
  };
  // ---------- le portail endormi : on peut le toucher ; quand il est prêt, on peut l'activer ----------
  const pres = () => { if (!Mo) return null; const q = Mo.portailPos(), p = CG.S.player; return Math.hypot(p.x - q.x, p.y - (q.y + 24)) < 60 ? q : null; };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || R.seisme || S.demon || !foret() || R.ko > 0 || R.cine || R.build || (it && it.type !== 'home' && it.type !== 'sleep')) return it;
    const q = pres(); return q ? { type: 'portailDort', obj: { x: q.x, y: q.y - 24 }, label: DL.pret() ? 'Activer le portail' : 'Toucher le portail' } : it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'portailDort') return in0.apply(this, arguments);
    if (DL.pret()) return DL.lancer();
    CG.sfx('no'); UI.toast(CG.S.player.lvl < DL.NIVEAU ? 'La pierre est froide. Le portail dort... Il attend un chef plus fort.' : 'La pierre est froide. Le portail dort encore... Reviens dans quelques jours.');
  };
  // prêt : une lueur qui bat doucement dans l'arche
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!Mo || !CG.S || !(DL.pret() || (R.seisme && R.seisme.ph === 'portail'))) return;
    const q = Mo.portailPos(); if (!CG.onScreen(q.x, q.y)) return; const fort = R.seisme ? 1 : 0.45 + Math.sin(t * 2.2) * 0.2;
    const gr = g.createRadialGradient(q.x, q.y - 22, 2, q.x, q.y - 22, 34); gr.addColorStop(0, 'rgba(255,90,50,' + 0.75 * fort + ')'); gr.addColorStop(1, 'rgba(255,60,30,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(q.x, q.y - 22, 20, 34, 0, 0, TAU); g.fill();
  }; }
  // les faux démons de la scène, dessinés à leur place parmi les autres
  window.addEventListener('load', () => { if (!CG.Armee || !CG.Armee.pousser) return; const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) {
    po0.apply(this, arguments); const q = CG.R && CG.R.seisme; if (!q || !q.faux) return;
    q.faux.forEach((e, i) => { const e0 = q.eclat && q.eclat[i]; if (e0 && !e0.fait) return; push(e.y, 21, { x: e.x, y: e.y, draw: (g, o, t) => Art.enemy(g, e, t) }, null); });
  }; });
  // son portrait, dans la discussion
  { const vis0 = Art.visitor; Art.visitor = function (g, v, t) { if (v.look !== 'demonLord') return vis0.apply(this, arguments); g.save(); g.translate(0, 18); g.scale(0.62, 0.62); Art.enemy(g, { type: 'demonLord', x: 0, y: 0, face: 1, seed: 0, moving: false, step: 0, atkAnim: 0, slow: 0 }, t); g.restore(); }; }
  // le rouge ne reste pas si on recharge ou si on meurt
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); rouge(false); secoue(0); lacher(); CG.S.goblins.forEach(g => { if (g.seis) { g.seis = null; g.cine = false; } }); return r; };

  // ---------- son allure : immense, ailes noires, cornes d'or, les pieds dans les flammes ----------
  const en0 = Art.enemy; Art.enemy = function (g, e, t) {
    if (e.type !== 'demonLord') return en0.apply(this, arguments);
    const x = e.x, y = e.y, tt = t + e.seed;
    g.fillStyle = 'rgba(255,60,20,' + (0.2 + Math.sin(tt * 4) * 0.06) + ')'; g.beginPath(); g.ellipse(x, y + 2, 46, 17, 0, 0, TAU); g.fill();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + tt * 0.6, fx = x + Math.cos(a) * 34, fy = y + 2 + Math.sin(a) * 12, h = 12 + Math.sin(tt * 7 + i * 2) * 5; g.fillStyle = i % 2 ? '#ff7a1e' : '#ffcf3a'; g.beginPath(); g.moveTo(fx - 4, fy); g.quadraticCurveTo(fx - 5, fy - h * 0.5, fx, fy - h); g.quadraticCurveTo(fx + 5, fy - h * 0.5, fx + 4, fy); g.fill(); }
    Art.humanoid(g, { x, y, face: e.face, t: tt, moving: e.moving, step: e.step, atk: e.atkAnim, angry: true, skin: '#5a1422', tunic: '#1a0c14', legs: '#12080e', sleeve: '#5a1422', horns: '#ffcf5a', s: 1.95, eye: '#ffe36b', weapon: 'baton', glow: '#ff4a2a', cape: '#8a1616', ears: true, fangs: true, wings: 'rgba(30,6,12,0.94)' });
    const hy = y - 96; for (let i = -1; i <= 1; i++) { const h = 13 + Math.sin(tt * 9 + i) * 4; g.fillStyle = i ? '#ff7a1e' : '#ffe36b'; g.beginPath(); g.moveTo(x + i * 9 - 4, hy); g.quadraticCurveTo(x + i * 9, hy - h * 1.6, x + i * 9 + 4, hy); g.fill(); }
    if (e.slow > 0) { g.fillStyle = 'rgba(160,230,255,0.3)'; g.beginPath(); g.ellipse(x, y - 34, 26, 44, 0, 0, TAU); g.fill(); }
  };
  const css = document.createElement('style');
  css.textContent = '#dl-ciel{position:fixed;inset:0;z-index:5;pointer-events:none;opacity:0;transition:opacity 2.5s;background:radial-gradient(ellipse at 50% 45%,rgba(255,40,20,0) 35%,rgba(170,10,10,.38) 100%)}#dl-ciel.on{opacity:1}';
  document.head.appendChild(css);
})(window.CG);
