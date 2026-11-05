const assert=require('node:assert/strict'),BK=require('./headless');
for(const [startLv,endLv] of [[0,5],[5,0],[5,5]]){
 const props={'1,3':{lv:startLv},'6,3':{lv:endLv}};
 const w=new BK.World({map:Array(7).fill('...~~....'),props,mode:'adventure',explore:true,hearts:true});
 const p=w.addPlayer(BK.charById('adam'),6,3),e=w.addEnemy('baby_dragon',1,3);
 e.followBlockedT=1;w.dragonFollow(e,p,0);assert(e.followFlight);
 const flight={...e.followFlight},dt=1/120;
 let previous={x:e.x,y:e.y,z:w.groundZ(e.x,e.y)},lastVelocity=null;
 for(let i=0;e.followFlight&&i<3600;i++){
  w.dragonFollow(e,p,dt);
  const current={x:e.x,y:e.y,z:w.groundZ(e.x,e.y)+e.z};
  const velocity={x:(current.x-previous.x)/dt,y:(current.y-previous.y)/dt,z:(current.z-previous.z)/dt};
  assert(Math.abs(velocity.z)<2.21,'vitesse verticale limitée même sur une grande descente');
  if(lastVelocity)assert(Math.hypot(velocity.x-lastVelocity.x,velocity.y-lastVelocity.y,velocity.z-lastVelocity.z)<.2,'aucun changement brutal de direction');
  if(e.followFlight){
   assert(current.z>=w.groundZ(e.x,e.y)-1e-6,'reste au-dessus du terrain');
  }else assert(Math.hypot(velocity.x,velocity.y,velocity.z)<.08,'contact au sol presque immobile');
  previous=current;lastVelocity=velocity;
 }
 assert.equal(e.followFlight,null);assert.equal(e.z,0);
 assert.equal(e.x,flight.x1);assert.equal(e.y,flight.y1);
}
console.log('Dragon : trajectoire continue, descente limitée et contact doux, vers et depuis la hauteur 5 OK.');
