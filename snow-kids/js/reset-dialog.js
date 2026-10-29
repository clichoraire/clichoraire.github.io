(function(SK){
 'use strict';
 SK.ResetDialog={open(onConfirm){
  if(document.getElementById('reset-save-dialog'))return;
  const previous=document.activeElement,d=document.createElement('dialog');d.id='reset-save-dialog';d.className='reset-save-dialog';
  d.setAttribute('aria-labelledby','reset-save-title');d.setAttribute('aria-describedby','reset-save-description');
  d.innerHTML=`<div class="reset-emblem" aria-hidden="true">!</div><h2 id="reset-save-title">Recommencer à zéro ?</h2><p id="reset-save-description">La progression de <b>tous les personnages</b> sur cet appareil sera effacée.</p><div class="reset-losses"><span>⭐ Niveaux et stats</span><span>🪙 Pièces et équipement</span><span>🏆 Missions et trophées</span><span>☃ Décorations et temps de jeu</span></div><p class="reset-warning">Cette action est définitive.</p><div class="reset-actions"><button type="button" class="reset-cancel" autofocus>Garder ma partie</button><button type="button" class="reset-confirm">Tout effacer</button></div>`;
  const close=()=>{d.close();d.remove();previous?.focus();};
  d.addEventListener('cancel',e=>{e.preventDefault();close();});
  d.querySelector('.reset-cancel').onclick=close;
  d.querySelector('.reset-confirm').onclick=()=>{close();onConfirm();};
  document.body.append(d);d.showModal();
 }};
})(window.SK);
