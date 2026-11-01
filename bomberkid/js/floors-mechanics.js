// Règles des sols à mécanique (définis dans floors-plus.js) : roche volcanique, corail, lianes, herbe haute, ardoise,
// bronze, briques, linoléum, émeraude, rondins, acier, sol contaminé, marquage, miroir, tapis roulant, mycélium,
// bonbon, sol électrifié, carrelage magique et sables mouvants. Tout passe par des enveloppes autour du monde.
(function(BK){
'use strict';
const W=BK.World.prototype,DIRS=BK.DIRS,T_WATER=2,T_DIRT=5;
const rnd=(c,r,k)=>{const x=Math.sin(c*127.1+r*311.7+k*74.7)*43758.5453;return x-Math.floor(x);};
// au sol, libre de ses pieds (ni en l'air, ni en barque, ni perché sur une bombe)
const grounded=p=>p.alive&&!p.npc&&!p.air&&!p.falling&&!p.boat&&!p.onBomb&&!p.seat&&!p.swallowedBy&&!((p.zOff||0)>.15);
const cellOf=o=>({c:Math.floor(o.x),r:Math.floor(o.y)});

W.floorId=function(c,r){const f=BK.EXTRA_FLOOR_BY_T[this.tAt(c,r)];return f&&f.id;};
W.overlayAt=function(c,r){return this.props[c+','+r]?.overlay;};
W.onFloor=function(o,id){if(!this.explore)return false;const {c,r}=cellOf(o);return this.floorId(c,r)===id||this.overlayAt(c,r)===id;};
W.floorMessage=function(p,key,text,dur){if(!p.human||p.ally)return;p.floorTips=p.floorTips||{};if(p.floorTips[key])return;p.floorTips[key]=true;this.events.push({type:'floorMessage',player:p,text,dur});};

// Listes utiles (herbe haute, mycélium, carrelages magiques…) faites une fois à la lecture du tableau.
const parse=W.parseExplore;
W.parseExplore=function(map){
 parse.call(this,map);
 const M=this.floorMech={tallGrass:[],mycelium:[],magic:[],has:new Set()};this.logFires=new Map();this.spores=[];
 for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols;c++){
  const id=this.floorId(c,r),over=this.overlayAt(c,r);
  if(id)M.has.add(id);if(over)M.has.add(over);
  if(over==='tallgrass')M.tallGrass.push({c,r});
  if(id==='mycelium')M.mycelium.push({c,r});
  if(id==='magictile')M.magic.push({c,r});
 }
};
const has=(w,id)=>w.floorMech&&w.floorMech.has.has(id);

// ---- Joueurs : lianes, ardoise, marquage, linoléum, émeraude, sol électrifié, sol contaminé, tapis, sables mouvants
const updatePlayer=W.updatePlayer;
W.updatePlayer=function(p,dt){
 if(!this.explore||!this.floorMech||p.npc||!p.alive)return updatePlayer.call(this,p,dt);
 p.vineT=Math.max(0,(p.vineT||0)-dt);p.shockT=Math.max(0,(p.shockT||0)-dt);p.shockCD=Math.max(0,(p.shockCD||0)-dt);p.speedT=Math.max(0,(p.speedT||0)-dt);p.squeakGlow=Math.max(0,(p.squeakGlow||0)-dt);
 const held=p.vineT>0||p.shockT>0;
 const ix=p.input.dx,iy=p.input.dy;if(held){p.input.dx=p.input.dy=0;p.running=false;}   // pris dans les lianes ou paralysé : on peut encore poser une bombe, pas bouger
 const boost=p.speedT>0?p.speed*.3:0,safe=p.safe;p.speed+=boost;
 try{updatePlayer.call(this,p,dt);}finally{p.speed-=boost;if(held&&!p.input.dx&&!p.input.dy){p.input.dx=ix;p.input.dy=iy;}}
 if(!p.alive||!grounded(p)){p.inGrass=false;p.slide=null;return;}
 const c=Math.floor(p.x),r=Math.floor(p.y),i=this.idx(c,r),id=this.floorId(c,r),over=this.overlayAt(c,r);
 if(p._floorCell!==i){const was=p._floorCell;p._floorCell=i;if(was!=null)this.enterFloor(p,c,r,id,over);if(!p.alive||p.falling||p._floorCell!==i)return;}
 p.inGrass=over==='tallgrass';
 // ardoise : quand on lâche la direction, on glisse encore une demi-case
 if(id==='slate'&&!held){if(p.moving){p.slateDir=p.dir;p.slide=null;}else if(p._slateMoving&&!p.slide)p.slide={dir:p.slateDir??p.dir,left:.5};}
 if(p.slide){
  if(p.moving||held)p.slide=null;
  else{const D=DIRS[p.slide.dir],step=Math.min(p.slide.left,Math.max(.9,5*p.slide.left)*dt),ox=p.x,oy=p.y;this.moveCircle(p,D.dx*step,D.dy*step,p);p.slide.left-=step;if(p.slide.left<=1e-4||p.x===ox&&p.y===oy)p.slide=null;}
 }
 p._slateMoving=id==='slate'&&p.moving;
 // linoléum : ça grince à chaque pas, tout le monde l'entend, et la nuit le héros s'éclaire un instant
 p.squeakCD=Math.max(0,(p.squeakCD||0)-dt);
 if(id==='linoleum'&&p.moving&&!p.squeakCD){p.squeakCD=.42;p.squeakGlow=1.2;this.events.push({type:'floorSqueak',player:p});const z=this.groundZ(p.x,p.y);this.particles.push({x:p.x,y:p.y,z,gz:z,vx:0,vy:0,vz:0,life:.45,t:0,color:'rgba(255,230,90,0.9)',size:.12,ring:true});if(Math.random()<.35)this.addFloater(p.x,p.y,'couic !',{color:'#ffe066',size:.24,life:.7,follow:p});}
 // sol électrifié : allumé, il pique (3 points de vie) et paralyse une demi-seconde
 if(id==='electric'&&BK.electricOn(this.time)&&!p.shockCD){
  p.shockCD=1.2;p.shockT=.5;this.burst(p.x,p.y,.5,'#9fe8ff',16);this.burst(p.x,p.y,.3,'#ffffff',6);this.events.push({type:'electricShock',player:p});
  if(this.hearts)this.hitPlayer(p,{kind:'electric',dmg:3});
  this.floorMessage(p,'electric','Bzzz ! Le sol électrifié s’allume 3 secondes sur 6 : traverse quand il est éteint.',3);
  if(!p.alive)return;
 }
 // sol contaminé : y rester plus d'une demi-seconde empoisonne (1 point de vie toutes les 2 secondes, 6 secondes)
 if(over==='toxic'){
  p.toxicT=(p.toxicT||0)+dt;
  if(p.toxicT>.5&&this.hearts){
   if(!(p.poison>0)){p.poison=6;p.poisonTick=2;p.poisonEvery=2;p.poisonDmg=1;if(!this.autoAntipoison(p)){this.burst(p.x,p.y,.4,'#b6f03a',12);this.events.push({type:'toxicPoisoned',player:p});this.floorMessage(p,'toxic','Contaminé ! 1 point de vie toutes les 2 secondes pendant 6 secondes. Sors de la flaque !',3);}}
   else if(p.poisonDmg===1)p.poison=6;   // on reste dedans : le poison dure
  }
 }else p.toxicT=0;
 // tapis roulant : emporte le héros à 1 case par seconde
 if(id==='conveyor'){const D=DIRS[this.props[c+','+r]?.beltDir??3];for(const [mx,my] of [[D.dx*dt,0],[0,D.dy*dt]]){if(!mx&&!my)continue;if(!this.collides(p.x+mx,p.y+my,p.r,p,p)){p.x+=mx;p.y+=my;}}}
 // sables mouvants : attirent vers le centre ; immobile 2 secondes, on s'enfonce
 if(id==='quicksand'){
  this.safeFromSand(p,safe);
  const dx=c+.5-p.x,dy=r+.5-p.y,d=Math.hypot(dx,dy),pull=Math.min(d,.75*dt);if(d>1e-4){p.x+=dx/d*pull;p.y+=dy/d*pull;}
  p.sinkT=p.moving?Math.max(0,(p.sinkT||0)-dt*2):(p.sinkT||0)+dt;
  if(Math.random()<6*dt){const z=this.groundZ(p.x,p.y);this.particles.push({x:p.x+(Math.random()-.5)*.5,y:p.y+(Math.random()-.5)*.3,z,gz:z,vx:0,vy:0,vz:.25,life:.5,t:0,color:'rgba(190,150,80,0.85)',size:.06});}
  if(p.sinkT>.8)this.floorMessage(p,'quicksand','Les sables mouvants t’aspirent ! Bouge, sinon tu t’enfonces !',2.5);
  if(p.sinkT>=2){p.sinkT=0;this.startFall(p,'sand');return;}
 }else p.sinkT=0;
 if(p.speedT>0&&p.moving&&Math.random()<14*dt){const z=this.groundZ(p.x,p.y),D=DIRS[p.dir];this.particles.push({x:p.x-D.dx*.3,y:p.y-D.dy*.3,z:z+.2+Math.random()*.5,gz:z,vx:-D.dx*2,vy:-D.dy*2,vz:0,life:.25,t:0,color:'rgba(255,225,90,0.8)',size:.05,float:true});}
};
// Sur les sables mouvants, le dernier endroit sûr reste celui d'avant.
W.safeFromSand=function(p,safe){if(safe&&this.floorId(Math.floor(safe.x),Math.floor(safe.y))!=='quicksand')p.safe=safe;};
// En entrant sur une case : lianes, marquage, carrelage magique, herbe haute.
W.enterFloor=function(p,c,r,id,over){
 if(over==='tallgrass'){for(const b of this.bombs)if(b.cx===c&&b.cy===r)b.grassSeen=true;for(const it of this.items)if(it.cx===c&&it.cy===r)it.grassSeen=true;}
 if(id==='vines'&&Math.random()<.25){p.vineT=1;p.slide=null;this.burst(p.x,p.y,.35,'#5fae3a',10);this.events.push({type:'vineGrab',player:p});this.addFloater(p.x,p.y,'Pris !',{color:'#8fe05a',size:.3,life:1,follow:p});this.floorMessage(p,'vines','Les lianes s’enroulent autour de tes pieds ! Tu es pris 1 seconde.',2.5);}
 if(id==='speedmark'){if(!(p.speedT>0))this.events.push({type:'speedBoost',player:p});p.speedT=2;this.floorMessage(p,'speedmark','Zoum ! 30 % plus vite pendant 2 secondes.',2);}
 if(id==='magictile')this.magicTeleport(p,c,r);
};
// Carrelage magique : on réapparaît sur un autre carrelage magique libre, pris au hasard.
W.magicTeleport=function(p,c,r){
 const free=this.floorMech.magic.filter(q=>(q.c!==c||q.r!==r)&&this.floorId(q.c,q.r)==='magictile'&&!this.cell(q.c,q.r)&&!this.bombAt(q.c,q.r)&&!this.enemies.some(e=>!e.dead&&Math.floor(e.x)===q.c&&Math.floor(e.y)===q.r)&&!this.players.some(o=>o!==p&&o.alive&&Math.floor(o.x)===q.c&&Math.floor(o.y)===q.r));
 if(!free.length)return false;const q=free[Math.floor(Math.random()*free.length)];
 this.burst(p.x,p.y,.55,'#c9a2ff',18);this.burst(p.x,p.y,.35,'#ffe27a',8);
 p.x=q.c+.5;p.y=q.r+.5;p.vx=p.vy=0;p.slide=null;p._floorCell=this.idx(q.c,q.r);
 this.burst(p.x,p.y,.55,'#c9a2ff',18);this.burst(p.x,p.y,.35,'#ffe27a',8);
 this.events.push({type:'floorTeleport',player:p,from:{c,r},to:q});this.floorMessage(p,'magictile','Pouf ! Le carrelage magique t’a téléporté sur un autre carrelage magique.',2.5);return true;
};
// Sables mouvants : on s'enfonce doucement (dessiné comme dans l'eau), puis retour au dernier endroit sûr.
const updateFall=W.updateFall;
W.updateFall=function(p,dt){
 const f=p.falling;if(f.kind!=='sand')return updateFall.call(this,p,dt);
 if(!f.sinking){f.sinking=true;f.z=f.z0=this.groundZ(p.x,p.y);f.splashed=true;f.splashT=0;f.dur=1.3;this.events.push({type:'floorMessage',player:p,text:'Englouti par les sables mouvants…',dur:2});}
 f.t+=dt;f.splashT+=dt;p.animT+=dt;p.poseT+=dt;f.z=Math.max(f.z0-.95,f.z-.8*dt);
 if(Math.random()<12*dt)this.particles.push({x:p.x+(Math.random()-.5)*.5,y:p.y+(Math.random()-.5)*.2,z:f.z0,gz:f.z0,vx:0,vy:0,vz:Math.random()*.6,life:.5,t:0,color:'rgba(200,160,90,0.9)',size:.07});
 if(f.t>=f.dur)this.finishFall(p);
};
const drawFalling=W.drawFalling;
W.drawFalling=function(ctx,cam,p,time){const f=p.falling;if(f.kind!=='sand')return drawFalling.call(this,ctx,cam,p,time);f.kind='water';try{drawFalling.call(this,ctx,cam,p,time);}finally{f.kind='sand';}};

// ---- Briques rouges : bonne adhérence, ni le choc du bouclier ni la bombe reçue ne font reculer
const hitPlayer=W.hitPlayer;
W.hitPlayer=function(p,source){if(!this.onFloor(p,'redbrick'))return hitPlayer.call(this,p,source);const x=p.x,y=p.y,hit=hitPlayer.call(this,p,source);if(p.alive){p.x=x;p.y=y;}return hit;};
const bombStun=W.updateBombStun;
W.updateBombStun=function(p,dt){if(p.bombPush&&this.onFloor(p,'redbrick'))p.bombPush=null;return bombStun?bombStun.call(this,p,dt):false;};

// ---- Herbe haute : les ennemis ne voient pas un héros caché dedans (sauf tout près)
const nearest=W.nearestPlayer;
W.nearestPlayer=function(x,y){
 const best=nearest.call(this,x,y);if(!best||!best.inGrass||Math.hypot(best.x-x,best.y-y)<1.5)return best;
 let pick=null,bd=1e9;for(const p of this.players){if(!p.alive||p.npc||p.inGrass&&Math.hypot(p.x-x,p.y-y)>=1.5)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;pick=p;}}return pick;
};
W.grassHides=function(o){const c=o.cx,r=o.cy;return !o.grassSeen&&this.inside(c,r)&&this.overlayAt(c,r)==='tallgrass';};

