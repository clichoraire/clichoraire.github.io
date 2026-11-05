const assert=require('node:assert/strict'),BK=require('./headless');
function make(kind='castle_egg',lv=0){
 const map=Array.from({length:9},()=>Array(11).fill('.'));map[4][4]='"';
 const props={'4,4':{deco:kind,lv},'3,4':{lv}};
 const w=new BK.World({map:map.map(r=>r.join('')),props,theme:'garden',mode:'adventure',explore:true,hearts:true,itemChance:0});
 const p=w.addPlayer(BK.charById('adam'),3,4);w.placeBomb(p);const b=w.bombs[0];return {w,p,b};
}
for(const [kind,def] of Object.entries(BK.HATCHING_EGGS))for(const lv of [0,3])for(const blast of ['normal','dome','giga']){
 const {w,p,b}=make(kind,lv);if(blast!=='normal')b[blast]=true;
 w.explodeBomb(b);assert.equal(w.cell(4,4),0);assert.equal(w.deco[w.idx(4,4)],kind+'_shell');
 assert(Math.abs(w.groundZ(4.5,4.5)-lv*.6)<1e-6);
 const e=w.enemies.find(e=>e.type===def.id);assert(e);w.checkHits();assert(!e.dead,'survit à son éclosion');
 w.blastRay(3,4,3,3,{owner:p,level:1});assert.equal(w.enemies.filter(e=>e.type===def.id).length,1);
 assert(BK.EDITOR_TABS.flatMap(t=>t.items||[]).some(i=>i.deco===kind));
}
for(const food of BK.HATCHLING_FOODS)for(const mealFirst of [false,true]){
 const {w,p,b}=make();w.explodeBomb(b);w.flames=[];w.flameAt.clear();w.time=2;
 const e=w.enemies[0],foe=w.addEnemy('gluant',7,4);p.inv=[{type:food,n:2}];
 if(mealFirst)assert(w.feedPet(p,e,food));else assert(w.petAnimal(p));
 assert.equal(w.updateAnimalFriend(e,.1),false,'les deux soins sont requis');
 w.time+=BK.FEED_ANIMATION_TIME;
 if(mealFirst)assert(w.petAnimal(p));else assert(w.feedPet(p,e,food));
 assert.equal(e.bond.pets,1);assert.equal(e.bond.meals,1);assert.equal(p.inv[0].n,1);
 assert(w.updateAnimalFriend(e,.1));assert.equal(w.flames.length,3);assert(w.flameAt.has(w.idx(7,4)));assert(!w.flameAt.has(w.idx(8,4)));
 const f=w.flameAt.get(w.idx(7,4)),hp=p.hp;
 assert.equal(w.hitPlayer(p,{kind:'flame',owner:p,bomb:f.bomb}),false);assert.equal(p.hp,hp);
 w.checkHits();assert(foe.dead,'le petit dragon peut vaincre un ennemi');
 w.time+=100;w.updatePeaceful(e,.1);assert.equal(e.follow,p,'l’amitié ne nécessite pas de repas répétés');
}
// Pas de souffle à travers un mur ni vers une cible sur un autre étage.
for(const obstruction of ['wall','height']){
 const {w,p,b}=make();w.explodeBomb(b);w.flames=[];w.flameAt.clear();w.time=2;
 const e=w.enemies[0];e.follow=p;e.followT=60;e.bond={owner:p.id,pets:1,meals:1};w.addEnemy('gluant',7,4);
 if(obstruction==='wall')w.cells[w.idx(6,4)]=BK.HARD;else w.height[w.idx(6,4)]=.6;
 w.updateAnimalFriend(e,.1);assert.equal(w.flames.length,0);
}
// Les autres petits utilisent l'aide au contact, après une seule caresse et un repas.
for(const kind of ['egg_turtle','egg_duck','egg_owl']){
 const {w,p,b}=make(kind);w.explodeBomb(b);w.time=2;w.flameAt.clear();w.flames=[];
 const e=w.enemies[0];p.inv=[{type:'honey',n:1}];w.petAnimal(p);w.time+=BK.PET_ANIMATION_TIME;w.feedPet(p,e,'honey');
 const foe=w.addEnemy('gluant',5,4);foe.x=5.2;
 w.updateAnimalFriend(e,.1);assert(foe.dead);
}
console.log('Œufs : 4 espèces, trois explosions, étages, éclosion unique, tous les aliments, soins dans les deux ordres, portée 3, murs et amitié OK.');
// Le feu allié ne blesse ni le héros dans le rayon ni un animal paisible à côté.
{
 const {w,p,b}=make();w.explodeBomb(b);w.time=2;w.flames=[];w.flameAt.clear();p.inv=[{type:'carrot',n:1}];
 const e=w.enemies[0];w.petAnimal(p);w.time+=BK.PET_ANIMATION_TIME;w.feedPet(p,e,'carrot');w.addEnemy('gluant',7,4);
 const other=w.addEnemy('wild_faon',6,4);w.updateAnimalFriend(e,.1);p.x=5.5;p.invuln=0;
 const hp=p.hp,old=BK.settings.friendlyFire;BK.settings.friendlyFire=true;
 try{w.checkHits();assert.equal(p.hp,hp);assert(!other.dead);assert(!e.dead);}finally{BK.settings.friendlyFire=old;}
 const foods=p.inv;p.inv=[{type:'wood',n:1}];assert.equal(w.feedPet(p,e,'wood'),false);assert.equal(p.inv[0].n,1);p.inv=foods;
}
console.log('Souffle allié : héros et animaux protégés même avec tirs amis ; objets non comestibles refusés.');
