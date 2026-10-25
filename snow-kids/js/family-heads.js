// Visages cartoon inspirés des photos de famille, partagés par les deux jeux.
(function(root){
  'use strict';
  const frames=new Map();
  const F=root.FamilyHeads={has:id=>frames.has(id)};
  F.ready=Promise.all(Object.entries(root.FAMILY_HEAD_SOURCES||{}).map(([id,src])=>new Promise(resolve=>{
    const img=new Image();img.onload=()=>{const views=[];
      for(let view=0;view<3;view++){
        const cw=Math.floor(img.width/3),c=document.createElement('canvas');c.width=cw;c.height=img.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,view*cw,0,cw,img.height,0,0,cw,img.height);
        const d=ctx.getImageData(0,0,cw,c.height).data;let l=cw,r=0,t=c.height,b=0;
        for(let y=0;y<c.height;y++)for(let x=0;x<cw;x++)if(d[(y*cw+x)*4+3]>30){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
        const out=document.createElement('canvas');out.height=256;out.width=Math.max(1,Math.round((r-l+1)*256/(b-t+1)));out.getContext('2d').drawImage(c,l,t,r-l+1,b-t+1,0,0,out.width,256);views.push(out);
      }frames.set(id,views);resolve();};img.onerror=()=>{console.warn('Portrait indisponible : '+id);resolve();};img.src=src;
  })));
  F.frame=(id,view='front')=>frames.get(id)?.[{front:0,side:1,back:2}[view]??0];
  F.draw=function(ctx,id,view,x,y,w,h){const img=F.frame(id,view);if(!img)return false;const ratio=Math.min(w/img.width,h/img.height),dw=img.width*ratio,dh=img.height*ratio;ctx.drawImage(img,x+(w-dw)/2,y+h-dh,dw,dh);return true;};
})(window);
