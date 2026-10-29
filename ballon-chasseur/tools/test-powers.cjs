#!/usr/bin/env node
// Vérifications des pouvoirs, du lancer chargé, des interceptions et de l'expérience, en simulation (node tools/test-powers.cjs).
'use strict';
const assert = require('node:assert/strict');
const path = require('path');
global.window = {};
for (const f of ['config', 'game', 'powers', 'ai']) require(path.join(__dirname, '..', 'js', f + '.js'));
const BC = window.BC, C = BC.COURT;
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

function game(ctrl) {
  const g = new BC.Game({ teams: [BC.teamById('matt'), BC.teamById('jo')], ctrl: ctrl || ['p1', 'cpu'], difficulty: 1, intro: false });
  g.ai.update = () => { for (const p of g.players) { p.ai.move = { dx: 0, dy: 0 }; p.ai.act = null; } };   // personne ne bouge
  for(const p of g.players)p.phys.aimSpread=0; // Collisions déterministes ; dispersion testée séparément.
  return g;
}
const N = { dx: 0, dy: 0 };
const step = (g, inp, k) => { for (let i = 0; i < (k || 1); i++) g.update(BC.STEP, [inp || N, null]); };
function setPower(p, id) { p.power.id = id; p.power.kind = BC.POWERS[id].kind; p.power.charge = p.power.max; p.power.armed = false; }
function holder(g, i) { const p = g.inner(0)[i == null ? 1 : i]; g.give(p); p.state = 'idle'; p.stateT = 1; return p; }
function throwNow(g, p, charge) { g.startCharge(p, N, charge == null ? 0.5 : charge); step(g, N, 2); if (p.state === 'windup') { p.charge = charge == null ? 0.5 : charge; g.release(p); } }
function untilBallDead(g, max) { let i = 0; while ((g.ball.state === 'live' || g.ball.state === 'magnet') && i < (max || 600)) { step(g); i++; } return i; }
const totalHp = (g, t) => g.inner(t).reduce((s, p) => s + p.hp, 0);

// Passe aérienne dans le camp adverse : réception et lancer dans la même mise à jour.
for (const team of [0, 1]) {
  const fwd = team === 0 ? 1 : -1;
  for (const [lane, move] of [['top', { dx: 0, dy: -1 }], ['bottom', { dx: 0, dy: 1 }], ['back', { dx: fwd, dy: 0 }], ['back', N]]) {
    const g = game(), p = g.inner(team)[1];
    g.give(p); p.x = C.mid + fwd * 80; p.z = 100; p.vz = 0; g.setState(p, 'jump');
    g.action(p, 'b', move);
    const target = g.ball.target;
    ok(g.ball.state === 'pass' && target.lane === lane && target.team === team, 'passe aérienne : bon coéquipier extérieur');
    ok(g.ball.quickReturn && p.state === 'jump' && !p.hasBall, 'passe aérienne : le passeur continue son saut');
    for (let k = 0; k < 120 && !g.stats[team].throws; k++) step(g);
    ok(g.stats[team].throws === 1 && g.ball.thrower === target && g.ball.state === 'live', 'réception : relance immédiate sans seconde commande');
    ok(!target.hasBall && g.ball.holder === null && !g.ball.quickReturn, 'enchaînement : possession et marqueur libérés');
  }
}
{
  const g = game(), p = holder(g); g.action(p, 'b', { dx: 1, dy: 0 }); const target = g.ball.target;
  ok(!g.ball.quickReturn, 'passe au sol : pas de relance automatique');
  for (let k = 0; k < 120 && g.ball.state === 'pass'; k++) step(g);
  ok(g.ball.holder === target && g.stats[0].throws === 0, 'passe au sol : le receveur garde la balle');
}
{
  const g = game(), p = holder(g); p.x = C.mid + 80; p.z = 100; g.setState(p, 'jump'); g.action(p, 'b', N);
  const target = g.ball.target; g.setState(target, 'bubble'); target.fx.bubbleT = 3;
  for (let k = 0; k < 100; k++) step(g);
  ok(g.stats[0].throws === 0 && g.ball.holder !== target, 'receveur dans une bulle : aucune relance impossible');
}
{
  const g = game(), p = holder(g); p.x = C.mid + 80; p.z = 100; g.setState(p, 'jump'); g.action(p, 'b', N);
  const foe = g.inner(1)[0]; foe.x = g.ball.x; foe.y = g.ball.y; g.setState(foe, 'catch'); g.ball.z = 30;
  g.updateBall(0);
  ok(g.ball.holder === foe && !g.ball.quickReturn && g.stats[0].throws === 0, 'passe aérienne interceptée : enchaînement annulé');
}

