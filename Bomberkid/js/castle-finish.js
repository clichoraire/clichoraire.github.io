// Finition architecturale : dalles de pierre, tapis brodés et ponts-levis ferrés.
(function(BK){
'use strict';
BK.THEMES.castleHall.castleFloor='hall';
BK.THEMES.castleCrypt.castleFloor='crypt';
BK.THEMES.castle.castleFloor='court';
const W=BK.World.prototype,details=W.drawFloorDetails;
W.drawCastleFloor=function(ctx,cam,c,r,z,time){
 const t=this.tAt(c,r),style=this.theme.castleFloor,pr=this.props[c+','+r],D=BK.draw3d;
 const p=[[c,r],[c+1,r],[c+1,r+1],[c,r+1]].map(([x,y])=>cam.project(x,y,z+.006));
 const quad=(u,v,uu,vv,color,stroke)=>D.quad(ctx,[[u,v],[uu,v],[uu,vv],[u,vv]].map(([x,y])=>D.onQuad(p,x,y)),color,stroke);
 const line=(u,v,uu,vv,color,width=1)=>{const a=D.onQuad(p,u,v),b=D.onQuad(p,uu,vv);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 ctx.save();
 if(style&&[0,7,11].includes(t)&&!(style==='court'&&t===7)){
  // Tons voisins : la salle ne ressemble plus à un damier noir et blanc.
  const colors=style==='crypt'?['#666d7b','#707787','#626b79','#77808b']:style==='court'?['#a6a5aa','#9699a2','#b0adb0','#a19da5']:['#b6adbb','#c6bdc7','#bfb7c2','#aca5b4'];
  quad(0,0,1,1,style==='crypt'?'#404854':'#777080');
  const color=colors[(c*13+r*7)%4];
  quad(.025,.035,.975,.965,color);
  line(.04,.04,.96,.04,'rgba(255,255,255,.28)');line(.96,.05,.96,.94,'rgba(36,31,49,.22)');
  // Veines courtes et joints décalés.
  if((c+r)%3===0){line(.18,.22,.43,.35,'rgba(60,54,72,.12)');line(.43,.35,.55,.31,'rgba(60,54,72,.12)');}
  if(t===11&&style==='hall'&&c%3===0&&r%3===0){
   D.quad(ctx,[[.5,.28],[.72,.5],[.5,.72],[.28,.5]].map(([u,v])=>D.onQuad(p,u,v)),'#777084','#ded0a7');
  }
  if(style==='hall'&&[[-1,0],[1,0],[0,-1],[0,1]].some(([x,y])=>this.tAt(c+x,r+y)===12))quad(.09,.09,.91,.91,null,'#c8b784');
 }
 if(style&&t===12){
  quad(0,0,1,1,'#6e294c');quad(.035,.035,.965,.965,'#873655');
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(this.tAt(c+dx,r+dy)!==12){
   if(dx)for(const a of [.08,.15])line(dx<0?a:1-a,0,dx<0?a:1-a,1,'#d9b968',a===.08?2:1);
   if(dy)for(const a of [.08,.15])line(0,dy<0?a:1-a,1,dy<0?a:1-a,'#d9b968',a===.08?2:1);
  }
  if(r%3===0&&this.tAt(c-1,r)===12&&this.tAt(c+1,r)===12){
   D.quad(ctx,[[.5,.2],[.67,.5],[.5,.8],[.33,.5]].map(([u,v])=>D.onQuad(p,u,v)),null,'#d1ad60');
  }
 }
 if(pr?.castleBridge){
  quad(0,0,1,1,'#563e32');
  for(let n=0;n<4;n++){quad(.012,n/4+.025,.988,(n+1)/4-.025,(c+r+n)%2?'#ad8051':'#986c43');line(.1,n/4+.08,.87,n/4+.09,'rgba(232,194,133,.35)');}
  // Deux bandes ferrées longitudinales, rivets dorés sur chaque planche.
  for(const u of [...(this.props[(c-1)+','+r]?.castleBridge?[]:[.13]),...(this.props[(c+1)+','+r]?.castleBridge?[]:[.84])]){quad(u,0,u+.065,1,'#4e5565');for(const v of [.12,.62]){const a=D.onQuad(p,u+.033,v);ctx.fillStyle='#d3bc80';ctx.beginPath();ctx.arc(a.x,a.y,Math.max(1,cam.scaleAt(c,r)*.022),0,Math.PI*2);ctx.fill();}}
 }
 ctx.restore();
};
W.drawFloorDetails=function(ctx,cam,c,r,z,time){this.drawCastleFloor(ctx,cam,c,r,z,time);details.call(this,ctx,cam,c,r,z,time);};
BK.THEMES.castleHall.cliff='#776d84';BK.THEMES.castleHall.cliffDark='#52495f';
const render=W.renderArenaEffects;
W.renderArenaEffects=function(ctx,cam,time,push){
 render.call(this,ctx,cam,time,push);
 for(const [key,pr] of Object.entries(this.props))if(pr.drawbridgeAnchor){
  const [c,r]=key.split(',').map(Number),{width,depth}=pr.drawbridgeAnchor;
  for(const x of [c+.02,c+width-.02]){
   // Chaînes latérales tendues entre les piliers du château et le tablier.
   push(r+depth-.03,x,()=>{
    const a=cam.project(x,r-.55,2.1),b=cam.project(x,r+depth-.12,.16);
    ctx.save();ctx.lineCap='round';ctx.strokeStyle='#343b4e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#d0c7a8';ctx.lineWidth=1.5;ctx.stroke();
    const count=20;for(let n=0;n<=count;n++){const u=n/count;ctx.save();ctx.translate(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));ctx.strokeStyle=n%2?'#778398':'#c4c4b7';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,4,2.2,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
    ctx.restore();
   });
  }
 }
};
})(window.BK);
