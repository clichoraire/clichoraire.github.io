// Goblin Malin — rester muet : une fenêtre de discussion laissée sans réponse se referme toute seule (comme Échap).
// Celui qui parlait le prend plus ou moins bien. Si le joueur est parti depuis un moment, les fenêtres se referment plus vite encore.
'use strict';
(function (CG) {
  const UI = CG.UI, G = CG.G, Mu = CG.Muet = { DELAI: 15, VITE: 5, AFK: 60, BARRE: 5, FROISSE: 0.4 };
  const CALME = ['Ah, d\'accord, tu es occupé. Je reviendrai plus tard, alors.', 'Bon... une autre fois, alors.', 'Tu réfléchis ? Je te laisse tranquille.', 'Pas de réponse... Ce n\'est pas grave.'];
  const FROISSE = ['Hé ! Je te parle !', 'Pfff. Même pas un mot...', 'Charmant. On me laisse parler dans le vide.', 'Bon. J\'ai compris, je dérange.'];
  let cur = null, ouvert = 0, geste = performance.now(), parti = false;
  const bouge = () => { geste = performance.now(); parti = false; const b = document.getElementById('dlg-muet'); if (b) b.remove(); };
  ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, bouge, true));
  Mu.tic = function (now) {
    const m = UI.modal; if (!m || m.name !== 'dialog' || document.hidden) { cur = null; return; }
    if (m !== cur) { cur = m; ouvert = now; parti = now - geste > Mu.AFK * 1000; }
    const reste = (parti ? Mu.VITE : Mu.DELAI) * 1000 - (now - Math.max(ouvert, geste)), el = document.getElementById('dialog');
    if (reste <= 0) { const qui = CG.R && CG.R.talking; cur = null; UI.dismiss(); Mu.reagir(qui); return; }
    let b = document.getElementById('dlg-muet');
    if (reste < Mu.BARRE * 1000 && el && !el.hidden) { if (!b || b.parentNode !== el) { b = document.createElement('div'); b.id = 'dlg-muet'; b.innerHTML = '<i></i>'; el.appendChild(b); } b.firstChild.style.width = Math.max(0, 100 * reste / (Mu.BARRE * 1000)) + '%'; }
    else if (b) b.remove();
  };
  Mu.reagir = function (qui) {
    const S = CG.S, R = CG.R; if (!qui || !S || !R || !(S.goblins.includes(qui) || R.visitors.includes(qui))) return;
    const f = Math.random() < Mu.FROISSE; G.say(qui, CG.pick(f ? FROISSE : CALME), 3.5); if (f) G.text(qui.x, qui.y - 50, '💢', '#fff', true);
  };
  setInterval(() => Mu.tic(performance.now()), 250);
})(window.CG);
