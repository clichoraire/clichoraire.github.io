// Dessins vectoriels des quatre collections : géométrie commune, silhouettes propres.
(function(BK){
BK.sprites.drawBiomeDeco=function(ctx,kind,k,t=0,mounted=false,props={}){
ctx.save();ctx.scale(k,k);ctx.lineJoin='round';ctx.lineCap='round';
const [g,id]=kind.split('_'),n=Number(id),wood='#895a39',gold='#edc16a',stone='#9594ad',ink='#49445e',green='#58aa75',pink='#e991da',blue='#73dce2';
const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
const oval=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
const line=(p,c,w=.025)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
const poly=(p,c)=>{ctx.fillStyle=c;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
const gem=(x,y,s,c)=>{poly([[x-s,y],[x-s*.5,y-s],[x+s*.5,y-s],[x+s,y],[x,y+s]],c);line([[x-s*.5,y-s],[x,y+s],[x+s*.5,y-s]],'#eaffff',.012);};
const flower=(x,y,c)=>{line([[x,y],[x,y+.2]],green);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;oval(x+Math.cos(a)*.055,y+Math.sin(a)*.055,.045,.035,c);}oval(x,y,.027,.027,gold);};
const pot=(x,y,s,c)=>{oval(x,y-s*.4,s*.4,s*.5,c);rect(x-s*.23,y-s*.9,s*.46,s*.13,gold);oval(x,y-s*.85,s*.2,s*.055,ink);};
const leaf=(x,y,a,s,c=green)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);poly([[0,0],[-s*.15,-s*.55],[0,-s],[s*.15,-s*.55]],c);line([[0,0],[0,-s*.85]],'#b6dc8a',.012);ctx.restore();};
const basket=(x,y,c=gold)=>{poly([[x-.3,y-.25],[x+.3,y-.25],[x+.24,y],[x-.24,y]],c);for(let j=0;j<5;j++)line([[x-.24+j*.12,y-.22],[x-.2+j*.1,y-.02]],wood,.015);line([[x-.27,y-.13],[x+.27,y-.13]],wood,.015);};
const arch=(c)=>{rect(-.42,-.7,.16,.7,c);rect(.26,-.7,.16,.7,c);line([[-.34,-.7],[-.23,-.94],[0,-1.03],[.23,-.94],[.34,-.7]],c,.2);};
const rug=(c)=>{oval(0,-.04,.45,.17,c);oval(0,-.05,.35,.11,gold);oval(0,-.05,.26,.075,c);};
const skull=(x,y,s)=>{oval(x,y,s,s*.8,'#e0d9be');rect(x-s*.6,y,s*1.2,s*.6,'#e0d9be');oval(x-s*.4,y,.028,.04,ink);oval(x+s*.4,y,.028,.04,ink);};
if(!mounted)oval(0,.015,kind==='enchanted_14'?.17:.4,kind==='enchanted_14'?.05:.10,'rgba(25,20,45,.18)');
if(g==='enchanted')switch(n){
case 0:line([[0,0],[0,-.95]],wood,.16);for(const [x,y] of [[-.22,-.7],[.23,-.8],[0,-1.1]])gem(x,y,.23,blue);break;
case 1:{
 const cap=/^#[0-9a-f]{6}$/i.test(props.capColor)?props.capColor:'#cf3030';
 rect(-.24,-.56,.48,.56,'#f4e8d0');rect(-.24,-.56,.09,.56,'#ddd0b4');
 rect(-.085,-.27,.17,.27,wood);oval(0,-.27,.085,.07,wood);oval(.045,-.13,.016,.016,gold);
 oval(.14,-.4,.065,.065,'#8a5a39');oval(.14,-.4,.047,.047,'#ffe7a3');line([[.14,-.447],[.14,-.353]],'#8a5a39',.012);line([[.093,-.4],[.187,-.4]],'#8a5a39',.012);
 ctx.fillStyle=cap;ctx.beginPath();ctx.ellipse(0,-.6,.47,.38,0,Math.PI,Math.PI*2);ctx.lineTo(.47,-.55);ctx.ellipse(0,-.55,.47,.09,0,0,Math.PI);ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.ellipse(-.07,-.66,.34,.27,0,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();oval(-.18,-.82,.12,.06,'rgba(255,255,255,.32)');
 oval(0,-.555,.4,.05,'rgba(60,30,50,.32)');
 for(const [x,y,r] of [[-.24,-.8,.075],[.08,-.89,.06],[.3,-.7,.05],[-.04,-.68,.045],[-.36,-.62,.035]])oval(x,y,r,r*.9,'#fff');
 break;}
case 2:oval(0,-.45,.3,.48,wood);oval(0,-.43,.23,.39,'#a879d4');oval(.12,-.35,.03,.03,gold);for(const x of [-.3,.3])flower(x,-.35,pink);break;
case 3:for(let i=0;i<7;i++)flower((i%3-1)*.22,-.15-Math.floor(i/3)*.13, i%2?blue:pink);break;
case 4:poly([[-.4,0],[-.3,-.45],[0,-.65],[.35,-.4],[.42,0]],stone);line([[-.12,-.38],[0,-.52],[.13,-.38],[0,-.25],[0,-.1]],blue,.04);break;
case 5:for(let i=0;i<8;i++){let a=i*Math.PI/4,x=Math.cos(a)*.35,y=Math.sin(a)*.14-.08;rect(x-.025,y-.12,.05,.12,'#f2dfbd');oval(x,y-.13,.09,.055,pink);}break;
case 6:rug('#b78ce2');oval(0,-.06,.32,.10,blue);flower(.28,-.15,pink);break;
case 7:rect(-.2,-.55,.4,.5,'#86cdd4');rect(-.22,-.61,.44,.09,gold);for(let i=0;i<6;i++)oval(Math.sin(t+i*3)*.14,-.13-i*.06,.022,.022,'#ffffa6');break;
case 8:line([[0,0],[0,-.8]],wood,.07);for(let i=0;i<3;i++){let x=(i-1)*.21,y=-.5-i*.13;line([[0,-.5],[x,y]],wood);oval(x-.07,y,.08,.05,pink);oval(x+.07,y,.08,.05,blue);}break;
case 9:arch(wood);for(let i=0;i<7;i++)leaf(-.34+i*.11,-.7-Math.sin(i*.5)*.24,.6,.23);break;
case 10:for(let i=0;i<4;i++){let x=-.3+i*.2;line([[x,-.95],[x+.05,-.6],[x-.04,-.2]],green,.04);flower(x,-.4-i%2*.2,pink);}break;
case 11:{
 oval(0,-.19,.44,.22,'#32665b');
 for(const [x,y,rx,ry] of [[-.25,-.28,.21,.19],[.23,-.27,.22,.2],[-.12,-.43,.25,.21],[.12,-.43,.21,.2],[0,-.26,.28,.18]])
  oval(x,y,rx,ry,y<-.4?'#4b8b71':'#417d65');
 const stars=[[-.27,-.31,.067],[-.14,-.51,.056],[.06,-.38,.09],[.24,-.46,.055],[.27,-.23,.063],[-.1,-.19,.048]];
 stars.forEach(([x,y,r],i)=>{
  const glow=(1+Math.sin(t*3+i*1.7))/2;
  oval(x,y,r*1.5,r*1.5,'rgba(255,220,132,'+(.10+glow*.12)+')');
  poly(Array.from({length:10},(_,j)=>{
   const a=-Math.PI/2+j*Math.PI/5,rad=r*(j%2?.44:1);
   return [x+Math.cos(a)*rad,y+Math.sin(a)*rad];
  }),i%2?'#ffe19a':'#fff4be');
 });
 break;}
case 12:for(let i=0;i<9;i++)leaf(0,0,(i-4)*.24,.6+Math.sin(i)*.15);break;
case 13:oval(0,-.25,.38,.27,green);for(let i=0;i<9;i++)oval(Math.sin(i*4)*.27,-.12-i*.04,.045,.04,'#8b4cb0');break;
case 14:ctx.save();ctx.scale(.45,.45);oval(0,-.35,.25,.33,gold);oval(-.08,-.42,.06,.12,'rgba(255,255,255,.35)');oval(0,-.59,.29,.12,wood);line([[0,-.67],[.06,-.8]],wood,.06);ctx.restore();break;   // petit gland
case 15:line([[-.35,-.15],[.32,-.2]],wood,.25);oval(.33,-.2,.1,.13,gold);for(let i=0;i<4;i++)flower(-.25+i*.15,-.3,blue);break;
case 16:for(let i=0;i<8;i++){let a=i*Math.PI/4;line([[0,-.5],[Math.cos(a)*.42,-.5+Math.sin(a)*.42]],'#d1e8f5',.012);}for(let r=.12;r<.5;r+=.12){let p=[];for(let i=0;i<=8;i++){let a=i*Math.PI/4;p.push([Math.cos(a)*r,-.5+Math.sin(a)*r]);}line(p,'#d1e8f5',.012);}break;
case 17:rect(-.1,-.75,.2,.75,'#785ca1');oval(0,-.85,.24,.24,gold);oval(.1,-.9,.2,.2,'#785ca1');gem(0,-.35,.09,blue);break;
case 18:for(let i=0;i<5;i++)gem((i-2)*.15,-.15-(2-Math.abs(i-2))*.12,.16,['#e99ad8',blue,'#b595ed',green,gold][i]);break;
case 19:basket(0,0,wood);for(let i=0;i<3;i++)oval((i-1)*.13,-.23,.08,.11,[pink,blue,gold][i]);leaf(.28,-.05,.4,.4);break;
}
if(g==='home')switch(n){
case 0:rect(-.43,-.65,.86,.4,'#a480d6');rect(-.45,-.3,.9,.22,'#7557b4');for(let x of [-.46,.34])rect(x,-.48,.12,.4,pink);for(let x of [-.25,.04])rect(x,-.46,.22,.16,'#d4b8ef');break;
case 1:rect(-.25,-.75,.5,.55,'#54a9ae');rect(-.3,-.3,.6,.23,'#347f92');rect(-.35,-.45,.12,.4,blue);rect(.23,-.45,.12,.4,blue);break;
case 2:rect(-.34,-1,.68,1,wood);rect(-.28,-.93,.25,.8,gold);rect(.03,-.93,.25,.8,gold);oval(-.08,-.5,.025,.025,ink);oval(.08,-.5,.025,.025,ink);break;
case 3:case 4:rect(-.32,n===3?-.65:-.43,.64,n===3?.65:.43,wood);for(let j=0;j<(n===3?3:2);j++){rect(-.27,-.19-j*.2,.54,.16,gold);oval(0,-.11-j*.2,.035,.025,wood);}if(n===4)pot(.1,-.45,.24,pink);break;
case 5:oval(0,-.55,.33,.36,wood);oval(0,-.55,.27,.29,'#fff0c8');line([[0,-.75],[0,-.55],[.15,-.49]],ink);for(let i=0;i<12;i++){let a=i*Math.PI/6;oval(Math.sin(a)*.23,-.55+Math.cos(a)*.25,.015,.015,gold);}break;
case 6:rect(-.36,-.85,.72,.65,gold);rect(-.3,-.79,.6,.53,'#7da7c5');for(let i=0;i<3;i++){oval((i-1)*.17,-.55,.09,.12,'#ebc89c');rect((i-1)*.17-.09,-.43,.18,.15,[pink,green,blue][i]);}break;
case 7:rect(-.35,-.9,.7,.75,blue);for(let x of [-.36,.18]){poly([[x,-.9],[x+.2,-.9],[x+.12,-.4],[x+.22,-.12],[x,-.12]],pink);}line([[-.42,-.94],[.42,-.94]],gold,.06);break;
case 8:rug(pink);break;
case 9:rect(-.44,-.18,.88,.26,'#648ca6');for(let i=0;i<7;i++)line([[-.4+i*.13,-.2],[-.4+i*.13,.12]],gold,.035);break;
case 10:rect(-.35,-.62,.7,.62,'#e8e4d7');rect(-.26,-.4,.52,.32,ink);for(let x of [-.19,.19])oval(x,-.57,.12,.045,ink);for(let x of [-.2,0,.2])oval(x,-.45,.025,.025,gold);break;
case 11:rect(-.35,-.45,.7,.45,wood);oval(0,-.45,.34,.12,'#e4eeee');oval(0,-.46,.24,.07,blue);line([[.15,-.5],[.15,-.72],[0,-.72],[0,-.61]],stone,.05);break;
case 12:oval(0,-.2,.45,.23,'#d6e8ee');oval(0,-.32,.43,.13,'#fff8eb');oval(0,-.33,.35,.08,blue);for(let x of [-.29,.29])rect(x,-.04,.08,.09,gold);break;
case 13:basket(0,0);for(let i=0;i<3;i++)oval((i-1)*.16,-.25,.13,.09,[pink,blue,'#faf3dd'][i]);break;
case 14:line([[0,0],[0,-1]],wood,.07);line([[-.3,-.7],[0,-.52],[.3,-.7]],wood,.06);oval(0,0,.28,.06,wood);poly([[-.25,-.65],[-.06,-.6],[-.08,-.25],[-.32,-.3]],blue);break;
case 15:for(let y of [-.15,-.42]){rect(-.4,y,.8,.07,wood);for(let x of [-.22,.18])oval(x,y-.06,.14,.06,y===-.15?pink:blue);}for(let x of [-.4,.35])rect(x,-.55,.05,.55,gold);break;
case 16:for(let i=0;i<3;i++){ctx.save();ctx.translate((i-1)*.2,-.1-i*.06);ctx.rotate((i-1)*.2);rect(-.17,-.1,.34,.2,[pink,blue,gold][i]);line([[-.13,-.06],[.13,.06]],'#fff2d0',.015);ctx.restore();}break;
case 17:rect(-.36,-.36,.72,.36,blue);line([[-.36,-.36],[.36,-.36]],gold,.07);oval(-.15,-.44,.11,.1,pink);gem(.16,-.43,.1,gold);break;
case 18:line([[-.38,-.03],[-.2,.04],[.2,.04],[.38,-.03]],wood,.06);line([[-.18,0],[-.18,-.3],[.2,-.3],[.2,0]],wood,.05);oval(0,-.38,.27,.13,gold);rect(.15,-.68,.12,.3,gold);oval(.24,-.66,.16,.08,gold);oval(.28,-.69,.016,.016,ink);break;
case 19:rect(-.06,-.4,.12,.4,wood);rect(-.28,-.43,.56,.06,gold);pot(0,-.45,.3,pink);for(let i=0;i<5;i++)leaf(0,-.65,(i-2)*.45,.4);break;
}
if(g==='crypt'){
 const cold='#777788',edge='#a7a3ab',deep='#454451',bronze='#ba9267',bone='#ebdfc3';
 const slab=(x,y,w,depth,h)=>{
  poly([[x,y-h],[x+w,y-h],[x+w,y],[x,y]],cold);
  poly([[x+w,y-h],[x+w+depth,y-h-depth*.48],[x+w+depth,y-depth*.48],[x+w,y]],deep);
  poly([[x,y-h],[x+depth,y-h-depth*.48],[x+w+depth,y-h-depth*.48],[x+w,y-h]],edge);
 };
 const flame=(x,y,hue)=>{
  const h=.10+Math.sin(t*11+x*23)*.02;
  const glow=ctx.createRadialGradient(x,y,0,x,y,.22);
  glow.addColorStop(0,hue);glow.addColorStop(1,'rgba(88,205,190,0)');
  oval(x,y,.22,.22,glow);
  ctx.fillStyle=hue;ctx.beginPath();ctx.moveTo(x-.043,y+.018);
  ctx.quadraticCurveTo(x-.072,y-.027,x+.012,y-h);
  ctx.quadraticCurveTo(x+.081,y-.031,x+.037,y+.022);ctx.fill();
  oval(x,y+.004,.015,.035,'#fff1cd');
 };
 const candle=(x,y,h,c)=>{
  rect(x-.031,y-h,.062,h,'#dbcab0');rect(x-.028,y-h+.01,.016,h*.69,'#f4e4c8');flame(x,y-h-.033,c);
 };
 const skullStone=(x,y,s)=>{
  oval(x,y,s,s*.78,'#b3a890');oval(x-.012,y-.018,s*.88,s*.70,bone);
  rect(x-s*.48,y+s*.32,s*.9,s*.48,'#d4c7ae');
  for(const side of [-1,1])oval(x+side*s*.34,y+.007,s*.235,s*.26,'#514d4b');
  poly([[x,y+s*.15],[x-s*.12,y+s*.40],[x+s*.12,y+s*.40]],'#746657');
  for(let i=-1;i<=1;i++)line([[x+i*s*.25,y+s*.54],[x+i*s*.25,y+s*.75]],'#ac9d88',.010);
 };
 const rune=(x,y,s,c)=>line([[x-s,y],[x,y-s],[x+s,y],[x,y+s],[x-s,y],[x+s,y]],c,.017);
 const frame=(w,h,back)=>{
  slab(-w*.58,0,w*1.16,.075,.09);
  ctx.fillStyle=deep;ctx.beginPath();ctx.moveTo(-w/2,-.08);ctx.lineTo(-w/2,-h*.65);
  ctx.quadraticCurveTo(-w*.43,-h*.90,0,-h);ctx.quadraticCurveTo(w*.43,-h*.90,w/2,-h*.65);
  ctx.lineTo(w/2,-.08);ctx.closePath();ctx.fill();
  ctx.fillStyle=back;ctx.beginPath();ctx.moveTo(-w*.38,-.125);ctx.lineTo(-w*.38,-h*.63);
  ctx.quadraticCurveTo(-w*.35,-h*.83,0,-h*.91);ctx.quadraticCurveTo(w*.35,-h*.83,w*.38,-h*.63);
  ctx.lineTo(w*.38,-.125);ctx.closePath();ctx.fill();
  for(const side of [-1,1])line([[side*w*.46,-.13],[side*w*.46,-h*.62],[side*w*.31,-h*.84],[0,-h*.96]],edge,.028);
 };
 const chain=(p)=>{
  for(let i=0;i<p.length;i++){const [x,y]=p[i];ctx.strokeStyle=i%2?'#6c6871':'#b7a9a3';ctx.lineWidth=.014;
   ctx.beginPath();ctx.ellipse(x,y,.042,.024,i%2?.6:-.6,0,Math.PI*2);ctx.stroke();}
 };
 switch(n){
 case 0:
  slab(-.45,.015,.83,.14,.20);slab(-.40,-.16,.72,.18,.24);
  poly([[-.37,-.39],[-.24,-.58],[.23,-.61],[.46,-.43],[.29,-.34],[-.25,-.32]],'#bbb2ae');
  poly([[-.37,-.39],[-.25,-.32],[.29,-.34],[.46,-.43],[.31,-.30],[-.29,-.28]],'#625d68');
  rune(.02,-.458,.085,'#806d65');
  for(const x of [-.24,.22])oval(x,-.379,.026,.019,bronze);break;
 case 1:
  poly([[-.24,-.05],[-.39,-.60],[-.22,-.88],[.22,-.88],[.38,-.58],[.23,-.05]],'#453841');
  poly([[-.24,-.09],[-.34,-.60],[-.18,-.83],[.17,-.83],[.32,-.58],[.19,-.09]],'#775348');
  line([[-.27,-.60],[-.16,-.78],[.14,-.78],[.25,-.59],[.14,-.15]],'#b48366',.025);
  chain(Array.from({length:10},(_,i)=>[-.28+i*.062,-.61+i*.042]));
  chain(Array.from({length:10},(_,i)=>[-.28+i*.062,-.37-i*.029]));
  rect(-.051,-.484,.10,.12,bronze);oval(0,-.43,.013,.023,deep);break;
 case 2:
  slab(-.44,.07,.82,.13,.15);
  poly([[-.35,-.10],[-.24,-.29],[.32,-.29],[.43,-.14],[.28,-.065]],'#a6a09e');
  for(let i=0;i<3;i++)line([[-.25+i*.032,-.16-i*.041],[.24+i*.027,-.16-i*.041]],'#77717b',.018);
  poly([[.22,-.107],[.32,-.188],[.39,-.162],[.31,-.087]],'#8a8278');break;
 case 3:
  slab(-.28,0,.56,.10,.12);
  poly([[-.22,-.12],[-.19,-.86],[.01,-1.07],[.22,-.87],[.26,-.12]],deep);
  poly([[-.22,-.12],[-.19,-.86],[.01,-1.07],[.15,-.86],[.18,-.12]],cold);
  line([[-.15,-.15],[-.12,-.83],[.01,-.97]],edge,.025);
  for(let i=0;i<3;i++)rune(-.012,-.78+i*.22,.064,['#b5ddd1','#96bdbd','#8badae'][i]);break;
 case 4:
  slab(-.22,0,.41,.07,.16);slab(-.12,-.11,.25,.10,.35);
  poly([[-.39,-.47],[-.30,-.70],[.32,-.69],[.41,-.46],[.08,-.40],[-.07,-.43]],'#524760');
  poly([[-.32,-.51],[-.24,-.665],[-.02,-.63],[.01,-.45]],bone);
  poly([[.01,-.45],[-.02,-.63],[.27,-.66],[.34,-.51]],'#cfc0ab');
  for(let i=0;i<3;i++){line([[-.25,-.61+i*.032],[-.07,-.57+i*.032]],'#8e7e73',.014);line([[.07,-.57+i*.033],[.26,-.61+i*.032]],'#8e7e73',.014);}
  chain(Array.from({length:9},(_,i)=>[-.32+i*.078,-.55+Math.sin(i*.35)*.07]));break;
 case 5:case 10:{
  const urn=n===5;
  slab(-.22,.005,.39,.10,.11);
  oval(0,-.38,urn?.24:.19,.27,urn?'#8a7782':'#746887');
  oval(-.063,-.40,.115,.205,urn?'#a88f8b':'#91809e');
  for(const side of [-1,1])line([[side*.12,-.56],[side*.23,-.51],[side*.22,-.40],[side*.16,-.36]],bronze,.035);
  oval(0,-.57,.16,.057,bronze);oval(0,-.576,.117,.029,deep);
  if(urn){oval(0,-.61,.17,.042,'#bca38d');oval(0,-.66,.066,.049,bronze);rune(0,-.38,.061,'#ddba8f');}
  else for(let i=-1;i<=1;i++)flower(i*.13,-.79+Math.abs(i)*.10,i?'#b9a0ae':'#d9bdba');
  break;
 }
 case 6:
  slab(-.26,0,.48,.09,.085);skullStone(.03,-.23,.19);
  candle(.015,-.39,.24,'#a3e1c8');candle(-.225,-.085,.12,'#8dccb7');break;
 case 7:
  frame(.94,1.21,'#2b2935');
  for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;skullStone(Math.cos(a)*.43,-.73+Math.sin(a)*.35,.071);}
  for(const side of [-1,1])for(let j=0;j<4;j++)line([[side*.34,-.12-j*.147],[side*.48,-.20-j*.147]],bone,.033);
  break;
 case 8:case 9:{
  const h=n===8?1.15:.60;
  slab(-.30,.01,.56,.11,.13);slab(-.22,-.105,.41,.11,h-.22);
  for(let i=0;i<5;i++)line([[-.16+i*.072,-.15],[-.16+i*.072,-h+.11]],i%2?'#545462':'#9995a0',.026);
  if(n===8)slab(-.31,-h+.09,.59,.10,.13);
  else {poly([[-.22,-.49],[-.18,-.65],[-.02,-.57],[.12,-.66],[.30,-.53],[.16,-.46]],edge);slab(.21,.015,.19,.045,.135);}
  line([[-.07,-h+.10],[.025,-h+.25],[-.055,-h+.32],[.08,-.24]],deep,.027);break;
 }
 case 11:
  oval(0,-.09,.44,.23,'#3d3741');
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[0,-.09],[Math.cos(a)*.43,-.09+Math.sin(a)*.23]],'#9c929d',.014);}
  for(let i=1;i<=3;i++){ctx.strokeStyle='#b0a8ad';ctx.lineWidth=.014;ctx.beginPath();ctx.ellipse(0,-.09,.125*i,.065*i,0,0,Math.PI*2);ctx.stroke();}
  for(const [x,y] of [[-.1,-.07],[.14,-.16],[.28,-.02]]){for(let j=0;j<3;j++){line([[x-.02,y],[x-.08,y-.03+j*.032]],'#534550',.016);line([[x+.02,y],[x+.08,y-.03+j*.032]],'#534550',.016);}oval(x,y,.036,.028,'#342a36');oval(x-.008,y-.009,.009,.007,'#b16f69');}
  break;
 case 12:
  oval(0,-.09,.39,.25,'#5b6358');oval(0,-.10,.24,.14,'#343b3b');
  for(let i=0;i<16;i++){const a=i*Math.PI/8;ctx.save();ctx.translate(Math.cos(a)*.30,-.10+Math.sin(a)*.18);ctx.rotate(a);oval(0,0,.067,.033,i%2?'#879579':'#647660');ctx.restore();}
  for(const [x,y] of [[-.23,-.20],[.16,-.245],[.30,-.09],[-.20,.029]]){oval(x,y,.067,.047,'#ad818b');oval(x-.009,y-.011,.031,.022,'#dab1ae');}
  poly([[-.16,.01],[0,.05],[.17,.01],[.10,.15],[0,.095],[-.12,.14]],'#9c6878');break;
 case 13:
  frame(.83,1.05,'#55515e');
  for(let i=0;i<4;i++){const y=-.22-i*.145;line([[-.30,y],[.30,y]],deep,.022);line([[i%2?.095:-.10,y],[i%2?.095:-.10,y+.11]],deep,.017);}
  chain(Array.from({length:9},(_,i)=>[-.29+i*.071,-.62+i*.038]));rune(0,-.43,.10,bronze);break;
 case 14:{
  frame(.77,1.06,'#343a4a');
  const mirror=ctx.createLinearGradient(-.25,-.88,.28,-.18);mirror.addColorStop(0,'#9fa5b7');mirror.addColorStop(.48,'#5d617f');mirror.addColorStop(1,'#32354c');
  oval(0,-.55,.245,.333,mirror);
  line([[-.17,-.78],[.02,-.63],[-.045,-.49],[.15,-.32]],'#c8c5d2',.019);
  line([[-.045,-.49],[-.16,-.45]],'#b8b7c7',.014);rune(0,-.975,.041,bronze);break;
 }
 case 15:{
  slab(-.26,0,.47,.11,.14);slab(-.12,-.12,.23,.07,.19);
  const y=-.58+Math.sin(t*2.3)*.052;
  const aura=ctx.createRadialGradient(0,y,0,0,y,.32);aura.addColorStop(0,'#c7f2dd');aura.addColorStop(.59,'rgba(95,185,179,.7)');aura.addColorStop(1,'rgba(95,185,179,0)');
  oval(0,y,.32,.32,aura);oval(0,y,.159,.15,'#81c4bc');oval(-.047,y-.061,.055,.047,'#d5f1db');
  for(let i=0;i<5;i++)oval(Math.sin(t+i*2)*.25,y+Math.cos(t+i*2)*.16,.014,.014,'#d0ebc8');break;
 }
 case 16:
  chain([[0,-1.04],[0,-.974],[0,-.908]]);
  line([[-.10,-.70],[-.12,-.83],[0,-.9],[.12,-.83],[.10,-.70]],deep,.043);
  poly([[-.21,-.67],[.21,-.67],[.18,-.27],[-.18,-.27]],'#4b4750');
  poly([[-.147,-.60],[.15,-.60],[.12,-.31],[-.12,-.31]],'#6b9490');
  flame(0,-.42,'#a3e4c3');rect(-.021,-.65,.042,.36,'#4d4952');slab(-.23,-.23,.42,.048,.075);
  break;
 case 17:
  slab(-.33,.01,.61,.10,.10);slab(-.25,-.085,.45,.11,.37);slab(-.46,-.41,.85,.12,.105);
  for(const x of [-.16,0,.16])rune(x,-.28,.043,bronze);
  oval(0,-.57,.15,.064,'#a08672');oval(0,-.58,.11,.038,'#554e54');candle(-.29,-.51,.16,'#9adbc3');candle(.29,-.53,.22,'#a3e4c3');
  break;
 case 18:
  for(const x of [-.31,.23]){slab(x,0,.13,.07,.23);line([[x+.028,-.17],[x+.028,-.035]],edge,.019);}
  slab(-.46,-.18,.86,.13,.15);line([[-.35,-.31],[-.17,-.28],[-.08,-.30],[.02,-.28]],'#686670',.018);
  for(const x of [-.38,.31])oval(x,-.286,.044,.022,'#777b67');break;
 case 19:
  oval(0,-.07,.46,.22,deep);oval(0,-.18,.45,.22,edge);oval(0,-.18,.34,.151,'#242633');
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[Math.cos(a)*.34,-.18+Math.sin(a)*.151],[Math.cos(a)*.44,-.18+Math.sin(a)*.215]],cold,.020);}
  for(let i=0;i<4;i++){const u=(t*.37+i*.25)%1;oval(Math.sin(t*1.4+i)*u*.15,-.22-u*.56,.12+u*.15,.047+u*.044,'rgba(159,211,202,'+(.42*(1-u))+')');}
  break;
 }
}
if(g==='desert')switch(n){
case 0:line([[0,0],[.05,-.9]],wood,.13);for(let i=0;i<7;i++)leaf(.05,-.9,(i-3)*.65,.55);for(let i=0;i<4;i++)oval((i-1.5)*.07,-.75,.04,.06,'#b47738');break;
case 1:line([[0,0],[0,-.85]],green,.16);line([[-.28,-.65],[-.28,-.35],[0,-.35],[.25,-.45],[.25,-.7]],green,.12);flower(0,-.88,pink);break;
case 2:for(let i=0;i<9;i++)leaf(0,0,(i-4)*.3,.55, '#65998a');break;
case 3:for(let i=0;i<6;i++){let x=(i-2.5)*.13;line([[0,0],[x,-.3],[x-.05,-.55]],wood,.03);}break;
case 4:poly([[-.48,0],[-.2,-.28],[.05,-.35],[.48,0]],gold);poly([[.05,-.35],[.15,0],[.48,0]],'#cd9854');break;
case 5:arch('#c99a66');line([[-.4,-.4],[-.27,-.4]],wood);line([[.27,-.6],[.42,-.6]],wood);break;
case 6:poly([[-.18,0],[-.14,-.9],[0,-1.13],[.14,-.9],[.18,0]],gold);for(let i=0;i<4;i++)line([[-.07,-.7+i*.15],[.07,-.65+i*.15]],wood);break;
case 7:poly([[-.45,0],[0,-.75],[.45,0]],gold);poly([[0,-.75],[.08,0],[.45,0]],'#bd8850');for(let i=0;i<3;i++)line([[-.1-i*.1,-.55+i*.18],[.1+i*.1,-.55+i*.18]],'#b88c50',.012);break;
case 8:pot(0,0,.7,'#c7774c');for(let d of [-1,1])line([[d*.16,-.55],[d*.33,-.5],[d*.3,-.28],[d*.2,-.25]],gold,.05);break;
case 9:pot(-.18,0,.5,'#ce9163');pot(.2,0,.65,'#70adb4');break;
case 10:poly([[-.45,0],[0,-.8],[.45,0]],'#d87565');poly([[-.22,0],[0,-.56],[.22,0]],ink);line([[0,-.85],[0,-.5]],gold,.04);break;
case 11:for(let i=0;i<3;i++){rect(-.3+i*.23,-.5+i%2*.12,.2,.5-i%2*.12,[pink,blue,gold][i]);oval(-.2+i*.23,-.5+i%2*.12,.1,.045,wood);}break;
case 12:case 13:basket(0,0);for(let i=0;i<9;i++)oval(Math.sin(i*4)*.24,-.25-Math.floor(i/3)*.035,.06,.035,n===12?['#d26b36','#e8b73d','#923b30'][i%3]:'#985934');break;
case 14:rect(-.04,-.8,.08,.8,wood);poly([[-.3,-.75],[.2,-.75],[.35,-.63],[.2,-.51],[-.3,-.51]],gold);line([[-.18,-.62],[.13,-.62]],wood);break;
case 15:oval(0,-.12,.35,.15,'#ccae79');poly([[0,-.12],[0,-.5],[.2,-.12]],gold);for(let i=0;i<8;i++){let a=i*Math.PI/4;oval(Math.cos(a)*.27,-.12+Math.sin(a)*.1,.017,.017,wood);}break;
case 16:oval(0,-.05,.4,.17,'#d2ae7b');line([[-.27,-.07],[.26,-.07]],'#f8e3b5',.04);for(let i=0;i<5;i++)line([[-.2+i*.1,-.15],[-.16+i*.1,-.07],[-.2+i*.1,.03]],'#f8e3b5',.025);break;
case 17:oval(0,-.2,.32,.18,wood);rect(-.3,-.4,.12,.26,gold);rect(.18,-.4,.12,.26,gold);poly([[-.24,-.2],[.24,-.2],[.3,0],[-.3,0]],'#b9545e');break;
case 18:rect(-.35,-.85,.7,.7,gold);rect(-.3,-.8,.6,.6,'#469d9f');gem(0,-.48,.23,'#f4d18d');gem(0,-.48,.12,'#b45b6b');break;
case 19:oval(0,-.1,.43,.21,'#d5b07b');oval(0,-.15,.34,.13,blue);leaf(.32,-.08,.3,.4);leaf(.32,-.08,-.3,.35);break;
}
ctx.restore();
};
})(window.BK);
