'use strict';const assert=require('node:assert/strict');global.window={};
for(const f of ['config','monsters','game','powers','ai','match-rules','manual-aim'])require('../js/'+f+'.js');const B=window.BC;
const make=mode=>{B.app={settings:{aimMode:mode}};const g=new B.Game({teams:[B.TEAMS[0],B.MONSTER_TEAMS[0]],ctrl:['p1','cpu'],intro:false,controlMode:'fixed'}),p=g.inner(0)[0];g.ai.update=()=>{};g.lock[0]=p;g.give(p);p.x=350;p.y=420;return {g,p};};
for(const mode of ['manual','auto']){
 const {g,p}=make(mode),y=p.y;g.update(1/60,[{a:true,dy:1}]);
 for(let i=0;i<22;i++)g.update(1/60,[{a:true,dy:1}]);
 assert.ok(p.y>y+35,'déplacement pendant charge');assert.ok(p.charging&&p.charge>0&&p.hasBall);
 for(let i=0;i<50;i++)g.update(1/60,[{a:true}]);
 assert.equal(p.charge,1);assert.equal(g.stats[0].throws,0);
 g.update(1/60,[{a:false}]);assert.equal(g.stats[0].throws,1);assert.equal(p.hasBall,false);
 for(const holdX of [true,false])for(const airborne of [true,false]){
  const {g,p}=make(mode);g.update(1/60,[{a:true}]);for(let i=0;i<15;i++)g.update(1/60,[{a:true}]);
  if(airborne){p.z=80;p.airborneJump=true;p.pending.jump=true;}
  g.update(1/60,[{a:holdX,b:true,dy:1}]);
  assert.equal(g.ball.state,'pass');assert.equal(g.ball.target.lane,'bottom');assert.equal(g.stats[0].throws,0);
  assert.equal(p.charging,false);assert.equal(p.charge,0);assert.equal(p.pending,null);assert.equal(p.fullAt,null);assert.equal(p.hasBall,false);
  g.update(1/60,[{a:false,b:false}]);assert.equal(g.stats[0].throws,0,'relâchement après passe sans lancer fantôme');
 }
}
console.log('OK : déplacement en charge manuelle/auto, charge complète tenue, passe au sol/en saut, priorité à la passe et aucun lancer au relâchement.');
