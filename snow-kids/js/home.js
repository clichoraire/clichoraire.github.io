// Accueil : sélecteur de difficulté au clavier et rebonds respectant les préférences de mouvement.
(function(SK){
  'use strict';
  const $=id=>document.getElementById(id);let ready=false;
  SK.Home={
    sync(){if(!ready)return;const select=$('opt-diff'),value=+select.value;$('difficulty-value').textContent=select.selectedOptions[0].textContent;
      $('difficulty-button').querySelector('.difficulty-dots').innerHTML='●'.repeat(value+1)+'<i>'+'●'.repeat(2-value)+'</i>';
      [...$('difficulty-list').children].forEach((option,i)=>{option.setAttribute('aria-selected',String(i===value));});},
    init(){if(ready)return;ready=true;const select=$('opt-diff'),button=$('difficulty-button'),list=$('difficulty-list');
      const close=(focus=false)=>{list.classList.add('hidden');button.setAttribute('aria-expanded','false');if(focus)button.focus();};
      const open=()=>{list.classList.remove('hidden');button.setAttribute('aria-expanded','true');list.children[+select.value].focus();};
      const choose=i=>{select.value=i;select.dispatchEvent(new Event('change',{bubbles:true}));SK.Home.sync();close(true);};
      [...select.options].forEach((option,i)=>{const item=document.createElement('button');item.type='button';item.role='option';item.tabIndex=-1;item.innerHTML='<span>'+option.textContent+'</span><small>'+['Pour prendre ses marques','Le bon équilibre','Prêt à tout donner ?'][i]+'</small><b aria-hidden="true">✓</b>';item.onclick=()=>choose(i);list.appendChild(item);});
      button.onclick=()=>list.classList.contains('hidden')?open():close();
      button.onkeydown=e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();open();if(e.key==='Home')list.firstElementChild.focus();if(e.key==='End')list.lastElementChild.focus();}};
      list.onkeydown=e=>{let i=[...list.children].indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();close(true);}else if(e.key==='Tab'){close();}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowDown'?1:2))%3;list.children[i].focus();}};
      document.addEventListener('pointerdown',e=>{if(!e.target.closest('.difficulty-control'))close();});
      document.addEventListener('focusin',e=>{if(!e.target.closest('.difficulty-control'))close();});
      select.addEventListener('change',SK.Home.sync);
      $('screen-menu').addEventListener('pointerup',e=>{const target=e.target.closest('button');if(!target||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
        target.animate([{scale:'.94 1.04'},{scale:'1.07 .96',offset:.35},{scale:'.985 1.015',offset:.65},{scale:'1'}],{duration:560,easing:'cubic-bezier(.2,.8,.3,1)'});});
      SK.Home.sync();
    }
  };
})(window.SK);
