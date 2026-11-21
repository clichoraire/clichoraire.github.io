// Goblin Malin — les mêmes émojis partout. Chaque appareil a ses propres dessins d'émojis (Mac, Windows, Android...), et les
// plus vieux n'ont même pas les émojis récents (🪵 🪨 🛖 🪓... sortent en carrés vides). Le jeu apporte donc sa propre police
// d'émojis (Twemoji, assets/fonts) : tout le monde voit exactement les mêmes icônes, dans les fenêtres comme dans le jeu.
// Le reste du code continue d'écrire ses émojis sans y penser. Pour comparer avec les émojis de l'appareil : index.html#emoji-systeme
'use strict';
(function () {
  const NOM = 'GM Emoji', FICHIER = 'assets/fonts/twemoji.woff2', SUF = ', "' + NOM + '"';
  // les signes confiés à la police : tous les émojis « images », et les signes simples que le jeu écrit en version émoji (❤️ ⚔️ ☠️...).
  // Les flèches, ✔, ✖, ★, ♪ et compagnie restent du texte ordinaire, coloré par le jeu.
  const SIGNES = 'U+200D, U+21A9, U+231A-231B, U+23E9-23F3, U+23F8-23FA, U+25AB, U+25FD-25FE, U+2600, U+2604, U+2614-2615, U+2620, U+2648-2653, U+2668, U+267F, U+2692-2694, U+2696-2697, U+2699, '
    + 'U+26A0-26A1, U+26AA-26AB, U+26BD-26BE, U+26C4-26C5, U+26CE-26CF, U+26D3-26D4, U+26EA, U+26F1-26F3, U+26F5, U+26FA, U+26FD, U+2705, U+270A-270B, U+270D, U+2712, U+2728, U+2744, U+274C, U+274E, '
    + 'U+2753-2755, U+2757, U+2764, U+2795-2797, U+27B0, U+27BF, U+2B06-2B07, U+2B1B-2B1C, U+2B50, U+2B55, U+1F000-1FAFF';
  const Em = window.GMEmoji = { pret: false };

  // ---------- brancher la police partout : dessins du jeu, feuilles de style, styles posés à la main ----------
  function ajoute(st) {
    try {
      const v = st && st.fontFamily; if (!v || v.indexOf(NOM) >= 0 || v.indexOf('var(') >= 0 || /^(inherit|initial|unset|revert)/.test(v)) return;
      st.fontFamily = v + SUF;
    } catch (e) { /* rien */ }
  }
  function regles(rs) { for (const r of rs) { if (r instanceof CSSStyleRule) ajoute(r.style); else if (r.cssRules) regles(r.cssRules); } }
  function feuille(sh) { let rs = null; try { rs = sh && sh.cssRules; } catch (e) { /* feuille illisible (fichier ouvert sans serveur) */ } if (rs) regles(rs); }
  function element(n) {
    if (n.nodeType !== 1) return;
    if (n.nodeName === 'STYLE') return feuille(n.sheet);
    if (n.style && n.style.fontFamily) ajoute(n.style);
    if (n.firstElementChild) { n.querySelectorAll('[style*="font"]').forEach(e => ajoute(e.style)); n.querySelectorAll('style').forEach(s => feuille(s.sheet)); }
  }
  // les dessins du jeu : chaque police choisie reçoit la police d'émojis à la suite (posé tout de suite, pour que rien ne soit dessiné sans elle)
  function dessins() {
    const P = CanvasRenderingContext2D.prototype, d = Object.getOwnPropertyDescriptor(P, 'font'), vu = new Map();
    if (!d || !d.set) return;
    Object.defineProperty(P, 'font', { configurable: true, enumerable: d.enumerable, get: d.get, set(v) {
      let w = vu.get(v); if (w === undefined) { w = typeof v === 'string' && v.indexOf(NOM) < 0 ? v + SUF : v; if (vu.size > 4000) vu.clear(); vu.set(v, w); }
      d.set.call(this, w);
    } });
  }
  // les pages : la police de base, les boutons et les champs, puis toutes les règles qui choisissent leur propre police
  function pages() {
    const base = document.createElement('style'); base.id = 'gm-emoji';
    const corps = getComputedStyle(document.body).fontFamily || 'sans-serif';
    base.textContent = 'html,body{font-family:' + corps + '}:where(button,input,select,textarea){font-family:system-ui,sans-serif}';
    document.head.appendChild(base);
    for (const sh of Array.from(document.styleSheets)) feuille(sh);
    document.querySelectorAll('[style*="font"]').forEach(e => ajoute(e.style));
    new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) element(n); }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (/emoji-systeme/.test(location.hash) || !window.FontFace || !document.fonts) return;
  const f = new FontFace(NOM, 'url(' + FICHIER + ')', { unicodeRange: SIGNES });
  document.fonts.add(f); dessins();
  Em.charge = f.load().then(() => { Em.pret = true; }).catch(() => { /* police introuvable : les émojis de l'appareil prennent le relais, comme avant */ });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pages); else pages();
})();
