const assert = require('node:assert/strict');
const G = require('./physics.js');
let checks=0;function ok(value){assert.ok(value);checks++;}
function run(level,angle=20,boost=true,launchLevel=level){const s=G.fresh();s.witchFound=true;for(const k in s.levels)s.levels[k]=level;const f=G.create(s,angle);let steps=0;while(!f.ended&&steps++<40000){G.step(f,1/60,{boost});ok(Number.isFinite(f.x)&&Number.isFinite(f.y)&&f.fuel>=0);}ok(f.ended);return {s,f};}
const basic=run(0);ok(basic.f.x<2000);ok(basic.f.endReason==='ground');
const improved=run(1);ok(improved.f.launchSpeed>basic.f.launchSpeed);ok(['ground','wall'].includes(improved.f.endReason));
// Campaign walls persist across attempts; verify final objective after the fully upgraded run.
const max=run(8,20,true,24);max.f.ended=false;max.f.netted=null;max.f.nets=[];max.f.x=100700;max.f.y=900;max.f.vx=500;max.f.vy=0;for(let i=1;i<9;i++)max.f.wallsBroken.add(i);for(let i=0;i<1200&&!max.f.ended;i++)G.step(max.f,1/120,{});ok(max.f.newGoals.includes(7)&&max.f.endReason==='victory'&&max.f.sorcererDown&&max.f.sorcererTouched);
const reward=G.settle(max.s,max.f);ok(reward>5000);const gold=max.s.gold;ok(G.settle(max.s,max.f)===0&&max.s.gold===gold);ok(max.s.completed.slice(4).every(Boolean));// the magic-world oaths do not depend on the altitude oaths before them

const s=G.fresh();ok(!G.buy(s,'launch'));s.gold=10000000;for(let i=0;i<24;i++)ok(G.buy(s,'launch'));ok(!G.buy(s,'launch'));ok(!G.buy(s,'invalid'));ok(s.levels.launch===24&&s.gold>=0);
const loaded=G.sanitize({gold:-4,levels:{wing:99,boost:'invalid'},completed:[true]});ok(loaded.gold===0&&loaded.levels.wing===40&&loaded.levels.boost===0);ok(loaded.completed.length===8&&loaded.completed[0]&&!loaded.completed[1]);
const torn=G.create(G.fresh(),75);for(let i=0;i<180;i++)G.step(torn,1/60,{});ok(torn.pitch<75*Math.PI/180);ok(!torn.wingTorn);
const noBoost=run(0,20,false);ok(noBoost.f.maxY<basic.f.maxY);
// Before the witch the only boost is Godefroy's own gas: three short toots, a tiny push each, and a belly that refills slowly.
// Her hut swaps it for the first real booster on contact, at any speed.
{const s=G.fresh(),f=G.create(s),C=require('./course.js');ok(f.fartMode&&f.maxFuel===G.FART.count&&f.fuel===G.FART.count&&!f.boosting);
 const plain=G.create(G.fresh()),toot=G.create(G.fresh());for(const g of [plain,toot]){g.y=600;g.vx=20;g.vy=0;}
 for(let i=0;i<120;i++){G.step(plain,1/120,{});G.step(toot,1/120,{boost:true});}ok(toot.farts===1&&toot.fuel<G.FART.count&&toot.vx>plain.vx+1&&toot.vx<plain.vx+7&&!toot.boosting);
 // One toot is strong enough to carry the bare first armour a little upward, without turning into a rocket.
 ok(toot.y>600+40&&toot.y<600+260&&toot.y>plain.y+120);
 for(let n=0;n<4;n++){for(let i=0;i<70;i++)G.step(toot,1/120,{});for(let i=0;i<70;i++)G.step(toot,1/120,{boost:true});}ok(toot.farts===3&&toot.fuel<1);
 toot.y=5000;for(let i=0;i<120*G.FART.refill*1.2;i++)G.step(toot,1/120,{});ok(toot.fuel>=1);
 f.x=C.witchHut.x-13;f.y=C.witchHut.y;f.vx=3;f.vy=0;for(let i=0;i<600&&!f.witchFound;i++)G.step(f,1/120,{});ok(f.witchFound&&!f.fartMode&&f.maxFuel>G.FART.count-1&&f.fuel===f.maxFuel);f.time=1;G.settle(s,f);ok(s.witchFound);ok(!G.create(s).fartMode&&G.create(s).maxFuel>0);ok(!G.activeMissions(G.fresh()).some(m=>G.missions[m.id].icon==='🔥'));ok(G.sanitize({levels:{boost:2}}).witchFound&&!G.sanitize({levels:{boost:0}}).witchFound);}
