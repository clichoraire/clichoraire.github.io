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
const motion={skates:[],scrape:[],scrapeClock:0,scrapeSeed:0,wheelAngle:0,rollContact:null,foam:[],foamClock:0,foamSeed:0,soap:null,slack:0,time:0,pitch:0,particles:[],emit:0,landed:false,shake:0,wallSlow:0,recoil:0,rings:[]};
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function resetArt(){motion.takeoff=null;motion.skates=[];motion.scrape=[];motion.scrapeClock=0;motion.scrapeSeed=0;motion.wheelAngle=0;motion.rollContact=null;motion.foam=[];motion.foamClock=0;motion.foamSeed=0;motion.soap=null;motion.slack=0;motion.time=0;motion.pitch=0;motion.particles=[];motion.emit=0;motion.landed=false;motion.shake=0;motion.wallSlow=0;motion.recoil=0;motion.rings=[];}
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
  motion.scrapeClock--;const n=motion.scrapeSeed++,seed=(n*37%101)/101,kind=metal&&(pan?n%5!==0:n%4===0)?'spark':n%3===0?'chip':'dust';
  const along=(pan?[-48,-16,20,48][n%4]:n%4===0?55:-45)+(seed-.5)*18,x=pose.contactX+along*Math.cos(pose.rotation),y=GGCourse.rampY(x,flight.launchAngle,flight.l.launch)-3;
  const life=kind==='spark'?.16+seed*.15:kind==='chip'?.45+seed*.3:.4+seed*.45;
  motion.scrape.push({x,y,life,max:life,kind,size:kind==='dust'?3+seed*4+strength*2:2+seed*3,vx:kind==='spark'?45+seed*80:-25-seed*60-strength*30,vy:-15-seed*65,rotation:seed*6,spin:(seed-.5)*12});
 }
 if(motion.scrape.length>100)motion.scrape.splice(0,motion.scrape.length-100);
}
function shieldScrapeArt(cx,cy){
 for(const p of motion.scrape){
  ctx.save();ctx.translate(p.x-cx*GGCourse.X_SCALE,p.y+cy*GGCourse.SCALE);ctx.globalAlpha=p.kind==='dust'?.8*p.life/p.max:Math.min(1,p.life/.18);
  if(p.kind==='dust'){const s=p.size*(1+(1-p.life/p.max)*.7);ellipse(0,0,s,s*.7,'#d9bc8c');ellipse(-s*.7,-s*.1,s*.65,s*.5,'#e8cfa0');ellipse(s*.35,-s*.55,s*.6,s*.55,'#e8cfa0');}
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

motion.shake=Math.max(0,motion.shake-dt*2.3);motion.wallSlow=Math.max(0,motion.wallSlow-dt);motion.recoil=Math.max(0,motion.recoil-dt*7);for(const ring of motion.rings)ring.life-=dt;motion.rings=motion.rings.filter(r=>r.life>0);if(flight){motion.pitch+=(flight.pitch-motion.pitch)*(1-Math.exp(-dt*10));if(state==='landing'&&!motion.landed){motion.landed=true;motion.shake=Math.max(motion.shake,['ground','wall','tower'].includes(flight.endReason)?.85:.15);burst(flight.x,flight.y,['ground','wall','tower'].includes(flight.endReason)?65:24,'#d7bd91');}if(state==='flight'&&flight.boosting){motion.emit+=dt;while(motion.emit>.035){motion.emit-=.035;motion.particles.push({x:flight.x-10,y:flight.y,vx:-20,vy:12,life:.6,max:.6,size:7,color:'#f3dfc6'});}}}for(const p of motion.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=dt*(p.stone?240:65);if(p.stone&&p.y<0){p.y=0;p.vy=Math.abs(p.vy)*.28;p.vx*=.55;}}motion.particles=motion.particles.filter(p=>p.life>0);}
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
 path([[-300,r.top+30],[20,r.top+30],[210,280],[390,485],[-300,485]],'#a6c863','#476642',3);
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
function castleArt(x,ground,destroyed){ctx.save();ctx.translate(x,ground);ellipse(0,4,106,10,'#33463433');
 for(const side of [-1,1]){const px=side*57;rounded(px-26,-128,52,128,5,'#d2c8ad','#45545b',3);rounded(px-31,-137,62,21,3,'#e8dfc8','#45545b',3);for(let i=0;i<3;i++)rounded(px-29+i*23,-149,16,18,2,'#e8dfc8','#45545b',2);for(let row=0;row<5;row++){line([[px-24,-102+row*23],[px+24,-102+row*23]],'#afa88e',1.5);line([[px+(row%2?8:-7),-102+row*23],[px+(row%2?8:-7),-80+row*23]],'#afa88e',1.5);}rounded(px-6,-96,12,27,6,'#45545b',null);line([[px,-149],[px,-187]],'#515348',3);path([[px,-186],[px+31,-180+Math.sin(motion.time*3)*2],[px,-170]],'#cc5c45','#623c38',2);}
 rounded(-33,-94,66,94,5,'#b9af94','#45545b',3);ctx.beginPath();ctx.moveTo(-25,0);ctx.lineTo(-25,-55);ctx.quadraticCurveTo(-25,-82,0,-83);ctx.quadraticCurveTo(25,-82,25,-55);ctx.lineTo(25,0);ctx.fillStyle='#3d4b47';ctx.fill();
 if(!destroyed){for(let i=0;i<5;i++)rounded(-23+i*10,-70,7,70,2,'#9c714c','#4c3c31',1.5);for(const y of [-49,-19])rounded(-26,y,52,7,1,'#555954',null);ellipse(10,-31,3,3,'#dfc982');}else for(let i=0;i<6;i++){ctx.save();ctx.translate(-30+i*12,-5);ctx.rotate((i-2)*.3);timber(-4,-8,8,24);ctx.restore();}
 ctx.restore();}
// The level-zero cape is already painted on the flying knight, attached at his neck.
// Overlay only the purchased gliders; a second cape would float above the sprite.
function gliderArt(level){if(level>=0)return;ctx.save();ctx.translate(-4,-29);GGEquipment.draw(ctx,'wing',level,0,0,.82);ctx.restore();}
function boosterArt(context,level){if(level===0)return;context.save();context.translate(level===0?-29:-42,level===0?2:7);if(level>=2)context.rotate(Math.PI/2);GGEquipment.draw(context,'boost',level,0,0,level===0?.30:.38);context.restore();}
function drawGearPreview(){
 const preview=$('gear-preview');if(!preview)return;const p=preview.getContext('2d'),gear=forgeSelections.launch??save.levels.launch,item=GGLaunch.get(gear),t=reducedMotion.matches?0:clock;
 p.clearRect(0,0,600,360);p.save();
 if(forgeCategory==='wing'&&(forgeSelections.wing??save.levels.wing)>0){GGWingArt.preview(p,forgeSelections.wing??save.levels.wing,t);}
 else if(gear===0&&shieldRider.complete&&shieldRider.naturalWidth){
  const frame=shieldRiderFrame(0,t,true,reducedMotion.matches),cw=shieldRider.naturalWidth/3,ch=shieldRider.naturalHeight/2;
  p.drawImage(shieldRider,frame%3*cw,Math.floor(frame/3)*ch,cw,ch,120,0,360,360);
 }else{
  p.translate(300,285);p.scale(1.7,1.7);
  mountedArt(p,{x:0,y:0,rotation:Math.sin(t*2)*.012},gear,0,true);
 }
 p.restore();$('preview-item').textContent='APERÇU · '+(forgeCategory==='wing'?GGWings.get(forgeSelections.wing??save.levels.wing).name:item.name);preview.setAttribute('aria-label','Godefroy avec '+item.name+' · '+GG.itemName(GG.categories[1],save.levels.wing));
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
 return !moving||progress<.86?(reduced?0:Math.floor(time*3)%2):progress<1?2:3;
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
 if(!moving||progress<.86)return reduced?0:[0,1,0,2][Math.floor(time*4)%4];
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
function mountedArt(target,pose,level,progress,moving){
 const item=GGLaunch.get(level),deck=mountedGeometry(pose,level),time=target===ctx?motion.time:clock;
 if(level===1&&GGRiders.loaded){
  const frame=progress>.86?2:reducedMotion.matches?0:[0,1,0,1][Math.floor(time*3)%4];
  GGRiders.drawRider(target,level,frame,pose.x-Math.sin(pose.rotation)*29,pose.y+Math.cos(pose.rotation)*29,200,pose.rotation);
  return;
 }
 target.save();target.translate(deck.x,deck.y);target.rotate(deck.rotation);
 if(item.type!=='skates'){target.save();target.scale(1,deckDepth(level));GGEquipment.draw(target,'launch',level,0,0,deck.width/220);target.restore();}
 if(item.standing){
  target.translate(0,mountedBodyY(level,deck.height));
  knightPoseArt(launchPoseFrame(progress,motion.time,moving,reducedMotion.matches),true,level,target);
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
 if(mode==='flight'&&motion.takeoff){const t=Math.min(1,flight.time/GGCourse.TIME_SCALE/.12),ease=1-t*t*(3-2*t);ctx.translate(motion.takeoff.x*ease,motion.takeoff.y*ease);angle+=(motion.takeoff.rotation-angle)*ease;}
 if(mode==='flight'&&flight?.l.wing>0&&!flight.wingTorn&&GGWingArt.loaded(flight.l.wing)&&flight.time/GGCourse.TIME_SCALE>=.20){
  ctx.rotate(angle);const age=flight.time/GGCourse.TIME_SCALE-.20;
  GGWingArt.draw(ctx,flight.l.wing,age,motion.time,reducedMotion.matches);
  boosterArt(ctx,flight.l.boost);
  if(flight.boosting)path([[-48,0],[-75,-8],[-63,2],[-85,9],[-48,9]],'#f7aa46','#c75b31',2);
  ctx.restore();return;
 }
 if(mode==='flight'&&flight&&GGLaunch.get(flight.l.launch).standing){ctx.rotate(angle);if(!flight.wingTorn)gliderArt(flight.l.wing);const jumpAge=flight.time/GGCourse.TIME_SCALE,frame=jumpAge<.10?3:jumpAge<.20?4:5;knightPoseArt(frame,false,null);boosterArt(ctx,flight.l.boost);if(flight.boosting){path([[-48,0],[-75,-8],[-63,2],[-85,9],[-48,9]],'#f7aa46','#c75b31',2);}ctx.restore();return;}
 if(idle){const breath=reducedMotion.matches?0:Math.sin(t*2.7)*.012;ctx.scale(1+breath,1-breath);if(hero.complete&&hero.naturalWidth)ctx.drawImage(hero,-43,-75,86,108);}
 else{let tilt=angle;if(crash)tilt=Math.min(.45,amount*1.8);ctx.rotate(tilt);const bob=reducedMotion.matches||(mode==='slide'&&GGLaunch.get(flight?.l.launch??save.levels.launch).type==='skate')?0:Math.sin(t*(flight?.boosting?28:7))*(flight?.boosting?1.3:.65);ctx.translate(0,bob);if(mode==='flight'&&!flight?.wingTorn)gliderArt(flight.l.wing);
 if(crash){const squash=Math.sin(Math.min(1,amount*5)*Math.PI);ctx.scale(1+squash*.18,1-squash*.23);}
 // Subtle breathing / armour vibration, with a dedicated belly-down drawing.
 const w=PRONE_KNIGHT_WIDTH,h=w*(flyingArt.naturalHeight||896)/(flyingArt.naturalWidth||1792);if(flyingArt.complete&&flyingArt.naturalWidth)flyingKnightArt(w,h,mode==='flight'&&!flight?.wingTorn);else if(hero.complete)ctx.drawImage(hero,-40,-60,80,100);
 boosterArt(ctx,flight?.l.boost??save.levels.boost);
 if(mode==='flight'&&flight.ramTime>0){ctx.save();ctx.strokeStyle='#ffeaa0';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(24,-5,61,40,0,-1.6,1.6);ctx.stroke();ctx.restore();}
 if(mode==='flight'&&flight?.boosting){ctx.save();ctx.translate(flight.l.boost===0?-49:-69,9);const pulse=7+Math.sin(t*44)*5;path([[0,-8],[-29-pulse,-14],[-23,0],[-52-pulse,6],[-25,12],[0,8]],'#f5963a','#c85531',2);path([[-2,-4],[-32-pulse,4],[-2,5]],'#fff4ac',null);ctx.restore();}
 }ctx.restore();}
function scene(){const flying=['flight','landing','result'].includes(state),f=flight,cx=(flying||state==='launching')?cameraX:0,cy=cameraY,W=canvas.width,H=canvas.height;
 ctx.setTransform(1,0,0,1,0,0);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,cy>1400?'#76b9db':'#68c6eb');sky.addColorStop(1,'#def3e7');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const portrait=W/H<1.1,z=Math.max(W/1200,Math.min(H/700,W/620));const ox=portrait?0:(W-1200*z)/2,oy=H*.78-485*z;
 const focus=flying&&f?{x:f.originX+(f.x-cx)*GGCourse.X_SCALE,y:485-(f.y-cy)*GGCourse.SCALE}:GGCourse.launchPose(state==='launching'?Math.max(0,launchTime/launchDuration):0,GGCourse.LAUNCH_ANGLE,f?.launchSpeed,f?.l.launch??save.levels.launch);
 const ax=focus.x-(flying?0:cx*GGCourse.X_SCALE),ay=focus.y+(flying?0:cy*GGCourse.SCALE);
 ctx.setTransform(z*inspectionZoom,0,0,z*inspectionZoom,ox+ax*z*(1-inspectionZoom),oy+ay*z*(1-inspectionZoom));if(motion.shake>0&&!reducedMotion.matches)ctx.translate(Math.sin(motion.time*72)*motion.shake*12,Math.cos(motion.time*57)*motion.shake*8);
 const ground=485+cy*.85,wx=x=>(f?.originX??GGCourse.launchPose(1,GGCourse.LAUNCH_ANGLE,undefined,save.levels.launch).x)+(x-cx)*GGCourse.X_SCALE,wy=y=>485-(y-cy)*.85;
 // Mirrored image tiles share an identical edge; the scenery scrolls slowly behind the foreground.
 if((!flying||f.y<5000)&&valleyArt.complete&&valleyArt.naturalWidth){const offset=cx*.22,bgY=-210+cy*.22;for(let i=Math.floor(offset/1200)-2;i<Math.floor(offset/1200)+3;i++){ctx.save();ctx.translate(i*1200-offset,bgY);if(Math.abs(i)%2){ctx.translate(1200,0);ctx.scale(-1,1);}ctx.drawImage(valleyArt,0,0,1200,800);ctx.restore();}}
 const region=flying?[0,1,2,3,4,2,3,4,4][f.stage]:0;
 if(region>0){ctx.fillStyle=['','#a96d3b35','#6587a54d','#c4e8fa88','#864b6355'][region];ctx.fillRect(-2500,-2500,6000,6000);}
 if(region===1){for(let i=0;i<8;i++){const x=i*220-(cx*.4)%220;path([[x-70,ground-30],[x-15,ground-150],[x+65,ground-30]],'#95694d','#58453d',3);line([[x-15,ground-150],[x-15,ground-185]],'#54443b',4);path([[x-15,ground-185],[x+25,ground-176],[x-15,ground-164]],'#8a3d36');}}
 if(region===2){for(let i=-1;i<7;i++){const x=i*260-(cx*.34)%260;path([[x-80,ground],[x-38,ground-190],[x+17,ground-225],[x+52,ground-180],[x+88,ground-30],[x+135,ground]],'#718e99','#4d6975',3);path([[x-38,ground-190],[x+17,ground-225],[x+52,ground-180],[x+12,ground-194]],'#cbdbe0',null);}}
 if(region===3){for(let i=0;i<5;i++){const x=i*300-(cx*.45)%300;cloud(x,ground-150,2.1);tower(x,ground-165,.7);}}
 if(region===4){for(let i=-1;i<6;i++){const x=i*340-(cx*.35)%340;path([[x-90,ground],[x+45,ground-270],[x+165,ground]],'#615d76','#484559',3);path([[x+15,ground-205],[x+45,ground-270],[x+77,ground-198],[x+42,ground-215]],'#e6d6da',null);}dragon(980,180+Math.sin(motion.time*1.5)*20,1.2);}
 // Airborne clouds remain visible above the mountain layer.
 if(cy>700){for(let i=0;i<7;i++){const x=((i*260-cx*.07)%1700+1700)%1700-200;cloud(x,130+i%3*130,1+i%2*.4);}}
 const space=Math.max(0,Math.min(1,((flying?f.y:cy)-1700)/3300));
 if(space>0){ctx.save();const t=ctx.getTransform(),left=-t.e/t.a,top=-t.f/t.d,width=W/t.a,height=H/t.d;ctx.globalAlpha=space;const night=ctx.createLinearGradient(0,top,0,top+height);night.addColorStop(0,'#080c29');night.addColorStop(.6,'#18284e');night.addColorStop(1,'#415981');ctx.fillStyle=night;ctx.fillRect(left,top,width,height);
 for(let i=0;i<85;i++){const sx=left+GGMonsters.hash(i*13+3)*width,sy=top+GGMonsters.hash(i*37+7)*height,pulse=reducedMotion.matches?.8:.6+.4*Math.sin(motion.time*(.8+GGMonsters.hash(i))+i);ctx.globalAlpha=space*pulse;const r=i%9===0?2.2:1;ellipse(sx,sy,r,r,'#f4f3d9');if(i%9===0){line([[sx-4,sy],[sx+4,sy]],'#d9ecff',1);line([[sx,sy-4],[sx,sy+4]],'#d9ecff',1);}}
 ctx.restore();}
 if(ground<1000){rect(-2000,ground,5200,2200,'#ab8861');rect(-2000,ground+10,5200,23,'#725a43');ctx.beginPath();ctx.moveTo(-2000,ground);for(let x=-2000;x<3200;x+=12)ctx.lineTo(x,ground-4+Math.sin((x+cx*GGCourse.X_SCALE)*.11)*2);ctx.lineTo(3200,ground+12);ctx.lineTo(-2000,ground+12);ctx.closePath();ctx.fillStyle=GGCourse.stages[region].color;ctx.fill();ctx.strokeStyle='#49633b';ctx.lineWidth=2;ctx.stroke();
 // Derive the texture from permanent world indices, never recycled screen slots.
 const soilOffset=cx*GGCourse.X_SCALE;for(let i=Math.floor(soilOffset/69)-2;i<=Math.ceil((soilOffset+1400)/69);i++){const x=i*69-soilOffset,row=((i%3)+3)%3,size=((i%4)+4)%4;ellipse(x,ground+44+row*17,9+size*2,4,'#967351');line([[x+28,ground+10],[x+24,ground-1],[x+30,ground+3],[x+35,ground-4]],'#537a3b',2);}
 }
 crowdArt(wx,ground,f);
 if(cx<650)rampArt(cx,cy);
 for(const p of motion.foam){ctx.save();ctx.globalAlpha=Math.min(1,p.life/.25)*.8;const x=p.x-cx*GGCourse.X_SCALE,y=p.y+cy*GGCourse.SCALE;
  ellipse(x,y,p.size,p.size,p.bubble?'#d8faff55':'#fff4fc');
  if(p.bubble){ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.strokeStyle='#f8fdff';ctx.lineWidth=1.3;ctx.stroke();ellipse(x-p.size*.3,y-p.size*.35,1.5,1.5,'#fff');}
  ctx.restore();
 }

 encounterArt(wx,wy,ground,f);
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

 if(flying&&f.y>900){for(let i=0;i<3;i++){const x=((i*550-cx*.4)%1800+1800)%1800-180,y=wy(1500)+150;cloud(x,y,1.3);if(y>-200&&y<900){tower(x,y-10,.6);}}}
 if(flying&&Math.abs(wx(100000)-600)<800&&Math.abs(wy(8000)-300)<500)dragon(wx(100000),wy(8000),2.5);
 if(flying&&Math.abs(wx(30000)-600)<800&&Math.abs(wy(4000)-300)<500)dragon(wx(30000),wy(4000),1.8);
 // Distance posts and gates are world anchored, so passing them conveys actual speed.
 for(let i=Math.max(0,Math.floor(cx/250));i<Math.floor(cx/250)+20;i++){const x=wx(i*250);if(x<-100||x>1400||ground>1000)continue;line([[x,ground-2],[x,ground-26]],'#594b3d',3);rounded(x-21,ground-43,42,19,3,'#f7e8bb','#6d5945',2);text(String(i*250),x,ground-29,10,'#554b40','center');}
 for(let i=1;i<GGCourse.stages.length;i++){
 const gate=GGCourse.stages[i],x=wx(gate.at),width=GGCourse.wallWidth(i)*GGCourse.X_SCALE;if(x+width<-100||x>1400)continue;
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
  path(pts,'hsl('+hue+' 24% '+(49+seed*2)+'%)','#4d5351',2);
  line([[bx+8,by+6],[bx+bw-9,by+6]],'#c7c0a8',2);
  line([[bx+7,by+ch-5],[bx+bw-7,by+ch-5]],'#74786e',2);
  if(left||right||above||below)line([[bx+bw*.25,by+ch*.25],[bx+bw*.55,by+ch*.5],[bx+bw*.43,by+ch*.8]],'#5b5c52',2);
 }}
 for(const a of GGCourse.wallCaches(i)){const tx=wx(a.x),ty=wy(a.y);if(tx<-160||tx>1500||ty<-100||ty>1100)continue;if(!(f?.wallTreasureClaimed||save.wallTreasureClaimed||[]).includes(a.id)){treasureChestArt(tx,ty);text('+'+a.value,tx,ty-55,19,'#ffe878','center');}}
 const labelX=Math.max(140,Math.min(1060,x+width/2));rounded(labelX-130,155,260,62,5,'#fff4d6','#61533e',3);text('REMPART · TABLEAU '+(i+1),labelX,179,15,'#51483b','center');text(GGCourse.wallWidth(i)+' m D’ÉPAISSEUR · BRÈCHES PERSISTANTES',labelX,200,10,'#9c4937','center');

 }
 if(flying&&f.endReason==='ground'&&['landing','result'].includes(state)){const x=wx(f.x),energy=Math.min(1,f.impactSpeed/140),size=32+energy*32;ellipse(x,ground+5,size,11,'#5c4938');for(let i=0;i<9;i++){const a=i*Math.PI*2/9;line([[x+Math.cos(a)*size*.6,ground+Math.sin(a)*7],[x+Math.cos(a)*(size+19),ground+Math.sin(a)*19]],'#5b4937',2);}if(landingTime<.5){ctx.save();ctx.globalAlpha=(1-landingTime/.5)*.6;ctx.beginPath();ctx.ellipse(x,ground,30+landingTime*180,10+landingTime*40,0,0,7);ctx.lineWidth=4;ctx.strokeStyle='#fff2c6';ctx.stroke();ctx.restore();}}
 // Soft shadow scales with height and anchors the knight to the world.
 if(flying&&f){const x=wx(f.x),y=wy(f.y);if(f.y<280){ctx.globalAlpha=Math.max(.05,.22-f.y*.0007);ellipse(x,ground+3,Math.max(13,43-f.y*.08),6,'#263a30');ctx.globalAlpha=1;}for(const p of motion.particles){ctx.globalAlpha=p.stone?Math.min(1,Math.max(0,p.life/.35)):Math.max(0,p.life/p.max)*.5;if(p.stone){ctx.save();ctx.translate(wx(p.x),wy(p.y));ctx.rotate((p.max-p.life)*(p.spin||8));path([[-p.size,-p.size*.5],[p.size*.6,-p.size],[p.size,p.size*.4],[-p.size*.4,p.size]],p.color,'#454b43',2);line([[-p.size*.65,-p.size*.4],[p.size*.4,-p.size*.7]],'#d4c9af',2);ctx.restore();}else ellipse(wx(p.x),wy(p.y),p.size,p.size*.8,p.color);ctx.globalAlpha=1;}
 for(const ring of motion.rings){if(reducedMotion.matches)continue;const progress=1-ring.life/ring.max;ctx.globalAlpha=(1-progress)*.7;ctx.strokeStyle='#fff1cf';ctx.lineWidth=5*(1-progress);ctx.beginPath();ctx.ellipse(wx(ring.x),wy(ring.y),16+progress*75,22+progress*95,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 for(const s of motion.skates)GGEquipment.drawSkate(ctx,s.kind,wx(s.x),wy(s.y),s.width,s.rotation);
 if(motion.soap){const s=motion.soap;launchObjectArt(s.kind,wx(s.x),wy(s.y),s.rotation);}
 const crash=(state==='landing'||state==='result')&&['ground','wall','tower'].includes(f.endReason);ctx.save();if(!reducedMotion.matches&&motion.recoil>0){ctx.translate(x,y);ctx.scale(1-motion.recoil*.12,1+motion.recoil*.07);ctx.translate(-x-motion.recoil*9,-y);}if(!(crash&&f.endReason==='ground'&&buriedKnightArt(x,ground,landingTime)))heroArt(x,crash?Math.min(y,ground-21):y,crash?'crash':'flight',-motion.pitch,Math.min(landingTime,1));ctx.restore();
 if(state==='landing'&&f.endReason==='wall'&&f.bomb){
  const bomb=GG.bombs.find(b=>b.id===f.bomb);
  if(!f.bombSpent){
   ellipse(x,y-33,29,28,bomb.color,'#171823',4);
   ellipse(x-10,y-43,8,5,'#ffffff55');
   rounded(x-8,y-66,16,10,3,'#a0a7b0','#494e59',2);
   const tip=24*(1-Math.min(1,landingTime/2));
   line([[x,y-66],[x+tip*.5,y-71-tip*.2],[x+tip,y-69-tip*.4]],'#c18a52',4);
   ellipse(x+tip,y-69-tip*.4,5+Math.sin(landingTime*48)*2,5,'#ffd257','#ff7835',2);
  }else if(landingTime<2.75){
   const age=landingTime-2;
   ctx.save();ctx.globalAlpha=Math.max(0,1-age/.75);
   ellipse(x,y-26,28+age*140,25+age*95,'#ff9b44','#ffdb72',5);
   text('BOUM !',x,y-59-age*55,32,'#fff6bf','center');ctx.restore();
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
 for(const m of list){const hit=f?.monsterHits?.get(m.id),age=hit===undefined?-1:time-hit;if(age>1)continue;
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
function encounterSprite(kind,x,y,w,h){if(!encounterAtlas.complete||!encounterAtlas.naturalWidth)return;const cw=encounterAtlas.naturalWidth/4,ch=encounterAtlas.naturalHeight/2;ctx.drawImage(encounterAtlas,(kind%4)*cw,Math.floor(kind/4)*ch,cw,ch,x-w/2,y-h/2,w,h);}
// The guard is clipped behind the roof, posts and balcony, inside the window.
function towerWithGoblin(x,ground){
 encounterSprite(7,x,ground-127,240,310);
 const guard=unarmedCache[0]?.[0];if(!guard)return;
 ctx.save();ctx.beginPath();ctx.moveTo(x-61,ground-174);ctx.lineTo(x-12,ground-182);ctx.lineTo(x-12,ground-139);ctx.lineTo(x-61,ground-136);ctx.closePath();ctx.clip();
 ctx.drawImage(guard,x-65,ground-191,61,74);ctx.restore();
}
function encounterArt(wx,wy,ground,f){
 const tr=ctx.getTransform(),left=-tr.e/tr.a,right=(canvas.width-tr.e)/tr.a,top=-tr.f/tr.d,bottom=(canvas.height-tr.f)/tr.d;
 for(const pos of GGCourse.obstacles){const x=wx(pos);if(x<left-480||x>right+480||ground-850>bottom||ground<top)continue;
  if(pos===500&&!f?.destroyed.has(pos)){ctx.save();ctx.translate(x,ground);ctx.scale(4.5,4.5);castleArt(0,0,false);ctx.restore();continue;}
  const fracture=f?.towerBreaks?.[pos],age=fracture?f.time-fracture.at:0;
  if(f?.destroyed.has(pos)){
   if(fracture&&age<1.6&&!reducedMotion.matches){
    for(const side of [-1,1]){ctx.save();ctx.translate(x+side*age*65,ground+age*age*110);ctx.rotate(side*age*.35);ctx.scale(2,2);ctx.beginPath();ctx.moveTo(side*150,-310);ctx.lineTo(0,-310);for(let y=-290,j=0;y<35;y+=24,j++)ctx.lineTo(j%2?10:-8,y);ctx.lineTo(side*150,35);ctx.closePath();ctx.clip();towerWithGoblin(0,0);ctx.restore();}
    for(let j=0;j<16;j++){const d=j%2?1:-1;ctx.save();ctx.translate(x+d*age*(35+j*13),ground-100-j%5*70+age*age*200-age*120);ctx.rotate(age*(j-8));rect(-9,-6,18,12,j%3?'#b9b4a5':'#b78049','#403e39');ctx.restore();}
   }else for(let j=0;j<9;j++)rounded(x-130+j*31,ground-12-(j%3)*10,30,20,5,'#aaa594','#454640',2);
   continue;
  }
  ctx.save();ctx.translate(x,ground);ctx.scale(2,2);towerWithGoblin(0,0);
  if(f?.towerDamage?.[pos])line([[-48,-32],[-19,-63],[-27,-82],[0,-111],[16,-99],[25,-140]],'#343431',4);
  ctx.restore();
 }
 if(!f)return;
 const origin=wx(0),time=f.monsterTime||0;
 for(const a of GGSpecials.nearby((left-origin-180)/15,(right-origin+180)/15,f,(ground-bottom-180)/.85,(ground-top+180)/.85)){
  if(a.kind===9){cannonArt(wx(a.x),ground,!f.specialUsed?.has(a.id));continue;}
  if(a.kind===8){springArt(wx(a.x),ground,f.springHits?.[a.id]===undefined?(f.specialUsed?.has(a.id)?2:-1):f.time-f.springHits[a.id]);continue;}
  if(f.specialUsed?.has(a.id))continue;const x=wx(a.x),y=wy(a.y);if(y<top-180||y>bottom+180)continue;
  ctx.save();ctx.translate(x,y);if(!reducedMotion.matches)ctx.rotate(Math.sin(time*(a.kind===3?13:2)+a.id)* (a.kind===3?.12:.045));
  if(a.kind===6){for(let k=0;k<4;k++){ctx.globalAlpha=.3-k*.05;ellipse(-50-k*13,Math.sin(time*4+k)*8,8-k,4,'#ffe468');}ctx.globalAlpha=1;}
  if(a.kind===3)gullArt(0,0,time+a.id,false);else encounterSprite(a.kind,0,0,a.kind===4?190:160,a.kind===4?240:190);ctx.restore();
 }
 for(const a of GGSpecials.treasureNearby((left-origin-100)/15,(right-origin+100)/15,f,(ground-bottom-100)/.85,(ground-top+100)/.85))if(!f.treasureUsed?.has(a.id))treasureArt(wx(a.x),wy(a.y),a.bag,time+a.id);
 for(const a of GGSpecials.fuelNearby((left-origin-100)/15,(right-origin+100)/15,f,(ground-bottom-100)/.85,(ground-top+100)/.85))if(!f.fuelUsed?.has(a.id))fuelVialArt(wx(a.x),wy(a.y),time+a.id);
 for(const e of f.fuelEffects||[]){const q=(f.time-e.at)/1.2;if(q>=1)continue;ctx.save();ctx.globalAlpha=1-q;const x=wx(e.x),y=wy(e.y);for(let j=0;j<9;j++){const a=j*Math.PI*2/9; text('✦',x+Math.cos(a)*(20+q*75),y+Math.sin(a)*(20+q*75),18,'#9dfff0','center');}text('+'+e.percent+'% MAGIE',x,y-65-q*55,23,'#d5fff4','center');ctx.restore();}
 for(const e of f.goldEffects||[]){const q=Math.max(0,(f.time-e.at)/1.1);if(q>=1)continue;ctx.save();ctx.globalAlpha=1-q;const xx=wx(e.x),yy=wy(e.y)-q*65;ctx.font="900 24px 'Nunito',sans-serif";ctx.textAlign='center';ctx.strokeStyle='#5c3e17';ctx.lineWidth=4;ctx.strokeText('+'+e.value,xx,yy);ctx.fillStyle='#ffe46b';ctx.fillText('+'+e.value,xx,yy);for(let n=0;n<6;n++){const a=n*Math.PI/3;ellipse(xx+Math.cos(a)*q*50,yy+Math.sin(a)*q*35,3,3,'#fff2a0');}ctx.restore();}
 for(const e of f.specialEffects||[]){const age=f.time-e.at,q=age/1.3,x=wx(e.x),y=wy(e.y);ctx.save();ctx.globalAlpha=1-q;
  if(e.kind===9){
   for(let j=0;j<12;j++){const a=j*Math.PI/6,r=15+q*150;ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,13+q*22,11+q*19,q<.27?(j%2?'#ffe476':'#ff8436'):'#777681');}
   text('KABOOM !',x,y-40-q*75,39,'#ffe57a','center');
  }
  for(let j=0;j<12;j++){const a=j*Math.PI/6,r=15+q*90,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r; if(e.kind===1||e.kind===2){ctx.save();ctx.translate(xx,yy);ctx.rotate(a+q*5);rect(-4,-6,8,12,e.color);ctx.restore();}else if(e.kind===5){ellipse(xx,yy,15*(1-q),10*(1-q),'#fff');}else if(e.kind===6){text('✦',xx,yy,22,e.color,'center');}else{ellipse(xx,yy,6*(1-q),4*(1-q),e.color);}}
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
function treasureChestArt(x,y){ctx.save();ctx.translate(x,y);rounded(-42,-13,84,43,6,'#b97835','#392d30',4);rounded(-42,-29,84,29,10,'#e0a64e','#392d30',4);for(const dx of [-27,24])rect(dx,-25,8,51,'#ffda63','#9e681f',2);rounded(-9,-5,18,21,3,'#ffde69','#795323',2);ellipse(0,4,3,4,'#47353a');text('✦',-48,-27,23,'#fff0a2','center');ctx.restore();}
function cannonArt(x,ground,loaded){
 ctx.save();ctx.translate(x,ground);ctx.scale(-2,2);
 rounded(-52,-30,105,24,7,'#805233','#342a25',4);
 ctx.save();ctx.translate(-22,-28);ctx.rotate(-.72);
 if(loaded){
  ellipse(67,0,25,25,'#333849','#1c2030',4);
  ellipse(73,-9,6,4,'#707a8d');
  line([[76,-16],[86,-29],[94,-30]],'#9c6943',5);
  ellipse(95,-31,5,5,'#ffd45b');
 }
 rounded(-14,-19,89,38,9,'#535f73','#252c36',5);
 rounded(52,-22,18,44,4,'#768397','#252c36',4);
 ctx.restore();
 for(const xx of [-33,35]){ellipse(xx,-12,14,14,'#553829','#30241e',4);ellipse(xx,-12,5,5,'#c5a479');}
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
