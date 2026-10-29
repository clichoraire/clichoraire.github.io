// One boot model for the shop, walking, riding, grabs and chairlift poses.
(function(SK){
 'use strict';
 const rows=[
 ['alpine','Alpine graphite','#364e60','#91bac9','classic'],
 ['rose','Rose bonbon','#dc4f91','#ffe6f3','classic'],['glacier','Bleu glacier','#398fc5','#c8f6ff','classic'],
 ['lavande','Lavande','#9680ca','#f0e5ff','classic'],['menthe','Menthe','#52aa99','#ddfff2','classic'],
 ['corail','Corail','#ed795f','#ffe6bd','classic'],['soleil','Jaune soleil','#e9b83c','#fff4ce','classic'],
 ['rouge','Rouge course','#c94050','#fff0e4','race'],['cobalt','Cobalt électrique','#365cbd','#94f3ed','race'],
 ['neige','Blanc polaire','#eef4f8','#83aabd','fleece'],['minuit','Noir et or','#29303d','#f4d382','race'],
 ['aurore','Aurore boréale','#476985','#8bf2d4','aurora'],['galaxie','Galaxie étoilée','#514a86','#f2d2ff','stars'],
 ['arcenciel','Arc-en-ciel','#cde4ee','#ffffff','rainbow'],['lave','Lave flamboyante','#403a43','#ffb345','flame'],
 ['panda','Panda des neiges','#edf1ef','#343f4c','panda'],['yeti','Yéti turquoise','#5bbbc4','#edfaff','fleece'],
 ['argent','Argent lunaire','#a8b9cb','#eefaff','metal'],['prune','Prune givrée','#84517e','#f4c8e2','stars']
 ];
 SK.BOOT_STYLES=Object.fromEntries(rows.map(([id,name,main,accent,pattern])=>[id,{id,name,main,accent,pattern}]));
 for(const [id,name,,,pattern] of rows)SK.WARDROBE.push({id:'boot-style-'+id,name:'Bottes '+name,cat:'linge',slot:'bootStyle',value:id,price:id==='alpine'?0:pattern==='classic'?120:180,newCollection:true,desc:'Bottes de snow à semelles crantées, renforts et attaches détaillées. Couleur compatible avec tes bottes à crampons ou à ressorts.'});
 const oldLook=SK.lookOf;
 SK.lookOf=function(def,save){const l=oldLook(def,save),id=l.bootStyle;l.bootStyle=SK.BOOT_STYLES[id]&&(id==='alpine'||save?.wardrobe?.includes('boot-style-'+id))?id:'alpine';return l;};
 SK.drawCharacterBoot=function(c,L,x,y,w,h,view='side',side=1){
  const p=SK.BOOT_STYLES[L.bootStyle]||SK.BOOT_STYLES.alpine,profile=view==='side',back=view==='back';
  c.save();c.translate(x+(side<0?w:0),y);c.scale(side*w,h);
  const box=(x,y,w,h,r,col)=>{c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
  const line=(points,col,width)=>{c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const shape=()=>{c.beginPath();c.moveTo(.19,.05);c.quadraticCurveTo(.45,-.025,.72,.05);c.lineTo(.74,.57);c.quadraticCurveTo(profile?1:.87,.59,profile?.98:.88,.83);c.quadraticCurveTo(.98,.94,.80,.94);c.lineTo(.15,.94);c.quadraticCurveTo(.045,.91,.09,.76);c.lineTo(.14,.59);c.closePath();};
  if(L.springBoots){line([[.24,.75],[.76,.80],[.24,.85],[.76,.90],[.24,.95]],'#243b50',.075);line([[.24,.75],[.76,.80],[.24,.85],[.76,.90],[.24,.95]],'#d5ecf5',.03);box(.06,.95,.92,.05,.02,'#223342');c.scale(1,.78);}
  shape();const g=c.createLinearGradient(0,0,1,.35);g.addColorStop(0,p.main);g.addColorStop(.45,p.main);g.addColorStop(1,'#243748');c.fillStyle=g;c.fill();c.strokeStyle='#243648';c.lineWidth=.035;c.stroke();
  c.save();shape();c.clip();
  box(.18,.14,.53,.45,.08,p.main);box(.23,.15,.07,.43,.03,'#ffffff25');
  if(p.pattern==='aurora'||p.pattern==='rainbow'){
   const colors=p.pattern==='rainbow'?['#f47799','#ffc85b','#92d9a1','#72c6ef','#b69cea']:['#96e9d2','#7eb9f4','#c8a6f1'];
   colors.forEach((col,i)=>line([[.10,.25+i*.095],[.84,.43+i*.095]],col,.065));
  }
  if(p.pattern==='race')line([[.16,.25],[.45,.43],[.74,.24]],p.accent,.07);
  if(p.pattern==='stars')for(const [xx,yy]of [[.28,.22],[.60,.44],[.4,.68]]){line([[xx-.055,yy],[xx+.055,yy]],p.accent,.025);line([[xx,yy-.065],[xx,yy+.065]],p.accent,.025);}
  if(p.pattern==='flame'){c.fillStyle=p.accent;c.beginPath();c.moveTo(.2,.82);c.quadraticCurveTo(.15,.56,.33,.4);c.quadraticCurveTo(.28,.66,.45,.60);c.lineTo(.54,.32);c.quadraticCurveTo(.86,.66,.72,.82);c.fill();}
  if(p.pattern==='metal')line([[.25,.10],[.55,.75]],'#ffffff80',.12);
  box(.12,.72,profile?.84:.77,.16,.07,'#243748');line([[.19,.73],[.77,.73]],p.accent,.035);
  if(!back&&p.pattern!=='panda'){box(.32,.17,.27,.39,.045,'#24374888');for(const yy of [.25,.36,.47]){line([[.34,yy],[.56,yy+.075]],p.accent,.028);line([[.56,yy],[.34,yy+.075]],p.accent,.028);}}
  else if(back){box(.34,.23,.25,.33,.04,'#24374855');line([[.47,.28],[.47,.49]],p.accent,.025);}
  if(p.pattern==='panda'&&!back){for(const xx of [.32,.61]){box(xx-.06,.30,.12,.14,.055,p.accent);box(xx-.015,.33,.03,.04,.01,'#fff');}box(.44,.48,.07,.05,.02,p.accent);}
  c.restore();
  box(.12,.02,.64,.14,.045,p.pattern==='fleece'?'#f2f5ed':p.accent);
  if(p.pattern==='fleece')for(let i=0;i<7;i++)box(.12+i*.09,.02,.10,.15,.045,'#f2f5ed');
  box(.13,.57,.62,.08,.025,p.accent);box(.57,.55,.13,.12,.025,'#d7e5ed');box(.60,.58,.07,.055,.015,'#415566');
  box(.10,.87,.84,.08,.035,'#182d3b');line([[.17,.87],[.87,.87]],'#d6e4eb',.018);
  for(let i=0;i<5;i++)box(.13+i*.16,.93,.10,L.gripBoots?.09:.045,.012,'#182d3b');
  c.restore();
 };
})(window.SK);
