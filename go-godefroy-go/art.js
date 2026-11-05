/* Original illustrated scenery and pose animation. Physics stays in physics.js. */
const valleyArt=new Image(),flyingArt=new Image(),knightPoses=new Image(),shieldRider=new Image();
shieldRider.src='assets/godefroy-shield-poses.png';
knightPoses.src='assets/godefroy-poses.png';
valleyArt.src='assets/vallee.png';flyingArt.src='assets/godefroy-vol.png';
// Match the prone helmet (~27% of this image) to the standing/gripping helmet (~54px).
const PRONE_KNIGHT_WIDTH=200;
const buriedKnight=new Image(),gullAtlas=new Image();
buriedKnight.src='assets/godefroy-buried.png';gullAtlas.src='assets/gull-flap.png';
function buriedKnightArt(x,ground,age){
 if(!buriedKnight.complete||!buriedKnight.naturalWidth)return false;
 const cw=buriedKnight.naturalWidth/2,ch=buriedKnight.naturalHeight/2;
 const frame=reducedMotion.matches?0:[0,2,1,3][Math.floor(age*8)%4],size=155;
 ctx.save();ctx.translate(x,ground+7);
 // Keep the dirt line fixed while the legs cycle above it.
 ctx.drawImage(buriedKnight,frame%2*cw,Math.floor(frame/2)*ch,cw,ch,-size/2,-size*.93,size,size);
 ctx.restore();return true;
}
function gullArt(x,y,time,scared=false){
 if(!gullAtlas.complete||!gullAtlas.naturalWidth)return;
 const cw=gullAtlas.naturalWidth/3,ch=gullAtlas.naturalHeight/2;
 const frame=reducedMotion.matches?1:[0,1,2,1][Math.floor(time*(scared?14:7))%4];
 ctx.drawImage(gullAtlas,frame*cw,scared?ch:0,cw,ch,x-90,y-135,180,270);
}
function gullCry(x,y){
 ctx.save();ctx.translate(x,y);ctx.rotate(.035);
 ctx.font="900 27px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#fffbe5';ctx.lineWidth=6;ctx.fillStyle='#26353b';
 for(const [line,dy] of [['AAAAA-HA-HAH !',0],['AU SECOURS !',29]]){ctx.strokeText(line,0,dy);ctx.fillText(line,0,dy);}
 ctx.restore();
}
const motion={skates:[],scrape:[],scrapeClock:0,scrapeSeed:0,wheelAngle:0,rollContact:null,farts:[],foam:[],foamClock:0,foamSeed:0,soap:null,slack:0,time:0,pitch:0,particles:[],emit:0,landed:false,shake:0,wallSlow:0,recoil:0,rings:[]};
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function resetArt(){motion.sorcDownAt=undefined;motion.dragonX=undefined;motion.dragonY=undefined;motion.portalY=undefined;motion.portalExit=null;motion.sorcY=undefined;motion.kaboom=null;motion.explosion=null;motion.flash=0;motion.choir=null;motion.takeoff=null;motion.skates=[];motion.scrape=[];motion.scrapeClock=0;motion.scrapeSeed=0;motion.wheelAngle=0;motion.rollContact=null;motion.foam=[];motion.foamClock=0;motion.foamSeed=0;motion.soap=null;motion.slack=0;motion.time=0;motion.pitch=0;motion.particles=[];motion.farts=[];motion.emit=0;motion.landed=false;motion.shake=0;motion.wallSlow=0;motion.recoil=0;motion.rings=[];}
function burst(x,y,count,color){for(let i=0;i<count;i++){const a=i*2.399,s=20+(i%7)*11;motion.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.abs(Math.sin(a))*s+15,life:.7+(i%5)*.13,max:1.3,size:3+i%5,color});}if(motion.particles.length>150)motion.particles.splice(0,motion.particles.length-150);}
function impactArt(x,y){burst(x,y,14,'#d8b484');for(let i=0;i<12;i++)motion.particles.push({x:x+5,y,vx:(i%3-1)*8,vy:20+(i%5)*12,life:.65+(i%4)*.12,max:1.1,size:5+i%6,color:i%2?'#a7a18e':'#777d75',stone:true});motion.shake=.18;}
function wallImpactArt(hit){
 const force=Math.min(1,Math.sqrt(hit.energy)/180),count=Math.min(36,8+hit.count*5);
 motion.shake=Math.max(motion.shake,.65+force*.8);motion.wallSlow=Math.max(motion.wallSlow,.24+force*.12);motion.recoil=1;
 motion.rings.push({x:hit.x,y:hit.y,life:.3,max:.3,force});if(motion.rings.length>6)motion.rings.shift();
 for(let i=0;i<count;i++){const seed=(i*17+hit.count*13)%31,life=1.3+seed/31;motion.particles.push({x:hit.x,y:hit.y+(i%5-2)*7,vx:(i%3===0?1:-1)*(14+seed)*(1+force),vy:35+seed*4,life,max:life,size:6+seed*.34+force*5,color:['#b4ac96','#85877c','#c2b89f'][i%3],stone:true,spin:(i%2?1:-1)*(2+seed*.12)});}
 for(let i=0;i<12;i++){const life=.5+i*.045;motion.particles.push({x:hit.x,y:hit.y,vx:-12-i*2,vy:(i%5-2)*20,life,max:life,size:13+i*2,color:'#cfbea0'});}
 if(motion.particles.length>240)motion.particles.splice(0,motion.particles.length-240);
}
function updateShieldScrape(dt){
 if(dt<=0)return;
 for(const p of motion.scrape){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='dust'?-20:110)*dt;p.rotation+=p.spin*dt;}
 motion.scrape=motion.scrape.filter(p=>p.life>0);
 if(reducedMotion.matches||state!=='launching'||launchTime<=0||!flight||!['shield','pan'].includes(GGLaunch.get(flight.l.launch).type))return;
 const progress=Math.min(1,launchTime/launchDuration);if(progress>=1)return;
 const pose=GGCourse.launchPose(progress,flight.launchAngle,flight.launchSpeed,flight.l.launch),strength=Math.min(1,pose.speed/28);
 const pan=GGLaunch.get(flight.l.launch).type==='pan',metal=pan||flight.l.launch===1;
 const intensity=progress*progress*strength;
 motion.scrapeClock+=dt*(3+intensity*(pan?190:65));
 while(motion.scrapeClock>=1){
  motion.scrapeClock--;const n=motion.scrapeSeed++,seed=(n*37%101)/101,kind=flight.l.launch===3&&n%2===0?'grease':metal&&(pan?n%5!==0:n%4===0)?'spark':n%3===0?'chip':'dust';
  const along=(pan?[-48,-16,20,48][n%4]:n%4===0?55:-45)+(seed-.5)*18,x=pose.contactX+along*Math.cos(pose.rotation),y=GGCourse.rampY(x,flight.launchAngle,flight.l.launch)-3;
  const life=kind==='spark'?.16+seed*.15:kind==='grease'?.5+seed*.35:kind==='chip'?.45+seed*.3:.4+seed*.45;
  motion.scrape.push({x,y,life,max:life,kind,size:kind==='dust'?3+seed*4+strength*2:2+seed*3,vx:kind==='spark'?45+seed*80:-25-seed*60-strength*30,vy:-15-seed*65,rotation:seed*6,spin:(seed-.5)*12});
 }
 if(motion.scrape.length>100)motion.scrape.splice(0,motion.scrape.length-100);
}
function shieldScrapeArt(cx,cy){
 for(const p of motion.scrape){
  ctx.save();ctx.translate(p.x-cx*GGCourse.X_SCALE,p.y+cy*GGCourse.SCALE);ctx.globalAlpha=p.kind==='dust'?.8*p.life/p.max:Math.min(1,p.life/.18);
  if(p.kind==='dust'){const s=p.size*(1+(1-p.life/p.max)*.7);ellipse(0,0,s,s*.7,'#d9bc8c');ellipse(-s*.7,-s*.1,s*.65,s*.5,'#e8cfa0');ellipse(s*.35,-s*.55,s*.6,s*.55,'#e8cfa0');}
  else if(p.kind==='grease'){ctx.globalAlpha=Math.min(1,p.life/.2);ellipse(0,0,p.size*1.2,p.size*1.6,'#f0b030','#6a3d0a');ellipse(-p.size*.3,-p.size*.5,p.size*.35,p.size*.5,'#fff3c4');}
  else if(p.kind==='chip'){ctx.rotate(p.rotation);path([[-p.size,-2],[p.size,-p.size*.4],[p.size*.5,2],[-p.size*.5,3]],'#b98c55','#765333',1);}
  else{ctx.rotate(Math.atan2(p.vy,p.vx));line([[-p.size*4,0],[p.size,0]],'#ffe397',2);line([[0,-p.size],[0,p.size]],'#fff5b8',1.5);}
  ctx.restore();
 }
}
function updateArt(dt){motion.time+=dt;updateShieldScrape(dt);
 if(state==='launching'&&flight&&['skate','skates'].includes(GGLaunch.get(flight.l.launch).type)){
  const p=GGCourse.launchPose(Math.max(0,Math.min(1,launchTime/launchDuration)),flight.launchAngle,flight.launchSpeed,flight.l.launch);
  const contact={x:p.contactX,y:GGCourse.rampY(p.contactX,flight.launchAngle,flight.l.launch)};
  if(motion.rollContact&&dt>0)motion.wheelAngle+=Math.hypot(contact.x-motion.rollContact.x,contact.y-motion.rollContact.y)/7.7;
  motion.rollContact=contact;
 }

 motion.slack+=((flight?.stalled?1:0)-motion.slack)*(1-Math.exp(-dt*5));
 for(const skate of motion.skates)stepSoap(skate,dt);motion.skates=motion.skates.filter(s=>s.age<10);
 if(motion.soap){stepSoap(motion.soap,dt);if(motion.soap.age>8)motion.soap=null;}
 for(const p of motion.foam){p.life-=dt;p.x+=p.vx*dt;p.y-=p.rise*dt;}
 motion.foam=motion.foam.filter(p=>p.life>0);
 if(state==='launching'&&launchTime>0&&flight&&GGLaunch.get(flight.l.launch).type==='soap'){
  const pose=GGCourse.launchPose(Math.min(1,launchTime/launchDuration),flight.launchAngle,flight.launchSpeed,flight.l.launch);
  motion.foamClock+=dt*(12+Math.min(60,pose.speed*.5));
  while(motion.foamClock>=1){motion.foamClock--;const i=motion.foamSeed++,bubble=i%3===0,life=bubble?1.5: .85;
   motion.foam.push({x:pose.contactX-50*Math.cos(pose.rotation),y:rampY(pose.contactX)-50*Math.sin(pose.rotation)-7,life,max:life,size:bubble?4+i%6:3+i%5,rise:bubble?18+i%14:2,vx:-10-i%9,bubble});
  }
 }
 if(motion.foam.length>160)motion.foam.splice(0,motion.foam.length-160);

motion.shake=Math.max(0,motion.shake-dt*2.3);motion.flash=Math.max(0,(motion.flash||0)-dt);motion.wallSlow=Math.max(0,motion.wallSlow-dt);motion.recoil=Math.max(0,motion.recoil-dt*7);for(const ring of motion.rings)ring.life-=dt;motion.rings=motion.rings.filter(r=>r.life>0);if(flight){motion.pitch+=(flight.pitch-motion.pitch)*(1-Math.exp(-dt*10));if(state==='landing'&&!motion.landed){motion.landed=true;motion.shake=Math.max(motion.shake,['ground','wall','tower'].includes(flight.endReason)?.85:.15);burst(flight.x,flight.y,['ground','wall','tower'].includes(flight.endReason)?65:24,'#d7bd91');}if(state==='flight'&&flight.boosting){const n=flight.l.boost||0,step=.035/(1+n*.14);motion.emit+=dt;while(motion.emit>step){motion.emit-=step;motion.particles.push({x:flight.x-10-n*.6,y:flight.y-2,vx:-20-n*3,vy:12,life:.6+n*.04,max:.6+n*.04,size:7+n*1.1,color:n>=2?'#dcefff':'#f3dfc6'});}}}for(const p of motion.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=dt*(p.smoke?-30:p.stone?240:65);if(p.stone&&p.y<0){p.y=0;p.vy=Math.abs(p.vy)*.28;p.vx*=.55;}}motion.particles=motion.particles.filter(p=>p.life>0);}
function rounded(x,y,w,h,r,fill,stroke='#313b42',lw=3){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function rampY(x){return GGCourse.rampY(x,flight?.launchAngle??GGCourse.LAUNCH_ANGLE,flight?.l.launch??save.levels.launch);}
function timber(x,y,w,h){rounded(x,y,w,h,3,'#bb8854','#503c31',3);line([[x+4,y+5],[x+w-4,y+5]],'#e5bb77',2);for(let i=0;i<2;i++)ellipse(x+5+i*(w-10),y+h/2,2,2,'#51473d');}
// The physical contact curve is the centre of a wide, perspective wooden deck.
// Every edge and plank uses the current upgrade's geometry and local tangent.
function rampDeckPoint(x,across=0,level=flight?.l.launch??save.levels.launch){
 const angle=flight?.launchAngle??GGCourse.LAUNCH_ANGLE;
 const rotation=Math.atan(GGCourse.rampSlope(x,angle,level));
 return [x-Math.sin(rotation)*across,GGCourse.rampY(x,angle,level)+Math.cos(rotation)*across];
}
function rampArt(camX,camY){
 const level=flight?.l.launch??save.levels.launch,r=GGCourse.rampGeometry(level),rear=-68,front=12;
 const point=(x,v)=>rampDeckPoint(x,v,level);
 const left=Math.max(-80,camX*GGCourse.X_SCALE-260),right=Math.min(r.end,camX*GGCourse.X_SCALE+1800/inspectionZoom+260);
 ctx.save();ctx.translate(-camX*GGCourse.X_SCALE,camY*GGCourse.SCALE);
 // The starting hill keeps its proportions under taller and longer ramps.
 path([[-2400,r.top+30],[20,r.top+30],[r.turn*.256,r.top+(r.bottom-r.top)*.78],[r.turn*.476,485],[-2400,485]],'#a6c863','#476642',3);
 // Two rows of posts, with diagonal braces, carry the taller upgraded ramps.
 for(let x=0;x<r.end;x+=105){
  if(x<left-110||x>right+110)continue;
  const back=point(x,rear),near=point(x,front),next=point(Math.min(r.end,x+105),front);
  if(back[1]<480)timber(back[0]-5,back[1]+8,10,Math.max(0,485-back[1]-8));
  if(near[1]<480){
   line([[near[0]+7,near[1]+30],[next[0]-3,478]],'#573f2c',11);
   line([[near[0]+7,near[1]+30],[next[0]-3,478]],'#a57545',6);
   timber(near[0]-7,near[1]+12,15,Math.max(0,485-near[1]-12));
  }
 }
 // Rear curb, behind the rider; the near edge stays low so the contact is visible.
 for(let x=Math.max(0,Math.floor(left/24)*24);x<right;x+=24){
  const end=Math.min(r.end,x+24),a=point(x,rear),b=point(end,rear);
  path([[a[0],a[1]-18],[b[0],b[1]-18],b,a],'#a77547','#513c2d',2);
  line([[a[0],a[1]-18],[b[0],b[1]-18]],'#e9bd7c',3);
 }
 // Individual cross-planks with fixed grain and nails (no frame-random texture).
 for(let x=Math.max(0,Math.floor(left/20)*20);x<right;x+=20){
  const end=Math.min(r.end,x+20),a=point(x,rear),b=point(end,rear),c=point(end,front),d=point(x,front),i=Math.floor(x/20);
  path([a,b,c,d],['#c99a65','#d2a36d','#bd8c57','#d7aa74'][i%4],'#694a31',1.6);
  line([point(x+2,rear+3),point(x+2,front-2)],'#f0c992',1.4);
  for(let g=0;g<3;g++){
   const u=x+5+g*4,seed=(i*17+g*11)%13;
   line([point(u,rear+9+seed),point(u+1,rear+28+seed),point(u-.5,front-10)],'#986a41',.9);
  }
  for(const across of [rear+6,front-6]){const nail=point(x+10,across);ellipse(nail[0],nail[1],1.5,1.5,'#68503b');}
 }
 // Thick visible fascia follows the same curve, including the launch lip.
 for(let x=Math.max(0,Math.floor(left/20)*20);x<right;x+=20){
  const end=Math.min(r.end,x+20),a=point(x,front),b=point(end,front);
  path([a,b,[b[0],b[1]+17],[a[0],a[1]+17]],'#a97848','#573e2c',1.8);
  line([a,b],'#edbf80',3);
  line([[a[0]+3,a[1]+7],[b[0]-3,b[1]+7]],'#c4935d',1);
 }
 const endRear=point(r.end,rear),endFront=point(r.end,front);
 path([endRear,endFront,[endFront[0],endFront[1]+17],[endRear[0],endRear[1]+17]],'#ac7c4e','#573e2c',2);
 ctx.restore();
}
// Big illustrated castle at the first obstacle, drawn at full size with thin outlines.
function castleArt(x,ground,destroyed){
 ctx.save();ctx.translate(x,ground);
 const t=reducedMotion.matches?0:motion.time,INK='#4b4b46',tones=['#cbc1a5','#d9d0b6','#c4b99c'];
 ellipse(0,8,430,16,'#2f3f2e2e');
 const stone=(sx,sy,w,h,fill)=>rounded(sx,sy,w,h,3,fill,'#a89e86',1.5);
 const crenels=(left,right,y,wide=36,gap=22)=>{for(let cx=left;cx+wide<=right+1;cx+=wide+gap)rounded(cx,y-30,wide,34,3,'#e2d9c0',INK,3);};
 const window=(wx,wy,w=14)=>{ctx.beginPath();ctx.moveTo(wx-w,wy+30);ctx.lineTo(wx-w,wy);ctx.arc(wx,wy,w,Math.PI,0);ctx.lineTo(wx+w,wy+30);ctx.closePath();ctx.fillStyle='#f6c35a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();line([[wx,wy-w+2],[wx,wy+30]],INK,2);line([[wx-w,wy+10],[wx+w,wy+10]],INK,2);};
 // Curtain wall between the towers.
 rounded(-270,-500,540,500,6,'#d6ccb0',INK,3);
 ctx.save();ctx.beginPath();ctx.rect(-268,-498,536,498);ctx.clip();
 for(let row=0;row<13;row++){const y=-492+row*38;for(let col=0;col<10;col++){const sx=-292+col*60+(row%2?30:0);stone(sx,y,56,32,tones[(row+col)%3]);}}
 ctx.restore();
 line([[-262,-462],[262,-462]],'#a39a82',2);
 crenels(-262,262,-500);
 // Round towers with conical roofs, pennants and lit windows.
 for(const side of [-1,1]){const tx=side*330;
  rounded(tx-80,-640,160,640,8,'#d9cfb3',INK,3);
  ctx.save();ctx.beginPath();ctx.rect(tx-78,-638,156,638);ctx.clip();
  for(let row=0;row<17;row++){const y=-632+row*38;for(let col=0;col<4;col++){const sx=tx-104+col*54+(row%2?27:0);stone(sx,y,50,32,tones[(row+col)%3]);}}
  ctx.globalAlpha=.28;rect(tx+10,-640,70,640,'#6d6350');ctx.globalAlpha=.18;rect(tx-80,-640,26,640,'#ffffff');ctx.globalAlpha=1;
  ctx.restore();
  rounded(tx-94,-662,188,28,5,'#e2d9c0',INK,3);crenels(tx-90,tx+90,-662,28,18);
  for(const wy of [-560,-420,-280])window(tx,wy);
  path([[tx-104,-690],[tx,-866],[tx+104,-690]],'#c0463a',INK,3);
  for(let k=1;k<5;k++){const y=-690-k*36,hw=104*(1-k*36/176);line([[tx-hw,y],[tx+hw,y]],'#8e3129',2);}
  path([[tx-84,-696],[tx-10,-842],[tx-44,-702]],'#d6584b',null);
  line([[tx,-866],[tx,-936]],'#5a4a3a',4);ellipse(tx,-940,6,6,'#f1c75d',INK);
  path([[tx,-932],[tx+74+Math.sin(t*3+side)*5,-918+Math.sin(t*4+side)*6],[tx,-902]],'#e04a3c',INK,2);
 }
 // Gatehouse with its arch, portcullis, lanterns and coat of arms.
 rounded(-150,-600,300,600,6,'#cfc5a8',INK,3);
 ctx.save();ctx.beginPath();ctx.rect(-148,-598,296,598);ctx.clip();
 for(let row=0;row<16;row++){const y=-592+row*38;for(let col=0;col<6;col++){const sx=-172+col*60+(row%2?30:0);stone(sx,y,56,32,tones[(row+col+1)%3]);}}
 ctx.restore();
 crenels(-142,142,-600);
 line([[0,-600],[0,-690]],'#5a4a3a',4);path([[0,-688],[64+Math.sin(t*3.3)*5,-676+Math.sin(t*4.4)*5],[0,-660]],'#2d5fa6',INK,2);
 ctx.beginPath();ctx.moveTo(-88,0);ctx.lineTo(-88,-210);ctx.arc(0,-210,88,Math.PI,0);ctx.lineTo(88,0);ctx.closePath();ctx.fillStyle='#8f8670';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-72,0);ctx.lineTo(-72,-210);ctx.arc(0,-210,72,Math.PI,0);ctx.lineTo(72,0);ctx.closePath();ctx.fillStyle=destroyed?'#1f2626':'#2d3838';ctx.fill();
 for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;ellipse(Math.cos(a)*80,-210+Math.sin(a)*80,7,5,'#b9ae92',null);}
 if(!destroyed){for(let i=0;i<6;i++)rounded(-62+i*22,-262,10,262,3,'#9c714c','#4c3c31',1.5);for(const y of [-200,-120,-42])rounded(-70,y,140,9,2,'#5f5f5a',null);ellipse(14,-110,4,4,'#dfc982');}
 else for(let i=0;i<6;i++){ctx.save();ctx.translate(-56+i*22,-8);ctx.rotate((i-2)*.32);timber(-5,-10,10,30);ctx.restore();}
 for(const side of [-1,1]){const lx=side*112;rounded(lx-9,-262,18,26,3,'#f6c35a',INK,2.5);path([[lx-13,-262],[lx,-276],[lx+13,-262]],'#5f5f5a',INK,2);ctx.globalAlpha=.22;ellipse(lx,-248,30,24,'#ffd96a');ctx.globalAlpha=1;}
 path([[-36,-452],[36,-452],[36,-406],[0,-376],[-36,-406]],'#2d5fa6','#f1c75d',3);path([[0,-440],[16,-416],[0,-392],[-16,-416]],'#f1c75d',null);
 line([[-36,-430],[36,-430]],'#f1c75d',3);
 // Moss, ivy and grass at the foot of the walls.
 for(const [mx,my,r] of [[-300,-4,18],[-236,-6,13],[-120,-5,16],[88,-6,12],[160,-4,15],[250,-6,14],[330,-5,19]])ellipse(mx,my,r,7,'#7fb24a','#4e7a2a');
 for(let i=0;i<9;i++){const ix=-386+i*12+Math.sin(i*3)*6,iy=-40-i*44;ellipse(ix,iy,9,6,'#5f9a3a','#3f6b26');ellipse(ix-9,iy-12,6,4,'#6faa43',null);}
 ctx.restore();
}
// The level-zero cape is already painted on the flying knight, attached at his neck.
// Overlay only the purchased gliders; a second cape would float above the sprite.
function gliderArt(level){if(level>=0)return;ctx.save();ctx.translate(-4,-29);GGEquipment.draw(ctx,'wing',level,0,0,.82);ctx.restore();}
// The booster is strapped on the knight's back, nozzle pointing backwards (left).
function boosterArt(context,level,standing=false){if(flight?(flight.fartMode||!(flight.maxFuel>0)):!save.witchFound)return;context.save();if(standing){context.translate(-40,-4);context.rotate(-1.15);}else context.translate(-26,-30);GGEquipment.draw(context,'boost',level,0,0,.36);context.restore();}
// Exhaust flame drawn at the nozzle: longer, wider and brighter with each booster level.
function boostFlameArt(level,x,y,angle=0,t=motion.time){
 const n=Math.max(0,Math.min(8,level)),size=1+n*.26,storm=n>=2,pulse=reducedMotion.matches?0:Math.sin(t*44)*4+Math.sin(t*23)*3;
 const len=(34+pulse)*size,wid=9*size;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);
 path([[0,-wid*.9],[-len*.55,-wid*1.35],[-len*.85,-wid*.4],[-len*1.55-pulse,0],[-len*.85,wid*.4],[-len*.55,wid*1.35],[0,wid*.9]],storm?'#49b7ff':'#f5963a',storm?'#2470b8':'#c85531',2);
 path([[0,-wid*.55],[-len*.5,-wid*.7],[-len*.95-pulse*.5,0],[-len*.5,wid*.7],[0,wid*.55]],storm?'#bdf0ff':'#ffd36a',null);
 path([[0,-wid*.25],[-len*.4,-wid*.3],[-len*.55,0],[-len*.4,wid*.3],[0,wid*.25]],'#fffbe6',null);
 if(n>=1&&!reducedMotion.matches)for(let i=0;i<2+n;i++){const q=(t*(.9+i*.11)+i*.37)%1;ellipse(-len*(.7+q*1.4),Math.sin(i*2.1+t*9)*wid*1.3,3*size*(1-q)+1,3*size*(1-q)+1,storm?'#dff6ff':'#ffe9a0');}
 ctx.restore();
}
function drawGearPreview(){
 const preview=$('gear-preview');if(!preview)return;const p=preview.getContext('2d'),gear=forgeSelections.launch??save.levels.launch,item=GGLaunch.get(gear),t=reducedMotion.matches?0:clock;
 // Same knight size in every tab: wings are drawn at the flight scale ×1.7 (like the launch gear) and the canvas grows around them,
 // with negative margins so the forge layout does not move.
 const wingId=forgeCategory==='wing'?(forgeSelections.wing??save.levels.wing):0,wb=wingId>0?GGWingArt.bounds(wingId):null,PS=1.7;
 let W=600,H=360,anchorY=0;
 if(wb){const bottom=Math.max(150,wb.down*PS+10);W=Math.max(600,Math.ceil(2*Math.max(wb.left,wb.right)*PS+20));H=Math.max(360,Math.ceil(wb.up*PS+bottom+10));anchorY=H-bottom;}
 if(preview.width!==W||preview.height!==H){preview.width=W;preview.height=H;const k=262/360;preview.style.cssText=W===600&&H===360?'':`width:${W*k}px;height:${H*k}px;aspect-ratio:auto;max-height:none;max-width:none;margin:${-(H-360)*k}px ${-(W-600)*k/2}px 0`;}
 p.clearRect(0,0,W,H);p.save();
 if(wb){p.translate(W/2,anchorY);p.scale(PS,PS);GGWingArt.draw(p,wingId,1,t,reducedMotion.matches);}
 else if(wingId>0){GGWingArt.preview(p,wingId,t);}
 else if(gear===0&&shieldRider.complete&&shieldRider.naturalWidth){
  const frame=shieldRiderFrame(0,t,true,reducedMotion.matches),cw=shieldRider.naturalWidth/3,ch=shieldRider.naturalHeight/2;
  p.drawImage(shieldRider,frame%3*cw,Math.floor(frame/3)*ch,cw,ch,120,0,360,360);
 }else{
  p.translate(300,285);p.scale(1.7,1.7);
  mountedArt(p,{x:0,y:0,rotation:Math.sin(t*2)*.012},gear,0,true);
 }
 p.restore();preview.setAttribute('aria-label','Godefroy avec '+item.name+' · '+GG.itemName(GG.categories[1],save.levels.wing));
}
// Deform the illustrated cloth at render time. The neck and lower armour stay fixed.
// Each strip shares a fixed lower seam, so there is no second cape or detached overlay.
let flyingClothSource=null,flyingClothFrame=null;
function flyingKnightArt(w,h,flutter,target=ctx,time=motion.time){
 if(!flutter){target.drawImage(flyingArt,-w*.52,-h*.61,w,h);return;}
 if(!flyingClothSource){flyingClothSource=document.createElement('canvas');flyingClothSource.width=512;flyingClothSource.height=Math.round(512*flyingArt.naturalHeight/flyingArt.naturalWidth);flyingClothSource.getContext('2d').drawImage(flyingArt,0,0,flyingClothSource.width,flyingClothSource.height);flyingClothFrame=document.createElement('canvas');flyingClothFrame.width=512;flyingClothFrame.height=flyingClothSource.height;}
 const c=flyingClothFrame.getContext('2d'),sh=flyingClothSource.height,split=Math.round(sh*.5),wind=Math.min(1,Math.hypot(flight?.vx??0,flight?.vy??0)/200),phase=time*(flight?.stalled?26:8+wind*8);
 c.clearRect(0,0,512,sh);c.imageSmoothingEnabled=false;
 for(let x=0;x<512;x++){const tail=Math.max(0,Math.min(1,(512*.51-x)/(512*.36))),wave=Math.round(tail*(motion.slack*48+(reducedMotion.matches?0:(1-motion.slack)*((5+wind*12)*Math.sin(phase+x/512*17)-(flight?.capeLoad||0)*13))));c.drawImage(flyingClothSource,x,0,1,split,x,wave,1,split-wave);}
 c.drawImage(flyingClothSource,0,split,512,sh-split,0,split,512,sh-split);target.drawImage(flyingClothFrame,-w*.52,-h*.61,w,h);
}
function soapArt(x,y,rotation=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
 ellipse(0,7,55,15,'#dd629f','#823b63');
 ellipse(0,0,55,15,'#ffa4cf','#823b63');
 ctx.beginPath();ctx.ellipse(-5,-2,43,9,0,Math.PI*1.1,Math.PI*1.85);ctx.strokeStyle='#ffe1f0';ctx.lineWidth=3;ctx.stroke();
 ctx.font="800 10px 'Nunito',sans-serif";ctx.fillStyle='#bb4e86';ctx.textAlign='center';ctx.fillText('SAVON',0,5);ctx.restore();
}
// Wheel axles cross the same 22-unit timber joints that rampArt draws.
function skateboardRattle(pose,moving){
 if(!moving)return {lift:0,tilt:0};
 const strength=Math.min(1,pose.speed/45);
 const bump=x=>{const phase=((x-8)%22+22)%22,d=Math.min(phase,22-phase);return Math.exp(-d*d/8)*strength*2.2;};
 const back=bump(pose.contactX-33*Math.cos(pose.rotation)),front=bump(pose.contactX+33*Math.cos(pose.rotation));
 return {lift:-(front+back)*.5,tilt:(back-front)/66};
}
function skateboardArt(x,y,rotation=0,level=flight?.l.launch??save.levels.launch){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(1,deckDepth(level));
 GGEquipment.draw(ctx,'launch',level,0,0,level===0?.55:(level===1?200:GGLaunch.get(level).standing?170:160)/220);
 if(GGRiders.loaded)skateWheelsArt(ctx,level,160/271);
 if(!GGRiders.loaded)for(const wheelX of [-33,33]){ctx.save();ctx.translate(wheelX,18);ctx.rotate(reducedMotion.matches?0:motion.wheelAngle);line([[-4,0],[4,0]],'#85613b',1.5);ellipse(4,-2,1.7,1.7,'#fff5cf');ctx.restore();}
 ctx.restore();
}
function launchObjectArt(level,x,y,rotation=0){
 const g=GGLaunch.get(level);
 if(g.type==='skate'){skateboardArt(x,y,rotation,level);return;}
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(1,deckDepth(level));if(level===0)ctx.scale(1.5,1.5);
 if(['meteor','gargoyle','carpet','rune'].includes(g.type)){ctx.save();ctx.globalAlpha=.14+.06*Math.sin(motion.time*4);ellipse(0,0,68,24,g.type==='meteor'?'#ffe47f':'#a3eeed');ctx.restore();}
 const running=state==='launching'&&launchTime>0,progress=running?Math.min(1,launchTime/launchDuration):0;
 ctx.save();if(g.type==='soap')ctx.scale(1-progress*(level===5?.18:.04),1-progress*(level===5?.12:.02));
 GGEquipment.draw(ctx,'launch',level,0,0,level===0?.55:(level===1?200:GGLaunch.get(level).standing?170:160)/220);ctx.restore();
 if(running&&[14,15,20,24].includes(level)&&!reducedMotion.matches){for(let i=0;i<6;i++){const age=(motion.time*2+i/6)%1;ctx.globalAlpha=(1-age)*.65;const px=-50-age*55,py=4+Math.sin(i*2)*age*15;if(level===24){path([[px,py-4],[px+2,py-1],[px+5,py],[px+2,py+1],[px,py+4],[px-2,py+1],[px-5,py],[px-2,py-1]],'#ffe7a1',null);}else ellipse(px,py,2+age*6,2+age*4,level===20?'#d6a3ff':'#9de6ff');}ctx.globalAlpha=1;}
 if(g.type==='rune'){for(let i=0;i<4;i++){ctx.globalAlpha=running&&progress>(i+1)/5?1:.3;rounded(-35+i*23,-6,12,7,2,'#79edff',null);}ctx.globalAlpha=1;}
 if(state==='launching'&&launchTime>0&&[14,15,17,18,19,20,24].includes(level)){
  const color=level===19?'#73ef9d':level===20?'#cf9cff':level===24?'#ffe78f':'#88dafa';
  const pulse=reducedMotion.matches?0:Math.sin(motion.time*30)*5;
  path([[-49,-4],[-75-pulse,-13],[-65,0],[-86-pulse,10],[-49,6]],color,null);
 }
 ctx.restore();
}
function launchPoseFrame(progress,time,moving,reduced=false){
 return !moving||progress<.86?(reduced?0:((Math.floor(time*3)%2)+2)%2):progress<1?2:3;
}
// Illustrated poses preserve the original thick armour, gloves and boots.
function knightPoseArt(frame,grounded=false,gear=null,target=ctx){
 if(!knightPoses.complete||!knightPoses.naturalWidth){if(hero.complete&&hero.naturalWidth)target.drawImage(hero,-63,-100,126,155);return;}
 const anchors=[[270,466],[775,466],[1295,466],[275,967],[780,800],[1280,790]],a=frame===3&&!grounded?[275,800]:anchors[frame],sx=(frame%3)*512,sy=Math.floor(frame/3)*512,scale=.32;
 const dx=(sx-a[0])*scale,dy=(sy-a[1])*scale+(grounded?55:0);
 if(!grounded&&frame>=3&&target===ctx&&state==='flight')flutterPoseArt(target,frame,sx,sy,dx,dy,scale);
 else target.drawImage(knightPoses,sx,sy,512,512,dx,dy,512*scale,512*scale);
 if(grounded&&gear!==null&&GGLaunch.get(gear).type==='skates'){
  const soles=[[[207,460,0],[340,461,0]],[[698,463,0],[830,462,0]],[[1242,460,0],[1372,460,0]],[[204,941,.22],[282,931,-.15]],[[611,887,.7],[669,880,.7]],[[1082,837,1.05],[1138,858,1.05]]][frame];
  for(const [x,y,r] of soles)GGEquipment.drawSkate(target,gear,(x-a[0])*scale,(y-a[1])*scale+(grounded?55:0),36,r);
 }
}
// Animate only the cloth band of each pose; the seam beside the shoulder stays fixed.
let poseClothCanvas=null;
function flutterPoseArt(target,frame,sx,sy,dx,dy,scale){
 // Assemble on an integer pixel grid, then scale the complete silhouette ONCE.
 // Fractionally scaled adjacent strips caused the dark vertical seams.
 if(!poseClothCanvas){poseClothCanvas=document.createElement('canvas');poseClothCanvas.width=512;poseClothCanvas.height=512;}
 const c=poseClothCanvas.getContext('2d');c.clearRect(0,0,512,512);c.imageSmoothingEnabled=false;
 const b={3:{top:100,seam:268,end:220,slope:.45},4:{top:100,seam:320,end:240,slope:.48},5:{top:140,seam:308,end:255,slope:.30}}[frame];
 const wind=Math.min(1,Math.hypot(flight.vx,flight.vy)/160),slack=motion.slack||0,phase=motion.time*(flight.stalled?12:9+wind*9);
 for(let x=0;x<256;x++){
  const seam=Math.round(Math.max(b.top+1,b.seam-x*b.slope)),tail=Math.max(0,Math.min(1,(b.end-x)/150));
  const wave=Math.round(tail*(slack*42+(reducedMotion.matches?0:(1-slack)*(12+wind*22)*Math.sin(phase+x*.045))-(flight.capeLoad||0)*12));
  c.drawImage(knightPoses,sx+x,sy,1,b.top,x,0,1,b.top);
  c.drawImage(knightPoses,sx+x,sy+b.top,1,seam-b.top,x,b.top+wave,1,seam-b.top-wave);
  c.drawImage(knightPoses,sx+x,sy+seam,1,512-seam,x,seam,1,512-seam);
 }
 c.drawImage(knightPoses,sx+256,sy,256,512,256,0,256,512);
 target.drawImage(poseClothCanvas,dx,dy,512*scale,512*scale);
}
// A single illustrated silhouette keeps the boots, strap and thick shield connected.
function shieldRiderFrame(progress,time,moving,reduced=false){
 if(!moving||progress<.86)return reduced?0:[0,1,0,2][((Math.floor(time*4)%4)+4)%4];
 return progress<.94?3:4;
}
// Continuous wooden support strip across the centre of each shield.
// Use its upper contact row so the irregular black rim seats into the ramp.
const shieldSoles=[471,471,471,471,471,471];
function shieldRiderArt(pose,progress,moving,target=ctx){
 if(!shieldRider.complete||!shieldRider.naturalWidth||progress>=1)return false;
 const frame=shieldRiderFrame(progress,motion.time,moving,reducedMotion.matches),cw=shieldRider.naturalWidth/3,ch=shieldRider.naturalHeight/2,k=220/cw;
 // launchPose is 30 units above the ramp along its normal.
 // Anchor the continuous wooden strip directly to that surface.
 const x=pose.x-Math.sin(pose.rotation)*30,y=pose.y+Math.cos(pose.rotation)*30;
 target.save();target.translate(x,y);target.rotate(pose.rotation);
 target.drawImage(shieldRider,frame%3*cw,Math.floor(frame/3)*ch,cw,ch,-110,-shieldSoles[frame]*k,220,220);
 target.restore();return true;
}
function deckDepth(level){const type=GGLaunch.get(level).type;return ['soap','butter','skate','sled','carpet','rune'].includes(type)?.5:type==='skates'?.6:1;}
function mountedGeometry(pose,level){
 const item=GGLaunch.get(level),width=level===1?200:item.standing?170:160,height=item.type==='skates'?18:GGRiders.objectHeight(level,width)*deckDepth(level);
 const normal=item.standing?30:item.type==='skate'?48:37;
 const offset=normal-height*.65;
 return {width,height,rotation:pose.rotation,x:pose.x-Math.sin(pose.rotation)*offset,y:pose.y+Math.cos(pose.rotation)*offset};
}
function supportY(level,height){
 const type=GGLaunch.get(level).type;
 return type==='skates'?3:type==='pan'?height*.25:type==='tray'?height*.12:type==='gargoyle'||type==='meteor'?height*.16:height*.18;
}
function mountedBodyY(level,height){
 const item=GGLaunch.get(level);
 if(item.standing)return supportY(level,height)-55;
 const h=PRONE_KNIGHT_WIDTH*flyingArt.naturalHeight/flyingArt.naturalWidth;
 return (item.type==='cauldron'?height*.03:-height*.22)-h*.39+10;
}
// Seasoned pan (launch 3): golden grease runs over the front rim, hangs in fat drops that fall off, and spits around the feet.
function panGreaseArt(c,x,y,width,angle,time,moving){
 const still=reducedMotion.matches,rx=width*.33,ry=width*.06,cy0=-width*.115,drips=[[-.82,9],[-.5,17],[-.2,11],[.12,21],[.42,12],[.72,16]];
 const edge=u=>cy0+ry*Math.sqrt(Math.max(0,1-(u/rx)*(u/rx)));
 c.save();c.translate(x,y);c.rotate(angle);c.translate(-width*.08,0);
 const g=c.createLinearGradient(0,cy0-4,0,cy0+ry+26);g.addColorStop(0,'#ffd766');g.addColorStop(.55,'#e39a1f');g.addColorStop(1,'#a8620f');
 c.beginPath();for(let i=0;i<=44;i++){const u=-rx+2*rx*i/44;c[i?'lineTo':'moveTo'](u,edge(u)-4);}
 for(let i=44;i>=0;i--){const u=-rx+2*rx*i/44;let d=3;for(const [pos,len] of drips){const w=rx*.075,l=len+(still?0:Math.sin(time*1.6+pos*9)*3);d+=l*Math.exp(-Math.pow((u-pos*rx)/w,2));}c.lineTo(u,edge(u)+d);}
 c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#6a3d0a';c.lineWidth=2;c.lineJoin='round';c.stroke();
 for(const [pos,len] of drips){const u=pos*rx,l=len+(still?0:Math.sin(time*1.6+pos*9)*3);c.beginPath();c.ellipse(u-2,edge(u)+l*.55,1.6,3.2,0,0,7);c.fillStyle='#fff3c4';c.fill();
  if(!still){const q=(time*(moving?1.1:.55)+pos*3.7)%1,dy=edge(u)+l+4+q*q*34;c.globalAlpha=1-q;c.beginPath();c.moveTo(u,dy-6);c.quadraticCurveTo(u+4.5,dy+2,u,dy+4);c.quadraticCurveTo(u-4.5,dy+2,u,dy-6);c.fillStyle='#f0b030';c.fill();c.strokeStyle='#6a3d0a';c.lineWidth=1.2;c.stroke();c.globalAlpha=1;}}
 c.beginPath();c.moveTo(-rx*.7,edge(-rx*.7)-1);c.quadraticCurveTo(0,cy0+ry+3,rx*.7,edge(rx*.7)-1);c.strokeStyle='#fff3c4aa';c.lineWidth=2;c.stroke();
 if(!still)for(let i=0;i<5;i++){const q=(time*(moving?2.2:1.1)+i*.21)%1,sx=(i%2?1:-1)*rx*(.25+.13*i),h=Math.sin(q*Math.PI)*(moving?20:11);c.globalAlpha=1-q*.7;c.beginPath();c.ellipse(sx+q*(i%2?10:-10),cy0-ry*.4-h,2.6,3.2,0,0,7);c.fillStyle='#ffd766';c.fill();c.strokeStyle='#6a3d0a';c.lineWidth=1;c.stroke();}
 c.globalAlpha=1;c.restore();
}
function mountedArt(target,pose,level,progress,moving){
 const item=GGLaunch.get(level),deck=mountedGeometry(pose,level),time=target===ctx?motion.time:clock;
 // Integrated illustrations: the knight really stands inside the shield, pans and tray.
 if(level>=1&&level<=4&&GGRiders.loaded){
  const frame=progress>.86?2:reducedMotion.matches?0:[0,1,0,1][((Math.floor(time*3)%4)+4)%4];
  GGRiders.drawRider(target,level,frame,pose.x-Math.sin(pose.rotation)*29,pose.y+Math.cos(pose.rotation)*29,[200,200,220,220,214][level],pose.rotation);
  if(level===3)panGreaseArt(target,pose.x-Math.sin(pose.rotation)*29,pose.y+Math.cos(pose.rotation)*29,220,pose.rotation,time,moving);
  return;
 }
 target.save();target.translate(deck.x,deck.y);target.rotate(deck.rotation);
 if(item.type!=='skates'){target.save();target.scale(1,deckDepth(level));GGEquipment.draw(target,'launch',level,0,0,deck.width/220);if(item.type==='skate'&&GGRiders.loaded)skateWheelsArt(target,level,deck.width/271);target.restore();}
 if(item.standing){
  target.translate(0,mountedBodyY(level,deck.height));
  knightPoseArt(launchPoseFrame(progress,time,moving,reducedMotion.matches),true,level,target);
 }else{
  const w=PRONE_KNIGHT_WIDTH,h=w*flyingArt.naturalHeight/flyingArt.naturalWidth;
  target.translate(0,mountedBodyY(level,deck.height));
  // Rock around the belly's support point: the feet and head move, the
  // underside stays seated on the launcher throughout the loop.
  const pivot=h*.39-8,activity=moving?1:.6;
  target.translate(0,pivot);
  if(!reducedMotion.matches){target.rotate(Math.sin(time*3.4)*.024*activity);target.scale(1,1+Math.sin(time*4.1)*.012);}
  target.translate(0,-pivot);
  flyingKnightArt(w,h,!reducedMotion.matches,target,time);
  boosterArt(target,flight?.l.boost??save.levels.boost);
 }
 target.restore();
}
function stepSoap(s,dt){
 const step=dt*GGCourse.TIME_SCALE;s.age+=dt;
 if(s.resting)return;
 if(['skate','skates'].includes(GGLaunch.get(s.kind).type))motion.wheelAngle+=s.wheelRate*dt;
 s.x+=s.vx*step;s.y+=s.vy*step;s.vy-=95*step;s.rotation+=s.spin*step;if(GGLaunch.get(s.kind).type==='shield')s.rotation=-.1+Math.sin(s.age*3)*.28;
 const shield=GGLaunch.get(s.kind).type==='shield',bottom=s.height?s.height*.65:20;
 const clearance=(Math.abs(Math.sin(s.rotation))*(s.width?s.width/2:55)+Math.abs(Math.cos(s.rotation))*bottom)/GGCourse.SCALE;
 if(s.y<=clearance&&s.vy<0){s.y=clearance;s.bounces++;s.vy=Math.abs(s.vy)*.5;s.vx*=.88;s.spin*=-.65;
  if(s.bounces>=3||s.vy<8){s.resting=true;s.rotation=0;s.y=bottom/GGCourse.SCALE;s.vx=0;s.vy=0;}
 }
}
function releaseSoap(){
 const level=flight.l.launch,gear=GGLaunch.get(level),pose=GGCourse.launchPose(1,flight.launchAngle,flight.launchSpeed,level);
 const deck=mountedGeometry(pose,level),rotation=deck.rotation;
 const drop=(x,y,width,height,index=0)=>({kind:level,width,height,wheelRate:Math.min(100,flight.launchSpeed*GGCourse.X_SCALE*GGCourse.TIME_SCALE/7.7),x:(x-flight.originX)/GGCourse.X_SCALE,y:(485-y)/GGCourse.SCALE,vx:flight.vx*(.87-index*.07),vy:flight.vy*.1-index*8,rotation,spin:index?-4:3,bounces:0,resting:false,age:0});
 if(gear.type==='skates'){
  motion.soap=null;motion.skates=[-20,22].map((offset,i)=>drop(deck.x+offset*Math.cos(rotation),deck.y+offset*Math.sin(rotation),36,18,i));
 }else if(level===0){
  const height=GGRiders.objectHeight(level,181.5),baseX=pose.x-Math.sin(rotation)*30,baseY=pose.y+Math.cos(rotation)*30;
  motion.soap=drop(baseX+Math.sin(rotation)*height*.65,baseY-Math.cos(rotation)*height*.65,181.5,height);motion.soap.rotation=rotation;
 }else motion.soap=drop(deck.x,deck.y,deck.width,deck.height);
 // Retain the exact mounted body's position while easing into the flight anchor.
 const h=PRONE_KNIGHT_WIDTH*flyingArt.naturalHeight/flyingArt.naturalWidth;
 const localY=mountedBodyY(level,deck.height);
 const bodyX=deck.x-Math.sin(rotation)*localY,bodyY=deck.y+Math.cos(rotation)*localY;
 motion.takeoff=level===0?null:{x:bodyX-(flight.originX+flight.x*GGCourse.X_SCALE),y:bodyY-(485-flight.y*GGCourse.SCALE),rotation};

}
function heroArt(x,y,mode,angle=0,amount=0){const t=motion.time,idle=mode==='idle',crash=mode==='crash';ctx.save();ctx.translate(x,y);
 // Deform the complete equipped drawing: never replace it with an unequipped pose.
 if(mode==='flight'&&flight){const r=flight.monsterReaction,hitAge=r?.boing?flight.monsterTime-r.at:99,pressAge=flight.monsterTime-(flight.boingPress??-Infinity),pose=GGMonsters.boingPose(pressAge,hitAge,r?.rating);
 if(!reducedMotion.matches)ctx.scale(pose.sx,pose.sy);
 if(pose.glow>.02){ctx.save();ctx.globalAlpha=pose.glow*.75;ctx.strokeStyle=r?.rating==='perfect'?'#ffe878':'#9cf6ed';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,5,85+pose.glow*12,38+pose.glow*8,0,.15,Math.PI-.15);ctx.stroke();ctx.restore();}}
 if(mode==='flight'&&flight?.monsterReaction&&!flight.monsterReaction.boing&&!reducedMotion.matches){const reaction=flight.monsterReaction,age=flight.monsterTime-reaction.at;if(age>=0&&age<.95){const pose=GGMonsters.bouncePose(age,reaction.variant);const strength=reaction.ground?(reaction.strength||0)*.12:1;ctx.translate(0,reaction.ground?0:-Math.max(0,85-flight.y*GGCourse.SCALE)*Math.sin(Math.PI*age/.95));ctx.rotate(pose.angle*strength);ctx.scale(1+(pose.stretch-1)*strength,1+(pose.squash-1)*strength);}}
 // Ramp jump: crouch once the jump is called on the ramp, then a springy stretch when the kick lands.
 if(mode==='slide'&&state==='launching'&&rampJump?.pressed&&!reducedMotion.matches)ctx.scale(1.06,.9);
 if(mode==='flight'&&flight?.manualJump&&flight.jumpQuality>0&&!reducedMotion.matches){const a=(flight.time-flight.jumpAt)/GGCourse.TIME_SCALE;if(a>=0&&a<.32){const k=Math.sin(a/.32*Math.PI)*.17*flight.jumpQuality;ctx.scale(1-k*.55,1+k);}}
 if(mode==='flight'&&motion.takeoff){const t=Math.min(1,flight.time/GGCourse.TIME_SCALE/.12),ease=1-t*t*(3-2*t);ctx.translate(motion.takeoff.x*ease,motion.takeoff.y*ease);angle+=(motion.takeoff.rotation-angle)*ease;}
 if(mode==='flight'&&flight?.l.wing>0&&!flight.wingTorn&&GGWingArt.loaded(flight.l.wing)&&flight.time/GGCourse.TIME_SCALE>=.20){
  ctx.rotate(angle);const age=flight.time/GGCourse.TIME_SCALE-.20;
  GGWingArt.draw(ctx,flight.l.wing,age,motion.time,reducedMotion.matches);
  boosterArt(ctx,flight.l.boost);
  if(flight.boosting)boostFlameArt(flight.l.boost,-70,-30);
  ctx.restore();return;
 }
 if(mode==='flight'&&flight&&GGLaunch.get(flight.l.launch).standing){ctx.rotate(angle);if(!flight.wingTorn)gliderArt(flight.l.wing);const jumpAge=flight.jumpQuality>0||!flight.manualJump?(flight.time-(flight.jumpAt||0))/GGCourse.TIME_SCALE:9,frame=jumpAge<.10?3:jumpAge<.20?4:5;knightPoseArt(frame,false,null);boosterArt(ctx,flight.l.boost,true);if(flight.boosting)boostFlameArt(flight.l.boost,-62,30,-1.15);ctx.restore();return;}
 if(idle){const breath=reducedMotion.matches?0:Math.sin(t*2.7)*.012;ctx.scale(1+breath,1-breath);if(hero.complete&&hero.naturalWidth)ctx.drawImage(hero,-43,-75,86,108);}
 else{let tilt=angle;if(crash)tilt=Math.min(.45,amount*1.8);ctx.rotate(tilt);const bob=reducedMotion.matches||(mode==='slide'&&GGLaunch.get(flight?.l.launch??save.levels.launch).type==='skate')?0:Math.sin(t*(flight?.boosting?28:7))*(flight?.boosting?1.3:.65);ctx.translate(0,bob);if(mode==='flight'&&!flight?.wingTorn)gliderArt(flight.l.wing);
 if(crash){const squash=Math.sin(Math.min(1,amount*5)*Math.PI);ctx.scale(1+squash*.18,1-squash*.23);}
 // Subtle breathing / armour vibration, with a dedicated belly-down drawing.
 const w=PRONE_KNIGHT_WIDTH,h=w*(flyingArt.naturalHeight||896)/(flyingArt.naturalWidth||1792);if(flyingArt.complete&&flyingArt.naturalWidth)flyingKnightArt(w,h,mode==='flight'&&!flight?.wingTorn);else if(hero.complete)ctx.drawImage(hero,-40,-60,80,100);
 boosterArt(ctx,flight?.l.boost??save.levels.boost);
 if(mode==='flight'&&flight.ramTime>0){ctx.save();ctx.strokeStyle='#ffeaa0';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(24,-5,61,40,0,-1.6,1.6);ctx.stroke();ctx.restore();}
 if(mode==='flight'&&flight?.boosting)boostFlameArt(flight.l.boost,-70,-30);
 }ctx.restore();}
