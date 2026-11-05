/* One set of vector drawings for the shop illustrations and equipped flight gear. */
(function(root){
const Launch=typeof module!=='undefined'?require('./launch-gear.js'):root.GGLaunch;
// Raster illustrations shared by the shop and the game. Bounds are measured once.
let launchAtlas=null,atlasBounds=[{"x": 17, "y": 98, "w": 210, "h": 95}, {"x": 256, "y": 97, "w": 209, "h": 98}, {"x": 491, "y": 101, "w": 219, "h": 91}, {"x": 733, "y": 101, "w": 219, "h": 91}, {"x": 970, "y": 99, "w": 222, "h": 89}, {"x": 15, "y": 329, "w": 210, "h": 147}, {"x": 257, "y": 334, "w": 207, "h": 139}, {"x": 491, "y": 335, "w": 209, "h": 136}, {"x": 729, "y": 349, "w": 219, "h": 112}, {"x": 970, "y": 349, "w": 221, "h": 112}, {"x": 11, "y": 611, "w": 219, "h": 112}, {"x": 251, "y": 611, "w": 219, "h": 112}, {"x": 495, "y": 612, "w": 214, "h": 103}, {"x": 734, "y": 612, "w": 214, "h": 103}, {"x": 969, "y": 614, "w": 224, "h": 99}, {"x": 10, "y": 879, "w": 223, "h": 97}, {"x": 255, "y": 879, "w": 218, "h": 100}, {"x": 488, "y": 874, "w": 225, "h": 104}, {"x": 728, "y": 859, "w": 224, "h": 119}, {"x": 968, "y": 852, "w": 225, "h": 142}, {"x": 10, "y": 1113, "w": 223, "h": 142}, {"x": 249, "y": 1134, "w": 226, "h": 99}, {"x": 490, "y": 1132, "w": 222, "h": 91}, {"x": 728, "y": 1126, "w": 225, "h": 98}, {"x": 970, "y": 1118, "w": 221, "h": 115}];
if(typeof Image!=='undefined'){launchAtlas=new Image();launchAtlas.src='assets/launch-illustrations.png';}
function illustratedHeight(level,scale=.55){if(typeof GGRiders!=='undefined'&&GGRiders.loaded)return GGRiders.objectHeight(level,220*scale);const b=atlasBounds[level];const caps={shield:48,pan:44,tray:36,soap:42,butter:48,skate:40,skates:32,sled:45,cauldron:75,carpet:20,rune:24,gargoyle:38,meteor:44};return b?(Launch.get(level).type==='shield'?220*scale*b.h/b.w:Math.min(220*scale*b.h/b.w,(caps[Launch.get(level).type]||40)*scale/.55)):24;}
function oilFilm(ctx,x,y,w,h,under=false){
 ctx.save();ctx.translate(x,y);
 const blob=(px,py,rx,ry,alpha)=>{ctx.globalAlpha=alpha;ctx.beginPath();ctx.ellipse(px,py,rx,ry,0,0,Math.PI*2);ctx.fillStyle='#dceba0';ctx.fill();};
 if(under){
  blob(-w*.08,h*.57,w*.40,h*.15,.40);
  blob(-w*.36,h*.61,w*.13,h*.09,.27);
 }else{
  // Transparent oil inside the bowl, below the front rim and around its base.
  blob(-w*.10,h*.08,w*.34,h*.13,.48);
  for(let i=0;i<4;i++)blob(w*(-.36+i*.17),h*(.37+(i%2)*.035),w*.026,h*(.15+(i%2)*.05),.48);
  ctx.globalAlpha=.65;ctx.strokeStyle='#f4f7c6';ctx.lineWidth=Math.max(1,w*.007);
  ctx.beginPath();ctx.ellipse(-w*.13,h*.06,w*.22,h*.065,0,.15,2.7);ctx.stroke();
 }
 ctx.restore();
}
function drawIllustration(ctx,level,x,y,scale){
 const w=220*scale,h=illustratedHeight(level,scale);
 if(level===3)oilFilm(ctx,x,y,w,h,true);
 if(typeof GGRiders!=='undefined'&&GGRiders.drawObject(ctx,level,x,y,w)){if(level===3)oilFilm(ctx,x,y,w,h);return true;}
 const b=atlasBounds[level];if(!b||!launchAtlas?.complete||!launchAtlas.naturalWidth)return false;
 ctx.drawImage(launchAtlas,b.x,b.y,b.w,b.h,x-w/2,y-h*.35,w,h);if(level===3)oilFilm(ctx,x,y,w,h);return true;
}
function drawSkate(ctx,level,x,y,width=36,angle=0){if(typeof GGRiders!=='undefined'&&GGRiders.drawSkate(ctx,level,x,y,width,angle))return;
 const b=atlasBounds[level];if(!b)return;
 // Each atlas pair contains two matching undercarriages, without a replacement boot.
 const sw=b.w/2,h=width*b.h/sw;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(launchAtlas,b.x,b.y,sw,b.h,-width/2,-14,width,h);ctx.restore();
}
const edge='#35414a';
const shape=(d,fill,stroke=edge,width=3)=>({d,fill,stroke,width});
function launchShapes(level){
 const g=Launch.get(level),type=g.type,p=[];
 const oval=(fill,stroke=edge)=>shape('M -95 0 C -95 -48 95 -48 95 0 C 95 48 -95 48 -95 0 Z',fill,stroke);
 const deck=fill=>shape('M -100 -10 Q -85 10 -65 7 L 65 7 Q 85 10 100 -10 L 102 1 Q 85 24 65 20 L -65 20 Q -85 24 -102 1 Z',fill);
 const wheel=(x,color)=>shape(`M ${x-12} 34 a 12 12 0 1 0 24 0 a 12 12 0 1 0 -24 0`,color);
 if(type==='shield'){p.push(oval(level===0?'#a87645':'#c39155'),shape('M -48 -26 L -48 26 M 0 -34 L 0 34 M 48 -26 L 48 26','none','#70492e',3));if(level===0)p.push(shape('M -65 -22 L -50 -8 L -61 2 M 25 5 L 36 13 L 30 30','none','#593b2c',4));else p.push(oval('none','#a7adb4'),shape('M -70 -18 L 70 -18 M -70 18 L 70 18','none','#939eaa',7));}
 if(type==='pan'){p.push(oval(level===2?'#565862':'#343843'),shape('M 72 -7 L 112 -7 L 112 7 L 72 7 Z','#5b616b'),shape('M -65 -7 Q 0 -28 65 -7','none',level===3?'#d9a85c':'#8a919b',5));}
 if(type==='tray')p.push(oval('#dae5e8','#8694a0'),shape('M -77 0 C -77 -30 77 -30 77 0 C 77 30 -77 30 -77 0 Z','none','#f9ffff',4));
 if(type==='soap')p.push(oval(level===5?'#e967a4':'#e8adc9'),shape('M -80 -5 C -80 -38 80 -38 80 -5 C 80 22 -80 22 -80 -5 Z',level===5?'#ffa4cf':'#ffe0eb'),shape('M -60 -15 Q 0 -30 55 -15','none','#fff3f8',5));
 if(type==='butter')p.push(shape('M -88 -24 L 65 -24 L 93 -6 L 93 30 L -70 30 L -88 12 Z','#f7df79'),shape('M -88 -24 L -70 -6 L 93 -6 M -70 -6 L -70 30','none','#fff4b6',3));
 if(type==='skate'){const c=['#99958b','#a3b5c3','#b98749','#e64a48'][level-8];p.push(deck('#bb8853'),shape('M -91 -10 Q -77 2 -61 0 L 61 0 Q 77 2 91 -10','none','#634a76',8),shape('M -60 20 L -60 30 M 60 20 L 60 30','none','#74808b',6),wheel(-60,c),wheel(60,c));}
 if(type==='skates'){for(const x of [-50,50]){p.push(shape(`M ${x-32} -15 L ${x+23} -15 L ${x+35} 5 L ${x-32} 5 Z`,'#9daebd'),wheel(x-20,level===12?'#b5c2cc':'#e85654'),wheel(x+20,level===12?'#b5c2cc':'#e85654'));}if(level>=14)p.push(shape('M -90 0 L -114 -20 L -102 0 L -114 17 Z',level===14?'#74dafa':'#b49aff'));}
 if(type==='sled'){p.push(deck('#a46d42'),shape('M -80 22 L -80 36 Q -80 46 80 38 L 103 19','none','#a3b9c8',7),shape('M -50 8 L -50 34 M 50 8 L 50 34','none','#584333',5));if(level>=17)p.push(shape('M -100 -24 L -44 -24 L -44 1 L -100 1 Z','#778596'),shape('M -103 -22 L -115 -13 L -103 -3 Z','#89e3b4'));if(level===18)p.push(shape('M 35 -24 L 90 -24 L 90 1 L 35 1 Z','#778596'));}
 if(type==='cauldron'){p.push(shape('M -88 -30 Q -95 47 0 49 Q 95 47 88 -30 Z','#404552'),shape('M -92 -30 Q 0 -52 92 -30 Q 0 -8 -92 -30 Z','#77808c'),shape('M -70 22 L -96 36 L -70 41 M 70 22 L 96 36 L 70 41',level===19?'#6ee495':'#c287ed'));}
 if(type==='carpet')p.push(shape('M -106 -23 Q -50 -2 0 -17 Q 55 -36 106 -14 L 98 30 Q 45 12 0 28 Q -50 43 -106 21 Z','#9767a6','#eac867',5),shape('M -70 -5 L 0 14 L 70 -4','none','#ffe3a0',4));
 if(type==='rune')p.push(deck('#eddfb2'),shape('M -65 -7 L -50 -22 L -35 -7 M -9 -7 L 0 -25 L 9 -7 M 35 -7 L 50 -22 L 65 -7','none','#64d8eb',5));
 if(type==='gargoyle')p.push(shape('M -108 7 L -78 -28 L -30 -12 L 0 -30 L 30 -12 L 78 -28 L 108 7 L 70 18 L 30 7 L 0 25 L -30 7 L -70 18 Z','#96afb9','#4c626e'),shape('M -60 0 L 0 8 L 60 0','none','#a9f3e4',4));
 if(type==='meteor')p.push(shape('M -102 0 L -70 -30 L -22 -22 L 3 -36 L 72 -22 L 105 8 L 63 30 L -54 25 Z','#5f617d','#e8c677',5),shape('M -62 0 L -32 -15 L -4 7 L 30 -11 L 70 5','none','#fff0a1',5));
 return p;
}
function shapes(id,level){if(id==='launch')return launchShapes(level);const t=Math.min(3,level);
 if(id==='wing')return [
 [shape('M 65 -5 Q 8 -48 -87 -20 L -63 2 L -96 24 Q -28 8 65 -5','#d85142'),shape('M -64 -15 Q -10 -21 52 -6','none','#f89b6b',3)],
 [shape('M -105 -5 L 28 -62 L 105 -5 Q 64 -20 23 -6 Q -35 -24 -105 -5','#fff0c6'),shape('M -105 -5 L 28 -62 L -58 -16 Z','#d84c3f'),shape('M 28 -62 L 105 -5 L 73 -13 Z','#d84c3f'),shape('M -105 -5 L 28 -62 L 105 -5 M 28 -62 L 12 51 L 70 45 L 28 -62','none','#58402d',6),shape('M 12 51 L 70 45','none','#bd8a50',8)],
 [shape('M -7 16 L -39 -41 L -102 -59 L -83 -4 L -60 -12 L -51 15 L -28 10 L -14 38 Z','#8c9ca5'),shape('M 7 16 L 39 -41 L 102 -59 L 83 -4 L 60 -12 L 51 15 L 28 10 L 14 38 Z','#a8b7be'),shape('M -12 27 L -40 -32 L -91 -48 M 12 27 L 40 -32 L 91 -48','none','#4b606b',5),shape('M -13 -6 L 13 -6 L 13 37 L -13 37 Z','#665c58')],
 [shape('M -6 23 Q -46 -55 -106 -43 L -88 -22 L -101 -13 L -73 -2 L -82 12 L -53 18 L -55 31 L -24 30 L -9 47 Z','#d4f5ed'),shape('M 6 23 Q 46 -55 106 -43 L 88 -22 L 101 -13 L 73 -2 L 82 12 L 53 18 L 55 31 L 24 30 L 9 47 Z','#a3dfdf'),shape('M -7 34 Q -44 -18 -91 -31 M 7 34 Q 44 -18 91 -31','none','#438f9c',4),shape('M 0 -5 L 17 14 L 0 38 L -17 14 Z','#e8cb70')]
 ][t];
 // Boosters lie horizontally, nozzle to the left (behind the knight), front to the right.
 if(id==='boost')return [
 // 0 · Cruche de feu grégeois : amphore d'argile sanglée, bouchon de liège, flamme au goulot.
 [shape('M -118 0 L -132 -11 L -124 0 L -134 11 Z','#ffb347','#d9641f',2),shape('M -60 -36 Q -94 -32 -94 0 Q -94 32 -60 36 L 34 36 Q 76 36 94 12 L 94 -12 Q 76 -36 34 -36 Z','#c8884f'),shape('M -94 -15 L -116 -18 L -116 18 L -94 15 Z','#a66b3c'),shape('M -120 -20 L -112 -20 L -112 20 L -120 20 Z','#e8c28a'),shape('M -52 -26 Q 20 -34 70 -22','none','#eab57e',5),shape('M -24 -36 L -24 36 M 30 -36 L 30 36','none','#8a5a33',8),shape('M -24 -36 L -24 36 M 30 -36 L 30 36','none','#c99b66',3),shape('M 50 -36 Q 62 -56 76 -36','none','#8a5a33',5),shape('M 60 8 Q 62 26 54 34','none','#8f5a2e',4),shape('M -70 10 Q -60 22 -46 18 Q -40 30 -50 32','none','#8f5a2e',3),shape('M -90 -4 Q -100 2 -88 8','none','#ffd27a',3)],
 // 1 · Poudre explosive naine : fusée-tonneau cerclée de fer, ailerons, mèche allumée.
 [shape('M -82 -36 L -106 -56 L -106 -22 Z','#c94c3b'),shape('M -82 36 L -106 56 L -106 22 Z','#c94c3b'),shape('M -82 -16 L -100 -18 L -100 18 L -82 16 Z','#5d6670'),shape('M -82 -34 L 60 -34 L 60 34 L -82 34 Z','#9b6238'),shape('M -76 -24 L 54 -24','none','#b67a4b',4),shape('M -76 26 L 54 26','none','#6e4324',3),shape('M -64 -36 L -64 36 M 28 -36 L 28 36','none','#6f7b86',10),shape('M -64 -24 L -64 -24 M -64 22 L -64 22 M 28 -24 L 28 -24 M 28 22 L 28 22','none','#d6dde2',5),shape('M 60 -34 L 106 0 L 60 34 Z','#c94c3b'),shape('M 64 -22 L 92 0','none','#e8766b',4),shape('M -22 -16 L -4 0 L -22 16 L -40 0 Z','#f1c75d'),shape('M -22 -6 L -16 0 L -22 6 L -28 0 Z','#9b6238'),shape('M 0 -34 Q 4 -56 20 -58','none','#d8c9a3',4),shape('M 22 -66 L 26 -58 L 34 -56 L 26 -52 L 22 -44 L 18 -52 L 10 -56 L 18 -58 Z','#fff3a0','#ff8a2a',2)],
 // 2 · Essence de Tempête : bonbonne de verre cerclée de laiton, tempête bleue et éclair à l'intérieur.
 [shape('M -110 -14 L -126 -16 L -126 16 L -110 14 Z','#7f8a93'),shape('M -78 -38 L 70 -38 Q 98 -38 98 -12 L 98 12 Q 98 38 70 38 L -78 38 Q -100 38 -100 12 L -100 -12 Q -100 -38 -78 -38 Z','#5fbfdc'),shape('M -72 10 Q -42 -30 -6 2 Q 24 30 62 -8','none','#e8fbff',6),shape('M -64 20 Q -50 8 -34 20 Q -22 30 -6 22','none','#bfeeff',5),shape('M 12 -26 L -6 2 L 8 1 L -4 28 L 22 -6 L 8 -4 Z','#fff38a','#d8a21c',2),shape('M -70 -28 L 60 -28','none','#d9f7ff',5),shape('M -112 -28 L -90 -28 L -90 28 L -112 28 Z','#c9a048'),shape('M 86 -24 L 112 -24 L 112 24 L 86 24 Z','#c9a048'),shape('M -40 -38 L -40 38 M 30 -38 L 30 38','none','#7a5b32',8),shape('M -40 -38 L -40 38 M 30 -38 L 30 38','none','#c9a048',3)],
 // 3 · Essence de Tempête raffinée : deux bonbonnes jumelles sur une colonne de laiton, gemme centrale.
 [shape('M -112 -30 L -128 -32 L -128 -18 L -112 -16 Z','#7f8a93'),shape('M -112 16 L -128 18 L -128 32 L -112 30 Z','#7f8a93'),shape('M -82 -50 L 62 -50 Q 86 -50 86 -34 L 86 -18 Q 86 -2 62 -2 L -82 -2 Q -102 -2 -102 -18 L -102 -34 Q -102 -50 -82 -50 Z','#5fbfdc'),shape('M -82 2 L 62 2 Q 86 2 86 18 L 86 34 Q 86 50 62 50 L -82 50 Q -102 50 -102 34 L -102 18 Q -102 2 -82 2 Z','#7fd3ea'),shape('M -74 -22 Q -44 -46 -10 -24 Q 20 -6 54 -30','none','#e8fbff',5),shape('M -74 30 Q -44 6 -10 28 Q 20 46 54 22','none','#e8fbff',5),shape('M 24 -46 L 12 -28 L 22 -29 L 14 -8 L 32 -32 L 22 -31 Z','#fff38a','#d8a21c',2),shape('M -30 6 L -42 24 L -32 23 L -40 44 L -22 20 L -32 21 Z','#fff38a','#d8a21c',2),shape('M -74 -42 L 54 -42 M -74 10 L 54 10','none','#d9f7ff',4),shape('M -108 -4 L 100 -4 L 100 4 L -108 4 Z','#b48a3c'),shape('M -114 -40 L -92 -40 L -92 40 L -114 40 Z','#c9a048'),shape('M 76 -38 L 102 -38 L 102 38 L 76 38 Z','#c9a048'),shape('M -20 -50 L -20 50 M 40 -50 L 40 50','none','#7a5b32',7),shape('M -20 -50 L -20 50 M 40 -50 L 40 50','none','#c9a048',3),shape('M 4 -14 L 16 0 L 4 14 L -8 0 Z','#ff8fe3','#8b2c7a',2)]
 ][t];
 if(id==='launch')return [
 [shape('M -100 8 C -100 -31 100 -31 100 8 C 100 48 -100 48 -100 8 Z','#dd629f'),shape('M -100 -8 C -100 -48 100 -48 100 -8 C 100 32 -100 32 -100 -8 Z','#ffa4cf'),shape('M -76 -16 C -60 -34 36 -36 65 -22','none','#ffe1f0',5),shape('M -47 -5 C -35 -17 35 -17 47 -5 C 35 7 -35 7 -47 -5 Z','none','#e47eaf',2)],
 [shape('M -100 -15 Q -85 6 -65 5 L 65 5 Q 85 6 100 -15 L 102 -4 Q 88 18 66 17 L -66 17 Q -88 18 -102 -4 Z','#c98e54'),shape('M -94 -14 Q -82 -2 -64 -2 L 64 -2 Q 82 -2 94 -14','none','#64476e',9),shape('M -60 18 L -60 27 M 60 18 L 60 27','none','#72818b',7),shape('M -74 33 A 14 14 0 1 0 -46 33 A 14 14 0 1 0 -74 33 M 46 33 A 14 14 0 1 0 74 33 A 14 14 0 1 0 46 33','#f0c76c'),shape('M -63 33 L -57 33 M 57 33 L 63 33','none','#61473e',4)],
 [shape('M -18 -14 L 8 -14 L 37 53 L -49 53 Z','#a7794c'),shape('M -99 -34 Q 0 -7 99 -34 M -95 -34 L 0 16 L 95 -34','none','#62513f',6),shape('M -65 -8 L 65 -8 L 65 7 L -65 7 Z','#c19557')],
 [shape('M -33 50 L -5 -23 L 23 50 M -60 51 L 60 51','none','#84603e',11),shape('M -79 -46 L 90 9','none','#bb8e55',12),shape('M -94 -47 L -62 -47 L -62 -13 L -94 -13 Z','#81929b'),shape('M 90 9 L 101 41 L 68 45','none','#5c5142',4)]
 ][t];
 if(id==='armor')return [shape(`M -58 44 L -61 -12 Q -56 -54 4 -53 Q 55 -49 57 -10 L ${t>1?98:67} 2 L 60 47 Z`,['#929ca7','#b9c4cc','#c3d2db','#c9ecea'][t]),shape('M -31 -16 L 54 -16 L 57 -6 L -32 -6 Z','#27333d'),shape('M 15 9 L 15 30 M 30 9 L 30 30 M 45 9 L 45 30','none','#43535e',5),shape('M -42 -28 Q -24 -44 5 -43','none','#f2f3ea',5)];
 return [shape('M -70 -44 L -31 -53 Q 0 -29 31 -53 L 70 -44 L 54 -8 L 47 42 Q 0 66 -47 42 L -54 -8 Z',['#a0a8af','#b6c1c9','#a2bbce','#b9d9d6'][t]),shape('M 0 -25 L 0 48 M -46 -2 Q 0 21 46 -2','none','#607681',4),shape('M 0 -15 L 22 8 L 0 36 L -22 8 Z',t>1?'#e8c670':'#d5dce0')];
}
function svg(id,level){const stars=id!=='launch'&&level>3?`<text x="94" y="-43" fill="#835d24" font-size="15" font-weight="bold" text-anchor="end">+${level-3}</text>`:'';return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-115 -70 230 145" role="img"><g stroke-linecap="round" stroke-linejoin="round">${shapes(id,level).map(p=>`<path d="${p.d}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.width}"/>`).join('')}${stars}</g></svg>`;}
function draw(ctx,id,level,x=0,y=0,scale=1){if(id==='launch'&&drawIllustration(ctx,level,x,y,scale))return;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineJoin='round';ctx.lineCap='round';for(const p of shapes(id,level)){const path=new Path2D(p.d);if(p.fill!=='none'){ctx.fillStyle=p.fill;ctx.fill(path);}ctx.strokeStyle=p.stroke;ctx.lineWidth=p.width;ctx.stroke(path);}if(id!=='launch'&&level>3){ctx.fillStyle='#f5d677';for(let i=0;i<Math.min(5,level-3);i++){ctx.beginPath();ctx.arc(-12+i*6,-24,2,0,7);ctx.fill();}}ctx.restore();}
const api={svg,draw,shapes,illustratedHeight,drawSkate};if(typeof module!=='undefined')module.exports=api;else root.GGEquipment=api;
})(typeof window!=='undefined'?window:globalThis);
