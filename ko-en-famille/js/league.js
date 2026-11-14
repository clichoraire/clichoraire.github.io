// Ligue des Titans : styles distincts, progression stable et migration des champions existants.
(function(root){
'use strict';
const B=root.BX;
B.LEGACY_ORDER=B.ORDER.slice();
B.CIRCUITS.forEach(c=>c.league=c.secret?2:1);
B.CIRCUITS.splice(B.CIRCUITS.length-1,0,...[
 ['titan_bronze','Améthyste','#a76ce0','Ceinture d’améthyste'],
 ['titan_argent','Émeraude','#27b878','Ceinture d’émeraude'],
 ['titan_or','Saphir','#397be5','Ceinture de saphir'],
 ['titan_diamant','Rubis','#c52d62','Ceinture de rubis'],
 ['titan_titre','Diamant','#c2f2ff','Ceinture de diamant']
].map(([id,name,color,belt])=>({id,league:2,name,belt,color,ropes:[color,'#243443',color],apron:'#111f30'})));
// Stable circuit IDs preserve existing titles; appearance follows the highest earned tier.
B.gloveTier=belts=>{
 const order=['bronze','argent','or','titan_bronze','titan_argent','titan_or','titan_diamant','titan_titre'];
 const id=order.filter(id=>(belts||[]).includes(id)).at(-1),circuit=B.CIRCUITS.find(c=>c.id===id);
 return circuit?{id,color:circuit.color,name:circuit.name}:{id:null,color:'#d32f2f',name:'Rouge'};
};
B.CIRCUITS.find(c=>c.secret).name='???';
const jab=(from,o={})=>Object.assign({pose:'jab',from,tell:.55,hit:.18,rec:.22,after:.1,dmg:10,avoid:['block','L','R'],glint:1,name:'Direct'},o);
const hook=(from,o={})=>Object.assign({pose:'hook',from,tell:.8,hit:.24,rec:1,dmg:17,avoid:[from==='L'?'R':'L','duck'],glint:1,star:'counter',name:'Crochet'},o);
const upper=(from,o={})=>Object.assign({pose:'upper',from,tell:.85,hit:.24,rec:1.1,dmg:20,avoid:['L','R'],glint:1,star:'counter',name:'Uppercut'},o);
const build=(spec)=>Object.assign({hp:280,dmg:1.4,spd:.86,maxCombo:2,grit:.84,guard:{high:.5,both:.05,sw:[.8,1.3]},gap:[.55,.95],sfx:'ting',taunt:'roar',league:2,taunts:['On passe aux choses sérieuses !','Respire. Puis recommence.'],moves:{},tips:[]},spec);
const newcomers=[
 build({id:'rempart',circuit:'elite',name:'Hector Durocher',nick:'Le Rempart',city:'Québec',record:'36 V – 3 D',weight:'132 kg',age:42,job:'Ancien gardien de but, mur à temps plein',quote:'La porte est fermée. Cherche la fenêtre.',tactic:'fortress',hp:285,
 look:{skin:'#bd8b67',w:1.4,h:1.12,head:.96,shirt:{type:'bare'},trunks:'#263b50',trim:'#96c7cf',gloves:'#6da4b7',hair:{style:'balding',c:'#302929'},beard:'#302929'},
 moves:{jabL:jab('L'),jabR:jab('R'),lock:jab('L',{tell:.75,guard:'high',chain:['body','gate'],rec:.1,name:'Porte blindée',say:'EN HAUT !'}),body:jab('R',{pose:'body',tell:.45,guard:'low',rec:.1,dmg:14,name:'Verrou bas',say:'EN BAS !'}),gate:upper('L',{tell:.95,rec:1.6,name:'La porte s’ouvre',say:'DERNIER VERROU !'}),sweep:hook('R',{tell:1.05,rec:1.35,avoid:['duck'],name:'Barrière de sécurité'})},
 patterns:[['lock'],['sweep','jabR']],patterns2:[['lock','sweep'],['jabR','lock']],pool:[['lock',2],['sweep',1]],
 tips:['Sa garde change après chaque coup bloqué : frappe l’autre hauteur.','Trois verrous : direct, corps, uppercut. La grande ouverture arrive à la fin.','Son armure réduit les dégâts hors des ouvertures. Un contre propre vaut mieux que dix coups pressés.'],bio:['Un colosse qui range ses trophées dans un coffre… dont il a avalé la clé, selon lui.','Deux hauteurs de garde et une armure qui cède pendant ses récupérations.']}),
 build({id:'metronome',circuit:'elite',name:'Nadir Belkacem',nick:'Le Métronome',city:'Montréal',record:'41 V – 2 D',weight:'92 kg',age:31,job:'Boxeur et batteur de jazz',quote:'Un, deux… attends… TROIS !',tactic:'rhythm',hp:290,spd:.9,
 look:{skin:'#986747',w:1.12,h:1.15,head:.94,shirt:{type:'bare'},trunks:'#2a2446',trim:'#e8ba5c',gloves:'#e0b24e',hair:{style:'slick',c:'#201c23'},mustache:'#201c23'},
 moves:{jabL:jab('L'),jabR:jab('R'),one:jab('L',{tell:.5,rec:.1,after:.05,chain:['two','pauseBeat'],name:'Premier temps',say:'UN !'}),two:jab('R',{tell:.35,rec:.1,after:.05,name:'Deuxième temps',say:'DEUX !'}),pauseBeat:hook('L',{tell:1.3,rec:1.35,name:'Syncope',say:'… TROIS !'}),fastEnd:upper('R',{tell:.6,rec:1.15,name:'Contre-mesure',say:'ET QUATRE !'}),roll:hook('R',{tell:.7,avoid:['duck'],rec:1.1,name:'Roulement de caisse claire'})},patterns:[['one'],['roll','one']],patterns2:[['one','fastEnd'],['two','roll','pauseBeat']],pool:[['one',3],['roll',1]],
 tips:['Ses deux premiers coups sont rapides, mais le troisième arrive après une vraie pause.','En deuxième moitié, un quatrième temps peut suivre : ne fonce pas trop tôt.','La parade marche sur les directs. Pour le roulement, baisse-toi.'],bio:['Il refuse les entrées musicales : il préfère composer avec les gants.','Des séries rythmiques avec silences, contretemps et une quatrième frappe en seconde phase.']}),
 build({id:'briseglace',circuit:'sommet',name:'Boris Leduc',nick:'Brise-Glace',city:'Sept-Îles',record:'44 V – 1 D',weight:'146 kg',age:37,job:'Débardeur et poids lourd',quote:'Le plancher est solide ? On va vérifier.',tactic:'pressure',hp:325,dmg:1.5,spd:.92,
 look:{skin:'#e1b493',w:1.48,h:1.2,head:.96,shirt:{type:'bare'},trunks:'#224b55',trim:'#d8f1ef',gloves:'#9bd4d5',hair:{style:'mohawk',c:'#cfd7da'},beard:'#684a3a'},
 moves:{jabL:jab('L'),jabR:jab('R'),engine:{pose:'charge',from:'C',tell:1.5,hit:.3,rec:1.8,dmg:27,avoid:['L','R'],glint:1,breakHits:3,star:'counter',name:'Moteur à glace',say:'TROIS COUPS POUR M’ARRÊTER !'},ice:hook('L',{tell:.9,rec:.1,chain:['hammer'],name:'Fissure latérale'}),hammer:{pose:'overhead',from:'C',tell:1.05,hit:.28,rec:1.45,dmg:24,avoid:['L','R'],glint:1,star:'counter',name:'Marteau polaire',say:'ÇA CRAQUE !'},sweep:hook('R',{tell:.95,avoid:['duck'],rec:1.2,name:'Banquise tournante'})},patterns:[['engine'],['ice']],patterns2:[['engine','sweep'],['ice','engine']],pool:[['engine',2],['ice',1]],
 tips:['Pendant qu’il charge son moteur, trois coups au corps l’arrêtent et le laissent grand ouvert.','Sinon, esquive sa charge sur le côté : rester en garde ne suffit pas.','Sa fissure est suivie du marteau. Attends la fin des deux attaques avant de répondre.'],bio:['Il déplace des conteneurs le matin et des sacs de frappe le soir. Il collectionne pourtant les petits canards de bain.','Charge à interrompre avec trois coups au corps, sinon il faut sortir de sa trajectoire.']}),
 build({id:'contretemps',circuit:'sommet',name:'Malik Renaud',nick:'Le Contretemps',city:'Laval',record:'52 V – 1 D',weight:'106 kg',age:35,job:'Champion tacticien',quote:'Le troisième coup ? Je l’ai déjà lu.',tactic:'reader',hp:345,dmg:1.55,spd:.85,grit:.9,
 look:{skin:'#754b36',w:1.22,h:1.18,head:.98,shirt:{type:'bare'},trunks:'#241d28',trim:'#de7556',gloves:'#bf493f',hair:{style:'slick',c:'#171619'},beard:'#171619',belt:'#edc870'},
 moves:{jabL:jab('L'),jabR:jab('R'),read:hook('R',{tell:.8,rec:1.2,avoid:['duck'],name:'Lecture de jeu',say:'ENCORE LA MÊME MAIN ?'}),bait:hook('L',{tell:.75,feint:true,dmg:0,glint:0,retract:.2,follow:['delay'],name:'Épaule fantôme',say:'Tu m’as vu ?'}),delay:upper('R',{tell:1.15,rec:1.3,name:'Le vrai retard',say:'PAS ENCORE… MAINTENANT !'}),cross:hook('R',{tell:.65,rec:.1,chain:['jabL','finish'],name:'Croisé tactique'}),finish:upper('L',{tell:.7,rec:1.4,name:'Échec et mat'})},patterns:[['bait'],['cross']],patterns2:[['cross','bait'],['bait','cross']],pool:[['bait',2],['cross',2]],
 tips:['Trois coups de la même main d’affilée : il prépare sa lecture. Varie tes mains.','L’épaule fantôme ne frappe pas. Le vrai uppercut attend encore après la feinte.','Son croisé lance trois attaques différentes. Réponds après son uppercut final.'],bio:['Il regarde les vidéos de ses rivaux au ralenti. Même celles où ils mangent une pizza.','Il repère les mains répétées et prépare une riposte annoncée, en plus de ses attaques à retardement.']})
];
// Nine more challengers complete the five independent Titan tournaments.
const extra=(id,name,nick,skin,color,tactic,moves,patterns,patterns2,tips,job)=>build({
 id,circuit:'titan_bronze',name,nick,city:'Circuit des Titans',record:'32 V – 4 D',weight:'112 kg',age:34,job,quote:tips[0],tactic,
 look:{skin,w:1.18+(newcomers.length%3)*.09,h:1.1+(newcomers.length%2)*.06,head:1,shirt:{type:'bare'},trunks:color,trim:'#ead6a1',gloves:color,hair:{style:'slick',c:'#29232b'},beard:'#392e2b'},
 moves:Object.assign({jabL:jab('L'),jabR:jab('R')},moves),patterns,patterns2,pool:patterns.map(p=>[p[0],1]),tips,bio:[job+'. Il a gagné sa place chez les Titans avec un style bien à lui.',tips[1]]
});
newcomers.push(extra('enclume','Gaston Ferron','L’Enclume','#d3a080','#80738f','heavy',{
 forge:{pose:'overhead',from:'C',tell:1.35,hit:.28,rec:.1,dmg:21,avoid:['L','R'],glint:1,chain:['echo'],name:'Premier marteau',say:'UN COUP…'},
 echo:{pose:'overhead',from:'C',tell:.65,hit:.24,rec:1.7,dmg:19,avoid:['L','R'],glint:1,star:'counter',name:'Écho de forge',say:'… PUIS DEUX !'},
 anvil:upper('L',{tell:1.15,rec:1.5,name:'Enclume montante'})},[['forge'],['anvil']],[['forge','anvil'],['anvil','forge']],
 ['Ne réponds pas au premier marteau : le deuxième suit.','Deux lourdes descentes, puis une longue ouverture.','Ses grands gestes sont lents, mais ils traversent la garde.'],'Forgeron poids lourd'));
newcomers.push(extra('rafale','Diego Martel','La Rafale','#ae754e','#d06542','flurry',{
 start:jab('L',{tell:.65,rec:.1,chain:['rapidR','rapidR','rapidL','late'],name:'Rafale cinq temps',say:'COMPTE JUSQU’À CINQ !'}),
 rapidR:jab('R',{tell:.36,rec:.1,after:.05,name:'Double droit'}),rapidL:jab('L',{tell:.36,rec:.1,after:.05,name:'Rebond gauche'}),late:hook('R',{tell:1.05,rec:1.35,name:'Le cinquième retardé'})},[['start']],[['start','rapidL','late']],
 ['Sa dernière frappe ne suit pas le tempo des quatre premières.','Gauche, droite, droite, gauche… puis crochet retardé.','La garde tient les directs ; baisse-toi pour le crochet.'],'Boxeur de pression, amateur de tambours'));
newcomers.push(extra('pivot','Sacha Virevolte','Le Gaucher','#e3b18d','#509b87','southpaw',{
 switch:{pose:'present',free:true,dur:.75,star:'early',name:'Changement de garde',say:'JE CHANGE DE PIED !'},
 angleL:hook('L',{tell:.75,rec:.1,chain:['upperR'],name:'Angle extérieur gauche'}),angleR:hook('R',{tell:.75,rec:.1,chain:['upperL'],name:'Angle extérieur droit'}),
 upperL:upper('L',{name:'Remontée gauche'}),upperR:upper('R',{name:'Remontée droite'})},[['switch','angleL'],['angleR']],[['switch','angleR','angleL'],['angleL','angleR']],
 ['Lis le gant allumé : il change de garde entre ses séries.','Crochet extérieur puis uppercut, avec deux côtés possibles.','Sa présentation de garde laisse une courte occasion de frapper.'],'Ancien danseur devenu technicien du ring'));
newcomers.push(extra('vigie','Oscar Veilleux','La Vigie','#875a44','#46679d','discipline',{
 stop:{pose:'stop',stop:true,dur:1.1,punish:'penalty',name:'Inspection',say:'PAS UN COUP !'},
 penalty:jab('R',{tell:.42,dmg:20,rec:1.1,name:'Sanction annoncée',say:'TU AS BOUGÉ !'}),
 release:hook('L',{tell:.8,rec:.1,chain:['upperR'],name:'Fin d’inspection'}),upperR:upper('R',{tell:.8,rec:1.4,name:'Dernier contrôle'})},[['stop','release'],['jabL','release']],[['stop','jabR','release'],['release','stop','release']],
 ['Pendant son arrêt, ne frappe pas : il attend ta faute.','L’inspection se termine par un crochet et un uppercut.','Sa sanction est annoncée : une erreur ne t’empêche pas de défendre.'],'Ancien arbitre devenu challenger'));
newcomers.push(extra('tandem','Émile Bellerose','Double Étage','#c9926d','#af507d','levels',{
 high:jab('L',{guard:'high',tell:.65,rec:.1,chain:['low','lift'],name:'Étage supérieur',say:'EN HAUT !'}),
 low:jab('R',{pose:'body',guard:'low',tell:.55,rec:.1,name:'Sous-sol',say:'EN BAS !'}),lift:upper('L',{tell:.9,rec:1.45,name:'Ascenseur express'}),
 hook:hook('R',{tell:.8,name:'Sortie de secours'})},[['high'],['low','hook']],[['high','hook'],['low','high']],
 ['Ne frappe pas toujours à la même hauteur : il protège l’étage annoncé.','La série descend au corps puis remonte en uppercut.','Attends la fin de l’ascenseur pour contrer.'],'Ascensoriste et spécialiste du corps à corps'));
newcomers.push(extra('sirene','Bruno Laroche','La Sirène','#d7a27a','#bd493e','alarm',{
 alarm:{pose:'shout',from:'C',tell:.9,hit:.25,rec:.1,dmg:0,fx:'stun',avoid:['block'],chain:['rush'],name:'Alarme rouge',say:'GARDE LES OREILLES !'},
 rush:{pose:'charge',from:'C',tell:.85,hit:.3,rec:1.5,dmg:25,avoid:['L','R'],glint:1,star:'counter',name:'Sortie d’urgence',say:'DÉGAGE LE PASSAGE !'},
 ladder:hook('R',{tell:.9,avoid:['duck'],rec:1.3,name:'Grande échelle'})},[['alarm'],['ladder']],[['alarm','ladder'],['ladder','alarm']],
 ['Bloque l’alarme, puis sors sur le côté pour la charge.','Deux signaux, deux défenses : rester en garde ne suffit pas.','La grande échelle passe haut : baisse-toi.'],'Pompier volontaire et gros bras au grand cœur'));
newcomers.push(extra('granite','Victor Montfort','Granite','#936e54','#74805d','endurance',{
 breath:{pose:'eat',free:true,dur:1.25,heal:.10,star:'early',name:'Second souffle',say:'JE REPRENDS MON AIR…'},
 stone:hook('L',{tell:.85,rec:.1,chain:['quarry'],name:'Bloc de pierre'}),quarry:upper('R',{tell:1.1,rec:1.5,name:'Sortie de carrière'}),
 wall:jab('R',{tell:.65,dmg:17,guard:'low',name:'Mur au corps'})},[['stone'],['breath','wall']],[['stone','wall'],['breath','stone']],
 ['Interromps sa respiration pour empêcher sa récupération.','Deux grosses frappes précèdent sa pause.','Sa défense est solide, mais son souffle reste une ouverture.'],'Ancien lutteur, endurance de roc'));
newcomers.push(extra('spectre','Silas Moreau','Le Mirage','#bd9075','#69558d','deception',{
 ghost:hook('L',{feint:true,dmg:0,glint:0,tell:.65,retract:.18,follow:['ghostR'],name:'Première illusion',say:'TU CROIS ?'}),
 ghostR:hook('R',{feint:true,dmg:0,glint:0,tell:.55,retract:.2,follow:['real'],name:'Deuxième illusion'}),
 real:upper('L',{tell:.85,glint:1,rec:1.45,name:'Le seul vrai coup',say:'CELUI-CI EST VRAI !'}),
 sweep:hook('R',{tell:.8,avoid:['duck'],name:'Rideau final'})},[['ghost'],['sweep','real']],[['ghost','sweep'],['sweep','ghost']],
 ['Deux départs sans éclat, puis un vrai gant lumineux.','N’esquive pas les épaules : attends la vraie frappe.','Son rideau final est un balayage, pas une troisième feinte.'],'Illusionniste amateur et boxeur patient'));
newcomers.push(extra('cyclone','Anton Vasseur','Le Cyclone','#c8946a','#398b9a','rotation',{
 turn:hook('L',{pose:'sweep',tell:.85,avoid:['duck'],rec:.1,chain:['rise','return'],name:'Tour complet',say:'ÇA TOURNE !'}),
 rise:upper('R',{tell:.65,rec:.1,name:'Œil du cyclone'}),return:hook('R',{pose:'sweep',tell:.85,avoid:['duck'],rec:1.6,name:'Retour du vent'}),
 calm:jab('L',{tell:1,dmg:16,name:'Faux calme'})},[['turn'],['calm','turn']],[['turn','calm'],['calm','turn','rise']],
 ['Bas, côté, bas : les trois gestes pour traverser son cyclone.','Ne reste pas accroupi : l’uppercut arrive entre les balayages.','Il doit reprendre son équilibre après le dernier tour.'],'Ancien lanceur de marteau, boxeur en rotation'));
const tiers=[['rempart','enclume','rafale'],['metronome','pivot','vigie'],['briseglace','tandem','sirene'],['granite','spectre','cyclone'],['contretemps']];
const circuitIds=['titan_bronze','titan_argent','titan_or','titan_diamant','titan_titre'];
const ordered=[];tiers.forEach((ids,tier)=>ids.forEach((id,rank)=>{
 const b=newcomers.find(x=>x.id===id);b.circuit=circuitIds[tier];b.hp=Math.max(b.hp,265+tier*24+rank*9);b.dmg=1.38+tier*.07;b.grit=.82+tier*.025;
 b.record=(32+tier*6+rank*2)+' V – '+Math.max(1,4-tier)+' D';b.look.hair.style=['balding','slick','mohawk'][(tier+rank)%3];ordered.push(b);
}));
newcomers.splice(0,newcomers.length,...ordered);
const looks={
 enclume:{w:1.42,head:1.08,beard:'#67554e',hair:{style:'balding',c:'#67554e'},scar:true},
 rafale:{w:1.08,h:1.08,beard:null,headband:'#e8b55d',hair:{style:'wild',c:'#34221c'}},
 metronome:{beard:null,mustache:'#29232b',headband:'#d8b45b'},
 pivot:{w:1.04,h:1.17,beard:null,hair:{style:'bun',c:'#30251e'},headband:'#72bf9d'},
 vigie:{w:1.28,h:1.13,beard:null,mustache:'#20232c',hair:{style:'slick',c:'#20232c'},scar:true},
 tandem:{w:1.13,h:1.12,beard:null,hair:{style:'mohawk',c:'#38251e'},headband:'#ee93bb'},
 sirene:{w:1.38,h:1.15,hair:{style:'wild',c:'#ae6834'},beard:'#ae6834'},
 granite:{w:1.48,h:1.16,hair:{style:'balding',c:'#b1b8b2'},beard:'#b1b8b2',scar:true},
 spectre:{w:1.08,h:1.2,beard:null,hair:{style:'slick',c:'#28202e'},headband:'#a392bb'},
 cyclone:{w:1.25,h:1.18,beard:null,hair:{style:'mohawk',c:'#333e49'},headband:'#b1e1e3'},
 contretemps:{scar:true,hair:{style:'slick',c:'#171619'}}
};
newcomers.forEach(b=>Object.assign(b.look,{serious:true},looks[b.id]||{}));
const shadow=B.boxerById('ombre');
B.BOXERS.splice(B.BOXERS.indexOf(shadow),0,...newcomers);
for(const b of newcomers){B.BIOS[b.id]=b.bio;B.RIVAL_COACHES[b.id]={name:'Coach '+b.name.split(' ')[0],lines:[b.tips[0],b.tips[1]]};}
circuitIds.forEach((id,i)=>B.GOLD_WIN[id]=280+i*55);B.GOLD_WIN.secret=650;
// Late family opponents use their own signatures, not the shared random fake-direct loop.
const rita=B.boxerById('rita'),king=B.boxerById('caribou');
rita.feints=false;rita.spd=.85;rita.gap=[.55,.95];rita.tactic='knitter';
rita.moves.knit.chain=['slipper'];rita.moves.knit.rec=.1;rita.moves.purseR.chain=['purseL'];rita.moves.purseR.rec=.1;rita.moves.purseL.rec=1.2;
rita.moves.cookie.dur=1.1;rita.moves.cookie.heal=.09;
rita.patterns=[['knit'],['purseR'],['cookie','teeth']];rita.patterns2=[['knit','purseR'],['teeth','cookie','slipper']];
rita.tips=['Le tricot est suivi d’une pantoufle : esquive deux fois, puis contre.','La sacoche revient de l’autre côté : deux balayages, donc deux passages sous la sacoche.','Ses biscuits restent interruptibles, mais les dentiers arrivent autour de la pause.'];
king.feints=false;king.tactic='royal';king.phase2={cape:0};king.gap=[.5,.9];
king.moves.charge.chain=['hookL'];king.moves.charge.rec=.1;king.moves.hookL.rec=1.25;
king.patterns=[['charge'],['roar'],['reign']];king.patterns2=[['aurora','charge'],['reign','roar']];
king.tips=['Sa charge est suivie d’un crochet : côté, puis baisse-toi ou change de côté.','Bloque le brame, puis esquive l’uppercut. Ce ne sont pas les mêmes défenses.','Le règne enchaîne quatre coups. Son aurore voile le ring, mais les signaux restent visibles.'];
shadow.league=2;shadow.feints=false;shadow.hp=390;shadow.dmg=1.65;shadow.spd=.82;shadow.tactic='mirror';shadow.gap=[.4,.75];shadow.phase2={};
shadow.patterns=[['rocket','purse'],['roar','angel'],['chop','jersey']];shadow.patterns2=[['rocket','roar','purse'],['angel','chop','jersey']];
shadow.tips=['Le miroir mélange lancers, balayages et uppercuts : une seule défense répétée ne suffit plus.','Ses séries s’allongent en deuxième moitié. Lis la dernière attaque avant de contrer.','La récompense des Titans : un combat secret, seulement après leur champion.'];
// Morphologies de tout le roster : hauteur, carrure, masses et appuis indépendants.
const bodies={
 bobby:{w:1.28,h:.87,head:1.08,belly:1.65,shoulders:.88,waist:1.15,arms:.92,legs:.88},
 ginette:{w:.78,h:1.04,head:.94,belly:0,shoulders:.91,waist:.88,arms:.72,legs:.78},
 tibeuf:{w:1.36,h:1.18,head:.94,belly:.18,shoulders:1.16,waist:.88,arms:1.4,legs:1.2},
 rempart:{w:1.48,h:1.17,head:.88,belly:.12,shoulders:1.16,waist:1.06,arms:1.38,legs:1.25},
 enclume:{w:1.4,h:.92,head:1.12,belly:.85,shoulders:1.05,waist:1.12,arms:1.55,legs:1.3},
 rafale:{w:.9,h:1.22,head:.9,belly:0,shoulders:1.03,waist:.78,arms:.82,legs:.85},
 // Ligue familiale : du coureur sec au lutteur en losange et à la petite grand-maman.
 coach:{w:.88,h:1.15,head:.93,belly:0,shoulders:1.12,waist:.8,arms:.8,legs:1.15,stance:.85,neck:.78,chest:.94},
 lemur:{w:1.28,h:.99,head:1,belly:0,shoulders:1.18,waist:.92,arms:1.28,legs:1.42,stance:1.25,neck:1.3,chest:1.08},
 meteo:{w:.84,h:1.13,head:.98,belly:0,shoulders:.9,waist:1.18,arms:.7,legs:.84,stance:.72,neck:.75,chest:.73},
 minou:{w:1.04,h:.86,head:1.09,belly:.95,shoulders:.82,waist:1.28,arms:.78,legs:.75,stance:1.28,neck:.85,chest:.92},
 robot:{w:1.15,h:.98,head:.92,belly:0,shoulders:1.12,waist:1,arms:1.6,legs:.72,stance:1.35,neck:1.2},
 petardo:{w:1.18,h:1.04,head:.92,belly:0,shoulders:1.3,waist:.65,arms:1.5,forearms:.75,legs:1.05,stance:1.18,neck:1.1,chest:1.12},
 rita:{w:.73,h:.76,head:1.13,belly:.3,shoulders:.86,waist:1.02,arms:.65,legs:.7,stance:.8,neck:.7,chest:.88},
 caribou:{w:1.3,h:1.25,head:.95,belly:0,shoulders:1.26,waist:.82,arms:1.2,forearms:1.2,legs:1.22,stance:1.05,neck:1.4,chest:1.06},
 // Titans : chaque métier a son équilibre propre entre le haut et le bas du corps.
 metronome:{w:.84,h:1.2,head:.86,belly:0,shoulders:.88,waist:.85,arms:.7,forearms:1.15,legs:.72,stance:.68,neck:.75,chest:.85},
 pivot:{w:.97,h:1.12,head:.9,belly:0,shoulders:.94,waist:.92,arms:.78,legs:1.45,stance:1.32,neck:.85,chest:.82},
 vigie:{w:1.07,h:1.22,head:.92,belly:0,shoulders:1.06,waist:1.22,arms:.86,legs:.92,stance:.76,neck:1.1,chest:1.02},
 briseglace:{w:1.45,h:1.23,head:.84,belly:.6,shoulders:1.08,waist:1.2,arms:1.38,forearms:1.22,legs:1.45,stance:1.18,neck:1.45,chest:1.1},
 tandem:{w:.98,h:1.23,head:.87,belly:0,shoulders:1.22,waist:.65,arms:1.1,forearms:1.28,legs:.78,stance:.9,neck:.8,chest:1.14},
 sirene:{w:1.2,h:1.06,head:1.05,belly:.48,shoulders:.9,waist:1.27,arms:1.1,forearms:1.2,legs:1.55,stance:1.22,neck:1.2,chest:.86},
 granite:{w:1.5,h:.94,head:.9,belly:.15,shoulders:1.1,waist:1.18,arms:1.18,forearms:1.45,legs:1.6,stance:1.28,neck:1.5,chest:1.15},
 spectre:{w:.74,h:1.26,head:.85,belly:0,shoulders:.86,waist:.72,arms:.62,forearms:.8,legs:.65,stance:.82,neck:.62,chest:.78},
 cyclone:{w:1.25,h:1.04,head:.9,belly:0,shoulders:1.3,waist:.78,arms:1.6,forearms:1.25,legs:.88,stance:1.42,neck:1.2,chest:1.18},
 contretemps:{w:1.07,h:1.15,head:.94,belly:0,shoulders:1.13,waist:.83,arms:.95,forearms:1.35,legs:1.16,stance:1.13,neck:.98,chest:.92},
 ombre:{w:.95,h:1.2,head:.82,belly:0,shoulders:1.48,waist:.58,arms:.68,forearms:1.25,legs:.7,stance:1.44,neck:.62,chest:.72}
};
for(const [id,body] of Object.entries(bodies))Object.assign(B.boxerById(id).look,body);
// Plafond 20 : les Titans progressent avec le deuxième parcours du joueur.
newcomers.forEach((b,i)=>{
 const tier=circuitIds.indexOf(b.circuit),rank=tiers[tier].indexOf(b.id);
 b.hp=Math.round(b.hp*(1.08+tier*.075));b.dmg*=1.08+tier*.09;
 b.rating={force:11+tier*2, vitesse:11+tier*2+(rank===2?1:0), stamina:12+tier*2, grit:12+tier*2};
});
shadow.hp=560;shadow.dmg=2.5;shadow.rating={force:20,vitesse:20,stamina:20,grit:20};
const oldOppStats=B.oppStats;
B.oppStats=b=>b.rating?['force','vitesse','stamina','grit'].map((id,i)=>({icon:['💪','⚡','❤️','🪨'][i],name:['Force','Rapidité','Endurance','Coriace'][i],v:b.rating[id]})):oldOppStats(b);

// Chaque pouvoir est une vraie action du moteur : signal, défense et ouverture.
const rempart=B.boxerById('rempart');
rempart.moves.bastion={pose:'flex',free:true,dur:1.5,armor:.25,star:'early',chain:['sweep'],name:'Bastion de fer',say:'BASTION DE FER !'};
B.boxerById('meteo').moves.tornade={pose:'sweep',from:'R',tell:1,hit:.3,rec:1.2,dmg:16,avoid:['duck'],glint:1,star:'counter',name:'Tornade',say:'ALERTE TORNADE !'};
const powers={
 bobby:['burp','Rot sonique','Bloque le rot qui étourdit, puis le direct.'],
 ginette:['stop','Autorité absolue','Ne frappe pas pendant son arrêt ; contre au feu vert.'],
 tibeuf:['stomp','Séisme forestier','Bloque le tremblement, puis évite le crochet.'],
 coach:['blast','Sifflet paralysant','Bloque le sifflet, puis esquive son uppercut.'],
 lemur:['jersey','Chandail aveuglant','Baisse-toi pour éviter le chandail sur les yeux.'],
 meteo:['brume','Banc de brume','Interromps sa préparation avant que le ring se couvre de brouillard.'],
 minou:['panique','Tornade de minous','Bloque les tapes et esquive les chats jusqu’au rappel.'],
 robot:['blow','Souffleuse polaire','Protège-toi derrière tes gants contre la neige.'],
 petardo:['fireworks','Fiesta explosive','Bloque les pétards avant ses deux crochets.'],
 rita:['knit','Prison de laine','Esquive le tricot qui ligote, puis la pantoufle.'],
 caribou:['aurora','Aurore royale','Interromps son invocation avant que le ciel voile le ring.'],
 rempart:['bastion','Bastion de fer','Armure renforcée pendant sa pose ; baisse-toi au balayage puis contre.'],
 enclume:['forge','Écho de forge','Deux marteaux traversent la garde, avec un second départ plus rapide.'],
 rafale:['start','Survoltage','Quatre directs rapides, puis un crochet retardé.'],
 metronome:['one','Temps suspendu','Deux temps rapides, un long silence, puis la syncope.'],
 pivot:['switch','Pas fantôme','Il change de garde avant de repartir sous un autre angle.'],
 vigie:['stop','Arrêt du jeu','Il sanctionne les frappes pendant son inspection.'],
 briseglace:['engine','Moteur polaire','Trois coups au corps interrompent sa charge ; sinon esquive de côté.'],
 tandem:['high','Ascenseur infernal','Sa garde monte et descend avant l’uppercut final.'],
 sirene:['alarm','Alarme rouge','Bloque son cri étourdissant, puis esquive sa charge.'],
 granite:['breath','Cœur de pierre','Il récupère 10 % de vie si tu le laisses respirer.'],
 spectre:['ghost','Double illusion','Deux feintes sans dégâts précèdent le seul vrai coup.'],
 cyclone:['turn','Vortex','Deux balayages encadrent un uppercut : bas, côté, bas.'],
 contretemps:['bait','Vision du futur','Il piège ton esquive avec une feinte suivie d’un uppercut retardé.'],
 ombre:['jersey','Éclipse du miroir','Baisse-toi pour éviter son étreinte qui obscurcit la vue.']
};
const repertoire={
 rempart:['jabL body sweep','jabR gate','body jabL gate','sweep body','gate jabR sweep','jabR jabL gate','body sweep jabL','jabL sweep gate','lock','jabR lock'],
 enclume:['jabL anvil','jabR forge','echo jabL anvil','anvil jabR','jabL jabR echo','echo anvil','anvil echo','jabR anvil jabL'],
 rafale:['rapidL rapidR late','rapidR rapidL late','jabR late','rapidL rapidL late','jabL rapidR rapidR late','late rapidL','rapidR late jabL','jabR rapidL late'],
 metronome:['two pauseBeat','jabR roll','roll fastEnd','two fastEnd','jabL pauseBeat roll','fastEnd jabR','roll two pauseBeat','jabL two fastEnd'],
 pivot:['jabL angleR','jabR angleL','upperL jabR','upperR jabL','switch angleR','angleL jabL','angleR jabR','jabL jabR upperL'],
 vigie:['jabR upperR','jabL jabR release','stop jabL upperR','release jabR','upperR jabL','jabR release','stop upperR','jabL upperR jabR'],
 briseglace:['jabL hammer','jabR sweep','hammer sweep','sweep jabL','jabR ice','ice jabR','jabL jabR engine','hammer jabL engine'],
 tandem:['jabL low lift','jabR hook','low lift','hook jabL lift','jabR high','lift hook','low jabL hook','jabL jabR lift'],
 sirene:['jabL rush','jabR ladder','ladder rush','rush jabL','jabR alarm','jabL jabR ladder','ladder jabR rush','rush ladder'],
 granite:['jabL quarry','jabR wall','wall stone','quarry jabL','breath quarry','wall jabL quarry','jabR stone','stone wall'],
 spectre:['jabL real','jabR sweep','real sweep','sweep jabL','jabR ghost','ghostR sweep','jabL jabR ghost','sweep ghostR'],
 cyclone:['jabL rise','jabR return','calm rise','return calm','rise return','jabL calm return','jabR turn','return jabL rise'],
 contretemps:['jabL finish','jabR delay','read finish','finish jabL','delay cross','jabL read','jabR bait','read jabL finish']
};
const unique=seqs=>[...new Map(seqs.map(seq=>[seq.join(','),seq])).values()];
for(const b of B.BOXERS){
 const [move,name,desc]=powers[b.id];b.power={move,name,desc};
 // Les actions longues gardent leurs chaînes et leurs fenêtres de contre originales.
 const poolIds=[...new Set([...b.pool,...b.pool2||[]].map(([id])=>id))].filter(id=>b.moves[id]&&!b.moves[id].feint);
 const additions=repertoire[b.id]?repertoire[b.id].map(line=>line.split(' ')):poolIds.flatMap(id=>[[id],['jabL',id],['jabR',id]]);
 b.patterns=unique([...(b.patterns||[]),...additions,['jabL','jabR'],['jabR','jabL']]);
 b.patterns2=unique([...(b.patterns2||[]),...b.patterns,...additions.slice(0,6).map(seq=>['jabR',...seq])]);
 b.tips.push('Pouvoir — '+name+' : '+desc);
}
// Sac mélangé : chaque série sort une fois avant de rebattre, sans répétition à la frontière.
B.nextPattern=(b,o)=>{
 const phase=o.phase2?2:1,patterns=phase===2?b.patterns2:b.patterns;
 if(!o.patternBag?.length||o.patternPhase!==phase){
  o.patternPhase=phase;o.patternBag=patterns.map((_,i)=>i);
  for(let i=o.patternBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o.patternBag[i],o.patternBag[j]]=[o.patternBag[j],o.patternBag[i]];}
  if(patterns[o.patternBag.at(-1)].join(',')===o.lastPattern&&o.patternBag.length>1)[o.patternBag[0],o.patternBag[o.patternBag.length-1]]=[o.patternBag.at(-1),o.patternBag[0]];
 }
 const sequence=patterns[o.patternBag.pop()];o.lastPattern=sequence.join(',');return sequence;
};
B.ORDER=B.BOXERS.map(b=>b.id);
B.leagueOf=b=>b.league||1;
B.ladder=pr=>B.BOXERS.filter(b=>B.leagueOf(b)===1||(pr.beaten.includes('caribou')&&(b.id!=='ombre'||(pr.beaten.includes('contretemps')&&pr.c.day>=(pr.c.secretRevealDay??Infinity)))));
B.migrateLeagues=pr=>{
 const c=pr.c;if(!c||c.leagueRoster===2)return false;
 const old=B.LEGACY_ORDER[c.pos];
 if(pr.beaten.includes('caribou')){
  c.pos=B.ORDER.indexOf('rempart');c.retry=false;
  if(pr.beaten.includes('ombre')){pr.legacyShadowChampion=true;pr.beaten=pr.beaten.filter(id=>id!=='ombre');pr.belts=pr.belts.filter(id=>id!=='secret');}
 }else c.pos=Math.max(0,B.ORDER.indexOf(old||B.LEGACY_ORDER[0]));
 c.leagueRoster=2;return true;
};
})(window);

