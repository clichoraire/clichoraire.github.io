const assert=require('node:assert/strict'),BK=require('./headless');
const A=new BK.Adventure('adam',0),W=new BK.World({map:Array(7).fill('.......'),mode:'adventure',explore:true,hearts:true});
const p=W.addPlayer(BK.charById('adam'),3,3),e=W.addEnemy('baby_dragon',4,3);
A.world=W;A.player=p;A.state='play';p.inv=[{type:'poultrycooked',n:2}];
let text=[];const ctx=new Proxy({fillText:s=>text.push(s),strokeText:s=>text.push(s)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const cam=new BK.Camera(1280,720);cam.fit(7,7);
function draw(){text=[];W.drawPetFood(ctx,cam);return W.petFoodRects.find(r=>r.pet===e);}
function click(r){A.onClick(r.x+10,r.y+10);}
let r=draw();assert.equal(r.need,'pet');assert.deepEqual(text,['❤️','?']);click(r);
assert.equal(e.bond.pets,1);assert.equal(p.inv[0].n,2,'la caresse ne dépense rien');
assert.equal(draw(),undefined,'bulle masquée pendant le geste');W.time+=BK.PET_ANIMATION_TIME;assert.equal(draw(),undefined,'pause après le geste');W.time+=BK.PET_REQUEST_PAUSE+.01;
r=draw();assert.equal(r.need,'food');assert.deepEqual(text,['🍗','?'],'pas de quantité du sac ni de statistiques');click(r);
assert.equal(e.bond.meals,1);assert.equal(p.inv[0].n,1,'un seul aliment consommé');assert.equal(draw(),undefined);assert.deepEqual(text,[]);
click(r);assert.equal(p.inv[0].n,1,'un clic périmé ne donne pas un second repas');
// Nourri d’abord : il ne demande ensuite que l’affection manquante.
W.time+=4;e.bond={owner:p.id,pets:0,meals:1};r=draw();assert.equal(r.need,'pet');W.time+=2;click(r);assert.equal(draw(),undefined);
// La bulle d'un animal précis ne caresse pas celui qui est le plus près.
const other=W.addEnemy('baby_duck',3,4);other.x=3.7;other.y=3.5;e.bond={owner:p.id,pets:0,meals:0};W.time+=4;
click(draw());assert.equal(e.bond.pets,1);assert(!other.bond);
console.log('Demandes : cœur puis nourriture, gros ?, aucune statistique ni quantité, une portion, disparition et clic ciblé OK.');
