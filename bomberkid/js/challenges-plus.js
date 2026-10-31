// Défis, suite : un tableau par monstre dans un décor assorti (biomes générés), les duels contre toute la famille
// (de l'or pour chaque adversaire vaincu la première fois, dans chacun des quatre styles) et « Bon timing » façon
// curling : on pose sa bombe dans sa zone, on la botte au bon moment, et elle marque selon l'anneau où elle explose.
// Seul (8 lancers, cibles différentes) ou en famille (chacun son tour, les autres font les fous sur le banc).
(function(BK){
'use strict';
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const hash=str=>String(str).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const D=deco=>({deco});

// ------------------------------------------------------------------ Biomes des arènes à monstres
// floor : sol de base ; pillar : ce qui remplace les piliers (lettre de carte ou {deco}) ; soft : bloc mou ; spots : [lettre,
// probabilité] semés sur les cases libres ; pools : taches (eau ~, lave [, glace ]) ; decor : objets solides qui remplacent
// quelques piliers ; cubes : blocs cubiques (décor mou) ; night : le tableau commence de nuit.
BK.ARENA_BIOMES={
 meadow:{theme:'garden',floor:',',pillar:'T',soft:'x',spots:[['*',.12]],decor:['6','4','5'],cubes:['melon','gift']},
 candy:{theme:'garden',floor:',',pillar:'T',soft:'x',spots:[['*',.16]],decor:[D('enchanted_14'),D('enchanted_11'),D('enchanted_7')],cubes:['gift','cheese']},
 swamp:{theme:'forest',floor:',',pillar:'T',soft:'x',spots:[['m',.1]],pools:[{ch:'~',n:3,size:3}],decor:[D('enchanted_1'),'8']},
 crypt:{theme:'castle',floor:'.',pillar:'o',soft:'W',spots:[['-',.14]],decor:[D('crypt_0'),D('crypt_6'),D('crypt_16'),D('crypt_3')],night:true},
 catacombs:{theme:'castle',floor:'.',pillar:D('crypt_8'),soft:'W',spots:[['-',.1]],decor:[D('crypt_1'),D('crypt_7'),D('crypt_6'),'o'],night:true},
 court:{theme:'castle',floor:'.',pillar:'I',soft:'W',decor:[D('castle_armor'),D('castle_weapons'),D('castle_brazier'),D('castle_shieldstand')]},
 forge:{theme:'lava',floor:'.',pillar:'#',soft:'K',pools:[{ch:'[',n:4,size:3}],decor:['?','Y',D('castle_brazier'),D('castle_cauldron')]},
 icecave:{theme:'winter',floor:')',pillar:'#',soft:'x',pools:[{ch:']',n:4,size:4}],decor:[D('icerock'),D('icecrystal'),D('snowpine')]},
 bastion:{theme:'winter',floor:')',pillar:'I',soft:'W',pools:[{ch:']',n:3,size:4}],decor:[D('icecrystal'),D('castle_armor'),D('snowman')]},
 throne:{theme:'castle',floor:'z',pillar:'I',soft:'K',spots:[['q',.2]],decor:[D('castle_throne'),D('castle_treasure'),D('castle_harp'),D('castle_crown'),D('castle_armor')]},
 volcano:{theme:'lava',floor:'.',pillar:'r',soft:'K',pools:[{ch:'[',n:5,size:3}],decor:['r','L']},
 glade:{theme:'forest',floor:',',pillar:'T',soft:'x',spots:[['*',.08],['m',.05]],decor:[D('enchanted_0'),D('enchanted_4'),D('enchanted_17'),D('enchanted_18')]},
 field:{theme:'garden',floor:'-',pillar:'8',soft:'x',spots:[[',',.2]],decor:['5','4','L'],cubes:['dirtblock']},
 orchard:{theme:'garden',floor:',',pillar:'T',soft:'x',spots:[['*',.1]],decor:[D('enchanted_13'),'6','4'],cubes:['melon','cheese']},
 jungle:{theme:'forest',floor:',',pillar:'T',soft:'x',spots:[['g',.15],['m',.06]],pools:[{ch:'~',n:2,size:2}],decor:[D('enchanted_12'),D('enchanted_10'),D('enchanted_9')]},
 quarry:{theme:'arena',floor:'.',pillar:'r',soft:'K',spots:[['-',.15]],decor:['L','0','?']},
 potager:{theme:'garden',floor:'-',pillar:'w',soft:'x',spots:[[',',.25]],decor:['5','4','6','u']},
 desert:{theme:'desert',floor:'¡',pillar:'9',soft:'x',spots:[['¢',.2],['£',.1]],decor:[D('desert_1'),D('desert_2'),D('desert_8'),D('desert_5')]},
 camp:{theme:'forest',floor:'-',pillar:'T',soft:'K',spots:[[',',.2]],decor:['i','3','4',D('desert_10')]},
 darkforest:{theme:'forest',floor:',',pillar:'T',soft:'x',spots:[['m',.08]],decor:['8','L',D('enchanted_16')],night:true},
 pond:{theme:'garden',floor:',',pillar:'T',soft:'x',pools:[{ch:'~',n:4,size:4}],spots:[['*',.06]],decor:['u','8']},
 lagoon:{theme:'garden',floor:'¡',pillar:'#',soft:'x',pools:[{ch:'~',n:1,size:16,center:true}],decor:[D('desert_0'),D('desert_9')]},
 ramparts:{theme:'castle',floor:'.',pillar:'#',soft:'W',decor:[D('castle_brazier'),D('castle_arch'),'3',D('castle_portcullis')]},
 dojo:{theme:'interior',floor:'y',pillar:'I',soft:'K',decor:[D('castle_weapons'),D('castle_armor'),'t','V']},
 circus:{theme:'arena',floor:'%',pillar:'#',soft:'K',spots:[['q',.15]],decor:['3','2',D('trophy_cup')],cubes:['gift','cheese']},
 fusefield:{theme:'arena',floor:'.',pillar:'#',soft:'K',spots:[['-',.1]],decor:['3','?','L']}
};
const FLOOR_CHARS=new Set(['.',',','-','_','%','&','!','y','z','q',')','¡','¢','£','¥','*','m','g']);
const PASSABLE=new Set([...FLOOR_CHARS,'x','W','K','j',']']);
const isSolidDeco=(ch,pr)=>ch==='"'&&pr&&(BK.DECO_PROPS[pr.deco]==null?1:BK.DECO_PROPS[pr.deco])===1;
const isSoftDeco=(ch,pr)=>ch==='"'&&pr&&BK.DECO_PROPS[pr.deco]===2;
const isWalkDeco=(ch,pr)=>ch==='"'&&pr&&BK.DECO_PROPS[pr.deco]===0;

// Arène d'un monstre : bordure, piliers du biome, quelques décors solides à la place des piliers, taches de sol et
// flaques, blocs mous, monstres loin du départ (tous reliés au héros, sinon on retire), carottes.
BK.buildArena=(ch,seed)=>{
 const B=BK.ARENA_BIOMES[ch.biome]||BK.ARENA_BIOMES.meadow,R=rng(seed),cols=ch.cols,rows=ch.rows,g=[],props={},enemies=[];
 const set=(c,r,ch2,pr)=>{g[r][c]=ch2;if(pr)props[c+','+r]=pr;else delete props[c+','+r];};
 const place=(c,r,what)=>typeof what==='string'?set(c,r,what):set(c,r,'"',{deco:what.deco});
 for(let r=0;r<rows;r++){const line=[];for(let c=0;c<cols;c++)line.push(c===0||r===0||c===cols-1||r===rows-1?'#':B.floor);g.push(line);}
 const start={c:1,r:rows-2},far=(c,r)=>Math.abs(c-start.c)+Math.abs(r-start.r);
 const pillars=[];for(let r=2;r<rows-1;r+=2)for(let c=2;c<cols-1;c+=2){place(c,r,B.pillar);pillars.push({c,r});}
 const decoPool=pillars.filter(q=>far(q.c,q.r)>3),nDecor=Math.min(decoPool.length,ch.decorN??Math.round(pillars.length*.3));
 for(let i=0;i<nDecor&&decoPool.length;i++){const q=decoPool.splice(Math.floor(R()*decoPool.length),1)[0];place(q.c,q.r,B.decor[Math.floor(R()*B.decor.length)]);}
 const free=(c,r)=>g[r][c]===B.floor;
 const pools=ch.noPools?[]:(B.pools||[]);
 for(const pool of pools)for(let i=0;i<pool.n;i++){
  let seedCell;
  if(pool.center)seedCell={c:Math.floor(cols/2),r:Math.floor(rows/2)};
  else{const cand=[];for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++)if(free(c,r)&&far(c,r)>=4)cand.push({c,r});if(!cand.length)break;seedCell=cand[Math.floor(R()*cand.length)];}
  if(!free(seedCell.c,seedCell.r)){if(pool.center){set(seedCell.c,seedCell.r,pool.ch);}else continue;}else set(seedCell.c,seedCell.r,pool.ch);
  const blob=[seedCell],size=pool.size+Math.floor(R()*2);
  for(let k=1,guard=0;k<size&&guard<size*8;guard++){const from=blob[Math.floor(R()*blob.length)],d=BK.DIRS[Math.floor(R()*4)],c=from.c+d.dx,r=from.r+d.dy;if(c<1||r<1||c>=cols-1||r>=rows-1||far(c,r)<3)continue;if(free(c,r)){set(c,r,pool.ch);blob.push({c,r});k++;}}
 }
 for(const [ch2,p] of B.spots||[])for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++)if(free(c,r)&&far(c,r)>0&&R()<p)set(c,r,ch2);
 for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++){if(!FLOOR_CHARS.has(g[r][c])||far(c,r)<=2||R()>=(ch.soft||0))continue;if(B.cubes&&R()<.45)set(c,r,'"',{deco:B.cubes[Math.floor(R()*B.cubes.length)]});else set(c,r,B.soft);}
 g[start.r][start.c]='1';
 const cells=[],water=[];for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++){if(FLOOR_CHARS.has(g[r][c])&&far(c,r)>=5)cells.push({c,r});if(g[r][c]==='~'&&far(c,r)>=5)water.push({c,r});}
 const take=(pool,near)=>{let list=near?pool.filter(q=>Math.abs(q.c-near.c)+Math.abs(q.r-near.r)<=2):pool;if(!list.length)list=pool;if(!list.length)return null;const q=list[Math.floor(R()*list.length)];pool.splice(pool.indexOf(q),1);return q;};
 let anchor=null;
 for(const [type,n] of ch.enemies||[])for(let i=0;i<n;i++){const wet=BK.ENEMIES[type]?.behavior==='sea';const q=take(wet&&water.length?water:cells,ch.group&&anchor?anchor:null);if(!q)break;if(type==='shaman')anchor=q;enemies.push({type,c:q.c,r:q.r});}
 for(let i=0;i<(ch.carrots||0);i++){const q=take(cells,null);if(!q)break;set(q.c,q.r,'"',{deco:'carrot'});}
 // tout le monde doit pouvoir rejoindre le héros sans traverser l'eau, la lave ni les piliers
 const passable=(c,r)=>{const ch2=g[r][c],pr=props[c+','+r];return ch2==='1'||PASSABLE.has(ch2)||isSoftDeco(ch2,pr)||isWalkDeco(ch2,pr);};
 const seen=new Set([start.c+','+start.r]),queue=[start];
 for(let i=0;i<queue.length;i++)for(const d of BK.DIRS){const c=queue[i].c+d.dx,r=queue[i].r+d.dy,k=c+','+r;if(c<1||r<1||c>=cols-1||r>=rows-1||seen.has(k)||!passable(c,r))continue;seen.add(k);queue.push({c,r});}
 const reachable=enemies.every(e=>seen.has(e.c+','+e.r)||BK.ENEMIES[e.type]?.behavior==='sea'||BK.ENEMIES[e.type]?.airborne||['wasp','mole','ghost'].includes(BK.ENEMIES[e.type]?.behavior));
 void isSolidDeco;
 return {grid:g.map(l=>l.join('')),props,enemies,reachable,theme:B.theme,night:!!B.night,cols,rows};
};
const baseStage=BK.challengeStage;
BK.challengeStage=ch=>{
 if(!ch.biome)return baseStage(ch);
 let arena=null;for(let n=0;n<40&&!arena?.reachable;n++)arena=BK.buildArena(n<30?ch:{...ch,noPools:true},hash(ch.id)+n*7919);
 const s=BK.mapToStage({id:'defi-'+ch.id,name:ch.name,cols:ch.cols,rows:ch.rows,theme:arena.theme,base:'.',grid:arena.grid,enemies:arena.enemies,props:arena.props,houses:{},npcs:[],shop:[]});
 s.id='Défi';s.hint=ch.desc;s.world={name:'Défis',theme:arena.theme};s.items=0.3;s.night=arena.night;s.objective='enemies';return s;
};
const loadStage=BK.Adventure.prototype.loadStage;
BK.Adventure.prototype.loadStage=function(keepPowers){loadStage.call(this,keepPowers);if(this.challenge&&this.stage.night&&this.world.dayCycle){this.world.time=BK.DAY_CYCLE*.6;this.world.wasNight=true;}};

