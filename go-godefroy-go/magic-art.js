/* Art of the dragon boss, its portal, the magic world and the Grand Sorcerer. Vector-drawn with the game's thick outlines. */
const MINK='#2b1b4a';
function mShape(d,fill,w=4,stroke=MINK){const p=new Path2D(d);if(fill){ctx.fillStyle=fill;ctx.fill(p);}if(w){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke(p);}}
function mBlob(cx,cy,rx,ry,fill,w=4,stroke=MINK,rot=0){ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,rot,0,7);if(fill){ctx.fillStyle=fill;ctx.fill();}if(w){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}}
function mView(){const t=ctx.getTransform();return {l:-t.e/t.a,r:(canvas.width-t.e)/t.a,t:-t.f/t.d,b:(canvas.height-t.f)/t.d,unit:1/Math.max(.3,t.a)};}
function mStar(x,y,r,fill,rot=0){ctx.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,q=i%2?r*.45:r;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*q,y+Math.sin(a)*q);}ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function mHeart(x,y,s,fill,stroke=MINK,w=5){ctx.save();ctx.translate(x,y);ctx.scale(s,s);mShape('M0 16C-34-10-18-36 0-18C18-36 34-10 0 16Z',fill,w/s,stroke);ctx.restore();}
// Real seconds elapsed between two frames of art, for easing that does not depend on the simulation clock.
function mTick(key){const now=motion.time,dt=Math.max(0,Math.min(.1,now-(motion[key]??now)));motion[key]=now;return dt;}

