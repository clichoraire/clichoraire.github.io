const assert=require('node:assert/strict'),BK=require('./headless');
for(const dir of [1,-1,2,-2])for(const manual of [false,true]) {
 const dx=Math.abs(dir)===2?Math.sign(dir):0,dy=Math.abs(dir)===1?Math.sign(dir):0,sx=-dy,sy=dx;
 const c=4,r=4,props={'4,4':{lv:2,...(manual?{rampDir:dir}:{})}};
 props[(c-dx)+','+(r-dy)]={lv:2};props[(c+dx)+','+(r+dy)]={lv:3};
 props[(c+sx)+','+(r+sy)]={lv:1.5};
 const map=Array.from({length:9},(_,y)=>Array.from({length:9},(_,x)=>x===c&&y===r?'/':'.').join(''));
 const W=new BK.World({map,props,theme:'garden',mode:'adventure',explore:true});
 const p=W.addPlayer(BK.charById('adam'),c-dx,r-dy);
 assert.equal(W.ramp[W.idx(c,r)],dir);
 assert(W.canStep(c-dx,r-dy,c,r,p),'entrée par le bas');
 p.input.dx=dx;p.input.dy=dy;
 for(let n=0;n<120&&((p.x-c-.5)*dx+(p.y-r-.5)*dy)<.25;n++)W.updatePlayer(p,1/60);
 assert((p.x-(c+.5))*dx+(p.y-(r+.5))*dy>0,'monte effectivement la pente');
 assert(W.groundZ(p.x,p.y)>1.5,'prend de la hauteur');
 // Sur un même bord latéral, le bas est accessible et le haut dépasse un étage.
 for(const offset of [-.25,.25]) {
  p.x=c+.5+sx+dx*offset;p.y=r+.5+sy+dy*offset;p.zOff=0;
  const allowed=offset<0;
  assert.equal(W.canStep(c+sx,r+sy,c,r,p),allowed,`bord latéral à ${offset}, sens ${dir}`);
  assert.equal(W.blocked(c,r,p),!allowed,'collision du personnage');
  if(!allowed) {
   p.x=c+.5+sx*.65+dx*offset;p.y=r+.5+sy*.65+dy*offset;
   W.moveCircle(p,-sx*.1,-sy*.1,p);
   assert((p.x-c-.5)*sx+(p.y-r-.5)*sy>=.5,'ne traverse pas le côté haut');
  }
 }
 assert(!W.jumpHeightClear(c+.5+sx+dx*.25,r+.5+sy+dy*.25,c+.5+dx*.25,r+.5+dy*.25),'saut latéral limité à un étage');
 // Un étage exactement est autorisé ; plus d'un étage est bloqué, même par le bas.
 W.height[W.idx(c-dx,r-dy)]=.6;p.x=c+.5-dx;p.y=r+.5-dy;
 assert(W.canStep(c-dx,r-dy,c,r,p));
 W.height[W.idx(c-dx,r-dy)]=0;
 if(manual)assert(!W.canStep(c-dx,r-dy,c,r,p),'entrée surélevée infranchissable');
 // La descente reste possible pour le héros.
 p.x=c+.5;p.y=r+.5;
 assert(W.canStep(c,r,c-sx,r-sy,p),'descente du rebord');
}
console.log('Collisions des pentes : entrée basse, montée réelle, côtés selon leur hauteur, limite d’un étage et descente OK (4 sens, auto/manuels).');
