// La viscosité du terrain dépend de la difficulté, pas du niveau de l'aventure.
(function(B){
'use strict';const P=B.Game.prototype,C=B.COURT;
B.SLIME_SPEED_THRESHOLDS=[10,11,12,13,15];
P.slimeSpeedThreshold=function(){return this.mode!=='practice'&&!this.practice&&this.teams.some(t=>t.species==='slime'&&!t.boss)?B.SLIME_SPEED_THRESHOLDS[this.difficulty]:0;};
P.slimeSpeedFactor=function(p){const required=this.slimeSpeedThreshold();if(!required||p.def.monster==='slime'||p.stats.speed>=required)return 1;return .45+.4*Math.max(0,p.stats.speed)/required;};
const speed=P.speedMul;P.speedMul=function(p){return speed.call(this,p)*this.slimeSpeedFactor(p);};
B.drawSlimeCourt=function(c,g,layer){const required=g.slimeSpeedThreshold();if(!required)return;c.save();
 if(layer==='ground'){
  const fill=c.createLinearGradient(C.left,C.top,C.right,C.bottom);fill.addColorStop(0,'#3cbd548c');fill.addColorStop(.5,'#8cd743a1');fill.addColorStop(1,'#277d4599');c.fillStyle=fill;c.fillRect(C.left,C.top,C.right-C.left,C.bottom-C.top);
  for(let i=0;i<28;i++){const x=C.left+20+(i*137)%(C.right-C.left-40),y=C.top+15+(i*71)%(C.bottom-C.top-30),r=5+(i%5)*3+Math.sin(g.time*1.7+i)*2;c.fillStyle='#b5f77c24';c.strokeStyle='#dbffa645';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,r,r*.45,0,0,Math.PI*2);c.fill();c.stroke();}
  c.strokeStyle='#dfff9160';c.lineWidth=3;for(let i=0;i<7;i++){const y=C.top+25+i*(C.bottom-C.top-50)/6;c.beginPath();c.moveTo(C.left+5,y);for(let x=C.left+5;x<C.right;x+=30)c.lineTo(x,y+Math.sin(x*.018+g.time*.6+i)*7);c.stroke();}
 }else{
  c.fillStyle='#152b26e8';c.fillRect(B.W/2-225,176,450,29);c.fillStyle='#d6ff9d';c.font='bold 14px Arial';c.textAlign='center';c.fillText('SOL GLUANT · VITESSE '+required+' POUR MARCHER NORMALEMENT',B.W/2,195);
  for(const p of g.players)if(p.alive&&p.zone==='in'&&g.slimeSpeedFactor(p)<1){c.strokeStyle='#b8f578';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,22,8,0,0,Math.PI*2);c.stroke();c.fillStyle='#d8ffae';c.font='bold 10px Arial';c.fillText('RALENTI',p.x,p.y+22);}
 }c.restore();};
})(window.BC);
