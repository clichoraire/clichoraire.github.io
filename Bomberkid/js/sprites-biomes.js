// Dessins vectoriels des quatre collections : géométrie commune, silhouettes propres.
(function(BK){
BK.sprites.drawBiomeDeco=function(ctx,kind,k,t=0,mounted=false){
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
if(!mounted)oval(0,.015,.4,.10,'rgba(25,20,45,.18)');
if(g==='enchanted')switch(n){
case 0:line([[0,0],[0,-.95]],wood,.16);for(const [x,y] of [[-.22,-.7],[.23,-.8],[0,-1.1]])gem(x,y,.23,blue);break;
case 1:rect(-.25,-.6,.5,.6,'#f5deb1');oval(0,-.62,.47,.22,'#be63c6');for(const x of [-.25,0,.25])oval(x,-.66,.06,.04,'#fff1cc');rect(-.08,-.32,.16,.32,wood);oval(.15,-.42,.07,.07,blue);break;
case 2:oval(0,-.45,.3,.48,wood);oval(0,-.43,.23,.39,'#a879d4');oval(.12,-.35,.03,.03,gold);for(const x of [-.3,.3])flower(x,-.35,pink);break;
case 3:for(let i=0;i<7;i++)flower((i%3-1)*.22,-.15-Math.floor(i/3)*.13, i%2?blue:pink);break;
case 4:poly([[-.4,0],[-.3,-.45],[0,-.65],[.35,-.4],[.42,0]],stone);line([[-.12,-.38],[0,-.52],[.13,-.38],[0,-.25],[0,-.1]],blue,.04);break;
case 5:for(let i=0;i<8;i++){let a=i*Math.PI/4,x=Math.cos(a)*.35,y=Math.sin(a)*.14-.08;rect(x-.025,y-.12,.05,.12,'#f2dfbd');oval(x,y-.13,.09,.055,pink);}break;
case 6:rug('#b78ce2');oval(0,-.06,.32,.10,blue);flower(.28,-.15,pink);break;
case 7:rect(-.2,-.55,.4,.5,'#86cdd4');rect(-.22,-.61,.44,.09,gold);for(let i=0;i<6;i++)oval(Math.sin(t+i*3)*.14,-.13-i*.06,.022,.022,'#ffffa6');break;
case 8:line([[0,0],[0,-.8]],wood,.07);for(let i=0;i<3;i++){let x=(i-1)*.21,y=-.5-i*.13;line([[0,-.5],[x,y]],wood);oval(x-.07,y,.08,.05,pink);oval(x+.07,y,.08,.05,blue);}break;
case 9:arch(wood);for(let i=0;i<7;i++)leaf(-.34+i*.11,-.7-Math.sin(i*.5)*.24,.6,.23);break;
case 10:for(let i=0;i<4;i++){let x=-.3+i*.2;line([[x,-.95],[x+.05,-.6],[x-.04,-.2]],green,.04);flower(x,-.4-i%2*.2,pink);}break;
case 11:oval(0,-.28,.4,.3,'#497888');for(let i=0;i<5;i++)gem((i-2)*.13,-.25-(i%2)*.2,.05,gold);break;
case 12:for(let i=0;i<9;i++)leaf(0,0,(i-4)*.24,.6+Math.sin(i)*.15);break;
case 13:oval(0,-.25,.38,.27,green);for(let i=0;i<9;i++)oval(Math.sin(i*4)*.27,-.12-i*.04,.045,.04,'#8b4cb0');break;
case 14:oval(0,-.35,.25,.33,gold);oval(0,-.59,.29,.12,wood);line([[0,-.67],[.06,-.8]],wood,.06);gem(0,-.3,.08,blue);break;
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
if(g==='crypt')switch(n){
case 0:poly([[-.34,0],[-.28,-.85],[.28,-.85],[.34,0]],stone);oval(0,-.65,.15,.17,gold);line([[0,-.47],[0,-.1]],gold,.07);line([[-.14,-.38],[.14,-.38]],gold,.05);break;
case 1:poly([[-.2,0],[-.35,-.65],[-.2,-.9],[.2,-.9],[.35,-.65],[.2,0]],wood);line([[0,-.7],[0,-.2]],gold,.05);line([[-.15,-.52],[.15,-.52]],gold,.05);break;
case 2:rect(-.4,-.2,.8,.28,stone);for(let i=0;i<3;i++)line([[-.18,-.15+i*.07],[.18,-.15+i*.07]],ink,.015);break;
case 3:poly([[-.25,0],[-.25,-.75],[0,-1],[.25,-.75],[.25,0]],stone);for(let i=0;i<3;i++)line([[-.1,-.65+i*.2],[.1,-.55+i*.2],[-.05,-.45+i*.2]],blue);break;
case 4:rect(-.3,-.35,.6,.3,'#63507b');for(let x of [-.15,.15])line([[x,-.36],[x,-.05]],stone,.045);gem(0,-.2,.07,blue);break;
case 5:pot(0,0,.65,stone);oval(0,-.61,.22,.06,gold);oval(0,-.68,.06,.07,gold);break;
case 6:skull(0,-.16,.2);rect(-.045,-.53,.09,.25,'#ded0a9');oval(0,-.59,.045,.085,blue);break;
case 7:arch(stone);for(let i=0;i<3;i++)skull((i-1)*.25,-.8-Math.sin(i)*.15,.12);break;
case 8:rect(-.17,-.9,.34,.85,stone);rect(-.26,-1,.52,.13,'#b4b1c6');rect(-.28,-.1,.56,.1,'#b4b1c6');line([[.02,-.9],[-.06,-.6],[.07,-.5],[-.05,-.2]],ink);break;
case 9:poly([[-.25,0],[-.25,-.4],[-.1,-.55],[0,-.32],[.13,-.5],[.25,-.4],[.25,0]],stone);poly([[.25,-.1],[.33,-.27],[.46,-.13]],stone);break;
case 10:pot(0,0,.65,'#84769e');for(let i=0;i<3;i++)flower((i-1)*.13,-.8,'#b8a4c4');break;
case 11:oval(0,-.08,.36,.15,'#d6ccd9');for(let i=0;i<4;i++){let x=(i-1.5)*.14;oval(x,-.15,.05,.04,ink);for(let d of [-1,1])line([[x,-.15],[x+d*.09,-.22],[x+d*.12,-.12]],ink,.012);}break;
case 12:rug('#657c78');for(let i=0;i<8;i++){let a=i*Math.PI/4;flower(Math.cos(a)*.3,-.07+Math.sin(a)*.12,'#c5b2d9');}break;
case 13:rect(-.38,-.95,.76,.9,ink);rect(-.28,-.83,.56,.7,stone);for(let i=0;i<3;i++)line([[-.25,-.7+i*.2],[.25,-.7+i*.2]],ink);break;
case 14:oval(0,-.55,.33,.46,stone);oval(0,-.55,.26,.38,'#655282');line([[-.1,-.85],[.1,-.6],[-.03,-.45],[.15,-.25]],blue);break;
case 15:rect(-.22,-.12,.44,.12,stone);oval(0,-.5+Math.sin(t*2)*.03,.23,.23,'#8ce4cc');oval(-.07,-.55,.035,.05,ink);oval(.07,-.55,.035,.05,ink);break;
case 16:rect(-.18,-.6,.36,.5,ink);rect(-.12,-.54,.24,.36,blue);line([[-.1,-.6],[-.1,-.8],[.1,-.8],[.1,-.6]],stone,.04);break;
case 17:rect(-.32,-.36,.64,.36,stone);rect(-.43,-.45,.86,.12,'#b8b3c6');pot(0,-.47,.25,gold);for(let x of [-.3,.3])oval(x,-.5,.06,.04,blue);break;
case 18:rect(-.4,-.3,.8,.12,stone);for(let x of [-.3,.2])rect(x,-.18,.1,.18,stone);break;
case 19:oval(0,-.15,.4,.2,stone);oval(0,-.2,.3,.13,ink);for(let i=0;i<4;i++)oval(Math.sin(t+i)*.13,-.25-i*.12,.2-i*.025,.07,'rgba(158,220,206,.45)');break;
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
