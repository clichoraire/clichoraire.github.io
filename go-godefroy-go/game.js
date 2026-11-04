'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d');
let storageOK=true,storage;
try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Storage unavailable');}};storageOK=false;}
let audioVolumes={music:.55,effects:.8};try{const saved=JSON.parse(storage.getItem('go-godefroy-go.audio')||'null');for(const key of ['music','effects'])if(typeof saved?.[key]==='number'&&Number.isFinite(saved[key]))audioVolumes[key]=Math.max(0,Math.min(1,saved[key]));}catch{}
const library=GGProfiles.read(storage,GG.sanitize);
let activeSlot=null,save=GG.fresh(),testMode=false,testReturnSlot=null;
let state='title',tab='launch',flight=null,paused=false,launchTime=0,last=0,clock=0,keys={},sound=true,audio=null,soundEngine=null;
let inspectionRate=1,inspectionPaused=false,inspectionZoom=1,cameraZoomManual=false;
const inspectionHistory=new GGRewind();
let earningsAnimation=null,frameId=0,background=false;
let accumulator=0,landingTime=0,cameraX=0,cameraY=0,launchDuration=2,stageBannerTime=0;
const hero=new Image();hero.src='assets/godefroy.png';
function persist(){if(testMode){$('saving').textContent='MODE TEST · aucune progression enregistrée';return;}if(activeSlot)activeSlot.save=save;storageOK=GGProfiles.write(storage,library);$('saving').textContent=storageOK?'Partie sauvegardée automatiquement':'Stockage indisponible : partie conservée pour cette session';}
function updateTitle(){const current=library.slots.find(s=>s.id===library.active);$('continue-game').hidden=!current;$('choose-game').hidden=library.slots.length===0;$('continue-game').textContent=current?'CONTINUER · JOUR '+current.save.day+' ▶':'CONTINUER ▶';$('title-status').textContent=current?current.name+' · '+current.save.record.toLocaleString('fr')+' m de record':'Un casque, une rampe, un dragon. À vous de jouer.';}
function toTitle(){if(testMode){GGCourse.setTestRamp();testRampHeight=0;testRampLength=0;refreshTestRamp();testMode=false;activeSlot=testReturnSlot;save=activeSlot?.save??GG.fresh();$('test-controls').hidden=true;}earningsAnimation=null;audioPanel(false);soundEngine?.silence();keys={};paused=false;state='title';flight=null;document.body.className='at-title';$('play-shell').hidden=true;$('profile-screen').hidden=true;$('title-screen').hidden=false;updateTitle();}
function enter(slot){GGCourse.setTestRamp();testRampHeight=0;testRampLength=0;refreshTestRamp();testMode=false;inspectionRate=1;$('test-controls').hidden=true;forgeSelections={};activeSlot=slot;library.active=slot.id;save=slot.save;$('profile-label').textContent=slot.name;$('title-screen').hidden=true;$('profile-screen').hidden=true;$('play-shell').hidden=false;document.body.className='';ready();showTab('launch');persist();canvas.focus();}
function profileScreen(create){$('title-screen').hidden=true;$('profile-screen').hidden=false;$('profile-form').hidden=!create;$('profile-list').hidden=create;$('delete-all-saves').hidden=create||library.slots.length===0;$('profile-heading').textContent=create?'Créer une partie':'Reprendre une aventure';$('profile-error').textContent='';$('profile-list').replaceChildren();for(const slot of library.slots){const button=document.createElement('button');button.className='save-slot';const label=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=slot.name;detail.textContent='Jour '+slot.save.day+' · '+slot.save.record.toLocaleString('fr')+' m · '+slot.save.gold+' écus';label.append(name,detail);button.append(label,document.createTextNode('▶'));button.onclick=()=>enter(slot);const row=document.createElement('div');row.className='save-row';
const trash=document.createElement('button');trash.className='delete-save';trash.setAttribute('aria-label','Supprimer '+slot.name);trash.title='Supprimer cette partie';trash.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg>';trash.onclick=()=>confirmSaveDeletion(slot);row.append(button,trash);$('profile-list').append(row);}if(create){$('profile-name').value='';$('profile-name').focus();}}
let deletionTarget=null;
function confirmSaveDeletion(slot){
 deletionTarget=slot?.id??null;
 $('delete-save-message').textContent=slot?'Supprimer « '+slot.name+' » et toute sa progression ? Cette action est définitive.':'Supprimer toutes les parties et leur progression ? Cette action est définitive.';
 $('delete-save-dialog').showModal();$('cancel-delete-save').focus();
}
$('delete-all-saves').onclick=()=>confirmSaveDeletion(null);
$('cancel-delete-save').onclick=()=>$('delete-save-dialog').close();
$('confirm-delete-save').onclick=()=>{
 if(!GGProfiles.remove(storage,library,deletionTarget)){$('delete-save-dialog').close();$('profile-error').textContent='Suppression impossible : le stockage est indisponible. Vos parties sont conservées.';return;}
 if(activeSlot&&!library.slots.some(s=>s.id===activeSlot.id)){activeSlot=null;save=GG.fresh();}
 $('delete-save-dialog').close();profileScreen(false);updateTitle();
 $('profile-error').textContent=library.slots.length?'Partie supprimée.':'Toutes les parties ont été supprimées. Revenez au menu pour créer une nouvelle aventure.';
};
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('title-status').textContent='Le jeu remplit déjà la fenêtre. Utilisez le plein écran de votre navigateur.';}catch{$('title-status').textContent='Le jeu remplit la fenêtre. Le navigateur ne permet pas le plein écran ici.';}}
$('title-fullscreen').onclick=$('fullscreen').onclick=fullscreen;
document.addEventListener('fullscreenchange',()=>{$('title-fullscreen').textContent=document.fullscreenElement?'⛶ QUITTER LE PLEIN ÉCRAN':'⛶ PLEIN ÉCRAN';$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Quitter le plein écran':'Plein écran');});
$('new-game').onclick=()=>profileScreen(true);$('choose-game').onclick=()=>profileScreen(false);$('profile-back').onclick=toTitle;
$('continue-game').onclick=()=>{const slot=library.slots.find(s=>s.id===library.active);if(slot)enter(slot);};
$('profile-form').onsubmit=e=>{e.preventDefault();const name=$('profile-name').value.trim();if(!name){$('profile-error').textContent='Donnez un nom à votre aventure.';return;}const slot=GGProfiles.create(library,name,GG.fresh);if(!slot){$('profile-error').textContent='Les 12 emplacements sont occupés. Vous pouvez reprendre une partie existante.';return;}enter(slot);};
$('menu-button').onclick=()=>{if(['flight','launching','landing'].includes(state)){if(!paused)togglePause();return;}persist();toTitle();};
$('pause-menu').onclick=()=>{if(!testMode&&flight&&!flight.settled){flight.ended=true;GG.settle(save,flight);}persist();toTitle();};
canvas.tabIndex=0;
function enableAudio(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();soundEngine??=GGSound.create(audio);audio.resume().catch(()=>{});soundEngine.setEnabled(sound);soundEngine.setVolumes(audioVolumes);return true;}catch{return false;}}
function tone(freq=220,duration=.1,type='square'){if(!sound||!enableAudio())return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.5,audio.currentTime+duration);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(soundEngine.output);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(audio.currentTime+duration);}
function boingSound(grade){if(!sound||!enableAudio())return;const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type='sine';o.frequency.setValueAtTime(grade==='perfect'?300:230,now);o.frequency.exponentialRampToValueAtTime(95,now+.08);o.frequency.exponentialRampToValueAtTime(380,now+.18);o.frequency.exponentialRampToValueAtTime(110,now+.44);g.gain.setValueAtTime(.065,now);g.gain.exponentialRampToValueAtTime(.001,now+.46);o.connect(g);g.connect(soundEngine.output);o.onended=()=>{o.disconnect();g.disconnect();};o.start(now);o.stop(now+.47);}

