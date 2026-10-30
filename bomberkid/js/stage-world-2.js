// Monde du château : cartes composées à la main, avec sols explicites sous chaque objet.
(function(BK){
'use strict';
BK.THEMES.castleHall={...BK.THEMES.castle,name:'Château intérieur',sky:['#17182d','#39334c'],mountain:'#222239',fog:'#17182d'};
BK.THEMES.castleCrypt={...BK.THEMES.castleHall,name:'Souterrains',floor:'#626b76',floor2:'#56616d',sky:['#111b28','#273c4a'],fog:'#111b28'};
BK.THEMES.castleRift={...BK.THEMES.castle,name:'Faille magique',floor:'#8471b5',floor2:'#73609d',hard:'#4d356c',hardTop:'#8968b2',hardDark:'#302043',sky:['#160e35','#77439d'],mountain:'#291743',fog:'#1b1038'};
function map(id,name,w,h,theme='castle'){
 const g=Array.from({length:h},()=>Array(w).fill(' ')),props={},enemies=[],houses={},npcs=[];
 const m={id,name,w,h,theme,g,props,enemies,houses,npcs,
  tile(c,r,ch,extra={}){if(c<0||r<0||c>=w||r>=h)throw Error(id+' outside '+c+','+r);const old=g[r][c],floor=',.-_%yzq=['.includes(old)?old:props[c+','+r]?.floor||'.';g[r][c]=ch;delete props[c+','+r];if(!' ,.-_%yzq=['.includes(ch)||Object.keys(extra).length)props[c+','+r]={lv:0,floor,...extra};return m;},
  rect(x,y,xx,yy,ch){for(let r=y;r<=yy;r++)for(let c=x;c<=xx;c++)m.tile(c,r,ch);return m;},
  room(x,y,xx,yy,floor='.'){m.rect(x,y,xx,yy,'#');m.rect(x+1,y+1,xx-1,yy-1,floor);return m;},
  deco(c,r,deco,extra={}){return m.tile(c,r,'"',{deco,...extra});},
  item(c,r,item){return m.tile(c,r,'"',{item});},
  enemy(type,c,r){m.tile(c,r,',.-_%yzq='.includes(g[r][c])?g[r][c]:props[c+','+r]?.floor||'.');enemies.push({type,c,r});return m;},
  maze(x,y,xx,yy){m.room(x,y,xx,yy,'.');for(let r=y+2;r<yy;r++)for(let c=x+2;c<xx;c++){if((c-x)%2===0&&(r-y)%2===0)m.tile(c,r,'#');else if((c*7+r*11)%5<2)m.tile(c,r,'x');}return m;},
  gate(r,letter,c=Math.floor(w/2)){m.rect(1,r,w-2,r,'#');m.rect(c-1,r,c+1,r,letter.toLowerCase());return m;},
  lamps(x,xx,rows,color='purple'){for(const r of rows)for(const c of [x,xx])m.deco(c,r,'lamp',{lightColor:color});return m;},
  finish(hint,extra={}){
   for(const e of enemies.filter(e=>e.type==='bombtower'))for(let r=e.r-4;r<=e.r+1;r++)for(let c=e.c-1;c<=e.c+2;c++){
    const pr=props[c+','+r];if(pr?.deco&&!['greenpipe','crackedstone'].includes(pr.deco)){m.tile(c,r,pr.floor||'.');}
   }
   return{id,name,objective:'goal',explore:true,theme,dayCycle:theme==='castle',items:.27,map:g.map(r=>r.join('')),props,houses,npcs,enemies,mapId:'stage-'+id,start:{bombs:2,fire:2},hint,...extra};}
 };return m;
}
const stages=[];
function terrace(m,x,y,xx,yy,lv,ch='z'){for(let r=y;r<=yy;r++)for(let c=x;c<=xx;c++)m.tile(c,r,ch,{lv,floor:ch});}
function transport(m,x,y,xx,yy,level){for(let r=y;r<=yy;r++)for(let c=x;c<=xx;c++)m.tile(c,r,'(',{lv:0,platformLevel:level,platformPit:true,platformSpeed:1,platformPause:2});}

// Habillage des murs et des alcôves. Les passages, objets et créatures restent libres.
function dress(m,positions,kinds){
 let n=0;for(const [c,r] of positions){
  if(!',.zy'.includes(m.g[r]?.[c])||m.enemies.some(e=>Math.abs(e.c-c)+Math.abs(e.r-r)<2))continue;
  m.deco(c,r,kinds[n++%kinds.length]);
 }
}

// 2-1 : quelques braises au départ, prairie ouverte, poste de garde classique, douves et remparts.
{
 const m=map('2-1','Au-delà des braises',27,55);
 m.room(1,1,25,53,',').rect(11,3,15,51,'-').rect(2,47,24,52,'-');
 for(const [x,y] of [[3,50],[4,50],[3,49],[22,51],[23,51],[23,50]])m.tile(x,y,'[');
 for(const [x,y] of [[5,50],[21,49],[4,46]])m.deco(x,y,'baretree');
 m.tile(13,51,'1');m.item(12,48,'heart');m.item(14,48,'antidote');
 for(const [x,y] of [[4,43],[7,46],[22,43],[20,46],[3,38],[23,38],[3,30],[23,30]])m.tile(x,y,'T');
 for(const [x,y] of [[6,42],[21,40],[5,37],[22,36]])m.tile(x,y,'*');
 m.rect(5,37,21,38,'-');m.deco(6,39,'bench');m.deco(20,39,'flowerpot');m.deco(3,41,'castle_hay');m.deco(23,41,'cart');
 m.rect(2,25,24,25,'#').rect(2,35,24,35,'#');
 m.maze(5,25,21,35).rect(12,34,14,36,'.').rect(12,24,14,26,'.');
 m.deco(4,34,'castle_weapons');m.deco(22,34,'castle_armor');
 m.enemy('chevalier',10,31).enemy('alt_bomb_soldier',17,29).enemy('fantome',7,27);
 m.item(8,32,'shield');m.item(18,26,'honey');
 m.rect(2,20,24,22,'~').rect(11,20,15,22,'=');
 m.gate(18,'A').tile(6,23,'A');m.deco(4,23,'castle_brazier');m.deco(22,23,'castle_brazier');
 m.lamps(10,16,[23,17],'default');
 m.rect(2,2,24,17,'.').rect(12,3,14,17,'%');
 for(const [x,y] of [[3,3],[22,3],[3,13],[22,13]])m.room(x,y,x+1,y+2,'.');
 for(const y of [5,10,15]){m.deco(6,y,'castle_armor');m.deco(20,y,'banner');}
 m.enemy('canon',7,16).enemy('canon',19,16).enemy('alt_wizzrobe',5,8).enemy('fantome',19,6);
 m.deco(4,8,'castle_barrel');m.deco(22,8,'castle_food');m.item(11,12,'heart');m.item(16,11,'fire');
 m.enemy('bombtower',8,14).enemy('bombtower',18,14);
 m.tile(13,3,'G');m.lamps(11,15,[4],'blue');
 for(const [type,c,r] of [['alt_wizzrobe',20,32],['chevalier',9,40],['alt_bomb_soldier',18,37],['fantome',6,13],['canon',22,10],['chevalier',13,7]])m.enemy(type,c,r);
 for(const [c,r] of [[3,32],[23,32],[4,16],[22,16]])m.deco(c,r,'castle_barrel');
 for(const [c,r] of [[7,45],[19,45],[4,28],[22,28]])m.tile(c,r,'$');
 for(let r=20;r<=22;r++)for(let c=11;c<=15;c++)m.props[c+','+r]={castleBridge:true};
 m.props['11,20'].drawbridgeAnchor={width:5,depth:3};
 m.deco(10,19,'pillar').deco(16,19,'pillar');
 dress(m,[[3,5],[23,5],[3,9],[23,9],[5,11],[21,11],[4,17],[22,17],[6,16],[20,16],[7,12],[19,12],[3,26],[23,26],[3,36],[23,36],[4,39],[22,39],[5,44],[21,44],[9,44],[17,44]],['castle_brazier','banner','castle_weapons','castle_shieldstand','castle_barrel','flowerpot']);
 stages.push(m.finish('Quitte les dernières braises. Traverse le poste de garde et touche la cible A avec une bombe pour franchir les remparts.'));
}
// 2-2 : jardin dans l’enceinte, casernes latérales, puis le grand escalier du château.
{
 const m=map('2-2','La cour des sortilèges',33,49);
 m.room(1,1,31,47,'.').rect(14,3,18,45,'%').tile(16,45,'1');
 m.rect(3,35,12,44,',').rect(20,35,29,44,',');
 for(const c of [5,10,22,27]){m.tile(c,41,'T');m.tile(c,36,'*');}
 m.deco(8,38,'fountain');m.deco(24,38,'statue_guardian');m.lamps(13,19,[43,35],'default');
 m.maze(3,21,13,32).maze(19,21,29,32).rect(13,25,19,27,'.');
 m.rect(7,31,9,33,'.').rect(23,31,25,33,'.');
 m.tile(6,23,'A').tile(26,23,'B');m.item(8,28,'bomb');m.item(24,28,'heart');
 m.enemy('alt_bomb_soldier',10,29).enemy('fantome',6,27).enemy('canon',22,29).enemy('alt_purple_wizzrobe',26,25);
 m.gate(19,'A').gate(17,'B');m.rect(14,18,18,18,'%');
 m.rect(3,3,29,15,'z').rect(14,3,18,15,'q');
 for(const r of [5,10,14]){m.deco(5,r,'pillar');m.deco(27,r,'pillar');}
 m.deco(8,5,'castle_bell').deco(24,5,'castle_gong').deco(8,12,'castle_swordstone').deco(24,12,'castle_armor');
 m.lamps(12,20,[5,13],'purple');m.enemy('alt_wizzrobe',10,9).enemy('alt_poe',23,9).enemy('canon_bleu',16,12);
 m.enemy('bombtower',10,16).enemy('bombtower',22,16);
 m.rect(12,2,20,2,'#').rect(15,2,17,2,'.').tile(16,3,'G');
 m.deco(11,3,'castle_wallshield').deco(21,3,'castle_wallshield');
 // Petite boutique de la cour, accessible sans quitter le chemin principal.
 const interior=JSON.parse(JSON.stringify(BK.STAGE_1_5.houses['18,20'].interior));
 interior.npcs[0].lines=['Les mages protègent les deux cibles de la cour. Fais tes provisions !'];
 m.rect(21,32,25,34,'#').tile(23,34,'H');
 m.houses['23,34']={w:5,d:3,roof:'#66509d',wall:'#9194aa',interior};
 m.item(15,40,'antidote').item(17,40,'honey');
 for(const [type,c,r] of [['chevalier',16,36],['alt_poe',7,39],['alt_bomb_soldier',27,40],['alt_wizzrobe',9,25],['fantome',21,23],['canon',8,15],['canon',24,15]])m.enemy(type,c,r);
 for(const [c,r] of [[4,18],[28,18],[4,34],[28,34]])m.deco(c,r,'castle_brazier');
 for(const [c,r] of [[8,43],[24,43],[11,22],[21,22]])m.tile(c,r,'$');
 dress(m,[[3,4],[29,4],[3,8],[29,8],[3,12],[29,12],[7,3],[25,3],[11,4],[21,4],[7,14],[25,14],[3,37],[29,37],[4,43],[28,43],[11,43],[21,43],[4,26],[28,26],[6,33],[26,35],[11,35],[21,36],[4,20],[28,20]],['castle_brazier','banner','statue_guardian','castle_armor','flowerpot','castle_shieldstand']);
 m.deco(5,43,'greenpipe',{pipeLink:'A'}).deco(6,29,'greenpipe',{pipeLink:'A'});
 m.deco(27,37,'greenpipe',{pipeLink:'B'}).deco(26,29,'greenpipe',{pipeLink:'B'});
 terrace(m,21,38,24,40,.5,',');m.tile(23,41,'/',{lv:0,floor:','});
 m.room(3,3,9,9,'z');m.deco(6,9,'crackedstone',{secretGroup:'courTresor',secretDirection:2,secretWidth:5,secretDepth:5});
 m.deco(6,5,'castle_treasure');m.deco(4,4,'castle_brazier');m.item(5,7,'heart');m.item(7,7,'coin');
 stages.push(m.finish('Explore les deux casernes et active A puis B. La grande porte du château se trouve au nord de la cour.'));
}
// 2-3 : bibliothèque, réfectoire et salle du trône reliés à une véritable grille Bomberman.
{
 const m=map('2-3','Les galeries ensorcelées',35,49,'castleHall');
 m.room(1,1,33,47,'z').rect(16,3,18,45,'q').tile(17,45,'1');
 m.room(3,33,13,44,'y').room(21,33,31,44,'y');
 m.rect(13,37,15,39,'y').rect(19,37,21,39,'y');
 for(const r of [35,38,41]){m.deco(5,r,'bookshelf');m.deco(7,r,'castle_books');m.deco(29,r,'castle_barrel');}
 m.deco(10,35,'castle_lectern');m.deco(10,41,'castle_globe');
 m.deco(25,37,'table_dining').deco(24,37,'chair',{orientation:3}).deco(26,37,'chair',{orientation:1}).deco(25,41,'castle_food');
 m.item(11,42,'honey').item(23,42,'antidote');m.enemy('alt_wizzrobe',9,38).enemy('fantome',25,35);
 m.rect(2,20,32,20,'#').rect(2,30,32,30,'#');
 m.maze(3,20,31,30).rect(16,29,18,32,'z').rect(16,19,18,21,'z');
 m.enemy('canon',7,25).enemy('canon_rouge',27,25).enemy('alt_poe',13,23).enemy('alt_purple_wizzrobe',23,27);
 m.item(6,28,'bomb2').item(28,28,'shield');
 m.gate(17,'A').tile(6,31,'A');m.deco(4,31,'castle_scrolls');
 m.rect(4,3,30,15,'z').rect(15,3,19,15,'q');
 for(const r of [5,10,14]){m.deco(6,r,'pillar');m.deco(28,r,'pillar');}
 m.deco(12,4,'castle_throne').deco(22,4,'castle_crown');m.deco(9,6,'castle_glass').deco(25,6,'castle_tapestry');
 m.deco(9,12,'castle_harp').deco(25,12,'castle_chess');
 m.lamps(13,21,[8,14,33,43],'purple');m.enemy('alt_wizzrobe',12,10).enemy('fantome',22,10);
 m.deco(11,16,'trap_dart',{orientation:3,trapRange:6,trapRest:3}).deco(23,16,'trap_dart',{orientation:1,trapRange:6,trapRest:3});
 m.enemy('bombtower',6,18).enemy('bombtower',29,18);
 m.tile(17,3,'G');m.item(17,7,'heart');
 for(const [type,c,r] of [['alt_poe',11,35],['alt_bomb_soldier',27,39],['canon',17,27],['fantome',7,23],['alt_wizzrobe',29,23],['alt_stalfos_knight',17,12]])m.enemy(type,c,r);
 for(const [c,r] of [[4,46],[30,46],[4,18],[30,18]])m.deco(c,r,'castle_armor');
 for(const [c,r] of [[8,43],[26,43],[10,14],[24,14]])m.tile(c,r,'$');
 dress(m,[[4,34],[12,34],[4,37],[12,41],[4,40],[12,43],[22,34],[30,34],[22,40],[30,40],[22,43],[28,43],[4,4],[30,4],[4,8],[30,8],[4,12],[30,12],[8,4],[26,4],[10,5],[24,5],[11,14],[23,14],[14,7],[20,7],[14,12],[20,12],[3,18],[31,18],[7,18],[27,18],[3,32],[31,32]],['castle_tapestry','candelabra','castle_armor','castle_books','castle_lectern','castle_chest','castle_glass','castle_crown']);
 m.deco(11,36,'greenpipe',{pipeLink:'A'}).deco(8,27,'greenpipe',{pipeLink:'A'});
 m.deco(23,40,'greenpipe',{pipeLink:'B'}).deco(26,23,'greenpipe',{pipeLink:'B'});
 // Galerie suspendue : montée, traversée latérale, descente, traversée longitudinale et dernière montée.
 m.rect(2,2,32,16,' ');for(let i=m.enemies.length-1;i>=0;i--)if(m.enemies[i].r<=16)m.enemies.splice(i,1);
 terrace(m,16,16,18,16,0);m.tile(17,15,'{',{lv:0,autoLift:true,liftHeight:1,travelTime:2.6,platformPause:2});
 terrace(m,16,14,17,14,1);transport(m,18,14,22,14,1);terrace(m,23,12,25,14,1);
 terrace(m,23,10,24,11,0);transport(m,23,7,23,9,0);terrace(m,23,6,24,6,0);
 m.tile(23,5,'{',{lv:0,autoLift:true,liftHeight:2,travelTime:3,platformPause:2});terrace(m,17,3,22,5,2);
 m.tile(17,3,'G',{lv:2,floor:'q'});m.deco(19,3,'castle_throne',{lv:2,floor:'z'});m.deco(22,3,'castle_brazier',{lv:2,floor:'z'});
 m.deco(25,12,'candelabra',{lv:1,floor:'z'});m.deco(24,10,'castle_scrolls',{lv:0,floor:'z'});
 m.item(24,13,'heart');m.props['24,13'].lv=1;m.item(20,4,'coin');m.props['20,4'].lv=2;
 stages.push(m.finish('Ouvre la galerie A. Monte dans l’ascenseur, prends la plateforme vers la droite, redescends, traverse vers le haut puis remonte jusqu’au trône !'));
}
// 2-4 : cave, cryptes et secret muré ; le portail n’est visible qu’au fond de la dernière alcôve.
{
 const m=map('2-4','Le secret des oubliettes',31,53,'castleCrypt');
 m.room(1,1,29,51,'.').rect(14,3,16,49,'-').tile(15,49,'1');
 for(const r of [42,46])for(const c of [4,7,23,26])m.deco(c,r,'castle_barrel');
 m.deco(10,47,'castle_hay').deco(20,47,'castle_food');
 m.item(13,47,'antidote').item(17,47,'heart');
 m.rect(2,38,28,39,'~').rect(13,38,17,39,'=');
 m.rect(2,24,28,24,'#').rect(2,35,28,35,'#');
 m.maze(3,24,27,35).rect(14,34,16,37,'.').rect(14,23,16,25,'.');
 m.enemy('fantome',7,31).enemy('alt_poe',23,31).enemy('alt_stalfos_knight',11,27).enemy('canon_bleu',21,27);
 m.tile(6,25,'A');m.item(25,33,'shield');
 m.gate(21,'A');m.lamps(12,18,[36,22,48],'blue');
 m.room(3,6,11,18,'.').room(19,6,27,18,'.');
 m.rect(11,12,19,14,'.');
 for(const r of [8,11,16]){m.deco(5,r,'crypt_0');m.deco(25,r,'crypt_1');}
 m.deco(8,8,'crypt_4').deco(22,8,'crypt_15');m.deco(8,16,'crypt_6').deco(22,16,'crypt_16');
 m.enemy('alt_purple_wizzrobe',8,13).enemy('alt_poe',22,13);
 m.tile(7,7,'B').tile(23,7,'C');m.gate(5,'B').gate(3,'C');
 // Une cloison de briques fissurées cache réellement l’ultime couloir.
 m.rect(14,4,16,4,'W');m.rect(14,1,16,2,'.').tile(15,1,'G');
 m.deco(13,2,'crypt_3').deco(17,2,'crypt_3');
 m.deco(13,18,'trap_spikes',{trapRest:3,trapActive:1}).deco(17,18,'trap_spikes',{trapRest:3,trapActive:1,trapDelay:1.5});
 m.item(15,19,'fire');m.item(10,37,'honey');
 for(const [type,c,r] of [['fantome',8,43],['alt_stalfos_knight',23,44],['alt_wizzrobe',15,32],['fantome',25,25],['alt_poe',15,16],['canon',4,20],['canon',26,20]])m.enemy(type,c,r);
 for(const [c,r] of [[3,40],[27,40],[3,22],[27,22]])m.deco(c,r,'crypt_8');
 for(const [c,r] of [[8,48],[22,48],[9,17],[21,17]])m.tile(c,r,'$');
 dress(m,[[3,7],[27,7],[3,10],[27,10],[3,15],[27,15],[10,9],[20,9],[10,16],[20,16],[4,19],[26,19],[7,20],[23,20],[3,41],[27,41],[3,45],[27,45],[3,49],[27,49],[10,44],[20,44],[9,50],[21,50]],['crypt_8','crypt_16','crypt_5','crypt_6','crypt_3','castle_chains']);
 m.deco(8,45,'greenpipe',{pipeLink:'A'}).deco(8,29,'greenpipe',{pipeLink:'A'});
 m.deco(22,45,'greenpipe',{pipeLink:'B'}).deco(22,29,'greenpipe',{pipeLink:'B'});
 for(const c of [14,15,16])m.deco(c,4,'crackedstone',{secretGroup:'portailOublie',secretDirection:2,secretWidth:1,secretDepth:3});
 stages.push(m.finish('Les trois cibles ouvrent les oubliettes. Au fond, fais exploser les briques fissurées : un portail oublié se cache derrière.'));
}
// 2-5 : dimension suspendue ; les abris servent à esquiver les sorts, sans enfermer le joueur.
{
 const m=map('2-5','Le trône de l’autre monde',29,35,'castleRift');
 m.room(3,2,25,23,'.').rect(7,4,21,21,'.').rect(13,23,15,29,'=').room(9,29,19,33,'.').rect(13,29,15,29,'.');
 for(let r=8;r<=18;r++){m.tile(3,r,'.');m.tile(25,r,'.');}
 m.tile(14,31,'1');m.item(12,31,'heart').item(16,31,'shield');
 for(const [c,r] of [[5,5],[23,5],[5,20],[23,20]])m.deco(c,r,'crypt_3');
 for(const [c,r] of [[8,8],[20,8],[8,17],[20,17]])m.tile(c,r,'#');
 for(const c of [10,18]){m.deco(c,4,'castle_brazier');m.deco(c,21,'lamp',{lightColor:'purple'});}
 m.deco(14,3,'castle_throne');m.deco(6,12,'crypt_15');m.deco(22,12,'crypt_15');
 m.item(5,16,'heart').item(23,16,'antidote');
 stages.push(m.finish('Au-delà du portail, le régent des ombres garde le cristal du château. Esquive ses sorts et frappe entre ses attaques.',{objective:'boss',encounter:'castleBoss',bossName:'Malrec, le régent',items:0}));
}
BK.CASTLE_STAGES=stages;
})(window.BK);
