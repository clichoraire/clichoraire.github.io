const assert=require('node:assert/strict');
const G=require('./physics'),M=require('./monsters'),S=require('./specials');
M.collide=()=>{};S.step=()=>{};
// Pull-ups are checked at 600 m: higher up the thin air makes every climb cost more, on purpose (see CLIMB in physics.js).
function fly(wing,hz=120,vx=28,target=.45, fixed=false){
 const s=G.fresh();s.levels.wing=wing;const f=G.create(s);
 Object.assign(f,{y:600,time:3,vx,vy:-10,pitch:fixed?target:0,manualGlide:fixed?6:0});
 for(let i=0;i<hz*2;i++)G.step(f,1/hz,{left:!fixed&&target>0&&f.pitch<target});
 return f;
}
for(const wing of [0,6,11,16]){
 const rise=fly(wing),neutral=fly(wing,120,28,0);
 assert(rise.y>600&&rise.vy>0,'Early equipment must recover height with momentum');
 assert(rise.vx<28,'Climbing spends forward momentum');
 assert(rise.y>neutral.y+200,'Pulling up must meaningfully change trajectory');
 assert(fly(wing,120,6).y<600,'Low speed cannot provide free climbing');
 assert(fly(wing,120,28,1.3).stalled,'Excessive pitch still stalls');
 for(const hz of [30,60])assert(Math.abs(fly(wing,hz,28,.45,true).y-fly(wing,120,28,.45,true).y)<10,'Consistent pull-up across frame rates');
}
console.log('Pull-up: cape, umbrella, kite and delta recover height; momentum cost, low-speed descent, stall and 30/60/120 Hz verified.');

for(let wing=1;wing<=5;wing++){
 const up=fly(wing),level=fly(wing,120,28,0),dive=fly(wing,120,28,-.65,true);
 assert(up.y>600&&up.vy>0,'Balloon pull-up must recover height');
 assert(up.y>level.y+100,'Steering must visibly change balloon trajectory');
 assert(up.vx<28,'Balloon climb spends forward momentum');
 assert(dive.y<level.y&&dive.vx>level.vx,'Balloon dive trades height for speed');
 for(const hz of [30,60])assert(Math.abs(fly(wing,hz,28,.45,true).y-fly(wing,120,28,.45,true).y)<10);
}
console.log('Five balloons: steering, climb, dive, momentum cost and frame-rate consistency verified.');

for(let wing=1;wing<=5;wing++){const slow=fly(wing,120,2,0),fast=fly(wing,120,28,0);assert(slow.vy<fast.vy-5);assert(slow.y<fast.y-80,'Slowing down makes balloons sink faster');}console.log('Balloon speed loss: heavy descent returns at low forward speed.');