function crashSound(){if(sound&&soundEngine&&!soundEngine.sample('crash',.64)&&flight?.endReason==='ground')soundEngine.ground(flight.impactSpeed);}
const forgeCategories=[{id:'upgrades',title:'Améliorations',icon:'★'},...GG.categories.filter(c=>['launch','wing','boost'].includes(c.id)).map(c=>({...c,title:c.id==='launch'?'La glisse':c.id==='wing'?'Dans les airs':'Magie'}))];
let forgeCategory='upgrades',forgeSelections={},selectedUpgrade='rampLength';
const upgradeFlavor={specialItems:['Un ciel plein de surprises !','Plus de trampolines, fleurs, ballons et rencontres magiques. Chaque niveau les rend plus fréquents et plus puissants !','★'],rampLength:['Plus loin !','Une longue piste pour prendre son élan.','↔'],rampHeight:['Plus haut !','Grimpez la rampe, dévalez à toute allure !','↟'],friction:['Ça glisse !','Une armure bien lisse fend mieux l’air.','◒'],wallForce:['Casse-muraille','Faites trembler les remparts !','✦'],ricochet:['Encore un rebond !','Le sol n’a pas dit son dernier mot.','⌁'],rebound:['Boïng !','Rebondissez plus haut en gardant votre élan.','↗'],goldBonus:['À nous le trésor !','Plus de pièces après chaque aventure.','●'],boostPower:['Plein gaz !','Un booster qui pousse encore plus fort.','♨'],lightness:['Poids plume','Moins de gravité, plus de liberté !','♧'],fuelCapacity:['Le plein, svp !','Une réserve plus grande pour prolonger le boost.','▣']};
function upgradeIcon(id){const art={specialItems:'<path d="M50 12L61 36 87 40 68 59 73 85 50 72 27 85 32 59 13 40 39 36Z" fill="#ffd952"/><path d="M8 14L17 21M83 15L77 24"/>',rampLength:'<path d="M16 71H83M19 60L75 32 84 56" fill="#ce8e42"/><path d="M25 79H76M25 79L32 73M25 79L32 85M76 79L69 73M76 79L69 85"/>',rampHeight:'<path d="M20 76L70 21 82 76Z" fill="#d3974a"/><path d="M20 83H83M69 34V64M69 34L62 42M69 34L76 42"/>',friction:'<path d="M32 28Q18 50 30 70L67 80Q87 52 67 28Z" fill="#b7c8df"/><path d="M54 17L59 30 73 35 59 40 54 53 49 40 35 35 49 30Z" fill="#fff39a"/>',wallForce:'<path d="M19 23H81V77H19Z" fill="#bc8c69"/><path d="M19 41H81M19 59H81M40 23V41M61 41V59M40 59V77M58 18L43 44 60 47 46 83" fill="none"/>',ricochet:'<path d="M12 78H88M18 65Q29 16 43 64Q57 35 69 66Q80 52 85 67" fill="none"/><circle cx="29" cy="34" r="10" fill="#f2c544"/>',rebound:'<path d="M23 74L70 62 27 53 70 41 27 31 70 20" fill="none" stroke="#d9e4ee" stroke-width="10"/><path d="M19 81H80"/>',goldBonus:'<ellipse cx="49" cy="72" rx="29" ry="10" fill="#e2a333"/><ellipse cx="49" cy="61" rx="29" ry="10" fill="#f9d961"/><circle cx="52" cy="38" r="24" fill="#ffce38"/><path d="M52 24V52M60 29Q39 22 44 37L60 41Q63 55 42 47" fill="none"/>',boostPower:'<path d="M38 61L28 87 51 76 65 88 67 62" fill="#ff8c28"/><path d="M31 62L30 28Q50 4 69 28L70 62Z" fill="#e44d42"/><path d="M31 53H70"/><circle cx="50" cy="34" r="10" fill="#84d9ea"/>',lightness:'<path d="M22 80Q25 13 79 18Q79 61 22 80Z" fill="#e9f6ff"/><path d="M21 83L66 32M40 62L38 40M52 48L69 48" fill="none"/>',fuelCapacity:'<path d="M37 15H62V28L74 38V78Q50 90 25 78V38L37 28Z" fill="#8bdd70"/><path d="M37 15V27H62V15ZM25 48H74" fill="#e8b85e"/><path d="M48 53L39 65H51L46 77 62 61H51L56 53Z" fill="#fff6a4"/>'};return `<svg class="upgrade-art" viewBox="0 0 100 100" aria-hidden="true"><g stroke="#493c33" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${art[id]}</g></svg>`;}
function canAffordGear(id,n){const c=GG.categories.find(c=>c.id===id);return n>0&&!GG.hasItem(save,id,n)&&(id==='launch'||id==='wing'?GG.itemUnlocked(save,id,n):n===GG.owned(save,id)+1)&&save.gold>=GG.price(c,n-1);}
function affordableFamily(id,f){for(let n=f.start;n<=f.end;n++)if(canAffordGear(id,n))return true;return false;}
function affordableCategory(id){if(id==='boost'&&!save.bomb&&GG.bombs.some(b=>save.gold>=b.price))return true;return id==='upgrades'?GG.statUpgrades.some(c=>GG.statLevel(save,c.id)<10&&save.gold>=GG.statPrice(save,c.id)):gearFamilies(id).some(f=>affordableFamily(id,f));}
function forgeTabs(){return `<div class="forge-tabs" role="tablist" aria-label="Rayons de la forge">${forgeCategories.map(c=>`<button role="tab" id="forge-tab-${c.id}" aria-controls="forge-panel" aria-selected="${forgeCategory===c.id}" tabindex="${forgeCategory===c.id?0:-1}" data-category="${c.id}"><span>${c.icon}</span>${c.title}${affordableCategory(c.id)?'<i class="afford-dot" aria-label="Achat disponible"></i>':''}</button>`).join('')}</div>`;}
function statCards(){const c=GG.statUpgrades.find(c=>c.id===selectedUpgrade),level=GG.statLevel(save,c.id),cost=GG.statPrice(save,c.id),flavor=upgradeFlavor[c.id],format=n=>c.value(n).toLocaleString('fr',{maximumFractionDigits:1});return `<section class="forge-panel upgrade-gallery" id="forge-panel" role="tabpanel" aria-labelledby="forge-tab-upgrades"><div class="upgrade-collection"><header><span class="tag">LE COIN DES BONNES IDÉES</span><h2>Un peu plus légendaire.</h2><p>Choisis une carte. Fais grandir ton chevalier !</p></header><div class="upgrade-deck">${GG.statUpgrades.map(a=>{const n=GG.statLevel(save,a.id);return `<button data-upgrade-select="${a.id}" class="collectible ${a.id===c.id?'chosen':''} ${n<10&&save.gold>=GG.statPrice(save,a.id)?'can-afford':''}" aria-pressed="${a.id===c.id}" aria-label="${a.title}, niveau ${n} sur 10">${n<10&&save.gold>=GG.statPrice(save,a.id)?'<span class="afford-badge">À TA PORTÉE !</span>':''}${upgradeIcon(a.id)}<strong>${upgradeFlavor[a.id][0]}</strong><span class="tiny-progress"><i style="width:${n*10}%"></i></span><small>${n} / 10</small></button>`;}).join('')}</div></div><article class="upgrade-detail"><div class="hero-collectible">${upgradeIcon(c.id)}<h2>${flavor[0]}</h2></div><h3>${c.title}</h3><p>${flavor[1]}</p><div class="upgrade-benefit"><b>${format(level)} ${c.unit}</b>${level<10?`<span>➜</span><strong>${format(level+1)} ${c.unit}</strong>`:''}</div><div class="ten-levels" aria-label="Niveau ${level} sur 10">${Array.from({length:10},(_,i)=>`<span class="${i<level?'filled':''}">${i+1}</span>`).join('')}</div><button class="buy-happy" data-stat-buy="${c.id}" ${level===10||save.gold<cost?'disabled':''}>${level===10?'★ AU MAXIMUM !':`<span class="gold-coin"></span> ${cost.toLocaleString('fr')} ÉCUS <small>+ AMÉLIORER · NIVEAU ${level+1}</small>`}</button>${level<10&&save.gold<cost?`<small class="missing-gold">Encore ${(cost-save.gold).toLocaleString('fr')} pièces pour cette amélioration.</small>`:''}</article></section>`;}
function equipmentPicture(id,n){if(id==='wing')return n===0?'<span class="empty-equipment">Ta fidèle cape<small>TOUJOURS AVEC TOI</small></span>':`<canvas class="launch-illustration" width="240" height="180" data-wing-picture="${n}" role="img" aria-label="${GGWings.get(n).name}"></canvas>`;return id==='launch'?`<canvas class="launch-illustration" width="240" height="160" data-rider-object="${n}" role="img" aria-label="${GGLaunch.get(n).name}"></canvas>`:`<img src="assets/equipment/${id}-${n}.svg" alt="${GG.itemName(GG.categories.find(c=>c.id===id),n)}">`;}
function gearFamilies(id){if(id==='wing')return [{name:'Ma cape',start:0,end:0},...GGWings.families];if(id==='launch'){const groups=[];for(const item of GGLaunch.items){let group=groups.find(g=>g.name===item.group);if(!group){group={name:item.group,start:item.id,end:item.id};groups.push(group);}group.end=item.id;}return groups;}return [{name:'Les petites potions qui poussent fort',start:0,end:GG.maxLevel(id)}];}
function funBars(id,current,selected){const values=n=>id==='launch'?[GGLaunch.get(n).speed,GGCourse.rampGeometry(n).end-GGCourse.rampGeometry(n).start,485-GGCourse.rampGeometry(n).top]:id==='wing'?[GG.parameters({...save.levels,wing:n}).wingLift,GG.parameters({...save.levels,wing:n}).turnRate,GG.parameters({...save.levels,wing:n}).liftCap]:[GG.parameters({...save.levels,boost:n}).thrust,GG.parameters({...save.levels,boost:n}).fuel];const labels=id==='launch'?['⚡ Plus vite','↗ Plus d’élan','⚑ Plus loin']:id==='wing'?['☁ Mieux planer','↪ Mieux tourner','↟ Plus de portance']:['⚡ Ça pousse !','▣ Ça dure !'];const a=values(current),b=values(selected),max=values(GG.maxLevel(id));return `<div class="fun-bars">${b.map((v,i)=>{const delta=Math.round((v/a[i]-1)*100);return `<div class="fun-stat"><b>${labels[i]}</b><span class="bar-compare"><i style="--fill:${Math.max(8,a[i]/max[i]*100)}%"></i><strong>${delta>0?'↑':delta<0?'↓':'='}</strong><i class="new" style="--fill:${Math.max(8,v/max[i]*100)}%"></i><em>${delta>0?'+':''}${delta}%</em></span></div>`;}).join('')}</div>`;}
function magicShop(){
 const witch='<svg viewBox="0 0 100 100" width="76" height="76" aria-hidden="true"><path fill="#452754" stroke="#281c30" stroke-width="4" d="M20 48 46 8l12 22 10-4 10 24 12 6q-40 16-82-2z"/><path fill="#a473c1" d="m22 45 54 2 3 7-62-1z"/><path fill="#293039" d="M21 61h59l9 32H12z"/><path fill="#ffd5a5" stroke="#453047" stroke-width="3" d="M31 60q18 6 40 0v16l8 5-9 3q-20 23-38 0z"/><circle cx="44" cy="72" r="3"/><circle cx="61" cy="72" r="3"/><path d="M45 85q7 6 14 0" fill="none" stroke="#613849" stroke-width="3"/></svg>';
 const armed=GG.bombs.find(b=>b.id===save.bomb);
 return `<section class="magic-shop"><header>${witch}<div><h2>La sorcière des remparts</h2><p>Boosters magiques et bombes à mèche</p></div></header><p>${armed?armed.name+' équipée.':'Une bombe à la fois. Elle s’allume quand un mur arrête Godefroy.'}</p><div class="magic-bombs">${GG.bombs.map(b=>`<button data-bomb="${b.id}" style="--bomb-color:${b.color}" ${armed||save.gold<b.price?'disabled':''}><i aria-hidden="true"></i><strong>${b.name}</strong><small>Jusqu’à ${b.count} briques</small><span>${armed?.id===b.id?'✓ ÉQUIPÉE':b.price.toLocaleString('fr')+' ÉCUS'}</span></button>`).join('')}</div></section>`;
}
function renderForge(){
 $('upgrades').innerHTML=forgeTabs()+(forgeCategory==='boost'?magicShop():'');
 if(forgeCategory==='upgrades'){$('upgrades').insertAdjacentHTML('beforeend',statCards());return;}
 const c=GG.categories.find(c=>c.id===forgeCategory),equipped=save.levels[c.id],owned=GG.owned(save,c.id),limit=GG.maxLevel(c.id),ceiling=Math.max(...gearFamilies(c.id).filter(f=>GG.familyUnlocked(save,c.id,f.start)).map(f=>f.end)),selected=Math.min(ceiling,forgeSelections[c.id]??Math.min(limit,owned+1));forgeSelections[c.id]=selected;
 const bought=GG.hasItem(save,c.id,selected),next=['launch','wing'].includes(c.id)?GG.itemUnlocked(save,c.id,selected):selected===owned+1,price=GG.price(c,selected-1),families=gearFamilies(c.id),family=families.find(f=>selected>=f.start&&selected<=f.end),picture=n=>equipmentPicture(c.id,n);
 const arrow=d=>`<svg viewBox="0 0 48 48" aria-hidden="true" ${d<0?'style="transform:scaleX(-1)"':''}><path d="M8 24H39M26 10L40 24 26 38" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 $('upgrades').insertAdjacentHTML('beforeend',`<div class="family-shelf" aria-label="Familles d’équipements">${families.map((f,i)=>!GG.familyUnlocked(save,c.id,f.start)?`<button class="mystery-family" disabled aria-label="Famille verrouillée"><span aria-hidden="true">🔒</span>???</button>`:`<button data-family="${f.start}" class="${f===family?'active':''} ${affordableFamily(c.id,f)?'can-afford':''}" aria-pressed="${f===family}"><span>${c.id==='wing'&&f.start?GGWings.families[Math.floor((f.start-1)/5)].icon:c.id==='launch'?['🛡','🧼','🛹','🛼','🛷','✨'][i]:'✷'}</span>${f.name}${affordableFamily(c.id,f)?'<i class="afford-dot" aria-label="Achat disponible"></i>':''}<small>${Array.from({length:f.end-f.start+1},(_,i)=>f.start+i).filter(n=>GG.hasItem(save,c.id,n)).length} / ${f.end-f.start+1}</small></button>`).join('')}</div><section class="forge-panel happy-gear" id="forge-panel" role="tabpanel" aria-labelledby="forge-tab-${c.id}"><div class="forge-feature"><div class="gear-visual"><header><span class="tag">${family.name} · ${selected-family.start+1} / ${family.end-family.start+1}</span><h2>${GG.itemName(c,selected)}</h2><p>${c.id==='wing'&&selected?GGWings.families[GGWings.get(selected).family].description:c.id==='launch'?(GGLaunch.get(selected).standing?'Accroche-toi… et saute !':'À plat ventre, accroche ton casque !'):c.desc}</p></header><figure>${picture(selected)}<figcaption>${selected===equipped?'✓ TON ÉQUIPEMENT':bought?'DANS TA COLLECTION':next?'LE PROCHAIN GRAND SAUT':'À DÉBLOQUER'}</figcaption></figure></div><div class="forge-details">${funBars(c.id,equipped,selected)}<div class="forge-purchase">${['launch','wing'].includes(c.id)?`<button data-trial-kind="${c.id}" data-trial-level="${selected}" class="try-happy">▶ ESSAYER !</button>`:''}${bought?`<button class="buy-happy" data-equip="${c.id}" data-level="${selected}" ${selected===equipped?'disabled':''}>${selected===equipped?'✓ ÉQUIPÉ':'ÉQUIPER · GRATUIT'}</button>`:`<button class="buy-happy" data-buy="${c.id}" data-level="${selected}" ${!next||save.gold<price?'disabled':''}><span class="gold-coin"></span> ${price.toLocaleString('fr')} ÉCUS<small>ACHETER & ÉQUIPER</small></button><small>${!next?'Collectionne d’abord les évolutions précédentes.':save.gold<price?'Encore '+(price-save.gold).toLocaleString('fr')+' pièces !':'À toi pour toujours !'}</small>`}</div></div></div><div class="evolution-heading"><b>${c.id==='wing'?'LES CINQ STYLES':'LES ÉVOLUTIONS'}</b><span>${family.name}</span></div><div class="evolution-carousel"><button class="evolution-arrow" data-step="-1" aria-label="Évolution précédente" ${selected===0?'disabled':''}>${arrow(-1)}</button><div class="evolution-strip" aria-label="Évolutions de ${family.name}">${Array.from({length:family.end-family.start+1},(_,i)=>{const n=family.start+i;if(n>ceiling)return `<button class="evolution-item mystery-evolution" disabled aria-label="Évolution ${i+1} verrouillée"><span class="mystery-lock" aria-hidden="true">🔒</span><span class="level-medal">ÉVOLUTION ${i+1}</span><strong>???</strong><small class="ownership">À DÉCOUVRIR</small></button>`;return `<button class="evolution-item ${n===selected?'active':''} ${canAffordGear(c.id,n)?'can-afford':''}" data-evolution="${n}" aria-pressed="${n===selected}">${canAffordGear(c.id,n)?'<span class="afford-badge">À TA PORTÉE !</span>':''}${picture(n)}<span class="level-medal">ÉVOLUTION ${i+1}</span><strong>${GG.itemName(c,n)}</strong><small class="ownership ${GG.hasItem(save,c.id,n)?'owned':'locked'}">${n===equipped?'✓ ÉQUIPÉ':GG.hasItem(save,c.id,n)?'✓ À TOI':'DISPONIBLE'}</small></button>`;}).join('')}</div><button class="evolution-arrow" data-step="1" aria-label="Évolution suivante" ${selected===ceiling?'disabled':''}>${arrow(1)}</button></div></section>`);
 for(const pic of $('upgrades').querySelectorAll('[data-rider-object]')){const level=Number(pic.dataset.riderObject);if(GGRiders.loaded){const h=GGRiders.objectHeight(level,200),w=h>130?200*130/h:200;GGRiders.drawObject(pic.getContext('2d'),level,120,70,w);}}
 for(const pic of $('upgrades').querySelectorAll('[data-wing-picture]'))GGWingArt.paintPreview(pic,Number(pic.dataset.wingPicture));
 const strip=$('upgrades').querySelector('.evolution-strip'),card=strip.querySelector('.active');if(card)strip.scrollLeft=card.offsetLeft-(strip.clientWidth-card.clientWidth)/2;
}

function refresh(){
 $('gold').textContent=save.gold.toLocaleString('fr');$('day').textContent='JOUR '+save.day;$('record').innerHTML=save.record.toLocaleString('fr')+' <small>m</small>';
 const goal=save.completed.findIndex(v=>!v),i=goal<0?3:goal;
 renderForge();
 $('shop-dot').textContent=forgeCategories.some(c=>affordableCategory(c.id))?'●':'';
 $('milestones').innerHTML=GG.goals.map((g,i)=>`<article class="milestone ${save.completed[i]?'done':i===goal?'current':''}"><span class="number">0${i+1}</span><h2>${g.name}</h2><p>${g.desc}</p><p>Prime : ${g.bonus.toLocaleString('fr')} écus</p><strong>${save.completed[i]?'✓ SERMENT ACCOMPLI':i===goal?'↗ OBJECTIF ACTUEL':'○ À CONQUÉRIR'}</strong></article>`).join('');
}
function showTab(name){if(['flight','launching','landing'].includes(state))return;if(name==='forge'&&tab!=='forge')forgeCategory='upgrades';tab=name;document.body.classList.toggle('shop-open',name==='forge');for(const id of ['launch','forge','map'])$(id).hidden=id!==name;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.tab===name));refresh();}
function ready(){GGCourse.setUpgrades(save.levels.rampHeight||0,save.levels.rampLength||0);inspectionHistory.clear();inspectionZoom=1;cameraZoomManual=false;inspectionPaused=false;refreshInspection();earningsAnimation=null;document.body.classList.remove('in-flight','result-mode');$('flight-gold').hidden=true;$('wall-warning').hidden=true;$('pilot-hint').hidden=true;$('pitch-indicator').hidden=true;$('countdown').hidden=true;$('course-hud').hidden=true;$('stage-banner').hidden=true;stageBannerTime=0;cameraX=0;cameraY=0;accumulator=0;resetArt();state='ready';paused=false;keys={};flight=null;$('result').hidden=true;$('pause-panel').hidden=true;$('flight-hud').hidden=true;$('pause').hidden=true;$('launch-button').disabled=!GGRiders.loaded;$('flight-message').textContent='';refresh();}
async function launch(){if(state!=='ready'||!activeSlot||!GGRiders.loaded)return;const wantedWing=save.levels.wing;if(wantedWing>0&&!GGWingArt.loaded(wantedWing)){await GGWingArt.preload(wantedWing);if(state!=='ready'||save.levels.wing!==wantedWing)return;}keys={};canvas.focus();document.body.classList.add('in-flight');$('pilot-hint').hidden=false;$('pitch-indicator').hidden=false;$('countdown').hidden=true;$('countdown').textContent='';flight=GG.create(save,GGCourse.LAUNCH_ANGLE);soundEngine?.beginFlight();launchDuration=GGCourse.rampProfile(flight.launchSpeed,flight.launchAngle,flight.l.launch).duration;$('course-hud').hidden=false;state='launching';launchTime=0;accumulator=0;$('launch-button').disabled=true;$('flight-hud').hidden=false;$('pause').hidden=false;tone(180,.35);}
function finish(){if(testMode){inspectionPaused=true;landingTime=0;keys={};soundEngine?.pauseEffects();refreshInspection();return;}if(state==='result')return;document.body.classList.add('result-mode');$('countdown').hidden=true;state='result';soundEngine?.sample('results',.60);paused=false;keys={};const reward=GG.settle(save,flight);persist();refresh();$('pause-panel').hidden=true;$('pause').hidden=true;$('result').hidden=false;$('result-title').textContent=flight.newGoals.includes(GG.goals.length-1)?'LE DRAGON A VU L’ENCLUME.':flight.endReason==='wall'?'Le mur a tenu bon.':flight.newGoals.length?'L’honneur gagne du terrain !':'Un atterrissage… affirmé.';$('result-joke').textContent=flight.endReason==='wall'?'Brèche sauvegardée : '+flight.wallStones+' pierres brisées pendant ce vol. Votre élan vous a porté '+Math.round(flight.wallHit.depth)+' m dans le rempart de '+flight.wallHit.width+' m. Reprenez cette brèche avec plus de vitesse !':['« Le sol aurait pu faire un effort. »','« Aucun gantelet n’a été retiré pendant ce vol. »','« J’appelle ça une reconnaissance du terrain. »'][save.day%3];if(flight.endReason==='tower'){$('result-title').textContent='COSTAUDE, CETTE TOUR !';$('result-joke').textContent='Plus d’élan ou de force, et elle craquera en deux !';}if(flight.gullWallBonus){$('result-title').textContent='UN MUR, DEUX ANDOUILLES !';$('result-joke').textContent='« AAAAA–HA–HAH ! AU SECOURS ! » — Le goéland réclame une prime de risque.';}const bill=flight.earnings;
 $('result-tag').textContent='JOUR '+(save.day-(flight.time>0?1:0))+' · LE BILAN DU VOL';
 $('result-stats').innerHTML=`<table class="earnings-table"><thead><tr><th>PERFORMANCE</th><th>RÉSULTAT</th><th>ÉCUS GAGNÉS</th></tr></thead><tbody>${bill.rows.map((r,i)=>`<tr class="earn-${r.id}" style="--row:${i}"><th scope="row">${r.label}<small>${r.rate}</small></th><td>${r.value.toLocaleString('fr')} <small>${r.unit}</small></td><td>+ <span class="gain-count" data-gold="${r.gold}">0</span> <span class="gold-coin" aria-label="écus"></span></td></tr>`).join('')}${bill.support?`<tr class="earn-support"><th scope="row">Coup de pouce du forgeron<small>Minimum de 70 écus par vol</small></th><td>Complément</td><td>+ <span class="gain-count" data-gold="${bill.support}">0</span> <span class="gold-coin" aria-label="écus"></span></td></tr>`:''}${bill.bonuses.map(b=>`<tr class="earn-bonus"><th scope="row">${b.label}<small>${b.rate||'Prime unique'}</small></th><td>ACCOMPLI ✓</td><td>+ <span class="gain-count" data-gold="${b.gold}">0</span> <span class="gold-coin" aria-label="écus"></span></td></tr>`).join('')}</tbody></table><div class="earnings-total total-pending" aria-hidden="true"><span>CE VOL A RAPPORTÉ</span><strong>+ ${reward.toLocaleString('fr')} <span class="gold-coin" aria-label="écus"></span></strong></div>`;
 $('result-goal').textContent=flight.newGoals.length?flight.newGoals.map(i=>'✓ '+GG.goals[i].name).join(' · '):'';startEarningsAnimation();}
// Presentation only: GG.settle already credited and saved the exact reward once.
function startEarningsAnimation(){
 const rows=[...$('result-stats').querySelectorAll('[data-gold]')];
 earningsAnimation={rows,index:0,time:-.25,tick:0};
 rows.forEach(el=>el.closest('tr').classList.add('gain-pending'));
}
function updateEarningsAnimation(dt){
 const a=earningsAnimation;if(!a||state!=='result'||document.hidden)return;
 a.time+=dt;if(a.time<0)return;
 const el=a.rows[a.index];
 if(!el){
  const total=$('result-stats').querySelector('.earnings-total');
  total.classList.remove('total-pending');total.classList.add('total-revealed');total.removeAttribute('aria-hidden');
  if(sound)soundEngine?.coin(true);
  earningsAnimation=null;return;
 }
 const target=Number(el.dataset.gold),duration=target>0?.5: .16;
 const row=el.closest('tr');row.classList.remove('gain-pending');row.classList.add('gain-counting');
 const progress=Math.min(1,a.time/duration),value=Math.floor(target*(1-Math.pow(1-progress,2)));
 const previous=el.textContent;el.textContent=value.toLocaleString('fr');a.tick+=dt;
 if(target>0&&previous!==el.textContent&&a.tick>=.075){if(sound)soundEngine?.coin(false,a.index);a.tick=0;}
 if(a.time>=duration+.1){el.textContent=target.toLocaleString('fr');row.classList.remove('gain-counting');row.classList.add('gain-complete');a.index++;a.time=0;a.tick=0;}
}
function recordInspection(){
 if(!testMode||tab!=='launch'||inspectionPaused||paused||!['launching','flight','landing'].includes(state))return;
 inspectionHistory.record(clock,{state,flight,motion,save,clock,launchTime,launchDuration,landingTime,accumulator,cameraX,cameraY,inspectionZoom,stageBannerTime,trailClock});
 $('inspection-back').disabled=!inspectionHistory.available;
}
function rewindInspection(){
 if(!testMode)return;
 const frame=inspectionHistory.back();if(!frame)return;
 ({state,flight,save,clock,launchTime,launchDuration,landingTime,accumulator,cameraX,cameraY,stageBannerTime,trailClock}=frame);
 Object.assign(motion,frame.motion);if(!cameraZoomManual)inspectionZoom=frame.inspectionZoom;
 activeSlot.save=save;keys={};inspectionPaused=true;paused=false;earningsAnimation=null;
 soundEngine?.pauseEffects();$('pause-panel').hidden=true;$('result').hidden=true;
 $('countdown').hidden=true;$('countdown').textContent='';
 $('stage-banner').hidden=stageBannerTime<=0;
 $('stage-banner').textContent='TABLEAU '+(flight.stage+1)+' · '+GGCourse.stages[flight.stage].name.toUpperCase();
 refreshInspection();scene();
}
function refreshInspection(){
 $('inspection-back').disabled=!inspectionHistory.available;
 $('inspection-controls').hidden=!testMode;
 $('camera-zoom').textContent=Math.round(inspectionZoom*100)+' %';
 $('camera-out').disabled=inspectionZoom<=.5;$('camera-in').disabled=inspectionZoom>=2;
 document.querySelectorAll('[data-rate]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.rate)===inspectionRate)));
 $('inspection-pause').setAttribute('aria-pressed',String(inspectionPaused));
 $('inspection-pause').textContent=inspectionPaused?'▶ REPRENDRE':'Ⅱ PAUSE';
}
$('inspection-controls').onclick=e=>{
 if(e.target.closest('#inspection-back')){rewindInspection();return;}
 const rate=e.target.closest('[data-rate]');
 const zoom=e.target.closest('[data-zoom]');
 if(zoom){cameraZoomManual=zoom.dataset.zoom!=='reset';inspectionZoom=zoom.dataset.zoom==='reset'?(state==='flight'?.55:state==='launching'?.87:1):Math.max(.5,Math.min(2,Math.round((inspectionZoom+Number(zoom.dataset.zoom))*10)/10));refreshInspection();scene();return;}
 if(rate){const value=Number(rate.dataset.rate);if([1,.75,.5,.25,.1].includes(value))inspectionRate=value;}
 else if(e.target.closest('#inspection-pause')){inspectionPaused=!inspectionPaused;keys={};if(inspectionPaused)soundEngine?.pauseEffects();}
 refreshInspection();
};
function togglePause(){if(!['flight','launching','landing'].includes(state))return;paused=!paused;if(paused)soundEngine?.pauseEffects();keys={};$('pause-panel').hidden=!paused;$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Reprendre le vol':'Mettre en pause');if(!paused)canvas.focus();}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{ready();showTab('launch');});
$('launch-button').onclick=launch;$('retry').onclick=()=>{ready();launch();};$('result-forge').onclick=()=>{ready();showTab('forge');};$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('abort').onclick=()=>{flight.ended=true;finish();};
$('upgrades').onclick=e=>{
 const bomb=e.target.closest('[data-bomb]');if(bomb){if(GG.buyBomb(save,Number(bomb.dataset.bomb))){persist();refresh();soundEngine?.coin(true);}return;}
 const selection=e.target.closest('[data-upgrade-select]');if(selection){selectedUpgrade=selection.dataset.upgradeSelect;renderForge();return;}
 const family=e.target.closest('[data-family]');if(family){forgeSelections[forgeCategory]=Number(family.dataset.family);renderForge();return;}
 const test=e.target.closest('[data-trial-kind]');if(test){const kind=test.dataset.trialKind,n=Number(test.dataset.trialLevel);if(kind==='launch')startTest(n);else{const launchId=save.levels.launch;startTest(launchId);save.levels.wing=n;save.owned.wing=Math.max(save.owned.wing,n);ready();showTab('launch');launch();}return;}
 const stat=e.target.closest('[data-stat-buy]');if(stat&&GG.buyStat(save,stat.dataset.statBuy)){GGCourse.setUpgrades(save.levels.rampHeight||0,save.levels.rampLength||0);persist();refresh();tone(550,.12,'triangle');return;}
 const trial=e.target.closest('[data-test-launch]');if(trial){startTest(Number(trial.dataset.testLaunch));return;}

 const category=e.target.closest('[data-category]'),evolution=e.target.closest('[data-evolution]'),step=e.target.closest('[data-step]');
 if(category){forgeCategory=category.dataset.category;renderForge();$('forge-tab-'+forgeCategory).focus();return;}
 if(evolution||step){forgeSelections[forgeCategory]=Math.max(0,Math.min(GG.maxLevel(forgeCategory),evolution?Number(evolution.dataset.evolution):forgeSelections[forgeCategory]+Number(step.dataset.step)));renderForge();return;}
 const item=e.target.closest('[data-equip]');if(item&&GG.equip(save,item.dataset.equip,Number(item.dataset.level))){persist();refresh();$('shop-message').textContent='Équipement remis en place, sans frais.';return;}
 const b=e.target.closest('[data-buy]');if(b&&GG.buy(save,b.dataset.buy,Number(b.dataset.level))){persist();refresh();tone(550,.12,'triangle');$('shop-message').textContent='Amélioration achetée et équipée !';}
};
$('upgrades').onkeydown=e=>{const button=e.target.closest('[data-category]');if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=forgeCategories.findIndex(c=>c.id===forgeCategory);forgeCategory=forgeCategories[e.key==='Home'?0:e.key==='End'?forgeCategories.length-1:(i+(e.key==='ArrowRight'?1:forgeCategories.length-1))%forgeCategories.length].id;renderForge();$('forge-tab-'+forgeCategory).focus();};
$('sound').onclick=()=>{sound=!sound;if(!enableAudio())sound=false;$('sound').textContent=sound?'♫':'♪';$('sound').setAttribute('aria-label',sound?'Couper le son':'Activer le son');$('sound').setAttribute('aria-pressed',String(sound));$('audio-status').textContent=sound?'Réglages conservés pour la prochaine partie.':'Son coupé · activez ♪ pour écouter.';tone();};
function audioPanel(open){$('audio-panel').hidden=!open;$('audio-settings').setAttribute('aria-expanded',String(open));}
$('audio-settings').onclick=()=>audioPanel($('audio-panel').hidden);$('close-audio').onclick=()=>audioPanel(false);
for(const key of ['music','effects']){const slider=$(key+'-volume'),value=$(key+'-volume-value');slider.value=Math.round(audioVolumes[key]*100);value.textContent=slider.value+' %';slider.oninput=()=>{audioVolumes[key]=Number(slider.value)/100;value.textContent=slider.value+' %';soundEngine?.setVolumes(audioVolumes);try{storage.setItem('go-godefroy-go.audio',JSON.stringify(audioVolumes));}catch{$('audio-status').textContent='Réglages conservés pour cette session.';}};}
$('help').onclick=()=>{if(['flight','launching','landing'].includes(state)&&!paused)togglePause();$('help-dialog').showModal();};$('close-help').onclick=$('got-it').onclick=()=>$('help-dialog').close();
function mapKey(e){return {ArrowLeft:'left',ArrowUp:'left',KeyA:'left',KeyQ:'left',ArrowRight:'right',ArrowDown:'right',KeyD:'right',Space:'boost',KeyX:'ram'}[e.code];}
window.addEventListener('keydown',e=>{if(state==='title'||$('help-dialog').open||e.target.tagName==='INPUT'||(/INPUT|BUTTON/.test(e.target.tagName)&&!['flight','launching','landing'].includes(state)))return;const key=mapKey(e);if(key){e.preventDefault();keys[key]=true;if(e.code==='Space'&&state==='ready'&&tab==='launch'&&!e.repeat)launch();}if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat)togglePause();});
window.addEventListener('keyup',e=>{const key=mapKey(e);if(key)keys[key]=false;});window.addEventListener('blur',()=>{keys={};if(['flight','launching','landing'].includes(state)&&!paused)togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&['flight','launching','landing'].includes(state)&&!paused)togglePause();});
document.querySelectorAll('[data-hold]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.hold]=true;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[b.dataset.hold]=false;});
function setBackground(value){
 if(background===value)return;background=value;document.body.dataset.suspended=String(value);
 if(value){if(frameId)cancelAnimationFrame(frameId);frameId=0;keys={};if(['flight','launching','landing'].includes(state)&&!paused)togglePause();soundEngine?.silence();audio?.suspend().catch(()=>{});}
 else{last=performance.now();accumulator=0;if(sound)audio?.resume().catch(()=>{});if(!frameId)frameId=requestAnimationFrame(loop);}
}
window.addEventListener('blur',()=>setBackground(true));
window.addEventListener('focus',()=>setBackground(document.hidden));
document.addEventListener('visibilitychange',()=>setBackground(document.hidden||!document.hasFocus()));
window.addEventListener('pagehide',()=>setBackground(true));
window.addEventListener('pageshow',()=>setBackground(document.hidden||!document.hasFocus()));
// Original vector scenery: deliberately spare, thick outlines, Flash-era silhouettes.
function path(points,fill,stroke='#26353b',width=3){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function line(points,color='#26353b',width=3){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function ellipse(x,y,rx,ry,color,stroke=null){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}}
function rect(x,y,w,h,color,stroke=null){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);}}
function text(str,x,y,size=18,color='#26353b',align='left'){ctx.font=`900 ${size}px 'Nunito',Arial,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y);}
function cloud(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.beginPath();ctx.moveTo(-55,15);ctx.bezierCurveTo(-85,-10,-46,-37,-24,-20);ctx.bezierCurveTo(-19,-58,40,-57,42,-17);ctx.bezierCurveTo(80,-28,100,16,58,20);ctx.closePath();ctx.fillStyle='#f4fbfd';ctx.fill();ctx.strokeStyle='#a8cbd9';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
function tree(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);rect(-3,-10,6,20,'#6c8272');path([[0,-69],[-25,-25],[-14,-25],[-33,-3],[32,-3],[14,-25],[25,-25]],'#6c9b91','#517e79',2);ctx.restore();}
function tower(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);path([[-26,0],[-26,-100],[-34,-100],[-34,-120],[-20,-120],[-20,-108],[-7,-108],[-7,-120],[7,-120],[7,-108],[20,-108],[20,-120],[34,-120],[34,-100],[26,-100],[26,0]],'#a2b9c1','#5b7e8d',3);rect(-7,-79,14,24,'#527584');line([[-24,-40],[25,-40]],'#849da7',2);line([[0,-40],[0,-23]],'#849da7',2);ctx.restore();}
function dragon(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);path([[-15,-8],[-58,-63],[-66,-14],[-40,-28],[-30,1]],'#a34743');path([[8,-7],[55,-66],[63,-10],[36,-28],[25,7]],'#b45349');ellipse(0,10,37,21,'#b9544a','#26353b');path([[-25,13],[-70,27],[-59,3],[-47,13]],'#b9544a');ellipse(31,-9,20,24,'#c96050','#26353b');path([[40,-14],[65,-7],[61,7],[36,10]],'#c96050');path([[22,-27],[25,-43],[34,-28]],'#f4d691');ellipse(38,-15,4,5,'#fff');ellipse(39,-14,2,3,'#26353b');line([[40,4],[57,3]]);ctx.restore();}
function equipment(x,y,s,l){ctx.save();ctx.translate(x,y);ctx.scale(s,s);if(l===0){path([[-75,-16],[30,-19],[-35,-45]],'#d75b4f');}else if(l===1){path([[-90,-15],[30,-60],[75,-15]],'#efce75');line([[0,-45],[0,8]],'#26353b',4);}else{path([[-100,-17],[-40,-70],[0,-30],[45,-66],[88,-18],[20,-25],[0,4],[-30,-24]],l===3?'#9bd5d8':'#83939f');}ctx.restore();}
let trailClock=0;
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);if(r.width&&r.height){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}}
new ResizeObserver(resize).observe(canvas);
function loop(now){frameId=0;if(background)return;const elapsed=Math.min(.12,(now-last)/1000||0);last=now;const inspecting=testMode&&tab==='launch'&&['ready','launching','flight','landing'].includes(state);const dt=elapsed*(inspecting?(inspectionPaused?0:inspectionRate):1);
 if(state!=='title'&&!paused){clock+=dt;
 if(!cameraZoomManual){const flying=state==='flight'||state==='landing'||state==='result';const z=Math.max(0,Math.min(1,((flight?.realTime||0)-.9)/2));const target=flying?.87-.32*z*z*(3-2*z):state==='launching'?.87:1;const before=Math.round(inspectionZoom*100);inspectionZoom+=(target-inspectionZoom)*(1-Math.exp(-dt*3));if(Math.abs(inspectionZoom-target)<.001)inspectionZoom=target;if(Math.round(inspectionZoom*100)!==before)refreshInspection();}
  if(state==='launching'){flight.monsterTime=(flight.monsterTime||0)+dt*GGCourse.TIME_SCALE;launchTime+=dt;$('countdown').hidden=true;if(flight.l.launch===22&&launchTime>0){const rune=Math.min(3,Math.floor(launchTime/launchDuration*4));if(rune!==(flight.rune??-1)){flight.rune=rune;tone(300+rune*150,.09,'triangle');}}if(launchTime>=launchDuration){state='flight';releaseSoap();motion.shake=Math.max(motion.shake,.2);burst(0,flight.y,14,'#edd6ab');$('countdown').hidden=true;if(!soundEngine?.sample('swoosh',.5))tone(300,.25,'sawtooth');soundEngine?.sample('audience',.28,.13);}}
  if(state==='flight'){flight.realTime=(flight.realTime||0)+dt;accumulator+=dt*GGCourse.TIME_SCALE*(motion.wallSlow>0&&!reducedMotion.matches?.4:1);const previousDamage=flight.damageRevision,prev=flight.hits,previousStage=flight.stage,previousBounces=flight.bounces;while(accumulator>=1/120&&!flight.ended){GG.step(flight,1/120,keys);accumulator-=1/120;}if(flight.monsterEvents?.length){for(const hit of flight.monsterEvents.splice(0)){if(hit.type==='fuel'){tone(620,.22,'sine');continue;}if(hit.type==='gold'){if(sound&&!soundEngine?.sample('pickup',.62))soundEngine?.coin(false);continue;}if(hit.type==='special'&&hit.kind===9){burst(hit.x,hit.y,42,'#ff9f35');motion.shake=Math.max(motion.shake,.45);tone(65,.35,'triangle');continue;}if(hit.type==='tower'){impactArt(hit.x,hit.y);motion.shake=Math.max(motion.shake,hit.shattered?.9:.65);soundEngine?.impact({energy:hit.speed*hit.speed});}if(hit.type==='bounce'){const r=flight.monsterReaction;motion.rings.push({x:r?.impactX??hit.x,y:r?.impactY??hit.y,life:.38,max:.38,force:Math.min(1,hit.speed/70)});if(motion.rings.length>6)motion.rings.shift();motion.shake=Math.max(motion.shake,Math.min(.45,.1+hit.speed/200));}burst(hit.x,hit.y,hit.rating==='perfect'?22:8,hit.rating==='perfect'?'#ffe878':hit.rating==='hurt'?'#ff9973':'#68e9bf');motion.shake=Math.max(motion.shake,.16);if(hit.type==='bounce'){if(!soundEngine?.sample('bounce',.52))boingSound(hit.rating);}else if(!(hit.type==='special'&&[1,2].includes(hit.kind)&&soundEngine?.sample('pop',.56)))tone(hit.rating==='perfect'?640:hit.rating==='good'?420:hit.rating==='hurt'?65:160,.16,'triangle');}}if(flight.damageRevision>previousDamage){save.wallDamage=GG.cleanDamage(flight.wallDamage);persist();}if(flight.impactEvents.length){const impacts=flight.impactEvents.splice(0);for(const impact of impacts){wallImpactArt(impact);if(sound&&soundEngine){soundEngine.impact(impact);if(impact.stopped)soundEngine.stop(impact);}}}if(flight.stage>previousStage){stageBannerTime=2.7;$('stage-banner').hidden=false;$('stage-banner').textContent='TABLEAU '+(flight.stage+1)+' · '+GGCourse.stages[flight.stage].name.toUpperCase();if(!flight.wallPrizes.includes(flight.stage))$('stage-banner').textContent+=' · +'+GG.wallBonus(flight.stage).toLocaleString('fr')+' écus';soundEngine?.fanfare(flight.stage);}if(flight.bounces>previousBounces){impactArt(flight.x,0);soundEngine?.sample('bounce',.45);}if(flight.hits>prev){tone(70,.2);impactArt(flight.x,flight.y);}trailClock+=dt;if(trailClock>.06){trailClock=0;flight.trail.push({x:flight.x,y:flight.y});if(flight.trail.length>18)flight.trail.shift();}if(flight.ended){flight.boosting=false;state='landing';landingTime=0;keys={};if(['ground','wall','tower'].includes(flight.endReason))crashSound();else tone(220,.4,'triangle');}}
  if(state==='landing'){landingTime+=dt;const fuse=flight.endReason==='wall'&&flight.bomb;
   if(fuse&&landingTime>=2&&!flight.bombSpent){
    GG.detonateBomb(flight);burst(flight.x,flight.y,48,'#ff9d33');
    motion.shake=Math.max(.5,motion.shake);tone(65,.4,'triangle');
   }
   if(landingTime>(fuse?3.25:flight.endReason==='ground'?2.8:2.2))finish();}if(stageBannerTime>0){stageBannerTime-=dt;if(stageBannerTime<=0)$('stage-banner').hidden=true;}
  if(state==='ready'||state==='launching'){const pose=GGCourse.launchPose(state==='launching'?Math.max(0,launchTime/launchDuration):0,GGCourse.LAUNCH_ANGLE,flight?.launchSpeed,flight?.l.launch??save.levels.launch);cameraY=Math.max(0,(230-pose.y)/GGCourse.SCALE);}
  if(state==='launching')cameraX=Math.max(0,(GGCourse.launchPose(Math.max(0,launchTime/launchDuration),GGCourse.LAUNCH_ANGLE,flight.launchSpeed,flight.l.launch).x-420)/GGCourse.X_SCALE);
  if(flight&&state!=='launching'&&!(state==='landing'&&landingTime<.1)){const smooth=1-Math.exp(-dt*5);cameraX+=(Math.max(0,flight.x+(flight.originX-420)/GGCourse.X_SCALE)-cameraX)*(1-Math.exp(-dt*12));cameraX=Math.max(cameraX,flight.x+(flight.originX-530)/GGCourse.X_SCALE,0);// Let the jump climb visibly in frame before the vertical camera catches up.
   const jumpCamera=GGLaunch.get(flight.l.launch).standing?Math.max(0,Math.min(1,((flight.realTime||0)-1.1)/1.2)):1;
   cameraY+=(Math.max(0,flight.y-260)-cameraY)*smooth*jumpCamera;if(flight.l.wing>0)cameraY=Math.max(cameraY,flight.y-(485-GGWingArt.headroom(flight.l.wing))/GGCourse.SCALE);}
 }
 const missionPanel=$('mission-panel');
 missionPanel.hidden=!flight||!['launching','flight','landing'].includes(state);
 if(!missionPanel.hidden){
  const markup=GG.missionStatus(flight).map(m=>'<li class="'+(m.done?'done':'')+'">'+m.label+' <b>'+(m.done?'✓ Réussi':m.current+' / '+m.target)+'</b></li>').join('');
  if(missionPanel.dataset.last!==markup){missionPanel.dataset.last=markup;missionPanel.querySelector('ul').innerHTML=markup;}
 }
 $('flight-gold').hidden=!['flight','launching','landing'].includes(state);$('flight-gold-count').textContent=(flight?.collectedGold||0).toLocaleString('fr');
 const warningWall=flight?GGCourse.stages[flight.stage+1]:null;
 const wallDistance=warningWall?warningWall.at-flight.x:Infinity;
 $('wall-warning').hidden=state!=='flight'||!warningWall||wallDistance<=0||wallDistance>600;
 if(!$('wall-warning').hidden){$('wall-distance').textContent=Math.ceil(wallDistance).toLocaleString('fr')+' m';$('wall-warning').classList.toggle('close',wallDistance<150);}
 updateEarningsAnimation(dt);
 soundEngine?.update({phase:state,tab,x:flight?.x,nextWallAt:flight?GGCourse.stages[flight.stage+1]?.at:undefined,paused:paused||(inspecting&&inspectionPaused),hidden:document.hidden,progress:state==='launching'?Math.max(0,Math.min(1,launchTime/launchDuration)):0,launchLevel:flight?.l.launch,launchType:flight?GGLaunch.get(flight.l.launch).type:null,stalled:flight?.stalled,speed:state==='launching'&&flight?GGCourse.launchPose(Math.max(0,launchTime/launchDuration),flight.launchAngle,flight.launchSpeed,flight.l.launch).speed:flight?Math.hypot(flight.vx,flight.vy):0,boosting:flight?.boosting,fuel:flight?.fuel||0,ended:flight?.ended});
 if(state!=='title'&&tab==='forge')drawGearPreview();
 if(state!=='title'&&tab==='launch'){updateArt(paused?0:dt);scene();}
 if(flight){const sector=GGCourse.stages[flight.stage],next=GGCourse.stages[flight.stage+1];$('course-name').textContent='TABLEAU '+(flight.stage+1)+' · '+sector.name;$('course-next').textContent=next?'SORTIE DU REMPART À '+(next.at+GGCourse.wallWidth(flight.stage+1)).toLocaleString('fr')+' m · encore '+Math.max(0,Math.ceil(next.at+GGCourse.wallWidth(flight.stage+1)-flight.x)).toLocaleString('fr')+' m':'LE DRAGON ANCESTRAL · objectif : 8 000 m d’altitude';$('course-progress').style.width=Math.min(100,flight.x/100000*100)+'%';$('distance').textContent=Math.floor(flight.x).toLocaleString('fr')+' m';$('altitude').textContent=Math.floor(flight.y).toLocaleString('fr')+' m';$('speed').textContent=Math.floor(Math.hypot(flight.vx,flight.vy)*3.6)+' km/h';$('fuel').value=flight.fuel/flight.maxFuel;$('pitch-indicator').textContent=(flight.stalled?'⚠ DÉCROCHAGE · ':flight.boosting?'🔥 POUSSÉE · ':flight.wingTorn?'CAPE DÉCHIRÉE · ':'ASSIETTE · ')+Math.round(flight.pitch*180/Math.PI)+'°';$('flight-message').dataset.rating=flight.feedback&&flight.monsterTime-flight.feedback.at<2?flight.feedback.rating:'';$('flight-message').textContent=flight.messageTime>0&&state!=='result'?flight.message:'';}
 if(state==='launching'&&flight){const progress=Math.max(0,Math.min(1,launchTime/launchDuration)),pose=GGCourse.launchPose(progress,flight.launchAngle,flight.launchSpeed,flight.l.launch);$('distance').textContent='RAMPE';$('altitude').textContent=Math.round((485-pose.y)/GGCourse.SCALE)+' m';$('speed').textContent=Math.round((launchTime>0?pose.speed:0)*3.6)+' km/h';}
 updateInstruments();
 recordInspection();
 frameId=requestAnimationFrame(loop);
}
refresh();updateTitle();background=document.hidden||!document.hasFocus();if(!background)frameId=requestAnimationFrame(loop);

