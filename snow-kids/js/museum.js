// Galerie du musée : récompenses réelles, promenade et caméra à défilement doux.
(function(SK){
  'use strict';
  const M=SK.Museum={},TAU=Math.PI*2;let cleanup=null;
  M.close=()=>{cleanup?.();cleanup=null;};
  M.exhibits=save=>[
    ...SK.COURSES.map((c,i)=>({id:c.id,kind:'piste',name:c.hidden&&i>=save.unlocked?'???':c.name,won:!!save.won[c.id],unlocked:i<save.unlocked,record:save.best[c.id],condition:'Termine cette piste en première place.'})),
    ...SK.CUPS.map(c=>({id:c.id,kind:'coupe',name:c.name,won:!!save.cups?.[c.id]?.won,unlocked:SK.cupUnlocked(c,save),points:save.cups?.[c.id]?.bestPoints,condition:'Remporte le classement général de cette coupe.'}))
  ];
  M.GUIDE_LINES=[
    'Bienvenue ! Moi, c’est Josué. Ici, chaque trophée raconte une de tes victoires !',
    'Hé ! Savais-tu que chaque pièce dans ton portefeuille de course ajoute 1 km/h à ta vitesse de pointe ? 20 pièces, c’est +20 km/h !',
    'Le portefeuille de 50 pièces permet jusqu’à +50 km/h ! Les derniers km/h se gagnent doucement : garde ton élan et soigne tes virages.',
    'Si tu dépenses des pièces pendant la course, leur bonus de vitesse disparaît aussi. Les pièces de ta tirelire au village ne comptent pas !',
    'Les trophées des pistes et les coupes des tournois ont chacun leur galerie. Choisis une liste pour les retrouver.',
    'Pourquoi le bonhomme de neige visite le musée ? Pour rester de glace devant les chefs-d’œuvre !',
    'Approche-toi d’un trophée pour voir son nom, ton record et ce qu’il te reste à accomplir.',
    'Ma planche voulait travailler au musée… Elle avait déjà beaucoup de culture de la glisse !',
    'Les trophées dorés sont ceux que tu as remportés. Les silhouettes attendent ta prochaine victoire.',
    'Pourquoi les trophées ne se disputent jamais ? Parce qu’ils ont tous une bonne coupe !'
  ];
  M.open=function(opts){
    M.close();const cv=opts.canvas,c=cv.getContext('2d'),list=M.exhibits(opts.save),spacing=205,end=500+list.length*spacing;
    let viewW=1280;
    const resize=()=>{const box=cv.getBoundingClientRect();viewW=720*box.width/Math.max(1,box.height);cv.width=Math.round(viewW);cv.height=720;};
    const observer=new ResizeObserver(resize);observer.observe(cv);window.addEventListener('resize',resize);resize();
    let x=430,camera=0,target=null,facing='down',walk=0,last=performance.now(),raf=0,near=-1,active=true;
    const held=new Set(),clamp=v=>Math.max(110,Math.min(end-180,v)),at=i=>510+i*spacing;
    const detail=document.getElementById('museum-detail'),summary=document.getElementById('museum-summary');
    summary.textContent=list.filter(e=>e.won).length+' / '+list.length+' trophées obtenus';
    const guide=SK.fakeRacer('josue','freestyle','ride');guide.look=SK.lookOf(guide.def,{gear:[],look:{}});
    const speech=document.createElement('aside');speech.className='museum-guide';speech.setAttribute('aria-label','Josué, guide du musée');
    const talk=document.createElement('button');talk.textContent='Parler à Josué';const words=document.createElement('p');words.setAttribute('role','status');words.setAttribute('aria-live','polite');speech.append(talk,words);cv.parentElement.append(speech);
    let guideLine=0,guideWait=24;const say=()=>{words.textContent=M.GUIDE_LINES[guideLine];};say();
    const nextLine=()=>{guideLine=(guideLine+1)%M.GUIDE_LINES.length;guideWait=28;say();};talk.onclick=nextLine;

    const update=()=>{const e=list[near];detail.hidden=!e;if(!e)return;
      const gallery=e.kind==='coupe'?'cups':'tracks';if(collection.value!==gallery){collection.value=gallery;renderBoards();}
      document.querySelectorAll('.museum-board button').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.exhibit)===near)));
      detail.replaceChildren();const title=document.createElement('strong');title.textContent=e.name;const text=document.createElement('span');
      text.textContent=(e.won?'Trophée obtenu !':e.unlocked?'À remporter — '+e.condition:'Verrouillé — '+e.condition)+(e.record?' · Record : '+SK.fmtTime(e.record):'')+(e.points!=null?' · '+e.points+' points':'');detail.append(title,text);};
    const key=e=>{if(e.target.closest?.('select'))return;if(['ArrowLeft','ArrowRight','KeyA','KeyD','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){opts.onBack();return;}if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){held.add(e.code);target=null;}};
    const release=e=>held.delete(e.code),blur=()=>{held.clear();target=null;last=performance.now();};
    const click=e=>{const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*viewW/r.width+camera,py=(e.clientY-r.top)*720/r.height;
      if(Math.abs(px-330)<55&&py>420&&py<650){nextLine();return;}
      if(px<240&&py>270&&py<595){opts.onBack();return;}
      const i=Math.round((px-510)/spacing);target=clamp(i>=0&&i<list.length&&py>230&&py<590?at(i):px);};
    const move=e=>{const r=cv.getBoundingClientRect(),py=(e.clientY-r.top)*720/r.height;cv.style.cursor=py>230?'pointer':'default';};
    cv.addEventListener('click',click);cv.addEventListener('pointermove',move);window.addEventListener('keydown',key);window.addEventListener('keyup',release);window.addEventListener('blur',blur);
    document.getElementById('museum-back').onclick=opts.onBack;
    const collection=document.getElementById('museum-collection');collection.value='tracks';
    const visit=e=>{held.clear();near=list.indexOf(e);x=at(near);target=null;cv.dataset.position=Math.round(x);update();camera=Math.max(0,Math.min(Math.max(0,end-viewW),x-viewW*.58));};
    function renderBoards(){
      const tracks=list.filter(e=>e.kind==='piste'),cups=list.filter(e=>e.kind==='coupe');
      const groups=collection.value==='tracks'?[['Trophées des pistes',tracks.slice(0,5)],['Autres pistes',tracks.slice(5)]]:[['Coupes débutantes',cups.filter(e=>SK.cupById(e.id).group==='beginner')],['Coupes moyennes et expertes',cups.filter(e=>SK.cupById(e.id).group!=='beginner')]];
      document.querySelector('.museum-tournaments').setAttribute('aria-label',collection.value==='tracks'?'Liste des trophées des pistes':'Liste des coupes');
      groups.forEach(([title,entries],i)=>{
        const board=document.getElementById(i?'museum-advanced':'museum-beginner');board.replaceChildren();const heading=document.createElement('h3');heading.textContent=title;board.append(heading);
        for(const e of entries){const button=document.createElement('button');button.dataset.exhibit=list.indexOf(e);button.setAttribute('aria-current',String(list.indexOf(e)===near));button.textContent=(e.won?'🏆':e.unlocked?'○':'🔒')+' '+e.name;button.title=e.won?'Trophée obtenu !':e.unlocked?'À remporter':'Verrouillé';button.onclick=()=>visit(e);board.append(button);}
      });
    }
    collection.onchange=()=>{renderBoards();visit(list[collection.value==='cups'?SK.COURSES.length:0]);};renderBoards();
    const frame=()=>{if(!active)return;raf=requestAnimationFrame(frame);const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
      let direction=(held.has('ArrowRight')||held.has('KeyD')?1:0)-(held.has('ArrowLeft')||held.has('KeyA')?1:0);const touch=SK.Touch?.held||{};if(touch.left||touch.right){target=null;direction=(touch.right?1:0)-(touch.left?1:0);}if(target!==null)direction=Math.sign(target-x);
      const old=x,step=260*dt;x=clamp(target!==null&&Math.abs(target-x)<step?target:x+direction*step);if(x===target)target=null;
      const moving=Math.abs(x-old)>.01;if(moving){walk+=Math.abs(x-old)/260;facing=x>old?'right':'left';}else facing='down';
      camera+=(Math.max(0,Math.min(Math.max(0,end-viewW),x-viewW*.58))-camera)*(1-Math.exp(-dt*8));
      const i=Math.round((x-510)/spacing),next=i>=0&&i<list.length&&Math.abs(at(i)-x)<120?i:-1;if(next!==near){near=next;update();}
      speech.hidden=Math.abs(x-330)>430;if(!speech.hidden){guideWait-=dt;if(guideWait<=0)nextLine();}
      cv.dataset.position=Math.round(x);cv.dataset.nearest=near;
      drawRoom(c,camera,end,now/1000,viewW);
      c.save();c.translate(-camera,0);drawDoor(c);
      for(let i=0;i<list.length;i++){const px=at(i);if(px<camera-220||px>camera+viewW+220)continue;drawBackdrop(c,px,i,now/1000);drawExhibit(c,px,list[i],i,near===i,now/1000);}
      SK.Render.drawWalker(c,guide,330,627,67,now/1000,'down',false);rect(c,287,630,86,23,'#fff0c9',5);text(c,'Josué',330,647,16,'#513723');
      const racer=SK.fakeRacer(opts.save.advChar||opts.save.char,'freestyle','ride',opts.look);SK.Render.drawWalker(c,racer,x,661,63,walk,facing,moving);c.restore();
    };frame();update();
    cleanup=()=>{speech.remove();talk.onclick=null;active=false;cancelAnimationFrame(raf);held.clear();window.removeEventListener('keydown',key);window.removeEventListener('keyup',release);window.removeEventListener('blur',blur);cv.removeEventListener('click',click);cv.removeEventListener('pointermove',move);observer.disconnect();window.removeEventListener('resize',resize);for(const id of ['museum-beginner','museum-advanced'])document.getElementById(id).replaceChildren();collection.onchange=null;};
  };
  function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function text(c,str,x,y,size,color){c.fillStyle=color;c.font='900 '+size+'px "Trebuchet MS",sans-serif';c.textAlign='center';c.fillText(str,x,y);}
  function drawRoom(c,camera,end,t,W){
    rect(c,0,0,W,720,'#855333');for(let y=0;y<590;y+=48){rect(c,0,y,W,46,y%96?'#8e5b39':'#845131');rect(c,0,y+45,W,3,'#5d391f');for(let x=-(camera*.7%260);x<W;x+=260)rect(c,x+20,y+15,130,2,'#ffffff09');}
    rect(c,0,0,W,175,'#59391f');for(let x=-(camera%350);x<W;x+=350){poly(c,[[x,0],[x+20,0],[x+55,165],[x+33,165]],'#3c2819');rect(c,x,175,15,410,'#684225');}
    rect(c,0,167,W,17,'#b17b43');rect(c,0,184,W,9,'#4c301c');
    for(let x=-(camera%310);x<W+20;x+=310){c.strokeStyle='#efe1bb';c.lineWidth=3;c.beginPath();c.moveTo(x,30);c.quadraticCurveTo(x+155,120,x+310,30);c.stroke();for(let j=0;j<6;j++){const xx=x+j*52,yy=30+Math.sin(j/6*Math.PI)*43;poly(c,[[xx,yy],[xx+40,yy+9],[xx+25,yy+57]],['#d74c4d','#e1b846','#448aa8','#69a14d'][j%4]);}}
    const g=c.createLinearGradient(0,590,0,720);g.addColorStop(0,'#b17b49');g.addColorStop(1,'#80502e');rect(c,0,590,W,130,g);c.strokeStyle='#754722';c.lineWidth=2;
    for(let x=-(camera%100)-100;x<W+120;x+=100){c.beginPath();c.moveTo(x,590);c.lineTo(x-80,720);c.stroke();}rect(c,0,581,W,11,'#452d1b');rect(c,0,592,W,3,'#dbad73');
  }
  function drawDoor(c){rect(c,72,287,170,304,'#3a281c',8);rect(c,83,298,148,289,'#664629',4);for(let y=315;y<555;y+=80)rect(c,97,y,119,62,'#493321',5);rect(c,207,440,8,23,'#d6a744',3);rect(c,88,249,139,30,'#fff0c9',5);text(c,'VILLAGE',157,271,19,'#513725');}
  function trophy(c,x,y,won,t){c.save();c.translate(x,y);const gold=won?'#ffc329':'#45301f',edge=won?'#b47b15':'#3c291b';
    c.strokeStyle=edge;c.lineWidth=10;c.lineCap='round';for(const side of [-1,1]){c.beginPath();c.moveTo(side*37,-115);c.bezierCurveTo(side*93,-140,side*82,-67,side*25,-64);c.stroke();}
    const shine=c.createLinearGradient(-45,0,45,0);shine.addColorStop(0,edge);shine.addColorStop(.25,won?'#ffe67a':gold);shine.addColorStop(.5,gold);shine.addColorStop(1,edge);
    c.fillStyle=shine;c.beginPath();c.moveTo(-48,-130);c.lineTo(48,-130);c.bezierCurveTo(46,-75,24,-40,0,-38);c.bezierCurveTo(-24,-40,-46,-75,-48,-130);c.fill();rect(c,-50,-137,100,11,gold,4);
    poly(c,[[-8,-40],[8,-40],[8,-15],[26,-5],[-26,-5],[-8,-15]],gold);rect(c,-36,-7,72,22,'#4d3028',3);rect(c,-24,-2,48,11,won?'#eeb83e':'#32251c',2);
    if(won){text(c,'★',0,-82,34,'#b78116');c.globalAlpha=.55+.35*Math.sin(t*3);text(c,'✦',-27,-115,26,'#fff9ce');}else text(c,'?',0,-74,48,'#8a6e50');c.restore();}
  // Décor permanent : aucun lien avec les morceaux de photos à collectionner.
  function drawBackdrop(c,x,i,t){
    if(i%3===0){
      const y=228,w=146,h=220;c.save();rect(c,x-w/2-7,y-7,w+14,h+14,'#422f24',7);
      c.beginPath();c.roundRect(x-w/2,y,w,h,i%2?40:3);c.clip();
      const sky=c.createLinearGradient(0,y,0,y+h);sky.addColorStop(0,i%2?'#e8a980':'#7ac6ef');sky.addColorStop(1,'#effaff');rect(c,x-w/2,y,w,h,sky);
      poly(c,[[x-90,y+h],[x-5,y+48],[x+95,y+h]],'#8aa7bb');poly(c,[[x-35,y+106],[x-5,y+48],[x+27,y+109],[x+3,y+95],[x-10,y+102]],'#fff');
      poly(c,[[x-80,y+h],[x+49,y+88],[x+110,y+h]],'#d0e3e9');c.restore();
      rect(c,x-3,y,6,h,'#634b34');rect(c,x-w/2,y+86,w,5,'#634b34');rect(c,x-w/2-12,y+h, w+24,10,'#b58b54',3);
    }else{
      c.save();c.translate(x,305);c.rotate(i%2?-.045:.04);
      const w=i%2?126:148,h=i%2?180:148;
      rect(c,-w/2-9,-h/2-9,w+18,h+18,'#483020',4);rect(c,-w/2-3,-h/2-3,w+6,h+6,'#f6e7c7');
      c.save();c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();rect(c,-w/2,-h/2,w,h,['#8fcce5','#b0c9eb','#efc593'][i%3]);
      poly(c,[[-w/2,20],[0,-45],[w/2,10],[w/2,h/2],[-w/2,h/2]],'#f4fbff');
      const kid=SK.CHARACTERS[i%6],r=SK.fakeRacer(kid.id,'freestyle','air');r.h=0;r.vy=1;r.curTrick=null;
      SK.Render.drawRacer(c,r,0,h*.32,37,t,false);c.restore();
      rect(c,-w/2,h/2-19,w,19,'#fff5df');text(c,SK.CHARACTERS[i%6].name+' · SNOW KIDS',0,h/2-5,10,'#533b28');c.restore();
    }
  }
  function drawExhibit(c,x,e,i,selected,t){
    c.save();c.translate(x,590);c.scale(.66,.85);c.translate(-x,-590);
    const stone=i%3!==1,base=stone?'#817971':'#754625',edge=stone?'#554f49':'#4f301c';
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
    c.restore();
  }
})(window.SK);
