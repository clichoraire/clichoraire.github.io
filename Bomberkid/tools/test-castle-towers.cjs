const assert=require('node:assert/strict'),BK=require('./headless');
function arena(){const W=new BK.World({map:Array(11).fill('.'.repeat(13)),theme:'castle',mode:'adventure',hearts:true,explore:true}),p=W.addPlayer(BK.charById('adam'),6,7,{bombs:3});p.invuln=999;p.dir=2;const tower=W.addEnemy('bombtower',6,4);return {W,p,tower};}
const tick=(W,n)=>{for(let i=0;i<n*60;i++)W.update(1/60);};
{
 const {W,p,tower}=arena();assert(W.blocked(6,4,p));assert(W.blocked(7,4,p));assert(!W.blocked(5,4,p)&&!W.blocked(8,4,p));assert.equal(tower.x,7);assert(!W.hurtEnemy(tower,p,99,'bomb'));assert(!W.hurtEnemy(tower,p,99));assert(!tower.dead);
 assert(W.placeBomb(p));assert(W.pickupBomb(p));const b=p.carrying;const fuse=b.t;assert(W.throwBomb(p));assert.equal(b.windowTarget,tower);assert.equal(b.t,fuse,'aim assistance never resets fuse');
 tick(W,.55);assert.equal(b.state,'tower');assert.equal(tower.state,'loaded');assert(!tower.dead,'bomb waits for its fuse inside');tick(W,3.5);assert(tower.dead);assert(!W.blocked(6,4,p));assert(!W.blocked(7,4,p));assert.equal(p.bombsOut,0);
}
{
 const {W,p,tower}=arena();tower.cool=0;W.updateEnemy(tower,.01);assert(tower.warning);W.updateEnemy(tower,1.1);const b=W.bombs[0];assert(b&&b.owner===tower);W.updateBombs(.8);assert.equal(b.state,'idle');assert(W.pickupBomb(p),'enemy bomb can be picked up without gloves');W.throwBomb(p);W.updateBombs(.6);assert.equal(b.towerInside,tower);W.updateBombs(b.t+.01);assert(tower.dead,'returned bomb destroys its own tower');assert(p.score>0);assert.equal(tower.bombsOut,0);
}
{
 const {W,p,tower}=arena();W.cells[W.idx(6,6)]=1;W.placeBomb(p);W.pickupBomb(p);assert(!W.towerInThrowLine(p,p.carrying),'wall blocks window aim');p.dir=3;assert(!W.towerInThrowLine(p,p.carrying),'must face window');
}
{
 const {W,p,tower}=arena();p.x=9.5;const ally=W.addPlayer(BK.charById('richard'),6,7,{bombs:2});Object.assign(ally,{ally:true,human:false,leader:p,bombCool:0});W.updateAlly(ally,.01);assert(W.bombs.some(b=>b.windowTarget===tower),'companion throws into a tower window');
}
for(const column of [6,7]){
 const {W,p,tower}=arena();p.x=column+.5;W.placeBomb(p);W.pickupBomb(p);assert(W.towerInThrowLine(p,p.carrying)===tower,'window reachable from either occupied column');W.throwBomb(p);W.updateBombs(.6);assert.equal(tower.state,'loaded');
}
const E=new BK.Editor({name:'Tour',theme:'castle',cols:7,rows:7,grid:['#######','#.....#','#.....#','#.....#','#..1.G#','#.....#','#######'],enemies:[{type:'bombtower',c:3,r:2}],props:{}});
assert.equal(JSON.parse(E.code()).enemies[0].type,'bombtower');
console.log('Castle towers: solid walls, immunity outside, aimed window, live fuse, own and returned bombs, attribution, companion throws and editor roundtrip passed.');
