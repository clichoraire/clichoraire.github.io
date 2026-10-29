(function(SK){
 'use strict';
 let dialog;
 SK.VillagePause={open(save,onMenu){
  if(dialog)return;SK.Town.paused=true;SK.Audio.stopSanta?.();SK.Input.keys={};SK.Input.pressed={};SK.Touch.pause(true);
  dialog=document.createElement('dialog');dialog.className='village-pause pause-box';dialog.setAttribute('aria-label','Village en pause');
  dialog.innerHTML='<h2>PAUSE</h2><p>Une petite pause au village</p><section class="pause-rider" aria-label="Ton personnage et ses statistiques"></section><nav class="pause-tools"><button class="village-settings"><span aria-hidden="true">⚙</span><span>Configuration</span></button><button class="village-controls" aria-expanded="false"><span aria-hidden="true">✥</span><span>Commandes</span></button></nav><div class="village-help" hidden><p>← → ou A / D : se déplacer<br>Clique ou touche le village pour te déplacer et interagir.<br>Entrée : entrer dans un bâtiment ou discuter.<br>Échap : pause / reprendre.</p></div><button class="primary village-resume">Reprendre</button><div class="pause-actions"><button class="ghost village-menu">Menu principal</button></div>';
  const id=save.advChar||save.char,def=SK.trainedCharacter(id,save),board=SK.effectiveBoard(save.advBoard||save.board,save),look=SK.lookOf(def,save),r=SK.fakeRacer(id,board.id,'ride',look);
  Object.assign(r,{def,board,look,gear:SK.equippedGear(save,id),strength:SK.capStat((def.strength||3)+(save.strengthLevel||0))});
  SK.PauseCard.show(dialog.querySelector('.pause-rider'),[r]);
  const close=()=>{if(!dialog)return;dialog.close();dialog.remove();dialog=null;SK.Town.paused=false;SK.Input.keys={};SK.Input.pressed={};SK.Touch.pause(false);};
  dialog.querySelector('.village-resume').onclick=close;
  dialog.querySelector('.village-menu').onclick=()=>{close();onMenu();};
  dialog.querySelector('.village-settings').onclick=()=>SK.MusicSettings.open();
  dialog.querySelector('.village-controls').onclick=e=>{const p=dialog.querySelector('.village-help');p.hidden=!p.hidden;e.currentTarget.setAttribute('aria-expanded',String(!p.hidden));};
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());
  document.body.append(dialog);dialog.showModal();
 }};
})(window.SK);
