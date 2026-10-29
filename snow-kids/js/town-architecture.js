// Vector architecture: materials and snow remain crisp at every village scale.
(function(SK){
 'use strict';
 const A=SK.TownArchitecture={},TAU=Math.PI*2;
 A.bellBounds=b=>({x:b.x+(350*(b.door??.535)-36+78)*b.w/350,y:b.y-b.h+211*b.h/350,w:32*b.w/350,h:38*b.h/350});
 A.hitBell=(b,x,y)=>{if(b.id!=='ecole')return false;const r=A.bellBounds(b);return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;};
 A.ringBell=function(b,t){if(t<(b.bellUntil||0))return false;b.bellUntil=t+1.3;SK.Audio.init();SK.Audio.sfx('schoolBell');return true;};
 const box=(c,x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const poly=(c,p,color)=>{c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 const line=(c,p,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
 function snow(c,x,y,w,depth=10){
  const g=c.createLinearGradient(0,y-depth,0,y+depth);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#f2faff');g.addColorStop(1,'#c7dfea');
  c.fillStyle=g;c.beginPath();c.moveTo(x,y+3);c.bezierCurveTo(x+w*.13,y-depth,x+w*.19,y-depth*.3,x+w*.33,y-depth*.6);c.bezierCurveTo(x+w*.55,y-depth*1.5,x+w*.63,y-depth*.3,x+w*.79,y-depth*.5);c.quadraticCurveTo(x+w*.98,y-depth*.4,x+w,y+3);c.quadraticCurveTo(x+w*.6,y+8,x+w*.3,y+5);c.quadraticCurveTo(x,y+8,x,y+3);c.fill();
 }
 function windowPane(c,x,y,w,h){
  box(c,x-6,y-6,w+12,h+14,2,'#293e48');box(c,x-3,y-3,w+6,h+6,1,'#8c7655');
  const g=c.createRadialGradient(x+w*.48,y+h*.65,2,x+w*.5,y+h*.55,h);g.addColorStop(0,'#ffe890');g.addColorStop(.55,'#ffc24c');g.addColorStop(1,'#e58a32');box(c,x,y,w,h,1,g);
  poly(c,[[x+4,y],[x+11,y],[x+24,y+h],[x+16,y+h]],'#fff9db30');
  box(c,x+w*.48-2,y,4,h,0,'#394548');box(c,x,y+h*.49,w,4,0,'#394548');
  box(c,x-9,y+h+5,w+18,7,1,'#a9a6a0');snow(c,x-10,y+h+3,w+20,6);
 }
 function door(c,x,y,w,h,selected){
  box(c,x-8,y-7,w+16,h+7,2,selected?'#edc56c':'#877b6a');box(c,x-5,y-4,w+10,h+4,1,'#253944');
  const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#344b55');g.addColorStop(.7,'#23363f');g.addColorStop(1,'#192c36');box(c,x,y,w,h,1,g);
  box(c,x+8,y+9,w-16,h*.33,1,'#152731');const glass=c.createLinearGradient(x,y,x+w,y+h*.35);glass.addColorStop(0,'#ffda77');glass.addColorStop(1,'#f5a337');box(c,x+12,y+13,w-24,h*.33-8,0,glass);
  for(const q of [1/3,2/3])box(c,x+12+(w-24)*q-1,y+13,2,h*.33-8,0,'#394548');box(c,x+12,y+13+h*.13,w-24,2,0,'#394548');
  for(const q of [.44,.71]){box(c,x+8,y+h*q,w-16,h*.22,1,'#142b35');box(c,x+11,y+h*q+3,w-22,h*.22-6,1,'#3a5058');box(c,x+13,y+h*q+5,w-26,h*.22-9,0,'#2a3f49');}
  box(c,x+w-10,y+h*.52,4,16,2,'#bd914b');oval(c,x+w-8,y+h*.54,3,3,'#ffdf87');
  box(c,x-9,y+h,w+18,5,1,'#768c94');box(c,x-14,y+h+5,w+28,5,1,'#e0ebef');
 }
 // Small enamel address plaques, mounted beside or immediately above the door.
 A.plaque=function(c,b,x,y,w=88){
  const h=48,col=b.id==='ecole'?'#ded0a7':'#e5dfca',ink='#43585a';
  c.save();box(c,x+1,y+2,w,h,5,'#18303b30');box(c,x,y,w,h,5,'#82908a');box(c,x+1.5,y+1.5,w-3,h-3,4,col);
  line(c,[[x+7,y+3],[x+w-7,y+3]],'#fff9e599',1);
  for(const xx of [x+5,x+w-5]){oval(c,xx,y+h/2,1.4,1.4,'#778278');line(c,[[xx-.7,y+h/2],[xx+.7,y+h/2]],'#d8dfcd',.6);}
  c.save();c.translate(x+w/2,y+15);
  if(b.id==='ecole'){
   poly(c,[[-13,-6],[-3,-5],[0,-2],[3,-5],[13,-6],[13,7],[3,7],[0,10],[-3,7],[-13,7]],ink);
   line(c,[[0,-2],[0,8]],col,1);for(const side of [-1,1])for(const yy of [-1,3])line(c,[[side*4,yy],[side*10,yy-1]],col,.8);
  }else if(['look','clothes'].includes(b.id)){
   c.strokeStyle=ink;c.lineWidth=1.5;c.beginPath();c.arc(0,-5,3,Math.PI,TAU);c.lineTo(0,0);c.lineTo(-13,7);c.quadraticCurveTo(-15,9,-11,9);c.lineTo(11,9);c.quadraticCurveTo(15,9,13,7);c.lineTo(0,0);c.stroke();
  }else if(b.id==='gym'){
   line(c,[[-11,1],[11,1]],ink,3);for(const xx of [-12,8])box(c,xx,-6,4,14,1,ink);
  }else if(b.id==='trophees'){
   poly(c,[[-14,-4],[0,-11],[14,-4]],ink);for(const xx of [-10,-2,6])box(c,xx,-2,4,10,0,ink);box(c,-14,9,28,2,0,ink);
  }else if(b.id==='shop'){
   c.rotate(.35);box(c,-5,-12,10,25,5,ink);line(c,[[-3,-3],[3,-3]],col,2);line(c,[[-3,5],[3,5]],col,2);
  }else{
   line(c,[[-14,8],[-3,-9],[5,3],[10,-3],[16,8]],ink,1.6);line(c,[[-7,-3],[-3,-1],[0,-4]],ink,1.2);
  }
  c.restore();
  const names={ecole:'École',look:'Garde-robe',clothes:'Vêtements',kids:'Chalet',shop:'Planches',trophees:'Musée',gym:'Gym'};
  c.fillStyle=ink;c.textAlign='center';c.font='600 '+(b.id==='look'?10:11)+'px Trebuchet MS,sans-serif';c.fillText(names[b.id]||b.label,x+w/2,y+38,w-16);c.restore();
 };
 function snowman(c,x,y,design){SK.Snowman.draw(c,x,y,.72,design);}
 // Modern glass-front gym; the equipment sits behind the same window clipping plane.
 function gymFacade(c,b,t,selected){
  c.save();c.translate(b.x,b.y-b.h);c.scale(b.w/490,b.h/300);
  const doorCenter=490*(b.door??.535),dx=doorCenter-38;
  oval(c,223,309,285,14,'#abc6d3');
  poly(c,[[-62,-17],[0,0],[0,300],[-62,275]],'#273e48');
  c.save();poly(c,[[-62,-17],[0,0],[0,300],[-62,275]],'#273e48');c.clip();
  for(let row=0;row<27;row++){
   const y=row*12;line(c,[[-64,y-18],[0,y]],'#536b74',1);
   for(let x=-66+(row%2?12:0);x<0;x+=24)line(c,[[x,y+x*18/64],[x,y+12+x*18/64]],'#536b74',1);
  }c.restore();
  poly(c,[[-62,258],[0,278],[0,300],[-62,275]],'#8a817a');
  box(c,0,0,490,300,0,'#697a80');box(c,3,66,484,233,0,'#344c59');
  // Brushed aluminium fascia, recessed lettering, restrained white backlight.
  const metal=c.createLinearGradient(0,0,0,64);metal.addColorStop(0,'#c6cdd0');metal.addColorStop(.22,'#a8b3b8');metal.addColorStop(.72,'#89969e');metal.addColorStop(1,'#aebac0');box(c,0,0,490,64,0,metal);
  for(let y=3;y<62;y+=3)line(c,[[3,y],[487,y]],y%2?'#eff5f50b':'#223d4a09',.6);
  line(c,[[0,1],[490,1]],'#f5fbff',2);line(c,[[0,64],[490,64]],'#3c525f',3);
  c.save();c.textAlign='center';c.font='900 53px Arial,sans-serif';c.lineJoin='round';c.shadowColor='#f6ffff';c.shadowBlur=8;c.strokeStyle='#e8f5f6';c.lineWidth=2.5;c.strokeText('GYM',245,51);c.shadowBlur=0;c.fillStyle='#203540';c.fillText('GYM',245,51);c.restore();
  const panes=[[7,72,dx-14,184],[dx+4,72,68,36],[dx+7,122,62,173],[dx+83,72,490-dx-90,184]];
  for(const [px,py,pw,ph]of panes){
   c.save();c.beginPath();c.rect(px,py,pw,ph);c.clip();
   const wall=c.createLinearGradient(0,72,0,258);wall.addColorStop(0,'#ab9b84');wall.addColorStop(.65,'#d0c4a8');wall.addColorStop(1,'#b9b09d');box(c,0,72,490,190,0,wall);
   box(c,0,207,490,93,0,'#72797a');box(c,0,204,490,4,0,'#586269');
   for(let y=220;y<300;y+=18)line(c,[[0,y],[490,y]],'#53636b44',.7);for(let x=0;x<520;x+=55)line(c,[[245+(x-245)*.65,207],[x,300]],'#53636b44',.7);
   // Warm pendant strips and their pools of light.
   for(const x of [68,165,377,446]){
    line(c,[[x,72],[x,87]],'#52616a',2);box(c,x-28,86,56,5,1,'#3d515c');box(c,x-26,91,52,2,0,'#fff3c5');
    poly(c,[[x-25,93],[x+25,93],[x+65,237],[x-65,237]],'#fff0b92a');
   }
   // Two treadmills with moving belt markings, upright screens and handrails.
   for(const x of [16,109]){
    box(c,x,242,84,9,3,'#2c414c');box(c,x+7,242,68,5,2,'#182d38');
    for(let i=0;i<4;i++){const shift=(t*14+i*18)%66;line(c,[[x+9+shift,244],[x+13+shift,244]],'#85999f',1);}
    line(c,[[x+8,241],[x+25,177]],'#a7b7bc',5);line(c,[[x+69,241],[x+81,179]],'#98aab1',5);
    poly(c,[[x+19,169],[x+71,169],[x+82,184],[x+25,184]],'#304753');poly(c,[[x+26,171],[x+65,171],[x+72,179],[x+29,179]],'#577a8e');
    line(c,[[x+72,180],[x+86,180]],'#263b46',4);box(c,x+38,161,4,8,0,'#334d5c');
    poly(c,[[x+29,143],[x+58,143],[x+61,162],[x+32,162]],'#273f4d');poly(c,[[x+32,145],[x+56,145],[x+58,159],[x+35,159]],'#6498b1');
    line(c,[[x+36,154],[x+40,154],[x+43,149],[x+47,156],[x+53,151]],'#b5e5df',.8);
    for(const a of [10,70])box(c,x+a,250,9,3,1,'#2b3e46');
   }
   // Exercise bike glimpsed beside the treadmills.
   oval(c,205,222,15,18,'#344b57');oval(c,205,222,8,10,'#657d8a');line(c,[[192,244],[220,244]],'#253d4b',4);line(c,[[205,218],[200,190]],'#8c9da7',4);box(c,189,186,23,5,2,'#253d4b');line(c,[[209,221],[217,176],[227,171]],'#718794',3);box(c,216,165,17,10,1,'#304b5b');box(c,218,167,13,6,0,'#86b9cc');
   // Dumbbell rack; small metal hubs stay visible through the glazing.
   for(const yy of [188,211]){line(c,[[doorCenter+9,yy+7],[doorCenter+84,yy+7]],'#a9b7bd',3);
    for(let j=0;j<4;j++){const xx=doorCenter+20+j*17;line(c,[[xx-5,yy],[xx+5,yy]],'#b4c4c9',2);for(const end of [-5,5]){oval(c,xx+end,yy,4,6,'#304653');oval(c,xx+end,yy,1.1,1.5,'#97aeb9');}}
   }line(c,[[doorCenter+10,195],[doorCenter+7,236]],'#9aafb9',3);line(c,[[doorCenter+82,195],[doorCenter+86,236]],'#9aafb9',3);
   // Squat rack and plate storage in the right-hand bay.
   for(const x of [379,455]){box(c,x,119,5,127,0,'#536975');box(c,x+1,120,1,124,0,'#a7b8bf');for(let y=130;y<216;y+=9)oval(c,x+2.5,y,.8,1,'#1f3644');}
   line(c,[[379,119],[460,119]],'#536975',5);line(c,[[366,246],[392,246]],'#354e5c',4);line(c,[[446,246],[472,246]],'#354e5c',4);
   line(c,[[365,177],[473,177]],'#b6c4c9',2);for(const x of [369,466]){box(c,x,166,4,23,1,'#2e4654');box(c,x-4,170,3,15,1,'#415a69');}
   for(const y of [214,240]){line(c,[[357,y+10],[479,y+10]],'#8e9fa6',3);for(let x=365;x<480;x+=23){oval(c,x,y,9,10,'#2c4350');oval(c,x,y,5.4,6.3,'#49616f');oval(c,x,y,2,2.5,'#a0b3bd');}}
   // Television on the back wall.
   box(c,174,108,38,23,1,'#344c59');box(c,177,111,32,17,0,'#577e94');line(c,[[180,123],[188,116],[195,121],[205,114]],'#a5cbd4',1);
   poly(c,[[px+pw*.12,py],[px+pw*.32,py],[px+pw*.02,py+ph],[px-pw*.18,py+ph]],'#f4fcff20');
   poly(c,[[px+pw*.70,py],[px+pw*.78,py],[px+pw*.36,py+ph],[px+pw*.28,py+ph]],'#ffffff21');
   c.restore();c.strokeStyle='#9cabb0';c.lineWidth=1;c.strokeRect(px+.8,py+.8,pw-1.6,ph-1.6);
  }
  // Thin mullions keep the equipment legible, with a full-height central glass door.
  for(const x of [dx*.5,dx+84+(490-dx-90)*.51]){box(c,x,70,3,188,0,'#405866');line(c,[[x+.5,73],[x+.5,255]],'#a4b1b7',.7);}
  box(c,dx,113,76,5,0,selected?'#eac36e':'#96a8af');box(c,dx,113,5,187,0,'#526c7b');box(c,dx+71,113,5,187,0,'#526c7b');
  line(c,[[doorCenter,122],[doorCenter,295]],'#4d6572',1.7);line(c,[[dx+60,188],[dx+60,235]],'#ccd7db',3);line(c,[[dx+59,188],[dx+59,235]],'#8b9da6',1);
  box(c,0,261,dx-2,39,0,'#a0948e');box(c,dx+78,261,490-dx-78,39,0,'#a0948e');line(c,[[0,260],[dx-2,260]],'#eef8fb',3);line(c,[[dx+78,260],[490,260]],'#eef8fb',3);
  box(c,dx-5,299,86,5,1,'#d2e1e7');
  poly(c,[[dx-8,307],[dx+84,307],[dx+94,322],[dx-18,322]],'#ad8755');line(c,[[dx-5,309],[dx+81,309],[dx+87,319],[dx-11,319],[dx-5,309]],'#614b33',1.5);c.font='italic bold 11px Georgia';c.fillStyle='#493e2d';c.textAlign='center';c.fillText('Bienvenue',doorCenter,317);
  snow(c,-63,302,dx+40,10);snow(c,dx+105,303,490-dx-80,10);
  // Flat roof slab in perspective, with a straight, thin snow covering.
  poly(c,[[-65,-20],[428,-20],[494,-3],[-4,-3]],'#eaf5fa');
  poly(c,[[-4,-3],[494,-3],[494,1],[-4,1]],'#bdd2de');
  poly(c,[[-65,-20],[-4,-3],[-4,1],[-65,-16]],'#91acbd');
  line(c,[[-64,-21],[428,-21],[494,-4]],'#ffffff',2);
  // Small evergreen at the right corner, leaving the entry clear.
  box(c,458,276,5,24,0,'#76533c');for(const [yy,ww]of [[251,30],[231,24],[214,17]]){poly(c,[[460,yy-25],[460-ww,yy+18],[460+ww,yy+18]],'#315f4c');poly(c,[[460,yy-20],[460-ww*.7,yy+9],[460+ww*.65,yy+9]],'#eef8f5');}snow(c,437,300,53,5);
  if(selected)poly(c,[[doorCenter,110],[doorCenter-7,100],[doorCenter+7,100]],'#ffcd69');
  c.restore();return true;
 }

 function wardrobeFacade(c,b,t,selected){
  c.save();c.translate(b.x,b.y-b.h);c.scale(b.w/350,b.h/350);
  oval(c,164,359,211,13,'#aec8d666');
  // Boutique silhouette: a low mansard roof, a dormer and cream stonework.
  poly(c,[[-28,90],[0,102],[0,350],[-28,335]],'#6b667a');
  const wall=c.createLinearGradient(0,90,350,350);wall.addColorStop(0,'#f4e5d4');wall.addColorStop(1,'#c9b9ac');box(c,0,82,350,268,1,wall);
  for(let y=94;y<350;y+=21){line(c,[[0,y],[350,y]],'#a9958940',1);for(let x=(y%42?0:25);x<350;x+=50)line(c,[[x,y],[x,y+20]],'#a9958935',1);}
  const roof=c.createLinearGradient(0,-28,0,90);roof.addColorStop(0,'#686883');roof.addColorStop(1,'#343e59');poly(c,[[-23,88],[24,-25],[286,-25],[370,88]],roof);
  for(let i=0;i<12;i++)line(c,[[28+i*23,-21],[-17+i*34,84]],'#a7acc130',1);
  line(c,[[-23,88],[370,88]],'#29374d',7);snow(c,-25,82,397,9);snow(c,23,-25,266,8);
  // Small attic studio window, with its own rounded snowy cap.
  box(c,130,-16,72,75,11,'#eee0cf');box(c,138,-9,56,61,7,'#35475b');box(c,143,-4,46,51,4,'#ffd784');line(c,[[166,-4],[166,47]],'#52606b',3);line(c,[[143,21],[189,21]],'#52606b',3);snow(c,128,-16,76,7);
  for(const x of [8,335]){box(c,x,99,7,244,1,'#8e7290');box(c,x+2,100,2,240,0,'#cfb9cf');}
  const display=(x,w,colors)=>{
   box(c,x-6,183,w+12,143,3,'#596578');const g=c.createLinearGradient(x,185,x,320);g.addColorStop(0,'#ffe7b1');g.addColorStop(1,'#d7b992');box(c,x,188,w,130,1,g);
   box(c,x,304,w,14,0,'#69556b');line(c,[[x+8,203],[x+w-8,203]],'#aa8b64',3);
   colors.forEach((color,i)=>{const xx=x+w*(i+.5)/colors.length;line(c,[[xx,203],[xx,215]],'#735c53',1.5);poly(c,[[xx,214],[xx-16,225],[xx+16,225]],'#a99379');SK.drawJacket(c,color,xx,258,25,'front',false);});
   poly(c,[[x+4,188],[x+20,188],[x+w*.7,318],[x+w*.7-12,318]],'#ffffff30');box(c,x-8,321,w+16,7,1,'#8d8391');snow(c,x-8,320,w+16,5);
  };
  display(24,115,['#9b89ba','#67c6db']);display(248,74,['#489449']);
  // Fabric awning with scalloped hem and a discrete hanger plaque.
  poly(c,[[15,150],[333,150],[348,180],[0,180]],'#947098');
  for(let i=0;i<10;i++){const xx=15+i*31.8,ex=i*34.8;poly(c,[[xx,150],[xx+15.9,150],[ex+17.4,180],[ex,180]],'#e6d7c6');}
  for(let i=0;i<20;i++)box(c,i*17.4,176,17.4,13,6,i%2?'#947098':'#e6d7c6');snow(c,13,149,322,5);
  const dx=350*(b.door??.535)-33;door(c,dx,207,66,143,selected);
  A.plaque(c,b,dx-8,96,82);
  for(const xx of [dx-17,dx+82]){box(c,xx-3,205,7,29,2,'#8b6d86');oval(c,xx+1,217,4,9,'#ffe7a2');}
  poly(c,[[dx-10,362],[dx+76,362],[dx+86,375],[dx-19,375]],'#765b79');line(c,[[dx-7,365],[dx+73,365]],'#d7b9ce',2);
  for(const xx of [12,338]){box(c,xx-12,328,24,22,3,'#81657d');for(let i=0;i<3;i++)poly(c,[[xx-9+i*7,329],[xx-5+i*7,305-i%2*7],[xx+i*7,329]],'#467263');snow(c,xx-14,328,28,4);}
  snow(c,-28,350,131,9);snow(c,272,350,95,9);if(selected)poly(c,[[dx+33,198],[dx+25,188],[dx+41,188]],'#ffd76f');
  c.restore();return true;
 }
 A.draw=function(c,b,t,selected){
  if(b.id==='look')return wardrobeFacade(c,b,t,selected);
  if(b.id==='gym')return gymFacade(c,b,t,selected);
  if(!['ecole','look','gym'].includes(b.id))return false;
  const school=b.id==='ecole',top=b.y-b.h;
  c.save();c.translate(b.x,top);c.scale(b.w/350,b.h/350);
  oval(c,170,358,220,14,'#aec8d6');
  // Brick chimney and drifting smoke are behind the roof silhouette.
  box(c,268,-91,35,94,0,school?'#9d432c':'#706454');
  for(let y=-85;y<-2;y+=11){line(c,[[269,y],[302,y]],'#d3986c',1);for(let x=269+(Math.round(y/11)%2?0:10);x<302;x+=18)line(c,[[x,y],[x,y+10]],'#c58e66',1);}
  box(c,265,-96,41,8,1,'#854633');snow(c,264,-98,43,7);
  for(let i=0;i<5;i++){const p=(t*.11+i/5)%1;oval(c,286+Math.sin(p*3)*12+p*22,-112-p*65,6+p*17,8+p*14,`rgba(229,243,249,${.26*(1-p)})`);}
  poly(c,[[-42,-17],[0,0],[0,350],[-42,329]],school?'#843c2e':'#415d60');
  const wall=c.createLinearGradient(0,0,350,350);wall.addColorStop(0,school?'#bd5536':b.color);wall.addColorStop(1,school?'#963925':'#4f6c70');box(c,0,0,350,350,0,wall);
  if(school){
   for(let row=0;row<22;row++){const y=row*16;line(c,[[0,y],[350,y]],'#dc9568',1.35);
    for(let x=(row%2?-24:0);x<350;x+=48){const a=Math.max(0,x),z=Math.min(350,x+48);line(c,[[a+2,y+2],[z-2,y+2]],'#f4b27a38',1);if(x>0)line(c,[[x,y],[x,y+16]],'#dc9568',1.35);}
    line(c,[[-42,y-17],[0,y]],'#b47351',1);for(let x=-32+(row%2?10:0);x<0;x+=20)line(c,[[x,y+x*17/42],[x,y+16+x*17/42]],'#b47351',1);
   }
  }else{
   for(let y=4;y<350;y+=19){box(c,0,y,350,2,0,'#263f4755');line(c,[[4,y+3],[346,y+3]],'#edf1d62b');}
   for(const x of [7,333]){box(c,x,0,10,350,0,'#d2ccad');box(c,x+7,0,3,350,0,'#7b857b');}
  }
  box(c,0,328,350,22,0,'#aaaba1');box(c,0,328,350,3,0,'#e9e6d4');poly(c,[[-42,307],[0,328],[0,350],[-42,329]],'#8f9894');
  // Deep slate gable, broad soft snow, and a shadow under the eaves.
  poly(c,[[-52,-4],[125,-116],[365,2],[349,17],[124,-92],[-35,16]],'#203a49');poly(c,[[-35,2],[125,-98],[350,2]],'#345567');
  line(c,[[-31,1],[125,-94],[350,3]],'#52717e',3);box(c,0,1,350,9,0,'#20344066');
  c.fillStyle='#c0deeb';c.beginPath();c.moveTo(-54,-9);c.bezierCurveTo(-11,-37,56,-118,115,-121);c.bezierCurveTo(153,-123,176,-95,212,-79);c.quadraticCurveTo(295,-44,365,-2);c.lineTo(360,10);c.quadraticCurveTo(245,-41,127,-99);c.quadraticCurveTo(34,-44,-44,12);c.closePath();c.fill();
  c.fillStyle='#f6fcff';c.beginPath();c.moveTo(-53,-15);c.bezierCurveTo(-4,-49,63,-126,110,-131);c.bezierCurveTo(144,-133,171,-103,209,-88);c.quadraticCurveTo(307,-46,367,-9);c.quadraticCurveTo(381,5,359,2);c.quadraticCurveTo(254,-52,132,-108);c.bezierCurveTo(94,-121,20,-31,-44,2);c.quadraticCurveTo(-59,7,-53,-15);c.fill();
  snow(c,-2,7,352,10);
  for(let i=0;i<20;i++){const x=4+i*17.6,len=10+(i*13%22);poly(c,[[x,10],[x+5,9],[x+2,10+len]],i%2?'#effaff':'#c3e0ee');}
  if(school){
   // Solar cells follow the sloping panel plane, with fine silver mullions.
   c.save();c.transform(.86,0,.035,.80,108,-45);box(c,-3,-3,103,43,1,'#182f40');box(c,0,0,97,37,1,'#d0dce0');box(c,3,3,91,31,0,'#244b70');
   for(let row=0;row<3;row++)for(let col=0;col<8;col++){box(c,5+col*11,4+row*10,9,8,1,(col+row)%2?'#376486':'#2b5275');line(c,[[6+col*11,5+row*10],[12+col*11,5+row*10]],'#b5d7e177',.5);}
   line(c,[[3,3],[94,34]],'#ffffff32',2);c.restore();
  }else{oval(c,125,-43,17,17,'#bac9c7');oval(c,125,-43,13,13,'#e4c786');line(c,[[113,-43],[137,-43]],'#425e68',2);line(c,[[125,-55],[125,-31]],'#425e68',2);}
  windowPane(c,43,43,70,76);windowPane(c,235,43,70,76);
  if(!school)for(const x of [26,121,218,313]){box(c,x,40,10,82,1,'#334f5b');for(let y=46;y<118;y+=10)line(c,[[x+2,y],[x+8,y]],'#93a99f',1);}

  const dx=350*(b.door??.535)-36;door(c,dx,199,72,151,selected);
  A.plaque(c,b,dx-112,211);
  if(school){
   c.save();c.translate(dx+93,220);c.rotate(t<(b.bellUntil||0)?Math.sin((b.bellUntil-t)*24)*.22:0);c.translate(-dx-93,-220);
   box(c,dx+86,217,13,23,2,'#756044');line(c,[[dx+92,220],[dx+92,229]],'#e8cb79',2);
   c.fillStyle='#d9ac51';c.beginPath();c.moveTo(dx+84,240);c.quadraticCurveTo(dx+88,237,dx+88,231);c.quadraticCurveTo(dx+93,221,dx+97,231);c.quadraticCurveTo(dx+97,237,dx+102,240);c.closePath();c.fill();line(c,[[dx+84,241],[dx+102,241]],'#f7dc91',2);oval(c,dx+93,243,2,2,'#d6ae56');
   c.restore();snowman(c,306,349,b.snowmanDesign);
  }else{
   const lx=dx+93;box(c,lx-5,217,10,21,2,'#f8d38a');line(c,[[lx-8,215],[lx,207],[lx+8,215]],'#314d57',3);line(c,[[lx,217],[lx,238]],'#506067',1);
   box(c,277,329,42,21,2,'#6d5544');for(let i=0;i<4;i++)poly(c,[[282+i*10,330],[287+i*10,298-i%2*7],[294+i*10,330]],'#3a6c5c');snow(c,276,330,44,5);
  }
  poly(c,[[dx-7,361],[dx+79,361],[dx+87,375],[dx-16,375]],'#94714a');line(c,[[dx-5,363],[dx+77,363],[dx+82,372],[dx-10,372],[dx-5,363]],'#c7a76b',1);c.fillStyle='#3b4039';c.textAlign='center';c.font='italic bold 9px Georgia';c.fillText('Bienvenue',dx+36,371);
  snow(c,-43,352,147,11);snow(c,266,354,100,10);
  if(selected)poly(c,[[dx+36,191],[dx+28,181],[dx+44,181]],'#ffd76f');
  c.restore();return true;
 };
 A.polish=function(c,b){
  if(b.id==='debug')return;
  const x=b.x,y=b.y,top=y-b.h,w=b.w;
  c.save();
  if(['shop','clothes'].includes(b.id)){
   c.lineCap='round';c.lineJoin='round';c.strokeStyle='#c7e0ec';c.lineWidth=17;c.beginPath();
   if(b.id==='shop'){c.moveTo(x-13,top-1);c.quadraticCurveTo(x+w*.24,top-51,x+w*.5,top-91);c.quadraticCurveTo(x+w*.75,top-49,x+w-2,top-2);}
   else{c.moveTo(x-1,top-3);c.quadraticCurveTo(x+19,top-39,x+41,top-65);c.quadraticCurveTo(x+w*.5,top-71,x+w-41,top-65);c.quadraticCurveTo(x+w-19,top-35,x+w-1,top-3);}
   c.stroke();c.strokeStyle='#f7fcff';c.lineWidth=12;c.stroke();
   snow(c,x+14,top+13,w-28,8);
   for(let i=0;i<13;i++){const a=x+17+i*(w-35)/13;poly(c,[[a,top+16],[a+4,top+16],[a+2,top+25+i%4*4]],'#d9edf7');}
   for(const xx of [x+4,x+w-10])for(let yy=top+30;yy<y;yy+=50){oval(c,xx+2,yy,1.2,1.2,'#dee5d7');}
  }
  if(b.id==='kids'){
   for(const fx of [44/350,218/350])snow(c,x+w*fx-6,top+b.h*106/335,w*69/350+12,6);
   for(let i=0;i<13;i++){const xx=x+9+i*w/13;poly(c,[[xx,top+12],[xx+4,top+12],[xx+2,top+23+i%3*5]],'#dceff7');}
  }
  if(b.id==='trophees'){snow(c,x-10,top+24,w+20,7);for(const xx of [x+w*.12,x+w*.77]){snow(c,xx-7,top+29,w*.11+14,5);}}
  // Snow-dusted thresholds, small stone path and contact shadows.
  const dx=b.x+b.w*(b.door??.535);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){const xx=dx-42+col*28+(row%2?3:0);box(c,xx,y+12+row*11,25,9,2,'#b4cbd5');line(c,[[xx+2,y+13+row*11],[xx+22,y+13+row*11]],'#f7fcff',1);}
  c.restore();
 };
})(window.SK);
