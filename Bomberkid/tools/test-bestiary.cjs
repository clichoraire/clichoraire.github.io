const assert=require('node:assert/strict'),BK=require('./headless');
let count=0;const ok=(v,msg)=>{assert.ok(v,msg);count++;};
const make=()=>{const W=new BK.World({map:['#############',...Array(9).fill('#...........#'),'#############'],mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),7,5);p.invuln=999;return{W,p};};
const tick=(W,s)=>{for(let i=0;i<s*60;i++)W.update(1/60);};
const grad={addColorStop(){}};const ctx=new Proxy({createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
ok(BK.BESTIARY.length===142,'complete catalog including variants');
ok(new Set(BK.BESTIARY.map(x=>x.id)).size===BK.BESTIARY.length,'unique IDs');
for(const b of BK.BESTIARY){
 const {W,p}=make(),e=W.addEnemy(b.id,4,5);e.cool=0;
 for(let i=0;i<24*60;i++){if(i===720)e.hp=Math.ceil(e.maxHp/2);W.update(1/60);}
 ok(Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.hp),b.name+' simulation');
 for(const shot of W.shots)ok([shot.x,shot.y,shot.z].every(Number.isFinite),b.name+' projectile');
 for(const state of ['walk','hidden'])BK.sprites.drawEnemy(ctx,b.id,{s:60,t:2,state,hurt:1,warning:true});
 if(!e.dead){e.state='walk';e.hurt=0;e.z=.4;W.hurtEnemy(e,p,999,'bomb');ok(e.dead,b.name+' bomb vulnerability');}
 const E=new BK.Editor({name:'Test',cols:13,rows:11,theme:'garden',base:'.'});E.item=BK.EDITOR_TABS.find(t=>t.id==='bestiary').items.find(i=>i.enemy===b.id);E.paint(4,5,true);const json=JSON.parse(E.code());ok(json.enemies.some(e=>e.type===b.id),b.name+' exported');
}
{const{W,p}=make(),e=W.addEnemy('alt_creeper',6,5);tick(W,.7);ok(e.fuse>0,'creeper warns');p.x=10.5;tick(W,.05);ok(e.fuse===0&&!e.dead,'creeper cancels when escaped');p.x=e.x+.5;p.y=e.y;tick(W,1.6);ok(e.dead&&W.flames.length>0,'creeper explosion');}
{const{W,p}=make(),e=W.addEnemy('alt_bomb_soldier',4,5);tick(W,3);ok(W.bombs.some(b=>b.owner===e),'soldier throws real bomb');}
{const{W,p}=make(),e=W.addEnemy('alt_thief',7,5);p.gold=10;e.cool=0;tick(W,.02);ok(p.gold===5&&e.stolen===5,'thief steals finite gold');e.hurt=0;W.hurtEnemy(e,p,99,'bomb');ok(W.items.filter(i=>i.type==='coin').length>=5,'thief returns gold');}
{const{W,p}=make(),e=W.addEnemy('alt_beamos',3,5);W.cells[W.idx(5,5)]=1;p.invuln=0;const hp=p.hp;W.performBestiaryAttack(e,{kind:'beam',x:p.x,y:p.y});ok(p.hp===hp,'beam respects wall');}
{const{W,p}=make(),e=W.addEnemy('alt_zol',4,5);W.hurtEnemy(e,p,99,'bomb');ok(W.enemies.filter(x=>x.fragment).length===2,'zol splits');}
{const{W}=make(),e=W.addEnemy('alt_wallmaster',4,5);e.warning={kind:'drop',x:7.5,y:5.5,t:.5,max:1};ok(BK.ai.allyArenaDanger(W)[W.idx(7,5)]===0,'allies avoid warnings');}
{for(const b of BK.BESTIARY.filter(b=>b.group==='bosses')){const{W}=make(),e=W.addEnemy(b.id,4,5);e.hp=e.maxHp/2;tick(W,.02);ok(e.phase===2&&e.enraged,b.name+' second phase');}}
{const{W}=make(),e=W.addEnemy('alt_ganon',4,5);e.warning={kind:'fire',x:7.5,y:5.5,t:.5,max:1};const cam=new BK.Camera(1280,720);cam.fit(13,11);W.render(ctx,cam,{noBackground:true,noShake:true});ok(true,'world rendering with boss warning');}
{ok(BK.CHALLENGES.every(ch=>BK.CHALLENGE_ISLANDS.filter(g=>g.kind===ch.kind).length===1),'all challenges accessible through one island');}
console.log(count+' bestiary checks passed');