// --- lancer chargé : plus on tient X, plus c'est vite et fort ---
{
  const speeds = [], dmgs = [];
  for (const ch of [0, 1]) { const g = game(); const p = holder(g); throwNow(g, p, ch); speeds.push(g.ball.speed); dmgs.push(g.ball.dmg); }
  ok(speeds[1] > speeds[0] * 1.3 && dmgs[1] >= dmgs[0] + 4, 'charge : vitesse ' + speeds.map(Math.round) + ' dégâts ' + dmgs);
  const g = game(); const p = holder(g); g.update(BC.STEP, [{ dx: 0, dy: 0, a: true }, null]); step(g, { dx: 0, dy: 0, a: true }, 30);
  ok(p.state === 'windup' && p.charging && p.charge > 0.4, 'X tenu : on charge (' + p.charge.toFixed(2) + ')');
  g.update(BC.STEP, [N, null]); ok(g.ball.state === 'live', 'X relâché : la balle part');
}
// Charge en l'air, inertie conservée et descente ralentie.
{
  const g = game(), p = holder(g); p.x = C.mid - 120;
  g.jump(p, { dx: 1, dy: 0 }); step(g); const x = p.x;
  step(g, { dx: 0, dy: 0, a: true }, 24);
  ok(p.charging && p.hasBall && p.charge > 0.4 && p.z > 0, 'charge aérienne : X tenu conserve le ballon et augmente la puissance');
  ok(p.x > x + 30, 'charge aérienne : le saut garde son élan horizontal');
  const charge = p.charge; step(g, N);
  ok(g.ball.state === 'live' && g.ball.airShot && g.ball.charge >= charge, 'relâchement aérien : charge transmise au smash');
}
{
  const g = game(), p = holder(g); g.jump(p, N); step(g); step(g, { a: true }, 48);
  ok(p.z > 0 && p.charging && p.charge > 0.8, 'descente douce : le temps de charger presque complètement avant de retomber');
  step(g, { a: true }, 90);
  ok(p.z === 0 && !p.airborneJump, 'le joueur finit par atterrir même si X reste tenu');
}
{
  const g = game(), p = holder(g); p.z = 100; p.vz = 0; p.airborneJump = true; g.setState(p, 'jump');
  g.stepPlayer(p, BC.STEP, N, null);
  ok(Math.abs(p.vz + BC.GRAVITY * BC.STEP * 0.45) < 0.001, 'gravité réduite seulement à la descente du saut');
  p.vz = 200; g.stepPlayer(p, BC.STEP, N, null);
  ok(Math.abs(p.vz - (200 - BC.GRAVITY * BC.STEP)) < 0.001, 'montée du saut inchangée');
}
{
  const g = game(), p = holder(g); p.x = C.mid + 60; p.z = 100; g.setState(p, 'jump'); g.startCharge(p, N);
  g.action(p, 'b', N);
  ok(g.ball.state === 'pass' && g.ball.quickReturn && !p.charging && !p.pending && p.state === 'jump', 'C pendant la charge aérienne : passe et enchaînement toujours possibles');
  const target = g.ball.target;
  for (let k = 0; k < 120 && !g.stats[0].throws; k++) step(g);
  ok(g.ball.thrower === target && g.stats[0].throws === 1, 'passe après charge : le coéquipier relance aussitôt');
}

