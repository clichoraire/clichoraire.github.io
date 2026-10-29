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
    const pantsData=fittedPants(source,L.pants,key);
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
    if(pantsData){for(let j=0;j<d.length;j+=4){if(!pantsData[j+3])continue;d[j]=pantsData[j];d[j+1]=pantsData[j+1];d[j+2]=pantsData[j+2];}}
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
    if(coat&&!frontCoat){
      // Remove only original cloth and its white number; retain skin, boots and trousers.
      const original=source.getContext('2d').getImageData(0,0,c.width,c.height).data;
      for(let y=Math.floor(c.height*.27);y<c.height*.74;y++)for(let x=0;x<c.width;x++){
        const j=(y*c.width+x)*4,a=original[j],b=original[j+1],v=original[j+2];
        const cloth=a>145&&a>b*1.45&&a>v*1.5;
        const number=x>c.width*.28&&x<c.width*.72&&y>c.height*.35&&y<c.height*.58&&b>115&&v>105&&Math.abs(a-b)<90;
        const hand=y>c.height*.50&&a>160&&b>110&&v>70&&a>v*1.15&&b>v*1.07;
        if(cloth||number||hand||(y>c.height*.33&&y<c.height*(key.includes('Board')?.56:.61))||(y>c.height*.60&&y<c.height*.74&&(x<c.width*.30||x>c.width*.70)))d[j+3]=0;
      }
      garment=()=>drawPoseCoat(ctx,L,key,c.width,c.height);
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
  // Native diagonal/back poses retain their silhouette and original shading.
  // Project the shop fabric only onto the original blue trouser pixels.
  function fittedPants(source,color,key){
    const w=source.width,h=source.height,src=source.getContext('2d').getImageData(0,0,w,h).data;
    const mask=[];let left=w,right=0,top=h,bottom=0;
    for(let y=Math.floor(h*.45);y<h;y++)for(let x=0;x<w;x++){
      const j=(y*w+x)*4,a=src[j],b=src[j+1],v=src[j+2];
      if(src[j+3]>8&&v>a*1.3&&v>b*1.05&&!(key==='girlFront0'&&y>h*.84)){
        mask.push(j);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
    }
    if(right<=left||bottom<=top)return null;
    const tile=canvas(160,200),tc=tile.getContext('2d');SK.drawPants(tc,color,80,100,95);
    const texture=tc.getImageData(0,0,160,200).data,out=new Uint8ClampedArray(src.length),base=rgb(color);
    for(const j of mask){const x=j/4%w,y=Math.floor(j/4/w),u=(x-left)/(right-left),v=(y-top)/(bottom-top);
      const tx=Math.round(20+u*120),ty=Math.round(10+v*178),k=(ty*160+tx)*4;
      const shade=Math.max(.72,Math.min(1.08,src[j+2]/(key==='girlFront0'?174:116)));
      for(let ch=0;ch<3;ch++)out[j+ch]=(texture[k+3]>100?texture[k+ch]:base[ch])*shade;
      out[j+3]=src[j+3];
    }
    return out;
  }
  // Anatomical anchors, independent of each scanline's arm/torso width.
  function drawPoseCoat(c,L,key,w,h){
    const board=key.includes('Board'),girl=key.startsWith('girl'),i=Number(key.match(/(\d+)$/)?.[1]||0);
    const side=!board&&(girl?(i===1||i===2):(i===2||i===3));
    const back=board?i>=2||(girl&&i===1):girl?(i===0||i>=5):(i===1||i>=6);
    const view=side?'side':back?'back':'front';
    const cx=w*(board?.52:.50),cy=h*(board?.435:.465),height=h*(board?.27:.29),width=w*(side?.28:board?.37:.46);
    const unit=height/2.1;
    const arm=(sign)=>{
      let sx=cx+sign*width*.43,sy=cy-height*.32,ex=sx+sign*w*.065,ey=cy+height*.16,hx=sx+sign*w*.15,hy=cy+height*.52;
      if(board){hx=w*(sign<0?.16:.81);hy=h*(sign<0?.51:.54);ex=(sx+hx)*.5;ey=(sy+hy)*.5;}
      if(side){sx=cx;ex=cx+w*.035;hx=cx+w*.05;}
      sleeve(c,L,sx,sy,ex,ey,hx,hy,unit*2.6);
      c.fillStyle=SK.gearById(L.gloves)?.tint||SK.jacketPalette(L.jacket).trim;
      c.beginPath();c.ellipse(hx,hy+unit*.09,unit*.19,unit*.23,0,0,Math.PI*2);c.fill();
    };
    if(!side)arm(-1);
    c.save();c.translate(cx,cy);c.scale(width/(side?.95:1.14),height/2.1);
    SK.drawJacket(c,L.jacket,0,0,1,view,true);c.restore();
    if(!side)arm(1);
  }
  // A continuous fabric silhouette follows the hip, knee and ankle.
  // Coordinates are in pixels; seams and pockets rotate with each limb.
  function pantLeg(c,color,hip,knee,ankle,s,{width=.27,far=false,back=false}={}){
    const denim=SK.DENIM_COLORS.includes(color),style=SK.PANT_STYLES?.[color],w=width*s*(style?.type==='snow'?1.12:1),ankleWidth=style?.type==='jogger'?.29:style?.type==='snow'?.46:.40;
    const normal=(a,b)=>{const d=Math.max(.001,Math.hypot(b[0]-a[0],b[1]-a[1]));return [(b[1]-a[1])/d,-(b[0]-a[0])/d];};
    const n0=normal(hip,knee),n1=normal(knee,ankle),sum=[n0[0]+n1[0],n0[1]+n1[1]],len=Math.hypot(...sum)||1,nm=sum.map(v=>v/len);
    const offset=(a,n,r)=>[a[0]+n[0]*r,a[1]+n[1]*r];
    const a=offset(hip,n0,w*.49),b=offset(knee,nm,w*.55),d=offset(ankle,n1,w*ankleWidth);
    const e=offset(ankle,n1,-w*ankleWidth),f=offset(knee,nm,-w*.48),g=offset(hip,n0,-w*.49);
    c.save();c.lineJoin='round';c.lineCap='round';
    const shape=()=>{c.beginPath();c.moveTo(...a);c.quadraticCurveTo(a[0]+(b[0]-a[0])*.25,a[1]+(b[1]-a[1])*.55,...b);c.quadraticCurveTo(b[0]+(d[0]-b[0])*.80,b[1]+(d[1]-b[1])*.35,...d);c.lineTo(...e);c.quadraticCurveTo(e[0]+(f[0]-e[0])*.28,e[1]+(f[1]-e[1])*.65,...f);c.quadraticCurveTo(f[0]+(g[0]-f[0])*.8,f[1]+(g[1]-f[1])*.40,...g);c.closePath();};
    shape();c.fillStyle=color;c.fill();c.save();c.clip();
    const light=c.createLinearGradient(hip[0]-w*.6,hip[1],hip[0]+w*.6,hip[1]);
    light.addColorStop(0,'#102b4145');light.addColorStop(.35,'#ffffff26');light.addColorStop(.65,'#ffffff08');light.addColorStop(1,'#102b4138');c.fillStyle=light;c.fill();
    // Detail coordinates follow the upper/lower leg, so a pocket never floats beside a knee.
    const segment=(from,to,draw)=>{c.save();c.translate(...from);c.rotate(Math.atan2(to[1]-from[1],to[0]-from[0])-Math.PI/2);draw(Math.hypot(to[0]-from[0],to[1]-from[1]));c.restore();};
    const seam=denim?'#d8bd8dcc':'#e3f0ed80';
    segment(hip,knee,h=>{if(SK.drawCollectionPantDetail?.(c,color,w,h,s,true))return;c.strokeStyle=seam;c.lineWidth=s*.012;c.beginPath();c.moveTo(w*.31,0);c.lineTo(w*.36,h);c.stroke();
      c.fillStyle='#142b3d24';c.strokeStyle=seam;c.lineWidth=s*.009;
      c.beginPath();c.roundRect(-w*.28,h*.25,w*.53,h*.43,w*.07);c.fill();c.stroke();
      c.beginPath();c.moveTo(-w*.26,h*.33);c.lineTo(w*.24,h*.33);c.stroke();
      if(back&&denim){c.beginPath();c.moveTo(-w*.22,h*.46);c.lineTo(0,h*.57);c.lineTo(w*.20,h*.46);c.stroke();}
    });
    segment(knee,ankle,h=>{if(SK.drawCollectionPantDetail?.(c,color,w,h,s,false))return;c.strokeStyle=seam;c.lineWidth=s*.011;c.beginPath();c.moveTo(w*.36,0);c.lineTo(w*.27,h);c.stroke();
      c.fillStyle='#172c4845';c.fillRect(-w*.6,Math.max(0,h-s*.10),w*1.2,s*.12);
      c.strokeStyle=seam;c.beginPath();c.moveTo(-w*.38,h-s*.08);c.lineTo(w*.38,h-s*.08);c.stroke();
      c.strokeStyle='#132d4244';c.lineWidth=s*.014;c.beginPath();c.moveTo(-w*.32,h*.12);c.quadraticCurveTo(0,h*.21,w*.29,h*.12);c.stroke();
      c.strokeStyle='#ffffff45';c.lineWidth=s*.01;c.beginPath();c.moveTo(-w*.24,h*.18);c.lineTo(w*.13,h*.23);c.stroke();
    });
    if(far){c.fillStyle='#10223830';shape();c.fill();}
    c.restore();shape();c.strokeStyle='#19334780';c.lineWidth=s*.012;c.stroke();c.restore();
  }
  // Fixed upper-arm and forearm lengths, shared by riding and every aerial pose.
  function armJoint(from,to,length,bend){
    const a=SK.ArmRig.solve(from,to,length,length*.94,bend);
    return {end:a.wrist,middle:a.elbow};
  }
  function drawHand(c,L,elbow,wrist,s,side=1){
    c.save();c.translate(wrist[0]*s,wrist[1]*s);
    c.rotate(Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])-Math.PI/2);
    c.fillStyle=SK.gearById(L.gloves)?.tint||L.skin;
    c.beginPath();c.roundRect(-s*.065,-s*.025,s*.13,s*.16,s*.05);c.fill();
    c.beginPath();c.ellipse(-side*s*.06,s*.035,s*.035,s*.05,-side*.25,0,Math.PI*2);c.fill();
    c.restore();
  }
  function rigArm(c,L,shoulder,target,s,{side=1,bend=-side,scale=1,far=false,hand=true}={}){
    const a=SK.ArmRig.solve(shoulder,target,.33*scale,.31*scale,bend);
    c.save();if(far)c.globalAlpha*=.82;
    sleeve(c,L,...a.shoulder.map(v=>v*s),...a.elbow.map(v=>v*s),...a.wrist.map(v=>v*s),s*.92);
    if(hand)drawHand(c,L,a.elbow,a.wrist,s,side);c.restore();return a;
  }
  function sleeve(ctx,L,sx,sy,ex,ey,hx,hy,s){
    if(SK.drawCollectionSleeve?.(ctx,L,sx,sy,ex,ey,hx,hy,s))return;
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
    SK.drawHeadwear(ctx,L.hat,L.hatColor,0,actualH*(L.hat==='crown'?.04:-.02),hw*(knit?.90:.88),actualH*(L.hat==='crown'?.40:knit?.62:.56),view,true);ctx.restore();
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
  // Build the whole upper body from one rig. Never crop sleeves out of a
  // dressed sprite: those crops retained old shoulders under the new arms.
  const riderHeads=new WeakMap();
  function riderHead(img,r,L,key,view='back'){
    const cached=riderHeads.get(img);if(cached?.[view])return cached[view];
    const out=canvas(img.width,img.height),c=out.getContext('2d');
    if(window.FamilyHeads?.has(r.def.id)){
      const hh=out.height*.34,hw=hh*1.18;
      window.FamilyHeads.draw(c,r.def.id,view,out.width*.5-hw/2,headInset(out,r,key),hw,hh);
      if(L.helmet==='couronne')headwear(out,r,key,{hat:'crown',hatColor:'#e6b33f'});
      else if(L.helmet)helmet(out,r,key,L.helmet);
      else if(!['shinobin','santa','robot'].includes(r.def.id)&&L.hat&&L.hat!=='none')headwear(out,r,key,L);
      if(L.goggles)goggles(out,r,key,L.goggles);
    }else c.drawImage(img,0,0,img.width,img.height*.33,0,0,img.width,img.height*.33);
    riderHeads.set(img,{...cached,[view]:out});return out;
  }
  function riderUpper(c,r,L,img,key,s,hip,targets,{view='back',torso=r.def.id==='milo'?.9:1}={}){
    const profile=view==='side',width=profile?.38:.59;
    const hands=[];
    const draw=target=>{
      const side=target.side,shoulder=[hip[0]+(profile?side*.055:side*.26),hip[1]-.67*torso];
      const arm=rigArm(c,L,shoulder,target.hand,s,{side,bend:target.bend??-side,scale:torso,far:profile&&side<0,hand:profile&&side<0});
      if(!profile||side>0)hands.push({arm,side});return arm;
    };
    // Rear arm, torso, near arm, then hair: the shoulder joint stays inside the coat.
    for(const target of targets)if(!profile||target.side<0)draw(target);
    c.save();c.translate(hip[0]*s,(hip[1]-.39*torso)*s);c.scale(width*s,.38*torso*s);
    SK.drawJacket(c,L.jacket,0,0,1,view,true);c.restore();
    if(!r.look?.jacket&&!profile){c.fillStyle='#fff3e1';c.font='bold '+s*.24+'px Arial';c.textAlign='center';c.fillText('1',hip[0]*s,(hip[1]-.30*torso)*s);}
    if(L.paddedVest||L.whistle)SK.drawWornTorso(c,L,hip[0]*s,(hip[1]-.39*torso)*s,.38*s,view);
    if(L.rocketPack)SK.drawRocketPack(c,(hip[0]-(profile?.24:0))*s,(hip[1]-.39*torso)*s,.36*s,view);
    if(profile)for(const target of targets)if(target.side>0)draw(target);
    for(const {arm,side} of hands)drawHand(c,L,arm.elbow,arm.wrist,s,side);
    const h=2.5*s,w=h*img.width/img.height,head=riderHead(img,r,L,key,view);
    c.drawImage(head,hip[0]*s-w/2,(hip[1]-.67*torso-.855)*s,w,h);
  }
  // Descente en ligne droite : planche dans l'axe et jambes articulées.
  // Les sprites diagonaux restent réservés aux virages et aux figures.
  function straightRider(ctx,r,L,s,steer=0) {
    const girl=r.def.gender==='girl',key=girl?'girlWalk':'boyWalk',index=girl?0:1;
    if(!frames[key])return false;
    const img=colored(frames[key][index],r,L,key+index);
    const tuck=Math.max(0,Math.min(1,Math.max(r.crouch||0,r.jumpCharge||0,r.pumpPose||0))),h=2.5*s,w=h*img.width/img.height;
    const pump=Math.min(1,Math.max(r.pumpPose||0,r.jumpCharge||0));
    const hipY=-s*(r.def.id==='milo'?.77:.96)+tuck*s*.18+pump*s*.13,hipX=-tuck*s*.07-pump*s*.03+steer*s*.12;
    ctx.save();
    const leg=(back)=>{
      const angle=steer*1.04,fx=(back?.025:-.025)*s,fy=(back?-.55:-.06)*s+s*.25;
      const footX=fx*Math.cos(angle)-fy*Math.sin(angle),footY=fx*Math.sin(angle)+fy*Math.cos(angle)-s*.25;
      const kneeX=(back?.045:.075)*s+tuck*s*.075+pump*s*.035,kneeY=(hipY+footY)*.5-tuck*s*.06;
      pantLeg(ctx,L.pants,[hipX,hipY],[kneeX,kneeY],[footX,footY-s*.10],s,{width:back?.29:.33,far:back,back:true});
      SK.drawCharacterBoot(ctx,L,footX-s*.16,footY-s*.25,s*.39,s*.34,'side');
    };
    leg(true);leg(false);
    SK.drawFancySkirt?.(ctx,L,hipX,hipY,s,'back',undefined,Math.min(1,(-hipY/s-.12)/.82));
    ctx.save();ctx.translate(hipX,hipY);ctx.rotate(tuck*.22+steer*.10);
    const extension=r.fx?.pushPose>0?Math.sin(Math.PI*SK.clamp(1-r.fx.pushPose/.55,0,1)):0;
    riderUpper(ctx,r,L,img,key+index,s,[0,0],[-1,1].map(side=>{
      const reach=side===(r.pushDirection||1)?extension:0;
      return {side,bend:reach>0?side:-side,hand:[side*(.38+.46*reach),-.065-.53*reach]};
    }));
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
  // Même caméra de dos qu'au sol. La planche vient à la main, jamais l'inverse.
  function aerialRider(c,r,L,s){
    const trick=r.curTrick,phase=trick?SK.clamp(trick.t/trick.def.dur,0,.999):0,pose=trick?.def.poses?trick.def.poses[Math.floor(phase*trick.def.poses.length)]:trick?.def.pose||'indy';
    const ease=x=>{x=SK.clamp(x,0,1);return x*x*(3-2*x);};
    const p=trick?SK.clamp(trick.t/trick.def.dur,0,1):0;
    const g=trick?ease(p/.3)*ease((1-p)/.3):0;
    // Un saut simple conserve les manches et les mains de la pose de glisse.
    const key=r.def.gender==='girl'?'girlWalk':'boyWalk',index=r.def.gender==='girl'?0:1;
    if(!frames[key])return false;
    const img=colored(frames[key][index],r,L,key+index),h=2.5*s,w=h*img.width/img.height;
    const yaw=(r.airYaw||0)+(trick?.def.anim==='spin'?p*Math.PI*2*(trick.def.turns||1)*(trick.def.sign||1):0),cos=Math.cos(yaw);
    const view=Math.abs(cos)<.42?'side':cos<0?'front':'back';
    const free=['spread','tuck','cross','superman','star'].includes(pose);
    const angles={indy:.55,nose:-1.1,tail:1.2,melon:-.6,method:-1.4,double:.3,spread:0,tuck:.25,cross:0,star:1.4,superman:0};
    const grabSide=['nose','melon','method'].includes(pose)?-1:1;
    const angle=(angles[pose]||0)*g+yaw,by=-.32-(pose==='superman'||pose==='star'||pose==='spread'?.05:pose==='tail'?.86:.78)*g;
    const bx=(free||pose==='double'?0:grabSide*.45)*g;
    const depth=.65+.35*Math.abs(cos);
    const boardPoint=(across,along)=>[bx+across*Math.cos(angle)-along*depth*Math.sin(angle),by+across*Math.sin(angle)+along*depth*Math.cos(angle)];
    const hip=[(pose==='double'?0:grabSide*.10)*g,-(r.def.id==='milo'?.77:.96)+.10*g];
    const line=(pts,color,width)=>{c.strokeStyle=color;c.lineWidth=width*s;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x*s,y*s):c.moveTo(x*s,y*s));c.stroke();};
    // Deux segments fixes : les mains ne peuvent pas dépasser la portée du bras.

    SK.drawBoard(c,r.board,bx*s,by*s,.65*s,1.48*s*depth,angle,r.input?.steer||0);
    for(const along of [-.25,.25]){
      const foot=boardPoint(0,along),ankle=[foot[0],foot[1]-.10];
      // Genoux rapprochés, fléchis dans le sens de la glisse.
      const knee=[hip[0]+.08+(foot[0]-hip[0])*.55*g,(hip[1]+ankle[1])/2-.13*g];
      pantLeg(c,L.pants,hip.map(v=>v*s),knee.map(v=>v*s),ankle.map(v=>v*s),s,{width:along<0?.29:.33,far:along<0,back:view==='back'});
      c.save();c.translate(foot[0]*s,foot[1]*s);c.rotate(angle);
      SK.drawCharacterBoot(c,L,-.16*s,-.25*s,.39*s,.34*s,'side');
      c.restore();
    }
    SK.drawFancySkirt?.(c,L,hip[0]*s,hip[1]*s,s,view,undefined,Math.min(1,(-hip[1]-.12-.35*g)/.82));
    c.save();if(view==='side'&&Math.sin(yaw)>0)c.scale(-1,1);
    riderUpper(c,r,L,img,key+index,s,hip,[-1,1].map(side=>{
      const rest=[hip[0]+side*.38,hip[1]-.065];
      const holds=pose==='double'||side===(['nose','melon','method'].includes(pose)?-1:1);
      const gripPoint=boardPoint(side*.25,pose==='nose'?-.48:pose==='tail'?.46:0);
      let target=holds?gripPoint:[hip[0]+side*.48,hip[1]-.18];
      if(pose==='spread'||pose==='star')target=[hip[0]+side*.86,hip[1]-.62+(pose==='star'?side*.25:0)];
      if(pose==='tuck')target=[hip[0]+side*.15,hip[1]-.32];
      if(pose==='cross')target=[hip[0]-side*.16,hip[1]-.62];
      if(pose==='superman')target=[hip[0]+side*.25,hip[1]-1.24];
      return {side,hand:[rest[0]+(target[0]-rest[0])*g,rest[1]+(target[1]-rest[1])*g]};
    }),{view});c.restore();
    return true;
  }
  S.draw=function(ctx,r,L,s,front,steer) {
    if(r.def.hidden&&!window.FamilyHeads?.has(r.def.id))return false;
    if(r.state==='air')return aerialRider(ctx,r,L,s);
    const key=r.def.gender==='girl'?'girlBoard':'boyBoard';if(!frames[key])return false;
    if(r.state==='ride'&&!front&&!r.curTrick){
      turningBoard(ctx,r,L,s,steer);
      straightRider(ctx,r,L,s,steer);return true;
    }
    S.shopPose(ctx,r,L,s,performance.now()/1000);return true;
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
      pantLeg(c,L.pants,[side*s*.18,hip],[side*s*.34,-s*.39],[side*s*.37,-s*.12],s,{width:.29});
      SK.drawCharacterBoot(c,L,side*s*.37-s*.16,-s*.27,s*.34,s*.30,'front',side);
    }
    SK.drawFancySkirt?.(c,L,0,hip,s,'front',undefined,Math.min(1,(-hip/s-.12)/.82));
    riderUpper(c,r,L,img,key+'0',s,[0,hip/s],[-1,1].map(side=>({side,hand:[side*.46,hip/s-.12+Math.sin(t*1.7+side)*.025]})),{view:'front'});

  };
  S.seated=function(ctx,r,L,s){
    const girl=r.def.gender==='girl',key=girl?'girlFront':'boyWalk',img=colored(frames[key][0],r,L,key+'0');
    const h=2.5*s,w=h*img.width/img.height;
    ctx.strokeStyle=L.pants;ctx.lineWidth=s*.25;ctx.lineCap='round';ctx.lineJoin='round';
    for(const side of [-1,1]){pantLeg(ctx,L.pants,[side*s*.16,-s*.06],[side*s*.28,s*.18],[side*s*.29,s*.65],s,{width:.29});
      SK.drawCharacterBoot(ctx,L,side*s*.29-s*.15,s*.49,s*.32,s*.29,'front',side);}
    SK.drawBoard(ctx,r.board,0,s*.85,s*.4,s*2.05,Math.PI/2+.07,r.input?.steer||0);
    SK.drawFancySkirt?.(ctx,L,0,0,s,'front',undefined,.5);
    riderUpper(ctx,r,L,img,key+'0',s,[0,0],[-1,1].map(side=>({side,hand:[side*.30,-.10]})),{view:'front'});
  };
  S.face=function(ctx,r,L,x,y,rad) {
    if(r.def.hidden&&!window.FamilyHeads?.has(r.def.id))return false;
    const key=r.def.gender==='girl'?'girlWalk':'boyWalk',index=r.def.gender==='girl'?3:0;
    if(!frames[key])return false;
    const img=colored(frames[key][index],r,L,key+index);
    ctx.save();ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.clip();ctx.fillStyle='#dceffa';ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
    if(!window.FamilyHeads?.draw(ctx,r.def.id,'front',x-rad*.84,y-rad*.84,rad*1.68,rad*1.68))ctx.drawImage(img,img.width*.12,0,img.width*.76,img.height*.39,x-rad*.84,y-rad*.84,rad*1.68,rad*1.68);ctx.restore();return true;
  };
  S.walk=function(ctx,r,L,x,y,s,t,direction,moving) {
    const side=['left','right'].includes(direction),back=direction.startsWith('up');
    const view=side?'side':back?'back':'front',girl=r.def.gender==='girl';
    const key=girl?'girlWalk':'boyWalk',index=side?(girl?1:2):back?(girl?0:1):(girl?3:0);
    if(!frames[key])return;
    const img=colored(frames[key][index],r,L,key+index);
    const p=proportions[r.def.id]||{torso:1,legs:1};
    const hip=-.20-.75*p.legs,torso=p.torso,phase=t*Math.PI*3.6;
    const bob=moving?-Math.abs(Math.sin(phase))*.018:0;
    ctx.save();ctx.translate(x,y);if(direction==='left'||direction.endsWith('Left'))ctx.scale(-1,1);
    const steps=[];
    for(const sign of [-1,1]){
      const a=phase+(sign<0?Math.PI:0),swing=moving?Math.sin(a):0;
      const footX=side?swing*.22:sign*.15+swing*.025;
      const lift=moving?Math.max(0,Math.cos(a))*.07:0;
      const hx=side?0:sign*.13,hy=hip+bob,ax=footX,ay=-.18-lift;
      const knee=[hx+(ax-hx)*.5+(side?.06:0),(hy+ay)*.5-.025*Math.abs(swing)];
      pantLeg(ctx,L.pants,[hx*s,hy*s],knee.map(v=>v*s),[ax*s,ay*s],s,{width:.25,far:side&&sign<0,back});
      SK.drawCharacterBoot(ctx,L,(ax-.13)*s,(ay-.12)*s,(side?.37:.28)*s,.31*s,view,side?1:sign);
      steps.push({side:sign,swing});
    }
    SK.drawFancySkirt?.(ctx,L,0,(hip+bob)*s,s,view,undefined,Math.min(1,(-hip-bob-.12)/.82));
    const digAngle=-.25+Math.sin((r.digProgress||0)*Math.PI*6)*.55;
    const targets=steps.map(({side:sign,swing})=>{
      if(r.digProgress>0){const grip=sign<0?.48:.18;return {side:sign,hand:[.14+Math.sin(digAngle)*grip,hip+bob+.03-Math.cos(digAngle)*grip]};}
      if(r.wave&&sign>0)return {side:sign,bend:1,hand:[.62,hip+bob-.98*torso+Math.sin(t*8)*.035]};
      return {side:sign,bend:side?1:-sign,hand:[side?-swing*.23:sign*(.37+Math.abs(swing)*.025),hip+bob-(.065+Math.abs(swing)*.07)*torso]};
    });
    riderUpper(ctx,r,L,img,key+index,s,[0,hip+bob],targets,{view,torso});
    if(r.digProgress>0)SK.drawShovel(ctx,.14*s,(hip+bob+.03)*s,s,digAngle);
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
      pantLeg(c,L.pants||r.def.colors.pants,[hx,hy],[kx,ky],[ax,ay],1,{width:.25,far:side&&!near});
      SK.drawCharacterBoot(c,L,ax-.13,ay-.12,side?.37:.28,.31,side?'side':'front',side?1:sign);
    };
    leg(false);leg(true);
    const arm=(near)=>{
      const sign=near?1:-1,shoulder=[side?(near?.06:-.06):sign*.23,-1.56-bob];
      const swing=side?-step(near?0:Math.PI).x:0,waving=r.wave&&near;
      const hand=waving?[.58,-1.91-bob+Math.sin(t*8)*.035]:[side?swing:sign*.36,-.94-bob-Math.abs(swing)*.12];
      rigArm(c,L,shoulder,hand,1,{side:sign,bend:waving||side?1:-sign,far:side&&!near});
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
    return fullWalk(ctx,r,L,x,y,s,t,direction,moving);
  };
  S.draw=function(ctx,r,L,s,front,steer){return fullDraw(ctx,r,L,s,front,steer);};
  S.seated=function(ctx,r,L,s){return fullSeat(ctx,r,L,r.def.id==='milo'?s*.72:s);};
})(window.SK);
