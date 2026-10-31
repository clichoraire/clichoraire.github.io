(function(BK){
'use strict';
BK.DECO_PROPS.duelist=1;
BK.DUELLISTS=[['Capitaine Patate','#ca8b39','#7045b8'],['Professeur Boum','#507dda','#f5cb47'],['Madame Confetti','#d74a9b','#73d3c1'],['Baron Cornichon','#559d42','#db8941']];
BK.duelistDef=function(style=0){const [name,outfit,accent]=BK.DUELLISTS[style]||BK.DUELLISTS[0];return {...BK.charById('matthieu'),id:'duelist'+style,name,outfit,accent,antenna:accent,familyPortrait:null,hair:accent,skin:'#edba8b'};};
BK.defaultDuelRing=function(floor=','){
 const grid=Array.from({length:11},(_,r)=>Array.from({length:11},(_,c)=>!c||!r||c===10||r===10?' ':floor));
 for(let r=3;r<=7;r+=2)for(let c=3;c<=7;c+=2)grid[r][c]='#';
 for(const [c,r]of [[4,3],[6,3],[4,7],[6,7],[3,4],[7,6]])grid[r][c]='W';
 grid[8][2]='1';return {cols:11,rows:11,grid:grid.map(r=>r.join('')),props:{'8,2':{duelOpponent:true}}};
};
BK.validateDuelRing=function(ring,theme){
 if(!ring?.grid||ring.grid.length<7||ring.grid.length>25||ring.grid.some(r=>typeof r!=='string'||r.length!==ring.grid[0].length)||ring.grid[0].length<7||ring.grid[0].length>25)return false;
 const w=new BK.World({map:ring.grid,props:ring.props||{},theme,explore:true,mode:'match',itemChance:0});
 const spawn=w.starts[0],op=Object.entries(ring.props||{}).find(([k,p])=>p.duelOpponent);if(!spawn||!op)return false;
 const [c,r]=op[0].split(',').map(Number);if(!w.inside(c,r)||w.cell(c,r)||!w.walkableTerrain(c,r)||w.cell(spawn.c,spawn.r)||!w.walkableTerrain(spawn.c,spawn.r)||Math.hypot(c-spawn.c,r-spawn.r)<3)return false;
 const seen=new Set([spawn.c+','+spawn.r]),queue=[spawn];for(let i=0;i<queue.length;i++)for(const d of BK.DIRS){const x=queue[i].c+d.dx,y=queue[i].r+d.dy,k=x+','+y;if(w.inside(x,y)&&!seen.has(k)&&[0,BK.SOFT].includes(w.cell(x,y))&&w.walkableTerrain(x,y)&&w.canStep(queue[i].c,queue[i].r,x,y)){seen.add(k);queue.push({c:x,r:y});}}
 return seen.has(c+','+r);
};
class Duel{
 constructor(parent,key,trainer,previewEditor){
  this.parent=parent;this.key=key;this.trainer=trainer;this.previewEditor=previewEditor;this.level=Math.max(1,Math.min(4,trainer.duelistLevel||1));
  const source=parent.player,theme=parent.world.themeId,terrain=parent.world.tAt(Math.floor(source.x),Math.floor(source.y)),floor=({0:'.',1:',',3:'=',5:'-',6:'_',7:'%',10:'y',11:'z',12:'q',15:')'})[terrain]||'.';
  const ring=BK.validateDuelRing(trainer.duelArena,theme)?trainer.duelArena:BK.defaultDuelRing(floor);
  const W=this.world=new BK.World({map:ring.grid,props:JSON.parse(JSON.stringify(ring.props||{})),theme,mode:'match',explore:true,hearts:true,itemChance:0});
  const st=W.starts[0],op=Object.entries(ring.props).find(([k,p])=>p.duelOpponent)[0].split(',').map(Number);
  this.player=W.addPlayer(source.def,st.c,st.r,{hp:40,bombs:source.bombsMax,fire:source.fire});this.rival=W.addPlayer(BK.duelistDef(trainer.duelistStyle),op[0],op[1],{hp:[20,30,40,50][this.level-1],bombs:source.bombsMax,fire:source.fire,bot:{level:this.level===1?'facile':this.level===2?'moyen':'difficile'}});
  for(const p of [this.player,this.rival]){for(const k of BK.BOMB_POWERS)p[k]=!!source[k];p.kick=true;p.gloves=source.gloves;p.speed=source.speed*(p===this.rival?[.65,.8,1,1.1][this.level-1]:1);}
  this.rival.bombsMax=Math.min(source.bombsMax,this.level);this.state='intro';this.t=0;this.timer=120;W.frozen=true;this.cam=new BK.Camera(BK.W,BK.H);this.cam.fit(W.cols,W.rows,{top:95,bottom:65,left:35,right:35});
  this.rewardKey=parent.stage?.id+':'+(parent.outer?.door?.c??'outside')+':'+(parent.outer?.door?.r??'')+':'+key;
 }
 update(dt){
  this.t+=dt;if(this.state==='intro'){this.world.update(dt);if(this.t>3){this.state='play';this.world.frozen=false;BK.audio.go();}return;}if(this.state!=='play')return;
  if(BK.input.hit(['Escape','KeyP'])){this.showPause();return;}
  BK.input.read(this.player,0);BK.ai.think(this.world,this.rival,dt);
  // Beginners leave more time to react, and every rival respects the ring edges.
  this.cool=Math.max(0,(this.cool||0)-dt);if(this.rival.input.bomb){if(this.cool)this.rival.input.bomb=false;else this.cool=[2,1.3,.8,.4][this.level-1];}
  const p=this.rival,nx=Math.floor(p.x+p.input.dx*.6),ny=Math.floor(p.y+p.input.dy*.6);if(!this.world.walkableTerrain(nx,ny))p.input.dx=p.input.dy=0;
  this.world.update(dt);BK.audio.events(this.world.events);this.timer-=dt;
  const lost=!this.player.alive||!!this.player.falling,won=!this.rival.alive||!!this.rival.falling;
  if(lost||won||this.timer<=0)this.finish(won&&!lost,lost&&won||this.timer<=0);
 }
 finish(won,draw=false){
  if(this.state==='result')return;this.state='result';this.world.frozen=true;
  let text=draw?'Égalité ! On se retrouve dans le tableau.':won?'Bien joué !':'Bien essayé ! Tu peux revenir pour une revanche.';
  if(won&&!this.previewEditor){const save=this.parent.save;save.duels=save.duels||{};if(!save.duels[this.rewardKey]){save.duels[this.rewardKey]=true;const gold=50*this.level,xp=35*this.level;save.gold=(save.gold||0)+gold;this.parent.gainXp(xp);save.pendingBossLoot=save.pendingBossLoot||[];save.pendingBossLoot.push({type:'antidote',n:1});this.parent.deliverBossLoot();BK.saveAdventure(this.parent.charId,save);text='<i class="goldcoin sm"></i> +'+gold+' pièces d’or   ⭐ +'+xp+' XP   🧪 +1 antidote';}else text='Victoire ! Les récompenses de ce duelliste ont déjà été reçues.';}
  BK.audio[won?'win':'lose']();BK.overlay.show({playful:'pause',title:draw?'🤝 Égalité':won?'🏆 Duel remporté !':'💪 À la prochaine !',text,buttons:[{label:'↩ Reprendre l’aventure',primary:true,onClick:()=>this.leave()}]});
 }
 leave(){BK.overlay.hide();BK.input.keys.clear();BK.input.flush();Object.assign(BK.input.touch,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});if(this.previewEditor){BK.current=this.previewEditor;BK.show('editor');return;}this.parent.duelCooldown=3;this.parent.duelMustLeave=this.key;this.parent.player.invuln=Math.max(2,this.parent.player.invuln);BK.current=this.parent;}
 showPause(){this.state='pause';this.world.frozen=true;BK.overlay.show({playful:'pause',title:'⏸ Duel en pause',text:'💣 Bombe : Espace · 🦵 Botte une bombe en marchant contre elle. Fais tomber ton adversaire du ring ou bats-le avec tes bombes ! Sur tablette, utilise les boutons du jeu.',buttons:[{label:'▶ Continuer',primary:true,onClick:()=>{BK.overlay.hide();this.state='play';this.world.frozen=false;}},{label:'↩ Quitter le duel',onClick:()=>this.leave()}]});}
 render(ctx){this.world.render(ctx,this.cam,{names:true});ctx.save();ctx.textAlign='center';ctx.font='bold 24px Nunito,sans-serif';ctx.fillStyle='#302447';BK.sprites.rr(ctx,170,12,BK.W-340,65,20);ctx.fill();ctx.fillStyle='#ffe16b';ctx.fillText('💣 '+this.player.name+'   VS   '+this.rival.name,BK.W/2,39);ctx.font='bold 18px Nunito,sans-serif';ctx.fillStyle='#fff';ctx.fillText('♥ '+Math.ceil(this.player.hp)+'     ·     '+Math.ceil(this.timer)+' s     ·     ♥ '+Math.ceil(this.rival.hp),BK.W/2,65);if(this.state==='intro'){ctx.font='bold 76px Nunito,sans-serif';ctx.fillStyle='#ffe16b';ctx.strokeStyle='#33224a';ctx.lineWidth=7;const txt=this.t<1?'Un défi !':String(Math.ceil(3-this.t));ctx.strokeText(txt,BK.W/2,BK.H/2);ctx.fillText(txt,BK.W/2,BK.H/2);}ctx.font='bold 18px Nunito,sans-serif';ctx.fillStyle='#fff';ctx.strokeStyle='#302447';ctx.lineWidth=4;const hint='Bombes ou sortie du ring : à toi de jouer !';ctx.strokeText(hint,BK.W/2,BK.H-22);ctx.fillText(hint,BK.W/2,BK.H-22);ctx.restore();}
}
BK.Duel=Duel;
const update=BK.Adventure.prototype.update;
BK.Adventure.prototype.update=function(dt){
 update.call(this,dt);if(BK.current&&BK.current!==this)return;if(this.state!=='play'||this.challenge||this.player.falling||this.player.air||this.player.swallowedBy||this.player.boat)return;
 this.duelCooldown=Math.max(0,(this.duelCooldown||0)-dt);if(this.duelCooldown)return;
 const W=this.world,p=this.player;
 for(const [key,t]of Object.entries(W.props))if(t.deco==='duelist'){
  const [c,r]=key.split(',').map(Number),d=BK.DIRS[t.orientation||0],dx=p.x-c-.5,dy=p.y-r-.5,along=dx*d.dx+dy*d.dy,side=Math.abs(dx*d.dy-dy*d.dx);
  const sees=along>.4&&along<4.5&&side<.65&&Math.abs(W.groundZ(p.x,p.y)-W.hAt(c,r))<.1&&W.canSee({x:c+.5+d.dx*.55,y:r+.5+d.dy*.55},p,5);
  if(this.duelMustLeave===key){if(!sees)this.duelMustLeave=null;continue;}
  if(sees){BK.current=new Duel(this,key,t);return;}
 }
};
const draw=BK.sprites.drawDeco;
BK.sprites.drawDeco=function(ctx,kind,x,y,k,t,nb,seed,orientation,lightColor,props){if(kind!=='duelist')return draw.apply(this,arguments);ctx.save();ctx.translate(x,y);BK.sprites.drawCharacter(ctx,BK.duelistDef(props?.duelistStyle),{s:k,pose:'idle',t,view:orientation===2?'back':orientation===1||orientation===3?'side':'front',flip:orientation===1});ctx.fillStyle='#ffdc56';ctx.font='bold '+k*.4+'px sans-serif';ctx.textAlign='center';ctx.fillText('⚔',0,-k*1.3);ctx.restore();};
})(window.BK);
(function(BK){
'use strict';
const E=BK.Editor.prototype;
BK.EDITOR_TABS.find(t=>t.id==='magasin')?.items.unshift({ch:'"',deco:'duelist',opts:'duelist',name:'Duelliste',icon:'⚔️',hint:'Reste sur place et te défie si tu passes devant lui. Choisis sa difficulté, son orientation et dessine son ring.'});
// Some builds name the shop category differently.
if(!BK.EDITOR_TABS.some(t=>t.items.some(i=>i.deco==='duelist')))BK.EDITOR_TABS.find(t=>t.id==='deco').items.unshift({ch:'"',deco:'duelist',opts:'duelist',name:'Duelliste',icon:'⚔️'});
BK.EDITOR_TABS.find(t=>t.id==='objets').items.push({tool:'duelOpponent',opts:'duelOpponent',name:'Départ adverse · duel',icon:'⚔️',hint:'Dans un ring de duel, place ici le départ de ton adversaire. Le drapeau Départ reste celui du héros.'});
const paint=E.paint;
E.paint=function(c,r,first){
 if(this.item?.tool==='duelOpponent'){
  if(this.parent?.kind!=='duel'){this.toast('Cet outil sert dans le ring d’un duelliste.');return;}
  if(!this.inside(c,r)||this.world.cell(c,r)||!this.world.walkableTerrain(c,r))return;if(first)this.snapshot();
  for(const p of Object.values(this.props))delete p.duelOpponent;this.props[c+','+r]={...(this.props[c+','+r]||{}),duelOpponent:true};this.markDirty();this.rebuild();return;
 }
 const old=this.props[c+','+r]?.duelArena;paint.call(this,c,r,first);
 if(this.item?.deco==='duelist'&&this.inside(c,r)){Object.assign(this.props[c+','+r],{duelistLevel:this.duelistLevel||1,duelistStyle:this.duelistStyle||0,...(old?{duelArena:old}:{})});this.rebuild();}
};
const options=E.renderOptions;
E.renderOptions=function(){
 options.call(this);if(this.item?.opts!=='duelist'||!this.optBox)return;
 const select=(label,values,current,fn)=>{const l=document.createElement('label');l.textContent=label;const s=document.createElement('select');for(const [value,name]of values){const o=document.createElement('option');o.value=value;o.textContent=name;o.selected=String(value)===String(current);s.append(o);}s.onchange=()=>fn(s.value);l.append(s);this.optBox.append(l);return s;};
 select('Difficulté ',[[1,'Débutant'],[2,'Normal'],[3,'Difficile'],[4,'Expert']],this.duelistLevel||1,v=>this.duelistLevel=+v);
 select('Personnage ',BK.DUELLISTS.map((d,i)=>[i,d[0]]),this.duelistStyle||0,v=>this.duelistStyle=+v);
 const trainers=Object.entries(this.props).filter(([k,p])=>p.deco==='duelist');if(!trainers.length)return;
 const s=select('Ring du personnage ',trainers.map(([k,p])=>[k,(BK.DUELLISTS[p.duelistStyle||0][0])+' · '+k]),trainers[0][0],()=>{});
 const b=document.createElement('button');b.textContent='✏️ Dessiner son ring';b.onclick=()=>{const key=s.value,t=this.props[key],ring=t.duelArena||BK.defaultDuelRing(['forest','garden'].includes(this.map.theme)?',':'.');BK.openEditor({...ring,id:this.map.id+':duel:'+key,name:'Ring de '+BK.duelistDef(t.duelistStyle).name,theme:this.map.theme,base:' '},{parent:{kind:'duel',editor:this,key}});};this.optBox.append(b);
};
const back=E.returnToParent;
E.returnToParent=function(){if(this.parent?.kind!=='duel')return back.call(this);const P=this.parent,ring=this.data();if(!BK.validateDuelRing(ring,P.editor.map.theme)){this.toast('Il faut deux départs séparés de 3 cases, sur des sols reliés. Ring : 7 à 25 cases de côté.');return;}P.editor.snapshot();P.editor.props[P.key].duelArena=ring;P.editor.markDirty();P.editor.rebuild();BK.editor=P.editor;BK.current=P.editor;BK.show('editor');P.editor.buildPanel();P.editor.toast('Ring enregistré dans le duelliste');};
const test=E.test;
E.test=function(){if(this.parent?.kind!=='duel')return test.call(this);const ring=this.data(),P=this.parent;if(!BK.validateDuelRing(ring,P.editor.map.theme)){this.toast('Place deux départs reliés, séparés de 3 cases minimum.');return;}const parent=new BK.Adventure(BK.selectedChar||'adam',0,{custom:BK.mapToStage(P.editor.data())});BK.editor=this;BK.current=new BK.Duel(parent,P.key,{...P.editor.props[P.key],duelArena:ring},this);BK.show('game');};
const effects=BK.World.prototype.renderArenaEffects;
BK.World.prototype.renderArenaEffects=function(ctx,cam,time,push){effects.call(this,ctx,cam,time,push);if(this.editorPreview)for(const [key,p]of Object.entries(this.props))if(p.duelOpponent){const [c,r]=key.split(',').map(Number);push(r+.5,c+.5,()=>{const q=cam.project(c+.5,r+.5,this.hAt(c,r)+.2);ctx.fillStyle='#ffd54a';ctx.font='bold '+q.k*.4+'px sans-serif';ctx.textAlign='center';ctx.fillText('⚔',q.x,q.y);});}};
// Deux rencontres facultatives près des premières zones du château.
for(const [index,level]of [[0,1],[1,2]]){const s=BK.CASTLE_STAGES[index],rows=s.map.map(r=>r.split(''));const start=rows.findIndex(r=>r.includes('1')),cx=rows[start]?.indexOf('1');if(cx<0||start<0)continue;
 const r=start-2,c=cx-3;if(r>0&&c>0&&['.',',','-','%'].includes(rows[r][c])&&!s.props[c+','+r]){rows[r][c]='"';s.props[c+','+r]={deco:'duelist',duelistLevel:level,duelistStyle:index,orientation:3};s.map=rows.map(r=>r.join(''));}}
})(window.BK);
