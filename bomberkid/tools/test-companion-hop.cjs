const assert=require('node:assert/strict'),BK=require('./headless');
for(const type of ['wild_grenouille','baby_dragon'])for(const D of BK.DIRS){
 const map=Array.from({length:9},()=>Array(9).fill('.'));map[4+D.dy][4+D.dx]='#';
 const w=new BK.World({map:map.map(r=>r.join('')),mode:'adventure',explore:true});
 const p=w.addPlayer(BK.charById('adam'),4+3*D.dx,4+3*D.dy),e=w.addEnemy(type,4,4);
 Object.assign(e,{follow:p,followT:60,fedT:60,pause:0,petT:0});e.bond={owner:p.id,pets:2,meals:1};
 w.updateEnemy(e,1/60);assert(e.followHop,'franchit une case');let high=0;
 for(let i=0;i<70;i++){w.time+=1/60;w.updateEnemy(e,1/60);high=Math.max(high,e.z);}
 assert(high>1);assert(!e.followHop);assert(Math.hypot(e.x-p.x,e.y-p.y)<1.2);
 // Une réception bloquée interdit ce bond.
 e.x=4.5;e.y=4.5;e.pause=0;e.followFlight=null;w.cells[w.idx(4+2*D.dx,4+2*D.dy)]=BK.HARD;
 assert.equal(w.companionHop(e,p,1/60),false);
}
console.log('Grenouille et dragon : obstacle d’une case dans les quatre sens, arc aérien, atterrissage libre obligatoire OK.');
for(const type of ['wild_grenouille','baby_dragon']){
 const map=Array.from({length:9},()=>Array(9).fill('.'));
 const w=new BK.World({map:map.map(r=>r.join('')),props:{'4,4':{lv:5}},mode:'adventure',explore:true}),p=w.addPlayer(BK.charById('adam'),6,4),e=w.addEnemy(type,4,4);
 Object.assign(e,{follow:p,followT:60,fedT:60,pause:0,petT:0});e.bond={owner:p.id,pets:2,meals:1};
 w.updateEnemy(e,1/60);assert(e.followHop,'saute du plateau pour descendre');
 for(let i=0;i<200;i++){w.time+=1/60;w.updateEnemy(e,1/60);}
 assert(!e.followHop);assert(Math.hypot(e.x-p.x,e.y-p.y)<1.2);assert.equal(e.z,0);
}
console.log('Descente depuis la hauteur 5 : grenouille et petit dragon rejoignent le héros au sol OK.');
