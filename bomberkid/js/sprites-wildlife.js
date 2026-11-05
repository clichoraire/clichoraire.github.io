(function(BK){
BK.sprites.drawWildlife=function(ctx,type,o={}){
const def=BK.ENEMIES[type],a=def.wildlife,q=a.shape,t=o.t||0,s=(o.s||60)*a.scale,c=def.evil?'#78618d':a.color,dark='#55463f',cream='#fff0d2';
ctx.save();ctx.scale((o.flip?-1:1)*s,s);if(o.hurt>0&&Math.floor(t*30)%2)ctx.globalAlpha=.5;
const el=(x,y,rx,ry,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
const ln=(p,col,w=.04)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
const tri=(p,col)=>{ctx.fillStyle=col;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
const eye=(x,y)=>{el(x,y,.026,.032,def.evil?'#ff535f':'#263647');el(x+.007,y-.01,.008,.009,'#fff');};
if(o.creature?.rejectSpitAt>t)ctx.rotate(Math.sin(t*22)*.035);
const stride=o.state==='walk'?Math.sin(t*9)*.045:0;
if(q==='gnome'){
 const mushroom=a.residence==='enchanted_1',bob=Math.abs(stride)*.55,skin='#edb990';
 for(const side of [-1,1]){
  const y=-.055+side*stride;
  el(side*.125,y,.112,.063,'#654c3b');
  el(side*.13+.018,y-.021,.079,.032,mushroom?'#966342':'#8a7460');
 }
 ctx.translate(0,-bob);
 el(0,-.25,.218,.218,c);
 for(const side of [-1,1]){
  ln([[side*.15,-.34],[side*.235,-.25+side*stride]],c,.093);
  el(side*.236,-.24+side*stride,.053,.055,skin);
 }
 ln([[-.161,-.175],[0,-.192],[.16,-.175]],'#71543c',.054);
 el(.015,-.19,.044,.039,'#d9ac65');
 el(.015,-.19,.021,.018,'#71543c');
 el(-.172,-.45,.059,.066,skin);el(.172,-.45,.059,.066,skin);
 el(0,-.48,.174,.16,skin);
 tri([[-.15,-.443],[-.158,-.35],[-.071,-.28],[.024,-.248],[.114,-.305],[.157,-.446],[.055,-.428],[-.05,-.428]],a.beard);
 el(-.062,-.466,.021,.024,'#3b3c41');el(.064,-.466,.021,.024,'#3b3c41');
 if(o.creature?.gnomeAngry){ln([[-.108,-.506],[-.035,-.482]],'#743d43',.022);ln([[.108,-.506],[.035,-.482]],'#743d43',.022);}
 el(.011,-.426,.048,.039,'#e7a580');el(-.005,-.437,.023,.014,'#f8c5a0');
 if(mushroom){
  el(0,-.599,.251,.073,'#a73e4a');
  ctx.fillStyle=a.hat;ctx.beginPath();ctx.ellipse(0,-.598,.25,.197,0,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();
  for(const [x,y,s] of [[-.129,-.687,.036],[.038,-.743,.042],[.151,-.652,.032],[-.027,-.628,.023]])el(x,y,s,s*.74,'#fff2d6');
 }else{
  tri([[-.229,-.563],[-.125,-.682],[-.043,-.847],[.061,-.958],[.048,-.821],[.169,-.655],[.224,-.562]],a.hat);
  tri([[-.206,-.567],[-.118,-.68],[-.043,-.847],[.061,-.958],[-.029,-.692],[.026,-.565]],'#5b84a3');
  el(0,-.558,.225,.042,'#38556c');
  tri([[-.13,-.655],[-.103,-.697],[-.073,-.658],[-.102,-.631]],'#e4c98b');
 }
}else if(['owl','bat','duck','peacock'].includes(q)){
 if(q==='peacock')for(let i=0;i<9;i++){let a0=-Math.PI+i*Math.PI/8,x=-.15+Math.cos(a0)*.38,y=-.25+Math.sin(a0)*.5;ln([[-.1,-.2],[x,y]],'#499e78',.1);el(x,y,.055,.075,'#dfbd62');el(x,y,.026,.038,'#3b75a7');}
 if(q==='bat'){for(let d of [-1,1])tri([[0,-.4],[d*.5,-.65+Math.sin(t*10)*.08],[d*.35,-.3],[d*.2,-.36],[d*.12,-.18]],c);el(0,-.3,.14,.2,c);tri([[-.12,-.5],[-.1,-.7],[0,-.5]],c);tri([[.12,-.5],[.1,-.7],[0,-.5]],c);eye(-.055,-.4);eye(.055,-.4);}
 else {for(let x of [-.12,.12])ln([[x,-.1],[x,-.02],[x+.07,-.02]],'#d2a148',.025);el(0,-.28,.23,.26,c);el(-.07,-.26,.13,.17,def.evil?dark:'#c9b78b');el(.1,-.5,.17,.16,c);if(q==='owl'){el(.02,-.5,.075,.09,cream);el(.17,-.5,.075,.09,cream);eye(.02,-.5);eye(.17,-.5);tri([[.08,-.44],[.13,-.44],[.1,-.38]],'#d2a148');}else{tri([[.24,-.51],[.4,-.47],[.23,-.43]],'#e8b348');eye(.16,-.54);}}
 }else if(q==='turtle'){
for(const x of [-.24,.18]){el(x,-.08,.09,.055,c);el(x+.04,-.15,.07,.045,c);}
tri([[-.25,-.13],[-.4,-.13],[-.28,-.2]],c);
el(.32,-.17,.14,.09,c);eye(.38,-.2);
el(-.03,-.24,.31,.23,'#385b42');el(-.03,-.25,.28,.2,'#7a9a56');
tri([[-.13,-.4],[.04,-.43],[.16,-.31],[.08,-.18],[-.1,-.18],[-.2,-.3]],'#567d46');
ln([[-.13,-.4],[-.1,-.18],[.08,-.18],[.16,-.31],[.04,-.43],[-.13,-.4],[-.2,-.3],[-.1,-.18]],'#b5bd77',.015);
for(const points of [[[-.2,-.3],[-.3,-.29]],[[.16,-.31],[.24,-.3]],[[.08,-.18],[.14,-.1]],[[-.1,-.18],[-.17,-.1]]])ln(points,'#b5bd77',.015);
ln([[-.29,-.13],[-.16,-.09],[.12,-.09],[.25,-.15]],'#d2c58a',.03);
}else if(q==='squirrel'){
ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-.12,-.14);ctx.bezierCurveTo(-.7,-.16,-.65,-.97,-.3,-.91);ctx.bezierCurveTo(-.02,-.85,-.25,-.55,-.4,-.66);ctx.bezierCurveTo(-.48,-.41,-.23,-.35,-.12,-.14);ctx.fill();
el(-.05,-.27,.17,.25,c);el(.04,-.26,.095,.16,cream);el(.1,-.55,.17,.14,c);
tri([[.01,-.65],[.02,-.85],[.11,-.66]],c);el(.24,-.51,.085,.045,c);el(.31,-.52,.023,.02,dark);eye(.17,-.59);
ln([[.08,-.36],[.2,-.3]],c,.055);el(-.07,-.06,.16,.055,c);
}else if(q==='hedgehog'){
for(const x of [-.22,.2])el(x,-.045,.07,.04,c);
el(-.06,-.23,.34,.24,'#675448');
for(let row=0;row<3;row++)for(let i=0;i<8;i++){const x=-.32+i*.075,y=-.23-row*.065; if((x+.06)**2/.11+(y+.23)**2/.058<.9)ln([[x,y],[x-.03,y-.055]],row%2?'#bcaa8b':'#958067',.022);}
ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(.1,-.34);ctx.quadraticCurveTo(.24,-.34,.29,-.24);ctx.lineTo(.47,-.12);ctx.quadraticCurveTo(.25,-.04,.12,-.13);ctx.closePath();ctx.fill();
el(.46,-.13,.025,.022,dark);el(.16,-.3,.055,.055,c);eye(.29,-.23);
}else if(['horse','doe','fawn','pig','cow','camel'].includes(q)){
const pig=q==='pig',deer=q==='doe'||q==='fawn',camel=q==='camel',horse=q==='horse',cow=q==='cow';
const h=pig?.29:camel?.73:.58,body=pig?.35:.36;
const leg=(x,back)=>{const swing=stride*(back?-1:1),col=back?dark:c;ln([[x,-h+.08],[x+swing*.5,-h*.43],[x+swing,-.055]],col,pig?.09:deer?.045:.065);el(x+swing+.015,-.035,pig?.06:.045,.03,dark);};
leg(-.2,true);leg(.21,true);
if(pig){ctx.strokeStyle=c;ctx.lineWidth=.035;ctx.beginPath();ctx.arc(-.39,-.35,.06,0,Math.PI*1.7);ctx.stroke();}
else{ln([[-.31,-h],[-.43,-h+.18],[-.44,-h+.3]],horse?dark:c,horse?.065:.035);if(cow||camel)el(-.44,-h+.31,.04,.07,dark);}
el(0,-h,body,pig?.23:.2,c);
if(camel){el(-.16,-h-.13,.14,.22,c);el(.12,-h-.13,.14,.22,c);}
if(cow){el(-.19,-h-.04,.1,.11,dark);el(.08,-h+.03,.1,.1,dark);el(.06,-h+.2,.1,.055,'#e5a5a6');}
if(q==='fawn')for(let i=0;i<5;i++)el(-.2+i*.08,-h-.04+(i%2)*.07,.02,.025,cream);
leg(-.25,false);leg(.22,false);
const hy=pig?-h-.04:camel?-h-.47:-h-.3;
ln([[.24,-h],[camel?.35:.28,hy+.04]],c,pig?.19:horse?.19:.12);
if(horse)ln([[.15,-h],[.17,hy],[.26,hy-.1]],dark,.07);
const hx=camel?.4:.32;
el(hx,hy,pig?.19:.125,pig?.17:.14,c);
if(pig){tri([[.18,hy-.1],[.15,hy-.25],[.3,hy-.15]],c);tri([[.36,hy-.13],[.51,hy-.23],[.47,hy-.04]],c);el(.49,hy+.055,.115,.085,'#d87991');for(const x of [.46,.53])el(x,hy+.05,.015,.025,'#8c4358');}
else{
for(const x of [hx-.09,hx+.04]){ctx.save();ctx.translate(x,hy-.1);ctx.rotate(deer?-.5:-.2);el(0,-.07,deer?.045:.035,deer?.13:.095,c);el(0,-.07,.017,.06,'#c88c7c');ctx.restore();}
ctx.fillStyle=horse?'#bd916d':c;ctx.beginPath();ctx.moveTo(hx+.04,hy-.08);ctx.lineTo(hx+(horse?.26:.23),hy+.09);ctx.quadraticCurveTo(hx+.27,hy+.18,hx+.12,hy+.17);ctx.lineTo(hx-.01,hy+.04);ctx.fill();
if(cow){el(hx+.17,hy+.13,.11,.065,'#d4a49c');for(const x of [hx-.09,hx+.05])ln([[x,hy-.13],[x-.025,hy-.23]],cream,.035);}
else el(hx+.23,hy+.12,.025,.018,dark);
}
eye(hx+.045,hy-.025);
}else if(q==='frog'){
el(0,-.2,.25,.2,c);for(let d of [-1,1]){el(d*.22,-.09,.13,.08,c);el(d*.12,-.38,.1,.11,c);el(d*.12,-.4,.065,.07,cream);eye(d*.12,-.4);}ln([[-.13,-.22],[0,-.18],[.13,-.22]],dark,.015);
}else{
const tall=['doe','fawn','goat','cow','horse','camel'].includes(q),h=tall?.65:.35;
if(q==='squirrel')el(-.32,-.4,.16,.32,c);
else if(q==='fox'||q==='wolf'||q==='raccoon') {ln([[-.25,-h+.05],[-.46,-h-.05],[-.5,-h-.22]],c,.13);ln([[-.49,-h-.19],[-.5,-h-.25]],q==='raccoon'?dark:cream,.12);}
for(let x of [-.22,.2])ln([[x,-h],[x+stride,-.04]],dark,.065);
el(0,-h,.32,.19,c);
if(q==='hedgehog')for(let i=0;i<10;i++){let x=-.32+i*.055;tri([[x,-.33],[x-.04,-.55],[x+.1,-.35]],dark);}
if(q==='sheep')for(let i=0;i<9;i++)el(Math.sin(i*3)*.24,-h+Math.cos(i*3)*.09,.11,.1,c);
if(q==='camel'){el(-.12,-h-.16,.12,.15,c);el(.1,-h-.16,.12,.15,c);}
if(q==='cow')for(let i=0;i<3;i++)el(-.16+i*.14,-h-.04,.065,.075,dark);
if(q==='fawn'||q==='doe')for(let i=0;i<5;i++)el(-.2+i*.08,-h-.06+(i%2)*.08,.02,.025,cream);
for(let x of [-.2,.23])ln([[x,-h+.06],[x-stride,-.04]],c,.065);
const hy=-h-(tall?.23:.13);ln([[.22,-h],[.26,hy]],c,.14);el(.27,hy,.16,.16,c);
if(q==='bear'){el(.17,hy-.14,.07,.075,c);el(.36,hy-.14,.07,.075,c);}
else if(q==='pig'){tri([[.13,hy-.09],[.13,hy-.24],[.27,hy-.13]],c);tri([[.3,hy-.12],[.41,hy-.22],[.42,hy-.07]],c);}
else{tri([[.15,hy-.08],[.16,hy-.31],[.27,hy-.12]],c);tri([[.28,hy-.1],[.38,hy-.29],[.4,hy-.03]],c);}
if(q==='goat'||q==='cow')for(let x of [.16,.35])ln([[x,hy-.15],[x-.04,hy-.33]],'#bba982',.04);
if(q==='horse'){ln([[.16,hy-.14],[.1,hy],[.12,-h]],dark,.08);ln([[-.3,-h],[-.38,-h+.23]],dark,.06);}
if(q==='raccoon')el(.28,hy,.13,.06,dark);
el(.38,hy+.06,q==='pig'?.1:.12,.07,q==='pig'?'#e682a4':cream);
el(.46,hy+.03,.028,.026,dark);eye(.3,hy-.035);
if(q==='goat')tri([[.3,hy+.16],[.36,hy+.29],[.4,hy+.15]],cream);
}
if(def.evil){ln([[.18,-.53],[.3,-.49]],'#e66c84',.025);for(let d of [-1,1]){ctx.globalAlpha=.45;el(d*.29,-.02,.06,.025,'#b781e9');}ctx.globalAlpha=1;}
ctx.restore();
};
})(window.BK);
