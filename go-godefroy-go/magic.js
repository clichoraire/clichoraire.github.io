/* Beyond the dragon: the boss fight and its portal, then the magic world — ceiling, enchanted trees, fairies and shots to dodge. */
(function(root){
'use strict';
const M=typeof module!=='undefined'?require('./monsters.js'):root.GGMonsters;
const Course=typeof module!=='undefined'?require('./course.js'):root.GGCourse;
const D=Course.dragonBoss,W=Course.magic,S=Course.sorcerer,STRIDE=1000000;
// The fairy's magic armour lasts 10 real seconds.
const ARMOUR=10*Course.TIME_SCALE;
// Every object is regenerated from its cell, like the other encounters. Trees and fairies float in the air, bird-men patrol it,
// wizards stand on the ground, anvils are just places where one falls from the sky.
const FIELD={
 tree:{col:420,row:520,chance:.17,x0:300,y0:260,jx:250,jy:300,rx:15,ry:150,salt:101},
 fairy:{col:760,row:600,chance:.16,x0:500,y0:320,jx:420,jy:360,rx:14,ry:120,salt:211},
 bird:{col:900,row:700,chance:.34,x0:700,y0:520,jx:500,jy:420,salt:307},
 wizard:{col:330,row:0,chance:.5,x0:180,y0:0,jx:200,jy:0,salt:401},
 anvil:{col:1000,row:0,chance:.55,x0:400,y0:0,jx:500,jy:0,salt:503}
};
// A shot first rushes to a spot at a fixed offset from the knight (`ax`, `ay`, during `rise`), then locks on where he will be
// `glide` later and flies straight there: it looks the same and leaves the same time to react at any speed.
const SHOT={
 bolt:{rise:.9,glide:2.6,ax:48,ay:-250,rx:5,ry:70,slow:.72},
 spear:{rise:.7,glide:2.4,ax:66,ay:70,rx:6,ry:55,slow:.7},
 anvil:{rise:.9,glide:2.6,ax:34,ay:340,rx:7,ry:85,slow:.55}
},GAP=3.2,TREE_SLOW=.55,CRUISE=42,COMMIT=1.2,TRACK={x:22,y:110};
function at(kind,id,f){const c=FIELD[kind],row=Math.floor(id/STRIDE),col=id%STRIDE,seed=col*c.salt+row*6113+c.salt*977+(f.combatSeed||0);
 const x=W.start+c.x0+col*c.col+M.hash(seed)*c.jx,y=c.row?row*c.row+c.y0+M.hash(seed+11)*c.jy:0;
 return {kind,id,x,y,active:M.hash(seed+31)<c.chance&&y<W.ceiling-220&&x<S.x-900};}
function near(kind,left,right,f,low=0,high=W.ceiling){const c=FIELD[kind],out=[];if(right<W.start)return out;
 const c0=Math.max(0,Math.floor((left-W.start-c.x0-c.jx)/c.col)),c1=Math.floor((right-W.start-c.x0)/c.col);
 const r0=c.row?Math.max(0,Math.floor((low-c.y0-c.jy)/c.row)):0,r1=c.row?Math.floor((high-c.y0)/c.row):0;
 for(let r=r0;r<=Math.min(r0+9,r1);r++)for(let k=c0;k<=Math.min(c0+40,c1)&&out.length<40;k++){
  const a=at(kind,r*STRIDE+k,f);if(a.active&&a.x>=left&&a.x<=right&&(!c.row||(a.y>=low&&a.y<=high)))out.push(a);
 }return out;}
const ev=(f,e)=>{(f.monsterEvents??=[]).push(e);};
const say=(f,text)=>{f.message=text;f.messageTime=2.8;};
function init(f,s={}){
 const down=!!s.dragonDefeated;
 f.dragon={hearts:down?0:Math.max(1,Math.min(D.hearts,Math.floor(Number(s.dragonHearts??D.hearts))||D.hearts)),x:D.x,hits:0,hitAt:-99,bonkAt:-99};
 f.portal=down?{x:D.x+D.portalGap,at:-99,old:true}:null;f.sorcerer={x:S.x};
 f.magicShots=[];f.magicNext=0;f.magicFired=new Set();f.treeUsed=new Set();f.fairyUsed=new Set();
}
// ---- Dragon boss, then the portal.
function boss(f,dt,maxSpeed){
 const d=f.dragon;f.duelSlow=1;
 if(d.hearts>0&&f.x<W.start&&(d.gap!==undefined||f.x>=D.x-D.sight)){
  if(d.gap===undefined){d.gap=D.sight;say(f,'LE DRAGON BLOQUE LE CHEMIN ! FONCE-LUI DESSUS !');ev(f,{type:'dragonroar',x:f.x+D.sight,y:f.y});}
  // The duel plays in slow motion for a very fast knight, so the dragon is always seen coming.
  f.duelSlow=Math.max(.4,Math.min(1,130/Math.max(1,f.vx)));
  d.gap=Math.max(0,d.gap-Math.max(18,f.vx*D.close)*dt);d.x=f.x+D.reach+d.gap;
  if(d.gap<=0){
   const speed=Math.hypot(f.vx,f.vy);
   if(f.vx>=D.minSpeed){
    d.hearts--;d.hits++;d.hitAt=f.time;d.bonked=false;f.dragonHits=(f.dragonHits||0)+1;f.hits=(f.hits||0)+1;M.combo(f,f.x,f.y);f.stalled=false;f.stall=0;
    // The recoil keeps enough speed for the next ram: whoever lands the first blow can finish the fight in one flight.
    if(d.hearts>0){d.gap=D.retreat;d.x=f.x+D.reach+d.gap;f.vx=Math.max(f.vx*.85,D.minSpeed*1.5);f.vy=Math.max(f.vy,3);ev(f,{type:'dragonhit',x:f.x,y:f.y,hearts:d.hearts});say(f,'EN PLEIN DANS LE MILLE ! ENCORE '+d.hearts+(d.hearts>1?' CŒURS !':' CŒUR !'));}
    else{d.downAt=f.time;f.dragonDown=true;f.duelSlow=1;f.portal={x:f.x+D.portalGap,at:f.time};f.cruise={speed:Math.max(60,speed)};f.gullRide=null;ev(f,{type:'dragondown',x:f.x,y:f.y});say(f,'LE DRAGON EST VAINCU ! UN PORTAIL S’OUVRE…');}
   }else{
    // Too slow: the dragon does not even flinch and the knight slides down its belly.
    f.vx=0;
    if(!d.bonked){d.bonked=true;d.bonkAt=f.time;f.dragonBonks=(f.dragonBonks||0)+1;ev(f,{type:'dragonbonk',x:f.x,y:f.y});say(f,'PAS ASSEZ VITE ! LE DRAGON N’A RIEN SENTI…');}
   }
  }
 }
 // The Grand Sorcerer flies ahead of the knight the same way; a single touch, at any speed, wins the game.
 const z=f.sorcerer??={x:S.x};
 if(!f.sorcererTouched&&(z.gap!==undefined||f.x>=S.x-S.sight-S.reach)){
  if(z.gap===undefined){z.gap=S.sight;say(f,'LE GRAND SORCIER ! IL SUFFIT DE LE TOUCHER !');ev(f,{type:'dragonroar',x:f.x+S.sight,y:f.y});}
  f.duelSlow=Math.max(.4,Math.min(1,130/Math.max(1,f.vx)));z.gap=Math.max(0,z.gap-Math.max(18,f.vx*S.close)*dt);z.x=f.x+S.reach+z.gap;
  if(z.gap<=0){f.sorcererTouched=true;f.sorcererDown=true;f.duelSlow=1;ev(f,{type:'sorcerer',x:f.x,y:f.y});}
 }
 const p=f.portal;if(!p||p.used||f.x>=W.start)return;
 // After the last heart the knight glides calmly into the portal by himself.
 if(f.cruise){f.vx+=(CRUISE-f.vx)*Math.min(1,dt*2.5);f.vy+=((f.y<220?4:0)-f.vy)*Math.min(1,dt*5);f.pitch+=(.04-f.pitch)*Math.min(1,dt*4);f.stalled=false;f.stall=0;f.boosting=false;}
 if(f.x>=p.x){
  p.used=true;const speed=Math.min(maxSpeed,Math.max(60,f.cruise?.speed||Math.hypot(f.vx,f.vy))),from={x:f.x,y:f.y};
  f.x=W.exit;f.y=Math.max(350,Math.min(W.ceiling-600,f.y));f.vx=speed;f.vy=3;f.pitch=.08;f.cruise=null;f.portalUsed=true;f.wallsBroken?.add(5);if(f.trail)f.trail.length=0;
  ev(f,{type:'portal',x:from.x,y:from.y,toX:f.x,toY:f.y});say(f,'BIENVENUE DANS LE MONDE MAGIQUE !');
 }
}
function fire(f,kind,key,sx,sy){f.magicFired.add(key);f.magicShots.push({kind,key,sx,sy,x:sx,y:sy,age:0});f.magicNext=f.time+GAP;ev(f,{type:'shot',kind,x:sx,y:sy});}
// ---- The magic world itself.
function world(f,px,py,dt,maxSpeed){
 if(f.y>W.ceiling){f.y=W.ceiling;if(f.vy>0){f.vy=-Math.min(7,2+f.vy*.4);f.vx*=.96;if(f.time-(f.ceilingAt??-9)>.5){f.ceilingAt=f.time;f.ceilingHits=(f.ceilingHits||0)+1;ev(f,{type:'ceiling',x:f.x,y:f.y});say(f,'LE PLAFOND MAGIQUE ! REDESCENDS !');}}}
 if(f.fairy){f.fairy.left-=dt;if(f.fairy.left<=0){f.fairy=null;ev(f,{type:'armourend',x:f.x,y:f.y});}else{const cap=maxSpeed*1.08;if(f.vx<cap)f.vx=Math.min(cap,f.vx+(10+maxSpeed*.06)*dt);if(f.vy<1.5)f.vy+=9*dt;f.stalled=false;f.stall=0;}}
 const armour=!!f.fairy,left=Math.min(px,f.x),right=Math.max(px,f.x),low=Math.min(py,f.y),high=Math.max(py,f.y);
 for(const a of near('fairy',left-16,right+16,f,low-130,high+130)){
  if(f.fairyUsed.has(a.id)||M.sweep(px-a.x,py-a.y,f.x-a.x,f.y-a.y,FIELD.fairy.rx,FIELD.fairy.ry)===Infinity)continue;
  f.fairyUsed.add(a.id);f.fairies=(f.fairies||0)+1;f.pickupCounts??={};f.pickupCounts.fairy=(f.pickupCounts.fairy||0)+1;f.fairy={left:ARMOUR,total:ARMOUR};
  ev(f,{type:'fairy',x:a.x,y:a.y});say(f,'ARMURE MAGIQUE ! 10 SECONDES DE BOOST !');
 }
 for(const a of near('tree',left-17,right+17,f,low-160,high+160)){
  if(f.treeUsed.has(a.id)||M.sweep(px-a.x,py-a.y,f.x-a.x,f.y-a.y,FIELD.tree.rx,FIELD.tree.ry)===Infinity)continue;
  f.treeUsed.add(a.id);f.treesBroken=(f.treesBroken||0)+1;f.hits=(f.hits||0)+1;M.combo(f,a.x,a.y);f.vx*=f.fairy?.92:TREE_SLOW;f.vy*=.6;
  ev(f,{type:'tree',x:a.x,y:a.y,armour:!!f.fairy});say(f,f.fairy?'CRAC ! L’ARMURE MAGIQUE TRAVERSE L’ARBRE !':'CRAAAC ! UN ARBRE MAGIQUE, ÇA PÈSE LOURD…');
 }
 // One new threat at a time, never more than two in the air.
 if(!f.cruise&&f.sorcerer?.gap===undefined&&f.time>=f.magicNext&&f.magicShots.filter(n=>!n.done).length<2){
  let fired=false;
  if(f.y<=2600)for(const a of near('wizard',f.x+60,f.x+560,f)){const key='w'+a.id;if(f.magicFired.has(key))continue;fire(f,'bolt',key,a.x,70);fired=true;break;}
  if(!fired)for(const a of near('bird',f.x+50,f.x+520,f,f.y-900,f.y+900)){const key='b'+a.id;if(f.magicFired.has(key))continue;fire(f,'spear',key,a.x,a.y);fired=true;break;}
  if(!fired){const cell=Math.floor((f.x-W.start)/FIELD.anvil.col),a=at('anvil',cell,f),key='a'+cell;if(a.active&&!f.magicFired.has(key)&&f.x>=a.x)fire(f,'anvil',key,f.x+SHOT.anvil.ax,Math.min(W.ceiling+300,f.y+760));}
 }
 for(const n of f.magicShots){
  const c=SHOT[n.kind],ox=n.x,oy=n.y;n.age+=dt;
  if(n.lockAt===undefined){
   const u=Math.min(1,n.age/c.rise),e=1-(1-u)*(1-u),gx=f.x+c.ax,gy=Math.max(40,f.y+c.ay);n.x=n.sx+(gx-n.sx)*e;n.y=n.sy+(gy-n.sy)*e;
   if(u>=1){n.lockAt=n.age;n.tx=f.x+f.vx*c.glide;n.ty=Math.max(30,f.y+f.vy*Course.AIR_Y_SCALE*c.glide*.5);n.vx=(n.tx-n.x)/c.glide;n.vy=(n.ty-n.y)/c.glide;}
  }else{
   // Like the nets: the danger zone drifts slowly after the knight, then freezes for the last COMMIT seconds.
   const left=c.glide-(n.age-n.lockAt);
   if(left>COMMIT&&!n.done){const wantX=f.x+f.vx*left,wantY=Math.max(30,f.y+f.vy*Course.AIR_Y_SCALE*left*.5);n.tx+=Math.max(-TRACK.x*dt,Math.min(TRACK.x*dt,wantX-n.tx));n.ty+=Math.max(-TRACK.y*dt,Math.min(TRACK.y*dt,wantY-n.ty));n.vx=(n.tx-n.x)/left;n.vy=(n.ty-n.y)/left;}
   n.x+=n.vx*dt;n.y+=n.vy*dt;}
  if(n.done||n.lockAt===undefined||f.ended)continue;
  if(M.sweep(px-ox,py-oy,f.x-n.x,f.y-n.y,c.rx,c.ry)!==Infinity){
   n.done=true;n.doneAt=f.time;
   if(armour){n.deflected=true;f.deflects=(f.deflects||0)+1;M.combo(f,n.x,n.y);ev(f,{type:'deflect',kind:n.kind,x:n.x,y:n.y});}
   else{n.hit=true;f.magicHits=(f.magicHits||0)+1;f.vx*=c.slow;if(n.kind==='anvil')f.vy=Math.min(f.vy,-8);else f.vy-=1.5;f.gullRide=null;ev(f,{type:'shothit',kind:n.kind,x:f.x,y:f.y});
    say(f,n.kind==='anvil'?'BONG ! UNE ENCLUME SUR LE CASQUE !':n.kind==='spear'?'AÏE ! UNE LANCE D’HOMME-OISEAU !':'ZAP ! TOUCHÉ PAR UN SORT !');}
  }else if(n.age-n.lockAt>c.glide+.35){n.done=true;n.doneAt=f.time;n.missed=true;f.magicDodged=(f.magicDodged||0)+1;ev(f,{type:'shotmiss',kind:n.kind,x:n.x,y:n.y});}
 }
 f.magicShots=f.magicShots.filter(n=>n.age<8&&!(n.done&&(n.hit||n.deflected||f.time-n.doneAt>1.2)));
 for(const set of [f.treeUsed,f.fairyUsed,f.magicFired])while(set.size>300)set.delete(set.values().next().value);
}
function step(f,px,py,dt,maxSpeed){
 if(!f.dragon)init(f);
 if(f.ended)return;
 boss(f,dt,maxSpeed);
 if(f.x>=W.start)world(f,px,py,dt,maxSpeed);
}
const api={ARMOUR,FIELD,SHOT,GAP,TREE_SLOW,CRUISE,at,near,init,step};if(typeof module!=='undefined')module.exports=api;else root.GGMagic=api;
})(typeof window!=='undefined'?window:globalThis);
