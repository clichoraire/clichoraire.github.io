// Une direction choisie par le joueur ; la dispersion est échantillonnée au lâcher.
(function(B){
'use strict';const P=B.Game.prototype,I=B.input;
const forwardAngle=p=>p.zone==='in'?(p.team===0?0:Math.PI):p.lane==='back'?(p.team===0?Math.PI:0):p.lane==='top'?Math.PI/2:-Math.PI/2;
// Track touches by team, including hits, so friendly passes keep the chosen angle.
let clearPointer=()=>{};
const touch=(g,p)=>{g.aimTouches??=[0,0];g.aimTouches[p.team]++;};
const contact=P.contact;P.contact=function(p,b){touch(this,p);return contact.call(this,p,b);};
const give=P.give;P.give=function(p){const enemyTouches=this.aimTouches?.[1-p.team]||0;if(enemyTouches>(p.aimEnemyTouches||0)){p.manualAngle=forwardAngle(p);if(this.isHuman(p.team))clearPointer();}p.aimEnemyTouches=enemyTouches;touch(this,p);return give.call(this,p);};
const automatic=()=>B.app?.settings?.aimMode==='auto';
const aiming=B.Aiming={};
aiming.travelTime=(distance,speed,fullStart=false)=>{const initial=speed*(fullStart ? .9 : .6),acceleration=speed*1.8,cap=speed*1.4,ramp=(cap-initial)/acceleration,rampDistance=(initial+cap)*ramp/2;return distance<=rampDistance?(Math.sqrt(initial*initial+2*acceleration*distance)-initial)/acceleration:ramp+(distance-rampDistance)/cap;};
aiming.lead=(g,p,target)=>{const o=p.aimShotOptions||{...p.pending,charge:p.charge||0},charge=Math.max(0,Math.min(1,o.charge||0)),apex=o.jump&&Math.abs(p.vz)<170;
 const speed=p.zone==='in'?p.phys.throwSpeed*(.85+.45*charge)*(o.run?1.12:1)*(o.jump?(apex?1.3:1.2):1):p.phys.throwSpeed*.8*(.85+.3*charge),originX=p.x+g.fwdOf(p)*12,C=B.COURT,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 let x=target.x,y=target.y;for(let i=0;i<10;i++){const flight=aiming.travelTime(Math.hypot(x-originX,y-p.y),speed,p.zone==='in'&&p.phys.fullStart);x=target.x+(target.mx||0)*flight;y=target.y+(target.my||0)*flight;
 if(target.zone==='in'){const air=target.z>0||target.state==='return'||target.tele;x=clamp(x,Math.min(target.x,air||target.team===0?C.left+14:C.mid-50),Math.max(target.x,air||target.team===1?C.right-14:C.mid+50));y=clamp(y,Math.min(target.y,C.top+8),Math.max(target.y,C.bottom-8));}}
 const dx=x-originX,dy=y-p.y,length=Math.hypot(dx,dy)||1;return {x:dx/length,y:dy/length,target,assisted:true};};
const throwBall=P.throwBall;P.throwBall=function(p,o){p.aimShotOptions=o;try{return throwBall.call(this,p,o);}finally{delete p.aimShotOptions;}};
const originalAim=P.aimDir;
P.aimDir=function(p,move){if(!this.isPlayerControlled(p)||p.power.armed&&p.power.id==='licorne')return originalAim.call(this,p,move);if(automatic()){const aim=originalAim.call(this,p,null),selected=this.autoTargets?.[p.team];if(selected&&!this.opponentsOf(p).includes(selected))this.autoTargets[p.team]=null;const target=this.autoTargets?.[p.team]||aim.target;return target?aiming.lead(this,p,target):aim;}const fallback=forwardAngle(p);const angle=p.manualAngle??fallback;return {x:Math.cos(angle),y:Math.sin(angle),manual:true};};
P.selectAimTargetAt=function(p,point){if(!automatic()||this.practice||this.paused||this.phase!=='play'||!p||!this.isPlayerControlled(p))return null;
 const target=this.opponentsOf(p).filter(q=>{const size=Math.max(.6,q.def.size),bottom=q.y-q.z-(q.fx?.horseT>0?18:0);return Math.abs(point.x-q.x)<=Math.max(22,26*size)&&point.y>=bottom-65*size-8&&point.y<=bottom+10;}).sort((a,b)=>b.y-a.y)[0];
 if(!target)return null;this.autoTargets??=[null,null];this.autoTargets[p.team]=target;return target;};
P.cycleAimTarget=function(p){if(!automatic()||this.practice||this.paused||this.phase!=='play'||!p||!this.isPlayerControlled(p))return null;const enemies=this.opponentsOf(p);if(!enemies.length)return null;const current=this.aimDir(p).target,next=enemies[(enemies.indexOf(current)+1)%enemies.length];this.autoTargets??=[null,null];this.autoTargets[p.team]=next;return next;};
const update=P.update;P.update=function(dt,inputs){if(!this.paused){this.targetCycleHeld??=[false,false];for(let t=0;t<2;t++){const held=!!inputs?.[t]?.targetCycle;if(held&&!this.targetCycleHeld[t]&&this.isHuman(t))this.cycleAimTarget(this.controlled(t));this.targetCycleHeld[t]=held;}}if(!automatic()&&!this.paused&&this.phase==='play')for(let t=0;t<2;t++){const input=inputs?.[t],p=this.isHuman(t)?this.controlled(t):null;if(!p||!input)continue;const a=this.aimDir(p,p.lastMove);p.manualAngle??=Math.atan2(a.y,a.x);if(input.aimPoint){const dx=input.aimPoint.x-p.x,dy=input.aimPoint.y-(p.y-p.z-30);if(Math.hypot(dx,dy)>8)p.manualAngle=Math.atan2(dy,dx);}else if(input.aimVector&&Math.hypot(input.aimVector.x,input.aimVector.y)>.25)p.manualAngle=Math.atan2(input.aimVector.y,input.aimVector.x);else if(p.hasBall||p.charging){const base=forwardAngle(p),turn=-(input.dx||0)*Math.sin(base)+(input.dy||0)*Math.cos(base);if(Math.abs(turn)>.1){const offset=Math.atan2(Math.sin(p.manualAngle-base),Math.cos(p.manualAngle-base));p.manualAngle=base+Math.max(-1.3,Math.min(1.3,offset+turn*dt*1.8));}}}return update.call(this,dt,inputs);};
if(typeof document==='undefined')return;
const canvas=document.querySelector('#game');let point=null,mouseDown=false;clearPointer=()=>{point=null;};
function locate(e){const r=canvas.getBoundingClientRect();point={x:(e.clientX-r.left)*B.W/r.width,y:(e.clientY-r.top)*B.H/r.height};}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)locate(e);});
canvas.addEventListener('pointerdown',e=>{const g=B.app?.game;if(e.button!==0||B.app?.screen!=='match'||!g||g.paused||g.phase!=='play')return;e.preventDefault();locate(e);const team=[0,1].find(t=>g.isHuman(t)),p=team==null?null:g.controlled(team);if(g.selectAimTargetAt(p,point)){canvas.setPointerCapture(e.pointerId);mouseDown=e.pointerType==='mouse'&&!!p.hasBall;point=null;return;}canvas.setPointerCapture(e.pointerId);if(e.pointerType==='mouse')mouseDown=true;});
canvas.addEventListener('pointerup',()=>{mouseDown=false;});canvas.addEventListener('pointercancel',()=>{mouseDown=false;point=null;});canvas.addEventListener('lostpointercapture',()=>{mouseDown=false;});canvas.addEventListener('pointerleave',()=>{if(!mouseDown)point=null;});
addEventListener('blur',()=>{point=null;mouseDown=false;});
const get=I.get;I.get=function(n){const v=get(n);if(n===1){const pad=navigator.getGamepads?.()[0],x=pad?.axes[2]||0,y=pad?.axes[3]||0;if(Math.hypot(x,y)>.25){v.aimVector={x,y};point=null;}else if(v.dx||v.dy){point=null;}if(point)v.aimPoint=point;v.a=v.a||mouseDown;}return v;};
let matchVisible=false;const startReset=()=>{const visible=!document.querySelector('#screen-match').classList.contains('hidden');if(visible===matchVisible)return;matchVisible=visible;point=null;mouseDown=false;};new MutationObserver(startReset).observe(document.querySelector('#screen-match'),{attributes:true,attributeFilter:['class']});
})(window.BC);
