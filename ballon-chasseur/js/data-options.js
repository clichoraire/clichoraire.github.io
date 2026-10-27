(function(){
 const trigger=document.getElementById('btn-reset-data');
 trigger.onclick=()=>{
  const dialog=document.createElement('dialog');dialog.className='reset-confirm';dialog.setAttribute('aria-labelledby','reset-title');dialog.setAttribute('aria-describedby','reset-description');
  dialog.innerHTML=`<div class="reset-symbol" aria-hidden="true">!</div><p class="arcade-kicker">ATTENTION · ACTION DÉFINITIVE</p><h2 id="reset-title">Tout recommencer ?</h2><p id="reset-description">Toutes les aventures, les niveaux, les pièces d’or, les objets et les trophées de Ballon chasseur seront effacés sur cet appareil. Les paramètres seront aussi réinitialisés.</p><p class="reset-warning">Tu ne pourras pas revenir en arrière.</p><label class="reset-consent"><input type="checkbox"> Je comprends que toute ma progression sera perdue.</label><p class="reset-error" role="alert"></p><div class="reset-actions"><button type="button" class="reset-cancel" autofocus>Garder mes données</button><button type="button" class="reset-delete" disabled>Tout effacer</button></div>`;
  document.body.append(dialog);const erase=dialog.querySelector('.reset-delete');dialog.querySelector('input').onchange=e=>erase.disabled=!e.target.checked;dialog.querySelector('.reset-cancel').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
  erase.onclick=()=>{if(!dialog.querySelector('input').checked)return;try{const keys=Object.keys(localStorage).filter(k=>k.startsWith('bc.'));for(const key of keys)localStorage.removeItem(key);location.reload();}catch{dialog.querySelector('.reset-error').textContent='Impossible d’effacer les données. Réessaie après avoir autorisé le stockage du navigateur.';}};
  dialog.showModal();
 };
})();
