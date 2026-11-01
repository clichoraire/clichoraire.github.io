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
 F('Ã',42,'vent','Grille d’aération','🕳️','fantaisie',['#8d9299','#878c93']),
 // Tuiles à mécanique (règles dans floors-mechanics.js)
 F('Â',43,'volcanic','Roche volcanique','🌋','nature',['#3d3638','#373032'],{hint:'Résiste à la chaleur : une bombe posée dessus explose une case moins loin.'}),
 F('Ê',44,'coral','Récif de corail','🪸','nature',['#f08a7e','#e87e73'],{slow:.85,hint:'Tranchant : on avance 15 % moins vite. Une bombe qui explose dessus le casse et il devient de l’eau profonde.'}),
 F('Î',45,'vines','Liane rampante','🌿','nature',['#557f38','#4e7733'],{hint:'Une chance sur quatre de rester pris 1 seconde dans les lianes en entrant sur la case.'}),
 F('Ô',46,'tallgrass','Herbe haute','🌾','nature',['#5c9e3c','#56953a'],{hint:'Cache les héros, les petites bombes et les objets. Quand un héros y passe, ce qui s’y cachait se voit.'}),
 F('Û',47,'slate','Ardoise sombre','🌑','nature',['#434b57','#3d4550'],{hint:'Un peu glissant : quand on s’arrête, on glisse encore une demi-case.'}),
 F('Ä',48,'bronze','Sol en bronze','🥉','interieur',['#b77c3c','#ae7536'],{hint:'Le souffle des bombes y ricoche à angle droit, des deux côtés, au lieu de continuer tout droit.'}),
 F('Ë',49,'redbrick','Briques rouges','🧱','interieur',['#b4553c','#aa4e36'],{hint:'Bonne adhérence : les explosions et les chocs ne font pas reculer.'}),
 F('Ï',50,'linoleum','Linoléum jaune','🟨','interieur',['#ecd34e','#e4ca45'],{hint:'Ça grince ! Chaque pas s’entend partout, et la nuit le héros s’allume un instant.'}),
 F('Ö',51,'emerald','Dalles d’émeraude','💚','interieur',['#2fa36b','#2a9963'],{hint:'Zone sacrée : une bombe posée ici glisse toute seule sur une case voisine.'}),
 F('Ü',52,'logs','Rondins de bois','🪵','interieur',['#8f5d33','#86572f'],{hint:'Inflammable : touché par une explosion, il brûle 3 secondes (1 point de vie par seconde).'}),
 F('à',53,'steel','Plaque d’acier larmée','🔩','industriel',['#949ba3','#8c939b'],{hint:'Une bombe qui explose sur une plaque envoie le souffle sur toutes les plaques collées.'}),
 F('è',54,'toxic','Sol contaminé','☢️','industriel',['#86c22e','#7db82b'],{hint:'Rester dessus plus d’une demi-seconde empoisonne : 1 point de vie toutes les 2 secondes pendant 6 secondes.'}),
 F('ì',55,'speedmark','Marquage au sol','⏩','industriel',['#3a3d44','#363940'],{hint:'Passer dessus donne 30 % de vitesse en plus pendant 2 secondes.'}),
 F('ò',56,'mirror','Dalles de miroir','🪞','industriel',['#cdd9e5','#c3d0dd'],{hint:'Reflète les héros et les bombes un peu à côté : de faux reflets pour tromper l’œil.'}),
 F('ù',57,'conveyor','Tapis roulant','🛤️','industriel',['#2f3238','#2b2e34'],{hint:'Emporte les héros, les objets et les bombes dans le sens des flèches, 1 case par seconde.'}),
 F('á',58,'mycelium','Mycélium luminescent','🍄','fantaisie',['#3b2c52','#35284a'],{hint:'Éclaire la nuit. Une explosion le détruit et lâche un nuage de spores qui cache la vue 4 secondes.'}),
 F('é',59,'candy','Sol en bonbon','🍬','fantaisie',['#f7add2','#f2a1c9'],{hint:'Colle les bombes : une bombe poussée ou lancée s’arrête net sur la case.'}),
 F('í',60,'electric','Sol électrifié','⚡','fantaisie',['#2b3550','#27304a'],{hint:'Allumé 3 secondes, éteint 3 secondes. Allumé, il enlève 3 points de vie et paralyse une demi-seconde.'}),
 F('ó',61,'magictile','Carrelage magique','✨','fantaisie',['#6d4ec8','#6448bb'],{hint:'Marcher dessus téléporte vers un autre carrelage magique, pris au hasard.'}),
 F('ú',62,'quicksand','Sables mouvants','⏳','fantaisie',['#d9b66c','#d2ae64'],{hint:'Attire vers le centre. Immobile plus de 2 secondes, on s’enfonce : −10 points de vie et retour au dernier endroit sûr.'})
];
BK.FLOOR_ID_CH=Object.fromEntries(BK.EXTRA_FLOORS.map(f=>[f.id,f.ch]));
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
BK.drawExtraFloor=function(ctx,p,c,r,t,time,W){
 const f=BK.EXTRA_FLOOR_BY_T[t];if(f)BK.drawFloorPattern(ctx,p,c,r,f.id,time,W);
};
// Tuiles « par-dessus » : posées sur la tuile déjà en place (gazon, eau, pierre…) sans la remplacer.
BK.FLOOR_OVERLAYS=['leaves','vent','tallgrass','toxic'];
// Sol électrifié : éteint 3 s, allumé 3 s (même horloge pour le dessin et les règles).
BK.ELECTRIC_PERIOD=3;
BK.electricOn=t=>Math.floor(t/BK.ELECTRIC_PERIOD)%2===1;
BK.drawFloorPattern=function(ctx,p,c,r,id,time,W){
 const f={id},D=BK.draw3d,at=(u,v)=>D.onQuad(p,u,v),T=W?.time??time;   // T : horloge du monde (sol électrifié, tapis roulant…)
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
  case 'leaves':for(let i=0;i<12;i++){const col=['#d9772a','#c4482a','#e8b53a','#b5622a'][i%4],drift=p.wet?Math.sin(time*.8+i+c)*.03:0;blob(.08+rnd(c,r,i)*.84+drift,.08+rnd(c,r,i+9)*.84,.07,.035,col);const q=at(.08+rnd(c,r,i)*.84+drift,.08+rnd(c,r,i+9)*.84);ctx.strokeStyle='rgba(90,45,15,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q.x-k*.05,q.y);ctx.lineTo(q.x+k*.05,q.y);ctx.stroke();}break;
  case 'mud':blob(.35,.4,.2,.12,'#47311f');blob(.68,.66,.14,.09,'#4a3420');blob(.3,.36,.07,.025,'rgba(200,170,130,.35)');break;
  case 'flowergrass':for(let i=0;i<7;i++){const col=['#ffffff','#ff9ccb','#ffe14d','#c9a2ff'][i%4],u=.1+rnd(c,r,i)*.8,v=.1+rnd(c,r,i+7)*.8;blob(u,v,.035,.035,col);blob(u,v,.012,.012,'#f2b31b');}break;
  case 'moss':for(let i=0;i<6;i++)blob(.15+rnd(c,r,i)*.7,.15+rnd(c,r,i+3)*.7,.12,.08,i%2?'#4fa547':'#327b2f');break;
  case 'whitesand':for(let i=0;i<10;i++)blob(rnd(c,r,i),rnd(c,r,i+10),.012,.012,i%2?'#d9cdb0':'#fffaf0');line(.1,.7,.6,.62,'rgba(210,195,160,.5)');break;
  case 'asphalt':for(let i=0;i<14;i++)blob(rnd(c,r,i),rnd(c,r,i+14),.01,.01,i%2?'#55585f':'#1f2024');break;
  case 'marble':{// chaque dalle a ses propres veines : nombre, trajet, branches, teinte grise ou dorée
   const veins=1+Math.floor(rnd(c,r,1)*3),gold=rnd(c,r,2)<.18;
   for(let v=0;v<veins;v++){let u=rnd(c,r,10+v),w=0,du=(rnd(c,r,20+v)-.5)*.5,a=.22+rnd(c,r,30+v)*.3;const col=gold?'rgba(196,160,80,'+a+')':'rgba(120,122,138,'+a+')';
    if(rnd(c,r,40+v)<.5){w=u;u=0;}
    for(let s=0;s<5;s++){const u1=w?u+.22:u+du*.4+(rnd(c,r,50+v*7+s)-.5)*.18,w1=w?w+du*.4+(rnd(c,r,50+v*7+s)-.5)*.18:Math.min(1,(s+1)*.22);if(w)line(u,w,u1,w1,col,1+rnd(c,r,60+v)*.8);else line(u,s*.22,u1,w1,col,1+rnd(c,r,60+v)*.8);
     if(rnd(c,r,70+v*7+s)<.3){const bu=w?u1:u1,bv=w?w1:w1;line(bu,bv,bu+(rnd(c,r,80+s)-.5)*.3,bv+.12,col.replace(/[\d.]+\)$/,(a*.6).toFixed(2)+')'),.8);}
     if(w){u=u1;w=w1;}else u=u1;}}
   line(0,0,1,0,'rgba(170,170,180,.6)');line(0,0,0,1,'rgba(170,170,180,.6)');quad(.05+rnd(c,r,3)*.3,.05+rnd(c,r,4)*.3,.4+rnd(c,r,3)*.3,.25+rnd(c,r,4)*.3,'rgba(255,255,255,.28)');break;}
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
  case 'cosmic':{const neb=['rgba(120,70,190,.28)','rgba(60,110,220,.25)','rgba(220,80,170,.22)','rgba(60,190,190,.18)'];for(let n=0;n<1+Math.floor(rnd(c,r,1)*3);n++)blob(.15+rnd(c,r,2+n)*.7,.15+rnd(c,r,5+n)*.7,.15+rnd(c,r,8+n)*.2,.1+rnd(c,r,11+n)*.12,neb[Math.floor(rnd(c,r,14+n)*4)]);
   const kind=rnd(c,r,17);if(kind<.12){const pu=.25+rnd(c,r,18)*.5,pv=.25+rnd(c,r,19)*.5;blob(pu,pv,.09,.09,['#e9a15a','#7fb6ff','#c48bff'][Math.floor(rnd(c,r,20)*3)]);ctx.strokeStyle='rgba(255,235,190,.6)';ctx.lineWidth=1.2;const q=at(pu,pv);ctx.beginPath();ctx.ellipse(q.x,q.y,k*.16,k*.04,-.3,0,Math.PI*2);ctx.stroke();}
   else if(kind<.22){const s=(time*.5+rnd(c,r,21)*5)%3;if(s<.6){const u=s/.6;line(.1+u*.6,.2+u*.4,.2+u*.6,.25+u*.4,'rgba(255,255,255,'+(1-u)+')',1.5);}}
   else if(kind<.3)blob(.3+rnd(c,r,22)*.4,.3+rnd(c,r,23)*.4,.025,.025,'rgba(255,240,170,.9)');}
   for(let i=0;i<6+Math.floor(rnd(c,r,24)*8);i++){const tw=(Math.sin(time*3+i*1.9+c*2.3+r*1.1)+1)/2;blob(rnd(c,r,i),rnd(c,r,i+9),.012+.012*tw,.012+.012*tw,'rgba(255,255,255,'+(.35+.65*tw)+')');}break;
  case 'vent':quad(.18,.18,.82,.82,'#3a3d42');for(let n=0;n<5;n++)quad(.22,.24+n*.115,.78,.3+n*.115,'#15171a');line(.18,.18,.82,.18,'#c1c5cb');line(.18,.18,.18,.82,'#c1c5cb');break;
  case 'volcanic':for(let i=0;i<7;i++)blob(.1+rnd(c,r,i)*.8,.1+rnd(c,r,i+7)*.8,.025+rnd(c,r,i+14)*.03,.02,'#272123');
   for(let n=0;n<2;n++){let u=rnd(c,r,30+n),v=0;const glow='rgba(255,'+(90+Math.floor(30*Math.sin(T*2+c+n)))+',30,.6)';for(let s=0;s<4;s++){const u1=Math.max(0,Math.min(1,u+(rnd(c,r,40+n*5+s)-.5)*.4)),v1=v+.25;line(u,v,u1,v1,glow,1.3);u=u1;v=v1;}}break;
  case 'coral':for(let i=0;i<4;i++){const u=.15+rnd(c,r,i)*.7,v=.25+rnd(c,r,i+4)*.6,col=['#ff6f61','#ff9f6b','#d9497a','#ffb6a8'][i];
    line(u,v,u-.08,v-.16,col,2.4);line(u,v,u+.07,v-.18,col,2.4);line(u-.08,v-.16,u-.13,v-.26,col,1.6);line(u+.07,v-.18,u+.12,v-.27,col,1.6);blob(u,v,.03,.03,col);}
   for(let i=0;i<6;i++)blob(rnd(c,r,i+20),rnd(c,r,i+30),.01,.01,'rgba(255,255,255,.85)');break;
  case 'vines':for(let n=0;n<3;n++){const v0=.18+n*.32+rnd(c,r,n)*.08;let pu=0,pv=v0;for(let s=1;s<=6;s++){const u=s/6,v=v0+Math.sin(s*1.7+c+n)*.08;line(pu,pv,u,v,'#2d5a1d',2.2);if(s%2)blob(u,v-.04,.045,.025,'#86c64f');pu=u;pv=v;}}
   for(let i=0;i<3;i++){const q=at(.2+rnd(c,r,i+9)*.6,.2+rnd(c,r,i+12)*.6);ctx.strokeStyle='#3d6f27';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(q.x,q.y,k*.06,0,Math.PI*1.6);ctx.stroke();}break;
  case 'tallgrass':for(let i=0;i<14;i++){const u=.06+rnd(c,r,i)*.88,v=.08+rnd(c,r,i+14)*.86;line(u,v,u+(rnd(c,r,i+28)-.5)*.08,v-.07,i%3?'#3f7f28':'#79b84a',1.6);}break;
  case 'slate':for(let n=1;n<3;n++)line(0,n/3,1,n/3,'rgba(20,24,30,.7)',1.2);for(let n=0;n<3;n++){const o=n%2?.25:.5;line(o,n/3,o,(n+1)/3,'rgba(20,24,30,.6)');if(o<.5)line(o+.5,n/3,o+.5,(n+1)/3,'rgba(20,24,30,.6)');}
   quad(.05,.05,.6,.22,'rgba(200,215,235,.12)');poly([[.55,.4],[.95,.4],[.75,.6]],'rgba(255,255,255,.06)');break;
  case 'bronze':quad(.04,.04,.96,.96,'rgba(120,70,25,.35)');quad(.1,.1,.9,.9,'rgba(214,150,80,.55)');
   for(const [u,v]of [[.14,.14],[.86,.14],[.86,.86],[.14,.86]]){blob(u,v,.035,.035,'#6f4318');blob(u-.008,v-.008,.015,.015,'#f3c98a');}
   {const s=(T*.35+c*.13+r*.07)%1.6;if(s<1)poly([[s-.15,0],[s,0],[s-.25,1],[s-.4,1]].map(([u,v])=>[Math.max(0,Math.min(1,u)),v]),'rgba(255,236,190,.28)');}break;
  case 'redbrick':for(let n=0;n<4;n++){line(0,n/4,1,n/4,'#e3cdb8',1.4);const o=(n+r)%2?.25:0;for(let u=o+.5;u<1;u+=.5)line(u,n/4,u,(n+1)/4,'#e3cdb8',1.4);if(o)line(o,n/4,o,(n+1)/4,'#e3cdb8',1.4);}
   for(let i=0;i<5;i++)blob(rnd(c,r,i),rnd(c,r,i+5),.02,.012,'rgba(90,25,15,.35)');break;
  case 'linoleum':line(.5,0,.5,1,'rgba(160,125,20,.35)');line(0,.5,1,.5,'rgba(160,125,20,.35)');for(let i=0;i<14;i++)blob(rnd(c,r,i),rnd(c,r,i+14),.012,.008,i%2?'#c7a52b':'#fff6b0');quad(.08,.08,.42,.2,'rgba(255,255,255,.18)');break;
  case 'emerald':poly([[.5,.08],[.92,.5],[.5,.92],[.08,.5]],'#46c98b');poly([[.5,.26],[.74,.5],[.5,.74],[.26,.5]],'#8df2c1');poly([[.5,.08],[.92,.5],[.5,.5]],'rgba(255,255,255,.14)');
   line(.5,.08,.92,.5,'#1c7a4c',1.2);line(.92,.5,.5,.92,'#1c7a4c',1.2);line(.5,.92,.08,.5,'#1c7a4c',1.2);line(.08,.5,.5,.08,'#1c7a4c',1.2);
   {const s=(Math.sin(T*2+c*1.3+r*.9)+1)/2;blob(.42,.36,.02+.025*s,.02+.025*s,'rgba(255,255,255,'+(.3+.6*s)+')');}break;
  case 'logs':for(let n=0;n<3;n++){const v0=n/3+.02,v1=(n+1)/3-.02,vm=(v0+v1)/2;quad(0,v0,1,v1,n%2?'#9a6437':'#a46c3c');line(0,v0+.03,1,v0+.04,'rgba(60,35,15,.5)');line(.2,vm,.7,vm+.01,'rgba(60,35,15,.35)');
    const q=at(.06+(n%2)*.88,vm);ctx.fillStyle='#d2a56c';ctx.beginPath();ctx.ellipse(q.x,q.y,k*.07,k*.1*.62,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8a5a2c';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(q.x,q.y,k*.035,k*.05*.62,0,0,Math.PI*2);ctx.stroke();}break;
  case 'steel':for(let a=0;a<4;a++)for(let b=0;b<4;b++){const u=(a+.5)/4,v=(b+.5)/4,turn=(a+b)%2;turn?line(u-.07,v-.03,u+.07,v+.03,'#c8ced4',2):line(u-.03,v+.07,u+.03,v-.07,'#c8ced4',2);turn?line(u-.06,v-.01,u+.07,v+.05,'#5f666d',1):line(u-.01,v+.07,u+.05,v-.06,'#5f666d',1);}
   line(0,0,1,0,'rgba(60,65,72,.6)');line(0,0,0,1,'rgba(60,65,72,.6)');break;
  case 'toxic':blob(.45,.5,.32,.24,'rgba(130,220,40,.55)');blob(.3,.35,.14,.1,'rgba(170,240,60,.5)');blob(.7,.68,.12,.09,'rgba(110,200,30,.5)');
   for(let i=0;i<3;i++){const g=(T*.7+i*.37+c*.21+r*.13)%1,u=.25+rnd(c,r,i)*.5,v=.3+rnd(c,r,i+3)*.4;blob(u,v,.02+g*.05,.02+g*.05,'rgba(220,255,140,'+(.8*(1-g))+')');}
   {const q=at(.5,.5);ctx.fillStyle='rgba(40,50,10,.55)';for(let n=0;n<3;n++){const a=-Math.PI/2+n*Math.PI*2/3;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.ellipse(q.x,q.y,k*.12,k*.12*.62,0,a-.45,a+.45);ctx.closePath();ctx.fill();}}break;
  case 'speedmark':for(let n=0;n<2;n++){const v=.3+n*.3,pulse=(Math.sin(T*6-n*1.5)+1)/2,col='rgba(255,'+(200+Math.floor(40*pulse))+',60,'+(.6+.4*pulse)+')';line(.2,v+.18,.5,v,col,3);line(.5,v,.8,v+.18,col,3);}
   line(.04,.04,.04,.96,'#e8e8e8',2);line(.96,.04,.96,.96,'#e8e8e8',2);break;
  case 'mirror':line(0,0,1,0,'rgba(255,255,255,.9)',1.5);line(0,0,0,1,'rgba(255,255,255,.9)',1.5);line(1,0,1,1,'rgba(120,140,160,.6)');line(0,1,1,1,'rgba(120,140,160,.6)');
   {const s=(T*.25+c*.17+r*.11)%1.5;line(Math.min(1,s),0,Math.max(0,s-.5),1,'rgba(255,255,255,.75)',3);line(Math.min(1,s+.12),0,Math.max(0,s-.38),1,'rgba(255,255,255,.4)',1.5);}break;
  case 'conveyor':{const dir=W?.props?.[c+','+r]?.beltDir??3,D=BK.DIRS[dir],side=D.dx?[[0,.06,1,.06],[0,.94,1,.94]]:[[.06,0,.06,1],[.94,0,.94,1]];
   for(const s of side)line(...s,'#f2c230',2.5);const sh=((W?W.time:time)*1)%1;
   for(let n=-1;n<3;n++){const o=n/2+sh/2;if(o<-.05||o>1.05)continue;const a=(x,y)=>D.dx?[D.dx>0?x:1-x,y]:[y,D.dy>0?x:1-x];
    const p1=a(o-.14,.28),p2=a(o,.5),p3=a(o-.14,.72);line(p1[0],p1[1],p2[0],p2[1],'#9aa1aa',3);line(p2[0],p2[1],p3[0],p3[1],'#9aa1aa',3);}break;}
  case 'mycelium':for(let i=0;i<5;i++){const u=rnd(c,r,i),v=rnd(c,r,i+5);line(u,v,rnd(c,r,i+10),rnd(c,r,i+15),'rgba(150,230,255,.25)',1);}
   for(let i=0;i<6;i++){const s=(Math.sin(T*1.6+i*1.3+c*.7+r*.5)+1)/2,u=.12+rnd(c,r,i+20)*.76,v=.12+rnd(c,r,i+26)*.76;blob(u,v,.05+.03*s,.04+.02*s,'rgba(90,240,220,'+(.18+.25*s)+')');blob(u,v,.018,.018,'rgba(210,255,250,'+(.55+.45*s)+')');}break;
  case 'candy':for(let n=-2;n<4;n++)poly([[n*.36,0],[n*.36+.18,0],[n*.36+.18+.4,1],[n*.36+.4,1]].map(([u,v])=>[Math.max(0,Math.min(1,u)),v]),'rgba(255,255,255,.55)');
   for(let i=0;i<7;i++){const u=.1+rnd(c,r,i)*.8,v=.1+rnd(c,r,i+7)*.8;line(u,v,u+.05,v+.02,['#ffe14d','#6fd0ff','#7ce38b','#c48bff'][i%4],2.2);}break;
  case 'electric':{const on=W?BK.electricOn(W.time):false,left=W?BK.ELECTRIC_PERIOD-(W.time%BK.ELECTRIC_PERIOD):9,warn=!on&&left<.7&&Math.floor(W.time*16)%2;
   quad(.08,.08,.92,.92,on?'rgba(80,190,255,.28)':'rgba(10,14,26,.35)');for(let n=1;n<4;n++){line(n/4,.08,n/4,.92,on||warn?'#7fd8ff':'#46557a',on?1.6:1);line(.08,n/4,.92,n/4,on||warn?'#7fd8ff':'#46557a',on?1.6:1);}
   if(on)for(let n=0;n<2;n++){let pu=.1,pv=.2+rnd(c,r,n)*.6;for(let s=1;s<=5;s++){const u=.1+s*.16,v=Math.max(.1,Math.min(.9,pv+(Math.random()-.5)*.3));line(pu,pv,u,v,'rgba(230,250,255,.95)',1.6);pu=u;pv=v;}}break;}
  case 'magictile':line(.06,.06,.94,.06,'#e8c25a',1.4);line(.94,.06,.94,.94,'#e8c25a',1.4);line(.94,.94,.06,.94,'#e8c25a',1.4);line(.06,.94,.06,.06,'#e8c25a',1.4);
   {const pts=[];for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5+T*.6,rad=n%2?.13:.3;pts.push([.5+Math.cos(a)*rad,.5+Math.sin(a)*rad]);}poly(pts,'#ffd75e');
    for(let i=0;i<3;i++){const s=(Math.sin(T*3+i*2.1+c+r)+1)/2;blob(.15+rnd(c,r,i)*.7,.15+rnd(c,r,i+3)*.7,.015+.02*s,.015+.02*s,'rgba(255,255,255,'+s+')');}}break;
  case 'quicksand':for(let n=0;n<4;n++){const g=((T*.35+n/4)%1),q=at(.5,.5);ctx.strokeStyle='rgba(140,100,45,'+(.55*(1-g))+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(q.x,q.y,k*(.45-.4*g),k*(.45-.4*g)*.62,T*.5+n,0,Math.PI*1.5);ctx.stroke();}
   blob(.5,.5,.06,.04,'rgba(110,75,30,.6)');break;
 }
 ctx.restore();
};
})(window.BK);
