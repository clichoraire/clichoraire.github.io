// Portraits face / profil / dos, intégrés ou issus du catalogue public.
(function(root){'use strict';const frames=new Map();const F=root.FamilyHeads={has:id=>frames.has(id)};
F.add=(id,src)=>new Promise(resolve=>{const img=new Image();img.crossOrigin='anonymous';let settled=false;const done=v=>{if(!settled){settled=true;clearTimeout(timer);resolve(v);}};const timer=setTimeout(()=>done(false),12000);img.onload=()=>{try{const views=[],cw=Math.floor(img.width/3);for(let view=0;view<3;view++){const c=document.createElement('canvas');c.width=cw;c.height=img.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,view*cw,0,cw,img.height,0,0,cw,img.height);const d=ctx.getImageData(0,0,cw,c.height).data;let l=cw,r=0,t=c.height,b=0;for(let y=0;y<c.height;y++)for(let x=0;x<cw;x++)if(d[(y*cw+x)*4+3]>30){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}if(r<l||b<t)return done(false);const out=document.createElement('canvas');out.height=256;out.width=Math.max(1,Math.round((r-l+1)*256/(b-t+1)));out.getContext('2d').drawImage(c,l,t,r-l+1,b-t+1,0,0,out.width,256);views.push(out);}frames.set(id,views);done(true);}catch(e){done(false);}};img.onerror=()=>done(false);img.src=src;});
// Original canvas portraits: three views, permanently masked Ninja.
for(const id of ['shinobin','santa','robot']){
 const views=['front','side','back'].map(view=>{
  const c=document.createElement('canvas');c.width=240;c.height=256;const x=c.getContext('2d');
  x.lineJoin='round';x.lineCap='round';
  const oval=(cx,cy,rx,ry,color)=>{x.fillStyle=color;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);x.fill();};
  const box=(a,b,w,h,r,color)=>{x.fillStyle=color;x.beginPath();x.roundRect(a,b,w,h,r);x.fill();};
  if(id==='shinobin'){
   oval(120,137,87,111,'#131d2b');oval(104,107,65,80,'#25364a');
   box(36,94,168,23,9,'#c93646');
   if(view!=='back'){
    box(view==='side'?123:53,125,view==='side'?76:134,35,12,'#060d19');
    for(const a of view==='side'?[166]:[86,154]){oval(a,143,16,4,'#e9f4fc');oval(a+3,143,4,5,'#4aaac5');}
    x.strokeStyle='#3d5065';x.lineWidth=3;x.beginPath();x.moveTo(65,183);x.quadraticCurveTo(120,204,177,177);x.stroke();
   }else{box(109,93,23,28,8,'#a51d31');x.fillStyle='#c93646';x.beginPath();x.moveTo(120,109);x.lineTo(213,153);x.lineTo(179,161);x.lineTo(119,124);x.fill();}
  }else if(id==='santa'){
   oval(120,151,79,83,'#f4c3a2');
   if(view!=='back'){
    oval(61,168,23,41,'#fff6e5');oval(179,168,23,41,'#fff6e5');oval(120,202,64,48,'#fff6e5');
    for(const a of view==='side'?[162]:[89,151]){oval(a,139,7,9,'#25405b');oval(a-2,136,2,3,'#fff');}
    oval(view==='side'?189:120,162,15,12,'#e6a080');oval(99,178,27,12,'#fff');oval(141,178,27,12,'#fff');
    x.strokeStyle='#e3dacb';x.lineWidth=3;for(const a of [87,111,138,157]){x.beginPath();x.moveTo(a,205);x.lineTo(a-3,229);x.stroke();}
   }else oval(120,176,80,65,'#fff6e5');
   x.fillStyle='#c92d3e';x.beginPath();x.moveTo(40,101);x.quadraticCurveTo(45,16,139,17);x.quadraticCurveTo(201,23,203,77);x.lineTo(168,61);x.lineTo(183,106);x.fill();
   box(35,87,155,34,15,'#fff8e8');oval(203,78,22,23,'#fff8e8');
  }else{
   box(27,102,25,76,9,'#3b536f');box(188,102,25,76,9,'#3b536f');
   const g=x.createLinearGradient(45,40,190,220);g.addColorStop(0,'#e5f4fa');g.addColorStop(.4,'#a2bed0');g.addColorStop(1,'#4c6a86');box(43,54,154,180,30,g);
   x.strokeStyle='#3c566e';x.lineWidth=7;x.beginPath();x.moveTo(120,54);x.lineTo(120,26);x.stroke();oval(120,20,12,12,'#5be4ed');
   if(view!=='back'){
    box(view==='side'?125:59,104,view==='side'?65:122,57,14,'#192f46');
    for(const a of view==='side'?[161]:[87,153]){oval(a,132,13,17,'#63f5ed');oval(a-3,126,4,5,'#eaffff');}
    box(view==='side'?135:86,184,view==='side'?45:68,18,5,'#344e65');
    x.strokeStyle='#bdd8e4';x.lineWidth=3;for(let a=view==='side'?145:98;a<175;a+=14){x.beginPath();x.moveTo(a,187);x.lineTo(a,198);x.stroke();}
   }else{box(70,101,100,85,12,'#607c92');for(let a=113;a<180;a+=15)box(82,a,76,5,2,'#30475c');}
   for(const a of [58,182])for(const b of [78,211])oval(a,b,4,4,'#e9f9ff');
  }return c;
 });frames.set(id,views);
}
F.ready=Promise.all(Object.entries(root.FAMILY_HEAD_SOURCES||{}).map(([id,src])=>F.add(id,src)));
F.frame=(id,view='front')=>frames.get(id)?.[{front:0,side:1,back:2}[view]??0];F.draw=(ctx,id,view,x,y,w,h)=>{const img=F.frame(id,view);if(!img)return false;const ratio=Math.min(w/img.width,h/img.height),dw=img.width*ratio,dh=img.height*ratio;ctx.drawImage(img,x+(w-dw)/2,y+h-dh,dw,dh);return true;};
})(window);
