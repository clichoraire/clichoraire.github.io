// Pièges configurables : délais sûrs, avertissement, activation ; les murs arrêtent tous les tirs.
(function(BK){
  'use strict';
  const W=BK.World.prototype,clamp=(v,min,max,fallback)=>Number.isFinite(+v)?Math.max(min,Math.min(max,+v)):fallback;
  W.mechanisms=function(){return Object.entries(this.props).flatMap(([key,props])=>{if(!props.deco?.startsWith('trap_'))return [];const [c,r]=key.split(',').map(Number);return this.deco[this.idx(c,r)]===props.deco?[{key,c,r,x:c+.5,y:r+.5,z:this.hAt(c,r),kind:props.deco.slice(5),props}]:[];});};
  W.trapPhase=function(q,time=this.trapClock??this.time){
    const rest=clamp(q.props.trapRest,1,5,2),active=clamp(q.props.trapActive,.5,3,1),delay=clamp(q.props.trapDelay,0,3,0),warn=.6,cycle=rest+warn+active;
    if(time<delay)return {mode:'rest',until:delay-time+rest,active,cycle};
    const t=(time-delay)%cycle;return t<rest?{mode:'rest',until:rest-t,active,cycle}:t<rest+warn?{mode:'warn',until:rest+warn-t,active,cycle}:{mode:'active',until:cycle-t,active,cycle};
  };
  W.trapRay=function(q){
    const D=BK.DIRS[((q.props.orientation||0)%4+4)%4],range=clamp(q.props.trapRange,2,6,4),out=[];
    for(let d=.6;d<=range;d+=.15){const x=q.x+D.dx*d,y=q.y+D.dy*d,c=Math.floor(x),r=Math.floor(y);if(!this.inside(c,r)||this.cell(c,r)||!this.walkableTerrain(c,r)||Math.abs(this.hAt(c,r)-q.z)>.3)break;out.push({x,y,c,r,z:q.z});}return out;
  };
  W.trapTouches=function(p,q,radius=.42){return p.alive&&!p.npc&&!p.air&&!p.falling&&!p.boat&&!p.onBomb&&!p.swallowedBy&&Math.abs((this.explore?this.groundZ(p.x,p.y):0)-q.z)<.3&&Math.hypot(p.x-q.x,p.y-q.y)<p.r+radius;};
  W.hitTrap=function(p,q){
    if(!this.hitPlayer(p,{kind:'trap',dmg:q.kind==='crusher'?20:q.kind==='gas'||q.kind==='dart'?5:10}))return;
    if(q.kind==='dart'||q.kind==='gas')this.poisonPlayer(p,null);
    if(q.kind==='frost')p.frozen=Math.max(p.frozen||0,1.5);
  };
  W.trapSawPoint=function(q){const ray=this.trapRay(q);if(!ray.length)return null;const phase=this.trapPhase(q),u=((this.trapClock??this.time)%(phase.cycle))/phase.cycle,pos=1-Math.abs(u*2-1);return ray[Math.min(ray.length-1,Math.floor(pos*ray.length))];};
  W.updateTraps=function(dt){
    this.trapClock=(this.trapClock??0)+dt;this.trapStates=this.trapStates||new Map();this.trapArrows=this.trapArrows||[];
    const mechanisms=this.mechanisms(),keys=new Set(mechanisms.map(q=>q.key));for(const key of this.trapStates.keys())if(!keys.has(key))this.trapStates.delete(key);
    for(const q of mechanisms){
      if(q.kind==='dart'||q.kind==='zap'){
        let s=this.trapStates.get(q.key);if(!s){s={mode:'rest',timer:clamp(q.props.trapDelay,0,3,0),pending:0};this.trapStates.set(q.key,s);}s.timer-=dt;
        const ray=this.trapRay(q);
        if(s.mode==='rest'&&s.timer<=0&&this.players.some(p=>ray.some(v=>this.trapTouches(p,v,.2)))){s.mode='warn';s.timer=.6;}
        else if(s.mode==='warn'&&s.timer<=0){s.mode='active';s.timer=q.kind==='zap'?clamp(q.props.trapActive,.5,3,1):.5;if(q.kind==='dart'){s.pending=q.props.trapBurst===3?3:1;s.next=0;}}
        if(s.mode==='active'){
          if(q.kind==='zap')for(const p of this.players)if(ray.some(v=>this.trapTouches(p,v,.18)))this.hitTrap(p,q);
          if(q.kind==='dart'&&s.pending){s.next-=dt;if(s.next<=0){s.pending--;s.next=.14;const D=BK.DIRS[((q.props.orientation||0)%4+4)%4];if(ray.length)this.trapArrows.push({x:ray[0].x,y:ray[0].y,z:q.z,dx:D.dx,dy:D.dy,life:(clamp(q.props.trapRange,2,6,4)-.6)/6,kind:'dart'});}}
          if(s.timer<=0){s.mode='rest';s.timer=clamp(q.props.trapRest,1,5,2);s.pending=0;}
        }
      }else{
        const phase=this.trapPhase(q);let points=[];
        if(q.kind==='saw'){const p=this.trapSawPoint(q);if(p)points=[p];}
        else if(phase.mode==='active')points=['flame','frost'].includes(q.kind)?this.trapRay(q):[q];
        for(const p of this.players)if(points.some(v=>this.trapTouches(p,v,q.kind==='gas'?.62:q.kind==='saw'?.26:.4)))this.hitTrap(p,q);
      }
    }
    for(const a of this.trapArrows){const steps=Math.max(1,Math.ceil(dt*6/.1)),step=dt/steps;for(let n=0;n<steps&&!a.dead;n++){a.life-=step;a.x+=a.dx*6*step;a.y+=a.dy*6*step;const c=Math.floor(a.x),r=Math.floor(a.y);if(a.life<=0||!this.inside(c,r)||this.cell(c,r)||Math.abs(this.hAt(c,r)-a.z)>.3){a.dead=true;break;}const p=this.players.find(p=>this.trapTouches(p,a,.1));if(p){this.hitTrap(p,a);a.dead=true;}}}
    this.trapArrows=this.trapArrows.filter(a=>!a.dead);
  };
  W.trapDangerPoints=function(){
    const out=[];
    for(const q of this.mechanisms()){
      const phase=this.trapPhase(q),sensor=['dart','zap'].includes(q.kind),ray=['dart','zap','flame','frost','saw'].includes(q.kind);
      const when=sensor||q.kind==='saw'?0:phase.mode==='active'?0:phase.mode==='warn'?phase.until:phase.until+.6;
      if(when>1.2)continue;
      for(const p of ray?this.trapRay(q):[q])out.push({c:p.c,r:p.r,when});
      if(q.kind==='gas')for(const D of BK.DIRS)if(!this.cell(q.c+D.dx,q.r+D.dy))out.push({c:q.c+D.dx,r:q.r+D.dy,when});
    }
    for(const a of this.trapArrows||[])for(let d=0;d<Math.min(2,a.life*6);d+=.25){const c=Math.floor(a.x+a.dx*d),r=Math.floor(a.y+a.dy*d);if(!this.inside(c,r)||this.cell(c,r))break;out.push({c,r,when:d/6});}
    return out;
  };
  W.renderTraps=function(ctx,cam,time,push){
    for(const q of this.mechanisms()){
      const phase=['dart','zap'].includes(q.kind)?this.trapStates?.get(q.key)||{mode:'rest'}:this.trapPhase(q),active=phase.mode==='active',warn=phase.mode==='warn';
      if(warn)push(q.y+.05,q.x,()=>{const p=cam.project(q.x,q.y,q.z+.12);ctx.save();ctx.strokeStyle='#ffcf55';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,p.k*.47,p.k*.25,0,0,Math.PI*2);ctx.stroke();ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff4ba';ctx.fillText('!',p.x,p.y-p.k*.7);ctx.restore();});
      if(active&&q.kind==='spikes')push(q.y+.02,q.x,()=>{const p=cam.project(q.x,q.y,q.z);ctx.save();for(let i=0;i<6;i++){const x=p.x+(i%3-1)*p.k*.25,y=p.y+(Math.floor(i/3)-.5)*p.k*.14;ctx.fillStyle=i%2?'#dbe9ef':'#99afc3';ctx.beginPath();ctx.moveTo(x-p.k*.08,y);ctx.lineTo(x,y-p.k*.48);ctx.lineTo(x+p.k*.08,y);ctx.closePath();ctx.fill();}ctx.restore();});
      if(active&&['zap','flame','frost'].includes(q.kind)){const ray=this.trapRay(q);for(let i=0;i<ray.length;i+=2){const v=ray[i];push(v.y+.01,v.x,()=>{const p=cam.project(v.x,v.y,v.z+.28);ctx.save();ctx.fillStyle=q.kind==='zap'?'#8beeff':q.kind==='frost'?'#c5eeff':'#ffab45';ctx.globalAlpha=.8;ctx.beginPath();if(q.kind==='flame'){ctx.moveTo(p.x-p.k*.17,p.y+p.k*.1);ctx.quadraticCurveTo(p.x-p.k*.15,p.y-p.k*.15,p.x+Math.sin(time*12+i)*p.k*.1,p.y-p.k*.4);ctx.quadraticCurveTo(p.x+p.k*.08,p.y-p.k*.08,p.x+p.k*.17,p.y+p.k*.1);ctx.closePath();}else ctx.ellipse(p.x,p.y,p.k*.2,p.k*.12,Math.sin(time*15+i)*.3,0,Math.PI*2);ctx.fill();if(q.kind==='zap'){ctx.strokeStyle='#fff5b5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-p.k*.15,p.y);ctx.lineTo(p.x,p.y-p.k*.12);ctx.lineTo(p.x+p.k*.12,p.y+p.k*.06);ctx.stroke();}ctx.restore();});}}
      if(q.kind==='saw'){const rail=this.trapRay(q);if(rail.length)push(q.y-.01,q.x,()=>{const a=rail[0],b=rail[rail.length-1];ctx.save();ctx.strokeStyle='#687c91';ctx.lineWidth=2;for(const offset of [-.1,.1]){const D=BK.DIRS[((q.props.orientation||0)%4+4)%4],p=cam.project(a.x+D.dy*offset,a.y-D.dx*offset,q.z+.03),end=cam.project(b.x+D.dy*offset,b.y-D.dx*offset,q.z+.03);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();}ctx.restore();});const v=this.trapSawPoint(q);if(v)push(v.y+.03,v.x,()=>{const p=cam.project(v.x,v.y,v.z+.2);BK.sprites.drawTrapSaw(ctx,p.x,p.y,p.k*.32,time);});}
      if(active&&q.kind==='crusher')push(q.y+.03,q.x,()=>{const u=1-phase.until/phase.active,p=cam.project(q.x,q.y,q.z+Math.max(0,.12-u)*12);ctx.save();ctx.fillStyle='#65758d';BK.sprites.rr(ctx,p.x-p.k*.44,p.y-p.k*.55,p.k*.88,p.k*.55,p.k*.04);ctx.fill();ctx.fillStyle='#b4c0cf';ctx.fillRect(p.x-p.k*.4,p.y-p.k*.52,p.k*.8,p.k*.12);ctx.restore();});
      if(active&&q.kind==='gas')push(q.y+.03,q.x,()=>{const p=cam.project(q.x,q.y,q.z);ctx.save();ctx.fillStyle='#97cf69';ctx.globalAlpha=.45;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(p.x+Math.sin(time*2+i)*p.k*.3,p.y-p.k*(.2+(i%3)*.15),p.k*.3,p.k*.24,0,0,Math.PI*2);ctx.fill();}ctx.restore();});
    }
    for(const a of this.trapArrows||[])push(a.y+.02,a.x,()=>{const p=cam.project(a.x,a.y,a.z+.3),tip=cam.project(a.x+a.dx*.35,a.y+a.dy*.35,a.z+.3);ctx.save();ctx.strokeStyle='#ac713c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();ctx.fillStyle='#b4f46d';ctx.beginPath();ctx.arc(tip.x,tip.y,p.k*.055,0,Math.PI*2);ctx.fill();ctx.restore();});
  };
})(window.BK);
