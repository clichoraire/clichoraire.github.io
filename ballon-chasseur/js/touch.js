// Commandes tactiles du joueur 1 : état indépendant du clavier et des manettes.
(function (G) {
  'use strict';
  const I=G.input, state={}, held=new Map();
  const bar=document.createElement('nav');bar.id='touch-controls';bar.setAttribute('aria-label','Commandes tactiles');
  bar.innerHTML='<div class="touch-stick" role="button" aria-label="Direction : glisse le doigt"><span>▲</span><span>◀　●　▶</span><span>▼</span></div><div class="touch-actions"></div><button class="touch-pause" aria-label="Pause">Ⅱ</button><button class="touch-fullscreen" aria-label="Plein écran">⛶</button>';
  document.getElementById('screen-match').appendChild(bar);
  const fullscreen=bar.querySelector('.touch-fullscreen');fullscreen.hidden=!document.documentElement.requestFullscreen;fullscreen.onclick=async()=>{reset();try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}};
  const actions=[['a','Lancer /<br>sauter'],['b','Passe /<br>attraper'],['p','Pouvoir ✨'],['cycle','Joueur ↻']];
  bar.querySelector('.touch-actions').innerHTML=actions.map(([key,label])=>'<button data-touch="'+key+'">'+label+'</button>').join('');
  const stick=bar.querySelector('.touch-stick');let stickId=null;
  function reset(){held.clear();for(const k of Object.keys(state))delete state[k];stickId=null;bar.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
  function direction(e){const r=stick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);state.dx=Math.abs(x)>.22?Math.sign(x):0;state.dy=Math.abs(y)>.22?Math.sign(y):0;}
  stick.onpointerdown=e=>{if(stickId!==null)return;e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stick.classList.add('held');direction(e);};
  stick.onpointermove=e=>{if(e.pointerId===stickId)direction(e);};
  function release(e){if(e.pointerId===stickId){stickId=null;state.dx=state.dy=0;stick.classList.remove('held');}const key=held.get(e.pointerId);held.delete(e.pointerId);if(key&&!Array.from(held.values()).includes(key)){state[key]=false;bar.querySelector('[data-touch="'+key+'"]').classList.remove('held');}}
  bar.querySelectorAll('[data-touch]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.set(e.pointerId,b.dataset.touch);state[b.dataset.touch]=true;b.classList.add('held');};});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])bar.addEventListener(type,release);
  bar.querySelector('.touch-pause').onclick=()=>{reset();I.pressed.Escape=true;};
  const get=I.get;I.get=function(n){const v=get(n);if(n===1&&active()){v.dx=state.dx||v.dx;v.dy=state.dy||v.dy;for(const k of ['a','b','p','cycle'])if(state[k])v[k]=true;}return v;};
  const media=matchMedia('(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)');
  function active(){return media.matches&&G.app.screen==='match'&&document.getElementById('pause').classList.contains('hidden');}
  function layout(){reset();const enabled=media.matches&&G.app.screen==='match';document.body.classList.toggle('touch-match',enabled);bar.hidden=!active();const stage=document.querySelector('.stage');if(!enabled){stage.style.width='';stage.style.height='';return;}const w=document.documentElement.clientWidth,h=window.innerHeight,side=w>h&&h<=500;const availableW=w-(side?252:16),availableH=h-(side?8:(w>=600?210:170));const width=Math.max(1,Math.min(availableW,availableH*16/9));stage.style.width=width+'px';stage.style.height=width*9/16+'px';}
  new MutationObserver(layout).observe(document.getElementById('screen-match'),{attributes:true,attributeFilter:['class']});
  new MutationObserver(layout).observe(document.getElementById('pause'),{attributes:true,attributeFilter:['class']});
  addEventListener('resize',layout);window.visualViewport?.addEventListener('resize',layout);document.addEventListener('fullscreenchange',layout);media.addEventListener('change',layout);addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);layout();
})(window.BC);
