const assert=require('node:assert/strict'),BK=require('./headless');
const E=new BK.Editor({name:'Besoins',cols:9,rows:7,base:'.',theme:'garden'});
E.item=BK.EDITOR_TABS.flatMap(t=>t.items||[]).find(i=>i.deco==='castle_egg');
E.eggCare={pets:3,meals:2,foods:['fish','maplesyrup']};E.paint(4,3,true);
E.eggCare.foods.push('carrot');assert.deepEqual(E.props['4,3'].eggCare.foods,['fish','maplesyrup'],'chaque œuf possède sa propre liste');
E.eggCare={pets:0,meals:0,foods:null};E.paint(6,3,true);
const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,mode:'adventure',explore:true,hearts:true});
const p=W.addPlayer(BK.charById('adam'),3,3);W.destroyBlock(4,3,p);const e=W.enemies[0];
assert.deepEqual(e.eggCare,{pets:3,meals:2,foods:['fish','maplesyrup']});
p.inv=[{type:'meatcooked',n:3},{type:'fish',n:2},{type:'maplesyrup',n:1}];
assert.equal(W.feedPet(p,e,'meatcooked'),false);assert.equal(p.inv[0].n,3);
for(let n=0;n<3;n++){assert.equal(W.petNeed(p,e),'pet');W.petAnimal(p,e);W.time+=1.3;}
assert.equal(W.petNeed(p,e),'food');assert(!W.petBondReady(e));
assert(W.feedPet(p,e,'fish'));assert.equal(W.petNeed(p,e),'food');assert(!W.petBondReady(e));
W.time+=BK.FEED_ANIMATION_TIME;assert(W.feedPet(p,e,'maplesyrup'));assert.equal(W.petNeed(p,e),null);assert(W.petBondReady(e));
e.petT=0;W.addEnemy('gluant',5,3);assert(W.updateAnimalFriend(e,.1));assert(W.flames.length);
W.destroyBlock(6,3,p);const free=W.enemies.find(q=>q!==e&&q.type==='baby_dragon');assert(W.petBondReady(free));assert.equal(W.petNeed(p,free),null);assert.equal(free.follow,p);
// Changer les réglages d'un œuf déjà posé et annuler restaure ses besoins précédents.
E.eggCare={pets:0,meals:4,foods:['carrot']};E.paint(4,3,true);assert.equal(E.props['4,3'].eggCare.meals,4);E.undo();assert.equal(E.props['4,3'].eggCare.meals,2);
assert.deepEqual(BK.normalizeEggCare(),{pets:1,meals:1,foods:null});
assert.deepEqual(BK.normalizeEggCare({pets:-3,meals:99,foods:['wood','fish','fish']}),{pets:0,meals:20,foods:['fish']});
// Zéro caresse demande immédiatement le repas ; zéro repas ne demande que l'amour.
for(const care of [{pets:0,meals:2},{pets:2,meals:0}]){
 const q=W.addEnemy('baby_duck',3,2,{eggCare:BK.normalizeEggCare(care)});
 assert.equal(W.petNeed(p,q),care.pets?'pet':'food');
}
console.log('Œufs configurables : placement, réglages indépendants, JSON, éclosion, 3 caresses / 2 repas, aliments autorisés, zéros, combat et annulation OK.');
// Les réglages de la palette sont utilisables : quantités et choix multiples.
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.events={};this.style={};this.textContent='';}
 set innerHTML(v){this.children=[];}appendChild(v){this.children.push(v);return v;}
 addEventListener(k,fn){this.events[k]=fn;}
}
global.document={createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};
try{
 E.optBox=new Element('div');E.eggCare={pets:1,meals:1,foods:null};E.renderOptions();
 const all=(node)=>[node,...(node.children||[]).flatMap(all)];
 const numbers=all(E.optBox).filter(n=>n.type==='number');assert.equal(numbers.length,3);
 numbers[0].value='4';numbers[0].events.change();assert.equal(E.eggCare.pets,4);
 const choices=all(E.optBox).find(n=>n.tagName==='select'&&n.children.some(o=>o.value==='chosen'));
 choices.value='chosen';choices.events.change();
 const boxes=all(E.optBox).filter(n=>n.type==='checkbox');assert.equal(boxes.length,BK.HATCHLING_FOODS.length);
 boxes[1].checked=true;boxes[1].events.change();assert.equal(E.eggCare.foods.length,2);
 boxes[0].checked=false;boxes[0].events.change();assert.equal(E.eggCare.foods.length,1);
 boxes[1].checked=false;boxes[1].events.change();assert.equal(boxes[1].checked,true,'au moins un aliment accepté');
}finally{delete global.document;}
console.log('Palette : nombre de caresses/repas, sélection multiple et liste non vide OK.');
