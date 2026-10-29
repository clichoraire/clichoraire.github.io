// Arène du premier boss et jets d’eau de l’éditeur.
(function(BK){
  const W=BK.World.prototype;
  W.releaseSwallowed=function(p){
    const e=p.swallowedBy;if(!e)return;e.swallowed=null;e.bellyKick=0;p.swallowedBy=null;p.swallowT=0;
    const spot=this.freeCellNear(Math.floor(p.swallowOrigin.x),Math.floor(p.swallowOrigin.y));
    p.x=spot?spot.c+.5:p.swallowOrigin.x;p.y=spot?spot.r+.5:p.swallowOrigin.y;p.input.bomb=false;p.input.bombHeld=false;p.input.action=false;p.swallowSafe=5;p.invuln=Math.max(p.invuln||0,1.5);this.setPose(p,'idle');
  };
  W.swallowPlayer=function(e,p){
    if(!p.alive||p.npc||p.boat||p.air||p.falling||p.swallowedBy||p.swallowSafe>0||p.invuln>0||!this.canSee(e,p,1.8)||Math.abs(this.groundZ(e.x,e.y)-this.groundZ(p.x,p.y))>.4)return false;
    this.dropCarried(p);p.onBomb=null;p.zOff=0;p.fishing=null;p.swallowOrigin={x:p.x,y:p.y};p.swallowedBy=e;p.swallowT=p.swallowMax=6;p.struggleCool=0;p.input.bomb=false;p.vx=p.vy=0;e.swallowed=p;e.bellyKick=0;e.bellySide=1;this.poisonPlayer(p,e);return true;
  };
  W.updateSwallowed=function(p,dt){
    const e=p.swallowedBy;if(!e||e.dead||!this.enemies.includes(e)){this.releaseSwallowed(p);return;}
    p.x=e.x;p.y=e.y;p.moving=p.running=false;p.vx=p.vy=0;p.swallowT-=dt;
    if(p.ally){p.struggleCool-=dt;if(p.struggleCool<=0){p.input.bomb=true;p.struggleCool=.4;}}
    if(p.input.bomb){e.bellyKick=.32;e.bellySide=-(e.bellySide||1);p.swallowT-=.65;this.burst(e.x,e.y,.5,'#ffe79b',3);}
    p.input.bomb=false;p.input.action=false;p.input.bombHeld=false;
    if(p.swallowT<=0)this.releaseSwallowed(p);
  };
  W.leaveToadSlime=function(e){
    const c=Math.floor(e.x),r=Math.floor(e.y);if(!this.inside(c,r)||this.cell(c,r)||!this.walkableTerrain(c,r))return;
    const z=this.explore?this.groundZ(e.x,e.y):0;
    const old=this.puddles.find(q=>q.kind==='toadSlime'&&q.c===c&&q.r===r&&Math.abs(q.z-z)<.1);
    if(old)old.t=0;else this.puddles.push({kind:'toadSlime',c,r,z,t:0,dur:10});
  };
  W.toadSlimeSlow=function(p){
    if(p.air||p.falling||p.boat||p.onBomb)return 1;
    const c=Math.floor(p.x),r=Math.floor(p.y),z=this.explore?this.groundZ(p.x,p.y):0;
    return this.puddles.some(q=>q.kind==='toadSlime'&&q.t<q.dur&&q.c===c&&q.r===r&&Math.abs(q.z-z)<.3)?.7:1;
  };
  W.updateToadPowers=function(e,dt){
    // Gonflement et petits coups du captif : animation indépendante de la fréquence des appuis.
    e.bellyFill=Math.max(0,Math.min(1,(e.bellyFill||0)+(e.swallowed?dt*4:-dt*5)));
    e.bellyKick=Math.max(0,(e.bellyKick||0)-dt);
    e.preparingSwallow=false;
    e.tongueT=Math.max(0,(e.tongueT||0)-dt);e.toadCool=(e.toadCool??2)-dt;
    if(e.swallowed){if(!e.swallowed.alive)this.releaseSwallowed(e.swallowed);e.state='sit';e.stateT=0;return true;}
    if(e.toadAttack){const a=e.toadAttack;a.t-=dt;if(a.t>0)return true;
      e.toadAttack=null;e.toadCool=4;e.state='sit';e.stateT=0;
      const p=a.target;if(!p.alive||p.swallowedBy||p.air||p.falling||p.boat||!this.canSee(e,p,a.kind==='tongue'?3.5:1.8)||Math.abs(this.groundZ(e.x,e.y)-this.groundZ(p.x,p.y))>.4)return true;
      if(a.kind==='tongue'){const dx=p.x-e.x,dy=p.y-e.y,along=dx*Math.cos(a.angle)+dy*Math.sin(a.angle),side=Math.abs(-dx*Math.sin(a.angle)+dy*Math.cos(a.angle));e.tongueT=.35;e.tongueEnd={x:e.x+Math.cos(a.angle)*3.5,y:e.y+Math.sin(a.angle)*3.5};if(along>0&&along<3.5&&side<p.r+.35&&!(p.invuln>0)){p.tongueSlow=3;p.running=false;p.vx=p.vy=0;}}
      else this.swallowPlayer(e,p);return true;
    }
    if(e.z>.1||e.state==='jump'||e.toadCool>0)return false;
    const p=this.nearestPlayer(e.x,e.y);if(!p||p.swallowedBy||p.boat||p.air||p.falling||p.swallowSafe>0||!this.canSee(e,p,3.5))return false;
    const kind=(e.toadAttackIndex||0)%2?'swallow':'tongue';if(kind==='swallow'&&Math.hypot(p.x-e.x,p.y-e.y)>1.8)return false;
    if(kind==='swallow'){e.preparingSwallow=true;if(p.invuln>0){e.state='sit';e.stateT=0;return true;}}
    e.toadAttackIndex=(e.toadAttackIndex||0)+1;e.toadAttack={kind,t:.7,target:p,angle:Math.atan2(p.y-e.y,p.x-e.x)};return true;
  };
  W.setupFirstBoss=function(){
    this.addEnemy('crapaud',8,13,{hp:4,maxHp:4,name:'Gardien crapaud',arenaGuard:true});
    this.addEnemy('crapaud',16,13,{hp:4,maxHp:4,name:'Gardien crapaud',arenaGuard:true});
    this.addEnemy('golem',12,8,{arenaBoss:true,phase:1,state:'sealed',name:'Roi Golem',hp:10,maxHp:10,score:0,kills:0,bombsOut:0,kick:true,attackIndex:0,attackCool:2});
  };
  W.waterJetPoints=function(c,r){
    const props=this.props[c+','+r]||{},dir=((props.orientation||0)%4+4)%4,D=BK.DIRS[dir],out=[],z=this.hAt(c,r);
    for(let d=.6;d<=4;d+=.2){const x=c+.5+D.dx*d,y=r+.5+D.dy*d,cc=Math.floor(x),rr=Math.floor(y);if(!this.inside(cc,rr)||this.cell(cc,rr)||Math.abs(this.hAt(cc,rr)-z)>.15)break;out.push({x,y,z,dx:D.dx,dy:D.dy});}return out;
  };
  W.updateArenaEffects=function(dt){
    this.updateTraps(dt);
    // Après le mouvement volontaire : même en courant contre le jet, on recule.
    for(const [key,props] of Object.entries(this.props))if(props.deco==='waterjet'){
      const [c,r]=key.split(',').map(Number);if(this.deco[this.idx(c,r)]!=='waterjet')continue;const points=this.waterJetPoints(c,r);
      for(const p of this.players)if(p.alive&&!p.npc&&!p.boat&&!p.air&&!p.falling){const q=points.find(q=>Math.abs(this.groundZ(p.x,p.y)-q.z)<.3&&Math.hypot(p.x-q.x,p.y-q.y)<p.r+.23);if(q){p.running=false;p.vx=p.vy=0;const step=Math.max(10,p.speed*BK.RUN_MULT+2)*dt;this.moveCircle(p,q.dx*step,q.dy*step,p);}}
    }
    for(const a of this.arenaAnvils||[]){a.t+=dt;if(a.t>=a.warn+.45&&!a.hit){a.hit=true;this.shake=.3;this.burst(a.x,a.y,.3,'#a8b7c4',12);for(const p of this.players)if(p.alive&&!p.npc&&!p.air&&Math.hypot(p.x-a.x,p.y-a.y)<.75)this.hitPlayer(p,{kind:'anvil',dmg:20});}}
    this.arenaAnvils=(this.arenaAnvils||[]).filter(a=>a.t<a.warn+.8);
    for(const wave of this.arenaWaves||[]){wave.t+=dt;const radius=wave.t*2.8;for(const p of this.players)if(p.alive&&!p.npc&&!p.air&&!p.onBomb&&!wave.hit.has(p)&&Math.abs(Math.hypot(p.x-wave.x,p.y-wave.y)-radius)<.32&&this.canSee(wave,p,6)){wave.hit.add(p);this.hitPlayer(p,{kind:'shockwave',dmg:10});}}
    this.arenaWaves=(this.arenaWaves||[]).filter(w=>w.t<2);
  };
  W.updateFirstBoss=function(e,dt){
    if(e.state==='sealed'){if(this.enemies.some(q=>q.arenaGuard&&!q.dead))return;e.state='walk';e.attackCool=2;this.events.push({type:'arenaAwake'});return;}
    if(e.state==='transform'){if(e.stateT<2)return;e.state='walk';e.attackCool=1.5;}
    const p=this.nearestPlayer(e.x,e.y);if(!p)return;
    e.kickCool=Math.max(0,(e.kickCool||0)-dt);
    if(!e.kickCool){const b=this.bombs.find(b=>!b.rock&&b.state==='idle'&&Math.hypot(b.x-e.x,b.y-e.y)<1.4);if(b){const dx=p.x-b.x,dy=p.y-b.y,dir=Math.abs(dx)>Math.abs(dy)?(dx>0?3:1):(dy>0?0:2),D=BK.DIRS[dir];if(!this.cell(b.cx+D.dx,b.cy+D.dy)){this.kickBomb(b,dir,e);e.kickCool=1.8;}}}
    if(e.attack){e.attack.t-=dt;if(e.attack.t>0)return;this.performFirstBossAttack(e,p,e.attack.kind);e.attack=null;e.attackCool=e.phase===2?1.5:2.3;return;}
    e.attackCool-=dt;
    if(e.attackCool<=0){const kinds=e.phase===2?['fire','anvils','bomb','wave']:['fire','anvils','bomb'];e.attack={kind:kinds[e.attackIndex++%kinds.length],t:e.phase===2?.85:1.1};e.aim=Math.atan2(p.y-e.y,p.x-e.x);return;}
    const target=this.stepToward(Math.floor(e.x),Math.floor(e.y),Math.floor(p.x),Math.floor(p.y),(n,from)=>!this.blocked(n.c,n.r,e)&&this.walkableTerrain(n.c,n.r)&&this.canStep(from.c,from.r,n.c,n.r,e));
    if(target&&Math.hypot(p.x-e.x,p.y-e.y)>2)this.moveFree(e,target.c+.5,target.r+.5,e.phase===2?1.45:.85,dt);e.flip=p.x<e.x;
  };
  W.performFirstBossAttack=function(e,p,kind){
    if(kind==='fire')for(const offset of e.phase===2?[-.35,0,.35]:[0]){const a=e.aim+offset;this.shots.push({kind:'fire',x:e.x+Math.cos(a)*.9,y:e.y+Math.sin(a)*.9,a,speed:4,turn:0,life:2.2,t:0,owner:e,z:.3,r:.23,dmg:10,dead:false,deadT:0});}
    if(kind==='anvils'){this.arenaAnvils=this.arenaAnvils||[];for(const dx of e.phase===2?[-1.4,0,1.4]:[0]){const x=p.x+dx,y=p.y;if(this.inside(Math.floor(x),Math.floor(y))&&!this.cell(Math.floor(x),Math.floor(y)))this.arenaAnvils.push({x,y,t:0,warn:1.1});}}
    if(kind==='bomb'){
      const spot=this.freeCellNear(Math.floor(p.x),Math.floor(p.y));if(!spot)return;const to={x:spot.c+.5,y:spot.r+.5};
      this.bombs.push({cx:Math.floor(e.x),cy:Math.floor(e.y),x:e.x,y:e.y,z:1,t:BK.BOMB_FUSE,fire:e.phase===2?3:2,damage:e.phase===2?2:1,level:e.phase===2?2:1,owner:e,state:'flying',from:{x:e.x,y:e.y,z:this.groundZ(e.x,e.y)+1.1},to:{...to,z:this.groundZ(to.x,to.y)},arc:1.3,thrower:e,flyT:0,flyDur:.75,passers:new Set(),born:this.time,dir:0});e.bombsOut++;
    }
    if(kind==='wave'){this.arenaWaves=this.arenaWaves||[];this.arenaWaves.push({x:e.x,y:e.y,t:0,hit:new Set()});this.shake=.2;}
  };
  W.renderArenaEffects=function(ctx,cam,time,push){
    this.renderTraps(ctx,cam,time,push);
    for(const e of this.enemies)if(e.type==='crapaud'&&!e.dead){
      if(e.tongueT>0&&e.tongueEnd)push(e.y+.02,e.x,()=>{const a=cam.project(e.x,e.y,this.groundZ(e.x,e.y)+.45),b=cam.project(e.tongueEnd.x,e.tongueEnd.y,this.groundZ(e.x,e.y)+.3);ctx.save();ctx.strokeStyle='#ff79a5';ctx.lineWidth=Math.max(4,a.k*.1);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();});
      if(e.toadAttack||e.swallowed)push(e.y+.03,e.x,()=>{const p=cam.project(e.x,e.y,this.groundZ(e.x,e.y));ctx.save();ctx.textAlign='center';ctx.font='bold 17px Nunito';ctx.strokeStyle='#352345';ctx.lineWidth=4;ctx.fillStyle='#fff1a1';const label=e.swallowed?'💣 '+e.swallowed.name+' est avalé !':e.toadAttack.kind==='tongue'?'⚠ Langue collante !':'⚠ Attention, il avale !';ctx.strokeText(label,p.x,p.y-p.k*2);ctx.fillText(label,p.x,p.y-p.k*2);ctx.restore();});
    }

    if(this.timingTarget){const q=this.timingTarget;push(q.r+.02,q.c,()=>{const p=cam.project(q.c+.5,q.r+.5,.02);ctx.save();ctx.strokeStyle='#ffdf45';ctx.lineWidth=4;for(const radius of [.42,.25,.08]){ctx.beginPath();ctx.ellipse(p.x,p.y,p.k*radius,p.k*radius*.6,0,0,Math.PI*2);ctx.stroke();}ctx.restore();});}
    if(this.timingTarget)for(const b of this.bombs)if(b.timingBall)push(b.y+.1,b.x,()=>{const p=cam.project(b.x,b.y,.85);ctx.save();ctx.font='bold 18px Nunito,sans-serif';ctx.textAlign='center';ctx.strokeStyle='#243442';ctx.lineWidth=4;ctx.fillStyle='#ffe460';const label=b.t.toFixed(1)+' s';ctx.strokeText(label,p.x,p.y);ctx.fillText(label,p.x,p.y);ctx.restore();});
    if(this.bossCrystal&&this.bossChest&&!this.bossCrystal.captured){const q=this.bossChest;push(q.y+.1,q.x,()=>{const p=cam.project(q.x,q.y,this.groundZ(q.x,q.y)+2.7);BK.sprites.drawDiamond(ctx,p.x,p.y,p.k*.85,time,{rays:true,open:true});});}
    if(this.bossChest){const chest=this.bossChest;push(chest.y,chest.x,()=>{const p=cam.project(chest.x,chest.y,this.groundZ(chest.x,chest.y));ctx.save();ctx.globalAlpha=.3+.1*Math.sin(time*4);ctx.fillStyle='#ffe57d';ctx.beginPath();ctx.ellipse(p.x,p.y-p.k*.6,p.k*1.1,p.k*1.3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;BK.sprites.drawDeco(ctx,'chest',p.x,p.y,p.k*1.9,time,0,1,0,null,{open:chest.open});ctx.font='bold 18px Nunito';ctx.textAlign='center';ctx.fillStyle='#fff4bc';ctx.strokeStyle='#302236';ctx.lineWidth=4;const label=chest.open?'Trésor récupéré !':'Approche pour ouvrir';ctx.strokeText(label,p.x,p.y-p.k*1.5);ctx.fillText(label,p.x,p.y-p.k*1.5);ctx.restore();});}

    for(const [key,props] of Object.entries(this.props))if(props.deco==='waterjet'){
      const [c,r]=key.split(',').map(Number);if(this.deco[this.idx(c,r)]!=='waterjet')continue;
      for(const [i,q] of this.waterJetPoints(c,r).entries())push(q.y,q.x,()=>{const p=cam.project(q.x,q.y,q.z+.25+Math.sin(time*12-i)*.035);ctx.save();ctx.fillStyle=i%2?'#c4f6ff':'#68c8ef';ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(p.x,p.y,p.k*.15,p.k*.1,0,0,Math.PI*2);ctx.fill();ctx.restore();});
    }
    for(const a of this.arenaAnvils||[])push(a.y,a.x,()=>{const p=cam.project(a.x,a.y,this.groundZ(a.x,a.y));ctx.save();ctx.strokeStyle='#ff584f';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,p.k*.6,p.k*.3,0,0,Math.PI*2);ctx.stroke();ctx.font='bold 20px Nunito';ctx.textAlign='center';if(a.t<a.warn)ctx.fillText('⚠',p.x,p.y);else{const top=cam.project(a.x,a.y,this.groundZ(a.x,a.y)+Math.max(0,5*(1-(a.t-a.warn)/.45)));BK.sprites.drawDeco(ctx,'anvil',top.x,top.y,p.k*.8,time);}ctx.restore();});
    for(const wave of this.arenaWaves||[])push(wave.y,wave.x,()=>{ctx.save();ctx.strokeStyle='#ff9a45';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<=64;i++){const angle=i/64*Math.PI*2,p=cam.project(wave.x+Math.cos(angle)*wave.t*2.8,wave.y+Math.sin(angle)*wave.t*2.8,.08);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();ctx.restore();});
  };
})(window.BK);
