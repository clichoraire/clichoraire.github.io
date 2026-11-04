const assert=require('node:assert/strict'),G=require('./physics');
assert.equal(G.BASE_WING_LEVEL,7);
const s=G.fresh(),p=G.parameters(s.levels);assert.equal(s.levels.wing,0);assert.equal(G.itemName(G.categories[1],0),'Aucun équipement');assert.equal(p.wingLift,8.8);assert.equal(p.turnRate,(.8+7*.17)*.6);assert.equal(p.liftCap,7.8);
for(let i=1;i<=8;i++){const a=G.parameters({...s.levels,wing:i-1}),b=G.parameters({...s.levels,wing:i});assert(b.wingLift>a.wingLift);assert(b.turnRate>a.turnRate);assert(b.liftCap>a.liftCap);assert.equal(G.stats('wing',i)[0].value,b.wingLift);const f=G.create({...s,levels:{...s.levels,wing:i}}),base=G.create(s);assert.equal(f.vx,base.vx);assert.equal(f.vy,base.vy);assert.equal(f.y,base.y);}
console.log('Nouvelle base Mithril maîtrise 4, huit améliorations progressives, statistiques cohérentes et impulsion de saut inchangée.');
