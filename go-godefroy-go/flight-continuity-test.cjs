const SpecialEncounters=require('./specials');SpecialEncounters.step=()=>{};
const assert=require('node:assert/strict'),G=require('./physics'),C=require('./course'),M=require('./monsters');
const collide=M.collide;M.collide=()=>{};
let runs=0;
for(let level=0;level<25;level++)for(const mode of ['neutral','dive','pullup','boost']){
 const save=G.fresh();save.levels.launch=level;const f=G.create(save),pose=C.launchPose(1,20,f.launchSpeed,level);
 assert(Math.abs(f.vx-Math.cos(pose.rotation)*f.launchSpeed)<1e-8,'horizontal momentum at release');
 let peak=f.y,apices=0,previousVy=f.vy,start=f.y,previousSpeed=Math.hypot(f.vx,f.vy);
 for(let n=0;n<3600&&!f.ended&&!f.bounces;n++){
  const x=f.x,y=f.y,vx=f.vx,vy=f.vy,broken=f.broken.size,damage=f.damageRevision,tower=f.towerRevision||0;
  G.step(f,1/120,{right:mode==='dive'&&n>50&&n<150,left:mode==='pullup'&&n>100&&n<200,boost:mode==='boost'});
  const speed=Math.hypot(f.vx,f.vy);
  assert(Number.isFinite(f.x+f.y+speed));assert(speed<=G.parameters(f.l).maxSpeed+1e-7);
  if(!f.ended&&!f.bounces&&f.broken.size===broken&&f.damageRevision===damage&&(f.towerRevision||0)===tower&&!(f.y>220&&G.thermalCenters.some(center=>Math.abs(f.x-center)<100))){
   assert(Math.abs(f.x-x-f.vx/120)<1e-7,'no hidden sideways multiplier');
   assert(Math.abs(f.y-y-f.vy/120*C.AIR_Y_SCALE)<1e-7,'no scripted vertical offset');
   if(mode==='neutral'&&level===0)assert(Math.abs(speed-previousSpeed)<.2,'no sudden speed change');
  }
  if(previousVy>0&&f.vy<=0)apices++;previousVy=f.vy;previousSpeed=speed;peak=Math.max(peak,f.y);
 }
 if(level===0&&mode==='neutral'){assert.equal(apices,1);assert((peak-start)*C.SCALE>240&&(peak-start)*C.SCALE<280);assert(f.time/C.TIME_SCALE>3&&f.time/C.TIME_SCALE<5);assert(f.x>45);console.log('Base: peak',((peak-start)*C.SCALE).toFixed(1),'px, flight',(f.time/C.TIME_SCALE).toFixed(2),'s, range',f.x.toFixed(1),'m');}
 runs++;
}
M.collide=collide;
for(const dt of [1/30,1/60,1/120]){const f=G.create(G.fresh());for(let t=0;t<1-1e-8;t+=dt)G.step(f,dt,{});if(dt===1/30)global.reference=f;else{assert(Math.abs(f.x-reference.x)<1e-7);assert(Math.abs(f.y-reference.y)<1e-7);}}
console.log(runs+' full flight scenarios: 25 launch items × neutral/dive/pull-up/boost; continuity, caps, apex and 30/60/120 Hz agree.');
