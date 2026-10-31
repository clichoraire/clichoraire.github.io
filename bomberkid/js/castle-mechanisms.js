// Passages secrets et transports du château, partagés par les tableaux et l’éditeur.
(function(BK){
'use strict';
BK.DECO_PROPS.crackedstone=2;
const W=BK.World.prototype,parse=W.parseExplore;
W.parseExplore=function(map){
 parse.call(this,map);this.secretRooms=[];this.openSecrets=new Set();this.secretCells=new Map();
 for(const [key,p] of Object.entries(this.props))if(p.deco==='crackedstone'){
  const [c,r]=key.split(',').map(Number),d=BK.DIRS[p.secretDirection??2],group=p.secretGroup||key,width=Math.max(1,Math.min(9,Number(p.secretWidth)||3)),depth=Math.max(1,Math.min(9,Number(p.secretDepth)||3)),cells=[];
  for(let n=1;n<=depth;n++)for(let side=-Math.floor(width/2);side<Math.ceil(width/2);side++){const x=c+d.dx*n-d.dy*side,y=r+d.dy*n+d.dx*side;if(this.inside(x,y)){cells.push({c:x,r:y});const i=this.idx(x,y);if(!this.secretCells.has(i))this.secretCells.set(i,[]);this.secretCells.get(i).push(group);}}
  this.secretRooms.push({c,r,group,cells});
 }
};
W.hiddenSecretAt=function(c,r){return this.inside(c,r)&&!this.editorPreview&&this.secretCells?.get(this.idx(c,r))?.some(g=>!this.openSecrets.has(g));};
const blocked=W.blocked;
W.blocked=function(c,r,who){return this.hiddenSecretAt(c,r)||blocked.call(this,c,r,who);};
const updateEnemy=W.updateEnemy;
W.updateEnemy=function(e,dt){if(this.hiddenSecretAt(Math.floor(e.x),Math.floor(e.y)))return;return updateEnemy.call(this,e,dt);};
const destroy=W.destroyBlock;
W.destroyBlock=function(c,r,by){
 const i=this.idx(c,r);if(this.deco[i]!=='crackedstone')return destroy.call(this,c,r,by);
 if(!this.cells[i])return;
 this.cells[i]=0;this.deco[i]=null;const room=this.secretRooms.find(q=>q.c===c&&q.r===r);
 const first=room&&!this.openSecrets.has(room.group);if(room)this.openSecrets.add(room.group);
 for(let n=0;n<30;n++){const a=n*Math.PI*2/30,v=1+Math.random()*3;this.particles.push({x:c+.5,y:r+.5,z:this.hAt(c,r)+.4,gz:this.hAt(c,r),vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:3+Math.random()*5,t:0,life:1.5+Math.random()*.7,size:.08+Math.random()*.17,color:['#bdc4ce','#8390a2','#dce0e6'][n%3],heavy:true});}
 this.shake=.35;this.events.push({type:'blockDestroyed',c,r,player:by});
 if(first){this.events.push({type:'secretFound',c,r,carry:true});this.addFloater(c+.5,r+.5,'Pièce secrète !',{size:.32,color:'#ffdf74',life:2.5});}
};
// Les rails suspendus n’offrent aucun sol hors du plateau réel. Le dernier quai reste le point de retour.
const playerUpdate=W.updatePlayer;
W.updatePlayer=function(p,dt){
 const safe=p.safe&&{...p.safe};playerUpdate.call(this,p,dt);
 const c=Math.floor(p.x),r=Math.floor(p.y),M=this.movers.find(m=>m.pit&&m.cells.some(q=>q.c===c&&q.r===r));
 if(M){if(safe)p.safe=safe;if(p.alive&&!p.air&&!p.falling&&!p.boat&&(Math.abs(p.x-M.x)>.56||Math.abs(p.y-M.y)>.56))this.startFall(p,'void');}
 if(this.elevAt(c,r)?.auto&&safe)p.safe=safe;
};
// Les compagnons proches embarquent ensemble et restent sur le plateau jusqu’au quai.
W.transportUnder=function(p){return this.movers.find(m=>m.pit&&Math.abs(m.x-p.x)<.5&&Math.abs(m.y-p.y)<.5)||this.elevators.find(e=>e.auto&&Math.floor(p.x)===e.c&&Math.floor(p.y)===e.r);};
const allyUpdate=W.updateAlly;
W.updateAlly=function(p,dt){
 const leader=p.leader,ride=leader?.alive&&!leader.air&&!leader.falling&&this.transportUnder(leader);
 if(p.alive&&!p.air&&!p.falling&&!p.swallowedBy&&!p.boat&&leader?.alive){
  if(ride&&!p.transportEscort&&Math.hypot(p.x-leader.x,p.y-leader.y)<1.8&&Math.abs(this.groundZ(p.x,p.y)-this.groundZ(leader.x,leader.y))<.12&&this.canSee(p,leader,2))p.transportEscort=ride;
  if(p.transportEscort){
   if(ride===p.transportEscort||(!ride&&!leader.falling&&!leader.air&&Math.hypot(p.x-leader.x,p.y-leader.y)<1.8&&this.walkableTerrain(Math.floor(leader.x),Math.floor(leader.y))&&Math.abs(this.groundZ(p.x,p.y)-this.groundZ(leader.x,leader.y))<.12)){
    p.x=leader.x+(p.index%2?.12:-.12);p.y=leader.y+.1;p.input.dx=p.input.dy=0;p.path=[];
    if(!ride){p.transportEscort=null;p.safe={x:p.x,y:p.y,dir:p.dir};}return;
   }
   p.transportEscort=null;
  }
 }
 return allyUpdate.call(this,p,dt);
};
const renderEffects=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 renderEffects.call(this,ctx,cam,time,push);
 if(this.editorPreview)for(const room of this.secretRooms||[])for(const q of room.cells)push(q.r+.04,q.c+.5,()=>{const z=this.hAt(q.c,q.r)+.025;BK.draw3d.quad(ctx,[[q.c,q.r],[q.c+1,q.r],[q.c+1,q.r+1],[q.c,q.r+1]].map(([x,y])=>cam.project(x,y,z)),'rgba(174,110,242,.12)','rgba(202,153,255,.7)');});
};
const draw=BK.sprites.drawDeco;
BK.sprites.drawDeco=function(ctx,kind,x,y,k,t,nb,seed,orientation,lightColor,props){
 if(kind!=='crackedstone')return draw.call(this,ctx,kind,x,y,k,t,nb,seed,orientation,lightColor,props);
 ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.lineJoin='round';ctx.lineWidth=.035;ctx.strokeStyle='#4d5361';
 const poly=(pts,color)=>{ctx.fillStyle=color;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
 poly([[-.5,-.18],[.35,-.18],[.35,-1.05],[-.5,-1.05]],'#9da7b6');poly([[.35,-.18],[.52,-.35],[.52,-1.2],[.35,-1.05]],'#626f84');poly([[-.5,-1.05],[-.32,-1.2],[.52,-1.2],[.35,-1.05]],'#d4d9dd');
 ctx.strokeStyle='#727d8c';ctx.lineWidth=.018;for(const h of [-.46,-.76]){ctx.beginPath();ctx.moveTo(-.48,h);ctx.lineTo(.34,h);ctx.stroke();}
 ctx.strokeStyle='#374054';ctx.lineWidth=.045;ctx.beginPath();ctx.moveTo(.06,-1.05);ctx.lineTo(-.12,-.83);ctx.lineTo(.05,-.65);ctx.lineTo(-.18,-.43);ctx.lineTo(-.08,-.18);ctx.moveTo(.05,-.65);ctx.lineTo(.24,-.55);ctx.lineTo(.32,-.35);ctx.moveTo(-.12,-.83);ctx.lineTo(-.35,-.78);ctx.stroke();ctx.restore();
};

// Une bombe doit réellement entrer latéralement sous un ascenseur à explosion.
W.tryBombUnderElevator=function(b,c,r){
 const E=this.elevAt(c,r);
 if(!E||E.auto||E.state!=='rest'||b.rock||!b.kicker||this.cell(c,r)||this.bombAt(c,r)||Math.abs(this.hAt(b.cx,b.cy)-E.base)>.08)return false;
 b.underElevator=E;b.state='idle';b.cx=c;b.cy=r;b.x=c+.5;b.y=r+.5;b.z=0;b.passers=new Set();
 if(b.t<=0)this.explodeBomb(b);return true;
};
// Le tablier reste non franchissable pendant sa chute ; seule la fin de l'animation crée le passage.
const parseBridges=W.parseExplore;
W.parseExplore=function(map){
 parseBridges.call(this,map);this.blastDrawbridges=[];
 for(const [key,pr] of Object.entries(this.props))if(pr.blastDrawbridge){
  const [c,r]=key.split(',').map(Number),cfg=pr.blastDrawbridge,d=Number(cfg.direction),direction=Number.isInteger(d)&&d>=0&&d<4?d:2,D=BK.DIRS[direction],length=Math.max(2,Math.min(6,Math.round(Number(cfg.length)||3)));
  const cells=Array.from({length},(_,n)=>({c:c+D.dx*n,r:r+D.dy*n}));
  if(cells.some(q=>!this.inside(q.c,q.r)))continue;
  const bridge={c,r,direction,length,cells,z:this.hAt(c,r),state:'raised',t:0};this.blastDrawbridges.push(bridge);
 }
};
const bridgeBlocked=W.blocked;
W.blocked=function(c,r,who){if(this.blastDrawbridges?.some(b=>b.state!=='open'&&b.c===c&&b.r===r))return true;return bridgeBlocked.call(this,c,r,who);};
W.hitBlastDrawbridge=function(c,r,bomb){
 const bridge=this.blastDrawbridges?.find(b=>b.c===c&&b.r===r&&b.state!=='open');
 if(!bridge||Math.abs(bridge.z-this.hAt(bomb.cx,bomb.cy))>.15)return false;
 if(bridge.state==='raised'){bridge.state='lowering';bridge.t=0;this.burst(c+.5,r+.5,bridge.z+.5,'#cba36a',16);this.events.push({type:'gateOpened',bridge:true,cells:[{c,r}]});}
 return true;
};
const bridgeEffects=W.updateArenaEffects;
W.updateArenaEffects=function(dt){
 bridgeEffects.call(this,dt);
 for(const b of this.blastDrawbridges||[])if(b.state==='lowering'){
  b.t=Math.min(1.2,b.t+dt);
  if(b.t>=1.2){b.state='open';for(const q of b.cells){const i=this.idx(q.c,q.r);this.terrain[i]=3;this.height[i]=b.z;}this.shake=Math.max(this.shake,.2);this.burst(b.c+.5,b.r+.5,b.z,'#cba36a',18);}
 }
};
const bridgeRender=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 bridgeRender.call(this,ctx,cam,time,push);
 for(const b of this.blastDrawbridges||[]){
  const D=BK.DIRS[b.direction],S={dx:-D.dy,dy:D.dx},u=b.state==='open'?1:b.state==='lowering'?Math.min(1,b.t/1.2):0,angle=(1-u*u)*Math.PI/2;
  const x=b.c+.5-D.dx*.5,y=b.r+.5-D.dy*.5;
  const point=(w,n)=>cam.project(x+S.dx*w+D.dx*n*Math.cos(angle),y+S.dy*w+D.dy*n*Math.cos(angle),b.z+.035+n*Math.sin(angle));
  push(Math.max(b.r+.55,b.r+D.dy*b.length*Math.cos(angle)+.5),b.c+.5,()=>{
   ctx.save();ctx.lineWidth=2;
   const panel=(a,n,c,m,color)=>BK.draw3d.quad(ctx,[point(a,n),point(c,n),point(c,m),point(a,m)],color,'#493728');
   panel(-.48,0,.48,b.length,'#59402b');
   for(let n=0;n<b.length*4;n++)panel(-.46,n/4+.015,.46,(n+1)/4-.015,n%2?'#b68a50':'#996737');
   for(const w of [-.35,.28]){panel(w,0,w+.07,b.length,'#596675');for(let n=.15;n<b.length;n+=.5){const p=point(w+.035,n);ctx.fillStyle='#ffe0a2';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1,p.k*.025),0,Math.PI*2);ctx.fill();}}
   for(const w of [-.52,.52]){const a=cam.project(x+S.dx*w,y+S.dy*w,b.z+1.15),p=point(w,b.length*.9);ctx.strokeStyle=u===0?'#d9c69b':'#9f8a66';ctx.lineWidth=3;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);}
   if(this.editorPreview&&b.state==='raised')for(const q of b.cells)BK.draw3d.quad(ctx,[[q.c,q.r],[q.c+1,q.r],[q.c+1,q.r+1],[q.c,q.r+1]].map(([x,y])=>cam.project(x,y,b.z+.04)),'rgba(255,205,80,.18)','#ffc956');
   ctx.restore();
  });
 }
};

