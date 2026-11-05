// Nouveaux mondes dessinés dans le même style canvas que le reste du jeu.
(function(CB){
  'use strict';
  const R=CB.Render,{circle,ellipse,poly,box}=R.H,TAU=Math.PI*2;
  const face=(c,y=0)=>{circle(c,-.4,y,.16,'#19243c');circle(c,.4,y,.16,'#19243c');c.strokeStyle='#19243c';c.lineWidth=.09;c.beginPath();c.arc(0,y+.23,.24,0,Math.PI);c.stroke();};
  const wings=(c,t,col)=>{for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(Math.sin(t*7)*.15);ellipse(c,1.4,-.3,1,.35,col);ellipse(c,1.55,.05,.65,.23,col);c.restore();}};
  const glossy=(c,color)=>{circle(c,0,0,1.05,color);ellipse(c,-.35,-.5,.35,.18,'#ffffff88');face(c);};
  Object.assign(R.ENEMY,{
    bonbonAile(c,e,t){wings(c,t,'#fff1fa');glossy(c,e.color);},
    papillonJujube(c,e,t){for(const s of [-1,1]){ellipse(c,s*(1.05+Math.sin(t*5)*.1),-.5,.85,1,e.color);ellipse(c,s*.85,.6,.65,.6,'#f3a5dc');circle(c,s*1.1,-.5,.28,'#ffe4a4');}ellipse(c,0,0,.3,1.2,'#8462ac');face(c,-.55);},
    oursonJujube(c,e){circle(c,-.7,-1.1,.45,e.color);circle(c,.7,-1.1,.45,e.color);ellipse(c,0,.55,.9,1.1,e.color);for(const s of [-1,1]){circle(c,s*.85,.35,.4,e.color);circle(c,s*.55,1.3,.4,e.color);}glossy(c,e.color);},
    guimauve(c,e){box(c,-1,-1.1,2,2.2,.5,e.color);box(c,-.8,-.9,.4,1,.2,'#ffffffaa');face(c);},
    smore(c,e){box(c,-1.2,-1.15,2.4,.45,.15,'#d49c58');box(c,-1.05,-.7,2.1,1.15,.25,'#fff5ec');box(c,-1.2,.4,2.4,.4,.1,'#6c392e');box(c,-1.25,.8,2.5,.4,.15,'#d49c58');face(c,-.15);},
    fleurSucree(c,e,t){for(let i=0;i<6;i++){const a=i*TAU/6+t*.3;circle(c,Math.cos(a),Math.sin(a),.55,e.color);}circle(c,0,0,.7,'#ffdf71');face(c,-.1);},
    lettreFolle(c,e,t){c.save();c.rotate(Math.sin(t+e.phase)*.7);c.font='bold 3.3px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=e.color;c.fillText(['¿','Ж','Z','∑','?!'][Math.floor(e.phase)%5],0,0);face(c);c.restore();},
    tachePeinture(c,e,t){for(let i=0;i<7;i++){const a=i*TAU/7;ellipse(c,Math.cos(a)*.9,Math.sin(a)*.9,.5,.6,e.color);}glossy(c,e.color);},
    poissonParapluie(c,e,t){poly(c,[[-1,-.8],[0,-1.6],[1,-.8]],'#ffd565');c.strokeStyle='#ffe8ad';c.lineWidth=.1;c.beginPath();c.moveTo(0,-.8);c.lineTo(0,.6);c.stroke();ellipse(c,0,.4,1.15,.65,e.color);poly(c,[[1,.4],[1.7,-.2],[1.7,1]],'#ff8bbd');face(c,.2);},
    montagneFolle(c,e){poly(c,[[-1.4,1],[0,-1.7],[1.4,1]],e.color);poly(c,[[-.55,-.65],[0,-1.7],[.55,-.65],[.1,-.9],[-.1,-.6]],'#fff4f9');face(c,.25);},
    oeilChaos(c,e,t){ellipse(c,0,0,1.4,.9,e.color);circle(c,Math.sin(t)*.3,0,.6,'#fff');circle(c,Math.sin(t)*.3,0,.3,'#492b71');circle(c,Math.sin(t)*.3-.1,-.1,.1,'#fff');}
  });
  const bolt=R.ENEMY.bolt;
  R.ENEMY.bolt=(c,e,t)=>{
    if(e.chaosGlyph){c.fillStyle=e.color;c.font='bold 2.4px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(e.chaosGlyph,0,0);}
    else if(e.paintShot){for(let i=0;i<5;i++){const a=i*TAU/5;circle(c,Math.cos(a)*.7,Math.sin(a)*.7,.45,e.color);}circle(c,0,0,.7,e.color);ellipse(c,-.2,-.3,.2,.1,'#fff');}
    else bolt(c,e,t);
  };
  R.BOSS.roiGuimauve=(c,e,t)=>{c.save();c.scale(1.8,1.8);R.ENEMY.guimauve(c,{color:e.act===2?'#ffe2ad':'#ffd3eb'},t);poly(c,[[-1,-1.1],[-1.2,-1.9],[-.4,-1.5],[0,-2.2],[.4,-1.5],[1.2,-1.9],[1,-1.1]],'#ffd24e');for(const side of [-1,1])ellipse(c,side*1.6,.2,.8,.35,'#ffb6de');c.restore();};
  R.BOSS.chaosFinal=(c,e,t)=>{
    const phase=e.act||0;c.save();c.scale(1.7,1.7);
    if(phase===0){for(let i=0;i<5;i++){c.strokeStyle=['#ff6ebd','#6affdf','#ffda58'][i%3];c.lineWidth=.2;c.beginPath();for(let j=0;j<24;j++){const a=j/23*TAU,r=1.4+Math.sin(a*7+t*2+i)*.4;c.lineTo(Math.cos(a+i)*r,Math.sin(a+i)*r);}c.stroke();}face(c);}
    else if(phase===1){for(let i=0;i<8;i++){const a=t*.65+i*TAU/8;c.save();c.translate(Math.cos(a)*1.8,Math.sin(a)*1.8);c.rotate(-a);c.font='bold 1.1px Arial';c.fillStyle=['#ffe26b','#ff91dc','#7fffe4'][i%3];c.textAlign='center';c.fillText(['Z','¿','Ж','!','∑','M','?!','Ω'][i],0,0);c.restore();}R.ENEMY.oeilChaos(c,{color:'#a894ff'},t);}
    else{for(let i=0;i<12;i++){const a=i*TAU/12+t*.35;ellipse(c,Math.cos(a)*1.7,Math.sin(a)*1.7,.5,.65,['#ff70bc','#ffdf63','#74ebdb'][i%3]);}glossy(c,'#ffdb69');c.font='bold .5px Arial';c.textAlign='center';c.fillStyle='#73358b';c.fillText('BOUM ?',0,1);}
    c.restore();
  };
  const cloud=(c,x,y,s)=>{for(let i=0;i<5;i++)ellipse(c,x+(i-2)*s*.4,y-Math.sin(i*Math.PI/4)*s*.3,s*.5,s*.32,'#fff1fa');};
  const sweetDecor=(c,x,y,s)=>{c.strokeStyle='#71bb99';c.lineWidth=3*s;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-27*s);c.stroke();for(let i=0;i<5;i++){const a=i*TAU/5;circle(c,x+Math.cos(a)*10*s,y-27*s+Math.sin(a)*10*s,7*s,'#ffa9da');}circle(c,x,y-27*s,6*s,'#ffe896');};
  const background=R.background;
  R.background=(c,w,h,world,t,def)=>{
    const scene=world.scene||world.id;if(!['bonbons','chaos'].includes(scene))return background(c,w,h,world,t,def);
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,world.sky[0]);g.addColorStop(1,world.sky[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
    if(scene==='bonbons'){
      for(let i=0;i<9;i++)cloud(c,(i*193+t*3)%(w+240)-120,h*(.13+(i%3)*.13),55+i%3*20);
      for(let i=0;i<7;i++){const x=w*i/6;ellipse(c,x,h*.83,150,170+(i%2)*50,i%2?'#d6b2f2':'#f7bedc');box(c,x-35,h*.66,70,100,22,'#fff0f3');}
      for(let i=0;i<10;i++)cloud(c,w*(i+.5)/10,h*.98,80);for(let i=0;i<10;i++)sweetDecor(c,w*(i+.5)/10,h*.91,1.3);
    }else{
      for(let i=0;i<8;i++){const x=w*(i+.5)/8,flip=i%2?-1:1;c.save();c.translate(x,h*(i%2?.1:.85));c.scale(1,flip);poly(c,[[-100,0],[0,-160-i%3*30],[90,0]],['#714f9e','#9d6a98','#487fa1'][i%3]);c.restore();}
      for(let i=0;i<18;i++){const x=(i*137)%w,y=(i*83)%h;ellipse(c,x,y,20+i%3*9,7+i%4*4,['#ff6bb944','#77f3d944','#ffe36a44'][i%3]);}
      c.font='bold 32px Arial';c.textAlign='center';for(let i=0;i<9;i++){c.save();c.translate(w*(i+.5)/9,h*(.25+i%3*.15));c.rotate(Math.sin(t*.3+i)*.6);c.fillStyle=['#ffeaa0','#a0ffe5','#ffb1df'][i%3];c.fillText(['¿ Z !','MΩP','42 ?','ЖΣ'][i%4],0,0);c.restore();}
      // Des voyageurs décoratifs traversent le ciel dans les quatre directions.
      for(let i=0;i<4;i++){const q=(t*22+i*180)%(w+180)-90,x=i<2?(i?w-q:q):w*(.3+i*.15),y=i<2?h*(.22+i*.19):(i===2?q:h-q);const id=CB.PLAYERS[i+2].id;c.save();c.translate(x,y);c.rotate(Math.sin(t+i)*.2);box(c,-8,10,16,22,5,['#ffe26b','#ff92c9','#83f2da'][i%3]);window.FamilyHeads?.draw(c,id,'front',-16,-20,32,34);c.restore();}
    }
  };
  const life=CB.Map.life;
  CB.Map.life=(c,w,wi,n,t)=>{if(!['bonbons','chaos'].includes(w.id))return life?.(c,w,wi,n,t);for(let i=0;i<12;i++){const x=100+(i*177)%760,y=250+(i*91)%280;if(n.some(p=>Math.hypot(p[0]-x,p[1]-y)<48))continue;if(w.id==='bonbons'){cloud(c,x,y,28);sweetDecor(c,x,y,1);}else{c.save();c.translate(x,y);c.rotate(Math.sin(t*.4+i));c.font='bold 28px Arial';c.fillStyle=['#f9abdb','#8cf4dc','#ffe38a'][i%3];c.fillText(['¿','Ж','Ω','?!'][i%4],0,0);c.restore();}}};
})(window.CB);
