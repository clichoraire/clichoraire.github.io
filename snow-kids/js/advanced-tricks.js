// Richard's lessons are bought per character; sequence commands work with keys or touch.
(function(SK){
 'use strict';const A=SK.AdvancedTricks={};
 const lessons=[
 ['doublegrab','Double prise',3,100,['left'],.65,8,0,0,['double']],
 ['nose360','Satellite nose grab',5,180,['right'],.8,11,1,0,['nose']],
 ['method540','Éclipse Method 540°',6,260,['up'],.9,14,1.5,0,['method']],
 ['starflip','Étoile renversée',8,360,['down'],.9,18,0,1,['star']],
 ['corkscrew','Corkscrew 720°',10,500,['left','up'],1,23,2,1,['tuck']],
 ['superorbit','Orbite Superman',12,650,['right','down'],1.05,28,1,0,['superman']],
 ['doubleflip','Double salto fusée',15,850,['up','left','down'],1.1,35,0,2,['tuck','spread']],
 ['rodeo1080','Rodéo cosmique 1080°',20,1150,['down','right','up'],1.2,44,3,1,['melon','tail']],
 ['triplecork','Triple cork météore',30,1600,['left','up','right','down'],1.35,58,3,3,['tuck','cross','star']],
 ['legend2160','Supernova 2160°',50,2500,['up','right','down','left','up'],1.5,80,6,2,['double','superman','star']]
 ];
 A.ids=lessons.map(([id,name,level,price,sequence,dur,coins,turns,flipTurns,poses])=>{
  SK.TRICKS[id]={name,level,price,sequence,dur,coins,turns,flipTurns,poses,pose:poses[0],btn:'advanced',anim:turns?'spin':'pose',sign:1};return id;
 });
 const arrows={left:'←',right:'→',up:'↑',down:'↓'};
 A.command=d=>'C + X · '+d.sequence.map(k=>arrows[k]).join(' · ')+' · relâche C';
 A.canBuy=(s,id)=>{const d=SK.TRICKS[id];return A.ids.includes(id)&&!(s.ownedTricks||[]).includes(id)&&SK.Progression.info(s).level>=d.level&&(s.gold||0)>=d.price;};
 A.buy=(s,id)=>{if(!A.canBuy(s,id))return false;s.gold-=SK.TRICKS[id].price;(s.ownedTricks??=[]).push(id);return true;};
 A.input=function(r,dt){
  const i=r.input,p=r.prev;
  // Arm by pressing the second action while the first is held. A release cannot arm it.
  if(!r.advancedCombo&&i.jump&&i.trick&&(!p.jump||!p.trick)&&(r.ownedTricks||[]).length){r.advancedCombo={sequence:[],last:'',age:0};r.curTrick=null;r.trickQueue=null;}
  const c=r.advancedCombo;if(!c)return false;
  c.age+=dt;const dir=i.steer<-.3?'left':i.steer>.3?'right':i.down?'down':i.up?'up':'';
  if(dir&&dir!==c.last)c.sequence.push(dir);c.last=dir;
  if(!i.trick){const id=A.ids.find(id=>(r.ownedTricks||[]).includes(id)&&SK.TRICKS[id].sequence.join(',')===c.sequence.join(','));r.advancedCombo=null;if(id&&r.state==='air'){r.trickQueue={id,ttl:.45};r.race.emit({type:'advancedready',r,id});}return true;}
  if(c.age>4||c.sequence.length>5)r.advancedCombo=null;
  return true;
 };
 A.close=()=>{SK.TrickPreview?.close();document.getElementById('richard-tricks')?.close();document.getElementById('richard-tricks')?.remove();};
 A.open=function(save,store){
  A.close();const d=document.createElement('dialog');d.id='richard-tricks';d.setAttribute('aria-labelledby','richard-tricks-title');
  d.innerHTML='<header><h2 id="richard-tricks-title">Les acrobaties de Richard</h2><button type="button" class="trick-shop-close" aria-label="Fermer">×</button></header><p>Maintiens Figure (C) + Sauter (X), puis entre les directions. Tu peux préparer au sol : relâche Sauter pour décoller, puis Figure en l’air pour lancer l’acrobatie. Relâche une direction avant de la répéter.</p><div class="trick-shop-balance"></div><div class="trick-shop-grid"></div>';
  const racer=SK.fakeRacer(save.advChar||save.char||'adam',save.advBoard||'freestyle','air',SK.lookOf(SK.charById(save.advChar||save.char||'adam'),save));
  const refresh=()=>{
   d.querySelector('.trick-shop-balance').textContent='⭐ Niveau '+SK.Progression.info(save).level+' · 🪙 '+SK.fmtGold(save.gold,false);
   d.querySelector('.trick-shop-grid').replaceChildren();
   for(const id of A.ids){const t=SK.TRICKS[id],owned=(save.ownedTricks||[]).includes(id),locked=SK.Progression.info(save).level<t.level,card=document.createElement('article');card.innerHTML='<span class="trick-level">Niveau '+t.level+'</span><h3>'+t.name+'</h3><p>'+A.command(t)+'</p><strong>+'+t.coins+' points de base</strong>';
    const preview=document.createElement('button');preview.type='button';preview.textContent='▶ Voir la figure';preview.dataset.trickPreview=id;preview.onclick=()=>SK.TrickPreview.open(preview,racer,id);card.append(preview);
    const buy=document.createElement('button');buy.type='button';buy.className='trick-buy';buy.textContent=owned?'✓ Apprise':locked?'🔒 Niveau '+t.level:'Apprendre · '+t.price+' 🪙';buy.disabled=!A.canBuy(save,id);buy.title=owned?'Cette figure est disponible en course':locked?'Atteins le niveau requis':save.gold<t.price?'Pas assez de pièces':'Acheter cette leçon';buy.onclick=()=>{if(A.buy(save,id)){store();SK.Audio.sfx('buy');refresh();}};card.append(buy);d.querySelector('.trick-shop-grid').append(card);
   }
  };
  d.querySelector('.trick-shop-close').onclick=A.close;d.addEventListener('cancel',e=>{e.preventDefault();A.close();});document.body.append(d);refresh();d.showModal();
 };
})(window.SK);
