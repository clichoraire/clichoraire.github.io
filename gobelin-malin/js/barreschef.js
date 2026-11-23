// Goblin Malin — les barres du chef, dans le jeu (pas celles du coin de l'écran).
//   Pause → Interface : la barre de vie se met au-dessus ou en dessous du chef ; on peut aussi montrer sa barre de mana
//   (au-dessus ou en dessous), et choisir laquelle des deux passe en premier.
//   Le bouclier magique se lit dans la barre de vie elle-même : une couche bleue par-dessus, et « +12 » à côté des chiffres.
// Les barres n'apparaissent que quand elles servent : vie entamée (ou bouclier), mana entamée.
'use strict';
(function (CG) {
  const UI = CG.UI, If = CG.Interface, KEY = 'goblin-malin-barres', TAU = Math.PI * 2;
  const Bc = CG.BarresChef = { L: 40, RANG: 17, HAUT: 56, BAS: 20, DEF: { vie: 'haut', mana: 'non', ordre: 'vie' } };
  let vals = {}; try { vals = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { vals = {}; }
  Bc.val = k => (vals[k] !== undefined ? vals[k] : Bc.DEF[k]);
  const garder = () => { try { localStorage.setItem(KEY, JSON.stringify(vals)); } catch (e) { /* rien */ } };
  function barre(g, x, y, frac, col, txt, bouclier, t, fin) { const L = Bc.L, x0 = x - L / 2;
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.beginPath(); if (g.roundRect) g.roundRect(x0 - 1.5, y - 1.5, L + 3, 8, 4); else g.rect(x0 - 1.5, y - 1.5, L + 3, 8); g.fill();
    g.fillStyle = col; g.beginPath(); if (g.roundRect) g.roundRect(x0, y, Math.max(0, L * frac), 5, 2.5); else g.rect(x0, y, Math.max(0, L * frac), 5); g.fill(); g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x0 + 1, y + 0.6, Math.max(0, L * frac - 2), 1.4);
    if (bouclier > 0) { g.save(); if (fin) g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 16); const w = Math.max(3, L * Math.min(1, bouclier)), gr = g.createLinearGradient(x0, 0, x0 + L, 0), d = (t * 0.6) % 1; gr.addColorStop(0, 'rgba(122,216,255,0.92)'); gr.addColorStop(Math.min(0.99, 0.2 + d * 0.7), 'rgba(242,251,255,0.95)'); gr.addColorStop(1, 'rgba(180,140,255,0.92)');
      g.shadowColor = 'rgba(130,190,255,0.95)'; g.shadowBlur = 7; g.fillStyle = gr; g.beginPath(); if (g.roundRect) g.roundRect(x0, y, w, 5, 2.5); else g.rect(x0, y, w, 5); g.fill(); g.shadowBlur = 0; g.strokeStyle = 'rgba(235,248,255,0.95)'; g.lineWidth = 1; g.beginPath(); if (g.roundRect) g.roundRect(x0 - 0.5, y - 0.5, w + 1, 6, 3); else g.rect(x0 - 0.5, y - 0.5, w + 1, 6); g.stroke(); g.restore(); }
    g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.lineWidth = 2.5; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.fillStyle = '#fff'; g.strokeText(txt, x, y - 4); g.fillText(txt, x, y - 4); }
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.ko > 0 || R.death) return; const p = S.player, sh = R.shield > 0 ? R.shield : 0;
    const L = { haut: [], bas: [] }, ordre = Bc.val('ordre') === 'mana' ? ['mana', 'vie'] : ['vie', 'mana'];
    for (const k of ordre) { const ou = Bc.val(k); if (ou !== 'haut' && ou !== 'bas') continue; if (k === 'vie' ? (p.hp < p.maxhp - 0.5 || sh > 0) : p.mp < p.maxmp - 0.5) L[ou].push(k); }
    const dessine = (k, y) => { if (k === 'vie') barre(g, p.x, y, Math.max(0, p.hp / p.maxhp), '#ff5a4a', Math.ceil(p.hp) + '/' + Math.round(p.maxhp) + (sh ? ' +' + Math.ceil(sh) : ''), sh / p.maxhp, t, sh > 0 && R.shieldT < 2.5); else barre(g, p.x, y, Math.max(0, p.mp / p.maxmp), '#4a9aff', Math.floor(p.mp) + '/' + Math.round(p.maxmp), 0, t, false); };
    g.save(); L.haut.forEach((k, i) => dessine(k, p.y - Bc.HAUT - (L.haut.length - 1 - i) * Bc.RANG)); /* la première de l'ordre choisi est tout en haut */
    L.bas.forEach((k, i) => dessine(k, p.y + Bc.BAS + i * Bc.RANG)); g.restore();
  };
  // ---------- les réglages, dans Pause → Interface ----------
  const CHOIX = { vie: [['haut', 'Au-dessus du chef'], ['bas', 'En dessous du chef']], mana: [['non', 'Pas affichée'], ['haut', 'Au-dessus du chef'], ['bas', 'En dessous du chef']], ordre: [['vie', 'La vie d\'abord, la mana ensuite'], ['mana', 'La mana d\'abord, la vie ensuite']] };
  const TITRE = { vie: ['❤️', 'Barre de vie du chef, dans le jeu'], mana: ['💧', 'Barre de mana du chef, dans le jeu'], ordre: ['↕️', 'Ordre des deux barres'] };
  if (If && If.attach) { const at0 = If.attach; If.attach = function () {
    const r = at0.apply(this, arguments), p = document.getElementById('panel'), list = p && p.querySelector('.list.if-list'); if (!list || list.querySelector('[data-bc]')) return r;
    const rang = k => { const c = CHOIX[k], i = Math.max(0, c.findIndex(q => q[0] === Bc.val(k))); return '<div class="row"><span class="ic">' + TITRE[k][0] + '</span><div><b>' + TITRE[k][1] + '</b><small>' + c[i][1] + '</small></div><button data-bc="' + k + '" style="width:auto;padding:5px 12px;font-size:14px">Changer</button></div>'; };
    const d = document.createElement('div'); d.innerHTML = ['vie', 'mana', 'ordre'].map(rang).join(''); while (d.firstChild) list.appendChild(d.firstChild);
    list.querySelectorAll('button[data-bc]').forEach(b => b.onclick = () => { const k = b.dataset.bc, c = CHOIX[k], i = c.findIndex(q => q[0] === Bc.val(k)); vals[k] = c[(i + 1) % c.length][0]; garder(); if (CG.sfx) CG.sfx('click'); UI.pause(); });
    return r; }; }
})(window.CG);
