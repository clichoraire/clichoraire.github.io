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

  SK.buildTrack = function (course, seed, opts) {
    // Dedicated jumping lesson; do not alter the regular Sunset Rock course.
    if(opts?.rockBarriers)course={...course,surface:'stone',sections:[
      {t:'s',n:100,w:4.2,boxes:'b',coins:4},
      {t:'s',n:100,w:3.8,boxes:'b',coins:4},
      {t:'s',n:100,w:3.4,boxes:'b',coins:4}
    ]};
    if(opts?.edgeLesson){
      const width=4.6-.3*(opts.edgeLesson-1);
      course={...course,surface:'snow',sections:[{t:'s',n:30,w:width,boxes:'b'},
        ...[-1,1,0,-1,1,0,1,-1,0,-1,1,0].map((dir,i)=>({t:dir?'c':'s',n:dir?(i%2?18:12):12,c:dir*(.055+.01*(opts.edgeLesson-1)),w:width,boxes:i%3===0?'b':undefined}))]};
    }
    const rng = SK.rng(seed || 7), theme = SK.THEMES[course.theme];
    const segs = []; let y = 0, surface = course.surface || 'snow', tunnel = false, prevW = opts?.rockBarriers ? 4.2 : opts?.edgeLesson ? (4.6-.3*(opts.edgeLesson-1)) : 12;
    const ease = (a, b, p) => a + (b - a) * (1 - Math.cos(Math.min(1, Math.max(0, p)) * Math.PI)) / 2;
    const push = (curve, w, dy, sec) => {
      const i = segs.length, s = { i, z: i * SEG, y1: y, y2: y + dy, curve, w, surface, tunnel, ramp: false, jump: false, props: [], boxes: [], coins: [], sec };
      y += dy; segs.push(s); return s;
    };
    const base = -SK.SLOPE * SEG;
    for (const sec of course.sections) {
      if (sec.t === 'x') { surface = sec.s; continue; }
      if (sec.t === 'tunnel') { tunnel = !!sec.on; continue; }
      const n = sec.n, w = sec.w || prevW, start = segs.length, trans = Math.min(n, 12);
      for (let k = 0; k < n; k++) {
        const ww = ease(prevW, w, k / trans); let curve = 0, dy = base;
        if (sec.t === 'c') { const q = n / 4; curve = sec.c * (k < q ? ease(0, 1, k / q) : k > 3 * q ? ease(1, 0, (k - 3 * q) / q) : 1); }
        if (sec.t === 'b') { const f = kk => sec.a * Math.sin(2 * Math.PI * kk * 3 / n); dy += f(k + 1) - f(k); }
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
      const dense=course.forestLevel===3;
      for(let i=28;i<nRace-25;i++){
        const s=segs[i],half=dense?3.2+3.3*(.5+.5*Math.sin(i*.032)):5.2;
        const center=Math.sin(i*.022)*Math.max(0,s.w-half-2.5);
        s.forestPath={center,half};
        // Une voie continue reste libre, même sous les garnitures originales.
        s.props=s.props.filter(p=>p.decor||Math.abs(p.x-center)>half+p.r+.7);
        for(const c of s.coins)c.x=center;
        for(const b of s.boxes)b.x=center+(b.kind==='red'?-1:1);
        if(s.ramp||i%(dense?3:5))continue;
        for(const side of [-1,1]){
          for(let x=center+side*(half+1.9);Math.abs(x)<s.w-1;x+=side*3.4)s.props.push({type:'pine',x,r:1.2,decor:false,v:rng()});
          for(let row=0;row<(dense?3:2);row++)s.props.push({type:'pine',x:side*(s.w+2+row*4+rng()),r:0,decor:true,v:.6+rng()*.4});
        }
      }
    }
    if(opts?.rockBarriers){
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
    if (opts && opts.slalom) { let k = 0; for (let i = 24; i < nRace - 24; i += 14) { const s = segs[i]; if (s.ramp) continue; const x = (k % 2 ? 1 : -1) * s.w * 0.42, col = k % 2 ? '#1e88e5' : '#e53935'; s.gate = { x, w: 3.2, color: col, n: k }; s.props.push({ type: 'flag', x: x - 3.2, r: 0, decor: true, color: col }, { type: 'flag', x: x + 3.2, r: 0, decor: true, color: col }); gates.push(s); k++; } }
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
    track.snowGuards=[];
    if(course.snowGuards)for(let i=65;i<nRace-35;i+=course.guardSpacing||(course.forestLevel===3?65:100)){const s=segs[i];if(s.ramp)continue;const side=track.snowGuards.length%2?1:-1;
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
    return track;
  };
})(window.SK);
