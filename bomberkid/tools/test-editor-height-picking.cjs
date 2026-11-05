const assert=require('node:assert/strict'),BK=require('./headless');
const items=BK.EDITOR_TABS.flatMap(t=>t.items||[]);
for(const lv of [0,4,4.5,5])for(const item of [items.find(i=>i.deco==='trampoline'),items.find(i=>i.pickup==='axe'),items.find(i=>i.ch==='x')]){
 const E=new BK.Editor({name:'Sommet',cols:9,rows:9,base:'.',theme:'garden',props:{'4,4':{lv}}});
 const z=E.world.groundZ(4.5,4.5),screen=E.cam.project(4.5,4.5,z);
 assert.deepEqual(E.cellAt(screen.x,screen.y),{c:4,r:4},'sommet sélectionnable à '+lv);
 E.item=item;E.onPointer('down',screen.x,screen.y,1);E.onPointer('up',screen.x,screen.y,0);
 assert.equal(E.grid[4][4],item.ch);assert.equal(E.props['4,4'].lv,lv);assert.equal(E.world.groundZ(4.5,4.5),z);
 E.undo();assert.equal(E.grid[4][4],'.');assert.equal(E.props['4,4'].lv,lv);
}
// Le haut d'une rampe à l'étage 5 dépasse même la hauteur du plateau.
{
 const E=new BK.Editor({name:'Pente haute',cols:9,rows:9,base:'.',props:{'4,4':{lv:5,ramp:true,rampDir:2}}});
 const point=E.cam.project(4.8,4.5,E.world.groundZ(4.8,4.5));
 assert.deepEqual(E.cellAt(point.x,point.y),{c:4,r:4});
}
console.log('Sélection et pose au sommet : trampoline, objet et bloc jusqu’à l’étage 5, pente haute et annulation OK.');
