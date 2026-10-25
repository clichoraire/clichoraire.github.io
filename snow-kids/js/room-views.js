// Chaque intérieur conserve son rapport largeur/hauteur. Seule la fenêtre visible change.
(function(SK){
 'use strict';
 const rooms=new Map();
 const R=SK.RoomViews={host:name=>rooms.get(name)?.world,overflow:name=>{const r=rooms.get(name);return !!r&&r.viewport.scrollWidth>r.viewport.clientWidth+2;},show:name=>{const r=rooms.get(name);if(r){r.resize();r.viewport.scrollLeft=r.center?(r.viewport.scrollWidth-r.viewport.clientWidth)/2:0;}}};
 function mount(name,world,ratio,overlays,center=false){
  const screen=document.getElementById('screen-'+name),viewport=document.createElement('div');viewport.className='room-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','Explorer la pièce de gauche à droite');
  for(const selector of overlays)for(const element of screen.querySelectorAll(selector)){screen.append(element);element.classList.add('room-overlay');}
  world.classList.add('room-world');viewport.append(world);screen.prepend(viewport);screen.classList.add('pan-room');
  // Prolonger les matériaux des murs et du sol à la même échelle, sans dupliquer les habitants.
  const scene=world.querySelector('canvas');
  if(scene){
   const backdrop=document.createElement('canvas');backdrop.className='room-backdrop';backdrop.setAttribute('aria-hidden','true');screen.prepend(backdrop);
   let last=0;
   const paint=now=>{requestAnimationFrame(paint);if(now-last<180||!screen.clientHeight||!scene.width)return;last=now;
    const w=screen.clientWidth,h=screen.clientHeight,margin=(w-world.offsetWidth)/2;if(margin<=0){backdrop.hidden=true;return;}backdrop.hidden=false;
    const dpr=Math.min(devicePixelRatio||1,2);if(backdrop.width!==Math.round(w*dpr)||backdrop.height!==Math.round(h*dpr)){backdrop.width=Math.round(w*dpr);backdrop.height=Math.round(h*dpr);}
    const c=backdrop.getContext('2d'),scale=h/scene.height,extra=margin/scale,W=scene.width,H=scene.height;
    c.setTransform(dpr*scale,0,0,dpr*scale,margin*dpr,0);c.clearRect(-extra,0,W+extra*2,H);
    const palette=name==='school'?['#a16e44','#a67649','#805331','#b68550','#805532',650,45]:name==='gym'?['#af9370','#a68a68','#9b7853','#56646b','#76848a',480,46]:name==='throne'?['#12111e','#17121b','#292633','#17121b','#292633',480,65]:['#915c35','#895331','#714323','#a87743','#80552d',560,55];
    const [a,b,seam,floor,line,base,plank]=palette;
    c.fillStyle=seam;c.fillRect(-extra,0,W+extra*2,base);
    for(let y=0;y<base;y+=plank){c.fillStyle=y%(plank*2)?b:a;c.fillRect(-extra,y,W+extra*2,plank-3);}
    c.fillStyle=floor;c.fillRect(-extra,base,W+extra*2,H-base);c.strokeStyle=line;c.lineWidth=3;
    for(let x=-Math.max(1000,extra*3);x<W+Math.max(1000,extra*3);x+=160){c.beginPath();c.moveTo(W/2+(x-W/2)*.45,base);c.lineTo(x,H);c.stroke();}
    for(let y=base+40;y<H;y+=75){c.beginPath();c.moveTo(-extra,y);c.lineTo(W+extra,y);c.stroke();}
    c.fillStyle=seam;for(const x of [-100,W+80])c.fillRect(x,0,18,base);

   };requestAnimationFrame(paint);
  }
  const nav=document.createElement('nav');nav.className='room-pan';nav.setAttribute('aria-label','Déplacer la vue de la pièce');
  for(const [label,dir] of [['◀',-1],['▶',1]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',dir<0?'Voir à gauche':'Voir à droite');b.onclick=()=>viewport.scrollBy({left:dir*viewport.clientWidth*.65,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});nav.append(b);}
  screen.append(nav);
  const update=()=>{nav.hidden=viewport.scrollWidth<=viewport.clientWidth+2;nav.children[0].disabled=viewport.scrollLeft<=1;nav.children[1].disabled=viewport.scrollLeft+viewport.clientWidth>=viewport.scrollWidth-2;};
  const resize=()=>{if(!viewport.clientHeight)return;world.style.width=Math.round(Math.max(name==='wardrobe'?900:0,viewport.clientHeight*ratio))+'px';world.style.height=name==='wardrobe'?'auto':viewport.clientHeight+'px';update();};
  viewport.addEventListener('scroll',update,{passive:true});new ResizeObserver(resize).observe(viewport);
  rooms.set(name,{world,viewport,resize,center});
 }
 const shop=document.querySelector('#screen-shop .stage');mount('shop',shop,1280/720,['#shop-gold','#shop-me','#btn-shop-back','#shop-pan-left','#shop-pan-right','#shop-explore-hint'],true);
 document.querySelector('#screen-shop>.canvas-wrap')?.remove();
 const school=document.createElement('div');school.append(document.getElementById('school-scene'),document.getElementById('missions'));
 mount('school',school,1440/900,['.school-header','#school-gold','#school-more','#btn-school-back']);
 mount('gym',document.querySelector('.gym-room'),1280/720,['#gym-gold','#gym-back','#gym-talk','#gym-training'],true);
 const throne=document.createElement('div');throne.append(document.getElementById('throne-canvas'));mount('throne',throne,1280/720,['#throne-speech','.throne-actions','.throne-test'],true);
 mount('wardrobe',document.querySelector('.closet-panel'),1100/800,['#wardrobe-back','#wardrobe-title','.closet-sub']);
})(window.SK);
