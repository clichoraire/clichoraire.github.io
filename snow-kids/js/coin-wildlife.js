// Meadow lessons: moving treasure and playful wildlife, simulated only while racing.
(function(S){
 const W=S.CoinWildlife={};
 W.course=(base,level)=>({...base,theme:'grass',surface:'grass',forest:false,snowGuards:false,polarBears:false,blizzard:false,strongWind:false,sections:Array.from({length:12},(_,i)=>level===3&&[3,7,10].includes(i)?{t:'r',n:4,h:1.6,w:12}:{t:i%4===2?'c':'s',c:(i%3?1:-1)*.018,n:20,w:12})});
 W.pose=(coin,time)=>{const a=time*(coin.rate||.8)+(coin.phase||0);return {x:coin.baseX==null?coin.x:coin.baseX+Math.sin(a)*(coin.range||0),h:(coin.height||.5)+(coin.circle?Math.cos(a)*.6:0)};};
 W.setup=(track,level,rng)=>{
  const segs=track.segs,n=track.nRace;track.wildlife=[];
  for(const s of segs){s.coins=[];s.boxes=[];s.props=s.props.filter(p=>p.decor);}
  for(let i=12;i<n-10;i+=level===1?5:7){const s=segs[i],x=rng.range(-7,7);s.coins.push({x,baseX:x,range:level>=2?1.4:0,phase:rng()*6.28,circle:level===3&&i%3===0,height:level===3&&i%3===0?1.2:.5,taken:0});if(i%2===0)s.coins.push({x:x+1.5,baseX:x+1.5,range:level>=2?1.4:0,phase:0,height:.5,taken:0});}
  if(level>=2)for(let i=28;i<n-15;i+=43){const s=segs[i];if(s.ramp)continue;const side=i%2?1:-1;s.props.push({type:'fallenlog',x:side*5,r:5,span:5,clearance:.8,decor:false,mandatory:true});for(let j=i-4;j<i;j++)segs[j].coins=[];}
  if(level>=2)for(let i=10;i<n;i+=9)for(const side of [-1,1])segs[i].props.push({type:'pine',x:side*(segs[i].w+2+rng()*3),r:0,decor:true});
  for(let i=28;i<n-12;i+=level===1?48:36){const s=segs[i],side=Math.floor((i-28)/(level===1?48:36))%2?1:-1,x=side*8;for(let j=i-1;j<=i+1;j++)segs[j].dirt={x,w:2.6};track.wildlife.push({type:'mole',x,z:s.z+2.5,homeX:x,cooldown:0});}
  if(level===3){
   for(const s of segs)if(s.jump){const index=s.i+3;if(index<n){segs[index].coins=[{x:0,baseX:0,range:1.1,phase:0,height:2.6,taken:0},{x:1.8,baseX:1.8,range:1.1,phase:0,height:3.0,taken:0}];}}
   for(let i=55;i<n-20;i+=65){const s=segs[i];track.wildlife.push({type:'macaque',x:14,z:s.z,homeX:14,cooldown:0});for(let j=i-8;j<i+9;j+=3)segs[j].props.push({type:'banana',x:rng.range(-9,9),r:.65,clearance:.7,decor:false});}
   for(let i=40;i<n-20;i+=65){const s=segs[i],coin={x:0,height:.5,taken:0};s.coins.push(coin);track.wildlife.push({type:'thief',x:-14,homeX:-14,z:s.z+2.5,coin,mode:'waiting',carrying:false});for(const x of [-8,-4,0,4,8])segs[i-14].boxes.push({x,kind:'red',wildAmmo:true,taken:0});}
  }
 };
 W.update=(race,dt)=>{
  for(const a of race.track.wildlife||[]){
   a.throwPose=Math.max(0,(a.throwPose||0)-dt);
   if(a.down)continue;
   const r=race.humans.find(r=>r.state!=='done'&&a.z-r.z>-10&&a.z-r.z<130);if(!r)continue;
   if(a.type==='thief'){
    if(a.mode==='waiting')a.mode='stealing';
    if(a.mode==='stealing'){a.x=Math.min(0,a.x+5*dt);if(a.x===0){if(a.coin.taken<=race.time){a.coin.taken=Infinity;a.carrying=true;}a.mode='escaping';}}
    else if(a.mode==='escaping'){a.x+=5*dt;if(a.x>16)a.mode='gone';}continue;
   }
   a.cooldown-=dt;if(a.cooldown>0||a.z-r.z<18)continue;
   a.cooldown=a.type==='mole'?3:2.5;a.throwAt=race.time;a.throwPose=.65;
   if(a.type==='macaque'){race.rocks.push({type:'banana',x:S.clamp(r.x+Math.sin(race.time)*4,-9,9),z:Math.min(race.L-5,r.z+r.speed*1.1+15),lap:r.lap,until:race.time+35,t0:race.time,landed:race.time+.65,launchX:a.x,launchZ:a.z});}
   else {const dz=r.z+r.speed*.7-a.z,dx=r.x-a.x,len=Math.hypot(dx,dz)||1;race.shots.push({kind:'wildrock',x:a.x,z:a.z,vx:dx/len*40,vz:dz/len*40,h:1,lap:r.lap,life:4});}
  }
 };
 W.shoot=(race,r,kind)=>{
  const a=(race.track.wildlife||[]).find(a=>a.type==='thief'&&!a.down&&a.mode!=='gone'&&a.z-r.z>0&&a.z-r.z<160);if(!a)return false;
  race.shots.push({kind,from:r,wildTarget:a,prog:r.progress(),x:r.x,z:r.z,lap:r.lap,life:4,h:1});return true;
 };
 W.hit=(race,a,r)=>{a.down=true;r.stats.hits++;if(a.carrying){a.carrying=false;const s=race.track.segAt(a.z);s.coins.push({x:S.clamp(a.x,-10,10),height:.5,taken:0});}race.explosions.push({x:a.x,z:a.z,lap:r.lap,at:race.time});race.emit({type:'explode',r});};
 W.draw=(c,a,x,y,s,t)=>{
  c.save();c.translate(x,y);c.scale(s,s);const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  if(a.down)c.rotate(Math.PI/2);
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
  if(a.throwPose>0){c.strokeStyle='#765139';c.lineWidth=.22;c.beginPath();c.moveTo(.5,-.8);c.lineTo(1,-2);c.stroke();}
  if(a.carrying){ellipse(.66,-.55,.29,.29,'#c58b13');ellipse(.66,-.57,.24,.24,'#ffda45');c.fillStyle='#9d6710';c.font='bold .3px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('G',.66,-.55);}
  if(!mole){ellipse(-.3,0,.24,.16,'#5c3826');ellipse(.3,0,.24,.16,'#5c3826');}
  c.restore();
 };
})(window.SK);
