'use strict';
const assert=require('node:assert/strict');global.window={};const saves=new Map();global.localStorage={getItem:k=>saves.get(k)||null,setItem:(k,v)=>saves.set(k,v),removeItem:k=>saves.delete(k)};
for(const f of ['config','monsters','game','powers','ai','match-rules','adventure'])require('../js/'+f+'.js');
const B=window.BC,A=B.Adventure;
const fresh=()=>{const s=A.start('matthieu');s.team={inner:['matthieu','josee','richard'],outer:['mickael','milo','jeremie']};s.match=2;return s;};
const s=fresh();assert.ok(A.beaten(s,B.MONSTER_TEAMS[0]));assert.equal(s.clears,undefined);
assert.throws(()=>A.buildMatch(s,{teamId:B.MONSTER_TEAMS[8].id,replay:true}));assert.throws(()=>A.buildMatch(s,{difficulty:5}));assert.throws(()=>A.buildMatch(s,{difficulty:-1}));assert.throws(()=>A.buildMatch(s,{teamId:'unknown'}));
let lastXp=0,lastSpeed=0,lastReaction=1;
for(let difficulty=0;difficulty<5;difficulty++){
 const m=A.buildMatch(s,{teamId:B.MONSTER_TEAMS[0].id,replay:true,difficulty});assert.equal(m.difficulty,difficulty);assert.ok(m.adventure.replay);assert.ok(m.adventure.revealed);
 const g=new B.Game({...m,ctrl:['p1','cpu'],intro:false,mode:'adventure'});g.winner=0;g.xp.matthieu=10;
 assert.ok(g.ai.D.react<lastReaction);lastReaction=g.ai.D.react;assert.ok(g.inner(1)[0].phys.throwSpeed>=lastSpeed);lastSpeed=g.inner(1)[0].phys.throwSpeed;
 const before=A.char(s,'matthieu').totalXp,r=A.record(s,g);assert.equal(s.match,2);assert.equal(s.bosses,0);assert.equal(r.report.length,6);
 const xp=A.char(s,'matthieu').totalXp-before;assert.equal(xp,Math.round(18*A.XP_MULTIPLIERS[difficulty]));assert.ok(xp>lastXp);lastXp=xp;
 assert.equal(s.clears[m.teams[1].id][difficulty],1);assert.equal(g.xp.matthieu,10);assert.ok(r.report.find(x=>x.pid==='milo').xp>0);
 const snapshot=JSON.stringify(s);assert.equal(A.record(s,g),r);assert.equal(JSON.stringify(s),snapshot);
}
const saved=A.load('matthieu');assert.equal(Object.keys(saved.clears[B.MONSTER_TEAMS[0].id]).length,5);
// Une défaite donne de l'XP, sans médaille, déblocage ni progression.
const lose=fresh(),m=A.buildMatch(lose,{difficulty:4}),g=new B.Game({...m,ctrl:['p1','cpu'],intro:false});g.winner=1;A.record(lose,g);assert.equal(lose.match,2);assert.equal(lose.clears,undefined);assert.equal(A.char(lose,'milo').totalXp,8);
// Gagner le défi courant avance une seule fois et fait apparaître le boss.
const win=new B.Game({...A.buildMatch(lose,{difficulty:2}),ctrl:['p1','cpu'],intro:false});win.winner=0;A.record(lose,win);assert.equal(lose.match,3);assert.ok(A.next(lose).boss);assert.equal(lose.clears[win.teams[1].id][2],1);
// Les boss battus sont rejouables sans refaire avancer la campagne.
lose.bosses=1;const boss=A.buildMatch(lose,{teamId:B.BOSS_TEAMS[0].id,replay:true,difficulty:4}),bg=new B.Game({...boss,ctrl:['p1','cpu'],intro:false});assert.equal(bg.inner(1)[0].maxHp,300);bg.winner=0;A.record(lose,bg);assert.equal(lose.match,3);assert.equal(lose.bosses,1);
console.log('OK : 5 difficultés, IA et stats croissantes, XP et prime d’équipe, trophées persistants, replays sans progression, boss, anciens déblocages et attribution unique.');
