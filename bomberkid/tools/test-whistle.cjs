const assert=require('node:assert/strict'),BK=require('./headless');
function setup(){
 const W=new BK.World({map:Array(9).fill('.'.repeat(9)),mode:'adventure',explore:true,hearts:true});
 const p=W.addPlayer(BK.charById('adam'),4,4),ally=W.addPlayer(BK.charById('eliott'),0,0);Object.assign(ally,{ally:true,human:false,leader:p,path:[{c:1,r:1}],air:{},falling:{}});
 const dragon=W.addEnemy('baby_dragon',8,8);dragon.bond={owner:p.id,pets:1,meals:1};
 const cat=W.addEnemy('chat',0,8);cat.follow=p;cat.followT=4;
 const stranger=W.addEnemy('chien',8,0),npc=W.addNpc(BK.charById('richard'),2,0,['Bonjour']);
 return {W,p,ally,dragon,cat,stranger,npc};
}
for(const blocked of [false,true]){
 const {W,p,ally,dragon,cat,stranger,npc}=setup();
 if(blocked)for(const d of BK.DIRS)W.cells[W.idx(4+d.dx,4+d.dy)]=BK.HARD;
 assert.equal(W.whistleFollowers(p),3);
 for(const q of [ally,dragon,cat]){
  if(blocked){assert.equal(q.x,p.x);assert.equal(q.y,p.y);}else assert.equal(Math.abs(q.x-p.x)+Math.abs(q.y-p.y),1);
  assert.equal(q.air,null);assert.equal(q.falling,null);
 }
 if(!blocked)assert.equal(new Set([ally,dragon,cat].map(q=>q.x+','+q.y)).size,3);
 assert.equal(ally.path.length,0);assert.deepEqual(ally.safe,{x:ally.x,y:ally.y,dir:p.dir});
 assert.equal(stranger.x,8.5);assert.equal(npc.y,.5);assert.equal(dragon.follow,p);
}
{
 const {W,p,ally}=setup();for(const d of BK.DIRS)W.height[W.idx(4+d.dx,4+d.dy)]=1.2;
 W.whistleFollowers(p);assert.equal(ally.x,p.x);assert.equal(ally.y,p.y,'pas de téléportation sur un autre étage');
 p.air={};ally.x=.5;assert.equal(W.whistleFollowers(p),-1);assert.equal(ally.x,.5);
 p.air=null;ally.alive=false;assert.equal(W.whistleFollowers(p),2);assert.equal(ally.alive,false,'ne ressuscite pas les morts');
}
{
 const {W,p,ally}=setup(),A=new BK.Adventure('adam',0);A.world=W;A.player=p;A.state='play';A.whistleRect={x:1000,y:640,w:166,h:56};
 const old=BK.audio.whistle;let sounds=0;BK.audio.whistle=()=>sounds++;
 try{A.onClick(1050,660);assert.equal(sounds,1);assert(Math.abs(ally.x-p.x)+Math.abs(ally.y-p.y)<=1);}finally{BK.audio.whistle=old;}
}
console.log('Sifflet : bouton et son, alliés, animaux, amis éloignés, cases distinctes, blocage, étages, réinitialisation et exclusions OK.');
// Le vrai HUD ne présente aucun bouton quand il n'y a personne à rappeler.
{
 const A=new BK.Adventure('adam',0),W=A.world,p=A.player;
 A.state='play';W.players=W.players.filter(q=>q===p);W.enemies=[];
 let labels=[];const ctx=new Proxy({canvas:{width:1280,height:720},fillText:s=>labels.push(s),measureText:s=>({width:String(s).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 A.render(ctx);assert.equal(A.whistleRect,null);assert(!labels.includes('📣 Siffler'));
 const e=W.addEnemy('chat',1,1);e.follow=p;e.followT=10;labels=[];A.render(ctx);assert(A.whistleRect);assert(labels.includes('📣 Siffler'));
 e.follow=null;labels=[];A.render(ctx);assert.equal(A.whistleRect,null);assert(!labels.includes('📣 Siffler'));
}
console.log('HUD : Siffler apparaît avec un compagnon et disparaît quand personne ne suit.');
