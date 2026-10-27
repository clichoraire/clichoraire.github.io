// Fiche au survol, sans ouvrir de fenêtre modale ni déclencher un achat.
(function(B){
'use strict';let panel=null,timer=null,leave=null;
const close=()=>{clearTimeout(timer);clearTimeout(leave);panel?.remove();panel=null;};
const later=()=>{clearTimeout(leave);leave=setTimeout(close,180);};
B.ItemPreview={close,bind(tile,html){
 tile.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse'||!matchMedia('(hover:hover)').matches)return;close();timer=setTimeout(()=>{if(!tile.isConnected)return;panel=document.createElement('div');panel.className='item-inspect item-hover-preview';panel.setAttribute('popover','manual');panel.setAttribute('role','tooltip');panel.innerHTML=html();(tile.closest('dialog')||document.body).append(panel);panel.showPopover();const r=tile.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight;panel.style.left=Math.max(8,Math.min(innerWidth-w-8,r.right+w+12<innerWidth?r.right+12:r.left-w-12))+'px';panel.style.top=Math.max(8,Math.min(innerHeight-h-8,r.top))+'px';panel.onpointerenter=()=>clearTimeout(leave);panel.onpointerleave=later;},220);});
 tile.addEventListener('pointerleave',()=>{clearTimeout(timer);later();});tile.addEventListener('click',close);
}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel){close();e.preventDefault();e.stopPropagation();}},true);
document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target))close();},true);
document.addEventListener('scroll',e=>{if(panel&&!panel.contains(e.target))close();},true);window.addEventListener('resize',close);
})(window.BC);
