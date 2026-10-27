// Campagne d'aventure : six adversaires par espèce, séparés des familles jouables.
(function (BC) {
  'use strict';
  const species = [
    ['goblin','Les Goblins','Goblin','#88b84b',.72,[9,4,5,4],'zoom','Clairière des embuscades','forest','Petits, rapides et sournois : attention à leurs accélérations.'],
    ['lizard','Les Lézards-hommes','Lézard','#38ac97',.96,[8,6,6,6],'zoom','Marécage des écailles','swamp','Des gardiens agiles qui courent vite et lancent fort.'],
    ['witch','Les Sorcières','Sorcière','#b293df',.92,[6,6,8,5],'hex','Marais des potions','swamp','Leurs malédictions ralentissent toute ton équipe.'],
    ['skeleton','Les Squelettes guerriers','Squelette','#e9e1bd',.96,[6,8,6,7],'boulet','Cour des ossements','crypt','Des guerriers en armure aux lancers lourds et puissants.'],
    ['orc','Les Orques berserkers','Orque','#67914a',1.16,[5,10,4,9],'cri','Arène des berserkers','rock','Leur cri de rage renforce les lancers de toute la horde.'],
    ['harpy','Les Harpies','Harpie','#dc9bc3',.92,[10,6,7,5],'screech','Falaises du grand vent','rock','Des créatures ailées dont les cris étourdissent les héros.'],
    ['beast','Les Hommes-bêtes','Homme-bête','#987862',1.05,[9,9,6,8],'tornade','Forêt des crocs','forest','Des loups farouches et leurs ballons tourbillonnants.'],
    ['slime','Les Slimes venimeux','Slime','#a5e34c',.85,[5,7,8,9],'venom','Bassins toxiques','swamp','Des gélatines qui éclaboussent l’équipe de venin et se fragmentent sous les coups.'],
    ['specter','Les Spectres des ombres','Spectre','#a8a5ea',1.0,[9,7,9,6],'fantome','Sanctuaire des ombres','crypt','Éthérés : leur pouvoir leur permet d’éviter un impact.'],
    ['troll','Les Trolls des cavernes','Troll','#809b93',1.3,[4,10,5,11],'boulet','Cavernes de mousse','rock','Des géants résistants qui régénèrent leur vie pendant le match.'],
    ['gnoll','Les Gnolls','Gnoll','#c49b61',1.0,[9,8,9,8],'cri','Ravin des pillards','rock','Des hyènes rusées qui renforcent leur meute avec un cri de guerre.'],
    ['mandrake','Les Mandragores hurlantes','Mandragore','#c6a774',.88,[7,8,8,10],'rootcry','Jardin des racines','forest','Leur hurlement magique peut étourdir toute ton équipe.'],
  ];
  Object.assign(BC.POWERS, {
    tongue:{name:'Langue grappin',icon:'👅',kind:'instant',color:'#ff87ab',desc:'Sa langue vole le ballon à mi-distance. Écarte-toi de sa trajectoire !'},
    camouflage:{name:'Camouflage d’embuscade',icon:'🦎',kind:'instant',color:'#83dcb8',desc:'Presque invisible pendant 4 secondes à faible vitesse. Il réapparaît en préparant son tir.'},
    venomshot:{name:'Éclaboussure de venin',icon:'☠️',kind:'throw',color:'#a7f34e',desc:'Un ballon empoisonné inflige 3 dégâts et ralentit pendant 3 secondes. Sa flaque est aussi dangereuse !'},
    carapace:{name:'Carapace réflexe',icon:'🛡️',kind:'instant',color:'#89b1df',desc:'Pendant 1,5 seconde, renvoie le ballon vers son lanceur à deux fois sa vitesse !'},
    molt:{name:'Mue foudroyante',icon:'🦎',kind:'passive',color:'#d9c5ff',desc:'Évite un coup fatal grâce à une fausse mue, puis court 50 % plus vite pendant 2,5 secondes. Recharge : 15 secondes.'},
    coldregency:{name:'Régence du Sang-Froid',icon:'☀️',kind:'instant',color:'#ffe378',desc:'Attire le ballon libre et protège sa meute pendant 5 secondes. Son prochain tir solaire traverse les obstacles, ricoche et peut mettre K.-O. !'},
    boneboomerang:{name:'Os boomerang',icon:'🦴',kind:'throw',color:'#fff0bd',desc:'Un os tournoyant traverse le terrain puis revient au lanceur. Tu peux l’attraper ou l’esquiver !'},
    ribwall:{name:'Barricade osseuse',icon:'🦴',kind:'instant',color:'#eee0b0',desc:'Des côtes géantes bloquent ou dévient les ballons pendant 6 secondes. Contourne le mur !'},
    scatter:{name:'Éparpillement',icon:'💀',kind:'passive',color:'#d5efd4',desc:'Se défait en tas d’os pour éviter un ballon, puis se reforme. Recharge : 8 secondes.'},
    skullbomb:{name:'Crâne explosif',icon:'💀',kind:'throw',color:'#ffb86b',desc:'Son crâne explose au contact ! S’il tombe au sol, tu as 1,5 seconde pour sortir du cercle.'},
    bonehand:{name:'Main baladeuse',icon:'🦴',kind:'instant',color:'#b4f5dc',desc:'Une main-grappin vole le ballon au sol ou dans tes mains. Éloigne-toi de la main !'},
    marrow:{name:'Marque de moelle',icon:'🦴',kind:'instant',color:'#bbdfad',desc:'Saute par-dessus l’onde osseuse ! Ses mains ralentissent de moitié pendant 4 secondes.'},
    goblinbomb:{name:'Bombe gobline',icon:'💣',kind:'throw',color:'#ffb34e',desc:'Le ballon devient une bombe impossible à attraper. Saute ou esquive : au contact, elle explose !'},
    locusts:{name:'Invasion de sauterelles',icon:'🦗',kind:'throw',color:'#a5ec55',desc:'Un ballon normal libère 20 sauterelles qui traversent le camp adverse. Chaque sauterelle touchée enlève 1 PV. Saute pour les éviter !'},
    fireball:{name:'Ballon en feu',icon:'🔥',kind:'throw',color:'#ff752d',desc:'Attrapable, mais le contact brûle : 4 PV perdus en 4 secondes, même après un attrapé.'},
    icepatch:{name:'Patinoire piégée',icon:'🧊',kind:'instant',color:'#99eaff',desc:'Des plaques de glace restent 15 secondes dans le camp adverse : elles ralentissent et font glisser. Courir dessus avec le ballon fait tomber et lâcher la balle.'},
    blindness:{name:'Nuit gobline',icon:'🌑',kind:'throw',color:'#7761bc',desc:'Au lancer, le camp adverse est plongé dans une obscurité presque totale pendant 10 secondes.'},
    hex: { name: 'Malédiction', icon: '🔮', kind: 'instant', color: '#cb95fa', desc: 'Ralentit toute l’équipe adverse pendant 6 secondes.' },
    venom: { name: 'Éclaboussure de venin', icon: '🧪', kind: 'instant', color: '#a5e34c', desc: 'Inflige 3 dégâts et ralentit tous les adversaires pendant 3 secondes.' },
    screech: { name: 'Cri strident', icon: '🪽', kind: 'instant', color: '#e9a8e4', desc: 'Étourdit toute l’équipe adverse pendant 0,9 seconde.' },
    rootcry: { name: 'Hurlement des racines', icon: '🌱', kind: 'instant', color: '#b9e573', desc: 'Étourdit toute l’équipe adverse pendant 1,8 seconde.' },
  });
  const kits={goblin:['goblinbomb','locusts','fireball','icepatch','cri','blindness'],lizard:['tongue','camouflage','venomshot','carapace','molt','coldregency'],witch:['hex','bulles','blizzard','biscuit','aimant','teleport'],skeleton:['boneboomerang','ribwall','scatter','skullbomb','bonehand','marrow'],orc:['cri','boulet','fusee','zoom','tornade','screech'],harpy:['screech','tornade','zoom','blizzard','teleport','biscuit'],beast:['tornade','cri','zoom','boulet','biscuit','fantome'],slime:['venom','bulles','aimant','biscuit','hex','fantome'],specter:['fantome','hex','teleport','blizzard','aimant','tornade'],troll:['boulet','cri','rootcry','biscuit','venom','fusee'],gnoll:['cri','zoom','aimant','fusee','tornade','biscuit'],mandrake:['rootcry','hex','venom','bulles','blizzard','biscuit']};
  BC.MONSTER_TEAMS = species.map(([id,name,singular,color,size,values,power,place,biome,description], index) => {
    const court = 'monster-' + id;
    const palette = { forest:['#385643','#304b3c','#162d34'], swamp:['#3e5c59','#36504e','#182f40'], crypt:['#514d65','#464158','#211f38'], rock:['#695756','#5d4c4b','#302e43'] }[biome];
    BC.COURTS[court] = { name:place, floor:palette[0], floor2:palette[1], sky:palette[2], line:'#e2d9a2', monster:true, biome, accent:color };
    const players = Array.from({length:6}, (_,i) => {
      const pid = 'monster-' + id + '-' + (i+1);
      BC.PLAYERS[pid] = { id:pid, name:singular + ' ' + (i+1), monster:id, portraitVariant:i, encounterLevel:1+index*2, age:0, number:i+1, role:'monstre', size:size*(i===0?1.06:1), power:kits[id][i],
        stats:Object.fromEntries(BC.STAT_KEYS.map((k,j)=>[k,k==='precision'?6:values[j]])), look:{skin:color,hair:'#29333f',hairStyle:'short'}, description };
      return pid;
    });
    return { id:court, species:id, name, short:['GOBLINS','LÉZARDS','SORCIÈRES','SQUELETTES','ORQUES','HARPIES','BÊTES','SLIMES','SPECTRES','TROLLS','GNOLLS','RACINES'][index], initial:String(index+1), color, color2:'#fff2cf', dark:'#202733', court, players, description, stage:index+1 };
  });
  Object.assign(BC.POWERS,{
    anvil:{name:'Pluie d’enclumes',icon:'⚒️',kind:'instant',color:'#c5d9ed',desc:'Pendant 10 secondes, des enclumes tombent sur les positions marquées au sol. Chaque impact inflige 8 dégâts ; le boss continue de lancer !'},
    bossmeteor:{name:'Météore brûlant',icon:'☄️',kind:'throw',color:'#ff7738',desc:'Un tir massif, très rapide, à attraper avec un timing précis.'},
    bossstorm:{name:'Orage du titan',icon:'⚡',kind:'throw',color:'#74e7ff',desc:'Une balle électrique qui accélère brutalement.'},
    bossshadow:{name:'Éclipse',icon:'🌘',kind:'throw',color:'#c18aff',desc:'Un tir d’ombre qui serpente et ralentit sa victime.'}
  });
  BC.BOSS_TEAMS=[['troll','Brise-Montagne'],['witch','La Reine des maléfices'],['orc','Gorak le Colosse'],['specter','Le Roi du néant']].map(([species,name],i)=>{
    const base=BC.MONSTER_TEAMS.find(t=>t.species===species),id='boss-'+species,pid=id+'-1',original=BC.PLAYERS[base.players[0]];
    BC.PLAYERS[pid]={...original,id:pid,name,boss:true,size:3.6,bossHp:[150,250,400,600][i],encounterLevel:7+i*6,stats:{speed:6+i,power:16,catch:10,hp:18,precision:10},power:'bossmeteor',bossPowers:i%2?['bossshadow','bossstorm','bossmeteor']:['bossmeteor','bossstorm','bossshadow']};
    return {...base,id,name,short:'BOSS',boss:true,players:[pid],description:'Un colosse solitaire. Trois tirs spéciaux redoutables !'};
  });

  BC.MONSTER_LEVEL_BONUSES=[0,5,10,22,35];
  BC.MONSTER_STAT_BONUSES=[0,2,4,8,14];
  BC.monsterLevel=(pid,difficulty=0)=>(BC.PLAYERS[pid].encounterLevel||1)+BC.MONSTER_LEVEL_BONUSES[difficulty];
  BC.monsterStats=(pid,difficulty=0)=>{const d=BC.PLAYERS[pid],bonus=BC.MONSTER_STAT_BONUSES[difficulty];return {...Object.fromEntries(BC.STAT_KEYS.map(k=>[k,Math.min(BC.MAX_STAT,(d.stats[k]??6)+bonus)])),lifeBonus:d.boss?0:Math.max(0,BC.MONSTER_LEVEL_BONUSES[difficulty]-10)*2};};
  // Les renforts ont leurs propres identifiants ; les trois extérieurs restent en place.
  for(const team of BC.MONSTER_TEAMS)for(let i=0;i<2;i++){const source=BC.PLAYERS[team.players[i+3]],id='monster-'+team.species+'-'+(7+i);BC.PLAYERS[id]={...source,id,name:source.name.replace(/\d+$/,String(7+i)),number:7+i,reinforcement:true};}
  BC.monsterRoster=(team,difficulty=0)=>{if(!team.species)return team;const base=[...BC.MONSTER_TEAMS,...BC.BOSS_TEAMS].find(t=>t.id===team.id)||team,extra=[0,0,1,1,2][difficulty],reinforcements=Array.from({length:extra},(_,i)=>'monster-'+team.species+'-'+(7+i)),innerCount=(team.boss?1:3)+extra;return {...base,players:team.boss?[...base.players,...reinforcements]:[...base.players.slice(0,3),...reinforcements,...base.players.slice(3)],innerCount};};
})(window.BC);
