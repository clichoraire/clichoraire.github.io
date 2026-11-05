// Campagne étendue. Les indices des mondes existants restent stables pour les sauvegardes.
(function(CB){
  'use strict';
  const S=CB.Save, M=CB.Missions, clone=o=>JSON.parse(JSON.stringify(o));
  const oldWorlds=CB.WORLDS.slice(), legacy=CB.waveDef;
  const originals=oldWorlds.map((w,wi)=>Array.from({length:CB.wavesOf(wi)},(_,vi)=>legacy(wi,vi)));
  const enemy=(name,hp,speed,color,extra={})=>({name,hp,speed,size:1.3,damage:8,gold:2,color,variant:{name:name+' étoilé',color:'#ffe17b'},...extra});
  Object.assign(CB.ENEMIES,{
    bonbonAile:enemy('Bonbon rouge ailé',2,5,'#f84d70',{flying:true}),
    papillonJujube:enemy('Papillon en jujube',3,5.5,'#b695ff',{flying:true}),
    oursonJujube:enemy('Ourson en jujube',6,4,'#ffae42'),
    guimauve:enemy('Guimauve nuage',4,3.8,'#fff3f8'),
    smore:enemy('S’more farceur',9,4,'#ae7045'),
    fleurSucree:enemy('Fleur de sucre',7,4.5,'#ff84bd',{heal:{every:7,amount:2,radius:12}}),
    lettreFolle:enemy('Lettre à l’envers',3,5,'#ffe264',{chaotic:true}),
    tachePeinture:enemy('Éclaboussure vivante',5,5,'#fc5cae',{chaotic:true}),
    poissonParapluie:enemy('Poisson parapluie',7,4,'#55e9dd',{chaotic:true}),
    montagneFolle:enemy('Montagne qui rigole',10,3.8,'#bf8cff',{chaotic:true}),
    oeilChaos:enemy('Œil du n’importe quoi',12,4.2,'#ffc86b',{chaotic:true,spit:{type:'boulet',first:5,every:5}})
  });
  CB.BOSSES.roiGuimauve={...CB.BOSSES.bigghost,name:'Le Roi Guimauve',hp:1350,color:'#ffb8df',minion:'bonbonAile',powers:[['bolt','eventail'],['salve','bombe'],['mur','pluie','eventail']]};
  CB.BOSSES.chaosFinal={...CB.BOSSES.destroyer,name:'LE GRAND N’IMPORTE QUOI',hp:1900,color:'#ff5bc8',minion:'lettreFolle',every:7,phaseNames:['GRIBOUILLIS VIVANT','TEMPÊTE DE LETTRES','SOLEIL DE PEINTURE'],powers:[['gribouillis','eventail','bolt'],['alphabet','mur','bombe'],['peinture','faisceau','triple','alphabet']]};
  CB.WORLDS.push(
    {id:'bonbons',name:'Les Nuages de bonbons',short:'Bonbons',tier:4.7,scene:'bonbons',enemies:['bonbonAile','guimauve','papillonJujube','oursonJujube','smore','fleurSucree'],boss:'roiGuimauve',cannon:'sucre',sky:['#82b9f7','#e6b9ee','#fff0de'],ground:'#d89ed8',accent:'#ffd8ee',icon:'🍬'},
    {id:'chaos',name:'Le Monde du CHAOS',short:'CHAOS',tier:6.5,scene:'chaos',enemies:['lettreFolle','tachePeinture','poissonParapluie','montagneFolle','oeilChaos'],boss:'chaosFinal',cannon:'chaotique',sky:['#25144e','#71468b','#ed9cba'],ground:'#453165',accent:'#6fffe2',icon:'🌀'}
  );
  CB.CANNONS.sucre={...clone(CB.CANNONS.confetti),tier:6,armor:80,world:'bonbons',name:'Canon guimauve',price:26000,body:'#ff93ce',trim:'#fff4db',base:'#a59aff',desc:'Une pluie de confettis sucrés !'};
  CB.CANNONS.chaotique={...clone(CB.CANNONS.jumeau),tier:7,armor:90,world:'chaos',name:'Canon du CHAOS',price:38000,body:'#d366ff',trim:'#73ffde',base:'#ffcb54',desc:'Deux tubes pour semer la pagaille !'};
  const order=['foret','manoir','foire','ruche','volcan','bonbons','espace','chaos'];
  CB.mainWorlds=()=>order.map(id=>CB.WORLDS.findIndex(w=>w.id===id));
  CB.mainWorldNumber=wi=>order.indexOf(CB.WORLDS[wi].id)+1;
  CB.nextMainWorld=wi=>CB.mainWorlds().includes(wi)?(CB.mainWorlds()[CB.mainWorlds().indexOf(wi)+1]??-1):-1;
  CB.previousMainWorld=wi=>CB.mainWorlds()[CB.mainWorlds().indexOf(wi)-1]??-1;
  CB.WAVES_PER_WORLD=10;
  CB.oldStageToNew=vi=>vi<3?vi:vi===3?8:vi===4?9:vi+5;
  CB.WORLDS.forEach(w=>{
    const oldSecret=w.secret, oldBoat=w.extra3;
    if(oldSecret)w.secret={vi:10,from:oldSecret.from};
    let next=oldSecret?11:10;
    w.extra={vi:next++,from:2};w.extra2={vi:next++,from:6};
    if(oldBoat)w.extra3={vi:next++,from:1};
    if (w.id === 'foret') {
      w.sniper = { vi: next++, from: 4, icon: '🎯', label: 'SNIPE', pos: [720, 555] };
      w.comboTrial = { vi: next++, from: 7, icon: '💥', label: 'COMBO', pos: [540, 180] };
    }
    if(w.gate!=null)w.gate=w.id==='foret'?w.extra3.vi:w.secret.vi;
    w.stageCount=10;w.mapCount=next;
  });
  CB.wavesOf=wi=>CB.WORLDS[wi]?.mapCount||10;
  const task=(id,kind,target,text,extra={})=>({id,kind,target,text,...extra});
  const titles={
    foret:['Les Premiers Pas','Les bois hantés','La clairière des costauds','Le verger farceur','Les ombres du sentier','Le bal des citrouilles','La ronde des sorcières','Les gardiens de la forêt','L’ombre du dragon'],
    manoir:['Le vestibule','Les tableaux hantés','Le grenier des cibles','La bibliothèque interdite','La cuisine fantôme','Le bal des spectres','Les invités masqués','La tour des horloges','La porte qui murmure'],
    foire:['Les premiers ballons','Le manège volant','Le stand des cibles','La parade des couleurs','Les jongleurs','Les gros lots','Le stand des brigands','Les acrobates','La dernière parade'],
    ruche:['Les fleurs dorées','Le jardin bourdonnant','Le pollen des cibles','La rivière de miel','Les gardiennes','La danse des ailes','Le tribunal des abeilles','Les alvéoles géantes','La garde royale'],
    volcan:['Le sentier des braises','Les pierres chaudes','Les cibles de lave','Le pont des étincelles','Le lac de feu','La grotte rouge','Les masques de cendre','Les dragons de pierre','Au bord du cratère'],
    espace:['Décollage','Les météorites','La station des cibles','Le champ de satellites','La lune violette','Les visiteurs','Les imposteurs cosmiques','La flotte des étoiles','Aux portes de l’infini'],
    bonbons:['Le nuage vanille','Les ailes de fraise','Les sucettes volantes','Le jardin en jujube','La colline des oursons','Le pont de chocolat','Le bal des bonbons','La vallée des s’mores','Le palais guimauve'],
    chaos:['Bonjour à l’envers','Les lettres sans mots','Les cibles impossibles','La montagne qui flotte','La pluie qui remonte','Le poisson sans eau','Qui est gentil ici ?','La peinture en folie','Le calme… OU PAS !']
  };
  const campaign=[];
  CB.WORLDS.forEach((w,wi)=>{
    const tier=Math.floor(CB.tierOf(wi)), old=originals[wi]; const defs=[];
    for(let vi=0;vi<10;vi++){
      let d;
      if(old && (vi<3||vi>=8)) d=clone(old[vi>=8?vi-5:vi]);
      else {
        const roster=[...new Set(w.enemies)].filter(k=>!CB.ENEMIES[k].shot&&!CB.ENEMIES[k].hazard&&!CB.ENEMIES[k].ship);
        const easy=roster.slice(0,2), available=roster.slice(0,Math.min(roster.length,3+Math.floor(vi/2)));
        // Rotation des adversaires secondaires : chaque étape a son propre bestiaire.
        if(vi>2 && roster.length>4) available.splice(2,available.length-2,...roster.slice(2).filter((_,i)=>(i+vi)%3!==0));
        d={type:'survive',seconds:180+vi*10+tier*5,density:1.1+vi*.08,roster:available,progressiveRoster:available,opening:{cards:2,every:1.8,maxAlive:4,easy,speed:.65,straight:true},strongRoster:available.slice(2),maxAlive:12,ramp:{every:50,hp:.18,speed:.025},scene:w.scene,boat:w.boat,dodge:w.dodge};
      }
      d.world=wi;d.index=vi;d.name=titles[w.id]?.[vi]|| (vi===9?CB.BOSSES[w.boss].name:w.short+' · '+['Éclaireurs','Première vague','Les cibles','Le détour','La patrouille','Les renforts','Les masques','La grande marche','La dernière garde'][vi]);
      if(vi===9) {d={world:wi,index:vi,type:'boss',name:CB.BOSSES[w.boss].name,text:'Le boss t’attend !',density:1.3,scene:w.scene,boat:w.boat,...(old?clone(old[4]):{})};d.index=vi;}
      if(wi!==0 && vi<9 && ['kill','killTimed'].includes(d.type)){d.type='survive';d.seconds=180+vi*15+tier*5;}
      if(vi===2){d.targets={kills:[12,25,40]};}
      if(vi===6)d.brigandPreview=true;
      if(!d.custom && vi<9 && !(wi===0&&vi<3) && !d.dragonOutro){
        const list=d.roster||w.enemies, species=list[Math.min(list.length-1,2+vi%3)], n=12+tier*2;
        const variations=[
          [task('monstres','kills',70+tier*10,'Repousser '+(70+tier*10)+' monstres'),task('combo','combo',15,'Atteindre un combo de 15'),task('coffres','boxes',2,'Ouvrir 2 boîtes bonus')],
          [task('espece','killType',n,'Vaincre '+n+' '+CB.ENEMIES[species].name,{enemy:species}),task('pouvoirs','special',2,'Utiliser 2 attaques spéciales'),task('niveau','runLevel',5,'Atteindre le niveau 5')],
          [task('monstres','kills',90+tier*10,'Repousser '+(90+tier*10)+' monstres'),task('bombes','bombsDefused',3,'Désamorcer 3 bombes'),task('fin','finish',1,'Terminer le tableau')],
          [task('espece','killType',n,'Vaincre '+n+' '+CB.ENEMIES[species].name,{enemy:species}),task('combo','combo',25,'Atteindre un combo de 25'),task('coffres','boxes',3,'Ouvrir 3 boîtes bonus')],
          [task('elites','elites',3,'Vaincre 3 élites'),task('niveau','runLevel',6,'Atteindre le niveau 6'),task('pouvoirs','special',3,'Utiliser 3 attaques spéciales')]
        ];
        d.missions=variations[(vi+wi)%variations.length];d.text='Trois missions, trois étoiles !';
      }
      defs.push(d);
    }
    if(w.secret)defs[w.secret.vi]=clone(old[5]);
    if(w.extra3)defs[w.extra3.vi]=clone(old[8]);
    const targetCount=30+tier*4, rounds=12+tier*2;
    defs[w.extra.vi]={type:'cibles',minigame:true,name:'Les cibles · '+w.short,text:'Vise les cibles ailées !',density:1,cibles:{count:targetCount,every:[Math.max(.9,2.2-tier*.13),Math.max(.5,1.1-tier*.07)],speed:[3+tier*.45,4.6+tier*.55],move:tier>3?'zigzag':'vagues',medals:[.5,.75,.9,1]},missions:[task('cibles','targets',Math.ceil(targetCount*.65),'Toucher '+Math.ceil(targetCount*.65)+' cibles'),task('fin','quickTargets',5+tier,'Toucher rapidement '+(5+tier)+' cibles'),task('precision','noMissTargets',1,'Ne rater aucune cible')]};
    const brigandBads = tier >= 3 ? 2 : 1, brigandGoal = Math.ceil(rounds * brigandBads * .65);
    const alphabet = ['Z','U','O','M','H','L','P','V','ovale','W','ML'];
    // Chaque monde introduit les formes dans un ordre différent, après trois manches en translation.
    const start = tier === 0 ? 0 : wi % alphabet.length;
    const letters = [...alphabet.slice(start), ...alphabet.slice(0, start)];
    if (tier === 0) letters.splice(5);
    defs[w.extra2.vi]={type:'brigands',minigame:true,name:'Brigands et gentils · '+w.short,text:'Vise les brigands, protège les gentils !',density:1,brigands:{rounds,show:[3.15-tier*.05,Math.max(2.05,2.55-tier*.08)],gap:Math.max(.4,.9-tier*.05),bads:brigandBads,choreography:{tier,letters,palette:wi},medals:[.5,.75,.9,1]},missions:[task('brigands','brigands',brigandGoal,'Attraper '+brigandGoal+' brigands'),task('fin','quickBrigands',3+tier,'Attraper rapidement '+(3+tier)+' brigands'),task('civils','noCivil',1,'Protéger tous les gentils')]};
    if (w.sniper) {
      defs[w.sniper.vi] = {
        type: 'kill', minigame: true, sniper: true, goal: 12, density: 1,
        name: 'Snipe à l’horizon', text: 'Abats 12 monstres au loin. Au 4e boulet raté, le défi s’arrête.',
        missions: [task('fin','finish',1,'Abattre les 12 monstres'), task('precision','sniperClean',1,'Terminer avec au plus un raté'), task('parfait','sniperPerfect',1,'Terminer sans rater un boulet')]
      };
      defs[w.comboTrial.vi] = {
        type: 'kill', minigame: true, comboTrial: true, goal: 32, density: 1.75, maxAlive: 11,
        name: 'La mèche de Midas', text: 'Commence avec Midas explosif. Vise les citrouilles dorées pour déclencher des réactions en chaîne.',
        roster: ['bat','owl','pumpkin','ghost'],
        missions: [task('fin','finish',1,'Repousser 32 monstres'), task('meches','fuses',4,'Faire exploser 4 citrouilles dorées'), task('combo','combo',8,'Atteindre un combo de 8')]
      };
      defs[9].redDragon = true;
    }
    defs.forEach((d,vi)=>{
      d.world=wi;d.index=vi;
      if (w.id === 'pirates') { d.pirateCrew = true; d.boat = true; }
    });campaign.push(defs);
  });
  CB.waveDef=(wi,vi)=>{const d=campaign[wi]?.[vi];if(!d)throw Error('Tableau inconnu '+wi+'/'+vi);return clone(d);};
  S.nextWave=p=>{for(const wi of CB.mainWorlds())for(let vi=0;vi<10;vi++)if(S.waveUnlocked(p,wi,vi)&&!S.stars(p,CB.WORLDS[wi].id,vi))return {wi,vi};return {wi:CB.mainWorlds().at(-1),vi:9};};
  S.stageStarRequirement=(vi,wi=0)=>[0,2,4,7,9,12,14,17,20,23][vi]??0;
  S.worldUnlocked=(p,wi)=>{const w=CB.WORLDS[wi];if(!w)return false;if(w.hidden)return S.hiddenOpen(p,w.id);return !!p.campaignAccess?.[w.id]||wi===0||S.worldDone(p,CB.previousMainWorld(wi));};
  
  S.waveUnlocked=(p,wi,vi)=>{
    const w=CB.WORLDS[wi];if(!w||!S.worldUnlocked(p,wi))return false;
    if(vi<10)return vi===0||!!p.stageOpen?.[M.key(wi,vi)];
    if(vi===w.extra.vi)return !!p.stageOpen?.[M.key(wi,vi)]||(p.targetDiscoveries?.[w.id]|| (wi===0?p.targetsHit:0)||0)>=3;
    if(vi===w.extra2.vi)return !!p.stageOpen?.[M.key(wi,vi)]||S.stars(p,w.id,w.extra2.from)>0;
    for (const node of [w.sniper, w.comboTrial]) {
      if (node?.vi === vi) return S.stars(p, w.id, node.from) > 0;
    }
    if(vi===w.secret?.vi)return S.portalFound(p,w.id);
    return vi===w.extra3?.vi && !!p.boatSecret;
  };
  const missionTick=M.tick;
  M.tick=(w,dt)=>{
    missionTick(w,dt);
    if(w.def.brigandPreview&&!w.previewShown&&w.time>=45&&!w.over&&!w.choice){
      w.previewShown=true;
      for(let i=0;i<3;i++){const e=w.spawnEnemy(i===1?'brigand':'civil',{x:(i-1)*11,y:4,z:35});e.panel={life:6,age:0,up:0,rise:.35};e.look=i%2;}
      w.news.push({kind:'discovery',text:'VISE LE BRIGAND, PROTÈGE LES GENTILS !',time:w.time});
    }
  };
  const attack=CB.Wave.prototype.bossAttack;
  CB.Wave.prototype.bossAttack=function(b,power,inSalvo=false){
    if(!['gribouillis','alphabet','peinture'].includes(power))return attack.call(this,b,power,inSalvo);
    const count=power==='peinture'?8:5;
    for(let i=0;i<count;i++){
      // Des tirs visibles et destructibles : la pagaille reste esquivable.
      const a=i*Math.PI*2/count,spread=power==='peinture'?Math.cos(a)*10:(i-(count-1)/2)*4;
      const e=this.spawnEnemy('bolt',{x:b.x+spread,y:b.y+(power==='peinture'?Math.sin(a)*5:Math.sin(i)*2),z:b.z-2});
      if(e){e.tx=this.px+spread;e.color=['#ff6abc','#ffe36a','#6fffe2'][i%3];e.chaosGlyph=power==='alphabet'?['¿','Z','Ж','!','Ω'][i%5]:null;e.paintShot=power!=='alphabet';}
    }
    this.texts.push({text:power==='alphabet'?'Z ? Ω !':power==='peinture'?'SPLATCH !':'GRIBOUILLI !',x:b.x,y:b.y+5,z:b.z,age:0,color:'#ffe36a'});
  };
  const oldClaim=CB.claim;
  CB.claim=(p,w)=>{if(w.over&&!w.claimed&&w.def.targets){p.targetDiscoveries||={};p.targetDiscoveries[w.world.id]=Math.max(p.targetDiscoveries[w.world.id]||0,Math.min(3,w.targetsHit));}return oldClaim(p,w);};
  const blank=S.blank;S.blank=id=>({...blank(id),campaignVersion:2,targetDiscoveries:{},campaignAccess:{}});
  // Migration AVANT le chargement historique : aucun ancien indice ne peut désigner une nouvelle mission.
  const load=S.load;
  S.load=storage=>{
    let raw;try{raw=JSON.parse(storage.getItem(S.KEY)||'null');}catch(_){return load(storage);}
    if(!raw?.profiles)return load(storage);
    for(const p of Object.values(raw.profiles)){
      if(!p||p.campaignVersion>=2)continue;
      p.campaignAccess||={};p.stageOpen||={};p.stageFinished||={};
      for(let wi=0;wi<oldWorlds.length;wi++){
        const id=oldWorlds[wi].id, arr=p.progress?.[id]||[];
        if(wi===0||(!oldWorlds[wi].hidden && (p.progress?.[oldWorlds[wi-1]?.id]?.[4] || p.stageFinished[oldWorlds[wi-1]?.id+'-5'])))p.campaignAccess[id]=true;
        if(arr[4])p.stageFinished[id+'-5']=true;
        // Anciens profils sans missions : conserver leurs accès et leurs étoiles.
        if(!p.missionVersion)for(let vi=1;vi<5;vi++)if(arr[vi]||arr[vi-1])p.stageOpen[id+'-'+(vi+1)]=true;
        if(p.progress?.[id]) {const next=[];arr.forEach((n,i)=>next[CB.oldStageToNew(i)]=n);p.progress[id]=next;}
      }
      for(const field of ['stageOpen','stageFinished','missionStars','stageBestiary']){
        const next={};for(const [key,value] of Object.entries(p[field]||{})){const m=key.match(/^(.*)-(\d+)$/);if(m)next[m[1]+'-'+(CB.oldStageToNew(+m[2]-1)+1)]=value;else next[key]=value;}p[field]=next;
      }
      for(const w of oldWorlds){const last=Math.max(0,...Object.keys(p.stageOpen).filter(k=>k.startsWith(w.id+'-')).map(k=>+k.slice(w.id.length+1)-1).filter(i=>i<10));for(let i=1;i<=last;i++)p.stageOpen[w.id+'-'+(i+1)]=true;}
      if(p.last)p.last.vi=CB.oldStageToNew(p.last.vi||0);
      p.shown=CB.oldStageToNew(p.shown||0);p.missionVersion=1;p.campaignVersion=2;
      if(p.targetsShown)p.stageOpen['foret-12']=true;
      if(p.brigandsShown)p.stageOpen['foret-13']=true;
    }
    return load({getItem:key=>key===S.KEY?JSON.stringify(raw):storage.getItem(key)});
  };
  const oldCheat=S.cheatUnlock;S.cheatUnlock=p=>{oldCheat(p);p.targetDiscoveries||={};CB.WORLDS.forEach(w=>p.targetDiscoveries[w.id]=3);return p;};
  // Carte compacte : dix étapes sur deux rangées, secrets et stands en périphérie.
  CB.Map.nodes=wi=>{const w=CB.WORLDS[wi],points=[[170,485],[295,490],[420,470],[550,475],[680,435],[790,365],[675,315],[550,295],[420,280],[290,255]];if(w.secret)points[w.secret.vi]=[150,365];points[w.extra.vi]=[435,590];points[w.extra2.vi]=[760,215];if(w.extra3)points[w.extra3.vi]=[285,365];for(const node of [w.sniper,w.comboTrial])if(node)points[node.vi]=node.pos;return points;};
  CB.Map.EXIT=[440,175];CB.Map.GATES.foret=[590,165];CB.Map.ENTRY=[70,490];
  // Une étoile au tableau précédent révèle la prochaine étape du chemin principal.
  CB.Map.visible=(wi,p,vi)=>S.waveUnlocked(p,wi,vi) || S.canUnlockStage(p,wi,vi) || (vi>0 && vi<CB.WAVES_PER_WORLD && S.worldUnlocked(p,wi) && S.stars(p,CB.WORLDS[wi].id,vi-1)>0);
})(window.CB);
