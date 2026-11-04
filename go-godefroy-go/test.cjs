const assert = require('node:assert/strict');
const G = require('./physics.js');
let checks=0;function ok(value){assert.ok(value);checks++;}
function run(level,angle=20,boost=true,launchLevel=level){const s=G.fresh();for(const k in s.levels)s.levels[k]=level;const f=G.create(s,angle);let steps=0;while(!f.ended&&steps++<40000){G.step(f,1/60,{boost});ok(Number.isFinite(f.x)&&Number.isFinite(f.y)&&f.fuel>=0);}ok(f.ended);return {s,f};}
const basic=run(0);ok(basic.f.x<2000);ok(basic.f.endReason==='ground');
const improved=run(1);ok(improved.f.launchSpeed>basic.f.launchSpeed);ok(['ground','wall'].includes(improved.f.endReason));
// Campaign walls persist across attempts; verify final objective after the fully upgraded run.
const max=run(8,20,true,24);max.f.ended=false;max.f.x=100700;max.f.y=9000;max.f.vx=500;max.f.vy=0;for(let i=1;i<9;i++)max.f.wallsBroken.add(i);G.step(max.f,1/120,{});ok(max.f.newGoals.includes(7));ok(max.f.maxY>=4000&&max.f.x>=100000);
const reward=G.settle(max.s,max.f);ok(reward>5000);const gold=max.s.gold;ok(G.settle(max.s,max.f)===0&&max.s.gold===gold);ok(max.s.completed.every(Boolean));
const s=G.fresh();ok(!G.buy(s,'launch'));s.gold=10000000;for(let i=0;i<24;i++)ok(G.buy(s,'launch'));ok(!G.buy(s,'launch'));ok(!G.buy(s,'invalid'));ok(s.levels.launch===24&&s.gold>=0);
const loaded=G.sanitize({gold:-4,levels:{wing:99,boost:'invalid'},completed:[true]});ok(loaded.gold===0&&loaded.levels.wing===40&&loaded.levels.boost===0);ok(loaded.completed.length===8&&loaded.completed[0]&&!loaded.completed[1]);
const torn=G.create(G.fresh(),75);for(let i=0;i<180;i++)G.step(torn,1/60,{});ok(torn.pitch<75*Math.PI/180);ok(!torn.wingTorn);
const noBoost=run(0,20,false);ok(noBoost.f.maxY<basic.f.maxY);
console.log(`${checks} vérifications réussies : simulation, progression, achats, sauvegarde, cape, victoire et récompenses uniques.`);

// Profile lifecycle: legacy migration, isolated adventures, reload, malformed data.
const P=require('./profiles.js');
const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
memory.set('go-godefroy-go.v1',JSON.stringify({...G.fresh(),day:4,gold:321}));
const library=P.read(storage,G.sanitize);assert.equal(library.slots[0].save.gold,321);
const one=P.create(library,'Matthieu',G.fresh),two=P.create(library,'Deuxième serment',G.fresh);
one.save.gold=999;assert.equal(two.save.gold,0);assert.notEqual(one.id,two.id);
assert.ok(P.write(storage,library));const restored=P.read(storage,G.sanitize);
assert.equal(restored.slots.length,3);assert.equal(restored.active,two.id);assert.equal(restored.slots[1].save.gold,999);
assert.equal(restored.slots[2].save.day,1);assert.equal(JSON.parse(memory.get('go-godefroy-go.v1')).gold,321);
assert.equal(P.write({setItem(){throw Error('denied');}},library),false);
assert.equal(P.read({getItem(){return '{bad';}},G.sanitize).slots.length,0);
// Responsive steering must measurably change the trajectory, even without boost.
const up=G.create(G.fresh(),20),down=G.create(G.fresh(),20);
for(let i=0;i<120;i++){G.step(up,1/120,{left:true});G.step(down,1/120,{right:true});}
assert.ok(up.pitch>down.pitch+.5);assert.ok(up.y>down.y);
// Equal elapsed simulation time gives comparable trajectories at different update rates.
const slow=G.create(G.fresh(),20),fast=G.create(G.fresh(),20);
for(let i=0;i<120;i++)G.step(slow,1/60,{boost:true});for(let i=0;i<240;i++)G.step(fast,1/120,{boost:true});assert.ok(Math.abs(slow.x-fast.x)<1&&Math.abs(slow.y-fast.y)<1);
console.log('Régressions validées : migration, parties séparées, reprise, stockage indisponible, pilotage, obstacles et cadence de simulation.');
const cancelledSave=G.fresh(),cancelled=G.create(cancelledSave,20);assert.equal(G.settle(cancelledSave,cancelled),0);assert.equal(cancelledSave.day,1);assert.equal(cancelledSave.gold,0);

