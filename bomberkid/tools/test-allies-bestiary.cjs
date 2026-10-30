const assert=require('node:assert/strict'),BK=require('./headless');
function setup(){const W=new BK.World({map:['###############',...Array(9).fill('#.............#'),'###############'],mode:'adventure',explore:true,hearts:true});const leader=W.addPlayer(BK.charById('adam'),7,5),ally=W.addPlayer(BK.charById('richard'),5,5);Object.assign(ally,{ally:true,human:false,leader,bombCool:99,lives:3});leader.invuln=999;return{W,leader,ally};}
for(const b of BK.BESTIARY){const{W,ally}=setup(),e=W.addEnemy(b.id,6,5);assert(BK.ai.allyCombatEnemies(W,ally,5).includes(e),b.name+' targeted');const hp=e.hp;W.updateAlly(ally,1/60);assert(e.hp<hp,b.name+' attacked');}
{
 const{W,ally,leader}=setup();leader.x=10.5;const e=W.addEnemy('alt_ganon',3,5);assert(BK.ai.allyCombatEnemies(W,ally,5).includes(e),'nearby boss supported beyond ordinary pursuit range');
 ally.bombCool=0;assert(BK.ai.allyBombs(W,ally,1/60),'ally chooses a bomb against boss');assert(W.bombs.some(b=>b.owner===ally),'ally bomb exists');
}
{
 const{W,ally}=setup(),e=W.addEnemy('alt_creeper',7,5);e.fuse=.1;let danger=BK.ai.allyArenaDanger(W);
 assert.equal(danger[W.idx(4,5)],0,'full three-cell explosion marked');assert(!BK.ai.allyCombatEnemies(W,ally,5).includes(e),'armed creeper not pursued');
 W.cells[W.idx(9,5)]=BK.HARD;danger=BK.ai.allyArenaDanger(W);assert.equal(danger[W.idx(10,5)],Infinity,'wall blocks predicted explosion');
 const hp=e.hp;W.updateAlly(ally,1/60);assert.equal(e.hp,hp,'evades rather than striking');assert(ally.input.dx||ally.input.dy,'starts moving immediately');
 for(let i=0;i<60;i++){W.time+=1/60;W.updateAlly(ally,1/60);W.updatePlayer(ally,1/60);}
 assert.equal(BK.ai.allyArenaDanger(W)[W.idx(Math.floor(ally.x),Math.floor(ally.y))],Infinity,'reaches safety before detonation');
 e.fuse=0;e.state='walk';assert(BK.ai.allyCombatEnemies(W,ally,5).includes(e),'resumes combat after cancelled fuse');
 e.state='hidden';assert(!BK.ai.allyCombatEnemies(W,ally,5).includes(e),'does not waste attacks on buried enemies');
}
{
 const{W,ally}=setup(),e=W.addEnemy('alt_creeper',7,5);e.fuse=.2;W.bombs.push({cx:9,cy:5,x:9.5,y:5.5,t:3,fire:3,state:'idle',passers:new Set()});assert.equal(BK.ai.allyArenaDanger(W)[W.idx(12,5)],0,'chain explosion also avoided');
}
console.log('Allies: all 142 entries attacked, boss bombs, immediate creeper escape, walls, chains and combat resumption verified.');
