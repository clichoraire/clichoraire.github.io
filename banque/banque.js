// La Banque : on choisit un personnage, on ouvre la porte du coffre, et on découvre tout l'or gagné dans les jeux.
// L'or vient des sauvegardes des jeux dans ce navigateur (même origine) : Snow Kids (par personnage), la boutique
// du Ballon chasseur (commune à toute la famille) et Canon Big Boom (par personnage, cb.save). Le dernier montant vu est gardé pour montrer ce qui s'est ajouté.
(async()=>{'use strict';
 const $=id=>document.getElementById(id),M=FamilyMember,F=window.FamilyHeads,api=(window.SITE_CONFIG?.familyApi||'').replace(/\/$/,'');
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
 const fmt=n=>Math.floor(n).toLocaleString('fr-CA');
 const coinIco=()=>{const i=el('i','c');i.setAttribute('aria-label','pièces');return i;};
 const gold=(cls,n)=>{const e=el(cls==='b'?'b':'small',cls==='b'?null:cls);e.append(fmt(n)+' ',coinIco());return e;};
 const MAX=Chambre.MAX;
 const parse=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){return null;}};
 const remember=(key,value)=>{try{localStorage.setItem(key,String(value));}catch(e){}};

 await F.ready;const catalog=window.FamilyCatalog||null;
 const members=M.members({SK:window.SK,HK:window.HK,BC:window.BC,catalog});
 const canonGold=id=>{const s=parse('cb.save');const g=s?.profiles?.[id]?.gold;return Number.isFinite(g)?Math.max(0,Math.floor(g)):null;};
 const shopGold=()=>{const e=parse('bc.equipment');return e&&Number.isFinite(e.gold)?Math.max(0,Math.floor(e.gold)):0;};
 // Les sources d'or d'un membre. Chaque entrée : {game, label, gold, common}.
 function sourcesOf(m){
  const out=[];
  if(m.ids.snow){const d=M.snow(m.ids.snow,window.SK,localStorage);out.push({game:'snow',label:'Snow Kids',gold:d?.saved?d.gold:0,saved:!!d?.saved});}
  if(m.ids.ballon||m.ids.snow)out.push({game:'ballon',label:'Boutique du Ballon chasseur',gold:shopGold(),common:true,saved:true});
  if(m.ids.ballon){const g=canonGold(m.ids.ballon);out.push({game:'canon',label:'Canon Big Boom',gold:g||0,saved:g!=null});}
  return out;
 }
 function familySources(){
  let snow=0,count=0;for(const m of members)if(m.ids.snow){const d=M.snow(m.ids.snow,window.SK,localStorage);if(d?.saved){snow+=d.gold;count++;}}
  let canon=0,canons=0;for(const m of members)if(m.ids.ballon){const g=canonGold(m.ids.ballon);if(g!=null){canon+=g;canons++;}}
  return [{game:'snow',label:`Snow Kids · ${count} aventure${count>1?'s':''}`,gold:snow,saved:count>0},{game:'ballon',label:'Boutique du Ballon chasseur',gold:shopGold(),common:true,saved:true},{game:'canon',label:`Canon Big Boom · ${canons} canon${canons>1?'s':''}`,gold:canon,saved:canons>0}];
 }
 const sum=list=>list.reduce((a,s)=>a+(s.gold||0),0);
 const FAMILY={id:'famille',name:'Toute la famille',family:'Le grand coffre commun',portrait:null,gender:null};

 const faceUrl=m=>m.portraitUrl&&api?api+m.portraitUrl:null;
 async function portraitReady(m){if(!m.portrait)return false;await F.ready;if(F.has(m.portrait))return true;const url=faceUrl(m);return url?F.add(m.portrait,url):false;}
 function drawFace(m,canvas,size){const c=canvas||el('canvas');c.width=size;c.height=size;c.title=m.name;const x=c.getContext('2d');x.clearRect(0,0,size,size);
  portraitReady(m).then(ok=>{if(ok)F.draw(x,m.portrait,'front',size*.1,size*.08,size*.8,size*.86);else{x.font=`${size*.52}px system-ui`;x.textAlign='center';x.textBaseline='middle';x.fillText(m.id==='famille'?'👨‍👩‍👧‍👦':m.gender==='girl'?'👧':'🧒',size/2,size/2+size*.02);}});return c;}

 // ---------- écran 1 : la galerie
 const chambre=Chambre.create($('chambre'));
 function gallery(){
  const wrap=$('familles');wrap.replaceChildren();$('statut').textContent='';
  const famCard=el('div','famille');famCard.append(el('h3',null,'Le coffre commun'));
  const tous=el('button','membre tous');tous.type='button';const totalFam=sum(familySources());
  tous.append(drawFace(FAMILY,null,96),el('span','big','TOUTE LA FAMILLE'),gold('or',totalFam));tous.onclick=()=>choose(FAMILY);
  famCard.append(tous);wrap.append(famCard);
  const families=[...new Map(members.map(m=>[m.familyId,m.family])).entries()];
  for(const [fid,name] of families){const card=el('div','famille');card.append(el('h3',null,name));const grid=el('div','membres');
   for(const m of members.filter(m=>m.familyId===fid)){const b=el('button','membre');b.type='button';const total=sum(sourcesOf(m));
    b.append(drawFace(m,null,96),el('span',null,m.name),gold('or',total));b.onclick=()=>choose(m);grid.append(b);}
   card.append(grid);wrap.append(card);}
 }

 // ---------- écran 2 : la porte, puis la chambre forte
 let current=null,timers=[];
 const clear=()=>{for(const t of timers)clearTimeout(t);timers=[];};
 const numero=id=>{let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))>>>0;return String(100+h%900);};
 function layoutBolts(){const box=$('bolts');box.replaceChildren();const r=$('door').getBoundingClientRect();const w=r.width,h=r.height,m=Math.min(w,h)*.085,s=Math.min(w,h)*.095;
  const pts=[];const nx=Math.max(3,Math.round((w-2*m)/(s*2.2))),ny=Math.max(2,Math.round((h-2*m)/(s*2.2)));
  for(let i=0;i<=nx;i++){pts.push([m+(w-2*m)*i/nx,m]);pts.push([m+(w-2*m)*i/nx,h-m]);}
  for(let j=1;j<ny;j++){pts.push([m,m+(h-2*m)*j/ny]);pts.push([w-m,m+(h-2*m)*j/ny]);}
  for(const [x,y] of pts){const b=el('div','bolt');b.style.left=(x-s/2)+'px';b.style.top=(y-s/2)+'px';b.style.width=b.style.height=s+'px';box.append(b);}}
 function choose(m){
  clear();current=m;const sources=m.id==='famille'?familySources():sourcesOf(m);const total=Math.min(MAX,sum(sources));
  const seen=parse('banque.vu.'+m.id);const previous=Number.isFinite(seen)?Math.max(0,Math.floor(seen)):null;
  $('choix').hidden=true;$('coffre').hidden=false;document.title=`Coffre de ${m.name} · La Banque`;
  $('who-name').textContent=m.name;$('who-family').textContent=m.family;$('numero').textContent=numero(m.id);drawFace(m,$('who-face'),72);
  const door=$('door');door.style.transition='none';door.classList.remove('open','unlocked');$('wheel').classList.remove('spin');void door.offsetWidth;door.style.transition='';
  $('hud').hidden=true;$('ouvrir').hidden=false;$('btn-ouvrir').disabled=false;$('delta').textContent='';$('montant').textContent=fmt(previous!=null?Math.min(previous,total):0);
  $('jauge-fill').style.width='0%';$('jauge-text').textContent='0 %';document.querySelector('.plaque')?.remove();
  layoutBolts();chambre.set(total,m.id,previous);
  $('sources').replaceChildren(...sources.map(s=>{const c=el('span','source'+(s.gold?'':' vide'));c.append(el('span',null,s.game==='snow'?'🏂':s.game==='canon'?'💥':'🏐'),el('span',null,s.label+(s.common?' (commune)':'')),gold('b',s.gold));return c;}),
   ...(sum(sources)>MAX?[(()=>{const c=el('span','source');c.append('Plafond de la banque : ',gold('b',MAX));return c;})()]:[]));
  history.replaceState(null,'','?id='+encodeURIComponent(m.id));
  $('btn-ouvrir').onclick=()=>open(total,previous);
 }
 function open(total,previous){
  const btn=$('btn-ouvrir');btn.disabled=true;btn.textContent='La roue tourne…';$('wheel').classList.add('spin');
  timers.push(setTimeout(()=>{$('door').classList.add('unlocked');btn.textContent='Clac !';},2100));
  timers.push(setTimeout(()=>{$('door').classList.add('open');$('ouvrir').hidden=true;},2900));
  timers.push(setTimeout(()=>{
   $('hud').hidden=false;chambre.reveal();
   const from=previous!=null?Math.min(previous,total):0,start=performance.now(),dur=2400;
   const tick=now=>{const u=Math.min(1,(now-start)/dur),v=from+(total-from)*(1-Math.pow(1-u,3));$('montant').textContent=fmt(v);if(u<1)requestAnimationFrame(tick);else $('montant').textContent=fmt(total);};
   requestAnimationFrame(tick);
   const pct=Math.min(100,100*total/MAX);$('jauge-fill').style.width=pct+'%';$('jauge-text').textContent=(pct>=100?'1 000 000 atteint !':pct<1&&total>0?'moins de 1 % du million':Math.floor(pct)+' % du million');
   if(previous!=null&&total>previous)$('delta').replaceChildren('+'+fmt(total-previous)+' ',coinIco(),' depuis ta dernière visite');
   else if(previous!=null&&total<previous)$('delta').replaceChildren('−'+fmt(previous-total)+' ',coinIco(),' dépensés depuis ta dernière visite');
   if(total<=0){const p=el('div','plaque','COFFRE VIDE');p.append(el('small',null,'Va gagner des pièces dans Snow Kids ou au Ballon chasseur, puis reviens !'));$('scene').append(p);}
   else if(total>=MAX){const p=el('div','plaque','UN MILLION !');p.append(el('small',null,'Le coffre est plein jusqu\'au plafond. Bravo !'));$('scene').append(p);}
   remember('banque.vu.'+current.id,total);
  },3900));
 }
 $('changer').onclick=()=>{clear();chambre.stop();$('coffre').hidden=true;$('choix').hidden=false;document.title='La Banque · Les jeux de Matthieu';history.replaceState(null,'','./');gallery();};
 window.addEventListener('resize',()=>{if(!$('coffre').hidden)layoutBolts();});

 gallery();
 const wanted=new URLSearchParams(location.search).get('id');
 if(wanted==='famille')choose(FAMILY);else{const m=members.find(m=>m.id===wanted);if(m)choose(m);}
})().catch(e=>{document.getElementById('statut').textContent='Impossible de charger les personnages : '+e.message;console.error(e);});
