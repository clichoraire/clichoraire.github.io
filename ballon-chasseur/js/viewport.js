// Game menus live on a single fitted stage, like the match canvas.
(function(){
 let pending=false;
 function fit(){pending=false;const root=document.querySelector('.screen:not(.hidden)');if(!root)return;
  document.querySelectorAll('.screen').forEach(s=>{if(s!==root){s.style.transform='';s.style.width='';}});
  if(matchMedia('(max-width:1100px), (pointer:coarse) and (max-width:1400px)').matches){if(root.classList.contains('fitted-screen'))root.classList.remove('fitted-screen');root.style.transform='';root.style.width='';root.style.height='';return;}
  if(root.classList.contains('shared-adventure')||root.id==='screen-practice'||root.id==='screen-match'||root.querySelector('.arcade-versus,.arcade-selection')){if(root.classList.contains('fitted-screen'))root.classList.remove('fitted-screen');root.style.transform='';root.style.width='';root.style.height='';return;}
  if(!root.classList.contains('fitted-screen'))root.classList.add('fitted-screen');
  root.style.transform='none';root.style.setProperty('height','auto','important');
  let scale=Math.min(1,innerWidth/1200);
  // Reflow at the available aspect ratio, rather than letterboxing a fixed width.
  for(let i=0;i<5;i++){
   root.style.width=(innerWidth/scale)+'px';
   const next=Math.min(scale,innerHeight/Math.ceil(root.offsetHeight));
   if(Math.abs(next-scale)<.0001)break;scale=next;
  }
  root.style.width=(innerWidth/scale)+'px';root.style.setProperty('height',(innerHeight/scale)+'px','important');
  root.style.transform=`scale(${scale})`;

 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(fit);}}
 new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);document.fonts.ready.then(schedule);schedule();
})();