// Styles de boxe : posture, technique personnelle et plan de match.
(function(root){
'use strict';
const B=root.BX;
// nom, déplacement latéral, rebond, cadence, inclinaison, largeur de garde, décalage du gant avant.
const styles={
 bobby:['Poids balancier',5,9,1.3,.06,1.1,8],ginette:['Garde de sentinelle',2,1,2,.01,.85,-6],
 tibeuf:['Bûcheron ancré',3,3,1.1,-.035,1.2,4],coach:['Boxeur de piste',10,12,4,.035,.9,-8],
 lemur:['Bagarreur compact',7,4,2.6,-.055,.78,5],meteo:['Escrime à distance',16,3,1.6,.055,1.12,-10],
 minou:['Pattes imprévisibles',11,6,5.3,.07,1.17,7],robot:['Piston mécanique',4,2,3,0,.86,0],
 petardo:['Danse du matador',21,8,2.7,.07,1.2,-8],rita:['Petits pas patients',4,2,1.4,.025,.75,4],
 caribou:['Marche royale',7,2,1.2,-.035,1.15,-6],rempart:['Forteresse',2,1,1,0,.72,0],
 enclume:['Marteau ramassé',4,7,1.5,-.06,.88,6],rafale:['Pression mexicaine',12,13,4.8,-.06,.8,-5],
 metronome:['Jab du pendule',19,4,2.1,.045,.88,-8],pivot:['Gaucher mobile',23,8,3.3,.08,1.08,8],
 vigie:['Garde verticale',3,2,1.7,-.015,.76,-7],briseglace:['Marche en avant',9,8,1.8,-.07,1.18,5],
 tandem:['Corps puis tête',8,10,2.8,.055,.92,7],sirene:['Rush explosif',14,11,3.8,-.05,.94,-4],
 granite:['Bloc de granit',1,2,.9,.015,.7,0],spectre:['Épaules fantômes',24,3,2.4,.085,1.18,-7],
 cyclone:['Crochets en rotation',17,7,3.1,.09,1.2,6],contretemps:['Contreur en retrait',13,2,1.8,.065,.84,-9],
 ombre:['Reflet déphasé',22,5,2.9,-.08,.82,8]
};
const techniques={
 bobby:['shovel','L','La cuillère à poutine',1.1,13],ginette:['stepJab','R','Traversée piétonne',.8,9],
 tibeuf:['overhand','R','Abattage diagonal',1.15,20],coach:['cross','R','Leçon de direct',.65,10],
 lemur:['shovel','L','Crochet de vestiaire',.8,15],meteo:['checkHook','L','Front tournant',1,14],
 minou:['stepJab','L','Patte de velours',.65,4],robot:['cross','R','Piston hydraulique',.9,18],
 petardo:['checkHook','R','Sortie du matador',.85,15],rita:['shovel','R','Coup de dé à coudre',.95,12],
 caribou:['overhand','R','Couronne descendante',.9,21],rempart:['cross','L','Bélier de porte',1,18],
 enclume:['overhand','L','Marteau oblique',1.2,23],rafale:['shovel','L','Crochet au foie',.65,11],
 metronome:['stepJab','L','Jab à retardement',1.3,12],pivot:['checkHook','R','Crochet de sortie',.8,14],
 vigie:['cross','R','Ligne droite',.85,16],briseglace:['overhand','R','Briseur de coque',1.3,25],
 tandem:['shovel','R','Remontée du sous-sol',.75,17],sirene:['cross','R','Percée urgente',.65,14],
 granite:['shovel','L','Extraction de roche',1.2,20],spectre:['checkHook','L','Angle mort',.95,16],
 cyclone:['checkHook','R','Crochet centrifuge',.8,19],contretemps:['cross','R','Contre en ligne',.85,18],
 ombre:['overhand','L','Diagonale du miroir',1,22]
};
for(const b of B.BOXERS){
 const [name,sway,bounce,tempo,lean,width,lead]=styles[b.id];
 b.boxingStyle={name,sway,bounce,tempo,lean,width,lead};
 const [pose,from,tech,tell,dmg]=techniques[b.id];
 const avoid=['cross','stepJab'].includes(pose)?['L','R','block']:pose==='checkHook'?[from==='L'?'R':'L','duck']:['L','R'];
 b.moves.signature={pose,from,tell,hit:.24,rec:1.3,after:.25,dmg,avoid,glint:1,star:'counter',name:tech,say:tech.toUpperCase()+' !'};
 const combos=[['jabL','signature'],['jabR','jabL','signature'],['signature','jabR']];
 b.patterns.push(...combos);b.patterns2.push(...combos,['jabR','signature','jabL']);
 b.tips.push('Style : '+name+'. Sa technique « '+tech+' » laisse une ouverture après une esquive.');
}
// Feinte de feinte : branches finies, sans dégâts ni éclat avant le vrai départ.
for(const id of ['spectre','contretemps','petardo','ombre']){
 const b=B.boxerById(id);
 b.moves.doubleFake={pose:'stepJab',from:'L',tell:.55,hit:.1,rec:0,dmg:0,avoid:['L','R','block'],feint:true,glint:0,retract:.18,follow:['secondFake','signature'],name:'Invitation fantôme',say:'TU PARS DÉJÀ ?'};
 b.moves.secondFake={pose:'checkHook',from:'R',tell:.65,hit:.1,rec:0,dmg:0,avoid:['L','R'],feint:true,glint:0,retract:.24,follow:['signature','lateCross'],name:'Feinte de la feinte'};
 b.moves.lateCross={pose:'cross',from:'R',tell:1.05,hit:.22,rec:1.55,dmg:18,avoid:['L','R','block'],glint:1,star:'counter',name:'Le troisième départ',say:'MAINTENANT !'};
 b.patterns.push(['doubleFake'],['jabR','doubleFake']);b.patterns2.push(['doubleFake'],['secondFake'],['jabL','doubleFake']);
 b.tips.unshift('Une ou deux feintes sans éclat peuvent précéder la vraie frappe. Attends le gant lumineux ; la riposte reste esquivable.');
}
// Deux sprinteurs : vraies constructions jab–cross–crochet, corps/tête et doubles jabs.
for(const id of ['rafale','sirene']){
 const b=B.boxerById(id);b.sprinter=true;
 const move=(pose,from,dmg,avoid)=>({pose,from,tell:.38,hit:.14,rec:.08,after:.05,dmg,hearts:1,blockCost:.45,avoid,glint:1,name:pose==='cross'?'Cross':pose==='body'?'Direct au corps':'Jab'});
 b.moves.pressJab=move('stepJab','L',5,['L','R','block']);b.moves.pressCross=move('cross','R',7,['L','R','block']);
 b.moves.pressBody=move('body','L',5,['L','R','block']);
 b.moves.pressHook={...move('checkHook','L',9,['R','duck']),tell:.65,rec:.12,name:'Crochet gauche'};
 b.moves.pressEnd={...move('cross','R',8,['L','R','block']),tell:.6,rec:1,after:.45,star:'counter',name:'Dernier cross',say:'DERNIER !'};
 b.moves.gasp={pose:'overheat',free:true,dur:2,star:'early',name:'À bout de souffle',say:'UNE… SECONDE…'};
 b.pressurePatterns=id==='rafale'?
  [['pressJab','pressCross','pressBody','pressCross','pressHook','pressEnd'],['pressJab','pressJab','pressCross','pressBody','pressHook','pressEnd'],['pressBody','pressCross','pressJab','pressCross','pressEnd']]:
  [['pressJab','pressCross','pressJab','pressCross','pressHook','pressEnd'],['pressJab','pressBody','pressCross','pressHook','pressEnd'],['pressJab','pressJab','pressCross','pressCross','pressEnd']];
 b.roundPlans=[{speed:.84,gap:.18,recovery:.8,damage:1,exposed:1,length:6,restEvery:0},
  {speed:1.16,gap:1.15,recovery:1.5,damage:.82,exposed:1.15,length:4,restEvery:3},
  {speed:1.5,gap:2.1,recovery:2.1,damage:.65,exposed:1.35,length:3,restEvery:2}];
 b.tips.unshift('Round 1 : défends-toi et alterne parades et esquives pour garder ton souffle. Aux rounds 2 et 3, ses séries raccourcissent, ses dégâts baissent et ses pauses deviennent de vraies occasions d’attaquer.');
 b.roundHints=['Il dépense tout ! Défends-toi, esquive pour récupérer.','Il ralentit : contre ses fins de séries et ses pauses.','Il est épuisé : profite des longues ouvertures !'];
}
// Ces deux-là refusent de tomber sans voir des étoiles ; toujours une source de ★ répétable.
for(const id of ['enclume','granite']){
 const b=B.boxerById(id);b.starFinish=true;
 b.moves.starTest={pose:'overhand',from:'R',tell:1.25,hit:.28,rec:2,dmg:16,avoid:['L','R'],glint:1,star:'counter',name:'Défi du menton',say:'FAIS-MOI VOIR DES ÉTOILES !'};
 b.tips.unshift('Il ne tombe que sur un uppercut étoilé. Esquive le Défi du menton, frappe pendant sa récupération pour gagner ★, puis lance ton uppercut avec Espace. Les coups ordinaires le laissent à 1 PV.');
}
// Ti-Bœuf : quatre signatures lisibles, disponibles dès le circuit Bronze.
{
 const b=B.boxerById('tibeuf');
 Object.assign(b.moves,{
  chop:{pose:'axeWind',from:'R',tell:1.25,hit:.23,rec:.08,after:.1,dmg:13,avoid:['L'],cue:'eyes',glint:1,name:'Abattage d’épinette',say:'ON ABAT L’ÉPINETTE !',sfx:'whistle',chain:['axeLeft','fellTree']},
  axeLeft:{pose:'axeDown',from:'L',tell:.64,hit:.23,rec:.08,after:.1,dmg:13,avoid:['R'],cue:'glove',glint:1,name:'Deuxième coup de hache'},
  fellTree:{pose:'sweep',from:'R',tell:.72,hit:.24,rec:1.7,dmg:15,avoid:['duck'],cue:'shoulder',glint:1,star:'counter',counterHigh:true,name:'L’arbre tombe !',say:'COUCHE-TOI !'},
  timber:{pose:'mooseCharge',from:'C',tell:2.1,hit:.34,rec:1.8,dmg:23,avoid:['L','R'],cue:'boots',glint:1,bellyCounter:true,lateDodge:.2,star:'counter',name:'Charge de l’orignal',say:'PLACE À L’ORIGNAL !',sfx:'wood'},
  maple:{pose:'mapleDrink',from:'C',free:true,dur:2.1,heal:.15,boost:10,prop:'maple',guard:'low',maple:true,name:'La cabane à sucre',say:'UNE P’TITE GORGÉE !'},
  stomp:{pose:'forestQuake',from:'C',tell:1.2,hit:.24,rec:0,after:.08,dmg:4,fx:'quake',avoid:['block'],cue:'ground',glint:1,name:'Séisme forestier',say:'TIMBERRR !',sfx:'stomp',chain:['quakeHook']},
  quakeHook:{pose:'hook',from:'L',tell:.48,hit:.2,rec:1.5,dmg:12,avoid:['R'],cue:'glove',glint:1,star:'counter',name:'Crochet après séisme'}
 });
 b.patterns=[['chop'],['timber'],['maple'],['stomp'],['jabL','hookR']];
 b.patterns2=[['stomp'],['chop'],['timber'],['maple'],['jabR','chop']];
 b.tips=[
  'Abattage : esquive à gauche, puis à droite, puis ↓ ↓ sous le grand crochet. Contre au visage pour gagner ★.',
  'Orignal : trois coups de botte. Esquive au dernier moment, ou un jab au ventre juste avant l’impact le met directement à terre. La garde ne suffit pas.',
  'Sirop : frappe au visage pendant la gorgée pour casser la flasque et ouvrir sa garde. Sinon il récupère 15 % de vie et accélère pendant 10 secondes.',
  'Séisme : maintiens ↓ pour absorber l’onde, puis esquive à droite le crochet gauche. Sans garde, l’onde te paralyse.',
  'Quand sa face se déforme de surprise, profite de la courte ouverture pour enchaîner.'
 ];
}
// Le coach alterne vraies séries courtes et pauses de riposte.
{
 const b=B.boxerById('coach');b.gap=[.7,1.25];
 const jab=(from,end=false)=>({pose:from==='L'?'jab':'cross',from,tell:.32,hit:.14,rec:end?1.1:.04,after:.04,dmg:from==='L'?5:7,avoid:['L','R','block'],glint:1,cue:'shoulder',...(end?{star:'counter'}:{})});
 b.moves.burstL=jab('L');b.moves.burstR=jab('R');b.moves.endL=jab('L',true);b.moves.endR=jab('R',true);
 b.moves.double={...jab('L'),tell:.62,chain:['endR'],say:'UN, DEUX !'};
 b.moves.triple={...jab('R'),tell:.68,chain:['burstL','endR'],say:'TROIS TEMPS !'};
 b.moves.tripleLeft={...jab('L'),tell:.62,chain:['burstR','endL']};
 for(const id of ['jabfL','jabfR'])Object.assign(b.moves[id],{rec:.04,after:.04});
 b.moves.blast.pose='whistle';b.moves.intervals.pose='whistle';
 b.patterns=[['jabL'],['double'],['triple'],['jabR'],['tripleLeft'],['blast'],['double'],['ball']];
 b.patterns2=[['triple'],['double'],['jabR'],['tripleLeft'],['blast'],['intervals'],['double'],['jacks']];
 b.tips.unshift('Il varie entre un, deux et trois coups : attends la fin de sa série pour riposter. Son sifflet à la bouche annonce la paralysie : garde haute !');
}
B.roundPlan=(b,round)=>b.roundPlans?.[Math.max(0,Math.min(2,round-1))]||{speed:1,gap:1,recovery:1,damage:1,exposed:1};
})(window);
