const assert=require('node:assert/strict'),BK=require('./headless');
const make=(map,props={})=>new BK.World({map,props,theme:'castle',mode:'adventure',hearts:true,explore:true,itemChance:0});
const hero=(w,c,r)=>w.addPlayer(BK.charById('adam'),c,r,{hp:40,bombs:4,fire:3});
// A bomb on top explodes normally. Only a ground-level kick can enter underneath.
{
 const w=make(['.......','..{....','.......']),p=hero(w,2,1),e=w.elevators[0];
 w.placeBomb(p);const top=w.bombs[0];assert(!top.underElevator);w.explodeBomb(top);assert.equal(e.state,'rest');assert(w.flames.length);
 w.flames=[];w.flameAt.clear();p.x=1.5;w.placeBomb(p);const b=w.bombs[0];w.kickBomb(b,3,p);p.x=2.5;w.updateBombs(.02);assert.equal(b.underElevator,e);assert.equal(b.state,'idle');assert(!w.blocked(2,1,p));assert.equal(w.pickupBomb(p),false);w.explodeBomb(b);assert.equal(e.state,'up');assert.equal(w.flames.length,0);
}
{
 const w=make(['.......','..{....','.......'],{'1,1':{lv:1}}),p=hero(w,1,1);w.placeBomb(p);const b=w.bombs[0];w.kickBomb(b,3,p);w.updateBombs(.02);assert(!b.underElevator,'no entry from a higher floor');
 const auto=make(['.......','..{....','.......'],{'2,1':{autoLift:true}}),q=hero(auto,1,1);auto.placeBomb(q);auto.kickBomb(auto.bombs[0],3,q);auto.updateBombs(.02);assert(!auto.bombs[0].underElevator,'automatic lift unchanged');
}
// Explosion lowers a bridge once, and collision/floor changes only after the animation.
for(const direction of [0,1,2,3]){
 const w=make(Array(11).fill('~~~~~~~~~~~'),{'5,5':{blastDrawbridge:{direction,length:3}}}),p=hero(w,5,5),b=w.blastDrawbridges[0];
 assert(w.blocked(5,5,p));assert(w.hitBlastDrawbridge(5,5,{cx:5,cy:5}));assert.equal(b.state,'lowering');w.updateArenaEffects(.6);assert(w.blocked(5,5,p));assert.equal(w.tAt(5,5),2);w.hitBlastDrawbridge(5,5,{cx:5,cy:5});assert.equal(b.t,.6);w.updateArenaEffects(.6);assert.equal(b.state,'open');for(const q of b.cells){assert.equal(w.tAt(q.c,q.r),3);assert(!w.blocked(q.c,q.r,p));}
}
{
 const w=make(['.......','.......','.......','...~~~.','.......'],{'3,3':{blastDrawbridge:{direction:3,length:3}}}),p=hero(w,2,3);w.placeBomb(p);w.explodeBomb(w.bombs[0]);assert.equal(w.blastDrawbridges[0].state,'lowering','actual bomb blast activates bridge');
}
const ed=new BK.Editor({name:'Pont',theme:'castle',cols:10,rows:8,grid:Array(8).fill('~~~~~~~~~~'),props:{}});ed.item={opts:'blastDrawbridge'};ed.bridgeDirection=3;ed.bridgeLength=4;ed.paint(2,3,true);assert.equal(ed.world.blastDrawbridges[0].length,4);const saved=JSON.parse(ed.code());assert.equal(saved.props['2,3'].blastDrawbridge.direction,3);ed.undo();assert.equal(ed.world.blastDrawbridges.length,0);
console.log('Bomb transports: top/under-deck distinction, real kick, pickup/collision, elevation, automatic lift, four bridge directions, timed lowering, blast activation, editor serialization and undo passed.');
{
 const w=make(['.......','.......','.......','.......','.......'],{'3,2':{lv:2,raisedBridge:'A',bridgeColumn:true},'4,2':{lv:2,raisedBridge:'A',bridgeColumn:true},'5,2':{lv:2,raisedBridge:'A'}}),p=hero(w,2,2);
 w.placeBomb(p);const normal=w.bombs[0];normal.level=2;w.explodeBomb(normal);assert(!w.brokenBridgeColumns?.size,'red is not an inflated bomb');
 assert(w.hitBridgeColumn(3,2,{inflation:1}));assert(!w.bridgeCollapses?.length,'second column still supports bridge');assert(w.hitBridgeColumn(4,2,{inflation:.8}));w.updateArenaEffects(.4);assert.notEqual(w.tAt(5,2),4);w.updateArenaEffects(.5);assert.equal(w.tAt(5,2),4);
 const ed=new BK.Editor({name:'Colonnes',cols:9,rows:7,grid:Array(7).fill('.........'),theme:'castle'});ed.item={opts:'supportedBridge'};ed.paint(4,3,true);ed.item={opts:'bridgeColumn'};ed.paint(4,3,true);assert(ed.props['4,3'].bridgeColumn);assert.equal(ed.world.hAt(4,3),Math.fround(1.2));
}
console.log('Bridge columns: ordinary/red resistance, inflated destruction, multiple supports, delayed collapse and editor passed.');