// ---- Backdrop: dusk sky, stars, two moons, auroras, floating islands and giant mushrooms on the horizon.
function magicBackdropArt(cx,cy,ground){
 const v=mView(),time=motion.time,calm=reducedMotion.matches,W=v.r-v.l,H=v.b-v.t,H0=GGMonsters.hash;
 const sky=ctx.createLinearGradient(0,ground-2900,0,ground);sky.addColorStop(0,'#120a33');sky.addColorStop(.4,'#33207c');sky.addColorStop(.72,'#8e3fa3');sky.addColorStop(.9,'#e2709e');sky.addColorStop(1,'#ffc3a0');
 ctx.fillStyle=sky;ctx.fillRect(v.l-60,v.t-60,W+120,H+120);
 // Stars drift very slowly; they shine brighter high in the dark part of the sky.
 const dark=Math.max(.25,Math.min(1,(ground-v.t-500)/1700));
 for(let i=0;i<80;i++){const sx=v.l+(((H0(i*13+3)*1.2*W-cx*.5)%(1.2*W))+1.2*W)%(1.2*W)-.1*W,sy=v.t+H0(i*37+7)*H*.85,p=calm?.8:.55+.45*Math.sin(time*(.8+H0(i))*2+i);ctx.globalAlpha=dark*p;const r=(i%9===0?3.2:1.6)*v.unit*1.6;mStar(sx,sy,r*2,i%4?'#fff6d8':'#b8f7ff',i);}
 ctx.globalAlpha=1;
 // Two moons.
 const mx=v.l+W*.8,my=v.t+H*.2,mr=H*.085;mBlob(mx,my,mr*1.5,mr*1.5,'rgba(255,240,210,.10)',0);mBlob(mx,my,mr,mr,'#fff1d2',0);mBlob(mx-mr*.3,my-mr*.2,mr*.2,mr*.16,'#f1dcb4',0);mBlob(mx+mr*.25,my+mr*.3,mr*.14,mr*.11,'#f1dcb4',0);
 mBlob(v.l+W*.62,v.t+H*.12,H*.034,H*.034,'#8ff5e6',0);mBlob(v.l+W*.62+H*.012,v.t+H*.12-H*.008,H*.03,H*.03,'#33207c',0);
 // Auroras.
 for(let k=0;k<3;k++){ctx.beginPath();for(let x=v.l-40;x<=v.r+40;x+=W/36){const y=v.t+H*(.17+.075*k)+Math.sin(x*.0035+(calm?0:time*.35)+k*1.9)*H*.05;ctx[x===v.l-40?'moveTo':'lineTo'](x,y);}ctx.strokeStyle=['rgba(110,255,214,.16)','rgba(160,140,255,.15)','rgba(255,150,230,.12)'][k];ctx.lineWidth=H*.07;ctx.lineCap='round';ctx.stroke();}
 // Floating islands, far away.
 for(let i=0;i<10;i++){const h=H0(i*71+5),x=((i*420-cx*1.8+h*160)%4200+4200)%4200-1300,y=70+270*H0(i*29+2)+(ground-485)*.22,s=.55+.7*h;if(x<v.l-260||x>v.r+260)continue;
  ctx.save();ctx.translate(x,y+(calm?0:Math.sin(time*.5+i)*6));ctx.scale(s,s);ctx.globalAlpha=.9;
  mShape('M-120 0C-80 60-30 120 6 150C40 110 90 60 120 0Z','#5a4a9e',3,'#3a2c78');mShape('M-126 0C-90-22 90-22 126 0C90 16-90 16-126 0Z','#74dcc0',3,'#3a2c78');
  mShape('M-50-8L-36-70L-20-8Z','#ff9ee6',3,'#3a2c78');mShape('M-24-8L-8-48L6-8Z','#c9a2ff',3,'#3a2c78');
  if(i%2){mShape('M40-10L40-58L32-58L50-92L68-58L60-58L60-10Z','#8d7bd8',3,'#3a2c78');mBlob(50,-44,5,7,'#ffe98a',0);}else{mBlob(54,-44,34,28,'#58cdb6',3,'#3a2c78');line([[54,-10],[54,-30]],'#3a2c78',5);}
  ctx.globalAlpha=.55;line([[-70,8],[-74,90]],'#bff6ff',5);ctx.restore();}
 // Giant mushrooms and crystals stand on the horizon.
 if(ground<v.b+80)for(let i=0;i<18;i++){const h=H0(i*53+9),x=((i*230-cx*4.5)%4140+4140)%4140-1300;if(x<v.l-200||x>v.r+200)continue;
  ctx.save();ctx.translate(x,ground+4);
  if(i%3===2){for(const [dx,hh,c] of [[-34,150,'#7df0ff'],[0,230,'#b9a2ff'],[36,170,'#ff9ee6']]){mShape('M'+(dx-26)+' 0L'+dx+' '+(-hh*(.7+.5*h))+'L'+(dx+26)+' 0Z',c,4,'#3a2c78');}}
  else{const hh=150+170*h,cw=110+90*h;mShape('M-16 0C-10 '+(-hh*.5)+'-22 '+(-hh*.8)+'-12 '+(-hh)+'L12 '+(-hh)+'C22 '+(-hh*.8)+' 10 '+(-hh*.5)+' 16 0Z','#f6e7cf',4,'#3a2c78');
   mShape('M'+(-cw)+' '+(-hh+6)+'C'+(-cw*.9)+' '+(-hh-cw*.75)+' '+(cw*.9)+' '+(-hh-cw*.75)+' '+cw+' '+(-hh+6)+'C'+(cw*.5)+' '+(-hh+22)+' '+(-cw*.5)+' '+(-hh+22)+' '+(-cw)+' '+(-hh+6)+'Z',i%2?'#d65fc4':'#7a5ce0',4,'#3a2c78');
   for(const [sx,sy,sr] of [[-.5,-.32,.13],[.1,-.5,.16],[.55,-.26,.11]])mBlob(cw*sx,-hh+cw*sy,cw*sr,cw*sr*.7,'#fff3d6',0);}
  ctx.restore();}
 // Fireflies.
 for(let i=0;i<26;i++){const x=v.l+(((H0(i*17+1)*W*1.1-cx*3)%(W*1.1))+W*1.1)%(W*1.1)-.05*W,y=v.t+H*(.25+.7*H0(i*41+3))+(calm?0:Math.sin(time*.9+i)*14),p=calm?.6:.5+.5*Math.sin(time*2.4+i*1.7);ctx.globalAlpha=.25+.55*p;mBlob(x,y,4*v.unit*1.5,4*v.unit*1.5,i%3?'#ffe98a':'#8ff5e6',0);}
 ctx.globalAlpha=1;
}
// ---- Ceiling of the magic world: dark rock bristling with glowing crystals.
function magicCeilingArt(wx,wy,v){
 const y0=wy(GGCourse.magic.ceiling)-70,x0=Math.max(v.l-100,wx(GGCourse.magic.start));if(y0<v.t-40||x0>v.r)return;
 const H0=GGMonsters.hash,origin=wx(0),pulse=reducedMotion.matches?.6:.5+.5*Math.sin(motion.time*2.2);
 ctx.fillStyle='#150d38';ctx.fillRect(x0,v.t-60,v.r+100-x0,y0-110-(v.t-60));
 for(let i=Math.floor((x0-origin)/80);i<=Math.ceil((v.r+100-origin)/80);i++){const x=origin+i*80,h=H0(i*7+11),len=90+150*h,w=34+26*H0(i*3+1);
  mShape('M'+(x-w)+' '+(y0-112)+'L'+x+' '+(y0-112+len)+'L'+(x+w)+' '+(y0-112)+'Z',['#6fe9ff','#a78bff','#ff8fe0','#7ff0c8'][i&3],4,'#1d1350');
  line([[x-w*.3,y0-104],[x-2,y0-112+len*.8]],'rgba(255,255,255,.55)',3);}
 ctx.globalAlpha=.18+.2*pulse;ctx.fillStyle='#8ff5e6';ctx.fillRect(x0,y0+62,v.r+100-x0,8);ctx.globalAlpha=1;
}
// ---- Floating magic tree: heavy, breakable, slows the knight a lot.
function magicTreeArt(x,y,time,id){
 const calm=reducedMotion.matches,bob=calm?0:Math.sin(time*1.3+id)*7,sway=calm?0:Math.sin(time*1.1+id*.7)*.03;
 ctx.save();ctx.translate(x,y+bob-20);ctx.lineJoin='round';ctx.lineCap='round';
 mBlob(0,-40,200,180,'rgba(120,255,220,.10)',0);
 mShape('M-95 96C-70 80 70 80 95 96C80 132 46 170 8 196C-4 204-14 198-22 186C-56 160-84 130-95 96Z','#6a4a86',5);
 mShape('M-30 150l-10 34M6 170l4 38M34 140l14 30',null,5,'#4a2f66');
 mShape('M-98 96C-70 76 70 76 98 96C70 112-70 112-98 96Z','#7fe3c0',4);
 ctx.rotate(sway);
 mShape('M-30 98C-22 40-34 0-14-40L18-40C34 0 24 44 34 98Z','#8a5a3c',5);
 mShape('M-8 80C-4 40-10 10 0-30M12 84C16 50 10 20 14-10',null,3,'#5e3a26');
 for(const [cx,cy,r,c] of [[-74,-70,62,'#3ec9b0'],[74,-66,60,'#35b8a8'],[0,-132,80,'#52dcc0'],[-40,-34,50,'#2fa79b'],[44,-30,48,'#2fa79b'],[0,-72,68,'#49d2b8']])mBlob(cx,cy,r,r*.86,c,5);
 mBlob(-20,-156,32,15,'rgba(255,255,255,.3)',0);
 for(let k=0;k<7;k++){const a=k*.9+id,fx=Math.cos(a*1.7)*88,fy=-86+Math.sin(a*2.3)*62,p=calm?.6:.5+.5*Math.sin(time*3+k);mBlob(fx,fy,15+p*4,15+p*4,'rgba(255,214,107,.30)',0);mBlob(fx,fy,7.5,7.5,'#ffd66b',3,'#a3661c');}
 ctx.restore();
}
// ---- Fairy: catching her gives the magic armour.
function fairyArt(x,y,time,id){
 const calm=reducedMotion.matches,bob=calm?0:Math.sin(time*2.2+id)*10,flap=calm?.7:Math.abs(Math.sin(time*19+id)),pulse=calm?.5:.5+.5*Math.sin(time*4+id);
 ctx.save();ctx.translate(x,y+bob);ctx.scale(1.5,1.5);ctx.lineJoin='round';ctx.lineCap='round';
 mBlob(0,0,58+pulse*8,58+pulse*8,'rgba(255,160,240,.20)',0);mBlob(0,0,36,36,'rgba(255,245,180,.30)',0);
 const w=.35+.65*flap;
 for(const side of [-1,1]){mBlob(side*(8+20*w),-16,24*w,14,'rgba(200,244,255,.9)',2.5,'#4f86cc',side*-.5);mBlob(side*(7+15*w),6,17*w,10,'rgba(226,210,255,.9)',2.5,'#4f86cc',side*.5);}
 mShape('M-9-3L9-3L15 24Q0 31-15 24Z','#ff8fd0',2.5);
 line([[-9,2],[-19,10]],'#ffe2c4',4);line([[9,2],[22,-9]],'#ffe2c4',4);
 mBlob(0,-13,10,10,'#ffe2c4',2.5);mShape('M-11-13Q-10-27 0-25Q11-27 11-13Q5-20 0-18Q-5-20-11-13Z','#ffd24a',2.5);
 mBlob(-3.5,-12,1.5,2,MINK,0);mBlob(3.5,-12,1.5,2,MINK,0);
 line([[22,-9],[30,-22]],'#fff3b0',2.5);mStar(31,-25,9+pulse*3,'#fff3b0',time*2);
 for(let k=0;k<5;k++){const a=(calm?0:time*1.6)+k*1.257;mStar(Math.cos(a)*46,Math.sin(a)*40,5,k%2?'#ffe98a':'#ffffff',a);}
 ctx.restore();
}
// ---- Ground wizard, casting when `cast` is true.
function wizardArt(x,ground,time,id,cast){
 const calm=reducedMotion.matches,bob=calm?0:Math.sin(time*2+id)*2,up=cast?1:0,pulse=calm?.5:.5+.5*Math.sin(time*7+id);
 ctx.save();ctx.translate(x,ground+bob);ctx.scale(1.5,1.5);ctx.lineJoin='round';ctx.lineCap='round';
 const sx=30-up*4,sy=-100-up*14;
 line([[27,-2],[sx,sy+8]],MINK,9);line([[27,-2],[sx,sy+8]],'#8a5a3c',5);
 mBlob(sx,sy,20+pulse*8+up*10,20+pulse*8+up*10,'rgba(125,249,255,.28)',0);mBlob(sx,sy,9+up*3,9+up*3,'#7df9ff',3);
 mShape('M-27 0C-23-44-17-66 0-70C17-66 23-44 27 0Z',id%2?'#5b3fb8':'#3f6fc4',4);
 mStar(-9,-22,5,'#ffe98a');mStar(10,-40,4,'#ffe98a',1);mStar(4,-12,3.5,'#ffe98a',2);
 mShape('M14-56C24-60 30-'+(64+up*20)+' '+(sx-4)+' '+(sy+30)+'L'+(sx+4)+' '+(sy+34)+'C34-'+(50+up*14)+' 26-46 16-44Z',id%2?'#6c50cc':'#4f80d6',4);
 mShape('M-13-68C-15-44-6-28 0-22C6-28 15-44 13-68Z','#f4f1ea',3);
 mBlob(0,-74,12,10,'#f1c9a5',3);mBlob(-4,-75,1.6,2.2,MINK,0);mBlob(5,-75,1.6,2.2,MINK,0);mBlob(1,-70,3,2.4,'#e3a983',0);
 mShape('M-26-80C-10-86 10-86 26-80C10-76-10-76-26-80Z',id%2?'#3f2a8f':'#2b4f9c',4);
 mShape('M-17-82L17-82L8-118Q12-132 24-128Q10-142-2-124Z',id%2?'#3f2a8f':'#2b4f9c',4);mStar(2,-100,5,'#ffe98a',.4);
 ctx.restore();
}
// ---- Bird-man: flaps in place and throws his spear at the knight.
function birdmanArt(x,y,time,id,armed){
 const calm=reducedMotion.matches,flap=calm?.3:Math.sin(time*8+id),bob=calm?0:Math.sin(time*8+id+1.2)*7;
 ctx.save();ctx.translate(x,y+bob);ctx.scale(1.55,1.55);ctx.lineJoin='round';ctx.lineCap='round';
 const wing=(fill,rot)=>{ctx.save();ctx.translate(8,-22);ctx.rotate(rot);mShape('M0 0C24-44 78-58 128-40C108-30 104-18 112-2C88-8 78 2 82 18C58 8 38 12 22 22C12 16 4 8 0 0Z',fill,4,'#2f4664');mShape('M26-10L92-30M30 2L84-6',null,2.5,'#2f4664');ctx.restore();};
 wing('#b7c9de',-.75+flap*.55);
 mShape('M4 22L-6 52M14 22L18 54',null,6,'#c98f5a');mShape('M-6 52l-10 6M-6 52l-2 10M-6 52l8 7M18 54l-9 7M18 54l1 10M18 54l9 6',null,3,'#f0c44a');
 mBlob(6,0,19,26,'#c98f5a',4,MINK,.15);mShape('M-10 12C0 22 16 22 24 12L22 30Q8 38-8 30Z','#2fa79b',3.5);
 mBlob(-6,-34,15,14,'#c98f5a',4);mShape('M-18-38L-46-30L-18-26Z','#f0c44a',3.5);mShape('M-10-46L-2-66L4-46L12-62L14-42Z','#e2452f',3.5);
 mBlob(-12,-36,4,4,'#fff',2);mBlob(-13,-36,1.8,1.8,MINK,0);line([[-18,-43],[-6,-40]],MINK,3);
 line([[0,-8],[-26,-2]],'#c98f5a',7);
 if(armed){ctx.save();ctx.translate(-26,-4);ctx.rotate(-.12);line([[-64,0],[70,0]],MINK,7);line([[-64,0],[70,0]],'#b9824a',3.5);mShape('M-64-9L-92 0L-64 9Z','#dfe7ee',3.5);ctx.restore();}
 wing('#e6eef8',-.35+flap*.6);
 ctx.restore();
}
// ---- Shots: wizard bolt, bird-man spear, falling anvil. Each one is announced, then shows where it is heading.
function magicShotArt(n,f,wx,wy,v){
 const c=GGMagic.SHOT[n.kind],time=motion.time,calm=reducedMotion.matches,blink=calm?1:.75+.25*Math.sin(time*16),x=wx(n.x),y=wy(n.y);
 const tint={bolt:'#d83fe0',spear:'#e2702f',anvil:'#c8251a'}[n.kind],label={bolt:'⚠ SORT !',spear:'⚠ LANCE !',anvil:'⚠ ENCLUME !'}[n.kind];
 if(!n.done&&!f.fairy){
  if(n.lockAt===undefined){
   if(x<v.l||x>v.r||y<v.t+60*v.unit||y>v.b-40*v.unit){const bx=Math.max(v.l+370*v.unit,Math.min(v.r-380*v.unit,x)),by=Math.max(v.t+180*v.unit,Math.min(v.b-70*v.unit,y));
    ctx.save();ctx.translate(bx,by);ctx.scale(v.unit,v.unit);ctx.globalAlpha=blink;rounded(-82,-22,164,40,10,'#fff4cf',tint,4);ctx.font="900 22px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.fillStyle=tint;ctx.fillText(label,0,6);ctx.restore();}
  }else{const q=(n.age-n.lockAt)/c.glide;if(q<1){
   const zoneX=Math.min(wx(n.tx),v.r-(c.rx*15+90)*v.unit);
   // Same language as the nets: a flashing red zone where the shot will land.
   {const fade=q>.9?(1-q)/.1:1,flash=calm?.5:.5+.5*Math.sin(time*(8+q*14));ctx.save();ctx.translate(zoneX,wy(n.ty));ctx.globalAlpha=(.16+.3*flash)*fade;ctx.fillStyle='#ff2a1a';ctx.beginPath();ctx.ellipse(0,0,c.rx*15+34,c.ry*.85+34,0,0,7);ctx.fill();ctx.globalAlpha=(.55+.45*flash)*fade;ctx.strokeStyle='#ff2a1a';ctx.lineWidth=8;ctx.stroke();ctx.restore();}
   ctx.save();ctx.translate(zoneX,wy(n.ty));ctx.globalAlpha=(.35+.4*blink)*(q>.85?(1-q)/.15:1);ctx.setLineDash([16,12]);ctx.lineDashOffset=-time*40;ctx.strokeStyle=tint;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,0,(c.rx*15+28)*(1.25-.25*q),(c.ry*.85+28)*(1.25-.25*q),0,0,7);ctx.stroke();ctx.setLineDash([]);line([[-20,0],[20,0]],tint,5);line([[0,-20],[0,20]],tint,5);ctx.restore();}}
 }
 if(n.hit||n.deflected)return;
 // Direction of travel on screen: toward the meeting spot during the rise, along the velocity afterwards.
 const dx=n.lockAt===undefined?(f.x+c.ax-n.x)*15:n.vx*15-f.vx*15*0,dy=n.lockAt===undefined?-(Math.max(40,f.y+c.ay)-n.y)*.85:-n.vy*.85,ang=Math.atan2(dy,dx||1);
 ctx.save();ctx.translate(x,y);ctx.lineJoin='round';ctx.lineCap='round';if(n.missed)ctx.globalAlpha=Math.max(0,1-(f.time-n.doneAt)/1.2);
 if(n.kind==='bolt'){
  for(let k=5;k>=1;k--){ctx.globalAlpha*=.8;mBlob(-Math.cos(ang)*k*20,-Math.sin(ang)*k*20,20-k*2.5,20-k*2.5,k%2?'#ff7bf2':'#8f7bff',0);}
  ctx.globalAlpha=n.missed?Math.max(0,1-(f.time-n.doneAt)/1.2):1;mBlob(0,0,44,44,'rgba(255,123,242,.28)',0);mBlob(0,0,22,22,'#ff7bf2',4);mBlob(-5,-6,8,7,'#fff',0);
  for(let k=0;k<5;k++){const a=(calm?0:time*7)+k*1.257;mStar(Math.cos(a)*34,Math.sin(a)*34,6,'#fff3b0',a);}
 }else if(n.kind==='spear'){
  ctx.rotate(ang);line([[-95,0],[60,0]],MINK,9);line([[-95,0],[60,0]],'#b9824a',5);mShape('M56-13L104 0L56 13Z','#dfe7ee',4);mShape('M-95 0L-116-12L-104 0L-116 12Z','#e2452f',3);
  ctx.globalAlpha*=.5;line([[-120,-8],[-170,-8]],'#fff',3);line([[-124,8],[-160,8]],'#fff',3);
 }else{
  ctx.rotate(calm?0:Math.sin(time*5)*.08);ctx.scale(1.25,1.25);
  ctx.globalAlpha*=.45;for(const sx of [-34,0,34])line([[sx,-58],[sx,-104-Math.abs(sx)*.4]],'#fff',4);ctx.globalAlpha=n.missed?Math.max(0,1-(f.time-n.doneAt)/1.2):1;
  mShape('M-62-34L46-34C64-34 78-26 84-12L46-12C40 4 28 10 20 12L20 30L44 30L44 46L-44 46L-44 30L-20 30L-20 12C-34 8-46-4-52-12L-62-12Z','#3d4250',5,'#14161c');
  mShape('M-56-28L44-28',null,4,'#7b8496');mShape('M-36 36L36 36',null,3,'#7b8496');
 }
 ctx.restore();
}
// ---- Magic tower: a tall rune spire crowned with a crystal.
function magicTowerArt(x,ground,key){
 const time=motion.time,calm=reducedMotion.matches,pulse=calm?.6:.5+.5*Math.sin(time*2.6+key),H=1105;
 ctx.save();ctx.translate(x,ground);ctx.lineJoin='round';
 mShape('M-250 0L-150 '+(-H+170)+'L150 '+(-H+170)+'L250 0Z','#3a4aa0',6);
 mShape('M-250 0L-150 '+(-H+170)+'L-70 '+(-H+170)+'L-120 0Z','#4c5ec0',0);
 for(let r=1;r<10;r++){const yy=-r*92,half=250-100*(r*92/(H-170));line([[-half,yy],[half,yy]],'#2a367c',3);for(let c=-2;c<=2;c++)line([[c*half*.4+(r%2?half*.2:0),yy],[c*half*.4+(r%2?half*.2:0),yy+92]],'#2a367c',2.5);}
 for(const [wy0,ww] of [[-220,46],[-470,40],[-720,34]]){mShape('M'+(-ww)+' '+wy0+'L'+(-ww)+' '+(wy0-70)+'Q0 '+(wy0-70-ww*1.3)+' '+ww+' '+(wy0-70)+'L'+ww+' '+wy0+'Z','#0f1436',5);ctx.globalAlpha=.55+.4*pulse;mShape('M'+(-ww+10)+' '+(wy0-6)+'L'+(-ww+10)+' '+(wy0-66)+'Q0 '+(wy0-66-ww)+' '+(ww-10)+' '+(wy0-66)+'L'+(ww-10)+' '+(wy0-6)+'Z','#7df9ff',0);ctx.globalAlpha=1;}
 for(const [ry,rs] of [[-120,1],[-360,.9],[-610,.8]]){ctx.globalAlpha=.5+.45*pulse;mStar(-150*rs,ry,16,'#c9a2ff',ry);mStar(150*rs,ry-40,14,'#8ff5e6',ry+1);ctx.globalAlpha=1;}
 mShape('M-176 '+(-H+170)+'L176 '+(-H+170)+'L176 '+(-H+130)+'L-176 '+(-H+130)+'Z','#2a367c',6);
 mShape('M-196 '+(-H+130)+'L0 '+(-H-60)+'L196 '+(-H+130)+'Z','#6a3fc4',6);mShape('M-196 '+(-H+130)+'L0 '+(-H-60)+'L-60 '+(-H+130)+'Z','#8559e0',0);
 mBlob(0,-H-100,70+pulse*18,70+pulse*18,'rgba(125,249,255,.25)',0);mShape('M0 '+(-H-160)+'L34 '+(-H-100)+'L0 '+(-H-40)+'L-34 '+(-H-100)+'Z','#7df9ff',5);
 for(let k=0;k<4;k++){const a=(calm?0:time*2.2)+k*1.571;mStar(Math.cos(a)*86,-H-100+Math.sin(a)*40,9,'#fff3b0',a);}
 ctx.restore();
}
// ---- Swirling portal.
function vortexArt(x,y,open,time){
 if(open<=0)return;const calm=reducedMotion.matches,rx=190*open,ry=380*open,t=calm?0:time;
 ctx.save();ctx.translate(x,y);
 ctx.save();ctx.scale(1,ry/rx);const g=ctx.createRadialGradient(0,0,0,0,0,rx*1.35);g.addColorStop(0,'#ffffff');g.addColorStop(.22,'#b9fbff');g.addColorStop(.5,'#8f6bff');g.addColorStop(.8,'rgba(120,60,220,.55)');g.addColorStop(1,'rgba(120,60,220,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rx*1.35,0,7);ctx.fill();ctx.restore();
 ctx.lineCap='round';
 for(let k=0;k<5;k++){const q=1-k*.17;ctx.strokeStyle=['#2b1b4a','#7df9ff','#ff7bf2','#ffffff','#c9a2ff'][k];ctx.lineWidth=(k?10:16)*open;ctx.setLineDash(k?[70*q,50*q]:[]);ctx.lineDashOffset=-t*(120+k*60)*(k%2?1:-1);ctx.beginPath();ctx.ellipse(0,0,rx*q,ry*q,0,0,7);ctx.stroke();}
 ctx.setLineDash([]);
 for(let k=0;k<46;k++){const a=k*.55+t*3.2,r=k/46;ctx.globalAlpha=.25+.75*r;mBlob(Math.cos(a)*rx*r*.9,Math.sin(a)*ry*r*.9,(3+5*r)*open,(3+5*r)*open,k%3?'#ffffff':'#b9fbff',0);}
 for(let k=0;k<14;k++){const q=1-((t*.6+k/14)%1),a=k*2.4+t;ctx.globalAlpha=(1-q)*.9+.1;mStar(Math.cos(a)*rx*1.7*q,Math.sin(a)*ry*1.5*q,(7+6*q)*open,k%2?'#fff3b0':'#ff9ee6',a);}
 ctx.globalAlpha=1;ctx.restore();
}
function portalArt(wx,wy,f){
 const p=f.portal,time=motion.time,dt=mTick('portalTick');
 if(p&&!p.used&&f.x<GGCourse.magic.start){
  motion.portalY=motion.portalY===undefined?Math.max(260,f.y):motion.portalY+(Math.max(260,f.y)-motion.portalY)*Math.min(1,dt*3);
  const age=p.old?9:(f.time-p.at)/GGCourse.TIME_SCALE,q=Math.max(0,Math.min(1,(age-.5)/1.3)),open=q*q*(3-2*q),x=wx(p.x),y=wy(motion.portalY);
  if(x>mView().l-900&&x<mView().r+900){vortexArt(x,y,open,time);if(open>.9){ctx.save();ctx.translate(x,y-380*open-50);rounded(-170,-34,340,56,12,'#fff4cf','#5b2a86',5);ctx.font="900 32px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.fillStyle='#5b2a86';ctx.fillText('✦ MONDE MAGIQUE ✦',0,6);ctx.restore();}}
 }
 const e=motion.portalExit;if(e){const age=time-e.at;if(age>2.2)motion.portalExit=null;else vortexArt(wx(e.x),wy(e.y),Math.max(0,1-age/2.2),time);}
}
// ---- Dragon boss: enormous, follows the knight's altitude, three hearts over its head.
function dragonBossArt(wx,wy,f){
 const d=f.dragon;if(!d)return;const dt=mTick('dragonTick'),time=motion.time,TS=GGCourse.TIME_SCALE,down=d.downAt!==undefined?(f.time-d.downAt)/TS:-1;
 if(d.hearts<=0&&(down<0||down>3.4))return;
 if(Math.abs(d.x-f.x)>1500){motion.dragonX=undefined;motion.dragonY=undefined;return;}
 const ty=Math.max(330,f.y-230);motion.dragonX=motion.dragonX===undefined?d.x:motion.dragonX+(d.x-motion.dragonX)*Math.min(1,dt*(d.gap!==undefined?14:3.2));motion.dragonY=motion.dragonY===undefined?ty:motion.dragonY+(ty-motion.dragonY)*Math.min(1,dt*2.6);
 const hit=(f.time-d.hitAt)/TS,recoil=hit>=0&&hit<.6?1-hit/.6:0,S=6;
 let x=wx(motion.dragonX)+recoil*90,y=wy(motion.dragonY)-recoil*30;
 ctx.save();
 if(down>=0){const q=down/3.4;ctx.globalAlpha=Math.max(0,1-q*q);ctx.translate(x,y+down*down*150);ctx.rotate(down*.55);ctx.translate(-x,-y);}
 else if(recoil>0&&!reducedMotion.matches){ctx.translate(x,y);ctx.rotate(recoil*.1*Math.sin(time*40));ctx.translate(-x,-y);}
 dragon(x,y,S,time);
 if(recoil>0){ctx.globalAlpha=recoil*.9;for(let k=0;k<9;k++){const a=k*.7+1;mStar(x-560+Math.cos(a)*(120+(1-recoil)*260),y-250+Math.sin(a)*(90+(1-recoil)*200),38,k%2?'#fff3b0':'#ffffff',a);}}
 ctx.restore();
 if(down>=0)return;
 // Hearts: full ones beat, the one just lost cracks and drops.
 const beat=reducedMotion.matches?1:1+.06*Math.sin(time*6);
 for(let i=0;i<GGCourse.dragonBoss.hearts;i++){const hx=x-640+i*150,hy=y-520;
  if(i<d.hearts)mHeart(hx,hy,3.4*beat,'#ff4b5c','#5e0f1c',7);
  else if(i===d.hearts&&hit>=0&&hit<1){ctx.save();ctx.globalAlpha=1-hit;ctx.translate(hx,hy+hit*hit*260);ctx.save();ctx.rotate(-hit*.8);ctx.beginPath();ctx.rect(-140,-140,140,280);ctx.clip();mHeart(-hit*40,0,3.4+hit,'#ff4b5c','#5e0f1c',7);ctx.restore();ctx.rotate(hit*.8);ctx.beginPath();ctx.rect(0,-140,140,280);ctx.clip();mHeart(hit*40,0,3.4+hit,'#ff4b5c','#5e0f1c',7);ctx.restore();}
  else mHeart(hx,hy,3.2,'rgba(40,20,50,.45)','#3a2440',6);}
}
// ---- The Grand Sorcerer: a giant riding his magic staff. One touch is enough.
function sorcererBossArt(wx,wy,f){
 const S=GGCourse.sorcerer,dt=mTick('sorcTick'),time=motion.time,calm=reducedMotion.matches;
 const sx=f.sorcerer?.x??S.x;if(Math.abs(sx-f.x)>1700){motion.sorcY=undefined;return;}
 const gone=motion.sorcDownAt!==undefined?time-motion.sorcDownAt:-1;if(gone>1.3)return;
 const ty=Math.max(520,f.y-120);motion.sorcY=motion.sorcY===undefined?ty:motion.sorcY+(ty-motion.sorcY)*Math.min(1,dt*2.4);
 const x=wx(sx)+90,y=wy(motion.sorcY),bob=calm?0:Math.sin(time*1.7)*18,pulse=calm?.6:.5+.5*Math.sin(time*5),k=1.75;
 ctx.save();ctx.translate(x,y+bob);if(gone>=0){ctx.globalAlpha=Math.max(0,1-gone/1.3);ctx.rotate(gone*.9);ctx.scale(1+gone*.6,1+gone*.6);}ctx.scale(k,k);ctx.lineJoin='round';ctx.lineCap='round';
 // Sparkles trail behind the staff.
 for(let i=0;i<9;i++){const q=((calm?0:time*.9)+i/9)%1;ctx.globalAlpha=(1-q)*.9;mStar(340+q*260,112+Math.sin(i*2.1+time*3)*22,10+10*(1-q),i%2?'#fff3b0':'#ff9ee6',i+time);}
 ctx.globalAlpha=gone>=0?Math.max(0,1-gone/1.3):1;
 // Robe tail streaming behind.
 mShape('M90 60C190 30 280 96 392 44C372 128 300 168 214 150C176 172 118 150 84 112Z','#3d2590',7);
 // The staff he rides, crystal first.
 mShape('M-356 50C-200 70 100 78 336 104L334 126C100 100-200 94-356 76Z','#7a5230',7);mShape('M-300 62C-200 74 0 82 300 108',null,3,'#4f3219');
 mBlob(-404,64,70+pulse*20,70+pulse*20,'rgba(125,249,255,.30)',0);mShape('M-356 64L-402 22L-448 64L-402 106Z','#7df9ff',6);mShape('M-402 22L-402 106M-448 64L-356 64',null,3,'#e9ffff');
 // Boot and leg.
 mShape('M-74 64L-92 150L-44 160L-30 78Z','#3d2590',7);mShape('M-96 146C-134 146-160 166-150 186L-40 182L-38 156Z','#7a3b1e',7);
 // Body.
 mShape('M-120-190C-176-80-152 24-100 78L124 96C156 0 124-112 62-192Z','#4b2fa3',7);
 mShape('M-100 78L124 96L120 64L-106 46Z','#e9b23c',6);
 for(const [sx,sy,sr] of [[-70,-90,16],[20,-130,13],[60,-30,15],[-30,-10,12],[-90,10,11],[40,40,10]])mStar(sx,sy,sr,'#ffe98a',sx);
 // Beard, flowing back.
 mShape('M-74-176C-110-90-50-8 40 40C16-30 44-96 30-170Z','#f4f1ea',7);mShape('M-50-140C-56-90-30-40 4 0M-14-150C-14-100 6-60 22-30',null,4,'#cfcabd');
 // Arm stretched forward with a crackling orb.
 mShape('M-88-128C-170-116-232-76-266-34L-236 6C-196-32-142-54-80-58Z','#5a3cc0',7);mBlob(-268,-12,24,21,'#f1c9a5',6);
 mBlob(-314,-44,60+pulse*22,60+pulse*22,'rgba(255,123,242,.30)',0);mBlob(-314,-44,34,34,'#ff7bf2',6);mBlob(-324,-54,11,10,'#fff',0);
 for(let i=0;i<5;i++){const a=(calm?0:time*6)+i*1.257;line([[-314+Math.cos(a)*36,-44+Math.sin(a)*36],[-314+Math.cos(a+.3)*62,-44+Math.sin(a+.3)*62],[-314+Math.cos(a-.1)*84,-44+Math.sin(a-.1)*84]],'#fff3b0',4);}
 // Head.
 mBlob(-28,-218,64,58,'#f1c9a5',7);mBlob(-92,-206,22,15,'#e9b58c',6);
 mBlob(-56,-230,15,12,'#fff',5);mBlob(-60,-229,6,7,'#c8251a',0);mShape('M-86-256L-30-240',null,11,'#f4f1ea');
 mShape('M-88-184C-70-172-48-170-30-178L-34-190C-50-184-70-186-84-196Z','#5e1220',5);mShape('M-78-190l5 8 5-8M-64-188l5 8 5-8M-50-187l5 8 5-8','#fff8e6',2.5);
 mShape('M20-250C40-230 44-200 34-176',null,6,'#f4f1ea');
 // Hat.
 mShape('M-100-262L52-274C44-346 62-424 156-454C124-402 114-362 120-322L108-264Z','#3d2590',7);
 mBlob(-22,-258,114,24,'#34207e',7,MINK,-.06);mShape('M-92-276L50-288L52-306L-90-294Z','#e9b23c',5);
 mStar(60,-360,17,'#ffe98a',.3);mStar(20,-320,11,'#ffe98a',1);mStar(96,-410,12,'#ffe98a',2);
 ctx.restore();
 if(gone<0){const beat=calm?1:1+.07*Math.sin(time*6);mHeart(x-240,y+bob-900,4.2*beat,'#ff4b5c','#5e0f1c',8);ctx.save();ctx.translate(x-40,y+bob-900);rounded(-150,-36,390,62,12,'#fff4cf','#3d2590',6);ctx.font="900 36px 'Barlow Condensed',Impact,sans-serif";ctx.textAlign='center';ctx.fillStyle='#3d2590';ctx.fillText('LE GRAND SORCIER',45,10);ctx.restore();}
}
// ---- Everything that lives behind the knight.
function magicArt(wx,wy,ground,f){
 if(!f||!f.dragon||typeof GGMagic==='undefined')return;
 const v=mView(),M=GGCourse.magic,time=f.monsterTime||motion.time;
 dragonBossArt(wx,wy,f);portalArt(wx,wy,f);
 if(f.x<M.start-400)return;
 magicCeilingArt(wx,wy,v);
 const origin=wx(0),zero=wy(0),left=(v.l-origin)/15-30,right=(v.r-origin)/15+30,low=(zero-v.b)/.85-320,high=(zero-v.t)/.85+320;
 for(const a of GGMagic.near('wizard',left,right,f))wizardArt(wx(a.x),ground,time,a.id,(f.magicShots||[]).some(n=>n.key==='w'+a.id&&n.age<1.3));
 for(const a of GGMagic.near('tree',left,right,f,low,high))if(!f.treeUsed?.has(a.id))magicTreeArt(wx(a.x),wy(a.y),time,a.id);
 for(const a of GGMagic.near('fairy',left,right,f,low,high))if(!f.fairyUsed?.has(a.id))fairyArt(wx(a.x),wy(a.y),time,a.id);
 for(const a of GGMagic.near('bird',left,right,f,low,high))birdmanArt(wx(a.x),wy(a.y),time,a.id,!f.magicFired?.has('b'+a.id));
 sorcererBossArt(wx,wy,f);
 for(const n of f.magicShots||[])magicShotArt(n,f,wx,wy,v);
}
// ---- In front of the knight: the fairy's magic armour, with its remaining time as a ring.
function magicFrontArt(wx,wy,f,x,y){
 const a=f?.fairy;if(!a)return;const time=motion.time,calm=reducedMotion.matches,q=Math.max(0,a.left/a.total),pulse=calm?.6:.5+.5*Math.sin(time*(q<.25?16:6));
 ctx.save();ctx.translate(x,y-22);
 const g=ctx.createRadialGradient(0,0,24,0,0,112);g.addColorStop(0,'rgba(255,240,170,0)');g.addColorStop(.62,'rgba(255,214,107,.16)');g.addColorStop(1,'rgba(190,120,255,.55)');
 ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,112,90,0,0,7);ctx.fill();ctx.strokeStyle='rgba(255,236,150,'+(.55+.4*pulse)+')';ctx.lineWidth=5;ctx.stroke();
 ctx.strokeStyle='rgba(43,27,74,.55)';ctx.lineWidth=11;ctx.beginPath();ctx.ellipse(0,0,126,104,0,0,7);ctx.stroke();
 ctx.strokeStyle=q<.25?'#ff8a6a':'#ffffff';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(0,0,126,104,0,-Math.PI/2,-Math.PI/2+Math.PI*2*q);ctx.stroke();
 for(let k=0;k<6;k++){const an=(calm?0:time*3)+k*1.047;mStar(Math.cos(an)*130,Math.sin(an)*106,13,k%2?'#ffe98a':'#c9a2ff',an);}
 ctx.restore();
}
