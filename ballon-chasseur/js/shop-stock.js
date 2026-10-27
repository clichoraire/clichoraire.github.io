// A saved selection of sixteen modest, level-scaled pieces, renewed after a match.
(function(B){
'use strict';const E=B.Equipment,S=B.ShopStock={};
const state=E.state.shopStock??={revision:0,offers:{},purchased:[]};
const labels={speed:'vitesse de déplacement',hp:'vie maximale',throwSpeed:'vitesse du ballon',catch:'fenêtre d’attrapé',precision:'précision (dispersion réduite)',damage:'dégâts'};
const templates=E.items.filter(i=>!i.lootOnly&&!i.shopRolled&&(i.effect||i.bonuses));
const add=i=>{if(!E.items.some(x=>x.id===i.id))E.items.push(i);return i;};
state.purchased.forEach(add);Object.values(state.offers).forEach(o=>o.items.forEach(add));
const shuffle=arr=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
S.level=pid=>Math.max(1,...[B.Adventure.load(),B.Adventure.load(pid)].map(s=>B.Adventure.level(s?.chars?.[pid])));
S.offers=pid=>{if(state.offers[pid]?.revision===state.revision)return state.offers[pid].items;
 const level=S.level(pid),items=[],count=level>=30?3:level>=10?2:1;
 for(const slot of Object.keys(E.slots))for(const source of shuffle(templates.filter(i=>i.slot===slot)).slice(0,4)){
 const percentBonuses={};for(const key of shuffle(Object.keys(labels)).slice(0,count))percentBonuses[key]=(3+Math.floor(Math.random()*3)+Math.min(7,Math.floor((level-1)/5)))/100;
 const desc=Object.entries(percentBonuses).map(([k,v])=>'+'+Math.round(v*100)+' % '+labels[k]).join(' · ')+'.';
 const item={id:'shop-'+state.revision+'-'+pid+'-'+items.length,shopRolled:true,artSource:source.id,name:source.name,slot,element:'magic',tier:0,artVariant:source.artVariant??templates.indexOf(source)%16,price:Math.round(35+level*6+Object.values(percentBonuses).reduce((a,v)=>a+v*400,0)),percentBonuses,bonuses:{},active:false,icon:source.icon||'✦',desc,level};items.push(add(item));
 }
 state.offers[pid]={revision:state.revision,level,items:shuffle(items)};E.save();return state.offers[pid].items;
};
const buy=E.buy;E.buy=function(pid,id){const item=E.items.find(i=>i.id===id);if(!item?.shopRolled||!S.offers(pid).some(i=>i.id===id))return false;const ok=buy.call(this,pid,id);if(ok){if(!state.purchased.some(i=>i.id===id))state.purchased.push(item);E.save();}return ok;};
const award=E.award;E.award=function(g){const fresh=g.goldReward==null;const result=award.call(this,g);if(fresh&&g.goldReward!=null){state.revision++;state.offers={};const owned=new Set(Object.values(E.state.heroes).flatMap(h=>h.owned||[]));E.items=E.items.filter(i=>!i.shopRolled||owned.has(i.id));E.save();}return result;};
})(window.BC);
