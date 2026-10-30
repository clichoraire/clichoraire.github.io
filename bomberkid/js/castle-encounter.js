// Le régent n’est qu’un gardien : sa défaite ouvre la faille du véritable souverain.
(function(BK){
'use strict';
const W=BK.World.prototype;
BK.ENEMIES.castle_matthieu={...BK.ENEMIES.alt_ganon,name:'Matthieu, le roi tricheur'};
W.setupCastleBoss=function(){
 this.castleEncounter={phase:1,transition:0,done:false,awake:false};
 this.addEnemy('alt_agahnim',14,10,{castleBoss:true,name:'Malrec, le régent',hp:12,maxHp:12,cool:2.5});
};
const hurt=W.hurtEnemy;
W.hurtEnemy=function(e,by,dmg,source){
 if(e.castleBoss&&by===e)return false;
 const wasDead=e.dead,result=hurt.call(this,e,by,dmg,source);
 if(e.castleBoss&&!wasDead&&e.dead){
  const fight=this.castleEncounter;
  if(fight.phase===1){
   fight.phase=0;fight.transition=4;
   // Aucune victoire, sortie ou récompense entre les deux vrais adversaires.
   this.events=this.events.filter(event=>!(event.type==='bossDead'&&event.enemy===e));
   this.events.push({type:'castleFalseVictory'});
   this.bombs=[];this.flames=[];this.flameAt.clear();this.shots=[];
   for(const p of this.players){p.bombsOut=0;p.carrying=null;p.invuln=Math.max(p.invuln||0,5);}
   this.burst(14.5,10.5,1,'#d6a4ff',40);
  }else if(fight.phase===2){fight.done=true;}
 }
 return result;
};
const effects=W.updateArenaEffects;
W.updateArenaEffects=function(dt){
 effects.call(this,dt);
 const fight=this.castleEncounter;
 if(fight?.phase===0){
  fight.transition-=dt;
  if(fight.transition<=0){
   fight.phase=2;
   const spot=this.freeCellNear(14,10)||{c:14,r:10};
   this.addEnemy('castle_matthieu',spot.c,spot.r,{castleBoss:true,castleFinal:true,name:'Matthieu, le roi tricheur',hp:26,maxHp:26,speed:1.25,cool:2});
   this.shake=.5;this.burst(spot.c+.5,spot.r+.5,1.5,'#bc77ff',55);
   this.events.push({type:'castleReveal'});
   for(const p of this.players)if(p.alive)p.invuln=Math.max(p.invuln||0,2);
  }
 }
};
// Le roi mêle salves, magie circulaire, bombe et téléportation ; les annonces restent esquivables.
const bestiary=W.updateBestiary;
W.updateBestiary=function(e,dt){
 if(e.castleBoss&&!this.castleEncounter.awake){
  if(!this.players.some(p=>p.alive&&!p.npc&&p.y<23&&p.x>3&&p.x<26))return;
  this.castleEncounter.awake=true;
 }
 if(!e.castleFinal)return bestiary.call(this,e,dt);
 const p=this.nearestPlayer(e.x,e.y);if(!p)return;
 e.cool=(e.cool??2)-dt;e.flash=Math.max(0,(e.flash||0)-dt);e.flip=p.x<e.x;
 if(e.royalFlight>0){e.royalFlight=Math.max(0,e.royalFlight-dt);e.z=e.royalFlight?1.2+Math.sin(e.royalFlight*5)*.15:0;return;}
 e.z=0;
 if(e.warning){const a=e.warning;a.t-=dt;if(a.t>0)return;e.warning=null;e.cool=1.5;this.performBestiaryAttack(e,a);return;}
 const dist=Math.hypot(p.x-e.x,p.y-e.y);
 this.bestiaryMove(e,p,dt,dist>2?.8:0);
 if(e.cool<=0&&dist<10){const sequence=['royalPush','bomb','royalPush','royalCheat','spread'];const kind=sequence[(e.castleTurn||0)%sequence.length];e.castleTurn=(e.castleTurn||0)+1;e.warning={kind,x:p.x,y:p.y,t:1.05,max:1.05};}

};
// Une poussée annoncée, puis un recul continu qui respecte les murs et peut franchir une corniche.
const attack=W.performBestiaryAttack;
W.performBestiaryAttack=function(e,a){
 if(!e.castleFinal||!['royalPush','royalCheat'].includes(a.kind))return attack.call(this,e,a);
 const angle=Math.atan2(a.y-e.y,a.x-e.x),dx=Math.cos(angle),dy=Math.sin(angle);
 if(a.kind==='royalPush'){
  for(const p of this.players){const x=p.x-e.x,y=p.y-e.y,along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);
   if(p.alive&&!p.npc&&!p.air&&along>=0&&along<4.5&&side<1.2&&this.canSee(e,p,5))p.royalPush={dx,dy,left:.45};
  }
  this.burst(e.x+dx,e.y+dy,.6,'#ffd45e',24);this.shake=.15;
 }else{
  this.burst(e.x,e.y,1,'#dd91ff',25);
  for(let distance=2.5;distance>=.5;distance-=.5){const x=e.x+dx*distance,y=e.y+dy*distance,c=Math.floor(x),r=Math.floor(y);
   if(this.inside(c,r)&&this.walkableTerrain(c,r)&&!this.blocked(c,r,e)&&this.canSee(e,{x,y},3)&&!this.players.some(p=>p.alive&&Math.hypot(p.x-x,p.y-y)<.8)){e.x=x;e.y=y;break;}
  }
  e.royalFlight=1.5;e.z=1.2;this.addFloater(e.x,e.y,'Héhé… je triche !',{size:.25,color:'#ffdd65',life:1.8});
 }
};
const playerUpdate=W.updatePlayer;
W.updatePlayer=function(p,dt){
 if(p.royalPush&&p.alive&&!p.falling){const q=p.royalPush,step=Math.min(dt,q.left);for(let left=step;left>0;){const d=Math.min(left,.016);this.moveCircle(p,q.dx*7*d,q.dy*7*d,p);left-=d;}q.left-=dt;if(q.left<=0)p.royalPush=null;}
 else p.royalPush=null;
 return playerUpdate.call(this,p,dt);
};
const danger=BK.ai.allyArenaDanger;
BK.ai.allyArenaDanger=function(world){const out=new Float32Array(danger(world));for(const e of world.enemies){if(e.dead||e.warning?.kind!=='royalPush')continue;const a=Math.atan2(e.warning.y-e.y,e.warning.x-e.x),dx=Math.cos(a),dy=Math.sin(a);for(let r=0;r<world.rows;r++)for(let c=0;c<world.cols;c++){const x=c+.5-e.x,y=r+.5-e.y;if(x*dx+y*dy>=0&&x*dx+y*dy<5&&Math.abs(x*dy-y*dx)<1.7&&world.canSee(e,{x:c+.5,y:r+.5},6))out[world.idx(c,r)]=0;}}return out;};
const drawEnemy=BK.sprites.drawEnemy;
BK.sprites.drawEnemy=function(ctx,type,o={}){
 if(type!=='castle_matthieu')return drawEnemy.call(this,ctx,type,o);
 const s=(o.s||60)*1.15,def=BK.charById('matthieu'),H=s*(.8+.7*(def.size||1));
 ctx.save();ctx.fillStyle='#702ba4';ctx.strokeStyle='#412452';ctx.lineWidth=s*.035;ctx.beginPath();ctx.moveTo(-s*.25,-H*.7);ctx.lineTo(-s*.55,0);ctx.quadraticCurveTo(0,s*.13,s*.55,0);ctx.lineTo(s*.25,-H*.7);ctx.closePath();ctx.fill();ctx.stroke();
 BK.sprites.drawCharacter(ctx,def,{s,pose:o.warning?'win':'idle',t:o.t||0,view:'front'});
 ctx.translate(0,-H+Math.sin((o.t||0)*2.2)*H*.008);ctx.fillStyle='#ffcf35';ctx.strokeStyle='#966020';ctx.lineWidth=s*.025;ctx.beginPath();ctx.moveTo(-s*.29,s*.07);ctx.lineTo(-s*.34,-s*.22);ctx.lineTo(-s*.13,-s*.1);ctx.lineTo(0,-s*.3);ctx.lineTo(s*.13,-s*.1);ctx.lineTo(s*.34,-s*.22);ctx.lineTo(s*.29,s*.07);ctx.closePath();ctx.fill();ctx.stroke();
 for(const x of [-.19,0,.19]){ctx.fillStyle=x?'#4fdcff':'#ff476a';ctx.beginPath();ctx.arc(s*x,-s*.015,s*.04,0,Math.PI*2);ctx.fill();}ctx.restore();
};
const render=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 render.call(this,ctx,cam,time,push);
 if(!this.castleEncounter||this.castleEncounter.done)return;
 for(const e of this.enemies)if(!e.dead&&e.warning?.kind==='royalPush'){
  const a=Math.atan2(e.warning.y-e.y,e.warning.x-e.x);push(e.y+.01,e.x,()=>{ctx.save();ctx.fillStyle='rgba(255,190,65,.35)';ctx.strokeStyle='#ffe482';ctx.lineWidth=3;ctx.beginPath();for(const [along,side] of [[0,-1.2],[4.5,-1.2],[4.5,1.2],[0,1.2]]){const q=cam.project(e.x+Math.cos(a)*along-Math.sin(a)*side,e.y+Math.sin(a)*along+Math.cos(a)*side,.04);along===0&&side<0?ctx.moveTo(q.x,q.y):ctx.lineTo(q.x,q.y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});
 }
 // Une faille violette, des anneaux et des particules : la dimension reste animée.
 const fighting=this.castleEncounter.phase===0;
 push(10.55,14.5,()=>{
  const p=cam.project(14.5,10.5,.04);ctx.save();ctx.strokeStyle=fighting?'#ffbaff':'#af7de3';ctx.lineWidth=fighting?5:2;ctx.globalAlpha=fighting?.9:.45;
  for(let j=0;j<3;j++){
   ctx.beginPath();const radius=1.3+j*.5+Math.sin(time*2)*.08;
   for(let i=0;i<=48;i++){const a=i/48*Math.PI*2+time*.2,q=cam.project(14.5+Math.cos(a)*radius,10.5+Math.sin(a)*radius,.04);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.stroke();
  }
  for(let i=0;i<8;i++){const a=time*.8+i*Math.PI/4,q=cam.project(14.5+Math.cos(a)*2,10.5+Math.sin(a)*2,.5+Math.sin(time*2+i)*.4);ctx.fillStyle='#ecc6ff';ctx.beginPath();ctx.arc(q.x,q.y,3,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 });
};
})(window.BK);
