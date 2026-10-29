const assert=require('node:assert/strict'),BK=require('./headless');
const stages=BK.stageList().filter(s=>s.id.startsWith('2-'));assert.equal(stages.length,5);
function reachable(W){const seen=new Set(),todo=[W.starts[0]];while(todo.length){const q=todo.pop(),key=q.c+','+q.r;if(seen.has(key)||!W.inside(q.c,q.r)||(!W.walkableTerrain(q.c,q.r)&&!W.railAt(q.c,q.r)))continue;const cell=W.cell(q.c,q.r);if(cell&&cell!==2)continue;if(W.solidEnemyAt(q.c,q.r))continue;seen.add(key);for(const d of BK.DIRS)todo.push({c:q.c+d.dx,r:q.r+d.dy});}return seen;}
for(const s of stages){
 assert(s.map.length>=35&&s.map[0].length>=27);assert(s.map.every(row=>row.length===s.map[0].length));
 for(const pr of Object.values(s.props)){if(pr.item)assert(BK.ITEMS[pr.item],pr.item);if(pr.deco)assert(pr.deco in BK.DECO_PROPS||Object.values(BK.DECO).some(d=>d[0]===pr.deco),pr.deco);}
 const a=new BK.Adventure('adam',BK.stageList().findIndex(q=>q.id===s.id)),W=a.world,p=a.player;
 for(const e of W.enemies)assert(W.walkableTerrain(Math.floor(e.x),Math.floor(e.y))&&!W.cell(Math.floor(e.x),Math.floor(e.y)),s.id+' valid enemy spawn');
 if(W.exit)assert(!reachable(W).has(W.exit.c+','+W.exit.r),s.id+' gates initially protect exit');
 for(let pass=0;pass<5;pass++){
  const seen=reachable(W);
  for(const t of Object.values(W.targets))if(BK.DIRS.some(d=>seen.has((t.c+d.dx)+','+(t.r+d.dy))))W.hitTarget(t.letter,p);
 }
 assert(Object.values(W.targets).every(t=>t.hit),s.id+' all targets can be reached in order');
 if(W.exit)assert(reachable(W).has(W.exit.c+','+W.exit.r),s.id+' exit reachable after bombs and targets');
 else assert(reachable(W).has('14,10'),'bridge leads from arrival platform into arena');
 for(const d of W.doors)assert(reachable(W).has(d.c+','+(d.r+1)),s.id+' shop entrance reachable');
 a.state='play';W.frozen=false;p.invuln=999;
 for(let i=0;i<120;i++)a.update(1/60);
}
assert(stages[0].map.flatMap(r=>[...r]).filter(c=>c==='[').length<=8);
assert(stages.slice(1).every(s=>!s.map.some(r=>r.includes('['))),'lava confined to transition');
const a=new BK.Adventure('eliott',9),W=a.world,p=a.player;a.state='play';W.frozen=false;p.invuln=999;
const ally=W.addPlayer(BK.charById('richard'),14,20,{hp:30,lives:3});Object.assign(ally,{ally:true,leader:p,human:false});
const first=W.enemies.find(e=>e.castleBoss);assert(BK.ai.allyTargetable(first));W.hurtEnemy(first,p,99,'bomb');
assert(!a.objectiveDone());assert(!W.events.some(e=>e.type==='bossDead'));a.spawnBossChest(first);a.revealBossCrystal(first);assert(!W.bossChest&&!W.bossCrystal);
W.events.forEach(e=>e.carry=true);a.update(.01);assert.equal(a.state,'play');
for(let i=0;i<250;i++)a.update(1/60);
const final=W.enemies.find(e=>e.castleFinal);assert(final&&!final.dead);assert.notEqual(final.type,first.type);assert(final.maxHp>first.maxHp*2);assert(BK.ai.allyTargetable(final));assert(!W.bossChest&&!W.bossCrystal);
p.x=14.5;p.y=14.5;final.x=14.5;final.y=10.5;final.cool=0;W.updateBestiary(final,.01);assert(final.warning&&final.warning.t>=.8);
W.hurtEnemy(final,p,99,'bomb');W.events.forEach(e=>e.carry=true);a.update(.01);
assert(a.objectiveDone());assert(W.bossChest&&W.bossCrystal);assert(!W.bombs.length&&!W.shots.length);assert(W.bossSurvivors.includes(ally));
a.openBossChest();assert(BK.loadAdventure('eliott').crystals['2-5']);assert.equal(a.save.bossCompanions.destination,'2-5');
let menu;BK.overlay.show=o=>menu=o;a.state='clear';a.showBossRewards();assert(menu.html.includes('Cristal du château'));assert(!menu.buttons.some(b=>b.label.includes('monde 2')),'final chest never sends player backward');
console.log('Castle world: five authored maps, gates, destructible routes, entrances, spawns, simulation, surprise bosses, allies and final rewards passed.');
