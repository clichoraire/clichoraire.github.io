// Jérémie : motifs cosmétiques achetés une fois, application payante par planche.
(function(SK){
  'use strict';const S=SK.Shop,TAU=Math.PI*2;
  S.mountMotifWall=function(section,save,onChange){
    section.classList.add('motif-wall');const panel=document.createElement('div');panel.className='motif-workshop';
    panel.innerHTML='<h2>Les motifs de Jérémie</h2><div class="motif-catalog"></div><div class="motif-service"><button>Changer son motif<br> 50 pièces</button></div>';
    panel.querySelector('.motif-service button').onclick=()=>S.openBoardSkins(save,save.boards.includes(save.advBoard)?save.advBoard:save.boards[0],onChange);
    const catalog=panel.querySelector('.motif-catalog'),rackSize=7;
    const racks=[];for(let i=0;i<Math.ceil(SK.BOARD_MOTIFS.length/rackSize);i++){const rack=document.createElement('div');rack.className='motif-rack';rack.setAttribute('role','group');rack.setAttribute('aria-label','Présentoir de motifs '+(i+1));catalog.append(rack);racks.push(rack);}
    for(const [index,motif] of SK.BOARD_MOTIFS.entries()){const owned=SK.ownsBoardSkin(save,motif.id),button=document.createElement('button');button.dataset.motif=motif.id;button.style.setProperty('--stack',index%rackSize);button.style.setProperty('--lean',((index%3)-1)*3+'deg');button.className='motif-offer';button.title=motif.name;button.setAttribute('aria-label',motif.name+' — '+(owned?'Déjà obtenu':motif.price+' pièces'));const cv=document.createElement('canvas');cv.width=300;cv.height=300;S.drawItem(cv.getContext('2d'),{...motif,kind:'board'},150,150,100,0,true);SK.animateBoardPreview(cv,{...motif,kind:'board'},150,150,100);button.append(cv);const name=document.createElement('strong');name.textContent=motif.name;const price=document.createElement('span');price.className='product-price';price.innerHTML=owned?'✓ Obtenu':'<img src="'+SK.COIN_SVG+'" alt="pièces"> '+motif.price;button.append(name,price);button.onclick=()=>purchase(motif,save,onChange);racks[Math.floor(index/rackSize)].append(button);}
    section.append(panel);
  };
  function purchase(motif,save,onChange){
    const owned=SK.ownsBoardSkin(save,motif.id),dialog=document.createElement('dialog');dialog.className='board-skin-dialog motif-purchase';dialog.setAttribute('aria-label','Motif '+motif.name);
    dialog.innerHTML='<h2></h2><canvas width="300" height="330"></canvas><p class="motif-description"></p><p class="motif-price"></p><div class="skin-actions"><button class="cancel">Retour</button><button class="buy"></button></div>';
    dialog.querySelector('h2').textContent=motif.name;dialog.querySelector('.motif-description').textContent=motif.desc;
    dialog.querySelector('.motif-price').textContent=owned?'Ce motif est déjà dans ta collection. Jérémie peut l’appliquer pour 50 pièces.':'Acheter ce motif pour '+motif.price+' pièces ? Il restera disponible pour toutes tes planches. L’application coûte ensuite 50 pièces.';
    const cv=dialog.querySelector('canvas');S.drawItem(cv.getContext('2d'),{...motif,kind:'board'},150,165,105,0,true);SK.animateBoardPreview(cv,{...motif,kind:'board'},150,165,105);
    const buy=dialog.querySelector('.buy');buy.textContent=owned?'Déjà obtenu':save.gold<motif.price?'Il manque '+(motif.price-save.gold)+' pièces':'Confirmer l’achat · '+motif.price+' pièces';buy.disabled=owned||save.gold<motif.price;
    const close=()=>{dialog.close();dialog.remove();};dialog.querySelector('.cancel').onclick=close;
    buy.onclick=()=>{if(SK.buyBoardMotif(save,motif.id)==='bought'){onChange();SK.Audio.sfx('buy');close();}};dialog.onclose=()=>dialog.remove();dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());document.body.append(dialog);dialog.showModal();
  }
  SK.drawMotif=function(c,pattern,s,t,steer){
    t=((t%8)+8)%8;c.save();c.scale(s,s);const p=t*TAU/8;
    const line=(pts,col,width)=>{c.strokeStyle=col;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
    const oval=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
    const poly=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
    const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    if(pattern==='custom-banana'){
      rect(-.5,-1.6,1,3.2,'#126e78');
      for(let i=0;i<5;i++){c.save();c.translate((i%2?1:-1)*.12,-1+i*.48);c.rotate((i%2?1:-1)*.5);c.fillStyle='#ffdf40';c.strokeStyle='#a67421';c.lineWidth=.025;c.beginPath();c.moveTo(-.21,-.12);c.bezierCurveTo(-.05,.20,.22,.20,.23,-.16);c.bezierCurveTo(.1,.04,-.05,.04,-.21,-.12);c.fill();c.stroke();line([[-.18,-.08],[-.22,-.16]],'#754627',.045);c.restore();}
    }else if(pattern==='custom-electric'){
      for(let k=0;k<3;k++){const pts=[];for(let j=0;j<=16;j++)pts.push([Math.sin(p*4+j*2.4+k*2)*.15+(k-1)*.12,-1.25+j*.16]);line(pts,'#075b9c',.065);line(pts,k===1?'#fff783':'#45efff',.018);}
    }else if(pattern==='custom-molten'){
      for(let k=0;k<4;k++){const pts=[];for(let j=0;j<10;j++)pts.push([Math.sin(j*1.8+k)*.13+(k-1.5)*.15,-1.3+j*.3]);line(pts,'#731f19',.07);line(pts,'#ff5a12',.035);line(pts,'rgba(255,225,50,'+(.45+.4*Math.sin(p+k))+')',.014);}
      for(let i=0;i<8;i++)oval(Math.sin(i*7)*.25,-1+i*.3,.022*(1+.3*Math.sin(p+i)),.03,'#ff9c16');
    }else if(pattern==='custom-synthwave'){
      for(let x=-.4;x<.5;x+=.1)line([[x*.1,-1.3],[x,1.3]],'#32e9ea',.012);
      for(let i=-8;i<9;i++){const y=((i/8+t/4)%2+2)%2-1;line([[-.4,y],[.4,y]],'#ff48cf',.014);}
      oval(0,-.76,.19,.19,'#ff8baa');for(let i=0;i<5;i++)rect(-.22,-.77+i*.045,.44,.018,'#180c36');
    }else if(pattern==='custom-cosmic'){
      for(let i=0;i<35;i++){const x=Math.sin(i*71)*.31,y=Math.cos(i*19)*1.15,a=.25+.75*(.5+.5*Math.sin(p+i));oval(x,y,.009+(i%3)*.003,.012,'rgba(224,225,255,'+a+')');}
      const q=(t%8)/8;if(q<.38){const y=-1.5+q*8,x=-.25+q*1.3;line([[x-.12,y-.4],[x,y]],'#b78aff',.025);oval(x,y,.025,.04,'#fff7dd');}
    }else if(pattern==='custom-snow-shark'){
      poly([[-.33,1.2],[-.3,.48],[0,.22],[.3,.48],[.33,1.2]],'#eaf7fa');oval(0,.82,.25,.4,'#551f35');oval(0,.98,.14,.16,'#de657c');
      for(let i=0;i<6;i++){const x=-.21+i*.084;poly([[x-.043,.54],[x+.043,.54],[x,.73+(i%2)*.05]],'#fff');poly([[x-.043,1.12],[x+.043,1.12],[x,.94]],'#fff');}
      for(const side of [-1,1]){oval(side*.16,.16,.075,.10,'#fff');oval(side*.16+steer*.032,.17,.034,.065,'#132b3e');}poly([[-.12,-.68],[.13,-1.06],[.15,-.52]],'#33788c');
    }else if(pattern==='custom-reptile'){
      for(let y=-1.2;y<1.3;y+=.15)for(let x=-.4;x<.5;x+=.15){c.strokeStyle='#83b66a';c.lineWidth=.013;c.beginPath();c.arc(x+(Math.round(y/.15)%2)*.075,y,.085,0,Math.PI);c.stroke();}
      for(const side of [-1,1]){oval(side*.14,-.80,.11,.15,'#dbe94a');oval(side*.14,-.80,.018,.13,'#12231b');oval(side*.11,-.84,.016,.026,'#fff');}
    }else if(pattern==='custom-fossil'){
      const bone='#e7d8b5';line([[0,-.68],[.05,-.3],[-.04,.1],[0,.48],[-.15,.92],[-.1,1.13]],bone,.045);
      for(let j=0;j<7;j++){const y=-.4+j*.12;line([[-.19,y+.06],[0,y],[.19,y+.06]],bone,.025);}
      poly([[-.13,-.98],[.16,-1.03],[.24,-.9],[.2,-.76],[-.1,-.73]],bone);oval(.08,-.90,.055,.055,'#493b35');for(let j=0;j<4;j++)poly([[j*.07-.08,-.75],[j*.07-.03,-.75],[j*.07-.05,-.65]],bone);
      for(const side of [-1,1]){line([[0,.25],[side*.19,.46],[side*.12,.72],[side*.26,.76]],bone,.04);line([[0,-.27],[side*.17,-.12],[side*.23,-.2]],bone,.03);}
    }else if(pattern==='custom-claws'){
      for(let x=-.3;x<.4;x+=.08)line([[x,-1.3],[x+.03,1.3]],'#754525',.009);
      for(let i=0;i<3;i++){const x=-.20+i*.17;poly([[x+.1,-1],[x-.09,.95],[x+.02,.7],[x+.18,-.85]],'#251c21');line([[x+.12,-.95],[x-.04,.82]],'#edc392',.015);}
    }else if(pattern==='custom-polar'){
      const g=c.createLinearGradient(-.3,-1,.3,1);g.addColorStop(0,'#ffffffb0');g.addColorStop(.5,'#b7f6fa30');g.addColorStop(1,'#247bab99');c.fillStyle=g;c.fillRect(-.4,-1.3,.8,2.6);
      for(let i=0;i<18;i++){const x=Math.sin(i*23)*.26,y=Math.cos(i*13)*1.1,r=.015+(i%3)*.014;oval(x,y,r,r*1.4,'#dfffff7a');c.strokeStyle='#e9ffff';c.lineWidth=.006;c.stroke();}
      line([[-.3,-.95],[.08,-.55],[-.14,-.12],[.25,.2],[.06,.6],[.3,1]],'#ecffffb0',.013);
    }else if(pattern==='custom-timber'){
      rect(-.4,-1.3,.12,2.6,'#5c4031');rect(.28,-1.3,.12,2.6,'#5c4031');
      for(let k=0;k<9;k++){c.strokeStyle=k%2?'#805631':'#ecd3a0';c.lineWidth=.01;c.beginPath();c.moveTo(-.28+k*.07,-1.3);c.bezierCurveTo(-.35+k*.08,-.5,-.2+k*.065,.3,-.28+k*.07,1.3);c.stroke();}
      for(const y of [-.75,.15,.83]){oval(.04,y,.09,.14,'#95633c');oval(.04,y,.045,.075,'#d5b17c');oval(.04,y,.015,.03,'#64402b');}
    }else if(pattern==='custom-circuit'){
      for(let i=0;i<7;i++){const y=-1.1+i*.35;line([[-.3,y],[-.12,y],[-.06,y+.10],[.23,y+.10],[.3,y+.18]],i%2?'#72ba67':'#c7a342',.013);oval(-.26,y,.026,.026,'#b1d88a');}
      for(const y of [-.4,.4]){rect(-.12,y-.12,.24,.24,'#10151e');for(let j=0;j<4;j++){rect(-.18,y-.09+j*.06,.06,.025,'#d0b75c');rect(.12,y-.09+j*.06,.06,.025,'#d0b75c');}oval(.21,y,.035,.035,'rgba(69,255,154,'+(.25+.75*(.5+.5*Math.sin(p*2+y*9)))+')');}
    }else if(pattern==='custom-carbon'){
      for(let y=-1.3;y<1.3;y+=.065)for(let x=-.4;x<.4;x+=.065)rect(x,y,.06,.06,(Math.round(x/.065)+Math.round(y/.065))%2?'#424a52':'#161e26');
      const g=c.createLinearGradient(-.12,0,.12,0);g.addColorStop(0,'#697885');g.addColorStop(.5,'#d5dfe4');g.addColorStop(1,'#556471');c.fillStyle=g;c.fillRect(-.09,-1.3,.18,2.6);for(let y=-1.3;y<1.3;y+=.018)rect(-.09,y,.18,.003,'#ffffff55');line([[.13,-1.3],[.13,1.3]],'#f15b38',.016);
    }
    c.restore();
  };
})(window.SK);
