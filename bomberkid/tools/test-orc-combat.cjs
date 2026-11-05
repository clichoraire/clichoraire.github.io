const assert=require('node:assert/strict'),BK=require('./headless');
const arena=()=>{
 const W=new BK.World({map:['.......','...#...','.......'],theme:'garden',mode:'adventure',hearts:true,explore:true,itemChance:0});
 const p=W.addPlayer(BK.charById('adam'),4,0,{hp:40}),o=W.addEnemy('orque',2,1);
 Object.assign(o,{x:2.55,y:1.5,state:'chase',leash:9,stateT:1});Object.assign(p,{x:3.5,y:.6});return {W,p,o};
};
for(const fps of [30,60,120]) {
 const {W,p,o}=arena();
 assert(!W.enemyCanSee(o,p,9),'le coin masque la cible à la vue normale');
 assert(W.orcSwordReach(o,p),'le contour du coin reste à portée');
 for(let i=0;i<fps;i++){W.updateEnemy(o,1/fps);p.x=3.5;p.y=.6;}
 assert.equal(p.hp,25,'un coup inflige 15 dégâts, puis invulnérabilité');
 assert(W.events.some(e=>e.type==='swing'),'animation du coup déclenchée');
}
{
 const {W,p,o}=arena();Object.assign(o,{x:2.9,y:1.5});Object.assign(p,{x:4.1,y:1.5});
 assert(!W.orcSwordReach(o,p),'mur plein entre deux personnages proches');
 for(let n=0;n<60;n++)W.updateEnemy(o,1/60);
 assert.equal(p.hp,40,'aucun dégât à travers le mur');
}
for(const condition of ['height','air','falling','invulnerable','far','dead']) {
 const {W,p,o}=arena();
 if(condition==='height')W.height[W.idx(3,0)]=.6;
 if(condition==='air')p.air={};if(condition==='falling')p.falling={};
 if(condition==='invulnerable')p.invuln=10;if(condition==='far')p.x=6.5;if(condition==='dead')p.alive=false;
 for(let n=0;n<60;n++)W.updateEnemy(o,1/60);
 assert.equal(p.hp,40,condition+' protège du coup');
}
console.log('Orque : frappe autour du coin à 30/60/120 Hz, dégâts et invulnérabilité ; murs, hauteur, sauts et portée respectés.');
