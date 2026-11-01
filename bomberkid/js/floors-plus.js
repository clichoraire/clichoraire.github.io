// Tuiles de sol supplémentaires (nature, intérieur, fantaisie) : définitions partagées par le jeu et l’éditeur,
// et dessin de leur motif sur le dessus d’une case. Chaque tuile a son caractère dans la grille et son numéro de terrain.
(function(BK){
'use strict';
const F=(ch,terrain,id,name,icon,cat,colors,o={})=>({ch,terrain,id,name,icon,cat,colors,...o});
BK.EXTRA_FLOORS=[
 F('¦',21,'honey','Miel','🍯','fantaisie',['#f2b632','#eaa823'],{slow:.45,hint:'Collant : on avance beaucoup moins vite.'}),
 F('§',22,'parquetry','Parqueterie','🟫','interieur',['#c48d52','#b9824a'],{hint:'Petits carrés de lattes croisées.'}),
 F('¨',23,'herringbone','Parquet en chevrons','🪵','interieur',['#c99657','#bd8a4d'],{hint:'Lattes en point de Hongrie.'}),
 F('©',24,'pebbles','Galets de rivière','🪨','nature',['#a9a59a','#a19d92']),
 F('ª',25,'mulch','Paillis de bois','🪵','nature',['#7a5232','#704b2d']),
 F('¬',26,'leaves','Feuilles mortes','🍂','nature',['#9b6a35','#93622f']),
 F('®',27,'mud','Boue','🟤','nature',['#5c4129','#553c26'],{slow:.65,hint:'Sol mou : on avance un peu moins vite.'}),
 F('¯',28,'flowergrass','Gazon fleuri','🌸','nature',['#62b94d','#58ad44']),
 F('°',29,'moss','Mousse végétale','🟢','nature',['#3f8f3a','#3a8636']),
 F('±',30,'whitesand','Sable blanc','🏖️','nature',['#f6eedb','#efe6d0']),
 F('²',31,'asphalt','Asphalte','⬛','nature',['#34363c','#303238']),
 F('³',32,'marble','Marbre blanc','🏛️','interieur',['#f0eff0','#e8e7ea']),
 F('´',33,'concrete','Béton ciré','🩶','interieur',['#aeb2b7','#a7abb0']),
 F('µ',34,'cementtile','Carreaux de ciment','🎨','interieur',['#efe4cf','#e9ddc6']),
 F('¶',35,'thickcarpet','Moquette épaisse','🟫','interieur',['#9b7563','#946e5c']),
 F('¸',36,'glass','Plancher de verre','🪟','interieur',['rgba(190,232,245,.55)','rgba(178,224,240,.55)']),
 F('¹',37,'grating','Caillebotis','⛓️','interieur',['#6b7179','#646a72']),
 F('º',38,'tatami','Tatami','🌾','interieur',['#cfc283','#c8bb7c']),
 F('¼',39,'deepwater','Eau profonde','🌊','fantaisie',['#1d4c9c','#1a4592'],{deep:true,hint:'Comme l’eau, en plus sombre : on y tombe à pied, la barque y passe.'}),
 F('¾',40,'crystal','Cristal','💎','fantaisie',['#9f8fe6','#9284dc']),
 F('¿',41,'cosmic','Sol cosmique','🌌','fantaisie',['#181638','#151333']),
 F('Ã',42,'vent','Grille d’aération','🕳️','fantaisie',['#8d9299','#878c93'])
];
// Matériaux des ponts et des rampes.
BK.MATERIALS={
 bois:{name:'Bois',top:'#bb925a',side:'#7c5a3b',dark:'#56402d',line:'rgba(80,48,22,.55)',kind:'planks'},
 pierre:{name:'Pierre',top:'#bdbab3',side:'#8f8c85',dark:'#6e6b65',line:'rgba(70,68,64,.4)',kind:'blocks'},
 brique:{name:'Brique',top:'#c2623f',side:'#9b4731',dark:'#6f3121',line:'rgba(245,225,205,.55)',kind:'bricks'},
 metal:{name:'Métal',top:'#a3acb6',side:'#6f7882',dark:'#4f565f',line:'rgba(50,55,62,.5)',kind:'rivets'},
 marbre:{name:'Marbre',top:'#efedec',side:'#cbc7c6',dark:'#a8a3a2',line:'rgba(150,150,160,.45)',kind:'blocks'}
};
// Motif d'un matériau sur une face (planches, blocs, briques, rivets).
BK.drawMaterialTop=function(ctx,p,m,along){
 const D=BK.draw3d,at=(u,v)=>along?D.onQuad(p,v,u):D.onQuad(p,u,v),line=(u0,v0,u1,v1)=>{const a=at(u0,v0),b=at(u1,v1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 ctx.save();ctx.strokeStyle=m.line;ctx.lineWidth=1.2;
 if(m.kind==='planks')for(let n=1;n<4;n++)line(0,n/4,1,n/4);
 else if(m.kind==='blocks'){line(0,.5,1,.5);line(.5,0,.5,.5);line(.25,.5,.25,1);line(.75,.5,.75,1);}
 else if(m.kind==='bricks')for(let n=0;n<4;n++){line(0,n/4,1,n/4);const o=n%2?.25:0;for(let u=o+.5;u<1;u+=.5)line(u,n/4,u,(n+1)/4);if(o)line(o,n/4,o,(n+1)/4);}
 else {ctx.fillStyle=m.line;for(const [u,v]of [[.12,.12],[.88,.12],[.12,.88],[.88,.88]]){const q=at(u,v);ctx.beginPath();ctx.arc(q.x,q.y,1.6,0,Math.PI*2);ctx.fill();}line(0,.5,1,.5);}
 ctx.restore();
};
BK.EXTRA_FLOOR_BY_T={};for(const f of BK.EXTRA_FLOORS)if(!f.deep)BK.EXTRA_FLOOR_BY_T[f.terrain]=f;
BK.EXTRA_FLOOR_CHARS=BK.EXTRA_FLOORS.map(f=>f.ch).join('');
BK.DEEP_WATER_CH=BK.EXTRA_FLOORS.find(f=>f.deep).ch;
// petit hasard stable par case
const rnd=(c,r,k)=>{const x=Math.sin(c*127.1+r*311.7+k*74.7)*43758.5453;return x-Math.floor(x);};
BK.drawExtraFloor=function(ctx,p,c,r,t,time){
 const f=BK.EXTRA_FLOOR_BY_T[t];if(!f)return;const D=BK.draw3d,at=(u,v)=>D.onQuad(p,u,v);
 const line=(u0,v0,u1,v1,col,w=1)=>{const a=at(u0,v0),b=at(u1,v1);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 const quad=(u0,v0,u1,v1,col)=>D.quad(ctx,[at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)],col);
 const poly=(pts,col)=>D.quad(ctx,pts.map(([u,v])=>at(u,v)),col);
 const k=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);   // largeur de la case à l’écran
 const blob=(u,v,ru,rv,col)=>{const q=at(u,v);ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(q.x,q.y,Math.max(.6,ru*k),Math.max(.4,rv*k*.62),0,0,Math.PI*2);ctx.fill();};
 ctx.save();ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<4;i++)ctx.lineTo(p[i].x,p[i].y);ctx.closePath();ctx.clip();   // le motif reste dans sa case
 switch(f.id){
  case 'honey':for(let i=0;i<3;i++)blob(.2+rnd(c,r,i)*.6,.2+rnd(c,r,i+5)*.6,.12,.08,'rgba(255,224,120,.55)');blob(.32,.3,.07,.03,'rgba(255,250,215,.8)');
   {const g=(time*.4+c*.3+r*.2)%1;blob(.5,.15+g*.7,.03,.05,'rgba(196,124,10,.35)');}break;
  case 'parquetry':for(let a=0;a<2;a++)for(let b=0;b<2;b++){const u0=a/2,v0=b/2,turn=(a+b+c+r)%2;for(let n=1;n<3;n++)turn?line(u0+n/6,v0,u0+n/6,v0+.5,'rgba(70,38,12,.45)'):line(u0,v0+n/6,u0+.5,v0+n/6,'rgba(70,38,12,.45)');}
   line(.5,0,.5,1,'rgba(60,30,8,.6)',1.4);line(0,.5,1,.5,'rgba(60,30,8,.6)',1.4);quad(.02,.02,.48,.48,'rgba(255,230,190,.08)');quad(.52,.52,.98,.98,'rgba(255,230,190,.08)');break;
  case 'herringbone':for(let n=-2;n<6;n++){const v=n*.25+(c%2)*.125;line(0,v,.5,v+.25,'rgba(70,38,12,.5)');line(.5,v+.25,1,v,'rgba(70,38,12,.5)');}line(.5,0,.5,1,'rgba(70,38,12,.35)');break;
  case 'pebbles':for(let i=0;i<9;i++){const g=150+Math.floor(rnd(c,r,i)*60);blob(.1+rnd(c,r,i+1)*.8,.1+rnd(c,r,i+2)*.8,.06+rnd(c,r,i+3)*.05,.05+rnd(c,r,i+4)*.03,'rgb('+g+','+(g-6)+','+(g-16)+')');}break;
  case 'mulch':for(let i=0;i<16;i++){const u=rnd(c,r,i)*.9+.05,v=rnd(c,r,i+20)*.9+.05,a=rnd(c,r,i+40)*.16-.08;line(u,v,u+.1,v+a,i%3?'#a8774a':'#4e3220',2);}break;
  case 'leaves':for(let i=0;i<12;i++){const col=['#d9772a','#c4482a','#e8b53a','#b5622a'][i%4];blob(.08+rnd(c,r,i)*.84,.08+rnd(c,r,i+9)*.84,.07,.035,col);}break;
  case 'mud':blob(.35,.4,.2,.12,'#47311f');blob(.68,.66,.14,.09,'#4a3420');blob(.3,.36,.07,.025,'rgba(200,170,130,.35)');break;
  case 'flowergrass':for(let i=0;i<7;i++){const col=['#ffffff','#ff9ccb','#ffe14d','#c9a2ff'][i%4],u=.1+rnd(c,r,i)*.8,v=.1+rnd(c,r,i+7)*.8;blob(u,v,.035,.035,col);blob(u,v,.012,.012,'#f2b31b');}break;
  case 'moss':for(let i=0;i<6;i++)blob(.15+rnd(c,r,i)*.7,.15+rnd(c,r,i+3)*.7,.12,.08,i%2?'#4fa547':'#327b2f');break;
  case 'whitesand':for(let i=0;i<10;i++)blob(rnd(c,r,i),rnd(c,r,i+10),.012,.012,i%2?'#d9cdb0':'#fffaf0');line(.1,.7,.6,.62,'rgba(210,195,160,.5)');break;
  case 'asphalt':for(let i=0;i<14;i++)blob(rnd(c,r,i),rnd(c,r,i+14),.01,.01,i%2?'#55585f':'#1f2024');break;
  case 'marble':line(.1,0,.35,.4,'rgba(140,140,150,.45)');line(.35,.4,.3,.75,'rgba(140,140,150,.35)');line(.35,.4,.7,.55,'rgba(160,160,170,.3)');line(.7,.55,1,.5,'rgba(160,160,170,.3)');
   line(0,0,1,0,'rgba(170,170,180,.6)');line(0,0,0,1,'rgba(170,170,180,.6)');quad(.05,.05,.4,.25,'rgba(255,255,255,.35)');break;
  case 'concrete':for(let i=0;i<4;i++)blob(.2+rnd(c,r,i)*.6,.2+rnd(c,r,i+4)*.6,.18,.12,'rgba(150,154,160,.25)');quad(.1,.1,.55,.3,'rgba(255,255,255,.12)');break;
  case 'cementtile':line(0,0,1,0,'#c9bba2');line(0,0,0,1,'#c9bba2');poly([[.5,.18],[.82,.5],[.5,.82],[.18,.5]],'#3f74a8');poly([[.5,.32],[.68,.5],[.5,.68],[.32,.5]],'#e0754f');
   for(const [u,v]of [[0,0],[1,0],[1,1],[0,1]])poly([[u,v],[u+(u?-.18:.18),v],[u,v+(v?-.18:.18)]],'#3f74a8');break;
  case 'thickcarpet':for(let i=0;i<20;i++)blob(rnd(c,r,i),rnd(c,r,i+20),.02,.02,i%2?'rgba(255,220,200,.18)':'rgba(70,40,30,.18)');break;
  case 'glass':line(0,0,1,0,'rgba(255,255,255,.8)',1.5);line(0,0,0,1,'rgba(255,255,255,.8)',1.5);line(.2,.15,.45,.15+.0,'rgba(255,255,255,.0)');
   line(.15,.55,.55,.15,'rgba(255,255,255,.55)',2);line(.35,.75,.75,.35,'rgba(255,255,255,.35)',1.5);break;
  case 'grating':quad(0,0,1,1,'#2b2f35');for(let n=1;n<6;n++){line(n/6,0,n/6,1,'#8d939b',2);line(0,n/6,1,n/6,'#7c828a',1.5);}break;
  case 'tatami':quad(0,0,1,.09,'#3f6b3a');quad(0,.91,1,1,'#3f6b3a');for(let n=1;n<14;n++)line(n/14,.09,n/14,.91,'rgba(120,105,50,.35)');break;
  case 'crystal':poly([[0,0],[.5,.4],[0,1]],'#b3a6f0');poly([[1,0],[.5,.4],[1,1]],'#8576d2');poly([[0,1],[.5,.4],[1,1]],'#a99cec');
   {const s=(Math.sin(time*2.5+c*1.7+r)+1)/2;blob(.5,.4,.05+.04*s,.05+.04*s,'rgba(255,255,255,'+(.4+.5*s)+')');}break;
  case 'cosmic':blob(.6,.4,.3,.2,'rgba(120,70,190,.25)');for(let i=0;i<9;i++){const tw=(Math.sin(time*3+i*1.9+c*2.3+r*1.1)+1)/2;blob(rnd(c,r,i),rnd(c,r,i+9),.012+.012*tw,.012+.012*tw,'rgba(255,255,255,'+(.35+.65*tw)+')');}break;
  case 'vent':quad(.18,.18,.82,.82,'#3a3d42');for(let n=0;n<5;n++)quad(.22,.24+n*.115,.78,.3+n*.115,'#15171a');line(.18,.18,.82,.18,'#c1c5cb');line(.18,.18,.18,.82,'#c1c5cb');break;
 }
 ctx.restore();
};
})(window.BK);
