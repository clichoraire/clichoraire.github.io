// Snow Kids — mode Aventure : écran de choix du personnage (les Kids alignés sur la neige) et le village,
// avec une rue nordique à défilement horizontal et six adresses accessibles au clavier ou au clic.
(function (SK) {
  'use strict';
  const R = SK.Render, TAU = Math.PI * 2;
  const T = SK.Town = {};
  // Faux coureur pour dessiner un personnage hors course
  SK.fakeRacer = function (charId, boardId, state, look) { return { def: SK.charById(charId) || SK.VILLAGERS.find(v=>v.id===charId) || SK.CHARACTERS[0], board: SK.boardById(boardId), look: look || null, fx: { parachute: 0, fan: 0, invisible: 0, slow: 0, snowman: 0 }, state: state || 'ride', h: 0, vy: 0, input: { steer: 0, down: false, up: false }, curTrick: null, flat: 0, ctrl: 'cpu', player: -1, pose: 'preview' }; };

  T.HOUSES = [
    {id:'gym',name:'Gym',desc:'Parler à la coach et améliorer tes statistiques.'},
    { id: 'lift', name: 'Tournoi', desc: 'Choisir une piste et partir en course.', angle: 0 },
    { id: 'shop', name: 'Boutique de planches', desc: 'Planches, équipement et gadgets.', angle: 60 },
    { id: 'clothes', name: 'Boutique de vêtements', desc: 'Choisir et acheter des vêtements.', angle: 75 },
    { id: 'ecole', name: 'École', desc: 'Pratiques et missions : slalom, figures, tir, pièces…', angle: 120 },
    { id: 'kids', name: 'Chalet', desc: 'Changer de personnage.', angle: 180 },
    { id: 'look', name: 'Garde-robe', desc: 'Choisir et essayer tes vêtements.', angle: 240 },
    { id: 'trophees', name: 'Musée', desc: 'Tes trophées, tes records et ta tirelire.', angle: 300 },
  ];
  let raf = 0, keyHandler = null, keyUpHandler = null, blurHandler = null, clickHandler = null, canvas = null, selectCleanup=null;
  function stop() { T.paused=false;SK.Audio.stopSanta?.();if(SK.TownSurprises){SK.TownSurprises.santaPosition=null;SK.TownSurprises.santaGreetingUntil=0;} if(selectCleanup){selectCleanup();selectCleanup=null;} if (keyUpHandler) window.removeEventListener('keyup', keyUpHandler); if (blurHandler) window.removeEventListener('blur', blurHandler); keyUpHandler = blurHandler = null; cancelAnimationFrame(raf); raf = 0; if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; } if (clickHandler && canvas) { canvas.removeEventListener('click', clickHandler); clickHandler = null; } }
  T.close = stop;

  // décor commun : ciel, montagnes, neige
  function scene(ctx, W, H, t, horizon) {
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#66b5e5');sky.addColorStop(.6,'#d5eefa');sky.addColorStop(1,'#f4fbff');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    oval(ctx,W*.84,H*.19,40,40,'#fff5c7');oval(ctx,W*.84,H*.19,58,58,'#fff8d42a');
    // Chaînes irrégulières superposées : versants éclairés et neige suivant les crêtes.
    for(let layer=0;layer<3;layer++){
      const base=horizon+layer*27,peaks=layer===0?[[0,.35],[.11,.08],[.22,.31],[.34,.02],[.49,.28],[.63,.07],[.78,.30],[.91,.04],[1.05,.29]]:[[0,.4],[.16,.18],[.29,.38],[.43,.13],[.58,.36],[.73,.19],[.89,.40],[1.04,.21]];
      const points=peaks.map(([x,y])=>[x*W,base-(.48-y)*H*(1-layer*.20)]);
      polygon(ctx,[[0,base+55],...points,[W,base+55]],['#a2c2d9','#759dbb','#5c87a8'][layer]);
      for(let i=1;i<points.length-1;i+=2){const [x,y]=points[i],l=points[i-1],r=points[i+1];
        const lx=x+(l[0]-x)*.55,ly=y+(l[1]-y)*.55,rx=x+(r[0]-x)*.58,ry=y+(r[1]-y)*.58;
        polygon(ctx,[[lx,ly],[x,y],[rx,ry],[x+(rx-x)*.48,ry-12],[x+14,y+35],[x-9,y+62],[x-24,y+44]],'#f3f9fd');
        polygon(ctx,[[x,y],[rx,ry],[x+(rx-x)*.48,ry-12],[x+14,y+35]],'#c6dce9');
      }
    }
    ctx.fillStyle='#edf6fc';ctx.beginPath();ctx.moveTo(0,horizon+40);ctx.bezierCurveTo(W*.3,horizon-10,W*.6,horizon+90,W,horizon+15);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    for(let i=0;i<15;i++){const x=i*W/14+Math.sin(i*3)*16,y=horizon+40+Math.sin(i)*12,h=38+(i%4)*9;
      oval(ctx,x,y+3,h*.28,5,'#bdcfd8');ctx.fillStyle='#695341';ctx.fillRect(x-3,y-h*.3,6,h*.3);
      for(let j=0;j<3;j++){const top=y-h+j*h*.2,width=h*(.23+j*.08);polygon(ctx,[[x,top],[x+width,top+h*.48],[x-width,top+h*.48]],j%2?'#346e61':'#285b52');polygon(ctx,[[x,top],[x+width*.79,top+h*.37],[x+width*.25,top+h*.32],[x-width*.3,top+h*.38],[x-width*.78,top+h*.37]],'#f5fbff');}}

    ctx.fillStyle='#ffffffb0';for(let i=0;i<55;i++){const x=(i*97+t*12)%W,y=(i*73+t*18)%H;ctx.beginPath();ctx.arc(x,y,1+i%2,0,TAU);ctx.fill();}

  }

  function selectionChalet(c,W,H,t){
    c.fillStyle='#785032';c.fillRect(0,0,W,H);
    for(let y=0;y<H*.69;y+=H*.065){c.fillStyle=y%(H*.13)<H*.065?'#875b3b':'#815437';c.fillRect(0,y,W,H*.061);c.fillStyle='#b37e4b35';c.fillRect(W*.02,y+H*.012,W*.95,2);}
    c.fillStyle='#49301f';for(const x of [.025,.32,.67,.96])c.fillRect(W*x,0,W*.025,H*.7);c.fillRect(0,H*.12,W,H*.035);
    for(const x of [.09,.73]){const wx=W*x,wy=H*.22,ww=W*.18,wh=H*.30;c.fillStyle='#34271f';c.fillRect(wx-10,wy-10,ww+20,wh+20);const sky=c.createLinearGradient(0,wy,0,wy+wh);sky.addColorStop(0,'#66afe0');sky.addColorStop(1,'#d2edfc');c.fillStyle=sky;c.fillRect(wx,wy,ww,wh);c.fillStyle='#f2f9ff';c.beginPath();c.moveTo(wx,wy+wh);c.lineTo(wx,wy+wh*.72);c.lineTo(wx+ww*.4,wy+wh*.25);c.lineTo(wx+ww*.7,wy+wh*.7);c.lineTo(wx+ww,wy+wh*.45);c.lineTo(wx+ww,wy+wh);c.fill();c.fillStyle='#58422d';c.fillRect(wx+ww*.48,wy,ww*.04,wh);c.fillRect(wx,wy+wh*.48,ww,wh*.04);c.fillStyle='#bc8d55';c.fillRect(wx-17,wy+wh,ww+34,12);}
    // Foyer de pierre au centre, sous une poutre de cheminée.
    const fx=W*.41,fy=H*.33,fw=W*.18,fh=H*.35;c.fillStyle='#77736c';c.fillRect(fx,fy,fw,fh);c.strokeStyle='#514f4b';c.lineWidth=3;for(let row=0;row<5;row++){const yy=fy+row*fh/5;c.beginPath();c.moveTo(fx,yy);c.lineTo(fx+fw,yy);c.stroke();for(let col=0;col<3;col++){const xx=fx+((col+(row%2)*.5)/3)*fw;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx,yy+fh/5);c.stroke();}}
    c.fillStyle='#251d1b';c.beginPath();c.roundRect(fx+fw*.18,fy+fh*.4,fw*.64,fh*.6,[fw*.25,fw*.25,0,0]);c.fill();c.fillStyle='#483020';c.fillRect(fx-14,fy-10,fw+28,20);
    for(let i=0;i<5;i++){const xx=fx+fw*(.28+i*.11),yy=fy+fh*.9;c.fillStyle=i%2?'#ffc54f':'#e97730';c.beginPath();c.moveTo(xx-fw*.06,yy);c.quadraticCurveTo(xx-fw*.07,yy-fh*.2,xx+Math.sin(t*3+i)*fw*.025,yy-fh*(.24+.04*Math.sin(t*4+i)));c.quadraticCurveTo(xx+fw*.09,yy-fh*.1,xx+fw*.06,yy);c.fill();}
    c.fillStyle='#a4774a';c.fillRect(0,H*.69,W,H*.31);c.strokeStyle='#6e4d32';c.lineWidth=2;for(let i=-3;i<15;i++){c.beginPath();c.moveTo(W*.5+(i-6)*W*.07,H*.69);c.lineTo((i-3)*W*.15,H);c.stroke();}for(const y of [.76,.86,.98]){c.beginPath();c.moveTo(0,H*y);c.lineTo(W,H*y);c.stroke();}
    c.fillStyle='#623b37';c.beginPath();c.ellipse(W*.5,H*.80,W*.46,H*.095,0,0,Math.PI*2);c.fill();c.strokeStyle='#d2a76a';c.lineWidth=4;c.beginPath();c.ellipse(W*.5,H*.80,W*.44,H*.082,0,0,Math.PI*2);c.stroke();
  }

  // ------------------------------------------------------------------ choix du personnage
  // opts : { canvas, unlocked (Shinobin ?), current, onPick(charId), onBack, info(el) }
  T.select = function (opts) {
    stop(); canvas = opts.canvas; const ctx = canvas.getContext('2d');let W=1280,H=800;
    const viewport=document.getElementById('adv-viewport'),room=document.getElementById('adv-room');
    const resize=()=>{W=Math.max(1280,list.length*166+280,Math.round(viewport.clientWidth/Math.max(1,viewport.clientHeight)*800));H=800;room.style.width=Math.max(viewport.clientWidth,viewport.clientHeight*W/H)+'px';canvas.width=W;canvas.height=H;document.getElementById('adv-scroll-hint').hidden=room.offsetWidth<=viewport.clientWidth+1;};
    const allKids=SK.CHARACTERS.filter(c=>opts.save?SK.characterUnlocked(c,opts.save):!c.hidden||(c.id==='shinobin'&&opts.unlocked));let list=[...allKids];
    const names=document.getElementById('adv-names');names.replaceChildren(...list.map(c=>{const el=document.createElement('span');el.textContent=c.name;return el;}));
    let idx = Math.max(0, list.findIndex(c => c.id === opts.current)), bounce = 0, hover=-1, waving=false;
    let selectionBlend=list.map((_,i)=>i===idx?1:0);let lastSelectionFrame=performance.now();
    const positions=()=>list.map((c,i)=>W/2+(i-(list.length-1)/2)*166);
    const reveal=()=>{const x=positions()[idx]/W*room.offsetWidth;viewport.scrollTo({left:Math.max(0,x-viewport.clientWidth/2),behavior:'auto'});};
    const update = () => { resize();reveal();if (opts.onChange) opts.onChange(list[idx]); };
    keyHandler = e => {
      if(e.target.closest?.('select,button'))return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { idx = (idx + list.length - 1) % list.length; bounce = 1; waving=true; update(); SK.Audio.sfx('click'); e.preventDefault(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { idx = (idx + 1) % list.length; bounce = 1; waving=true; update(); SK.Audio.sfx('click'); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'KeyX' || e.code === 'Space') { e.preventDefault(); opts.onPick(list[idx].id); }
      else if (e.code === 'Escape') { if (opts.onBack) opts.onBack(); }
    };
    window.addEventListener('keydown', keyHandler);
    const hit=e=>{const box=canvas.getBoundingClientRect(),mx=(e.clientX-box.left)*W/box.width,my=(e.clientY-box.top)*H/box.height;
      return positions().findIndex((x,i)=>{const c=list[i],size=SK.characterScale(c.id);return Math.abs(mx-x)<58&&my>H*.80-190*size&&my<H*.82;});};
    const move=e=>{hover=hit(e);canvas.style.cursor=hover>=0?'pointer':'default';};
    const leave=()=>{hover=-1;canvas.style.cursor='default';};
    clickHandler=e=>{const found=hit(e);if(found<0)return;idx=found;waving=true;bounce=1;update();SK.Audio.sfx('click');};
    canvas.addEventListener('click',clickHandler);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);
    const chooser=document.createElement('div');chooser.className='family-chooser';chooser.style.cssText='position:absolute;right:2%;top:15%;z-index:4;display:flex;gap:8px;align-items:center';
    const select=document.createElement('select');select.setAttribute('aria-label','Choisir une famille');select.add(new Option('Toutes les familles',''));
    for(const family of new Set(allKids.map(c=>c.family).filter(Boolean)))select.add(new Option('Famille '+family,family));
    select.onchange=()=>{const current=list[idx]?.id;list=allKids.filter(c=>!select.value||c.family===select.value);idx=Math.max(0,list.findIndex(c=>c.id===current));selectionBlend=list.map((_,i)=>i===idx?1:0);names.replaceChildren(...list.map(c=>{const el=document.createElement('span');el.textContent=c.name;return el;}));update();};
    chooser.append(select);for(const [label,dir] of [['←',-1],['→',1]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',dir<0?'Personnage précédent':'Personnage suivant');b.onclick=()=>{idx=(idx+list.length+dir)%list.length;waving=true;update();};chooser.append(b);}
    if(allKids.some(c=>c.custom))viewport.parentElement.append(chooser);
    const observer=new ResizeObserver(()=>{resize();reveal();});observer.observe(viewport);
    selectCleanup=()=>{chooser.remove();observer.disconnect();canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);canvas.style.cursor='default';};
    update();
    const frame = () => {
      raf = requestAnimationFrame(frame); const t = performance.now() / 1000, horizon = H * 0.48;
      selectionChalet(ctx,W,H,t);

      const now=performance.now(),dt=Math.min(.05,(now-lastSelectionFrame)/1000);lastSelectionFrame=now;
      bounce = Math.max(0, bounce - dt*2.4);
      positions().forEach((x, i) => {
        if(!Number.isFinite(x)){names.children[i].hidden=true;return;}
        const c=list[i],sel=i===idx;selectionBlend[i]+=(Number(sel)-selectionBlend[i])*(1-Math.exp(-10*dt));const emphasis=selectionBlend[i],s=60+18*emphasis;
        const y=H*.80-emphasis*6;
        if(emphasis>.01||hover===i){const radius=s*SK.characterScale(c.id)*.60;ctx.save();ctx.globalAlpha=hover===i?1:emphasis;ctx.fillStyle=sel?'rgba(255,219,92,.14)':'rgba(100,213,255,.12)';ctx.strokeStyle=sel?'#ffe17c':'#98e7ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y+4,radius,radius*.25,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore();}
        const fr=SK.fakeRacer(c.id,'freestyle','ride',opts.lookFor?opts.lookFor(c.id):null);fr.wave=sel&&waving;
        ctx.save();ctx.globalAlpha=1;R.drawWalker(ctx,fr,x,y,s,t,'down',false);ctx.restore();
        const factor=SK.characterScale(c.id);
        const head=y-s*2.5*factor;
        const label=names.children[i];label.hidden=sel;label.style.left=(x/W*100)+'%';label.style.top=((head-15)/H*100)+'%';
        if(sel&&opts.info){opts.info.style.left=(x/W*100)+'%';opts.info.style.top=(head/H*100)+'%';}

      });

    };
    frame();
  };

  // Une rue continue : trois façades environ par écran, caméra suivant le Kid.
  const STREET = [
    { id: 'kids', color: '#513323', roof: '#302922', label: 'CHALET' },
    { id: 'shop', color: '#b47449', roof: '#854e46', label: 'BOUTIQUE' },
    { id: 'lift', color: '#527c89', roof: '#365463', label: 'TOURNOI' },
    { id: 'ecole', color: '#b76c60', roof: '#445e73', label: 'ÉCOLE' },
    { id: 'look', color: '#9a7081', roof: '#654c68', label: 'GARDE-ROBE' },
    { id: 'trophees', color: '#8e969d', roof: '#59636d', label: 'MUSÉE' },
  ].map((b,i)=>({...b,x:180+i*650,y:548,w:350,h:335+(i%2)*18}));
  Object.assign(STREET.find(b=>b.id==='kids'),{x:150,w:430});
  STREET.splice(STREET.findIndex(b=>b.id==='lift'),1);
  // Two adjoining shops share a party wall, but keep their own doors and identity.
  Object.assign(STREET.find(b=>b.id==='shop'),{x:700,w:330,h:330,label:'PLANCHES',door:.16});
  STREET.push({id:'clothes',x:1030,y:548,w:330,h:350,color:'#698c83',roof:'#51445b',label:'VÊTEMENTS',door:.84});
  STREET.push({id:'gym',x:3970,y:548,w:490,h:300,color:'#778c82',roof:'#344c52',label:'GYM',door:257.25/490});
  T.streetDoor=b=>b.x+b.w*(b.door??.535);
  T.STREET=STREET;
  T.drawTournamentSign=(ctx,t)=>{
    ctx.save();ctx.translate(26,275+Math.sin(t*1.8)*7);
    const points=[[0,55],[67,0],[67,27],[155,27],[155,83],[67,83],[67,110]];
    ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.shadowColor='#ffba3266';ctx.shadowBlur=20;ctx.fillStyle='#bd353e';ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#6b2e28';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#ffc954';ctx.lineWidth=3;ctx.stroke();
    let bulb=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/17);
      for(let j=0;j<steps;j++){const x=a[0]+(b[0]-a[0])*j/steps,y=a[1]+(b[1]-a[1])*j/steps,on=(bulb++ +Math.floor(t*5))%4!==0;
        ctx.shadowColor='#ffe28b';ctx.shadowBlur=on?13:0;ctx.fillStyle=on?'#fff5bd':'#b98b45';ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();
      }}
    ctx.shadowBlur=0;ctx.fillStyle='#ffdf56';ctx.beginPath();ctx.moveTo(23,55);ctx.lineTo(62,23);ctx.lineTo(62,44);ctx.lineTo(137,44);ctx.lineTo(137,66);ctx.lineTo(62,66);ctx.lineTo(62,87);ctx.closePath();ctx.fill();
    ctx.font='24px "Titan One", "Arial Black", sans-serif';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#65372b';ctx.strokeText('TOURNOI',78,145);
    ctx.fillStyle='#fff2b0';ctx.fillText('TOURNOI',78,145);ctx.restore();
  };
  T.setDebug=on=>{const i=STREET.findIndex(b=>b.id==='debug');if(on&&i<0){STREET.push({id:'debug',x:4550,y:548,w:260,h:300,color:'#615549',roof:'#342f2c',label:'CABANE',door:.535});T.HOUSES.push({id:'debug',name:'Cabane de debug'});}if(!on&&i>=0){STREET.splice(i,1);T.HOUSES=T.HOUSES.filter(h=>h.id!=='debug');}};
  const WORLD_WIDTH=4860;
  function polygon(ctx, points, color) {
    ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
  }
  function oval(ctx,x,y,rx,ry,color) { ctx.fillStyle=color; ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill(); }
  function winterStreet(ctx,t,camera) {
    const sky=ctx.createLinearGradient(0,0,0,370);sky.addColorStop(0,'#3974a1');sky.addColorStop(1,'#c6e3ef');ctx.fillStyle=sky;ctx.fillRect(0,0,1280,720);
    oval(ctx,1040,112,43,43,'#f9f2ce');
    ctx.save();ctx.translate(-camera*.025,0);ctx.scale(1.08,1);
    // Massifs du nord, grands sommets enneigés et versants bleus.
    polygon(ctx,[[0,255],[120,98],[225,206],[366,58],[503,242],[665,112],[810,245],[988,49],[1160,219],[1280,135],[1280,390],[0,390]],'#759bb9');
    for(const [x,y,w] of [[120,98,180],[366,58,250],[665,112,220],[988,49,300],[1280,135,210]]) {
      polygon(ctx,[[x-w/2,y+190],[x,y],[x+w/2,y+190],[x+18,y+117]],'#dcecf4');
      polygon(ctx,[[x,y],[x+17,y+80],[x+43,y+69],[x+w/2,y+190],[x+18,y+117]],'#9ebed5');
      polygon(ctx,[[x-48,y+73],[x,y],[x+55,y+80],[x+13,y+61],[x-4,y+83],[x-18,y+57]],'#fffaf0');
    }
    polygon(ctx,[[0,301],[125,253],[260,305],[455,246],[650,300],[850,258],[1060,294],[1280,245],[1280,410],[0,410]],'#789da9');
    ctx.restore();
    ctx.fillStyle='#e4eff5';ctx.fillRect(0,355,1280,365);
    for(let i=0;i<24;i++) {const x=i*57;R.drawProp(ctx,'fir',x,355+(i%3)*7,11+(i%4)*2,0,t,{});}
    SK.TownSurprises?.background(ctx,t,camera);
    // Trottoir enneigé et promenade horizontale devant les maisons.
    ctx.fillStyle='#f6fbff';ctx.fillRect(0,530,1280,35);
    ctx.fillStyle='#adc8d8';ctx.fillRect(0,565,1280,5);
    ctx.fillStyle='#d1e2ec';ctx.fillRect(0,570,1280,112);
    ctx.fillStyle='#f6fbff';ctx.fillRect(0,682,1280,38);
    ctx.strokeStyle='#bfd5e2';ctx.lineWidth=2;
    for(let x=-(camera%100);x<1280;x+=100){ctx.beginPath();ctx.moveTo(x,570);ctx.lineTo(x-35,682);ctx.stroke();}

  }
  function drawStorefront(c,b,selected){
    const {x,y,w,h}=b,top=y-h,clothes=b.id==='clothes';
    const rect=(a,z,ww,hh,color)=>{c.fillStyle=color;c.fillRect(a,z,ww,hh);};
    const trim=clothes?'#e9dcc8':'#483021',wall=clothes?'#63867c':'#8c5738';
    // Boutique de sport en bois rustique, boutique de linge en lambris sauge.
    rect(x,top,w,h,wall);
    if(clothes){for(let a=x+12;a<x+w;a+=22){rect(a,top,2,h,'#365f5860');rect(a+3,top,1,h,'#ffffff20');}}
    else for(let z=top+12;z<y;z+=24){rect(x,z,w,3,'#543523');rect(x+8,z+5,w-16,2,'#ce9b6250');}
    rect(x,top,9,h,trim);rect(x+w-9,top,9,h,trim);
    if(clothes){
      polygon(c,[[x,top],[x+42,top-60],[x+w-42,top-60],[x+w,top]],'#51445b');
      polygon(c,[[x-3,top-4],[x+39,top-68],[x+w-39,top-68],[x+w+3,top-4],[x+w-5,top+4],[x+w-44,top-57],[x+46,top-57],[x+5,top+4]],'#f3faff');
    }else{
      polygon(c,[[x-12,top],[x+w*.5,top-85],[x+w,top]],'#4c3026');
      polygon(c,[[x-16,top-3],[x+w*.5,top-94],[x+w+3,top-5],[x+w,top+6],[x+w*.5,top-81],[x-10,top+9]],'#f4fbff');
    }
    // Lettered signs, distinct awnings, a generous shop window and adult-height door.

    const doorX=T.streetDoor(b)-34,doorY=y-188;
    SK.TownArchitecture?.plaque(c,b,doorX-8,doorY-63,84);
    rect(doorX-6,doorY-7,80,195,selected?'#ffdc77':trim);rect(doorX,doorY,68,188,clothes?'#345d58':'#4a3429');
    rect(doorX+8,doorY+12,52,116,'#add4db');rect(doorX+12,doorY+16,5,106,'#e9faf688');
    oval(c,doorX+55,y-36,4,4,'#f5c86d');rect(doorX-12,y,92,8,'#c8dce5');
    const wx=clothes?x+22:x+102,wy=top+91,ww=w-124,wh=y-wy-28;
    rect(wx-7,wy-7,ww+14,wh+14,trim);
    const glass=c.createLinearGradient(0,wy,0,wy+wh);glass.addColorStop(0,clothes?'#eddcc7':'#c6e6ec');glass.addColorStop(1,clothes?'#b98e6c':'#75a5b1');c.fillStyle=glass;c.fillRect(wx,wy,ww,wh);
    c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();
    rect(wx,wy+wh-20,ww,20,clothes?'#765244':'#4e6563');
    if(clothes){
      for(const [a,color] of [[.27,'#1e88e5'],[.73,'#fb8c00']]){const xx=wx+ww*a;rect(xx-3,wy+33,6,20,'#584b43');oval(c,xx,wy+35,5,5,'#d9c9ae');SK.drawJacket(c,color,xx,wy+100,43);}
      if(SK.Shop)SK.Shop.drawItem(c,{kind:'gear',id:'lunettesNeige'},wx+ww*.5,wy+wh-32,25,0);
    }else if(SK.Shop){
      ['freestyle','fusee','virage'].forEach((id,i)=>{const board=SK.boardById(id);if(board){c.save();c.translate(wx+ww*(.19+i*.31),wy+wh-22-52*1.15);c.rotate((i-1)*.07);SK.Shop.drawItem(c,{kind:'board',id,color:board.color},0,0,52,0,true);c.restore();}});
    }
    // Light reflections stay translucent so every displayed object remains visible.
    polygon(c,[[wx+12,wy],[wx+35,wy],[wx+ww-15,wy+wh],[wx+ww-40,wy+wh]],'#ffffff30');
    polygon(c,[[wx+ww-30,wy],[wx+ww-16,wy],[wx+26,wy+wh],[wx+12,wy+wh]],'#ffffff16');c.restore();
    rect(wx-11,wy+wh+7,ww+22,8,trim);rect(wx-13,wy+wh+15,ww+26,6,'#f2faff');
    const awningY=top+69,backLeft=wx-13,backWidth=ww+26,frontLeft=wx-20,frontWidth=ww+40;
    // The stripes follow the sloping fabric and continue over its hanging edge.
    // A soft cast shadow falls on the glass, separate from the fabric's shading.
    const shadow=c.createLinearGradient(0,awningY+30,0,awningY+57);shadow.addColorStop(0,'#19354255');shadow.addColorStop(1,'#19354200');
    rect(wx,awningY+34,ww,23,shadow);
    for(let i=0;i<7;i++){
      const a=backLeft+i*backWidth/7,b=a+backWidth/7,u=frontLeft+i*frontWidth/7,v=u+frontWidth/7;
      const fabric=c.createLinearGradient(0,awningY,0,awningY+24);
      fabric.addColorStop(0,i%2?'#e7dfcd':clothes?'#a8677d':'#366477');fabric.addColorStop(1,i%2?'#f5eedb':clothes?'#b67b8d':'#45798a');
      polygon(c,[[a,awningY],[b,awningY],[v,awningY+24],[u,awningY+24]],fabric);
      const hem=c.createLinearGradient(0,awningY+24,0,awningY+36);hem.addColorStop(0,i%2?'#e4dcc6':clothes?'#95566c':'#305f70');hem.addColorStop(1,i%2?'#eee6d1':clothes?'#a36278':'#396e7c');
      rect(u,awningY+24,frontWidth/7+.2,12,hem);
      c.strokeStyle='#fff9e91c';c.lineWidth=.7;c.beginPath();c.moveTo(a+.7,awningY+2);c.lineTo(u+.7,awningY+24);c.lineTo(u+.7,awningY+34);c.stroke();
    }
    rect(frontLeft,awningY+24,frontWidth,1,'#fbf8e919');
    oval(c,x+20,y+7,30,10,'#f4faff');oval(c,x+w-20,y+7,30,10,'#f4faff');
    if(selected)polygon(c,[[T.streetDoor(b),doorY-12],[T.streetDoor(b)-9,doorY-26],[T.streetDoor(b)+9,doorY-26]],'#ffce59');
  }
  // Log chalet: a single facade, warm windows and stone chimney, like the village reference.
  function drawLogChalet(c,b,t,selected){
    const {x,y,w,h}=b,top=y-h;
    c.save();c.translate(x,top);c.scale(w/350,h/335);
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    const box=(x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
    // Stone chimney rises behind the right eave.
    box(348,-76,42,408,3,'#817e6a');
    c.save();c.beginPath();c.rect(350,-75,38,405);c.clip();
    for(let row=0;row<25;row++)for(let col=0;col<3;col++){
      const xx=347+col*17+(row%2?8:0),yy=-72+row*17;
      polygon(c,[[xx+3,yy],[xx+14,yy+1],[xx+17,yy+8],[xx+12,yy+16],[xx+2,yy+14],[xx-2,yy+7]],['#6f715f','#99927a','#85836c'][(row+col)%3]);
      c.strokeStyle='#b0a389';c.lineWidth=1;c.stroke();
    }c.restore();
    box(344,-84,50,12,2,'#aaa691');box(344,-88,51,5,2,'#edf5f1');
    polygon(c,[[346,131],[362,129],[373,132],[391,129],[391,134],[346,135]],'#f2f8f3');
    for(let i=0;i<3;i++){const f=(t*.12+i/3)%1;oval(c,368+f*16,-99-f*45,7+f*12,5+f*7,`rgba(240,248,249,${.18*(1-f)})`);}
    rect(0,10,350,325,'#503822');
    // Rounded logs, shallow grain and circular end cuts at each corner.
    for(let row=0;row<15;row++){
      const yy=12+row*22;
      const g=c.createLinearGradient(0,yy,0,yy+21);g.addColorStop(0,'#a37a49');g.addColorStop(.25,'#89613b');g.addColorStop(.68,'#775232');g.addColorStop(1,'#513820');
      box(-4,yy,358,20,8,g);rect(7,yy+18,336,3,'#3c2a1d88');
      c.strokeStyle='#4e34274d';c.lineWidth=1.3;c.beginPath();c.moveTo(14,yy+11);c.bezierCurveTo(95,yy+6+(row%3),186,yy+17,337,yy+9);c.stroke();
      c.strokeStyle='#c99a5c44';c.lineWidth=1;c.beginPath();c.moveTo(24,yy+5);c.quadraticCurveTo(160,yy+2,327,yy+6);c.stroke();
      for(const xx of [0,350]){oval(c,xx,yy+10,9,9,'#947043');c.strokeStyle='#62482e';c.lineWidth=1;c.stroke();c.strokeStyle='#b18a524f';c.beginPath();c.ellipse(xx,yy+10,5.5,6.5,.2,0,TAU);c.stroke();c.beginPath();c.moveTo(xx,yy+4);c.lineTo(xx+2,yy+10);c.lineTo(xx-1,yy+14);c.stroke();}
    }
    // Vertical boards in the gable, shaded beneath a thick rounded snow cap.
    const peak=137,peakY=-86;
    polygon(c,[[-9,10],[peak,peakY],[359,10]],'#785333');
    c.save();c.beginPath();c.moveTo(-9,10);c.lineTo(peak,peakY);c.lineTo(359,10);c.closePath();c.clip();
    for(let xx=0;xx<355;xx+=17){rect(xx,-90,2,110,'#4f3825');rect(xx+3,-90,2,110,'#ad84523d');}
    polygon(c,[[-9,10],[peak,peakY],[359,10],[348,10],[peak,peakY+15],[5,10]],'#3c2b2260');c.restore();
    box(-5,8,360,9,3,'#5c4027');rect(5,9,340,2,'#b68b54');
    polygon(c,[[peak-3,peakY-7],[peak+55,peakY-18],[370,-1],[359,10]],'#d3e5eb');
    c.strokeStyle='#f6fcfc';c.lineWidth=15;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(-17,7);c.lineTo(peak,peakY-7);c.quadraticCurveTo(245,peakY+31,371,8);c.stroke();
    c.strokeStyle='#dcecf1';c.lineWidth=3;c.beginPath();c.moveTo(-18,12);c.lineTo(peak-2,peakY-1);c.stroke();
    for(const wx of [44,218]){
      const wy=33,ww=69,hh=73;rect(wx-6,wy-6,ww+12,hh+12,'#513720');rect(wx-3,wy-3,ww+6,hh+6,'#ad7b45');
      const glow=c.createRadialGradient(wx+ww*.48,wy+hh*.6,3,wx+ww*.5,wy+hh*.5,66);glow.addColorStop(0,'#ffeaa0');glow.addColorStop(.5,'#ffd677');glow.addColorStop(1,'#df9150');rect(wx,wy,ww,hh,glow);
      polygon(c,[[wx,wy],[wx+10,wy],[wx+14,wy+hh],[wx+4,wy+hh]],'#faad7355');polygon(c,[[wx+ww-12,wy],[wx+ww,wy],[wx+ww-2,wy+hh],[wx+ww-16,wy+hh]],'#f49a6944');
      rect(wx+ww/2-3,wy,6,hh,'#785735');rect(wx,wy+hh*.49,ww,5,'#785735');rect(wx-8,wy+hh+3,ww+16,6,'#543a24');
    }
    // Discreet plaque next to the original entrance.
    const dx=350*(b.door??.535)-38,dy=169,dw=76;
    SK.TownArchitecture?.plaque(c,b,dx-111,dy+16);
    rect(dx-8,dy-8,dw+16,174,selected?'#d5b76d':'#503820');rect(dx-4,dy-4,dw+8,170,'#8b633a');rect(dx,dy,dw,166,'#6e4c2b');
    for(const py of [dy+12,dy+94])for(const px of [dx+10,dx+43]){rect(px-2,py-2,25,63,'#4d361f');rect(px,py,21,59,'#99703e');rect(px+3,py+3,17,56,'#72502c');}
    box(dx+dw-13,dy+78,5,18,2,'#bf8c3f');oval(c,dx+dw-10,dy+80,3,3,'#f1c45e');rect(dx-5,334,dw+10,5,'#c7d9dc');
    // Warm little porch lantern.
    const lx=dx+dw+28,ly=dy+17;const halo=c.createRadialGradient(lx,ly+5,2,lx,ly+5,25);halo.addColorStop(0,'#ffdf763f');halo.addColorStop(1,'#ffdf7600');oval(c,lx,ly+5,25,25,halo);
    polygon(c,[[lx-8,ly-8],[lx,ly-18],[lx+8,ly-8]],'#435652');polygon(c,[[lx-6,ly-7],[lx+6,ly-7],[lx+4,ly+10],[lx-4,ly+10]],'#f5d579');c.strokeStyle='#59614e';c.lineWidth=2;c.stroke();
    oval(c,54,338,84,9,'#f7fcff');oval(c,303,338,65,8,'#f7fcff');

    if(selected)polygon(c,[[dx+dw/2,dy-11],[dx+dw/2-8,dy-23],[dx+dw/2+8,dy-23]],'#ffce59');
    c.restore();
  }
  function streetHouse(ctx,b,t,selected) {
    if(SK.TownArchitecture?.draw(ctx,b,t,selected))return;
    baseStreetHouse(ctx,b,t,selected);SK.TownArchitecture?.polish(ctx,b);
  }
  T.drawBuilding=streetHouse;
  function baseStreetHouse(ctx,b,t,selected) {
    if(b.id==='debug'){ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='#51473e';ctx.fillRect(0,-240,b.w,240);polygon(ctx,[[-18,-238],[75,-320],[130,-291],[190,-310],[b.w+15,-238]],'#302d29');ctx.strokeStyle='#292520';ctx.lineWidth=5;for(let y=-215;y<0;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(b.w,y+7);ctx.stroke();}ctx.fillStyle='#181b1d';ctx.fillRect(105,-165,70,165);ctx.fillRect(22,-195,55,65);ctx.save();ctx.translate(48,-165);ctx.rotate(.3);ctx.fillStyle='#917758';ctx.fillRect(-39,-7,78,14);ctx.restore();ctx.fillStyle='#b6a07b';ctx.fillRect(80,-226,145,33);ctx.fillStyle='#322b24';ctx.font='bold 19px Arial';ctx.textAlign='center';ctx.fillText('CABANE',152,-203);ctx.restore();return;}
    const {x,y,w,h}=b, top=y-h, side=x<600?1:-1, depth=w*0.16;
    const rect=(xx,yy,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(xx,yy,ww,hh);};
    oval(ctx,x+w/2,y+8,w*0.62,15,'#acc6d5');
    if(b.id==='kids'){drawLogChalet(ctx,b,t,selected);return;}
    if(b.id==='shop'||b.id==='clothes'){drawStorefront(ctx,b,selected);return;}
    if(b.id==='trophees'){
      rect(x,top,w,h,'#9da3a7');
      for(let row=0;row<Math.ceil(h/24);row++){const yy=top+row*24;rect(x,yy,w,2,'#626c73');for(let xx=x+(row%2?25:0);xx<x+w;xx+=50){rect(xx,yy,2,24,'#68727a');rect(xx+3,yy+3,Math.max(0,Math.min(44,x+w-xx-3)),2,'#c0c5c7');}}
      polygon(ctx,[[x-15,top+8],[x+w/2,top-72],[x+w+15,top+8]],'#777f87');
      polygon(ctx,[[x-19,top+4],[x+w/2,top-81],[x+w+19,top+4],[x+w+10,top+12],[x+w/2,top-66],[x-12,top+13]],'#f5fbff');
      rect(x-8,top+12,w+16,15,'#c2c8cc');rect(x-8,top+27,w+16,5,'#66717a');
      for(const xx of [x+w*.12,x+w*.77]){rect(xx,top+37,w*.11,h-42,'#c0c6ca');rect(xx+5,top+39,4,h-47,'#edf0ef');rect(xx+w*.08,top+39,4,h-47,'#818d94');rect(xx-5,top+30,w*.11+10,10,'#dde1e1');rect(xx-7,y-15,w*.11+14,15,'#b8c1c7');}
      const dx=x+w*.40,dw=w*.26,dy=y-h*.51;
      rect(dx-7,dy-8,dw+14,h*.51+8,selected?'#ffe295':'#606b74');rect(dx,dy,dw,h*.51,'#394b59');rect(dx+8,dy+8,dw-16,25,'#f5cf7b');rect(dx+dw*.5,dy,3,h*.51,'#1f303d');oval(ctx,dx+dw*.77,dy+55,3,3,'#e2b950');
      rect(x+w*.32,y,w*.43,7,'#758793');rect(x+w*.27,y+7,w*.53,7,'#a6b6bf');rect(x+w*.22,y+14,w*.63,7,'#f1f8fb');
      SK.TownArchitecture?.plaque(ctx,b,dx+dw/2-44,dy-65);
      oval(ctx,x+25,y+8,40,12,'#f7fcff');oval(ctx,x+w-18,y+5,36,12,'#f7fcff');
      if(selected)polygon(ctx,[[dx+dw/2,dy-14],[dx+dw/2-9,dy-28],[dx+dw/2+9,dy-28]],'#ffcd58');
      return;
    }

    // Façade, mur latéral fuyant, charpente et épaisse couverture de neige.
    polygon(ctx,[[x+(side>0?w:0),top],[x+(side>0?w+depth:-depth),top-22],[x+(side>0?w+depth:-depth),y-27],[x+(side>0?w:0),y]],b.id==='kids'?'#35251b':'#486474');
    rect(x,top,w,h,b.color);
    if(b.id==='kids'){
      // Rondins sombres, joints creux et grosses poutres d’angle.
      for(let yy=top+8;yy<y;yy+=22){rect(x,yy,w,17,'#65442d');rect(x,yy+16,w,4,'#302218');rect(x+7,yy+2,w-14,2,'#97704a');for(const xx of [x+5,x+w-8])oval(ctx,xx,yy+8,9,8,'#805739');}
      rect(x+16,top,13,h,'#35251b');rect(x+w-29,top,13,h,'#35251b');rect(x,top,w,14,'#302017');
    }

    for(let j=top+14;j<y;j+=18){rect(x,j,w,1,'#ffffff38');rect(x,j+15,w,2,'#24374728');
      ctx.strokeStyle='#19373f12';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+9,j+6);ctx.bezierCurveTo(x+w*.28,j+2,x+w*.67,j+11,x+w-9,j+6);ctx.stroke();}
    const facadeGlow=ctx.createLinearGradient(x,0,x+w,0);facadeGlow.addColorStop(0,'#fff4d416');facadeGlow.addColorStop(.6,'#ffffff00');facadeGlow.addColorStop(1,'#17333f25');rect(x,top,w,h,facadeGlow);
    // Pan du toit en perspective : même fuite que le mur latéral.
    const roofEdge=x+(side>0?w+16:-16),ridge=x+w*.30,ridgeY=top-h*.29,back=side*depth;
    polygon(ctx,[[ridge,ridgeY],[ridge+back,ridgeY-22],[roofEdge+back,top-22],[roofEdge,top+3]],b.id==='kids'?'#49392d':'#4b6576');
    polygon(ctx,[[ridge,ridgeY-9],[ridge+back,ridgeY-31],[roofEdge+back,top-31],[roofEdge,top-6]],'#deedf5');
    polygon(ctx,[[roofEdge,top-6],[roofEdge+back,top-31],[roofEdge+back,top-19],[roofEdge,top+8]],'#b9d2e1');
    ctx.strokeStyle='#f7fcff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(ridge+back,ridgeY-29);ctx.lineTo(roofEdge+back,top-28);ctx.stroke();
    polygon(ctx,[[x-13,top+3],[x+w*.30,top-h*.29],[x+w+13,top+3]],b.roof);
    polygon(ctx,[[x-16,top],[x+w*.30,top-h*.29-9],[x+w+17,top],[x+w+9,top+13],[x+w*.30,top-h*.29+8],[x-10,top+14]],'#f7fcff');
    rect(x+w*.74,top-h*.20, w*.08,h*.22,'#79594e');rect(x+w*.73,top-h*.20-5,w*.10,8,'#f5fbff');
    for(let i=0;i<3;i++){const p=(t*.28+i*.33)%1;oval(ctx,x+w*.78+p*18,top-h*.24-p*52,6+p*12,5+p*9,`rgba(240,248,255,${.3*(1-p)})`);}
    // Fenêtres éclairées, cadres, volets et neige sur les appuis.
    for(const fx of [.13,.61]) {
      const wx=x+w*fx,wy=top+h*.10,ww=w*.23,hh=h*.22;
      rect(wx-8,wy-7,ww+16,hh+16,'#34475466');rect(wx-5,wy-5,ww+10,hh+10,'#f1dfbb');
      const glass=ctx.createLinearGradient(wx,wy,wx+ww,wy+hh);glass.addColorStop(0,'#fff2bd');glass.addColorStop(.6,'#f5cb82');glass.addColorStop(1,'#cf986b');rect(wx,wy,ww,hh,glass);
      polygon(ctx,[[wx,wy],[wx+ww*.16,wy],[wx+ww*.24,wy+hh],[wx+ww*.04,wy+hh]],'#ffffff38');
      for(const side of [-1,1]){const sx=side<0?wx-20:wx+ww+7;rect(sx,wy-1,13,hh+2,b.roof);for(let sy=wy+5;sy<wy+hh;sy+=9)rect(sx+2,sy,9,1,'#e6eddf55');}
      rect(wx+ww*.45,wy,ww*.1,hh,'#856d58');rect(wx,wy+hh*.48,ww,3,'#856d58');rect(wx-7,wy+hh+4,ww+14,7,'#edf7ff');
    }
    const dx=x+w*.43,dy=y-h*.49,dw=w*.21;
    rect(dx-5,dy-5,dw+10,h*.49+5,selected?'#ffe295':'#e4d0aa');rect(dx,dy,dw,h*.49,'#314e60');rect(dx+dw*.14,dy+8,dw*.7,h*.12,'#e6bb74');oval(ctx,dx+dw*.8,dy+h*.22,2,2,'#ffdf81');
    rect(dx-12,y-1,dw+24,6,'#9fb8c5');rect(dx-18,y+5,dw+36,6,'#f7fcff');
    SK.TownArchitecture?.plaque(ctx,b,dx-108,dy+14);
    // Bancs de neige de part et d'autre de la porte, glaçons sous les corniches.
    oval(ctx,x+w*.15,y+4,w*.23,13,'#f6fbff');oval(ctx,x+w*.86,y+3,w*.19,11,'#f6fbff');
    for(let i=0;i<7;i++){const xx=x+12+i*w/7;polygon(ctx,[[xx,top+4],[xx+5,top+5],[xx+2,top+14+(i%3)*5]],'#d9edf7');}
    if(selected){ctx.fillStyle='#ffcd58';ctx.beginPath();ctx.moveTo(dx+dw/2,dy-12);ctx.lineTo(dx+dw/2-8,dy-24);ctx.lineTo(dx+dw/2+8,dy-24);ctx.fill();}
    if(b.id==='shop')for(let i=0;i<3;i++){ctx.save();ctx.translate(x+29+i*18,y-35);ctx.rotate(.15);ctx.fillStyle=['#d85145','#e4bc47','#3e8391'][i];ctx.fillRect(-6,-36,12,66);ctx.fillStyle='#fff';ctx.fillRect(-6,-12,12,4);ctx.restore();}
  }
  function streetLamp(ctx,x,y,s) {
    ctx.fillStyle='#3a5666';ctx.fillRect(x-3*s,y-90*s,6*s,90*s);ctx.fillRect(x-10*s,y-95*s,20*s,5*s);
    oval(ctx,x,y-107*s,23*s,27*s,'#ffdf7c18');ctx.fillStyle='#ffdfa0';ctx.fillRect(x-7*s,y-116*s,14*s,20*s);
    polygon(ctx,[[x-13*s,y-117*s],[x,y-130*s],[x+13*s,y-117*s]],'#f5fbff');oval(ctx,x,y,18*s,5*s,'#f9fcff');
  }
  T.RICHARD_JOKES = [
    ["Mon prof de maths s’est fait arrêter pour meurtre…", "C’était à lui de ne pas laisser de traces de sa démarche !"],
    ["Pourquoi les couples italiens dorment avec deux lits collés ?", "Pour se parler de lit à lit !"],
    ["Quelle est la différence entre Paul Buisson et un buisson ?", "Paul Buisson, c’est un humain… mais pas l’buisson !"],
    ["Comment appelle-t-on un oiseau qui se gratte juste d’un côté ?", "Un oiseau mi-gratteur !"],
    ["Un aveugle entre dans un bar… puis une chaise… puis une table…", "Quelqu’un peut l’aider, le pauvre diable ?!"],
    ["J’ai essayé de faire un jeu de mots avec épicerie…", "Mais ça n’a pas super marché !"],
    ["Pourquoi les plongeurs plongent-ils toujours en arrière ?", "Sinon, ils tombent dans le bateau !"],
    ["Qu’est-ce qu’un canard dit quand il est en retard ?", "Coin ! Coin ! Je suis dans le jus !"],
    ["J’ai raconté une blague à mon frigo…", "Il est resté de glace !"],
    ["Pourquoi les poissons travaillent mal à l’école ?", "Ils passent leur temps à faire des bulles !"],
    ["Quel est le comble pour un électricien ?", "De ne pas être au courant !"],
    ["J’ai voulu raconter une blague sur le papier…", "Mais elle était trop plate !"],
    ["Que dit une noisette quand elle tombe dans l’eau ?", "Je me noix !"],
    ["Pourquoi les squelettes ne se battent jamais ?", "Ils n’ont pas le cœur à ça !"],
    ["J’ai acheté un livre sur les ascenseurs…", "L’histoire a des hauts et des bas !"],
    ["Que dit un citron qui arrive en retard ?", "Désolé, j’étais pressé !"],
    ["Pourquoi le bonhomme de neige fouille dans les carottes ?", "Il cherche son nez !"],
    ["J’ai voulu faire une blague sur les montagnes…", "Mais elle était trop élevée pour moi !"],
    ["Pourquoi les livres ont-ils toujours chaud ?", "Parce qu’ils ont une couverture !"],
    ["Quel est le sport préféré des insectes ?", "Le criquet !"]
  ];
  const richardTargets=new Set(['jeremie','mickael','matthieu','josue']);
  // A shuffled deck survives entering buildings and reloading the game.
  let jokeDeck=[],lastJoke=-1;
  try{const saved=JSON.parse(localStorage.getItem('snowkids-richard-jokes')||'null');
    if(saved&&Array.isArray(saved.deck)&&saved.deck.every(i=>Number.isInteger(i)&&i>=0&&i<T.RICHARD_JOKES.length)&&new Set(saved.deck).size===saved.deck.length){jokeDeck=saved.deck;lastJoke=saved.last;}
  }catch{}
  T.nextRichardJoke=function(){
    if(!jokeDeck.length){jokeDeck=T.RICHARD_JOKES.map((_,i)=>i);for(let i=jokeDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[jokeDeck[i],jokeDeck[j]]=[jokeDeck[j],jokeDeck[i]];}if(jokeDeck.at(-1)===lastJoke)[jokeDeck[0],jokeDeck[jokeDeck.length-1]]=[jokeDeck.at(-1),jokeDeck[0]];}
    lastJoke=jokeDeck.pop();try{localStorage.setItem('snowkids-richard-jokes',JSON.stringify({deck:jokeDeck,last:lastJoke}));}catch{}
    return T.RICHARD_JOKES[lastJoke];
  };
  T.updateRichardChat=function(chat,locals,dt,camera){
    chat.laugh=Math.max(0,(chat.laugh||0)-dt);
    chat.cooldown=Math.max(0,chat.cooldown-dt);
    if(chat.remaining>0){chat.remaining=Math.max(0,chat.remaining-dt);if(chat.remaining===0)chat.laugh=3.5;return;}
    if(chat.laugh>0)return;
    const richard=locals.find(l=>l.r.def.id==='richard');if(!richard)return;
    const rx=richard.group.x+richard.offset;
    const close=locals.filter(l=>richardTargets.has(l.r.def.id)&&Math.abs(l.group.x+l.offset-rx)<110);
    const newArrival=close.find(l=>!chat.near.has(l.r.def.id));chat.near=new Set(close.map(l=>l.r.def.id));
    if(!newArrival||chat.cooldown>0||rx<camera+40||rx>camera+1240)return;
    chat.listener=newArrival;chat.richard=richard;chat.target=newArrival.r.def.name;chat.joke=T.nextRichardJoke();chat.remaining=13;chat.cooldown=30;
    richard.group.conversation=16.5;newArrival.group.conversation=16.5;
  };
  T.drawRichardChat=function(c,chat,camera){
    if(chat.remaining<=0)return;
    const rx=chat.richard.group.x+chat.richard.offset,elapsed=13-chat.remaining;
    const words=(elapsed<2?'Allô mon gars !':elapsed<8?chat.joke[0]:chat.joke[1]).split(' ');
    c.save();c.font='bold 23px "Trebuchet MS",sans-serif';
    const lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(c.measureText(next).width>440&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
    const width=480,height=66+lines.length*29,left=Math.max(camera+18,Math.min(camera+1280-width-18,rx-width/2)),top=365-height;
    c.shadowColor='#0004';c.shadowBlur=12;c.shadowOffsetY=5;c.fillStyle='#fff5d8';c.strokeStyle='#8c653b';c.lineWidth=4;c.beginPath();c.roundRect(left,top,width,height,20);c.fill();c.stroke();c.shadowBlur=0;c.shadowOffsetY=0;
    polygon(c,[[rx-12,365-2],[rx+12,365-2],[rx,382]],'#fff5d8');
    c.textAlign='left';c.fillStyle='#88602e';c.font='bold 17px "Trebuchet MS",sans-serif';c.fillText('Richard · à '+chat.target,left+20,top+28);
    c.fillStyle='#263e50';c.font='bold 23px "Trebuchet MS",sans-serif';lines.forEach((text,i)=>c.fillText(text,left+20,top+61+i*29));c.restore();
  };
  T.drawParentGreeting=function(c,local,childId,camera){
    if(local.group.greeting<=0||local.group.conversation>0||!(SK.PARENTS?.[childId]||[]).includes(local.r.def.id))return;
    const x=local.group.x+local.offset;
    if(x<camera-80||x>camera+1360)return;
    const width=330,left=Math.max(camera+12,Math.min(camera+938,x-width/2));
    // Couples share a greeting window; staggering their bubbles keeps both readable.
    const top=local.offset?274:334;
    c.save();c.fillStyle='#fff0f3';c.strokeStyle='#cc6a86';c.lineWidth=3;c.beginPath();c.roundRect(left,top,width,65,16);c.fill();c.stroke();
    polygon(c,[[x-9,top+64],[x+9,top+64],[x,top+77]],'#fff0f3');
    c.textAlign='center';c.fillStyle='#8b3854';c.font='bold 14px "Trebuchet MS",sans-serif';c.fillText(local.r.def.name,left+width/2,top+22);
    c.fillStyle='#a82e55';c.font='bold 20px "Trebuchet MS",sans-serif';c.fillText(local.r.def.gender==='boy'?'Je t’aime, amuse-toi bien !':'Bonne glisse, mon trésor !',left+width/2,top+50);c.restore();
  };
  T.updateResidentGroup=function(g,playerX,dt){
    if(g.conversation>0){g.conversation=Math.max(0,g.conversation-dt);return;}
    g.cooldown=Math.max(0,g.cooldown-dt);g.greeting=Math.max(0,g.greeting-dt);
    const near=Math.abs(playerX-(g.x+(g.ids.length-1)*38))<135;
    if(near&&!g.near&&g.cooldown===0){g.greeting=2.3;g.cooldown=17.3;}
    g.near=near;
    if(g.greeting>0)return;
    g.x+=g.dir*g.speed*dt;g.walk+=g.speed*dt/120;
    const right=WORLD_WIDTH-110-(g.ids.length-1)*76;
    if(g.x<110){g.x=110;g.dir=1;}else if(g.x>right){g.x=right;g.dir=-1;}
  };
  // Une fouille par banc et par jour, conservée dans l’aventure du personnage.
  T.SNOWBANKS=[610,1450,1720,2490,2730,3150,3760,4380,4620].map((x,i)=>({id:'snow-'+i,x,y:650+(i%2)*18}));
  T.showGoldReward=function(bubble,amount){
    bubble.classList.add('gold-reward');bubble.replaceChildren();
    const reward=document.createElement('span');reward.className='gold-reward-amount';
    const coin=document.createElement('img');coin.src=SK.COIN_SVG;coin.alt='Pièces d’or gagnées';
    const value=document.createElement('strong');value.textContent='+'+amount;reward.append(coin,value);bubble.append(reward);
    const colors=['#ffcf3d','#ff695e','#48c8eb','#8ce58b','#b998f4'];
    for(let i=0;i<24;i++){const p=document.createElement('i'),angle=i*2.39996,distance=55+(i%5)*16;p.className='gold-confetti';p.setAttribute('aria-hidden','true');p.style.setProperty('--dx',Math.cos(angle)*distance+'px');p.style.setProperty('--dy',Math.sin(angle)*distance-35+'px');p.style.setProperty('--spin',(i%2?-1:1)*(160+i*23)+'deg');p.style.setProperty('--delay',(i%4)*.035+'s');p.style.background=colors[i%colors.length];if(i%3===0)p.style.borderRadius='50%';bubble.append(p);}
    bubble.hidden=false;
  };
  T.snowDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
  T.hasShovel=save=>!!save?.gear?.includes('pelle');
  T.buyShovel=function(save){const price=SK.gearById('pelle').price;if(T.hasShovel(save)||!(save.gold>=price))return false;save.gold-=price;(save.gear??=[]).push('pelle');return true;};
  T.digSnow=function(save,id,random=Math.random){
    if(!T.hasShovel(save)||!T.SNOWBANKS.some(b=>b.id===id))return null;
    const day=T.snowDay();if(save.snowDig?.day!==day)save.snowDig={day,found:{}};
    if(Object.hasOwn(save.snowDig.found,id))return null;
    const amount=5+Math.floor(SK.clamp(random(),0,.999999)*16);
    save.snowDig.found[id]=amount;save.gold=(save.gold||0)+amount;return amount;
  };
  function drawVillageSnowman(c,x,y,s,design){SK.Snowman.draw(c,x,y,s,design);}
  function villageDecor(c,save){
    drawVillageSnowman(c,627,551,.84,save?.snowmen?.['chalet']);
    for(const [i,x] of [600,1530,2520,3790,4400].entries()){
      if(i===0)continue; // The widened chalet occupies this former bench space.
      c.save();c.translate(x,535);
      // Lampadaire à lumière chaude et banc de bois coiffé de neige.
      c.fillStyle='#36596b';c.fillRect(-10,-144,7,144);c.fillRect(-20,-4,27,7);
      c.fillStyle='#ffdc83';c.fillRect(-22,-178,31,34);polygon(c,[[-29,-179],[-7,-196],[16,-179]],'#375369');
      c.strokeStyle='#5c3f2b';c.lineWidth=6;for(const dx of [30,104]){c.beginPath();c.moveTo(dx,-24);c.lineTo(dx,5);c.stroke();}
      c.fillStyle='#95623d';c.fillRect(20,-51,96,13);c.fillRect(20,-33,96,12);c.fillRect(17,-18,103,10);
      oval(c,67,-53,51,5,'#faffff');
      if(i%2===0&&i!==0&&x!==2520)drawVillageSnowman(c,-65,7,1,save?.snowmen?.['museum']);
      c.restore();
    }
  }
  function snowbank(c,b,dug,hover,progress,t,owned=false){
    c.save();c.translate(b.x,b.y);oval(c,0,5,66,12,'#afcbd966');
    if(dug){oval(c,0,-2,55,15,'#eaf5fa');oval(c,0,-5,34,10,'#91b5c9');oval(c,0,-2,25,6,'#b8d4e3');}
    else {
      const g=c.createLinearGradient(0,-43,0,8);g.addColorStop(0,'#ffffff');g.addColorStop(.65,'#eff9ff');g.addColorStop(1,'#c5dfec');c.fillStyle=g;
      c.beginPath();c.moveTo(-62,3);c.bezierCurveTo(-60,-10,-45,-19,-29,-20);c.bezierCurveTo(-19,-46,16,-48,32,-27);c.bezierCurveTo(49,-25,64,-13,65,3);c.bezierCurveTo(37,15,-39,15,-62,3);c.fill();
      c.lineJoin='round';c.strokeStyle='#fff';c.lineWidth=7;c.stroke();c.strokeStyle=hover?'#ffcf57':'#70a8c4';c.lineWidth=hover?3.5:2.5;c.stroke();
      c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(-22,-24);c.bezierCurveTo(-8,-40,13,-39,26,-28);c.stroke();
      if(hover||progress>0){oval(c,1,-58,25,25,'#28435455');oval(c,0,-61,24,24,owned?'#254f69':'#7d6745');c.strokeStyle=owned?'#a9ecff':'#ffda78';c.lineWidth=2;c.beginPath();c.arc(0,-61,24,0,TAU);c.stroke();SK.drawShovel(c,0,-61,22,-.35);if(!owned){c.fillStyle='#ffe7a0';c.font='bold 14px Arial';c.textAlign='center';c.fillText('+',17,-42);}}else{c.fillStyle='#96c9df';polygon(c,[[0,-30],[4,-24],[10,-21],[4,-18],[0,-12],[-4,-18],[-10,-21],[-4,-24]],'#74adc6');}
    }
    if(progress>0){for(let i=0;i<9;i++){const a=i*2.4,phase=(progress*3+i/9)%1;oval(c,Math.cos(a)*phase*65,-18-Math.sin(phase*Math.PI)*65,3+i%3,3,'#ffffff');}c.strokeStyle='#efbf45';c.lineWidth=5;c.beginPath();c.arc(0,-61,28,-Math.PI/2,-Math.PI/2+TAU*progress);c.stroke();}
    c.restore();
  }
  T.collectSquirrel=function(save,squirrel){
    if(!squirrel||squirrel.collected)return 0;
    squirrel.collected=true;const amount=Math.min(squirrel.coins,9999999-(save.gold||0));
    save.gold=(save.gold||0)+amount;return amount;
  };
  T.drawSquirrel=function(c,a,t){
    c.save();c.translate(a.x,548-Math.abs(Math.sin(t*11))*2);c.scale(a.dir*.48,.48);
    c.fillStyle='#985226';c.strokeStyle='#683b23';c.lineWidth=3;
    c.beginPath();c.moveTo(-12,-10);c.bezierCurveTo(-68,-14,-58,-83,-30,-69);c.bezierCurveTo(-8,-57,-44,-39,-14,-26);c.fill();c.stroke();
    oval(c,-6,-15,21,15,'#b66c33');oval(c,5,-12,10,10,'#edbd7f');
    oval(c,14,-31,14,14,'#b66c33');
    c.fillStyle='#985226';c.beginPath();c.moveTo(6,-41);c.lineTo(8,-57);c.lineTo(18,-41);c.fill();
    oval(c,21,-34,3,4,'#17242b');oval(c,27,-27,4,3,'#3c2920');
    oval(c,-15,0,9,4,'#683b23');oval(c,12,0,10,4,'#683b23');
    c.restore();
  };
  // opts : { canvas, charId, boardId, look, labelEl, onEnter(houseId), onBack }
  T.snowmen=()=>{const b=STREET.find(b=>b.id==='ecole');return [{id:'chalet',x:627,y:551,sx:.84,sy:.84},{id:'museum',x:4335,y:542,sx:1,sy:1},{id:'school',x:b.x+306*b.w/350,y:b.y-b.h+349*b.h/350,sx:b.w/350*.72,sy:b.h/350*.72}];};
  T.hitSnowman=(x,y)=>T.snowmen().find(m=>Math.abs(x-m.x)<55*m.sx&&y>m.y-160*m.sy&&y<m.y+10*m.sy);
  T.open = function(opts) {
    stop();canvas=opts.canvas;const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
    let WORLD_WIDTH=STREET.some(b=>b.id==='debug')?5350:4860;
    const clamp=x=>Math.max(100,Math.min(WORLD_WIDTH-100,x));
    let x=clamp(T._streetX ?? T.streetDoor(STREET.find(b=>b.id==='kids'))),camera=Math.max(0,Math.min(WORLD_WIDTH-1280,x-640));
    let facing='down',target=null,last=performance.now(),near=-1,moving=false,walkTime=0;
    const residents=[...SK.VILLAGERS.filter(v=>!SK.WORKPLACES[v.id]),...SK.CHARACTERS.filter(ch=>!ch.hidden&&ch.id!==opts.charId)];
    const pairs=[['jessica','jeremie'],['josue','emily'],['mickael','marie']].map(ids=>ids.filter(id=>residents.some(v=>v.id===id))).filter(ids=>ids.length);
    const used=new Set(pairs.flat());
    const groups=[['matthieu'],...pairs,...residents.filter(ch=>ch.id!=='matthieu'&&!used.has(ch.id)).map(ch=>[ch.id])].map((ids,i)=>({ids,x:i===0?x+220:220+i*360,dir:i%2?-1:1,speed:46+i%3*4,walk:0,greeting:0,cooldown:0,near:false}));
    const locals=groups.flatMap(group=>group.ids.map((id,index)=>{const ch=residents.find(ch=>ch.id===id);const r=SK.fakeRacer(ch.id,'freestyle','ride',SK.lookOf(ch,{gear:[],look:{}}));r.def=ch;return {r,group,offset:index*76};}));
    const richardChat={remaining:0,cooldown:0,near:new Set()};
    const surprises=SK.TownSurprises?.create();
    const held=new Set(),door=T.streetDoor;
    let pendingDig=null,digProgress=0,hoverSnow=null;
    let squirrel=null,squirrelWait=6,coinDrop=null;
    const catchSquirrel=()=>{const amount=T.collectSquirrel(opts.save,squirrel);if(amount){coinDrop={x:squirrel.x,at:performance.now(),amount};opts.onDig?.(amount);T.showGoldReward(bubble,amount);bubbleUntil=performance.now()+3500;SK.Audio.sfx('coin');}};
    const dug=b=>opts.save?.snowDig?.day===T.snowDay()&&Object.hasOwn(opts.save.snowDig.found,b.id);
    const snowHit=(mx,my)=>T.SNOWBANKS.find(b=>Math.abs(mx-b.x)<65&&my>b.y-90&&my<b.y+17);
    const snowMove=e=>{const box=canvas.getBoundingClientRect();hoverSnow=snowHit((e.clientX-box.left)*1280/box.width+camera,(e.clientY-box.top)*720/box.height);canvas.style.cursor=(SK.CannonGame?.hit((e.clientX-box.left)*1280/box.width+camera,(e.clientY-box.top)*720/box.height)||SK.TownSurprises?.hitSanta((e.clientX-box.left)*1280/box.width,(e.clientY-box.top)*720/box.height)||SK.TownMusic?.hit((e.clientX-box.left)*1280/box.width+camera,(e.clientY-box.top)*720/box.height)||T.hitSnowman((e.clientX-box.left)*1280/box.width+camera,(e.clientY-box.top)*720/box.height)||hoverSnow&&!dug(hoverSnow)||STREET.some(b=>SK.TownArchitecture?.hitBell(b,(e.clientX-box.left)*1280/box.width+camera,(e.clientY-box.top)*720/box.height)))?'pointer':'default';};
    canvas.addEventListener('pointermove',snowMove);
    const stage=canvas.parentElement,chat=document.createElement('form'),bubble=document.createElement('div');
    const shovelDialog=document.createElement('dialog');shovelDialog.className='shovel-dialog';shovelDialog.setAttribute('aria-label','Pelle aux trésors');stage.append(shovelDialog);
    const offerShovel=bank=>{held.clear();target=null;const price=SK.gearById('pelle').price;shovelDialog.innerHTML='<button class="shovel-close" aria-label="Fermer">×</button><canvas width="140" height="140" aria-hidden="true"></canvas><h2>Pelle aux trésors</h2><p>Déterre les pièces cachées dans la neige !</p><span class="shovel-permanent">À toi pour toujours</span><button class="shovel-buy">Acheter · '+price+' G</button><small>'+(opts.save.gold<price?'Il te manque '+(price-opts.save.gold)+' G':'Les trésors se renouvellent chaque jour.')+'</small>';
      SK.drawShovel(shovelDialog.querySelector('canvas').getContext('2d'),70,70,65,-.3);shovelDialog.querySelector('.shovel-close').onclick=()=>shovelDialog.close();const buy=shovelDialog.querySelector('.shovel-buy');buy.disabled=opts.save.gold<price;buy.onclick=()=>{if(!T.buyShovel(opts.save))return;opts.onDig?.(0);SK.Audio.sfx('buy');shovelDialog.close();pendingDig=bank;digProgress=0;target=bank.x;held.clear();};SK.Touch.pause(true);shovelDialog.showModal();};
    shovelDialog.addEventListener('close',()=>SK.Touch.pause(false));

    chat.id='town-chat';chat.hidden=true;chat.innerHTML='<label for="town-chat-input">Parler dans le village</label><div><input id="town-chat-input" maxlength="180" autocomplete="off" placeholder="Message ou code de triche…"><button type="submit">Envoyer</button><button type="button" aria-label="Fermer le chat">×</button></div>';
    bubble.id='town-player-speech';bubble.hidden=true;bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');stage.append(chat,bubble);
    const chatButton=document.createElement('button');chatButton.id='town-chat-open';chatButton.type='button';chatButton.textContent='💬 Message';chatButton.setAttribute('aria-controls','town-chat');chatButton.setAttribute('aria-expanded','false');stage.append(chatButton);
    const input=chat.querySelector('input');let bubbleUntil=0;
    const closeChat=()=>{chat.hidden=true;chatButton.setAttribute('aria-expanded','false');SK.Touch.pause(false);input.blur();held.clear();SK.Input.keys={};SK.Input.pressed={};};
    const openChat=()=>{held.clear();target=null;pendingDig=null;digProgress=0;moving=false;SK.Touch.pause(true);chat.hidden=false;chatButton.setAttribute('aria-expanded','true');input.focus();SK.Input.keys={};SK.Input.pressed={};};
    chatButton.onclick=openChat;
    chat.querySelector('[type=button]').onclick=closeChat;
    chat.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();closeChat();}if(e.code==='Enter'&&(e.repeat||e.isComposing))e.preventDefault();});
    chat.addEventListener('keyup',e=>e.stopPropagation());
    chat.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text)return;
      bubble.classList.remove('gold-reward');bubble.textContent=text;bubble.hidden=false;bubbleUntil=performance.now()+Math.max(6000,Math.min(12000,text.length*70));
      const result=opts.onChat?.(text);if(result){opts.look=result.look;WORLD_WIDTH=result.debugHouse?5350:4860;}
      input.value='';closeChat();
    };
    selectCleanup=()=>{SK.Snowman?.close();canvas.removeEventListener('pointermove',snowMove);canvas.style.cursor='default';if(shovelDialog.open)shovelDialog.close();shovelDialog.remove();chat.remove();bubble.remove();chatButton.remove();held.clear();SK.Input.keys={};SK.Input.pressed={};};

    const nearest=()=>STREET.findIndex(b=>Math.abs(door(b)-x)<115);
    const label=()=>{const h=near<0?null:T.HOUSES.find(h=>h.id===STREET[near].id);
      if(opts.labelEl)opts.labelEl.innerHTML=h?`<button type="button" class="n64-btn btn-depart town-enter" aria-label="Entrer : ${h.name}">Entrer</button>`:'';
      const button=opts.labelEl?.querySelector('.town-enter');if(button)button.onclick=()=>{held.clear();target=null;moving=false;enter();};};
    const enter=()=>{if(near>=0&&!moving){T._streetX=x;opts.onEnter(STREET[near].id);}};
    keyHandler=e=>{if(T.paused||SK.Snowman?.isOpen())return;if(!chat.hidden||e.target.closest?.('input,textarea,select,dialog'))return;if(e.code==='Enter'){e.preventDefault();if(!e.repeat){if(near>=0){held.clear();target=null;moving=false;enter();}else openChat();}return;}if(['ArrowLeft','KeyA','ArrowRight','KeyD','KeyX','Space','Escape'].includes(e.code))e.preventDefault();
      if(['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code)){held.add(e.code);target=null;pendingDig=null;digProgress=0;}
      else if(['KeyX','Space'].includes(e.code)&&!e.repeat)enter();else if(e.code==='Escape'&&!e.repeat){held.clear();target=null;moving=false;(opts.onPause||opts.onBack)?.();}};
    keyUpHandler=e=>held.delete(e.code);blurHandler=()=>{held.clear();target=null;};
    window.addEventListener('keydown',keyHandler);window.addEventListener('keyup',keyUpHandler);window.addEventListener('blur',blurHandler);
    clickHandler=e=>{if(T.paused||!chat.hidden||SK.Snowman?.isOpen())return;const bounds=canvas.getBoundingClientRect(),mx=(e.clientX-bounds.left)*1280/bounds.width+camera,my=(e.clientY-bounds.top)*720/bounds.height;
      if(SK.TownSurprises?.hitSanta(mx-camera,my)){held.clear();target=null;pendingDig=null;digProgress=0;SK.TownSurprises.greetSanta(performance.now()/1000);return;}
      if(SK.CannonGame?.hit(mx,my)){held.clear();target=null;pendingDig=null;digProgress=0;opts.onCannon?.();return;}
      const instrument=SK.TownMusic?.hit(mx,my);if(instrument){held.clear();target=null;pendingDig=null;digProgress=0;SK.TownMusic.play(instrument,performance.now()/1000);return;}
      const snowman=T.hitSnowman(mx,my);if(snowman){held.clear();target=null;pendingDig=null;digProgress=0;SK.Input.keys={};SK.Input.pressed={};SK.Snowman.open({save:opts.save,id:snowman.id,origin:{x:e.clientX,y:e.clientY},onSave:()=>{opts.onDecorate?.();SK.Audio.sfx('buy');},onClose:()=>{held.clear();SK.Input.keys={};SK.Input.pressed={};last=performance.now();}});return;}
      const bell=STREET.find(b=>SK.TownArchitecture?.hitBell(b,mx,my));if(bell){SK.TownArchitecture.ringBell(bell,performance.now()/1000);return;}
      if(squirrel&&!squirrel.collected&&mx>squirrel.x-30&&mx<squirrel.x+20&&my>508&&my<555){catchSquirrel();return;}
      const bank=snowHit(mx,my);if(bank){if(!T.hasShovel(opts.save)){offerShovel(bank);return;}if(!dug(bank)&&!pendingDig){pendingDig=bank;digProgress=0;target=bank.x;held.clear();}return;}
      pendingDig=null;digProgress=0;
      if(mx<195&&my>255){target=100;return;}
      const hit=STREET.findIndex(b=>mx>=b.x&&mx<=b.x+b.w&&my>=b.y-b.h*1.3&&my<=b.y+15);
      if(hit>=0){if(hit===near&&!moving)enter();else target=door(STREET[hit]);}else if(my>420)target=clamp(mx);};
    canvas.addEventListener('click',clickHandler);near=nearest();label();
    const frame=()=>{raf=requestAnimationFrame(frame);const now=performance.now(),dt=Math.min(.05,(now-last)/1000),t=now/1000;last=now;if(T.paused){held.clear();target=null;moving=false;return;}if(SK.Snowman?.isOpen())return;
      let direction=(held.has('ArrowRight')||held.has('KeyD')?1:0)-(held.has('ArrowLeft')||held.has('KeyA')?1:0);const touch=SK.Touch?.held||{};if(touch.left||touch.right){target=null;pendingDig=null;digProgress=0;direction=(touch.right?1:0)-(touch.left?1:0);}
      if(target!==null)direction=Math.sign(target-x);
      if(chat.hidden&&!document.hidden){
        squirrelWait-=dt;
        if(!squirrel&&squirrelWait<=0){const dir=Math.random()<.5?-1:1;squirrel={x:clamp(x-dir*350),dir,life:12,coins:3+Math.floor(Math.random()*5),collected:false};}
        if(squirrel){squirrel.x+=squirrel.dir*85*dt;squirrel.life-=dt;if(squirrel.collected||squirrel.life<=0){squirrel=null;squirrelWait=20+Math.random()*20;}}
      }
      const before=x,step=SK.townWalkSpeed(opts.walkLevel)*dt;
      if(target!==null&&Math.abs(target-x)<=step){x=target;target=null;}else x=clamp(x+direction*step);
      if(x<=102&&direction<0){T._streetX=300;opts.onEnter('lift');return;}
      if(x>=WORLD_WIDTH-102&&direction>0){T._streetX=WORLD_WIDTH-300;opts.onEnter('throne');return;}
      moving=Math.abs(x-before)>.01;if(moving)walkTime+=Math.abs(x-before)/255;if(moving)facing=x>before?'right':'left';else facing='down';
      if(pendingDig&&Math.abs(x-pendingDig.x)<8&&!moving){
        digProgress=Math.min(1,digProgress+dt/1.8);
        if(digProgress>=1){const amount=T.digSnow(opts.save,pendingDig.id);if(amount!==null){opts.onDig?.(amount);if(amount){T.showGoldReward(bubble,amount);coinDrop={x:pendingDig.x,y:pendingDig.y,at:now,amount};SK.Audio.sfx('coin');}else{bubble.classList.remove('gold-reward');bubble.textContent='Juste de la neige… On cherche ailleurs ?';bubble.hidden=false;}bubbleUntil=now+3500;}pendingDig=null;digProgress=0;}
      }
      T._streetX=x;const next=nearest();if(next!==near){near=next;label();}
      const cameraTarget=Math.max(0,Math.min(WORLD_WIDTH-1280,x-640));camera+=(cameraTarget-camera)*(1-Math.exp(-dt*9));
      ctx.save();ctx.scale(W/1280,H/720);winterStreet(ctx,t,camera);
      SK.TownSurprises?.sky(ctx,t);
      if(surprises&&chat.hidden&&!document.hidden)SK.TownSurprises.update(surprises,dt,camera,STREET,opts.save);
      ctx.save();ctx.translate(-camera,0);
      T.drawTournamentSign(ctx,t);
      SK.TownSurprises?.drawGuest(ctx,surprises?.active,t);
      STREET.forEach((b,i)=>{if(b.x+b.w+60>camera&&b.x-60<camera+1280){b.snowmanDesign=opts.save?.snowmen?.school;streetHouse(ctx,b,t,i===near);SK.TownSurprises?.architecture(ctx,b,t);}});

      villageDecor(ctx,opts.save);
      SK.TownSurprises?.decor(ctx,t,camera);
      SK.TownMusic?.draw(ctx,t,camera);
      SK.CannonGame?.drawTown(ctx,t);
      for(const bank of T.SNOWBANKS)if(bank.x>camera-80&&bank.x<camera+1360)snowbank(ctx,bank,dug(bank),hoverSnow===bank,pendingDig===bank?digProgress:0,t,T.hasShovel(opts.save));
      ctx.save();ctx.globalAlpha=.38+.08*Math.sin(t*2);ctx.strokeStyle='#eaf7ff';ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(WORLD_WIDTH-225,535);ctx.lineTo(WORLD_WIDTH-115,535);ctx.lineTo(WORLD_WIDTH-145,508);ctx.moveTo(WORLD_WIDTH-115,535);ctx.lineTo(WORLD_WIDTH-145,562);ctx.stroke();ctx.restore();
      if(squirrel&&!squirrel.collected)T.drawSquirrel(ctx,squirrel,t);
      if(coinDrop){const age=(now-coinDrop.at)/1000;if(age<1.1){ctx.save();ctx.globalAlpha=Math.min(1,(1.1-age)*3);for(let i=0;i<coinDrop.amount;i++)SK.drawGoldCoin(ctx,coinDrop.x+(i-(coinDrop.amount-1)/2)*age*28,(coinDrop.y||532)-65*Math.sin(Math.min(1,age)*Math.PI)+age*14,6);ctx.restore();}else coinDrop=null;}
      for(const group of groups)T.updateResidentGroup(group,x,dt);
      T.updateRichardChat(richardChat,locals,dt,camera);
      for(const local of locals){const g=local.group,lx=g.x+local.offset,walking=g.greeting<=0&&!(g.conversation>0);local.r.wave=g.greeting>0||!!(surprises?.active&&Math.abs(lx-surprises.active.edge)<430&&!local.r.def.adult);
        const laughing=richardChat.laugh>0&&(local===richardChat.richard||local===richardChat.listener);
        if(laughing)local.r.wave=false;
        if(lx>camera-100&&lx<camera+1380){
          ctx.save();ctx.translate(lx,565-(laughing?Math.abs(Math.sin(t*12))*4:0));
          if(laughing)ctx.rotate(Math.sin(t*9)*.035);
          R.drawWalker(ctx,local.r,0,0,local.r.def.adult?68:53,walking?g.walk:t,walking?(g.dir>0?'right':'left'):'down',walking);ctx.restore();
          if(laughing){ctx.save();ctx.font='bold 21px "Trebuchet MS",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff5d8';ctx.beginPath();ctx.roundRect(lx-66,350,132,40,15);ctx.fill();ctx.fillStyle='#865123';ctx.fillText('Ha ha ha !',lx,377);ctx.restore();}
        }
      }
      const cameo=surprises?.active;
      if(cameo&&cameo.age>.28&&!cameo.announced){cameo.announced=true;if(now>=bubbleUntil){bubble.classList.remove('gold-reward');bubble.textContent='Aaaah ! C’est '+cameo.guest.name+' !';bubble.hidden=false;bubbleUntil=now+2600;}}
      canvas.dataset.villagers=locals.length;
      canvas.dataset.cameo=cameo?.guest.id||'';
      if(now>=bubbleUntil)bubble.hidden=true;
      bubble.style.left=(SK.clamp(x-camera,145,1135)/12.8)+'%';bubble.style.top=((opts.charId==='milo'?475:opts.charId==='adam'||opts.charId==='edison'?440:410)/7.2)+'%';
      if(opts.labelEl)opts.labelEl.style.setProperty('--player-x',(SK.clamp(x-camera,150,1130)/12.8)+'%');
      const r=SK.fakeRacer(opts.charId,opts.boardId,'ride',opts.look);r.digProgress=digProgress;R.drawWalker(ctx,r,x,610+(digProgress?Math.sin(digProgress*Math.PI*4)**2*13:0),65,walkTime,facing,moving);

      for(const local of locals)T.drawParentGreeting(ctx,local,opts.charId,camera);
      T.drawRichardChat(ctx,richardChat,camera);
      SK.TownSurprises?.drawGreeting(ctx,surprises?.active,camera);
      ctx.restore();
      for(let i=0;i<85;i++)oval(ctx,(i*173+t*(10+i%4*3))%1280,(i*79+t*(18+i%5*5))%720,1+i%3*.4,1+i%3*.4,'#ffffffb0');
      // Les indications latérales suivent les limites réelles de la rue.
      ctx.font='bold 26px sans-serif';ctx.fillStyle='#416785';ctx.textAlign='left';if(camera>10)ctx.fillText('‹',26,635);ctx.textAlign='right';if(camera<WORLD_WIDTH-1290)ctx.fillText('›',1254,635);
      ctx.restore();};frame();
  };
})(window.SK);
