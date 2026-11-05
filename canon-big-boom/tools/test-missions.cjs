'use strict';
const assert = require('node:assert/strict');
global.window = {};
for (const name of ['config', 'save', 'game', 'custom-waves', 'missions']) require('../js/' + name + '.js');
const CB = window.CB, S = CB.Save, M = CB.Missions;
let count = 0; const ok = (condition, label) => { assert.ok(condition, label); count++; };
const make = (p = S.blank('matthieu'), vi = 0, wi = 0) => new CB.Wave({profile: p, player: CB.playerById(p.id), waveIndex: vi, worldIndex: wi, random: () => .5});
const mem = data => ({data: JSON.stringify(data), getItem() {return this.data;}, setItem(k,v) {this.data=v;}});
{
  const p = S.blank('matthieu'), w = make(p);
  ok(w.missions.length === 3 && w.missionsEndless, 'trois missions et survie ouverte au premier tableau personnalisé');
  w.kills = 100; w.elitesKilled = 3; w.time = 119; w.update(.01);
  ok(!w.over, '100 monstres ne terminent plus le tableau');
  w.hp = 0; w.finish(false, 'detruit');
  ok(w.stars === 2 && w.won && !w.eventFinished, 'la mort conserve les deux missions réussies');
  const result = CB.claim(p, w);
  ok(w.missionBonusGold === 200 && result.gold === 200 && p.gold === 200, '100 pièces par mission, versées aussi après la mort');
  ok(result.newStars === 2 && S.stars(p, 'foret', 0) === 2, 'deux étoiles encaissées');
  ok(!S.waveUnlocked(p, 0, 1) && S.canUnlockStage(p, 0, 1), 'le deuxième tableau est disponible mais reste verrouillé');
  ok(!S.unlockStage(p, 0, 2), 'impossible de sauter un tableau');
  ok(S.unlockStage(p, 0, 1) && S.waveUnlocked(p, 0, 1) && S.stars(p, 'foret', 0) === 2, 'déverrouillage explicite, étoiles conservées');
  ok(!S.unlockStage(p, 0, 1) && CB.claim(p, w) === null, 'pas de double déverrouillage ni double récompense');
  const b = make(p); b.time = 120; b.finish(false, 'detruit'); CB.claim(p, b);
  ok(b.stars === 1 && S.stars(p, 'foret', 0) === 3, 'missions différentes cumulées entre deux parties');
  const again = make(p); again.time = 120; again.finish(false, 'detruit');
  const beforeGold = p.gold, repeatResult = CB.claim(p, again);
  ok(p.gold >= beforeGold + 100, 'rejouer une mission réussie redonne sa prime d’or');
  ok(repeatResult.newStars === 0 && S.stars(p, 'foret', 0) === 3, 'répéter la même mission ne crée pas une étoile de plus');
  const store = mem({profiles: {matthieu:p}}); S.store({profiles:{matthieu:p}}, store); const loaded = S.load(store).profiles.matthieu;
  ok(S.waveUnlocked(loaded,0,1) && loaded.missionStars['foret-1'].survie, 'étoiles de missions et accès persistants');
}
{
  const p = S.blank('matthieu'), w = make(p, 1); w.time = 100; w.kills = 120; w.killsBy.bat = 80; w.bombsDefused = 5; w.finish(false, 'detruit'); CB.claim(p,w);
  ok(w.stars === 2 && !w.missionResults[2].complete, 'nuée : 75 chauves-souris et 5 bombes valent deux étoiles, sans terminer');
  const d = make(p,1); d.time = 150; d.update(.01);
  ok(!d.over && !d.swarm && !d.outro && M.results(d)[2].complete, 'le tableau deux continue après deux minutes');
  const quit = make(p,1); quit.time=100; quit.finish(false,'abandon');
  ok(!quit.eventFinished && !quit.missionResults[2].complete, 'quitter ne simule pas le passage du dragon');
  const third = make(p,2); third.kills = 120; third.killsBy[third.def.strongRoster[0]]=12; third.runLevel = 5; third.specialsUsed = 2; third.update(.01);
  ok(!third.over && M.results(third).every(m=>m.complete), 'tableau trois : trois missions proposées, pas de fin à 120 monstres');
}
{
  const p = S.blank('matthieu'), boss = make(p,4); boss.hp = boss.maxHp; boss.bombsDefused=3; boss.boxesHit=3; boss.finish(true); CB.claim(p,boss);
  ok(boss.stars===3 && S.worldDone(p,0) && S.worldUnlocked(p,1), 'boss réellement vaincu : monde suivant ouvert');
  const b = make(S.blank('matthieu'),4); b.time = 200; b.finish(false,'detruit'); CB.claim(b.profile,b);
  ok(b.stars===0 && !S.worldUnlocked(b.profile,1), 'mourir devant le boss ne débloque pas le monde suivant');
  const hurt = make(); hurt.missions = [{id:'clean',kind:'finishNoDamage',target:1,text:'sans dégât'}]; hurt.missionsEndless=false; hurt.damage(1); hurt.finish(true);
  ok(hurt.stars===0 && hurt.missionCounters.damage>0, 'un dégât absorbé par l’armure invalide la mission sans dégât');
  const protectedWave=make(); protectedWave.shield=1; protectedWave.damage(3);
  ok(protectedWave.missionCounters.damage===0,'bouclier : aucun dégât subi');
  const timed=make(); timed.missions=[{id:'life',kind:'healthAt',target:50,seconds:10,text:'vie à dix secondes'}]; timed.time=10; timed.hp=timed.maxHp*.6; M.tick(timed,0); timed.hp=0; timed.finish(false,'detruit');
  ok(timed.stars===1,'la vie au temps demandé est mémorisée avant la mort');
}
{
  const legacy={id:'matthieu',gold:123,level:5,nightKills:100,progress:{foret:[1,1,1,1,1],manoir:[1,0]},cannon:'classique',cannons:['classique']};
  const p=S.load(mem({profiles:{matthieu:legacy}})).profiles.matthieu;
  ok(p.missionVersion===1 && S.waveUnlocked(p,0,4) && S.worldUnlocked(p,1) && S.waveUnlocked(p,1,1),'migration : tous les accès anciens sont préservés');
  ok(p.gold===123 && S.stars(p,'foret',0)===1,'migration sans perte d’or ni d’étoiles');
  const fresh=S.load(mem({profiles:{matthieu:{id:'matthieu',level:1,progress:{},nightKills:0}}})).profiles.matthieu;
  ok(!S.waveUnlocked(fresh,0,1),'migration sans inventer d’accès');
}
{
  const p=S.blank('matthieu'); p.gold=10000;
  ok(!make(p,4).canDodge && S.buyMovement(p) && p.gold===9000 && make(p,4).canDodge,'déplacement acheté à 1000 pour le premier canon, y compris boss');
  ok(!S.buyMovement(p) && !S.buyMovement(p,'pirate'),'achat unique par canon possédé');
  p.cannons.push('pirate'); p.cannon='pirate';
  ok(!make(p).canDodge && CB.movementCost('pirate')>1000 && S.buyMovement(p),'le second canon exige son propre achat plus cher');
  const mobile=make(p); mobile.move(1,.2); ok(mobile.px>0,'déplacement acheté utilisable dans un tableau ordinaire');
  const saved=S.load(mem({profiles:{matthieu:p}})).profiles.matthieu;
  ok(S.hasMovement(saved,'classique') && S.hasMovement(saved,'pirate'),'achats de mouvement sauvegardés par canon');
}
{
  for(let wi=0;wi<6;wi++) {
    const w=make(undefined,0,wi), e=w.spawnGoldCoin(), gold=w.gold, kills=w.kills, xp=w.xp;
    ok(e.coinValue===CB.GOLD_COINS[wi],'valeur de pièce du monde '+(wi+1));
    w.kill(e); w.kill(e); ok(w.gold-gold===CB.GOLD_COINS[wi] && w.coinsCollected===1 && w.kills===kills && w.xp===xp,'collecte unique sans fausse élimination ni XP');
    ok(w.isDecor(e) && !w.seenBy.goldCoin,'pièce exclue des monstres et du bestiaire');
    w.triggerEvent('boucliers'); ok(w.enemies.filter(e=>e.wall).every(e=>e.maxHp===10+wi*5),'résistance des murs progressive par monde');
  }
  const w=make(); w.time=12; w.update(.01); ok(w.enemies.some(e=>e.def.coin),'des pièces apparaissent pendant le tableau');
}
ok(M.rewardGold(0,0) === 100 && M.rewardGold(0,1) === 125 && M.rewardGold(0,4) === 200 && M.rewardGold(1,0) === 200 && M.rewardGold(2,0) === 300, 'prime croissante par tableau et monde');
for(let wi=0;wi<CB.WORLDS.length;wi++) for(let vi=0;vi<CB.wavesOf(wi);vi++) {
  const missions=M.forStage(wi,vi); ok(missions.length===3 && new Set(missions.map(m=>m.id)).size===3,'trois missions distinctes pour '+wi+'-'+vi);
}
{
  const w=make(); w.time=119.99; ok(M.pressure(w).step===0 && M.pressure(w).hp===1, 'aucun renforcement avant deux minutes');
  const base=w.spawnEnemy('bat',undefined,false); w.time=120; M.tick(w,.01);
  const later=w.spawnEnemy('bat',undefined,false); ok(w.pressureStep===1 && later.hp>base.hp && later.speed>base.speed, 'à deux minutes : horde et renforcement des nouvelles apparitions');
  const initial=M.pressure(w); w.time=180; const intense=M.pressure(w); w.time=240; const swarm=M.pressure(w);
  ok(intense.every<initial.every && intense.count>initial.count && swarm.every<intense.every && swarm.hp>intense.hp, 'arrivées plus fréquentes, plus nombreuses et plus résistantes toutes les trente secondes');
  w.enemies=[]; for(let i=0;i<40;i++) w.spawnEnemy('bat',undefined,false); const size=w.enemies.length; M.tick(w,.01);
  ok(w.enemies.length===size,'les renforts respectent le budget de quarante monstres présents');
  const other=make(undefined,2); other.openingEndedAt=0; other.time=240; ok(M.pressure(other).step===5,'le tableau trois reçoit aussi la horde');
  const arrivals = start => { const wave = make(); let n = 0; const spawn = wave.spawnEnemy.bind(wave); wave.spawnEnemy = (...args) => { n++; return spawn(...args); }; for (let i=0; i<160; i++) { wave.time = start + i*.05; wave.enemies=[]; M.tick(wave,.05); } return n; };
  ok(arrivals(180)>arrivals(120)*3 && arrivals(240)>arrivals(180), 'le rythme réel des renforts accélère fortement après deux minutes');
  const before=w.gold; w.time=270; M.tick(w,.01); ok(w.gold===before,'le passage de difficulté ne crédite pas d’or');
}
{
  for (const [wi,vi] of [[0,4],[0,6],[0,7]]) { const w=make(undefined,vi,wi); w.time=240; ok(M.pressure(w).step===0,'exception horde '+wi+'/'+vi); }
  for (const [wi,vi] of [[0,1],[0,3],[0,5],[0,8],[1,0],[1,1],[1,2],[1,3]]) { const w=make(undefined,vi,wi); if(w.def.opening) w.openingEndedAt=0; w.time=130; ok(M.pressure(w).step>0,'horde active '+wi+'/'+vi); const type=M.hordeEnemy(w); ok(CB.ENEMIES[type] && (!w.def.roster || w.def.roster.includes(type)), 'renfort du bon bestiaire'); }
  const w=make(undefined,3); w.intro=0; w.openingEndedAt=0; w.time=240; w.killsBy[w.def.strongRoster[0]]=14; w.bombsDefused=5; w.damage=()=>false; w.nextBox=Infinity; w.nextGoldCoin=Infinity;
  w.spawnEnemy('bat',{x:-15,y:8,z:40}); w.update(.01);
  ok(w.outro && !w.over,'tableau quatre : la finale commence à quatre minutes');
  const n=w.enemies.length; M.tick(w,.01); ok(w.enemies.length===n,'aucun renfort pendant le dragon');
  for(let i=0;i<400 && !w.over;i++) { w.update(.05); if(w.choice) w.pickCard(0); }
  ok(w.over && w.eventFinished && w.stars===3,'le dragon chasse les monstres puis valide la finale et les missions');
  const boss=make(undefined,4); boss.spawnBoss(); ok(boss.boss.def.name==='Le Dragon rouge' && boss.boss.powers.includes('feu'),'premier boss rouge avec attaque de feu');
}
{
  const p=S.blank('matthieu'), w=make(p);
  ok(M.knownEnemies(p,0,0).length===0,'aucun bestiaire local inventé depuis les anciens totaux');
  const at={x:0,y:8,z:40};
  const seen=w.spawnEnemy('owl',at,false);
  const bat=w.spawnEnemy('bat',at,false), elite=w.spawnEnemy('bat',at,true), red=w.spawnEnemy('bat',at,false,1);
  for(const e of [bat,elite,red]) w.applyDamage(e,10000);
  w.finish(false,'abandon'); CB.claim(p,w);
  const discovered=M.knownEnemies(p,0,0);
  ok(discovered.length===2 && !discovered.some(e=>e.type==='owl'),'seuls les monstres tués sont révélés, avec leurs variantes');
  ok(discovered.find(e=>e.elite).color===CB.ENEMIES.bat.variant.color && Object.values(p.stageBestiary['foret-1']).some(e=>e.tier===1 && e.color===CB.TIERS[1].color),'couleurs élite et palier identiques au combat');
  ok(M.knownEnemies(p,0,1).length===0,'une élimination au tableau un ne révèle rien au tableau deux');
  const loaded=S.load(mem({profiles:{matthieu:p}})).profiles.matthieu;
  ok(M.knownEnemies(loaded,0,0).length===2,'découvertes locales sauvegardées');
  ok(CB.claim(p,w)===null && M.knownEnemies(p,0,0).length===2,'encaissement unique sans doublons');
}
{
  const w=make(undefined,1); w.time=100;
  ok(!M.results(w)[1].complete,'survivre 90 secondes ne valide plus la deuxième mission');
  for(let i=0;i<5;i++) w.applyDamage(w.spawnEnemy('bombeMagique'),100);
  ok(M.results(w)[1].complete && w.bombsDefused===5,'désamorcer cinq bombes valide la nouvelle mission');
}
{
  for(let wi=0;wi<CB.WORLDS.length;wi++) for(let vi=0;vi<CB.wavesOf(wi);vi++) {
    const missions=M.forStage(wi,vi);
    ok(missions.length===3 && new Set(missions.map(m=>m.kind)).size===3,'trois objectifs distincts '+wi+'/'+vi);
    ok(missions.filter(m=>['survive','finish','finishHealth','bossNoSpecial'].includes(m.kind)).length<=1,'pas de doublon de fin/survie '+wi+'/'+vi);
  }
  for(const [wi,vi] of [[0,0],[0,2],[0,3],[0,4],[0,5],[0,8],[1,0],[2,1]]) {
    const w=make(undefined,vi,wi); w.intro=0; w.openingEndedAt=0; w.nextEvent=Infinity; w.time=19.9; w.update(.01);
    ok(!w.enemies.some(e=>e.type==='bombeMagique'),'aucune bombe avant vingt secondes '+wi+'/'+vi);
    w.time=20; w.update(.01); ok(w.enemies.filter(e=>e.type==='bombeMagique'&&!e.dead).length===1,'bombe disponible '+wi+'/'+vi);
    w.nextBomb=w.time; w.update(.01); ok(w.enemies.filter(e=>e.type==='bombeMagique'&&!e.dead).length===1,'pas de bombes simultanées');
  }
  for(const vi of [6,7]) {const w=make(undefined,vi);ok(!w.magicBombs && w.nextBomb===Infinity,'mini-jeu sans bombe');}
  const c=make(undefined,6);const target=c.spawnFlyer(); c.time=target.spawnTime+1; c.applyDamage(target,999); ok(c.quickTargets===1,'cible touchée rapidement comptée');
  const b=make(undefined,7);b.spawnRound();const bad=b.panels.find(e=>e.def.bad);bad.panel.age=.8;b.applyDamage(bad,999);ok(b.quickBrigands===1,'brigand attrapé rapidement compté');
}
{
  const w=make(undefined,1); w.kills=120; w.openingEndedAt=60; w.time=150; w.nextEvent=Infinity; w.update(.01);
  ok(w.missionsEndless && !w.over && !w.swarm && M.pressure(w).step>0,'tableau 2 ouvert avec horde, sans nuée');
  const b=make(undefined,1); b.time=40; b.nextEvent=Infinity; b.update(.01); ok(b.enemies.some(e=>e.def.secretBoat),'bateau secret conservé hors nuée');
  for(const vi of [1,2,3]) { const level=make(undefined,vi); ok(level.def.roster?.length>=4,'bestiaire explicite du tableau '+vi); for(let n=0;n<10;n++) ok(level.def.roster.includes(level.pickWorldEnemy()),'apparitions limitées au bestiaire'); }
  const p=S.blank('matthieu'); p.stageBestiary={'foret-2':{a:{type:'bat',elite:true,tier:0,color:'#ff3a3a'},b:{type:'bat',elite:true,tier:1,color:'#ff3a3a'},c:{type:'bat',elite:true,tier:2,color:'#ff3a3a'}}};
  ok(M.knownEnemies(p,0,1).length===1 && Object.keys(p.stageBestiary['foret-2']).length===3,'icône élite unique, variantes détaillées préservées');
}
{
  const w=make(undefined,1); w.time=150; w.nextEvent=0;
  ok(w.gentleStart && M.pressure(w).step===0 && w.pickWorldEnemy()==='bat' && w.spawnInterval()===2.2,'début calme sans horde même pour un joueur lent');
  const bat=w.spawnEnemy('bat'); ok(!bat.elite && !bat.big && bat.hp===CB.ENEMIES.bat.hp,'chauve-souris simple et fragile, sans renforcement au temps');
  w.update(.01); ok(!w.bombs && !w.puzzle,'pas de bombes ni de puzzle avant les deux choix');
  w.choice=['rapide']; w.pickCard(0); w.update(.01); ok(w.gentleStart,'un seul pouvoir ne termine pas l’apprentissage');
  w.choice=['costaud']; w.pickCard(0); w.update(.01); ok(!w.gentleStart && w.combatAge===0 && w.nextBomb>w.time && M.pressure(w).step===0,'deux choix déclenchent une transition progressive');
  for(const elapsed of [0,15,25,45]) { w.time=w.openingEndedAt+elapsed; const type=w.pickWorldEnemy(); ok(w.def.progressiveRoster.slice(0,elapsed<40?2:3).includes(type),'monstres introduits par étapes'); }
  ok(M.pressure(w).step===1,'la horde attend au moins 45 secondes après les deux pouvoirs');
}
// Le démarrage progressif est vérifié avec la vraie Wave, sans désactiver ses règles.
for(let wi=0;wi<CB.WORLDS.length;wi++) for(let vi=0;vi<CB.wavesOf(wi);vi++) {
  const w=make(undefined,vi,wi); if(!w.def.opening || w.custom || w.def.voyage) continue;
  w.time=300; w.intro=0; w.nextGoldCoin=Infinity; w.nextBox=Infinity;
  ok(w.gentleStart && M.pressure(w).step===0,'apprentissage sans limite de temps '+wi+'/'+vi);
  for(let i=0;i<8;i++) { const type=w.pickWorldEnemy(), e=w.spawnEnemy(type); ok(w.def.opening.easy.includes(type) && !e.big && !e.elite && !e.guard && e.hp<=w.stats.damage*2,'petit ennemi fragile au départ '+wi+'/'+vi); }
  w.enemies=[]; w.update(.01);
  ok(!w.enemies.some(e=>e.def.ship||e.def.riser||e.type==='bombeMagique'),'pas de menace spéciale au départ '+wi+'/'+vi);
  if(['survive','killTimed'].includes(w.def.type)) ok(w.def.seconds>=w.time+119.9,'au moins deux minutes après un apprentissage lent');
  w.choice=['rapide']; w.pickCard(0); w.update(.01); ok(w.gentleStart,'premier choix : encore calme');
  w.choice=['costaud']; w.pickCard(0); w.update(.01); ok(!w.gentleStart && w.combatAge===0,'deuxième choix : début de la progression');
  const mission=w.missions.find(m=>m.kind==='strongKills');
  if(mission) { ok(mission.enemies.length>0 && mission.enemies.every(k=>w.def.progressiveRoster.includes(k)),'mission liée aux ennemis de ce tableau'); w.killsBy[w.def.opening.easy[0]]=999; ok(M.value(w,mission)===0,'les petits monstres ne valident pas la mission des costauds'); w.killsBy[mission.enemies[0]]=mission.target; ok(M.value(w,mission)>=mission.target,'les costauds font avancer leur mission'); }
}
{
  const p=S.blank('matthieu'); p.progress.foret=[2,1,0,0,0]; p.stageOpen={'foret-2':true};
  ok(!S.canUnlockStage(p,0,2),'trois étoiles ne suffisent pas au tableau 3');
  p.progress.foret[1]=2; ok(S.canUnlockStage(p,0,2) && S.unlockStage(p,0,2),'quatre étoiles ouvrent le tableau 3');
  ok(!S.canUnlockStage(p,0,3),'quatre étoiles ne suffisent pas au tableau 4');
  p.progress.foret[2]=2; ok(S.unlockStage(p,0,3),'six étoiles ouvrent le tableau 4');
  p.progress.foret[3]=1; ok(!S.canUnlockStage(p,0,4),'sept étoiles ne suffisent pas au boss');
  p.progress.foret[3]=2; ok(S.unlockStage(p,0,4) && S.totalStars(p)===8,'huit étoiles ouvrent le boss sans être consommées');
  p.progress.foret=[0,0,0,0,0]; ok(S.waveUnlocked(p,0,4),'les tableaux déjà ouverts restent ouverts');
  p.stageFinished={'foret-5':true}; p.progress.manoir=[1]; p.progress.foret=[3,3,3,3,3];
  ok(!S.canUnlockStage(p,1,1),'les étoiles des autres mondes ne remplacent pas celles du monde courant');
}
{
  const w=make(undefined,8); w.intro=0;
  ok(w.def.seconds===180 && w.fishers.length===4 && new Set(w.fishers.map(f=>f.id)).size===4,'croisière de trois minutes avec quatre pêcheurs différents');
  ok(w.fishers.filter(f=>f.side<0).length===2 && w.fishers.filter(f=>f.side>0).length===2,'deux pêcheurs de chaque côté');
  const shark=w.spawnEnemy('requin'); shark.x=-4; w.armor=1000; w.damage(1,shark);
  ok(w.fishers.filter(f=>f.fledAt!=null).length===1 && w.fishers[0].fledAt===0,'un impact sur la coque fait fuir un seul pêcheur du bon côté');
  w.damage(1,shark); ok(w.fishers.filter(f=>f.fledAt==null).length===2,'un deuxième impact fait fuir un deuxième pêcheur');
  ok(!M.results(w).find(m=>m.kind==='fishers').complete,'les pêcheurs doivent arriver au bout avant de gagner la mission');
  w.enemies=[]; w.nextEvent=Infinity; w.nextBomb=Infinity; w.time=180; w.update(.01);
  ok(w.over && w.eventFinished && w.worldWon==='pirates' && w.fisherGold===200,'arrivée : île pirate et 100 pièces par pêcheur restant');
  ok(M.results(w).find(m=>m.kind==='fishers').complete,'mission pêcheurs validée à l’arrivée');
  const gold=CB.claim(w.profile,w).gold; ok(gold>=200 && CB.claim(w.profile,w)===null,'prime encaissée une seule fois');
  const quit=make(undefined,8); quit.finish(false,'abandon'); ok(quit.fisherGold===0 && !quit.worldWon,'aucune prime ni île si on abandonne');
  const full=make(undefined,8); full.time=180; full.finish(true); ok(full.fisherGold===400,'400 pièces pour les quatre pêcheurs');
  const empty=make(undefined,8); empty.armor=1000; for(let i=0;i<7;i++) empty.damage(1,{x:0}); empty.time=180; empty.finish(true); ok(empty.fisherGold===0 && empty.fishers.every(f=>f.fledAt!=null),'aucune prime négative après le départ de tous les pêcheurs');
}
{
  const w=make(undefined,3);
  ok(w.def.opening.easy.join(',')==='bat,owl,pumpkin','tableau 4 : chauves-souris, hiboux et citrouilles au départ');
  for(const type of w.def.opening.easy) { const e=w.spawnEnemy(type); ok(e.calmMotion && e.speed<CB.ENEMIES[type].speed*.65,'ennemi initial lent avec trajectoire droite'); }
  w.openingEndedAt=0;w.time=210;w.random=()=>.1;
  ok(w.pickWorldEnemy()==='bat' && M.hordeEnemy(w)==='bat','les chauves-souris restent présentes même dans la horde tardive');
}
{
  const w=make(undefined,8);w.intro=0;w.nextEvent=w.nextBomb=w.nextBox=Infinity;w.damage=()=>false;
  ok(w.missions[0].target===150 && w.def.opening.easy.join()==='goelandPirate','bateau : 150 monstres et goélands pour les premiers niveaux');
  const first=w.spawnEnemy(w.pickWorldEnemy());ok(first.hp===1 && first.calmMotion && first.speed<5,'goéland initial fragile, lent et prévisible');w.enemies=[];
  let easyKills=0;
  for(let i=0;i<3700&&!w.over;i++) {w.update(.05); for(const e of w.enemies.slice()) if(!w.isDecor(e)){if(w.gentleStart){ok(e.type==='goelandPirate','uniquement des goélands avant deux pouvoirs');easyKills++;}w.applyDamage(e,10000);} if(w.choice)w.pickCard(0);}
  ok(easyKills>=15 && !w.gentleStart,'les goélands fournissent les deux premiers pouvoirs');
  ok(w.over && w.kills>=150 && w.missionResults[0].complete,'assez d’apparitions en trois minutes pour réussir les 150 monstres');
}
console.log('✔ '+count+' vérifications missions, progression, pièces et déplacement réussies');
