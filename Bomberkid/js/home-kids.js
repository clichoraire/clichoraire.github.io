// Personnages d’accueil : poses raster indépendantes, boutons tactiles et clavier.
(function(BK){
  'use strict';
  const ROWS=[0,306,576,864,1153,1402];
  // Repères mesurés par personnage, et non une grille supposée régulière.
  const ART=[
    {waveCenter:674,eyes:[[135,120,382,122],[184,120,430,122]],arm:[748,105,65,62,753,163]},
    {waveCenter:681,eyes:[[138,410,390,410],[182,410,433,410]],arm:[751,387,57,62,756,443]},
    {waveCenter:680,eyes:[[131,677,382,678],[182,677,431,678]],arm:[749,667,63,65,753,727]},
    {waveCenter:688,eyes:[[119,982,382,982],[165,982,431,982]],arm:[748,959,64,69,752,1022]},
    {waveCenter:690,eyes:[[117,1252,379,1255],[164,1252,425,1255]],arm:[741,1238,66,65,747,1296]}
  ];
  BK.homeKidsArt=ART;
  // Le corps de repos est rigoureusement identique pendant un clignement.
  BK.drawHomeKid=(ctx,sheet,row,frame,waveAngle=0)=>{
    const art=ART[row],y=ROWS[row],h=ROWS[row+1]-y,scale=320/270,waving=frame>=2;
    const sx=(waving?art.waveCenter:151)-135,dy=360-h*scale;
    ctx.clearRect(0,0,320,360);ctx.save();ctx.translate(-sx*scale,dy-y*scale);ctx.scale(scale,scale);
    if(waving){
      const [x,ay,w,ah,px,py]=art.arm;
      // Le même corps reste à l’écran ; seule la main et son avant-bras pivotent.
      ctx.save();ctx.beginPath();ctx.rect(sx,y,270,h);ctx.rect(x,ay,w,ah);ctx.clip('evenodd');
      ctx.drawImage(sheet,sx,y,270,h-4,sx,y,270,h-4);ctx.restore();
      ctx.save();ctx.translate(px,py);ctx.rotate(waveAngle);ctx.translate(-px,-py);
      ctx.drawImage(sheet,x,ay,w,ah,x,ay,w,ah);ctx.restore();
    }else{
      ctx.drawImage(sheet,sx,y,270,h-4,sx,y,270,h-4);
      if(frame===1)for(const [x,ey,bx,by] of art.eyes){
        ctx.save();ctx.beginPath();ctx.ellipse(x,ey,19,15,0,0,Math.PI*2);ctx.clip();
        ctx.drawImage(sheet,bx-19,by-15,38,30,x-19,ey-15,38,30);ctx.restore();
      }
    }
    ctx.restore();
  };
  const GREETINGS=BK.homeKidsGreetings=[
    {name:'Alexie',lines:["Salut, c'est moi, Alexie !","Coucou, moi c'est Alexie !","Alexie est prête pour l’aventure !"]},
    {name:'Adam',lines:["Coucou, je suis Adam !","Salut ! Adam est prêt à jouer !","C’est Adam ! On part à l’aventure ?"]},
    {name:'Edison',lang:'en',lines:["Hey, I'm Edison !","Hi! Edison here!","I'm Edison! Let's play!"]},
    {name:'Eliott',lines:["Coucou, moi c'est Eliott!","Salut ! C’est Eliott !","Eliott est prêt ! Tu viens jouer ?"]},
    {name:'Milo',lines:["Coucou, Milo, c'est moi !","Salut ! Moi, c’est Milo !","Coucou ! Milo veut jouer avec toi !"]}
  ];
  // Fonction pure : un clignement bref, ou trois petits allers-retours de la main.
  const pose=(time,waveUntil,blinkAt,reduced)=>waveUntil>time?(reduced?2:2+Math.floor(Math.max(0,1.7-waveUntil+time)/.17)%2):!reduced&&time>=blinkAt&&time<blinkAt+.16?1:0;
  BK.homeKidsPose=pose;
  if(typeof document==='undefined')return;
  window.addEventListener('DOMContentLoaded',()=>{
    const menu=document.getElementById('screen-menu'),layer=document.getElementById('home-kids');
    if(!menu||!layer)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),sheet=new Image(),plate=new Image();
    sheet.src='assets/title-kids-sheet.png';plate.src='assets/title-scenery.png';
    const greetings=document.createElement('div');greetings.id='home-greetings';greetings.setAttribute('aria-hidden','true');menu.append(greetings);
    const children=GREETINGS.map(({name,lines,lang},row)=>{
      const button=document.createElement('button'),canvas=document.createElement('canvas'),greeting=document.createElement('span');
      button.type='button';button.className='home-kid home-kid-'+row;button.setAttribute('aria-label',name+' : faire coucou');button.title='Touche-moi pour un coucou !';
      canvas.width=320;canvas.height=360;canvas.setAttribute('aria-hidden','true');greeting.className='kid-greeting';greeting.textContent=lines[0];greeting.lang=lang||'fr';greeting.setAttribute('aria-hidden','true');
      button.append(canvas);layer.append(button);greetings.append(greeting);
      const kid={button,canvas,ctx:canvas.getContext('2d'),row,greeting,line:0,greetingUntil:0,waveUntil:0,blinkAt:1.4+row*.83,last:-1};
      button.addEventListener('click',()=>{const time=performance.now()/1000;children.forEach(other=>other.greetingUntil=0);greeting.textContent=lines[kid.line%lines.length];kid.line++;kid.greetingUntil=time+3.5;kid.waveUntil=time+1.7;kid.last=-1;button.classList.add('waving');BK.audio?.unlock();BK.music?.resume();});
      return kid;
    });
    Promise.all([sheet.decode(),plate.decode()]).then(()=>{
      menu.classList.add('kids-ready');
      const start=performance.now()/1000;children.forEach(k=>k.blinkAt+=start);
      const draw=k=>{
        const time=performance.now()/1000;
        if(time>=k.blinkAt+.16)k.blinkAt=time+3+Math.random()*4;
        const frame=pose(time,k.waveUntil,k.blinkAt,reduced.matches);
        const waving=time<k.waveUntil;
        k.button.classList.toggle('waving',waving);k.greeting.classList.toggle('visible',time<k.greetingUntil);
        if(time<k.greetingUntil){const bounds=k.button.getBoundingClientRect(),area=menu.getBoundingClientRect();
          const half=k.greeting.offsetWidth/2+10;
          k.greeting.style.left=Math.max(half,Math.min(area.width-half,bounds.left-area.left+bounds.width*.5))+'px';
          k.greeting.style.top=Math.max(30,bounds.top-area.top+bounds.height*.04)+'px';
        }
        if(k.last===frame&&!waving)return;k.last=frame;
        const elapsed=Math.max(0,1.7-k.waveUntil+time),envelope=Math.min(1,elapsed/.18,(1.7-elapsed)/.2);
        const angle=reduced.matches?0:Math.sin(elapsed*Math.PI*5)*.09*Math.max(0,envelope);
        BK.drawHomeKid(k.ctx,sheet,k.row,frame,angle);
      };
      let last=0;
      const tick=now=>{requestAnimationFrame(tick);if(document.hidden||!menu.classList.contains('active')||now-last<33)return;last=now;children.forEach(draw);};
      requestAnimationFrame(tick);
    }).catch(()=>{layer.replaceChildren();}); // Illustration statique conservée si le chargement échoue.
  });
})(window.BK);
