const assert=require('node:assert/strict'),G=require('./physics'),M=require('./monsters');
const original=M.collide;M.collide=()=>{};
function ground(level=0,bounces=0){const s=G.fresh();s.levels.rebound=level;const f=G.create(s);Object.assign(f,{y:.01,vx:25,vy:-15,bounces});G.step(f,1/120,{});return f;}
const a=ground(),b=ground(0,1),better=ground(4);
assert(!a.ended);assert(a.monsterReaction.ground);assert(a.monsterReaction.strength<=1);assert(Math.abs(a.pitch)<=.18);assert(a.vy>0);assert(b.vy<a.vy);assert(better.vy>a.vy);assert(better.vx>a.vx);assert(ground(0,2).ended);
assert(Math.hypot(a.vx,a.vy)<Math.hypot(25,15));
M.collide=original;
let id=0;while(M.at(id,0).kind!==6)id++;
const m=M.at(id,0),enemy=G.create(G.fresh());Object.assign(enemy,{x:m.x,y:(m.height*.5-m.lane)/.85+m.y,vx:25,vy:-15,monsterTime:0});
M.collide(enemy,enemy.x,enemy.y,.001,{});assert(enemy.vy>a.vy,'slime bounce higher than ground at same incoming speed');assert(Math.hypot(enemy.vx,enemy.vy)<Math.hypot(25,15));
console.log('Ground fades, finite ricochets, upgrades work, slime rebounds higher without adding speed: PASS');
