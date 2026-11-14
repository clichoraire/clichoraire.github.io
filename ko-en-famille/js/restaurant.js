// Une visite au restaurant : une commande, un repas, des bonus pour le prochain match.
(function(root){
'use strict';
const B=root.BX,A=B.art,R=B.restaurant={};
R.meals=[
 {id:'spaghetti',name:'Spaghetti',icon:'🍝',price:10,bonus:{hearts:.12}},
 {id:'sandwich',name:'Sandwich',icon:'🥪',price:8,bonus:{hp:.10}},
 {id:'riz',name:'Riz au poulet',icon:'🍗',price:12,bonus:{dmg:.08}},
 {id:'pate',name:'Pâté chinois',icon:'🥧',price:14,bonus:{hp:.08,hearts:.08}}
];
const labels={hp:'vie',hearts:'stamina',dmg:'force de frappe'};
R.describe=b=>Object.keys(labels).filter(k=>b[k]>0).map(k=>'+'+Math.round(b[k]*100)+' % '+labels[k]).join(' · ')||'Aucun bonus en réserve';
R.totals=c=>{const b={};for(const k of Object.keys(labels)){const n=Number(c.mealBuffs?.[k]);if(Number.isFinite(n)&&n>0)b[k]=n;}if(Number.isFinite(c.mealBonus)&&c.mealBonus>0)b.hp=(b.hp||0)+c.mealBonus;return b;};
R.purchase=(c,id)=>{const meal=R.meals.find(m=>m.id===id);if(!meal||!Number.isFinite(c.gold)||c.gold<meal.price)return null;const b=R.totals(c);for(const [k,v] of Object.entries(meal.bonus))b[k]=(b[k]||0)+v;c.gold-=meal.price;c.mealBuffs=b;delete c.mealBonus;return meal;};
R.consume=c=>{const b=R.totals(c);delete c.mealBuffs;delete c.mealBonus;return b;};
R.apply=(mods,bonus)=>{const out={...mods};for(const [k,v] of Object.entries(bonus))out[k]=(out[k]||0)+v;return out;};
let S=null;R.state=()=>S;
const el=id=>document.getElementById(id);
R.start=cfg=>{S={...cfg,phase:'menu',t:0,total:0,meal:null};
 el('restaurant-menu').classList.remove('hidden');el('restaurant-done').classList.add('hidden');
 el('restaurant-wallet').textContent=cfg.career.gold+' pièces d’or';
 el('restaurant-reserve').textContent='Prochain match : '+R.describe(R.totals(cfg.career));
 el('restaurant-options').innerHTML=R.meals.map(m=>'<button class="meal-choice" data-meal="'+m.id+'" '+(cfg.career.gold<m.price?'disabled':'')+'><span>'+m.icon+'</span><b>'+m.name+'</b><small>'+R.describe(m.bonus)+'</small><em>'+m.price+' or</em></button>').join('');
 el('restaurant-options').querySelectorAll('button').forEach(button=>button.onclick=()=>R.order(button.dataset.meal));
 el('restaurant-leave').onclick=()=>R.leave();el('restaurant-done').onclick=()=>R.leave();
};
R.order=id=>{if(!S||S.phase!=='menu')return false;const meal=R.purchase(S.career,id);if(!meal)return false;S.meal=meal;S.phase='served';S.t=0;S.onPurchase();el('restaurant-menu').classList.add('hidden');el('restaurant-wallet').textContent=S.career.gold+' pièces d’or';el('restaurant-reserve').textContent='Prochain match : '+R.describe(R.totals(S.career));B.audio.play('select');return true;};
R.leave=()=>{if(S&&['menu','bonus'].includes(S.phase)){const state=S;S=null;state.onLeave(!!state.meal);}};
R.update=dt=>{if(!S)return;S.t+=dt;S.total+=dt;if(S.phase==='served'&&S.t>=1.8){S.phase='eating';S.t=0;}else if(S.phase==='eating'&&S.t>=4.8){S.phase='bonus';S.t=0;el('restaurant-done').classList.remove('hidden');B.audio.play('star');}};
function text(c,t,x,y,size=24,col='#fff0d1'){c.fillStyle=col;c.font='900 '+size+'px Nunito';c.textAlign='center';c.fillText(t,x,y);}
function shape(c,x,y,w,h,col,r=16){c.fillStyle=col;A.rr(c,x,y,w,h,r);c.fill();}
function diner(c,ch,x,y,k,eating=0){
 if(B.KIDS.includes(ch.id)&&B.familyBody){c.save();c.translate(x,y);c.scale(k,k);shape(c,-100,-42,200,240,'#592e33',35);const t=(1-Math.cos(eating*Math.PI*2))*.5,h={x:68-36*t,y:110-110*t};c.beginPath();c.rect(-130,-150,260,280);c.clip();B.familyBody.equipment(c,ch,0,72,.92,{view:'front',still:true,hands:[{x:-65,y:110},h]});if(eating){c.strokeStyle='#dce3e2';c.lineWidth=5;c.beginPath();c.moveTo(h.x,h.y);c.lineTo(h.x-24,h.y-30);c.stroke();c.fillStyle='#ebc46a';A.ell(c,h.x-24,h.y-30,10,6);c.fill();}c.restore();return;}
c.save();c.translate(x,y);c.scale(k,k);shape(c,-100,-42,200,240,'#592e33',35);shape(c,-72,38,144,165,ch.tank||'#487d99',35);
 const img=root.FamilyHeads?.frame(ch.id,'front');if(img)c.drawImage(img,-75,-119,150,150*img.height/img.width);else{c.fillStyle=ch.skin||'#d8a078';A.ell(c,0,-30,52,68);c.fill();text(c,'☺',0,-8,60,'#643b2b');}
 if(eating){const t=(1-Math.cos(eating*Math.PI*2))*.5,handX=80-48*t,handY=155-155*t;c.strokeStyle=ch.skin||'#e9b48a';c.lineWidth=24;c.lineCap='round';c.beginPath();c.moveTo(65,85);c.lineTo(105,145);c.lineTo(handX,handY);c.stroke();c.strokeStyle='#dce3e2';c.lineWidth=5;c.beginPath();c.moveTo(handX,handY);c.lineTo(handX-24,handY-30);c.stroke();c.fillStyle='#ebc46a';A.ell(c,handX-24,handY-30,10,6);c.fill();}c.restore();}
function dish(c,id,x,y,scale=1,portion=1){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#b6c8c5';A.ell(c,0,4,150,60);c.fill();c.fillStyle='#fff5dd';A.ell(c,0,0,145,55);c.fill();c.strokeStyle='#b47751';c.lineWidth=3;c.beginPath();c.ellipse(0,0,124,43,0,0,Math.PI*2);c.stroke();
 c.save();c.beginPath();c.rect(-120,-100,240*portion,180);c.clip();
 if(id==='spaghetti'){for(let i=0;i<20;i++){c.strokeStyle=i%3?'#edb84e':'#c75235';c.lineWidth=7;c.beginPath();c.ellipse(Math.sin(i*3)*55,Math.cos(i*2)*13,32,12,i*.4,0,Math.PI*1.7);c.stroke();}for(const x of [-34,5,40]){c.fillStyle='#8a4a31';A.ell(c,x,-13,16,12);c.fill();}}
 else if(id==='sandwich'){for(const [dy,col] of [[8,'#ba793f'],[1,'#7eae52'],[-7,'#c44c37'],[-14,'#efcf7c']]){c.fillStyle=col;c.beginPath();c.moveTo(-85,dy+15);c.lineTo(70,dy+15);c.lineTo(-10,dy-42);c.closePath();c.fill();}}
 else if(id==='riz'){for(let i=0;i<85;i++){c.fillStyle=i%4?'#f1dfac':'#d9b965';A.ell(c,Math.sin(i*8)*85,Math.cos(i*3)*24,7,3);c.fill();}for(let i=0;i<5;i++){c.fillStyle='#b66d35';A.ell(c,-55+i*26,-12+Math.sin(i)*10,18,11);c.fill();}}
 else {shape(c,-82,-6,164,32,'#825039',3);shape(c,-82,-17,164,16,'#f3ce62',3);shape(c,-82,-35,164,22,'#f1db9d',6);for(let i=0;i<9;i++){c.strokeStyle='#c49452';c.lineWidth=2;c.beginPath();c.moveTo(-70+i*17,-30);c.lineTo(-62+i*17,-18);c.stroke();}}
 c.restore();c.restore();}
R.render=c=>{if(!S)return;const {phase,t,total,ch,coach,meal}=S;
 c.save();const bg=c.createLinearGradient(0,0,0,720);bg.addColorStop(0,'#452b39');bg.addColorStop(1,'#ad7254');c.fillStyle=bg;c.fillRect(0,0,1280,720);
 // Fenêtres, banquettes, lampes et tables de la salle à manger.
 for(const x of [75,990]){shape(c,x,95,215,240,'#cc9f69',8);shape(c,x+10,105,195,220,'#39566a',5);c.fillStyle='#718791';c.fillRect(x+100,105,8,220);c.fillRect(x+10,200,195,8);shape(c,x-25,310,265,130,'#783e43',22);shape(c,x-35,395,285,32,'#dfbb87',9);}
 for(const x of [340,940]){c.strokeStyle='#cfad75';c.lineWidth=4;c.beginPath();c.moveTo(x,0);c.lineTo(x,115);c.stroke();c.fillStyle='#eac481';c.beginPath();c.moveTo(x-52,155);c.lineTo(x-24,105);c.lineTo(x+24,105);c.lineTo(x+52,155);c.closePath();c.fill();}
 text(c,'CHEZ LE CHAMPION',640,108,30,'#f6d49b');
 diner(c,coach,640,273,.82);text(c,coach.name+' · ton coach',640,192,19);
 shape(c,170,395,940,330,'#74412e',55);shape(c,185,399,910,292,'#c38c5e',48);shape(c,570,400,140,300,'#e9d0a4',5);
 for(const x of [430,860]){c.fillStyle='#e4ece5';A.ell(c,x,438,23,8);c.fill();c.fillStyle='rgba(166,211,220,.6)';c.fillRect(x-18,392,36,45);}
 if(phase==='menu'){
  text(c,'« Choisis ton repas, champion ! »',640,375,24);
  for(const side of [-1,1]){c.save();c.translate(640+side*445,610);c.rotate(side*.23);shape(c,-25,-15,68,155,ch.skin||'#e8b58c',28);c.restore();}
 }else{
  diner(c,ch,350,450,.95,phase==='eating'?t/.95:0);
  const portion=phase==='served'?1:phase==='eating'?Math.max(.03,1-t/4.8):0;
  dish(c,meal.id,600,phase==='served'?510+Math.max(0,1-t/.6)*110:565,1,portion);
  text(c,phase==='served'?'Voilà ton '+meal.name.toLowerCase()+' !':phase==='eating'?'Bon appétit, '+ch.name+' !':'BONUS ACTIVÉ !',815,470,28,'#fff0b2');
  if(phase==='bonus'){
   c.save();c.globalAlpha=.18+.06*Math.sin(t*4);c.strokeStyle='#ffe27e';c.lineWidth=12;for(let i=0;i<3;i++){c.beginPath();c.ellipse(350,480,115+i*25,145+i*15,0,0,Math.PI*2);c.stroke();}c.restore();
   for(let i=0;i<42;i++){const x=260+((i*173)%850),y=160+((i*97+t*65)%420);c.fillStyle=['#ffe17d','#9be1bb','#efa6af'][i%3];c.save();c.translate(x,y);c.rotate(t+i);c.fillRect(-4,-5,8,10);c.restore();}
   text(c,R.describe(meal.bonus),920,515,23,'#baf1c8');text(c,'Les repas s’additionnent !',920,552,20);text(c,'Pour ton prochain match.',920,582,18);
  }
 }
 c.restore();};
})(window);
