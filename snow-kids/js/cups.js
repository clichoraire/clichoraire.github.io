// Coupes : calendrier, déverrouillage et classement cumulé (indépendants du rendu).
(function(SK){
  'use strict';
  SK.CUP_GROUPS=[{id:'beginner',name:'Débutant',label:'Coupes Débutantes',color:'gold'},{id:'advanced',name:'Moyen',label:'Coupes Moyennes',color:'silver'},{id:'expert',name:'Expert',label:'Coupes Expertes',color:'bronze'}];
  const cup=(id,name,group,tracks,laps)=>({id,name,group,tracks,laps});
  SK.CUPS=[
    cup('flocons','Premiers flocons','beginner',['rookie','snowman','sunset'],2),
    cup('sapins','La forêt des sapins','beginner',['rookie','snowman','rookie'],2),
    cup('boules','Bataille de boules de neige','beginner',['snowman','rookie','sunset'],2),
    cup('couchant','Les couleurs du couchant','beginner',['sunset','grass','rookie'],2),
    cup('glissades','Grandes glissades','beginner',['grass','snowman','sunset'],3),
    cup('aurores','Sous les aurores','beginner',['sunset','rookie','snowman'],3),
    cup('etoiles','Les étoiles du nord','beginner',['snowman','grass','rookie'],3),
    cup('vitesse','La route de la vitesse','advanced',['highway','grass','sand','silver'],3),
    cup('oasis','De la neige au sable','advanced',['grass','sand','sunset','silver'],3),
    cup('minuit','Minuit sur la montagne','advanced',['highway','silver','sunset','sand'],3),
    cup('glaciers','La traversée des glaciers','advanced',['silver','snowman','highway','grass'],3),
    cup('sommets','La conquête des sommets','advanced',['sand','highway','grass','silver'],3),
    cup('ninjas','Le défi des ninjas','expert',['silver','ninja'],3),
    cup('vertige','Vertige au sommet','expert',['ninja','dizzy'],3),
    cup('legendes','La coupe des légendes','expert',['dizzy','ninja'],5),
  ];
  const ROUTES=[
    ['Première glisse','Les premiers obstacles','La grande tempête'],
    ['À l’orée du bois','La forêt profonde','Les sentiers des sapins'],
    ['Les guetteurs de neige','La traversée des ours','L’embuscade polaire'],
    ['Le canyon orange','Les prés du soir','Le dernier rayon'],
    ['La prairie bondissante','Les branches givrées','Le slalom des rochers'],
    ['Les reflets du couchant','Les lacets enneigés','Le passage des glaces'],
    ['Les géants de neige','Les prairies du nord','La descente des étoiles'],
    ['La voie rapide','Les virages de la prairie','Le sable brûlant','La ligne des glaciers'],
    ['Les dunes ondulées','La clairière de l’oasis','Les murs du canyon','La sortie gelée'],
    ['Les lumières de minuit','Le couloir argenté','Les arches du désert','Le dernier tunnel'],
    ['Les portes de glace','Le ravin blanc','Les traversées nocturnes','Les prés givrés'],
    ['La montée des dunes','Les chicanes rapides','La crête des glaciers','Le dernier pré'],
    ['Les lames de glace','Le bois des ninjas'],
    ['Les branches du vertige','Les sauts du sommet'],
    ['L’épreuve des légendes','Le dernier défi ninja']
  ];
  SK.cupCourse=(cup,stage)=>{
    const order=SK.CUPS.indexOf(cup),level=order+(stage/(cup.tracks.length));
    const c=JSON.parse(JSON.stringify(SK.courseById(cup.tracks[stage])));
    Object.assign(c,{puzzleId:cup.id+':course:'+stage,recordId:'cup:'+cup.id+':'+stage+':laps:'+cup.laps,name:ROUTES[order][stage],difficulty:level});
    if(order<3){c.theme='rookie';c.surface='snow';c.sections=c.sections.filter(s=>s.t!=='x');}
    c.forest=cup.id==='sapins';c.forestLevel=c.forest?stage+1:0;
    c.snowGuards=(c.forest&&stage>=1)||cup.id==='boules';c.guardSpacing=cup.id==='boules'?38:0;c.polarBears=cup.id==='boules';
    c.blizzard=cup.id==='flocons'&&stage===2;
    // Difficulté croissante : virages, largeur, puis enchaînements saut/flexion.
    c.sections=c.sections.map((s,i)=>({...s,...(s.w?{w:Math.max(6.5,s.w*(1-.012*level)-(stage*.25))}:{}),...(s.c?{c:s.c*(1+.018*level)*(stage%2?-1:1)}:{})}));
    c.challenges={spacing:Math.round(100-level*3.1),warning:Math.round(23-level*.65),first:order===0&&stage===0?95:55,stage,style:['highway'].includes(c.theme)?'metal':c.theme==='ninja'?'bamboo':'wood'};
    c.desc=cup.name+' — '+c.name+'. '+(order<3?'Apprends à anticiper les obstacles.':order<7?'Alterne sauts et passages baissés.':order<12?'Virages resserrés et obstacles plus rapprochés.':'Enchaînements experts : garde le rythme !');
    return c;
  };
  SK.cupById=id=>SK.CUPS.find(c=>c.id===id);
  SK.cupUnlocked=(cup,save)=>{const i=SK.CUPS.indexOf(cup);return !!save.allCupsUnlocked||i===0||!!(save.cups&&save.cups[SK.CUPS[i-1].id]?.won)||!!save.cups?.[cup.id]?.won;};
  SK.CUP_POINTS=[10,7,4,1,0];
  SK.newCupRun=(cup,opponents)=>({id:cup.id,stage:0,opponents,scores:{},creditedStages:[],finished:false});
  SK.scoreCupRace=function(run,results){
    if(run.creditedStages.includes(run.stage))return false;
    for(const x of results){const id=x.r.def.id,row=run.scores[id]||(run.scores[id]={id,name:x.name,points:0,time:0,wins:0,human:x.r.ctrl==='human',estimated:false});row.points+=SK.CUP_POINTS[x.rank]||0;row.time+=Number.isFinite(x.time)?x.time:3600;row.wins+=x.rank===0?1:0;row.estimated ||= !!x.estimated;}
    run.creditedStages.push(run.stage);run.finished=run.creditedStages.length===SK.cupById(run.id).tracks.length;return true;
  };
  SK.cupStandings=run=>Object.values(run.scores).sort((a,b)=>b.points-a.points||a.time-b.time||b.wins-a.wins||a.id.localeCompare(b.id));
  SK.recordCup=function(save,run){
    if(!run.finished)return {won:false,firstWin:false};
    save.cups=save.cups||{};const rows=SK.cupStandings(run),me=rows.find(r=>r.human),won=!!rows[0]?.human,old=save.cups[run.id]||{},firstWin=won&&!old.won;
    save.cups[run.id]={bestRank:Math.min(old.won?1:old.bestRank||Infinity,me?rows.indexOf(me)+1:Infinity),won:won||!!old.won,bestPoints:Math.max(old.bestPoints||0,me?.points||0),bestTime:me&&!me.estimated?Math.min(old.bestTime||Infinity,me.time):old.bestTime||null};return {won,firstWin};
  };
})(window.SK);
