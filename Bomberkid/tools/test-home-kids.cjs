const assert=require('node:assert/strict');
const BK=global.window={BK:{}};
require('../js/home-kids.js');
const pose=BK.BK.homeKidsPose;
assert.equal(pose(1,0,4,false),0);
assert.equal(pose(4.08,0,4,false),1);
assert.equal(pose(4.2,0,4,false),0);
assert.equal(pose(10,11.7,10,false),2);
assert.equal(pose(10.2,11.7,10,false),3);
assert.equal(pose(12,11.7,15,false),0);
assert.equal(pose(4.08,0,4,true),0);
assert.equal(pose(10.2,11.7,10,true),2);
console.log('Accueil : repos, clignement, coucou, retour au repos et mouvements réduits vérifiés.');

// Le clignement dessine exactement le même corps ; seuls deux petits yeux sont ajoutés.
for(let row=0;row<5;row++){
 const calls=[],ctx=new Proxy({},{get:(_,method)=>(...args)=>calls.push([method,...args])}),sheet={};
 BK.BK.drawHomeKid(ctx,sheet,row,0);const idle=calls.find(c=>c[0]==='drawImage');calls.length=0;
 BK.BK.drawHomeKid(ctx,sheet,row,1);const blink=calls.filter(c=>c[0]==='drawImage');assert.deepEqual(blink[0],idle);assert.equal(blink.length,3);
 for(const patch of blink.slice(1)){assert.equal(patch[4],38);assert.equal(patch[5],30);}
 calls.length=0;BK.BK.drawHomeKid(ctx,sheet,row,2,-.09);const left=calls.filter(c=>c[0]==='drawImage');calls.length=0;
 BK.BK.drawHomeKid(ctx,sheet,row,3,.09);assert.deepEqual(calls.filter(c=>c[0]==='drawImage'),left);
}
console.log('Cinq enfants : corps identiques au clignement, tête fixe pendant le coucou.');
