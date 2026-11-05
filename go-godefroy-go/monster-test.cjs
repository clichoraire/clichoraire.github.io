const SpecialEncounters=require('./specials');SpecialEncounters.step=()=>{};
const assert=require('node:assert/strict'),M=require('./monsters.js'),G=require('./physics.js'),C=require('./course.js');
function find(predicate){for(let id=0;id<20000;id++)if(predicate(M.at(id,0)))return id;throw Error('missing type');}
function contact(id,pressAge=Infinity){const dt=.01,m=M.at(id,dt),y=m.y+(m.height*.5-m.lane)/.85;const f={x:m.x,y,vx:80,vy:-65,combatSeed:1973,timingPress:Number.isFinite(pressAge)?-pressAge:undefined};const e=M.collide(f,m.x,y,dt,{});assert(e);return f;}
const gob=find(m=>m.kind<5&&!m.armed),armed=find(m=>m.kind<5&&m.armed),slime=find(m=>m.kind===6);
// No timing key any more: every bounce is a perfect one, silently (no label), even on armed goblins.
for(const id of [gob,slime,armed]){const late=contact(id),timed=contact(id,.1);assert(late.vy>0);assert.equal(late.vy,timed.vy);assert.equal(late.feedback.rating,'perfect');assert.equal(late.feedback.label,'');}
assert(M.hop(slime,1)>=0);let peak=0;for(let t=0;t<6;t+=.05)peak=Math.max(peak,M.hop(slime,t));assert(peak>110);
const gaps=[];for(let id=0;id<500;id++)gaps.push(M.at(id+1,0).x-M.at(id,0).x);assert(Math.min(...gaps)>=5);assert(Math.min(...gaps)<10);assert(Math.max(...gaps)>80);assert(M.nearby(100000,100140,300).length<20);
let armedOrcs=0,throws=0;for(let id=0;id<20000;id++){const m=M.at(id,0);if(m.kind===5&&m.armed){armedOrcs++;if(M.hash(id*71+1973)<.1)throws++;}}assert(throws/armedOrcs>.075&&throws/armedOrcs<.125);
const orc=find(m=>m.kind===5&&m.armed&&M.hash(m.id*71+1973)<.1),m=M.at(orc,0),f={x:m.x-30,y:150,vx:0,vy:0,combatSeed:1973};for(let i=0;i<120;i++)M.collide(f,f.x,f.y,.01,{});assert.equal(f.orcs.get(orc).status,'thrown');assert(f.projectiles.length>0);assert(f.projectiles.length<=8);
const p=f.projectiles[0];f.x=p.x;f.y=p.y;f.monsterCooldown=0;M.collide(f,f.x,f.y,.01,{});assert.equal(f.feedback.rating,'perfect');assert(f.monsterReaction?.boing);
const held={x:0,y:2000,vx:10,vy:0};for(let i=0;i<200;i++)M.collide(held,held.x,held.y,.01,{ram:true});assert(held.timingPress<.02);assert(held.timingUsed);
for(let level=0;level<25;level++){const s=G.fresh();s.levels.launch=level;const p=G.parameters(s.levels);if(level)assert(p.maxSpeed>G.parameters({...s.levels,launch:level-1}).maxSpeed);const a=G.create(s);a.y=5000;for(let n=0;n<1200&&!a.ended;n++){const vx=a.vx;a.monsterEvents=[];G.step(a,1/120,{right:n<300,boost:n>500});assert(Math.hypot(a.vx,a.vy)<=p.maxSpeed+1e-7);if(!a.monsterEvents.length&&!a.tunnel)assert(a.vx-vx<=(p.thrust+7)/120+1e-7);}}
const base=C.rampGeometry(),speed=C.takeoffSpeed(0);C.setTestRamp(200,300);assert(C.rampGeometry().top<base.top);assert(C.rampGeometry().end>base.end);assert(C.takeoffSpeed(0)>speed);assert(C.takeoffSpeed(0)<=G.parameters(G.fresh().levels).maxSpeed);C.setTestRamp();assert.deepEqual(C.rampGeometry(),base);assert.equal(C.takeoffSpeed(0),speed);
console.log('Combat validé : groupes irréguliers, 3 timings, slimes sauteurs, piques/parades, lancer unique à 10 %, projectiles, anti-maintien X, 25 plafonds et réglages de rampe isolés.');


function elasticContact(vx){const m=M.at(gob,.01),head=m.y+(m.height-m.lane)/.85;const f={x:m.x,y:head+10,vx,vy:-12,monsterTime:0,timingPress:0,l:{rebound:0}};const event=M.collide(f,m.x,head+22,.01,{});assert(event);assert(f.monsterReaction.boing);assert(f.vy>0);assert(Math.hypot(f.vx,f.vy)<=Math.hypot(vx,12)*1.08+.001);return f;}const slowBoot=elasticContact(8),fastBoot=elasticContact(70);assert(fastBoot.vx>slowBoot.vx);assert(fastBoot.vy>slowBoot.vy);
for(let t=0;t<2;t+=.01){const p=M.boingPose(t,t,'perfect');assert(p.sx>.7&&p.sx<1.3&&p.sy>.7&&p.sy<1.3);}assert.deepEqual(M.boingPose(2,2),{sx:1,sy:1,glow:0});assert(M.boingPose(.15,99).glow>0);
console.log('Elastic bounce: bounded whole-equipment deformation, immediate X feedback, speed-scaled boost: PASS');

{const f={x:10,y:700,vx:20,vy:-5,monsterTime:0,timingPress:0,projectiles:[{id:900,x:10,y:700,vx:0,vy:0,age:0}]};M.collide(f,10,700,.01,{});assert.equal(f.projectiles.length,0);assert.equal(f.hitFlash,0);assert(f.monsterEvents.some(e=>e.type==='bounce'));}
console.log('Timed weapon parry removes projectile without damage: PASS');
