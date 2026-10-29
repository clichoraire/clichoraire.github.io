// Deux tuyaux portant la même lettre forment un passage aller-retour dans le tableau.
(function(BK){
'use strict';
BK.PIPE_LINKS='ABCDEFGH'.split('');
BK.DECO_PROPS.greenpipe=1;
const W=BK.World.prototype;
W.pipes=function(){
 return Object.entries(this.props).flatMap(([key,pr])=>{
  if(pr.deco!=='greenpipe')return [];
  const [c,r]=key.split(',').map(Number);
  return this.deco[this.idx(c,r)]==='greenpipe'?[{key,c,r,x:c+.5,y:r+.5,link:pr.pipeLink||'A',dir:pr.orientation||0}]:[];
 });
};
W.nearbyPipe=function(p){
 if(!p?.alive||p.npc||p.air||p.falling||p.boat||p.seat||p.swallowedBy)return null;
 return this.pipes().filter(q=>Math.abs(q.c-Math.floor(p.x))+Math.abs(q.r-Math.floor(p.y))===1&&Math.hypot(q.x-p.x,q.y-p.y)<1.4&&Math.abs(this.hAt(q.c,q.r)-this.groundZ(p.x,p.y))<.2).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;
};
W.pipeTrip=function(p){
 const source=this.nearbyPipe(p);if(!source)return null;
 const ends=this.pipes().filter(q=>q.link===source.link);
 if(ends.length!==2)return {source,error:ends.length<2?'Il manque le deuxième tuyau '+source.link+'.':'Utilise exactement deux tuyaux par lettre.'};
 if(p.carrying||p.heldSnail)return {source,error:'Dépose ce que tu portes avant de voyager.'};
 const destination=ends.find(q=>q.key!==source.key),team=[p,...this.players.filter(q=>q.ally&&q.leader===p&&q.alive&&!q.boat&&!q.swallowedBy)];
 const danger=BK.ai.allyDanger(this),z=this.hAt(destination.c,destination.r),spots=[],seen=new Set(),queue=[];
 const free=(c,r)=>this.inside(c,r)&&this.walkableTerrain(c,r)&&!this.blocked(c,r)&&Math.abs(this.hAt(c,r)-z)<.2&&danger[this.idx(c,r)]===Infinity&&!this.special.has(c+','+r)&&!this.players.some(q=>q.alive&&!team.includes(q)&&Math.hypot(q.x-c-.5,q.y-r-.5)<.7);
 const dirs=[BK.DIRS[destination.dir],...BK.DIRS.filter(d=>d!==BK.DIRS[destination.dir])];
 const first=dirs.map(d=>({c:destination.c+d.dx,r:destination.r+d.dy})).find(q=>free(q.c,q.r));
 if(first)queue.push(first);
 while(queue.length&&spots.length<team.length){
  const q=queue.shift(),key=q.c+','+q.r;
  if(seen.has(key)||!free(q.c,q.r)||Math.abs(q.c-destination.c)+Math.abs(q.r-destination.r)>3)continue;
  seen.add(key);spots.push(q);for(const d of BK.DIRS)queue.push({c:q.c+d.dx,r:q.r+d.dy});
 }
 return spots.length<team.length?{source,error:'La sortie du tuyau est bloquée. Libère le passage !'}:{source,destination,team,spots};
};
W.usePipe=function(p){
 if((p.pipeCooldown||0)>this.time)return false;
 const trip=this.pipeTrip(p);if(!trip)return false;
 if(trip.error){this.events.push({type:'pipeMessage',text:trip.error,carry:true});return false;}
 const {source,destination,team,spots}=trip;
 for(let i=0;i<team.length;i++){
  const q=team[i],spot=spots[i];this.dropCarried(q);q.x=spot.c+.5;q.y=spot.r+.5;q.dir=destination.dir;
  q.safe={x:q.x,y:q.y,dir:q.dir};q.vx=q.vy=q.zOff=0;q.air=q.falling=q.onBomb=null;q.path=[];q.planT=0;q.running=q.moving=false;
  q.input={dx:0,dy:0,bomb:false,action:false,bombHeld:false};q.lastTap=null;q.pipeCooldown=this.time+1;
  q.nearDoor=q.nearDisplay=q.nearFire=q.nearFountain=null;this.setPose(q,'jump',.4);
  this.burst(q.x,q.y,.5,'#8df47a',12);
 }
 this.pipePulse={source,destination,until:this.time+.7};
 this.burst(source.x,source.y,.9,'#b6ff80',18);BK.audio.door();
 this.events.push({type:'pipeTravel',player:p,carry:true});return true;
};
const draw=BK.sprites.drawDeco;
BK.sprites.drawDeco=function(ctx,kind,x,y,k,t,nb,seed,orientation,lightColor,props={}){
 if(kind!=='greenpipe')return draw.call(this,ctx,kind,x,y,k,t,nb,seed,orientation,lightColor,props);
 ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.lineWidth=.035;ctx.strokeStyle='#15562d';ctx.lineJoin='round';
 const gradient=ctx.createLinearGradient(-.4,0,.4,0);gradient.addColorStop(0,'#238e3e');gradient.addColorStop(.25,'#8aee63');gradient.addColorStop(.65,'#38bd42');gradient.addColorStop(1,'#166f33');
 ctx.fillStyle='rgba(15,40,24,.25)';ctx.beginPath();ctx.ellipse(0,.015,.49,.18,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(-.34,-.82);ctx.lineTo(.34,-.82);ctx.lineTo(.34,-.08);ctx.quadraticCurveTo(0,.13,-.34,-.08);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle=gradient;BK.sprites.rr(ctx,-.46,-.98,.92,.28,.055);ctx.fill();ctx.stroke();
 ctx.fillStyle='#79e85b';ctx.beginPath();ctx.ellipse(0,-.98,.46,.18,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#103f28';ctx.beginPath();ctx.ellipse(0,-.99,.33,.105,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#b9ff8a';ctx.lineWidth=.02;ctx.beginPath();ctx.moveTo(-.24,-.64);ctx.lineTo(-.24,-.18);ctx.stroke();
 ctx.fillStyle='#fff2b0';ctx.strokeStyle='#21642e';ctx.lineWidth=.025;ctx.beginPath();ctx.ellipse(0,-.45,.15,.16,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#245532';ctx.font='900 .21px Nunito,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(props.pipeLink||'A',0,-.45);
 ctx.restore();
};
const render=W.render;
W.render=function(ctx,cam,o){
 render.call(this,ctx,cam,o);this.pipeRect=null;
 const p=this.players.find(q=>q.human&&!q.npc&&!q.ally&&q.alive),trip=p&&this.pipeTrip(p);if(!trip)return;
 const at=cam.project(p.x,p.y,this.groundZ(p.x,p.y)+2.05),w=210,h=43,x=Math.max(8,Math.min(cam.W-w-8,at.x-w/2)),y=Math.max(145,at.y-h);
 ctx.save();ctx.fillStyle=trip.error?'#c8c8be':'#d8fa89';ctx.strokeStyle=trip.error?'#8a8e82':'#429652';ctx.lineWidth=3;BK.sprites.rr(ctx,x,y,w,h,15);ctx.fill();ctx.stroke();ctx.fillStyle='#23472c';ctx.font='bold 17px Nunito,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(trip.error?'Tuyau '+trip.source.link+' · indisponible':'↓ Entrer · Tuyau '+trip.source.link,x+w/2,y+h/2);ctx.restore();
 this.pipeRect={x,y,w,h};
};
})(window.BK);
