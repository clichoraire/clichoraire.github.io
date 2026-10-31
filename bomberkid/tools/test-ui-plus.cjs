// Retouches d'interface et d'animation : dessin du personnage dans toutes les poses et vues (bras mélangés, bombe portée,
// flash rouge), couleurs de chats, sac depuis la carte des mondes, case du bouton Pause, bombes en vol devant les blocs.
const assert=require('node:assert/strict'),BK=require('./headless');
BK.audio=new Proxy(BK.audio||{},{get:(t,k)=>k in t?t[k]:()=>{}});
// Un contexte 2D factice : toute méthode est un no-op, les mesures renvoient une largeur fixe.
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):/Gradient$/.test(k)?()=>({addColorStop(){}}):k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):typeof t[k]!=='undefined'?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
let drawn=0;
for(const id of ['adam','josee','milo']){const def=BK.charById(id);
 for(const pose of BK.POSES)for(const view of ['front','side','back'])for(const t of [0,.12,.3,.5,1.2]){
  BK.sprites.drawCharacter(ctx,def,{s:60,pose,t,poseT:t,view,flip:view==='side'&&t>.3,carrying:pose==='pickup'||pose==='carry'||pose==='carrywalk',walk:t*9});drawn++;
 }
}
assert(drawn>3*BK.POSES.length*3*5-1,'toutes les poses dessinées sans erreur : '+drawn);
BK.sprites.drawCharacter(ctx,BK.charById('adam'),{s:60,pose:'hit',t:.2,poseT:.2,view:'front'});   // pas de document : pas de teinte, pas d'erreur
// chats de toutes les couleurs
assert(Object.keys(BK.CAT_COLORS).length>=6);
for(const color of Object.keys(BK.CAT_COLORS))BK.sprites.drawAnimal(ctx,'chat',{s:60,t:1,catColor:color,state:'walk'});
const W=new BK.World({map:['#####','#1..#','#...#','#####'],theme:'garden',mode:'adventure',hearts:true,explore:true});
const cat=W.addEnemy('chat',2,2,{catColor:'noir'});assert.equal(cat.catColor,'noir');
BK.sprites.drawEnemy(ctx,'chat',{s:60,t:1,creature:cat});
assert.equal(BK.EDITOR_TABS.flatMap(t=>t.items).find(i=>i.enemy==='chat').opts,'cat','option de couleur dans l’éditeur');
// la carte des mondes prête son héros au sac
BK.saveAdventure('adam',{unlocked:1,best:{},score:0,inv:[{type:'honey',n:2}],bagSlots:[],quickSlots:[]});
const ws=new BK.WorldSelect('adam');const host=ws.bagHost();
assert(host&&host.world&&host.player===ws.player&&Array.isArray(host.player.inv),'hôte du sac depuis la carte');
assert.equal(host.player.inv[0].type,'honey');assert.equal(host.player.inv[0].perm,2);
host.player.inv[0].perm=1;host.syncInv();assert.equal(ws.save.inv[0].n,1,'le sac se resynchronise dans la sauvegarde');
// la case du bouton Pause reste libre : les cadres de droite s'arrêtent avant
assert.deepEqual(BK.PAUSE_RECT,{x:1156,y:12,w:110,h:48});
// une bombe en vol se classe devant les cases qu'elle survole (profondeur + hauteur)
const p=W.players[0]||W.addPlayer(BK.charById('adam'),1,1,{});W.placeBomb(p);const b=W.bombs[0];assert(b);
W.pickupBomb(p);assert.equal(b.state,'carried');W.throwBomb(p);assert.equal(b.state,'flying');
W.updateBombs(.1);assert(b.z>0,'la bombe lancée est en l’air');
const src=require('fs').readFileSync(require('path').join(__dirname,'..','js','world.js'),'utf8');
assert(src.includes("push(b.y + (b.state === 'flying' ? Math.max(0, b.z) * 0.9 : 0)"),'tri de profondeur des bombes en vol');
assert.equal(BK.MATCH_HEARTS,3);
console.log('UI plus : poses/vues du personnage ('+drawn+' dessins), chats colorés, sac sur la carte des mondes, case Pause, bombes en vol OK.');

