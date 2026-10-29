(function(SK){
 'use strict';const F=SK.ForestLife={};
 F.setup=function(track,course){
  track.fallingBranches=[];if(!course.forest)return;
  const level=course.forestLevel||2,n=track.nRace,target=3+(level-2)*2;let last=-1000;
  for(let i=65;i<n-35&&track.fallingBranches.length<target;i+=4){
   if(i-last<Math.max(24,Math.floor((n-120)/(target+1))))continue;
   const sg=track.segs[i];if(sg.ramp||sg.props.some(p=>p.mandatory))continue;
   const center=sg.forestPath?.center||0,x=center+(track.fallingBranches.length%2?1:-1)*1.6;
   if(track.segs.slice(i-8,i+9).some(q=>q.ramp||q.props.some(p=>!p.decor&&Math.abs(p.x-x)<(p.r||1)+2)))continue;
   const branch={type:'fallingbranch',x,z:sg.z+SK.SEG/2,r:1.25,clearance:.65,decor:true,phase:'idle',age:0,height:4.5,lastLap:-1,side:x<center?-1:1,originX:(x<center?-1:1)*(sg.w+2)};
   // No pickups or accelerator bait inside the landing area.
   for(const q of track.segs.slice(i-4,i+5)){q.boxes=q.boxes.filter(b=>Math.abs(b.x-x)>2.5);q.coins=q.coins.filter(b=>Math.abs(b.x-x)>2.5);delete q.boostPad;}
   sg.props.push({type:'pine',x:branch.originX,r:0,decor:true,v:.7},branch);track.fallingBranches.push(branch);last=i;
  }
  for(let i=35;i<n-30;i+=31){const sg=track.segs[i],tree=sg.props.find(p=>['pine','fir'].includes(p.type)&&Math.abs(p.x)>sg.w);if(!tree)continue;sg.props.push({type:'forestbird',x:tree.x,z:sg.z+SK.SEG/2,r:0,decor:true,v:i*.13,side:tree.x>0?-1:1});}
 };
 F.update=function(race,dt){for(const b of race.track.fallingBranches||[]){
  const rider=race.racers.find(r=>!['done','lift','drop'].includes(r.state)&&r.lap>b.lastLap&&b.z-r.z>20&&b.z-r.z<Math.max(100,r.speed*4));
  if(rider&&(b.phase==='idle'||b.phase==='landed')){b.lastLap=rider.lap;b.phase='warning';b.age=0;b.height=4.5;b.decor=true;}
  if(b.phase==='warning'){b.age+=dt;if(b.age>=.85){b.phase='falling';b.age=0;}}
  else if(b.phase==='falling'){b.age+=dt;const u=Math.min(1,b.age/.65);b.height=4.5*(1-u*u);if(u>=1){b.phase='landed';b.height=0;b.decor=false;}}
 }};
 F.draw=function(c,type,x,y,s,v,t,p){
  if(type==='forestbird'){
   const phase=(t+v)%12,fly=phase<5,u=phase/5,dx=fly?Math.sin(u*Math.PI)*p.side*3.6:0,up=fly?Math.sin(u*Math.PI)*2:0;
   c.save();c.translate(x+dx*s,y-(4.5+up)*s);c.scale(p.side,1);c.fillStyle='#385e78';c.beginPath();c.ellipse(0,0,.27*s,.18*s,0,0,Math.PI*2);c.fill();c.fillStyle='#d89964';c.beginPath();c.arc(.19*s,-.08*s,.15*s,0,Math.PI*2);c.fill();c.fillStyle='#ffdc77';c.beginPath();c.moveTo(.3*s,-.12*s);c.lineTo(.45*s,-.05*s);c.lineTo(.3*s,0);c.fill();c.fillStyle='#172e43';c.beginPath();c.arc(.24*s,-.11*s,.035*s,0,Math.PI*2);c.fill();c.strokeStyle='#244359';c.lineWidth=.09*s;c.lineCap='round';c.beginPath();c.moveTo(-.1*s,0);c.lineTo(-.46*s,fly?Math.sin(t*18)*.4*s:-.1*s);c.stroke();c.restore();return;
  }
  c.save();c.translate(x,y);const active=p.phase==='warning'||p.phase==='falling';
  if(active){c.strokeStyle='#edb64b';c.lineWidth=Math.max(1,s*.06);c.setLineDash([s*.15,s*.12]);c.beginPath();c.ellipse(0,0,s*1.6,s*.28,0,0,Math.PI*2);c.stroke();c.setLineDash([]);}
  const drop=p.phase==='landed'?1:p.phase==='falling'?Math.min(1,p.age/.65):0;c.translate((p.originX-p.x)*(1-drop)*s,-(p.height||0)*s);c.rotate(p.phase==='warning'?Math.sin(t*25)*.055:p.phase==='falling'?Math.sin(p.age*10)*.15:0);
  c.strokeStyle='#65422d';c.lineWidth=s*.32;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(-s*1.3,-s*.12);c.lineTo(s*1.3,-s*.26);c.stroke();c.strokeStyle='#a57a50';c.lineWidth=s*.09;c.beginPath();c.moveTo(-s*1.2,-s*.23);c.lineTo(s*1.2,-s*.36);c.stroke();c.strokeStyle='#65422d';c.lineWidth=s*.12;c.beginPath();c.moveTo(-s*.4,-s*.2);c.lineTo(-s*.7,-s*.75);c.moveTo(s*.5,-s*.25);c.lineTo(s*.8,-s*.65);c.stroke();c.strokeStyle='#effaff';c.lineWidth=s*.10;c.beginPath();c.moveTo(-s,-s*.3);c.lineTo(s*.3,-s*.37);c.stroke();
  if(active){c.fillStyle='#fff';for(let i=0;i<5;i++){c.beginPath();c.arc((i-2)*s*.5,(Math.sin(t*4+i)*.4+.5)*s,s*.04,0,Math.PI*2);c.fill();}}
  c.restore();
 };
})(window.SK);
