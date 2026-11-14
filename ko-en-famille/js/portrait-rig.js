// Pure local portrait rigging. Shared by the creation server and browser renderers.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PortraitRig=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const VIEWS=['front','side','back'];
const fallback={cx:.5,width:.82,crown:.025,brim:.34,drop:.12,confidence:0,source:'automatic-local'};
function validate(p){const out={};for(const [k,a,b] of [['cx',.15,.85],['width',.35,1.15],['crown',-.2,.35],['brim',.15,.7],['drop',0,.25]]){if(!Number.isFinite(p?.[k])||p[k]<a||p[k]>b)throw Error('Repère invalide : '+k);out[k]=p[k];}if(out.crown>=out.brim-.08)throw Error('Sommet du crâne incohérent.');return out;}
function validatePackage(value){if(value?.version!==1||value.space!=='trimmed-portrait'||! /^[a-f0-9]{64}$/.test(value.imageSha256||''))throw Error('Format de repères invalide.');return {version:1,space:value.space,imageSha256:value.imageSha256,source:'automatic-local',algorithm:value.algorithm,views:Object.fromEntries(VIEWS.map(v=>[v,validate(value.views?.[v])]))};}
function estimate(pixels,view='front'){
 const aspect=pixels.width/pixels.height,data=new Uint8ClampedArray(160*192*4);
 // Fixed grid makes the result independent of game display size and browser Canvas.
 for(let y=0;y<192;y++)for(let x=0;x<160;x++){const sx=Math.min(pixels.width-1,Math.floor((x+.5)*pixels.width/160)),sy=Math.min(pixels.height-1,Math.floor((y+.5)*pixels.height/192)),from=(sy*pixels.width+sx)*4;data.set(pixels.data.subarray(from,from+4),(y*160+x)*4);}
 const samples=[];
 for(let y=80;y<150;y++)for(let x=48;x<112;x++){const i=(y*160+x)*4,r=data[i],g=data[i+1],b=data[i+2];if(data[i+3]>180&&r>65&&r>g*1.09&&g>b*1.08&&r-b>24)samples.push([r,g,b]);}
 samples.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
 const skinTone=samples.length>30?samples[Math.floor(samples.length*.72)]:[210,150,100];
 const rows=[];
 // Broad chroma range; require a large connected horizontal face interval, not individual hair highlights.
 for(let y=34;y<150;y++){let best=null,start=-1,gaps=0;for(let x=16;x<145;x++){const i=(y*160+x)*4,r=data[i],gg=data[i+1],b=data[i+2];const skin=data[i+3]>180&&r>skinTone[0]*.78&&gg>skinTone[1]*.76&&r>gg*1.09&&gg>b*1.08&&r-b>24&&r-gg<115;
 if(skin){if(start<0)start=x;gaps=0;}else gaps++;if((gaps>3||x===144)&&start>=0){const end=x-gaps,len=end-start;if(len>30&&(!best||len>best.width))best={left:start/160,right:end/160,width:len/160,y:y/192};start=-1;gaps=0;}}
 if(best&&best.left<.62&&best.right>.38)rows.push(best);
 }
 let result={...fallback};
 if(rows.length>16&&view!=='back'){
  const widths=rows.map(r=>r.width).sort((a,b)=>a-b),q=widths[Math.floor(widths.length*.85)];
  const broad=rows.filter(r=>r.width>=q*.87&&r.y<.66);
  if(broad.length>5){const middle=broad[Math.floor(broad.length/2)],first=broad[0];const width=clamp(q*1.30,.72,.98),brim=clamp(first.y-.10,.30,.44);
   result={cx:clamp((middle.left+middle.right)/2,.32,.68),width,crown:clamp(brim-width*(aspect)*.52,-.06,.12),brim,drop:clamp(width*(aspect)*.15,.065,.16),confidence:Math.min(.85,rows.length/90),source:'estimated'};
  }
 }
 return {...result,source:'automatic-local'};
}
function createViews(crops){const front=estimate(crops.front),out={front:validate(front)};
 for(const view of ['side','back']){const im=crops[view],p={...front,cx:.5};p.width=clamp(front.width*crops.front.width/crops.front.height/(im.width/im.height),.65,1);p.brim=clamp(front.brim,.25,.46);out[view]=validate(p);}return out;
}
return {version:1,algorithm:'local-skull-v1',VIEWS,validate,validatePackage,estimate,createViews};
});
