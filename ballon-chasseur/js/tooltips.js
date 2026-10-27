// Shared arcade tooltips, including dynamically rendered menus.
(function(){
 const tip=document.createElement('div');tip.id='arcade-tooltip';tip.className='arcade-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 let active=null,timer=null,previousDescription=null;
 function convert(root){if(root.nodeType!==1)return;const nodes=[...(root.matches('[title]')?[root]:[]),...root.querySelectorAll('[title]')];for(const el of nodes){const text=el.getAttribute('title');el.removeAttribute('title');if(text)el.dataset.tooltip=text;else delete el.dataset.tooltip;if(text&&!el.matches('button,input,select,textarea,a,[tabindex]'))el.tabIndex=0;}}
 function hide(){clearTimeout(timer);if(active){if(previousDescription===null)active.removeAttribute('aria-describedby');else active.setAttribute('aria-describedby',previousDescription);}active=null;tip.hidden=true;}
 function place(){if(!active?.isConnected||!active.getClientRects().length){hide();return;}const r=active.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;const left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2));let top=r.top-h-12;if(top<12)top=Math.min(innerHeight-h-12,r.bottom+12);tip.style.left=left+'px';tip.style.top=Math.max(12,top)+'px';}
 function show(el,immediate=false){if(active===el)return;hide();active=el;previousDescription=el.getAttribute('aria-describedby');el.setAttribute('aria-describedby',((previousDescription||'')+' '+tip.id).trim());timer=setTimeout(()=>{if(active!==el)return;tip.textContent=el.dataset.tooltip;tip.hidden=false;place();},immediate?0:180);}
 convert(document.body);
 new MutationObserver(records=>{for(const r of records){if(r.type==='attributes')convert(r.target);else for(const n of r.addedNodes)convert(n);}if(active&&!active.isConnected)hide();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['title']});
 document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-tooltip]');if(el)show(el);else hide();});
 document.addEventListener('pointerout',e=>{if(active&&!active.contains(e.relatedTarget))hide();});
 document.addEventListener('focusin',e=>{const el=e.target.closest('[data-tooltip]');if(el)show(el,true);});
 document.addEventListener('focusout',hide);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});document.addEventListener('pointerdown',hide);
 addEventListener('scroll',()=>{if(active&&!tip.hidden)place();},true);addEventListener('resize',hide);addEventListener('blur',hide);
})();