// Cannon nets look the same at any speed: a rise to a fixed spot ahead of and below the knight, then a glide of fixed length
// toward where he will be. Flying straight on gets caught, pulling up escapes.
{const shot=(v,input)=>{const s=G.fresh();s.witchFound=true;s.levels.wing=12;s.levels.launch=12;const f=G.create(s);f.x=3000;f.y=1800;f.vx=v;f.vy=0;f.pitch=.1;f.nets=[{id:1,x:f.x+300,y:90,sx:f.x+300,sy:90,vx:0,vy:0,age:0}];let at=null;for(let i=0;i<120*6.5&&!f.netted&&!f.ended;i++){const n=f.nets.find(n=>n.id===1);G.step(f,1/120,n&&n.lockAt!==undefined?input:{});const m=f.nets.find(n=>n.id===1);if(m&&m.lockAt!==undefined&&!at)at={dx:m.x-f.x,dy:m.y-f.y,age:m.age};}return {f,at};};
 const slow=shot(60,{}),fast=shot(110,{});ok(slow.at&&fast.at&&Math.abs(slow.at.dx-fast.at.dx)<3&&Math.abs(slow.at.dy-fast.at.dy)<25&&slow.at.dx>20&&slow.at.dy<-250&&Math.abs(slow.at.age-fast.at.age)<.02);
 ok(slow.f.netted&&!shot(60,{left:true}).f.netted&&!shot(60,{right:true}).f.netted);}