// ---- Émeraude : on ne pose pas de bombe dessus, elle glisse sur une case voisine
const placeBomb=W.placeBomb;
W.placeBomb=function(p){
 if(!this.explore)return placeBomb.call(this,p);
 const c=Math.floor(p.x),r=Math.floor(p.y);if(this.floorId(c,r)!=='emerald')return placeBomb.call(this,p);
 if(p.heldSnail||p.boat||p.bombsOut>=p.bombsMax||this.cell(c,r)||this.bombAt(c,r))return false;
 const busy=(cc,rr)=>this.players.some(q=>q.alive&&Math.floor(q.x)===cc&&Math.floor(q.y)===rr)||this.enemies.some(e=>!e.dead&&Math.floor(e.x)===cc&&Math.floor(e.y)===rr);
 for(const d of [p.dir,(p.dir+1)%4,(p.dir+3)%4,(p.dir+2)%4]){
  const D=DIRS[d],nc=c+D.dx,nr=r+D.dy;
  if(!this.inside(nc,nr)||this.cell(nc,nr)||this.bombAt(nc,nr)||!this.walkableTerrain(nc,nr)||!this.canStep(c,r,nc,nr)||this.floorId(nc,nr)==='emerald'||busy(nc,nr))continue;
  if(!placeBomb.call(this,p))return false;
  const b=this.bombs[this.bombs.length-1];b.state='sliding';b.dir=d;b.kicker=p;b.stopAt={c:nc,r:nr};
  this.burst(c+.5,r+.5,.4,'#7ef0b4',12);this.events.push({type:'emeraldSlide',bomb:b,player:p});this.floorMessage(p,'emerald','Zone sacrée ! La bombe glisse sur la case d’à côté.',2.5);return true;
 }
 this.addFloater(p.x,p.y,'Zone sacrée !',{color:'#7ef0b4',size:.3,life:1,follow:p});return false;
};

