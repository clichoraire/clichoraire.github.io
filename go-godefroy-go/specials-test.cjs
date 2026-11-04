const A=require('node:assert/strict'),G=require('./physics'),S=require('./specials'),M=require('./monsters');
for(const kind of [0,1,2,3,4,5,6,8]){
 const s=G.fresh();s.levels.specialItems=10;const f=G.create(s);f.time=1;f.monsterTime=1;
 let id;for(let row=0;row<12&&id===undefined;row++)for(let col=0;col<200;col++){const k=row*1000000+col,a=S.at(k,f);if(a.active&&a.kind===kind){id=k;break;}}A.notEqual(id,undefined);const a=S.at(id,f);A(a.active);f.x=a.x;f.y=a.y;f.vx=18;f.vy=-8;
 S.step(f,a.x-9,a.y,.01,60);A(f.vy>0);A(f.specialUsed.has(id));A(f.specialEffects.length===1);
 const vy=f.vy;S.step(f,a.x,a.y,0,60);if(kind!==3)A.equal(f.vy,vy,'one activation only');else A(f.gullRide.left>0);
}
const a=G.create(G.fresh()),b=G.create(G.fresh());b.l.specialItems=10;
A(S.nearby(0,2000,b).length>S.nearby(0,2000,a).length);
const c=G.create(G.fresh());c.l.specialItems=10;c.x=100000;c.specialUsed=new Set([0]);S.step(c,c.x,c.y,.01,60);A(!c.specialUsed.has(0));
for(let i=0;i<50;i++)A(M.at(i,0).height>=34*1.65);
const save=G.fresh();save.gold=1e10;for(let n=0;n<10;n++)A(G.buyStat(save,'specialItems'));A(!G.buyStat(save,'specialItems'));A.equal(G.sanitize(save).levels.specialItems,10);
console.log('8 special effects, one-use collisions, gull carry, density upgrade, bounded history, enlarged monsters and level-10 save: PASS');

for(const y of [110,310]){
 const f=G.create(G.fresh());Object.assign(f,{x:1049.9,y,vx:100,vy:-10,time:1});f.l.launch=20;G.step(f,1/120,{});A(f.destroyed.has(1050));A.equal(f.hits,1);A(f.towerBreaks[1050]);A(!f.ended);A(f.vx<100);
 const slow=G.create(G.fresh());Object.assign(slow,{x:1049.9,y,vx:20,vy:-1,time:1});G.step(slow,1/120,{});A.equal(slow.endReason,'tower');A.equal(slow.vx,0);A.equal(slow.vy,0);A(!slow.destroyed.has(1050));
 const strong=G.create(G.fresh());strong.l.wallForce=10;Object.assign(strong,{x:1049.9,y,vx:35,vy:0,time:1});G.step(strong,1/120,{});A(strong.destroyed.has(1050),'Force upgrades let slower impacts break towers');
}
console.log('Tower destruction and rooftop bounce: PASS');

for(const altitude of [0,1000,5000,15000,100000]){const f=G.create(G.fresh());f.l.specialItems=10;f.y=altitude;const objects=S.nearby(1000,1600,f,altitude-400,altitude+400);A(objects.length>0);A(objects.length<=64);A(objects.every(o=>o.y>=altitude-510&&o.y<=altitude+510));if(altitude>4000)A(objects.every(o=>o.kind===5||o.kind===6));A.deepEqual(objects,S.nearby(1000,1600,f,altitude-400,altitude+400));}
console.log('Local altitude field: deterministic cells, bounded population, no ground objects in space: PASS');

{const f=G.create(G.fresh());f.l.specialItems=10;let id=0;while(!(S.at(id,f).active&&S.at(id,f).kind===8))id++;const a=S.at(id,f);Object.assign(f,{x:a.x,y:a.y,vx:18,vy:5});S.step(f,a.x,a.y,.01,60);A(!f.specialUsed.has(id),'no spring trigger while rising');f.vy=-12;S.step(f,a.x,a.y,.01,60);A(f.vy>30);A.equal(f.springHits[id],f.time);A(S.at(id,f).y===50);}
console.log('Ground trampoline: downward contact, strong impulse, one-use spring animation: PASS');