// ------------------------------------------------------------------ Les tableaux à monstres
const ICONS={ballon:'🎈',guimauve:'🍥',gluant:'🟢',taupe:'🕳️',lapin:'🐰',fantome:'👻',plante:'🌱',guepe:'🐝',chevalier:'🛡️',cogneur:'🔨',squelette:'💀',bombe_coureuse:'💣',ninja_bombardier:'🥷',serpent:'🐍',cracheur:'🔥',glaceur:'❄️',chevalier_rouge:'🟥',chevalier_bleu:'🟦',magicien:'🧙',squelette_rouge:'☠️',clown_artificier:'🤡',canon:'🎯',lanceur:'🚀',marin:'🐙',loup_garou:'🐺',orque:'⚔️',squelette_noir:'🖤',canon_rouge:'💥',canon_bleu:'🔵',crapaud:'🐸',dragon_tricephale:'🐉',chevalier_dore:'👑',golem:'🗿',horde:'🌋'};
const SIZES=[null,[13,11],[15,11],[15,13],[17,13],[17,13]];
const M=(id,level,type,n,biome,name,desc,time,reward,extra={})=>({id,level,kind:'arena',icon:ICONS[type]||'👾',monster:type,enemies:[[type,n]],biome,name,desc,time,reward,cols:SIZES[level][0],rows:SIZES[level][1],soft:.3,...extra});
BK.MONSTER_CHALLENGES=[
 M('ballons',1,'ballon',4,'meadow','Prairie des ballounets','Quatre ballounets flottent dans une prairie fleurie. Fais-les tous éclater avant la fin du temps.',90,20),
 M('guimauves',1,'guimauve',5,'candy','Clairière sucrée','Cinq guimauves se dandinent entre les cadeaux et les buissons étoilés. Elles ne vont jamais bien loin.',90,20),
 M('gluants',1,'gluant',5,'swamp','Marais aux champignons','Cinq gluants te suivent à la trace entre les mares et les champignons.',110,25),
 M('taupes',1,'taupe',3,'field','Champ retourné','Trois taupes creusent sous la terre labourée et surgissent près de toi pour lancer des mottes.',110,25),
 M('lapins',1,'lapin',4,'potager','Le potager','Quatre lapins maléfiques dans le potager. Cueille les carottes : un lapin qui en mange une devient gentil.',120,30,{carrots:3}),
 M('fantomes',2,'fantome',4,'crypt','Cimetière hanté','Quatre fantômes glissent entre les tombes, la nuit. Ils passent à travers les blocs !',120,35),
 M('plantes',2,'plante',4,'jungle','Jungle vorace','Quatre plantes carnivores sortent du sol entre les fougères géantes. Approche au bon moment.',120,35),
 M('guepes',2,'guepe',4,'orchard','Verger bourdonnant','Quatre guêpes volent au-dessus des buissons de baies. On ne les touche que quand elles piquent.',120,35),
 M('chevaliers',2,'chevalier',3,'court','Cour du château','Trois chevaliers de pierre montent la garde entre les armures et les braseros. Évite les charges.',120,40),
 M('cogneurs',2,'cogneur',3,'quarry','La carrière','Trois cogneurs frappent le sol de la carrière : leur séisme casse les blocs autour d’eux.',120,40),
 M('squelettes',2,'squelette',4,'catacombs','Catacombes','Quatre squelettes lancent leur os en boomerang entre les colonnes fissurées.',120,40),
 M('coureuses',2,'bombe_coureuse',4,'fusefield','Champ de mèches','Quatre bombes coureuses t’attendent entre les tonneaux. Quand elles te voient, elles allument leur mèche !',120,40),
 M('ninjas',2,'ninja_bombardier',3,'dojo','Le dojo','Trois ninjas bombardiers s’entraînent sur le plancher de bois. Renvoie-leur leurs bombes.',120,40),
 M('serpents',3,'serpent',6,'desert','Désert aux serpents','Six serpents venimeux entre les cactus et les dunes. Une morsure et tu perds de la vie pendant six secondes.',120,55),
 M('cracheurs',3,'cracheur',4,'volcano','Gueule du volcan','Quatre cracheurs de feu au bord des coulées de lave. Leurs boules de feu rebondissent en ligne droite.',120,55),
 M('glaceurs',3,'glaceur',4,'icecave','Grotte gelée','Quatre souffleurs de glace entre les cristaux. Sur la glace, on glisse ; gelé, on attend que ça fonde.',120,55),
 M('rouges',3,'chevalier_rouge',3,'forge','La forge ardente','Trois chevaliers rouges chargent entre les enclumes et la lave. Plus vite, plus fort.',150,60),
 M('bleus',3,'chevalier_bleu',3,'bastion','Bastion de glace','Trois chevaliers bleus repartent tout de suite après leur charge, et le sol glacé n’aide pas.',150,60),
 M('magiciens',3,'magicien',3,'glade','Clairière enchantée','Trois magiciens se téléportent entre les cristaux arc-en-ciel. Détruis leur magie d’une flamme.',150,60),
 M('squelettes_rouges',3,'squelette_rouge',4,'crypt','Crypte rouge','Quatre squelettes rouges dans la crypte : leur os va à cinq cases et revient plus vite.',150,60),
 M('clowns',3,'clown_artificier',3,'circus','Le cirque','Trois clowns artificiers sur la piste. Leurs cadeaux sont de vraies bombes emballées !',150,60),
 M('canons',3,'canon',4,'ramparts','Les remparts','Quatre canons pivotent vers toi entre les braseros. Mets-toi à l’abri quand ils se gonflent.',120,55),
 M('lanceurs',3,'lanceur',3,'ramparts','Batterie de fusées','Trois lance-fusées tirent des fusées qui te suivent. Une flamme les détruit.',120,55),
 M('marins',3,'marin',2,'lagoon','Le lagon','Deux monstres marins vivent dans le lagon. Les flammes traversent l’eau : vise depuis la plage.',120,55),
 M('loups',3,'loup_garou',3,'darkforest','Forêt sombre','Trois loups-garous rôdent près de leur tanière, la nuit. Ils foncent dès qu’ils te voient.',150,60),
 M('orques',4,'orque',2,'camp','Le camp des orques','Deux orques en armure et leur shaman, qui les soigne, autour du feu de camp. Sépare-les !',180,90,{enemies:[['shaman',1],['orque',2]],group:true,icon:'⚔️'}),
 M('squelettes_noirs',4,'squelette_noir',5,'catacombs','Catacombes noires','Cinq squelettes noirs : plus rapides, et leur os va à sept cases.',180,90),
 M('canons_rouges',4,'canon_rouge',3,'forge','Canons de feu','Trois canons rouges tirent des boulets enflammés entre les coulées de lave.',150,85),
 M('canons_bleus',4,'canon_bleu',3,'bastion','Canons de glace','Trois canons bleus tirent deux fois plus souvent, des boulets lents mais nombreux.',150,85),
 M('crapaud',4,'crapaud',1,'pond','La mare du crapaud','Le crapaud géant règne sur la mare. Gare à sa langue collante et à sa grande gueule.',180,90),
 M('dragon',4,'dragon_tricephale',1,'volcano','L’antre du dragon','Le dragon à trois têtes crache un feu qui brûle au sol. Chaque tête a sa propre vie.',180,100),
 M('dore',5,'chevalier_dore',1,'throne','Salle du trône','Le chevalier doré et sa garde défendent le trône : deux rouges, deux bleus. Huit bombes pour le doré !',180,130,{enemies:[['chevalier_dore',1],['chevalier_rouge',2],['chevalier_bleu',2]]}),
 M('golem',5,'golem',1,'quarry','Le Roi Golem','Le Roi Golem sort de la carrière. Dix coups et des ondes de choc : garde tes distances.',240,150),
 M('horde',5,'horde',0,'volcano','La horde','Deux orques, un shaman, trois serpents et trois lapins au pied du volcan. Bonne chance…',240,150,{enemies:[['shaman',1],['orque',2],['serpent',3],['lapin',3]],group:true,carrots:2,cols:19,rows:15})
];