// ---- Bombes : arrêt (émeraude, bonbon), tapis roulant, herbe haute
const stopBomb=(w,b)=>{b.state='idle';b.x=b.cx+.5;b.y=b.cy+.5;b.stopAt=null;b.slideCell=null;b.passers=new Set(w.players.filter(p=>p.alive&&Math.floor(p.x)===b.cx&&Math.floor(p.y)===b.cy));};
W.beltFree=function(c,r,b){return this.inside(c,r)&&!this.cell(c,r)&&this.walkableTerrain(c,r)&&this.canStep(b.cx,b.cy,c,r)&&!this.bombAt(c,r)&&!this.players.some(p=>p.alive&&!p.npc&&Math.floor(p.x)===c&&Math.floor(p.y)===r)&&!this.enemies.some(e=>!e.dead&&Math.floor(e.x)===c&&Math.floor(e.y)===r);};
const updateBombs=W.updateBombs;
W.updateBombs=function(dt){
 if(!this.explore||!this.floorMech)return updateBombs.call(this,dt);
 for(const b of this.bombs){
  if(b.state!=='sliding'){b.slideCell=null;continue;}
  if(b.stopAt&&b.cx===b.stopAt.c&&b.cy===b.stopAt.r){const D=DIRS[b.dir],along=D.dx?(b.x-b.cx-.5)*D.dx:(b.y-b.cy-.5)*D.dy;if(along>=-.02){stopBomb(this,b);continue;}}
  const key=b.cx+','+b.cy;   // bonbon : une bombe poussée qui y entre s'arrête net
  if(b.slideCell!=null&&b.slideCell!==key&&this.floorId(b.cx,b.cy)==='candy'){stopBomb(this,b);this.burst(b.x,b.y,.3,'#ff9fcf',8);this.events.push({type:'candyStick',bomb:b});continue;}
  b.slideCell=key;
 }
 updateBombs.call(this,dt);
 for(const b of this.bombs){
  if(b.exploded||b.state!=='idle'||b.underElevator)continue;
  if(has(this,'conveyor')&&(b.belt||this.floorId(b.cx,b.cy)==='conveyor')){   // tapis roulant : 1 case par seconde, arrêt au centre si la case suivante est prise
   let tx=b.cx+.5,ty=b.cy+.5;const onBelt=this.floorId(b.cx,b.cy)==='conveyor';
   if(onBelt){const D=DIRS[this.props[b.cx+','+b.cy]?.beltDir??3];if(this.beltFree(b.cx+D.dx,b.cy+D.dy,b)){tx+=D.dx;ty+=D.dy;}}
   const dx=tx-b.x,dy=ty-b.y,d=Math.hypot(dx,dy),step=Math.min(d,dt);
   if(d>1e-4){b.x+=dx/d*step;b.y+=dy/d*step;}
   const c=Math.floor(b.x),r=Math.floor(b.y);
   if(c!==b.cx||r!==b.cy){b.cx=c;b.cy=r;b.passers=new Set();const it=this.itemAt(c,r);if(it&&!(b.safeItems||b.owner&&b.owner.safeitems))this.items.splice(this.items.indexOf(it),1);}
   b.belt=Math.hypot(b.cx+.5-b.x,b.cy+.5-b.y)>1e-3;
  }
  if(!b.grassSeen&&!b.big&&!b.giga&&this.grassHides(b)&&this.players.some(q=>q.alive&&!q.npc&&q.moving&&!b.passers?.has(q)&&Math.hypot(q.x-b.x,q.y-b.y)<.95&&((b.x-q.x)*DIRS[q.dir].dx+(b.y-q.y)*DIRS[q.dir].dy)>.6))b.grassSeen=true;   // on la heurte : elle se voit
 }
};

