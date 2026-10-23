// Extraction des sprites depuis les planches concept (tools/sprites/*.jpg|png) vers
// assets/units.png + js/spritesheet.js. Usage : node tools/sprites/extract.js  (utilise Chrome headless)
// Chaque cadre : [planche, x, y, w, h] dans la planche source. Le fond gris de la cellule est rendu
// transparent par remplissage depuis les bords, et la boîte englobante réelle du sprite est mesurée
// (bx, by, bw, bh) pour que le jeu puisse normaliser la taille et aligner les pieds.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..', '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SRC = {
  u: 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'planche-unites.jpg')).toString('base64'),
  r: 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'planche-races.png')).toString('base64'),
};
const C = 80;
const ux = i => 35 + 80 * i, ax = i => 745 + 80 * i;
const FRAMES = {
  // --- planche 1 (portraits de l'aventure, explosion)
  a_idleN: ['u', ax(0) + 4, 64, 72, 72], a_idleS: ['u', ax(4) + 4, 64, 72, 72], a_idleE: ['u', ax(2) + 4, 64, 72, 72], m_idleW: ['u', ux(7) + 4, 64, 72, 72],
  boom: ['u', 1230, 468, 152, 192],
  // --- planche 2 : 4 races x 2 niveaux. « ref » : cadre dont on reprend la hauteur de référence (même rendu)
  marine_idle: ['r', 66, 160, 105, 110], marine_fire: ['r', 60, 428, 125, 86, 'marine_idle'], marine_walk1: ['r', 66, 725, 105, 110], marine_walk2: ['r', 66, 905, 105, 110],
  exo_idle: ['r', 238, 135, 155, 165], exo_walk1: ['r', 232, 535, 165, 170], exo_walk2: ['r', 236, 712, 160, 145], exo_fire: ['r', 236, 880, 160, 170, 'exo_idle'],
  runner_idle: ['r', 485, 185, 90, 70], runner_fire: ['r', 485, 435, 90, 75, 'runner_idle'], runner_walk1: ['r', 497, 740, 60, 48], runner_walk2: ['r', 569, 740, 58, 48], runner_walk3: ['r', 497, 834, 60, 52],
  beast_idle: ['r', 648, 148, 205, 148], beast_walk1: ['r', 648, 545, 205, 160], beast_walk2: ['r', 650, 728, 205, 130], beast_fire: ['r', 650, 880, 205, 172, 'beast_idle'],
  blade_idle: ['r', 898, 160, 130, 115], blade_fire: ['r', 905, 732, 135, 110, 'blade_idle'], blade_walk1: ['r', 898, 568, 130, 115], blade_walk2: ['r', 900, 895, 130, 120],
  archon_idle: ['r', 1082, 140, 195, 155], archon_walk1: ['r', 1082, 548, 195, 160], archon_walk2: ['r', 1085, 730, 190, 128], archon_fire: ['r', 1080, 880, 200, 175, 'archon_idle'],
  scout_idle: ['r', 1360, 165, 100, 108], scout_fire: ['r', 1365, 438, 125, 80, 'scout_idle'], scout_walk1: ['r', 1374, 738, 58, 56], scout_walk2: ['r', 1448, 738, 56, 56], scout_walk3: ['r', 1374, 830, 58, 62],
  siege_idle: ['r', 1528, 140, 195, 155], siege_walk1: ['r', 1528, 540, 200, 168], siege_walk2: ['r', 1530, 730, 195, 128], siege_fire: ['r', 1528, 880, 200, 165, 'siege_idle'],
};
// Disposition : rangées de hauteur variable, largeur max 1024
const names = Object.keys(FRAMES), layout = {};
let cx = 0, cy = 0, rowH = 0;
const SW = 1024;
for (const n of names) {
  const [, , , w, h] = FRAMES[n];
  if (cx + w > SW) { cx = 0; cy += rowH; rowH = 0; }
  layout[n] = { x: cx, y: cy, w, h }; cx += w; rowH = Math.max(rowH, h);
}
const SH = cy + rowH;
const html = `<!doctype html><body><canvas id=o width=${SW} height=${SH}></canvas><pre id=out></pre><script>
const FRAMES=${JSON.stringify(FRAMES)}, layout=${JSON.stringify(layout)}, SRC=${JSON.stringify(SRC)};
const imgs={}; let left=Object.keys(SRC).length;
for (const k in SRC) { const im=new Image(); im.onload=()=>{ if(--left===0) go(); }; im.src=SRC[k]; imgs[k]=im; }
function go(){
  const o=document.getElementById('o').getContext('2d'); const log=[];
  for (const n in FRAMES) {
    const [src,sx,sy,w,h]=FRAMES[n]; const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
    x.drawImage(imgs[src],sx,sy,w,h,0,0,w,h); const d=x.getImageData(0,0,w,h), p=d.data;
    const border=[]; for(let i=0;i<w;i++){border.push(i,(h-1)*w+i);} for(let j=0;j<h;j++){border.push(j*w,j*w+w-1);}
    const lum=k=>(p[k*4]+p[k*4+1]+p[k*4+2])/3; const ls=border.map(lum).sort((a,b)=>a-b); const bg=ls[ls.length>>1];
    const isBg=k=>{const r=p[k*4],g=p[k*4+1],b=p[k*4+2]; const l=(r+g+b)/3; return Math.abs(l-bg)<30 && Math.abs(r-g)<18 && Math.abs(g-b)<18;};
    const seen=new Uint8Array(w*h); const st=[]; for(const k of border) if(isBg(k)){seen[k]=1; st.push(k);}
    while(st.length){const k=st.pop(); p[k*4+3]=0; const i=k%w,j=(k-i)/w; for(const [a,b] of [[i-1,j],[i+1,j],[i,j-1],[i,j+1]]){ if(a<0||b<0||a>=w||b>=h) continue; const q=b*w+a; if(seen[q]) continue; seen[q]=1; if(isBg(q)) st.push(q);} }
    for(let k=0;k<w*h;k++){ if(p[k*4+3]===0) continue; const i=k%w,j=(k-i)/w; let touch=false; for(const [a,b] of [[i-1,j],[i+1,j],[i,j-1],[i,j+1]]){ if(a<0||b<0||a>=w||b>=h) {touch=true;break;} if(p[(b*w+a)*4+3]===0){touch=true;break;} } if(touch){ const dl=Math.abs(lum(k)-bg); if(dl<45) p[k*4+3]=Math.round(255*Math.min(1,dl/45)); } }
    // boîte englobante des pixels opaques
    let x0=w,y0=h,x1=-1,y1=-1; for(let k=0;k<w*h;k++){ if(p[k*4+3]<40) continue; const i=k%w,j=(k-i)/w; if(i<x0)x0=i; if(i>x1)x1=i; if(j<y0)y0=j; if(j>y1)y1=j; }
    if(x1<0){x0=0;y0=0;x1=w-1;y1=h-1;}
    x.putImageData(d,0,0); const L=layout[n]; o.drawImage(c,L.x,L.y);
    L.bx=x0; L.by=y0; L.bw=x1-x0+1; L.bh=y1-y0+1; L.rh=L.bh;
    log.push(n+': fond='+bg.toFixed(0)+' boîte='+L.bw+'x'+L.bh);
  }
  for (const n in FRAMES) { const ref=FRAMES[n][5]; if (ref && layout[ref]) layout[n].rh=layout[ref].rh; }
  document.getElementById('out').textContent='DATA:'+document.getElementById('o').toDataURL('image/png')+'\\nLAYOUT:'+JSON.stringify(layout)+'\\nLOG:'+log.join('\\n');
}
</script></body>`;
const tmp = path.join(__dirname, '_extract.html');
fs.writeFileSync(tmp, html);
const dom = execFileSync(CHROME, ['--headless', '--disable-gpu', '--virtual-time-budget=8000', '--dump-dom', 'file://' + tmp], { maxBuffer: 1 << 28 }).toString();
fs.unlinkSync(tmp);
const m = dom.match(/DATA:data:image\/png;base64,([A-Za-z0-9+/=]+)\nLAYOUT:(\{[\s\S]*?\})\nLOG:([\s\S]*?)<\/pre>/);
if (!m) { console.error('extraction échouée'); process.exit(1); }
const out = JSON.parse(m[2].replace(/&quot;/g, '"'));
fs.writeFileSync(path.join(root, 'assets', 'units.png'), Buffer.from(m[1], 'base64'));
fs.writeFileSync(path.join(root, 'assets', 'units.json'), JSON.stringify({ sheet: 'units.png', frames: out }, null, 1));
fs.writeFileSync(path.join(root, 'js', 'spritesheet.js'), '// Généré par tools/sprites/extract.js : cadres de assets/units.png (x, y, w, h ; bx, by, bw, bh = boîte du sprite ; rh = hauteur de référence)\n' +
  "(function (ZC) { 'use strict'; ZC.SHEET = { src: 'assets/units.png', frames: " + JSON.stringify(out) + ' }; })(window.ZC);\n');
console.log(m[3].replace(/&gt;/g, '>'));
console.log('assets/units.png', SW + 'x' + SH, '+ assets/units.json + js/spritesheet.js');
