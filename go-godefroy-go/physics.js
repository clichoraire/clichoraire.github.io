/* Shared deterministic simulation, independent of canvas and browser. */
(function(root){
'use strict';
const Course=typeof module!=='undefined'?require('./course.js'):root.GGCourse;
const Launch=typeof module!=='undefined'?require('./launch-gear.js'):root.GGLaunch;
const Monsters=typeof module!=='undefined'?require('./monsters.js'):root.GGMonsters;
const Specials=typeof module!=='undefined'?require('./specials.js'):root.GGSpecials;
const Wings=typeof module!=='undefined'?require('./wing-gear.js'):root.GGWings;
const categories=[
 {id:'launch',title:'Artillerie de lancement',icon:'↗',items:Launch.items.map(g=>g.name),desc:'Plus d’élan. Beaucoup moins de retenue.',base:160},
 {id:'wing',title:'Portance médiévale',icon:'⌁',items:Wings.items.map(w=>w.name),desc:'La cape fait partie de votre armure. Ajoutez un équipement pour mieux planer.',base:140},
 {id:'boost',title:'Alchimie & poudre',icon:'✷',items:['Cruche de feu grégeois','Poudre explosive naine','Essence de Tempête','Essence de Tempête raffinée'],desc:'Plus de poussée et une réserve plus généreuse.',base:180},
 {id:'armor',title:'Finition d’armure',icon:'◇',items:['Acier brut','Polissage au suif','Heaume caréné','Profil d’hippogriffe'],desc:'Moins de traînée. Toujours 85 kg d’honneur.',base:120},
 {id:'impact',title:'Inertie du serment',icon:'✦',items:['Pectoral cabossé','Pectoral renforcé','Semelles à ricochets','Météore blindé'],desc:'Traversez les défenses et rebondissez plus loin.',base:130}
];
const goals=[{name:'Le pont-levis du Baron',desc:'2 000 mètres. Un rempart en bois. Une très mauvaise idée.',x:2000,y:0,bonus:350},{name:'Le campement des Siégeurs',desc:'Dépassez les lignes orques à 12 000 mètres.',x:12000,y:0,bonus:900},{name:'La mer de nuages',desc:'Atteignez 1 500 mètres d’altitude et saluez la flotte flottante.',x:0,y:1500,bonus:1800},{name:'Le nid du Dragon',desc:'30 000 mètres au loin, 4 000 mètres dans le ciel. Frappez fort.',x:30000,y:4000,bonus:5000}];
goals.push({name:'Les marches du royaume',desc:'Franchissez le relais des 45 km.',x:45000,y:0,bonus:2400},{name:'Les forteresses célestes',desc:'60 km de distance et 5 000 m d’altitude.',x:60000,y:5000,bonus:4000},{name:'La couronne des tempêtes',desc:'80 km et 6 000 m : le dernier rempart.',x:80000,y:6000,bonus:6000},{name:'Le dragon ancestral',desc:'100 km de traversée, 8 000 m d’altitude. Le choc final.',x:100000,y:8000,bonus:12000});
const MAX_LEVEL=8;
const maxLevel=id=>id==='launch'?24:id==='wing'?40:MAX_LEVEL;
function itemName(c,l){if(c.id==='launch')return Launch.get(l).name;if(c.id==='wing')return Wings.get(l).name;return c.items[Math.min(3,l)]+(l>3?' · Maîtrise '+(l-3):'');}
const BASE_WING_LEVEL=7; // Previous Élytre de Mithril · Maîtrise 4 is the new cape baseline.
function parameters(l){const wingLevel=BASE_WING_LEVEL+l.wing*.2,armorLevel=Math.max(l.armor,l.friction||0);return {wingLevel,liftCap:7.8+l.wing*.12,maxSpeed:Launch.get(l.launch).speed*2.2/3.6,aeroSpeed:Launch.get(l.launch).speed*1.4/3.6,launchSpeed:Course.takeoffSpeed([65,145,205,280][Math.min(3,l.launch)]+Math.max(0,l.launch-3)*80,l.launch),gravityMultiplier:1-.05*(l.lightness||0),fuel:(2.5+l.boost*8)*(1+.05*(l.fuelCapacity||0)),thrust:([9,14,21,30][Math.min(3,l.boost)]+Math.max(0,l.boost-3)*5)*(1+.05*(l.boostPower||0)),turnRate:(.8+wingLevel*.17)*.6,wingLift:(wingLevel+1)*1.1,drag:frictionDrag(armorLevel),impactMultiplier:1+Math.max(l.impact,l.wallForce||0)*.5,ricochets:2+Math.max(l.impact>=2?l.impact:0,l.ricochet||0)};}
function stats(id,level){const l={launch:0,wing:0,boost:0,armor:0,impact:0,[id]:level},p=parameters(l);return {launch:[{label:'Vitesse de départ',value:p.launchSpeed*3.6,unit:'km/h'},{label:'Vitesse maximale',value:p.maxSpeed*3.6,unit:'km/h'},{label:'Longueur de glissade',value:(Course.rampGeometry(level).end-Course.rampGeometry(level).start)/Course.X_SCALE,unit:'m'},{label:'Hauteur de la rampe',value:(485-Course.rampGeometry(level).top)/Course.SCALE,unit:'m'}],wing:[{label:'Portance de base',value:p.wingLift,unit:'m/s²'},{label:'Maniabilité',value:p.turnRate*180/Math.PI*Course.TIME_SCALE,unit:'°/s'},{label:'Décrochage récupérable',value:'Oui',unit:''}],boost:[{label:'Poussée',value:p.thrust,unit:'m/s²'},{label:'Réserve de poussée',value:p.fuel/Course.TIME_SCALE,unit:'s réelles'}],armor:[{label:'Traînée (moins = mieux)',value:p.drag,unit:'s⁻¹'}],impact:[{label:'Force contre les murs',value:p.impactMultiplier,unit:'×'},{label:'Ricochets maximum',value:p.ricochets,unit:''},{label:'Coup de bélier · touche X',value:level>=1?'Débloqué':'Verrouillé',unit:''}]}[id];}
function wallStrength(index){return 85+(index-1)*70;}
function impactPower(f){return Math.hypot(f.vx,f.vy)*parameters(f.l).impactMultiplier*(f.ramTime>0?1.8:1);}
function frictionDrag(n){return n<=3?.023-n*.005:.008*Math.pow(.68,n-3);}
const statUpgrades=[
 {id:'specialItems',title:'Les coups de pouce du ciel',icon:'★',base:180,unit:'% de puissance bonus',value:n=>n*5.5},
 {id:'rampLength',title:'Longueur de la glissade',icon:'↔',base:100,unit:'m',value:n=>n*80/Course.X_SCALE},
 {id:'rampHeight',title:'Hauteur de la rampe',icon:'↟',base:110,unit:'m',value:n=>n*55/Course.SCALE},
 {id:'friction',title:'Friction',icon:'◒',base:120,unit:'% de traînée',value:n=>Math.round(100*frictionDrag(n)/.023)},
 {id:'wallForce',title:'Force contre les murs',icon:'✦',base:130,unit:'×',value:n=>1+n*.5},
 {id:'ricochet',title:'Ricochets maximum',icon:'⌁',base:150,unit:'rebonds au sol',value:n=>n+2},
 {id:'rebound',title:'Mieux rebondir',icon:'↗',base:140,unit:'% de vitesse conservée au sol',value:n=>Math.round((.56+n*.04)*100)},
 {id:'goldBonus',title:'Or gagné',icon:'●',base:160,unit:'% d’or par vol',value:n=>n*5},
 {id:'boostPower',title:'Puissance du booster',icon:'♨',base:150,unit:'% de poussée',value:n=>n*5},
 {id:'lightness',title:'Armure plus légère',icon:'♧',base:170,unit:'% de gravité en moins',value:n=>n*5},
 {id:'fuelCapacity',title:'Réserve de carburant',icon:'▣',base:140,unit:'% de carburant en plus',value:n=>n*5}
];
function statLevel(s,id){return Math.max(0,Math.min(10,Math.floor(Number(s.levels?.[id])||0)));}
function statPrice(s,id){const c=statUpgrades.find(c=>c.id===id);return c?Math.round(c.base*Math.pow(1.65,statLevel(s,id))):Infinity;}
function buyStat(s,id){if(!statUpgrades.some(c=>c.id===id)||statLevel(s,id)>=10)return false;const cost=statPrice(s,id);if(s.gold<cost)return false;s.gold-=cost;s.levels[id]=statLevel(s,id)+1;return true;}
const missions=[];
for(let tier=1;tier<=24;tier++){
 const add=(label,target,measure,sum=false)=>missions.push({label,target,measure,sum,gold:100+tier*75});
 add('Parcourir '+tier*200+' m en un vol',tier*200,f=>Math.floor(f.x));
 add('Faire '+tier*2+' rebonds',tier*2,f=>f.bounces+(f.monsterBounces||0),true);
 add('Atteindre '+(100+tier*15)+' km/h',100+tier*15,f=>Math.floor(f.maxSpeed*3.6));
 add('Récolter '+tier*25+' écus en vol',tier*25,f=>f.collectedGold||0,true);
 add('Activer le booster '+tier*3+' fois',tier*3,f=>f.boostUses||0,true);
 add('Monter à '+(250+tier*100)+' m',250+tier*100,f=>Math.floor(f.maxY));
 add('Faire '+tier*2+' vols avec un équipement aérien',tier*2,f=>Number(f.l.wing>0),true);
 add('Déclencher '+tier*2+' canons',tier*2,f=>f.pickupCounts?.[9]||0,true);
 add('Ramasser '+tier*4+' objets bonus',tier*4,f=>Object.values(f.pickupCounts||{}).reduce((a,b)=>a+b,0),true);
 add('Casser '+tier*12+' briques',tier*12,f=>f.wallStones||0,true);
 add('Voler '+(4+tier*2)+' s en un vol',4+tier*2,f=>Math.floor(f.realTime??f.time/Course.TIME_SCALE));
 }
function activeMissions(save){
 const list=[];
 for(let id=0;id<missions.length&&list.length<3;id++){
  const m=missions[id],progress=save.missionProgress?.[id]||0;
  if(progress<m.target)list.push({id,progress});
 }
 return list;
}
function missionStatus(f){
 return (f.missionSlots||[]).map(({id,progress})=>{
  const m=missions[id],value=m.measure(f);
  const current=Math.min(m.target,m.sum?progress+value:Math.max(progress,value));
  return {id,label:m.label,target:m.target,current,done:current>=m.target,gold:m.gold};
 });
}
function wallBonus(stage){return 1000+750*(stage-1);}
const bombs=[
 {id:1,name:'Bombe noire',price:300,count:8,color:'#262837'},
 {id:2,name:'Bombe rouge',price:750,count:18,color:'#c83937'},
 {id:3,name:'Bombe bleue',price:1500,count:36,color:'#2865bb'}
];
function buyBomb(save,id){
 const bomb=bombs.find(b=>b.id===id);
 if(!bomb||save.bomb||save.gold<bomb.price)return false;
 save.gold-=bomb.price;save.bomb=id;return true;
}
function detonateBomb(f){
 const bomb=bombs.find(b=>b.id===f.bomb);
 if(!bomb||f.bombSpent||f.endReason!=='wall'||!f.wallHit)return 0;
 f.bombSpent=true;
 const index=f.wallHit.index,wall=Course.stages[index],damage=f.wallDamage[index],nearby=[];
 const row=Math.floor(f.y/Course.CELL_H);
 for(let r=Math.max(0,row-6);r<=row+6;r++){
  const center=Math.floor((f.x-wall.at-Course.stoneOffset(r))/Course.CELL_W);
  for(let c=Math.max(0,center-7);c<Math.min(center+9,Course.stoneColumns(index,r));c++){
   const key=c+':'+r;if(damage[key])continue;
   const {left,right}=Course.stoneBounds(index,c,r);
   const dx=(wall.at+(left+right)/2-f.x)/Course.CELL_W,dy=r+.5-f.y/Course.CELL_H;
   nearby.push({key,distance:dx*dx+dy*dy});
  }
 }
 nearby.sort((a,b)=>a.distance-b.distance);
 const broken=nearby.slice(0,bomb.count);
 for(const {key} of broken)damage[key]=true;
 f.wallStones+=broken.length;f.damageRevision+=broken.length;f.wallHit.stones=f.wallStones;
 return broken.length;
}
const fresh=()=>({version:2,wingCatalog:2,gold:0,day:1,record:0,altitude:0,levels:{launch:0,wing:0,boost:0,armor:0,impact:0,rampLength:0,rampHeight:0,friction:0,wallForce:0,ricochet:0,rebound:0,goldBonus:0,boostPower:0,lightness:0,fuelCapacity:0,specialItems:0},owned:{launch:0,wing:0,boost:0,armor:0,impact:0},completed:goals.map(()=>false),relays:[],wallPrizes:[],wallTreasureClaimed:[],bomb:0,missionProgress:{},wallDamage:{}});
function sanitize(raw){let s=fresh();if(!raw||typeof raw!=='object')return s;for(const k of ['gold','day','record','altitude'])if(Number.isFinite(raw[k]))s[k]=Math.max(k==='day'?1:0,Math.floor(raw[k]));for(const c of categories)s.levels[c.id]=Math.max(0,Math.min(maxLevel(c.id),Math.floor(Number(raw.levels?.[c.id])||0)));if(raw.version!==2)s.levels.launch=Launch.legacy[Math.min(8,s.levels.launch)];for(const c of categories)s.owned[c.id]=Math.max(s.levels[c.id],Math.min(maxLevel(c.id),Math.floor(Number(raw.owned?.[c.id])||0)));if(raw.wingCatalog!==2){s.levels.wing=Wings.legacy[Math.min(8,s.levels.wing)];s.owned.wing=Wings.legacy[Math.min(8,s.owned.wing)];}for(const c of statUpgrades)s.levels[c.id]=Math.max(0,Math.min(10,Math.floor(Number(raw.levels?.[c.id]??(c.id==='friction'?s.owned.armor:c.id==='wallForce'?s.owned.impact:c.id==='ricochet'&&s.owned.impact>=2?s.owned.impact:0))||0)));s.completed=s.completed.map((_,i)=>raw.completed?.[i]===true);s.relays=Array.isArray(raw.relays)?[...new Set(raw.relays.filter(n=>Number.isInteger(n)&&n>0&&n<=20))]:[];s.wallDamage=cleanDamage(raw.wallDamage);s.bomb=bombs.some(b=>b.id===raw.bomb)?raw.bomb:0;
 if(Array.isArray(raw.wallTreasureClaimed)){const valid=new Set(Course.stages.slice(1).flatMap((_,i)=>Course.wallCaches(i+1).map(a=>a.id)));s.wallTreasureClaimed=[...new Set(raw.wallTreasureClaimed.filter(id=>valid.has(id)))];}
 if(Array.isArray(raw.wallPrizes))s.wallPrizes=[...new Set(raw.wallPrizes.filter(n=>Number.isInteger(n)&&n>0&&n<Course.stages.length))];
 for(const [id,m] of missions.entries()){const value=raw.missionProgress?.[id];if(Number.isFinite(value)&&value>0)s.missionProgress[id]=Math.min(m.target,Math.floor(value));}

 if(raw.collection&&typeof raw.collection==='object'){s.collection={};for(const c of categories)if(Array.isArray(raw.collection[c.id])){s.collection[c.id]=[...new Set([0,s.levels[c.id],...raw.collection[c.id].filter(n=>Number.isInteger(n)&&n>=0&&n<=maxLevel(c.id))])];s.owned[c.id]=Math.max(...s.collection[c.id]);}}
 return s;}
// Sparse destroyed stones. Migrate the earlier broad tunnels without losing progress.
function cleanDamage(raw){
 const out={_format:3};
 for(let i=1;i<Course.stages.length;i++){
  out[i]={};const old={};
  for(const [key,value] of Object.entries(raw?.[i]||{})){
   if(raw?._format===3||raw?._format===2){
    const parts=key.split(':').map(Number),[c,r]=parts;
    if(parts.length!==2||!parts.every(Number.isInteger)||c<0||r<0||r>=4000||value!==true)continue;
    if(raw._format===3){if(c<Course.stoneColumns(i,r))out[i][key]=true;}
    else if(c<Math.ceil(Course.wallWidth(i)/12))old[key]=true;
   }else if(/^\d+$/.test(key)&&Number(key)<1000&&Number.isFinite(value)&&value>0){
    for(let c=0;c<Math.min(Math.ceil(Course.wallWidth(i)/12),Math.floor(value/12));c++)
     for(let r=Math.ceil(Number(key)*140/Course.CELL_H);r<Math.floor((Number(key)+1)*140/Course.CELL_H);r++)old[c+':'+r]=true;
   }
  }
  // Preserve old holes: remove every new stone overlapping an already broken block.
  for(const key of Object.keys(old)){
   const [c,r]=key.split(':').map(Number),offset=Course.stoneOffset(r);
   for(let n=Math.max(0,Math.floor((c*12-offset)/Course.CELL_W));n<Math.min(Course.stoneColumns(i,r),Math.ceil(((c+1)*12-offset)/Course.CELL_W));n++)out[i][n+':'+r]=true;
  }
 }
 return out;
}
function strikeStones(f,previousX,previousY){
 const dx=f.x-previousX,dy=f.y-previousY,samples=Math.max(1,Math.ceil(Math.max(Math.abs(dx)/4,Math.abs(dy)/12)));
 for(let n=1;n<=samples;n++){
  const x=previousX+dx*n/samples,y=previousY+dy*n/samples;
  for(let i=1;i<Course.stages.length;i++){
   const wall=Course.stages[i],width=Course.wallWidth(i);if(f.wallsBroken.has(i)||x+7<wall.at)continue;
   if(x-7>=wall.at+width){f.wallsBroken.add(i);f.broken.add(wall.at);message(f,'REMPART TRAVERSÉ !');continue;}
   const missing=[];
   for(let r=Math.max(0,Math.floor((y-25)/Course.CELL_H));r<=Math.floor((y+25)/Course.CELL_H);r++){
    const offset=Course.stoneOffset(r);
    for(let c=Math.max(0,Math.floor((x-7-wall.at-offset)/Course.CELL_W));c<=Math.min(Course.stoneColumns(i,r)-1,Math.floor((x+7-wall.at-offset)/Course.CELL_W));c++){
     const key=c+':'+r;if(!f.wallDamage[i][key]&&!Course.cacheHole(i,c,r))missing.push(key);
    }
   }
   if(!missing.length)continue;
   const speed=Math.hypot(f.vx,f.vy),power=impactPower(f),cost=2500*(Course.CELL_W/12)*(wallStrength(i)/85)/parameters(f.l).impactMultiplier/(f.ramTime>0?1.8:1),budget=Math.max(0,speed*speed-35*35),count=Math.min(missing.length,Math.floor(budget/cost));
   for(const key of missing.slice(0,count)){f.wallDamage[i][key]=true;f.wallStones++;f.damageRevision++;}
   f.wallHit={index:i,power,required:wallStrength(i),width,depth:Math.max(0,Math.min(width,x-wall.at)),stones:f.wallStones,broken:false};
   const exitSpeed=count<missing.length?0:Math.sqrt(Math.max(0,speed*speed-count*cost));
   f.impactEvents.push({x:x+7,y,speed,exitSpeed,count,stopped:count<missing.length,energy:speed*speed-exitSpeed*exitSpeed});if(f.impactEvents.length>64)f.impactEvents.shift();
   if(count<missing.length){f.x=x;f.y=y;f.impactSpeed=speed;f.vx=0;f.vy=0;f.ended=true;f.endReason='wall';f.gullWallBonus=!!(f.gullRide?.left>0);message(f,'ÉLAN ÉPUISÉ · '+f.wallStones+' PIERRES BRISÉES · SAUVEGARDÉ');return;}
   const ratio=Math.sqrt(Math.max(0,speed*speed-count*cost))/speed;f.vx*=ratio;f.vy*=ratio;
   message(f,'CRAC ! '+f.wallStones+' PIERRES · CONTINUEZ !');
  }
 }
}
function price(c,level){if(c.id==='launch')return Math.round(100*Math.pow(1.27,level));if(c.id==='wing')return Math.round(140*Math.pow(1.16,level));return Math.round(c.base*[1,3.2,8,16,28,46,72,110][level]);}
function owned(s,id){return Math.max(s.levels[id],s.owned?.[id]??s.levels[id]);}
function gearFamilies(id){
 if(id==='wing')return [{start:0,end:0},...Wings.families];
 if(id==='launch'){const groups=[];for(const item of Launch.items){let g=groups.find(g=>g.name===item.group);if(!g){g={name:item.group,start:item.id,end:item.id};groups.push(g);}g.end=item.id;}return groups;}
 return [{start:0,end:maxLevel(id)}];
}
function hasItem(s,id,n){return Array.isArray(s.collection?.[id])?s.collection[id].includes(n):n<=owned(s,id);}
function familyUnlocked(s,id,start){
 if(!['launch','wing'].includes(id))return true;
 const groups=gearFamilies(id),index=groups.findIndex(g=>g.start===start);
 if(index<0)return false;if(index===0||(id==='wing'&&index===1))return true;
 const current=groups[index];
 if(Array.from({length:current.end-current.start+1},(_,i)=>current.start+i).some(n=>hasItem(s,id,n)))return true;
 const prev=groups[index-1];if(hasItem(s,id,prev.end))return true;let bought=0;for(let n=Math.max(1,prev.start);n<=prev.end;n++)if(hasItem(s,id,n))bought++;
 return bought>=2;
}
function itemUnlocked(s,id,n){const group=gearFamilies(id).find(g=>n>=g.start&&n<=g.end);return !!group&&familyUnlocked(s,id,group.start);}
function equip(s,id,level){if(!categories.some(c=>c.id===id)||!Number.isInteger(level)||level<0||level>maxLevel(id)||!hasItem(s,id,level))return false;s.levels[id]=level;return true;}
function buy(s,id,level=owned(s,id)+1){
 const c=categories.find(c=>c.id===id);if(!c||!Number.isInteger(level)||level<1||level>maxLevel(id)||hasItem(s,id,level))return false;
 if(['launch','wing'].includes(id)?!itemUnlocked(s,id,level):level!==owned(s,id)+1)return false;
 const cost=price(c,level-1);if(s.gold<cost)return false;
 s.collection??={};if(!Array.isArray(s.collection[id]))s.collection[id]=Array.from({length:owned(s,id)+1},(_,i)=>i);
 s.collection[id].push(level);s.gold-=cost;s.owned??={...s.levels};s.owned[id]=Math.max(owned(s,id),level);s.levels[id]=level;return true;
}


const thermalCenters=Array.from({length:8},(_,i)=>3000+i*2450);
function create(s,angle=Course.LAUNCH_ANGLE){Course.setUpgrades(s.levels.rampHeight||0,s.levels.rampLength||0);const l={...s.levels},v=parameters(l).launchSpeed,start=Course.launchPose(1,angle,v,l.launch),origin=Course.flightOrigin(start,l.launch),height=(485-origin.y)/Course.SCALE,exitAngle=-start.rotation;return {wallTreasureClaimed:[...(s.wallTreasureClaimed||[])],bomb:s.bomb||0,missionSlots:activeMissions(s),wallPrizes:[...(s.wallPrizes||[])],previousRecord:s.record,combatSeed:s.day*1973,l,launchSpeed:v,originX:origin.x,launchAngle:angle,x:0,y:height,vx:Math.cos(exitAngle)*v,vy:Math.sin(exitAngle)*v+(Launch.get(l.launch).standing?7:0),pitch:-start.rotation,fuel:parameters(l).fuel,maxFuel:parameters(l).fuel,time:0,maxY:height,stage:0,stageEvents:[],endReason:null,ended:false,wingTorn:false,stall:0,stalled:false,recovery:0,bounces:0,hits:0,broken:new Set(),destroyed:new Set(),achieved:s.completed.slice(),newGoals:[],newRelays:[],knownRelays:(s.relays||[]).slice(),maxSpeed:v,message:'',messageTime:0,boosting:false,trail:[],impactSpeed:0,wallsBroken:new Set(),wallDamage:cleanDamage(s.wallDamage),damageRevision:0,wallStones:0,impactEvents:[],ramTime:0,ramCooldown:0,wallHit:null};}
function step(f,dt,input={}){
 if(f.ended)return;
 if(dt>1/120+1e-9){let remaining=Math.min(.05,dt);while(remaining>1e-9&&!f.ended){const h=Math.min(1/120,remaining);step(f,h,input);remaining-=h;}return;}
 dt=Math.max(0,Math.min(.05,dt));
 f.time+=dt;f.ramTime=Math.max(0,f.ramTime-dt);f.ramCooldown=Math.max(0,f.ramCooldown-dt);
 if(input.ram&&Math.max(f.l.impact,f.l.wallForce||0)>=1&&f.ramCooldown===0){f.ramTime=1.5;f.ramCooldown=10;message(f,'COUP DE BÉLIER ! FORCE ×1,8');}
 const params=parameters(f.l),previousVX=f.vx,previousSpeed=Math.hypot(f.vx,f.vy);
f.messageTime=Math.max(0,f.messageTime-dt);
 f.manualGlide=(input.left||input.right)?6:Math.max(0,(f.manualGlide||0)-dt);
 const center=Math.min(1,Math.abs(f.pitch)/.38);
 const pitchResponse=.52+.48*center*center*(3-2*center);
 f.pitch=Math.max(-1.25,Math.min(1.42,f.pitch+((input.left?1:0)-(input.right?1:0))*dt*params.turnRate*pitchResponse));
 const wasBoosting=f.boosting;
 f.boosting=!!input.boost&&f.fuel>0;
 if(f.boosting&&!wasBoosting)f.boostUses=(f.boostUses||0)+1;
 const boost=f.boosting?params.thrust:0;
 if(f.boosting)f.fuel=Math.max(0,f.fuel-dt);
 // Angle of attack is measured against actual travel, not the horizon.
 const airspeed=Math.hypot(f.vx,f.vy),direction=Math.atan2(f.vy,f.vx);
 const attack=f.pitch-.12-direction;
 const stallSpeed=Math.min(24,params.aeroSpeed*.35);
 const balloon=!f.wingTorn&&f.l.wing>=1&&f.l.wing<=5;
 const overloaded=!balloon&&(f.pitch>1.12||(f.pitch>.65&&attack>1)||(f.pitch>.65&&airspeed<stallSpeed));
 if(balloon){f.stalled=false;f.stall=0;f.recovery=0;}
 f.stall=overloaded?f.stall+dt:Math.max(0,f.stall-dt*2);
 if(!f.stalled&&f.stall>.55){f.stalled=true;f.recovery=0;message(f,'DÉCROCHAGE ! Baissez le nez pour reprendre de la vitesse.');}
 if(f.stalled){
  if(!input.left&&!input.right)f.pitch=Math.max(-1.25,f.pitch-dt*.45);
  f.recovery=f.pitch<.55&&airspeed>stallSpeed?f.recovery+dt:0;
  if(f.recovery>.3){f.stalled=false;f.stall=0;f.recovery=0;message(f,'LA CAPE REPREND L’AIR !');}
 }
 // Launch and flight use the same forces, including across the apex.
 const ballisticArc=false;
 const wing=f.wingTorn?0:params.wingLevel+1;
 const noseDown=Math.max(0,Math.min(1,(-f.pitch-.10)/.95));
 const dive=noseDown*noseDown*(3-2*noseDown);
 const diving=wing>0&&!f.stalled&&f.vy<0&&dive>.12;
 f.diveTime=diving?Math.min(2,(f.diveTime||0)+dt):Math.max(0,(f.diveTime||0)-dt*3);
 const diveGain=diving?dive*Math.min(1,-f.vy/8)*(1.5+f.l.wing*.17)*(.35+.65*f.diveTime/2):0;
 const efficiency=f.stalled?0:1;
 const lift=efficiency*(1-dive*.9)*Math.min(params.liftCap,((f.wingTorn?0:params.wingLift)+f.vx*.01)*Math.min(1,f.vx/35))*Math.max(.05,Math.cos(f.pitch));
 // Streamlining a dive reduces drag; gravity supplies the gained energy.
 // Pulling too hard increases drag and eventually collapses the lift.
 const strain=Math.max(0,attack-.65)*Math.max(0,Math.min(1,(f.pitch-.65)/.5));
 const drag=.035*Math.pow(airspeed/params.aeroSpeed,2)*(1-.82*dive)+(params.drag+.03/(1+params.wingLevel)**2)*(1-dive*.8)+strain*.07+(f.stalled?.12:0);
 f.vx+=(Math.cos(f.pitch)*boost+diveGain-drag*f.vx-Math.max(0,f.pitch)*wing*.18)*dt;
 if(balloon){
  // Buoyancy cushions descent; steering below trades momentum for height.
  // Diving releases buoyancy so the balloon responds to the pilot.
  const gravity=(9.81+6/(1+params.wingLevel))*params.gravityMultiplier;
  const support=Math.max(0,Math.min(1,f.vx/28));
  f.vy+=(Math.sin(f.pitch)*boost-gravity*(.85-.63*support*(1-dive)) -f.vy*(f.vy<0?(.10+.25*support)*(1-dive*.8):.08))*dt;
 }else f.vy+=(Math.sin(f.pitch)*boost-(9.81+6/(1+params.wingLevel))*params.gravityMultiplier+(ballisticArc?0:lift)-f.vy*(.025*(1-dive*.85)+(f.stalled?.05:0)))*dt;
 // Turn the velocity without adding speed. A recovery spends kinetic energy on height.
 f.capeLoad=0;
 if(wing>0&&!ballisticArc){
  const forwardBeforeTurn=f.vx,speed=Math.hypot(f.vx,f.vy),heading=Math.atan2(f.vy,f.vx),control=(input.left||input.right)?1.8:1;
  const pullup=f.pitch>0&&f.pitch<1.05?Math.max(0,Math.min(1,(attack-.25)/.6))*.65:0;
  // A deliberate pull-up redirects momentum even on the first canopy.
  const noseUp=Math.max(0,Math.min(1,(f.pitch-.045)/.30,(1.10-f.pitch)/.18));
  const recoveryLift=f.manualGlide>0?1.9*noseUp*noseUp*(3-2*noseUp)*Math.max(0,Math.min(1,(speed-9)/17)):0;
  const authority=f.stalled?((input.left||input.right)?.25:.08):(.09+wing*.025)*control+dive*.45+pullup+recoveryLift;
  const correction=Math.max(-.8,Math.min(.8,f.pitch-.12-heading))*authority*Math.min(1,speed/(70-40*recoveryLift/1.9))*dt;
  f.capeLoad=efficiency*Math.max(0,Math.min(1,attack/.65))*Math.min(1,speed/100);
  f.vx=speed*Math.cos(heading+correction);f.vy=speed*Math.sin(heading+correction);
  // Passive cape alignment dissipates sideways gain instead of turning a fall into a motor.
  // Deliberate dives and pull-ups still exchange speed and altitude.
  if(!f.manualGlide&&dive<.1)f.vx=Math.min(f.vx,forwardBeforeTurn);
 }
 if(!f.manualGlide||f.pitch<=0||input.right)f.vx=Math.min(f.vx,previousVX+(boost+7+diveGain)*dt);
 // Drag grows smoothly near the equipment's terminal speed. Only remove
 // excess acceleration along velocity; never rescale forward momentum on a fall.
 const speed=Math.hypot(f.vx,f.vy),headroom=Math.max(0,Math.min(1,(params.maxSpeed-previousSpeed)/(params.maxSpeed*.25)));
 const allowed=previousSpeed+(3+boost+diveGain)*headroom*dt;
 if(speed>allowed){const excess=speed-allowed;f.vx-=excess*f.vx/speed;f.vy-=excess*f.vy/speed;}
 const previousX=f.x,previousY=f.y;f.vx=Math.max(0,f.vx);f.travelFactor=1;
 f.x+=f.vx*dt;
 f.y+=f.vy*dt*Course.AIR_Y_SCALE;
 if(f.y>220&&thermalCenters.some(x=>Math.abs(f.x-x)<100)){f.vy+=dt*9;if(f.messageTime===0)message(f,'COURANT MAGIQUE !');}
 strikeStones(f,previousX,previousY);
 Monsters.collide(f,previousX,previousY,dt,input);
 Specials.step(f,previousX,previousY,dt,params.maxSpeed);
 f.maxY=Math.max(f.maxY,f.y);
 for(let n=1;n<=Math.min(20,Math.floor(f.x/5000));n++)if(!f.knownRelays.includes(n)){f.knownRelays.push(n);f.newRelays.push(n);message(f,"RELAIS DES "+(n*5)+" KM !");}
 let nextStage=f.stage;while(f.wallsBroken.has(nextStage+1))nextStage++;while(f.stage<nextStage){f.stage++;f.stageEvents.push(f.stage);message(f,"NOUVEAU TABLEAU : "+Course.stages[f.stage].name.toUpperCase());}
 f.towerDamage??={};f.towerLastHit??={};
 for(const x of Course.obstacles){
  if(f.destroyed.has(x)||Course.stages.some(g=>g.at===x)||f.time-(f.towerLastHit[x]??-Infinity)<.8)continue;
  const h=x===500?790:600;
  if(Monsters.sweep(previousX-x,previousY-h*.5,f.x-x,f.y-h*.5,x===500?27:20,h*.5+30)===Infinity)continue;
  f.towerLastHit[x]=f.time;f.towerRevision=(f.towerRevision||0)+1;
  const speed=Math.hypot(f.vx,f.vy),force=speed*Math.sqrt(params.impactMultiplier)*(f.ramTime>0?1.35:1),shattered=force>=65;
  f.towerDamage[x]=shattered?3:1;f.towerBreaks??={};
  if(shattered){
   f.destroyed.add(x);f.hits++;f.towerBreaks[x]={at:f.time,force,hitY:f.y};
   f.vx*=.72+.024*(f.l.rebound||0);f.vy=Math.max(f.vy,8);f.stalled=false;f.stall=0;
  }else{
   f.impactSpeed=speed;f.vx=0;f.vy=0;f.ended=true;f.endReason='tower';f.boosting=false;
   message(f,'LA TOUR TIENT BON ! Prenez plus d’élan ou améliorez votre force.');
  }
  f.monsterEvents??=[];f.monsterEvents.push({x,y:Math.min(h,f.y),rating:shattered?'perfect':'hurt',type:'tower',shattered,speed});
  if(f.ended)break;
 }

 for(let i=0;i<goals.length;i++){
  if(f.achieved[i]||(i>0&&!f.achieved[i-1]))continue;
  const g=goals[i];const gateIndex=Course.stages.findIndex(w=>w.at===g.x);let ok=f.x>=g.x+(gateIndex>0?Course.wallWidth(gateIndex):0)&&f.y>=g.y;
  if(gateIndex>0)ok=ok&&f.wallsBroken.has(gateIndex);
  if(i===goals.length-1)ok=ok&&Math.hypot(f.vx,f.vy)*(1+f.l.impact*.5)>130;
  if(ok){f.achieved[i]=true;f.newGoals.push(i);message(f,i===goals.length-1?'DRAGON TERRASSÉ. CASQUE À REPEINDRE.':'SERMENT ACCOMPLI ! +'+g.bonus+' écus');if(i===goals.length-1){f.ended=true;f.endReason='victory';}}
 }
 if(f.y<=0){f.y=0;f.impactSpeed=Math.hypot(f.vx,f.vy);if(f.bounces<params.ricochets&&f.vx>10){const quality=f.l.rebound||0,out=f.impactSpeed*(.56+quality*.04),fade=Math.pow(.78,f.bounces);f.vy=Math.min(12*(1+quality*.04),out*.5)*fade;f.vx=Math.min(f.vx*(.56+quality*.04),Math.sqrt(Math.max(0,out*out-f.vy*f.vy)));f.bounces++;f.manualGlide=0;f.pitch=Math.max(-.12,Math.min(.18,f.pitch));f.stalled=false;f.stall=0;f.monsterReaction={at:f.monsterTime||0,variant:1,ground:true,strength:Math.min(1,f.vy/12)};f.message='';f.messageTime=0;}else{f.ended=true;f.endReason='ground';}}
 const finalSpeed=Math.hypot(f.vx,f.vy);if(finalSpeed>params.maxSpeed){f.vx*=params.maxSpeed/finalSpeed;f.vy*=params.maxSpeed/finalSpeed;}f.maxSpeed=Math.max(f.maxSpeed,Math.hypot(f.vx,f.vy));
 if(f.time>=300){f.ended=true;f.endReason='timeout';}
}
function message(f,text){f.message=text;f.messageTime=2.8;}
function earnings(f){
 const rows=[{id:'distance',label:'Distance',value:Math.floor(f.x),unit:'m',rate:'0,08 écu / m',gold:Math.floor(Math.floor(f.x)*.08)},{id:'altitude',label:'Altitude maximale',value:Math.floor(f.maxY),unit:'m',rate:'0,12 écu / m',gold:Math.floor(Math.floor(f.maxY)*.12)},{id:'duration',label:'Durée de vol',value:Math.floor((f.realTime??f.time/Course.TIME_SCALE)*10)/10,unit:'s',rate:'2 écus / s',gold:Math.floor(Math.floor((f.realTime??f.time/Course.TIME_SCALE)*10)/10*2)},{id:'speed',label:'Vitesse maximale',value:Math.floor(f.maxSpeed*3.6),unit:'km/h',rate:'0,06 écu / km/h',gold:Math.floor(Math.floor(f.maxSpeed*3.6)*.06)},{id:'destruction',label:'Destructions',value:f.hits,unit:'obstacle(s)',rate:'40 écus / obstacle',gold:f.hits*40}];
 rows.push({id:'stones',label:'Pierres brisées',value:f.wallStones||0,unit:'pierres',rate:'2 écus / pierre',gold:(f.wallStones||0)*2});
 if(f.wallTreasureGold)rows.push({id:'treasures',label:'Trésors des remparts',value:f.wallTreasureGold,unit:'écus',rate:'Coffres secrets',gold:f.wallTreasureGold});
 if(f.collectedGold)rows.push({id:'collected',label:'Or récolté en vol',value:f.collectedGold,unit:'écus',rate:'Pièces, bourses et ennemis',gold:f.collectedGold});
 if(f.time===0){rows.forEach(r=>r.gold=0);return {rows,base:0,support:0,bonuses:[],total:0};}
 const base=rows.reduce((a,r)=>a+r.gold,0),support=Math.max(0,70-base+(f.collectedGold||0)),bonuses=[...f.newGoals.map(i=>({label:goals[i].name,gold:goals[i].bonus})),...f.newRelays.map(n=>({label:'Premier passage · relais '+n*5+' km',gold:250+n*75}))];
  for(const stage of new Set(f.stageEvents||[]))if(!f.wallPrizes?.includes(stage))bonuses.push({label:'Premier franchissement · '+Course.stages[stage].name,rate:'Prime de rempart',gold:wallBonus(stage)});
 for(const m of missionStatus(f))if(m.done)bonuses.push({label:m.label,rate:'Mission réussie',gold:m.gold});
 if(f.gullWallBonus&&f.endReason==='wall')bonuses.push({label:'LE GOÉLAND N’AVAIT PAS SIGNÉ POUR ÇA !',rate:'Duo emplumé dans le mur · bonus spécial',gold:500});
 const subtotal=base+support+bonuses.reduce((a,b)=>a+b.gold,0),percent=(f.l?.goldBonus||0)*5;
 if(percent)bonuses.push({label:'Bonus d’or · +'+percent+' %',rate:'Bonus à chaque vol',gold:Math.floor(subtotal*percent/100)});
 return {rows,base,support,bonuses,total:base+support+bonuses.reduce((a,b)=>a+b.gold,0)};
}
function settle(s,f){if(f.settled)return 0;f.settled=true;if(f.time>0){detonateBomb(f);if(f.bombSpent&&s.bomb===f.bomb)s.bomb=0;}f.earnings=earnings(f);if(f.time===0)return 0;s.wallDamage=cleanDamage(f.wallDamage);s.gold+=f.earnings.total;s.wallTreasureClaimed=[...(f.wallTreasureClaimed||[])];
 s.wallPrizes=[...new Set([...(s.wallPrizes||[]),...(f.stageEvents||[])])];
 s.missionProgress??={};for(const m of missionStatus(f))s.missionProgress[m.id]=m.current;s.day++;s.record=Math.max(s.record,Math.floor(f.x));s.altitude=Math.max(s.altitude,Math.floor(f.maxY));s.completed=f.achieved.slice();s.relays=f.knownRelays.slice();return f.earnings.total;}
const api={bombs,buyBomb,detonateBomb,missionStatus,activeMissions,missions,wallBonus,hasItem,familyUnlocked,itemUnlocked,gearFamilies,statUpgrades,statLevel,statPrice,buyStat,BASE_WING_LEVEL,maxLevel,owned,equip,strikeStones,cleanDamage,parameters,stats,wallStrength,impactPower,MAX_LEVEL,itemName,earnings,categories,goals,thermalCenters,fresh,sanitize,price,buy,create,step,settle};if(typeof module!=='undefined')module.exports=api;else root.GG=api;
})(typeof window!=='undefined'?window:globalThis);
