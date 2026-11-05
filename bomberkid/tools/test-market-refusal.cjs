const assert=require('node:assert/strict'),BK=require('./headless');
const make=()=>new BK.World({map:Array(9).fill('.........'),mode:'adventure',explore:true,hearts:true});
for(let i=0;i<60;i++){
 const map=Array(9).fill('.........');map[4]='...."....';
 const w=new BK.World({map,props:{'4,4':{deco:'market'}},mode:'adventure',explore:true,hearts:true});
 const p=w.addPlayer(BK.charById('adam'),3,4);
 assert(w.cell(4,4),'l’étal bloque le passage avant l’explosion');
 assert(w.placeBomb(p));w.explodeBomb(w.bombs[0]);
 assert.equal(w.cell(4,4),0);assert.equal(w.deco[w.idx(4,4)],null);
 const food=w.items.filter(x=>x.type!=='coin'),gold=w.items.filter(x=>x.type==='coin');
 assert(food.length>=2&&food.length<=3);assert.equal(new Set(food.map(x=>x.type)).size,food.length);assert.equal(gold.length,2);
 assert.equal(new Set(w.items.map(it=>it.cx+','+it.cy)).size,w.items.length);
 for(const it of [...w.items]){p.x=it.cx+.5;p.y=it.cy+.5;w.updatePlayer(p,0);}
 assert.equal(p.gold,2);assert.equal(w.items.length,0);
}
for(const type of ['baby_dragon','wild_faon']){
 const w=make(),p=w.addPlayer(BK.charById('adam'),4,4),e=w.addEnemy(type,5,4);e.eggCare={pets:0,meals:1,foods:['carrot']};p.inv=[{type:'fish',n:2}];
 assert(w.useItem(p,0));assert.equal(p.inv[0].n,1);assert(!e.bond);assert(e.rejectUntil);assert(!w.canCareForPet(p,e));
 assert(!w.useItem(p,0));assert.equal(p.inv[0].n,1);
 let moved=false;for(let n=0;n<330;n++){w.time+=1/60;w.updateEnemy(e,1/60);moved ||= Math.hypot(e.x-5.5,e.y-4.5)>.15;}
 assert(moved);assert.equal(e.rejectUntil,0);assert.equal(e.rejectSpitAt,0);assert(!w.items.length,'aucune nourriture recrachée récupérable');
}
console.log('Étals : 2–3 aliments distincts et 2 pièces. Refus : portion détruite, pause, errance et retour OK.');
