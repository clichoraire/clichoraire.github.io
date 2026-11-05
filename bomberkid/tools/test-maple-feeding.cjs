const assert=require('node:assert/strict'),BK=require('./headless');
const map=()=>Array.from({length:9},()=>'.'.repeat(9));
function world(){return new BK.World({map:map(),theme:'garden',mode:'adventure',explore:true,hearts:true,itemChance:0});}
// Utiliser une nourriture, même avec la vie basse, nourrit le petit à deux cases de centre à centre.
for(const food of BK.HATCHLING_FOODS)for(const dir of BK.DIRS){
 const w=world(),p=w.addPlayer(BK.charById('adam'),4,4),e=w.addEnemy('baby_dragon',4+2*dir.dx,4+2*dir.dy);
 p.hp=10;p.inv=[{type:food,n:2}];assert(w.useItem(p,0));assert.equal(p.hp,10);assert.equal(p.inv[0].n,1);assert.equal(e.bond.meals,1);
 assert.equal(w.nearbyPet(p,food),e);
}
// Un animal plus proche qui refuse l'aliment n'empêche pas de nourrir le dragon.
{
 const w=world(),p=w.addPlayer(BK.charById('adam'),2,4);w.addEnemy('chat',3,4);const e=w.addEnemy('baby_dragon',4,4);
 p.hp=10;p.inv=[{type:'maplesyrup',n:1}];assert(w.useItem(p,0));assert.equal(e.bond.meals,1);assert.equal(p.hp,10);
}
for(const obstacle of ['wall','height','distance']){
 const w=world(),p=w.addPlayer(BK.charById('adam'),2,4),e=w.addEnemy('baby_dragon',4,4);
 if(obstacle==='wall')w.cells[w.idx(3,4)]=BK.HARD;else if(obstacle==='height')w.height[w.idx(4,4)]=.6;else e.x=6.5;
 assert.equal(w.nearbyPet(p,'maplesyrup'),null);p.hp=10;p.inv=[{type:'maplesyrup',n:1}];assert(w.useItem(p,0));assert.equal(p.hp,15);assert(!e.bond);
}
function maple(style='erable'){
 const rows=map();rows[4]='....T....';return new BK.World({map:rows,props:{'4,4':{style}},theme:'garden',mode:'adventure',explore:true,hearts:true,itemChance:0});
}
{
 const w=maple(),p=w.addPlayer(BK.charById('adam'),4,5);p.dir=2;
 w.updateMaples(299.9);assert(!w.harvestMaple(p));w.updateMaples(.1);assert.equal(w.items.length,0);assert(w.harvestMaple(p));
 assert(p.inv.some(s=>s.type==='maplesyrup'));assert(!w.harvestMaple(p));
 w.updateMaples(300);w.trees=[];assert(!w.harvestMaple(p),'arbre abattu : plus de récolte');
}
{
 const w=maple('chene');w.updateMaples(600);assert.equal(w.items.length,0);
}
{
 const w=maple();for(const d of BK.DIRS)w.cells[w.idx(4+d.dx,4+d.dy)]=BK.HARD;
 w.updateMaples(300);assert.equal(w.items.length,0);w.cells[w.idx(4,5)]=0;w.updateMaples(.1);assert.equal(w.mapleGrowth.get('4,4'),300,'récolte prête conservée si le pied est bloqué');
}
{
 const w=maple();w.frozen=true;w.update(300);assert.equal(w.items.length,0);w.frozen=false;w.update(.01);assert.equal(w.items.length,0,'pause ne fait pas pousser le sirop');
}
assert(BK.EDITOR_TABS.flatMap(t=>t.items||[]).some(i=>i.name==='Herbes hautes 1'));
assert(BK.EDITOR_TABS.flatMap(t=>t.items||[]).some(i=>i.name==='Herbes hautes 2'));
console.log('Érable : 5 minutes, répétition, blocage, pause, récolte et arbre abattu ; nourriture prioritaire à distance, obstacles et deux herbes OK.');
