'use strict';
const assert=require('node:assert/strict');global.window={};const saves=new Map();global.localStorage={getItem:k=>saves.get(k)||null,setItem:(k,v)=>saves.set(k,v),removeItem:k=>saves.delete(k)};
let seed=321;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(const f of ['config','monsters','game','powers','ai','match-rules','adventure'])require('../js/'+f+'.js');
const B=window.BC,A=B.Adventure;
const game=()=>{const g=new B.Game({teams:[B.TEAMS[0],B.TEAMS[1]],ctrl:['p1','p2'],intro:false});g.ai.update=()=>{};return g;};
const tick=(g,n)=>{for(let i=0;i<n;i++)g.update(B.STEP,[{},{}]);};
for(const team of [0,1]){
 const g=game(),p=g.inner(team)[0],hp=g.inner(team).map(x=>x.hp);g.give(p);tick(g,599);assert.equal(g.ball.holder,p);tick(g,2);
 assert.equal(g.ball.state,'held');assert.equal(g.ball.holder.team,1-team);assert.equal(g.stats[team].throws,0);assert.equal(g.stats[team].penalties,1);assert.deepEqual(g.inner(team).map(x=>x.hp),hp.map(x=>x-5));assert.ok(g.possession.left>9.9);
}
{
 const g=game(),p=g.inner(0)[0];g.give(p);g.startCharge(p,{});g.possession.left=.001;g.update(B.STEP,[{},{}]);assert.equal(p.charging,false);assert.equal(p.pending,null);assert.equal(g.ball.holder.team,1);
}
{
 const g=game();let p=g.inner(0)[0];g.give(p);g.possession.left=4;let first;
 for(let i=1;i<=4;i++){
  g.setState(p,'idle');g.pass(p,{dx:0,dy:i%2?-1:1});assert.equal(g.ball.combo,Math.min(i,3));assert.equal(g.possession.left,4);const speed=Math.hypot(g.ball.vx,g.ball.vy);if(i===1)first=speed;
  const target=g.ball.target;g.give(target);assert.equal(g.ball.combo,Math.min(i,3));assert.equal(g.possession.left,4);p=target;g.time+=.4;
 }
 g.throwBall(p,{charge:0});assert.equal(g.ball.combo,3);assert.equal(g.possession,null);assert.ok(g.ball.speed>p.phys.throwSpeed);assert.equal(g.ball.state,'live');
}
{
 const g=game(),p=g.inner(0)[0];g.give(p);g.pass(p,{dy:-1,dx:0});g.give(g.ball.target);g.time+=1.01;g.throwBall(g.ball.holder,{charge:0});assert.equal(g.ball.combo,0);
 const q=g.inner(1)[0];g.caught(q,{});assert.equal(g.ball.combo,0);assert.equal(g.possession.team,1);
}
{
 const g=game(),p=g.inner(0)[0];g.give(p);g.pass(p,{dx:0,dy:-1});const target=g.ball.target;
 for(let i=0;i<100&&g.ball.state==='pass';i++)g.update(B.STEP,[{},{}]);
 assert.equal(g.ball.holder,target);assert.equal(g.ball.combo,1);assert.equal(g.stats[0].throws,0);
 g.action(target,'a',{});assert.equal(target.charging,true);
 g.update(B.STEP,[{},{}]);g.release(target);assert.equal(g.ball.combo,1);assert.equal(g.ball.state,'live');
}
{
 const g=game(),p=g.inner(0)[0];g.give(p);g.pass(p,{dx:0,dy:-1});g.possession.left=.001;g.update(B.STEP,[{},{}]);assert.equal(g.ball.holder.team,1);assert.equal(g.ball.state,'held');
}
for(const wait of [.05,.3]){
 const g=game(),p=g.inner(0)[0];g.give(p);g.startCharge(p,{});for(let i=0;i<55;i++){g.time+=B.STEP;g.stepPlayer(p,B.STEP,{},null);}g.time+=wait;g.release(p);assert.equal(g.ball.perfect,wait<.18);assert.equal(g.ball.state,'live');
}
for(const team of B.MONSTER_TEAMS)assert.equal(new Set(team.players.map(id=>B.PLAYERS[id].power)).size,6);
const s=A.start('matthieu');s.team={inner:['matthieu','josee','richard'],outer:['mickael','milo','jeremie']};
for(let i=0;i<3;i++){const m=A.buildMatch(s),g=new B.Game({...m,ctrl:['cpu','cpu'],intro:false});g.winner=0;A.record(s,g);}
assert.equal(A.next(s).boss,true);
let m=A.buildMatch(s),g=new B.Game({...m,ctrl:['cpu','cpu'],intro:false});assert.equal(g.inner(1).length,1);assert.equal(g.outer(1).length,0);assert.equal(g.players.filter(p=>p.team===1).length,1);const boss=g.inner(1)[0];assert.ok(boss.maxHp===150);assert.ok(boss.def.size>=3);
const seen=new Set();for(let i=0;i<3;i++){g.give(boss);g.throwBall(boss,{charge:1});seen.add(g.ball.power);}assert.equal(seen.size,3);
g.winner=1;A.record(s,g);assert.equal(A.next(s).boss,true);g=new B.Game({...A.buildMatch(s),ctrl:['cpu','cpu'],intro:false});g.winner=0;A.record(s,g);assert.equal(A.next(s).boss,false);assert.equal(A.next(s).stage,4);assert.equal(s.bosses,1);
// Migration : une ancienne aventure avancée ne perd ni ses stats ni ses victoires.
const old={...s,match:9};delete old.bosses;localStorage.setItem('bc.adventure.matthieu',JSON.stringify(old));assert.equal(A.load('matthieu').bosses,3);
// Les quatre boss doivent pouvoir terminer un match, sans équipier ni ballon inaccessible.
for(let i=0;i<4;i++){s.match=(i+1)*3;s.bosses=i;const match=A.buildMatch(s);const battle=new B.Game({...match,ctrl:['cpu','cpu'],intro:false,mode:'adventure'});for(let t=0;t<360&&battle.phase!=='end';t+=B.STEP)battle.update(B.STEP);assert.equal(battle.phase,'end',match.teams[1].name);assert.ok(battle.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.hp)));}
console.log('OK : chrono, pénalité, transfert sans tir, combos ×3, interception, fenêtre parfaite, 72 pouvoirs variés, progression et 4 combats de boss.');

