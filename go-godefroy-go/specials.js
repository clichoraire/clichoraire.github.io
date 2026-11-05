/* Deterministic, local encounters; consumed objects and effects rewind with flight. */
(function(root){
'use strict';
const M=typeof module!=='undefined'?require('./monsters.js'):root.GGMonsters;
const Course=typeof module!=='undefined'?require('./course.js'):root.GGCourse;
// 5 · white cloud, 10 · big rain cloud, 11 · twin clouds with a rainbow (best bounce). 6 · shooting star, space only.
const names=['FLEUR RESSORT !','POP !','SUPER POP !','AU SECOURS !','FEU À BORD !','POUF !','ÉTOILE FILANTE !','','','KABOOM !','SPLASH ! POUF !','ARC-EN-CIEL ! POUF !'];
const colors=['#ff8fc8','#b4efff','#ff6277','#fff9d4','#ffa447','#f4fbff','#ffe56d','#ffffff','#7ce8ed','#ffac3b','#b9cde0','#ffd1f0'];
const CLOUDS=[5,10,11],SPACE_ROW=50,CLOUD_ROW=18;
function level(f){return Math.max(0,Math.min(10,f.l?.specialItems||0));}
// Nothing grows or stands in the open mouths of the castle tunnel.
function inMouth(x){const t=Course.castleTunnel;return (x>t.enter-12&&x<t.enter+t.ramp*.85)||(x>t.exit-t.ramp*.85&&x<t.exit+12);}
// A cell is regenerated from its coordinates, never stored as a whole world.
const ROW=420,COL=95,STRIDE=1000000;
function at(id,f){const row=Math.floor(id/STRIDE),col=id%STRIDE,n=level(f),seed=col*47+row*7919+(f.combatSeed||0),r=M.hash(seed+19);
 // Altitude bands: ground, balloons and gulls, then the cloud world (towers on clouds), then space with shooting stars.
 const pool=row===0?[0,0,8,8,1,2,3,9,9]:row<CLOUD_ROW?[1,2,3,4,1,2]:row<SPACE_ROW?[5,5,10,10,11,3,4,5]:[6,6,6,6];
 const kind=pool[Math.min(pool.length-1,Math.floor(r*pool.length))];
 return {id,kind,x:65+col*COL+M.hash(seed)*55,y:kind===9?164:kind===8?50:kind===0?68:row*ROW+95+M.hash(seed+67)*290,rx:kind===9?18:kind===8?9:kind===4?9:kind===10?11:kind===11?12:kind===3?11:7,ry:kind===9?114:kind===8?28:kind===4?95:kind===10?85:kind===11?75:kind===3?120:65,active:M.hash(seed+29)<.15+n*.045&&!(row===0&&inMouth(65+col*COL+M.hash(seed)*55))};}
function nearby(left,right,f,low=(f.y||0)-650,high=(f.y||0)+650){const out=[],first=Math.max(0,Math.floor((left-130)/COL)),last=Math.max(first,Math.ceil(right/COL));
 const firstRow=Math.max(0,Math.floor((low-100)/ROW)),lastRow=Math.max(firstRow,Math.ceil(high/ROW));
 for(let row=firstRow;row<=Math.min(firstRow+8,lastRow);row++)for(let col=first;col<=Math.min(first+30,last)&&out.length<64;col++){const a=at(row*STRIDE+col,f);if(a.active&&a.x>=left-12&&a.x<=right+12&&a.y>=low-110&&a.y<=high+110)out.push(a);}return out;}
function treasureAt(id,f){const row=Math.floor(id/STRIDE),col=id%STRIDE,seed=col*131+row*3571+(f.combatSeed||0)+981;
 const bag=M.hash(seed+7)>.84;return {id,bag,value:bag?25:5,x:45+col*75+M.hash(seed)*35,y:row*300+65+M.hash(seed+11)*190,active:M.hash(seed+31)<.48};}
function treasureNearby(left,right,f,low=(f.y||0)-500,high=(f.y||0)+500){const out=[],c0=Math.max(0,Math.floor((left-80)/75)),r0=Math.max(0,Math.floor(low/300));
 for(let r=r0;r<=Math.min(r0+7,Math.ceil(high/300));r++)for(let c=c0;c<=Math.min(c0+28,Math.ceil(right/75))&&out.length<48;c++){const a=treasureAt(r*STRIDE+c,f);if(a.active&&a.x>=left-12&&a.x<=right+12&&a.y>=low-40&&a.y<=high+40)out.push(a);}return out;}
function collectTreasures(f,px,py){
 f.treasureUsed??=new Set();f.goldEffects??=[];f.goldEffects=f.goldEffects.filter(e=>f.time-e.at<1.1);
 for(const a of treasureNearby(Math.min(px,f.x)-12,Math.max(px,f.x)+12,f,Math.min(py,f.y)-60,Math.max(py,f.y)+60)){
  if(f.treasureUsed.has(a.id)||M.sweep(px-a.x,py-a.y,f.x-a.x,f.y-a.y,9,a.bag?77:65)===Infinity)continue;
  const value=a.value*(f.treasureFactor||1);
  f.treasureUsed.add(a.id);f.collectedGold=(f.collectedGold||0)+value;f.goldEffects.push({x:a.x,y:a.y,at:f.time,value});
  f.monsterEvents??=[];f.monsterEvents.push({x:a.x,y:a.y,type:'gold',gold:value});
 }
 for(const id of f.treasureUsed)if(treasureAt(id,f).x<f.x-800)f.treasureUsed.delete(id);
 if(f.goldEffects.length>20)f.goldEffects.splice(0,f.goldEffects.length-20);
}
// Independent sparse field: available from the first flight at every altitude.
function fuelAt(id,f){const row=Math.floor(id/STRIDE),col=id%STRIDE,seed=col*193+row*4219+(f.combatSeed||0)+7321;
 return {id,x:110+col*180+M.hash(seed)*75,y:row*350+110+M.hash(seed+11)*210,active:M.hash(seed+31)<.035};}
function fuelNearby(left,right,f,low=(f.y||0)-500,high=(f.y||0)+500){const out=[],c0=Math.max(0,Math.floor((left-190)/180)),r0=Math.max(0,Math.floor((low-100)/350));
 for(let r=r0;r<=Math.min(r0+7,Math.ceil(high/350));r++)for(let c=c0;c<=Math.min(c0+28,Math.ceil(right/180))&&out.length<32;c++){
  const a=fuelAt(r*STRIDE+c,f);if(a.active&&a.x>=left-14&&a.x<=right+14&&a.y>=low-80&&a.y<=high+80)out.push(a);
 }return out;}
function collectFuel(f,px,py){
 f.fuelUsed??=new Set();f.fuelEffects??=[];f.fuelEffects=f.fuelEffects.filter(e=>f.time-e.at<1.2);
 for(const a of fuelNearby(Math.min(px,f.x)-14,Math.max(px,f.x)+14,f,Math.min(py,f.y)-80,Math.max(py,f.y)+80)){
  if(!(f.maxFuel>0)||f.fartMode||f.fuel>=f.maxFuel||f.fuelUsed.has(a.id)||M.sweep(px-a.x,py-a.y,f.x-a.x,f.y-a.y,11,80)===Infinity)continue;
  const amount=Math.min(f.maxFuel*.30,f.maxFuel-f.fuel);f.fuel=Math.min(f.maxFuel,f.fuel+amount);f.fuelUsed.add(a.id);
  f.fuelEffects.push({...a,at:f.time,percent:Math.round(amount/f.maxFuel*100)});
  f.monsterEvents??=[];f.monsterEvents.push({type:'fuel',x:a.x,y:a.y});
 }
 for(const id of f.fuelUsed)if(fuelAt(id,f).x<f.x-800)f.fuelUsed.delete(id);
 if(f.fuelEffects.length>12)f.fuelEffects.splice(0,f.fuelEffects.length-12);
}
function collectWallTreasures(f,px,py,reach=1){
 f.wallTreasureClaimed??=[];f.chestEffects??=[];f.chestEffects=f.chestEffects.filter(e=>f.time-e.at<2.4);
 for(let i=1;i<Course.stages.length;i++){
  if(Math.max(px,f.x)<Course.stages[i].at-20||Math.min(px,f.x)>Course.stages[i].at+Course.wallWidth(i)+20)continue;
  for(const a of Course.wallCaches(i)){
   // The helmet reaches the chest even when the knight stops in the breach right beside it.
   if(f.wallTreasureClaimed.includes(a.id)||M.sweep(px-a.x,py-a.y,f.x-a.x,f.y-a.y,12*reach,80*reach)===Infinity)continue;
   const value=a.value*(f.treasureFactor||1);
   f.wallTreasureClaimed.push(a.id);f.wallTreasureGold=(f.wallTreasureGold||0)+value;
   f.chestEffects.push({id:a.id,x:a.x,y:a.y,value,at:f.time});
   f.goldEffects??=[];f.goldEffects.push({...a,value,y:a.y+40,at:f.time+.5});f.monsterEvents??=[];f.monsterEvents.push({type:'gold',gold:value,x:a.x,y:a.y,chest:true});
  }
 }
}
// Flying bombs: very rare, at every altitude. Catching one is a KABOOOOM: a big push forward (it may even exceed the
// equipment's top speed for a moment) and a medium kick upward.
const BOMB={col:260,row:450,chance:.02,speed:1.45,gain:22,over:1.25,lift:19};
function bombAt(id,f){const row=Math.floor(id/STRIDE),col=id%STRIDE,seed=col*271+row*5303+(f.combatSeed||0)+15013;
 return {id,x:150+col*BOMB.col+M.hash(seed)*150,y:row*BOMB.row+170+M.hash(seed+11)*260,active:col>0&&M.hash(seed+31)<BOMB.chance};}
function bombNearby(left,right,f,low=(f.y||0)-500,high=(f.y||0)+500){const out=[],c0=Math.max(0,Math.floor((left-310)/BOMB.col)),r0=Math.max(0,Math.floor((low-440)/BOMB.row));
 for(let r=r0;r<=Math.min(r0+9,Math.ceil(high/BOMB.row));r++)for(let c=c0;c<=Math.min(c0+28,Math.ceil(right/BOMB.col))&&out.length<16;c++){
  const a=bombAt(r*STRIDE+c,f);if(a.active&&a.x>=left-14&&a.x<=right+14&&a.y>=low-90&&a.y<=high+90)out.push(a);
 }return out;}
function collectBombs(f,px,py,maxSpeed){
 f.bombUsed??=new Set();
 if(f.ended||f.netted)return;
 for(const a of bombNearby(Math.min(px,f.x)-14,Math.max(px,f.x)+14,f,Math.min(py,f.y)-90,Math.max(py,f.y)+90)){
  if(f.bombUsed.has(a.id)||M.sweep(px-a.x,py-a.y,f.x-a.x,f.y-a.y,12,90)===Infinity)continue;
  f.bombUsed.add(a.id);f.airBombs=(f.airBombs||0)+1;f.pickupCounts??={};f.pickupCounts.bomb=(f.pickupCounts.bomb||0)+1;
  f.vx=Math.max(f.vx,Math.min(maxSpeed*BOMB.over,Math.max(f.vx*BOMB.speed,f.vx+BOMB.gain)));
  f.vy=Math.max(0,f.vy)*.3+Math.min(BOMB.lift,maxSpeed*.35);
  f.stalled=false;f.stall=0;f.pitch=.22;f.lastMonsterHop=undefined;f.kickUntil=(f.time||0)+1.4;f.message='BOMBE VOLANTE !';f.messageTime=1.8;
  f.monsterEvents??=[];f.monsterEvents.push({type:'airbomb',x:a.x,y:a.y});M.combo(f,a.x,a.y);
 }
 for(const id of f.bombUsed)if(bombAt(id,f).x<f.x-800)f.bombUsed.delete(id);
}
function step(f,px,py,dt,maxSpeed){
 collectTreasures(f,px,py);collectFuel(f,px,py);collectWallTreasures(f,px,py);collectBombs(f,px,py,maxSpeed);
 if(f.ended)return;
 f.specialUsed??=new Set();f.specialEffects??=[];
 f.specialEffects=f.specialEffects.filter(e=>f.time-e.at<1.3);
 if(f.gullRide&&!f.ended){f.gullRide.left-=dt;const target=Math.min(maxSpeed*.55,9+level(f)*.35);f.vy+=(target-f.vy)*(1-Math.exp(-dt*3));f.vx=Math.min(Math.max(f.vx,Math.sqrt(Math.max(0,maxSpeed**2-f.vy**2))),f.vx+dt*4);f.vy=Math.min(f.vy,Math.sqrt(Math.max(0,maxSpeed**2-f.vx**2)));f.pitch=.13;f.stalled=false;f.stall=0;if(f.gullRide.left<=0)f.gullRide=null;}
 for(const a of nearby(Math.min(px,f.x)-12,Math.max(px,f.x)+12,f,Math.min(py,f.y)-110,Math.max(py,f.y)+110)){
  if((a.kind===8&&f.vy>=0)||f.specialUsed.has(a.id)||M.sweep(px-a.x,py-a.y,f.x-a.x,f.y-a.y,a.rx+(a.kind===8||a.kind===9?0:4),a.ry+(a.kind===8||a.kind===9?0:26))===Infinity)continue;
  f.specialUsed.add(a.id);f.pickupCounts??={};f.pickupCounts[a.kind]=(f.pickupCounts[a.kind]||0)+1;if(a.kind===8){f.springHits??={};f.springHits[a.id]=f.time;}const n=level(f),power=[17,14,21,15,24,21,29,0,31,32,27,34][a.kind]*(1+n*.055);
  const rebound=Math.min(10,f.l?.rebound||0)/10;
  const groundObject=[0,8,9].includes(a.kind);
  // Clouds give a proper POUF: a bit of forward speed on top of the vertical kick.
  const forward=groundObject?(a.kind===9?Math.max(18,f.vx+12):Math.max(8,f.vx)*(a.kind===0?1.18:1.04)):CLOUDS.includes(a.kind)?Math.max(12,f.vx*(1.05+.02*rebound)+2+(a.kind===11?4:a.kind===10?2:0)):Math.max(8,f.vx*(.98+.02*rebound));
  const minimumKick=Math.min(power,maxSpeed*.22);
  const forwardLimit=Math.sqrt(Math.max(0,maxSpeed**2-minimumKick**2));
  f.vx=Math.min(Math.max(f.vx,maxSpeed*.96),forwardLimit,forward);
  // Leave room for the kick within the speed limit without scaling down forward momentum.
  const verticalRoom=Math.sqrt(Math.max(0,maxSpeed*maxSpeed-f.vx*f.vx));
  f.vy=Math.min(verticalRoom,Math.max(0,f.vy)*.2+power);
  f.stalled=false;f.stall=0;f.pitch=.3;f.lastMonsterHop=undefined;f.kickUntil=(f.time||0)+1.4;
  if(a.kind===3)f.gullRide={left:5+n*.15};
  f.specialEffects.push({...a,at:f.time,color:colors[a.kind]});f.message=names[a.kind];f.messageTime=1.6;
  f.monsterEvents??=[];f.monsterEvents.push({x:a.x,y:a.y,rating:'perfect',type:'special',kind:a.kind});if(a.kind===9)M.combo(f,a.x,a.y);
 }
 // Keep the consumed set bounded without respawning objects in front of the knight.
 for(const id of f.specialUsed)if(at(id,f).x<f.x-800)f.specialUsed.delete(id);
 if(f.springHits)for(const id of Object.keys(f.springHits))if(f.time-f.springHits[id]>2)delete f.springHits[id];
 while(f.specialUsed.size>256)f.specialUsed.delete(f.specialUsed.values().next().value);
}
const api={BOMB,bombAt,bombNearby,collectBombs,CLOUDS,SPACE_ROW,CLOUD_ROW,ROW,collectWallTreasures,fuelAt,fuelNearby,collectFuel,treasureAt,treasureNearby,collectTreasures,at,nearby,step,names,colors};if(typeof module!=='undefined')module.exports=api;else root.GGSpecials=api;
})(typeof window!=='undefined'?window:globalThis);
