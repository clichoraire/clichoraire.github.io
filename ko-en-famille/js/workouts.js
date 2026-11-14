// Ateliers du coach : chaque exercice garde ses règles, ses gestes et son objectif.
(function(root){
'use strict';
const BX=root.BX,G=BX.gym,A=BX.art,AU=BX.audio,X=G.extra={defs:{}};
const easy=G.isEasy,tune=G.tune;
X.eggWindow=s=>tune(s,[{start:.88,end:1.16},{start:.93,end:1.13},{start:.96,end:1.12}]);
X.sledWindow=s=>tune(s,[.35,.25,.18]);
X.sushiWindow=s=>tune(s,[90,82,78]);
X.sushiSpeed=s=>tune(s,[250,450,680]);
X.sushiInterval=s=>tune(s,[[.74,1.75],[.40,1.0],[.28,.72]]);
X.vegetables=[
 {id:'brocoli',name:'Brocoli',icon:'🥦'}, {id:'carotte',name:'Carotte',icon:'🥕'},
 {id:'tomate',name:'Tomate',icon:'🍅'}, {id:'aubergine',name:'Aubergine',icon:'🍆'},
 {id:'mais',name:'Maïs',icon:'🌽'}, {id:'champignon',name:'Champignon',icon:'🍄'},
 {id:'oignon',name:'Oignon',icon:'🧅'}, {id:'ail',name:'Ail',icon:'🧄'},
 {id:'poivron',name:'Poivron',icon:'🫑'}, {id:'patate',name:'Pomme de terre',icon:'🥔'}
];
X.sushiFoods=[...X.vegetables,{id:'maki',name:'Maki',icon:'🍣'},{id:'onigiri',name:'Onigiri',icon:'🍙'},{id:'gyoza',name:'Gyoza',icon:'🥟'},{id:'crevette',name:'Crevette',icon:'🍤'},{id:'ramen',name:'Ramen',icon:'🍜'},{id:'mochi',name:'Mochi',icon:'🍡'}];
X.tireFallSpeed=s=>tune(s,[.12,.18,.23]);
X.hammerAngle=s=>tune(s,[.55,.46,.38]);
X.hammerPower=s=>tune(s,[.55,.62,.68]);
const clamp=A.clamp,rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
function define(id,stat,name,icon,controls,goal,goalLabel,actions){
 X.defs[id]={id,stat,name,icon,controls,how:controls,goal,goalLabel,actions};
 G.LEVELS[id]=Array.from({length:10},(_,i)=>i===0?'Apprends le geste':i===9?'Défi champion':'Cadence et précision '+(i+1));
}
define('cibles','vitesse','Les six cibles','🎯','↓ + Z/X : bas · Z/X : haut du corps · ↑ + Z/X : visage',18,'cibles frappées',40);
define('parade','defense','Mitaines défensives','🛡️','↑ / ↓ : hauteur · Z / X : bloc gauche / droit au contact',16,'parades précises',38);
// Conservé uniquement pour lire les anciens identifiants ; absent de la roulette.
X.defs.parade.retired=true;
define('course','stamina','Course à pied','👟','Espace / ↑ : maintiens pour monter, relâche pour descendre',12,'obstacles franchis',24);
define('tennis','souffle','Esquive de balles','🎾','← → : esquive · ↓ : protège-toi · ↓↓ : penche-toi sous les barres',12,'balles évitées',20);
define('pneu','force','Pneu à faire rouler','🛞','Enchaîne les touches rapidement pour pousser le pneu',8,'séries de poussée',16);
define('masse','force','La masse sur le pneu','🔨','Z : angle · X : puissance',10,'frappes précises',24);
define('bench','force','Développé couché','🏋️','← → : équilibre · tapote Z / X pour pousser · 4 séries de 5',4,'séries complètes',100);
X.benchLoad=lvl=>({kg:5+lvl*5,plates:lvl,recommended:lvl});
G.LEVELS.bench=Array.from({length:10},(_,i)=>`${X.benchLoad(i+1).kg} kg · Force conseillée ${i+1}`);
define('traineau','force','Traîneau à poids','🏋️','← / → / Espace : maintiens la touche pendant toute la note',24,'poussées en rythme',85);
define('escaliers','stamina','Fuite de la montagne','🏔️','Z / X : courir · Espace : sauter les crevasses · attrape les boosts',35,'foulées de fuite',95);
G.LEVELS.escaliers=Array.from({length:10},(_,i)=>i===0?'Échappe à l’avalanche':i===9?'Avalanche extrême':'Poursuite niveau '+(i+1));
define('paos','vitesse','Pattes d’ours : précision','🎯','Z / X : corps · ↑ + Z / X : visage',16,'cibles précises',38);
define('mannequin','force','Sushi express','🍣','Z / X : frappe les aliments demandés · une nouvelle cible toutes les 15 s',24,'aliments ciblés',60);
define('oeufs','vitesse','Attraper les œufs','🥚','← → : se placer sous les œufs · collecte automatique · dépose aux caisses',8,'œufs déposés',32);
define('poulet','vitesse','La chasse au poulet','🐔','Clique sur les poules · Dorées : points et XP ×3',18,'poules capturées',40);
define('repas','souffle','Le repas de victoire','🍽️','Choisis ton repas au menu · Bonus cumulables pour le prochain match',20,'bouchées saines',48);
G.catalog=()=>[
 ...Object.entries(G.MODES).flatMap(([stat,modes])=>modes.map(m=>Object.assign({stat,mode:m.id,icon:G.EX[stat].icon},m,{name:stat==='force'?'Sac de frappe — '+m.name:m.name}))),
 {stat:'stamina',mode:null,id:'stamina',...G.EX.stamina},{stat:'souffle',mode:null,id:'souffle',...G.EX.souffle},
 ...Object.values(X.defs).filter(d=>!d.retired).map(d=>({...d,mode:d.id}))
];
X.init=(s,h)=>{s.work={h,held:{},clock:0,phase:'wait',timer:0,next:1,last:-100,lastHand:null,lane:1,items:[],distance:0,power:0,angle:0,flash:0,caught:0,mistakes:0};reset(s);};
function reset(s){
 const w=s.work;w.timer=0;w.lock=false;w.flash=0;
 if(s.mode==='cibles'){Object.assign(w,{deck:[],target:-1,hits:0,lastReaction:null,bestReaction:Infinity,totalReaction:0});targetCue(s);}
 if(s.mode==='parade'){w.phase='windup';w.blocked=false;w.cue={high:Math.random()<.5,hand:pick(['A','B'])};w.windup=easy(s)?rand(1.4,1.9):rand(.85,1.4)-s.lvl*.025;w.guard=null;w.guardAt=-10;}
 if(s.mode==='oeufs'){Object.assign(w,{hens:tune(s,[5,7,10]),capacity:tune(s,[5,7,10]),lastCluck:-10,next:1.2,eggCount:0,basketX:640,catchAt:-10,cargo:[],banked:0,spillAt:-10,puddles:[],depositAt:-10,feathers:[],walk:0,facing:1,moving:false,flurry:0,flurryLane:0});}
 if(s.mode==='escaliers')Object.assign(w,{speed:0,scroll:0,motion:0,stride:0,jumpAt:-10,gap:265,boost:0,recover:0,nextGap:650,gapCount:0,lives:3,fall:false,cleared:0,boosts:0,catches:0});
 if(s.mode==='course'){Object.assign(w,{speed:X.courseSpeed(s),wave:0,scroll:0,jumpAt:-10,obstacles:0,next:1.2,lives:3,recover:0,failed:false,fall:false,motion:0});}
 if(s.mode==='tennis')Object.assign(w,{momentum:0,rhythmTime:0,lastDown:-10,dodgeAt:-10,wave:0,volleyId:0,hp:100,maxHp:100,throws:[]});
 if(s.mode==='bench'){Object.assign(w,{phase:'lift',sets:0,reps:0,lift:0,balance:0,fatigue:0,effort:0,unstable:0,demand:1,energy:1,exhausted:false,repTime:0,load:X.benchLoad(s.lvl),strength:s.strength||s.ch.stats?.force||1});}
 if(s.mode==='traineau'){w.notes=[];w.sequence=0;w.speed=0;w.drive=0;w.feedback='Prêt pour la première poussée';sledSequence(s);}
 if(s.mode==='pneu'){w.phase='charge';w.power=0;w.visualPower=0;w.tireErrors=0;w.liftStarted=null;w.lastTireKey=-10;tireSequence(s);}
 if(s.mode==='masse'){w.phase='angle';w.angle=0;w.power=0;w.impactDone=false;w.hitQuality=null;}
 if(s.mode==='paos'){w.phase='cue';w.cue={high:Math.random()<.5,hand:pick(['A','B'])};w.limit=easy(s)?2:Math.max(.65,1.65-s.lvl*.075);}
 if(s.mode==='mannequin'){Object.assign(w,{phase:'belt',belt:0,next:.6,lastStrike:-10,shockAt:-10,served:0,wrong:0,missed:0,dishes:[],vegetable:X.vegetables.find(v=>v.id===s.vegetable)||X.vegetables[0],lives:tune(s,[12,9,7]),failed:false,spawned:0});w.targets=[w.vegetable];w.nextTargetAt=15;w.targetNoticeAt=-10;w.maxLives=w.lives;w.motorStep=0;w.motorAt=0;w.motorDuration=rand(3,5);w.motorFactor=1;w.motorLabel='';}
 if(s.mode==='poulet'){w.phase='chase';w.birds=[];w.captureFx=[];w.clickFx=[];w.spawnIn=0;w.chickenSpawned=0;for(let i=0;i<tune(s,[6,9,12]);i++)spawnChicken(s,i*.12);}
 if(s.mode==='repas'){w.food={bad:Math.random()<.28,type:pick(['pain','pomme','sandwich']),hazard:pick(['piment','gâté'])};w.phase='eat';}
}
// Les trois profils (grosse tranquille, moyenne, petite rapide) existent dans chaque mode.
X.chickenProfiles=[
 {sizes:[2.4,2.2,2],speeds:[80,110,140],turn:[1,1.6],padding:10},
 {sizes:[1.85,1.55,1.3],speeds:[120,175,230],turn:[.8,1.3],padding:6},
 {sizes:[1.55,1.2,.95],speeds:[170,240,310],turn:[.6,1.1],padding:4},
];
X.chickenTarget=(s,b)=>{
 const size=b.size||1.2,pad=X.chickenProfiles[G.tier(s.difficulty)-1].padding;
 return {x:b.x,y:b.y-20*size,rx:26*size+pad,ry:24*size+pad};
};
X.chickenHomes=[
 {x:145,y:292,scale:.9,name:'COCOTTE 1',wall:'#b74f40',body:'#ffe2dc',wing:'#e9b6ae'},
 {x:390,y:255,scale:.78,name:'POULAILLER',wall:'#b8874a',body:'#fff0c7',wing:'#e8cd94'},
 {x:650,y:305,scale:1.02,name:'COCOTTE 3',wall:'#777e52',body:'#e6efd6',wing:'#bfcea7'},
 {x:900,y:252,scale:.8,name:'COCOTTE 4',wall:'#658ba6',body:'#e0edf9',wing:'#b4cee1'},
 {x:1140,y:315,scale:.9,name:'COCOTTE 5',wall:'#98769e',body:'#f0e2f6',wing:'#d2b7dd'}
];
function spawnChicken(s,delay=0){
 const w=s.work,n=w.chickenSpawned++,lane=n%X.chickenHomes.length,home=X.chickenHomes[lane],variant=(n+Math.floor(n/3))%3,profile=X.chickenProfiles[G.tier(s.difficulty)-1];
 const size=profile.sizes[variant],speed=profile.speeds[variant],angle=rand(.45,Math.PI-.45),golden=n%6===5;
 w.birds.push({home:lane,x:home.x,y:home.y+22*home.scale,exit:.35+delay,size,speed,golden,variant,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,turn:rand(...profile.turn),caught:false,seed:rand(0,10)});
}
X.click=(s,x,y)=>{
 if(s.mode!=='poulet'||s.phase!=='go')return false;
 const w=s.work;
 const bird=w.birds.filter(b=>!b.caught&&b.exit<=0).sort((a,b)=>b.y-a.y).find(b=>{
  const hit=X.chickenTarget(s,b);return ((x-hit.x)/hit.rx)**2+((y-hit.y)/hit.ry)**2<=1;
 });
 w.clickFx.push({x,y,at:w.clock,hit:!!bird,golden:!!bird?.golden});w.clickFx=w.clickFx.slice(-12);
 if(!bird){bad(s,'Vise une poule !');return true;}
 const value=bird.golden?3:1,hit=X.chickenTarget(s,bird);
 bird.caught=true;w.caught++;good(s,6*value);s.xpf+=G.actionXp(s.stat,s.mode)*(value-1);AU.play('boing');AU.play(bird.golden?'fanfare':'star');
 w.captureFx.push({x:bird.x,y:hit.y,at:w.clock,golden:bird.golden});w.captureFx=w.captureFx.slice(-18);
 w.h.puff(bird.x,hit.y,bird.golden?'#ffd34f':'#ffe082',bird.golden?26:14);
 w.h.msg(bird.golden?'POULE EN OR ! POINTS ET XP ×3':w.caught%5===0?'COCOTTE COMBO !':'ATTRAPÉE !','#ffe082',32);return true;
};
function good(s,points=3){const w=s.work;w.h.streak(points);w.flash=.3;if(s.mode!=='oeufs')AU.play('chime');}
function bad(s,text){const w=s.work;w.h.miss();w.mistakes++;w.flash=-.35;w.h.msg(text,'#ffbc99',30);if(s.mode!=='oeufs')AU.play('miss');}
const key=code=>({KeyZ:'A',KeyX:'B',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Space:'jump'}[code]);
X.release=(s,e)=>{
 const w=s.work,k=key(e.code);delete w.held[k];
 if(s.mode==='course'&&['jump','up'].includes(k)&&!w.held.jump&&!w.held.up&&w.jumpReleaseAt==null){
  const height=X.courseJump(w);if(height>0){w.jumpReleaseHeight=height;w.jumpReleaseAt=w.clock;}
 }
};
X.input=(s,e)=>{
 const w=s.work,k=key(e.code);if(!k)return;w.held[k]=true;
 if(s.mode==='cibles'){targetInput(s,k,e);return;}
 if(s.mode==='parade'){
  if((k==='A'||k==='B')&&w.phase==='windup'&&w.clock-w.guardAt>=.22){w.guard={hand:k,high:!!w.held.up,valid:!!w.held.up!==!!w.held.down};w.guardAt=w.clock;AU.play('whoosh');}return;
 }
 if(s.mode==='bench'){
  if(w.phase==='lift'&&(k==='A'||k==='B')&&!e.repeat&&k!==w.lastHand&&w.clock-w.last>=.065&&!w.exhausted){
   w.effort=Math.min(1,w.effort+tune(s,[.34,.4,.44])*(1-w.fatigue*.3));w.balance+=(k==='A'?-.018:.018)*w.demand;
   w.lastHand=k;w.last=w.clock;AU.play('body');
  }return;
 }
 if(s.mode==='traineau'){if(!e.repeat)sledInput(s,k);return;}
 if(s.mode==='escaliers'){avalancheInput(s,k,e);return;}
 if(s.mode==='course'){
  if((k==='jump'||k==='up')&&!e.repeat&&w.clock-w.jumpAt>=.18&&X.courseJump(w)===0&&!w.recover&&!w.failed){w.jumpAt=w.clock;w.jumpReleaseAt=null;AU.play('whoosh');}return;
 }
 if(s.mode==='tennis'){
  if(e.repeat)return;
  if(k==='down'){
   if(w.clock-w.lastDown<.4){w.dodge='down';w.dodgeAt=w.clock;w.lastDown=-10;w.h.pose('duck');AU.play('whoosh');}
   else {w.lastDown=w.clock;w.dodge='guard';w.h.pose('block');}
  }else if(k==='left'||k==='right'){w.dodge=k;w.dodgeAt=w.clock;w.h.pose(k==='left'?'dodgeL':'dodgeR');AU.play('whoosh');}return;
 }
 if(s.mode==='pneu'){tireInput(s,k,e);return;}
 if(s.mode==='masse'){
  if(k==='A'&&w.phase==='angle'){w.selectedAngle=Math.sin(w.angle);w.phase='power';w.timer=0;AU.play('tick');}
  else if(k==='B'&&w.phase==='power'){
   w.hitStrength=w.power;w.hitQuality=Math.abs(w.selectedAngle)<X.hammerAngle(s)&&w.power>X.hammerPower(s)?(Math.abs(w.selectedAngle)<=.1&&w.power>=.92?'perfect':'good'):'miss';
   w.swingFrom=-.55-w.power*.45;w.phase='slam';w.timer=0;w.impactDone=false;AU.play('whoosh');
  }return;
 }
 if(s.mode==='paos'&&(k==='A'||k==='B')){
  if(w.phase!=='cue')return;
  if(k===w.cue.hand&&(w.cue.high?w.held.up&&!w.held.down:!w.held.up)){good(s,4);w.h.pose(k==='A'?'pL':'pR');}else bad(s,'Regarde la combinaison !');w.phase='rest';w.timer=0;return;
 }
 if(s.mode==='mannequin'){sushiInput(s,k,e);return;}
 if(s.mode==='oeufs')return; // Les flèches déplacent le panier ; la collecte est automatique.
 if(s.mode==='repas'&&(k==='A'||k==='B'||k==='right')){
  if(w.phase!=='eat')return;
  const eat=k==='A';if(eat&&!w.food.bad){good(s,2);w.caught++;w.h.pose('pL');w.phase='chew';w.timer=0;}
  else if(!eat&&w.food.bad){good(s,1);reset(s);}
  else if(eat){bad(s,w.food.hazard==='gâté'?'Ouf, c’est gâté !':'Ouf, pas le piment !');w.phase='burn';w.timer=0;w.penalty=1.2;}
  else {bad(s,'C’était bon à manger !');reset(s);}return;
 }
};
X.update=(s,dt)=>{
 const w=s.work;w.clock+=dt;w.timer+=dt;w.flash=w.flash>0?Math.max(0,w.flash-dt):Math.min(0,w.flash+dt);w.stumble=Math.max(0,(w.stumble||0)-dt);w.dive=Math.max(0,(w.dive||0)-dt);
 if(s.mode==='parade'){
  if(w.phase==='windup'&&w.timer>=w.windup){
   const age=w.clock-w.guardAt,window=tune(s,[.6,.38,.27]),guard=w.guard;
   w.blocked=!!guard&&guard.valid&&guard.hand===w.cue.hand&&guard.high===w.cue.high&&age>=0&&age<=window;
   if(w.blocked){good(s,age<.09?6:3);w.h.msg(age<.09?'PARADE PARFAITE !':'BIEN BLOQUÉ !','#a4e6c2',30);AU.play('block');}
   else {bad(s,!guard||age>window?'Bloque juste avant le contact !':'Protège le bon côté et la bonne hauteur !');w.h.pose('hit');}
   w.phase='impact';w.timer=0;
  }else if(w.phase==='impact'&&w.timer>.25){w.phase='rest';w.timer=0;}
  else if(w.phase==='rest'&&w.timer>.3)reset(s);
 }
 if(s.mode==='cibles')updateTargets(s);
 if(s.mode==='bench')updateBench(s,dt);
 if(s.mode==='traineau')updateSled(s,dt);
 if(s.mode==='course')updateCourse(s,dt);
 if(s.mode==='escaliers')updateAvalanche(s,dt);
 if(s.mode==='tennis')updateTennis(s,dt);
 if(s.mode==='oeufs')updateEggs(s,dt);
 if(s.mode==='pneu'){
  if(w.phase==='charge'){
   const before=w.power;w.power=Math.max(0,w.power-dt*X.tireFallSpeed(s));
   if(before>0&&w.power===0){bad(s,'Le pneu ralentit ! Reprends la série');w.tireErrors++;w.liftStarted=null;tireSequence(s);}
  }
  w.visualDistance=(w.visualDistance||0)+(w.distance-(w.visualDistance||0))*(1-Math.exp(-dt*12));
  w.visualPower+=(w.power-w.visualPower)*(1-Math.exp(-dt*12));
  if(w.phase==='success'&&w.timer>1.25)reset(s);
 }
 if(s.mode==='masse'){
  w.angle+=dt*(2.1+s.lvl*.15);if(w.phase==='power')w.power=(Math.sin(w.timer*(3+s.lvl*.15)-Math.PI/2)+1)/2;
  if(w.phase==='slam'){
   if(!w.impactDone&&w.timer>=.32){
    w.impactDone=true;w.impactAt=w.clock;
    if(w.hitQuality==='miss'){bad(s,Math.abs(w.selectedAngle)>=.38?'Vise le centre !':'Plus de puissance !');AU.play('body');}
    else{const perfect=w.hitQuality==='perfect';good(s,perfect?16:8);if(perfect)s.xpf+=G.actionXp(s.stat,s.mode);w.h.msg(perfect?'FRAPPE PARFAITE ! XP ×2':'BOUM ! BIEN FRAPPÉ !',perfect?'#ffe487':'#89f7d2',36);AU.play('bigpunch');if(perfect)AU.play('star');}
   }
   if(w.timer>(w.hitQuality==='perfect'?1.65:1.2))reset(s);
  }
 }
 if(s.mode==='paos'){if(w.phase==='cue'&&w.timer>w.limit){bad(s,'Plus vite sur la cible !');w.phase='rest';w.timer=0;}else if(w.phase==='rest'&&w.timer>.4)reset(s);}
 if(s.mode==='mannequin')updateSushi(s,dt);
 if(s.mode==='poulet'){
  w.birds=w.birds.filter(b=>!b.caught);w.captureFx=w.captureFx.filter(f=>w.clock-f.at<.8);w.clickFx=w.clickFx.filter(f=>w.clock-f.at<.55);
  w.spawnIn-=dt;
  if(w.birds.length<tune(s,[6,9,12])&&w.spawnIn<=0){spawnChicken(s);w.spawnIn=tune(s,[.5,.4,.3]);}
  for(const b of w.birds){
   if(b.exit>0){b.exit=Math.max(0,b.exit-dt);b.y=Math.min(390,b.y+120*dt);continue;}
   b.turn-=dt;
   if(b.turn<=0){const profile=X.chickenProfiles[G.tier(s.difficulty)-1],angle=Math.atan2(b.vy,b.vx)+rand(-1,1),speed=b.speed;b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;b.turn=rand(...profile.turn);}
   b.x=clamp(b.x+b.vx*dt,55,1225);b.y=clamp(b.y+b.vy*dt,375,645);
   if(b.x<=55||b.x>=1225)b.vx*=-1;if(b.y<=375||b.y>=645)b.vy*=-1;
  }
 }
 if(s.mode==='repas'){
  if(w.phase==='chew'&&w.timer>.17)reset(s);
  if(w.phase==='burn'&&w.timer>w.penalty)reset(s);
  if(w.phase==='eat'&&w.timer>Math.max(.8,2.4-s.lvl*.1)){bad(s,'Ça refroidit !');reset(s);}
 }
};
// Chickens telegraph their launch; each egg keeps its own gentle flight time.
X.eggBasketScale=s=>tune(s,[1,1,.82]);
X.eggLaneX=(s,lane)=>130+lane*1020/(s.work.hens-1);
X.eggCarrySpeed=count=>620/(1+count*.25);
X.eggDepositMultiplier=count=>[0,1,1.5,2,3,5][clamp(count,0,5)];
X.eggFlightTime=lvl=>Math.max(1.45,2.05-(lvl-1)*.065);
X.eggSpawnInterval=lvl=>Math.max(.8,1.45-(lvl-1)*.06);
G.LEVELS.oeufs=Array.from({length:10},(_,i)=>i<2?'Les poules font PLOP !':i<6?'Œufs croisés et œufs dorés':'Les championnes du poulailler');
X.spawnEgg=s=>{
 const w=s.work,source=w.flurry>0?w.flurryLane:w.eggCount%w.hens,lane=Math.random()<.25?(source+1+Math.round(Math.random()))%w.hens:source;
 const number=++w.eggCount,rainbow=number%10===0,golden=!rainbow&&number%4===0;
 const egg={source,lane,sourceX:X.eggLaneX(s,source),targetX:X.eggLaneX(s,lane),u:-.22,done:false,dur:X.eggFlightTime(s.lvl)+(rainbow?.45:0),golden,rainbow,flurry:w.flurry>0};w.items.push(egg);return egg;
};
function updateEggs(s,dt){
 const w=s.work,oldX=w.basketX;
 const direction=(w.held.right?1:0)-(w.held.left?1:0);
 w.basketX=clamp(w.basketX+direction*X.eggCarrySpeed(w.cargo.length)*dt,75,1205);
 w.walk+=Math.abs(w.basketX-oldX);w.moving=Math.abs(w.basketX-oldX)>.01;if(direction)w.facing=direction;
 w.feathers=w.feathers.filter(f=>w.clock-f.at<4);
 w.lane=clamp(Math.round((w.basketX-130)/(1020/(w.hens-1))),0,w.hens-1);
 w.puddles=w.puddles.filter(p=>w.clock-p.at<2);
 for(const p of w.puddles){
  if(w.cargo.length&&w.clock-p.at>.35&&w.clock-w.spillAt>1.2&&direction&&Math.min(oldX,w.basketX)<p.x+32&&Math.max(oldX,w.basketX)>p.x-32){
   w.spilled=w.cargo.length;w.cargo=[];w.spillAt=w.clock;bad(s,'Ça glisse ! Récolte cassée');AU.play('eggSmash');break;
  }
 }
 if(w.cargo.length&&(w.basketX<=95||w.basketX>=1185)){
  const count=w.cargo.length,mult=X.eggDepositMultiplier(count),beforeScore=s.score;
  w.lastDeposit={from:w.basketX,x:w.basketX<640?75:1205,eggs:w.cargo.slice(),mult};
  for(const egg of w.cargo){good(s,Math.round((egg.rainbow?16:egg.golden?8:4)*mult));s.xpf+=G.actionXp(s.stat,s.mode)*(mult-1+(egg.rainbow?1:egg.golden?.5:0));}
  w.lastDeposit.points=s.score-beforeScore;w.banked+=count;w.cargo=[];w.depositAt=w.clock;w.depositText='+'+count+' œufs · ×'+mult;AU.play('eggDeposit');AU.play('fanfare');
 }

 w.next-=dt;
 if(w.next<=0&&w.items.filter(i=>!i.done).length<tune(s,[3,4,5])){
  const egg=X.spawnEgg(s);
  if(w.flurry>0){w.flurry--;w.next=w.flurry>0?(tune(s,[.75,.6,.5])):X.eggSpawnInterval(s.lvl);}
  else if(w.eggCount%7===0){w.flurry=2;w.flurryLane=egg.source;w.next=tune(s,[.75,.6,.5]);}
  else w.next=X.eggSpawnInterval(s.lvl);
 }
 for(const egg of w.items){
  if(egg.done)continue;
  const before=egg.u;egg.u+=dt/(egg.dur||2.8);
  if(before<0&&egg.u>=0){egg.launchedAt=w.clock;w.feathers.push({x:(egg.sourceX??X.eggLaneX(s,egg.source??egg.lane)),y:290,at:w.clock,power:egg.rainbow?2:egg.flurry?1.5:1});if(w.clock-w.lastCluck>.85){AU.play('henCluck'+(egg.source%3));w.lastCluck=w.clock;}}
  const window=X.eggWindow(s);
  if(before<window.end&&egg.u>=window.start&&w.cargo.length<w.capacity&&Math.abs(eggPosition(egg,s).x-w.basketX)<65*X.eggBasketScale(s)){
   egg.done=true;egg.caught=true;egg.resolvedAt=w.clock;w.catchAt=w.clock;
   w.cargo.push({golden:!!egg.golden,rainbow:!!egg.rainbow});w.caught++;
   if(w.cargo.length===w.capacity)w.fullAt=w.clock;
   w.catchKind=egg.rainbow?'rainbow':egg.golden?'gold':'normal';if(egg.rainbow)AU.play('fireworks');
   continue;
  }
  if(egg.u>=X.eggWindow(s).end){egg.done=true;egg.resolvedAt=w.clock;w.puddles.push({x:(egg.targetX??X.eggLaneX(s,egg.lane)),at:w.clock});bad(s,'Omelette !');AU.play('eggSmash');}
 }
 w.items=w.items.filter(egg=>!egg.done||w.clock-(egg.resolvedAt??w.clock)<.85);
}
function eggPosition(egg,s){
 const u=clamp(egg.u,0,1.08),from=(egg.sourceX??X.eggLaneX(s,egg.source??egg.lane))+54*Math.min(.85,600/(s.work.hens*134)),to=(egg.targetX??X.eggLaneX(s,egg.lane));
 // A high, slow arc; the last stretch eases into the basket instead of accelerating sharply.
 const startY=321+264*.76-135*Math.sin(.65*Math.PI),k=clamp((u-.65)/.43,0,1);
 const y=u<=.65?321+264*(u/.65*.76)-135*Math.sin(u*Math.PI):startY+(585-startY)*(3*k*k-2*k*k*k)+172*(k*k*k-2*k*k+k);
 return {x:A.lerp(from,to,clamp(u,0,1)),y};
}
function drawFarmHen(c,x,y,charge,pop,T,col){
 c.save();c.translate(x,y);c.rotate(-charge*.2+pop*.28);c.scale(1+charge*.2-pop*.14,1-charge*.23+pop*.25);
 // Two little feet brace on the perch, while the feathered rear points toward the field.
 c.strokeStyle='#e4a13f';c.lineWidth=5;c.lineCap='round';for(const dx of [-12,13]){c.beginPath();c.moveTo(dx,28);c.lineTo(dx,43);c.lineTo(dx-10,43);c.moveTo(dx,43);c.lineTo(dx+8,43);c.stroke();}
 for(let i=0;i<3;i++){c.save();c.translate(37,0);c.rotate(.3+i*.28);c.fillStyle=i%2?'#e1cce9':col;A.ell(c,10,-16-i*3,11,29);c.fill();c.restore();}
 const g=c.createRadialGradient(-10,-17,3,0,0,55);g.addColorStop(0,'#fffef1');g.addColorStop(.6,col);g.addColorStop(1,'#cbb8c9');c.fillStyle=g;A.ell(c,0,0,47,36);c.fill();c.strokeStyle='#9d849e';c.lineWidth=2;c.stroke();
 c.fillStyle='#e8cddc';c.save();c.translate(2,3);c.rotate(-.2-pop*Math.sin(T*32)*1.1-charge*.2);A.ell(c,5,-pop*18,27+pop*15,20);c.fill();c.restore();c.strokeStyle='#bf9db6';for(let i=0;i<3;i++){c.beginPath();c.arc(-5+i*9,-1,13,.1,1.5);c.stroke();}
 c.fillStyle=col;A.ell(c,-33,-29,23,29,-.2);c.fill();c.fillStyle='#f36b87';for(let i=0;i<3;i++){A.ell(c,-47+i*12,-56-(i===1?6:0),8,12);c.fill();}
 c.fillStyle='#ffd269';c.beginPath();c.moveTo(-50,-32);c.lineTo(-73,-23);c.lineTo(-49,-17);c.closePath();c.fill();c.fillStyle='#ea657b';A.ell(c,-45,-9,7,12);c.fill();
 c.fillStyle='#fff';A.ell(c,-39,-32,9,11);c.fill();c.fillStyle='#25314c';A.ell(c,-43,-31,4,pop>.5?2:6);c.fill();ball(c,-47,-16,5,'#f9a2b6');
 if(pop>0){c.fillStyle='#fff0c8';for(let i=0;i<4;i++){c.globalAlpha=pop*.65;A.ell(c,55+i*10,8-i*7,8+4*i,6+3*i);c.fill();}c.globalAlpha=1;}
 c.restore();
}
function drawHarvestEgg(c,x,y,size,golden=false,rotation=0,rainbow=false){
 c.save();c.translate(x,y);c.rotate(rotation);c.scale(size/24,size/24);
 const fill=rainbow?c.createLinearGradient(0,-27,0,29):c.createRadialGradient(-7,-12,1,0,0,29);if(rainbow){['#ff7b9a','#ffd762','#b5ed67','#55dce6','#7890f7','#d485f2'].forEach((col,i)=>fill.addColorStop(i/5,col));}else{fill.addColorStop(0,'#fffef1');fill.addColorStop(.6,golden?'#ffe97d':'#ffedce');fill.addColorStop(1,golden?'#d79024':'#ccae83');}
 if(golden||rainbow){c.shadowColor=rainbow?'#adf7ff':'#ffe477';c.shadowBlur=rainbow?30:16;}c.fillStyle=fill;c.beginPath();c.moveTo(0,-27);c.bezierCurveTo(18,-27,29,15,13,24);c.bezierCurveTo(-19,40,-32,-11,0,-27);c.fill();c.shadowBlur=0;c.strokeStyle=golden?'#b78129':'#bda586';c.lineWidth=1.2;c.stroke();c.fillStyle='rgba(255,255,255,.6)';A.ell(c,-7,-10,4,8,-.3);c.fill();c.restore();
}
function drawEggCrate(c,x,w,T){
 const recent=w.lastDeposit&&w.lastDeposit.x===x?w.clock-w.depositAt:9;
 c.save();c.translate(x,617);if(recent<.5)c.scale(1+Math.sin(recent*12)*.06,1-Math.sin(recent*12)*.07);
 c.fillStyle='#ae7941';c.fillRect(-43,-35,86,78);c.fillStyle='#d4a76a';c.fillRect(-40,-31,80,70);
 for(let i=0;i<4;i++){c.fillStyle=i%2?'#bb8b52':'#c99b60';c.fillRect(-37,-28+i*16,74,14);c.strokeStyle='#a67640';c.lineWidth=1;c.beginPath();c.moveTo(-34,-22+i*16);c.quadraticCurveTo(0,-27+i*16,31,-21+i*16);c.stroke();}
 c.fillStyle='#987046';c.beginPath();c.moveTo(-43,-35);c.lineTo(-28,-48);c.lineTo(40,-48);c.lineTo(43,-35);c.closePath();c.fill();c.fillStyle='#6a5337';c.fillRect(-30,-43,62,8);
 c.fillStyle='#f6e5ba';c.save();c.rotate(-.09);c.fillRect(-31,-11,62,29);text(c,'DÉPÔT',0,9,16,'#61543e');c.restore();
 c.fillStyle='#e8c589';for(const dx of [-38,34]){c.fillRect(dx,-34,5,77);for(const y of [-24,30]){c.fillStyle='#73604b';A.ell(c,dx+2,y,1.5,1.5);c.fill();c.fillStyle='#e8c589';}}
 c.restore();
 if(w.cargo.length===w.capacity){const pulse=.55+.25*Math.sin(T*6);c.save();c.globalAlpha=pulse;c.strokeStyle='#ffe18a';c.lineWidth=3;c.beginPath();c.arc(x,617,57,0,Math.PI*2);c.stroke();c.restore();}
}
function drawEggCollector(c,s,T){
 const w=s.work,dir=w.facing||1,load=w.cargo.length,step=Math.sin((w.walk||0)*.075),moving=w.moving;
 const slip=Math.max(0,1-(w.clock-w.spillAt)/.75),hip={x:w.basketX-dir*33,y:608+load*1.4},shoulder={x:hip.x-dir*(8+load),y:548+load*1.5};
 function limb(points,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
 BX.familyBody.equipment(c,s.ch,hip.x,596,.46,{view:'side',time:T,rotation:slip*dir*-.35,stride:moving?step*32:0,hands:[{x:w.basketX-dir*48*X.eggBasketScale(s),y:600},{x:w.basketX+dir*43*X.eggBasketScale(s),y:601}]});
 if(load>=3){for(let i=0;i<3;i++){c.fillStyle='#80d9ef';A.ell(c,shoulder.x-dir*(36+i*7),508+(T*45+i*17)%42,3,6);c.fill();}}
 if(moving)for(let i=0;i<4;i++){c.save();c.globalAlpha=.28*(1-i/4);c.fillStyle='#d7d6c3';A.ell(c,hip.x-dir*(25+i*15),676-i%2*5,10+i*3,4);c.fill();c.restore();}
}
function drawEggs(c,s,T){
 const w=s.work;c.save();c.beginPath();c.rect(0,115,1280,575);c.clip();
 // Même salle que la vidéo, table de bois et éclairage chaud sur le parquet.
 const light=c.createRadialGradient(640,380,30,640,410,700);light.addColorStop(0,'rgba(255,226,152,.17)');light.addColorStop(1,'rgba(255,226,152,0)');c.fillStyle=light;c.fillRect(0,115,1280,575);
 c.fillStyle='rgba(7,23,28,.3)';A.ell(c,640,671,600,24);c.fill();
 for(const x of [85,1195]){c.fillStyle='#68442c';c.fillRect(x-10,350,21,231);c.fillStyle='#bc8c55';c.fillRect(x-10,350,6,227);}
 c.fillStyle='#795030';c.fillRect(58,364,1164,23);c.fillStyle='#a67544';c.fillRect(60,366,1160,9);
 const wood=c.createLinearGradient(0,344,0,366);wood.addColorStop(0,'#e9be7d');wood.addColorStop(.5,'#bf8c53');wood.addColorStop(1,'#8e5b32');c.fillStyle=wood;A.rr(c,45,344,1190,24,4);c.fill();
 c.strokeStyle='#a77340';c.lineWidth=1.5;for(let i=0;i<5;i++){c.beginPath();c.moveTo(52,348+i*3);c.bezierCurveTo(350,344+i*3,965,357+i*2,1217,349+i*3);c.stroke();}
 for(let lane=0;lane<w.hens;lane++){
  const x=X.eggLaneX(s,lane),egg=w.items.find(i=>i.source===lane&&!i.done),charge=egg&&egg.u<0?1+egg.u/.22:0,age=egg?w.clock-(egg.launchedAt??-10):9,pop=Math.max(0,1-age/.5);
  const henScale=Math.min(.85,970/(w.hens*134));c.save();c.translate(x,344);c.scale(henScale,henScale);c.translate(-x,-344);
  c.fillStyle='#bd8d4a';A.ell(c,x,342,67,13);c.fill();c.strokeStyle='#f8d48a';c.lineWidth=2;
  for(let i=0;i<14;i++){c.beginPath();c.moveTo(x-60+i*9,337+i%3*2);c.lineTo(x-47+i*8,348-i%2*4);c.stroke();}
  drawFarmHen(c,x,298-Math.sin(T*3+lane)*2-pop*14,charge,pop,T,['#fff1da','#f1dfff','#ffe8b6'][lane%3]);c.restore();
  if(pop>0){c.save();c.globalAlpha=pop;for(let i=0;i<12;i++){const a=i*.8;const px=x+Math.cos(a)*(30+age*140),py=285+Math.sin(a)*(25+age*100);c.fillStyle='#fff9e8';A.ell(c,px,py,9+age*9,7+age*7);c.fill();}text(c,egg.rainbow?'ARC-EN-CIEL !':egg.flurry?'FRÉNÉSIE !':egg.golden?'POUF !':'PLOP !',x,208-age*15,23,egg.golden?'#ffe18a':'#fff2ca');c.restore();}
 }
 for(const p of w.puddles){c.save();c.globalAlpha=Math.min(1,(2-w.clock+p.at)*2);c.fillStyle='#fff2d0';A.ell(c,p.x,667,46,12);c.fill();c.fillStyle='#efba3e';A.ell(c,p.x,665,27,8);c.fill();text(c,'!',p.x,643,23,'#ffc56a');c.restore();}
 for(const x of [75,1205])drawEggCrate(c,x,w,T);
 drawEggCollector(c,s,T);
 const catchAge=w.clock-w.catchAt,bounce=catchAge<.4?Math.sin(catchAge/.4*Math.PI)*9:0,bx=w.basketX,by=593+bounce+w.cargo.length*.5;
 c.save();c.translate(bx,by);c.scale(X.eggBasketScale(s),X.eggBasketScale(s));c.rotate(w.moving?Math.sin((w.walk||0)*.075)*.025*w.cargo.length:0);
 c.strokeStyle='#8b5831';c.lineWidth=6;c.beginPath();c.ellipse(0,-5,57,44,0,Math.PI,Math.PI*2);c.stroke();
 c.fillStyle='#6b472f';A.ell(c,0,0,63,17);c.fill();
 for(let i=0;i<w.cargo.length;i++){const x=(i%3-1)*27,y=-8-Math.floor(i/3)*19;drawHarvestEgg(c,x+(Math.floor(i/3)%2?8:0),y,17,w.cargo[i].golden,(i-2)*.12,w.cargo[i].rainbow);}
 const basket=c.createLinearGradient(0,3,0,56);basket.addColorStop(0,'#e7b36c');basket.addColorStop(1,'#a96e39');c.fillStyle=basket;c.beginPath();c.moveTo(-63,3);c.quadraticCurveTo(-55,62,0,58);c.quadraticCurveTo(55,62,63,3);c.quadraticCurveTo(0,25,-63,3);c.fill();
 c.strokeStyle='#8d5b32';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.ellipse(0,7+i*11,59-i*4,10,0,0,Math.PI);c.stroke();}for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*15,18);c.lineTo(i*12,53-Math.abs(i)*2);c.stroke();}
 c.strokeStyle='#f3cf91';c.lineWidth=4;c.beginPath();c.ellipse(0,3,62,16,0,0,Math.PI);c.stroke();c.restore();
 for(const egg of w.items){
  if(egg.u<0)continue;let {x,y}=eggPosition(egg,s);const age=w.clock-(egg.resolvedAt??w.clock);
  if(egg.caught){if(age>.35)continue;const t=clamp(age/.35,0,1);x=A.lerp(x,bx,t);y=A.lerp(y,by-12,t);}
  if(egg.done&&!egg.caught){if(age<.65){c.save();c.globalAlpha=1-age/.65;for(let i=0;i<8;i++){const a=i*2.4;c.fillStyle=i%2?'#fff2cb':'#f7c145';A.ell(c,(egg.targetX??X.eggLaneX(s,egg.lane))+Math.cos(a)*age*100,655-Math.sin(i+.3)*age*100+age*age*90,7,5);c.fill();}text(c,'SPLAT !',(egg.targetX??X.eggLaneX(s,egg.lane)),616-age*25,23,'#ffe284');c.restore();}continue;}
  if(egg.golden||egg.rainbow){c.save();c.globalAlpha=.6;c.strokeStyle='#ffe58a';c.lineWidth=2;c.beginPath();c.ellipse(x,y+29,(egg.rainbow?72:42)+Math.sin(T*8)*5,12,0,0,Math.PI*2);c.stroke();for(let i=0;i<(egg.rainbow?12:5);i++)A.sparkle(c,x+Math.cos(T*2+i*1.3)*(egg.rainbow?72:41),y+Math.sin(T*2+i*1.3)*(egg.rainbow?72:41),egg.rainbow?7:4,egg.rainbow?['#ff9fca','#b4f6c9','#fff0a3'][i%3]:'#ffe592');c.restore();}
  drawHarvestEgg(c,x,y,egg.rainbow?52:egg.golden?33:24,egg.golden,Math.sin(egg.u*7)*.2,egg.rainbow);
 }
 // Les plumes traversent tout le terrain et tournent sur elles-mêmes.
 c.restore();c.save();c.beginPath();c.rect(0,105,1280,615);c.clip();
 for(const event of w.feathers||[]){const age=w.clock-event.at;if(age<0||age>4)continue;for(let i=0;i<24;i++){
  const power=event.power||1,a=i*2.399,drag=(1-Math.exp(-age*.6))/.6;
  const x=event.x+Math.cos(a)*drag*230*power+Math.sin(age*4+i)*20,y=event.y+Math.sin(a)*drag*130*power-65*age+age*age*38;
  c.save();c.globalAlpha=Math.min(1,(4-age)*1.5);c.translate(x,y);c.rotate(Math.sin(age*3+i)*1.4+i);c.scale(.45+Math.abs(Math.cos(age*4+i))*.55,1);c.fillStyle=i%3?'#fff8e7':'#d9e5df';A.ell(c,0,0,5+i%3,15+i%5);c.fill();c.strokeStyle='#b8c5c2';c.lineWidth=1;c.beginPath();c.moveTo(0,-12);c.lineTo(0,14);c.stroke();c.restore();
 }}
 if(catchAge<.6){for(let i=0;i<(w.catchKind==='rainbow'?24:8);i++){const a=i*2.4,r=25+catchAge*100;A.sparkle(c,bx+Math.cos(a)*r,by-20+Math.sin(a)*r,5*(1-catchAge/.6),'#fff19c');}}
 if(catchAge<.8&&w.catchKind==='rainbow')text(c,'ARC-EN-CIEL !',bx,399-catchAge*25,30,'#fff1a4');
 const deposit=w.lastDeposit,age=w.clock-w.depositAt;
 if(deposit&&age<1.5){
  for(let i=0;i<deposit.eggs.length;i++){const u=clamp((age-i*.07)/.55,0,1);if(u>0&&u<1)drawHarvestEgg(c,A.lerp(deposit.from,deposit.x,u),593-110*Math.sin(u*Math.PI),16,deposit.eggs[i].golden,u*3,deposit.eggs[i].rainbow);}
  c.save();c.globalAlpha=Math.min(1,(1.5-age)*2);const glow=c.createRadialGradient(deposit.x,590,0,deposit.x,590,130);glow.addColorStop(0,'rgba(255,226,130,.5)');glow.addColorStop(1,'rgba(255,226,130,0)');c.fillStyle=glow;c.fillRect(deposit.x-130,460,260,260);
  for(let i=0;i<16;i++){const a=i*2.4,r=30+age*100;A.sparkle(c,deposit.x+Math.cos(a)*r,570+Math.sin(a)*r*.7,7*(1-age/1.5),i%3?'#ffe48e':'#b9e5c2');}
  text(c,'+'+deposit.points+' · ×'+deposit.mult,clamp(deposit.x,140,1140),455-age*18,30,'#ffe28a');c.restore();
 }
 // Livraison façon jackpot : invitation brève, puis célébration au dépôt réel.
 const fullAge=w.clock-(w.fullAt??-10),delivery=deposit&&age<1.6,invite=w.cargo.length===w.capacity&&fullAge<1.8;
 if(delivery||invite){
  const t=delivery?age:fullAge,fade=Math.min(1,t*8,(delivery?1.6:1.8)-t),x=640,y=180;
  c.save();c.globalAlpha=Math.max(0,fade);c.translate(x,y);c.scale(1+Math.sin(Math.min(1,t)*Math.PI)*.05,1+Math.sin(Math.min(1,t)*Math.PI)*.05);
  const glow=c.createRadialGradient(0,15,5,0,15,220);glow.addColorStop(0,'rgba(255,211,71,.65)');glow.addColorStop(1,'rgba(255,211,71,0)');c.fillStyle=glow;c.fillRect(-240,-100,480,240);
  for(let i=0;i<16;i++){const a=i*Math.PI/8+t*.3;c.strokeStyle='rgba(255,223,112,.35)';c.lineWidth=12;c.beginPath();c.moveTo(Math.cos(a)*75,Math.sin(a)*35);c.lineTo(Math.cos(a)*210,Math.sin(a)*100);c.stroke();}
  c.font='40px Bungee';c.textAlign='center';c.lineWidth=8;c.strokeStyle='#44252b';c.strokeText('LIVRAISON !',0,18);c.fillStyle='#ffeaaa';c.fillText('LIVRAISON !',0,18);
  panel(c,-180,32,360,40,'#241e3c');c.font='900 19px Nunito';c.fillStyle='#fff1c9';c.fillText(delivery?'+'+deposit.points+' POINTS · BONUS ×'+deposit.mult:'Vide ton panier au dépôt !',0,59);
  for(let i=0;i<14;i++)A.sparkle(c,Math.cos(i*2.4+t)*190,Math.sin(i*2.4+t)*75,4+3*Math.sin(t*7+i)**2,'#fff1b0');c.restore();
 }
 if(delivery){for(let i=0;i<18;i++){const phase=age-i*.025;if(phase<0)continue;const x=deposit.x+Math.sin(i*2.4)*phase*180,y=590-340*phase+230*phase*phase;c.save();c.globalAlpha=Math.max(0,1-age/1.6);c.fillStyle=i%3?'#ffd861':'#fff1b4';A.ell(c,x,y,8,12);c.fill();A.sparkle(c,x+10,y-8,4,'#fff7c0');c.restore();}}
 if(w.cargo.length){text(c,w.cargo.length+'/'+w.capacity+'  ·  ×'+X.eggDepositMultiplier(w.cargo.length),bx,446,19,w.cargo.length===w.capacity?'#ffe18a':'#f4e8c8');}
 if(w.cargo.length===w.capacity){const label=bx<835?'←':'→';G.keycap(c,label,bx-23,389);}
 c.restore();
}

