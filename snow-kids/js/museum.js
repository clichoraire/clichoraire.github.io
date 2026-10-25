// Galerie du musée : récompenses réelles, promenade et caméra à défilement doux.
(function(SK){
  'use strict';
  const M=SK.Museum={},TAU=Math.PI*2;let cleanup=null;
  M.close=()=>{cleanup?.();cleanup=null;};
  M.exhibits=save=>[
    ...SK.COURSES.map((c,i)=>({id:c.id,kind:'piste',name:c.hidden&&i>=save.unlocked?'???':c.name,won:!!save.won[c.id],unlocked:i<save.unlocked,record:save.best[c.id],condition:'Termine cette piste en première place.'})),
    ...SK.CUPS.map(c=>({id:c.id,kind:'coupe',name:c.name,won:!!save.cups?.[c.id]?.won,unlocked:SK.cupUnlocked(c,save),points:save.cups?.[c.id]?.bestPoints,condition:'Remporte le classement général de cette coupe.'}))
  ];
  M.open=function(opts){
    M.close();const cv=opts.canvas,c=cv.getContext('2d'),list=M.exhibits(opts.save),spacing=310,end=500+list.length*spacing;
    let x=260,camera=0,target=null,facing='down',walk=0,last=performance.now(),raf=0,near=-1,active=true;
    const held=new Set(),clamp=v=>Math.max(110,Math.min(end-180,v)),at=i=>510+i*spacing;
    const detail=document.getElementById('museum-detail'),summary=document.getElementById('museum-summary');
    summary.textContent=list.filter(e=>e.won).length+' / '+list.length+' trophées obtenus';
    const update=()=>{const e=list[near];detail.hidden=!e;if(!e)return;
      detail.replaceChildren();const title=document.createElement('strong');title.textContent=e.name;const text=document.createElement('span');
      text.textContent=(e.won?'Trophée obtenu !':e.unlocked?'À remporter — '+e.condition:'Verrouillé — '+e.condition)+(e.record?' · Record : '+SK.fmtTime(e.record):'')+(e.points!=null?' · '+e.points+' points':'');detail.append(title,text);};
    function navigate(d){held.add(d<0?'ArrowLeft':'ArrowRight');target=null;}
    const left=document.getElementById('museum-left'),right=document.getElementById('museum-right');
    for(const [button,d] of [[left,-1],[right,1]]){button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);navigate(d);};button.onpointerup=button.onpointercancel=()=>held.clear();button.onclick=e=>{if(e.detail===0)target=clamp(x+d*spacing);};}
    const key=e=>{if(['ArrowLeft','ArrowRight','KeyA','KeyD','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){opts.onBack();return;}if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){held.add(e.code);target=null;}};
    const release=e=>held.delete(e.code),blur=()=>{held.clear();target=null;last=performance.now();};
    const click=e=>{const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*1280/r.width+camera,py=(e.clientY-r.top)*720/r.height;
      if(px<240&&py>270&&py<595){opts.onBack();return;}
      const i=Math.round((px-510)/spacing);target=clamp(i>=0&&i<list.length&&py>230&&py<590?at(i):px);};
    const move=e=>{const r=cv.getBoundingClientRect(),py=(e.clientY-r.top)*720/r.height;cv.style.cursor=py>230?'pointer':'default';};
    cv.addEventListener('click',click);cv.addEventListener('pointermove',move);window.addEventListener('keydown',key);window.addEventListener('keyup',release);window.addEventListener('blur',blur);
    document.getElementById('museum-back').onclick=opts.onBack;
    const collection=document.getElementById('museum-collection');collection.onchange=()=>{held.clear();target=collection.value==='cups'?at(SK.COURSES.length):at(0);x=target;target=null;cv.dataset.position=Math.round(x);near=Math.round((x-510)/spacing);update();camera=Math.max(0,Math.min(end-1280,x-640));};collection.value='tracks';
    const frame=()=>{if(!active)return;raf=requestAnimationFrame(frame);const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
      let direction=(held.has('ArrowRight')||held.has('KeyD')?1:0)-(held.has('ArrowLeft')||held.has('KeyA')?1:0);if(target!==null)direction=Math.sign(target-x);
      const old=x,step=260*dt;x=clamp(target!==null&&Math.abs(target-x)<step?target:x+direction*step);if(x===target)target=null;
      const moving=Math.abs(x-old)>.01;if(moving){walk+=Math.abs(x-old)/260;facing=x>old?'right':'left';}else facing='down';
      camera+=(Math.max(0,Math.min(end-1280,x-640))-camera)*(1-Math.exp(-dt*8));
      const i=Math.round((x-510)/spacing),next=i>=0&&i<list.length&&Math.abs(at(i)-x)<120?i:-1;if(next!==near){near=next;update();}
      cv.dataset.position=Math.round(x);cv.dataset.nearest=near;left.disabled=x<=110;right.disabled=x>=end-180;
      drawRoom(c,camera,end,now/1000);
      c.save();c.translate(-camera,0);drawDoor(c);
      for(let i=0;i<list.length;i++){const px=at(i);if(px<camera-220||px>camera+1500)continue;drawExhibit(c,px,list[i],i,near===i,now/1000);}
      const racer=SK.fakeRacer(opts.save.advChar||opts.save.char,'freestyle','ride',opts.look);SK.Render.drawWalker(c,racer,x,661,63,walk,facing,moving);c.restore();
    };frame();update();
    cleanup=()=>{active=false;cancelAnimationFrame(raf);held.clear();window.removeEventListener('keydown',key);window.removeEventListener('keyup',release);window.removeEventListener('blur',blur);cv.removeEventListener('click',click);cv.removeEventListener('pointermove',move);for(const b of [left,right])b.onpointerdown=b.onpointerup=b.onpointercancel=b.onclick=null;collection.onchange=null;};
  };
  function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function text(c,str,x,y,size,color){c.fillStyle=color;c.font='900 '+size+'px "Trebuchet MS",sans-serif';c.textAlign='center';c.fillText(str,x,y);}
  function drawRoom(c,camera,end,t){
    rect(c,0,0,1280,720,'#855333');for(let y=0;y<590;y+=48){rect(c,0,y,1280,46,y%96?'#8e5b39':'#845131');rect(c,0,y+45,1280,3,'#5d391f');for(let x=-(camera*.7%260);x<1280;x+=260)rect(c,x+20,y+15,130,2,'#ffffff09');}
    rect(c,0,0,1280,175,'#59391f');for(let x=-(camera%350);x<1280;x+=350){poly(c,[[x,0],[x+20,0],[x+55,165],[x+33,165]],'#3c2819');rect(c,x,175,15,410,'#684225');}
    rect(c,0,167,1280,17,'#b17b43');rect(c,0,184,1280,9,'#4c301c');
    for(let x=-(camera%310);x<1300;x+=310){c.strokeStyle='#efe1bb';c.lineWidth=3;c.beginPath();c.moveTo(x,30);c.quadraticCurveTo(x+155,120,x+310,30);c.stroke();for(let j=0;j<6;j++){const xx=x+j*52,yy=30+Math.sin(j/6*Math.PI)*43;poly(c,[[xx,yy],[xx+40,yy+9],[xx+25,yy+57]],['#d74c4d','#e1b846','#448aa8','#69a14d'][j%4]);}}
    const g=c.createLinearGradient(0,590,0,720);g.addColorStop(0,'#b17b49');g.addColorStop(1,'#80502e');rect(c,0,590,1280,130,g);c.strokeStyle='#754722';c.lineWidth=2;
    for(let x=-(camera%100)-100;x<1400;x+=100){c.beginPath();c.moveTo(x,590);c.lineTo(x-80,720);c.stroke();}rect(c,0,581,1280,11,'#452d1b');rect(c,0,592,1280,3,'#dbad73');
  }
  function drawDoor(c){rect(c,72,287,170,304,'#3a281c',8);rect(c,83,298,148,289,'#664629',4);for(let y=315;y<555;y+=80)rect(c,97,y,119,62,'#493321',5);rect(c,207,440,8,23,'#d6a744',3);rect(c,88,249,139,30,'#fff0c9',5);text(c,'VILLAGE',157,271,19,'#513725');}
  function trophy(c,x,y,won,t){c.save();c.translate(x,y);const gold=won?'#ffc329':'#45301f',edge=won?'#b47b15':'#3c291b';
    c.strokeStyle=edge;c.lineWidth=10;c.lineCap='round';for(const side of [-1,1]){c.beginPath();c.moveTo(side*37,-115);c.bezierCurveTo(side*93,-140,side*82,-67,side*25,-64);c.stroke();}
    const shine=c.createLinearGradient(-45,0,45,0);shine.addColorStop(0,edge);shine.addColorStop(.25,won?'#ffe67a':gold);shine.addColorStop(.5,gold);shine.addColorStop(1,edge);
    c.fillStyle=shine;c.beginPath();c.moveTo(-48,-130);c.lineTo(48,-130);c.bezierCurveTo(46,-75,24,-40,0,-38);c.bezierCurveTo(-24,-40,-46,-75,-48,-130);c.fill();rect(c,-50,-137,100,11,gold,4);
    poly(c,[[-8,-40],[8,-40],[8,-15],[26,-5],[-26,-5],[-8,-15]],gold);rect(c,-36,-7,72,22,'#4d3028',3);rect(c,-24,-2,48,11,won?'#eeb83e':'#32251c',2);
    if(won){text(c,'★',0,-82,34,'#b78116');c.globalAlpha=.55+.35*Math.sin(t*3);text(c,'✦',-27,-115,26,'#fff9ce');}else text(c,'?',0,-74,48,'#8a6e50');c.restore();}
  function drawExhibit(c,x,e,i,selected,t){
    const stone=i%3!==1,base=stone?'#817971':'#754625',edge=stone?'#554f49':'#4f301c';
    // Affiche de montagne encadrée et éclairage de galerie.
    rect(c,x-106,223,212,219,'#63472c',4);const sky=c.createLinearGradient(0,230,0,440);sky.addColorStop(0,'#5bade7');sky.addColorStop(1,'#d6edf8');rect(c,x-97,231,194,201,sky);
    poly(c,[[x-97,401],[x+20,264],[x+97,385],[x+97,432],[x-97,432]],'#648ca7');poly(c,[[x-41,335],[x+20,264],[x+69,341],[x+30,319],[x+13,337],[x-1,313]],'#f4fbff');
    rect(c,x-20,190,40,10,'#34444c',5);const light=c.createLinearGradient(0,200,0,480);light.addColorStop(0,'#ffe99b66');light.addColorStop(1,'#ffe99b00');poly(c,[[x-13,200],[x+13,200],[x+111,480],[x-111,480]],light);
    if(selected){c.fillStyle='#ffd95a22';c.beginPath();c.ellipse(x,601,112,16,0,0,TAU);c.fill();}
    rect(c,x-70,463,140,127,edge,8);rect(c,x-60,467,120,116,base,5);poly(c,[[x-38,483],[x+38,483],[x+46,495],[x+46,557],[x+31,571],[x-31,571],[x-46,557],[x-46,495]],edge);rect(c,x-32,495,64,65,base,7);
    rect(c,x-82,575,164,23,edge,6);rect(c,x-75,577,150,13,stone?'#a59b8f':'#996337',4);
    trophy(c,x,450,e.won,t+i);
    rect(c,x-104,445,208,54,edge,9);rect(c,x-96,452,192,39,selected?'#fff4cd':'#e8d1a3',5);for(const dx of [-88,88]){c.fillStyle='#988267';c.beginPath();c.arc(x+dx,460,2,0,TAU);c.fill();}
    const words=e.name.split(' '),lines=[''];for(const word of words){const last=lines.length-1;if((lines[last]+' '+word).length>20)lines.push(word);else lines[last]+=(lines[last]?' ':'')+word;}
    lines.slice(0,2).forEach((line,j)=>text(c,line,x,lines.length>1?468+j*16:478,15,'#3d2b1e'));
    text(c,e.kind==='coupe'?'COUPE DU CIRCUIT':'TROPHÉE DE PISTE',x,544,10,stone?'#e8dfcf':'#d9b582');
    if(!e.won)text(c,e.unlocked?'À REMPORTER':'VERROUILLÉ',x,568,10,'#eddbc0');
  }
})(window.SK);
