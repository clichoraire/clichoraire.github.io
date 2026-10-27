(function(B){
'use strict';const E=B.Equipment,P=B.Game.prototype;
E.categories={...E.elements,magic:{name:'Magie',icon:'✨',color:'#ce9cff'}};
const sets=[
 ['vitality','Cuirasse de vitalité','armor','❤️',[12,20,30,45],v=>'+'+v+' vies maximales.'],
 ['strength','Gantelets du géant','gloves','💪',[2,4,6,9],v=>'+'+v+' dégâts par lancer.'],
 ['resistance','Armure du gardien','armor','🛡️',[.1,.18,.25,.35],v=>Math.round(v*100)+' % de dégâts en moins, tous éléments.'],
 ['precision','Gants du faucon','gloves','🎯',[2,4,6,8],v=>'+'+v+' en précision (maximum 18).'],
 ['shield','Sceau protecteur','charm','🔮',[5,6,8,10],v=>'CLIQUE : bouclier invulnérable '+v+' s. Recharge 30 s.'],
 ['heal','Cœur de lumière','charm','💚',[12,18,24,32],v=>'CLIQUE : soigne '+v+' vies. Recharge 25 s.'],
 ['haste','Bottes du zéphyr','boots','💨',[1.25,1.4,1.55,1.7],v=>'CLIQUE : vitesse ×'+v+' pendant 6 s. Recharge 20 s.'],
 ['nova','Gants de nova','gloves','🌟',[6,9,12,16],v=>'CLIQUE : onde magique de '+v+' dégâts autour de toi. Recharge 22 s.']
];
for(const [effect,name,slot,icon,values,desc]of sets)values.forEach((value,i)=>E.items.push({id:'magic-'+effect+'-'+(i+1),element:'magic',slot,icon,tier:i+1,name:name+' '+['I','II','III','IV'][i],price:[90,170,280,420][i],desc:desc(value),effect,value,active:['shield','heal','haste','nova'].includes(effect),cooldown:{shield:30,heal:25,haste:20,nova:22}[effect]||0}));
E.maxHp=(d,stats)=>B.phys(d,stats).maxHp+(d.monster?0:(E.hero(d.id).life||0)+E.items.filter(i=>Object.values(E.hero(d.id).equipped).includes(i.id)&&i.effect==='vitality').reduce((n,i)=>n+i.value,0));
E.worn=p=>Object.values(p.equipment||{}).map(id=>E.items.find(i=>i.id===id)).filter(Boolean);
const make=P.makePlayer;P.makePlayer=function(...args){const p=make.apply(this,args);p.itemCooldowns={};p.magicShield=0;p.magicHaste=0;p.magicHasteMul=1;p.magicResistance=0;for(const item of E.worn(p)){if(item.effect==='vitality'){p.maxHp+=item.value;p.hp=p.maxHp;p.phys.maxHp=p.maxHp;}if(item.effect==='strength')p.phys.dmg+=item.value;if(item.effect==='resistance')p.magicResistance=item.value;if(item.effect==='precision')p.phys.aimSpread=B.aimSpread(Math.min(18,(p.stats.precision??6)+item.value));}return p;};
P.useItemMagic=function(p,slot){if(this.phase!=='play'||this.paused||!p?.alive||!this.isPlayerControlled(p))return false;const item=E.items.find(i=>i.id===p.equipment?.[slot]);if(!item?.active||(p.itemCooldowns[item.id]||0)>0)return false;if(item.effect==='heal'&&p.hp>=p.maxHp)return false;
 if(item.effect==='shield'){p.magicShield=item.value;p.burn=null;p.fx.slowT=p.fx.stunT=0;if(p.state==='stun')this.setState(p,'idle');}
 if(item.effect==='heal')p.hp=Math.min(p.maxHp,p.hp+item.value);
 if(item.effect==='haste'){p.magicHaste=6;p.magicHasteMul=item.value;}
 if(item.effect==='nova'){for(const q of this.opponentsOf(p))if(Math.hypot(p.x-q.x,p.y-q.y)<220)this.hurt(q,item.value,{from:p,power:'nova',dot:true});this.fx.push({kind:'explosion',x:p.x,y:p.y,z:0,r:220,t:0,dur:.6});}
 p.itemCooldowns[item.id]=item.cooldown;this.fx.push({kind:'pow',x:p.x,y:p.y,z:p.z+70,text:item.icon+' '+item.name,color:'#dab4ff',t:0,dur:1});this.emit('power',{p});return true;};
const update=P.update;P.update=function(dt,input){if(this.paused)return;if(this.phase==='play'){for(const p of this.players){p.magicShield=Math.max(0,(p.magicShield||0)-dt);p.magicHaste=Math.max(0,(p.magicHaste||0)-dt);for(const id of Object.keys(p.itemCooldowns||{}))p.itemCooldowns[id]=Math.max(0,p.itemCooldowns[id]-dt);}}return update.call(this,dt,input);};
const hurt=P.hurt;P.hurt=function(p,dmg,o={}){if(!o.penalty&&p.magicShield>0)return false;return hurt.call(this,p,o.penalty?dmg:Math.max(1,Math.round(dmg*(1-(p.magicResistance||0)))),o);};
const contact=P.contact;P.contact=function(p,b){if(p.magicShield>0){this.kill(b,.3);this.emit('catch',{p});return;}return contact.call(this,p,b);};
const ignite=P.ignite;P.ignite=function(p,from){if(p.magicShield>0)return;return ignite.call(this,p,from);};
const speed=P.speedMul;P.speedMul=function(p){return speed.call(this,p)*(p.magicHaste>0?p.magicHasteMul:1);};
B.drawMagicShield=function(c,p,t){if(!(p.magicShield>0))return;c.save();const y=p.y-p.z-26,r=37*Math.max(.7,p.def.size);c.fillStyle='#b5a6ff30';c.strokeStyle='#d5c2ff';c.shadowColor='#b18cff';c.shadowBlur=14;c.lineWidth=3;c.beginPath();c.ellipse(p.x,y,r,r*1.15,0,0,Math.PI*2);c.fill();c.stroke();for(let i=0;i<5;i++){const a=t*2+i*Math.PI*2/5;c.fillStyle='#fff5b1';c.fillRect(p.x+Math.cos(a)*r-2,y+Math.sin(a)*r*1.15-2,4,4);}c.font='bold 11px Arial';c.textAlign='center';c.fillStyle='#fff';c.fillText(Math.ceil(p.magicShield)+' s',p.x,y-r*1.15-5);c.restore();};
// Real buttons support mouse, touch and keyboard focus; their timers use game time.
B.updateMagicBar=function(g,paused){if(typeof document==='undefined')return;let bar=document.querySelector('#magic-bar');if(!bar){bar=document.createElement('div');bar.id='magic-bar';document.querySelector('#screen-match .stage').append(bar);}const team=g.ctrl.findIndex(c=>c!=='cpu'),p=team<0?null:g.controlled(team),items=p?E.worn(p).filter(i=>i.active):[];bar.hidden=!p||!items.length||g.phase==='end';if(bar.hidden)return;const key=p.id+items.map(i=>i.id).join();if(bar.game!==g){bar.dataset.key='';bar.game=g;}if(bar.dataset.key!==key){bar.dataset.key=key;bar.replaceChildren();const label=document.createElement('b');label.textContent=p.def.name;bar.append(label);for(const item of items){const button=document.createElement('button');button.type='button';button.dataset.item=item.id;button.innerHTML=B.Equipment.art(item)+'<small></small>';button.title=item.name+' — '+item.desc;button.setAttribute('aria-label',button.title);button.onclick=()=>{if(g.useItemMagic(p,item.slot))B.audio.play('power');};bar.append(button);}}
 for(const item of items){const button=bar.querySelector('[data-item="'+item.id+'"]'),left=p.itemCooldowns[item.id]||0;button.disabled=paused||g.phase!=='play'||left>0||(item.effect==='heal'&&p.hp>=p.maxHp);button.querySelector('small').textContent=left>0?Math.ceil(left)+' s':'PRÊT';button.style.setProperty('--cooldown',(left/item.cooldown*100)+'%');}
};
})(window.BC);
