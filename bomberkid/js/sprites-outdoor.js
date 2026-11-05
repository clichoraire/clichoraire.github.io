(function(BK){
const original=BK.sprites.drawBiomeDeco;
BK.sprites.drawBiomeDeco=function(ctx,kind,k,t=0,mounted=false,props={}){
if(!kind.startsWith('outdoor_'))return original(ctx,kind,k,t,mounted,props);
const id=kind.slice(8),wood='#966539',dark='#503c2d',stone='#929b91',green='#4d8b45';
ctx.save();ctx.scale(k,k);ctx.lineCap='round';ctx.lineJoin='round';
const oval=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
const line=(p,c=dark,w=.025)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
const poly=(p,c)=>{ctx.fillStyle=c;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
const moss=(x,y)=>{for(let n=0;n<4;n++)oval(x+n*.045,y+Math.sin(n)*.02,.04,.025,green);};
const legs=()=>{for(const x of [-.3,.3])line([[x,-.45],[x,-.03]],dark,.06);};
const rock=(x,y,w,h,top='#a1a9a4',face='#778483',side='#586768')=>{
 const a=[x-w*.54,y-h*.38],b=[x-w*.32,y-h*.83],c=[x+w*.13,y-h],d=[x+w*.49,y-h*.66],e=[x+w*.45,y-h*.16],f=[x+w*.06,y],g=[x-w*.37,y-h*.12],ridge=[x-w*.03,y-h*.53];
 poly([a,b,c,d,ridge],top);poly([a,ridge,f,g],face);poly([ridge,d,e,f],side);
};
const shadeGround=(width=.46)=>oval(0,.015,width,.115,'rgba(30,42,43,.2)');
const graveStone=(x,w,h,style)=>{
 const top=-h,gray=style==='gothic'?'#858491':'#a6aaa0';
 rect(x-w*.58,-.14,w*1.16,.14,'#737973');
 ctx.fillStyle=gray;ctx.beginPath();ctx.moveTo(x-w*.5,-.10);ctx.lineTo(x-w*.5,top+.20);
 if(style==='gothic'){ctx.quadraticCurveTo(x-w*.40,top+.09,x,top);ctx.quadraticCurveTo(x+w*.40,top+.09,x+w*.5,top+.20);}
 else if(style==='broken'){ctx.lineTo(x-w*.44,top);ctx.lineTo(x-w*.10,top+.13);ctx.lineTo(x+w*.05,top+.08);ctx.lineTo(x+w*.5,top+.24);}
 else ctx.quadraticCurveTo(x,top-.14,x+w*.5,top+.20);
 ctx.lineTo(x+w*.5,-.10);ctx.closePath();ctx.fill();
 line([[x-w*.40,-.15],[x-w*.40,top+.22]],'#c6c8bb',.022);
 if(style==='gothic'){line([[x,-.27],[x,top+.22]],'#5e5d6a',.037);line([[x-.095,top+.37],[x+.095,top+.37]],'#5e5d6a',.036);}
 else for(let j=0;j<3;j++)line([[x-w*.23,-.30-j*.075],[x+w*(j===0?.12:.22),-.30-j*.075]],'#737a73',.023);
 if(style==='broken')line([[x-w*.08,top+.16],[x-w*.17,top+.26],[x+w*.04,top+.38]],'#606b65',.021);
 if(style==='mossy'){moss(x-w*.45,-.16);moss(x-.08,top+.16);oval(x+w*.32,-.23,.086,.08,'#6c9050');}
};
const cemetery=()=>{
 const slate='#6c717b',iron='#434956',pale='#b0b0a4',wilt='#627653',gold='#d5aa63';
 const arch=(x,y,w,h,col)=>{
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.lineTo(x-w/2,y-h*.66);
  ctx.quadraticCurveTo(x,y-h*1.35,x+w/2,y-h*.66);ctx.lineTo(x+w/2,y);ctx.closePath();ctx.fill();
 };
 const candle=(x,y,h)=>{
  rect(x-.026,y-h,.052,h,'#e5d7b7');
  oval(x,y-h-.034,.022,.037+Math.sin(t*7+x*12)*.01,'#f4b653');
  oval(x,y-h-.025,.009,.017,'#fff0a5');
 };
 const ironBar=(x,top,bottom)=>{
  line([[x,bottom],[x,top]],iron,.036);
  poly([[x-.036,top+.045],[x,top-.038],[x+.036,top+.045]],'#737480');
 };
 shadeGround();
 switch(id){
  case 'grave_round':graveStone(0,.60,.77,'round');break;
  case 'grave_gothic':graveStone(0,.48,1.06,'gothic');break;
  case 'grave_broken':graveStone(-.05,.53,.63,'broken');rock(.26,.03,.27,.19);break;
  case 'grave_double':graveStone(-.21,.40,.73,'round');graveStone(.21,.40,.86,'round');rect(-.44,-.12,.88,.11,slate);break;
  case 'grave_mossy':graveStone(0,.70,.68,'mossy');moss(-.29,-.02);break;
  case 'grave_iron_cross':
   rock(0,0,.50,.25);line([[0,-.17],[0,-.95]],iron,.079);line([[-.25,-.68],[.25,-.68]],iron,.068);
   for(const [x,y] of [[0,-.95],[-.25,-.68],[.25,-.68]])oval(x,y,.048,.048,slate);oval(0,-.68,.052,.057,gold);break;
  case 'grave_open':case 'grave_mound':{
   const open=id==='grave_open';
   poly([[-.45,-.05],[-.35,-.37],[.35,-.37],[.44,-.06],[.35,.12],[-.38,.13]],'#77604c');
   if(open){poly([[-.31,-.08],[-.24,-.29],[.25,-.29],[.32,-.08],[.22,.055],[-.25,.055]],'#312b30');line([[-.30,-.08],[-.23,.045],[.22,.045]],'#51423c',.032);}
   else {oval(0,-.105,.34,.18,'#8e7558');oval(-.07,-.16,.25,.09,'#a38a69');}
   for(let i=0;i<6;i++)oval(-.33+i*.13,.05+Math.sin(i)*.035,.056,.026,'#9b8061');
   break;
  }
  case 'grave_sarcophagus':
   poly([[-.41,-.12],[-.35,-.38],[.28,-.42],[.44,-.22],[.39,.015],[-.34,.035]],slate);
   poly([[-.43,-.25],[-.30,-.50],[.25,-.54],[.45,-.30],[.33,-.22],[-.36,-.20]],pale);
   line([[-.23,-.35],[.23,-.38]],'#838680',.034);line([[-.03,-.43],[-.02,-.30]],'#838680',.032);break;
  case 'grave_mausoleum':
   rect(-.38,-.77,.76,.77,slate);arch(0,-.06,.37,.65,'#393a43');
   for(const x of [-.35,.24]){rect(x,-.72,.11,.65,pale);rect(x-.025,-.75,.16,.075,'#c2c3b5');}
   poly([[-.46,-.74],[0,-1.08],[.46,-.74]],'#a8a99d');rect(-.45,-.08,.9,.08,pale);break;
  case 'grave_crypt':case 'grave_ossuary':
   arch(0,0,.79,.86,slate);arch(0,-.035,.56,.70,'#363843');
   if(id==='grave_ossuary')for(const x of [-.14,0,.14]){oval(x,-.16,.062,.064,'#e2d6b6');oval(x-.019,-.163,.013,.015,'#5a5554');oval(x+.02,-.163,.013,.015,'#5a5554');}
   for(let i=-2;i<=2;i++)ironBar(i*.098,-.54+Math.abs(i)*.07,-.04);
   line([[-.25,-.28],[.25,-.28]],iron,.046);rect(-.47,-.06,.94,.06,pale);break;
  case 'grave_urn':
   rect(-.22,-.10,.44,.10,slate);oval(0,-.34,.21,.24,'#9b8e7e');oval(-.055,-.40,.11,.13,'#bfb3a1');
   rect(-.11,-.60,.22,.12,'#938677');oval(0,-.61,.14,.04,pale);oval(0,-.65,.057,.042,pale);break;
  case 'grave_candles':
   for(const [x,y,h] of [[-.22,-.07,.22],[-.1,-.11,.32],[.055,-.11,.25],[.19,-.04,.14],[.27,-.1,.20]])candle(x,y,h);
   break;
  case 'grave_wreath':
   oval(0,-.08,.37,.23,'#536046');oval(0,-.09,.23,.115,'#363f38');
   for(let i=0;i<14;i++){const a=i*Math.PI/7;oval(Math.cos(a)*.29,-.09+Math.sin(a)*.165,.062,.043,i%2?wilt:'#81925b');}
   for(const [x,y] of [[-.2,-.21],[.14,-.22],[.29,-.085],[-.09,.065]])oval(x,y,.055,.045,'#cab3b4');
   poly([[-.1,.025],[.04,.07],[.15,.03],[.19,.14],[.04,.1],[-.13,.15]],'#926174');break;
  case 'grave_lantern':
   rock(0,0,.30,.16);line([[0,-.13],[0,-.78],[.16,-.88],[.28,-.82],[.28,-.71]],iron,.041);
   rect(.16,-.70,.24,.28,iron);rect(.195,-.66,.17,.20,'#b18249');candle(.28,-.47,.13);
   poly([[.13,-.70],[.28,-.80],[.43,-.70]],slate);break;
  case 'grave_angel':case 'grave_gargoyle':{
   const angel=id==='grave_angel';
   rect(-.26,-.14,.52,.14,slate);
   for(const side of [-1,1])poly([[side*.09,-.30],[side*.18,-.69],[side*.39,angel?-.84:-.64],[side*.34,-.37],[side*.16,-.24]],angel?pale:slate);
   poly([[-.13,-.58],[.13,-.58],[.24,-.14],[-.22,-.14]],angel?'#a8aaa5':'#81858e');
   oval(0,-.67,.125,.135,angel?'#c1c2b6':'#969ba1');
   if(angel){line([[-.14,-.49],[0,-.39],[.14,-.49]],'#dbd9c6',.039);oval(0,-.82,.13,.024,gold);}
   else {for(const side of [-1,1])poly([[side*.045,-.76],[side*.14,-.90],[side*.14,-.71]],slate);line([[-.072,-.665],[-.027,-.647]],iron,.029);line([[.072,-.665],[.027,-.647]],iron,.029);}
   break;
  }
  case 'grave_fence':case 'grave_gate':{
   const gate=id==='grave_gate';
   for(let i=-4;i<=4;i++){const x=i*.111;ironBar(x,-(gate?.96-Math.abs(i)*.079:.61),-.04);}
   for(const y of [-.48,-.17])line([[-.48,y],[.48,y]],iron,.048);
   for(const x of [-.48,.48]){rect(x-.045,-(gate?1.02:.72),.09,gate?1.02:.72,slate);oval(x,gate?-1.03:-.75,.052,.042,gold);}
   if(gate)oval(0,-.46,.038,.047,gold);
   break;
  }
  case 'grave_bench':
   for(const x of [-.31,.23])rect(x,-.29,.11,.29,slate);
   rect(-.42,-.38,.84,.125,'#868c89');poly([[-.42,-.38],[-.34,-.46],[.47,-.46],[.42,-.38]],pale);
   rect(-.37,-.65,.74,.13,'#999e97');moss(.2,-.40);break;
  case 'grave_yew':
   rect(-.07,-.47,.14,.47,'#625348');
   for(const [x,y,w,h] of [[0,-.59,.35,.36],[-.10,-.82,.26,.31],[.04,-1.05,.21,.32],[-.06,-1.27,.13,.20]])oval(x,y,w,h,y<-.9?'#4c6854':'#365645');
   for(let i=0;i<7;i++)oval(Math.sin(i*2.4)*.22,-.55-i*.081,.019,.021,'#a85a63');break;
  case 'grave_brambles':
   for(let i=0;i<6;i++){const x=(i-2.5)*.125,y=-.21-Math.abs(Math.sin(i*1.7))*.25;
    line([[x*.4,0],[x,y],[x+.072,y-.11]],i%2?'#75604f':'#5b504b',.036);oval(x-.033,y+.04,.07,.034,wilt);oval(x+.07,y-.065,.028,.027,'#795472');}
   break;
  case 'grave_flowers':
   for(let i=0;i<7;i++){const x=(i-3)*.075,y=-.19-Math.abs(Math.cos(i*1.6))*.15;line([[0,-.03],[x,y]],wilt,.024);
    for(let j=0;j<6;j++)oval(x+Math.cos(j*Math.PI/3)*.031,y+Math.sin(j*Math.PI/3)*.028,.027,.025,i%2?'#eadabb':'#cca2b7');
    oval(x,y,.023,.022,gold);}
   line([[-.05,-.085],[.05,-.065]],'#936477',.03);break;
 }
};
const cave=()=>{
 const gray='#777d86',light='#aaa89d',deep='#454d59',cyan='#8cddd5';
 const spike=(x,y,w,h,down=false)=>{
  const tip=[x+w*.15,y+(down?h:-h)];
  poly([[x-w,y],tip,[x+w,y],[x+w*.5,y+.065]],gray);
  poly([[x-w,y],tip,[x+w*.08,y+.055]],light);
  poly([tip,[x+w,y],[x+w*.08,y+.055]],deep);
 };
 const glow=(x,y,r,col)=>{
  oval(x,y,r,r*.64,col);oval(x,y,r*.31,r*.31,'#e7fff0');
 };
 const crystal=(x,y,w,h,colors)=>{
  const tip=[x-w*.13,y-h],left=[x-w,y-h*.66],right=[x+w,y-h*.72];
  poly([[x-w*.7,y],left,tip,right,[x+w*.6,y]],colors[1]);
  poly([left,tip,[x+w*.08,y-h*.58],[x-w*.1,y],[x-w*.7,y]],colors[0]);
  poly([tip,right,[x+w*.6,y],[x-w*.1,y],[x+w*.08,y-h*.58]],colors[2]);
  line([[x-w*.55,y-h*.56],[x-w*.31,y-h*.78]],'#f7ffe5',.014);
 };
 const rail=(x0,y0,x1,y1)=>{line([[x0,y0],[x1,y1]],'#48525b',.06);line([[x0-.01,y0-.01],[x1-.01,y1-.01]],'#a6aeb1',.022);};
 if(!mounted)shadeGround(.43);
 switch(id){
  case 'cave_stalagmites':case 'cave_stalactites':{
   const down=id.endsWith('stalactites');
   for(const [x,w,h] of [[-.31,.11,.35],[-.15,.14,.62],[.07,.16,.49],[.26,.13,.67],[.36,.09,.31]])spike(x,down?-.98:-.02,w,h,down);
   break;
  }
  case 'cave_column':
   oval(0,-.04,.33,.12,deep);poly([[-.25,0],[-.10,-.48],[-.23,-1.08],[.21,-1.08],[.09,-.48],[.27,0]],gray);
   poly([[-.24,0],[-.10,-.48],[-.23,-1.08],[-.09,-1.08],[-.02,-.43],[-.08,0]],light);
   for(let i=0;i<6;i++)line([[-.2+i*.063,-.92],[i*.04-.1,-.51],[-.19+i*.063,-.08]],'#9a9a91',.014);
   break;
  case 'cave_turquoise':case 'cave_pyrite':case 'cave_rose':{
   const colors=id.endsWith('turquoise')?['#a4efdf','#55beb9','#398486']:id.endsWith('rose')?['#ffd3e7','#dd88b4','#a4608d']:['#ffe2a0','#c6a35e','#907340'];
   rock(0,.045,.78,.29);
   for(const [x,y,w,h] of [[-.24,-.12,.09,.38],[.11,-.16,.14,.62],[-.07,-.065,.11,.55],[.28,-.03,.08,.31]])crystal(x,y,w,h,colors);
   break;
  }
  case 'cave_mushrooms':
   for(const [x,y,w,h] of [[-.24,-.04,.113,.24],[.11,-.07,.17,.42],[.28,-.005,.10,.22],[-.055,.022,.123,.29]]){
    line([[x,y],[x-.015,y-h]],'#d7d0b2',.055);oval(x,y-h,w,.047,'#6caeaa');
    ctx.fillStyle='#8bc7bb';ctx.beginPath();ctx.ellipse(x,y-h,w,h*.33,0,Math.PI,Math.PI*2);ctx.fill();
    oval(x-.03,y-h-.038,w*.23,.025,'#d8f7d4');
   }
   break;
  case 'cave_glowworms':
   for(let i=0;i<11;i++){
    const x=Math.sin(i*2.4)*.39,y=(mounted?-.4:-.10)-i*.047+Math.sin(t*1.7+i)*.023;
    line([[x,y-.07],[x,y]],'#577772',.009);glow(x,y,.029,'rgba(135,237,188,'+(.35+.23*Math.sin(t*2+i))+')');
   }
   break;
  case 'cave_flowstone':
   rock(0,0,.89,.84,'#b1a998','#8e877d','#6c696c');
   for(let i=0;i<5;i++){const y=-.66+i*.126,x=-.2-i*.024;line([[x,y],[x+.11,y+.06],[x+.38,y+.05],[x+.49,y+.09]],i%2?'#d9cbb0':'#aa9b87',.05);}
   break;
  case 'cave_basin':case 'cave_stream':case 'cave_waterfall':{
   const stream=id.endsWith('stream'),falls=id.endsWith('waterfall');
   if(falls)rock(-.10,-.08,.72,1.06);
   if(stream){line([[-.47,-.23],[-.19,-.17],[.02,-.09],[.46,.035]],'#476e78',.25);line([[-.43,-.24],[-.18,-.18],[.05,-.10],[.42,.012]],'#64aeb1',.14);}
   else{oval(.04,-.025,.44,.20,'#617477');oval(.045,-.065,.37,.143,'#388593');oval(-.07,-.105,.20,.067,'#65b0b5');}
   if(falls){line([[.045,-.87],[.13,-.52],[.10,-.17],[.20,-.075]],'#62adbc',.19);line([[.015,-.85],[.083,-.55],[.07,-.24],[.13,-.12]],'#b0e0dc',.048);}
   for(let i=0;i<4;i++){const u=(t*.83+i/4)%1;oval((u-.5)*.52,-.05+(i%2)*.04,.043+u*.04,.012,'rgba(192,244,234,'+(.65*(1-u))+')');}
   break;
  }
  case 'cave_fossil':
   rock(0,.078,.91,.30,'#a4a29a','#7f8581','#5c6968');
   line([[-.33,-.055],[.29,-.155]],'#e0d2b0',.035);
   for(let i=0;i<6;i++){const x=-.25+i*.086,y=-.07-i*.014;line([[x-.016,y-.09],[x,y],[x+.067,y+.06]],'#c8bd9f',.026);}
   oval(.30,-.16,.055,.035,'#ded1b0');
   break;
  case 'cave_tracks':
   oval(0,-.04,.45,.23,'#776c60');
   for(let i=0;i<5;i++){const x=-.28+i*.126,y=-.16+i*.036+(i%2?.06:0);oval(x,y,.058,.027,'#4d4543');for(let j=-1;j<=1;j++)oval(x+.057,y+j*.021,.016,.010,'#554a45');}
   break;
  case 'cave_roots':
   for(let i=0;i<7;i++){const x=(i-3)*.105,y=-.9+(i%2)*.08;line([[x,y],[x-.07,y+.20],[x+.075,y+.38],[x+.06,y+.58+(i%3)*.06]],i%2?'#a58a67':'#7e674d',.038-i*.002);line([[x+.06,y+.34],[x+.13,y+.43],[x+.17,y+.55]],'#9b815e',.015);}
   break;
  case 'cave_rails':
   for(let i=0;i<5;i++){const y=-.32+i*.095,x=i*.035;line([[x-.39,y],[x+.20,y+.064]],'#795c46',.057);}
   for(const x of [-.26,.11])rail(x,-.39,x+.16,.115);
   break;
  case 'cave_lamp':
   line([[-.15,-.53],[-.105,-.72],[.105,-.72],[.15,-.53]],deep,.035);
   oval(0,-.07,.25,.09,deep);rect(-.175,-.51,.35,.43,'#655e55');rect(-.12,-.45,.24,.28,'#cc8f53');
   glow(-.012,-.28,.11,'rgba(255,192,114,.78)');line([[.04,-.51],[.04,-.11]],'#534e49',.043);
   break;
  case 'cave_pick':
   rock(-.22,.015,.39,.28);line([[-.12,-.025],[.22,-.74]],'#9c704c',.062);line([[-.102,-.02],[.236,-.74]],'#c59c6d',.018);
   poly([[-.025,-.78],[.16,-.82],[.36,-.74],[.48,-.62],[.20,-.705],[.045,-.70]],'#aab3b6');
   break;
  case 'cave_support':
   for(const x of [-.39,.39]){line([[x,0],[x,-.84]],'#826047',.126);line([[x-.024,-.045],[x-.024,-.82]],'#b08b62',.031);}
   line([[-.46,-.84],[.46,-.84]],'#a77c56',.153);line([[-.38,-.62],[-.18,-.82]],'#b18b61',.071);line([[.38,-.62],[.18,-.82]],'#b18b61',.071);
   break;
  case 'cave_painting':
   poly([[-.42,-.12],[-.37,-.58],[-.17,-.78],[.29,-.71],[.43,-.36],[.31,-.09]],'#a69e91');
   line([[-.31,-.47],[-.15,-.58],[.12,-.57],[.27,-.40],[.05,-.36],[-.15,-.44],[-.29,-.57]],'#8f523d',.038);
   for(const x of [-.10,.12])line([[x,-.42],[x-.07,-.27]],'#8f523d',.031);
   for(let i=0;i<5;i++)oval(-.28+i*.13,-.23,.019,.019,'#a76447');
   break;
 }
};
if(id.startsWith('cave_'))cave();
else if(id.startsWith('grave_'))cemetery();
else if(id==='granite_arch'){
 shadeGround(.46);
 poly([[-.49,0],[-.43,-.49],[-.29,-.83],[-.04,-1.04],[.24,-.99],[.42,-.74],[.48,-.44],[.44,0],[.26,0],[.27,-.43],[.15,-.68],[-.02,-.79],[-.16,-.67],[-.27,-.44],[-.3,0]],'#859090');
 poly([[-.43,-.49],[-.29,-.83],[-.04,-1.04],[.24,-.99],[.42,-.74],[.15,-.83],[-.04,-.89],[-.23,-.72]],'#b2bcb3');
 poly([[.48,-.44],[.44,0],[.26,0],[.27,-.43],[.15,-.68],[.42,-.74]],'#626e70');
 for(const [x,y] of [[-.35,-.38],[-.25,-.73],[.19,-.89],[.37,-.53]])line([[x-.06,y],[x,y+.04],[x+.06,y+.04]],'#667676',.016);
 moss(-.43,-.05);
}else if(id==='basalt'){
 shadeGround();
 for(const [x,y,w,h] of [[.12,-.18,.24,1.07],[-.16,-.12,.25,.85],[.34,-.06,.24,.66],[-.34,-.02,.21,.57],[.03,.05,.28,.67]]){
  const top=y-h;
  poly([[x-w*.5,top],[x-w*.08,top-.08],[x+w*.48,top-.03],[x+w*.5,y-.04],[x+w*.05,y],[x-w*.5,y-.03]],'#576473');
  poly([[x-w*.5,top],[x+w*.05,top+.05],[x+w*.05,y],[x-w*.5,y-.03]],'#6c7983');
  poly([[x-w*.5,top],[x-w*.08,top-.08],[x+w*.48,top-.03],[x+w*.05,top+.05]],'#a7adb2');
  line([[x-w*.42,y-h*.28],[x+w*.04,y-h*.22]],'#4a5663',.014);
 }
}else if(id==='quartz'){
 shadeGround();rock(-.05,0,.82,.59);
 poly([[-.4,-.21],[-.17,-.43],[.02,-.43],[.22,-.62],[.34,-.41],[.02,-.29],[-.13,-.31],[-.31,-.15]],'#e0e8d7');
 for(const [x,y,w,h] of [[-.24,-.31,.07,.22],[-.08,-.39,.09,.33],[.07,-.37,.07,.27],[.21,-.49,.06,.21]]){
  poly([[x-w,y],[x-w,y-h*.74],[x,y-h],[x+w,y-h*.77],[x+w*.8,y]],'#cee4e2');
  poly([[x,y-h],[x+w,y-h*.77],[x+w*.8,y],[x,y]],'#94c6ce');
  line([[x-w*.6,y-.04],[x-w*.6,y-h*.68]],'#f9fff0',.015);
 }
}else if(id==='split_boulder'){
 shadeGround();rock(-.22,0,.49,.73);rock(.25,-.025,.5,.9,'#b5bdb0');
 poly([[.04,-.83],[-.035,-.53],[.035,-.39],[-.065,-.19],[-.015,0],[.08,-.15],[.12,-.41],[.04,-.57],[.12,-.79]],'#45575b');
 line([[.12,-.76],[.068,-.56],[.14,-.41],[.1,-.2]],'#cad0bf',.019);
 moss(.14,-.05);
}else if(id==='scree'){
 shadeGround(.42);
 for(const [x,y,w,h] of [[-.23,-.11,.27,.21],[.06,-.17,.34,.24],[.29,-.04,.22,.15],[-.08,-.025,.32,.18],[-.32,.04,.23,.14],[.12,.08,.26,.15]])
  rock(x,y,w,h,'#a3a8a2','#778183','#646c75');
}else if(id==='ammonite'){
 shadeGround();rock(0,.075,.86,.3,'#b7ad95','#948978','#746f69');
 const spiral=[];
 for(let i=0;i<=42;i++){const a=i*.37,r=.014+i*.0043;spiral.push([.02+Math.cos(a)*r,-.13+Math.sin(a)*r*.47]);}
 line(spiral,'#82664f',.032);line(spiral.map(([x,y])=>[x-.008,y-.008]),'#d8c4a4',.014);
 for(const [x,y] of [[-.27,-.14],[.29,-.1],[-.26,-.075]])line([[x-.035,y+.014],[x,y],[x+.035,y-.007]],'#8d816d',.014);
}else if(id==='spring'){
 shadeGround(.48);rock(-.16,-.07,.63,.71);rock(.22,.03,.49,.38);
 oval(.09,-.025,.34,.13,'#526d70');oval(.09,-.052,.28,.09,'#64aab0');
 line([[-.14,-.43],[-.02,-.47],[.04,-.37]],'#466568',.065);
 line([[.02,-.39],[.1,-.26],[.08,-.14],[.12,-.07]],'#87dbe1',.07);
 line([[.035,-.37],[.104,-.26],[.09,-.16]],'#ccf4ed',.022);
 for(let i=0;i<3;i++){const u=(t*.9+i/3)%1;oval(.12+u*.07,-.065+u*.04,.023+u*.05,.012,'rgba(212,250,244,'+(1-u)*.8+')');}
 moss(-.35,-.09);
}else if(id==='shelter'){
 shadeGround(.5);rect(-.38,-.51,.76,.52,'#9a9584');
 poly([[.38,-.51],[.52,-.6],[.52,-.09],[.38,.01]],'#6d7775');
 for(let row=0;row<3;row++){
  const y=-.49+row*.15;line([[-.36,y],[.35,y]],'#756f65',.02);
  for(let j=0;j<3;j++){const x=-.31+j*.22+(row%2)*.11;line([[x,y],[x,y+.145]],'#756f65',.014);}
 }
 poly([[-.49,-.52],[-.05,-.92],[.08,-.98],[.54,-.6],[.41,-.5],[-.04,-.79]],'#64797c');
 poly([[-.49,-.52],[-.04,-.79],[.41,-.5]],'#94a09b');
 rect(-.115,-.29,.23,.30,'#53483b');rect(-.088,-.265,.176,.275,'#805e41');oval(.054,-.12,.017,.017,'#d2b875');
 rect(-.3,-.39,.11,.1,'#fff0ab');
}else if(id==='eagle_crag'){
 shadeGround(.35);rock(0,0,.52,1.02,'#aeb4a8','#798987','#576d72');rock(-.2,.02,.3,.32);
 oval(.01,-.87,.27,.088,'#77624a');oval(.01,-.89,.21,.052,'#514b3c');
 for(let i=0;i<9;i++){const x=(i-4)*.047;line([[x-.065,-.865+Math.sin(i)*.022],[x+.065,-.855+Math.cos(i)*.02]],i%2?'#967954':'#b1996f',.021);}
 for(const [x,y] of [[-.068,-.93],[.01,-.95],[.076,-.92]])oval(x,y,.043,.058,'#eee5c7');
}else if(id==='summit_marker'){
 shadeGround(.34);rock(-.1,.01,.51,.34);rock(.23,.035,.23,.19);
 line([[0,-.12],[0,-1.08]],'#776343',.062);line([[-.015,-.34],[-.015,-1.07]],'#b49764',.018);
 const flap=Math.sin(t*4)*.05;
 poly([[.025,-1.04],[.2,-1.02+flap],[.39,-1.03+flap],[.31,-.87+flap],[.07,-.89]],'#bb6651');
 line([[.075,-.98],[.19,-.96+flap],[.32,-.97+flap]],'#f3d6a6',.025);
 oval(0,-1.1,.05,.04,'#c6ad72');
}else if(id==='ice_ledge'){
 shadeGround();rock(.04,.02,.84,.66,'#c9deda','#869fa6','#658493');
 poly([[-.4,-.28],[-.21,-.55],[.12,-.64],[.44,-.42],[.18,-.33],[-.07,-.39],[-.25,-.27]],'#ebf5ee');
 for(const [x,y,h] of [[-.31,-.28,.13],[-.11,-.36,.19],[.04,-.35,.26],[.21,-.34,.17],[.34,-.38,.13]])poly([[x-.035,y],[x+.04,y-.015],[x,y+h]],'#b9e5ec');
}else if(id==='storm_stone'){
 shadeGround(.4);rock(0,0,.56,1.15,'#879395','#647578','#4a5b64');
 const crack=[[.09,-1.1],[-.04,-.84],[.07,-.7],[-.1,-.52],[-.028,-.45],[-.17,-.22]];
 line(crack,'#3a4c57',.056);line(crack,'#d9c487',.016);
 line([[-.05,-.52],[.08,-.43],[.11,-.32]],'#8a947f',.019);
 rock(-.23,.01,.21,.16);rock(.24,.05,.24,.19);
}else if(id==='amethyst_geode'){
 shadeGround();rock(0,0,.92,.83,'#9a9ca3','#686978','#525763');
 poly([[-.35,-.35],[-.20,-.62],[.10,-.70],[.34,-.55],[.34,-.24],[.06,-.15],[-.22,-.18]],'#4d425c');
 for(const [x,y,w,h] of [[-.24,-.24,.085,.31],[-.13,-.20,.081,.43],[.01,-.18,.096,.46],[.15,-.21,.085,.32],[.25,-.25,.052,.25]]){
  poly([[x-w,y],[x-w,y-h*.73],[x,y-h],[x+w,y-h*.72],[x+w,y]],'#aa83d0');
  poly([[x,y],[x,y-h],[x+w,y-h*.72],[x+w,y]],'#784fa3');line([[x-w*.6,y-.055],[x-w*.6,y-h*.64]],'#ddbaee',.018);
 }
}else if(id==='stone_mushroom'){
 shadeGround();rock(0,0,.38,.58,'#b1a58e','#8f8878','#686c67');
 poly([[-.48,-.45],[-.40,-.62],[-.21,-.77],[.17,-.79],[.37,-.68],[.49,-.48],[.28,-.39],[-.23,-.38]],'#a69781');
 poly([[-.48,-.45],[-.22,-.49],[.25,-.50],[.49,-.48],[.28,-.39],[-.23,-.38]],'#786c62');
 line([[-.33,-.58],[-.10,-.68],[.18,-.68]],'#c3b49c',.028);
}else if(id==='carved_steps'){
 shadeGround();
 for(let i=3;i>=0;i--){const y=-i*.122,w=.90-i*.063;
  poly([[-w/2,y],[-w/2+.11,y-.145],[w/2+.11,y-.145],[w/2,y]],i%2?'#b0b4a7':'#a3aaa0');
  poly([[-w/2,y],[w/2,y],[w/2,y+.075],[-w/2,y+.075]],'#747e7b');
  line([[-w*.41,y+.015],[w*.40,y+.015]],'#919b91',.013);
 }
}else if(id==='copper_vein'){
 shadeGround();rock(0,0,.90,.79,'#9e9b8d','#747d74','#57665c');
 const vein=[[-.38,-.26],[-.25,-.45],[-.10,-.39],[.03,-.53],[.17,-.56],[.24,-.68],[.38,-.56]];
 line(vein,'#508781',.092);line(vein,'#b77e58',.044);
 for(const [x,y] of [[-.21,-.44],[-.035,-.43],[.18,-.58],[.29,-.63]])oval(x,y,.044,.030,'#dcaa75');
}else if(id==='mountain_fissure'){
 shadeGround(.44);
 poly([[-.46,-.10],[-.29,-.33],[.32,-.25],[.48,-.03],[.30,.11],[-.31,.10]],'#88918b');
 poly([[-.37,-.14],[-.18,-.20],[-.07,-.12],[.06,-.18],[.14,-.065],[.33,-.07],[.23,.01],[.08,.025],[-.02,-.055],[-.20,.01]],'#3c4c4e');
 line([[-.37,-.14],[-.18,-.20],[-.07,-.12],[.06,-.18],[.14,-.065],[.33,-.07]],'#c3c6b5',.022);
}else if(id==='climber_anchor'){
 shadeGround();rock(-.05,.02,.62,.61);
 for(const x of [-.19,.08]){oval(x,-.43,.069,.067,'#596a70');oval(x,-.435,.041,.041,'#afb9b7');}
 line([[-.19,-.435],[-.21,-.29],[-.12,-.19],[.04,-.22],[.08,-.435]],'#d9ab66',.047);
 for(let i=0;i<4;i++)oval(.23,-.07-i*.024,.13,.034,i%2?'#b48851':'#d7b173');
}else if(id==='quarry_winch'){
 shadeGround();for(const x of [-.29,.29]){line([[x,.01],[x,-.55]],'#805a40',.10);line([[x-.024,-.03],[x-.024,-.51]],'#ba8b61',.027);}
 line([[-.32,-.46],[.34,-.46]],'#59646a',.085);rect(-.17,-.55,.34,.18,'#977149');
 for(let i=0;i<6;i++)line([[-.15+i*.058,-.54],[-.17+i*.058,-.38]],'#d1ac71',.024);
 line([[.30,-.46],[.39,-.28],[.50,-.28]],'#626a69',.041);oval(.5,-.28,.055,.039,'#b88859');
}else if(id==='ore_cart'){
 shadeGround();for(const x of [-.25,.28]){oval(x,-.08,.108,.098,'#434c50');oval(x,-.08,.041,.037,'#949e9a');}
 poly([[-.43,-.45],[.42,-.45],[.31,-.15],[-.33,-.15]],'#805c43');
 for(let i=0;i<4;i++)rock(-.31+i*.20,-.42,.22,.17+i%2*.07,'#9fa69e','#79857f','#626e6a');
 line([[-.43,-.44],[.42,-.44]],'#b88a5b',.055);line([[-.34,-.20],[.32,-.20]],'#586469',.047);
}else if(id==='glacial_stripes'){
 shadeGround();rock(0,.075,.93,.29,'#b1c1c1','#8c9d9d','#647d85');
 for(let i=0;i<7;i++){const x=-.32+i*.084;line([[x,-.06],[x+.16,-.18]],i%2?'#7c969d':'#d5dfda',.016);}
}else if(id==='wind_stele'){
 shadeGround();rock(0,0,.57,1.12,'#bdc0ae','#939c91','#657778');
 for(let i=0;i<3;i++){const y=-.47-i*.13;line([[-.14,y],[.04,y-.045],[.13,y-.015]],'#61767d',.024);}
 const wave=Math.sin(t*4)*.08;
 line([[.02,-.96],[.15,-1.15]],'#74654c',.036);
 poly([[.15,-1.12],[.33,-1.10+wave],[.40,-.98+wave],[.16,-1.035]],'#d6a365');
}else if(id==='slate_spire'){
 shadeGround();poly([[-.39,.02],[-.22,-.56],[-.07,-1.17],[.15,-.87],[.23,-.55],[.37,.03]],'#71828b');
 poly([[-.39,.02],[-.07,-1.17],[.045,-.45],[-.09,.03]],'#a1a9aa');
 poly([[-.09,.03],[.045,-.45],[.15,-.87],[.37,.03]],'#566976');
 for(let i=0;i<5;i++){const y=-.18-i*.135,w=.29-i*.039;line([[-w,y+.055],[.03,y],[w,y+.044]],'#83929a',.018);}
}else if(id==='alpine_pool'){
 shadeGround();oval(0,-.075,.44,.25,'#7f928e');oval(0,-.084,.37,.19,'#4a939d');oval(-.08,-.135,.25,.093,'#6bb7bf');
 for(let i=0;i<3;i++){const u=(t*.7+i/3)%1;oval(.07,-.092+u*.03,.06+u*.19,.011,'rgba(204,242,234,'+(1-u)*.7+')');}
 for(const [x,y] of [[-.33,-.13],[.31,-.10],[.22,.03]])rock(x,y,.17,.13);
}else if(id==='lily'){
ctx.save();ctx.scale(1,.55);ctx.fillStyle='#398f4a';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,.46,.23,Math.PI*2-.15);ctx.closePath();ctx.fill();for(let i=1;i<8;i++){const a=i*.75;line([[0,0],[Math.cos(a)*.39,Math.sin(a)*.39]],'#71b55e',.014);}ctx.restore();for(let n=0;n<5;n++)oval(-.16+Math.cos(n*1.26)*.045,-.13+Math.sin(n*1.26)*.025,.05,.035,'#f2b5cf');oval(-.16,-.13,.024,.02,'#f6d87a');
}else if(id==='stepping'){oval(0,-.015,.45,.27,'#616b66');oval(0,-.07,.43,.25,'#b1b7a8');line([[-.32,-.12],[-.13,-.22],[.12,-.22]],'#d8dbce');moss(.14,.02);
}else if(id==='buoy'||id==='float'){ctx.translate(0,Math.sin(t*2)*.025);oval(0,.02,.24,.055,'#b5e5ea');line([[0,0],[0,-.5]],dark,.025);oval(0,-.13,id==='buoy'?.18:.08,.17,'#f1e9cb');oval(0,-.23,id==='buoy'?.17:.07,.1,'#e75d43');poly([[0,-.5],[.2,-.45],[0,-.4]],'#f8c25c');
}else if(id.startsWith('bush')){for(let i=0;i<7;i++)oval(Math.sin(i*2.4)*.28,-.22-Math.abs(Math.cos(i*2.4))*.2,.2,.19,i%2?green:'#70a952');if(id!=='bush_round')for(let i=0;i<10;i++)oval(Math.sin(i*2.2)*.34,-.15-(i%4)*.09,.028,.03,id==='bush_berries'?'#5c467b':'#f7bcce');
}else if(id==='birdhouse'||id==='feeder'){line([[0,0],[0,-.85]],wood,.08);rect(-.23,-.88,.46,.32,'#c69758');poly([[-.3,-.88],[0,-1.14],[.3,-.88]],'#8b493e');if(id==='birdhouse'){oval(0,-.76,.065,.07,dark);line([[0,-.64],[.14,-.61]],dark,.025);}else{rect(-.18,-.84,.36,.18,dark);for(let i=0;i<7;i++)oval(-.15+i*.05,-.65,.016,.012,'#f4cf77');}
}else if(id==='picnic'||id==='workbench'){legs();rect(-.43,-.56,.86,.15,wood);line([[-.35,-.05],[.3,-.42]],dark,.035);if(id==='picnic'){rect(-.36,-.58,.72,.22,'#fff0d6');for(let x=0;x<6;x++)for(let y=0;y<2;y++)if((x+y)%2===0)rect(-.36+x*.12,-.58+y*.11,.12,.11,'#c65e55');for(const x of [-.48,.3])rect(x,-.22,.18,.09,wood);}else{rect(.22,-.51,.16,.17,'#667377');line([[.2,-.37],[.45,-.37]],'#bcc6bf');poly([[-.3,-.62],[.14,-.62],[.07,-.55],[-.3,-.55]],'#c0c9c0');oval(-.32,-.58,.07,.04,dark);for(let n=0;n<7;n++)line([[-.28+n*.09,-.02],[-.24+n*.09,.01]],'#d7b178',.02);}
}else if(id==='grill'||id==='smoker'){rect(-.32,-.6,.64,.58,'#9c5745');for(let r=0;r<4;r++)for(let x=0;x<3;x++)line([[-.31+x*.22,-.57+r*.14],[-.1+x*.22,-.57+r*.14]],'#d5ab83',.014);rect(-.23,-.48,.46,.26,'#302f2c');for(let n=0;n<6;n++)line([[-.22+n*.085,-.48],[-.22+n*.085,-.22]],'#9d9c8f',.018);rect(.15,-1,.13,.44,'#855649');if(id==='smoker')rect(-.26,-.85,.42,.32,'#555b57');for(let n=0;n<4;n++){const u=(t*.3+n*.25)%1;ctx.globalAlpha=(1-u)*.35;oval(.22+Math.sin(u*5)*.06,-1-u*.5,.06+u*.1,.05+u*.08,'#e3e1d5');}ctx.globalAlpha=1;
}else if(id==='waterwheel'){ctx.save();ctx.translate(0,-.48);ctx.rotate(t*.5);ctx.strokeStyle=wood;ctx.lineWidth=.065;ctx.beginPath();ctx.arc(0,0,.42,0,Math.PI*2);ctx.stroke();for(let n=0;n<10;n++){const a=n*Math.PI/5;line([[0,0],[Math.cos(a)*.45,Math.sin(a)*.45]],wood,.04);ctx.save();ctx.rotate(a);rect(.35,-.08,.16,.16,'#bc915d');ctx.restore();}oval(0,0,.09,.09,dark);ctx.restore();line([[-.35,0],[0,-.48],[.35,0]],dark,.045);
}else if(id==='weathervane'){line([[0,0],[0,-1.2]],'#66757a',.035);const sway=Math.sin(t*.5)*.08;line([[-.36,-1+sway],[.36,-1-sway]],'#b29a59');poly([[.36,-1-sway],[.2,-1.09-sway],[.2,-.91-sway]],'#d5b55e');oval(0,-1.15,.1,.06,'#b18b45');poly([[-.07,-1.14],[-.22,-1.28],[-.19,-1.09]],'#b18b45');
}else if(id==='web'){const cy=-.45;for(let n=0;n<8;n++){const a=n*Math.PI/4;line([[0,cy],[Math.cos(a)*.43,cy+Math.sin(a)*.4]],'#cbd9d3',.012);}for(let r=1;r<4;r++){const pts=[];for(let n=0;n<=8;n++){const a=n*Math.PI/4;pts.push([Math.cos(a)*r*.12,cy+Math.sin(a)*r*.11]);}line(pts,'#e0e7dd',.01);}oval(.19,-.23,.025,.035,dark);
}else if(id==='monolith'){poly([[-.27,0],[-.23,-1.05],[.04,-1.2],[.25,-1.04],[.3,0]],stone);line([[0,-.94],[0,-.2]],dark,.018);for(let n=0;n<9;n++){const y=-.88+n*.075;line([[n%2?-.08:0,y],[n%2?0:.1,y-.045]],dark,.018);}for(let n=0;n<8;n++)line([[-.35+n*.1,0],[-.4+n*.1,-.1]],'#9a9860');
}else if(id==='sword'){
 oval(0,.015,.39,.1,'rgba(30,38,35,.18)');
 poly([[-.34,-.09],[-.28,-.28],[-.09,-.39],[.2,-.35],[.35,-.18],[.27,.015],[-.2,.04]],'#747d79');
 poly([[-.34,-.09],[-.28,-.28],[-.09,-.39],[.2,-.35],[.35,-.18],[.11,-.13],[-.2,-.16]],'#a6afa4');
 line([[-.11,-.28],[.02,-.29],[.09,-.25]],'#5c6863',.025);
 moss(-.24,-.1);moss(.11,-.06);
 const age=t-props.swordTakenAt;
 if(!props.swordTaken||age<.7){
  const u=props.swordTaken?Math.max(0,age/.7):0;
  ctx.save();ctx.translate(0,-.52*u);ctx.globalAlpha*=1-Math.max(0,(u-.68)/.32);
  poly([[-.06,-.64],[.06,-.64],[.045,-.34],[0,-.28],[-.045,-.34]],'#b7c6cd');
  poly([[0,-.64],[.06,-.64],[.045,-.34],[0,-.28]],'#ebf6ef');
  line([[0,-.66],[0,-.88]],'#714b37',.061);
  line([[-.155,-.61],[-.095,-.655],[.095,-.655],[.155,-.61]],'#cc9c59',.045);
  oval(0,-.89,.055,.047,'#d9aa68');oval(0,-.89,.023,.023,'#a5dad0');
  ctx.restore();
 }
}else if(id==='totem'){line([[0,0],[0,-1.2]],wood,.13);for(const y of [-.95,-.5]){poly([[-.12,y],[.12,y],[.04,y+.18],[-.04,y+.18]],'#ddd4ae');for(const d of [-1,1]){line([[d*.09,y],[d*.2,y-.1],[d*.23,y-.29]],'#b5a780');line([[d*.19,y-.1],[d*.32,y-.18]],'#b5a780');oval(d*.045,y+.035,.018,.02,dark);}}for(const d of [-1,1]){line([[0,-.7],[d*.3,-.61],[d*.32,-.3]],'#a87853');oval(d*.3,-.38,.035,.12,d?'#d8cfac':'#667c81');}
}else if(id==='wreck'){ctx.save();ctx.rotate(-.32);rect(-.4,-.3,.75,.23,wood);for(let n=0;n<5;n++)rect(-.4+n*.15,-.53,.055,.29,n%2?wood:'#bd9158');for(const x of [-.26,.27]){oval(x,-.13,.16,.16,dark);oval(x,-.13,.11,.11,'#b3864d');line([[x-.12,-.13],[x+.12,-.13]],dark);}ctx.restore();line([[-.44,-.07],[-.57,.08]],wood,.05);for(const x of [-.45,.45]){oval(x,.04,.12,.1,wood);line([[x-.09,.04],[x+.09,.04]],dark,.025);}
}else if(id==='well'){oval(0,-.18,.38,.24,'#646d63');oval(0,-.28,.38,.2,stone);oval(0,-.28,.26,.12,'#393c35');for(let n=-2;n<=2;n++)line([[n*.08,-.38],[n*.08,-.18]],'#916747',.022);for(const y of [-.34,-.26])line([[-.22,y],[.22,y]],'#916747',.022);moss(-.28,-.18);moss(.06,-.4);
}else if(id==='bivouac'){oval(0,-.04,.3,.17,'#4c4940');for(let n=0;n<9;n++)oval(Math.cos(n*.7)*.34,Math.sin(n*.7)*.19-.04,.075,.045,stone);line([[-.19,-.06],[.16,-.16]],'#322c27',.085);poly([[.22,.08],[.41,.1],[.36,.19],[.19,.15]],'#9b8673');
}else if(id==='logs'){for(let n=0;n<5;n++){const x=-.28+(n%3)*.23,y=-.12-Math.floor(n/3)*.2;rect(x-.08,y-.12,.25,.15,wood);oval(x-.08,y-.04,.065,.08,'#d0aa6b');oval(x-.08,y-.04,.027,.04,'#ad8151');}line([[-.05,-.49],[-.1,-.03],[.1,.01]],'#d5c49a',.025);line([[.2,-.3],[.35,-.72]],wood,.04);poly([[.3,-.65],[.13,-.7],[.11,-.55],[.28,-.53]],'#97a5a4');
}else if(id==='hideout'){poly([[-.37,-.18],[.3,-.23],[.4,.1],[-.3,.18]],wood);for(let n=0;n<4;n++)line([[-.29+n*.17,-.16],[-.24+n*.17,.12]],dark,.018);oval(.2,-.02,.035,.02,dark);for(let n=0;n<12;n++)oval(Math.sin(n*2.3)*.36,Math.cos(n*2.3)*.17,.09,.04,n%2?green:'#9c9755');
}else if(id==='cairn'){for(let n=0;n<5;n++)oval(Math.sin(n*2)*.03,-.07-n*.105,.25-n*.04,.075, n%2?stone:'#b3b5a4');line([[-.05,-.22],[.04,-.28],[.1,-.22]],'#b65e3c',.035);}
ctx.restore();};
})(window.BK);
