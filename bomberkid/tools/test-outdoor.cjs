const assert=require('node:assert/strict'),BK=require('./headless');
for(const it of BK.OUTDOOR_DECOR){
 assert(BK.EDITOR_TABS.flatMap(t=>t.items||[]).some(q=>q.deco===it.deco));
 const e=new BK.Editor({cols:7,rows:7,theme:'garden',base:'~'});e.item={ch:'"',deco:it.deco};e.paint(3,3,true);
 assert.equal(e.props['3,3'].floor,'~');
 const w=new BK.World({map:e.grid.map(r=>r.join('')),props:e.props,mode:'adventure',explore:true});
 assert.equal(w.walkableTerrain(3,3),BK.WATER_STEPS.has(it.deco),it.name);
 if(BK.WATER_STEPS.has(it.deco))assert.equal(w.cell(3,3),0);
}
const mountain=BK.OUTDOOR_DECOR.filter(it=>it.category==='mountain');
const cemetery=BK.OUTDOOR_DECOR.filter(it=>it.category==='cemetery');
assert.equal(mountain.length,24);
assert.equal(cemetery.length,24);
const caves=BK.OUTDOOR_DECOR.filter(it=>it.category==='cave');
assert.equal(caves.length,20);
assert.equal(cemetery.filter(it=>it.name.startsWith('Pierre tombale')).length,5);
assert.equal(new Set(BK.OUTDOOR_DECOR.map(it=>it.deco)).size,BK.OUTDOOR_DECOR.length);
let drawCalls=0;
const ctx=new Proxy({fill(){drawCalls++;},stroke(){drawCalls++;},fillRect(){drawCalls++;}},{get:(o,k)=>o[k]??(()=>{})});
for(const it of [...mountain,...cemetery,...caves]){
 drawCalls=0;BK.sprites.drawBiomeDeco(ctx,it.deco,60,1);
 assert(drawCalls>=4,it.name+' se dessine');
 const card=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(q=>q.deco===it.deco);
 assert.equal(card.category,it.category);
 const e=new BK.Editor({cols:7,rows:7,theme:'garden',base:'.'});
 e.item=card;e.paint(3,3,true);
 assert.equal(e.world.deco[e.world.idx(3,3)],it.deco);
 assert.equal(e.world.blocked(3,3),!!it.solid);
}
console.log(BK.OUTDOOR_DECOR.length+' objets disponibles, dont 24 décors de montagne et 24 de cimetière et 20 de grotte ; sol aquatique préservé ; nénuphars et gués praticables, eau voisine infranchissable OK.');
for(const kind of BK.WATER_STEPS){
 const w=new BK.World({map:['.....','.."..','.....'],props:{'2,1':{floor:'~',deco:kind}},explore:true,mode:'adventure'}),p=w.addPlayer(BK.charById('adam'),1,1);
 p.input.dx=1;for(let i=0;i<25;i++)w.updatePlayer(p,1/60);assert(!p.falling);assert(p.x>2,'marche sur le passage');
 p.input.dx=0;p.air={x0:1.5,y0:1.5,z0:0,x1:2.5,y1:1.5,z1:0,h:.7,dur:.6,t:0};
 for(let i=0;i<100;i++)w.updatePlayer(p,1/60);assert(!p.falling);
}

console.log('Marche et réception de saut sur les deux passages aquatiques OK.');
