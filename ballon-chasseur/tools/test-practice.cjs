'use strict';const assert=require('node:assert/strict');global.window={};const storage=new Map();global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
for(const f of ['config','monsters','game','powers','ai','match-rules','boss-arena','adventure','equipment','magic-items','rare-items','skeleton-powers','lizard-powers','manual-aim','practice'])require('../js/'+f+'.js');const B=window.BC,T=B.Practice,A=B.Adventure,E=B.Equipment;
const s=A.start('matthieu');A.char(s,'matthieu');A.save(s);
const make=id=>{const g=new B.Game({teams:[B.TEAMS[0],B.MONSTER_TEAMS[0]],ctrl:['p1','cpu'],intro:false,controlMode:'fixed'});T.attach(g,{pid:'matthieu',id,leader:'matthieu'});return g;};
assert.equal(T.missions.length,9);assert.equal(T.unlocked(s,'matthieu',T.missions[1]),false);
const g=make('targets-1'),p=g.practice.player;p.phys.aimSpread=0;
assert.equal(g.practice.mission.goal,10);assert.equal(g.practice.mission.radius,21);
for(let n=0;n<10;n++){while(g.practice.targetExit!=null)g.update(1/60,[{}]);g.practice.target={x:600,y:p.y};g.give(p);g.setState(p,'idle');p.manualAngle=0;g.throwBall(p,{charge:1});for(let i=0;i<120&&g.practice.score<=n;i++)g.update(1/60,[{}]);assert.equal(g.practice.score,n+1);}
g.update(1/60,[{}]);assert.equal(g.phase,'end');const before=E.state.gold,reward=T.award(g);assert.deepEqual(reward,{xp:180,gold:160,first:true});assert.equal(E.state.gold,before+160);assert.equal(T.award(g),reward);assert.equal(E.state.gold,before+160);const saved=A.load('matthieu');assert.equal(saved.chars.matthieu.totalXp,180);assert.ok(T.unlocked(saved,'matthieu',T.missions[1]));assert.equal(saved.wins,0);assert.equal(saved.match,0);
assert.equal(g.practice.progress.beforeXp,0);assert.equal(g.practice.progress.beforeEarned,0);assert.equal(g.practice.progress.gained,3);
const repeat=make('targets-1');T.finish(repeat,true);assert.deepEqual(T.award(repeat),{xp:60,gold:60,first:false});
const failure=make('moving-1');failure.practice.left=.01;failure.update(.02,[{}]);assert.equal(failure.phase,'end');assert.deepEqual(T.award(failure),{xp:10,gold:8,first:false});
const moving=make('moving-1'),y=moving.practice.target.y;moving.update(.1,[{}]);assert.notEqual(moving.practice.target.y,y);const left=moving.practice.left;moving.paused=true;moving.update(1,[{}]);assert.equal(moving.practice.left,left);
const catches=make('catch-1');catches.update(.7,[{}]);assert.equal(catches.ball.team,1);assert.equal(catches.practice.shot,true);catches.caught(catches.practice.player);assert.equal(catches.practice.score,1);catches.caught(catches.practice.player);assert.equal(catches.practice.score,1);
console.log('OK : vrais tirs sur cibles, cibles mobiles, attrapés, délai/pause, progression, XP/or, bonus de première réussite et attribution unique.');
const other=A.start('josee');A.char(other,'josee');A.save(other);let options;B.app={startMatch:o=>options=o};assert.ok(T.start('matthieu','targets-1'));assert.equal(options.practice.pid,'matthieu');assert.equal(options.practice.leader,'matthieu');assert.equal(options.teams[0].players[0],'matthieu');assert.equal(T.start('inconnu','targets-1'),false);assert.equal(A.load('josee').chars.josee.totalXp,0);console.log('OK : héros principal et aventure explicitement conservés, aucun héros de remplacement.');
B.app.settings={aimMode:'auto'};
const targetGame=make('targets-1'),hero=targetGame.practice.player;hero.phys.aimSpread=0;targetGame.practice.target={x:700,y:560};const aim=targetGame.aimDir(hero,{dy:-1});assert.ok(aim.assisted);assert.ok(Math.abs(aim.y/aim.x-110/350)<1e-9);targetGame.throwBall(hero,{charge:1});for(let i=0;i<120&&!targetGame.practice.score;i++)targetGame.update(1/60,[{}]);assert.equal(targetGame.practice.score,1,'le tir automatique touche une cible décentrée');
const mobile=make('moving-1'),mp=mobile.practice.player;mobile.update(.1,[{}]);const a1=mobile.aimDir(mp);mobile.update(.5,[{}]);const a2=mobile.aimDir(mp);assert.notEqual(a1.y,a2.y);assert.ok(a2.y/a2.x>(mobile.practice.target.y-mp.y)/(mobile.practice.target.x-mp.x),'la visée anticipe le déplacement');B.app.settings.aimMode='manual';mp.manualAngle=-.6;assert.ok(Math.abs(mobile.aimDir(mp).y-Math.sin(-.6))<1e-9);B.app.settings.aimMode='auto';const catchGame=make('catch-1');assert.ok(catchGame.aimDir(catchGame.practice.player).target,'les attrapés gardent la visée sur l’entraîneur');console.log('OK : cible fixe touchée en automatique, suivi de cible mobile, visée manuelle et entraîneur conservés.');

