// Sprites des références utilisateur. Découpe et transparence au chargement, sans redessiner les poses.
(function(SK) {
  'use strict';
  const S=SK.Sprites={}, frames={}, cache=new Map();
  // Même dessin de botte, dimensionné aux pieds de chaque pose.
  SK.drawGripBoot=function(c,x,y,w,h,side=1){
    c.save();c.translate(x+(side<0?w:0),y);c.scale(side*w,h);
    c.fillStyle='#263845';c.beginPath();c.moveTo(.12,.06);c.lineTo(.84,.06);c.lineTo(.82,.68);c.quadraticCurveTo(1,.71,1,.9);c.lineTo(.02,.9);c.lineTo(.04,.75);c.lineTo(.15,.68);c.closePath();c.fill();
    c.fillStyle='#344653';c.beginPath();c.roundRect(.05,0,.86,.16,.05);c.fill();
    c.fillStyle='#172b37';c.fillRect(.18,.23,.60,.40);
    for(const yy of [.28,.46]){c.fillStyle='#182d39';c.beginPath();c.roundRect(.10,yy,.76,.075,.03);c.fill();c.strokeStyle='#647078';c.lineWidth=.035;c.beginPath();c.roundRect(.54,yy-.015,.16,.105,.025);c.stroke();}
    c.strokeStyle='#68737b';c.lineWidth=.035;c.beginPath();c.moveTo(.31,.57);c.lineTo(.49,.67);c.moveTo(.49,.57);c.lineTo(.31,.67);c.stroke();
    c.fillStyle='#17232b';c.fillRect(.02,.87,.98,.06);for(let i=0;i<5;i++){c.beginPath();c.moveTo(.09+i*.19,.92);c.lineTo(.13+i*.19,1);c.lineTo(.17+i*.19,.92);c.fill();}c.restore();
  };
  SK.drawSpringBoot=function(c,x,y,w,h,side=1){
    c.save();c.translate(x+(side<0?w:0),y);c.scale(side*w,h);
    c.fillStyle='#287ac2';c.beginPath();c.roundRect(.13,0,.62,.52,.08);c.fill();c.fillStyle='#174976';c.beginPath();c.roundRect(.08,.37,.88,.22,.08);c.fill();
    c.fillStyle='#ffce47';c.fillRect(.17,.17,.59,.07);c.fillRect(.17,.32,.59,.06);
    c.strokeStyle='#182f43';c.lineWidth=.10;c.beginPath();for(let k=0;k<7;k++){const xx=k%2?.78:.24,yy=.59+k*.055;k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();
    c.strokeStyle='#d7efff';c.lineWidth=.045;c.stroke();c.fillStyle='#203b50';c.beginPath();c.roundRect(.07,.91,.89,.09,.035);c.fill();c.restore();
  };
  function fittedBoots(c,source,key,spring=false){
    const ctx=c.getContext('2d'),w=c.width,h=c.height,src=source.getContext('2d').getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),groups=[];
    const boot=i=>{const j=i*4;return i/w>h*.61&&src[j+3]>100&&src[j]<95&&src[j+1]<100&&src[j+2]<110&&src[j+2]<src[j+1]*1.48;};
    for(let i=Math.floor(h*.61)*w;i<w*h;i++){if(seen[i]||!boot(i))continue;const queue=[i],pixels=[];seen[i]=1;let l=w,t=h,r=0,b=0;for(let k=0;k<queue.length;k++){const q=queue[k],x=q%w,y=Math.floor(q/w);pixels.push(q);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);for(const n of [q-w,q+w,...(x>0?[q-1]:[]),...(x<w-1?[q+1]:[])])if(n>=0&&n<w*h&&!seen[n]&&boot(n)){seen[n]=1;queue.push(n);}}if(pixels.length>w*h*.0015&&b-t>h*.025)groups.push({l,t,r,b,pixels});}
    for(const g of groups){const bw=g.r-g.l+1,bh=g.b-g.t+1;if(bw>w*.80||bh>h*.30)continue;const tile=canvas(bw,bh),tc=tile.getContext('2d');(spring?SK.drawSpringBoot:SK.drawGripBoot)(tc,0,0,bw,bh,g.l+g.r<w?-1:1);const art=tc.getImageData(0,0,bw,bh),out=ctx.getImageData(0,0,w,h);for(const q of g.pixels){const j=q*4,k=((Math.floor(q/w)-g.t)*bw+q%w-g.l)*4;for(let v=0;v<3;v++)out.data[j+v]=art.data[k+3]?art.data[k+v]:[38,56,69][v];}ctx.putImageData(out,0,0);if(spring)continue;ctx.fillStyle='#17232b';for(let x=g.l+2;x<g.r-1;x+=Math.max(3,bw/5)){let y=g.b;while(y>g.t&&!boot(y*w+Math.floor(x)))y--;if(y>g.t){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+1.5,y+Math.max(2,bh*.07));ctx.lineTo(x+3,y);ctx.fill();}}}
  }

  const boxes={
    boyBoard:[[12,27,184,316],[202,27,184,316],[391,27,179,316],[570,27,186,316]],
    boyWalk:[[40,102,141,309],[230,102,143,309],[410,102,157,309],[604,102,158,309],[802,102,142,309],[978,102,148,309],[1165,102,149,309],[1352,102,152,309]],
    girlBoard:[[7,8,132,271],[129,8,129,271],[259,8,129,271],[384,8,130,271]],
    girlFront:[],
    girlWalk:[[14,10,111,269],[128,10,105,269],[240,10,118,269],[373,10,121,269],[502,10,121,269],[627,10,118,269],[750,10,128,269]],
  };
  const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  function cut(img,box) {
    const [x,y,w,h]=box,c=canvas(w,h),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,x,y,w,h,0,0,w,h);
    const data=ctx.getImageData(0,0,w,h),d=data.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
    const add=i=>{if(i<0||i>=w*h||seen[i])return;const j=i*4,lo=Math.min(d[j],d[j+1],d[j+2]),hi=Math.max(d[j],d[j+1],d[j+2]);if(lo>207&&hi-lo<30){seen[i]=1;queue[tail++]=i;}};
    for(let xx=0;xx<w;xx++){add(xx);add((h-1)*w+xx);}for(let yy=0;yy<h;yy++){add(yy*w);add(yy*w+w-1);}
    while(head<tail){const i=queue[head++];if(i%w)add(i-1);if(i%w<w-1)add(i+1);add(i-w);add(i+w);}
    for(let i=0;i<w*h;i++) {
      const j=i*4,lo=Math.min(d[j],d[j+1],d[j+2]),hi=Math.max(d[j],d[j+1],d[j+2]);
      const xx=(i%w)/w, yy=Math.floor(i/w)/h;
      // Le blanc entre les bras et le torse, ou entre les jambes, peut être fermé.
      // Seul le numéro au milieu du manteau doit conserver son blanc.
      const number=xx>.32&&xx<.68&&yy>.35&&yy<.58;
      if(seen[i]||(!number&&lo>178&&hi-lo<48))d[j+3]=0;
    }
    // Ne garder que le personnage : les légendes et fragments de la pose voisine sont séparés.
    const marks=new Int32Array(w*h),sizes=[0];let component=0;
    for(let i=0;i<w*h;i++){if(!d[i*4+3]||marks[i])continue;component++;head=0;tail=0;queue[tail++]=i;marks[i]=component;
      while(head<tail){const k=queue[head++];const next=[k-w,k+w];if(k%w)next.push(k-1);if(k%w<w-1)next.push(k+1);for(const n of next)if(n>=0&&n<w*h&&d[n*4+3]&&!marks[n]){marks[n]=component;queue[tail++]=n;}}
      sizes[component]=tail;
    }
    const largest=sizes.indexOf(Math.max(...sizes));for(let i=0;i<w*h;i++)if(marks[i]!==largest)d[i*4+3]=0;
    // Décontaminer le blanc des pixels anticrénelés au bord (pour les fonds sombres).
    const original=new Uint8ClampedArray(d);
    for(let i=0;i<w*h;i++)if(d[i*4+3]) {
      const px=i%w,py=Math.floor(i/w),edge=[i-w,i+w,i-1,i+1].some(n=>n>=0&&n<w*h&&!original[n*4+3]);
      if(!edge)continue;
      const v=[255-original[i*4],255-original[i*4+1],255-original[i*4+2]],norm=Math.hypot(...v);if(norm<10){d[i*4+3]=0;continue;}
      let best=norm;
      for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
        const xx=px+dx,yy=py+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const j=(yy*w+xx)*4;if(!original[j+3])continue;
        const q=[255-original[j],255-original[j+1],255-original[j+2]],n=Math.hypot(...q);
        if(n>best&&(v[0]*q[0]+v[1]*q[1]+v[2]*q[2])/(norm*n)>.985)best=n;
      }
      const alpha=norm/best;d[i*4+3]=255*alpha;for(let k=0;k<3;k++)d[i*4+k]=Math.max(0,255-v[k]/alpha);
    }
    ctx.putImageData(data,0,0);return c;
  }
  // La nouvelle pose possède déjà un canal alpha : garder ses bords transparents.
  function frontFrame(img) {
    const src=canvas(img.width,img.height),ctx=src.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const d=ctx.getImageData(0,0,src.width,src.height).data;let left=src.width,top=src.height,right=0,bottom=0;
    for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++)if(d[(y*src.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const height=309,width=Math.round((right-left+1)*height/(bottom-top+1)),out=canvas(width,height);
    out.getContext('2d').drawImage(src,left,top,right-left+1,bottom-top+1,0,0,width,height);return out;
  }
  S.ready=Promise.all(Object.keys(boxes).map(key=>new Promise(resolve=>{const img=new Image();img.onload=()=>{try{frames[key]=key==='girlFront'?[frontFrame(img)]:boxes[key].map(b=>cut(img,b));}catch(error){console.error('Sprites :',key,error);}resolve();};img.onerror=()=>{console.error('Sprite introuvable :',key);resolve();};img.src=SK.SPRITE_SOURCES[key];})));
  if(window.FamilyHeads) S.ready=Promise.all([S.ready,window.FamilyHeads.ready]);
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  function colored(source,r,L,key) {
    // Zach conserve exactement les couleurs de la référence par défaut. Les achats restent visibles.
    const base=r.def.colors,custom=r.look||{},original=r.def.id==='zach';
    const colors={jacket:original&&(!custom.jacket||custom.jacket===base.jacket)?null:L.jacket,pants:original&&(!custom.pants||custom.pants===base.pants)?null:L.pants,hat:original&&(!custom.hatColor||custom.hatColor===base.hat)?null:L.hatColor,hair:original&&(!custom.hairColor||custom.hairColor===base.hair)?null:L.hairColor,skin:original&&(!custom.skin||custom.skin===base.skin)?null:L.skin,board:original&&(!r.board||r.board.id==='freestyle')?null:L.board};
    const id=r.def.id+key+JSON.stringify(colors)+(L.helmet||'')+(L.goggles||'')+Boolean(L.rocketPack)+Boolean(L.gripBoots)+Boolean(L.springBoots)+(L.hat||'none')+Boolean(L.paddedVest)+Boolean(L.whistle)+(L.gloves||'');if(cache.has(id))return cache.get(id);
    const c=canvas(source.width,source.height),ctx=c.getContext('2d');ctx.drawImage(source,0,0);const im=ctx.getImageData(0,0,c.width,c.height),d=im.data;
    const coat=custom.jacket?SK.jacketPalette(L.jacket):null;
    const coatData=coat?fittedCoat(source,L.jacket,key):null;
    for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const a=d[i],b=d[i+1],v=d[i+2],y=Math.floor(i/4/c.width)/c.height;let slot=null,light=1;
      if(y>.58&&a>150&&b>90&&b<a*.88&&v<90){slot='board';light=b/173;}
      else if(y>.26&&a>b*1.45&&a>v*1.5&&a>145){slot='jacket';light=a/205;}
      else if(v>a*1.3&&v>b*1.05&&!(key==='girlFront0'&&y>.84)){slot=y<.33?'hat':'pants';light=v/(key==='girlFront0'?(slot==='hat'?235:174):(slot==='hat'?165:116));}
      else if(y<.35&&a>b&&b>v&&a<145){slot='hair';light=a/91;}
      else if(a>170&&b>135&&v>85&&a>v*1.15&&b>v*1.07){slot='skin';light=a/230;}
      if(key==='girlFront0')light=Math.min(1.08,light);
      if(slot&&colors[slot]){let color=colors[slot];
        if(slot==='jacket'&&coat)color=coat.main;
        if(coat&&key==='girlFront0'&&y>.61&&y<.75&&((i/4)%c.width<c.width*.30||(i/4)%c.width>c.width*.70)&&a>v*1.15)color=L.skin;
        if(slot==='pants'&&SK.DENIM_COLORS.includes(color)){light*=((Math.floor(i/4/c.width)+(i/4)%c.width)%5===0)?.83:1.04;}
        const col=rgb(color);for(let k=0;k<3;k++)d[i+k]=Math.min(255,col[k]*light);}
    }
    if(coatData){for(let j=0;j<d.length;j+=4){if(!coatData[j+3])continue;d[j]=coatData[j];d[j+1]=coatData[j+1];d[j+2]=coatData[j+2];}}
    const frontCoat=coat&&(key==='girlFront0'||key==='boyWalk0');
    let garment=null;
    if(frontCoat){
      // Remplacer le manteau entier, au lieu de déformer ses détails sur des pixels.
      const original=source.getContext('2d').getImageData(0,0,c.width,c.height).data;
      for(let y=Math.floor(c.height*.29);y<c.height*.62;y++)for(let x=0;x<c.width;x++){
        const j=(y*c.width+x)*4,a=original[j],b=original[j+1],v=original[j+2];
        const hands=false;
        if(!hands&&(y>c.height*.34||(a>145&&a>b*1.4&&a>v*1.45)))d[j+3]=0;
      }
      // Remove the detached source hands; the new mittens join the sleeve cuffs.
      for(let y=Math.floor(c.height*.60);y<c.height*.75;y++)for(let x=0;x<c.width;x++)if(x<c.width*.30||x>c.width*.70)d[(y*c.width+x)*4+3]=0;
      garment=()=>{const gx=c.width*.50,gy=c.height*.465,gw=c.width*.83,gh=c.height*.335;
        ctx.save();ctx.translate(gx,gy);ctx.scale(gw/2,gh/2.29);SK.drawJacket(ctx,L.jacket,0,0,1);for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);ctx.fillStyle=SK.gearById(L.gloves)?.tint||coat.trim;ctx.beginPath();ctx.moveTo(.73,.88);ctx.lineTo(.96,.86);ctx.quadraticCurveTo(1.04,1.18,.91,1.21);ctx.quadraticCurveTo(.76,1.24,.74,1.07);ctx.quadraticCurveTo(.65,1.12,.67,1.01);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();};
    }
    ctx.putImageData(im,0,0);
    if(window.FamilyHeads?.has(r.def.id)) personalize(c,source,r,key,garment);
    else garment?.();
    if(L.paddedVest||L.whistle){
      const i=Number(key.match(/(\d+)$/)?.[1]||0),girl=r.def.gender==='girl',board=key.includes('Board');
      const view=key.includes('Front')?'front':board?(i>=2?'back':i===0?'side':'front'):girl?(i===0||i>=5?'back':i===1||i===2?'side':'front'):(i===1||i>=6?'back':i===2||i===3?'side':'front');
      ctx.save();ctx.translate(c.width*.5,c.height*.47);if(board&&i===0||!board&&!girl&&i===3)ctx.scale(-1,1);
      SK.drawWornTorso(ctx,L,0,0,c.height*.16,view);ctx.restore();
    }
    if(L.rocketPack){
      const girl=r.def.gender==='girl',board=key.includes('Board'),i=Number(key.match(/(\d+)$/)?.[1]||0);
      const view=key.includes('Front')?'front':board?(i>=2?'back':i===0?'side':'front'):girl?(i===0||i>=5?'back':i===1||i===2?'side':'front'):(i===1||i>=6?'back':i===2||i===3?'side':'front');
      const mirror=board&&i===0||!board&&!girl&&i===3;
      ctx.save();ctx.translate(c.width*.5,c.height*.47);if(mirror)ctx.scale(-1,1);
      if(view==='side')ctx.translate(-c.width*.22,0);
      SK.drawRocketPack(ctx,0,0,c.height*(view==='side'?.12:.16),view);ctx.restore();
    }
    if(L.gripBoots||L.springBoots) fittedBoots(c,source,key,L.springBoots);
    if(L.helmet==='couronne')headwear(c,r,key,{hat:'crown',hatColor:'#e6b33f'});else if(L.helmet) helmet(c,r,key,L.helmet);else if(!['shinobin','santa','robot'].includes(r.def.id)&&L.hat&&L.hat!=='none')headwear(c,r,key,L);
    if(L.goggles) goggles(c,r,key,L.goggles);
    if(cache.size>180)cache.clear();cache.set(id,c);return c;
  }
  // Une seule illustration de vêtement, projetée sur le masque de chaque pose.
  // Le masque conserve les mains, l'inclinaison et la perspective du sprite original.
  function fittedCoat(source,color,key){
    const w=source.width,h=source.height,src=source.getContext('2d').getImageData(0,0,w,h).data;
    const result=new Uint8ClampedArray(src.length),rows=[];let top=h,bottom=0;
    const red=j=>src[j+3]>8&&src[j]>145&&src[j]>src[j+1]*1.45&&src[j]>src[j+2]*1.5;
    for(let y=Math.floor(h*.26);y<h*.73;y++){let l=w,r=-1;for(let x=0;x<w;x++){const j=(y*w+x)*4;if(red(j)){l=Math.min(l,x);r=Math.max(r,x);}}rows[y]={l,r};
      // Le tronc, plutôt que les mains, fixe la hauteur du manteau.
      if(r-l>w*.25&&l<w*.65&&r>w*.35){top=Math.min(top,y);bottom=y;}}
    if(bottom<=top)return result;
    const index=Number(key.match(/(\d+)$/)?.[1]||0),girl=key.startsWith('girl'),board=key.includes('Board');
    const view=key.includes('Front')?'front':board?(index>=2?'back':index===0?'side':'front'):girl?(index===0||index>=5?'back':index===1||index===2?'side':'front'):(index===1||index>=6?'back':index===2||index===3?'side':'front');
    const texture=canvas(256,256),tc=texture.getContext('2d');SK.drawJacket(tc,color,128,128,100,view);
    const pixels=tc.getImageData(0,0,256,256).data,palette=SK.jacketPalette(color);
    for(let y=top;y<=bottom;y++){const row=rows[y];if(!row||row.r<row.l)continue;const v=(y-top)/(bottom-top),span=Math.max(1,row.r-row.l);
      for(let x=row.l;x<=row.r;x++){const j=(y*w+x)*4;if(!src[j+3])continue;const u=(x-row.l)/span;
        // Conserver peau et gants; effacer seulement l'ancien numéro sur le torse.
        const number=u>.32&&u<.68&&v>.18&&v<.8&&src[j+1]>115&&src[j+2]>105&&Math.abs(src[j]-src[j+1])<90;
        if(!red(j)&&!number)continue;
        if(key==='girlFront0'&&y/h>.61&&(x/w<.30||x/w>.70))continue;
        const tx=Math.max(0,Math.min(255,Math.round(128+(u-.5)*(view==='side'?140:200)))),ty=Math.round(45+v*188),k=(ty*256+tx)*4;
        const fallback=rgb(color==='#fb8c00'&&(u<.25||u>.75)?palette.panel:palette.main),shade=number?1:Math.max(.88,Math.min(1.06,src[j]/215));
        for(let ch=0;ch<3;ch++)result[j+ch]=(pixels[k+3]>100?pixels[k+ch]:fallback[ch])*shade;result[j+3]=src[j+3];
      }}return result;
  }
  function sleeve(ctx,L,sx,sy,ex,ey,hx,hy,s){
    const p=SK.jacketPalette(L.jacket);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=s*.19;
    ctx.strokeStyle=L.jacket==='#fb8c00'?p.panel:p.main;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.lineTo(hx,hy);ctx.stroke();
    ctx.strokeStyle=p.panel;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(ex-sx)*.4,sy+(ey-sy)*.4);ctx.stroke();
    if(p.style){
      // Follow the bent upper arm and forearm, instead of painting a fixed stripe.
      const point=q=>q<.5?[sx+(ex-sx)*q*2,sy+(ey-sy)*q*2]:[ex+(hx-ex)*(q-.5)*2,ey+(hy-ey)*(q-.5)*2];
      for(let i=0;i<24;i++){const q=i/24,a=point(q),b=point((i+1)/24);ctx.strokeStyle=p.style==='neck-stripes'?(q<.20?p.main:q<.43?p.panel:q<.72?p.main:p.panel):p.style==='neck-geo'?(q>.33&&q<.63?p.trim:p.main):p.style==='tricolore'?(q<.30?p.main:q<.53?p.panel:p.lower):p.style==='geometrique'?(q>.30&&q<.43?p.panel:q>=.43&&q<.61?p.trim:p.main):p.main;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
    }
    if(p.wacky){const angle=Math.atan2(ey-sy,ex-sx)-Math.PI/2;ctx.save();ctx.translate(sx+(ex-sx)*.65,sy+(ey-sy)*.65);ctx.rotate(angle);SK.drawCoatMotif(ctx,p.style,0,0,s*.065);ctx.restore();}
    ctx.strokeStyle=p.trim;ctx.lineWidth=s*.20;ctx.beginPath();ctx.moveTo(hx+(ex-hx)*.1,hy+(ey-hy)*.1);ctx.lineTo(hx,hy);ctx.stroke();
  }
  function personalize(c,source,r,key,garment) {
    const ctx=c.getContext('2d'),src=source.getContext('2d').getImageData(0,0,c.width,c.height).data,im=ctx.getImageData(0,0,c.width,c.height),d=im.data;
    const girl=r.def.gender==='girl',board=key.includes('Board'),index=Number(key.match(/(\d+)$/)?.[1]||0);
    // Retirer la tête d'origine, en gardant les épaules rouges qui la chevauchent.
    for(let y=0;y<c.height*.45;y++)for(let x=0;x<c.width;x++){
      const j=(y*c.width+x)*4,a=src[j],b=src[j+1],v=src[j+2];
      const jacket=y>c.height*.26&&a>b*1.45&&a>v*1.5&&a>145;
      const trailingHair=girl&&a>b&&b>v&&a<165;
      if((y<c.height*.36&&!jacket)||trailingHair)d[j+3]=0;
    }
    ctx.putImageData(im,0,0);
    garment?.();
    let view='front',mirror=false;
    if(board){view=index>=2?'back':index===0?'side':'front';mirror=index===0;}
    else if(key.includes('Front'))view='front';
    else if(girl){view=index===0||index>=5?'back':index===1||index===2?'side':'front';}
    else {view=index===1||index>=6?'back':index===2||index===3?'side':'front';mirror=index===3;}
    const headH=c.height*(board?.32:.34),headW=headH*1.18,center=c.width*.5;
    ctx.save();ctx.translate(center,headInset(c,r,key));if(mirror)ctx.scale(-1,1);
    window.FamilyHeads.draw(ctx,r.def.id,view,-headW/2,0,headW,headH);ctx.restore();
  }
  // The chin rests inside the collar, with no separately drawn neck.
  // Accessories use the same displacement so they remain attached to the face.
  function headInset(c,r,key){
    const p=SK.jacketPalette(r.look?.jacket||r.def.colors.jacket);
    const longHair=r.def.gender==='girl';
    return c.height*(p.neck?(longHair?.032:.022):key.includes('Board')?.025:longHair?.058:.040);
  }
  function goggles(c,r,key,id){
    const ctx=c.getContext('2d'),girl=r.def.gender==='girl',board=key.includes('Board'),index=Number(key.match(/(\d+)$/)?.[1]||0);
    let view='front',mirror=false;
    if(board){view=index>=2?'back':index===0?'side':'front';mirror=index===0;}
    else if(!key.includes('Front')){view=girl?(index===0||index>=5?'back':index===1||index===2?'side':'front'):(index===1||index>=6?'back':index===2||index===3?'side':'front');mirror=!girl&&index===3;}
    const hh=c.height*(board?.32:.34),frame=window.FamilyHeads?.frame(r.def.id,view);
    const hw=frame?Math.min(hh*1.18,hh*frame.width/frame.height):c.width*.67;
    const actualH=frame?Math.min(hh,hh*1.18*frame.height/frame.width):hh,top=hh-actualH+headInset(c,r,key);
    // The masked and mechanical portraits have their eyes higher than the Kids.
    const eyeLine={zach:.68,shinobin:.56,santa:.54,robot:.515}[r.def.id]??.63;
    const compact=['shinobin','santa','robot'].includes(r.def.id);
    ctx.save();ctx.translate(c.width*.5,top+actualH*eyeLine);if(mirror)ctx.scale(-1,1);
    SK.drawGoggles(ctx,id,compact&&view==='side'?-hw*.04:0,0,hw*(compact?.34:view==='front'?.40:.46),view);ctx.restore();
  }
  function headwear(c,r,key,L){
    const ctx=c.getContext('2d'),girl=r.def.gender==='girl',board=key.includes('Board'),i=Number(key.match(/(\d+)$/)?.[1]||0);
    const view=key.includes('Front')?'front':board?(i>=2?'back':i===0?'side':'front'):girl?(i===0||i>=5?'back':i===1||i===2?'side':'front'):(i===1||i>=6?'back':i===2||i===3?'side':'front');
    const hh=c.height*(board?.32:.34),frame=window.FamilyHeads?.frame(r.def.id,view);
    const hw=frame?Math.min(hh*1.18,hh*frame.width/frame.height):c.width*.67;
    const actualH=frame?Math.min(hh,hh*1.18*frame.height/frame.width):hh,top=hh-actualH+headInset(c,r,key);
    ctx.save();ctx.translate(c.width/2,top);if(board&&i===0||!board&&!girl&&i===3)ctx.scale(-1,1);
    const knit=L.hat?.startsWith('beanie');
    SK.drawHeadwear(ctx,L.hat,L.hatColor,0,actualH*(L.hat==='crown'?.04:-.02),hw*(knit?1.02:.88),actualH*(L.hat==='crown'?.40:knit?.62:.56),view,true);ctx.restore();
  }
  function helmet(c,r,key,id) {
    const ctx=c.getContext('2d'),girl=r.def.gender==='girl',board=key.includes('Board');
    const index=Number(key.match(/(\d+)$/)?.[1]||0);
    let view='front',mirror=false;
    if(board){view=index>=2?'back':index===0?'side':'front';mirror=index===0;}
    else if(key.includes('Front'))view='front';
    else if(girl)view=index===0||index>=5?'back':index===1||index===2?'side':'front';
    else {view=index===1||index>=6?'back':index===2||index===3?'side':'front';mirror=index===3;}
    const hh=c.height*(board?.32:.34),frame=window.FamilyHeads?.frame(r.def.id,view);
    const hw=frame?Math.min(hh*1.18,hh*frame.width/frame.height):c.width*.67;
    const top=frame?hh-Math.min(hh,hh*1.18*frame.height/frame.width)+headInset(c,r,key):c.height*(view==='back'?.045:.005);
    // Enlever l'ancienne visière de Zach sous le casque.
    if(!frame){const im=ctx.getImageData(0,0,c.width,c.height),d=im.data;for(let y=0;y<c.height*.24;y++)for(let x=0;x<c.width;x++){const j=(y*c.width+x)*4;if(d[j+2]>d[j]*1.2&&d[j+2]>d[j+1])d[j+3]=0;}ctx.putImageData(im,0,0);}
    const actualH=frame?Math.min(hh,hh*1.18*frame.height/frame.width):hh;
    // Le portrait inclut les cheveux : calibrer le crâne indépendamment de leur volume.
    // Les repères restent identiques pour toutes les couleurs de casque.
    const skullWidths={zach:.77,eliott:.87,alexie:.73,adam:.89,milo:.90,edison:.84};
    const skullWidth=hw*(skullWidths[r.def.id]||.86);
    const shellW=skullWidth*(view==='side'?1.13:1.12);
    const shellH=shellW*(view==='back'?.68:view==='side'?.67:.66);
    const brimY=actualH*(view==='back'?.48:view==='side'?.44:.43);
    const shellTop=Math.max(-top,brimY-shellH*(view==='side'?.78:.79));
    // Hair and built-in head details above the brim are covered in every view.
    ctx.clearRect(0,0,c.width,top+Math.min(brimY,actualH*.43));
    ctx.save();ctx.translate(c.width/2,top);if(mirror)ctx.scale(-1,1);
    SK.drawSnowHelmet(ctx,id===true?'casque':id,0,shellTop,shellW,shellH,view,true,{chinY:actualH*.97-shellTop});
    ctx.restore();
  }
  // Descente en ligne droite : planche dans l'axe et jambes articulées.
  // Les sprites diagonaux restent réservés aux virages et aux figures.
  function straightRider(ctx,r,L,s) {
    const girl=r.def.gender==='girl',key=girl?'girlWalk':'boyWalk',index=girl?0:1;
    if(!frames[key])return false;
    const img=colored(frames[key][index],r,L,key+index);
    const tuck=Math.max(0,Math.min(1,Math.max(r.crouch||0,r.jumpCharge||0,r.pumpPose||0))),h=2.5*s,w=h*img.width/img.height;
    const pump=Math.min(1,Math.max(r.pumpPose||0,r.jumpCharge||0));
    const hipY=-s*.96+tuck*s*.18+pump*s*.13,hipX=-tuck*s*.07-pump*s*.03;
    ctx.save();
    const leg=(back)=>{
      const footY=(back?-.55:-.06)*s,footX=(back?.025:-.025)*s;
      const kneeX=(back?.045:.075)*s+tuck*s*.075+pump*s*.035,kneeY=(hipY+footY)*.5-tuck*s*.06;
      ctx.strokeStyle=L.pants;ctx.lineWidth=s*(back?.24:.28);ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.lineTo(kneeX,kneeY);ctx.lineTo(footX,footY-s*.10);ctx.stroke();
      if(back){ctx.strokeStyle='#14203d35';ctx.stroke();}
      ctx.fillStyle=back?'#20313a':'#2b414a';
      ctx.beginPath();ctx.moveTo(footX-s*.13,footY-s*.23);ctx.lineTo(footX+s*.10,footY-s*.23);
      ctx.lineTo(footX+s*.13,footY-s*.07);ctx.quadraticCurveTo(footX+s*.24,footY-s*.04,footX+s*.22,footY+s*.05);
      ctx.quadraticCurveTo(footX,footY+s*.12,footX-s*.16,footY+s*.04);ctx.closePath();ctx.fill();
      if(L.gripBoots||L.springBoots)(L.springBoots?SK.drawSpringBoot:SK.drawGripBoot)(ctx,footX-s*.16,footY-s*.25,s*.39,s*.34,1);
    };
    leg(true);leg(false);
    ctx.save();ctx.translate(hipX,hipY);ctx.rotate(tuck*.22);
    // Tête, casque et manteau gardent leurs proportions pendant la flexion.
    if(r.fx?.pushPose>0){
      // Conserver la tête et le torse, remplacer les deux manches par des bras articulés.
      ctx.drawImage(img,0,0,img.width,img.height*.34,-w/2,-h*.61,w,h*.34);
      ctx.drawImage(img,img.width*.22,img.height*.34,img.width*.56,img.height*.27,-w*.28,-h*.27,w*.56,h*.27);
      const extension=Math.sin(Math.PI*SK.clamp(1-r.fx.pushPose/.55,0,1));
      for(const side of [-1,1]){
        const reach=side===(r.pushDirection||1)?extension:0;
        const sx=side*w*.22,sy=-h*.24,ex=sx+side*s*(.12+.24*reach),ey=sy+s*(.27-.22*reach);
        const hx=sx+side*s*(.16+.62*reach),hy=sy+s*(.55-.55*reach);
        sleeve(ctx,L,sx,sy,ex,ey,hx,hy,s);
        ctx.fillStyle=SK.gearById(L.gloves)?.tint||L.skin;ctx.beginPath();ctx.arc(hx,hy,s*.10,0,Math.PI*2);ctx.fill();
      }
    }else{
      ctx.drawImage(img,0,0,img.width,img.height*.61,-w/2,-h*.61,w,h*.61);
      for(const edge of [0,.78])ctx.drawImage(img,img.width*edge,img.height*.61,img.width*.22,img.height*.12,-w/2+w*edge,0,w*.22,h*.12);
    }
    ctx.restore();ctx.restore();return true;
  }
  function turningBoard(ctx,r,L,s,steer) {
    ctx.save();ctx.translate(0,-s*.25);ctx.rotate(steer*1.04);ctx.translate(0,s*.25);
    SK.drawBoard(ctx,r.board,0,-s*.32,s*.65,s*1.48,0,r.input?.steer||0);ctx.restore();
  }
  const bareBodies=new WeakMap();
  function bodyWithoutBoard(img,source){
    if(bareBodies.has(img))return bareBodies.get(img);
    const c=canvas(img.width,img.height),ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    const im=ctx.getImageData(0,0,c.width,c.height),src=source.getContext('2d').getImageData(0,0,c.width,c.height).data;
    for(let y=Math.floor(c.height*.58);y<c.height;y++)for(let x=0;x<c.width;x++){
      const j=(y*c.width+x)*4;
      if(src[j]>src[j+2]*1.2&&src[j+1]>src[j+2]*1.2)im.data[j+3]=0;
    }
    ctx.putImageData(im,0,0);bareBodies.set(img,c);return c;
  }
  // Surface réutilisée pour fondre les poses sans doubler leur opacité.
  const turnBlend=canvas(512,512);
  // Même caméra de dos qu'au sol. La planche vient à la main, jamais l'inverse.
  function aerialRider(c,r,L,s){
    const trick=r.curTrick,pose=trick?.def.pose||'indy';
    const ease=x=>{x=SK.clamp(x,0,1);return x*x*(3-2*x);};
    const p=trick?SK.clamp(trick.t/trick.def.dur,0,1):0;
    const g=trick?ease(p/.3)*ease((1-p)/.3):0;
    // Un saut simple conserve les manches et les mains de la pose de glisse.
    if(g<=.001){turningBoard(c,r,L,s,0);return straightRider(c,r,L,s);}
    const key=r.def.gender==='girl'?'girlWalk':'boyWalk',index=r.def.gender==='girl'?0:1;
    if(!frames[key])return false;
    const img=colored(frames[key][index],r,L,key+index),h=2.5*s,w=h*img.width/img.height;
    const angles={indy:.42,nose:-.65,tail:.95,melon:-.45,method:-.9,double:.3};
    const grabSide=['nose','melon','method'].includes(pose)?-1:1;
    const angle=(angles[pose]||0)*g,by=-.32-(pose==='tail'?.86:.65)*g;
    const bx=(pose==='double'?0:grabSide*.60)*g;
    const boardPoint=(across,along)=>[bx+across*Math.cos(angle)-along*Math.sin(angle),by+across*Math.sin(angle)+along*Math.cos(angle)];
    const hip=[(pose==='double'?0:grabSide*.10)*g,-.96+.10*g];
    const line=(pts,color,width)=>{c.strokeStyle=color;c.lineWidth=width*s;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x*s,y*s):c.moveTo(x*s,y*s));c.stroke();};
    // Deux segments fixes : les mains ne peuvent pas dépasser la portée du bras.
    const joint=(from,to,length,bend)=>{
      let dx=to[0]-from[0],dy=to[1]-from[1],d=Math.max(.001,Math.hypot(dx,dy));
      const reach=Math.min(d,length*1.98),end=[from[0]+dx/d*reach,from[1]+dy/d*reach];
      const offset=Math.sqrt(Math.max(0,length*length-reach*reach/4));
      return {end,middle:[(from[0]+end[0])/2-dy/d*offset*bend,(from[1]+end[1])/2+dx/d*offset*bend]};
    };
    SK.drawBoard(c,r.board,bx*s,by*s,.65*s,1.48*s,angle,r.input?.steer||0);
    for(const along of [-.25,.25]){
      const foot=boardPoint(0,along),ankle=[foot[0],foot[1]-.10];
      // Genoux rapprochés, fléchis dans le sens de la glisse.
      const knee=[hip[0]+.08+(foot[0]-hip[0])*.55*g,(hip[1]+ankle[1])/2-.13*g];
      line([hip,knee,ankle],L.pants,along<0?.24:.28);
      if(along<0)line([hip,knee,ankle],'#14203d25',.24);
      c.save();c.translate(foot[0]*s,foot[1]*s);c.rotate(angle);
      if(L.springBoots||L.gripBoots)(L.springBoots?SK.drawSpringBoot:SK.drawGripBoot)(c,-.16*s,-.25*s,.39*s,.34*s,1);
      else{c.fillStyle='#263b4d';c.beginPath();c.roundRect(-.16*s,-.23*s,.38*s,.29*s,.06*s);c.fill();}
      c.restore();
    }
    // Découpe native de dos : ni tête de face, ni corps aplati ou étiré.
    c.drawImage(img,0,0,img.width,img.height*.34,hip[0]*s-w/2,hip[1]*s-h*.61,w,h*.34);
    c.drawImage(img,img.width*.22,img.height*.34,img.width*.56,img.height*.27,hip[0]*s-w*.28,hip[1]*s-h*.27,w*.56,h*.27);
    for(const side of [-1,1]){
      const shoulder=[hip[0]+side*w/s*.22,hip[1]-.6];
      const rest=[shoulder[0]+side*.32,hip[1]+.08];
      const holds=pose==='double'||side===(['nose','melon','method'].includes(pose)?-1:1);
      const gripPoint=boardPoint(side*.30,pose==='nose'?-.52:pose==='tail'?.50:0);
      const target=holds?gripPoint:[shoulder[0]+side*.46,hip[1]-.05];
      const hand=[rest[0]+(target[0]-rest[0])*g,rest[1]+(target[1]-rest[1])*g];
      const arm=joint(shoulder,hand,.43,side);
      sleeve(c,L,shoulder[0]*s,shoulder[1]*s,arm.middle[0]*s,arm.middle[1]*s,arm.end[0]*s,arm.end[1]*s,s);
      c.fillStyle='#263b4d';c.beginPath();c.arc(arm.end[0]*s,arm.end[1]*s,.10*s,0,Math.PI*2);c.fill();
      if(holds&&g>.8){
        // Pouce refermé sur la carre, lisible même à l'échelle de la course.
        c.strokeStyle='#152936';c.lineWidth=.045*s;c.beginPath();
        c.arc(arm.end[0]*s,arm.end[1]*s,.075*s,-.4,2.1);c.stroke();
      }
    }
    return true;
  }
  S.draw=function(ctx,r,L,s,front,steer) {
    if(r.def.hidden&&!window.FamilyHeads?.has(r.def.id))return false;
    if(r.state==='air')return aerialRider(ctx,r,L,s);
    const key=r.def.gender==='girl'?'girlBoard':'boyBoard';if(!frames[key])return false;
    if(r.state==='ride'&&!front&&!r.curTrick){
      const amount=r.fx?.pushPose>0||r.pumpPose>0||r.jumpCharge>0?0:Math.min(1,Math.max(Math.abs(steer),r.brake||0));
      const blend=amount*amount*(3-2*amount),c=turnBlend.getContext('2d');
      const unit=120,anchorX=256,anchorY=420;
      c.clearRect(0,0,512,512);c.save();c.translate(anchorX,anchorY);
      c.globalAlpha=1-blend;straightRider(c,r,L,unit);
      if(blend>0){
        c.globalCompositeOperation='lighter';c.globalAlpha=blend;
        // Même hauteur tête-planche et même ancrage que la pose droite.
        const img=bodyWithoutBoard(colored(frames[key][0],r,L,key+'0'),frames[key][0]);
        const height=(2.87-.23*Math.min(1,Math.max(r.crouch||0,r.jumpCharge||0,r.pumpPose||0)))*unit,width=height*img.width/img.height;
        c.save();if(steer>0)c.scale(-1,1);
        c.drawImage(img,-width/2,-height+.37*unit,width,height);c.restore();
      }
      c.restore();turningBoard(ctx,r,L,s,steer);ctx.drawImage(turnBlend,-anchorX*s/unit,-anchorY*s/unit,512*s/unit,512*s/unit);return true;
    }
    let index=front?1:2,mirror=false;
    if(Math.abs(steer)>.35){index=0;mirror=steer>0;}
    if(front&&key==='girlBoard')index=0;
    const img=bodyWithoutBoard(colored(frames[key][index],r,L,key+index),frames[key][index]),height=2.87*s,width=height*img.width/img.height;
    SK.drawBoard(ctx,r.board,0,s*.12,s*.48,s*2.05,mirror?-.85:.85,r.input?.steer||0);
    ctx.save();if(mirror)ctx.scale(-1,1);ctx.drawImage(img,-width/2,-height+.37*s,width,height);ctx.restore();return true;
  };
  // Preview pose: fixed feet on the board, gentle balance through elbows and knees.
  S.shopPose=function(c,r,L,s,t){
    const key=r.def.gender==='girl'?'girlFront':'boyWalk';if(!frames[key])return;
    const img=colored(frames[key][0],r,L,key+'0'),h=2.5*s,w=h*img.width/img.height;
    const hip=-s*.65+Math.sin(t*1.7)*s*.018;
    c.fillStyle='#16374733';c.beginPath();c.ellipse(0,s*.13,s*1.05,s*.18,0,0,Math.PI*2);c.fill();
    SK.drawBoard(c,r.board,0,0,s*.42,s*2.5,Math.PI/2,0);
    c.lineCap='round';c.lineJoin='round';
    for(const side of [-1,1]){
      c.strokeStyle=L.pants;c.lineWidth=s*.24;c.beginPath();c.moveTo(side*s*.18,hip);c.lineTo(side*s*.34,-s*.39);c.lineTo(side*s*.37,-s*.12);c.stroke();
      c.fillStyle='#263e48';c.beginPath();c.roundRect(side*s*.37-s*.14,-s*.23,s*.31,s*.25,s*.06);c.fill();
      if(L.springBoots||L.gripBoots)(L.springBoots?SK.drawSpringBoot:SK.drawGripBoot)(c,side*s*.37-s*.16,-s*.27,s*.34,s*.30,side);
    }
    // Keep the original head and central jacket at their native proportions.
    c.drawImage(img,0,0,img.width,img.height*.34,-w/2,hip-h*.61,w,h*.34);
    c.drawImage(img,img.width*.22,img.height*.34,img.width*.56,img.height*.27,-w*.28,hip-h*.27,w*.56,h*.27);
    for(const side of [-1,1]){
      const sy=hip-h*.23,sx=side*w*.22,ey=sy+s*.23,hx=side*s*.80,hy=sy-s*.04+Math.sin(t*1.7+side)*s*.05;
      sleeve(c,L,sx,sy,side*s*.60,ey,hx,hy,s);
      c.fillStyle=SK.gearById(L.gloves)?.tint||'#263e48';c.beginPath();c.arc(hx,hy,s*.10,0,Math.PI*2);c.fill();
    }
  };
  S.seated=function(ctx,r,L,s){
    const girl=r.def.gender==='girl',key=girl?'girlFront':'boyWalk',img=colored(frames[key][0],r,L,key+'0');
    const h=2.5*s,w=h*img.width/img.height;
    ctx.drawImage(img,0,0,img.width,img.height*.61,-w/2,-h*.61,w,h*.61);
    ctx.strokeStyle=L.pants;ctx.lineWidth=s*.25;ctx.lineCap='round';ctx.lineJoin='round';
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*s*.16,-s*.06);ctx.lineTo(side*s*.28,s*.18);ctx.lineTo(side*s*.29,s*.65);ctx.stroke();
      ctx.fillStyle='#263e48';ctx.fillRect(side*s*.29-s*.13,s*.54,s*.29,s*.22);}
    SK.drawBoard(ctx,r.board,0,s*.85,s*.4,s*2.05,Math.PI/2+.07,r.input?.steer||0);
  };
  S.face=function(ctx,r,L,x,y,rad) {
    if(r.def.hidden&&!window.FamilyHeads?.has(r.def.id))return false;
    const key=r.def.gender==='girl'?'girlWalk':'boyWalk',index=r.def.gender==='girl'?3:0;
    if(!frames[key])return false;
    const img=colored(frames[key][index],r,L,key+index);
    ctx.save();ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.clip();ctx.fillStyle='#dceffa';ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
    ctx.drawImage(img,img.width*.12,0,img.width*.76,img.height*.34,x-rad,y-rad*1.16,rad*2,rad*2);ctx.restore();return true;
  };
  S.walk=function(ctx,r,L,x,y,s,t,direction,moving) {
    const girl=r.def.gender==='girl',side=moving&&(direction==='left'||direction==='right');
    const key=girl&&!moving?'girlFront':girl?'girlWalk':'boyWalk';if(!frames[key])return;
    const mapping=girl?{up:0,right:1,left:1,down:3,downRight:3,downLeft:4,upRight:5,upLeft:6}:{up:1,right:2,left:2,down:0,downRight:4,downLeft:5,upRight:6,upLeft:7};
    const index=girl&&!moving?0:(mapping[direction]??mapping.down);
    const img=colored(frames[key][index],r,L,key+index),height=2.5*s,width=height*img.width/img.height;
    ctx.save();ctx.translate(x,y);
    // La même pose vers la droite est retournée entièrement : tête, bras et jambes.
    if(direction==='left'&&moving)ctx.scale(-1,1);
    const frontLegs=!side&&direction==='down';
    if(frontLegs){
      for(const sign of [-1,1]){
        ctx.save();ctx.scale(sign,1);ctx.translate(-s*.025,0);ctx.fillStyle=L.pants;
        ctx.beginPath();ctx.moveTo(s*.055,-s*1.08);ctx.lineTo(s*.24,-s*1.08);ctx.lineTo(s*.245,-s*.22);ctx.lineTo(s*.065,-s*.22);ctx.closePath();ctx.fill();
        if(SK.DENIM_COLORS.includes(L.pants)){ctx.strokeStyle='#d1b78b';ctx.lineWidth=s*.012;ctx.beginPath();ctx.moveTo(s*.09,-s*1.03);ctx.lineTo(s*.09,-s*.28);ctx.stroke();}
        ctx.fillStyle= r.def.gender==='girl'?'#27334f':'#243648';
        ctx.beginPath();ctx.moveTo(s*.065,-s*.29);ctx.lineTo(s*.26,-s*.29);ctx.lineTo(s*.27,-s*.11);
        ctx.quadraticCurveTo(s*.35,-s*.07,s*.34,-s*.015);ctx.quadraticCurveTo(s*.22,s*.02,s*.055,-s*.015);ctx.closePath();ctx.fill();
        if(L.gripBoots||L.springBoots)(L.springBoots?SK.drawSpringBoot:SK.drawGripBoot)(ctx,s*.04,-s*.32,s*.31,s*.34);
        ctx.restore();
      }
      ctx.save();ctx.beginPath();ctx.rect(-width,-height-20,width*2,height+40);ctx.rect(-s*.48,-s*.94,s*.96,s*1.5);ctx.clip('evenodd');
    }
    if(side){
      const phase=t*Math.PI*3.6,hipY=-height*.39,bob=-Math.abs(Math.sin(phase))*s*.035;
      // Appui : le pied recule régulièrement au sol. Retour : il se lève et
      // revient devant; le genou est calculé avec deux segments de longueur fixe.
      const stepPose=offset=>{
        const cycle=((phase+offset)/(Math.PI*2))%1;
        const u=cycle<.5?cycle*2:(cycle-.5)*2;
        const forward=cycle<.5?1-2*u:-Math.cos(u*Math.PI);
        return {x:forward*s*.23,lift:cycle<.5?0:Math.sin(u*Math.PI)*s*.07};
      };
      const leg=(offset,far)=>{
        const foot=stepPose(offset),hx=-s*.045,hy=hipY+bob;
        const ax=foot.x,ay=-s*.18-foot.lift;
        const dx=ax-hx,dy=ay-hy,d=Math.hypot(dx,dy),length=s*.415;
        const bend=Math.sqrt(Math.max(0,length*length-d*d/4));
        const kx=(hx+ax)/2+dy/d*bend,ky=(hy+ay)/2-dx/d*bend;
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=L.pants;ctx.lineWidth=s*.17;
        ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(kx,ky);ctx.lineTo(ax,ay);ctx.stroke();
        if(SK.DENIM_COLORS.includes(L.pants)){ctx.strokeStyle='#b9ac89';ctx.lineWidth=s*.012;ctx.stroke();}
        if(far){ctx.lineWidth=s*.17;ctx.strokeStyle='rgba(10,22,50,.18)';ctx.stroke();}
        // Botte plate, ancrée sous la cheville (plus de gros ronds aux pieds).
        ctx.translate(ax,ay);ctx.fillStyle=far?'#20333b':'#2b414a';
        ctx.beginPath();ctx.moveTo(-s*.09,-s*.09);ctx.lineTo(s*.075,-s*.09);
        ctx.lineTo(s*.095,s*.06);ctx.quadraticCurveTo(s*.25,s*.06,s*.25,s*.145);
        ctx.quadraticCurveTo(s*.25,s*.18,s*.20,s*.18);ctx.lineTo(-s*.10,s*.18);
        ctx.quadraticCurveTo(-s*.13,s*.17,-s*.11,s*.10);ctx.closePath();ctx.fill();if(L.gripBoots||L.springBoots)(L.springBoots?SK.drawSpringBoot:SK.drawGripBoot)(ctx,-s*.12,-s*.13,s*.38,s*.33);ctx.restore();
      };
      leg(Math.PI,true);leg(0,false);
      const shoulderY=-height*.59+bob;
      const arm=(offset,far)=>{
        // Le bras avance quand la jambe du même côté recule.
        const swing=-stepPose(offset).x/(s*.23),sx=-s*.025,handX=swing*s*.35;
        const handY=shoulderY+s*.53-Math.abs(swing)*s*.06;
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=s*.19;ctx.strokeStyle=L.jacket;
        sleeve(ctx,L,sx,shoulderY,sx+handX*.45,shoulderY+s*.29,handX,handY,s);
        if(far){ctx.strokeStyle='rgba(15,25,45,.18)';ctx.stroke();}
        ctx.fillStyle=SK.gearById(L.gloves)?.tint||SK.jacketPalette(L.jacket).trim;ctx.beginPath();ctx.arc(handX,handY+s*.015,s*.080,0,Math.PI*2);ctx.fill();ctx.restore();
      };
      if(L.rocketPack)SK.drawRocketPack(ctx,-s*.29,-height*.51+bob,s*.30);
      arm(Math.PI,true);
      // Isoler tête et torse pour remplacer les bras figés de la référence.
      ctx.save();ctx.beginPath();
      ctx.rect(-width/2,-height+bob,width,height*.38);
      ctx.rect(-width*.205,-height*.62+bob,width*.43,height*.245);ctx.clip();
      ctx.drawImage(img,-width/2,-height+bob,width,height);ctx.restore();
      arm(0,false);
    }else if(r.wave){
      // Enlever le bras immobile avant de dessiner le salut, sans toucher au visage.

      const sx=width*.15,sy=-height*.59,ex=sx+s*.28,ey=sy-s*.18,angle=Math.sin(t*5)*.28;
      const hx=ex+Math.sin(angle)*s*.38,hy=ey-Math.cos(angle)*s*.43;
      sleeve(ctx,L,sx,sy,ex,ey,hx,hy,s);
      ctx.fillStyle=SK.gearById(L.gloves)?.tint||SK.jacketPalette(L.jacket).trim;ctx.beginPath();ctx.ellipse(hx,hy-s*.015,s*.08,s*.10,angle,0,Math.PI*2);ctx.fill();
      // Le torse recouvre la naissance du bras : épaule derrière le manteau.
      ctx.save();ctx.beginPath();ctx.rect(-width/2,-height,width,height);ctx.rect(width*.22,-height*.63,width*.28,height*.40);ctx.clip('evenodd');ctx.drawImage(img,-width/2,-height,width,height);ctx.restore();
    }else ctx.drawImage(img,-width/2,-height,width,height);
    if(frontLegs){
      ctx.restore();
      // Les mitaines passent devant le masque qui remplace les jambes.
      for(const sign of [-1,1]){if(r.wave&&sign===1)continue;ctx.save();ctx.translate(sign*width*.35,-height*.37);ctx.scale(sign,1);ctx.fillStyle=SK.gearById(L.gloves)?.tint||SK.jacketPalette(L.jacket).trim;ctx.beginPath();ctx.moveTo(-s*.075,-s*.09);ctx.lineTo(s*.075,-s*.09);ctx.bezierCurveTo(s*.12,s*.01,s*.11,s*.14,s*.025,s*.15);ctx.bezierCurveTo(-s*.05,s*.17,-s*.09,s*.11,-s*.085,s*.04);ctx.quadraticCurveTo(-s*.15,s*.06,-s*.12,-s*.015);ctx.closePath();ctx.fill();ctx.restore();}
    }
    ctx.restore();
  };
  // Milo : corps et jambes plus courts, sans écraser son visage ni son casque.
  const toddlerCanvas=canvas(512,512);
  function toddler(ctx,s,foot,draw,ratio=.8){
    const c=toddlerCanvas.getContext('2d'),unit=120,ax=256,ay=400;
    c.clearRect(0,0,512,512);c.save();c.translate(ax,ay);draw(c,unit);c.restore();
    const neck=ay-1.65*unit,bottom=ay+foot*unit,body=bottom-neck,shortBody=body*ratio,offset=body-shortBody,k=s/unit;
    ctx.drawImage(toddlerCanvas,0,0,512,neck,-ax*k,(-ay+offset)*k,512*k,neck*k);
    ctx.drawImage(toddlerCanvas,0,neck,512,body,-ax*k,(neck-ay+offset)*k,512*k,shortBody*k);
    if(bottom<512)ctx.drawImage(toddlerCanvas,0,bottom,512,512-bottom,-ax*k,(bottom-ay)*k,512*k,(512-bottom)*k);
  }
  const fullWalk=S.walk,fullDraw=S.draw,fullSeat=S.seated;
  // Proportions adaptées à l'âge : allonger un peu le torse et raccourcir
  // les jambes, sans comprimer la tête, les mains ou les bottes en entier.
  const proportions={zach:{torso:1.16,legs:.70},eliott:{torso:1.16,legs:.70},alexie:{torso:1.16,legs:.70},adam:{torso:1.18,legs:.60},milo:{torso:.96,legs:.48},edison:{torso:1.18,legs:.60}};
  // Articulated adult bodies: portraits overlap the collar, never a cropped child torso.
  function adultWalker(c,r,L,x,y,s,t,direction,moving){
    const side=moving,phase=t*5.5,bob=side?Math.abs(Math.sin(phase))*.018:0;
    c.save();c.translate(x,y);c.scale(s*(direction==='left'&&side?-1:1),s);
    c.lineCap='round';c.lineJoin='round';
    const limb=(points,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.stroke();};
    // One planted foot and one returning foot; both knees retain fixed limb lengths.
    const step=offset=>{
      const cycle=(((phase+offset)/(Math.PI*2))%1+1)%1;
      const u=cycle<.5?cycle*2:(cycle-.5)*2;
      return {x:(cycle<.5?1-2*u:-Math.cos(u*Math.PI))*.22,
        lift:cycle<.5?0:Math.sin(u*Math.PI)*.10};
    };
    const leg=(near)=>{
      const sign=near?1:-1,foot=side?step(near?0:Math.PI):{x:sign*.18,lift:0};
      const hx=side?-.035:sign*.17,hy=-.91-bob,ax=foot.x,ay=-.18-foot.lift;
      let kx=hx,ky=(hy+ay)/2;
      if(side){
        const dx=ax-hx,dy=ay-hy,d=Math.hypot(dx,dy);
        const bend=Math.sqrt(Math.max(0,.395*.395-d*d/4));
        kx=(hx+ax)/2+dy/d*bend;ky=(hy+ay)/2-dx/d*bend;
      }
      limb([[hx,hy],[kx,ky],[ax,ay]],L.pants||r.def.colors.pants,.19);
      if(side&&!near)limb([[hx,hy],[kx,ky],[ax,ay]],'rgba(10,22,40,.18)',.19);
      c.save();c.translate(ax,ay);c.fillStyle=side&&!near?'#20323c':'#2b414b';
      // Upright cuff, rounded toe and flat sole instead of a horizontal capsule.
      c.beginPath();c.moveTo(-.095,-.09);c.lineTo(.085,-.09);
      if(side){
        c.lineTo(.10,.065);c.quadraticCurveTo(.235,.07,.24,.135);
        c.quadraticCurveTo(.245,.18,.20,.18);c.lineTo(-.105,.18);
      }else{
        c.lineTo(.115,.10);c.quadraticCurveTo(.135,.18,.08,.18);
        c.lineTo(-.08,.18);c.quadraticCurveTo(-.135,.18,-.115,.10);
      }
      c.lineTo(-.095,-.09);c.closePath();c.fill();
      c.strokeStyle='#192e38';c.lineWidth=.025;c.beginPath();
      c.moveTo(-.095,.165);c.lineTo(side?.21:.095,.165);c.stroke();
      c.restore();
    };
    leg(false);leg(true);
    const arm=(near)=>{const sign=near?1:-1,ax=side?(near?.08:-.08):sign*.245,sy=-1.56-bob;
      const swing=side?-step(near?0:Math.PI).x:0;
      const waving=r.wave&&near;
      const elbow=[ax+(waving?.28:side?swing:sign*.09),sy+(waving?-.18:.34)];
      const hand=[ax+(waving?.32+Math.sin(t*9)*.07:side?swing*1.4:sign*.14),sy+(waving?-.61:.65)];
      sleeve(c,L,ax,sy,elbow[0],elbow[1],hand[0],hand[1],1);
      limb([hand,[hand[0],hand[1]+.045]],r.def.colors.skin,.18);
    };
    arm(false);if(r.wave)arm(true);
    // Only the torso belongs here: both sleeves are already drawn as moving arms.
    SK.drawJacket(c,L.jacket||r.def.colors.jacket,0,-1.27-bob,side?.40:.47,side?'side':'front',true);
    if(!r.wave)arm(true);
    // Long hair sits over the shoulders; the face stays attached to the collar.
    const female=r.def.gender==='girl',hh=female?.90:.78;
    window.FamilyHeads.draw(c,r.def.id,side?'side':'front',-.47,-1.55-hh-bob,.94,hh+.12);
    c.restore();
  }
  S.walk=function(ctx,r,L,x,y,s,t,direction,moving){
    if(r.def.adult)return adultWalker(ctx,r,L,x,y,s,t,direction,moving);
    const p=proportions[r.def.id];if(!p)return fullWalk(ctx,r,L,x,y,s,t,direction,moving);
    const c=toddlerCanvas.getContext('2d'),u=120,ax=256,ay=400;
    c.clearRect(0,0,512,512);fullWalk(c,r,L,ax,ay,u,t,direction,moving);
    const neck=ay-1.65*u,hip=ay-.95*u,ankle=ay-.20*u;
    const newHip=ankle-(ankle-hip)*p.legs,newNeck=newHip-(hip-neck)*p.torso,k=s/u;
    ctx.save();ctx.translate(x,y);
    ctx.drawImage(toddlerCanvas,0,0,512,neck,-ax*k,(newNeck-neck-ay)*k,512*k,neck*k);
    ctx.drawImage(toddlerCanvas,0,neck,512,hip-neck,-ax*k,(newNeck-ay)*k,512*k,(newHip-newNeck)*k);
    ctx.drawImage(toddlerCanvas,0,hip,512,ankle-hip,-ax*k,(newHip-ay)*k,512*k,(ankle-newHip)*k);
    ctx.drawImage(toddlerCanvas,0,ankle,512,512-ankle,-ax*k,(ankle-ay)*k,512*k,(512-ankle)*k);
    ctx.restore();
  };
  S.draw=function(ctx,r,L,s,front,steer){
    if(r.def.id!=='milo')return fullDraw(ctx,r,L,s,front,steer);
    toddler(ctx,s,.37,(c,u)=>fullDraw(c,r,L,u,front,steer),r.def.id==='edison'?.88:.8);return true;
  };
  S.seated=function(ctx,r,L,s){return fullSeat(ctx,r,L,r.def.id==='milo'?s*.72:s);};
})(window.SK);
