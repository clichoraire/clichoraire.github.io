// A paused-race preview owns its animation clock, never the real racer's state.
(function(SK){
  let bubble=null,frame=0,anchor=null;
  const P=SK.TrickPreview={};
  P.close=()=>{cancelAnimationFrame(frame);frame=0;bubble?.remove();bubble=null;if(anchor)anchor.setAttribute('aria-expanded','false');anchor=null;};
  P.open=(button,racer,id)=>{
    const def=SK.TRICKS[id];if(!def||!racer)return;
    P.close();anchor=button;button.setAttribute('aria-expanded','true');
    bubble=document.createElement('aside');bubble.className='trick-preview';bubble.setAttribute('role','region');bubble.setAttribute('aria-label','Aperçu animé : '+def.name);
    const close=document.createElement('button');close.className='trick-preview-close';close.textContent='×';close.setAttribute('aria-label','Fermer l’aperçu');close.onclick=P.close;
    const title=document.createElement('strong');title.textContent=def.name;
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=600;canvas.setAttribute('aria-label',racer.def.name+' exécute '+def.name);
    const hint=document.createElement('span');hint.textContent=def.btn==='advanced'?SK.AdvancedTricks.command(def):(def.btn==='trick'?'C':'X')+'  +  '+({none:'Sans flèche',left:'←',right:'→',up:'↑',down:'↓',downleft:'↓ + ←'}[def.dir]);
    bubble.append(close,title,canvas,hint);(button.closest('dialog')||document.body).append(bubble);
    const box=button.getBoundingClientRect(),bw=bubble.offsetWidth,bh=bubble.offsetHeight;
    let left=box.right+12;if(left+bw>innerWidth-8)left=box.left-bw-12;
    if(left<8)left=(innerWidth-bw)/2;
    bubble.style.left=Math.max(8,left)+'px';bubble.style.top=Math.max(8,Math.min(innerHeight-bh-8,box.top-60))+'px';
    const ctx=canvas.getContext('2d'),start=performance.now();
    const preview={...racer,input:{steer:0},prev:{},fx:{},h:0,crouch:0,jumpCharge:0,pumpPose:0,visualTurn:0,steer:0,airYaw:0,curTrick:null,hud:[],coinBurst:null,boxBurst:null,balloonPopAt:null,startTurboAt:null,race:{time:0,phase:'race'}};
    const draw=now=>{
      if(!bubble||!button.isConnected){P.close();return;}
      const t=(now-start)/1000,flight=Math.max(1.3,def.dur*1.4),phase=t%(flight+.65),u=SK.clamp((phase-.2)/flight,0,1),air=phase>=.2&&phase<flight+.2;
      preview.state=air?'air':'ride';preview.curTrick=air?{id,def,t:u*def.dur}:null;preview.h=air?.85*Math.sin(u*Math.PI):0;preview.vy=Math.cos(u*Math.PI);preview.race.time=t;
      ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,320,300);
      const sky=ctx.createLinearGradient(0,0,0,300);sky.addColorStop(0,'#204d72');sky.addColorStop(1,'#9ad8ea');ctx.fillStyle=sky;ctx.fillRect(0,0,320,300);
      ctx.fillStyle='#dbf5fc';ctx.beginPath();ctx.moveTo(0,225);ctx.lineTo(65,155);ctx.lineTo(145,230);ctx.lineTo(235,175);ctx.lineTo(320,225);ctx.lineTo(320,300);ctx.lineTo(0,300);ctx.fill();
      ctx.fillStyle='#f5fcff';ctx.beginPath();ctx.ellipse(160,272,145,22,0,0,Math.PI*2);ctx.fill();
      for(let i=0;i<12;i++){ctx.fillStyle='#ffffff99';ctx.beginPath();ctx.arc((i*79)%320,(i*43+t*12)%280,1.5,0,Math.PI*2);ctx.fill();}
      SK.Render.drawRacer(ctx,preview,160,267,62,t,true);
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
  };
  document.addEventListener('pointerdown',e=>{if(bubble&&!bubble.contains(e.target)&&!e.target.closest('[data-trick-preview]'))P.close();});
  window.addEventListener('resize',P.close);
})(window.SK);
