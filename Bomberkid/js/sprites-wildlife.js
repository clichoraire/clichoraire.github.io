(function(BK){
BK.sprites.drawWildlife=function(ctx,type,o={}){
const def=BK.ENEMIES[type],a=def.wildlife,q=a.shape,t=o.t||0,s=(o.s||60)*a.scale,c=def.evil?'#78618d':a.color,dark='#55463f',cream='#fff0d2';
ctx.save();ctx.scale((o.flip?-1:1)*s,s);if(o.hurt>0&&Math.floor(t*30)%2)ctx.globalAlpha=.5;
const el=(x,y,rx,ry,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
const ln=(p,col,w=.04)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
const tri=(p,col)=>{ctx.fillStyle=col;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
const eye=(x,y)=>{el(x,y,.026,.032,def.evil?'#ff535f':'#263647');el(x+.007,y-.01,.008,.009,'#fff');};
const stride=o.state==='walk'?Math.sin(t*9)*.045:0;
if(['owl','bat','duck','peacock'].includes(q)){
 if(q==='peacock')for(let i=0;i<9;i++){let a0=-Math.PI+i*Math.PI/8,x=-.15+Math.cos(a0)*.38,y=-.25+Math.sin(a0)*.5;ln([[-.1,-.2],[x,y]],'#499e78',.1);el(x,y,.055,.075,'#dfbd62');el(x,y,.026,.038,'#3b75a7');}
 if(q==='bat'){for(let d of [-1,1])tri([[0,-.4],[d*.5,-.65+Math.sin(t*10)*.08],[d*.35,-.3],[d*.2,-.36],[d*.12,-.18]],c);el(0,-.3,.14,.2,c);tri([[-.12,-.5],[-.1,-.7],[0,-.5]],c);tri([[.12,-.5],[.1,-.7],[0,-.5]],c);eye(-.055,-.4);eye(.055,-.4);}
 else {for(let x of [-.12,.12])ln([[x,-.1],[x,-.02],[x+.07,-.02]],'#d2a148',.025);el(0,-.28,.23,.26,c);el(-.07,-.26,.13,.17,def.evil?dark:'#c9b78b');el(.1,-.5,.17,.16,c);if(q==='owl'){el(.02,-.5,.075,.09,cream);el(.17,-.5,.075,.09,cream);eye(.02,-.5);eye(.17,-.5);tri([[.08,-.44],[.13,-.44],[.1,-.38]],'#d2a148');}else{tri([[.24,-.51],[.4,-.47],[.23,-.43]],'#e8b348');eye(.16,-.54);}}
}else if(q==='turtle'){
for(let x of [-.25,.2])el(x,-.07,.1,.055,c);el(0,-.22,.3,.23,'#55764e');for(let i=0;i<5;i++)el((i%3-1)*.14,-.18-Math.floor(i/3)*.14,.065,.07,c);el(.32,-.16,.13,.09,c);eye(.36,-.18);
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
