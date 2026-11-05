const assert=require('node:assert/strict'),BK=require('./headless');
const W=new BK.World({map:['.......','.......','.......'],theme:'garden',mode:'adventure',explore:true});
const p=W.addPlayer(BK.charById('adam'),2,1);W.placeBomb(p);const b=W.bombs[0];
assert.equal(p.bombjump,false);W.hopOnto(p,b);assert.equal(p.air,null);W.leap(p,3);assert.equal(p.air,null);
W.giveItem(p,'kick');W.hopOnto(p,b);assert.equal(p.air,null,'kick ne donne pas le saut');
W.giveItem(p,'bombjump');W.hopOnto(p,b);assert(p.air);W.updateAir(p,1);assert.equal(p.onBomb,b);
W.leap(p,3);assert(p.air);assert.equal(p.air.x1,4.5);
assert(BK.EDITOR_TABS.some(t=>t.items?.some(it=>it.pickup==='bombjump')));
// Une arrivée sur une bombe via un trampoline ne débloque pas le pouvoir.
const q=W.addPlayer(BK.charById('adam'),1,1);q.air={x0:1.5,y0:1.5,z0:0,x1:b.x,y1:b.y,z1:.55,h:1,t:0,dur:.5};
W.updateAir(q,.5);assert.equal(q.onBomb,null);assert.equal(q.bombjump,false);
const save=BK.loadAdventure('adam');save.upgrades={...(save.upgrades||{}),bombjump:1};BK.saveAdventure('adam',save);
const A=new BK.Adventure('adam',0);assert.equal(A.player.bombjump,true,'achat restauré au départ');
console.log('Saut sur bombe : verrouillage par défaut, pouvoir indépendant du kick, acquisition, éditeur, restauration et trampoline OK.');
