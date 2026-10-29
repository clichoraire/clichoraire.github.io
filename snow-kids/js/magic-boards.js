// Animated artwork and bounded, deterministic auras shared by shop and racers.
(function(SK){
'use strict';
const TAU=Math.PI*2;
const designs=[
['inferno','Flammes éternelles','#28162f','#ff862f','fire','Des flammes orange et dorées sortent sans arrêt de la planche.'],
['stinky','Prout cosmique','#163d38','#b8ef55','gas','Un petit nuage rigolo fait verdir les concurrents proches pendant 3 secondes. Aucun ralentissement !'],
['glitter','Poussière de diamant','#34346c','#b9f6ff','spark','Des diamants et des éclats brillants scintillent tout autour.'],
['rainbow','Licorne arc-en-ciel','#443165','#ff9de4','rainbow','Une licorne et des rubans arc-en-ciel magiques.'],
['rocket','Fusée lunaire','#142b50','#ff9866','rocket','Décollage immédiat : fusée, hublot et réacteurs lumineux.'],
['kraken','Kraken des bonbons','#254469','#b99bff','bubble','Une pieuvre malicieuse et des bulles violettes.'],
['storm','Orage turbo','#192649','#7de8ff','bolt','Un nuage électrique et des éclairs bleus qui dansent.'],
['candy','Bonbons explosifs','#872c70','#ffbce2','candy','Sucettes tournoyantes et pluie de confettis sucrés.'],
['ghost','Fantôme farceur','#253448','#a0ffd9','ghost','Un petit fantôme souriant et une brume mentholée.'],
['portal','Portail intergalactique','#241743','#c796ff','portal','Des anneaux cosmiques et une spirale de lumière.'],
['shark-party','Requin disco','#12607a','#70f4ef','shark','Un requin avec des lunettes de soleil et des bulles disco.'],
['dragon-ice','Dragon de givre','#173c65','#9af5ff','ice','Un dragon de glace et des cristaux qui tourbillonnent.'],
['pizza','Pizza météorite','#612b39','#ffcb62','pizza','Une pointe de pizza volante avec des miettes étoilées.'],
['jungle','Jungle néon','#163e42','#b1ed68','leaf','Des feuilles fluorescentes et un tigre espiègle.'],
['royal','Couronne des étoiles','#442754','#ffe39a','crown','Une couronne dorée et une pluie d’étoiles de champion.'],
['phoenix','Phénix solaire','#52203d','#ffb548','phoenix','Un phénix aux ailes de feu et des plumes incandescentes.'],
['ufo','OVNI bonbon','#283c62','#94ffb5','ufo','Une soucoupe volante et des bulles extraterrestres.'],
['axolotl','Axolotl magique','#633d70','#ffadc9','axolotl','Un axolotl rose entouré de bulles brillantes.'],
['bee','Abeille turbo','#443325','#ffda55','bee','Une abeille souriante et du pollen doré.'],
['pirate','Trésor pirate','#263a50','#ffc875','pirate','Un coffre rempli de pièces et des éclats d’or.'],
['volcano','Volcan popcorn','#482635','#ff9650','volcano','Un volcan qui projette des étincelles comme du popcorn.'],
['mermaid','Sirène des glaces','#183f63','#7df4dc','mermaid','Une queue de sirène irisée et des perles flottantes.'],
['robot','Robot confetti','#263a61','#8bdfff','robot','Un robot aux yeux lumineux et des confettis électriques.'],
['donut','Donut galactique','#633761','#ffaddd','donut','Un beigne glacé et des petites pépites colorées.'],
['panda','Panda bambou','#224d48','#b9f080','panda','Un panda curieux et des feuilles de bambou.'],
['chameleon','Caméléon disco','#273e68','#b5ff72','chameleon','Un caméléon rigolo et des éclats multicolores.'],
['wizard','Chapeau de sorcier','#302455','#c6acff','wizard','Un chapeau étoilé qui libère des étincelles magiques.'],
['sunmoon','Soleil et lune','#253452','#ffe3a2','sunmoon','Le soleil et la lune dans une danse d’étoiles.'],
['watermelon','Melon splash','#255347','#ff7e9a','watermelon','Une tranche de melon et des gouttelettes pétillantes.'],
['yeti','Yéti givré','#284769','#c6f6ff','yeti','Un petit yéti souriant dans un tourbillon de neige.']
];
SK.MAGIC_BOARDS=designs.map(([id,name,color,accent,effect,desc])=>({id:'motif-magic-'+id,name,color,accent,effect,desc,pattern:'custom-magic-'+id,animated:true,price:350}));
SK.BOARD_MOTIFS.push(...SK.MAGIC_BOARDS);
const byPattern=new Map(SK.MAGIC_BOARDS.map(b=>[b.pattern,b]));
function poly(c,points,col){c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function oval(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function star(c,x,y,r,col){poly(c,Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return[x+Math.cos(a)*r*(i%2?.27:1),y+Math.sin(a)*r*(i%2?.27:1)];}),col);}
function line(c,p,col,w=.025){c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function emblem(c,b,t){
const a=b.accent;c.save();c.translate(0,-.62);
switch(b.effect){
case 'fire': for(let k=0;k<3;k++)poly(c,[[-.22+k*.12,.24],[-.17+k*.12,-.16-k*.08],[-.08+k*.12,-.02],[.05+k*.10,-.31],[.12+k*.08,.24]],k%2?'#ffe288':a);break;
case 'gas': for(let i=0;i<5;i++)oval(c,Math.sin(i*3)*.14,Math.cos(i*2)*.13,.13,.12,a);oval(c,-.08,-.04,.025,.035,'#243444');oval(c,.08,-.04,.025,.035,'#243444');line(c,[[-.08,.08],[0,.13],[.08,.08]],'#243444');break;
case 'spark': poly(c,[[-.25,-.08],[-.13,-.24],[.14,-.24],[.25,-.08],[0,.28]],a);line(c,[[-.25,-.08],[.25,-.08],[0,.28],[-.10,-.08],[0,-.24],[.10,-.08],[0,.28]],'#fff',.012);break;
case 'rainbow': poly(c,[[-.2,.23],[-.17,-.12],[.03,-.26],[.23,-.03],[.13,.10],[-.01,.04],[.08,.23]],'#fff0fb');poly(c,[[-.03,-.23],[.02,-.48],[.09,-.24]],'#ffe98e');oval(c,.07,-.1,.023,.03,'#343058');break;
case 'rocket': poly(c,[[-.13,.16],[-.13,-.15],[0,-.35],[.13,-.15],[.13,.16]],'#f1f7ff');poly(c,[[-.13,0],[-.25,.23],[-.12,.18]],a);poly(c,[[.13,0],[.25,.23],[.12,.18]],a);oval(c,0,-.1,.07,.08,'#55cfee');poly(c,[[-.09,.19],[0,.42],[.09,.19]],a);break;
case 'bubble': for(let i=0;i<6;i++)line(c,[[0,.04],[(i-2.5)*.07,.24],[Math.sin(t*2+i)*.04+(i-2.5)*.085,.32]],a,.05);oval(c,0,-.05,.23,.22,a);for(const x of [-.09,.09]){oval(c,x,-.08,.05,.07,'white');oval(c,x,-.07,.025,.035,'#24304c');}break;
case 'bolt': for(let i=0;i<3;i++)oval(c,(i-1)*.12,-.15,.14,.11,'#d4ecff');poly(c,[[0,-.10],[-.15,.14],[-.02,.12],[-.07,.36],[.17,.03],[.04,.05],[.12,-.10]],a);break;
case 'candy': line(c,[[0,0],[.1,.35]],'#fff',.035);oval(c,0,-.1,.23,.23,'#fff5da');for(let i=0;i<5;i++){c.save();c.translate(0,-.1);c.rotate(t+i*TAU/5);poly(c,[[0,0],[.22,0],[.17,.12]],i%2?a:'#f35a87');c.restore();}break;
case 'ghost': oval(c,0,-.08,.21,.23,a);poly(c,[[-.21,-.08],[-.24,.24],[-.12,.16],[0,.26],[.12,.16],[.24,.24],[.21,-.08]],a);for(const x of [-.07,.07])oval(c,x,-.08,.03,.055,'#244958');oval(c,0,.05,.04,.025,'#244958');break;
case 'portal': for(let i=0;i<6;i++){c.strokeStyle=i%2?'#77f5f1':a;c.lineWidth=.025;c.beginPath();c.ellipse(0,0,.26-i*.035,.34-i*.045,t+i*.3,0,TAU);c.stroke();}break;
case 'shark': poly(c,[[-.23,.25],[-.2,-.1],[0,-.36],[.2,-.1],[.23,.25]],'#93e5ee');poly(c,[[-.14,.08],[.14,.08],[0,.25]],'#e75e85');for(const x of [-.11,.11]){oval(c,x,-.09,.10,.065,'#17233f');line(c,[[x-.05,-.11],[x+.01,-.11]],'#a8f5ff',.013);}break;
case 'ice': poly(c,[[-.22,.25],[-.19,-.13],[-.28,-.31],[-.07,-.22],[.10,-.28],[.24,-.08],[.07,.06],[.16,.24]],a);oval(c,.08,-.14,.025,.03,'#255185');line(c,[[-.22,.18],[.0,.08],[-.10,-.12]],'#fff');break;
case 'pizza': poly(c,[[-.25,-.23],[.25,-.23],[0,.32]],'#ffe195');line(c,[[-.25,-.23],[0,-.27],[.25,-.23]],'#d58a45',.08);for(const [x,y] of [[-.1,-.1],[.1,-.05],[0,.13]])oval(c,x,y,.045,.05,'#f06c55');break;
case 'leaf': oval(c,0,0,.23,.24,'#ffc661');for(const x of [-.2,.2])oval(c,x,-.19,.075,.08,'#ffc661');for(const x of [-.09,.09]){oval(c,x,-.04,.025,.04,'#193843');line(c,[[x*2,-.14],[x,-.12]],'#573c48');}oval(c,0,.08,.045,.035,'#573c48');break;
case 'phoenix': poly(c,[[0,-.28],[-.07,-.04],[-.30,-.24],[-.19,.13],[0,.30],[.19,.13],[.30,-.24],[.07,-.04]],a);poly(c,[[0,-.12],[-.06,.11],[0,.24],[.06,.11]],'#fff5bd');break;
case 'ufo': oval(c,0,-.1,.15,.16,'#b3f5ff');oval(c,0,.04,.28,.10,a);for(const x of [-.17,0,.17])oval(c,x,.06,.03,.025,'#6d58c9');break;
case 'axolotl': for(const side of [-1,1])for(let i=0;i<3;i++)line(c,[[side*.13,0],[side*.3,-.15+i*.13]],'#ff72ae',.04);oval(c,0,0,.2,.2,a);for(const x of [-.08,.08])oval(c,x,-.04,.025,.03,'#4a375b');line(c,[[-.06,.07],[0,.10],[.06,.07]],'#4a375b');break;
case 'bee': for(const x of [-.17,.17])oval(c,x,-.13,.12,.16,'#dcfaff');oval(c,0,.05,.18,.23,a);for(const y of [-.02,.10])line(c,[[-.15,y],[.15,y]],'#37374a',.05);for(const x of [-.07,.07])oval(c,x,-.1,.025,.03,'#37374a');break;
case 'pirate': poly(c,[[-.25,-.06],[.25,-.06],[.22,.23],[-.22,.23]],'#b87642');poly(c,[[-.25,-.09],[-.20,-.26],[.20,-.26],[.25,-.09]],a);line(c,[[0,-.05],[0,.22]],a,.06);for(let i=0;i<4;i++)oval(c,-.16+i*.1,-.07,.045,.035,'#fff0ab');break;
case 'volcano': poly(c,[[-.28,.25],[-.1,-.13],[.1,-.13],[.28,.25]],'#b79288');poly(c,[[-.1,-.13],[0,-.22],[.1,-.13],[.12,.1],[0,.01],[-.12,.13]],a);for(let i=0;i<3;i++)oval(c,(i-1)*.12,-.3+Math.sin(t*3+i)*.03,.04,.06,'#ffeaa0');break;
case 'mermaid': poly(c,[[-.12,-.29],[.13,-.29],[.08,.05],[.27,.12],[.2,.3],[0,.13],[-.2,.3],[-.27,.12],[-.08,.05]],a);for(let i=0;i<4;i++)line(c,[[-.08,-.23+i*.07],[0,-.19+i*.07],[.08,-.23+i*.07]],'#fff4ff',.013);break;
case 'robot': poly(c,[[-.22,-.20],[.22,-.20],[.22,.19],[-.22,.19]],a);line(c,[[0,-.2],[0,-.32]],a);oval(c,0,-.34,.04,.04,'#ffadcf');for(const x of [-.1,.1])oval(c,x,-.04,.05,.06,'#29375b');line(c,[[-.1,.1],[.1,.1]],'#29375b');break;
case 'donut': oval(c,0,0,.26,.28,'#d79c69');oval(c,0,-.02,.23,.23,a);oval(c,0,0,.09,.10,b.color);for(let i=0;i<9;i++){const q=i*TAU/9;line(c,[[Math.cos(q)*.17,Math.sin(q)*.17],[Math.cos(q)*.17+.035,Math.sin(q)*.17+.03]],i%2?'#fff5ac':'#71e8e5',.02);}break;
case 'panda': for(const x of [-.18,.18])oval(c,x,-.19,.09,.09,'#1d293b');oval(c,0,0,.24,.24,'#fff7e6');for(const x of [-.1,.1]){oval(c,x,-.03,.07,.09,'#26364a');oval(c,x,-.04,.02,.025,'white');}oval(c,0,.1,.04,.03,'#26364a');break;
case 'chameleon': oval(c,0,0,.23,.15,a);oval(c,.15,-.13,.09,.09,'#f4ffab');oval(c,.17,-.14,.025,.035,'#25364e');line(c,[[-.2,0],[-.28,.13],[-.18,.24],[-.06,.17],[-.13,.1]],a,.05);break;
case 'wizard': poly(c,[[-.25,.15],[.04,-.35],[.21,.15]],a);oval(c,0,.18,.29,.07,'#8965d1');star(c,.02,-.08,.07,'#fff4ac');break;
case 'sunmoon': oval(c,-.08,-.02,.18,.19,a);for(let i=0;i<8;i++){const q=i*TAU/8;line(c,[[-.08+Math.cos(q)*.21,-.02+Math.sin(q)*.21],[-.08+Math.cos(q)*.27,-.02+Math.sin(q)*.27]],a,.018);}oval(c,.1,.10,.18,.20,'#ebedff');oval(c,.17,.04,.15,.18,b.color);break;
case 'watermelon': poly(c,[[-.28,-.2],[.28,-.2],[0,.3]],'#81e492');poly(c,[[-.23,-.17],[.23,-.17],[0,.24]],a);for(const [x,y] of [[-.1,-.07],[.1,-.07],[0,.1]])oval(c,x,y,.015,.03,'#422e4d');break;
case 'yeti': for(const x of [-.19,.19])oval(c,x,-.05,.09,.13,a);oval(c,0,0,.23,.26,a);oval(c,0,.04,.16,.17,'#73bcd2');for(const x of [-.07,.07])oval(c,x,0,.025,.035,'#203e59');line(c,[[-.06,.1],[0,.13],[.06,.1]],'#203e59');break;
case 'crown': poly(c,[[-.24,-.18],[-.12,-.04],[0,-.3],[.12,-.04],[.24,-.18],[.19,.20],[-.19,.20]],a);for(const x of [-.11,0,.11])oval(c,x,.09,.03,.04,x?'#ff75bb':'#69e2ed');break;
}
c.restore();
}
const oldMotif=SK.drawMotif;
SK.drawMotif=function(c,p,s,t,steer){
const b=byPattern.get(p);if(!b)return oldMotif(c,p,s,t,steer);
c.save();c.scale(s,s);
const g=c.createLinearGradient(-.35,-1.2,.35,1.2);g.addColorStop(0,b.color);g.addColorStop(.5,b.accent+'70');g.addColorStop(1,b.color);c.fillStyle=g;c.fillRect(-.4,-1.3,.8,2.6);
for(let i=0;i<9;i++){const y=-1.3+i*.32;line(c,[[-.34,y],[0,y+.17],[.34,y]],b.accent+'55',.012);}
for(const x of [-.28,.28])line(c,[[x,-1.1],[x*.85,0],[x,1.1]],b.accent,.018);
emblem(c,b,t);
c.save();c.translate(0,1.23);c.scale(.65,.65);emblem(c,b,t);c.restore();
for(let i=0;i<12;i++)star(c,Math.sin(i*8)*.25,Math.cos(i*5)*1.13,.012+.012*(1+Math.sin(t*3+i)),i%2?'#fff':b.accent);
c.restore();
};
SK.drawBoardAura=function(c,b,x,y,w,h,angle,t){
b=byPattern.get(b?.pattern);if(!b)return;
c.save();c.translate(x,y);c.rotate(angle);c.scale(w,h);
const kind=b.effect;
const fiery=['fire','rocket','phoenix','volcano'].includes(kind);
const cloudy=['gas','bubble','ghost','shark','ufo','axolotl','mermaid'].includes(kind);
const count=fiery||kind==='gas'?22:16;
for(let i=0;i<count;i++){
const q=((t*(fiery?.85:.42)+i/count)%1+1)%1,side=i%2?1:-1;
const px=side*(.38+q*(kind==='gas'?1.15:.85)),py=Math.sin(i*9)*.40-q*.16;
c.globalAlpha=(1-q)*(fiery?.95:kind==='gas'?.72:.9);
if(fiery){
const base=side*.30,tip=side*(.5+q*.95),yy=Math.sin(i*9)*.40;
c.fillStyle=i%3?'#ff822b':'#ffb72f';c.beginPath();c.moveTo(base,yy+.10);c.bezierCurveTo(side*.75,yy+.04,tip-side*.22,yy-.08,tip,yy-.20-q*.10);c.quadraticCurveTo(tip+side*.10,yy+.10,base,yy+.10);c.fill();
poly(c,[[base,yy+.08],[side*(.45+q*.65),yy-.10-q*.07],[side*.55,yy+.08]],'#ffe89b');
}else if(cloudy){
const radius=(kind==='gas'?.19:.10)+q*(kind==='gas'?.25:.17);
oval(c,px,py,radius,radius*w/h,b.accent);
if(kind==='gas'){
oval(c,px+side*radius*.45,py-radius*w/h*.40,radius*.72,radius*w/h*.72,'#91d548');
oval(c,px-side*radius*.3,py-radius*w/h*.35,radius*.48,radius*w/h*.48,'#d4f898');
}
}else if(kind==='rainbow'){
c.strokeStyle=['#ff89b9','#ffdf75','#91efc6','#7ac8ff'][i%4];c.lineWidth=.028;c.beginPath();c.moveTo(side*.32,py);c.quadraticCurveTo(px,py+.12,px,py-.08);c.stroke();
}else if(kind==='bolt'){
line(c,[[side*.34,py],[px,py-.025],[px-.1*side,py+.035],[px+side*.12,py+.06]],b.accent,.035);
}else{
c.save();c.translate(px,py);c.scale(1,w/h);c.rotate(t+i);
if(['leaf','panda','chameleon'].includes(kind)){oval(c,0,0,.14,.055,b.accent);line(c,[[-.13,0],[.13,0]],'#f0ffb5',.012);}
else if(['candy','robot','donut','watermelon'].includes(kind)){poly(c,[[-.06,-.09],[.06,-.09],[.06,.09],[-.06,.09]],['#ffadc9','#86ffe4','#ffe79b'][i%3]);}
else star(c,0,0,.10+q*.10,i%3?b.accent:'#fff');
c.restore();
}
}
c.restore();
};
const drawItem=SK.Shop.drawItem;
SK.Shop.drawItem=function(c,it,x,y,s,t,standing){drawItem(c,it,x,y,s,t,standing);if(it.kind==='board'&&!it.noAura)SK.drawBoardAura(c,it,x,y,s*.78,s*2.4,standing?0:-.6,t||0);};
const drawBoard=SK.drawBoard;
SK.drawBoard=function(c,b,x,y,w,h,angle=0,steer=0){drawBoard(c,b,x,y,w,h,angle,steer);SK.drawBoardAura(c,b,x,y,w,h,angle,performance.now()/1000);};
SK.MagicBoards={
 update(race,dt){
  for(const r of race.racers)r.boardQueasy=Math.max(0,(r.boardQueasy||0)-dt);
  if(race.phase!=='race')return;
  const active=r=>['ride','air'].includes(r.state);
  for(const source of race.racers){
   if(!active(source)||byPattern.get(source.board?.pattern)?.effect!=='gas')continue;
   for(const r of race.racers){
    if(r===source||!active(r)||r.lap!==source.lap)continue;
    if(Math.hypot(r.x-source.x,r.z-source.z)<4&&Math.abs((r.h||0)-(source.h||0))<2)r.boardQueasy=3;
   }
  }
 },
 drawQueasy(c,r,s,t){
  if(!(r.boardQueasy>0))return;
  c.save();c.globalAlpha=Math.min(1,r.boardQueasy);
  // Cartoon reaction: a green, woozy face and a few harmless green drops.
  oval(c,0,-3.2*s,.26*s,.25*s,'#b5e96d');
  for(const side of [-1,1])line(c,[[side*.15*s,-3.23*s],[side*.07*s,-3.19*s]],'#426143',.035*s);
  line(c,[[-.1*s,-3.08*s],[0,-3.12*s],[.1*s,-3.08*s]],'#426143',.025*s);
  for(let i=0;i<3;i++){const q=(t*1.4+i/3)%1;oval(c,(.2+q*.18)*s,(-3+q*.5)*s,.025*s,.045*s,'#a3d95a');}
  c.restore();
 }
};
})(window.SK);
