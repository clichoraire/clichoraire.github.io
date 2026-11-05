const assert = require('node:assert/strict'), BK = require('./headless');
const E = new BK.Editor({name:'Rectangle',cols:20,rows:16,theme:'garden',base:'.'});
// Deterministic picking isolates gestures from perspective; rendering uses real ground heights.
E.cellAt=(c,r)=>E.inside(c,r)?{c,r}:null; E.ghostAt=()=>null;
const state=()=>JSON.stringify([E.rows(),E.props]);
const gesture=(a,b)=>{E.onPointer('down',...a,1);E.onPointer('move',...b,1);E.onPointer('up',...b,0);};
E.paintMode='rectangle';E.floorLevel=3;
const before=state(), world=E.world;
E.onPointer('down',14,12,1);E.onPointer('move',2,2,1);
assert.equal(state(),before,'preview does not mutate');assert.equal(E.undoStack.length,0);
E.onPointer('up',2,2,0);
for(let r=2;r<=12;r++)for(let c=2;c<=14;c++)assert.equal(E.props[c+','+r].lv,3);
assert.notEqual(E.world,world);assert.equal(E.props['1,2'],undefined);assert.equal(E.undoStack.length,1);
E.undo();assert.equal(state(),before,'one undo restores entire rectangle');
E.item={tool:'raise'};E.heightAmount=3;gesture([2,2],[14,12]);
assert.equal(E.props['5,5'].lv,3);gesture([2,2],[14,12]);assert.equal(E.props['5,5'].lv,6);gesture([2,2],[14,12]);gesture([2,2],[14,12]);assert.equal(E.props['5,5'].lv,10,'height capped');
E.item={tool:'lower'};E.heightAmount=.5;gesture([14,12],[2,2]);assert.equal(E.props['5,5'].lv,9.5);
for(const cancel of ['cancel','outside']){
 const prior=state(),undos=E.undoStack.length;E.onPointer('down',3,3,1);E.onPointer('move',5,5,1);
 E.onPointer(cancel==='cancel'?'cancel':'up',-10,-10,0);
 assert.equal(state(),prior);assert.equal(E.undoStack.length,undos);assert.equal(E.painting,false);
}
E.paintMode='paint';E.item={tool:'raise'};E.heightAmount=.5;
E.onPointer('down',1,1,1);E.onPointer('move',1,2,1);E.onPointer('move',1,1,1);E.onPointer('up',1,1,0);
assert.equal(E.props['1,1'].lv,.5,'revisiting a tile only raises once per stroke');
gesture([1,1],[1,1]);assert.equal(E.props['1,1'].lv,1,'new stroke raises again');
E.item=BK.EDITOR_TABS.find(t=>t.id==='sols').items.find(i=>i.ch===',');E.floorLevel=0;
gesture([0,0],[0,2]);assert.equal(E.grid[0][0],',');assert.equal(E.grid[2][0],',');
E.paintMode='rectangle';gesture([0,0],[0,0]);assert.equal(E.painting,false);
E.item={enemy:'gluant'};assert.equal(E.supportsRectangle(),false);
console.log('Rectangle: 143 tiles, preview, reverse drag, height ±, cap, undo, cancellation, single tile and paint strokes OK.');
