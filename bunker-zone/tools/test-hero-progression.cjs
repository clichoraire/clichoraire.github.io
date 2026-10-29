const fs = require('fs'), vm = require('vm'), assert = require('assert/strict'), path = require('path');
global.window = global;
let saved = null;
global.localStorage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
for (const f of ['config', 'utils', 'hero-progression', 'map', 'units', 'ai', 'game', 'campaign']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js', f + '.js'), 'utf8'), { filename: f + '.js' });
}
const old = new ZC.Campaign().data;
old.heroes.kael = { xp: ZC.heroXpFor(3), points: { atk: 2, def: 1, flux: 1 }, gear: { weapon: { stats: { dmg: 999, dmgPct: 99, lifesteal: 1, splash: 999 } } } };
Object.assign(old, { points: 100, earned: 200, upgrades: {}, missions: { w1m1: { easy: true } }, credits: 999, bank: [{}], shop: [{}], shopKey: 'old', lootCount: 10 });
const expected = ZC.heroBuild({ xp: old.heroes.kael.xp, points: old.heroes.kael.points });
assert.deepEqual(ZC.heroBuild(old.heroes.kael), expected, 'legacy items never contribute to stats');
saved = JSON.stringify(old);
const campaign = new ZC.Campaign();
assert.deepEqual(campaign.hero().build, expected);
assert.equal(campaign.points, 100);
assert.equal(campaign.data.earned, 200);
assert.ok(campaign.done('w1m1', 'easy'));
for (const key of ['credits', 'bank', 'shop', 'shopKey', 'lootCount']) assert.ok(!(key in JSON.parse(saved)));
assert.ok(!('gear' in JSON.parse(saved).heroes.kael));
assert.ok(campaign.spendPoint('kael', 'atk'));
assert.equal(campaign.hero().build.dmgMult, 1.09);
campaign.resetPoints('kael');
assert.equal(campaign.hero().unspent, 6);
for (const victory of [true, false]) {
  const game = new ZC.Game(campaign.missionSettings('w1m2', 'easy'));
  for (let i = 0; i < 300; i++) game.update(1 / 30);
  const hero = game.units.find(u => u.def.hero && u.owner === 0);
  assert.ok(hero);
  for (const value of [hero.damage, hero.armor, hero.range, hero.speed, hero.attackCooldown, hero.hp, hero.flux]) assert.ok(Number.isFinite(value));
  const xp = campaign.hero().xp;
  game.heroXpGained = 25;
  const result = campaign.onMissionEnd(game, victory);
  assert.equal(campaign.hero().xp, xp + 25);
  assert.ok(!('loot' in result));
  assert.ok(!('credits' in result));
  assert.equal(campaign.onMissionEnd(game, victory), result, 'settlement is idempotent');
  assert.equal(campaign.hero().xp, xp + 25);
}
assert.equal(ZC.rollItem, undefined);
assert.equal(ZC.drawGear, undefined);
console.log('Migration, progression, statistiques de combat, victoire et défaite sans items : OK');
