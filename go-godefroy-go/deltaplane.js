/* Registered illustrated reach -> grip poses; same anchor and scale in every cell. */
(function(root){
const image=new Image();image.src='assets/godefroy-deltaplane.png';
const ready=new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false);});
const cw=768,ch=512,k=.30,ax=330,ay=335;
let blend=null;
function frame(age){return age<.14?0:age<.28?1:2;}
function draw(ctx,age=1,time=0,reduced=false,source=image){if(!source.complete||!source.naturalWidth)return false;
 const progress=reduced?2:Math.max(0,Math.min(2,age/.14)),a=Math.floor(progress),b=Math.min(2,a+1),t=progress-a;
 if(!blend){blend=document.createElement('canvas');blend.width=cw;blend.height=ch;}
 const c=blend.getContext('2d');c.clearRect(0,0,cw,ch);c.globalCompositeOperation='lighter';
 c.globalAlpha=1-t;c.drawImage(source,(a%2)*cw,Math.floor(a/2)*ch,cw,ch,0,0,cw,ch);
 if(t){c.globalAlpha=t;c.drawImage(source,(b%2)*cw,Math.floor(b/2)*ch,cw,ch,0,0,cw,ch);}c.globalAlpha=1;c.globalCompositeOperation='source-over';
 ctx.save();if(!reduced)ctx.rotate(Math.sin(time*3)*.009);ctx.drawImage(blend,-ax*k,-ay*k,cw*k,ch*k);ctx.restore();return true;
}
function icon(ctx,x,y,width=220){if(!image.complete||!image.naturalWidth)return false;const h=width*ch/cw;ctx.drawImage(image,cw,ch,cw,ch,x-width/2,y-h/2,width,h);return true;}
root.GGDelta={ready,draw,icon,frame,get loaded(){return image.complete&&image.naturalWidth>0;}};
})(window);