// Castle tunnel: a knight coming in under the lintel flies through it himself. Steering between floor and roof keeps the speed,
// rubbing an edge slows him down, a crawl speed always carries him out; a high knight still hits the castle.
{const C=require('./course.js'),t=C.castleTunnel,go=(y,v,pilot)=>{const f=G.create(G.fresh());f.x=t.enter-25;f.y=y;f.vx=v;f.vy=0;let inside=false,deepest=0,touched=0,out=0;for(let i=0;i<9000&&!f.ended&&f.x<t.exit+40;i++){const was=f.tunnel;G.step(f,1/120,pilot?pilot(f):{});if(f.tunnel){inside=true;deepest=Math.min(deepest,f.y);if(f.tunnel.edge)touched++;ok(f.y>=C.tunnelFloor(f.x)-1e-6&&f.y<=C.tunnelRoof(f.x)-t.body+1e-6);}if(was&&!f.tunnel)out=f.vx;}return {f,inside,deepest,touched,out};};
 const middle=f=>{if(!f.tunnel)return {};const mid=(C.tunnelFloor(f.x)+C.tunnelRoof(f.x)-t.body)/2;return {left:f.y<mid-15,right:f.y>mid+15};},up=f=>f.tunnel?{left:true}:{};
 ok(t.height>=380&&t.exit-t.enter>=280&&C.tunnelRoof(t.x-27)<0&&C.tunnelRoof(t.x+27)<0&&C.tunnelOpen(t.enter+10)&&C.tunnelOpen(t.exit-10)&&!C.tunnelOpen(t.x));
 // Dropping into an open trench from above also leads into the tunnel instead of ending the flight on thin air.
 {const f=G.create(G.fresh());f.x=t.enter+40;f.y=60;f.vx=6;f.vy=-4;for(let i=0;i<600&&!f.tunnel&&!f.ended;i++)G.step(f,1/120,{});ok(f.tunnel&&!f.ended);for(let i=0;i<9000&&f.tunnel;i++)G.step(f,1/120,{});ok(f.x>=t.exit&&!f.tunnel);}
 const clean=go(100,45,middle),rub=go(100,45,up),slow=go(30,7),high=go(1000,40);
 ok(clean.inside&&clean.touched<=2&&clean.f.x>t.exit&&clean.deepest<-t.depth/2&&clean.f.endReason!=='tower');
 ok(rub.inside&&rub.touched>200&&rub.out<clean.out*.7&&rub.out>=13.9&&rub.f.x>t.exit);
 ok(slow.inside&&slow.f.x>t.exit&&slow.out>=13.9);ok(!high.inside&&high.f.endReason==='tower');
 // The gallery's draught gives a light, capped push to a knight who stays off the edges.
 {const f=G.create(G.fresh());f.x=t.enter+t.ramp+5;f.y=C.tunnelFloor(f.x)+150;f.vx=20;f.vy=0;f.tunnel={at:0,scrape:0};const v=f.vx;for(let i=0;i<60;i++)G.step(f,1/120,middle(f));ok(f.vx>v+.5&&f.tunnel.wind>0&&f.tunnel.wind<=9+1e-9);}
 // Ramp jump: no kick without a jump, a full kick when perfectly timed, less otherwise; the upgrade makes every jump stronger.
 const manual=q=>{const f=G.create(G.fresh(),undefined,true),v=f.vy;if(q!==null)G.jump(f,q);return f.vy-v;};
 ok(manual(null)===0&&manual(1)>manual(.5)&&manual(.5)>0&&Math.abs(manual(1)-G.jumpKick(G.fresh().levels))<1e-9);
 // The golden-line jump kicks harder than a perfect one, and nothing can exceed it.
 ok(manual(G.JUMP_GOD)>manual(1)*1.2&&manual(9)===manual(G.JUMP_GOD));
 {const f=G.create(G.fresh(),undefined,true);ok(G.jump(f,1)>0&&G.jump(f,1)===0);const strong=G.fresh();strong.levels.jump=10;ok(G.jumpKick(strong.levels)>G.jumpKick(G.fresh().levels)+10);}
 // Destruction combo: 10, 15, 25, 35… each destruction pays more, and the bill shows it.
 {const M=require('./monsters.js'),f=G.create(G.fresh());ok([1,2,3,4,5].map(M.comboGold).join()==='10,15,25,35,45');for(let i=0;i<4;i++)M.combo(f,0,0);ok(f.combo===4&&f.comboGold===85);f.time=1;const bill=G.earnings(f),row=bill.rows.find(r=>r.id==='combo');ok(row&&row.gold===85&&row.value===4);}
 // A gull dragged into a tower earns the same special bonus as into a rampart.
 {const f=G.create(G.fresh());f.time=1;f.endReason='tower';f.gullTowerBonus='tower';ok(G.earnings(f).bonuses.some(b=>b.gold===500));f.gullTowerBonus=null;ok(!G.earnings(f).bonuses.some(b=>b.gold===500));}
 const base=G.fresh(),boosted=G.fresh();boosted.levels.jump=10;ok(G.create(boosted).vy>G.create(base).vy+10);}
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
for(const row of ledger.rows){const rates={distance:.08,altitude:.12,duration:2,speed:.06,destruction:40,stones:2,collected:1};if(row.id==='altitude'){assert.equal(row.gold,Math.floor(Math.min(row.value,1000)*.08+Math.max(0,row.value-1000)*.012));continue;}if(row.id==='combo'){assert.equal(row.gold,Array.from({length:row.value},(_,i)=>require('./monsters.js').comboGold(i+1)).reduce((a,b)=>a+b,0));continue;}assert.equal(row.gold,Math.floor(row.value*rates[row.id]));}
const wallet=G.fresh(),before=wallet.gold,paid=G.settle(wallet,basic.f);assert.equal(wallet.gold-before,paid);assert.equal(paid,ledger.total);assert.equal(G.settle(wallet,basic.f),0);
const again=G.create(wallet,20);again.x=basic.f.x;again.maxY=basic.f.maxY;again.time=basic.f.time;again.maxSpeed=basic.f.maxSpeed;assert.equal(G.earnings(again).bonuses.filter(b=>b.rate!=='Mission réussie').length,0);
const prior=G.sanitize({gold:123,levels:{launch:3},completed:[true,true,true,true]});assert.equal(prior.gold,123);assert.equal(prior.levels.launch,19);assert.deepEqual(prior.completed,[true,true,true,true,false,false,false,false]);

