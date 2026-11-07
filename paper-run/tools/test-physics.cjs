#!/usr/bin/env node
// Tests de la physique et des règles (Node, sans navigateur). Usage : node tools/test-physics.cjs
'use strict';
const path = require('path');
const PR = require(path.join(__dirname, '..', 'js', 'physics.js'));
require(path.join(__dirname, '..', 'js', 'levels.js'));
// data.js s'attache à globalThis.PR quand window n'existe pas
require(path.join(__dirname, '..', 'js', 'data.js'));
const T = PR.PHYS.T;
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  ✖ ' + msg); } };
const mk = rows => PR.parseLevel({ id: 't', map: rows });
const run = (lvl, cfg, plan, maxT = 6) => {       // plan(t, st) → entrée ; renvoie l'état final et une trace
  const st = PR.newState(lvl), trace = []; let prevHeld = false;
  for (let t = 0; t < maxT; t += 1 / 60) {
    const inp = plan(t, st) || {}; const held = !!inp.jumpHeld;
    PR.step(st, { dir: inp.dir || 0, jump: held && !prevHeld, jumpHeld: held, dash: !!inp.dash }, 1 / 60, lvl, cfg); prevHeld = held;
    trace.push({ t, x: st.x, y: st.y, vy: st.vy, ground: st.ground }); if (st.win) break;
  }
  return { st, trace, minY: Math.min(...trace.map(p => p.y)) };
};
const base = PR.defaultCfg();

console.log('Mesures');
ok(PR.jumpHeight() / T > 3.2 && PR.jumpHeight() / T < 3.5, 'hauteur de saut ≈ 3,3 cases : ' + (PR.jumpHeight() / T).toFixed(2));
ok(PR.jumpRange() / T > 4.3, 'portée de saut > 4,3 cases : ' + (PR.jumpRange() / T).toFixed(2));

console.log('Course et saut');
{
  const lvl = mk(['.S..........F', '#############']);
  const r = run(lvl, base, () => ({ dir: 1 }));
  ok(r.st.win, 'on atteint le drapeau en courant à droite');
  ok(Math.abs(r.st.vx) <= PR.PHYS.RUN + 1, 'vitesse plafonnée à RUN');
}
{
  const lvl = mk(['.S.......F', '##########']);
  const r = run(lvl, base, t => ({ dir: 0, jumpHeld: t > 0.2 && t < 0.6 }));
  ok(r.minY < lvl.start.y - 3.2 * T + 2, 'saut plein : montée ≥ 3,2 cases (' + ((lvl.start.y - r.minY) / T).toFixed(2) + ')');
  const r2 = run(lvl, base, t => ({ dir: 0, jumpHeld: t > 0.2 && t < 0.25 }));
  ok(lvl.start.y - r2.minY < 2 * T, 'saut court (relâché tôt) : montée < 2 cases (' + ((lvl.start.y - r2.minY) / T).toFixed(2) + ')');
}
{
  // trou de 4 cases franchissable, trou de 6 non
  const gap = n => mk(['.S...' + '.'.repeat(n) + '....F', '#####' + '.'.repeat(n) + '#####']);
  const plan = (t, st) => ({ dir: 1, jumpHeld: st.x + st.w > 5 * T - 6 && t < 3 });
  ok(run(gap(4), base, plan).st.win, 'trou de 4 cases franchi');
  const r6 = run(gap(6), base, plan, 4); ok(!r6.st.win && r6.st.deaths >= 1, 'trou de 6 cases : chute (deaths=' + r6.st.deaths + ')');
}

