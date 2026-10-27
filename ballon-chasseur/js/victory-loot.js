// Victory-only collectibles. Rolls are saved before their presentation starts.
(function(B){
'use strict';const E=B.Equipment,L=B.Loot={},P=B.Game.prototype;
const grades=['Inhabituel','Rare','Épique','Légendaire','Mythique'],colors=['#7ce8ad','#60bcff','#cc8aff','#ffba4a','#ff79b4'];
const labels={power:'Lancer',speed:'Vitesse',catch:'Attrapé',hp:'Endurance',precision:'Précision'};
const slots=['gloves','boots','armor','charm','charm'],names=['Gantelets','Bottes','Cuirasse','Talisman','Relique'];
const schools={goblin:'fire',lizard:'poison',witch:'magic',skeleton:'earth',orc:'earth',harpy:'electric',beast:'ice',slime:'poison',specter:'magic',troll:'earth',gnoll:'fire',mandrake:'ice'};
const spells={
 'loot-sanctuary':{name:'Sanctuaire',desc:'Protège toute ton équipe pendant 3 secondes et soigne 10 vies à chacun.'},
 'loot-tempest':{name:'Élan du tonnerre',desc:'Vitesse ×1,6 pendant 6 secondes et bouclier pendant 4 secondes.'},
 'loot-pulse':{name:'Étoile dévorante',desc:'Inflige 12 dégâts aux ennemis proches et te rend 12 vies.'}
};
E.state.loot=Array.isArray(E.state.loot)?E.state.loot:[];
for(const item of E.state.loot)if(item?.lootOnly&&!E.items.some(i=>i.id===item.id))E.items.push(item);
L.roll=function(team,difficulty,rng=Math.random){
 const d=Math.max(0,Math.min(4,Math.floor(difficulty||0))),index=Math.max(0,[...B.MONSTER_TEAMS,...B.BOSS_TEAMS].findIndex(t=>t.id===team.id)),slot=slots[d],keys=Object.keys(labels),a=(index+d)%keys.length,b=(a+1+Math.floor(rng()*4))%keys.length,total=3+d*3+Math.floor(rng()*2),first=Math.ceil(total*.6),bonuses={[keys[a]]:first,[keys[b]]:total-first};
 E.state.lootSerial=(E.state.lootSerial||0)+1;
 const effect=d>=2&&rng()<.55?Object.keys(spells)[index%3]:null,source=team.name+' · '+B.DIFFICULTIES[d],name=names[d]+' — '+team.name.replace(/^Les /,'');
 return {id:'loot-'+Date.now().toString(36)+'-'+E.state.lootSerial+'-'+Math.random().toString(36).slice(2,8),name,slot,element:schools[team.species]||'magic',tier:Math.min(4,d+1),rarity:d,artVariant:32+index*5+d,price:0,lootOnly:true,source,difficulty:d,bonuses,active:!!effect,effect,cooldown:28,icon:'★',desc:Object.entries(bonuses).map(([k,v])=>'+'+v+' '+labels[k]).join(' · ')+'. '+(effect?'POUVOIR EXCLUSIF : '+spells[effect].name+' — '+spells[effect].desc:'')+' Butin de victoire uniquement.'};
};
L.award=function(g){
 if(g.lootReward)return g.lootReward;
 const human=g.ctrl.findIndex(c=>c!=='cpu');if(g.phase!=='end'||human<0||g.winner!==human)return null;
 const enemy=g.teams[1-human];if(!enemy?.species)return null;
 const owner=g.teams[human].players.find(id=>B.PLAYERS[id]&&!B.PLAYERS[id].monster);if(!owner)return null;
 const item=L.roll(enemy,g.difficulty);E.items.push(item);E.state.loot.push(item);E.hero(owner).owned.push(item.id);E.save();return g.lootReward={item,owner};
};
const buy=E.buy;E.buy=(pid,id)=>E.items.find(i=>i.id===id)?.lootOnly?false:buy(pid,id);
L.giveTo=function(reward,pid,equip=false){if(!B.PLAYERS[pid]||B.PLAYERS[pid].monster)return false;const old=E.hero(reward.owner),next=E.hero(pid),item=reward.item;if(pid!==reward.owner){old.owned=old.owned.filter(id=>id!==item.id);if(old.equipped[item.slot]===item.id)delete old.equipped[item.slot];if(!next.owned.includes(item.id))next.owned.push(item.id);reward.owner=pid;}if(equip)next.equipped[item.slot]=item.id;E.save();return true;};
const use=P.useItemMagic;P.useItemMagic=function(p,slot){const item=E.items.find(i=>i.id===p?.equipment?.[slot]);if(!spells[item?.effect])return use.call(this,p,slot);if(this.phase!=='play'||this.paused||!p.alive||!this.isPlayerControlled(p)||(p.itemCooldowns[item.id]||0)>0)return false;
 if(item.effect==='loot-sanctuary')for(const q of this.players.filter(q=>q.team===p.team&&q.alive)){q.magicShield=Math.max(q.magicShield||0,3);q.hp=Math.min(q.maxHp,q.hp+10);}
 if(item.effect==='loot-tempest'){p.magicShield=Math.max(p.magicShield||0,4);p.magicHaste=6;p.magicHasteMul=1.6;}
 if(item.effect==='loot-pulse'){for(const q of this.opponentsOf(p))if(q.alive&&Math.hypot(q.x-p.x,q.y-p.y)<220)this.hurt(q,12,{from:p,power:'nova',dot:true});p.hp=Math.min(p.maxHp,p.hp+12);this.fx.push({kind:'explosion',x:p.x,y:p.y,z:0,r:220,t:0,dur:.6});}
 p.itemCooldowns[item.id]=28;this.fx.push({kind:'pow',x:p.x,y:p.y,z:p.z+70,text:spells[item.effect].name,color:'#ffdd65',t:0,dur:1});this.emit('power',{p});return true;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
L.show=function(g){
 const reward=L.award(g);if(!reward||document.querySelector('#victory-loot'))return;const item=reward.item,dialog=document.createElement('dialog');dialog.id='victory-loot';dialog.style.setProperty('--loot-color',colors[item.rarity]);
 dialog.innerHTML='<p class="loot-eyebrow">BUTIN EXCLUSIF DE VICTOIRE</p><h1>LE TRÉSOR EST À TOI !</h1><p class="loot-source">'+esc(item.source)+'</p><div class="loot-window"><div class="loot-pointer">▼</div><div class="loot-track"></div></div><div class="loot-reveal" hidden></div><button class="arcade-button loot-skip">Révéler maintenant</button>';
 document.body.append(dialog);dialog.showModal();const track=dialog.querySelector('.loot-track'),viewport=dialog.querySelector('.loot-window');
 const enemy=g.teams[1-g.winner];for(let i=0;i<32;i++){const preview=i===26?item:L.roll(enemy,Math.floor(Math.random()*5)),card=document.createElement('div');card.className='loot-reel-card';card.style.setProperty('--card-color',colors[preview.rarity]);card.innerHTML=E.art(preview)+'<b>'+grades[preview.rarity]+'</b>';track.append(card);}
 let done=false,raf;const reveal=()=>{if(done)return;done=true;cancelAnimationFrame(raf);dialog.classList.add('loot-done');dialog.querySelector('.loot-skip').hidden=true;const target=viewport.clientWidth/2-26*136-62;track.style.transform='translateX('+target+'px)';const box=dialog.querySelector('.loot-reveal');box.hidden=false;box.innerHTML='<div class="loot-prize">'+E.art(item)+'</div><div class="loot-detail"><p class="loot-rarity">'+grades[item.rarity]+'</p><h2>'+esc(item.name)+'</h2><div class="loot-bonuses">'+Object.entries(item.bonuses).map(([k,v])=>'<span><b>+'+v+'</b> '+labels[k]+'</span>').join('')+'</div>'+(item.active?'<p class="loot-spell"><b>★ '+spells[item.effect].name+'</b><br>'+spells[item.effect].desc+'</p>':'')+'<label>Pour ton héros <select aria-label="Héros qui reçoit le butin">'+g.teams[g.winner].players.map(id=>'<option value="'+id+'"'+(id===reward.owner?' selected':'')+'>'+esc(B.PLAYERS[id].name)+'</option>').join('')+'</select></label><p class="loot-saved" role="status">Déjà rangé dans son inventaire.</p><button class="arcade-button arcade-go loot-equip">Équiper et continuer</button> <button class="arcade-button loot-keep">Garder</button></div>';
 box.querySelector('select').onchange=e=>L.giveTo(reward,e.target.value);box.querySelector('.loot-equip').onclick=()=>{L.giveTo(reward,box.querySelector('select').value,true);dialog.close();};box.querySelector('.loot-keep').onclick=()=>dialog.close();box.querySelector('.loot-equip').focus();B.audio?.play('catch');};
 dialog.querySelector('.loot-skip').onclick=reveal;dialog.addEventListener('cancel',e=>{if(!done){e.preventDefault();reveal();}});dialog.addEventListener('close',()=>{cancelAnimationFrame(raf);dialog.remove();});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();let last=-1;
 const tick=now=>{if(!dialog.isConnected)return;const t=Math.min(1,(now-start)/4800),ease=1-Math.pow(1-t,4),target=viewport.clientWidth/2-26*136-62;track.style.transform='translateX('+(ease*target)+'px)';const n=Math.floor(-ease*target/136);if(n!==last){last=n;B.audio?.play('ui');}if(t<1)raf=requestAnimationFrame(tick);else reveal();};if(reduced)reveal();else raf=requestAnimationFrame(tick);
};
const finish=B.ArcadeUI.finish;B.ArcadeUI.finish=function(g){L.award(g);finish(g);if(g.lootReward){const btn=document.createElement('button');btn.className='arcade-button';btn.textContent='★ Mon butin';btn.onclick=()=>L.show(g);document.querySelector('#result-buttons').prepend(btn);}};
})(window.BC);
