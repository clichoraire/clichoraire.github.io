/* Shared geometry keeps the sprite on the ramp and makes launch position continuous. */
(function(root){
const Gear=typeof module!=='undefined'?require('./launch-gear.js'):root.GGLaunch;
const SCALE=.85,X_SCALE=15,LAUNCH_ANGLE=20,CELL_W=6,CELL_H=40,TIME_SCALE=1.75;
// Fixed spatial conversion: no time-dependent boost at takeoff.
const AIR_Y_SCALE=15;
function airTravelFactor(){return 1;}
// Half-brick stagger; end stones are clipped to the wall's exact edges.
function stoneOffset(row){return row%2?-CELL_W/2:0;}
function stoneColumns(index,row){return Math.ceil((wallWidth(index)-stoneOffset(row))/CELL_W);}
function stoneBounds(index,col,row){const offset=stoneOffset(row);return {left:Math.max(0,col*CELL_W+offset),right:Math.min(wallWidth(index),(col+1)*CELL_W+offset)};}
function wallWidth(index){return index===1?150:300+(index-1)*48;}
const stages=[{at:0,name:'La vallée du Baron',short:'VALLÉE',color:'#9dc554'},{at:2000,name:'Les lignes des Siégeurs',short:'SIÉGEURS',color:'#c5a36c'},{at:12000,name:'Les falaises interdites',short:'FALAISES',color:'#8ba6ad'},{at:20000,name:'La mer de nuages',short:'NUAGES',color:'#c1dce8'},{at:30000,name:'Le territoire du Dragon',short:'DRAGON',color:'#bb786d'}];
// From 45 km on: the magic world. Its gate is not a wall but the dragon boss (`boss`), and the very last gate is the Grand Sorcerer.
stages.push({at:45000,name:'La forêt enchantée',short:'ENCHANTÉE',color:'#6fcfb8',boss:'dragon',magic:true},{at:60000,name:'Les tours des Mages',short:'MAGES',color:'#9d8be6',magic:true},{at:80000,name:'Le ciel des Hommes-Oiseaux',short:'HOMMES-OISEAUX',color:'#78b6f2',magic:true},{at:100000,name:'Le Grand Sorcier',short:'FINALE',color:'#d79be8',boss:'sorcerer',magic:true});
const cacheMemo=new Map();
function wallCaches(index){if(!cacheMemo.has(index))cacheMemo.set(index,Array.from({length:24},(_,n)=>({id:index+':'+n,x:stages[index].at+24+((n*37+index*11)%(wallWidth(index)-48)),y:180+n*360,value:150*index+50*Math.floor(n/6)})));return cacheMemo.get(index);}
function cacheHole(index,col,row){const b=stoneBounds(index,col,row),x=stages[index].at+(b.left+b.right)/2,y=(row+.5)*CELL_H;return wallCaches(index).some(a=>Math.abs(a.x-x)<12&&Math.abs(a.y-y)<65);}
const obstacles=[500,1050,1650,2000,2850,3700,4900,6500,8000,...Array.from({length:57},(_,i)=>10000+i*1600)];
// Lookout towers standing on clouds in the cloud world (2 500–7 000 m): they stop or shatter like ground towers.
const witchHut={x:1500,y:1000,halfWidth:26,height:900,size:1000},castleTunnel={x:500,enter:350,exit:650,ramp:115,depth:450,height:400,top:400,body:62},cloudTowers=Array.from({length:44},(_,n)=>({id:n,x:4300+n*2300+(n%3)*170,base:[9000,12900,16500,11100,14700][n%5],h:430,halfWidth:9}));
// The dragon blocks the way at every altitude. From `sight` metres it flies just ahead of the knight and lets him close in at
// a fraction (`close`) of his own speed, so the fight looks the same at any speed and always fits before the magic world.
// Each ram at `minSpeed` or more costs it a heart and throws it back `retreat` metres. When it falls, a portal opens and
// carries the knight past the old 45 km gate into the magic world, which has a ceiling.
const dragonBoss={x:44200,hearts:3,sight:170,retreat:110,close:.5,reach:42,minSpeed:40,portalGap:200},magic={start:stages[5].at+wallWidth(5),exit:stages[5].at+wallWidth(5)+60,ceiling:3200},sorcerer={x:99500,reach:45,sight:170,close:.5};
function stageAt(x){let index=0;for(let i=1;i<stages.length;i++)if(x>=stages[i].at+wallWidth(i))index=i;return index;}
const RAMP={start:160,end:1100,turn:820,top:-180,bottom:410,lip:355};
// Each forge level visibly reshapes the ramp: +110 units of height, +170 of length. A longer slide stretches the descent (60 %)
// and the run-out (40 %); a taller one also pushes the foot out a little so it never turns into a cliff. The takeoff speed keeps
// its own per-level scale (55 and 80), so making the ramp look bigger did not change the balance.
const UPGRADE_STEP={height:110,length:170},SPEED_STEP={height:55,length:80};
let testRamp={height:0,length:0},upgrades={height:0,length:0,hLevel:0,lLevel:0};
function setUpgrades(height=0,length=0){const hLevel=Math.max(0,Math.min(10,height)),lLevel=Math.max(0,Math.min(10,length)),h=hLevel*UPGRADE_STEP.height,l=lLevel*UPGRADE_STEP.length;if(h!==upgrades.height||l!==upgrades.length){upgrades={height:h,length:l,hLevel,lLevel};rampProfiles.clear();}}
function setTestRamp(height=0,length=0){testRamp={height:Math.max(-200,Math.min(800,height)),length:Math.max(-100,Math.min(800,length))};rampProfiles.clear();return {...testRamp};}
function rampGeometry(level=0){const l=Math.max(0,Math.min(24,level)/3),foot=upgrades.height*.35;return {...RAMP,end:RAMP.end+l*180+testRamp.length+upgrades.length+foot,turn:RAMP.turn+l*180+upgrades.length*.6+foot,top:RAMP.top-l*85-testRamp.height-upgrades.height,lip:RAMP.lip-l*12};}
function rampY(x,angle=LAUNCH_ANGLE,level=0){const r=rampGeometry(level);if(x<r.turn)return r.top+(r.bottom-r.top)*Math.pow(Math.max(0,x)/r.turn,2)*(3-2*Math.max(0,x)/r.turn);const length=r.end-r.turn,t=Math.min(1,(x-r.turn)/length),m=-Math.tan(angle*Math.PI/180)*length,m0=0;return (2*t*t*t-3*t*t+1)*r.bottom+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*r.lip+(t*t*t-t*t)*m;}
function rampSlope(x,angle=LAUNCH_ANGLE,level=0){const r=rampGeometry(level);if(x<r.turn)return (r.bottom-r.top)*6/r.turn*(Math.max(0,x)/r.turn)*(1-Math.max(0,x)/r.turn);const length=r.end-r.turn,t=Math.min(1,(x-r.turn)/length),m=-Math.tan(angle*Math.PI/180)*length,m0=0;return ((6*t*t-6*t)*r.bottom+(3*t*t-4*t+1)*m0+(-6*t*t+6*t)*r.lip+(3*t*t-2*t)*m)/length;}
function poseAt(x,angle,level=0){const rotation=Math.atan(rampSlope(x,angle,level));return {x:x+Math.sin(rotation)*(Gear.get(level).standing?30:Gear.get(level).type==='skate'?48:37),y:rampY(x,angle,level)-Math.cos(rotation)*(Gear.get(level).standing?30:Gear.get(level).type==='skate'?48:37),rotation,contactX:x};}
function takeoffSpeed(base,level=0){return Math.min(Gear.get(level).speed*1.4/3.6,Gear.get(level).speed/3.6*Math.sqrt(Math.max(.3,1+(testRamp.height+upgrades.hLevel*SPEED_STEP.height)/650+(testRamp.length+upgrades.lLevel*SPEED_STEP.length)/1800)));}
const rampProfiles=new Map();
function rampProfile(speed=takeoffSpeed(65),angle=LAUNCH_ANGLE,level=0){const r=rampGeometry(level),key=speed+':'+angle+':'+level;if(rampProfiles.has(key))return rampProfiles.get(key);const samples=[],start=rampY(r.start,angle,level),drop=Math.max(1,rampY(r.end,angle,level)-start);let time=0,previous=null;
 for(let i=0;i<=400;i++){const q=i/400,pose=poseAt(r.start+(r.end-r.start)*q,angle,level),energy=Math.max(0,.95*(rampY(pose.contactX,angle,level)-start)/drop+.05*q),v=Math.min(Gear.get(level).speed*1.4/3.6,Math.sqrt(9+(speed*speed-9)*energy)),vx=v*Math.cos(pose.rotation)*X_SCALE*TIME_SCALE;if(previous)time+=(pose.x-previous.x)/((vx+previous.vx)/2);const sample={...pose,time,speed:v,vx};samples.push(sample);previous=sample;}
 const profile={samples,duration:time};rampProfiles.set(key,profile);return profile;}
function launchPose(progress,angle=LAUNCH_ANGLE,speed=takeoffSpeed(65),level=0){const profile=rampProfile(speed,angle,level),time=Math.max(0,Math.min(1,progress))*profile.duration;let lo=0,hi=400;while(lo+1<hi){const mid=(lo+hi)>>1;if(profile.samples[mid].time<time)lo=mid;else hi=mid;}const a=profile.samples[lo],b=profile.samples[hi],t=(time-a.time)/(b.time-a.time),pose=poseAt(a.contactX+(b.contactX-a.contactX)*t,angle,level);const jump=0;return {...pose,y:pose.y-jump,jump,speed:a.speed+(b.speed-a.speed)*t};}
// The flight sprite is anchored at the breastplate, not at the launch deck.
// In the upright jump pose the boots sit 53 px below that anchor.
function flightOrigin(pose,level=0){const normal=Gear.get(level).standing?63:0;return {x:pose.x+Math.sin(pose.rotation)*normal,y:pose.y-Math.cos(pose.rotation)*normal};}
function duration(vx,level=0){return rampProfile(vx/Math.cos(LAUNCH_ANGLE*Math.PI/180),LAUNCH_ANGLE,level).duration;}
// Tunnel under the castle: altitude of the knight's path (negative = underground) for a given x; y0 is the altitude at the entrance.
// Free-flight tunnel: floor and roof altitudes (m, negative = underground). The mouths open at ground level on each side of the castle.
function tunnelFloor(x){const t=castleTunnel,s=q=>{q=Math.max(0,Math.min(1,q));return q*q*(3-2*q);};if(x<=t.enter||x>=t.exit)return 0;return -t.depth*Math.min(s((x-t.enter)/t.ramp),s((t.exit-x)/t.ramp));}
function tunnelRoof(x){return tunnelFloor(x)+castleTunnel.height;}
// The two ends are open trenches: the roof only starts where it sinks below ground level.
function tunnelOpen(x){return x>castleTunnel.enter&&x<castleTunnel.exit&&tunnelRoof(x)>0;}
function tunnelProfile(x,y0=20){const t=castleTunnel,s=q=>{q=Math.max(0,Math.min(1,q));return q*q*(3-2*q);};if(x<=t.enter+t.ramp)return y0+(-t.depth-y0)*s((x-t.enter)/t.ramp);if(x>=t.exit-t.ramp)return -t.depth+(t.depth+12)*s((x-(t.exit-t.ramp))/t.ramp);return -t.depth;}
const api={dragonBoss,magic,sorcerer,UPGRADE_STEP,castleTunnel,tunnelProfile,tunnelFloor,tunnelRoof,tunnelOpen,witchHut,cloudTowers,wallCaches,cacheHole,stoneOffset,stoneColumns,stoneBounds,setUpgrades,flightOrigin,AIR_Y_SCALE,airTravelFactor,setTestRamp,rampGeometry,takeoffSpeed,rampProfile,RAMP,obstacles,SCALE,X_SCALE,LAUNCH_ANGLE,CELL_W,CELL_H,wallWidth,TIME_SCALE,stages,stageAt,rampY,rampSlope,launchPose,duration};if(typeof module!=='undefined')module.exports=api;else root.GGCourse=api;
})(typeof window!=='undefined'?window:globalThis);