W.kickedBombImpact=function(b,c,r){
 if(!b.kicker||b.rock||this.cell(c,r)||!this.canStep(b.cx,b.cy,c,r))return false;
 const p=this.players.find(p=>p.alive&&!p.npc&&!p.air&&!p.falling&&!p.boat&&Math.floor(p.x)===c&&Math.floor(p.y)===r);
 if(!p){
  // Un magicien qui reçoit une bombe bottée en pleine figure voit des étoiles pendant trois secondes.
  const mage=this.enemies.find(e=>!e.dead&&e.def.behavior==='mage'&&Math.floor(e.x)===c&&Math.floor(e.y)===r);
  if(!mage)return false;
  mage.stunT=3;mage.hurt=Math.max(mage.hurt||0,.3);this.burst(mage.x,mage.y,.45,'#ffe36b',14);this.events.push({type:'enemyStunned',enemy:mage,bomb:b});
  b.state='idle';b.x=b.cx+.5;b.y=b.cy+.5;b.passers=new Set();this.events.push({type:'bombKicked',bomb:b});if(b.t<=0)this.explodeBomb(b);return true;
 }
 if(p!==b.kicker&&this.mode==='adventure'&&!BK.settings.friendlyFire&&(p.leader||p)===(b.kicker.leader||b.kicker))return false;
 p.bombStun=1;p.bombPush={dir:b.dir,left:.95};p.inflating=null;p.onBomb=null;p.zOff=0;this.setPose(p,'hit',1);
 b.state='idle';b.x=b.cx+.5;b.y=b.cy+.5;b.passers=new Set();this.events.push({type:'bombKicked',bomb:b});
 if(b.t<=0)this.explodeBomb(b);return true;
};
W.updateBombStun=function(p,dt){
 if(!(p.bombStun>0))return false;
 p.bombStun=Math.max(0,p.bombStun-dt);p.moving=p.running=false;p.input.bomb=p.input.action=p.input.bombHeld=false;p.input.dx=p.input.dy=0;
 if(p.bombPush?.left>0){const D=BK.DIRS[p.bombPush.dir],distance=Math.min(p.bombPush.left,dt*4);for(let d=0;d<distance;d+=.05){const step=Math.min(.05,distance-d);this.moveCircle(p,D.dx*step,D.dy*step,p);}p.bombPush.left-=distance;}
 if(!this.walkableTerrain(Math.floor(p.x),Math.floor(p.y)))this.startFall(p,this.tAt(Math.floor(p.x),Math.floor(p.y))===2?'water':'void');
 const flame=this.flameTouches(p.x,p.y,p.r);if(flame)this.hitPlayer(p,{kind:'flame',owner:flame.owner,bomb:flame.bomb});
 return true;
};
const stunRender=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 stunRender.call(this,ctx,cam,time,push);
 for(const p of this.players)if(p.alive&&p.bombStun>0)push(p.y+.1,p.x,()=>{const q=cam.project(p.x,p.y,this.groundZ(p.x,p.y)+1.65);ctx.save();ctx.fillStyle='#ffe45e';ctx.strokeStyle='#ad642e';ctx.lineWidth=1.5;ctx.font='bold '+Math.max(14,q.k*.25)+'px sans-serif';ctx.textAlign='center';for(let n=0;n<3;n++){const a=time*8+n*Math.PI*2/3,x=q.x+Math.cos(a)*q.k*.37,y=q.y+Math.sin(a)*q.k*.12;ctx.strokeText('★',x,y);ctx.fillText('★',x,y);}ctx.restore();});
};