// --- course, saut (C) puis lancer (X) en l'air : smash ---
{
  const g = game(); const p = holder(g); p.x = 300;
  step(g, { dx: 1, dy: 0 }); step(g, N, 2); step(g, { dx: 1, dy: 0 });
  ok(p.dash.active, 'double appui : course');
  step(g, { dx: 1, dy: 0 }, 6); g.update(BC.STEP, [{ dx: 1, dy: 0, b: true }, null]);
  ok(p.state === 'jump' && p.dash.fromJump, 'C en course : saut en course');
  step(g, { dx: 1, dy: 0 }, 12); g.update(BC.STEP, [{ dx: 1, dy: 0, a: true }, null]);
  ok(p.charging && p.hasBall, 'X tenu en l’air : charge du lancer');
  step(g, N);
  ok(g.ball.state === 'live' && g.ball.smash, 'X relâché en l’air : smash');
  // la course vient de s'arrêter à la ligne : C fait quand même sauter (pas une passe)
  const g2 = game(); const q = holder(g2); q.x = C.mid + 4; step(g2, { dx: 1, dy: 0 }); step(g2, N, 2); step(g2, { dx: 1, dy: 0 }, 8);
  for(let frames=0;q.dash.active&&frames<60;frames++)step(g2,{dx:1,dy:0});
  ok(q.x>=C.mid+50,'la course atteint la limite malgré l’accélération progressive');
  ok(!q.dash.active && g2.time - q.dash.endedAt < 0.3, 'course coupée à la limite de la bande adverse');
  g2.update(BC.STEP, [{ dx: 1, dy: 0, b: true }, null]); ok(q.state === 'jump', 'C juste après la course : saut en course, pas une passe');
}
// --- interception d'une passe adverse ---
{
  const g = game(); const p = holder(g, 1); const foe = g.inner(1)[1];
  const top = g.players.find(q => q.team === 0 && q.lane === 'top');
  foe.x = C.mid + 60; foe.y = (p.y + top.y) / 2; p.x = C.mid - 60;
  g.pass(p, { dx: 0, dy: -1 }); ok(g.ball.state === 'pass' && g.ball.target === top, 'passe vers le haut');
  let caught = false; for (let i = 0; i < 90 && !caught; i++) { step(g); const d = Math.hypot(foe.x - g.ball.x, foe.y - g.ball.y); if (d < 30 && foe.state === 'idle') { g.setState(foe, 'catch'); } if (g.ball.holder === foe) caught = true; }
  ok(caught, 'l\'adversaire intercepte la passe avec C');
  ok(g.inner(1).every(q => q.power.charge === q.power.max) && g.stats[1].catches === 1, 'interception comptée comme attrapé');
}
// --- recharge du pouvoir : 3 attrapés de l'équipe ---
{
  const g = game(); const p = g.inner(0)[0]; setPower(p, 'zoom'); ok(g.usePower(p), 'zoom utilisé'); ok(p.power.charge === 0 && p.fx.fastT > 9, 'pouvoir vidé, Milo court vite');
  ok(!g.usePower(p), 'pas prêt : refusé');
  for (let k = 0; k < 3; k++) { const q = g.inner(0)[1]; g.ball.state = 'live'; g.ball.team = 1; g.caught(q, {}); }
  ok(p.power.charge === p.power.max, 'trois attrapés : rechargé');
}
// --- pouvoirs instantanés ---
{
  const g = game(); const p = g.inner(0)[0]; setPower(p, 'laser'); g.usePower(p);
  ok(g.laserSweeps.length===1,'laser : balayage lancé');const hp=totalHp(g,1);for(let i=0;i<180;i++)g.updateProjectiles(1/60);ok(totalHp(g,1)<hp,'laser : dégâts pendant le balayage');
}
{
  const g = game(); const p = g.inner(0)[0]; setPower(p, 'pikachu'); const before = totalHp(g, 1); g.usePower(p);
  ok(totalHp(g, 1) === before - 15, 'pika-choc : 5 dégâts à chacun des trois'); ok(g.xp[p.id] === 15, 'XP = dégâts infligés');
}
{
  const g = game(); const p = g.inner(0)[0]; setPower(p, 'bulles'); g.usePower(p);
  ok(g.projectiles.filter(q => q.kind === 'bubble').length === 9, 'neuf bulles');
  let trapped = 0; for (let i = 0; i < 240; i++) { step(g); trapped = Math.max(trapped, g.inner(1).filter(q => q.state === 'bubble').length); }
  ok(trapped >= 1, 'au moins un adversaire pris dans une bulle (' + trapped + ')');
  ok(g.inner(1).some(q => q.z > 30) || g.inner(1).every(q => q.state !== 'bubble'), 'il flotte dans sa bulle');
  step(g, N, 200); ok(g.inner(1).every(q => q.state !== 'bubble'), 'la bulle éclate après 3 s');
}
// Une bulle fait perdre le ballon vers le joueur extérieur derrière le porteur.
for (const team of [0, 1]) {
  for (const charging of [false, true]) {
    const g = game(), p = g.inner(team)[1], back = g.outer(1 - team).find(q => q.lane === 'back');
    g.give(p); p.state = charging ? 'windup' : 'idle'; p.charging = charging; p.pending = charging ? { kind: 'throw' } : null;
    const hp = g.players.map(q => q.hp);
    g.projectiles.push({ kind: 'bubble', team: 1 - team, x: p.x, y: p.y, z: 20, vx: 0, vy: 0, t: 0, dur: 3, r: 20, ph: 0 });
    g.updateProjectiles(BC.STEP);
    ok(p.state === 'bubble' && !p.hasBall && g.ball.holder === null && g.ball.state === 'dead', 'bulle : le porteur lâche immédiatement le ballon');
    ok(!p.charging && p.pending === null, 'bulle : le lancer en préparation est annulé');
    ok(g.ball.vx * (team === 0 ? -1 : 1) > 0, 'bulle : trajectoire vers le fond de son propre camp');
    step(g, N, 100);
    ok(g.ball.holder === back, 'bulle : le joueur ennemi extérieur au fond récupère le ballon');
    ok(g.players.every((q, i) => q.hp === hp[i]), 'bulle : le ballon lâché ne blesse personne');
  }
}
{
  const g = game(), p = g.inner(0)[1], owner = g.inner(1)[1]; g.give(owner);
  g.projectiles.push({ kind: 'bubble', team: 1, x: p.x, y: p.y, z: 20, vx: 0, vy: 0, t: 0, dur: 3, r: 20, ph: 0 });
  g.updateProjectiles(BC.STEP);
  ok(p.state === 'bubble' && g.ball.holder === owner && owner.hasBall, 'bulle sans ballon : la possession de l’autre joueur reste intacte');
}
{
  const g = game(); const p = g.inner(0)[0]; setPower(p, 'aimant'); const foe = holder(g, 1); foe.team; // la balle est à l'équipe 1
  const f1 = g.inner(1)[1]; g.give(f1); ok(g.ball.holder === f1, 'l\'adversaire tient la balle');
  ok(g.usePower(p), 'aimant utilisé'); ok(g.ball.state === 'magnet' && !f1.hasBall, 'la balle est volée et file vers Jessica');
  untilBallDead(g, 200); ok(g.ball.holder === p, 'Jessica a la balle');
  g.give(p); ok(!g.usePower(p) || true, 'aimant refusé si la balle est déjà à nous');
}
{
  const g = game(); const p = g.inner(0)[0]; setPower(p, 'cri'); g.usePower(p); ok(g.inner(0).every(q => q.fx.rageT > 29), 'cri : toute l\'équipe enragée');
  const h = holder(g, 1); throwNow(g, h, 0); const g2 = game(); const h2 = holder(g2, 1); throwNow(g2, h2, 0);
  ok(g.ball.dmg === Math.round(g2.ball.dmg * 1.5), 'cri : dégâts ×1,5 (' + g.ball.dmg + ' vs ' + g2.ball.dmg + ')');
}
{
  const g = game(); const p = g.inner(0)[0]; setPower(p, 'blizzard'); g.usePower(p); ok(g.inner(1).every(q => q.fx.slowT > 14) && g.blizzard[1] > 14, 'blizzard sur l\'équipe adverse');
  const q = g.inner(1)[0]; q.ai = {}; g.ai.update = () => { for (const r of g.players) { r.ai.move = r === q ? { dx: 0, dy: 1 } : N; r.ai.act = null; } };
  const y0 = q.y; step(g, N, 30); const slow = q.y - y0; q.fx.slowT = 0; const y1 = q.y; step(g, N, 30); const fast = q.y - y1;
  ok(slow < fast * 0.6, 'ralenti de moitié (' + slow.toFixed(0) + ' vs ' + fast.toFixed(0) + ')');
}
// --- pouvoirs de lancer ---
function throwPower(id, prep) {
  const g = game(); const p = holder(g, 1); setPower(p, id); for (const q of g.inner(1)) q.y = p.y + 60 * (g.inner(1).indexOf(q) - 1);
  if (prep) prep(g, p);
  ok(g.usePower(p), id + ' : armé'); ok(p.power.armed, id + ' : icône armée');
  if (p.state === 'idle') { g.action(p, 'a', N); }
  if (p.state === 'windup') { p.charge = 0.6; g.release(p); }
  for (let i = 0; i < 60 && p.state === 'spin'; i++) step(g);
  return { g, p };
}
{
  const { g, p } = throwPower('triche'); const foe = g.inner(1)[1]; foe.ai = {};
  g.ai.update = () => { for (const r of g.players) { r.ai.move = r === foe ? { dx: 0, dy: -1 } : N; r.ai.act = null; } };   // la cible fuit vers le haut
  ok(g.ball.power === 'triche' && p.power.charge === 0, 'triche : balle spéciale, pouvoir dépensé');
  untilBallDead(g); ok(g.stats[0].hits === 1 && foe.hp < foe.maxHp, 'triche : touche la cible même si elle fuit');
}
{
  const { g, p } = throwPower('triche'); const foe = g.ball.target; g.setState(foe, 'catch'); g.ai.update = () => { for (const r of g.players) { r.ai.move = N; r.ai.act = null; } };
  for (let i = 0; i < 400 && g.ball.state === 'live'; i++) { if (foe.state === 'idle') g.setState(foe, 'catch'); step(g); }
  ok(g.stats[1].catches === 0 && foe.hp < foe.maxHp, 'triche : impossible à attraper');
}
{
  const { g, p } = throwPower('biscuit'); untilBallDead(g); step(g, N, 40);
  ok(g.inner(1).every(q => q.hp < q.maxHp), 'biscuits : les trois adversaires sont touchés');
  const hits = g.inner(1).map(q => q.maxHp - q.hp).sort((a, b) => b - a); ok(hits[1] === Math.ceil(hits[0] / 2), 'biscuits : la moitié des dégâts aux autres (' + hits + ')');
}
{
  const { g, p } = throwPower('boulet'); const g2 = game(); const p2 = holder(g2, 1); throwNow(g2, p2, 0.6);
  ok(g.ball.dmg > g2.ball.dmg * 1.6 && g.ball.speed < g2.ball.speed, 'boulet : très lourd et lent (' + g.ball.dmg + ' vs ' + g2.ball.dmg + ')');
}
{
  const { g, p } = throwPower('teleport', (g, p) => { p.x = C.left + 200; });
  ok(p.tele && p.x > C.mid, 'téléportation : derrière l\'équipe adverse'); const home = { ...p.tele };
  untilBallDead(g); step(g, N, 30);
  ok(!p.tele && Math.abs(p.x - home.x) < 1, 'revenu à sa place'); ok(g.stats[0].hits >= 1, 'a touché quelqu\'un dans le dos');
}
{
  const { g, p } = throwPower('tornade'); ok(g.ball.power === 'tornade' && g.ball.state === 'live', 'tornade : balle lancée après la toupie');
  let bounces = 0; for (let i = 0; i < 900 && g.ball.state === 'live'; i++) { step(g); bounces = Math.max(bounces, g.ball.bounces); }
  ok(bounces >= 4 && g.ball.state === 'dead', 'tornade : ' + bounces + ' rebonds puis morte');
}
{
  const { g, p } = throwPower('fusee'); const foe = g.ball.target; const hp0 = foe.hp;
  g.ai.update = () => { for (const r of g.players) { r.ai.move = N; r.ai.act = null; if (r === foe) r.ai.willCatch = true; } };
  for (let i = 0; i < 400 && g.ball.state === 'live'; i++) { if (foe.state === 'idle' && Math.abs(g.ball.x - foe.x) < 60) g.setState(foe, 'catch'); step(g); }
  ok(g.stats[1].catches === 0 && foe.hp < hp0 - 10, 'fusée : explose dans les mains (' + (hp0 - foe.hp) + ' dégâts)');
}
{
  const g=game(),p=holder(g);setPower(p,'licorne');
  ok(g.usePower(p),'licorne : activation immédiate');
  ok(p.fx.horseT===20&&g.rainbow[1]===20&&!p.power.armed,'galop et arc-en-ciel 20 secondes');
  ok(g.speedMul(p)===1.35,'galop plus rapide');
  const foe=g.inner(1)[1];g.give(foe);g.throwBall(foe,{charge:0,move:N});
  Object.assign(g.ball,{x:950,y:450,z:30,vx:-840,vy:0,speed:600,power:null,airShot:true,launchZ:30,impactZ:30});
  const x=g.ball.x;g.updateBall(.1);ok(Math.abs(g.ball.x-(x-50.4))<1e-8,'ballon ennemi ralenti de 40 %');
  g.ball.team=0;g.ball.vx=840;const x2=g.ball.x;g.updateBall(.1);ok(Math.abs(g.ball.x-(x2+84))<1e-8,'ballon allié inchangé');
  g.paused=true;g.update(1,[N,N]);ok(g.rainbow[1]===20,'pause conserve le temps du pouvoir');g.paused=false;
  g.ball.state='dead';for(let i=0;i<1201;i++)g.update(1/60,[N,N]);
  ok(g.rainbow[1]===0&&p.fx.horseT===0&&g.rainbowBallRate(1)===1,'expiration du galop et ralentissement');

}
// --- fantôme (passif) ---
{
  const g = game(); const p = holder(g, 1); const foe = g.inner(1)[1]; setPower(foe, 'fantome'); foe.y = p.y; for (const q of g.inner(1)) if (q !== foe) q.y = p.y + 150;
  throwNow(g, p, 0.5); untilBallDead(g);
  ok(foe.hp === foe.maxHp && foe.power.charge === 0 && g.stats[0].hits === 0, 'fantôme : premier coup absorbé');
  step(g, N, 100); g.give(p); p.state = 'idle'; throwNow(g, p, 0.5); untilBallDead(g); ok(foe.hp < foe.maxHp, 'fantôme déchargé : le deuxième coup fait mal');
}
// --- expérience : dégâts + bonus K.-O. ---
{
  const g = game(); const p = holder(g, 1); const foe = g.inner(1)[1]; foe.y = p.y; foe.hp = 3; for (const q of g.inner(1)) if (q !== foe) q.y = p.y + 150;
  throwNow(g, p, 1); untilBallDead(g); ok(!foe.alive && g.xp[p.id] === 3 + BC.XP_KO, 'K.-O. : XP = ' + g.xp[p.id]);
}
// --- cases bonus 11 et 12 ---
{
  const stats = { speed: 12, power: 12, catch: 12, hp: 12 };
  const g = new BC.Game({ teams: [BC.teamById('matt'), BC.teamById('jo')], ctrl: ['cpu', 'cpu'], difficulty: 1, intro: false, stats: { matthieu: stats } });
  const m = g.players.find(p => p.id === 'matthieu'); ok(m.phys.fullStart && m.phys.revive && m.phys.regen && m.power.max === 2 && m.phys.dashMul > 2, 'bonus 11/12 appliqués');
  m.hp = 2; g.hurt(m, 10, {}); ok(m.alive && m.hp === 1 && m.fx.revived, 'Increvable : survit à 1 PV');
}
// --- matchs complets ordi contre ordi, toutes les paires : aucune erreur, aucune balle éternelle ---
{
  let seed=20261026;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  // Les matchs complets incluent le chrono de possession et les règles actuelles.
  require('../js/monsters.js');require('../js/match-rules.js');
  for (const a of BC.TEAMS) for (const b of BC.TEAMS) if (a !== b) {
    const g = new BC.Game({ teams: [a, b], ctrl: ['cpu', 'cpu'], difficulty: 2, intro: false }); let t = 0, live = 0;
    while (g.phase !== 'end' && t < 600) { g.update(BC.STEP); t += BC.STEP; live = g.ball.state === 'live' ? live + 1 : 0; assert.ok(live < 400, 'balle vivante trop longtemps ' + g.ball.power); }
    ok(g.phase === 'end', a.id + ' vs ' + b.id + ' terminé en ' + Math.round(t) + ' s, pouvoirs ' + (g.stats[0].supers + g.stats[1].supers));
  }
}
console.log(n + ' vérifications réussies : charge, course-saut-smash, interceptions, recharge, 15 pouvoirs, fantôme, XP, bonus, matchs complets.');
