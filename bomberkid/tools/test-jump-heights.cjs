const assert=require('node:assert/strict'),BK=require('./headless');
for(const source of [0,2])for(const raised of [0,1])for(const run of [false,true])for(const kind of ['trampoline','bomb']) {
 const props={'2,1':{lv:source,deco:'trampoline'},'3,1':{lv:source+raised},'4,1':{lv:source},'5,1':{lv:source}};
 const W=new BK.World({map:['........','.."#....','........'],props,theme:'garden',mode:'adventure',explore:true});
 const p=W.addPlayer(BK.charById('adam'),2,1);p.bombjump=true;p.dir=3;p.running=run;
 if(kind==='trampoline')W.trampolineJump(p,2,1);
 else {p.bombjump=true;p.zOff=.55;W.leap(p,3);}
 assert(raised?p.air.x1<3:p.air.x1>4,`${kind}: bloc à +${raised}, départ étage ${source}`);
 const end=p.air.x1;
 for(let n=0;n<120&&p.air;n++) {W.updateAir(p,1/60);if(raised)assert(p.x<3,'ne traverse pas le mur surélevé');}
 assert.equal(p.x,end);
}
// Un plateau de deux étages sur le trajet bloque le saut même si l'arrivée est au sol.
{
 const W=new BK.World({map:['.......','.."....','.......'],props:{'2,1':{deco:'trampoline'},'3,1':{lv:2}},theme:'garden',mode:'adventure',explore:true});
 const p=W.addPlayer(BK.charById('adam'),2,1);p.bombjump=true;p.dir=3;W.trampolineJump(p,2,1);assert.equal(p.air.x1,2.5);
}
console.log('Sauts : un bloc franchissable, bloc surélevé et plateau de deux étages bloquants, bombe et trampoline OK.');
// Un départ élevé prolonge le vol au-dessus d'un terrain plus bas, dans les quatre sens.
for (const dir of [0,1,2,3]) {
 let previous=2;
 for (const lv of [.5,1,2,3,4,5]) {
  const W=new BK.World({map:Array(19).fill('.'.repeat(19)),props:{'9,9':{lv}},theme:'garden',mode:'adventure',explore:true});
  const p=W.addPlayer(BK.charById('adam'),9,9);p.bombjump=true;p.zOff=.55;W.leap(p,dir);
  const a={...p.air},range=Math.hypot(a.x1-a.x0,a.y1-a.y0);
  assert(range>previous,`étage ${lv}, direction ${dir}: portée croissante`);previous=range;
  assert(a.dur>.5);assert(a.gravity);
  for(let n=0;n<240&&p.air;n++){
   W.updateAir(p,1/120);
   if(p.air)assert(p.zOff>=-.001,'le vol ne traverse pas le terrain');
  }
  assert.equal(p.x,a.x1);assert.equal(p.y,a.y1);assert.equal(p.air,null);
 }
}
// Deux cases d'eau : depuis l'étage 3, on rejoint la rive au lieu de tomber à deux cases.
{
 const W=new BK.World({map:['.........','...~~....','.........'],props:{'2,1':{lv:3}},theme:'garden',mode:'adventure',explore:true});
 const p=W.addPlayer(BK.charById('adam'),2,1);p.bombjump=true;p.zOff=.55;W.leap(p,3);
 assert(p.air.x1>=5 && p.air.x1<6,'atteint la rive');
}
// Même altitude : toujours deux cases, même au sommet. Un mur au-delà du saut normal bloque l'extension.
for(const wall of [false,true]) {
 const W=new BK.World({map:['.........',wall?'.....#...':'.........','.........'],props:wall?{'2,1':{lv:5},'5,1':{lv:5}}:{'2,1':{lv:5},'3,1':{lv:5},'4,1':{lv:5}},theme:'garden',mode:'adventure',explore:true});
 const p=W.addPlayer(BK.charById('adam'),2,1);p.bombjump=true;p.zOff=.55;W.leap(p,3);assert.equal(p.air.x1,4.5);
}
console.log('Bombe : portée progressive des demi-étages à 5, quatre directions, rive après deux cases d’eau, terrain plat et mur OK.');
