#!/usr/bin/env node
// Rejoue dans le navigateur (headless) les actions trouvées par tools/test-course.cjs et vérifie la boucle complète :
// course → récompense + enregistrement, achats (récompense, clone), clones qui rapportent, saut mural → puits.
// Usage : OUT=/tmp/acts.json node tools/test-course.cjs && node tools/test-play.cjs /tmp/acts.json [capture.png]
'use strict';
const { execFileSync } = require('child_process'); const path = require('path'), fs = require('fs');
const [actsFile, png = '/tmp/paperloop-play.png'] = process.argv.slice(2);
const acts = fs.readFileSync(actsFile, 'utf8');
const script = `(async () => {
  const acts = ${acts}; const idle = { dir: 0, jump: false, jumpHeld: false, item: false };
  document.getElementById('btn-play').click(); document.querySelector('.char-card[data-id=eliott]').click();
  await new Promise(r => setTimeout(r, 1200));
  const g = PL.app.game, p = g.p, T = 48; g.freeze = true;
  // settle : quelques images sans commande à la fin (l'A* déclare la cible atteinte parfois en l'air, juste avant d'atterrir sur la tirelire)
  const play = (seq, x, y, settle = 0) => { g.st = Object.assign(PL.newState(g.lvl), { x, y }); g.run = null; let prev = false;   // on repart sans course en cours
    for (const [dir, held, dash] of seq) { for (let k = 0; k < 3; k++) g.update(1 / 60, { dir, jump: k === 0 && !!held && !prev, jumpHeld: !!held, item: false, dash: k === 0 && !!dash }); prev = !!held; }
    for (let i = 0; i < settle; i++) g.update(1 / 60, idle); };
  const M = g.machines;   // 0 saut mural, 1 clone UN, 2 récompense UN, 3 élan, 4 pièces en plus, 5 part des clones, 6 clone DEUX, 7 récompense DEUX
  const press = (m) => { Object.assign(g.st, { x: m.cx - 14, y: m.y + 4 * T - 56, vx: 0, vy: 0, ground: true, coyote: 0.1 }); g.update(1 / 60, Object.assign({}, idle, { jump: true, jumpHeld: true })); for (let i = 0; i < 40; i++) g.update(1 / 60, Object.assign({}, idle, { jumpHeld: true })); };   // on saute sous le bloc
  const un = p.courses.un, c1 = g.courses[0], c2 = g.courses[1];
  play(acts.course, 39 * T + 10, 30 * T - 56, 30);
  const r1 = { gold: p.gold, runs: un.runs, best: un.best && +un.best.toFixed(2), rec: !!un.rec, frames: un.rec && un.rec.f.length / 4, inRun: !!g.run };
  play(acts.back, 36 * T + 10, 19 * T - 56);   // la boucle : le trou à gauche de la tirelire ramène au pas de départ
  r1.backX = Math.round(g.st.x); r1.backY = Math.round(g.st.y); r1.looped = g.st.y === 30 * T - 56 && g.st.x > 33 * T && g.st.x < 40 * T && !g.run && un.runs === 1;
  p.gold += 100; press(M[2]); press(M[1]); press(M[1]);
  const r2 = { gold: p.gold, mult: un.mult, clones: un.clones, reward: PL.reward(p, c1.def) };
  for (let i = 0; i < 600; i++) g.update(1 / 60, idle);
  const r3 = { gold: p.gold, cloneT: c1.clones.map(c => +c.t.toFixed(2)) };
  p.gold += 700; press(M[0]); const wallCfg = g.cfg.wall;
  play(acts.shaft, 36 * T + 10, 19 * T - 56);
  const r4 = { wall: p.wall, cfg: wallCfg, y: Math.round(g.st.y), reachedTop: g.st.y < 6 * T, gold: p.gold };
  const bestBefore = un.best; play(acts.short, 39 * T + 10, 30 * T - 56, 30);   // le raccourci : la cheminée en saut mural
  const r5 = { runs: un.runs, best: un.best && +un.best.toFixed(2), shortcut: un.runs === 2 && un.best < bestBefore, inRun: !!g.run, gold: p.gold };
  // tableau 2 : course DEUX (voie basse), achats du hub 2, course avec élan, clones de la DEUX, retour par la cheminée
  const deux = p.courses.deux, g0 = p.gold;
  play(acts.course2, 74 * T + 10, 7 * T - 56, 30);
  const r6 = { runs: deux.runs, best: deux.best && +deux.best.toFixed(2), gained: +(p.gold - g0).toFixed(1), inRun: !!g.run, rec: !!deux.rec };
  p.gold += 4000000; press(M[3]); press(M[5]); press(M[6]); press(M[6]); press(M[7]); press(M[4]);
  const r7 = { dash: p.dash, cfg: g.cfg.dashLevel, cmult: p.cmult, cloneMult: PL.cloneMult(p), clones2: deux.clones, mult2: deux.mult, watts: p.watts, reward2: PL.reward(p, c2.def), cloneReward2: PL.cloneReward(p, c2.def) };
  const best2 = deux.best; play(acts.course2d, 74 * T + 10, 7 * T - 56, 30);
  const r8 = { runs: deux.runs, best: deux.best && +deux.best.toFixed(2), faster: deux.best < best2, inRun: !!g.run };
  const g1 = p.gold; for (let i = 0; i < 900; i++) g.update(1 / 60, idle);
  const r9 = { clonesGained: +(p.gold - g1).toFixed(1), income: +g.income().toFixed(2) };
  play(acts.back2, 79 * T + 10, 19 * T - 56); for (let i = 0; i < 60; i++) g.update(1 / 60, idle);   // la boucle : cheminée étroite → couloir du hub 2, à côté du puits
  const r10 = { tx: +(g.st.x / 48).toFixed(1), ty: +(g.st.y / 48).toFixed(1), atHub2: g.st.y <= 7 * T - 56 + 1 && g.st.x > 78 * T && g.st.x < 81 * T };
  // tableau 3 : couloirs à élan, course TROIS, achats du hub 3, retour par la sortie de la salle B
  const trois = p.courses.trois, c3 = g.courses[2], g2 = p.gold;
  play(acts.corr3, 139 * T + 10, 7 * T - 56);
  const r11 = { tx: +(g.st.x / 48).toFixed(1), ty: +(g.st.y / 48).toFixed(1), atHub3: g.st.x > 168 * T && g.st.y < 8 * T };
  play(acts.course3, 195 * T + 10, 7 * T - 56, 30);
  const r12 = { runs3: trois.runs, best3: trois.best && +trois.best.toFixed(2), gained: PL.fmtGold(p.gold - g2), inRun: !!g.run };
  p.gold += 1e12; press(M[8]); press(M[11]); press(M[12]); press(M[13]);
  const r13 = { double: p.double, cfg: g.cfg.double, speed: p.speed, chance: PL.fastChance(p), clones3: trois.clones, mult3: trois.mult, reward3: PL.fmtGold(PL.reward(p, c3.def)) };
  play(acts.back3, 193 * T + 10, 14 * T - 56); for (let i = 0; i < 60; i++) g.update(1 / 60, idle);
  const r14 = { tx: +(g.st.x / 48).toFixed(1), ty: +(g.st.y / 48).toFixed(1), atHub3: g.st.y <= 7 * T - 56 + 1 && g.st.x > 192 * T && g.st.x < 199 * T };
  document.title = JSON.stringify({ r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14 });
  g.snapCamera();
})()`;
const out = execFileSync('node', [path.join(__dirname, 'capture.cjs'), 'file://' + path.join(__dirname, '..', 'index.html'), png, '2500', '1400', '800', script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
console.log(out.trim());
