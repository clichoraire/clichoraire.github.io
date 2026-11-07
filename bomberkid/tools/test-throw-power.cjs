// Lancer de bombe : un pouvoir (le héros de l'aventure ne l'a pas au départ, tout le monde l'a ailleurs),
// coffre à butin fixe (props["c,r"].loot) et tableau 1-1 : Matthieu à droite du piano, coffre du pré aux lapins.
const assert=require('node:assert/strict'),BK=require('./headless');
// Monde brut (match, duels, alliés) : on ramasse comme avant.
const W=new BK.World({map:['.......','.......','.......'],theme:'garden',mode:'adventure',explore:true});
const p=W.addPlayer(BK.charById('adam'),2,1,{throw:false});
assert.equal(W.addPlayer(BK.charById('milo'),5,1).throw,true,'par défaut, on lance (match, alliés)');
W.placeBomb(p);const b=W.bombs[0];
assert.equal(W.pickupBomb(p),false,'sans le pouvoir, la bombe reste au sol');assert.equal(p.carrying,null);assert.equal(b.state,'idle');
W.giveItem(p,'throw');assert.equal(p.throw,true);
assert(W.pickupBomb(p),'avec le pouvoir, on ramasse');assert.equal(p.carrying,b);assert(W.throwBomb(p));assert.equal(b.state,'flying');
assert(BK.BOMB_POWERS.includes('throw'));assert(BK.EDITOR_TABS.some(t=>t.items?.some(it=>it.pickup==='throw')),'posable dans l’éditeur');
// Coffre à butin fixe : les objets de loot sortent tous, en plus des pièces.
const C=new BK.World({map:['.....','..O..','.....'],theme:'garden',mode:'adventure',explore:true,props:{'2,1':{loot:['bombjump','throw']}}});
C.destroyChest(2,1,null);
const types=C.items.map(it=>it.type);
assert(types.includes('bombjump')&&types.includes('throw'),'le coffre livre le saut sur bombe et le lancer');
assert(types.filter(t=>t==='coin').length>=3);
// Aventure : le héros part sans le pouvoir ; trouvé, il est gardé dans la sauvegarde.
localStorage.removeItem('bk.adventure.adam');
const A=new BK.Adventure('adam',0);assert.equal(A.player.throw,false,'pas de lancer au départ de l’aventure');
assert.equal(A.player.bombjump,false);
A.state='play';A.world.frozen=false;A.world.spawnItem(Math.floor(A.player.x),Math.floor(A.player.y),'throw');
A.update(1/60);assert.equal(A.player.throw,true);assert.equal(BK.loadAdventure('adam').upgrades.throw,1,'le lancer trouvé est gardé pour toujours');
const B=new BK.Adventure('adam',0);assert.equal(B.player.throw,true,'restauré au tableau suivant');
// Tableau 1-1 : la maison des alliés (5,88) et le coffre du pré aux lapins (2,64).
const S=BK.STAGE_1_1,house=S.houses['5,88'].interior,matt=house.npcs.find(n=>n.id==='matthieu');
assert.deepEqual([matt.c,matt.r],[2,5],'Matthieu à droite du piano');
assert.equal(house.grid[5][1],'@');assert.equal(house.grid[5][2],'y','la plante a cédé sa place');
assert.equal(S.grid[64][2],'O');assert.deepEqual(S.props['2,64'].loot,['bombjump','throw']);
const T=new BK.World({map:S.grid,theme:S.theme,mode:'adventure',explore:true,hearts:true,props:S.props,houses:S.houses});
T.destroyChest(2,64,null);const got=T.items.map(it=>it.type);assert(got.includes('bombjump')&&got.includes('throw'),'le coffre du 1-1 livre les deux pouvoirs');
console.log('Lancer de bombe : pouvoir verrouillé au départ, ramassage, coffre à butin fixe, sauvegarde, maison et coffre du 1-1 OK.');
