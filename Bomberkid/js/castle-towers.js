// Tours de bombardiers : une bombe lancée dans une fenêtre détruit la tour de l’intérieur.
(function(BK){
'use strict';
BK.ENEMIES.bombtower={name:'Tour de bombardier',hp:1,speed:0,score:600,xp:60,r:.48,color:'#9298ad',behavior:'bombtower',solid:true,dmg:0};
const W=BK.World.prototype;
// La case enregistrée est celle de gauche ; le corps est centré entre les deux cases.
const addEnemy=W.addEnemy;
W.addEnemy=function(type,c,r,o){
 const e=addEnemy.call(this,type,c,r,o);
 if(type==='bombtower')e.x=c+1;
 return e;
};
W.towerOccupies=function(e,c,r){
 return e.type==='bombtower'&&!e.dead&&r===Math.floor(e.y)&&
  (c===Math.floor(e.x-.5)||c===Math.floor(e.x-.5)+1);
};
const solidEnemyAt=W.solidEnemyAt;
W.solidEnemyAt=function(c,r){
 return this.enemies.find(e=>this.towerOccupies(e,c,r))||solidEnemyAt.call(this,c,r);
};
const update=W.updateEnemy;
W.updateEnemy=function(e,dt){
 if(e.type!=='bombtower')return update.call(this,e,dt);
 e.t+=dt;if(e.dead){e.deadT+=dt;return;}e.cool=(e.cool??3)-dt;
 const p=this.nearestPlayer(e.x,e.y);
 if(e.state==='loaded')return;
 if(e.warning){
  e.warning.t-=dt;if(e.warning.t>0)return;
  const aim=e.warning;e.warning=null;e.state='walk';e.cool=5;
  this.bestiaryBomb(e,aim);
  const b=this.bombs.at(-1);if(b?.owner===e&&b.born===this.time){b.from.z=this.groundZ(e.x,e.y)+1.8;b.t=BK.BOMB_FUSE+1.2;b.arc=.7;}
 }else if(p&&e.cool<=0&&this.canSee(e,p,6)){
  e.warning={x:p.x,y:p.y,t:1,max:1};e.state='charge';
  if(!this.towerHintShown){this.towerHintShown=true;this.events.push({type:'towerHint'});}
 }
};
const hurt=W.hurtEnemy;
W.hurtEnemy=function(e,by,dmg,source){
 if(e.type==='bombtower'&&source!=='towerInside')return false;
 return hurt.call(this,e,by,dmg,source);
};
// Assistance de visée : dans l’axe du lancer et à portée, viser la fenêtre au lieu du sol derrière.
W.towerInThrowLine=function(p,b){
 if(b?.rock)return null;
 const D=BK.DIRS[p.dir],range=p.longthrow?BK.THROW_CELLS+2:BK.THROW_CELLS;
 return this.enemies.filter(e=>e.type==='bombtower'&&!e.dead).map(e=>({e,along:(e.x-p.x)*D.dx+(e.y-p.y)*D.dy,side:Math.abs((e.x-p.x)*D.dy-(e.y-p.y)*D.dx)})).filter(q=>q.along>.5&&q.along<=range+.25&&q.side<.55&&Math.abs(this.groundZ(q.e.x,q.e.y)-this.groundZ(p.x,p.y))<.4&&this.canSee(p,q.e,range+.5)).sort((a,b)=>a.along-b.along)[0]?.e||null;
};
const throwBomb=W.throwBomb;
W.throwBomb=function(p){
 const b=p.carrying,tower=this.towerInThrowLine(p,b),result=throwBomb.call(this,p);
 if(result&&tower){b.to={x:tower.x,y:tower.y,z:this.groundZ(tower.x,tower.y)+1.45};b.windowTarget=tower;}
 return result;
};
const land=W.landBomb;
W.landBomb=function(b){
 const tower=b.windowTarget||this.enemies.find(e=>this.towerOccupies(e,Math.floor(b.to.x),Math.floor(b.to.y)));
 if(!b.rock&&tower&&!tower.dead&&b.thrower&&b.thrower!==tower){
  b.towerInside=tower;b.state='tower';b.cx=Math.floor(tower.x);b.cy=Math.floor(tower.y);b.x=tower.x;b.y=tower.y;b.z=1.45;b.passers=new Set();
  tower.warning=null;tower.state='loaded';this.events.push({type:'towerLoaded',enemy:tower});return;
 }
 return land.call(this,b);
};
const explode=W.explodeBomb;
W.explodeBomb=function(b){
 if(!b.exploded&&b.towerInside&&!b.towerInside.dead){
  const tower=b.towerInside;this.hurtEnemy(tower,b.thrower||b.owner,99,'towerInside');
  this.burst(tower.x,tower.y,1.5,'#a7adc2',30,1);this.shake=Math.max(this.shake,.35);
  this.events.push({type:'towerDestroyed',enemy:tower});
 }
 return explode.call(this,b);
};
const ally=W.updateAlly;
W.updateAlly=function(p,dt){
 ally.call(this,p,dt);
 if(!p.alive||!p.leader?.alive||p.retreating||p.air||p.boat||p.falling||p.swallowedBy||p.carrying||p.bombCool>0)return;
 const tower=this.enemies.find(e=>e.type==='bombtower'&&!e.dead&&e.state!=='loaded'&&Math.hypot(e.x-p.x,e.y-p.y)<=BK.THROW_CELLS+.25);
 if(!tower)return;
 const dx=tower.x-p.x,dy=tower.y-p.y,dir=Math.abs(dx)>Math.abs(dy)?(dx>0?3:1):(dy>0?0:2),oldDir=p.dir;p.dir=dir;
 const danger=BK.ai.allyDanger(this);
 if(!this.towerInThrowLine(p)||danger[this.idx(Math.floor(p.x),Math.floor(p.y))]!==Infinity){p.dir=oldDir;return;}
 if(this.placeBomb(p)&&this.pickupBomb(p)){this.throwBomb(p);p.bombCool=4;p.input.bomb=false;}
};

// Les alliés anticipent également la case où le bombardier vise.
const danger=BK.ai.allyArenaDanger;
BK.ai.allyArenaDanger=function(world){
 const out=new Float32Array(danger(world));
 for(const e of world.enemies)if(e.type==='bombtower'&&!e.dead&&e.warning){
  const c=Math.floor(e.warning.x),r=Math.floor(e.warning.y);
  if(world.inside(c,r))out[world.idx(c,r)]=0;
 }
 return out;
};
const render=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 render.call(this,ctx,cam,time,push);
 for(const e of this.enemies)if(e.type==='bombtower'&&!e.dead&&e.warning){
  const q=e.warning;push(q.y+.01,q.x,()=>{const p=cam.project(q.x,q.y,this.groundZ(q.x,q.y)+.02);ctx.save();ctx.strokeStyle='#ffb34b';ctx.fillStyle='rgba(255,177,70,.2)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,p.k*.5,p.k*.3,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();});
 }
};

const draw=BK.sprites.drawEnemy;
BK.sprites.drawEnemy=function(ctx,type,o={}){
 if(type!=='bombtower')return draw.call(this,ctx,type,o);

 const k=(o.s||60)/100,t=o.t||0;ctx.save();ctx.scale(k,k);ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=4;ctx.strokeStyle='#414554';
 const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
 const rect=(x,y,w,h,color,r=4)=>{ctx.fillStyle=color;BK.sprites.rr(ctx,x,y,w,h,r);ctx.fill();ctx.stroke();};
 const stone=ctx.createLinearGradient(-80,0,80,0);stone.addColorStop(0,'#71788a');stone.addColorStop(.28,'#b4bac5');stone.addColorStop(.62,'#9da6b4');stone.addColorStop(1,'#626c80');
 // Cylindre vu de trois quarts, proportions dessinées à leur taille réelle (aucun étirement).
 oval(0,0,96,23,'#4d5669');rect(-82,-330,164,319,stone,12);oval(0,-14,82,20,stone);
 ctx.save();ctx.beginPath();ctx.rect(-81,-329,162,313);ctx.clip();ctx.strokeStyle='rgba(61,70,85,.35)';ctx.lineWidth=2;
 for(let row=0;row<12;row++){const y=-28-row*26;ctx.beginPath();ctx.ellipse(0,y,83,12,0,0,Math.PI);ctx.stroke();for(const x of row%2?[-60,-10,42]:[-35,17,67]){ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x,y-17);ctx.stroke();}}
 ctx.restore();ctx.strokeStyle='#414554';ctx.lineWidth=4;
 // Corniches, ouverture profonde et créneaux massifs.
 for(const y of [-153,-235,-317]){oval(0,y+5,87,16,'#727f93');oval(0,y,87,15,'#bbc1cb');rect(-87,y-4,174,9,'#a0aab9',3);}
 // Grand toit d’ardoise : une silhouette continue, sans anneaux ni créneaux superposés.
 oval(0,-330,88,18,'#c3c8d1');
 ctx.fillStyle='#505e9a';ctx.beginPath();ctx.moveTo(-100,-338);ctx.quadraticCurveTo(-62,-361,0,-438);ctx.quadraticCurveTo(63,-361,100,-338);ctx.quadraticCurveTo(0,-311,-100,-338);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#7186c6';ctx.beginPath();ctx.moveTo(-94,-339);ctx.quadraticCurveTo(-53,-364,0,-438);ctx.lineTo(-20,-331);ctx.quadraticCurveTo(-62,-333,-94,-339);ctx.fill();
 ctx.strokeStyle='#35446c';ctx.lineWidth=3;for(const y of [-361,-385,-408]){const w=(-438-y)/-100*83;ctx.beginPath();ctx.moveTo(-w,y);ctx.quadraticCurveTo(0,y+12,w,y);ctx.stroke();}
 ctx.strokeStyle='#414554';ctx.lineWidth=4;oval(0,-441,7,7,'#ffd56a');
 for(const y of [-194,-276]){
  rect(-14,y-22,28,41,'#d5d1c7',13);rect(-8,y-17,16,31,'#343b51',8);rect(-20,y+16,40,7,'#b3b9c4',3);
 }
 // La fenêtre du premier étage reste basse, large et clairement différente des meurtrières.
 rect(-37,-143,74,73,'#d2c6aa',25);rect(-29,-135,58,60,'#282d3d',20);
 rect(-51,-127,16,47,'#956b40',4);rect(35,-127,16,47,'#956b40',4);
 ctx.strokeStyle='#e0ba76';ctx.lineWidth=2;for(const x of [-44,43]){ctx.beginPath();ctx.moveTo(x,-121);ctx.lineTo(x,-87);ctx.stroke();}
 ctx.strokeStyle='#414554';ctx.lineWidth=4;
 if(o.state==='loaded'){oval(0,-105,23,25,'#f9a54b');oval(0,-105,13,17,'#ffe59d');}
 else{
  // Petit bombardier aux proportions normales, comme les autres personnages.
  rect(-18,-106,36,27,'#785298',5);oval(0,-119,13,15,'#efc392');
  rect(-17,-137,34,10,'#53586c',4);ctx.fillStyle='#252c3c';ctx.fillRect(-7,-121,4,5);ctx.fillRect(4,-121,4,5);
  if(o.state==='charge'){oval(24,-101,12,12,'#343c48');ctx.strokeStyle='#ffc552';ctx.beginPath();ctx.moveTo(24,-114);ctx.lineTo(28,-124);ctx.stroke();}
 }
 ctx.strokeStyle='#414554';rect(-43,-77,86,10,'#d1cab9',3);
 // Blason simple, bases en pierre et fanion du même style que les décors du jeu.
 rect(-88,-55,19,49,'#8993a4',5);rect(69,-55,19,49,'#68758a',5);
 ctx.fillStyle='#785092';ctx.beginPath();ctx.moveTo(-20,-58);ctx.lineTo(20,-58);ctx.lineTo(17,-32);ctx.lineTo(0,-22);ctx.lineTo(-17,-32);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle='#efd287';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-52);ctx.lineTo(0,-31);ctx.moveTo(-10,-43);ctx.lineTo(10,-43);ctx.stroke();

 ctx.restore();
};
})(window.BK);
