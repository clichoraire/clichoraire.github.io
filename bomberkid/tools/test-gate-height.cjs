const assert=require('node:assert/strict'),BK=require('./headless');
const ctx=new Proxy({}, {get:(o,k)=>k in o?o[k]:k==='measureText'?()=>({width:10}):/create.*Gradient/.test(k)?()=>({addColorStop(){}}):()=>{},set:(o,k,v)=>(o[k]=v,true)});
for(const lv of [0,.5,1,3,5])for(const bridge of [false,true]){
 const map=Array.from({length:9},()=>Array(9).fill(bridge?'~':'.'));
 map[4][4]='a';map[2][2]='A';
 const W=new BK.World({map:map.map(row=>row.join('')),props:{'4,4':{lv},'2,2':{lv}},theme:'garden',mode:'adventure',explore:true});
 assert.equal(W.special.get('4,4').bridge,bridge);
 assert(Math.abs(W.hAt(4,4)-lv*.6)<1e-6);
 const cam=new BK.Camera(1280,720);cam.fit(9,9,{});
 const cube=BK.draw3d.cube;let drawn=false;
 BK.draw3d.cube=function(ctx,cam,x0,y0,x1,y1,h,colors,opts){
  if(Math.floor(x0)===4&&Math.floor(y0)===4&&h===(bridge?1.1:1)){
   drawn=true;assert.equal(opts.z,W.hAt(4,4),'corps de porte à la hauteur du sol');
  }
  return cube.call(this,ctx,cam,x0,y0,x1,y1,h,colors,opts);
 };
 try{W.render(ctx,cam,{});assert(drawn);}finally{BK.draw3d.cube=cube;}
 assert(W.blocked(4,4));W.hitTarget('A');assert.equal(W.cell(4,4),0);assert(Math.abs(W.hAt(4,4)-lv*.6)<1e-6);
 assert(W.walkableTerrain(4,4),'sol conservé après ouverture');
}
console.log('Portes : rendu à la bonne hauteur de 0 à 5, demi-étage, pont-levis et ouverture par cible OK.');
