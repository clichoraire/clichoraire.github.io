// Transforme l'image brute de l'IA (fond vert uni ou déjà transparent) en trois têtes détourées.
// Fonctions pures sur des pixels RGBA : utilisables dans le navigateur (FamilySheet) et dans Node (tests).
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FamilySheet=factory();})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const clamp=(v,lo,hi)=>v<lo?lo:v>hi?hi:v;
 // Couleur médiane des quatre coins : c'est le fond demandé à l'IA (vert pur), ou transparent (OpenAI, planche déjà détourée).
 function background(img){
  const {width:w,height:h,data:d}=img,m=Math.max(2,Math.round(Math.min(w,h)*.03)),samples=[[],[],[],[]];
  for(const [x0,y0] of [[0,0],[w-m,0],[0,h-m],[w-m,h-m]])for(let y=y0;y<y0+m;y++)for(let x=x0;x<x0+m;x++){const i=(y*w+x)*4;for(let k=0;k<4;k++)samples[k].push(d[i+k]);}
  const [r,g,b,a]=samples.map(s=>s.sort((p,q)=>p-q)[s.length>>1]);return {r,g,b,a};
 }
 // Détourage. Fond à dominante nette (vert) : clé par différence de canal, comme un écran vert.
 // Autre fond uni : clé par distance de couleur. Les bords sont démélangés (c = a·sujet + (1−a)·fond), puis débarrassés du vert.
 function keyOut(img,tolerance=1){
  const bg=background(img),out=new Uint8ClampedArray(img.data),t=clamp(Number(tolerance)||1,.25,3);
  if(bg.a<128)return {data:out,keyed:false,bg};
  const c=[bg.r,bg.g,bg.b],dom=c.indexOf(Math.max(...c)),o1=(dom+1)%3,o2=(dom+2)%3,spillBg=c[dom]-Math.max(c[o1],c[o2]),chroma=spillBg>=80;
  const lo=chroma?.06*t:35*t,hi=chroma?Math.max(lo+.2,1-.2*t):110*t;
  for(let i=0;i<out.length;i+=4){
   let raw;
   if(chroma)raw=1-clamp((out[i+dom]-Math.max(out[i+o1],out[i+o2]))/spillBg,0,1);
   else{const dr=out[i]-bg.r,dg=out[i+1]-bg.g,db=out[i+2]-bg.b;raw=Math.sqrt(dr*dr+dg*dg+db*db);}
   const a=clamp((raw-lo)/(hi-lo),0,1);
   if(a>0&&a<1){for(let k=0;k<3;k++)out[i+k]=clamp((out[i+k]-(1-a)*c[k])/a,0,255);if(chroma)out[i+dom]=Math.min(out[i+dom],Math.max(out[i+o1],out[i+o2]));}
   out[i+3]=Math.round(out[i+3]*a);
  }
  return {data:out,keyed:true,bg};
 }
 // Trouve les trois têtes : colonnes occupées regroupées en trois blocs ; sinon, trois tiers égaux.
 function cells(width,height,data){
  const cols=new Uint16Array(width);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>40)cols[x]++;
  const runs=[];let start=-1;
  for(let x=0;x<=width;x++){const on=x<width&&cols[x]>=3;if(on&&start<0)start=x;if(!on&&start>=0){const last=runs[runs.length-1];if(last&&start-last[1]<=Math.max(2,width*.015))last[1]=x-1;else runs.push([start,x-1]);start=-1;}}
  const big=runs.filter(r=>r[1]-r[0]>=width*.04).sort((p,q)=>(q[1]-q[0])-(p[1]-p[0])).slice(0,3).sort((p,q)=>p[0]-q[0]);
  const spans=big.length===3?big:[0,1,2].map(i=>[Math.floor(i*width/3),Math.floor((i+1)*width/3)-1]);
  return spans.map(([x0,x1])=>{
   let y0=height,y1=-1,left=x1,right=x0;
   for(let y=0;y<height;y++){let count=0;for(let x=x0;x<=x1;x++)if(data[(y*width+x)*4+3]>40){count++;left=Math.min(left,x);right=Math.max(right,x);}if(count>=3){y0=Math.min(y0,y);y1=Math.max(y1,y);}}
   return y1<0?{x0,x1,y0:0,y1:height-1,empty:true}:{x0:left,x1:right,y0,y1,empty:false};
  });
 }
 function process(img,tolerance=1){const {data,keyed,bg}=keyOut(img,tolerance);return {data,keyed,bg,cells:cells(img.width,img.height,data)};}
 return {background,keyOut,cells,process,SHEET:{width:1536,height:1024,cell:512,margin:.06}};
});
