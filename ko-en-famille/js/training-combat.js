// Les ateliers gardent leurs objectifs ; seul le moteur du match pilote le boxeur.
(function(root){
'use strict';
const B=root.BX,G=B.gym,F=B.fight,A=B.art;
const uses=s=>s.mode!=='sparring'&&(s.work?['cibles','paos','tennis','mannequin'].includes(s.mode):['force','vitesse','souffle'].includes(s.stat));
const old={start:G.start,keydown:G.keydown,keyup:G.keyup,clear:G.clearKeys,render:G.render};
G.start=function(...args){old.start(...args);const s=G.state();if(!uses(s))return;
 s.combat=F.practice.create({ch:s.ch,stats:s.stats,mods:s.mods,combos:s.combos,boxer:B.boxerById('coach'),canCounter:()=>true,trainingTarget:hit=>{
   const before=s.successes,score=s.score,xp=s.xpf,misses=s.misses,bagV=s.bagV,ballState=s.ball?.st,poireState=s.pb?.st,armed=s.pu?.armed;s.upHeld=hit.high;
   G.trainingAction(s,hit.upper?'upper':hit.side==='L'?'pL':'pR');
   const success=s.misses===misses&&(s.successes>before||s.score>score||s.xpf>xp||s.pb?.st==='spin'&&poireState!=='reset'||s.ball?.st==='out'&&ballState!=='out'||s.pu?.armed&&!armed);
   if(s.stat==='force'&&Number.isFinite(bagV)){s.bagV=bagV+(s.bagV-bagV)*Math.max(.6,Math.min(2,hit.damage/4));}
   // Les cibles réussies servent d’occasions d’étoile pour pratiquer l’uppercut.
   const star=success&&++s.trainingHits%4===0;
   s.lastTrainingHit={...hit,success};if(success&&!hit.high&&!hit.upper){const target=s.mode==='cibles'?{x:hit.side==='L'?310:970,y:hit.zone==='low'?595:415}:{x:640,y:s.mode==='mannequin'?467:hit.zone==='low'?405:350};s.trainingBodyHit={...target,at:s.t,power:hit.power};}sync(s);return {success,star};
 }});s.trainingHits=0;s.combat.msgs=[];sync(s);
};
function sync(s){
 const f=s.combat,p=f.p,d=F.practice.defense(f);s.guard=d==='block';s.upHeld=!!f.practiceKeys.up;
 s.pose=p.st==='punch'?(p.side==='L'?'pL':'pR'):p.st==='dodge'?(p.dir<0?'dodgeL':'dodgeR'):p.st;s.poseT=p.t;
 s.dodgeDir=d==='L'?-1:d==='R'?1:d==='duck'?'duck':null;s.dodgeT=d?0:99;
 if(s.work){s.work.held={...f.practiceKeys};s.work.dodge=d==='L'?'left':d==='R'?'right':d==='duck'?'down':d==='block'?'guard':null;s.work.dodgeAt=d?s.work.clock:-99;}
 const message=f.msgs.at(-1);if(message&&s.lastCombatMessage!==message){s.lastCombatMessage=message;s.msgs.push({...message,t:0,size:Math.min(32,message.size||30)});}
}
G.keydown=function(e){const s=G.state();if(!s?.combat||s.phase!=='go')return old.keydown(e);
 const p=s.combat.p,st=p.st,t=p.t;F.practice.key(s.combat,e,true);sync(s);
 if((p.st==='dodge'||p.st==='duck')&&(p.st!==st||p.t<t)){
   s.moved=true;s.dodged=s.t;
   if(s.mode==='poire'&&p.st==='dodge')G.trainingAction(s,p.dir<0?'left':'right');
 }
 return !!B.BOXING_KEYS[e.code];
};
G.keyup=function(e){const s=G.state();if(!s?.combat)return old.keyup(e);F.practice.key(s.combat,e,false);sync(s);};
G.clearKeys=function(){old.clear();const s=G.state();if(s?.combat){F.practice.clear(s.combat);sync(s);}};
G.combatStep=function(s,dt){F.practice.step(s.combat,dt);sync(s);};
G.combatAttack=function(s,avoid,dmg=8){const ok=F.practice.attack(s.combat,{pose:'jab',from:'L',high:true,dmg,avoid});sync(s);if(s.combat.p.hp<=0){s.work?s.work.failed=true:s.trainingKO=true;G.finish();}return ok;};
G.combatPose=function(s){const p=s.combat.p;return {...p,st:s.mode==='cibles'&&p.st==='block'?'idle':p.st,t:p.st==='upper'?p.t:p.t/Math.max(.01,p.dur),element:p.comboVisual,time:s.t};};
G.render=function(c,q){old.render(c,q);const s=G.state();if(!s?.combat)return;const p=s.combat.p;
 if(s.trainingBodyHit)F.drawBodyImpact(c,s.trainingBodyHit,s.t);
 G.drawTrainingVitals(c,s.mode==='mannequin'?{...p,hp:s.work.lives,maxHp:s.work.maxLives}:p,{health:s.mode==='mannequin'||['tennis','libre','elastique','punching'].includes(s.mode)||!s.work&&(s.stat==='souffle'||s.stat==='force'&&s.features>=8),stamina:true});
};
})(window);
