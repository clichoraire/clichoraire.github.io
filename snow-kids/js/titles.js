// Le contour reprend le texte réel, même lorsque le titre change à la fin d'une course.
(function(){
  for(const heading of document.querySelectorAll('.panel h2')){
    heading.classList.add('n64-title');
    const sync=()=>heading.dataset.text=heading.textContent;
    sync();new MutationObserver(sync).observe(heading,{childList:true,characterData:true,subtree:true});
  }
})();