const C=require('./course.js');
for(const angle of [15,20,75]){const p=C.launchPose(1,angle),f=G.create(G.fresh(),angle);assert.ok(Math.abs(f.originX-C.flightOrigin(p).x)<1e-8);assert.ok(Math.abs(485-f.y*C.SCALE-C.flightOrigin(p).y)<1e-8);assert.ok(Math.abs(p.rotation+f.pitch)<1e-8);for(let i=0;i<=100;i++){const pose=C.launchPose(i/100,angle);assert.ok(Math.abs(pose.y+pose.jump+Math.cos(pose.rotation)*30-C.rampY(pose.contactX,angle))<1e-8);}assert.ok(Math.abs(C.rampSlope(C.RAMP.turn-1e-5,angle)-C.rampSlope(C.RAMP.turn+1e-5,angle))<1e-5);}
for(let i=1;i<C.stages.length;i++){assert.equal(C.stageAt(C.stages[i].at+C.wallWidth(i)-.01),i-1);assert.equal(C.stageAt(C.stages[i].at+C.wallWidth(i)),i);}
const first=G.create(G.fresh(),20);assert.ok(first.vx*C.X_SCALE*C.TIME_SCALE>100);assert.equal(basic.f.endReason,'ground');assert.ok(basic.f.impactSpeed>0);assert.equal(max.f.endReason,'victory');
console.log('Contact ventral, tangente du tremplin, raccord au vol, vitesse visible et passages de tableaux validés.');

const ledger=G.earnings(basic.f);assert.equal(ledger.total,ledger.rows.reduce((a,r)=>a+r.gold,0)+ledger.support+ledger.bonuses.reduce((a,b)=>a+b.gold,0));
for(const row of ledger.rows){const rates={distance:.08,altitude:.12,duration:2,speed:.06,destruction:40,stones:2,collected:1};assert.equal(row.gold,Math.floor(row.value*rates[row.id]));}
const wallet=G.fresh(),before=wallet.gold,paid=G.settle(wallet,basic.f);assert.equal(wallet.gold-before,paid);assert.equal(paid,ledger.total);assert.equal(G.settle(wallet,basic.f),0);
const again=G.create(wallet,20);again.x=basic.f.x;again.maxY=basic.f.maxY;again.time=basic.f.time;again.maxSpeed=basic.f.maxSpeed;assert.equal(G.earnings(again).bonuses.length,0);
const prior=G.sanitize({gold:123,levels:{launch:3},completed:[true,true,true,true]});assert.equal(prior.gold,123);assert.equal(prior.levels.launch,19);assert.deepEqual(prior.completed,[true,true,true,true,false,false,false,false]);

console.log('Bilan détaillé, total exact, versement unique, huit objectifs et campagne de 100 km validés.');
// Catalog and physics share the exact values displayed before purchase.
for(let l=0;l<=G.MAX_LEVEL;l++){
 const levels={launch:l,wing:l,boost:l,armor:l,impact:l},p=G.parameters(levels),state={...G.fresh(),levels},f=G.create(state,20);
 assert.equal(f.maxFuel,p.fuel);assert.ok(Math.abs(f.vx-Math.cos(C.launchPose(1,20,p.launchSpeed,f.l.launch).rotation)*p.launchSpeed)<1e-8);
 assert.equal(G.stats('boost',l)[0].value,p.thrust);assert.equal(G.stats('boost',l)[1].value,f.maxFuel/C.TIME_SCALE);assert.equal(G.stats('impact',l)[0].value,p.impactMultiplier);
}
const E=require('./equipment.js');for(const id of ['launch','wing','boost','armor','impact'])for(let l=0;l<=8;l++){const source=E.svg(id,l);assert.ok(source.includes('<path'));assert.equal(require('fs').readFileSync(require('path').join(__dirname,'assets/equipment',`${id}-${l}.svg`),'utf8'),source);}