// Course automatique : collisions vérifiées pendant tout le passage de l’obstacle.
X.courseJump=w=>{
 const age=w.clock-w.jumpAt;if(age<0||age>=.9)return 0;
 if(w.jumpReleaseAt!=null){const fall=Math.max(0,w.clock-w.jumpReleaseAt);return Math.max(0,w.jumpReleaseHeight-260*fall-650*fall*fall);}
 return Math.sin(age/.9*Math.PI)*115;
};
X.courseKinds=['cone','puddle','crate','hole','sewer'];
X.courseSpeed=s=>tune(s,[350,430,510]);
X.spawnCourseWave=s=>{
 const w=s.work,wave=w.wave++,count=tune(s,[3,4,6])+(wave%3===2?1:0),patterns=[['cone','crate','hole','cone','sewer','crate','puddle'],['hole','cone','crate','sewer','cone','puddle','crate'],['crate','sewer','cone','puddle','crate','hole','cone']];
 let x=1680;const spacing=tune(s,[1.02,.86,.74]);
 for(let i=0;i<count;i++){
  const kind=patterns[wave%patterns.length][i],width=kind==='cone'?42:kind==='crate'?52:kind==='puddle'?72:86;
  w.items.push({x,kind,width,done:false,wave});w.obstacles++;
  if(i<count-1)x+=w.speed*(spacing+[0,.12,-.03,.06][(i+wave)%4]);
 }
 w.next=(x-1680)/w.speed+tune(s,[1.65,1.35,1.12]);
};
function updateCourse(s,dt){
 const w=s.work;if(w.failed&&!w.recover)return;
 if(w.recover>0){w.recover=Math.max(0,w.recover-dt);if(!w.recover){if(w.failed){G.finish();return;}w.items=[];w.next=1.2;w.fall=false;w.jumpAt=-10;}return;}
 w.speed=X.courseSpeed(s);w.scroll+=w.speed*dt;w.motion+=w.speed*dt/150;
 w.next-=dt;
 if(w.next<=0)X.spawnCourseWave(s);
 for(const item of w.items){
  const old=item.x;item.x-=w.speed*dt;if(item.done)continue;
  const half=item.width/2,overlap=item.x-half<815&&old+half>785;
  const required=item.kind==='cone'?58:item.kind==='crate'?60:20;
  if(overlap&&X.courseJump(w)<required){
   item.done=true;w.lives--;w.recover=1.1;w.failed=w.lives<=0;w.fall=['hole','sewer'].includes(item.kind);w.hitKind=item.kind;w.hitAt=w.clock;w.fallX=item.x;w.fallWidth=item.width;
   bad(s,w.failed?'FIN DE LA COURSE !':w.fall?'Attention au trou !':item.kind==='puddle'?'Ça glisse !':'Attention devant !');AU.play('hurt');break;
  }
  if(item.x+half<785){item.done=true;good(s,4);s.obstaclesDodged=(s.obstaclesDodged||0)+1;}
 }
 w.items=w.items.filter(item=>item.x+item.width/2>400);
}
// A strike lands before its reward: wind-up, contact hold, recoil and celebration.
function drawHammerChallenge(c,s,T){
 const w=s.work,slam=w.phase==='slam',perfect=w.hitQuality==='perfect',hit=slam&&w.impactDone,age=hit?w.clock-w.impactAt:9;
 const shock=age<.4?(1-age/.4)*(w.hitQuality==='miss'?.2:perfect?1:.65):0,accent=perfect&&hit?'#ffe278':'#69e6ef';
 const swing=!slam?-.55-w.power*.45:w.timer<.32?A.lerp(w.swingFrom,2.05,A.ease(w.timer/.32)):w.timer<.43?2.05:2.05-Math.sin(Math.min(1,(w.timer-.43)/.6)*Math.PI)*.4;
 c.save();
 // Aim and power use the same geometry and thresholds as the scoring.
 if(w.phase==='angle'){
  G.keycap(c,'Z',535,200);text(c,'VISE LE CENTRE',825,226,24,'#fff2d1');
  panel(c,625,247,420,30,'#10152c');c.fillStyle='#42bf9e';c.fillRect(835-210*X.hammerAngle(s),249,420*X.hammerAngle(s),26);c.fillStyle='#ffe277';c.fillRect(814,249,42,26);ball(c,835+Math.sin(w.angle)*210,262,9,'#fff9e6');
 }else if(w.phase==='power'){
  G.keycap(c,'X',535,200);text(c,'CHARGE AU MAX !',825,226,24,'#fff2d1');
  panel(c,625,247,420,30,'#10152c');c.fillStyle='#36a387';c.fillRect(625+420*X.hammerPower(s),249,420*(.92-X.hammerPower(s)),26);c.fillStyle='#ad8541';c.fillRect(625+420*.92,249,420*.08,26);
  const power=c.createLinearGradient(625,0,1045,0);power.addColorStop(0,'#64d5df');power.addColorStop(.7,'#7af1b1');power.addColorStop(1,'#ffe78b');c.fillStyle=power;c.fillRect(625,253,420*w.power,18);
  for(let i=1;i<14;i++){c.fillStyle='#17253b';c.fillRect(625+i*30,253,2,18);}
 }else text(c,hit?(perfect?'★ XP ×2 · SUPER COSTAUD ! ★':w.hitQuality==='good'?'UN GROS COUP !':'ENCORE UN ESSAI !'):'ET… BOUM !',835,226,25,perfect?'#ffe278':'#92e9df');
 c.save();c.beginPath();c.rect(420,300,830,385);c.clip();c.translate(Math.sin(age*110)*10*shock,Math.cos(age*87)*6*shock);
 c.fillStyle='rgba(0,0,0,.22)';A.ell(c,860,641,300,35);c.fill();
 // Wide tractor tire with depth, rubber blocks and a glowing impact target on its rim.
 const squash=shock*10,ty=577+squash;
 c.fillStyle='#090f20';A.ell(c,920,ty+37,157,57-squash*.2);c.fill();
 const rubber=c.createLinearGradient(765,ty-60,1060,ty+50);rubber.addColorStop(0,'#748da4');rubber.addColorStop(.3,'#304757');rubber.addColorStop(1,'#111d30');c.fillStyle=rubber;A.ell(c,920,ty,157,59-squash*.4);c.fill();
 for(let i=0;i<28;i++){const a=i*Math.PI*2/28;c.save();c.translate(920+Math.cos(a)*147,ty+Math.sin(a)*54);c.rotate(Math.atan2(54*Math.cos(a),-147*Math.sin(a)));c.fillStyle=i%2?'#4a6078':'#627b91';A.rr(c,-10,-6,20,12,3);c.fill();c.restore();}
 c.strokeStyle=accent;c.lineWidth=3;A.ell(c,920,ty,115,42);c.stroke();c.fillStyle='#090e22';A.ell(c,920,ty+3,68,24);c.fill();c.strokeStyle='#58708b';c.lineWidth=5;c.stroke();
 c.save();c.shadowColor=accent;c.shadowBlur=18;c.strokeStyle=accent;c.lineWidth=3;A.ell(c,870,ty-22,26,10);c.stroke();c.restore();
 // Compact child proportions, both hands attached to the moving wooden shaft.
 const recoil=shock*4;
 const pivot={x:710,y:476},point=d=>({x:pivot.x+Math.sin(swing)*d,y:pivot.y-Math.cos(swing)*d});
 BX.familyBody.equipment(c,s.ch,653-recoil,550,.48,{view:'side',time:T,hands:[point(32),point(62)]});
 // Weighted head with beveled edges. The arc is held briefly at contact.
 if(slam&&w.timer<.32){c.strokeStyle='#c2ebff66';c.lineWidth=9;c.beginPath();c.arc(pivot.x,pivot.y,174,w.swingFrom-Math.PI/2,swing-Math.PI/2);c.stroke();}
 c.save();c.translate(pivot.x,pivot.y);c.rotate(swing);c.strokeStyle='#9b603a';c.lineWidth=14;c.beginPath();c.moveTo(0,10);c.lineTo(0,-174);c.stroke();c.strokeStyle='#e2b67c';c.lineWidth=5;c.beginPath();c.moveTo(-3,5);c.lineTo(-3,-171);c.stroke();
 const steel=c.createLinearGradient(-40,-200,40,-150);steel.addColorStop(0,'#e1eff5');steel.addColorStop(.3,'#8fa6bd');steel.addColorStop(.6,'#425b78');steel.addColorStop(1,'#1c2e49');c.fillStyle=steel;A.rr(c,-42,-199,84,43,7);c.fill();c.strokeStyle='#b9d5e7';c.lineWidth=2;c.stroke();c.fillStyle=accent;c.fillRect(-40,-193,6,31);c.fillRect(34,-193,6,31);c.restore();
 if(hit&&age<.95){
  const impactX=870,impactY=555;
  for(let ring=0;ring<2;ring++){const u=clamp((age-ring*.08)/.7,0,1);c.globalAlpha=(1-u)*.8;c.strokeStyle=accent;c.lineWidth=4*(1-u)+1;A.ell(c,impactX,impactY+15,30+u*200,8+u*60);c.stroke();}c.globalAlpha=1;
  const count=perfect?28:12;for(let i=0;i<count;i++){const a=i*2.4,r=age*(110+i%5*27),x=impactX+Math.cos(a)*r,y=impactY-Math.abs(Math.sin(a))*r+120*age*age;A.sparkle(c,x,y,(1-age/.95)*(perfect?7:4),i%3?'#ffe49c':'#8af6e6');}
  if(perfect)for(let i=0;i<20;i++){c.save();c.translate(870+Math.sin(i*4)*age*200,510-age*130+170*age*age+i%5*9);c.rotate(i+age*8);c.fillStyle=['#ffe17d','#82f4db','#bf9cff'][i%3];c.fillRect(-3,-5,6,10);c.restore();}
 }
 c.restore();
 if(shock>0){c.fillStyle='rgba(255,229,157,'+(shock*.13)+')';A.rr(c,415,115,840,575,26);c.fill();}
 text(c,hit&&perfect?'PRÉCISION + PUISSANCE = XP ×2':'VISE · CHARGE · FRAPPE !',835,671,18,'#dccaf5');c.restore();
}
const tireLabels={left:'←',right:'→',up:'↑',down:'↓',jump:'ESPACE'};
function tireSequence(s){
 const w=s.work,keys=Object.keys(tireLabels),length=tune(s,[4,5,6]);
 w.tireSequence=Array.from({length},()=>pick(keys));
 for(let i=1;i<length;i++)while(w.tireSequence[i]===w.tireSequence[i-1])w.tireSequence[i]=pick(keys);
 w.tireIndex=0;
}
function tireInput(s,k,e){
 const w=s.work;if(e.repeat||w.phase!=='charge'||!tireLabels[k]||w.clock-w.lastTireKey<.07)return;
 w.lastTireKey=w.clock;
 if(k!==w.tireSequence[w.tireIndex]){w.power=Math.max(0,w.power-.15);w.tireErrors++;bad(s,'Suis la touche illuminée !');return;}
 if(w.liftStarted===null)w.liftStarted=w.clock;
 w.power=Math.min(1,w.power+1.4/w.tireSequence.length);w.tireIndex++;w.distance+=.5;w.pulseAt=w.clock;AU.play('body');
 if(w.power>=1&&w.tireIndex===w.tireSequence.length){
  w.perfect=w.tireErrors===0&&w.clock-w.liftStarted<tune(s,[1.6,1.7,1.8]);
  good(s,w.perfect?11:7);if(w.perfect)s.xpf+=G.actionXp(s.stat,s.mode)*.5;
  w.phase='success';w.timer=0;w.power=1;w.h.msg(w.perfect?'POUSSÉE ÉCLAIR !':'BELLE POUSSÉE !','#ffe480',34);AU.play('star');
 }else if(w.tireIndex===w.tireSequence.length)tireSequence(s);
}
function drawTireChallenge(c,s,T){
 const w=s.work,win=w.phase==='success';
 const widths=w.tireSequence.map(key=>key==='jump'?108:46),total=widths.reduce((a,b)=>a+b,0)+(widths.length-1)*16;
 let keyX=835-total/2;
 w.tireSequence.forEach((key,i)=>{
  c.save();c.globalAlpha=win||i<w.tireIndex?.4:1;
  if(!win&&i===w.tireIndex){c.strokeStyle='#ffe077';c.lineWidth=4;A.rr(c,keyX-6,180,widths[i]+12,53,10);c.stroke();}
  G.keycap(c,tireLabels[key],keyX,186,widths[i]);c.restore();keyX+=widths[i]+16;
 });
 panel(c,560,255,550,22,'#14232c');c.fillStyle=win?'#ffe077':'#6de0bc';c.fillRect(565,260,540*w.power,12);
 text(c,win?'BRAVO !':w.power>0?'GARDE LE RYTHME POUR POUSSER !':'Chaque bonne touche fait avancer le pneu',835,312,21,'#f7e7bc');
 c.fillStyle='#3c4e51';c.fillRect(430,647,810,29);c.strokeStyle='#a5b8ad';c.lineWidth=3;c.beginPath();c.moveTo(430,649);c.lineTo(1240,649);c.stroke();
 const traveled=w.visualDistance||0;
 c.save();c.beginPath();c.rect(435,330,795,95);c.clip();
 c.strokeStyle='#c8d9cd';c.lineWidth=3;c.beginPath();c.moveTo(435,355);c.lineTo(1230,355);c.stroke();
 for(let m=Math.max(0,Math.floor(traveled)-9);m<traveled+12;m++){
  const x=835+(m-traveled)*45;c.beginPath();c.moveTo(x,355);c.lineTo(x,m%5===0?386:370);c.stroke();if(m%5===0)text(c,m+' m',x,410,19,'#e6eee0');
 }c.restore();c.fillStyle='#ffe077';c.beginPath();c.moveTo(835,354);c.lineTo(826,335);c.lineTo(844,335);c.fill();
 text(c,w.distance.toFixed(1)+' m',1150,338,27,'#ffe292');
 const tx=962,ty=539,r=110;
 c.fillStyle='rgba(0,0,0,.25)';A.ell(c,tx,655,130,12);c.fill();
 c.save();c.translate(tx,ty);c.rotate(traveled*45/r);
 const rubber=c.createRadialGradient(-30,-40,15,0,0,r);rubber.addColorStop(0,'#52616a');rubber.addColorStop(.6,'#29333a');rubber.addColorStop(1,'#101a20');
 c.fillStyle=rubber;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.arc(0,0,52,0,Math.PI*2,true);c.fill();
 c.strokeStyle='#73818a';c.lineWidth=3;for(const radius of [96,59]){c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}
 for(let i=0;i<28;i++){c.save();c.rotate(i*Math.PI/14);c.fillStyle='#111c22';c.beginPath();c.moveTo(96,-8);c.lineTo(109,-3);c.lineTo(109,5);c.lineTo(96,0);c.closePath();c.fill();c.restore();}c.restore();
 const moving=Math.abs(w.distance-traveled)>.025;
 BX.familyBody.pushProfile(c,s.ch,{x:765,y:570,ground:649,stride:Math.sin(traveled*9)*22,moving,hands:[{x:854,y:519},{x:867,y:542}]});
 text(c,win?'UNE NOUVELLE SÉRIE ARRIVE…':'Flèches + Espace · appuis rapides · pas de touche maintenue',835,682,17,'#bce5e4');
}
function drawCourse(c,s,T){
 const w=s.work,jump=X.courseJump(w);
 c.fillStyle='#81d4fa';c.fillRect(0,0,1280,720);c.save();c.translate(0,120);c.scale(.8,.8);
 BX.run.drawScenery(c,'parc',w.scroll,T,1600);
 for(const item of w.items){const x=item.x,width=item.width;
  if(item.kind==='cone'){
   c.fillStyle='#ed8939';c.beginPath();c.moveTo(x-22,600);c.lineTo(x,548);c.lineTo(x+22,600);c.closePath();c.fill();c.fillStyle='#fff1ce';c.fillRect(x-11,574,22,7);c.fillStyle='#553d38';c.fillRect(x-28,597,56,7);
  }else if(item.kind==='crate'){
   panel(c,x-width/2,544,width,56,'#a97642');c.strokeStyle='#e0b077';c.lineWidth=4;c.strokeRect(x-width/2+5,550,width-10,44);c.beginPath();c.moveTo(x-width/2+6,551);c.lineTo(x+width/2-6,593);c.stroke();
  }else if(item.kind==='puddle'){
   c.fillStyle='#318cc3';A.ell(c,x,600,width/2,12);c.fill();c.strokeStyle='#b7eaff';c.lineWidth=3;c.beginPath();c.ellipse(x,598,width*.34,5,0,.2,2.5);c.stroke();
  }else{
   c.fillStyle='#111322';A.ell(c,x,602,width/2,16);c.fill();c.strokeStyle=item.kind==='sewer'?'#798c9b':'#7f6049';c.lineWidth=7;c.stroke();
   if(item.kind==='sewer'){c.save();c.translate(x+width*.65,594);c.rotate(-.4);c.fillStyle='#485966';A.ell(c,0,0,width*.42,11);c.fill();c.strokeStyle='#a2b2bb';c.lineWidth=2;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*8,-8);c.lineTo(i*8,8);c.stroke();}c.restore();}
  }
 }
 const hurt=!!w.recover,falling=hurt&&w.fall,age=clamp(w.clock-(w.hitAt||0),0,1.1),fallX=w.fallX??800;
 c.save();c.beginPath();
 if(falling){c.rect(0,0,1600,602);c.ellipse(fallX,602,w.fallWidth/2,16,0,0,Math.PI*2);}
 else c.rect(0,0,1600,720);
 c.clip();
 if(hurt&&!falling)c.globalAlpha=.6+.3*Math.cos(age*25);
 c.translate(falling?fallX:800,600-(hurt?0:jump)+(falling?age*age*340:0));
 if(hurt&&!falling)c.rotate(-.25*Math.sin(age*Math.PI/1.1));c.translate(-800,-600);
 runner(c,s,800,600,w.motion*1.7,.85);c.restore();
 if(falling){c.strokeStyle=w.hitKind==='sewer'?'#798c9b':'#7f6049';c.lineWidth=7;c.beginPath();c.ellipse(fallX,602,w.fallWidth/2,16,0,0,Math.PI);c.stroke();}
 c.restore();c.fillStyle='#455a64';c.fillRect(0,696,1280,24);
 G.drawTrainingVitals(c,{hp:w.lives,maxHp:3},{health:true,stamina:false});
 text(c,Math.floor(w.scroll/35)+' m',1100,238,24,'#fff4d2');
 if(hurt)text(c,w.failed?'FIN DU DÉFI':'ON SE RELÈVE !',835,300,30,'#ffe0a3');
 else{G.keycap(c,'ESPACE',780,210,112);text(c,'SAUTE !',836,283,22,'#fff4d2');}
}
// Salves annoncées, sans croisement ni deux réponses incompatibles au même instant.
X.ballTypes=[
 {id:'tennis',name:'Tennis',color:'#c5df60',pace:1,duck:false},
 {id:'plastic',name:'Plastique',color:'#ee8b9c',pace:1.05,duck:false},
 {id:'foam',name:'Mousse',color:'#67d4df',pace:1.15,duck:false},
 {id:'beam',name:'Barre en mousse',color:'#f5ce65',pace:1.12,duck:true},
 {id:'panelL',name:'Passage à gauche',color:'#b595ef',pace:1.08,safe:'left'},
 {id:'panelR',name:'Passage à droite',color:'#b595ef',pace:1.08,safe:'right'},
 {id:'basket',name:'Basket',color:'#dca16b',pace:1.08,duck:false},
 {id:'football',name:'Football',color:'#f2eee1',pace:1,duck:false},
 {id:'baseball',name:'Baseball',color:'#fff5dd',pace:.95,duck:false},
 {id:'rugby',name:'Rugby',color:'#b9794e',pace:1.05,duck:false},
 {id:'frisbee',name:'Frisbee',color:'#c28bff',pace:1,duck:false}
];
X.ballXpMultiplier=w=>1+(w.momentum||0)*1.5+Math.min(.75,(w.rhythmTime||0)*.01875);
X.ballFlightTime=lvl=>Math.max(.55,1-(clamp(lvl,1,10)-1)*.05);
G.LEVELS.tennis=Array.from({length:10},(_,i)=>'Base : '+X.ballFlightTime(i+1).toFixed(2).replace('.',',')+' s · balles variées');
X.throwBall=function(s,kind,duration){
 const w=s.work,type=X.ballTypes.find(t=>t.id===kind)||pick(X.ballTypes),from=Math.random()<.5?-1:1;
 const item={type:type.id,duck:type.duck,safe:type.safe,from,u:0,done:false,dur:duration||Math.max(tune(s,[1.25,.7,.55]),tune(s,[1.8,1,.82])*type.pace*(1-.35*w.momentum))};
 w.items.push(item);w.throwAt=w.clock;AU.play('whoosh');return item;
};
X.tennisPatterns=[['tennis'],['plastic','foam'],['beam','basket'],['panelL','panelR'],['tennis','beam','panelL'],['panelR','plastic','beam']];
X.tennisGap=s=>tune(s,[.95,.56,.62]);
// Deux couloirs visés à la fois, toujours une zone réellement libre.
X.throwVolley=function(s,lanes,duration,types=['tennis','basket']){
 const id=++s.work.volleyId,safe=[-1,0,1].find(lane=>!lanes.includes(lane));
 return lanes.map((lane,i)=>Object.assign(X.throwBall(s,types[i%types.length],duration),{volley:id,lane,safe:safe===0?'center':safe<0?'left':'right'}));
};
const tennisWaves=[
 [{lanes:[-1,0],types:['football','basket']},{lanes:[-1,1],types:['frisbee','baseball']},{lanes:[0,1],types:['rugby','tennis']}],
 [{kind:'beam'},{lanes:[0,1],types:['basket','football']},{lanes:[-1,1],types:['tennis','frisbee']},{kind:'rugby'}],
 [{lanes:[-1,1],types:['baseball','rugby']},{lanes:[-1,0],types:['foam','frisbee']},{kind:'beam'},{lanes:[0,1],types:['football','plastic']}],
 [{lanes:[0,1],types:['frisbee','basket']},{lanes:[-1,0],types:['rugby','baseball']},{lanes:[0,1],types:['foam','football']},{lanes:[-1,1],types:['basket','tennis']}]
];
function updateTennis(s,dt){
 const w=s.work;w.next-=dt;
 if(w.next<=0&&!w.items.some(i=>!i.done)&&!w.throws.length){
  const tier=G.tier(s.difficulty),wave=w.wave++;
  const pattern=tier===3?tennisWaves[wave%tennisWaves.length]:tier===2&&wave%3===2?tennisWaves[Math.floor(wave/3)%tennisWaves.length].slice(0,2):X.tennisPatterns[wave%X.tennisPatterns.length].map(kind=>({kind}));
  const gap=X.tennisGap(s),dur=Math.max(tune(s,[1.25,.7,.55]),tune(s,[1.8,1,.82])*(1-.3*w.momentum));
  let at=w.clock;
  w.throws=pattern.map(entry=>{const shot={...entry,at,dur};at+=gap+Math.random()*tune(s,[.22,.18,.12]);return shot;});w.next=100;
 }
 while(w.throws.length&&w.throws[0].at<=w.clock){const shot=w.throws.shift();if(shot.lanes)X.throwVolley(s,shot.lanes,shot.dur,shot.types);else X.throwBall(s,shot.kind,shot.dur);}
 for(const item of w.items){
  item.u+=dt/(item.dur||1);
  if(item.u>=1&&!item.done){
   item.done=true;const age=w.clock-w.dodgeAt,active=age>=0&&age<=tune(s,[1,.75,.55]);
   const guard=w.held.down&&w.dodge==='guard';
   const damage=['basket','rugby','football'].includes(item.type)?12:8;
   let ok;
   if(item.volley){
    const defense=s.combat?BX.fight.practice.defense(s.combat):active?w.dodge:null;
    const lane=defense==='L'||defense==='left'?-1:defense==='R'||defense==='right'?1:0;
    ok=lane===(item.safe==='left'?-1:item.safe==='right'?1:0);
    if(!ok&&s.combat)G.combatAttack(s,[],damage);
    for(const other of w.items)if(other.volley===item.volley){other.done=true;other.u=Math.max(other.u,1);other.avoided=ok;other.exitSide=other.lane||item.from||1;}
   }else ok=s.combat?G.combatAttack(s,item.duck?['duck']:item.safe?[item.safe==='left'?'L':'R']:['L','R','block'],damage):item.duck?active&&w.dodge==='down':item.safe?active&&w.dodge===item.safe:guard||active&&['left','right'].includes(w.dodge);
   item.avoided=ok;item.exitSide=w.dodge==='left'?1:w.dodge==='right'?-1:(item.from||1);w.lastBall=item;
   if(ok){w.momentum=Math.min(1,w.momentum+.05);w.rhythmTime+=item.dur||1;const bonus=X.ballXpMultiplier(w);good(s,3);s.xpf+=G.actionXp(s.stat,s.mode)*(bonus-1);AU.play(guard?'block':'whoosh');}
   else {if(!s.combat){w.hp=Math.max(0,w.hp-damage);if(!w.hp){w.failed=true;G.finish();}}w.momentum=Math.max(0,w.momentum-.08);w.rhythmTime=Math.max(0,w.rhythmTime-2);bad(s,item.safe==='center'?'Reste au centre : les côtés sont visés !':item.duck?'Deux fois ↓ pour passer sous la barre !':item.safe==='left'?'Passe à gauche !':item.safe==='right'?'Passe à droite !':'Protège-toi ou esquive !');w.h.pose('hit');w.hitAt=w.clock;w.h.puff(640,A.ringHeadY(s.ch),'#fff0bf',12);AU.play('body');}
   if(!w.throws.length&&!w.items.some(i=>!i.done))w.next=tune(s,[.8,.45,.18])+Math.random()*tune(s,[.6,.35,.2]);
   if(w.failed)break;
  }
 }w.items=w.items.filter(i=>!i.done||(i.u-1)*(i.dur||2.7)<.18);
}
function drawTennis(c,s,T){
 const w=s.work,item=w.items.find(i=>!i.done),age=w.clock-(w.dodgeAt??-10),hitAge=w.clock-(w.hitAt??-10);
 // Lignes convergentes et marques au sol rendent la distance du lanceur explicite.
 c.fillStyle='rgba(39,78,83,.32)';c.beginPath();c.moveTo(565,380);c.lineTo(715,380);c.lineTo(1000,715);c.lineTo(280,715);c.closePath();c.fill();
 c.strokeStyle='rgba(232,219,174,.5)';c.lineWidth=3;
 for(const side of [-1,1]){c.beginPath();c.moveTo(640+side*75,380);c.lineTo(640+side*360,715);c.stroke();}
 for(let i=1;i<=4;i++){const u=i/5,y=380+u*u*325;c.beginPath();c.moveTo(640-75-u*260,y);c.lineTo(640+75+u*260,y);c.stroke();}
 const from=item?.from||1,throwAge=w.clock-(w.throwAt??-10);
 A.cornerCoach(c,s.coach||BX.charById('richard'),640,430,.4,T,from,false,throwAge<.35?-Math.PI/2+throwAge*8:0);
 text(c,'LE LANCEUR',640,190,17,'#ded6b4');text(c,'RYTHME +'+Math.round((1/(1-.35*w.momentum)-1)*100)+' % · XP ×'+X.ballXpMultiplier(w).toFixed(2),1090,157,18,'#ffd54f');
 const headY=A.ringHeadY(s.ch),pose={inRing:true,st:'idle',time:T};
 if(hitAge<.36){pose.st='hit';pose.t=hitAge/.36;pose.hitSide=1;}
 else if(age<tune(s,[1,.75,.55])&&w.dodge!=='guard'){pose.st=w.dodge==='down'?'duck':'dodge';pose.dir=w.dodge==='left'?-1:1;pose.t=Math.min(.85,age/tune(s,[1,.75,.55]));}
 else if(w.held.down&&w.dodge==='guard')pose.st='block';
 // La balle et les commandes restent visibles, sans cercle autour du joueur.
 if(item){const remaining=(1-item.u)*item.dur,near=remaining<=(tune(s,[1,.75,.55])),color=near?'#93e8ad':'#f2d58b';
  const def=X.ballTypes.find(t=>t.id===item.type)||X.ballTypes[0];
  panel(c,925,180,330,156);text(c,item.volley?'SALVE · 2 PROJECTILES':def.name.toUpperCase(),1090,215,24,def.color);text(c,item.safe==='center'?'RESTE AU CENTRE':item.duck?'↓↓  PENCHE-TOI':item.safe==='left'?'←  À GAUCHE':item.safe==='right'?'À DROITE  →':'←  →  OU  ↓',1090,261,29,color);text(c,near?'MAINTENANT !':'Regarde venir…',1090,307,20,color);
  const next=w.items.find(i=>!i.done&&i!==item&&(!item.volley||i.volley!==item.volley))||w.throws[0];if(next){const defNext=X.ballTypes.find(t=>t.id===(next.type||next.kind));text(c,'ENSUITE : '+(next.lanes||next.volley?'SALVE DOUBLE':defNext?.name||'SURPRISE'),1090,362,17,'#fff1c8');}
 }
 if(item?.volley){for(const lane of [-1,0,1]){const safe=(item.safe==='left'?-1:item.safe==='right'?1:0)===lane,x=640+lane*185*A.ringScale(s.ch);c.save();c.globalAlpha=.55;c.fillStyle=safe?'#73e6a5':'#f28179';A.ell(c,x,690,48,13);c.fill();c.restore();text(c,safe?'ICI':'×',x,694,16,safe?'#123d32':'#622b32');}}
 A.player(c,s.ch,s.combat?{...G.combatPose(s),inRing:true,time:T}:pose);
 for(const ballItem of w.items){
  const def=X.ballTypes.find(t=>t.id===ballItem.type)||X.ballTypes[0],u=ballItem.u,depth=Math.pow(Math.min(1,u),4),late=clamp(Math.max(0,u-1)*(ballItem.dur||1)/.18,0,1);
  if(ballItem.done&&!ballItem.avoided)continue;
  // Perspective speeds up the approach; an avoided ball clears the head in 180 ms.
  const x=A.lerp(640+(ballItem.from||1)*59,640+(ballItem.lane||0)*185*A.ringScale(s.ch),depth)+(ballItem.exitSide||1)*late*720,y=A.lerp(308,headY,depth)-Math.sin(Math.min(1,u)*Math.PI)*(ballItem.duck?60:18)+late*130;
  const r=A.lerp(10,def.id==='basket'?51:39,depth)+late*55;
  c.save();c.globalAlpha=clamp((1-late)*4,0,1);
  if(def.duck||def.safe){
   const width=def.duck?r*8:r*3,height=def.duck?r*.8:r*4,offset=def.safe==='left'?r*2:def.safe==='right'?-r*2:0;
   c.fillStyle=def.color;A.rr(c,x-width/2+offset,y-height/2,width,height,Math.max(4,r*.2));c.fill();
   c.save();c.clip();c.strokeStyle='#594965';c.lineWidth=Math.max(3,r*.2);for(let stripe=-8;stripe<9;stripe++){c.beginPath();c.moveTo(x+offset+stripe*r,y-height);c.lineTo(x+offset+stripe*r+height,y+height);c.stroke();}c.restore();
   text(c,def.duck?'↓↓':def.safe==='left'?'←':'→',x+offset,y+7,Math.max(14,r*.6),'#fff');c.restore();continue;
  }
  if(def.id==='frisbee'||def.id==='rugby'){c.fillStyle=def.color;c.beginPath();c.ellipse(x,y,r*1.25,r*(def.id==='frisbee'?.3:.65),def.id==='rugby'?.35:0,0,Math.PI*2);c.fill();c.strokeStyle='#fff5d8';c.lineWidth=3;c.beginPath();c.moveTo(x-r*.55,y);c.lineTo(x+r*.55,y);c.stroke();c.restore();continue;}
  ball(c,x,y,r,def.color);c.strokeStyle=def.id==='basket'?'#754f36':'rgba(255,255,255,.75)';c.lineWidth=2;
  if(def.id==='basket'){c.beginPath();c.arc(x,y,r*.75,-1.2,1.2);c.moveTo(x-r,y);c.lineTo(x+r,y);c.stroke();}
  else if(def.id==='football'){c.fillStyle='#263b43';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.beginPath();c.arc(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,r*.2,0,Math.PI*2);c.fill();}}
  else if(def.id==='baseball'){c.strokeStyle='#ce5252';c.beginPath();c.arc(x-r*.65,y,r*.85,-1.15,1.15);c.stroke();c.beginPath();c.arc(x+r*.65,y,r*.85,Math.PI-1.15,Math.PI+1.15);c.stroke();}
  else if(def.id==='tennis'){c.beginPath();c.arc(x-r*.65,y,r*.85,-1.15,1.15);c.stroke();}c.restore();
 }
 if(hitAge<.35){text(c,'POC !',735,headY-20,34,'#ffe0a6');}
 if(!item)text(c,'Prêt ? Regarde le lanceur au fond.',890,370,22,'#e5dbb9');
}
// Four complete sets; only a controlled full lift counts as a repetition.
function updateBench(s,dt){
 const w=s.work;
 w.demand=clamp(tune(s,[1,1.1,1.2])-(w.strength-1)*.05,.65,1.2);
 w.fatigue=w.reps*.14;
 if(w.phase==='rest'||w.phase==='recover'){
  w.energy=Math.min(1,w.energy+dt*.65);
  if(w.timer>=(w.phase==='rest'?4.2:1.6)){w.phase='lift';w.timer=0;w.balance=0;w.unstable=0;w.lift=0;w.effort=0;w.exhausted=false;w.lastHand=null;w.repTime=0;}
  return;
 }
 if(w.phase==='lower'){w.energy=Math.min(1,w.energy+dt*.5);w.lift=Math.max(0,w.lift-dt*.95);if(w.lift===0){w.phase='lift';w.effort=0;w.repTime=0;w.lastHand=null;}return;}
 if(w.phase!=='lift')return;
 w.repTime+=dt;
 const steer=(w.held.right?1:0)-(w.held.left?1:0);
 w.balance=clamp(w.balance+dt*(Math.sin(w.clock*2.5+.8)*(.34*w.demand+w.fatigue*.65+(1-w.energy)*.3)+w.balance*.3+steer*1.5),-1.2,1.2);
 w.effort=Math.max(0,w.effort-dt*(.65+w.fatigue*1.25)*w.demand*(tune(s,[.45,.65,.8])));
 const active=w.clock-w.last<.24&&!w.exhausted;
 w.energy=clamp(w.energy+dt*(active?-(.46+w.fatigue*.22)*w.demand*tune(s,[1,.7,.45]):.65),0,1);
 if(w.energy<=.03){w.exhausted=true;w.effort=0;}
 if(w.exhausted&&w.energy>=.7){w.exhausted=false;w.lastHand=null;}
 const centered=Math.abs(w.balance)<.68;
 w.unstable=centered?Math.max(0,w.unstable-dt*2):w.unstable+dt;
 if(w.unstable>.65){bad(s,'Recentre la barre ! Reprends cette répétition.');w.phase='recover';w.timer=0;w.lift=0;w.effort=0;return;}
 // Recovery holds most of the progress; rapid alternating bursts overcome the load.
 w.lift=clamp(w.lift+dt*(w.effort*(centered?1:.2)*1.15/w.demand-.12-w.fatigue*.12),0,1);
 if(w.lift>=1&&centered&&w.repTime>=1.8){
  w.reps++;const sweet=Math.abs(w.balance)<=.12,reward=[2,3,4,8,12][w.reps-1]*(sweet?1.5:1);w.lastReward=reward;w.sweet=sweet;s.xpf+=reward;s.score+=reward;AU.play('chime');w.timer=0;
  if(w.reps===5){w.sets++;good(s,0);w.reps=0;w.phase='rest';
   if(w.sets===4){w.phase='done';G.finish();}else w.h.msg('Série '+w.sets+' / 4 ! +'+reward+' XP'+(sweet?' · ZONE OR !':''),'#a4e6c2',28);
  }else {w.phase='lower';w.h.msg(w.reps+' / 5 · +'+reward+' XP'+(sweet?' · ZONE OR !':'')+(w.reps>=4?' · Derniers efforts !':''),'#a4e6c2',26);}
 }
}
function drawBench(c,s,T){
 const w=s.work,rest=w.phase==='rest',sit=rest?Math.min(1,w.timer/.65,(4.2-w.timer)/.7):0,barX=805+w.balance*20,barY=rest?440:w.phase==='recover'?528:543-w.lift*44;
 panel(c,440,130,785,130);text(c,'SÉRIE '+Math.min(4,w.sets+1)+' / 4   ·   RÉPÉTITIONS '+w.reps+' / 5',830,168,27);
 for(let i=0;i<4;i++){panel(c,665+i*85,191,65,20,i<w.sets?'#7bdf9b':'#3d5661');}
 text(c,w.load.kg+' kg · '+w.load.plates+' disque'+(w.load.plates>1?'s':'')+' / côté · Force '+w.strength+' / conseillée '+w.load.recommended,830,244,18,'#d1c4e9');
 text(c,w.exhausted?'Souffle ! Laisse la force remonter…':w.phase==='rest'?'Repose-toi… prochaine série !':w.phase==='recover'?'Barre sur les sécurités · recentre-toi':w.phase==='lower'?'Redescends… prépare la prochaine !':w.reps>=3?'Encore ! Tapote plus vite Z / X !':'Tapote Z / X · garde la barre au centre',830,295,23,'#ffe1a0');
 // Steel rack with safety arms, padded bench and short child proportions.
 for(const x of [590,1060]){panel(c,x,370,14,280,'#57717d');panel(c,x-30,645,80,15,'#263e49');panel(c,x,528,75,12,'#9bafb4');panel(c,x,438,45,8,'#9bafb4');}
 panel(c,712,584,220,24,'#8b3b44');panel(c,725,606,14,50,'#526d77');panel(c,900,606,14,50,'#526d77');
 const tilt=rest?0:w.balance*.23,rotation=-Math.PI/2+sit*1.25;
 const hands=rest?[{x:820,y:568},{x:852,y:583}]:[-1,1].map(side=>({x:barX+side*32,y:barY+side*32*Math.sin(tilt)}));
 BX.familyBody.equipment(c,s.ch,809,566,.46,{view:'side',time:T,rotation,hands,feet:[{x:862,y:636},{x:880,y:636}]});
 c.save();c.translate(barX,barY);c.rotate(tilt);c.strokeStyle='#bdced1';c.lineWidth=9;c.beginPath();c.moveTo(-175,0);c.lineTo(175,0);c.stroke();
 for(const side of [-1,1]){
  for(let i=0;i<w.load.plates;i++){
   const x=side*(104+i*6),r=29+(i%3)*3;
   const gr=c.createLinearGradient(x-5,-r,x+6,r);gr.addColorStop(0,'#a8bac6');gr.addColorStop(.25,'#46596e');gr.addColorStop(.65,'#192a40');gr.addColorStop(1,'#70869b');
   c.fillStyle=gr;c.strokeStyle='#b0bfcd';c.lineWidth=1.4;A.ell(c,x,0,5,r);c.fill();c.stroke();
   c.strokeStyle=['#e7b857','#aa98e1','#79c9cd'][G.effectTheme(s.goT,3)];A.ell(c,x,0,3,r-5);c.stroke();
  }
  c.fillStyle='#e0d7bd';c.fillRect(side*(110+w.load.plates*6)-3,-9,6,18);
 }

 c.restore();
 panel(c,620,322,410,36);c.fillStyle='#446e57';c.fillRect(723,327,204,26);const gold=c.createLinearGradient(0,327,0,353);gold.addColorStop(0,'#fff0a0');gold.addColorStop(.5,'#ffd54f');gold.addColorStop(1,'#bc821c');c.fillStyle=gold;c.fillRect(807,327,36,26);ball(c,825+w.balance*150,340,8,Math.abs(w.balance)<=.12?'#fff5c3':Math.abs(w.balance)<.68?'#a9f1bf':'#ff9c88');
 text(c,'← ÉQUILIBRE →',1110,338,15);text(c,'OR : XP +50 %',1110,357,14,'#ffd54f');
 for(const [x,value,label] of [[470,w.energy,'FORCE RESTANTE'],[855,w.lift,'POUSSÉE']]){text(c,label,x+145,668,14);panel(c,x,677,290,10,'#324750');c.fillStyle='#7bdf9b';c.fillRect(x,677,290*value,10);}
}
// A fixed timeline rewards anticipation instead of button-spamming.
function sledSequence(s){
 const w=s.work,keys=['left','right','jump'],pace=tune(s,[1.15,1,.82]),sequence=w.sequence++,base=w.clock+1.25;
 w.notes=[];
 // Each lane has its own timeline; long holds overlap taps on other keys.
 for(let lane=0;lane<3;lane++){
  let at=base+lane*.55*pace;
  for(let i=0;i<3;i++){
   const hold=i===1&&lane!==sequence%3?0:[2.4,.45,1.4,3.1,.8][(lane+i+sequence)%5]*rand(.85,1.15)*pace;
   w.notes.push({key:keys[lane],at,hold,done:false,started:false});
   at+=hold+rand(.55,1.4)*pace;
  }
 }
 w.notes.sort((a,b)=>a.at-b.at);w.tempo=Math.round(60/pace);
}
function sledWin(s,n,perfect){
 const w=s.work;n.done=true;good(s,perfect?5:3);w.drive=Math.min(1,w.drive+(n.hold?.5:.3));w.feedback=n.hold?'POUSSÉE PUISSANTE !':perfect?'PARFAIT !':'BIEN !';w.feedbackAt=w.clock;AU.play('body');
}
function sledInput(s,k){
 if(!['left','right','jump'].includes(k))return;
 const w=s.work,n=w.notes.find(n=>!n.done&&!n.started&&n.key===k);if(!n)return;
 if(n.started)return;
 const error=Math.abs(w.clock-n.at);
 if(k!==n.key||error>X.sledWindow(s)){bad(s,k!==n.key?'Suis le prochain symbole !':'Attends le cercle !');w.drive*=.65;w.feedback='REPRENDS LE RYTHME';w.feedbackAt=w.clock;return;}
 if(n.hold){n.started=true;w.feedback='MAINTIENS '+({left:'←',right:'→',jump:'ESPACE'}[n.key])+'…';w.feedbackAt=w.clock;}
 else {w.tapUntil=w.clock+.14;w.tapKey=n.key;sledWin(s,n,error<.085);}
}
function updateSled(s,dt){
 const w=s.work,pushing=w.notes.some(n=>!n.done&&n.started&&w.held[n.key])||(w.clock<(w.tapUntil||0)&&w.held[w.tapKey]);
 for(const n of w.notes){
  if(n.done)continue;
  if(!n.pulsed&&w.clock>=n.at){n.pulsed=true;AU.play('tick');}
  if(n.started){
   if(!w.held[n.key]){n.done=true;bad(s,'Garde la touche jusqu’au bout !');w.drive*=.5;}
   else if(w.clock>=n.at+n.hold)sledWin(s,n,true);
  }else if(w.clock>n.at+X.sledWindow(s)){n.done=true;bad(s,'Poussée manquée !');w.drive*=.65;w.feedback='RATÉ';w.feedbackAt=w.clock;}
 }
 if(w.notes.every(n=>n.done))sledSequence(s);
 w.drive=Math.max(0,w.drive-dt*.13);w.speed=pushing?38+w.drive*47:0;w.distance+=w.speed*dt*.12;w.motion=(w.motion||0)+w.speed*dt*.022;
}
function drawSled(c,s,T){
 const w=s.work,move=w.motion||0,ground=638;
 // Rubber track, distance markers and parallel metal runners.
 panel(c,20,390,1240,285,'#34464a');
 c.save();c.beginPath();c.rect(20,390,1240,285);c.clip();
 for(let i=-1;i<18;i++){const x=30+i*85-(w.distance*14)%85;c.strokeStyle='#526968';c.lineWidth=2;c.beginPath();c.moveTo(x,395);c.lineTo(x-90,675);c.stroke();}
 for(const y of [605,650]){c.strokeStyle='#b5baa0';c.lineWidth=3;c.beginPath();c.moveTo(20,y);c.lineTo(1245,y);c.stroke();}c.restore();
 // Graduation au mur : le repère fixe indique la distance réellement poussée.
 c.save();c.beginPath();c.rect(30,326,1200,62);c.clip();c.fillStyle='#d8d4bc';c.fillRect(30,347,1200,4);
 const pixelsPerMeter=45;for(let m=Math.max(0,Math.floor(w.distance)-14);m<w.distance+15;m++){
  const x=640+(m-w.distance)*pixelsPerMeter;c.strokeStyle='#eae3bd';c.lineWidth=2;c.beginPath();c.moveTo(x,347);c.lineTo(x,m%5===0?371:360);c.stroke();if(m%5===0)text(c,m+' m',x,385,14,'#fff3c6');
 }c.restore();c.fillStyle='#ffd166';c.beginPath();c.moveTo(640,351);c.lineTo(631,334);c.lineTo(649,334);c.fill();text(c,w.distance.toFixed(1)+' m',1110,335,22,'#ffe1a0');
 c.save();c.translate(-190,0);
 // Sled: bevelled steel base, paired uprights and shaded weight plates.
 c.fillStyle='rgba(0,0,0,.28)';A.ell(c,960,653,195,14);c.fill();
 c.fillStyle='#15242d';c.beginPath();c.moveTo(793,623);c.lineTo(1180,623);c.lineTo(1155,654);c.lineTo(815,654);c.closePath();c.fill();
 c.strokeStyle='#8ba6ad';c.lineWidth=5;c.stroke();panel(c,825,608,325,19,'#526d77');
 // Low push handles fit the child's reach; both grips stay fixed during the stride.
 for(const x of [834,858]){c.strokeStyle='#20333f';c.lineWidth=12;c.beginPath();c.moveTo(x+12,618);c.lineTo(x,520);c.stroke();c.strokeStyle='#a5bec1';c.lineWidth=3;c.beginPath();c.moveTo(x+9,610);c.lineTo(x-2,523);c.stroke();c.strokeStyle='#17242a';c.lineWidth=14;c.beginPath();c.moveTo(x,523);c.lineTo(x+2,547);c.stroke();}
 // Equal-diameter rubber plates: solid sidewalls, inset rings and a central loading post.
 const plateX=1010,rx=66,ry=19,thickness=13;
 for(let i=0;i<5;i++){
  const y=598-i*14;
  const edge=c.createLinearGradient(plateX-rx,y,plateX+rx,y+thickness);
  edge.addColorStop(0,'#18252d');edge.addColorStop(.45,'#425664');edge.addColorStop(1,'#14222a');
  c.fillStyle=edge;c.beginPath();c.ellipse(plateX,y+thickness,rx,ry,0,0,Math.PI);c.lineTo(plateX-rx,y);c.ellipse(plateX,y,rx,ry,0,Math.PI,0);c.closePath();c.fill();
  c.fillStyle='#425866';A.ell(c,plateX,y,rx,ry);c.fill();c.strokeStyle='#82989f';c.lineWidth=1.5;c.stroke();
  c.strokeStyle='#253b48';c.lineWidth=2;A.ell(c,plateX,y,rx-8,ry-4);c.stroke();
  c.fillStyle='#13232b';A.ell(c,plateX,y,10,4);c.fill();
  c.strokeStyle='#718995';c.lineWidth=1;c.beginPath();c.ellipse(plateX,y+thickness-2,rx-1,ry,0,.12,Math.PI-.12);c.stroke();
  text(c,'20 KG',plateX,y+thickness+8,8,'#d7e0dc');
 }
 const post=c.createLinearGradient(1005,0,1015,0);post.addColorStop(0,'#526a75');post.addColorStop(.45,'#d4e0de');post.addColorStop(1,'#526a75');
 c.fillStyle=post;c.fillRect(1005,518,10,24);c.fillStyle='#b4c5c7';A.ell(c,1010,518,5,2.5);c.fill();
 // Compact child proportions: shorter torso, arms and legs with the portrait kept readable.
 const bob=Math.sin(move*8)*Math.min(2,w.speed*.06);
 BX.familyBody.pushProfile(c,s.ch,{x:752,y:570+bob,ground,stride:Math.sin(move*8),moving:w.speed>0,hands:[{x:835,y:534},{x:860,y:544}]});
 c.restore();
 // Three independent lanes share the same timing line.
 panel(c,30,115,1220,182,'#122a36');
 const target=255,rate=185,keys=['left','right','jump'],colors=['#83d9f5','#b8a1ff','#ffcd77'];
 for(let lane=0;lane<3;lane++){
  const y=146+lane*57;c.strokeStyle='#355866';c.lineWidth=3;c.beginPath();c.moveTo(195,y);c.lineTo(1220,y);c.stroke();
  text(c,['←','→','ESPACE'][lane],106,y+7,lane===2?20:32,colors[lane]);
  c.strokeStyle=colors[lane];c.beginPath();c.arc(target,y,22,0,Math.PI*2);c.stroke();
 }
 c.save();c.beginPath();c.rect(205,120,1025,170);c.clip();
 for(const n of w.notes){if(n.done)continue;const lane=keys.indexOf(n.key),y=146+lane*57,x=target+(n.at-w.clock)*rate,col=n.started?'#fff2a3':colors[lane];
  if(n.hold){c.strokeStyle=col;c.lineWidth=14;c.beginPath();c.moveTo(Math.max(target,x),y);c.lineTo(x+n.hold*rate,y);c.stroke();}
  ball(c,n.started?target:x,y,18,'#254b59');text(c,n.key==='left'?'←':n.key==='right'?'→':'•',n.started?target:x,y+7,25,col);
 }c.restore();
 text(c,w.clock-(w.feedbackAt||-10)<.9?w.feedback:'Une ligne par touche · maintiens et joue les autres en même temps',640,320,20,'#a6ece0');

}
// L'identifiant escaliers reste stable pour conserver les niveaux des sauvegardes.
function avalancheInput(s,k,e){
 const w=s.work;if(e.repeat||w.recover>0)return;
 if(k==='jump'){if(w.clock-w.jumpAt>=1.05){w.jumpAt=w.clock;AU.play('whoosh');}return;}
 if(k!=='A'&&k!=='B')return;
 const interval=.6-s.lvl*.022,gap=w.clock-w.last;
 if(k===w.lastHand||gap<interval*.5){bad(s,'Alterne Z et X !');w.speed*=.8;}
 else{good(s,2);w.speed=Math.min(290,w.speed+105);w.stride++;}
 w.last=w.clock;w.lastHand=k;
}
function avalancheLoseLife(s,fall){
 const w=s.work;if(w.recover>0||w.lives<=0)return;
 w.lives--;w.fall=fall;w.recover=1.4;w.speed=0;w.boost=0;w.jumpAt=-10;
 bad(s,fall?'Chute !':'Rattrapé !');AU.play(fall?'down':'thunder');
 if(!fall)w.catches++;
}
function avalancheJump(w){const age=w.clock-w.jumpAt;return age>=0&&age<1?Math.sin(age*Math.PI)*125:0;}
function updateAvalanche(s,dt){
 const w=s.work;
 // Petits pas : collisions et sauts restent cohérents même après une frame lente.
 let left=dt;w.clock-=dt;
 while(left>0){const d=Math.min(left,.02);left-=d;w.clock+=d;
  w.boost=Math.max(0,w.boost-d);
  if(w.recover>0){w.recover=Math.max(0,w.recover-d);if(w.recover===0){if(w.lives===0){G.finish();return;}w.fall=false;w.gap=265;w.lastHand=null;w.last=-100;w.scroll+=250;w.items=[];w.nextGap=w.scroll+650;}continue;}
  w.speed=Math.max(0,w.speed-d*110);
  const velocity=w.speed+(w.boost>0?130:0),old=w.scroll;
  w.scroll+=velocity*d;w.distance=w.scroll/10;w.motion+=velocity*d/170;
  w.gap=clamp(w.gap+(velocity-(120+s.lvl*3))*d,0,400);
  while(w.nextGap<w.scroll+950){
   const start=w.nextGap,width=[65,105,165][w.gapCount%3]+s.lvl*2+rand(0,12);
   w.items.push({type:'gap',x:start,width,hit:false,done:false});
   if(w.gapCount++%2===0)w.items.push({type:'boost',x:start-210,done:false});
   w.nextGap+=width+rand(420,950)-s.lvl*8;
  }
  for(const it of w.items){
   if(it.done)continue;
   if(it.type==='boost'&&old<=it.x+22&&w.scroll>=it.x-22&&avalancheJump(w)<65){
    it.done=true;w.boost=2;w.gap=Math.min(400,w.gap+55);w.boosts++;AU.play('star');w.h.msg('ADRÉNALINE ! +2 s','#84e9f5',30);
   }
   if(it.type==='gap'){
    if(w.scroll>=it.x&&old<=it.x+it.width&&avalancheJump(w)<24&&!it.hit){
     it.hit=true;avalancheLoseLife(s,true);break;
    }
    if(w.scroll>it.x+it.width){it.done=true;if(!it.hit){good(s,5);w.cleared++;w.gap=Math.min(400,w.gap+30);}}
   }
  }
  w.items=w.items.filter(it=>it.x+(it.width||0)>w.scroll-650);
  if(w.gap<=35&&w.recover===0)avalancheLoseLife(s,false);
 }
}
function drawAvalanche(c,s,T){
 const w=s.work,danger=1-clamp((w.gap-35)/300,0,1),shake=w.recover>0?10:danger*danger*6;
 c.save();c.translate(Math.sin(T*71)*shake,Math.cos(T*53)*shake*.6);
 const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,'#f5dca4');sky.addColorStop(1,'#fbeac8');c.fillStyle=sky;c.fillRect(-20,-20,1320,760);
 c.fillStyle='#fff4cf';A.ell(c,1050,138,72,72);c.fill();
 function poly(points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 for(let layer=0;layer<3;layer++)for(let i=-1;i<6;i++){
  const x=i*410-(w.scroll*(.08+layer*.065))%410,y=260+layer*90;
  poly([[x-240,720],[x+170,y],[x+480,720]],['#a4abb3','#8796a3','#657b8d'][layer]);
  poly([[x+170,y],[x+97,y+105],[x+160,y+78],[x+185,y+113],[x+225,y+100]],'#e6edf0');
 }
 const ground=x=>550-(x-800)*.22;
 // Dessiner de vraies coupures dans la falaise, aux coordonnées des collisions.
 const gaps=w.items.filter(it=>it.type==='gap').map(it=>[800+it.x-w.scroll,800+it.x+it.width-w.scroll]).sort((a,b)=>a[0]-b[0]);
 let edge=-30;
 function ledge(a,b){if(b<a)return;poly([[a,ground(a)],[b,ground(b)],[b-25,760],[a-35,760]],'#474b59');poly([[a,ground(a)+18],[b,ground(b)+18],[b-25,ground(b)+90],[a,ground(a)+140]],'#69717e');poly([[a,ground(a)],[b,ground(b)],[b-6,ground(b)+13],[a+6,ground(a)+18]],'#f3f4e8');for(let x=a+45;x<b;x+=110)poly([[x,ground(x)+55],[Math.min(b,x+80),ground(x)+75],[x-20,ground(x)+180]],'#565c69');}
 for(const [a,b] of gaps){if(b<edge||a>1310)continue;ledge(edge,a);edge=b;}ledge(edge,1320);
 for(const it of w.items){const x=800+it.x-w.scroll;if(x<390||x>1300)continue;
  if(it.type==='boost'&&!it.done){const y=ground(x)-48; c.save();c.shadowColor='#62e8ff';c.shadowBlur=24;ball(c,x,y,18,'#45bcd9');c.restore();ball(c,x,y,11,'#ffce4e');text(c,'ϟ',x,y+7,23,'#fff5c3');}
  if(it.type==='gap'&&!it.done){c.strokeStyle='#ffc469';c.lineWidth=4;c.beginPath();c.moveTo(x-13,ground(x)-4);c.lineTo(x-13,ground(x)-56);c.stroke();poly([[x-13,ground(x)-56],[x+15,ground(x)-48],[x-13,ground(x)-37]],'#fa8857');}
 }
 const rockX=800-w.gap-185,rockY=ground(rockX)-170;
 // Mur de neige, puis rocher à facettes en rotation.
 for(let i=0;i<22;i++){const x=rockX-190+(i*73)%290,y=rockY-130+(i*97)%460;c.fillStyle=i%3?'#e8edf0':'#bfced8';A.ell(c,x+Math.sin(T*3+i)*15,y,65+(i%4)*14,65);c.fill();}
 c.save();c.translate(rockX,rockY);c.rotate(w.scroll/185+T*.7);const points=Array.from({length:11},(_,i)=>{const a=i*Math.PI*2/11,r=185+(i%3)*9;return [Math.cos(a)*r,Math.sin(a)*r];});poly(points,'#665d59');for(let i=0;i<11;i++)poly([[20,-15],points[i],points[(i+1)%11]],['#7c7169','#968577','#625c59','#83766c'][i%4]);poly([[-100,-65],[-40,-145],[70,-110],[110,-40],[10,15]],'#a09385');c.restore();
 for(let i=0;i<16;i++){const x=rockX+80+(i*41)%160,y=ground(x)-(i*29+T*120)%310;c.fillStyle=i%3?'#eef4f4':'#7b7370';A.ell(c,x,y,5+i%5,4+i%7);c.fill();}
 if(w.boost>0){c.strokeStyle='#8de5f2';c.lineWidth=5;for(let i=0;i<5;i++){c.beginPath();c.moveTo(700-i*14,490+i*19);c.lineTo(770,480+i*19);c.stroke();}}
 c.save();if(w.recover>0)c.globalAlpha=.4+.3*Math.sin(T*20);runner(c,s,800,550-avalancheJump(w)+(w.fall?Math.pow(1.4-w.recover,2)*620:0),w.motion*1.7,.78);c.restore();
 c.restore();
 // Une seule touche au-dessus du coureur, sans panneau de consignes.
 G.drawTrainingVitals(c,{hp:w.lives,maxHp:3},{health:true,stamina:false});
 if(s.phase==='go'&&w.recover===0){
  const next=w.items.find(it=>it.type==='gap'&&!it.done&&it.x+it.width>w.scroll);
  const velocity=w.speed+(w.boost>0?130:0),distance=next?next.x-w.scroll:Infinity;
  const canJump=w.clock-w.jumpAt>=1.05;
  const jump=canJump&&distance>0&&distance<Math.max(30,velocity*(next&&next.width>150?.16:.24));
  const label=jump?'ESPACE':w.lastHand==='A'?'X':'Z';
  if(jump||w.clock-w.last>=(.6-s.lvl*.022)*.55){
   const scale=2.1,width=jump?108:46;
   c.save();c.translate(800-width*scale/2,335-avalancheJump(w));c.scale(scale,scale);G.keycap(c,label,0,0,width);c.restore();
  }
 }

}