// ---- Explosions : roche volcanique (rayon −1), corail (devient eau profonde), plaques d'acier (souffle transmis)
const explodeBomb=W.explodeBomb;
W.explodeBomb=function(b){
 if(b.exploded||b.rock||!this.explore||!this.floorMech)return explodeBomb.call(this,b);
 const c=b.state==='idle'||b.state==='sliding'?b.cx:Math.floor(b.x),r=b.state==='idle'||b.state==='sliding'?b.cy:Math.floor(b.y),id=this.inside(c,r)?this.floorId(c,r):null;
 if(id==='volcanic'){b.fire=Math.max(0,b.fire-1);this.burst(c+.5,r+.5,.45,'rgba(70,62,64,0.85)',12);}
 explodeBomb.call(this,b);
 if(id==='coral')this.breakCoral(c,r);
 if(id==='steel')this.steelShock(c,r,b);
};
W.breakCoral=function(c,r){
 const i=this.idx(c,r);this.terrain[i]=T_WATER;this.deepWater.add(i);
 this.burst(c+.5,r+.5,.5,'#ff8f80',16);this.burst(c+.5,r+.5,.4,'#9fd4ff',12);this.events.push({type:'coralBroken',c,r});
};
W.steelShock=function(c,r,b){
 const h=this.height[this.idx(c,r)],seen=new Set([this.idx(c,r)]),queue=[[c,r]];
 for(let n=0;n<queue.length&&n<400;n++){
  const [x,y]=queue[n];
  for(const D of DIRS){
   const nx=x+D.dx,ny=y+D.dy;if(!this.inside(nx,ny))continue;const j=this.idx(nx,ny);
   if(seen.has(j)||this.floorId(nx,ny)!=='steel'||this.cell(nx,ny)||Math.abs(this.height[j]-h)>.01)continue;
   seen.add(j);queue.push([nx,ny]);this.addFlame(nx,ny,'center',0,b);this.burst(nx+.5,ny+.5,.3,'#dfefff',5);
   const ob=this.bombAt(nx,ny);if(ob&&!ob.rock)this.explodeBomb(ob);
  }
 }
 if(queue.length>1)this.events.push({type:'steelShock',c,r,count:queue.length-1});
};
// Bronze : la branche du souffle ricoche à angle droit des deux côtés au lieu de traverser.
W.deflectBlast=function(c,r,d,left,b){
 if(!this.explore||this.floorId(c,r)!=='bronze'||(b.ricochets||0)>=24)return false;
 b.ricochets=(b.ricochets||0)+1;this.burst(c+.5,r+.5,.35,'#ffc77a',8);
 for(const side of [(d+1)%4,(d+3)%4])this.blastRay(c,r,side,left,b);
 return true;
};
// Flammes posées sur les rondins (ils brûlent 3 s) ou sur le mycélium (détruit, nuage de spores).
const addFlame=W.addFlame;
W.addFlame=function(c,r,kind,dir,bomb){
 const f=addFlame.call(this,c,r,kind,dir,bomb);
 if(this.explore&&this.floorMech&&this.inside(c,r)){const id=this.floorId(c,r);if(id==='logs')this.igniteLogs(c,r,bomb);else if(id==='mycelium')this.burstMycelium(c,r);}
 return f;
};
W.igniteLogs=function(c,r,bomb){const i=this.idx(c,r),old=this.logFires.get(i);if(old){old.t=3;return;}this.logFires.set(i,{c,r,t:3,owner:bomb&&bomb.owner});this.events.push({type:'logsFire',c,r});};
W.burstMycelium=function(c,r){
 const i=this.idx(c,r);this.terrain[i]=T_DIRT;this.floorMech.mycelium=this.floorMech.mycelium.filter(q=>q.c!==c||q.r!==r);
 this.spores.push({x:c+.5,y:r+.5,z:this.hAt(c,r),t:0,dur:4});this.burst(c+.5,r+.5,.6,'#b99af0',18);this.burst(c+.5,r+.5,.4,'#7ff0e0',10);this.events.push({type:'spores',c,r});
};