// Spatial stones: velocity is consumed while drilling, with no rectangular tunnel cut.
function strike(save,speed=150,ram=false,y=200){const f=G.create(save);f.x=2400;f.y=y;f.vx=speed;f.vy=0;f.ramTime=ram?1:0;G.strikeStones(f,1990,y);return f;}
const wallSave=G.fresh(),blocked=strike(wallSave);assert.equal(blocked.endReason,'wall');assert.ok(blocked.wallStones>1);assert.ok(blocked.x>2000&&blocked.x<2150);assert.equal(blocked.stage,0);
assert.deepEqual(wallSave.wallDamage,{});blocked.time=1;G.settle(wallSave,blocked);const loadedWall=G.sanitize(JSON.parse(JSON.stringify(wallSave)));assert.deepEqual(loadedWall.wallDamage,blocked.wallDamage);
const second=strike(loadedWall);assert.ok(second.x>blocked.x);assert.ok(Object.keys(second.wallDamage[1]).length>Object.keys(blocked.wallDamage[1]).length);
const differentHeight=strike(loadedWall,150,false,800);assert.ok(differentHeight.x<second.x);assert.ok(differentHeight.wallDamage[1]['0:19']);
const slowHit=strike(G.fresh(),70),fastHit=strike(G.fresh(),200);assert.ok(fastHit.wallStones>slowHit.wallStones);assert.ok(fastHit.x>slowHit.x);
const inertial=G.fresh();inertial.levels.impact=1;assert.ok(strike(inertial,150,true).wallStones>strike(inertial,150).wallStones);
let tunnel=G.fresh(),passes=0,last;do{last=strike(tunnel);tunnel.wallDamage=G.cleanDamage(last.wallDamage);passes++;}while(last.ended&&passes<30);assert.ok(passes>1&&passes<30);assert.ok(last.wallsBroken.has(1));
const passage=G.create(tunnel);passage.x=2157.9;passage.y=200;passage.vx=100;passage.vy=0;G.step(passage,.02);assert.equal(passage.stage,1);assert.equal(passage.ended,false);
const beforeExit=G.create(tunnel);beforeExit.x=2149;beforeExit.y=200;beforeExit.vx=100;beforeExit.vy=0;G.step(beforeExit,.02);assert.equal(beforeExit.stage,0);
const invalid=G.sanitize({wallDamage:{_format:2,1:{'0:0':true,'99:0':true,'NaN:0':true,'0:-1':true,'1:1':false}}});assert.deepEqual(invalid.wallDamage[1],{'0:0':true,'1:0':true});
const migrated=G.sanitize({wallDamage:{1:{1:54}}});assert.ok(migrated.wallDamage[1]['0:4']);assert.ok(!migrated.wallDamage[1]['8:4']);
assert.equal(G.fresh().wallDamage[1],undefined);assert.ok(C.X_SCALE/.85>5);assert.ok(250*C.X_SCALE>1200);assert.ok(C.rampProfile(first.launchSpeed).duration>1&&C.rampProfile(first.launchSpeed).duration<3);assert.ok(C.RAMP.end>352*2.5);assert.ok(485-C.RAMP.top>2*(485-334));assert.equal(C.wallWidth(1),150);assert.equal(C.stages[1].at,2000);
// Baseline remains short of the first wall across a range of in-flight strategies.
for(const pitch of [-.3,0,.2,.4,.6,.8,1]){const f=G.create(G.fresh());while(!f.ended)G.step(f,1/60,{boost:true,left:f.pitch<pitch-.01,right:f.pitch>pitch+.01});assert.ok(f.x<2000);}
const html=require('fs').readFileSync(require('path').join(__dirname,'index.html'),'utf8');assert.ok(!html.includes('id="angle"'));
console.log('Premier rempart hors de portée au niveau initial ; pierres traversées selon la vitesse ; trous persistants et migration ; sortie réelle ; pente fixe validés.');

const moving=G.create(G.fresh());moving.x=2010;moving.y=200;moving.vx=250;moving.vy=0;G.strikeStones(moving,1990,200);assert.equal(moving.ended,false);assert.ok(moving.vx>0&&moving.vx<250);assert.ok(moving.wallStones>=2);
const empty=G.create(tunnel);empty.x=2400;empty.y=200;empty.vx=150;empty.vy=0;G.strikeStones(empty,1990,200);assert.equal(empty.wallStones,0);assert.equal(empty.vx,150);
const stoneWallet=G.fresh();moving.time=1;G.settle(stoneWallet,moving);const stoneGold=stoneWallet.gold;G.settle(stoneWallet,moving);assert.equal(stoneWallet.gold,stoneGold);
one.save.wallDamage=G.cleanDamage(tunnel.wallDamage);P.write(storage,library);const wallsReloaded=P.read(storage,G.sanitize);assert.deepEqual(wallsReloaded.slots[1].save.wallDamage,one.save.wallDamage);assert.deepEqual(wallsReloaded.slots[2].save.wallDamage[1],{});
console.log('Perte de vitesse continue, passage sans résistance dans une brèche, paiement unique et isolation entre parties validés.');
// Impact feedback consumes the actual collision energy and location, once per contact.
assert.ok(moving.impactEvents.length>0);for(const event of moving.impactEvents){assert.ok(event.speed>event.exitSpeed);assert.ok(event.energy>0);assert.equal(event.stopped,false);assert.ok(event.x>=2000);}
assert.equal(empty.impactEvents.length,0);assert.ok(blocked.impactEvents.at(-1).stopped);assert.equal(blocked.impactEvents.at(-1).exitSpeed,0);
const wallMonster=require('./monsters'),wallSpecial=require('./specials'),savedCollision=wallMonster.collide,savedSpecial=wallSpecial.step;wallMonster.collide=()=>{};wallSpecial.step=()=>{};
const intact=G.create(G.fresh());intact.l.launch=20;intact.x=1990;intact.y=200;intact.vx=250;intact.vy=0;intact.pitch=0;const speeds=[];for(let frame=0;frame<1200&&!intact.ended;frame++){G.step(intact,1/120);while(intact.impactEvents.length)speeds.push(intact.impactEvents.shift());}assert.ok(speeds.length>3);assert.ok(speeds.every((event,index)=>index===0||event.speed<speeds[index-1].speed));
wallMonster.collide=savedCollision;wallSpecial.step=savedSpecial;
console.log('Impacts localisés, énergie transmise aux effets, contacts uniques et ralentissement successif dans les pierres validés.');

