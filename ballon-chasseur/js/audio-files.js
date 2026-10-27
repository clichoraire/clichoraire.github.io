// Downloaded CC0 tracks and foley. Synth effects remain for magic and fast throws.
(function(B){
 'use strict';const A=B.audio,base='assets/audio/',samples={},voices=new Set(),last={};
 const init=A.init,play=A.play,mute=A.setMuted;
 let unlocked=false,music=null,scene='menu',paused=false,target=.22;
 try{target=Number(JSON.parse(localStorage.getItem('bc.settings')||'{}').musicVolume??.22);}catch{}
 A.musicVolume=Math.max(0,Math.min(1,target));
 for(const key of ['hit','catch','bounce','ui','smash','explode','jump','arm']){const a=new Audio(base+key+'.mp3');a.preload='auto';samples[key]=a;}
 const tracks={};for(const key of ['menu','match','boss','result']){const a=new Audio(base+key+'.mp3');a.loop=true;a.volume=0;a.preload='none';tracks[key]=a;}
 function sync(){if(!unlocked)return;const next=tracks[scene]||tracks.menu;if(music!==next){if(music){music.pause();music.currentTime=0;}music=next;music.volume=0;}
  if(A.muted||document.hidden||paused||!A.musicVolume){music.pause();return;}if(music.paused)music.play().catch(()=>{});
 }
 A.init=function(){init();unlocked=true;sync();};
 A.setMusicScene=function(id){scene=id==='match'?(B.app?.game?.teams?.some(t=>t.boss)?'boss':'match'):id==='result'?'result':'menu';paused=false;sync();};
 A.pauseMusic=function(value){if(paused!==value){paused=value;sync();}};
 A.setMuted=function(value){mute(value);if(value){for(const v of voices)v.pause();voices.clear();}sync();};
 A.play=function(name){if(!unlocked||A.muted||document.hidden)return;const template=samples[name];if(!template)return play(name);
  const now=performance.now();if(now-(last[name]||-1000)<55||voices.size>=12)return;last[name]=now;
  const a=template.cloneNode();a.volume=name==='ui'?.18:name==='arm'?.22:.48;voices.add(a);const clean=()=>voices.delete(a);a.onended=clean;a.onerror=clean;a.play().catch(()=>{clean();play(name);});
 };
 setInterval(()=>{if(music&&!music.paused)music.volume+=(A.musicVolume-music.volume)*.2;},80);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const v of voices)v.pause();voices.clear();}sync();});
 for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>A.init(),{once:true,capture:true});
 document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('button').disabled)A.play('ui');});
 const label=document.createElement('label');label.innerHTML='Musique <input id="opt-music" type="range" min="0" max="100" step="5" aria-label="Volume de la musique">';
 document.getElementById('opt-sound').parentElement.after(label);const slider=label.querySelector('input');slider.value=A.musicVolume*100;slider.oninput=()=>{A.musicVolume=+slider.value/100;if(B.app){B.app.settings.musicVolume=A.musicVolume;try{localStorage.setItem('bc.settings',JSON.stringify(B.app.settings));}catch{}}sync();};
})(window.BC);
