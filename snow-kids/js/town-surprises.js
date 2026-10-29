// Small, occasional visitors; shared canvas art for the village and previews.
(function(SK){
'use strict';
const TAU=Math.PI*2;
const guests=[
 ['pikachu','Pikachu','pokemon','#f9d44c']
].map(([id,name,type,color,hat])=>({id,name,type,color,hat}));
function oval(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function poly(c,p,col){c.fillStyle=col;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function line(c,p,col,w=2){c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function box(c,x,y,w,h,r,col){c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function eyes(c,y=-65,wide=10){for(const x of [-wide,wide]){oval(c,x,y,5,7,'#fffdf4');oval(c,x+1,y,2.1,3.3,'#263444');}}
function smile(c,y=-49){c.strokeStyle='#5c3c42';c.lineWidth=2;c.beginPath();c.arc(0,y-4,7,0,Math.PI);c.stroke();}
function wave(c,g,t){c.save();c.translate(21,-36);c.rotate(-.65+Math.sin(t*17)*.45);box(c,0,-9,22,12,6,g.color);oval(c,26,-3,7,7,g.type==='south'?'#f2c68e':g.color);c.restore();}
function visitor(c,g,t){
const id=g.id,col=g.color;
if(g.type==='south'){
 const fat=id==='cartman'?1.3:1;
 oval(c,0,-28,27*fat,28,col);box(c,-24,-8,48,10,3,'#323d4c');wave(c,g,t);
 oval(c,0,-63,29,29,id==='kenny'?col:'#f0cba0');
 if(id==='kenny'){oval(c,0,-63,22,24,'#824c31');oval(c,0,-63,16,21,'#f0cba0');eyes(c,-66,7);line(c,[[-4,-43],[-8,-29]],'#7c482d',1.5);line(c,[[4,-43],[8,-29]],'#7c482d',1.5);}
 else{box(c,-29,-89,58,22,11,g.hat);box(c,-30,-73,60,8,2,id==='stan'?'#e44f54':id==='cartman'?'#f4dc58':g.hat);
 if(id==='kyle'){box(c,-34,-80,11,30,3,g.hat);box(c,23,-80,11,30,3,g.hat);box(c,-19,-92,38,15,2,'#397539');}
 else oval(c,0,-93,7,6,id==='stan'?'#e44f54':'#f4dc58');
 eyes(c,-61,10);smile(c,-48);}
 line(c,[[0,-37],[0,-7]],'#543a3e',1);for(const y of [-29,-20,-11])oval(c,3,y,1.6,1.6,'#493635');
}else if(id==='pikachu'){
 poly(c,[[-17,-79],[-32,-126],[-34,-95],[-25,-70]],col);poly(c,[[17,-79],[35,-125],[33,-94],[25,-70]],col);
 poly(c,[[-32,-126],[-34,-108],[-27,-105]],'#34313b');poly(c,[[35,-125],[34,-108],[27,-105]],'#34313b');
 poly(c,[[-24,-18],[-49,-30],[-42,-48],[-59,-59],[-45,-73],[-32,-52],[-38,-36],[-19,-29]],col);
 oval(c,0,-29,23,28,col);oval(c,0,-66,29,26,col);wave(c,g,t);eyes(c);for(const x of [-21,21])oval(c,x,-52,6,5,'#ed6652');smile(c);
}else if(id==='squirtle'){
 oval(c,-5,-30,28,32,'#a66c3e');oval(c,0,-29,22,29,col);oval(c,0,-26,17,24,'#ffe0a0');
 for(const y of [-37,-22])line(c,[[-13,y],[13,y]],'#c79e67',1);line(c,[[0,-48],[0,-4]],'#c79e67',1);
 oval(c,0,-67,28,27,col);wave(c,g,t);eyes(c);smile(c);
}else if(id==='charizard'){
 for(const side of [-1,1]){poly(c,[[side*15,-41],[side*58,-79],[side*50,-22],[side*27,-30]],col);poly(c,[[side*22,-43],[side*51,-70],[side*45,-31],[side*30,-35]],'#418c97');}
 line(c,[[-19,-15],[-42,-11],[-52,-30]],col,11);poly(c,[[-57,-27],[-62,-45],[-52,-40],[-46,-56],[-43,-29]],'#ffca48');
 oval(c,0,-29,24,32,col);oval(c,0,-24,15,23,'#ffe0a3');poly(c,[[-22,-77],[-20,-103],[-7,-81],[16,-82],[25,-102],[25,-65]],col);
 oval(c,0,-67,27,24,col);oval(c,10,-53,21,12,col);wave(c,g,t);eyes(c,-71);smile(c,-47);
}else if(id==='bulbasaur'){
 for(const side of [-1,1])poly(c,[[side*5,-28],[side*37,-50],[side*27,-13],[0,-8]],'#4c9c66');
 oval(c,0,-27,29,25,col);poly(c,[[-27,-65],[-23,-96],[-6,-76],[15,-77],[27,-95],[28,-61]],col);
 oval(c,0,-64,31,25,col);wave(c,g,t);eyes(c,-65,12);for(const [x,y]of [[-19,-75],[15,-46],[0,-80]])poly(c,[[x-4,y-3],[x+5,y],[x-2,y+6]],'#438e7c');smile(c);
}else if(id==='eevee'){
 for(const side of [-1,1]){oval(c,side*21,-94,10,30,col);oval(c,side*22,-98,5,20,'#59443e');}
 oval(c,-30,-29,17,25,col);oval(c,-36,-43,10,11,'#ffe5b5');oval(c,0,-26,22,27,col);
 poly(c,[[-25,-40],[-16,-21],[-9,-30],[0,-17],[9,-30],[19,-22],[26,-40]],'#ffe5b5');
 oval(c,0,-67,28,25,col);wave(c,g,t);eyes(c);smile(c);
}else{
 if(id==='bunny'){for(const side of [-1,1]){oval(c,side*15,-106,11,35,col);oval(c,side*15,-107,5,26,'#eaa8bc');}}
 oval(c,0,-28,id==='bunny'?31:27,31,col);wave(c,g,t);
 if(id==='clown'){for(const side of [-1,1])oval(c,side*29,-70,14,17,'#eb7847');}
 oval(c,0,-66,27,27,id==='bunny'?col:'#f6d0ae');eyes(c);
 if(id==='santa'){
 poly(c,[[-28,-80],[0,-113],[29,-86],[35,-70]],col);box(c,-28,-85,56,10,5,'#fff8ec');oval(c,35,-73,8,8,'#fff8ec');
 poly(c,[[-24,-59],[-21,-40],[0,-27],[23,-44],[24,-59],[10,-49],[0,-55],[-10,-49]],'#fff9ee');
 box(c,-27,-22,54,8,2,'#413e48');box(c,-7,-24,14,12,2,'#ffcf63');box(c,-3,-21,6,6,1,'#413e48');
 }else if(id==='clown'){oval(c,0,-57,7,7,'#f14c65');poly(c,[[-23,-90],[0,-126],[23,-90]],'#48bfc8');oval(c,0,-126,6,6,'#ffe088');for(const y of [-35,-20,-8])oval(c,0,y,4,4,'#ffe185');smile(c,-45);}
 else{oval(c,0,-54,5,4,'#e998b2');smile(c,-45);oval(c,0,-26,16,22,'#f5c6d5');poly(c,[[-14,-44],[0,-38],[-14,-31]],'#72beaa');poly(c,[[14,-44],[0,-38],[14,-31]],'#72beaa');}
}
}
const V=SK.TownSurprises={
 guests,
 eligible(save){return !!save?.wardrobe?.includes('jacket-pikachu');},
 create(random=Math.random){return{wait:18+random()*20,active:null,queue:[],random};},
 update(s,dt,camera,buildings,save){
  if(!V.eligible(save)){s.active=null;s.queue=[];s.wait=18;return;}
  if(s.active){s.active.age+=dt;if(s.active.age>=2){s.active=null;s.wait=25+s.random()*25;}return;}
  s.wait-=dt;if(s.wait>0)return;
  const spots=[];
  for(const b of buildings)if(b.id!=='debug')for(const side of [-1,1]){
   const edge=b.x+(side>0?b.w:0),px=edge+side*55;
   if(px<camera+65||px>camera+1215||Math.abs(px-627)<75)continue;
   if(buildings.some(o=>o!==b&&px>o.x-45&&px<o.x+o.w+45))continue;
   spots.push({b,side,edge});
  }
  if(!spots.length){s.wait=1;return;}
  if(!s.queue.length){s.queue=guests.map((_,i)=>i);for(let i=s.queue.length-1;i>0;i--){const j=Math.floor(s.random()*(i+1));[s.queue[i],s.queue[j]]=[s.queue[j],s.queue[i]];}}
  const spot=spots[Math.floor(s.random()*spots.length)];
  s.active={...spot,guest:guests[s.queue.pop()],age:0,announced:false};
 },
 drawGuest(c,a,t){
  if(!a)return;
  const ease=Math.max(0,Math.min(1,a.age/.24,(2-a.age)/.24)),s=a.guest.id==='bunny'?1.16:.90;
  c.save();c.translate(a.edge+a.side*(-17+ease*57),a.b.y-9);c.scale(s,s);c.rotate(a.side*.09);visitor(c,a.guest,t);c.restore();
 },
 drawGreeting(c,a,camera){
  if(!a||a.age<.3||a.age>1.85)return;
  const x=Math.max(camera+78,Math.min(camera+1202,a.edge+a.side*43)),y=a.b.y-(a.guest.id==='bunny'?190:145);
  const text=a.guest.id==='clown'?'Allô !':a.guest.id==='santa'?'Ho ho ho !':'Coucou !';
  c.save();box(c,x-58,y,116,29,12,'#fff8e5');poly(c,[[x-6,y+26],[x+4,y+39],[x+8,y+26]],'#fff8e5');c.fillStyle='#425c6b';c.font='bold 18px Trebuchet MS';c.textAlign='center';c.fillText(text,x,y+21);c.restore();
 },
 drawVisitor:visitor,
 hitSanta(x,y){const p=V.santaPosition;return !!p&&x>=p.x-39&&x<=p.x+17&&y>=p.y-40&&y<=p.y+23;},
 greetSanta(t){if(t<(V.santaGreetingUntil||0))return false;V.santaGreetingUntil=t+4;SK.Audio.santaGreeting();return true;},
 sky(c,t){
  // One quiet pass every 45 seconds, high above the buildings.
  const phase=(t%45)/45,x=-200+phase*1680,y=68+Math.sin(phase*TAU)*16;
  V.santaPosition={x,y};
  c.save();c.translate(x,y);c.scale(.48,.48);
  for(let i=0;i<4;i++){const dx=95+i*77,dy=-8+Math.sin(t*5+i)*4;
   line(c,[[10,-4],[dx,dy+5]],'#d9bd83',1.5);oval(c,dx,dy,19,10,'#92704f');oval(c,dx+17,dy-14,9,12,'#92704f');
   for(const side of [-1,1]){line(c,[[dx+16,dy-22],[dx+17+side*10,dy-36],[dx+25+side*10,dy-38]],'#785d46',2);line(c,[[dx+side*11,dy+5],[dx+side*18,dy+15+Math.sin(t*7+i)*4]],'#785d46',3);}
   if(i===3)oval(c,dx+24,dy-13,4,3,'#ee6b56');
  }
  box(c,-55,-9,62,30,10,'#b6404b');line(c,[[-65,28],[11,28],[22,17]],'#e9cc82',5);line(c,[[-44,21],[-48,27]],'#e9cc82',3);
  oval(c,-20,-23,12,15,'#d84e50');oval(c,-17,-42,9,9,'#f2cfac');poly(c,[[-27,-47],[-17,-62],[-5,-47]],'#d84e50');line(c,[[-26,-47],[-7,-47]],'#fff5e8',4);oval(c,-17,-36,8,7,'#fff5e8');
  box(c,-51,-32,17,20,3,'#72a998');line(c,[[-43,-32],[-43,-12]],'#f1d185',3);
  for(let i=0;i<7;i++)oval(c,-77-i*19,12+Math.sin(i+t)*5,2,2,'#fff4c9');
  c.restore();
  if(t<(V.santaGreetingUntil||0)){
   const bx=Math.max(12,Math.min(1280-310,x-150)),by=y+30;
   c.save();c.shadowColor='#172c4b55';c.shadowBlur=8;box(c,bx,by,298,43,15,'#fff5d9');c.shadowBlur=0;c.strokeStyle='#d7ad52';c.lineWidth=2;c.stroke();c.fillStyle='#9b343d';c.font='bold 20px Trebuchet MS';c.textAlign='center';c.fillText('Ho ho ho ! Joyeux Noël !',bx+149,by+28);c.restore();
  }
 },
 architecture(c,b,t){
  if(['debug','ecole','look','gym'].includes(b.id))return; // These facades include their own lights, snow and planters.
  const {x,y,w,h}=b,top=y-h;
  c.save();
  // Shallow edge highlights, a shaded foundation, warm porch lights.
  box(c,x+2,top+24,5,h-35,2,'#fff4d02d');box(c,x+w-7,top+24,5,h-35,2,'#253b4933');
  for(const side of [0,1]){const lx=x+(side?w-20:20),ly=y-135;
   const g=c.createRadialGradient(lx,ly,2,lx,ly,31);g.addColorStop(0,'#ffdb754d');g.addColorStop(1,'#ffdb7500');oval(c,lx,ly,31,35,g);
   line(c,[[lx,ly-16],[lx,ly-25],[lx+8,ly-25]],'#344b52',3);box(c,lx-6,ly-12,12,20,3,'#40575d');box(c,lx-4,ly-10,8,14,1,'#ffe3a0');poly(c,[[lx-9,ly-12],[lx,ly-20],[lx+9,ly-12]],'#344b52');
  }
  const gy=top+17;
  c.strokeStyle='#325d52';c.lineWidth=4;c.beginPath();c.moveTo(x+12,gy);c.quadraticCurveTo(x+w*.5,gy+35,x+w-12,gy);c.stroke();
  for(let i=0;i<13;i++){const q=i/12,lx=x+12+(w-24)*q,ly=gy+70*q*(1-q);oval(c,lx,ly+4,3.2,4,['#f3ca70','#ed8c8c','#9ae0c1'][i%3]);}
  // Snowy planters and an address plaque; doors remain clear.
  for(const px of [x+26,x+w-28]){box(c,px-16,y-24,32,25,4,'#966344');line(c,[[px-15,y-20],[px+15,y-20]],'#c18c61',2);for(let j=0;j<5;j++)poly(c,[[px+(j-2)*7,y-20],[px+(j-2)*7-9,y-51-j%2*14],[px+(j-2)*7+8,y-35]],'#477866');oval(c,px,y-25,18,4,'#fbffff');for(const dx of [-8,6])oval(c,px+dx,y-29,2,2,'#d96766');}
  box(c,x+9,top+h*.54,28,19,4,'#526b76');c.fillStyle='#ffe6ad';c.font='bold 11px Trebuchet MS';c.textAlign='center';c.fillText(String(12+SK.Town.STREET.indexOf(b)*2),x+23,top+h*.54+13);
  c.restore();
 },
 background(c,t,camera){
  // Small groups walk along the distant tree line, behind all houses.
  for(let group=0;group<5;group++){
   const phase=t*.075+group*1.7,dir=Math.cos(phase)>=0?1:-1,center=550+group*940+Math.sin(phase)*230;
   for(let i=0;i<5;i++){
    const x=center-i*24*dir,y=375+group%2*9+Math.sin(t*7+i)*1.3;
    if(x<camera-25||x>camera+1305)continue;
    c.save();c.translate(x-camera,y);c.scale(dir*.40,.40);c.rotate(Math.sin(t*7+i)*.07);
    oval(c,0,2,15,4,'#9cb6c366');
    for(const side of [-1,1])oval(c,side*7+Math.sin(t*7+i+side)*2,-1,5,2.5,'#d9a24a');
    oval(c,0,-20,13,21,'#3b5664');oval(c,2,-17,8,16,'#f2f8f6');oval(c,1,-41,11,12,'#3b5664');
    oval(c,5,-43,4,5,'#fff');oval(c,6,-43,1.5,2,'#263b49');poly(c,[[9,-39],[17,-36],[9,-34]],'#e8b85b');
    line(c,[[-10,-29],[-16,-17+Math.sin(t*7+i)*4]],'#304b5a',4);c.restore();
   }
  }
 },
 decor(c,t,camera){
  for(const x of [1450,2360,3220,4500]){
   if(x<camera-180||x>camera+1400)continue;
   c.save();c.translate(x,550);
   for(const [px,py,col]of [[0,-24,'#8f78b2'],[26,-37,'#57a6a3']]){box(c,px,py,25,-py,3,col);box(c,px+10,py,5,-py,1,'#ffe2a0');line(c,[[px+3,py+7],[px+22,py+7]],'#ffe2a0',3);oval(c,px+12,py-2,15,4,'#f4fbff');}
   c.restore();
  }
  // Gentle ground detail rather than a flat, empty snowfield.
  for(let i=0;i<50;i++){const x=i*101+23;if(x<camera-20||x>camera+1300)continue;oval(c,x,653+Math.sin(i*4)*14,3,6,'#b5ced94d');oval(c,x+9,663+Math.sin(i*4)*14,3,6,'#b5ced94d');}
 }
};
})(window.SK);
