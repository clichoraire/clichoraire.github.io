// Goblin Malin — le seigneur démon n'attend pas longtemps. Dès qu'il est arrivé près du feu, un chrono s'affiche en haut de
// l'écran (et un petit sablier au-dessus de sa tête) : le temps qu'il reste pour aller lui parler avant qu'il n'attaque.
// Le chrono s'arrête pendant qu'on lui parle. Les dernières secondes, il devient rouge et bat.
'use strict';
(function (CG) {
  const G = CG.G, Dc = CG.DemandeChrono = { ROUGE: 20 };
  const st = document.createElement('style'); st.textContent =
    '#dem-chrono{position:fixed;left:50%;top:58px;transform:translateX(-50%);z-index:30;display:none;align-items:center;gap:9px;padding:6px 16px 6px 10px;border-radius:20px;background:linear-gradient(#3a1830,#22101e);border:2px solid #b070d8;box-shadow:0 4px 14px rgba(0,0,0,.55),0 0 14px rgba(190,110,255,.35);color:#f4e2ff;font:700 15px "Trebuchet MS",system-ui,sans-serif;pointer-events:none;white-space:nowrap}' +
    '#dem-chrono i{font-style:normal;font-size:20px}#dem-chrono b{font-size:19px;color:#ffe36b;min-width:44px;text-align:right;font-variant-numeric:tabular-nums}' +
    '#dem-chrono.rouge{border-color:#ff5a4a;box-shadow:0 4px 14px rgba(0,0,0,.55),0 0 18px rgba(255,80,60,.7);animation:dem-bat .5s ease-in-out infinite alternate}#dem-chrono.rouge b{color:#ff8a7a}' +
    '@keyframes dem-bat{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.07)}}@media (max-width:700px){#dem-chrono{font-size:13px;top:52px}}';
  document.head.appendChild(st);
  let el = null, vu = '';
  const boite = () => { if (!el) { el = document.createElement('div'); el.id = 'dem-chrono'; el.innerHTML = '<i>😈</i><span>Le seigneur démon veut te parler</span><b></b>'; document.body.appendChild(el); } return el; };
  const attente = () => { const R = CG.R, ev = R && R.event; return CG.running && ev && ev.type === 'demande' && ev.lord && ev.lord.state === 'wait' ? ev : null; };
  const up0 = G.update; G.update = function () {
    const r = up0.apply(this, arguments), ev = attente();
    if (!ev) { if (vu) { vu = ''; if (el) el.style.display = 'none'; } return r; }
    const s = Math.max(0, Math.ceil(ev.timer)), cle = s + (s <= Dc.ROUGE ? 'r' : ''); if (cle === vu) return r; vu = cle;
    const b = boite(); b.style.display = 'flex'; b.classList.toggle('rouge', s <= Dc.ROUGE); b.lastChild.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    return r;
  };
  // hors du jeu (pause, titre, nuit) : on le cache
  setInterval(() => { if (el && vu && !attente()) { vu = ''; el.style.display = 'none'; } }, 600);
  // au-dessus de sa tête : un petit rond qui se vide
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const ev = attente(); if (!ev) return; const v = ev.lord; if (!CG.onScreen(v.x, v.y)) return;
    const k = Math.max(0, Math.min(1, ev.timer / (ev.timerMax || (ev.timerMax = Math.max(ev.timer, 1))))), rouge = ev.timer <= Dc.ROUGE, x = v.x, y = v.y - 96 + Math.sin(t * 3) * 2, r = 13 * (rouge ? 1 + Math.sin(t * 12) * 0.08 : 1);
    g.fillStyle = 'rgba(20,8,20,0.75)'; g.beginPath(); g.arc(x, y, r + 2.5, 0, 6.3); g.fill();
    g.fillStyle = rouge ? '#ff5a4a' : '#c890ff'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('💬', x, y + 4);
  };
})(window.CG);
