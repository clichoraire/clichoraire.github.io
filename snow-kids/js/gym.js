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
 G.strengthOffer=save=>({stat:'strength',name:'Force',level:save.strengthLevel||0,max:5,price:1+(save.strengthLevel||0),action:(save.strengthLevel||0)>=5?'max':'buy'});
 G.train=(save,stat)=>{
  if(stat==='strength'){const o=G.strengthOffer(save);if(o.action!=='buy'||(save.trainingPoints||0)<o.price)return false;save.trainingPoints-=o.price;save.strengthLevel=o.level+1;return true;}
  if(['shot','item'].includes(stat)){const o=G.powerOffers(save).find(o=>o.stat===stat);if(o.action!=='buy'||(save.trainingPoints||0)<o.price)return false;save.trainingPoints-=o.price;(save.powerLevels||(save.powerLevels={}))[stat]=o.level+1;return true;}

  if(stat==='walk'){const it=G.walkOffer(save);if(it.action!=='buy'||(save.trainingPoints||0)<it.price)return false;save.trainingPoints-=it.price;save.walkLevel=it.level+1;return true;}
  const offer=G.statOffers(save).find(x=>x.stat===stat);
  if(!offer||offer.action!=='buy'||(save.trainingPoints||0)<offer.price)return false;
  save.trainingPoints-=offer.price;save.upgrades[offer.boardId][stat]=offer.level+1;return true;
 };
 G.stats=save=>{
  const ch=SK.charById(save.advChar||save.char),board=SK.effectiveBoard(save.advBoard,save),gear=new Set(save.gear||[]),crown=gear.has('couronne')?1:0;
  return {speed:ch.speed+board.speed+crown,corner:ch.corner+board.corner+crown+(gear.has('bottes')?1:0),acceleration:ch.acceleration+board.acceleration+crown,jump:ch.jump+board.jump+crown+(gear.has('ressort')?1:0),strength:ch.strength+(save.strengthLevel||0),walk:save.walkLevel||0,shot:save.powerLevels?.shot||0,item:save.powerLevels?.item||0};
 };
 G.open=({save,store,onBack})=>{
  G.close();const canvas=document.getElementById('gym-scene'),c=canvas.getContext('2d'),panel=document.getElementById('gym-training'),talk=document.getElementById('gym-talk');
  const screen=document.getElementById('screen-gym'),statsBox=document.getElementById('gym-gold');
  panel.hidden=true;talk.hidden=false;talk.textContent='Parler à Jessica';screen.classList.remove('gym-choosing');
  const renderStats=(selected=null,confirmed=false)=>{
   const info=SK.Progression.info(save),values=G.stats(save),ch=SK.charById(save.advChar||save.char);
   statsBox.innerHTML='<strong class="gym-player-name">'+ch.name+'</strong><div class="gym-progress">Niveau '+info.level+' · '+info.current+' / '+info.needed+' XP<br>⭐ '+info.points+' point'+(info.points===1?'':'s')+' disponible'+(info.points===1?'':'s')+'</div><div class="gym-board-name">Planche '+SK.boardById(save.advBoard).name+'</div>';
   for(const [key,label] of [['speed','Vitesse'],['corner','Virage'],['acceleration','Accélération'],['jump','Saut'],['strength','Force'],['walk','Marche'],['shot','Tirs'],['item','Objets']]){
    const value=values[key],active=selected===key,next=value+(active&&!confirmed?1:0),max=['shot','item'].includes(key)?3:key==='walk'?5:Math.max(8,next);
    const fmt=n=>key==='walk'?(100+n*15)+' %':['shot','item'].includes(key)?'+'+n*10+' %':n;
    const row=document.createElement('div');row.className='gym-overview-row'+(active?' previewing':'');
    row.innerHTML='<span>'+label+'</span><div class="gym-meter" aria-label="'+label+' : '+fmt(value)+(active&&!confirmed?' vers '+fmt(next):'')+'">'+Array.from({length:max},(_,i)=>'<i class="'+(i<value?'filled ':'')+(active&&i===(confirmed?value-1:value)?'gain':'')+'"></i>').join('')+'</div><b>'+fmt(value)+(active&&!confirmed?' → '+fmt(next):'')+'</b>';statsBox.append(row);
   }
   const hint=document.createElement('small');hint.className='gym-gain-hint';hint.textContent=confirmed?'✓ Amélioration obtenue !':selected?'La case verte montre le gain.':'Choisis une séance pour voir le gain.';statsBox.append(hint);
  };

  const refresh=()=>{renderStats();
   panel.innerHTML='<button class="gym-close" aria-label="Fermer">✕</button><h2>Jessica · On s’entraîne ?</h2><p>Chaque niveau gagné rapporte 2 points. Choisis ce que tu veux améliorer avec ta planche <b>'+SK.boardById(save.advBoard).name+'</b>.</p>';
   for(const offer of [...G.statOffers(save),G.strengthOffer(save),G.walkOffer(save),...G.powerOffers(save)]){
    const row=document.createElement('button');row.className='gym-training-row';const unavailable=offer.action!=='buy'||(save.trainingPoints||0)<offer.price;row.setAttribute('aria-disabled',String(unavailable));row.dataset.stat=offer.stat;row.onpointerenter=row.onfocus=()=>renderStats(offer.action==='max'?null:offer.stat);row.onpointerdown=()=>renderStats(offer.action==='max'?null:offer.stat);
    const ch=SK.charById(save.advChar||save.char),board=SK.effectiveBoard(save.advBoard,save);
    const current=offer.stat==='walk'?Math.round(100*(1+.15*offer.level)):(ch[offer.stat]||0)+(offer.stat==='strength'?(save.strengthLevel||0):(board[offer.stat]||0));
    const next=offer.action==='max'?current:current+(offer.stat==='walk'?15:1);
    const preview=['shot','item'].includes(offer.stat)?'+'+(offer.level*10)+' % → +'+(Math.min(3,offer.level+1)*10)+' %':offer.stat==='walk'?current+' % → '+next+' % en ville':current+' → '+next+' '+(next>8?'(au-delà de 8)':'');
    row.innerHTML=`<span class="stat-icon stat-${offer.stat}"><svg viewBox="0 0 32 34">${SK.STAT_ICONS[offer.stat]||SK.STAT_ICONS.speed}</svg></span><span><b>${offer.name.split(' · ')[0]}</b><small>Niveau ${offer.level} / ${offer.max||SK.UPGRADE_MAX}</small><span class="gym-stat-preview">${preview}</span></span><strong>${offer.lock|| (offer.action==='max'?'Maximum':offer.price+' point'+(offer.price>1?'s':''))}</strong>`;
    row.onclick=()=>{if(G.train(save,offer.stat)){store();SK.Audio.sfx('buy');refresh();renderStats(offer.stat,true);panel.querySelector('[data-stat="'+offer.stat+'"]')?.focus({preventScroll:true});renderStats(offer.stat,true);}};panel.append(row);
   }
   const note=document.createElement('p');note.className='gym-note';note.textContent='La marche améliore uniquement ta vitesse dans le village (5 niveaux). Les tirs renforcent leurs effets et les objets durent plus longtemps (+10 % par niveau, maximum 3). Les autres séances améliorent cette planche.';panel.append(note);
   panel.querySelector('.gym-close').onclick=()=>{panel.hidden=true;talk.hidden=false;screen.classList.remove('gym-choosing');renderStats();talk.focus();};
  };
  const speak=()=>{refresh();panel.hidden=false;talk.hidden=true;screen.classList.add('gym-choosing');panel.querySelector('.gym-close').focus();SK.Audio.sfx('click');};
  talk.onclick=speak;document.getElementById('gym-back').onclick=onBack;
  key=e=>{if(e.code==='Escape'){if(!panel.hidden){panel.hidden=true;talk.hidden=false;screen.classList.remove('gym-choosing');renderStats();}else onBack();}else if(e.code==='Enter'&&e.target===document.body){e.preventDefault();speak();}};window.addEventListener('keydown',key);
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
   // Two-segment limbs keep knees and elbows attached throughout the movement.
   const joint=(hip,foot,length,side)=>{const dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.max(.01,Math.hypot(dx,dy)),h=Math.sqrt(Math.max(0,length*length-d*d/4));return [(hip[0]+foot[0])/2-side*dy/d*h,(hip[1]+foot[1])/2+side*dx/d*h];};
   const torso=(x,y,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(x-21,y);c.quadraticCurveTo(x,y-9,x+21,y);c.lineTo(x+27,y+18);c.lineTo(x+22,y+70);c.quadraticCurveTo(x,y+76,x-22,y+70);c.lineTo(x-27,y+18);c.closePath();c.fill();line([[x-20,y+66],[x+20,y+66]],4,'#ffffff44');};
   for(let i=0;i<2;i++){
    const x=200+i*235,drop=i===1?(1-Math.cos(t*1.8))*12:0,y=303+drop;
    c.fillStyle=i?'#826099':'#446c93';c.fillRect(x-65,464,130,12);oval(x,460,48,9,'#243b4655');
    for(const side of [-1,1]){const hip=[x+side*13,y+68],foot=[x+side*29,450],knee=joint(hip,foot,41,-side);line([hip,knee,foot],17,'#293c56');line([[foot[0]-6,453],[foot[0]+13,453]],13,'#1e2b39');}
    torso(x,y,i?'#7b60a3':'#d46c44');
    const handY=i?y+34:265+(1-Math.cos(t*1.8))*20;
    for(const side of [-1,1]){const shoulder=[x+side*23,y+13],elbow=i?[x+side*43,y+35]:[x+side*44,y+27],hand=[x+side*(i?49:45),handY];line([shoulder,elbow,hand],12,'#edc2a0');line([shoulder,[(shoulder[0]+elbow[0])/2,(shoulder[1]+elbow[1])/2]],17,i?'#7b60a3':'#d46c44');if(!i)weight(hand[0],hand[1]);}
    window.FamilyHeads?.draw(c,i?'jeremie':'matthieu','front',x-38,y-75,76,81);
    c.font='bold 16px Arial';c.fillStyle='#263e50';c.fillText(i?'Jérémie':'Matthieu',x,207);
   }
   // Josué rides in profile: feet are locked to opposite ends of the crank.
   c.fillStyle='#3d837b';c.fillRect(585,464,175,12);
   oval(670,460,88,8,'#243b4655');
   const crank=[675,420],hip=[642,359],phase=t*3;
   const pedal=a=>[crank[0]+22*Math.cos(a),crank[1]+22*Math.sin(a)];
   const leg=(a,color)=>{const foot=pedal(a),knee=joint(hip,foot,47,-1);line([hip,knee,foot],15,color);line([[foot[0]-7,foot[1]],[foot[0]+12,foot[1]]],10,'#1e2b39');};
   leg(phase+Math.PI,'#43546a');
   oval(614,441,25,25,'#273842');oval(735,441,25,25,'#273842');oval(735,441,16,16,'#607e89');
   line([[614,441],[642,369],[675,420],[735,441],[708,365],[675,420],[614,441]],5,'#aec4ca');
   line([[642,369],[642,357]],6,'#aec4ca');line([[628,355],[654,355]],9,'#263842');
   line([[708,365],[718,330],[731,330]],6,'#aec4ca');
   line([pedal(phase),pedal(phase+Math.PI)],4,'#aebbc0');oval(...crank,7,7,'#263842');
   leg(phase,'#293c56');
   c.fillStyle='#268d81';c.beginPath();c.moveTo(651,286);c.quadraticCurveTo(673,280,685,301);c.lineTo(660,365);c.quadraticCurveTo(644,373,627,356);c.lineTo(637,310);c.closePath();c.fill();
   line([[675,302],[693,326],[721,330]],12,'#edc2a0');line([[675,302],[684,314]],19,'#268d81');
   window.FamilyHeads?.draw(c,'josue','side',645,222,79,82);
   c.font='bold 16px Arial';c.fillStyle='#263e50';c.fillText('Josué',675,207);
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
   const player=SK.fakeRacer(save.advChar||save.char,save.advBoard,'ride',SK.lookOf(SK.charById(save.advChar||save.char),save));SK.Render.drawWalker(c,player,560,650,112,t,'down',false);
  }
  raf=requestAnimationFrame(draw);
 };
})(window.SK);