// Ramp rollout has the same projected tangent speed as the initial flight.
const rampVelocity=(C.launchPose(1).x-C.launchPose(1-1e-6).x)/(1e-6*C.rampProfile(first.launchSpeed).duration);assert.ok(Math.abs(rampVelocity-first.launchSpeed*Math.cos(C.launchPose(1).rotation)*C.X_SCALE*C.TIME_SCALE)<20);

const speedRamp=C.rampProfile(first.launchSpeed);assert.ok(first.launchSpeed>=90/3.6&&first.launchSpeed<=120/3.6);assert.ok(speedRamp.samples[200].speed>speedRamp.samples[80].speed);assert.ok(Math.max(...speedRamp.samples.map(p=>p.speed))>first.launchSpeed);assert.ok(Math.abs(speedRamp.samples.at(-1).speed-first.launchSpeed)<1e-8);
for(const level of [0,3,8]){const levels={...G.fresh().levels,launch:level},v=G.parameters(levels).launchSpeed,duration=C.rampProfile(v,20,level).duration;const end=C.launchPose(1,20,v,level),near=C.launchPose(1-1e-6,20,v,level);assert.ok(Math.abs((end.x-near.x)/(duration*1e-6)-v*Math.cos(end.rotation)*C.X_SCALE*C.TIME_SCALE)<30);}
assert.ok(basic.f.x>30&&basic.f.x<2000);console.log('Énergie de la pente, accélération, vitesse conservée au décollage et portée accrue validées.');
// Each artillery purchase changes both the visible ramp and the takeoff energy.
for(let level=0;level<=24;level++){const r=C.rampGeometry(level),save=G.fresh();save.levels.launch=level;const flight=G.create(save),pose=C.launchPose(1,20,flight.launchSpeed,level);assert.equal(flight.originX,C.flightOrigin(pose,level).x);assert.ok(Math.abs(flight.y-(485-C.flightOrigin(pose,level).y)/C.SCALE)<1e-8);assert.ok(Number.isFinite(C.duration(flight.vx,level)));for(let n=0;n<=20;n++){const p=C.launchPose(n/20,20,flight.launchSpeed,level);assert.ok(Math.abs(p.y+p.jump+Math.cos(p.rotation)*(require('./launch-gear.js').get(level).standing?30:require('./launch-gear.js').get(level).type==='skate'?48:37)-C.rampY(p.contactX,20,level))<1e-8);}if(level){const prior=C.rampGeometry(level-1);assert.ok(r.end>prior.end&&r.top<prior.top);assert.ok(C.takeoffSpeed(120,level)>C.takeoffSpeed(120,level-1));}assert.equal(G.stats('launch',level)[2].value,(r.end-r.start)/C.X_SCALE);}
console.log('Vingt-cinq tailles de rampe, contact ventral par niveau, élan et caractéristiques de forge cohérents.');

