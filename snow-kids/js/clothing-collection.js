// Collection habillable : mêmes dessins en boutique, à pied et sur la planche.
(function(SK){
  'use strict';
  const tops=[
    ['hoodie-gris','Coton ouaté Nuage','#70818d','hoodie','#dae5e9','#394b59'],
    ['hoodie-lavande','Coton ouaté Lavande','#9b89ba','hoodie','#e9dff4','#55466d'],
    ['doudoune','Doudoune Glacier','#5098b5','puffer','#d2edf4','#254d66'],
    ['anorak','Anorak Soleil','#dba33e','anorak','#344d62','#344052'],
    ['noel','Manteau du Père Noël','#bd293e','santa','#fff6df','#53313a'],
    ['lutin','Tunique de lutin','#25845b','elf','#d74349','#194e3c'],
    ['ninja','Veste de ninja','#242c40','ninja','#bc384b','#101a2a'],
    ['superman','Manteau Superman','#2268b4','hero-superman','#e03c42','#183859'],
    ['flash','Manteau Flash','#ce3038','hero-flash','#ffd557','#752c36'],
    ['batman','Manteau Batman','#414956','hero-batman','#efc84c','#1c2530']
  ];
  for(const [id,name,color,collection,panel,trim] of tops){
    SK.JACKET_STYLES[color]={main:color,panel,trim,collection,neck:['santa','elf','ninja'].includes(collection)};
    SK.WARDROBE.push({id:'jacket-'+id,name,cat:'linge',slot:'jacket',value:color,price:collection==='hoodie'?160:240,newCollection:true,desc:{hoodie:'Coton ouaté doux, capuche, cordons et poche kangourou.',puffer:'Doudoune gonflée à boudins matelassés et col montant.',anorak:'Anorak à grande poche ventrale et courte fermeture.',santa:'Manteau rouge, bordures crème et ceinture à boucle dorée. Pantalon et tuque assortis vendus séparément.',elf:'Tunique verte à col pointu rouge, ceinture et boutons dorés. Pantalon et tuque assortis vendus séparément.',ninja:'Veste croisée anthracite avec ceinture rouge. Pantalon et cagoule assortis vendus séparément.'}[collection]||'Manteau de super-héros avec emblème sur la poitrine et au dos, empiècements et poignets assortis.'});
  }
  SK.PANT_STYLES={};
  for(const [id,name,color,type,accent] of [
    ['jogging-gris','Jogging gris','#68747f','jogger','#e9eff2'],['jogging-lavande','Jogging lavande','#8b7c9f','jogger','#eee3f4'],['jogging-noir','Jogging noir','#333d49','jogger','#f5f5ef'],
    ['snow-polaire','Pantalon de snow blanc polaire','#f2f5f8','snow','#65879c'],['snow-bleu','Pantalon de snow bleu alpin','#386889','snow','#c6e4ee'],
    ['noel','Pantalon du Père Noël','#b3293a','santa','#fff6df'],['lutin','Pantalon de lutin','#246d49','elf','#d74349'],['ninja','Pantalon de ninja','#20283a','ninja','#8d9baa']
  ]){SK.PANT_STYLES[color]={type,accent};SK.WARDROBE.push({id:'pants-'+id,name,cat:'linge',slot:'pants',value:color,price:type==='jogger'?120:180,newCollection:true,desc:{jogger:'Jogging souple, cordon à la taille, bandes latérales et chevilles resserrées.',snow:'Pantalon de snow ample, poches cargo, genoux articulés et bas renforcés.',santa:'Pantalon rouge à revers crème, assorti au manteau du Père Noël.',elf:'Pantalon vert avec chaussettes rayées rouges, assorti à la tunique de lutin.',ninja:'Pantalon anthracite souple, bandes croisées aux mollets.'}[type]});}
  for(const [id,name] of [['santa','Tuque du Père Noël'],['elf','Tuque de lutin'],['ninja','Cagoule de ninja']])SK.WARDROBE.push({id:'hat-'+id,name,cat:'linge',slot:'hat',value:'costume-'+id,price:140,newCollection:true,desc:'Accessoire assorti au costume, à porter sur ton propre personnage.'});
  for(const [id,name,color] of [['casqueCone','Casque Cône de chantier','#f78a37'],['casqueRequin','Casque Requin','#4b8da4'],['casqueDino','Casque Dinosaure','#599d65']]){
    SK.HELMETS[id]=color;SK.GEAR.push({id,name,cat:'equip',price:350,rank:1,desc:'Casque fantaisie : tu te relèves 20 % plus vite après une chute, comme avec les autres casques.'});
  }
  SK.GEAR.push({id:'lunettesCool',name:'Lunettes noires Cool',cat:'equip',price:160,rank:1,desc:'Monture noire, verres fumés et reflets discrets. Accessoire de style.'});
  const oldIsGoggles=SK.isGoggles;SK.isGoggles=id=>id==='lunettesCool'||oldIsGoggles(id);
  const oldLook=SK.lookOf;SK.lookOf=function(def,save){const look=oldLook(def,save);if(!Object.prototype.hasOwnProperty.call(save?.look?.[def.id]||{},'goggles')&&!look.goggles&&save?.gear?.includes('lunettesCool'))look.goggles='lunettesCool';return look;};
  const round=(c,x,y,w,h,r,fill)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
  const line=(c,pts,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  SK.drawHeroEmblem=function(c,type,x,y,size){
    c.save();c.translate(x,y);c.scale(size,size);c.lineJoin='round';c.lineCap='round';
    if(type==='hero-superman'){
      c.fillStyle='#ffd65c';c.strokeStyle='#e3353f';c.lineWidth=.13;c.beginPath();c.moveTo(-.85,-.45);c.lineTo(-.54,-.78);c.lineTo(.54,-.78);c.lineTo(.85,-.45);c.lineTo(0,.73);c.closePath();c.fill();c.stroke();
      c.strokeStyle='#d82e3d';c.lineWidth=.16;c.beginPath();c.moveTo(.43,-.42);c.bezierCurveTo(.1,-.69,-.55,-.56,-.42,-.24);c.bezierCurveTo(-.34,-.07,.37,-.22,.32,.08);c.quadraticCurveTo(.25,.33,-.23,.23);c.stroke();
    }else if(type==='hero-flash'){
      c.fillStyle='#fff5df';c.beginPath();c.arc(0,0,.75,0,Math.PI*2);c.fill();c.fillStyle='#ffca35';c.strokeStyle='#ce8e22';c.lineWidth=.04;c.beginPath();c.moveTo(.32,-1);c.lineTo(-.58,.12);c.lineTo(-.08,.12);c.lineTo(-.33,1);c.lineTo(.64,-.19);c.lineTo(.12,-.19);c.closePath();c.fill();c.stroke();
    }else{
      c.fillStyle='#f1cc4b';c.beginPath();c.ellipse(0,0,1,.61,0,0,Math.PI*2);c.fill();c.fillStyle='#18212d';c.beginPath();c.moveTo(-.88,-.25);c.quadraticCurveTo(-.61,.05,-.26,-.10);c.lineTo(-.16,-.40);c.lineTo(-.08,-.20);c.lineTo(.08,-.20);c.lineTo(.16,-.40);c.lineTo(.26,-.10);c.quadraticCurveTo(.61,.05,.88,-.25);c.lineTo(.79,.22);c.quadraticCurveTo(.38,.04,.15,.33);c.lineTo(0,.47);c.lineTo(-.15,.33);c.quadraticCurveTo(-.38,.04,-.79,.22);c.closePath();c.fill();
    }c.restore();
  };
  const oldJacket=SK.drawJacket;
  SK.drawJacket=function(c,color,x,y,s,view='front',torsoOnly=false){
    const p=SK.jacketPalette(color),type=p.collection;if(!type)return oldJacket(c,color,x,y,s,view,torsoOnly);
    const side=view==='side',back=view==='back',half=side?.43:type==='puffer'?.61:.55;
    c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='round';c.lineCap='round';
    if(!torsoOnly&&!side)for(const sign of [-1,1])SK.drawCollectionSleeve(c,{jacket:color},sign*.43,-.66,sign*.73,.06,sign*.85,.84,2.25);
    c.beginPath();c.moveTo(-half*.65,-.83);c.quadraticCurveTo(-half,-.78,-half,-.38);c.lineTo(-half,.91);c.quadraticCurveTo(0,1.10,half,.91);c.lineTo(half,-.38);c.quadraticCurveTo(half,-.78,half*.65,-.83);c.closePath();
    c.fillStyle=p.main;c.fill();c.strokeStyle=p.trim;c.lineWidth=.025;c.stroke();c.save();c.clip();
    const g=c.createLinearGradient(-half,0,half,0);g.addColorStop(0,'#0b223c40');g.addColorStop(.35,'#ffffff20');g.addColorStop(.75,'#ffffff00');g.addColorStop(1,'#0b223c40');c.fillStyle=g;c.fill();
    if(type.startsWith('hero-')){
      round(c,-half,-.85,half*2,.28,.02,p.panel);
      round(c,-half,.76,half*2,.14,.01,p.panel);
      c.save();if(side){c.translate(.12,0);c.scale(.68,1);}SK.drawHeroEmblem(c,type,0,-.12,back?.32:.38);c.restore();
    }
    if(type==='puffer')for(const yy of [-.42,-.08,.28,.64]){c.strokeStyle=p.trim+'88';c.lineWidth=.022;c.beginPath();c.moveTo(-half,yy);c.quadraticCurveTo(0,yy+.12,half,yy);c.stroke();c.strokeStyle='#ffffff48';c.beginPath();c.moveTo(-half,yy+.045);c.quadraticCurveTo(0,yy+.16,half,yy+.045);c.stroke();}
    if(type==='anorak'){round(c,-half,-.85,half*2,.56,.02,p.panel);if(!back)round(c,side?-.13:-.39,.20,side?.44:.78,.47,.06,p.panel);}
    if(type==='hoodie'&&!back){c.fillStyle=p.trim+'55';c.beginPath();c.moveTo(-.25,.25);c.lineTo(.25,.25);c.lineTo(.42,.69);c.quadraticCurveTo(0,.81,-.42,.69);c.closePath();c.fill();line(c,[[-.25,.25],[-.42,.69]],p.panel,.025);line(c,[[.25,.25],[.42,.69]],p.panel,.025);}
    if(type==='santa'){round(c,-half,.79,half*2,.24,.03,p.panel);if(!back)round(c,side?.25:-.07,-.8,.14,1.7,.02,p.panel);}
    if(type==='ninja'&&!back){line(c,[[-.38,-.8],[.33,-.12],[-.33,.45]],'#596578',.055);line(c,[[.36,-.8],[-.29,-.18]],'#596578',.035);}
    if(['santa','elf','ninja'].includes(type)){round(c,-half,.45,half*2,.18,.01,type==='ninja'?p.panel:'#24313b');if(!back&&!side&&type!=='ninja'){c.strokeStyle='#edc65b';c.lineWidth=.045;c.strokeRect(side?.17:-.12,.43,.24,.22);}}
    if(type==='elf'&&!back)for(const yy of [-.18,.08]){c.fillStyle='#efce63';c.beginPath();c.arc(side?.22:0,yy,.045,0,Math.PI*2);c.fill();}
    if(!['santa','elf'].includes(type))round(c,-half,.91,half*2,.10,.02,p.trim);
    c.restore();
    if(['hoodie','anorak'].includes(type)){
      c.fillStyle=p.main;c.beginPath();c.ellipse(0,-.84,.42,.30,0,0,Math.PI*2);c.fill();c.strokeStyle=p.trim;c.lineWidth=.025;c.stroke();
      if(!back){c.fillStyle=p.trim;c.beginPath();c.ellipse(0,-.87,.30,.17,0,0,Math.PI*2);c.fill();if(type==='hoodie')for(const sign of [-1,1])line(c,[[sign*.18,-.65],[sign*.19,-.31]],p.panel,.025);}
    }else if(type==='elf'){c.fillStyle=p.panel;c.beginPath();c.moveTo(-.38,-.84);c.lineTo(0,-.65);c.lineTo(.38,-.84);c.lineTo(.44,-.41);c.lineTo(.17,-.51);c.lineTo(0,-.30);c.lineTo(-.17,-.51);c.lineTo(-.44,-.41);c.closePath();c.fill();}
    else round(c,-.33,-.92,.66,.29,.07,type==='santa'?p.panel:p.main);
    if(['puffer','anorak'].includes(type)&&!back){const zx=side?.30:0;line(c,[[zx,-.64],[zx,type==='puffer'?.90:.04]],p.trim,.04);round(c,zx-.025,-.48,.05,.09,.01,'#edf1ed');}
    c.restore();
  };
  SK.drawCollectionSleeve=function(c,L,sx,sy,ex,ey,hx,hy,s){
    const p=SK.jacketPalette(L.jacket),type=p.collection;if(!type)return false;
    c.save();c.lineJoin='round';c.lineCap='butt';line(c,[[sx,sy],[ex,ey],[hx,hy]],p.trim,s*.215);line(c,[[sx,sy],[ex,ey],[hx,hy]],p.main,s*.19);
    if(type==='puffer')for(const q of [.35,.7]){const x=sx+(ex-sx)*q,y=sy+(ey-sy)*q;c.save();c.translate(x,y);c.rotate(Math.atan2(ey-sy,ex-sx));line(c,[[0,-s*.085],[0,s*.085]],p.trim+'88',s*.012);c.restore();}
    const cuff=type==='santa'?'#fff6df':type==='elf'||type.startsWith('hero-')?p.panel:p.trim;
    line(c,[[hx+(ex-hx)*.18,hy+(ey-hy)*.18],[hx,hy]],cuff,s*.20);c.restore();return true;
  };
  // Shared leg panels: local x is across a leg; y follows the lower leg.
  SK.drawCollectionPantDetail=function(c,color,w,h,s,upper){
    const p=SK.PANT_STYLES[color];if(!p)return false;const type=p.type;
    c.save();c.lineCap='round';
    if(type==='jogger'){for(const xx of [w*.25,w*.37])line(c,[[xx,0],[xx,h]],p.accent,s*.016);if(!upper){round(c,-w*.5,h-s*.12,w,s*.14,.01,'#192c3e66');for(let k=-3;k<=3;k++)line(c,[[k*w*.10,h-s*.10],[k*w*.10,h]],p.accent+'66',s*.009);}}
    else if(type==='ninja'&&!upper){for(let yy=h*.30;yy<h;yy+=s*.075)line(c,[[-w*.5,yy],[w*.5,yy+s*.07]],p.accent,s*.017);}
    else if(type==='elf'&&!upper){for(let yy=h*.40;yy<h;yy+=s*.13)round(c,-w*.6,yy,w*1.2,s*.065,.01,p.accent);}
    else if(type==='santa'&&!upper)round(c,-w*.6,h-s*.14,w*1.2,s*.16,.025,p.accent);
    else if(type==='snow'){if(upper){round(c,-w*.32,h*.25,w*.64,h*.44,w*.08,'#243c5322');line(c,[[-w*.32,h*.32],[w*.32,h*.32]],p.accent,s*.02);}else{round(c,-w*.5,h-s*.13,w,s*.15,.01,'#324f6599');line(c,[[-w*.30,h*.16],[0,h*.21],[w*.30,h*.16]],p.accent,s*.015);}}
    c.restore();return true;
  };
  const oldPants=SK.drawPants;
  SK.drawPants=function(c,color,x,y,s){
    const p=SK.PANT_STYLES[color];if(!p)return oldPants(c,color,x,y,s);
    c.save();c.translate(x,y);c.scale(s,s);const jog=p.type==='jogger',snow=p.type==='snow';
    for(const sign of [-1,1]){c.save();c.scale(sign,1);c.beginPath();c.moveTo(.02,-.91);c.quadraticCurveTo(.35,-.98,.59,-.87);c.quadraticCurveTo(snow?.71:.62,-.1,jog?.46:.57,.86);c.quadraticCurveTo(.34,.94,jog?.22:.14,.86);c.lineTo(.11,-.25);c.quadraticCurveTo(.02,-.34,.02,-.91);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#2c425c88';c.lineWidth=.022;c.stroke();c.save();c.clip();const g=c.createLinearGradient(.1,0,.65,0);g.addColorStop(0,'#102b4133');g.addColorStop(.5,'#ffffff25');g.addColorStop(1,'#102b4144');c.fillStyle=g;c.fill();c.translate(.35,-.83);SK.drawCollectionPantDetail(c,color,.46,.77,1,true);c.translate(0,.77);SK.drawCollectionPantDetail(c,color,.46,.94,1,false);c.restore();c.restore();}
    round(c,-.56,-.93,1.12,.15,.025,'#283b4e55');if(jog){line(c,[[0,-.83],[-.07,-.61]],p.accent,.025);line(c,[[0,-.83],[.08,-.57]],p.accent,.025);}c.restore();
  };
  const oldHeadwear=SK.drawHeadwear;
  SK.drawHeadwear=function(c,kind,color,x,y,w,h,view='front',worn=false){
    if(!kind?.startsWith('costume-'))return oldHeadwear(c,kind,color,x,y,w,h,view,worn);
    c.save();c.translate(x,y);c.scale(w,h);c.lineJoin='round';
    if(kind==='costume-ninja'){
      c.fillStyle='#20283a';c.beginPath();c.moveTo(-.52,.65);c.bezierCurveTo(-.62,-.25,.50,-.28,.52,.65);c.lineTo(.47,1.65);c.lineTo(-.47,1.65);c.closePath();
      // Eye window stays transparent, revealing the player's own eyes.
      if(view!=='back')c.roundRect(view==='side'?.05:-.39,.91,view==='side'?.46:.78,.27,.08);c.fill('evenodd');
      round(c,-.51,.65,1.02,.16,.02,'#bc384b');if(view==='side')line(c,[[-.48,.73],[-.70,1.22]],'#bc384b',.12);
    }else{
      const elf=kind==='costume-elf';c.fillStyle=elf?'#25845b':'#bd293e';c.beginPath();c.moveTo(-.51,.58);c.quadraticCurveTo(-.39,.02,.10,.02);c.quadraticCurveTo(.52,.02,.66,.28);c.lineTo(.39,.22);c.quadraticCurveTo(.25,.05,.25,.03);c.lineTo(.51,.58);c.closePath();c.fill();
      round(c,-.53,.45,1.06,.24,.08,elf?'#d74349':'#fff6df');c.fillStyle=elf?'#edc65b':'#fff6df';c.beginPath();c.ellipse(.63,.29,elf?.10:.14,.17,0,0,Math.PI*2);c.fill();
    }c.restore();
  };
  const oldGoggles=SK.drawGoggles;
  SK.drawGoggles=function(c,id,x,y,s,view='front'){
    if(id!=='lunettesCool')return oldGoggles(c,id,x,y,s,view);
    c.save();c.translate(x,y);c.scale(s,s);c.lineCap='round';if(view==='back'){line(c,[[-1,0],[-.75,.05]],'#111820',.09);line(c,[[.75,.05],[1,0]],'#111820',.09);}else if(view==='side'){line(c,[[-.95,-.10],[.65,-.10]],'#111820',.11);round(c,.22,-.26,.63,.49,.12,'#10151e');line(c,[[.34,-.16],[.64,-.16]],'#77919e',.045);}else{for(const sign of [-1,1]){round(c,sign<0?-.98:.10,-.32,.88,.64,.17,'#0f151e');line(c,[[sign*.25,-.19],[sign*.66,-.19]],'#728894',.045);}line(c,[[-.14,-.13],[.14,-.13]],'#111820',.10);}c.restore();
  };
  const oldHelmet=SK.drawSnowHelmet;
  SK.drawSnowHelmet=function(c,id,x,y,w,h,view='side',worn=false,fit=null){
    if(!['casqueCone','casqueRequin','casqueDino'].includes(id))return oldHelmet(c,id,x,y,w,h,view,worn,fit);
    if(id!=='casqueCone')oldHelmet(c,id,x,y,w,h,view,worn,fit);c.save();c.translate(x,y);c.scale(w/2,h);c.lineJoin='round';
    if(id==='casqueCone'){if(view!=='back'){const chin=worn&&fit?.chinY?fit.chinY/h:1.45;line(c,[[-.78,.87],[-.40,chin],[.40,chin],[.78,.87]],'#263743',.05);}c.beginPath();c.moveTo(-.85,.83);c.lineTo(-.10,.04);c.quadraticCurveTo(0,-.01,.10,.04);c.lineTo(.85,.83);c.closePath();c.fillStyle='#f78a37';c.fill();c.save();c.clip();for(const yy of [.22,.55])round(c,-1,yy,2,.14,.01,'#fff5df');c.restore();round(c,-1,.81,2,.14,.05,'#df672a');}
    else if(id==='casqueRequin'){c.fillStyle='#37677e';c.beginPath();c.moveTo(-.35,.06);c.lineTo(-.10,-.35);c.lineTo(.31,.07);c.closePath();c.fill();if(view!=='back'){for(const xx of view==='side'?[.53]:[-.55,.55]){c.fillStyle='white';c.beginPath();c.ellipse(xx,.35,.12,.12,0,0,Math.PI*2);c.fill();c.fillStyle='#162e3b';c.beginPath();c.arc(xx+.035,.35,.055,0,Math.PI*2);c.fill();}for(let i=0;i<5;i++){const xx=-.65+i*.28;c.fillStyle='#fff8e6';c.beginPath();c.moveTo(xx,.73);c.lineTo(xx+.12,.91);c.lineTo(xx+.23,.73);c.fill();}}}
    else{for(const xx of [-.52,0,.52]){c.fillStyle='#e9bb52';c.beginPath();c.moveTo(xx-.18,.12);c.lineTo(xx,-.28);c.lineTo(xx+.18,.12);c.closePath();c.fill();}if(view!=='back')for(const xx of view==='side'?[.55]:[-.55,.55]){c.fillStyle='#fff2c8';c.beginPath();c.arc(xx,.38,.12,0,Math.PI*2);c.fill();line(c,[[xx,.31],[xx,.45]],'#183c32',.045);}}
    c.restore();
  };
})(window.SK);
