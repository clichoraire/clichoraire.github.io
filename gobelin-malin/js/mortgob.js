// Goblin Malin — quand un gobelin du clan meurt, on le dit en gros, en haut de l'écran : « ☠ Untel est mort » (ou « morte »).
// Si plusieurs tombent coup sur coup, les annonces passent l'une après l'autre.
'use strict';
(function (CG) {
  const G = CG.G, Mg = CG.MortGob = { DUREE: 4.5 };
  const st = document.createElement('style'); st.textContent =
    '#mort-gob{position:fixed;left:50%;top:92px;transform:translateX(-50%);z-index:40;display:none;padding:12px 34px 13px;border-radius:16px;background:linear-gradient(#4a1414,#240808);border:3px solid #ff6a5a;box-shadow:0 6px 22px rgba(0,0,0,.6),0 0 26px rgba(255,80,60,.45);color:#fff0e8;font:900 34px "Trebuchet MS",system-ui,sans-serif;text-shadow:0 2px 4px #000;pointer-events:none;white-space:nowrap;text-align:center}' +
    '#mort-gob small{display:block;margin-top:2px;font-size:16px;font-weight:700;color:#ffb8a8}#mort-gob.entre{animation:mg-entre .45s cubic-bezier(.2,1.4,.4,1)}#mort-gob.sort{opacity:0;transition:opacity .6s}' +
    '@keyframes mg-entre{from{transform:translateX(-50%) scale(.4);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}@media (max-width:700px){#mort-gob{font-size:24px;top:78px;padding:9px 20px}#mort-gob small{font-size:13px}}';
  document.head.appendChild(st);
  const file = []; let el = null, reste = 0, dernier = 0;
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function montrer(q) { if (!el) { el = document.createElement('div'); el.id = 'mort-gob'; document.body.appendChild(el); }
    el.innerHTML = '☠ ' + esc(q.nom) + ' est mort' + (q.f ? 'e' : '') + '<small>' + esc(q.metier) + '</small>'; el.style.display = 'block'; el.classList.remove('sort', 'entre'); void el.offsetWidth; el.classList.add('entre'); reste = Mg.DUREE; }
  Mg.dire = function (g) { if (!g || g.mortDit) return; g.mortDit = true; const J = CG.JOBS && CG.JOBS[g.job], m = g.child ? (g.sex === 'f' ? 'une petite du clan' : 'un petit du clan') : J ? ((g.sex === 'f' && J.nomF) || J.nom) : ''; file.push({ nom: g.name, f: g.sex === 'f', metier: m ? m + ' du clan' : 'Le clan est en deuil' }); };
  const hg0 = G.hurtGoblin; G.hurtGoblin = function (g) { const r = hg0.apply(this, arguments); if (g && g.dead) Mg.dire(g); return r; };
  // l'horloge du jeu peut être en pause : on compte en vrai temps
  setInterval(() => { const n = performance.now(), dt = dernier ? Math.min(0.5, (n - dernier) / 1000) : 0; dernier = n;
    if (reste > 0) { reste -= dt; if (reste <= 0.6 && el) el.classList.add('sort'); if (reste <= 0 && el) el.style.display = 'none'; if (reste > 0 && !(file.length && reste < Mg.DUREE - 2.2)) return; }
    if (file.length && CG.running !== false) montrer(file.shift()); }, 100);
})(window.CG);
