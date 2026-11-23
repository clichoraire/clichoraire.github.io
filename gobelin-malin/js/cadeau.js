// Goblin Malin — la récompense d'un appel à l'aide réussi.
//   Celui qui avait demandé de l'aide parle le premier : dès qu'on ressort du portail, il s'approche et la fenêtre s'ouvre toute seule.
//   Les cadeaux sont montrés en grand, et il n'y a qu'une réponse : on les prend. (Si on ferme la fenêtre, on les reçoit quand même.)
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Ar = CG.Arene; if (!Ar || !CG.Merci) return;
  const Ca = CG.Cadeau = { ATTEND: 1.3 };
  const st = document.createElement('style'); st.textContent =
    '.cadeaux{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 12px}' +
    '.cadeaux .lot{position:relative;overflow:hidden;min-width:78px;padding:9px 12px 8px;border-radius:12px;text-align:center;background:linear-gradient(#5a4320,#33240e);border:2px solid #ffd45a;box-shadow:0 0 14px rgba(255,205,80,.45),inset 0 1px 0 rgba(255,255,255,.25);animation:cad-pop .42s cubic-bezier(.2,1.5,.4,1) both}' +
    '.cadeaux .lot:nth-child(2){animation-delay:.12s}.cadeaux .lot:nth-child(3){animation-delay:.24s}.cadeaux .lot:nth-child(4){animation-delay:.36s}.cadeaux .lot:nth-child(5){animation-delay:.48s}' +
    '.cadeaux .lot i{display:block;font-style:normal;font-size:38px;line-height:1.1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}' +
    '.cadeaux .lot b{display:block;margin-top:2px;font-size:21px;color:#ffe36b;text-shadow:0 1px 2px #000}' +
    '.cadeaux .lot::after{content:"";position:absolute;top:-20%;left:-70%;width:45%;height:140%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-18deg);animation:cad-brille 2.4s ease-in-out .7s infinite}' +
    '@keyframes cad-pop{from{transform:scale(.2) rotate(-8deg);opacity:0}to{transform:none;opacity:1}}@keyframes cad-brille{0%{left:-70%}45%,100%{left:130%}}' +
    '#dialog.cadeau .opts button{font-size:19px;padding:12px 16px;background:linear-gradient(#f2c23a,#c88a14);color:#2a1a04;border-color:#fff0a8;font-weight:700}';
  document.head.appendChild(st);
  const lot = (ic, txt) => '<div class="lot"><i>' + ic + '</i><b>' + txt + '</b></div>';
  let ouvert = null; // { v, prendre } : la fenêtre des cadeaux est à l'écran
  // les gros boutons dorés ne servent qu'à cette fenêtre-là : toute autre discussion retrouve ses boutons ordinaires
  { const dg0 = UI.dialog; UI.dialog = function () { const el = document.getElementById('dialog'); if (el) el.classList.remove('cadeau'); return dg0.apply(this, arguments); }; }
  const tk0 = D.talk; D.talk = function (v) {
    if (!(v && v.quete && v.merci)) return tk0.apply(this, arguments);
    const d0 = UI.dialog; let o = null; UI.dialog = x => { o = x; }; try { tk0.apply(this, arguments); } finally { UI.dialog = d0; }
    if (!o || !o.options || !o.options[0] || !o.options[0].fn) return o ? UI.dialog(o) : undefined;
    const m = v.merci, q = Ar.Q[v.quete], prendre = o.options[0].fn, xp = 30 + 6 * CG.S.day;
    const html = '<div class="cadeaux">' + m.lot.map(x => lot(CG.RES[x[0]].icon, '+' + x[1])).join('') + lot('⭐', '+' + xp + ' XP') + (m.fiole ? lot('🧪', '+1') : '') + '</div>';
    v.cadeauVu = true; UI.dialog({ visitor: v, who: q.qui, tag: '🎁 ta récompense', text: q.merci, extra: html, options: [{ label: '🎁 Prendre la récompense', fn: () => { ouvert = null; const el = document.getElementById('dialog'); if (el) el.classList.remove('cadeau'); prendre(); } }] });
    const el = document.getElementById('dialog'); if (el) el.classList.add('cadeau'); ouvert = { v, prendre }; CG.sfx('discovery');
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !R.visitors) return;
    const dlg = UI.modal && UI.modal.name === 'dialog' && R.talking === (ouvert && ouvert.v);
    if (ouvert && !dlg) { const a = ouvert; ouvert = null; const el = document.getElementById('dialog'); if (el) el.classList.remove('cadeau'); if (a.v.merci && R.visitors.includes(a.v)) a.prendre(); return; } /* fenêtre fermée sans répondre : il donne quand même */
    if (ouvert || UI.modal || R.cine || R.ko > 0 || R.night) return;
    for (const v of R.visitors) { if (!v.merci || v.cadeauVu || v.state !== 'wait') continue; v.cadeauT = (v.cadeauT || 0) + dt; if (v.cadeauT < Ca.ATTEND) return;
      if (R.banner && /Va lui parler/.test(R.banner.sub || '')) R.banner = null; D.talk(v); return; }
  };
})(window.CG);
