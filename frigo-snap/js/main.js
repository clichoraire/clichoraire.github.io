// Frigo Snap — écrans (menu, virées, résultats, jugement, guide), entrées, boucle de jeu et sauvegarde.
(function (FS) {
  'use strict';
  const $ = id => document.getElementById(id), A = FS.Audio, R = FS.Render;
  const SAVE_KEY = 'frigosnap.save';
  const DEFAULT_SAVE = { total: 0, runs: 0, best: {}, guide: {}, sound: true, invert: false, level: 'etage' };
  let save = loadSave();
  function loadSave() { try { return Object.assign({}, DEFAULT_SAVE, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULT_SAVE); } }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* mode privé ou quota */ } }
  const toast = msg => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400); };
  const unlockedTools = total => FS.TOOLS.filter(t => t.unlock <= total).map(t => t.id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stars = n => '★'.repeat(n) + '☆'.repeat(4 - n);
  const params = new URLSearchParams(location.search);

  // ------------------------------------------------------------------ écrans
  const screens = ['menu', 'levels', 'run', 'results', 'judge', 'guide'];
  let current = 'menu';
  function show(name) { current = name; for (const s of screens) $('screen-' + s).classList.toggle('hidden', s !== name); if (name === 'menu') refreshMenu(); }

  // ---- menu
  function refreshMenu() {
    $('version').textContent = 'v' + FS.VERSION;
    const found = Object.keys(save.guide).length;
    $('play-progress').textContent = `${FS.fmt(save.total)} pts · ${found} / ${FS.SPECIES.length} espèces`;
    $('opt-sound').checked = save.sound; $('opt-invert').checked = save.invert;
  }
  function initMenu() {
    $('opt-sound').onchange = () => { save.sound = $('opt-sound').checked; A.setEnabled(save.sound); store(); };
    $('opt-invert').onchange = () => { save.invert = $('opt-invert').checked; store(); };
    $('btn-play').onclick = () => { A.unlock(); A.sfx('click'); openLevels(); };
    $('btn-guide').onclick = () => { A.sfx('click'); openGuide(); };
    $('btn-help').onclick = () => { A.sfx('click'); $('howto').classList.toggle('hidden'); if (!$('howto').classList.contains('hidden')) $('howto').scrollIntoView({ behavior: 'smooth' }); };
    $('btn-reset').onclick = () => { if (confirm('Effacer toute la progression (points, Guide, outils débloqués) ?')) { save = Object.assign({}, DEFAULT_SAVE); store(); refreshMenu(); toast('Sauvegarde effacée'); } };
    $('howto-grid').innerHTML = `
      <div><h3>Le but</h3><p>Ton demi-avocat à roulettes suit les rails tout seul. Toi, tu <b>photographies</b> les créatures du frigo : ${FS.FILM} clichés par virée. À la fin, le Chef Fernand juge <b>un seul cliché par espèce</b> et te donne des points.</p>
      <h3>Commandes</h3><ul><li><b>Souris</b> : tourner la tête librement, à 360° (clique dans l'image pour capturer la souris, <kbd>Échap</kbd> la libère et met en pause). <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> marchent aussi.</li><li><b>Clic gauche</b> ou <kbd>Espace</kbd> : prendre la photo.</li><li><b>Clic droit</b> ou <kbd>E</kbd> : utiliser l'outil choisi, là où tu vises.</li><li><kbd>1</kbd> à <kbd>4</kbd> ou la <b>molette</b> : changer d'outil · <kbd>Maj</kbd> : pédale (quand elle est débloquée) · <kbd>Échap</kbd> : pause.</li></ul></div>
      <div><h3>Le barème de Fernand</h3><ul><li><b>Cadrage et taille</b> (0 à 1 000) : la créature au centre, ni minuscule ni coupée par le bord.</li><li><b>Pose et dynamisme</b> (200 à 1 500) : endormie ou immobile, c'est fade ; en mouvement, au repas ou en pleine réaction, ça croustille.</li><li><b>Angle</b> (100 à 1 000) : de face ou de trois-quarts. « Tu me montres le mauvais côté du gigot ! »</li><li><b>Garniture</b> (+200 par autre créature dans le champ, max +800).</li><li><b>Comportement secret</b> : 2 500 points fixes à la place de la pose, pour une réaction en chaîne réussie.</li></ul>
      <p>Chaque cliché reçoit un sceau au beurre : ${FS.STAMPS.map(s => '<b>' + s.name + '</b>').join(', ')}.</p></div>
      <div><h3>Les outils</h3><ul>${FS.TOOLS.map(t => `<li><b>${t.name}</b>${t.unlock ? ` <small>(${FS.fmt(t.unlock)} pts)</small>` : ''} : ${t.desc}</li>`).join('')}</ul>
      <h3>Le Guide</h3><p>Pour chaque espèce, quatre clichés à décrocher : <b>Le Cru</b> (passive), <b>Le Saisi</b> (en mouvement), <b>Le Mijoté</b> (réaction à un outil) et <b>Le Chef-d'Œuvre</b> (le comportement secret). Fernand laisse traîner des rumeurs dans le Guide…</p></div>`;
  }
  // animation du menu : défilé de créatures sur une étagère
  const menuCreatures = FS.SPECIES.filter(s => !['leviathan', 'oeuf', 'bocal'].includes(s.id)).map((s, i) => { const c = { spId: s.id, sp: s, x: 0, z: 0, y: 0, yaw: Math.PI / 2, pose: 'walk', poseT: 0, anim: i, vars: {}, opts: { idx: 0 }, scale: 1, id: i }; return c; });
  function menuAnim(t) {
    const cv = $('menu-anim'), ctx = cv.getContext('2d'), Wc = cv.width, Hc = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, Hc); g.addColorStop(0, '#fff9d6'); g.addColorStop(0.6, '#dff3fb'); g.addColorStop(1, '#bfe3f2'); ctx.fillStyle = g; ctx.fillRect(0, 0, Wc, Hc);
    ctx.fillStyle = '#cfe6ee'; ctx.fillRect(0, Hc - 40, Wc, 40); ctx.fillStyle = '#a9cfdc'; ctx.fillRect(0, Hc - 40, Wc, 6);
    const cam = { x: 0, z: -10 };
    menuCreatures.forEach((c, i) => {
      const x = ((i * 130 + t * 70) % (Wc + 200)) - 100; c.x = x; c.z = 0; c.yaw = Math.PI / 2 + Math.sin(t + i) * 0.3; c.pose = Math.sin(t * 0.7 + i * 1.3) > 0.6 ? 'idle' : 'walk';
      if (c.spId === 'miette') c.visible = true; if (c.spId === 'olive') c.y = 0; if (c.spId === 'meduse') c.y = 0.8 + Math.sin(t * 2 + i) * 0.3;
      ctx.save(); ctx.translate(x, Hc - 36 - (c.spId === 'meduse' ? 40 : 0)); ctx.scale(44, 44); ctx.lineJoin = 'round'; FS.Sprites.draw(ctx, c, { x: x / 44 + Math.sin(t) * 0.2, z: -20 }, t + i); ctx.restore();
    });
  }

  // ---- choix de la virée
  let pickedLevel = null;
  function openLevels() {
    show('levels'); const wrap = $('level-cards'); wrap.innerHTML = '';
    $('levels-sub').innerHTML = `Points Fernand cumulés : <b style="color:#ffd54f">${FS.fmt(save.total)}</b> · outils : ${unlockedTools(save.total).map(id => FS.toolById(id).short).join(', ')}`;
    pickedLevel = FS.levelById(save.level) && FS.levelById(save.level).unlock <= save.total ? save.level : 'etage';
    for (const lvl of FS.LEVELS) {
      const locked = lvl.unlock > save.total; const card = document.createElement('div'); card.className = 'card' + (locked ? ' locked' : '') + (lvl.id === pickedLevel ? ' selected' : '');
      const species = [...new Set(lvl.creatures.map(c => c[0]))], found = species.filter(s => save.guide[s]).length, mast = species.filter(s => save.guide[s] && save.guide[s][4]).length;
      card.innerHTML = `<canvas width="360" height="150"></canvas>${locked ? `<span class="lock">🔒 ${FS.fmt(lvl.unlock)} pts</span>` : ''}<h3>${esc(lvl.name)}</h3><div class="sub2">${esc(lvl.sub)}</div><div class="desc">${esc(lvl.desc)}</div><div class="meta">${locked ? 'Verrouillé' : `Meilleure virée : ${FS.fmt(save.best[lvl.id] || 0)} pts · ${found} / ${species.length} espèces · ${mast} chef${mast > 1 ? 's' : ''}-d'œuvre`}</div>`;
      previewLevel(card.querySelector('canvas'), lvl);
      if (!locked) card.onclick = () => { A.sfx('click'); pickedLevel = lvl.id; save.level = lvl.id; store(); for (const c of wrap.children) c.classList.remove('selected'); card.classList.add('selected'); };
      wrap.appendChild(card);
    }
    $('btn-levels-back').onclick = () => { A.sfx('click'); show('menu'); };
    $('btn-levels-go').onclick = () => { A.sfx('click'); startRun(FS.levelById(pickedLevel)); };
  }
  // aperçu d'un niveau : une image fixe prise depuis le rail
  function previewLevel(cv, lvl) {
    const run = new FS.Run({ level: lvl, tools: [], seed: 5 }); run.dist = 30; for (let i = 0; i < 120; i++) run.update(FS.STEP); run.dist = 30; run.updateCamera();
    const big = document.createElement('canvas'); big.width = FS.W; big.height = FS.H; R.frame(big.getContext('2d'), run, 2); cv.getContext('2d').drawImage(big, 0, 0, cv.width, cv.height);
  }

  // ------------------------------------------------------------------ la virée
  let run = null, ui = null, raf = 0, last = 0, acc = 0, paused = false;
  const canvas = $('game'), gctx = canvas.getContext('2d');
  const mouse = { x: 0.5, y: 0.5, inside: false, locked: false }, keys = {};
  let wantPhoto = false, wantTool = false;
  function startRun(level) {
    show('run'); A.unlock();
    run = new FS.Run({ level, tools: unlockedTools(save.total), seed: (Date.now() % 100000) + 1 });
    run.tool = 'crouton'; ui = { lastPhoto: null, lastPhotoT: 0, endT: 0 }; paused = false; $('pause').classList.add('hidden');
    last = performance.now(); acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    lockMouse();
  }
  function lockMouse() { try { if (canvas.requestPointerLock && document.pointerLockElement !== canvas) canvas.requestPointerLock(); } catch (e) { /* pas de capture possible : la souris tourne la vue tant qu'elle survole l'image */ } }
  document.addEventListener('pointerlockchange', () => { mouse.locked = document.pointerLockElement === canvas; if (!mouse.locked && run && current === 'run' && !paused && run.phase === 'ride') pause(true); });
  function loop(now) {
    if (current !== 'run') return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!paused) {
      // visée : les mouvements de la souris (capturée au clic) tournent la tête librement, les flèches aussi
      const turn = 1.6 * dt; if (keys.ArrowLeft) run.lookTarget.yaw -= turn; if (keys.ArrowRight) run.lookTarget.yaw += turn; if (keys.ArrowUp) run.lookTarget.pitch += turn; if (keys.ArrowDown) run.lookTarget.pitch -= turn;
      run.lookTarget.pitch = FS.clamp(run.lookTarget.pitch, -FS.MAX_PITCH, FS.MAX_PITCH); run.dash = !!keys.Shift;
      acc += dt; let n = 0; while (acc >= FS.STEP && n < 8) { run.update(FS.STEP); acc -= FS.STEP; n++; }
      if (wantTool) { wantTool = false; if (!run.useTool(run.tool)) A.sfx('empty'); }
      ui.lastPhotoT -= dt;
      handleEvents();
    }
    R.frame(gctx, run, run.time);
    if (wantPhoto) { wantPhoto = false; takePhoto(); }
    ui.unlocked = !mouse.locked && !!canvas.requestPointerLock;
    R.hud(gctx, run, ui);
    if (run.phase === 'over') { ui.endT += dt; gctx.fillStyle = `rgba(0,0,0,${Math.min(0.7, ui.endT * 0.5)})`; gctx.fillRect(0, 0, FS.W, FS.H); gctx.fillStyle = '#fff'; gctx.font = 'bold 48px Trebuchet MS, sans-serif'; gctx.textAlign = 'center'; gctx.fillText('Fin de la virée !', FS.W / 2, FS.H / 2); gctx.textAlign = 'left'; if (ui.endT > 2) { cancelAnimationFrame(raf); openResults(); } }
  }
  function takePhoto() {
    if (run.film <= 0) { A.sfx('empty'); toast('Plus de pellicule !'); return; }
    const thumb = document.createElement('canvas'); thumb.width = 480; thumb.height = 270; thumb.getContext('2d').drawImage(canvas, 0, 0, 480, 270);
    const photo = run.takePhoto({ thumb }); if (!photo) return;
    A.sfx('shutter'); ui.lastPhoto = photo; ui.lastPhotoT = 2.2; run.flashOverlay = 0.1;
    gctx.fillStyle = 'rgba(255,255,255,0.6)'; gctx.fillRect(0, 0, FS.W, FS.H);
  }
  function handleEvents() {
    for (const e of run.takeEvents()) {
      if (e.type === 'throw') A.sfx('throw');
      else if (e.type === 'land') A.sfx('land');
      else if (e.type === 'splat') { A.sfx('splat'); run.fx.push({ kind: 'splat', x: e.x, y: e.y, z: e.z, t: 0, dur: 4 }); }
      else if (e.type === 'clic') { A.sfx('clic'); const f = FS.forward(run.cam); run.fx.push({ kind: 'ring', x: run.cam.x + f.x * 3, y: 0.05, z: run.cam.z + f.z * 3, t: 0, dur: 0.8 }); }
      else if (e.type === 'flash') A.sfx('flash');
      else if (e.type === 'react') A.sfx('react');
      else if (e.type === 'eat') A.sfx('eat');
      else if (e.type === 'special') { A.sfx('special'); toast('Comportement secret : ' + e.creature.sp.name + ' !'); }
      else if (e.type === 'end') A.sfx('end');
    }
  }
  function pause(v) { paused = v; $('pause').classList.toggle('hidden', !v); if (!v) { last = performance.now(); lockMouse(); } else if (document.pointerLockElement === canvas) document.exitPointerLock(); }
  $('btn-resume').onclick = () => { A.sfx('click'); pause(false); };
  $('btn-quit').onclick = () => { A.sfx('click'); cancelAnimationFrame(raf); run = null; show('levels'); openLevels(); };

  // ---- entrées
  canvas.addEventListener('mousemove', e => { if (!run || paused || current !== 'run') return; const k = FS.MOUSE_SENS; run.lookTarget.yaw += (e.movementX || 0) * k; run.lookTarget.pitch -= (e.movementY || 0) * k * (save.invert ? -1 : 1); });
  canvas.addEventListener('mousedown', e => { if (!run || paused) return; e.preventDefault(); if (!mouse.locked && canvas.requestPointerLock) { lockMouse(); return; } if (e.button === 0) wantPhoto = true; else if (e.button === 2) wantTool = true; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { if (!run) return; e.preventDefault(); const list = FS.TOOLS.filter(t => t.id !== 'dash' && run.hasTool(t.id)); let i = list.findIndex(t => t.id === run.tool); i = (i + (e.deltaY > 0 ? 1 : -1) + list.length) % list.length; run.tool = list[i].id; A.sfx('tick'); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (current !== 'run' || !run) return;
    keys[e.key] = true; if (e.key === 'Shift') keys.Shift = true;
    if (e.key === 'Escape') { pause(!paused); e.preventDefault(); return; }
    if (paused) return;
    if (e.key === ' ') { wantPhoto = true; e.preventDefault(); }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Control') wantTool = true;
    else if (/^[1-4]$/.test(e.key)) { const t = FS.TOOLS[+e.key - 1]; if (run.hasTool(t.id)) { run.tool = t.id; A.sfx('tick'); } else toast(`${t.name} : débloqué à ${FS.fmt(t.unlock)} points`); }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; if (e.key === 'Shift') keys.Shift = false; });

  // ------------------------------------------------------------------ résultats : un cliché par espèce
  let picks = {}, lastIds = []; // spId → photo
  function openResults() {
    show('results'); A.sfx('end');
    const rows = $('species-rows'); rows.innerHTML = ''; picks = {};
    const bySp = {}; for (const p of run.photos) if (p.subject) (bySp[p.subject.spId] = bySp[p.subject.spId] || []).push(p);
    const ids = Object.keys(bySp).sort((a, b) => Math.max(...bySp[b].map(p => p.score.total)) - Math.max(...bySp[a].map(p => p.score.total)));
    if (!ids.length) { rows.innerHTML = `<p style="text-align:center;color:#ffab91;font-size:18px">${esc(FS.FERNAND.none)}</p>`; }
    for (const id of ids) {
      const sp = FS.speciesById(id), list = bySp[id].sort((a, b) => b.score.total - a.score.total); picks[id] = list[0];
      const row = document.createElement('div'); row.className = 'species-row';
      row.innerHTML = `<div class="name"><b>${esc(sp.name)}</b><span>${list.length} cliché${list.length > 1 ? 's' : ''} · meilleur ${FS.fmt(list[0].score.total)}</span></div><div class="thumbs"></div>`;
      const th = row.querySelector('.thumbs');
      list.forEach((p, i) => {
        const d = document.createElement('div'); d.className = 'thumb' + (i === 0 ? ' selected' : '');
        d.appendChild(p.thumb); const pose = FS.POSES[p.subject.pose] || FS.POSES.idle;
        d.insertAdjacentHTML('beforeend', `<span class="pose">${esc(pose.label)} · ${FS.fmt(p.score.total)}</span><span class="stars">${stars(p.score.cat)}</span>`);
        d.onclick = () => { A.sfx('tick'); picks[id] = p; for (const c of th.children) c.classList.remove('selected'); d.classList.add('selected'); };
        th.appendChild(d);
      });
      rows.appendChild(row);
    }
    lastIds = ids; $('btn-results-go').onclick = () => { A.sfx('click'); startJudging(ids); };
  }

  // ------------------------------------------------------------------ jugement de Fernand
  let judgeTimer = 0, fernandMood = 'talk', fernandT = 0;
  function fernandLoop() { if (current !== 'judge') return; fernandT += 1 / 60; R.fernand($('fernand-canvas').getContext('2d'), 340, 220, fernandT, fernandMood); requestAnimationFrame(fernandLoop); }
  function typeText(el, text, done) { el.textContent = ''; let i = 0; clearInterval(judgeTimer); judgeTimer = setInterval(() => { el.textContent = text.slice(0, ++i); if (i % 3 === 0) A.sfx('voice'); if (i >= text.length) { clearInterval(judgeTimer); fernandMood = 'idle'; if (done) done(); } }, 22); }
  function startJudging(ids) {
    show('judge'); fernandMood = 'talk'; fernandLoop();
    const queue = ids.slice(); let runTotal = 0, i = 0; const newUnlocks = [];
    const before = save.total;
    const next = () => {
      if (i >= queue.length) return finish();
      const id = queue[i++], p = picks[id], sp = FS.speciesById(id), sc = p.score;
      $('judge-title').textContent = `Sous la loupe : ${sp.name} (${i} / ${queue.length})`;
      $('judge-photo').getContext('2d').drawImage(p.thumb, 0, 0, 640, 360);
      $('judge-caption').textContent = `${sp.name} · ${(FS.POSES[p.subject.pose] || FS.POSES.idle).label} · ${stars(sc.cat)}`;
      const stamp = $('judge-stamp'); stamp.className = 'stamp'; stamp.textContent = sc.stamp.name; stamp.style.color = stamp.style.borderColor = sc.stamp.color;
      const crits = [['Cadrage & taille', sc.cadrage, 1000], [sc.pose === 2500 ? 'Saveur étoilée' : 'Pose & dynamisme', sc.pose, 2500, sc.pose === 2500], ['Angle d\'attaque', sc.angle, 1000], ['Garniture', sc.garniture, 800]];
      $('judge-crits').innerHTML = crits.map(c => `<div class="crit"><span>${c[0]}</span><div class="bar"><i class="${c[3] ? 'special' : ''}" data-w="${c[1] / c[2] * 100}"></i></div><span class="val">0</span></div>`).join('');
      $('judge-total').innerHTML = `0 pts<small>&nbsp;</small>`;
      fernandMood = sc.tier === 'bad' ? 'angry' : sc.tier === 'great' ? 'happy' : 'talk';
      const line = FS.fernandLine(sc) + (sc.notes.length ? ' ' + sc.notes.join(' ') : '');
      $('judge-bubble').textContent = '…'; $('btn-judge-next').disabled = true;
      // animation des barres et du total, puis la réplique et le tampon
      setTimeout(() => { document.querySelectorAll('#judge-crits .bar i').forEach(b => b.style.width = b.dataset.w + '%'); }, 80);
      let shown = 0; const target = sc.total, t0 = performance.now();
      const tick = () => { const k = Math.min(1, (performance.now() - t0) / 900); shown = Math.round(target * k); $('judge-total').innerHTML = `${FS.fmt(shown)} pts<small>${sc.stamp.name}</small>`; document.querySelectorAll('#judge-crits .crit').forEach((el, j) => el.querySelector('.val').textContent = FS.fmt(crits[j][1] * k)); if (k < 1) requestAnimationFrame(tick); else { A.sfx(sc.tier === 'bad' ? 'bad' : sc.tier === 'great' ? 'great' : 'stamp'); stamp.classList.add('show'); typeText($('judge-bubble'), line, () => { $('btn-judge-next').disabled = false; }); } };
      requestAnimationFrame(tick);
      runTotal += sc.total;
      // guide : meilleur cliché par catégorie
      const g = save.guide[id] = save.guide[id] || {};
      if (!g[sc.cat] || g[sc.cat].score < sc.total) { const small = document.createElement('canvas'); small.width = 256; small.height = 144; small.getContext('2d').drawImage(p.thumb, 0, 0, 256, 144); g[sc.cat] = { score: sc.total, img: small.toDataURL('image/jpeg', 0.7), level: run.level.id, pose: p.subject.pose }; }
    };
    const finish = () => {
      save.total += runTotal; save.runs++; if (!save.best[run.level.id] || save.best[run.level.id] < runTotal) save.best[run.level.id] = runTotal;
      for (const t of FS.TOOLS) if (t.unlock > before && t.unlock <= save.total) newUnlocks.push(`Nouvel outil : ${t.name}`);
      for (const l of FS.LEVELS) if (l.unlock > before && l.unlock <= save.total) newUnlocks.push(`Nouvelle virée : ${l.name}`);
      store();
      $('judge-title').textContent = 'Verdict de la virée'; $('judge-crits').innerHTML = ''; $('judge-stamp').className = 'stamp';
      $('judge-total').innerHTML = `${FS.fmt(runTotal)} pts<small>Total cumulé : ${FS.fmt(save.total)} · Guide : ${Object.keys(save.guide).length} / ${FS.SPECIES.length} espèces</small>`;
      fernandMood = runTotal > 15000 ? 'happy' : 'talk';
      typeText($('judge-bubble'), runTotal === 0 ? FS.FERNAND.none : runTotal > 20000 ? 'Un festin ! Reviens quand tu veux, et apporte du pain.' : runTotal > 10000 ? 'Un menu correct. Il manque encore des plats signature… cherche les réactions en chaîne.' : 'Hum. On repassera. Approche-toi des bêtes et fais-les bouger, nom d\'une louche !');
      if (newUnlocks.length) { A.sfx('unlock'); $('judge-crits').innerHTML = `<div class="unlocks">${newUnlocks.map(esc).join('<br>')}</div>`; }
      $('btn-judge-next').textContent = 'Continuer'; $('btn-judge-next').disabled = false;
      $('btn-judge-next').onclick = () => { A.sfx('click'); $('btn-judge-next').textContent = 'Suivant'; run = null; openLevels(); };
    };
    $('btn-judge-next').textContent = 'Suivant'; $('btn-judge-next').onclick = () => { A.sfx('click'); next(); };
    next();
  }

  // ------------------------------------------------------------------ le Guide
  function openGuide() {
    show('guide'); const grid = $('guide-grid'); grid.innerHTML = '';
    const found = Object.keys(save.guide).length, master = FS.SPECIES.filter(s => save.guide[s.id] && save.guide[s.id][4]).length;
    $('guide-sub').textContent = `${found} / ${FS.SPECIES.length} espèces répertoriées · ${master} chef${master > 1 ? 's' : ''}-d'œuvre · ${FS.fmt(save.total)} points Fernand`;
    for (const sp of FS.SPECIES) {
      const g = save.guide[sp.id] || {}; const seen = Object.keys(g).length > 0;
      const card = document.createElement('div'); card.className = 'guide-card';
      card.innerHTML = `<h3>${seen ? esc(sp.name) : '??? ' + esc(sp.name.replace(/[^\s-]/g, '·'))}</h3><div class="home">${esc(sp.home)}</div><div class="desc">${seen ? esc(sp.desc) : 'Fernand n\'a encore rien vu passer sous sa loupe.'}</div>
        <div class="guide-slots">${FS.CATS.map(c => { const e = g[c.stars]; return `<div class="slot">${e ? `<img src="${e.img}" alt="">` : '<div class="q">?</div>'}<span class="st">${'★'.repeat(c.stars)}</span><br>${esc(c.name)}${e ? `<b>${FS.fmt(e.score)}</b>` : ''}</div>`; }).join('')}</div>
        ${seen ? `<div class="secret"><b>${g[4] ? 'Chef-d\'œuvre' : 'Rumeur de Fernand'}</b> : ${esc(sp.secret)}</div>` : ''}`;
      grid.appendChild(card);
    }
    $('btn-guide-back').onclick = () => { A.sfx('click'); show('menu'); };
  }

  // ------------------------------------------------------------------ démarrage
  initMenu(); refreshMenu(); A.setEnabled(save.sound);
  (function menuLoop() { if (current === 'menu') menuAnim(performance.now() / 1000); requestAnimationFrame(menuLoop); })();
  // Mode démo pour captures d'écran : ?demo=etage&t=40 (robot qui vise la créature la plus proche), ?screen=guide|levels
  if (params.get('demo')) {
    const lvl = FS.levelById(params.get('demo')) || FS.LEVELS[0]; show('run');
    run = new FS.Run({ level: lvl, tools: ['crouton', 'tabasco', 'clic', 'flash'], seed: 7 }); ui = { lastPhoto: null, lastPhotoT: 0, endT: 0 };
    const T = +(params.get('t') || 30); const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
    while (run.time < T) { run.update(FS.STEP); const vis = run.creatures.filter(c => c.visible && Math.abs(wrap(Math.atan2(c.x - run.cam.x, c.z - run.cam.z) - run.baseYaw)) < FS.MAX_YAW).sort((a, b) => Math.hypot(a.x - run.cam.x, a.z - run.cam.z) - Math.hypot(b.x - run.cam.x, b.z - run.cam.z)); const c = vis[0]; if (c) { run.lookTarget.yaw = wrap(Math.atan2(c.x - run.cam.x, c.z - run.cam.z) - run.baseYaw); run.lookTarget.pitch = Math.atan2(c.y + c.sp.h / 2 - run.cam.y, Math.hypot(c.x - run.cam.x, c.z - run.cam.z)); } if (params.get('special') && c && run.time > T - 3) { const b = FS.Behaviours[c.spId]; if (c.pose !== 'special') { if (c.spId === 'yeti') { b.onTabasco(c, run); b.onTabasco(c, run); } else if (['leviathan', 'olive'].includes(c.spId)) b.onClic(c, run); else if (c.spId === 'meduse') b.onFlash(c, run); } } run.takeEvents(); if (params.get('results') && run.photos.length < 40 && Math.floor(run.time * 2) !== Math.floor((run.time - FS.STEP) * 2) && c) { R.frame(gctx, run, run.time); takePhoto(); } }
    R.frame(gctx, run, run.time); R.hud(gctx, run, ui);
    if (params.get('results')) { openResults(); if (params.get('judge')) { startJudging(lastIds); for (let k = 0; k < +params.get('judge'); k++) $('btn-judge-next').onclick(); } }
  } else if (params.get('screen') === 'guide') openGuide();
  else if (params.get('screen') === 'levels') openLevels();
  else show('menu');
})(window.FS);