// ---- Chaque image : rondins en feu, spores, objets sur le tapis roulant
const updateEffects=W.updateArenaEffects;
W.updateArenaEffects=function(dt){
 updateEffects.call(this,dt);if(!this.explore||!this.floorMech)return;
 if(this.logFires.size){
  for(const [i,f] of this.logFires){f.t-=dt;if(f.t<=0)this.logFires.delete(i);else if(Math.random()<10*dt){const z=this.hAt(f.c,f.r);this.particles.push({x:f.c+.2+Math.random()*.6,y:f.r+.2+Math.random()*.6,z:z+.2,gz:z,vx:0,vy:0,vz:.8,life:.6,t:0,color:Math.random()<.5?'rgba(255,170,60,0.85)':'rgba(90,80,80,0.6)',size:.06,float:true});}}
  for(const p of this.players){   // 1 point de vie par seconde sur une case qui brûle
   const f=grounded(p)&&this.logFires.get(this.idx(Math.floor(p.x),Math.floor(p.y)));
   if(!f){p.logTick=0;continue;}
   p.logTick=(p.logTick||0)-dt;if(p.logTick>0)continue;p.logTick=1;
   if(!this.hearts)continue;this.damage(p,1,{kind:'logsFire'});this.burst(p.x,p.y,.3,'#ff8a1f',6);this.floorMessage(p,'logs','Les rondins brûlent ! Sors du feu.',2);
   if(p.hp<=0)this.killPlayer(p,{kind:'logsFire'});
  }
  for(const e of this.enemies){if(e.dead||(e.z||0)>.5)continue;const f=this.logFires.get(this.idx(Math.floor(e.x),Math.floor(e.y)));if(!f){e.logTick=0;continue;}e.logTick=(e.logTick||0)-dt;if(e.logTick<=0){e.logTick=1;this.hurtEnemy(e,f.owner,1,'other');}}
 }
 for(const s of this.spores)s.t+=dt;if(this.spores.length)this.spores=this.spores.filter(s=>s.t<s.dur);
 if(has(this,'conveyor'))for(const it of this.items){
  const c=it.cx,r=it.cy;if(this.floorId(c,r)!=='conveyor'){it.beltT=0;continue;}
  it.beltT=(it.beltT||0)+dt;if(it.beltT<1||it.from&&this.time-it.born<(it.flyDur||.4))continue;it.beltT-=1;
  const D=DIRS[this.props[c+','+r]?.beltDir??3],nc=c+D.dx,nr=r+D.dy;
  if(!this.inside(nc,nr)||this.cell(nc,nr)||!this.walkableTerrain(nc,nr)||this.bombAt(nc,nr)||this.itemAt(nc,nr))continue;
  it.from={x:c+.5,y:r+.5};it.cx=nc;it.cy=nr;it.born=this.time;it.flyDur=.3;
 }
};