function targetCue(s){
 const w=s.work;
 if(!w.deck.length){w.deck=Array.from({length:6},(_,i)=>i);for(let i=5;i>0;i--){const j=Math.random()*(i+1)|0;[w.deck[i],w.deck[j]]=[w.deck[j],w.deck[i]];}if(w.deck[5]===w.target)[w.deck[0],w.deck[5]]=[w.deck[5],w.deck[0]];}
 w.target=w.deck.pop();w.phase='waiting';w.timer=0;w.wait=rand(.45,1.05);w.limit=easy(s)?1.9:1.35-(s.lvl-1)*.075;
}
function targetInput(s,k,e){
 const w=s.work;if(e.repeat||!['A','B'].includes(k)||w.phase!=='open')return;
 const zone=w.held.up&&w.held.down?-1:w.held.up?0:w.held.down?2:1;
 w.strike={hand:k,row:zone,at:w.clock};
 const correct=(k==='A'?0:3)+zone===w.target&&zone>=0;
 if(w.phase==='open'&&correct){
  const reaction=w.timer;w.lastReaction=reaction;w.bestReaction=Math.min(w.bestReaction,reaction);w.totalReaction+=reaction;w.hits++;good(s,reaction<.3?6:3);AU.play('punch');w.phase='hit';w.timer=0;
  w.h.msg(Math.round(reaction*1000)+' ms'+(reaction<.3?' · ÉCLAIR !':''),reaction<.3?'#ffe08b':'#a4e6c2',30);
 }else{bad(s,w.phase!=='open'?'Attends que la cible soit face à toi !':'Le bon côté et la bonne hauteur !');w.phase='miss';w.timer=0;}
}
function updateTargets(s){
 const w=s.work;
 if(w.phase==='waiting'&&w.timer>=w.wait){w.phase='opening';w.timer=0;AU.play('wood');}
 else if(w.phase==='opening'&&w.timer>=.18){w.phase='open';w.timer=0;}
 else if(w.phase==='open'&&w.timer>w.limit){w.phase='miss';w.timer=0;}
 else if(['hit','miss'].includes(w.phase)&&w.timer>=.38)targetCue(s);
}
function drawTargets(c,s,T){
 const w=s.work,rows=[235,415,595],labels=['VISAGE · ↑','HAUT DU CORPS','BAS DU CORPS · ↓'];
 panel(c,0,0,1280,720,'#30333b');
 text(c,'LES SIX CIBLES',640,42,32,'#ffdb8d');text(c,'Frappe dès que le disque est face à toi',640,78,22,'#c5d7e1');
 for(let side=0;side<2;side++){
  const post=side?1180:100,face=side?970:310;
  const gr=c.createLinearGradient(post-14,0,post+14,0);gr.addColorStop(0,'#526878');gr.addColorStop(.5,'#bfccd1');gr.addColorStop(1,'#43566b');c.fillStyle=gr;A.rr(c,post-14,150,28,570,9);c.fill();
  c.fillStyle='#0b1624';A.ell(c,post,718,65,15);c.fill();
  text(c,side?'DROITE · X':'GAUCHE · Z',face,125,24,'#ffe2a0');
  for(let row=0;row<3;row++){
   const id=side*3+row,y=rows[row],active=w.target===id;
   let openness=0;
   if(active){if(w.phase==='opening')openness=clamp(w.timer/.18,0,1);else if(w.phase==='open')openness=1;else if(['hit','miss'].includes(w.phase))openness=Math.max(0,1-w.timer/.3);}
   c.strokeStyle='#8d9da5';c.lineWidth=12;c.beginPath();c.moveTo(post,y);c.lineTo(face,y);c.stroke();ball(c,post,y,15,'#4d6677');
   const radius=62,rx=9+openness*53;
   c.save();c.translate(face,y);if(active&&w.phase==='hit')c.translate(Math.sin(w.timer*70)*9*(1-w.timer/.4),0);
   c.fillStyle='#1e2530';c.beginPath();c.ellipse(4,4,rx+3,66,0,0,Math.PI*2);c.fill();
   if(openness>.1){for(let ring=0;ring<5;ring++){c.fillStyle=ring%2?'#fff5e7':'#e34c4f';c.beginPath();c.ellipse(0,0,rx*(1-ring*.19),radius*(1-ring*.19),0,0,Math.PI*2);c.fill();}}
   else{c.fillStyle='#667888';A.rr(c,-9,-62,18,124,6);c.fill();}
   if(active&&w.phase==='open'){c.strokeStyle='#ffd36f';c.lineWidth=4;c.beginPath();c.arc(0,0,70,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-w.timer/w.limit));c.stroke();}
   if(active&&w.phase==='hit')text(c,'✓',0,14,44,'#a4ffba');
   c.restore();
   text(c,(row===0?'↑ + ':row===2?'↓ + ':'')+(side?'X':'Z'),face,y+86,21,'#d7e4ec');
  }
 }
 // Caméra rapprochée : même taille à l’écran pour chacun des six enfants.
 const strike=w.strike,age=strike?w.clock-strike.at:9,amount=age<.25?Math.sin(age/.25*Math.PI):0;
 const k=.7+.14*clamp((s.ch.size-.6)/.4,0,1),zoom=1.55/k;
 const targetGlove=amount>0?{side:strike.hand==='A'?'L':'R',x:((strike.hand==='A'?310:970)-640)/1.55,y:(rows[Math.max(0,strike.row)]-735)/1.55,amount}:null;
 c.save();c.translate(640,735);c.scale(zoom,zoom);c.translate(-640,-742);A.player(c,s.ch,s.combat?{...G.combatPose(s),time:T,targetGlove}:{st:'idle',time:T,t:0,targetGlove});c.restore();
 text(c,w.lastReaction==null?'Prêt ? Observe les six cibles.':'Dernier : '+Math.round(w.lastReaction*1000)+' ms · Record : '+Math.round(w.bestReaction*1000)+' ms',640,702,16,'#ffdda0');
}