function scene(){const flying=['flight','landing','result'].includes(state),f=flight,cx=(flying||state==='launching')?cameraX:0,cy=cameraY,W=canvas.width,H=canvas.height;
 ctx.setTransform(1,0,0,1,0,0);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,cy>1400?'#76b9db':'#68c6eb');sky.addColorStop(1,'#def3e7');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const portrait=W/H<1.1,z=Math.max(W/1200,Math.min(H/700,W/620));const ox=portrait?0:(W-1200*z)/2,oy=H*.78-485*z;
 const focus=flying&&f?{x:f.originX+(f.x-cx)*GGCourse.X_SCALE,y:485-(f.y-cy)*GGCourse.SCALE}:GGCourse.launchPose(state==='launching'?Math.max(0,launchTime/launchDuration):0,GGCourse.LAUNCH_ANGLE,f?.launchSpeed,f?.l.launch??save.levels.launch);
 const ax=focus.x-(flying?0:cx*GGCourse.X_SCALE),ay=focus.y+(flying?0:cy*GGCourse.SCALE);
 ctx.setTransform(z*inspectionZoom,0,0,z*inspectionZoom,ox+ax*z*(1-inspectionZoom),oy+ay*z*(1-inspectionZoom));if(motion.shake>0&&!reducedMotion.matches)ctx.translate(Math.sin(motion.time*72)*motion.shake*12,Math.cos(motion.time*57)*motion.shake*8);
 const ground=485+cy*.85,wx=x=>(f?.originX??GGCourse.launchPose(1,GGCourse.LAUNCH_ANGLE,undefined,save.levels.launch).x)+(x-cx)*GGCourse.X_SCALE,wy=y=>485-(y-cy)*.85;
 // Visible span in scene units: the launch pad pulls far back for tall ramps, so scenery and ground follow the zoom.
 const gt=ctx.getTransform(),viewL=-gt.e/gt.a,viewR=(W-gt.e)/gt.a;
 // Mirrored image tiles share an identical edge; the scenery scrolls slowly behind the foreground.
 const magicWorld=flying&&!!GGCourse.stages[f.stage]?.magic;
 if(magicWorld)magicBackdropArt(cx,cy,485+cy*.85);
 if(!magicWorld&&(!flying||f.y<5000)&&valleyArt.complete&&valleyArt.naturalWidth){const offset=cx*.22,bgY=-210+cy*.22;for(let i=Math.min(Math.floor(offset/1200)-2,Math.floor((offset+viewL)/1200));i<Math.max(Math.floor(offset/1200)+3,Math.floor((offset+viewR)/1200)+1);i++){ctx.save();ctx.translate(i*1200-offset,bgY);if(Math.abs(i)%2){ctx.translate(1200,0);ctx.scale(-1,1);}ctx.drawImage(valleyArt,0,0,1200,800);ctx.restore();}}
 const region=flying?[0,1,2,3,4,5,5,5,5][f.stage]:0;
 if(region>0&&region<5){ctx.fillStyle=['','#a96d3b35','#6587a54d','#c4e8fa88','#864b6355'][region];ctx.fillRect(-2500,-2500,6000,6000);}
 if(region===1){for(let i=0;i<8;i++){const x=i*220-(cx*.4)%220;path([[x-70,ground-30],[x-15,ground-150],[x+65,ground-30]],'#95694d','#58453d',3);line([[x-15,ground-150],[x-15,ground-185]],'#54443b',4);path([[x-15,ground-185],[x+25,ground-176],[x-15,ground-164]],'#8a3d36');}}
 if(region===2){for(let i=-1;i<7;i++){const x=i*260-(cx*.34)%260;path([[x-80,ground],[x-38,ground-190],[x+17,ground-225],[x+52,ground-180],[x+88,ground-30],[x+135,ground]],'#718e99','#4d6975',3);path([[x-38,ground-190],[x+17,ground-225],[x+52,ground-180],[x+12,ground-194]],'#cbdbe0',null);}}
 if(region===3){for(let i=0;i<5;i++){const x=i*300-(cx*.45)%300;cloud(x,ground-150,2.1);tower(x,ground-165,.7);}}
 if(region===4){for(let i=-1;i<6;i++){const x=i*340-(cx*.35)%340;path([[x-90,ground],[x+45,ground-270],[x+165,ground]],'#615d76','#484559',3);path([[x+15,ground-205],[x+45,ground-270],[x+77,ground-198],[x+42,ground-215]],'#e6d6da',null);}if(f.dragon?.hearts>0&&f.x<GGCourse.dragonBoss.x-1700)dragon(940+Math.sin(motion.time*.35)*150,165+Math.sin(motion.time*1.3)*24,1.9);}
 // Airborne clouds remain visible above the mountain layer.
 if(cy>700){for(let i=0;i<7;i++){const x=((i*260-cx*.07)%1700+1700)%1700-200;cloud(x,130+i%3*130,1+i%2*.4);}}
 // Cloud world between 2 500 and 7 000 m: a pastel sky and a floor of big cumulus; space only begins above.
 const altitude=flying?f.y:cy,cloudWorld=Math.max(0,Math.min(1,(altitude-6800)/1800))*Math.max(0,Math.min(1,(22500-altitude)/3000));
 if(cloudWorld>0){ctx.save();const tt=ctx.getTransform(),l2=-tt.e/tt.a,t2=-tt.f/tt.d,w2=W/tt.a,h2=H/tt.d;ctx.globalAlpha=cloudWorld;const pastel=ctx.createLinearGradient(0,t2,0,t2+h2);pastel.addColorStop(0,'#8fc7f0');pastel.addColorStop(.55,'#cfe6f7');pastel.addColorStop(1,'#fbe9f3');ctx.fillStyle=pastel;ctx.fillRect(l2,t2,w2,h2);
  ctx.globalAlpha=cloudWorld*.9;for(let i=0;i<9;i++){const x=((i*330-cx*.18)%2970+2970)%2970-400,y=wy(7200)+(i%3)*40;cloud(x,y,2.6+(i%2)*.8);}
  ctx.globalAlpha=cloudWorld*.7;for(let i=0;i<7;i++){const x=((i*410+150-cx*.3)%2870+2870)%2870-400,y=wy(7600+(i%4)*120);cloud(x,y,1.6+(i%3)*.5);}
  ctx.globalAlpha=cloudWorld*.55;for(let i=0;i<8;i++){const x=((i*430+60-cx*.15)%2900+2900)%2900-400,y=wy(9600+(i%4)*1300);cloud(x,y,1.3+(i%3)*.35);}
  ctx.globalAlpha=cloudWorld*.5;for(let i=0;i<6;i++){const x=((i*470+90-cx*.12)%2820+2820)%2820-400,y=wy(14500+(i%3)*2000);cloud(x,y,1.2+(i%2)*.6);}
  ctx.restore();}
 const space=Math.max(0,Math.min(1,((flying?f.y:cy)-20500)/5000));
 if(space>0){ctx.save();const t=ctx.getTransform(),left=-t.e/t.a,top=-t.f/t.d,width=W/t.a,height=H/t.d;ctx.globalAlpha=space;const night=ctx.createLinearGradient(0,top,0,top+height);night.addColorStop(0,'#080c29');night.addColorStop(.6,'#18284e');night.addColorStop(1,'#415981');ctx.fillStyle=night;ctx.fillRect(left,top,width,height);
 for(let i=0;i<85;i++){const sx=left+GGMonsters.hash(i*13+3)*width,sy=top+GGMonsters.hash(i*37+7)*height,pulse=reducedMotion.matches?.8:.6+.4*Math.sin(motion.time*(.8+GGMonsters.hash(i))+i);ctx.globalAlpha=space*pulse;const r=i%9===0?2.2:1;ellipse(sx,sy,r,r,'#f4f3d9');if(i%9===0){line([[sx-4,sy],[sx+4,sy]],'#d9ecff',1);line([[sx,sy-4],[sx,sy+4]],'#d9ecff',1);}}
 ctx.restore();}
 // The ground spans whatever the zoom shows (the launch pad pulls far back for tall ramps); the grass keeps its 12-unit grid.
 const gl=-2000-12*Math.max(0,Math.ceil((-2000-viewL)/12)+2),gr=3200+12*Math.max(0,Math.ceil((viewR-3200)/12)+2);
 if(ground<300+700/Math.min(1,inspectionZoom)){rect(gl,ground,gr-gl,2200+900/Math.min(1,inspectionZoom),magicWorld?'#6f5aa6':'#ab8861');rect(gl,ground+10,gr-gl,23,magicWorld?'#4a3a7c':'#725a43');ctx.beginPath();ctx.moveTo(gl,ground);for(let x=gl;x<gr;x+=12)ctx.lineTo(x,ground-4+Math.sin((x+cx*GGCourse.X_SCALE)*.11)*2);ctx.lineTo(gr,ground+12);ctx.lineTo(gl,ground+12);ctx.closePath();ctx.fillStyle=GGCourse.stages[region===5?f.stage:region].color;ctx.fill();ctx.strokeStyle='#49633b';ctx.lineWidth=2;ctx.stroke();
 // Derive the texture from permanent world indices, never recycled screen slots.
 const soilOffset=cx*GGCourse.X_SCALE;for(let i=Math.floor((soilOffset+Math.min(0,viewL))/69)-2;i<=Math.ceil((soilOffset+Math.max(1400,viewR))/69);i++){const x=i*69-soilOffset,row=((i%3)+3)%3,size=((i%4)+4)%4;ellipse(x,ground+44+row*17,9+size*2,4,magicWorld?'#8b74c4':'#967351');line([[x+28,ground+10],[x+24,ground-1],[x+30,ground+3],[x+35,ground-4]],'#537a3b',2);}
 }
 crowdArt(wx,ground,f);
 if(cx<650)rampArt(cx,cy);
 for(const p of motion.foam){ctx.save();ctx.globalAlpha=Math.min(1,p.life/.25)*.8;const x=p.x-cx*GGCourse.X_SCALE,y=p.y+cy*GGCourse.SCALE;
  ellipse(x,y,p.size,p.size,p.bubble?'#d8faff55':'#fff4fc');
  if(p.bubble){ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.strokeStyle='#f8fdff';ctx.lineWidth=1.3;ctx.stroke();ellipse(x-p.size*.3,y-p.size*.35,1.5,1.5,'#fff');}
  ctx.restore();
 }

 encounterArt(wx,wy,ground,f);
 magicArt(wx,wy,ground,f);
 fartCloudArt(wx,wy);
 fireballArt(wx,wy);
 kaboomArt(wx,wy);
 if(flying&&f.previousRecord>0){const x=wx(f.previousRecord);if(x>-180&&x<1450){ctx.save();ctx.setLineDash([10,9]);line([[x,ground],[x,wy(f.y)-100]],'#f5d35a',4);ctx.setLineDash([]);const y=wy(f.y)-105;ctx.font="900 25px Nunito, sans-serif";ctx.textAlign='center';ctx.lineWidth=7;ctx.strokeStyle='#26353b';ctx.fillStyle='#ffe46e';for(const [label,dy] of [['TON RECORD !',-35],[Math.floor(f.previousRecord).toLocaleString('fr')+' m',-6],['⬇',30]]){ctx.strokeText(label,x,y+dy);ctx.fillText(label,x,y+dy);}ctx.restore();}}

 if(flying)for(const center of GG.thermalCenters){
  const x=wx(center),tr=ctx.getTransform(),half=100*GGCourse.X_SCALE;
  const left=-tr.e/tr.a,right=(canvas.width-tr.e)/tr.a,top=-tr.f/tr.d,bottom=(canvas.height-tr.f)/tr.d;
  if(x+half<left||x-half>right)continue;
  const base=Math.min(bottom,wy(220)),t=reducedMotion.matches?0:motion.time;
  if(base<top)continue;
  ctx.save();
  const visibleLeft=Math.max(left,x-half),visibleRight=Math.min(right,x+half);
  const glow=ctx.createLinearGradient(x-half,0,x+half,0);glow.addColorStop(0,'#96eeff00');glow.addColorStop(.5,'#60bdf624');glow.addColorStop(1,'#96eeff00');ctx.fillStyle=glow;ctx.fillRect(visibleLeft,top,visibleRight-visibleLeft,base-top);
  // Flowing ribbons follow the full lift zone, with bright motes travelling upward.
  for(let k=0;k<7;k++){
   const anchor=x-half+(k+.5)*half*2/7;if(anchor<left-100||anchor>right+100)continue;
   ctx.beginPath();for(let y=base;y>=top-35;y-=18){const px=anchor+Math.sin(y*.014+t*2+k)*48+Math.sin(y*.007-t)*22;if(y===base)ctx.moveTo(px,y);else ctx.lineTo(px,y);}
   ctx.strokeStyle=k%2?'#b7a3ff55':'#8deee76b';ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle='#e1ffff9c';ctx.lineWidth=2;ctx.stroke();
   const span=Math.max(1,base-top);for(let j=0;j<5;j++){const y=base-((t*145+j*span/5+k*39)%span),px=anchor+Math.sin(y*.014+t*2+k)*48+Math.sin(y*.007-t)*22;ellipse(px,y,3,6,'#edfff3');if(j===0)text('✦',px,y-10,20,'#fff2b7','center');}
  }
  ctx.restore();
 }

 if(flying&&f.y>1400){for(let i=0;i<3;i++){const x=((i*550-cx*.4)%1800+1800)%1800-180,y=wy(2450)+150;cloud(x,y,1.3);if(y>-200&&y<900){tower(x,y-10,.6);}}}
 if(flying&&Math.abs(wx(30000)-600)<800&&Math.abs(wy(4000)-300)<500)dragon(wx(30000),wy(4000),1.8);
 // Distance posts and gates are world anchored, so passing them conveys actual speed.
 for(let i=Math.max(0,Math.floor(cx/250));i<Math.floor(cx/250)+20;i++){const x=wx(i*250);if(x<-100||x>1400||ground>1000)continue;line([[x,ground-2],[x,ground-26]],'#594b3d',3);rounded(x-21,ground-43,42,19,3,'#f7e8bb','#6d5945',2);text(String(i*250),x,ground-29,10,'#554b40','center');}
 for(let i=1;i<GGCourse.stages.length;i++){
 const gate=GGCourse.stages[i],x=wx(gate.at),width=GGCourse.wallWidth(i)*GGCourse.X_SCALE;if(gate.boss||x+width<-100||x>1400)continue;
 const damage=(f?.wallDamage||save.wallDamage)?.[i]||{},cw=GGCourse.CELL_W*GGCourse.X_SCALE,ch=GGCourse.CELL_H*GGCourse.SCALE;
 const firstRow=Math.max(0,Math.floor((cy+(485-1000)/GGCourse.SCALE)/GGCourse.CELL_H)),lastRow=Math.ceil((cy+(485+200)/GGCourse.SCALE)/GGCourse.CELL_H);
 // Running bond: real half-stone offset shared with collisions and saved holes.
 for(let row=firstRow;row<=lastRow;row++){
 const offset=GGCourse.stoneOffset(row)*GGCourse.X_SCALE;
 const firstCol=Math.max(0,Math.floor((-90-x-offset)/cw)),lastCol=Math.min(GGCourse.stoneColumns(i,row)-1,Math.ceil((1400-x-offset)/cw));
 for(let col=firstCol;col<=lastCol;col++){
  if(damage[col+':'+row]||GGCourse.cacheHole(i,col,row))continue;
  const bounds=GGCourse.stoneBounds(i,col,row),bx=x+bounds.left*GGCourse.X_SCALE,bw=(bounds.right-bounds.left)*GGCourse.X_SCALE,by=wy((row+1)*GGCourse.CELL_H),seed=(col*17+row*31)%7;
  const left=damage[(col-1)+':'+row],right=damage[(col+1)+':'+row];
  const center=(bounds.left+bounds.right)/2;
  const neighbour=r=>damage[Math.floor((center-GGCourse.stoneOffset(r))/GGCourse.CELL_W)+':'+r];
  const above=neighbour(row+1),below=row>0&&neighbour(row-1),chip=4+seed*.6;
  const pts=[[bx+(above||left?chip:2),by+2],[bx+bw-(above||right?chip:2),by+2],[bx+bw-2,by+(right?chip:3)],[bx+bw-(right?5:2),by+ch*.55],[bx+bw-2,by+ch-(right||below?chip:2)],[bx+bw-(below?chip:2),by+ch-2],[bx+(below||left?chip:2),by+ch-2],[bx+2,by+ch-(left?chip:3)],[bx+(left?5:2),by+ch*.4]];
  const hue=[0,38,213,15,151,274,47,190,345][i];
  // Magic walls: bluish bricks with a pale glowing mortar line.
  if(gate.magic){path(pts,'hsl('+(212+seed*4)+' 62% '+(50+seed*3)+'%)','#1f2a6b',2);line([[bx+8,by+6],[bx+bw-9,by+6]],'#bfe6ff',2);line([[bx+7,by+ch-5],[bx+bw-7,by+ch-5]],'#3a4aa0',2);if(seed===3)mStar(bx+bw/2,by+ch/2,7,'#c9f4ff');}
  else{path(pts,'hsl('+hue+' 24% '+(49+seed*2)+'%)','#4d5351',2);
  line([[bx+8,by+6],[bx+bw-9,by+6]],'#c7c0a8',2);
  line([[bx+7,by+ch-5],[bx+bw-7,by+ch-5]],'#74786e',2);}
  if(left||right||above||below)line([[bx+bw*.25,by+ch*.25],[bx+bw*.55,by+ch*.5],[bx+bw*.43,by+ch*.8]],'#5b5c52',2);
 }}
 for(const a of GGCourse.wallCaches(i)){const tx=wx(a.x),ty=wy(a.y);if(tx<-160||tx>1500||ty<-100||ty>1100)continue;if(!(f?.wallTreasureClaimed||save.wallTreasureClaimed||[]).includes(a.id)){treasureChestArt(tx,ty);text('+'+a.value,tx,ty-55,19,'#ffe878','center');}}
 const labelX=Math.max(140,Math.min(1060,x+width/2));rounded(labelX-130,155,260,62,5,'#fff4d6','#61533e',3);text((gate.magic?'MUR MAGIQUE · TABLEAU ':'REMPART · TABLEAU ')+(i+1),labelX,179,15,'#51483b','center');text(GGCourse.wallWidth(i)+' m D’ÉPAISSEUR · BRÈCHES PERSISTANTES',labelX,200,10,'#9c4937','center');

 }
 if(flying&&f.endReason==='ground'&&['landing','result'].includes(state)){const x=wx(f.x),energy=Math.min(1,f.impactSpeed/140),size=32+energy*32;ellipse(x,ground+5,size,11,'#5c4938');for(let i=0;i<9;i++){const a=i*Math.PI*2/9;line([[x+Math.cos(a)*size*.6,ground+Math.sin(a)*7],[x+Math.cos(a)*(size+19),ground+Math.sin(a)*19]],'#5b4937',2);}if(landingTime<.5){ctx.save();ctx.globalAlpha=(1-landingTime/.5)*.6;ctx.beginPath();ctx.ellipse(x,ground,30+landingTime*180,10+landingTime*40,0,0,7);ctx.lineWidth=4;ctx.strokeStyle='#fff2c6';ctx.stroke();ctx.restore();}}
 // Soft shadow scales with height and anchors the knight to the world.
 if(flying&&f){const x=wx(f.x),y=wy(f.y);if(f.y<280){ctx.globalAlpha=Math.max(.05,.22-f.y*.0007);ellipse(x,ground+3,Math.max(13,43-f.y*.08),6,'#263a30');ctx.globalAlpha=1;}for(const p of motion.particles){ctx.globalAlpha=p.stone?Math.min(1,Math.max(0,p.life/.35)):Math.max(0,p.life/p.max)*(p.smoke?.55:.5);if(p.brick){ctx.save();ctx.translate(wx(p.x),wy(p.y));ctx.rotate((p.max-p.life)*(p.spin||8));rounded(-p.size*1.7,-p.size*.9,p.size*3.4,p.size*1.8,2,p.color,'#454b43',2);line([[-p.size*1.2,-p.size*.4],[p.size*1.2,-p.size*.4]],'#d4c9af',1.5);ctx.restore();}else if(p.smoke){const age=p.max-p.life;ellipse(wx(p.x),wy(p.y),p.size+age*22,(p.size+age*22)*.85,p.color);}else if(p.stone){ctx.save();ctx.translate(wx(p.x),wy(p.y));ctx.rotate((p.max-p.life)*(p.spin||8));path([[-p.size,-p.size*.5],[p.size*.6,-p.size],[p.size,p.size*.4],[-p.size*.4,p.size]],p.color,'#454b43',2);line([[-p.size*.65,-p.size*.4],[p.size*.4,-p.size*.7]],'#d4c9af',2);ctx.restore();}else ellipse(wx(p.x),wy(p.y),p.size,p.size*.8,p.color);ctx.globalAlpha=1;}
 for(const ring of motion.rings){if(reducedMotion.matches)continue;const progress=1-ring.life/ring.max;ctx.globalAlpha=(1-progress)*.7;ctx.strokeStyle='#fff1cf';ctx.lineWidth=5*(1-progress);ctx.beginPath();ctx.ellipse(wx(ring.x),wy(ring.y),16+progress*75,22+progress*95,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 for(const s of motion.skates)GGEquipment.drawSkate(ctx,s.kind,wx(s.x),wy(s.y),s.width,s.rotation);
 if(motion.soap){const s=motion.soap;launchObjectArt(s.kind,wx(s.x),wy(s.y),s.rotation);}
 if(f)chestEffectsArt(wx,wy,f);
 const crash=(state==='landing'||state==='result')&&['ground','wall','tower'].includes(f.endReason);ctx.save();if(!reducedMotion.matches&&motion.recoil>0){ctx.translate(x,y);ctx.scale(1-motion.recoil*.12,1+motion.recoil*.07);ctx.translate(-x-motion.recoil*9,-y);}if(!(crash&&f.endReason==='ground'&&buriedKnightArt(x,ground,landingTime)))heroArt(x,crash?Math.min(y,ground-21):y,crash?'crash':'flight',-motion.pitch,Math.min(landingTime,1));if(f.netted&&!(crash&&f.endReason==='ground'))caughtNetArt(x,crash?Math.min(y,ground-21):y,f.time-f.netted.at);ctx.restore();
 magicFrontArt(wx,wy,f,x,y);
 if(state==='landing'&&f.endReason==='wall'&&f.bomb){
  const bomb=GG.bombs.find(b=>b.id===f.bomb);
  if(!f.bombSpent){
   ellipse(x,y-33,29,28,bomb.color,'#171823',4);
   ellipse(x-10,y-43,8,5,'#ffffff55');
   rounded(x-8,y-66,16,10,3,'#a0a7b0','#494e59',2);
   const tip=24*(1-Math.min(1,landingTime/2));
   line([[x,y-66],[x+tip*.5,y-71-tip*.2],[x+tip,y-69-tip*.4]],'#c18a52',4);
   ellipse(x+tip,y-69-tip*.4,5+Math.sin(landingTime*48)*2,5,'#ffd257','#ff7835',2);
  }
 }

 // The carrying bird is a foreground actor, above every equipped sprite.
 if(f.gullRide){ctx.save();ctx.translate(x+90,y-80);if(!reducedMotion.matches)ctx.rotate(Math.sin(motion.time*18)*.04);gullArt(0,0,motion.time,true);ctx.restore();gullCry(x+90,y-220);}
 if(f.boosting&&!reducedMotion.matches){ctx.globalAlpha=.45;for(let i=0;i<5;i++){const q=(motion.time*280+i*31)%130;line([[x-90-q,y-35+i*14],[x-60-q,y-35+i*14]],'#fff9e5',2);}ctx.globalAlpha=1;}
 if(state==='landing'&&['ground','wall','tower','victory'].includes(f.endReason)){const p=Math.min(1,landingTime*3);ctx.save();ctx.translate(x,y-75);ctx.rotate(-.12);ctx.scale(.7+p*.3,.7+p*.3);text(f.newGoals.includes(GG.goals.length-1)?'BOOOOM !':'CLANG !',0,0,38,'#fff5c8','center');ctx.strokeStyle='#684336';ctx.lineWidth=1;ctx.strokeText(f.newGoals.includes(GG.goals.length-1)?'BOOOOM !':'CLANG !',0,0);ctx.restore();}
 }else{
 ctx.save();ctx.translate(-cx*GGCourse.X_SCALE,cy*GGCourse.SCALE);
 const sliding=state==='launching',t=sliding?Math.max(0,Math.min(1,launchTime/launchDuration)):0,pose=GGCourse.launchPose(t,GGCourse.LAUNCH_ANGLE,flight?.launchSpeed,flight?.l.launch??save.levels.launch);
 const x=pose.contactX;ctx.save();ctx.translate(x,rampY(x)-5);ctx.rotate(pose.rotation);ellipse(0,-5,66,9,'#4d3e3633');ctx.restore();
 // Move board and armour together along the ramp normal, keeping belly contact.
 const gear=flight?.l.launch??save.levels.launch;
 const item=GGLaunch.get(gear),rattle=skateboardRattle(pose,['skate','skates'].includes(item.type)&&sliding&&launchTime>0&&!reducedMotion.matches);
 if(gear===0&&shieldRiderArt(pose,t,sliding&&launchTime>0)){}
 else mountedArt(ctx,pose,gear,t,sliding&&launchTime>0);
 if(sliding&&launchTime>0){if(['skates','sled'].includes(item.type))for(let i=0;i<8;i++){const age=(motion.time*7+i*.13)%1;ctx.globalAlpha=(1-age)*.65;ellipse(pose.x-45-age*42,pose.y+24+age*6,2+age*7,2+age*3,'#edd6ab');ctx.globalAlpha=1;}
 if(['skates','sled'].includes(item.type))for(let i=0;i<4;i++){const q=(motion.time*18+i*.25)%1;line([[pose.x-10-q*40,pose.y+23],[pose.x-19-q*55,pose.y+24+q*7]],'#ffe29b',2);}}
 ctx.restore();
 }
 shieldScrapeArt(cx,cy);
 ctx.setTransform(1,0,0,1,0,0);
 if(motion.flash>0){ctx.save();ctx.globalAlpha=motion.flash/.22*.85;ctx.fillStyle='#fff6d6';ctx.fillRect(0,0,W,H);ctx.restore();}
 if(flying&&f&&f.slowLeft>0&&!f.ended)slowTimeArt(W,H,f.slowLeft);
 if(motion.choir){const age=motion.time-motion.choir.at;if(age<9.8)choirArt(W,H,age);else motion.choir=null;}
}

// One small cached bitmap per pose; no full-atlas scaling in the animation loop.
const monsterAtlas=new Image(),monsterCache=[];
monsterAtlas.onload=()=>{GGMonsterFrames.forEach((row,kind)=>{const scale=(kind===5?84:kind===6?34:60)/Math.max(...row.map(b=>b.h));monsterCache[kind]=row.map(b=>{const c=document.createElement('canvas');c.width=Math.ceil(b.w*scale*2);c.height=Math.ceil(b.h*scale*2);c.getContext('2d').drawImage(monsterAtlas,b.x,b.y,b.w,b.h,0,0,c.width,c.height);return c;});});};
monsterAtlas.src='assets/monsters-walk.png';
function crowdArt(wx,ground,f){
 if(!monsterCache.length)return;
 const matrix=ctx.getTransform(),left=-matrix.e/matrix.a,right=(canvas.width-matrix.e)/matrix.a,top=-matrix.f/matrix.d,bottom=(canvas.height-matrix.f)/matrix.d;
 if(ground-520>bottom||ground+10<top)return;
 const time=f?.monsterTime??motion.time*GGCourse.TIME_SCALE,origin=wx(0),list=GGMonsters.nearby((left-origin-100)/15,(right-origin+100)/15,time);
 list.sort((a,b)=>a.lane-b.lane);
 for(const m of list){const hit=f?.monsterHits?.get(m.id),age=hit===undefined?-1:time-hit;if(age>1)continue;if(m.x>GGCourse.castleTunnel.enter-2&&m.x<GGCourse.castleTunnel.enter+GGCourse.castleTunnel.ramp*.8||m.x>GGCourse.castleTunnel.exit-GGCourse.castleTunnel.ramp*.8&&m.x<GGCourse.castleTunnel.exit+2)continue;
 const frame=reducedMotion.matches?0:GGMonsters.walkFrame(m.id,time),unarmed=!m.armed||f?.orcs?.get(m.id)?.status==='thrown',img=unarmed&&m.kind!==6?unarmedCache[m.kind===5?1:0]?.[frame]:monsterCache[m.kind]?.[frame];if(!img)continue;
 ctx.save();ctx.translate(wx(m.x),ground+m.lane);ctx.fillStyle='#223e392b';ctx.beginPath();ctx.ellipse(0,0,m.width*.42,4,0,0,Math.PI*2);ctx.fill();
 ctx.translate(0,-m.y*GGCourse.SCALE);
 if(f?.orcs?.get(m.id)?.status==='warning'){text('!',0,-m.height-14,32,'#ffcf54','center');}
 if(m.armed&&m.kind<5&&f&&Math.abs(m.x-f.x)<6&&Math.abs(f.y-m.y)<150){ctx.save();ctx.rotate(-.7);line([[0,-35],[0,-92]],'#f8ec9a',6);ctx.restore();}
 if(age>=0){ctx.globalAlpha=1-age;if(m.kind===6)ctx.scale(1+age*.5,Math.max(.2,1-age));else{ctx.translate(age*24,0);ctx.scale(1+Math.sin(age*Math.PI)*.3,Math.max(.22,1-age*1.5));}}
 ctx.drawImage(img,-img.width*1.65/4,-img.height*1.65/2,img.width*1.65/2,img.height*1.65/2);ctx.restore();
 }
 for(const p of f?.projectiles||[]){ctx.save();ctx.translate(wx(p.x),ground-p.y*GGCourse.SCALE);ctx.rotate(p.age*12);line([[-18,0],[13,0]],'#62482f',8);ellipse(14,0,14,10,'#795b43','#302c27',3);for(const a of [-1,1])path([[10,a*8],[13,a*15],[17,a*8]],'#c8c4b2','#302c27',2);ctx.restore();}
}

const unarmedCache=[],unarmedAtlas=new Image();
unarmedAtlas.onload=()=>GGUnarmedFrames.forEach((row,kind)=>{const scale=(kind===1?84:60)/Math.max(...row.map(b=>b.h));unarmedCache[kind]=row.map(b=>{const c=document.createElement('canvas');c.width=Math.ceil(b.w*scale*2);c.height=Math.ceil(b.h*scale*2);c.getContext('2d').drawImage(unarmedAtlas,b.x,b.y,b.w,b.h,0,0,c.width,c.height);return c;});});
unarmedAtlas.src='assets/monsters-unarmed.png';

const encounterAtlas=new Image();encounterAtlas.src='assets/sky-surprises.png';
// Balloons drift like the cape: horizontal slices lag more toward the strings and basket.
function swayingSprite(kind,w,h,time,seed){
 if(!encounterAtlas.complete||!encounterAtlas.naturalWidth)return;
 if(reducedMotion.matches){encounterSprite(kind,0,0,w,h);return;}
 const cw=encounterAtlas.naturalWidth/4,ch=encounterAtlas.naturalHeight/2,sx=(kind%4)*cw,sy=Math.floor(kind/4)*ch,slices=22,sh=ch/slices,dh=h/slices;
 const breathe=1+Math.sin(time*2.3+seed)*.022,bob=Math.sin(time*1.4+seed*.7)*6;
 ctx.save();ctx.translate(0,bob);ctx.scale(breathe,1/breathe);
 for(let i=0;i<slices;i++){const q=i/(slices-1),lag=q*q,dx=Math.sin(time*1.8+seed-lag*2.4)*(3+lag*13);ctx.drawImage(encounterAtlas,sx,sy+i*sh,cw,sh+1,-w/2+dx,-h/2+i*dh,w,dh+.8);}
 ctx.restore();
}
function encounterSprite(kind,x,y,w,h){if(!encounterAtlas.complete||!encounterAtlas.naturalWidth)return;const cw=encounterAtlas.naturalWidth/4,ch=encounterAtlas.naturalHeight/2;ctx.drawImage(encounterAtlas,(kind%4)*cw,Math.floor(kind/4)*ch,cw,ch,x-w/2,y-h/2,w,h);}
// The guard is clipped behind the roof, posts and balcony, inside the window.
function towerWithGoblin(x,ground,aimAngle=null,time=motion.time,justShot=false){
 encounterSprite(7,x,ground-127,240,310);
 const frames=unarmedCache[0];if(!frames?.length)return;
 // The guard fidgets at the window; while aiming he stands still behind his bow.
 const frame=reducedMotion.matches||aimAngle!==null?0:[0,1,0,2][((Math.floor(time*3)%4)+4)%4],guard=frames[frame]||frames[0];
 ctx.save();ctx.beginPath();ctx.moveTo(x-61,ground-174);ctx.lineTo(x-12,ground-182);ctx.lineTo(x-12,ground-139);ctx.lineTo(x-61,ground-136);ctx.closePath();ctx.clip();
 const bob=reducedMotion.matches||aimAngle!==null?0:Math.sin(time*6)*1.5;
 ctx.drawImage(guard,x-65,ground-191+bob,61,74);ctx.restore();
 if(aimAngle!==null){
  ctx.save();ctx.translate(x-52,ground-160);ctx.rotate(-aimAngle);const pull=justShot?0:9;
  ctx.beginPath();ctx.moveTo(0,-26);ctx.quadraticCurveTo(16,0,0,26);ctx.strokeStyle='#7a4b22';ctx.lineWidth=4;ctx.stroke();
  line([[0,-26],[-pull,0],[0,26]],'#f1e7c8',1.5);
  if(!justShot){line([[-pull,0],[26,0]],'#9c6b3a',3);path([[26,0],[20,-4],[20,4]],'#8e8e8e','#3a3a3a',1);path([[-pull,0],[-pull-6,-4],[-pull-6,4]],'#d64a3c',null);}
  ctx.restore();
 }
}
 // Cutaway of the free-flight tunnel under the castle, traced from GGCourse.tunnelFloor / tunnelRoof: open trenches at both ends,
 // stone shell, dark gallery, timber frames, torches and the draught blowing through.
 function tunnelArt(wx,wy,ground,time){
  const t=GGCourse.castleTunnel,F=x=>wy(GGCourse.tunnelFloor(x)),R=x=>wy(GGCourse.tunnelRoof(x)),x0=wx(t.enter),x1=wx(t.exit),xs=[];
  for(let x=t.enter;x<t.exit;x+=2)xs.push(x);xs.push(t.exit);
  const roofLine=()=>{ctx.beginPath();xs.forEach((x,i)=>i?ctx.lineTo(wx(x),R(x)):ctx.moveTo(wx(x),R(x)));};
  const floorLine=()=>{ctx.beginPath();xs.forEach((x,i)=>i?ctx.lineTo(wx(x),F(x)):ctx.moveTo(wx(x),F(x)));};
  const cavity=()=>{roofLine();for(let i=xs.length-1;i>=0;i--)ctx.lineTo(wx(xs[i]),F(xs[i]));ctx.closePath();};
  ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
  ctx.save();ctx.beginPath();ctx.rect(x0,ground,x1-x0,wy(-t.depth)-ground+70);ctx.clip();
  for(const draw of [roofLine,floorLine]){draw();ctx.strokeStyle='#3a3833';ctx.lineWidth=40;ctx.stroke();draw();ctx.strokeStyle='#9a958a';ctx.lineWidth=31;ctx.stroke();draw();ctx.setLineDash([3,34]);ctx.strokeStyle='#6d695f';ctx.lineWidth=31;ctx.stroke();ctx.setLineDash([]);}
  const shade=ctx.createLinearGradient(0,wy(t.height),0,wy(-t.depth));shade.addColorStop(0,'#5a4130');shade.addColorStop(.45,'#3a281b');shade.addColorStop(1,'#20150e');
  cavity();ctx.fillStyle=shade;ctx.fill();
  // Timber frames with a torch between each pair, standing against the back wall.
  const frames=[];for(let x=t.enter+24;x<=t.exit-24+.1;x+=24)frames.push(x);
  frames.forEach((x,i)=>{const px=wx(x),top=R(x),bottom=F(x);rect(px-8,top+3,16,bottom-top-6,'#6f4728','#2b1a10');rect(px-34,top+3,68,15,'#8a5a32','#2b1a10');
   if(i<frames.length-1){const mx=x+12,tx=wx(mx),ty=R(mx)+62,flick=reducedMotion.matches?0:Math.sin(time*11+i*2.1)*3,glow=ctx.createRadialGradient(tx,ty,4,tx,ty,120);glow.addColorStop(0,'#ffcf6a70');glow.addColorStop(1,'#ffcf6a00');ctx.fillStyle=glow;ctx.fillRect(tx-120,ty-120,240,240);
    rect(tx-3,ty,6,24,'#5a3a22','#2b1a10');ctx.beginPath();ctx.moveTo(tx-9,ty+1);ctx.quadraticCurveTo(tx-2,ty-20-flick,tx,ty-28-flick);ctx.quadraticCurveTo(tx+4,ty-16,tx+9,ty+1);ctx.closePath();ctx.fillStyle='#ff9a2a';ctx.fill();ellipse(tx,ty-5,4,7,'#fff2a8');}});
  for(let i=0;i<16;i++){const x=t.enter+18+((i*53)%(t.exit-t.enter-36));ellipse(wx(x),F(x)-5-(i%3)*2,8+(i%3)*3,4,'#5c4330');}
  // Draught: pale streaks racing through the gallery, following its curve, with a little curl at their head.
  {const wind=reducedMotion.matches?0:motion.time,length=t.exit-t.enter;ctx.lineCap='round';
   for(let k=0;k<28;k++){const speed=.16+(k%5)*.035,phase=((wind*speed+k*.137)%1+1)%1,x=t.enter+phase*length,lane=.12+((k*61)%100)/100*.76,span=14+(k%4)*5,fade=Math.sin(phase*Math.PI);
    ctx.beginPath();for(let j=0;j<=6;j++){const sx=Math.min(t.exit,x+span*j/6),sy=F(sx)+(R(sx)-F(sx))*lane+Math.sin(wind*5+k+j*.7)*4;j?ctx.lineTo(wx(sx),sy):ctx.moveTo(wx(sx),sy);}
    ctx.strokeStyle='rgba(235,248,255,'+(.2+.42*fade).toFixed(3)+')';ctx.lineWidth=2.5+(k%3)*1.5;ctx.stroke();
    if(k%4===0){const hx=Math.min(t.exit,x+span),hy=F(hx)+(R(hx)-F(hx))*lane;ctx.beginPath();ctx.arc(wx(hx)+2,hy-9,9,Math.PI/2,-Math.PI*.9,true);ctx.strokeStyle='rgba(235,248,255,'+(.14+.26*fade).toFixed(3)+')';ctx.lineWidth=2.5;ctx.stroke();}}
   ctx.lineCap='butt';}
  ctx.restore();
  // Stone kerbs and wooden signs where the trenches open in the ground.
  for(const [x,dir,word] of [[t.enter,1,'TUNNEL'],[t.exit,-1,'SORTIE']]){const px=wx(x);
   rounded(px-dir*30-15,ground-20,30,26,[8,8,3,3],'#9a958a','#3a3833',4);rounded(px-dir*30-11,ground-34,22,18,[8,8,3,3],'#b3ae9f','#3a3833',3);
   ctx.save();ctx.translate(px-dir*96,ground);line([[0,0],[0,-92]],'#3a2616',7);ctx.translate(0,-104);ctx.rotate(-.05*dir);rounded(-66,-22,132,42,7,'#b98457','#3a2616',4);ctx.font="900 24px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.fillStyle='#3a2616';ctx.fillText(word+(dir>0?' ↘':' ↗'),0,8);ctx.restore();}
  ctx.restore();
 }
 // Godefroy's gas: green puffs shooting out behind the knight and drifting away, with a comic « PROUT ! ».
 function fartCloudArt(wx,wy){
  for(const p of motion.farts||[]){const age=motion.time-p.born,q=age/1.25;if(q<0||q>=1)continue;const x=(flight?wx(flight.x):wx(p.x))-58-q*230,y=(flight?wy(flight.y):wy(p.y))+6-q*34;ctx.save();ctx.globalAlpha=q<.15?q/.15:1-(q-.15)/.85;
   for(let k=0;k<7;k++){const a=k*2.2+p.n,r=(15+k%3*5)*(.55+q*1.5),d=(12+k*5)*(.4+q*1.3);ellipse(x+Math.cos(a)*d-k*3,y+Math.sin(a)*d*.6,r,r*.86,['#b9d66c','#9cc24f','#d8ea9c','#a8cc5a'][k%4],'#5f7d2a');}
   for(let k=0;k<3;k++){ctx.beginPath();const sx=x-18+k*20,sy=y-26-q*20;ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx-7,sy-9,sx+7,sy-17,sx,sy-27);ctx.strokeStyle='#7fa33a';ctx.lineWidth=3;ctx.stroke();}
   if(q<.7){const pop=1+Math.max(0,1-q*8)*.6;ctx.translate(x-10,y-52-q*18);ctx.rotate(-.12);ctx.scale(pop,pop);ctx.font="900 30px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#2f4212';ctx.lineWidth=7;ctx.strokeText('PROUT !',0,0);ctx.fillStyle='#e8f7a6';ctx.fillText('PROUT !',0,0);}
   ctx.restore();}
 }
function encounterArt(wx,wy,ground,f){
 const tr=ctx.getTransform(),left=-tr.e/tr.a,right=(canvas.width-tr.e)/tr.a,top=-tr.f/tr.d,bottom=(canvas.height-tr.f)/tr.d;
 // The tunnel has its own culling: its mouth must show long before the castle itself comes into view.
 if(wx(GGCourse.castleTunnel.exit)>left-200&&wx(GGCourse.castleTunnel.enter)<right+200&&wy(GGCourse.castleTunnel.height)<bottom+200)tunnelArt(wx,wy,ground,f?.time||0);
 for(const pos of GGCourse.obstacles){const x=wx(pos),enchanted=pos>GGCourse.magic.start;if(x<left-480||x>right+480||ground-(enchanted?1320:850)>bottom||ground<top)continue;
  if(enchanted&&!GGCourse.stages.some(g=>g.at===pos)&&!f?.destroyed.has(pos)&&!f?.towerBreaks?.[pos]){magicTowerArt(x,ground,pos);continue;}
  if(pos===500){if(f?.destroyed.has(pos))castleBreakArt(x,ground,f);else castleArt(x,ground,false);continue;}
  towerStructureArt(pos,x,ground,enchanted?4.3:2,f);
 }
 // Lookout towers standing on clouds in the cloud world.
 for(const t of GGCourse.cloudTowers){const x=wx(t.x),gy=wy(t.base);if(x<left-500||x>right+500||gy<top-700||gy>bottom+120)continue;
  cloud(x-40,gy+18,2.4);cloud(x+70,gy+26,1.9);
  towerStructureArt('c'+t.id,x,gy,1.4,f);
 }
 for(const a of f?.arrows||[])arrowArt(wx(a.x),wy(a.y),a.vx,a.vy);
 for(const n of f?.nets||[])if(!n.caught){netWarningArt(n,f,wx,wy,left,right,top,bottom);netArt(wx(n.x),wy(n.y),n,f.time);}
 witchHutArt(f,wx,wy);
 if(!f)return;
 const origin=wx(0),time=f.monsterTime||0;
 for(const a of GGSpecials.nearby((left-origin-180)/15,(right-origin+180)/15,f,(ground-bottom-180)/.85,(ground-top+180)/.85)){
  if(a.kind===9){cannonArt(wx(a.x),ground,f.specialUsed?.has(a.id),f.cannonAim?.[a.id]?.angle,f.time-(f.cannonShot?.[a.id]??-9));continue;}
  if(a.kind===8){springArt(wx(a.x),ground,f.springHits?.[a.id]===undefined?(f.specialUsed?.has(a.id)?2:-1):f.time-f.springHits[a.id]);continue;}
  if(f.specialUsed?.has(a.id))continue;const x=wx(a.x),y=wy(a.y);if(y<top-180||y>bottom+180)continue;
  ctx.save();ctx.translate(x,y);if(!reducedMotion.matches)ctx.rotate(Math.sin(time*(a.kind===3?13:2)+a.id)* (a.kind===3?.12:.045));
  if(a.kind===6){for(let k=0;k<4;k++){ctx.globalAlpha=.3-k*.05;ellipse(-50-k*13,Math.sin(time*4+k)*8,8-k,4,'#ffe468');}ctx.globalAlpha=1;}
  if(a.kind===3)gullArt(0,0,time+a.id,false);else if([1,2,4].includes(a.kind))swayingSprite(a.kind,a.kind===4?190:160,a.kind===4?240:190,time,a.id%89);else if(a.kind===10)rainCloudArt(time+a.id%13);else if(a.kind===11)rainbowCloudsArt(time+a.id%13);else encounterSprite(a.kind,0,0,a.kind===4?190:160,a.kind===4?240:190);ctx.restore();
 }
 for(const a of GGSpecials.treasureNearby((left-origin-100)/15,(right-origin+100)/15,f,(ground-bottom-100)/.85,(ground-top+100)/.85))if(!f.treasureUsed?.has(a.id))treasureArt(wx(a.x),wy(a.y),a.bag,time+a.id);
 for(const a of GGSpecials.bombNearby((left-origin-120)/15,(right-origin+120)/15,f,(ground-bottom-120)/.85,(ground-top+120)/.85))if(!f.bombUsed?.has(a.id))airBombArt(wx(a.x),wy(a.y),time+a.id%17);
 for(const a of GGSpecials.fuelNearby((left-origin-100)/15,(right-origin+100)/15,f,(ground-bottom-100)/.85,(ground-top+100)/.85))if(f.maxFuel>0&&!f.fartMode&&!f.fuelUsed?.has(a.id))fuelVialArt(wx(a.x),wy(a.y),time+a.id);
 for(const e of f.fuelEffects||[]){const q=(f.time-e.at)/1.2;if(q>=1)continue;ctx.save();ctx.globalAlpha=1-q;const x=wx(e.x),y=wy(e.y);for(let j=0;j<9;j++){const a=j*Math.PI*2/9; text('✦',x+Math.cos(a)*(20+q*75),y+Math.sin(a)*(20+q*75),18,'#9dfff0','center');}text('+'+e.percent+'% MAGIE',x,y-65-q*55,23,'#d5fff4','center');ctx.restore();}
 // Destruction combo: a big pop that follows the knight so it stays readable at any speed.
 {const e=f.comboEffects?.[f.comboEffects.length-1],q=e?Math.max(0,((f.ended?f.time+landingTime:f.time)-e.at)/1.5):1;if(e&&q<1){const pop=1+Math.max(0,1-q*7)*.7,size=Math.min(1.45,1+e.n*.03)*pop,xx=wx(f.x),yy=wy(f.y)-118-q*34;ctx.save();ctx.globalAlpha=q>.75?(1-q)*4:1;ctx.translate(xx,yy);ctx.rotate(-.06);ctx.scale(size,size);ctx.textAlign='center';ctx.lineJoin='round';const label=e.n>1?'COMBO ×'+e.n:'BOUM !';ctx.font="900 50px 'Barlow Condensed',Impact,sans-serif";ctx.strokeStyle='#3b1a12';ctx.lineWidth=11;ctx.strokeText(label,0,0);ctx.strokeStyle='#fff6d8';ctx.lineWidth=4;ctx.strokeText(label,0,0);ctx.fillStyle=e.n>=10?'#ff3d6e':e.n>=5?'#ff5a2c':'#ff8a1f';ctx.fillText(label,0,0);ctx.font="900 32px 'Nunito',sans-serif";const gain='+'+e.gold,w=ctx.measureText(gain).width;ctx.strokeStyle='#5c3e17';ctx.lineWidth=6;ctx.strokeText(gain,-12,36);ctx.fillStyle='#ffe46b';ctx.fillText(gain,-12,36);ellipse(w/2+6,25,12,12,'#aa7319');ellipse(w/2+6,25,9.5,9.5,'#efbd3d');ellipse(w/2+3,22,3.5,3.5,'#ffe9a0');for(let n=0;n<8;n++){const a=n*Math.PI/4+.3;ellipse(Math.cos(a)*(40+q*70),10+Math.sin(a)*(22+q*40),3.5*(1-q),3.5*(1-q),n%2?'#fff2a0':'#ff9a4a');}ctx.restore();}}
 for(const e of f.goldEffects||[]){const q=Math.max(0,((f.ended?f.time+landingTime:f.time)-e.at)/1.1);if(q>=1)continue;ctx.save();ctx.globalAlpha=1-q;const xx=wx(e.x),yy=wy(e.y)-q*65;ctx.font="900 24px 'Nunito',sans-serif";ctx.textAlign='center';ctx.strokeStyle='#5c3e17';ctx.lineWidth=4;ctx.strokeText('+'+e.value,xx,yy);ctx.fillStyle='#ffe46b';ctx.fillText('+'+e.value,xx,yy);for(let n=0;n<6;n++){const a=n*Math.PI/3;ellipse(xx+Math.cos(a)*q*50,yy+Math.sin(a)*q*35,3,3,'#fff2a0');}ctx.restore();}
 for(const e of f.specialEffects||[]){const age=f.time-e.at,q=age/1.3,x=wx(e.x),y=wy(e.y);ctx.save();ctx.globalAlpha=1-q;
  if(e.kind===9){
   for(let j=0;j<12;j++){const a=j*Math.PI/6,r=15+q*150;ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,13+q*22,11+q*19,q<.27?(j%2?'#ffe476':'#ff8436'):'#777681');}
   text('KABOOM !',x,y-40-q*75,39,'#ffe57a','center');
  }
  if([5,10,11].includes(e.kind)){if(e.kind===10)for(let j=0;j<8;j++){const a=j*.8;ellipse(x+Math.cos(a)*q*140,y+30+q*q*220-Math.sin(a)*q*40,4,7,'#6fb7ff');}if(e.kind===11)for(let j=0;j<7;j++)text('✦',x-90+j*30,y-20-q*90-(j%2)*20,20,['#ff5f5f','#ffa43b','#ffe93b','#6fe36f','#5fb6ff','#7d7dff','#d27dff'][j],'center');ctx.font="900 "+(34+q*18)+"px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#2f3c4c';ctx.lineWidth=6;ctx.fillStyle='#fff';ctx.strokeText('POUF !',x,y-40-q*60);ctx.fillText('POUF !',x,y-40-q*60);}
  for(let j=0;j<12;j++){const a=j*Math.PI/6,r=15+q*(([5,10,11].includes(e.kind))?130:90),xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*([5,10,11].includes(e.kind)?.6:1); if(e.kind===1||e.kind===2){ctx.save();ctx.translate(xx,yy);ctx.rotate(a+q*5);rect(-4,-6,8,12,e.color);ctx.restore();}else if([5,10,11].includes(e.kind)){ellipse(xx,yy,(26+q*30)*(1-q*.6),(18+q*22)*(1-q*.6),e.kind===10?'#c6d6e6':'#fff');}else if(e.kind===6){text('✦',xx,yy,22,e.color,'center');}else{ellipse(xx,yy,6*(1-q),4*(1-q),e.color);}}
  ctx.restore();
 }

}

// Hinged wooden base, steel coils and a padded launch plate share a fixed ground anchor.
function treasureArt(x,y,bag,time){
 ctx.save();ctx.translate(x,y+(reducedMotion.matches?0:Math.sin(time*3)*4));
 if(bag){path([[-14,-13],[-22,-30],[-5,-26],[9,-31],[17,-14],[27,7],[25,24],[12,31],[-15,30],[-27,19],[-26,2]],'#ba8743','#4a3829',3);line([[-15,-13],[17,-13]],'#654528',5);ellipse(0,8,12,14,'#ffd552','#9b631d',2);text('●',0,14,17,'#fff09a','center');}
 else{
  const w=reducedMotion.matches?25.5:12+Math.abs(Math.cos(time*3))*15,depth=9;
  ellipse(depth,0,w,33,'#ae701c','#79501b',2);
  ellipse(0,0,w,33,'#ffdc59','#805218',2.5);
  ctx.beginPath();ctx.ellipse(0,0,w*.74,25,0,0,Math.PI*2);ctx.strokeStyle='#fff3a2';ctx.lineWidth=2.5;ctx.stroke();
  line([[-w*.3,-17],[-w*.55,-5]],'#fff8c1',3);
  if(w>18)text('✦',0,9,25,'#b9781b','center');

 }
 ctx.restore();
}
function fuelVialArt(x,y,time){
 ctx.save();ctx.translate(x,y+(reducedMotion.matches?0:Math.sin(time*2.5)*5));
 ellipse(0,4,48,56,'rgba(78,255,219,.13)');
 // Thick glass, cork and a luminous potion share the game's outlined style.
 path([[-12,-29],[-12,-14],[-27,2],[-31,25],[-22,39],[0,44],[22,39],[31,25],[27,2],[12,-14],[12,-29]],'#c4eee8','#263f49',4);
 path([[-24,7],[-26,24],[-18,34],[0,38],[18,34],[26,24],[24,7],[9,10],[-8,5]],'#36c5b0','#258f9d',2);
 ellipse(0,8,24,5,'#96ffe4');
 rounded(-15,-38,30,17,4,'#ad793e','#463731',3);
 rounded(-17,-25,34,10,4,'#b09ce1','#3b4253',3);
 line([[-21,1],[-24,14],[-22,23]],'#f4ffff',4);
 path([[3,12],[-9,25],[0,24],[-3,34],[11,20],[3,21]],'#fff4a1','#347c83',1.5);
 for(let j=0;j<3;j++)ellipse(-10+j*10,27-((time*10+j*7)%17),2,2,'#bffff0');
 text('✦',37,-22+Math.sin(time*2)*5,19,'#b4ffef','center');
 ctx.restore();
}
function treasureChestArt(x,y,open=0,glow=0){ctx.save();ctx.translate(x,y);
 if(glow>0){ctx.save();ctx.globalAlpha=glow*.6;ellipse(0,0,70+glow*30,50+glow*20,'#ffe27a');ctx.restore();}
 rounded(-42,-13,84,43,6,'#b97835','#392d30',4);for(const dx of [-27,24])rect(dx,-13,8,43,'#ffda63','#9e681f',2);
 if(open>0){ellipse(0,-6,34,10,'#ffd84a');for(let i=0;i<6;i++)ellipse(-28+i*11,-8-(i%2)*5,6,6,'#ffe77a','#a87a1c');}
 ctx.save();ctx.translate(-42,-13);ctx.rotate(-open*1.9);rounded(0,-16,84,29,10,'#e0a64e','#392d30',4);for(const dx of [15,66])rect(dx,-12,8,22,'#ffda63','#9e681f',2);ctx.restore();
 if(open===0){rounded(-9,-5,18,21,3,'#ffde69','#795323',2);ellipse(0,4,3,4,'#47353a');text('✦',-48,-27,23,'#fff0a2','center');}
 ctx.restore();}
function cannonWheelArt(cx,cy,r,far){
 const rim=ctx.createRadialGradient(cx-r*.35,cy-r*.35,r*.15,cx,cy,r);
 if(far){rim.addColorStop(0,'#4a3127');rim.addColorStop(1,'#2a1c16');}else{rim.addColorStop(0,'#7d5640');rim.addColorStop(.7,'#553829');rim.addColorStop(1,'#3a2419');}
 ellipse(cx,cy,r,r,rim,far?'#1f1612':'#30241e');
 if(far)return;
 ctx.beginPath();ctx.arc(cx,cy,r*.74,0,7);ctx.strokeStyle='#3b2518';ctx.lineWidth=2.5;ctx.stroke();
 for(let i=0;i<4;i++){const a=i*Math.PI/4;line([[cx-Math.cos(a)*r*.72,cy-Math.sin(a)*r*.72],[cx+Math.cos(a)*r*.72,cy+Math.sin(a)*r*.72]],'#3b2518',3);}
 const hub=ctx.createRadialGradient(cx-2,cy-2,1,cx,cy,r*.36);hub.addColorStop(0,'#ead4a8');hub.addColorStop(1,'#9a7a52');ellipse(cx,cy,r*.36,r*.36,hub,'#30241e');
}
function cannonArt(x,ground,broken=false,aim,shotAge=9){
 ctx.save();ctx.translate(x,ground);ctx.scale(-2,2);
 ellipse(2,-1,64,7,'#26353b2e');
 if(broken){
  // Blown apart: scorched carriage on its side, barrel on the ground, one wheel rolled away.
  cannonWheelArt(-56,-11,13,false);ellipse(30,-3,15,5,'#3a2419','#1f1612');ellipse(30,-3,5,2,'#9a7a52',null);
  ctx.save();ctx.translate(-6,-14);ctx.rotate(.24);rounded(-46,-10,92,20,6,'#4a3326','#241a15',3);line([[-36,-4],[38,-4]],'#2a1d16',1.5);ctx.restore();
  ctx.save();ctx.translate(16,-9);ctx.rotate(.08);const dark=ctx.createLinearGradient(0,-19,0,19);dark.addColorStop(0,'#1f242c');dark.addColorStop(.4,'#4e5868');dark.addColorStop(1,'#15181f');ctx.beginPath();ctx.moveTo(-40,-19);ctx.lineTo(34,-15);ctx.lineTo(34,15);ctx.lineTo(-40,19);ctx.closePath();ctx.fillStyle=dark;ctx.fill();ctx.strokeStyle='#15181f';ctx.lineWidth=3;ctx.stroke();ellipse(34,0,5,15,'#0a0c10','#15181f');line([[-10,-14],[6,4],[-4,14]],'#0a0c10',2.5);ctx.restore();
  for(let i=0;i<4;i++)ellipse(-30+i*22,-30-(i%2)*8,7+i%3*2,5,'#2a2a2a55');
  ctx.restore();return;
 }
 // Far wheels first: they show behind the carriage and give the cart its depth.
 for(const xx of [-33,35])cannonWheelArt(xx+5,-15,13,true);
 // Carriage: lit top face, then the shaded front face with its planks and bolts.
 ctx.beginPath();ctx.moveTo(-46,-30);ctx.lineTo(50,-30);ctx.lineTo(46,-37);ctx.lineTo(-41,-37);ctx.closePath();ctx.fillStyle='#b98457';ctx.fill();ctx.strokeStyle='#342a25';ctx.lineWidth=3;ctx.stroke();
 const wood=ctx.createLinearGradient(0,-32,0,-6);wood.addColorStop(0,'#a06f48');wood.addColorStop(.55,'#7d5033');wood.addColorStop(1,'#56351f');
 rounded(-52,-30,105,24,7,wood,'#342a25',3.5);
 line([[-40,-22],[46,-22]],'#4a2d1c',1.5);line([[-38,-13],[44,-13]],'#4a2d1c',1.5);
 for(const bx of [-44,-6,44]){ellipse(bx,-18,2.6,2.6,'#5a5f66','#2c2a28');ellipse(bx-.8,-18.8,1,1,'#d9dde2');}
 // The barrel tracks the knight (elevation above the horizon, firing towards the left), recoils on a shot.
 const elev=Math.max(.3,Math.min(1.5,aim===undefined?.72:Math.PI-aim)),recoil=shotAge<.3?(1-shotAge/.3)*9:0;
 ctx.save();ctx.translate(-22,-28);ctx.rotate(-elev);ctx.translate(-recoil,0);
 // Tapered barrel: a cylinder shaded across its width, with a breech cap, knob, rings and a muzzle you can look into.
 const metal=ctx.createLinearGradient(0,-21,0,21);metal.addColorStop(0,'#2b3240');metal.addColorStop(.2,'#78859b');metal.addColorStop(.38,'#a3b0c3');metal.addColorStop(.6,'#5a6779');metal.addColorStop(1,'#1c222c');
 ctx.beginPath();ctx.moveTo(-14,-21);ctx.lineTo(60,-16.5);ctx.lineTo(60,16.5);ctx.lineTo(-14,21);ctx.closePath();ctx.fillStyle=metal;ctx.fill();ctx.strokeStyle='#252c36';ctx.lineWidth=3;ctx.stroke();
 const cap=ctx.createLinearGradient(0,-21,0,21);cap.addColorStop(0,'#3a4454');cap.addColorStop(.45,'#6d7a90');cap.addColorStop(1,'#242b36');ellipse(-14,0,6.5,21,cap,'#252c36');
 const knob=ctx.createRadialGradient(-24,-3,1,-22,0,8);knob.addColorStop(0,'#aab5c8');knob.addColorStop(1,'#2a313e');ellipse(-22,0,8,8,knob,'#252c36');
 for(const [rx,h] of [[2,20.2],[34,18.2]]){const ring=ctx.createLinearGradient(0,-h-2,0,h+2);ring.addColorStop(0,'#3a4454');ring.addColorStop(.35,'#b4c0d2');ring.addColorStop(.7,'#5f6c82');ring.addColorStop(1,'#1f2531');rounded(rx-4,-h-2.5,8,h*2+5,2,ring,'#252c36',2.5);}
 const muzzle=ctx.createLinearGradient(0,-23,0,23);muzzle.addColorStop(0,'#3a4454');muzzle.addColorStop(.3,'#aab6c9');muzzle.addColorStop(.65,'#5f6c82');muzzle.addColorStop(1,'#1f2531');
 rounded(52,-23,18,46,4,muzzle,'#252c36',3);
 ellipse(70,0,5.5,20,'#2a3140','#252c36');ellipse(71,0,3.6,14,'#0a0c10');ellipse(70.2,-5,1.6,5,'#56627655');
 line([[-6,-12],[54,-9.5]],'#ffffff38',3);
 if(shotAge<.4){const q=shotAge/.4;ctx.globalAlpha=1-q;ellipse(80+q*18,0,14+q*12,10+q*8,'#ffb63a','#f08a2a');ellipse(77+q*12,0,7+q*5,5+q*4,'#fff2a8',null);ctx.globalAlpha=1;}
 ctx.restore();
 if(shotAge<1.6&&!reducedMotion.matches){for(let i=0;i<4;i++){const q=Math.max(0,Math.min(1,(shotAge-i*.1)/1.5)),d=76+q*70;ctx.globalAlpha=Math.max(0,.5-q*.5);ellipse(-22+Math.cos(elev)*d+i*6,-28-Math.sin(elev)*d-q*26,10+q*20,8+q*13,'#a3a39e',null);}ctx.globalAlpha=1;}
 for(const xx of [-33,35])cannonWheelArt(xx,-12,14,false);
 ctx.restore();
}
// Fishing nets fired by the cannons: a bright rope bundle that unfurls into a wide diamond mesh with lead weights.
const NET_R=120,NET_TALL=380;
function netMesh(rx,ry,spacing){
 ctx.save();ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,7);ctx.clip();
 ctx.fillStyle='#2a160833';ctx.fillRect(-rx,-ry,rx*2,ry*2);
 const span=rx+ry;
 for(const [col,w] of [['#4a2c12',4.5],['#ffd27a',2]]){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();for(let k=-span;k<=span;k+=spacing){ctx.moveTo(k-span,-span);ctx.lineTo(k+span,span);ctx.moveTo(k+span,-span);ctx.lineTo(k-span,span);}ctx.stroke();}
 ctx.fillStyle='#4a2c12';for(let i=-span;i<=span;i+=spacing)for(let j=-span;j<=span;j+=spacing){const x=(i+j)/2,y=(j-i)/2;if(x*x/(rx*rx)+y*y/(ry*ry)<1){ctx.beginPath();ctx.arc(x,y,2.6,0,7);ctx.fill();}}
 ctx.restore();
}
function netRim(rx,ry){
 ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,7);ctx.strokeStyle='#ffffffb0';ctx.lineWidth=14;ctx.stroke();
 ctx.strokeStyle='#4a2c12';ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle='#ffd27a';ctx.lineWidth=4;ctx.setLineDash([9,7]);ctx.stroke();ctx.setLineDash([]);
 for(let k=0;k<12;k++){const a=k/12*Math.PI*2;ellipse(Math.cos(a)*rx,Math.sin(a)*ry,6,6,'#3b4150','#15181f');ellipse(Math.cos(a)*rx-2,Math.sin(a)*ry-2,2,2,'#9aa3b4');}
}
// Net telegraph: while the net is still rising out of view a flashing marker hugs the screen edge on its side; once it has opened,
// a red dashed ring shows the spot it is gliding to, so the pilot knows where not to be.
function netWarningArt(n,f,wx,wy,left,right,top,bottom){
 if(n.sx===undefined||f.netted)return;const blink=reducedMotion.matches?1:.78+.22*Math.sin(motion.time*16),unit=1/Math.max(.3,ctx.getTransform().a);
 if(n.lockAt===undefined){
  const x=Math.max(left+380*unit,Math.min(right-390*unit,wx(n.x))),y=Math.max(top+190*unit,Math.min(bottom-70*unit,wy(n.y)));
  if(wy(n.y)<bottom-40*unit&&wx(n.x)>left&&wx(n.x)<right)return;
  ctx.save();ctx.translate(x,y);ctx.scale(unit,unit);ctx.globalAlpha=blink;
  path([[0,34],[-30,-6],[-12,-6],[-12,-34],[12,-34],[12,-6],[30,-6]],'#e2452f','#5a140d',5);
  ctx.globalAlpha=1;rounded(-70,-78,140,36,10,'#fff4cf','#5a140d',4);ctx.font="900 22px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.fillStyle='#c8251a';ctx.fillText('⚠ FILET !',0,-52);
  ctx.restore();return;
 }
 const q=(n.age-n.lockAt)/GG.NET_GLIDE;if(q>=1||n.tx===undefined)return;
 // The real spot is often far ahead of the screen: the zone waits at the right edge, at the right height, until it scrolls in.
 const zoneX=Math.min(wx(n.tx),right-170*unit);
 // Danger zone: a flashing red area exactly where the net will close. Stay out of it.
 {const fade=q>.9?(1-q)/.1:1,flash=reducedMotion.matches?.5:.5+.5*Math.sin(motion.time*(8+q*14));ctx.save();ctx.translate(zoneX,wy(n.ty));ctx.globalAlpha=(.16+.3*flash)*fade;ctx.fillStyle='#ff2a1a';ctx.beginPath();ctx.ellipse(0,0,110,185,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=(.55+.45*flash)*fade;ctx.strokeStyle='#ff2a1a';ctx.lineWidth=9;ctx.stroke();ctx.scale(unit,unit);ctx.globalAlpha=fade;rounded(-74,-20,148,38,10,'#fff4cf','#c8251a',4);ctx.font="900 22px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.fillStyle='#c8251a';ctx.fillText('⚠ DANGER',0,7);ctx.restore();}
 ctx.save();ctx.translate(zoneX,wy(n.ty));ctx.globalAlpha=(.35+.4*blink)*(q>.85?(1-q)/.15:1);ctx.setLineDash([16,12]);ctx.lineDashOffset=-motion.time*40;ctx.strokeStyle='#e2452f';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,0,95*(1.25-.25*q),175*(1.25-.25*q),0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=5;line([[-22,0],[22,0]],'#e2452f',5);line([[0,-22],[0,22]],'#e2452f',5);ctx.restore();
}
function netArt(x,y,n,time){
 const age=n.age,open=n.sx===undefined?Math.max(0,Math.min(1,(age-.45)/.5)):n.lockAt===undefined?0:Math.max(0,Math.min(1,(age-n.lockAt)/.4)),e=open*open*(3-2*open);
 ctx.save();ctx.translate(x,y);
 if(open<=0){
  ctx.rotate(age*7);ctx.beginPath();ctx.arc(0,0,30,0,7);ctx.fillStyle='#ffffff90';ctx.fill();
  const g=ctx.createRadialGradient(-6,-6,3,0,0,24);g.addColorStop(0,'#ffe3a0');g.addColorStop(1,'#8a5a2a');ellipse(0,0,23,21,g,'#4a2c12');
  for(const [a,b] of [[[-16,-8],[14,10]],[[-12,12],[13,-11]],[[-19,2],[18,-3]]])line([a,b],'#4a2c12',3);
  ellipse(-8,-9,4,4,'#3b4150','#15181f');ellipse(11,7,4,4,'#3b4150','#15181f');
  ctx.restore();return;
 }
 const flutter=reducedMotion.matches?0:Math.sin(time*6+n.id)*.05;
 // Gliding net: the rope net seen edge-on, mouth toward the knight on the left, pocket trailing on the right, leaning into its path.
 if(n.sx!==undefined&&netOpenImg.complete&&netOpenImg.naturalWidth){
  const fl=typeof flight==='object'&&flight?flight:null,dx=(n.vx-(fl?.vx||0))*15,dy=-(n.vy-(fl?.vy||0)*GGCourse.AIR_Y_SCALE)*.85,lean=Math.max(-.55,Math.min(.55,Math.atan2(-dy,-dx)));
  const tall=NET_TALL*(.25+.75*e),wide=tall*netOpenImg.naturalWidth/netOpenImg.naturalHeight*(.45+.55*e)*1.25,pop=1+Math.sin(Math.min(1,open)*Math.PI)*.12;
  ctx.rotate(lean*e+flutter);ctx.scale(pop,pop);
  if(!reducedMotion.matches)for(let k=0;k<4;k++){ctx.globalAlpha=.3-k*.06;line([[wide*.9+k*16,(k-1.5)*tall*.2],[wide*.9+60+k*26,(k-1.5)*tall*.24]],'#ffffff',5);}ctx.globalAlpha=1;
  ctx.drawImage(netOpenImg,-wide/2,-tall/2,wide,tall);
  ctx.restore();return;
 }
 const r=26+(NET_R-26)*e,ry=r*.9;
 ctx.rotate(Math.atan2(-n.vy*.85,n.vx*15)*.15+flutter);
 if(!reducedMotion.matches)for(let k=0;k<3;k++){ctx.globalAlpha=.25-k*.07;line([[-r*1.1-k*18,(k-1)*18],[-r*1.7-k*22,(k-1)*22]],'#ffffff',5);}ctx.globalAlpha=1;
 netMesh(r,ry,22);netRim(r,ry);
 ctx.restore();
}
function caughtNetArt(x,y,age){
 const wobble=reducedMotion.matches?0:Math.sin(age*13)*.12*Math.exp(-age*.4),rx=78,ry=86;
 ctx.save();ctx.translate(x,y-6);ctx.rotate(wobble);
 netMesh(rx,ry,20);netRim(rx,ry);
 ellipse(0,-ry-8,11,10,'#8a6a42','#4a2c12');line([[-6,-ry-4],[6,-ry-12]],'#ffd27a',2);
 for(const k of [-34,0,34]){const sw=reducedMotion.matches?0:Math.sin(age*9+k)*4;line([[k,ry-6],[k+sw,ry+18]],'#4a2c12',4);line([[k,ry-6],[k+sw,ry+18]],'#ffd27a',1.5);ellipse(k+sw,ry+22,6,6,'#3b4150','#15181f');}
 if(age<1.2){ctx.font="900 34px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#26353b';ctx.lineWidth=7;ctx.fillStyle='#ffe16b';ctx.globalAlpha=1-age/1.2;ctx.strokeText('PRIS !',0,-ry-30-age*20);ctx.fillText('PRIS !',0,-ry-30-age*20);}
 ctx.restore();
}
// The witch's hut: a floating wooden cabin on a cloud at 1 000 m; flying into it blows it into planks and frees the witch.
const witchHutImg=new Image();witchHutImg.src='assets/witch-hut.png';const netOpenImg=new Image();netOpenImg.src='assets/net-open.png';
function witchHutArt(f,wx,wy){
 // Drawn in a 340-unit box scaled to GGCourse.witchHut.size: a floating island on a bank of clouds, big enough to spot from afar.
 const h=GGCourse.witchHut,S=340,k=(h.size||S)/S,time=f?.time||0,calm=reducedMotion.matches,sway=calm?0:Math.sin(time*.7);
 const puff=(px,py,s,fill)=>{ctx.save();ctx.translate(px,py);ctx.scale(s,s);ctx.beginPath();ctx.moveTo(-58,16);ctx.bezierCurveTo(-88,-8,-48,-37,-24,-20);ctx.bezierCurveTo(-19,-58,40,-57,42,-17);ctx.bezierCurveTo(82,-28,102,14,60,18);ctx.bezierCurveTo(40,34,-36,34,-58,16);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#9fc4d6';ctx.lineWidth=3.2/(s*k);ctx.stroke();ctx.restore();};
 ctx.save();ctx.translate(wx(h.x),wy(h.y));ctx.scale(k,k);
 for(const [px,py,s] of [[-118,132,1.25],[104,136,1.35],[-8,150,1.5]])puff(px+sway*3,py,s,'#dcebf4');
 if(f?.witchFound){
  const age=f.witchHit?time-f.witchHit.at:9;
  if(age<1.5&&!calm)for(let j=0;j<16;j++){const d=j%2?1:-1;ctx.save();ctx.translate(d*age*(40+j*14),-80+age*age*150-age*90+j*9);ctx.rotate(age*(j-8));rect(-16,-5,32,10,j%3?'#7a4b2a':'#5a3a22','#2b1a10');ctx.restore();}
  ctx.save();ctx.translate(0,S*.34);for(let j=0;j<9;j++){ctx.save();ctx.translate(-120+j*30,-(j%3)*9);ctx.rotate((j%2?1:-1)*.25);rect(-24,-6,48,12,j%2?'#7a4b2a':'#5a3a22','#2b1a10');ctx.restore();}
  ellipse(46,4,10,11,'#3a3f4d','#1f2430');ellipse(-70,2,6,9,'#b94cff','#2b1a10');ellipse(-54,4,6,9,'#58d64a','#2b1a10');
  if(age<6&&!calm)for(let i=0;i<4;i++){const q=((time*.4+i*.25)%1);ctx.globalAlpha=(1-q)*.35;ellipse(-30+i*25+Math.sin(time+i)*8,-10-q*120,14+q*16,9+q*8,'#b9b9b4',null);}ctx.globalAlpha=1;
  ctx.restore();
 }else if(witchHutImg.complete&&witchHutImg.naturalWidth){
  const bob=calm?0:Math.sin(time*1.3)*2.2;ctx.drawImage(witchHutImg,-S/2,-S/2+bob,S,S);
  // Green potion smoke from the chimney and a warm glow at the window.
  if(!calm)for(let i=0;i<4;i++){const q=((time*.3+i*.25)%1);ctx.globalAlpha=(1-q)*.45;ellipse(S*.33+Math.sin(time*1.5+i)*8,-S*.45-q*80+bob,8+q*16,6+q*9,'#8dff4a',null);}ctx.globalAlpha=1;
 }
 for(const [px,py,s] of [[-150,152,.82],[-66,166,1],[30,170,1.05],[122,160,.9],[178,146,.62]])puff(px-sway*4,py,s,'#f6fcfe');
 ctx.restore();
}
function springArt(x,ground,age=-1){
 const rest=42;let h=rest;
 if(age>=0&&age<.7&&!reducedMotion.matches){if(age<.12)h=rest-(rest-15)*Math.sin(age/.12*Math.PI/2);else h=rest+Math.sin((age-.12)/.58*Math.PI*2)*25*(1-(age-.12)/.58);}
 ctx.save();ctx.translate(x,ground);ellipse(0,0,74,8,'#26353b33');
 rounded(-68,-12,136,14,5,'#a77848','#3d3531',3);
 for(const sx of [-36,36]){const pts=[];for(let i=0;i<=8;i++)pts.push([sx+(i===0||i===8?0:i%2?12:-12),-13-h*i/8]);line(pts,'#344452',8);line(pts,'#d8e5ee',4);}
 rounded(-73,-h-27,146,20,9,age>=.7?'#b97056':'#ed654a','#3d3531',4);line([[-60,-h-22],[58,-h-22]],'#ffc59c',3);
 for(const sx of [-54,54])ellipse(sx,-5,3,3,'#e3c58e');
 if(age<0){line([[-12,-h-13],[0,-h-23],[12,-h-13]],'#fff4c5',4);}
 ctx.restore();
}

// Animated witch stirring her cauldron in the magic shop (own canvas, game clock).
let witchTime=0;
function drawWitchScene(dt){
 const canvasEl=$('witch-scene');if(!canvasEl)return;const c=canvasEl.getContext('2d');
 if(!reducedMotion.matches)witchTime+=dt;const t=witchTime,INK='#2a1636',still=reducedMotion.matches;
 const P=(pts,fill,stroke=INK,w=3)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.stroke();}};
 const E=(x,y,rx,ry,fill,stroke=null,w=3)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
 const L=(pts,stroke=INK,w=3)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=stroke;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();};
 const Q=(pts,fill,stroke=INK,w=3)=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i+=2)c.quadraticCurveTo(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.stroke();}};
 const lin=(x0,y0,x1,y1,stops)=>{const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,col])=>g.addColorStop(o,col));return g;};
 const rad=(x,y,r0,r1,stops)=>{const g=c.createRadialGradient(x,y,r0,x,y,r1);stops.forEach(([o,col])=>g.addColorStop(o,col));return g;};
 c.clearRect(0,0,420,300);c.save();
 const stir=t*2.2,bob=still?0:Math.sin(stir)*2.5,blink=!still&&(t%3.7)>3.55,sway=still?0:Math.sin(t*1.6)*9,hx=214+Math.cos(stir)*14,hy=176+Math.sin(stir)*5,bx=268+Math.cos(stir)*34,by=208+Math.sin(stir)*9;
 // Night backdrop, moon and twinkling stars.
 c.fillStyle=lin(0,0,0,300,[[0,'#1a0f2a'],[1,'#2f1a44']]);c.fillRect(0,0,420,300);
 E(66,44,22,22,'#ffe9a6');E(76,38,20,20,'#1d1130');
 for(let i=0;i<9;i++){const sx=30+i*44+(i%3)*9,sy=18+(i*37)%70,tw=still?1:.55+.45*Math.sin(t*3+i*1.9);c.globalAlpha=tw;E(sx,sy,1.6+(i%2),1.6+(i%2),'#fff4c8');c.globalAlpha=1;}
 c.fillStyle='#17101f';c.fillRect(0,292,420,8);
 // Green glow of the brew on everything around.
 c.fillStyle=rad(270,205,10,190,[[0,'#8dff4a66'],[1,'#8dff4a00']]);c.fillRect(0,0,420,300);
 // Black cat, sitting by the fire, tail swinging.
 c.save();c.translate(392,0);
 c.beginPath();c.moveTo(12,284);c.quadraticCurveTo(34+sway*.6,286,26+sway,248);c.strokeStyle='#15101b';c.lineWidth=7;c.lineCap='round';c.stroke();
 E(0,274,17,20,'#15101b');E(0,250,14,13,'#15101b');P([[-13,243],[-11,228],[-2,240]],'#15101b',null);P([[13,243],[11,228],[2,240]],'#15101b',null);
 if(!blink){E(-5,250,3.5,4,'#b6ff5a');E(5,250,3.5,4,'#b6ff5a');E(-5,250,1.2,3.5,'#15101b');E(5,250,1.2,3.5,'#15101b');}
 E(0,256,2,1.5,'#ff8aa0');L([[-14,257],[-5,258]],'#8a8690',1);L([[14,257],[5,258]],'#8a8690',1);
 E(0,266,10,3,'#d6414f');E(0,269,2.5,2.5,'#ffd25a');
 c.restore();
 // Fire and logs under the cauldron.
 L([[200,294],[340,294]],'#5a3b2a',7);L([[212,288],[328,296]],'#6e4a33',6);
 for(let i=0;i<8;i++){const fx=212+i*17,flick=still?0:Math.sin(t*13+i*1.7)*8+Math.sin(t*7+i)*4,h=24+flick+(i%2)*7;P([[fx-9,293],[fx-4,293-h*.6],[fx,293-h],[fx+4,293-h*.6],[fx+9,293]],i%2?'#ff8a1f':'#ffc62e','#c8481f',2);P([[fx-4,293],[fx,293-h*.45],[fx+4,293]],'#fff2a8',null);}
 // ---- Witch (behind the cauldron), bobbing with each stir.
 c.save();c.translate(0,bob);
 // Striped stockings and curly boots.
 for(const lx of [100,138]){P([[lx-9,258],[lx+9,258],[lx+8,290],[lx-8,290]],'#6b3fa0',INK,2.5);for(let s=0;s<3;s++)P([[lx-8,262+s*9],[lx+8,262+s*9],[lx+8,266+s*9],[lx-8,266+s*9]],'#1c1226',null);
  Q([[lx-10,286],[lx-6,298],[lx+8,296],[lx+26,298],[lx+30,284],[lx+22,286],[lx+10,286]],'#1c1226',INK,2.5);}
 // Robe with folds, ragged hem and a belt.
 Q([[94,170],[70,220],[56,268],[120,280],[188,268],[172,220],[150,170],[122,176],[94,170]],lin(80,170,180,270,[[0,'#7a3fa8'],[.6,'#5a2d84'],[1,'#3f1d5e']]));
 P([[56,268],[70,258],[84,270],[98,258],[112,272],[126,258],[140,272],[154,258],[168,270],[182,258],[188,268],[120,282]],'#3a1a58',INK,2.5);
 L([[108,190],[96,250]],'#4a2470',3);L([[136,192],[150,250]],'#4a2470',3);
 P([[72,216],[172,216],[176,230],[68,230]],'#2b1a3a',INK,2.5);P([[110,212],[134,212],[136,234],[108,234]],'#e2b64f','#8a6520',2.5);P([[116,218],[128,218],[128,228],[116,228]],'#2b1a3a',null);
 // Left arm on the hip, with a flared cuff.
 c.beginPath();c.moveTo(96,180);c.quadraticCurveTo(62,196,70,226);c.strokeStyle=INK;c.lineWidth=20;c.lineCap='round';c.stroke();c.strokeStyle='#6a3598';c.lineWidth=14;c.stroke();
 P([[58,222],[86,222],[84,236],[60,236]],'#4a2470',INK,2.5);E(72,238,10,8,'#9ad35a',INK,2.5);for(const fx of [64,70,77])E(fx,243,3,4,'#9ad35a',INK,1.5);
 // Stirring arm toward the cauldron.
 c.beginPath();c.moveTo(148,180);c.quadraticCurveTo(186,186,hx,hy);c.strokeStyle=INK;c.lineWidth=22;c.lineCap='round';c.stroke();c.strokeStyle='#6a3598';c.lineWidth=16;c.stroke();
 c.save();c.translate(hx,hy);c.rotate(Math.atan2(hy-186,hx-186));P([[-14,-11],[2,-13],[4,13],[-14,11]],'#4a2470',INK,2.5);c.restore();
 E(hx+2,hy,11,10,'#9ad35a',INK,2.5);for(let k=0;k<3;k++)E(hx+8,hy-6+k*6,4,3,'#9ad35a',INK,1.5);
 // Neck, hair behind the head.
 P([[110,152],[132,152],[134,176],[108,176]],'#86bf4c',INK,2.5);
 Q([[88,108],[60,150],[64,215],[84,206],[88,170],[96,140],[92,120]],lin(60,110,100,210,[[0,'#8e74ad'],[1,'#5a4478']]));
 Q([[150,112],[166,146],[170,196],[158,194],[156,160],[150,130],[152,118]],'#7a6299');
 // Head: green skin, pointed chin, pointed ear.
 Q([[86,112],[82,160],[114,166],[122,168],[150,160],[158,110],[122,96]],rad(108,118,6,60,[[0,'#b9ea70'],[1,'#7db73e']]));
 P([[86,124],[70,110],[84,142]],'#8fc84e',INK,2.5);E(80,124,3,5,'#6fa33a',null);
 c.fillStyle='#8dff4a33';E(146,138,16,26,'#8dff4a2a',null);
 E(102,146,8,5,'#f2a0a0aa',null);E(142,142,8,5,'#f2a0a0aa',null);
 // Eyes (big, friendly) with a blink; brows.
 for(const [ex,ey] of [[106,126],[134,124]]){if(blink){E(ex,ey,10,10,'#8fc84e',INK,2.5);L([[ex-8,ey+2],[ex+8,ey+2]],INK,2.5);}else{E(ex,ey,10,11,'#fffbe8',INK,2.5);E(ex+2,ey+1,5.5,6,'#d99a2b');E(ex+2,ey+1,3,3.2,'#2a1636');E(ex,ey-3,2,2,'#fff');}}
 L([[94,112],[112,116]],INK,4);L([[126,114],[146,108]],INK,4);
 // Hooked nose with a hairy wart, and a wide grin with one tooth.
 Q([[134,126],[168,134],[166,150],[160,160],[138,154],[136,148],[134,126]],'#8fc84e');E(158,150,4,4,'#6fa33a',INK,1.5);L([[160,146],[164,140]],INK,1.5);
 c.beginPath();c.moveTo(100,150);c.quadraticCurveTo(124,180,152,156);c.quadraticCurveTo(126,164,100,150);c.fillStyle='#4a1030';c.fill();c.strokeStyle=INK;c.lineWidth=3;c.lineJoin='round';c.stroke();
 P([[118,159],[126,159],[125,169],[119,169]],'#fffbe8',INK,1.5);c.beginPath();c.moveTo(106,164);c.quadraticCurveTo(124,172,146,160);c.strokeStyle='#e46a7a';c.lineWidth=3;c.stroke();
 // Hat: shaded brim, patched cone with a swaying tip, buckle band and a tiny moon charm.
 E(120,100,68,15,lin(52,86,188,114,[[0,'#4f2f6e'],[1,'#2a1636']]),INK,3);
 Q([[70,100],[96,54],[104,40],[112,24],[134+sway,8],[132+sway*.6,34],[134,52],[150,70],[172,100]],lin(80,20,170,100,[[0,'#6a3f93'],[.6,'#4a2a6a'],[1,'#30193f']]));
 L([[112,26],[134+sway,8]],'#8a5fb3',3);
 P([[118,52],[138,56],[136,72],[114,68]],'#9a6fc2',INK,2);L([[122,54],[126,70]],INK,1.5);L([[130,55],[132,70]],INK,1.5);
 P([[82,96],[164,96],[158,78],[88,78]],'#e2b64f','#8a6520',2.5);P([[114,76],[130,76],[131,98],[113,98]],'#7a5b32','#f1d784',2.5);
 E(100,88,5,5,'#ffe9a6',null);E(103,86,4.5,4.5,'#e2b64f',null);
 c.restore();
 // ---- Cauldron with its glowing brew, bubbles and steam.
 E(270,292,86,8,'#0c0810');
 for(const lx of [222,318])L([[lx,262],[lx-4,292]],INK,9);
 c.beginPath();c.moveTo(174,206);c.quadraticCurveTo(178,284,270,284);c.quadraticCurveTo(362,284,366,206);c.closePath();c.fillStyle=lin(180,200,360,300,[[0,'#4d5565'],[.5,'#2b2f3a'],[1,'#15181f']]);c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke();
 c.beginPath();c.moveTo(192,232);c.quadraticCurveTo(200,274,268,276);c.strokeStyle='#5a6272';c.lineWidth=5;c.lineCap='round';c.stroke();
 E(270,206,98,30,lin(172,176,368,236,[[0,'#5b6474'],[.5,'#3a3f4d'],[1,'#20242d']]),INK,3);E(270,206,98,30,null,'#7d8798',1.5);
 E(270,206,86,22,lin(0,176,0,236,[[0,'#c9ff62'],[1,'#49cf1c']]),'#2f6a12',2);
 E(248,200,32,7,'#eaffb8',null);
 // Ladle: handle from the hand down into the brew, bowl half submerged.
 L([[hx+4,hy+2],[bx,by-8]],'#4a2f1c',8);L([[hx+4,hy+2],[bx,by-8]],'#9a7042',3.5);E(bx,by-2,16,8,'#8c8f99',INK,2.5);E(bx,by-4,11,3,'#5fd21f',null);
 const wave=still?0:Math.sin(t*4)*2;c.beginPath();c.ellipse(bx,by,24+wave,8,0,0,Math.PI*2);c.strokeStyle='#eaffb8';c.lineWidth=2;c.stroke();
 // Rising bubbles that pop at the top.
 for(let i=0;i<9;i++){const phase=(t*.42+i*.173)%1,x=270+Math.sin(i*2.7)*66*(1-phase*.2),y=200-phase*78-Math.abs(Math.sin(i*1.3))*8,r=3+(i%3)*1.6+phase*5;
  c.save();if(phase<.82){c.globalAlpha=.95-phase*.5;E(x,y,r,r,'#c8ff7a','#2f6a12',2);E(x-r*.35,y-r*.35,r*.3,r*.3,'#ffffffcc',null);}
  else{const q=(phase-.82)/.18;c.globalAlpha=1-q;for(let k=0;k<6;k++){const a=k*Math.PI/3;L([[x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6],[x+Math.cos(a)*(r+q*12),y+Math.sin(a)*(r+q*12)]],'#d9ff8a',2);}}
  c.restore();}
 // Steam wisps and little sparkles.
 for(let i=0;i<3;i++){const q=(t*.25+i*.33)%1;c.save();c.globalAlpha=(1-q)*.35;E(240+i*30+Math.sin(t+i)*10,176-q*90,16+q*14,9+q*6,'#dfffc0',null);c.restore();}
 for(let i=0;i<5;i++){const q=(t*.5+i*.2)%1,sx=210+i*30+Math.sin(i*4)*12,sy=190-q*110,s=2+Math.sin(q*Math.PI)*3;c.save();c.globalAlpha=Math.sin(q*Math.PI);P([[sx,sy-s*2],[sx+s*.6,sy],[sx,sy+s*2],[sx-s*.6,sy]],'#fff6a8',null);P([[sx-s*2,sy],[sx,sy+s*.6],[sx+s*2,sy],[sx,sy-s*.6]],'#fff6a8',null);c.restore();}
 for(let i=0;i<5;i++){const q=(t*.9+i*.2)%1;E(206+i*32+Math.sin(i*5)*6,208-Math.sin(q*Math.PI)*4,5+q*4,3+q*2,null,'#eaffb8',1.5);}
 c.restore();
}

