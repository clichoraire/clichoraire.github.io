// Silhouettes dessinées en canvas, contours doux et couleurs du jeu.
(function(BK){
const S=BK.sprites,TAU=Math.PI*2;
S.drawBestiary=function(ctx,type,o={}){
 const E=BK.ENEMIES[type],b=E.bestiary,t=o.t||0,c=o.hurt>0&&Math.floor(t*20)%2?'#fff':b.color,dark='#343348',light='#fff0c8';
 ctx.save();const scale=(o.s||60)/100*(E.boss?1.65:b.id==='alt_gargantuan_ball'?1.5:1);ctx.scale(o.flip?-scale:scale,scale);ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=dark;
 if(o.state==='hidden'){ctx.globalAlpha*=.5;oval(0,-3,24,6,'#ad8356');ctx.restore();return;}
 if(b.action==='creeper'&&o.charging)ctx.globalAlpha=.65+.35*Math.sin(t*35);
 const bob=Math.sin(t*4)*2;ctx.translate(0,bob);
 function oval(x,y,rx,ry,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();ctx.stroke();}
 function box(x,y,w,h,col,r=5){ctx.fillStyle=col;S.rr(ctx,x,y,w,h,r);ctx.fill();ctx.stroke();}
 function poly(pts,col){ctx.fillStyle=col;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();}
 function line(pts,col=dark,w=3){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle=dark;}
 function eye(x,y,r=7){oval(x,y,r,r*1.12,'#fff');oval(x+1,y+1,r*.4,r*.6,dark);}
 function eyes(y=-42){eye(-10,y,6);eye(10,y,6);line([[-16,y-9],[-5,y-6]]);line([[5,y-6],[16,y-9]]);}
 function feet(){oval(-15,-5,13,7,dark);oval(15,-5,13,7,dark);}
 function crown(){poly([[-22,-68],[-25,-85],[-10,-76],[0,-89],[10,-76],[25,-85],[22,-68]],'#ffd65b');}
 const shape=b.shape;
 if(shape==='creeper'){
  box(-18,-46,36,33,c,2);box(-27,-76,54,35,c,3);box(-23,-15,18,17,c,2);box(5,-15,18,17,c,2);
  ctx.fillStyle='#254d35';for(const [x,y]of[[-17,-68],[8,-68],[-5,-59],[-13,-51],[5,-51]])ctx.fillRect(x,y,10,10);
  ctx.fillStyle='#a5db70';for(const [x,y]of[[-22,-73],[15,-47],[-14,-31],[5,-24]])ctx.fillRect(x,y,7,7);
 }else if(['soldier','armor','rogue','skeleton','mummy','mage'].includes(shape)){
  feet();box(-21,-43,42,33,c);oval(-27,-31,9,12,c);oval(27,-31,9,12,c);
  if(shape==='mage'){poly([[-25,-12],[-21,-56],[0,-71],[21,-56],[29,-9]],c);poly([[-27,-57],[0,-91],[27,-57]],c);oval(0,-53,16,12,dark);eye(-7,-53,4);eye(7,-53,4);line([[31,-4],[31,-72]],'#986845',5);oval(31,-75,9,9,'#b5ecff');}
  else if(shape==='skeleton'){oval(0,-61,22,21,light);oval(-9,-63,6,8,dark);oval(9,-63,6,8,dark);box(-12,-48,24,9,light,1);for(let i=-7;i<=7;i+=7)line([[i,-49],[i,-40]]);for(let y=-34;y<-10;y+=8)line([[-15,y],[15,y]],light,4);}
  else if(shape==='mummy'){oval(0,-63,22,20,c);for(let y=-75;y<-12;y+=9)line([[-18,y],[19,y+4]],'#b0a792',3);box(-17,-66,34,11,dark,2);eye(-8,-60,4);eye(8,-60,4);}
  else {oval(0,-63,24,23,c);box(-18,-65,36,15,shape==='rogue'?dark:'#edba8a',3);eye(-9,-58,4);eye(9,-58,4);poly([[-23,-70],[-33,-85],[-32,-64],[-20,-60]],light);poly([[23,-70],[33,-85],[32,-64],[20,-60]],light);box(-6,-87,12,16,c,3);box(-20,-24,40,8,dark,2);box(-4,-25,8,10,'#ffd657',2);}
  if(b.action==='bomb'){oval(31,-58,16,17,'#81bb42');line([[28,-73],[24,-84]],dark,3);oval(24,-84,3,3,'#fff492');}
  else if(b.action==='arrow'){ctx.strokeStyle='#b47a43';ctx.lineWidth=5;ctx.beginPath();ctx.arc(30,-40,24,-1.5,1.5);ctx.stroke();line([[32,-64],[32,-17]],light,1);line([[20,-40],[57,-40]],'#d7bd84',3);poly([[61,-40],[50,-47],[50,-33]],'#dce7e5');}
  else if(b.action==='spear'){line([[32,0],[32,-83]],'#b47a43',5);poly([[32,-98],[23,-78],[41,-78]],'#dae9ed');}
  else if(b.action==='flail'){line([[27,-30],[48,-43],[62,-25]],'#adb8c3',5);oval(62,-22,13,13,'#71849a');}
  else if(b.weapon==='cannon'){box(22,-45,34,18,'#df5d62',4);oval(56,-36,5,9,dark);}
  else if(['charge','chase'].includes(b.action)){poly([[26,-27],[29,-72],[36,-80],[43,-72],[38,-27]],'#dce8ef');line([[23,-26],[46,-26]],'#ffcf55',5);}
 }else if(['worm','snake','slug','cactus'].includes(shape)){
  const n=shape==='slug'?3:5;for(let i=n-1;i>=0;i--){const x=shape==='cactus'?0:Math.sin(t*4-i*.7)*12-i*7+12,y=shape==='cactus'?-12-i*14:-12-i*6;oval(x,y,shape==='slug'?21:15,14,c);if(shape==='cactus')for(const k of [-1,1])line([[k*12,y],[k*20,y-5]],light,2);}
  const x=shape==='cactus'?0:Math.sin(t*4)*12+12,y=shape==='cactus'?-70:-24;oval(x,y,19,18,c);eye(x-8,y-4,5);eye(x+8,y-4,5);if(shape==='snake')line([[x,y+12],[x+14,y+15],[x+18,y+11]],'#ef5879',3);
 }else if(['bird','bat','bee','moth'].includes(shape)){
  const flap=Math.sin(t*8)*11;
  if(shape==='moth'){for(const k of [-1,1]){oval(k*27,-48+flap,25,25,c);oval(k*27,-22,22,17,c);oval(k*29,-48+flap,10,11,'#e8cb63');oval(k*29,-48+flap,5,6,dark);}}
  else if(shape==='bat'){for(const k of [-1,1])poly([[k*10,-45],[k*48,-60+flap],[k*41,-20],[k*26,-34],[k*13,-20]],c);}
  else if(shape==='bee'){oval(-23,-44+flap,20,11,'#d9f7ff');oval(23,-44-flap,20,11,'#d9f7ff');}
  else for(const k of [-1,1])poly([[k*9,-42],[k*46,-57+flap],[k*33,-24]],c);
  oval(0,-29,18,26,c);if(shape==='bee'){line([[-15,-25],[15,-25]],dark,7);line([[-12,-12],[12,-12]],dark,6);}oval(0,-52,19,16,c);eyes(-54);if(shape==='bird')poly([[-6,-43],[0,-31],[9,-43]],'#f2c35b');
 }else if(['crab','spider','beetle','turtle','antlion','helmasaur'].includes(shape)){
  for(const k of [-1,1])for(let i=0;i<3;i++)line([[k*17,-15-i*9],[k*36,-5-i*14],[k*42,-11-i*14]],c,6);
  oval(0,-25,28,24,c);if(['turtle','beetle','helmasaur'].includes(shape)){oval(0,-31,23,19,shape==='turtle'?'#ad8b4e':c);line([[0,-48],[0,-15]],light,2);}
  if(shape==='helmasaur'){poly([[-32,-34],[-30,-67],[0,-78],[30,-67],[32,-34]],'#dae1e8');for(const k of [-1,1])poly([[k*20,-60],[k*33,-87],[k*30,-49]],light);}
  if(shape==='crab')for(const k of [-1,1]){line([[k*20,-33],[k*35,-49]],c,6);oval(k*38,-53,12,14,c);line([[k*38,-65],[k*38,-54]],dark,3);}
  eyes(shape==='helmasaur'?-50:-30);
 }else if(['cyclops','boar','centaur','lizard','fish','penguin','rat','mole'].includes(shape)){
  feet();if(shape==='centaur'){oval(0,-18,35,14,c);for(const x of [-29,-12,15,30])box(x-4,-12,8,15,c,2);}
  oval(0,-29,25,27,c);if(shape==='penguin')oval(0,-25,15,22,light);
  if(['lizard','fish'].includes(shape))poly([[20,-10],[42,-20],[32,-34]],c);
  oval(0,-60,26,22,c);
  if(shape==='cyclops')eye(0,-62,13);else eyes(-63);
  if(shape==='boar'){oval(0,-47,15,10,'#f0b3a9');oval(-5,-47,2,3,dark);oval(5,-47,2,3,dark);for(const k of [-1,1])poly([[k*15,-43],[k*20,-56],[k*23,-40]],light);}
  if(shape==='rat'||shape==='mole'){oval(-20,-79,12,12,c);oval(20,-79,12,12,c);oval(0,-43,8,6,'#efa4aa');}
  if(shape==='penguin'||shape==='fish')poly([[-9,-47],[0,-37],[10,-47]],'#f3b85d');
  if(shape==='lizard'){poly([[-20,-78],[-10,-93],[0,-81],[13,-91],[22,-75]],'#f4c45c');line([[-16,-45],[16,-45]],light,4);}
  if(b.action==='spear'||b.id==='alt_ganon'){line([[32,0],[32,-90]],'#ca9a4b',5);line([[20,-88],[20,-73],[44,-73],[44,-88]],'#eee9c7',4);}
 }else if(['eye','eyes','iceeye','ice','blob','sand','ghost','jelly','octopus','shadow','plant','chomp'].includes(shape)){
  if(shape==='plant'){line([[0,-4],[0,-38]],'#50864b',7);oval(-19,-17,20,8,'#70ba59');oval(19,-25,20,8,'#70ba59');oval(0,-51,27,22,c);eyes(-54);line([[-17,-41],[17,-41]],light,5);}
  else {if(['octopus','jelly'].includes(shape))for(let i=0;i<5;i++)line([[-22+i*11,-15],[-26+i*13+Math.sin(t*5+i)*4,0]],c,7);
   if(shape==='ice')poly([[-29,0],[-30,-54],[-10,-77],[23,-65],[32,-6]],'#9ae3f4');else oval(0,-30,30,shape==='sand'?22:30,c);
   if(['eye','eyes','iceeye'].includes(shape)){eye(0,-33,17);if(shape==='iceeye'){ctx.globalAlpha*=.4;box(-34,-70,68,72,'#a3edff',12);ctx.globalAlpha/= .4;}}
   else eyes(-36);
   if(shape==='chomp'){box(-22,-25,44,13,dark,3);for(let i=-18;i<20;i+=9)poly([[i,-25],[i+8,-25],[i+4,-15]],light);}
   if(shape==='eyes')for(let i=0;i<5;i++){const a=t+i*TAU/5;eye(Math.cos(a)*36,-32+Math.sin(a)*25,6);}
   if(shape==='ghost')line([[-24,-9],[-14,-2],[-4,-9],[6,-2],[16,-9],[24,-4]],light,3);
  }
 }else if(shape==='dragon'){
  oval(0,-24,38,26,c);for(const [x,col]of[[-30,'#ef7559'],[0,c],[30,'#78cbea']]){line([[x/2,-30],[x,-63]],col,14);oval(x,-72,18,19,col);eye(x-6,-74,4);eye(x+6,-74,4);poly([[x-13,-84],[x-18,-101],[x-3,-88]],light);poly([[x+13,-84],[x+18,-101],[x+3,-88]],light);}
 }else if(['skull','skulls','medusa'].includes(shape)){
  if(shape==='medusa')for(let i=-2;i<=2;i++)line([[i*9,-52],[i*16,-73],[i*18+7,-84]],c,7);
  oval(0,-35,26,28,c);oval(-10,-41,7,10,dark);oval(10,-41,7,10,dark);box(-17,-18,34,13,light,2);for(let x=-10;x<=10;x+=10)line([[x,-18],[x,-5]]);
 }else if(shape==='hand'){
  box(-23,-38,46,30,c,13);for(let i=0;i<4;i++)box(-23+i*12,-72+(i%3)*5,11,43,c,6);box(21,-40,13,25,c,6);
 }else if(['turret','cannon'].includes(shape)){
  box(-29,-17,58,17,'#757e8c',4);box(-22,-56,44,40,c,6);if(shape==='turret'){oval(0,-58,27,19,c);eye(0,-58,12);}else{box(-12,-69,44,25,c,4);oval(32,-57,8,12,dark);}
 }else if(shape==='tile'){poly([[-28,-9],[-24,-54],[24,-65],[31,-19]],c);poly([[-18,-20],[-16,-46],[16,-53],[21,-26]],'#d4a95f');}
 else if(shape==='roller'){box(-34,-39,68,33,c,9);for(let x=-25;x<35;x+=17)poly([[x,-38],[x+6,-56],[x+12,-38]],light);}
 else if(shape==='spikes'){box(-26,-40,52,37,c,4);for(const k of [-1,1])poly([[k*23,-35],[k*42,-26],[k*23,-17]],light);poly([[-12,-40],[0,-61],[12,-40]],light);}
 else if(shape==='bumper'){oval(0,-19,32,18,c);oval(0,-24,21,12,'#ffd65b');oval(0,-26,10,6,light);}
 else {oval(0,-29,28,28,c);if(shape==='orb'||shape==='firebar'){oval(0,-29,16,17,'#fff0a7');for(let i=0;i<6;i++){const a=t*2+i*TAU/6;line([[Math.cos(a)*31,-29+Math.sin(a)*31],[Math.cos(a)*39,-29+Math.sin(a)*39]],'#ffd666',3);}}else{oval(-9,-39,8,6,'#d2d9e0');}}
 if(o.charged){ctx.strokeStyle='#fff18a';ctx.lineWidth=3;for(const k of [-1,1]){ctx.beginPath();ctx.moveTo(k*32,-55);ctx.lineTo(k*43,-43);ctx.lineTo(k*34,-30);ctx.lineTo(k*44,-17);ctx.stroke();}}
 if(E.boss&&shape!=='dragon')crown();
 if(o.warning){ctx.fillStyle='#ffdc60';ctx.font='900 24px sans-serif';ctx.textAlign='center';ctx.fillText('!',0,-103);}
 ctx.restore();
};
const shot=S.drawShot;
S.drawShot=function(ctx,s,k,t){if(!s.legendArrow)return shot(ctx,s,k,t);ctx.save();ctx.rotate(s.a);ctx.strokeStyle='#865332';ctx.lineWidth=Math.max(2,k*.06);ctx.beginPath();ctx.moveTo(-k*.3,0);ctx.lineTo(k*.28,0);ctx.stroke();ctx.fillStyle='#e6eced';ctx.beginPath();ctx.moveTo(k*.42,0);ctx.lineTo(k*.15,-k*.12);ctx.lineTo(k*.15,k*.12);ctx.closePath();ctx.fill();ctx.restore();};
const render=BK.World.prototype.renderArenaEffects;
BK.World.prototype.renderArenaEffects=function(ctx,cam,time,push){
 render.call(this,ctx,cam,time,push);
 for(const e of this.enemies){if(e.dead||!e.def.bestiary)continue;
  if(e.warning)push(e.warning.y+.02,e.warning.x,()=>{const q=e.warning,p=cam.project(q.x,q.y,this.groundZ(q.x,q.y)+.03);ctx.save();ctx.strokeStyle='#ffb54e';ctx.fillStyle='rgba(255,90,70,.18)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,p.k*.8,p.k*.45,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore();});
  for(const q of e.orbitPoints||[])push(q.y,q.x,()=>{const p=cam.project(q.x,q.y,this.groundZ(e.x,e.y)+.3),origin=cam.project(e.x,e.y,this.groundZ(e.x,e.y)+.3);ctx.save();ctx.strokeStyle='#7d8799';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle=e.def.bestiary.shape==='firebar'?'#ff9a36':e.def.color;ctx.beginPath();ctx.arc(p.x,p.y,p.k*.18,0,TAU);ctx.fill();ctx.restore();});
  if(e.beam&&e.beam.t>0)push(e.y+.02,e.x,()=>{let reach=0;for(let d=.2;d<8;d+=.2){const q={x:e.x+Math.cos(e.beam.a)*d,y:e.y+Math.sin(e.beam.a)*d};if(!this.canSee(e,q,8))break;reach=d;}const a=cam.project(e.x,e.y,this.groundZ(e.x,e.y)+.4),b=cam.project(e.x+Math.cos(e.beam.a)*reach,e.y+Math.sin(e.beam.a)*reach,this.groundZ(e.x,e.y)+.4);ctx.save();ctx.strokeStyle='#ff658b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();});
 }
};
})(window.BK);
