const assert=require('node:assert/strict'),BK=require('./headless');
for(const total of [1,2,3,4,5,12,30])for(const kind of Object.keys(BK.HATCHING_EGGS)){
 const map=Array.from({length:7},()=>Array(7).fill('.'));map[3][3]='"';
 const w=new BK.World({map:map.map(r=>r.join('')),props:{'3,3':{deco:kind,eggBombs:total}},explore:true,mode:'adventure'}),p=w.addPlayer(BK.charById('adam'),2,3);
 w.destroyBlock(3,3,p);assert.equal(w.enemies.length,0,'seules les explosions comptent');
 for(let hit=1;hit<=total;hit++){
  w.flames=[];w.flameAt.clear();assert(w.placeBomb(p));const b=w.bombs[0];w.explodeBomb(b);w.explodeBomb(b);
  if(hit<total){assert.equal(w.enemies.length,0);assert.equal(w.props['3,3'].eggCracks,Math.min(3,Math.floor(hit/Math.ceil(total/4))));assert(w.cell(3,3));}
  else {assert.equal(w.enemies.length,1);assert.equal(w.cell(3,3),0);}
 }
}
assert.deepEqual([7,8,15,16,23,24].map(n=>BK.eggCrackStage(n,30)),[0,1,1,2,2,3]);
assert.deepEqual([3,6,9].map(n=>BK.eggCrackStage(n,12)),[1,2,3]);
console.log('Œufs : 1, 2, 3, 4, 5, 12 et 30 explosions, quatre espèces, fissures adaptatives et éclosion unique OK.');
