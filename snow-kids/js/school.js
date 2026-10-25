// School interior and illustrated, replayable lesson cards.
(function(SK){
 'use strict';const S=SK.School={};let raf=0;
 S.close=()=>{cancelAnimationFrame(raf);document.getElementById('mission-level-choice')?.remove();};
 S.open=(save,onMission,onBack)=>{
  S.close();const list=document.getElementById('missions'),more=document.getElementById('school-more'),cv=document.getElementById('school-scene'),c=cv.getContext('2d');
  const done=SK.MISSIONS.filter(m=>save.missions?.[m.id]!=null).length;
  document.getElementById('school-sub').textContent=`${done} / ${SK.MISSIONS.length} missions réussies`;
  const progress=document.getElementById('school-progress');progress.max=SK.MISSIONS.length;progress.value=done;
  document.getElementById('school-gold').innerHTML='<img src="'+SK.COIN_SVG+'" alt="Or">'+SK.fmtGold(save.gold);
  list.replaceChildren();list.scrollTop=0;
  const previews=[];
  const groups=Object.values(SK.MISSIONS.reduce((all,m)=>{(all[m.type]??=[]).push(m);return all;},{}));
  const chooseLevel=(levels)=>{
   document.getElementById('mission-level-choice')?.remove();
   const dialog=document.createElement('dialog');dialog.id='mission-level-choice';dialog.setAttribute('aria-labelledby','mission-level-title');
   const heading=document.createElement('h2');heading.id='mission-level-title';heading.textContent=levels[0].name;
   const hint=document.createElement('p');hint.textContent='Choisis ton niveau';
   const choices=document.createElement('div');choices.className='mission-levels';
   for(const m of levels){
    const passed=save.missions?.[m.id]!=null,b=document.createElement('button');b.type='button';b.className='mission-level-option'+(passed?' completed':'');
    b.innerHTML=`<span class="level-number">${m.level||1}</span><strong>Niveau ${m.level||1}</strong><span>${passed?'★ Réussi':`🪙 ${m.reward} G`}</span>`;
    const desc=document.createElement('p');desc.textContent=m.desc;b.append(desc);
    b.onclick=()=>{dialog.close();onMission(m);};choices.append(b);
   }
   const back=document.createElement('button');back.className='n64-btn btn-retour';back.textContent='Retour';back.onclick=()=>dialog.close();
   dialog.append(heading,hint,choices,back);dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();choices.firstElementChild.focus();
  };
  for(const levels of groups){
   levels.sort((a,b)=>(a.level||1)-(b.level||1));const m=levels[0];
   const cleared=levels.filter(m=>save.missions?.[m.id]!=null).length,passed=cleared===levels.length,button=document.createElement('button');button.className='school-mission'+(passed?' completed':'');
   const title=document.createElement('h3');title.textContent=m.name;
   const level=document.createElement('span');level.className='school-level';level.textContent=levels.length+' niveau'+(levels.length>1?'x':'')+' · '+cleared+' / '+levels.length+' ★';
   const shot=document.createElement('canvas');shot.width=640;shot.height=320;shot.setAttribute('aria-label',m.desc);
   const footer=document.createElement('span');footer.className='school-reward';footer.textContent='Choisir le niveau →';
   button.append(title,level,shot,footer);button.title=m.desc;button.onclick=()=>chooseLevel(levels);list.append(button);
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
   // Perspective classroom: teacher at the board, seated pupils facing the lesson.
   const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
   poly([[1260,175],[1440,100],[1440,710],[1260,640]],'#98653d');
   c.strokeStyle='#805331';c.lineWidth=3;for(let y=190;y<650;y+=45){c.beginPath();c.moveTo(1260,y);c.lineTo(1440,y-50);c.stroke();}
   rect(890,230,355,270,'#563a25');rect(900,240,335,248,'#282e2d');rect(905,489,325,9,'#c18b51');rect(1170,482,35,5,'#fff8dc');
   poly([[1300,245],[1420,210],[1420,500],[1300,520]],'#503923');
   poly([[1310,253],[1410,224],[1410,488],[1310,505]],'#bee8fb');
   c.strokeStyle='#765339';c.lineWidth=8;c.beginPath();c.moveTo(1360,238);c.lineTo(1360,497);c.moveTo(1305,380);c.lineTo(1415,357);c.stroke();
   for(let i=0;i<12;i++){c.fillStyle='#fff';c.beginPath();c.arc(1320+(i*31)%85,265+(i*47)%210,2.3,0,Math.PI*2);c.fill();}
   const stroke=(pts,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
   // Instructor, proportional to the kids, with a welcoming hand gesture.
   stroke([[1251,510],[1247,597]],'#344b75',20);stroke([[1282,510],[1288,598]],'#344b75',20);
   stroke([[1241,601],[1256,601]],'#23333f',15);stroke([[1280,602],[1295,602]],'#23333f',15);
   c.fillStyle='#284753';c.beginPath();c.roundRect(1234,411,65,110,17);c.fill();
   stroke([[1240,432],[1211,453],[1187,432+Math.sin(t*1.6)*3]],'#284753',18);
   stroke([[1290,432],[1303,482]],'#284753',18);stroke([[1186,431],[1181,424]],'#fff1cf',13);stroke([[1303,481],[1303,489]],'#fff1cf',13);
   window.FamilyHeads?.draw(c,'jeremie','front',1228,340,76,83);
   c.fillStyle='#2a5269';c.beginPath();c.ellipse(1266,356,39,25,0,Math.PI,0);c.fill();rect(1228,351,76,12,'#203e51');
   c.fillStyle='#fff1d6';c.beginPath();c.arc(1266,324,9,0,Math.PI*2);c.fill();
   const bench=(x,y,w)=>{poly([[x,y],[x+w,y+25],[x+w+20,y+13],[x+20,y-12]],'#b27b43');rect(x,y, w,11,'#704823');for(const dx of [10,w-14]){rect(x+dx,y+10,10,60,'#77502d');} };
   const seated=(r,x,y,scale,view)=>{
    c.save();c.translate(x,y);c.scale(scale,scale);const L=r.look||SK.lookOf(r.def,{}),coat=L.jacket||'#3e9bb0',pants=L.pants||'#3c4984';
    // Thighs sit on the bench; knees bend and boots hang down in front.
    stroke([[-15,0],[-24,10],[-23,49]],pants,15);stroke([[14,1],[23,13],[24,51]],pants,15);
    stroke([[-24,45],[-24,59],[-12,59]],'#253849',15);stroke([[24,47],[24,61],[36,61]],'#253849',15);
    c.fillStyle=coat;c.beginPath();c.roundRect(-32,-80,64,86,15);c.fill();
    stroke([[-25,-66],[-38,-31],[-29,-8]],coat,16);stroke([[26,-65],[39,-27],[28,-7]],coat,16);
    stroke([[-29,-9],[-26,-5]],'#253849',13);stroke([[28,-8],[26,-3]],'#253849',13);
    c.fillStyle='#263d50';c.beginPath();c.ellipse(0,-74,26,11,0,0,Math.PI*2);c.fill();
    stroke([[-25,-40],[0,-34],[25,-40]],'#ffffff66',3);
    window.FamilyHeads?.draw(c,r.def.id,view,-39,-143,78,80);
    c.restore();
   };
   bench(895,606,210);
   kids.slice(0,3).forEach((r,i)=>seated(r,920+i*73,604+i*9,.78,i===0?'side':'back'));
   bench(1100,752,240);
   kids.slice(3).forEach((r,i)=>seated(r,1156+i*112,751+i*12,.94,'back'));
   // Refresh briefly as portrait assets finish loading; previews stay still.
   if(ms-start<2500)previews.forEach(draw=>draw());
  }
  const start=performance.now();previews.forEach(draw=>draw());raf=requestAnimationFrame(draw);requestAnimationFrame(updateArrow);
 };
})(window.SK);
