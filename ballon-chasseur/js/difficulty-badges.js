// Cinq écussons de difficulté (bouclier, étoile, flamme, crâne, éclair) partagés par les écrans d'affrontement.
(function(B){
'use strict';const D=B.DifficultyBadges={};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const star=(cx,cy,R,r,n=5)=>Array.from({length:n*2},(_,i)=>{const a=-Math.PI/2+i*Math.PI/n,d=i%2?r:R;return (cx+Math.cos(a)*d).toFixed(1)+' '+(cy+Math.sin(a)*d).toFixed(1);}).join(' ');
// Couleurs : bande du ruban, emblème clair / foncé, liseré.
D.THEMES=[
 {id:'easy',ribbon:'#36a845',ribbonDark:'#1f6d2c',light:'#8fe36f',dark:'#2e8b3a',rim:'#dff3ff'},
 {id:'medium',ribbon:'#f08a1f',ribbonDark:'#b55a10',light:'#ffd36b',dark:'#e07a19',rim:'#fff1c2'},
 {id:'hard',ribbon:'#e0392f',ribbonDark:'#97211b',light:'#ffd04a',dark:'#c6281f',rim:'#ffd9c4'},
 {id:'danger',ribbon:'#8a46d8',ribbonDark:'#5a2a98',light:'#e6d2ff',dark:'#6a35b3',rim:'#efe0ff'},
 {id:'impossible',ribbon:'#2b2f45',ribbonDark:'#121426',light:'#ffd84a',dark:'#1a1d33',rim:'#ffe68a'}
];
function emblem(i,t){
 switch(i){
  case 0:return `<path d="M60 10 L98 25 C98 60 86 88 60 103 C34 88 22 60 22 25 Z" fill="${t.dark}" stroke="${t.rim}" stroke-width="4" stroke-linejoin="round"/><path d="M60 22 L88 33 C88 60 78 80 60 92 C42 80 32 60 32 33 Z" fill="${t.light}"/><path d="M60 22 L88 33 C88 46 86 56 82 65 L60 52 Z" fill="#ffffff55"/><path d="M47 56 L57 66 L75 46" fill="none" stroke="${t.dark}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  case 1:return `<polygon points="${star(60,58,48,22)}" fill="${t.dark}" stroke="${t.rim}" stroke-width="4" stroke-linejoin="round"/><polygon points="${star(60,58,34,15)}" fill="${t.light}"/><polygon points="${star(60,58,34,15)}" fill="url(#badge-gloss-${i})"/><circle cx="60" cy="58" r="8" fill="#fff8d6"/>`;
  case 2:return `<circle cx="60" cy="60" r="46" fill="${t.dark}" stroke="${t.rim}" stroke-width="4"/><path d="M60 16 C66 34 86 40 85 64 C84 86 72 98 60 100 C48 98 36 86 35 64 C34 50 44 44 46 30 C52 42 60 40 60 16 Z" fill="#ff7b3a" stroke="#ffd4b0" stroke-width="3" stroke-linejoin="round"/><path d="M60 50 C66 60 74 64 73 76 C72 88 66 94 60 95 C54 94 48 88 47 76 C46 66 55 62 60 50 Z" fill="${t.light}"/><path d="M60 72 C63 77 66 79 65 85 C64 90 62 92 60 92 C58 92 56 90 55 85 C54 80 58 77 60 72 Z" fill="#fff8d6"/>`;
  case 3:return `<path d="M60 10 L104 35 L104 83 L60 108 L16 83 L16 35 Z" fill="${t.dark}" stroke="${t.rim}" stroke-width="4" stroke-linejoin="round"/><path d="M60 22 L92 40 L92 78 L60 96 L28 78 L28 40 Z" fill="${t.light}" opacity=".25"/><ellipse cx="60" cy="52" rx="25" ry="23" fill="${t.light}"/><rect x="47" y="66" width="26" height="16" rx="5" fill="${t.light}"/><circle cx="50" cy="52" r="7" fill="${t.dark}"/><circle cx="70" cy="52" r="7" fill="${t.dark}"/><path d="M57 64 L60 58 L63 64 Z" fill="${t.dark}"/><path d="M53 74 L53 82 M60 74 L60 82 M67 74 L67 82" stroke="${t.dark}" stroke-width="3" stroke-linecap="round"/>`;
  default:return `<path d="M60 8 L110 58 L60 108 L10 58 Z" fill="${t.dark}" stroke="${t.rim}" stroke-width="4" stroke-linejoin="round"/><path d="M60 20 L98 58 L60 96 L22 58 Z" fill="#2f3756"/><path d="M60 20 L98 58 L60 58 Z" fill="#ffffff14"/><path d="M68 24 L42 64 L58 64 L50 94 L80 50 L63 50 Z" fill="${t.light}" stroke="#fff6c8" stroke-width="2.5" stroke-linejoin="round"/><polygon points="${star(30,30,6,2.4,4)}" fill="#fff3b0"/><polygon points="${star(92,36,5,2,4)}" fill="#fff3b0"/><polygon points="${star(86,88,6,2.4,4)}" fill="#fff3b0"/>`;
 }
}
// Écusson complet : emblème, ruban avec le nom, queue avec le multiplicateur d'XP.
D.svg=function(i,name,xpMultiplier){
 const t=D.THEMES[i]||D.THEMES[0],xp='XP ×'+String(xpMultiplier).replace('.',',');
 return `<svg class="difficulty-badge-art" viewBox="0 0 120 142" aria-hidden="true"><defs><linearGradient id="badge-gloss-${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><g class="badge-emblem">${emblem(i,t)}</g><g class="badge-ribbon"><path d="M3 96 L16 96 L16 124 L3 124 L9 110 Z" fill="${t.ribbonDark}"/><path d="M117 96 L104 96 L104 124 L117 124 L111 110 Z" fill="${t.ribbonDark}"/><path d="M12 92 L108 92 L108 116 L12 116 Z" fill="${t.ribbon}" stroke="${t.rim}" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 92 L108 92 L108 100 L12 100 Z" fill="#ffffff2e"/><path d="M34 116 L86 116 L82 134 L38 134 Z" fill="${t.ribbonDark}" stroke="${t.rim}" stroke-width="2"/><text x="60" y="110" text-anchor="middle" class="badge-name">${esc(name)}</text><text x="60" y="129" text-anchor="middle" class="badge-xp">${esc(xp)}</text></g></svg>`;
};
// Bouton prêt à poser dans un groupe de choix : state = {selected, won, wins, locked, requirement}.
D.button=function(i,name,xpMultiplier,state={}){
 const b=document.createElement('button');b.type='button';b.className='difficulty-badge'+(state.selected?' selected':'')+(state.won?' won':'')+(state.locked?' locked':'');b.dataset.difficulty=i;
 b.disabled=!!state.locked;b.setAttribute('aria-pressed',String(!!state.selected));
 const detail=state.locked?state.requirement||'Verrouillé':state.won?'Gagné'+(state.wins>1?' '+state.wins+' fois':''):'À conquérir';
 b.setAttribute('aria-label',name+' · XP ×'+xpMultiplier+' · '+detail);if(state.locked&&state.requirement)b.title=state.requirement;
 b.innerHTML=D.svg(i,name,xpMultiplier)+(state.won?'<span class="badge-mark badge-won" aria-hidden="true">🏆</span>':'')+(state.locked?'<span class="badge-mark badge-lock" aria-hidden="true">🔒</span>':'');
 return b;
};
})(window.BC);
