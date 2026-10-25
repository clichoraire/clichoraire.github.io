// Collectible family memories, saved independently for each adventure.
(function(SK){
 const P=SK.PhotoPuzzles={},files=['jay','jo','couple','grandsparents','edison'];
 P.photos=files.map((id,i)=>({id,src:'assets/shop-photos/'+id+'-cartoon.png',name:['Famille de Jay','Souper chez Jo','Mickaël et Marie','Josée et Richard','Edison'][i]}));
 P.ids=()=>SK.CUPS.flatMap(c=>c.tracks.map((_,i)=>c.id+':course:'+i));
 P.normalize=save=>{const ids=P.ids(),old=save.photoPieces||[];if(old.some(id=>!ids.includes(id))){const count=Math.min(old.length,ids.length);const kept=[...new Set(old.filter(id=>ids.includes(id)))];for(const id of ids){if(kept.length>=count)break;if(!kept.includes(id))kept.push(id);}save.photoPieces=kept;}return save.photoPieces||[];};
 P.parts=(save,photo)=>P.ids().filter((_,i)=>i%5===photo).map(id=>P.normalize(save).includes(id));
 P.collect=(save,id)=>{P.normalize(save);if(!P.ids().includes(id)||(save.photoPieces||[]).includes(id))return false;(save.photoPieces||(save.photoPieces=[])).push(id);return true;};
 const images=new Map();
 const img=photo=>{if(!images.has(photo.id)){const im=new Image();im.src=photo.src;images.set(photo.id,im);}return images.get(photo.id);};
 P.draw=(c,save,photoIndex,x,y,w,h)=>{
  const photo=P.photos[photoIndex],im=img(photo),parts=P.parts(save,photoIndex);
  c.save();c.fillStyle='#624127';c.fillRect(x-6,y-6,w+12,h+12);c.fillStyle='#0d1420';c.fillRect(x,y,w,h);
  if(im.complete&&im.naturalWidth){const ratio=Math.max(w/im.width,h/im.height),dw=im.width*ratio,dh=im.height*ratio;
   for(let i=0;i<parts.length;i++){c.save();c.beginPath();const cols=Math.min(3,parts.length-Math.floor(i/3)*3);c.rect(x+i%3*w/cols,y+Math.floor(i/3)*h/Math.ceil(parts.length/3),w/cols,h/Math.ceil(parts.length/3));c.clip();if(parts[i])c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);c.restore();}
  }
  c.strokeStyle='#ffffff18';c.lineWidth=1;const rows=Math.ceil(parts.length/3);for(let row=0;row<rows;row++){const cols=Math.min(3,parts.length-row*3);for(let col=1;col<cols;col++){c.beginPath();c.moveTo(x+w*col/cols,y+h*row/rows);c.lineTo(x+w*col/cols,y+h*(row+1)/rows);c.stroke();}if(row){c.beginPath();c.moveTo(x,y+h*row/rows);c.lineTo(x+w,y+h*row/rows);c.stroke();}}
  c.restore();
 };
 P.decorate=(frame,save,src)=>{
  const n=P.photos.findIndex(p=>p.src===src);if(n<0)return;
  const mask=document.createElement('span');mask.className='photo-puzzle-mask';mask.style.gridTemplateRows='repeat('+Math.ceil(P.parts(save,n).length/3)+',1fr)';
  for(const found of P.parts(save,n)){const tile=document.createElement('i');tile.style.background=found?'transparent':'#0d1420';if(P.parts(save,n).length===10&&mask.children.length===9)tile.style.gridColumn='1 / -1';mask.append(tile);}
  frame.append(mask);frame.title=P.photos[n].name+' · '+P.parts(save,n).filter(Boolean).length+'/'+P.parts(save,n).length+' morceaux';
  frame.addEventListener('click',()=>P.open(save,n));
 };
 P.open=(save,n)=>{
  document.getElementById('photo-album')?.remove();const d=document.createElement('dialog');d.id='photo-album';
  const title=document.createElement('h2'),canvas=document.createElement('canvas'),info=document.createElement('p'),close=document.createElement('button');
  title.textContent=P.photos[n].name;canvas.width=600;canvas.height=410;info.textContent=P.parts(save,n).filter(Boolean).length+' / '+P.parts(save,n).length+' morceaux — Trouve les pièces de casse-tête sur les pistes.';
  close.textContent='Fermer';close.onclick=()=>d.close();d.onclose=()=>d.remove();d.append(title,canvas,info,close);document.body.append(d);d.showModal();
  const paint=()=>P.draw(canvas.getContext('2d'),save,n,10,10,580,390);paint();img(P.photos[n]).addEventListener('load',paint,{once:true});
 };
 P.mount=(screen,save)=>{
  document.querySelectorAll('.room-memories').forEach(el=>el.remove());
  const names=['advselect','gym','museum','wardrobe','school','records'];if(screen==='museum'||!names.includes(screen))return;
  const host=screen==='advselect'?document.getElementById('adv-room'):(SK.RoomViews?.host(screen)||document.getElementById('screen-'+screen)),group=document.createElement('div');group.className='room-memories';
  const offset=names.indexOf(screen)%5;
  for(let i=0;i<2;i++){const n=(offset+i)%5,b=document.createElement('button'),c=document.createElement('canvas');b.title=P.photos[n].name;b.setAttribute('aria-label',P.photos[n].name+' — casse-tête');c.width=120;c.height=84;b.append(c);b.onclick=()=>P.open(save,n);group.append(b);const paint=()=>P.draw(c.getContext('2d'),save,n,6,6,108,72);paint();img(P.photos[n]).addEventListener('load',paint,{once:true});}
  // Les écrans sont déjà positionnés en absolu sur toute la fenêtre.
  // Garder ce positionnement : relative annule leur hauteur définie par inset.
  host.append(group);
 };
 P.drawPiece=(c,x,y,s,t)=>{
  c.save();c.translate(x,y-1.2*s+Math.sin(t*3)*s*.12);c.scale(s*.8,s*.8);c.shadowColor='#ffe85a';c.shadowBlur=12;c.fillStyle='#ffe260';c.strokeStyle='#9b5923';c.lineWidth=.08;
  c.beginPath();c.moveTo(-.6,-.6);c.lineTo(-.18,-.6);c.bezierCurveTo(-.4,-1.1,.4,-1.1,.18,-.6);c.lineTo(.6,-.6);c.lineTo(.6,-.18);c.bezierCurveTo(1.1,-.4,1.1,.4,.6,.18);c.lineTo(.6,.6);c.lineTo(-.6,.6);c.closePath();c.fill();c.stroke();c.restore();
 };
})(window.SK);