console.log('Ressort, plateforme fine, double saut, plané');
{
  const lvl = mk(['.S..........', '............', '............', '............', '............', '............', '............', '............', '............', '...s........', '############']);
  const r = run(lvl, base, (t, st) => ({ dir: st.x < 3 * T + 4 ? 1 : 0 }), 4);
  const startFeet = 9 * T; ok((startFeet - (r.minY + PR.PHYS.H)) / T > 8, 'le ressort propulse à plus de 8 cases (' + ((startFeet - (r.minY + PR.PHYS.H)) / T).toFixed(1) + ')');
}
{
  const lvl = mk(['......', '.-----', '......', '.S....', '######']);
  const r = run(lvl, base, t => ({ dir: 0, jumpHeld: t > 0.1 && t < 0.5 }), 2);
  ok(r.minY < 1 * T - PR.PHYS.H + 1 && Math.abs(r.st.y - (1 * T - PR.PHYS.H)) < 1 && r.st.ground, 'plateforme fine : traversée par en dessous puis atterrissage dessus');
}
{
  const lvl = mk(['.S.......F', '##########']);
  const cfg = Object.assign(PR.defaultCfg(), { double: true });
  const r = run(lvl, cfg, t => ({ dir: 0, jumpHeld: (t > 0.1 && t < 0.5) || (t > 0.55 && t < 1.0) }), 2);
  ok((lvl.start.y - r.minY) / T > 5.5, 'double saut : montée > 5,5 cases (' + ((lvl.start.y - r.minY) / T).toFixed(2) + ')');
}
{
  const lvl = mk(['.S........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '##########']);
  const slow = run(lvl, Object.assign(PR.defaultCfg(), { glide: true }), t => ({ dir: 0, jumpHeld: t > 0.3 }), 6);
  const fast = run(lvl, base, () => ({ dir: 0 }), 6);
  const landT = r => r.trace.find(p => p.ground && p.t > 0.2); ok(landT(slow).t > landT(fast).t * 1.8, 'planer ralentit nettement la chute (' + landT(fast).t.toFixed(2) + ' s → ' + landT(slow).t.toFixed(2) + ' s)');
}

console.log('Élan, ruban collant, ciseaux');
{
  const lvl = mk(['.S........F', '###########']);
  const cfg = Object.assign(PR.defaultCfg(), { dashLevel: 1 });
  const r = run(lvl, cfg, t => ({ dir: 0, dash: t > 0.1 && t < 0.12 }), 1);
  ok(r.st.x - lvl.start.x > 90, 'un élan déplace de plus de 90 px (' + (r.st.x - lvl.start.x).toFixed(0) + ')');
}
{
  const lvl = mk(['.......#', '.......#', '.......#', '.......#', '.......#', '.......#', '.....S.#', '########']);
  const cfg = Object.assign(PR.defaultCfg(), { wall: true });
  const r = run(lvl, cfg, (t, st) => ({ dir: 1, jumpHeld: (t > 0.05 && t < 0.4) || (t > 0.8 && t < 1.0) }), 0.9);
  const slide = r.trace.filter(p => p.t > 0.5 && p.t < 0.75); ok(slide.length && slide.every(p => !p.ground && p.vy <= PR.PHYS.WALL_SLIDE + 1), 'glissade murale : vitesse de chute limitée');
  ok(r.st.vy < 0 && r.st.x < 7 * T - PR.PHYS.W - 4, 'saut mural : repousse loin du mur');
}
{
  const lvl = mk(['.S..%....F', '##########']);
  ok(!run(lvl, base, () => ({ dir: 1 }), 3).st.win, 'mur de papier : bloque sans ciseaux');
  const r = run(lvl, Object.assign(PR.defaultCfg(), { ciseaux: true }), () => ({ dir: 1 }), 3);
  ok(r.st.win && r.st.broken === 1, 'mur de papier : déchiré avec les ciseaux');
}

console.log('Dangers, drapeaux, plateformes mobiles');
{
  const lvl = mk(['.S..^...c.....^..F', '##################']);
  const r = run(lvl, base, () => ({ dir: 1 }), 1.2);
  ok(r.st.deaths === 1 && r.st.x < 3 * T, 'punaises : retour au départ');
  const r2 = run(lvl, base, (t, st) => ({ dir: 1, jumpHeld: st.x > 2 * T && st.x < 3.2 * T }), 5);
  ok(r2.st.cp === 0 && r2.st.deaths >= 1 && r2.st.x >= 7 * T, 'drapeau de passage pris, puis mort sur les 2es punaises : on revient au drapeau');
  const st = PR.newState(lvl); st.shield = 1; st.x = 4 * T + 10; PR.step(st, { dir: 0, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  ok(st.shield === 0 && st.deaths === 0, 'bouclier : encaisse un coup sans mourir');
}
{
  const lvl = mk(['.S........', '~~~~~~~~~~', '~~~~~~~~~~']);
  const st = PR.newState(lvl); st.y += 20; PR.step(st, { dir: 0, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  ok(st.deaths === 1, 'encre : mortelle dès qu’on y trempe les pieds');
}
{
  const lvl = mk(['.S..........', '##.m........', '##..........']);
  const r = run(lvl, base, (t, st) => ({ dir: st.x < 3.5 * T ? 1 : 0 }), 3);
  ok(r.st.carrier === 0 && r.st.x > 5 * T, 'plateforme mobile : nous transporte (x=' + (r.st.x / T).toFixed(1) + ' cases)');
}

console.log('Glace, tuyaux, canon');
{
  const lvl = mk(['.S..........F', 'IIIIIIIIIIIII', '#############']);
  const st = PR.newState(lvl); for (let i = 0; i < 60; i++) PR.step(st, { dir: 1, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  const v1 = st.vx; for (let i = 0; i < 20; i++) PR.step(st, { dir: 0, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  ok(st.ice && st.vx > v1 * 0.6, 'glace : on continue de glisser quand on lâche (' + v1.toFixed(0) + ' → ' + st.vx.toFixed(0) + ')');
  const st2 = PR.newState(lvl); for (let i = 0; i < 12; i++) PR.step(st2, { dir: 1, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  const g = mk(['.S..........F', '#############']); const st3 = PR.newState(g); for (let i = 0; i < 12; i++) PR.step(st3, { dir: 1, jump: false, jumpHeld: false, dash: false }, 1 / 60, g, base);
  ok(st2.vx < st3.vx * 0.6, 'glace : on accélère plus lentement');
}
{
  const lvl = mk(['...............', '.S.............', '##11##.....#..F', '##||##.....#####', '...............', '...............', '###############', '###########11##', '###############']);
  ok(lvl.pipes['1'] && lvl.pipes['1'].length === 2 && lvl.pipes['1'][0].w === 2 && lvl.pipes['1'][0].to === lvl.pipes['1'][1], 'tuyaux : deux rebords de 2 cases reliés');
  const st = PR.newState(lvl); for (let i = 0; i < 20; i++) PR.step(st, { dir: 1, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  const onRim = st.x >= 2 * T - 4 && st.x + st.w <= 4 * T + 4;
  for (let i = 0; i < 60; i++) PR.step(st, { dir: 0, jump: false, jumpHeld: false, dash: false, down: true }, 1 / 60, lvl, base);
  ok(onRim && st.warpT === 0 && Math.abs(st.y - (7 * T - st.h)) < 1 && st.x > 10 * T, 'flèche bas sur un tuyau : on ressort sur l’autre rebord (x=' + (st.x / 48).toFixed(1) + ', y=' + (st.y / 48).toFixed(1) + ')');
  ok(lvl.killY[0] === 7 * T || lvl.killY[0] > 8 * T, 'zone de chute mortelle calculée par colonne');
}
ok(PR.parseLevel({ id: 't', map: ['.S..C...F', '#########'] }).cannons.length === 1, 'canon reconnu dans la carte');
ok(PR.parseLevel({ id: 't', map: ['.S.j.k.g.a.p...F', '################'] }).enemies.map(e => e.kind).join() === 'jumper,spiky,eraser,spider,plant', 'cinq nouveaux ennemis reconnus');

console.log('Règles');
ok(PR.fmtTime(65.432) === '1:05.43' && PR.fmtTime(7.5) === '7.50', 'format du chrono');
ok(PR.CUPS.length === 5 && PR.CUPS.every(c => c.races.length === 4 && c.races.every(id => PR.levelById(id))), '5 coupes de 4 courses existantes');
ok(new Set(PR.CUPS.flatMap(c => c.races)).size === PR.LEVELS.length, 'chaque tableau est dans exactement une coupe');
ok(PR.LEVELS.every(l => PR.parseLevel(l).items.length >= 3), 'au moins 3 cubes d’objets par tableau');
{ const counts = {}; for (let i = 0; i < 4000; i++) { const id = PR.rollItem(4, () => (i % 1000) / 1000); counts[id] = (counts[id] || 0) + 1; } ok(counts.fusee > counts.boule && !counts.colle, 'objets du 4e : surtout des fusées, jamais de colle'); }
{ const lvl = mk(['.S.......F', '##########']); const st = PR.newState(lvl); PR.stun(st, 1); const r0 = st.x;
  for (let i = 0; i < 30; i++) PR.step(st, { dir: 1, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  ok(st.x - r0 < 5, 'étourdi : on ne bouge presque plus');
  const st2 = PR.newState(lvl); st2.boost = 4; for (let i = 0; i < 60; i++) PR.step(st2, { dir: 1, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  ok(st2.vx > PR.PHYS.RUN * 1.4, 'fusée : vitesse ×1,5 (' + st2.vx.toFixed(0) + ')');
  const st3 = PR.newState(lvl); st3.slow = 4; for (let i = 0; i < 60; i++) PR.step(st3, { dir: 1, jump: false, jumpHeld: false, dash: false }, 1 / 60, lvl, base);
  ok(st3.vx < PR.PHYS.RUN * 0.5, 'colle : vitesse ×0,45 (' + st3.vx.toFixed(0) + ')'); }
ok(PR.CHARACTERS.length === 15 && new Set(PR.CHARACTERS.map(c => c.id)).size === 15, '15 personnages uniques');
ok(PR.POWERS.every(p => p.cost.length === p.levels.length), 'chaque niveau de pouvoir a un prix');

console.log((fail ? '✖ ' : '✔ ') + pass + ' réussis, ' + fail + ' échoués');
process.exit(fail ? 1 : 0);
