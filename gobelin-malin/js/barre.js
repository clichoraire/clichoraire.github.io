// Goblin Malin — la barre des sorts, en grand cadre. La rangée du bas porte les touches 1 à 0 ; le bouton ＋ ajoute une rangée
// au-dessus (sans touches : on clique ou on touche le sort pour le lancer). On glisse un sort sur un autre pour les échanger.
// Chaque sort va dans la case qu'on veut, même une case vide d'une rangée du haut (p.cases).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Ba = CG.Barre = { PAR: 10, MAX: 4, SEUIL: 9 };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let prise = null; /* { i, x, y, bouge, fant } : le sort qu'on tient */
  Ba.rangs = () => CG.clamp(Math.floor((CG.S && CG.S.barre) || 1), 1, Ba.MAX);
  // chaque sort a sa case, où l'on veut : p.cases[i] = le sort de la case i (ou rien). Les touches 1 à 0 sont les dix premières cases.
  Ba.cases = function () {
    const p = CG.S.player; let c = p.cases; if (!Array.isArray(c)) c = p.cases = p.spells.slice();
    for (let i = 0; i < c.length; i++) if (!c[i] || !p.spells.includes(c[i]) || c.indexOf(c[i]) !== i) c[i] = null;
    for (const id of p.spells) if (!c.includes(id)) { let i = 0; while (i < c.length && c[i]) i++; c[i] = id; }
    while (c.length && !c[c.length - 1]) c.pop(); return c;
  };
  Ba.a = i => Ba.cases()[i] || null;
  Ba.cle = () => Ba.rangs() + (prise && prise.bouge ? 'p' + prise.i : '') + 'c' + Ba.cases().join(',');
  Ba.html = function (reste) {
    const p = CG.S.player, n = Ba.rangs(), C = Ba.cases(); let h = '<div class="br-cadre"><div class="br-rangs">';
    for (let r = 0; r < n; r++) { h += '<div class="br-rang">';
      for (let c = 0; c < Ba.PAR; c++) { const i = r * Ba.PAR + c, id = C[i], sp = id && CG.SPELLS[id], k = r ? '' : '<i>' + (c + 1) % 10 + '</i>';
        h += sp ? '<div class="spell' + (p.mp < G.spellCost(id) ? ' low' : '') + (prise && prise.bouge && prise.i === i ? ' prise' : '') + '" data-i="' + i + '" title="' + esc(sp.nom + ' — ' + (sp.court || sp.desc)) + '">' + k + sp.icon + '<u>' + G.spellCost(id) + '</u></div>' : '<div class="spell vide" data-i="' + i + '">' + k + '</div>'; }
      h += '</div>'; }
    const cache = C.slice(n * Ba.PAR).filter(Boolean).length;
    h += '</div><div class="br-cote">' + (n < Ba.MAX ? '<button class="br-b" data-br="1" title="Ajouter une rangée' + (cache > 0 ? ' (' + cache + ' sort' + (cache > 1 ? 's' : '') + ' de plus à montrer)' : '') + '">＋' + (cache > 0 ? '<em>' + cache + '</em>' : '') + '</button>' : '') + (n > 1 ? '<button class="br-b" data-br="-1" title="Enlever la rangée du haut">－</button>' : '') + '</div></div>';
    return h + (reste ? '<div class="br-reste">' + reste + '</div>' : '');
  };
  const libre = () => CG.S && CG.R && CG.running && !(UI && UI.modal) && !(CG.Meta && CG.Meta.forme());
  const fini = () => { if (prise && prise.fant) prise.fant.remove(); prise = null; document.body.classList.remove('br-glisse'); document.querySelectorAll('#spells .vise').forEach(e => e.classList.remove('vise')); };
  const sous = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.closest ? e.closest('#spells [data-i]') : null; };
  document.addEventListener('pointerdown', ev => {
    const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return; const b = t.closest('#spells [data-br]');
    if (b) { ev.preventDefault(); if (!CG.S) return; CG.S.barre = CG.clamp(Ba.rangs() + (+b.dataset.br), 1, Ba.MAX); CG.sfx('click'); return; }
    const s = t.closest('#spells .spell[data-i]'); if (!s) return; ev.preventDefault(); if (s.classList.contains('vide') || !libre()) return;
    prise = { i: +s.dataset.i, x: ev.clientX, y: ev.clientY, bouge: false, fant: null, ic: CG.SPELLS[Ba.a(+s.dataset.i)].icon };
  });
  document.addEventListener('pointermove', ev => {
    if (!prise) return; if (!prise.bouge) { if (Math.hypot(ev.clientX - prise.x, ev.clientY - prise.y) < Ba.SEUIL) return; prise.bouge = true; const f = prise.fant = document.createElement('div'); f.className = 'spell br-fant'; f.textContent = prise.ic; document.body.appendChild(f); document.body.classList.add('br-glisse'); }
    prise.fant.style.left = ev.clientX + 'px'; prise.fant.style.top = ev.clientY + 'px';
    const c = sous(ev.clientX, ev.clientY); document.querySelectorAll('#spells .vise').forEach(e => { if (e !== c) e.classList.remove('vise'); }); if (c && +c.dataset.i !== prise.i) c.classList.add('vise');
  });
  document.addEventListener('pointerup', ev => {
    if (!prise) return; const q = prise, p = CG.S && CG.S.player; fini(); if (!p) return; const C = Ba.cases(); if (!C[q.i]) return;
    if (!q.bouge) { if (libre()) G.cast(C[q.i]); return; } /* un simple clic : on lance le sort */
    const c = sous(ev.clientX, ev.clientY); if (!c) return; const j = +c.dataset.i; if (j === q.i) return; /* sur un autre sort : ils échangent leurs places ; sur une case vide : il s'y pose */
    while (C.length <= Math.max(j, q.i)) C.push(null); const t = C[q.i]; C[q.i] = C[j] || null; C[j] = t; CG.sfx('page');
  });
  document.addEventListener('pointercancel', fini); window.addEventListener('blur', fini);
  const css = document.createElement('style');
  css.textContent = '#spells{align-items:flex-end;gap:8px}'
    + '.br-cadre{display:flex;align-items:flex-end;gap:5px;padding:6px;border-radius:14px;pointer-events:auto;background:linear-gradient(180deg,rgba(58,44,26,.94),rgba(26,19,10,.96));border:2px solid #b08a3a;box-shadow:0 4px 14px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,0,0,.6),inset 0 1px 0 2px rgba(255,220,140,.14);touch-action:none;user-select:none;-webkit-user-select:none}'
    + '.br-rangs{display:flex;flex-direction:column-reverse;gap:5px}.br-rang{display:flex;gap:5px}'
    + '.br-cadre .spell{width:46px;height:46px;border-radius:8px;cursor:pointer;background:radial-gradient(circle at 50% 35%,#3a2c18,#17100a);border:2px solid #6e5524;box-shadow:inset 0 0 6px rgba(0,0,0,.8);touch-action:none}'
    + '.br-cadre .spell:hover{border-color:#ffe08a}.br-cadre .spell.vide{cursor:default;background:rgba(0,0,0,.45);border-color:#4a3a1c}.br-cadre .spell.vide:hover{border-color:#4a3a1c}'
    + '.br-cadre .spell.prise{opacity:.3}.br-cadre .spell.vise{border-color:#fff;box-shadow:0 0 0 2px #ffe08a,inset 0 0 8px rgba(255,224,138,.5)}'
    + '.br-cote{display:flex;flex-direction:column;gap:4px}.br-cadre button.br-b{position:relative;width:24px;height:21px;padding:0;border-radius:6px;border:1px solid #8a6a2a;background:#2a1e0e;color:#ffe08a;font:bold 14px/1 sans-serif;cursor:pointer;box-shadow:none;text-shadow:none}.br-cadre button.br-b:hover{background:#4a3618}'
    + '.br-b em{position:absolute;top:-8px;right:-7px;min-width:15px;padding:1px 3px;border-radius:9px;background:#c0392b;color:#fff;font:bold 10px/13px sans-serif;text-align:center}'
    + '.br-reste{display:flex;gap:6px;align-items:flex-end}'
    + '.spell.br-fant{position:fixed;z-index:9999;margin:-23px 0 0 -23px;width:46px;height:46px;pointer-events:none;border-color:#ffe08a;box-shadow:0 6px 16px rgba(0,0,0,.6);transform:scale(1.12)}body.br-glisse{cursor:grabbing}'
    + '@media (max-width:760px){.br-cadre .spell{width:38px;height:38px;font-size:20px}.br-cadre{padding:4px;gap:3px}.br-rang,.br-rangs{gap:3px}}';
  document.head.appendChild(css);
})(window.CG);
