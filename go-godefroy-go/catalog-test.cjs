const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('./physics'),L=require('./launch-gear'),C=require('./course'),E=require('./equipment'),S=require('./sound');
assert.equal(L.items.length,25);assert.equal(new Set(L.items.map(g=>E.svg('launch',g.id))).size,25);
const s=G.fresh();s.gold=1e8;
for(let l=0;l<25;l++){
 if(l)assert.ok(G.buy(s,'launch'));assert.equal(s.levels.launch,l);assert.equal(G.owned(s,'launch'),l);
 const gold=s.gold;assert.ok(G.equip(s,'launch',0));assert.equal(s.gold,gold);assert.equal(G.owned(s,'launch'),l);assert.ok(G.equip(s,'launch',l));
 assert.equal(fs.readFileSync(`./go-godefroy-go/assets/equipment/launch-${l}.svg`,'utf8'),E.svg('launch',l));
 const f=G.create(s),p=C.launchPose(1,C.LAUNCH_ANGLE,f.launchSpeed,l);assert.ok(Number.isFinite(f.vx));assert.ok(Math.abs(f.y-(485-C.flightOrigin(p,l).y)/C.SCALE)<1e-8);
 assert.equal(p.contactX,C.rampGeometry(l).end);assert.equal(p.jump,0);assert.ok(Math.abs(f.vx-Math.cos(p.rotation)*f.launchSpeed)<1e-8);if(L.get(l).standing)assert.ok(f.vy>Math.sin(-p.rotation)*f.launchSpeed);
}
assert.equal(G.buy(s,'launch'),false);assert.equal(G.equip(s,'launch',25),false);assert.ok(G.equip(s,'launch',8));const loaded=G.sanitize(JSON.parse(JSON.stringify(s)));assert.equal(loaded.levels.launch,8);assert.equal(loaded.owned.launch,24);assert.equal(G.buy(loaded,'launch'),false);
for(let old=0;old<=8;old++){const migrated=G.sanitize({version:1,levels:{launch:old},gold:500});assert.equal(migrated.levels.launch,L.legacy[old]);assert.equal(migrated.owned.launch,L.legacy[old]);assert.deepEqual(G.sanitize(migrated),migrated);}
for(const c of G.categories){const a=G.fresh();a.gold=1e6;assert.ok(G.buy(a,c.id));const gold=a.gold;assert.ok(G.equip(a,c.id,0));assert.ok(G.equip(a,c.id,1));assert.equal(a.gold,gold);assert.equal(G.equip(a,c.id,2),false);}
assert.equal(S.ambience({phase:'launching',progress:.5,speed:100,launchType:'carpet'}).ramp,0);
const source=fs.readFileSync('./go-godefroy-go/game.js','utf8'),calls=[];
const scope=vm.createContext({background:false,frameId:42,keys:{boost:true},state:'flight',paused:false,sound:true,accumulator:2,last:0,document:{body:{dataset:{}}},performance:{now:()=>1000},loop(){},cancelAnimationFrame:id=>calls.push(['cancel',id]),requestAnimationFrame:()=>{calls.push(['frame']);return 43;},togglePause(){scope.paused=!scope.paused;},soundEngine:{silence:()=>calls.push(['silence'])},audio:{suspend:()=>{calls.push(['suspend']);return Promise.resolve();},resume:()=>{calls.push(['resume']);return Promise.resolve();}}});
vm.runInContext(source.slice(source.indexOf('function setBackground('),source.indexOf("window.addEventListener('blur',()=>setBackground")),scope);
scope.setBackground(true);assert.equal(scope.frameId,0);assert.equal(scope.paused,true);assert.equal(scope.document.body.dataset.suspended,'true');assert.ok(calls.some(c=>c[0]==='suspend'));const count=calls.length;scope.setBackground(true);assert.equal(calls.length,count);scope.setBackground(false);assert.equal(scope.frameId,43);assert.equal(scope.last,1000);assert.equal(scope.accumulator,0);assert.equal(scope.paused,true);
console.log('25 objets distincts, achats/rééquipement gratuits, migration stable, saut au bord, tapis silencieux et arrêt/reprise du rendu et de l’audio : OK.');
const art=fs.readFileSync('./go-godefroy-go/art.js','utf8'),poseScope=vm.createContext({});vm.runInContext(art.slice(art.indexOf('function launchPoseFrame'),art.indexOf('// Illustrated poses')),poseScope);
assert.equal(poseScope.launchPoseFrame(.2,0,true),0);assert.equal(poseScope.launchPoseFrame(.2,.4,true),1);
assert.equal(poseScope.launchPoseFrame(.7,0,true),0);assert.equal(poseScope.launchPoseFrame(.9,0,true),2);assert.equal(poseScope.launchPoseFrame(.98,0,true),2);assert.equal(poseScope.launchPoseFrame(.999,0,true),2);assert.equal(poseScope.launchPoseFrame(1,0,true),3);assert.equal(poseScope.launchPoseFrame(.2,.4,true,true),0);
console.log('Images successives : équilibre, accroupissement, saut et Superman validés.');
