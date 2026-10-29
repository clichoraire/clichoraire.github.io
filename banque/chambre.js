// La chambre forte : une pièce en acier dessinée sur canvas, qui se remplit de pièces d'or, de sacs, de lingots et de
// coffres à mesure que le total monte (jusqu'au million). Les nouvelles pièces tombent du plafond à l'ouverture.
(function(root){'use strict';
 const MAX=1000000,MAX_COINS=2000;
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h;};
 const rng=seed=>{let a=hash(seed)||1;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};};
 const gauss=r=>(r()+r()+r()-1.5)/1.5; // entre -1 et 1, concentré au centre
 const clamp=(v,lo,hi)=>v<lo?lo:v>hi?hi:v;
 const ease=t=>1-Math.pow(1-t,3);
 const bounce=t=>{t=clamp(t,0,1);if(t<.8)return ease(t/.8);const u=(t-.8)/.2;return 1-.06*Math.sin(u*Math.PI);};
 // Combien de pièces visibles pour un total donné : racine carrée, pour que les premières pièces se voient tout de suite.
 const coinsFor=total=>total<=0?0:Math.max(3,Math.min(MAX_COINS,Math.round(MAX_COINS*Math.sqrt(Math.min(total,MAX)/MAX))));
 const extrasFor=total=>({bags:Math.min(6,Math.floor(total/5000)),bars:Math.min(24,Math.floor(total/25000)),chests:Math.min(4,Math.floor(total/250000)),million:total>=MAX});

 function create(canvas){
  const ctx=canvas.getContext('2d');
  const S={total:0,seed:'',coins:[],extras:{bags:0,bars:0,chests:0,million:false},drop:0,revealAt:0,sparkles:[],W:0,H:0,dpr:1,room:null,animating:false,raf:0};

  function layout(){
   const r=canvas.getBoundingClientRect();S.dpr=Math.min(2,root.devicePixelRatio||1);S.W=Math.max(1,Math.round(r.width));S.H=Math.max(1,Math.round(r.height));
   canvas.width=Math.round(S.W*S.dpr);canvas.height=Math.round(S.H*S.dpr);ctx.setTransform(S.dpr,0,0,S.dpr,0,0);S.room=null;placeGold();
  }
  // Repères de la pièce : mur du fond entre backL et backR, sol en trapèze jusqu'en bas.
  const geo=()=>{const {W,H}=S;return {W,H,floorY:H*.6,backL:W*.17,backR:W*.83,vx:W/2,vy:H*.33};};
  // Un point du sol : z = 0 au fond, 1 devant. u = -1 à 1 de gauche à droite.
  const floorPt=(u,z)=>{const g=geo();const y=g.floorY+(g.H-g.floorY)*z;const halfBack=(g.backR-g.backL)/2,halfFront=g.W*.62;const half=halfBack+(halfFront-halfBack)*z;return {x:g.vx+u*half,y,scale:.55+.75*z};};

  function placeGold(){
   const total=S.total,n=coinsFor(total),r=rng(S.seed+'|'+n),g=geo(),unit=g.W/1000;
   const mounds=n<40?[{u:0,z:.55,w:1}]:n<150?[{u:-.35,z:.5,w:1},{u:.38,z:.62,w:.8}]:n<600?[{u:-.5,z:.45,w:.9},{u:.05,z:.6,w:1.2},{u:.55,z:.5,w:.9}]:[{u:-.62,z:.4,w:.8},{u:-.28,z:.62,w:1.1},{u:.08,z:.48,w:1.3},{u:.42,z:.66,w:1.1},{u:.68,z:.42,w:.8}];
   const totalW=mounds.reduce((a,m)=>a+m.w,0);const columns=mounds.map(()=>new Map());const coins=[];const shrink=1-.38*Math.sqrt(n/MAX_COINS); // pièces plus petites quand il y en a des centaines, pour que les piles restent sous le plafond
   for(let i=0;i<n;i++){
    let pick=r()*totalW,mi=0;for(;mi<mounds.length-1&&pick>mounds[mi].w;mi++)pick-=mounds[mi].w;
    const m=mounds[mi],spread=(.08+.26*Math.sqrt(n/MAX_COINS))*m.w;const u=m.u+gauss(r)*spread,z=m.z+gauss(r)*.1;
    const p=floorPt(u,z),cw=(13+12*p.scale)*unit*1.15*shrink,col=Math.round(p.x/(cw*.62));const key=col+':'+Math.round(z*6);
    const stack=columns[mi].get(key)||0;columns[mi].set(key,stack+1);
    coins.push({x:p.x+(r()-.5)*2*unit,y:p.y-stack*cw*.2,r:cw/2,z,shade:r(),order:i,tilt:(r()-.5)*.25});
   }
   coins.sort((a,b)=>a.z-b.z||a.y-b.y);
   S.coins=coins;S.extras=extrasFor(total);S.sparkles=[];
   for(let i=0;i<Math.min(40,8+n/40);i++)S.sparkles.push({c:coins.length?coins[Math.floor(r()*coins.length)]:null,phase:r()*6.28,speed:.8+r()*1.6,size:(3+r()*5)*unit});
  }

  // ---------- la pièce (mise en cache)
  function drawRoom(){
   const g=geo(),{W,H}=g,off=document.createElement('canvas');off.width=canvas.width;off.height=canvas.height;const c=off.getContext('2d');c.setTransform(S.dpr,0,0,S.dpr,0,0);
   // mur du fond
   let grad=c.createLinearGradient(0,0,0,g.floorY);grad.addColorStop(0,'#1b2026');grad.addColorStop(1,'#2c343d');c.fillStyle=grad;c.fillRect(g.backL,0,g.backR-g.backL,g.floorY);
   // murs de côté
   c.fillStyle='#161a1f';c.beginPath();c.moveTo(0,0);c.lineTo(g.backL,0);c.lineTo(g.backL,g.floorY);c.lineTo(0,H);c.closePath();c.fill();
   c.fillStyle='#121519';c.beginPath();c.moveTo(W,0);c.lineTo(g.backR,0);c.lineTo(g.backR,g.floorY);c.lineTo(W,H);c.closePath();c.fill();
   // plafond
   c.fillStyle='#0d1013';c.beginPath();c.moveTo(0,0);c.lineTo(W,0);c.lineTo(g.backR,0);c.lineTo(g.backL,0);c.closePath();c.fill();
   // coffrets de sûreté sur le mur du fond
   const cols=Math.max(6,Math.round((g.backR-g.backL)/(W*.055))),rows=Math.max(4,Math.round(g.floorY/(H*.11)));const cw=(g.backR-g.backL)/cols,ch=(g.floorY*.92)/rows;
   for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=g.backL+i*cw,y=g.floorY*.04+j*ch;const shade=.78+.22*Math.sin(i*1.7+j*.9);
    c.fillStyle=`rgb(${Math.round(70*shade)},${Math.round(80*shade)},${Math.round(92*shade)})`;c.fillRect(x+2,y+2,cw-4,ch-4);
    c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x+2,y+2,cw-4,2);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+2,y+ch-4,cw-4,2);
    c.fillStyle='#b9c2cc';c.beginPath();c.arc(x+cw*.5,y+ch*.52,Math.min(cw,ch)*.11,0,6.283);c.fill();c.fillStyle='#1a1e23';c.beginPath();c.arc(x+cw*.5,y+ch*.52,Math.min(cw,ch)*.045,0,6.283);c.fill();
    c.fillStyle='#d8b86a';c.fillRect(x+cw*.3,y+ch*.2,cw*.4,ch*.11);}
   // murs de côté : rayures de panneaux
   c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=2;for(let k=1;k<6;k++){c.beginPath();c.moveTo(g.backL*k/6,0);c.lineTo(g.backL+(0-g.backL)*(1-k/6),g.floorY+(H-g.floorY)*(1-k/6));c.stroke();c.beginPath();c.moveTo(W-g.backL*k/6,0);c.lineTo(g.backR+(W-g.backR)*(k/6),g.floorY+(H-g.floorY)*(k/6));c.stroke();}
   // sol
   grad=c.createLinearGradient(0,g.floorY,0,H);grad.addColorStop(0,'#2a2f36');grad.addColorStop(1,'#0f1216');c.fillStyle=grad;c.beginPath();c.moveTo(g.backL,g.floorY);c.lineTo(g.backR,g.floorY);c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fill();
   c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=1;for(let k=-8;k<=8;k++){const a=floorPt(k/8,0),b=floorPt(k/8,1);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
   for(let k=1;k<8;k++){const z=Math.pow(k/8,1.6),a=floorPt(-1,z),b=floorPt(1,z);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
   // lampe et cône de lumière
   grad=c.createRadialGradient(W/2,-H*.1,0,W/2,-H*.1,H*1.1);grad.addColorStop(0,'rgba(255,230,170,.35)');grad.addColorStop(.5,'rgba(255,220,150,.08)');grad.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=grad;c.fillRect(0,0,W,H);
   c.fillStyle='#d8b86a';c.beginPath();c.ellipse(W/2,0,W*.06,H*.02,0,0,Math.PI);c.fill();
   // vignette
   grad=c.createRadialGradient(W/2,H*.5,H*.2,W/2,H*.5,H*.95);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=grad;c.fillRect(0,0,W,H);
   S.room=off;
  }

  // ---------- les trésors
  function coin(c,x,y,r,shade,tilt){
   const ry=r*.42;c.save();c.translate(x,y);c.rotate(tilt||0);
   c.fillStyle=shade>.5?'#8a5a0c':'#7a4e0a';c.beginPath();c.ellipse(0,r*.16,r,ry,0,0,6.283);c.fill(); // tranche
   c.fillStyle=shade>.66?'#ffd75e':shade>.33?'#f4c53c':'#e8b52a';c.beginPath();c.ellipse(0,0,r,ry,0,0,6.283);c.fill(); // face
   c.strokeStyle='rgba(120,70,0,.55)';c.lineWidth=Math.max(1,r*.12);c.beginPath();c.ellipse(0,0,r*.62,ry*.62,0,0,6.283);c.stroke();
   c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(-r*.3,-ry*.35,r*.28,ry*.22,-.4,0,6.283);c.fill(); // reflet
   c.restore();
  }
  function bag(c,x,y,s){
   c.save();c.translate(x,y);
   c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,s*.05,s*.6,s*.14,0,0,6.283);c.fill();
   c.fillStyle='#8a5a2b';c.beginPath();c.moveTo(-s*.55,0);c.quadraticCurveTo(-s*.7,-s*.7,-s*.2,-s*.8);c.lineTo(s*.2,-s*.8);c.quadraticCurveTo(s*.7,-s*.7,s*.55,0);c.quadraticCurveTo(0,s*.15,-s*.55,0);c.fill();
   c.fillStyle='#a5713a';c.beginPath();c.ellipse(-s*.15,-s*.45,s*.2,s*.3,0,0,6.283);c.fill();
   c.fillStyle='#6b4220';c.fillRect(-s*.25,-s*.9,s*.5,s*.14);c.fillStyle='#f4c53c';c.beginPath();c.ellipse(-s*.28,-s*.98,s*.12,s*.08,0,0,6.283);c.ellipse(0,-s*1,s*.12,s*.08,0,0,6.283);c.ellipse(s*.26,-s*.97,s*.12,s*.08,0,0,6.283);c.fill();
   c.fillStyle='#ffe28a';c.font=`bold ${s*.5}px Cinzel,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('$',0,-s*.3);
   c.restore();
  }
  function bar(c,x,y,s){
   c.save();c.translate(x,y);
   c.fillStyle='#b8860b';c.beginPath();c.moveTo(-s*.5,0);c.lineTo(s*.5,0);c.lineTo(s*.4,-s*.28);c.lineTo(-s*.4,-s*.28);c.closePath();c.fill();
   c.fillStyle='#ffd75e';c.beginPath();c.moveTo(-s*.4,-s*.28);c.lineTo(s*.4,-s*.28);c.lineTo(s*.32,-s*.42);c.lineTo(-s*.32,-s*.42);c.closePath();c.fill();
   c.fillStyle='#e8b52a';c.beginPath();c.moveTo(s*.5,0);c.lineTo(s*.4,-s*.28);c.lineTo(s*.32,-s*.42);c.lineTo(s*.42,-s*.14);c.closePath();c.fill();
   c.fillStyle='rgba(255,255,255,.5)';c.fillRect(-s*.3,-s*.4,s*.25,s*.04);
   c.restore();
  }
  function chest(c,x,y,s,open){
   c.save();c.translate(x,y);
   c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(0,s*.05,s*.75,s*.16,0,0,6.283);c.fill();
   c.fillStyle='#6b3f1d';c.fillRect(-s*.6,-s*.55,s*1.2,s*.55);c.fillStyle='#8a5a2b';c.fillRect(-s*.6,-s*.55,s*1.2,s*.08);
   c.fillStyle='#f4c53c';c.fillRect(-s*.6,-s*.3,s*1.2,s*.06);c.fillRect(-s*.45,-s*.55,s*.08,s*.55);c.fillRect(s*.37,-s*.55,s*.08,s*.55);
   if(open){c.fillStyle='#ffd75e';c.beginPath();c.ellipse(0,-s*.55,s*.55,s*.14,0,0,6.283);c.fill();for(let i=-2;i<=2;i++)coin(c,i*s*.2,-s*.62-Math.abs(i)*s*.02,s*.12,.8,0);
    c.fillStyle='#8a5a2b';c.beginPath();c.moveTo(-s*.62,-s*.55);c.lineTo(s*.62,-s*.55);c.lineTo(s*.5,-s*1.05);c.lineTo(-s*.5,-s*1.05);c.closePath();c.fill();c.fillStyle='#f4c53c';c.fillRect(-s*.1,-s*1.02,s*.2,s*.42);}
   else{c.fillStyle='#8a5a2b';c.beginPath();c.moveTo(-s*.62,-s*.55);c.lineTo(s*.62,-s*.55);c.lineTo(s*.62,-s*.7);c.quadraticCurveTo(0,-s*1,-s*.62,-s*.7);c.closePath();c.fill();c.fillStyle='#f4c53c';c.fillRect(-s*.08,-s*.6,s*.16,s*.18);}
   c.restore();
  }
  function crown(c,x,y,s){
   c.save();c.translate(x,y);
   const grad=c.createRadialGradient(0,-s*.5,0,0,-s*.5,s*1.6);grad.addColorStop(0,'rgba(255,230,140,.6)');grad.addColorStop(1,'rgba(255,230,140,0)');c.fillStyle=grad;c.fillRect(-s*2,-s*2.2,s*4,s*3);
   c.fillStyle='#ffd75e';c.beginPath();c.moveTo(-s*.7,0);c.lineTo(-s*.8,-s*.8);c.lineTo(-s*.4,-s*.45);c.lineTo(0,-s*1.1);c.lineTo(s*.4,-s*.45);c.lineTo(s*.8,-s*.8);c.lineTo(s*.7,0);c.closePath();c.fill();
   c.fillStyle='#b8860b';c.fillRect(-s*.7,-s*.18,s*1.4,s*.18);
   c.fillStyle='#e0333f';c.beginPath();c.arc(0,-s*.3,s*.1,0,6.283);c.fill();c.fillStyle='#3a8bff';c.beginPath();c.arc(-s*.42,-s*.3,s*.07,0,6.283);c.arc(s*.42,-s*.3,s*.07,0,6.283);c.fill();
   c.restore();
  }
  function sparkle(c,x,y,s,a){
   c.save();c.translate(x,y);c.globalAlpha=a;c.fillStyle='#fff8d6';c.beginPath();c.moveTo(0,-s);c.quadraticCurveTo(0,0,s,0);c.quadraticCurveTo(0,0,0,s);c.quadraticCurveTo(0,0,-s,0);c.quadraticCurveTo(0,0,0,-s);c.fill();c.restore();
  }

  function draw(now){
   if(!S.room)drawRoom();
   const {W,H}=S,g=geo(),unit=W/1000;ctx.clearRect(0,0,W,H);ctx.drawImage(S.room,0,0,W,H);
   const t=now-S.revealAt,n=S.coins.length,firstNew=clamp(S.drop,0,n),newCount=n-firstNew;
   // lueur chaude sous les trésors
   if(n){const a=clamp(.12+.5*Math.sqrt(S.total/MAX),0,.6);const grad=ctx.createRadialGradient(W/2,H*.78,0,W/2,H*.78,W*.5);grad.addColorStop(0,`rgba(255,200,80,${a})`);grad.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=grad;ctx.fillRect(0,g.floorY,W,H-g.floorY);}
   // extras au fond : coffres, lingots, sacs
   const e=S.extras;
   for(let i=0;i<e.chests;i++){const side=i%2?1:-1,p=floorPt(side*(.92-(i>>1)*.1),.3+(i>>1)*.3);chest(ctx,p.x,p.y,40*unit*p.scale,true);}
   for(let i=0;i<e.bars;i++){const row=Math.floor(i/8),k=i%8,p=floorPt(.46+k*.07+row*.035,.9-row*.015);bar(ctx,p.x,p.y-row*10*unit*p.scale,36*unit*p.scale);}
   for(let i=0;i<e.bags;i++){const p=floorPt(-.95+(i%3)*.16,.95-(i>2?.14:0)-(i%3)*.04);bag(ctx,p.x,p.y,32*unit*p.scale);}
   // les pièces, les nouvelles tombent en cascade (jusqu'à 2,6 s)
   let falling=false;
   for(const k of S.coins){
    let y=k.y,x=k.x;
    if(k.order>=firstNew&&S.revealAt){const delay=newCount>1?(k.order-firstNew)/(newCount-1)*1900:0,u=(t-delay)/700;
     if(u<0){continue;}if(u<1){falling=true;const b=bounce(u);y=-30+(k.y+30)*b;x=k.x+(1-b)*(k.shade-.5)*30*unit;}}
    else if(S.revealAt&&t<0)continue;
    coin(ctx,x,y,k.r,k.shade,k.tilt);
   }
   // scintillements
   if(n&&t>400){for(const s of S.sparkles){if(!s.c)continue;const a=Math.max(0,Math.sin(now/1000*s.speed+s.phase));if(a>.2)sparkle(ctx,s.c.x+s.c.r*.3,s.c.y-s.c.r*.2,s.size*a,a*.9);}}
   if(e.million&&t>400&&n){let top=S.coins[0];for(const k of S.coins)if(k.y<top.y)top=k;crown(ctx,top.x,top.y-top.r*.4,36*unit);}
   return falling||(n>0);
  }

  function loop(now){S.raf=0;const again=draw(now);if(again&&S.animating&&!document.hidden)S.raf=requestAnimationFrame(loop);else S.raf=0;}
  function kick(){if(!S.raf&&S.animating)S.raf=requestAnimationFrame(loop);}

  const api={
   set(total,seed,previous){S.total=Math.max(0,Math.floor(total||0));S.seed=String(seed||'');S.drop=coinsFor(Math.max(0,previous==null?total:Math.min(previous,total)));if(previous==null||previous>=total)S.drop=coinsFor(total);layout();S.revealAt=0;S.animating=false;if(S.raf)cancelAnimationFrame(S.raf);S.raf=0;draw(performance.now());},
   reveal(){S.revealAt=performance.now()+150;S.animating=true;kick();},
   stop(){S.animating=false;if(S.raf)cancelAnimationFrame(S.raf);S.raf=0;},
   resize(){layout();draw(performance.now());kick();},
   coinsFor,extrasFor,MAX,
  };
  root.addEventListener('resize',()=>api.resize());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick();});
  return api;
 }
 root.Chambre={create,coinsFor,extrasFor,MAX};
})(window);