console.log('Bilan détaillé, total exact, versement unique, huit objectifs et campagne de 100 km validés.');
// Catalog and physics share the exact values displayed before purchase.
for(let l=0;l<=G.MAX_LEVEL;l++){
 const levels={launch:l,wing:l,boost:l,armor:l,impact:l},p=G.parameters(levels),state={...G.fresh(),witchFound:true,levels},f=G.create(state,20);
 assert.equal(f.maxFuel,p.fuel);assert.ok(Math.abs(f.vx-Math.cos(C.launchPose(1,20,p.launchSpeed,f.l.launch).rotation)*p.launchSpeed)<1e-8);
 assert.equal(G.stats('boost',l)[0].value,p.thrust);assert.equal(G.stats('boost',l)[1].value,f.maxFuel/C.TIME_SCALE);assert.equal(G.stats('impact',l)[0].value,p.impactMultiplier);
}
const E=require('./equipment.js');for(const id of ['launch','wing','boost','armor','impact'])for(let l=0;l<=8;l++){const source=E.svg(id,l);assert.ok(source.includes('<path'));assert.equal(require('fs').readFileSync(require('path').join(__dirname,'assets/equipment',`${id}-${l}.svg`),'utf8'),source);}


// Spatial stones: velocity is consumed while drilling, with no rectangular tunnel cut.
function strike(save,speed=45,ram=false,y=200){const f=G.create(save);f.x=2400;f.y=y;f.vx=speed;f.vy=0;f.ramTime=ram?1:0;G.strikeStones(f,1990,y);return f;}
const wallSave=G.fresh(),blocked=strike(wallSave);assert.equal(blocked.endReason,'wall');assert.ok(blocked.wallStones>1);assert.ok(blocked.x>2000&&blocked.x<2150);assert.equal(blocked.stage,0);
assert.deepEqual(wallSave.wallDamage,{});blocked.time=1;G.settle(wallSave,blocked);const loadedWall=G.sanitize(JSON.parse(JSON.stringify(wallSave)));assert.deepEqual(loadedWall.wallDamage,blocked.wallDamage);
const second=strike(loadedWall);assert.ok(second.x>blocked.x);assert.ok(Object.keys(second.wallDamage[1]).length>Object.keys(blocked.wallDamage[1]).length);
const differentHeight=strike(loadedWall,45,false,800);assert.ok(differentHeight.x<second.x);assert.ok(differentHeight.wallDamage[1]['0:19']);
const slowHit=strike(G.fresh(),35),fastHit=strike(G.fresh(),55);assert.ok(fastHit.wallStones>slowHit.wallStones);assert.ok(fastHit.x>slowHit.x);
const inertial=G.fresh();inertial.levels.impact=1;assert.ok(strike(inertial,40,true).wallStones>strike(inertial,40).wallStones);
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
// It runs far above everything, so the thin air of high altitude is switched off for its duration.
const thinAir={...G.CLIMB};Object.assign(G.CLIMB,{linear:0,drag:0,fade:1e12});
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
assert.equal(swoop.fuel,swoop.maxFuel);wallSpecial.step=savedSpecial;Object.assign(G.CLIMB,thinAir);
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

