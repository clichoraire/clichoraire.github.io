/* Only visible equipment is decoded. A small LRU bounds memory on laptops. */
(function(root){
const cache=new Map(),MAX_CACHE=8;
function entry(id){if(cache.has(id)){const e=cache.get(id);cache.delete(id);cache.set(id,e);return e;}const image=new Image(),e={image,ready:null};e.ready=new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false);});image.src=GGWings.get(id).asset;cache.set(id,e);while(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value);return e;}
function loaded(id){if(id===16)return GGDelta.loaded;return id>0&&entry(id).image.complete&&entry(id).image.naturalWidth>0;}
function draw(ctx,id,age=1,time=0,reduced=false){if(id===16)return GGDelta.draw(ctx,age,time,reduced);if(!loaded(id))return false;const im=entry(id).image,w=im.naturalWidth,h=im.naturalHeight;ctx.save();if(!reduced){ctx.translate(0,Math.sin(time*3)*1.3);ctx.rotate(Math.sin(time*2.6)*.012);}
 if(id>=17&&id<=20){GGDelta.draw(ctx,age,time,reduced,im);}
 else{const meta=root.GGWingAnchors?.[id]||{x:.43,y:.78,width:.49},k=143*(meta.scale||1)/(w*meta.width);ctx.drawImage(im,-w*meta.x*k,-h*meta.y*k,w*k,h*k);}
 ctx.restore();return true;}
async function paintPreview(canvas,id){if(!id)return;if(id===16)await GGDelta.ready;else await entry(id).ready;if(!canvas.isConnected)return;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);if(id===16){GGDelta.icon(c,canvas.width/2,canvas.height/2,canvas.width*.9);return;}const im=entry(id).image;if(!im.naturalWidth)return;let sx=0,sy=0,w=im.naturalWidth,h=im.naturalHeight;if(id>=17&&id<=20){w/=2;h/=2;sx=w;sy=h;}const k=Math.min((canvas.width-12)/w,(canvas.height-12)/h);c.drawImage(im,sx,sy,w,h,(canvas.width-w*k)/2,(canvas.height-h*k)/2,w*k,h*k);}
function preview(ctx,id,time=0){if(!loaded(id))return false;if(id>=16&&id<=20){ctx.save();ctx.translate(280,230);ctx.scale(1.7,1.7);draw(ctx,id,time%3,time);ctx.restore();return true;}const im=entry(id).image,w=im.naturalWidth,h=im.naturalHeight,k=Math.min(480/w,330/h);ctx.save();ctx.translate(300,180);ctx.rotate(Math.sin(time*2)*.015);ctx.drawImage(im,-w*k/2,-h*k/2,w*k,h*k);ctx.restore();return true;}
function bounds(id){if((id>=16&&id<=20)||!loaded(id))return null;const im=entry(id).image,w=im.naturalWidth,h=im.naturalHeight,meta=root.GGWingAnchors?.[id]||{x:.43,y:.78,width:.49},k=143*(meta.scale||1)/(w*meta.width);return {left:w*meta.x*k,right:w*(1-meta.x)*k,up:h*meta.y*k,down:h*(1-meta.y)*k};}
function headroom(id){if(id>=16&&id<=20)return 180;if(!loaded(id))return 180;const im=entry(id).image,m=root.GGWingAnchors?.[id]||{y:.78,width:.49};return Math.min(400,Math.max(180,m.y*im.naturalHeight*143*(m.scale||1)/(im.naturalWidth*m.width)+70));}
root.GGWingArt={bounds,loaded,draw,paintPreview,preview,headroom,preload:id=>id===16?GGDelta.ready:id>0?entry(id).ready:Promise.resolve(true)};
})(window);
