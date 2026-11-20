// Goblin Malin — le soir du jour 30 : la danse commence, la terre tremble, tout le monde se regarde... et le Demon Lord surgit avec sa petite armée.
// Le vaincre ouvre pour de bon le portail démoniaque du nord (voir mondes.js) et donne le sort Passage entre les mondes.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, DL = CG.DemonLord = { JOUR: 30, HEURE: 20.1 };
  const rand = CG.rand, pick = CG.pick, TAU = Math.PI * 2;
  CG.ENEMIES.demonLord = { nom: 'Demon Lord', race: 'demon', hp: 700, dmg: 17, spd: 72, xp: 600, or: 300, cost: 99, r: 24, boss: true, cadence: [3, 4.4], haut: 2.25 };
  CG.Boss.KIT.demonLord = ['pluie', 'nova', 'souffle', 'deluge', 'croix'];
  const DITS = ['Tu as senti ça ?!', 'C\'était quoi, ÇA ?!', 'La terre a bougé... non ?', 'Tu sais ce qui se passe, chef ?', 'J\'ai renversé ma chope !', 'Ça venait du nord...', 'Chut ! Écoutez...', 'J\'aime pas ça. J\'aime pas ça du tout.', 'Les tambours se sont tus tout seuls...', 'Regardez le ciel !'];
  const cv = () => document.getElementById('game');
  let ciel = null;
  function rouge(on) { if (!ciel) { ciel = document.createElement('div'); ciel.id = 'dl-ciel'; document.body.appendChild(ciel); } ciel.classList.toggle('on', !!on); }

  DL.pret = function () {
    const S = CG.S, R = CG.R; if (!S || !R || R.seisme || S.demon || (S.monde || 0) !== 0) return false;
    return S.day >= DL.JOUR && S.hour >= DL.HEURE && S.hour < 23.2 && R.feast && !R.event && !R.alarm && !R.night && !R.cine && !R.fadeDir && !(R.ko > 0);
  };
  DL.lancer = function () {
    const S = CG.S, R = CG.R, f = G.firePos(); R.seisme = { t: 0, ph: 'secousse' };
    (R.schedule || []).forEach(e => { if (e.type === 'attack') e.done = true; }); // pas d'autre attaque ce soir
    CG.sfx('warning'); if (UI.modal && !UI.modal.pauses) UI.close();
    const pres = CG.shuffle(S.goblins.filter(g => !g.hidden && CG.dist(g, f) < 520)).slice(0, 7);
    pres.forEach((g, i) => G.say(g, DITS[i % DITS.length], 3.2, 2.4 + i * 1.15));
    if (!pres.length) G.text(S.player.x, S.player.y - 70, '?!', '#ffe36b', true);
  };
  function secoue(a) { const c = cv(); if (!c) return; c.style.transform = a > 0.05 ? 'translate(' + ((Math.random() - 0.5) * 2 * a).toFixed(1) + 'px,' + ((Math.random() - 0.5) * 2 * a).toFixed(1) + 'px) scale(1.03)' : ''; }
  function poussiere(n) { const R = CG.R, cam = R.cam, k = CG.viewScale ? CG.viewScale() : 1, vw = window.innerWidth / k, vh = window.innerHeight / k; for (let i = 0; i < n; i++) R.parts.push({ x: cam.x + Math.random() * vw, y: cam.y + Math.random() * vh, vx: rand(-20, 20), vy: rand(30, 90), life: rand(0.5, 1), max: 1, col: Math.random() < 0.5 ? '#b89a6a' : '#8a7a5a', size: rand(2, 4), float: true }); }
  function arrivee(q) {
    const S = CG.S, R = CG.R, f = G.firePos(); let c = null;
    for (let k = 0; k < 40 && !c; k++) { const a = -Math.PI / 2 + (k % 2 ? 1 : -1) * Math.floor(k / 2) * 0.16, d = 250 + (k % 3) * 24, x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d * 0.8; if (W.walkPx(x, y) && W.reachable(Math.floor(x / CG.TILE), Math.floor(y / CG.TILE))) c = { x, y }; }
    if (!c) c = { x: f.x, y: f.y - 120 };
    const eclat = (x, y, r) => { G.puff(x, y - 20, '#ff3a1a', 26, 200, 5); G.puff(x, y - 20, '#1a0a12', 18, 120, 6); for (let i = 0; i < 3; i++) R.rings.push({ x, y, r: r + i * 40, life: 0.45 + i * 0.16, col: i % 2 ? '#ffb030' : '#ff3a1a' }); R.bolts.push({ x1: x + rand(-30, 30), y1: y - 620, x2: x, y2: y - 10, life: 0.35 }); };
    const lord = G.spawnEnemy('demonLord', c.x, c.y, { hunt: true }); eclat(c.x, c.y, 90); q.lord = lord;
    const n = 9 + Math.min(5, Math.floor((S.day - DL.JOUR) / 2));
    for (let i = 0; i < n; i++) { const a = Math.PI + (i + 0.5) / n * Math.PI, d = 70 + (i % 3) * 34; let x = c.x + Math.cos(a) * d * 1.5, y = c.y + Math.sin(a) * d * 0.7 - 10; if (!W.walkPx(x, y)) { x = c.x + rand(-40, 40); y = c.y + rand(-20, 30); }
      G.spawnEnemy(i % 3 === 0 ? 'demon' : 'diablotin', x, y, { hunt: i % 2 === 0 }); G.puff(x, y - 16, '#ff3a1a', 10, 120, 4); }
    R.event = { type: 'attack', kind: 'demons', exit: 'nord', quiet: true, demonLord: true, msg: ['☠ Le Demon Lord !', '« Votre petit feu m\'a réveillé, peaux vertes. Je viens l\'éteindre. » Aux armes !'] };
    D.soundAlarm(); CG.sfx('attaque'); rouge(true);
    S.goblins.forEach(g => { if (!g.hidden && Math.random() < 0.5) G.say(g, pick(['UN DÉMON !!', 'Aux armes !', 'Protège-nous, chef !', 'Il est ÉNORME !', 'Courez !']), 2.6, Math.random() * 1.5); });
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
    if (q.ph === 'secousse') {
      const t = q.t, a = t < 4.4 ? 13 * Math.sin(Math.min(1, t / 0.5) * Math.PI / 2) * (t > 3.4 ? (4.4 - t) : 1) : t > 7.2 && t < 9 ? 7 * Math.sin((t - 7.2) / 1.8 * Math.PI) : t > 10.6 ? 16 * Math.min(1, (t - 10.6) / 0.6) : 0;
      secoue(a); if (a > 2 && Math.random() < dt * 30) poussiere(2); if (a > 2 && (q.son = (q.son || 0) - dt) <= 0) { q.son = 0.5; CG.sfx('fire'); }
      if (R.alarm || R.night) { secoue(0); R.seisme = null; return; } // une autre alerte a éclaté entre-temps : ce sera pour un autre soir
      if (t >= 11.6) { secoue(0); q.ph = 'combat'; arrivee(q); }
      return;
    }
    if (q.ph === 'combat') {
      if (!q.fini && q.lord && (q.lord.dead || !R.enemies.includes(q.lord))) { if (q.lord.hp <= 0) victoire(q); else { rouge(false); R.seisme = null; } return; }
      if (q.fini) { q.t2 += dt; if (q.t2 > 5 && !q.dit) { q.dit = true; G.banner('Le Demon Lord est tombé !', 'Tu lui arraches un sort : Passage entre les mondes (🌀). Et au nord, son portail est resté ouvert...', '#e0b0ff'); CG.sfx('victory');
        setTimeout(() => UI.toast('📜 Sur lui, un parchemin : Antidote. Copie-le dans ton grimoire (G) : là où mène ce portail, tout est poison.'), 4500); R.seisme = null; } }
    }
  }
  const du0 = D.update; D.update = function (dt) {
    const r = du0.apply(this, arguments), R = CG.R; if (!CG.S || !R) return r;
    if (R.seisme) etape(R.seisme, dt); else if (DL.pret()) DL.lancer();
    return r;
  };
  // le rouge ne reste pas si on recharge ou si on meurt
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); rouge(false); secoue(0); return r; };

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
