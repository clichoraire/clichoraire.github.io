const assert=require('node:assert/strict'),BK=require('./headless');
function setup(type='ninja_bombardier'){
 const w=new BK.World({map:Array(15).fill('.'.repeat(21)),mode:'adventure',theme:'forest',explore:true,hearts:true});
 const leader=w.addPlayer(BK.charById('adam'),7,10),p=w.addPlayer(BK.charById('richard'),7,7);Object.assign(p,{ally:true,human:false,leader,bombCool:99,lives:3});
 const e=w.addEnemy(type,11,7);w.fantasyBomb(e,p,type==='clown_artificier',false);const b=w.bombs[0];Object.assign(b,{state:'idle',cx:7,cy:7,x:7.5,y:7.5,z:0,t:2.3});return{w,p,e,b,leader};
}
for(const type of ['ninja_bombardier','clown_artificier']){
 const{w,p,e,b}=setup(type),hp=p.hp,t=b.t;w.updateAlly(p,.01);assert.equal(p.carrying,b,type+' picked up');assert.equal(b.t,t,'fuse not reset');
 for(let i=0;i<170;i++){w.time+=1/60;w.updateAlly(p,1/60);w.updatePlayer(p,1/60);w.updateBombs(1/60);w.updateFlames(1/60);w.checkHits();}
 assert(w.events.some(ev=>ev.type==='bombThrown'&&ev.bomb===b&&ev.player===p),'returned using normal throw');assert.equal(b.thrower,p);assert.equal(b.gift,type==='clown_artificier');assert.equal(p.hp,hp);assert(e.hp<e.maxHp,'enemy damaged');
}
for(const fuse of [.2,1.2,1.8]){const{w,p,b}=setup();b.t=fuse;w.updateAlly(p,.01);assert(!p.carrying,'short fuse rejected');if(fuse>=1.8)assert(p.input.dx||p.input.dy,'flees short fuse');}
{
 const{w,p,b}=setup();const chain={...b,cx:7,cy:8,x:7.5,y:8.5,t:.4};w.bombs.push(chain);w.updateAlly(p,.01);assert(!p.carrying,'chain shortens available time');
}
{
 const{w,p,b}=setup();b.owner=p.leader;w.updateAlly(p,.01);assert(!p.carrying,'never steals player bombs');
}
{
 const{w,p,b}=setup('clown_artificier');p.x=7.6;Object.assign(b,{state:'sliding',cx:8,x:8.5,dir:1});w.updateAlly(p,.01);assert.equal(p.carrying,b,'nearby kicked gift caught');
}
{
 const{w,p,leader}=setup();leader.x=10.5;leader.y=8.5;w.updateAlly(p,.01);assert(!p.carrying,'no throw exposing leader');
}
{
 const{w,p}=setup();w.cells[w.idx(10,7)]=BK.HARD;w.updateAlly(p,.01);assert(!p.carrying,'blocked landing rejected');
}
{
 const{w,p,b}=setup();p.longthrow=true;w.updateAlly(p,.01);assert.equal(p.carrying,b);p.poseT=.4;w.updateAlly(p,.01);assert.equal(b.to.x,12.5,'actual long throw range');
}
console.log('Ally returns: ninja bombs and clown gifts, unchanged fuse/visual, damage and safe escape, short fuse/chain refusal, nearby sliding gift, player ownership, teammate safety, blocked landing and long throw passed.');