// ---- Towers on the ground and on clouds: goblin archer, crack, break-up and rubble share one drawing (tower units, scaled).
function towerStructureArt(key,x,groundY,scale,f){
 const fracture=f?.towerBreaks?.[key],age=fracture?f.time-fracture.at:0;
 ctx.save();ctx.translate(x,groundY);ctx.scale(scale,scale);
 if(f?.destroyed.has(key)){
  if(fracture&&age<1.6&&!reducedMotion.matches){
   for(const side of [-1,1]){ctx.save();ctx.translate(side*age*33,age*age*55);ctx.rotate(side*age*.35);ctx.beginPath();ctx.moveTo(side*150,-310);ctx.lineTo(0,-310);for(let y=-290,j=0;y<35;y+=24,j++)ctx.lineTo(j%2?10:-8,y);ctx.lineTo(side*150,35);ctx.closePath();ctx.clip();towerWithGoblin(0,0,null,0);ctx.restore();}
   for(let j=0;j<16;j++){const d=j%2?1:-1;ctx.save();ctx.translate(d*age*(18+j*6.5),-50-j%5*35+age*age*100-age*60);ctx.rotate(age*(j-8));rect(-5,-3,10,6,j%3?'#b9b4a5':'#b78049','#403e39');ctx.restore();}
  }else for(let j=0;j<9;j++)rounded(-65+j*15.5,-6-(j%3)*5,15,10,3,'#aaa594','#454640',1.5);
  ctx.restore();return;
 }
 const aim=f?.towerAim?.[key],aiming=aim&&f.time-aim.at<.1;
 towerWithGoblin(0,0,aiming?aim.angle:null,f?.monsterTime||motion.time,!!f&&f.time-(f.towerShot?.[key]??-9)<.25);
 if(f?.towerDamage?.[key])crackArt(f.towerDamage[key]);
 ctx.restore();
}
// A proper fissure: dark crevice with a lit edge, side fissures, loosened chips and a little dust.
function crackArt(level=1){
 const pts=[[-48,-30],[-30,-52],[-36,-70],[-18,-92],[-24,-108],[-4,-126],[2,-146],[14,-160]];
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle='#1d1b19';ctx.lineWidth=5;ctx.stroke();
 ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0]-1.6,p[1]-1.6):ctx.moveTo(p[0]-1.6,p[1]-1.6));ctx.strokeStyle='#eae2cf';ctx.lineWidth=1.5;ctx.stroke();
 for(const [px,py,dx,dy] of [[-30,-52,-14,-6],[-18,-92,12,-4],[2,-146,10,6],[-36,-70,-10,8],[-24,-108,-9,-7]]){line([[px,py],[px+dx,py+dy]],'#1d1b19',2.5);line([[px-1,py-1],[px+dx*.6-1,py+dy*.6-1]],'#eae2cf',1);}
 for(const [cx,cy,r] of [[-40,-40,4],[-10,-100,3],[6,-150,3.5],[-26,-80,2.5],[-2,-122,2.5]]){ellipse(cx,cy,r,r*.7,'#3b3a36');ellipse(cx-1,cy-1,r*.5,r*.35,'#9a978d');}
 if(level>=3)for(let i=0;i<5;i++)ellipse(-20+i*8,-14-i*3,6,3,'#c9c3b0aa');
 ctx.restore();
}
// The castle breaks in two like the towers, then leaves a wide field of rubble.
function castleBreakArt(x,ground,f){
 const fracture=f?.towerBreaks?.[500],age=fracture?f.time-fracture.at:9;
 if(age<2.2&&!reducedMotion.matches){
  for(const side of [-1,1]){ctx.save();ctx.translate(x+side*age*90,ground+age*age*150);ctx.rotate(side*age*.22);ctx.beginPath();ctx.moveTo(side*520,-980);ctx.lineTo(0,-980);for(let y=-940,j=0;y<40;y+=60,j++)ctx.lineTo(j%2?26:-22,y);ctx.lineTo(side*520,40);ctx.closePath();ctx.clip();castleArt(0,0,true);ctx.restore();}
  for(let j=0;j<28;j++){const d=j%2?1:-1;ctx.save();ctx.translate(x+d*age*(60+j*16),ground-120-j%7*90+age*age*260-age*170);ctx.rotate(age*(j-14)*.6);rounded(-20,-12,40,24,3,j%3?'#cbc1a5':'#c0463a','#4b4b46',2);ctx.restore();}
  ctx.save();ctx.globalAlpha=Math.max(0,1-age/2.2);for(let j=0;j<10;j++)ellipse(x-300+j*66,ground-30-(j%3)*40+age*20,60+age*40,34+age*20,'#d9d2c0');ctx.restore();
  return;
 }
 castleRubbleArt(x,ground);
}
function castleRubbleArt(x,ground){
 ctx.save();ctx.translate(x,ground);ellipse(0,8,430,16,'#2f3f2e2e');
 for(const side of [-1,1]){const tx=side*330;rounded(tx-80,-190,160,190,8,'#d9cfb3','#4b4b46',3);path([[tx-80,-190],[tx-50,-230],[tx-20,-200],[tx+10,-250],[tx+40,-205],[tx+80,-240],[tx+80,-190]],'#cbc1a5','#4b4b46',3);}
 rounded(-270,-120,540,120,6,'#d6ccb0','#4b4b46',3);path([[-270,-120],[-230,-160],[-180,-130],[-120,-170],[-60,-125],[0,-180],[60,-130],[130,-165],[200,-128],[270,-150],[270,-120]],'#cfc5a8','#4b4b46',3);
 ctx.beginPath();ctx.moveTo(-72,0);ctx.lineTo(-72,-110);ctx.quadraticCurveTo(0,-150,72,-110);ctx.lineTo(72,0);ctx.closePath();ctx.fillStyle='#1f2626';ctx.fill();ctx.strokeStyle='#4b4b46';ctx.lineWidth=3;ctx.stroke();
 for(let j=0;j<22;j++){const px=-420+j*40+(j%3)*7,py=-8-(j%4)*9;rounded(px,py-14,34,22,5,['#cbc1a5','#d9d0b6','#c4b99c','#c0463a'][j%4],'#4b4b46',2);}
 for(let i=0;i<6;i++){ctx.save();ctx.translate(-120+i*48,-20);ctx.rotate((i-3)*.4);timber(-5,-10,10,34);ctx.restore();}
 for(const [mx,my,r] of [[-300,-4,18],[-120,-5,16],[160,-4,15],[330,-5,19]])ellipse(mx,my,r,7,'#7fb24a','#4e7a2a');
 ctx.restore();
}
// ---- Cloud world: a grumpy rain cloud and a pair of clouds joined by a rainbow (vector, animated).
function puffyCloud(w,h,fill,stroke){ctx.beginPath();ctx.moveTo(-w*.42,h*.2);ctx.bezierCurveTo(-w*.6,-h*.05,-w*.38,-h*.45,-w*.18,-h*.25);ctx.bezierCurveTo(-w*.12,-h*.75,w*.26,-h*.72,w*.3,-h*.25);ctx.bezierCurveTo(w*.62,-h*.35,w*.68,h*.15,w*.4,h*.22);ctx.bezierCurveTo(w*.3,h*.5,-w*.3,h*.5,-w*.42,h*.2);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}
function rainCloudArt(time){
 ctx.save();puffyCloud(230,130,'#a9bdd2','#4a5a70');
 ctx.save();ctx.beginPath();ctx.moveTo(-96,26);ctx.bezierCurveTo(-120,-6,-86,-56,-40,-32);ctx.bezierCurveTo(-30,-96,60,-92,69,-32);ctx.bezierCurveTo(142,-46,156,20,92,30);ctx.closePath();ctx.clip();ctx.fillStyle='#8ea3bb';ctx.fillRect(-150,-8,300,70);ctx.restore();
 ellipse(-28,-18,7,8,'#2f3c4c');ellipse(26,-18,7,8,'#2f3c4c');ellipse(-26,-21,2.5,2.5,'#fff');ellipse(28,-21,2.5,2.5,'#fff');
 ctx.beginPath();ctx.moveTo(-18,12);ctx.quadraticCurveTo(0,0,18,12);ctx.strokeStyle='#2f3c4c';ctx.lineWidth=3;ctx.stroke();line([[-42,-36],[-22,-30]],'#2f3c4c',3);line([[42,-36],[22,-30]],'#2f3c4c',3);
 for(let i=0;i<9;i++){const q=((reducedMotion.matches?.3:time*.9)+i*.17)%1,dx=-85+i*21,dy=42+q*72;ctx.globalAlpha=1-q;path([[dx,dy-8],[dx+4,dy],[dx,dy+6],[dx-4,dy]],'#6fb7ff','#2f6fb0',1.5);}
 ctx.globalAlpha=1;ctx.restore();
}
function rainbowCloudsArt(time){
 ctx.save();
 for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(0,48,104-i*9,Math.PI*1.08,Math.PI*1.92);ctx.strokeStyle=['#ff5f5f','#ffa43b','#ffe93b','#6fe36f','#5fb6ff','#7d7dff','#d27dff'][i];ctx.lineWidth=9;ctx.stroke();}
 for(const sx of [-1,1]){ctx.save();ctx.translate(sx*96,38+Math.sin(time*2+sx)*3);ctx.scale(.62,.62);puffyCloud(230,130,'#ffffff','#9fb2c4');ellipse(-18,-10,5,6,'#2f3c4c');ellipse(16,-10,5,6,'#2f3c4c');ctx.beginPath();ctx.moveTo(-14,8);ctx.quadraticCurveTo(0,22,14,8);ctx.strokeStyle='#2f3c4c';ctx.lineWidth=3;ctx.stroke();ellipse(-28,4,7,4,'#ffb3c6');ellipse(28,4,7,4,'#ffb3c6');ctx.restore();}
 for(let i=0;i<5;i++){const q=((reducedMotion.matches?.4:time*.7)+i*.2)%1;ctx.globalAlpha=1-q;text('✦',-60+i*30,-22-q*40,16+q*8,'#fff6a8','center');}
 ctx.globalAlpha=1;ctx.restore();
}
// ---- Arrows loosed from the towers.
function arrowArt(x,y,vx,vy){
 const ang=Math.atan2(-vy*.85,vx*15);ctx.save();ctx.translate(x,y);ctx.rotate(ang);
 line([[-44,0],[36,0]],'#8b5a2b',6);line([[-44,0],[36,0]],'#c8914f',2);path([[36,0],[58,-7],[62,0],[58,7]],'#9ea4ab','#2f3338',2);
 for(const s of [-1,1])path([[-44,0],[-58,s*12],[-30,s*5]],'#d3453b','#5a1f1a',1.5);
 ctx.restore();
}
// ---- Wall chest: lid swings open, coins jump out and sparkle.
function chestEffectsArt(wx,wy,f){
 const chestClock=f.ended?f.time+landingTime:f.time;
 for(const e of f.chestEffects||[]){const age=chestClock-e.at;if(age<0||age>2.4)continue;const x=wx(e.x),y=wy(e.y),open=Math.min(1,age*2.4);
  treasureChestArt(x,y,open,Math.max(0,1-age/1.6));
  for(let j=0;j<8;j++){const t=Math.max(0,age-.1-j*.05);if(t<=0||t>1.5)continue;const cx=x+Math.cos(j*2.1)*t*95,cy=y-8-(t*230-t*t*260);ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,1-(t-1)/.5));ellipse(cx,cy,9,9,'#ffd84a','#a87a1c');ellipse(cx,cy,5,5,'#fff0a8');ctx.restore();}
  for(let j=0;j<10;j++){const a=j*Math.PI/5+age*2,r=30+age*60;ctx.save();ctx.globalAlpha=Math.max(0,1-age/1.3);text('✦',x+Math.cos(a)*r,y-10+Math.sin(a)*r*.7,14,'#fff6a8','center');ctx.restore();}
 }
}
// ---- Flying bomb: a fat round cartoon bomb with a sizzling fuse and a warning glow.
function airBombArt(x,y,time){
 const calm=reducedMotion.matches,bob=calm?0:Math.sin(time*2.2)*6,pulse=calm?.5:.5+.5*Math.sin(time*6);
 ctx.save();ctx.translate(x,y+bob);if(!calm)ctx.rotate(Math.sin(time*1.7)*.09);
 ellipse(0,6,70+pulse*10,70+pulse*10,'rgba(255,96,48,'+(.10+pulse*.10)+')');ellipse(0,6,52,52,'rgba(255,190,80,.16)');
 // Body, band and shine.
 ellipse(0,10,40,40,'#23262e','#0e1014');
 ctx.save();ctx.beginPath();ctx.ellipse(0,10,38,38,0,0,7);ctx.clip();ellipse(-8,24,44,34,'#2f3440');ellipse(14,30,40,22,'#191b21');rounded(-44,2,88,13,0,'#c7392f','#5e1612',2);ctx.restore();
 ctx.beginPath();ctx.ellipse(0,10,40,40,0,0,7);ctx.strokeStyle='#0e1014';ctx.lineWidth=4;ctx.stroke();
 ellipse(-16,-8,11,7,'#8d96a8');ellipse(-21,-12,4,3,'#eef3ff');
 // Angry eyes: this thing wants to go off.
 path([[-18,2],[-4,8],[-6,16],[-18,13]],'#fff6d8','#0e1014',2);path([[18,2],[4,8],[6,16],[18,13]],'#fff6d8','#0e1014',2);ellipse(-9,11,2.6,2.6,'#0e1014');ellipse(9,11,2.6,2.6,'#0e1014');
 // Cap, fuse and spark.
 rounded(-11,-40,22,14,4,'#7b8496','#0e1014',3);
 ctx.beginPath();ctx.moveTo(0,-40);ctx.quadraticCurveTo(6,-62,24,-58);ctx.strokeStyle='#5b3d24';ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke();ctx.strokeStyle='#d9b36c';ctx.lineWidth=2.5;ctx.stroke();
 const sx=25,sy=-59,sr=9+pulse*6;
 for(let k=0;k<8;k++){const a=k*Math.PI/4+(calm?0:time*5),len=sr*(k%2?1.7:1);line([[sx,sy],[sx+Math.cos(a)*len,sy+Math.sin(a)*len]],k%2?'#ffd85a':'#ff7a2a',3);}
 ellipse(sx,sy,6,6,'#fff3b0');
 if(!calm)for(let k=0;k<3;k++){const q=((time*1.6+k*.33)%1);ctx.globalAlpha=1-q;ellipse(sx+6+q*18+k*3,sy-4-q*22,2.5,2.5,'#ffb347');}
 ctx.restore();
}
// ---- KABOOOOM: a comic starburst that sticks to the knight while the blast throws him forward.
function kaboomArt(wx,wy){
 const k=motion.kaboom;if(!k||!flight)return;const age=motion.time-k.at;if(age>=1.5){motion.kaboom=null;return;}
 // Above the knight when there is room, just ahead of him when the camera lags behind his climb: never on top of him or
 // under the spell bar.
 const t=ctx.getTransform(),vl=-t.e/t.a,vw=canvas.width/t.a,vt=-t.f/t.d,vh=canvas.height/t.d,ky=wy(flight.y),gap=175/Math.max(.45,Math.min(1,inspectionZoom*1.25));
 const above=ky-gap>=vt+vh*.2,x=Math.max(vl+vw*.3,Math.min(vl+vw*.7,wx(flight.x)+(above?-30:gap*2.3))),y=above?ky-gap:Math.max(vt+vh*.3,ky+gap*.15),inQ=Math.min(1,age/.16),scale=(.35+.65*inQ)*(1+.25*Math.sin(Math.min(1,age/.3)*Math.PI))/Math.max(.45,Math.min(1,inspectionZoom*1.25)),fade=age<1.05?1:Math.max(0,1-(age-1.05)/.45);
 ctx.save();ctx.translate(x,y-age*26);ctx.rotate(-.1+(reducedMotion.matches?0:Math.sin(age*34)*.035*(1-Math.min(1,age/.6))));ctx.scale(scale,scale);ctx.globalAlpha=fade;
 const star=(r1,r2,n,fill,stroke,w)=>{const pts=[];for(let i=0;i<n*2;i++){const a=i*Math.PI/n-.2,r=(i%2?r2:r1)*(1+((i*7)%5)*.05);pts.push([Math.cos(a)*r*1.75,Math.sin(a)*r*.82]);}path(pts,fill,stroke,w);};
 star(158,104,13,'#d8362b','#4a1410',6);star(138,92,13,'#ff8a1f','#7a2a10',4);star(112,78,13,'#ffe14a',null,0);
 ctx.font="900 78px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 ctx.strokeStyle='#4a1410';ctx.lineWidth=16;ctx.strokeText('KABOOOOM !!!',0,4);ctx.strokeStyle='#fff6bf';ctx.lineWidth=6;ctx.strokeText('KABOOOOM !!!',0,4);
 const g=ctx.createLinearGradient(0,-34,0,38);g.addColorStop(0,'#ff3b2a');g.addColorStop(1,'#b3140f');ctx.fillStyle=g;ctx.fillText('KABOOOOM !!!',0,4);
 ctx.restore();
}
// ---- Bomb explosion: fireball, flash, smoke and bricks flying everywhere (bricks bounce on the ground).
function explosionArt(x,y,kind='wall'){
 motion.explosion={x,y,at:motion.time,scale:kind==='bomb'?1.7:1,label:kind==='bomb'?'':'BOUM !'};
 if(kind==='bomb'){
  motion.kaboom={at:motion.time};
  // Iron shards, embers and a fat smoke ring instead of bricks.
  for(let i=0;i<34;i++){const a=i*2.399+.3,s=(14+(i%9)*4)*(i%3?1:1.5);motion.particles.push({x:x+Math.cos(a)*2,y:y+Math.sin(a)*8,vx:Math.cos(a)*s,vy:Math.sin(a)*s*9+40,life:1.3+(i%5)*.2,max:1.9,size:5+i%5,color:['#23262e','#454b57','#1d2026','#6a7180'][i%4],stone:true,brick:true,spin:5+(i%5)*3});}
  for(let i=0;i<40;i++){const a=i*2.399+1,s=22+(i%8)*7;motion.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s*10+30,life:.7+(i%5)*.15,max:1.3,size:3+i%5,color:['#ffd85a','#ff8a2a','#fff3b0','#ff5a2a'][i%4]});}
  for(let i=0;i<26;i++){const a=i*2.399,s=5+(i%6)*3;motion.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s*12+30,life:1.5+(i%4)*.25,max:2.2,size:14+i%10,color:i%3?'#55565c':'#2f3035',smoke:true});}
  if(motion.particles.length>260)motion.particles.splice(0,motion.particles.length-260);
  motion.shake=Math.max(motion.shake,1.5);motion.flash=.22;return;
 }
 // Horizontal speeds are in metres (15 px/m), vertical ones in altitude units (0.85 px/m): keep the bricks on screen.
 const palette=kind==='cannon'?['#7a4b2a','#5a3a22','#3b4150','#2a2f3a']:['#b9b4a5','#9b968a','#c8c2ae','#7d7a70'];
 for(let i=0;i<44;i++){const a=i*2.399+.3,s=(10+(i%9)*3)*(i%3?1:1.4);motion.particles.push({x:x+Math.cos(a)*2,y:y+Math.sin(a)*8,vx:Math.cos(a)*s,vy:Math.sin(a)*s*9+60,life:1.7+(i%5)*.2,max:2,size:6+i%6,color:palette[i%4],stone:true,brick:true,spin:4+(i%5)*3});}
 for(let i=0;i<30;i++){const a=i*2.399,s=4+(i%6)*2.5;motion.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.abs(Math.sin(a))*s*12+40,life:1.4+(i%4)*.2,max:1.8,size:10+i%9,color:i%3?'#8a8a86':'#5d5b58',smoke:true});}
 if(motion.particles.length>220)motion.particles.splice(0,motion.particles.length-220);
 motion.shake=Math.max(motion.shake,1.1);motion.flash=.22;
}
function fireballArt(wx,wy){
 if(!motion.explosion||motion.time-motion.explosion.at>=.95)return;
 const ex=motion.explosion,age=motion.time-ex.at,x=wx(ex.x),y=wy(ex.y),q=age/.95,r=(30+age*190)*(ex.scale||1),label=ex.label??'BOUM !';
 ctx.save();ctx.globalAlpha=Math.pow(1-q,1.4);
 ellipse(x,y,r*1.1,r*.9,'#7a2e12');
 for(let k=0;k<10;k++){const a=k*Math.PI/5+age*1.5,rr=r*(1+(k%2)*.25);ellipse(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.45,rr*.5,rr*.42,k%2?'#ff7a1f':'#ffb63a','#9c3a14',3);}
 ellipse(x,y,r*.5*(1-q*.5),r*.42*(1-q*.5),'#fff3b0');
 for(let k=0;k<14;k++){const a=k*Math.PI/7+.3,len=r*(1.2+(k%3)*.3);line([[x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.5],[x+Math.cos(a)*len,y+Math.sin(a)*len*.8]],k%2?'#ffd25a':'#ff8a2a',4);}
 ctx.font="900 "+(40+age*30)+"px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#5a1f1a';ctx.lineWidth=7;ctx.fillStyle='#fff6bf';if(label){ctx.strokeText(label,x,y-80-age*90);ctx.fillText(label,x,y-80-age*90);}
 ctx.restore();
}
// ---- Rotating wheels on top of the illustrated skateboards (stone, steel, gold, red).
function skateWheelsArt(target,level,k){
 const [face,rim]={8:['#8f8c86','#5a5752'],9:['#c8ced6','#7d858f'],10:['#e2b04a','#8d6a1f'],11:['#d9443c','#7a221d']}[level]||['#8f8c86','#5a5752'];
 const r=22*k,angle=reducedMotion.matches?0:motion.wheelAngle;
 for(const [cx,cy] of [[45,67],[215,67]]){target.save();target.translate(cx*k-135.5*k,cy*k-32.2*k);target.rotate(angle);
  target.beginPath();target.arc(0,0,r,0,Math.PI*2);target.fillStyle=face;target.fill();target.strokeStyle=rim;target.lineWidth=2.5;target.stroke();
  for(let s=0;s<4;s++){target.save();target.rotate(s*Math.PI/2);target.beginPath();target.moveTo(0,-r*.35);target.lineTo(0,-r*.85);target.strokeStyle=rim;target.lineWidth=2.5;target.stroke();target.restore();}
  target.beginPath();target.arc(0,0,r*.28,0,Math.PI*2);target.fillStyle='#fff5cf';target.fill();target.strokeStyle=rim;target.lineWidth=1.5;target.stroke();
  target.restore();}
}
// ---- Choir of singers celebrating a first passage (screen space, ~10 s with the fanfare).
function choirArt(W,H,age){
 const total=9.8,slide=age<.7?1-Math.pow(1-age/.7,3):age>total-.8?Math.max(0,(total-age)/.8):1;
 const t=motion.time,scale=Math.max(.7,Math.min(1.25,W/1200)),baseY=H-(testMode?118:16)-10,offY=(1-slide)*260;
 ctx.save();ctx.setTransform(scale,0,0,scale,W/2-310*scale,baseY+offY);
 ctx.globalAlpha=.55*slide;for(let i=0;i<7;i++){ctx.save();ctx.translate(310,-150);ctx.rotate(-1.4+i*.47+Math.sin(t*.8)*.05);path([[0,0],[-70,-600],[70,-600]],'#fff2a8',null);ctx.restore();}ctx.globalAlpha=1;
 const robes=['#6a3d9a','#8e44ad','#5b2c83','#7d3cb0','#6a3d9a'],hair=['#3b2412','#f2d16b','#8a3a1c','#1d1d22','#c95a2b'];
 for(let i=0;i<5;i++){const sx=90+i*110,sway=Math.sin(t*2.6+i*1.1)*4,bob=Math.sin(t*5.2+i)*2;
  ctx.save();ctx.translate(sx+sway,-bob);
  path([[-44,0],[-30,-120],[30,-120],[44,0]],robes[i],'#2a1636',3);path([[-30,-120],[30,-120],[26,-96],[-26,-96]],'#f6e7b0','#2a1636',2);line([[-36,-18],[36,-18]],'#e6c35a',4);
  rounded(-22,-70,44,30,4,'#c8403a','#2a1636',2);line([[0,-70],[0,-40]],'#2a1636',2);line([[-16,-62],[-6,-62],[-16,-54],[-6,-54]],'#f6e7b0',1.5);
  ellipse(-28,-62,8,10,'#ffd9b3','#2a1636',2);ellipse(28,-62,8,10,'#ffd9b3','#2a1636',2);
  ellipse(0,-148,27,30,'#ffd9b3','#2a1636',3);
  path([[-28,-158],[-22,-186],[0,-192],[22,-186],[28,-158],[14,-170],[0,-166],[-14,-170]],hair[i],'#2a1636',2);
  for(const e of [-10,10]){ctx.beginPath();ctx.arc(e,-152,4,Math.PI,0);ctx.strokeStyle='#2a1636';ctx.lineWidth=2.5;ctx.stroke();}
  ellipse(-16,-142,5,3,'#ffb3c6');ellipse(16,-142,5,3,'#ffb3c6');
  const mouth=6+5*Math.abs(Math.sin(t*7+i*1.7));ellipse(0,-136,6,mouth,'#5a1f1a','#2a1636',2);ellipse(0,-134+mouth*.3,3,mouth*.35,'#ff8a8a');
  ellipse(0,-190,30,8,'#fff6a8aa');
  ctx.restore();
 }
 ctx.font="900 20px 'Barlow Condensed',Impact,sans-serif";
 for(let i=0;i<10;i++){const q=((t*.35)+i*.1)%1,nx=60+i*58+Math.sin(t*2+i)*12,ny=-200-q*160;ctx.save();ctx.globalAlpha=(1-q)*slide;ctx.fillStyle=['#ffe16b','#fff','#ffb3c6'][i%3];ctx.fillText(i%2?'♪':'♫',nx,ny);ctx.restore();}
 ctx.font="900 24px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#2a1636';ctx.lineWidth=5;ctx.fillStyle='#ffe16b';ctx.strokeText('♪ LA CHORALE DU REMPART ♪',310,-226);ctx.fillText('♪ LA CHORALE DU REMPART ♪',310,-226);
 ctx.restore();
}
// ---- Slow time spell: blue tint, vignette, floating hourglasses and the remaining time.
function slowTimeArt(W,H,left,total=1.6){
 const t=motion.time,q=Math.max(0,Math.min(1,left/total));
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 ctx.fillStyle='#4a6fd5';ctx.globalAlpha=.14;ctx.fillRect(0,0,W,H);
 const v=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);v.addColorStop(0,'#1a2d6600');v.addColorStop(1,'#1a2d66aa');ctx.globalAlpha=1;ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
 for(let i=0;i<14;i++){const p=((t*.12)+i*.071)%1,x=(GGMonsters.hash(i*7)*W),y=H-p*H,s=.6+GGMonsters.hash(i*3)*.8;ctx.save();ctx.globalAlpha=(1-Math.abs(p-.5)*2)*.55;ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(Math.sin(t+i)*.3);path([[-10,-14],[10,-14],[0,0],[10,14],[-10,14],[0,0]],'#bfe3ff','#5f8ed6',2);ctx.restore();}
 const bw=Math.min(360,W*.5),bx=W/2-bw/2,by=Math.max(150,H*.32);
 ctx.font="900 28px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#1a2d66';ctx.lineWidth=6;ctx.fillStyle='#dff1ff';ctx.strokeText('⌛ TEMPS RALENTI',W/2,by);ctx.fillText('⌛ TEMPS RALENTI',W/2,by);
 rounded(bx,by+10,bw,12,6,'#1a2d66cc','#dff1ff',2);rounded(bx+2,by+12,(bw-4)*q,8,4,'#8fd0ff',null);
 ctx.restore();
}
