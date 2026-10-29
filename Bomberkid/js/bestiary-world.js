// Attaques annoncées et comportements du bestiaire ; les bombes restent celles du jeu.
(function(BK){
'use strict';
const W=BK.World.prototype;
W.bestiaryShot=function(e,p,kind='ball',offset=0){
 const a=Math.atan2(p.y-e.y,p.x-e.x)+offset;
 this.shots.push({kind,color:e.def.bestiary.action==='arrow'?'black':'blue',x:e.x+Math.cos(a)*.45,y:e.y+Math.sin(a)*.45,a,speed:kind==='magic'?3:4.2,turn:0,life:4,t:0,owner:e,z:.3,r:.2,dead:false,deadT:0,dmg:e.def.dmg,dist:0,range:5,passes:2,pause:0,legendArrow:['arrow','spear'].includes(e.def.bestiary.action)});
};
W.bestiaryBomb=function(e,p){
 e.bombsOut=e.bombsOut||0;e.score=e.score||0;e.kills=e.kills||0;
 // Cible la position annoncée, sans traverser les murs avec l’explosion.
 const c=Math.floor(p.x),r=Math.floor(p.y);if(!this.inside(c,r)||this.cell(c,r)||this.bombAt(c,r))return;
 this.bombs.push({cx:Math.floor(e.x),cy:Math.floor(e.y),x:e.x,y:e.y,z:1,t:BK.BOMB_FUSE,fire:e.boss?3:2,damage:1,level:1,owner:e,state:'flying',from:{x:e.x,y:e.y,z:this.groundZ(e.x,e.y)+1},to:{x:c+.5,y:r+.5,z:this.groundZ(c+.5,r+.5)},arc:1.2,thrower:e,flyT:0,flyDur:.7,passers:new Set(),born:this.time,dir:0});e.bombsOut++;
};
W.bestiaryMove=function(e,p,dt,mult=1){
 if(!p||!e.speed)return;
 const target=this.stepToward(Math.floor(e.x),Math.floor(e.y),Math.floor(p.x),Math.floor(p.y),(n,from)=>!this.blocked(n.c,n.r,e)&&this.canStep(from.c,from.r,n.c,n.r,e));
 if(target)this.moveFree(e,target.c+.5,target.r+.5,e.speed*mult,dt);
};
W.bestiaryStrike=function(e,x,y,radius){
 for(const p of this.players)if(p.alive&&!p.npc&&!p.air&&Math.hypot(p.x-x,p.y-y)<radius+p.r&&this.canSee({x,y},p,radius+1))this.hitPlayer(p,{kind:'enemy',enemy:e,dmg:e.def.dmg});
 this.burst(x,y,.4,e.def.color,12);
};
W.updateBestiary=function(e,dt){
 const b=e.def.bestiary,p=this.nearestPlayer(e.x,e.y);e.home=e.home||{x:e.x,y:e.y};e.cool=(e.cool??1.3)-dt;e.flash=Math.max(0,(e.flash||0)-dt);e.z=0;if(e.beam)e.beam.t-=dt;e.phase=e.boss&&e.hp<=e.maxHp/2?2:1;
 if(e.phase===2&&!e.enraged){e.enraged=true;this.addFloater(e.x,e.y,'À moi de jouer !',{size:.3,color:'#ffd54a',life:2});}
 if(!p)return;const dist=Math.hypot(p.x-e.x,p.y-e.y),visible=this.canSee(e,p,9);e.flip=p.x<e.x;
 if(b.action==='creeper'){
  if(dist<1.8&&visible){e.fuse=(e.fuse||0)+dt;e.flash=.12;e.state='charge';if(e.fuse>=1.5){e.dead=true;e.deadT=0;e.bombsOut=1;e.score=0;e.kills=0;const bomb={cx:Math.floor(e.x),cy:Math.floor(e.y),x:e.x,y:e.y,z:0,t:0,fire:3,damage:1,level:1,owner:e,state:'idle',passers:new Set(),born:this.time,dir:0};this.bombs.push(bomb);this.explodeBomb(bomb);this.events.push({type:'enemyKilled',enemy:e});}return;}
  e.fuse=0;e.state='walk';this.bestiaryMove(e,p,dt);return;
 }
 // Télégraphie commune : l’emplacement visé reste fixe pendant la préparation.
 if(e.warning){const a=e.warning;a.t-=dt;if(a.t>0)return;e.warning=null;e.flash=.25;e.cool=(e.boss?2.6:2.8)/(e.phase===2?1.35:1);this.performBestiaryAttack(e,a);return;}
 if(b.group==='bosses'){
  if(e.dashT>0){e.dashT-=dt;this.moveFree(e,e.x+Math.cos(e.dashA)*3,e.y+Math.sin(e.dashA)*3,4,dt);return;}
  this.bestiaryMove(e,p,dt,dist>2?.8:0);
  if(e.cool<=0&&dist<10){
   const sets={armos_knights:['stomp','charge'],lanmolas:['burrow','spread'],moldorm:['charge','charge'],agahnim:['magic','teleport'],'agahnim_2':['magic','spread','teleport'],helmasaur_king:['fire','tail','charge'],arrghus:['orbs','stomp'],mothula:['spread','charge'],blind:['fire','orbs'],kholdstare:['ice','orbs'],vitreous:['orbs','beam'],trinexx:['fire','ice','charge'],ganon:['boomerang','spread','teleport','bomb'],dark_link:['bomb','charge','boomerang']};
   const seq=sets[b.id.slice(4)]||(b.id.startsWith('alt_dark_link')?sets.dark_link:['fire','charge']);const kind=seq[(e.turn||0)%seq.length];e.turn=(e.turn||0)+1;
   e.warning={kind,x:p.x,y:p.y,t:.9,max:.9};
  }return;
 }
 if(b.action==='stone'&&!e.awake){e.state='rest';if(dist<3&&visible){e.awake=true;e.cool=.8;this.burst(e.x,e.y,.3,'#fff0bd',8);}return;}
 if(b.action==='burrow'){const cycle=e.t%4;e.state=cycle<1.3?'hidden':'walk';if(e.state==='hidden')return;this.bestiaryMove(e,p,dt);if(e.cool<=0&&visible)e.warning={kind:'ball',x:p.x,y:p.y,t:.55,max:.55};return;}
 if(b.action==='bounce'){for(const q of this.players)if(q.alive&&Math.hypot(q.x-e.x,q.y-e.y)<.85){const dx=q.x-e.x,dy=q.y-e.y,d=Math.hypot(dx,dy)||1;this.moveCircle(q,dx/d*dt*6,dy/d*dt*6,null);}return;}
 if(b.action==='orbit'||b.action==='flail'){
  if(b.action==='orbit'&&!['firebar','chomp','skulls'].includes(b.shape)){const a=e.t*1.8;this.moveFree(e,e.home.x+Math.cos(a)*1.5,e.home.y+Math.sin(a)*1.5,2,dt);}
  const reach=b.shape==='firebar'?2.4:b.action==='flail'?1.4:1.2,a=e.t*1.8;
  e.orbitPoints=Array.from({length:b.shape==='firebar'?6:b.shape==='skulls'?3:1},(_,i)=>{const r=b.shape==='firebar'?(i+1)*.4:reach,angle=a+(b.shape==='skulls'?i*Math.PI*2/3:0);return{x:e.x+Math.cos(angle)*r,y:e.y+Math.sin(angle)*r};}).filter(q=>this.canSee(e,q,3));
  for(const q of e.orbitPoints)for(const hero of this.players)if(hero.alive&&Math.hypot(hero.x-q.x,hero.y-q.y)<.45)this.hitPlayer(hero,{kind:'enemy',enemy:e});return;
 }
 if(b.action==='electric'){e.charged=e.t%3<1.5;e.shockT=(e.shockT||0)-dt;if(e.charged&&visible&&dist<1.3&&e.shockT<=0){this.bestiaryStrike(e,e.x,e.y,1.1);e.shockT=.4;}if(b.group!=='traps')this.bestiaryMove(e,p,dt,.55);return;}
 if(b.action==='mirror'){const dx=-(p.input?.dx||0),dy=-(p.input?.dy||0);this.moveFree(e,e.x+dx,e.y+dy,e.speed,dt);}
 else if(['chase','stone','split','steal','hop','charge'].includes(b.action)){
  if(e.dashT>0){e.dashT-=dt;this.moveFree(e,e.x+Math.cos(e.dashA)*3,e.y+Math.sin(e.dashA)*3,4,dt);return;}
  this.bestiaryMove(e,p,dt,b.action==='hop'?(Math.sin(e.t*5)>0?1.7:0):1);
 }
 if(b.action==='steal'&&dist<.8&&e.cool<=0){const n=Math.min(5,p.gold||0);p.gold-=n;e.stolen=(e.stolen||0)+n;e.cool=4;if(n)this.addFloater(e.x,e.y,'−'+n+' pièces',{size:.3,life:1});}
 if(e.cool<=0&&visible&&dist<(b.action==='charge'?6:8)){
  const kinds={bomb:'bomb',shot:'ball',arrow:'ball',spear:'ball',fire:'fire',ice:'ice',magic:'teleport',mirror:'ball',boomerang:'boomerang',beam:'beam',wall:'drop',mini:'mini',charge:'charge',hop:'stomp'};
  if(kinds[b.action])e.warning={kind:kinds[b.action],x:p.x,y:p.y,t:b.action==='wall'?1.2:.65,max:b.action==='wall'?1.2:.65};
 }
};
W.performBestiaryAttack=function(e,a){
 const b=e.def.bestiary,aim={x:a.x,y:a.y};
 if(a.kind==='bomb')this.bestiaryBomb(e,aim);
 else if(a.kind==='charge'){e.dashA=Math.atan2(a.y-e.y,a.x-e.x);e.dashT=e.boss?1.1:.7;}
 else if(['stomp','drop','burrow'].includes(a.kind)){
  if(a.kind!=='stomp'&&this.canSee(e,aim,8)&&!this.blocked(Math.floor(a.x),Math.floor(a.y),e)){e.x=a.x;e.y=a.y;}
  this.bestiaryStrike(e,e.x,e.y,e.boss?1.7:.9);this.shake=.15;
 }else if(a.kind==='tail')this.bestiaryStrike(e,e.x,e.y,2);
 else if(a.kind==='teleport'){
  const spots=[];for(let r=Math.max(1,Math.floor(e.y)-3);r<Math.min(this.rows-1,e.y+3);r++)for(let c=Math.max(1,Math.floor(e.x)-3);c<Math.min(this.cols-1,e.x+3);c++)if(!this.blocked(c,r,e)&&this.walkableTerrain(c,r)&&Math.hypot(c+.5-a.x,r+.5-a.y)>1.5)spots.push({x:c+.5,y:r+.5});
  const q=spots[Math.floor(Math.random()*spots.length)];if(q){this.burst(e.x,e.y,.4,e.def.color,10);e.x=q.x;e.y=q.y;}this.bestiaryShot(e,aim,'magic');
 }else if(a.kind==='orbs'||a.kind==='spread'){
  const count=a.kind==='orbs'?8:e.phase===2?5:3;for(let i=0;i<count;i++)this.bestiaryShot(e,aim,a.kind==='orbs'?'ball':'fire',a.kind==='orbs'?i*Math.PI*2/count:(i-(count-1)/2)*.25);
 }else if(a.kind==='beam'){
  const angle=Math.atan2(a.y-e.y,a.x-e.x);e.beam={a:angle,t:.4};
  for(const p of this.players){const dx=p.x-e.x,dy=p.y-e.y,along=dx*Math.cos(angle)+dy*Math.sin(angle),side=Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle));if(along>0&&along<8&&side<.35+p.r&&this.canSee(e,p,8))this.hitPlayer(p,{kind:'enemy',enemy:e});}
 }else if(a.kind==='mini'){
  for(const p of this.players)if(p.alive&&Math.hypot(p.x-a.x,p.y-a.y)<.9&&this.canSee(e,p,8)){p.sizeT=15;p.sizeScale=.4;this.burst(p.x,p.y,.4,'#dba8ff',10);}
 }else if(a.kind==='boomerang'){
  this.shots.push({kind:'bone',x:e.x,y:e.y,a:Math.atan2(a.y-e.y,a.x-e.x),speed:4,z:.4,r:.23,life:12,t:0,owner:e,dead:false,deadT:0,dist:0,range:4,phase:'out',pause:0});
 }else this.bestiaryShot(e,aim,['fire','ice','magic'].includes(a.kind)?a.kind:'ball');
};
const hurt=W.hurtEnemy;
W.hurtEnemy=function(e,by,dmg,source){
 const before=e.hp,wasDead=e.dead,oldZ=e.z;
 if(e.def.bestiary&&source==='bomb')e.z=0;
 const result=hurt.call(this,e,by,dmg,source);e.z=oldZ;
 if(!wasDead&&e.dead&&e.def.bestiary){
  if(e.def.bestiary.action==='split'&&!e.fragment){for(const dx of [-1,1]){const c=Math.floor(e.x)+dx,r=Math.floor(e.y);if(this.inside(c,r)&&!this.blocked(c,r,e))this.addEnemy('alt_slime',c,r,{fragment:true,hp:1,maxHp:1,r:.18});}}
  if(e.def.bestiary.shape==='bee')this.spawnItem(Math.floor(e.x),Math.floor(e.y),'honey');
  if(e.stolen){for(let i=0;i<e.stolen;i++)this.spawnItem(Math.floor(e.x),Math.floor(e.y),'coin');e.stolen=0;}
 }
 return result===undefined?e.hp<before:result;
};
// Les alliés voient aussi les avertissements et les armes tournantes.
const danger=BK.ai.allyArenaDanger;
BK.ai.allyArenaDanger=function(world){const out=new Float32Array(danger(world));for(const e of world.enemies){if(e.dead||!e.def.bestiary)continue;const points=[...(e.orbitPoints||[])];if(e.warning){points.push({x:e.warning.x,y:e.warning.y});if(['beam','charge','fire','ice','ball'].includes(e.warning.kind)){const a=Math.atan2(e.warning.y-e.y,e.warning.x-e.x);for(let d=.5;d<8;d+=.5){const q={x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d};if(!world.canSee(e,q,8))break;points.push(q);}}}if(e.def.bestiary.action==='creeper'&&e.fuse>0){
 // Toute la portée de l’explosion, y compris les bombes qu’elle déclencherait.
 // Zéro impose une fuite immédiate, sans attendre la fin du clignotement.
 const remaining=Math.max(0,1.5-e.fuse),blast=BK.ai.dangerMap(world,{c:Math.floor(e.x),r:Math.floor(e.y),fire:3,t:remaining});
 for(let k=0;k<out.length;k++)if(blast[k]<=remaining)out[k]=0;
 points.push({x:e.x,y:e.y});
 }else if(e.charged)points.push({x:e.x,y:e.y});for(const q of points)for(let r=Math.floor(q.y)-1;r<=Math.floor(q.y)+1;r++)for(let c=Math.floor(q.x)-1;c<=Math.floor(q.x)+1;c++)if(world.inside(c,r))out[world.idx(c,r)]=0;}return out;};
})(window.BK);
