// Hommes-bêtes : passes de meute, loups et pièges secourables.
(function(B){
'use strict';const P=B.Game.prototype,C=B.COURT,TAU=Math.PI*2;
const active=(g,t)=>g.mode!=='practice'&&!g.practice&&g.teams[t]?.species==='beast'&&!g.teams[t].boss;
B.POWERS.wolfpack={name:'Appel de la meute',icon:'🐺',kind:'instant',color:'#d6b996',desc:'Des loups traversent le terrain et mordent les adversaires. Saute pour les éviter !'};
B.PLAYERS['monster-beast-1'].power='wolfpack';
P.summonWolfPack=function(source){if(!source?.alive||this.phase!=='play')return false;const foes=this.opponentsOf(source);if(!foes.length)return false;
 this.wolfWaves??=[];this.wolfWaves.push({from:source,team:source.team,t:0,warning:1.2,wolves:foes.slice(0,3).map((p,i)=>({x:source.team===1?C.right+45:C.left-45,y:Math.max(C.top+24,Math.min(C.bottom-24,p.y)),delay:i*.22,hits:new Set()}))});
 this.say('LA MEUTE ARRIVE !',1.3,'Écarte-toi des traces ou saute !');return true;};
const instant=P.powerInstant;P.powerInstant=function(p,id){if(id==='wolfpack')return this.summonWolfPack(p);return instant.call(this,p,id);};
P.dropBeastTrap=function(source,target){if(!source?.alive||!target?.alive)return false;this.beastTraps??=[];
 if(this.beastTraps.filter(t=>!t.done).length>=3)return false;
 this.beastTraps.push({from:source,team:source.team,x:target.x,y:target.y,t:0,warning:1.3,captive:null,ticks:0,held:0,rescue:0,done:false});return true;};
P.freeBeastTrap=function(trap,rescued=false){if(trap.captive){const p=trap.captive;p.beastTrap=null;p.knock=0;if(rescued)this.fx.push({kind:'pow',x:p.x,y:p.y,z:65,text:'LIBÉRÉ !',color:'#9effb1',t:0,dur:1});}trap.captive=null;trap.done=true;};
P.updateBeastPack=function(dt){if(this.phase!=='play')return;
 this.beastClocks??={};for(let t=0;t<2;t++)if(active(this,t)){
  const source=this.aliveInner(t)[0];if(!source)continue;const h=this.beastClocks[t]??={wolves:0,trap:0,passes:0};h.wolves+=dt;h.trap+=dt;
  if(h.wolves>=14){h.wolves=0;this.summonWolfPack(source);}
  if(h.trap>=9){h.trap=0;const targets=this.opponentsOf(source).filter(p=>!p.beastTrap);if(targets.length){this.dropBeastTrap(source,targets[Math.floor(Math.random()*targets.length)]);this.say('PIÈGE À LOUP !',1.2,'Évite le cercle rouge !');}}
  if(this.ball.team!==t)h.passes=0;
 }
 for(const wave of this.wolfWaves||[]){const before=wave.t;wave.t+=dt;const dir=wave.team===1?-1:1;
  for(const w of wave.wolves){const flight=Math.max(0,wave.t-wave.warning-w.delay)-Math.max(0,before-wave.warning-w.delay);if(!flight)continue;const old=w.x;w.x+=dir*330*flight;
   for(const p of this.aliveInner(1-wave.team))if(p.z<30&&Math.abs(p.y-w.y)<23&&p.x>=Math.min(old,w.x)-22&&p.x<=Math.max(old,w.x)+22&&!w.hits.has(p)){
    w.hits.add(p);this.hurt(p,5,{from:wave.from,power:'wolfpack',dir,knock:170});
   }
  }
 }
 this.wolfWaves=(this.wolfWaves||[]).filter(w=>w.t<6);
 for(const trap of this.beastTraps||[]){trap.t+=dt;if(trap.done)continue;
  if(trap.captive){const p=trap.captive;if(!p.alive){this.freeBeastTrap(trap);continue;}
   const helper=this.aliveInner(p.team).find(q=>q!==p&&!q.beastTrap&&q.z<15&&Math.hypot(q.x-trap.x,q.y-trap.y)<46);
   trap.rescue=helper?trap.rescue+dt:0;if(trap.rescue>=.65){this.freeBeastTrap(trap,true);continue;}
   trap.held+=dt;while(trap.ticks<5&&trap.held>=trap.ticks+1&&p.alive){trap.ticks++;this.hurt(p,3,{from:trap.from,power:'wolftrap',dot:true,knock:0});const effect=this.fx[this.fx.length-1];if(effect?.kind==='pow')effect.color='#ff666d';}
   if(trap.ticks>=5||!p.alive)this.freeBeastTrap(trap);continue;
  }
  if(trap.t>=trap.warning){const p=this.aliveInner(1-trap.team).find(q=>!q.beastTrap&&q.z<15&&Math.hypot(q.x-trap.x,q.y-trap.y)<23);
   if(p){trap.captive=p;p.beastTrap=trap;p.z=p.vz=p.vx=p.vy=0;p.knock=0;p.dash.active=false;this.say('PRIS AU PIÈGE !',1.4,'Un coéquipier peut venir te libérer !');}
   else if(trap.t>9)this.freeBeastTrap(trap);
  }
 }
 this.beastTraps=(this.beastTraps||[]).filter(t=>!t.done);
};
const speed=P.speedMul;P.speedMul=function(p){return p.beastTrap?0:speed.call(this,p);};
const jump=P.jump;P.jump=function(p,...args){if(p.beastTrap)return;return jump.call(this,p,...args);};
const step=P.stepPlayer;P.stepPlayer=function(p,dt,move,act){const trap=p.beastTrap;step.call(this,p,dt,trap?{dx:0,dy:0}:move,act);if(trap&&p.beastTrap){p.x=trap.x;p.y=trap.y;p.z=p.vz=p.vx=p.vy=p.mx=p.my=p.knock=0;p.dash.active=false;}};
const pass=P.pass;P.pass=function(p,move){const held=this.ball.holder===p;pass.call(this,p,move);const b=this.ball;if(!held||!active(this,p.team)||b.state!=='pass')return;
 const T=Math.max(.08,Math.hypot(b.landX-b.x,b.landY-b.y)/Math.max(1,Math.hypot(b.vx,b.vy))/1.9);b.vx=(b.landX-b.x)/T;b.vy=(b.landY-b.y)/T;b.vz=(B.CHEST-b.z)/T+.5*b.g*T;b.beastPass=true;
 const h=(this.beastClocks??={})[p.team]??={wolves:0,trap:0,passes:0};h.passes++;this.fx.push({kind:'pow',x:p.x,y:p.y,z:65,text:'PASSE DE MEUTE !',color:'#ffd8a0',t:0,dur:.6});
};
const ball=P.updateBall;P.updateBall=function(dt){const b=this.ball;if(b.state==='pass'&&b.beastPass){const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/12));for(let i=0;i<n;i++){ball.call(this,dt/n);if(b.state!=='pass')break;}return;}return ball.call(this,dt);};
const give=P.give;P.give=function(p){give.call(this,p);this.ball.beastPass=false;p.beastHold=0;};
const shoot=P.throwBall;P.throwBall=function(p,...args){const held=this.ball.holder===p;shoot.call(this,p,...args);if(held&&this.ball.state==='live'&&this.beastClocks?.[p.team])this.beastClocks[p.team].passes=0;};
const inner=B.AI.prototype.inner;B.AI.prototype.inner=function(p,dt){inner.call(this,p,dt);const g=this.g;if(active(g,p.team)&&p.hasBall&&p.state==='idle'&&!p.charging){p.beastHold=(p.beastHold||0)+dt;const count=g.beastClocks?.[p.team]?.passes||0;if(count<2&&g.aliveInner(p.team).length>1&&p.beastHold>.12){p.ai.act='b';p.ai.move={dx:0,dy:0};}}};
const ai=B.AI.prototype.update;B.AI.prototype.update=function(dt,inputs){ai.call(this,dt,inputs);const g=this.g;
 for(const trap of g.beastTraps||[]){if(!trap.captive)continue;const p=trap.captive;
  const helpers=g.aliveInner(p.team).filter(q=>q!==p&&!q.beastTrap&&!g.isPlayerControlled(q)).sort((a,b)=>Math.hypot(a.x-trap.x,a.y-trap.y)-Math.hypot(b.x-trap.x,b.y-trap.y));
  if(helpers[0]){const q=helpers[0];q.ai.move=this.toward(q,trap.x,trap.y,30);q.ai.act=null;}
 }
};
const update=P.update;P.update=function(dt,inputs){if(this.paused)return;this.updateBeastPack(dt);update.call(this,dt,inputs);if(this.phase==='end'){for(const t of this.beastTraps||[])this.freeBeastTrap(t);this.beastTraps=[];this.wolfWaves=[];}};
B.drawBeastPack=function(c,g){c.save();
 for(const wave of g.wolfWaves||[]){const dir=wave.team===1?-1:1;for(const w of wave.wolves){
  if(wave.t<wave.warning+w.delay){c.strokeStyle='#e4c9a16e';c.setLineDash([8,15]);c.beginPath();c.moveTo(C.left,w.y);c.lineTo(C.right,w.y);c.stroke();c.setLineDash([]);continue;}
  c.save();c.translate(w.x,w.y);c.scale(dir,1);const beat=Math.sin(wave.t*22);c.fillStyle='#11182455';c.beginPath();c.ellipse(0,2,31,7,0,0,TAU);c.fill();c.strokeStyle='#5e6174';c.lineWidth=6;
  for(let i=0;i<4;i++){const x=i<2?-17:14,move=Math.sin(wave.t*22+i*Math.PI/2)*10;c.beginPath();c.moveTo(x,-17);c.lineTo(x+move,-6);c.lineTo(x+move+5,0);c.stroke();}
  c.fillStyle='#74788b';c.beginPath();c.ellipse(-1,-22-beat*2,28,12,0,0,TAU);c.fill();c.fillStyle='#a4a9b8';c.beginPath();c.moveTo(12,-28);c.lineTo(17,-49);c.lineTo(26,-36);c.lineTo(35,-31);c.lineTo(43,-24);c.lineTo(33,-18);c.lineTo(18,-19);c.closePath();c.fill();c.fillStyle='#28303e';c.beginPath();c.arc(40,-25,4,0,TAU);c.fill();c.fillStyle='#ffcf6e';c.fillRect(27,-32,4,3);c.strokeStyle='#74788b';c.lineWidth=8;c.beginPath();c.moveTo(-25,-24);c.quadraticCurveTo(-42,-28,-48,-39+beat*4);c.stroke();c.restore();
 }}
 for(const t of g.beastTraps||[]){c.save();c.translate(t.x,t.y);if(t.t<t.warning){c.strokeStyle='#ff7676';c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.ellipse(0,0,27,17,0,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=.65;c.translate(0,-100*(1-t.t/t.warning));}
  c.fillStyle='#343d49';c.strokeStyle=t.captive?'#ff747b':'#b5c4d1';c.lineWidth=3;c.beginPath();c.ellipse(0,-2,21,t.captive?7:13,0,0,TAU);c.fill();c.stroke();
  c.fillStyle='#dce3e6';for(let i=0;i<10;i++){const a=i*TAU/10,x=Math.cos(a)*19,y=Math.sin(a)*(t.captive?6:11)-2;c.beginPath();c.moveTo(x-3,y);c.lineTo(x*.65,y-7);c.lineTo(x+3,y);c.fill();}
  if(t.captive){c.fillStyle='#ffd5d5';c.font='bold 12px Arial';c.textAlign='center';c.fillText('AIDE ! · '+Math.max(1,Math.ceil(5-t.held))+' s',0,31);if(t.rescue>0){c.fillStyle='#7affab';c.fillRect(-20,36,40*Math.min(1,t.rescue/.65),4);}}c.restore();
 }c.restore();};
})(window.BC);
