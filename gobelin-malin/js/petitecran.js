// Goblin Malin — les petits écrans (cellulaire, tablette, petite fenêtre).
//   1) L'interface ne rapetisse plus à l'excès : la barre du haut, la barre de vie, la mini-carte et les sorts gardent une
//      taille lisible. (Sur un cellulaire, la page est dessinée en grand puis réduite d'un bloc : on regrossit ce qu'il faut.)
//   2) La barre des sorts a moins de cases par rangée : 5 sur un cellulaire, 6 sur une tablette (10 sur un grand écran).
//   3) Tous les boutons du menu (Carte, Construire, Grimoire...) se rangent derrière un seul bouton ⋯, sous la mini-carte.
// Tout est réglable dans CG.PetitEcran.
'use strict';
(function (CG) {
  const UI = CG.UI, If = CG.Interface, Ba = CG.Barre; if (!If) return;
  const Pe = CG.PetitEcran = { LARGE: 1100, HAUT: 620, MOBILE: 520, REF: [1000, 470], MIN: 0.78, MINI: 0.8, HAUT_BARRE: 0.85, CASES: { mobile: 5, tablette: 6, grand: 10 }, force: null };
  // combien de vrais points d'écran vaut un point de la page (moins de 1 sur un cellulaire, où la page est dessinée plus grande que l'écran)
  Pe.reduit = function () { const Ta = CG.Tactile; if (!Ta || !Ta.on) return 1; const long = Math.max(screen.width, screen.height), court = Math.min(screen.width, screen.height), couche = window.innerWidth >= window.innerHeight; return CG.clamp((couche ? long : court) / window.innerWidth, 0.3, 1); };
  Pe.etat = function () { if (Pe.force) return Pe.force; const r = Pe.reduit(), w = window.innerWidth * r, h = window.innerHeight * r; return h < Pe.MOBILE || w < 700 ? 'mobile' : w < Pe.LARGE || h < Pe.HAUT ? 'tablette' : 'grand'; };
  Pe.facteur = function () { const r = Pe.reduit(), w = window.innerWidth * r, h = window.innerHeight * r; return CG.clamp(Math.min(w / Pe.REF[0], h / Pe.REF[1]), Pe.MIN, 1) / r; };
  const f0 = If.facteur; If.facteur = function (k) { if (If.FEN.includes(k) || Pe.etat() === 'grand') return f0.apply(this, arguments); const f = Pe.facteur(); return k === 'mini' ? f * Pe.MINI : k === 'top' ? f * Pe.HAUT_BARRE : f; };
  if (Ba) { const c0 = Ba.cle; Ba.cle = function () { return c0.apply(this, arguments) + 'x' + Ba.PAR; }; }
  const st = document.createElement('style'); st.textContent =
    'body.pe-compact #buttons{display:none!important}' +
    '#pe-plus{display:none;position:relative;width:54px;height:54px;padding:0;border-radius:16px;font:900 30px/1 "Trebuchet MS",system-ui,sans-serif;letter-spacing:1px;color:#ffe9b8;background:linear-gradient(#4a3618,#221608);border:2px solid #b08a3a;box-shadow:0 4px 12px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,230,160,.25);pointer-events:auto;cursor:pointer;zoom:var(--z-boutons,1)}' +
    'body.pe-compact #pe-plus{display:grid;place-items:center}#pe-plus:active{transform:translateY(2px)}#pe-plus u{position:absolute;right:-6px;top:-6px;min-width:20px;padding:1px 5px;border-radius:11px;background:#ffd23a;color:#2a1808;font:900 13px/18px "Trebuchet MS",sans-serif;text-decoration:none;box-shadow:0 0 0 2px #2a1808}' +
    '#pe-menu{position:fixed;inset:0;z-index:300;display:none;align-items:center;justify-content:center;background:rgba(8,6,3,.62);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);pointer-events:auto}#pe-menu.on{display:flex;animation:peFond .18s ease-out}' +
    '#pe-carte{zoom:var(--pe-f,1);width:min(560px,calc(92vw / var(--pe-f,1)));padding:18px 18px 16px;border-radius:26px;background:linear-gradient(165deg,rgba(64,48,26,.97),rgba(24,17,9,.98));border:1px solid rgba(255,214,130,.35);box-shadow:0 24px 60px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,235,180,.18);animation:peEntre .26s cubic-bezier(.2,1.2,.3,1)}' +
    '#pe-carte h3{display:flex;align-items:center;justify-content:space-between;margin:0 4px 14px;font:900 20px/1 "Trebuchet MS",system-ui,sans-serif;letter-spacing:.5px;color:#ffe9b8}#pe-carte h3 button{width:38px;height:38px;padding:0;border-radius:50%;border:1px solid rgba(255,214,130,.35);background:rgba(0,0,0,.35);color:#ffe9b8;font:700 19px/1 sans-serif;cursor:pointer;box-shadow:none}' +
    '.pe-grille{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}' +
    '.pe-t{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:92px;padding:10px 4px;border-radius:18px;background:linear-gradient(rgba(255,235,190,.1),rgba(255,235,190,.03));border:1px solid rgba(255,214,130,.22);color:#fff4d8;font:700 14px/1.15 "Trebuchet MS",system-ui,sans-serif;text-align:center;cursor:pointer;box-shadow:none;text-shadow:none;transition:transform .08s,background .12s}' +
    '.pe-t:active,.pe-t:hover{background:linear-gradient(rgba(255,214,110,.3),rgba(255,214,110,.12));border-color:#ffd66e;transform:scale(.97)}.pe-t b{font-size:34px;line-height:1;font-weight:400}.pe-t b img{width:34px;height:34px}.pe-t u{position:absolute;right:8px;top:8px;min-width:20px;padding:1px 5px;border-radius:11px;background:#ffd23a;color:#2a1808;font:900 13px/18px "Trebuchet MS",sans-serif;text-decoration:none}' +
    '.pe-zoom{display:flex;align-items:center;gap:10px;margin-top:12px;padding:8px 8px 8px 16px;border-radius:18px;background:rgba(0,0,0,.28);border:1px solid rgba(255,214,130,.18);color:#fff4d8;font:700 15px/1 "Trebuchet MS",system-ui,sans-serif}.pe-zoom span{flex:1}.pe-zoom button{width:52px;height:44px;padding:0;border-radius:14px;border:1px solid rgba(255,214,130,.35);background:rgba(255,235,190,.1);color:#ffe9b8;font:900 24px/1 sans-serif;cursor:pointer;box-shadow:none}.pe-zoom button:disabled{opacity:.35}' +
    '@keyframes peFond{from{opacity:0}}@keyframes peEntre{from{transform:translateY(26px) scale(.94);opacity:0}}' +
    'body.pe-compact #cpt-donjon,body.pe-compact #dem-chrono,body.pe-compact #mort-gob{zoom:var(--z-top,1)}';
  document.head.appendChild(st);
  // ---------- le bouton ⋯ et son menu ----------
  let bouton = null, menu = null;
  const boutons = () => { const b = document.getElementById('buttons'); return b ? Array.from(b.children) : []; };
  const nomDe = b => { const l = b.querySelector('.l'); return (l ? l.textContent : (b.title || b.textContent || '').replace(/\s*\(.*\)\s*$/, '')).trim() || 'Son'; };
  const icone = b => { const e = b.querySelector('.e'); if (e) return e.innerHTML; const t = (b.textContent || '').trim(), m = t.match(/^\S+/); return b.id === 'btn-sound' ? b.innerHTML : m ? m[0] : '•'; };
  function fermer() { if (menu) menu.classList.remove('on'); }
  function ouvrir() {
    if (!menu) { menu = document.createElement('div'); menu.id = 'pe-menu'; document.body.appendChild(menu); menu.addEventListener('pointerdown', e => { if (e.target === menu) fermer(); }); }
    const zm = document.getElementById('zoom-moins'), zp = document.getElementById('zoom-plus'), pts = (document.getElementById('tech-pts') || {}).textContent || '';
    const L = boutons().filter(b => b.tagName === 'BUTTON' && !b.hidden && b.style.display !== 'none');
    menu.innerHTML = '<div id="pe-carte"><h3><span>Menu</span><button id="pe-x" aria-label="Fermer">✕</button></h3><div class="pe-grille">' + L.map((b, i) => '<button class="pe-t" data-i="' + i + '"><b>' + icone(b) + '</b>' + nomDe(b).replace(/[&<>]/g, '') + (b.id === 'btn-tech' && pts.trim() ? '<u>' + pts.replace(/[^0-9]/g, '') + '</u>' : '') + '</button>').join('') + '</div>'
      + (zm && zp ? '<div class="pe-zoom"><span>🔍 Zoom de la vue</span><button id="pe-zm"' + (zm.disabled ? ' disabled' : '') + '>−</button><button id="pe-zp"' + (zp.disabled ? ' disabled' : '') + '>+</button></div>' : '') + '</div>';
    menu.querySelector('#pe-x').onclick = fermer;
    menu.querySelectorAll('.pe-t').forEach(t => { t.onclick = () => { const b = L[+t.dataset.i]; fermer(); if (b) b.click(); }; });
    if (zm && zp) { const maj = () => { menu.querySelector('#pe-zm').disabled = zm.disabled; menu.querySelector('#pe-zp').disabled = zp.disabled; }; menu.querySelector('#pe-zm').onclick = () => { zm.click(); maj(); }; menu.querySelector('#pe-zp').onclick = () => { zp.click(); maj(); }; }
    menu.classList.add('on'); if (CG.sfx) CG.sfx('uiOpen');
  }
  Pe.ouvrir = ouvrir; Pe.fermer = fermer;
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && menu && menu.classList.contains('on')) { e.stopPropagation(); fermer(); } }, true);
  // ---------- on suit la taille de l'écran ----------
  let vu = '';
  Pe.maj = function () {
    const e = Pe.etat(), f = e === 'grand' ? 1 : Pe.facteur(), cle = e + f.toFixed(2); 
    if (!bouton) { const side = document.getElementById('side'); if (side) { bouton = document.createElement('button'); bouton.id = 'pe-plus'; bouton.title = 'Menu'; bouton.innerHTML = '⋯'; bouton.onclick = ouvrir; side.appendChild(bouton); } }
    if (bouton) { const pts = ((document.getElementById('tech-pts') || {}).textContent || '').replace(/[^0-9]/g, ''), h = '⋯' + (pts ? '<u>' + pts + '</u>' : ''); if (bouton.innerHTML !== h) bouton.innerHTML = h; }
    if (cle !== vu) { vu = cle; document.body.classList.toggle('pe-compact', e !== 'grand'); document.body.classList.toggle('pe-mobile', e === 'mobile'); document.documentElement.style.setProperty('--pe-f', (e === 'grand' ? 1 : Math.max(1, f * 0.9)).toFixed(3));
      if (Ba) Ba.PAR = Pe.CASES[e] || 10; if (e === 'grand') fermer(); If.apply(); }
    // l'indice d'action (E) reste au-dessus de la barre des sorts, quelle que soit sa hauteur
    const hint = document.getElementById('hint'), sp = document.getElementById('spells');
    if (hint && sp) { if (e === 'grand' || document.body.classList.contains('building')) { if (hint.style.bottom) hint.style.bottom = ''; } else { const r = sp.getBoundingClientRect(), z = +getComputedStyle(document.documentElement).getPropertyValue('--z-hint') || 1, b = r.height ? Math.round((window.innerHeight - r.top + 14) / z) + 'px' : ''; if (hint.style.bottom !== b) hint.style.bottom = b; } }
  };
  window.addEventListener('resize', () => { vu = ''; Pe.maj(); }); setInterval(Pe.maj, 400); Pe.maj();
})(window.CG);
