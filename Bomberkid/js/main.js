// Écrans, menu, sélection des personnages, boucle de jeu, redimensionnement.
(function (BK) {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  BK.current = null; BK.selectedChar = (() => { try { return localStorage.getItem('bk.char') || 'zachary'; } catch (e) { return 'zachary'; } })();
  BK.show = id => { $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + id)); BK.screen = id; const st = document.getElementById('btn-stop-test'); if (st) st.hidden = true; if (BK.music) { if (id === 'editor') BK.music.play('editor'); else if (id !== 'game') BK.music.play('menu'); } if (id === 'menu') { const g = document.getElementById('menu-gold'); if (g && BK.loadGold) g.querySelector('span').textContent = BK.loadGold(); } };   // l'accueil affiche l'or de la famille
  BK.toMenu = () => { BK.current = null; BK.show('menu'); };
  // Pendant un test depuis l'éditeur : un bouton en haut à droite ramène à l'éditeur.
  BK.setTestMode = on => { const b = document.getElementById('btn-stop-test'); if (b) b.hidden = !on; };
  BK.stopTest = () => { BK.overlay.hide(); BK.setTestMode(false); if (BK.editor) { BK.show('editor'); BK.current = BK.editor; } else BK.toMenu(); };
  BK.wrapText = (ctx, text, x, y, maxW, lh) => { const words = text.split(' '); let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = t; } if (line) ctx.fillText(line, x, y); };

  // ---- fenêtre modale
  const ov = { el: null, show(o) { const e = ov.el; e.classList.toggle('playful',!!o.playful); e.dataset.menu=o.playful||''; e.querySelector('h2').textContent = o.title || ''; const body = e.querySelector('.body'); body.innerHTML = o.html || (o.text ? '<p>' + o.text + '</p>' : ''); const btns = e.querySelector('.buttons'); btns.innerHTML = ''; for (const b of o.buttons || []) { const el = document.createElement('button'); el.textContent = b.label; if (b.primary) el.className = 'primary'; el.addEventListener('click', () => { BK.audio.click(); b.onClick && b.onClick(); }); btns.appendChild(el); } e.classList.add('on'); const first = btns.querySelector('button.primary') || btns.querySelector('button'); if (first) setTimeout(() => first.focus(), 50); }, hide() { ov.el.classList.remove('on'); } };
  BK.overlay = ov;

  BK.showOptions = done => {BK.overlay.show({title:'Options',html:'<label><input id="friendly-fire" type="checkbox" '+(BK.settings.friendlyFire?'checked':'')+'> Tir allié</label><p>Autorise les bombes du héros à blesser ses alliés. Désactivé par défaut. Tes propres bombes restent dangereuses pour toi.</p>',buttons:[{label:'Fermer',primary:true,onClick:()=>{BK.overlay.hide();if(done)done();}}]});document.querySelector('#friendly-fire').onchange=e=>BK.setFriendlyFire(e.target.checked);};

  // ---- sélection d'un personnage (commune aux deux modes)
  function portrait(def, size) {
    const c = document.createElement('canvas'); c.width = size; c.height = size; const ctx = c.getContext('2d');
    ctx.translate(size / 2, size * 0.9); BK.sprites.drawCharacter(ctx, def, { s: size * 0.62, pose: 'idle', t: 0, view: 'front' });
    return c;
  }
  BK.pickCharacter = o => {
    BK.show('chars'); $('#chars-title').textContent = o.title==='Défis'?'Qui relève le défi ?':o.title==='Aventure'?'Qui part à l’aventure ?':'Choisis ton héros !'; $('#chars-sub').textContent = 'Touche ton personnage préféré.';
    const grid = $('#char-grid'); grid.innerHTML = '';
    const family=$('#chars-family');let expanded=false;
    const refresh=()=>{const selected=BK.charById(BK.selectedChar);$('#chars-play').textContent='Jouer avec '+selected.name+' →';$$('#char-grid .char').forEach(x=>{x.hidden=!expanded&&x.dataset.adult==='true'&&x.dataset.id!==BK.selectedChar;x.setAttribute('aria-pressed',String(x.dataset.id===BK.selectedChar));});};
    family.textContent='Toute la famille ↓';family.setAttribute('aria-expanded','false');family.onclick=()=>{expanded=!expanded;family.textContent=expanded?'Les jeunes seulement ↑':'Toute la famille ↓';family.setAttribute('aria-expanded',String(expanded));refresh();};
    for (const [index,id] of BK.ORDER.entries()) {
      const d = BK.charById(id), b = document.createElement('button'); b.className = 'char' + (id === BK.selectedChar ? ' sel' : ''); b.dataset.id = id;b.dataset.adult=String(!['enfant','toutpetit'].includes(d.role));b.style.setProperty('--enter-delay',Math.min(index,7)*45+'ms');b.setAttribute('aria-label',d.name);
      b.appendChild(portrait(d, 96)); const n = document.createElement('span'); n.textContent = d.name; b.appendChild(n); b.style.setProperty('--c', d.outfit);
      b.addEventListener('click', () => { BK.audio.click(); BK.selectedChar = id; try { localStorage.setItem('bk.char', id); } catch (e) { } $$('#char-grid .char').forEach(x => x.classList.toggle('sel', x.dataset.id === id)); refresh();o.onSelect && o.onSelect(id); });
      grid.appendChild(b);
    }
    refresh();
    const opts = $('#mode-options'); opts.innerHTML = o.optionsHtml || ''; o.onOptions && o.onOptions(opts);
    $('#chars-play').onclick = () => { BK.audio.click(); o.onPlay(BK.selectedChar, opts); };
    $('#chars-back').onclick = () => { BK.audio.click(); BK.toMenu(); };
  };

  // ---- aventure : choix du tableau
  BK.showAdventureSelect = (charId, worldIndex) => {
    if (worldIndex !== 'custom') { BK.showWorldSelect(charId, { zoom: worldIndex == null ? 0 : worldIndex }); return; }   // les mondes : îles flottantes zoomées
    BK.current = null; BK.show('adventure'); const save = BK.loadAdventure(charId), el = $('#stage-list'); el.innerHTML = '';
    if (worldIndex === 'custom') {
      $('#adventure-title').textContent = 'Mes tableaux'; const maps = BK.loadMaps();
      $('#adventure-sub').textContent = maps.length ? 'Les tableaux créés dans l’éditeur, du plus récent au plus ancien.' : 'Aucun tableau pour l’instant : crée-en un avec le bouton Éditeur du menu.';
      for (const m of maps) { const b = document.createElement('button'); b.className = 'stage'; b.innerHTML = '<b>' + esc(m.name) + '</b><span>' + m.cols + ' × ' + m.rows + ' · ' + esc((BK.THEMES[m.theme] || {}).name || m.theme) + '</span><small>' + (m.enemies || []).length + ' ennemi' + ((m.enemies || []).length > 1 ? 's' : '') + (m.grid.some(l => l.includes('G') || l.includes('|')) ? ' · but' : ' · élimination') + '</small>'; b.addEventListener('click', () => { BK.audio.click(); BK.editor = null; BK.show('game'); BK.current = new BK.Adventure(charId, 0, { custom: BK.mapToStage(m) }); }); const del = document.createElement('span'); del.className = 'del'; del.textContent = '🗑️'; del.title = 'Supprimer'; del.addEventListener('click', e => { e.stopPropagation(); if (confirm('Supprimer « ' + m.name + ' » ?')) { BK.deleteMap(m.id); BK.showAdventureSelect(charId, 'custom'); } }); b.appendChild(del); el.appendChild(b); }
      $('#adventure-back').onclick = () => { BK.audio.click(); BK.showWorldSelect(charId); }; $('#adventure-reset').onclick = () => { BK.audio.click(); BK.openEditorSetup(); };
      $('#adventure-reset').textContent = 'Ouvrir l’éditeur'; return;
    }
    $('#adventure-reset').textContent = 'Effacer la progression';
    const list = BK.stageList().filter(s => worldIndex == null || s.world === BK.WORLDS[worldIndex]);
    $('#adventure-title').textContent = 'Aventure de ' + BK.charById(charId).name;
    $('#adventure-sub').textContent = save.score ? 'Meilleur score : ' + save.score : 'Choisis un tableau. Les suivants se débloquent en réussissant le précédent.';
    let world = null;
    const all = BK.stageList();
    list.forEach((s) => { const i = all.findIndex(x => x.id === s.id);
      if (s.world !== world) { world = s.world; const h = document.createElement('h3'); h.textContent = world.name; h.style.setProperty('--c', BK.THEMES[world.theme].floor); el.appendChild(h); }
      const locked = i + 1 > save.unlocked, b = document.createElement('button'); b.className = 'stage' + (locked ? ' locked' : '');
      b.innerHTML = '<b>' + s.id + '</b><span>' + (locked ? '🔒 ' : '') + s.name + '</span><small>' + (s.objective === 'boss' ? (s.id.endsWith('4') ? '👑 Boss' : '⚔️ Mini-boss') : s.objective === 'switches' ? '🔘 Interrupteurs' : '👾 Monstres') + (save.best[s.id] ? ' · ' + save.best[s.id] + ' pts' : '') + '</small>';
      if (!locked) b.addEventListener('click', () => { BK.audio.click(); BK.startAdventure(charId, i); });
      el.appendChild(b);
    });
    $('#adventure-back').onclick = () => { BK.audio.click(); BK.showWorldSelect(charId); };
    $('#adventure-reset').onclick = () => { if (confirm('Effacer la progression de ' + BK.charById(charId).name + ' ?')) { BK.saveAdventure(charId, { unlocked: 1, best: {}, score: 0 }); BK.showAdventureSelect(charId, worldIndex); } };
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // ---- éditeur : taille, décor et fond, ou un tableau sauvegardé
  BK.openEditorSetup = () => {
    const maps = BK.loadMaps();
    const themes = Object.entries(BK.THEMES).map(([k, t]) => '<option value="' + k + '"' + (k === 'garden' ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('');
    const saved = maps.length ? '<p class="saved-title">Ou reprendre un tableau :</p><div class="saved">' + maps.map(m => '<span class="row"><button data-id="' + esc(m.id) + '">' + esc(m.name) + ' <small>' + m.cols + '×' + m.rows + '</small></button><button class="del" data-del="' + esc(m.id) + '" title="Supprimer">🗑️</button></span>').join('') + '</div>' : '';
    BK.overlay.show({ title: 'Nouveau tableau', html: '<div class="opt form"><label>Nom <input id="e-name" value="Mon tableau" maxlength="40"></label><label>Largeur <input id="e-cols" type="number" min="9" max="48" value="20"></label><label>Hauteur <input id="e-rows" type="number" min="7" max="48" value="16"></label><label>Décor <select id="e-theme">' + themes + '</select></label><label>Fond <select id="e-base"><option value="~">Eau</option><option value=" ">Vide (ciel)</option><option value=".">Pierre</option><option value=",">Gazon</option></select></label></div>' + saved,
      buttons: [{ label: 'Créer', primary: true, onClick: () => { const v = id => document.getElementById(id).value; const cols = Math.max(9, Math.min(48, +v('e-cols') || 20)), rows = Math.max(7, Math.min(48, +v('e-rows') || 16)); BK.overlay.hide(); BK.openEditor({ name: v('e-name') || 'Mon tableau', cols, rows, theme: v('e-theme'), base: v('e-base') }); } }, { label: 'Annuler', onClick: () => { BK.overlay.hide(); } }] });
    document.querySelectorAll('#overlay .saved button[data-id]').forEach(b => b.addEventListener('click', () => { const m = maps.find(x => x.id === b.dataset.id); if (m) { BK.overlay.hide(); BK.openEditor(m); } }));
    document.querySelectorAll('#overlay .saved button[data-del]').forEach(b => b.addEventListener('click', () => { const m = maps.find(x => x.id === b.dataset.del); if (m && confirm('Supprimer « ' + m.name + ' » ?')) { BK.deleteMap(m.id); BK.overlay.hide(); BK.openEditorSetup(); } }));
  };
  BK.openEditor = (m, o) => { BK.show('editor'); BK.current = BK.editor = new BK.Editor(m, o); };
  BK.startHub = charId => { BK.show('game'); BK.current = new BK.Hub(charId); };
  BK.showWorldSelect = (charId, o) => { BK.show('game'); BK.current = new BK.WorldSelect(charId, o); };
  const adventurePicker = () => ({ title: 'Aventure', subtitle: 'Qui part à l’aventure ?', onPlay: id => BK.showWorldSelect(id) });
  BK.adventurePicker = adventurePicker;
  BK.startAdventure = (charId, i, o) => { BK.show('game'); BK.current = new BK.Adventure(charId, i, o); };

  // ---- match : options
  const matchPicker = () => ({
    title: 'Match', subtitle: 'Choisis ton bombardier et tes adversaires.',
    optionsHtml: '<div class="opt"><label>Adversaires <select id="m-foes"><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option></select></label>' +
      '<label>Niveau <select id="m-level"><option value="facile">Facile</option><option value="moyen" selected>Moyen</option><option value="difficile">Difficile</option></select></label>' +
      '<label>Manches à gagner <select id="m-rounds"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option></select></label>' +
      '<label>Décor <select id="m-theme"><option value="random">Au hasard</option><option value="arena">Arène</option><option value="forest">Forêt</option><option value="castle">Château</option><option value="lava">Volcan</option></select></label>' +
      '<label><input type="checkbox" id="m-p2"> Joueur 2 au clavier (WASD · F)</label><label id="m-p2-wrap" hidden>Personnage J2 <select id="m-p2-char"></select></label></div>',
    onOptions: el => { const sel = el.querySelector('#m-p2-char'); for (const id of BK.ORDER) { const o = document.createElement('option'); o.value = id; o.textContent = BK.charById(id).name; sel.appendChild(o); } sel.value = BK.ORDER.find(x => x !== BK.selectedChar); el.querySelector('#m-p2').addEventListener('change', e => { el.querySelector('#m-p2-wrap').hidden = !e.target.checked; }); try { const s = JSON.parse(localStorage.getItem('bk.match') || 'null'); if (s) { for (const [k, v] of Object.entries(s)) { const i = el.querySelector('#' + k); if (!i) continue; if (i.type === 'checkbox') i.checked = v; else i.value = v; } el.querySelector('#m-p2-wrap').hidden = !el.querySelector('#m-p2').checked; } } catch (e) { } },
    onPlay: (id, el) => {
      const v = s => el.querySelector(s).value; const p2 = el.querySelector('#m-p2').checked;
      try { localStorage.setItem('bk.match', JSON.stringify({ 'm-foes': v('#m-foes'), 'm-level': v('#m-level'), 'm-rounds': v('#m-rounds'), 'm-theme': v('#m-theme'), 'm-p2': p2, 'm-p2-char': v('#m-p2-char') })); } catch (e) { }
      const players = [{ charId: id, human: 0 }]; const used = new Set([id]);
      if (p2) { let c = v('#m-p2-char'); if (used.has(c)) c = BK.ORDER.find(x => !used.has(x)); players.push({ charId: c, human: 1 }); used.add(c); }
      const pool = BK.ORDER.filter(x => !used.has(x)).sort(() => Math.random() - 0.5);
      const foes = Math.min(+v('#m-foes'), 4 - players.length);
      for (let i = 0; i < foes; i++) players.push({ charId: pool[i], human: null, level: v('#m-level') });
      BK.show('game'); BK.current = new BK.Match({ players, roundsToWin: +v('#m-rounds'), theme: v('#m-theme') });
    },
  });

  // ---- boucle
  let last = 0, acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now; acc += dt;
    if (BK.refreshBagButton) BK.refreshBagButton();
    const pauseButton=$('#btn-pause'); if(pauseButton) pauseButton.hidden=!(BK.screen==='game' && BK.current?.showPause && BK.current.state==='play' && !BK.inventoryOpen);
    const cur = BK.current; if (!cur) { BK.input.flush(); return; }
    let steps = 0;
    while (acc >= BK.STEP && steps < 4) { if (!BK.inventoryOpen) cur.update(BK.STEP); BK.input.flush(); acc -= BK.STEP; steps++; }
    if (steps === 4) acc = 0;
    const ctx = BK.screen === 'debug' ? BK.debugCtx : BK.screen === 'editor' ? BK.editorCtx : BK.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, BK.W, BK.H);
    cur.render(ctx);
  }
  function resize() {
    const k = Math.min(innerWidth / BK.W, innerHeight / BK.H);
    for (const c of $$('canvas.stage')) { c.style.width = Math.floor(BK.W * k) + 'px'; c.style.height = Math.floor(BK.H * k) + 'px'; }
    document.documentElement.style.setProperty('--k', k);
  }

  window.addEventListener('DOMContentLoaded', () => {
    BK.canvas = $('#game'); BK.ctx = BK.canvas.getContext('2d'); BK.debugCtx = $('#debug-canvas').getContext('2d');
    BK.canvas.addEventListener('pointerdown', e => { const cur = BK.current; if (!cur || !cur.onClick) return; const r = BK.canvas.getBoundingClientRect(); cur.onClick((e.clientX - r.left) / r.width * BK.W, (e.clientY - r.top) / r.height * BK.H); });
    $('#btn-pause').addEventListener('click',()=>{const cur=BK.current;if(BK.screen!=='game'||BK.inventoryOpen||cur?.state!=='play'||!cur.showPause)return;BK.audio.click();cur.showPause();});
    $('#version').textContent = 'v' + BK.VERSION;
    const mb = $('#btn-music'); if (mb && BK.music) { const lab = () => { mb.textContent = '🎵 Musique : ' + (BK.music.enabled ? 'on' : 'off'); }; lab(); mb.addEventListener('click', () => { BK.music.toggle(); lab(); }); BK.music.onChange = lab; }
    const musicStart=$('#btn-start-music'),titleButton=$('#btn-title');
    if(BK.music){BK.music.onPlayback=blocked=>{musicStart.hidden=!blocked;};musicStart.addEventListener('click',()=>{BK.audio.unlock();BK.music.resume();});}
    titleButton.addEventListener('click',()=>{titleButton.classList.remove('rebound');void titleButton.offsetWidth;titleButton.classList.add('rebound');BK.audio.unlock();BK.audio.click();BK.music?.resume();});
    titleButton.addEventListener('animationend',e=>{if(e.animationName==='title-rebound')titleButton.classList.remove('rebound');});
    BK.show('menu');
    $('#btn-adventure').addEventListener('click', () => { BK.audio.unlock(); BK.audio.click(); BK.pickCharacter(adventurePicker()); });
    $('#btn-challenges').addEventListener('click', () => { BK.audio.unlock(); BK.audio.click(); BK.pickCharacter({ title: 'Défis', subtitle: 'Qui relève le défi ? L’or gagné va dans la cagnotte de toute la famille.', onPlay: id => BK.showChallenges(id) }); });
    $('#btn-options').addEventListener('click',()=>BK.showOptions());
    $('#btn-debug').addEventListener('click', () => { BK.audio.unlock(); BK.audio.click(); BK.show('debug'); BK.current = new BK.Debug(); });
    $('#btn-editor').addEventListener('click', () => { BK.audio.unlock(); BK.audio.click(); BK.openEditorSetup(); });
    const ec = $('#editor-canvas'); BK.editorCtx = ec.getContext('2d');
    const epos = e => { const r = ec.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * BK.W, (e.clientY - r.top) / r.height * BK.H]; };
    ec.addEventListener('pointerdown', e => { e.preventDefault(); ec.setPointerCapture(e.pointerId); const cur = BK.current; if (cur && cur.onPointer) cur.onPointer('down', ...epos(e), e.buttons); });
    ec.addEventListener('pointermove', e => { const cur = BK.current; if (cur && cur.onPointer) cur.onPointer('move', ...epos(e), e.buttons); });
    ec.addEventListener('pointerup', e => { const cur = BK.current; if (cur && cur.onPointer) cur.onPointer('up', ...epos(e), 0); });
    ec.addEventListener('wheel', e => { e.preventDefault(); const cur = BK.current; if (cur && cur.onWheel) cur.onWheel(e.deltaY); }, { passive: false });
    window.addEventListener('keydown', () => BK.audio.unlock(), { once: true });
    window.addEventListener('pointerdown', () => BK.audio.unlock(), { once: true });
    ov.el = $('#overlay');
    BK.input.setupTouch($('#touch'));
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0; document.body.classList.toggle('touch', touch);
    window.addEventListener('resize', resize); resize();
    const ready = window.FamilyHeads ? window.FamilyHeads.ready : Promise.resolve();
    ready.then(() => { $('#loading').hidden = true; requestAnimationFrame(frame); autoStart(); });
  });
  // Démarrage direct par l'adresse (pratique pour tester) : #debug, #match, #stage=1-2, #char=adam
  function autoStart() {
    const h = new URLSearchParams(location.hash.replace(/^#/, '').replace(/,/g, '&'));
    // #map=maps/x.bomberkid.json : ouvre un tableau exporté (dans l'éditeur avec editor, sinon on y joue) — il faut un serveur http
    if (h.has('map')) { fetch(h.get('map')).then(r => r.json()).then(m => { if (h.has('char') && BK.charById(h.get('char'))) BK.selectedChar = h.get('char'); if (h.has('editor')) BK.openEditor(m); else { BK.show('game'); BK.current = new BK.Adventure(BK.selectedChar, 0, { custom: BK.mapToStage(m) }); if (h.has('skip')) { BK.current.state = 'play'; BK.current.world.frozen = false; } } applyHash(h); }).catch(e => console.warn('map :', e)); return; }
    if (h.has('char') && BK.charById(h.get('char'))) BK.selectedChar = h.get('char');
    if (h.has('pick')) BK.pickCharacter(h.get('pick') === 'match' ? matchPicker() : adventurePicker());
    else if (h.has('challenges')) BK.showChallenges(BK.selectedChar);
    else if (h.has('challenge')) { const ch = BK.CHALLENGES.find(x => x.id === h.get('challenge')); if (ch) { BK.startChallenge(BK.selectedChar, ch); if (h.has('skip') && BK.current && BK.current.world) { BK.current.state = 'play'; BK.current.world.frozen = false; } } }
    else if (h.has('worlds')) { BK.showWorldSelect(BK.selectedChar, h.has('zoom') ? { zoom: isNaN(+h.get('zoom')) ? h.get('zoom') : +h.get('zoom'), pick: h.get('choose') } : undefined); if (h.has('ff') && BK.current) { const n = Math.round(+h.get('ff') * 60); for (let i = 0; i < n; i++) BK.current.update(1 / 60); } }
    else if (h.has('hub')) BK.startHub(BK.selectedChar);
    else if (h.has('shop')) { const hub = new BK.Hub(BK.selectedChar); if (h.has('gold')) hub.save.gold = +h.get('gold'); BK.show('game'); BK.current = new BK.Interior(hub); }
    else if (h.has('editor')) { BK.openEditor({ name: 'Essai', cols: +(h.get('cols') || 20), rows: +(h.get('rows') || 16), theme: h.get('theme') || 'garden', base: h.get('theme') === 'interior' ? 'y' : '~' }); if (h.has('search') && BK.editor && BK.editor.searchBox) { BK.editor.searchBox.value = h.get('search'); BK.editor.searchBox.dispatchEvent(new Event('input')); } if (h.has('tab')) { const b = document.querySelector('#editor-panel .tabs button[data-id="' + h.get('tab') + '"]'); if (b) b.click(); } if (h.has('set')) for (const spec of h.get('set').split('_')) { const [c, r, ch] = spec.split('-'); BK.editor.grid[+r][+c] = ch; } if (h.has('lv')) for (const spec of h.get('lv').split('_')) { const [c, r, n] = spec.split('-').map(Number); BK.editor.props[c + ',' + r] = Object.assign(BK.editor.props[c + ',' + r] || {}, { lv: n }); } if (h.has('set') || h.has('lv')) BK.editor.rebuild(); if (h.has('test')) { BK.editor.test(); if (BK.current && BK.current.state === 'intro') { BK.current.state = 'play'; BK.current.world.frozen = false; } } if (h.has('tool')) { const b = Array.from(document.querySelectorAll('#editor-panel .item')).find(x => x.textContent.includes(h.get('tool'))); if (b) b.click(); } if (h.has('paint')) for (const cr of h.get('paint').split('_')) { const [c, r] = cr.split('-').map(Number); BK.editor.snapshot(); BK.editor.paint(c, r, true); } if (BK.editor) BK.editor.renderOptions(); }
    else if (h.has('select')) BK.showAdventureSelect(BK.selectedChar);
    else if (h.has('debug')) { BK.show('debug'); BK.current = new BK.Debug(); if (h.has('pose')) { BK.current.pose = h.get('pose'); BK.current.selPose.value = h.get('pose'); } if (h.has('view')) BK.current.view = h.get('view'); }
    else if (h.has('match')) { const pool = BK.ORDER.filter(x => x !== BK.selectedChar).sort(() => Math.random() - 0.5); const players = [{ charId: BK.selectedChar, human: h.has('bots') ? null : 0 }, ...pool.slice(0, 3).map(c => ({ charId: c, human: null, level: 'moyen' }))]; BK.show('game'); BK.current = new BK.Match({ players, roundsToWin: 2, theme: h.get('theme') || 'random' }); if (h.has('skip')) { BK.current.state = 'play'; BK.current.world.frozen = false; } }
    else if (h.has('stage') && h.get('stage') === 'jardin') { BK.startAdventure(BK.selectedChar, 0, { custom: BK.GARDEN_STAGE }); if (h.has('skip')) { BK.current.state = 'play'; BK.current.world.frozen = false; } }   // l'ancien 1-1
    else if (h.has('stage')) { const i = BK.stageList().findIndex(s => s.id === h.get('stage')); if (i >= 0) { BK.startAdventure(BK.selectedChar, i); if (h.has('skip')) { BK.current.state = 'play'; BK.current.world.frozen = false; } } }
    applyHash(h);
  }
  // réglages après le démarrage : tele, metal, house, deco, enemy, bomb, ff…
  function applyHash(h) {
    if (h.has('tele') && BK.current && BK.current.player) { const [c, r] = h.get('tele').split('-').map(Number); BK.current.player.x = c + 0.5; BK.current.player.y = r + 0.5; BK.current.updateCamera && BK.current.updateCamera(0, true); }
    if (h.has('metal') && BK.current && BK.current.world) { for (const spec of h.get('metal').split('.')) { const [c, r, d] = spec.split('-'); const W = BK.current.world, i = W.idx(+c, +r); W.cells[i] = BK.METAL; W.metal[i] = +d; } }
    if (h.has('house') && BK.current && BK.current.world) { const [c, r, w, d, roof] = h.get('house').split('-'); BK.current.world.houses[c + ',' + r] = { w: +w, d: +d, roof: '#' + roof }; }
    if (h.has('deco') && BK.current && BK.current.world) { const W = BK.current.world; for (const spec of h.get('deco').split('.')) { const [c, r, ch] = spec.split('-'); const d = BK.DECO[ch] || (BK.DECO_PROPS[ch] != null ? [ch, BK.DECO_PROPS[ch]] : null); if (!d) continue; const i = W.idx(+c, +r); W.deco[i] = d[0]; W.cells[i] = d[1] === 2 ? BK.SOFT : d[1] === 1 ? BK.HARD : 0; if (d[0] === 'campfire') W.campfires.push({ c: +c, r: +r }); if (d[0] === 'beehive') W.hives.push({ c: +c, r: +r, cool: 0 }); } }
    if (h.has('hp') && BK.current && BK.current.player) BK.current.player.hp = +h.get('hp');
    if (h.has('poison') && BK.current && BK.current.player) BK.current.world.poisonPlayer(BK.current.player, null);
    if (h.has('carrot') && BK.current && BK.current.player) { const p = BK.current.player; p.inv = p.inv || []; p.inv.push({ type: 'carrot', n: +h.get('carrot') || 1 }); }
    if (h.has('gloves') && BK.current && BK.current.player) BK.current.player.gloves = true;
    if (h.has('lantern') && BK.current && BK.current.player) BK.current.player.lantern = true;
    if (h.has('hour') && BK.current && BK.current.world) BK.current.world.time = +h.get('hour') || 0;   // moment du cycle jour-nuit (secondes)
    if ((h.has('rod') || h.has('fish') || h.has('cooked') || h.has('spore')) && BK.current && BK.current.player) { const p = BK.current.player; p.inv = p.inv || []; if (h.has('rod')) p.inv.push({ type: 'rod', n: 1, perm: 1 }); if (h.has('fish')) p.inv.push({ type: 'fish', n: +h.get('fish') || 1 }); if (h.has('cooked')) p.inv.push({ type: 'fishcooked', n: 1 }); if (h.has('spore')) p.inv.push({ type: 'spore', n: +h.get('spore') || 1 }); if (h.has('use')) BK.current.world.useItem(p, 0); }
    if (h.has('erupt') && BK.current && BK.current.world) for (const v of BK.current.world.volcanoes) v.cool = 0;
    if (h.has('cook') && BK.current && BK.current.player) BK.current.world.cookFish(BK.current.player);
    if (h.has('honey') && BK.current && BK.current.player) { const p = BK.current.player; p.inv = [{ type: 'honey', n: +h.get('honey') || 3 }]; if (h.has('use')) BK.current.world.useItem(p, 0); }
    if (h.has('stamina') && BK.current && BK.current.player) BK.current.player.stamina = +h.get('stamina');
    if (h.has('drink') && BK.current && BK.current.player) { BK.current.world.update(1 / 60); BK.current.world.drink(BK.current.player); }
    if (h.has('coins') && BK.current && BK.current.world) { const W = BK.current.world; for (const spec of h.get('coins').split('.')) { const [c, r] = spec.split('-'); W.spawnItem(+c, +r, 'coin'); } }
    if (h.has('enemy') && BK.current && BK.current.world) for (const spec of h.get('enemy').split('.')) { const [type, c, r] = spec.split('-'); if (BK.ENEMIES[type]) BK.current.world.addEnemy(type, +c, +r); }
    if (h.has('bomb') && BK.current && BK.current.world && BK.current.player) { const W = BK.current.world, p = BK.current.player; const [c, r] = h.get('bomb').split('-').map(Number); const b = { cx: c, cy: r, x: c + 0.5, y: r + 0.5, z: 0, t: 30, fire: 2, owner: p, state: 'idle', passers: new Set(), born: W.time }; W.bombs.push(b); if (h.has('onbomb')) { p.x = b.x; p.y = b.y; p.onBomb = b; p.zOff = 0.55; b.passers.add(p); if (h.has('leap')) W.leap(p, +h.get('leap')); } }
    if (h.has('diamond') && BK.current && BK.current.world) { const W = BK.current.world, [c, r] = h.get('diamond').split('-').map(Number); W.exit = { c, r, open: true, kind: 'diamond', x: c + 0.5, y: r + 0.5 }; W.special.set(c + ',' + r, { type: 'exit' }); }
    if (h.has('celebrate') && BK.current && BK.current.startCelebration) { BK.current.state = 'play'; BK.current.world.frozen = false; BK.current.startCelebration(h.get('celebrate')); }
    if (h.has('lift') && BK.current && BK.current.world) { const W = BK.current.world, [c, r] = h.get('lift').split('-').map(Number); W.lifts.push({ c, r, lv: Math.round(W.hAt(c, r) / 0.6), t: 1, moving: false }); }
    if (h.has('boom') && BK.current && BK.current.world) for (const b of BK.current.world.bombs.slice()) BK.current.world.explodeBomb(b);
    if (h.has('ff')) { const n = Math.round(+h.get('ff') * 60); for (let i = 0; i < n && BK.current; i++) BK.current.update(BK.STEP); }
  }
})(window.BK);