// Dessins propres aux ateliers, avec matériel et signaux lisibles à distance.
function text(c,t,x,y,size=25,col='#fff5d6'){c.fillStyle=col;c.font='900 '+size+'px Nunito';c.textAlign='center';c.fillText(t,x,y);}
function panel(c,x,y,w,h,col){if(!col){G.uiPanel(c,x,y,w,h,15);return;}c.fillStyle=col;A.rr(c,x,y,w,h,15);c.fill();}
function meter(c,x,y,v,label){panel(c,x,y,320,66);c.fillStyle='#324750';A.rr(c,x+15,y+30,290,18,7);c.fill();c.fillStyle='#7bdf9b';A.rr(c,x+15,y+30,Math.max(1,290*clamp(v,0,1)),18,7);c.fill();text(c,label,x+160,y+22,18);}
function tire(c,x,y,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#1c2327';c.strokeStyle='#090e12';c.lineWidth=9;c.beginPath();c.ellipse(0,0,103,118,0,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#44525a';c.lineWidth=6;for(let i=0;i<16;i++){const t=i*Math.PI/8;c.beginPath();c.moveTo(Math.cos(t)*78,Math.sin(t)*94);c.lineTo(Math.cos(t+.16)*98,Math.sin(t+.16)*112);c.stroke();}c.fillStyle='#677b7e';c.beginPath();c.ellipse(0,0,47,61,0,0,Math.PI*2);c.fill();c.restore();}
function person(c,s,x=740,y=650,scale=.5){A.playerFront(c,s.ch,x,y,scale,s.t,{celebrate:s.work.flash>0});}
function runner(c,s,x,y,T,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.translate(-640,-600);BX.run.drawRunner(c,s.ch,640,T,'run');c.restore();}
function coach(c,s,x=1000){return A.cornerCoach(c,s.coach||BX.charById('richard'),x,650,.55,s.t,-1,false,0);}
function ball(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.arc(x-r*.3,y-r*.3,r*.24,0,Math.PI*2);c.fill();}
function laneScene(c,s,stairs){const w=s.work;panel(c,420,235,780,450,stairs?'#3b525c':'#a15e4a');for(let lane=0;lane<3;lane++){c.strokeStyle='#f4dfb1';c.lineWidth=3;c.beginPath();c.moveTo(500+lane*240,260);c.lineTo(500+lane*240,680);c.stroke();}for(let i=0;i<9;i++){const y=260+(i*52+(w.motion||0)*95)%430;c.strokeStyle=stairs?'#9cafb1':'#cf987b';c.lineWidth=stairs?12:2;c.beginPath();c.moveTo(425,y);c.lineTo(1195,y);c.stroke();}for(const it of w.items){const x=500+it.lane*240,y=270+it.u*325;text(c,it.type==='bottle'?'🧴':it.type==='towel'?'▰':'🏃',x,y,40);}runner(c,s,500+w.lane*240,635,(w.motion||0)*1.7,.8);text(c,stairs?'MONTE LES GRADINS':'PISTE DU GYM',810,209,27);}
function drawChicken(c,b,T){
 const home=X.chickenHomes[b.home||0],step=Math.sin(T*17+(b.seed||0)),bob=Math.abs(step)*1.5;
 c.save();c.translate(b.x,b.y);c.scale(b.size||1.2,b.size||1.2);c.fillStyle='rgba(28,45,18,.25)';A.ell(c,0,7,16,5);c.fill();
 if(b.golden){c.save();c.shadowColor='#ffdf52';c.shadowBlur=16;c.strokeStyle='#ffdf52';c.lineWidth=2;c.beginPath();c.ellipse(0,-18,29,27,0,0,Math.PI*2);c.stroke();c.restore();text(c,'★ ×3',0,-49,13,'#76500a');}
 c.scale(b.vx<0?-1:1,1);c.translate(0,-bob);
 c.strokeStyle='#bd7429';c.lineWidth=2.2;c.lineCap='round';
 for(const side of [-1,1]){const x=side*5,swing=side*step*3;c.beginPath();c.moveTo(x,-2);c.lineTo(x+swing,7);c.lineTo(x+swing+5,8);c.moveTo(x+swing,7);c.lineTo(x+swing-3,9);c.stroke();}
 // Tail feathers, rounded body and a layered wing.
 c.fillStyle=b.golden?'#d7a327':'#d7b98a';c.strokeStyle='#a88b60';c.lineWidth=1.1;
 for(let i=0;i<3;i++){c.beginPath();c.ellipse(-14-i*2,-15-i*3,4,10,-.6-i*.2,0,Math.PI*2);c.fill();c.stroke();}
 c.fillStyle=b.golden?'#ffdb55':home.body;A.ell(c,-1,-12,16,12);c.fill();c.stroke();
 c.fillStyle=b.golden?'#edb12b':home.wing;c.beginPath();c.ellipse(-3,-11,10,6,-.25,0,Math.PI*2);c.fill();
 c.strokeStyle='#c3a378';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-9+i*4,-11);c.quadraticCurveTo(-7+i*4,-5,-3+i*4,-8);c.stroke();}
 c.fillStyle=b.golden?'#fff09b':home.body;c.beginPath();c.ellipse(11,-22,7,11,.2,0,Math.PI*2);c.fill();
 c.fillStyle='#c84032';for(let i=0;i<3;i++){c.beginPath();c.ellipse(7+i*4,-33-(i===1?2:0),3,4,0,0,Math.PI*2);c.fill();}
 c.beginPath();c.ellipse(15,-18,2.5,4,.3,0,Math.PI*2);c.fill();
 c.fillStyle='#e7a32a';c.beginPath();c.moveTo(17,-25);c.lineTo(25,-22);c.lineTo(17,-20);c.closePath();c.fill();
 c.fillStyle='#25221d';c.beginPath();c.arc(13,-27,2,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(13.6,-27.6,.65,0,Math.PI*2);c.fill();c.restore();
}
X.sushiTarget=(s,plate)=>plate.target??s.work.targets.some(food=>food.id===plate.kind);
X.sushiMotorPhases=[
 {label:'',duration:[3,5],from:1,to:1},
 {label:'PANNE !',duration:[.5,1.1],from:0,to:0},
 {label:'REDÉMARRAGE…',duration:[1.1,1.8],from:.12,to:1},
 {label:'PLEINE PUISSANCE !',duration:[1.5,2.8],from:1.25,to:1.25},
 {label:'PANNE · 2 SECONDES',duration:[2,2],from:0,to:0},
 {label:'ÇA REPART…',duration:[1.1,1.7],from:.1,to:1.25},
 {label:'LE MOTEUR TOUSSE…',duration:[.6,1],from:.35,to:.35},
 {label:'PLEINE PUISSANCE !',duration:[1.6,2.6],from:1.25,to:1.25}
];
X.sushiCurrentSpeed=s=>X.sushiSpeed(s)*(s.work.motorFactor??1);
function updateSushiMotor(s){
 const w=s.work;if(G.tier(s.difficulty)!==3){w.motorFactor=1;return;}
 if(w.clock-w.motorAt>=w.motorDuration){w.motorStep=(w.motorStep+1)%X.sushiMotorPhases.length;w.motorAt=w.clock;w.motorDuration=rand(...X.sushiMotorPhases[w.motorStep].duration);}
 const phase=X.sushiMotorPhases[w.motorStep],u=clamp((w.clock-w.motorAt)/w.motorDuration,0,1);
 w.motorFactor=A.lerp(phase.from,phase.to,u);w.motorLabel=phase.label;
}
function addSushiTarget(s){
 const w=s.work,food=pick(X.sushiFoods.filter(f=>!w.targets.some(t=>t.id===f.id)));
 w.targets.push(food);w.nextTargetAt+=15;w.targetNoticeAt=w.clock;w.newTarget=food;w.dishes=[];
 // Already passing plates keep their contract; announce before new targets arrive.
 for(const plate of w.items)if(plate.target==null)plate.target=w.targets.slice(0,-1).some(f=>f.id===plate.kind);
 AU.play('chime');
}
function spawnSushi(s){
 const w=s.work;
 // Chaque lot contient cinq cibles et cinq autres plats : jamais de famine de cibles.
 if(!w.dishes.length){
  const others=X.sushiFoods.filter(v=>!w.targets.some(t=>t.id===v.id));
  w.dishes=Array.from({length:5},(_,i)=>w.targets[(Math.floor(w.spawned/10)+i)%w.targets.length].id).concat(Array.from({length:5},(_,i)=>others[(Math.floor(w.spawned/2)+i)%others.length].id));
  for(let i=w.dishes.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[w.dishes[i],w.dishes[j]]=[w.dishes[j],w.dishes[i]];}
 }
 const plate={x:1300,kind:w.dishes.pop(),done:false,hit:false};plate.target=w.targets.some(f=>f.id===plate.kind);w.spawned++;w.items.push(plate);return plate;
}
X.spawnSushi=spawnSushi;
function sushiMistake(s,message){const w=s.work;bad(s,message);w.lives=Math.max(0,w.lives-1);w.shockAt=w.clock;if(!w.lives){w.failed=true;G.finish();}}
function sushiInput(s,k,e){
 const w=s.work;if(w.failed||!['A','B'].includes(k)||e.repeat||(!s.combat&&w.clock-w.lastStrike<.24))return;
 w.lastStrike=w.clock;w.strikeHand=k;
 const plate=w.items.filter(p=>!p.done&&Math.abs(p.x-640)<=X.sushiWindow(s)).sort((a,b)=>Math.abs(a.x-640)-Math.abs(b.x-640))[0];
 if(!plate){sushiMistake(s,'Attends un aliment demandé dans le cadre !');AU.play('whoosh');return;}
 plate.done=true;plate.at=w.clock;plate.hit=true;
 if(!X.sushiTarget(s,plate)){w.wrong++;sushiMistake(s,'Laisse passer les autres plats !');AU.play('miss');w.shockAt=w.clock;}
 else{good(s,Math.abs(plate.x-640)<20?6:3);w.served++;AU.play('punch');w.h.puff(640,460,'#ffe49a',10);}
}
function updateSushi(s,dt){
 const w=s.work;if(w.failed)return;
 if(w.clock>=w.nextTargetAt&&w.targets.length<4)addSushiTarget(s);updateSushiMotor(s);
 const speed=X.sushiCurrentSpeed(s);w.belt+=speed*dt;w.next-=dt*(speed/X.sushiSpeed(s));
 if(w.next<=0&&speed>0){spawnSushi(s);const [min,max]=X.sushiInterval(s);w.next=rand(min,max);}
 for(const plate of w.items){plate.x-=speed*dt;if(!plate.done&&plate.x<640-X.sushiWindow(s)){plate.done=true;plate.at=w.clock;if(X.sushiTarget(s,plate)){sushiMistake(s,'Aliment demandé manqué !');w.missed++;if(w.failed)break;}}}
 w.items=w.items.filter(p=>p.x>-70);
}
function drawSushi(c,s,T){
 const w=s.work;c.fillStyle='#e9d4b1';c.fillRect(0,0,1280,720);
 for(let x=0;x<1280;x+=160){c.fillStyle='#5d3630';c.fillRect(x,0,12,410);c.strokeStyle='#c1a27e';c.lineWidth=2;for(let y=120;y<400;y+=65){c.beginPath();c.moveTo(x+12,y);c.lineTo(x+160,y);c.stroke();}}
 c.fillStyle='#46333b';c.fillRect(0,340,1280,100);c.fillStyle='#b55e43';c.fillRect(0,354,1280,17);
 for(const x of [300,640,980]){c.strokeStyle='#4a302b';c.lineWidth=3;c.beginPath();c.moveTo(x,0);c.lineTo(x,125);c.stroke();c.fillStyle='#d95745';A.rr(c,x-34,115,68,90,24);c.fill();c.strokeStyle='#f0aa73';c.lineWidth=2;for(let y=132;y<195;y+=14){c.beginPath();c.moveTo(x-30,y);c.lineTo(x+30,y);c.stroke();}text(c,'寿',x,171,30,'#fff0c6');}
 c.fillStyle='#f3e8c8';c.fillRect(475,180,330,50);text(c,'SUSHI EXPRESS',640,216,27,'#713d32');
 text(c,'ALIMENTS À FRAPPER',640,264,21,'#53372e');
 const spacing=250,start=640-(w.targets.length-1)*spacing/2;
 w.targets.forEach((food,i)=>text(c,food.icon+' '+food.name,start+i*spacing,302,23,'#53372e'));
 if(w.clock-w.targetNoticeAt<3.5)text(c,'NOUVEAU : '+w.newTarget.icon+' '+w.newTarget.name+' AUSSI !',640,343,24,'#963e29');
 else text(c,w.targets.length<4?'Nouvel aliment dans '+Math.ceil(w.nextTargetAt-w.clock)+' s':'Frappe les quatre aliments !',640,343,20,'#6c4833');
 if(w.motorLabel)text(c,w.motorLabel,1050,395,17,w.motorFactor===0?'#ffc293':'#fff0a3');
 text(c,'Z / X dans le cadre · laisse passer le reste',640,390,21,'#fff1cf');
 const wood=c.createLinearGradient(0,410,0,720);wood.addColorStop(0,'#c6955e');wood.addColorStop(1,'#794b32');c.fillStyle=wood;c.fillRect(0,410,1280,310);
 c.fillStyle='#3a4344';A.rr(c,16,418,1248,125,35);c.fill();c.fillStyle='#202e30';A.rr(c,22,424,1236,93,30);c.fill();
 c.save();c.beginPath();A.rr(c,22,424,1236,93,30);c.clip();c.strokeStyle='#4f6060';c.lineWidth=2;for(let i=-1;i<40;i++){const x=22+i*35-w.belt%35;c.beginPath();c.moveTo(x,424);c.lineTo(x-20,517);c.stroke();}c.restore();
 // Un repère fixe : frapper uniquement le plat dans la zone centrale.
 c.strokeStyle='#ffdb7c';c.lineWidth=3;c.setLineDash([7,6]);c.strokeRect(640-X.sushiWindow(s),421,X.sushiWindow(s)*2,99);c.setLineDash([]);
 for(const p of w.items){const age=w.clock-(p.at??-10),flying=p.hit&&X.sushiTarget(s,p),x=p.x,y=467-(flying?Math.sin(Math.min(age/.5,1)*Math.PI)*100:0);if(flying&&age>.5)continue;
 const veg=X.sushiFoods.find(v=>v.id===p.kind);if(!veg)continue;
 c.save();if(flying)c.globalAlpha=Math.max(0,1-age/.5);c.fillStyle='#fcf3df';A.ell(c,x,y+8,48,17);c.fill();c.strokeStyle='#ce8b72';c.lineWidth=3;c.stroke();
 text(c,veg.icon,x,y+3,45);text(c,veg.name,x,y+40,14,'#fff1cf');
 if(flying)for(let i=0;i<7;i++)A.sparkle(c,x+Math.sin(i*3)*age*100,y+Math.cos(i*3)*age*70,4,'#fff0a3');c.restore();
 }
 const age=w.clock-w.lastStrike,hit=age<.25,shock=w.clock-w.shockAt;
 c.save();A.player(c,s.ch,s.combat?{...G.combatPose(s),time:T}:{st:shock<.3?'hit':hit?'punch':'idle',side:w.strikeHand==='B'?'R':'L',high:true,t:shock<.3?shock/.3:age/.25,time:T,hitSide:0});c.restore();

 if(!s.combat)G.drawTrainingVitals(c,{hp:w.lives,maxHp:w.maxLives},{health:true,stamina:false});
 if(w.failed)text(c,'ON RÉESSAIE ?',830,610,30,'#ffe4b4');
}

