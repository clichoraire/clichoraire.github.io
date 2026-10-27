// Undead resurrection, reptile techniques and poison equipment.
(function(B){
'use strict';
const P=B.Game.prototype,E=B.Equipment,C=B.COURT,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,k=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy);};
B.SKELETON_REVIVE_SECONDS=30;
E.elements.poison={name:'Poison',icon:'☠️',color:'#a0e34f'};E.categories.poison=E.elements.poison;
const element=E.element;E.element=id=>['venomshot','venom','poison-pool'].includes(id)?'poison':element(id);
const names={gloves:['Gants de l’alchimiste','Gantelets antidote'],boots:['Bottes de marécage','Cuissardes hermétiques'],armor:['Gilet antitoxique','Cuirasse de basilic'],charm:['Fiole purifiante','Cœur de mandragore']};
for(const [slot,list]of Object.entries(names))list.forEach((name,i)=>E.items.push({id:'poison-'+slot+'-'+(i+1),slot,element:'poison',tier:i+1,name,price:i?230:85,icon:'☠️',desc:slot==='gloves'?'Permet d’attraper un ballon empoisonné sans subir le poison.':slot==='boots'?'Protège des flaques de poison.':slot==='armor'?'Réduit les dégâts du poison de '+(i?50:25)+' %.':i?'Empêche le ralentissement et les effets du poison.':'Divise par deux la durée du poison.',bonuses:i?{hp:1}:{} }));
for(const [i,name,slot,price,bonuses,effect]of [[0,'Serres de vipère','gloves',180,{power:2},'poison'],[1,'Médaillon du cobra','charm',300,{precision:2},'poison'],[2,'Griffes du basilic','gloves',480,{power:3,speed:2},'poison'],[3,'Flacon de renaissance','charm',220,{hp:2},'antidote']])E.items.push({id:'poison-magic-'+i,name,slot,price,bonuses,element:'poison',tier:2,active:true,effect,cooldown:effect==='antidote'?20:18,icon:'☠️',desc:effect==='antidote'?'CLIQUE : enlève le poison et rend 6 vies. Recharge : 20 s.':'CLIQUE : le prochain lancer empoisonne sa cible et laisse une flaque. Recharge : 18 s.'});
B.POWERS['element-poison']={name:'Ballon empoisonné',icon:'☠️',kind:'throw',color:'#a0e34f',desc:'Inflige 3 dégâts de poison et ralentit pendant 3 secondes.'};
const useItem=P.useItemMagic;
P.useItemMagic=function(p,slot){const item=E.items.find(i=>i.id===p?.equipment?.[slot]);if(!['poison','antidote'].includes(item?.effect))return useItem.call(this,p,slot);
 if(this.phase!=='play'||this.paused||!p?.alive||!this.isPlayerControlled(p)||(p.itemCooldowns[item.id]||0)>0)return false;
 if(item.effect==='poison'){if(p.poisonArmed)return false;p.poisonArmed=true;}else{p.poisonSlow=0;p.hp=Math.min(p.maxHp,p.hp+6);}
 p.itemCooldowns[item.id]=item.cooldown;this.fx.push({kind:'pow',x:p.x,y:p.y,z:60,text:item.effect==='poison'?'VENIN PRÊT !':'ANTIDOTE !',color:'#b8f77e',t:0,dur:1});this.emit('power',{p});return true;
};
P.poisonHit=function(p,from,{damage=true,caught=false,pool=false}={}){
 if(!p.alive||p.magicShield>0||p.scaleShield>0||pool&&E.rank(p,'boots','poison')||caught&&E.rank(p,'gloves','poison'))return;
 if(damage)this.hurt(p,3,{from,power:'venomshot',dot:true});
 if(E.rank(p,'charm','poison')!==2)p.poisonSlow=Math.max(p.poisonSlow||0,E.rank(p,'charm','poison')===1?1.5:3);
};
const zone=P.elementZone;P.elementZone=function(b){if((b.element||E.element(b.power))==='poison')return;return zone.call(this,b);};
P.makePoisonPool=function(b){(this.poisonPools??=[]).push({x:clamp(b.x,C.left+20,C.right-20),y:clamp(b.y,C.top+20,C.bottom-20),from:b.thrower,team:1-b.team,left:5,hit:new Set()});};
const instant=P.powerInstant;
P.powerInstant=function(p,id){
 if(id==='tongue'){
  const h=this.ball.holder;if(!h||h.team===p.team||Math.hypot(h.x-p.x,h.y-p.y)>360)return false;
  (this.lizardTongues??=[]).push({from:p,target:h,x:p.x,y:p.y,tx:h.x,ty:h.y,t:0});return true;
 }
 if(id==='camouflage'){p.camouflage=4;return true;}
 if(id==='carapace'){p.carapace=1.5;return true;}
 if(id==='coldregency'){
  for(const q of this.players)if(q.team===p.team&&q.alive)q.scaleShield=5;
  p.solarArmed=true;this.fx.push({kind:'pow',x:p.x,y:p.y,z:75,text:'RÉGENCE !',color:'#ffe390',t:0,dur:1.4});
  const b=this.ball;if(b.state==='dead'&&b.z<15){Object.assign(b,{state:'magnet',magnetTo:p,t:0,holder:null,power:null,element:null});}
  return true;
 }
 return instant.call(this,p,id);
};
const throwBall=P.throwBall;
P.throwBall=function(p,o){if(p.solarArmed&&this.ball.holder===p&&!p.solarRelease){
 p.solarRelease={left:.9,o};p.camouflage=0;p.charging=false;this.setState(p,'windup');p.pending=null;this.say('MÉTÉORE DRACONIQUE !',.9,'Écarte-toi de sa trajectoire !');return;
 }
 const held=this.ball.holder===p;throwBall.call(this,p,o);if(!held||this.ball.state!=='live'||this.ball.thrower!==p)return;
 const b=this.ball;p.camouflage=0;
 if(p.solarArmed){p.solarArmed=false;Object.assign(b,{power:'solar-meteor',element:null,airShot:false,z:32,vz:0,solarBounces:0,solarHits:new Set(),speed:620});const n=Math.hypot(b.vx,b.vy)||1;b.vx=b.vx/n*620;b.vy=b.vy/n*620;}
 else if(p.poisonArmed&&!b.power){p.poisonArmed=false;b.power='element-poison';b.element='poison';}
 if(b.power==='venomshot'){b.dmg=3;b.element='poison';}
};
// Don't let automatic state processing release a second ball during the solar telegraph.
const step=P.stepPlayer;
P.stepPlayer=function(p,dt,move,act){if(p.solarRelease){p.mx=p.my=0;p.moving=false;return;}if(p.carapace>0)return step.call(this,p,dt,{dx:0,dy:0},null);return step.call(this,p,dt,move,act);};
const speed=P.speedMul;
P.speedMul=function(p){return speed.call(this,p)*(p.poisonSlow>0?.5:1)*(p.moltSpeed>0?1.5:1);};
const hurt=P.hurt;
P.hurt=function(p,dmg,o={}){
 if(!o.penalty&&p.scaleShield>0){p.scaleShield=0;this.spark(p.x,p.y,30,'#ffe277');return true;}
 if(!o.penalty&&p.magicShield>0)return hurt.call(this,p,dmg,o);
 let lethalDamage=Math.max(1,Math.round(dmg*(1-(p.magicResistance||0))));const e=E.element(o.power);if(e){const reduction=E.rank(p,'armor',e)*.25+(E.rank(p,'gloves',e)===2?.25:0)+(E.rank(p,'boots',e)===2?.25:0);lethalDamage=Math.max(1,Math.round(lethalDamage*(1-Math.min(.8,reduction))));}
 if(p.power.id==='molt'&&p.alive&&!o.penalty&&!(p.moltCooldown>0)&&lethalDamage>=p.hp&&o.from){
  p.moltCooldown=15;p.moltSpeed=2.5;p.fx.ghostT=Math.max(p.fx.ghostT,.45);(this.lizardMolts??=[]).push({x:p.x,y:p.y,t:0,def:p.def,team:this.teams[p.team]});this.stats[p.team].supers++;this.emit('ghost',{p});return true;
 }
 const alive=p.alive,result=hurt.call(this,p,dmg,o);
 if(alive&&!p.alive&&p.def.monster==='skeleton'&&p.zone==='in'){p.skeletonRevive=B.SKELETON_REVIVE_SECONDS;p.z=0;p.vz=0;p.ko=0;p.state='ko';this.fx.push({kind:'pow',x:p.x,y:p.y,z:52,text:'TAS D’OS · '+B.SKELETON_REVIVE_SECONDS+' s',color:'#e7e0c2',t:0,dur:1.2});}
 return result;
};
P.reflectLizard=function(p,b){
 const sender=b.thrower,sp=Math.hypot(b.vx,b.vy)*2,dx=(sender?.x??(p.team===0?C.right:C.left))-p.x,dy=(sender?.y??p.y)-p.y,n=Math.hypot(dx,dy)||1;
 Object.assign(b,{state:'live',team:p.team,thrower:p,target:sender,power:'scale-reflect',element:null,vx:dx/n*sp,vy:dy/n*sp,speed:sp,z:30,vz:0,t:0,airShot:false,trail:[],x:p.x+dx/n*24,y:p.y+dy/n*24});
 p.carapace=0;this.spark(p.x,p.y,30,'#adccff');this.emit('catch',{p});
};
const contact=P.contact;
P.contact=function(p,b){
 if(p.carapace>0&&b.team!==p.team){this.reflectLizard(p,b);return;}
 if(b.power==='solar-meteor'){
  if(b.solarHits.has(p)||p.fx.ghostT>0)return;b.solarHits.add(p);
  this.hurt(p,Math.max(999,p.maxHp*10),{from:b.thrower,power:'solar-meteor',knock:500});if(!p.alive){const label=this.fx.findLast(f=>f.kind==='pow'&&f.x===p.x&&f.y===p.y&&String(f.text).startsWith('-'));if(label)label.text='K.-O. SOLAIRE !';}return;
 }
 if(['venomshot','element-poison'].includes(b.power)){
  if(p.magicShield>0||p.scaleShield>0){if(p.scaleShield>0)p.scaleShield=0;this.kill(b,.1);return;}
  const from=b.thrower,snapshot={x:b.x,y:b.y,team:b.team,thrower:from};
  // Use normal catch timing and facing; poison is applied once after the ball resolves.
  const before=p.hp,oldElement=b.element;b.element=null;
  contact.call(this,p,b);const caught=b.holder===p;
  if(p.hp<before||caught)this.poisonHit(p,from,{damage:caught,caught});
  if(!caught&&b.state==='dead'){this.makePoisonPool(snapshot);this.poisonPools.at(-1).hit.add(p);}
  if(b.state==='live')b.element=oldElement;return;
 }
 return contact.call(this,p,b);
};
const live=P.powerLive;
P.powerLive=function(b,dt){if(!['solar-meteor','scale-reflect'].includes(b.power))return live.call(this,b,dt);
 const a={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;b.z=32;
 b.trail.push({x:b.x,y:b.y,z:b.z});if(b.trail.length>18)b.trail.shift();
 if(b.power==='solar-meteor'){
  for(const [axis,lo,hi,v]of [['x',C.left,C.right,'vx'],['y',C.top,C.bottom,'vy']])if(b[axis]<lo&&b[v]<0||b[axis]>hi&&b[v]>0){b[axis]=clamp(b[axis],lo,hi);b[v]*=-1;b.solarBounces++;this.spark(b.x,b.y,30,'#ffe289');}
 }
 for(const p of this.players.filter(p=>p.alive&&p.team!==b.team&&(p.zone==='in'||p===b.target))){if(!B.HITTABLE[p.state]||p.fx.ghostT>0||p.z>48)continue;if(dist(p,a,b)<22){this.contact(p,b);if(b.state!=='live')return true;}}
 if(b.t>(b.power==='solar-meteor'?3.2:2.5)||b.power==='scale-reflect'&&(b.x<C.left-70||b.x>C.right+70||b.y<C.top-70||b.y>C.bottom+70))this.kill(b,.1);
 return true;
};
const updateBall=P.updateBall;
P.updateBall=function(dt){
 const b=this.ball;
 // Solar meteors ignore the rib-wall interception wrapper.
 if(b.state==='live'&&b.power==='solar-meteor'){b.t+=dt;this.powerLive(b,dt);return;}
 if(b.state==='live')for(const p of this.players)if(p.alive&&p.carapace>0&&p.team!==b.team&&dist(p,b,{x:b.x+b.vx*dt,y:b.y+b.vy*dt})<24&&Math.abs(b.z-(p.z+30))<45){this.reflectLizard(p,b);break;}
 return updateBall.call(this,dt);
};
const kill=P.kill;
P.kill=function(b,k){if(['venomshot','element-poison'].includes(b.power))this.makePoisonPool(b);return kill.call(this,b,k);};
P.updateReptiles=function(dt){
 for(const p of this.players){
  if(p.skeletonRevive>0&&!p.alive){p.skeletonRevive=Math.max(0,p.skeletonRevive-dt);p.state='ko';p.ko=0;p.z=p.vz=0;if(p.skeletonRevive<=0){p.alive=true;p.hp=Math.max(1,Math.ceil(p.maxHp*.2));p.state='idle';p.stateT=0;p.pending=null;p.charging=false;p.fx.ghostT=.35;this.fx.push({kind:'pow',x:p.x,y:p.y,z:55,text:'DEBOUT !',color:'#eee3b6',t:0,dur:.8});this.retargetAll();}}
  for(const key of ['camouflage','carapace','scaleShield','moltCooldown','moltSpeed','poisonSlow'])p[key]=Math.max(0,(p[key]||0)-dt);
  if(p.charging||['windup','throw'].includes(p.state))p.camouflage=0;
  if(p.solarRelease){p.solarRelease.left-=dt;if(!p.alive||this.ball.holder!==p){p.solarRelease=null;p.solarArmed=false;}else if(p.solarRelease.left<=0){const o=p.solarRelease.o; // Bypass the telegraph gate, retain solarArmed for conversion.
    p.solarRelease.left=Infinity;this.throwBall(p,o);p.solarRelease=null;
  }}
 }
 this.lizardTongues=(this.lizardTongues||[]).filter(h=>{if(!h.from.alive)return false;h.t+=dt;const dx=h.tx-h.x,dy=h.ty-h.y,n=Math.hypot(dx,dy)||1,move=Math.min(n,1300*dt),a={x:h.x,y:h.y};h.x+=dx/n*move;h.y+=dy/n*move;
  const p=this.ball.holder;if(p&&p.team!==h.from.team&&p.z<40&&dist(p,a,h)<20){p.pending=null;p.charging=false;this.give(h.from);this.setState(h.from,'pickup');this.say('BALLON VOLÉ !',.65);return false;}
  return h.t<.35&&n>8;
 });
 this.lizardMolts=(this.lizardMolts||[]).filter(q=>(q.t+=dt)<2.5);
 this.poisonPools=(this.poisonPools||[]).filter(q=>{q.left-=dt;for(const p of this.aliveInner(q.team))if(!q.hit.has(p)&&p.z<18&&Math.hypot(p.x-q.x,p.y-q.y)<42){q.hit.add(p);this.poisonHit(p,q.from,{pool:true});}return q.left>0;});
};
const update=P.update;
P.update=function(dt,inputs){if(this.paused)return;if(this.phase==='play'){
 // Check victory before revival, including simultaneous K.-O. from a previous tick.
 this.checkEnd();if(this.phase==='play')this.updateReptiles(dt);
 }const result=update.call(this,dt,inputs);for(const p of this.players)if(p.skeletonRevive>0&&!p.alive){p.state='ko';p.z=p.vz=p.ko=0;}return result;};
const pile=B.drawSkeletonPile;
B.drawSkeletonPile=function(c,g,p){if(!(p.skeletonRevive>0))return pile?.(c,g,p);const saved=p.boneScatter;p.boneScatter=.3;pile(c,g,p);p.boneScatter=saved;c.save();c.fillStyle='#fff2bf';c.font='bold 12px Arial';c.textAlign='center';c.fillText(Math.ceil(p.skeletonRevive)+' s',p.x,p.y-27);c.restore();return true;};
B.drawLizardBall=function(c,g,b){if(!['solar-meteor','scale-reflect','venomshot','element-poison'].includes(b.power))return false;
 const gold=b.power==='solar-meteor',poison=['venomshot','element-poison'].includes(b.power),color=gold?'#ffe386':poison?'#9fe84f':'#adceff';c.save();
 for(let i=0;i<b.trail.length;i++){const q=b.trail[i];c.globalAlpha=i/b.trail.length*.65;c.fillStyle=color;c.beginPath();c.arc(q.x,q.y-q.z,4+i*.4,0,Math.PI*2);c.fill();}c.globalAlpha=1;c.shadowColor=color;c.shadowBlur=22;c.fillStyle=color;c.beginPath();c.arc(b.x,b.y-b.z,gold?16:12,0,Math.PI*2);c.fill();c.fillStyle=gold?'#fff8d7':poison?'#346a28':'#fff';for(let i=0;i<5;i++){const a=g.time*5+i*1.26;c.beginPath();c.arc(b.x+Math.cos(a)*7,b.y-b.z+Math.sin(a)*7,poison?3:2,0,Math.PI*2);c.fill();}c.restore();return true;
};
B.drawLizardEffects=function(c,g){c.save();
 for(const q of g.poisonPools||[]){c.globalAlpha=Math.min(1,q.left);c.fillStyle='#6fae35aa';c.strokeStyle='#c7f76e';c.lineWidth=2;c.beginPath();c.ellipse(q.x,q.y,42,25,0,0,Math.PI*2);c.fill();c.stroke();for(let i=0;i<5;i++){c.beginPath();c.arc(q.x+Math.sin(i*7)*28,q.y+Math.cos(i*4)*15,3+Math.sin(g.time*4+i),0,Math.PI*2);c.stroke();}}c.globalAlpha=1;
 for(const h of g.lizardTongues||[]){c.lineCap='round';c.strokeStyle='#893154';c.lineWidth=9;c.beginPath();c.moveTo(h.from.x,h.from.y-38);c.quadraticCurveTo((h.from.x+h.x)/2,(h.from.y+h.y)/2-20,h.x,h.y-30);c.stroke();c.strokeStyle='#ff8ca7';c.lineWidth=5;c.stroke();}
 for(const q of g.lizardMolts||[]){c.save();c.globalAlpha=(1-q.t/2.5)*.4;B.sprites.drawPerson(c,q.x,q.y,q.def,q.team,{pose:'down',dir:1,t:q.t});c.restore();}
 for(const p of g.players){if(!p.alive)continue;const gold=p.scaleShield>0||p.solarRelease,guard=p.carapace>0;if(gold||guard){c.strokeStyle=gold?'#ffe27b':'#9fbdff';c.lineWidth=3;c.fillStyle=gold?'#ffde6422':'#80aaff44';c.beginPath();c.ellipse(p.x,p.y-p.z-29,28,37,0,0,Math.PI*2);c.fill();c.stroke();for(let i=0;i<5;i++){const a=i*1.26+g.time;c.fillStyle=c.strokeStyle;c.beginPath();c.arc(p.x+Math.cos(a)*29,p.y-p.z-29+Math.sin(a)*36,3,0,Math.PI*2);c.fill();}}
 if(p.solarRelease){c.fillStyle='#fff3b2';c.font='bold 13px Arial';c.textAlign='center';c.fillText('☀ MÉTÉORE !',p.x,p.y-78);}
 if(p.poisonSlow>0){c.fillStyle='#bcf976';for(let i=0;i<3;i++){c.beginPath();c.arc(p.x-10+i*10,p.y-p.z-50-Math.sin(g.time*4+i)*5,3,0,Math.PI*2);c.fill();}}
 }c.restore();};
})(window.BC);
