// Fiche d'un membre : réunit les personnages des trois jeux (configs chargées à côté) et lit leurs sauvegardes
// dans localStorage. Les jeux et cette page partagent la même origine : les sauvegardes sont celles de cet appareil.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FamilyMember=factory();})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const age=birth=>{if(!birth)return null;const b=new Date(birth),now=new Date();let a=now.getFullYear()-b.getFullYear();if(now<new Date(now.getFullYear(),b.getMonth(),b.getDate()))a--;return a;};
 const familyName=(id,teams)=>teams.find(t=>t.id===id)?.name||('Les '+id.charAt(0).toUpperCase()+id.slice(1));
 // Liste des membres : personnages d'origine (Snow Kids, Hockey, Ballon chasseur) puis catalogue en ligne.
 // Un même membre peut porter des identifiants différents selon le jeu : ALIASES les réunit (ids par jeu dans m.ids).
 const ALIASES={zachary:'zach'},canon=id=>ALIASES[id]||id;
 function members({SK,HK,BC,catalog}){
  const teams=[...(HK?.TEAMS||[]),...(BC?.TEAMS||[])],byId=new Map();
  const add=(game,id,data)=>{const key=canon(id),m=byId.get(key)||{id:key,ids:{},games:[]};for(const [k,v] of Object.entries(data))if(v!=null&&m[k]==null)m[k]=v;if(game){m.ids[game]=id;if(!m.games.includes(game))m.games.push(game);}byId.set(key,m);};
  for(const c of SK?.CHARACTERS||[])if(c.family||c.custom)add('snow',c.id,{name:c.name,birth:c.birth,familyId:c.custom?null:c.family.toLowerCase(),family:c.custom?c.family:familyName(c.family.toLowerCase(),teams),gender:c.gender,portrait:canon(c.id),custom:c.custom||null});
  for(const [G,game] of [[HK,'hockey'],[BC,'ballon']])for(const [id,p] of Object.entries(G?.PLAYERS||{})){if(p.monster)continue;const team=G.TEAMS.find(t=>t.players.includes(id)||t.goalie===id);add(game,id,{name:p.name,birth:p.birth,familyId:team?.id,family:team?.name,role:p.role,portrait:canon(p.familyPortrait||id),custom:p.custom||null});}
  for(const p of catalog?.people||[]){const f=catalog.families.find(f=>f.id===p.familyId);add(null,p.id,{name:p.name,familyId:p.familyId,family:f?.name,gender:p.body==='girl'?'girl':'boy',portrait:p.id,portraitUrl:p.portrait,custom:true,ageGroup:p.ageGroup});}
  const list=[...byId.values()].map(m=>({...m,age:age(m.birth),family:m.family||'Invités',familyId:m.familyId||'guests'}));
  const order=new Map();teams.forEach((t,i)=>{if(!order.has(t.id))order.set(t.id,i);});
  list.sort((a,b)=>(order.get(a.familyId)??99)-(order.get(b.familyId)??99)||(a.age??999)-(b.age??999)||a.name.localeCompare(b.name));
  return list;
 }
 const parse=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'null');}catch(e){return null;}};
 const level=xp=>{let remaining=Math.max(0,Math.floor(Number(xp)||0)),level=1;while(remaining>=100+50*(level-1)){remaining-=100+50*(level-1);level++;}return {level,current:remaining,needed:100+50*(level-1)};};
 const SNOW_FIELDS=['characterStats','characterStatsMigrated','playSeconds','xp','trainingPoints','gold','boards','unlocked','won','best','advBoard','upgrades','gear','wardrobe','trophies','missions','cups','shinobin'];
 // Snow Kids : une aventure par personnage (snowkids.save → profiles[id], le profil actif vit au niveau racine).
 function snow(id,SK,storage){
  const ch=SK?.charById?.(id);if(!ch)return null;
  const save=parse(storage,'snowkids.save');const base={speed:ch.speed||0,corner:ch.corner||0,acceleration:ch.acceleration||0,jump:ch.jump||0,strength:ch.strength||0};
  const info={game:'snow',name:ch.name,desc:ch.desc,base,max:SK.STAT_MAX||50,saved:false};
  if(!save)return info;
  const legacy=Object.entries(SK.LEGACY_CHARACTERS||{}).find(([,v])=>v===id)?.[0];
  let profile=save.profiles?.[id]||(legacy&&save.profiles?.[legacy])||null;
  const active=save.activeProfile===id||(legacy&&save.activeProfile===legacy)||(!save.activeProfile&&(save.advChar===id||save.char===id));
  if(active)profile={...(profile||{}),...Object.fromEntries(SNOW_FIELDS.filter(k=>save[k]!==undefined).map(k=>[k,save[k]]))};
  if(!profile)return info;
  profile=JSON.parse(JSON.stringify(profile));const levels=SK.trainingLevels?SK.trainingLevels(profile):(profile.characterStats||{});
  const progress=level(profile.xp);const courses=SK.COURSES||[],cups=SK.CUPS||[],missions=SK.MISSIONS||[],boards=(SK.BOARDS||[]).filter(b=>!b.secret);
  return {...info,saved:true,active,gold:Math.floor(Number(profile.gold)||0),xp:Math.floor(Number(profile.xp)||0),level:progress.level,xpCurrent:progress.current,xpNeeded:progress.needed,trainingPoints:Math.floor(Number(profile.trainingPoints)||0),playSeconds:Math.floor(Number(profile.playSeconds)||0),
   stats:Object.fromEntries(Object.keys(base).map(k=>[k,base[k]+(levels[k]||0)])),training:{...levels},
   courses:courses.map((c,i)=>({id:c.id,name:c.hidden&&i>=(profile.unlocked||1)&&!profile.won?.[c.id]?'???':c.name,unlocked:i<(profile.unlocked||1),won:!!profile.won?.[c.id],best:profile.best?.[c.id]??null})),
   cups:cups.map(c=>({id:c.id,name:c.name,won:!!profile.cups?.[c.id]?.won,bestRank:profile.cups?.[c.id]?.bestRank??null})),
   missionsDone:Object.keys(profile.missions||{}).filter(m=>missions.some(x=>x.id===m)).length,missionsTotal:missions.length,
   boardsOwned:(profile.boards||[]).filter(b=>boards.some(x=>x.id===b)).length,boardsTotal:boards.length,board:SK.boardById?.(profile.advBoard)?.name||null,
   gear:(profile.gear||[]).length,wardrobe:(profile.wardrobe||[]).length,ninja:!!profile.shinobin};
 }
 // Hockey : stats et pouvoir de base, équipe. Aucune progression par joueur n'est sauvegardée; les étoiles d'entraînement sont communes.
 function hockey(id,HK,storage){
  const p=HK?.PLAYERS?.[id];if(!p)return null;const team=HK.TEAMS.find(t=>t.players.includes(id)||t.goalie===id),power=HK.POWERS?.[p.power];
  const stars=parse(storage,'hk.drills')||{};let total=0;for(const v of Object.values(stars))if(Array.isArray(v))total+=v.filter(Boolean).length;
  return {game:'hockey',name:p.name,role:p.role,team:team?.name||null,goalie:team?.goalie===id,stats:{...p.stats},max:5,power:power?{name:power.name,icon:power.icon,desc:power.desc}:null,drillStars:total,drillTotal:(HK.DRILLS||[]).length*3||null,saved:false};
 }
 // Ballon chasseur : stats de base, aventure (bc.adventure.<chef>), fiches dans les aventures des autres, équipement, coupe.
 function ballon(id,BC,storage){
  const p=BC?.PLAYERS?.[id];if(!p||p.monster)return null;const team=BC.TEAMS.find(t=>t.players.includes(id)),power=BC.POWERS?.[p.power];
  const info={game:'ballon',name:p.name,role:p.role,team:team?.name||null,stats:{...p.stats},max:BC.MAX_STAT||18,power:power?{name:power.name,icon:power.icon,desc:power.desc}:null,saved:false};
  const sheet=(s,pid)=>{const c=s?.chars?.[pid];if(!c)return null;const earned=Math.max(0,Number(c.earned)||0);return {level:1+earned,xp:Number(c.xp)||0,next:BC.xpForPoint?BC.xpForPoint(earned):40+20*earned,points:Number(c.points)||0,matches:Number(c.matches)||0,kos:Number(c.kos)||0,stats:{...c.stats}};};
  const own=parse(storage,'bc.adventure.'+id);const legacy=parse(storage,'bc.adventure');const mine=own||(legacy&&legacy.leader===id?legacy:null);
  const others=[];for(let i=0;i<(storage.length||0);i++){const key=storage.key(i);if(!key||!key.startsWith('bc.adventure.')||key==='bc.adventure.'+id)continue;const s=parse(storage,key),f=sheet(s,id);if(f&&BC.PLAYERS[s.leader])others.push({leader:BC.PLAYERS[s.leader].name,...f});}
  const equipment=parse(storage,'bc.equipment'),hero=equipment?.heroes?.[id];const cups=parse(storage,'bc.cups')||{};
  return {...info,saved:!!(mine||others.length||hero),adventure:mine?{...sheet(mine,id),match:Number(mine.match)||0,wins:Number(mine.wins)||0,losses:Number(mine.losses)||0,bosses:Number(mine.bosses)||0,team:[...(mine.team?.inner||[]),...(mine.team?.outer||[])].map(pid=>BC.PLAYERS[pid]?.name||pid),created:mine.created||null}:null,
   others,equipment:hero?{owned:(hero.owned||[]).length,equipped:Object.values(hero.equipped||{}).filter(Boolean).length,life:hero.life||0}:null,shopGold:equipment?Math.floor(Number(equipment.gold)||0):null,
   cupWon:team&&cups[team.id]?cups[team.id]:null};
 }
 const duration=s=>{s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h} h ${String(m).padStart(2,'0')} min`:m?`${m} min`:`${s} s`;};
 const time=t=>{if(t==null||!isFinite(t))return '--:--.--';const m=Math.floor(t/60),s=Math.floor(t%60),c=Math.floor((t*100)%100);return `${m<10?'0':''}${m}:${s<10?'0':''}${s}.${c<10?'0':''}${c}`;};
 return {members,snow,hockey,ballon,level,age,duration,time,canon};
});
