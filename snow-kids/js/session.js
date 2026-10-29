// Temps actif par aventure, sans compter les pauses ni les onglets cachés.
(function(SK){
 'use strict';
 const S=SK.Session={paused:false};
 S.format=seconds=>{const minutes=Math.floor(Math.max(0,Number(seconds)||0)/60);return Math.floor(minutes/60)+' h '+String(minutes%60).padStart(2,'0')+' min';};
 S.formatCompact=seconds=>{const minutes=Math.floor(Math.max(0,Number(seconds)||0)/60);return Math.floor(minutes/60)+'h'+String(minutes%60).padStart(2,'0');};
 S.createTimer=(now=0)=>({last:now,activity:now,tick(now,enabled){const seconds=enabled?Math.max(0,Math.min(now,this.activity+120000)-this.last)/1000:0;this.last=now;return {seconds,idle:enabled&&now-this.activity>=120000};},touch(now){this.activity=now;}});
 S.init=opts=>{
  const timer=S.timer=S.createTimer(performance.now());let lastStore=performance.now(),wasRacePaused=false;
  const dialog=document.createElement('dialog');dialog.id='idle-dialog';dialog.innerHTML='<div aria-hidden="true" class="idle-icon">⏸</div><h2>Tu es en pause ?</h2><p>Reviens jouer !</p><button autofocus>Je reviens jouer !</button>';dialog.setAttribute('aria-label','Tu es en pause ? Reviens jouer !');document.body.appendChild(dialog);
  const activity=()=>{if(!S.paused)timer.touch(performance.now());};
  for(const type of ['pointerdown','pointermove','pointerup','keydown','keyup','wheel'])document.addEventListener(type,activity,{passive:true,capture:true});
  function pause(){if(S.paused)return;S.paused=true;wasRacePaused=opts.pause();SK.Input.keys={};SK.Input.pressed={};SK.Touch.pause(true);dialog.showModal();opts.store();}
  function resume(){if(!S.paused)return;dialog.close();S.paused=false;timer.last=performance.now();timer.touch(timer.last);SK.Input.keys={};SK.Input.pressed={};opts.resume(wasRacePaused);SK.Touch.pause(opts.isPaused());}
  dialog.querySelector('button').onclick=resume;dialog.addEventListener('cancel',e=>{e.preventDefault();resume();});
  document.addEventListener('keydown',e=>{if(S.paused&&!['Enter','Tab','Escape','Space'].includes(e.code)){e.stopImmediatePropagation();e.preventDefault();}},true);
  S.tick=()=>{
   const now=performance.now();
   const pad=SK.Input.pads().some(p=>p.buttons.some(b=>b.pressed)||p.axes.some(a=>Math.abs(a)>.25));
   if(!document.hidden&&!S.paused&&(Object.values(SK.Input.keys).some(Boolean)||Object.values(SK.Touch.held).some(Boolean)||pad))timer.touch(now);
   const result=timer.tick(now,!S.paused&&!opts.isPaused()&&!document.hidden&&SK.Touch.screen!=='menu');
   const save=opts.getSave();if(result.seconds)save.playSeconds=(Number(save.playSeconds)||0)+result.seconds;
   document.querySelectorAll('[data-play-time]').forEach(el=>{const profile=SK.Profiles.peek(save,el.dataset.playTime);const label='Temps de jeu : '+S.format(profile.playSeconds);el.textContent=el.dataset.timeFormat==='compact'?S.formatCompact(profile.playSeconds):'⏱ '+label;el.title=label;el.setAttribute('aria-label',label);});
   if(result.idle)pause();
   if(now-lastStore>15000){lastStore=now;opts.store();}
  };
  setInterval(S.tick,1000);
  document.addEventListener('visibilitychange',()=>{S.tick();opts.store();});
  addEventListener('pagehide',()=>{S.tick();opts.store();});
 };
})(window.SK);
