// Cérémonie : famille réunie, applaudissements et confettis déterministes.
(function(SK){
 'use strict';
 const P=SK.Podium={},R=SK.Render,TAU=Math.PI*2;
 function rounded(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
 function fan(c,r,x,y,s,t){
  const d=r.def,skin=d.colors.skin;
  s*=SK.characterScale(d.id);c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='#15354a20';c.beginPath();c.ellipse(0,.05,.5,.14,0,0,TAU);c.fill();
  c.lineCap='round';c.lineJoin='round';
  for(const sign of [-1,1]){c.strokeStyle=d.colors.pants;c.lineWidth=.19;c.beginPath();c.moveTo(sign*.17,-1);c.lineTo(sign*.18,-.16);c.stroke();rounded(c,sign*.18-.13,-.2,.27,.22,.06,'#233a4a');}
  SK.drawJacket(c,r.look?.jacket||d.colors.jacket,0,-1.29,.49,'front',true);
  const gap=.045+.23*(.5+.5*Math.sin(t*10));
  for(const sign of [-1,1]){c.strokeStyle=r.look?.jacket||d.colors.jacket;c.lineWidth=.19;c.beginPath();c.moveTo(sign*.29,-1.61);c.lineTo(sign*.41,-1.30);c.lineTo(sign*gap,-1.40);c.stroke();c.fillStyle=skin;c.beginPath();c.ellipse(sign*gap,-1.40,.10,.13,sign*.3,0,TAU);c.fill();}
  if(window.FamilyHeads?.has(d.id))window.FamilyHeads.draw(c,d.id,'front',-.48,-2.40,.96,.99);
  else R.drawFace(c,r,0,-1.98,.42);
  c.restore();
 }
 P.draw=(c,winners,crowd,t)=>{
  const sky=c.createLinearGradient(0,0,0,480);sky.addColorStop(0,'#247cae');sky.addColorStop(.65,'#c7f2ff');sky.addColorStop(1,'#f5fcff');c.fillStyle=sky;c.fillRect(0,0,960,480);
  for(const [x,y,w]of [[30,160,230],[235,210,250],[640,175,330],[900,210,250]]){c.fillStyle='#7fb8cf';c.beginPath();c.moveTo(x-w/2,330);c.lineTo(x,y);c.lineTo(x+w/2,330);c.fill();c.fillStyle='#f2fcff';c.beginPath();c.moveTo(x,y);c.lineTo(x-35,y+50);c.lineTo(x,y+38);c.lineTo(x+42,y+55);c.fill();}
  c.fillStyle='#edfaff';c.beginPath();c.ellipse(480,470,700,180,0,0,TAU);c.fill();
  // Les guirlandes restent derrière les visages et le titre.
  c.strokeStyle='#f5f6d6';c.lineWidth=2;c.beginPath();c.moveTo(0,65);c.quadraticCurveTo(480,170,960,65);c.stroke();
  for(let i=0;i<24;i++){const x=i*42,y=65+95*(1-Math.pow((x-480)/480,2))*.5;c.fillStyle=['#ffca48','#ee6d8c','#66d2c9'][i%3];c.beginPath();c.moveTo(x,y);c.lineTo(x+23,y+3);c.lineTo(x+10,y+26);c.fill();}
  rounded(c,205,16,550,61,22,'#143c60');c.strokeStyle='#ffe193';c.lineWidth=2;c.stroke();c.textAlign='center';c.fillStyle='#ffe193';c.font='bold 30px "Trebuchet MS",sans-serif';c.fillText('🏆 BRAVO, CHAMPION !',480,57);
  crowd.forEach((r,i)=>{const side=i%2,slot=Math.floor(i/2),row=Math.floor(slot/3),col=slot%3;fan(c,r,side?755+col*68:67+col*68,337+row*65,30+row*5,t+i*.47);});
  for(const [rank,x,top,color] of [[1,345,310,'#c8dce7'],[2,615,335,'#d59b72'],[0,480,270,'#ffd05c']]){
   const r=winners[rank];if(!r)continue;
   rounded(c,x-66,top+8,140,440-top,8,'#173c4b30');
   const grad=c.createLinearGradient(x-65,top,x+65,440);grad.addColorStop(0,color);grad.addColorStop(1,rank===0?'#dca12a':rank===1?'#8daabd':'#a56844');
   rounded(c,x-65,top,130,432-top,8,grad);rounded(c,x-65,top,130,10,5,'#ffffff77');
   R.drawWalker(c,r,x,top,46,t,'down',false);
   c.textAlign='center';c.fillStyle='#244056';c.font='900 43px "Trebuchet MS",sans-serif';c.fillText(String(rank+1),x,top+58);
   rounded(c,x-61,442,122,28,12,'#173d5e');c.fillStyle='#fff';c.font='bold 18px sans-serif';c.fillText(r.def.name,x,462,112);
  }
  // Vitesses, tailles et rotations variées : aucun alignement en diagonale.
  for(let i=0;i<95;i++){
   const seed=Math.sin(i*127.1+31.7)*43758.5453,rnd=seed-Math.floor(seed),speed=35+(i*17%55),y=((rnd*650+t*speed)%600)-70,x=((i*137.508+t*(i%2?8:-8)+Math.sin(t*1.7+i)*17)%1000+1000)%1000-20;
   if(y<82&&x>190&&x<770)continue;
   c.save();c.translate(x,y);c.rotate(t*(i%2?1:-1)*(1+rnd)+i);c.scale(Math.max(.18,Math.abs(Math.cos(t*3+i))),1);c.fillStyle=['#ffcb46','#f5769b','#4bb9dc','#b388eb','#73d8af'][i%5];
   if(i%4===0){c.beginPath();c.arc(0,0,2+rnd*2,0,TAU);c.fill();}else c.fillRect(-2,-4,3+rnd*3,5+rnd*5);c.restore();
  }
 };
 P.start=(canvas,rows,lookFor)=>{
  const token={};canvas.celebration=token;canvas.width=960;canvas.height=480;
  const winners=rows.map(row=>SK.fakeRacer(row.id,'freestyle','ride',lookFor(row.id))),ids=new Set(rows.map(r=>r.id));
  const crowd=[...SK.VILLAGERS,...SK.CHARACTERS.filter(d=>!ids.has(d.id))].map(d=>SK.fakeRacer(d.id,'freestyle','ride',d.adult?null:lookFor(d.id)));
  const c=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let start=null;
  const tick=ms=>{if(canvas.celebration!==token||canvas.closest('.screen')?.classList.contains('hidden'))return;if(start===null)start=ms;P.draw(c,winners,crowd,reduced?0:(ms-start)/1000);if(!reduced)requestAnimationFrame(tick);};requestAnimationFrame(tick);
 };
})(window.SK);
