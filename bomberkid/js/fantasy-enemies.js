// Nouveaux monstres, perception locale et attaques utilisant les bombes du jeu.
(function(BK){
'use strict';
const W=BK.World.prototype;
const entries=[
 ['dragon_tricephale','Dragon à trois têtes','🐉',9,0,.68,'#5caa68','Trois têtes avec leur propre vie. Chaque tête crache du feu qui brûle au sol pendant 6 secondes.'],
 ['ninja_bombardier','Ninja bombardier','🥷',3,1.55,.32,'#485078','Annonce son lancer, puis lance une bombe que tu peux ramasser ou botter.'],
 ['clown_artificier','Clown artificier','🤡',3,1.15,.34,'#cd5caa','Alterne cadeaux lancés et bottés : ce sont de vraies bombes emballées !'],
 ['bombe_coureuse','Bombe coureuse','💣',2,1.1,.33,'#363e56','Te voit à 3,5 cases, allume sa mèche et te poursuit. Explose au bout de 7 secondes, avec un clignotement de plus en plus rapide.'],
 ['guimauve','Guimauve','🍥',1,.85,.3,'#fff1dd','Petit marcheur qui reste à deux cases de son point de départ.'],
 ['loup_garou','Loup-garou','🐺',4,1.05,.38,'#7c8195','Rôde près de sa tanière. Te voit à 4 cases, puis fonce avec ses griffes. Les murs bloquent sa vue.']
];
for(const [id,name,icon,hp,speed,r,color,hint]of entries){BK.ENEMIES[id]={name,hp,speed,r,color,score:hp*120,xp:hp*12,dmg:id==='loup_garou'?15:10,behavior:'fantasy',fantasy:true,...(id==='dragon_tricephale'?{boss:'mini'}:{})};BK.EDITOR_TABS.find(t=>t.id==='ennemis').items.unshift({enemy:id,name,icon,hint});}
const add=W.addEnemy;
W.addEnemy=function(type,c,r,o){const e=add.call(this,type,c,r,o);e.spawnHome={x:c+.5,y:r+.5};if(type==='dragon_tricephale')e.heads=[0,1,2].map(i=>({hp:3,maxHp:3,cool:1+i*.8,hurt:0}));return e;};
W.enemyCanSee=function(e,p,range){
 const distance=Math.hypot(p.x-e.x,p.y-e.y);if(distance>range)return false;const steps=Math.ceil(distance/.15),c0=Math.floor(e.x),r0=Math.floor(e.y),z=this.groundZ(e.x,e.y);
 for(let n=1;n<steps;n++){const c=Math.floor(e.x+(p.x-e.x)*n/steps),r=Math.floor(e.y+(p.y-e.y)*n/steps);if(c===c0&&r===r0)continue;if(!this.inside(c,r)||(this.cell(c,r)&&!BK.STATUES.includes(this.deco[this.idx(c,r)]))||this.hAt(c,r)>z+.5)return false;}return true;
};
W.visibleEnemyTarget=function(e,range=4){return this.players.filter(p=>p.alive&&!p.npc&&!p.falling&&Math.abs(this.groundZ(p.x,p.y)-this.groundZ(e.x,e.y))<.5&&this.enemyCanSee(e,p,range)).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0]||null;};
// La cible n'est jamais recherchée au-delà de la vue pendant une mise à jour ennemie.
const nearest=W.nearestPlayer;
W.nearestPlayer=function(x,y){if(this.perceivingEnemy)return this.visibleEnemyTarget(this.perceivingEnemy,this.perceivingEnemy.boss?10:this.perceivingEnemy.def.range?this.perceivingEnemy.def.range+1.5:9);return nearest.call(this,x,y);};
W.localEnemyPatrol=function(e,dt,radius=2){
 const home=e.spawnHome||(e.spawnHome={x:e.x,y:e.y});
 if(Math.hypot(e.x-home.x,e.y-home.y)>radius+.1){this.bestiaryMove(e,home,dt,.8);e.target=null;return;}
 e.patrolPause=Math.max(0,(e.patrolPause||0)-dt);if(e.patrolPause)return;
 if(!e.patrolTarget){const c=Math.floor(e.x),r=Math.floor(e.y),options=BK.DIRS.map(d=>({x:c+d.dx+.5,y:r+d.dy+.5})).filter(q=>Math.hypot(q.x-home.x,q.y-home.y)<=radius&&this.inside(Math.floor(q.x),Math.floor(q.y))&&!this.blocked(Math.floor(q.x),Math.floor(q.y),e)&&this.walkableTerrain(Math.floor(q.x),Math.floor(q.y))&&this.canStep(c,r,Math.floor(q.x),Math.floor(q.y),e));if(!options.length)return;e.patrolTarget=options[Math.floor(Math.random()*options.length)];}
 const q=e.patrolTarget;e.flip=q.x<e.x;this.moveFree(e,q.x,q.y,e.speed,dt);if(Math.hypot(e.x-q.x,e.y-q.y)<.08){e.patrolTarget=null;e.patrolPause=.5+Math.random();}
};
const update=W.updateEnemy;
W.updateEnemy=function(e,dt){
 if(this.hiddenSecretAt?.(Math.floor(e.x),Math.floor(e.y)))return;
 if(e.dead)return update.call(this,e,dt);
 if(e.def.fantasy){e.t+=dt;e.stateT+=dt;e.hurt=Math.max(0,e.hurt-dt);return this.updateFantasyEnemy(e,dt);}
 const previous=this.perceivingEnemy;this.perceivingEnemy=e;
 try{
  const local=!e.boss&&!e.def.peaceful&&!e.tame&&!e.def.trap&&!e.def.solid&&e.speed>0&&!['wasp','mole','sea','plant','orc','rabbit'].includes(e.def.behavior);
  if(local){const range=e.def.behavior==='ghost'||e.def.bestiary?.shape==='ghost'?3.5:Math.min(7,e.def.range||4),p=this.visibleEnemyTarget(e,range);
   if(!p||Math.hypot(e.x-e.spawnHome.x,e.y-e.spawnHome.y)>7){e.t+=dt;e.stateT+=dt;e.hurt=Math.max(0,e.hurt-dt);e.target=null;e.warning=null;e.dashT=0;e.state='walk';e.fuse=0;this.localEnemyPatrol(e,dt,e.def.behavior==='ghost'||e.def.bestiary?.shape==='ghost'?1.5:2);return;}
  }
  return update.call(this,e,dt);
 }finally{this.perceivingEnemy=previous;}
};
W.fantasyBomb=function(e,p,gift,kick){
 const before=this.bombs.length;this.bestiaryBomb(e,p);const b=this.bombs[this.bombs.length-1];if(this.bombs.length===before)return;
 b.gift=gift;
 if(kick){const c=Math.floor(e.x),r=Math.floor(e.y);if(this.bombAt(c,r)){this.bombs.pop();e.bombsOut--;return;}Object.assign(b,{cx:c,cy:r,x:c+.5,y:r+.5,z:0,state:'idle',passers:new Set()});const dx=p.x-e.x,dy=p.y-e.y,dir=Math.abs(dx)>Math.abs(dy)?dx>0?3:1:dy>0?0:2;this.kickBomb(b,dir,e);}
};
W.updateFantasyEnemy=function(e,dt){
 const type=e.type,p=this.visibleEnemyTarget(e,type==='dragon_tricephale'?6:type==='loup_garou'?4:3.5);e.flip=p?p.x<e.x:e.flip;
 if(type==='dragon_tricephale'){
  for(let i=0;i<3;i++){const h=e.heads[i];h.hurt=Math.max(0,h.hurt-dt);h.cool-=dt;if(h.hp>0&&p&&h.cool<=0){h.cool=3.6;const from={x:e.x+(i-1)*.45,y:e.y-.12},target={x:p.x,y:p.y};this.dragonShots=this.dragonShots||[];this.dragonShots.push({from,to:target,x:from.x,y:from.y,z:this.groundZ(e.x,e.y)+1.2,base:this.groundZ(e.x,e.y),t:0,dur:.85,owner:e,head:i});h.spit=.3;}h.spit=Math.max(0,(h.spit||0)-dt);}return;
 }
 if(type==='bombe_coureuse'){
  if(p&&e.fuseLeft==null){e.fuseLeft=7;e.state='charge';this.addFloater(e.x,e.y,'Tic… tac !',{size:.25,life:1.2});}
  if(e.fuseLeft!=null){e.fuseLeft=Math.max(0,e.fuseLeft-dt);const elapsed=7-e.fuseLeft;e.bombFlash=Math.sin(elapsed*8+elapsed*elapsed*3)>0;
   if(p)this.bestiaryMove(e,p,dt,2.5);
   if(e.fuseLeft<=0){e.dead=true;e.deadT=0;e.bombsOut=1;e.score=0;e.kills=0;const b={cx:Math.floor(e.x),cy:Math.floor(e.y),x:e.x,y:e.y,z:0,t:0,fire:3,damage:1,level:1,owner:e,state:'idle',passers:new Set(),born:this.time,dir:0};this.bombs.push(b);this.explodeBomb(b);this.events.push({type:'enemyKilled',enemy:e});}return;
  }
 }
 if(type==='guimauve'){this.localEnemyPatrol(e,dt,2);return;}
 if(!p){e.warning=null;e.state='walk';this.localEnemyPatrol(e,dt,type==='loup_garou'?1:2);return;}
 e.patrolTarget=null;
 if(type==='loup_garou'){e.state='charge';this.bestiaryMove(e,p,dt,3);e.clawT=(e.clawT||0)+dt;return;}
 if(type==='bombe_coureuse')return;
 e.cool=(e.cool??1)-dt;
 if(e.warning){e.warning.t-=dt;if(e.warning.t<=0){const aim={x:e.warning.x,y:e.warning.y};if(this.canSee(e,aim,5))this.fantasyBomb(e,aim,type==='clown_artificier',type==='clown_artificier'&&(e.turn||0)%2===1);e.turn=(e.turn||0)+1;e.warning=null;e.cool=type==='ninja_bombardier'?2.7:3.2;}return;}
 if(e.cool<=0){e.warning={x:p.x,y:p.y,t:.65};return;}
 if(Math.hypot(p.x-e.x,p.y-e.y)>2.5)this.bestiaryMove(e,p,dt,.7);
};
const hurt=W.hurtEnemy;
W.hurtEnemy=function(e,by,dmg,source){
 if(e.type!=='dragon_tricephale')return hurt.call(this,e,by,dmg,source);
 if(e.dead||e.hurt>0)return false;
 const live=e.heads.map((h,i)=>({h,i})).filter(q=>q.h.hp>0),aim=by?.x??e.x;
 live.sort((a,b)=>Math.abs(e.x+(a.i-1)*.6-aim)-Math.abs(e.x+(b.i-1)*.6-aim));const head=live[0];if(!head)return false;
 const damage=Math.min(head.h.hp,dmg||1),before=e.hp,result=hurt.call(this,e,by,damage,source);
 if(e.hp<before){head.h.hp-=before-e.hp;head.h.hurt=.7;if(head.h.hp<=0){head.h.cool=Infinity;this.addFloater(e.x,e.y,'Une tête en moins !',{size:.3,life:1.5});}}return result;
};
const effects=W.updateArenaEffects;
W.updateArenaEffects=function(dt){
 effects.call(this,dt);
 for(const f of this.dragonFires||[])f.t+=dt;this.dragonFires=(this.dragonFires||[]).filter(f=>f.t<6);
 for(const s of this.dragonShots||[]){s.t+=dt;const u=Math.min(1,s.t/s.dur),x=s.from.x+(s.to.x-s.from.x)*u,y=s.from.y+(s.to.y-s.from.y)*u;
  if(!this.canSee({x:s.x,y:s.y},{x,y},Math.hypot(x-s.x,y-s.y)+.1)||this.cell(Math.floor(x),Math.floor(y))){s.done=true;continue;}
  s.x=x;s.y=y;s.z=s.base+1.2*(1-u)+Math.sin(u*Math.PI)*.65;
  if(u>=1){s.done=true;const c=Math.floor(x),r=Math.floor(y);if(this.walkableTerrain(c,r)&&Math.abs(this.hAt(c,r)-s.base)<.15){this.dragonFires=this.dragonFires||[];const old=this.dragonFires.find(f=>f.c===c&&f.r===r);if(old)old.t=0;else this.dragonFires.push({c,r,z:s.base,t:0,owner:s.owner});}}
 }
 this.dragonShots=(this.dragonShots||[]).filter(s=>!s.done);
 for(const f of this.dragonFires||[])for(const p of this.players)if(p.alive&&!p.npc&&!p.air&&!p.falling&&Math.floor(p.x)===f.c&&Math.floor(p.y)===f.r&&Math.abs(this.groundZ(p.x,p.y)-f.z)<.2)this.hitPlayer(p,{kind:'flame',owner:f.owner,dmg:10});
};
const danger=BK.ai.allyArenaDanger;
BK.ai.allyArenaDanger=function(world){const out=new Float32Array(danger(world));for(const f of world.dragonFires||[])if(f.t<6)out[world.idx(f.c,f.r)]=0;for(const s of world.dragonShots||[])if(!s.done)out[world.idx(Math.floor(s.to.x),Math.floor(s.to.y))]=Math.min(out[world.idx(Math.floor(s.to.x),Math.floor(s.to.y))],Math.max(0,s.dur-s.t));
 for(const e of world.enemies)if(!e.dead&&e.type==='bombe_coureuse'&&e.fuseLeft!=null){const blast=BK.ai.dangerMap(world,{c:Math.floor(e.x),r:Math.floor(e.y),fire:3,t:0});for(let i=0;i<out.length;i++)out[i]=Math.min(out[i],blast[i]);
  // Une bombe qui court reste dangereuse hors des quatre branches de son souffle.
  // On garde une marge autour d'elle, sans considérer l'autre côté d'un mur comme exposé.
  for(let r=Math.max(0,Math.floor(e.y-4));r<=Math.min(world.rows-1,Math.ceil(e.y+4));r++)for(let c=Math.max(0,Math.floor(e.x-4));c<=Math.min(world.cols-1,Math.ceil(e.x+4));c++)if(Math.hypot(c+.5-e.x,r+.5-e.y)<3.8&&Math.abs(world.hAt(c,r)-world.groundZ(e.x,e.y))<.2&&world.enemyCanSee(e,{x:c+.5,y:r+.5},4))out[world.idx(c,r)]=0;
 }return out;};
const render=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){render.call(this,ctx,cam,time,push);
 for(const f of this.dragonFires||[])push(f.r+.5,f.c+.5,()=>{BK.sprites.drawFlame(ctx,cam,f.c,f.r,.35+.12*Math.sin(time*8),'center',0,time,f.z,false,2);});
 for(const s of this.dragonShots||[])push(s.y,s.x,()=>{const p=cam.project(s.x,s.y,s.z);ctx.save();const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,p.k*.23);g.addColorStop(0,'#fffac1');g.addColorStop(.4,'#ffbe42');g.addColorStop(1,'#f34923');ctx.fillStyle=g;ctx.shadowColor='#ff8c32';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(p.x,p.y,p.k*.23,0,Math.PI*2);ctx.fill();ctx.restore();});
};
})(window.BK);
(function(BK){
'use strict';
const S=BK.sprites,draw=S.drawEnemy;
S.drawEnemy=function(ctx,type,o={}){
 if(!BK.ENEMIES[type]?.fantasy)return draw.call(this,ctx,type,o);
 const e=o.creature||{},t=o.t||0,s=(o.s||60)/100,ink='#323344';ctx.save();ctx.scale(o.flip?-s:s,s);ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.lineJoin='round';ctx.lineCap='round';
 const oval=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
 const poly=(pts,c)=>{ctx.fillStyle=c;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
 const box=(x,y,w,h,c,r=6)=>{ctx.fillStyle=c;S.rr(ctx,x,y,w,h,r);ctx.fill();ctx.stroke();};
 const line=(pts,c=ink,w=3)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.strokeStyle=ink;ctx.lineWidth=3;};
 const eyes=(x,y,angry=true)=>{oval(x-8,y,5,6,'#fff');oval(x+8,y,5,6,'#fff');oval(x-7,y+1,2,3,ink);oval(x+9,y+1,2,3,ink);if(angry){line([[x-15,y-9],[x-3,y-5]]);line([[x+3,y-5],[x+15,y-9]]);}};
 const hurt=o.hurt>0&&Math.floor(t*16)%2,c=hurt?'#fff':BK.ENEMIES[type].color;
 if(type==='dragon_tricephale'){
  poly([[-28,-28],[-78,-72],[-66,-22],[-42,-11]],'#d79357');poly([[28,-28],[78,-72],[66,-22],[42,-11]],'#d79357');
  poly([[21,-10],[75,-2],[58,-28],[45,-15]],c);oval(0,-30,37,28,c);oval(0,-20,23,18,'#e9cf87');oval(-27,-3,18,8,c);oval(27,-3,18,8,c);
  for(let i=0;i<3;i++){
   const h=e.heads?.[i]||{hp:3,maxHp:3},x=(i-1)*43,y=-91+(i===1?-17:0)+Math.sin(t*2+i)*3;
   if(h.hp<=0){oval((i-1)*20,-44,10,5,'#587e5d');continue;}
   line([[(i-1)*17,-39],[x*.7,-62],[x,y+14]],ink,18);line([[(i-1)*17,-39],[x*.7,-62],[x,y+14]],c,13);
   poly([[x-18,y-13],[x-23,y-33],[x-5,y-20]],'#f5db9b');poly([[x+12,y-18],[x+23,y-34],[x+22,y-9]],'#f5db9b');
   oval(x,y,24,20,h.hurt>0?'#fff7cf':c);oval(x,y+12,26,12,'#91c580');eyes(x,y-3);if(h.spit>0)oval(x,y+15,12,9,'#ff8d28');else line([[x-14,y+17],[x+14,y+17]]);
   poly([[x-14,y+16],[x-10,y+24],[x-6,y+16]],'#fff6d6');poly([[x+6,y+16],[x+10,y+24],[x+14,y+16]],'#fff6d6');
   box(x-22,y-47,44,7,ink,3);ctx.fillStyle='#8bea74';ctx.fillRect(x-20,y-45,40*h.hp/h.maxHp,3);
  }
 }else if(type==='ninja_bombardier'){
  const step=Math.sin(t*9)*3;oval(-13,-5-step,12,7,ink);oval(13,-5+step,12,7,ink);box(-22,-49,44,40,c);poly([[16,-52],[44,-46],[32,-33],[18,-40]],'#e65b59');oval(0,-66,25,24,c);box(-24,-70,48,15,'#e9ba90',4);eyes(0,-63);box(-25,-84,50,7,'#d75159',2);box(-22,-30,44,7,'#d75159',2);oval(-26,-36,9,10,c);oval(27,-35,9,10,c);S.drawBomb(ctx,32,-42,12,{t,fuse:1});
 }else if(type==='clown_artificier'){
  oval(-17,-4,18,8,'#edc24d');oval(17,-4,18,8,'#54a5e8');oval(0,-32,28,29,c);box(-5,-55,10,44,'#ffdf68',3);for(const y of [-43,-30,-17])oval(0,y,3,3,'#78d7cb');oval(-25,-72,15,19,'#e75a54');oval(25,-72,15,19,'#e75a54');oval(0,-70,25,25,'#fff3d9');eyes(0,-74,false);oval(0,-64,8,7,'#ed424e');line([[-12,-57],[0,-52],[12,-57]],'#bc4655',4);poly([[-18,-90],[0,-122],[18,-90]],'#ffce54');oval(0,-122,5,5,'#e85d9c');S.drawBomb(ctx,33,-38,13,{gift:true,t,fuse:1});
 }else if(type==='bombe_coureuse'){
  const step=e.fuseLeft!=null?Math.sin(t*17)*6:Math.sin(t*5)*2;oval(-17,-3-step,16,8,'#ebba4c');oval(17,-3+step,16,8,'#ebba4c');oval(0,-36,32,33,e.bombFlash?'#fff4c0':c);oval(-12,-50,7,10,e.bombFlash?'#ffcf70':'#72809e');box(-9,-76,18,10,'#ba935c',3);line([[0,-76],[9,-87],[5,-97]],'#97653b',5);eyes(1,-37);line([[-10,-21],[11,-21]]);
  if(e.fuseLeft!=null){const a=t*24;poly(Array.from({length:10},(_,i)=>{const r=i%2?5:12;return [5+Math.cos(a+i*Math.PI/5)*r,-97+Math.sin(a+i*Math.PI/5)*r];}),'#ffe25c');ctx.fillStyle='#fff5c3';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(Math.ceil(e.fuseLeft)+'',0,-111);}
 }else if(type==='guimauve'){
  ctx.translate(0,Math.sin(t*4)*3);oval(-14,-3,10,6,'#e2b5ba');oval(14,-3,10,6,'#e2b5ba');box(-29,-68,58,64,c,17);oval(0,-65,28,9,'#fffaf0');eyes(0,-36,false);oval(-20,-25,5,3,'#f2b5c6');oval(20,-25,5,3,'#f2b5c6');line([[-5,-21],[0,-18],[5,-21]],'#866477',2);oval(-33,-30,7,12,c);oval(33,-30,7,12,c);
 }else if(type==='loup_garou'){
  const run=e.state==='charge',step=Math.sin(t*(run?17:5))*5;oval(-16,-4-step,14,8,c);oval(16,-4+step,14,8,c);poly([[-26,-17],[-25,-47],[-35,-56],[-17,-53],[0,-66],[17,-53],[35,-56],[25,-47],[26,-17]],c);oval(0,-66,26,23,c);poly([[-25,-76],[-29,-109],[-8,-85]],c);poly([[25,-76],[29,-109],[8,-85]],c);poly([[-21,-81],[-23,-98],[-13,-84]],'#d99c9b');poly([[21,-81],[23,-98],[13,-84]],'#d99c9b');eyes(0,-69);oval(0,-51,18,12,'#bfc2cc');oval(0,-58,8,5,ink);poly([[-12,-48],[-8,-37],[-4,-47]],'#fff1d1');poly([[4,-47],[8,-37],[12,-48]],'#fff1d1');
  for(const sign of [-1,1]){const x=sign*(run?40:30),y=-29+(run?Math.sin(t*15)*6:0);line([[sign*21,-44],[x,y]],c,13);oval(x,y,10,10,c);for(let n=0;n<3;n++)poly([[x-7+n*6,y+4],[x-6+n*6,y+17],[x-3+n*6,y+5]],'#fff1d1');}
 }
 ctx.restore();
};
const bomb=S.drawBomb;
S.drawBomb=function(ctx,x,y,r,o={}){if(!o.gift)return bomb.call(this,ctx,x,y,r,o);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin((o.t||0)*5)*.06);ctx.lineWidth=Math.max(1.5,r*.1);ctx.strokeStyle='#633157';ctx.fillStyle='#d95094';S.rr(ctx,-r,-r,2*r,2*r,r*.2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffe070';ctx.fillRect(-r*.16,-r,r*.32,r*2);ctx.fillRect(-r,-r*.15,2*r,r*.3);ctx.strokeStyle='#ffe070';ctx.lineWidth=r*.22;ctx.beginPath();ctx.ellipse(-r*.3,-r*1.1,r*.32,r*.2,-.4,0,Math.PI*2);ctx.ellipse(r*.3,-r*1.1,r*.32,r*.2,.4,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff6b0';ctx.beginPath();ctx.arc(r*.65,-r*1.25,r*.12*(1+.3*Math.sin((o.t||0)*30)),0,Math.PI*2);ctx.fill();ctx.restore();};
})(window.BK);
