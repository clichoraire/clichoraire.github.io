// Goblin Malin — l'humeur du clan. Le bonhomme du moral (barre du haut) change de tête à chaque tranche de 10 %,
// et chaque tranche perdue amène UNE pénalité de plus. Elles s'ajoutent, et disparaissent dès que le moral remonte.
// (Le travail suit déjà le moral de base, doucement : ces pénalités viennent par-dessus.) Tout se règle dans CG.Humeur.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI;
  const Hu = CG.Humeur = {
    // du plus heureux au plus malheureux : la tête pour 90-100 %, 80-89 %, ... 0-9 %
    TETES: ['😄', '😊', '🙂', '😐', '😕', '😟', '😢', '😠', '😡', '🤬'],
    // la pénalité qui arrive quand le moral passe SOUS ce seuil
    PEINES: [
      { sous: 90, k: 'travail', v: 0.95, txt: 'Travail un peu plus lent (−5 %)' },
      { sous: 80, k: 'garde', v: 0.9, txt: 'Les gardes frappent moins fort (−10 %)' },
      { sous: 70, k: 'prix', v: 1.15, txt: 'Les marchands vendent plus cher (+15 %)' },
      { sous: 60, k: 'xp', v: 0.85, txt: 'Tu gagnes moins d\'expérience (−15 %)' },
      { sous: 50, k: 'venue', v: 0, txt: 'Plus personne ne vient s\'installer, plus de naissances' },
      { sous: 40, k: 'travail', v: 0.85, txt: 'Travail bien plus lent (−20 % en tout)' },
      { sous: 30, k: 'garde', v: 0.8, txt: 'Les gardes n\'ont plus le cœur à se battre (−28 % en tout)' },
      { sous: 20, k: 'prix', v: 1.25, txt: 'Les marchands profitent de vous (+44 % en tout)' },
      { sous: 10, k: 'travail', v: 0.6, txt: 'Grève ! Le clan ne travaille presque plus' }
    ]
  };
  const moral = () => (CG.S ? CG.S.morale : 100);
  Hu.cran = m => Math.min(9, Math.max(0, Math.floor((100 - (m === undefined ? moral() : m)) / 10 + 1e-9))); // 0 : 91 à 100 % ... 9 : 0 à 10 %
  Hu.tete = m => Hu.TETES[Hu.cran(m)];
  Hu.actives = m => { const v = m === undefined ? moral() : m; return Hu.PEINES.filter(p => v < p.sous); };
  Hu.mul = k => Hu.actives().reduce((a, p) => (p.k === k ? a * p.v : a), 1);
  Hu.bulle = function () { const a = Hu.actives(), s = Hu.PEINES.find(p => moral() >= p.sous && !a.includes(p)), pro = Hu.PEINES.filter(p => moral() >= p.sous).pop();
    return (a.length ? a.map(p => '• ' + p.txt).join(' ') : 'Tout le monde est content : aucune pénalité.') + (pro ? ' — Sous ' + pro.sous + ' % : ' + pro.txt.charAt(0).toLowerCase() + pro.txt.slice(1) + '.' : ''); };

  // ---------- les effets ----------
  { const ws = G.workSpeed; G.workSpeed = g => ws(g) * Hu.mul('travail'); }
  { const gd = G.guardDmg; G.guardDmg = g => gd(g) * Hu.mul('garde'); }
  { const ax = G.addXp; G.addXp = function (n) { return ax.call(this, n > 0 ? n * Hu.mul('xp') : n); }; }
  { const sh = UI.shop; UI.shop = function (v) { try { if (v && v.shop) { const k = Hu.mul('prix'); v.shop.forEach(it => { if (typeof it.prix !== 'number') return; if (it.prixHu !== it.prix) it.prix0 = it.prix; /* un prix changé ailleurs redevient la base */ it.prix = it.prixHu = Math.round(it.prix0 * k); }); } } catch (e) { /* jamais bloquant */ } return sh.apply(this, arguments); }; }

  // ---------- le bonhomme de la barre du haut ----------
  { const rf = UI.refresh; UI.refresh = function () { const r = rf.apply(this, arguments); try { const el = document.querySelector('#res .r-moral'); if (el && !el._eu) { const i = el.querySelector('i'), t = Hu.tete(); if (i && i.textContent !== t) i.textContent = t; const c = Hu.cran(); if (el._huC !== c) { el._huC = c; el.dataset.tip = t + ' Moral du clan'; el.dataset.sub = Hu.bulle(); el.classList.toggle('bas', c >= 5); el.classList.toggle('pire', c >= 8); } } } catch (e) { /* rien */ } return r; }; }
  if (!document.getElementById('hu-css')) { const st = document.createElement('style'); st.id = 'hu-css'; st.textContent = '#res .r-moral i{display:inline-block;transition:transform .2s}#res .r-moral.bas b{color:#ffb38a}#res .r-moral.pire b{color:#ff6a5a}#res .r-moral.pire i{animation:huTremble .5s linear infinite}#res .r-moral.saut i{animation:huSaut .6s cubic-bezier(.2,1.6,.4,1)}@keyframes huTremble{0%,100%{transform:translateX(0)}25%{transform:translateX(-1.5px)}75%{transform:translateX(1.5px)}}@keyframes huSaut{0%{transform:scale(1)}40%{transform:scale(1.7)}100%{transform:scale(1)}}@media (prefers-reduced-motion:reduce){#res .r-moral i{animation:none!important}}'; document.head.appendChild(st); }

  // ---------- on prévient quand une tranche est franchie ----------
  { const up = D.update; D.update = function () { const r = up.apply(this, arguments); try { const R = CG.R, S = CG.S; if (R && S) { const c = Hu.cran(); if (R.huCran === undefined) R.huCran = c; else if (c !== R.huCran) { const pire = c > R.huCran, p = pire ? Hu.PEINES[c - 1] : Hu.PEINES[R.huCran - 1]; R.huCran = c;
      if (p) UI.toast(pire ? '😟 Le moral passe sous ' + p.sous + ' % : ' + p.txt.charAt(0).toLowerCase() + p.txt.slice(1) + '.' : '😄 Le moral remonte à ' + p.sous + ' % : une pénalité de moins.');
      const el = document.querySelector('#res .r-moral'); if (el) { el._huC = -1; el.classList.remove('saut'); void el.offsetWidth; el.classList.add('saut'); } } } } catch (e) { /* rien */ } return r; }; }
})(window.CG);
