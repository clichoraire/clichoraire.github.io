// Œufs destructibles, petits compagnons et souffle de dragon avec les flammes des bombes.
(function(BK){
 'use strict';
 const W=BK.World.prototype,S=BK.sprites,eggs=BK.HATCHING_EGGS;
 const explode=W.explodeBomb;
 W.explodeBomb=function(b){const previous=this.eggExplosion;this.eggExplosion={bomb:b,hit:new Set()};try{return explode.call(this,b);}finally{this.eggExplosion=previous;}};
 const destroy=W.destroyBlock;
 W.destroyBlock=function(c,r,by){
  const i=this.idx(c,r),kind=this.deco[i],egg=eggs[kind];
  if(!egg)return destroy.call(this,c,r,by);
  const blast=this.eggExplosion;if(!blast||blast.hit.has(i))return;
  blast.hit.add(i);
  const props=this.props[c+','+r] ||= {},required=BK.normalizeEggBombs(props.eggBombs??1);
  this.eggHits ||= new Map();const hits=(this.eggHits.get(i)||0)+1;this.eggHits.set(i,hits);
  props.eggCracks=BK.eggCrackStage(hits,required);
  if(hits<required){this.burst(c+.5,r+.5,.3,egg.shell,5);return;}
  this.eggHits.delete(i);
  this.cells[i]=0;this.deco[i]=kind+'_shell';
  this.props[c+','+r]={...(this.props[c+','+r]||{}),deco:kind+'_shell',hatchedAt:this.time};
  const baby=this.addEnemy(egg.id,c,r,{hatchUntil:this.time+1.1,pause:1.1,eggCare:BK.normalizeEggCare(this.props[c+','+r]?.eggCare)});
  const owner=by?.leader||by;
  if(!baby.eggCare.pets&&!baby.eggCare.meals&&owner?.id){baby.bond={owner:owner.id,pets:0,meals:0};baby.follow=owner;baby.followT=60;}
  this.burst(c+.5,r+.5,.4,egg.shell,12);
  this.events.push({type:'blockDestroyed',c,r,player:by});
  this.addFloater(c+.5,r+.5,egg.name+' !',{color:egg.shell,size:.3,life:2});
  return baby;
 };
 // Cherche un chemin jusqu'au maître avant de prendre son envol.
 W.dragonFollow=function(e,p,dt){
  const safe=(c,r)=>this.inside(c,r)&&this.walkableTerrain(c,r)&&!this.cell(c,r)&&!this.bombAt(c,r)&&!this.flameAt.has(this.idx(c,r))&&!this.solidEnemyAt(c,r);
  const landing=()=>{
   const c=Math.floor(p.x),r=Math.floor(p.y),z=this.groundZ(p.x,p.y);
   return BK.DIRS.map(d=>({x:c+d.dx+.5,y:r+d.dy+.5})).concat([{x:p.x,y:p.y}])
    .find(q=>safe(Math.floor(q.x),Math.floor(q.y))&&Math.abs(this.groundZ(q.x,q.y)-z)<.1);
  };
  if(e.followFlight){
   const a=e.followFlight;
   if(!safe(Math.floor(a.x1),Math.floor(a.y1))||Math.abs(this.groundZ(a.x1,a.y1)-a.z1)>.1){e.x=a.x0;e.y=a.y0;e.z=0;e.followFlight=null;e.followBlockedT=0;return true;}
   a.t=Math.min(a.dur,a.t+dt);const u=a.t/a.dur;
   // Une courbe continue, avec vitesse nulle au décollage et au contact du sol.
   const move=u*u*(3-2*u),v=1-move;
   e.x=a.x0+(a.x1-a.x0)*move;e.y=a.y0+(a.y1-a.y0)*move;
   const z=v*v*v*a.z0+3*v*move*a.top+move*move*move*a.z1;
   e.z=Math.max(0,z-this.groundZ(e.x,e.y));e.state='fly';
   if(u===1){e.followFlight=null;e.z=0;e.target=null;e.pause=.1;e.followBlockedT=0;}
   return true;
  }
  if(p.air||p.falling||p.onBomb||p.boat||p.swallowedBy)return false;
  if(e.target&&!this.blocked(e.target.c,e.target.r,e)&&!this.flameAt.has(this.idx(e.target.c,e.target.r)))return false;
  const start={c:Math.floor(e.x),r:Math.floor(e.y)},queue=[start],seen=new Set([start.c+','+start.r]);let route=null;
  for(let i=0;i<queue.length;i++){
   const q=queue[i];
   if(Math.hypot(q.c+.5-p.x,q.r+.5-p.y)<1.1&&Math.abs(this.groundZ(q.c+.5,q.r+.5)-this.groundZ(p.x,p.y))<.2){route=q;break;}
   for(const d of BK.DIRS){const c=q.c+d.dx,r=q.r+d.dy,key=c+','+r;
    if(seen.has(key)||!safe(c,r)||!this.canStep(q.c,q.r,c,r,{x:q.c+.5,y:q.r+.5,climbs:true}))continue;
    seen.add(key);queue.push({c,r,first:q.first||{c,r}});
   }
  }
  if(route){
   e.followBlockedT=0;
   if(!e.target&&route.first){const q=route.first;e.target={...q,x:q.c+.5,y:q.r+.5};e.pause=0;const dx=q.c-start.c,dy=q.r-start.r;e.dir=dx?dx>0?3:1:dy>0?0:2;e.flip=e.dir===1;}
   return false;
  }
  e.target=null;e.state='rest';e.followBlockedT=(e.followBlockedT||0)+dt;
  if(e.followBlockedT<.8)return true;
  const end=landing();if(!end)return true;
  const z0=this.groundZ(e.x,e.y),z1=this.groundZ(end.x,end.y),dist=Math.hypot(end.x-e.x,end.y-e.y);
  let top=Math.max(z0,z1)+1.5;
  for(let i=1,n=Math.max(2,Math.ceil(dist*24));i<n;i++){
   const u=i/n,v=1-u,x=e.x+(end.x-e.x)*u,y=e.y+(end.y-e.y)*u,c=Math.floor(x),r=Math.floor(y);
   // La marge disparaît aux extrémités pour permettre un contact doux au sol.
   const clearance=this.groundZ(x,y)+(this.cell(c,r)?2:0)+.8*Math.sin(Math.PI*u);
   top=Math.max(top,(clearance-v*v*v*z0-u*u*u*z1)/(3*v*u));
  }
  // Adapter la durée au dénivelé aussi : une grande descente ne doit pas devenir un plongeon.
  let dur=Math.max(1.6,dist/2);
  for(let i=0;i<=100;i++){
   const t=i/100,u=t*t*(3-2*t),v=1-u;
   const dz=3*(v*v*(top-z0)+u*u*(z1-top))*6*t*(1-t);
   dur=Math.max(dur,Math.abs(dz)/2.2);
  }
  e.followFlight={x0:e.x,y0:e.y,z0,x1:end.x,y1:end.y,z1,top,t:0,dur};
  e.flip=end.x<e.x;
  return true;
 };
 // Petits bonds de suivi et franchissement d'une seule case.
 W.companionHop=function(e,p,dt){
  const safe=(x,y)=>{const c=Math.floor(x),r=Math.floor(y);return this.inside(c,r)&&this.walkableTerrain(c,r)&&!this.cell(c,r)&&!this.bombAt(c,r)&&!this.flameAt.has(this.idx(c,r))&&!this.solidEnemyAt(c,r);};
  if(e.followHop){
   const a=e.followHop;a.t=Math.min(a.dur,a.t+dt);const u=a.t/a.dur;
   const move=u*u*(3-2*u),fall=Math.max(0,(u-.35)/.65),descent=fall*fall*(3-2*fall);
   e.x=a.x0+(a.x1-a.x0)*move;e.y=a.y0+(a.y1-a.y0)*move;
   const height=a.z0+(a.z1-a.z0)*(a.z1<a.z0?descent:move)+a.h*Math.sin(Math.PI*u)**2;
   e.z=Math.max(0,height-this.groundZ(e.x,e.y));e.state='walk';
   if(u===1){if(!safe(e.x,e.y)){e.x=a.x0;e.y=a.y0;}e.z=0;e.followHop=null;e.target=null;e.pause=.15;}
   return true;
  }
  if(!p?.alive||p.air||p.falling||e.petT>0||e.pause>0||e.followFlight||this.time<(e.rejectUntil||0))return false;
  const c=Math.floor(e.x),r=Math.floor(e.y),z0=this.groundZ(e.x,e.y),distance=Math.hypot(p.x-e.x,p.y-e.y);
  for(const length of [2,1])for(const [dir,d] of BK.DIRS.entries()){
   const mc=c+d.dx,mr=r+d.dy,x1=c+length*d.dx+.5,y1=r+length*d.dy+.5;
   if(!this.inside(mc,mr)||!safe(x1,y1)||Math.hypot(p.x-x1,p.y-y1)>=distance-.3)continue;
   const z1=this.groundZ(x1,y1),middle=this.groundZ(mc+.5,mr+.5),kind=this.deco[this.idx(mc,mr)];
   const descending=z1<z0-.3&&this.groundZ(p.x,p.y)<z0-.3;
   if(length===1&&!descending)continue;
   if(z1-z0>.61||(!descending&&z0-z1>.61)||middle>Math.max(z0,z1)+.65||this.trees.some(t=>t.c===mc&&t.r===mr)||kind&&!BK.CUBE_BLOCKS.includes(kind))continue;
   if(safe(mc+.5,mr+.5)&&this.canStep(c,r,mc,mr,e)&&(!descending||this.ramp[this.idx(mc,mr)]))continue;
   if(this.bombAt(mc,mr)||this.flameAt.has(this.idx(mc,mr)))continue;
   e.followHop={x0:e.x,y0:e.y,z0,x1,y1,z1,t:0,dur:1.05+Math.max(0,z0-z1)*.45,h:this.cell(mc,mr)?1.8:descending?.6:.9};e.target=null;e.dir=dir;if(d.dx)e.flip=d.dx<0;e.hopPhase=0;
   return true;
  }
  return false;
 };
 const peaceful=W.updatePeaceful;
 W.updatePeaceful=function(e,dt){
  if(this.updatePetRefusal(e,dt))return;
  const hopper=e.type==='wild_grenouille'||e.type==='baby_dragon';
  const leader=e.follow||(this.petBondReady(e)?this.players.find(p=>p.id===e.bond.owner):null);
  if(hopper&&this.companionHop(e,leader,dt))return;
  const oldX=e.x,oldY=e.y;
  if(e.def.hatchling){
   e.breathT=Math.max(0,(e.breathT||0)-dt);
   if(this.time<e.hatchUntil){e.state='rest';return;}
   if(e.followFlight&&e.follow)return this.dragonFollow(e,e.follow,dt);
   if(this.petBondReady(e)){
    const owner=this.players.find(p=>p.id===e.bond.owner&&p.alive&&!p.falling);
    if(owner){e.follow=owner;e.followT=60;e.fedT=60;e.followReady=false;
     if(e.type==='baby_dragon'&&!(e.petT>0)&&this.dragonFollow(e,owner,dt))return;
    }
   }
  }
  peaceful.call(this,e,dt);
  if(e.type==='wild_grenouille'&&e.follow&&!(e.petT>0)){
   const moved=Math.hypot(e.x-oldX,e.y-oldY);
   if(moved>.00001){e.hopPhase=(e.hopPhase||0)+moved*Math.PI/ .65;e.z=Math.abs(Math.sin(e.hopPhase))*.32;}
   else{e.hopPhase=0;e.z=0;}
  }
 };
 const friend=W.updateAnimalFriend;
 W.updateAnimalFriend=function(e,dt){
  const p=e.follow;
  if(e.type==='baby_dragon'&&p?.alive&&!p.falling&&e.bond?.owner===p.id&&this.petBondReady(e)&&Math.hypot(p.x-e.x,p.y-e.y)<=6){
   const c=Math.floor(e.x),r=Math.floor(e.y),foe=this.enemies.find(q=>q!==e&&!q.dead&&!q.def.peaceful&&!q.tame&&!['hidden','sealed','transform'].includes(q.state)&&
    (Math.floor(q.x)!==c||Math.floor(q.y)!==r)&&((Math.floor(q.x)===c&&Math.abs(Math.floor(q.y)-r)<=3)||(Math.floor(q.y)===r&&Math.abs(Math.floor(q.x)-c)<=3))&&this.canSee(e,q,3.5));
   if(foe){
    e.target=null;e.state='rest';
    if(!e.friendAttackT){
     const dx=foe.x-e.x,dy=foe.y-e.y,dir=Math.abs(dx)>Math.abs(dy)?(dx>0?3:1):(dy>0?0:2),D=BK.DIRS[dir];
     e.dir=dir;e.flip=dir===1;e.friendAttackT=1.8;e.breathT=.4;
     const breath={owner:p,petBreath:true,safeItems:true,damage:1,level:1,blastSource:'pet'};
     for(let step=1;step<=3;step++){
      const cc=c+D.dx*step,rr=r+D.dy*step;
      if(!this.inside(cc,rr)||this.cell(cc,rr)||!this.walkableTerrain(cc,rr)||Math.abs(this.groundZ(cc+.5,rr+.5)-this.groundZ(e.x,e.y))>.1)break;
      // Une vraie explosion déjà présente garde ses dégâts et son propriétaire.
      if(!this.flameAt.has(this.idx(cc,rr)))this.addFlame(cc,rr,step===3?'end':'mid',dir,breath);
      if(this.solidEnemyAt(cc,rr))break;
     }
    }
    return true;
   }
  }
  return friend.call(this,e,dt);
 };
 const deco=S.drawDeco;
 S.drawDeco=function(ctx,kind,x,y,k,t,nb,seed,orientation,lightColor,props={}){
  const shell=kind?.endsWith('_shell'),egg=eggs[shell?kind.slice(0,-6):kind];
  if(!egg)return deco.call(this,ctx,kind,x,y,k,t,nb,seed,orientation,lightColor,props);
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);
  const oval=(x,y,rx,ry,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
  if(shell){
   const u=Math.min(1,Math.max(0,(t-(props.hatchedAt??t))/ .8));
   for(const side of [-1,1]){
    ctx.save();ctx.translate(side*(.15+.2*u),-.06-Math.sin(u*Math.PI)*.22);ctx.rotate(side*u*.55);
    ctx.fillStyle=egg.shell;ctx.strokeStyle='#647368';ctx.lineWidth=.018;ctx.beginPath();ctx.moveTo(-.16,-.2);
    ctx.lineTo(-.09,-.15);ctx.lineTo(-.02,-.23);ctx.lineTo(.06,-.15);ctx.lineTo(.16,-.2);
    ctx.bezierCurveTo(.22,.1,-.22,.1,-.16,-.2);ctx.fill();ctx.stroke();
    ctx.restore();
   }
  }else{
   oval(0,-.04,.35,.1,'#82674e');oval(0,-.4,.26,.37,egg.shell);
   oval(-.09,-.55,.09,.16,'#ffffff66');
   for(let i=0;i<7;i++)oval(Math.sin(i*2.4)*.17,-.18-(i%4)*.13,.035,.05,egg.color);
   // Les étapes prolongent le même réseau, avec des branches fines et des raccords.
   const stages=[
    [ [[.015,-.752],[.002,-.697],[-.025,-.66],[-.014,-.625],[-.043,-.584],[-.032,-.542],[-.06,-.502]],
      [[-.025,-.66],[.022,-.64],[.045,-.608]],
      [[-.043,-.584],[-.094,-.6],[-.126,-.583]] ],
    [ [[-.06,-.502],[-.094,-.48],[-.091,-.437],[-.128,-.403],[-.142,-.354]],
      [[-.032,-.542],[.012,-.516],[.048,-.522],[.078,-.479],[.118,-.461],[.143,-.409]],
      [[.045,-.608],[.065,-.565],[.048,-.522]],
      [[-.091,-.437],[-.043,-.419],[-.015,-.387]],
      [[.118,-.461],[.17,-.487],[.201,-.477]] ],
    [ [[-.142,-.354],[-.108,-.325],[-.12,-.28],[-.084,-.244],[-.064,-.181]],
      [[.143,-.409],[.108,-.382],[.117,-.341],[.075,-.319],[.056,-.274],[.013,-.253],[-.036,-.266],[-.084,-.244]],
      [[-.015,-.387],[.016,-.396],[.052,-.367],[.061,-.337],[.075,-.319]],
      [[-.128,-.403],[-.183,-.412],[-.215,-.39]],
      [[.117,-.341],[.169,-.323],[.208,-.333]],
      [[.013,-.253],[.033,-.208],[.017,-.162]] ]
   ];
   const stage=Math.max(0,Math.min(3,props.eggCracks||0));
   ctx.save();ctx.beginPath();ctx.ellipse(0,-.4,.255,.365,0,0,Math.PI*2);ctx.clip();
   ctx.lineJoin='round';ctx.lineCap='round';
   for(let n=0;n<stage;n++)for(let j=0;j<stages[n].length;j++){
     const path=stages[n][j];
     // Une lèvre éclairée très fine donne du relief sans transformer la fente en trait épais.
     for(const highlight of [true,false]){
       ctx.strokeStyle=highlight?'#d5efe0':'#38594e';ctx.lineWidth=j===0?.011+stage*.0015:.0065+stage*.001;
       const shift=highlight?.008:0;ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x+shift,y+.002):ctx.moveTo(x+shift,y+.002));ctx.stroke();
     }
   }
   ctx.restore();
  }
  ctx.restore();
 };
 const enemy=S.drawEnemy;
 S.drawEnemy=function(ctx,type,o){
  if(type!=='baby_dragon')return enemy.call(this,ctx,type,o);
  const t=o.t||0,s=(o.s||60)*.72;
  ctx.save();ctx.scale((o.flip?-1:1)*s,s);if(o.creature?.rejectSpitAt>t)ctx.rotate(Math.sin(t*22)*.035);
  const oval=(x,y,rx,ry,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
  const poly=(points,col)=>{ctx.fillStyle=col;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
  const bob=o.state==='walk'?Math.sin(t*9)*.035:Math.sin(t*3)*.015;
  ctx.translate(0,bob);
  poly([[-.08,-.15],[-.54,-.12],[-.41,-.3],[-.3,-.2]],'#4b987c');
  const wing=o.creature?.followFlight?Math.sin(t*20)*.22:0;
  poly([[-.14,-.34],[-.42,-.67+wing],[-.12,-.58],[.02,-.31]],'#398369');
  poly([[-.17,-.37],[-.35,-.58],[-.15,-.52]],'#afd7a1');
  oval(0,-.25,.24,.26,'#68b89a');oval(.09,-.22,.12,.19,'#f5dda1');
  oval(-.12,-.04,.1,.065,'#438f73');oval(.16,-.04,.1,.065,'#438f73');
  oval(.17,-.57,.23,.21,'#68b89a');oval(.34,-.48,.17,.1,'#87c9a7');
  poly([[.01,-.71],[.01,-.91],[.13,-.74]],'#f5dda1');poly([[.22,-.73],[.31,-.86],[.31,-.68]],'#f5dda1');
  oval(.25,-.61,.065,.085,'#fff9e6');oval(.27,-.61,.032,.05,'#243944');oval(.28,-.635,.012,.017,'#fff');
  oval(.43,-.51,.018,.015,'#375c4c');
  if(o.creature?.breathT>0){oval(.43,-.44,.07,.05,'#60372c');poly([[.46,-.49],[.65,-.44],[.46,-.4]],'#ffb738');}
  ctx.strokeStyle='#375c4c';ctx.lineWidth=.018;ctx.beginPath();ctx.moveTo(.3,-.43);ctx.quadraticCurveTo(.38,-.39,.45,-.44);ctx.stroke();
  ctx.restore();
 };
})(window.BK);