// Ramp upgrades are plainly visible (+110 of height, +170 of length per level, the descent stretching with them) while the
// takeoff speed keeps its former per-level scale.
{const C=require('./course.js'),speed=l=>G.parameters({...G.fresh().levels,...l}).launchSpeed;
 C.setUpgrades(0,0);const base=C.rampGeometry(0),v0=speed({});
 C.setUpgrades(1,0);const tall=C.rampGeometry(0),vh=speed({});ok(base.top-tall.top===110&&tall.turn>base.turn&&Math.abs(vh/v0-Math.sqrt(1+55/650))<1e-9);
 C.setUpgrades(0,1);const long=C.rampGeometry(0),vl=speed({});ok(long.end-base.end===170&&Math.abs(long.turn-base.turn-102)<1e-9&&Math.abs(vl/v0-Math.sqrt(1+80/1800))<1e-9);
 C.setUpgrades(10,10);const big=C.rampGeometry(0);let steep=0;for(let x=0;x<big.end;x+=5)steep=Math.max(steep,C.rampSlope(x,20,0));
 ok(big.bottom-big.top>2.8*(base.bottom-base.top)&&big.end>2.8*base.end&&steep<1.3&&C.rampProfile(speed({}),20,0).duration<8);
 C.setUpgrades(10,0);steep=0;for(let x=0;x<C.rampGeometry(0).end;x+=5)steep=Math.max(steep,C.rampSlope(x,20,0));ok(steep<2.3);C.setUpgrades(0,0);}
// Boosters make the biggest difference: they cost five times the former price.
{const boost=G.categories.find(c=>c.id==='boost');ok(G.price(boost,0)===900&&G.price(boost,1)===2880&&G.price(boost,7)===99000);}
// "Dodge N nets" missions were appended (older saves keep their mission ids) and come up from tier 5, after that tier's missions.
{ok(G.missions[0].label==='Parcourir 200 m en un vol'&&G.missions[11].label==='Parcourir 400 m en un vol');
 const net=G.missions.findIndex(m=>m.icon==='🕸️'),first=G.missions[net];ok(first.tier===5&&first.target===1&&first.sum&&first.label==='Éviter 1 filet');
 const at=G.missionOrder.indexOf(net);ok(G.missions[G.missionOrder[at-1]].tier===5&&G.missions[G.missionOrder[at+1]].tier===6);
 ok(new Set(G.missionOrder).size===G.missions.length&&G.activeMissions(G.fresh()).map(m=>m.id).join()==='0,1,2');
 const shot=input=>{const s=G.fresh();s.witchFound=true;s.levels.wing=12;s.levels.launch=12;s.missionProgress={};for(const id of G.missionOrder.slice(0,at))s.missionProgress[id]=G.missions[id].target;const f=G.create(s);f.x=3000;f.y=1800;f.vx=60;f.vy=0;f.pitch=.1;f.nets=[{id:1,x:f.x+300,y:90,sx:f.x+300,sy:90,vx:0,vy:0,age:0}];for(let i=0;i<120*6.5&&!f.netted&&!f.ended;i++){const n=f.nets.find(n=>n.id===1);G.step(f,1/120,n&&n.lockAt!==undefined?input:{});}return f;};
 const dodged=shot({left:true}),caught=shot({});ok(dodged.netsDodged===1&&!dodged.netted&&caught.netted&&!caught.netsDodged);
 ok(dodged.missionSlots[0].id===net&&G.missionStatus(dodged)[0].done&&!G.missionStatus(caught)[0].done);}
// "Trésors doublés": coins, purses and rampart chests picked up in flight are worth double once bought.
{const Sp=require('./specials.js'),C=require('./course.js'),s=G.fresh();s.gold=1499;ok(!G.buyPassive(s,'doubleGold'));s.gold=1500;ok(G.buyPassive(s,'doubleGold')&&s.gold===0&&!G.buyPassive(s,'doubleGold')&&G.treasureFactor(s)===2&&G.treasureFactor(G.fresh())===1);
 ok(G.sanitize(JSON.parse(JSON.stringify(s))).passives.doubleGold===1&&G.sanitize({}).passives.doubleGold===0);
 const grab=save=>{const f=G.create(save);const a=Sp.treasureNearby(2000,6000,f,100,2000)[0];f.x=a.x+1;f.y=a.y;Sp.collectTreasures(f,a.x-1,a.y);const chest=C.wallCaches(1)[0];f.x=chest.x+1;f.y=chest.y;Sp.collectWallTreasures(f,chest.x-1,chest.y);return {f,a,chest};};
 const plain=grab(G.fresh()),rich=grab(s);ok(plain.f.collectedGold===plain.a.value&&rich.f.collectedGold===2*rich.a.value);
 ok(plain.f.wallTreasureGold===plain.chest.value&&rich.f.wallTreasureGold===2*rich.chest.value);}
