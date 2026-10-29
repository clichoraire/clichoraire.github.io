// Snow Kids — construction d'une piste à partir de sa définition (SK.COURSES) : segments, relief, décors, boîtes, pièces.
(function (SK) {
  'use strict';
  const SEG = SK.SEG;
  // Rayon (m) et hauteur (m) des obstacles posés sur la piste ; les décors hors piste n'ont pas de collision.
  SK.OBSTACLES = {
    pine: { r: 1.2 }, rock: { r: 1.3 }, snowman: { r: 1.1 }, cactus: { r: 0.9 }, car: { r: 2.2 }, cone: { r: 0.6 },
    cow: { r: 1.5 }, tree: { r: 1.2 }, bush: { r: 1.1 }, skull: { r: 1 }, icicle: { r: 1 }, lantern: { r: 0.8 }, statue: { r: 1.1 },
    bamboo: { r: 0.8 }, teacup: { r: 1.8 }, balloon: { r: 1.2 }, lollipop: { r: 0.8 },
  };

  // A single progression for visible geometry and handling. Custom lessons retain
  // their obstacles and lengths; regular routes keep their surface/theme identity.
  SK.routeTier=course=>SK.clamp(course.difficulty!=null?course.difficulty/1.8:Math.max(0,SK.COURSES.findIndex(c=>c.id===course.id)),0,8);
  SK.naturalCourse=function(course){
    const tier=SK.routeTier(course),sections=[];let index=0,lastSlope=8;
    for(const original of course.sections){
      if(!original.n){sections.push({...original});continue;}
      const sec={...original},i=index++;
      if(sec.t==='r'){sections.push(sec);continue;}
      const magnitude=.125+tier*.022+(i%3)*.009;
      if(sec.t==='c')sec.c=Math.sign(sec.c||1)*magnitude;
      // Add linking bends later in the progression, leaving bridges and tunnels broad.
      else if(tier>=2&&sec.n>=25&&i%3===2&&(sec.w||12)>=9){sec.c=(i%2?1:-1)*magnitude*.8;if(sec.t==='s')sec.t='c';}
      const slopes=[8,12+tier,18+tier*1.2,-(2+tier*.5),10,15+tier*.7];
      sec.slope=original.slope??slopes[i%slopes.length];sec.slopeFrom=lastSlope;lastSlope=sec.slope;
      if(tier>=4&&sec.t==='c'&&sec.n>=36&&i%2){
        const n=Math.floor(sec.n/2),left={...sec,n},right={...sec,n:sec.n-n,c:-sec.c*.9,slopeFrom:sec.slope,slope:10+tier};
        // Divide decoration budgets rather than duplicating obstacles at a chicane.
        for(const key of ['obst','coins'])if(sec[key]){left[key]=Math.floor(sec[key]/2);right[key]=sec[key]-left[key];}
        delete right.boxes;sections.push(left,right);lastSlope=right.slope;
      }else sections.push(sec);
    }
    return {...course,sections};
  };
  SK.curveDriftTarget=function(course,track,z,speed,cornerHold=0){
    const s=track.segAt(z),next=track.segAt(s.z+SEG),q=SK.clamp((z-s.z)/SEG,0,1);
    const curve=s.curve+(next.curve-s.curve)*q;
    return SK.clamp(curve/(SEG*SEG)*speed*speed*4.2*.70*(1-cornerHold)*(s.surface==='ice'?1.25:1)*(course.cornerDriftScale??.18),-(course.cornerDriftMax??.85),course.cornerDriftMax??.85);
  };

  SK.buildTrack = function (course, seed, opts) {
    const lesson=opts&&(opts.shootingLevel||opts.slalomLevel||opts.coinLevel||opts.tricksLesson||opts.rockBarriers||opts.edgeLesson);
    if(!lesson&&course.sections.length>1)course=SK.naturalCourse(course);

    if(opts?.shootingLevel){const level=opts.shootingLevel;
      course={...course,surface:level<=2?'snow':course.surface,laps:1,forest:false,lowPassages:false,snowGuards:false,polarBears:false,blizzard:false,strongWind:false,
        sections:Array.from({length:8+level*2},(_,i)=>({t:i&&i%3?'c':'s',c:i%2?.055+level*.012:-.055-level*.012,n:24+level*2,w:13-level*.55,slope:8+(i%3)*level*2}))};
    }
    if(opts?.slalomLevel){
      const level=opts.slalomLevel;
      // Niveau 2 : neige seulement, mini-bosses et vrais virages ; niveaux 3+ : glace, pentes variées et virages opposés aux portes.
      const sections=level===1?[{t:'s',n:155,w:12}]:level===2?[0,.13,-.14,.12,-.13,0].map((c,i)=>({t:c?'c':'s',c,n:36,w:12,bumps:i?.25:0})):Array.from({length:10},(_,i)=>({t:'s',n:15+level*2,w:12,bumps:.4}));
      course={...course,surface:'snow',sections,forest:false,lowPassages:false,snowGuards:false,polarBears:false,blizzard:level>=4,strongWind:level===5,progressiveStorm:level>=4,stormFromCountdown:true};
      if(level===2){course.cornerDriftScale=.18;course.cornerDriftMax=.85;course.cornerDriftAcceleration=1.4;}
      if(level>=3)sections.forEach((sec,i)=>{sec.slope=[7,16,22,12,18][i%5];if(i%3!==0){sec.t='c';sec.c=(i%2?1:-1)*(.15+(level-3)*.045);}});
    }
    // Leçon « Premières figures » : mini-bosses et grosses pentes-tremplins tout au long de la piste, aucune boîte d'objet.
    if(opts?.tricksLesson){
      const level=Number(opts.tricksLesson),w=13,sections=[{t:'s',n:20,w,coins:5}];
      for(let i=0;i<5;i++){
        sections.push({t:'b',n:24,a:.9+.1*level,w,coins:i%2?6:0});
        sections.push({t:'r',n:6,h:5+.5*level});
        sections.push({t:i%2?'c':'s',n:16,c:(i%4<2?1:-1)*.03,w,bumps:.5});
        sections.push({t:'r',n:4,h:3});
      }
      sections.push({t:'s',n:20,w,coins:6});
      course={...course,sections,forest:false,lowPassages:false,snowGuards:false,polarBears:false,blizzard:false,strongWind:false};
    }
    // Dedicated jumping lesson; do not alter the regular Sunset Rock course.
    if(opts?.rockBarriers){const level=Number(opts.rockBarriers);
      course={...course,surface:level<=2?'snow':'stone',sections:level<=3?Array.from({length:10},(_,i)=>({t:level===3?'c':'s',c:level===3?(i%2?-.065:.065):0,n:22,w:level===1?10:8})): [{t:'s',n:100,w:4.2},{t:'s',n:100,w:3.8},{t:'s',n:100,w:3.4}]};
    }
    if(opts?.edgeLesson){
      const width=4.6-.3*(opts.edgeLesson-1);
      course={...course,surface:'snow',sections:[{t:'s',n:30,w:width,boxes:'b'},
        ...[-1,1,0,-1,1,0,1,-1,0,-1,1,0].map((dir,i)=>({t:dir?'c':'s',n:dir?(i%2?18:12):12,c:dir*(.055+.01*(opts.edgeLesson-1)),w:width,boxes:i%3===0?'b':undefined}))]};
    }
    if(opts?.coinLevel&&SK.CoinWildlife)course=SK.CoinWildlife.course(course,opts.coinLevel);
    const tier=opts?.slalomLevel?Math.max(0,(opts.slalomLevel-2)*2):opts?.coinLevel?(opts.coinLevel-1)*1.7:opts?.edgeLesson?(opts.edgeLesson-1)*1.5:SK.routeTier(course);
    course={...course,cornerDriftScale:course.cornerDriftScale??(.18+tier*.025),cornerDriftMax:course.cornerDriftMax??(.85+tier*.19),cornerDriftAcceleration:course.cornerDriftAcceleration??(1.4+tier*.18)};
    const rng = SK.rng(seed || 7), theme = SK.THEMES[course.theme];
    const segs = []; let y = 0, surface = course.surface || 'snow', tunnel = false, prevW = opts?.rockBarriers ? 4.2 : opts?.edgeLesson ? (4.6-.3*(opts.edgeLesson-1)) : 12;
    const ease = (a, b, p) => a + (b - a) * (1 - Math.cos(Math.min(1, Math.max(0, p)) * Math.PI)) / 2;
    const push = (curve, w, dy, sec) => {
      const i = segs.length, s = { i, z: i * SEG, y1: y, y2: y + dy, curve, w, surface, tunnel, ramp: false, jump: false, props: [], boxes: [], coins: [], sec };
      y += dy; segs.push(s); return s;
    };
    const base = -(opts?.slalomLevel?Math.tan(10*Math.PI/180):SK.SLOPE) * SEG;
    for (const sec of course.sections) {
      if (sec.t === 'x') { surface = sec.s; continue; }
      if (sec.t === 'tunnel') { tunnel = !!sec.on; continue; }
      const n = sec.n, w = sec.w || prevW, start = segs.length, trans = Math.min(n, 12);
      for (let k = 0; k < n; k++) {
        const ww = ease(prevW, w, k / trans); let curve = 0;const slope=sec.slopeFrom!=null?ease(sec.slopeFrom,sec.slope,k/Math.min(6,n-1)):sec.slope;let dy=slope!=null?-Math.tan(slope*Math.PI/180)*SEG:base;
        if (sec.c) { const q = n / 4; curve = sec.c * (k < q ? ease(0, 1, k / q) : k > 3 * q ? ease(1, 0, (k - 3 * q) / q) : 1); }
        if (sec.t === 'b') { const f = kk => sec.a * Math.sin(2 * Math.PI * kk * 3 / n); dy += f(k + 1) - f(k); }
        if (sec.bumps) { const f = kk => sec.bumps * Math.sin(2 * Math.PI * kk * 3 / n); dy += f(k + 1) - f(k); } // mini-bosses sur n'importe quelle section
        if (sec.t === 'r') { // bosse-tremplin : montée de h sur n segments, puis redescente sur n segments (pas de saut sans appuyer)
          const up = push(curve, ww, dy + sec.h / n, sec); up.ramp = true; if (k === n - 1) up.jump = true;
          continue;
        }
        push(curve, ww, dy, sec);
      }
      if (sec.t === 'r') for (let k = 0; k < n; k++) { const d = push(0, w, base - sec.h / n, sec); d.ramp = true; d.down = true; }
      prevW = w;
      sec._start = start; sec._end = segs.length;
    }
    const L = segs.length * SEG;
    // Zone d'arrivée : 40 segments plats après la ligne (gare de la remontée), pour le dessin seulement.
    for (let k = 0; k < 40; k++) { const s = push(0, prevW, k < 6 ? base * (1 - k / 6) : 0, null); s.finish = true; }
    // Le portail de la remontée est dans un coin (côté selon la piste) ; une barrière ferme le reste à 15 m de la ligne.
    const side = SK.COURSES.indexOf(course) % 2 ? -1 : 1, gateX = side * (prevW - 4.5), gateW = 4;
    const gateSeg = segs[segs.length - 40 + 3];
    gateSeg.props.push({ type: 'gate', x: gateX, r: 0, decor: true, wide: false, gateW });
    gateSeg.barrier = { gateX, gateW };
    for (let k = 5; k < 40; k += 3) segs[segs.length - 40 + k].props.push({ type: 'liftpole', x: side * (prevW + 4), r: 0, decor: true });

    // Décors hors piste
    const nRace = segs.length - 40;
    for (let i = 2; i < segs.length; i++) {
      const s = segs[i];
      if (s.tunnel) continue;
      if (rng() < 0.55) { const side = rng() < 0.5 ? -1 : 1; s.props.push({ type: rng.pick(theme.decor), x: side * (s.w + 3 + rng() * 22), r: 0, decor: true, v: rng() }); }
      if (rng() < 0.25) { const side = rng() < 0.5 ? -1 : 1; s.props.push({ type: rng.pick(theme.decor), x: side * (s.w + 20 + rng() * 40), r: 0, decor: true, v: rng(), far: true }); }
    }
    if(course.forest&&!((course.forestLevel||1)>1))for(let i=30;i<nRace-20;i+=7){const s=segs[i];if(s.ramp)continue;const x=Math.sin(i*.31)*s.w*.65;s.props.push({type:'pine',x,r:1.2,decor:false});for(const side of [-1,1])s.props.push({type:'pine',x:side*(s.w+2+rng()*5),r:0,decor:true});}
    if(course.lowPassages)for(let i=55;i<nRace-25;i+=65){const s=segs[i];if(s.ramp)continue;s.props.push({type:'lowarch',x:0,r:s.w,decor:false,span:s.w});}
    // Garnitures par section : obstacles, boîtes, pièces
    for (const sec of course.sections) {
      if (sec._start == null) continue;
      const a = sec._start, b = sec._end, n = b - a;
      if (sec.obst) for (let k = 0; k < sec.obst; k++) {
        const s = segs[a + 3 + rng.int(Math.max(1, n - 6))]; if (s.ramp) continue;
        const type = rng.pick(theme.obst), x = rng.range(-s.w + 2.5, s.w - 2.5);
        if (s.props.some(p => !p.decor && Math.abs(p.x - x) < 4)) continue;
        s.props.push({ type, x, r: (SK.OBSTACLES[type] || { r: 1 }).r, decor: false, v: rng() });
      }
      if (sec.boxes) {
        const s = segs[a + Math.floor(n / 2)];
        const kinds = sec.boxes === 'rb' ? ['red', 'blue', 'red'] : sec.boxes === 'r' ? ['red', 'red', 'red'] : ['blue', 'blue', 'blue'];
        if (sec.boxes === 'rb' && rng() < 0.5) kinds.reverse();
        [-0.6, 0, 0.6].forEach((f, k) => s.boxes.push({ kind: kinds[k], x: f * s.w, taken: 0 }));
      }
      if (sec.coins) {
        const nc = Math.max(2, Math.round(sec.coins * 0.6)), lane = rng.range(-0.6, 0.6), s0 = a + 2 + rng.int(Math.max(1, n - 2 * nc - 4));
        for (let k = 0; k < nc; k++) { const s = segs[Math.min(b - 1, s0 + k * 2)]; s.coins.push({ x: lane * s.w, taken: 0 }); }
      }
    }
    if(course.forestLevel>=2){
      const level=course.forestLevel,dense=level>=3,deep=level>=4;
      for(let i=28;i<nRace-25;i++){
        const s=segs[i],q=(i-28)%150,block=Math.floor((i-28)/150);
        const smooth=v=>{v=SK.clamp(v,0,1);return v*v*(3-2*v);};
        const fork=block%3!==2?smooth((q-35)/22)*(1-smooth((q-102)/22)):0;
        const half=(deep?2.35:dense?2.6:2.9)-fork*.15;
        const zig=Math.sin(i*(deep?.046:.034))*Math.max(0,s.w-half-2.6);
        const middle=zig*(1-fork),offset=fork*Math.max(0,s.w-half-1.7);
        const lanes=fork>.03?[middle-offset,middle+offset]:[middle];
        const center=lanes[block%2?lanes.length-1:0];
        s.forestPath={center,half,lanes};
        s.props=s.props.filter(p=>p.decor||lanes.every(x=>Math.abs(p.x-x)>half+p.r+.7));
        for(const c of s.coins)c.x=center;
        for(const b of s.boxes)b.x=center+(b.kind==='red'?-.7:.7);
        if(s.ramp||i%(deep?2:dense?3:5))continue;
        for(let x=-s.w+1.3;x<s.w-1;x+=2.8){if(lanes.every(l=>Math.abs(x-l)>half+1.9))s.props.push({type:'pine',x,r:1.2,decor:false,v:rng()});}
        for(const side of [-1,1])for(let row=0;row<(deep?4:dense?3:2);row++)s.props.push({type:'pine',x:side*(s.w+2+row*4+rng()),r:0,decor:true,v:.6+rng()*.4});
      }
    }
    if(opts?.rockBarriers>3){
      // Three rocks cover the entire rideable width. Spacing decreases from
      // 170 m to 100 m, leaving time to land and charge the next jump.
      let index=35;
      while(index<nRace-18){
        const s=segs[index];
        for(const x of [-s.w*.6,0,s.w*.6])s.props.push({type:'rock',x,r:1.3,decor:false,trainingBarrier:true,clearance:.65,v:rng()});
        index+=Math.max(16,Math.round(34-14*index/nRace-2*(Number(opts.rockBarriers)-1)));
      }
    }
    // Des vaches traversent les portions larges de la prairie.
    const walkers=[];
    if(course.theme==='grass') {
      for(let i=28;i<nRace-25;i+=42){const s=segs[i];
        if(s.surface!=='grass'||s.w<9||s.ramp||s.boxes.length||s.props.some(p=>!p.decor))continue;
        s.props.push({type:'cow',x:0,r:1.5,decor:false,v:rng()});
      }
      for(const s of segs)for(const p of s.props)if(p.type==='cow'&&!p.decor){
        p.walk={range:Math.max(1,s.w-2.8),phase:p.v*Math.PI*2,rate:.10+p.v*.035};
        p.x=Math.sin(p.walk.phase)*p.walk.range;p.facing=Math.cos(p.walk.phase)>=0?1:-1;walkers.push(p);
      }
    }
    // Repères de thème (gros décors au tiers et aux deux tiers)
    const landmarks = { rookie: 'lodge', snowman: 'bigsnowman', sunset: 'mesa', highway: 'tower', grass: 'windmill', sand: 'pyramid', silver: 'peak', ninja: 'pagoda', dizzy: 'ferris' };
    [0.33, 0.7].forEach((f, k) => { const s = segs[Math.floor(nRace * f)]; s.props.push({ type: landmarks[course.theme], x: (k ? -1 : 1) * (s.w + 18), r: 0, decor: true, big: true }); });

    // Slalom (École) : portes de 6 m alternant gauche / droite, drapeau rouge puis bleu
    const gates = [];
    if(opts?.slalom){
      const level=opts.slalomLevel||1;
      let index=18;
      for(let k=0;k<20;k++){
        const s=segs[index],x=(k%2?1:-1)*(level===1?3.4:level===2?3.6+rng()*1.4:level===3?7.2:level===4?7.8:8.2),width=level>=3?1.6-(level-3)*.1:level===2?2.8:3.2,col=k%2?'#1e88e5':'#e53935';
        s.gate={x,w:width,color:col,n:k};for(const side of [-1,1])s.props.push({type:'flag',x:x+side*width,r:0,decor:true,color:col});gates.push(s);
        index+=level===1?5+Math.floor(rng()*3):level>=3?6+level:8+Math.floor(rng()*3);
      }
      for(let i=0;i<nRace;i++){
        const icy=level>=3?(i%25<(level===5?19:18)):false;
        segs[i].surface=icy?'ice':'snow';
      }
      if(level>=3)for(const i of [34,68,102,136]){const s=segs[i];s.props.push({type:'lowarch',x:0,r:s.w,span:s.w,decor:false});}
    }
    if(opts?.deadForest){
      // Décor latéral uniquement : les portes et la largeur skiable restent intactes.
      for(let i=15;i<nRace-10;i+=9){const s=segs[i];for(const side of [-1,1]){
        s.props.push({type:'winterbare',x:side*(s.w+6+(i%3)*2),r:0,decor:true,v:(i%7)/7});
        if(i%2)s.props.push({type:'deadlog',x:side*(s.w+3.8),r:0,decor:true,v:(i%5)/5});
      }}
    }
    // Ground-only speed strips, away from ramps and solid obstacles.
    if(opts?.boostPads)for(let i=55;i<nRace-35;i+=110){
      const s=segs[i];if(s.ramp||s.tunnel||s.props.some(p=>!p.decor))continue;
      s.boostPad={x:0,w:Math.min(3.5,s.w*.6)};
    }
    const track = { course, theme, segs, walkers, nRace, L, length: segs.length, gateX, gateW, gateZ: L + 3 * SEG, wEnd: prevW, gates };
    track.segAt = z => segs[SK.clamp(Math.floor(z / SEG), 0, segs.length - 1)];
    track.groundY = z => { const s = track.segAt(z); const p = SK.clamp((z - s.z) / SEG, 0, 1); return s.y1 + (s.y2 - s.y1) * p; };
    track.widthAt = z => track.segAt(z).w;
    // One persistent secret per tournament race; near the edge, away from the coin line.
    if(course.puzzleId){
      let hash=0;for(const ch of course.puzzleId)hash=(hash*31+ch.charCodeAt(0))>>>0;
      let index=Math.floor(nRace*(.38+(hash%37)/100));
      while(index<nRace-12&&(segs[index].ramp||segs[index].props.some(p=>!p.decor)))index++;
      const seg=segs[index],side=hash%2?1:-1;
      seg.puzzle={id:course.puzzleId,x:side*(seg.w-1.1),taken:false};
    }
    if(course.deepSnowbanks||course.extraRocks){
      for(let i=75,k=0;i<nRace-40;i+=32,k++){
        const sg=segs[i];if(sg.ramp||sg.gate)continue;
        // Alternate narrow hazards; always leave a wide passing lane.
        const bank=course.deepSnowbanks&&k%3===0,type=bank?'snowbank':'rock',x=(k%2?1:-1)*sg.w*.5;
        sg.props=sg.props.filter(p=>p.decor||Math.abs(p.x-x)>3.5);
        sg.props.push({type,x,r:bank?1.4:.8,clearance:bank?1.2:1.1,decor:false,size:1,v:0});
      }
    }
    track.snowGuards=[];
    const guardPositions=course.guardCount?Array.from({length:course.guardCount},(_,k)=>Math.round(40+k*(nRace-80)/(course.guardCount-1))):Array.from({length:Math.max(0,Math.ceil((nRace-100)/(course.guardSpacing||(course.forestLevel===3?65:100))))},(_,k)=>65+k*(course.guardSpacing||(course.forestLevel===3?65:100)));
    if(course.snowGuards)for(const position of guardPositions){let i=position;if(course.guardCount)while(i<nRace-20&&segs[i].ramp)i++;const s=segs[i];if(!s||s.ramp)continue;const side=track.snowGuards.length%2?1:-1;
      const guard={type:'snowguard',x:side*(s.w+1.8),z:s.z+SEG/2,r:0,decor:true,cooldown:0,windup:0};
      // Dégager le lanceur pour que sa préparation reste visible.
      s.props=s.props.filter(p=>Math.abs(p.x-guard.x)>3);s.props.push(guard);track.snowGuards.push(guard);
    }
    track.polarBears=[];
    if(course.polarBears)for(let i=95;i<nRace-35;i+=100){const s=segs[i];if(s.ramp)continue;
      const bear={type:'polarbear',x:(track.polarBears.length%2?1:-1)*s.w*.55,z:s.z+SEG/2,r:1.7,decor:true,dir:track.polarBears.length%2?-1:1,phase:'patrol',timer:0,limit:s.w-2};
      s.props=s.props.filter(p=>p.decor);s.props.push(bear);track.polarBears.push(bear);
    }
    if(course.challenges){
      const spec=course.challenges;let number=0;
      for(let i=spec.first;i<nRace-30;i+=spec.spacing){
        // Pas de saut obligatoire dans un tremplin ni au milieu d’une attaque.
        let index=i;while(index<i+20&&index<nRace-30&&(
          segs.slice(Math.max(0,index-10),index+11).some(s=>s.ramp)||
          [...track.snowGuards,...track.polarBears].some(p=>Math.abs(p.z-(index*SEG))<65)))index++;
        if(index>=i+20||index>=nRace-30)continue;
        const s=segs[index],type=(number++ +spec.stage)%2?'lowarch':'fallenlog';
        for(let j=Math.max(0,index-8);j<=index+8;j++){segs[j].props=segs[j].props.filter(p=>p.decor);segs[j].boxes=[];}
        s.props.push({type,x:0,r:s.w+1,span:s.w+.5,decor:false,mandatory:true,clearance:.7,style:spec.style});
        const sign=segs[Math.max(10,index-spec.warning)];
        for(const side of [-1,1])sign.props.push({type:'trailwarning',x:side*(sign.w+1),r:0,decor:true,action:type==='fallenlog'?'jump':'duck'});
        // Les pièces dessinent la trajectoire au centre du sentier.
        for(let j=index-4;j<=index+4;j+=2){const sg=segs[j];sg.coins=[{x:sg.forestPath?.center||0,taken:0}];}
      }
    }
    if(opts?.coinLevel)SK.CoinWildlife?.setup(track,opts.coinLevel,rng);
    if(opts?.rockBarriers&&opts.rockBarriers<=3){
      const level=Number(opts.rockBarriers);track.wildlife=[];
      for(const s of segs){s.props=s.props.filter(p=>p.decor);s.tunnel=level===3||(level===2&&s.i>=70&&s.i<150);if(s.tunnel)s.props=[];s.coins=[];s.boxes=[];s.cave=true;}
      for(let i=22;i<nRace-10;i+=level===1?13:7){const s=segs[i],side=s.curve>0?-1:1;
        const x=level===3?side*(2+rng()*3):rng.range(-s.w+2,s.w-2);
        s.props.push({type:'rock',x,r:level===1?1.1:.65,size:level===1?1:.65,clearance:level===1?.7:.45,decor:false,trainingBarrier:true,v:rng()});
      }
      for(let i=45;i<nRace-12;i+=45){const s=segs[i],type=i%90===0?'lowarch':'fallenlog';
        for(let j=i-4;j<=i+4;j++)segs[j].props=segs[j].props.filter(p=>p.decor);
        s.props.push({type,x:0,r:s.w,span:s.w,clearance:.6,mandatory:true,decor:false});
      }
      if(level===2)for(const i of [30,175,200]){const s=segs[i],x=(i%2?1:-1)*(s.w-1.5);for(let j=i-1;j<=i+1;j++)segs[j].dirt={x,w:1.3};track.wildlife.push({type:'mole',x,z:s.z+SEG/2,cooldown:0});}
      if(level===3)for(const start of [38,108,173]){
        for(let i=start;i<start+15;i++)segs[i].ceiling=1.5;
        const s=segs[start-5];s.props.push({type:'ceilingwarning',x:0,r:0,decor:true,span:s.w});
        for(let i=start+2;i<start+14;i+=5){const sg=segs[i];sg.props=sg.props.filter(p=>p.decor);sg.props.push({type:'fallenlog',x:0,r:sg.w,span:sg.w,clearance:.4,mandatory:true,decor:false});}
      }
    }
    if(opts?.shootingLevel)SK.Shooting?.setup(track,opts.shootingLevel,rng);
    SK.ForestLife?.setup(track,course);
    // Final pass after all hazards: accelerators need a clear exit, not just a clear tile.
    for(let i=0;i<nRace;i++){
      const sg=segs[i];
      if(sg.boostPad){const pad=sg.boostPad,blocked=segs.slice(Math.max(0,i-2),Math.min(nRace,i+Math.ceil(90/SEG))).some(q=>q.ramp||q.props.some(p=>!p.decor&&Math.abs(p.x-pad.x)<pad.w+(p.r||1)+1));if(blocked)delete sg.boostPad;}
      const solid=segs.slice(Math.max(0,i-1),Math.min(nRace,i+2)).flatMap(q=>q.props.filter(p=>!p.decor&&!['oil','banana'].includes(p.type)));
      sg.props=sg.props.filter(p=>!['oil','banana'].includes(p.type)||!solid.some(o=>Math.abs(o.x-p.x)<(o.r||1)+(p.r||1)+.5));
      sg.boxes=sg.boxes.filter(b=>!solid.some(o=>Math.abs(o.x-b.x)<(o.r||1)+1));
    }
    track.walkers=segs.flatMap(s=>s.props.filter(p=>p.type==='cow'&&p.walk));
    track.cows=segs.flatMap(s=>s.props.filter(p=>p.type==='cow').map(cow=>({cow,z:s.z+SEG/2})));
    return track;
  };
})(window.SK);
