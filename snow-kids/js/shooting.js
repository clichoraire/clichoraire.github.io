// Aiming, solo target courses and playful projectiles share one trajectory model.
(function(SK){
 'use strict';const S=SK.Shooting={},P=SK.Race.prototype,TAU=Math.PI*2;
 const ammo=[['pebble','Roche','🪨'],['cannon','Boulet de canon','💣'],['soccer','Ballon de soccer','⚽'],['redball','Ballon rouge','🔴'],['apple','Pomme croquée','🍎'],['ketchup','Ketchup','🍅'],['mustard','Moutarde','🟡'],['snowball','Boule de neige','❄'],['yellowball','Boule jaune','🟨']];
 S.ids=ammo.map(a=>a[0]);for(const [id,name,icon]of ammo){SK.SHOTS[id]={name,icon};if(!SK.SHOT_IDS.includes(id))SK.SHOT_IDS.push(id);}
 S.setup=(track,level,rng)=>{
  for(const seg of track.segs){seg.props=seg.props.filter(p=>p.decor);seg.boxes=[];seg.coins=[];}
  track.wildlife=[];track.snowGuards=[];track.polarBears=[];track.targets=[];
  const count=10+level*4,first=140,last=track.L-85;
  const kinds=level===1?['sway','sway','shake','blink']:level===2?['sway','shake','blink','small']:['shake','blink','small','swift','sway'];
  for(let i=0;i<count;i++){
    const z=first+(last-first)*i/(count-1),kind=kinds[i%kinds.length],x=(i%2?1:-1)*(2.4+level*.35);
    const points={sway:1,shake:2,blink:3,small:4,swift:5}[kind];
    const target={x,baseX:x,z,kind,points,radius:kind==='small'?.7:1.25,phase:rng()*TAU,range:kind==='swift'?2.2+level*.2:.5+level*.22,rate:kind==='swift'?1.5:kind==='shake'?1.1:.55+level*.08,hp:1,visible:true,down:false};track.targets.push(target);
    const boxSeg=track.segAt(z-65);for(const x of [-6,-3,0,3,6])boxSeg.boxes.push({x,kind:'red',ammo:S.ids[(i+7)%S.ids.length],free:true,taken:0});
    // Keep the pickup row free; obstacles sit farther ahead, with an open middle lane.
    for(let k=0;k<level;k++){const sg=track.segAt(z-38+k*7);sg.props.push({type:k%2?'rock':'pine',x:(i%2?1:-1)*(5.6-k*.55),r:k%2?.7:.8,decor:false,v:rng(),clearance:k%2?.7:2.5});}
    if(level>=2&&i%3===1)for(let k=0;k<2+level;k++)track.segAt(z-42+k*5).surface='ice';
  }
  track.targetPoints=track.targets.reduce((sum,t)=>sum+t.points,0);
 };
 S.updateTargets=(race)=>{for(const t of race.track.targets||[]){if(t.down)continue;const a=race.time*t.rate+t.phase;
   t.x=t.baseX+Math.sin(a)*t.range+(t.kind==='shake'?Math.sin(a*13)*.24:0);
   t.tilt=t.kind==='shake'?Math.sin(a*17)*.15:Math.sin(a)*.06;
   const cycle=(race.time+t.phase)%6;t.visible=t.kind!=='blink'||cycle<4.5;t.reveal=t.kind==='blink'&&cycle>4.1&&cycle<4.5?.55+.45*Math.sin(cycle*30):1;
 }};
 S.candidates=(race,r,near=4)=>[...(race.track.targets||[]).filter(o=>!o.down&&o.visible!==false).map(o=>({object:o,type:'target'})),...(race.track.wildlife||[]).filter(o=>!o.down&&o.mode!=='gone').map(o=>({object:o,type:'wild'})),...race.racers.filter(o=>o!==r&&!o.immune()&&o.lap===r.lap).map(o=>({object:o,type:'racer'}))].filter(t=>t.object.z-r.z>near&&t.object.z-r.z<220);
 S.aim=(race,r)=>{const angle=r.aimAngle||0;return S.candidates(race,r).map(t=>({...t,error:Math.abs(Math.atan2(t.object.x-r.x,t.object.z-r.z)-angle)})).filter(t=>t.error<Math.min(.055,(t.object.radius||1.5)/Math.max(8,t.object.z-r.z)+.014)).sort((a,b)=>a.object.z-b.object.z||a.error-b.error)[0]||null;};
 S.splash=(r,kind,time)=>{r.lensSauce={kind,at:time,hold:kind==='yellowball'?3.4:3.8,life:kind==='yellowball'?4.8:5};};
 S.hitTarget=(race,r,target,kind)=>{if(target.down||target.visible===false)return;target.hp-=kind==='cannon'?3:1;target.flashAt=race.time;if(target.hp>0)return;target.down=true;target.hitAt=race.time;r.stats.hits++;const points=target.points||1;r.targetScore=(r.targetScore||0)+points;r.targetFeedback={points,at:race.time};race.emit({type:'targethit',r,kind,points});race.explosions.push({x:target.x,z:target.z,lap:r.lap,at:race.time});};
 // Convert the board's screen rotation (body .20 + board 1.04) to
 // a heading on the ground using the same 3.8 m / 9 m camera proportions.
 S.boardHeading=r=>Math.atan(Math.tan((r.visualTurn??r.steer??0)*1.24-(r.brake||0)*.12)*3.8/9);
 const originalUpdate=P.updateRacer;
 P.updateRacer=function(r,dt){
  if(r.ctrl!=='human')return originalUpdate.call(this,r,dt);
  const held=!!r.input.shoot,previous=r.aiming,cancel=!!r.input.cancelShoot;
  const allowed=()=>!!r.shot&&['ride','air'].includes(r.state);
  r.aiming=!cancel&&held&&allowed();
  // Steering keeps controlling the board while aiming, on keyboard and touch.
  r.input.shoot=false;originalUpdate.call(this,r,dt);r.input.shoot=held;r.prev.shoot=held;
  r.aimAngle=S.boardHeading(r);
  if(previous&&!held&&!cancel&&allowed())this.fire(r,true);
  if(!allowed()||cancel)r.aiming=false;
 };
 const originalFire=P.fire;
 P.fire=function(r,aimed=false){
  if(!r.shot)return;
  if(!aimed&&!S.ids.includes(r.shot))return originalFire.call(this,r);
  const kind=r.shot;if(kind==='rocher'){r.aiming=false;return originalFire.call(this,r);}
  if(r.ctrl!=='human'){const ahead=this.racerAhead(r);if(ahead)r.aimAngle=Math.atan2(ahead.x-r.x,Math.max(1,ahead.z-r.z));}
  const chosen=S.aim(this,r);r.shot=null;r.stats.shots++;this.emit({type:'shoot',r,kind});
  this.shots.push({kind,aimed:true,from:r,chosen, target:chosen?.type==='racer'?chosen.object:null,x:r.x,z:r.z+1,prog:r.progress()+1,lap:r.lap,h:1.2,life:8,angle:r.aimAngle||0,bornAt:this.time,armedAt:chosen?.type==='racer'?this.time+3:this.time});
 };
 const originalTakeBox=P.takeBox;
 P.takeBox=function(r,b){if(b.ammo&&b.kind==='red'){if(r.shot)return;r.shot=b.ammo;b.taken=this.time+SK.BOX_RESPAWN;r.boxBurst={at:this.time,kind:'red'};this.emit({type:'box',r,kind:'red',got:r.shot,free:true});return;}return originalTakeBox.call(this,r,b);};
 const originalHit=P.applyHit;
 P.applyHit=function(r,kind,from){
  if(!S.ids.includes(kind))return originalHit.call(this,r,kind,from);
  if(r.immune())return false;if(from)from.stats.hits++;
  if(['ketchup','mustard','yellowball'].includes(kind))S.splash(r,kind,this.time);
  else if(kind==='snowball')S.splash(r,'snowball',this.time);
  else if(kind==='cannon'){this.fall(r,1.4,false);this.explosions.push({x:r.x,z:r.z,lap:r.lap,at:this.time});}
  else{r.speed*=kind==='pebble'?.7:.82;r.fx.wobble=.7;}
  this.emit({type:'hit',r,kind,from});return true;
 };
 const originalShots=P.updateShots;
 P.updateShots=function(dt){
  S.updateTargets(this);const aimed=this.shots.filter(s=>s.aimed);this.shots=this.shots.filter(s=>!s.aimed);originalShots.call(this,dt);

  for(const s of aimed){s.life-=dt;if(s.life<=0)continue;const oldZ=s.z,oldX=s.x;let o=s.chosen?.object;if(o?.visible===false){s.chosen=null;o=null;}
    if(o&&(o.down||o.mode==='gone'||o.state==='done'||o.state==='lift'))continue;
    const speed=95+(s.target?.speed||0);s.z+=Math.cos(s.angle)*speed*dt;
    if(o){s.x+=(o.x-s.x)*Math.min(1,dt*7);if(this.time<s.armedAt)s.z=Math.min(s.z,o.z-4);}else s.x+=Math.sin(s.angle)*speed*dt;
    const rock=this.rocks.find(k=>k.until>this.time&&k.owner!==s.from&&k.lap===s.lap&&k.z>=oldZ&&k.z<=s.z&&Math.abs(k.x-(oldX+(s.x-oldX)*SK.clamp((k.z-oldZ)/(s.z-oldZ||1),0,1)))<(k.type==='banana'?.45:.8)+.2);
    if(rock){rock.until=0;this.explosions.push({x:rock.x,z:rock.z,lap:s.lap,at:this.time});continue;}
    let hit=null;if(o&&this.time>=s.armedAt&&oldZ<=o.z+1&&s.z>=o.z-1&&Math.abs(o.x-(oldX+(s.x-oldX)*SK.clamp((o.z-oldZ)/(s.z-oldZ||1),0,1)))<(o.radius||.8)+.2)hit=s.chosen;
    if(!o){hit=S.candidates(this,{...s.from,x:oldX,z:oldZ},-2).find(t=>t.object.z<=s.z+1&&Math.abs(t.object.x-(oldX+(s.x-oldX)*(t.object.z-oldZ)/Math.max(.01,s.z-oldZ)))<(t.object.radius||1.5));}
    if(hit){if(hit.type==='target'){S.hitTarget(this,s.from,hit.object,s.kind);if(s.kind==='cannon')for(const t of this.track.targets)if(!t.down&&t.visible!==false&&Math.hypot(t.x-hit.object.x,t.z-hit.object.z)<10)S.hitTarget(this,s.from,t,s.kind);}else if(hit.type==='wild')SK.CoinWildlife.hit(this,hit.object,s.from);else this.applyHit(hit.object,s.kind,s.from);continue;}
    if(o&&s.z>o.z+1){s.chosen=null;s.target=null;}
    s.prog=s.lap*this.L+s.z;if(s.z<this.L&&Math.abs(s.x)<this.track.widthAt(s.z)+25)this.shots.push(s);
  }
 };
 S.threat=(race,r)=>{
  // Scenery enemies telegraph on their bodies; only rival racers get a HUD warning.
  const threats=[];for(const s of race.shots){if(['wildrock','wildsnow'].includes(s.kind)||s.target!==r)continue;
    const distance=Math.max(0,r.progress()-(s.prog??r.progress()));threats.push({kind:s.kind,from:s.from,x:s.x??r.x,eta:s.drop??Math.max((s.armedAt||0)-race.time,distance/95),distance});
  }
  return threats.sort((a,b)=>a.eta-b.eta)[0]||null;
 };
 const circle=(c,x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();};
 S.drawAmmo=(c,kind,x,y,size,t=0)=>{if(!S.ids.includes(kind))return false;c.save();c.translate(x,y);c.scale(size,size);
  if(kind==='ketchup'||kind==='mustard'){c.rotate(Math.sin(t*5)*.15);c.fillStyle=kind==='ketchup'?'#e34e42':'#edc528';c.beginPath();c.roundRect(-.33,-.65,.66,1.1,.16);c.fill();c.fillStyle='#fff0c7';c.fillRect(-.17,-.87,.34,.24);c.fillRect(-.25,-.25,.5,.34);circle(c,0,-.08,.11,kind==='ketchup'?'#c63735':'#d7a315');}
  else if(kind==='apple'){circle(c,-.12,0,.4,'#e65a49');circle(c,.18,0,.37,'#f3e0a6');c.fillStyle='#845438';c.fillRect(-.03,-.55,.08,.24);c.strokeStyle='#6f4636';c.lineWidth=.06;c.beginPath();c.moveTo(.25,-.24);c.lineTo(.10,-.1);c.lineTo(.28,.04);c.lineTo(.10,.18);c.stroke();}
  else {const color={pebble:'#7e8b92',cannon:'#24374b',soccer:'#f9ffff',redball:'#ed4b68',snowball:'#f5fcff',yellowball:'#f7e66c'}[kind];circle(c,0,0,kind==='cannon'?.58:.45,color);circle(c,-.12,-.15,.12,'#ffffff80');if(kind==='soccer'){for(let i=0;i<5;i++){const a=i*TAU/5;circle(c,Math.cos(a)*.29,Math.sin(a)*.29,.095,'#193748');}circle(c,0,0,.11,'#193748');}if(kind==='cannon'){c.strokeStyle='#bd8652';c.lineWidth=.07;c.beginPath();c.moveTo(.2,-.45);c.lineTo(.34,-.7);c.stroke();circle(c,.34,-.7,.12,'#ffca4c');}}
  c.restore();return true;};
 S.drawTarget=(c,t,x,y,s,time)=>{c.save();c.translate(x,y);
  if(t.down){const age=time-t.hitAt;if(age>1){c.restore();return;}c.globalAlpha=1-age;c.rotate(age*1.3);}
  c.fillStyle='#906a49';c.fillRect(-.12*s,-2.3*s,.24*s,2.3*s);
  if(t.visible===false){c.strokeStyle='#b3bce1';c.setLineDash([s*.2,s*.15]);c.lineWidth=s*.1;c.beginPath();c.ellipse(0,-s*.15,s*.65,s*.2,0,0,TAU);c.stroke();c.restore();return;}
  c.globalAlpha*=t.reveal??1;c.translate(0,-2.1*s);c.rotate(t.tilt||0);const radius=t.radius||1.25,colors=['#25445a','#fff8df',t.points>=4?'#a45de0':t.kind==='blink'?'#30b5cf':'#ed5e62','#fff8df','#f4bd42'];
  [1.08,.96,.74,.50,.26].forEach((v,i)=>circle(c,0,0,v*radius*s,colors[i]));
  c.fillStyle='#17364c';c.font='bold '+s*.58+'px Arial';c.textAlign='center';c.fillText(String(t.points||1),0,s*.19);
  c.restore();};
 S.drawLens=(c,r,now,x,y,w,h)=>{const f=r.lensSauce;if(!f)return;const age=now-f.at;if(age>=f.life){r.lensSauce=null;return;}const fade=1-SK.clamp((age-f.hold)/(f.life-f.hold),0,1),color={ketchup:'#c93627',mustard:'#d9ad16',yellowball:'#e2cd41',snowball:'#e8f7ff'}[f.kind];c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.globalAlpha=fade*.88;
  const spots=[[.12,.22,.11],[.38,.13,.13],[.68,.22,.15],[.88,.42,.12],[.24,.49,.17],[.57,.57,.16],[.10,.76,.12],[.79,.80,.14]];
  for(let i=0;i<spots.length;i++){const [px,py,rr]=spots[i],xx=x+w*px,yy=y+h*py+Math.min(age,4)*h*(f.kind==='yellowball'?.022:.006),radius=Math.min(w,h)*rr;
   c.fillStyle=color;c.beginPath();for(let j=0;j<=80;j++){const a=j/80*TAU,rad=radius*(1+.11*Math.sin(a*5+i)+.065*Math.cos(a*9-i));const sx=xx+Math.cos(a)*rad,sy=yy+Math.sin(a)*rad*.8;if(j===0)c.moveTo(sx,sy);else c.lineTo(sx,sy);}c.closePath();c.fill();
   c.strokeStyle=color;c.lineCap='round';for(let k=0;k<3;k++){const dx=(k-1)*radius*.48,tip=yy+radius*.4+age*h*(f.kind==='yellowball'?.06:.018)*(1+(i+k)%3*.35);c.lineWidth=radius*(k===1?.22:.12);c.beginPath();c.moveTo(xx+dx,yy);c.bezierCurveTo(xx+dx+5,yy+radius,xx+dx-4,tip-15,xx+dx,tip);c.stroke();circle(c,xx+dx,tip,c.lineWidth*.6,color);}
   circle(c,xx-radius*.3,yy-radius*.35,radius*.11,'#ffffff50');for(let k=0;k<3;k++){const a=i+k*2.1;circle(c,xx+Math.cos(a)*radius*1.22,yy+Math.sin(a)*radius, radius*(.045+k*.018),color);}
  }c.restore();};
})(window.SK);