// Disposable sandbox: never points at a saved profile and never writes progression.
function startTest(level=0){
 if(!testMode){testReturnSlot=activeSlot;save=JSON.parse(JSON.stringify(save));testMode=true;activeSlot={id:'test',name:'Atelier de test',save};}
 save.gold=Infinity;if(save.collection){delete save.collection.launch;delete save.collection.wing;}save.owned.wing=40;save.owned.launch=24;save.levels.launch=Math.max(0,Math.min(24,level));save.wallDamage={};
 forgeSelections.launch=save.levels.launch;inspectionPaused=false;
 $('profile-label').textContent='ATELIER DE TEST';$('title-screen').hidden=true;$('profile-screen').hidden=true;$('play-shell').hidden=false;
 document.body.className='';$('test-controls').hidden=false;$('test-launch-select').value=String(save.levels.launch);
 ready();showTab('launch');launch();
}
$('test-launch-select').innerHTML=GGLaunch.items.map((g,i)=>`<option value="${i}">${i+1} · ${g.name}</option>`).join('');
$('test-launch-select').onchange=e=>startTest(Number(e.target.value));
$('test-retry').onclick=()=>startTest(save.levels.launch);
$('test-forge').onclick=()=>{ready();showTab('forge');};
$('test-exit').onclick=()=>{GGCourse.setTestRamp();testRampHeight=0;testRampLength=0;const slot=testReturnSlot;testMode=false;$('test-controls').hidden=true;activeSlot=slot;save=slot?.save??GG.fresh();if(slot)enter(slot);else toTitle();};
$('title-test').onclick=()=>startTest(0);

