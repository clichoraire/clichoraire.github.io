const assert=require('node:assert/strict'),BK=require('./headless');
const make=()=>new BK.World({map:Array(13).fill('.'.repeat(13)),theme:'castle',mode:'adventure',explore:true,hearts:true,itemChance:0});
const hero=w=>w.addPlayer(BK.charById('adam'),6,6,{hp:40,bombs:4,fire:4});
{
 const w=make(),p=hero(w);assert(w.applyItem(p,{type:'dome'}));w.placeBomb(p);const b=w.bombs[0];assert(b.dome);const danger=BK.ai.dangerMap(w);assert(Math.abs(danger[w.idx(8,8)]-b.t)<1e-5);assert.equal(danger[w.idx(10,10)],Infinity);w.explodeBomb(b);
 assert(w.flameAt.has(w.idx(10,6)));assert(w.flameAt.has(w.idx(2,6)));assert(w.flameAt.has(w.idx(8,8)));assert(!w.flameAt.has(w.idx(10,10)));assert(w.flameAt.get(w.idx(6,6)).domeHeight>w.flameAt.get(w.idx(10,6)).domeHeight);
}
{
 const w=make(),p=hero(w);p.dome=true;p.bomb2=true;w.cells[w.idx(7,6)]=BK.SOFT;w.cells[w.idx(8,6)]=BK.SOFT;w.cells[w.idx(6,5)]=BK.HARD;w.placeBomb(p);w.explodeBomb(w.bombs[0]);assert.equal(w.cell(7,6),0);assert.equal(w.cell(8,6),BK.SOFT,'one layer only');assert(!w.flameAt.has(w.idx(7,5)),'no diagonal corner leak');assert(!w.flameAt.has(w.idx(6,4)));assert.equal(w.flameAt.get(w.idx(6,6)).duration,BK.FLAME_TIME*2);
}
{
 const w=make(),p=hero(w);p.dome=true;w.placeBomb(p);const main=w.bombs[0];p.x=8.5;p.y=8.5;p.dome=false;w.placeBomb(p);const chained=w.bombs[1];w.explodeBomb(main);assert(chained.exploded,'diagonal chain reaction');assert(BK.EDITOR_TABS.flatMap(t=>t.items).some(it=>it.pickup==='dome'));
}
console.log('Dome power: pickup, circular range, diagonals, wall and corner occlusion, one destructible layer, domed flame height, red duration, chain reaction, AI danger and editor passed.');
// One continuous bubble grows from the centre; its lifetime tracks the damaging flames.
for(const level of [1,2]){
 const w=make(),p=hero(w);p.dome=true;p.bomb2=level===2;w.placeBomb(p);w.explodeBomb(w.bombs[0]);const d=w.domeBursts[0];assert.equal(d.duration,BK.FLAME_TIME*level);
 assert(BK.domeAnimation(.02,d.duration).scale<BK.domeAnimation(.15,d.duration).scale);
 assert.equal(BK.domeAnimation(d.duration,d.duration).alpha,0);
 w.updateArenaEffects(d.duration-.01);assert.equal(w.domeBursts.length,1);w.updateArenaEffects(.02);assert.equal(w.domeBursts.length,0);
}
console.log('Continuous fire bubble: growth, fade and normal/red lifetime passed.');
