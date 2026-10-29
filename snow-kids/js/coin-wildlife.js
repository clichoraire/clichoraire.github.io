// Meadow lessons: moving treasure and playful wildlife, simulated only while racing.
(function(S){
 const W=S.CoinWildlife={};
 // Alternate readable turns, short climbs and steeper drops; later lessons tighten the rhythm.
 W.course=(base,level)=>{
  const sections=[],strength=.12+level*.025;let previousSlope=8;
  const add=(n,slope,dir=0)=>{sections.push({t:dir?'c':'s',c:dir*strength,n,w:12,slope,slopeFrom:previousSlope});previousSlope=slope;};
  add(18,8);
  for(let lap=0;lap<2+level;lap++){
   const side=lap%2?-1:1;
   add(18+level,12+level*2,side); // traverse across a descending bend
   add(10+level,18+level*2,side);
   add(12,-(2+level)); // straight climb after the hollow
   add(12,10+level*2);
   add(16,14+level,-side);
   add(16,11+level,side);
   add(12,8); // breathing space
   if(level>=3&&lap%2===0)sections.push({t:'r',n:4,h:2.5+level*.3,w:12});
  }
  add(18,8);
  return {...base,...(level<=2?{theme:level===1?'rookie':'snowman',surface:'snow'}:{}),forest:false,snowGuards:false,polarBears:false,blizzard:false,strongWind:false,sections};
 };
 W.pose=(coin,time)=>{const a=time*(coin.rate||.8)+(coin.phase||0);return {x:coin.baseX==null?coin.x:coin.baseX+Math.sin(a)*(coin.range||0),h:(coin.height||.5)+(coin.circle?Math.cos(a)*.6:0)};};
 W.setup=(track,level,rng)=>{
  const segs=track.segs,n=track.nRace;track.wildlife=[];
  for(const s of segs){s.coins=[];s.boxes=[];s.props=s.props.filter(p=>p.decor);}

  if(level>=2)for(let i=28;i<n-15;i+=43){const s=segs[i];if(s.ramp)continue;const side=i%2?1:-1;s.props.push({type:'fallenlog',x:side*5,r:5,span:5,clearance:.8,decor:false,mandatory:true});for(let j=i-4;j<i;j++)segs[j].coins=[];}
  if(level>=2)for(let i=10;i<n;i+=9)for(const side of [-1,1])segs[i].props.push({type:'pine',x:side*(segs[i].w+2+rng()*3),r:0,decor:true});
  // Twice the old level-one animal count, then denser encounters each lesson.
  const firstCount=2*Math.ceil((n-40)/48),enemyCount=level===1?firstCount:[14,24,34,64,78][level-1];
  for(let k=0;k<enemyCount;k++){const i=Math.round(28+k*(n-48)/Math.max(1,enemyCount-1)),side=k%2?1:-1,x=side*(level===1?10.7:10.2);track.wildlife.push({type:'macaque',attack:'rock',x,z:segs[i].z+2.5,homeX:x,cooldown:0,level});}
  for(let i=24;i<n-15;i+=Math.max(23,47-level*4)){const s=segs[i];s.props.push({type:level<=3?'tree':'pine',x:(i%2?1:-1)*(s.w-1.4),r:.7,size:.8,clearance:2.2,decor:false});}
  if(level>=2)for(let i=45;i<n-25;i+=Math.max(38,86-level*9)){const s=segs[i];if(s.ramp)continue;const cow={type:'cow',x:0,r:1.5,decor:false,v:rng(),walk:{range:s.w-3,phase:rng()*Math.PI*2,rate:.10+level*.012}};cow.x=Math.sin(cow.walk.phase)*cow.walk.range;s.props.push(cow);}
  if(level===3){
   for(const s of segs)if(s.jump){const index=s.i+3;if(index<n){segs[index].coins=[{x:0,baseX:0,range:1.1,phase:0,circle:true,height:2.6,taken:0},{x:1.8,baseX:1.8,range:1.1,phase:0,height:3.0,taken:0}];}}
   for(let i=55;i<n-20;i+=65){const s=segs[i];track.wildlife.push({type:'macaque',x:14,z:s.z,homeX:14,cooldown:0});for(let j=i-8;j<i+9;j+=3)segs[j].props.push({type:'banana',x:rng.range(-9,9),r:.65,clearance:.7,decor:false});}
   for(let i=40;i<n-20;i+=65){const s=segs[i],coin={x:0,height:.5,taken:0};s.coins.push(coin);track.wildlife.push({type:'thief',x:-14,homeX:-14,z:s.z+2.5,coin,mode:'waiting',carrying:false});for(const x of [-8,-4,0,4,8])segs[i-14].boxes.push({x,kind:'red',wildAmmo:true,taken:0});}
  }
  if(level>=4)for(let i=35;i<n-20;i+=70){const s=segs[i];if(!s.ramp&&!s.props.some(p=>!p.decor))for(const x of [-4,0,4])s.boxes.push({x,kind:'blue',taken:0});}
  // Modest surplus, small groups and separated zigzags at every difficulty.
  const budgets=[80,105,140,175,225],patterns=['arc','diagonal','s','pairs','short'];
  const remaining=budgets[level-1]-segs.reduce((sum,s)=>sum+s.coins.length,0),points=[];
  let chain=0;
  while(points.length<remaining){const count=Math.min([2,1,4,3][chain%4],remaining-points.length),pattern=patterns[chain%5],center=rng.range(-2.5-level*.35,2.5+level*.35),phase=rng()*Math.PI*2,range=chain%(level===1?8:level===2?5:3)===2?.25+level*.12:0;
   for(let j=0;j<count;j++){const q=count===1?.5:j/(count-1),a=1.4+level*.55,dir=chain%2?1:-1;
    const offset=pattern==='diagonal'?dir*(2*q-1)*a:pattern==='arc'?Math.sin(q*Math.PI)*a*dir:pattern==='s'?Math.sin(q*Math.PI*2)*a*.7:pattern==='pairs'?(j%2?1:-1)*1.2:Math.sin(q*Math.PI)*.5;
    points.push({x:center+offset,chain,pattern,phase,range,weight:j===0?1.65:1});
   }chain++;
  }
  const available=segs.slice(12,n-14).filter(s=>!s.ramp&&!s.coins.length&&!s.props.some(p=>!p.decor));
  const totalWeight=points.reduce((sum,p)=>sum+p.weight,0);let distance=0,last=-1;
  points.forEach((p,i)=>{distance+=p.weight;const at=Math.max(last+1,Math.min(available.length-(points.length-i),Math.floor((distance-.5)/totalWeight*available.length))),sg=available[at];last=at;
    const x=S.clamp(p.x,-sg.w+2+p.range,sg.w-2-p.range);sg.coins.push({x,baseX:x,dz:S.SEG/2,chain:p.chain,pattern:p.pattern,range:p.range,rate:.45+level*.06,phase:p.phase,height:.5,taken:0});
  });
  track.coinChains=chain;

 };
 W.laugh=(race,a,r)=>{
  if(!a||a.type!=='macaque'||a.down||a.laugh>0)return;
  a.laugh=2.6;a.windup=0;a.aimTarget=null;a.throwPose=0;a.grimace=0;a.cooldown=Math.max(a.cooldown||0,1.5);
  race.emit({type:'monkeylaugh',r,enemy:a});
 };
 W.update=(race,dt)=>{
  for(const a of race.track.wildlife||[]){
   a.throwPose=Math.max(0,(a.throwPose||0)-dt);a.grimace=Math.max(0,(a.grimace||0)-dt);
   if(a.down){a.flyAge=(a.flyAge||0)+dt;if(a.flyAge>=1.3)a.mode='gone';continue;}
   if(a.laugh>0){a.laugh=Math.max(0,a.laugh-dt);a.windup=0;a.throwPose=0;continue;}
   if(a.type==='macaque'&&a.attack==='rock'&&race.humans.some(r=>Math.abs(a.z-r.z)<75&&r.state!=='done'))a.grimace=.45;
   if(a.windup>0){a.windup=Math.max(0,a.windup-dt);a.throwPose=.5;const target=a.aimTarget;if(a.windup===0&&target&&target.state!=='done'&&target.state!=='lift'){const dz=target.z+target.speed*.7-a.z,dx=target.x-a.x,len=Math.hypot(dx,dz)||1;race.shots.push({kind:'wildrock',sourceEnemy:a,x:a.x,z:a.z,vx:dx/len*40,vz:dz/len*40,h:1,lap:target.lap,life:4});}continue;}

   const r=race.humans.find(r=>r.state!=='done'&&a.z-r.z>-10&&a.z-r.z<130);if(!r)continue;
   if(a.type==='macaque'&&a.attack==='rock'&&Math.abs(a.z-r.z)<75)a.grimace=.45;
   if(a.type==='thief'){
    if(a.mode==='waiting')a.mode='stealing';
    if(a.mode==='stealing'){a.x=Math.min(0,a.x+5*dt);if(a.x===0){if(a.coin.taken<=race.time){a.coin.taken=Infinity;a.carrying=true;}a.mode='escaping';}}
    else if(a.mode==='escaping'){a.x+=5*dt;if(a.x>16)a.mode='gone';}continue;
   }
   a.cooldown-=dt;if(a.cooldown>0||a.z-r.z<18)continue;
   a.cooldown=a.attack==='rock'?4.5-(a.level||1)*.35:a.type==='mole'?3:2.5;a.throwAt=race.time;a.throwPose=.65;
   if(a.type==='macaque'&&a.attack!=='rock'){race.rocks.push({type:'banana',sourceEnemy:a,x:S.clamp(r.x+Math.sin(race.time)*4,-9,9),z:Math.min(race.L-5,r.z+r.speed*1.1+15),lap:r.lap,until:race.time+35,t0:race.time,landed:race.time+.65,launchX:a.x,launchZ:a.z});}
   else {a.windup=3;a.aimTarget=r;}
  }
 };
 W.shoot=(race,r,kind)=>{
  const a=(race.track.wildlife||[]).find(a=>a.type==='thief'&&!a.down&&a.mode!=='gone'&&a.z-r.z>0&&a.z-r.z<160);if(!a)return false;
  race.shots.push({kind,from:r,wildTarget:a,prog:r.progress(),x:r.x,z:r.z,lap:r.lap,life:4,h:1});return true;
 };
 W.hit=(race,a,r)=>{if(a.down)return;a.down=true;a.flyAge=0;a.flySide=a.x>=r.x?1:-1;a.laugh=0;a.windup=0;a.throwPose=0;r.stats.hits++;if(a.carrying){a.carrying=false;const s=race.track.segAt(a.z);s.coins.push({x:S.clamp(a.x,-10,10),height:.5,taken:0});}race.explosions.push({x:a.x,z:a.z,lap:r.lap,at:race.time});race.emit({type:'explode',r});};
 W.draw=(c,a,x,y,s,t)=>{
  c.save();c.translate(x,y);c.scale(s,s);const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  if(a.down){const u=Math.min(1,(a.flyAge||0)/1.3);c.globalAlpha*=Math.max(0,1-Math.max(0,u-.55)/.45);c.translate(a.flySide*u*5,-Math.sin(u*Math.PI)*3-u*2);c.scale(1-u*.55,1-u*.55);c.rotate(a.flySide*u*Math.PI*3);}
  if(a.laugh>0){c.translate(0,-Math.abs(Math.sin(t*14))*.13);c.rotate(Math.sin(t*12)*.08);}
  const mole=a.type==='mole',masked=a.type==='thief';
  if(mole)ellipse(0,0,1.2,.3,'#342319');
  else{c.strokeStyle='#68422d';c.lineWidth=.22;c.lineCap='round';c.beginPath();c.moveTo(.4,-.4);c.bezierCurveTo(1.8,-.2,1.7,-2,1,-1.2);c.stroke();}
  ellipse(0,-.65,.58,.78,mole?'#765139':'#8b542d');ellipse(0,-1.4,.72,.66,mole?'#765139':'#8b542d');
  for(const side of [-1,1]){ellipse(side*.67,-1.4,mole?.13:.24,mole?.15:.27,'#a56b47');ellipse(side*.67,-1.4,mole?.07:.14,mole?.09:.17,'#dcad80');ellipse(side*.62,-.65,.2,.36,'#765139');}
  ellipse(0,-1.25,.53,.40,'#d9ad7a');
  if(masked){ellipse(0,-1.65,.61,.21,'#17212b');}
  for(const side of [-1,1]){ellipse(side*.25,-1.6,.13,.14,'#fff8de');ellipse(side*.23,-1.58,.06,.09,'#161b20');c.strokeStyle='#39271d';c.lineWidth=.1;c.beginPath();c.moveTo(side*.1,-1.83);c.lineTo(side*.45,-1.98);c.stroke();}
  ellipse(0,-1.32,mole?.20:.12,.12,mole?'#cf8c80':'#704c35');
  if(!mole){ellipse(0,-1.03,.35,.16,'#be725e');c.strokeStyle='#683728';c.lineWidth=.04;c.beginPath();c.moveTo(-.24,-1.03);c.lineTo(.24,-1.03);c.stroke();}
  if(a.grimace>0){ellipse(0,-1.01,.27,.14,'#512a30');ellipse(.05,-.91,.13,.16,'#ef7f92');c.strokeStyle='#633e2c';c.lineWidth=.09;c.beginPath();c.moveTo(-.39,-1.62);c.lineTo(-.17,-1.54);c.lineTo(-.38,-1.48);c.stroke();}
  if(a.laugh>0){ellipse(0,-1.01,.34,.22,'#49262a');ellipse(0,-.91,.20,.08,'#e9838f');c.fillStyle='#fff1cf';c.fillRect(-.22,-1.18,.44,.08);c.strokeStyle='#5c3728';c.lineWidth=.07;for(const side of [-1,1]){c.beginPath();c.moveTo(side*.12,-1.6);c.quadraticCurveTo(side*.25,-1.48,side*.38,-1.6);c.stroke();}c.lineWidth=.17;c.beginPath();c.moveTo(-.56,-.7);c.lineTo(-.22,-.48);c.moveTo(.56,-.7);c.lineTo(.22,-.48);c.stroke();}
  if(a.throwPose>0){c.strokeStyle='#765139';c.lineWidth=.22;c.beginPath();c.moveTo(.5,-.8);c.lineTo(1,-2);c.stroke();}
  if(a.carrying){ellipse(.66,-.55,.29,.29,'#c58b13');ellipse(.66,-.57,.24,.24,'#ffda45');c.fillStyle='#9d6710';c.font='bold .3px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('G',.66,-.55);}
  if(!mole){ellipse(-.3,0,.24,.16,'#5c3826');ellipse(.3,0,.24,.16,'#5c3826');}
  c.restore();
 };
})(window.SK);
