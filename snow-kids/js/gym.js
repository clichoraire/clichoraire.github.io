// Hidden photo reward and the village training cabin.
(function(SK){
 'use strict';
 SK.PhotoGold={
  claim(save,now=Date.now(),random=Math.random){
   if(save.photoGoldAt!=null&&now-save.photoGoldAt<15*60*1000)return 0;
   const amount=20+Math.floor(random()*31);save.photoGoldAt=now;save.gold+=amount;return amount;
  },
  show(frame,amount){
   const box=frame.getBoundingClientRect(),layer=document.createElement('div');layer.className='photo-gold-rain';
   for(let i=0;i<22;i++){const coin=document.createElement('img');coin.src=SK.COIN_SVG;coin.alt='';coin.style.cssText=`left:${box.left+box.width/2}px;top:${box.top+box.height/2}px;--dx:${(Math.random()-.5)*360}px;--dy:${180+Math.random()*240}px;animation-delay:${i*.025}s`;layer.append(coin);}
   const label=document.createElement('strong');label.textContent=`+ ${amount} pièces d’or`;layer.append(label);document.body.append(layer);setTimeout(()=>layer.remove(),3500);
  }
 };
 const G=SK.Gym={};let raf=0,key=null;
 G.close=()=>{cancelAnimationFrame(raf);if(key)window.removeEventListener('keydown',key);key=null;};
 G.walkOffer=save=>({stat:'walk',name:'Marche en ville +1',level:save.walkLevel||0,price:1,action:(save.walkLevel||0)>=5?'max':'buy',max:5});
 G.powerOffers=save=>['shot','item'].map(stat=>{const level=save.powerLevels?.[stat]||0,wins=Object.values(save.cups||{}).filter(x=>x.won).length,required=[1,4,8][level];return {stat,name:stat==='shot'?'Puissance des tirs':'Durée des objets',level,max:3,price:level+1,action:level>=3?'max':wins<required?'locked':'buy',lock:level<3&&wins<required?required+' tournois gagnés requis':null};});
 G.statOffers=save=>SK.Shop.trainingOffers(save).map(o=>({...o,price:o.level+1}));
 G.train=(save,stat)=>{
  if(['shot','item'].includes(stat)){const o=G.powerOffers(save).find(o=>o.stat===stat);if(o.action!=='buy'||(save.trainingPoints||0)<o.price)return false;save.trainingPoints-=o.price;(save.powerLevels||(save.powerLevels={}))[stat]=o.level+1;return true;}

  if(stat==='walk'){const it=G.walkOffer(save);if(it.action!=='buy'||(save.trainingPoints||0)<it.price)return false;save.trainingPoints-=it.price;save.walkLevel=it.level+1;return true;}
  const offer=G.statOffers(save).find(x=>x.stat===stat);
  if(!offer||offer.action!=='buy'||(save.trainingPoints||0)<offer.price)return false;
  save.trainingPoints-=offer.price;save.upgrades[offer.boardId][stat]=offer.level+1;return true;
 };
 G.open=({save,store,onBack})=>{
  G.close();const canvas=document.getElementById('gym-scene'),c=canvas.getContext('2d'),panel=document.getElementById('gym-training'),talk=document.getElementById('gym-talk');
  panel.hidden=true;talk.hidden=false;talk.textContent='Parler à Jessica';
  const refresh=()=>{const progress=SK.Progression.info(save);document.getElementById('gym-gold').textContent='Niveau '+progress.level+' · '+progress.current+' / '+progress.needed+' XP · '+progress.points+' points';
   panel.innerHTML='<button class="gym-close" aria-label="Fermer">✕</button><h2>Jessica · On s’entraîne ?</h2><p>Chaque niveau gagné rapporte 2 points. Choisis ce que tu veux améliorer avec ta planche <b>'+SK.boardById(save.advBoard).name+'</b>.</p>';
   for(const offer of [...G.statOffers(save),G.walkOffer(save),...G.powerOffers(save)]){
    const row=document.createElement('button');row.className='gym-training-row';row.disabled=offer.action!=='buy'||(save.trainingPoints||0)<offer.price;
    const ch=SK.charById(save.advChar||save.char),board=SK.effectiveBoard(save.advBoard,save);
    const current=offer.stat==='walk'?Math.round(100*(1+.15*offer.level)):(ch[offer.stat]||0)+(board[offer.stat]||0);
    const next=offer.action==='max'?current:current+(offer.stat==='walk'?15:1);
    const preview=['shot','item'].includes(offer.stat)?'+'+(offer.level*10)+' % → +'+(Math.min(3,offer.level+1)*10)+' %':offer.stat==='walk'?current+' % → '+next+' % en ville':current+' → '+next+' '+(next>8?'(au-delà de 8)':'');
    row.innerHTML=`<span class="stat-icon stat-${offer.stat}"><svg viewBox="0 0 32 34">${SK.STAT_ICONS[offer.stat]||SK.STAT_ICONS.speed}</svg></span><span><b>${offer.name.split(' · ')[0]}</b><small>Niveau ${offer.level} / ${offer.max||SK.UPGRADE_MAX}</small><span class="gym-stat-preview">${preview}</span></span><strong>${offer.lock|| (offer.action==='max'?'Maximum':offer.price+' point'+(offer.price>1?'s':''))}</strong>`;
    row.onclick=()=>{if(G.train(save,offer.stat)){store();SK.Audio.sfx('buy');refresh();}};panel.append(row);
   }
   const note=document.createElement('p');note.className='gym-note';note.textContent='La marche améliore uniquement ta vitesse dans le village (5 niveaux). Les tirs renforcent leurs effets et les objets durent plus longtemps (+10 % par niveau, maximum 3). Les autres séances améliorent cette planche.';panel.append(note);
   panel.querySelector('.gym-close').onclick=()=>{panel.hidden=true;talk.hidden=false;talk.focus();};
  };
  const speak=()=>{refresh();panel.hidden=false;talk.hidden=true;panel.querySelector('.gym-close').focus();SK.Audio.sfx('click');};
  talk.onclick=speak;document.getElementById('gym-back').onclick=onBack;
  key=e=>{if(e.code==='Escape'){if(!panel.hidden){panel.hidden=true;talk.hidden=false;}else onBack();}else if(e.code==='Enter'&&e.target===document.body){e.preventDefault();speak();}};window.addEventListener('keydown',key);
  refresh();
  const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const line=(pts,width,color)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const weight=(x,y)=>{line([[x-27,y],[x+27,y]],7,'#92a5b1');for(const dx of [-23,23]){c.fillStyle='#293c4e';c.fillRect(x+dx-6,y-14,12,28);}};
  function draw(ms){raf=requestAnimationFrame(draw);const t=ms/1000;
   c.fillStyle='#9b7853';c.fillRect(0,0,1280,720);
   for(let y=0;y<480;y+=46){c.fillStyle=y%92?'#a68a68':'#af9370';c.fillRect(0,y,1280,43);}
   c.fillStyle='#49392e';for(const x of [15,440,850,1240])c.fillRect(x,0,24,490);c.fillRect(0,40,1280,22);
   c.fillStyle='#b5cad1';c.fillRect(68,135,730,280);c.strokeStyle='#e3e8df';c.lineWidth=12;c.strokeRect(68,135,730,280);
   c.fillStyle='#eaf6f866';c.beginPath();c.moveTo(120,140);c.lineTo(210,140);c.lineTo(550,410);c.lineTo(460,410);c.fill();
   c.fillStyle='#355751';c.fillRect(430,66,420,62);c.fillStyle='#fff0c0';c.textAlign='center';c.font='900 36px Arial';c.fillText('GYM DES SOMMETS',640,108);
   c.fillStyle='#58636a';c.fillRect(0,480,1280,240);c.strokeStyle='#6d7a81';c.lineWidth=2;for(let x=0;x<1280;x+=100){c.beginPath();c.moveTo(x,480);c.lineTo(x-100,720);c.stroke();}for(let y=480;y<720;y+=60){c.beginPath();c.moveTo(0,y);c.lineTo(1280,y);c.stroke();}
   // The family trains with their shared portraits: weights, squats and cycling.
   const trainees=[['matthieu','Matthieu'],['jeremie','Jérémie'],['josue','Josué']];
   for(let i=0;i<3;i++){
    const x=200+i*235,bend=(Math.sin(t*(i+2))+1)*9,y=350+(i===1?bend:0);
    c.fillStyle=['#446c93','#826099','#3d837b'][i];c.fillRect(x-65,464,130,12);
    oval(x,460,48,9,'#243b4655');line([[x-10,y+35],[x-22-bend*.3,y+70],[x-25,454]],16,'#293c56');line([[x+10,y+35],[x+22+bend*.3,y+70],[x+28,454]],16,'#293c56');
    line([[x-25,455],[x-10,455]],13,'#1e2b39');line([[x+26,455],[x+40,455]],13,'#1e2b39');
    line([[x,y-16],[x,y+36]],48,['#d46c44','#7b60a3','#268d81'][i]);
    const handY=i===0?y-35+Math.sin(t*2)*25:y+25;
    line([[x-20,y-8],[x-43,y+14],[x-48,handY]],13,'#edc2a0');line([[x+20,y-8],[x+43,y+14],[x+48,handY]],13,'#edc2a0');
    window.FamilyHeads?.draw(c,trainees[i][0],'front',x-44,y-111,88,82);
    c.font='bold 16px Arial';c.fillStyle='#263e50';c.fillText(trainees[i][1],x,y-122);
    if(i===0){weight(x-48,handY);weight(x+48,handY);}if(i===2){oval(x-42,447,25,25,'#273842');oval(x+44,447,25,25,'#273842');line([[x-42,447],[x,407],[x+44,447],[x-42,447]],5,'#aec4ca');line([[x+44,447],[x+49,374],[x+34,374]],6,'#aabfc4');}
   }
   // Jessica at a human-sized desk, using the same portrait as in the village.
   c.save();c.translate(1035,480);c.scale(.78,.78);c.translate(-1035,-480);
   c.fillStyle='#a64f77';c.beginPath();c.roundRect(985,325,92,115,24);c.fill();
   line([[996,346],[968,375],[944,356+Math.sin(t*2)*4]],16,'#a64f77');
   oval(941,352+Math.sin(t*2)*4,9,11,'#f2c5a0');
   line([[1066,346],[1080,416]],16,'#a64f77');oval(1080,416,9,11,'#f2c5a0');
   window.FamilyHeads?.draw(c,'jessica','front',985,239,92,99);
   c.fillStyle='#574032';c.fillRect(867,431,335,170);c.fillStyle='#c39a65';c.fillRect(850,420,370,22);
   c.fillStyle='#816248';c.fillRect(890,460,290,115);c.fillStyle='#f3dfad';c.fillRect(931,477,208,64);
   c.fillStyle='#42594f';c.font='bold 24px Arial';c.fillText('JESSICA',1035,504);c.font='bold 15px Arial';c.fillText('COACH',1035,526);
   c.restore();
   const player=SK.fakeRacer(save.advChar||save.char,save.advBoard,'ride',SK.lookOf(SK.charById(save.advChar||save.char),save));SK.Render.drawWalker(c,player,780,640,64,t,'down',false);
  }
  raf=requestAnimationFrame(draw);
 };
})(window.SK);
