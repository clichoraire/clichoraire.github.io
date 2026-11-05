/* Local deterministic encounters: clustered troops, timing bounces and bounded projectiles. */
(function(root){
'use strict';
const WALK_RATE=.57,WALK_SPEED=2.8*WALK_RATE,SPACING=26;
function hash(n){let x=(n+1)|0;x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/4294967296;}
function kindOf(id){return Math.min(6,Math.floor(hash(id*19+3)*7));}
function hop(id,time){const cycle=3.8+hash(id+81)*1.8,phase=((time+hash(id+99)*cycle)%cycle+cycle)%cycle,duration=2.4;if(phase>=duration)return 0;const q=phase/duration;return (120+hash(id+43)*110)*4*q*(1-q);}
function at(id,time){const kind=kindOf(id),height=(kind===5?84:kind===6?34:60)*1.65,chunk=Math.floor(id/6),slot=id%6,pair=Math.floor(slot/2),center=[10,100,210][pair]+hash(chunk*13+pair)*25,offset=slot%2?(5+hash(id+122)*14):0;return {id,kind,height,width:(kind===5?70:kind===6?64:48)*1.65,x:-120+chunk*300+center+offset-time*WALK_SPEED,lane:(id%3-1)*5,y:kind===6?hop(id,time):0,armed:kind!==6&&kind!==4&&hash(id*31+5)<.48};}
function stride(kind){return kind===5?36:kind===6?20:28;}
function walkFrame(id,time){return Math.floor(Math.max(0,time)*WALK_SPEED*15/stride(kindOf(id))*4+id*.7)%4;}
function nearby(left,right,time){const start=Math.max(0,Math.floor((left+120+time*WALK_SPEED-270)/300)),end=Math.max(0,Math.ceil((right+120+time*WALK_SPEED)/300)),out=[];for(let chunk=start;chunk<=end&&out.length<96;chunk++)for(let slot=0;slot<6;slot++){const m=at(chunk*6+slot,time);if(m.x>=left-3&&m.x<=right+3)out.push(m);}return out;}
function retention(speed,kind){const momentum=Math.max(0,Math.min(1,(speed-8)/75));return .70+momentum*(kind===6?.24:kind===5?.17:.20);}
function bouncePose(age,variant){const t=Math.max(0,Math.min(1,age/.95)),ease=t*t*(3-2*t),pulse=Math.sin(Math.PI*Math.min(1,t/.22));return {angle:variant===0?Math.PI*2*ease:-Math.sin(Math.PI*t)*1.05,squash:1-pulse*.10,stretch:1+pulse*.06};}
function sweep(ax,ay,bx,by,rx,ry){ax/=rx;ay/=ry;const dx=bx/rx-ax,dy=by/ry-ay,a=dx*dx+dy*dy,b=2*(ax*dx+ay*dy),c=ax*ax+ay*ay-1,d=b*b-4*a*c;if(c<=0)return 0;if(a===0||d<0)return Infinity;const t=(-b-Math.sqrt(d))/(2*a);return t>=0&&t<=1?t:Infinity;}
function feedback(f,rating,label,x=f.x,y=f.y){f.feedback={rating,label,x,y,at:f.monsterTime};if(rating==='hurt'){f.message=label;f.messageTime=1.7;}else{f.message='';f.messageTime=0;}}
function event(f,m,speed,type,rating){const e={x:f.x,y:f.y,kind:m.kind,speed,type,rating};f.monsterEvents.push(e);if(f.monsterEvents.length>8)f.monsterEvents.shift();return e;}
function rating(){return 'perfect';}
function hurt(f,m,type){const speed=Math.hypot(f.vx,f.vy);f.vx*=.55;f.vy=Math.min(-22,f.vy-45);f.monsterCooldown=.65;f.hitFlash=.35;f.monsterReaction=null;feedback(f,'hurt',type==='weapon'?'AÏE ! · MASSUE !':'OUCH ! · GOBELIN ARMÉ !');return event(f,m,speed,type,'hurt');}
function attacks(f,px,py,dt){
 f.orcs??=new Map();f.projectiles??=[];
 const t=f.monsterTime;
 for(const [id,a] of f.orcs)if(at(id,t).x<f.x-100)f.orcs.delete(id);
 if(f.y<340)for(const m of nearby(f.x-25,f.x+65,t)){
  if(m.kind!==5||!m.armed||f.orcs.has(m.id)||f.monsterHits.has(m.id))continue;
  const throws=hash(m.id*71+(f.combatSeed||0))<.10;f.orcs.set(m.id,{due:t+.9,status:throws?'warning':'idle'});
 }
 for(const [id,a] of f.orcs){if(a.status!=='warning'||t<a.due)continue;if(f.monsterHits.has(id)){a.status='idle';continue;}a.status='thrown';const m=at(id,t),duration=.9;const vx=Math.max(-85,Math.min(85,(f.x+f.vx*(f.travelFactor||1)*.35-m.x)/duration)),vy=(f.y-65)/duration+35*duration/2;f.projectiles.push({id,x:m.x,y:65,vx,vy,age:0});if(f.projectiles.length>8)f.projectiles.shift();}
 for(const p of f.projectiles){const ox=p.x,oy=p.y;p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=35*dt;if(!p.hit&&!f.monsterCooldown&&sweep(px-ox,py-oy,f.x-p.x,f.y-p.y,2.8,30)!==Infinity){p.hit=true;if(rating(f)!=='miss'){const grade=rating(f);f.timingUsed=true;f.timingPress=-Infinity;f.monsterCooldown=.25;f.monsterReaction={at:f.monsterTime,variant:1,boing:true,rating:grade,speed:Math.hypot(f.vx,f.vy),impactX:p.x,impactY:p.y};event(f,{kind:5},Math.hypot(f.vx,f.vy),'bounce',grade);feedback(f,grade,'');}else hurt(f,{kind:5},'weapon');}}
 f.projectiles=f.projectiles.filter(p=>!p.hit&&p.age<3.5&&p.y>-20&&Math.abs(p.x-f.x)<150);
}
function collide(f,px,py,dt,input={}){
 f.monsterTime=(f.monsterTime||0)+dt;f.monsterHits??=new Map();f.monsterEvents??=[];
 f.monsterCooldown=Math.max(0,(f.monsterCooldown||0)-dt);f.timingCooldown=Math.max(0,(f.timingCooldown||0)-dt);f.hitFlash=Math.max(0,(f.hitFlash||0)-dt);
 if(input.ram&&!f.timingHeld&&!f.timingCooldown){f.timingPress=f.monsterTime;f.boingPress=f.monsterTime;f.timingCooldown=.8;f.timingUsed=false;}f.timingHeld=!!input.ram;
 if(f.timingPress!==undefined&&!f.timingUsed&&f.monsterTime-f.timingPress>.75){f.timingUsed=true;if(f.y<380)feedback(f,'miss','RATÉ · TROP TÔT !');}
 for(const [id,t] of f.monsterHits)if(f.monsterTime-t>4&&at(id,f.monsterTime).x<f.x-100)f.monsterHits.delete(id);
 if(f.ended||dt<=0)return null;
 attacks(f,px,py,dt);
 if(f.monsterCooldown||Math.min(py,f.y)>520)return null;
 let best=null;
 for(const m of nearby(Math.min(px,f.x)-8,Math.max(px,f.x)+8,f.monsterTime)){
  if(f.monsterHits.has(m.id))continue;
  const previous=at(m.id,f.monsterTime-dt),rx=(m.width*.38+22)/15,ry=(m.height*.45+16)/.85,base=(m.height*.5-m.lane)/.85;
  let t=sweep(px-previous.x,py-base-previous.y,f.x-m.x,f.y-base-m.y,rx,ry);

  if(t!==Infinity&&(!best||t<best.t))best={m,t};
 }
 if(!best)return null;
 const {m,t}=best,speed=Math.hypot(f.vx,f.vy),grade=rating(f);f.timingUsed=true;f.timingPress=-Infinity;
 f.x=px+(f.x-px)*t;f.y=Math.max(1,py+(f.y-py)*t);f.monsterHits.set(m.id,f.monsterTime);
 if(m.kind<5&&m.armed&&grade==='miss')return hurt(f,m,'stab');
 const rebound=Math.min(10,f.l?.rebound||0);
 const momentum=Math.max(0,Math.min(1,(speed-10)/65)),keep=grade==='perfect'?Math.min(1.08,.78+momentum*.26+rebound*.012):grade==='good'?Math.min(1,.75+momentum*.23+rebound*.012):Math.min(.9,(retention(speed,m.kind)+rebound*.035)*.86),out=speed*keep;
 const kick=grade==='perfect'?speed*.045*momentum:grade==='good'?speed*.02*momentum:0;
 f.vx=Math.min(Math.max(0,f.vx)*keep+kick,out*Math.min(.96,(grade==='miss'?.50:.70)+rebound*.026));
 const arcLimit=(m.kind===6?28:m.kind===5?23:25)*(1+rebound*.04),fadingLimit=f.lastMonsterHop===undefined?arcLimit:f.lastMonsterHop*(grade==='perfect'?.98:grade==='good'?.88:.68);
 f.vy=Math.min(arcLimit*(grade==='perfect'?1:grade==='good'?.8:.65),fadingLimit,Math.sqrt(Math.max(0,out*out-f.vx*f.vx))*(grade==='perfect'?1:grade==='good'?.92:.82));f.lastMonsterHop=f.vy;
 f.manualGlide=0;f.pitch=.35;f.stalled=false;f.stall=0;f.monsterCooldown=.2;f.monsterBounces=(f.monsterBounces||0)+1;f.monsterReaction={at:f.monsterTime,variant:1,boing:true,rating:grade,speed,impactX:m.x,impactY:m.y+(m.height-m.lane)/.85};
 // A squashed goblin/orc pays once; slimes remain bounce pads.
 if(m.kind<6){f.goldEnemies??=new Set();if(!f.goldEnemies.has(m.id)){const gold=m.kind===5?12:5;f.goldEnemies.add(m.id);f.collectedGold=(f.collectedGold||0)+gold;f.goldEffects??=[];f.goldEffects.push({x:f.x,y:f.y,at:f.time||0,value:gold});f.monsterEvents.push({x:f.x,y:f.y,type:'gold',gold});combo(f,f.x,f.y);}}
 for(const id of f.goldEnemies||[])if(at(id,f.monsterTime).x<f.x-800)f.goldEnemies.delete(id);
 feedback(f,grade,'');return event(f,m,speed,'bounce',grade);
}
function boingPose(pressAge,hitAge,grade='miss'){
 const press=pressAge>=0&&pressAge<.35?Math.sin(Math.PI*pressAge/.35):0;
 const strength=grade==='perfect'?1:grade==='good'?.8:.4;
 const wave=hitAge>=0&&hitAge<.9?Math.sin(hitAge/.9*Math.PI*3)*Math.exp(-hitAge*3)*strength:0;
 return {sx:1+press*.09-wave*.15,sy:1-press*.10+wave*.19,glow:Math.max(press,Math.abs(wave))};
}
// Destruction combo: each squashed monster, shattered tower, cannon… pays a little more than the one before (10, 15, 25, 35…).
function comboGold(n){return n<=1?10:n*10-5;}
function combo(f,x,y){f.combo=(f.combo||0)+1;const gold=comboGold(f.combo);f.comboGold=(f.comboGold||0)+gold;f.comboEffects??=[];f.comboEffects.push({x,y,at:f.time||0,n:f.combo,gold});if(f.comboEffects.length>5)f.comboEffects.shift();f.monsterEvents??=[];f.monsterEvents.push({x,y,type:'combo',n:f.combo,gold});return gold;}
const api={combo,comboGold,boingPose,hash,hop,sweep,rating,stride,walkFrame,WALK_RATE,WALK_SPEED,SPACING,at,nearby,collide,retention,bouncePose};if(typeof module!=='undefined')module.exports=api;else root.GGMonsters=api;
})(typeof window!=='undefined'?window:globalThis);
