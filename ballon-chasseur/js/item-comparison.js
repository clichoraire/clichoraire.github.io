(function(B){
'use strict';const E=B.Equipment;
const labels={power:'Lancer',speed:'Vitesse',catch:'Attrapé',hp:'Endurance',precision:'Précision'};
const percentages={speed:'Vitesse de déplacement',hp:'Vie maximale',throwSpeed:'Vitesse du ballon',catch:'Fenêtre d’attrapé',precision:'Réduction de dispersion',damage:'Dégâts'};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const properties=item=>{const out={};if(!item)return out;
 for(const [key,value]of Object.entries(item.bonuses||{}))out['stat-'+key]={label:labels[key]||key,value,unit:' pts'};
 for(const [key,value]of Object.entries(item.percentBonuses||{}))out['percent-'+key]={label:percentages[key]||key,value:value*100,unit:' %'};
 const passive={vitality:['Vie maximale',' PV',1],strength:['Dégâts par lancer','',1],resistance:['Réduction des dégâts',' %',100],precision:['Précision',' pts',1]};
 if(!item.active&&passive[item.effect]){const [label,unit,mul]=passive[item.effect],key=item.effect==='precision'?'stat-precision':'effect-'+item.effect;out[key]={label,unit,value:(out[key]?.value||0)+item.value*mul};}
 return out;
};
const special=item=>{if(!item)return [];const lines=[];if(item.active)lines.push(item.desc.split('CLIQUE :').at(-1));if(E.elements[item.element]&&item.tier>0){const e=E.elements[item.element].name;lines.push(item.slot==='armor'?'Résistance '+e+' : '+(Math.min(item.tier,2)*25)+' %':item.slot==='boots'?'Protection du terrain '+e+(item.tier>=2?' et résistance 25 %':''):item.slot==='gloves'?'Protection à l’attrapé '+e+(item.tier>=2?' et résistance 25 %':''):'Protection des effets '+e+' : '+(item.tier>=2?'immunité':'durée divisée par deux'));}return lines;};
E.compareItems=(item,current)=>{const before=properties(current),after=properties(item),rows=[];
 for(const key of new Set([...Object.keys(before),...Object.keys(after)])){const prop=after[key]||before[key],old=before[key]?.value||0,next=after[key]?.value||0,delta=Math.round((next-old)*100)/100;rows.push({...prop,before:old,after:next,delta});}
 const old=special(current),next=special(item);for(const text of old)if(!next.includes(text))rows.push({label:text,delta:-1,special:true});for(const text of next)if(!old.includes(text))rows.push({label:text,delta:1,special:true});return rows;
};
E.comparisonHTML=(pid,item)=>{const current=E.items.find(i=>i.id===E.hero(pid).equipped[item.slot]);if(current?.id===item.id)return '<section class="item-comparison"><b>Objet actuellement équipé</b></section>';
 const rows=E.compareItems(item,current),fmt=n=>Number(n.toFixed(2)).toLocaleString('fr');return '<section class="item-comparison"><h3>Comparaison des bonus</h3><p>'+escape(current?'Équipé : '+current.name:'Aucun objet équipé dans cet emplacement')+'</p><ul>'+rows.map(row=>'<li class="'+(row.delta>0?'item-gain':row.delta<0?'item-loss':'item-equal')+'"><span>'+escape(row.label)+'</span><b>'+(row.special?(row.delta>0?'+ Gagné':'− Perdu'):escape((row.delta>0?'+':'')+fmt(row.delta)+row.unit))+'</b>'+(row.special?'':'<small>'+escape(fmt(row.before)+row.unit+' → '+fmt(row.after)+row.unit)+'</small>')+'</li>').join('')+'</ul></section>';};
})(window.BC);
