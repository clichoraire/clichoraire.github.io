const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]||__dirname,Course=require(root+'/course');
const env={Image:class{complete=true;naturalWidth=1536;naturalHeight=1024},window:{matchMedia:()=>({matches:false})}};
vm.createContext(env);vm.runInContext(fs.readFileSync(root+'/art.js','utf8'),env);
let checks=0;
for(let frame=0;frame<6;frame++)for(const progress of [0,.15,.35,.55,.75,.9,.99]){
 const pose=Course.launchPose(progress,20,25,0);let x,y,angle,draw;
 const context={save(){},restore(){},translate(a,b){x=a;y=b},rotate(a){angle=a},drawImage(...args){draw=args}};
 env.shieldRiderFrame=()=>frame;
 assert.equal(env.shieldRiderArt(pose,progress,true,context),true);
 const [im,sx,sy,sw,sh,dx,dy,dw,dh]=draw;
 // The actual opaque rim is at source y=471 in every atlas cell.
 const lx=dx+256*dw/sw,ly=dy+471*dh/sh;
 const wx=x+Math.cos(angle)*lx-Math.sin(angle)*ly,wy=y+Math.sin(angle)*lx+Math.cos(angle)*ly;
 const gap=(wy-Course.rampY(pose.contactX,20,0))*Math.cos(angle)-(wx-pose.contactX)*Math.sin(angle);
 assert(Math.abs(gap)<1e-6,`frame ${frame}, progress ${progress}: rim gap ${gap}`);
 assert.equal(angle,pose.rotation);checks++;
}
console.log(`${checks} contacts du premier bouclier validés : six poses, sept positions, bord opaque posé sur la surface peinte.`);

// At release, the illustrated soles must stay above the shield rather than
// dropping below it when switching from the combined rider to the jump sprite.
const G=require(root+'/physics');
for(const angle of [15,20,40]){
 const f=G.create(G.fresh(),angle),deck=Course.launchPose(1,angle,f.launchSpeed,0);
 const rotation=deck.rotation,footOffset=(967-800)*.32;
 const foot={x:f.originX-Math.sin(rotation)*footOffset,y:485-f.y*Course.SCALE+Math.cos(rotation)*footOffset};
 const normalDistance=-(foot.x-deck.x)*Math.sin(rotation)+(foot.y-deck.y)*Math.cos(rotation);
 assert(normalDistance<0&&normalDistance>-15,'jump boots remain on the upper side of the shield');
}
const artSource=fs.readFileSync(root+'/art.js','utf8');
vm.runInContext(artSource.slice(artSource.indexOf('function shieldRiderFrame('),artSource.indexOf('// Continuous wooden support')),env);
for(const p of [.94,.99,.995,.999999])assert.equal(env.shieldRiderFrame(p,1,true,false),4,'no airborne atlas frame before release');
console.log('Décollage : bottes au-dessus du bouclier et aucune pose aérienne furtive sur la rampe.');