$('title-test').disabled=!GGRiders.loaded;
GGRiders.ready.then(()=>{$('title-test').disabled=false;if(state==='ready')$('launch-button').disabled=false;renderForge();}).catch(e=>{$('title-status').textContent=e.message+' — rechargez le jeu.';$('saving').textContent=e.message;});

let testRampHeight=0,testRampLength=0;
function refreshTestRamp(){const label=document.getElementById('test-ramp-values');if(label)label.textContent='Hauteur '+(testRampHeight>=0?'+':'')+testRampHeight+' · Fin '+(testRampLength>=0?'+':'')+testRampLength;}
document.querySelectorAll('[data-ramp-adjust]').forEach(button=>button.addEventListener('click',()=>{if(!testMode)return;const axis=button.dataset.rampAdjust,delta=Number(button.dataset.delta);const values=GGCourse.setTestRamp(testRampHeight+(axis==='height'?delta:0),testRampLength+(axis==='length'?delta:0));testRampHeight=values.height;testRampLength=values.length;refreshTestRamp();startTest(save.levels.launch);}));
document.getElementById('test-ramp-reset').onclick=()=>{if(!testMode)return;GGCourse.setTestRamp();testRampHeight=0;testRampLength=0;refreshTestRamp();startTest(save.levels.launch);};

