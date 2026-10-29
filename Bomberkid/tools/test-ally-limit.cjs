const assert=require('node:assert/strict'),BK=require('./headless');
let menu;BK.overlay.show=o=>menu=o;
function setup(){const a=new BK.Adventure('mickael',4);a.save.gold=1000;delete a.save.waitingAllies;a.enterHouse(a.world.doors.find(d=>d.c===6));a.state='play';a.world.frozen=false;return{a,W:a.world,offers:[...a.world.displays]};}
{
 const{a,W,offers}=setup();assert(a.recruit(offers[0]));assert(a.recruit(offers[1]));const team=a.activeAllies(),gold=a.save.gold;
 assert(!a.buy(offers[2]));assert.equal(a.activeAllies().length,2);assert.equal(a.save.gold,gold);assert(W.frozen&&a.state==='pause');assert.equal(menu.buttons.length,3);assert(menu.buttons[0].label.includes(team[0].name));
 menu.buttons[2].onClick();assert.equal(a.save.gold,gold);assert(!W.frozen&&a.state==='play');assert.deepEqual(a.activeAllies(),team);
 a.buy(offers[2]);const choose=menu.buttons[0].onClick;choose();assert.equal(a.activeAllies().length,2);assert(!W.players.includes(team[0]));assert(a.activeAllies().includes(team[1]));assert(a.activeAllies().includes(offers[2].npc));assert.equal(a.save.gold,gold-offers[2].price);assert(!W.frozen);choose();assert.equal(a.save.gold,gold-offers[2].price,'double tap cannot charge twice');
 a.leaveHouse();assert.equal(a.activeAllies().length,2);a.enterHouse(a.world.doors.find(d=>d.c===6));assert.equal(a.activeAllies().length,2);assert.equal(a.world.displays.filter(d=>d.waiting).length,1,'replaced ally waits in the house');
}
{
 const{a,W,offers}=setup();a.recruit(offers[0]);a.recruit(offers[1]);const team=a.activeAllies();team[0].alive=false;team[0].lives=2;assert.equal(a.activeAllies().length,2,'reviving ally occupies a slot');
 a.buy(offers[2]);const gold=a.save.gold;a.save.gold=0;menu.buttons[0].onClick();assert(W.players.includes(team[0]));assert(!offers[2].npc.ally);assert.equal(a.save.gold,0);menu.buttons[2].onClick();
 a.save.gold=gold;team[0].lives=0;assert(a.recruit(offers[2]));assert.equal(a.activeAllies().length,2);assert(!W.players.includes(team[0]),'exhausted portrait removed when new ally joins');
}
{
 const{a,W,offers}=setup();a.recruit(offers[0]);a.recruit(offers[1]);a.buy(offers[2]);const gold=a.save.gold,team=a.activeAllies();for(const D of BK.DIRS)W.cells[W.idx(offers[2].c+D.dx,offers[2].r+D.dy)]=BK.HARD;menu.buttons[0].onClick();assert.deepEqual(a.activeAllies(),team);assert.equal(a.save.gold,gold,'failed unseating leaves purchase and team untouched');menu.buttons[2].onClick();
}
{
 const a=new BK.Adventure('adam',5);const members=['richard','josee','eliott'].map(id=>({id,hp:20,maxHp:30,lives:3}));a.save.bossCompanions={destination:a.stage.id,members};a.restoreBossCompanions();assert.equal(a.activeAllies().length,2,'legacy save capped');a.saveCompanionsFor('2-2',a.activeAllies());assert.equal(a.save.bossCompanions.members.length,2);
}
console.log('Two-ally limit: choice, cancel, replacement, double tap, funds, seats, respawn, houses and save migration passed.');