console.log('Rampe plus marquée, boosters ×5, mission des filets et trésors doublés validés.');

// Flying bombs: very rare, a big push forward (even past the top speed for a moment) and a medium kick upward; each one counts
// as a bonus object and as a combo hit. A netted knight cannot grab one.
{const Sp=require('./specials.js'),s=G.fresh();s.witchFound=true;s.levels.wing=12;s.levels.launch=6;const f=G.create(s),max=G.parameters(f.l).maxSpeed;
 const all=[];for(let x=0;x<60000;x+=3000)all.push(...Sp.bombNearby(x,x+3000,f,0,3000));const ids=new Set(all.map(a=>a.id));
 ok(ids.size>=4&&ids.size<60&&all.every(a=>a.y>=170),'rare but present: '+ids.size);
 const a=all[0],hit=(vx,netted)=>{const k=G.create(s);k.x=a.x+1;k.y=a.y;k.vx=vx;k.vy=-2;k.netted=netted?{at:0,id:1}:null;Sp.collectBombs(k,a.x-1,a.y,max);return k;};
 const slow=hit(20),fast=hit(max*.98),caught=hit(20,true);
 ok(slow.airBombs===1&&slow.vx>=42&&slow.vy>5&&slow.vy<=Sp.BOMB.lift+.01&&slow.pickupCounts.bomb===1&&slow.combo===1&&slow.monsterEvents.some(e=>e.type==='airbomb'));
 ok(fast.vx>max*1.15&&fast.vx<=max*Sp.BOMB.over+1e-9&&!caught.airBombs&&caught.vx===20);
 Sp.collectBombs(slow,a.x-1,a.y,max);ok(slow.airBombs===1);
 // In a real step the boost survives the speed limiter and the knight climbs.
 const k=G.create(s);k.x=a.x-1;k.y=a.y;k.vx=30;k.vy=0;k.pitch=.1;const y0=k.y;for(let i=0;i<120;i++)G.step(k,1/120,{});ok(k.airBombs===1&&k.vx>40&&k.maxY>y0+60,'vx '+k.vx+' dy '+(k.maxY-y0));}
console.log('Bombes volantes validées : rares, poussée, hauteur, combo, filet.');

// No flat time limit any more: a flight that keeps moving is never cut (the old 300 s cap stopped fast knights around 38 km).
// Only a knight who has made no headway for two simulated minutes is stopped.
{const s=G.fresh();s.witchFound=true;s.levels.wing=12;s.levels.launch=12;const f=G.create(s);f.time=350;f.y=600;G.step(f,1/120,{});ok(!f.ended,'old cap gone');
 let stuck=G.create(s),n=0;while(!stuck.ended&&n++<120*130){stuck.x=1300;stuck.y=300;stuck.vx=0;stuck.vy=0;G.step(stuck,1/120,{});}ok(stuck.endReason==='timeout'&&stuck.time>=120&&stuck.time<125,'stuck '+stuck.endReason);
 // 1.4 m/s between two towers for 350 s: slow, but it never goes 120 s without gaining 150 m.
 const moving=G.create(s);n=0;while(!moving.ended&&n++<120*350){moving.x=1100+n/120*1.4;moving.y=300;moving.vx=0;moving.vy=0;G.step(moving,1/120,{});}ok(!moving.ended&&moving.time>300,'slow but moving '+moving.endReason);}
console.log('Limite de durée retirée : seul un chevalier immobile deux minutes est arrêté.');