W.hitBridgeColumn=function(c,r,b){
 const key=c+','+r,pr=this.props[key];if(!pr?.bridgeColumn||this.brokenBridgeColumns?.has(key))return false;
 if((b.inflation||0)<.65){if(!b.columnHint){b.columnHint=true;this.addFloater(c+.5,r+.5,'Il faut gonfler la bombe !',{size:.24,life:1.8});}return true;}
 this.brokenBridgeColumns=this.brokenBridgeColumns||new Set();this.brokenBridgeColumns.add(key);
 for(let n=0;n<24;n++){const a=n*Math.PI/12;this.particles.push({x:c+.5,y:r+.5,z:this.hAt(c,r)*.5,gz:0,vx:Math.cos(a)*3,vy:Math.sin(a)*3,vz:3+Math.random()*3,t:0,life:1.6,size:.13,color:'#a5a0ad',heavy:true});}
 const group=pr.raisedBridge,remaining=Object.entries(this.props).some(([k,p])=>p.raisedBridge===group&&p.bridgeColumn&&!this.brokenBridgeColumns.has(k));
 if(!remaining){this.bridgeCollapses=this.bridgeCollapses||[];if(!this.bridgeCollapses.some(q=>q.group===group))this.bridgeCollapses.push({group,t:.8});this.addFloater(c+.5,r+.5,'Le pont s’écroule !',{size:.3,life:1.8});}this.shake=.3;return true;
};
W.drawSupportedBridge=function(ctx,cam,c,r,h,time){
 const pr=this.props[c+','+r],D=BK.draw3d;
 if(pr.bridgeColumn&&!this.brokenBridgeColumns?.has(c+','+r)){
  D.cube(ctx,cam,c+.16,r+.16,c+.84,r+.84,.15,{top:'#c8c3ce',front:'#85808e',side:'#625d6a'});
  D.cube(ctx,cam,c+.27,r+.27,c+.73,r+.73,Math.max(.1,h-.3),{top:'#c8c3ce',front:'#aca6b4',side:'#817b8c'},{z:.15,bricks:'#746e7e',rows:Math.ceil(h*4),cols:1});
 }
 const pending=this.bridgeCollapses?.find(q=>q.group===pr.raisedBridge),jitter=pending?Math.sin(time*65)*.03:0;
 const f=D.cube(ctx,cam,c,r,c+1,r+1,.13,{top:'#bb925a',front:'#725337',side:'#513b2b'},{z:h-.13+jitter});ctx.save();ctx.strokeStyle='#725337';ctx.lineWidth=1.5;for(let n=1;n<4;n++){const a=D.onQuad(f.top,0,n/4),b=D.onQuad(f.top,1,n/4);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();
};
const columnUpdate=W.updateArenaEffects;
W.updateArenaEffects=function(dt){
 columnUpdate.call(this,dt);
 for(const q of this.bridgeCollapses||[]){if(q.done)continue;q.t-=dt;if(q.t>0)continue;q.done=true;
  for(const [key,p]of Object.entries(this.props))if(p.raisedBridge===q.group){const [c,r]=key.split(',').map(Number),i=this.idx(c,r);this.burst(c+.5,r+.5,this.height[i],'#a47b49',12,1);this.terrain[i]=4;this.height[i]=0;this.cells[i]=0;this.deco[i]=null;
   for(const hero of this.players)if(hero.alive&&!hero.air&&!hero.falling&&Math.floor(hero.x)===c&&Math.floor(hero.y)===r)this.startFall(hero,'void');
   for(const e of this.enemies)if(!e.dead&&Math.floor(e.x)===c&&Math.floor(e.y)===r)this.hurtEnemy(e,null,999,'bomb');
  }this.shake=.45;
 }
};
})(window.BK);
