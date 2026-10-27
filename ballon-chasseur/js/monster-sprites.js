// Silhouettes originales en canevas : chaque espèce reste reconnaissable à l'échelle du terrain.
(function (BC) {
  'use strict';
  const S=BC.sprites;
  function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function line(c,pts,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  S.drawMonsterHead=function(c,d,x,y,r){
    if(window.MonsterHeads && window.MonsterHeads.draw(c,d.monster,x,y,r,d.portraitVariant||0))return;
    c.save();c.translate(x,y);c.scale(r/12,r/12);
    const k=d.monster,skin=d.look.skin,ink='#1c2631';
    if(['goblin','lizard','orc'].includes(k))for(const side of [-1,1])polygon(c,[[side*7,-5],[side*20,-10],[side*12,2]],skin);
    if(['beast','gnoll'].includes(k))for(const side of [-1,1]){polygon(c,[[side*5,-8],[side*12,-21],[side*15,-4]],skin);polygon(c,[[side*8,-10],[side*11,-16],[side*12,-7]],'#4a3b47');}
    if(k==='specter'){polygon(c,[[-14,10],[-12,-5],[0,-18],[12,-5],[14,10]],skin);ellipse(c,0,0,9,10,'#292544');}
    else if(k==='slime'){ellipse(c,0,2,15,11,skin);ellipse(c,-5,-3,4,2,'#e3ff9d');}
    else {ellipse(c,0,0,k==='troll'?15:12,k==='skeleton'?13:12,skin);}
    if(k==='witch'){polygon(c,[[-13,-3],[-12,14],[-6,8],[-6,-5]],'#493155');polygon(c,[[13,-3],[12,14],[6,8],[6,-5]],'#493155');polygon(c,[[-17,-9],[17,-9],[2,-14],[-3,-31],[-11,-12]],'#563c79');line(c,[[-11,-12],[7,-12]],'#e7b85c',3);}
    if(k==='lizard'){for(let i=0;i<4;i++)polygon(c,[[-9+i*5,-9],[-7+i*5,-18],[-3+i*5,-10]],'#edbd66');ellipse(c,4,4,12,6,skin);}
    if(k==='harpy'){for(let i=0;i<3;i++)polygon(c,[[-7+i*6,-8],[-6+i*6,-23],[2+i*6,-9]],'#7a568c');polygon(c,[[-3,1],[8,4],[-2,7]],'#f1c65a');}
    if(k==='troll'){ellipse(c,0,3,5,4,'#667d77');polygon(c,[[-12,-7],[-14,-15],[-7,-11]],'#c9d0ae');polygon(c,[[12,-7],[14,-15],[7,-11]],'#c9d0ae');}
    if(k==='mandrake'){for(const side of [-1,1])polygon(c,[[0,-10],[side*15,-26],[side*17,-12],[0,-6]],'#70a846');polygon(c,[[-3,-9],[0,-30],[8,-20],[4,-9]],'#a7ce63');}
    if(['beast','gnoll'].includes(k)){ellipse(c,3,5,9,6,'#e0c7a0');ellipse(c,7,3,3,2,ink);if(k==='gnoll')for(const [a,b] of [[-8,2],[-5,-8],[8,-5]])ellipse(c,a,b,1.8,2.2,'#6f5038');}
    const eyes=k==='skeleton'?4:2.5;
    for(const side of [-1,1]){ellipse(c,side*5,-2,eyes,eyes,k==='specter'?'#7ff4ed':ink);if(k!=='skeleton')ellipse(c,side*5+.5,-2.5,.75,1,'#fff8cf');}
    if(k==='skeleton'){polygon(c,[[-2,3],[0,0],[2,3]],ink);line(c,[[-6,8],[6,8]],ink,1.5);for(let i=-4;i<=4;i+=4)line(c,[[i,6],[i,10]],ink,1);}
    else if(k==='mandrake')ellipse(c,0,6,3.5,4.5,ink);
    else if(k!=='harpy'){line(c,[[-4,7],[4,7]],ink,1.3);if(['orc','beast','gnoll'].includes(k))for(const side of [-1,1])polygon(c,[[side*4,8],[side*6,1],[side*8,8]],'#fff2d7');}
    c.restore();
  };
  S.drawIllustratedMonster=function(c,x,y,d,team,o){
    const k=d.monster,pose=o.pose||'idle',t=o.t||0,frame=o.frame||0,walk=o.walkBlend??(o.moving?1:0),dir=o.dir||1,s=d.size*(o.scale||1);
    const width=['orc','troll'].includes(k)?34:k==='harpy'?33:30,height=40;
    c.save();c.translate(x,y);c.scale(dir*s,s);if(o.alpha!=null)c.globalAlpha=o.alpha;
    if(pose==='laugh'){const beat=Math.max(0,Math.sin(t*11));c.scale(1+beat*.035,1-beat*.045);c.rotate(Math.sin(t*5)*.025);}
    if(pose==='down')c.rotate(1.3);else if(pose==='hit')c.rotate(-.14);else if(pose==='throw')c.rotate(.07);else if(pose==='windup')c.rotate(-.035);
    if(k==='specter')c.translate(0,Math.sin(t*3)*2-2);
    if(walk)c.translate(0,-Math.abs(Math.sin(frame))*.8*walk);
    const arms=[];
    for(const side of [-1,1]){
      const shoulder=[side*(width*.34),-31];let upper=-side*.12,lower=-side*.06;
      if(walk){upper+=Math.sin(frame)*side*.28*walk;lower=upper-side*.15;}
      if(side>0){
        if(pose==='windup'){upper=-1.7;lower=-2.85;}
        else if(pose==='throw'){upper=-1.55;lower=-1.72;}
        else if(pose==='wave'){upper=-1.25;lower=-3+Math.sin(t*7)*.15;}
        else if(pose==='catch'){upper=-.8;lower=-1.6;}
        else if(pose==='pickup'){upper=-.4;lower=-.15;}
        else if(pose==='jump'||pose==='angel'){upper=-2.2;lower=-2.6;}
      }else{
        if(pose==='windup'||pose==='throw'){upper=.35;lower=-.8;}
        else if(pose==='catch'){upper=-.6;lower=-1.6;}
        else if(pose==='jump'||pose==='angel'){upper=2.2;lower=2.6;}
      }
      if(pose==='laugh'){upper=-side*.75;lower=side*.85;}
      const elbow=[shoulder[0]-Math.sin(upper)*8.5,shoulder[1]+Math.cos(upper)*8.5];
      const wrist=[elbow[0]-Math.sin(lower)*8.5,elbow[1]+Math.cos(lower)*8.5];
      arms.push({shoulder,elbow,wrist,side});
    }
    const art=window.MonsterBodyArt;
    // L'épaule arrière reste sous la tenue, la main qui lance passe devant.
    const back=arms[0],front=arms[1];art.arm(c,k,back.shoulder,back.elbow,back.wrist,back.side);
    art.body(c,k,width,height,!!o.moving,frame,pose);
    art.arm(c,k,front.shoulder,front.elbow,front.wrist,front.side);
    if(o.ball){const br=BC.BALL_R/d.size,bx=front.wrist[0]+(pose==='throw'?br*2:br*.7),by=front.wrist[1]-br*.65;S.drawBall(c,bx,by,br,{});art.arm(c,k,front.shoulder,front.elbow,front.wrist,front.side,true);}
    // Le menton chevauche légèrement le col, sans tête flottante.
    c.save();if(pose==='laugh'){c.translate(0,-43.5);c.rotate(-.1+Math.sin(t*11)*.045);c.translate(0,43.5);}
    if(!o.headless)S.drawMonsterHead(c,d,0,k==='slime'?-51:-43.5,12);
    c.restore();
    if(k==='slime'&&pose==='hit')for(const side of [-1,1])S.drawMonsterHead(c,d,side*25,-7,3.5);
    if(pose==='angel'){c.strokeStyle='#ffe493';c.lineWidth=1.7;c.beginPath();c.ellipse(0,-78,10,3,0,0,Math.PI*2);c.stroke();}
    c.restore();
  };
  S.drawMonster=function(c,x,y,d,team,o){
    if(window.MonsterBodyArt?.has(d.monster))return S.drawIllustratedMonster(c,x,y,d,team,o||{});
    o=o||{};const k=d.monster,s=d.size*(o.scale||1),pose=o.pose||'idle',t=o.t||0;
    const skin={goblin:'#90a94b',lizard:'#359c8e',witch:'#d6aacd',skeleton:'#e3d7b4',orc:'#819640',harpy:'#ce94b5',beast:'#87705b',slime:'#9edc30',specter:'#7968ba',troll:'#879e9f',gnoll:'#b38d55',mandrake:'#af864e'}[k],ink='#26303b';
    const grad=(color,x0,x1)=>{const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,S.shade(color,.66));g.addColorStop(.35,S.shade(color,1.12));g.addColorStop(1,S.shade(color,.8));return g;};
    const oval=(x,y,rx,ry,color)=>ellipse(c,x,y,rx,ry,grad(color,x-rx,x+rx));
    const plate=(x,y,w,h,color,r=3)=>{c.fillStyle=grad(color,x,x+w);S.rr(c,x,y,w,h,r);c.fill();c.strokeStyle=S.shade(color,.6);c.lineWidth=.65;c.stroke();};
    const rivet=(x,y)=>{ellipse(c,x,y,.85,.85,'#e5c488');ellipse(c,x+.2,y+.3,.35,.35,'#8d643b');};
    const limb=(points,color,width)=>{line(c,points,S.shade(color,.65),width+.8);line(c,points,color,width);line(c,points.map(([x,y])=>[x-.6,y]),S.shade(color,1.12),width*.35);};
    c.save();c.translate(x,y);c.scale((o.dir||1)*s,s);if(o.alpha!=null)c.globalAlpha=o.alpha;
    if(pose==='laugh'){const beat=Math.max(0,Math.sin(t*11));c.scale(1+beat*.035,1-beat*.045);c.rotate(Math.sin(t*5)*.025);}
    if(pose==='down')c.rotate(1.3);if(pose==='hit')c.rotate(-.14);if(pose==='throw')c.rotate(.08);if(k==='specter')c.translate(0,Math.sin(t*3)*2-3);
    const swing=o.moving?Math.sin(o.frame||0)*3:0;
    if(k==='skeleton'){limb([[-14,-12],[16,-52]],'#a5abb0',3);line(c,[[-16,-18],[-9,-12]],'#bf8b46',3);line(c,[[3,-36],[7,-39]],'#8e5b3a',1.3);}
    if(k==='witch'||k==='specter'){
      const coat=k==='witch'?'#58386e':'#55498c';
      polygon(c,[[-9,-38],[-18,-7],[-9,-11],[0,-4],[12,-9],[18,-5],[10,-38]],grad(coat,-18,18));
      for(const side of [-1,1])line(c,[[side*8,-33],[side*12,-10]],S.shade(coat,1.4),.7);
    }
    if(k==='harpy')for(const side of [-1,1]){
      const flap=Math.sin(t*5)*3,raised=pose==='jump'?8:0;
      for(let i=0;i<7;i++){const xx=side*(16+i*2.8),yy=-37+flap-raised+i*1.3;polygon(c,[[side*9,-33],[xx,yy-12],[xx+side*5,yy-10],[side*(17+i),-17+i*.5]],grad(i%2?'#a568a0':'#d4a3c5',-35,35));}
      limb([[side*8,-34],[side*22,-35+flap]],'#b77cad',2.5);
    }
    if(k==='lizard'){polygon(c,[[-8,-20],[-34,-7],[-26,-5],[-8,-10]],grad(skin,-34,-8));for(let i=0;i<4;i++)polygon(c,[[-12-i*4,-15+i],[-15-i*4,-20+i],[-18-i*4,-12+i]],'#cc9b43');}
    // Jambes et bottes : semelles, revers et attaches comme les personnages de la famille.
    if(!['slime','specter','mandrake'].includes(k))for(const side of [-1,1]){
      const xx=side*6,fx=side*8+side*swing;
      limb([[xx,-19],[side*7,-9],[fx,-3]],k==='skeleton'?skin:'#4b4145',k==='skeleton'?3:6);
      if(k==='harpy'){limb([[side*7,-9],[fx,-1]],'#d6ac5d',3);for(let i=-1;i<=1;i++)line(c,[[fx,-1],[fx+i*3,1]],'#f0d58b',1.5);}
      else{plate(fx-5,-6,11,7,k==='witch'?'#463047':'#4a4545',2);line(c,[[fx-5,.5],[fx+6,.5]],'#1b2430',1.3);plate(fx-4,-7,8,2,'#826c4f',.8);rivet(fx,-5);}
    }
    if(k==='slime'){
      if(!window.MonsterHeads?.has(k))oval(0,-15,23,18,skin);
      if(pose==='hit')for(const side of [-1,1]){oval(side*25,-4,7,6,skin);ellipse(c,side*25+1,-5,1,1,ink);ellipse(c,side*25-2,-7,2,1,'#dfff9a');}
    }else if(k==='specter'){
      polygon(c,[[-10,-37],[10,-37],[17,-3],[8,-8],[0,-1],[-8,-7],[-17,-3]],grad('#62509d',-17,17));
      for(const side of [-1,1])line(c,[[side*6,-31],[side*8,-15],[side*12,-6]],'#a08ac9',.8);
      oval(0,-31,2.5,3.5,'#55dcd9');
    }else if(k==='mandrake'){
      for(const side of [-1,1]){limb([[side*5,-17],[side*10,-3],[side*17,-1]],skin,4);line(c,[[side*10,-3],[side*12,1]],'#765c37',1.3);}
      oval(0,-25,14,17,skin);for(let i=-2;i<=2;i++)line(c,[[i*4,-36],[i*3-1,-28],[i*4,-14]],i%2?'#d6b476':'#876436',.75);
      polygon(c,[[-13,-32],[-18,-39],[-6,-35],[0,-31],[9,-36],[17,-39],[13,-31]],'#729746');
    }else{
      const cloth=k==='witch'?'#744b91':k==='skeleton'?'#4c5966':k==='harpy'?'#a56e9d':['orc','troll'].includes(k)?skin:'#66513c';
      plate(-12,-36,24,23,cloth,4);
      if(k==='witch'){
        polygon(c,[[-10,-27],[10,-27],[16,-5],[0,-8],[-16,-5]],grad('#744b91',-16,16));
        line(c,[[-12,-7],[0,-10],[12,-7]],'#d2ad65',1);for(let y=-32;y<-21;y+=4)rivet(0,y);
      }else if(k==='skeleton'){
        limb([[0,-34],[0,-17]],skin,2.8);for(let z=-30;z<=-20;z+=5){line(c,[[-8,z],[0,z+2],[8,z]],'#b8ad8a',3);line(c,[[-8,z-.6],[0,z+1.4],[8,z-.6]],'#f1e7c6',1.4);}
      }else if(k==='lizard'){
        oval(0,-25,7,10,'#c6b984');for(let y=-32;y<-17;y+=4)line(c,[[-5,y],[0,y+1],[5,y]],'#879762',.7);
        for(const side of [-1,1])for(let i=0;i<4;i++)line(c,[[side*9,-32+i*4],[side*10,-30+i*4]],'#68c2ac',1);
      }else if(['orc','troll'].includes(k)){
        for(const side of [-1,1])oval(side*5,-30,4.8,4,skin);
        line(c,[[0,-25],[0,-19]],S.shade(skin,.75),.7);
        if(k==='troll')for(const [xx,yy] of [[-7,-21],[8,-29],[-9,-33]]){oval(xx,yy,2.6,1.7,'#75924c');}
      }else if(k==='harpy'){
        for(let row=0;row<3;row++)for(let i=-1;i<=1;i++)polygon(c,[[i*5-3,-34+row*5],[i*5+3,-34+row*5],[i*5,-26+row*5]],row%2?'#daacca':'#bd8bb3');
      }else{
        line(c,[[-8,-34],[7,-17]],'#9b784b',3);line(c,[[-7,-34],[8,-17]],'#c2a16e',.6);
        for(const side of [-1,1])for(let i=0;i<3;i++)line(c,[[side*9,-31+i*4],[side*10,-30+i*4]],'#b7a07b',.7);
        if(k==='beast'||k==='gnoll')polygon(c,[[-12,-36],[-9,-28],[-5,-32],[0,-27],[5,-32],[10,-28],[12,-36]],grad('#79614d',-12,12));
      }
      if(k!=='harpy'){plate(-12,-17,24,3.5,'#44362e',.6);plate(-2.5,-18,5,5,'#bf9850',1);plate(-1.2,-16.8,2.4,2.5,'#4b3e30',.4);}
      if(['orc','troll','skeleton','goblin','gnoll'].includes(k))for(const side of [-1,1]){plate(side*12-6,-36,12,7,k==='skeleton'?'#76828d':'#745b43',3);rivet(side*12-3,-32);rivet(side*12+3,-32);if(k==='orc'||k==='troll')polygon(c,[[side*12-2,-35],[side*13,-42],[side*12+3,-35]],'#e7dfc5');}
    }
    // Bras articulés et mains : le coude se plie pour armer, puis se déplie au lancer.
    const raised=['windup','wave','angel','jump'].includes(pose),hx=raised?21:pose==='throw'?29:16,hy=raised?-46:pose==='throw'?-32:-16;
    for(const side of [-1,1]){
      const xx=side>0?hx:-16,yy=side>0?hy:-16,ex=side>0&&raised?20:side*16,ey=side>0&&raised?-30:-25;
      limb([[side*11,-32],[ex,ey],[xx,yy]],skin,k==='skeleton'?3:4.8);
      if(['goblin','orc','gnoll','beast'].includes(k))line(c,[[ex+(xx-ex)*.6,ey+(yy-ey)*.6],[ex+(xx-ex)*.8,ey+(yy-ey)*.8]],'#6d513a',5.5);
      oval(xx,yy,3,3.6,skin);oval(xx-side*2.3,yy-1,1.4,1.8,skin);
      if(k==='lizard'||k==='beast'||k==='gnoll')for(let i=-1;i<=1;i++)line(c,[[xx+i*1.5,yy+2.3],[xx+i*1.5,yy+3.5]],'#e7dfc1',.7);
    }
    if(o.ball)S.drawBall(c,hx+7,hy-6,BC.BALL_R/d.size,{});
    S.drawMonsterHead(c,d,0,k==='slime'?-22:-47,12);
    if(pose==='angel'){c.strokeStyle='#ffe493';c.lineWidth=2;c.beginPath();c.ellipse(0,-77,10,3,0,0,Math.PI*2);c.stroke();}
    c.restore();
  };

})(window.BC);
