const assert=require('node:assert/strict'),BK=require('./headless');
for(const dir of [0,1,2,3])for(const type of ['baby_dragon','baby_turtle','baby_duck','baby_owl','chat','chien','wild_faon']){
 const D=BK.DIRS[dir],map=Array.from({length:9},()=>Array(9).fill(' ')),props={};
 for(let n=-2;n<=2;n++){const c=4+D.dx*n,r=4+D.dy*n;map[r][c]='.';props[c+','+r]={lv:n>0?1:0};}
 props['4,4']={lv:0,ramp:true,rampDir:[1,-2,-1,2][dir]};
 const W=new BK.World({map:map.map(r=>r.join('')),props,mode:'adventure',explore:true,hearts:true});
 const p=W.addPlayer(BK.charById('adam'),4+2*D.dx,4+2*D.dy),e=W.addEnemy(type,4-2*D.dx,4-2*D.dy);
 Object.assign(e,{follow:p,followT:60,fedT:60,pause:0});if(e.def.hatchling)e.bond={owner:p.id,pets:1,meals:1};
 for(let i=0;i<480;i++){W.time+=1/60;W.updateEnemy(e,1/60);assert(!e.followFlight,'la rampe doit se parcourir à pied');}
 assert(Math.hypot(e.x-p.x,e.y-p.y)<1.2,`${type} monte la pente, direction ${dir}`);assert(W.groundZ(e.x,e.y)>.55);
 p.x=4.5-2*D.dx;p.y=4.5-2*D.dy;
 for(let i=0;i<480;i++){W.time+=1/60;W.updateEnemy(e,1/60);}
 assert(Math.hypot(e.x-p.x,e.y-p.y)<1.2,`${type} redescend`);
}
// Une rivière sépare le dragon de son maître arrivé sur un plateau après un saut.
{
 const W=new BK.World({map:Array(7).fill('...~~....'),props:{'6,3':{lv:3}},mode:'adventure',explore:true,hearts:true});
 const p=W.addPlayer(BK.charById('adam'),6,3),e=W.addEnemy('baby_dragon',2,3);e.bond={owner:p.id,pets:1,meals:1};e.petT=0;
 p.air={};for(let i=0;i<120;i++)W.updateEnemy(e,1/60);assert(!e.followFlight,'attend l’atterrissage du héros');p.air=null;
 let flew=false;for(let i=0;i<480;i++){W.time+=1/60;W.updateEnemy(e,1/60);flew ||= !!e.followFlight;if(e.followFlight)assert(W.groundZ(e.x,e.y)+e.z>=0);}
 assert(flew);assert(Math.hypot(e.x-p.x,e.y-p.y)<1.1);assert.equal(e.z,0);assert.equal(e.followFlight,null);
}
console.log('Animaux : montée et descente de rampes dans quatre sens ; dragon à pied sur pente et vol après saut vers un plateau isolé OK.');