// ------------------------------------------------------------------ Duels : battre toute la famille
BK.DUEL_FOE_GOLD=[0,10,15,20,30];   // or par adversaire vaincu la première fois, selon le niveau du style
BK.duelOthers=charId=>BK.ORDER.filter(id=>id!==charId);
BK.duelBeaten=(ch,prog)=>(prog||BK.loadChallenges())[ch.id]?.beaten||{};
BK.duelProgress=(ch,charId,prog)=>{const beaten=BK.duelBeaten(ch,prog),others=BK.duelOthers(charId);return {count:others.filter(id=>beaten[id]).length,total:others.length};};
BK.defaultDuelFoes=(charId,ch,prog)=>{const beaten=BK.duelBeaten(ch,prog),others=BK.duelOthers(charId);return [...others.filter(id=>!beaten[id]),...others.filter(id=>beaten[id])].slice(0,ch.foes);};
BK.awardDuel=(ch,score,charId,foes)=>{
 const prog=BK.loadChallenges(),p=prog[ch.id]||(prog[ch.id]={done:0,best:0});p.beaten=p.beaten||{};
 const fresh=foes.filter(id=>id!==charId&&!p.beaten[id]);for(const id of fresh)p.beaten[id]=true;
 const complete=BK.duelOthers(charId).every(id=>p.beaten[id]),first=complete&&!p.done;
 const gold=fresh.length?fresh.length*BK.DUEL_FOE_GOLD[ch.level]:5,bonus=first?ch.reward:0;
 if(complete)p.done=(p.done||0)+1;
 if(p.scoreVersion!==2){p.legacyBest=p.best||0;p.best=0;}p.scoreVersion=2;p.best=Math.max(p.best||0,score);p.medal=BK.challengeMedal(p.best).name;
 BK.saveChallenges(prog);BK.addGold(gold+bonus);
 const save=BK.loadAdventure(charId),medal=BK.challengeMedal(score),records=save.challengeRecords||(save.challengeRecords={}),old=records[ch.id],xp=Math.round(medal.xp*ch.level*(fresh.length?1:.25)),before=BK.levelFromXp(save.xp||0).level;
 save.xp=(save.xp||0)+xp;const level=BK.levelFromXp(save.xp).level;save.points=(save.points||0)+level-before;save.gold=BK.loadGold();records[ch.id]={done:(old?.done||0)+1,best:Math.max(old?.best||0,score)};BK.saveAdventure(charId,save);
 return {gold:gold+bonus,bonus,fresh,complete,first,medal,xp,level,progress:BK.duelProgress(ch,charId,prog)};
};
BK.duelResultHtml=(ch,score,r)=>{
 const names=r.fresh.map(id=>BK.charById(id).name);
 return '<p class="big">'+r.medal.icon+' '+r.medal.name+' · '+score+' / 1 000</p><p>+'+r.xp+' XP · Niveau '+r.level+'</p>'
  +(names.length?'<p>🥊 Première victoire contre '+names.join(', ')+' : <i class="goldcoin"></i> +'+(BK.DUEL_FOE_GOLD[ch.level]*names.length)+' pièces</p>':'<p>Déjà vaincus dans ce style : <i class="goldcoin"></i> +5 pièces</p>')
  +(r.first?'<p class="big">🏆 Style complété ! Toute la famille est vaincue : +'+r.bonus+' pièces</p>':'<p>👥 '+r.progress.count+' / '+r.progress.total+' vaincus · '+ch.name+'</p>');
};
// Sélecteur de membres de la famille (duels : les adversaires ; curling : les trois autres joueurs).
BK.familyPicker=(charId,o)=>{
 const prog=BK.loadChallenges(),beaten=o.beaten||{},picked=new Set(o.preset||[]);
 const cards=BK.duelOthers(charId).map(id=>{const d=BK.charById(id);return '<button type="button" class="family-pick'+(picked.has(id)?' sel':'')+'" data-id="'+id+'" style="--c:'+d.outfit+'"><span class="pick-portrait" data-id="'+id+'"></span><span>'+d.name+'</span>'+(beaten[id]?'<i>✓ vaincu</i>':'')+'</button>';}).join('');
 BK.overlay.show({playful:'challenge',title:o.title,html:'<p class="challenge-instruction">'+o.desc+'</p><p class="pick-hint">'+o.hint+'</p><div class="family-picker">'+cards+'</div>',buttons:[{label:'← Retour',onClick:()=>BK.overlay.hide()},{label:'C’est parti ! →',primary:true,onClick:()=>{const ids=[...document.querySelectorAll('#overlay .family-pick.sel')].map(b=>b.dataset.id);if(ids.length!==o.count){const hint=document.querySelector('#overlay .pick-hint');if(hint){hint.textContent='Il faut choisir exactement '+o.count+' personne'+(o.count>1?'s':'')+' !';hint.classList.add('warn');}return;}BK.overlay.hide();o.onPick(ids);}}]});
 void prog;
 for(const el of document.querySelectorAll('#overlay .pick-portrait'))if(BK.portrait)el.append(BK.portrait(BK.charById(el.dataset.id),64));
 for(const b of document.querySelectorAll('#overlay .family-pick'))b.addEventListener('click',()=>{BK.audio.click();if(b.classList.contains('sel')){b.classList.remove('sel');return;}const sel=document.querySelectorAll('#overlay .family-pick.sel');if(sel.length>=o.count)sel[0].classList.remove('sel');b.classList.add('sel');});
};
BK.pickDuelFoes=(charId,ch)=>{
 const prog=BK.loadChallenges(),pr=BK.duelProgress(ch,charId,prog);
 BK.familyPicker(charId,{title:ch.icon+' '+ch.name,desc:ch.desc+' Chaque membre de la famille battu pour la première fois dans ce style rapporte '+BK.DUEL_FOE_GOLD[ch.level]+' pièces ; bats tout le monde pour le bonus de '+ch.reward+' pièces. 👥 '+pr.count+' / '+pr.total+' vaincus.',hint:'Choisis '+ch.foes+' adversaire'+(ch.foes>1?'s':'')+' (✓ = déjà vaincu dans ce style). 3 cœurs chacun !',count:ch.foes,beaten:BK.duelBeaten(ch,prog),preset:BK.defaultDuelFoes(charId,ch,prog),onPick:ids=>BK.startChallenge(charId,ch,{foes:ids})});
};
BK.pickCurlingFamily=(charId,ch)=>{
 const kids=BK.duelOthers(charId).sort((a,b)=>(['enfant','toutpetit'].includes(BK.charById(a).role)?0:1)-(['enfant','toutpetit'].includes(BK.charById(b).role)?0:1)).slice(0,3);
 BK.familyPicker(charId,{title:ch.icon+' '+ch.name,desc:ch.desc,hint:'Choisis les 3 autres joueurs. Chacun lance à son tour : on se passe le clavier !',count:3,preset:kids,onPick:ids=>BK.startChallenge(charId,ch,{players:[charId,...ids]})});
};

