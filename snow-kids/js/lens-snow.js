// Neige sur la caméra : état cosmétique par joueur, indépendant du hasard de course.
(function(SK){
  'use strict';
  const L=SK.LensSnow={};
  L.equipped=r=>r.look&&Object.prototype.hasOwnProperty.call(r.look,'goggles')?r.look.goggles:['lunettesMiroir','lunettesTricolores','lunettesNeige','lunettesForet'].find(id=>r.gear?.[id]);
  L.blocked=r=>['lunettesMiroir','lunettesTricolores'].includes(L.equipped(r));
  L.protected=r=>['lunettesNeige','lunettesForet'].includes(L.equipped(r));
  L.splash=function(r,count=3,heavy=false){
    if(L.blocked(r)){r.lensSnow=[];return;}
    const flakes=r.lensSnow||(r.lensSnow=[]),protectedLens=L.protected(r);
    // Keep room for a fresh impact even when the lens is already covered.
    while(flakes.length+count+(heavy?1:0)>72)flakes.shift();
    const life=()=>(protectedLens?.65:28+Math.random()*6)*(heavy?.5:1);
    if(heavy)flakes.push({x:.38+Math.random()*.24,y:.40+Math.random()*.20,size:.32,heavy:true,age:0,life:life(),slide:protectedLens,seed:Math.random()*6.28});
    for(let i=0;i<count;i++)flakes.push({x:.08+Math.random()*.84,y:.18+Math.random()*.64,size:.035+Math.random()*.045,age:0,life:life(),slide:protectedLens,seed:Math.random()*6.28});
  };
  L.update=function(race,dt){
    const snow=r=>['snow','ice'].includes(race.track.segAt(r.z).surface);
    for(const r of race.humans){
      if(L.blocked(r)){r.lensSnow=[];continue;}
      r.lensSnow=(r.lensSnow||[]).filter(f=>{f.age+=dt;return f.age<f.life;});
      r.lensCooldown=Math.max(0,(r.lensCooldown||0)-dt);
      r.lensImpactCooldown=Math.max(0,(r.lensImpactCooldown||0)-dt);
      if(r.state!=='ride')continue;
      const spraying=race.racers.some(o=>o!==r&&o.state==='ride'&&(o.brake||0)>.35&&o.speed>4&&o.lap===r.lap&&o.z-r.z>0&&o.z-r.z<22&&Math.abs(o.x-r.x)<2.8&&snow(o));
      const fast=r.speed*3.6>100&&snow(r);
      if(spraying&&r.lensImpactCooldown===0){L.splash(r,8,true);r.lensImpactCooldown=3;}
      else if(fast&&r.lensCooldown===0){L.splash(r,2);r.lensCooldown=1.2;}
    }
  };
  L.draw=function(c,r,x,y,w,h){
    if(L.blocked(r))return;
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    for(const f of r.lensSnow||[]){
      const arrival=Math.min(1,f.age/.16),melt=Math.max(0,(f.age-(f.slide?.12:f.life*.65))/(f.life-(f.slide?.12:f.life*.65))),fade=Math.pow(1-melt,1.25);
      const px=x+w*f.x,py=y+h*(f.y+(f.slide?f.age*f.age*2.4:melt*melt*.035)),radius=(f.heavy?w:Math.min(w,h))*f.size*(.35+.65*arrival)*(1-.48*melt),aspect=f.heavy?h/w*.875:.75;
      c.globalAlpha=fade*.84;const g=c.createRadialGradient(px-radius*.3,py-radius*.3,0,px,py,radius*1.35);g.addColorStop(0,'#ffffff');g.addColorStop(.65,'#effaff');g.addColorStop(1,'#bbdbe988');
      c.fillStyle=g;c.beginPath();for(let j=0;j<20;j++){const a=j/20*Math.PI*2,rr=radius*(1+.19*Math.sin(j*2.6+f.seed));const xx=px+Math.cos(a)*rr,yy=py+Math.sin(a)*rr*aspect;j?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.closePath();c.fill();
      for(let j=0;j<4;j++){const a=f.seed+j*1.7;c.beginPath();c.ellipse(px+Math.cos(a)*radius*1.4,py+Math.sin(a)*radius, radius*.16,radius*.11,0,0,Math.PI*2);c.fill();}
    }c.restore();
  };
})(window.SK);