function drawChickenFarm(c,s,T){
 const w=s.work,sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,'#b9e2ef');sky.addColorStop(.55,'#eff0cd');sky.addColorStop(1,'#86b36c');c.fillStyle=sky;c.fillRect(0,0,1280,720);
 c.fillStyle='#fff1b0';A.ell(c,1120,100,48,48);c.fill();
 for(let i=0;i<6;i++){c.fillStyle=i%2?'#87af76':'#a4c78a';A.ell(c,i*290,300,260,100);c.fill();}
 c.fillStyle='#7fa35b';c.fillRect(0,330,1280,390);c.fillStyle='#bca675';c.beginPath();c.moveTo(740,330);c.lineTo(900,330);c.lineTo(1200,720);c.lineTo(450,720);c.closePath();c.fill();
 c.strokeStyle='#dec69b';c.lineWidth=7;for(const y of [281,309]){c.beginPath();c.moveTo(0,y);c.lineTo(1280,y);c.stroke();}for(let x=10;x<1280;x+=55){c.beginPath();c.moveTo(x,270);c.lineTo(x,340);c.stroke();}
 for(const [i,home] of X.chickenHomes.entries()){
  c.save();c.translate(home.x,home.y);c.scale(home.scale,home.scale);c.translate(-home.x,-315);const x=home.x;c.fillStyle='#795336';c.fillRect(x-74,205,148,110);c.fillStyle=home.wall;c.fillRect(x-68,212,136,96);
  c.strokeStyle='#e1b983';c.lineWidth=2;for(let dx=-60;dx<65;dx+=18){c.beginPath();c.moveTo(x+dx,212);c.lineTo(x+dx,305);c.stroke();}
  c.fillStyle='#583b30';c.beginPath();c.moveTo(x-90,211);c.lineTo(x,155);c.lineTo(x+90,211);c.closePath();c.fill();c.strokeStyle='#c08563';c.lineWidth=6;c.stroke();
  c.fillStyle='#302b24';A.rr(c,x-29,258,58,64,10);c.fill();c.fillStyle='#e1be82';c.fillRect(x-61,225,122,22);text(c,home.name,x,241,13,'#65462c');
  c.fillStyle='#ad804d';c.beginPath();c.moveTo(x-29,310);c.lineTo(x+29,310);c.lineTo(x+44,362);c.lineTo(x-44,362);c.closePath();c.fill();c.strokeStyle='#deb273';c.lineWidth=4;for(let j=0;j<4;j++){c.beginPath();c.moveTo(x-30-j*3,318+j*11);c.lineTo(x+30+j*3,318+j*11);c.stroke();}c.restore();
 }
 for(let i=0;i<80;i++){const x=25+((Math.sin(i*127.1)*43758.5453)%1+1)%1*1230,y=370+((Math.sin(i*311.7)*19642.349)%1+1)%1*315;c.strokeStyle=i%3?'#769851':'#e3ce91';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y-5);c.moveTo(x,y);c.lineTo(x+4,y-7);c.stroke();}
 w.birds.filter(b=>!b.caught).sort((a,b)=>a.y-b.y).forEach(b=>drawChicken(c,b,T));
 for(const fx of w.captureFx){
  const age=w.clock-fx.at,k=age/.8;c.save();c.globalAlpha=1-k;c.strokeStyle='#fff1a2';c.lineWidth=5*(1-k);c.beginPath();c.arc(fx.x,fx.y,22+k*65,0,Math.PI*2);c.stroke();
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=fx.x+Math.cos(a)*k*95,y=fx.y+Math.sin(a)*k*65-k*40;c.save();c.translate(x,y);c.rotate(a+k*5);c.fillStyle=i%2?'#fff9e4':'#ffd45d';A.ell(c,0,0,4,12);c.fill();c.restore();}
  text(c,fx.golden?'+18 pts · OR ×3':'+1',fx.x,fx.y-35-k*45,fx.golden?24:28,'#fff3a4');c.restore();
 }

}

