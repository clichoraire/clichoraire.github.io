/* Stable catalogue IDs: 0 is the permanent cape, then eight families of five. */
(function(root){
const names=['Ballon','Parapluie','Cerf-volant','Deltaplane','Balai de sorcière','Cape magique','Élytre','Ailes de dragon'];
const variants=[['Coquelicot','Azur','Trèfle','Étoilé','Royal'],['Ondée','Feuillage','Nuit étoilée','Royal','Enchanté'],['Écarlate','Grand bleu','Oiseau des bois','Étoile filante','Phénix'],['Aventure','Azur','Sylvestre','Astral','Royal'],['Brindilles','Clair de lune','Lierre','Sabbat','Phénix'],['Apprentie','Sylvestre','Constellation','Royale','Céleste'],['Turquoise','Saphir','Émeraude','Améthyste','Mithril solaire'],['Dragonnet','Émeraude','Glace','Ancien','Dragon solaire']];
const icons=['◉','☂','◇','△','✦','★','❖','♜'];
const descriptions=['Un peu de légèreté dans ce monde de brutes.','La météo annonce une pluie de chevaliers.','Le vent tire. Godefroy s’accroche.','Deux mains sur la barre, le ciel devant soi.','Pas besoin de permis de sorcière.','Une cape qui a plus d’un tour dans ses plis.','L’élégance d’un scarabée. Le poids d’une enclume.','Le dragon va reconnaître un air de famille.'];
const families=names.map((name,i)=>({id:i,name,icon:icons[i],description:descriptions[i],start:i*5+1,end:i*5+5}));
const items=[{id:0,name:'Aucun équipement',family:-1,variant:0},...families.flatMap(f=>variants[f.id].map((v,i)=>({id:f.start+i,name:f.name+' · '+v,family:f.id,variant:i+1,asset:'assets/wings/wing-'+(f.start+i)+'.png'})))];
const get=id=>items[Math.max(0,Math.min(40,Math.floor(id)||0))];
const legacy=[0,16,31,32,33,34,35,36,40];
const api={families,items,get,legacy};if(typeof module!=='undefined')module.exports=api;else root.GGWings=api;
})(typeof window!=='undefined'?window:globalThis);
