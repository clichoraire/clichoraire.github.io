// Snow Kids — la boutique : intérieur de chalet dessiné au canevas (étagères garnies, vendeur, enseigne) et vitrine
// centrale qui montre tous les articles de l'onglet (le sélectionné en grand, les autres en vignettes, cadenas sur ceux
// qui sont verrouillés). Onglets : Planches, Équipement, Améliorations (de la planche équipée), Gadgets, Autres.
(function (SK) {
  'use strict';
  const S = SK.Shop = {}, TAU = Math.PI * 2;
  SK.fmtGold = (n,unit=true) => Math.round(n).toLocaleString('fr-CA').replace(/ | /g, ' ') + (unit?' G':'');
  SK.COIN_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#c98a12"/><circle cx="19" cy="19" r="15" fill="#ffd54a"/><circle cx="19" cy="19" r="11" fill="none" stroke="#e0a81c" stroke-width="2"/><text x="19" y="25" font-family="Arial Black,Arial" font-weight="900" font-size="17" text-anchor="middle" fill="#b8720c">G</text></svg>');
  SK.drawGoldCoin = function (ctx, x, y, r) {
    ctx.fillStyle = '#c98a12'; ctx.beginPath(); ctx.arc(x + r * 0.08, y + r * 0.08, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e0a81c'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#b8720c'; ctx.font = '900 ' + r * 1.1 + 'px "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('G', x, y + r * 0.05); ctx.textBaseline = 'alphabetic';
  };
  S.TABS = [
    { id: 'boards', name: 'Planches', color: '#f9b233', text: '#3e2723' },
    { id: 'equip', name: 'Équipement', color: '#d93b3b', text: '#fff' },

    { id: 'gadget', name: 'Gadgets', color: '#3b7dd8', text: '#fff' },
    { id: 'linge', name: 'Linge', color: '#ec407a', text: '#fff' },
    { id: 'other', name: 'Autres', color: '#7e57c2', text: '#fff' },
  ];
  const UP_DEFS = [['speed', 'Vitesse', 'Ta planche équipée gagne +1 en vitesse de pointe.'], ['corner', 'Virage', 'Ta planche équipée accroche mieux : +1 en virage.'], ['acceleration', 'Accélération', 'Ta planche reprend sa vitesse plus rapidement : +1 en accélération.'], ['jump', 'Saut', 'Ta planche équipée saute plus haut : +1 en saut.']];
  const STATS = [['speed', 'Vitesse'], ['corner', 'Virage'], ['acceleration', 'Accélération'], ['jump', 'Saut']];
  const STAT_ICONS={
    strength:'<path d="M5 15h4v-5h4V6h5v4h5v5h4v10l-6 5H10l-5-6z"/>',
    speed:'<path d="M19 3 7 18h8l-2 11 13-17h-9z"/>',
    corner:'<path d="m11 3-7 6 7 6v-4h7c8 0 8 9 0 9h-5v-4l-8 7 8 6v-4h6c13 0 13-19 0-19h-8z"/>',
    acceleration:'<path d="m5 7 10 10L5 27h7l10-10L12 7zM21 7h5v20h-5z"/>',
    jump:'<path d="m16 2-10 11h6v6h8v-6h6zM9 23h14M7 27h18M5 31h22"/>'
  };
  SK.STAT_ICONS=STAT_ICONS;
  function boardStats(it,save){
    if(it.secret&&it.lock)return '<span class="board-summary">🔒 Une planche mystérieuse…<br>À toi de découvrir son secret !</span>';
    const b=SK.effectiveBoard(it.id,save);
    return '<div class="board-bonuses">'+STATS.map(([key,label])=>{const value=b[key]||0;return `<div class="board-bonus ${value>0?'positive':value<0?'negative':'neutral'}" title="${label}" aria-label="${label} : ${value>0?'+':''}${value}"><span class="stat-icon stat-${key}" aria-hidden="true"><svg viewBox="0 0 32 34">${STAT_ICONS[key]}</svg></span><strong>${value>0?'+':''}${value}</strong></div>`;}).join('')+'</div><span class="board-summary">'+(it.lock?'🔒 '+it.lock:SK.boardById(it.id).desc)+'</span>';
  }


  let raf = 0, keyHandler = null, cleanup=null, ctx, canvas, state;
  function stop() { if(cleanup){cleanup();cleanup=null;} SK.Cheats?.reset(); cancelAnimationFrame(raf); raf = 0; if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; } }
  S.close = stop;
  S.trainingOffers=save=>items('up',save);
  const mod = v => (v > 0 ? '+' : '') + v;

  // Articles d'un onglet, avec leur état (possédé, équipé, verrouillé) pour cette sauvegarde
  function items(tab, save) {
    if (tab === 'boards') return SK.BOARDS.map(b => { const eff = SK.effectiveBoard(b.id, save), owned = save.boards.includes(b.id), reason = owned ? null : SK.lockReason(b.unlock, save), lock = b.secret && reason ? 'À toi de découvrir son secret !' : reason; return { id: b.id, kind: 'board', secret: !!b.secret, name: b.secret && lock ? '???' : 'Planche ' + b.name, price: b.price, color: eff.color, pattern: eff.pattern, desc: b.secret && lock ? 'Une planche mystérieuse…' : b.desc + ` Vitesse ${mod(eff.speed)} · Virage ${mod(eff.corner)} · Accélération ${mod(eff.acceleration)} · Saut ${mod(eff.jump)}.`, owned, lock, action: lock ? 'locked' : !owned ? 'buy' : save.advBoard === b.id ? 'equipped' : 'equip' }; });
    if (tab === 'linge') { const ch = SK.charById(save.advChar) || SK.CHARACTERS[0], look = SK.lookOf(ch, save); return SK.WARDROBE.filter(w => w.cat === tab).map(w => { const owned = w.price === 0 || (save.wardrobe || []).includes(w.id), eq = look[w.slot] === w.value; return { id: w.id, kind: 'wardrobe', slot: w.slot, value: w.value, name: w.name, price: w.price, desc: w.desc, owned, lock: null, action: eq ? 'equipped' : owned ? 'equip' : 'buy' }; }); }
    if (tab === 'up') { const b = SK.boardById(save.advBoard), u = (save.upgrades[b.id] = save.upgrades[b.id] || { speed: 0, corner: 0, acceleration: 0, jump: 0 }); return UP_DEFS.map(([k, lab, d]) => { const lvl = u[k] || 0, max = lvl >= SK.UPGRADE_MAX, lock = max ? null : SK.lockReason(lvl >= 1 ? { wins: 3 } : null, save); return { id: 'up-' + k, kind: 'up', stat: k, boardId: b.id, name: lab + ' +1 · ' + b.name, price: max ? 0 : SK.upgradeCost(lvl), color: b.color, desc: d + ` Niveau actuel : ${lvl} / ${SK.UPGRADE_MAX}.`, owned: max, lock, action: lock ? 'locked' : max ? 'max' : 'buy', level: lvl }; }); }
    return SK.GEAR.filter(g => g.cat === tab && g.id !== 'lunettes').map(g => { const owned = save.gear.includes(g.id) || (g.id === 'masque' && save.shinobin), lock = owned ? null : SK.lockReason(g.unlock, save); return { id: g.id, kind: 'gear', name: g.name, price: g.price, desc: g.desc, owned, lock, action: lock ? 'locked' : owned ? (SK.isGoggles(g.id)||SK.isHelmet(g.id))?(SK.lookOf(SK.charById(save.advChar)||SK.CHARACTERS[0],save)[SK.isHelmet(g.id)?'helmet':'goggles']===g.id?'equipped':'equip'):'owned' : 'buy' }; });
  }

  // Stats du Kid avec sa planche et son équipement ; previewIt = article sélectionné (acheté/équipé → aperçu).
  // Barre de 8 coches ; au-delà de 8, les coches repartent du début en rouge (comptées double).
  function statsFor(save, previewIt) {
    const ch = SK.charById(save.advChar) || SK.CHARACTERS[0];
    const calc = (boardId, gear, up) => { const b = SK.effectiveBoard(boardId, save); return { speed: ch.speed + b.speed + (up.speed || 0) + (gear.has('couronne') ? 1 : 0), corner: ch.corner + b.corner + (up.corner || 0) + (gear.has('bottes') ? 1 : 0) + (gear.has('couronne') ? 1 : 0), acceleration: ch.acceleration + b.acceleration + (up.acceleration || 0) + (gear.has('couronne') ? 1 : 0), strength:ch.strength+(save.strengthLevel||0), jump: (ch.jump || 3) + (b.jump || 0) + (up.jump || 0) + (gear.has('ressort') ? 1 : 0) + (gear.has('couronne') ? 1 : 0) }; };
    const gear = new Set(save.gear || []), cur = calc(save.advBoard, gear, {});
    let boardId = save.advBoard, up = {}, g2 = new Set(gear);
    if (previewIt && !(previewIt.secret&&previewIt.lock) && (previewIt.action === 'buy' || previewIt.action === 'equip' || previewIt.action === 'locked')) {
      if (previewIt.kind === 'board') boardId = previewIt.id; else if (previewIt.kind === 'up') up[previewIt.stat] = 1; else if (previewIt.kind === 'gear') g2.add(previewIt.id);
    }
    return { ch, cur, next: calc(boardId, g2, up) };
  }
  function previewLook(save, it) { const ch = SK.charById(save.advChar) || SK.CHARACTERS[0], look = SK.lookOf(ch, save); if (it && it.kind === 'wardrobe' && it.action !== 'equipped') look[it.slot] = it.value; if(it?.kind === 'gear' && SK.isHelmet(it.id)) look.helmet = it.id; if(it?.kind==='gear'&&it.id==='bottes')look.gripBoots=true; if(it?.kind==='gear'&&it.id==='fusee')look.rocketPack=true; if(it?.kind==='gear'&&SK.isGoggles(it.id))look.goggles=it.id; return look; }
  function renderMe(E, save, it, tab) {
    const { ch, cur, next } = statsFor(save, it), board = SK.effectiveBoard(save.advBoard,save), look = previewLook(save, it);
    const bar = (k, lab) => { let seg = ''; for (let i = 1; i <= 8; i++) { const c0 = cur[k] >= i + 8 ? 'x2' : cur[k] >= i ? 'on' : '', n0 = next[k] >= i + 8 ? 'x2' : next[k] >= i ? 'on' : ''; let cls = n0; if (n0 !== c0) cls += (next[k] > cur[k] ? ' gain' : ' loss'); seg += `<i class="${cls}"></i>`; } const d = next[k] - cur[k]; return `<div class="me-stat"><span class="me-stat-label"><i class="stat-icon stat-${k}" aria-hidden="true"><svg viewBox="0 0 32 34">${STAT_ICONS[k]}</svg></i>${lab}</span><div class="segs">${seg}</div><em class="${d > 0 ? 'gain' : d < 0 ? 'loss' : ''}">${cur[k]}${d ? ' → ' + next[k] : ''}</em></div>`; };
    const owned = (save.gear || []).map(id => SK.gearById(id)).filter(Boolean);
    E.me.innerHTML = `<h4>Mon équipement</h4><div class="me-top"><div class="me-info"><b>${ch.name}</b><span class="me-board"><i style="background:${board.color}"></i>${board.name}</span><small>${owned.length ? owned.length + ' article' + (owned.length > 1 ? 's' : '') : 'Aucun article'}</small></div></div>
      <div class="me-stats">${bar('speed', 'Vitesse')}${bar('corner', 'Virage')}${bar('acceleration', 'Accélération')}${bar('jump', 'Saut')}${bar('strength','Force')}</div>
      <div class="me-gear">${owned.map(g => `<canvas width="48" height="48" data-id="${g.id}" title="${g.name}"></canvas>`).join('')}${it && it.kind === 'gear' && !it.owned ? `<canvas width="48" height="48" data-id="${it.id}" class="preview" title="${it.name} (aperçu)"></canvas>` : ''}</div>
      <p class="me-hint">${it && (it.action === 'buy' || it.action === 'equip' || it.action === 'locked') ? 'En vert : ce que « ' + it.name + ' » te ferait gagner. Rouge plein = au-delà de 8, compté double.' : 'Choisis un article pour voir son effet sur tes barres. 8 coches max, puis les coches rouges comptent double.'}</p>`;
    E.me.querySelector('.me-stats').hidden=false;
    E.me.querySelector('.me-hint').textContent=it?.kind==='board'?'Aperçu des statistiques avec cette planche.':'Choisis une planche pour comparer ses statistiques, ou un accessoire pour l’essayer.';
    const cc = document.getElementById('shop-standing-kid');
    if(cc){const c=cc.getContext('2d');c.clearRect(0,0,300,360);const fr=SK.fakeRacer(ch.id,board.id);fr.look=look;
      SK.Render.drawWalker(c,fr,150,332,110,0,'down',false);}
    E.me.querySelectorAll('.me-gear canvas').forEach(cv => { S.drawItem(cv.getContext('2d'), { kind: 'gear', id: cv.dataset.id }, 24, 26, 14, 0); });
  }

  // opts : { canvas, els:{gold,tabs,title,icon,strip,name,price,desc,buy,prev,next,back,me}, save, store, toast, onBack }
  S.open = function (opts) {
    stop(); canvas = opts.canvas; ctx = canvas.getContext('2d');
    const save = opts.save, E = opts.els;
    const aisle=document.getElementById('shop-aisle'),world=document.getElementById('shop-world'),card=document.getElementById('shop-card');
    let wall=0,focusItem=null,turning=false;
    const kid=document.createElement('canvas');kid.id='shop-standing-kid';kid.width=300;kid.height=360;kid.setAttribute('aria-label','Ton personnage dans la boutique');aisle.parentElement.appendChild(kid);
    const cardHome=card.parentElement;document.body.appendChild(card);
    const selected=()=>focusItem?items(state.tab,save)[state.idx]:null;
    function positionCard(){if(!card.open||!focusItem)return;const r=focusItem.getBoundingClientRect(),w=card.offsetWidth,h=card.offsetHeight;
      const onRight=r.right+w+24<innerWidth;const x=Math.min(innerWidth-w-12,onRight?r.right+16:Math.max(12,r.left-w-16)),y=Math.max(12,Math.min(innerHeight-h-12,r.top+r.height/2-h/2));
      card.style.left=Math.max(8,x)+'px';card.style.top=(innerWidth<=700&&innerHeight>600?260:y)+'px';card.style.setProperty('--tail-top',Math.max(30,Math.min(h-30,r.top+r.height/2-y))+'px');card.classList.toggle('tail-right',!onRight);}
    const outside=e=>{if(e.target.closest('.board-skin-dialog'))return;if(card.open&&!card.contains(e.target)&&!e.target.closest('.shop-product'))card.close();};
    document.addEventListener('pointerdown',outside);window.addEventListener('resize',positionCard);
    const left=document.getElementById('shop-pan-left'),right=document.getElementById('shop-pan-right');
    function turn(d){
      if(turning||document.querySelector('dialog:modal'))return;
      if(card.open)card.close();focusItem=null;renderMe(E,save,null,'boards');
      turning=true;const old=world.children[wall];wall=(wall+d+4)%4;const next=world.children[wall];
      old.inert=true;next.hidden=false;next.inert=false;
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?0:550;
      old.animate([{transform:'perspective(1000px) rotateY(0)',opacity:1},{transform:'perspective(1000px) translateX('+(-d*75)+'%) rotateY('+d*45+'deg)',opacity:0}],{duration,easing:'cubic-bezier(.4,0,.2,1)'});
      const animation=next.animate([{transform:'perspective(1000px) translateX('+(d*75)+'%) rotateY('+(-d*45)+'deg)',opacity:0},{transform:'perspective(1000px) rotateY(0)',opacity:1}],{duration,easing:'cubic-bezier(.4,0,.2,1)'});
      document.getElementById('shop-explore-hint').textContent=(opts.tab==='linge'?['Le comptoir · pantalons et bonnets','Les accessoires','Les manteaux et cols roulés','La sortie']:['Le comptoir','L’atelier des planches','Les planches prestige','Les motifs de Jérémie'])[wall]+' · '+(wall+1)+' / 4 · ← → pour tourner';
      let finished=false;const complete=()=>{if(finished)return;finished=true;old.hidden=true;turning=false;};
      animation.finished.then(complete,complete);setTimeout(complete,duration+60);
      SK.Audio.sfx('click');
    }
    left.onclick=()=>turn(-1);right.onclick=()=>turn(1);
    document.getElementById('shop-card-close').onclick=()=>card.close();
    card.onclose=()=>{SK.Input.keys={};renderMe(E,save,selected(),state.tab);};
    card.onkeydown=e=>{if(e.code==='Escape')card.close();e.stopPropagation();};card.onkeyup=e=>e.stopPropagation();
    let pointer=null,dragged=false,lastWheel=0;
    const down=e=>{dragged=false;if(e.pointerType==='touch'&&!SK.RoomViews?.overflow('shop'))pointer=e.clientX;};
    const up=e=>{if(pointer!==null&&e.clientX!=null&&Math.abs(e.clientX-pointer)>45){dragged=true;turn(e.clientX<pointer?1:-1);}pointer=null;};
    const wheel=e=>{if(e.target.closest('.motif-workshop')||SK.RoomViews?.overflow('shop'))return;e.preventDefault();if(performance.now()-lastWheel>650){lastWheel=performance.now();turn((e.deltaX||e.deltaY)>0?1:-1);}};
    aisle.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);aisle.addEventListener('wheel',wheel,{passive:false});
    const emergency=document.querySelector('.emergency-plate'),home=emergency.parentElement;
    cleanup=()=>{document.querySelectorAll('.board-skin-dialog').forEach(d=>d.close());kid.remove();document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',positionCard);card.onclose=null;card.close();cardHome.appendChild(card);home.appendChild(emergency);window.removeEventListener('pointerup',up);aisle.removeEventListener('pointerdown',down);aisle.removeEventListener('wheel',wheel);};
    function populate(){
      const selectedId=focusItem?.dataset.item;home.appendChild(emergency);world.replaceChildren();
      const catalog=tab=>items(tab,save).map((it,i)=>({it,i,tab}));
      const boards=catalog('boards'),gear=catalog('equip'),clothes=catalog('linge');
      const clothingShop=opts.tab==='linge';
      const firstBoards=boards.slice(0,4),remainingBoards=boards.slice(4);
      const affordable=remainingBoards.filter(e=>!e.it.secret&&e.it.price<=850).sort((a,b)=>a.it.price-b.it.price);
      const intermediate=remainingBoards.filter(e=>e.it.price>850&&e.it.price<=2000).sort((a,b)=>a.it.price-b.it.price);
      const premium=[...remainingBoards.filter(e=>e.it.price>2000).sort((a,b)=>a.it.price-b.it.price),...remainingBoards.filter(e=>e.it.secret)];
      const ranked=[...gear.filter(e=>['lunettesNeige','lunettesForet'].includes(e.it.id)),...gear.filter(e=>SK.isHelmet(e.it.id)),...gear.filter(e=>!SK.isHelmet(e.it.id)&&!['lunettesNeige','lunettesForet'].includes(e.it.id)),...catalog('gadget'),...catalog('other')];
      const rankItems=rank=>ranked.filter(e=>SK.gearById(e.it.id).rank===rank);
      const walls=clothingShop
        ? [clothes.filter(e=>e.it.slot!=='jacket'),gear,clothes.filter(e=>e.it.slot==='jacket'),[]]
        : [[...firstBoards,...affordable,...rankItems(1)],
           [...intermediate,...rankItems(2)],[...premium,...rankItems(3),...rankItems(4)],[]];
      walls.forEach((list,n)=>{
        const section=document.createElement('section');section.className='shop-wall';section.dataset.wall=n;section.hidden=n!==wall;section.inert=n!==wall;
        const scene=document.createElement('canvas');scene.width=1280;scene.height=720;scene.className='wall-scene';section.appendChild(scene);paintWall(scene,n,clothingShop);addFamilyFrames(section,n,clothingShop,save,()=>{const amount=SK.PhotoGold.claim(save);if(!amount)return;opts.store();refresh();SK.Audio.sfx('buy');return amount;});
        let bi=0,oi=0;const boardCount=list.filter(x=>x.it.kind==='board').length,otherCount=list.length-boardCount;
        const stackSlots=new Map();
        if(clothingShop&&(n===0||n===2)){const families=new Map();for(const entry of list){const it=entry.it;
          const family=it.slot==='jacket'?(it.id.startsWith('turtleneck-')?'cols':/^jacket-\d+$/.test(it.id)?'classiques':'motifs'):it.slot==='pants'?(it.id.startsWith('jeans-')?'jeans':'neige'):it.slot==='hat'?(it.value.startsWith('beanie')?'tuques':'casquettes'):it.slot;
          if(!families.has(family))families.set(family,[]);families.get(family).push(entry);
        }
        let group=0;for(const [name,family] of families){const limit=name==='classiques'?10:name==='motifs'?6:name==='neige'?8:name==='hatColor'?7:5;for(let start=0;start<family.length;start+=limit){const batch=family.slice(start,start+limit);batch.forEach((e,index)=>stackSlots.set(e.it.id,{group,index,count:batch.length}));group++;}}}
        list.forEach(({it,i,tab})=>{
          const button=document.createElement('button');button.className='shop-product'+(it.kind==='board'?' is-board':'');button.dataset.item=it.id;button.dataset.department=tab;button.classList.toggle('is-locked',!!it.lock);button.classList.toggle('is-secret',!!it.secret&&!!it.lock);
          let x,y,width,height;
          if(it.kind==='board'){
            const first=bi<firstBoards.length;
            x=n===0?(first?28+bi*4.9:52+(bi-firstBoards.length)*4.9):29+bi*5.35;
            y=n===0?8:18;width=n===0?7:8;height=42;
            button.dataset.boardGroup=n===0?(first?'starter':'400-850'):n===1?'851-2000':'2000-plus';bi++;
          }else if(n===0&&!clothingShop){
            x=29+(oi%5)*11;y=65;width=10;height=25;oi++;
          }else if(clothingShop&&(n===0||n===2)){const st=stackSlots.get(it.id);x=28+(st.group%3)*(n===0?19:23)+st.index*Math.min(2.6,13/Math.max(1,st.count-1));y=18+Math.floor(st.group/3)*24;width=10;height=23;oi++;}
          else {x=28+(oi%6)*10;y=81;width=10;height=17;oi++;}
          const variation=[0,-3,2,-1,3,-2][i%6];if(it.kind!=='board'&&n!==2){y+=variation+(i%2?1:0);}
          if(n===0&&it.id==='sac'){x=93;y=66;width=7;height=21;}
          button.style.cssText=`left:${x}%;top:${y}%;width:${width}%;height:${height}%`;
          if(clothingShop&&(n===0||n===2)){const st=stackSlots.get(it.id);button.classList.add('stacked-clothing');button.classList.toggle('stack-front',st.index===st.count-1);button.dataset.stack=st.group;button.style.setProperty('--stack-order',st.index+1);}
          button.setAttribute('aria-label',it.name+' — '+SK.fmtGold(it.price)+(it.lock?' — verrouillé':''));
          const image=document.createElement('canvas');image.width=it.kind==='board'?110:180;image.height=260;S.drawItem(image.getContext('2d'),it,image.width/2,125,it.kind==='board'?94:it.id==='aimant'?44:65,0,it.kind==='board');
          image.style.transform=SK.isGoggles(it.id)?'none':'rotate('+([ -5,3,-2,6,0,-4 ][i%6])+'deg)';
          const support=image.getContext('2d');
          if(it.kind==='wardrobe'&&it.slot==='jacket'){support.fillStyle='#564436';support.fillRect(87,38,6,12);support.fillStyle='#b4a492';support.beginPath();support.arc(90,36,5,0,TAU);support.fill();support.fillStyle='#e1d4bd';support.beginPath();support.arc(88,34,2,0,TAU);support.fill();}
          if(it.id==='aimant'&&n!==0){support.fillStyle='#574538';support.fillRect(86,84,8,16);support.fillStyle='#d5c5aa';support.beginPath();support.arc(90,88,7,0,TAU);support.fill();support.fillStyle='#fff1d5';support.beginPath();support.arc(88,86,2,0,TAU);support.fill();}
          const boardPlacement=it.kind==='board'?[x*12.8+8,n===0?288:360,n===0?52:57]:null;
          const rankIndex=list.filter(e=>e.it.kind==='gear').findIndex(e=>e.it.id===it.id);
          const counterPlacement=boardPlacement||(clothingShop&&n===1?[410+(oi-1)%5*110,310+Math.floor((oi-1)/5)*130,70]:null)||(!clothingShop&&it.kind==='gear'?[410+(rankIndex%6)*94,rankIndex<6?490:rankIndex<12?590:675,['portemonnaie','portefeuilleOr','portefeuilleRoyal','boussole'].includes(it.id)?36:it.id==='bottes'?48:58]:null);
          if(counterPlacement||button.classList.contains('stacked-clothing')){
            // Recadrage alpha : le bas réel de l'objet repose sur le plateau propre à chaque objet.
            const pixels=support.getImageData(0,0,image.width,image.height).data;let l=image.width,t=image.height,r=0,b=0;
            for(let yy=0;yy<image.height;yy++)for(let xx=0;xx<image.width;xx++)if(pixels[(yy*image.width+xx)*4+3]>8){l=Math.min(l,xx);t=Math.min(t,yy);r=Math.max(r,xx);b=Math.max(b,yy);}
            const crop=document.createElement('canvas');crop.width=r-l+1;crop.height=b-t+1;crop.getContext('2d').drawImage(image,l,t,crop.width,crop.height,0,0,crop.width,crop.height);
            image.width=crop.width;image.height=crop.height;image.getContext('2d').drawImage(crop,0,0);image.style.transform='none';
            if(it.kind==='board')SK.animateBoardPreview(image,it,55,125,94,true,l,t);
            if(counterPlacement){
            const displayWidth=counterPlacement[2],displayHeight=displayWidth*crop.height/crop.width;
            button.classList.add('on-display-shelf');button.style.width=(displayWidth/1280*100)+'%';
            button.style.left=counterPlacement?(counterPlacement[0]/12.8)+'%':(31+list.filter(e=>e.it.kind==='gear').findIndex(e=>e.it.id===it.id)*8.3)+'%';
            button.style.top=(((counterPlacement?counterPlacement[1]:510)-displayHeight)/720*100)+'%';button.style.height=(displayHeight/720*100)+'%';
            }
          }
          const tag=document.createElement('span');tag.className='product-price';tag.innerHTML=it.secret?(it.lock?'🔒 '+it.name.replace('Planche ',''):it.owned?'✓ '+it.name.replace('Planche ',''):'🎁 '+it.name.replace('Planche ','')):(it.lock?'🔒 ':'<img src="'+SK.COIN_SVG+'" alt=""> ')+SK.fmtGold(it.price,!!it.lock);
          button.append(image,tag);
          if(it.owned){button.classList.add('product-owned');const badge=document.createElement('span');badge.className='owned-check';badge.textContent='✓';badge.setAttribute('aria-label','Déjà dans ton casier');button.append(badge);button.setAttribute('aria-label',button.getAttribute('aria-label')+' — déjà dans ton casier');}

          const stackPrice=()=>{const st=stackSlots.get(it.id);if(st){const label=section.querySelector('[data-stack-price="'+st.group+'"]');if(label)label.innerHTML=tag.innerHTML;}};
          button.onpointerenter=button.onfocus=()=>{renderMe(E,save,items(tab,save)[i],tab);stackPrice();};
          button.onpointerleave=button.onblur=()=>renderMe(E,save,selected(),state.tab);
          button.onclick=()=>{if(dragged){dragged=false;return;}if(turning)return;state.tab=tab;state.idx=i;focusItem=button;refresh();SK.Audio.sfx('click');if(!card.open)card.show();positionCard();};section.appendChild(button);
        });
        if(clothingShop&&(n===0||n===2)){
          const groups=new Map();for(const entry of list){const st=stackSlots.get(entry.it.id);groups.set(st.group,entry.it);}
          for(const [group,it] of groups){const label=document.createElement('span');label.className='product-price stack-price';label.dataset.stackPrice=group;
            label.innerHTML='<img src="'+SK.COIN_SVG+'" alt=""> '+SK.fmtGold(it.price,false);
            label.style.cssText=`left:${28+(group%3)*(n===0?19:23)+7}%;top:${18+Math.floor(group/3)*24+27}%;`;
            section.appendChild(label);}
        }
        if(n===(clothingShop?3:2)){section.appendChild(emergency);}
        if(n===3&&!clothingShop)S.mountMotifWall(section,save,()=>{opts.store();refresh();populate();});
        if(n===3){const door=document.createElement('button');door.className='shop-exit-door';door.textContent='Sortir';door.setAttribute('aria-label','Sortir de la boutique');door.onclick=opts.onBack;section.appendChild(door);}
        world.appendChild(section);
      });
      if(selectedId){focusItem=[...world.querySelectorAll('.shop-product')].find(b=>b.dataset.item===selectedId);positionCard();}
    }

    const requestedTab = opts.tab || S._tab || 'boards';
    state = { tab: S.TABS.some(t => t.id === requestedTab) ? requestedTab : 'linge', idx: 0 };
    const refresh = () => {
      const list = items(state.tab, save); if (state.idx >= list.length) state.idx = 0; const it = list[state.idx]; state.list = list;
      E.gold.innerHTML = `<img src="${SK.COIN_SVG}" alt=""><b>${SK.fmtGold(save.gold,false)}</b>`;
      E.title.textContent = it.name;
      E.name.textContent = it.action === 'locked' ? '🔒 Verrouillé' : it.action === 'buy' ? (it.price ? 'Prix' : 'Gratuit') : it.action === 'max' ? 'Niveau maximum' : it.action === 'equipped' ? 'Planche équipée' : it.action === 'equip' ? 'Dans ton casier' : 'Déjà acheté';
      E.price.innerHTML = it.secret ? (it.lock?'Récompense secrète':'Récompense de champion') : it.action === 'buy' || it.action === 'locked' ? `<img src="${SK.COIN_SVG}" alt=""> ${SK.fmtGold(it.price,false)}` : '';
      E.price.className = 'shop-price' + ((it.action === 'buy' && save.gold < it.price) || it.action === 'locked' ? ' poor' : '');
      E.desc.parentElement.classList.toggle('board-details',it.kind==='board');
      E.desc.innerHTML = it.kind==='board' ? boardStats(it,save) : it.lock ? `<b>Pour débloquer :</b> ${it.lock}.<br><span class="dim">${it.desc}</span>` : it.desc;
      if(['portemonnaie','portefeuilleOr','portefeuilleRoyal'].includes(it.id)){
        const gear=Object.fromEntries((save.gear||[]).map(id=>[id,true])),current=SK.coinCapacity(gear),next=SK.coinCapacity({...gear,[it.id]:true});
        E.desc.innerHTML='<div class="wallet-caption">Capacité de pièces par course</div><div class="wallet-capacity"><span>'+current+'</span><span class="capacity-arrow" aria-label="vers">→</span><span>'+next+'</span></div>'+(it.lock?'<span class="board-summary">🔒 '+it.lock+'</span>':'');
      }
      E.buy.textContent = it.action === 'buy' ? (it.price ? 'ACHETER' : 'PRENDRE') : it.action === 'equip' ? (it.kind === 'wardrobe' ? 'PORTER' : 'ÉQUIPER') : it.action === 'equipped' ? (it.kind === 'wardrobe' ? 'PORTÉ' : 'ÉQUIPÉE') : it.action === 'max' ? 'MAX' : it.action === 'locked' ? 'VERROUILLÉ' : 'POSSÉDÉ';
      E.buy.disabled = !(it.action === 'buy' || it.action === 'equip');
      E.buy.classList.toggle('not-enough-gold',it.action==='buy'&&save.gold<it.price);
      E.buy.onclick = () => act(it);
      card.querySelector('.board-skin-open')?.remove();


      renderMe(E, save, it, state.tab);
      card.querySelector('.card-stats')?.remove();
      const ic = E.icon.getContext('2d'); ic.clearRect(0, 0, E.icon.width, E.icon.height); S.drawItem(ic, it, E.icon.width / 2, E.icon.height / 2, E.icon.width * 0.36, performance.now() / 1000);
      SK.animateBoardPreview(E.icon,it,E.icon.width/2,E.icon.height/2,E.icon.width*.36,false);
      E.icon.style.filter=it.lock?'grayscale(1) brightness(.8)':'none';
      if (it.lock) { ic.fillStyle = 'rgba(20,24,42,0.55)'; ic.fillRect(0, 0, E.icon.width, E.icon.height); padlock(ic, E.icon.width / 2, E.icon.height / 2, E.icon.width * 0.2); }
    };
    const wear = it => { save.look = save.look || {}; const l = (save.look[save.advChar] = save.look[save.advChar] || {}); l[it.slot] = it.value; };
    const act = it => {
      if (it.action === 'buy') {
        if (save.gold < it.price) { SK.Audio.sfx('nope'); opts.toast('Pas assez d\'or : il te manque ' + SK.fmtGold(it.price - save.gold)); return; }
        save.gold -= it.price;
        if (it.kind === 'board') { save.boards.push(it.id); save.advBoard = it.id; save.board = it.id; opts.toast(it.name + (it.secret?' reçue et équipée !':' achetée et équipée !')); }
        else if (it.kind === 'up') { save.upgrades[it.boardId][it.stat] = it.level + 1; opts.toast(it.name + ' : fait !'); }
        else if (it.kind === 'wardrobe') { (save.wardrobe = save.wardrobe || []).push(it.id); wear(it); opts.toast(it.name + ' : acheté et porté !'); }
        else { save.gear.push(it.id);if(SK.isGoggles(it.id)||SK.isHelmet(it.id)){save.look=save.look||{};(save.look[save.advChar]=save.look[save.advChar]||{})[SK.isHelmet(it.id)?'helmet':'goggles']=it.id;} if (it.id === 'masque') save.shinobin = true; opts.toast(it.name + ' : acheté !'); }
        opts.store(); SK.Audio.sfx('buy'); refresh(); populate();
      } else if(it.action==='equip'&&it.kind==='gear'&&(SK.isGoggles(it.id)||SK.isHelmet(it.id))){save.look=save.look||{};(save.look[save.advChar]=save.look[save.advChar]||{})[SK.isHelmet(it.id)?'helmet':'goggles']=it.id;opts.store();SK.Audio.sfx('box');refresh();}
      else if (it.action === 'equip' && it.kind === 'wardrobe') { wear(it); opts.store(); SK.Audio.sfx('box'); opts.toast(it.name + ' : porté'); refresh(); }
      else if (it.action === 'equip') { save.advBoard = it.id; save.board = it.id; opts.store(); SK.Audio.sfx('box'); opts.toast(it.name + ' équipée'); refresh(); }
      else if (it.action === 'locked') { SK.Audio.sfx('nope'); opts.toast('Verrouillé : ' + it.lock); }
    };
    E.back.onclick=()=>{SK.Audio.sfx('click');opts.onBack();};
    keyHandler=e=>{
      if(e.target.closest?.('.motif-workshop'))return;
      if(document.querySelector('dialog:modal'))return;
      if(e.code==='Escape'&&card.open){card.close();return;}
      if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();if(!e.repeat)turn(e.code==='ArrowLeft'?-1:1);}
      else if(e.code==='Escape')opts.onBack();
    };
    window.addEventListener('keydown',keyHandler);
    refresh();populate();renderMe(E,save,null,'boards');
    window.FamilyHeads?.ready.then(()=>{if(canvas===opts.canvas&&kid.isConnected)world.querySelectorAll('.wall-scene').forEach((scene,i)=>paintWall(scene,i,opts.tab==='linge'));});
    wall=0;
    [...world.children].forEach((section,i)=>{section.hidden=i!==wall;section.inert=i!==wall;});
    document.getElementById('shop-explore-hint').textContent=(opts.tab==='linge'?['Le comptoir · pantalons et bonnets','Les accessoires','Les manteaux et cols roulés','La sortie']:['Le comptoir','L’atelier des planches','Les planches prestige','Les motifs de Jérémie'])[wall]+' · '+(wall+1)+' / 4 · ← → pour tourner';
  };
  function addFamilyFrames(section,n,clothes,save,reward){
    const jay='shop-photos/jay-cartoon.png',jo='shop-photos/jo-cartoon.png';
    const layouts=[
      [[jay,55,200,150,105,-4,'Famille de Jay'],['shop-photos/edison-cartoon.png',215,200,95,110,5,'Edison']],
      [[jo,405,35,185,92,2,'Souper chez Jo'],['shop-photos/couple-cartoon.png',800,38,80,92,-6,'Mickaël et Marie'],['shop-photos/grandsparents-cartoon.png',925,40,90,88,4,'Josée et Richard']],
      [[clothes?jo:jay,60,195,210,120,-3,clothes?'Souper chez Jo':'Famille de Jay']],
      [[jo,370,190,260,190,-3,'Souper chez Jo'],[jay,690,135,210,157,4,'Famille de Jay'],['shop-photos/couple-cartoon.png',760,340,115,156,-5,'Mickaël et Marie']]
    ];
    for(const [src,x,y,w,h,angle,label] of layouts[n]){
      const frame=document.createElement('button');frame.type='button';frame.className='shop-family-frame';frame.setAttribute('aria-label',label);
      frame.onclick=()=>{const amount=reward();if(amount)SK.PhotoGold.show(frame,amount);};
      frame.style.cssText=`left:${x/12.8}%;top:${y/7.2}%;width:${w/12.8}%;height:${h/7.2}%;transform:rotate(${angle}deg)`;
      const photo=document.createElement('img');photo.src='assets/'+src;photo.alt=label;photo.decoding='async';
      photo.onload=()=>{frame.style.width=(w/12.8)+'%';};
      frame.appendChild(photo);SK.PhotoPuzzles.decorate(frame,save,'assets/'+src);section.appendChild(frame);
    }
  }

  function paintWall(scene,n,clothingShop){
    const old=ctx;ctx=scene.getContext('2d');drawScene(0,{},clothingShop);
    // Poteaux d’angle, affiches alpines, étagères et patères : chaque vue est un mur entier.
    ctx.fillStyle='#4c2d1b';ctx.fillRect(0,0,26,600);ctx.fillRect(1254,0,26,600);
    if(n===0){
      if(!clothingShop){
        // Deux supports vissés, avec traverses et montants usés.
        for(const [x,w] of [[345,265],[650,330]]){
          ctx.fillStyle='#694222';for(const xx of [x+15,x+w-24]){ctx.fillRect(xx,100,14,238);ctx.fillStyle='#96663a';ctx.fillRect(xx+3,101,3,233);ctx.fillStyle='#694222';}
          for(const yy of [132,288]){shelf(x,yy,w);ctx.fillStyle='#b5a18a';for(const xx of [x+22,x+w-17]){ctx.beginPath();ctx.arc(xx,yy+6,3,0,TAU);ctx.fill();}}
        }


      }

      const workerId=clothingShop?'marie':'emily',worker=SK.fakeRacer(workerId,'freestyle','ride');worker.look=SK.lookOf(worker.def,{gear:[],look:{}});SK.Render.drawWalker(ctx,worker,1160,600,79,0,'down',false);ctx.fillStyle='#633c23';ctx.fillRect(1040,550,240,125);ctx.fillStyle='#a06a3b';ctx.fillRect(1025,540,255,18);for(let x=1055;x<1260;x+=65){ctx.strokeStyle='#392517';ctx.lineWidth=4;ctx.strokeRect(x,570,52,85);}
      ctx.fillStyle='#fff0c9';ctx.fillRect(1080,565,145,35);ctx.fillStyle='#513723';ctx.textAlign='center';ctx.font='bold 22px Trebuchet MS';ctx.fillText(clothingShop?'Marie':'Emily',1152,590);
    }else if(n===1){
      if(!clothingShop){
        // Iron rack: two rails, upright brackets, bolts and little board rests.
        const steel=ctx.createLinearGradient(0,200,0,370);steel.addColorStop(0,'#a7b6bc');steel.addColorStop(.45,'#52656e');steel.addColorStop(1,'#879ba4');
        ctx.fillStyle='#35434c';for(const x of [360,935])ctx.fillRect(x,195,14,193);
        ctx.fillStyle=steel;for(const y of [225,360]){ctx.fillRect(350,y,610,13);ctx.fillStyle='#dce6eb';ctx.fillRect(350,y,610,3);ctx.fillStyle=steel;}
        for(const x of [367,942])for(const y of [231,367]){ctx.fillStyle='#d9e1e4';ctx.beginPath();ctx.arc(x,y,4,0,TAU);ctx.fill();ctx.strokeStyle='#46565e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.stroke();}
      }

    }
    else if(n===2){ /* Les clous suivent chaque vêtement. */ }
    else{ /* Articles suspendus : pas de tablette sous les étiquettes. */ }
    if(!clothingShop&&n!==3){shelf(390,490,680);shelf(390,590,680);}
    else if(n===1){for(const y of [310,440])shelf(390,y,595);}
    if(n===3){ctx.fillStyle='#342116';ctx.fillRect(1090,225,150,350);ctx.fillStyle='#704624';ctx.fillRect(1100,235,130,330);ctx.fillStyle='#8bc7df';ctx.fillRect(1118,255,94,120);ctx.fillStyle='#effaff';ctx.beginPath();ctx.moveTo(1118,365);ctx.lineTo(1155,300);ctx.lineTo(1212,365);ctx.fill();ctx.fillStyle='#403021';ctx.fillRect(1160,255,7,120);ctx.fillRect(1118,310,94,7);ctx.fillStyle='#e8b750';ctx.beginPath();ctx.arc(1210,430,7,0,TAU);ctx.fill();ctx.fillStyle='#eee5ca';ctx.fillRect(1110,185,110,30);ctx.fillStyle='#354539';ctx.font='bold 23px Arial';ctx.textAlign='center';ctx.fillText('SORTIE',1165,209);ctx.fillStyle='#49382d';ctx.fillRect(1065,580,195,40);}
    if(n===3&&!clothingShop){const worker=SK.fakeRacer('jeremie','freestyle');worker.look=SK.lookOf(worker.def,{gear:[],look:{}});SK.Render.drawWalker(ctx,worker,1150,610,84,0,'down',false);ctx.fillStyle='#633c23';ctx.fillRect(1060,560,195,115);ctx.fillStyle='#b08251';ctx.fillRect(1045,548,215,18);ctx.fillStyle='#fff0c9';ctx.fillRect(1080,580,155,35);ctx.fillStyle='#513723';ctx.textAlign='center';ctx.font='bold 22px Trebuchet MS';ctx.fillText('Jérémie',1158,605);}
    if(n===0||n===3&&!clothingShop)drawRegister(ctx,n===0?1080:1095,n===0?540:548);
    ctx=old;
  }

  function drawRegister(c,x,y){
    c.save();c.translate(x,y);c.lineJoin='round';
    const box=(x,y,w,h,r,col)=>{c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
    box(-47,-22,94,22,4,'#243d47');box(-43,-20,86,15,3,'#789399');box(-33,-15,66,3,1,'#263c44');
    c.fillStyle='#c9d8d6';c.beginPath();c.moveTo(-42,-22);c.lineTo(-30,-60);c.lineTo(28,-60);c.lineTo(43,-22);c.closePath();c.fill();c.strokeStyle='#45616a';c.lineWidth=2;c.stroke();
    box(-26,-63,52,22,4,'#25414b');box(-22,-59,44,13,2,'#a7e8bb');c.font='bold 10px monospace';c.textAlign='right';c.fillStyle='#244f3e';c.fillText('0.00',18,-49);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)box(-22+col*11,-38+row*5,8,3,1,col===3?'#edbd51':'#4c6570');
    box(33,-60,16,32,2,'#f5f1df');c.strokeStyle='#9baba9';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.moveTo(36,-55+i*5);c.lineTo(46,-55+i*5);c.stroke();}c.restore();
  }

  // Même dessin vectoriel dans le rayon et sur la fiche de l'accessoire.
  function drawRankGear(c,id,s){
    c.save();c.scale(s,s);c.lineWidth=.07;c.lineJoin='round';c.lineCap='round';
    const path=(points,fill,stroke='#263746')=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.stroke();};
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    const disk=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();};
    if(id==='boussole'){
      c.strokeStyle='#c99b31';c.lineWidth=.10;c.beginPath();c.arc(0,-1.02,.16,0,TAU);c.stroke();
      rect(-.08,-.95,.16,.18,'#e7bb51');
      disk(.04,.05,.87,'#8a6a2c');disk(0,0,.85,'#e7bd50');disk(0,0,.76,'#ffe69a');disk(0,0,.69,'#fff4cc');
      c.strokeStyle='#8c713f';for(let i=0;i<48;i++){const a=i*TAU/48;c.lineWidth=i%4===0?.025:.012;c.beginPath();c.moveTo(Math.sin(a)*.63,-Math.cos(a)*.63);c.lineTo(Math.sin(a)*(i%4===0?.54:.58),-Math.cos(a)*(i%4===0?.54:.58));c.stroke();}
      c.fillStyle='#5b482b';c.font='bold .17px Georgia';c.textAlign='center';c.textBaseline='middle';for(const [letter,x,y]of [['N',0,-.49],['S',0,.49],['E',.49,0],['W',-.49,0]])c.fillText(letter,x,y);
      for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);path([[0,-.40],[.065,0],[0,.08],[-.065,0]],i%2?'#c0a46a':'#806739','#b89b61');c.restore();}
      c.save();c.rotate(.65);path([[0,-.58],[.105,0],[0,.10]],'#c43d32','#8b372b');path([[0,.58],[-.105,0],[0,-.1]],'#277381','#225464');c.restore();disk(0,0,.075,'#fff0bb');disk(0,0,.035,'#947a3b');
    }else if(id==='ressort'){
      SK.drawSpringBoot(c,-.95,-.85,.87,1.65,-1);SK.drawSpringBoot(c,.08,-.85,.87,1.65,1);
    }else if(id==='sifflet'){
      c.strokeStyle='#7ab5ce';c.beginPath();c.arc(-.55,-.25,.35,0,TAU);c.stroke();
      path([[-.6,-.05],[.75,-.05],[.75,.2],[.15,.2],[.15,.55],[-.6,.55]],'#efbd3e');rect(.32,-.06,.23,.15,'#4c3825');disk(-.3,.24,.17,'#ffe994');
    }else if(id==='casqueAero'){
      c.fillStyle='#2ca8be';c.beginPath();c.ellipse(0,0,.78,.65,0,Math.PI,0);c.lineTo(.72,.28);c.lineTo(-.72,.28);c.closePath();c.fill();c.strokeStyle='#243744';c.stroke();
      path([[-.75,.06],[.72,.06],[.55,.37],[-.6,.37]],'#284356');for(let k=-1;k<=1;k++)rect(k*.3-.04,-.4,.08,.3,'#153d51');
    }else if(id==='thermos'){
      path([[-.42,-.65],[.42,-.65],[.42,.7],[-.42,.7]],'#ba4651');rect(-.48,-.8,.96,.22,'#dae6eb');rect(-.42,.35,.84,.22,'#edd9b3');disk(0,-.05,.22,'#f6d596');
      c.strokeStyle='#e8bb8a';c.beginPath();c.moveTo(.47,-.4);c.quadraticCurveTo(.95,-.3,.47,.2);c.stroke();
    }else if(id==='chrono'||id==='montreEtoiles'){
      disk(0,0,.72,id==='chrono'?'#80d0db':'#ffd15b');disk(0,0,.56,'#fcf5dc');c.strokeStyle='#304455';c.lineWidth=.08;c.beginPath();c.moveTo(0,-.38);c.lineTo(0,0);c.lineTo(.3,.16);c.stroke();rect(-.18,-.88,.36,.15,'#5d7a88');
    }else if(id==='sablier'){
      path([[-.48,-.65],[.48,-.65],[.13,0],[.48,.65],[-.48,.65],[-.13,0]],'#b4d9df');
      path([[-.3,-.45],[.3,-.45],[0,-.05]],'#ffdc69');path([[0,.17],[.35,.6],[-.35,.6]],'#ffdc69');
      for(const y of [-.8,.66])rect(-.65,y,1.3,.17,'#d9a532');for(const x of [-.6,.52])rect(x,-.65,.08,1.3,'#b47d25');
    }else if(id==='meteore'){
      path([[-.6,.45],[.15,-.8],[.3,-.35],[.85,-.55],[.5,.45]],'#ff9847');disk(-.1,.25,.55,'#efbf39');star(c,-.1,.25,.38);disk(-.23,.09,.1,'#fff6be');
    }else if(id==='couronne'){
      path([[-.8,-.55],[-.4,-.15],[0,-.8],[.4,-.15],[.8,-.55],[.65,.65],[-.65,.65]],'#f3c743');rect(-.65,.38,1.3,.18,'#d98c25');
      for(const x of [-.45,0,.45])disk(x,.12,x===0?.14:.09,x===0?'#da455b':'#49adcb');
    }
    c.restore();
  }

  function padlock(c, x, y, s) { c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(x - s * 0.7, y); c.lineTo(x + s * 0.7, y); c.lineTo(x + s * 0.7, y + s); c.lineTo(x - s * 0.7, y + s); c.closePath(); c.fill(); c.strokeStyle = '#ffd54a'; c.lineWidth = s * 0.25; c.beginPath(); c.arc(x, y - s * 0.1, s * 0.45, Math.PI, 0); c.stroke(); c.fillStyle = '#3e2723'; c.beginPath(); c.arc(x, y + s * 0.45, s * 0.16, 0, TAU); c.fill(); }

  // ------------------------------------------------------------------ décor : le chalet
  function drawScene(t, save, clothingShop=false) {
    const W = canvas.width, H = canvas.height, floorY = H * 0.8;
    for (let y = 0; y < floorY; y += 44) { ctx.fillStyle = clothingShop?((y/44)%2?'#9b7c86':'#a88991'):((y / 44) % 2 ? '#8a5533' : '#935c38'); ctx.fillRect(0, y, W, 44); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y + 41, W, 3); ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = (y * 7) % 300; x < W; x += 300) ctx.fillRect(x, y + 10, 90, 2); }
    const g = ctx.createLinearGradient(0, floorY, 0, H); g.addColorStop(0, '#b07a4a'); g.addColorStop(1, '#8a5a33'); ctx.fillStyle = g; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; for (let x = -200; x < W + 200; x += 70) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 90, floorY); ctx.stroke(); }
    ctx.fillStyle = '#5d3a1f'; ctx.fillRect(0, floorY - 8, W, 10);
    ctx.fillStyle = '#5d3a1f'; ctx.fillRect(0, 0, W, 26); for (let x = 60; x < W; x += 260) ctx.fillRect(x, 0, 26, 70);
    // enseigne en haut à droite, fenêtre dessous
    ctx.save(); ctx.translate(W - 150, 78); ctx.rotate(-0.05); ctx.fillStyle = '#c98a4a'; roundRect(-105, -30, 210, 60, 10); ctx.fill(); ctx.strokeStyle = '#5d3a1f'; ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = '#d84315'; ctx.font = '900 32px "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(clothingShop?'L’ATELIER':'BOUTIQUE', 0, 12); ctx.restore();
    ctx.fillStyle = '#4e2f18'; ctx.fillRect(W - 130, 150, 120, 110); const sg = ctx.createLinearGradient(0, 156, 0, 254); sg.addColorStop(0, '#5fb0ff'); sg.addColorStop(1, '#dff3ff'); ctx.fillStyle = sg; ctx.fillRect(W - 124, 156, 108, 98);
    ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.moveTo(W - 124, 254); ctx.lineTo(W - 124, 226); ctx.lineTo(W - 84, 192); ctx.lineTo(W - 48, 222); ctx.lineTo(W - 16, 208); ctx.lineTo(W - 16, 254); ctx.fill(); ctx.fillStyle = '#4e2f18'; ctx.fillRect(W - 73, 156, 6, 98); ctx.fillRect(W - 124, 202, 108, 6);
    // Les seuls articles visibles sont les vrais objets cliquables, chacun avec son prix.
  }

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function shelf(x, y, w) { ctx.fillStyle = '#5d3a1f'; ctx.fillRect(x, y, w, 14); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 14, w, 8); ctx.fillStyle = '#5d3a1f'; ctx.fillRect(x + 10, y + 14, 10, 18); ctx.fillRect(x + w - 20, y + 14, 10, 18); }
  function helmet(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.lineTo(x + r, y + r * 0.3); ctx.lineTo(x - r, y + r * 0.3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#263238'; ctx.fillRect(x - r, y + r * 0.1, 2 * r, r * 0.25); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - r * 0.1, y - r, r * 0.2, r); }
  // Commerçant de l’atelier : béret, chemise crème et tablier de couturier.
  function clothier(x,y){
    ctx.save();ctx.translate(x,y);ctx.scale(.75,.75);
    ctx.fillStyle='#f2e4cf';roundRect(-65,-150,130,160,26);ctx.fill();
    ctx.strokeStyle='#f2e4cf';ctx.lineWidth=26;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-54,-126);ctx.quadraticCurveTo(-76,-65,-108,-88);ctx.stroke();
    ctx.beginPath();ctx.moveTo(54,-126);ctx.lineTo(78,-44);ctx.stroke();
    ctx.fillStyle='#e7b18c';for(const [hx,hy] of [[-112,-88],[79,-40]]){ctx.beginPath();ctx.ellipse(hx,hy,14,11,0,0,TAU);ctx.fill();}
    ctx.fillStyle='#375f60';roundRect(-44,-122,88,132,12);ctx.fill();
    ctx.strokeStyle='#375f60';ctx.lineWidth=10;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*29,-148);ctx.lineTo(side*31,-110);ctx.stroke();}
    ctx.strokeStyle='#b9d2c5';ctx.lineWidth=2;roundRect(-28,-53,56,34,5);ctx.stroke();
    ctx.strokeStyle='#e8bd58';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-36,-143);ctx.lineTo(-40,-69);ctx.stroke();
    ctx.strokeStyle='#775d32';ctx.lineWidth=1;for(let yy=-134;yy<-70;yy+=8){ctx.beginPath();ctx.moveTo(-44,yy);ctx.lineTo(-38,yy);ctx.stroke();}
    ctx.fillStyle='#f2c7a4';ctx.beginPath();ctx.ellipse(0,-192,48,53,0,0,TAU);ctx.fill();
    ctx.fillStyle='#604134';ctx.beginPath();ctx.ellipse(0,-231,49,20,-.1,0,TAU);ctx.fill();
    ctx.fillStyle='#334149';for(const xx of [-17,17]){ctx.beginPath();ctx.ellipse(xx,-194,4,6,0,0,TAU);ctx.fill();}
    ctx.strokeStyle='#604134';ctx.lineWidth=3;for(const xx of [-17,17]){ctx.beginPath();ctx.moveTo(xx-7,-206);ctx.quadraticCurveTo(xx,-210,xx+7,-206);ctx.stroke();}
    ctx.fillStyle='#d69d7f';ctx.beginPath();ctx.ellipse(0,-182,6,8,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#904e40';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-14,-170);ctx.quadraticCurveTo(0,-157,16,-171);ctx.stroke();
    ctx.fillStyle='#713f59';ctx.beginPath();ctx.ellipse(-5,-241,58,25,-.15,0,TAU);ctx.fill();ctx.fillStyle='#4d2f43';roundRect(-44,-236,88,12,5);ctx.fill();
    ctx.fillStyle='#f3d18b';roundRect(6,-108,29,17,3);ctx.fill();ctx.fillStyle='#375f60';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText('STYLE',20,-96);
    ctx.restore();
  }
  // le vendeur : chapeau mou violet, lunettes de ski sur le chapeau, lunettes de soleil, grand sourire, veste turquoise, main ouverte vers la vitrine
  function vendor(x, y, t, k) {
    const bob = Math.sin(t * 2) * 3, wave = Math.sin(t * 3) * 0.12;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(k || 1, k || 1);
    // corps
    ctx.fillStyle = '#00897b'; roundRect(-80, -190, 160, 230, 36); ctx.fill();
    ctx.fillStyle = '#00695c'; ctx.fillRect(-6, -170, 12, 200);
    ctx.fillStyle = '#e0f2f1'; ctx.beginPath(); ctx.moveTo(-40, -190); ctx.lineTo(0, -150); ctx.lineTo(40, -190); ctx.closePath(); ctx.fill();
    // Bras détendu, coude fléchi et paume ouverte vers les articles.
    ctx.strokeStyle='#007b70';ctx.lineWidth=32;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(-63,-157);ctx.quadraticCurveTo(-86,-118,-110,-105);ctx.lineTo(-153,-122);ctx.stroke();
    ctx.strokeStyle='#b2dfd8';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(-150,-134);ctx.lineTo(-157,-112);ctx.stroke();
    ctx.fillStyle='#f3c9a3';ctx.beginPath();ctx.moveTo(-157,-130);ctx.quadraticCurveTo(-177,-139,-188,-143);ctx.quadraticCurveTo(-196,-144,-193,-137);ctx.lineTo(-179,-129);ctx.lineTo(-201,-133);ctx.quadraticCurveTo(-208,-131,-202,-126);ctx.lineTo(-179,-117);ctx.quadraticCurveTo(-167,-111,-157,-117);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#d39f7d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-191,-128);ctx.lineTo(-178,-123);ctx.stroke();
    ctx.strokeStyle='#00897b';ctx.lineWidth=32;ctx.beginPath();ctx.moveTo(65,-155);ctx.quadraticCurveTo(88,-105,96,-55);ctx.stroke();
    ctx.fillStyle='#b2dfd8';roundRect(79,-64,34,12,4);ctx.fill();ctx.fillStyle='#f3c9a3';roundRect(79,-54,39,24,10);ctx.fill();
    ctx.strokeStyle='#d39f7d';ctx.lineWidth=2;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(90+j*8,-48);ctx.lineTo(90+j*8,-34);ctx.stroke();}
    ctx.strokeStyle='#40a99a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-56,-83);ctx.lineTo(-25,-83);ctx.lineTo(-25,-48);ctx.quadraticCurveTo(-40,-39,-56,-48);ctx.closePath();ctx.stroke();
    ctx.fillStyle='#f6d16b';roundRect(21,-149,38,17,4);ctx.fill();ctx.fillStyle='#395c55';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('SNOW',40,-137);
    // Visage aux joues arrondies, oreilles et sourire plus naturel.
    ctx.fillStyle='#e4b18c';roundRect(-15,-215,30,27,9);ctx.fill();
    ctx.fillStyle='#edbd98';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*56,-254,10,15,0,0,TAU);ctx.fill();}
    const skin=ctx.createLinearGradient(-50,-300,50,-210);skin.addColorStop(0,'#ffe0b8');skin.addColorStop(1,'#edb48e');ctx.fillStyle=skin;
    ctx.beginPath();ctx.moveTo(-54,-280);ctx.bezierCurveTo(-65,-241,-43,-204,0,-201);ctx.bezierCurveTo(43,-204,65,-241,54,-280);ctx.quadraticCurveTo(0,-324,-54,-280);ctx.fill();
    ctx.fillStyle='#dc967c55';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*34,-239,13,7,0,0,TAU);ctx.fill();}
    ctx.fillStyle='#e5aa83';ctx.beginPath();ctx.ellipse(2,-248,7,9,.15,0,TAU);ctx.fill();
    ctx.fillStyle='#65312c';ctx.beginPath();ctx.moveTo(-25,-231);ctx.quadraticCurveTo(0,-222,27,-232);ctx.quadraticCurveTo(7,-207,-10,-216);ctx.quadraticCurveTo(-20,-220,-25,-231);ctx.fill();
    ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.moveTo(-22,-230);ctx.quadraticCurveTo(0,-223,24,-231);ctx.lineTo(19,-225);ctx.quadraticCurveTo(0,-219,-18,-225);ctx.closePath();ctx.fill();
    // Deux verres distincts, reliés par un petit pont.
    ctx.strokeStyle='#233b40';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-57,-274);ctx.lineTo(57,-274);ctx.stroke();
    for(const side of [-1,1]){const x=side<0?-51:5;ctx.fillStyle='#263c43';roundRect(x,-285,46,31,10);ctx.fill();const glass=ctx.createLinearGradient(x,-281,x+40,-258);glass.addColorStop(0,side<0?'#aa76d9':'#5cc9c8');glass.addColorStop(1,'#659fcd');ctx.fillStyle=glass;roundRect(x+4,-281,38,23,7);ctx.fill();ctx.fillStyle='#ffffff66';roundRect(x+8,-278,19,4,2);ctx.fill();}
    // chapeau mou violet, bande rose, lunettes de ski posées dessus
    ctx.fillStyle = '#7b1fa2'; ctx.beginPath(); ctx.ellipse(6, -300, 108, 24, 0.05, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8e24aa'; ctx.beginPath(); ctx.moveTo(-62, -302); ctx.quadraticCurveTo(-70, -380, -20, -392); ctx.quadraticCurveTo(40, -400, 70, -370); ctx.quadraticCurveTo(100, -340, 72, -300); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ec407a'; ctx.beginPath(); ctx.moveTo(-64, -312); ctx.quadraticCurveTo(6, -332, 74, -312); ctx.lineTo(74, -300); ctx.quadraticCurveTo(6, -318, -64, -300); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8f00'; roundRect(-44, -346, 92, 26, 10); ctx.fill(); ctx.fillStyle = '#40c4ff'; roundRect(-39, -342, 38, 18, 7); ctx.fill(); roundRect(5, -342, 38, 18, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-34, -339, 14, 4); ctx.fillRect(10, -339, 14, 4);
    ctx.restore();
  }

  // ------------------------------------------------------------------ icônes des articles (vitrine, vignettes, étagères)
  S.openBoardSkins=function(save,boardId,onChange){
    const board=SK.boardById(boardId),current=SK.boardSkin(boardId,save).id;
    const dialog=document.createElement('dialog');dialog.className='board-skin-dialog';dialog.setAttribute('aria-labelledby','skin-title');
    dialog.innerHTML='<h2 id="skin-title">Le visuel de ta planche '+board.name+'</h2><p>Jérémie applique un de tes motifs. Tes caractéristiques restent les mêmes.</p><div class="board-skin-grid"></div><p class="skin-confirm" aria-live="polite"></p><div class="skin-actions"><button class="skin-cancel">Annuler</button><button class="skin-apply" disabled>Choisir un motif</button></div>';
    const targetLabel=document.createElement('label');targetLabel.className='skin-target';targetLabel.textContent='Planche à personnaliser : ';const targetSelect=document.createElement('select');targetSelect.setAttribute('aria-label','Planche à personnaliser');
    for(const b of SK.BOARDS.filter(b=>save.boards.includes(b.id))){const option=document.createElement('option');option.value=b.id;option.textContent=b.name;targetSelect.append(option);}targetSelect.value=boardId;targetLabel.append(targetSelect);dialog.querySelector('.board-skin-grid').before(targetLabel);
    targetSelect.onchange=()=>{const id=targetSelect.value;dialog.close();dialog.remove();S.openBoardSkins(save,id,onChange);};
    let selected=current;const apply=dialog.querySelector('.skin-apply'),message=dialog.querySelector('.skin-confirm');
    function refresh(){const same=selected===current,poor=save.gold<SK.BOARD_SKIN_PRICE;dialog.querySelectorAll('[data-skin]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skin===selected)));apply.disabled=same||poor;apply.textContent='Confirmer · '+SK.BOARD_SKIN_PRICE+' pièces';message.textContent=same?'Ce visuel est déjà sur cette planche.':poor?'Il te manque '+(SK.BOARD_SKIN_PRICE-save.gold)+' pièces.':'Mettre le motif '+SK.skinById(selected).name+' sur ta planche '+board.name+' pour '+SK.BOARD_SKIN_PRICE+' pièces ?';}
    for(const skin of SK.availableBoardSkins(save)){const button=document.createElement('button');button.dataset.skin=skin.id;const cv=document.createElement('canvas');cv.width=150;cv.height=310;S.drawItem(cv.getContext('2d'),{...skin,kind:'board'},75,155,125,0,true);SK.animateBoardPreview(cv,{...skin,kind:'board'},75,155,125);button.append(cv);const label=document.createElement('span');label.textContent=skin.name+(skin.id===current?' · actuel':'');button.append(label);button.onclick=()=>{selected=skin.id;refresh();};dialog.querySelector('.board-skin-grid').append(button);}
    apply.onclick=()=>{const result=SK.changeBoardSkin(save,boardId,selected);if(result==='changed'){onChange();SK.Audio.sfx('buy');dialog.close();dialog.remove();}else refresh();};
    dialog.querySelector('.skin-cancel').onclick=()=>{dialog.close();dialog.remove();};dialog.onclose=()=>dialog.remove();dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());document.body.append(dialog);refresh();dialog.showModal();dialog.querySelector('[aria-pressed="true"]')?.focus();
  };

  // One reusable texture per design; animated frames replace it instead of accumulating.
  const boardArt=new Map(),animatedPreviews=new Map();let previewFrame=0;
  const animatedPattern=pattern=>pattern==='animated-flames'||pattern==='animated-ink'||pattern==='custom-electric'||pattern==='custom-synthwave'||pattern==='custom-cosmic'||SK.BOARD_MOTIFS.some(m=>m.pattern===pattern&&m.animated);
  const patternFrame=(pattern,t)=>Math.floor(t*24)%(pattern==='animated-ink'||pattern.startsWith('custom-')?192:96);
  SK.animateBoardPreview=function(canvas,board,x,y,size,standing=true,offsetX=0,offsetY=0){
    if(!animatedPattern(board.pattern)){animatedPreviews.delete(canvas);return;}
    animatedPreviews.set(canvas,{board,x,y,size,standing,offsetX,offsetY,frame:-1});
    if(!previewFrame)previewFrame=requestAnimationFrame(animatePreviews);
  };
  function animatePreviews(ms){
    previewFrame=0;const t=ms/1000;
    for(const [canvas,p] of animatedPreviews){
      const frame=patternFrame(p.board.pattern,t);
      if(!canvas.isConnected){animatedPreviews.delete(canvas);continue;}
      if(p.frame===frame||!canvas.getClientRects().length)continue;
      p.frame=frame;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.save();c.translate(-p.offsetX,-p.offsetY);S.drawItem(c,p.board,p.x,p.y,p.size,frame/24,p.standing);c.restore();
      if(p.board.lock&&!p.standing){c.fillStyle='rgba(20,24,42,0.55)';c.fillRect(0,0,canvas.width,canvas.height);padlock(c,canvas.width/2,canvas.height/2,canvas.width*.2);}
    }
    if(animatedPreviews.size)previewFrame=requestAnimationFrame(animatePreviews);
  }
  SK.drawBoard=function(c,board,x,y,w,h,angle=0,steer=0){
    const b=board||SK.BOARDS[0],key=b.color+':'+b.pattern,frame=animatedPattern(b.pattern)?patternFrame(b.pattern,performance.now()/1000):0;
    let entry=boardArt.get(key);if(!entry){const art=document.createElement('canvas');art.width=240;art.height=720;entry={art,frame:-1};boardArt.set(key,entry);}
    const gaze=b.pattern==='custom-snow-shark'?Math.round(Math.max(-1,Math.min(1,steer))*10)/10:0;
    if(entry.frame!==frame||entry.gaze!==gaze){const ac=entry.art.getContext('2d');ac.clearRect(0,0,240,720);S.drawItem(ac,{...b,kind:'board',skinSteer:gaze},120,355,300,frame/24,true);entry.frame=frame;entry.gaze=gaze;}
    c.save();c.translate(x,y);c.rotate(angle);c.drawImage(entry.art,-w/2,-h/2,w,h);c.restore();
  };
  S.drawItem = function (c, it, x, y, s, t, standing) {
    c.save(); c.translate(x, y);
    const id = it.kind === 'up' ? 'up-' + it.stat : it.kind === 'board' ? 'board' : it.kind === 'wardrobe' ? it.slot : it.id;
    const tint = it.tint || '#1e88e5';
    const rr2 = (xx, yy, w, h, r) => { c.beginPath(); c.moveTo(xx + r, yy); c.arcTo(xx + w, yy, xx + w, yy + h, r); c.arcTo(xx + w, yy + h, xx, yy + h, r); c.arcTo(xx, yy + h, xx, yy, r); c.arcTo(xx, yy, xx + w, yy, r); c.closePath(); };
    switch (id) {
      case 'board': {
        c.rotate(standing ? 0 : -0.6); const col = it.color || '#4caf50', bid = it.pattern || (SK.boardById(it.id) || {}).pattern || 'stripes';
        const outline=()=>{c.beginPath();c.moveTo(-s*.34,-s*.82);c.bezierCurveTo(-s*.34,-s*1.27,s*.34,-s*1.27,s*.34,-s*.82);c.bezierCurveTo(s*.25,-s*.3,s*.25,s*.3,s*.34,s*.82);c.bezierCurveTo(s*.34,s*1.27,-s*.34,s*1.27,-s*.34,s*.82);c.bezierCurveTo(-s*.25,s*.3,-s*.25,-s*.3,-s*.34,-s*.82);c.closePath();};
        if(it.secret&&it.lock){c.fillStyle='#10151e';outline();c.fill();break;}
        c.save();c.translate(s*.025,s*.035);c.fillStyle='#23303d';outline();c.fill();c.restore();c.fillStyle=col;outline();c.fill();
        c.save();outline();c.clip();
        if(bid.startsWith('custom-')){SK.drawMotif(c,bid,s,t||0,it.skinSteer||0);}
        else if(bid==='animated-ink'){
          const phase=(t||0)*TAU/8;c.fillStyle='#101014';
          // Mirrored organic contours expand, meet and separate in a seamless cycle.
          for(let k=0;k<7;k++){
            const cy=-1.01+k*.33+Math.sin(phase+k*1.3)*.045;
            const cx=.085+Math.sin(phase+k*1.7)*.065;
            const rx=.105+Math.sin(phase+k*.9)*.035,ry=.13+Math.cos(phase+k*1.1)*.035;
            const points=[];for(let j=0;j<24;j++){const a=j*TAU/24,r=1+.24*Math.sin(a*3+phase+k)+.16*Math.cos(a*5-phase*2+k*.7);points.push([cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r]);}
            for(const side of [-1,1]){c.beginPath();const last=points[23],first=points[0];c.moveTo(side*(last[0]+first[0])*s/2,(last[1]+first[1])*s/2);for(let j=0;j<24;j++){const a=points[j],b=points[(j+1)%24];c.quadraticCurveTo(side*a[0]*s,a[1]*s,side*(a[0]+b[0])*s/2,(a[1]+b[1])*s/2);}c.closePath();c.fill();}
          }
        }
        else if(bid==='skulls'){
          for(const yy of [-.83,0,.83]){c.save();c.translate(0,yy*s);c.fillStyle='#fff8e6';c.beginPath();c.ellipse(0,-s*.025,s*.22,s*.19,0,0,TAU);c.fill();rr2(-s*.135,s*.05,s*.27,s*.15,s*.035);c.fill();c.fillStyle='#22283d';for(const xx of [-.09,.09]){c.beginPath();c.ellipse(xx*s,-s*.02,s*.061,s*.073,0,0,TAU);c.fill();}c.beginPath();c.moveTo(0,s*.045);c.lineTo(-s*.035,s*.10);c.lineTo(s*.035,s*.10);c.fill();c.strokeStyle='#22283d';c.lineWidth=s*.012;for(const xx of [-.06,0,.06]){c.beginPath();c.moveTo(xx*s,s*.13);c.lineTo(xx*s,s*.20);c.stroke();}c.restore();}
        }
        else if(bid==='emojis'){
          c.textAlign='center';c.textBaseline='middle';c.font=(s*.39)+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
          for(const [i,face] of ['😂','😍','😎','🤣','😜','😁','🥳'].entries()){c.save();c.translate((i%2?-.07:.06)*s,(-.94+i*.31)*s);c.rotate((i%2?-.12:.12));c.fillText(face,0,0);c.restore();}
        }
        else if(bid==='animated-flames'){
          const phase=(t||0)*TAU/4;
          for(const [color,width,height,shift] of [['#f04416',.75,1.9,0],['#ff970f',.62,1.65,1],['#ffe56b',.44,1.25,2]]){
            c.fillStyle=color;for(let k=0;k<3;k++){const base=(-.25+k*.25)*s,tip=base+Math.sin(phase+k*1.8+shift)*s*.12,top=(1.12-height+Math.sin(phase+k+shift)*.13)*s;c.beginPath();c.moveTo(base-width*s*.27,s*1.22);c.bezierCurveTo(base-s*.22,s*.5,tip-s*.14,top+s*.35,tip,top);c.bezierCurveTo(tip+s*.03,top+s*.4,base+s*.23,s*.6,base+width*s*.27,s*1.22);c.closePath();c.fill();}
          }
        }
        else if(bid==='pikachu'||bid==='canadiens'){
          c.fillStyle=bid==='pikachu'?'#ffdf32':'#15366b';c.fillRect(-s*.4,s*.55,s*.8,s*.22);c.fillRect(-s*.4,-s*.63,s*.8,s*.12);
          if(bid==='canadiens'){c.fillStyle='#fff';c.fillRect(-s*.4,s*.55,s*.8,s*.035);c.fillRect(-s*.4,s*.735,s*.8,s*.035);}
          for(const yy of [-.82,0,.87])SK.drawCoatMotif(c,bid,0,yy*s,s*(bid==='pikachu'?.23:.24));
        }
        else if(bid==='horses'){
          c.fillStyle='#f3deae';c.fillRect(-s*.4,-s*.05,s*.8,s*.1);
          for(const yy of [-.78,.03,.84]){c.save();c.translate(0,yy*s);c.scale(s*.29,s*.29);c.fillStyle='#75432d';c.beginPath();c.ellipse(-.12,.05,.58,.29,-.1,0,TAU);c.fill();c.beginPath();c.moveTo(.15,.1);c.lineTo(.29,-.55);c.lineTo(.49,-.70);c.lineTo(.55,-1);c.lineTo(.70,-.72);c.lineTo(.95,-.48);c.lineTo(.88,-.25);c.lineTo(.52,-.32);c.lineTo(.48,.18);c.fill();c.strokeStyle='#75432d';c.lineWidth=.13;c.lineCap='round';for(const [x,dx] of [[-.45,-.3],[-.25,.1],[.12,.38],[.3,.18]]){c.beginPath();c.moveTo(x,.2);c.lineTo(x+dx,.49);c.lineTo(x+dx+.1,.72);c.stroke();}c.strokeStyle='#35261f';c.lineWidth=.13;c.beginPath();c.moveTo(.46,-.66);c.quadraticCurveTo(.1,-.55,.24,-.03);c.moveTo(-.62,-.02);c.quadraticCurveTo(-1,-.35,-.83,.4);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(.65,-.52,.055,0,TAU);c.fill();c.restore();}
        }
        else if(bid==='medal'||bid==='diamond'){
          const metal=c.createLinearGradient(-s*.34,0,s*.34,0);metal.addColorStop(0,'#ffffff18');metal.addColorStop(.35,'#ffffffcc');metal.addColorStop(.5,'#ffffff22');metal.addColorStop(1,'#00000055');c.fillStyle=metal;c.fillRect(-s*.4,-s*1.3,s*.8,s*2.6);
          c.strokeStyle='#ffffffbb';c.lineWidth=s*.025;for(const side of [-1,1]){c.beginPath();c.moveTo(side*s*.23,-s*.85);c.lineTo(side*s*.18,s*.85);c.stroke();}
          if(bid==='diamond'){for(const yy of [-.77,0,.77]){c.fillStyle='#efffff';c.beginPath();c.moveTo(0,(yy-.19)*s);c.lineTo(s*.20,yy*s);c.lineTo(0,(yy+.24)*s);c.lineTo(-s*.20,yy*s);c.closePath();c.fill();c.fillStyle='#5baacb';c.beginPath();c.moveTo(0,(yy-.19)*s);c.lineTo(s*.20,yy*s);c.lineTo(0,(yy+.24)*s);c.closePath();c.fill();}}
          else{c.fillStyle='#fff4ca';star(c,0,0,s*.22);for(const yy of [-.83,.83]){c.strokeStyle='#fff4ca';c.lineWidth=s*.04;c.beginPath();c.arc(0,yy*s,s*.14,0,TAU);c.stroke();}}
        }
        else if (bid === 'flames') { c.fillStyle = '#ffab00'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-s * 0.3 + k * s * 0.25, s * 1.1); c.quadraticCurveTo(-s * 0.1 + k * s * 0.25, s * 0.2 - k * s * 0.3, -s * 0.2 + k * s * 0.25, -s * 0.5 - k * s * 0.25); c.quadraticCurveTo(-s * 0.05 + k * s * 0.25, s * 0.3, s * 0.1 + k * s * 0.25, s * 1.1); c.fill(); } c.fillStyle = '#fff176'; c.beginPath(); c.moveTo(-s * 0.1, s * 1.1); c.quadraticCurveTo(0, 0.2 * s, -s * 0.05, -s * 0.2); c.quadraticCurveTo(0.05 * s, 0.4 * s, s * 0.12, s * 1.1); c.fill(); }
        else if (bid === 'zigzag') { c.strokeStyle = '#fff'; c.lineWidth = s * 0.14; c.beginPath(); for (let k = -4; k <= 4; k++) c.lineTo((k % 2 ? -1 : 1) * s * 0.22, k * s * 0.26); c.stroke(); }
        else if (bid === 'stars') { c.fillStyle = '#fff'; for (let k = -2; k <= 2; k++) star(c, (k % 2 ? -1 : 1) * s * 0.12, k * s * 0.42, s * 0.14); }
        else if (bid === 'twotone') { c.fillStyle = '#b0bec5'; c.beginPath(); c.moveTo(-s * 0.4, -s * 1.2); c.lineTo(s * 0.4, -s * 0.4); c.lineTo(s * 0.4, s * 0.2); c.lineTo(-s * 0.4, -s * 0.6); c.fill(); c.fillStyle = '#263238'; c.fillRect(-s * 0.4, s * 0.5, s * 0.8, s * 0.1); }
        else if (bid === 'diagonal') { c.fillStyle = '#ff4081'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-s * 0.4, k * s * 0.4); c.lineTo(s * 0.4, k * s * 0.4 - s * 0.5); c.lineTo(s * 0.4, k * s * 0.4 - s * 0.3); c.lineTo(-s * 0.4, k * s * 0.4 + s * 0.2); c.fill(); } }
        else if (bid === 'gold') { c.fillStyle = '#fff8e1'; for (let k = -2; k <= 2; k++) star(c, (k % 2 ? 0.15 : -0.12) * s, k * s * 0.4, s * 0.1); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(-s * 0.3, -s * 1.2, s * 0.1, s * 2.4); }
        else if (bid === 'dots') { c.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = -3; k <= 3; k++) { c.beginPath(); c.arc((k % 2 ? 0.15 : -0.15) * s, k * s * 0.33, s * 0.1, 0, TAU); c.fill(); } }
        else if (bid === 'ice') { c.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(0, k * s * 0.45 - s * 0.18); c.lineTo(s * 0.16, k * s * 0.45); c.lineTo(0, k * s * 0.45 + s * 0.18); c.lineTo(-s * 0.16, k * s * 0.45); c.fill(); } }
        else if (bid === 'galaxy') { c.fillStyle = '#fff'; for (let k = 0; k < 14; k++) { c.beginPath(); c.arc(((k * 37) % 60 - 30) / 100 * s, ((k * 53) % 200 - 100) / 100 * s, s * (0.03 + (k % 3) * 0.02), 0, TAU); c.fill(); } c.fillStyle = 'rgba(255,64,129,0.5)'; c.beginPath(); c.ellipse(0, -s * 0.3, s * 0.3, s * 0.12, 0.6, 0, TAU); c.fill(); }
        else if (bid === 'waves') { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = s * 0.08; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-s * 0.35, k * s * 0.42); c.quadraticCurveTo(-s * 0.15, k * s * 0.42 - s * 0.2, 0, k * s * 0.42); c.quadraticCurveTo(s * 0.15, k * s * 0.42 + s * 0.2, s * 0.35, k * s * 0.42); c.stroke(); } }
        else if (bid === 'lightning') { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(s * 0.1, -s * 1.0); c.lineTo(-s * 0.2, -s * 0.1); c.lineTo(s * 0.02, -s * 0.1); c.lineTo(-s * 0.12, s * 0.9); c.lineTo(s * 0.22, -s * 0.2); c.lineTo(0, -s * 0.2); c.closePath(); c.fill(); }
        else if (bid === 'spikes') { c.fillStyle = '#2e7d32'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-s * 0.36, k * s * 0.42); c.lineTo(-s * 0.1, k * s * 0.42 - s * 0.12); c.lineTo(-s * 0.1, k * s * 0.42 + s * 0.12); c.fill(); c.beginPath(); c.moveTo(s * 0.36, k * s * 0.42 + s * 0.2); c.lineTo(s * 0.1, k * s * 0.42 + s * 0.08); c.lineTo(s * 0.1, k * s * 0.42 + s * 0.32); c.fill(); } }
        else if (bid === 'panda') {
          c.fillStyle='#18252d';for(const dx of [-.16,.16]){c.beginPath();c.arc(dx*s,-.86*s,.12*s,0,TAU);c.fill();}
          c.fillStyle='#fff';c.beginPath();c.ellipse(0,-.72*s,.25*s,.24*s,0,0,TAU);c.fill();
          for(const dx of [-.10,.10]){c.fillStyle='#18252d';c.beginPath();c.ellipse(dx*s,-.73*s,.065*s,.09*s,dx*3,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(dx*s,-.75*s,.018*s,0,TAU);c.fill();}
          c.fillStyle='#18252d';c.beginPath();c.ellipse(0,-.61*s,.045*s,.03*s,0,0,TAU);c.fill();
          c.strokeStyle='#70a449';c.lineWidth=.055*s;for(const dx of [-.20,.20]){c.beginPath();c.moveTo(dx*s,.23*s);c.lineTo(dx*s,.95*s);c.stroke();for(let j=0;j<3;j++){c.fillStyle='#86bb62';c.beginPath();c.ellipse((dx+.05)*s,(.3+j*.22)*s,.10*s,.035*s,-.6,0,TAU);c.fill();}}
        }
        else if (bid === 'lava') { c.fillStyle = '#ffab00'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-s * 0.36, k * s * 0.42); c.quadraticCurveTo(0, k * s * 0.42 - s * 0.25, s * 0.36, k * s * 0.42 + s * 0.05); c.lineTo(s * 0.36, k * s * 0.42 + s * 0.18); c.quadraticCurveTo(0, k * s * 0.42 + s * 0.05, -s * 0.36, k * s * 0.42 + s * 0.2); c.fill(); } }
        else if (bid === 'shuriken') { c.fillStyle = '#e53935'; for (let k = -1; k <= 1; k++) star(c, 0, k * s * 0.6, s * 0.2); }
        else if (bid === 'rainbow') { ['#e53935', '#ff8f00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'].forEach((cc, k) => { c.fillStyle = cc; c.fillRect(-s * 0.36, (k - 3) * s * 0.3 - s * 0.05, s * 0.72, s * 0.3); }); }
        else if (bid === 'teeth') { c.fillStyle = '#fff'; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(-s * 0.36, k * s * 0.3); c.lineTo(-s * 0.12, k * s * 0.3 + s * 0.15); c.lineTo(-s * 0.36, k * s * 0.3 + s * 0.3); c.fill(); c.beginPath(); c.moveTo(s * 0.36, k * s * 0.3); c.lineTo(s * 0.12, k * s * 0.3 + s * 0.15); c.lineTo(s * 0.36, k * s * 0.3 + s * 0.3); c.fill(); } }
        else if (bid === 'feathers') { c.fillStyle = '#ffd54a'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.ellipse((k % 2 ? 0.12 : -0.12) * s, k * s * 0.42, s * 0.1, s * 0.26, (k % 2 ? 0.5 : -0.5), 0, TAU); c.fill(); } }
        else if (bid === 'crystal') { c.fillStyle = 'rgba(255,255,255,0.75)'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(0, k * s * 0.45 - s * 0.22); c.lineTo(s * 0.2, k * s * 0.45 + s * 0.05); c.lineTo(0, k * s * 0.45 + s * 0.22); c.lineTo(-s * 0.2, k * s * 0.45 + s * 0.05); c.fill(); } }
        else if (bid === 'scales') { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = s * 0.05; for (let k = -4; k <= 4; k++) for (let m = -1; m <= 1; m++) { c.beginPath(); c.arc((m * 0.22 + (k % 2 ? 0.11 : 0)) * s, k * s * 0.25, s * 0.12, 0, Math.PI); c.stroke(); } }
        else { c.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = -2; k <= 2; k++) c.fillRect(-s * 0.4, k * s * 0.42 - s * 0.05, s * 0.8, s * 0.1); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(-s * 0.08, -s * 1.2, s * 0.16, s * 2.4); }
        c.restore();
        c.strokeStyle='#b9c7cd';c.lineWidth=Math.max(.7,s*.025);outline();c.stroke();
        for(const yy of [-.38,.38]){c.save();c.translate(0,yy*s);c.rotate(yy<0?-.20:.18);c.fillStyle='#182c39';rr2(-s*.19,-s*.14,s*.38,s*.28,s*.05);c.fill();c.strokeStyle='#91a9b4';c.lineWidth=s*.02;c.stroke();for(const strap of [-.07,.06]){c.fillStyle='#526d7a';rr2(-s*.21,strap*s,s*.42,s*.055,s*.02);c.fill();c.fillStyle='#d4e1e6';c.fillRect(s*.13,strap*s,s*.06,s*.055);}c.restore();}
        c.fillStyle='#ffffff35';c.beginPath();c.ellipse(-s*.23,-s*.80,s*.025,s*.14,.2,0,TAU);c.fill(); break; }
      case 'chrono': case 'montreEtoiles': case 'boussole': case 'ressort': case 'sifflet': case 'casqueAero': case 'thermos': case 'sablier': case 'meteore': case 'couronne': {
        drawRankGear(c,it.id,s);break;
      }
      case 'casque': case 'casqueForet': case 'casqueCorail': case 'casqueNoir': { SK.drawSnowHelmet(c,it.id,0,-s*.8,s*1.9,s*1.12,'side');break; }
      case 'gants': { c.fillStyle = tint; rr2(-s * 0.9, -s * 0.5, s * 0.8, s * 1.3, s * 0.3); c.fill(); rr2(s * 0.1, -s * 0.5, s * 0.8, s * 1.3, s * 0.3); c.fill(); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-s * 0.9, s * 0.5, s * 0.8, s * 0.3); c.fillRect(s * 0.1, s * 0.5, s * 0.8, s * 0.3); c.fillStyle = tint; rr2(-s * 1.1, -s * 0.3, s * 0.35, s * 0.6, s * 0.15); c.fill(); rr2(s * 0.75, -s * 0.3, s * 0.35, s * 0.6, s * 0.15); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = s * 0.06; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-s * 0.75 + k * s * 0.25, -s * 0.5); c.lineTo(-s * 0.75 + k * s * 0.25, s * 0.1); c.moveTo(s * 0.25 + k * s * 0.25, -s * 0.5); c.lineTo(s * 0.25 + k * s * 0.25, s * 0.1); c.stroke(); } break; }
      case 'bottes': { SK.drawGripBoot(c,-s*.95,-s*.85,s*.87,s*1.65,-1);SK.drawGripBoot(c,s*.08,-s*.85,s*.87,s*1.65,1);break; }
      case 'lunettesForet': case 'lunettesTricolores': case 'lunettesNeige': case 'lunettesMiroir': case 'lunettes': SK.drawGoggles(c,it.id,0,0,s);break;

      case 'veste': { c.fillStyle = '#e53935'; rr2(-s * 0.8, -s * 0.9, s * 1.6, s * 1.8, s * 0.3); c.fill(); c.fillStyle = '#b71c1c'; c.fillRect(-s * 0.08, -s * 0.9, s * 0.16, s * 1.8); c.fillStyle = '#e53935'; rr2(-s * 1.2, -s * 0.8, s * 0.4, s * 1.1, s * 0.15); c.fill(); rr2(s * 0.8, -s * 0.8, s * 0.4, s * 1.1, s * 0.15); c.fill(); c.fillStyle = '#fff'; for (let k = 0; k < 3; k++) c.fillRect(-s * 0.7, -s * 0.5 + k * s * 0.5, s * 1.4, s * 0.08); break; }
      case 'portefeuilleOr': case 'portefeuilleRoyal': case 'portemonnaie': {
        c.scale(1,.72); for(let k=0;k<2;k++){c.save();c.rotate(-.12+k*.08);c.fillStyle=k?'#7fa34c':'#3f793f';c.fillRect(-s*.57,-s*(1.14-k*.13),s*1.12,s*.48);c.strokeStyle='#b7cc72';c.lineWidth=s*.035;c.strokeRect(-s*.49,-s*(1.07-k*.13),s*.96,s*.30);c.restore();} const leather=it.id==='portefeuilleOr'?'#b98b23':it.id==='portefeuilleRoyal'?'#59386b':'#815032';
        c.fillStyle='#4f2e21';rr2(-s*.77,-s*.94,s*1.45,s*1.5,s*.12);c.fill();
        c.fillStyle='#ba8557';rr2(-s*.75,-s*.92,s*1.40,s*.13,s*.05);c.fill();
        const g=c.createLinearGradient(-s,-s,s,s);g.addColorStop(0,leather);g.addColorStop(1,it.id==='portemonnaie'?'#663921':leather);c.fillStyle=g;rr2(-s*.80,-s*.72,s*1.65,s*1.46,s*.13);c.fill();
        c.strokeStyle='#bd8857';c.lineWidth=s*.022;c.setLineDash([s*.035,s*.035]);rr2(-s*.70,-s*.62,s*1.45,s*1.25,s*.08);c.stroke();c.setLineDash([]);
        c.fillStyle='#5c351f';rr2(s*.45,-s*.15,s*.57,s*.35,s*.09);c.fill();c.fillStyle='#c99a61';c.beginPath();c.arc(s*.65,s*.02,s*.065,0,TAU);c.fill();break;
      }
      case 'aimant': {c.save();c.rotate(.65);c.strokeStyle='#762630';c.lineWidth=s*.52;c.beginPath();c.arc(0,-s*.1,s*.62,0,Math.PI);c.stroke();for(const side of [-1,1]){c.fillStyle='#e84955';c.fillRect(side*s*.62-s*.22,-s*.72,s*.44,s*.70);c.fillStyle='#dfeaf1';c.fillRect(side*s*.62-s*.22,-s*.90,s*.44,s*.25);}c.strokeStyle='#f54f5d';c.lineWidth=s*.37;c.beginPath();c.arc(0,-s*.1,s*.62,0,Math.PI);c.stroke();c.strokeStyle='#ff9d9f';c.lineWidth=s*.065;c.beginPath();c.arc(0,-s*.1,s*.68,.25,2.7);c.stroke();c.restore();break;}
      case 'fusee': {c.save();c.scale(s,s);c.strokeStyle='#364856';c.lineWidth=.045;for(const sign of [-1,1]){c.fillStyle='#e84651';c.beginPath();c.moveTo(sign*.30,.20);c.quadraticCurveTo(sign*.65,.38,sign*.62,.83);c.lineTo(sign*.24,.58);c.closePath();c.fill();c.stroke();}c.fillStyle='#dcebf1';c.beginPath();c.moveTo(0,-1.1);c.bezierCurveTo(-.64,-.65,-.43,.45,-.25,.68);c.lineTo(.25,.68);c.bezierCurveTo(.43,.45,.64,-.65,0,-1.1);c.fill();c.stroke();c.fillStyle='#e94351';c.beginPath();c.moveTo(0,-1.1);c.quadraticCurveTo(-.22,-.91,-.30,-.65);c.quadraticCurveTo(0,-.51,.30,-.65);c.closePath();c.fill();c.stroke();c.fillStyle='#4d8eb8';c.beginPath();c.arc(0,-.23,.17,0,TAU);c.fill();c.stroke();c.fillStyle='#b6edff';c.beginPath();c.arc(-.04,-.27,.065,0,TAU);c.fill();c.fillStyle='#e94351';c.beginPath();c.moveTo(0,.23);c.quadraticCurveTo(-.12,.7,0,.95);c.quadraticCurveTo(.12,.7,0,.23);c.fill();c.stroke();c.restore();break;}
      case 'sac': {
        const g=c.createLinearGradient(-s,0,s,0);g.addColorStop(0,'#f62a35');g.addColorStop(.75,'#d91829');g.addColorStop(1,'#ae1420');c.fillStyle=g;c.fillRect(-s*.74,-s*.42,s*1.48,s*1.20);
        c.fillStyle='#ffdb53';c.fillRect(-s*.13,-s*.46,s*.26,s*1.24);
        c.fillStyle='#f0343b';rr2(-s*.84,-s*.60,s*1.68,s*.23,s*.035);c.fill();
        for(const sign of [-1,1]){c.save();c.scale(sign,1);const ribbon=c.createLinearGradient(0,-s*1.2,0,-s*.3);ribbon.addColorStop(0,'#ffec87');ribbon.addColorStop(1,'#efb72e');c.fillStyle=ribbon;
          c.beginPath();c.moveTo(0,-s*.58);c.bezierCurveTo(-s*.35,-s*1.3,-s*.57,-s*1.32,-s*.67,-s*.86);c.quadraticCurveTo(-s*.62,-s*.57,0,-s*.58);c.fill();
          c.beginPath();c.moveTo(-s*.08,-s*.62);c.quadraticCurveTo(-s*.48,-s*.5,-s*.60,-s*.10);c.lineTo(-s*.36,-s*.22);c.lineTo(-s*.20,-s*.03);c.quadraticCurveTo(-s*.21,-s*.39,s*.04,-s*.57);c.fill();c.restore();}
        c.fillStyle='#ffe882';rr2(-s*.13,-s*.69,s*.26,s*.23,s*.07);c.fill();break;
      }

      case 'vip': { c.rotate(-0.15); c.fillStyle = '#ffd54a'; rr2(-s * 1.2, -s * 0.75, s * 2.4, s * 1.5, s * 0.2); c.fill(); c.fillStyle = '#263238'; c.fillRect(-s * 1.2, -s * 0.45, s * 2.4, s * 0.3); c.fillStyle = '#b8720c'; c.font = '900 ' + s * 0.7 + 'px sans-serif'; c.textAlign = 'center'; c.fillText('VIP', 0, s * 0.5); break; }
      case 'masque': { c.fillStyle = '#212121'; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); c.fillStyle = '#f3c9a3'; rr2(-s * 0.75, -s * 0.3, s * 1.5, s * 0.45, s * 0.2); c.fill(); c.fillStyle = '#263238'; c.beginPath(); c.arc(-s * 0.3, -s * 0.08, s * 0.1, 0, TAU); c.arc(s * 0.3, -s * 0.08, s * 0.1, 0, TAU); c.fill(); c.fillStyle = '#d32f2f'; c.fillRect(-s, -s * 0.38, s * 2, s * 0.12); c.beginPath(); c.moveTo(s * 0.9, -s * 0.3); c.lineTo(s * 1.6, -s * 0.1); c.lineTo(s * 1.0, -s * 0.15); c.fill(); break; }
      case 'jacket': SK.drawJacket(c,it.value,0,0,s);break;
      case 'pants': SK.drawPants(c,it.value,0,0,s);break;
      case 'hat': SK.drawHeadwear(c,it.value,it.tint||'#1565c0',0,-s*.6,s*1.6,s*1.5);break;
      case 'hatColor': { c.fillStyle = it.value; c.beginPath(); c.arc(0, 0, s * 0.9, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(s * 0.5, s * 0.05, s * 0.8, s * 0.22, 0, 0, Math.PI); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = s * 0.06; c.stroke(); break; }
      case 'hair': case 'hairColor': case 'skin': { const L = { hair: it.slot === 'hair' ? it.value : 'short', hairColor: it.slot === 'hairColor' ? it.value : '#5d3a1a', skin: it.slot === 'skin' ? it.value : '#f3c9a3', hat: 'none', hatColor: '#000' }; const fr = { def: SK.CHARACTERS[0], look: L, fx: {}, state: 'ride', h: 0, input: {}, pose: 'side' }; c.save(); c.beginPath(); c.arc(0, 0, s * 1.1, 0, TAU); c.clip(); c.fillStyle = L.skin; c.fill(); c.scale(2.6, 2.6); c.translate(0, 0); c.restore(); SK.Render.drawFace(c, fr, 0, 0, s * 1.05); break; }
      case 'up-speed': case 'up-corner': case 'up-acceleration': case 'up-jump': { const col = id === 'up-speed' ? '#4fc3f7' : id === 'up-corner' ? '#69f0ae' : id === 'up-jump' ? '#ff8a65' : '#ffd54a'; c.fillStyle = it.color || '#4caf50'; rr2(-s * 0.3, -s * 0.2, s * 0.6, s * 1.3, s * 0.3); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(0, -s * 1.2); c.lineTo(s * 0.8, -s * 0.3); c.lineTo(s * 0.35, -s * 0.3); c.lineTo(s * 0.35, s * 0.3); c.lineTo(-s * 0.35, s * 0.3); c.lineTo(-s * 0.35, -s * 0.3); c.lineTo(-s * 0.8, -s * 0.3); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.font = '900 ' + s * 0.5 + 'px sans-serif'; c.textAlign = 'center'; c.fillText(id === 'up-speed' ? '⚡' : id === 'up-corner' ? '↻' : id === 'up-jump' ? '↑' : '»', 0, s * 0.95); break; }
      default: { c.fillStyle = '#9e9e9e'; c.beginPath(); c.arc(0, 0, s * 0.8, 0, TAU); c.fill(); }
    }
    c.restore();
  };
  function star(c, x, y, r) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
})(window.SK);
