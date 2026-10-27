// Atelier de test : réglages en mémoire uniquement, aucune récompense de course.
(function(SK){
  'use strict';
  const D=SK.DebugHouse={};
  let settings=null,race=null,controls=null;
  const keys=[['speed','Vitesse'],['corner','Virage'],['acceleration','Accélération'],['jump','Saut']];
  const room=document.createElement('section');room.id='screen-debug';room.className='screen hidden debug-room';document.body.appendChild(room);
  function button(parent,text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;parent.appendChild(b);return b;}
  D.open=function(save,launch,back){
    D.close();const ch=SK.trainedCharacter(save.advChar||save.char,save),b=SK.effectiveBoard(save.advBoard,save);
    if(!settings)settings={stats:Object.fromEntries(keys.map(([k])=>[k,(ch[k]||0)+(b[k]||0)])),curve:0,slope:4,width:12,auto:false,loop:true};
    room.innerHTML='<div class="debug-room-content"><h1>La cabane des essais</h1><p>Plancher qui craque, expériences qui dérapent…</p><p>Les essais ne donnent ni argent, ni trophée, ni record.</p><div class="debug-room-buttons"></div></div>';
    const list=room.querySelector('.debug-room-buttons');
    const select=document.createElement('select');select.setAttribute('aria-label','Piste de test');
    for(const c of SK.COURSES){const o=document.createElement('option');o.value=c.id;o.textContent=c.name;select.appendChild(o);}list.appendChild(select);
    button(list,'1 · Partir sur une piste, tout seul',()=>launch(SK.courseById(select.value),false));
    button(list,'2 · Laboratoire : virage continu et pente réglable',()=>launch(SK.COURSES[0],true));
    button(list,'3 · Remettre les réglages du personnage',()=>{settings=null;D.open(save,launch,back);});
    button(list,'Retour au village',back);
  };
  D.attach=function(r,lab,exit,restart,pause){
    race=r;race.debugLab=lab;D.lab=lab;const original=r.track.segs.map(s=>({y1:s.y1,y2:s.y2,curve:s.curve,w:s.w}));
    controls=document.createElement('aside');controls.id='debug-controls';controls.innerHTML='<details open><summary>🛠 Essais — solo</summary><div class="debug-body"><p>Stats totales · 0–40 · ×2 pour dépasser les valeurs normales</p></div></details>';document.getElementById('screen-race').appendChild(controls);
    const body=controls.querySelector('.debug-body');
    for(const event of ['keydown','keyup'])controls.addEventListener(event,e=>{e.stopPropagation();SK.Input.keys={};SK.Input.pressed={};});
    function number(label,value,min,max,step,change){const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step=step;input.value=value;input.onchange=()=>{const v=Number(input.value);if(!Number.isFinite(v)){input.value=value;return;}input.value=SK.clamp(v,min,max);change(+input.value);};row.appendChild(input);body.appendChild(row);return input;}
    const inputs={};for(const [k,label] of keys){const input=number(label,settings.stats[k],0,50,1,v=>{settings.stats[k]=v;applyStats();});inputs[k]=input;const row=input.parentElement;button(row,'−',()=>{input.value=Math.max(0,+input.value-1);input.onchange();});button(row,'+',()=>{input.value=Math.min(50,+input.value+1);input.onchange();});button(row,'×2',()=>{input.value=Math.min(50,+input.value*2);input.onchange();});}
    function terrain(){let y=0;race.track.segs.forEach((s,i)=>{if(lab){s.curve=settings.curve*Math.PI/180/100*SK.SEG*SK.SEG;s.y1=y;y-=Math.tan(settings.slope*Math.PI/180)*SK.SEG;s.y2=y;s.w=settings.width;}else Object.assign(s,original[i]);});const p=race.humans[0];p.yAbs=race.track.groundY(p.z)+p.h;}
    if(lab){number('Virage continu : degrés / 100 m (− gauche, + droite)',settings.curve,-180,180,5,v=>{settings.curve=v;terrain();});number('Pente descendante (° ; négatif = montée)',settings.slope,-30,60,1,v=>{settings.slope=v;terrain();});number('Demi-largeur de piste (m)',settings.width,4,30,1,v=>{settings.width=v;terrain();});}
    function check(label,key){const row=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.checked=settings[key];i.onchange=()=>settings[key]=i.checked;row.append(i,document.createTextNode(label));body.appendChild(row);}
    check('Accélérer automatiquement','auto');check('Boucle sans arrivée','loop');
    button(body,'Pause / reprendre',pause);button(body,'Recentrer et arrêter',()=>{const p=race.humans[0];p.x=0;p.speed=0;p.h=0;p.vy=0;p.stun=0;p.state='ride';p.yAbs=race.track.groundY(p.z);});
    button(body,'Recommencer au départ',restart);button(body,'Retour à la cabane',exit);
    const output=document.createElement('output');output.id='debug-telemetry';body.appendChild(output);
    applyStats();terrain();
  };
  function applyStats(){if(!race)return;const p=race.humans[0],s=settings.stats;p.maxSpeed=SK.speedFromStat(s.speed);SK.applyHandlingStats(p,s.corner,s.acceleration);p.jumpPower=SK.jumpFromStat(s.jump);}
  D.input=inp=>settings?.auto?{...inp,up:!inp.down}:inp;
  D.tick=function(){if(!race)return;const p=race.humans[0];if(settings.loop&&p.z>race.track.L-100){p.z=2;p.x=0;p.state='ride';p.h=0;p.vy=0;p.yAbs=race.track.groundY(2);}const out=document.getElementById('debug-telemetry');if(out)out.textContent=`${(p.speed*3.6).toFixed(1)} km/h · hauteur ${p.h.toFixed(1)} m · décalage ${p.x.toFixed(1)} m`;};
  D.close=function(){controls?.remove();controls=null;race=null;SK.Input.keys={};SK.Input.pressed={};};
})(window.SK);
