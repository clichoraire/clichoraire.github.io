const A=require('node:assert/strict');
const root=__dirname+'/';
const G=require(root+'physics'),S=require(root+'specials'),History=require(root+'rewind');
for(const boost of [0,2,6]){
 const save=G.fresh();save.levels.boost=boost;const f=G.create(save);let id=0;while(!S.fuelAt(id,f).active)id++;const a=S.fuelAt(id,f);
 Object.assign(f,{x:a.x+20,y:a.y,time:1,vx:25,vy:-5,fuel:f.maxFuel*.2});
 const history=new History();history.record(0,f);history.record(.1,f);
 S.collectFuel(f,a.x-20,a.y);A(Math.abs(f.fuel-f.maxFuel*.5)<1e-8);A(f.fuelUsed.has(id));A.equal(f.fuelEffects.length,1);A.equal(f.vx,25);A.equal(f.vy,-5);
 S.collectFuel(f,a.x-20,a.y);A(Math.abs(f.fuel-f.maxFuel*.5)<1e-8);
 const prior=history.back();A(!prior.fuelUsed);A.equal(prior.fuel,prior.maxFuel*.2);
 f.fuelUsed.clear();f.fuel=f.maxFuel*.95;S.collectFuel(f,a.x-20,a.y);A.equal(f.fuel,f.maxFuel);
 f.fuelUsed.clear();S.collectFuel(f,a.x-20,a.y);A(!f.fuelUsed.has(id),'Full tank leaves vial available');
 f.fuel=0;S.collectFuel(f,a.x-20,a.y);A(f.fuel>0,'Empty booster refills');
}
for(const y of [500,5000,15000]){const f=G.create(G.fresh());const items=S.fuelNearby(0,3000,f,y-500,y+500);A(items.length>0&&items.length<=32);A.deepEqual(items,S.fuelNearby(0,3000,f,y-500,y+500));}
console.log('Fuel: swept contact, +30%, capacity cap, one collection, full/empty tanks, rewind, no momentum change and bounded altitude field passed.');
