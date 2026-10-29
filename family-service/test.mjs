import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,readFileSync,readdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';import {createRequire} from 'node:module';
import {createService,SHEET,prompt,providerOf} from './server.mjs';import {decode,encode} from './png.mjs';
const FamilySheet=createRequire(import.meta.url)('../families/sheet.js');
const style=readFileSync(new URL('./style-reference.png',import.meta.url));
const blankSheet=()=>encode({width:SHEET.width,height:SHEET.height,data:new Uint8ClampedArray(SHEET.width*SHEET.height*4)});
test('auth, drafts, keyed publication, uploaded sheets, deletion, persistence and budget',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'family-test-')),env={FAMILY_DATA_DIR:dir,FAMILY_ADMIN_CODE:'test-only-code-123456',GEMINI_API_KEY:'test-only',FAMILY_DAILY_LIMIT:'2',FAMILY_ORIGINS:'https://example.test'};let count=0;
 let service=createService({env,generate:async()=>{count++;return {bytes:style,mime:'image/png'};}});await new Promise(r=>service.listen(0,'127.0.0.1',r));let url='http://127.0.0.1:'+service.address().port;
 const req=async(path,body,auth=true,method)=>{const response=await fetch(url+path,{method:method||(body?'POST':'GET'),headers:{...(auth?{Authorization:'Bearer '+env.FAMILY_ADMIN_CODE}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};};
 const settle=()=>new Promise(r=>setTimeout(r,40));
 try{
 assert.equal((await req('/api/session',null,false)).status,401);assert.equal((await req('/api/catalog',null,false)).status,200);
 assert.deepEqual((await req('/health',null,false)).data,{ok:true,provider:'gemini',configured:true});
 const photo='data:image/png;base64,'+style.toString('base64'),sheet='data:image/png;base64,'+blankSheet().toString('base64');
 const body={requestId:randomUUID(),name:'Camille',body:'girl',ageGroup:'child',familyName:'Les Test',photos:[photo],consent:true};
 assert.equal((await req('/api/jobs',{...body,consent:false})).status,400);assert.equal((await req('/api/jobs',{...body,name:'<script>'})).status,400);
 assert.equal((await req('/api/jobs',body)).status,202);await settle();assert.equal((await req('/api/jobs',body)).status,200);assert.equal(count,1);
 const draft=await req('/api/jobs/'+body.requestId);assert.equal(draft.data.status,'ready');assert(draft.data.preview.startsWith('data:image/png;base64,'));assert.equal((await req('/api/catalog',null,false)).data.people.length,0);
 assert.equal((await req('/api/jobs/'+body.requestId,null,false)).status,401);assert.equal((await fetch(url+'/portraits/custom-'+body.requestId+'.png')).status,404);
 // La publication exige la planche détourée au bon format.
 assert.equal((await req('/api/jobs/'+body.requestId+'/publish',{})).status,400);assert.equal((await req('/api/jobs/'+body.requestId+'/publish',{sheet:photo})).status,400);
 assert.equal((await req('/api/jobs/'+body.requestId+'/publish',{sheet})).status,200);assert.equal((await req('/api/jobs/'+body.requestId+'/publish',{sheet})).status,200);
 let catalog=(await req('/api/catalog',null,false)).data;assert.equal(catalog.people.length,1);assert.equal(catalog.families.length,5);
 const portrait=await fetch(url+catalog.people[0].portrait);assert.equal(portrait.status,200);assert.equal(Buffer.from(await portrait.arrayBuffer()).length,blankSheet().length);
 assert.deepEqual(readdirSync(join(dir,'drafts')),[]);
 // Planche fournie telle quelle : prête tout de suite, aucun appel IA, aucun quota consommé.
 const uploaded={...body,requestId:randomUUID(),name:'Zach',familyId:'jo',photos:undefined,sheet:photo};
 const direct=await req('/api/jobs',uploaded);assert.equal(direct.status,200);assert.equal(direct.data.status,'ready');assert.equal(count,1);
 assert.equal((await req('/api/jobs/'+uploaded.requestId+'/publish',{sheet})).status,200);assert.equal((await req('/api/catalog')).data.families.length,5);
 // Quota quotidien : deux générations IA par jour.
 const second={...body,requestId:randomUUID(),familyId:'jo'};assert.equal((await req('/api/jobs',second)).status,202);await settle();assert.equal(count,2);
 assert.equal((await req('/api/jobs',{...body,requestId:randomUUID()})).status,429);
 assert(!readFileSync(join(dir,'catalog.json'),'utf8').includes('photos'));
 // Suppression : réservée au code, retire le portrait et la famille devenue vide.
 catalog=(await req('/api/catalog')).data;const camille=catalog.people.find(p=>p.name==='Camille'),zach=catalog.people.find(p=>p.name==='Zach');
 assert.equal((await req('/api/people/'+camille.id,null,false,'DELETE')).status,401);
 assert.equal((await req('/api/people/custom-'+randomUUID(),null,true,'DELETE')).status,404);
 const removed=await req('/api/people/'+camille.id,null,true,'DELETE');assert.equal(removed.status,200);assert.equal(removed.data.families.length,4);assert.equal(removed.data.people.length,1);
 assert.equal((await fetch(url+camille.portrait)).status,404);assert.equal((await req('/api/jobs/'+camille.jobId)).status,404);
 assert.equal((await req('/api/people/'+zach.id,null,true,'DELETE')).data.families.length,4);
 assert.deepEqual(readdirSync(join(dir,'portraits')),[]);
 // Redémarrage : catalogue et quota conservés.
 await new Promise(r=>service.close(r));service=createService({env,generate:async()=>({bytes:style,mime:'image/png'})});await new Promise(r=>service.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+service.address().port;
 assert.equal((await req('/api/catalog')).data.people.length,0);assert.equal((await req('/api/jobs',{...body,requestId:randomUUID()})).status,429);
 }finally{await new Promise(r=>service.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('providers and prompt',()=>{
 assert.equal(providerOf({}).id,'gemini');assert.equal(providerOf({}).configured,false);assert.equal(providerOf({GEMINI_API_KEY:'x'}).configured,true);
 assert.equal(providerOf({FAMILY_PROVIDER:'mock'}).configured,true);assert.throws(()=>providerOf({FAMILY_PROVIDER:'dalle'}));
 assert.match(prompt(2,'BG.'),/first 2 images show/);assert.match(prompt(1,'BG.'),/first 1 image shows/);assert.match(prompt(1,'BG.'),/BG\./);
});
test('sheet: green background keyed out, edges unmixed, three heads located',()=>{
 const original=decode(style);const {width,height,data}=original;
 // Compose la référence (transparente) sur un vert presque pur, comme le fera Gemini.
 const green=[4,252,6],flat=new Uint8ClampedArray(data.length);
 for(let i=0;i<data.length;i+=4){const a=data[i+3]/255;for(let k=0;k<3;k++)flat[i+k]=Math.round(data[i+k]*a+green[k]*(1-a));flat[i+3]=255;}
 const result=FamilySheet.process({width,height,data:flat});
 assert.equal(result.keyed,true);assert.deepEqual([result.bg.r,result.bg.g,result.bg.b],green);
 let sumAlpha=0,bad=0,sumColor=0,opaque=0;
 for(let i=0;i<data.length;i+=4){const d=Math.abs(result.data[i+3]-data[i+3]);sumAlpha+=d;if(d>60)bad++;if(data[i+3]>=250){opaque++;for(let k=0;k<3;k++)sumColor+=Math.abs(result.data[i+k]-flat[i+k]);}}
 const pixels=data.length/4;assert(sumAlpha/pixels<3,'alpha moyen '+(sumAlpha/pixels));assert(bad/pixels<.005,'pixels très faux '+(bad/pixels));assert(sumColor/opaque<1,'les pixels opaques gardent leur couleur : écart moyen '+(sumColor/opaque));
 assert.equal(result.cells.length,3);assert(result.cells.every(c=>!c.empty));
 const expected=FamilySheet.cells(width,height,data);
 result.cells.forEach((c,i)=>{for(const k of ['x0','x1','y0','y1'])assert(Math.abs(c[k]-expected[i][k])<=3,`cellule ${i} ${k}: ${c[k]} vs ${expected[i][k]}`);});
 assert(expected[0].x1<expected[1].x0&&expected[1].x1<expected[2].x0,'trois têtes séparées');
 // Image déjà transparente : rien à détourer. Image vide : trois tiers vides.
 assert.equal(FamilySheet.process(original).keyed,false);
 const blank=FamilySheet.process({width:300,height:100,data:new Uint8ClampedArray(300*100*4).map((_,i)=>i%4===1||i%4===3?255:0)});
 assert.equal(blank.keyed,true);assert.equal(blank.cells.length,3);assert(blank.cells.every(c=>c.empty));assert.deepEqual([blank.cells[1].x0,blank.cells[1].x1],[100,199]);
 // Le codec PNG de test fait l'aller-retour.
 const again=decode(encode(original));assert.equal(again.width,width);assert.deepEqual(Array.from(again.data.subarray(0,4000)),Array.from(data.subarray(0,4000)));
});
