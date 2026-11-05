const assert=require('node:assert/strict'),BK=require('./headless');
class Element {
 constructor(){this.events={};this.children=[];this.style={};this.title='';this.classList={add(){},remove(){},toggle(){}};}
 addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
 setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;}
 appendChild(child){this.children.push(child);}replaceChildren(){this.children=[];}
 setAttribute(){}remove(){this.removed=true;}
 fire(type,x=10,y=10,extra={}){const e={pointerId:1,button:0,clientX:x,clientY:y,preventDefault(){},stopImmediatePropagation(){},...extra};for(const fn of this.events[type]||[])fn(e);}
}
const cards=BK.EDITOR_TABS.flatMap(t=>t.items||[]);
for(const item of [cards.find(i=>i.ch==='y'),cards.find(i=>i.enemy==='gluant'),cards.find(i=>i.pickup==='axe'),cards.find(i=>i.deco==='trampoline'),cards.find(i=>i.ch==='H')]) {
 const E=new BK.Editor({name:'Drag',cols:9,rows:7,theme:'garden',base:'.'});E.refreshToolbar=E.renderOptions=()=>{};BK.current=E;
 E.shortcutBox=new Element();
 const button=new Element(),canvas=new Element();canvas.getBoundingClientRect=()=>({left:100,top:50,width:640,height:360});
 let over=canvas,previews=[],keys={};window.addEventListener=(k,fn)=>keys[k]=fn;window.removeEventListener=k=>delete keys[k];
 global.document={getElementById:()=>canvas,elementFromPoint:()=>over,createElement:()=>new Element(),body:{appendChild:e=>previews.push(e)}};
 try {
  E.bindPaletteDrag(button,item);
  const at=E.cam.project(4.5,3.5,0),x=100+at.x/2,y=50+at.y/2;
  const state=()=>{const data=E.data();delete data.updated;return JSON.stringify(data);};
  const before=state();
  button.fire('pointerdown');button.fire('pointermove',x,y);
  assert.equal(state(),before,'survol sans modification');assert.deepEqual(E.hover,{c:4,r:3});
  button.fire('pointerup',x,y);assert.equal(E.painting,false);assert.equal(E.undoStack.length,1);assert(previews[0].removed);
  assert.notEqual(state(),before,'pose au relâchement');E.undo();assert.equal(state(),before,'une seule annulation');
  for(const cancel of ['outside','escape','pointercancel','lostpointercapture']) {
   over=canvas;button.fire('pointerdown');button.fire('pointermove',x,y);
   if(cancel==='outside'){over=button;button.fire('pointerup',x,y);}
   else if(cancel==='escape')keys.keydown({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});
   else button.fire(cancel,x,y);
   assert.equal(state(),before,cancel+' ne pose rien');assert.equal(E.painting,false);assert(previews.at(-1).removed);
  }
  assert.equal(E.shortcuts.length,1,'le lâcher hors du tableau épingle un raccourci');
  const shortcut=E.shortcuts[0],floating=E.shortcutBox.children[0].children[0];
  E.item=null;floating.fire('click',0,0,{detail:0});assert.equal(E.item,item,'clic sur le raccourci sélectionne');
  over=button;floating.fire('pointerdown');floating.fire('pointermove',40,60);floating.fire('pointerup',40,60);
  assert.equal(E.shortcuts.length,1,'déplacer ne duplique pas le raccourci');assert.equal(shortcut.x,40);
  const moved=E.shortcutBox.children[0].children[0];over=canvas;
  moved.fire('pointerdown');moved.fire('pointermove',x,y);moved.fire('pointerup',x,y);
  assert.notEqual(state(),before,'le raccourci permet de poser sur le tableau');assert.equal(E.shortcuts.length,1,'le raccourci reste disponible après pose');E.undo();
  E.shortcutBox.children[0].children[1].fire('click');assert.equal(E.shortcuts.length,0,'croix retire le raccourci');assert.equal(state(),before);
  button.fire('pointerdown');button.fire('pointermove',12,12);button.fire('pointerup',12,12);
  assert.equal(state(),before,'un clic reste une sélection sans pose');
 } finally {delete global.document;}
}
console.log('Drag palette : sols, ennemis, objets, décorations et maisons ; coordonnées redimensionnées, survol, pose unique, undo, annulations et raccourcis flottants OK.');
