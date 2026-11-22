// Goblin Malin — jouer sans clavier ni souris, sur une tablette ou un téléphone.
//   • Le pouce gauche, n'importe où dans la moitié gauche de l'écran : une manette apparaît sous le doigt, on marche en glissant
//     (poussée à fond, le chef court s'il a appris à courir).
//   • À droite : ⚔️ pour frapper (on peut garder le doigt dessus), ✋ quand il y a quelque chose à faire (la touche E), ↻ pour tourner une construction.
//   • Un petit coup de doigt sur le jeu = un clic de souris (frapper par là, ouvrir une hutte, poser une construction).
//   • Les sorts, les pouvoirs et l'indice d'action se touchent directement.
//   • Sur un téléphone, la page est dessinée comme sur un écran de 720 de haut puis rapetissée (tout tient, comme à l'ordinateur),
//     les commandes tactiles sont grossies d'autant, et on demande de tenir l'appareil couché.
// Rien ne change à l'ordinateur : tout se met en place au premier toucher (ou d'office sur un appareil tactile). Essai à la souris : index.html#tactile
'use strict';
(function (CG) {
  const UI = CG.UI, Ta = CG.Tactile = { on: false, vec: null, ZONE: 0.5, RAYON: 60, MORT: 0.22, COURSE: 0.94, PETIT: 720, f: 1, REPETE: 0.14 };
  const $ = id => document.getElementById(id);
  let cv = null, stick = null, vise = null, miens = new Set(), boite = null, base = null, pommeau = null, bFrappe = null, bAgir = null, bTourne = null, frappeT = null;

  // ---------- les touches : le jeu croit qu'on a appuyé sur le clavier ----------
  function ev(type, k) {
    const key = k === 'Space' ? ' ' : k, code = k === 'Space' ? 'Space' : /^[0-9]$/.test(k) ? 'Digit' + k : k.length === 1 ? 'Key' + k.toUpperCase() : k;
    window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true }));
  }
  Ta.touche = function (k) { ev('keydown', k); ev('keyup', k); };
  const souris = (type, x, y) => cv.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true }));
  const clic = (x, y) => { souris('mousemove', x, y); souris('mousedown', x, y); souris('mouseup', x, y); };
  const enJeu = () => CG.running && !UI.modal && CG.R && !CG.R.death;

  // ---------- la manette ----------
  function manette() {
    let want = new Set(); Ta.vec = null;
    if (stick && stick.bouge && enJeu()) {
      const dx = stick.x - stick.x0, dy = stick.y - stick.y0, d = Math.hypot(dx, dy), k = Math.min(1, d / (Ta.RAYON * Ta.f));
      if (k > Ta.MORT) {
        const ux = dx / d, uy = dy / d; Ta.vec = { x: ux, y: uy };
        if (ux < -0.38) want.add('a'); else if (ux > 0.38) want.add('d');
        if (uy < -0.38) want.add('w'); else if (uy > 0.38) want.add('s');
        if (k >= Ta.COURSE) want.add('Shift');
      }
    }
    for (const k of miens) if (!want.has(k)) CG.keys.delete(k);
    for (const k of want) CG.keys.add(k);
    miens = want;
  }
  function dessineManette() {
    if (!base) return;
    if (!stick || !stick.bouge) { base.classList.remove('on'); return; }
    const dx = stick.x - stick.x0, dy = stick.y - stick.y0, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / (Ta.RAYON * Ta.f));
    base.classList.add('on'); base.style.left = stick.x0 + 'px'; base.style.top = stick.y0 + 'px';
    pommeau.style.transform = 'translate(' + (dx / d * k * Ta.RAYON * Ta.f).toFixed(1) + 'px,' + (dy / d * k * Ta.RAYON * Ta.f).toFixed(1) + 'px)';
    base.classList.toggle('court', k >= Ta.COURSE);
  }
  const trouve = (list, id) => { for (const t of list) if (t.identifier === id) return t; return null; };
  function debut(e) {
    if (!enJeu()) return; // une fenêtre est ouverte, ou on n'est pas en jeu : le toucher fait son clic ordinaire
    e.preventDefault(); // à nous de dire ce que vaut ce toucher (sinon le navigateur ajoute ses propres clics, en retard)
    for (const t of e.changedTouches) {
      const gauche = t.clientX < window.innerWidth * Ta.ZONE, R = CG.R;
      if (gauche && !stick) stick = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t0: performance.now(), bouge: false };
      else if (R.build && !vise) { vise = { id: t.identifier, x: t.clientX, y: t.clientY }; souris('mousemove', t.clientX, t.clientY); } // on promène la construction sous le doigt ; elle se pose quand on le lève
      else if (!R.build) clic(t.clientX, t.clientY);
    }
  }
  function bouge(e) {
    if (!stick && !vise) return; e.preventDefault();
    const s = stick && trouve(e.changedTouches, stick.id), v = vise && trouve(e.changedTouches, vise.id);
    if (s) { stick.x = s.clientX; stick.y = s.clientY; if (!stick.bouge && Math.hypot(stick.x - stick.x0, stick.y - stick.y0) > 9 * Ta.f) stick.bouge = true; if (stick.bouge) { const dx = stick.x - stick.x0, dy = stick.y - stick.y0, d = Math.hypot(dx, dy); const m = Ta.RAYON * Ta.f * 1.5; if (d > m) { stick.x0 += dx / d * (d - m); stick.y0 += dy / d * (d - m); } } } // la manette suit le pouce s'il s'éloigne trop
    if (v) { vise.x = v.clientX; vise.y = v.clientY; souris('mousemove', vise.x, vise.y); }
  }
  function fin(e) {
    const s = stick && trouve(e.changedTouches, stick.id), v = vise && trouve(e.changedTouches, vise.id);
    if (s) { const st = stick; stick = null; if (e.type === 'touchend' && !st.bouge && performance.now() - st.t0 < 350 && CG.running && !UI.modal) clic(st.x, st.y); } // un simple coup de doigt : un clic
    if (v) { const vi = vise; vise = null; if (e.type === 'touchend' && CG.running && !UI.modal) clic(vi.x, vi.y); }
    if (s || v) e.preventDefault();
  }

  // ---------- les boutons ----------
  function bouton(id, icone, nom, appui, relache) {
    const b = document.createElement('div'); b.id = id; b.className = 'tc-b'; b.textContent = icone; b.setAttribute('role', 'button'); b.setAttribute('aria-label', nom);
    const a = e => { e.preventDefault(); e.stopPropagation(); b.classList.add('appui'); appui(); }, r = e => { if (e.cancelable) e.preventDefault(); b.classList.remove('appui'); if (relache) relache(); };
    b.addEventListener('touchstart', a, { passive: false }); b.addEventListener('touchend', r); b.addEventListener('touchcancel', r);
    b.addEventListener('mousedown', a); b.addEventListener('mouseup', r); b.addEventListener('mouseleave', r);
    boite.appendChild(b); return b;
  }
  function frapper(on) { clearInterval(frappeT); frappeT = null; if (!on) return; Ta.touche('Space'); frappeT = setInterval(() => { if (enJeu()) Ta.touche('Space'); }, Ta.REPETE * 1000); }
  function construire() {
    boite = document.createElement('div'); boite.id = 'tc';
    boite.innerHTML = '<div id="tc-base"><i></i></div>';
    document.body.appendChild(boite); { const d = document.createElement('div'); d.id = 'tc-debout'; d.innerHTML = '<div><b>📱</b><p>Tourne ton appareil sur le côté pour jouer.</p></div>'; document.body.appendChild(d); } base = $('tc-base'); pommeau = base.firstChild;
    bFrappe = bouton('tc-frappe', '⚔️', 'Frapper', () => frapper(true), () => frapper(false));
    bAgir = bouton('tc-agir', '✋', 'Agir', () => Ta.touche('e'));
    bTourne = bouton('tc-tourne', '↻', 'Tourner la construction', () => Ta.touche('r'));
    // les sorts et les pouvoirs de la barre, et l'indice d'action : on les touche comme on appuierait sur leur touche
    const sorts = e => {
      if (!Ta.on) return; const s = e.target.closest && e.target.closest('.spell'); if (!s || s.classList.contains('meta') || s.dataset.i !== undefined) return; e.preventDefault(); /* les sorts de la barre : barre.js s'en occupe (toucher = lancer, glisser = déplacer) */
      if (s.classList.contains('new')) return Ta.touche('g'); const i = s.querySelector('i'), k = i ? i.textContent.trim().toLowerCase() : ''; if (k.length === 1) Ta.touche(k);
    };
    const indice = e => { if (!Ta.on || !/<b>E<\/b>/.test($('hint').innerHTML)) return; e.preventDefault(); Ta.touche('e'); };
    [['spells', sorts], ['hint', indice]].forEach(q => { const el = $(q[0]); if (!el) return; el.addEventListener('touchstart', q[1], { passive: false }); el.addEventListener('click', q[1]); });
  }
  function boutons() {
    if (!boite) return; const R = CG.R, h = $('hint'), jeu = enJeu() && !R.night && !R.cine;
    boite.classList.toggle('jeu', !!jeu);
    bAgir.classList.toggle('on', !!(jeu && h && h.style.display !== 'none' && /<b>E<\/b>/.test(h.innerHTML)));
    bTourne.classList.toggle('on', !!(jeu && R.build && R.build.type !== 'demolir'));
    if (!jeu && frappeT) frapper(false);
  }

  // ---------- les petits écrans : la page est dessinée plus grande que l'écran, puis rapetissée pour tout faire tenir ----------
  function vue() {
    const m = document.querySelector('meta[name=viewport]'); if (!m) return;
    const court = Math.min(screen.width, screen.height), long = Math.max(screen.width, screen.height), couche = window.innerWidth >= window.innerHeight, petit = Ta.on && court < Ta.PETIT;
    const c = petit && couche ? 'width=' + Math.round(long * Ta.PETIT / court) + ', viewport-fit=cover' : 'width=device-width, initial-scale=1, viewport-fit=cover';
    if (m.getAttribute('content') !== c) m.setAttribute('content', c);
    document.body.classList.toggle('tc-debout', petit && !couche);
    Ta.f = petit && couche ? CG.clamp(Ta.PETIT / court * 0.8, 1, 2.2) : 1; document.documentElement.style.setProperty('--tc', Ta.f.toFixed(2)); // la manette et les boutons gardent une taille de pouce
  }

  // ---------- mise en route ----------
  Ta.activer = function () {
    if (Ta.on || !cv) return; Ta.on = true; if (!boite) construire();
    document.body.classList.add('tactile'); vue();
    try { if (!localStorage.getItem('goblin-malin-tactile')) { Ta.accueil = true; } } catch (e) { /* rien */ }
  };
  function boucle() {
    requestAnimationFrame(boucle); if (!Ta.on) return;
    manette(); dessineManette(); boutons();
    if (Ta.accueil && enJeu() && UI.toast) { Ta.accueil = false; try { localStorage.setItem('goblin-malin-tactile', '1'); } catch (e) { /* rien */ } UI.toast('📱 Glisse ton pouce à gauche pour marcher. À droite : ⚔️ pour frapper, ✋ pour agir. Touche un sort pour le lancer.'); }
  }
  const css = document.createElement('style');
  css.textContent = 'html,body{touch-action:manipulation;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}#game{touch-action:none}'
    + '#tc{position:fixed;inset:0;z-index:40;pointer-events:none;user-select:none;-webkit-user-select:none}'
    + '#tc-base{position:absolute;left:0;top:0;width:calc(132px*var(--tc,1));height:calc(132px*var(--tc,1));margin:calc(-66px*var(--tc,1)) 0 0 calc(-66px*var(--tc,1));border-radius:50%;background:rgba(20,14,6,.28);border:3px solid rgba(255,227,107,.5);box-shadow:0 0 0 2px rgba(0,0,0,.25);opacity:0;transition:opacity .12s}'
    + '#tc-base.on{opacity:1}#tc-base.court{border-color:#ffe36b}#tc-base i{position:absolute;left:50%;top:50%;width:calc(58px*var(--tc,1));height:calc(58px*var(--tc,1));margin:calc(-29px*var(--tc,1)) 0 0 calc(-29px*var(--tc,1));border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#c9962a);border:3px solid #3a2606;box-shadow:0 3px 8px rgba(0,0,0,.5)}'
    + '.tc-b{position:absolute;display:none;align-items:center;justify-content:center;border-radius:50%;pointer-events:auto;touch-action:none;cursor:pointer;color:#fff;background:rgba(34,24,12,.72);border:3px solid #8a6a2a;box-shadow:0 4px 0 rgba(0,0,0,.4),inset 0 2px 0 rgba(255,226,160,.18);line-height:1}'
    + '.tc-b.appui{transform:translateY(3px) scale(.95);background:rgba(90,61,26,.9);border-color:#ffe36b;box-shadow:0 1px 0 rgba(0,0,0,.4)}'
    + '#tc.jeu #tc-frappe{display:flex;right:calc(22px*var(--tc,1) + env(safe-area-inset-right,0px));bottom:calc(26px*var(--tc,1) + env(safe-area-inset-bottom,0px));width:calc(96px*var(--tc,1));height:calc(96px*var(--tc,1));font-size:calc(44px*var(--tc,1));border-color:#c9502a}'
    + '#tc.jeu #tc-agir.on{display:flex;right:calc(132px*var(--tc,1) + env(safe-area-inset-right,0px));bottom:calc(20px*var(--tc,1) + env(safe-area-inset-bottom,0px));width:calc(72px*var(--tc,1));height:calc(72px*var(--tc,1));font-size:calc(34px*var(--tc,1));border-color:#ffe36b;animation:tcPouls 1.1s ease-in-out infinite}'
    + '#tc.jeu #tc-tourne.on{display:flex;right:calc(38px*var(--tc,1) + env(safe-area-inset-right,0px));bottom:calc(136px*var(--tc,1) + env(safe-area-inset-bottom,0px));width:calc(64px*var(--tc,1));height:calc(64px*var(--tc,1));font-size:calc(34px*var(--tc,1));font-weight:bold;border-color:#6ab04a}'
    + '@keyframes tcPouls{50%{box-shadow:0 4px 0 rgba(0,0,0,.4),0 0 0 7px rgba(255,227,107,.28)}}'
    + 'body.menu-icones #tc.jeu .tc-b{margin-bottom:62px}body.nuit #tc .tc-b{display:none!important}'
    // en mode tactile : les sorts au milieu en bas (le coin gauche est pour le pouce), plus de petites touches de clavier sur les boutons, l'indice d'action devient un bouton
    + 'body.tactile #spells{left:50%;transform:translateX(-50%);pointer-events:auto}body.tactile .spell{cursor:pointer}body.tactile #buttons button i{display:none}'
    + 'body.tactile #hint{pointer-events:auto;cursor:pointer;bottom:78px}body.tactile #hint b{display:none}body.tactile #hint::before{content:"✋";margin-right:7px}body.tactile.building #hint{bottom:300px}'
    // écran bas (téléphone couché) : le menu passe sur deux colonnes, pour laisser le coin du bas aux boutons d'action
    + '@media (max-height:700px){body.tactile:not(.menu-icones) #buttons{display:grid;grid-template-columns:1fr 1fr;width:300px}body.tactile:not(.menu-icones) #buttons button{font-size:14px;padding:7px 8px;white-space:nowrap}}'
    + '#tc-debout{display:none;position:fixed;inset:0;z-index:500;pointer-events:auto;align-items:center;justify-content:center;text-align:center;background:#10140c;color:#f4ead0;padding:30px}'
    + 'body.tc-debout #tc-debout{display:flex}#tc-debout b{display:block;font-size:76px;animation:tcTourne 2.4s ease-in-out infinite}#tc-debout p{font-size:22px;font-weight:bold;margin:18px 0 0}@keyframes tcTourne{0%,25%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}';
  document.head.appendChild(css);

  window.addEventListener('load', () => {
    cv = $('game'); if (!cv) return;
    cv.addEventListener('touchstart', debut, { passive: false }); cv.addEventListener('touchmove', bouge, { passive: false });
    window.addEventListener('touchend', fin, { passive: false }); window.addEventListener('touchcancel', fin, { passive: false });
    window.addEventListener('touchstart', () => Ta.activer(), { capture: true, passive: true }); // le premier toucher allume tout, même sur un portable à écran tactile
    ['gesturestart', 'gesturechange'].forEach(n => document.addEventListener(n, e => e.preventDefault())); // pas de zoom à deux doigts au milieu d'un combat
    window.addEventListener('resize', () => { if (Ta.on) vue(); }); window.addEventListener('orientationchange', () => setTimeout(() => { if (Ta.on) vue(); }, 200));
    window.addEventListener('blur', () => { stick = null; vise = null; frapper(false); });
    let gros = false; try { gros = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches; } catch (e) { /* rien */ }
    if (gros || /tactile/.test(location.hash)) Ta.activer();
    requestAnimationFrame(boucle);
  });
})(window.CG);
