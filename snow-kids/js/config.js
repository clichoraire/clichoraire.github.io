// Snow Kids — constantes, personnages, planches, objets et pistes.
// Tout est dans l'espace de noms SK. Fonctionne dans le navigateur et dans Node (tools/headless.js).
window.SK = window.SK || {};
window.SK.VERSION = '1.56';   // à augmenter à chaque mise en ligne (affichée dans le menu)
(function (SK) {
  'use strict';
  SK.W = 1280; SK.H = 720;          // canevas logique
  SK.STEP = 1 / 60;                 // pas de simulation
  SK.SEG = 5;                       // longueur d'un segment de piste (m)
  SK.HURDLE_HEIGHT = 2.4;
  SK.GRAVITY = 18;
  SK.SLOPE = 0.07;                  // pente de base (m de dénivelé par m parcouru)
  SK.LIFT_INTERVAL = 2;             // une chaise de remontée part toutes les 2 s (une place par chaise)
  SK.LIFT_RIDE = 7;                 // durée de la remontée (s)
  SK.SHOT_COST = 1;                 // une boîte (rouge = tir, bleue = objet) coûte 1 pièce d'or si on en a une, sinon elle est gratuite
  SK.COIN_VALUE = 1;                // une pièce d'or ramassée = 1 G
  SK.BOX_RESPAWN = 6;
  SK.DIFFICULTIES = ['Facile', 'Normal', 'Difficile'];
  SK.PRIZES = [50, 30, 20, 10, 5];      // prime de fin de course selon la place
  SK.TROPHY_GOLD = 200;                 // bonus la première fois qu'on gagne une piste de l'aventure (trophée)
  SK.LAPS_CHOICES = [1, 2, 3, 5];
  SK.DEFAULT_LAPS = 3;

  // ------------------------------------------------------------------ personnages (vitesse / virage / accélération / saut / force, 15 points de base par enfant)
  SK.CHARACTERS = [
    // Apparences et dates reprises de HockeyBoisjoli/js/config.js (familles Jo, Bibi et Jay).
    { id: 'zach', gender: 'boy', name: 'Zach', birth: '2007-08-02', family: 'Jo', size: 1.05, speed: 3, corner: 2, acceleration: 2, jump: 3, strength: 5, hairStyle: 'curly', hat: 'none', weight: 3, earbuds: true,
      colors: { jacket: '#d83d36', pants: '#263981', hat: '#2c66b3', hair: '#593c28', skin: '#f0c8a0', board: '#ffb323' },
      desc: 'Famille Jo — Le grand de la bande, rapide sur les longues descentes.' },
    { id: 'eliott', gender: 'boy', name: 'Eliott', birth: '2016-10-06', family: 'Jo', size: 0.78, speed: 3, corner: 3, acceleration: 3, jump: 3, strength: 3, hairStyle: 'short', hat: 'none', weight: 2, cheeks: true, freckles: true,
      colors: { jacket: '#43a047', pants: '#1e3a8a', hat: '#1565c0', hair: '#3b2a1a', skin: '#f0c8a0', board: '#00acc1' },
      desc: 'Famille Jo — Discret comme un fantôme, il se faufile dans les virages.' },
    { id: 'alexie', gender: 'girl', name: 'Alexie', birth: '2014-11-01', family: 'Jo', size: 0.82, speed: 3, corner: 4, acceleration: 3, jump: 3, strength: 2, hairStyle: 'ponytail', hat: 'none', weight: 2, cheeks: true, freckles: true,
      colors: { jacket: '#ec407a', pants: '#8e24aa', hat: '#f8bbd0', hair: '#5a3a22', skin: '#f6d6bd', board: '#ab47bc' },
      desc: 'Famille Jo — Un flash de style et des figures plein les airs !' },
    { id: 'adam', gender: 'boy', name: 'Adam', birth: '2021-09-11', family: 'Bibi', size: 0.6, speed: 5, corner: 4, acceleration: 2, jump: 2, strength: 2, hairStyle: 'spiky', hat: 'none', weight: 2, cheeks: true,
      colors: { jacket: '#fb8c00', pants: '#3949ab', hat: '#1565c0', hair: '#4a2f1b', skin: '#f6d6bd', board: '#e53935' },
      desc: 'Famille Bibi — Zoom-zoom ! Toujours prêt à repartir à toute vitesse.' },
    { id: 'milo', lowPassagePassive: true, gender: 'boy', name: 'Milo', birth: '2024-03-12', family: 'Bibi', size: 0.45, speed: 5, corner: 2, acceleration: 4, jump: 3, strength: 1, hairStyle: 'short', hat: 'none', weight: 1, pacifier: true, cheeks: true,
      colors: { jacket: '#26a69a', pants: '#3949ab', hat: '#ff6b6b', hair: '#6b4a2b', skin: '#f6d6bd', board: '#ffee58' },
      desc: 'Famille Bibi — Petit mais malin ! Milo passe sous les obstacles bas sans se pencher.' },
    { id: 'edison', gender: 'boy', name: 'Edison', birth: '2023-02-08', family: 'Jay', size: 0.5, speed: 2, corner: 4, acceleration: 4, jump: 3, strength: 2, hairStyle: 'curly', hat: 'none', weight: 1, pacifier: true, cheeks: true,
      colors: { jacket: '#1e88e5', pants: '#1e3a8a', hat: '#1565c0', hair: '#2b1d12', skin: '#eec49b', board: '#ffb323' },
      desc: 'Famille Jay — Le champion de la glissade, avec sa chevelure blonde et son grand sourire.' },
    { id: 'shinobin', gender: 'boy', name: 'Ninja', speed: 5, corner: 5, acceleration: 5, jump: 5, strength: 5, hairStyle: 'short', hat: 'hood', weight: 3, age: '?', hidden: true,
      colors: { jacket: '#212121', pants: '#212121', hat: '#212121', hair: '#212121', skin: '#f3c9a3', board: '#b71c1c', scarf: '#d32f2f' },
      desc: 'Le ninja mystérieux qui hante le Pays des Ninjas. Parfait partout. Il faut le battre pour le débloquer.' },
  ];
  for(const [id,name,jacket,skin,unlockItem] of [['santa','Père Noël','#c72e37','#f6d2b5','teteNoel'],['robot','Robot','#7296ac','#b3cad9','teteRobot']]) SK.CHARACTERS.push({id,name,gender:'boy',hidden:true,unlockItem,hat:'none',hairStyle:'bald',speed:3,corner:3,acceleration:3,jump:3,strength:3,weight:3,colors:{jacket,pants:id==='santa'?'#a62029':'#3c526a',hat:jacket,hair:'#ffffff',skin,board:'#efbc45'},desc:'Personnage à débloquer au magasin.'});
  SK.characterUnlocked=(c,save)=>!c.hidden||[save,...Object.values(save.profiles||{})].some(s=>c.id==='shinobin'?s.shinobin||s.gear?.includes('masque'):s.gear?.includes(c.unlockItem));
  SK.LEGACY_CHARACTERS = { slash: 'zach', nancy: 'eliott', jam: 'alexie', linda: 'adam', tommy: 'edison', wendy: 'milo' };
  SK.migrateCharacters = function (save) {
    for (const key of ['char', 'char2', 'advChar']) save[key] = SK.LEGACY_CHARACTERS[save[key]] || save[key];
    if (save.look) for (const [oldId, newId] of Object.entries(SK.LEGACY_CHARACTERS)) {
      if (save.look[oldId] && !save.look[newId]) save.look[newId] = save.look[oldId];
      delete save.look[oldId];
    }
    return save;
  };
  // Habitants adultes du village seulement : ils ne rejoignent pas les Kids jouables.
  SK.VILLAGERS = [
    ['matthieu','Matthieu','boy','#34485e'],['josee','Josée','girl','#9362a6'],
    ['richard','Richard','boy','#647768'],['mickael','Mickael','boy','#267d85'],
    ['marie','Marie','girl','#b65479'],['jeremie','Jérémie','boy','#4262a1'],
    ['jessica','Jessica','girl','#b68b47'],['josue','Josué','boy','#b8463d'],
    ['emily','Émily','girl','#754c94']
  ].map(([id,name,gender,jacket])=>({id,name,gender,adult:true,hat:'none',hairStyle:'short',colors:{jacket,pants:'#344153',hat:'#283449',hair:'#493629',skin:'#f0c8a0',board:'#455a64'}}));
  SK.WORKPLACES = {emily:'shop',marie:'wardrobe',richard:'school',josue:'museum',jeremie:'motifs'};
  SK.PARENTS = {
    zach:['emily','josue'], eliott:['emily','josue'], alexie:['emily','josue'],
    adam:['marie','mickael'], milo:['marie','mickael'], edison:['jeremie','jessica']
  };
  SK.characterScale = id => ({zach:1.16,eliott:1,alexie:1,adam:.85,edison:.85,milo:.66}[id] || 1);
  SK.charById = id => SK.CHARACTERS.find(c => c.id === id);

  // ------------------------------------------------------------------ planches (boutique)
  SK.BOARDS = [
    { id: 'freestyle', name: 'Freestyle', price: 0, speed: 0, corner: 0, acceleration: 0, jump: 0, color: '#4caf50', pattern: 'stripes', desc: 'La planche de départ, équilibrée.' },
    {id:"banane",name:"Banana Board",price:600,speed:0,corner:0,acceleration:0,jump:0,color:"#126e78",pattern:"custom-banana",bananaImmune:true,desc:"Des bananes partout ! Les peaux de banane au sol ne te font jamais glisser."},
    { id: 'fusee', name: 'Fusée', price: 400, speed: 2, corner: -1, acceleration: 0, jump: 0, color: '#e53935', pattern: 'flames', desc: 'Plus rapide, mais elle tourne moins bien.' },
    { id: 'virage', name: 'Virage', price: 400, speed: -1, corner: 2, acceleration: 0, jump: 0, color: '#1e88e5', pattern: 'zigzag', desc: 'Accroche dans les virages, un peu moins rapide.' },
    { id: 'acrobate', name: 'Acrobate', price: 400, speed: -1, corner: 0, acceleration: 2, jump: 0, color: '#fb8c00', pattern: 'stars', desc: 'Repart plus vite après un freinage.' },
    { id: 'kangourou', name: 'Kangourou', price: 400, speed: -1, corner: 0, acceleration: 0, jump: 2, color: '#8d6e63', pattern: 'dots', desc: 'Saute plus haut : plus de temps pour les figures.' },
    { id: 'glacier', name: 'Glacier', price: 700, speed: 1, corner: 1, acceleration: 0, jump: 0, color: '#80deea', pattern: 'ice', desc: 'Rapide et stable sur la glace.', unlock: { wins: 1 } },
    { id: 'comete', name: 'Comète', price: 800, speed: 2, corner: 0, acceleration: 0, jump: 1, color: '#5e35b1', pattern: 'galaxy', desc: 'Vite et haut.', unlock: { wins: 1 } },
    { id: 'tornade', name: 'Tornade', price: 800, speed: 0, corner: 1, acceleration: 2, jump: 0, color: '#26a69a', pattern: 'waves', desc: 'Une reprise vive à la sortie des virages.', unlock: { wins: 2 } },
    { id: 'eclair', name: 'Éclair', price: 900, speed: 3, corner: -1, acceleration: -1, jump: 0, color: '#fdd835', pattern: 'lightning', desc: 'Une flèche. Freine avant les virages !', unlock: { wins: 2 } },
    { id: 'cactus', name: 'Pikachu', price: 850, speed: 0, corner: 2, acceleration: 0, jump: 1, color: '#2459a6', pattern: 'pikachu', desc: 'Pikachu accompagne tes virages et tes sauts.', unlock: { wins: 2 } },
    { id: 'alpine', name: 'Canadiens', price: 1200, speed: 3, corner: -2, acceleration: -1, jump: 0, color: '#af1934', pattern: 'canadiens', desc: 'Une fusée. Pour ceux qui savent freiner.', unlock: { wins: 3 } },
    { id: 'panda', name: 'Panda', price: 1100, speed: 1, corner: 1, acceleration: 1, jump: 1, color: '#eceff1', pattern: 'panda', desc: 'Un peu de tout, en noir et blanc.', unlock: { wins: 3 } },
    { id: 'lave', name: 'Chevaux', price: 1300, speed: 3, corner: 0, acceleration: 0, jump: 1, color: '#87c8bb', pattern: 'horses', desc: 'Des chevaux au galop pour dévaler les pistes.', unlock: { wins: 3 } },
    { id: 'ninja', name: 'Ninja', price: 1500, speed: 1, corner: 3, acceleration: 1, jump: 0, color: '#212121', pattern: 'shuriken', desc: 'Précise comme un shuriken.', unlock: { wins: 4 } },
    { id: 'arcenciel', name: 'Squelettes', price: 1600, speed: 0, corner: 0, acceleration: 3, jump: 2, color: '#22283d', pattern: 'skulls', desc: 'Faite pour voler et tourner.', unlock: { wins: 4 } },
    { id: 'requin', name: 'Requin', price: 1700, speed: 3, corner: 2, acceleration: -1, jump: 0, color: '#1565c0', pattern: 'teeth', desc: 'Rapide et mordante dans les virages.', unlock: { wins: 4 } },
    { id: 'pro', name: 'Emojis', price: 2000, speed: 1, corner: 1, acceleration: 1, jump: 1, color: '#743cd3', pattern: 'emojis', desc: 'Meilleure que la Freestyle en tout.', unlock: { wins: 5 } },
    { id: 'fusee2', name: 'Fusée II', price: 2200, speed: 4, corner: -1, acceleration: 0, jump: 1, color: '#461927', pattern: 'animated-flames', desc: 'Des flammes vivantes et une vitesse de feu.', unlock: { wins: 5 } },
    { id: 'phenix', name: 'Rorschach', price: 2800, speed: 2, corner: 2, acceleration: 2, jump: 1, color: '#eee9dc', pattern: 'animated-ink', desc: 'Des taches d’encre symétriques qui se métamorphosent sans fin.', unlock: { wins: 6 } },
    { id: 'cristal', name: 'Cristal', price: 3200, speed: 2, corner: 3, acceleration: 1, jump: 2, color: '#b3e5fc', pattern: 'crystal', desc: 'Légère et tranchante.', unlock: { wins: 6 } },
    { id: 'dragon', name: 'Dragon', price: 4000, speed: 3, corner: 2, acceleration: 2, jump: 2, color: '#2e7d32', pattern: 'scales', desc: 'La planche des légendes.', unlock: { wins: 7 } },
    { id: 'doree', name: 'Dorée', price: 5000, speed: 3, corner: 3, acceleration: 3, jump: 3, color: '#ffd600', pattern: 'gold', desc: 'La planche des champions. Hors de prix.', unlock: { wins: 8 } },
    { id: 'trophee-bronze', name: 'Bronze', secret: true, price: 0, speed: 4, corner: 3, acceleration: 3, jump: 3, color: '#b97842', pattern: 'medal', desc: 'La récompense des podiums de tous les tournois.', unlock: { cupRank: 3 } },
    { id: 'trophee-argent', name: 'Argent', secret: true, price: 0, speed: 4, corner: 4, acceleration: 3, jump: 4, color: '#b9d0df', pattern: 'medal', desc: 'Une lame d’argent pour les grands champions.', unlock: { cupRank: 2 } },
    { id: 'trophee-or', name: 'Or', secret: true, price: 0, speed: 5, corner: 4, acceleration: 4, jump: 4, color: '#ffd044', pattern: 'medal', desc: 'La couronne des vainqueurs de tous les tournois.', unlock: { cupRank: 1 } },
    { id: 'trophee-diamant', name: 'Diamant', secret: true, price: 0, speed: 5, corner: 5, acceleration: 5, jump: 5, color: '#a2efff', pattern: 'diamond', desc: 'Le trésor ultime du vainqueur du boss final.', unlock: { finalBoss: true } },
  ];

  SK.boardById = id => SK.BOARDS.find(b => b.id === id) || SK.BOARDS[0];
  SK.BOARD_SKIN_PRICE = 50;
  SK.BOARD_MOTIFS = [
    ['electric','Énergie électrique','#10172d',true,'Des arcs bleu fluo qui crépitent sur un fond sombre.'],
    ['molten','Lave en fusion','#19191c',true,'Des fissures de lave incandescente qui pulsent doucement.'],
    ['synthwave','Néon synthwave','#180c36',true,'Une grille rose et turquoise qui défile sans fin.'],
    ['cosmic','Galaxie','#120f30',true,'Des étoiles scintillantes et une comète de passage.'],
    ['snow-shark','Requin des neiges','#91d9e8',false,'Une grande gueule de requin et des yeux qui suivent tes virages.'],
    ['reptile','Dragon','#255143',false,'Des écailles et deux yeux de reptile lumineux.'],
    ['fossil','Fossile de T-Rex','#493b35',false,'Un squelette de dinosaure incrusté dans la roche.'],
    ['claws','Griffes de bête','#99643e',false,'De grandes griffures traversent le bois.'],
    ['polar','Glace polaire','#7dcde3',false,'Une glace bleutée aux bulles d’air emprisonnées.'],
    ['timber','Bois rustique','#cca46a',false,'Écorce de bouleau et nœuds de bois.'],
    ['circuit','Circuit robot','#102b25',true,'Des pistes dorées et des LED qui clignotent.'],
    ['carbon','Carbone et métal','#303942',false,'Fibre de carbone et métal brossé, esprit course.']
  ].map(([id,name,color,animated,desc])=>({id:'motif-'+id,name,color,pattern:'custom-'+id,animated,price:animated?350:200,desc}));
  // Échange des dessins seulement : identifiants, prix et caractéristiques conservés.
  for(const [boardId,motifId,name,desc] of [
    ['cristal','motif-cosmic','Cristaux précieux','Des facettes de cristal bleu.'],
    ['eclair','motif-reptile','Éclair jaune','Un grand éclair jaune sur la planche.'],
    ['doree','motif-synthwave','Dorures','Le motif doré des champions.'],
    ['dragon','motif-electric','Écailles vertes','Les écailles de la planche Dragon.'],
    ['glacier','motif-polar','Cristaux de glace','De grands cristaux bleus sur la planche.'],
    ['requin','motif-snow-shark','Dents de requin','Des dents acérées sur fond bleu.']
  ]){const board=SK.boardById(boardId),motif=SK.BOARD_MOTIFS.find(m=>m.id===motifId),old={pattern:board.pattern,color:board.color};board.pattern=motif.pattern;board.color=motif.color;Object.assign(motif,old,{name,desc,animated:false});}
  SK.skinById=id=>SK.BOARD_MOTIFS.find(b=>b.id===id)||SK.BOARDS.find(b=>b.id===id);
  SK.ownsBoardSkin=(save,id)=>SK.BOARDS.some(b=>b.id===id)?!!save.boards?.includes(id):SK.BOARD_MOTIFS.some(b=>b.id===id)&&!!save.ownedSkins?.includes(id);
  SK.availableBoardSkins=save=>[...SK.BOARDS,...SK.BOARD_MOTIFS].filter(b=>SK.ownsBoardSkin(save,b.id));
  SK.buyBoardMotif=function(save,id){
    const motif=SK.BOARD_MOTIFS.find(m=>m.id===id);if(!motif)return 'invalid';
    if(SK.ownsBoardSkin(save,id))return 'owned';if(!(save.gold>=motif.price))return 'poor';
    save.gold-=motif.price;(save.ownedSkins ||= []).push(id);return 'bought';
  };
  SK.boardSkin = function(id,save){
    const skin=save?.boardSkins?.[id];
    return skin && save.boards?.includes(id) && SK.ownsBoardSkin(save,skin) ? SK.skinById(skin) : SK.boardById(id);
  };
  SK.changeBoardSkin = function(save,id,skinId){
    if(!SK.BOARDS.some(b=>b.id===id)||!save.boards?.includes(id)||!SK.ownsBoardSkin(save,skinId))return 'locked';
    if(SK.boardSkin(id,save).id===skinId)return 'unchanged';
    if(!(save.gold>=SK.BOARD_SKIN_PRICE))return 'poor';
    save.gold-=SK.BOARD_SKIN_PRICE;(save.boardSkins ||= {})[id]=skinId;return 'changed';
  };
  // Articles de la boutique autres que les planches (achat unique, effet permanent en course)
  SK.isGoggles=id=>['lunettesNeige','lunettesForet','lunettesMiroir','lunettesTricolores','lunettes'].includes(id);
  SK.drawGoggles=function(c,id,x,y,s,view='front'){
    const palette=id==='lunettesForet'?['#143e2e','#b4e7b6','#43865d','#21503b']:id==='lunettesTricolores'?['#ffffff','#174bba','#fafcff','#d52a44']:id==='lunettesMiroir'?['#33353e','#ffe973','#f8a655','#d36cbd']:['#eef6ff','#a2ccf4','#647cbd','#5d62a5'];
    c.save();c.translate(x,y);c.scale(s,s);
    c.strokeStyle=id==='lunettesTricolores'?'#ca233d':'#303b48';c.lineWidth=.15;c.lineCap='round';
    if(view==='back'){c.beginPath();c.moveTo(-1,0);c.quadraticCurveTo(0,.23,1,0);c.stroke();c.fillStyle='#71829a';c.fillRect(-.18,-.035,.36,.16);c.restore();return;}
    if(view==='side'){
      c.beginPath();c.moveTo(-1,0);c.lineTo(.38,0);c.stroke();
      // Un seul verre de profil, avec la monture du côté de la tempe.
      c.translate(.34,0);c.fillStyle=palette[0];
      const lens=()=>{c.beginPath();c.moveTo(0,-.34);c.quadraticCurveTo(.28,-.42,.63,-.28);c.lineTo(.57,.04);c.lineTo(.47,.32);c.quadraticCurveTo(.18,.44,.03,.21);c.closePath();};
      lens();c.fill();c.save();lens();c.clip();const g=c.createLinearGradient(0,0,.63,0);g.addColorStop(0,palette[1]);g.addColorStop(1,palette[3]);c.fillStyle=g;c.fill();lens();c.strokeStyle=palette[0];c.lineWidth=.11;c.lineJoin='round';c.stroke();c.restore();
      c.strokeStyle='#ffffff88';c.lineWidth=.05;c.beginPath();c.moveTo(.16,-.23);c.lineTo(.12,.10);c.stroke();c.restore();return;
    }
    else{c.beginPath();c.moveTo(-1.15,0);c.lineTo(1.15,0);c.stroke();}
    const outline=()=>{c.beginPath();c.moveTo(-.95,-.37);c.bezierCurveTo(-.50,-.50,.50,-.50,.95,-.37);c.bezierCurveTo(1.03,-.22,1.02,.28,.76,.39);c.bezierCurveTo(.43,.50,.26,.25,.12,.09);c.quadraticCurveTo(0,-.06,-.12,.09);c.bezierCurveTo(-.26,.25,-.43,.50,-.76,.39);c.bezierCurveTo(-1.02,.28,-1.03,-.22,-.95,-.37);c.closePath();};
    outline();c.fillStyle=palette[0];c.fill();c.strokeStyle='#263545';c.lineWidth=.025;c.stroke();
    c.save();outline();c.clip();const g=c.createLinearGradient(-1,0,1,0);g.addColorStop(0,palette[1]);g.addColorStop(.45,palette[2]);g.addColorStop(1,palette[3]);c.fillStyle=g;c.fill();c.clip();c.strokeStyle='#ffffff77';c.lineWidth=.13;c.beginPath();c.moveTo(-.5,-.5);c.lineTo(-.72,.5);c.stroke();
    // Bordure intérieure continue, épaisseur uniforme jusque dans le creux du nez.
    outline();c.strokeStyle=palette[0];c.lineWidth=.15;c.lineJoin='round';c.stroke();c.restore();
    outline();c.strokeStyle='#263545';c.lineWidth=.025;c.stroke();c.restore();
  };
  SK.HELMETS={casque:'#afc7df',casqueForet:'#315b53',casqueCorail:'#db756a',casqueNoir:'#46515c',casqueAero:'#42a9cc'};
  SK.isHelmet=id=>Object.prototype.hasOwnProperty.call(SK.HELMETS,id);
  SK.GEAR = [
    {id:"aerosolBanane",cat:"gadget",rank:1,name:"Aérosol anti-banane",price:450,desc:"Achat permanent : 33 % de chances d’éviter chaque peau de banane. Toujours actif !"},
    {id:'pelle',cat:'equip',rank:1,name:'Pelle aux trésors',price:180,desc:'Un achat permanent pour pelleter les tas de neige du village et découvrir des pièces d’or. Réutilisable chaque jour.'},
    {id:'lunettesNeige',cat:'equip',name:'Lunettes bleutées',price:250,desc:'Moins de neige dans le visage.'},
    {id:'lunettesForet',cat:'equip',name:'Lunettes forêt',price:250,desc:'Moins de neige dans le visage.'},
    {id:'lunettesMiroir',cat:'equip',name:'Lunettes miroir intégrales',price:950,unlock:{wins:3},desc:'Fini la neige au visage.'},
    {id:'lunettesTricolores',cat:'equip',name:'Lunettes tricolores intégrales',price:950,unlock:{wins:3},desc:'Fini la neige au visage.'},
    ...Object.entries({casque:'bleu glacier',casqueForet:'vert forêt',casqueCorail:'corail',casqueNoir:'anthracite'}).map(([id,color])=>({id,cat:'equip',name:'Casque '+color,price:300,desc:'Absorbe la première chute : léger ralentissement, puis le casque s’envole ! Revient à la prochaine course.'})),
    { id: 'gants', cat: 'equip', name: 'Gants de pro', price: 400, unlock: { wins: 1 }, desc: 'Les figures s\'exécutent 10 % plus vite : plus de pièces par saut.' },
    { id: 'bottes', cat: 'equip', name: 'Bottes à crampons', price: 500, unlock: { wins: 2 }, desc: 'Plus d\'accroche : +10 % en virage, même sur la glace.' },
    { id: 'lunettes', cat: 'equip', name: 'Lunettes anti-pluie', price: 350, unlock: { wins: 3 }, desc: 'Le nuage et le parachute durent moitié moins longtemps sur toi.' },
    { id: 'veste', cat: 'equip', name: 'Veste rembourrée', price: 300, unlock: { wins: 4 }, desc: 'Les murs te ralentissent beaucoup moins.' },
    { id: 'portemonnaie', cat: 'gadget', name: 'Porte-monnaie', price: 600, desc: 'Tu commences chaque course avec 5 pièces d\'or dans les poches.' },
    { id: 'aimant', cat: 'gadget', name: 'Aimant à pièces', price: 550, unlock: { wins: 2 }, desc: 'Les pièces viennent à toi de plus loin.' },
    { id: 'fusee', cat: 'gadget', name: 'Sac à dos fusée', price: 800, unlock: { wins: 4 }, desc: 'Un sac à dos propulseur à porter : un turbo automatique au GO.' },
    { id: 'sac', cat: 'gadget', name: 'Cadeau de Noël', price: 700, unlock: { wins: 5 }, desc: 'Tu commences chaque course avec un objet au hasard.' },
    { id: 'vip', cat: 'other', name: 'Carte VIP du télésiège', price: 900, unlock: { wins: 3 }, desc: 'Ta chaise monte 1,5 seconde plus vite que les autres.' },
    { id: 'masque', cat: 'other', name: 'Masque de ninja', price: 5000, unlock: { course: 'ninja' }, desc: 'Débloque Ninja, un personnage dont le visage reste toujours masqué.' },
  ];
  SK.drawShovel=function(c,x,y,s,angle=0){
    c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);c.lineJoin='round';
    c.strokeStyle='#825533';c.lineWidth=.075;c.beginPath();c.moveTo(0,-.65);c.lineTo(0,.48);c.stroke();c.strokeStyle='#d8a96c';c.lineWidth=.025;c.beginPath();c.moveTo(-.02,-.59);c.lineTo(-.02,.43);c.stroke();
    c.fillStyle='#254759';c.beginPath();c.roundRect(-.16,-.86,.32,.25,.08);c.fill();c.fillStyle='#9bd4e8';c.beginPath();c.roundRect(-.09,-.81,.18,.12,.035);c.fill();
    const g=c.createLinearGradient(-.24,.4,.24,.8);g.addColorStop(0,'#9be8ff');g.addColorStop(.5,'#35a6ce');g.addColorStop(1,'#246488');c.fillStyle=g;c.strokeStyle='#203f58';c.lineWidth=.035;c.beginPath();c.moveTo(-.22,.36);c.lineTo(.22,.36);c.lineTo(.25,.73);c.quadraticCurveTo(0,.94,-.25,.73);c.closePath();c.fill();c.stroke();c.strokeStyle='#e0f8ff';c.lineWidth=.02;c.beginPath();c.moveTo(-.18,.43);c.lineTo(-.16,.71);c.quadraticCurveTo(0,.83,.17,.7);c.stroke();c.restore();
  };
  SK.gearById = id => SK.GEAR.find(g => g.id === id);
  // Garde-robe : vêtements et coiffure (achat unique, puis équipé par personnage dans save.look[charId])
  SK.JACKET_STYLES={
    '#d91d32':{style:'neck-stripes',neck:true,main:'#d91d32',panel:'#304579',trim:'#233353'},
    '#41ad4e':{style:'neck-geo',neck:true,main:'#41ad4e',panel:'#ffe049',trim:'#29462e'},
    '#c83087':{style:'neck-rose',neck:true,main:'#c83087',panel:'#863889',trim:'#652757'},
    '#df3030':{style:'tricolore',main:'#df3030',panel:'#f4f6ef',trim:'#202d53',lower:'#304676'},
    '#49ad45':{style:'geometrique',main:'#49ad45',panel:'#ffe044',trim:'#233d30'},
    '#673dc2':{style:'cosmos',main:'#673dc2',panel:'#72efc8',trim:'#29204e',wacky:true},
    '#17b8bf':{style:'canards',main:'#17b8bf',panel:'#ffdc42',trim:'#14505a',wacky:true},
    '#2459a6':{style:'pikachu',main:'#2459a6',panel:'#ffde39',trim:'#172b51',wacky:true},
    '#af1934':{style:'canadiens',main:'#af1934',panel:'#ffffff',trim:'#15366b',wacky:true},
    '#ed7043':{style:'pizza',main:'#ed7043',panel:'#ffe070',trim:'#712a36',wacky:true},
    '#ed438b':{style:'rose',main:'#ed438b',panel:'#8f3d91',trim:'#352b3b'}
  };
  SK.jacketPalette = color => SK.JACKET_STYLES[color] || ({main:color, panel:['#1e88e5','#8e24aa'].includes(color)?'#299e91':color==='#fb8c00'?'#374f5b':'#344b60', trim:'#293747'});
  // Shared embroidered motifs, used on the displayed coat and articulated sleeves.
  SK.drawCoatMotif=function(c,style,x,y,size){
    c.save();c.translate(x,y);c.scale(size,size);
    const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
    if(style==='cosmos'){
      c.strokeStyle='#ffde70';c.lineWidth=.16;c.beginPath();c.ellipse(0,0,1.05,.32,-.35,0,Math.PI*2);c.stroke();
      oval(0,0,.65,.61,'#72efc8');oval(-.23,-.10,.19,.24,'white');oval(.23,-.10,.19,.24,'white');
      oval(-.20,-.07,.08,.13,'#29204e');oval(.26,-.07,.08,.13,'#29204e');
      c.strokeStyle='#29204e';c.lineWidth=.10;c.beginPath();c.arc(0,.14,.22,0,Math.PI);c.stroke();
    }else if(style==='canards'){
      oval(0,.19,.74,.47,'#ffdc42');oval(.35,-.33,.38,.38,'#ffdc42');
      c.fillStyle='#ff7e2a';c.beginPath();c.moveTo(.64,-.40);c.lineTo(1,-.23);c.lineTo(.61,-.16);c.fill();
      oval(.46,-.41,.07,.08,'#203846');oval(-.17,.18,.30,.18,'#ffb72e');
      c.fillStyle='#f54ba5';c.fillRect(.03,-.12,.58,.14);
    }else if(style==='pikachu'){
      // Long black-tipped ears, yellow face and red cheeks.
      for(const sign of [-1,1]){c.save();c.scale(sign,1);c.fillStyle='#ffdf32';c.beginPath();c.moveTo(.26,-.35);c.lineTo(.45,-1.28);c.quadraticCurveTo(.84,-1.13,.61,-.22);c.fill();c.fillStyle='#202633';c.beginPath();c.moveTo(.45,-1.28);c.quadraticCurveTo(.75,-1.17,.69,-.88);c.lineTo(.39,-.91);c.fill();c.restore();}
      oval(0,.05,.67,.57,'#ffdf32');
      oval(-.26,-.04,.095,.12,'#202633');oval(.26,-.04,.095,.12,'#202633');
      oval(-.29,-.08,.03,.04,'white');oval(.23,-.08,.03,.04,'white');
      oval(-.48,.23,.14,.13,'#ef3d38');oval(.48,.23,.14,.13,'#ef3d38');oval(0,.14,.055,.04,'#202633');
      c.strokeStyle='#202633';c.lineWidth=.045;c.beginPath();c.moveTo(-.18,.29);c.quadraticCurveTo(-.06,.39,0,.29);c.quadraticCurveTo(.08,.39,.18,.29);c.stroke();
    }else if(style==='canadiens'){
      // Embroidered CH crest: red C, white inset and navy outline.
      const crest=()=>{c.beginPath();c.moveTo(.88,-.40);c.bezierCurveTo(.30,-1.02,-1.03,-.66,-1.03,0);c.bezierCurveTo(-1.03,.66,.30,1.02,.88,.40);};
      c.lineCap='butt';crest();c.strokeStyle='#15366b';c.lineWidth=.55;c.stroke();
      crest();c.strokeStyle='#fff';c.lineWidth=.39;c.stroke();
      crest();c.strokeStyle='#c7273e';c.lineWidth=.25;c.stroke();
      c.strokeStyle='#15366b';c.lineWidth=.24;c.beginPath();c.moveTo(-.23,-.34);c.lineTo(-.23,.34);c.moveTo(.30,-.34);c.lineTo(.30,.34);c.moveTo(-.23,0);c.lineTo(.30,0);c.stroke();
      c.strokeStyle='white';c.lineWidth=.13;c.stroke();
    }else if(style==='pizza'){
      c.fillStyle='#ffde70';c.beginPath();c.moveTo(-.75,-.65);c.lineTo(.75,-.65);c.lineTo(.1,.88);c.closePath();c.fill();
      c.strokeStyle='#ad5928';c.lineWidth=.22;c.beginPath();c.moveTo(-.75,-.65);c.quadraticCurveTo(0,-.85,.75,-.65);c.stroke();
      oval(-.30,-.26,.18,.17,'#dd324e');oval(.27,.03,.17,.16,'#dd324e');oval(-.03,.43,.12,.12,'#dd324e');
      oval(-.15,-.48,.06,.06,'#3d6547');oval(.43,-.36,.07,.06,'#3d6547');
    }
    c.restore();
  };
  SK.drawJacket=function(c,color,x,y,s,view='front',torsoOnly=false){
        const p=SK.jacketPalette(color);c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='round';c.lineCap='round';
        if(view==='side'){
          // Profil réel tourné vers la droite : dos à gauche, fermeture au bord droit.
          c.beginPath();c.moveTo(-.25,-.83);c.quadraticCurveTo(-.52,-.68,-.48,-.24);c.lineTo(-.46,.94);c.quadraticCurveTo(-.06,1.11,.43,.97);c.lineTo(.39,-.15);c.quadraticCurveTo(.42,-.65,.22,-.82);c.closePath();
          c.fillStyle=p.main;c.fill();c.save();c.clip();
          c.fillStyle=p.panel;c.beginPath();c.moveTo(-.6,-.88);c.lineTo(.45,-.75);c.lineTo(.4,-.30);c.quadraticCurveTo(-.15,-.2,-.55,-.4);c.fill();
          if(p.neck&&p.style==='neck-stripes'){c.fillRect(-.6,.45,1.1,.35);}
          if(p.style==='neck-geo'||p.style==='geometrique'){c.fillStyle=p.trim;c.beginPath();c.moveTo(-.6,-.10);c.lineTo(.45,-.4);c.lineTo(.45,-.13);c.lineTo(-.6,.24);c.fill();c.fillStyle=p.panel;c.beginPath();c.moveTo(-.4,.34);c.lineTo(.4,.13);c.lineTo(.25,.36);c.fill();}
          if(p.wacky)SK.drawCoatMotif(c,p.style,-.13,.24,.24);
          c.fillStyle='#00000016';c.fillRect(-.5,-1,.16,2.1);c.fillStyle=p.trim;c.fillRect(-.5,.94,1,.09);c.restore();
          c.strokeStyle=p.trim;c.lineWidth=.025;c.beginPath();c.moveTo(-.23,-.25);c.quadraticCurveTo(-.18,.3,-.2,.93);c.stroke();
          if(!p.neck){c.beginPath();c.moveTo(.34,-.64);c.lineTo(.40,.96);c.stroke();c.lineWidth=.05;c.beginPath();c.moveTo(.22,.43);c.lineTo(.12,.70);c.stroke();}
          c.fillStyle=p.neck?p.main:p.panel;c.beginPath();c.moveTo(-.35,-.72);c.quadraticCurveTo(-.55,-.98,-.25,-1.03);c.lineTo(.24,-.96);c.lineTo(.27,-.69);c.quadraticCurveTo(-.05,-.57,-.35,-.72);c.fill();
          if(p.neck){c.strokeStyle=p.trim;c.lineWidth=.025;for(let xx=-.27;xx<.25;xx+=.1){c.beginPath();c.moveTo(xx,-.96);c.quadraticCurveTo(xx-.03,-.8,xx,-.68);c.stroke();}}
          c.restore();return;
        }
        // Silhouette souple : épaules rondes, manches longues, corps évasé.
        const body=()=>{c.beginPath();if(torsoOnly){c.moveTo(-.38,-.83);c.quadraticCurveTo(-.55,-.72,-.52,-.35);c.lineTo(-.55,1);c.quadraticCurveTo(0,1.1,.55,1);c.lineTo(.52,-.35);c.quadraticCurveTo(.55,-.72,.38,-.83);c.closePath();return;}c.moveTo(-.38,-.83);c.bezierCurveTo(-.68,-.83,-.84,-.66,-.90,-.34);c.lineTo(-1,.77);c.quadraticCurveTo(-.91,.88,-.72,.85);c.lineTo(-.55,-.04);c.lineTo(-.57,.91);c.quadraticCurveTo(-.54,1.06,0,1.06);c.quadraticCurveTo(.54,1.06,.57,.91);c.lineTo(.55,-.04);c.lineTo(.72,.85);c.quadraticCurveTo(.91,.88,1,.77);c.lineTo(.90,-.34);c.bezierCurveTo(.84,-.66,.68,-.83,.38,-.83);c.closePath();};
        body();c.fillStyle=p.main;c.fill();c.save();c.clip();
        c.fillStyle=p.panel;c.beginPath();c.moveTo(-.83,-.67);c.quadraticCurveTo(0,-1,.83,-.67);c.lineTo(.68,-.25);c.quadraticCurveTo(0,.04,-.68,-.25);c.closePath();c.fill();
        c.fillStyle='#ffffff18';c.beginPath();c.moveTo(-.6,-.19);c.quadraticCurveTo(0,.06,.6,-.19);c.lineTo(.59,-.08);c.quadraticCurveTo(0,.17,-.59,-.08);c.closePath();c.fill();
        for(const sign of [-1,1]){c.save();c.scale(sign,1);c.fillStyle=p.panel;c.beginPath();c.ellipse(.91,.16,.15,.17,-.4,0,Math.PI*2);c.fill();if(color==='#fb8c00'){c.fillRect(.65,-.38,.4,1.25);}c.restore();}
        if(p.neck){
          c.fillStyle=p.main;c.fillRect(-1.1,-1,2.2,2.2);
          const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();};
          if(p.style==='neck-stripes'){c.fillStyle=p.panel;c.fillRect(-1.1,-.42,2.2,.36);c.fillRect(-1.1,.47,2.2,.40);}
          else if(p.style==='neck-geo'){
            // Crossing yellow triangles, black sash and pale green chevron.
            poly([[.69,-.81],[-1.04,.18],[-.87,.48],[.72,-.43]],'#252c29');
            poly([[-.68,-.79],[.04,-.34],[-.51,-.03]],p.panel);
            poly([[.66,-.73],[.02,-.34],[.53,.02]],p.panel);
            poly([[-.55,.39],[.20,-.04],[.64,.30],[.55,.62],[.19,.23],[-.56,.69]],'#b0e892');
            c.strokeStyle=p.panel;c.lineWidth=.04;c.beginPath();c.moveTo(-.56,.73);c.lineTo(.03,.44);c.lineTo(.56,.74);c.stroke();
            poly([[-1,-.07],[-.67,.27],[-.73,.40],[-1,.20]],p.panel);
            poly([[1,-.07],[.67,.27],[.73,.40],[1,.20]],p.panel);
          }else{
            c.fillStyle=p.panel;c.fillRect(-.64,-.85,1.28,.46);c.strokeStyle='#fff5f5';c.lineWidth=.055;
            for(const y of [-.62,-.40]){c.beginPath();c.moveTo(-.58,y);c.lineTo(0,y+.32);c.lineTo(.58,y);c.stroke();}
            c.lineWidth=.055;c.beginPath();c.moveTo(-.60,.61);for(let i=0;i<4;i++){const x=-.60+i*.30;c.bezierCurveTo(x+.06,.31,x+.27,.37,x+.19,.59);c.bezierCurveTo(x+.13,.76,x+.29,.77,x+.30,.61);}c.stroke();
          }
        }else if(p.style){
          // Same pattern texture is fitted to the moving body and shown in the shop.
          c.fillStyle=p.main;c.fillRect(-1.1,-1,2.2,2.2);
          const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();};
          if(p.wacky){
            for(const [mx,my,mr] of [[-.29,-.42,-.2],[.29,.12,.22],[-.28,.64,.12],[.8,.25,-.3],[-.8,.25,.3]]){c.save();c.translate(mx,my);c.rotate(mr);SK.drawCoatMotif(c,p.style,0,0,.22);c.restore();}
            c.fillStyle=p.panel;for(const [mx,my] of [[.34,-.60],[-.40,.13],[.39,.72]]){c.beginPath();c.arc(mx,my,.035,0,Math.PI*2);c.fill();}
          }else if(p.style==='tricolore'){
            c.fillStyle=p.lower;c.fillRect(-1.1,-.02,2.2,1.2);
            c.fillStyle=p.panel;c.beginPath();c.moveTo(-1.1,-.40);c.quadraticCurveTo(0,-.21,1.1,-.40);c.lineTo(1.1,-.01);c.quadraticCurveTo(0,.16,-1.1,-.01);c.fill();
          }else if(p.style==='geometrique'){
            for(const sign of [-1,1]){c.save();c.scale(sign,1);
              poly([[.13,-.60],[.67,-.84],[.47,-.32]],p.panel);
              poly([[.18,-.21],[.53,-.30],[.48,.13]],p.trim);
              poly([[.14,.15],[.40,-.05],[.43,.23]],p.panel);
              poly([[.65,-.3],[.99,-.04],[.91,.25],[.72,.05]],p.panel);
              poly([[.76,.07],[.91,.18],[.86,.39],[.72,.24]],p.trim);c.restore();}
          }else{
            poly([[-.75,-.85],[.75,-.85],[.64,-.28],[0,-.12],[-.64,-.28]],p.panel);
            c.strokeStyle='#fff4ed';c.lineWidth=.045;c.beginPath();c.moveTo(-.66,-.32);c.lineTo(0,-.16);c.lineTo(.66,-.32);c.stroke();
            for(const sign of [-1,1]){c.save();c.scale(sign,1);poly([[.54,.15],[.30,.34],[.34,1.02],[.62,.99]],p.panel);c.strokeStyle='#fff4ed';c.beginPath();c.moveTo(.52,.19);c.lineTo(.33,.34);c.stroke();c.restore();}
          }
        }
        // Soft fabric light, side seams and separate cuffs: no stripe through the belly.
        const light=c.createLinearGradient(-1,0,1,0);
        light.addColorStop(0,'#14203335');light.addColorStop(.30,'#ffffff12');
        light.addColorStop(.47,'#ffffff22');light.addColorStop(.72,'#00000000');light.addColorStop(1,'#14203338');
        c.fillStyle=light;c.fillRect(-1.1,-1.2,2.2,2.4);
        for(const sign of [-1,1]){c.save();c.scale(sign,1);
          c.strokeStyle='#14203330';c.lineWidth=.025;c.beginPath();c.moveTo(.55,-.34);c.quadraticCurveTo(.46,.12,.51,.91);c.stroke();
          if(!torsoOnly){c.save();c.translate(.86,.78);c.rotate(.16);c.fillStyle=p.trim;c.fillRect(-.16,-.025,.33,.13);
            c.strokeStyle='#ffffff35';c.lineWidth=.012;for(let rx=-.12;rx<.15;rx+=.055){c.beginPath();c.moveTo(rx,0);c.lineTo(rx,.085);c.stroke();}c.restore();}
          c.restore();}
        c.fillStyle=p.trim;c.fillRect(-.58,.96,1.16,.10);
        c.strokeStyle='#ffffff30';c.lineWidth=.014;c.beginPath();c.moveTo(-.52,.98);c.quadraticCurveTo(0,1.03,.52,.98);c.stroke();
        c.restore();body();c.strokeStyle=p.trim;c.lineWidth=.022;c.stroke();
        if(p.neck){
          // A ribbed roll hugging the chin: no visible hollow opening.
          c.fillStyle=p.style==='neck-stripes'?p.panel:p.main;
          const collar=()=>{c.beginPath();c.moveTo(-.35,-.96);c.quadraticCurveTo(-.37,-1.02,-.29,-.99);c.quadraticCurveTo(0,-.89,.29,-.99);c.quadraticCurveTo(.37,-1.02,.35,-.96);c.quadraticCurveTo(.32,-.84,.36,-.73);c.quadraticCurveTo(.39,-.67,.30,-.65);c.quadraticCurveTo(0,-.53,-.30,-.65);c.quadraticCurveTo(-.39,-.67,-.36,-.73);c.quadraticCurveTo(-.32,-.84,-.35,-.96);c.closePath();};
          collar();c.fill();c.save();c.clip();c.strokeStyle=p.trim;c.lineWidth=.024;
          for(let xx=-.29;xx<.35;xx+=.10){c.beginPath();c.moveTo(xx,-1.04);c.bezierCurveTo(xx-.065,-.91,xx+.065,-.77,xx,-.60);c.stroke();}
          c.restore();collar();c.strokeStyle=p.trim;c.lineWidth=.025;c.stroke();
        }else{
        // Padded hood rim and a lining coordinated with the garment.
        c.fillStyle=p.main;c.strokeStyle=p.trim;c.lineWidth=.025;
        c.beginPath();c.moveTo(-.39,-.65);c.bezierCurveTo(-.65,-.86,-.44,-1.19,0,-1.20);c.bezierCurveTo(.44,-1.19,.65,-.86,.39,-.65);c.quadraticCurveTo(0,-.43,-.39,-.65);c.fill();c.stroke();
        c.fillStyle=p.trim;c.beginPath();c.ellipse(0,-.88,.34,.21,0,0,Math.PI*2);c.fill();
        c.fillStyle=p.panel;c.beginPath();c.moveTo(-.33,-.86);c.quadraticCurveTo(0,-.67,.33,-.86);c.quadraticCurveTo(.26,-.60,0,-.56);c.quadraticCurveTo(-.26,-.60,-.33,-.86);c.fill();
        c.strokeStyle='#ffffff55';c.lineWidth=.025;c.beginPath();c.moveTo(-.40,-.83);c.bezierCurveTo(-.40,-1.18,.40,-1.18,.40,-.83);c.stroke();
        }
        if(!p.neck&&view!=='back'){
          c.strokeStyle=p.trim;c.lineWidth=.055;c.beginPath();c.moveTo(0,-.60);c.lineTo(0,.96);c.stroke();
          c.strokeStyle='#ffffff80';c.lineWidth=.012;c.beginPath();c.moveTo(-.008,-.57);c.lineTo(-.008,.94);c.stroke();
          c.fillStyle='#d9e1df';c.fillRect(-.025,-.51,.05,.095);
          // One inset pocket per side, with a small zipper pull.
          for(const sign of [-1,1]){c.save();c.scale(sign,1);
            c.strokeStyle='#ffffff35';c.lineWidth=.065;c.beginPath();c.moveTo(.27,.43);c.lineTo(.40,.72);c.stroke();
            c.strokeStyle=p.trim;c.lineWidth=.035;c.stroke();c.fillStyle='#d9e1df';c.fillRect(.255,.43,.035,.07);c.restore();}
        }
        c.restore();
  };
  SK.WARDROBE = [];
  [['#e53935', 'rouge'], ['#1e88e5', 'bleu'], ['#43a047', 'vert'], ['#fb8c00', 'orange'], ['#8e24aa', 'violet'], ['#fdd835', 'jaune'], ['#ec407a', 'rose'], ['#212121', 'noir'], ['#ffffff', 'blanc'], ['#00acc1', 'turquoise']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'jacket-' + i, cat: 'linge', slot: 'jacket', name: 'Manteau ' + n, price: i < 3 ? 60 : 120, value: c, desc: 'Manteau ' + n + ' à capuche, avec empiècements contrastés, poches et fermeture éclair. Ajusté à chaque Kid.' }));
  [
    ['tricolore','Manteau Tricolore','#df3030','Rouge, blanc et bleu marine, avec capuche et poches.'],
    ['geometrique','Manteau Éclat vert','#49ad45','Vert et jaune, avec motifs géométriques et fermetures contrastées.'],
    ['rose','Manteau Aurore rose','#ed438b','Rose et violet, avec lignes blanches et poches contrastées.']
  ].forEach(([id,name,value,desc])=>SK.WARDROBE.push({id:'jacket-'+id,cat:'linge',slot:'jacket',name,value,price:220,desc}));
  [
    ['cosmos','Manteau Extraterrestres rigolos','#673dc2','Des planètes aux grands yeux sur un manteau violet cosmique. Même les extraterrestres veulent faire du snow !'],
    ['canards','Manteau Coin-coin givré','#17b8bf','Des canards jaunes en écharpe rose sur fond turquoise. Le roi des canards de la montagne !'],
    ['pikachu','Manteau Pikachu','#2459a6','Des Pikachu jaunes aux joues rouges sur fond bleu, avec des motifs sur le corps et les manches.'],
    ['canadiens','Manteau Canadiens de Montréal','#af1934','Rouge et bleu marine avec les écussons CH des Canadiens de Montréal.'],
    ['pizza','Manteau Pizza-party','#ed7043','Des pointes de pizza au pepperoni partout sur ton manteau orange. Livraison express en bas de la piste !']
  ].forEach(([id,name,value,desc])=>SK.WARDROBE.push({id:'jacket-'+id,cat:'linge',slot:'jacket',name,value,price:220,desc}));
  [['rayures','Col roulé Rayures','#d91d32'],['foret','Col roulé Forêt','#41ad4e'],['framboise','Col roulé Framboise','#c83087']].forEach(([id,name,value])=>SK.WARDROBE.push({id:'turtleneck-'+id,cat:'linge',slot:'jacket',name,value,price:100,desc:'Pull à col roulé en maille, sans capuche ni fermeture éclair. Motifs assortis sur le corps et les manches.'}));
  [['#1e3a8a', 'bleu marine'], ['#212121', 'noir'], ['#8d6e63', 'brun'], ['#e53935', 'rouge'], ['#ffffff', 'blanc'], ['#43a047', 'vert'], ['#7e57c2', 'violet'], ['#fdd835', 'jaune']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'pants-' + i, cat: 'linge', slot: 'pants', name: 'Pantalon de neige ' + n, price: i < 2 ? 50 : 100, value: c, desc: 'Un pantalon de neige ' + n + '.' }));
  SK.DENIM_COLORS=['#426b94','#293b59','#535b65','#a4c1d5','#867d95'];
  SK.DENIM_COLORS.forEach((color,i)=>SK.WARDROBE.push({id:'jeans-'+i,cat:'linge',slot:'pants',value:color,name:'Jeans '+['denim bleu','indigo','charbon','délavé','lavande'][i],price:140,desc:'Jeans en denim, avec coutures et poches contrastées.'}));
  [['beanie-rib','Tuque côtelée'],['beanie-stripes','Tuque rayée'],['beanie-pompom','Tuque à pompon']].forEach(([value,name])=>SK.WARDROBE.push({id:'hat-'+value,cat:'linge',slot:'hat',value,name,price:110,desc:'Tuque en maille. Choisis aussi sa couleur dans la garde-robe.'}));
  [['cap', 'Casquette'], ['beanie', 'Tuque'], ['band', 'Bandeau'], ['none', 'Tête nue']].forEach(([v, n], i) =>
    SK.WARDROBE.push({ id: 'hat-' + v, cat: 'linge', slot: 'hat', name: n, price: v === 'none' ? 0 : 90, value: v, desc: v === 'none' ? 'Cheveux au vent.' : n + ' : se combine avec la couleur de chapeau.' }));
  [['#1565c0', 'bleu'], ['#e53935', 'rouge'], ['#212121', 'noir'], ['#ffffff', 'blanc'], ['#43a047', 'vert'], ['#ff8f00', 'orange'], ['#f8bbd0', 'rose']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'hatColor-' + i, cat: 'linge', slot: 'hatColor', name: 'Chapeau ' + n, price: 40, value: c, desc: 'Couleur du chapeau : ' + n + '.' }));
  [['short', 'Cheveux courts'], ['long', 'Cheveux longs'], ['dreads', 'Dreadlocks'], ['pigtails', 'Couettes'], ['spiky', 'Pics'], ['bald', 'Crâne rasé']].forEach(([v, n]) =>
    SK.WARDROBE.push({ id: 'hair-' + v, cat: 'coiffure', slot: 'hair', name: n, price: 70, value: v, desc: 'Coupe : ' + n.toLowerCase() + '.' }));
  [['#5d3a1a', 'bruns'], ['#fdd835', 'blonds'], ['#212121', 'noirs'], ['#d84315', 'roux'], ['#9e9e9e', 'gris'], ['#1e88e5', 'bleus'], ['#ec407a', 'roses'], ['#43a047', 'verts']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'hairColor-' + i, cat: 'coiffure', slot: 'hairColor', name: 'Cheveux ' + n, price: i < 4 ? 40 : 80, value: c, desc: 'Teinture : cheveux ' + n + '.' }));
  [['#f6d2b5', 'très claire'], ['#f3c9a3', 'claire'], ['#d9a37a', 'dorée'], ['#b07a4a', 'mate'], ['#8d5a3b', 'foncée'], ['#5d3a1f', 'très foncée']].forEach(([c, n], i) =>
    SK.WARDROBE.push({ id: 'skin-' + i, cat: 'coiffure', slot: 'skin', name: 'Peau ' + n, price: 0, value: c, desc: 'Gratuit : chacun sa peau.' }));
  // Coordinated winter collection; the same headwear and coat drawings are used when worn.
  SK.KNIT_STYLES={
    'beanie-glacier':{color:'#365c76',accent:'#d4ebed',pattern:'peaks'},
    'beanie-berry':{color:'#914f73',accent:'#f0d5dc',pattern:'snow'},
    'beanie-pine':{color:'#356c64',accent:'#e9d8ad',pattern:'peaks'},
    'beanie-midnight':{color:'#323c65',accent:'#eac87d',pattern:'stars'}
  };
  for(const [id,name] of [['glacier','Tuque Glacier'],['berry','Tuque Baies givrées'],['pine','Tuque Sapins'],['midnight','Tuque Nuit étoilée']])SK.WARDROBE.push({id:'hat-'+id,cat:'linge',slot:'hat',value:'beanie-'+id,name,price:160,newCollection:true,desc:'Tuque en maille à pompon, motif brodé et revers épais. Couleurs assorties à la collection alpine.'});
  for(const [id,name,color]of [['glacier','Pantalon Glacier','#486d80'],['berry','Pantalon Baies givrées','#825773'],['pine','Pantalon Sapins','#3b6259']])SK.WARDROBE.push({id:'pants-'+id,cat:'linge',slot:'pants',value:color,name,price:160,newCollection:true,desc:'Pantalon de neige aux couleurs douces, avec poches et coutures contrastées.'});
  for(const [id,name,color,panel,trim]of [['glacier','Manteau Glacier','#52788e','#d6e9e7','#293f54'],['berry','Manteau Baies givrées','#995b78','#edd9dd','#53364c'],['pine','Manteau Sapins','#48776c','#eadab5','#293f3c']]){
    SK.JACKET_STYLES[color]={style:'alpine',main:color,panel,trim};
    SK.WARDROBE.push({id:'jacket-'+id,cat:'linge',slot:'jacket',value:color,name,price:260,newCollection:true,desc:'Manteau alpin à empiècements en chevrons, fermeture et poches contrastées. À assortir à sa tuque et son pantalon.'});
  }
  SK.wardrobeById = id => SK.WARDROBE.find(w => w.id === id);
  // One choice must produce the same visible outfit in preview, shop and closet.
  SK.wardrobePatch=function(it,current={}){
    const patch={[it.slot]:it.value};
    if(it.slot==='hat'){
      patch.helmet=false;
      if(SK.KNIT_STYLES[it.value]&&current.hat!==it.value)patch.hatColor=SK.KNIT_STYLES[it.value].color;
    }
    if(it.slot==='hatColor'){
      patch.helmet=false;
      if(!current.hat||current.hat==='none'||current.hat==='hood'||current.hat.startsWith('costume-'))patch.hat='beanie';
    }
    return patch;
  };
  SK.wardrobeEquipped=function(look,it){
    if(look[it.slot]!==it.value)return false;
    if(it.slot==='hat')return !look.helmet;
    if(it.slot==='hatColor')return !look.helmet&&!!look.hat&&look.hat!=='none'&&look.hat!=='hood'&&!look.hat.startsWith('costume-');
    return true;
  };

  // Apparence d'un personnage = ses couleurs d'origine + ce qui est équipé dans save.look[charId]
  // Shared propeller backpack: no flame while displayed or worn at rest.
  SK.drawRocketPack = function(c,x,y,s,view='back') {
    c.save();c.translate(x,y);c.scale(s,s);
    c.lineJoin='round';c.lineCap='round';
    if(view==='front'){
      c.strokeStyle='#304952';c.lineWidth=.17;
      for(const a of [-1,1]){c.beginPath();c.moveTo(a*.55,-.80);c.bezierCurveTo(a*.69,-.63,a*.49,-.22,a*.59,.02);c.quadraticCurveTo(a*.69,.16,a*.84,-.10);c.stroke();}
      c.strokeStyle='#7799a3';c.lineWidth=.055;c.beginPath();c.moveTo(-.58,-.30);c.lineTo(.58,-.30);c.stroke();c.fillStyle='#d6aa59';c.fillRect(-.09,-.36,.18,.12);
      c.restore();return;
    }
    const box=(x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
    box(-.55,-.65,1.1,1.35,.19,'#304952');
    box(-.44,-.55,.88,1.17,.15,'#50818d');
    box(-.40,-.13,.80,.13,.03,'#d6aa59');
    box(-.27,-.78,.54,1.18,.19,'#eef5f6');
    c.fillStyle='#e64141';c.beginPath();c.moveTo(-.27,-.69);c.quadraticCurveTo(-.12,-1.02,0,-1.12);c.quadraticCurveTo(.12,-1.02,.27,-.69);c.closePath();c.fill();
    for(const a of [-1,1]){c.beginPath();c.moveTo(a*.23,.13);c.lineTo(a*.44,.53);c.lineTo(a*.22,.44);c.closePath();c.fill();}
    box(-.20,.39,.40,.25,.05,'#263238');
    c.fillStyle='#47c5eb';c.beginPath();c.arc(0,-.38,.12,0,Math.PI*2);c.fill();
    box(-.49,-.05,.98,.70,.13,'#50818d');box(-.40,.12,.80,.40,.08,'#335f70');box(-.39,.10,.78,.045,.01,'#e9bd6d');c.strokeStyle='#99b7c0';c.lineWidth=.035;c.strokeRect(-.44,-.56,.88,.40);
    c.restore();
  };
  SK.drawWhistle=function(c,x,y,s,necklace=false){
    c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='round';
    if(necklace){c.strokeStyle='#929da5';c.lineWidth=.055;c.beginPath();c.moveTo(-.42,-.05);c.bezierCurveTo(-1.25,-1.40,.95,-1.46,.32,-.02);c.stroke();c.strokeStyle='#dbe1e4';c.lineWidth=.018;c.stroke();}
    c.strokeStyle='#ad7e24';c.lineWidth=.045;const gold=c.createLinearGradient(0,-.2,0,.6);gold.addColorStop(0,'#fff0a0');gold.addColorStop(.42,'#edbd42');gold.addColorStop(1,'#b47c1e');
    c.fillStyle=gold;c.beginPath();c.moveTo(-.5,-.1);c.lineTo(.65,-.1);c.lineTo(.84,.02);c.lineTo(.77,.23);c.lineTo(.12,.23);c.bezierCurveTo(.1,.68,-.68,.69,-.7,.25);c.quadraticCurveTo(-.74,-.03,-.5,-.1);c.fill();c.stroke();
    c.fillStyle='#ffde6a';c.beginPath();c.ellipse(-.32,.25,.23,.24,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#544738';c.fillRect(.27,-.105,.22,.065);c.fillStyle='#fdf1b8';c.fillRect(.1,.02,.57,.045);c.strokeStyle='#c99835';c.lineWidth=.04;c.beginPath();c.ellipse(-.62,-.12,.12,.12,0,0,Math.PI*2);c.stroke();c.restore();
  };
  SK.drawWornTorso=function(c,L,x,y,s,view='front'){
    c.save();c.translate(x,y);c.scale(s,s);const side=view==='side',w=side?.48:.82;
    if(L.paddedVest){
      c.fillStyle='#d74b54';c.beginPath();c.moveTo(-w,-.70);c.lineTo(-w*.45,-.82);c.quadraticCurveTo(0,-.53,w*.45,-.82);c.lineTo(w,-.70);c.lineTo(w,.76);c.quadraticCurveTo(0,.86,-w,.76);c.closePath();c.fill();
      c.strokeStyle='#983547';c.lineWidth=.035;for(const yy of [-.35,0,.35,.67]){c.beginPath();c.moveTo(-w*.9,yy);c.quadraticCurveTo(0,yy+.10,w*.9,yy);c.stroke();}
      if(view!=='back'){c.strokeStyle='#f6c1a5';c.lineWidth=.04;c.beginPath();c.moveTo(side?w*.5:0,-.65);c.lineTo(side?w*.5:0,.76);c.stroke();}
    }
    if(L.whistle&&view!=='back'){
      c.strokeStyle='#a9b2bb';c.lineWidth=.045;c.beginPath();c.moveTo(-w*.58,-.78);c.quadraticCurveTo(-w*.65,-.12,side?w*.7:0,.04);c.quadraticCurveTo(w*.7,-.12,w*.58,-.78);c.stroke();
      const xx=side?w*.55:0;SK.drawWhistle(c,xx,.08,.26);
    }c.restore();
  };
  // Headwear shares the same shape in the shop and on every head angle.
  SK.drawHeadwear=function(c,kind,color,x,y,w,h,view='front',worn=false){
    if(!kind||kind==='none')return;const knit=SK.KNIT_STYLES?.[kind];color=color||knit?.color||'#1565c0';c.save();c.translate(x,y);c.fillStyle=color;
    if(kind==='crown'){
      const g=c.createLinearGradient(-w*.5,0,w*.5,h);g.addColorStop(0,'#b77920');g.addColorStop(.4,'#ffe788');g.addColorStop(.7,'#e7b638');g.addColorStop(1,'#a96e1e');c.fillStyle=g;
      c.beginPath();c.moveTo(-w*.5,h*.55);c.lineTo(-w*.58,-h*.03);c.lineTo(-w*.28,h*.16);c.lineTo(0,-h*.25);c.lineTo(w*.28,h*.16);c.lineTo(w*.58,-h*.03);c.lineTo(w*.5,h*.55);c.closePath();c.fill();c.strokeStyle='#956421';c.lineWidth=w*.025;c.stroke();
      c.fillStyle='#f5d373';c.fillRect(-w*.5,h*.41,w,h*.14);for(const xx of [-.3,0,.3]){c.fillStyle=xx===0?'#d84355':'#43aacc';c.beginPath();c.ellipse(xx*w,h*.38,w*.045,h*.075,0,0,Math.PI*2);c.fill();}c.restore();return;
    }
    if(kind==='band'){c.fillRect(-w*.5,h*.45,w,h*.18);c.restore();return;}
    c.beginPath();c.moveTo(-w*.5,h*.62);c.bezierCurveTo(-w*.5,-h*.18,w*.5,-h*.18,w*.5,h*.62);c.closePath();c.fill();
    if(kind==='cap'){
      c.fillStyle=color;c.beginPath();c.ellipse(view==='side'?w*.42:0,h*.62,view==='side'?w*.42:w*.5,h*.12,0,0,Math.PI*2);c.fill();
      c.strokeStyle='#ffffff44';c.lineWidth=Math.max(1,w*.025);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(w*.12,h*.3,0,h*.6);c.stroke();
    }
    else{
      c.fillStyle=color;c.fillRect(-w*.51,h*.45,w*1.02,h*.23);
      c.strokeStyle='#142c4560';c.lineWidth=Math.max(1,w*.018);
      for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(i*w*.11,h*.46);c.lineTo(i*w*.11,h*.67);c.stroke();}
      // Patterns follow the actual knitted dome, including its curved sides.
      c.save();c.beginPath();c.moveTo(-w*.5,h*.62);c.bezierCurveTo(-w*.5,-h*.18,w*.5,-h*.18,w*.5,h*.62);c.closePath();c.clip();
      const fabric=c.createLinearGradient(-w*.5,0,w*.5,0);fabric.addColorStop(0,'#18304724');fabric.addColorStop(.4,'#ffffff22');fabric.addColorStop(1,'#18304730');c.fillStyle=fabric;c.fillRect(-w*.6,-h*.2,w*1.2,h);
      if(kind==='beanie-stripes'){c.strokeStyle='#f6edcd';c.lineWidth=h*.09;for(const yy of [.22,.36]){c.beginPath();c.moveTo(-w*.44,h*yy);c.quadraticCurveTo(0,h*(yy+.1),w*.44,h*yy);c.stroke();}}
      if(knit){
        c.save();c.beginPath();c.rect(-w*.45,h*.12,w*.9,h*.30);c.clip();
        c.strokeStyle=knit.accent;c.lineWidth=Math.max(1,w*.022);
        for(let i=-3;i<=3;i++){const xx=i*w*.15,yy=h*.28;
          if(knit.pattern==='peaks'){c.beginPath();c.moveTo(xx-w*.07,yy+h*.05);c.lineTo(xx,yy-h*.08);c.lineTo(xx+w*.07,yy+h*.05);c.stroke();}
          else{c.beginPath();c.moveTo(xx-w*.045,yy);c.lineTo(xx+w*.045,yy);c.moveTo(xx,yy-h*.07);c.lineTo(xx,yy+h*.07);if(knit.pattern==='snow'){c.moveTo(xx-w*.032,yy-h*.045);c.lineTo(xx+w*.032,yy+h*.045);c.moveTo(xx+w*.032,yy-h*.045);c.lineTo(xx-w*.032,yy+h*.045);}c.stroke();}
        }c.restore();c.strokeStyle=knit.accent;c.lineWidth=h*.035;c.beginPath();c.moveTo(-w*.45,h*.39);c.lineTo(w*.45,h*.39);c.stroke();
      }
      c.restore();
      if(knit){
        if(view!=='back'){c.save();if(view==='side'){c.translate(w*.34,0);c.scale(.6,1);}
        c.fillStyle=knit.accent;c.beginPath();c.roundRect(-w*.09,h*.49,w*.18,h*.13,w*.025);c.fill();c.strokeStyle=color;c.lineWidth=w*.016;c.beginPath();c.moveTo(-w*.05,h*.59);c.lineTo(0,h*.52);c.lineTo(w*.05,h*.59);c.stroke();c.restore();}

        c.fillStyle=knit.accent;c.beginPath();c.arc(0,worn?h*.05:-h*.06,w*(worn?.085:.14),0,Math.PI*2);c.fill();c.strokeStyle='#ffffff55';c.lineWidth=w*.014;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*w*.04,(worn?h*.05:-h*.06)+Math.sin(a)*w*.04);c.lineTo(Math.cos(a)*w*(worn?.07:.12),(worn?h*.05:-h*.06)+Math.sin(a)*w*(worn?.07:.12));c.stroke();}
      }
      if(kind==='beanie'||kind==='beanie-pompom'){c.fillStyle='#f7f1df';c.beginPath();c.arc(0,worn?h*.05:-h*.06,w*(worn?.085:.14),0,Math.PI*2);c.fill();}
    }c.restore();
  };
  SK.drawPants=function(c,color,x,y,s){
    const denim=SK.DENIM_COLORS.includes(color);c.save();c.translate(x,y);c.scale(s,s);
    const shape=()=>{c.beginPath();c.moveTo(-.56,-.91);c.quadraticCurveTo(0,-.99,.56,-.91);c.quadraticCurveTo(.66,-.64,.61,-.23);c.lineTo(.56,.88);c.quadraticCurveTo(.35,.99,.13,.89);c.lineTo(.07,-.22);c.quadraticCurveTo(0,-.34,-.07,-.22);c.lineTo(-.13,.89);c.quadraticCurveTo(-.35,.99,-.56,.88);c.lineTo(-.61,-.23);c.quadraticCurveTo(-.66,-.64,-.56,-.91);c.closePath();};
    shape();c.fillStyle=color;c.fill();c.save();c.clip();
    const light=c.createLinearGradient(-.65,0,.65,0);light.addColorStop(0,'#16283d50');light.addColorStop(.22,'#ffffff20');light.addColorStop(.5,'#16283d25');light.addColorStop(.75,'#ffffff18');light.addColorStop(1,'#16283d50');c.fillStyle=light;c.fillRect(-.7,-1,1.4,2);
    c.fillStyle='#172c4833';c.fillRect(-.65,-.94,1.3,.16);
    c.strokeStyle=denim?'#d1b78baa':'#ffffff55';c.lineWidth=.018;
    c.beginPath();c.moveTo(-.57,-.78);c.lineTo(.57,-.78);c.moveTo(.04,-.77);c.lineTo(.04,-.41);c.quadraticCurveTo(.04,-.35,-.03,-.35);c.stroke();
    for(const sign of [-1,1]){c.save();c.scale(sign,1);
      c.beginPath();c.moveTo(.50,-.73);c.quadraticCurveTo(.47,-.48,.24,-.46);c.moveTo(.51,-.37);c.lineTo(.47,.76);c.stroke();
      c.fillStyle='#15263b33';c.fillRect(.15,.76,.44,.15);
      c.beginPath();c.moveTo(.17,.79);c.lineTo(.54,.79);c.stroke();
      c.fillStyle='#ffffff28';c.fillRect(.31,-.92,.055,.19);
      if(!denim){c.fillStyle='#172c4820';c.beginPath();c.roundRect(.23,-.09,.27,.33,.035);c.fill();c.strokeStyle='#152b4855';c.beginPath();c.moveTo(.24,-.04);c.lineTo(.49,-.04);c.stroke();c.strokeStyle='#ffffff30';c.beginPath();c.moveTo(.20,.48);c.quadraticCurveTo(.34,.43,.48,.48);c.stroke();}
      c.restore();}
    if(denim){c.strokeStyle='#ffffff12';c.lineWidth=.008;for(let yy=-.7;yy<.74;yy+=.045){c.beginPath();c.moveTo(-.6,yy);c.lineTo(.6,yy+.16);c.stroke();}}
    c.restore();shape();c.strokeStyle='#203347aa';c.lineWidth=.022;c.stroke();
    c.fillStyle='#d7dcd8';c.beginPath();c.arc(0,-.85,.025,0,Math.PI*2);c.fill();c.restore();
  };
  SK.equippedGear=function(save,charId){
    const gear=Object.fromEntries((save.gear||[]).map(id=>[id,true]));
    const look=SK.lookOf(SK.charById(charId||save.advChar||save.char)||SK.CHARACTERS[0],save);
    if(look.helmet!=='couronne')delete gear.couronne;if(!look.springBoots)delete gear.ressort;if(!look.gripBoots)delete gear.bottes;
    for(const [id,slot] of [['veste','paddedVest'],['sifflet','whistle'],['fusee','rocketPack']])if(!look[slot])delete gear[id];
    for(const id of Object.keys(SK.HELMETS))if(look.helmet!==id)delete gear[id];
    delete gear.gants;delete gear.gantsMauves;if(look.gloves)gear.gants=true;
    return gear;
  };
  SK.lookOf = function (def, save) {
    const base = { jacket: def.colors.jacket, pants: def.colors.pants, hat: def.hat || 'cap', hatColor: def.colors.hat, hair: def.hairStyle || 'short', hairColor: def.colors.hair, skin: def.colors.skin, scarf: def.colors.scarf };
    const l = save && save.look && save.look[def.id];
    const look = l ? Object.assign(base, l) : base;
    if(SK.KNIT_STYLES[look.hat]&&!Object.prototype.hasOwnProperty.call(l||{},'hatColor'))look.hatColor=SK.KNIT_STYLES[look.hat].color;
    look.goggles = l && Object.prototype.hasOwnProperty.call(l,'goggles') ? (save?.gear?.includes(l.goggles) ? l.goggles : null) : ['lunettesMiroir','lunettesTricolores','lunettesNeige','lunettesForet','lunettes'].find(id=>save?.gear?.includes(id)) || null;
    const ownedHelmets=(save?.gear||[]).filter(id=>SK.isHelmet(id)||id==='couronne'),selected=l?.helmet===true?'casque':l?.helmet;
    look.helmet=l?.helmet===false?false:ownedHelmets.includes(selected)?selected:ownedHelmets[0]||false;
    look.boots=l?.boots??(save?.gear?.includes('ressort')?'ressort':save?.gear?.includes('bottes')?'bottes':'normal');
    if(look.boots!=='normal'&&!save?.gear?.includes(look.boots))look.boots='normal';
    look.springBoots=look.boots==='ressort';
    look.gripBoots=look.boots==='bottes';
    look.paddedVest=!!save?.gear?.includes('veste')&&l?.paddedVest!==false;
    look.whistle=!!save?.gear?.includes('sifflet')&&l?.whistle!==false;
    look.gloves=l?.gloves===false?false:(['gants','gantsMauves'].includes(l?.gloves)&&save?.gear?.includes(l.gloves)?l.gloves:['gants','gantsMauves'].find(id=>save?.gear?.includes(id))||false);
    look.rocketPack = !!save?.gear?.includes('fusee') && l?.rocketPack !== false;
    return look;
  };
  // Pourquoi un article est encore verrouillé (null = disponible). unlock: { wins: n } ou { course: id }
  SK.lockReason = function (unlock, save) {
    if (!unlock) return null;
    if (unlock.cupRank) {
      const cups = SK.CUPS || [], count = cups.filter(c => { const result = save.cups?.[c.id]; const rank = result?.won ? 1 : result?.bestRank; return Number.isInteger(rank) && rank >= 1 && rank <= unlock.cupRank; }).length;
      if (!cups.length || count < cups.length) return `Obtiens ${['', 'l’or', 'l’argent ou mieux', 'le bronze ou mieux'][unlock.cupRank]} dans tous les tournois (${count} / ${cups.length})`;
    }
    if (unlock.finalBoss && !save.trophies?.shadowKing) return 'Bats le boss final dans la salle du trône';
    const wins = Object.keys(save.won || {}).length;
    if (unlock.wins != null && wins < unlock.wins) return `Gagne ${unlock.wins} piste${unlock.wins > 1 ? 's' : ''} dans l'aventure (${wins} / ${unlock.wins})`;
    if (unlock.course && !(save.won || {})[unlock.course]) { const c = SK.courseById(unlock.course); return 'Gagne la course « ' + c.name + ' »' + (c.boss ? ' en battant Ninja' : ''); }
    return null;
  };
  SK.townWalkSpeed=level=>255*(1+Math.max(0,Math.min(5,level||0))*.15);
  SK.STAT_MAX = 50; SK.capStat=n=>Math.max(0,Math.min(SK.STAT_MAX,Number(n)||0)); SK.UPGRADE_MAX = 50; SK.upgradeCost = lvl => 400 * (lvl + 1);
  SK.STAT_STEP_COLORS=['#cfdae2','#39bced','#54cc72','#ffda49','#ad72ed','#f26868'];
  SK.statSteps=value=>Array.from({length:10},(_,i)=>SK.clamp(Math.floor(SK.capStat(value))-i*5,0,5));
  SK.statTicks=function(value,previous=value,max=50){
    const steps=max===50?SK.statSteps(value):Array.from({length:max},(_,i)=>i<value?1:0),before=max===50?SK.statSteps(previous):Array.from({length:max},(_,i)=>i<previous?1:0);
    return steps.map((n,i)=>'<i data-stat-step="'+n+'" class="'+(n!==before[i]?(n>before[i]?'stat-up':'stat-down'):'')+'" style="--stat-color:'+SK.STAT_STEP_COLORS[n]+'" title="'+n+' point'+(n>1?'s':'')+(n!==before[i]?' (avant : '+before[i]+')':'')+'" aria-hidden="true"></i>').join('');
  };
  SK.STAT_LEGEND='Chaque coche : bleu 1 · vert 2 · jaune 3 · mauve 4 · rouge 5. Dix coches = 50.';
  SK.trainingLevels=function(save){
    if(!save)return {};
    if(!save.characterStatsMigrated){const levels={...(save.characterStats||{})};for(const u of Object.values(save.upgrades||{}))for(const key of ['speed','corner','acceleration','jump'])levels[key]=(levels[key]||0)+(u[key]??(key==='acceleration'?u.trick:0)??0);save.characterStats=levels;save.characterStatsMigrated=true;}
    return save.characterStats||(save.characterStats={});
  };
  SK.trainedCharacter=(id,save)=>{const ch=SK.charById(id)||SK.CHARACTERS[0],levels=SK.trainingLevels(save),def={...ch};for(const key of ['speed','corner','acceleration','jump'])def[key]=(ch[key]||0)+(levels[key]||0);return def;};
  // Planche avec ses améliorations achetées (save.upgrades[boardId] = { speed, corner, acceleration })
  SK.effectiveBoard = function(id,save){const b=SK.boardById(id),skin=SK.boardSkin(id,save);return {...b,color:skin.color,pattern:skin.pattern,skinId:skin.id,base:b};};

  // ------------------------------------------------------------------ tirs (boîtes rouges) et objets (boîtes bleues)
  SK.SHOTS = {
    bombe:     { name: 'Bombe',       icon: '💣', desc: 'Vole vers le coureur devant toi et le fait tomber.' },
    parachute: { name: 'Parachute',   icon: '🪂', desc: 'Accroche un parachute au coureur devant : il est ralenti 5 secondes.' },
    gel:       { name: 'Rayon de gel', icon: '🧊', desc: 'Gèle le coureur devant dans un bloc de glace pendant 2 secondes.' },
    poele:     { name: 'Poêle',       icon: '🍳', desc: 'Un coup de poêle sur la tête de tous les adversaires devant toi.' },
    bonhomme:  { name: 'Bonhomme',    icon: '⛄', desc: 'Transforme le coureur devant en bonhomme de neige : lent et impossible à diriger.' },
  };
  SK.ITEMS = {
    huile: {name:'Huile noire',icon:'🛢️',desc:'Laisse une flaque derrière toi : elle fait déraper et ralentir, avec une chance sur deux de tomber.'},
    rocher:    { name: 'Piège surprise', icon: '🎲', desc: 'Dépose au hasard une roche, un cône, un bonhomme de neige ou une banane derrière toi.' },
    ventilo:   { name: 'Ventilateur', icon: '🌀', desc: 'Turbo : grosse accélération pendant 3 secondes.' },
    invisible: { name: 'Invisible',   icon: '👻', desc: 'Invisible 6 secondes : aucun tir ne peut t\'atteindre.' },
    fantome:   { name: 'Fantôme',     icon: '🎭', desc: 'Vole le tir ou l\'objet du coureur devant toi.' },
    nuage:     { name: 'Nuage',       icon: '🌧️', desc: 'Une averse ralentit les adversaires devant toi pendant 4 secondes.' },
  };
  // Presentation only: keep the original IDs, probabilities and gameplay rules.
  SK.POWER_STYLES = {
    alexie: {
      ventilo: { name: 'Étoile filante', icon: '🌟', desc: 'Alexie file dans une gerbe d’étoiles multicolores pendant 3 secondes.' },
      bombe: { name: 'Licorne', icon: '🦄', desc: 'Une licorne fonce sur le coureur devant toi et le fait tomber.' }
    }
  };
  SK.powerPresentation = (character, kind, id) => {
    const charId = typeof character === 'string' ? character : character?.def?.id;
    return SK.POWER_STYLES[charId]?.[id] || (kind === 'shot' ? SK.SHOTS[id] : SK.ITEMS[id]);
  };
  SK.SHOT_IDS = Object.keys(SK.SHOTS); SK.ITEM_IDS = Object.keys(SK.ITEMS);
  // Le piège occupe aussi le bouton de tir quand on mène la course.
  SK.SHOTS.rocher = SK.ITEMS.rocher;
  SK.TRAPS = {
    rock:{name:'Roche',icon:'🪨'}, cone:{name:'Cône orange',icon:'🚧'},
    snowman:{name:'Bonhomme de neige',icon:'⛄'}, banana:{name:'Peau de banane',icon:'🍌'}
  };
  SK.TRAP_IDS = Object.keys(SK.TRAPS);
  SK.TRAPS.oil={name:'Huile noire',icon:'🛢️'};

  // ------------------------------------------------------------------ figures (en l'air) : durée de base et pièces
  SK.TRICKS = {
    grab: {name:'Indy grab',dur:.45,coins:1,dir:'none',btn:'trick',anim:'pose',pose:'indy'},
    spinL: {name:'Nose grab',dur:.55,coins:2,dir:'left',btn:'trick',anim:'pose',pose:'nose'},
    spinR: {name:'Tail grab',dur:.55,coins:2,dir:'right',btn:'trick',anim:'pose',pose:'tail'},
    back: {name:'Melon grab',dur:.65,coins:4,dir:'up',btn:'trick',anim:'pose',pose:'melon'},
    front: {name:'Method',dur:.65,coins:4,dir:'down',btn:'trick',anim:'pose',pose:'method'},
    method: {name:'Rotation 180°',dur:.55,coins:2,dir:'none',btn:'jump',anim:'spin',turns:.5,pose:'spread'},
    spin2L: {name:'Rotation 360°',dur:.80,coins:5,dir:'left',btn:'jump',anim:'spin',turns:1,sign:-1,pose:'tuck'},
    spin2R: {name:'Tornade 720°',dur:1.15,coins:9,dir:'right',btn:'jump',anim:'spin',turns:2,sign:1,pose:'cross'},
    rodeo: {name:'Salto arrière',dur:.85,coins:7,dir:'up',btn:'jump',anim:'flip',sign:-1,pose:'melon'},
    superman: {name:'Superman',dur:.85,coins:6,dir:'downleft',btn:'trick',anim:'superman',pose:'superman'},
    cartwheel: {name:'Roue aérienne',dur:1,coins:8,dir:'downleft',btn:'jump',anim:'cartwheel',pose:'star'},
    tornade: {name:'Salto avant',dur:.85,coins:7,dir:'down',btn:'jump',anim:'flip',sign:1,pose:'method'},
  };
  SK.TRICK_GRADES = [
    {min:1,color:'#9eeaff',phrases:['Cool !','Pas mal !','Bien joué !']},
    {min:4,color:'#94f5b5',phrases:['Vraiment nice !','Solide !','Ça monte en flèche !']},
    {min:8,color:'#ffe674',phrases:['Extraordinaire !!','En plein dans le mille !','Tu gères à fond !']},
    {min:15,color:'#d7a3ff',phrases:['MAJESTUEUX, WOW !!!','Incroyable performance !','Rien ne t’arrête !']},
    {min:25,color:'#ffb56e',phrases:['SUPER EXTRAORDINAIRE !!!','Complètement démentiel !','Mode bête activé !']},
    {min:40,color:'#ff9bcf',phrases:['APOTHÉOSE TOTALE !!!','Niveau divin débloqué !',"C’EST DE LA FOLIE PURE !"]},
    {min:60,color:'#fff0a1',phrases:['LÉGENDAIRE, DU JAMAIS VU !','TU AS CASSÉ LE JEU !!!','PERFECTION ABSOLUE, MONUMENTAL !']},
  ];
  SK.trickGrade=points=>Math.max(0,SK.TRICK_GRADES.findLastIndex(g=>points>=g.min));
  SK.trickFor = (btn, dir) => Object.keys(SK.TRICKS).find(id => SK.TRICKS[id].btn === btn && SK.TRICKS[id].dir === dir);

  // ------------------------------------------------------------------ surfaces
  SK.SURFACES = {
    snow:  { speed: 1,    grip: 1,    name: 'neige' },
    ice:   { speed: 1.06, grip: 0.45, name: 'glace' },
    sand:  { speed: 0.87, grip: 1,    name: 'sable' },
    quick: { speed: 0.5,  grip: 0.8,  name: 'sables mouvants' },
    road:  { speed: 1.04, grip: 1.1,  name: 'asphalte' },
    grass: { speed: 0.93, grip: 1,    name: 'herbe' },
    stone: { speed: 1,    grip: 1.05, name: 'pierre' },
    candy: { speed: 1,    grip: 1,    name: 'bonbon' },
  };

  // ------------------------------------------------------------------ thèmes visuels
  SK.THEMES = {
    rookie:  { sky: ['#5fb0ff', '#dff3ff'], ground: ['#eef4fb', '#e2ebf5'], road: { snow: ['#ffffff', '#f3f7fc'], ice: ['#9cdbf3','#b9edff'] }, rumble: ['#ff5252', '#ffffff'],
               bg: 'mountains', decor: ['pine', 'pine', 'pine', 'rock', 'snowman', 'fir'], obst: ['pine', 'rock'], sun: 'sun', fog: '#dff3ff' },
    snowman: { sky: ['#3f7fcf', '#cfe6ff'], ground: ['#e9f1fa', '#dce7f4'], road: { snow: ['#ffffff', '#f1f6fc'], ice: ['#cdeeff', '#bfe6fb'] }, rumble: ['#1e88e5', '#ffffff'],
               bg: 'bigsnowman', decor: ['pine', 'snowman', 'snowman', 'fir', 'rock', 'igloo'], obst: ['snowman', 'rock'], sun: 'sun', fog: '#cfe6ff' },
    sunset:  { sky: ['#ff6f2a', '#ffd48a'], ground: ['#b5633a', '#a5572f'], road: { stone: ['#d09463', '#c58958'], sand: ['#e8c07a', '#dfb66f'] }, rumble: ['#6d3b1e', '#ffcc80'],
               bg: 'mesas', decor: ['rock', 'rock', 'mesa', 'cactus', 'deadtree'], obst: ['rock', 'rock', 'cactus'], sun: 'bigsun', fog: '#ffd48a' },
    highway: { sky: ['#07091c', '#1c2a5e'], ground: ['#2b2e39', '#252833'], road: { road: ['#3b3e49', '#373a44'] }, rumble: ['#ffeb3b', '#555555'],
               bg: 'city', decor: ['lamp', 'building', 'building', 'sign', 'lamp'], obst: ['car', 'car', 'cone'], sun: 'moon', fog: '#1c2a5e', stars: true, centerLine: true },
    grass:   { sky: ['#4fa8ff', '#d9f1ff'], ground: ['#43a047', '#3d9442'], road: { grass: ['#86d472', '#7bcb67'], stone: ['#a9a9a0', '#9e9e95'] }, rumble: ['#ffffff', '#8d6e63'],
               bg: 'hills', decor: ['tree', 'tree', 'bush', 'flower', 'cow', 'house', 'flower'], obst: ['cow', 'tree', 'bush'], sun: 'sun', fog: '#d9f1ff' },
    sand:    { sky: ['#ffb74d', '#ffeccc'], ground: ['#dcb46a', '#d1aa5e'], road: { sand: ['#f0cd82', '#e8c478'], quick: ['#b08a44', '#a68039'] }, rumble: ['#8d6e63', '#ffe0b2'],
               bg: 'dunes', decor: ['cactus', 'palm', 'rock', 'pyramid', 'cactus', 'skull'], obst: ['cactus', 'rock', 'skull'], sun: 'bigsun', fog: '#ffeccc' },
    silver:  { sky: ['#8aa6cf', '#edf2f8'], ground: ['#dfe8f2', '#d3dde9'], road: { ice: ['#cdeeff', '#c0e6fb'], snow: ['#ffffff', '#f1f6fc'] }, rumble: ['#90a4ae', '#ffffff'],
               bg: 'peaks', decor: ['fir', 'rock', 'icicle', 'pine', 'rock'], obst: ['rock', 'icicle'], sun: 'none', fog: '#edf2f8', snowfall: true },
    ninja:   { sky: ['#2a1746', '#9b4f85'], ground: ['#3e6b3a', '#345e34'], road: { stone: ['#8f8a7c', '#847e71'], grass: ['#6fb75f', '#64ab55'] }, rumble: ['#c62828', '#fff3e0'],
               bg: 'castle', decor: ['torii', 'bamboo', 'bamboo', 'lantern', 'pagoda', 'cherry'], obst: ['lantern', 'statue', 'bamboo'], sun: 'moon', fog: '#9b4f85', stars: true },
    dizzy:   { sky: ['#ff8fd0', '#ffe9a6'], ground: ['#8fd86f', '#82cf62'], road: { candy: ['#ffd1e8', '#ffc3df'] }, rumble: ['#ff4081', '#ffffff'],
               bg: 'park', decor: ['balloon', 'tent', 'balloon', 'ferris', 'lollipop', 'tent'], obst: ['teacup', 'balloon', 'lollipop'], sun: 'sun', fog: '#ffe9a6' },
  };

  // ------------------------------------------------------------------ pistes (les 9 tableaux, dans l'ordre du championnat)
  // Sections : s = ligne droite, c = virage (c > 0 vers la droite), r = bosse-tremplin (montée de h m sur n segments puis redescente ; sauter au sommet pour décoller),
  // b = bosses, x = changement de surface, tunnel = marche/arrêt. w = demi-largeur (m). obst/boxes/coins = garnitures.
  SK.COURSES = [
    { id: 'rookie', name: 'Mont Débutant', original: 'Rookie Mountain', theme: 'rookie', surface: 'snow', laps: 3,
      desc: 'La piste des débutants : large, douce, deux petits tremplins.',
      sections: [
        { t: 's', n: 30, w: 14, coins: 5 }, { t: 'c', n: 40, c: 0.045, w: 14, boxes: 'rb' }, { t: 's', n: 20, w: 14, obst: 2 },
        { t: 'c', n: 40, c: -0.055, w: 13, coins: 6 }, { t: 'r', n: 5, h: 3.5 }, { t: 's', n: 30, w: 13, boxes: 'rb', obst: 2 },
        { t: 'c', n: 50, c: 0.06, w: 12, coins: 6 }, { t: 's', n: 25, w: 12, obst: 3 }, { t: 'c', n: 30, c: -0.045, w: 13, boxes: 'rb' },
        { t: 'r', n: 5, h: 4 }, { t: 's', n: 40, w: 14, coins: 8 },
      ] },
    { id: 'snowman', name: 'Grand Bonhomme', original: 'Big Snowman', theme: 'snowman', surface: 'snow', laps: 3,
      desc: 'Un bonhomme de neige géant veille sur cette piste pleine de ses petits frères.',
      sections: [
        { t: 's', n: 25, w: 13, coins: 5 }, { t: 'c', n: 45, c: 0.06, w: 13, boxes: 'rb' }, { t: 'c', n: 45, c: -0.06, w: 12, obst: 3 },
        { t: 'r', n: 5, h: 4 }, { t: 's', n: 25, w: 12, coins: 6 }, { t: 'tunnel', on: true }, { t: 's', n: 30, w: 9, obst: 2, boxes: 'b' }, { t: 'tunnel', on: false },
        { t: 'c', n: 50, c: 0.07, w: 12, coins: 6, obst: 2 }, { t: 'x', s: 'ice' }, { t: 's', n: 30, w: 13, boxes: 'rb' }, { t: 'x', s: 'snow' },
        { t: 'c', n: 40, c: -0.05, w: 13, obst: 3 }, { t: 'r', n: 5, h: 4.5 }, { t: 's', n: 20, w: 13, coins: 6 }, { t: 'c', n: 30, c: 0.04, w: 14, boxes: 'rb' }, { t: 's', n: 20, w: 14 },
      ] },
    { id: 'sunset', name: 'Rocher du Couchant', original: 'Sunset Rock', theme: 'sunset', surface: 'stone', laps: 3,
      desc: 'Canyons étroits et gros rochers sous un ciel orange.',
      sections: [
        { t: 's', n: 25, w: 12, coins: 5 }, { t: 'c', n: 40, c: 0.07, w: 11, boxes: 'rb' }, { t: 's', n: 30, w: 8, obst: 3 },
        { t: 'c', n: 40, c: -0.08, w: 9, coins: 6 }, { t: 'r', n: 5, h: 4 }, { t: 'x', s: 'sand' }, { t: 's', n: 30, w: 12, boxes: 'rb', obst: 2 }, { t: 'x', s: 'stone' },
        { t: 'c', n: 55, c: 0.075, w: 9, obst: 3 }, { t: 'tunnel', on: true }, { t: 's', n: 25, w: 7, coins: 6 }, { t: 'tunnel', on: false },
        { t: 'c', n: 40, c: -0.065, w: 11, boxes: 'rb' }, { t: 'b', n: 40, a: 1.2, w: 12, obst: 3 }, { t: 'r', n: 6, h: 5 }, { t: 's', n: 30, w: 12, coins: 8 },
      ] },
    { id: 'highway', name: 'Autoroute de nuit', original: 'Night Highway', theme: 'highway', surface: 'road', laps: 3,
      desc: 'Pleine vitesse sur l\'asphalte entre les voitures et les néons de la ville.',
      sections: [
        { t: 's', n: 35, w: 12, coins: 6, obst: 2 }, { t: 'c', n: 35, c: 0.05, w: 12, boxes: 'rb' }, { t: 's', n: 30, w: 12, obst: 4 },
        { t: 'c', n: 30, c: -0.1, w: 11, coins: 5 }, { t: 'c', n: 30, c: 0.1, w: 11, obst: 2 }, { t: 'r', n: 5, h: 3.5 }, { t: 's', n: 40, w: 13, boxes: 'rb', obst: 3 },
        { t: 'c', n: 50, c: 0.06, w: 11, coins: 7, obst: 2 }, { t: 's', n: 30, w: 9, obst: 4 }, { t: 'c', n: 45, c: -0.085, w: 11, boxes: 'rb' },
        { t: 'r', n: 5, h: 4 }, { t: 's', n: 30, w: 12, coins: 8, obst: 3 }, { t: 'c', n: 25, c: 0.05, w: 12, boxes: 'b' }, { t: 's', n: 15, w: 12 },
      ] },
    { id: 'grass', name: 'Vallée d\'herbe', original: 'Grass Valley', theme: 'grass', surface: 'grass', laps: 3,
      desc: 'Pas de neige ici : collines vertes, vaches et petits ponts de pierre.',
      sections: [
        { t: 'b', n: 40, a: 1.2, w: 13, coins: 6 }, { t: 'c', n: 45, c: 0.06, w: 12, boxes: 'rb' }, { t: 's', n: 30, w: 12, obst: 4 },
        { t: 'x', s: 'stone' }, { t: 's', n: 20, w: 6, coins: 4 }, { t: 'x', s: 'grass' }, { t: 'c', n: 45, c: -0.07, w: 12, obst: 3 },
        { t: 'r', n: 5, h: 4 }, { t: 'b', n: 50, a: 1.6, w: 13, boxes: 'rb', obst: 2 }, { t: 'c', n: 50, c: 0.08, w: 11, coins: 7 },
        { t: 'x', s: 'stone' }, { t: 's', n: 20, w: 6, obst: 1 }, { t: 'x', s: 'grass' }, { t: 'c', n: 40, c: -0.06, w: 12, boxes: 'rb' },
        { t: 'r', n: 6, h: 5 }, { t: 's', n: 30, w: 13, coins: 8 }, { t: 'c', n: 30, c: 0.04, w: 13, obst: 2 },
      ] },
    { id: 'sand', name: 'Vallée des sables', original: 'Quicksand Valley', theme: 'sand', surface: 'sand', laps: 3,
      desc: 'Le désert : le sable freine, les sables mouvants engluent, les dunes font décoller.',
      sections: [
        { t: 's', n: 30, w: 13, coins: 6 }, { t: 'c', n: 40, c: 0.055, w: 12, boxes: 'rb' }, { t: 'x', s: 'quick' }, { t: 's', n: 12, w: 12 }, { t: 'x', s: 'sand' },
        { t: 's', n: 25, w: 12, obst: 3 }, { t: 'r', n: 5, h: 4.5 }, { t: 'c', n: 45, c: -0.07, w: 12, coins: 6, obst: 2 }, { t: 'b', n: 40, a: 1.8, w: 13, boxes: 'rb' },
        { t: 'x', s: 'quick' }, { t: 'c', n: 15, c: 0.03, w: 12 }, { t: 'x', s: 'sand' }, { t: 'c', n: 45, c: 0.08, w: 10, obst: 4 },
        { t: 'r', n: 6, h: 5.5 }, { t: 's', n: 30, w: 12, coins: 7 }, { t: 'c', n: 40, c: -0.06, w: 12, boxes: 'rb', obst: 2 }, { t: 'x', s: 'quick' }, { t: 's', n: 10, w: 13 }, { t: 'x', s: 'sand' },
        { t: 's', n: 30, w: 13, coins: 6 },
      ] },
    { id: 'silver', name: 'Mont d\'Argent', original: 'Silver Mountain', theme: 'silver', surface: 'ice', laps: 3,
      desc: 'Haute montagne : glace vive, crêtes étroites, tempête de neige. Très rapide.',
      sections: [
        { t: 's', n: 35, w: 12, coins: 6 }, { t: 'c', n: 50, c: 0.045, w: 11, boxes: 'rb' }, { t: 'x', s: 'snow' }, { t: 's', n: 25, w: 7, obst: 2 }, { t: 'x', s: 'ice' },
        { t: 'c', n: 50, c: -0.05, w: 11, coins: 6 }, { t: 'r', n: 5, h: 4 }, { t: 's', n: 30, w: 12, boxes: 'rb', obst: 2 },
        { t: 'c', n: 45, c: 0.055, w: 10, obst: 3 }, { t: 'x', s: 'snow' }, { t: 'b', n: 40, a: 1.4, w: 7, coins: 6 }, { t: 'x', s: 'ice' },
        { t: 'c', n: 50, c: -0.045, w: 11, boxes: 'rb' }, { t: 'r', n: 6, h: 5 }, { t: 's', n: 30, w: 12, coins: 6, obst: 2 }, { t: 'c', n: 40, c: 0.04, w: 12, obst: 2 },
        { t: 'r', n: 5, h: 4.5 }, { t: 's', n: 25, w: 13, coins: 6 },
      ] },
    { id: 'ninja', name: 'Pays des Ninjas', original: 'Ninja Land', theme: 'ninja', surface: 'stone', laps: 3, boss: 'shinobin',
      desc: 'Un château japonais au crépuscule. Ninja, le ninja mystérieux, s\'invite dans la course.',
      sections: [
        { t: 's', n: 25, w: 11, coins: 5 }, { t: 'c', n: 35, c: 0.085, w: 10, boxes: 'rb' }, { t: 'c', n: 35, c: -0.085, w: 10, obst: 3 },
        { t: 'x', s: 'grass' }, { t: 'b', n: 40, a: 1.5, w: 12, coins: 6, obst: 2 }, { t: 'x', s: 'stone' }, { t: 'r', n: 5, h: 4.5 },
        { t: 's', n: 25, w: 6, obst: 2 }, { t: 'c', n: 45, c: 0.07, w: 11, boxes: 'rb', obst: 2 }, { t: 'tunnel', on: true }, { t: 'c', n: 30, c: -0.06, w: 8, coins: 5 }, { t: 'tunnel', on: false },
        { t: 's', n: 25, w: 11, obst: 4 }, { t: 'c', n: 40, c: 0.09, w: 10, boxes: 'rb' }, { t: 'r', n: 6, h: 5.5 }, { t: 'x', s: 'grass' }, { t: 's', n: 30, w: 12, coins: 7 }, { t: 'x', s: 'stone' },
        { t: 'c', n: 40, c: -0.075, w: 10, obst: 3 }, { t: 's', n: 25, w: 6, boxes: 'b' }, { t: 'r', n: 5, h: 4 }, { t: 's', n: 30, w: 12, coins: 6 },
      ] },
    { id: 'dizzy', name: 'Pays Vertige', original: 'Dizzy Land', theme: 'dizzy', surface: 'candy', laps: 3, boss: 'shinobin', hidden: true,
      desc: 'Le parc d\'attractions : virages à n\'en plus finir, bosses, tasses tournantes. Le tableau caché.',
      sections: [
        { t: 's', n: 25, w: 12, coins: 6 }, { t: 'c', n: 30, c: 0.11, w: 11, boxes: 'rb' }, { t: 'c', n: 30, c: -0.11, w: 11, obst: 3 },
        { t: 'c', n: 30, c: 0.11, w: 11, coins: 5 }, { t: 'c', n: 30, c: -0.11, w: 11, obst: 3 }, { t: 'r', n: 5, h: 4.5 },
        { t: 'b', n: 40, a: 2, w: 13, boxes: 'rb', coins: 6 }, { t: 'c', n: 45, c: 0.06, w: 10, obst: 4 }, { t: 's', n: 15, w: 8, boxes: 'b' },
        { t: 'c', n: 35, c: -0.12, w: 11, coins: 6 }, { t: 'c', n: 35, c: 0.12, w: 11, obst: 3 }, { t: 'r', n: 6, h: 6 }, { t: 's', n: 25, w: 12, boxes: 'rb' },
        { t: 'b', n: 30, a: 1.6, w: 12, obst: 3, coins: 6 }, { t: 'c', n: 35, c: -0.09, w: 10, boxes: 'rb', obst: 2 }, { t: 'r', n: 5, h: 4.5 }, { t: 's', n: 25, w: 13, coins: 8 },
      ] },
  ];
  SK.courseById = id => SK.COURSES.find(c => c.id === id);

  // ------------------------------------------------------------------ École : missions de pratique (1 tour)
  SK.MISSIONS = [
    { id: 'slalom1', type: 'slalom', course: 'rookie', goal: 12, reward: 60, name: 'Slalom débutant', desc: 'Passe entre les drapeaux : gauche, droite, gauche, droite… Au moins 12 portes sur 20.' },
    { id: 'coins1', type: 'coins', course: 'grass', goal: 12, reward: 60, name: 'Chasse aux pièces', desc: 'Ramasse au moins 12 pièces d\'or en un tour de la Vallée d\'herbe.' },
    { id: 'tricks1', type: 'tricks', course: 'rookie', goal: 12, reward: 70, name: 'Premières figures', desc: 'Gagne au moins 12 G en figures (saute au sommet des bosses avec X, puis C ou X + direction).' },
    { id: 'shots1', type: 'hits', course: 'highway', goal: 3, reward: 100, name: 'Stand de tir', desc: 'Trois coureurs lents roulent devant toi : touche-les 3 fois avec les tirs des boîtes rouges.' },
    { id: 'time1', type: 'time', course: 'rookie', goal: 60, reward: 80, name: 'Contre la montre', desc: 'Descends le Mont Débutant en moins de 1:00. Penche-toi (↑) dans les lignes droites !' },
    { id: 'nofall1', type: 'nofall', course: 'sunset', goal: 0, reward: 80, name: 'Pas une chute', desc: 'Évite les roches, baisse-toi sous les barres et saute les troncs. Termine sans tomber !' },
    { id: 'slalom2', type: 'slalom', course: 'silver', goal: 18, reward: 130, name: 'Slalom débutant', desc: 'Même chose sur la glace du Mont d\'Argent : 18 portes sur 22. Anticipe, ça glisse.' },
    { id: 'tricks2', type: 'tricks', course: 'dizzy', goal: 35, reward: 160, name: 'Premières figures', desc: 'Gagne 35 G en figures au Pays Vertige : enchaîne Rodéo, Tornade et vrilles 720.' },
    { id: 'shots2', type: 'hits', course: 'ninja', goal: 6, reward: 180, name: 'Stand de tir', desc: 'Six touches en un tour du Pays des Ninjas. Le Fantôme vole les tirs des autres !' },
  ];
  SK.MISSIONS.forEach(m=>m.level=m.id.endsWith('2')?2:1);
  SK.MISSIONS.splice(1,0,{id:'edges1',type:'edges',course:'rookie',goal:0,reward:80,level:1,name:'Ne pas toucher le bord !',desc:'Reste au centre : alterne gauche, droite et lignes droites sans toucher les bords.'});
  SK.MISSIONS.push({id:'edges2',type:'edges',course:'rookie',goal:0,reward:150,level:2,name:'Ne pas toucher le bord !',desc:'Des virages plus serrés sur une piste encore plus étroite. Zéro contact avec les bords !'});
  SK.MISSIONS.push({id:'push1',type:'pushes',course:'rookie',goal:3,reward:100,level:1,name:'Place au passage !',desc:'Approche-toi des autres et appuie sur N pour réussir 3 poussées.'});
  // Cinq niveaux par discipline ; conserver les anciens identifiants sauvegardés.
  const lessonPlans={
    slalom:{prefix:'slalom',courses:['rookie','silver','silver','silver','silver'],goals:[12,14,16,18,20]},
    coins:{prefix:'coins',courses:['rookie','silver','grass','grass','dizzy'],goals:[60,80,110,140,180]},
    tricks:{prefix:'tricks',courses:['rookie','silver','dizzy','dizzy','dizzy'],goals:[3,4,5,6,7]},
    hits:{prefix:'shots',courses:['rookie','silver','grass','highway','ninja'],goals:[12,22,35,50,70]},
    time:{prefix:'time',courses:['rookie','rookie','rookie','rookie','rookie'],goals:[120,110,100,90,80]},
    nofall:{prefix:'nofall',courses:['rookie','silver','sunset','sunset','sunset'],goals:[0,0,0,0,0]},
    edges:{prefix:'edges',courses:['rookie','rookie','rookie','rookie','rookie'],goals:[0,0,0,0,0]},
    pushes:{prefix:'push',courses:['rookie','rookie','rookie','rookie','rookie'],goals:[3,5,7,9,12]}
  };
  const originals=SK.MISSIONS;
  SK.MISSIONS=Object.entries(lessonPlans).flatMap(([type,plan])=>plan.goals.map((goal,i)=>{
    const level=i+1,base=originals.find(m=>m.type===type),old=originals.find(m=>m.id===plan.prefix+level);
    const desc=type==='slalom'?`Passe au moins ${goal} portes de slalom.`:type==='coins'?`Ramasse ${goal} pièces sur la piste en un tour.`:type==='tricks'?`Gagne ${goal} pièces avec tes figures. Charge X puis relâche pour sauter. En l’air : C + direction = grab ; X + direction = rotation ou salto.`:type==='hits'?`Touche les adversaires ${goal} fois avec tes tirs.`:type==='time'?`Termine en ${Math.floor(goal/60)} min ${String(goal%60).padStart(2,'0')} s maximum.`:type==='pushes'?`Réussis ${goal} poussées : approche-toi, puis N + gauche ou droite.`:type==='edges'?`Aucun contact avec les bords. Virages de difficulté ${level}/5.`:`Aucune chute ! Saute les barrages de difficulté ${level}/5.`;
    return {...base,...old,id:plan.prefix+level,type,level,course:plan.courses[i],goal,reward:base.reward+i*40,desc};
  }));
  const slalomTimes=[{gold:22,silver:30,bronze:38},{gold:32,silver:42,bronze:52},{gold:35,silver:45,bronze:60},{gold:140,silver:175,bronze:215},{gold:130,silver:160,bronze:200}];
  for(const m of SK.MISSIONS.filter(m=>m.type==='slalom')){m.medalTimes=slalomTimes[m.level-1];m.desc=`Passe au moins ${m.goal} portes et termine en ${Math.floor(m.medalTimes.bronze/60)} min ${m.medalTimes.bronze%60} s maximum.`;}
  for(const m of SK.MISSIONS.filter(m=>m.type==='coins')){m.medalCounts={gold:m.goal,silver:Math.ceil(m.goal*.8),bronze:Math.ceil(m.goal*.6)};m.desc='Ramasse '+m.goal+' pièces pour l’or.';}
  for(const m of SK.MISSIONS.filter(m=>m.type==='hits'))m.desc='Parcours solo : récupère les projectiles, maintiens V et tourne ta planche avec ← →, puis relâche pour gagner '+m.goal+' points. Cibles mobiles : 1 à 5 points selon la difficulté.';
  SK.trickLessonKeys=m=>{const t=SK.TRICKS[m.trickId];return t?[t.btn==='trick'?'C':'X',...({left:['←'],right:['→'],up:['↑'],down:['↓']}[t.dir]||[])]:[];};
  SK.trickLessonKeysHTML=m=>'<div class="lesson-keyboard"><small>EN L’AIR</small>'+SK.trickLessonKeys(m).map(k=>'<kbd>'+k+'</kbd>').join('<b>+</b>')+'</div>';
  for(const m of SK.MISSIONS.filter(m=>m.type==='tricks')){m.trickId=['grab','spinL','spin2L','tornade','spin2R'][m.level-1];m.desc='Réussis '+m.goal+' fois : '+SK.TRICKS[m.trickId].name+'. Maintiens X puis relâche pour sauter. En l’air : '+SK.trickLessonKeys(m).join(' + ')+'. Atterris sans tomber pour valider !';}
  SK.firstMissionGold=m=>Math.round(m.reward/5);
  SK.MEDALS={bronze:{rank:1,name:'Bronze',icon:'🥉'},silver:{rank:2,name:'Argent',icon:'🥈'},gold:{rank:3,name:'Or',icon:'🥇'}};
  SK.missionInstruction=m=>m.type==='tricks'&&m.trickId?'Réussis '+SK.TRICKS[m.trickId].name:({slalom:'Passe entre les drapeaux',coins:'Ramasse les pièces',tricks:'Fais des figures en sautant',hits:'Marque des points sur les cibles',pushes:'Pousse les adversaires',time:'Atteins l’arrivée à temps',nofall:'Termine sans tomber',edges:'Ne touche pas les bords'})[m.type];
  SK.missionUnlocked=(m,save)=>!!save.allMissionsUnlocked||m.level===1||save.missions?.[m.id]!=null||SK.MISSIONS.some(prev=>prev.type===m.type&&prev.level===m.level-1&&save.missions?.[prev.id]!=null);
  SK.recordMission=(save,m,value,outcome=null)=>{
    if(outcome&&!outcome.ok)return {first:false,reward:0,unlocked:null};
    const next=SK.MISSIONS.find(n=>n.type===m.type&&n.level===m.level+1),wasUnlocked=next&&SK.missionUnlocked(next,save);
    save.missions??={};const prev=save.missions[m.id],first=prev==null;
    if(first||(['time','edges','nofall'].includes(m.type)?value<prev:value>prev))save.missions[m.id]=value;
    if(['slalom','coins'].includes(m.type)&&outcome?.medal){const records=save.missionMedals??={},old=records[m.id],rank=SK.MEDALS[outcome.medal].rank;
      if(!old||rank>SK.MEDALS[old.medal].rank||(rank===SK.MEDALS[old.medal].rank&&(m.type==='coins'?value>(old.gates??-1):(outcome.time<old.time||(outcome.time===old.time&&value>(old.gates??-1))))))records[m.id]={medal:outcome.medal,time:outcome.time,gates:value,goldPerfect:!!old?.goldPerfect};
      if(outcome.medal==='gold'&&outcome.perfect)records[m.id].goldPerfect=true;
    }
    return {first,reward:first?SK.firstMissionGold(m):0,unlocked:next&&!wasUnlocked?next:null};
  };
  SK.missionById = id => SK.MISSIONS.find(m => m.id === id);

  // ------------------------------------------------------------------ outils communs
  SK.rng = function (seed) {   // mulberry32
    let a = (seed >>> 0) || 1;
    const f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    f.int = n => Math.floor(f() * n); f.pick = arr => arr[Math.floor(f() * arr.length)]; f.range = (a, b) => a + f() * (b - a);
    return f;
  };
  SK.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  SK.fmtMedalTime = t => Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
  SK.fmtTime = function (t) { if (t == null || !isFinite(t)) return '--:--.--'; const m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t * 100) % 100); return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (c < 10 ? '0' : '') + c; };
  SK.ordinal = n => n === 1 ? '1er' : n + 'e';
})(window.SK);
