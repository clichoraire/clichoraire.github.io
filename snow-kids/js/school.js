// School interior and illustrated, replayable lesson cards.
(function(SK){
 'use strict';const S=SK.School={};let raf=0;
 S.close=()=>cancelAnimationFrame(raf);
 S.open=(save,onMission,onBack)=>{
  S.close();const list=document.getElementById('missions'),more=document.getElementById('school-more'),cv=document.getElementById('school-scene'),c=cv.getContext('2d');
  const done=SK.MISSIONS.filter(m=>save.missions?.[m.id]!=null).length;
  document.getElementById('school-sub').textContent=`${done} / ${SK.MISSIONS.length} missions réussies`;
  const progress=document.getElementById('school-progress');progress.max=SK.MISSIONS.length;progress.value=done;
  document.getElementById('school-gold').innerHTML='<img src="'+SK.COIN_SVG+'" alt="Or">'+SK.fmtGold(save.gold);
  list.replaceChildren();list.scrollTop=0;
  const previews=[];
  for(const m of SK.MISSIONS){
   const passed=save.missions?.[m.id]!=null,button=document.createElement('button');button.className='school-mission'+(passed?' completed':'');
   const title=document.createElement('h3');title.textContent=m.name;
   const level=document.createElement('span');level.className='school-level';level.textContent=`Niveau ${m.level||1}`+(passed?' · ★':'');
   const shot=document.createElement('canvas');shot.width=640;shot.height=320;shot.setAttribute('aria-label',m.desc);
   const footer=document.createElement('span');footer.className='school-reward';footer.innerHTML=passed?'★ Réussie · Refaire':`<img src="${SK.COIN_SVG}" alt=""> ${m.reward} G`;
   button.append(title,level,shot,footer);button.title=m.desc;button.onclick=()=>onMission(m);list.append(button);
   const race=new SK.Race({course:SK.courseById(m.course),mission:m,racers:[{charId:save.advChar||save.char,boardId:save.advBoard,ctrl:'human',player:0}],seed:7});race.preview=true;
   const r=race.humans[0];const interest=race.track.segs.find(s=>m.type==='slalom'?s.gate:m.type==='coins'?s.coins.length:m.type==='edges'?Math.abs(s.curve)>.02:m.type==='nofall'?s.props.some(p=>p.trainingBarrier):s.ramp);r.z=interest?Math.max(10,interest.z-28):45;r.yAbs=race.track.groundY(r.z);r.speed=16;r.state='ride';
   previews.push(()=>SK.Render.drawView(shot.getContext('2d'),race,r,0,0,640,320,0));
  }
  const updateArrow=()=>{more.hidden=list.scrollTop+list.clientHeight>=list.scrollHeight-8;};list.onscroll=updateArrow;
  more.onclick=()=>list.scrollBy({top:list.clientHeight*.9,behavior:'smooth'});document.getElementById('btn-school-back').onclick=onBack;
  const kids=SK.CHARACTERS.filter(ch=>!ch.hidden&&ch.id!==(save.advChar||save.char)).map(ch=>SK.fakeRacer(ch.id,'freestyle','ride',SK.lookOf(ch,SK.Profiles?.peek?SK.Profiles.peek(save,ch.id):{gear:[],look:{}})));
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  function draw(ms){raf=requestAnimationFrame(draw);const t=ms/1000;
   rect(0,0,1440,900,'#95633c');for(let y=0;y<650;y+=45){rect(0,y,1440,42,y%90?'#a67649':'#a16e44');}
   rect(0,650,1440,250,'#b68550');c.strokeStyle='#805532';c.lineWidth=3;
   for(let x=-1000;x<2500;x+=160){c.beginPath();c.moveTo(720+(x-720)*.45,650);c.lineTo(x,900);c.stroke();}
   for(let y=690;y<900;y+=75){c.beginPath();c.moveTo(0,y);c.lineTo(1440,y);c.stroke();}
   rect(0,0,1440,26,'#543922');rect(0,620,1440,25,'#674224');
   for(const x of [25,840,1410])rect(x,0,18,650,'#644226');
   // Chalkboard, winter window and classroom clock.
   rect(904,222,350,238,'#694424');rect(917,235,324,210,'#263d39');
   c.textAlign='center';c.font='bold 24px Arial';c.fillStyle='#e9e7cb';c.fillText('À toi de jouer !',1078,278);
   c.font='20px Arial';c.fillText('←  →     ↑     X',1078,318);c.fillStyle='#f3d872';c.fillText('★   ★   ★',1078,368);rect(1140,435,48,5,'#fff6dc');
   rect(1290,230,135,280,'#563c2a');rect(1300,240,115,260,'#b8e3fa');
   for(let y=260;y<500;y+=44){c.fillStyle='#fff';c.beginPath();c.arc(1312+(y%70),y,3,0,Math.PI*2);c.fill();}rect(1353,240,7,260,'#715239');rect(1300,365,115,7,'#715239');
   c.fillStyle='#f6e9c7';c.beginPath();c.arc(1100,170,32,0,Math.PI*2);c.fill();c.strokeStyle='#694424';c.lineWidth=5;c.stroke();c.beginPath();c.moveTo(1100,150);c.lineTo(1100,170);c.lineTo(1118,178);c.stroke();
   // The five classmates gather in two rows; only the active kid is absent.
   kids.forEach((r,i)=>{const back=i<2,x=back?980+i*165:938+(i-2)*170,y=back?590:766;
    rect(x-53,y-18,110,15,'#684423');rect(x-46,y-3,10,43,'#805433');rect(x+40,y-3,10,43,'#805433');
    SK.Render.drawWalker(c,r,x,y,back?58:65,t+i,'down',false);
   });
   c.textAlign='center';c.fillStyle='#ffe9b3';c.font='bold 22px Arial';c.fillText('La classe des Snow Kids',1110,825);
   // Refresh briefly as portrait assets finish loading; previews stay still.
   if(ms-start<2500)previews.forEach(draw=>draw());
  }
  const start=performance.now();previews.forEach(draw=>draw());raf=requestAnimationFrame(draw);requestAnimationFrame(updateArrow);
 };
})(window.SK);
