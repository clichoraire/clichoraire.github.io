(function(SK){
 'use strict';
 const M=SK.TownMusic={items:[['drum',1050],['guitar',2090],['xylophone',2740],['trumpet',3390],['triangle',3930]].map(([kind,x])=>({kind,x,y:548,scale:.6,at:-100}))};
 M.hit=(x,y)=>M.items.find(o=>Math.abs(x-o.x)<Math.max(24,55*o.scale)&&y>o.y-110*o.scale&&y<o.y+12);
 M.play=(o,t)=>{if(t-o.at<.18)return false;o.at=t;SK.Audio.instrument(o.kind);return true;};
 const box=(c,x,y,w,h,col)=>{c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,5);c.fill();c.stroke();};
 const oval=(c,x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.stroke();};
 const line=(c,pts,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 M.draw=function(c,t,camera=0){for(const o of M.items){if(o.x<camera-80||o.x>camera+1360)continue;
  const age=t-o.at,wave=age>=0&&age<1.4?Math.sin(age*19)*Math.exp(-age*3.5):0;
  c.save();c.translate(o.x,o.y);c.scale(o.scale,o.scale);c.strokeStyle='transparent';oval(c,0,4,46,10,'#36566c26');c.rotate(wave*.08);c.scale(1+wave*.14,1-wave*.21);c.lineJoin='round';c.lineCap='round';c.lineWidth=3;c.strokeStyle='#25465c';
  if(o.kind==='drum'){
   box(c,-35,-55,70,49,'#de5864');for(let i=0;i<5;i++)line(c,[[-30+i*14,-49],[-23+i*14,-12]],'#ffe2a0',3);
   c.strokeStyle='#25465c';oval(c,0,-55,36,13,'#fff3c5');line(c,[[-37,-8],[37,-8]],'#f3bf55',6);
   line(c,[[-32,-80],[12,-57]],'#a9783f',5);line(c,[[34,-83],[5,-57]],'#a9783f',5);
  }else if(o.kind==='guitar'){
   oval(c,0,-25,27,25,'#e9a64c');oval(c,0,-47,20,19,'#f3c570');box(c,-6,-94,12,58,'#a0683e');box(c,-10,-106,20,20,'#e9a64c');oval(c,0,-36,9,10,'#3c3841');
   for(let i=0;i<3;i++)line(c,[[-3+i*3,-99],[-3+i*3,-13]],'#fff0bf',1);line(c,[[-11,-12],[11,-12]],'#714830',4);
  }else if(o.kind==='xylophone'){
   line(c,[[-40,-10],[40,-10]],'#795940',8);const colors=['#ed6964','#f3b84e','#ffdf68','#61c999','#5abce1','#9582de'];colors.forEach((v,i)=>{c.strokeStyle='#25465c';c.lineWidth=2;box(c,-43+i*15,-67+i*4,13,54-i*4,v);});line(c,[[-35,-83],[0,-45]],'#ab7d4f',4);c.strokeStyle='#25465c';oval(c,-35,-83,7,7,'#fff3c5');
  }else if(o.kind==='trumpet'){
   line(c,[[-42,-48],[14,-48],[14,-23],[-23,-23],[-23,-43]],'#ad742d',14);line(c,[[-42,-48],[14,-48],[14,-23],[-23,-23],[-23,-43]],'#ffd96f',9);
   c.strokeStyle='#aa742d';c.lineWidth=3;c.fillStyle='#ffd96f';c.beginPath();c.moveTo(7,-50);c.lineTo(43,-70);c.quadraticCurveTo(33,-47,43,-27);c.lineTo(7,-44);c.fill();c.stroke();oval(c,43,-48,7,22,'#bc8031');for(let i=0;i<3;i++)line(c,[[-17+i*10,-47],[-17+i*10,-60]],'#fff0ac',4);
  }else{
   line(c,[[-40,0],[-40,-102],[38,-102]],'#638396',6);line(c,[[0,-100],[0,-85]],'#d1e1e9',2);
   line(c,[[25,-24],[-31,-24],[0,-85],[34,-24]],'#47667c',9);line(c,[[25,-25],[-30,-25],[0,-84],[33,-25]],'#d9f4ff',5);line(c,[[15,-15],[44,-67]],'#f4d88e',5);
  }
  if(age>=0&&age<1.4){c.globalAlpha=1-age/1.4;c.fillStyle='#2474a1';c.font='bold 26px Arial';c.fillText('♪',-40-age*13,-95-age*35);c.fillStyle='#b65398';c.fillText('♫',22+age*12,-105-age*40);}
  c.restore();
 }};
})(window.SK);
