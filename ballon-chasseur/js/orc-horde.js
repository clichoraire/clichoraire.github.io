// Shaman, Berzerkers et rage collective. Les boss et la pratique restent indépendants.
(function(B){
'use strict';
const P=B.Game.prototype,C=B.COURT;
const active=(g,t)=>g.mode!=='practice'&&!g.practice&&g.teams[t]?.species==='orc'&&!g.teams[t].boss;
const members=(g,t)=>g.inner(t).filter(p=>p.def.monster==='orc');
const special=b=>!!(b.power||b.perfect||b.combo>0||b.bounces>0);
const make=P.makePlayer;
P.makePlayer=function(...args){const p=make.apply(this,args);if(active(this,p.team)&&p.zone==='in'&&p.def.monster==='orc'){
 p.orcRole=p.def.orcRole;p.orcBaseSize=p.def.size;p.orcAttack=1;p.orcSpeed=1;p.orcStage=0;
 // Le Shaman est la seule source de résurrection de cette horde.
 p.phys.revive=false;
 if(p.orcRole==='shaman'){p.x=p.home.x=p.team===0?C.left+65:C.right-65;p.y=p.home.y=(C.top+C.bottom)/2;}
}return p;};
P.updateOrcHorde=function(dt){
 if(this.phase!=='play')return;
 this.orcHordes??={};
 for(let t=0;t<2;t++){
  if(!active(this,t))continue;
  const all=members(this,t),live=all.filter(p=>p.alive);if(!live.length)continue;
  const h=this.orcHordes[t]??={time:0,cry:0,casts:0,stage:0,revive:null};h.time+=dt;h.cry+=dt;
  const stage=live.length===1?2:live.length<all.length?1:0;
  if(stage!==h.stage){h.stage=stage;this.say(stage===2?'COLOSSE DE LA HORDE !':stage===1?'RAGE FÉROCE !':'LA HORDE SE REFORME !',2,stage===2?'Pouvoir ou lancer parfait pour percer sa défense !':stage===1?'Vitesse +30 % · Attrapés renforcés':'Élimine le Shaman en premier !');}
  for(const p of live){
   const rage=p.orcRole==='berserker'?Math.min(1,(1-p.hp/p.maxHp)*.8+h.time/180):0;
   p.orcStage=stage;p.orcSpeed=(1+rage*.25)*(stage?1.3:1);p.orcAttack=1+rage*.4+(stage===2?.25:0);
   const size=stage===2?Math.max(2.2,p.orcBaseSize*1.65):p.orcBaseSize;if(p.def.size!==size)p.def={...p.def,size};
  }
  const shaman=live.find(p=>p.orcRole==='shaman');
  if(!shaman){h.revive=null;continue;}
  if(h.revive){
   h.revive.t+=dt;
   if(h.revive.t>=2.5){const p=h.revive.p;h.revive=null;if(!p.alive){
    Object.assign(p,{alive:true,hp:Math.ceil(p.maxHp/2),armor:0,state:'idle',stateT:0,ko:0,z:0,vz:0,vx:0,vy:0,knock:0,charging:false,charge:0,pending:null,hasBall:false,tele:null,x:p.home.x,y:p.home.y});
    for(const key of Object.keys(p.fx))if(key.endsWith('T'))p.fx[key]=0;
    p.ai={};p.dash.active=false;this.retargetAll();this.say('RÉANIMATION !',1.5,'Le Shaman ramène un Berzerker à mi-vie.');
   }}
  }else if(all.some(p=>!p.alive&&p.orcRole==='berserker')){
   h.revive={p:all.find(p=>!p.alive&&p.orcRole==='berserker'),t:0};this.say('RITUEL DU SHAMAN !',2,'Élimine-le pour empêcher la réanimation !');
  }
  if(h.cry>=12){h.cry=0;h.casts++;const shield=h.casts%2===0;
   for(const p of live)if(p!==shaman){if(shield){const armor=Math.ceil(p.maxHp*.15);p.maxArmor=Math.max(p.maxArmor||0,armor);p.armor=Math.max(p.armor||0,armor);}else p.fx.rageT=Math.max(p.fx.rageT,8);}
   h.pulse=1;this.say(shield?'BOUCLIER D’OS !':'CRI DE GUERRE !',1.5,shield?'La horde gagne une armure.':'Les Berzerkers frappent plus fort !');
  }
  h.pulse=Math.max(0,(h.pulse||0)-dt);
 }
};
const speed=P.speedMul;P.speedMul=function(p){return speed.call(this,p)*(p.orcSpeed||1);};
// La seconde balle est un écho magique : on peut l’esquiver ou le dissiper par un attrapé.
// Elle n’interrompt jamais la possession de la balle principale.
const shoot=P.throwBall;P.throwBall=function(p,...args){const held=this.ball.holder===p;shoot.call(this,p,...args);const b=this.ball;
 if(!held||!p.orcRole||!active(this,p.team)||p.zone!=='in'||b.state!=='live'||b.thrower!==p)return;
 b.dmg=Math.round(b.dmg*(p.orcAttack||1));
 if(p.orcStage===2){const a=Math.atan2(b.vy,b.vx)+.10,v=Math.hypot(b.vx,b.vy);this.orcEchoes??=[];this.orcEchoes.push({x:b.x,y:b.y,z:B.CHEST,vx:Math.cos(a)*v,vy:Math.sin(a)*v,from:p,team:p.team,dmg:b.dmg,t:0});}
};
const contact=P.contact;P.contact=function(p,b){
 if(p.orcStage===2&&active(this,p.team)&&!special(b)){
  this.fx.push({kind:'pow',x:p.x,y:p.y,z:85,text:'LANCER PARFAIT !',color:'#ffde72',t:0,dur:1});
  b.state='dead';b.power=null;b.vx=-Math.sign(b.vx||1)*180;b.vy=0;b.vz=180;this.retargetAll();return;
 }
 return contact.call(this,p,b);
};
P.updateOrcEchoes=function(dt){
 for(const b of this.orcEchoes||[]){
  // Sous-pas : un double lancer rapide ne doit pas traverser un héros entre deux images.
  const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/12));
  for(let i=0;i<steps&&!b.done;i++){
   b.x+=b.vx*dt/steps;b.y+=b.vy*dt/steps;
   for(const p of this.aliveInner(1-b.team))if(B.HITTABLE[p.state]&&p.z<38&&Math.hypot(p.x-b.x,p.y-b.y)<25){
    const facing=Math.abs(b.vy)>Math.abs(b.vx)||p.facing===-Math.sign(b.vx);
    if(p.state==='catch'&&facing&&p.stateT<.22){this.stats[p.team].catches++;this.fx.push({kind:'pow',x:p.x,y:p.y,z:60,text:'ÉCHO ATTRAPÉ !',color:'#85f7da',t:0,dur:.8});}
    else this.hurt(p,b.dmg,{from:b.from,dir:Math.sign(b.vx),power:'orc-echo',knock:280});
    b.done=true;break;
   }
  }
  b.t+=dt;if(b.t>3||b.x<C.left-80||b.x>C.right+80||b.y<C.top-80||b.y>C.bottom+80)b.done=true;
 }
 this.orcEchoes=(this.orcEchoes||[]).filter(b=>!b.done);
};
const update=P.update;P.update=function(dt,inputs){if(this.paused)return;
 if(this.phase==='play'){this.updateOrcHorde(dt);this.updateOrcEchoes(dt);}
 update.call(this,dt,inputs);if(this.phase==='end')this.orcEchoes=[];
};
const power=B.AI.prototype.power;B.AI.prototype.power=function(p,dt){if(p.orcRole==='shaman'&&active(this.g,p.team))return false;return power.call(this,p,dt);};
const inner=B.AI.prototype.inner;B.AI.prototype.inner=function(p,dt){inner.call(this,p,dt);const g=this.g,b=g.ball;
 if(!p.orcRole||!active(g,p.team)||p.hasBall||p.charging||p.state!=='idle'||g.isPlayerControlled(p))return;
 // Ne jamais empêcher la récupération d’une balle libre ni un attrapé urgent.
 if(b.state==='dead'||b.state==='pass'||b.state==='live'&&Math.hypot(b.x-p.x,b.y-p.y)<210)return;
 const shaman=g.aliveInner(p.team).find(q=>q.orcRole==='shaman');if(!shaman)return;
 if(p===shaman)p.ai.move=this.toward(p,p.team===0?C.left+65:C.right-65,(C.top+C.bottom)/2,10);
 else{const guards=g.aliveInner(p.team).filter(q=>q!==shaman),i=guards.indexOf(p),source=b.holder||b,dx=source.x-shaman.x,dy=source.y-shaman.y,L=Math.hypot(dx,dy)||1;
  p.ai.move=this.toward(p,shaman.x+dx/L*125,Math.max(C.top+30,Math.min(C.bottom-30,shaman.y+dy/L*125+(i-(guards.length-1)/2)*65)),8);
 }
};
const onThrow=B.AI.prototype.onThrow;B.AI.prototype.onThrow=function(){onThrow.call(this);const g=this.g,b=g.ball;if(b.power||b.perfect)return;
 for(const p of g.aliveInner(1-b.team))if(p.orcStage>0&&active(g,p.team)&&!p.ai.willCatch&&Math.random()<.25)p.ai.willCatch=true;
};
B.drawOrcHorde=function(c,g){if(g.phase==='end')return;c.save();c.textAlign='center';c.font='bold 11px Arial';
 for(const p of g.players){if(!p.alive||!p.orcRole||p.zone!=='in'||!active(g,p.team))continue;
  const h=g.orcHordes?.[p.team],shaman=p.orcRole==='shaman';c.fillStyle=shaman?'#b9ff8c':p.orcStage===2?'#ffdd68':'#ff9f7f';
  c.fillText(p.orcStage===2?'COLOSSE · TIR PARFAIT / POUVOIR':shaman?'✦ SHAMAN':p.orcStage?'BERZERKER · RAGE':'BERZERKER',p.x,p.y-p.z-70*p.def.size-15);
  if(shaman&&(h?.revive||h?.pulse>0)){c.strokeStyle='#b8ff87';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,30+Math.sin(g.time*6)*8,15,0,0,Math.PI*2);c.stroke();if(h.revive){const q=h.revive.p;c.setLineDash([5,6]);c.beginPath();c.moveTo(p.x,p.y-40);c.lineTo(q.home.x,q.home.y-20);c.stroke();c.setLineDash([]);c.fillText('RÉANIMATION '+Math.max(1,Math.ceil(2.5-h.revive.t))+' s',p.x,p.y+40);}}
 }
 for(const b of g.orcEchoes||[]){c.globalAlpha=.85;B.sprites.drawBall(c,b.x,b.y-b.z,12,{spin:b.t*12});c.strokeStyle='#ffcc6c';c.lineWidth=2;c.beginPath();c.arc(b.x,b.y-b.z,16,0,Math.PI*2);c.stroke();}
 c.restore();};
})(window.BC);