// ---- bulles successives, lanterne dans le sac puis la ceinture, article du comptoir avant la chaise, géant/mini, dôme carré, magicien étourdi
{
 const parts=BK.splitSpeech('Merci ! Lanterne à fée : Range-la dans ta ceinture (raccourcis 1 à 8 du sac) pour la porter : la fée s’allume toute seule le soir et éclaire tout autour. Le jour, elle dort.');
 assert(parts.length>=3&&parts.every(p=>p.length<=60),'texte long coupé en bulles courtes');
 assert.equal(BK.splitSpeech('Salut !').length,1);
 const W=new BK.World({map:['#######','#1....#','#.....#','#######'],theme:'garden',mode:'adventure',hearts:true,explore:true});
 const npc=W.addNpc(BK.charById('josee'),4,1,[]);BK.say(npc,parts.join(' '));assert.equal(npc.say,parts[0]);assert.equal(npc.sayQueue.length,parts.length-1);
 for(let i=0;i<60*8&&npc.say===parts[0];i++)W.update(1/60);assert.equal(npc.say,parts[1],'la bulle suivante prend le relais');
 // lanterne : achat → sac, portée seulement depuis la ceinture
 const save={unlocked:1,best:{},score:0,gold:200,upgrades:{},inv:[]};const res=BK.buyUpgrade(save,'lantern');assert(res.ok);assert.equal(save.inv[0].type,'lantern');assert(!save.upgrades.lantern);assert.equal(save.gold,110);
 assert(!BK.buyUpgrade(save,'lantern').ok,'une seule lanterne');
 const p=W.players[0];p.inv=[{type:'lantern',n:1,perm:1}];p.quickSlots=[];assert(!BK.wearsLantern(p));p.quickSlots=['lantern'];assert(BK.wearsLantern(p));assert(BK.ITEMS.lantern.usable&&BK.ITEMS.lantern.unique);
 // article du comptoir : pas de « s'asseoir » quand on est sur un article
 const S=new BK.World({map:['#####','#1R.#','#...#','#####'],theme:'interior',mode:'adventure',hearts:true,explore:true});const h=S.players[0]||S.addPlayer(BK.charById('adam'),1,1,{});h.x=1.5;h.y=1.5;
 assert(S.nearbySeat(h),'chaise voisine');h.nearDisplay={id:'honey',price:5};assert(!S.nearbySeat(h),'sur un article : achat avant la chaise');h.nearDisplay=null;
 // géant : bombes plus grosses ; mini : course deux fois plus rapide
 h.sizeScale=2;S.placeBomb(h);assert(S.bombs[0].big);S.bombs.length=0;h.bombsOut=0;h.sizeScale=1;S.placeBomb(h);assert(!S.bombs[0].big);
 assert(src.includes("BK.RUN_MULT * ((p.sizeScale || 1) < 1 ? 2 : 1)"),'mini court deux fois plus vite');
 // dôme : tout le carré, à travers les blocs mous, pas à travers les murs
 const D=new BK.World({map:['#########','#.......#','#.xxx...#','#.x1x.#.#','#.xxx.#.#','#.......#','#########'],theme:'garden',mode:'adventure',hearts:true,explore:true});
 const q=D.players[0]||D.addPlayer(BK.charById('adam'),3,3,{});q.dome=true;q.fire=2;q.x=3.5;q.y=3.5;D.placeBomb(q);const bomb=D.bombs[0];assert(bomb.dome);
 const cells=D.domeCells(bomb,3,3),keys=new Set(cells.map(c=>c.c+','+c.r));
 for(let y=1;y<=5;y++)for(let x=1;x<=5;x++)assert(keys.has(x+','+y),'case '+x+','+y+' dans le carré');
 assert(!keys.has('6,3')&&!keys.has('7,3'),'le mur arrête le feu');assert(!keys.has('0,3')&&!keys.has('3,0'),'bordure');
 D.explodeBomb(bomb);assert(D.cell(2,2)===0&&D.cell(4,4)===0&&D.cell(2,3)===0,'les blocs mous du carré sont cassés');
 // magicien : une bombe bottée dans la figure = étoiles et trois secondes sans bouger
 const M=new BK.World({map:['#######','#1....#','#.....#','#######'],theme:'castle',mode:'adventure',hearts:true,explore:true});const k=M.players[0]||M.addPlayer(BK.charById('adam'),1,1,{kick:true});k.kick=true;k.x=1.5;k.y=1.5;
 const mage=M.addEnemy('magicien',4,1);M.placeBomb(k);const kb=M.bombs[0];M.kickBomb(kb,3,k);for(let i=0;i<60&&!(mage.stunT>0);i++)M.updateBombs(1/60);
 assert(mage.stunT>2.9,'magicien étourdi '+mage.stunT);assert.equal(kb.state,'idle','la bombe s’arrête contre lui');
 const x0=mage.x,y0=mage.y;for(let i=0;i<60;i++)M.updateEnemy(mage,1/60);assert(mage.x===x0&&mage.y===y0&&mage.stunT<2.1&&mage.stunT>1.9,'il ne bouge pas pendant l’étourdissement');
 console.log('Extras : bulles successives, lanterne sac → ceinture, comptoir avant chaise, géant/mini, dôme carré, magicien étourdi OK.');
}
