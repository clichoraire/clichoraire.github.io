'use strict';
const assert = require('node:assert/strict');
global.window = {};
const storage = new Map();
global.localStorage = { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
require('../js/config.js'); require('../js/adventure.js');
const { Adventure: A, AdventureUI: U } = window.BC, BC = window.BC;
// Une ancienne sauvegarde unique reste disponible après avoir choisi un autre chef.
const old = { leader: 'matthieu', chars: {}, match: 7, wins: 6, losses: 1, team: { inner: ['matthieu'], outer: [] } };
localStorage.setItem('bc.adventure', JSON.stringify(old));
assert.equal(A.load('matthieu').match, 7);
assert.equal(A.load('milo'), null);
const milo = A.start('milo'); milo.wins = 2; A.save(milo);
assert.equal(A.load('matthieu').wins, 6);
assert.equal(A.load('milo').wins, 2);
A.save(A.load('matthieu'));
assert.equal(A.load().leader, 'matthieu');
assert.equal(A.load('milo').wins, 2);
// Chaque stat passe au-delà de 12, atteint 18 et ne consomme plus de point ensuite.
const s = A.load('matthieu'), c = A.char(s, 'matthieu');c.earned=0;
for (const key of BC.STAT_KEYS) {
  c.stats[key] = 12; c.points = 114;
  for (let level = 13; level <= 18; level++) { assert.equal(A.spend(s, 'matthieu', key), true); assert.equal(c.stats[key], level); }
  assert.equal(A.spend(s, 'matthieu', key), false); assert.equal(c.points, 4);
  assert.equal(A.load('matthieu').chars.matthieu.stats[key], 18);
  const html = U.statRow(key, 18, { plus: true });
  assert.equal((html.match(/<b(?: |>)/g) || []).length, 18);
  assert.equal((html.match(/class="sp"/g) || []).length, 5);
  assert.equal((html.match(/class="sp red"/g) || []).length, 3);
  assert.ok(!html.includes('class="plus"'));
  const at15 = U.statRow(key, 15, { plus: true });
  assert.equal((at15.match(/<u class="sp red"/g) || []).length, 3);
  assert.ok(at15.includes('class="plus"'));
}
const stats = v => Object.fromEntries(BC.STAT_KEYS.map(k => [k, v]));
const low = BC.phys(BC.PLAYERS.matthieu, stats(12)), high = BC.phys(BC.PLAYERS.matthieu, stats(18));
for (const key of ['maxSpeed','throwSpeed','dmg','catchSkill','maxHp','jump']) assert.ok(high[key] > low[key]);
assert.ok(high.fullStart && high.regen && high.revive);
A.reset('matthieu'); assert.equal(A.load('matthieu'), null); assert.equal(A.load('milo').wins, 2);
console.log('Aventures indépendantes, migration, sauvegarde des stats à 18, coûts progressifs sans condition de niveau et couleurs : OK.');

const prices={3:1,4:2,5:2,6:3,7:3,8:5,9:5,10:8,11:8,12:12,13:12,14:18,15:18,16:25,17:25};
for(const [value,cost] of Object.entries(prices)){
 c.stats.power=Number(value);c.points=cost-1;assert.equal(A.upgradeCost(c,'power'),cost);
 assert.equal(A.spend(s,'matthieu','power'),false);assert.equal(c.stats.power,Number(value));assert.equal(c.points,cost-1);
 c.points=cost;assert.equal(A.spend(s,'matthieu','power'),true);assert.equal(c.points,0);assert.equal(c.stats.power,Number(value)+1);
}
c.stats.power=18;c.earned=0;A.save(s);assert.equal(A.load('matthieu').chars.matthieu.stats.power,18);
assert.equal(A.spend(s,'matthieu','unknown'),false);