X.draw=(c,s,T)=>{
 const w=s.work,id=s.mode,d=X.defs[id];c.save();
 if(['bench','pneu','masse','repas'].includes(id)){c.translate(640,690);c.scale(1.15,1.15);c.translate(-835,-690);}
 // Les ateliers dessinent leur matériel sans panneaux de score latéraux.
 if(id==='cibles')drawTargets(c,s,T);
 else if(id==='course')drawCourse(c,s,T);
 else if(id==='escaliers')drawAvalanche(c,s,T);
 else if(id==='parade'){
  G.drawDefenseMitts(c,T,w);
  panel(c,950,180,290,150);text(c,(w.cue.high?'↑ HAUT':'↓ CORPS'),1095,222,27,'#ffe1a0');text(c,w.cue.hand==='A'?'Z · GAUCHE':'X · DROITE',1095,263,24);
  text(c,w.phase==='windup'?'Lis le geste du coach':w.blocked?'BLOQUÉ !':'GARDE !',1095,306,18,w.blocked?'#a4e6c2':'#ffcf9b');
 }
 else if(id==='bench'){drawBench(c,s,T);}
 else if(id==='traineau'){
  drawSled(c,s,T);
 }else if(id==='tennis'){
  drawTennis(c,s,T);
 }else if(id==='pneu'){
  drawTireChallenge(c,s,T);
 }else if(id==='masse'){
  drawHammerChallenge(c,s,T);
 }else if(id==='paos'){
  const cue=w.cue,pad=G.drawFocusMitts(c,T,cue,w.phase==='cue');
  panel(c,960,200,270,130);text(c,(cue.high?'↑ + ':'')+(cue.hand==='A'?'Z':'X'),1095,250,38,'#ffe082');text(c,cue.high?'DIRECT EN HAUT':'COUP AU CORPS',1095,293,19);meter(c,840,120,1-w.timer/w.limit,'Reproduis la combinaison');

 }else if(id==='mannequin'){
  drawSushi(c,s,T);
 }else if(id==='oeufs'){
  drawEggs(c,s,T);
 }else if(id==='poulet'){
  drawChickenFarm(c,s,T);
  // Un petit « POUF » de filet à chaque clic, avec des plumes sur une capture.
  for(const f of w.clickFx){
   const u=clamp((w.clock-f.at)/.55,0,1),color=f.golden?'#ffd43b':f.hit?'#9affbe':'#fff2ba';
   c.save();c.translate(f.x,f.y);c.globalAlpha=1-u;c.lineWidth=4*(1-u)+1;
   c.strokeStyle='#24455b';c.beginPath();c.arc(0,0,12+u*54,0,Math.PI*2);c.stroke();
   c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(0,0,8+u*54,0,Math.PI*2);c.stroke();
   for(let i=0;i<(f.hit?10:6);i++){
    const a=i*Math.PI*2/(f.hit?10:6),r=18+u*(f.hit?82:48);
    c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r+u*u*24);c.rotate(a+u*3);
    c.fillStyle=i%2?color:'#fff';c.beginPath();c.ellipse(0,0,f.hit?4:3,f.hit?11:5,0,0,Math.PI*2);c.fill();c.restore();
   }
   text(c,f.hit?'HOP !':'POUF !',0,-24-u*28,22,color);c.restore();
  }
 }else if(id==='repas'){
  person(c,s,790,650,.6);panel(c,480,480,670,125,'#94714f');panel(c,485,468,660,18,'#d5b784');c.fillStyle='#eee5cb';A.ell(c,800,470,110,22);c.fill();const food=w.food;const emoji=food.bad?(food.hazard==='gâté'?'🦠':'🌶️'):food.type==='pain'?'🥖':food.type==='pomme'?'🍎':'🥪';text(c,emoji,800,450,85);text(c,food.bad?'PIMENT / ALIMENT SUSPECT → ÉCARTE !':'Z : BON APPÉTIT !',800,195,25,food.bad?'#ffad88':'#a4e6a8');if(w.phase==='burn')text(c,'ÇA PIQUE !',800,270,40,'#ff996c');text(c,'Bonus santé prochain combat : +'+Math.min(20,Math.floor(w.caught/3))+' %',810,650,22,'#ffe082');
 }
 if(w.flash!==0&&!['escaliers','oeufs','pneu','poulet','mannequin','cibles'].includes(id)){c.globalAlpha=Math.abs(w.flash)*.5;c.fillStyle=w.flash>0?'#92e0b2':'#ff8e72';c.fillRect(410,100,840,580);c.globalAlpha=1;}
 if(s.phase==='go'&&id==='tennis')text(c,d.controls,640,130,18,'#e1ddcd');else if(s.phase==='go'&&!['traineau','pneu','escaliers','oeufs','mannequin','cibles'].includes(id))text(c,d.controls,id==='poulet'?640:815,702,18,'#e1ddcd');c.restore();
};
})(window);
