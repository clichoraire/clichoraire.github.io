// Goblin Malin — les pièces d'or (et le cuir : le rond brun 🟤 devient une petite peau tannée, de la même façon). Le signe 🪙 du système sort argenté : partout où il apparaît (fenêtres, barres, textes
// dessinés dans le jeu), on met à sa place une vraie petite pièce dorée. Le reste du code continue d'écrire 🪙 sans y penser.
'use strict';
(function () {
  const C = '🪙', CU = '🟤', TAU = Math.PI * 2, RE = /(🪙|🟤)/, A = s => s.indexOf(C) >= 0 || s.indexOf(CU) >= 0, TAG = { '🪙': 'x-po', '🟤': 'x-cu' };
  // la peau de cuir : une peau tannée étalée, pattes écartées (coordonnées de -1 à 1)
  const PEAU = 'M-.2-.9Q0-1.02 .2-.9L.45-.72 .95-.85 .98-.5 .58-.38Q.48 0 .6 .42L1 .55 .95 .9 .45 .75Q.2 .82 .12 .98L-.12 .98Q-.2 .82-.45 .75L-.95 .9-1 .55-.6 .42Q-.48 0-.58-.38L-.98-.5-.95-.85-.45-.72Z';
  const SVG = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.12 -1.12 2.24 2.24"><path d="' + PEAU + '" fill="#b9763a" stroke="#6b3d16" stroke-width=".14" stroke-linejoin="round"/><ellipse cx="0" cy=".05" rx=".34" ry=".52" fill="#d59d5e"/><path d="M0-.62V.7" stroke="#8f5626" stroke-width=".07" stroke-dasharray=".13 .1" stroke-linecap="round" fill="none"/></svg>') + '")';
  // ---------- dans les pages : chaque 🪙 devient une pastille dorée, chaque 🟤 une petite peau (le signe reste dedans, invisible, pour les copier-coller) ----------
  const css = document.createElement('style');
  css.textContent = 'x-po,x-cu{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;font-size:inherit;line-height:1;overflow:hidden;color:transparent;text-indent:-9em;white-space:nowrap}x-po{border-radius:50%;'
    + 'background:radial-gradient(circle at 34% 30%,#fff6c0 0 9%,#ffd84a 24%,#f3b21a 58%,#c98708 100%);box-shadow:inset 0 0 0 0.075em #a86c08,inset 0 0 0 0.17em #ffe27a,inset 0 0 0 0.215em rgba(168,108,8,.55),0 0.05em 0.08em rgba(0,0,0,.35)}'
    + 'x-cu{width:1.1em;height:1.1em;vertical-align:-0.2em;background:' + SVG + ' center/contain no-repeat;filter:drop-shadow(0 0.05em 0.05em rgba(0,0,0,.35))}';
  (document.head || document.documentElement).appendChild(css);
  const SAUTE = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, TITLE: 1, INPUT: 1, 'X-PO': 1, 'X-CU': 1 };
  function texte(n) {
    const par = n.parentNode; if (!par || !A(n.data) || SAUTE[par.nodeName]) return;
    const f = document.createDocumentFragment(), seg = n.data.split(RE);
    seg.forEach(s => { if (!s) return; if (TAG[s]) { const p = document.createElement(TAG[s]); p.textContent = s; f.appendChild(p); } else f.appendChild(document.createTextNode(s)); });
    par.replaceChild(f, n);
  }
  function parcours(n) {
    if (n.nodeType === 3) return texte(n); if (n.nodeType !== 1 || SAUTE[n.nodeName]) return;
    if (!A(n.textContent)) return; // rien à faire dans cette branche
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), l = []; while (w.nextNode()) if (A(w.currentNode.data)) l.push(w.currentNode); l.forEach(texte);
  }
  const lancer = () => { parcours(document.body); new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') texte(m.target); else for (const n of m.addedNodes) parcours(n); } }).observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) lancer(); else document.addEventListener('DOMContentLoaded', lancer);

  // ---------- dans le jeu (canvas) : le texte est écrit par morceaux, et la pièce (ou la peau) est dessinée entre eux ----------
  const P = CanvasRenderingContext2D.prototype, ft = P.fillText, st = P.strokeText; let chemin = null;
  function piece(g, x, y, r) {
    const f = g.fillStyle; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#a86c08'; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.86, 0, TAU); g.fillStyle = '#f6c224'; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.58, 0, TAU); g.fillStyle = '#d99a12'; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.47, 0, TAU); g.fillStyle = '#ffd84a'; g.fill();
    g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.2, 0, TAU); g.fillStyle = '#fff6c0'; g.fill(); g.fillStyle = f;
  }
  function peau(g, x, y, r) {
    if (!chemin) chemin = new Path2D(PEAU); const f = g.fillStyle, s = g.strokeStyle, lw = g.lineWidth, lj = g.lineJoin; r *= 1.12;
    g.save(); g.translate(x, y); g.scale(r, r); g.lineJoin = 'round'; g.lineWidth = 0.16; g.strokeStyle = '#6b3d16'; g.stroke(chemin); g.fillStyle = '#b9763a'; g.fill(chemin);
    g.beginPath(); g.ellipse(0, 0.05, 0.34, 0.52, 0, 0, TAU); g.fillStyle = '#d59d5e'; g.fill(); g.restore(); g.fillStyle = f; g.strokeStyle = s; g.lineWidth = lw; g.lineJoin = lj;
  }
  function morceaux(g, txt, x, y, ecrire, avecDessin) {
    const seg = txt.split(RE), al = g.textAlign, m = /(\d+(?:\.\d+)?)px/.exec(g.font), px = m ? +m[1] : 14, cw = px * 1.08, L = seg.map(s => TAG[s] ? cw : s ? g.measureText(s).width : 0);
    let tot = 0; for (const l of L) tot += l;
    let x0 = al === 'center' ? x - tot / 2 : al === 'right' || al === 'end' ? x - tot : x;
    const bl = g.textBaseline, cy = bl === 'middle' ? y : bl === 'top' || bl === 'hanging' ? y + px * 0.5 : bl === 'bottom' || bl === 'ideographic' ? y - px * 0.5 : y - px * 0.34;
    g.textAlign = 'left';
    for (let i = 0; i < seg.length; i++) { const s = seg[i]; if (TAG[s]) { if (avecDessin) (s === C ? piece : peau)(g, x0 + cw / 2, cy, px * 0.46); } else if (s) ecrire.call(g, s, x0, y); x0 += L[i]; }
    g.textAlign = al;
  }
  P.fillText = function (txt, x, y, mw) { if (typeof txt !== 'string' || !A(txt)) return mw === undefined ? ft.call(this, txt, x, y) : ft.call(this, txt, x, y, mw); morceaux(this, txt, x, y, ft, true); };
  P.strokeText = function (txt, x, y, mw) { if (typeof txt !== 'string' || !A(txt)) return mw === undefined ? st.call(this, txt, x, y) : st.call(this, txt, x, y, mw); morceaux(this, txt, x, y, st, false); };
})();
