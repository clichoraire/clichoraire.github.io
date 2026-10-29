const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');global.window=global;global.localStorage={getItem:()=>null,setItem:()=>{}};
const root=require('path').resolve(__dirname,'..');
for(const f of ['config','utils','hero-progression','map','units','ai','game','campaign'])vm.runInThisContext(fs.readFileSync(root+'/js/'+f+'.js','utf8'));
const c=new ZC.Campaign();
for(const m of ZC.MISSIONS){const s=c.missionSettings(m.id,'hard');if(!s.invasion){assert.equal(s.teams.length,s.aiCount+1);assert.ok(s.teams.slice(1).filter(x=>x!==0).every(x=>x===1));}}
const s=c.missionSettings('w1m2','hard'),g=new ZC.Game(s);assert.equal(g.map.zones.length,10);assert.ok(g.allied(1,2));assert.ok(!g.allied(0,1));assert.equal(g.human.hq.zone.ix,0);
for(const z of g.map.zones){assert.equal(g.map.zoneIndexAt(z.cx,z.cy),z.id);assert.ok(g.map.neighbors(z).length);}
assert.equal(g.map.zone(2,0),null);
for(let i=0;i<1800;i++)g.update(1/30);
for(const u of g.units.filter(u=>!u.dead))assert.ok(g.map.zoneAt(u.x,u.y),'unit outside map');
const normal=new ZC.Game(c.missionSettings('w1m2','easy'));assert.equal(normal.map.zones.length,5);
console.log('Alliances des 60 missions, carte de 10 zones, 60 secondes de simulation et couloir normal : OK');
const P=ZC.ZONE_PX;let x=P*.5,y=P*2.5;const tx=P*5.5,ty=P*.5;
for(let i=0;i<5000;i++){const v=g.map.waypoint(x,y,tx,ty),d=Math.hypot(v.x-x,v.y-y);if(d<.01)break;const k=Math.min(3,d)/d;x+=(v.x-x)*k;y+=(v.y-y)*k;assert.ok(g.map.zoneAt(x,y));}
assert.ok(Math.hypot(x-tx,y-ty)<1,'path reaches opposite wing');console.log('Traversée entre les ailes opposées : OK');
