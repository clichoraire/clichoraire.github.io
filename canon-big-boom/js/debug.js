// Mode Debug / éditeur de tableaux (temporaire, visible seulement avec le personnage Matthieu).
// Permet de lancer un tableau, le mettre en pause, l'accélérer ou le ralentir, modifier les monstres et leurs arrivées
// (séquence de groupes ordonnés, mélangés, glisser-déposer), le visuel, l'objectif, puis sauvegarder le tout en JSON dans tableaux/.
(function (CB) {
  const D = CB.Debug = {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TYPES = { endless: 'Nuit sans fin (infini)', kill: 'Abattre N ennemis', survive: 'Survivre X secondes', killTimed: 'Abattre N avant la fin du chrono', boss: 'Boss', sink: 'Couler N bateaux (monde des pirates)', cibles: '🎯 Mini-jeu : tir aux cibles', brigands: '🤠 Mini-jeu : brigand et civils' };
  const SPEEDS = [.25, .5, 1, 2, 4];

  D.fromSlot = (wi, vi) => {
    const w = CB.WORLDS[wi], d = CB.waveDef(wi, vi), cw = (CB.CUSTOM_WAVES || {})[w.id + '-' + (vi + 1)]; if (cw) return JSON.parse(JSON.stringify(cw));   // tableau déjà relié : on repart de son JSON
    return { slot: w.id + '-' + (vi + 1), world: w.id, name: d.name, text: d.text, type: d.type, goal: d.goal || 10, seconds: d.seconds || 40, density: d.density || 1,
      scene: w.id, sky: w.sky.slice(), ground: w.ground, space: !!w.space, random: { enabled: true, enemies: [...new Set(w.enemies)] }, spawns: [], sequence: d.sequence ? JSON.parse(JSON.stringify(d.sequence)) : [], boss: d.type === 'boss' ? w.boss : null, hpScale: 1, speedScale: 1, maxAlive: d.maxAlive || 0, chestAt: 0, chestEvery: 0, portalAt: 0, cibles: d.cibles ? JSON.parse(JSON.stringify(CB.minigame('cibles', d.cibles))) : undefined, brigands: d.brigands ? JSON.parse(JSON.stringify(CB.minigame('brigands', d.brigands))) : undefined };
  };
  D.blank = (wi, vi) => Object.assign(D.fromSlot(wi, vi), { name: 'Nouveau tableau', text: 'Abats 10 ennemis !', type: 'kill', goal: 10, random: { enabled: false, enemies: [] },
    spawns: [], sequence: [{ kinds: [{ type: 'bat', count: 3, elite: false }], every: .6, at: null, rel: null }], boss: null, spread: 1 });
  // Anciens JSON (spawns = paquets répétés) : convertis en séquence de groupes, une seule façon de faire dans l'éditeur.
  D.normalize = c => { for (const t of ['cibles', 'brigands']) if (c[t] || c.type === t) { c[t] = CB.minigame(t, c[t]); while (c[t].medals.length < 4) c[t].medals.push(1); } if (!Array.isArray(c.sequence)) c.sequence = []; if (Array.isArray(c.spawns) && c.spawns.length) { for (const s of c.spawns) for (let p = 0; p < Math.max(1, Math.round(+s.packs || 1)); p++) c.sequence.push({ kinds: [{ type: s.type, count: Math.max(1, Math.round(+s.count || 1)) }], every: +s.every || .6, at: Math.max(0, +s.at || 0) + p * (+s.interval || 5), elite: !!s.elite }); c.spawns = []; } for (const g of c.sequence) { if (g.at != null && g.rel != null) g.rel = null; if (g.elite) { for (const k of g.kinds || []) k.elite = true; g.elite = false; } g.kinds = (g.kinds || []).filter(k => k && (CB.ENEMIES[k.type] || (String(k.type).startsWith('boss:') && CB.BOSSES[k.type.slice(5)]))); if (g.every == null) g.every = .6; } return c; };
  D.open = def => { const app = CB.app; app.debug = true; app.custom = D.normalize(def); app.startWave(app.custom); };
  D.close = () => { const app = CB.app; D.hide(false); app.debug = false; app.custom = null; app.show('map'); };
  D.restart = () => CB.app.startWave(CB.app.custom);

  // Les champs visuels s'appliquent tout de suite à la vague en cours ; le reste demande « Appliquer ».
  const live = () => { const w = CB.app.wave, c = CB.app.custom; if (!w || !c) return; Object.assign(w.world, { scene: c.scene, sky: c.sky, ground: c.ground, space: !!c.space }); Object.assign(w.def, { goal: +c.goal || 10, seconds: +c.seconds || 40, name: c.name, text: c.text }); if (CB.app.refreshWaveTag) CB.app.refreshWaveTag(); };
  D.menu = null; D.drag = null; D.collapsed = false;
  // Difficulté estimée (★ à ★★★★★) : rang de chaque monstre selon PV × dégâts × vitesse ; les boss sont à part
  const diffMap = (() => { const list = Object.entries(CB.ENEMIES).filter(([k, d]) => !(d.crystal || d.gift || d.chest || d.portal || d.hazard || d.shot || d.target || d.shieldAll || d.orb || d.panel || d.secretBoat)).map(([k, d]) => [k, d.hp * (.6 + (d.damage || 0) / 15) * (.7 + (d.speed || 0) / 10)]).sort((a, b) => a[1] - b[1]); const m = {}; list.forEach(([k], i) => { m[k] = 1 + Math.floor(i / list.length * 5); }); return m; })();
  const powerOf = d => d.hp * (1 + (d.damage || 0) / 20) * (.5 + (d.speed || 0) / 8), powerBase = powerOf(CB.ENEMIES.bat) / 2;   // chauve-souris = 2, et ça monte sans plafond (boss : plusieurs centaines)
  D.power = k => { if (k.startsWith('boss:')) { const d = CB.BOSSES[k.slice(5)]; return d ? '💀 ' + Math.round(powerOf({ hp: d.hp, damage: 20, speed: 6 }) / powerBase) : '—'; } const d = CB.ENEMIES[k]; return d && diffMap[k] ? '⚡ ' + Math.max(1, Math.round(powerOf(d) / powerBase)) : '—'; };
  // Cacher / montrer le panneau pendant un test (le HUD reprend toute la largeur ; un petit bouton 🐞 le ramène)
  D.hide = on => { const el = $('#debug-panel'); if (!el) return; D.collapsed = !!on; el.classList.toggle('collapsed', D.collapsed); document.documentElement.style.setProperty('--dbg-w', D.collapsed ? '0px' : (D.width || 360) + 'px');
    let b = $('#dbg-show'); if (!b) { b = document.createElement('button'); b.id = 'dbg-show'; b.className = 'dbg-show'; b.textContent = '🐞'; b.title = 'Montrer le panneau Debug'; b.onclick = () => D.hide(false); document.body.append(b); } b.classList.toggle('on', D.collapsed); };

  D.tab = D.tab || 'objectif'; D.filter = D.filter || ''; D.openGroups = D.openGroups || {};
  // Poignée sur le bord gauche : on l'attrape pour élargir ou rétrécir le panneau (largeur gardée dans le navigateur).
  D.setWidth = w => { w = Math.round(Math.max(280, Math.min(window.innerWidth * .8, w))); D.width = w; document.documentElement.style.setProperty('--dbg-w', w + 'px'); try { localStorage.setItem('cb-debug-width', String(w)); } catch (e) { } return w; };
  try { const saved = +localStorage.getItem('cb-debug-width'); if (saved >= 280) D.setWidth(saved); } catch (e) { }
  D.grip = el => {
    const g = document.createElement('div'); g.className = 'dbg-grip'; g.title = 'Glisse pour changer la largeur'; g.innerHTML = '<i></i>'; el.prepend(g);
    g.onpointerdown = e => { e.preventDefault(); const x0 = e.clientX, w0 = el.getBoundingClientRect().width; g.setPointerCapture(e.pointerId); el.classList.add('resizing'); document.body.classList.add('dbg-resizing');
      g.onpointermove = ev => D.setWidth(w0 + (x0 - ev.clientX));
      g.onpointerup = g.onpointercancel = () => { g.onpointermove = null; el.classList.remove('resizing'); document.body.classList.remove('dbg-resizing'); }; };
    g.ondblclick = () => D.setWidth(360);
  };
  const TABS = [['objectif', '🎯', 'Objectif'], ['visuel', '🎨', 'Visuel'], ['arrivees', '👾', 'Monstres'], ['fichier', '💾', 'Fichier']];
  if (D.tab === 'monstres') D.tab = 'arrivees';
  // Groupes de monstres : par monde, puis les dinosaures, puis le reste (tirs, décors, cibles…)
  const groups = () => {
    const used = new Set(), g = [];
    for (const w of CB.WORLDS) { const list = w.enemies.filter(k => CB.ENEMIES[k] && !used.has(k)); list.forEach(k => used.add(k)); g.push([w.id, w.icon + ' ' + w.short, list]); }
    const dinos = CB.DINOS.filter(k => CB.ENEMIES[k] && !used.has(k)); dinos.forEach(k => used.add(k)); g.push(['dinos', '🦖 Dinosaures', dinos]);
    g.push(['autres', '✨ Spéciaux et décors', Object.keys(CB.ENEMIES).filter(k => !used.has(k))]); g.push(['boss', '💀 Boss', Object.keys(CB.BOSSES).map(k => 'boss:' + k)]); return g;
  };
  const nameOf = k => k.startsWith('boss:') ? (CB.BOSSES[k.slice(5)] || {}).name || k : (CB.ENEMIES[k] || {}).name || k;
  const fld = (label, inner, cls = '') => '<label class="fld ' + cls + '"><span>' + label + '</span>' + inner + '</label>';
  // Réglages d'un mini-jeu (clés pointées « cibles.every.0 » → c.cibles.every[0] ; data-pct : entré en %, gardé en fraction)
  const minigame = (c, type) => {
    const m = c[type] = CB.minigame(type, c[type]), n = (path, v, step = 1, min = 0) => '<input type="number" data-k="' + path + '" value="' + v + '" step="' + step + '" min="' + min + '">';
    const pair = (label, path, a, step = .1, min = 0) => fld(label, '<span class="pair">' + n(path + '.0', a[0], step, min) + '<i>→</i>' + n(path + '.1', a[1], step, min) + '</span>');
    const sel = (label, path, opts, v) => fld(label, '<select data-k="' + path + '">' + Object.entries(opts).map(([k, name]) => '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + esc(name) + '</option>').join('') + '</select>');
    const faces = Object.fromEntries(Object.entries(CB.ENEMIES).filter(([k, d]) => !(d.crystal || d.gift || d.chest || d.portal || d.hazard || d.shot || d.shieldAll || d.orb || d.secretBoat)).map(([k, d]) => [k, d.name]));
    const medals = fld('Médailles · % réussi pour 🥉 🥈 🥇 💎', '<span class="pair">' + [0, 1, 2, 3].map(i => '<input type="number" data-k="' + type + '.medals.' + i + '" data-pct="1" value="' + Math.round((m.medals[i] == null ? 1 : m.medals[i]) * 100) + '" step="5" min="0" max="100">').join('') + '</span>', 'wide');
    if (type === 'cibles') return '<div class="mini wide"><b>🎯 Cibles</b><div class="grid2">' + fld('Nombre de cibles', n('cibles.count', m.count, 1, 1)) + sel('Image de la cible', 'cibles.kind', faces, m.kind) + sel('Déplacement', 'cibles.move', CB.MOVES, m.move) + sel('Arrivent par', 'cibles.side', CB.SIDES, m.side)
      + pair('Écart entre deux (s) début → fin', 'cibles.every', m.every) + pair('Vitesse début → fin', 'cibles.speed', m.speed) + pair('Hauteur min → max', 'cibles.height', m.height, .5) + pair('Profondeur min → max', 'cibles.depth', m.depth, 1, 8) + medals + '</div></div>';
    return '<div class="mini wide"><b>🤠 Brigand et civils</b><div class="grid2">' + fld('Rounds', n('brigands.rounds', m.rounds, 1, 1)) + fld('Pancartes par round', n('brigands.panels', m.panels, 1, 1)) + fld('Méchants par round', n('brigands.bads', m.bads, 1, 1)) + fld('Pause entre rounds (s)', n('brigands.gap', m.gap, .1))
      + sel('Pancarte du méchant', 'brigands.bad', faces, m.bad) + sel('Pancarte des gentils', 'brigands.good', faces, m.good) + pair('Temps levées (s) début → fin', 'brigands.show', m.show) + fld('Vitesse de levée (s)', n('brigands.rise', m.rise, .05, .05))
      + fld('Écart entre pancartes', n('brigands.spacing', m.spacing, .5)) + fld('Hauteur', n('brigands.y', m.y, .5)) + fld('Profondeur', n('brigands.z', m.z, 1, 8)) + medals + '</div></div>';
  };
  D.render = () => {
    const app = CB.app, c = app.custom, el = $('#debug-panel'); if (!c || !el) return;
    const enemyOpts = sel => Object.entries(CB.ENEMIES).map(([k, e]) => '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(e.name) + '</option>').join('');
    const num = (key, v, step = 1, min = 0) => '<input type="number" data-k="' + key + '" value="' + v + '" step="' + step + '" min="' + min + '">';
    let body = '';
    if (D.tab === 'objectif') body = '<div class="grid2">'
      + fld('Nom', '<input data-k="name" value="' + esc(c.name) + '">', 'wide') + fld('Texte affiché', '<input data-k="text" value="' + esc(c.text) + '">', 'wide')
      + fld('Type', '<select data-k="type">' + Object.entries(TYPES).map(([k, n]) => '<option value="' + k + '"' + (k === c.type ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>', 'wide')
      + (c.type === 'cibles' || c.type === 'brigands' ? minigame(c, c.type) : '')
      + fld('À abattre', num('goal', c.goal)) + fld('Secondes', num('seconds', c.seconds)) + fld('Monstres aléatoires du monde', '<span class="switch"><input type="checkbox" data-k="randomOn"' + (c.random.enabled ? ' checked' : '') + '> en plus de la liste Monstres</span>') + fld('Densité (aléatoires)', num('density', c.density, .05)) + fld('Max à l’écran (aléatoires) · 0 = sans limite', num('maxAlive', c.maxAlive || 0)) + fld('Boss', '<select data-k="boss"><option value="">aucun</option>' + Object.entries(CB.BOSSES).map(([k, b]) => '<option value="' + k + '"' + (k === c.boss ? ' selected' : '') + '>' + esc(b.name) + '</option>').join('') + '</select>')
      + fld('PV ×', num('hpScale', c.hpScale || 1, .1, .1)) + fld('Vitesse ×', num('speedScale', c.speedScale || 1, .1, .1))
      + fld('Coffre mystère : premier à (s)', num('chestAt', c.chestAt || 0)) + fld('… puis toutes les (s) · 0 = jamais', num('chestEvery', c.chestEvery || 0)) + fld('Coffre doré (portail) à (s) · 0 = jamais', num('portalAt', c.portalAt || 0), 'wide')
      + fld('Largeur du cône d’apparition', '<span class="range"><input type="range" data-k="spread" min=".2" max="1" step=".05" value="' + (c.spread || 1) + '"><b id="dbg-spread">' + Math.round((c.spread || 1) * 100) + ' %</b></span>', 'wide') + '</div>'
      + '<p class="dbg-help">Monstres aléatoires : ceux du monde du tableau, en plus de ta liste. Densité : plus c’est haut, plus ils arrivent vite. PV × et Vitesse × s’appliquent à tout le monde. Largeur du cône : 100 % = toute la zone visible de l’écran (jamais plus, pour les petits écrans).</p>';
    else if (D.tab === 'visuel') body = '<div class="grid2">' + fld('Scène', '<select data-k="scene">' + CB.Render.SCENE_KEYS.map(k => '<option' + (k === c.scene ? ' selected' : '') + '>' + k + '</option>').join('') + '</select>')
      + fld('Pont de vaisseau', '<span class="switch"><input type="checkbox" data-k="space"' + (c.space ? ' checked' : '') + '> espace</span>')
      + fld('Ciel (haut · milieu · bas)', [0, 1, 2].map(i => '<input type="color" data-sky="' + i + '" value="' + c.sky[i] + '">').join('')) + fld('Sol', '<input type="color" data-k="ground" value="' + c.ground + '">') + '</div>'
      + '<p class="dbg-help">Les couleurs changent en direct dans le jeu.</p>';
    else if (D.tab === 'arrivees') { const f = D.filter.toLowerCase(), seq = c.sequence || [], menu = D.menu != null && seq[D.menu] ? D.menu : null; D.menu = menu;
      const menuHtml = i => '<div class="menu"><div class="dbg-bar"><input class="search" id="dbg-mfilter" placeholder="🔍 Filtrer…" value="' + esc(D.filter) + '"><button data-act="closemenu">✕</button></div><div class="mlist">'
        + groups().map(([id, title, list]) => { const shown = list.filter(k => !f || nameOf(k).toLowerCase().includes(f) || k.includes(f)); if (!shown.length) return ''; return '<div class="mhead">' + title + '</div>' + shown.map(k => '<button type="button" class="mrow" data-pick="' + k + '" data-g="' + i + '"><canvas width="28" height="28" data-icon="' + k + '"></canvas><span class="nm">' + esc(nameOf(k)) + '</span><span class="stars">' + D.power(k) + '</span></button>').join(''); }).join('') + '</div></div>';
      body = '<div class="dbg-bar"><b>Ordre des arrivées</b><span class="count">' + seq.length + ' groupe' + (seq.length > 1 ? 's' : '') + '</span></div><div class="seq">'
        + (seq.length ? seq.map((g, i) => { const mode = g.at != null ? 'at' : g.rel != null ? 'rel' : 'auto', when = mode === 'at' ? g.at : mode === 'rel' ? g.rel : '';
          return '<div class="seq-card" draggable="true" data-seq="' + i + '"><div class="sp-head"><span class="drag" title="Glisser pour déplacer">≡</span><b>#' + (i + 1) + '</b>'
          + '<span class="mini"><button data-move="' + i + ':-1" title="Monter"' + (i ? '' : ' disabled') + '>▲</button><button data-move="' + i + ':1" title="Descendre"' + (i < seq.length - 1 ? '' : ' disabled') + '>▼</button></span>'
          + '<span class="status"></span><button class="sp-del" data-gdel="' + i + '" title="Supprimer">✕</button></div>'
          + '<div class="kinds">' + g.kinds.map((k, j) => '<span class="kind"><canvas width="28" height="28" data-icon="' + k.type + '"></canvas>' + esc(nameOf(k.type)) + ' ×<input type="number" data-g="' + i + '" data-kind="' + j + '" value="' + k.count + '" min="1">' + (k.type.startsWith('boss:') ? '' : '<button class="kelite' + (k.elite ? ' on' : '') + '" data-kelite="' + i + ':' + j + '" title="' + (k.elite ? 'Élites (clique : normaux)' : 'Normaux (clique : élites)') + '">' + (k.elite ? '⭐ élite' : '☆') + '</button>') + '<button data-kdel="' + i + ':' + j + '" title="Enlever">×</button></span>').join('')
          + '<button class="add' + (menu === i ? ' on' : '') + '" data-add="' + i + '">➕ Ajouter un monstre</button></div>' + (menu === i ? menuHtml(i) : '')
          + '<div class="row timing">' + fld('Départ', '<select data-g="' + i + '" data-f="mode"><option value="auto"' + (mode === 'auto' ? ' selected' : '') + '>Après l’élimination du groupe d’avant</option><option value="at"' + (mode === 'at' ? ' selected' : '') + '>À (s) · temps absolu</option><option value="rel"' + (mode === 'rel' ? ' selected' : '') + '>Relatif au groupe d’avant (± s)</option></select>')
          + (mode === 'auto' ? '' : fld(mode === 'at' ? 'À (s)' : '± s après la fin de ses arrivées', '<input type="number" data-g="' + i + '" data-f="when" value="' + when + '" step=".5"' + (mode === 'at' ? ' min="0"' : '') + '>'))
          + fld('Écart (s)', '<input type="number" data-g="' + i + '" data-f="every" value="' + g.every + '" step=".1" min="0">') + '</div></div>'; }).join('')
          : '<p class="dbg-help">Aucun groupe : clique « Nouveau groupe ».</p>') + '</div>'
        + '<div class="dbg-bar"><button class="primary" data-act="newgroup">＋ Nouveau groupe</button></div>'; }
    else body = '<div class="file-grid"><button data-act="save">💾 Sauvegarder le JSON</button><label class="dbg-file">📂 Charger un JSON<input type="file" accept=".json,application/json" id="dbg-file"></label><button data-act="blank">🆕 Nouveau tableau vide</button><button data-act="close">🗺 Quitter le debug</button></div>'
      + '<p class="dbg-help">Le JSON se télécharge dans ton dossier de téléchargements (et se copie dans le presse-papier) : dépose-le dans <b>CanonBigBoom/tableaux/</b>. Pour le relier à la carte, voir tableaux/README.md.</p>';
    el.innerHTML = '<div class="dbg-top"><div class="dbg-head"><b>🐞 DEBUG · ' + esc(c.slot || 'nouveau') + '</b><span class="hd-btns"><button data-act="hide" title="Cacher le panneau pendant le test">⟩ Cacher</button><button class="dbg-x" data-act="close" title="Quitter">✕</button></span></div>'
      + '<div class="dbg-bar"><button data-act="freeze" class="' + (app.W.freeze ? 'on' : '') + '">' + (app.W.freeze ? '▶ Reprendre' : '⏸ Pause') + '</button><button data-act="restart">↻ Recommencer</button><span class="seg">' + SPEEDS.map(s => '<button data-speed="' + s + '" class="' + ((app.W.speed || 1) === s ? 'on' : '') + '">' + s + '×</button>').join('') + '</span></div>'
      + '<div class="dbg-stats" id="dbg-status"></div><div class="dbg-seq" id="dbg-seq"></div>'
      + '<nav class="dbg-tabs">' + TABS.map(([id, ico, label]) => '<button data-tab="' + id + '" class="' + (D.tab === id ? 'on' : '') + '">' + ico + '<small>' + label + '</small></button>').join('') + '</nav></div>'
      + '<div class="dbg-body">' + body + '</div>'
      + '<div class="dbg-foot"><button class="primary" data-act="apply">✔ Appliquer et recommencer</button></div>';
    D.grip(el);
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { D.tab = b.dataset.tab; D.render(); });
    el.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => {
      const k = inp.dataset.k;
      const set = v => { const parts = k.split('.'); let o = c; for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] || (o[parts[i]] = {}); o[parts[parts.length - 1]] = v; };
      if (k === 'randomOn') c.random.enabled = inp.checked; else if (k === 'space') c.space = inp.checked; else if (inp.type === 'number' || inp.type === 'range') set(inp.dataset.pct ? +inp.value / 100 : +inp.value); else set(inp.value);
      if (k === 'boss' && !c.boss) c.boss = null; live(); if (k === 'type') D.render();
    });
    el.querySelectorAll('[data-sky]').forEach(inp => inp.oninput = () => { c.sky[+inp.dataset.sky] = inp.value; live(); });
    const spr = el.querySelector('[data-k="spread"]'); if (spr) spr.oninput = () => { c.spread = +spr.value; const b = el.querySelector('#dbg-spread'); if (b) b.textContent = Math.round(c.spread * 100) + ' %'; };
    const gr = el.querySelector('[data-k="ground"]'); if (gr) gr.oninput = e => { c.ground = e.target.value; live(); };
    el.querySelectorAll('[data-icon]').forEach(cv => { try { CB.Render.enemyIcon(cv.getContext('2d'), cv.dataset.icon, 14, 15, 3.6); } catch (e) { } });
    el.querySelectorAll('details.grp').forEach(d => d.ontoggle = () => { D.openGroups[d.dataset.grpId] = d.open; });
    const flt = el.querySelector('#dbg-filter'); if (flt) { flt.oninput = () => { D.filter = flt.value; const pos = flt.selectionStart; D.render(); const f2 = el.querySelector('#dbg-filter'); if (f2) { f2.focus(); f2.setSelectionRange(pos, pos); } }; }
    const seq = c.sequence || (c.sequence = []);
    el.querySelectorAll('[data-g]').forEach(inp => inp.onchange = () => { const g = seq[+inp.dataset.g]; if (!g) return; if (inp.dataset.kind != null) { const k = g.kinds[+inp.dataset.kind]; if (k) k.count = Math.max(1, Math.round(+inp.value || 1)); return; } const f = inp.dataset.f;
      if (f === 'mode') { const v = g.at != null ? g.at : g.rel != null ? g.rel : 0; g.at = inp.value === 'at' ? Math.max(0, v) : null; g.rel = inp.value === 'rel' ? v : null; D.render(); return; }
      if (f === 'when') { const v = inp.value === '' || isNaN(+inp.value) ? 0 : +inp.value; if (g.at != null) g.at = Math.max(0, v); else if (g.rel != null) g.rel = v; return; }
      g[f] = f === 'elite' ? inp.checked : (inp.value === '' || isNaN(+inp.value) ? .6 : Math.max(0, +inp.value)); });   // écart 0 : tout le groupe d'un coup
    el.querySelectorAll('[data-gdel]').forEach(b => b.onclick = () => { seq.splice(+b.dataset.gdel, 1); D.menu = null; D.render(); });
    el.querySelectorAll('[data-kelite]').forEach(b => b.onclick = () => { const [gi, ki] = b.dataset.kelite.split(':').map(Number), k = (seq[gi] || { kinds: [] }).kinds[ki]; if (k) { k.elite = !k.elite; D.render(); } });   // élite par sorte, pas par groupe
    el.querySelectorAll('[data-kdel]').forEach(b => b.onclick = () => { const [i, j] = b.dataset.kdel.split(':').map(Number); if (seq[i]) seq[i].kinds.splice(j, 1); D.render(); });
    el.querySelectorAll('[data-move]').forEach(b => b.onclick = () => { const [i, d] = b.dataset.move.split(':').map(Number), j = i + d; if (j < 0 || j >= seq.length) return; [seq[i], seq[j]] = [seq[j], seq[i]]; if (D.menu === i) D.menu = j; else if (D.menu === j) D.menu = i; D.render(); });
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const i = +b.dataset.add; D.menu = D.menu === i ? null : i; D.filter = ''; D.render(); const m = el.querySelector('#dbg-mfilter'); if (m) m.focus(); });
    el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { const k = b.dataset.pick, g = seq[+b.dataset.g]; if (!g) return; const have = g.kinds.find(x => x.type === k && !x.elite); if (have) have.count++; else g.kinds.push({ type: k, count: k.startsWith('boss:') ? 1 : 3, elite: false }); D.menu = null; D.filter = ''; D.render(); });
    const mf = el.querySelector('#dbg-mfilter'); if (mf) { mf.oninput = () => { D.filter = mf.value; const pos = mf.selectionStart; D.render(); const f2 = el.querySelector('#dbg-mfilter'); if (f2) { f2.focus(); f2.setSelectionRange(pos, pos); } }; }
    el.querySelectorAll('.seq-card').forEach(card => {   // glisser-déposer pour réordonner
      card.ondragstart = e => { D.drag = +card.dataset.seq; card.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', card.dataset.seq); e.dataTransfer.effectAllowed = 'move'; } catch (err) { } };
      card.ondragend = () => { D.drag = null; el.querySelectorAll('.seq-card').forEach(x => x.classList.remove('dragging', 'over')); };
      card.ondragover = e => { if (D.drag == null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; card.classList.add('over'); };
      card.ondragleave = () => card.classList.remove('over');
      card.ondrop = e => { e.preventDefault(); const from = D.drag, to = +card.dataset.seq; D.drag = null; if (from == null || from === to) return; const [g] = seq.splice(from, 1); seq.splice(to, 0, g); if (D.menu === from) D.menu = to; D.render(); };
    });
    el.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { app.W.speed = +b.dataset.speed; D.render(); });
    el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'freeze') { app.W.freeze = !app.W.freeze; D.render(); }
      else if (a === 'restart' || a === 'apply') D.restart();
      else if (a === 'newgroup') { seq.push({ kinds: [], every: .6, at: null, rel: null }); D.menu = seq.length - 1; D.filter = ''; D.render(); const cards = el.querySelectorAll('.seq-card'); const last = cards[cards.length - 1]; if (last) last.scrollIntoView({ block: 'nearest' }); const m = el.querySelector('#dbg-mfilter'); if (m) m.focus(); }
      else if (a === 'closemenu') { D.menu = null; D.filter = ''; D.render(); }
      else if (a === 'hide') D.hide(true);
      else if (a === 'save') D.save();
      else if (a === 'blank') { const wi = CB.WORLDS.findIndex(w => w.id === c.world); app.custom = D.blank(Math.max(0, wi), app.vi); D.menu = null; D.restart(); }
      else if (a === 'close') D.close();
    });
    const file = $('#dbg-file'); if (file) file.onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(txt => { try { const j = JSON.parse(txt); if (!j || typeof j !== 'object') throw 0; app.custom = D.normalize(Object.assign(D.blank(app.wi, app.vi), j, { random: Object.assign({ enabled: false, enemies: [] }, j.random || {}), spawns: Array.isArray(j.spawns) ? j.spawns : [], sequence: Array.isArray(j.sequence) ? j.sequence : [] })); D.restart(); } catch (err) { alert('JSON invalide'); } }); };
    D.tick();
  };
  D.tick = () => {
    const w = CB.app.wave, st = $('#dbg-status'); if (!w || !st) return;
    const chip = (ico, v, label, cls = '') => '<span class="stat ' + cls + '"><i>' + ico + '</i><b>' + v + '</b><small>' + label + '</small></span>';
    const c = CB.app.custom, sq = $('#dbg-seq');   // où on est rendu dans les groupes : bandeau + cartes colorées
    if (sq && c && c.sequence && c.sequence.length && w.seqStatus) { const stt = c.sequence.map((g, i) => w.seqStatus(i)), done = stt.filter(x => x === 'done').length, cur = stt.lastIndexOf('active') + 1;
      sq.innerHTML = '<b>Groupe ' + Math.min(c.sequence.length, Math.max(1, cur || done + (stt.every(x => x === 'done') ? 0 : 1))) + ' / ' + c.sequence.length + '</b>' + stt.map((x, i) => '<i class="' + x + '" title="#' + (i + 1) + '"></i>').join('') + '<small>' + (stt.every(x => x === 'done') ? 'tous passés' : stt.includes('active') ? 'en cours' : 'en attente') + '</small>';
      document.querySelectorAll('#debug-panel .seq-card').forEach(card => { const x = stt[+card.dataset.seq]; card.classList.toggle('now', x === 'active'); card.classList.toggle('done', x === 'done'); const sb = card.querySelector('.status'); if (sb) sb.textContent = x === 'active' ? '● en cours' : x === 'done' ? '✔ passé' : ''; }); }
    else if (sq) sq.innerHTML = '';
    st.innerHTML = chip('⏱', w.time.toFixed(1) + ' s', 'temps') + chip('👾', w.enemies.length, 'à l’écran') + chip('💥', w.kills, 'abattus') + chip('❤️', Math.ceil(w.hp), 'PV', w.hp < w.maxHp * .3 ? 'low' : '') + (w.over ? chip(w.won ? '✔' : '✖', w.won ? 'GAGNÉ' : 'PERDU', w.won ? '' : w.reason, w.won ? 'win' : 'lose') : '');
  };
  D.save = () => {
    const c = CB.app.custom, json = JSON.stringify(c, null, 2), name = 'tableau-' + (c.slot || 'nouveau') + '.json';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    try { navigator.clipboard && navigator.clipboard.writeText(json); } catch (e) { }
  };
})(window.CB);
