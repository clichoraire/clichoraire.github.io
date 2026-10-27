// Seconde forme de la Reine : mégère, vol sur balai et trajectoires ensorcelées.
(function(B){
'use strict';const P=B.Game.prototype,C=B.COURT,TAU=Math.PI*2;
const queen=p=>p.def.boss&&p.def.monster==='witch';
Object.assign(B.POWERS,{
 witchzigzag:{name:'Zigzag maléfique',icon:'〰️',kind:'throw',color:'#b8ff69',desc:'Le ballon serpente en zigzag à travers le terrain.'},
 witchloop:{name:'Boucle infernale',icon:'🌀',kind:'throw',color:'#f59cff',desc:'Le ballon dessine une boucle puis repart vers sa cible.'}
});
const def=B.PLAYERS['boss-witch-1'];def.bossPowers=[...def.bossPowers,'witchzigzag','witchloop'];
const make=P.makePlayer;P.makePlayer=function(...args){const p=make.apply(this,args);if(queen(p)&&this.mode!=='practice'){
 p.witchStage=1;p.witchFirstHp=p.maxHp;p.phys.revive=false;p.def={...p.def,bossPowers:['witchtempo','bossshadow','bossmeteor']};
}return p;};
const hurt=P.hurt;P.hurt=function(p,dmg,o){
 if(p.witchTransform>0)return true;
 const beforeEvents=this.events.length,beforeMessages=this.messages.length;
 const result=hurt.call(this,p,dmg,o);
 if(p.witchStage===1&&!p.alive&&this.phase==='play'){
  // La première chute n'est pas un KO : pas de victoire ni de prime de KO intermédiaire.
  this.events=this.events.filter((e,i)=>i<beforeEvents||!(e.type==='ko'&&e.p===p));
  this.messages=this.messages.filter((m,i)=>i<beforeMessages||m.text!=='K.-O. !');
  if(o?.from)this.xp[o.from.id]=Math.max(0,(this.xp[o.from.id]||0)-B.XP_KO);
  p.witchStage=2;p.witchTransform=1.8;p.witchFlightClock=7;
  p.maxHp=p.hp=Math.round(p.witchFirstHp*.7);p.phys.maxHp=p.maxHp;
  p.def={...p.def,name:'La Reine maudite',size:2.7,witchCrone:true,bossPowers:['witchzigzag','witchloop','witchtempo','bossshadow']};
  Object.assign(p,{alive:true,state:'idle',stateT:0,ko:0,z:0,vz:0,vx:0,vy:0,knock:0,charging:false,charge:0,pending:null,hasBall:false,armor:0});
  for(const key of Object.keys(p.fx))if(key.endsWith('T'))p.fx[key]=0;
  p.dash.active=false;p.bossShot=0;p.bossClock=0;p.arenaClock=0;this.bossArena=null;this.anvils=[];
  this.flash=.5;this.shake=10;this.retargetAll();this.say('SA VRAIE FORME !',2.2,'La Reine revient… méfie-toi de son balai !');
 }
 return result;
};
P.startWitchFlight=function(p){if(!p.alive||p.witchStage!==2||p.witchTransform>0||p.witchFlight)return false;
 const target=this.opponentsOf(p).find(q=>q.alive);if(!target)return false;
 p.witchFlight={t:0,warning:1.1,duration:4.6,y:Math.max(C.top+40,Math.min(C.bottom-40,target.y)),home:{x:p.x,y:p.y},hits:new Set(),pass:-1};
 p.charging=false;p.pending=null;p.dash.active=false;
 if(this.ball.holder===p){p.hasBall=false;Object.assign(this.ball,{holder:null,state:'dead',x:p.x,y:p.y,z:35,vz:100});this.possession=null;}
 this.say('À CHEVAL SUR LE BALAI !',1.6,'Écarte-toi de la bande violette ou saute !');return true;
};
P.updateWitchForm=function(dt){if(this.phase!=='play')return;
 for(const p of this.players){if(!p.alive||p.witchStage!==2)continue;
  if(p.witchTransform>0){p.witchTransform=Math.max(0,p.witchTransform-dt);continue;}
  if(!p.witchFlight){p.witchFlightClock=(p.witchFlightClock||0)+dt;if(p.witchFlightClock>=14){p.witchFlightClock=0;this.startWitchFlight(p);}continue;}
  const f=p.witchFlight;f.t+=dt;if(f.t<f.warning)continue;
  const u=Math.min(1,(f.t-f.warning)/(f.duration-f.warning)),old=p.x,pass=u<.5?0:1;
  // Un aller-retour continu, avec une seule zone annoncée pour les deux passages.
  const lo=C.left+35,hi=C.right-35,progress=(1-Math.cos(u*TAU))/2;
  p.x=p.team===1?hi-(hi-lo)*progress:lo+(hi-lo)*progress;p.y=f.y;p.z=70+Math.sin(u*Math.PI)*15;p.vz=0;p.facing=(p.team===1?-1:1)*(pass? -1:1);p.visualFacing=p.facing;p.state='idle';
  if(pass!==f.pass){f.pass=pass;f.hits.clear();}
  for(const q of this.opponentsOf(p))if(q.z<24&&Math.abs(q.y-f.y)<28&&q.x>=Math.min(old,p.x)-24&&q.x<=Math.max(old,p.x)+24&&!f.hits.has(q)){
   f.hits.add(q);this.hurt(q,7,{from:p,power:'witch-broom',dir:p.facing,knock:220});
   this.fx.push({kind:'burst',x:q.x,y:q.y,z:25,t:0,dur:.4});
  }
  if(u>=1){p.x=f.home.x;p.y=f.home.y;p.z=0;p.vz=0;p.witchFlight=null;p.enemyGroundTime=0;p.visualFacing=undefined;}
 }
};
const step=P.stepPlayer;P.stepPlayer=function(p,...args){if(p.witchTransform>0||p.witchFlight){p.mx=p.my=0;p.moving=false;return;}return step.call(this,p,...args);};
const powerAI=B.AI.prototype.power;B.AI.prototype.power=function(p,dt){if(p.witchTransform>0||p.witchFlight)return false;return powerAI.call(this,p,dt);};
const update=P.update;P.update=function(dt,inputs){if(this.paused)return;this.updateWitchForm(dt);update.call(this,dt,inputs);if(this.phase==='end')for(const p of this.players){p.witchFlight=null;p.witchTransform=0;}};
const powerThrow=P.powerThrow;P.powerThrow=function(p,b,o){powerThrow.call(this,p,b,o);if(['witchzigzag','witchloop'].includes(b.power)){b.witchAngle=Math.atan2(b.vy,b.vx);b.witchTurn=b.y<(C.top+C.bottom)/2?-1:1;b.airShot=false;b.z=36;b.vz=0;}};
const live=P.updateLive;P.updateLive=function(dt){const b=this.ball;if(b.state==='live'&&['witchzigzag','witchloop'].includes(b.power)){
 const base=b.witchAngle??Math.atan2(b.vy,b.vx),t=b.t,angle=b.power==='witchzigzag'?base+Math.sin(t*12)*.85:base+(t<.36?(b.witchTurn||1)*TAU*t/.36:0),v=Math.hypot(b.vx,b.vy)||b.speed;
 b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;b.z=36;b.vz=0;b.airShot=false;
 }return live.call(this,dt);};
// Tête originale en canevas, avec nez crochu, rides, verrue et vieux chapeau rapiécé.
if(B.sprites){const head=B.sprites.drawMonsterHead;B.sprites.drawMonsterHead=function(c,d,x,y,r){if(!d.witchCrone)return head.call(this,c,d,x,y,r);
 c.save();c.translate(x,y);c.scale(r/12,r/12);c.translate(0,3.5);c.scale(.74,.74);c.lineJoin='round';c.lineCap='round';
 const path=(points,fill,stroke='#231b2c',width=.65)=>{c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=width;c.stroke();};
 const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
 for(const side of [-1,1])for(let i=0;i<4;i++){c.strokeStyle=i%2?'#b7b6a7':'#656979';c.lineWidth=2.5;c.beginPath();c.moveTo(side*(8+i),-8);c.bezierCurveTo(side*(16+i),-1,side*9,9,side*(16+i),15-i);c.stroke();}
 const skin=c.createLinearGradient(-12,-12,14,13);skin.addColorStop(0,'#d5d58b');skin.addColorStop(.5,'#a5b668');skin.addColorStop(1,'#586b43');
 path([[-10,-10],[8,-11],[12,-4],[9,5],[4,12],[-4,13],[-10,5],[-13,-2]],skin);
 // Mâchoire pointue et sourire de mégère.
 path([[-3,5],[5,5],[4,8],[-2,9],[-6,7]],'#302130');path([[0,6],[2,6],[2,8],[0,8]],'#fff3be');
 for(const side of [-1,1]){oval(side*5,-3,3.8,2.3,'#eff3b9');oval(side*5+1,-3,1.35,1.8,'#ed9e33');oval(side*5+1,-3,.6,1.5,'#20232a');c.strokeStyle='#30283a';c.lineWidth=1.3;c.beginPath();c.moveTo(side*2,-6);c.lineTo(side*9,-8);c.stroke();}
 path([[1,-3],[8,-1],[17,3],[16,6],[12,7],[9,5],[2,3]],skin);oval(12.5,3.5,1.15,1.1,'#51613d');oval(13,3,.35,.35,'#dbe39b');
 c.strokeStyle='#596d43';c.lineWidth=.6;for(const [a,b] of [[-8,2],[-7,4],[-6,-10],[-5,-8]]){c.beginPath();c.moveTo(a,b);c.quadraticCurveTo(a+3,b+2,a+5,b);c.stroke();}
 const hat=c.createLinearGradient(-15,-35,8,-8);hat.addColorStop(0,'#553a73');hat.addColorStop(1,'#18192c');
 path([[-14,-10],[-10,-19],[-8,-31],[1,-37],[7,-34],[1,-31],[3,-21],[10,-10]],hat);
 path([[-12,-15],[6,-16],[8,-11],[-14,-10]],'#a2743d');path([[-22,-8],[-10,-13],[8,-12],[20,-6],[5,-6],[-12,-5]],hat);
 path([[-7,-27],[-2,-29],[0,-24],[-5,-22]],'#87688b');c.strokeStyle='#d2b48c';c.lineWidth=.5;c.beginPath();c.moveTo(-7,-25);c.lineTo(-1,-27);c.moveTo(-4,-29);c.lineTo(-2,-23);c.stroke();
 c.restore();};}
B.drawWitchForm=function(c,g){c.save();
 for(const p of g.players){if(!p.alive||p.witchStage!==2)continue;
  if(p.witchTransform>0){const k=1-p.witchTransform/1.8;c.strokeStyle='#d6ff8e';c.lineWidth=4;for(let i=0;i<3;i++){c.beginPath();c.ellipse(p.x,p.y-60-i*45,35+k*60,16, g.time*3+i,0,TAU);c.stroke();}for(let i=0;i<14;i++){const a=i*TAU/14+g.time*4;c.fillStyle=i%2?'#c2ff86':'#d694ff';c.beginPath();c.arc(p.x+Math.cos(a)*80*k,p.y-90+Math.sin(a)*90,4,0,TAU);c.fill();}}
  const f=p.witchFlight;if(!f)continue;
  c.fillStyle=f.t<f.warning?'#bc7dff30':'#bc7dff18';c.strokeStyle='#d9a5ff';c.setLineDash([9,8]);c.fillRect(C.left,f.y-28,C.right-C.left,56);c.strokeRect(C.left,f.y-28,C.right-C.left,56);c.setLineDash([]);
  c.fillStyle='#f4d6ff';c.font='bold 14px Arial';c.textAlign='center';c.fillText('BALAI MAUDIT · ÉCARTE-TOI OU SAUTE !',B.W/2,f.y-36);
  if(f.t>=f.warning){c.save();c.translate(p.x,p.y-p.z-14);c.scale(p.facing,1);c.rotate(-.1);c.strokeStyle='#563522';c.lineWidth=7;c.beginPath();c.moveTo(-65,0);c.quadraticCurveTo(5,-9,72,-4);c.stroke();c.strokeStyle='#c39a4c';c.lineWidth=3;for(let i=0;i<10;i++){c.beginPath();c.moveTo(-40,-3);c.quadraticCurveTo(-65,(i-5)*3,-91,(i-5)*5);c.stroke();}c.strokeStyle='#794d37';c.lineWidth=5;c.beginPath();c.moveTo(-51,-10);c.lineTo(-51,10);c.stroke();c.restore();}
 }
 const b=g.ball;if(['witchzigzag','witchloop'].includes(b.power)&&b.state==='live'){c.strokeStyle=b.power==='witchzigzag'?'#b8ff69':'#f59cff';c.lineWidth=3;c.beginPath();c.arc(b.x,b.y-b.z,b.r+8,0,TAU);c.stroke();}
 c.restore();};
})(window.BC);
