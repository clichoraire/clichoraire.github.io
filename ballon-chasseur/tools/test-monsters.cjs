'use strict';
const assert=require('node:assert/strict');
global.window={};const saved=new Map();global.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
let seed=123456;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(const f of ['config','monsters','game','powers','ai','adventure'])require('../js/'+f+'.js');
const BC=window.BC,A=BC.Adventure;
assert.equal(BC.MONSTER_TEAMS.length,12);assert.equal(BC.TEAMS.length,4);assert.equal(A.allIds().length,15);
const family=['matthieu','marie','alexie','edison','richard','milo'];
const s=A.start('matthieu');s.team={inner:family.slice(0,3),outer:family.slice(3)};
assert.ok(A.teamComplete(s));
const ids=new Set();
for(let i=0;i<12;i++){
  s.match=i;const m=A.buildMatch(s),team=m.teams[1];
  assert.equal(m.next.stage,i+1);assert.equal(team.players.length,6);assert.ok(BC.COURTS[team.court].monster);
  const g=new BC.Game({...m,ctrl:['cpu','cpu'],intro:false,mode:'adventure'});
  assert.deepEqual(g.players.filter(p=>p.team===0).map(p=>p.id),family);
  for(const p of g.players.filter(p=>p.team===1)){assert.ok(p.def.monster);assert.ok(!A.allIds().includes(p.id));assert.ok(!ids.has(p.id));ids.add(p.id);}
  for(let t=0;t<300&&g.phase!=='end';t+=BC.STEP)g.update(BC.STEP);
  assert.equal(g.phase,'end','match terminé : '+team.name);
  assert.ok(g.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.hp)));
}
assert.equal(ids.size,72);
s.match=12;assert.equal(A.next(s).team,BC.MONSTER_TEAMS[0]);assert.equal(A.next(s).chapter,2);
s.match=120;const high=A.buildMatch(s);assert.ok(Object.values(high.stats).every(st=>Object.values(st).every(v=>v<=18)));
for(const id of ['hex','venom','screech','rootcry']){
  s.match=0;const m=A.buildMatch(s),g=new BC.Game({...m,ctrl:['cpu','cpu'],intro:false});const p=g.inner(1)[0];p.power.id=id;p.power.kind='instant';p.power.charge=p.power.max;
  assert.ok(g.usePower(p));
  assert.ok(g.inner(0).every(q=>id==='hex'?q.fx.slowT===6:id==='venom'?q.hp===q.maxHp-3&&q.fx.slowT===3:q.state==='stun'));
}
s.match=9;const troll=new BC.Game({...A.buildMatch(s),ctrl:['cpu','cpu'],intro:false}).inner(1)[0];assert.ok(troll.phys.regen);
s.team.outer[0]=s.team.inner[0];assert.ok(!A.teamComplete(s));assert.throws(()=>A.buildMatch(s));
console.log('12 campagnes jouables, 72 monstres distincts, équipe multifamille, capacités, progression et plafonds : OK.');
