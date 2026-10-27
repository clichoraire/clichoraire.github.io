// Boss arenas run on the match clock: no cutscene or possession reset.
(function(B){
'use strict';
const P=B.Game.prototype,C=B.COURT,TAU=Math.PI*2;
const EVENTS={water:{name:'EAU MONTANTE',hint:'Reste au centre du terrain !',color:'#59ddff'},lightning:{name:'ORAGE ÉLECTRIQUE',hint:'Évite les cercles jaunes !',color:'#ffe56b'},wind:{name:'RAFALES',hint:'Avance contre le vent !',color:'#b5f5ee'},lava:{name:'ÉRUPTION',hint:'Évite les fissures rouges !',color:'#ff9251'}};
const KITS={troll:['water','lightning','wind'],witch:['lightning','wind','water'],orc:['lava','wind','lightning'],specter:['wind','lightning','lava','water']};
P.startBossArena=function(boss,kind){
 const team=1-boss.team,lo=team===0?C.left:C.mid,hi=team===0?C.mid:C.right;
 this.bossArena={boss,kind,team,t:0,duration:12,spawn:0,zones:[],tick:0,lo,hi,dir:Math.random()<.5?-1:1};
 this.say(EVENTS[kind].name,1.6,EVENTS[kind].hint);
};
P.arenaWet=function(p){const a=this.bossArena;return !!(a&&a.kind==='water'&&a.t>=2&&p.team===a.team&&p.zone==='in'&&p.z<18&&(p.y<C.top+this.arenaWaterDepth()||p.y>C.bottom-this.arenaWaterDepth()));};
P.arenaWaterDepth=function(){const a=this.bossArena;return a?Math.min(95,Math.max(0,(a.t-2)*24),Math.max(0,(12-a.t)*48)):0;};
const speed=P.speedMul;P.speedMul=function(p){return speed.call(this,p)*(this.arenaWet(p)?.62:1);};
P.updateBossArena=function(dt){
 const boss=this.players.find(p=>p.def.boss&&p.alive);
 if(!boss){this.bossArena=null;return;}
 if(!this.bossArena){boss.arenaClock=(boss.arenaClock||0)+dt;if(boss.arenaClock>=6){boss.arenaClock=0;const kit=KITS[boss.def.monster]||KITS.troll;this.startBossArena(boss,kit[(boss.arenaIndex||0)%kit.length]);boss.arenaIndex=(boss.arenaIndex||0)+1;}return;}
 const a=this.bossArena;a.t+=dt;if(a.t>=a.duration){this.bossArena=null;return;}if(a.t<2)return;
 const foes=this.aliveInner(a.team);
 if(a.kind==='lightning'||a.kind==='lava'){
  a.spawn-=dt;if(a.spawn<=0){a.spawn=a.kind==='lightning'?.85:1.35;const q=foes[(a.index||0)%Math.max(1,foes.length)];a.index=(a.index||0)+1;
   const x=q&&a.index%2?q.x:a.lo+45+Math.random()*(a.hi-a.lo-90),y=q&&a.index%2?q.y:C.top+40+Math.random()*(C.bottom-C.top-80);
   a.zones.push({x,y,t:0,r:a.kind==='lava'?39:29,hit:false});
  }
  for(const z of a.zones){z.t+=dt;if(a.kind==='lightning'&&z.t>=1.15&&!z.hit){z.hit=true;this.shake=4;for(const p of foes)if(Math.hypot(p.x-z.x,p.y-z.y)<z.r)this.hurt(p,6,{from:boss,power:'arena-lightning',dot:true});}}
  a.zones=a.zones.filter(z=>z.t<(a.kind==='lava'?4.6:1.5));
 }
 if(a.kind==='wind'){
  const gust=(.6+.4*Math.sin(a.t*2)**2)*a.dir;
  for(const p of foes){p.y+=gust*(p.z>10?85:48)*dt;this.confine(p);}
  if(['live','dead','pass'].includes(this.ball.state)&&this.ball.x>=a.lo&&this.ball.x<=a.hi)this.ball.vy+=gust*65*dt;
 }
 a.tick-=dt;if(a.tick<=0){a.tick=1;for(const p of foes){const hot=a.kind==='lava'&&p.z<22&&a.zones.some(z=>z.t>=1.15&&Math.hypot(p.x-z.x,p.y-z.y)<z.r);if(hot||this.arenaWet(p))this.hurt(p,hot?3:1,{from:boss,power:'arena-'+a.kind,dot:true});}}
};
const update=P.update;P.update=function(dt,inputs){if(this.phase==='play')this.updateBossArena(dt);update.call(this,dt,inputs);if(this.phase==='end')this.bossArena=null;};
// Unselected allies and CPU players try to leave announced danger zones.
const aiUpdate=B.AI.prototype.update;B.AI.prototype.update=function(dt,inputs){aiUpdate.call(this,dt,inputs);const g=this.g,a=g.bossArena;if(!a||a.t<2)return;for(const p of g.aliveInner(a.team)){if(g.isPlayerControlled(p)||!['idle','catch','jump'].includes(p.state))continue;let dx=0,dy=0;if(g.arenaWet(p))dy=p.y<(C.top+C.bottom)/2?1:-1;for(const z of a.zones){if(a.kind==='lightning'&&z.hit)continue;const distance=Math.hypot(p.x-z.x,p.y-z.y);if(distance<z.r+24){dx+=(p.x-z.x)/(distance||1);dy+=(p.y-z.y)/(distance||1);if(distance<1)dy=p.y<(C.top+C.bottom)/2?1:-1;}}if(dx||dy){const length=Math.hypot(dx,dy);p.ai.move={dx:dx/length,dy:dy/length};}}};
function ellipse(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);}
B.drawBossArena=function(c,g,layer){const a=g.bossArena;if(!a)return;const e=EVENTS[a.kind];c.save();
 if(layer==='hud'){c.restore();return;}
 if(a.t<2){if(layer==='ground'){c.strokeStyle=e.color;c.globalAlpha=.5+.3*Math.sin(a.t*9);c.lineWidth=4;c.strokeRect(a.lo+4,C.top+4,a.hi-a.lo-8,C.bottom-C.top-8);}c.restore();return;}
 if(layer==='ground'){
  c.beginPath();c.rect(a.lo,C.top,a.hi-a.lo,C.bottom-C.top);c.clip();
  if(a.kind==='water'){const d=g.arenaWaterDepth();for(const y of [C.top,C.bottom-d]){const grad=c.createLinearGradient(0,y,0,y+d);grad.addColorStop(0,'#1688ca9c');grad.addColorStop(1,'#48d8ff66');c.fillStyle=grad;c.fillRect(a.lo,y,a.hi-a.lo,d);for(let k=0;k<3;k++){c.strokeStyle=k===0?'#d2faffbb':'#8feeff77';c.lineWidth=2;c.beginPath();for(let x=a.lo;x<=a.hi;x+=5){const yy=y+d*(k+1)/4+Math.sin(x*.04+a.t*3+k)*4;x===a.lo?c.moveTo(x,yy):c.lineTo(x,yy);}c.stroke();}}}
  for(const z of a.zones){const ready=z.t>=1.15;c.fillStyle=ready?(a.kind==='lava'?'#ee511cd0':'#faf19c99'):'#ffcc442b';c.strokeStyle=a.kind==='lava'?'#ffad48':'#fff28c';c.lineWidth=3;ellipse(c,z.x,z.y,z.r,z.r);c.fill();c.stroke();if(!ready){c.beginPath();c.arc(z.x,z.y,z.r+5,-Math.PI/2,-Math.PI/2+TAU*z.t/1.15);c.stroke();c.font='bold 21px Arial';c.textAlign='center';c.fillStyle='#fff';c.fillText('!',z.x,z.y+7);}else if(a.kind==='lava'){for(let k=0;k<5;k++){const x=z.x+Math.sin(k*8)*z.r*.7,y=z.y+Math.cos(k*5)*z.r*.7;c.strokeStyle='#ffe37c';c.beginPath();c.moveTo(x-8,y+5);c.lineTo(x,y-4-Math.sin(a.t*6+k)*4);c.lineTo(x+7,y+3);c.stroke();}}}
 }
 if(layer==='front'){
  if(a.kind==='lightning')for(const z of a.zones)if(z.hit){c.shadowColor='#9febff';c.shadowBlur=18;for(const [width,color]of [[9,'#67caff'],[3,'#fff']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(z.x-18,20);for(let i=1;i<=8;i++)c.lineTo(z.x+Math.sin(i*9+Math.floor(a.t*24))*22*(1-i/9),20+(z.y-20)*i/8);c.lineTo(z.x,z.y);c.stroke();}}
  if(a.kind==='wind'){c.strokeStyle='#d5ffed88';c.lineWidth=2;for(let i=0;i<24;i++){const x=a.lo+(i*79)%(a.hi-a.lo),y=C.top+((i*51+a.t*a.dir*180)%(C.bottom-C.top)+(C.bottom-C.top))%(C.bottom-C.top);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+12,y+18*a.dir,x+4,y+42*a.dir);c.stroke();}c.fillStyle='#d0fff4';c.font='900 38px Arial';c.fillText(a.dir>0?'↓ ↓ ↓':'↑ ↑ ↑',(a.lo+a.hi)/2-50,C.top-16);}
 }
 c.restore();};
// A broad dusty funnel, orbiting debris and stretched face glimpses, not a flashing mirrored sprite.
B.drawCartoonTornado=function(c,x,y,size,t){c.save();c.translate(x,y);c.scale(size,size);const grad=c.createLinearGradient(-40,0,40,0);grad.addColorStop(0,'#765548cc');grad.addColorStop(.45,'#e1c39af2');grad.addColorStop(1,'#8e6958de');c.fillStyle=grad;c.beginPath();c.moveTo(-9,0);c.bezierCurveTo(-15,-25,-52,-45,-47,-70);c.bezierCurveTo(-25,-86,30,-86,48,-70);c.bezierCurveTo(55,-44,15,-24,8,0);c.closePath();c.fill();
 for(let i=0;i<8;i++){const y=-8-i*9,w=10+i*5;const phase=t*22+i*.8;c.strokeStyle=i%2?'#ffebc5c0':'#684b4299';c.lineWidth=i%2?3:5;c.beginPath();c.ellipse(Math.sin(phase)*3,y,w,3+i*.6,.06*Math.sin(phase),phase,phase+Math.PI*1.55);c.stroke();}
 for(let i=0;i<8;i++){const angle=t*12+i*2.4,r=25+(i%3)*12;c.fillStyle=i%2?'#e8d2a1':'#6b665d';c.save();c.translate(Math.cos(angle)*r,-25-i*6+Math.sin(angle)*7);c.rotate(angle);c.fillRect(-3,-2,6,4);c.restore();}
 if(Math.sin(t*22)>.15){c.fillStyle='#fff8d9';ellipse(c,-9,-54,7,5);c.fill();ellipse(c,8,-54,7,5);c.fill();c.fillStyle='#281d20';ellipse(c,-7,-54,2,3);c.fill();ellipse(c,10,-54,2,3);c.fill();}
 c.strokeStyle='#e1c39a99';c.lineWidth=3;ellipse(c,0,0,28+Math.sin(t*17)*5,7);c.stroke();c.restore();};
})(window.BC);
