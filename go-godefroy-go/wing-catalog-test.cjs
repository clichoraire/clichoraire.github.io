const assert=require('node:assert/strict'),fs=require('node:fs'),G=require('./physics'),W=require('./wing-gear'),C=require('./course');
assert.equal(W.families.length,8);assert.equal(W.items.length,41);assert.equal(G.maxLevel('wing'),40);
for(const family of W.families){assert.equal(family.end-family.start+1,5);for(let n=family.start;n<=family.end;n++){assert.equal(W.get(n).family,family.id);assert(fs.existsSync(__dirname+'/'+W.get(n).asset));}}
const s=G.fresh();s.gold=Infinity;for(let n=1;n<=40;n++){assert(G.buy(s,'wing'));assert.equal(s.levels.wing,n);assert(Number.isFinite(G.price(G.categories[1],n-1)));}assert(!G.buy(s,'wing'));assert(G.equip(s,'wing',16));assert.equal(G.sanitize(JSON.parse(JSON.stringify({...s,gold:100}))).levels.wing,16);
for(let old=0;old<=8;old++){const legacy=G.sanitize({version:2,levels:{wing:old},owned:{wing:old}});assert.equal(legacy.levels.wing,W.legacy[old]);assert.deepEqual(G.sanitize(legacy),legacy);}
for(const c of G.statUpgrades){const save=G.fresh();save.gold=Infinity;for(let n=1;n<=10;n++)assert(G.buyStat(save,c.id));assert(!G.buyStat(save,c.id));assert.equal(G.sanitize(save).levels[c.id],10);}
C.setUpgrades(8,8);const old=C.rampGeometry();C.setUpgrades(10,10);assert(C.rampGeometry().top<old.top);assert(C.rampGeometry().end>old.end);C.setUpgrades(0,0);
const source=fs.readFileSync(__dirname+'/game.js','utf8');assert(!source.includes('PRÊT ?'));assert(source.includes("forgeCategory='upgrades'"));
console.log('40 illustrated variants, eight families, ownership migration, ten upgrade levels, ramp growth and instant start: PASS');
for(let wing=0;wing<=40;wing++){const s=G.fresh();s.levels.wing=wing;const f=G.create(s);for(let i=0;i<3600&&!f.ended;i++)G.step(f,1/120,{right:i>100&&i<180});assert(f.ended,'finite beginner flight for wing '+wing);assert(Number.isFinite(f.x+f.y));assert(f.maxSpeed<=G.parameters(f.l).maxSpeed+1e-7);}
console.log('All 41 flight configurations stay finite and respect their speed cap: PASS');
