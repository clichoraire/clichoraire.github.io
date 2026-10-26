// Assemblage des textures illustrées : buste/jambes et bras à deux articulations.
(function(root){
  'use strict';
  const B={goblin:[68,31,253,312],lizard:[398,23,275,328],witch:[756,32,296,311],skeleton:[1128,11,276,341],orc:[38,366,322,345],harpy:[384,384,319,327],beast:[745,367,311,339],slime:[1102,381,314,324],specter:[38,722,313,350],troll:[398,719,308,348],gnoll:[760,719,292,350],mandrake:[1107,721,310,348]};
  const A={goblin:[148,9,132,344,65,41,93,172,58,281],lizard:[496,9,142,347,64,42,100,173,78,284],witch:[861,9,140,350,72,42,86,175,75,286],skeleton:[1208,11,136,346,71,41,99,173,84,283],orc:[116,364,184,347,78,42,129,173,96,284],harpy:[490,363,175,351,70,42,116,175,62,287],beast:[856,366,184,347,73,42,120,173,76,284],slime:[1217,369,157,345,78,41,109,172,64,282],specter:[110,720,242,349,103,42,152,174,135,285],troll:[488,719,188,352,66,42,121,176,86,288],gnoll:[860,721,167,348,69,42,111,174,77,285],mandrake:[1216,722,169,350,68,42,109,175,80,286]};
  const body=new Image(),arm=new Image();let ready=false;
  const F=root.MonsterBodyArt={has:id=>ready&&!!B[id]};
  const load=(img,src)=>new Promise(resolve=>{let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);resolve(ok);};const timer=setTimeout(()=>finish(false),10000);img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=src;});
  F.ready=Promise.all([load(body,root.MONSTER_BODY_SOURCE),load(arm,root.MONSTER_ARM_SOURCE)]).then(results=>ready=results.every(Boolean));
  F.body=(c,id,width,height,moving,frame,pose)=>{
    if(!F.has(id))return false;const [sx,sy,sw,sh]=B[id],x=-width/2,y=-height+2;
    if(!moving||['slime','specter','witch'].includes(id)||pose==='down')c.drawImage(body,sx,sy,sw,sh,x,y,width,height);
    else{
      // Deux jambes indépendantes, avec raccord couvert sous la ceinture.
      const cut=Math.round(sh*.63),topH=height*cut/sh;
      for(const side of [-1,1]){const half=sw/2,px=side<0?0:half,dx=side<0?x:0,pivot=side*width*.22;
        c.save();c.translate(pivot,y+topH);c.rotate(Math.sin(frame)*side*.13);
        c.drawImage(body,sx+px,sy+cut-3,half,sh-cut+3,dx-pivot,-3*height/sh,width/2,height-topH+3*height/sh);c.restore();}
      c.drawImage(body,sx,sy,sw,cut+3,x,y,width,topH+3*height/sh);
    }
    return true;
  };
  // Adapter un morceau source à un os cible, sans étirer les doigts ni les textures.
  const segment=(c,r,from,to,srcA,srcB,lo,hi,mirror)=>{
    const [sx,sy,sw]=r,dx=to[0]-from[0],dy=to[1]-from[1];
    const ux=(srcB[0]-srcA[0])*mirror,uy=srcB[1]-srcA[1],scale=Math.hypot(dx,dy)/Math.hypot(ux,uy);
    c.save();c.translate(...from);c.rotate(Math.atan2(dy,dx)-Math.atan2(uy,ux));c.scale(mirror*scale,scale);
    c.drawImage(arm,sx,sy+lo,sw,hi-lo,-srcA[0],lo-srcA[1],sw,hi-lo);c.restore();
  };
  F.arm=(c,id,shoulder,elbow,wrist,side,handOnly=false)=>{
    if(!F.has(id))return false;const r=A[id],a=[r[4],r[5]],e=[r[6],r[7]],h=[r[8],r[9]],mirror=side;
    if(!handOnly)segment(c,r,shoulder,elbow,a,e,0,e[1]+8,mirror);
    segment(c,r,elbow,wrist,e,h,handOnly?h[1]-6:e[1]-8,r[3],mirror);
    return true;
  };
})(window);
