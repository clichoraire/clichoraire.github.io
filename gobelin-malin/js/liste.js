// Goblin Malin — liste déroulante maison : remplace partout les <select> du système par un bouton de bois et une liste dans le style du jeu.
'use strict';
(function (CG) {
  const Li = CG.Liste = {}; let open = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // sépare l'icône (emoji en tête) du texte, pour l'aligner dans sa colonne
  const split = t => { const m = /^\s*(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s+(.*)$/u.exec(t); return m ? [m[1], m[2]] : ['', t.trim()]; };
  const label = t => { const [ic, tx] = split(t); return (ic ? '<span class="ld-ic">' + ic + '</span>' : '') + '<span class="ld-tx">' + esc(tx) + '</span>'; };
  function close() { if (!open) return; open.pop.remove(); open.btn.classList.remove('open'); open = null; }
  function dismiss() { if (!open) return; CG.sfx('uiClose'); close(); }
  function show(sel, btn) {
    if (open && open.sel === sel) return dismiss(); close(); if (sel.disabled) return;
    CG.sfx('uiOpen');
    const pop = document.createElement('div'); pop.className = 'ld-pop'; const opts = [...sel.options], icons = opts.some(o => split(o.textContent)[0]);
    pop.innerHTML = opts.map((o, i) => '<div class="ld-row' + (o.selected ? ' on' : '') + (o.disabled ? ' off' : '') + '" data-i="' + i + '"><i class="ld-ck">' + (o.selected ? '✔' : '') + '</i>' + (icons ? '<span class="ld-ic">' + split(o.textContent)[0] + '</span>' : '') + '<span class="ld-tx">' + esc(split(o.textContent)[1]) + '</span></div>').join('');
    document.body.appendChild(pop); btn.classList.add('open'); open = { sel, btn, pop, idx: sel.selectedIndex };
    const r = btn.getBoundingClientRect(), w = Math.max(r.width, pop.offsetWidth), h = pop.offsetHeight, below = innerHeight - r.bottom - 8, up = below < Math.min(h, 220) && r.top > below;
    pop.style.minWidth = r.width + 'px'; pop.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left)) + 'px';
    if (up) { pop.style.maxHeight = Math.max(120, r.top - 12) + 'px'; pop.style.bottom = (innerHeight - r.top + 5) + 'px'; pop.classList.add('up'); } else { pop.style.maxHeight = Math.max(120, below) + 'px'; pop.style.top = (r.bottom + 5) + 'px'; }
    const cur = pop.querySelector('.on'); if (cur) cur.scrollIntoView({ block: 'nearest' });
    pop.onclick = e => { const row = e.target.closest('.ld-row'); if (!row || row.classList.contains('off')) return; pickIdx(+row.dataset.i); };
    pop.onmousemove = e => { const row = e.target.closest('.ld-row'); if (row) hover(+row.dataset.i); };
  }
  function hover(i) { if (!open) return; open.idx = i; open.pop.querySelectorAll('.ld-row').forEach((r, k) => r.classList.toggle('hov', k === i)); }
  function pickIdx(i) { const sel = open.sel; if (!sel.options[i] || sel.options[i].disabled) return CG.sfx('no'); close(); if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); } sync(sel); CG.sfx('click'); }
  function sync(sel) { const b = sel._ld; if (!b) return; const o = sel.options[sel.selectedIndex], t = o ? o.textContent : ''; if (b._t !== t) { b._t = t; b.querySelector('.ld-lab').innerHTML = label(t); } b.disabled = sel.disabled; }
  Li.enhance = function (sel) {
    if (sel._ld || sel.multiple) return; const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ld-btn'; btn.innerHTML = '<span class="ld-lab"></span><span class="ld-chev"></span>';
    sel._ld = btn; sel.classList.add('ld-src'); sel.after(btn); sync(sel);
    btn.onclick = e => { e.stopPropagation(); show(sel, btn); };
    btn.onkeydown = e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); if (!open) show(sel, btn); } };
  };
  Li.scan = root => (root || document).querySelectorAll('select:not(.ld-src)').forEach(Li.enhance);
  function boot() {
    Li.scan();
    new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.tagName === 'SELECT') Li.enhance(n); else if (n.querySelector && n.querySelector('select')) Li.scan(n); } }).observe(document.body, { childList: true, subtree: true });
    setInterval(() => { if (open && !document.body.contains(open.btn)) close(); document.querySelectorAll('select.ld-src').forEach(sync); }, 350); // une valeur changée par le code : le bouton suit
    document.addEventListener('mousedown', e => { if (open && !open.pop.contains(e.target) && !open.btn.contains(e.target)) close(); }, true);
    window.addEventListener('resize', close); window.addEventListener('blur', close);
    document.addEventListener('wheel', e => { if (open && !open.pop.contains(e.target)) close(); }, { passive: true, capture: true });
    window.addEventListener('keydown', e => {
      if (!open) return; const n = open.sel.options.length;
      if (e.key === 'Escape') dismiss(); else if (e.key === 'ArrowDown') hover(Math.min(n - 1, open.idx + 1)); else if (e.key === 'ArrowUp') hover(Math.max(0, open.idx - 1)); else if (e.key === 'Enter' || e.key === ' ') pickIdx(open.idx); else return;
      e.preventDefault(); e.stopImmediatePropagation(); const h = open && open.pop.querySelector('.hov'); if (h) h.scrollIntoView({ block: 'nearest' });
    }, true);
  }
  if (document.body) boot(); else window.addEventListener('DOMContentLoaded', boot);
})(window.CG);
