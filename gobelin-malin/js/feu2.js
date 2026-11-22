// Goblin Malin — le deuxième feu de camp. Il ne s'obtient que dans le marais : une fois le Demon Lord tombé et le portail
// traversé, la case du centre de l'arbre, « Feu du clan », se met à briller en or. Un clic dessus, et on peut allumer un
// feu de camp dans ce monde-ci. (Rien avant : ni dans la forêt, ni dans une grotte ou un donjon.)
'use strict';
(function (CG) {
  const G = CG.G, Mo = CG.Mondes, UI = CG.UI, F2 = CG.Feu2 = { ANCIEN: 'b43' };
  if (Mo && Mo.GLOBAL && !Mo.GLOBAL.includes('feu2')) Mo.GLOBAL.push('feu2');
  F2.ouvert = () => { const S = CG.S; return !!S && !!(S.demon && S.demon.mort) && !!Mo && Mo.marais(); };
  F2.brille = () => F2.ouvert() && !CG.S.feu2;
  F2.prendre = function () { const S = CG.S; if (!F2.brille()) return false; S.feu2 = true; CG.sfx('level'); UI.toast('🔥 Le Feu du clan peut brûler ici aussi : pose ton feu de camp (Construire, Vie du clan).'); try { CG.save(); } catch (e) { /* rien */ } return true; };
  // le feu ne se pose au marais qu'une fois la case du centre cliquée (un feu déjà bâti avant reste, bien sûr)
  const bu0 = G.buildUnlocked; G.buildUnlocked = function (k) { if (k === 'fire' && Mo && Mo.marais && Mo.marais() && !CG.S.feu2) return false; return bu0.apply(this, arguments); };
  document.addEventListener('click', ev => { const b = ev.target && ev.target.closest ? ev.target.closest('#panel .tn.centre.dore') : null; if (!b || !CG.S) return; ev.stopPropagation(); if (F2.prendre()) { b.classList.remove('dore'); b.classList.add('pris'); } }, true);
  // on le dit une fois, en arrivant ; et le bouton des technologies brille tant que la case attend
  const up0 = G.update; G.update = function () { up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const b = document.getElementById('btn-tech'), br = F2.brille(); if (b && b.classList.contains('dore') !== br) b.classList.toggle('dore', br);
    if (br && !S.feu2Dit && !R.cine && !R.alarm && !(UI && UI.modal)) { S.feu2Dit = true; UI.toast('🔥 Le Feu du clan brille en or dans tes technologies (T).'); } };
  // les parties qui avaient appris l'ancienne case « Feu de camp » (elle s'offrait beaucoup trop tôt) : on l'efface
  const ir0 = G.initRuntime; G.initRuntime = function () { const S = CG.S; if (S && S.tech && S.tech.owned && S.tech.owned[F2.ANCIEN]) { delete S.tech.owned[F2.ANCIEN]; if (S.demon && S.demon.mort && (S.ailleurs || (Mo && Mo.marais()))) S.feu2 = true; } if (S && S.feu2Dit && !(S.demon && S.demon.mort)) S.feu2Dit = false; return ir0.apply(this, arguments); };
  const css = document.createElement('style');
  css.textContent = '@keyframes f2-or{from{box-shadow:0 0 0 2px #fff2a8,0 0 14px 4px rgba(255,208,60,.8),0 4px 0 #7a5208}to{box-shadow:0 0 0 3px #fff8d0,0 0 30px 12px rgba(255,220,90,1),0 4px 0 #7a5208}}'
    + '#panel.arbre .tree button.tn.centre.dore{cursor:pointer;border-color:#fff2a8;color:#3a2404;background:linear-gradient(160deg,#fff0a0,#ffcf3a 45%,#d89a12);animation:f2-or .9s ease-in-out infinite alternate;z-index:3}'
    + '#panel.arbre .tree button.tn.centre.dore b{color:#3a2404;text-shadow:0 1px 0 rgba(255,255,255,.5)}'
    + '#btn-tech.dore{box-shadow:0 0 0 2px #ffd84a,0 0 16px 4px rgba(255,216,80,.9)}'
    + '@media (prefers-reduced-motion:reduce){#panel.arbre .tree button.tn.centre.dore{animation:none}}';
  document.head.appendChild(css);
})(window.CG);
