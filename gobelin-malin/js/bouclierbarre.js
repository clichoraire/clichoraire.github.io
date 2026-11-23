// Goblin Malin — le bouclier magique se lit d'un coup d'œil : une barre de lumière bleu-violet posée par-dessus la barre de vie
// (en haut à gauche), aussi longue que ce que le bouclier peut encore encaisser, et une petite barre pareille au-dessus du chef.
// Elle scintille, fond à chaque coup, et clignote quand le sort va finir.
'use strict';
(function (CG) {
  const UI = CG.UI, Bb = CG.BouclierBarre = { COULEURS: ['#7ad8ff', '#b48cff'] };
  const st = document.createElement('style'); st.textContent =
    '#bar-bouclier{position:absolute;left:0;top:0;height:100%;width:0;pointer-events:none;border-radius:5px;background:linear-gradient(90deg,rgba(90,200,255,.92),rgba(150,120,255,.92) 55%,rgba(120,220,255,.92));background-size:200% 100%;animation:bb-coule 1.6s linear infinite;box-shadow:0 0 10px 2px rgba(130,190,255,.9),inset 0 0 0 1.5px rgba(235,248,255,.95),inset 0 6px 6px -3px rgba(255,255,255,.65);transition:width .18s,opacity .2s;opacity:0}' +
    '#bar-bouclier.on{opacity:1}#bar-bouclier.fin{animation:bb-coule 1.6s linear infinite,bb-fin .32s ease-in-out infinite alternate}' +
    '#bar-bouclier::after{content:"";position:absolute;inset:0;border-radius:5px;background:repeating-linear-gradient(115deg,rgba(255,255,255,0) 0 9px,rgba(255,255,255,.28) 9px 12px)}' +
    '.bar.hp.bouclier{overflow:visible;border-color:#bfe6ff}.bar.hp.bouclier #txt-hp{z-index:2;text-shadow:0 1px 2px #000,0 0 5px #123a6a}' +
    '@keyframes bb-coule{from{background-position:0 0}to{background-position:-200% 0}}@keyframes bb-fin{from{opacity:1}to{opacity:.45}}';
  document.head.appendChild(st);
  let el = null, max = 0;
  const barre = () => { if (el && el.isConnected) return el; const hp = document.getElementById('bar-hp'); if (!hp || !hp.parentElement) return null; el = document.createElement('div'); el.id = 'bar-bouclier'; hp.parentElement.insertBefore(el, hp.nextSibling); return el; };
  const rf0 = UI.refresh; UI.refresh = function () {
    const r = rf0.apply(this, arguments), S = CG.S, R = CG.R, b = S && R ? barre() : null; if (!b) return r;
    const sh = R.shield > 0 ? R.shield : 0; if (!sh) max = 0; else if (sh > max) max = sh; R.shieldMax = max;
    const p = S.player, on = sh > 0, w = on ? Math.max(4, Math.min(100, sh / p.maxhp * 100)) : 0, fin = on && R.shieldT < 2.5;
    if (b._w !== w) { b._w = w; b.style.width = w + '%'; } if (b._on !== on) { b._on = on; b.classList.toggle('on', on); b.parentElement.classList.toggle('bouclier', on); } if (b._fin !== fin) { b._fin = fin; b.classList.toggle('fin', fin); }
    if (on) { const t = document.getElementById('txt-hp'), s = Math.ceil(p.hp) + ' / ' + p.maxhp + '   🔮 +' + Math.ceil(sh); if (t && t.textContent !== s) t.textContent = s; }
    return r;
  };
  // au-dessus du chef : la même barre, en petit
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const S = CG.S, R = CG.R; if (CG.BarresChef || !S || !R || !(R.shield > 0) || R.ko > 0) return; /* barreschef.js dessine maintenant le bouclier dans la barre de vie elle-même */ const p = S.player, k = Math.min(1, R.shield / (max || R.shield)), L = 40, x = p.x - L / 2, y = p.y - (p.hp < p.maxhp - 0.5 ? 84 : 66); /* quand la barre de vie est affichée, le bouclier se pose au-dessus de ses chiffres, sans les toucher */
    g.save(); if (R.shieldT < 2.5) g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 16);
    g.fillStyle = 'rgba(10,20,40,0.7)'; g.beginPath(); if (g.roundRect) g.roundRect(x - 1.5, y - 1.5, L + 3, 8, 4); else g.rect(x - 1.5, y - 1.5, L + 3, 8); g.fill();
    const gr = g.createLinearGradient(x, 0, x + L, 0), d = (t * 0.6) % 1; gr.addColorStop(0, Bb.COULEURS[0]); gr.addColorStop(Math.min(0.99, 0.2 + d * 0.7), '#f2fbff'); gr.addColorStop(1, Bb.COULEURS[1]);
    g.shadowColor = 'rgba(130,190,255,0.95)'; g.shadowBlur = 7; g.fillStyle = gr; g.beginPath(); if (g.roundRect) g.roundRect(x, y, Math.max(3, L * k), 5, 2.5); else g.rect(x, y, Math.max(3, L * k), 5); g.fill();
    g.shadowBlur = 0; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.lineWidth = 2.5; g.strokeStyle = 'rgba(8,20,50,0.85)'; g.fillStyle = '#dff2ff'; const s = '+' + Math.ceil(R.shield); g.strokeText(s, p.x, y - 3); g.fillText(s, p.x, y - 3);
    g.restore();
  };
})(window.CG);
