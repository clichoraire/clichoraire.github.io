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
const originalAim=P.aimDir;
P.aimDir=function(p,move){if(!this.isPlayerControlled(p)||p.power.armed&&p.power.id==='licorne')return originalAim.call(this,p,move);if(automatic())return originalAim.call(this,p,null);const fallback=forwardAngle(p);const angle=p.manualAngle??fallback;return {x:Math.cos(angle),y:Math.sin(angle),manual:true};};
const update=P.update;P.update=function(dt,inputs){if(!automatic()&&!this.paused&&this.phase==='play')for(let t=0;t<2;t++){const input=inputs?.[t],p=this.isHuman(t)?this.controlled(t):null;if(!p||!input)continue;const a=this.aimDir(p,p.lastMove);p.manualAngle??=Math.atan2(a.y,a.x);if(input.aimPoint){const dx=input.aimPoint.x-p.x,dy=input.aimPoint.y-(p.y-p.z-30);if(Math.hypot(dx,dy)>8)p.manualAngle=Math.atan2(dy,dx);}else if(input.aimVector&&Math.hypot(input.aimVector.x,input.aimVector.y)>.25)p.manualAngle=Math.atan2(input.aimVector.y,input.aimVector.x);else if(p.hasBall||p.charging){const base=forwardAngle(p),turn=-(input.dx||0)*Math.sin(base)+(input.dy||0)*Math.cos(base);if(Math.abs(turn)>.1){const offset=Math.atan2(Math.sin(p.manualAngle-base),Math.cos(p.manualAngle-base));p.manualAngle=base+Math.max(-1.3,Math.min(1.3,offset+turn*dt*1.8));}}}return update.call(this,dt,inputs);};
if(typeof document==='undefined')return;
const canvas=document.querySelector('#game');let point=null,mouseDown=false;clearPointer=()=>{point=null;};
function locate(e){const r=canvas.getBoundingClientRect();point={x:(e.clientX-r.left)*B.W/r.width,y:(e.clientY-r.top)*B.H/r.height};}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)locate(e);});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||B.app?.screen!=='match')return;e.preventDefault();locate(e);canvas.setPointerCapture(e.pointerId);if(e.pointerType==='mouse')mouseDown=true;});
canvas.addEventListener('pointerup',()=>{mouseDown=false;});canvas.addEventListener('pointercancel',()=>{mouseDown=false;point=null;});canvas.addEventListener('lostpointercapture',()=>{mouseDown=false;});canvas.addEventListener('pointerleave',()=>{if(!mouseDown)point=null;});
addEventListener('blur',()=>{point=null;mouseDown=false;});
const get=I.get;I.get=function(n){const v=get(n);if(n===1){const pad=navigator.getGamepads?.()[0],x=pad?.axes[2]||0,y=pad?.axes[3]||0;if(Math.hypot(x,y)>.25){v.aimVector={x,y};point=null;}else if(v.dx||v.dy){point=null;}if(point)v.aimPoint=point;v.a=v.a||mouseDown;}return v;};
let matchVisible=false;const startReset=()=>{const visible=!document.querySelector('#screen-match').classList.contains('hidden');if(visible===matchVisible)return;matchVisible=visible;point=null;mouseDown=false;};new MutationObserver(startReset).observe(document.querySelector('#screen-match'),{attributes:true,attributeFilter:['class']});
})(window.BC);
