// Goblin Malin — dans un donjon à nettoyer (château, temple, caverne...), un compteur reste en haut de l'écran :
// combien d'ennemis sont déjà tombés, sur combien. Il avance à chaque ennemi battu.
'use strict';
(function (CG) {
  const G = CG.G, Ar = CG.Arene; if (!Ar) return;
  const Co = CG.Compteur = {};
  const st = document.createElement('style'); st.textContent =
    '#cpt-donjon{position:fixed;left:50%;top:58px;transform:translateX(-50%);z-index:30;display:none;align-items:center;gap:8px;padding:5px 16px 5px 11px;border-radius:20px;background:linear-gradient(#2c2434,#1a1420);border:2px solid #b8a070;box-shadow:0 4px 14px rgba(0,0,0,.55);color:#ffe9a8;font:700 19px "Trebuchet MS",system-ui,sans-serif;pointer-events:none;white-space:nowrap;font-variant-numeric:tabular-nums}' +
    '#cpt-donjon i{font-style:normal;font-size:20px}#cpt-donjon.pan{animation:cpt-pan .28s ease-out}#cpt-donjon.fini{border-color:#8dff8a;color:#c8ffb0}' +
    '@keyframes cpt-pan{0%{transform:translateX(-50%) scale(1.28)}100%{transform:translateX(-50%) scale(1)}}@media (max-width:700px){#cpt-donjon{font-size:16px;top:52px}}';
  document.head.appendChild(st);
  let el = null, vu = '', tic = 0;
  const actif = () => { const S = CG.S, R = CG.R; return !!(CG.running !== false && S && R && Ar.dans() && S.arene && Ar.Q[S.arene.id] && Ar.Q[S.arene.id].donjon && R.grotte && R.grotte.chateau); };
  Co.etat = () => { const R = CG.R; return R && R.cptD ? R.cptD : null; };
  Co.texte = () => { const c = Co.etat(); return c ? c.tues + ' / ' + (c.tues + c.vivants) : ''; };
  const cacher = () => { if (vu) { vu = ''; if (el) el.style.display = 'none'; } };
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments); if (!actif()) { cacher(); return r; }
    tic -= dt; const R = CG.R; if (tic > 0 && R.cptD) return r; tic = 0.15;
    const n = R.enemies.reduce((a, e) => a + (!e.dead && e.arene && !e.revenu ? 1 : 0), 0), c = R.cptD || (R.cptD = { tues: 0, vivants: n });
    if (n < c.vivants) c.tues += c.vivants - n; c.vivants = n;
    const fini = !!CG.S.arene.gagne || n === 0, cle = c.tues + '/' + (c.tues + n) + (fini ? 'f' : ''); if (cle === vu) return r; const avant = vu; vu = cle;
    if (!el) { el = document.createElement('div'); el.id = 'cpt-donjon'; el.innerHTML = '<i>💀</i><span></span>'; document.body.appendChild(el); }
    el.style.display = 'flex'; el.lastChild.textContent = Co.texte(); el.firstChild.textContent = fini ? '✅' : '💀'; el.classList.toggle('fini', fini);
    if (avant) { el.classList.remove('pan'); void el.offsetWidth; el.classList.add('pan'); }
    return r;
  };
  setInterval(() => { if (vu && !actif()) cacher(); }, 600);
})(window.CG);
