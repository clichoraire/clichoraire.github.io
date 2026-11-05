const assert=require('node:assert/strict'),BK=require('./headless');
const w=new BK.World({map:['.....','..T..','.....','.....'],props:{'2,1':{style:'erable'}},mode:'adventure',explore:true});
const p=w.addPlayer(BK.charById('adam'),2,2);p.dir=2;
w.updateMaples(299);assert(!w.harvestMaple(p));w.updateMaples(1);assert(!w.items.length);assert(!w.floaters.length);
p.input.bomb=true;w.updatePlayer(p,1/60);assert(!w.bombs.length);assert(p.inv.some(s=>s.type==='maplesyrup'&&s.n===1));assert.equal(w.mapleGrowth.get('2,1'),0);assert(!w.harvestMaple(p));
console.log('Érable : prêt à 300 s, aucun objet automatique, récolte avec Entrée sans bombe, une seule portion OK.');
let labels=[];const ctx=new Proxy({measureText:s=>({width:s.length*9}),fillText:s=>labels.push(s)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),cam=new BK.Camera(800,600);
w.drawMaplePrompt(ctx,cam);assert(!labels.length);w.updateMaples(300);w.drawMaplePrompt(ctx,cam);assert.deepEqual(labels,['🍁 Entrée']);labels=[];p.x=.5;w.drawMaplePrompt(ctx,cam);assert(!labels.length);
for(const floor of [',','.']){
 const map=Array.from({length:7},()=>Array(7).fill(floor));map[3][3]='"';
 const w2=new BK.World({map:map.map(r=>r.join('')),props:{'3,3':{deco:'market',lv:4}},explore:true});
 assert.equal(w2.tAt(3,3),w2.tAt(2,3),'sol sous objet hérité sans perdre sa hauteur');assert(w2.hAt(3,3)>2);
}
console.log('Bulle : uniquement si prêt et adjacent ; objets surélevés : herbe ou pierre conservée OK.');
