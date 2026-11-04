const assert=require('node:assert/strict'),History=require('./rewind'),G=require('./physics');
const h=new History();let f=G.create(G.fresh());
for(let n=0;n<120;n++){G.step(f,1/120,{});h.record(n/120,{flight:f,motion:{particles:[{x:n}]}});}
const before=f.time,frame=h.back();assert(frame.flight.time<before-.2);assert(frame.flight.broken instanceof Set);assert(frame.flight.wallsBroken instanceof Set);
const restored=structuredClone(frame.flight),expected=structuredClone(frame.flight);for(let n=0;n<20;n++){G.step(restored,1/120,{});G.step(expected,1/120,{});}assert.deepEqual(restored,expected);
frame.motion.particles[0].x=-999;assert.notEqual(h.frames.at(-1).value.motion.particles[0].x,-999);
const t=h.frames.at(-1).time;h.record(t+.1,{flight:restored});assert(h.frames.at(-1).time<t+.2);
for(let n=0;n<5000;n++)h.record(10+n*.05,{n});assert(h.frames.length<=201);
while(h.available)assert(h.back());assert.equal(h.back(),null);h.clear();assert.equal(h.frames.length,0);
console.log('Rewind: restored Sets, clone isolation, deterministic resume, future branch discarded, 201-frame bound, oldest frame and reset OK.');
