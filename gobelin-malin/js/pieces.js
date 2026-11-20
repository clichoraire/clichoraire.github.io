// Goblin Malin — les pièces d'or. Le signe 🪙 du système sort argenté : partout où il apparaît (fenêtres, barres, textes
// dessinés dans le jeu), on met à sa place une vraie petite pièce dorée. Le reste du code continue d'écrire 🪙 sans y penser.
'use strict';
(function () {
  const C = '🪙', TAU = Math.PI * 2;
  // ---------- dans les pages : chaque 🪙 devient une pastille dorée (le signe reste dedans, invisible, pour les copier-coller) ----------
  const css = document.createElement('style');
  css.textContent = 'x-po{display:inline-block;width:1em;height:1em;border-radius:50%;vertical-align:-0.14em;font-size:inherit;line-height:1;overflow:hidden;color:transparent;text-indent:-9em;white-space:nowrap;'
    + 'background:radial-gradient(circle at 34% 30%,#fff6c0 0 9%,#ffd84a 24%,#f3b21a 58%,#c98708 100%);box-shadow:inset 0 0 0 0.075em #a86c08,inset 0 0 0 0.17em #ffe27a,inset 0 0 0 0.215em rgba(168,108,8,.55),0 0.05em 0.08em rgba(0,0,0,.35)}';
  (document.head || document.documentElement).appendChild(css);
  const SAUTE = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, TITLE: 1, INPUT: 1 };
  function texte(n) {
    const par = n.parentNode; if (!par || n.data.indexOf(C) < 0 || SAUTE[par.nodeName] || par.nodeName === 'X-PO') return;
    const f = document.createDocumentFragment(), seg = n.data.split(C);
    seg.forEach((s, i) => { if (s) f.appendChild(document.createTextNode(s)); if (i < seg.length - 1) { const p = document.createElement('x-po'); p.textContent = C; f.appendChild(p); } });
    par.replaceChild(f, n);
  }
  function parcours(n) {
    if (n.nodeType === 3) return texte(n); if (n.nodeType !== 1 || SAUTE[n.nodeName] || n.nodeName === 'X-PO') return;
    if (n.textContent.indexOf(C) < 0) return; // rien à faire dans cette branche
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), l = []; while (w.nextNode()) if (w.currentNode.data.indexOf(C) >= 0) l.push(w.currentNode); l.forEach(texte);
  }
  const lancer = () => { parcours(document.body); new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') texte(m.target); else for (const n of m.addedNodes) parcours(n); } }).observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) lancer(); else document.addEventListener('DOMContentLoaded', lancer);

  // ---------- dans le jeu (canvas) : le texte est écrit par morceaux, et la pièce est dessinée entre eux ----------
  const P = CanvasRenderingContext2D.prototype, ft = P.fillText, st = P.strokeText;
  function piece(g, x, y, r) {
    const f = g.fillStyle; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#a86c08'; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.86, 0, TAU); g.fillStyle = '#f6c224'; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.58, 0, TAU); g.fillStyle = '#d99a12'; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.47, 0, TAU); g.fillStyle = '#ffd84a'; g.fill();
    g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.2, 0, TAU); g.fillStyle = '#fff6c0'; g.fill(); g.fillStyle = f;
  }
  function morceaux(g, txt, x, y, ecrire, avecPiece) {
    const seg = txt.split(C), al = g.textAlign, m = /(\d+(?:\.\d+)?)px/.exec(g.font), px = m ? +m[1] : 14, cw = px * 1.08, L = seg.map(s => s ? g.measureText(s).width : 0);
    let tot = cw * (seg.length - 1); for (const l of L) tot += l;
    let x0 = al === 'center' ? x - tot / 2 : al === 'right' || al === 'end' ? x - tot : x;
    const bl = g.textBaseline, cy = bl === 'middle' ? y : bl === 'top' || bl === 'hanging' ? y + px * 0.5 : bl === 'bottom' || bl === 'ideographic' ? y - px * 0.5 : y - px * 0.34;
    g.textAlign = 'left';
    for (let i = 0; i < seg.length; i++) { if (seg[i]) ecrire.call(g, seg[i], x0, y); x0 += L[i]; if (i < seg.length - 1) { if (avecPiece) piece(g, x0 + cw / 2, cy, px * 0.46); x0 += cw; } }
    g.textAlign = al;
  }
  P.fillText = function (txt, x, y, mw) { if (typeof txt !== 'string' || txt.indexOf(C) < 0) return mw === undefined ? ft.call(this, txt, x, y) : ft.call(this, txt, x, y, mw); morceaux(this, txt, x, y, ft, true); };
  P.strokeText = function (txt, x, y, mw) { if (typeof txt !== 'string' || txt.indexOf(C) < 0) return mw === undefined ? st.call(this, txt, x, y) : st.call(this, txt, x, y, mw); morceaux(this, txt, x, y, st, false); };
})();