// Le chrono commence avant la récupération et ne repart pas à zéro ensuite.
for(const side of [0,1]){const g=game(),thrower=g.inner(1-side)[0],receiver=g.inner(side)[0],b=g.ball;g.possession=null;b.state='dead';b.thrower=thrower;b.team=1-side;b.x=side===0?400:900;b.y=450;b.z=0;b.vx=b.vy=b.vz=0;g.trackIncomingPossession();assert.equal(g.possession.team,side);g.possession.left=3;g.give(receiver);assert.equal(g.possession.left,3);g.possession.left=.001;g.update(B.STEP,[{},{}]);assert.equal(g.ball.holder.team,1-side);}
console.log('OK : chrono dès le demi-terrain adverse et récupération sans remise à zéro.');

for(const side of [0,1]){const g=game(),b=g.ball;g.stepPlayer=()=>{};b.state='dead';b.thrower=g.inner(1-side)[0];b.team=1-side;b.x=side===0?200:1080;b.y=310;b.z=0;b.vx=b.vy=b.vz=0;g.possession=null;g.update(B.STEP,[{},{}]);assert.equal(g.possession.team,side);tick(g,60);assert.ok(g.possession.left<9.1);g.possession.left=.001;g.update(B.STEP,[{},{}]);assert.equal(g.ball.state,'held');assert.equal(g.ball.holder.team,1-side);assert.equal(g.stats[side].penalties,1);}
for(const team of B.MONSTER_TEAMS)assert.equal(new Set(team.players.map(id=>B.PLAYERS[id].portraitVariant)).size,6);
console.log('OK : ballon au sol chronométré, transfert et six portraits par espèce.');
