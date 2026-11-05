// Espèces paisibles et variantes corrompues ; définitions communes au jeu et à l’éditeur.
(function(BK){
BK.WILDLIFE=[
['renard','Renard','🦊','#cf763f','fox'],['loup','Loup','🐺','#8996ab','wolf'],['ours','Ourson','🐻','#936447','bear'],['raton','Raton laveur','🦝','#9a9b9e','raccoon'],['ecureuil','Écureuil','🐿️','#b77b45','squirrel'],['herisson','Hérisson','🦔','#a08369','hedgehog'],['tortue','Tortue','🐢','#78a76a','turtle'],['grenouille','Grenouille','🐸','#76bb68','frog'],['chouette','Chouette','🦉','#a88868','owl'],['chauvesouris','Chauve-souris','🦇','#9180ae','bat'],
['biche','Biche','🦌','#cd996b','doe'],['faon','Faon','🦌','#d5ac82','fawn'],['mouton','Mouton','🐑','#f0eadc','sheep'],['chevre','Chèvre','🐐','#d6c4a0','goat'],['cochon','Cochon','🐷','#e9a4b5','pig'],['vache','Vache','🐄','#ede9d8','cow'],['cheval','Cheval','🐴','#a57451','horse'],['chameau','Chameau','🐪','#ccab77','camel'],['canard','Canard','🦆','#73a391','duck'],['paon','Paon','🦚','#42a9b2','peacock']
].map(([id,name,icon,color,shape],i)=>({id:'wild_'+id,name,icon,color,shape,scale:shape==='squirrel'?.55:shape==='fawn'?.7:shape==='hedgehog'?.6:1,evil:i<10}));
for(const a of BK.WILDLIFE){
 const vegetarian=['doe','fawn','sheep','goat','cow','horse','camel','squirrel','duck','peacock'].includes(a.shape);
 BK.PET_FOODS[a.id]=vegetarian?['carrot','pumpkinpiece']:['fish','fishcooked','meatraw','meatcooked','poultryraw','poultrycooked'];
 BK.ENEMIES[a.id]={name:a.name,hp:1,speed:.65+(a.shape==='horse'?.3:0),score:0,xp:0,r:.26,color:a.color,behavior:'peaceful',peaceful:true,huntable:true,meat:1,wildlife:a};
 if(a.evil)BK.ENEMIES[a.id+'_evil']={...BK.ENEMIES[a.id],name:a.name+' maléfique',hp:2,speed:1.6,score:200,xp:20,behavior:'hunter',peaceful:false,huntable:false,dmg:10,evil:true};
}
for(const gnome of [
 {id:'gnome_stone',name:'Gnome des pierres',icon:'🧙',shape:'gnome',color:'#487879',hat:'#456687',beard:'#ece5cf',scale:.82,residence:'outdoor_shelter',house:'Refuge de pierre'},
 {id:'gnome_mushroom',name:'Gnome des champignons',icon:'🍄',shape:'gnome',color:'#71964d',hat:'#c95158',beard:'#f8deae',scale:.78,residence:'enchanted_1',house:'Maison champignon'}
]){
 gnome.hint='Petit voisin paisible. Pose-le sur ou près de « '+gnome.house+' » : il se promène puis rentre chez lui. Offre-lui un aliment de son menu pour en faire ton allié.';
 BK.WILDLIFE.push(gnome);
 BK.ENEMIES[gnome.id]={name:gnome.name,hp:1,speed:1.15,r:.2,color:gnome.color,behavior:'peaceful',peaceful:true,bondPetsRequired:0,wildlife:gnome,residence:gnome.residence};
}
// Les œufs partagent l'éclosion et l'apprivoisement ; seul le dragon souffle du feu.
BK.HATCHING_EGGS = {
 castle_egg:{id:'baby_dragon',name:'Petit dragon',eggName:'Œuf de dragon',shape:'dragon',color:'#68b89a',shell:'#9bd3c0'},
 egg_turtle:{id:'baby_turtle',name:'Petite tortue',eggName:'Œuf de tortue',shape:'turtle',color:'#89b76c',shell:'#e4e8b2'},
 egg_duck:{id:'baby_duck',name:'Caneton',eggName:'Œuf de canard',shape:'duck',color:'#f4d466',shell:'#fff0ca'},
 egg_owl:{id:'baby_owl',name:'Petite chouette',eggName:'Œuf de chouette',shape:'owl',color:'#b9a2d1',shell:'#dbcfec'}
};
BK.HATCHLING_FOODS=[...new Set([...Object.keys(BK.ALLY_FOOD_HEAL),...Object.keys(BK.COOKABLE),...Object.values(BK.COOKABLE),'carrot','honey'])];
BK.normalizeEggBombs=v=>Number.isFinite(Number(v))?Math.max(1,Math.min(99,Math.floor(Number(v)))):1;
BK.eggCrackStage=(hits,total)=>Math.min(3,Math.floor(hits/Math.ceil(BK.normalizeEggBombs(total)/4)));
BK.normalizeEggCare=(value={})=>{
 const amount=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(20,Math.floor(Number(v)))):1;
 const foods=Array.isArray(value.foods)?[...new Set(value.foods.filter(f=>BK.HATCHLING_FOODS.includes(f)))]:[];
 return {pets:amount(value.pets??1),meals:amount(value.meals??1),foods:foods.length?foods:null};
};
for(const [deco,a] of Object.entries(BK.HATCHING_EGGS)) {
 const hint='Une explosion ouvre l’œuf en deux. Une caresse et un repas (n’importe quelle nourriture) en font un ami.'+(a.shape==='dragon'?' Son souffle de feu atteint trois cases.':' Il aide au contact.');
 const existing=BK.CASTLE_DECOR.find(d=>d.deco===deco);
 if(existing)Object.assign(existing,{solid:2,hint});else BK.CASTLE_DECOR.push({deco,name:a.eggName,icon:'🥚',solid:2,wall:false,hint});
 BK.CASTLE_DECOR.push({deco:deco+'_shell',name:'Coquille',solid:0,hidden:true});
 BK.ENEMIES[a.id]={name:a.name,hp:3,speed:1.2,score:0,xp:0,r:.22,color:a.color,behavior:'peaceful',peaceful:true,huntable:false,hatchling:true,bondPetsRequired:1,wildlife:{shape:a.shape,color:a.color,scale:.7}};
 BK.PET_FOODS[a.id]=BK.HATCHLING_FOODS;
}
for(const a of BK.WILDLIFE)if(a.residence)BK.PET_FOODS[a.id]=BK.HATCHLING_FOODS;
BK.ITEMS.mini={name:'Mini',icon:'🔹',color:'#71d9ed',weight:1,adventureOnly:true,desc:'Tu deviens tout petit pendant 15 secondes. Un nouvel effet de taille remplace le précédent.'};
BK.ITEMS.giant={name:'Géant',icon:'🔶',color:'#eeb562',weight:1,adventureOnly:true,desc:'Tu deviens deux fois plus grand pendant 15 secondes. Un nouvel effet de taille remplace le précédent.'};
})(window.BK);
