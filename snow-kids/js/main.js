// Snow Kids — écrans (menu, personnages, pistes, boutique, résultats, histoire), boucle de jeu et sauvegarde.
(function (SK) {
  'use strict';
  const $ = id => document.getElementById(id), A = SK.Audio, R = SK.Render, I = SK.Input;
  const SAVE_KEY = 'snowkids.save';
  const DEFAULT_SAVE = { gold: 0, boards: ['freestyle'], unlocked: 1, shinobin: false, won: {}, best: {}, char: 'slash', board: 'freestyle', char2: 'nancy', board2: 'freestyle', diff: 1, sound: true, music: true, laps: 3, ending: false, advChar: null, advBoard: 'freestyle', upgrades: {}, gear: [], wardrobe: [], look: {}, trophies: {}, missions: {} };
  let save = loadSave();
  function loadSave() { try { return Object.assign({}, DEFAULT_SAVE, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULT_SAVE); } }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* mode privé */ } }
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); };

  // ------------------------------------------------------------------ écrans
  const screens = ['menu', 'advselect', 'town', 'records', 'school', 'select', 'course', 'shop', 'story', 'race', 'result'];
  function show(name) { if (name !== 'town' && name !== 'advselect') SK.Town.close(); if (name !== 'shop') SK.Shop.close(); for (const s of screens) $('screen-' + s).classList.toggle('hidden', s !== name); if (name === 'menu') { refreshMenu(); A.music('menu'); } }
  let flow = { mode: 'champ', players: 1, course: null, laps: 3, picks: [] };

  const fakeRacer = SK.fakeRacer;
  const effectiveBoard = id => SK.effectiveBoard(id, save);
  const gold = n => `<span class="gold-inline"><img src="${SK.COIN_SVG}" alt="">${SK.fmtGold(n)}</span>`;
  const gearObj = () => { const o = {}; for (const g of save.gear || []) o[g] = true; return o; };
  const lookFor = charId => SK.lookOf(SK.charById(charId) || SK.CHARACTERS[0], save);

  // ---- menu
  function refreshMenu() {
    $('version').textContent = 'v' + SK.VERSION;
    $('champ-progress').innerHTML = (save.ending ? '✓ terminée · ' : save.unlocked + ' / ' + SK.COURSES.length + ' pistes · ') + gold(save.gold);
    $('opt-diff').value = save.diff; $('opt-sound').checked = save.sound; $('opt-music').checked = save.music;
  }
  function initMenu() {
    SK.DIFFICULTIES.forEach((d, i) => { const o = document.createElement('option'); o.value = i; o.textContent = d; $('opt-diff').appendChild(o); });
    $('opt-diff').onchange = () => { save.diff = +$('opt-diff').value; store(); };
    $('opt-sound').onchange = () => { save.sound = $('opt-sound').checked; A.setEnabled(save.sound); store(); };
    $('opt-music').onchange = () => { save.music = $('opt-music').checked; A.setMusic(save.music); store(); };
    $('btn-adv').onclick = () => { A.sfx('click'); openAdventure(); };
    $('btn-free').onclick = () => { flow = { mode: 'free', players: 1, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-time').onclick = () => { flow = { mode: 'time', players: 1, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-duo').onclick = () => { flow = { mode: 'free', players: 2, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-help').onclick = () => { A.sfx('click'); $('howto').classList.toggle('hidden'); };
    $('btn-help-close').onclick = () => { A.sfx('click'); $('howto').classList.add('hidden'); };
    $('btn-reset').onclick = () => { if (confirm('Effacer toute la progression (pièces, planches, pistes débloquées, Shinobin) ?')) { save = Object.assign({}, DEFAULT_SAVE); store(); refreshMenu(); toast('Sauvegarde effacée'); } };
    $('howto-grid').innerHTML = `
      <div><h3>Le but</h3><p>Descends la piste plus vite que les autres. Au bas de la piste, la <b>remontée mécanique</b> te ramène au sommet pour le tour suivant : une chaise part toutes les ${SK.LIFT_INTERVAL} secondes, une place par chaise. Au dernier tour, la ligne d'arrivée remplace la remontée.</p>
      <h3>Commandes (joueur 1)</h3><ul><li><kbd>←</kbd> <kbd>→</kbd> diriger · <kbd>↑</kbd> se pencher en avant (un peu plus de vitesse) · <kbd>↓</kbd> freiner (utile dans les virages serrés)</li><li><kbd>X</kbd> sauter (sur un tremplin : tiens le bouton pour décoller plus haut)</li><li>En l'air, <kbd>C</kbd> + direction : Grab (seul), <kbd>↑</kbd> salto arrière, <kbd>↓</kbd> salto avant, <kbd>←</kbd>/<kbd>→</kbd> vrille 360</li><li>En l'air, <kbd>X</kbd> + direction : Method (seul), <kbd>↑</kbd> Rodéo, <kbd>↓</kbd> Tornade, <kbd>←</kbd>/<kbd>→</kbd> vrille 720 — plus longues, mieux payées</li><li><kbd>V</kbd> tirer · <kbd>B</kbd> utiliser l'objet · <kbd>Échap</kbd> pause</li></ul>
      <p>Joueur 2 : <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, <kbd>G</kbd> saut, <kbd>H</kbd> figure, <kbd>J</kbd> tir, <kbd>K</kbd> objet. Les manettes marchent aussi (A saut, B figure, X tir, Y objet).</p></div>
      <div><h3>Or et boîtes</h3><p>Les <b>pièces d'or</b> (1 G chacune) traînent sur la piste et s'obtiennent surtout avec les <b>figures</b> : termine-les avant d'atterrir, sinon tu tombes ! Enchaîne plusieurs figures dans un même saut pour multiplier le gain.</p>
      <p>Les <b>boîtes rouges</b> donnent un <b>tir</b>, les <b>boîtes bleues</b> un <b>objet</b> ; chaque boîte coûte 1 pièce d'or (gratuite si tu n'en as pas). Un seul tir et un seul objet à la fois.</p>
      <h3>Tirs (boîtes rouges)</h3><ul>${Object.values(SK.SHOTS).map(s => `<li>${s.icon} <b>${s.name}</b> : ${s.desc}</li>`).join('')}</ul></div>
      <div><h3>Objets (boîtes bleues)</h3><ul>${Object.values(SK.ITEMS).map(s => `<li>${s.icon} <b>${s.name}</b> : ${s.desc}</li>`).join('')}</ul>
      <h3>Aventure et village</h3><p>Choisis ton Kid, puis promène-toi dans le <b>village</b> (← → pour tourner, Entrée pour entrer dans une maison) : le <b>télésiège</b> mène aux pistes, la <b>boutique</b> vend, équipe et améliore les planches, la <b>maison des Kids</b> change de personnage, le <b>chalet des records</b> montre ta progression. L'<b>École</b> propose des missions (slalom entre drapeaux, figures, tir, pièces…), la <b>garde-robe</b> change ton look, la <b>salle des trophées</b> montre tes coupes. Gagne chaque piste (1<sup>re</sup> place) pour débloquer la suivante ; la première victoire sur une piste vaut un <b>trophée et ${SK.TROPHY_GOLD} G</b>. Chaque course rapporte une prime selon la place (${SK.PRIZES.slice(0, 4).join(' / ')}) plus les pièces ramassées.</p>
      <p>Au <b>Pays des Ninjas</b>, un cinquième coureur mystérieux se joint à la course… Bats-le partout et il deviendra jouable.</p>
      <h3>Surfaces</h3><p>La glace glisse (dirige tôt, freine), le sable et l'herbe ralentissent, les sables mouvants engluent. On peut sauter par-dessus les obstacles et les rochers.</p></div>`;
  }
  function menuAnim(t) { return; /* l'accueil est une illustration */
    const cv = $('menu-anim'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5fb0ff'); g.addColorStop(1, '#dff3ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(W, 130); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#e6f0fa'; ctx.beginPath(); ctx.moveTo(0, 75); ctx.lineTo(W, 142); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    for (let i = 0; i < 6; i++) R.drawProp(ctx, i % 2 ? 'pine' : 'fir', ((i * 190 + t * 60) % (W + 100)) - 50, 65 + (((i * 190 + t * 60) % (W + 100)) - 50) / W * 70 - 2, 7, i / 6, t, {});
    const chars = SK.CHARACTERS.filter(c => !c.hidden || save.shinobin);
    chars.forEach((c, i) => { const x = ((i * 150 + t * 90 + Math.sin(t + i) * 10) % (W + 160)) - 80, y = 70 + x / W * 70 - 5; const fr = fakeRacer(c.id); fr.input.steer = Math.sin(t * 2 + i) * 0.5; if (Math.sin(t * 1.3 + i * 2) > 0.8) { fr.state = 'air'; fr.h = (Math.sin(t * 1.3 + i * 2) - 0.8) * 8; } R.drawRacer(ctx, fr, x, y, 34, t, false); });
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97.3 + t * 20) % W, (i * 61.7 + t * 50) % H, 3, 3);
  }

  // ---- Aventure : choix du Kid sur la neige, puis le village
  function openAdventure() { if (save.advChar && SK.charById(save.advChar) && (save.advChar !== 'shinobin' || save.shinobin)) openTown(); else advSelect(() => show('menu')); }
  function advSelect(onBack) {
    show('advselect'); A.music('menu');
    const info = $('adv-info'); let current = save.advChar || 'slash';
    SK.Town.select({
      canvas: $('adv-canvas'), unlocked: save.shinobin, current, lookFor,
      onChange: c => { current = c.id; let bars = ''; for (const [k, lab] of [['speed', 'Vitesse'], ['corner', 'Virage'], ['trick', 'Figures']]) { bars += `<div class="stat"><span>${lab}</span>`; for (let i = 1; i <= 5; i++) bars += `<i class="${i <= c[k] ? 'on' : ''}"></i>`; bars += '</div>'; } info.innerHTML = `<b>${c.name}</b><div>${bars}</div><div style="max-width:420px">${c.desc}</div>`; },
      onPick: id => { A.sfx('box'); save.advChar = id; save.char = id; store(); openTown(); },
      onBack,
    });
    $('btn-adv-back').onclick = () => { A.sfx('click'); onBack(); };
    $('btn-adv-ok').onclick = () => { A.sfx('box'); save.advChar = current; save.char = current; store(); openTown(); };
  }
  function openTown() {
    show('town'); A.music('menu');
    if (!save.boards.includes(save.advBoard)) save.advBoard = 'freestyle';
    $('town-gold').innerHTML = `<img src="${SK.COIN_SVG}" alt=""><b>${SK.fmtGold(save.gold)}</b>`; $('town-char').textContent = SK.charById(save.advChar).name + ' · planche ' + SK.boardById(save.advBoard).name;
    SK.Town.open({
      canvas: $('town-canvas'), charId: save.advChar, boardId: save.advBoard, look: lookFor(save.advChar), labelEl: $('town-label'),
      onEnter: id => {
        A.sfx('box');
        if (id === 'lift') { flow = { mode: 'champ', players: 1, picks: [{ charId: save.advChar, boardId: save.advBoard }] }; openCourse(); }
        else if (id === 'shop') openShop(openTown);
        else if (id === 'look') openShop(openTown, 'linge');
        else if (id === 'ecole') openSchool();
        else if (id === 'kids') advSelect(openTown);
        else openRecords();
      },
      onBack: () => { A.sfx('click'); show('menu'); },
    });
    $('btn-town-menu').onclick = () => { A.sfx('click'); show('menu'); };
    $('btn-town-look').onclick = () => { A.sfx('click'); openShop(openTown, 'linge'); };
  }
  function openRecords() {
    show('records');
    const won = Object.keys(save.won).length, done = Object.keys(save.missions || {}).length;
    $('records-sub').innerHTML = `${gold(save.gold)} · ${won} trophée${won > 1 ? 's' : ''} sur ${SK.COURSES.length} · ${done} mission${done > 1 ? 's' : ''} réussie${done > 1 ? 's' : ''} sur ${SK.MISSIONS.length} · ${save.boards.length} planche${save.boards.length > 1 ? 's' : ''}` + (save.shinobin ? ' · Shinobin débloqué 🥷' : '');
    let html = '<div class="trophies">' + SK.COURSES.map((c, i) => `<div class="trophy${save.won[c.id] ? '' : ' locked'}"><span class="cup">🏆</span><b>${i < save.unlocked || !c.hidden ? c.name : '???'}</b>${save.won[c.id] ? 'gagnée' : '—'}</div>`).join('') + '</div>';
    html += '<table class="results"><tr><th>Piste</th><th>État</th><th class="num">Record</th></tr>';
    SK.COURSES.forEach((c, i) => { const unlocked = i < save.unlocked; html += `<tr><td>${i + 1}. ${unlocked || !c.hidden ? c.name : '???'}</td><td>${save.won[c.id] ? '🏆 gagnée' : unlocked ? 'débloquée' : '🔒'}</td><td class="num">${SK.fmtTime(save.best[c.id])}</td></tr>`; });
    $('records').innerHTML = html + '</table>';
    $('btn-records-back').onclick = () => { A.sfx('click'); openTown(); };
  }
  // ---- École : missions de pratique
  function openSchool() {
    show('school'); A.music('menu');
    const done = Object.keys(save.missions || {}).length;
    $('school-sub').textContent = done + ' / ' + SK.MISSIONS.length + ' missions réussies. Chaque mission réussie rapporte de l\'or la première fois ; tu peux les refaire pour battre ton score.';
    const list = $('missions'); list.innerHTML = '';
    for (const m of SK.MISSIONS) {
      const best = (save.missions || {})[m.id], c = SK.courseById(m.course);
      const el = document.createElement('div'); el.className = 'mission' + (best != null ? ' done' : '');
      el.innerHTML = `<span class="star">${best != null ? '⭐' : '☆'}</span><h3>${m.name}</h3><p>${m.desc}</p><p class="meta">${c.name} · 1 tour · récompense ${m.reward} G${best != null ? ' · réussie (' + (m.type === 'time' ? SK.fmtTime(best) : best) + ')' : ''}</p>`;
      el.onclick = () => { A.sfx('click'); flow = { mode: 'practice', players: 1, picks: [{ charId: save.advChar, boardId: save.advBoard }], mission: m, course: c, laps: 1 }; startRace(); };
      list.appendChild(el);
    }
    $('btn-school-back').onclick = () => { A.sfx('click'); openTown(); };
  }

  // ---- sélection du personnage (course libre, contre-la-montre, 2 joueurs)
  function openSelect(player) {
    show('select'); A.music('menu');
    const two = flow.players === 2;
    $('sel-title').textContent = two ? 'Joueur ' + (player + 1) + ' : choisis ton personnage' : 'Choisis ton personnage';
    $('sel-sub').textContent = flow.mode === 'champ' ? 'Championnat : gagne chaque piste pour débloquer la suivante.' : flow.mode === 'time' ? 'Contre-la-montre : seul sur la piste, sans tirs ni objets.' : two ? 'Écran partagé : joueur 1 à gauche (flèches), joueur 2 à droite (WASD).' : 'Course libre contre trois ordinateurs.';
    let charId = player === 0 ? save.char : save.char2, boardId = player === 0 ? save.board : save.board2;
    if (!save.boards.includes(boardId)) boardId = 'freestyle';
    const other = two && player === 1 ? flow.picks[0].charId : null;
    const cards = $('char-cards'); cards.innerHTML = '';
    const list = SK.CHARACTERS.filter(c => !c.hidden || save.shinobin);
    if (!save.shinobin) list.push({ id: 'locked', name: '???', locked: true });
    const draw = () => {
      cards.querySelectorAll('.card').forEach(el => { el.classList.toggle('selected', el.dataset.id === charId); el.classList.toggle('p2', player === 1); });
      $('sel-board').value = boardId; $('sel-board-desc').textContent = SK.boardById(boardId).desc;
    };
    for (const c of list) {
      const el = document.createElement('div'); el.className = 'card' + (c.locked ? ' locked' : ''); el.dataset.id = c.id;
      if (c.locked) { el.innerHTML = '<div style="font-size:70px;line-height:130px">🔒</div><h3>???</h3><div class="desc">Un coureur caché… Termine l\'aventure pour le découvrir.</div>'; cards.appendChild(el); continue; }
      const cv = document.createElement('canvas'); cv.width = 150; cv.height = 140; el.appendChild(cv);
      const h = document.createElement('h3'); h.textContent = c.name + (c.hidden ? ' 🥷' : ''); el.appendChild(h);
      const stats = document.createElement('div');
      for (const [k, lab] of [['speed', 'Vitesse'], ['corner', 'Virage'], ['trick', 'Figures']]) { let s = `<div class="stat"><span>${lab}</span>`; for (let i = 1; i <= 5; i++) s += `<i class="${i <= c[k] ? 'on' : ''}"></i>`; stats.innerHTML += s + '</div>'; }
      el.appendChild(stats);
      const d = document.createElement('div'); d.className = 'desc'; d.textContent = c.desc; el.appendChild(d);
      if (other === c.id) { const tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = 'J1'; el.appendChild(tg); }
      el.onclick = () => { A.sfx('click'); charId = c.id; draw(); };
      cards.appendChild(el);
      const ctx = cv.getContext('2d'); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, 0, 150, 140); R.drawRacer(ctx, fakeRacer(c.id, 'freestyle', 'ride', lookFor(c.id)), 75, 128, 52, 0, false);
    }
    const sel = $('sel-board'); sel.innerHTML = '';
    for (const b of SK.BOARDS) if (save.boards.includes(b.id)) { const o = document.createElement('option'); o.value = b.id; o.textContent = b.name + (b.speed || b.corner || b.trick ? ` (vit ${fmtMod(b.speed)} · vir ${fmtMod(b.corner)} · fig ${fmtMod(b.trick)})` : ''); sel.appendChild(o); }
    sel.onchange = () => { boardId = sel.value; draw(); };
    draw();
    $('btn-sel-back').onclick = () => { A.sfx('click'); if (player === 1) openSelect(0); else show('menu'); };
    $('btn-sel-ok').onclick = () => {
      A.sfx('click');
      if (player === 0) { save.char = charId; save.board = boardId; } else { save.char2 = charId; save.board2 = boardId; } store();
      flow.picks[player] = { charId, boardId };
      if (two && player === 0) openSelect(1); else openCourse();
    };
  }
  const fmtMod = v => (v > 0 ? '+' : '') + v;

  // ---- sélection de la piste
  function coursePreview(cv, course) {
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, th = SK.THEMES[course.theme];
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = th.ground[0]; ctx.fillRect(0, H * 0.55, W, H);
    R.drawBackdrop(ctx, th.bg, 0, H * 0.55, W, th, 0);
    const road = th.road[course.surface] || th.road[Object.keys(th.road)[0]];
    for (let i = 0; i < 8; i++) { const y1 = H * 0.55 + (H * 0.45) * i / 8, y2 = H * 0.55 + (H * 0.45) * (i + 1) / 8, w1 = 6 + 60 * i / 8, w2 = 6 + 60 * (i + 1) / 8; R.quad(ctx, W / 2 - w1, y1, W / 2 - w2, y2, W / 2 + w2, y2, W / 2 + w1, y1, road[i % 2]); R.quad(ctx, W / 2 - w1 - 4, y1, W / 2 - w2 - 5, y2, W / 2 - w2, y2, W / 2 - w1, y1, th.rumble[i % 2]); R.quad(ctx, W / 2 + w1, y1, W / 2 + w2, y2, W / 2 + w2 + 5, y2, W / 2 + w1 + 4, y1, th.rumble[i % 2]); }
    R.drawProp(ctx, th.decor[0], W * 0.18, H * 0.95, 6, 0.3, 0, {}); R.drawProp(ctx, th.decor[1], W * 0.84, H * 0.9, 5, 0.7, 0, {}); R.drawProp(ctx, th.obst[0], W * 0.62, H * 0.78, 3, 0.5, 0, {});
    if (th.stars) { ctx.fillStyle = '#fff'; for (let i = 0; i < 25; i++) ctx.fillRect((i * 37) % W, (i * 23) % (H * 0.4), 2, 2); }
  }
  function openCourse() {
    show('course');
    const champ = flow.mode === 'champ';
    $('course-title').textContent = champ ? 'Télésiège : choisis ta piste' : 'Choisis ta piste';
    $('course-sub').textContent = champ ? 'Termine 1er pour débloquer la piste suivante. Prime : ' + SK.PRIZES.slice(0, 4).map(p => p + ' G').join(' / ') + '.' : flow.mode === 'time' ? 'Ton meilleur temps est affiché sur chaque piste.' : 'Les pistes se débloquent dans l\'aventure.';
    $('laps-row').classList.toggle('hidden', champ);
    const cards = $('course-cards'); cards.innerHTML = '';
    let picked = null;
    const draw = () => cards.querySelectorAll('.card').forEach(el => el.classList.toggle('selected', el.dataset.id === picked));
    SK.COURSES.forEach((c, i) => {
      const unlocked = i < save.unlocked;
      const el = document.createElement('div'); el.className = 'card' + (unlocked ? '' : ' locked'); el.dataset.id = c.id;
      const cv = document.createElement('canvas'); cv.width = 220; cv.height = 120; el.appendChild(cv); coursePreview(cv, c);
      const h = document.createElement('h3'); h.textContent = (i + 1) + '. ' + (unlocked || !c.hidden ? c.name : '???'); el.appendChild(h);
      const d = document.createElement('div'); d.className = 'desc';
      d.textContent = unlocked ? c.desc : c.hidden ? 'Piste cachée. Gagne au Pays des Ninjas pour la découvrir.' : 'Gagne la piste précédente pour débloquer celle-ci.';
      el.appendChild(d);
      const info = document.createElement('div'); info.style.cssText = 'font-size:12px;color:#90caf9;margin-top:4px';
      info.textContent = (save.best[c.id] ? 'Record : ' + SK.fmtTime(save.best[c.id]) : 'Aucun record') + (save.won[c.id] ? ' · ✓ gagnée' : '');
      el.appendChild(info);
      if (c.boss && unlocked) { const tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = '🥷 Shinobin'; tg.style.background = '#212121'; tg.style.color = '#fff'; el.appendChild(tg); }
      if (unlocked) { el.onclick = () => { A.sfx('click'); picked = c.id; draw(); }; if (!picked && (!champ || !save.won[c.id] || i === save.unlocked - 1)) picked = picked || c.id; }
      else el.onclick = () => A.sfx('nope');
      cards.appendChild(el);
    });
    if (champ) picked = SK.COURSES[Math.min(save.unlocked, SK.COURSES.length) - 1].id;
    draw();
    const sel = $('sel-laps'); sel.innerHTML = ''; SK.LAPS_CHOICES.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); }); sel.value = save.laps;
    $('btn-course-back').onclick = () => { A.sfx('click'); if (champ) openTown(); else openSelect(flow.players - 1); };
    $('btn-course-ok').onclick = () => {
      if (!picked) return A.sfx('nope');
      save.laps = +sel.value; store();
      flow.course = SK.courseById(picked); flow.laps = champ ? flow.course.laps : save.laps;
      A.sfx('click');
      if (champ && flow.course.boss && !save.won[flow.course.id]) story(flow.course.id === 'ninja' ? 'ninja' : 'dizzy', startRace); else startRace();
    };
  }

  // ---- histoire (Shinobin)
  function story(which, next) {
    show('story'); A.music('ninja');
    const cv = $('story-canvas'), ctx = cv.getContext('2d');
    const th = SK.THEMES[which === 'ending' ? 'rookie' : which === 'dizzy' ? 'dizzy' : 'ninja'];
    const g = ctx.createLinearGradient(0, 0, 0, 220); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, 900, 220);
    ctx.fillStyle = th.ground[0]; ctx.fillRect(0, 170, 900, 50); R.drawBackdrop(ctx, th.bg, 0, 170, 900, th, 0);
    const me = fakeRacer(flow.picks[0].charId, flow.picks[0].boardId, 'ride', lookFor(flow.picks[0].charId)), sh = fakeRacer('shinobin');
    R.drawRacer(ctx, me, 300, 205, 60, 0, false); if (which !== 'ending') { sh.state = 'air'; sh.h = 0.6; } R.drawRacer(ctx, sh, 600, 205, 60, 0, false);
    const myName = me.def.name;
    const texts = {
      ninja: ['Le Pays des Ninjas', `<p>Au moment du départ, une ombre bondit du haut du château et atterrit sur la ligne, planche aux pieds.</p><p><b>Shinobin</b> : « Vous êtes sur mes terres, petits. Personne ne descend cette montagne plus vite qu'un ninja. »</p><p><b>${myName}</b> : « On va voir ça ! »</p><p>Shinobin participe à la course : il est rapide, précis et doué partout. Finis <b>1er</b> pour débloquer la piste cachée.</p>`],
      dizzy: ['Le Pays Vertige', `<p>Le parc d'attractions est ouvert rien que pour vous… et Shinobin est déjà sur la ligne de départ.</p><p><b>Shinobin</b> : « Tu as eu de la chance au château. Ici, les virages n'en finissent plus. Bats-moi encore et je t'apprendrai mes secrets. »</p><p>Gagne cette dernière course et <b>Shinobin devient jouable</b>.</p>`],
      ending: ['Champion des Snow Kids !', `<p><b>Shinobin</b> retire son masque : « Tu m'as battu partout. Tu es digne de l'art du ninja. » Il te tend sa planche rouge.</p><p>Toutes les pistes sont gagnées. <b>Shinobin est maintenant jouable</b> dans tous les modes, et tu peux continuer à collectionner les pièces pour la planche Dorée.</p><p>Merci d'avoir joué à Snow Kids !</p>`],
    };
    $('story-title').textContent = texts[which][0]; $('story-text').innerHTML = texts[which][1];
    $('btn-story-ok').onclick = () => { A.sfx('click'); next(); };
  }

  // ---- boutique (chalet dessiné dans js/shop.js)
  function openShop(back, tab) {
    show('shop'); A.music('menu');
    if (!save.boards.includes(save.advBoard)) save.advBoard = 'freestyle';
    save.gear = save.gear || []; save.upgrades = save.upgrades || {};
    SK.Shop.open({
      canvas: $('shop-canvas'), save, store, toast, tab,
      els: { gold: $('shop-gold'), tabs: $('shop-tabs'), title: $('shop-title'), icon: $('shop-item'), strip: $('shop-strip'), name: $('shop-name'), me: $('shop-me'), price: $('shop-price'), desc: $('shop-desc'), buy: $('shop-buy'), prev: $('shop-prev'), next: $('shop-next'), back: $('btn-shop-back') },
      onBack: () => { SK.Shop.close(); (back || (() => show('menu')))(); },
    });
  }

  // ------------------------------------------------------------------ course
  let race = null, raf = 0, paused = false, acc = 0, last = 0, overAt = 0, canvas, ctx;
  function pickAI(count, taken, allowShinobin) {
    const pool = SK.CHARACTERS.filter(c => !taken.includes(c.id) && (!c.hidden || (allowShinobin && save.shinobin)));
    const rng = SK.rng(flow.seed || (Date.now() & 0xffff)), out = [];
    while (out.length < count && pool.length) out.push(pool.splice(rng.int(pool.length), 1)[0]);
    const boardsByDiff = [['freestyle'], ['freestyle', 'fusee', 'virage', 'acrobate'], ['fusee', 'virage', 'acrobate', 'pro']];
    return out.map(c => ({ charId: c.id, boardId: rng.pick(boardsByDiff[save.diff]), ctrl: 'cpu' }));
  }
  function startRace() {
    show('race'); A.init(); A.music(flow.course.theme);
    canvas = $('game'); ctx = canvas.getContext('2d');
    const racers = flow.picks.map((p, i) => ({ charId: p.charId, boardId: p.boardId, board: effectiveBoard(p.boardId), gear: gearObj(), look: lookFor(p.charId), ctrl: 'human', player: i }));
    if (flow.mode === 'practice') { if (flow.mission.type === 'hits') racers.push(...pickAI(3, racers.map(r => r.charId), false)); }
    else if (flow.mode !== 'time') {
      racers.push(...pickAI(4 - racers.length, racers.map(r => r.charId), flow.mode !== 'champ'));
      if (flow.mode === 'champ' && flow.course.boss) racers.push({ charId: flow.course.boss, boardId: 'pro', ctrl: 'cpu', boss: true });
    }
    race = new SK.Race({ course: flow.course, racers, laps: flow.laps, seed: flow.seed || (Date.now() & 0xfffff) + 1, difficulty: save.diff, mode: flow.mode === 'practice' ? 'free' : flow.mode, mission: flow.mode === 'practice' ? flow.mission : null });
    paused = false; acc = 0; last = 0; overAt = 0; $('pause').classList.add('hidden');
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : SK.STEP; last = ts;
    if (I.anyPause()) togglePause();
    if (!paused) {
      acc += dt;
      while (acc >= SK.STEP) { for (let p = 0; p < flow.players; p++) race.setInput(p, I.read(p)); race.update(SK.STEP); acc -= SK.STEP; }
      handleEvents();
      if (race.phase === 'over') { if (!overAt) overAt = performance.now(); else if (performance.now() - overAt > 1800) { cancelAnimationFrame(raf); showResults(); return; } }
    }
    I.endFrame();
    const t = performance.now() / 1000;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SK.W, SK.H);
    const humans = race.racers.filter(r => r.player >= 0);
    if (humans.length === 2) { R.drawView(ctx, race, humans[0], 0, 0, SK.W / 2 - 2, SK.H, t); R.drawView(ctx, race, humans[1], SK.W / 2 + 2, 0, SK.W / 2 - 2, SK.H, t); }
    else R.drawView(ctx, race, humans[0], 0, 0, SK.W, SK.H, t);
  }
  function togglePause() { if (!race || race.phase === 'over') return; paused = !paused; $('pause').classList.toggle('hidden', !paused); A.sfx('click'); if (paused) A.stopMusic(); else A.music(flow.course.theme); }
  $('btn-resume').onclick = () => togglePause();
  $('btn-quit').onclick = () => { cancelAnimationFrame(raf); paused = false; $('pause').classList.add('hidden'); race = null; A.sfx('click'); show('menu'); };
  function handleEvents() {
    for (const e of race.takeEvents()) {
      const r = e.r, human = r && r.ctrl === 'human', fromHuman = e.from && e.from.ctrl === 'human';
      switch (e.type) {
        case 'count': A.sfx('count'); break;
        case 'go': A.sfx('go'); break;
        case 'coin': if (human) A.sfx('coin'); break;
        case 'box': if (human) { A.sfx('box'); const d = e.kind === 'red' ? SK.SHOTS[e.got] : SK.ITEMS[e.got]; R.notify(r, d.icon + ' ' + d.name + (e.kind === 'red' ? '  (−' + SK.SHOT_COST + ' G)' : ''), e.kind === 'red' ? '#ff8a80' : '#82b1ff'); } break;
        case 'boxpoor': if (human) { A.sfx('nope'); R.notify(r, 'Boîte rouge : il faut ' + SK.SHOT_COST + ' G (tu en as ' + r.coins + ')', '#ff8a80'); } break;
        case 'boxfull': if (human) { A.sfx('nope'); R.notify(r, e.kind === 'red' ? 'Tu as déjà un tir : utilise-le (' + (r.player === 1 ? 'J' : 'V') + ')' : 'Tu as déjà un objet : utilise-le (' + (r.player === 1 ? 'K' : 'B') + ')', '#ffcc80'); } break;
        case 'jump': if (human && e.big) A.sfx('jump'); break;
        case 'land': if (human) A.sfx('land'); break;
        case 'trick': if (human) { A.sfx('trick'); R.notify(r, e.names.join(' + ') + '  +' + e.coins + ' G', '#ffd600', true); } break;
        case 'fall': if (human) { A.sfx('fall'); R.notify(r, 'Chute !', '#ff8a80'); } break;
        case 'frozen': if (human) { A.sfx('freeze'); R.notify(r, 'Gelé !', '#80deea'); } break;
        case 'obstacle': break;
        case 'wall': if (human) A.sfx('wall'); break;
        case 'barrier': if (human) { A.sfx('nope'); R.notify(r, 'Barrière ! Le portail de la remontée est ' + (race.gateX > r.x ? 'à droite →' : '← à gauche'), '#ff8a80'); } break;
        case 'shoot': if (human) { A.sfx('shoot'); } break;
        case 'item': if (human) { A.sfx(e.kind === 'ventilo' ? 'fan' : e.kind === 'invisible' ? 'invisible' : e.kind === 'nuage' ? 'rain' : e.kind === 'rocher' ? 'rock' : 'steal'); } break;
        case 'hit': if (human || fromHuman) { A.sfx(e.kind === 'gel' ? 'freeze' : e.kind === 'poele' ? 'pan' : e.kind === 'parachute' || e.kind === 'bonhomme' ? 'steal' : 'explode'); if (human) R.notify(r, SK.SHOTS[e.kind].icon + ' ' + SK.SHOTS[e.kind].name + (e.from ? ' de ' + e.from.def.name : '') + ' !', '#ff8a80'); if (fromHuman && !human) R.notify(e.from, SK.SHOTS[e.kind].icon + ' Touché : ' + r.def.name, '#69f0ae'); } break;
        case 'steal': if (human) { A.sfx('steal'); R.notify(r, '🎭 Volé à ' + e.from.def.name + ' !', '#69f0ae'); } else if (e.from.ctrl === 'human') { A.sfx('steal'); R.notify(e.from, '🎭 ' + r.def.name + ' t\'a volé un objet !', '#ff8a80'); } break;
        case 'rockhit': if (human) { A.sfx('fall'); R.notify(r, '🪨 Rocher !', '#ff8a80'); } else if (e.by && e.by.ctrl === 'human') R.notify(e.by, '🪨 ' + r.def.name + ' a touché ton rocher', '#69f0ae'); break;
        case 'lift': if (human) { A.sfx('lift'); R.notify(r, 'Tour ' + (r.lap + 1) + ' terminé · Remontée', '#fff'); } break;
        case 'lapstart': if (human) R.notify(r, r.lap + 1 === race.laps ? 'Dernier tour !' : 'Tour ' + (r.lap + 1), '#ffd600', true); break;
        case 'finish': if (human) A.sfx(r.rank === 0 ? 'win' : 'finish'); break;
        case 'gate': if (human) { A.sfx(e.ok ? 'coin' : 'nope'); R.notify(r, e.ok ? 'Porte ' + (e.n + 1) + ' ✓' : 'Porte ' + (e.n + 1) + ' ratée', e.ok ? '#69f0ae' : '#ff8a80', false, 1); } break;
      }
    }
  }

  // ---- résultats
  function showResults() {
    A.stopMusic(); show('result');
    const res = race.results(), champ = flow.mode === 'champ', practice = flow.mode === 'practice', me = res.find(x => x.r.ctrl === 'human');
    let earned = 0, unlockedNew = null, gotShinobin = false, trophy = false, missionOk = null;
    for (const x of res) if (x.r.ctrl === 'human') earned += x.coins + (practice ? 0 : x.prize);
    if (practice && me) { // évaluation de la mission
      const m = flow.mission, r = me.r;
      const v = m.type === 'slalom' ? race.gatesPassed : m.type === 'coins' ? r.coinsTotal : m.type === 'tricks' ? r.tricksCoins : m.type === 'hits' ? r.stats.hits : m.type === 'time' ? me.time : r.stats.falls;
      missionOk = m.type === 'time' ? (me.time != null && me.time <= m.goal) : m.type === 'nofall' ? r.stats.falls === 0 : v >= m.goal;
      flow.missionValue = v; flow.missionReward = 0;
      if (missionOk) { save.missions = save.missions || {}; const prev = save.missions[m.id]; if (prev == null) { earned += m.reward; flow.missionReward = m.reward; } if (prev == null || (m.type === 'time' ? v < prev : v > prev)) save.missions[m.id] = v; }
    }
    if (champ && me && me.rank === 0 && !save.won[flow.course.id]) { trophy = true; earned += SK.TROPHY_GOLD; }
    if (flow.mode !== 'time') { save.gold += earned; }
    if (me) { const prev = save.best[flow.course.id]; if (me.time && (!prev || me.time < prev) && !me.estimated) save.best[flow.course.id] = me.time; }
    if (champ && me && me.rank === 0) {
      save.won[flow.course.id] = true;
      const idx = SK.COURSES.indexOf(flow.course);
      if (idx + 1 < SK.COURSES.length && save.unlocked < idx + 2) { save.unlocked = idx + 2; unlockedNew = SK.COURSES[idx + 1]; }
      if (flow.course.id === 'dizzy' && !save.shinobin) { save.shinobin = true; gotShinobin = true; }
    }
    store();
    $('result-title').textContent = (practice ? 'École : ' + flow.mission.name : flow.course.name + ' — ' + (flow.mode === 'time' ? 'Contre-la-montre' : champ ? 'Aventure' : 'Course libre'));
    $('result-sub').innerHTML = flow.mode === 'time' ? (me && save.best[flow.course.id] === me.time ? '🏆 Nouveau record !' : 'Record : ' + SK.fmtTime(save.best[flow.course.id])) : 'Gagné : ' + gold(earned) + (trophy ? ' (dont ' + SK.TROPHY_GOLD + ' G de trophée)' : practice ? (flow.missionReward ? ' (dont ' + flow.missionReward + ' G de mission)' : '') : ' (pièces ramassées + prime)') + ' · Tirelire : ' + gold(save.gold);
    let html = '<table class="results"><tr><th>Place</th><th>Coureur</th><th class="num">Temps</th><th class="num">Or</th><th class="num">Figures</th><th class="num">Touches</th><th class="num">Prime</th></tr>';
    for (const x of res) html += `<tr class="${x.r.ctrl === 'human' ? 'me' : ''}"><td>${['🥇', '🥈', '🥉'][x.rank] || (x.rank + 1) + 'e'}</td><td>${x.name}${x.r.ctrl === 'human' ? ' (J' + (x.r.player + 1) + ')' : ''}${x.r.boss ? ' 🥷' : ''}</td><td class="num">${SK.fmtTime(x.time)}${x.estimated ? '*' : ''}</td><td class="num">${x.coins} G</td><td class="num">${x.tricks}</td><td class="num">${x.stats.hits}</td><td class="num">${x.prize ? '+' + x.prize + ' G' : ''}</td></tr>`;
    html += '</table>';
    if (res.some(x => x.estimated)) html += '<p style="color:#90a4ae;font-size:12px">* temps estimé (course arrêtée après l\'arrivée des joueurs)</p>';
    if (champ && me) html += me.rank === 0 ? `<p class="story-text">🏆 <b>Victoire !</b> ${trophy ? 'Un trophée pour ta salle des trophées, et ' + SK.TROPHY_GOLD + ' G ! ' : ''}${unlockedNew ? 'Nouvelle piste débloquée : <b>' + unlockedNew.name + '</b>.' : ''}</p>` : `<p class="story-text">Il faut finir <b>1er</b> pour débloquer la piste suivante. Réessaie, ou passe à la boutique.</p>`;
    if (practice) { const m = flow.mission, v = flow.missionValue; html += `<p class="story-text">${missionOk ? '⭐ <b>Mission réussie !</b>' : '✗ <b>Mission ratée.</b>'} ${m.type === 'time' ? 'Temps : ' + SK.fmtTime(v) + ' (objectif ' + SK.fmtTime(m.goal) + ')' : m.type === 'nofall' ? v + ' chute(s)' : v + ' / ' + m.goal}</p>`; }
    $('result').innerHTML = html;
    const btns = $('result-buttons'); btns.innerHTML = '';
    const mk = (label, cls, fn) => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = () => { A.sfx('click'); fn(); }; btns.appendChild(b); };
    mk('Rejouer', 'primary', startRace);
    if (practice) { mk('Retour à l\'École', 'gold', openSchool); mk('Village', '', openTown); mk('Menu', 'ghost', () => show('menu')); return; }
    if (champ && unlockedNew) mk('Piste suivante : ' + unlockedNew.name, 'gold', () => { flow.course = unlockedNew; flow.laps = unlockedNew.laps; if (unlockedNew.boss) story(unlockedNew.id === 'ninja' ? 'ninja' : 'dizzy', startRace); else startRace(); });
    mk('Changer de piste', '', openCourse);
    if (champ) mk('Retour au village', 'gold', openTown); else if (flow.mode !== 'time') mk('Boutique', 'gold', () => openShop(() => show('menu')));
    mk('Menu', 'ghost', () => show('menu'));
    if (me && me.rank === 0) A.sfx('win');
    if (gotShinobin) setTimeout(() => { A.sfx('unlock'); story('ending', () => { save.ending = true; store(); openTown(); }); }, 900);
    else if (unlockedNew) setTimeout(() => A.sfx('unlock'), 600);
  }

  // ------------------------------------------------------------------ démarrage
  function boot() {
    I.init(); initMenu(); refreshMenu();
    A.enabled = save.sound; A.musicOn = save.music;
    document.addEventListener('pointerdown', () => { A.init(); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); if (!A.timer && A.cur) A.music(A.cur); }, { once: false });
    document.addEventListener('keydown', () => { A.init(); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); if (!A.timer && A.cur) A.music(A.cur); });
    show('menu');
    const anim = () => { if (!$('screen-menu').classList.contains('hidden')) menuAnim(performance.now() / 1000); requestAnimationFrame(anim); }; anim();
    const q = new URLSearchParams(location.search);
    if (q.has('screen')) { // ?screen=select|course|shop (captures d'écran)
      flow = { mode: q.get('mode') || 'champ', players: 1, picks: [{ charId: 'slash', boardId: 'freestyle' }] };
      if (q.has('unlock')) { save.unlocked = +q.get('unlock'); save.gold = 4200; save.shinobin = q.has('shinobin'); }
      if (q.has('unlock')) { save.advChar = 'slash'; save.boards = ['freestyle', 'fusee']; }
      ({ select: () => openSelect(0), course: openCourse, shop: () => openShop(openTown, q.get('tab') || undefined), story: () => story('ninja', () => show('menu')), town: openTown, adv: () => advSelect(() => show('menu')), records: openRecords, school: openSchool })[q.get('screen')]();
    }
    if (q.has('mission')) { const m = SK.missionById(q.get('mission')); flow = { mode: 'practice', players: 1, picks: [{ charId: 'slash', boardId: 'freestyle' }], mission: m, course: SK.courseById(m.course), laps: 1, seed: 7 }; startRace(); if (q.has('t')) { const n = Math.round(+q.get('t') / SK.STEP); for (let i = 0; i < n && race.phase !== 'over'; i++) { race.setInput(0, { steer: Math.sin(i / 40) }); race.update(SK.STEP); } race.takeEvents(); } }
    if (q.has('demo')) { // ?demo=rookie : lance tout de suite une course (capture d'écran, tests)
      flow = { mode: 'free', players: q.get('players') === '2' ? 2 : 1, picks: [{ charId: 'slash', boardId: 'freestyle' }, { charId: 'nancy', boardId: 'freestyle' }].slice(0, q.get('players') === '2' ? 2 : 1), course: SK.courseById(q.get('demo')) || SK.COURSES[0], laps: 3, seed: +(q.get('seed') || 0) || undefined };
      startRace();
      if (q.has('cpu')) for (const r of race.racers) r.ctrl = 'cpu';
      if (q.has('t')) { const n = Math.round(+q.get('t') / SK.STEP); for (let i = 0; i < n && race.phase !== 'over'; i++) race.update(SK.STEP); race.takeEvents(); }
    }
  }
  boot();
})(window.SK);
