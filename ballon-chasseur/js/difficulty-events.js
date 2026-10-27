// Événements annoncés des matchs Dangereux et Impossible.
(function(B){
'use strict';const P=B.Game.prototype,C=B.COURT;
const enabled=g=>!g.practice&&g.mode!=='practice'&&g.difficulty>=3&&g.teams.some(t=>t.species)&&g.teams.some(t=>!t.species);
P.startDifficultyEvent=function(kind){if(!enabled(this))return false;const enemy=this.teams.findIndex(t=>t.species),team=1-enemy,heroes=this.aliveInner(team),source=this.aliveInner(enemy)[0];if(!source||!heroes.length)return false;
 const hard=this.difficulty===4,lo=team===0?C.left:C.mid,hi=team===0?C.mid:C.right;
 const lanes=heroes.map(p=>p.y);const zones=heroes.map(p=>({x:p.x,y:p.y,r:hard?43:35}));
 this.difficultyEvent={kind,enemy,team,source,t:0,warning:1.4,duration:kind==='quake'?4.6:kind==='meteors'?3.8:7.5,lo,hi,lanes,zones,arrows:[],wave:0,hard};
 this.say(kind==='quake'?'SÉISME !':kind==='meteors'?'PLUIE DE PIERRES !':'VOLÉE DE FLÈCHES !',1.4,kind==='quake'?'Saute pour pouvoir bouger !':kind==='meteors'?'Évite les zones marquées !':'Écarte-toi des lignes ou saute !');return true;
};
P.quakeGrounded=function(p){const e=this.difficultyEvent;return !!(e&&e.kind==='quake'&&e.t>=e.warning&&e.t<e.duration&&p.team===e.team&&p.zone==='in'&&p.alive&&p.z<=18);};
const speed=P.speedMul;P.speedMul=function(p){return this.quakeGrounded(p)?0:speed.call(this,p);};
const step=P.stepPlayer;P.stepPlayer=function(p,dt,move,act){const fixed=this.quakeGrounded(p),x=p.x,y=p.y;if(fixed)p.groundVX=p.groundVY=p.vx=p.vy=0;step.call(this,p,dt,move,act);if(fixed&&this.quakeGrounded(p)){p.x=x;p.y=y;p.mx=p.my=0;}};
P.updateDifficultyEvents=function(dt){if(!enabled(this)||this.phase!=='play'){this.difficultyEvent=null;return;}let e=this.difficultyEvent;
 if(!e){this.difficultyEventClock=(this.difficultyEventClock||0)+dt;const delay=this.difficulty===4?5:8;if(this.difficultyEventClock>=delay){this.difficultyEventClock=0;const kit=this.difficulty===4?['quake','arrows','meteors','arrows']:['quake','arrows'];this.startDifficultyEvent(kit[(this.difficultyEventIndex||0)%kit.length]);this.difficultyEventIndex=(this.difficultyEventIndex||0)+1;}return;}
 e.t+=dt;if(!this.aliveInner(e.enemy).length||e.t>=e.duration){this.difficultyEvent=null;return;}if(e.t<e.warning)return;
 if(e.kind==='quake'){this.shake=Math.max(this.shake,2);return;}
 if(e.kind==='meteors'){if(e.t>=e.warning+.6&&!e.hit){e.hit=true;for(const p of this.aliveInner(e.team))if(p.z<30&&e.zones.some(z=>Math.hypot(p.x-z.x,p.y-z.y)<z.r))this.hurt(p,6,{from:e.source,power:'difficulty-meteor',dot:true,knock:0});this.shake=Math.max(this.shake,5);}return;}
 const waves=e.hard?5:3;while(e.wave<waves&&e.t-e.warning>=e.wave*.45){const dir=e.team===0?-1:1,x=e.enemy===1?C.right-15:C.left+15;for(const lane of e.lanes){const y=Math.max(C.top+20,Math.min(C.bottom-20,lane+(e.wave%3-1)*32));e.arrows.push({x,y,vx:dir*(e.hard?350:290),hit:new Set()});}e.wave++;}
 for(const a of e.arrows){const old=a.x;a.x+=a.vx*dt;for(const p of this.aliveInner(e.team))if(!a.hit.has(p)&&p.z<24&&p.x>=Math.min(old,a.x)-16&&p.x<=Math.max(old,a.x)+16&&Math.abs(p.y-a.y)<15){a.hit.add(p);this.hurt(p,e.hard?3:2,{from:e.source,power:'difficulty-arrow',dot:true,knock:0});}}
 e.arrows=e.arrows.filter(a=>a.x>C.left-25&&a.x<C.right+25);
};
const update=P.update;P.update=function(dt,inputs){if(this.paused)return;this.updateDifficultyEvents(dt);update.call(this,dt,inputs);if(this.phase==='end')this.difficultyEvent=null;};
// Les coéquipiers non contrôlés essaient aussi d’éviter les dangers annoncés.
const ai=B.AI.prototype.update;B.AI.prototype.update=function(dt,inputs){ai.call(this,dt,inputs);const g=this.g,e=g.difficultyEvent;if(!e)return;for(const p of g.aliveInner(e.team)){if(g.isPlayerControlled(p))continue;if(e.kind==='quake'&&e.t>e.warning-.35&&p.z===0&&p.state==='idle')g.jump(p,{dx:0,dy:0});else if(e.kind==='arrows'){const lane=e.lanes.find(y=>Math.abs(p.y-y)<50);if(lane!=null)p.ai.move={dx:0,dy:p.y<(C.top+C.bottom)/2?1:-1};}else if(e.kind==='meteors'&&!e.hit){const z=e.zones.find(z=>Math.hypot(p.x-z.x,p.y-z.y)<z.r+20);if(z)p.ai.move={dx:p.x<z.x?-1:1,dy:p.y<(C.top+C.bottom)/2?1:-1};}}};
B.drawDifficultyEvent=(c,g,layer)=>{const e=g.difficultyEvent;if(!e)return;c.save();const warning=e.t<e.warning;c.strokeStyle=warning?'#ffe27a':'#ffb066';c.lineWidth=2;
 if(layer==='ground'){
  if(e.kind==='quake'){c.fillStyle=warning?'#ffdb5020':'#d7944426';c.fillRect(e.lo,C.top,e.hi-e.lo,C.bottom-C.top);for(let i=0;i<8;i++){const x=e.lo+30+i*(e.hi-e.lo-60)/7;c.beginPath();c.moveTo(x,C.top+15);for(let y=C.top+35;y<C.bottom;y+=25)c.lineTo(x+Math.sin(y*.19+i)*12,y);c.stroke();}}
  if(e.kind==='arrows'&&warning){c.setLineDash([12,8]);for(const y of e.lanes){c.fillStyle='#ffcf6630';c.fillRect(e.lo,y-44,e.hi-e.lo,88);c.beginPath();c.moveTo(e.lo,y);c.lineTo(e.hi,y);c.stroke();}c.setLineDash([]);}
  if(e.kind==='meteors')for(const z of e.zones){c.fillStyle=e.hit?'#ff804c44':'#ffd35c44';c.beginPath();c.ellipse(z.x,z.y,z.r,z.r*.6,0,0,Math.PI*2);c.fill();c.stroke();}
 }
 if(layer==='front'){
  for(const a of e.arrows){c.save();c.translate(a.x,a.y-12);c.scale(Math.sign(a.vx),1);c.strokeStyle='#f7d18c';c.lineWidth=3;c.beginPath();c.moveTo(-22,0);c.lineTo(8,0);c.stroke();c.fillStyle='#e8eff4';c.beginPath();c.moveTo(16,0);c.lineTo(5,-6);c.lineTo(5,6);c.closePath();c.fill();c.strokeStyle='#e55546';c.beginPath();c.moveTo(-15,0);c.lineTo(-24,-6);c.moveTo(-15,0);c.lineTo(-24,6);c.stroke();c.restore();}
  if(e.kind==='meteors'&&!e.hit&&e.t>=e.warning)for(const z of e.zones){c.fillStyle='#8c7683';c.beginPath();c.arc(z.x,z.y-220*(1-(e.t-e.warning)/.6),15,0,Math.PI*2);c.fill();}
  c.fillStyle='#15233be8';c.fillRect(B.W/2-240,135,480,28);c.fillStyle='#ffe382';c.font='bold 15px Arial';c.textAlign='center';c.fillText((e.kind==='quake'?'SÉISME · SAUTE !':e.kind==='arrows'?'FLÈCHES · ESQUIVE OU SAUTE !':'PIERRES · ÉVITE LES CERCLES !')+' · '+Math.ceil(e.duration-e.t)+' s',B.W/2,154);
 }c.restore();};
})(window.BC);
