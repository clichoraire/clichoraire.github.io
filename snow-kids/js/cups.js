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
  SK.cupCourse=(cup,stage)=>{
    const source={...SK.courseById(cup.tracks[stage]),puzzleId:cup.id+':course:'+stage};if(!['flocons','sapins','boules'].includes(cup.id))return source;
    const c=JSON.parse(JSON.stringify(source));c.theme='rookie';c.surface='snow';c.forest=cup.id==='sapins';c.lowPassages=cup.id==='boules';
    c.name=['flocons','sapins','boules'].includes(cup.id)?cup.name+' · versant '+(stage+1):c.name;
    c.sections=c.sections.filter(s=>s.t!=='x').map((s,i)=>({...s,w:Math.max(8,Math.min(17,(s.w||12)+[0,-3,3][(i+stage)%3]))}));return c;
  };
  SK.cupById=id=>SK.CUPS.find(c=>c.id===id);
  SK.cupUnlocked=(cup,save)=>{const i=SK.CUPS.indexOf(cup);return i===0||!!(save.cups&&save.cups[SK.CUPS[i-1].id]?.won)||!!save.cups?.[cup.id]?.won;};
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
    save.cups[run.id]={won:won||!!old.won,bestPoints:Math.max(old.bestPoints||0,me?.points||0),bestTime:me&&!me.estimated?Math.min(old.bestTime||Infinity,me.time):old.bestTime||null};return {won,firstWin};
  };
})(window.SK);
