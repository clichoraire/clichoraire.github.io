import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';import {createService} from './server.mjs';
test('auth, private draft, publication, idempotency, persistence and budget',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'family-test-')),env={FAMILY_DATA_DIR:dir,FAMILY_ADMIN_CODE:'test-only-code-123456',OPENAI_API_KEY:'test-only',FAMILY_DAILY_LIMIT:'2',FAMILY_ORIGINS:'https://example.test'};let count=0;
 const image=Buffer.alloc(32);image.writeUInt32BE(0x89504e47,0);image.writeUInt32BE(1536,16);image.writeUInt32BE(1024,20);
 let service=createService({env,generate:async()=>{count++;return image;}});await new Promise(r=>service.listen(0,'127.0.0.1',r));let url='http://127.0.0.1:'+service.address().port;
 const req=async(path,body,auth=true)=>{const response=await fetch(url+path,{method:body?'POST':'GET',headers:{...(auth?{Authorization:'Bearer '+env.FAMILY_ADMIN_CODE}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};};
 try{
 assert.equal((await req('/api/session',null,false)).status,401);assert.equal((await req('/api/catalog',null,false)).status,200);
 const photo='data:image/png;base64,'+readFileSync(new URL('./style-reference.png',import.meta.url)).toString('base64');
 const body={requestId:randomUUID(),name:'Camille',body:'girl',ageGroup:'child',familyName:'Les Test',photos:[photo],consent:true};
 assert.equal((await req('/api/jobs',{...body,consent:false})).status,400);assert.equal((await req('/api/jobs',{...body,name:'<script>'})).status,400);
 assert.equal((await req('/api/jobs',body)).status,202);await new Promise(r=>setTimeout(r,30));assert.equal((await req('/api/jobs',body)).status,200);assert.equal(count,1);
 const draft=await req('/api/jobs/'+body.requestId);assert.equal(draft.data.status,'ready');assert(draft.data.preview.startsWith('data:image/png;'));assert.equal((await req('/api/catalog',null,false)).data.people.length,0);
 assert.equal((await req('/api/jobs/'+body.requestId,null,false)).status,401);assert.equal((await fetch(url+'/portraits/custom-'+body.requestId+'.png')).status,404);
 assert.equal((await req('/api/jobs/'+body.requestId+'/publish',{})).status,200);assert.equal((await req('/api/jobs/'+body.requestId+'/publish',{})).status,200);
 const catalog=(await req('/api/catalog',null,false)).data;assert.equal(catalog.people.length,1);assert.equal(catalog.families.length,5);assert.equal((await fetch(url+catalog.people[0].portrait)).status,200);
 const second={...body,requestId:randomUUID(),familyId:'jo'};assert.equal((await req('/api/jobs',second)).status,202);await new Promise(r=>setTimeout(r,30));await req('/api/jobs/'+second.requestId+'/publish',{});assert.equal((await req('/api/catalog')).data.families.length,5);
 assert.equal((await req('/api/jobs',{...body,requestId:randomUUID()})).status,429);
 assert(!readFileSync(join(dir,'catalog.json'),'utf8').includes('photos'));
 await new Promise(r=>service.close(r));service=createService({env,generate:async()=>image});await new Promise(r=>service.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+service.address().port;assert.equal((await req('/api/catalog')).data.people.length,2);assert.equal((await req('/api/jobs',{...body,requestId:randomUUID()})).status,429);
 }finally{await new Promise(r=>service.close(r));rmSync(dir,{recursive:true,force:true});}
});
