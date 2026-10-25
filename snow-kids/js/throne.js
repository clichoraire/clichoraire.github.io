// Quinze tournois : quatorze chandelles et un chandelier de révélation.
(function(SK){
  const B=SK.Throne={};let cleanup=null;
  B.close=()=>{cleanup?.();cleanup=null;};
  B.candles=save=>SK.CUPS.map(c=>!!save.cups?.[c.id]?.won);
  B.ready=save=>SK.CUPS.every(c=>!!save.cups?.[c.id]?.won);
  B.drawFace=function(c,x,y,r){window.FamilyHeads?.draw(c,'matthieu','front',x-r*1.15,y-r*1.35,r*2.3,r*2.5);};
  B.open=function({save,onBack,onChallenge,previewCount=null,testPanel=false}){
    B.close();
    const earned=B.candles(save),candles=previewCount===null?earned:earned.map((_,i)=>i<previewCount),lit=candles.filter(Boolean).length,revealed=lit>=4,flames=[];
    const ready=candles.every(Boolean),cv=document.getElementById('throne-canvas'),c=cv.getContext('2d');
    cv.dataset.illumination=String(.8*lit/15);cv.dataset.bossRevealed=String(ready);cv.dataset.litCandles=lit;cv.dataset.roomRevealed=String(revealed);
    cv.setAttribute('aria-label',`${lit} chandelles allumées sur ${candles.length}. ${revealed?'Le fond de la salle est éclairé.':'Le fond de la salle reste dans le noir.'} ${ready?'Matthieu, le dernier boss, est révélé sur son trône.':'Une silhouette couronnée reste dans l’ombre sur son trône.'}`);
    const g=c.createRadialGradient(640,340,20,640,360,730);g.addColorStop(0,'#302337');g.addColorStop(.5,'#12111e');g.addColorStop(1,'#020308');c.fillStyle=g;c.fillRect(0,0,1280,720);
    // Perspective vers le fond de la salle : dallage, colonnes et tapis continu.
    c.fillStyle='#17121b';c.beginPath();c.moveTo(0,720);c.lineTo(470,385);c.lineTo(810,385);c.lineTo(1280,720);c.fill();
    c.strokeStyle='#29202b';c.lineWidth=2;
    for(const x of [-100,160,420,860,1120,1380]){c.beginPath();c.moveTo(640+(x-640)*.12,385);c.lineTo(x,720);c.stroke();}
    for(const y of [410,449,505,590,706]){c.beginPath();c.moveTo(0,y);c.lineTo(1280,y);c.stroke();}
    c.fillStyle='#4c192b';c.beginPath();c.moveTo(300,720);c.lineTo(591,388);c.lineTo(689,388);c.lineTo(980,720);c.closePath();c.fill();
    c.strokeStyle='#927044';c.lineWidth=3;for(const sign of [-1,1]){c.beginPath();c.moveTo(640+sign*42,395);c.lineTo(640+sign*315,720);c.stroke();}
    for(const sign of [-1,1])for(let i=0;i<7;i++){
      const depth=i/6,x=640+sign*(200+depth*390),y=320+depth*185,scale=.45+depth*.85;
      c.fillStyle='#1c1b29';c.fillRect(x-19*scale,90-depth*50,38*scale,y+70*scale-(90-depth*50));
      c.fillStyle='#292633';c.fillRect(x-28*scale,90-depth*50,56*scale,13*scale);
      c.fillStyle='#67503d';c.fillRect(x-11*scale,y+15*scale,22*scale,30*scale);c.fillRect(x-19*scale,y+13*scale,38*scale,7*scale);
      for(const [j,offset] of [0].entries()){
        c.fillStyle='#746652';c.fillRect(x+(offset-3)*scale,y-9*scale,6*scale,24*scale);
        c.fillStyle='#24202a';c.fillRect(x+(offset-1)*scale,y-13*scale,2*scale,5*scale);
        const index=(6-i)*2+(sign<0?0:1);
        if(candles[index])flames.push({x:x+offset*scale,y:y-17*scale,scale});
      }
    }
    c.save();c.translate(288,90);c.scale(.55,.55);
    // Trône massif, marche de pierre, velours sombre et couronne à peine éclairée.
    c.fillStyle='#33303b';c.fillRect(455,550,370,22);c.fillStyle='#24212b';c.fillRect(430,572,420,25);
    c.fillStyle='#57472d';c.beginPath();c.moveTo(505,530);c.lineTo(505,245);c.quadraticCurveTo(640,100,775,245);c.lineTo(775,530);c.closePath();c.fill();
    c.fillStyle='#27121e';c.beginPath();c.moveTo(524,505);c.lineTo(524,255);c.quadraticCurveTo(640,139,756,255);c.lineTo(756,505);c.fill();
    c.fillStyle='#4b3a29';for(const x of [493,760]){c.fillRect(x,407,28,142);c.fillRect(x-8,400,44,15);}
    c.restore();
    // Moins de quatre flammes : le décor du fond disparaît, pas la silhouette.
    c.fillStyle=`rgba(0,0,5,${1-.8*lit/15})`;c.fillRect(0,0,1280,720);
    if(!revealed){const rim=c.createRadialGradient(640,298,12,640,298,123);rim.addColorStop(0,'#191922');rim.addColorStop(1,'#08080e00');c.fillStyle=rim;c.fillRect(517,175,246,246);}
    // La quinzième coupe allume le chandelier à sept branches, près du trône.
    if(ready){const light=c.createRadialGradient(640,290,20,640,290,180);light.addColorStop(0,'#ffcd794d');light.addColorStop(1,'#ffcd7900');c.fillStyle=light;c.fillRect(460,110,360,360);}
    c.strokeStyle=ready?'#c9a653':'#423929';c.lineWidth=4;c.lineCap='round';
    c.beginPath();c.moveTo(749,394);c.lineTo(749,311);c.moveTo(732,396);c.lineTo(766,396);c.stroke();
    for(let branch=-3;branch<=3;branch++){const bx=749+branch*11,by=311+Math.abs(branch)*3;c.beginPath();c.moveTo(749,373);c.quadraticCurveTo(bx,373,bx,by+11);c.stroke();c.fillStyle=ready?'#ead9b7':'#5e5549';c.fillRect(bx-2,by,4,13);if(ready)flames.push({x:bx,y:by-6,scale:.45});}
    c.save();c.translate(288,90);c.scale(.55,.55);
    c.fillStyle='#05060b';c.beginPath();c.ellipse(640,300,42,52,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(599,343);c.quadraticCurveTo(640,328,681,343);c.lineTo(716,455);c.lineTo(565,455);c.closePath();c.fill();
    c.lineCap='round';c.lineWidth=30;c.strokeStyle='#05060b';for(const sign of [-1,1]){c.beginPath();c.moveTo(640+sign*40,363);c.lineTo(640+sign*79,420);c.lineTo(640+sign*105,415);c.stroke();c.lineWidth=38;c.beginPath();c.moveTo(640+sign*34,450);c.lineTo(640+sign*47,510);c.lineTo(640+sign*50,549);c.stroke();c.lineWidth=30;}
    if(ready)B.drawFace(c,640,300,42);
    c.fillStyle=ready?'#e8bc4b':revealed?'#65532d':'#18171b';c.strokeStyle=revealed?'#a08744':'#25232b';c.lineWidth=2;c.beginPath();c.moveTo(600,265);c.lineTo(593,226);c.lineTo(618,242);c.lineTo(640,214);c.lineTo(660,241);c.lineTo(686,225);c.lineTo(679,265);c.closePath();c.fill();c.stroke();
    c.restore();
    // Seules les récompenses réellement obtenues allument leur chandelle.
    for(const {x,y,scale} of flames){
      const glow=c.createRadialGradient(x,y,0,x,y,74*scale);glow.addColorStop(0,'#ed9d4b48');glow.addColorStop(1,'#ed9d4b00');c.fillStyle=glow;c.fillRect(x-74*scale,y-74*scale,148*scale,148*scale);
      c.fillStyle='#d8bd91';c.fillRect(x-3*scale,y+8*scale,6*scale,24*scale);
      c.fillStyle='#f2b45d';c.beginPath();c.ellipse(x,y,4*scale,10*scale,0,0,Math.PI*2);c.fill();c.fillStyle='#fff1b1';c.beginPath();c.ellipse(x,y+3*scale,2*scale,5*scale,0,0,Math.PI*2);c.fill();
    }
    const speech=document.getElementById('throne-speech'),next=document.getElementById('throne-next'),back=document.getElementById('throne-back'),challenge=document.getElementById('throne-challenge');
    const messages=ready?['Les quinze tournois… tous remportés ! Le dernier chandelier s’allume… Surprise ! C’était moi, Matthieu !','Tu as trouvé le dernier boss ! Alors, prêt à me défier ? Bwahahahaha !']:['Ah… je vois que tu n’as toujours pas obtenu tous les trophées… Bwahahahaha ! Reviens me voir lorsque tu auras tout remporté !','Allez, ouste !! Avant que je te botte les fesses ! Bwahahahaha !'];
    let page=0;
    function update(){speech.textContent=messages[page];const last=page===messages.length-1;next.hidden=last;back.hidden=!last;challenge.hidden=!last||!ready;challenge.disabled=!B.ready(save);challenge.title=challenge.disabled?'Aperçu : remporte les trophées dans ton aventure pour lancer le duel.':'';}
    next.onclick=()=>{if(page<messages.length-1){page++;update();back.focus();}};
    back.onclick=onBack;challenge.onclick=()=>{if(B.ready(save))onChallenge();};
    const key=e=>{if(e.code==='Escape'){e.preventDefault();onBack();}else if(e.code==='Enter'&&e.target===document.body&&!e.repeat){e.preventDefault();if(!next.hidden)next.click();else back.click();}};
    const panel=document.getElementById('throne-test-controls'),toggle=document.getElementById('throne-test-toggle');panel.hidden=!testPanel;toggle.setAttribute('aria-expanded',String(testPanel));
    toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
    document.getElementById('throne-test-count').textContent=`${lit} / ${candles.length} tournois${previewCount===null?' · Progression réelle':' · Aperçu'}`;
    const showPreview=count=>B.open({save,onBack,onChallenge,previewCount:count,testPanel:true});
    const less=document.getElementById('throne-test-less'),more=document.getElementById('throne-test-more');less.disabled=lit===0;more.disabled=lit===candles.length;
    less.onclick=()=>showPreview(Math.max(0,lit-1));more.onclick=()=>showPreview(Math.min(candles.length,lit+1));
    document.getElementById('throne-test-all').onclick=()=>showPreview(candles.length);document.getElementById('throne-test-reset').onclick=()=>showPreview(null);
    window.addEventListener('keydown',key);cleanup=()=>window.removeEventListener('keydown',key);update();next.focus();
  };
})(window.SK);
