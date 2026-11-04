const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname;
class Asset{set src(src){const data=fs.readFileSync(path.join(root,src));this.naturalWidth=data.readUInt32BE(16);this.naturalHeight=data.readUInt32BE(20);this.complete=true;queueMicrotask(()=>this.onload());}}
const scope={window:{},Image:Asset,Promise,Error};vm.createContext(scope);vm.runInContext(fs.readFileSync(root+'/riders.js','utf8'),scope);
(async()=>{const R=scope.window.GGRiders;await R.ready;assert.ok(R.loaded);let calls=0;const c={save(){},restore(){},translate(){},rotate(){},drawImage(im,x,y,w,h,dx,dy,dw,dh){assert.ok(x>=0&&y>=0&&x+w<=im.naturalWidth&&y+h<=im.naturalHeight);assert.ok(dw>0&&dh>0);assert.ok([x,y,w,h,dx,dy,dw,dh].every(Number.isFinite));calls++;}};
for(let level=0;level<25;level++){for(let pose=0;pose<3;pose++)assert.ok(R.drawRider(c,level,pose,0,0,170));assert.ok(R.drawObject(c,level,0,0,170));assert.ok(R.objectHeight(level,170)>0);assert.ok(R.riderHeight(level,170)<350);}
assert.equal(calls,100);assert.ok(!fs.readFileSync(root+'/equipment.js','utf8').includes('getImageData'));console.log('100 illustrations vérifiées : cadrage dans les images, dimensions finies, 25 objets et 3 poses chacun, chargement indépendant de la lecture de pixels.');})();