// A deliberate pull-up recovers a shallow descent; torn cloth cannot steer the air.
const pullup=G.create(G.fresh()),noCape=G.create(G.fresh());
for(const f of [pullup,noCape]){f.l.launch=20;f.y=800;f.vx=160;f.vy=-8;f.pitch=.15;}
noCape.wingTorn=true;
for(let i=0;i<156;i++){G.step(pullup,1/120,{left:pullup.pitch<.6});G.step(noCape,1/120,{left:noCape.pitch<.6});}
assert.ok(pullup.vy>0);assert.ok(noCape.vy<0);assert.ok(pullup.y>noCape.y+8);assert.ok(pullup.capeLoad>0);assert.equal(noCape.capeLoad,0);assert.ok(Math.hypot(pullup.vx,pullup.vy)<161);
console.log('Cape : remontée pilotée, perte de vitesse, absence de portance directionnelle après déchirure validées.');

// Isolate aerodynamics from the new high-altitude pickups.
wallSpecial.step=()=>{};
// Complete dive -> pull-up -> stall -> recovery cycle, with no booster.
const swoop=G.create(G.fresh());swoop.l.launch=20;swoop.l.wing=6;swoop.time=2;swoop.y=100000;swoop.vx=100;swoop.vy=0;swoop.pitch=0;
const flyFor=(seconds,input)=>{for(let i=0;i<seconds*120;i++)G.step(swoop,1/120,input());};
flyFor(4,()=>({right:true}));
assert.ok(Math.hypot(swoop.vx,swoop.vy)>100);assert.ok(swoop.y<99800);assert.ok(swoop.pitch<-1);assert.equal(swoop.stalled,false);
// Heavier descent needs a slightly longer pull-up.
flyFor(6,()=>({left:swoop.pitch<.6}));
assert.ok(swoop.vy>5);assert.equal(swoop.stalled,false);
const climbSpeed=Math.hypot(swoop.vx,swoop.vy);
flyFor(2,()=>({left:true}));
assert.equal(swoop.stalled,true);assert.ok(Math.hypot(swoop.vx,swoop.vy)<climbSpeed*.9);assert.equal(swoop.capeLoad,0);assert.equal(swoop.wingTorn,false);
flyFor(2,()=>({right:true}));assert.equal(swoop.stalled,false);assert.equal(swoop.recovery,0);
assert.equal(swoop.fuel,swoop.maxFuel);wallSpecial.step=savedSpecial;
console.log('Piqué sans booster : accélération, ressource ascendante, ralentissement/décrochage et récupération validés.');

const soapProfile=C.rampProfile(G.parameters(G.fresh().levels).launchSpeed);
assert.ok(soapProfile.samples[0].speed*3.6<12);
assert.ok(soapProfile.samples.every(p=>p.speed*3.6<=120+1e-8));
assert.ok(soapProfile.samples.at(-1).speed*3.6>=90);
assert.ok(soapProfile.samples.at(-1).speed*3.6<=120);
console.log('Bouclier de départ : départ à 10,8 km/h, plafond de 120 km/h, décollage à '+(soapProfile.samples.at(-1).speed*3.6).toFixed(1)+' km/h.');

// Original player and scenery cadence; only monsters march more slowly.
assert.equal(C.X_SCALE,15);assert.equal(C.TIME_SCALE,1.75);
const screenAt100=(100/3.6)*C.X_SCALE*C.TIME_SCALE;
assert.ok(Math.abs(screenAt100-(100/3.6)*15*1.75)<1e-9);
console.log('Défilement à 100 km/h : '+screenAt100.toFixed(1)+' unités écran/s (cadence originale), compteur et cadence physique inchangés.');

const deletionStore=new Map(),deletionStorage={getItem:k=>deletionStore.get(k)||null,setItem:(k,v)=>deletionStore.set(k,v)};
const deletionData={active:null,slots:[]},da=P.create(deletionData,'A',G.fresh),db=P.create(deletionData,'B',G.fresh);
assert.equal(P.remove(deletionStorage,deletionData,'missing'),false);
assert.equal(P.remove({setItem(){throw Error('blocked');}},deletionData,db.id),false);assert.equal(deletionData.slots.length,2);
assert.ok(P.remove(deletionStorage,deletionData,db.id));assert.equal(deletionData.active,da.id);assert.equal(P.read(deletionStorage,G.sanitize).slots.length,1);
deletionStore.set('go-godefroy-go.v1',JSON.stringify({...G.fresh(),day:5,gold:100}));assert.ok(P.remove(deletionStorage,deletionData));assert.equal(deletionData.active,null);assert.equal(P.read(deletionStorage,G.sanitize).slots.length,0);
console.log('Suppression : partie ciblée, sélection active, échec de stockage, effacement global et absence de résurrection des anciennes sauvegardes validés.');

// The edge jump must visibly rise without booster input.
{const f=G.create(G.fresh()),y=f.y;for(let i=0;i<120;i++)G.step(f,1/120,{});assert.ok(f.y-y>5);assert.ok(f.maxY>y+5);}
