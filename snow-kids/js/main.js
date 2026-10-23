// Snow Kids — écrans (menu, personnages, pistes, boutique, résultats, histoire), boucle de jeu et sauvegarde.
(function (SK) {
  'use strict';
  const $ = id => document.getElementById(id), A = SK.Audio, R = SK.Render, I = SK.Input;
  const SAVE_KEY = 'snowkids.save';
  const DEFAULT_SAVE = { gold: 0, boards: ['freestyle'], unlocked: 1, shinobin: false, won: {}, best: {}, char: 'slash', board: 'freestyle', char2: 'nancy', board2: 'freestyle', diff: 1, sound: true, music: true, laps: 3, ending: false };
  let save = loadSave();
  function loadSave() { try { return Object.assign({}, DEFAULT_SAVE, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULT_SAVE); } }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* mode privé */ } }
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); };

  // ------------------------------------------------------------------ écrans
  const screens = ['menu', 'select', 'course', 'shop', 'story', 'race', 'result'];
  function show(name) { for (const s of screens) $('screen-' + s).classList.toggle('hidden', s !== name); if (name === 'menu') { refreshMenu(); A.music('menu'); } }
  let flow = { mode: 'champ', players: 1, course: null, laps: 3, picks: [] };

  // Faux coureur pour dessiner un personnage hors course
  function fakeRacer(charId, boardId, state) { return { def: SK.charById(charId), board: SK.boardById(boardId), fx: { parachute: 0, fan: 0, invisible: 0, slow: 0, snowman: 0 }, state: state || 'ride', h: 0, vy: 0, input: { steer: 0, down: false }, curTrick: null, flat: 0, ctrl: 'cpu', player: -1 }; }

  // ---- menu
  function refreshMenu() {
    $('version').textContent = 'v' + SK.VERSION;
    $('champ-progress').textContent = save.ending ? '✓ terminé' : save.unlocked + ' / ' + SK.COURSES.length + ' pistes';
    $('gold-menu').textContent = '🪙 ' + save.gold;
    $('opt-diff').value = save.diff; $('opt-sound').checked = save.sound; $('opt-music').checked = save.music;
  }
  function initMenu() {
    SK.DIFFICULTIES.forEach((d, i) => { const o = document.createElement('option'); o.value = i; o.textContent = d; $('opt-diff').appendChild(o); });
    $('opt-diff').onchange = () => { save.diff = +$('opt-diff').value; store(); };
    $('opt-sound').onchange = () => { save.sound = $('opt-sound').checked; A.setEnabled(save.sound); store(); };
    $('opt-music').onchange = () => { save.music = $('opt-music').checked; A.setMusic(save.music); store(); };
    $('btn-champ').onclick = () => { flow = { mode: 'champ', players: 1, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-free').onclick = () => { flow = { mode: 'free', players: 1, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-time').onclick = () => { flow = { mode: 'time', players: 1, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-duo').onclick = () => { flow = { mode: 'free', players: 2, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-shop').onclick = () => { A.sfx('click'); openShop(); };
    $('btn-help').onclick = () => { A.sfx('click'); $('howto').classList.toggle('hidden'); if (!$('howto').classList.contains('hidden')) $('howto').scrollIntoView({ behavior: 'smooth' }); };
    $('btn-reset').onclick = () => { if (confirm('Effacer toute la progression (pièces, planches, pistes débloquées, Shinobin) ?')) { save = Object.assign({}, DEFAULT_SAVE); store(); refreshMenu(); toast('Sauvegarde effacée'); } };
    $('howto-grid').innerHTML = `
      <div><h3>Le but</h3><p>Descends la piste plus vite que les autres. Au bas de la piste, la <b>remontée mécanique</b> te ramène au sommet pour le tour suivant : une chaise part toutes les ${SK.LIFT_INTERVAL} secondes, une place par chaise. Au dernier tour, la ligne d'arrivée remplace la remontée.</p>
      <h3>Commandes (joueur 1)</h3><ul><li><kbd>←</kbd> <kbd>→</kbd> diriger · <kbd>↓</kbd> freiner (utile dans les virages serrés)</li><li><kbd>X</kbd> sauter (sur un tremplin : tiens le bouton pour décoller plus haut)</li><li><kbd>C</kbd> figure en l'air : seul = Grab, <kbd>↑</kbd> salto arrière, <kbd>↓</kbd> salto avant, <kbd>←</kbd>/<kbd>→</kbd> vrille</li><li><kbd>V</kbd> tirer · <kbd>B</kbd> utiliser l'objet · <kbd>Échap</kbd> pause</li></ul>
      <p>Joueur 2 : <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, <kbd>G</kbd> saut, <kbd>H</kbd> figure, <kbd>J</kbd> tir, <kbd>K</kbd> objet. Les manettes marchent aussi (A saut, B figure, X tir, Y objet).</p></div>
      <div><h3>Pièces et boîtes</h3><p>Les <b>pièces</b> 🪙 (10 chacune) traînent sur la piste et s'obtiennent surtout avec les <b>figures</b> : termine-les avant d'atterrir, sinon tu tombes ! Enchaîne plusieurs figures dans un même saut pour multiplier le gain.</p>
      <p>Les <b>boîtes rouges</b> donnent un <b>tir</b> et coûtent ${SK.SHOT_COST} pièces. Les <b>boîtes bleues</b> donnent un <b>objet</b>, gratuit. Un seul tir et un seul objet à la fois.</p>
      <h3>Tirs (boîtes rouges)</h3><ul>${Object.values(SK.SHOTS).map(s => `<li>${s.icon} <b>${s.name}</b> : ${s.desc}</li>`).join('')}</ul></div>
      <div><h3>Objets (boîtes bleues)</h3><ul>${Object.values(SK.ITEMS).map(s => `<li>${s.icon} <b>${s.name}</b> : ${s.desc}</li>`).join('')}</ul>
      <h3>Championnat et boutique</h3><p>Gagne chaque piste (1<sup>re</sup> place) pour débloquer la suivante. Les pièces ramassées et la prime de fin de course (${SK.PRIZES.slice(0, 4).join(' / ')}) s'accumulent pour acheter de meilleures planches à la <b>boutique</b>.</p>
      <p>Au <b>Pays des Ninjas</b>, un cinquième coureur mystérieux se joint à la course… Bats-le partout et il deviendra jouable.</p>
      <h3>Surfaces</h3><p>La glace glisse (dirige tôt, freine), le sable et l'herbe ralentissent, les sables mouvants engluent. On peut sauter par-dessus les obstacles et les rochers.</p></div>`;
  }
  // animation du menu : un coureur descend une pente, la neige tombe
  function menuAnim(t) {
    const cv = $('menu-anim'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5fb0ff'); g.addColorStop(1, '#dff3ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(W, 130); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#e6f0fa'; ctx.beginPath(); ctx.moveTo(0, 75); ctx.lineTo(W, 142); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    for (let i = 0; i < 6; i++) R.drawProp(ctx, i % 2 ? 'pine' : 'fir', ((i * 190 + t * 60) % (W + 100)) - 50, 65 + (((i * 190 + t * 60) % (W + 100)) - 50) / W * 70 - 2, 7, i / 6, t, {});
    const chars = SK.CHARACTERS.filter(c => !c.hidden || save.shinobin);
    chars.forEach((c, i) => { const x = ((i * 150 + t * 90 + Math.sin(t + i) * 10) % (W + 160)) - 80, y = 70 + x / W * 70 - 5; const fr = fakeRacer(c.id); fr.input.steer = Math.sin(t * 2 + i) * 0.5; if (Math.sin(t * 1.3 + i * 2) > 0.8) { fr.state = 'air'; fr.h = (Math.sin(t * 1.3 + i * 2) - 0.8) * 8; } R.drawRacer(ctx, fr, x, y, 34, t, false); });
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97.3 + t * 20) % W, (i * 61.7 + t * 50) % H, 3, 3);
  }

  // ---- sélection du personnage
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
      if (c.locked) { el.innerHTML = '<div style="font-size:70px;line-height:130px">🔒</div><h3>???</h3><div class="desc">Un coureur caché… Termine le championnat pour le découvrir.</div>'; cards.appendChild(el); continue; }
      const cv = document.createElement('canvas'); cv.width = 150; cv.height = 140; el.appendChild(cv);
      const h = document.createElement('h3'); h.textContent = c.name + (c.hidden ? ' 🥷' : ''); el.appendChild(h);
      const stats = document.createElement('div');
      for (const [k, lab] of [['speed', 'Vitesse'], ['corner', 'Virage'], ['trick', 'Figures']]) { let s = `<div class="stat"><span>${lab}</span>`; for (let i = 1; i <= 5; i++) s += `<i class="${i <= c[k] ? 'on' : ''}"></i>`; stats.innerHTML += s + '</div>'; }
      el.appendChild(stats);
      const d = document.createElement('div'); d.className = 'desc'; d.textContent = c.desc; el.appendChild(d);
      if (other === c.id) { const tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = 'J1'; el.appendChild(tg); }
      el.onclick = () => { A.sfx('click'); charId = c.id; draw(); };
      cards.appendChild(el);
      const ctx = cv.getContext('2d'); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, 0, 150, 140); R.drawRacer(ctx, fakeRacer(c.id), 75, 128, 52, 0, false);
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
    $('course-title').textContent = champ ? 'Championnat : choisis ta piste' : 'Choisis ta piste';
    $('course-sub').textContent = champ ? 'Termine 1er pour débloquer la piste suivante. Prime : ' + SK.PRIZES.slice(0, 4).join(' / ') + ' pièces.' : flow.mode === 'time' ? 'Ton meilleur temps est affiché sur chaque piste.' : 'Les pistes se débloquent dans le championnat.';
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
    $('btn-course-back').onclick = () => { A.sfx('click'); openSelect(flow.players - 1); };
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
    const me = fakeRacer(flow.picks[0].charId), sh = fakeRacer('shinobin');
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

  // ---- boutique
  function openShop() {
    show('shop'); A.music('menu');
    $('shop-gold').textContent = save.gold;
    const list = $('board-list'); list.innerHTML = '';
    for (const b of SK.BOARDS) {
      const owned = save.boards.includes(b.id);
      const el = document.createElement('div'); el.className = 'board' + (owned ? ' owned' : '');
      el.innerHTML = `<div class="swatch" style="background:${b.color}"></div><div class="info"><b>${b.name}</b>${b.desc}<br>Vitesse ${fmtMod(b.speed)} · Virage ${fmtMod(b.corner)} · Figures ${fmtMod(b.trick)}</div>`;
      const btn = document.createElement('button');
      if (owned) { btn.textContent = 'Possédée'; btn.disabled = true; btn.className = 'ghost'; }
      else { btn.textContent = '🪙 ' + b.price; btn.className = save.gold >= b.price ? 'gold' : 'ghost'; btn.onclick = () => { if (save.gold < b.price) { A.sfx('nope'); toast('Pas assez de pièces : il te manque ' + (b.price - save.gold)); return; } save.gold -= b.price; save.boards.push(b.id); store(); A.sfx('buy'); toast(b.name + ' achetée !'); openShop(); }; }
      el.appendChild(btn); list.appendChild(el);
    }
    $('btn-shop-back').onclick = () => { A.sfx('click'); show('menu'); };
  }

  // ------------------------------------------------------------------ course
  let race = null, raf = 0, paused = false, acc = 0, last = 0, overAt = 0, canvas, ctx;
  function pickAI(count, taken, allowShinobin) {
    const pool = SK.CHARACTERS.filter(c => !taken.includes(c.id) && (!c.hidden || (allowShinobin && save.shinobin)));
    const rng = SK.rng(Date.now() & 0xffff), out = [];
    while (out.length < count && pool.length) out.push(pool.splice(rng.int(pool.length), 1)[0]);
    const boardsByDiff = [['freestyle'], ['freestyle', 'fusee', 'virage', 'acrobate'], ['fusee', 'virage', 'acrobate', 'pro']];
    return out.map(c => ({ charId: c.id, boardId: rng.pick(boardsByDiff[save.diff]), ctrl: 'cpu' }));
  }
  function startRace() {
    show('race'); A.init(); A.music(flow.course.theme);
    canvas = $('game'); ctx = canvas.getContext('2d');
    const racers = flow.picks.map((p, i) => ({ charId: p.charId, boardId: p.boardId, ctrl: 'human', player: i }));
    if (flow.mode !== 'time') {
      racers.push(...pickAI(4 - racers.length, racers.map(r => r.charId), flow.mode !== 'champ'));
      if (flow.mode === 'champ' && flow.course.boss) racers.push({ charId: flow.course.boss, boardId: 'pro', ctrl: 'cpu', boss: true });
    }
    race = new SK.Race({ course: flow.course, racers, laps: flow.laps, seed: (Date.now() & 0xfffff) + 1, difficulty: save.diff, mode: flow.mode });
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
        case 'box': if (human) { A.sfx('box'); const d = e.kind === 'red' ? SK.SHOTS[e.got] : SK.ITEMS[e.got]; R.notify(r, d.icon + ' ' + d.name + (e.kind === 'red' ? '  (−' + SK.SHOT_COST + ' 🪙)' : ''), e.kind === 'red' ? '#ff8a80' : '#82b1ff'); } break;
        case 'jump': if (human && e.big) A.sfx('jump'); break;
        case 'land': if (human) A.sfx('land'); break;
        case 'trick': if (human) { A.sfx('trick'); R.notify(r, e.names.join(' + ') + '  +' + e.coins + ' 🪙', '#ffd600', true); } break;
        case 'fall': if (human) { A.sfx('fall'); R.notify(r, 'Chute !', '#ff8a80'); } break;
        case 'frozen': if (human) { A.sfx('freeze'); R.notify(r, 'Gelé !', '#80deea'); } break;
        case 'obstacle': break;
        case 'wall': if (human) A.sfx('wall'); break;
        case 'shoot': if (human) { A.sfx('shoot'); } break;
        case 'item': if (human) { A.sfx(e.kind === 'ventilo' ? 'fan' : e.kind === 'invisible' ? 'invisible' : e.kind === 'nuage' ? 'rain' : e.kind === 'rocher' ? 'rock' : 'steal'); } break;
        case 'hit': if (human || fromHuman) { A.sfx(e.kind === 'gel' ? 'freeze' : e.kind === 'poele' ? 'pan' : e.kind === 'parachute' || e.kind === 'bonhomme' ? 'steal' : 'explode'); if (human) R.notify(r, SK.SHOTS[e.kind].icon + ' ' + SK.SHOTS[e.kind].name + (e.from ? ' de ' + e.from.def.name : '') + ' !', '#ff8a80'); if (fromHuman && !human) R.notify(e.from, SK.SHOTS[e.kind].icon + ' Touché : ' + r.def.name, '#69f0ae'); } break;
        case 'steal': if (human) { A.sfx('steal'); R.notify(r, '🎭 Volé à ' + e.from.def.name + ' !', '#69f0ae'); } else if (e.from.ctrl === 'human') { A.sfx('steal'); R.notify(e.from, '🎭 ' + r.def.name + ' t\'a volé un objet !', '#ff8a80'); } break;
        case 'rockhit': if (human) { A.sfx('fall'); R.notify(r, '🪨 Rocher !', '#ff8a80'); } else if (e.by && e.by.ctrl === 'human') R.notify(e.by, '🪨 ' + r.def.name + ' a touché ton rocher', '#69f0ae'); break;
        case 'lift': if (human) { A.sfx('lift'); R.notify(r, 'Tour ' + (r.lap + 1) + ' terminé · Remontée', '#fff'); } break;
        case 'lapstart': if (human) R.notify(r, r.lap + 1 === race.laps ? 'Dernier tour !' : 'Tour ' + (r.lap + 1), '#ffd600', true); break;
        case 'finish': if (human) A.sfx(r.rank === 0 ? 'win' : 'finish'); break;
      }
    }
  }

  // ---- résultats
  function showResults() {
    A.stopMusic(); show('result');
    const res = race.results(), champ = flow.mode === 'champ', me = res.find(x => x.r.ctrl === 'human');
    let earned = 0, unlockedNew = null, gotShinobin = false;
    for (const x of res) if (x.r.ctrl === 'human') earned += x.coins + x.prize;
    if (flow.mode !== 'time') { save.gold += earned; }
    if (me) { const prev = save.best[flow.course.id]; if (me.time && (!prev || me.time < prev) && !me.estimated) save.best[flow.course.id] = me.time; }
    if (champ && me && me.rank === 0) {
      save.won[flow.course.id] = true;
      const idx = SK.COURSES.indexOf(flow.course);
      if (idx + 1 < SK.COURSES.length && save.unlocked < idx + 2) { save.unlocked = idx + 2; unlockedNew = SK.COURSES[idx + 1]; }
      if (flow.course.id === 'dizzy' && !save.shinobin) { save.shinobin = true; gotShinobin = true; }
    }
    store();
    $('result-title').textContent = flow.course.name + ' — ' + (flow.mode === 'time' ? 'Contre-la-montre' : champ ? 'Championnat' : 'Course libre');
    $('result-sub').textContent = flow.mode === 'time' ? (me && save.best[flow.course.id] === me.time ? '🏆 Nouveau record !' : 'Record : ' + SK.fmtTime(save.best[flow.course.id])) : 'Pièces gagnées : ' + earned + ' (ramassées + prime) · Total : 🪙 ' + save.gold;
    let html = '<table class="results"><tr><th>Place</th><th>Coureur</th><th class="num">Temps</th><th class="num">Pièces</th><th class="num">Figures</th><th class="num">Touches</th><th class="num">Prime</th></tr>';
    for (const x of res) html += `<tr class="${x.r.ctrl === 'human' ? 'me' : ''}"><td>${['🥇', '🥈', '🥉'][x.rank] || (x.rank + 1) + 'e'}</td><td>${x.name}${x.r.ctrl === 'human' ? ' (J' + (x.r.player + 1) + ')' : ''}${x.r.boss ? ' 🥷' : ''}</td><td class="num">${SK.fmtTime(x.time)}${x.estimated ? '*' : ''}</td><td class="num">${x.coins}</td><td class="num">${x.tricks}</td><td class="num">${x.stats.hits}</td><td class="num">${x.prize ? '+' + x.prize : ''}</td></tr>`;
    html += '</table>';
    if (res.some(x => x.estimated)) html += '<p style="color:#90a4ae;font-size:12px">* temps estimé (course arrêtée après l\'arrivée des joueurs)</p>';
    if (champ && me) html += me.rank === 0 ? `<p class="story-text">🏆 <b>Victoire !</b> ${unlockedNew ? 'Nouvelle piste débloquée : <b>' + unlockedNew.name + '</b>.' : ''}</p>` : `<p class="story-text">Il faut finir <b>1er</b> pour débloquer la piste suivante. Réessaie, ou passe à la boutique.</p>`;
    $('result').innerHTML = html;
    const btns = $('result-buttons'); btns.innerHTML = '';
    const mk = (label, cls, fn) => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = () => { A.sfx('click'); fn(); }; btns.appendChild(b); };
    mk('Rejouer', 'primary', startRace);
    if (champ && unlockedNew) mk('Piste suivante : ' + unlockedNew.name, 'gold', () => { flow.course = unlockedNew; flow.laps = unlockedNew.laps; if (unlockedNew.boss) story(unlockedNew.id === 'ninja' ? 'ninja' : 'dizzy', startRace); else startRace(); });
    mk('Changer de piste', '', openCourse);
    if (flow.mode !== 'time') mk('Boutique', 'gold', openShop);
    mk('Menu', 'ghost', () => show('menu'));
    if (me && me.rank === 0) A.sfx('win');
    if (gotShinobin) setTimeout(() => { A.sfx('unlock'); story('ending', () => { save.ending = true; store(); show('menu'); }); }, 900);
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
      ({ select: () => openSelect(0), course: openCourse, shop: openShop, story: () => story('ninja', () => show('menu')) })[q.get('screen')]();
    }
    if (q.has('demo')) { // ?demo=rookie : lance tout de suite une course (capture d'écran, tests)
      flow = { mode: 'free', players: q.get('players') === '2' ? 2 : 1, picks: [{ charId: 'slash', boardId: 'freestyle' }, { charId: 'nancy', boardId: 'freestyle' }].slice(0, q.get('players') === '2' ? 2 : 1), course: SK.courseById(q.get('demo')) || SK.COURSES[0], laps: 3 };
      startRace();
      if (q.has('cpu')) for (const r of race.racers) r.ctrl = 'cpu';
      if (q.has('t')) { const n = Math.round(+q.get('t') / SK.STEP); for (let i = 0; i < n && race.phase !== 'over'; i++) race.update(SK.STEP); race.takeEvents(); }
    }
  }
  boot();
})(window.SK);
