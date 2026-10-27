// Possession, passes éclair, tir parfait et adversaires géants.
(function(BC){
'use strict';
BC.POSSESSION_LIMIT=10;BC.POSSESSION_PENALTY=5;BC.QUICK_WINDOW=1;BC.PERFECT_WINDOW=.18;
const P=BC.Game.prototype;
P.enemyJumpLanding=function(p){if(p.jumpTrespass&&this.ball.holder===p){const next=this.aliveInner(1-p.team)[0];if(next){p.pending=null;p.charging=false;p.charge=0;next.pending=null;next.charging=false;this.setState(next,'idle');this.give(next);Object.assign(this.ball,{x:next.x,y:next.y,z:BC.CHEST});this.say('SAUT SANS LANCER !',1.2,'Ballon à l’adversaire');}}p.jumpTrespass=false;};
P.updateBossRain=function(dt){this.anvils=this.anvils||[];for(const q of this.players)q.anvilGrace=Math.max(0,(q.anvilGrace||0)-dt);for(const a of this.anvils){a.t+=dt;if(a.t>=2.2&&!a.hit){a.hit=true;if(a.from.alive){this.fx.push({kind:'explosion',x:a.x,y:a.y,z:0,r:36,t:0,dur:.35});this.shake=5;for(const q of this.aliveInner(1-a.from.team))if(Math.hypot(q.x-a.x,q.y-a.y)<32&&!q.anvilGrace&&!['hit','down','getup'].includes(q.state)){this.hurt(q,8,{from:a.from,power:'anvil',knock:100});q.anvilGrace=3;}}}}this.anvils=this.anvils.filter(a=>a.t<2.55&&a.from.alive);
 for(const boss of this.players.filter(p=>p.def.boss&&p.alive)){boss.rainClock=(boss.rainClock||0)+dt;if(boss.rainClock>=14&&!boss.rainLeft){boss.rainClock=0;boss.rainLeft=10;boss.rainSpawn=0;this.say('PLUIE D’ENCLUMES !',1.3,'Évite les marques au sol !');}if(boss.rainLeft>0){boss.rainLeft=Math.max(0,boss.rainLeft-dt);boss.rainSpawn-=dt;if(boss.rainSpawn<=0){boss.rainSpawn=1.1;const foes=this.aliveInner(1-boss.team).filter(q=>!q.anvilGrace&&!['hit','down','getup'].includes(q.state)),q=foes[(boss.rainIndex||0)%foes.length];boss.rainIndex=(boss.rainIndex||0)+1;if(q)this.anvils.push({from:boss,x:q.x,y:q.y,t:0,hit:false});}}}
};
P.resetChain=function(){this.ball.combo=0;this.ball.perfect=false;this.ball.receivedAt=-Infinity;};
P.quickLevel=function(p){return this.ball.holder===p&&this.time-this.ball.receivedAt<=BC.QUICK_WINDOW?this.ball.combo||0:0;};
const give=P.give;P.give=function(p){const b=this.ball,samePass=b.state==='pass'&&b.team===p.team&&b.target===p;const chain=samePass?b.combo||0:0;
 if(!samePass)this.resetChain();
 if(!this.possession||this.possession.team!==p.team)this.possession={team:p.team,left:BC.POSSESSION_LIMIT};
 for(const q of this.players)q.hasBall=false;give.call(this,p);b.combo=chain;b.receivedAt=this.time;b.perfect=false;b.trail=[];
 p.ai.hold=null;p.ai.target=null;
};
P.possessionFault=function(){const t=this.possession.team,b=this.ball;
 for(const p of this.players){p.hasBall=false;if(p.team===t){p.pending=null;p.charging=false;p.charge=0;if(p.state==='windup'||p.state==='spin')this.setState(p,'idle');}}
 b.holder=null;b.state='dead';b.power=null;b.combo=0;b.perfect=false;b.quickReturn=false;b.trail=[];b.vx=b.vy=b.vz=0;
 this.stats[t].penalties=(this.stats[t].penalties||0)+1;
 for(const p of this.aliveInner(t))this.hurt(p,5,{penalty:true,knock:1,text:'POSSESSION'});
 this.checkEnd();this.possession=null;
 if(this.phase!=='end'){const next=this.aliveInner(1-t).sort((a,c)=>Math.abs(a.y-450)-Math.abs(c.y-450))[0];if(next){next.pending=null;next.charging=false;next.charge=0;this.setState(next,'idle');this.give(next);b.x=next.x;b.y=next.y;b.z=BC.CHEST;}}
 this.emit('whistle');this.say('10 SECONDES !',1.5,'Ballon adverse · −5 PV par joueur');
};
const update=P.update;P.update=function(dt,inputs){
 if(this.phase==='play'){
  const b=this.ball;this.updateBossRain(dt);
  if(this.possession){this.possession.left=Math.max(0,this.possession.left-dt);if(this.possession.left<=0)this.possessionFault();}
  if(b.state==='held'&&this.time-b.receivedAt>1)b.combo=0;
  for(const p of this.players)if(p.def.boss&&p.alive){
   p.bossClock=(p.bossClock||0)+dt;
   if(p.bossClock>8){p.bossClock=0;this.say('ONDE DU BOSS !',.8,'Écarte-toi ou saute !');const x=p.x,y=p.y;this.later(.8,()=>{if(!p.alive||this.phase!=='play')return;this.fx.push({kind:'explosion',x,y,z:0,r:220,t:0,dur:.55});this.shake=12;for(const q of this.opponentsOf(p))if(q.z<20&&Math.hypot(q.x-x,q.y-y)<320)this.hurt(q,7,{from:p,power:'bossquake',knock:140});});}

  }
  // Un boss n'a aucun récupérateur extérieur : remise neutre de toute sortie bloquée.
  const outside=b.x<BC.COURT.left||b.x>BC.COURT.right||b.y<BC.COURT.top||b.y>BC.COURT.bottom;
  if(this.teams.some(t=>t.boss)&&b.state==='dead'&&outside){this.looseOutside=(this.looseOutside||0)+dt;if(this.looseOutside>1.5){const side=this.sideOf(b.x),next=this.aliveInner(side)[0];if(next)this.give(next);this.looseOutside=0;}}else this.looseOutside=0;
 }
 update.call(this,dt,inputs);
};
const pass=P.pass;P.pass=function(p,move){if(this.ball.holder!==p)return;const b=this.ball,old=this.quickLevel(p);const previousTimer=this.possession;pass.call(this,p,move);if(b.state!=='pass')return;p.jumpTrespass=false;
 const eligible=b.target.zone==='out'||this.sideOf(b.target.x)!==p.team;b.combo=eligible?Math.min(3,old+1):0;b.perfect=false;b.trail=[];
 if(b.combo){const mult=1+.23*b.combo,T=Math.hypot(b.landX-b.x,b.landY-b.y)/Math.max(1,Math.hypot(b.vx,b.vy))/mult;b.vx*=mult;b.vy*=mult;b.vz=(BC.CHEST-b.z)/T+.5*b.g*T;this.fx.push({kind:'pow',x:p.x,y:p.y,z:p.z+65,text:'PASSE ÉCLAIR ×'+b.combo,color:['','#5fe3ff','#c59aff','#ffb347'][b.combo],t:0,dur:.65});}
 // Les humains gardent la main : ils peuvent passer encore ou tirer immédiatement.
 if(this.isPlayerControlled(p))b.quickReturn=false;this.possession=previousTimer;
};
const start=P.startCharge;P.startCharge=function(p,move,goal){start.call(this,p,move,goal);p.fullAt=null;};
const step=P.stepPlayer;P.stepPlayer=function(p,dt,move,act){
 if(p.airborneJump&&this.sideOf(p.x)!==p.team&&this.ball.holder===p)p.jumpTrespass=true;
 if(p.zone==='in'&&p.alive&&p.z<=0&&!p.tele&&p.state!=='return'&&this.sideOf(p.x)!==p.team){const before=p.enemyGroundTime||0;p.enemyGroundTime=before+dt;if(p.enemyGroundTime>=2&&Math.floor(p.enemyGroundTime-2)>Math.floor(Math.max(-1,before-2)))this.hurt(p,2,{penalty:true,dot:true,power:'territory'});}else p.enemyGroundTime=0;
 if(p.charging&&p.charge<1&&p.charge+dt/.9>=1)p.fullAt=this.time;step.call(this,p,dt,move,act);};
const release=P.release;P.release=function(p){p.perfectRelease=!!p.charging&&p.charge>=1&&p.fullAt!=null&&this.time-p.fullAt<=BC.PERFECT_WINDOW;release.call(this,p);p.perfectRelease=false;};
const shoot=P.throwBall;P.throwBall=function(p,o){if(this.ball.holder!==p)return;const chain=this.quickLevel(p),perfect=!!p.perfectRelease;
 if(p.def.boss){const kit=p.def.bossPowers;p.bossShot=(p.bossShot||0);p.power.id=kit[p.bossShot++%kit.length];p.power.kind='throw';p.power.charge=p.power.max;p.power.armed=true;}
 shoot.call(this,p,o);const b=this.ball;if(b.state!=='live')return;
 p.jumpTrespass=false;this.possession=null;b.combo=chain;b.perfect=perfect;
 const mul=(1+.22*chain)*(perfect?1.5:1);b.speed*=mul;b.vx*=mul;b.vy*=mul;
 if(chain||perfect){b.dmg+=chain+(perfect?3:0);this.say(perfect?'LANCER PARFAIT !':'SHOOT ÉCLAIR ×'+chain,.75);this.emit('throwSuper',{p});}
};
P.trackIncomingPossession=function(){const b=this.ball,C=BC.COURT;if(!this.possession&&['live','dead'].includes(b.state)&&b.thrower&&b.team>=0&&this.sideOf(b.x)!==b.team&&b.x>=C.left&&b.x<=C.right&&b.y>=C.top&&b.y<=C.bottom)this.possession={team:1-b.team,left:BC.POSSESSION_LIMIT};};
const ball=P.updateBall;P.updateBall=function(dt){const b=this.ball;
 if(b.state==='live'){const count=Math.max(1,Math.min(20,Math.ceil(Math.hypot(b.vx,b.vy)*dt/16)));for(let i=0;i<count;i++){this.trackIncomingPossession();ball.call(this,dt/count);this.trackIncomingPossession();}}else {this.trackIncomingPossession();ball.call(this,dt);this.trackIncomingPossession();}
 if((b.combo||b.perfect)&&['live','pass'].includes(b.state)){b.trail.push({x:b.x,y:b.y,z:b.z});if(b.trail.length>16)b.trail.shift();}
 if(b.state==='dead'){b.combo=0;b.perfect=false;}
};
})(window.BC);
