// Commandes tactiles : état indépendant du clavier, partagé avec le joueur 1.
(function (SK) {
  'use strict';
  const T = SK.Touch = { held: {}, screen: '', paused: false };
  const compact = window.matchMedia('(max-width: 1100px)');
  const pointers = new Map();
  const panel = document.createElement('nav');
  panel.id = 'touch-controls';
  panel.setAttribute('aria-label', 'Commandes tactiles');
  panel.hidden = true;
  panel.innerHTML = `<p class="touch-hint">Maintiens Sauter, puis relâche !</p>
    <div class="touch-directions">
      <button data-action="up" aria-label="Accélérer">▲<small>Vite</small></button>
      <button data-action="left" aria-label="Aller à gauche">◀</button>
      <button data-action="down" aria-label="Freiner">▼<small>Freiner</small></button>
      <button data-action="right" aria-label="Aller à droite">▶</button>
    </div>
    <div class="touch-actions">
      <button data-action="jump" class="touch-jump">↟<small>Sauter</small></button>
      <button data-action="trick">★<small>Figure</small></button>
      <button data-action="shoot">◎<small>Tirer</small></button>
      <button data-action="item">🎁<small>Objet</small></button>
      <button data-action="push">»<small>Pousser</small></button>
    </div>
    <button class="touch-pause" aria-label="Mettre en pause">Ⅱ</button>`;
  document.body.append(panel);
  const buttons = [...panel.querySelectorAll('[data-action]')];
  function refreshHeld() {
    T.held = {};
    for (const action of pointers.values()) T.held[action] = true;
    for (const button of buttons) {
      const held = !!T.held[button.dataset.action];
      button.classList.toggle('is-held', held);
      button.setAttribute('aria-pressed', String(held));
    }
  }
  T.clear = function () { pointers.clear(); refreshHeld(); };
  function sync() {
    T.clear();
    const visible = compact.matches && ['race', 'town', 'museum'].includes(T.screen) && !T.paused;
    panel.hidden = !visible;
    panel.dataset.mode = T.screen;
    document.body.classList.toggle('touch-playing', visible);
  }
  T.show = function (screen) { T.screen = screen; T.paused = false; sync(); };
  T.pause = function (paused) { T.paused = paused; sync(); };
  compact.addEventListener('change', sync);
  window.addEventListener('resize', T.clear);
  window.addEventListener('blur', T.clear);
  document.addEventListener('visibilitychange', T.clear);
  panel.addEventListener('contextmenu', e => e.preventDefault());
  for (const button of buttons) {
    button.addEventListener('pointerdown', e => {
      if (panel.hidden || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, button.dataset.action);
      refreshHeld();
    });
    const release = e => { pointers.delete(e.pointerId); refreshHeld(); };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }
  panel.querySelector('.touch-pause').onclick = () => { SK.Input.pressed.Escape = true; T.clear(); };
})(window.SK);
