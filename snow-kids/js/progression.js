// Cumulative XP and unspent training points belong to one character profile.
(function(SK){
 'use strict';
 const P=SK.Progression={};
 P.info=save=>{let remaining=Math.max(0,Math.floor(Number(save.xp)||0)),level=1;
  while(remaining>=100+50*(level-1)){remaining-=100+50*(level-1);level++;}
  return {level,current:remaining,needed:100+50*(level-1),points:Math.max(0,Math.floor(Number(save.trainingPoints)||0))};
 };
 P.award=(save,amount)=>{amount=Math.max(0,Math.floor(Number(amount)||0));const before=P.info(save);
  save.xp=Math.max(0,Math.floor(Number(save.xp)||0))+amount;const after=P.info(save),points=(after.level-before.level)*2;
  save.trainingPoints=before.points+points;return {xp:amount,levels:after.level-before.level,level:after.level,points};
 };
 P.reward=({finished,practice,success,rank=0})=>!finished?0:practice?(success?60:0):40+Math.max(0,3-rank)*10;

 P.animateResult=(root,before,after,onLevel)=>{
  const bar=root.querySelector('.result-xp-bar'),heading=root.querySelector('.reward-progress-heading strong'),caption=root.querySelector('.reward-progress-caption'),panel=root.querySelector('.reward-progress');
  if(!bar||!heading||!caption)return;
  const screen=root.closest('.screen'),token={};root.xpAnimation=token;
  const initial=P.info({xp:before}),final=P.info({xp:after});let level=initial.level,current=initial.current,left=Math.max(0,after-before),started=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=(value,needed)=>{bar.max=needed;bar.value=value;bar.setAttribute('aria-label','Progression vers le niveau '+(level+1));heading.textContent='Niveau '+level;caption.innerHTML=Math.floor(value)+' / '+needed+' XP <span>Prochain niveau : '+(level+1)+'</span>';};
  const celebrate=()=>{panel.classList.add('level-pop');let msg=root.querySelector('.level-up-result');if(!msg){msg=document.createElement('div');msg.className='level-up-result';msg.setAttribute('role','status');panel.appendChild(msg);}msg.textContent='⭐ ↑ Niveau '+level+' ! +'+((level-initial.level)*2)+' points au gym';onLevel?.();};
  draw(current,100+50*(level-1));
  if(reduced){level=final.level;draw(final.current,final.needed);if(level>initial.level)celebrate();return;}
  const step=now=>{
   if(root.xpAnimation!==token||!root.isConnected||screen?.classList.contains('hidden'))return;
   if(started===null)started=now+250;
   const needed=100+50*(level-1),gain=Math.min(left,needed-current),u=Math.max(0,Math.min(1,(now-started)/1000));
   draw(current+gain*(1-Math.pow(1-u,3)),needed);
   if(u<1||now-started<1250){requestAnimationFrame(step);return;}
   left-=gain;current+=gain;
   if(current>=needed){level++;current=0;celebrate();draw(0,100+50*(level-1));}
   if(left>0){started=now;requestAnimationFrame(step);}
  };requestAnimationFrame(step);
 };
})(window.SK);
