(function(SK){
 const P=SK.PauseCard={};
 P.stats=r=>{
   const c=r.gear?.couronne?1:0,b=r.board,d=r.def;
   const values={speed:d.speed+b.speed+c,corner:d.corner+b.corner+c+(r.gear?.bottes?1:0),acceleration:(d.acceleration||3)+(b.acceleration||0)+c,jump:(d.jump||3)+(b.jump||0)+c+(r.gear?.ressort?1:0),strength:r.strength};
   for(const k in values)values[k]=SK.capStat(values[k]);return values;
 };
 P.show=(root,racers)=>{
   root.replaceChildren();
   for(const r of racers){
     const card=document.createElement('article');card.className='pause-kid';
     const canvas=document.createElement('canvas');canvas.width=520;canvas.height=520;canvas.setAttribute('aria-label',r.def.name+' sur sa planche');
     const info=document.createElement('div');info.className='pause-kid-stats';const name=document.createElement('h3');name.textContent=r.def.name;info.append(name);
     const values=P.stats(r);
     for(const [key,label] of [['speed','Vitesse'],['corner','Virage'],['acceleration','Accélération'],['jump','Saut'],['strength','Force']]){
       const row=document.createElement('div');row.className='pause-stat';row.innerHTML='<span>'+label+'</span><span class="pause-meter">'+SK.statTicks(values[key])+'</span><b>'+values[key]+' <small>/ 50</small></b>';info.append(row);
     }
     card.append(canvas,info);root.append(card);
     const c=canvas.getContext('2d');c.translate(260,430);
     const look={...SK.lookOf(r.def,{look:{[r.def.id]:r.look||{}},gear:Object.keys(r.gear||{})}),...r.look};
     // Render the actual equipped outfit, as on the wardrobe's fitting platform.
     SK.Sprites.shopPose(c,r,look,170,0);
   }
 };
})(window.SK);
