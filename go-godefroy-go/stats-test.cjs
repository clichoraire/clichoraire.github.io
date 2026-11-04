const assert=require('node:assert/strict'),G=require('./physics'),C=require('./course'),M=require('./monsters');
const s=G.fresh();assert(!G.buyStat(s,'friction'));assert(!G.buyStat(s,'unknown'));s.gold=1000000;
for(const c of G.statUpgrades){const gold=s.gold,cost=G.statPrice(s,c.id);assert(G.buyStat(s,c.id));assert.equal(s.gold,gold-cost);assert.equal(s.levels[c.id],1);}
const clean=G.sanitize(JSON.parse(JSON.stringify(s)));for(const c of G.statUpgrades)assert.equal(clean.levels[c.id],1);
const legacy=G.sanitize({version:2,levels:{armor:3,impact:4}});assert.equal(legacy.levels.friction,3);assert.equal(legacy.levels.wallForce,4);assert.equal(legacy.levels.ricochet,4);assert.equal(G.parameters(legacy.levels).drag,.008);assert.equal(G.parameters(legacy.levels).impactMultiplier,3);
C.setUpgrades(0,0);const base=C.rampGeometry();G.create(s);assert(C.rampGeometry().end>base.end);assert(C.rampGeometry().top<base.top);C.setUpgrades(0,0);
const p=G.parameters(s.levels),plain=G.parameters(G.fresh().levels);assert(p.drag<plain.drag);assert(p.impactMultiplier>plain.impactMultiplier);assert.equal(p.ricochets,3);
for(const c of G.statUpgrades){s.gold=Infinity;while(G.buyStat(s,c.id)){}assert.equal(s.levels[c.id],10);assert(!G.buyStat(s,c.id));assert.equal(s.gold,Infinity);}
// Beginner gear must be able to exit a stall below its own speed cap.
for(const wing of [0,1,8]){const state=G.fresh();state.levels.wing=wing;const f=G.create(state);f.y=10000;f.pitch=1.3;f.stalled=true;for(let n=0;n<240;n++)G.step(f,1/120,{right:f.pitch>.1});assert(!f.stalled);assert(Math.hypot(f.vx,f.vy)<=G.parameters(f.l).maxSpeed);}
const f=G.create(G.fresh());f.stalled=true;f.pitch=0;G.step(f,1/120,{left:true});assert(f.pitch>0,'player can still pull up while stalled');
console.log('Six paid upgrades, caps, save migration, real ramp geometry and recoverable beginner stalls: PASS');
const baseParams=G.parameters(G.fresh().levels),bonusSave=G.fresh();
for(const id of ['goldBonus','boostPower','lightness','fuelCapacity'])bonusSave.levels[id]=1;
const bonusParams=G.parameters(bonusSave.levels);
assert.equal(bonusParams.thrust,baseParams.thrust*1.05);assert.equal(bonusParams.fuel,baseParams.fuel*1.05);assert.equal(bonusParams.gravityMultiplier,.95);
const normal=G.create(G.fresh());normal.time=1;normal.x=1000;
const enhanced={...normal,l:{...bonusSave.levels}};const normalGold=G.earnings(normal).total;
assert.equal(G.earnings(enhanced).total,normalGold+Math.floor(normalGold*.05));
const wallet=bonusSave.gold;assert.equal(G.settle(bonusSave,enhanced),G.earnings(enhanced).total);assert.equal(G.settle(bonusSave,enhanced),0);assert.equal(bonusSave.gold,wallet+G.earnings(enhanced).total);
assert.equal(G.earnings({...enhanced,time:0}).total,0);
console.log('Four 5% bonuses, reward accounting and single settlement: PASS');