// ---- Lumières : mycélium, rondins en feu, héros qui fait grincer le linoléum
const lights=W.lights;
W.lights=function(){
 const L=lights.call(this);if(!this.floorMech)return L;
 for(const q of this.floorMech.mycelium)L.push({x:q.c+.5,y:q.r+.5,z:this.hAt(q.c,q.r)+.1,r:1.5+.1*Math.sin(this.time*1.6+q.c+q.r),warm:0});
 for(const f of this.logFires.values())L.push({x:f.c+.5,y:f.r+.5,z:this.hAt(f.c,f.r)+.3,r:1.9,warm:.7});
 for(const p of this.players)if(p.alive&&p.squeakGlow>0)L.push({x:p.x,y:p.y,z:this.groundZ(p.x,p.y)+.5,r:2.6*Math.min(1,p.squeakGlow),warm:.35});
 return L;
};

// ---- Dessin : objets cachés dans l'herbe haute, puis brins d'herbe, feu, miroirs, lianes, éclairs, sable
const render=W.render;
W.render=function(ctx,cam,o){
 if(!this.explore||!this.floorMech||!this.floorMech.tallGrass.length||this.editorPreview)return render.call(this,ctx,cam,o);
 const items=this.items,bombs=this.bombs;
 this.items=items.filter(it=>!this.grassHides(it));this.bombs=bombs.filter(b=>b.state!=='idle'||b.big||b.giga||!this.grassHides(b));
 try{return render.call(this,ctx,cam,o);}finally{this.items=items;this.bombs=bombs;}
};
W.drawTallGrass=function(ctx,cam,c,r,time,stir,rustle){
 const z=this.hAt(c,r);
 for(let i=0;i<13;i++){
  const u=.08+rnd(c,r,i)*.84,v=.12+rnd(c,r,i+20)*.84,x=c+u,y=r+v,h=(stir?.3:.5)+rnd(c,r,i+40)*.2,lean=(u-.5)*(stir?.7:.15)+Math.sin(time*(rustle?14:1.6)+i+c*.7)*(rustle?.06:.04);
  const a=cam.project(x,y,z),b=cam.project(x+lean,y,z+h),m=cam.project(x+lean*.3,y,z+h*.55);
  ctx.strokeStyle=i%3===0?'#7cbc4a':i%3===1?'#4f8f30':'#3b7424';ctx.lineWidth=Math.max(1.2,a.k*.05);ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(a.x-a.k*.02,a.y);ctx.quadraticCurveTo(m.x,m.y,b.x,b.y);ctx.stroke();
 }
};
const renderEffects=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 renderEffects.call(this,ctx,cam,time,push);if(!this.explore||!this.floorMech)return;
 const D3=BK.draw3d,S=BK.sprites;
 for(const q of this.floorMech.tallGrass){
  const {c,r}=q;if(this.overlayAt(c,r)!=='tallgrass')continue;
  const stir=this.players.some(p=>p.alive&&Math.floor(p.x)===c&&Math.floor(p.y)===r),rustle=this.bombs.some(b=>b.cx===c&&b.cy===r&&b.state==='idle'&&!b.grassSeen);
  push(r+.985,c+.5,()=>this.drawTallGrass(ctx,cam,c,r,time,stir,rustle));
 }
 for(const f of this.logFires.values())push(f.r+.55,f.c+.5,()=>S.drawFlame(ctx,cam,f.c,f.r,.42+.08*Math.sin(time*11+f.c)*(f.t<.6?f.t/.6:1),'center',0,f.c*3.1+f.r,this.hAt(f.c,f.r),false));
 for(const p of this.players){
  if(!p.alive||p.falling||p.boat)continue;
  if(this.onFloor(p,'mirror')&&grounded(p))push(p.y-.05,p.x+.6,()=>{   // reflet décalé : un faux héros un peu à côté
   const gx=p.x+.6+.08*Math.sin(time*1.3),gy=p.y-.1,pr=cam.project(gx,gy,this.groundZ(p.x,p.y));
   ctx.save();ctx.globalAlpha=.36+.08*Math.sin(time*3);ctx.translate(pr.x,pr.y);
   S.drawCharacter(ctx,p.def,{s:pr.k,pose:p.pose,t:p.animT,poseT:p.poseT,view:p.dir===0?'front':p.dir===2?'back':'side',flip:p.dir!==1,walk:p.walk});ctx.restore();
  });
  if(p.vineT>0)push(p.y+.01,p.x,()=>{const pr=cam.project(p.x,p.y,this.groundZ(p.x,p.y));ctx.save();ctx.strokeStyle='#3f7d26';ctx.lineWidth=Math.max(2,pr.k*.06);for(let n=0;n<3;n++){ctx.beginPath();ctx.ellipse(pr.x,pr.y-pr.k*(.06+n*.1),pr.k*(.26-n*.04),pr.k*.08,0,.2+n,Math.PI*1.7+n);ctx.stroke();}ctx.fillStyle='#86c64f';for(let n=0;n<4;n++){ctx.beginPath();ctx.ellipse(pr.x+Math.cos(n*1.7)*pr.k*.24,pr.y-pr.k*(.05+n*.07),pr.k*.06,pr.k*.03,n,0,Math.PI*2);ctx.fill();}ctx.restore();});
  if(p.shockT>0)push(p.y+.01,p.x,()=>{const pr=cam.project(p.x,p.y,this.groundZ(p.x,p.y));ctx.save();ctx.strokeStyle='rgba(200,245,255,0.95)';ctx.lineWidth=2;for(let n=0;n<3;n++){let x=pr.x+(Math.random()-.5)*pr.k*.6,y=pr.y-pr.k*1.1;ctx.beginPath();ctx.moveTo(x,y);for(let s=0;s<4;s++){x+=(Math.random()-.5)*pr.k*.3;y+=pr.k*.25;ctx.lineTo(x,y);}ctx.stroke();}ctx.restore();});
  if(p.sinkT>0)push(p.y+.02,p.x,()=>{const pr=cam.project(p.x,p.y,this.groundZ(p.x,p.y)),u=Math.min(1,p.sinkT/2);ctx.save();ctx.fillStyle='#c9a35a';ctx.beginPath();ctx.ellipse(pr.x,pr.y-pr.k*.05*u,pr.k*(.3+.15*u),pr.k*(.1+.25*u),0,0,Math.PI*2);ctx.fill();ctx.restore();});
 }
 for(const b of this.bombs)if(b.state==='idle'&&!b.rock&&this.onFloor(b,'mirror')&&!(this.grassHides(b)&&!b.big))push(b.y-.05,b.x+.6,()=>{const pr=cam.project(b.x+.6,b.y-.1,this.groundZ(b.x,b.y)),bs=pr.k*.34*(b.big?1.3:1);ctx.save();ctx.globalAlpha=.36;S.drawBomb(ctx,pr.x,pr.y-bs,bs,{level:b.level,giga:b.giga,t:time-b.born,fuse:Math.max(0,b.t/BK.BOMB_FUSE)});ctx.restore();});
};
// Nuages de spores du mycélium : de gros flocons mauves, et la vue se resserre autour du héros pris dedans.
const renderNight=W.renderNight;
W.renderNight=function(ctx,cam){
 renderNight.call(this,ctx,cam);if(!this.spores||!this.spores.length)return;
 const w=ctx.canvas.width,h=ctx.canvas.height,hero=this.players.find(p=>p.human&&!p.ally&&!p.npc&&p.alive);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 let fog=0;
 for(const s of this.spores){
  const fade=Math.min(1,s.t/.3,(s.dur-s.t)/.8);
  for(let n=0;n<14;n++){const a=n*2.4+s.x,rad=.4+((n*37)%10)/10*1.6+s.t*.15,pr=cam.project(s.x+Math.cos(a)*rad,s.y+Math.sin(a)*rad*.8,s.z+.3+((n*13)%5)/10);ctx.fillStyle='rgba('+(n%2?'170,140,220':'120,200,190')+','+(.5*fade)+')';ctx.beginPath();ctx.arc(pr.x,pr.y,pr.k*(.5+((n*7)%4)/10),0,Math.PI*2);ctx.fill();}
  if(hero&&Math.hypot(hero.x-s.x,hero.y-s.y)<2.6)fog=Math.max(fog,fade);
 }
 if(fog>0){const pr=cam.project(hero.x,hero.y,this.groundZ(hero.x,hero.y)+.5),R=pr.k*1.4,g=ctx.createRadialGradient(pr.x,pr.y,R*.4,pr.x,pr.y,R*2.2);g.addColorStop(0,'rgba(40,25,60,0)');g.addColorStop(1,'rgba(40,25,60,'+(.85*fog)+')');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 ctx.restore();
};

// Sons des nouveaux événements
if(BK.audio&&BK.audio.MAP){const A=BK.audio;Object.assign(A.MAP,{floorSqueak:A.squeak,vineGrab:A.swing,speedBoost:A.boing,floorTeleport:A.magic,electricShock:A.shield,toxicPoisoned:A.hiss,emeraldSlide:A.kick,candyStick:A.plop,coralBroken:A.splash,steelShock:A.cannon,logsFire:A.fire,spores:A.puff});}
})(window.BK);
