const assert=require('node:assert/strict'),BK=require('./headless');
const w=new BK.World({map:Array(7).fill('.......'),mode:'adventure',explore:true,hearts:true});
const p=w.addPlayer(BK.charById('adam'),3,3),e=w.addEnemy('baby_dragon',4,3);
p.inv=[{type:'fish',n:2}];assert(w.petAnimal(p,e));assert.equal(p.pose,'pet');assert.equal(p.dir,3);
assert.equal(p.poseDur,1.2);assert.equal(w.petAnimal(p,e),false,'pas de redémarrage de la caresse');
const cam=new BK.Camera(1280,720);cam.fit(7,7);
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:10})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const visible=()=>{w.drawPetFood(ctx,cam);return w.petFoodRects.length>0;};
assert(!visible());p.input.dx=1;p.input.bomb=true;
for(let n=0;n<30;n++)w.update(1/60);
assert.equal(p.x,3.5,'le héros reste tourné vers l’animal pendant le geste');assert.equal(w.bombs.length,0);assert.equal(e.bond.pets,1);assert(!visible());
p.input.dx=0;p.input.bomb=false;
for(let n=0;n<45;n++)w.update(1/60);
assert.notEqual(p.pose,'pet');assert(!visible(),'le prochain besoin attend encore après la fin du geste');
for(let n=0;n<150;n++)w.update(1/60);
assert(visible());assert.equal(w.petFoodRects[0].need,'food');assert.equal(p.inv[0].n,2);
// La pose se dessine de face, dos et profil, au repos comme pendant les caresses.
for(const view of ['front','back','side'])for(const time of [0,.3,.5,.7,1.2])BK.sprites.drawCharacter(ctx,p.def,{s:80,pose:'pet',poseT:time,t:time,view});
console.log('Caresse : pose dédiée, orientation, geste 1,2 s, immobilité, bulle cachée puis pause 2,4 s, repas intact et rendu trois vues OK.');

// Repas : une seule portion, geste dédié et aucun besoin pendant la dégustation.
assert(w.feedPet(p,e,'fish'));assert.equal(p.pose,'feed');assert.equal(p.inv[0].n,1);assert(!visible());
assert.equal(w.feedPet(p,e,'fish'),false);assert.equal(w.useItem(p,0),false);assert.equal(p.inv[0].n,1);
for(const view of ['front','back','side'])for(const time of [0,.4,.8,1.6])BK.sprites.drawCharacter(ctx,p.def,{s:80,pose:'feed',poseT:time,t:time,view});
for(const a of BK.WILDLIFE)for(const flip of [false,true])BK.sprites.drawWildlife(ctx,a.id,{s:80,t:1,flip,state:'walk'});
console.log('Repas : animation, bulle masquée, portion unique et dessins des animaux OK.');
