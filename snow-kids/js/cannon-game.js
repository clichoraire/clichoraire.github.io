// Le canon du village : simulation balistique indépendante du rendu.
(function(SK){
 'use strict';
 const C=SK.CannonGame={spot:{x:1710,y:492},medals:[{id:'bronze',name:'Bronze',goal:8,color:'#dc9c68',gold:12,xp:15},{id:'silver',name:'Argent',goal:16,color:'#dce9f3',gold:24,xp:30},{id:'gold',name:'Or',goal:24,color:'#ffdf55',gold:40,xp:50},{id:'diamond',name:'Diamant',goal:32,color:'#83f1ff',gold:60,xp:80}]};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 C.medal=hits=>C.medals.filter(m=>hits>=m.goal).at(-1)||null;
 C.reward=hits=>{const medal=C.medal(hits);return {medal:medal?.id||null,gold:5+Math.min(15,hits)+(medal?.gold||0),xp:10+Math.min(25,hits)+(medal?.xp||0)};};
 C.claim=(save,round)=>{if(!round.over||round.rewarded)return null;round.rewarded=true;const reward=C.reward(round.hits);save.gold=(save.gold||0)+reward.gold;const progress=SK.Progression.award(save,reward.xp);const record=save.cannonGame??={plays:0,best:0};record.plays++;record.best=Math.max(record.best,round.hits);record.medal=C.medal(record.best)?.id||null;return {...reward,progress};};
 C.project=p=>({x:480+p.x*650/(p.z+18),y:420-(p.y-4)*650/(p.z+18),scale:650/(p.z+18)});
 C.Round=class{
  constructor(random=Math.random){this.random=random;this.time=0;this.hits=0;this.misses=0;this.bats=[];this.balls=[];this.bursts=[];this.spawn=0;this.cooldown=0;this.over=false;this.rewarded=false;this.aim={x:480,y:210};this.shots=0;}
  target(){let depth=45,best=Infinity;for(const b of this.bats){const p=C.project(b),d=Math.hypot(p.x-this.aim.x,p.y-this.aim.y);if(d<Math.max(28,p.scale*2.3)&&d<best){best=d;depth=b.z*65/(65+b.speed);}}const t=depth/65;return {x:(this.aim.x-480)*(depth+18)/650,y:4-(this.aim.y-420)*(depth+18)/650,z:depth,t};}
  fire(){if(this.over||this.cooldown>0)return false;const target=this.target(),t=target.t;this.balls.push({x:0,y:1.8,z:0,vx:target.x/t,vy:(target.y-1.8+9*t*t)/t,vz:65,trail:[]});this.cooldown=.30;this.shots++;return true;}
  update(dt){if(this.over)return;dt=clamp(dt,0,.05);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.spawn-=dt;
   if(this.spawn<=0&&this.time<39){const r=this.random;this.bats.push({x:(r()-.5)*26,baseX:(r()-.5)*24,y:5+r()*12,z:78+r()*12,speed:6.5+this.time*.065+r()*2,phase:r()*6.28,age:0});this.spawn=Math.max(.62,1.05-this.time*.009);}
   for(const b of this.bats){b.previous={x:b.x,y:b.y,z:b.z};b.age+=dt;b.z-=b.speed*dt;b.x+=(b.baseX+Math.sin(b.age*1.4+b.phase)*2-b.x)*Math.min(1,dt*3);}
   for(const ball of this.balls){const old={x:ball.x,y:ball.y,z:ball.z};ball.trail.push(old);if(ball.trail.length>7)ball.trail.shift();ball.x+=ball.vx*dt;ball.y+=ball.vy*dt-9*dt*dt;ball.vy-=18*dt;ball.z+=ball.vz*dt;
    for(const b of this.bats){if(b.hit||b.escaped)continue;const p=b.previous,ax=old.x-p.x,ay=old.y-p.y,az=old.z-p.z,dx=ball.x-b.x-ax,dy=ball.y-b.y-ay,dz=ball.z-b.z-az,q=clamp(-(ax*dx+ay*dy+az*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);if(Math.hypot(ax+q*dx,ay+q*dy,az+q*dz)<2){b.hit=true;ball.hit=true;this.hits++;this.bursts.push({x:b.x,y:b.y,z:b.z,age:0});break;}}
   }
   this.balls=this.balls.filter(b=>!b.hit&&b.z<115&&b.y>-4);
   for(const b of this.bats)if(!b.hit&&b.z<3){b.escaped=true;this.misses++;this.hurt=.5;}
   this.bats=this.bats.filter(b=>!b.hit&&!b.escaped);for(const b of this.bursts)b.age+=dt;this.bursts=this.bursts.filter(b=>b.age<.65);this.hurt=Math.max(0,(this.hurt||0)-dt);
   if(this.time>=45||this.misses>=6)this.over=true;
  }
 };
 C.hit=(x,y)=>Math.abs(x-C.spot.x)<80&&y>C.spot.y-95&&y<C.spot.y+18;
 function cannon(c,x,y,s,angle=0,recoil=0){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#16334d';c.beginPath();c.ellipse(0,6,67,14,0,0,Math.PI*2);c.fill();c.fillStyle='#9b633e';c.fillRect(-36,-16,72,16);c.fillStyle='#c48b53';c.fillRect(-43,-18,86,8);for(const side of [-1,1]){c.fillStyle='#2a4b60';c.beginPath();c.arc(side*42,-5,15,0,Math.PI*2);c.fill();c.strokeStyle='#8dc5dc';c.lineWidth=4;c.stroke();}c.fillStyle='#b84050';c.beginPath();c.roundRect(-25,-65,50,34,9);c.fill();c.strokeStyle='#ffda80';c.lineWidth=3;c.stroke();c.save();c.translate(0,-22+recoil*6);c.rotate(angle);const g=c.createLinearGradient(-20,0,20,0);g.addColorStop(0,'#284a69');g.addColorStop(.5,'#85bdd4');g.addColorStop(1,'#203f5c');c.fillStyle=g;c.beginPath();c.roundRect(-22,-69,44,75,13);c.fill();c.fillStyle='#ffe28a';c.fillRect(-25,-55,50,9);c.fillStyle='#0b1e32';c.beginPath();c.ellipse(0,-69,23,11,0,0,Math.PI*2);c.fill();c.strokeStyle='#b8edf6';c.lineWidth=4;c.stroke();c.restore();c.restore();}
 C.drawTown=(c,t)=>{cannon(c,C.spot.x,C.spot.y,.8,-.65,0);c.save();c.fillStyle='#fff1a7';c.font='bold 15px Arial';c.textAlign='center';c.fillText('★ CANON ★',C.spot.x,C.spot.y+29);c.restore();};
 function bat(c,b,time){const p=C.project(b);c.save();c.translate(p.x,p.y);c.scale(p.scale,p.scale);const flap=Math.sin(time*13+b.phase)*1.3;c.fillStyle='#684a91';c.strokeStyle='#251c48';c.lineWidth=.16;for(const side of [-1,1]){c.beginPath();c.moveTo(side*.5,0);c.quadraticCurveTo(side*2,-2.4+flap,side*3.2,-.6+flap);c.lineTo(side*2.5,.3);c.quadraticCurveTo(side*1.9,-.25,side*1.6,.7);c.quadraticCurveTo(side*.9,.25,side*.5,.7);c.closePath();c.fill();c.stroke();}c.fillStyle='#332c56';c.beginPath();c.ellipse(0,0,.8,1.1,0,0,Math.PI*2);c.fill();for(const side of [-1,1]){c.beginPath();c.moveTo(side*.2,-.7);c.lineTo(side*.75,-1.65);c.lineTo(side*.8,-.3);c.fill();c.fillStyle='#ffbd55';c.beginPath();c.ellipse(side*.3,-.2,.23,.14,-side*.3,0,Math.PI*2);c.fill();c.fillStyle='#332c56';}c.fillStyle='#fff6db';for(const x of [-.22,.22]){c.beginPath();c.moveTo(x-.1,.4);c.lineTo(x,.7);c.lineTo(x+.1,.4);c.fill();}c.restore();}
 C.draw=(c,round,rider)=>{const t=round.time,g=c.createLinearGradient(0,0,0,640);g.addColorStop(0,'#132344');g.addColorStop(.7,'#476d94');g.addColorStop(1,'#d4edf2');c.fillStyle=g;c.fillRect(0,0,960,640);
  c.fillStyle='#fff0bc';c.beginPath();c.arc(790,110,45,0,Math.PI*2);c.fill();for(let i=0;i<45;i++){c.globalAlpha=.35+(i%4)*.15;c.fillRect((i*193)%960,(i*97)%340,2,2);}c.globalAlpha=1;
  for(let layer=0;layer<2;layer++){c.fillStyle=layer?'#6c91b0':'#345476';c.beginPath();c.moveTo(0,500);for(let x=0;x<=1080;x+=120)c.lineTo(x,340+layer*85-Math.sin(x*.015+layer)*65);c.lineTo(960,640);c.lineTo(0,640);c.fill();}
  c.fillStyle='#dceff3';c.beginPath();c.ellipse(480,660,750,145,0,0,Math.PI*2);c.fill();
  [...round.bats].sort((a,b)=>b.z-a.z).forEach(b=>bat(c,b,t));
  for(const ball of round.balls){c.strokeStyle='#ffdb8b99';c.lineWidth=3;c.beginPath();ball.trail.forEach((p,i)=>{const q=C.project(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});const p=C.project(ball);c.lineTo(p.x,p.y);c.stroke();c.fillStyle='#152a40';c.beginPath();c.arc(p.x,p.y,Math.max(4,p.scale*.38),0,Math.PI*2);c.fill();c.fillStyle='#abd9e6';c.beginPath();c.arc(p.x-p.scale*.1,p.y-p.scale*.1,Math.max(1,p.scale*.1),0,Math.PI*2);c.fill();}
  for(const b of round.bursts){const p=C.project(b);c.save();c.globalAlpha=1-b.age/.65;c.strokeStyle='#ffe082';c.lineWidth=3;for(let i=0;i<9;i++){const a=i*Math.PI*2/9,d=(1+b.age*6)*p.scale;c.beginPath();c.moveTo(p.x+Math.cos(a)*d*.5,p.y+Math.sin(a)*d*.5);c.lineTo(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d);c.stroke();}c.restore();}
  // A dotted ballistic arc is only a guide: the fired ball follows gravity.
  const target=round.target();c.fillStyle='#ffde8080';for(let i=2;i<14;i++){const u=target.t*i/14,p=C.project({x:target.x/target.t*u,y:1.8+(target.y-1.8+9*target.t**2)/target.t*u-9*u*u,z:65*u});c.beginPath();c.arc(p.x,p.y,2.5,0,Math.PI*2);c.fill();}
  c.save();c.strokeStyle='#ffe47e';c.lineWidth=3;c.translate(round.aim.x,round.aim.y);c.beginPath();c.arc(0,0,22,0,Math.PI*2);c.stroke();for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.beginPath();c.moveTo(15,0);c.lineTo(31,0);c.stroke();}c.restore();
  c.fillStyle='#b74258';c.beginPath();c.roundRect(445,455,70,130,12);c.fill();if(rider){c.save();c.beginPath();c.rect(395,390,170,120);c.clip();c.translate(480,550);SK.Sprites.shopPose(c,rider,rider.look,65,0);c.restore();}cannon(c,480,624,1.35,0,round.cooldown/.3);
  if(round.cooldown>.22){c.fillStyle='#ffe9a6';c.beginPath();c.ellipse(480,502,17,25,0,0,Math.PI*2);c.fill();}
  if(round.hurt>0){c.strokeStyle='#f58d9d';c.lineWidth=12*round.hurt;c.strokeRect(3,3,954,634);}
 };
 let dialog,raf=0;
 C.open=({save,onSave,onClose})=>{if(dialog)return;SK.Town.paused=true;SK.Audio.stopSanta?.();SK.Touch.pause(true);SK.Input.keys={};SK.Input.pressed={};let round=null,last=0,held=false,resultShown=false,keys=new Set();
  const id=save.advChar||save.char,rider=SK.fakeRacer(id,save.advBoard||'freestyle','ride',SK.lookOf(SK.charById(id),save));
  dialog=document.createElement('dialog');dialog.className='cannon-dialog';dialog.setAttribute('aria-label','Canon anti-chauves-souris');dialog.innerHTML='<canvas width="960" height="640" aria-label="Vise les chauves-souris avec la souris ou le doigt"></canvas><div class="cannon-hud" hidden><strong class="cannon-score">0</strong><span class="cannon-clock"></span><span class="cannon-lives"></span></div><button class="cannon-exit" aria-label="Quitter le mini-jeu">×</button><button class="cannon-fire" hidden>💥 Tirer <small>Espace</small></button><section class="cannon-panel"></section>';
  const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),panel=dialog.querySelector('.cannon-panel'),fire=dialog.querySelector('.cannon-fire'),hud=dialog.querySelector('.cannon-hud');
  const medalHTML=()=>'<div class="cannon-medals">'+C.medals.map(m=>'<span style="--medal:'+m.color+'"><b>'+(m.id==='diamond'?'◆':'★')+'</b>'+m.name+'<strong>'+m.goal+'</strong></span>').join('')+'</div>';
  function close(){held=false;keys.clear();cancelAnimationFrame(raf);dialog.close();dialog.remove();dialog=null;SK.Town.paused=false;SK.Touch.pause(false);SK.Input.keys={};SK.Input.pressed={};onClose?.();}
  function shoot(){if(round?.fire()){SK.Audio.init();SK.Audio.sfx('cannon');}}
  function start(){round=new C.Round();held=false;keys.clear();resultShown=false;panel.hidden=true;hud.hidden=false;fire.hidden=false;canvas.focus();last=performance.now();}
  panel.innerHTML='<span class="cannon-eyebrow">MINI-JEU DU VILLAGE</span><h2>La brigade du canon !</h2><p>45 secondes pour défendre le village.<br>Abats les chauves-souris avant qu’elles arrivent !</p>'+medalHTML()+'<p class="cannon-help">Souris ou doigt pour viser et tirer.<br>Maintiens pour tirer en continu. Clavier : flèches + Espace.<br>6 chauves-souris passent ? La partie se termine.</p><p>De l’or et de l’XP, même sans médaille !</p><button class="cannon-start">C’est parti !</button>';
  panel.querySelector('.cannon-start').onclick=start;dialog.querySelector('.cannon-exit').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});canvas.tabIndex=0;canvas.style.touchAction='none';
  const aim=e=>{if(!round||round.over)return;const b=canvas.getBoundingClientRect();round.aim.x=clamp((e.clientX-b.left)*960/b.width,35,925);round.aim.y=clamp((e.clientY-b.top)*640/b.height,40,430);};
  canvas.onpointerdown=e=>{if(!round||round.over)return;aim(e);canvas.setPointerCapture(e.pointerId);held=true;shoot();};canvas.onpointermove=aim;canvas.onpointerup=canvas.onpointercancel=()=>{held=false;};
  fire.onpointerdown=e=>{e.preventDefault();fire.setPointerCapture(e.pointerId);held=true;shoot();};fire.onpointerup=fire.onpointercancel=()=>{held=false;};fire.onclick=e=>{if(e.detail===0)shoot();};
  dialog.onkeydown=e=>{e.stopPropagation();if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);}};dialog.onkeyup=e=>{e.stopPropagation();keys.delete(e.code);};
  const blur=()=>{held=false;keys.clear();};window.addEventListener('blur',blur);dialog.addEventListener('close',()=>window.removeEventListener('blur',blur),{once:true});
  function frame(now){if(!dialog)return;raf=requestAnimationFrame(frame);const dt=Math.min(.04,(now-last)/1000||0);last=now;if(document.hidden){blur();return;}
   if(round&&!round.over){round.aim.x=clamp(round.aim.x+((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*400*dt,35,925);round.aim.y=clamp(round.aim.y+((keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0))*300*dt,40,430);if(held||keys.has('Space'))shoot();const before=round.hits;round.update(dt);if(round.hits>before)SK.Audio.sfx('coin');
    dialog.querySelector('.cannon-score').textContent='🦇 '+round.hits;dialog.querySelector('.cannon-clock').textContent=Math.ceil(Math.max(0,45-round.time))+' s';dialog.querySelector('.cannon-lives').textContent='♥ '+Math.max(0,6-round.misses);}
   C.draw(ctx,round||{time:0,bats:[],balls:[],bursts:[],aim:{x:480,y:210},target:()=>({x:0,y:12,z:45,t:45/65}),cooldown:0},rider);
   if(round?.over&&!resultShown){resultShown=true;held=false;keys.clear();const reward=C.claim(save,round);onSave?.();const medal=C.medal(round.hits);panel.hidden=false;fire.hidden=true;panel.innerHTML='<span class="cannon-eyebrow">'+(medal?'MÉDAILLE '+medal.name.toUpperCase():'BIEN ESSAYÉ !')+'</span><h2>'+(medal?(medal.id==='diamond'?'◆':'★')+' Bravo !':'On reprend courage !')+'</h2><p>'+round.hits+' chauves-souris abattues</p>'+medalHTML()+'<div class="cannon-rewards"><strong>🪙 +'+reward.gold+'</strong><strong>⭐ +'+reward.xp+' XP</strong></div><p>Record : '+save.cannonGame.best+' · Niveau '+reward.progress.level+'</p><button class="cannon-retry">Rejouer</button><button class="cannon-back">Retour au village</button>';panel.querySelector('.cannon-retry').onclick=start;panel.querySelector('.cannon-back').onclick=close;SK.Audio.sfx(medal?'win':'finish');}
  }
  document.body.append(dialog);dialog.showModal();last=performance.now();raf=requestAnimationFrame(frame);
 };
})(window.SK);