// ------------------------------------------------------------------ Bon timing : le curling des bombes
const CURL_COLS=23,CURL_ROWS=9,ZONE_END=5,BENCH_ROW=CURL_ROWS,START={c:3,r:4};
const RINGS=[[.5,10,'Centre !!!'],[1.5,7,'Presque !'],[2.5,4,'Pas mal'],[3.5,2,'Au bord']];
const RING_COLORS=['#ff5d5d','#ffffff','#4c8dff','#ffffff'];
BK.curlingPoints=d=>{for(const [r,pts] of RINGS)if(d<r)return pts;return 0;};
BK.curlingLabel=pts=>{const ring=RINGS.find(x=>x[1]===pts);return ring?ring[2]:'Raté…';};
BK.curlingMaxPoints=ch=>RINGS[0][1]*ch.throws;
BK.curlingTargets=(ch,seed)=>{const R=rng(seed),out=[];let prev=null;for(let i=0;i<ch.throws*(ch.family?4:1);i++){let t,guard=0;do{const sp=ch.spread||1;t={c:11+Math.floor(R()*(sp===1?6:sp===2?8:9))+(sp===1?1:0),r:sp===1?4:sp===2?2+Math.floor(R()*5):1+Math.floor(R()*7)};guard++;}while(prev&&t.c===prev.c&&t.r===prev.r&&guard<20);out.push(t);prev=t;}return out;};
BK.curlingMap=()=>{const g=[];for(let r=0;r<CURL_ROWS;r++){let line='';for(let c=0;c<CURL_COLS;c++)line+=c===0||r===0||c===CURL_COLS-1||r===CURL_ROWS-1?'#':c<=ZONE_END?')':']';g.push(line);}
 let bench='';for(let c=0;c<CURL_COLS;c++)bench+=[5,9,13,17].includes(c)?'n':')';g.push(bench);return g;};
