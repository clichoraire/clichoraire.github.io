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
    hex: { name: 'Malédiction', icon: '🔮', kind: 'instant', color: '#cb95fa', desc: 'Ralentit toute l’équipe adverse pendant 6 secondes.' },
    venom: { name: 'Éclaboussure de venin', icon: '🧪', kind: 'instant', color: '#a5e34c', desc: 'Inflige 3 dégâts et ralentit tous les adversaires pendant 3 secondes.' },
    screech: { name: 'Cri strident', icon: '🪽', kind: 'instant', color: '#e9a8e4', desc: 'Étourdit toute l’équipe adverse pendant 0,9 seconde.' },
    rootcry: { name: 'Hurlement des racines', icon: '🌱', kind: 'instant', color: '#b9e573', desc: 'Étourdit toute l’équipe adverse pendant 1,8 seconde.' },
  });
  BC.MONSTER_TEAMS = species.map(([id,name,singular,color,size,values,power,place,biome,description], index) => {
    const court = 'monster-' + id;
    const palette = { forest:['#385643','#304b3c','#162d34'], swamp:['#3e5c59','#36504e','#182f40'], crypt:['#514d65','#464158','#211f38'], rock:['#695756','#5d4c4b','#302e43'] }[biome];
    BC.COURTS[court] = { name:place, floor:palette[0], floor2:palette[1], sky:palette[2], line:'#e2d9a2', monster:true, biome, accent:color };
    const players = Array.from({length:6}, (_,i) => {
      const pid = 'monster-' + id + '-' + (i+1);
      BC.PLAYERS[pid] = { id:pid, name:singular + ' ' + (i+1), monster:id, age:0, number:i+1, role:'monstre', size:size*(i===0?1.06:1), power,
        stats:Object.fromEntries(BC.STAT_KEYS.map((k,j)=>[k,values[j]])), look:{skin:color,hair:'#29333f',hairStyle:'short'}, description };
      return pid;
    });
    return { id:court, species:id, name, short:['GOBLINS','LÉZARDS','SORCIÈRES','SQUELETTES','ORQUES','HARPIES','BÊTES','SLIMES','SPECTRES','TROLLS','GNOLLS','RACINES'][index], initial:String(index+1), color, color2:'#fff2cf', dark:'#202733', court, players, description, stage:index+1 };
  });
})(window.BC);
