/* Save-slot handling, shared with regression tests. */
(function(root){
'use strict';
const KEY='go-godefroy-go.profiles.v2',LEGACY='go-godefroy-go.v1';
function read(storage,sanitize){let data={active:null,slots:[]};try{const raw=JSON.parse(storage.getItem(KEY));if(raw&&Array.isArray(raw.slots)){data.slots=raw.slots.filter(s=>s&&typeof s.id==='string').slice(0,12).map(s=>({id:s.id,name:String(s.name||'Godefroy').slice(0,24),save:sanitize(s.save)}));data.active=data.slots.some(s=>s.id===raw.active)?raw.active:null;}else{const old=JSON.parse(storage.getItem(LEGACY));if(old&&typeof old==='object'&&(old.day>1||old.gold>0)){data.slots.push({id:'legacy',name:'Mon premier serment',save:sanitize(old)});data.active='legacy';}}}catch{}return data;}
function create(data,name,fresh){if(data.slots.length>=12)return null;const slot={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:String(name).trim().slice(0,24)||'Godefroy',save:fresh()};data.slots.push(slot);data.active=slot.id;return slot;}
function write(storage,data){try{storage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
// Persist an empty registry rather than removing its key: legacy saves must not reappear.
function remove(storage,data,id=null){
 if(id!==null&&!data.slots.some(s=>s.id===id))return false;
 const slots=id===null?[]:data.slots.filter(s=>s.id!==id);
 const next={slots,active:slots.some(s=>s.id===data.active)?data.active:(slots[0]?.id??null)};
 if(!write(storage,next))return false;
 data.slots=next.slots;data.active=next.active;return true;
}
const api={KEY,read,create,write,remove};if(typeof module!=='undefined')module.exports=api;else root.GGProfiles=api;
})(typeof window!=='undefined'?window:globalThis);
