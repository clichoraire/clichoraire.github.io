(async()=>{'use strict';const $=id=>document.getElementById(id),M=FamilyMember,api=(window.SITE_CONFIG?.familyApi||'').replace(/\/$/,''),F=window.FamilyHeads;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const GAMES=[{id:'snow',name:'Snow Kids',folder:'../snow-kids/'},{id:'hockey',name:'Hockey Slapshot',folder:'../hockey-boisjoli/'},{id:'ballon',name:'Ballon chasseur',folder:'../ballon-chasseur/'}];
// L'adaptateur des jeux (family-online.js) ajoute les personnages de l'atelier à SK/HK/BC et charge leurs portraits.
await F.ready;const catalog=window.FamilyCatalog||null;
const members=M.members({SK:window.SK,HK:window.HK,BC:window.BC,catalog});
const id=new URLSearchParams(location.search).get('id'),me=members.find(m=>m.id===id);
const faceUrl=m=>m.portraitUrl&&api?api+m.portraitUrl:null;
async function portraitReady(m){await F.ready;if(F.has(m.portrait))return true;const url=faceUrl(m);return url?F.add(m.portrait,url):false;}
function drawFace(m,view,size){const c=el('canvas','face-canvas');c.width=size;c.height=size;c.title=m.name;portraitReady(m).then(ok=>{if(ok)F.draw(c.getContext('2d'),m.portrait,view,size*.08,size*.08,size*.84,size*.84);else{const x=c.getContext('2d');x.font=`${size*.5}px system-ui`;x.textAlign='center';x.textBaseline='middle';x.fillText(m.gender==='girl'?'👧':'🧒',size/2,size/2);}});return c;}
if(!me){
 $('gallery').hidden=false;document.title='Les membres de la famille';
 if(id)$('status').textContent='Ce membre est introuvable. Voici tout le monde.';
 const families=[...new Map(members.map(m=>[m.familyId,m.family])).entries()];
 for(const [fid,name] of families){const card=el('div','family');card.append(el('h3',null,name));const grid=el('div','members');
  for(const m of members.filter(m=>m.familyId===fid)){const a=el('a','member');a.href='member.html?id='+encodeURIComponent(m.id);a.append(drawFace(m,'front',96),el('span',null,m.name));a.append(el('small',null,m.age!=null?m.age+' ans':m.role||''));grid.append(a);}
  card.append(grid);$('families').append(card);}
 return;
}
document.title=me.name+' · fiche de membre';$('member').hidden=false;$('member-name').textContent=me.name;$('member-family').textContent=me.family;
$('member-meta').textContent=[me.age!=null?me.age+' ans':me.ageGroup?{child:'Enfant',teen:'Ado',adult:'Adulte'}[me.ageGroup]:me.role?me.role.charAt(0).toUpperCase()+me.role.slice(1):null,me.custom?'Ajouté par l’atelier':null,'Présent dans : '+GAMES.filter(g=>me.games.includes(g.id)).map(g=>g.name).join(', ')].filter(Boolean).join(' · ');
for(const view of ['front','side','back'])$('portraits').append(drawFace(me,view,150));
$('member-select').replaceChildren(...members.map(m=>new Option(m.name+' · '+m.family,m.id)));$('member-select').value=me.id;$('member-select').onchange=()=>location.href='member.html?id='+encodeURIComponent($('member-select').value);
// Onglets : un par jeu où le membre existe.
const data={snow:me.ids.snow?M.snow(me.ids.snow,window.SK,localStorage):null,hockey:me.ids.hockey?M.hockey(me.ids.hockey,window.HK,localStorage):null,ballon:me.ids.ballon?M.ballon(me.ids.ballon,window.BC,localStorage):null};
const available=GAMES.filter(g=>data[g.id]);
if(!available.length){$('panel').append(el('p','hint','Ce membre n’est encore dans aucun jeu compatible.'));return;}
function stat(label,value,max){const row=el('div','stat');row.append(el('span','stat-label',label));const bar=el('div','bar'),fill=el('div','fill');fill.style.width=Math.max(0,Math.min(100,100*value/max))+'%';bar.append(fill);row.append(bar,el('b',null,value+(max?' / '+max:'')));return row;}
function tiles(items){const grid=el('div','tiles');for(const [label,value] of items)if(value!=null){const t=el('div','tile');t.append(el('b',null,String(value)),el('span',null,label));grid.append(t);}return grid;}
const STAT_LABELS={speed:'Vitesse',corner:'Virage',acceleration:'Accélération',jump:'Saut',strength:'Force',shot:'Tir',force:'Force',control:'Contrôle',power:'Puissance',catch:'Attrapé',hp:'Vie',precision:'Précision'};
function statsBlock(title,stats,max,training){const s=el('div','block');s.append(el('h3',null,title));for(const [k,v] of Object.entries(stats))if(STAT_LABELS[k]){const row=stat(STAT_LABELS[k],v,max);if(training?.[k])row.append(el('small','trained','+'+training[k]+' entraîné'));s.append(row);}return s;}
function render(gameId){const d=data[gameId],g=GAMES.find(g=>g.id===gameId),panel=$('panel');panel.replaceChildren();for(const b of $('tabs').children)b.setAttribute('aria-selected',b.dataset.game===gameId);
 const play=el('a','play',`Jouer à ${g.name} →`);play.href=g.folder;
 if(gameId==='snow'){
  panel.append(statsBlock('Stats dans Snow Kids',d.saved?d.stats:d.base,d.max,d.saved?d.training:null));
  if(!d.saved){panel.append(el('p','hint',`${d.name} n’a pas encore commencé d’aventure sur cet appareil.`),play);return;}
  const save=el('div','block');save.append(el('h3',null,'Aventure'+(d.active?' · profil actif':'')));
  save.append(tiles([['Niveau',d.level],['XP',`${d.xpCurrent} / ${d.xpNeeded}`],['Or',d.gold.toLocaleString('fr-CA')+' 🪙'],['Points d’entraînement',d.trainingPoints],['Temps de jeu',M.duration(d.playSeconds)],['Planche',d.board],['Planches possédées',`${d.boardsOwned} / ${d.boardsTotal}`],['Équipement',d.gear],['Garde-robe',d.wardrobe],['Leçons réussies',`${d.missionsDone} / ${d.missionsTotal}`],['Ninja',d.ninja?'débloqué':'caché']]));
  panel.append(save);
  const courses=el('div','block');courses.append(el('h3',null,`Pistes · ${d.courses.filter(c=>c.won).length} / ${d.courses.length} gagnées`));const table=el('table');
  for(const c of d.courses){const tr=el('tr',c.unlocked?'':'locked');tr.append(el('td',null,c.name),el('td',null,c.won?'🏆 gagnée':c.unlocked?'à gagner':'🔒'),el('td',null,c.best!=null?'⏱ '+M.time(c.best):''));table.append(tr);}
  courses.append(table);panel.append(courses);
  const cups=el('div','block');cups.append(el('h3',null,`Coupes · ${d.cups.filter(c=>c.won).length} / ${d.cups.length} gagnées`));const list=el('div','chips');for(const c of d.cups)list.append(el('span',c.won?'chip won':'chip',(c.won?'🏆 ':'')+c.name+(c.bestRank&&!c.won?' · '+c.bestRank+'e':'')));cups.append(list);panel.append(cups,play);
 }else if(gameId==='hockey'){
  panel.append(statsBlock('Stats au hockey',d.stats,d.max));
  const b=el('div','block');b.append(el('h3',null,'Équipe'));b.append(tiles([['Équipe',d.team],['Rôle',d.goalie?'gardien':d.role],['Pouvoir',d.power?d.power.icon+' '+d.power.name:null]]));if(d.power)b.append(el('p','hint',d.power.desc));panel.append(b);
  panel.append(el('p','hint',`Le hockey ne garde pas encore de progression par joueur. Étoiles d’entraînement sur cet appareil : ${d.drillStars}${d.drillTotal?' / '+d.drillTotal:''}.`),play);
 }else{
  panel.append(statsBlock('Stats de base au ballon chasseur',d.stats,d.max));
  const b=el('div','block');b.append(el('h3',null,'Équipe'));b.append(tiles([['Équipe',d.team],['Rôle',d.role],['Pouvoir',d.power?d.power.icon+' '+d.power.name:null],['Coupe des familles',d.cupWon?'gagnée le '+new Date(d.cupWon).toLocaleDateString('fr-CA'):null]]));if(d.power)b.append(el('p','hint',d.power.desc));panel.append(b);
  if(d.adventure){const a=d.adventure,adv=el('div','block');adv.append(el('h3',null,`Aventure de ${d.name}`));adv.append(tiles([['Niveau',a.level],['XP',`${a.xp} / ${a.next}`],['Points à placer',a.points],['Matchs joués',a.matches],['Victoires',a.wins],['Défaites',a.losses],['Boss battus',a.bosses],['KO',a.kos],['Commencée le',a.created?new Date(a.created).toLocaleDateString('fr-CA'):null]]));adv.append(statsBlock('Stats entraînées',a.stats,d.max));adv.append(el('p','hint','Équipe : '+a.team.join(', ')));panel.append(adv);}
  for(const o of d.others){const x=el('div','block');x.append(el('h3',null,`Dans l’aventure de ${o.leader}`));x.append(tiles([['Niveau',o.level],['XP',`${o.xp} / ${o.next}`],['Points à placer',o.points],['Matchs',o.matches],['KO',o.kos]]));panel.append(x);}
  if(d.equipment||d.shopGold!=null){const e=el('div','block');e.append(el('h3',null,'Boutique et équipement'));e.append(tiles([['Or de la boutique (commun)',d.shopGold!=null?d.shopGold.toLocaleString('fr-CA')+' 🪙':null],['Objets possédés',d.equipment?.owned],['Objets équipés',d.equipment?.equipped],['Vies en plus',d.equipment?.life]]));panel.append(e);}
  if(!d.saved)panel.append(el('p','hint',`${d.name} n’a pas encore d’aventure ni d’équipement sur cet appareil.`));
  panel.append(play);
 }}
for(const g of available){const b=el('button','tab',g.name);b.type='button';b.dataset.game=g.id;b.setAttribute('role','tab');b.onclick=()=>{render(g.id);history.replaceState(null,'','member.html?id='+encodeURIComponent(me.id)+'&jeu='+g.id);};$('tabs').append(b);}
const wanted=new URLSearchParams(location.search).get('jeu');render(available.some(g=>g.id===wanted)?wanted:available[0].id);
})();
