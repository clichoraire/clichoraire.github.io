// Récompenses : même calcul pour la sauvegarde et pour la montée animée des barres.
(function(root){
  'use strict';
  const BX=root.BX,P=BX.progress={}; let active=[];P.MAX_LEVEL=99;P.POINTS_PER_LEVEL=3;
  P.plan=function(level,xp,amount){
    const fromLevel=level,fromXp=xp,segments=[];let remaining=Math.max(0,Math.round(amount)),credited=0;
    while(level<P.MAX_LEVEL&&remaining>0){
      const need=BX.gym.need(level),delta=Math.min(remaining,need-xp),up=xp+delta>=need;
      segments.push({level,from:xp,to:xp+delta,need,delta,up});remaining-=delta;credited+=delta;
      if(up){level++;xp=0;}else xp+=delta;
    }
    return{fromLevel,fromXp,toLevel:level,toXp:level>=P.MAX_LEVEL?0:xp,amount:credited,segments};
  };
  P.markup=function(rewards){return '<div class="reward-list">'+rewards.map(r=>{
    const st=BX.STATS.find(s=>s.id===r.stat)||{icon:'★',name:'Expérience générale'},max=r.fromLevel>=P.MAX_LEVEL,need=BX.gym.need(r.fromLevel);
    return '<div class="xp-reward" data-stat="'+r.stat+'"><div class="reward-heading"><b>'+st.icon+' '+st.name+'</b><span class="reward-level">NIV. '+r.fromLevel+'</span><strong class="reward-earned">+0 XP</strong></div><div class="reward-track"><i style="width:'+(max?100:r.fromXp/need*100)+'%"></i><em>'+(max?'MAXIMUM':r.fromXp+' / '+need+' XP')+'</em></div><div class="reward-levelup" aria-live="polite"></div></div>';
  }).join('')+'</div>';};
  P.mount=function(container,rewards){
    const now=performance.now();
    for(const [i,r] of rewards.entries()){
      const el=container.querySelector('.xp-reward[data-stat="'+r.stat+'"]');if(el){el.classList.add('result-step');el.style.setProperty('--reveal-delay',(.5+i*.3)+'s');}if(el)active.push({el,r,start:now+650+i*300,announced:new Set()});
    }
  };
  P.reveal=function(container){
    const box=container.querySelector('.res-box');if(!box)return;
    [...box.children].forEach((el,i)=>{el.classList.add('result-step');el.style.setProperty('--reveal-delay',i*.14+'s');});
  };
  P.update=function(now){
    active=active.filter(a=>{
      if(!a.el.isConnected||a.el.closest('.screen.hidden, #gym-res.hidden'))return false;
      const {r,el}=a,elapsed=(now-a.start)/1000;if(elapsed<0)return true;
      let at=0,earned=0,current=null,level=r.fromLevel,value=r.fromXp,need=BX.gym.need(level);
      for(const [i,seg] of r.segments.entries()){
        const duration=.85,hold=seg.up?.45:0;
        if(elapsed>=at+duration&&seg.up&&!a.announced.has(i)){
          a.announced.add(i);el.querySelector('.reward-levelup').textContent='★ NIVEAU '+(seg.level+1)+' · +'+P.POINTS_PER_LEVEL+' POINTS ! ★';
          el.classList.remove('level-up');void el.offsetWidth;el.classList.add('level-up');BX.audio.play('star');
        }
        if(elapsed<at+duration+hold){
          const t=BX.art.eout(Math.min(1,(elapsed-at)/duration));level=seg.up&&t===1?seg.level+1:seg.level;value=seg.from+(seg.to-seg.from)*t;need=seg.need;earned+=seg.delta*t;current=seg;break;
        }
        earned+=seg.delta;at+=duration+hold;
      }
      const done=!current;if(done){level=r.toLevel;value=r.toXp;need=BX.gym.need(level);earned=r.amount;}
      const max=level>=P.MAX_LEVEL;
      el.querySelector('.reward-level').textContent='NIV. '+level;
      el.querySelector('.reward-earned').textContent='+'+Math.round(earned)+' XP';
      el.querySelector('.reward-track i').style.width=(max?100:Math.min(100,value/need*100))+'%';
      el.querySelector('.reward-track em').textContent=max?'MAXIMUM':Math.round(value)+' / '+need+' XP';
      return !done;
    });
  };
})(window);
