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
 P.reward=({finished,practice,success,first=false,rank=0})=>!finished?0:practice?(success?(first?120:60):0):40+Math.max(0,3-rank)*10;

 P.animateResult=(root,before,after,onLevel)=>{
  const bar=root.querySelector('.result-xp-bar'),heading=root.querySelector('.reward-progress-heading strong'),caption=root.querySelector('.reward-progress-caption'),panel=root.querySelector('.reward-progress');
  if(!bar||!heading||!caption)return;
  const screen=root.closest('.screen'),token={};root.xpAnimation=token;
  const initial=P.info({xp:before}),final=P.info({xp:after});let level=initial.level,current=initial.current,left=Math.max(0,after-before),started=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gold=root.querySelector('.reward-gold-number'),goldTarget=Math.max(0,Number(gold?.dataset.gold)||0);let goldStart=null;
  if(gold){gold.textContent=reduced?SK.fmtGold(goldTarget,false):'0';if(!reduced){const count=now=>{if(root.xpAnimation!==token||!root.isConnected||screen?.classList.contains('hidden'))return;if(goldStart===null)goldStart=now+200;const u=Math.max(0,Math.min(1,(now-goldStart)/2400));gold.textContent=SK.fmtGold(Math.floor(goldTarget*(1-Math.pow(1-u,2))),false);if(u<1)requestAnimationFrame(count);};requestAnimationFrame(count);}}
  const draw=(value,needed)=>{bar.max=needed;bar.value=value;bar.setAttribute('aria-label','Progression vers le niveau '+(level+1));heading.textContent='Niveau '+level;caption.innerHTML=Math.floor(value)+' / '+needed+' XP <span>Prochain niveau : '+(level+1)+'</span>';};
  const celebrate=()=>{
   panel.classList.add('level-pop');root.querySelector('.level-up-celebration')?.remove();
   const burst=document.createElement('div');burst.className='level-up-celebration';burst.setAttribute('role','status');burst.setAttribute('aria-label','Nouveau niveau : '+level);
   burst.innerHTML='<div class="level-up-rays" aria-hidden="true"></div><div class="level-up-ribbon" aria-hidden="true">NOUVEAU NIVEAU</div><div class="level-up-medallion" aria-hidden="true"><span>★</span><strong>'+level+'</strong></div>';
   const colors=['#ffda4a','#58d9ef','#fc7c95','#a9eb80','#c2a1ff'];
   for(let i=0;i<28;i++){const bit=document.createElement('i');bit.className='level-up-confetti';bit.setAttribute('aria-hidden','true');const a=i*2.39996;bit.style.setProperty('--x',Math.cos(a)*(85+i%5*19)+'px');bit.style.setProperty('--y',Math.sin(a)*(75+i%4*22)+'px');bit.style.setProperty('--r',(i%2?-1:1)*(180+i*17)+'deg');bit.style.background=colors[i%colors.length];burst.append(bit);}
   root.append(burst);setTimeout(()=>burst.remove(),reduced?2200:3100);onLevel?.();
  };

  draw(current,100+50*(level-1));
  if(reduced){level=final.level;draw(final.current,final.needed);if(level>initial.level)celebrate();return;}
  const step=now=>{
   if(root.xpAnimation!==token||!root.isConnected||screen?.classList.contains('hidden'))return;
   if(started===null)started=now+250;
   const needed=100+50*(level-1),gain=Math.min(left,needed-current),duration=left<=needed-current?2800:1400,u=Math.max(0,Math.min(1,(now-started)/duration));
   draw(current+gain*(1-Math.pow(1-u,2)),needed);
   if(u<1||now-started<duration+250){requestAnimationFrame(step);return;}
   left-=gain;current+=gain;
   if(current>=needed){level++;current=0;celebrate();draw(0,100+50*(level-1));}
   if(left>0){started=now;requestAnimationFrame(step);}
  };requestAnimationFrame(step);
 };
})(window.SK);