GGDelta.ready.then(()=>renderForge());

function updateInstruments(){
 const panel=$('flight-instruments');panel.hidden=!flight||!['launching','flight','landing'].includes(state);if(panel.hidden)return;
 const v=state==='launching'?GGCourse.launchPose(Math.max(0,launchTime/launchDuration),flight.launchAngle,flight.launchSpeed,flight.l.launch).speed:Math.hypot(flight.vx,flight.vy);
 const max=GG.parameters(flight.l).maxSpeed*3.6,speed=v*3.6;
 $('dial-needle').style.transform=`rotate(${-130+260*Math.min(1,speed/max)}deg)`;
 $('dial-speed').textContent=Math.round(speed);$('dial-max').textContent=Math.round(max);
 const altitude=state==='launching'?(485-GGCourse.launchPose(Math.max(0,launchTime/launchDuration),flight.launchAngle,flight.launchSpeed,flight.l.launch).y)/GGCourse.SCALE:flight.y;
 $('dial-altitude').textContent=Math.round(Math.max(0,altitude)).toLocaleString('fr');
 $('altitude-fill').style.height=Math.min(100,Math.max(0,altitude)/Math.max(1000,flight.maxY)*100)+'%';
 panel.style.bottom=testMode?'116px':'24px';
}

document.addEventListener('click',event=>{
 const button=event.target.closest?.('button');
 if(!button||button.disabled||!sound)return;
 if(!enableAudio())return;
 const deep=button.matches('#launch-button,#retry,#abort,[data-buy],[data-bomb],[data-stat-buy]');
 soundEngine?.sample(deep?'deep':'click',deep?.43:.34);
},true);
