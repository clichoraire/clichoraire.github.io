// Six techniques osseuses. Tous les délais suivent le temps du match (pause comprise).
(function(B){
'use strict';
const P=B.Game.prototype,C=B.COURT,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const segmentDistance=(x,y,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,k=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-dx*k,y-ay-dy*k);};
const instant=P.powerInstant;
P.powerInstant=function(p,id){
 if(id==='ribwall'){
  const target=this.ball.holder?.team!==p.team?this.ball.holder:null;
  (this.boneWalls??=[]).push({team:p.team,x:C.mid+(p.team===0?-65:65),y:clamp(target?.y||p.y,C.top+85,C.bottom-85),t:0,left:6});
  p.boneCast=.7;return true;
 }
 if(id==='bonehand'){
  const b=this.ball;if(!['held','dead'].includes(b.state)||b.holder?.team===p.team||this.boneHands?.some(h=>h.from===p))return false;
  (this.boneHands??=[]).push({from:p,x:p.x,y:p.y,z:30,tx:b.x,ty:b.y,t:0});p.boneCast=.45;return true;
 }
 if(id==='marrow'){
  const q=this.opponentsOf(p).slice().sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!q)return false;
  const d=Math.hypot(q.x-p.x,q.y-p.y)||1;
  (this.boneWaves??=[]).push({from:p,x:p.x,y:p.y,vx:(q.x-p.x)/d*340,vy:(q.y-p.y)/d*340,t:0,hit:new Set()});p.boneCast=.55;return true;
 }
 return instant.call(this,p,id);
};
const throwPower=P.powerThrow;
P.powerThrow=function(p,b,o){throwPower.call(this,p,b,o);if(b.power==='boneboomerang'){b.boneReturn=false;b.boneHit=new Set();b.airShot=false;b.z=30;b.speed=Math.min(520,b.speed);const n=Math.hypot(b.vx,b.vy)||1;b.vx=b.vx/n*b.speed;b.vy=b.vy/n*b.speed;}
 if(b.power==='skullbomb'){b.boneHit=null;p.skullAway=3.5;b.airShot=false;b.z=42;b.vz=110;b.speed=Math.min(510,b.speed);const n=Math.hypot(b.vx,b.vy)||1;b.vx=b.vx/n*b.speed;b.vy=b.vy/n*b.speed;}
};
P.armSkull=function(b){
 if(b.power!=='skullbomb')return;
 const from=b.thrower;
 (this.boneBombs??=[]).push({from,x:clamp(b.x,C.left-30,C.right+30),y:clamp(b.y,C.top,C.bottom),left:1.5,t:0,dmg:Math.max(7,b.dmg),r:82});
 // Le vrai ballon attend sous le crâne : impossible de le ramasser avant l’explosion.
 b.state='bone-fuse';b.z=0;b.vx=b.vy=b.vz=0;b.power=null;if(from)from.skullAway=1.5;
};
P.explodeSkull=function(q){
 this.fx.push({kind:'explosion',x:q.x,y:q.y,z:8,r:q.r,t:0,dur:.65});this.emit('explode',{});this.shake=9;
 (this.boneBursts??=[]).push({x:q.x,y:q.y,t:0});
 for(const p of this.aliveInner(1-q.from.team))if(Math.hypot(p.x-q.x,p.y-q.y)<q.r&&p.z<65)this.hurt(p,q.dmg,{from:q.from,power:'skullbomb',knock:310,dir:Math.sign(p.x-q.x)||1});
 q.from.skullAway=0;
 if(this.ball.state==='bone-fuse'){Object.assign(this.ball,{state:'dead',vx:0,vy:0,vz:100,power:null});this.retargetAll();}
};
const live=P.powerLive;
P.powerLive=function(b,dt){
 if(!['boneboomerang','skullbomb'].includes(b.power))return live.call(this,b,dt);
 const ax=b.x,ay=b.y;
 if(b.power==='boneboomerang'){
  if(b.t>.8||b.x<C.left||b.x>C.right||b.y<C.top||b.y>C.bottom)b.boneReturn=true;
  if(b.boneReturn){const p=b.thrower;if(!p?.alive||b.t>3){this.kill(b,.2);return true;}const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<26){this.give(p);this.setState(p,'pickup');return true;}b.vx=(p.x-b.x)/d*530;b.vy=(p.y-b.y)/d*530;}
  b.z=30+Math.sin(b.t*6)*9;
 }else{b.vz-=220*dt;b.z+=b.vz*dt;}
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.trail.push({x:b.x,y:b.y,z:b.z});if(b.trail.length>12)b.trail.shift();
 for(const p of this.aliveInner(1-b.team))if(B.HITTABLE[p.state]&&p.fx.ghostT<=0&&!b.boneHit?.has(p)&&segmentDistance(p.x,p.y,ax,ay,b.x,b.y)<20+b.r&&b.z+b.r>p.z&&b.z-b.r<p.z+this.heightOf(p)){this.contact(p,b);if(b.state!=='live')return true;}
 if(b.power==='skullbomb'&&(b.z<=0||b.x<C.left-15||b.x>C.right+15||b.y<C.top||b.y>C.bottom||b.t>2))this.armSkull(b);
 return true;
};
const keeps=P.powerKeepsBall;
P.powerKeepsBall=function(b,p){if(b.power==='boneboomerang'){b.boneHit.add(p);b.boneReturn=true;return true;}return keeps.call(this,b,p);};
const contact=P.contact;
P.contact=function(p,b){
 if(p.power.id==='scatter'&&p.alive&&!(p.boneCooldown>0)&&p.state!=='bubble'&&p.z<5){
  p.boneCooldown=8;p.boneScatter=.65;p.fx.ghostT=Math.max(p.fx.ghostT,.65);p.charging=false;p.pending=null;this.stopDash(p);this.stats[p.team].supers++;this.emit('ghost',{p});this.fx.push({kind:'pow',x:p.x,y:p.y,z:52,text:'ÉPARPILLEMENT !',color:'#e8f5d1',t:0,dur:.8});return;
 }
 if(p.boneScatter>0)return;
 if(b.power==='skullbomb'){const q={from:b.thrower,x:b.x,y:b.y,r:82,dmg:Math.max(7,b.dmg)};kill.call(this,b,.2);this.explodeSkull(q);return;}
 return contact.call(this,p,b);
};
const kill=P.kill;
P.kill=function(b,k){if(b.power==='skullbomb'){this.armSkull(b);return;}return kill.call(this,b,k);};
const ballUpdate=P.updateBall;
P.updateBall=function(dt){if(this.ball.state==='bone-fuse')return;
 const b=this.ball,ax=b.x,ay=b.y;ballUpdate.call(this,dt);
 if(!['live','pass'].includes(b.state)||b.z>100)return;
 for(const w of this.boneWalls||[]){if(w.team===b.team||w.t<.4||w.left<.2)continue;
  const dx=b.x-ax;if(!dx||(ax-w.x)*(b.x-w.x)>0)continue;const y=ay+(b.y-ay)*(w.x-ax)/dx;if(Math.abs(y-w.y)>70)continue;
  b.x=w.x-Math.sign(dx)*(b.r+2);b.y=y;
  if(Math.random()<.5)this.kill(b,.08);else{b.vx=-b.vx*.7;b.vy=(Math.random()-.5)*480;b.airShot=false;if(b.state==='pass')this.kill(b,.5);}
  this.spark(b.x,b.y,b.z,'#f8e8bc');break;
 }
};
const step=P.stepPlayer;
P.stepPlayer=function(p,dt,move,act){if(p.boneScatter>0||p.boneCast>0){p.mx=p.my=0;p.moving=false;p.walkBlend=0;return;}return step.call(this,p,dt,move,act);};
P.updateSkeletonEffects=function(dt){
 for(const p of this.players)for(const key of ['boneCooldown','boneScatter','boneCast','boneRoot','skullAway'])p[key]=Math.max(0,(p[key]||0)-dt);
 this.boneWalls=(this.boneWalls||[]).filter(w=>{w.t+=dt;return (w.left-=dt)>0;});
 this.boneBombs=(this.boneBombs||[]).filter(q=>{q.t+=dt;q.left-=dt;if(q.left>0)return true;this.explodeSkull(q);return false;});
 this.boneBursts=(this.boneBursts||[]).filter(q=>(q.t+=dt)<.7);
 this.boneWaves=(this.boneWaves||[]).filter(q=>{
  const x=q.x,y=q.y;q.x+=q.vx*dt;q.y+=q.vy*dt;q.t+=dt;
  for(const p of this.aliveInner(1-q.from.team))if(!q.hit.has(p)&&p.z<20&&segmentDistance(p.x,p.y,x,y,q.x,q.y)<29){q.hit.add(p);p.boneRoot=4;p.fx.slowT=Math.max(p.fx.slowT,4);this.fx.push({kind:'pow',x:p.x,y:p.y,z:52,text:'RALENTI !',color:'#d8f1b8',t:0,dur:.8});}
  return q.t<3&&q.x>C.left-80&&q.x<C.right+80&&q.y>C.top-80&&q.y<C.bottom+80;
 });
 this.boneHands=(this.boneHands||[]).filter(h=>{
  if(!h.from.alive)return false;h.t+=dt;const b=this.ball;
  const dx=h.tx-h.x,dy=h.ty-h.y,d=Math.hypot(dx,dy),travel=Math.min(d,480*dt);h.x+=dx/(d||1)*travel;h.y+=dy/(d||1)*travel;
  if(['held','dead'].includes(b.state)&&b.holder?.team!==h.from.team&&Math.hypot(b.x-h.x,b.y-h.y)<30&&b.z<80){
   const holder=b.holder;if(holder){holder.hasBall=false;holder.charging=false;holder.pending=null;holder.charge=0;}
   Object.assign(b,{holder:null,state:'magnet',magnetTo:h.from,power:null,t:0,vx:0,vy:0,vz:0});h.from.boneCounter=true;this.retargetAll();return false;
  }
  return d>10&&h.t<2.7;
 });
 for(const p of this.players)if(p.boneCounter&&p.hasBall&&p.alive){p.boneCounter=false;this.setState(p,'idle');this.throwBall(p,{charge:.3,move:{dx:0,dy:0}});}
};
const update=P.update;
P.update=function(dt,inputs){if(this.phase==='play')this.updateSkeletonEffects(dt);return update.call(this,dt,inputs);};
// Illustrations canvas : les projectiles remplacent complètement le ballon classique.
function bone(c,x,y,angle=0,size=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);c.strokeStyle='#8a795d';c.fillStyle='#f7edce';c.lineWidth=1.7;c.beginPath();c.roundRect(-13,-3,26,6,3);c.fill();c.stroke();for(const a of [-1,1])for(const b of [-1,1]){c.beginPath();c.arc(a*12,b*3,4,0,Math.PI*2);c.fill();c.stroke();}c.restore();}
function skull(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#f5eccd';c.strokeStyle='#867459';c.lineWidth=2;c.beginPath();c.ellipse(0,-2,12,12,0,0,Math.PI*2);c.fill();c.stroke();c.fillRect(-7,5,14,9);c.fillStyle='#272338';for(const x of [-5,5]){c.beginPath();c.ellipse(x,-2,3.5,4,0,0,Math.PI*2);c.fill();}c.beginPath();c.moveTo(0,2);c.lineTo(-2,6);c.lineTo(2,6);c.fill();c.strokeStyle='#867459';for(let x=-4;x<=4;x+=4){c.beginPath();c.moveTo(x,9);c.lineTo(x,14);c.stroke();}c.restore();}
function hand(c,x,y){bone(c,x-10,y,.1,.65);c.strokeStyle='#f2e6c4';c.lineWidth=3;c.lineCap='round';for(let i=0;i<4;i++){c.beginPath();c.moveTo(x,y+i*2-3);c.lineTo(x+10,y+i*4-7);c.lineTo(x+13,y+i*4-4);c.stroke();}}
B.drawSkeletonBall=function(c,g,b){if(b.state==='bone-fuse')return true;if(!['boneboomerang','skullbomb'].includes(b.power))return false;
 for(let i=0;i<b.trail.length;i++){const q=b.trail[i];c.save();c.globalAlpha=i/b.trail.length*.25;bone(c,q.x,q.y-q.z,g.time*15,.6);c.restore();}
 if(b.power==='boneboomerang')bone(c,b.x,b.y-b.z,g.time*17,1.3);else skull(c,b.x,b.y-b.z,1.2);return true;
};
B.drawSkeletonPile=function(c,g,p){if(!(p.boneScatter>0))return false;const rise=clamp((.18-p.boneScatter)/.18,0,1);for(let i=0;i<6;i++)bone(c,p.x+Math.sin(i*3)*18*(1-rise),p.y-3-rise*i*7,i+g.time*.4,.6);skull(c,p.x+8*(1-rise),p.y-10-rise*42,.8);return true;};
B.drawSkeletonEffects=function(c,g){c.save();
 for(const w of g.boneWalls||[]){const k=Math.min(1,w.t/.4,w.left/.5);c.save();c.globalAlpha=k;for(let i=-3;i<=3;i++){const y=w.y+i*20;c.fillStyle='#211d2c66';c.beginPath();c.ellipse(w.x,y,26,9,0,0,Math.PI*2);c.fill();for(const side of [-1,1]){c.strokeStyle='#85765b';c.lineWidth=11;c.beginPath();c.moveTo(w.x+side*22,y);c.bezierCurveTo(w.x+side*29,y-30*k,w.x+side*18,y-65*k,w.x+side*3,y-72*k);c.stroke();c.strokeStyle='#eee4c4';c.lineWidth=7;c.stroke();}}c.restore();}
 for(const q of g.boneBombs||[]){c.strokeStyle=Math.sin(q.t*20)>0?'#ff6651':'#ffe09a';c.lineWidth=3;c.setLineDash([6,5]);c.beginPath();c.ellipse(q.x,q.y,q.r,q.r*.48,0,0,Math.PI*2);c.stroke();c.setLineDash([]);skull(c,q.x,q.y-12,1.2);c.font='bold 16px Arial';c.textAlign='center';c.fillStyle='#ffe39e';c.fillText(q.left.toFixed(1),q.x,q.y-35);}
 for(const q of g.boneBursts||[])for(let i=0;i<12;i++){const a=i*Math.PI/6;c.save();c.globalAlpha=1-q.t/.7;bone(c,q.x+Math.cos(a)*q.t*180,q.y+Math.sin(a)*q.t*90-20-q.t*40,i+q.t*14,.6);c.restore();}
 for(const h of g.boneHands||[]){c.strokeStyle='#bfeeda88';c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();c.moveTo(h.from.x,h.from.y-30);c.lineTo(h.x,h.y-20);c.stroke();c.setLineDash([]);hand(c,h.x,h.y-20);}
 for(const q of g.boneWaves||[]){c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.vy,q.vx));for(let i=-2;i<=2;i++)bone(c,-Math.abs(i)*4,i*11,g.time*7,.65);c.restore();}
 for(const p of g.players)if(p.boneRoot>0&&p.alive){hand(c,p.x-17,p.y-3);c.save();c.translate(p.x+17,p.y-3);c.scale(-1,1);hand(c,0,0);c.restore();}
 c.restore();};
})(window.BC);
