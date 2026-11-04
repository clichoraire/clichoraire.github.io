const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=__dirname+'/';
const env={Image:class{naturalWidth=1774;naturalHeight=887},window:{matchMedia:()=>({matches:false})},GGLaunch:require(root+'launch-gear'),GGCourse:require(root+'course'),GGRiders:{objectHeight:()=>60},state:'launching',launchTime:1,launchDuration:10,flight:{l:{launch:1},launchAngle:20,launchSpeed:40,x:0,y:150,originX:1100,vx:35,vy:12}};
vm.createContext(env);vm.runInContext(fs.readFileSync(root+'art.js','utf8')+';this.m=motion;',env);
function sparks(level,progress){env.resetArt();env.flight.l.launch=level;env.launchTime=progress*10;let total=0;for(let i=0;i<120;i++){env.updateShieldScrape(1/120);total+=env.m.scrape.filter(p=>p.kind==='spark').length;}return total;}
assert(sparks(1,.9)>sparks(1,.05));assert(sparks(2,.9)>sparks(1,.9)*2);assert.equal(sparks(0,.9),0);
for(let level=12;level<=15;level++){env.resetArt();env.flight.l.launch=level;env.releaseSoap();assert.equal(env.m.skates.length,2);assert.equal(env.m.soap,null);for(let i=0;i<1800;i++)for(const skate of env.m.skates)env.stepSoap(skate,1/120);for(const skate of env.m.skates){assert(skate.bounces>=2);assert(skate.resting);}}
for(let level=0;level<25;level++){const d=env.mountedGeometry({x:0,y:0,rotation:.4},level);assert(Number.isFinite(d.height));assert(d.width>0);}
console.log('Étincelles progressives, poêles plus intenses, quatre paires de patins détachées et rebonds : OK.');