BK.curlingThresholds=ch=>{const max=BK.curlingMaxPoints(ch),t=ch.target||0;return {bronze:t,silver:Math.ceil(t+(max-t)*.43),gold:Math.ceil(t+(max-t)*.79)};};
BK.curlingScore=(ch,points,won)=>{if(!won)return 0;const max=BK.curlingMaxPoints(ch),t=ch.target||0;return Math.max(300,Math.min(1000,Math.round(300+700*(points-t)/Math.max(1,max-t))));};
const LINES=['Allez, vise le centre !','Tu vas rater, c’est sûr ! 😜','C’est looong…','Mon tour ! Mon tour !','🍿 miam miam','Pfff, facile !','Hé ho, on s’endort !','Je suis le meilleur ! 💪','Regarde, un écureuil ! 🐿️','Zzz… hein ? quoi ?','Botte-la ! BOTTE-LA !','On fait la vague ?','J’ai faim. 🍕','Ma bombe à moi sera au centre.','Attention, elle va exploser ! 💥'];
const CHEERS={10:['WOW !!! 🎯','INCROYABLE !','Au centre ! 🏆'],7:['Bien joué !','Ooooh, presque !','Pas mal du tout !'],4:['Hé hé 😏','Bof bof…','Ça compte ?'],2:['Au bord ! 😬','Juste juste !','Ouf…'],0:['Hahaha ! 😂','Raté ! 🙈','C’est à moi, là ?']};
const pick=(R,arr)=>arr[Math.floor(R()*arr.length)];
class Curling{
 constructor(charId,ch,o){
  o=o||{};this.charId=charId;this.ch=ch;this.family=!!ch.family;this.ids=o.players||[charId];
  const W=this.world=new BK.World({map:BK.curlingMap(),theme:'winter',mode:'match',explore:true,hearts:true,itemChance:0,dayCycle:false});
  W.hitPlayer=()=>false;W.pickupBomb=()=>false;   // personne n'est blessé, personne ne lance : on botte !
  this.players=this.ids.map(id=>{const p=W.addPlayer(BK.charById(id),START.c,START.r,{bombs:1,fire:1,kick:true});p.points=0;p.throws=0;p.results=[];p.inv=[];p.found=[];p.quickSlots=[];p.bagSlots=[];return p;});
  this.players.forEach((p,i)=>{if(i){p.benchSpot=i-1;this.toBench(p,i-1);}});
  this.R=rng(hash(ch.id)+(o.seed||Date.now()%100000));
  this.targets=BK.curlingTargets(ch,hash(ch.id)+(o.seed||0));
  this.throwsTotal=ch.throws*this.players.length;this.throwIndex=0;this.turn=0;this.round=1;this.active=this.players[0];this.target=this.targets[0];
  this.cam=new BK.Camera(BK.W,BK.H);this.cam.fit(CURL_COLS,CURL_ROWS+1,{top:118,bottom:24,left:30,right:30});
  this.state='intro';this.t=0;this.msg=null;this.msgT=0;this.waveT=9;this.banner=null;W.frozen=true;this.elapsed=0;
  const base=W.renderArenaEffects;W.renderArenaEffects=(ctx,cam,time,push)=>{base.call(W,ctx,cam,time,push);this.drawSheet(ctx,cam,push);};
 }
 waiting(){return this.players.filter(p=>p!==this.active);}
 toBench(p,i){const spots=[7,11,15];p.x=spots[i%3]+.5;p.y=BENCH_ROW+.5;p.dir=0;p.npc=true;p.human=false;p.input.dx=p.input.dy=0;p.antic=null;p.anticT=.8+i*.7;p.bubble=null;this.world.setPose(p,'idle');}
 toStart(p){p.x=START.c+.5;p.y=START.r+.5;p.dir=3;p.npc=false;p.human=true;p.antic=null;p.bubble=null;p.input.dx=p.input.dy=0;this.world.setPose(p,'idle');this.world.burst(p.x,p.y,.5,'#ffffff',14);}
 toast(text,dur=2){this.msg=text;this.msgT=dur;}
 // ---- tours
 beginTurn(){
  const prev=this.active,next=this.players[this.turn];this.pendingTurn={prev,next};
  if(this.family&&(prev!==next||this.throwIndex===0)){this.state='handoff';this.world.frozen=true;BK.overlay.show({playful:'challenge',title:'🥌 Au tour de '+next.name+' !',html:'<p class="big">Passe le clavier à '+next.name+'.</p><p>Manche '+this.round+' / '+this.ch.throws+' · '+(next.points)+' point'+(next.points>1?'s':'')+' jusqu’ici</p>',buttons:[{label:'Je suis prêt ! →',primary:true,onClick:()=>{BK.overlay.hide();BK.input.keys.clear();BK.input.flush();this.confirmTurn();}}]});}
  else this.confirmTurn();
 }
 confirmTurn(){
  const {prev,next}=this.pendingTurn||{};if(!next)return;this.pendingTurn=null;
  if(prev!==next){prev.benchSpot=next.benchSpot;this.toBench(prev,prev.benchSpot);this.toStart(next);}else{next.npc=false;next.human=true;}
  this.active=next;this.state='play';this.world.frozen=false;this.banner={text:'🥌 '+next.name+' : lancer '+(next.throws+1)+' / '+this.ch.throws,t:2.2};BK.audio.go();
 }
 scoreThrow(c,r,bomb){
  const p=this.active,d=Math.hypot(c-this.target.c,r-this.target.r),kicked=!!bomb.kicker,pts=kicked?BK.curlingPoints(d):0;
  p.points+=pts;p.results.push(pts);this.lastThrow={pts,label:kicked?BK.curlingLabel(pts):'Il faut la botter !',c,r,t:0};
  this.state='scored';this.t=0;this.world.setPose(p,pts>=7?'win':pts?'idle':'lose',1.6);
  if(pts>=7)BK.audio.fanfare?.();else if(!pts)BK.audio.lose();else BK.audio.coin();
  for(const s of this.waiting())this.react(s,pts);
 }
 nextTurn(){
  this.active.throws++;this.throwIndex++;
  if(this.throwIndex>=this.throwsTotal)return this.finish();
  this.target=this.targets[this.throwIndex%this.targets.length];
  if(this.family){this.turn=(this.turn+1)%this.players.length;if(this.turn===0)this.round++;}
  this.beginTurn();
 }
 finish(){
  this.state='result';this.world.frozen=true;const ch=this.ch,me=this.players[0];
  const sorted=[...this.players].sort((a,b)=>b.points-a.points),best=sorted[0].points,winners=sorted.filter(p=>p.points===best);
  const won=this.family?winners.includes(me):me.points>=ch.target;
  const score=this.family?Math.max(300,Math.min(1000,Math.round(300+700*me.points/Math.max(1,BK.curlingMaxPoints(ch)*.6)))):BK.curlingScore(ch,me.points,won);
  for(const p of this.players)this.world.setPose(p,winners.includes(p)?'win':'lose',99);
  const next=BK.nextChallenge(ch),ranking=this.family?'<div class="tally">'+sorted.map(p=>'<div class="t"><b style="color:'+p.color+'">'+(winners.includes(p)?'🏆 ':'')+p.name+'</b><span>'+p.points+' pts</span></div>').join('')+'</div>':'';
  setTimeout(()=>{
   if(won){const reward=BK.awardChallenge(ch,score,this.charId);BK.audio.win();BK.overlay.show({playful:'challenge',title:this.family?'🏆 '+me.name+' gagne la partie !':'Défi réussi !',html:(this.family?ranking:'<p class="big">🥌 '+me.points+' points sur '+BK.curlingMaxPoints(ch)+'</p>')+BK.challengeResultHtml(ch,score,reward),buttons:[...(next?[{label:'Défi suivant : '+next.name,primary:true,onClick:()=>{BK.overlay.hide();BK.startChallenge(this.charId,next);}}]:[]),{label:'Rejouer',onClick:()=>{BK.overlay.hide();BK.startChallenge(this.charId,ch,{players:this.ids});}},{label:'Retour aux défis',primary:!next,onClick:()=>{BK.overlay.hide();BK.showChallenges(this.charId);}},{label:'Menu',onClick:()=>{BK.overlay.hide();BK.toMenu();}}]});}
   else{BK.audio.lose();BK.overlay.show({playful:'challenge',title:this.family?'🏆 '+winners.map(p=>p.name).join(' et ')+(winners.length>1?' gagnent':' gagne')+' !':'Défi raté',html:this.family?ranking+'<p>'+me.name+' n’a pas gagné cette fois. On remet ça ?</p>':'<p class="big">🥌 '+me.points+' points</p><p>Il en fallait '+ch.target+'. On réessaie ?</p>',buttons:[{label:'Rejouer',primary:true,onClick:()=>{BK.overlay.hide();BK.startChallenge(this.charId,ch,{players:this.ids});}},{label:'Retour aux défis',onClick:()=>{BK.overlay.hide();BK.showChallenges(this.charId);}}]});}
  },900);
 }
 showPause(){this.state='pause';this.world.frozen=true;BK.input.keys.clear();BK.input.flush();BK.overlay.show({playful:'pause',title:'⏸ Petite pause !',text:'💣 Espace : pose la bombe dans ta zone de neige · ⏱ attends le bon moment · 🦵 avance dessus pour la botter vers la cible. Centre 10 · 7 · 4 · 2 points.',buttons:[{label:'▶ Continuer',primary:true,onClick:()=>{BK.overlay.hide();this.state='play';this.world.frozen=false;}},{label:'↩ Quitter',onClick:()=>{BK.overlay.hide();BK.toMenu();}}]});}
 // ---- les spectateurs font les fous
 react(s,pts){const R=this.R;s.bubble={text:pick(R,CHEERS[pts]||CHEERS[0]),t:0,dur:2.2};s.antic={kind:pts>=7?'dance':pts?'cheer':'laugh',t:0,dur:2};this.world.setPose(s,pts>=7?'win':pts?'jump':'hit',2);s.anticT=2.4+R()*2;}
 startAntic(s,kind){
  const R=this.R,W=this.world;kind=kind||pick(R,['dance','sleep','cheer','spin','fly','popcorn','cheer','stretch']);
  s.antic={kind,t:0,dur:kind==='sleep'?3.2:kind==='spin'?1.3:kind==='popcorn'?2.4:kind==='fly'?.7:kind==='wave'?.9:2};
  if(kind==='dance'){W.setPose(s,'win',2);s.bubble={text:pick(R,['🎶 La la la !','💃 Danse de la victoire !','🕺']),t:0,dur:2};}
  else if(kind==='sleep'){W.setPose(s,'lose',3.2);s.bubble={text:'Zzz…',t:0,dur:3.2,sleep:true};}
  else if(kind==='cheer'){W.setPose(s,'jump',2);s.bubble={text:pick(R,LINES),t:0,dur:2.2};}
  else if(kind==='spin'){s.bubble={text:'🌀 Je tourne !',t:0,dur:1.3};}
  else if(kind==='fly'){W.setPose(s,'hit',.7);s.bubble={text:'Aïe, une mouche ! 🪰',t:0,dur:1.4};}
  else if(kind==='popcorn'){W.setPose(s,'drink',2.4);s.bubble={text:'🍿 crounch crounch',t:0,dur:2.4};}
  else if(kind==='stretch'){W.setPose(s,'pickup',2);s.bubble={text:pick(R,['Je m’échauffe ! 🤸','Mes lacets… 👟']),t:0,dur:2};}
  else if(kind==='wave'){W.setPose(s,'win',.9);s.bubble={text:'🙌 LA VAGUE !',t:0,dur:.9};}
  s.anticT=s.antic.dur+1.2+R()*2.5;this.antics=(this.antics||0)+1;
 }
 tickSpectators(dt){
  const list=this.waiting();if(!list.length)return;
  this.waveT-=dt;if(this.waveT<=0){this.waveT=11+this.R()*8;list.forEach((s,i)=>{s.anticT=i*.35+.01;s.waveNext=true;});}
  for(const s of list){
   s.anticT=(s.anticT??1)-dt;
   if(s.antic){s.antic.t+=dt;if(s.antic.kind==='spin')s.dir=Math.floor(s.antic.t*7)%4;if(s.antic.t>=s.antic.dur){s.antic=null;s.dir=0;}}
   if(s.bubble){s.bubble.t+=dt;if(s.bubble.t>=s.bubble.dur)s.bubble=null;}
   if(s.anticT<=0&&!s.antic){if(s.waveNext){s.waveNext=false;this.startAntic(s,'wave');}else this.startAntic(s);}
  }
 }
 // ---- boucle
 update(dt){
  const W=this.world,K=BK.input;this.t+=dt;if(this.msgT>0)this.msgT-=dt;if(this.banner){this.banner.t-=dt;if(this.banner.t<=0)this.banner=null;}
  if(this.state==='intro'){W.update(dt);if(this.t>.4&&(K.hitAny()||K.touch.bomb||this.t>8)){K.touch.bomb=false;this.beginTurn();}return;}
  if(this.state==='handoff'||this.state==='pause'||this.state==='result'){W.update(dt);this.tickSpectators(dt);return;}
  if(this.state==='scored'){W.update(dt);this.tickSpectators(dt);if(this.lastThrow)this.lastThrow.t+=dt;if(this.t>1.7)this.nextTurn();return;}
  if(K.hit(['Escape','KeyP'])){this.showPause();return;}
  K.read(this.active,0);W.update(dt);BK.audio.events(W.events);this.elapsed+=dt;this.tickSpectators(dt);
  for(const e of W.events){
   if(e.type==='bombPlaced'&&e.player===this.active){
    if(e.bomb.cx>ZONE_END){const i=W.bombs.indexOf(e.bomb);if(i>=0)W.bombs.splice(i,1);e.bomb.exploded=true;this.active.bombsOut=Math.max(0,this.active.bombsOut-1);this.toast('Pose ta bombe dans ta zone, sur la neige !',2.2);BK.audio.block();}
    else{e.bomb.curling=true;this.toast('Attends le bon moment, puis avance dessus pour la botter !',2.5);}
   }
   if(e.type==='bombKicked'&&e.bomb.curling&&!e.bomb.kickedOnce){e.bomb.kickedOnce=true;this.toast('Elle glisse… 🥌',1.2);}
   if(e.type==='explosion'&&e.bomb?.curling&&!e.bomb.scored){e.bomb.scored=true;this.scoreThrow(e.c,e.r,e.bomb);}
  }
 }
 // ---- dessin : la zone de lancer, la cible en anneaux, la bannière, les bulles
 ground(ctx,cam,pts,fill,stroke){ctx.beginPath();pts.forEach((q,i)=>{const p=cam.project(q[0],q[1],.03);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
 drawSheet(ctx,cam,push){
  const T=this.target;
  push(.95,ZONE_END/2,()=>{ctx.save();ctx.lineWidth=3;this.ground(ctx,cam,[[1,1],[ZONE_END+1,1],[ZONE_END+1,CURL_ROWS-1],[1,CURL_ROWS-1]],'rgba(80,150,255,.22)','rgba(255,255,255,.75)');ctx.setLineDash([10,8]);this.ground(ctx,cam,[[ZONE_END+1,1],[ZONE_END+1,CURL_ROWS-1]],null,'#ffe16b');ctx.setLineDash([]);
   const q=cam.project(1+ZONE_END/2,1.55,.05);ctx.font='900 '+Math.round(q.k*.42)+'px Nunito,sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#2d4a7a';ctx.lineWidth=4;ctx.strokeText('TA ZONE',q.x,q.y);ctx.fillText('TA ZONE',q.x,q.y);ctx.restore();});
  push(Math.max(1,T.r-3.5)+.02,T.c+.5,()=>{ctx.save();ctx.lineWidth=2;
   for(let i=RINGS.length-1;i>=0;i--){const rad=RINGS[i][0],pts=[];for(let k=0;k<40;k++){const a=k/40*Math.PI*2;pts.push([T.c+.5+Math.cos(a)*rad,T.r+.5+Math.sin(a)*rad]);}this.ground(ctx,cam,pts,RING_COLORS[i]+(i%2?'cc':'dd'),'rgba(40,60,100,.35)');}
   const q=cam.project(T.c+.5,T.r+.5,.04);ctx.font='900 '+Math.round(q.k*.32)+'px Nunito,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.strokeStyle='#8b1d1d';ctx.lineWidth=3;ctx.strokeText('10',q.x,q.y);ctx.fillText('10',q.x,q.y);
   for(const [i,pts] of [[1,7],[2,4],[3,2]]){const r=cam.project(T.c+.5,T.r+.5-RINGS[i][0]+.5,.04);ctx.font='900 '+Math.round(r.k*.26)+'px Nunito,sans-serif';ctx.fillStyle=i%2?'#2d4a7a':'#fff';ctx.strokeStyle=i%2?'#fff':'#2d4a7a';ctx.strokeText(String(pts),r.x,r.y);ctx.fillText(String(pts),r.x,r.y);}
   ctx.restore();});
 }
 render(ctx){
  const W=this.world,cam=this.cam;W.render(ctx,cam,{names:true});
  ctx.save();ctx.textBaseline='middle';
  // mèche des bombes
  for(const b of W.bombs)if(b.curling&&!b.exploded){const p=cam.project(b.x,b.y,.9);ctx.font='bold 18px Nunito,sans-serif';ctx.textAlign='center';ctx.strokeStyle='#243442';ctx.lineWidth=4;ctx.fillStyle=b.t<.8?'#ff8f6b':'#ffe460';const label=Math.max(0,b.t).toFixed(1)+' s';ctx.strokeText(label,p.x,p.y);ctx.fillText(label,p.x,p.y);}
  // bulles des spectateurs
  for(const s of this.waiting())if(s.bubble){const q=cam.project(s.x,s.y,1.75),text=s.bubble.sleep?'Zzz'+'.'.repeat(1+Math.floor(s.bubble.t*2)%3):s.bubble.text;ctx.font='bold 16px Nunito,sans-serif';const w=ctx.measureText(text).width+22,x=Math.max(8,Math.min(BK.W-w-8,q.x-w/2)),y=q.y-40+Math.sin(s.bubble.t*6)*2;ctx.fillStyle='#fff';ctx.strokeStyle='#2d4a7a';ctx.lineWidth=2;BK.sprites.rr(ctx,x,y-14,w,28,12);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(q.x-6,y+13);ctx.lineTo(q.x+6,y+13);ctx.lineTo(q.x,y+22);ctx.closePath();ctx.fill();ctx.fillStyle='#2d3a5c';ctx.textAlign='center';ctx.fillText(text,x+w/2,y);}
  // tableau des joueurs
  const n=this.players.length,cw=this.family?190:300,gap=12,x0=16;
  this.players.forEach((p,i)=>{const x=x0+i*(cw+gap),act=p===this.active&&this.state!=='intro';BK.sprites.uiPanel(ctx,x,12,cw,56,{fill:act?'rgba(255,236,140,.95)':undefined,border:act?'#ffc53f':undefined});ctx.fillStyle=p.color;BK.sprites.rr(ctx,x,12,10,56,5);ctx.fill();
   ctx.textAlign='left';ctx.font='bold 19px Nunito,sans-serif';ctx.fillStyle=BK.sprites.UI.text;ctx.fillText(p.name+(act?' 🥌':''),x+20,30);
   ctx.font='bold 15px Nunito,sans-serif';ctx.fillStyle=BK.sprites.UI.gold;ctx.fillText(p.points+' pt'+(p.points>1?'s':'')+'   ·   '+p.results.map(r=>r||'·').join(' ')+(p.throws<this.ch.throws?' '+'_ '.repeat(this.ch.throws-p.throws).trim():''),x+20,52,cw-30);});
  // objectif et lancer
  const th=BK.curlingThresholds(this.ch),bx=BK.W-450;BK.sprites.uiPanel(ctx,bx,12,314,56);ctx.textAlign='right';ctx.font='bold 18px Nunito,sans-serif';ctx.fillStyle=BK.sprites.UI.text;
  ctx.fillText(this.family?'Manche '+Math.min(this.round,this.ch.throws)+' / '+this.ch.throws+'  ·  lancer '+Math.min(this.throwIndex+1,this.throwsTotal)+' / '+this.throwsTotal:'Lancer '+Math.min(this.throwIndex+1,this.throwsTotal)+' / '+this.throwsTotal+'  ·  objectif '+this.ch.target+' pts',BK.W-150,30);
  ctx.font='bold 14px Nunito,sans-serif';ctx.fillStyle=BK.sprites.UI.gold;ctx.fillText(this.family?'Le plus de points gagne · 10 · 7 · 4 · 2':'🥉 '+th.bronze+'  ·  🥈 '+th.silver+'  ·  🥇 '+th.gold+' points',BK.W-150,53);
  // message, bannière, résultat du lancer
  ctx.textAlign='center';
  if(this.msgT>0&&this.msg){ctx.font='bold 18px Nunito,sans-serif';const w=ctx.measureText(this.msg).width+40;BK.sprites.uiPanel(ctx,BK.W/2-w/2,BK.H-54,w,38,{r:12});ctx.fillStyle=BK.sprites.UI.text;ctx.fillText(this.msg,BK.W/2,BK.H-35);}
  if(this.banner){ctx.font='900 34px Nunito,sans-serif';ctx.globalAlpha=Math.min(1,this.banner.t*2);ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText(this.banner.text,BK.W/2+3,BK.H*.38+3);ctx.fillStyle='#ffe16b';ctx.fillText(this.banner.text,BK.W/2,BK.H*.38);ctx.globalAlpha=1;}
  if(this.state==='scored'&&this.lastThrow){const L=this.lastThrow,q=cam.project(L.c+.5,L.r+.5,1.2+Math.min(1,L.t)*.8);ctx.font='900 '+(44+Math.min(1,L.t*3)*16)+'px Nunito,sans-serif';ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText('+'+L.pts,q.x+3,q.y+3);ctx.fillStyle=L.pts>=7?'#7cff9a':L.pts?'#ffe16b':'#ff8f8f';ctx.fillText('+'+L.pts,q.x,q.y);ctx.font='900 30px Nunito,sans-serif';ctx.fillStyle='#fff';ctx.strokeStyle='#2d3a5c';ctx.lineWidth=5;ctx.strokeText(L.label,BK.W/2,BK.H*.3);ctx.fillText(L.label,BK.W/2,BK.H*.3);}
  if(this.state==='intro'){ctx.font='900 64px Nunito,sans-serif';ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText('🥌 Bon timing !',BK.W/2+4,BK.H*.42+4);ctx.fillStyle='#ffe16b';ctx.fillText('🥌 Bon timing !',BK.W/2,BK.H*.42);ctx.font='bold 22px Nunito,sans-serif';ctx.fillStyle='#fff';ctx.strokeStyle='#2d3a5c';ctx.lineWidth=5;const lines=['Pose ta bombe dans ta zone (Espace), attends le bon moment,','puis avance dessus pour la botter vers la cible !',this.family?'Chacun son tour, on se passe le clavier. Appuie sur une touche !':this.ch.throws+' lancers, '+this.ch.target+' points pour réussir. Appuie sur une touche !'];lines.forEach((l,i)=>{ctx.strokeText(l,BK.W/2,BK.H*.42+50+i*30);ctx.fillText(l,BK.W/2,BK.H*.42+50+i*30);});}
  ctx.restore();
 }
}
BK.Curling=Curling;
BK.CURLING_CHALLENGES=[
 {id:'curl1',level:1,kind:'curling',icon:'🥌',name:'Premier curling',throws:8,target:28,spread:1,reward:25,desc:'Huit lancers, la cible reste sur ta ligne. Pose ta bombe dans ta zone, attends le bon moment et botte-la : plus elle explose près du centre, plus tu marques (10 · 7 · 4 · 2). Il faut 28 points.'},
 {id:'curl2',level:2,kind:'curling',icon:'🥌',name:'Cibles baladeuses',throws:8,target:40,spread:2,reward:40,desc:'Huit lancers et la cible change de place à chaque fois : choisis bien ta ligne avant de poser la bombe. Il faut 40 points.'},
 {id:'curl3',level:3,kind:'curling',icon:'🥌',name:'Maître du curling',throws:8,target:52,spread:3,reward:60,desc:'Huit cibles partout sur la glace, parfois tout au fond. Il faut 52 points : vise le centre !'},
 {id:'curlfam',level:2,kind:'curling',family:true,icon:'👨‍👩‍👧‍👦',name:'Curling en famille',throws:4,target:0,spread:2,reward:45,desc:'Quatre joueurs, chacun son tour, quatre lancers chacun. Les autres attendent sur le banc… et font les fous. Le plus de points gagne !'}
];
BK.CHALLENGES.push(...BK.MONSTER_CHALLENGES,...BK.CURLING_CHALLENGES);
BK.CHALLENGES.sort((a,b)=>a.level-b.level);
})(window.BK);
