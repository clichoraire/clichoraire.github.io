// Casier personnel : uniquement les tenues de départ et les vêtements possédés.
(function(SK){
  const W=SK.Wardrobe={};
  W.items=function(save){
    const ch=SK.charById(save.advChar||save.char),base=SK.lookOf(ch,{gear:[],look:{}});
    const original=[['jacket','Manteau de départ'],['pants','Pantalon de départ']].map(([slot,name])=>({id:'original-'+slot,kind:'wardrobe',slot,value:base[slot],name}));
    const owned=SK.WARDROBE.filter(it=>it.cat==='linge'&&(!(it.slot==='hat'&&it.value==='none')||SK.WARDROBE.some(h=>(h.slot==='hat'&&h.value!=='none'||h.slot==='hatColor')&&(save.wardrobe||[]).includes(h.id)))&&(it.price===0||(save.wardrobe||[]).includes(it.id))).map(it=>({...it,kind:'wardrobe'}));
    const accessories=SK.GEAR.filter(it=>(save.gear||[]).includes(it.id)&&(SK.isHelmet(it.id)||it.id==='couronne'||it.id==='fusee'||SK.isGoggles(it.id))).map(it=>({...it,kind:'gear',toggle:true,slot:it.id==='fusee'?'rocketPack':(SK.isHelmet(it.id)||it.id==='couronne')?'helmet':'goggles',value:(SK.isGoggles(it.id)||SK.isHelmet(it.id)||it.id==='couronne')?it.id:true}));
    accessories.push(...SK.GEAR.filter(it=>['veste','sifflet','gants','gantsMauves'].includes(it.id)&&(save.gear||[]).includes(it.id)).map(it=>({...it,kind:'gear',toggle:true,slot:{veste:'paddedVest',sifflet:'whistle',gants:'gloves',gantsMauves:'gloves'}[it.id],value:it.id.startsWith('gants')?it.id:true})));
    original.push({id:'boots-normal',kind:'gear',slot:'boots',value:'normal',name:'Bottes normales'});
    accessories.push(...SK.GEAR.filter(it=>['bottes','ressort'].includes(it.id)&&(save.gear||[]).includes(it.id)).map(it=>({...it,kind:'gear',toggle:true,slot:'boots',value:it.id})));
    return original.concat(owned.filter(it=>!original.some(o=>o.slot===it.slot&&o.value===it.value)),accessories);
  };
  W.open=function(opts){
    const save=opts.save,ch=SK.charById(save.advChar||save.char),list=W.items(save),grid=document.getElementById('wardrobe-items'),cv=document.getElementById('wardrobe-preview'),name=document.getElementById('wardrobe-name'),wear=document.getElementById('wardrobe-wear');let selected=list[0];
    document.getElementById('wardrobe-title').textContent='Garde-robe de '+ch.name;
    const preview=it=>{const c=cv.getContext('2d');c.clearRect(0,0,300,380);const look=SK.lookOf(ch,save);if(it){Object.assign(look,SK.wardrobePatch(it,look));if(it.slot==='boots'){look.springBoots=it.value==='ressort';look.gripBoots=it.value==='bottes';}}const r=SK.fakeRacer(ch.id,save.advBoard,'ride',look);SK.Render.drawWalker(c,r,150,350,115,0,'down',false);};
    function refresh(){const look=SK.lookOf(ch,save);grid.replaceChildren();for(const it of list){const b=document.createElement('button');b.className='closet-item';b.classList.toggle('selected',it.id===selected.id);b.setAttribute('aria-pressed',String(it.id===selected.id));const icon=document.createElement('canvas');icon.width=150;icon.height=170;SK.Shop.drawItem(icon.getContext('2d'),it,75,83,56,0);const label=document.createElement('span');label.textContent=it.name;const status=document.createElement('small');status.textContent=SK.wardrobeEquipped(look,it)?'Porté':'';b.append(icon,label,status);b.onclick=()=>{selected=it;refresh();};b.onpointerenter=b.onfocus=()=>preview(it);b.onpointerleave=b.onblur=()=>preview(null);grid.appendChild(b);}name.textContent=selected.name;const equipped=SK.wardrobeEquipped(look,selected);wear.textContent=selected.toggle?(equipped?'Enlever':'Mettre'):(equipped?'Porté':'Porter');wear.disabled=!selected.toggle&&equipped;preview(null);}
    wear.onclick=()=>{save.look=save.look||{};const look=save.look[ch.id]||(save.look[ch.id]={});const current=SK.lookOf(ch,save),equipped=SK.wardrobeEquipped(current,selected);look[selected.slot]=selected.toggle&&equipped?(selected.slot==='boots'?'normal':selected.slot==='goggles'?null:false):selected.value;if(!selected.toggle)Object.assign(look,SK.wardrobePatch(selected,current));opts.store();SK.Audio.sfx('box');refresh();preview(null);};document.getElementById('wardrobe-back').onclick=opts.onBack;refresh();
  };
})(window.SK);
