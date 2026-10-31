// Même empreinte pour les dégâts et la prévision des alliés. Calculée avant de casser les blocs.
(function(BK){
'use strict';
const W=BK.World.prototype;
// Le souffle couvre un carré (distance de « fire » cases de chaque côté) et se propage de case en case, comme un feu en 2D :
// il traverse et casse les blocs destructibles, contourne les murs, et ne passe que par les cases reliées au centre.
W.domeCells=function(b,c,r){
 const radius=Math.max(1,Math.min(12,Number(b.fire)||1)),z=this.hAt(c,r),cells=[],seen=new Set([c+','+r]),queue=[{c,r}];
 const wall=(x,y)=>!this.inside(x,y)||[BK.HARD,BK.GATE,BK.SEALED,BK.METAL].includes(this.cell(x,y))||this.solidEnemyAt(x,y)||this.blastDrawbridges?.some(q=>q.state!=='open'&&q.c===x&&q.r===y)||(this.explore&&Math.abs(this.hAt(x,y)-z)>.01&&!this.ramp[this.idx(x,y)]&&!this.props[x+','+y]?.bridgeColumn);
 for(let i=0;i<queue.length;i++){
  const q=queue[i];cells.push({c:q.c,r:q.r,distance:Math.hypot(q.c-c,q.r-r)});
  BK.DIRS.forEach((d,di)=>{
   const x=q.c+d.dx,y=q.r+d.dy,k=x+','+y;if(seen.has(k)||Math.max(Math.abs(x-c),Math.abs(y-r))>radius)return;seen.add(k);
   // Bloc de métal : seule sa face en bois cède, quand le feu arrive dessus (face opposée à sa direction) ; il ne traverse pas.
   if(this.inside(x,y)&&this.cell(x,y)===BK.METAL){if((this.metal[this.idx(x,y)]+2)%4===di)cells.push({c:x,r:y,distance:Math.hypot(x-c,y-r),wood:true});return;}
   if(wall(x,y)){if(this.inside(x,y)&&['chest','mailbox','beehive'].includes(this.deco[this.idx(x,y)]))cells.push({c:x,r:y,distance:Math.hypot(x-c,y-r)});return;}   // un coffre au bord du souffle éclate quand même
   queue.push({c:x,r:y});
  });
 }
 return cells;
};
W.explodeDome=function(b,c,r){
 const cells=this.domeCells(b,c,r),chains=[];this.domeBursts=this.domeBursts||[];this.domeBursts.push({c,r,radius:b.fire,z:this.hAt(c,r),level:b.level||1,t:0,duration:BK.FLAME_TIME*(b.level>=2?2:1),cells:new Set(cells.filter(q=>![BK.HARD,BK.GATE,BK.SEALED,BK.METAL].includes(this.cell(q.c,q.r))).map(q=>q.c+','+q.r))});
 for(const q of cells){const x=q.c,y=q.r,v=this.cell(x,y),kind=this.deco[this.idx(x,y)];
  if(this.hitBridgeColumn?.(x,y,b))continue;
  if(this.hitBlastDrawbridge?.(x,y,b))continue;
  if(v===BK.METAL){if(!q.wood)continue;this.destroyMetal(x,y,b.owner);}
  else if([BK.HARD,BK.GATE,BK.SEALED].includes(v)){
   if(kind==='chest')this.destroyChest(x,y,b.owner);else if(kind==='mailbox')this.destroyMailbox(x,y,b.owner);else if(kind==='beehive')this.destroyHive(x,y,b.owner);else continue;
  }
  if(v===BK.SOFT)this.destroyBlock(x,y,b.owner);
  if(v===BK.BARREL)this.igniteBarrel(x,y,b.owner);
  const f=this.addFlame(x,y,'center',0,b);
  f.domeHeight=Math.max(f.domeHeight||0,.4+Math.sqrt(Math.max(0,b.fire*b.fire-q.distance*q.distance))*.55);
  const other=this.bombAt(x,y);if(other&&other!==b&&!other.rock)chains.push(other);
 }
 for(const other of chains)this.explodeBomb(other);
};

// Une seule surface lumineuse, sans sprites de flammes individuels ni maillage visible.
BK.domeAnimation=function(t,duration){
 const u=Math.max(0,Math.min(1,t/duration)),grow=1-Math.pow(1-Math.min(1,u/.32),3);
 return {scale:.07+.93*grow,height:1-.2*Math.max(0,(u-.62)/.38),alpha:u<.62?1:Math.pow((1-u)/.38,.7),u};
};
const update=W.updateArenaEffects;
W.updateArenaEffects=function(dt){update.call(this,dt);for(const d of this.domeBursts||[])d.t+=dt;this.domeBursts=(this.domeBursts||[]).filter(d=>d.t<d.duration);};
const render=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 render.call(this,ctx,cam,time,push);
 for(const d of this.domeBursts||[]){
  const anim=BK.domeAnimation(d.t,d.duration),radius=(d.radius+.42)*anim.scale;
  // Le bord suit le souffle réellement accessible : pas de bulle à travers les murs.
  const limits=Array.from({length:65},(_,n)=>{const a=n*Math.PI/32;let limit=0;for(let q=0;q<=radius;q+=.08){const c=Math.floor(d.c+.5+Math.cos(a)*q),r=Math.floor(d.r+.5+Math.sin(a)*q);if(!this.inside(c,r)||Math.hypot(c-d.c,r-d.r)<=d.radius&&!d.cells.has(c+','+r))break;limit=q;}return Math.min(radius,limit+.04);});
  const point=(n,band)=>{const a=n*Math.PI/32,p=band*Math.PI/24,R=limits[n];return cam.project(d.c+.5+Math.cos(a)*Math.cos(p)*R,d.r+.5+Math.sin(a)*Math.cos(p)*R,d.z+Math.sin(p)*R*.78*anim.height);};
  const center=cam.project(d.c+.5,d.r+.5,d.z+radius*.3),base=cam.project(d.c+.5,d.r+.5,d.z),size=Math.max(1,base.k*radius);
  push(d.r+radius+.6,d.c+.5,()=>{
   ctx.save();ctx.globalAlpha=anim.alpha*.52; // Le héros et les ennemis restent visibles à travers le feu.
   // Tous les panneaux sont réunis dans un seul tracé, rempli une seule fois.
   ctx.beginPath();
   for(let band=0;band<12;band++)for(let n=0;n<64;n++){
    const q=[point(n,band),point(n+1,band),point(n+1,band+1),point(n,band+1)];
    const area=q.reduce((sum,p,i)=>sum+p.x*q[(i+1)%4].y-q[(i+1)%4].x*p.y,0);if(area<0)q.reverse();
    ctx.moveTo(q[0].x,q[0].y);for(let k=1;k<4;k++)ctx.lineTo(q[k].x,q[k].y);ctx.closePath();
   }
   const glow=ctx.createRadialGradient(center.x-size*.12,center.y-size*.1,size*.02,center.x,center.y,size);
   glow.addColorStop(0,'#fffde1');glow.addColorStop(.28,'#fff39a');glow.addColorStop(.53,d.level>=2?'#ff9b45':'#ffcf44');glow.addColorStop(.76,d.level>=2?'#ff3a23':'#ff821c');glow.addColorStop(.94,d.level>=2?'#cb102c':'#f04413');glow.addColorStop(1,'#ffb13b');
   ctx.fillStyle=glow;ctx.shadowColor=d.level>=2?'#ff3825':'#ff981d';ctx.shadowBlur=Math.min(45,size*.12);ctx.fill();ctx.shadowBlur=0;
   // Bandes courbes de chaleur sur la surface : une bulle qui tourbillonne.
   ctx.save();ctx.clip();ctx.lineCap='round';
   for(let k=0;k<4;k++){
    ctx.strokeStyle=k%2?'rgba(255,249,181,.5)':'rgba(255,116,20,.28)';ctx.lineWidth=size*(.018+k*.004);ctx.beginPath();
    const offset=d.t*3+k*1.7;
    for(let n=0;n<=36;n++){const a=-Math.PI*.9+n*Math.PI*1.8/36,xx=center.x+Math.sin(a)*size*(.35+k*.13),yy=center.y+Math.cos(a+offset*.15)*size*.15+(k-1.5)*size*.14;if(!n)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();
   }
   ctx.restore();
   // Vague de choc au pied de la bulle : bord lumineux, intérieur translucide.
   ctx.globalAlpha=anim.alpha;
   ctx.strokeStyle=d.level>=2?'rgba(255,148,95,.85)':'rgba(255,239,145,.9)';ctx.lineWidth=Math.max(2,size*.018);ctx.beginPath();for(let n=0;n<=64;n++){const p=point(n,0);if(!n)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.closePath();ctx.stroke();
   ctx.restore();
  });
 }
};
})(window.BK);
