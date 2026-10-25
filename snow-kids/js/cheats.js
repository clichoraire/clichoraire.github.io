// Codes de test et petit secret du chalet.
(function(SK){
  'use strict';
  const C=SK.Cheats={};
  const codes=[
    {code:'CABANE64',label:'Débloquer la cabane de debug',apply:s=>{s.debugHouse=true;}},
    {code:'PACTOLE64',label:'Ajouter 10 000 G',apply:s=>{s.gold=Math.min(9999999,s.gold+10000);}},
    {code:'TETEPROTEGEE',label:'Recevoir le casque',apply:s=>{s.gear=[...new Set([...s.gear,'casque'])];}},
    {code:'SANS CASQUE',label:'Retirer le casque pour comparer',apply:s=>{s.gear=s.gear.filter(x=>x!=='casque');}},
    {code:'GARDE ROBE',label:'Recevoir tous les vêtements',apply:s=>{s.wardrobe=[...new Set([...(s.wardrobe||[]),...SK.WARDROBE.filter(x=>x.cat==='linge').map(x=>x.id)])];}},
    {code:'PLANCHES64',label:'Recevoir toutes les planches',apply:s=>{s.boards=SK.BOARDS.map(x=>x.id);}}
  ];
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  C.apply=function(text,save){const entry=codes.find(x=>normalize(x.code)===normalize(text));if(!entry)return null;entry.apply(save);return entry.label;};
  C.sequence=function(){let count=0,last=null;return {reset(){count=0;last=null;},press(now){if(last===null||now-last>=4000)count=0;last=now;if(++count===7){this.reset();return true;}return false;}};};
  const sequence=C.sequence();C.reset=()=>sequence.reset();
  C.init=function(opts){
    const dialog=document.getElementById('cheat-dialog'),body=document.getElementById('cheat-body'),title=document.getElementById('cheat-title');
    document.getElementById('cheat-close').onclick=()=>dialog.close();
    dialog.addEventListener('keydown',e=>e.stopPropagation());
    dialog.addEventListener('keyup',e=>e.stopPropagation());
    dialog.addEventListener('close',()=>{SK.Input.keys={};SK.Input.pressed={};body.replaceChildren();});
    const emergency=document.getElementById('shop-emergency');
    emergency.onclick=()=>{
      SK.Audio.init();SK.Audio.sfx('emergency');
      emergency.animate([{transform:'translateY(0)'},{transform:'translateY(5px)',offset:.25},{transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
      if(sequence.press(performance.now())){
        title.textContent='Les secrets du chalet';body.innerHTML='<p>Dans le village, appuie sur Entrée et écris un code dans le chat.</p><dl>'+codes.map(x=>'<dt>'+x.code+'</dt><dd>'+x.label+'</dd>').join('')+'<p>Les vêtements et les planches se choisissent ensuite dans la boutique.</p>';
        SK.Audio.sfx('unlock');dialog.showModal();
      }
    };
  };
})(window.SK);
