// Goblin Malin — la bulle d'aide de la barre du haut : au survol d'une ressource, son nom et à quoi elle sert.
'use strict';
(function () {
  let el = null, cible = null;
  const montrer = s => {
    if (!el) { el = document.createElement('div'); el.id = 'bulle'; document.body.appendChild(el); }
    el.innerHTML = ''; const b = document.createElement('b'); b.textContent = s.dataset.tip; el.appendChild(b); if (s.dataset.sub) el.appendChild(document.createTextNode(s.dataset.sub));
    const r = s.getBoundingClientRect(), w = el.offsetWidth / 2 + 8; el.style.left = Math.max(w, Math.min(window.innerWidth - w, r.left + r.width / 2)) + 'px'; el.style.top = (r.bottom + 12) + 'px'; el.classList.add('on');
  };
  document.addEventListener('mouseover', e => { const s = e.target && e.target.closest ? e.target.closest('#top [data-tip]') : null; if (s === cible) return; cible = s; if (s) montrer(s); else if (el) el.classList.remove('on'); });
  document.addEventListener('mouseleave', () => { cible = null; if (el) el.classList.remove('on'); });
})();
