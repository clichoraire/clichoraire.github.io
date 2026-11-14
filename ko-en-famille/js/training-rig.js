// Pièces illustrées, articulations à deux segments et pneu projeté en continu.
(function(root){
'use strict';
const R=root.TrainingRig={},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>{t=clamp(t);return t*t*(3-2*t);};
let parts=[],tireImage;
R.ready=Promise.all(Object.entries(root.TRAINING_RIG_SOURCES||{}).map(([key,src])=>new Promise(resolve=>{
 const image=new Image();image.onload=()=>{
  if(key==='tire'){tireImage=image;resolve();return;}
  const cw=image.width/4,ch=image.height/3;
  for(let i=0;i<12;i++){
   const cell=document.createElement('canvas'),left=Math.round((i%4)*cw),top=Math.round(Math.floor(i/4)*ch);
   cell.width=Math.round((i%4+1)*cw)-left;cell.height=Math.round((Math.floor(i/4)+1)*ch)-top;const width=cell.width,height=cell.height;
   const g=cell.getContext('2d',{willReadFrequently:true});g.drawImage(image,left,top,width,height,0,0,width,height);
   const pixels=g.getImageData(0,0,width,height).data;let x0=width,y0=height,x1=0,y1=0;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>64){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
   const trimmed=document.createElement('canvas');trimmed.width=x1-x0+1;trimmed.height=y1-y0+1;trimmed.getContext('2d').drawImage(cell,x0,y0,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);parts.push(trimmed);
  }
  resolve();
 };image.onerror=()=>resolve();image.src=src;
})));
R.available=()=>parts.length===12&&!!tireImage;
// Point intermédiaire avec longueurs fixes : les mains restent sur le pneu.
R.joint=(a,b,l1,l2,side=1)=>{
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.001,Math.hypot(dx,dy));
 const reach=clamp(d,Math.abs(l1-l2)+.001,l1+l2-.001),along=(l1*l1-l2*l2+reach*reach)/(2*reach),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 return {x:a.x+dx/d*along-dy/d*height*side,y:a.y+dy/d*along+dx/d*height*side};
};
R.pose=(charge,success=0)=>{
 const lifting=clamp(charge),fall=ease(success/.72),theta=mix(.04+lifting*1.34,Math.PI,fall),r=105,depth=52;
 const normal={x:Math.sin(theta)*.4,y:-Math.cos(theta)*.5};
 const center={x:950-r*Math.cos(theta),y:630-Math.hypot(r*Math.sin(theta),r*.18)-Math.max(0,normal.y*depth)};
 const grip={x:center.x-r*Math.cos(theta)+normal.x*depth,y:center.y-r*Math.sin(theta)+normal.y*depth};
 const release=ease(success/.2),settle=ease((success-.55)/.35);
 const hip={x:700+lifting*60-settle*20,y:552-lifting*42};
 const shoulder={x:hip.x+50+lifting*5-settle*35,y:hip.y-74-lifting*11};
 const hand={x:mix(grip.x,shoulder.x+30,release),y:mix(grip.y,shoulder.y+65,release)};
 const feet=[{x:690,y:628},{x:770,y:628}];
 const knees=feet.map(foot=>R.joint(hip,foot,70,70,-1));
 const elbow=R.joint(shoulder,hand,62,62,1);
 return {theta,normal,center,grip,hand,hip,shoulder,feet,knees,elbow,release,r,depth};
};
function piece(c,id,x,y,width,height){const image=parts[id];c.drawImage(image,x,y,width,height);}
function bone(c,id,a,b,width){const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);piece(c,id,-width/2,-width*.25,width,length+width*.5);c.restore();}
function drawWheel(c,p){
 const {theta,center,normal,r,depth}=p;
 c.fillStyle='#0005';c.beginPath();c.ellipse(center.x,635,140,17,0,0,Math.PI*2);c.fill();
 // Faces parallèles espacées par l’épaisseur du caoutchouc, même projection à chaque image.
 for(let z=0;z<=depth;z+=4){c.save();c.translate(center.x+normal.x*z,center.y+normal.y*z);c.transform(Math.cos(theta),Math.sin(theta),.75,-.18,0,0);c.drawImage(tireImage,-r,-r,r*2,r*2);c.restore();}
}
R.draw=(c,ch,charge,success=0)=>{
 if(!R.available())return null;
 const p=R.pose(charge,success),torso=Math.max(0,root.BX.KIDS.indexOf(ch.id));
 c.save();c.translate(850,630);c.scale(1.2,1.2);c.translate(-850,-630);
 if(root.BX.KIDS.includes(ch.id)&&root.BX.familyBody){root.BX.familyBody.equipment(c,ch,p.shoulder.x-12,p.shoulder.y+36,.62,{view:'side',rotation:.4-charge*.2,still:true,hands:[{x:p.hand.x+5,y:p.hand.y-3},p.hand],feet:p.feet});drawWheel(c,p);c.restore();return p;}
 // Jambe et bras arrière, torse, tête, puis bras avant et main sur la surface.
 for(let i=0;i<2;i++){c.save();if(!i)c.filter="brightness(.85)";bone(c,9,p.hip,p.knees[i],38);bone(c,10,p.knees[i],p.feet[i],28);piece(c,11,p.feet[i].x-20,p.feet[i].y-12,51,24);c.restore();}
 const backShoulder={x:p.shoulder.x+3,y:p.shoulder.y-4},backHand={x:p.hand.x+5,y:p.hand.y-3};
 const backElbow=R.joint(backShoulder,backHand,62,62,1);bone(c,6,backShoulder,backElbow,25);bone(c,7,backElbow,backHand,21);
 const dx=p.hip.x-p.shoulder.x,dy=p.hip.y-p.shoulder.y,len=Math.hypot(dx,dy);
 c.save();c.translate(p.shoulder.x,p.shoulder.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);piece(c,torso,-46,-26,88,len+53);c.restore();
 const head=root.FamilyHeads?.frame(ch.id,'side');if(head){const h=88,w=h*head.width/head.height;c.drawImage(head,p.shoulder.x-w*.38,p.shoulder.y-h+2,w,h);}
 drawWheel(c,p);
 bone(c,6,p.shoulder,p.elbow,34);bone(c,7,p.elbow,p.hand,29);
 for(const hand of [p.hand]){c.save();c.translate(hand.x,hand.y);c.rotate(-.25);piece(c,8,-11,-16,32,29);c.restore();}
 c.restore();return p;
};
})(window);
