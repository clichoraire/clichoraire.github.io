// Espèces paisibles et variantes corrompues ; définitions communes au jeu et à l’éditeur.
(function(BK){
BK.WILDLIFE=[
['renard','Renard','🦊','#cf763f','fox'],['loup','Loup','🐺','#8996ab','wolf'],['ours','Ourson','🐻','#936447','bear'],['raton','Raton laveur','🦝','#9a9b9e','raccoon'],['ecureuil','Écureuil','🐿️','#b77b45','squirrel'],['herisson','Hérisson','🦔','#a08369','hedgehog'],['tortue','Tortue','🐢','#78a76a','turtle'],['grenouille','Grenouille','🐸','#76bb68','frog'],['chouette','Chouette','🦉','#a88868','owl'],['chauvesouris','Chauve-souris','🦇','#9180ae','bat'],
['biche','Biche','🦌','#cd996b','doe'],['faon','Faon','🦌','#d5ac82','fawn'],['mouton','Mouton','🐑','#f0eadc','sheep'],['chevre','Chèvre','🐐','#d6c4a0','goat'],['cochon','Cochon','🐷','#e9a4b5','pig'],['vache','Vache','🐄','#ede9d8','cow'],['cheval','Cheval','🐴','#a57451','horse'],['chameau','Chameau','🐪','#ccab77','camel'],['canard','Canard','🦆','#73a391','duck'],['paon','Paon','🦚','#42a9b2','peacock']
].map(([id,name,icon,color,shape],i)=>({id:'wild_'+id,name,icon,color,shape,scale:shape==='fawn'?.7:shape==='hedgehog'?.6:1,evil:i<10}));
for(const a of BK.WILDLIFE){
 const vegetarian=['doe','fawn','sheep','goat','cow','horse','camel','squirrel','duck','peacock'].includes(a.shape);
 BK.PET_FOODS[a.id]=vegetarian?['carrot','pumpkinpiece']:['fish','fishcooked','meatraw','meatcooked','poultryraw','poultrycooked'];
 BK.ENEMIES[a.id]={name:a.name,hp:1,speed:.65+(a.shape==='horse'?.3:0),score:0,xp:0,r:.26,color:a.color,behavior:'peaceful',peaceful:true,huntable:true,meat:1,wildlife:a};
 if(a.evil)BK.ENEMIES[a.id+'_evil']={...BK.ENEMIES[a.id],name:a.name+' maléfique',hp:2,speed:1.6,score:200,xp:20,behavior:'hunter',peaceful:false,huntable:false,dmg:10,evil:true};
}
BK.ITEMS.mini={name:'Mini',icon:'🔹',color:'#71d9ed',weight:1,adventureOnly:true,desc:'Tu deviens tout petit pendant 15 secondes. Un nouvel effet de taille remplace le précédent.'};
BK.ITEMS.giant={name:'Géant',icon:'🔶',color:'#eeb562',weight:1,adventureOnly:true,desc:'Tu deviens deux fois plus grand pendant 15 secondes. Un nouvel effet de taille remplace le précédent.'};
})(window.BK);
