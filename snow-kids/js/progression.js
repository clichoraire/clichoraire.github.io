// Cumulative XP and unspent training points belong to one character profile.
(function(SK){
 'use strict';
 const P=SK.Progression={};
 P.info=save=>{let remaining=Math.max(0,Math.floor(Number(save.xp)||0)),level=1;
  while(remaining>=100+50*(level-1)){remaining-=100+50*(level-1);level++;}
  return {level,current:remaining,needed:100+50*(level-1),points:Math.max(0,Math.floor(Number(save.trainingPoints)||0))};
 };
 P.award=(save,amount)=>{amount=Math.max(0,Math.floor(Number(amount)||0));const before=P.info(save);
  save.xp=Math.max(0,Math.floor(Number(save.xp)||0))+amount;const after=P.info(save),points=(after.level-before.level)*2;
  save.trainingPoints=before.points+points;return {xp:amount,levels:after.level-before.level,level:after.level,points};
 };
 P.reward=({finished,practice,success,rank=0})=>!finished?0:practice?(success?60:0):40+Math.max(0,3-rank)*10;
})(window.SK);
