// Distinct material silhouettes; visual radius does not change collision rules.
(function(B){
 const S=B.sprites,TAU=Math.PI*2;
 S.drawElementProjectile=function(c,x,y,r,o){
  const e=o.element,t=o.t||0,moving=o.moving!==false&&Math.hypot(o.vx||0,o.vy||0)>20;
  c.save();c.globalAlpha=o.alpha??1;
  const colors={ice:'#79e9ff',fire:'#ff7226',electric:'#93bcff',earth:'#a38b70'};
  if(moving)for(let i=0;i<(o.trail||[]).length;i++){const q=o.trail[i],k=(i+1)/o.trail.length;c.globalAlpha=(o.alpha??1)*k*.25;c.fillStyle=colors[e];c.beginPath();c.arc(q.x,q.y-q.z,r*k*.7,0,TAU);c.fill();}
  c.globalAlpha=o.alpha??1;c.translate(x,y);c.rotate(Math.atan2(o.vy||0,o.vx||1));c.scale(r,r);c.lineJoin='round';c.lineCap='round';
  const path=pts=>{c.beginPath();pts.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();};
  if(e==='fire'){
   c.shadowColor='#ff6c19';c.shadowBlur=18;
   if(moving){for(let layer=0;layer<3;layer++){const len=5.8-layer*1.3,wide=1.2-layer*.23;c.fillStyle=['#e83b13','#ff971c','#fff095'][layer];c.beginPath();c.moveTo(.45,-wide);c.bezierCurveTo(-1.5,-1.6,-2.1,-.3,-len,.2*Math.sin(t*21+layer));c.lineTo(-len*.67,.45+Math.sin(t*25)*.18);c.lineTo(-len*.87,.86);c.quadraticCurveTo(-1.4,1.3,.4,wide);c.closePath();c.fill();}}
   const g=c.createRadialGradient(.15,-.15,.1,0,0,1.15);g.addColorStop(0,'#fffde0');g.addColorStop(.35,'#ffe251');g.addColorStop(.7,'#ff9a19');g.addColorStop(1,'#df3010');c.fillStyle=g;c.beginPath();c.arc(0,0,1.12,0,TAU);c.fill();
   if(moving){c.shadowBlur=0;for(let i=0;i<8;i++){const phase=(t*2+i*.13)%1;c.globalAlpha=1-phase;c.fillStyle=i%2?'#ffdb57':'#ff6a20';c.beginPath();c.arc(-1-phase*6,Math.sin(i*4+phase*3)*(.5+phase),.05+(1-phase)*.09,0,TAU);c.fill();}}
  }else if(e==='ice'){
   c.shadowColor='#81eaff';c.shadowBlur=12;const pts=[[1.25,0],[.55,-.95],[-.55,-1.05],[-1.05,-.4],[-.85,.7],[.25,1.1]];path(pts);const g=c.createLinearGradient(-.6,-1,.6,1);g.addColorStop(0,'#f0ffff');g.addColorStop(.45,'#80e6ff');g.addColorStop(1,'#217bc4');c.fillStyle=g;c.fill();c.strokeStyle='#d9ffff';c.lineWidth=.09;c.stroke();c.shadowBlur=0;
   for(let i=0;i<pts.length;i++){path([[-.05,-.1],pts[i],pts[(i+1)%pts.length]]);c.fillStyle=['#ffffff66','#d4ffff99','#318dc766','#0c5f9c44','#b2ffff55','#ffffff88'][i];c.fill();c.strokeStyle='#f0ffff80';c.lineWidth=.035;c.stroke();}
   if(moving)for(let i=0;i<5;i++){const phase=(t*1.7+i*.2)%1;c.globalAlpha=1-phase;const a=-1.2-phase*3.4,b=Math.sin(i*3)*phase*1.6;path([[a,b-.17],[a+.12,b],[a,b+.17],[a-.12,b]]);c.fillStyle='#d1faff';c.fill();}
  }else if(e==='electric'){
   c.shadowColor='#57aaff';c.shadowBlur=20;const g=c.createRadialGradient(0,0,.1,0,0,1.05);g.addColorStop(0,'#ffffff');g.addColorStop(.4,'#c3f7ff');g.addColorStop(.75,'#4696ff');g.addColorStop(1,'#3721ab');c.fillStyle=g;c.beginPath();c.arc(0,0,1.05,0,TAU);c.fill();
   for(let i=0;i<7;i++){const a=i*TAU/7+t*1.5;c.save();c.rotate(a);c.beginPath();c.moveTo(.6,0);c.lineTo(1.2,.17);c.lineTo(1.05,-.18);c.lineTo(1.65+Math.sin(t*24+i)*.22,.08);c.strokeStyle=i%2?'#fff28a':'#a7f9ff';c.lineWidth=.09;c.stroke();c.restore();}
   if(moving)for(const side of [-1,1]){c.beginPath();c.moveTo(-.8,side*.3);for(let i=1;i<9;i++)c.lineTo(-.8-i*.5,side*.3+Math.sin(i*2+t*26)*.3);c.strokeStyle=side<0?'#fff48d':'#75ddff';c.lineWidth=.08;c.stroke();}
  }else if(e==='earth'){
   c.rotate(t*2);path([[1.35,-.35],[.7,-1.2],[-.45,-1.3],[-1.3,-.55],[-1.15,.65],[-.35,1.3],[.9,1.05],[1.4,.3]]);const g=c.createLinearGradient(-1,-1,1,1);g.addColorStop(0,'#d8b991');g.addColorStop(.45,'#8d7762');g.addColorStop(1,'#403d3b');c.fillStyle=g;c.fill();c.strokeStyle='#302d29';c.lineWidth=.13;c.stroke();
   path([[-1.3,-.55],[-.45,-1.3],[.7,-1.2],[.25,-.35],[-.6,.1]]);c.fillStyle='#d1b293';c.fill();path([[.25,-.35],[.7,-1.2],[1.35,-.35],[1.4,.3],[.4,.65]]);c.fillStyle='#6e6155';c.fill();
   c.strokeStyle='#3d352f';c.lineWidth=.09;c.beginPath();c.moveTo(-.65,-.65);c.lineTo(-.1,-.2);c.lineTo(-.35,.4);c.lineTo(.2,.9);c.moveTo(-.1,-.2);c.lineTo(.55,-.1);c.stroke();for(let i=0;i<5;i++){c.fillStyle='#302d2944';c.beginPath();c.ellipse(Math.sin(i*4)*.8,Math.cos(i*3)*.8,.12,.08,i,0,TAU);c.fill();}
  }
  c.restore();
 };
})(window.BC);
