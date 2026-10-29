const assert=require('node:assert/strict'),BK=require('./headless');
function setup(map){const w=new BK.World({map:map||Array(15).fill('.'.repeat(21)),mode:'adventure',theme:'forest',explore:true,hearts:true});const leader=w.addPlayer(BK.charById('adam'),10,7),ally=w.addPlayer(BK.charById('richard'),7,7);Object.assign(ally,{ally:true,human:false,leader,bombCool:99,lives:3});leader.invuln=999;return{w,leader,ally};}
const step=(w,p)=>{w.time+=1/60;w.updateAlly(p,1/60);w.updatePlayer(p,1/60);};
for(const type of ['dragon_tricephale','ninja_bombardier','clown_artificier','bombe_coureuse','guimauve','loup_garou']){
 const{w,ally}=setup(),e=w.addEnemy(type,8,7);assert(BK.ai.allyCombatEnemies(w,ally,5).includes(e),type+' target');const hp=e.hp;w.updateAlly(ally,.01);assert(e.hp<hp,type+' melee support');
}
{
 const{w,ally}=setup(),e=w.addEnemy('dragon_tricephale',8,7);
 for(let i=0;i<10;i++){e.hurt=0;ally.attackT=0;w.updateAlly(ally,.01);}
 assert(e.dead&&e.heads.every(h=>h.hp===0),'ally defeats all three heads');
}
{
 const{w,ally,leader}=setup();leader.y=9.5;w.addEnemy('dragon_tricephale',12,7);ally.bombCool=0;assert(BK.ai.allyBombs(w,ally,.01));assert(w.bombs.some(b=>b.owner===ally),'bomb support against dragon');
}
{
 const{w,ally}=setup(),e=w.addEnemy('bombe_coureuse',9,7);e.fuseLeft=7;const hp=e.hp;
 assert(!BK.ai.allyCombatEnemies(w,ally,5).includes(e),'armed runner not pursued');
 for(let i=0;i<150;i++)step(w,ally);
 assert.equal(e.hp,hp,'flee instead of melee');assert(Math.hypot(ally.x-e.x,ally.y-e.y)>=3.8,'keeps distance even diagonally');
 assert.equal(BK.ai.allyArenaDanger(w)[w.idx(Math.floor(ally.x),Math.floor(ally.y))],Infinity);
 for(let r=0;r<w.rows;r++)w.cells[w.idx(11,r)]=BK.HARD;
 assert.equal(BK.ai.allyArenaDanger(w)[w.idx(12,7)],Infinity,'wall shelters ally');
 e.dead=true;assert.equal(BK.ai.allyArenaDanger(w)[w.idx(9,7)],Infinity,'dead runner no longer predicted');
}
{
 // Recompute the escape while a lit runner actually chases the ally, until its explosion.
 const{w,ally,leader}=setup(Array(21).fill('.'.repeat(25)));leader.x=20.5;leader.y=15.5;ally.x=10.5;ally.y=10.5;
 const e=w.addEnemy('bombe_coureuse',12,10);e.fuseLeft=7;const hp=ally.hp;
 for(let i=0;i<450;i++){step(w,ally);w.updateEnemy(e,1/60);w.updateBombs(1/60);}
 assert(e.dead,'runner explodes after chase');assert.equal(ally.hp,hp,'ally survives pursuit and explosion without damage');
 assert(Math.hypot(ally.x-e.x,ally.y-e.y)>3.8);
}
{
 // The only route is a corridor: wait for all six seconds instead of walking into fire.
 const map=['###############','###############','#.............#','###############','###############'];
 const{w,ally,leader}=setup(map);ally.x=3.5;ally.y=2.5;leader.x=10.5;leader.y=2.5;ally.safe={x:3.5,y:2.5,dir:3};w.dragonFires=[{c:6,r:2,z:0,t:0,owner:{}}];const hp=ally.hp;
 for(let i=0;i<359;i++){step(w,ally);w.updateArenaEffects(1/60);assert(ally.x<6,'waits outside active fire');}
 assert.equal(ally.hp,hp);w.updateArenaEffects(.1);
 for(let i=0;i<180;i++)step(w,ally);assert(ally.x>7,'continues once fire extinguished');
}
{
 // A warning forces escape, but the shortest route through active dragon fire is forbidden.
 const{w,ally}=setup();w.dragonFires=[{c:8,r:7,z:0,t:0,owner:{}}];w.dragonShots=[{to:{x:7.5,y:7.5},from:{x:10.5,y:7.5},x:10.5,y:7.5,z:1,base:0,t:0,dur:.85}];
 BK.ai.allyArenaEvade(w,ally,1/60);assert(ally.input.dx||ally.input.dy);assert(!(ally.input.dx>0&&ally.input.dy===0),'does not escape through fire');
}
console.log('Allies fantasy: attacks on all six types, three-head defeat, bomb support, immediate runner escape, diagonal clearance, walls, six-second fire wait, safe escape and resumption passed.');
