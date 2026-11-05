// Tous les sols de l'éditeur gardent leur terrain et leur pente après sauvegarde.
const assert = require('node:assert/strict'), BK = require('./headless');
const floors = BK.EDITOR_TABS.find(t => t.id === 'sols').items.filter(it => it.opts === 'floorHeight');
const ctx = new Proxy({}, { get: (o,k) => k in o ? o[k] : k === 'measureText' ? () => ({width:10}) : /create.*Gradient/.test(k) ? () => ({addColorStop(){}}) : () => {}, set:(o,k,v)=>(o[k]=v,true) });
for (const floor of floors) for (const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
  const E = new BK.Editor({name:'Pentes',cols:9,rows:7,theme:'garden',base:'.'});
  E.props['4,3']={lv:2}; E.props[(4+dc)+','+(3+dr)]={lv:3}; E.rebuild();
  E.item=floor; E.floorShape='ramp'; E.paint(4,3,true);
  const d=JSON.parse(JSON.stringify(E.data()));
  const W=new BK.World({map:d.grid,props:d.props,theme:'garden',mode:'adventure',explore:true});
  assert.equal(W.tAt(4,3),BK.terrainForChar(floor.ch),floor.name);
  assert.equal(Math.abs(W.ramp[W.idx(4,3)]),dc?2:1);
  assert(Math.abs(W.groundZ(4.5-dc*.499,3.5-dr*.499)-1.2)<.01);
  assert(Math.abs(W.groundZ(4.5+dc*.499,3.5+dr*.499)-1.8)<.01);
  W.render(ctx,E.cam,{});
  E.floorShape='flat'; E.paint(4,3,true);
  assert.equal(E.world.ramp[E.world.idx(4,3)],0);
  assert.equal(E.world.tAt(4,3),BK.terrainForChar(floor.ch));
}
// Une rampe en bois orientée est-ouest doit avoir une face avant pleine.
{
 const W=new BK.World({map:['.....','../:.','.....'],props:{'2,1':{material:'bois'}},theme:'garden',mode:'adventure',explore:true});
 const cam=new BK.Camera(1280,720); cam.fit(5,3,{});
 const quad=BK.draw3d.quad;let sides=0;
 BK.draw3d.quad=function(ctx,p,color,...args){if(color===BK.MATERIALS.bois.side)sides++;return quad(ctx,p,color,...args);};
 try{W.render(ctx,cam,{});}finally{BK.draw3d.quad=quad;}
 assert(sides>0,'face avant de la pente en bois');
}
console.log(`${floors.length} sols en pente : quatre orientations, étages, sauvegarde, rendu et retour à plat OK.`);
// Reproduit la pose successive de rampes sur un escalier, dans les quatre sens.
const rampTool = BK.EDITOR_TABS.flatMap(t=>t.items||[]).find(it=>it.opts==='ramp');
for (const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]) for (const material of ['bois',...floors.map(f=>'floor:'+f.ch)]) {
 const E=new BK.Editor({name:'Escalier',cols:11,rows:11,theme:'garden',base:'.'});
 const start={c:5-dc*2,r:5-dr*2};
 for(let n=0;n<=4;n++) {const c=start.c+dc*n,r=start.r+dr*n;E.grid[r][c]=',';if(n)E.props[c+','+r]={lv:n};}
 E.rebuild();E.item=rampTool;E.rampMaterial=material;
 for(let n=0;n<4;n++) {
  E.paint(start.c+dc*n,start.r+dr*n,true);
  const d=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:d.grid,props:d.props,theme:'garden',mode:'adventure',explore:true});
  for(let j=0;j<=n;j++) {
   const c=start.c+dc*j,r=start.r+dr*j;
   assert.equal(W.ramp[W.idx(c,r)],dc?dc*2:dr,`orientation ${material}`);
   if(material.startsWith('floor:'))assert.equal(W.tAt(c,r),BK.terrainForChar(material.slice(6)));
   const bottom=W.groundZ(c+.5-dc*.499999,r+.5-dr*.499999);
   const top=W.groundZ(c+.5+dc*.499999,r+.5+dr*.499999);
   assert(Math.abs(bottom-j*.6)<.00001,`entrée de rampe ${j}: ${bottom}`);
   assert(Math.abs(top-(j+1)*.6)<.00001,`sortie de rampe ${j}: ${top}`);
  }
  W.render(ctx,E.cam,{});
 }
}
console.log('Rampes successives : raccords continus à chaque pose, quatre sens et tous les matériaux OK.');
// Le sens manuel impose une montée d'un étage même sans voisin surélevé.
for(const tool of [rampTool,floors.find(f=>f.ch===',')])for(const dir of [1,-1,2,-2]) {
 const E=new BK.Editor({name:'Sens manuel',cols:9,rows:7,theme:'garden',base:'.'});
 E.item=tool;E.floorShape='ramp';E.rampDirection=dir;E.props['4,3']={lv:2};E.paint(4,3,true);
 const d=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:d.grid,props:d.props,theme:'garden',mode:'adventure',explore:true});
 assert.equal(W.ramp[W.idx(4,3)],dir);
 const dx=Math.abs(dir)===2?Math.sign(dir):0,dy=Math.abs(dir)===1?Math.sign(dir):0;
 assert(Math.abs(W.groundZ(4.5-dx*.4999,3.5-dy*.4999)-1.2)<.001);
 assert(Math.abs(W.groundZ(4.5+dx*.4999,3.5+dy*.4999)-1.8)<.001);
 W.render(ctx,E.cam,{});
 E.rampDirection=0;E.paint(4,3,true);assert.equal(E.props['4,3'].rampDir,0);
}
console.log('Sens manuel : quatre orientations, sols et outil Rampe, sauvegarde et retour automatique OK.');
