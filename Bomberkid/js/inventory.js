// Sac : 24 emplacements et huit raccourcis. Les piles restent la source des quantités.
(function (BK) {
  'use strict';
  BK.BAG_SIZE = 24; BK.QUICK_SIZE = 8;
  BK.inventoryLayout = p => {
    BK.normalizeRemedyBag(p);
    const types = (p.inv || []).filter(s => s.n > 0).map(s => s.type);
    for (const [key, size] of [['bagSlots', BK.BAG_SIZE], ['quickSlots', BK.QUICK_SIZE]]) {
      const seen = new Set(), slots = p[key] || [];
      p[key] = Array.from({ length: size }, (_, i) => { const t = slots[i]; if (!types.includes(t) || seen.has(t)) return null; seen.add(t); return t; });
      for (const type of types) if (!seen.has(type)) { const i = p[key].indexOf(null); if (i < 0) break; p[key][i] = type; seen.add(type); }
    }
    return p;
  };
  BK.moveInventorySlot = (p, from, to) => {
    BK.inventoryLayout(p);
    if (!['bagSlots', 'quickSlots'].includes(from.zone) || !['bagSlots', 'quickSlots'].includes(to.zone)) return false;
    const src = p[from.zone], dst = p[to.zone]; if (!Number.isInteger(from.i) || !Number.isInteger(to.i) || from.i < 0 || from.i >= src.length || to.i < 0 || to.i >= dst.length || !src[from.i]) return false;
    const type = src[from.i], old = dst.indexOf(type);
    if (old === to.i) return false;
    if (old >= 0) dst[old] = dst[to.i];
    dst[to.i] = type; return true;
  };
  BK.useQuickItem = (W, p, i) => { BK.inventoryLayout(p); const at = (p.inv || []).findIndex(s => s.type === p.quickSlots[i]); return at >= 0 && W.useItem(p, at); };
  BK.bagSvg = '<svg viewBox="0 0 100 110" aria-hidden="true"><path d="M35 24V16Q50 0 65 16V24" fill="none" stroke="#6243a3" stroke-width="10"/><path d="M22 48Q4 44 8 91L26 96M78 48Q96 44 92 91L74 96" fill="#ffba3e" stroke="#9b5b36" stroke-width="3"/><rect x="18" y="22" width="64" height="79" rx="23" fill="#9b6ee1" stroke="#50378d" stroke-width="4"/><path d="M19 42Q16 17 50 19Q84 17 81 42L73 56H27Z" fill="#ffc94b" stroke="#9b5b36" stroke-width="3"/><path d="M25 34Q31 24 45 25" fill="none" stroke="#fff0a9" stroke-width="5" stroke-linecap="round"/><rect x="27" y="62" width="46" height="30" rx="12" fill="#62c8ed" stroke="#3e6eb3" stroke-width="3"/><path d="M32 68H68" stroke="#d8faff" stroke-width="3"/><path d="M49 30L54 39L64 41L57 48L58 58L49 53L40 58L41 48L34 41L44 39Z" fill="#fff8ba" stroke="#d28c30" stroke-width="2"/><circle cx="39" cy="77" r="3" fill="#35477c"/><circle cx="61" cy="77" r="3" fill="#35477c"/><path d="M44 83Q50 89 56 83" fill="none" stroke="#35477c" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="82" r="3" fill="#ff93ad"/><circle cx="66" cy="82" r="3" fill="#ff93ad"/></svg>';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  BK.openInventory = host => {
    if (BK.inventoryOpen || !host || !host.player || !host.world || host.state && host.state !== 'play') return;
    const p = host.player, W = host.world, save = host.save || {}, wasFrozen = W.frozen;
    BK.inventoryOpen = true; W.frozen = true; BK.input.keys.clear(); BK.input.touch.bombHeld = false; BK.input.flush();
    const modal = document.createElement('div'); modal.className = 'bag-modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Sac d’aventure'); document.getElementById('app').appendChild(modal);
    let selection = null, drag = null, ghost = null, message = '', focusBefore = document.activeElement;
    const clearDrag = () => { ghost?.remove(); ghost = null; drag = null; modal.querySelectorAll('.drop-target').forEach(e => e.classList.remove('drop-target')); };
    const close = () => { clearDrag(); modal.remove(); document.removeEventListener('keydown', keys, true); BK.inventoryOpen = false; W.frozen = wasFrozen; BK.input.keys.clear(); BK.input.touch.bombHeld = false; BK.input.flush(); BK.input.touch.dx = BK.input.touch.dy = 0; p.input.dx = p.input.dy = 0; if (host.syncInv) { host.syncInv(); BK.saveAdventure(host.charId, save); } focusBefore?.focus(); };
    const keys = e => { if (e.key === 'Escape' || e.code === 'KeyI') { e.preventDefault(); close(); } else if (e.key === 'Tab') { const els = [...modal.querySelectorAll('button:not(:disabled), summary, select')], at = els.indexOf(document.activeElement); e.preventDefault(); els[(at + (e.shiftKey ? -1 : 1) + els.length) % els.length]?.focus(); } e.stopPropagation(); };
    document.addEventListener('keydown', keys, true);
    const slot = (zone, i) => {
      const type = p[zone][i], it = BK.ITEMS[type], pile = (p.inv || []).find(s => s.type === type), sel = selection?.zone === zone && selection.i === i;
      return '<button class="bag-slot '+(type?'filled ':'')+(sel?'selected':'')+'" data-zone="'+zone+'" data-slot="'+i+'" aria-label="'+esc(it ? it.name+', quantité '+pile.n : 'Case vide '+(i+1))+'" aria-pressed="'+sel+'">'+(zone==='quickSlots'?'<small>'+(i+1)+'</small>':'')+(type?'<canvas width="96" height="96" data-item="'+esc(type)+'"></canvas><b>'+pile.n+'</b>':'<span class="empty-dot">✦</span>')+'</button>';
    };
    const render = () => {
      BK.inventoryLayout(p); const lv = BK.levelFromXp(save.xp || 0), stats = Object.assign(BK.defaultStats(), save.stats || {}), found = p.found || [], type = selection && p[selection.zone][selection.i], item = BK.ITEMS[type];
      modal.innerHTML = '<section class="bag-window"><header class="bag-heading"><div class="bag-mini">'+BK.bagSvg+'</div><div><span class="bag-eyebrow">PRÊT POUR L’AVENTURE</span><h1>Mon sac</h1></div><span class="bag-paused">Jeu en pause</span><button class="bag-close" aria-label="Fermer le sac">×</button></header><div class="bag-layout"><aside class="bag-character"><div class="bag-portrait"><canvas width="250" height="240" id="bag-hero"></canvas><span>NIVEAU '+lv.level+'</span></div><h2>'+esc(p.name)+'</h2><div class="bag-xp"><i style="width:'+Math.round(lv.current/lv.needed*100)+'%"></i></div><p class="bag-xp-label">'+lv.current+' / '+lv.needed+' XP</p><div class="bag-vitals"><b>♥ '+Math.ceil(p.hp)+' / '+p.maxHp+'</b><b>ϟ '+Math.round(p.stamina)+' / '+p.staminaMax+'</b></div><details class="bag-stats"><summary>⭐ Mes forces</summary><div class="bag-stat-head"><span></span><span>Base</span><span>Actuel</span></div>'+Object.entries(BK.STATS).map(([k,d])=>'<div class="bag-stat"><span>'+esc(d.name)+'</span><span>'+d.base+'</span><b>'+esc(k==='hpMax'?p.maxHp:stats[k])+'</b></div>').join('')+'</details><div class="bag-powers">💣 '+p.bombsMax+' bombes · 🔥 portée '+p.fire+BK.BOMB_POWERS.filter(key=>p[key]).map(key=>'<br>'+esc(BK.ITEMS[key].icon+' '+BK.ITEMS[key].name)).join('')+(p.shield?'<br>🛡️ Une explosion protégée':'')+'</div><button class="bag-stats-button">⭐ Devenir plus fort'+(save.points?' · '+save.points+' points':'')+'</button></aside><main class="bag-content"><div class="bag-section-title"><h2>🎒 Mes trésors</h2><span>'+(p.inv||[]).length+' / 24 places</span></div><p class="bag-help">Glisse un objet pour le ranger ou l’ajouter aux raccourcis.</p><div class="bag-grid">'+Array.from({length:24},(_,i)=>slot('bagSlots',i)).join('')+'</div><div class="bag-detail" aria-live="polite"><div><strong>'+esc(item?item.name:'Tout ce qu’il te faut pour explorer')+'</strong><p>'+esc(message || (item?item.desc:'Sélectionne un objet, puis touche une case pour le déplacer.'))+'</p></div><button class="bag-use" '+(!item?'disabled':'')+'>Utiliser</button></div><div class="bag-section-title"><h3>⚡ Ma ceinture</h3><span>Touches 1–8 · Q / W</span></div><div class="bag-quick">'+Array.from({length:8},(_,i)=>slot('quickSlots',i)).join('')+'</div><section class="bag-harvest"><div class="bag-section-title"><h3>🌟 Mes trouvailles</h3><span>'+found.reduce((n,f)=>n+f.n,0)+' trouvés</span></div><div class="bag-found">'+(found.length?found.map(f=>'<span>'+esc(BK.ITEMS[f.type]?.icon||'✦')+' '+esc(BK.ITEMS[f.type]?.name||f.type)+' <b>×'+f.n+'</b></span>').join(''):'<p>Ton aventure commence : tes trouvailles apparaîtront ici.</p>')+'</div></section></main></div><footer class="bag-footer"><span>24 places · Les objets identiques s’empilent.</span><button class="bag-resume">C’est parti ! →</button></footer></section>';
      const hero = modal.querySelector('#bag-hero').getContext('2d'); hero.translate(125,218); BK.sprites.drawCharacter(hero,p.def,{s:120,pose:'idle',t:0,view:'front'});
      for (const canvas of modal.querySelectorAll('[data-item]')) { const ctx=canvas.getContext('2d'); ctx.translate(48,72); BK.sprites.drawItem(ctx,canvas.dataset.item,64,0); }
      modal.querySelector('.bag-close').onclick = close; modal.querySelector('.bag-resume').onclick = close;
      modal.querySelector('.bag-stats-button').onclick = () => { close(); const state=host.state; if(state) host.state='pause'; W.frozen=true; BK.showStats(host.charId,save,()=>{ if(state) host.state=state; W.frozen=wasFrozen; BK.applyStats(p,save,true); BK.openInventory(host); }); };
      if(p.heldSnail){const stow=document.createElement('button');stow.className='bag-stats-button';stow.textContent='🐌 Ranger mon escargot';stow.onclick=()=>{message=W.stowSnail(p)?'Ton escargot est dans le sac !':'Ton sac est plein. Libère une place pour ton escargot.';render();};modal.querySelector('.bag-character').appendChild(stow);}
      modal.querySelector('.bag-use').textContent=item?.snailColor?'🐌 Déposer':'Utiliser';
      if(item?.snailColor){const pile=p.inv.find(s=>s.type===type),label=document.createElement('label');label.className='bag-snail-choice';label.textContent='🐌 Choisir mon escargot ';const select=document.createElement('select');select.id='bag-snail-choice';for(const [i,sn] of BK.snailStack(pile).entries()){const opt=document.createElement('option');opt.value=i;opt.textContent=sn.nickname||((sn.baby?'Bébé':'Escargot')+' '+(i+1));select.appendChild(opt);}label.appendChild(select);modal.querySelector('.bag-detail>div').appendChild(label);}
      if(item){const pet=W.enemies.filter(e=>!e.dead&&BK.PET_FOODS[e.type]?.includes(type)&&W.canSee(e,p,1.4)&&Math.abs(W.groundZ(e.x,e.y)-W.groundZ(p.x,p.y))<.3).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
        if(pet){const feed=document.createElement('button');feed.className='bag-use';feed.textContent=(pet.def.wildlife?.icon||(pet.type==='chat'?'🐱':'🐶'))+' Nourrir : '+pet.def.name;feed.onclick=()=>{message=W.feedPet(p,pet,type)?'Miam ! Ton ami te suit une minute de plus.':'Approche-toi de ton ami avec une portion dans le sac.';if(host.syncInv){host.syncInv();BK.saveAdventure(host.charId,save);}render();};modal.querySelector('.bag-detail').appendChild(feed);}
      }
      modal.querySelector('.bag-use').onclick = () => { const i=(p.inv||[]).findIndex(s=>s.type===type); if(i<0)return; const done=W.useItem(p,i,Number(modal.querySelector('#bag-snail-choice')?.value||0)); message=done?'Objet utilisé.':p.hp>=p.maxHp && /pumpkin|meatcooked|poultrycooked/.test(type)?'Ta vie est déjà pleine.': 'Cet objet ne peut pas être utilisé ici. '+item.desc; render(); };
    };
    const loc = el => el?.closest?.('[data-zone]');
    const read = el => ({zone:el.dataset.zone,i:Number(el.dataset.slot)});
    modal.addEventListener('pointerdown', e => { const el=loc(e.target); if(!el || e.button!==0)return; const from=read(el); drag={from,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false}; el.setPointerCapture(e.pointerId); });
    modal.addEventListener('pointermove', e => { if(!drag || e.pointerId!==drag.id)return; if(!drag.moved && Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8 && p[drag.from.zone][drag.from.i]) { drag.moved=true; ghost=document.createElement('div'); ghost.className='bag-drag-ghost'; ghost.textContent=BK.ITEMS[p[drag.from.zone][drag.from.i]].icon; document.body.appendChild(ghost); } if(!drag.moved)return; e.preventDefault(); ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'; modal.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target')); loc(document.elementFromPoint(e.clientX,e.clientY))?.classList.add('drop-target'); });
    modal.addEventListener('pointerup', e => { if(!drag || drag.id!==e.pointerId)return; const {from,moved}=drag, el=loc(document.elementFromPoint(e.clientX,e.clientY)); clearDrag(); message=''; if(moved) { if(el)BK.moveInventorySlot(p,from,read(el)); selection=null; } else if(el) { const to=read(el); if(selection && !(selection.zone===to.zone&&selection.i===to.i)) { BK.moveInventorySlot(p,selection,to);selection=null; } else selection=p[to.zone][to.i]?to:null; } render(); });
    modal.addEventListener('pointercancel',clearDrag);
    modal.addEventListener('click',e=>{ const el=loc(e.target); if(!el || e.detail!==0)return; const to=read(el);if(selection){BK.moveInventorySlot(p,selection,to);selection=null;}else selection=p[to.zone][to.i]?to:null;render(); });
    render(); modal.querySelector('.bag-close').focus();
  };
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
    const button=document.createElement('button');button.id='bag-button';button.hidden=true;button.setAttribute('aria-label','Ouvrir le sac — I');button.innerHTML=BK.bagSvg+'<span>MON SAC <kbd>I</kbd></span>';document.getElementById('screen-game').appendChild(button);button.onclick=()=>BK.openInventory(BK.current);
    BK.refreshBagButton = () => { const h=BK.current;button.hidden=!(BK.screen==='game' && h?.player && h?.save && (!h.state||h.state==='play') && !BK.inventoryOpen); };
  });
})(window.BK);
