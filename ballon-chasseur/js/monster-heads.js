// Portraits illustrés : rectangles de l'atlas, ajustés pour conserver oreilles et coiffures.
(function(root){
  'use strict';
  const bounds={goblin:[23,31,365,313],lizard:[403,32,302,326],witch:[720,5,391,369],skeleton:[1128,30,288,334],orc:[32,349,314,365],harpy:[374,377,327,346],beast:[715,367,375,361],slime:[1100,411,331,291],specter:[25,720,332,352],troll:[380,721,338,340],gnoll:[735,726,350,343],mandrake:[1098,708,341,358]};
  const dimensions={goblin:[38,33],lizard:[32,34],witch:[40,39],skeleton:[30,34],orc:[34,37],harpy:[34,36],beast:[36,36],slime:[42,37],specter:[35,38],troll:[37,37],gnoll:[35,35],mandrake:[35,37]};
  const img=new Image();let ready=false;
  const F=root.MonsterHeads={has:id=>ready&&!!bounds[id]};
  F.ready=new Promise(resolve=>{let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);ready=ok;resolve(ok);};const timer=setTimeout(()=>finish(false),10000);img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=root.MONSTER_HEAD_SOURCE;});
  F.draw=(ctx,id,x,y,r)=>{if(!F.has(id))return false;const [sx,sy,sw,sh]=bounds[id],[bw,bh]=dimensions[id],scale=r/12,w=bw*scale,h=bh*scale;
    // Tous les mentons restent sur le col ; les coiffures montent au-dessus.
    const bottom=y+(id==='slime'?18:12)*scale;ctx.drawImage(img,sx,sy,sw,sh,x-w/2,bottom-h,w,h);return true;};
})(window);
