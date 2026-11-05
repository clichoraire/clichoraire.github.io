'use strict';
const assert=require('node:assert/strict');
global.window={};
for(const file of ['config','save','game','custom-waves','missions','map','campaign'])require('../js/'+file+'.js');
const CB=window.CB,S=CB.Save;
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const make=(wi,vi,p=S.blank('eliott'))=>new CB.Wave({profile:p,player:CB.playerById('eliott'),worldIndex:wi,waveIndex:vi,random:()=>.5});
const ids=CB.mainWorlds().map(i=>CB.WORLDS[i].id);
{
 const p=S.blank('eliott');
 ok(CB.Map.visible(0,p,0)&&!CB.Map.visible(0,p,1),'seul le premier tableau est visible au départ');
 p.progress.foret=[1];
 ok(CB.Map.visible(0,p,1)&&!CB.Map.visible(0,p,2),'une étoile révèle uniquement le tableau suivant');
 ok(!S.canUnlockStage(p,0,1),'révéler ne supprime pas le seuil de déblocage');
 ok(!CB.Map.visible(0,p,CB.WORLDS[0].extra.vi),'les secrets gardent leur découverte propre');
 for(const wi of CB.mainWorlds()) {
  const id=CB.WORLDS[wi].id;p.campaignAccess[id]=true;p.progress[id]=[1];
  ok(CB.Map.visible(wi,p,1)&&!CB.Map.visible(wi,p,2),'révélation dans '+id);
 }
}
{
 const p=S.blank('eliott');
 p.progress.foret=[3,3,3,0];
 p.stageOpen={'foret-2':true,'foret-3':true,'foret-4':true}; // seuil cumulé atteint, sans étoile au tableau précédent
 ok(!CB.Map.visible(0,p,4)&&!S.unlockStage(p,0,4),'le cumul seul ne révèle ni ne débloque un tableau');
 p.progress.foret[3]=1;
 ok(CB.Map.visible(0,p,4)&&S.unlockStage(p,0,4),'une étoile précédente et le cumul suffisent');
 ok(S.stars(p,'foret',0)===3&&S.stars(p,'foret',3)===1,'les étoiles restent acquises');
}
{
 const p=S.blank('eliott');p.reticle='point';p.reticleColor='#12AB34';p.wallBreaker=2;
 let raw; const storage={setItem:(_,v)=>raw=v,getItem:()=>raw};
 S.store({profiles:{eliott:p}},storage);
 const saved=S.load(storage).profiles.eliott;
 ok(saved.reticle==='point'&&saved.reticleColor==='#12ab34'&&saved.wallBreaker===2,'viseur, couleur et pouvoir sauvegardés par héros');
 p.reticle='prototype';p.reticleColor='red';S.store({profiles:{eliott:p}},storage);
 const normalized=S.load(storage).profiles.eliott;
 ok(normalized.reticle==='classique'&&normalized.reticleColor===null,'repli sur le viseur classique avec une ancienne valeur invalide');
}
{
 const p=S.blank('eliott');
 p.progress.foret=[3,3,3,3,2,2,2,2,2];
 p.stageOpen={'foret-9':true};
 ok(S.stageStarCount(p,0)===22&&!S.canUnlockStage(p,0,9),'le Dragon rouge reste fermé à 22 étoiles');
 p.progress.foret[CB.WORLDS[0].extra3.vi]=3;
 ok(S.stageStarCount(p,0)===25&&S.unlockStage(p,0,9),'les étoiles du Bateau ouvrent le Dragon rouge');
}
assert.deepEqual(ids,['foret','manoir','foire','ruche','volcan','bonbons','espace','chaos']);
for(let wi=0;wi<CB.WORLDS.length;wi++){
 const world=CB.WORLDS[wi],nodes=CB.Map.nodes(wi);
 ok(nodes.length===CB.wavesOf(wi),'nodes '+world.id);
 for(let vi=0;vi<CB.wavesOf(wi);vi++){
  const w=make(wi,vi);
  if(world.id==='pirates') {
   ok(w.choice?.join() === 'fishers,cannons' && w.time===0,'choix d’équipage sur tous les tableaux pirates');
   w.update(.05);
   ok(w.time===0 && !w.reroll(),'l’équipage est choisi avant le départ');
   w.pickCard(0);
   ok(w.fishers.length===4 && w.cards.length===0 && !w.openingChoices,'quatre pêcheurs sans consommer un choix de niveau');
  }
  ok(w.missions.length===3,'three missions '+wi+'/'+vi);
  ok(new Set(w.missions.map(m=>m.kind)).size===3,'different missions '+wi+'/'+vi);
  for(const k of w.def.roster||world.enemies)ok(!!CB.ENEMIES[k],'enemy '+k);
  if(vi<10)ok((vi===9)===(w.def.type==='boss'),'boss is last '+wi+'/'+vi);
  if(vi>0&&vi<10)ok(S.stageStarRequirement(vi)>S.stageStarRequirement(vi-1)&&S.stageStarRequirement(vi)<=3*vi,'reachable stars');
  w.intro=0;w.hp=1e9;
  for(let i=0;i<100;i++)w.update(.05);
  ok(Number.isFinite(w.hp),'simulation '+wi+'/'+vi);
  if(vi<9&&!w.custom&&!w.endless){w.time=70;w.openingChoices=2;w.openingEndedAt=10;for(let i=0;i<50;i++)w.update(.05);ok(Number.isFinite(w.hp),'later simulation');}
  if(vi===6)ok(w.previewShown&&w.enemies.some(e=>e.def.panel),'brigand preview');
 }
 ok(CB.waveDef(wi,2).targets.kills.length===3,'discovery targets');
 const p=S.blank('eliott');S.cheatUnlock(p);
 ok(S.waveUnlocked(p,wi,world.extra.vi)&&S.waveUnlocked(p,wi,world.extra2.vi),'side games accessible');
}
{
 const shapes=new Set(), counts=new Set(), depths=new Set();
 for(const [width,height] of [[320,568],[568,320],[1280,800]]) {
  CB.setView(width,height);
  for(let wi=0;wi<CB.WORLDS.length;wi++){
   const w=make(wi,CB.WORLDS[wi].extra2.vi);
   if (w.choosingCrew) w.pickCard(0);
   w.intro=0;
   for(let i=0;i<w.brigands.rounds;i++){
    const panels=w.spawnRound();
    counts.add(panels.length);
    ok(panels.filter(e=>e.def.bad).length===w.brigands.bads,'bon nombre de brigands par manche');
    for(const e of panels){shapes.add(e.panel.motion.path);depths.add(e.z);}
    if(i<3)ok(panels.every(e=>e.panel.motion.path==='glisse'),'les premières manches apprennent la translation');
    const before=panels.map(CB.project); let moved=false;
    for(let step=0;step<30;step++){
     w.update(.05);
     const boxes=panels.map(e=>{
      const p=CB.project(e), size=p.scale*e.size;
      return {left:p.x-1.45*size,right:p.x+1.45*size,top:p.y-1.9*size,bottom:p.y+1.2*size,p};
     });
     moved ||= boxes.some((b,j)=>Math.abs(b.p.x-before[j].x)>1);
     ok(boxes.every(b=>b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=height&&b.p.y<=CB.clampAim(b.p.x,height).y),'pancartes visibles et à portée de visée');
     ok(boxes.every((a,j)=>boxes.slice(j+1).every(b=>a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)),'pancartes distinctes pendant le mouvement');
    }
    ok(moved,'les pancartes se déplacent');
    w.enemies=[];w.panels=null;
   }
   ok(w.missions[0].target===Math.ceil(w.brigandsTotal*.65),'mission calculée sur le total de brigands');
  }
 }
 CB.setView(960,640);
 for(const shape of ['M','ML','H','U','P','O','ovale','Z'])ok(shapes.has(shape),'tracé réellement joué : '+shape);
 ok(counts.size===4&&depths.size>12,'plusieurs nombres de panneaux et profondeurs');
 const w=make(0,CB.WORLDS[0].extra2.vi);
 w.intro=0;w.spawnRound();
 for(let i=0;i<9;i++)w.update(.05);
 const bad=w.panels.find(e=>e.def.bad);
 w.aim=CB.project(bad);w.fire();
 for(let i=0;i<24;i++)w.update(.02);
 ok(w.brigandsHit===1&&w.civilsHit===0,'un vrai tir peut toucher le brigand mobile rapidement');
}
{
 const wi=CB.WORLDS.findIndex(world=>world.id==='pirates');
 const w=make(wi,0);
 w.pickCard(1); w.fire();
 ok(w.balls.length===2 && w.balls[0].x!==w.balls[1].x,'chaque salve part de deux canons distincts');
 w.cooldown=0;w.startPuzzle('bonneteau');const puzzle=w.puzzle;
 w.fire();w.update(.05);
 ok(w.balls.length===1 && puzzle.time<puzzle.duration,'un seul tir neutre et chrono actif pendant l’observation');
 const p=S.blank('eliott'), boss=make(wi,9,p);
 ok(!S.cardAllowed(p,'filet'),'Filet de pêche verrouillé avant le boss');
 boss.pickCard(0);boss.finish(false,'abandon');CB.claim(p,boss);
 ok(!S.cardAllowed(p,'filet'),'abandon sans déblocage ni prime de pêche');
 const victory=make(wi,9,p);victory.pickCard(0);victory.finish(true);CB.claim(p,victory);
 ok(S.cardAllowed(p,'filet')&&victory.fisherGold===4*CB.FISHER_REWARD,'victoire pirate : filet débloqué et prime de pêche');
 const wave=make(0,1,p);wave.intro=0;wave.random=()=>.25;
 CB.CARDS.filet.apply(wave.stats,wave,3);
 const target=wave.spawnEnemy('bat',{x:0,y:7,z:45}), near=wave.spawnEnemy('owl',{x:6,y:7,z:45}), far=wave.spawnEnemy('owl',{x:18,y:7,z:45});
 wave.hitEnemy(target,{dmg:0,z:45});
 ok(near.netted===3 && !far.netted && wave.bursts.some(b=>b.kind==='fishingNet'),'niveau III : 30 % de chance, filet de trois secondes et portée locale');
 wave.update(.05);
 ok(near.z===45 && far.z<45,'le filet arrête la progression des ennemis pris');
 for(let i=0;i<61;i++)wave.update(.05);
 ok(!near.netted && near.z<45,'les ennemis reprennent leur mouvement');
}
{
 const forest=CB.WORLDS[0], p=S.blank('eliott');
 for(const node of [forest.sniper,forest.comboTrial]){
  ok(!S.waveUnlocked(p,0,node.vi),'défi caché au départ');
  (p.progress.foret ||= [])[node.from]=1;
  ok(S.waveUnlocked(p,0,node.vi)&&CB.Map.neighbors(0,node.from).includes(node.vi),'défi accessible depuis son tableau parent');
 }
 const miss=make(0,forest.sniper.vi);miss.intro=0;miss.update(.05);miss.aim={x:16,y:16};
 for(let i=0;i<4;i++){
  ok(miss.fire(),'un tir de précision');
  for(let frame=0;frame<14&&!miss.over;frame++)miss.update(.05);
  ok(miss.sniperMisses===i+1&&miss.over===(i===3),'trois ratés permis, le quatrième arrête');
 }
 for(const [width,height] of [[320,568],[568,320]]){
  CB.setView(width,height);
  const sniper=make(0,forest.sniper.vi);sniper.intro=0;
  for(let i=0;i<sniper.def.goal;i++){
   sniper.update(.05);
   const target=sniper.enemies.find(e=>e.sniper);
   ok(target.z>=76,'la cible est au loin');
   sniper.aim=CB.project(target);ok(sniper.fire(),'tir de snipe disponible');
   for(let frame=0;frame<14&&!sniper.over;frame++)sniper.update(.05);
  }
  ok(sniper.over&&sniper.stars===3&&sniper.sniperMisses===0,'défi parfait réalisable sur petit écran '+[width,sniper.kills,sniper.hits,sniper.sniperMisses,sniper.stars]);
 }
 CB.setView(960,640);
 const combo=make(0,forest.comboTrial.vi);combo.intro=0;
 ok(combo.cardLevel('midas')===1&&combo.stats.splash>0,'le combo de départ est jouable dès le premier tir');
 combo.time=4;combo.update(.05);
 const pumpkin=combo.enemies.find(e=>e.fuseCarrier);
 combo.applyDamage(pumpkin,999);
 ok(combo.fusesHit===1&&combo.kills>1,'la citrouille dorée déclenche une réaction en chaîne');
 const dragon=make(0,9);dragon.intro=0;dragon.spawnBoss();
 const boss=dragon.boss;boss.intro=null;boss.arrived=true;
 ok(!dragon.canDodge&&boss.hp<CB.BOSSES.batking.hp*CB.BOSS_HP,'Dragon plus court sans déplacement gratuit');
 p.gold=CB.movementCost(p.cannon);
 ok(S.buyMovement(p)&&make(0,9,p).canDodge,'le déplacement acheté au hangar fonctionne contre le Dragon');
 dragon.applyDamage(boss,boss.maxHp*.4);
 ok(boss.act===1&&boss.powers.includes('faisceau'),'phase deux avec des attaques différentes');
 for(let i=0;i<30;i++)dragon.update(.05);
 ok(!boss.retreat,'transition du Dragon terminée en moins de 1,5 seconde');
 boss.arrived=true;boss.powerIndex=boss.powers.indexOf('faisceau');boss.boltTimer=0;
 dragon.update(.05);
 ok(!dragon.beam&&dragon.enemies.filter(e=>e.type==='bolt').length>=3,'le Dragon remplace le faisceau par des tirs destructibles si le canon ne se déplace pas');
}
for(const [key,e] of Object.entries(CB.ENEMIES))if(e.spit)ok(!!CB.ENEMIES[e.spit.type],'projectile '+key);
{
 const p=S.blank('eliott');p.campaignAccess.bonbons=true;
 const wi=CB.WORLDS.findIndex(w=>w.id==='bonbons'),w=make(wi,2,p);
 w.targetsHit=3;w.finish(false,'detruit');CB.claim(p,w);
 ok(p.targetDiscoveries.bonbons===3&&!p.targetsHit,'discoveries separated');
 ok(S.waveUnlocked(p,wi,CB.WORLDS[wi].extra.vi),'candy mini discovered');
 ok(!S.waveUnlocked(p,0,CB.WORLDS[0].extra.vi),'forest mini stays locked');
}
{
 const p=S.blank('eliott'),wi=CB.WORLDS.findIndex(w=>w.id==='chaos');
 ok(!S.worldUnlocked(p,wi),'chaos locked');p.stageFinished['espace-10']=true;
 ok(S.worldUnlocked(p,wi),'space boss opens chaos');
 const w=make(wi,9,p),b=w.spawnBoss();
 ok(b.act===0&&b.powers===b.def.powers[0],'boss phase one');
 b.retreat=null;w.applyDamage(b,b.maxHp*.35,false);
 ok(b.act===1&&b.powers===b.def.powers[1],'boss phase two');
 b.retreat=null;w.applyDamage(b,b.maxHp*.35,false);
 ok(b.act===2&&b.powers===b.def.powers[2],'boss phase three');
 for(const power of b.def.powers.flat())w.bossAttack(b,power);
 ok(w.enemies.some(e=>e.chaosGlyph)&&w.enemies.some(e=>e.paintShot),'letters and paint attacks');
 b.retreat=null;w.applyDamage(b,b.maxHp,false);const reward=CB.claim(p,w);
 ok(w.over&&w.eventFinished&&S.worldDone(p,wi)&&!reward.newWorld,'final victory recorded');
 ok(CB.nextMainWorld(wi)===-1,'final world');
}
{
 const p=S.blank('eliott');delete p.campaignVersion;p.gold=12345;
 p.progress={foret:[3,2,1,3,3,2,1,2,3],volcan:[3,3,3,3,3]};
 p.stageOpen={'foret-4':true,'foret-5':true};p.stageFinished={'foret-5':true};p.missionStars={'foret-4':{fin:true}};p.last={wi:0,vi:8};
 const storage={data:JSON.stringify({profiles:{eliott:p}}),getItem(){return this.data;},setItem(k,v){this.data=v;}};
 const q=S.load(storage).profiles.eliott;
 ok(q.gold===12345&&q.progress.foret[9]===3&&q.progress.foret[13]===3,'gold boss boat migrated');
 ok(q.stageFinished['foret-10']&&q.missionStars['foret-9'].fin&&q.last.vi===13,'keys migrated');
 ok(S.worldUnlocked(q,5),'old space access preserved');
 S.store({profiles:{eliott:q}},storage);
 const r=S.load(storage).profiles.eliott;
 assert.deepEqual(r.progress,q.progress);checks++;
 ok(r.last.vi===13&&r.campaignVersion===2,'migration idempotent');
}
console.log('✔ '+checks+' vérifications de la campagne étendue réussies');
