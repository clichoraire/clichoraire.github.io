// Goblin Malin — la boule de slime. Les gelées en laissent parfois une par terre. C'est une ressource, comptée dans la barre du
// haut (à droite des os : la barre défile). Une boule = une Flaque de glu. La flaque n'est plus dans l'arbre des technologies :
// on apprend à la poser en ramassant sa toute première boule.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, TAU = Math.PI * 2;
  const Sl = CG.Slime = { CHANCE: { gelee: 0.35, geleeRouge: 0.5 } };
  CG.RES.slime = { nom: 'Boule de slime', icon: '🟢' };
  CG.BUILDS.glu.desc = (CG.BUILDS.glu.desc || '') + ' Il faut une boule de slime par flaque : les gelées en laissent parfois tomber.';
  { const ir = G.initRuntime; G.initRuntime = function () { const r = ir.apply(this, arguments), S = CG.S; S.res.slime = S.res.slime || 0;
      if (S.tech && S.tech.owned && S.tech.owned.d14) { delete S.tech.owned.d14; S.tech.points = (S.tech.points || 0) + 1; S.gluVu = true; } /* une ancienne partie avait appris la glu dans l'arbre : le point est rendu, la flaque reste connue */
      return r; };
    const bu = G.buildUnlocked; G.buildUnlocked = function (k) { if (k === 'glu') return !!(CG.S && CG.S.gluVu); return bu.apply(this, arguments); }; }
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('gluVu')) CG.Mondes.GLOBAL.push('gluVu');
  // les gelées en laissent parfois une
  { const he = G.hurtEnemy; G.hurtEnemy = function (e) { const vivant = e && !e.dead, r = he.apply(this, arguments); if (vivant && e.dead && !e.slimeVu && Sl.CHANCE[e.type]) { e.slimeVu = true; if (Math.random() < Sl.CHANCE[e.type]) G.drop(e.x, e.y, { kind: 'res', res: 'slime', n: 1 }); } return r; };
    const pu = G.pickUp; G.pickUp = function (d) { const r = pu.apply(this, arguments), S = CG.S; if (d && d.kind === 'res' && d.res === 'slime') { const L = UI.RES_LISTE.filter(k => CG.RES[k]); UI.resPos = Math.max(0, L.length - UI.RES_VU); /* la barre glisse pour la montrer */
        if (!S.gluVu) { S.gluVu = true; CG.sfx('discovery'); G.banner('🟢 Une boule de slime !', 'Gluante à souhait. Tu sais maintenant poser une Flaque de glu (Construire, onglet Défense) : une boule par flaque.', '#c8ffb0'); if (CG.Batir && CG.Batir.render) { try { CG.Batir.render(); } catch (e) { /* rien */ } } } } return r; }; }
  // par terre : une vraie petite boule verte qui tremblote, plutôt qu'un rond de couleur
  { const dr = CG.Art.drops; CG.Art.drops = function (g, list, t) { const moi = list.filter(d => d.kind === 'res' && d.res === 'slime'); dr.call(this, g, moi.length ? list.filter(d => !(d.kind === 'res' && d.res === 'slime')) : list, t);
      for (const d of moi) { if (!CG.onScreen(d.x, d.y)) continue; const f = d.f === undefined ? 1 : d.f, w = Math.sin(t * 5 + (d.seed || 0)) * 0.08, hop = f < 1 ? Math.sin(f * Math.PI) * 26 : 0, x = d.x, y = d.y - hop;
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(d.x, d.y + 2, 8, 3, 0, 0, TAU); g.fill();
        g.fillStyle = '#3f8a26'; g.beginPath(); g.ellipse(x, y - 6, 8.6 * (1 + w), 7.6 * (1 - w), 0, 0, TAU); g.fill(); g.fillStyle = '#7ad04a'; g.beginPath(); g.ellipse(x - 0.6, y - 6.8, 7.4 * (1 + w), 6.4 * (1 - w), 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x - 3, y - 9.4, 2.4, 1.5, -0.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(200,255,150,0.6)'; g.beginPath(); g.arc(x + 3, y - 4.5, 1.3, 0, TAU); g.fill(); } }; }
  // ---------- la barre des ressources défile : flèches, molette, ou en la tirant ----------
  const bouge = d => { const L = UI.RES_LISTE.filter(k => CG.RES[k]), p = Math.max(0, Math.min(L.length - UI.RES_VU, (UI.resPos || 0) + d)); if (p === UI.resPos) return false; UI.resPos = p; const el = document.getElementById('res'); if (CG.S) UI.refresh(); if (el) { el.classList.remove('glisse-g', 'glisse-d'); void el.offsetWidth; el.classList.add(d > 0 ? 'glisse-g' : 'glisse-d'); } return true; };
  Sl.glisser = bouge;
  const lier = () => { const el = document.getElementById('res'); if (!el) return; let tire = null;
    el.addEventListener('click', e => { const n = e.target.closest && e.target.closest('[data-nav]'); if (n) { e.stopPropagation(); if (bouge(+n.dataset.nav)) CG.sfx('click'); } });
    el.addEventListener('wheel', e => { if (!e.target.closest || e.target.closest('.r-clan,.r-moral')) return; e.preventDefault(); bouge((e.deltaY || e.deltaX) > 0 ? 1 : -1); }, { passive: false });
    el.addEventListener('pointerdown', e => { if (e.button || (e.target.closest && e.target.closest('[data-nav],.r-clan,.r-moral'))) return; tire = { x: e.clientX }; });
    window.addEventListener('pointermove', e => { if (!tire) return; const dx = e.clientX - tire.x; if (Math.abs(dx) > 34) { bouge(dx < 0 ? 1 : -1); tire.x = e.clientX; } });
    window.addEventListener('pointerup', () => { tire = null; }); window.addEventListener('pointercancel', () => { tire = null; });
    const st = document.createElement('style'); st.textContent = '#res .r-nav{pointer-events:auto;cursor:pointer;padding:5px 5px 8px;border-left:0;font:900 19px/1 "Trebuchet MS",system-ui,sans-serif;color:#ffe36b;text-shadow:0 1px 0 rgba(0,0,0,.6);user-select:none;-webkit-user-select:none}#res .r-nav:hover{background:rgba(255,220,140,.22)}#res .r-nav.off{opacity:.22;cursor:default}#res .r-nav+span{border-left:0}#res span[class^="r-"]:not(.r-nav):not(.r-clan):not(.r-moral){cursor:grab}'
      + '#res.glisse-g span:not(.r-nav):not(.r-clan):not(.r-moral){animation:resG .22s ease-out}#res.glisse-d span:not(.r-nav):not(.r-clan):not(.r-moral){animation:resD .22s ease-out}@keyframes resG{from{transform:translateX(22px);opacity:.2}}@keyframes resD{from{transform:translateX(-22px);opacity:.2}}'; document.head.appendChild(st); };
  if (document.getElementById('res')) lier(); else document.addEventListener('DOMContentLoaded', lier);
})(window.CG);
