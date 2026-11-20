// Goblin Malin — taille de l'interface : chaque morceau du HUD et chaque sorte de fenêtre se grossit ou se rapetisse à part (Pause → onglet Interface).
'use strict';
(function (CG) {
  const UI = CG.UI, KEY = 'goblin-malin-interface', If = CG.Interface = { MIN: 40, MAX: 250 };
  If.DEF = { mini: 130 }; // les tailles de départ (tout le reste : 100 %)
  // sur un petit écran, tout est réduit d'office pour que rien ne se chevauche : le HUD sous 1250 × 720, les fenêtres sous 1100 × 700
  If.REF = { hud: [1250, 720], fen: [1100, 700] }; If.FEN = ['panel', 'dialog'];
  If.facteur = k => { const r = If.REF[If.FEN.includes(k) ? 'fen' : 'hud']; return CG.clamp(Math.min(window.innerWidth / r[0], window.innerHeight / r[1]), 0.5, 1); };
  // id du réglage, élément visé, nom affiché
  If.ZONES = [
    ['player', '#player', '❤️', 'Barre du chef (vie, mana, fioles)'], ['top', '#top', '☀️', 'Horloge et ressources'], ['spells', '#spells', '✨', 'Barre des sorts'],
    ['mini', '#mini', '🗺️', 'Mini-carte'], ['boutons', '#buttons', '🧭', 'Boutons du menu'], ['toasts', '#toasts', '📣', 'Annonces'], ['hint', '#hint', '🅴', 'Indice d\'action (E)'], ['build', '#buildbar', '🔨', 'Barre Construire'],
    ['panel', '#panel', '🪟', 'Fenêtres (village, grimoire, arbre, aide...)'], ['dialog', '#dialog', '💬', 'Dialogues']
  ];
  let vals = {}; try { vals = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { vals = {}; }
  if (vals.side && !vals.mini && !vals.boutons) { vals.mini = vals.boutons = vals.side; } // l'ancien réglage commun vaut pour les deux
  const get = k => CG.clamp(+vals[k] || If.DEF[k] || 100, If.MIN, If.MAX);
  If.apply = function () { If.ZONES.forEach(z => document.documentElement.style.setProperty('--z-' + z[0], (get(z[0]) / 100 * If.facteur(z[0])).toFixed(3))); document.body.classList.toggle('menu-icones', vals.menu === 'icones'); };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(vals)); } catch (e) { /* rien */ } };
  { const st = document.createElement('style'); st.textContent = If.ZONES.map(z => z[1] + ' { zoom: var(--z-' + z[0] + ', 1); }').join('\n'); document.head.appendChild(st); }
  // les boutons en icônes restent en bas à droite, même quand la barre Construire s'ouvre : c'est la barre qui se pousse vers la gauche s'ils se touchent
  If.caler = function () { const bar = document.getElementById('buildbar'), bt = document.getElementById('buttons'); if (!bar || !bt) return; bar.style.marginLeft = '';
    if (vals.menu !== 'icones' || bar.hidden) return; const r = bar.getBoundingClientRect(), b = bt.getBoundingClientRect(), trop = r.right + 12 - b.left; if (trop > 0 && r.width > 0) bar.style.marginLeft = (-trop / (get('build') / 100 * If.facteur('build'))).toFixed(1) + 'px'; };
  { let att = 0; const plusTard = () => { if (att) return; att = requestAnimationFrame(() => { att = 0; If.caler(); }); }; const ap0 = If.apply; If.apply = function () { const r = ap0.apply(this, arguments); plusTard(); return r; };
    if (window.MutationObserver) { new MutationObserver(plusTard).observe(document.body, { attributes: true, attributeFilter: ['class'] }); const bar = document.getElementById('buildbar'); if (bar) new MutationObserver(plusTard).observe(bar, { attributes: true, attributeFilter: ['hidden'] }); } }
  If.apply(); window.addEventListener('resize', () => If.apply());

  // ---------- l'aperçu : pendant qu'on règle, la fenêtre de pause s'efface et le morceau réglé est montré, encadré ----------
  let cible = null, faux = null, toastT = 0;
  function montrer(k) {
    cacher(); const z = If.ZONES.find(q => q[0] === k), el = document.querySelector(z[1]), m = document.getElementById('modal'); cible = el;
    if (k !== 'panel') m.classList.add('if-voir');
    if (!el) return;
    if (k === 'dialog' && el.hidden) { faux = { el, html: el.innerHTML }; el.hidden = false; el.innerHTML = '<div style="padding:18px 22px"><b style="font-size:18px">Gruk, ton forgeron</b><p style="margin:8px 0 0">Chef, c\'est un exemple de dialogue, pour voir la taille. Tu me trouves assez gros comme ça ?</p></div>'; }
    else if ((k === 'build' || k === 'hint') && (el.hidden || el.style.display === 'none')) { faux = { el, hidden: el.hidden, disp: el.style.display, html: k === 'hint' ? el.innerHTML : null }; el.hidden = false; el.style.display = ''; if (k === 'hint' && !el.innerHTML.trim()) el.innerHTML = '<b>E</b> Exemple d\'action'; }
    else if (k === 'toasts' && performance.now() - toastT > 2500) { toastT = performance.now(); UI.toast('📣 Exemple d\'annonce, pour voir la taille.'); }
    el.classList.add('if-cible');
  }
  function cacher() {
    const m = document.getElementById('modal'); if (m) m.classList.remove('if-voir');
    if (cible) cible.classList.remove('if-cible'); cible = null;
    if (faux) { const f = faux; faux = null; if (f.el.id === 'dialog') { f.el.hidden = true; f.el.innerHTML = f.html; } else { f.el.hidden = f.hidden; f.el.style.display = f.disp; if (f.html !== null) f.el.innerHTML = f.html; } }
  }

  // ---------- les onglets de la fenêtre de pause ----------
  let onglet = 'son';
  If.attach = function () {
    const p = document.getElementById('panel'), tabs = p.querySelector('#pz-tabs'); if (!tabs) return;
    tabs.innerHTML = '<button data-o="son" class="' + (onglet === 'son' ? 'on' : '') + '">🔊 Son</button><button data-o="hud" class="' + (onglet === 'hud' ? 'on' : '') + '">🖥️ Interface</button><button data-o="data" class="' + (onglet === 'data' ? 'on' : '') + '">💾 Parties</button>';
    tabs.querySelectorAll('button').forEach(b => b.onclick = () => { onglet = b.dataset.o; CG.sfx('click'); cacher(); UI.pause(); });
    if (onglet === 'data') return donnees(p);
    if (onglet !== 'hud') return;
    const list = p.querySelector('.list'), note = p.querySelector('.note'), quote = p.querySelector('.quote'), fa = If.facteur('top');
    if (quote) quote.textContent = 'Grossis ou rapetisse chaque morceau à ton goût. Pendant que tu bouges une réglette, la pause s\'efface et le morceau réglé est encadré.';
    if (note) note.textContent = 'Gardé d\'une partie à l\'autre, sur cet appareil.' + (fa < 0.995 ? ' Ton écran est petit : tout est réduit d\'office à ' + Math.round(fa * 100) + ' % de ces réglages, pour que rien ne se chevauche.' : '');
    list.className = 'list if-list';
    const menuRow = '<div class="row"><span class="ic">▦</span><div><b>Boutons du menu : disposition</b><small>' + (vals.menu === 'icones' ? 'Petites icônes en bas à droite' : 'Liste sous la mini-carte') + '</small></div><button id="if-menu" style="width:auto;padding:5px 12px;font-size:14px">' + (vals.menu === 'icones' ? '↩ Remettre en liste' : '▦ Passer en icônes') + '</button></div>'; // juste sous la réglette de taille des mêmes boutons
    list.innerHTML = If.ZONES.map(z => '<div class="row"><span class="ic">' + z[2] + '</span><div><b>' + z[3] + (z[0] === 'boutons' ? ' : taille' : '') + '</b><input type="range" min="' + If.MIN + '" max="' + If.MAX + '" step="5" value="' + get(z[0]) + '" data-z="' + z[0] + '" aria-label="' + z[3] + '"></div><output>' + get(z[0]) + ' %</output><button data-r="' + z[0] + '" title="Remettre par défaut (' + (If.DEF[z[0]] || 100) + ' %)">↺</button></div>' + (z[0] === 'boutons' ? menuRow : '')).join('');
    const maj = () => { list.querySelectorAll('input[data-z]').forEach(i => { if (i.dataset.z === '*') return; i.value = get(i.dataset.z); i.parentNode.nextElementSibling.textContent = get(i.dataset.z) + ' %'; }); If.apply(); save(); };
    list.querySelectorAll('input').forEach(i => {
      ['keydown', 'keyup'].forEach(ev => i.addEventListener(ev, e => e.stopPropagation()));
      i.oninput = () => { const k = i.dataset.z, v = +i.value; if (k === '*') { If.ZONES.forEach(z => { vals[z[0]] = v; }); i.parentNode.nextElementSibling.textContent = v + ' %'; } else { vals[k] = v; montrer(k); } maj(); };
      i.onpointerdown = () => { if (i.dataset.z !== '*') montrer(i.dataset.z); };
      i.onchange = i.onpointerup = i.onblur = cacher;
    });
    list.querySelector('#if-menu').onclick = () => { vals.menu = vals.menu === 'icones' ? 'liste' : 'icones'; save(); If.apply(); CG.sfx('click'); UI.pause(); };
    list.querySelectorAll('button[data-r]').forEach(b => b.onclick = () => { const k = b.dataset.r; if (k === '*') vals = { menu: vals.menu }; else delete vals[k]; CG.sfx('click'); maj(); const a = list.querySelector('input[data-z="*"]'); if (k === '*' && a) { a.value = 100; a.parentNode.nextElementSibling.textContent = '—'; } });
  };
  // ---------- l'onglet Parties : supprimer sa partie, remettre les paramètres par défaut, tout effacer ----------
  If.recharger = () => window.location.reload();
  const oter = l => l.forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* rien */ } });
  const PARAMS = [KEY, 'clan-gobelin-son'], RESTE = ['gobelinmalin.records', 'goblin-malin-tombes', 'goblin-malin-config', 'goblin-malin-chef-look'];
  If.effacer = function (quoi) {
    if (quoi === 'partie' || quoi === 'tout') { CG.dead = true; CG.wipe(); } else CG.save(); // la partie en cours est gardée quand on ne touche qu'aux paramètres
    if (quoi === 'params' || quoi === 'tout') oter(PARAMS); if (quoi === 'tout') oter(RESTE);
    If.recharger();
  };
  function donnees(p) {
    const S = CG.S, list = p.querySelector('.list'), note = p.querySelector('.note'), quote = p.querySelector('.quote'), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    if (quote) quote.textContent = 'Ce qui est gardé sur cet appareil. Chaque bouton demande une confirmation, puis le jeu repart de l\'écran d\'accueil.'; if (note) note.textContent = 'Une suppression ne se rattrape pas.';
    const row = (ic, t, sous, id, lab) => '<div class="row"><span class="ic">' + ic + '</span><div><b>' + t + '</b><small>' + sous + '</small></div><button data-e="' + id + '" style="width:auto;padding:5px 12px;font-size:14px">' + lab + '</button></div>';
    list.className = 'list if-list';
    list.innerHTML = row('🗑️', 'Supprimer ma partie', S ? '« ' + esc(S.name || 'Chef') + ' », jour ' + S.day + '. Tes paramètres, tes difficultés débloquées et le cimetière des anciens chefs restent.' : 'Aucune partie en cours.', 'partie', 'Supprimer')
      + row('↺', 'Paramètres par défaut', 'Tailles de l\'interface, disposition du menu et réglages du son. Ta partie est gardée.', 'params', 'Remettre')
      + row('💥', 'Tout effacer', 'La partie, les paramètres, les difficultés débloquées, le cimetière des anciens chefs et l\'apparence du chef.', 'tout', 'Tout effacer');
    list.querySelectorAll('button[data-e]').forEach(b => { let sur = 0; b.onclick = () => { if (Date.now() - sur < 4000) return If.effacer(b.dataset.e); sur = Date.now(); const t = b.textContent; b.textContent = '⚠️ Sûr ? Clique encore'; b.style.borderColor = '#ff7a6a'; CG.sfx('no'); setTimeout(() => { if (document.body.contains(b)) { b.textContent = t; b.style.borderColor = ''; } }, 4000); }; });
  }
  const close0 = UI.close; UI.close = function () { cacher(); return close0.apply(this, arguments); };
})(window.CG);
