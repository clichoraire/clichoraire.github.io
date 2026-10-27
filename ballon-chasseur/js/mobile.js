// Compact navigation keeps the footer reachable without shrinking the interface.
(function(){
 let queued=false;
 function update(){queued=false;const root=document.querySelector('#screen-arcade');if(!root||root.classList.contains('hidden'))return;if(root.classList.contains('shared-adventure')){root.querySelector('.mobile-campaign-tabs')?.remove();return;}const content=root.querySelector('.arcade-campaign');if(content&&!content.querySelector('.mobile-campaign-tabs')){const nav=document.createElement('nav');nav.className='mobile-campaign-tabs';nav.setAttribute('aria-label','Sections de l’aventure');content.prepend(nav);content.dataset.mobileSection='match';for(const [id,label]of [['match','⚔ Adversaires'],['hero','★ Mon héros']]){const b=document.createElement('button');b.textContent=label;b.type='button';b.setAttribute('aria-pressed',String(id==='match'));b.onclick=()=>{content.dataset.mobileSection=id;nav.querySelectorAll('button').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));};nav.append(b);}}
 }
 new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(update);}}).observe(document.getElementById('app'),{childList:true,subtree:true});update();
})();