for(const level of [1,2,3])for(const phase of [.1,1.2,2.7,4])for(const speed of [500,1000])for(const charge of [0,1]){const game=make('moving-'+level),p=game.practice.player;game.time=phase;p.phys.throwSpeed=speed;p.phys.aimSpread=0;game.practice.target.y=450+Math.sin(phase*(.65+level*.3))*105;game.throwBall(p,{charge});assert.equal(game.practice.shotOptions,undefined);for(let frame=0;frame<180&&!game.practice.score;frame++)game.update(1/60,[{}]);assert.equal(game.practice.score,1,'interception niveau '+level+' phase '+phase+' vitesse '+speed+' charge '+charge);}
console.log('OK : 96 interceptions réelles, vitesse et charge variables, déplacements et demi-tours de la cible.');

// Les vrais lancers lents arrivent à hauteur de poitrine et peuvent être attrapés.
for(const level of [1,2,3])for(const dt of [1/120,1/60,1/30])for(const pos of [[350,450],[B.COURT.left+40,B.COURT.top+40]]){
 const game=make('catch-'+level),p=game.practice.player;[p.x,p.y]=pos;
 game.update(.7,[{}]);let attempted=false;
 for(let frame=0;frame<4/dt&&!game.practice.score;frame++){
  const b=game.ball,distance=Math.hypot(b.x-p.x,b.y-p.y);
  if(!attempted&&b.state==='live'&&distance<70){assert.equal(b.z,B.CHEST);p.facing=1;game.setState(p,'idle');game.action(p,'b',{dx:0,dy:0});attempted=true;}
  game.update(dt,[{}]);
 }
 assert.ok(attempted,'le ballon atteint le joueur');assert.equal(game.practice.score,1,'attrapé réel au niveau '+level);assert.equal(p.hasBall,true);
}
console.log('OK : lancers réflexes attrapables aux trois niveaux, au centre et au bord, à 30/60/120 images par seconde.');

// Cycle des cibles : apparition élastique, sortie sans score, nouvelle position et pause.
const cycle=make('targets-1'),r=cycle.practice;
assert.ok(r.targetLife>=3&&r.targetLife<=5);assert.equal(T.targetVisual(r).scale,0);assert.equal(T.targetVisual(r).alpha,0);
cycle.update(.08,[{}]);assert.ok(T.targetVisual(r).scale>1);assert.ok(T.targetVisual(r).alpha>0&&T.targetVisual(r).alpha<1);
cycle.update(.5,[{}]);assert.equal(T.targetVisual(r).scale,1);
r.targetAge=r.targetLife-.36;cycle.update(.02,[{}]);assert.notEqual(r.targetExit,null);
const age=r.targetExit;cycle.paused=true;cycle.update(1,[{}]);assert.equal(r.targetExit,age);cycle.paused=false;
cycle.update(.2,[{}]);assert.ok(T.targetVisual(r).alpha<1);const previous=r.target;
cycle.update(.4,[{}]);assert.notEqual(r.target,previous);assert.equal(r.targetAge,0);
for(const jump of [false,true]){r.player.x=B.COURT.mid;r.player.z=jump?80:0;r.player.vx=500;cycle.confine(r.player);assert.equal(r.player.x,T.practiceLimit-14);assert.equal(r.player.vx,0);}
const unrestricted=make('catch-1');unrestricted.practice.player.x=B.COURT.mid;unrestricted.confine(unrestricted.practice.player);assert.equal(unrestricted.practice.player.x,B.COURT.mid);
console.log('OK : cibles de 3–5 s, fondu/élasticité, renouvellement, pause et moitié arrière imposée même en saut.');

const hidden=make('targets-1');hidden.practice.targetAge=1;T.dismissTarget(hidden.practice);hidden.practice.targetExit=.4;
const hb=hidden.ball;Object.assign(hb,{state:'live',holder:null,team:0,thrower:hidden.practice.player,x:939,y:450,z:30,vx:600,vy:0,vz:0,speed:600,airShot:true,launchZ:30,impactZ:30,trail:[]});hidden.practice.player.hasBall=false;
hidden.updateBall(1/60);assert.equal(hidden.practice.score,0,'une cible disparue ne compte pas');
const charging=make('targets-1'),cp=charging.practice.player;charging.update(1/60,[{a:true,dx:1}]);for(let i=0;i<90;i++)charging.update(1/60,[{a:true,dx:1}]);assert.equal(cp.x,T.practiceLimit-14);assert.ok(cp.charging&&cp.hasBall);assert.equal(cp.charge,1);

assert.equal(g.practice.performance.shots,10);assert.equal(g.practice.performance.hits,10);assert.equal(g.practice.performance.missed,0);assert.equal(g.practice.coins,30);assert.equal(saved.practice.matthieu['targets-1'].bestScore,1200);assert.equal(saved.practice.matthieu['targets-1'].bestRun.shots,10);
const failedRecord=A.load('matthieu').practice.matthieu['moving-1'];assert.equal(failedRecord.wins,0);assert.equal(T.unlocked(A.load('matthieu'),'matthieu',T.missions.find(m=>m.id==='moving-2')),false);assert.ok(failure.practice.timedOut);
const perfectGame=make('targets-1'),perfectHero=perfectGame.practice.player;perfectHero.perfectRelease=true;perfectGame.throwBall(perfectHero,{charge:1});assert.equal(perfectGame.practice.perfect,1);assert.equal(perfectGame.practice.shots,1);perfectGame.throwBall(perfectHero,{charge:1});assert.equal(perfectGame.practice.shots,1);T.finish(perfectGame,false);const pf=T.award(perfectGame);assert.equal(perfectGame.practice.performance.missed,1);assert.equal(perfectGame.practice.performance.score,15);assert.ok(pf.xp>=10&&pf.gold>=8);assert.equal(A.load('matthieu').practice.matthieu['targets-1'].bestScore,1200);assert.equal(T.award(perfectGame),pf);
console.log('OK : pièces, statistiques des vrais tirs, parfaits, ratés, record conservé, récompenses d’échec et aucun déblocage sur échec.');