// Climbing is hard work: free near the ground, costly in thin air. The same upward push carries far less at 2 500 m than at
// 300 m, wings carry less up high, and a full-effort climb with the first armour stays below the top of the net zone.
{const rise=y=>{const f=G.create(G.fresh());f.time=2;f.x=900;f.y=y;f.vx=40;f.vy=25;f.pitch=.2;const y0=f.y;for(let i=0;i<120*3&&f.vy>0;i++)G.step(f,1/120,{});return f.maxY-y0;};
 ok(G.climbDrag({y:0,vy:30})===0&&G.climbDrag({y:900,vy:-30})===0&&G.climbDrag({y:900,vy:10})>10&&G.climbDrag({y:2700,vy:10})>8*G.climbDrag({y:900,vy:10}));
 ok(G.airDensity(0)===1&&G.airDensity(2600)===.5&&G.airDensity(8000)<.1);
 const low=rise(300),high=rise(2500);ok(low>250&&high<low*.45,'low '+low+' high '+high);
 const s=G.fresh();s.witchFound=true;const f=G.create(s);G.jump(f,1);let n=0;while(!f.ended&&n++<120*60)G.step(f,1/120,{left:f.pitch<.52&&!f.stalled,right:f.pitch>.58||f.stalled,boost:true});ok(f.maxY<1400,'starter climb '+f.maxY);}
console.log('Montée : libre près du sol, coûteuse en altitude, zone des filets difficile à survoler.');

