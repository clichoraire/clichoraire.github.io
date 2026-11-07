// Paper Run — entrées : clavier, boutons tactiles, manette.
(function (root) {
  'use strict';
  const PR = root.PR = root.PR || {};
  const keys = new Set();
  const edges = { jump: false, dash: false, item: false, restart: false, pause: false, mute: false, confirm: false };
  const I = PR.input = { touch: false, gamepad: null, enabled: true, keys };
  const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW', 'KeyZ'], DASH_KEYS = ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyK', 'KeyC'], ITEM_KEYS = ['ControlLeft', 'ControlRight', 'KeyE', 'Enter', 'KeyQ'], DOWN_KEYS = ['ArrowDown', 'KeyS'];
  const LEFT = ['ArrowLeft', 'KeyA'], RIGHT = ['ArrowRight', 'KeyD'];
  const isTyping = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target && e.target.tagName);

  window.addEventListener('keydown', e => {
    if (isTyping(e)) return;
    if (!e.repeat) {
      if (JUMP_KEYS.includes(e.code)) edges.jump = true;
      if (DASH_KEYS.includes(e.code)) edges.dash = true;
      if (ITEM_KEYS.includes(e.code) && I.enabled) edges.item = true;
      if (e.code === 'KeyR') edges.restart = true;
      if (e.code === 'Escape' || e.code === 'KeyP') edges.pause = true;
      if (e.code === 'KeyM') edges.mute = true;
      if (e.code === 'Enter') edges.confirm = true;
    }
    keys.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && I.enabled) e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  // ---- tactile : boutons à l'écran
  const touchState = { left: false, right: false, jump: false, dash: false, item: false, down: false };
  I.setupTouch = function (container) {
    const coarse = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);
    if (!coarse || !container) return;
    I.touch = true; container.classList.remove('hidden');
    for (const btn of container.querySelectorAll('[data-touch]')) {
      const name = btn.dataset.touch;
      const down = e => { e.preventDefault(); touchState[name] = true; if (name === 'jump') edges.jump = true; if (name === 'dash') edges.dash = true; if (name === 'item') edges.item = true; btn.classList.add('on'); };
      const up = e => { e.preventDefault(); touchState[name] = false; btn.classList.remove('on'); };
      btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
    }
  };

  // ---- manette
  let padPrev = {};
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = Array.from(pads).find(g => g && g.connected); I.gamepad = p || null;
    if (!p) return { dir: 0, jumpHeld: false, down: false };
    const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
    const cur = { jump: b(0), dash: b(2) || b(5) || b(7), item: b(1) || b(4) || b(6), restart: b(3), pause: b(9), confirm: b(0) };
    for (const k in cur) if (cur[k] && !padPrev[k]) edges[k] = true;
    padPrev = cur;
    const ax = p.axes[0] || 0, dir = b(14) || ax < -0.4 ? -1 : (b(15) || ax > 0.4 ? 1 : 0);
    return { dir, jumpHeld: cur.jump, down: b(13) || (p.axes[1] || 0) > 0.5 };
  }

  // Lit l'état courant et consomme les appuis (fronts) — à appeler une fois par image.
  I.take = function () {
    const pad = pollPad();
    let dir = 0;
    if (LEFT.some(k => keys.has(k)) || touchState.left) dir -= 1;
    if (RIGHT.some(k => keys.has(k)) || touchState.right) dir += 1;
    if (!dir) dir = pad.dir;
    const jumpHeld = JUMP_KEYS.some(k => keys.has(k)) || touchState.jump || pad.jumpHeld;
    const down = DOWN_KEYS.some(k => keys.has(k)) || touchState.down || pad.down;
    const out = { dir, jumpHeld, down, jump: edges.jump, dash: edges.dash, item: edges.item, restart: edges.restart, pause: edges.pause, mute: edges.mute, confirm: edges.confirm };
    for (const k in edges) edges[k] = false;
    return out;
  };
  I.clear = function () { for (const k in edges) edges[k] = false; };
})(window);
