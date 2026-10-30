const assert=require('node:assert/strict'),BK=require('./headless');
const make=()=>new BK.World({map:Array(15).fill('.'.repeat(25)),theme:'forest',mode:'adventure',explore:true,hearts:true,itemChance:0});
const tick=(w,s)=>{for(let n=0;n<Math.ceil(s*60);n++)w.update(1/60);};
const hero=(w,c=10,r=7)=>{const p=w.addPlayer(BK.charById('adam'),c,r,{hp:40});p.invuln=999;return p;};
{
 const w=make(),p=hero(w,10,7),d=w.addEnemy('dragon_tricephale',7,7);w.updateEnemy(d,1.1);assert.equal(w.dragonShots.length,1);w.updateEnemy(d,.8);assert.equal(w.dragonShots.length,2);w.updateEnemy(d,.8);assert.equal(w.dragonShots.length,3);
 w.updateArenaEffects(.85);assert(w.dragonFires.length);const fire=w.dragonFires[0];assert.equal(fire.t,0);assert.equal(BK.ai.allyArenaDanger(w)[w.idx(fire.c,fire.r)],0);p.invuln=0;const hp=p.hp;w.updateArenaEffects(.01);assert(p.hp<hp);w.updateArenaEffects(5.8);assert(w.dragonFires.length);w.updateArenaEffects(.2);assert.equal(w.dragonFires.length,0);
 w.hurtEnemy(d,p,99,'bomb');assert.equal(d.heads.filter(h=>h.hp>0).length,2);assert(!d.dead);d.hurt=0;w.hurtEnemy(d,p,99,'bomb');assert.equal(d.heads.filter(h=>h.hp>0).length,1);assert(!d.dead);d.hurt=0;w.hurtEnemy(d,p,99,'bomb');assert(d.dead);assert.equal(d.hp,0);
}
{
 const w=make(),p=hero(w,10,7),d=w.addEnemy('dragon_tricephale',7,7);w.cells[w.idx(9,7)]=BK.HARD;tick(w,5);assert(!w.dragonShots?.length&&!w.dragonFires?.length,'dragon cannot see through wall');
}
for(const type of ['ninja_bombardier','clown_artificier']){
 const w=make(),p=hero(w,10,7),e=w.addEnemy(type,7,7);e.cool=0;w.updateEnemy(e,.01);assert(e.warning);w.updateEnemy(e,.7);assert.equal(w.bombs.length,1);assert.equal(w.bombs[0].state,'flying');assert.equal(!!w.bombs[0].gift,type==='clown_artificier');
 if(type==='clown_artificier'){w.bombs=[];e.cool=0;w.updateEnemy(e,.01);w.updateEnemy(e,.7);assert.equal(w.bombs[0].state,'sliding');assert(w.bombs[0].gift);const b=w.bombs[0];w.explodeBomb(b);assert(w.flames.length,'gift uses ordinary explosion');}
}
{
 const w=make(),p=hero(w,10,7),e=w.addEnemy('bombe_coureuse',7,7);w.updateEnemy(e,.1);assert(e.fuseLeft<7);p.x=20.5;w.updateEnemy(e,6.8);assert(!e.dead);w.updateEnemy(e,.11);assert(e.dead&&w.flames.length,'fuse persists for seven seconds even after line of sight is lost');
 const w2=make(),p2=hero(w2,10,7),b=w2.addEnemy('bombe_coureuse',7,7);w2.cells[w2.idx(9,7)]=BK.HARD;w2.updateEnemy(b,.1);assert.equal(b.fuseLeft,undefined,'wall prevents ignition');
}
{
 const w=make(),p=hero(w,10,7),e=w.addEnemy('loup_garou',7,7);const x=e.x;w.updateEnemy(e,.1);assert.equal(e.state,'charge');assert(e.x-x>.2);w.cells[w.idx(9,7)]=BK.HARD;w.updateEnemy(e,.1);assert.equal(e.state,'walk');
}
for(const type of ['fantome','alt_poe','guimauve','loup_garou']){
 const w=make();hero(w,1,1);const e=w.addEnemy(type,20,10),x=e.x,y=e.y;tick(w,90);assert(Math.hypot(e.x-x,e.y-y)<=2.01,type+' remains at its spawn area');assert(!w.shots.length,type+' does not fire at distant hero');
}
{
 const w=make(),p=hero(w,10,7),e=w.addEnemy('fantome',7,7);for(let r=0;r<w.rows;r++)w.cells[w.idx(9,r)]=BK.HARD;assert.equal(w.visibleEnemyTarget(e,4),null);tick(w,10);assert(e.x<9,'ghost stays on its side of the wall without seeing the hero');
}
const ids=['dragon_tricephale','ninja_bombardier','clown_artificier','bombe_coureuse','guimauve','loup_garou'];
for(const type of ids){const ed=new BK.Editor({cols:12,rows:9,grid:Array(9).fill('............'),theme:'forest'});ed.item=BK.EDITOR_TABS.find(t=>t.id==='ennemis').items.find(i=>i.enemy===type);assert(ed.item);ed.paint(5,4,true);assert(JSON.parse(ed.code()).enemies.some(e=>e.type===type));}
console.log('Fantasy enemies: 3 independent heads, fire per head, six-second ground fire, allies danger, ninja bombs, thrown/kicked gifts, persistent seven-second fuse, wolf sprint, walls, 90-second local ghost patrols, editor roundtrip passed.');
{
 const w=make(),p=hero(w,10,7),e=w.addEnemy('dragon_tricephale',7,7);w.hurtEnemy(e,p,3,'bomb');for(const h of e.heads)h.cool=0;w.updateEnemy(e,.01);assert.equal(w.dragonShots.length,2,'defeated head no longer attacks');
}
{
 const w=make(),p=hero(w,10,7),e=w.addEnemy('clown_artificier',7,7);w.fantasyBomb(e,p,true,false);const b=w.bombs[0];w.landBomb(b);p.x=b.x;p.y=b.y;assert(w.pickupBomb(p));assert(p.carrying.gift);w.throwBomb(p);assert(b.gift&&b.state==='flying','gift wrapping survives pickup and return throw');
}
for(const type of ids){const w=make();hero(w,10,7);const e=w.addEnemy(type,7,7);tick(w,30);assert([e.x,e.y,e.hp].every(Number.isFinite),type+' stable simulation');}
console.log('Defeated head silence, gift pickup/return and full six-enemy simulations passed.');
