// Adversaires du mode Match : carte de danger, fuite, chasse aux blocs, aux objets et aux joueurs.
(function (BK) {
  'use strict';
  const DIRS = BK.DIRS;
  const AI = BK.ai = {};
  // Carte de danger : pour chaque case, le temps avant qu'une flamme l'atteigne (Infinity = sûre).
  AI.dangerMap = function (W, extraBomb) {
    const d = new Float32Array(W.cols * W.rows).fill(Infinity);
    const bombs = W.bombs.filter(b => b.state !== 'flying').map(b => ({ c: b.state === 'carried' ? Math.floor(b.x) : b.cx, r: b.state === 'carried' ? Math.floor(b.y) : b.cy, t: b.t, fire: b.fire, dome:b.dome }));
    if (extraBomb) bombs.push(extraBomb);
    for (const f of W.flames) d[W.idx(f.cx, f.cy)] = 0;
    for (const fb of W.falling) d[W.idx(fb.c, fb.r)] = 0;
    // propagation des chaînes : une bombe touchée explose au même moment
    let changed = true; const times = bombs.map(b => b.t);
    while (changed) { changed = false; for (let i = 0; i < bombs.length; i++) for (let j = 0; j < bombs.length; j++) { if (i === j) continue; const a = bombs[i], b = bombs[j]; if (times[j] < times[i] && AI.inBlast(W, b, a.c, a.r)) { times[i] = times[j]; changed = true; } } }
    bombs.forEach((b, i) => {
      const t = times[i]; const set = (c, r) => { const k = W.idx(c, r); if (t < d[k]) d[k] = t; };
      set(b.c, b.r);
      if(b.dome){for(const q of W.domeCells(b,b.c,b.r))set(q.c,q.r);return;}
      for (let dir = 0; dir < 4; dir++) { const D = DIRS[dir]; for (let k = 1; k <= b.fire; k++) { const c = b.c + D.dx * k, r = b.r + D.dy * k; const v = W.cell(c, r); if (v === BK.HARD) break; set(c, r); if (v === BK.SOFT) break; } }
    });
    if (W.rain && W.rain.i < W.rain.order.length) for (let k = 0; k < 3; k++) { const p = W.rain.order[W.rain.i + k]; if (p) d[W.idx(p.c, p.r)] = Math.min(d[W.idx(p.c, p.r)], 0.3 * k); }
    return d;
  };
  AI.inBlast = function (W, b, c, r) {
    if (b.dome)return W.domeCells(b,b.c,b.r).some(q=>q.c===c&&q.r===r);
    if (b.c === c && b.r === r) return true;
    if (b.c !== c && b.r !== r) return false;
    const dir = b.c === c ? (r > b.r ? 0 : 2) : (c > b.c ? 3 : 1), D = DIRS[dir], n = Math.abs(c - b.c) + Math.abs(r - b.r);
    if (n > b.fire) return false;
    for (let k = 1; k < n; k++) if (W.cell(b.c + D.dx * k, b.r + D.dy * k)) return false;
    return true;
  };
  // Parcours en largeur depuis la case du bot : retourne { dist, prev } sur les cases accessibles (sans traverser les blocs ni les bombes).
  AI.bfs = function (W, p, danger, maxDanger) {
    const start = { c: Math.floor(p.x), r: Math.floor(p.y) }, n = W.cols * W.rows;
    const dist = new Int16Array(n).fill(-1), prev = new Int16Array(n).fill(-1), q = [start]; dist[W.idx(start.c, start.r)] = 0;
    const speed = p.speed;
    while (q.length) {
      const cur = q.shift(), ci = W.idx(cur.c, cur.r);
      for (let dir = 0; dir < 4; dir++) {
        const D = DIRS[dir], c = cur.c + D.dx, r = cur.r + D.dy; if (!W.inside(c, r)) continue; const k = W.idx(c, r); if (dist[k] >= 0) continue;
        if (p.ally && !W.walkableTerrain(c,r)) continue;
        if (W.blocked(c, r, p) || p.ally && !W.canStep(cur.c,cur.r,c,r,p)) continue;
        const arrive = (dist[ci] + 1) / speed;
        if (danger && danger[k] !== Infinity && danger[k] < arrive + 0.35 && danger[k] > -1) { if (maxDanger == null || danger[k] <= maxDanger) continue; }
        dist[k] = dist[ci] + 1; prev[k] = ci; q.push({ c, r });
      }
    }
    return { dist, prev, start };
  };
  AI.pathTo = function (W, bfs, c, r) {
    let k = W.idx(c, r); if (bfs.dist[k] < 0) return null; const path = [];
    while (k >= 0 && k !== W.idx(bfs.start.c, bfs.start.r)) { path.push({ c: k % W.cols, r: Math.floor(k / W.cols) }); k = bfs.prev[k]; }
    return path.reverse();
  };
  // Peut-on fuir si on pose une bombe ici ? (il existe une case sûre accessible, bombe comprise)
  AI.canEscape = function (W, p, c, r) {
    const danger = AI.dangerMap(W, { c, r, t: BK.BOMB_FUSE, fire: p.fire, dome:p.dome });
    const bfs = AI.bfs(W, p, null);
    for (let i = 0; i < danger.length; i++) if (danger[i] === Infinity && bfs.dist[i] >= 0 && bfs.dist[i] / p.speed < BK.BOMB_FUSE - 0.5) return true;
    return false;
  };
  // Prévision prudente pour les compagnons : inclut les bombes en vol, glissantes et géantes.
  AI.allyDanger = function(W, extra) {
    const danger=AI.dangerMap(W,extra),mark=(c,r,t)=>{if(W.inside(c,r))danger[W.idx(c,r)]=Math.min(danger[W.idx(c,r)],t);};
    const trace=(c,r,b)=>{if(b.dome){for(const q of W.domeCells(b,c,r))mark(q.c,q.r,b.t);return;}mark(c,r,b.t);for(const D of DIRS)for(let k=1;k<=b.fire;k++){const x=c+D.dx*k,y=r+D.dy*k;if(!W.inside(x,y)||[BK.HARD,BK.GATE,BK.SEALED,BK.METAL].includes(W.cell(x,y)))break;mark(x,y,b.t);if(W.cell(x,y)===BK.SOFT)break;}};
    for(const b of W.bombs){
      if(b.rock)continue;
      if(b.state==='flying'&&b.to){const c=Math.floor(b.to.x),r=Math.floor(b.to.y);trace(c,r,{...b,t:Math.min(b.t,danger[W.idx(c,r)])});}
      if(b.state==='sliding'){const D=DIRS[b.dir];for(let k=0;k<=Math.ceil(BK.KICK_SPEED*b.t);k++){const c=b.cx+D.dx*k,r=b.cy+D.dy*k;if(!W.inside(c,r)||W.cell(c,r))break;trace(c,r,b);}}
      if(b.giga){const c=Math.floor(b.to?.x??b.x),r=Math.floor(b.to?.y??b.y);for(let dy=-b.fire;dy<=b.fire;dy++)for(let dx=-b.fire;dx<=b.fire;dx++)if(Math.hypot(dx,dy)<=b.fire)mark(c+dx,r+dy,b.t);}
    }for(const q of W.puddles)if(q.kind==='toadSlime'&&q.t<q.dur&&Math.abs(W.hAt(q.c,q.r)-q.z)<.3)mark(q.c,q.r,0);
    for(const q of W.trapDangerPoints())mark(q.c,q.r,q.when);
    const arena=AI.allyArenaDanger(W);for(let k=0;k<danger.length;k++)danger[k]=Math.min(danger[k],arena[k]);return danger;
  };
  // Menaces de l’arène, y compris leurs avertissements avant impact.
  AI.allyArenaDanger = function(W) {
    if(W._allyArenaTime===W.time&&W._allyArenaDanger)return W._allyArenaDanger;
    const danger=new Float32Array(W.cols*W.rows).fill(Infinity);
    const disk=(x,y,radius,t,z)=>{for(let r=Math.max(0,Math.floor(y-radius-1));r<=Math.min(W.rows-1,Math.ceil(y+radius));r++)for(let c=Math.max(0,Math.floor(x-radius-1));c<=Math.min(W.cols-1,Math.ceil(x+radius));c++)if(Math.hypot(c+.5-x,r+.5-y)<radius+.65&&(z==null||Math.abs(W.hAt(c,r)-z)<.5))danger[W.idx(c,r)]=Math.min(danger[W.idx(c,r)],Math.max(0,t));};
    const ray=(x,y,a,length,speed,delay,radius)=>{for(let d=0;d<=length;d+=.3){const xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d,c=Math.floor(xx),r=Math.floor(yy);if(!W.inside(c,r)||W.cell(c,r))break;disk(xx,yy,radius,delay+d/speed);}};
    for(const [key,pr] of Object.entries(W.props))if(pr.deco==='waterjet'){const [c,r]=key.split(',').map(Number);if(W.deco[W.idx(c,r)]==='waterjet')for(const q of W.waterJetPoints(c,r))disk(q.x,q.y,.25,0,q.z);}
    for(const a of W.arenaAnvils||[])if(!a.hit)disk(a.x,a.y,.8,a.warn+.45-a.t);
    for(const e of W.enemies)if(e.arenaBoss&&!e.dead&&e.attack){
      if(e.attack.kind==='fire')for(const offset of e.phase===2?[-.35,0,.35]:[0])ray(e.x+Math.cos(e.aim+offset)*.9,e.y+Math.sin(e.aim+offset)*.9,e.aim+offset,8.8,4,e.attack.t,.3);
      if(e.attack.kind==='wave')disk(e.x,e.y,6,e.attack.t);
    }
    for(const e of W.enemies)if(!e.dead&&e.toadAttack){if(e.toadAttack.kind==='tongue')ray(e.x,e.y,e.toadAttack.angle,3.5,100,e.toadAttack.t,.35);else disk(e.x,e.y,1.8,e.toadAttack.t);}
    for(const wave of W.arenaWaves||[])disk(wave.x,wave.y,6,0);
    for(const shot of W.shots)if(!shot.dead&&['fire','poison'].includes(shot.kind))ray(shot.x,shot.y,shot.a,Math.min(6,shot.life*shot.speed),shot.speed,0,shot.r+.15);
    W._allyArenaTime=W.time;return W._allyArenaDanger=danger;
  };
  AI.allyCombatEnemies = function(W,p,range){
    const captor=p.leader?.swallowedBy;
    if(captor&&W.enemies.includes(captor)&&AI.allyTargetable(captor))return [captor];
    return W.enemies.filter(e=>AI.allyTargetable(e)&&(e.arenaGuard||e.arenaBoss||Math.hypot(e.x-p.leader.x,e.y-p.leader.y)<range+(e.boss?3:0)));
  };
  // L'alerte du portrait suit la sécurité de la case, pas la durée du dialogue.
  AI.updateAllyBombAlert = function(W,p) {
    if(!p.bombAlert)return;
    const c=Math.floor(p.x),r=Math.floor(p.y);
    if(!p.alive||p.npc||!W.inside(c,r)||AI.allyDanger(W)[W.idx(c,r)]===Infinity)p.bombAlert=null;
  };
  AI.allyBombBubble = function(W,p,kind) {
    if(kind==='flee'&&!p.bombAlert)p.bombAlert={since:W.time};
    if(p.bombBubble?.kind===kind&&W.time<p.bombBubble.next)return;
    p.bombBubble={kind,text:kind==='return'?'Retour à l’envoyeur!':'Ça va exploser!',until:W.time+2,next:W.time+4};
    W.events.push({type:kind==='return'?'allyBombReturn':'allyBombWarning',player:p});
  };
  AI.allyTargetable = e=>!e.dead&&!e.tame&&!e.def.peaceful&&e.state!=='hidden'&&!(e.def.bestiary?.action==='creeper'&&e.fuse>0)&&!(e.type==='bombe_coureuse'&&e.fuseLeft!=null)&&!(e.arenaBoss&&['sealed','transform'].includes(e.state));
  AI.allyArenaEvade = function(W,p,dt){
    if(p.boat||p.air||p.falling||p.carrying||p.frozen>0)return false;
    const arena=AI.allyArenaDanger(W),here=arena[W.idx(Math.floor(p.x),Math.floor(p.y))];if(here===Infinity)return false;
    const danger=AI.allyDanger(W),bfs=AI.bfs(W,p,null),speed=p.speed*(p.stamina>20?BK.RUN_MULT:1);let best=null,cost=Infinity;
    for(let k=0;k<danger.length;k++)if(danger[k]===Infinity&&bfs.dist[k]>0&&bfs.dist[k]<cost){
      const path=AI.pathTo(W,bfs,k%W.cols,Math.floor(k/W.cols));
      // On peut quitter un jet ou une zone annoncée, mais jamais traverser du feu actif.
      if(path.every((q,i)=>!W.flameAt.has(W.idx(q.c,q.r))&&!W.dragonFires?.some(f=>f.c===q.c&&f.r===q.r&&f.t<6)&&(danger[W.idx(q.c,q.r)]===arena[W.idx(q.c,q.r)]||danger[W.idx(q.c,q.r)]>(i+1)/speed+.25))){best=path;cost=bfs.dist[k];}
    }
    if(W.enemies.some(e=>!e.dead&&e.type==='bombe_coureuse'&&e.fuseLeft!=null&&Math.hypot(e.x-p.x,e.y-p.y)<4))AI.allyBombBubble(W,p,'flee');
    p.path=[];p.planT=0;p.firebarPlan=null;p.running=speed>p.speed;p.curSpeed=speed;p.lastTap=null;
    if(best)AI.allyFollow(p,best);else{p.input.dx=p.input.dy=0;p.vx=p.vy=0;}return true;
  };
  AI.allyEscape = function(W,p,danger,budget) {
    const bfs=AI.bfs(W,p,null);let best=null,dist=Infinity;
    for(let k=0;k<danger.length;k++){
      if(danger[k]!==Infinity||bfs.dist[k]<0||bfs.dist[k]>=dist||bfs.dist[k]/p.speed+.5>=budget)continue;
      const path=AI.pathTo(W,bfs,k%W.cols,Math.floor(k/W.cols));
      if(path.every((q,i)=>danger[W.idx(q.c,q.r)]>(i+1)/p.speed+.25)){best=path;dist=bfs.dist[k];}
    }return best;
  };
  AI.allyFollow = function(p,path) {
    if(!path?.length)return;const q=path[0],dx=q.c+.5-p.x,dy=q.r+.5-p.y,d=Math.hypot(dx,dy);
    if(d<.1){path.shift();return AI.allyFollow(p,path);}if(Math.abs(dx)>.1){p.input.dx=Math.sign(dx);p.input.dy=Math.abs(dy)>.1&&Math.abs(dx)<.12?Math.sign(dy):0;}else{p.input.dx=0;p.input.dy=Math.sign(dy);}
  };
  // Planifier des déplacements ET des attentes selon l’angle futur des pièges.
  AI.allyFirebars = function(W,p,dt) {
    if(p.boat||p.air||p.falling||p.carrying||p.frozen>0){p.firebarPlan=null;return false;}
    const bars=W.firebars.filter(b=>W.deco[W.idx(b.c,b.r)]==='firebar'&&Math.hypot(p.x-b.c-.5,p.y-b.r-.5)<(Number(W.props[b.c+','+b.r]?.length)||3)+3);
    if(!bars.length){p.firebarPlan=null;return false;}
    const danger=AI.allyDanger(W),speed=p.speed*(p.stamina>20?BK.RUN_MULT:1),margin=p.r+.30;
    const safe=(x,y,t)=>{
      const c=Math.floor(x),r=Math.floor(y);if(!W.inside(c,r)||!W.walkableTerrain(c,r)||W.blocked(c,r,p)||W.flameAt.has(W.idx(c,r))||danger[W.idx(c,r)]<=t+.3)return false;
      const z=W.groundZ(x,y);
      return !bars.some(b=>{
        if(Math.abs(z-W.hAt(b.c,b.r))>=.5)return false;
        const pr=W.props[b.c+','+b.r]||{},rate=.9*(pr.speed==='slow'?.5:pr.speed==='fast'?2:1)*(pr.direction===-1?-1:1),angle=b.angle+(pr.orientation||0)*Math.PI/2+rate*t,dx=x-b.c-.5,dy=y-b.r-.5,length=Math.max(2,Math.min(4,Number(pr.length)||3));
        for(let arm=0;arm<(pr.arms===2?2:1);arm++){const a=angle+arm*Math.PI,along=Math.max(.45,Math.min(length,dx*Math.cos(a)+dy*Math.sin(a)));if(Math.hypot(dx-Math.cos(a)*along,dy-Math.sin(a)*along)<margin)return true;}
        return false;
      });
    };
    const segment=(a,x,y,end)=>{const n=Math.max(1,Math.ceil((end-a.t)/.05));for(let i=1;i<=n;i++){const u=i/n,xx=a.x+(x-a.x)*u,yy=a.y+(y-a.y)*u;if(!safe(xx,yy,a.t+(end-a.t)*u)||W.collides(xx,yy,p.r,p,{x:a.x,y:a.y}))return false;}return true;};
    const follow=()=>{
      const plan=p.firebarPlan;if(!plan)return false;
      while(plan.steps.length){const step=plan.steps[0],d=Math.hypot(step.x-p.x,step.y-p.y);if(step.wait?W.time>=plan.start+step.end:d<.025)plan.steps.shift();else break;}
      if(!plan.steps.length){p.firebarPlan=null;return false;}
      const step=plan.steps[0],d=Math.hypot(step.x-p.x,step.y-p.y),duration=step.wait?Math.max(dt,plan.start+step.end-W.time):d/speed;
      if(!segment({x:p.x,y:p.y,t:0},step.x,step.y,duration)){p.firebarPlan=null;return false;}
      p.running=false;p.lastTap=null;p.path=[];p.planT=0;p.input.dx=p.input.dy=0;
      if(!step.wait&&d>.001){const scale=Math.min(1,d/(speed*dt));p.input.dx=(step.x-p.x)/d*scale;p.input.dy=(step.y-p.y)/d*scale;p.running=speed>p.speed;p.curSpeed=speed;}else p.vx=p.vy=0;
      return true;
    };
    if(follow())return true;
    const hold=(x,y,t)=>{if(bars.some(b=>Math.abs(W.groundZ(x,y)-W.hAt(b.c,b.r))<.5&&Math.hypot(x-b.c-.5,y-b.r-.5)<(Number(W.props[b.c+','+b.r]?.length)||3)+margin))return false;for(let u=0;u<=.8;u+=.1)if(!safe(x,y,t+u))return false;return true;};
    const queue=[{x:p.x,y:p.y,t:0,first:null,steps:[]}],seen=new Set();let best=null,score=Infinity;
    for(let at=0;at<queue.length&&at<2500;at++){
      const node=queue[at],dist=Math.hypot(node.x-p.leader.x,node.y-p.leader.y);
      if(node.first&&hold(node.x,node.y,node.t)){const cost=Math.max(0,dist-1.2)+node.t*.12;if(cost<score){score=cost;best=node;}if(dist<1.5)break;}
      if(node.t>5)continue;
      const c=Math.floor(node.x),r=Math.floor(node.y),moves=[{x:node.x,y:node.y,wait:true},...DIRS.map(d=>({x:c+d.dx+.5,y:r+d.dy+.5}))];
      // Finir de rejoindre le centre de la case sans dévier en diagonale.
      if(Math.hypot(node.x-c-.5,node.y-r-.5)>.05)moves.push({x:c+.5,y:r+.5});
      for(const move of moves){const duration=move.wait?.25:Math.hypot(move.x-node.x,move.y-node.y)/speed,end=node.t+duration,key=Math.round(move.x*20)+','+Math.round(move.y*20)+','+Math.floor(end*5);if(seen.has(key)||!W.canStep(c,r,Math.floor(move.x),Math.floor(move.y),p)||!segment(node,move.x,move.y,end))continue;seen.add(key);queue.push({x:move.x,y:move.y,t:end,first:node.first||move,steps:[...node.steps,{...move,end}]});}
    }
    p.running=false;p.lastTap=null;p.path=[];p.planT=0;p.input.dx=p.input.dy=0;
    if(best){p.firebarPlan={start:W.time,steps:best.steps};if(follow())return true;}
    // Ne pas conserver une glissade au moment où l’allié décide d’attendre.
    if(!p.input.dx&&!p.input.dy)p.vx=p.vy=0;
    return true;
  };
  // Repli : les monstres comptent comme des obstacles, sauf pour sortir de leur portée.
  AI.allyRetreat = function(W,p,dt){
    const danger=AI.allyDanger(W),foes=W.enemies.filter(AI.allyTargetable);
    const clearance=(x,y)=>{let value=Infinity;for(const e of foes)if(Math.abs(W.groundZ(x,y)-W.groundZ(e.x,e.y))<.5&&W.canSee(e,{x,y},8))value=Math.min(value,Math.hypot(x-e.x,y-e.y)-(e.def.hitR||e.r)-p.r-.8);return value;};
    p.retreatT=(p.retreatT||0)-dt;
    if(p.retreatT<=0){
      p.retreatT=.2;const c=Math.floor(p.x),r=Math.floor(p.y),start=W.idx(c,r),queue=[{c,r}],dist=new Int16Array(danger.length).fill(-1),prev=new Int16Array(danger.length).fill(-1);dist[start]=0;
      let best=-1,score=Infinity;
      for(let at=0;at<queue.length;at++){
        const q=queue[at],k=W.idx(q.c,q.r),x=q.c+.5,y=q.r+.5,space=clearance(x,y);
        if(space>=0&&danger[k]===Infinity&&W.special.get(q.c+','+q.r)?.type!=='exit'){
          const d=Math.hypot(x-p.leader.x,y-p.leader.y),cost=Math.abs(d-1.4)+dist[k]*.035;
          if(cost<score){score=cost;best=k;}
        }
        for(const D of DIRS){const cc=q.c+D.dx,rr=q.r+D.dy;if(!W.inside(cc,rr))continue;const next=W.idx(cc,rr);
          if(dist[next]>=0||danger[next]!==Infinity||!W.walkableTerrain(cc,rr)||W.blocked(cc,rr,p)||!W.canStep(q.c,q.r,cc,rr,p))continue;
          const nextSpace=clearance(cc+.5,rr+.5);if(nextSpace<0&&(space>=0||nextSpace<=space))continue;
          dist[next]=dist[k]+1;prev[next]=k;queue.push({c:cc,r:rr});
        }
      }
      p.path=best<0?[]:AI.pathTo(W,{dist,prev,start:{c,r}},best%W.cols,Math.floor(best/W.cols));
    }
    p.running=false;p.lastTap=null;
    const step=p.path?.[0];
    if(step){const space=clearance(step.c+.5,step.r+.5);if(danger[W.idx(step.c,step.r)]!==Infinity||(space<0&&space<=clearance(p.x,p.y))){p.path=[];p.retreatT=0;p.vx=p.vy=0;return;}}
    AI.allyFollow(p,p.path);
    if(p.input.dx||p.input.dy){p.running=p.stamina>20&&Math.hypot(p.x-p.leader.x,p.y-p.leader.y)>2.5;p.curSpeed=p.speed*(p.running?BK.RUN_MULT:1);}else p.vx=p.vy=0;
  };
  // Ramasser uniquement à portée de main : .4 s pour soulever, .5 s de vol,
  // puis .9 s de marge. Une réaction en chaîne peut raccourcir la vraie mèche.
  AI.allyReturnBomb = function(W,p,danger) {
    if(p.heldSnail||p.frozen>0||p.hp<=p.maxHp*.25||p.pose==='pickup'||p.pose==='throw')return false;
    const c=Math.floor(p.x),r=Math.floor(p.y),under=W.bombAt(c,r),range=BK.THROW_CELLS+(p.longthrow?2:0);
    const bombs=W.bombs.filter(b=>!b.rock&&!b.exploded&&!b.underElevator&&['idle','sliding'].includes(b.state)&&['ninja_bombardier','clown_artificier'].includes(b.owner?.type)&&b.thrower!==p&&b.t>1.8&&danger[W.idx(b.cx,b.cy)]>1.8&&Math.abs(W.groundZ(b.x,b.y)-W.groundZ(p.x,p.y))<.1);
    for(const b of bombs){
      const pickupDir=DIRS.findIndex(D=>b.cx===c+D.dx&&b.cy===r+D.dy);
      if(under?under!==b:pickupDir<0||Math.hypot(p.x-b.x,p.y-b.y)>.95)continue;
      if(danger[W.idx(c,r)]<=1.8)continue;
      for(let dir=0;dir<4;dir++){
        const D=DIRS[dir],x=c+D.dx*range,y=r+D.dy*range;
        if(!W.inside(x,y)||!W.walkableTerrain(x,y)||W.blocked(x,y)||W.bombAt(x,y)||Math.abs(W.hAt(x,y)-W.hAt(c,r))>.01||danger[W.idx(x,y)]<1.4||W.enemies.some(e=>!e.dead&&Math.floor(e.x)===x&&Math.floor(e.y)===y))continue;
        const blast={c:x,r:y,fire:b.fire,dome:b.dome};
        // Même sans friendly fire, une bombe ennemie reste dangereuse pour l'équipe.
        if(W.players.some(q=>q.alive&&!q.npc&&AI.inBlast(W,blast,Math.floor(q.x),Math.floor(q.y))))continue;
        if(!W.enemies.some(e=>AI.allyTargetable(e)&&AI.inBlast(W,blast,Math.floor(e.x),Math.floor(e.y))))continue;
        p.dir=pickupDir<0?p.dir:pickupDir;
        if(W.pickupBomb(p)){
          AI.allyBombBubble(W,p,'return');
          p.throwDir=dir;p.path=[];p.planT=0;p.input.dx=p.input.dy=0;p.vx=p.vy=0;p.bombCool=3;
          return true;
        }
      }
    }return false;
  };
  AI.allyBombs = function(W,p,dt) {
    p.bombCool=Math.max(0,(p.bombCool||0)-dt);
    if(p.boat||p.air||p.falling)return false;
    if(p.carrying){if(p.carrying.rock)return false;if(p.pose!=='pickup'||p.poseT>=.4||p.carrying.t<.7){p.dir=p.throwDir??p.dir;W.throwBomb(p);p.path=[];p.planT=0;}return true;}
    const c=Math.floor(p.x),r=Math.floor(p.y),danger=AI.allyDanger(W),here=danger[W.idx(c,r)];
    if(AI.allyReturnBomb(W,p,danger))return true;
    if(here!==Infinity){if(AI.dangerMap(W)[W.idx(c,r)]!==Infinity||W.bombs.some(b=>!b.rock&&b.state==='flying'&&b.to&&AI.inBlast(W,{c:Math.floor(b.to.x),r:Math.floor(b.to.y),fire:b.fire,dome:b.dome},c,r)))AI.allyBombBubble(W,p,'flee');const path=AI.allyEscape(W,p,danger,here===0?Infinity:here);AI.allyFollow(p,path);p.path=[];p.planT=0;return true;}
    if(p.hp<=p.maxHp*.25)return false;
    if(p.bombCool>0||p.bombsOut>=p.bombsMax||W.bombAt(c,r)||Math.hypot(p.x-c-.5,p.y-r-.5)>.15)return false;
    const enemies=AI.allyCombatEnemies(W,p,6);
    const useful=(x,y)=>enemies.some(e=>AI.inBlast(W,{c:x,r:y,fire:p.fire,dome:p.dome},Math.floor(e.x),Math.floor(e.y)));
    const teamSafe=(x,y)=>!BK.settings.friendlyFire||!W.players.some(q=>q!==p&&q.alive&&!q.npc&&(q.leader||q)===p.leader&&AI.inBlast(W,{c:x,r:y,fire:p.fire,dome:p.dome},Math.floor(q.x),Math.floor(q.y)));
    // Lancer vers une case libre à portée de l'ennemi : on ne vole jamais la bombe du héros.
    for(let d=0;d<4;d++){
      const D=DIRS[d],x=c+D.dx*BK.THROW_CELLS,y=r+D.dy*BK.THROW_CELLS;
      if(!W.inside(x,y)||!W.walkableTerrain(x,y)||W.blocked(x,y)||Math.abs(W.hAt(x,y)-W.hAt(c,r))>.01||W.players.some(q=>q.alive&&Math.floor(q.x)===x&&Math.floor(q.y)===y)||W.enemies.some(e=>!e.dead&&Math.floor(e.x)===x&&Math.floor(e.y)===y)||!useful(x,y)||!teamSafe(x,y))continue;
      const future=AI.allyDanger(W,{c:x,r:y,fire:p.fire,t:BK.BOMB_FUSE-1});
      if(!AI.allyEscape(W,p,future,BK.BOMB_FUSE-1))continue;
      if(W.placeBomb(p)){p.dir=d;p.throwDir=d;W.pickupBomb(p);p.bombCool=3;return true;}
    }
    const blockedPath=DIRS.some(D=>W.cell(c+D.dx,r+D.dy)===BK.SOFT)&&Math.hypot(p.x-p.leader.x,p.y-p.leader.y)<4;
    if((useful(c,r)||blockedPath)&&teamSafe(c,r)){
      const future=AI.allyDanger(W,{c,r,fire:p.fire,t:BK.BOMB_FUSE});const path=AI.allyEscape(W,p,future,BK.BOMB_FUSE);
      if(path?.length&&W.placeBomb(p)){p.bombCool=3;p.path=[];p.planT=0;AI.allyFollow(p,path);return true;}
    }return false;
  };

  AI.think = function (W, p, dt) {
    const st = p.bot; st.t = (st.t || 0) + dt; st.think = (st.think || 0) - dt;
    const inp = p.input; inp.bomb = false; inp.action = false;
    if (st.think > 0 && st.path && st.path.length) return AI.follow(W, p);
    st.think = 0.12 + Math.random() * 0.08 + (st.level === 'facile' ? 0.15 : 0);
    const c = Math.floor(p.x), r = Math.floor(p.y), here = W.idx(c, r);
    const danger = AI.dangerMap(W);
    const bfs = AI.bfs(W, p, danger);
    const inDanger = danger[here] !== Infinity;
    // 1. fuir
    if (inDanger) {
      const bfs2 = AI.bfs(W, p, danger, danger[here]);   // on accepte de traverser du danger moins pressant que le nôtre
      let best = null, bd = 1e9;
      for (let i = 0; i < danger.length; i++) if (danger[i] === Infinity && bfs2.dist[i] >= 0 && bfs2.dist[i] < bd) { bd = bfs2.dist[i]; best = i; }
      if (best == null) for (let i = 0; i < danger.length; i++) if (bfs2.dist[i] >= 0 && danger[i] > danger[here] + 0.5 && bfs2.dist[i] < bd) { bd = bfs2.dist[i]; best = i; }
      st.path = best == null ? null : AI.pathTo(W, bfs2, best % W.cols, Math.floor(best / W.cols));
      if (p.carrying) inp.bomb = true;   // on se débarrasse de la bombe portée
      return AI.follow(W, p);
    }
    // 2. attaquer un joueur proche
    const foes = W.players.filter(q => q !== p && q.alive);
    const canBomb = p.bombsOut < p.bombsMax && !W.bombAt(c, r);
    if (canBomb && st.level !== 'facile') {
      for (const q of foes) {
        const qc = Math.floor(q.x), qr = Math.floor(q.y);
        if (AI.inBlast(W, { c, r, fire: p.fire, dome:p.dome }, qc, qr) && Math.abs(qc - c) + Math.abs(qr - r) <= p.fire && AI.canEscape(W, p, c, r)) { inp.bomb = true; st.path = null; st.think = 0.05; return; }
      }
    }
    // 3. ramasser un objet proche
    let target = null, bestScore = -1e9;
    for (const it of W.items) { const k = W.idx(it.cx, it.cy); if (bfs.dist[k] < 0 || danger[k] !== Infinity) continue; const s = 60 - bfs.dist[k] * 3; if (s > bestScore) { bestScore = s; target = { c: it.cx, r: it.cy, kind: 'item' }; } }
    // 4. casser un bloc : case libre voisine d'un bloc mou, d'où on peut fuir
    if (canBomb) {
      for (let i = 0; i < bfs.dist.length; i++) {
        if (bfs.dist[i] < 0 || bfs.dist[i] > 12 || danger[i] !== Infinity) continue;
        const cc = i % W.cols, rr = Math.floor(i / W.cols); let soft = 0;
        for (const D of DIRS) if (W.cell(cc + D.dx, rr + D.dy) === BK.SOFT) soft++;
        if (!soft) continue;
        const s = 30 + soft * 8 - bfs.dist[i] * 4 + Math.random() * 6;
        if (s > bestScore) { bestScore = s; target = { c: cc, r: rr, kind: 'block' }; }
      }
      // 5. s'approcher d'un joueur
      for (const q of foes) {
        const qc = Math.floor(q.x), qr = Math.floor(q.y);
        for (const D of [{ dx: 0, dy: 0 }, ...DIRS]) { const cc = qc + D.dx, rr = qr + D.dy, k = W.idx(cc, rr); if (!W.inside(cc, rr) || bfs.dist[k] < 0 || danger[k] !== Infinity) continue; const s = (st.level === 'difficile' ? 45 : 25) - bfs.dist[k] * 2; if (s > bestScore) { bestScore = s; target = { c: cc, r: rr, kind: 'player' }; } }
      }
    }
    if (target) {
      if (target.c === c && target.r === r) {
        if (target.kind === 'block' || target.kind === 'player') { if (canBomb && AI.canEscape(W, p, c, r)) { inp.bomb = true; st.think = 0.05; } st.path = null; return; }
      }
      st.path = AI.pathTo(W, bfs, target.c, target.r);
      if (target.kind === 'player' && st.path && st.path.length <= 1 && canBomb && AI.canEscape(W, p, c, r)) { inp.bomb = true; }
      return AI.follow(W, p);
    }
    // 6. rien à faire : errer vers une case sûre au hasard
    const safe = []; for (let i = 0; i < bfs.dist.length; i++) if (bfs.dist[i] > 0 && bfs.dist[i] < 6 && danger[i] === Infinity) safe.push(i);
    if (safe.length) { const i = safe[Math.floor(Math.random() * safe.length)]; st.path = AI.pathTo(W, bfs, i % W.cols, Math.floor(i / W.cols)); }
    else st.path = null;
    AI.follow(W, p);
  };
  AI.follow = function (W, p) {
    const st = p.bot, inp = p.input;
    if (!st.path || !st.path.length) { inp.dx = inp.dy = 0; return; }
    const n = st.path[0], tx = n.c + 0.5, ty = n.r + 0.5, dx = tx - p.x, dy = ty - p.y;
    if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) { st.path.shift(); if (!st.path.length) { inp.dx = inp.dy = 0; return; } return AI.follow(W, p); }
    // on s'aligne d'abord sur l'axe perpendiculaire si on est loin du centre, puis on avance
    if (Math.abs(dx) > Math.abs(dy)) { inp.dx = Math.sign(dx); inp.dy = Math.abs(dy) > 0.06 ? Math.sign(dy) * 0.6 : 0; }
    else { inp.dy = Math.sign(dy); inp.dx = Math.abs(dx) > 0.06 ? Math.sign(dx) * 0.6 : 0; }
  };
})(window.BK);
