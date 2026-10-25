// Une coque de snowboard commune aux objets en boutique et aux trois vues portées.
(function(SK){
 SK.drawSnowHelmet=function(c,id,x,y,w,h,view='side',worn=false,fit=null){
  const strapScale=worn&&fit?.chinY?fit.chinY/(h*1.48):worn?(view==='front'?1.35:view==='side'?1.12:1):1;
  const color=SK.HELMETS[id]||SK.HELMETS.casque;
  c.save();c.translate(x,y);c.scale(w/2,h);c.lineJoin='round';c.lineCap='round';
  const pad=(px,py,rx,ry)=>{c.fillStyle='#222b32';c.beginPath();c.ellipse(px,py,rx,ry,0,0,Math.PI*2);c.fill();c.strokeStyle='#46515a';c.lineWidth=.025;c.stroke();};
  if(view==='back'){if(!worn)pad(0,.89,.83,.19);pad(-.86,.89,.14,.20);pad(.86,.89,.14,.20);}
  else if(view==='side'){pad(-.50,.91,.31,.31);if(!worn)pad(.65,.90,.18,.25);}
  else{pad(-.84,.90,.16,.30);pad(.84,.90,.16,.30);}
  c.strokeStyle='#19242d';c.lineWidth=.055;
  c.save();if(worn)c.scale(1,strapScale);
  if(view==='side'){c.beginPath();c.moveTo(-.60,.89);c.lineTo(-.23,1.43);c.quadraticCurveTo(.15,1.55,.60,1.23);c.stroke();}
  else if(view==='front'||!worn){c.beginPath();c.moveTo(-.78,.94);c.lineTo(-.45,1.40);c.quadraticCurveTo(0,1.53,.45,1.40);c.lineTo(.78,.94);c.stroke();}
  c.restore();
  const shell=()=>{c.beginPath();c.moveTo(-.98,.86);c.bezierCurveTo(-1.14,.24,-.60,-.05,.02,0);c.bezierCurveTo(.66,-.02,1.03,.27,1,.70);if(view==='side'){c.lineTo(.43,.72);c.quadraticCurveTo(.19,.74,.04,.94);c.lineTo(-.71,1.04);c.quadraticCurveTo(-.96,1.04,-.98,.86);}else{c.quadraticCurveTo(0,.80,-.98,.86);}c.closePath();};
  shell();const grad=c.createLinearGradient(-1,0,1,1);grad.addColorStop(0,'#e0edf1');grad.addColorStop(.18,color);grad.addColorStop(.72,color);grad.addColorStop(1,'#283e48');c.fillStyle=grad;c.fill();c.strokeStyle='#233944';c.lineWidth=.025;c.stroke();
  c.save();shell();c.clip();c.strokeStyle='#ffffff55';c.lineWidth=.025;c.beginPath();c.ellipse(-.05,.33,.82,.29,-.10,Math.PI,Math.PI*1.8);c.stroke();c.restore();
  // Petites aérations et rivets; pas de visière ni de bande décorative.
  c.fillStyle='#1a2932';for(const px of view==='back'?[-.62,.62]:view==='side'?[-.80,-.60]:[-.38,.38]){c.beginPath();c.roundRect(px-.09,view==='back'?.71:.28,.18,.06,.025);c.fill();}
  for(const px of view==='side'?[-.78,.06]:[-.86,.86]){c.beginPath();c.ellipse(px,.80,.045,.045,0,0,Math.PI*2);c.fill();}
  if(view==='back'){c.fillStyle='#17252e';c.beginPath();c.roundRect(-.095,.35,.19,.40,.035);c.fill();c.strokeStyle='#53616b';c.lineWidth=.02;c.stroke();}
  if(view!=='back'){c.save();if(worn)c.scale(1,strapScale);c.fillStyle='#4b5e69';c.beginPath();c.roundRect(view==='side'?-.26:-.10,1.37,.20,.10,.025);c.fill();c.restore();}
  c.restore();
 };
})(window.SK);
