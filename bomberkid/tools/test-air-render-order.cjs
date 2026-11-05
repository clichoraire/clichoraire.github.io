const assert=require('node:assert/strict'),BK=require('./headless');
const ctx=new Proxy({}, {get:(o,k)=>k in o?o[k]:k==='measureText'?()=>({width:10}):/create.*Gradient/.test(k)?()=>({addColorStop(){}}):()=>{},set:(o,k,v)=>(o[k]=v,true)});
for(const dir of [0,1,2,3]) {
 const D=BK.DIRS[dir],c=4,r=4,start={c:c-D.dx,r:r-D.dy},props={};
 const map=Array.from({length:9},()=>Array(9).fill('.'));map[r][c]='#';map[start.r][start.c]='"';
 props[c+','+r]={lv:1};props[start.c+','+start.r]={lv:1,deco:'trampoline'};props[(c+D.dx)+','+(r+D.dy)]={lv:1};
 const W=new BK.World({map:map.map(a=>a.join('')),props,theme:'garden',mode:'adventure',explore:true});
 const p=W.addPlayer(BK.charById('adam'),start.c,start.r);p.dir=dir;
 W.trampolineJump(p,start.c,start.r);assert(p.air);W.updateAir(p,p.air.dur*.5);
 assert(Math.abs(p.x-c-.5)<.001&&Math.abs(p.y-r-.5)<.001);
 assert(W.groundZ(p.x,p.y)+p.zOff>W.hAt(c,r)+.85);
 const cam=new BK.Camera(1280,720);cam.fit(9,9,{});
 const originalCube=BK.draw3d.cube,originalCharacter=BK.sprites.drawCharacter;let order=[];
 BK.draw3d.cube=function(ctx,cam,x0,y0,x1,y1,h,...args){if(Math.floor(x0)===c&&Math.floor(y0)===r&&h===.85)order.push('block');return originalCube(ctx,cam,x0,y0,x1,y1,h,...args);};
 BK.sprites.drawCharacter=function(...args){order.push('player');return originalCharacter(...args);};
 try {
  W.render(ctx,cam,{});assert(order.indexOf('block')<order.indexOf('player'),'héros dessiné au-dessus du bloc pendant le saut');
  // Sous le sommet, on conserve l'occlusion normale du mur.
  p.zOff=.1;order=[];W.render(ctx,cam,{});
  assert(order.indexOf('player')<order.indexOf('block'),'le bloc cache encore le héros trop bas');
  p.air=null;p.zOff=0;assert.equal(W.playerDrawDepth(p),p.y,'ordre normal après atterrissage');
 }finally{BK.draw3d.cube=originalCube;BK.sprites.drawCharacter=originalCharacter;}
}
console.log('Rendu des sauts : trampoline, bloc de ciment surélevé, 4 sens ; héros au-dessus du sommet et occlusion conservée en dessous OK.');
