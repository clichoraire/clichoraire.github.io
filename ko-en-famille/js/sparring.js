// Sparring : lire les feintes, défendre les séries, puis trouver la riposte.
(function(root){
'use strict';
const B=root.BX,G=B.gym,X=G.extra,A=B.art,AU=B.audio;
X.defs.sparring={id:'sparring',stat:'defense',name:'Sparring du coach',icon:'🥊',controls:'Z / X : corps · ↑ + Z/X : tête · ↓ + Z/X : bas · ← → : esquive · ↓↓ : plongeon · Espace : uppercut ★',how:'Lis ses gestes : il feinte, double ses feintes et enchaîne. Garde pour les directs, esquive pour les crochets et uppercuts. Riposte dans l’ouverture verte ! À zéro vie : K.O. et fin de séance.',goal:14,goalLabel:'défenses et contres',actions:40};
G.LEVELS.sparring=Array.from({length:10},(_,i)=>i<3?'Jabs, doubles rapides et uppercuts':i<6?'Doubles feintes et retards':'Longues séries, ouvertures courtes');
const old={init:X.init,input:X.input,update:X.update,draw:X.draw,release:X.release};
// Un sac mélangé évite les répétitions ; chaque série garde ses mains et son rythme.
const move=(kind,hand='L',tempo=1)=>({kind,hand,tempo});
const J=()=>move('jab'),R=()=>move('cross','R'),H=(hand='L')=>move('hook',hand),U=(hand='R')=>move('upper',hand),F=(hand='L')=>move('feint',hand),fast=m=>({...m,tempo:.42}),late=m=>({...m,tempo:1.55});
const plans=[
 ['Jab',1,[J()]],['Direct droit',1,[R()]],['Double jab rapide',1,[J(),fast(J())]],
 ['Jab puis uppercut',1,[J(),U()]],['Un-deux',1,[J(),fast(R())]],['Crochet isolé',1,[H()]],
 ['Uppercut isolé',1,[U()]],['Jab puis crochet',1,[J(),H('R')]],['Feinte puis jab',1,[F(),J()]],
 ['Double direct droit',2,[R(),fast(R())]],['Deux crochets',2,[H(),fast(H('R'))]],['Direct puis uppercut',2,[R(),U('L')]],
 ['Triple jab',2,[J(),fast(J()),fast(J())]],['Jab retardé',2,[J(),late(R())]],['Feinte puis crochet',2,[F(),H('R')]],
 ['Un-deux-crochet',3,[J(),fast(R()),H()]],['Double jab puis uppercut',3,[J(),fast(J()),U()]],
 ['Crochet puis direct',3,[H(),R()]],['Deux uppercuts',3,[U('L'),fast(U())]],['Feinte droite puis gauche',3,[F('R'),J()]],
 ['Double feinte puis uppercut',4,[F(),F('R'),U()]],['Jab-feinte-crochet',4,[J(),F('R'),H()]],
 ['Quatre directs',4,[J(),fast(R()),fast(J()),fast(R())]],['Crochet-jab-uppercut',4,[H(),J(),U()]],
 ['Uppercut puis crochet',5,[U(),fast(H())]],['Un-deux puis retard',5,[J(),fast(R()),late(H())]],
 ['Double jab-deux crochets',5,[J(),fast(J()),H(),fast(H('R'))]],['Feinte entre directs',5,[J(),F('R'),R(),J()]],
 ['Rafale de cinq',6,[J(),fast(R()),fast(J()),fast(R()),U()]],['Crochets et uppercuts',6,[H(),U(),H('R'),U('L')]],
 ['Deux feintes et rafale',7,[F(),F('R'),J(),fast(R()),fast(H())]],
 ['Six coups en escalier',8,[J(),fast(J()),R(),H(),fast(H('R')),U()]],
 ['Contretemps du coach',9,[J(),late(R()),fast(H()),F(),late(U())]],
 ['La totale',10,[F(),J(),fast(J()),R(),fast(H()),U(),late(H('R'))]],
].map(([name,min,moves],id)=>({id,name,min,moves}));
X.sparringPlans=plans;
function nextSeries(s){
 const w=s.work;
 if(!w.seriesBag?.length){w.seriesBag=plans.slice();for(let i=w.seriesBag.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[w.seriesBag[i],w.seriesBag[j]]=[w.seriesBag[j],w.seriesBag[i]];}if(w.seriesBag.at(-1)?.id===w.previous)[w.seriesBag[0],w.seriesBag[w.seriesBag.length-1]]=[w.seriesBag.at(-1),w.seriesBag[0]];}
 const series=w.seriesBag.pop();w.plan=series.moves;w.seriesName=series.name;w.previous=series.id;w.mirror=Math.random()<.5;w.index=0;w.clean=true;nextMove(s);
}
function nextMove(s){
 const w=s.work,entry=w.plan[w.index++],m=typeof entry==='string'?move(entry):entry;
 w.kind=m.kind;w.phase='tell';w.timer=0;w.hand=w.mirror?(m.hand==='L'?'R':'L'):m.hand;
 w.duration=Math.max(G.tune(s,[.9,.65,.45]),(.85-s.lvl*.035)*m.tempo);w.resolved=false;
 w.move={pose:w.kind==='feint'?'jab':w.kind,from:w.hand,high:true};
}
function failure(s,text,sound='hurt'){const w=s.work;w.h.miss();w.errors++;w.clean=false;w.h.msg(text,'#ffab91',32);AU.play(sound);}
X.init=(s,h)=>{old.init(s,h);if(s.mode!=='sparring')return;const w=s.work,coach=s.coach||B.charById('richard'),base=B.boxerById('coach');
 Object.assign(w,{phase:'wait',timer:0,defended:0,counters:0,errors:0,dodgeAt:-9,lastDown:-9,lastPunch:-9,punchDuration:.3,punchHigh:false,punchZone:'mid',stars:0,coach,boxer:{...base,look:{...base.look,shirt:{type:'tank',c1:coach.tank},gloves:coach.gloves}},duration:.9,hp:100,maxHp:100,ko:false,hitSide:1,hitAt:-9});
 w.combat=B.fight.practice.create({ch:s.ch,stats:s.stats||s.ch.stats,mods:s.mods,combos:s.combos,boxer:{...base,dmg:1},canCounter:()=>w.phase==='open'});
 w.combat.msgs=[];w.hp=w.maxHp=w.combat.p.hp;
};
X.release=(s,e)=>{if(s.mode!=='sparring')return old.release(s,e);B.fight.practice.key(s.work.combat,e,false);delete s.work.held[B.BOXING_KEYS[e.code]];};
function syncPlayer(s){
 const w=s.work,p=w.combat.p;w.hp=p.hp;w.stars=p.stars;w.held={...w.combat.practiceKeys};w.punchHigh=p.high;w.punchZone=p.zone;w.punchDuration=p.dur;w.hitSide=p.hitSide;
 const pose=p.st==='punch'?(p.side==='L'?'pL':'pR'):p.st==='dodge'?(p.dir<0?'dodgeL':'dodgeR'):p.st;
 s.pose=pose;s.poseT=p.t;
 const message=w.combat.msgs.at(-1);if(message&&message!==w.lastCombatMessage){w.lastCombatMessage=message;w.h.msg(message.text,message.col,Math.min(38,message.size));}
}
X.input=(s,e)=>{
 if(s.mode!=='sparring')return old.input(s,e);
 const w=s.work;if(s.phase!=='go'||w.ko)return;
 B.fight.practice.key(w.combat,e,true);syncPlayer(s);
};
X.update=(s,dt)=>{if(s.mode!=='sparring')return old.update(s,dt);const w=s.work;if(w.ko||s.phase!=='go')return;w.clock+=dt;w.timer+=dt;
 const fight=w.combat,p=fight.p,landed=fight.stats.landed,blocked=fight.stats.blocks;
 fight.o.st=w.phase==='open'?'rec':'idle';fight.o.guard='both';fight.o.counterReady=w.phase==='open';
 fight.o.move={...w.move,star:'counter',avoid:[]};
 B.fight.practice.step(fight,dt);syncPlayer(s);
 if(fight.stats.landed>landed){w.counters++;w.h.streak(w.clean?12:7);w.h.msg('BIEN RIPOSTÉ !','#9ce7bb',36);w.phase='hit';w.timer=0;w.duration=Math.max(.45,p.dur);}
 if(fight.stats.blocks>blocked)failure(s,'Frappe en riposte, quand le coach s’ouvre !','block');
 if(w.phase==='wait'){if(w.timer>=w.duration)nextSeries(s);return;}
 if(w.phase==='tell'&&w.timer>=w.duration){
   w.timer=0;
   if(w.kind==='feint'){w.phase='retract';w.duration=.16;AU.play('whoosh');}
   else {w.phase='strike';w.duration=.22;w.resolved=false;AU.play('whoosh');}
 }else if(w.phase==='strike'){
   if(!w.resolved&&w.timer>=.09){w.resolved=true;
     const avoid=w.kind==='hook'?[w.hand==='L'?'R':'L','duck']:w.kind==='upper'?['L','R']:['L','R','block'];
     const hp=p.hp,ok=B.fight.practice.attack(fight,{...w.move,from:w.hand,dmg:{jab:8,cross:11,hook:14,upper:17}[w.kind]||8,avoid});
     syncPlayer(s);
     if(ok){w.defended++;w.h.streak(4);}
     else {w.lastDamage=hp-p.hp;w.hitAt=w.clock;failure(s,'Regarde le coup et défends-toi au bon moment !');
       if(p.hp<=0){w.ko=true;w.phase='ko';w.timer=0;G.finish();return;}
     }
   }
   if(w.timer>=w.duration)finishMove(s);
 }else if(w.phase==='retract'&&w.timer>=w.duration)finishMove(s);
 else if(w.phase==='open'&&w.timer>=w.duration){w.phase='wait';w.timer=0;w.duration=.55;}
 else if(w.phase==='hit'&&w.timer>=w.duration){w.phase='wait';w.timer=0;w.duration=.6;}
};
function finishMove(s){const w=s.work;if(w.index<w.plan.length)nextMove(s);else{w.phase='open';w.timer=0;w.duration=G.tune(s,[1.3,.85,.65]);w.h.msg('OUVERTURE ! Z / X','#9ce7bb',36);AU.play('glint');}}
X.draw=(c,s,T)=>{if(s.mode!=='sparring')return old.draw(c,s,T);const w=s.work,ph={tell:'tell',strike:'strike',retract:'tell',open:'rec',hit:'hitstun',wait:'idle',ko:'idle'}[w.phase];
 const t=w.phase==='retract'?1-w.timer/w.duration:w.timer/w.duration;
 const frame={ph,t:A.clamp(t,0,1),time:T,move:w.move,guard:'high',familyId:w.coach.id,react:w.phase==='hit'?{kind:'head',side:1,k:1-t}:null};
 if(ph==='strike'){
   const r=A.pose(w.boxer,frame),g=r.g[w.hand==='L'?0:1],reach=A.eout(Math.min(1,t*3));
   g.y=A.lerp(g.y,(A.ringHeadY(s.ch)-570)/.88,reach);g.x=A.lerp(g.x,w.hand==='L'?-12:12,reach);frame.R=r;
 }
 G.drawSparringCoach(c,w.coach,T,frame,w.boxer);
 if(w.phase==='open'){c.save();c.strokeStyle='#9ce7bb';c.lineWidth=4;c.beginPath();c.ellipse(640,360,110,145,0,0,Math.PI*2);c.stroke();c.restore();}
 const p=w.combat.p;
 A.player(c,s.ch,{...p,t:p.st==='upper'?p.t:p.t/Math.max(.01,p.dur),time:T,inRing:true,hitPower:1+(w.lastDamage||0)/30});
 c.save();c.font='900 21px Nunito';c.textAlign='right';c.fillStyle='#ffe6a3';c.fillText(w.seriesName||'Prépare ta garde',1240,150);c.restore();
};
})(window);