// ---- Dragon boss, portal and magic world.
{const C=require('./course.js'),Mg=require('./magic.js'),D=C.dragonBoss,W=C.magic;
 const knight=(save,v,x=D.x-400)=>{const s=save||G.fresh();s.witchFound=true;s.levels.wing=20;s.levels.launch=18;const f=G.create(s);f.x=x;f.y=900;f.vx=v;f.vy=0;return {s,f};};
 const fight=(save,v)=>{const {s,f}=knight(save,v),log=[];let n=0;while(!f.ended&&n++<120*120&&f.x<W.exit+300){if(f.dragon.hearts>0&&!f.dragon.bonked){f.y=Math.max(f.y,800);f.vx=Math.max(f.vx,v);}G.step(f,1/120,{});for(const e of f.monsterEvents.splice(0))if(/dragon|portal/.test(e.type))log.push(e.type);}return {s,f,log};};
 // The stage gate at 45 km is the dragon, not a wall; older saves start with three hearts.
 ok(C.stages[5].boss==='dragon'&&C.stages[5].magic&&C.stages[8].boss==='sorcerer'&&G.fresh().dragonHearts===3&&G.sanitize({}).dragonHearts===3&&!G.sanitize({}).dragonDefeated&&G.sanitize({dragonDefeated:true}).dragonHearts===0);
 // A fast knight sees it coming for the same distance at any speed, takes its three hearts, then glides into the portal.
 for(const v of [60,150,500]){const {s,f,log}=fight(null,v);ok(log.join()==='dragonroar,dragonhit,dragonhit,dragondown,portal','speed '+v+': '+log.join());
  ok(f.x>=W.exit&&f.x<W.exit+400&&f.stage===5&&f.wallsBroken.has(5)&&f.dragonHits===3&&f.dragonDown&&f.portalUsed&&!f.cruise&&f.vx>20&&f.y<W.ceiling);
  G.settle(s,f);ok(s.dragonDefeated&&s.dragonHearts===0&&f.earnings.bonuses.some(b=>b.label.includes('dragon'))&&f.earnings.bonuses.some(b=>b.label.includes('vaincu')));}
 // Every contact happens before the magic world begins, whatever the speed.
 {const {f}=knight(null,600);let last=0;for(let n=0;n<120*30&&!f.portalUsed;n++){f.y=Math.max(f.y,800);if(f.dragon.hearts>0)f.vx=Math.max(f.vx,600);G.step(f,1/120,{});if(!f.portalUsed)last=f.x;}ok(f.portalUsed&&last<W.start,'last '+last);}
 // Too slow: the dragon does not flinch, keeps its hearts, and the knight cannot get past.
 {const {s,f,log}=fight(null,25);ok(log.includes('dragonbonk')&&!log.includes('dragonhit')&&f.dragon.hearts===3&&f.x<W.start&&f.endReason==='ground');G.settle(s,f);ok(s.dragonHearts===3&&!s.dragonDefeated);}
 // Hearts lost are saved between flights.
 {const s=G.fresh();s.dragonHearts=1;const {f,log}=fight(s,150);ok(log.join()==='dragonroar,dragondown,portal'&&f.dragonHits===1);}
 // Once beaten, the portal stays open: no fight, the knight keeps his speed.
 {const s=G.fresh();s.dragonDefeated=true;const {f,log}=fight(s,150);ok(log.join()==='portal'&&f.stage===5&&f.vx>100);}
 // Magic world: ceiling, breakable heavy trees, fairy armour, and shots that hit a knight who does nothing.
 const inside=(v=90)=>{const s=G.fresh();s.dragonDefeated=true;const {f}=knight(s,v,W.exit+100);f.wallsBroken.add(5);f.portal=null;return f;};
 {const f=inside();f.y=W.ceiling-5;f.vy=20;for(let i=0;i<60;i++)G.step(f,1/120,{});ok(f.y<=W.ceiling&&f.ceilingHits>=1&&f.vy<=0);}
 {const f=inside(),t=Mg.near('tree',W.start,W.start+20000,f,300,2000)[0];ok(t);f.x=t.x-2;f.y=t.y;f.vx=100;f.vy=0;const before=f.hits;G.step(f,1/120,{});ok(f.treesBroken===1&&f.vx<100*Mg.TREE_SLOW+2&&f.hits===before+1&&f.combo>=1);
  const g=inside();g.fairy={left:5,total:5};g.x=t.x-2;g.y=t.y;g.vx=100;g.vy=0;G.step(g,1/120,{});ok(g.treesBroken===1&&g.vx>85);}
 {const f=inside(60),a=Mg.near('fairy',W.start,W.start+30000,f,300,2500)[0];ok(a);f.x=a.x-2;f.y=a.y;f.vx=60;f.vy=0;G.step(f,1/120,{});ok(f.fairy&&Math.abs(f.fairy.left-Mg.ARMOUR)<.1&&f.fairies===1);
  const v0=f.vx;let t=0;while(f.fairy&&t++<120*30){f.y=Math.max(f.y,600);G.step(f,1/120,{});}ok(Math.abs(t/120-Mg.ARMOUR)<.2&&Math.abs(Mg.ARMOUR/C.TIME_SCALE-10)<1e-9&&f.maxSpeed>v0+20,'armour '+t/120+' max '+f.maxSpeed);}
 for(const kind of ['bolt','spear','anvil']){const shoot=(input,armour)=>{const f=inside(70);f.x=W.start+2600;f.y=1200;f.vx=70;f.magicNext=1e9;if(armour)f.fairy={left:60,total:60};const c=Mg.SHOT[kind];f.magicShots=[{kind,key:'t',sx:f.x+200,sy:kind==='anvil'?2400:kind==='spear'?1300:70,x:f.x+200,y:70,age:0}];for(let i=0;i<120*(c.rise+c.glide+1)&&!f.ended;i++){const n=f.magicShots[0];G.step(f,1/120,n&&n.lockAt!==undefined?input:{});}return f;};
  const still=shoot({}),up=shoot({left:true}),safe=shoot({},true);ok(still.magicHits===1&&!up.magicHits&&up.magicDodged===1&&!safe.magicHits&&(safe.deflects===1||safe.magicDodged===1),kind+' '+still.magicHits+' '+up.magicHits+' '+up.magicDodged+' '+safe.deflects);}
 // Wizards, bird-men and anvils do fire on a knight flying through; magic towers are taller.
 {const f=inside(90);const seen=new Set();for(let n=0;n<120*90&&!f.ended;n++){f.y=Math.max(500,Math.min(1500,f.y));f.vx=Math.max(f.vx,80);G.step(f,1/120,{});for(const e of f.monsterEvents.splice(0))if(e.type==='shot')seen.add(e.kind);}ok(seen.has('bolt')&&seen.has('spear')&&seen.has('anvil'),[...seen].join());}
 ok(G.allTowers.find(t=>t.x>W.start&&!t.cloud).h>G.allTowers.find(t=>t.x>3000&&t.x<W.start&&!t.cloud).h*2);
}
console.log('Dragon, portail, monde magique (plafond, arbres, fées, sorts, lances, enclumes) et Grand Sorcier validés.');
