// Costumes assortis : tous les détails suivent les mêmes articulations que les habits ordinaires.
(function(SK){
  'use strict';
  SK.FANCY_COSTUMES=[
    {id:'clown',name:'Clown confettis',top:'#e9b83f',pants:'#4256a2',accent:'#eb507c',trim:'#563d76',hat:'Chapeau de clown',desc:'Veste bicolore, gros boutons, pois multicolores et col à volants.'},
    {id:'peter-pan',name:'Peter Pan',top:'#489449',pants:'#326d40',accent:'#a3c95c',trim:'#644633',hat:'Chapeau de Peter Pan',desc:'Tunique verte à pointes, laçage et ceinture brune.'},
    {id:'squelette',name:'Squelette',top:'#252a34',pants:'#222733',accent:'#f1eddf',trim:'#121a25',hat:'Capuche squelette',desc:'Costume noir avec côtes, colonne et os des bras bien visibles.'},
    {id:'lapin-paques',name:'Lapin de Pâques',top:'#eae8f1',pants:'#dfdfe9',accent:'#eea8c3',trim:'#86758e',hat:'Oreilles du lapin de Pâques',desc:'Habit tout doux, ventre rose, nœud papillon et petite queue ronde au dos.'},
    {id:'ash',name:'Ash · Pokémon',top:'#3467bc',pants:'#456f9b',accent:'#efd65b',trim:'#253952',hat:'Casquette d’Ash',desc:'Veste bleue à manches blanches, col et poches jaunes, sur un chandail noir.'},
    {id:'charizard',name:'Charizard',top:'#e98136',pants:'#cc6a2c',accent:'#f6d99b',trim:'#814331',hat:'Capuche Charizard',desc:'Habit orange à ventre crème et ailes turquoise dessinées au dos.'},
    {id:'elsa',name:'Elsa · Reine des neiges',top:'#67c6db',pants:'#b3e0ec',accent:'#edfaff',trim:'#498fae',hat:'Diadème d’Elsa',desc:'Robe de neige turquoise, jupe évasée, manches givrées et cristaux argentés.'}
  ];
  for(const it of SK.FANCY_COSTUMES){
    SK.JACKET_STYLES[it.top]={main:it.top,panel:it.accent,trim:it.trim,collection:'fancy-'+it.id,neck:true,fancy:it.id};
    SK.PANT_STYLES[it.pants]={type:'fancy-'+it.id,accent:it.accent,fancy:it.id};
    for(const [slot,value,name,price] of [['jacket',it.top,it.id==='elsa'?'Robe d’Elsa':'Habit '+it.name,260],['pants',it.pants,it.id==='elsa'?'Leggings givrés d’Elsa':'Pantalon '+it.name,160],['hat','costume-'+it.id,it.hat,140]])SK.WARDROBE.push({id:slot+'-'+it.id,slot,value,name,price,cat:'linge',newCollection:true,fancy:it.id,desc:slot==='jacket'?it.desc:slot==='pants'?'Bas assorti au costume '+it.name+'.':'Coiffe assortie au costume '+it.name+'.',});
  }
  const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const line=(c,pts,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const box=(c,x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
  const poly=(c,pts,color)=>{c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  const crystal=(c,x,y,r)=>{c.save();c.translate(x,y);for(let k=0;k<6;k++){c.rotate(Math.PI/3);line(c,[[0,0],[0,-r]],'#edfaff',r*.12);line(c,[[-r*.22,-r*.53],[0,-r*.72],[r*.22,-r*.53]],'#edfaff',r*.08);}c.restore();};
  const oldJacket=SK.drawJacket;
  SK.drawJacket=function(c,color,x,y,s,view='front',torsoOnly=false){
    oldJacket(c,color,x,y,s,view,torsoOnly);const p=SK.jacketPalette(color),id=p.fancy;if(!id)return;
    const back=view==='back',side=view==='side';c.save();c.translate(x,y);c.scale(s,s);c.lineCap='round';c.lineJoin='round';c.save();c.beginPath();c.roundRect(side?-.40:-.52,-.79,side?.78:1.04,1.77,.10);c.clip();
    if(id==='clown'){
      box(c,-.6,-.8,.6,1.8,0,'#548bc5');for(const [px,py,col]of [[-.30,-.44,'#ffe86c'],[.32,-.23,'#e94a79'],[-.31,.18,'#ff7851'],[.32,.45,'#5676cf'],[-.25,.72,'#b7e36b']])oval(c,px,py,.10,.10,col);
      if(!back)for(const yy of [-.23,.12,.47])oval(c,0,yy,.085,.085,'#eb507c');
    }else if(id==='peter-pan'){
      if(!back){poly(c,[[-.26,-.80],[0,-.42],[.26,-.80]],'#c7dfa0');for(let i=0;i<3;i++)line(c,[[-.07,-.46+i*.10],[.07,-.38+i*.10]],'#674a30',.025);}
      box(c,-.55,.36,1.1,.17,0,'#694931');if(!back&&!side){c.strokeStyle='#e9c268';c.lineWidth=.045;c.strokeRect(-.11,.34,.22,.21);}
      poly(c,[[-.55,.80],[-.33,.98],[-.13,.80],[.1,.98],[.31,.80],[.55,.98],[.55,.72],[-.55,.72]],'#a3c95c');
    }else if(id==='squelette'){
      line(c,[[0,-.62],[0,.69]],p.panel,.055);for(let k=0;k<4;k++)for(const sign of [-1,1]){c.strokeStyle=p.panel;c.lineWidth=.06;c.beginPath();c.moveTo(sign*.03,-.53+k*.20);c.bezierCurveTo(sign*.44,-.62+k*.20,sign*.45,-.34+k*.20,sign*.12,-.28+k*.20);c.stroke();}
      line(c,[[-.33,.67],[0,.80],[.33,.67]],p.panel,.09);
    }else if(id==='lapin-paques'){
      if(back)oval(c,0,.70,.19,.20,'#ffffff');else{oval(c,side?.16:0,.20,side?.25:.35,.56,'#f3c6d8');poly(c,[[-.02,-.45],[-.27,-.60],[-.28,-.28]],'#8b80c9');poly(c,[[.02,-.45],[.27,-.60],[.28,-.28]],'#8b80c9');oval(c,0,-.45,.07,.07,'#e9bf50');}
    }else if(id==='ash'){
      if(!back){box(c,-.15,-.8,.3,1.75,0,'#202b3d');for(const sign of [-1,1]){poly(c,[[sign*.06,-.79],[sign*.36,-.72],[sign*.19,-.32]],'#f4f4e9');box(c,sign<0?-.45:.20,.29,.25,.12,.02,p.panel);}}
      box(c,-.55,.84,1.1,.10,0,p.panel);
    }else if(id==='charizard'){
      if(!back){oval(c,side?.16:0,.18,side?.24:.36,.63,p.panel);for(const yy of [.02,.27,.52])line(c,[[-.21,yy],[.21,yy]],'#ddb27a',.025);}
      else for(const sign of [-1,1]){poly(c,[[sign*.05,-.42],[sign*.47,-.68],[sign*.46,.37],[sign*.30,.19],[sign*.17,.40],[sign*.05,.07]],'#327e91');line(c,[[sign*.05,-.42],[sign*.38,-.30],[sign*.46,.37]],'#f6d99b',.035);}
    }else if(id==='elsa'){
      poly(c,[[-.52,-.77],[0,-.48],[.52,-.77],[.39,.43],[0,.66],[-.39,.43]],'#85d8e7');for(const [xx,yy,r]of [[0,-.12,.23],[-.30,.30,.10],[.29,.33,.10]])crystal(c,xx,yy,r);line(c,[[-.5,.67],[0,.78],[.5,.67]],'#edfaff',.045);
    }
    c.restore();
    if(id==='clown')for(let k=0;k<7;k++)oval(c,-.36+k*.12,-.66+Math.sin(k*Math.PI/6)*.10,.095,.10,'#fff7e4');
    if(id==='peter-pan')for(const sign of [-1,1])poly(c,[[0,-.68],[sign*.37,-.85],[sign*.28,-.43]],'#a3c95c');
    if(id==='elsa'&&!torsoOnly)SK.drawFancySkirt(c,{jacket:color},0,.96,1,view,side?.43:.55);
    c.restore();
  };
  const oldSleeve=SK.drawCollectionSleeve;
  SK.drawCollectionSleeve=function(c,L,sx,sy,ex,ey,hx,hy,s){
    const result=oldSleeve(c,L,sx,sy,ex,ey,hx,hy,s),p=SK.jacketPalette(L.jacket);if(!p.fancy)return result;
    c.save();c.lineCap='butt';c.lineJoin='round';
    if(p.fancy==='squelette'){line(c,[[sx,sy],[ex,ey],[hx,hy]],'#f1eddf',s*.065);for(const [x,y]of [[sx,sy],[ex,ey],[hx,hy]])oval(c,x,y,s*.048,s*.045,'#f1eddf');}
    if(p.fancy==='ash'||p.fancy==='elsa')line(c,[[sx,sy],[ex,ey],[hx,hy]],p.fancy==='ash'?'#f3f3e9':'#c4edf4',s*.16);
    if(p.fancy==='clown')for(const q of [.35,.72]){
      // Keep the dots on the bent sleeve, including waves and board grabs.
      const a=q<.5?[sx,sy]:[ex,ey],b=q<.5?[ex,ey]:[hx,hy],u=q<.5?q*2:(q-.5)*2;
      oval(c,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,s*.055,s*.055,q<.5?'#ed507b':'#b7e36b');
    }
    if(p.fancy==='charizard')line(c,[[hx+(ex-hx)*.15,hy+(ey-hy)*.15],[hx,hy]],'#f6d99b',s*.18);
    c.restore();return true;
  };
  const oldPantDetail=SK.drawCollectionPantDetail;
  SK.drawCollectionPantDetail=function(c,color,w,h,s,upper){
    const p=SK.PANT_STYLES[color];if(!p?.fancy)return oldPantDetail(c,color,w,h,s,upper);
    c.save();c.lineCap='round';
    if(p.fancy==='squelette'){line(c,[[0,h*.12],[0,h*.88]],p.accent,s*.05);for(const yy of [h*.12,h*.88])for(const sign of [-1,1])oval(c,sign*w*.075,yy,s*.035,s*.035,p.accent);}
    else if(p.fancy==='clown')for(const [xx,yy,col]of [[-.18,.3,'#ffcf4b'],[.17,.68,'#ee5482']])oval(c,xx*w,yy*h,w*.17,w*.17,col);
    else if(p.fancy==='lapin-paques'&&!upper)box(c,-w*.45,h-s*.12,w*.9,s*.13,.02,'#f4bed4');
    else if(p.fancy==='charizard'&&!upper)for(const xx of [-.22,0,.22])poly(c,[[xx*w-w*.12,h],[xx*w,h-s*.13],[xx*w+w*.12,h]],'#f6e5bf');
    else if(p.fancy==='elsa'){line(c,[[w*.24,0],[w*.24,h]],'#f2fcff',s*.014);if(!upper)crystal(c,0,h*.55,w*.25);}
    else{line(c,[[w*.30,0],[w*.30,h]],'#d7dbb780',s*.012);if(upper){c.strokeStyle='#d7dbb780';c.lineWidth=s*.01;c.strokeRect(-w*.25,h*.2,w*.5,h*.35);}}
    c.restore();return true;
  };
  SK.drawFancySkirt=function(c,L,x,y,s,view='front',waistHalf,length=1){
    if(SK.jacketPalette(L.jacket).fancy!=='elsa')return;
    c.save();c.translate(x,y);c.scale(s,s*length);const side=view==='side',top=waistHalf??(side?.163:.325),w=top*(side?1.30:1.42);
    c.beginPath();c.moveTo(-top,-.09);c.lineTo(top,-.09);c.quadraticCurveTo(top,.31,w,.66);c.quadraticCurveTo(0,.82,-w,.66);c.quadraticCurveTo(-top,.31,-top,-.09);c.closePath();
    const g=c.createLinearGradient(-w,0,w,0);g.addColorStop(0,'#57adcc');g.addColorStop(.45,'#b9ecf5');g.addColorStop(1,'#5cb7d1');c.fillStyle=g;c.fill();c.strokeStyle='#498fae';c.lineWidth=.012;c.stroke();
    for(const sign of [-1,1])line(c,[[sign*w*.34,.06],[sign*w*.70,.65]],'#e9fbff99',.012);crystal(c,0,.49,.115);c.restore();
  };
  const oldHead=SK.drawHeadwear;
  SK.drawHeadwear=function(c,kind,color,x,y,w,h,view='front',worn=false){
    const it=SK.FANCY_COSTUMES.find(v=>kind==='costume-'+v.id);if(!it)return oldHead(c,kind,color,x,y,w,h,view,worn);
    const id=it.id,side=view==='side',back=view==='back';c.save();c.translate(x,y);c.scale(w,h);c.lineJoin='round';c.lineCap='round';
    if(id==='clown'){
      poly(c,[[-.31,.57],[.02,.03],[.36,.57]],'#8354b2');oval(c,.02,.07,.09,.11,'#f6d550');oval(c,-.08,.34,.06,.07,'#f6d550');oval(c,.14,.48,.055,.065,'#ee5382');box(c,-.42,.55,.86,.12,.05,'#e95a84');
      for(const sign of [-1,1])for(let k=0;k<3;k++)oval(c,sign*(.39+k*.04),.59+k*.10,.10,.11,'#f18236');
      if(worn&&!back)oval(c,side?.44:0,1.29,.09,.12,'#e64251');
    }else if(id==='peter-pan'){
      poly(c,[[-.54,.59],[-.20,.13],[.42,.08],[.24,.32],[.54,.59]],'#4d994b');poly(c,[[-.54,.59],[0,.44],[.54,.59],[.37,.72],[-.43,.71]],'#8fc45b');
      c.strokeStyle='#d74643';c.lineWidth=.07;c.beginPath();c.moveTo(.21,.46);c.quadraticCurveTo(.34,.13,.56,.04);c.stroke();line(c,[[.25,.35],[.48,.10]],'#f6b06b',.025);
    }else if(id==='lapin-paques'){
      for(const sign of [-1,1]){oval(c,sign*.25,.29,.13,.28,'#f2eff5');oval(c,sign*.25,.29,.065,.21,'#eeb2cd');}
      box(c,-.48,.52,.96,.19,.08,'#f2eff5');
    }else if(id==='ash'){
      c.fillStyle='#dc4145';c.beginPath();c.moveTo(-.5,.58);c.bezierCurveTo(-.47,-.16,.45,-.16,.50,.58);c.closePath();c.fill();
      if(!back){box(c,side?.03:-.23,.20,side?.32:.46,.36,.05,'#fff9ec');line(c,[[side?.12:-.10,.49],[side?.23:.04,.30],[side?.32:.15,.33]],'#43815c',.035);}
      oval(c,side?.38:0,.62,side?.39:.53,.09,'#dc4145');
    }else if(id==='charizard'){
      c.fillStyle='#e98136';c.beginPath();c.moveTo(-.49,.66);c.bezierCurveTo(-.52,-.12,.52,-.12,.49,.66);c.closePath();c.fill();for(const sign of [-1,1])poly(c,[[sign*.24,.28],[sign*.40,.02],[sign*.46,.39]],'#f6d99b');
      if(!back){for(const xx of side?[.29]:[-.24,.24]){oval(c,xx,.43,.105,.095,'#f8f4d8');oval(c,xx+.02,.43,.045,.07,'#34788b');}for(const xx of [-.28,-.1,.1,.28])poly(c,[[xx-.05,.64],[xx,.75],[xx+.05,.64]],'#fff7de');}
    }else if(id==='squelette'){
      c.fillStyle='#252a34';c.beginPath();c.moveTo(-.5,.65);c.bezierCurveTo(-.51,-.16,.51,-.16,.5,.65);c.closePath();c.fill();if(!back){oval(c,side?.2:0,.38,.15,.17,'#f1eddf');for(const xx of [-.055,.055])oval(c,(side?.2:0)+xx,.36,.035,.045,'#252a34');box(c,(side?.2:0)-.09,.46,.18,.08,.02,'#f1eddf');}}
    else{
      poly(c,[[-.44,.59],[-.45,.32],[-.24,.43],[0,.07],[.24,.43],[.45,.32],[.44,.59]],'#bce7f2');line(c,[[-.44,.59],[.44,.59]],'#f6fdff',.045);poly(c,[[0,.20],[.085,.35],[0,.49],[-.085,.35]],'#5bb8df');for(const xx of [-.27,.27])oval(c,xx,.49,.035,.05,'#fffefa');
    }c.restore();
  };
})(window.SK);
